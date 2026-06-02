import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const TODAY = "2026-06-02";

const DEFAULT_INPUT = "data/imports/officialFantasyPlayers.csv";
const OUTPUT_PLAYERS = "data/officialFantasyPlayers_v0.json";
const OUTPUT_REPORT = "data/officialFantasyImportReport_v0.json";
const CURRENT_PLAYERS = "data/players.json";

const REQUIRED_FIELDS = [
  "official_fantasy_player_id",
  "name",
  "country",
  "team_id",
  "official_fantasy_position",
  "official_price",
  "selectable_status",
  "source_url",
  "source_checked"
];

const VALID_POSITIONS = new Set(["GK", "DEF", "MID", "FWD"]);
const FIELD_ALIASES = {
  official_fantasy_player_id: [
    "official_fantasy_player_id",
    "fantasy_player_id",
    "official_player_id",
    "player_id",
    "id"
  ],
  name: ["name", "player_name", "full_name", "display_name"],
  country: ["country", "nation", "national_team", "team", "team_name"],
  team_id: ["team_id", "country_id", "national_team_id"],
  official_fantasy_position: [
    "official_fantasy_position",
    "fantasy_position",
    "position",
    "pos"
  ],
  official_price: ["official_price", "price", "cost", "value"],
  selectable_status: ["selectable_status", "status", "available", "is_selectable"],
  source_url: ["source_url", "url", "source"],
  source_checked: ["source_checked", "checked_at", "last_checked", "date_checked"],
  fifa_player_id: ["fifa_player_id"],
  shirt_number: ["shirt_number", "number"],
  club: ["club"],
  availability_status: ["availability_status", "availability"],
  injury_status: ["injury_status", "injury"],
  ownership_percent: ["ownership_percent", "selected_by_percent", "selected_by"],
  selected_by_percent: ["selected_by_percent", "ownership_percent", "selected_by"]
};

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function teamIdFromCountry(value) {
  return normalizeText(value).replace(/\s+/g, "-");
}

function hasValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function pickField(row, canonical) {
  const aliases = FIELD_ALIASES[canonical] || [canonical];
  for (const alias of aliases) {
    if (Object.prototype.hasOwnProperty.call(row, alias) && hasValue(row[alias])) {
      return row[alias];
    }
  }

  const lowerLookup = Object.fromEntries(
    Object.keys(row).map((key) => [key.toLowerCase().trim(), key])
  );

  for (const alias of aliases) {
    const found = lowerLookup[alias.toLowerCase()];
    if (found && hasValue(row[found])) {
      return row[found];
    }
  }

  return null;
}

function parseNumber(value) {
  if (!hasValue(value)) {
    return null;
  }

  const cleaned = String(value)
    .replace(/,/g, "")
    .replace(/[^\d.-]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizePosition(value) {
  const position = String(value || "").trim().toUpperCase();
  if (["GKP", "GK", "GOALKEEPER", "GOALKEEPERS"].includes(position)) return "GK";
  if (["DEF", "DEFENDER", "DEFENDERS"].includes(position)) return "DEF";
  if (["MID", "MIDFIELDER", "MIDFIELDERS"].includes(position)) return "MID";
  if (["FWD", "FOR", "FORWARD", "FORWARDS", "STRIKER", "STRIKERS"].includes(position)) return "FWD";
  return position || null;
}

function parseDelimitedLine(line, delimiter) {
  const values = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      values.push(value);
      value = "";
    } else {
      value += char;
    }
  }

  values.push(value);
  return values;
}

function parseDelimited(text) {
  const clean = text.replace(/^\uFEFF/, "").trim();
  if (!clean) return [];

  const firstLine = clean.split(/\r?\n/, 1)[0] || "";
  const delimiter = firstLine.includes("\t") ? "\t" : ",";
  const rows = clean.split(/\r?\n/).filter(Boolean).map((line) => parseDelimitedLine(line, delimiter));
  const headers = rows.shift()?.map((header) => header.trim()) || [];

  return rows.map((row) => {
    const item = {};
    headers.forEach((header, index) => {
      item[header] = row[index] === undefined ? "" : row[index].trim();
    });
    return item;
  });
}

