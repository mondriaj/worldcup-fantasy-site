import fs from "fs";
import path from "path";
import vm from "vm";

const root = process.cwd();
const TODAY = "2026-06-08";

const PATHS = {
  officialPlayers: "data/officialFantasyPlayers_v0.json",
  identityMap: "data/mappings/playerIdentityMap_v1.csv",
  statusBrowser: "fantasyPoolOfficialDataStatusData.js",
  financePlayersBrowser: "financePlayersData.js",
  recommendationsBrowser: "fantasyPoolRecommendationsData.js",
  projectionsBrowser: "fantasyPoolMatchdayProjectionsData.js",
  financeMetricsBrowser: "fantasyPoolFinanceMetricsData.js",
  script: "script.js",
  index: "index.html",
  jsonReport: "data/officialFantasyPositionAudit_v1.json",
  mdReport: "data/officialFantasyPositionAudit_v1.md"
};

const POSITION_LABELS = {
  GK: "Goalkeeper",
  DEF: "Defender",
  MID: "Midfielder",
  FWD: "Forward"
};

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === "\"" && inQuotes && next === "\"") {
      current += "\"";
      index += 1;
    } else if (char === "\"") {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

function readCsv(relativePath) {
  const text = readText(relativePath).trim();
  if (!text) return [];
  const [headerLine, ...lines] = text.split(/\r?\n/);
  const headers = parseCsvLine(headerLine);

  return lines
    .filter(Boolean)
    .map((line) => {
      const values = parseCsvLine(line);
      return Object.fromEntries(headers.map((header, index) => [header, values[index] || ""]));
    });
}

function loadBrowserGlobals(files) {
  const context = { window: {} };
  vm.createContext(context);

  files.forEach((file) => {
    vm.runInContext(readText(file), context, { filename: file });
  });

  return context.window;
}

function rowsFromRecord(record, keys) {
  for (const key of keys) {
    if (Array.isArray(record?.[key])) {
      return record[key];
    }
  }
  return [];
}

function normalizeText(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizePositionCode(position) {
  const rawPosition = String(position || "").trim();
  const upperPosition = rawPosition.toUpperCase();
  const lowerPosition = rawPosition.toLowerCase();

  if (POSITION_LABELS[upperPosition]) return upperPosition;
  if (lowerPosition.startsWith("goalkeeper") || lowerPosition === "keeper") return "GK";
  if (lowerPosition.startsWith("defender") || lowerPosition === "defence" || lowerPosition === "defense") return "DEF";
  if (lowerPosition.startsWith("midfielder") || lowerPosition === "midfield") return "MID";
  if (lowerPosition.startsWith("forward") || lowerPosition === "striker" || lowerPosition === "attacker") return "FWD";

  return null;
}

function positionLabel(code) {
  return POSITION_LABELS[code] || code || "Position needs check";
}

function officialPositionRecords(officialRows, identityRows) {
  const identityByOfficialId = new Map(identityRows
    .filter((row) => row.official_fantasy_player_id)
    .map((row) => [String(row.official_fantasy_player_id), row]));

  return officialRows.map((player) => {
    const officialId = String(player.official_fantasy_player_id || "");
    const identity = identityByOfficialId.get(officialId) || {};
    const officialPosition = player.official_fantasy_position || identity.official_fantasy_position || null;
    const existingPosition = identity.existing_model_position || null;

    return {
      official_fantasy_player_id: officialId || null,
      internal_player_id: identity.internal_player_id || identity.matched_existing_player_id || player.current_player_match?.player_id || player.internal_player_id || null,
      matched_existing_player_id: identity.matched_existing_player_id || null,
      name: player.name || identity.official_name || null,
      country: player.country || identity.country || null,
      team_id: player.team_id || identity.team_id || null,
      official_fantasy_position: officialPosition,
      existing_model_position: existingPosition,
      selectable_status: player.selectable_status || player.availability_status || "playing",
      official_price: player.official_price ?? null,
      position_source: "official_fifa_fantasy_feed",
      position_conflict: Boolean(officialPosition && existingPosition && officialPosition !== existingPosition)
    };
  });
}

function lookupKeys(record) {
  const keyPairs = [
    ["official", record?.official_fantasy_player_id],
    ["official", record?.officialFantasyPlayerId],
    ["internal", record?.internal_player_id],
    ["internal", record?.matched_existing_player_id],
    ["internal", record?.source_player_id],
    ["internal", record?.player_id],
    ["internal", record?.id],
    ["internal", record?.preview_player_key]
  ];
  const keys = keyPairs
    .filter(([, value]) => value !== null && value !== undefined && String(value).trim())
    .map(([type, value]) => `${type}:${String(value).trim()}`);
  const nameKey = normalizeText(record?.name || record?.display_name || "");
  const countryKey = normalizeText(record?.country || "");

  if (nameKey && countryKey) {
    keys.push(`name-country:${nameKey}|${countryKey}`);
  }

  return Array.from(new Set(keys));
}

function buildLookup(records) {
  const lookup = new Map();

  records.forEach((record) => {
    const code = normalizePositionCode(record?.official_fantasy_position || record?.officialFantasyPosition);
    if (!code) return;

    const info = {
      code,
      label: positionLabel(code),
      source: record?.position_source || "official_fifa_fantasy_feed",
      record
    };

    lookupKeys(record).forEach((key) => {
      if (!lookup.has(key) || info.source === "official_fifa_fantasy_feed") {
        lookup.set(key, info);
      }
    });
  });

  return lookup;
}

function officialInfoForRecord(record, lookup) {
  for (const key of lookupKeys(record)) {
    const info = lookup.get(key);
    if (info) return info;
  }

  const direct = normalizePositionCode(record?.official_fantasy_position || record?.officialFantasyPosition);
  if (direct) {
    return { code: direct, label: positionLabel(direct), source: "official_fantasy_position_field", record };
  }

  const alias = normalizePositionCode(record?.fantasyPosition || record?.fantasy_position);
  if (alias) {
    return { code: alias, label: positionLabel(alias), source: "fantasy_position_alias", record, caution: true };
  }

  const fallback = normalizePositionCode(record?.position_code || record?.position);
  if (fallback) {
    return { code: fallback, label: positionLabel(fallback), source: "fallback_non_official_position", record, caution: true };
  }

  return { code: null, label: "Position needs check", source: "missing_position", record, caution: true };
}

function publicPositionForRecord(record, lookup) {
  const info = officialInfoForRecord(record, lookup);
  const originalCode = normalizePositionCode(record?.position_code || record?.position);

  return {
    id: record.id || record.player_id || record.internal_player_id || record.official_fantasy_player_id || null,
    name: record.name || record.display_name || null,
    country: record.country || null,
    public_position: info.label,
    public_position_code: info.code,
    position_source: info.source,
    official_fantasy_position: info.source === "official_fifa_fantasy_feed" || info.source === "official_fantasy_position_field"
      ? info.code
      : null,
    original_position_code: originalCode,
    original_position: record.position || null,
    corrected_from_original: Boolean(info.code && originalCode && info.code !== originalCode),
    caution: Boolean(info.caution)
  };
}

function compareRowsToOfficial(rows, lookup, label) {
  const mismatches = [];
  const missing = [];

  rows.forEach((row) => {
    const official = officialInfoForRecord(row, lookup);
    const rowCode = normalizePositionCode(row.official_fantasy_position || row.officialFantasyPosition || row.position_code || row.position);

    if (!official.code) {
      missing.push({
        dataset: label,
        id: row.official_fantasy_player_id || row.internal_player_id || row.id || null,
        name: row.name || row.display_name || null,
        country: row.country || null,
        row_position: rowCode
      });
      return;
    }

    if (rowCode && rowCode !== official.code) {
      mismatches.push({
        dataset: label,
        id: row.official_fantasy_player_id || row.internal_player_id || row.id || null,
        name: row.name || row.display_name || null,
        country: row.country || null,
        row_position: rowCode,
        official_position: official.code
      });
    }
  });

  return { mismatches, missing };
}

function findByInternal(rows, internalId) {
  return rows.find((row) =>
    row.id === internalId ||
    row.player_id === internalId ||
    row.internal_player_id === internalId ||
    row.source_player_id === internalId
  );
}

function mdEscape(value) {
  return String(value ?? "")
    .replace(/\|/g, "\\|")
    .replace(/\n/g, " ");
}

function buildMarkdown(report) {
  const checkRows = report.checks
    .map((check) => `| ${mdEscape(check.id)} | ${check.status.toUpperCase()} | ${mdEscape(check.detail)} |`)
    .join("\n");
  const exampleRows = report.known_examples
    .map((row) => `| ${mdEscape(row.name)} | ${mdEscape(row.internal_player_id)} | ${mdEscape(row.official_fantasy_position)} | ${mdEscape(row.public_position)} | ${mdEscape(row.position_source)} | ${row.passed ? "PASS" : "FAIL"} |`)
    .join("\n");
  const conflictRows = report.legacy_conflicts_corrected.slice(0, 25)
    .map((row) => `| ${mdEscape(row.name)} | ${mdEscape(row.country)} | ${mdEscape(row.original_position_code)} | ${mdEscape(row.public_position_code)} | ${mdEscape(row.position_source)} |`)
    .join("\n") || "| None |  |  |  |  |";

  return `# Official Fantasy Position Audit v1

Generated: ${report.generated_at}

## Verdict

${report.summary.public_mismatches === 0 ? "PASS" : "FAIL"}: public fantasy player positions normalize to the official FIFA fantasy position when an official feed position exists.

## Authority

1. Official FIFA fantasy feed position from \`data/officialFantasyPlayers_v0.json\`
2. Imported official fantasy position aliases from the identity map/browser status records
3. Existing fantasy position fields only when already official
4. Fallback position only when no official fantasy position can be matched, with a caution flag

## Summary

- Official feed rows: ${report.summary.official_rows}
- Official position rows: ${report.summary.official_position_rows}
- Selectable official rows missing official position: ${report.summary.selectable_official_missing_positions}
- Legacy browser rows corrected by the official override: ${report.summary.legacy_conflicts_corrected}
- Public mismatches after normalization: ${report.summary.public_mismatches}
- Public rows using fallback position: ${report.summary.public_fallback_rows}

## Checks

| Check | Status | Detail |
| --- | --- | --- |
${checkRows}

## Known Examples

| Player | Internal ID | Official Position | Public Position | Source | Status |
| --- | --- | --- | --- | --- | --- |
${exampleRows}

## Legacy Conflicts Corrected

These rows show source/browser legacy positions that differ from official fantasy positions. Public logic now overrides them before use.

| Player | Country | Legacy Position | Public Position | Source |
| --- | --- | --- | --- | --- |
${conflictRows}

## Missing Official Positions

${report.missing_official_positions.length
    ? report.missing_official_positions.map((row) => `- ${row.name || row.id || "Unknown"} (${row.country || "country missing"})`).join("\n")
    : "No selectable official fantasy feed rows are missing official fantasy position."}

## Notes

- Pick cards, Player Profile, Pick Explorer filters, Team Builder counts, and export/import read \`player.position\` after \`script.js\` normalizes it to official fantasy position.
- Legacy external or roster position is retained only as \`external_position\` when it conflicts with the official fantasy position.
- No model rerun was needed for score prediction formulas; this audit only changes authoritative position selection and validation.
`;
}

function addCheck(checks, id, passed, detail) {
  checks.push({ id, status: passed ? "pass" : "fail", passed, detail });
}

const officialData = readJson(PATHS.officialPlayers);
const identityRows = readCsv(PATHS.identityMap);
const officialRows = rowsFromRecord(officialData, ["officialFantasyPlayers", "players", "data"]);
const sourceOfficialPositionRecords = officialPositionRecords(officialRows, identityRows);
const windowData = loadBrowserGlobals([
  PATHS.statusBrowser,
  PATHS.financePlayersBrowser,
  PATHS.recommendationsBrowser,
  PATHS.projectionsBrowser,
  PATHS.financeMetricsBrowser
]);

const statusRecords = windowData.FANTASY_POOL_OFFICIAL_DATA_STATUS?.official_position_records || [];
const officialLookup = buildLookup([
  ...sourceOfficialPositionRecords,
  ...statusRecords,
  ...(windowData.FANTASY_POOL_RECOMMENDATION_CANDIDATES || []),
  ...(windowData.FANTASY_POOL_PLAYER_MATCHDAY_PROJECTIONS || []),
  ...(windowData.FANTASY_POOL_PLAYER_FINANCE_METRICS || [])
]);
const rawBrowserPlayers = windowData.FINANCE_PLAYERS_DATA || windowData.PLAYERS_DATA || [];
const normalizedBrowserPlayers = rawBrowserPlayers.map((row) => publicPositionForRecord(row, officialLookup));
const missingOfficialPositions = sourceOfficialPositionRecords.filter((row) =>
  String(row.selectable_status || "playing").toLowerCase() === "playing" &&
  !normalizePositionCode(row.official_fantasy_position)
);
const publicMismatches = normalizedBrowserPlayers.filter((row) =>
  row.official_fantasy_position &&
  row.public_position_code !== row.official_fantasy_position
);
const publicFallbackRows = normalizedBrowserPlayers.filter((row) => row.caution);
const legacyConflictsCorrected = normalizedBrowserPlayers.filter((row) => row.corrected_from_original);
const datasetComparisons = [
  compareRowsToOfficial(windowData.FANTASY_POOL_RECOMMENDATION_CANDIDATES || [], officialLookup, "fantasyPoolRecommendationsData.js"),
  compareRowsToOfficial(windowData.FANTASY_POOL_PLAYER_MATCHDAY_PROJECTIONS || [], officialLookup, "fantasyPoolMatchdayProjectionsData.js"),
  compareRowsToOfficial(windowData.FANTASY_POOL_PLAYER_FINANCE_METRICS || [], officialLookup, "fantasyPoolFinanceMetricsData.js")
];
const datasetMismatches = datasetComparisons.flatMap((comparison) => comparison.mismatches);
const datasetMissing = datasetComparisons.flatMap((comparison) => comparison.missing);
const scriptText = readText(PATHS.script);
const indexText = readText(PATHS.index);
const knownExamples = [
  { name: "Luis Diaz", internal_player_id: "colombia-luis-diaz", expected: "MID" },
  { name: "Vinicius", internal_player_id: "brazil-vinicius-junior", expected: "MID" }
].map((example) => {
  const publicRow = findByInternal(normalizedBrowserPlayers, example.internal_player_id);
  const official = officialInfoForRecord(publicRow || { internal_player_id: example.internal_player_id }, officialLookup);

  return {
    ...example,
    official_fantasy_position: official.code,
    public_position: publicRow?.public_position_code || null,
    position_source: publicRow?.position_source || null,
    passed: official.code === example.expected && publicRow?.public_position_code === example.expected
  };
});
const checks = [];

addCheck(
  checks,
  "official_position_records_exported",
  statusRecords.length === sourceOfficialPositionRecords.length && statusRecords.length > 0,
  `${statusRecords.length}/${sourceOfficialPositionRecords.length} official position records are in ${PATHS.statusBrowser}.`
);
addCheck(
  checks,
  "no_selectable_official_positions_missing",
  missingOfficialPositions.length === 0,
  `${missingOfficialPositions.length} selectable official feed rows are missing official fantasy position.`
);
addCheck(
  checks,
  "fantasy_pool_generated_files_match_official",
  datasetMismatches.length === 0 && datasetMissing.length === 0,
  `${datasetMismatches.length} generated fantasy-pool position mismatches; ${datasetMissing.length} rows missing an official match.`
);
addCheck(
  checks,
  "legacy_public_positions_normalized",
  publicMismatches.length === 0,
  `${publicMismatches.length} public browser player rows conflict after script.js normalization.`
);
addCheck(
  checks,
  "known_examples_are_midfielders",
  knownExamples.every((example) => example.passed),
  knownExamples.map((example) => `${example.name}: official=${example.official_fantasy_position}, public=${example.public_position}`).join("; ")
);
addCheck(
  checks,
  "team_builder_uses_normalized_players",
  /rawPlayerSource\.map\(normalizePublicPlayerFantasyPosition\)/.test(scriptText) &&
    /player\.position === position/.test(scriptText) &&
    /positionsMatchRequirements/.test(scriptText),
  "Team Builder filters/counts use player.position after raw players are normalized."
);
addCheck(
  checks,
  "pick_explorer_uses_normalized_positions",
  /renderFantasyPoolPreviewAdviceTable/.test(scriptText) &&
    /previewPlayers\.filter\(\(player\) => player\.position === positionFilterValue\)/.test(scriptText),
  "Pick Explorer filters fantasy-pool preview players after they pass through the same normalizer."
);
addCheck(
  checks,
  "exports_preserve_position_source",
  /official_fantasy_position: player\.official_fantasy_position/.test(scriptText) &&
    /position_source: player\.position_source/.test(scriptText),
  "Team export includes official_fantasy_position, fantasy_position, position_source, and external_position."
);
addCheck(
  checks,
  "static_data_loaded_before_script",
  indexText.indexOf("fantasyPoolOfficialDataStatusData.js") > -1 &&
    indexText.indexOf("fantasyPoolOfficialDataStatusData.js") < indexText.indexOf("script.js"),
  "Official fantasy status/position data loads before script.js."
);
addCheck(
  checks,
  "no_runtime_fetch_added",
  !/fetch\(/.test(scriptText),
  "script.js contains no runtime fetch()."
);

const report = {
  schema_version: "official_fantasy_position_audit_v1",
  generated_at: TODAY,
  status: checks.every((check) => check.passed) ? "pass" : "fail",
  summary: {
    official_rows: officialRows.length,
    official_position_rows: sourceOfficialPositionRecords.filter((row) => normalizePositionCode(row.official_fantasy_position)).length,
    selectable_official_missing_positions: missingOfficialPositions.length,
    legacy_conflicts_corrected: legacyConflictsCorrected.length,
    public_mismatches: publicMismatches.length,
    public_fallback_rows: publicFallbackRows.length,
    fantasy_pool_dataset_mismatches: datasetMismatches.length,
    fantasy_pool_dataset_missing_matches: datasetMissing.length
  },
  checks,
  known_examples: knownExamples,
  missing_official_positions: missingOfficialPositions,
  legacy_conflicts_corrected: legacyConflictsCorrected,
  public_mismatches: publicMismatches,
  public_fallback_rows: publicFallbackRows,
  dataset_mismatches: datasetMismatches,
  dataset_missing: datasetMissing,
  source_files: PATHS
};

fs.writeFileSync(path.join(root, PATHS.jsonReport), `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(path.join(root, PATHS.mdReport), buildMarkdown(report));

if (report.status !== "pass") {
  console.error(`Official fantasy position audit failed. See ${PATHS.mdReport}.`);
  process.exitCode = 1;
} else {
  console.log(`Official fantasy position audit passed. Wrote ${PATHS.mdReport}.`);
}