function rowsFromJson(data) {
  if (Array.isArray(data)) return data;
  for (const key of ["officialFantasyPlayers", "players", "rows", "data"]) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function readImportRows(inputPath) {
  const raw = await readFile(inputPath, "utf8");
  const extension = path.extname(inputPath).toLowerCase();
  if (extension === ".json") {
    return rowsFromJson(JSON.parse(raw));
  }
  return parseDelimited(raw);
}

function countBy(rows, key) {
  return rows.reduce((counts, row) => {
    const value = row?.[key] ?? "null";
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}

function addToMap(map, key, value) {
  if (!key) return;
  const list = map.get(key) || [];
  list.push(value);
  map.set(key, list);
}

function currentPlayerIndexes(players) {
  const byOfficialId = new Map();
  const byTeamName = new Map();
  const byCountryName = new Map();
  const byName = new Map();
  const countryToTeamId = new Map();

  players.forEach((player) => {
    const normalizedName = normalizeText(player.name);
    const normalizedCountry = normalizeText(player.country);
    const normalizedTeamId = normalizeText(player.team_id);
    const officialId = player?.fantasy_matching?.official_fantasy_id;

    if (officialId) {
      byOfficialId.set(String(officialId), player);
    }
    addToMap(byTeamName, `${normalizedTeamId}:${normalizedName}`, player);
    addToMap(byCountryName, `${normalizedCountry}:${normalizedName}`, player);
    addToMap(byName, normalizedName, player);

    if (normalizedCountry && player.team_id) {
      countryToTeamId.set(normalizedCountry, player.team_id);
    }
  });

  return { byOfficialId, byTeamName, byCountryName, byName, countryToTeamId };
}

function uniqueMatch(candidates) {
  return candidates?.length === 1 ? candidates[0] : null;
}

function matchOfficialRow(row, indexes) {
  const warnings = [];
  const officialId = String(row.official_fantasy_player_id || "");
  const normalizedName = normalizeText(row.name);
  const normalizedCountry = normalizeText(row.country);
  const normalizedTeamId = normalizeText(row.team_id);
  const byIdMatch = indexes.byOfficialId.get(officialId);

  if (byIdMatch) {
    return {
      player_id: byIdMatch.player_id,
      match_status: "matched",
      confidence: "exact",
      method: "existing_official_fantasy_id",
      candidate_player_ids: [],
      warnings
    };
  }

  const teamNameMatches = indexes.byTeamName.get(`${normalizedTeamId}:${normalizedName}`) || [];
  const teamNameMatch = uniqueMatch(teamNameMatches);
  if (teamNameMatch) {
    return {
      player_id: teamNameMatch.player_id,
      match_status: "matched",
      confidence: "high",
      method: "team_id_and_normalized_name",
      candidate_player_ids: [],
      warnings
    };
  }

  const countryNameMatches = indexes.byCountryName.get(`${normalizedCountry}:${normalizedName}`) || [];
  const countryNameMatch = uniqueMatch(countryNameMatches);
  if (countryNameMatch) {
    return {
      player_id: countryNameMatch.player_id,
      match_status: "matched",
      confidence: "high",
      method: "country_and_normalized_name",
      candidate_player_ids: [],
      warnings
    };
  }

  const nameMatches = indexes.byName.get(normalizedName) || [];
  const nameMatch = uniqueMatch(nameMatches);
  if (nameMatch) {
    warnings.push("Matched by name only; verify country/team before merging.");
    return {
      player_id: nameMatch.player_id,
      match_status: "review",
      confidence: "medium",
      method: "normalized_name_only",
      candidate_player_ids: [],
      warnings
    };
  }

  const candidates = [...teamNameMatches, ...countryNameMatches, ...nameMatches]
    .map((player) => player.player_id);

  return {
    player_id: null,
    match_status: candidates.length ? "review" : "unmatched",
    confidence: "none",
    method: candidates.length ? "ambiguous_candidates" : "no_current_player_match",
    candidate_player_ids: [...new Set(candidates)],
    warnings: candidates.length
      ? ["Multiple possible current-player matches; manual review required."]
      : ["No current-player match found."]
  };
}

function normalizeOfficialRows(rawRows, indexes) {
  const idCounts = new Map();
  const normalized = rawRows.map((rawRow, index) => {
    const country = String(pickField(rawRow, "country") || "").trim();
    const teamId = String(pickField(rawRow, "team_id") || indexes.countryToTeamId.get(normalizeText(country)) || teamIdFromCountry(country)).trim();
    const officialId = String(pickField(rawRow, "official_fantasy_player_id") || "").trim();
    if (officialId) {
      idCounts.set(officialId, (idCounts.get(officialId) || 0) + 1);
    }

    const positionRaw = pickField(rawRow, "official_fantasy_position");
    const officialPosition = normalizePosition(positionRaw);
    const priceRaw = pickField(rawRow, "official_price");
    const officialPrice = parseNumber(priceRaw);
    const row = {
      official_fantasy_player_id: officialId || null,
      name: String(pickField(rawRow, "name") || "").trim() || null,
      country: country || null,
      team_id: teamId || null,
      official_fantasy_position: officialPosition,
      official_price: officialPrice,
      selectable_status: String(pickField(rawRow, "selectable_status") || "").trim() || null,
      source_url: String(pickField(rawRow, "source_url") || "").trim() || null,
      source_checked: String(pickField(rawRow, "source_checked") || "").trim() || null,
      fifa_player_id: String(pickField(rawRow, "fifa_player_id") || "").trim() || null,
      shirt_number: String(pickField(rawRow, "shirt_number") || "").trim() || null,
      club: String(pickField(rawRow, "club") || "").trim() || null,
      availability_status: String(pickField(rawRow, "availability_status") || "").trim() || null,
      injury_status: String(pickField(rawRow, "injury_status") || "").trim() || null,
      ownership_percent: parseNumber(pickField(rawRow, "ownership_percent")),
      selected_by_percent: parseNumber(pickField(rawRow, "selected_by_percent")),
      raw_row_index: index + 2,
      validation_errors: [],
      validation_warnings: []
    };

    REQUIRED_FIELDS.forEach((field) => {
      if (!hasValue(row[field])) {
        row.validation_errors.push(`Missing required field: ${field}.`);
      }
    });

    if (hasValue(priceRaw) && row.official_price === null) {
      row.validation_errors.push("official_price is present but is not numeric.");
    }

    if (row.official_fantasy_position && !VALID_POSITIONS.has(row.official_fantasy_position)) {
      row.validation_errors.push(`official_fantasy_position is not recognized: ${row.official_fantasy_position}.`);
    }

    row.current_player_match = matchOfficialRow(row, indexes);
    row.current_player_match.warnings.forEach((warning) => row.validation_warnings.push(warning));

    return row;
  });

  normalized.forEach((row) => {
    if (row.official_fantasy_player_id && idCounts.get(row.official_fantasy_player_id) > 1) {
      row.validation_errors.push(`Duplicate official_fantasy_player_id: ${row.official_fantasy_player_id}.`);
    }
  });

  return normalized;
}

function buildSummary(rows) {
  const errorRows = rows.filter((row) => row.validation_errors.length);
  const reviewRows = rows.filter((row) => row.current_player_match.match_status === "review");
  const unmatchedRows = rows.filter((row) => row.current_player_match.match_status === "unmatched");
  const matchedRows = rows.filter((row) => row.current_player_match.match_status === "matched");

  return {
    imported_rows: rows.length,
    matched_rows: matchedRows.length,
    review_rows: reviewRows.length,
    unmatched_rows: unmatchedRows.length,
    error_rows: errorRows.length,
    official_price_rows: rows.filter((row) => hasValue(row.official_price)).length,
    official_position_rows: rows.filter((row) => VALID_POSITIONS.has(row.official_fantasy_position)).length,
    selectable_status_counts: countBy(rows, "selectable_status"),
    match_method_counts: countBy(rows.map((row) => row.current_player_match), "method")
  };
}

function importStatus(summary) {
  if (summary.imported_rows === 0) return "no_rows_imported";
  if (summary.error_rows > 0) return "imported_with_errors";
  if (summary.review_rows > 0 || summary.unmatched_rows > 0) return "imported_needs_manual_review";
  return "imported_ready_for_readiness_check";
}

function reportFromRows(inputPath, rows, currentPlayerCount) {
  const summary = buildSummary(rows);
  const status = importStatus(summary);
  const manualReviewRows = rows
    .filter((row) =>
      row.validation_errors.length ||
      ["review", "unmatched"].includes(row.current_player_match.match_status)
    )
    .map((row) => ({
      official_fantasy_player_id: row.official_fantasy_player_id,
      name: row.name,
      country: row.country,
      team_id: row.team_id,
      official_fantasy_position: row.official_fantasy_position,
      official_price: row.official_price,
      match_status: row.current_player_match.match_status,
      match_method: row.current_player_match.method,
      matched_player_id: row.current_player_match.player_id,
      candidate_player_ids: row.current_player_match.candidate_player_ids,
      validation_errors: row.validation_errors,
      validation_warnings: row.validation_warnings
    }));

  return {
    schema_version: "official_fantasy_import_report_v0",
    generated_at: TODAY,
    source_checked: TODAY,
    status,
    input_file: inputPath,
    current_player_rows_checked: currentPlayerCount,
    summary,
    blocking_issues: rows.flatMap((row) =>
      row.validation_errors.map((error) => ({
        official_fantasy_player_id: row.official_fantasy_player_id,
        name: row.name,
        row: row.raw_row_index,
        error
      }))
    ),
    manual_review_rows: manualReviewRows,
    next_actions: status === "imported_ready_for_readiness_check"
      ? [
        "Review coverage against the official fantasy game player count.",
        "Run node scripts/validateOfficialDataReadiness.mjs.",
        "Regenerate value and finance models only after official rules and final squads are also imported."
      ]
      : [
        "Fix validation errors first.",
        "Resolve review and unmatched rows manually.",
        "Do not merge official prices or positions into active models until coverage passes."
      ]
  };
}

function waitingReport(inputPath, currentPlayerCount) {
  return {
    schema_version: "official_fantasy_import_report_v0",
    generated_at: TODAY,
    source_checked: TODAY,
    status: "awaiting_official_input",
    input_file: inputPath,
    current_player_rows_checked: currentPlayerCount,
    required_fields: REQUIRED_FIELDS,
    accepted_input_formats: ["csv", "tsv", "json"],
    template_file: "data/imports/officialFantasyPlayers_TEMPLATE.csv",
    output_files_when_input_exists: [
      OUTPUT_PLAYERS,
      OUTPUT_REPORT
    ],
    next_actions: [
      "Download the official fantasy player list when available.",
      "Save it as data/imports/officialFantasyPlayers.csv or pass --input path/to/file.csv.",
      "Run node scripts/importOfficialFantasyPlayers.mjs.",
      "Review data/officialFantasyImportReport_v0.json before any model rerun."
    ],
    safeguards: [
      "No official values are invented.",
      "official_price remains null when missing or invalid.",
      "official_fantasy_position is validated against GK, DEF, MID, and FWD.",
      "Name-only matches are marked for manual review."
    ]
  };
}

async function main() {
  const inputPath = argValue("--input") || DEFAULT_INPUT;
  const currentPlayersData = await readJson(CURRENT_PLAYERS);
  const currentPlayers = currentPlayersData.players || [];
  const indexes = currentPlayerIndexes(currentPlayers);

  if (!(await fileExists(inputPath))) {
    const report = waitingReport(inputPath, currentPlayers.length);
    await writeFile(OUTPUT_REPORT, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    console.log(`${OUTPUT_REPORT}: ${report.status}`);
    console.log(`waiting for input: ${inputPath}`);
    return;
  }

  const rawRows = await readImportRows(inputPath);
  const rows = normalizeOfficialRows(rawRows, indexes);
  const report = reportFromRows(inputPath, rows, currentPlayers.length);
  const output = {
    schema_version: "official_fantasy_players_v0",
    generated_at: TODAY,
    source_checked: TODAY,
    data_status: report.status,
    input_file: inputPath,
    summary: report.summary,
    officialFantasyPlayers: rows
  };

  await writeFile(OUTPUT_PLAYERS, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  await writeFile(OUTPUT_REPORT, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`${OUTPUT_PLAYERS}: ${report.status}`);
  console.log(`${OUTPUT_REPORT}: ${report.summary.imported_rows} rows, ${report.summary.review_rows} review, ${report.summary.error_rows} errors`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
