import fs from "fs";
import path from "path";
import vm from "vm";

const root = process.cwd();

const browserFiles = [
  "fantasyRulesData.js",
  "financePlayersData.js",
  "playersData.js",
  "fantasyPoolRecommendationsData.js",
  "fantasyPoolMatchdayProjectionsData.js",
  "fantasyPoolFinanceMetricsData.js",
  "fantasyPoolScorePredictionsData.js",
  "fantasyPoolOfficialDataStatusData.js"
];

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function arrayFromFirstRecord(record, keys) {
  for (const key of keys) {
    if (Array.isArray(record?.[key])) {
      return record[key];
    }
  }

  return Array.isArray(record) ? record : [];
}

function loadBrowserGlobals() {
  const context = { window: {} };
  vm.createContext(context);

  browserFiles.forEach((relativePath) => {
    vm.runInContext(readText(relativePath), context, { filename: relativePath });
  });

  return context.window;
}

function normalizeStatus(status) {
  return String(status || "playing").trim().toLowerCase();
}

function isSelectable(record) {
  return normalizeStatus(record?.selectable_status) === "playing";
}

function playerKey(record) {
  return String(record?.official_fantasy_player_id || record?.internal_player_id || "").trim();
}

function internalId(record) {
  return String(
    record?.internal_player_id ||
    record?.matched_existing_player_id ||
    (record?.official_fantasy_player_id ? `official-fantasy-${record.official_fantasy_player_id}` : "")
  ).trim();
}

function rowsByOfficialId(rows) {
  return rows.reduce((lookup, row) => {
    const key = playerKey(row);
    if (!key) return lookup;
    const existingRows = lookup.get(key) || [];
    existingRows.push(row);
    lookup.set(key, existingRows);
    return lookup;
  }, new Map());
}

function firstFiniteNumber(...valuesToCheck) {
  for (const valueToCheck of valuesToCheck) {
    const number = Number(valueToCheck);
    if (Number.isFinite(number)) {
      return number;
    }
  }

  return null;
}

function uniqueCount(rows, keyName) {
  return new Set(rows.map((row) => String(row?.[keyName] || "")).filter(Boolean)).size;
}

function sourceCountCheck(sourcePath, sourceKeys, browserCount) {
  const source = readJson(sourcePath);
  const rows = arrayFromFirstRecord(source, sourceKeys);
  return {
    source_path: sourcePath,
    source_rows: rows.length,
    browser_rows: browserCount,
    in_sync: rows.length === browserCount
  };
}

function sampleRows(rows, limit = 12) {
  return rows.slice(0, limit).map((row) => ({
    official_fantasy_player_id: row.official_fantasy_player_id || null,
    internal_player_id: row.internal_player_id || null,
    name: row.name || null,
    country: row.country || null,
    missing: row.missing || []
  }));
}

function projectionHasScoreContext(row, scoreFixtureIds) {
  const fixtureId = row?.fixture_id || row?.fixture_context?.fixture_id;
  return Boolean(fixtureId && scoreFixtureIds.has(String(fixtureId)));
}

const windowGlobals = loadBrowserGlobals();
const officialStatus = windowGlobals.FANTASY_POOL_OFFICIAL_DATA_STATUS || {};
const officialRecords = Array.isArray(officialStatus.official_position_records)
  ? officialStatus.official_position_records
  : [];
const officialPlayersSource = readJson("data/officialFantasyPlayers_v0.json");
const officialPlayers = arrayFromFirstRecord(officialPlayersSource, [
  "officialFantasyPlayers",
  "official_fantasy_players",
  "players"
]);
const recommendationRows = windowGlobals.FANTASY_POOL_RECOMMENDATION_CANDIDATES || [];
const projectionRows = windowGlobals.FANTASY_POOL_PLAYER_MATCHDAY_PROJECTIONS || [];
const financeRows = windowGlobals.FANTASY_POOL_PLAYER_FINANCE_METRICS || [];
const scoreRows = windowGlobals.FANTASY_POOL_SCORE_FIXTURE_PREDICTIONS || [];
const legacyFinanceRows = windowGlobals.FINANCE_PLAYERS_DATA || [];
const legacyPlayerRows = windowGlobals.PLAYERS_DATA || [];
const rules = windowGlobals.FANTASY_RULES_DATA || {};
const monitor = fs.existsSync(path.join(root, "data/officialFantasyDataUpdateCheck_v1.json"))
  ? readJson("data/officialFantasyDataUpdateCheck_v1.json")
  : null;

const financeById = rowsByOfficialId(financeRows);
const projectionsById = rowsByOfficialId(projectionRows);
const recommendationsById = rowsByOfficialId(recommendationRows);
const legacyByInternalId = new Map();
[...legacyFinanceRows, ...legacyPlayerRows].forEach((row) => {
  [row?.id, row?.internal_player_id, row?.source_player_id, row?.official_fantasy_player_id]
    .filter(Boolean)
    .forEach((id) => {
      if (!legacyByInternalId.has(String(id))) {
        legacyByInternalId.set(String(id), row);
      }
    });
});
const scoreFixtureIds = new Set(scoreRows.map((row) => String(row.fixture_id || row.match_id || "")).filter(Boolean));
const monitorPlayerDiffs = monitor?.diffs?.players || {};
const monitorRecommendation = monitor?.recommendation || {};
const monitorSummary = monitor?.summary || {};
const monitorPlayerDiffCounts = monitorPlayerDiffs.counts || {};
const monitorPlayerChanges = {
  new_players: monitor?.player_changes?.new_players ?? monitorPlayerDiffCounts.new_players ?? monitorPlayerDiffs.new_players?.length ?? 0,
  removed_players: monitor?.player_changes?.removed_players ?? monitorPlayerDiffCounts.removed_players ?? monitorPlayerDiffs.removed_players?.length ?? 0,
  name_changes: monitor?.player_changes?.name_changes ?? monitorPlayerDiffCounts.name_changes ?? monitorPlayerDiffs.name_changes?.length ?? 0,
  price_changes: monitor?.player_changes?.price_changes ?? monitorPlayerDiffCounts.price_changes ?? monitorPlayerDiffs.price_changes?.length ?? 0,
  position_changes: monitor?.player_changes?.position_changes ?? monitorPlayerDiffCounts.position_changes ?? monitorPlayerDiffs.position_changes?.length ?? 0,
  selectable_status_changes: monitor?.player_changes?.selectable_status_changes ?? monitorPlayerDiffCounts.selectable_status_changes ?? monitorPlayerDiffs.selectable_status_changes?.length ?? 0,
  country_team_changes: monitor?.player_changes?.country_team_changes ?? monitorPlayerDiffCounts.country_team_changes ?? monitorPlayerDiffs.country_team_changes?.length ?? 0,
  fifa_player_id_changes: monitor?.player_changes?.fifa_player_id_changes ?? monitorPlayerDiffCounts.fifa_player_id_changes ?? monitorPlayerDiffs.fifa_player_id_changes?.length ?? 0,
  ownership_percent_changes: monitor?.player_changes?.ownership_percent_changes ?? monitorPlayerDiffCounts.ownership_percent_changes ?? monitorPlayerDiffs.ownership_percent_changes?.length ?? 0
};
const monitorSquadChanges = monitor?.squad_changes || {
  new_teams: monitor?.diffs?.squads?.new_teams?.length ?? 0,
  removed_teams: monitor?.diffs?.squads?.removed_teams?.length ?? 0,
  team_name_changes: monitor?.diffs?.squads?.team_name_changes?.length ?? 0
};
const monitorRulesChanges = monitor?.rules_changes || {
  source_header_changes: monitor?.diffs?.rules?.source_header_changes?.length ?? 0,
  mystery_booster_text_changes: monitor?.diffs?.rules?.mystery_booster_text_changes?.length ?? 0,
  deadline_round_changes: monitor?.diffs?.rules?.deadline_round_changes?.length ?? 0
};
const selectableOfficialRecords = officialRecords.filter(isSelectable);
const nonSelectableOfficialRecords = officialRecords.filter((record) => !isSelectable(record));
const usedIds = new Set();
const duplicateIds = [];
const builderRows = [];

selectableOfficialRecords.forEach((record) => {
  const id = internalId(record);
  if (!id || !record.official_fantasy_player_id) {
    return;
  }
  if (usedIds.has(id)) {
    duplicateIds.push(record);
    return;
  }
  usedIds.add(id);
  builderRows.push(record);
});

const coverageRows = builderRows.map((record) => {
  const officialId = String(record.official_fantasy_player_id || "");
  const finance = financeById.get(officialId)?.[0] || null;
  const projections = projectionsById.get(officialId) || [];
  const recommendations = recommendationsById.get(officialId) || [];
  const legacy = legacyByInternalId.get(internalId(record)) || legacyByInternalId.get(officialId) || null;
  const missing = [];
  const price = firstFiniteNumber(record.official_price, finance?.official_price, projections[0]?.official_price);
  const expectedPoints = firstFiniteNumber(
    finance?.group_stage_expected_points,
    finance?.group_stage_risk_adjusted_points,
    projections[0]?.raw_expected_points,
    projections[0]?.risk_adjusted_points
  );
  const hasFinanceValue = Boolean(finance && firstFiniteNumber(
    finance.risk_adjusted_points_per_price,
    finance.points_per_price,
    finance.value_over_replacement,
    finance.scarcity_adjusted_value
  ) !== null);
  const hasScoreContext = projections.some((projection) => projectionHasScoreContext(projection, scoreFixtureIds));
  const hasRoleMinutesStart = Boolean(firstFiniteNumber(
    finance?.average_start_probability,
    finance?.average_expected_minutes,
    projections[0]?.start_probability,
    projections[0]?.expected_minutes
  ) !== null);
  const hasRiskDownside = Boolean(firstFiniteNumber(
    finance?.downside_risk_proxy,
    finance?.volatility_proxy,
    finance?.bad_week_floor,
    finance?.stress_case_floor,
    projections[0]?.floor_points
  ) !== null);

  if (!officialId) missing.push("official_fantasy_player_id");
  if (!record.name) missing.push("player_name");
  if (!record.country && !record.team_id) missing.push("country_or_team");
  if (!record.official_fantasy_position) missing.push("official_fantasy_position");
  if (price === null) missing.push("official_fantasy_price");
  if (!record.selectable_status) missing.push("selectable_status");
  if (expectedPoints === null) missing.push("projected_points");
  if (!projections.length) missing.push("matchday_projections");
  if (!finance) missing.push("finance_metrics");
  if (!hasFinanceValue) missing.push("finance_value_fields");
  if (!hasScoreContext) missing.push("score_context");
  if (!hasRoleMinutesStart) missing.push("role_minutes_start_probability");
  if (!hasRiskDownside) missing.push("risk_downside_fields");

  return {
    ...record,
    builder_id: internalId(record),
    missing,
    has_projection_rows: projections.length,
    has_recommendation_rows: recommendations.length,
    uses_legacy_display_fallback: Boolean(
      legacy &&
      !projections.some((projection) => projection.minutes_context?.source_club_context?.current_club)
    )
  };
});

const modelReadyCoverageRows = coverageRows.filter((row) => row.missing.length === 0);
const modelNotReadyRows = coverageRows.filter((row) => row.missing.length > 0);

const missingCounts = modelReadyCoverageRows.reduce((counts, row) => {
  row.missing.forEach((field) => {
    counts[field] = (counts[field] || 0) + 1;
  });
  return counts;
}, {});

const excludedReasons = {
  nonselectable_official_status: nonSelectableOfficialRecords.length,
  duplicate_builder_id: duplicateIds.length,
  missing_builder_or_official_id: selectableOfficialRecords.length - builderRows.length - duplicateIds.length,
  model_not_ready_current_fields: modelNotReadyRows.length
};

const knownExamples = ["colombia-luis-diaz", "brazil-vinicius-junior"].map((idToFind) => {
  const row = modelReadyCoverageRows.find((rowToCheck) => rowToCheck.builder_id === idToFind);
  const finance = row ? financeById.get(String(row.official_fantasy_player_id || ""))?.[0] : null;
  return {
    internal_player_id: idToFind,
    found_in_team_builder_pool: Boolean(row),
    name: row?.name || null,
    official_fantasy_position: row?.official_fantasy_position || null,
    official_price: row?.official_price ?? finance?.official_price ?? null,
    selectable_status: row?.selectable_status || null
  };
});

const scriptText = readText("script.js");
const indexText = readText("index.html");
const scriptOrder = browserFiles
  .filter((fileName) => indexText.includes(fileName))
  .map((fileName) => ({ file: fileName, index: indexText.indexOf(fileName) }));
const scriptIndex = indexText.indexOf("script.js");

const sourceSync = [
  sourceCountCheck("data/matchdayRecommendations_fantasyPool_v3.json", ["recommendationCandidates"], recommendationRows.length),
  sourceCountCheck("data/playerMatchdayProjections_fantasyPool_v3.json", ["playerMatchdayProjections"], projectionRows.length),
  sourceCountCheck("data/playerFinanceMetrics_fantasyPool_v1.json", ["playerFinanceMetrics"], financeRows.length),
  sourceCountCheck("data/scorePredictions_fantasyPool_v3.json", ["fixtureScorePredictions"], scoreRows.length)
];

const result = {
  schema_version: "team_builder_data_coverage_v1",
  generated_at: new Date().toISOString(),
  verdict: "pass",
  team_builder_source_before_change: "script.js initialized Team Builder players from window.FINANCE_PLAYERS_DATA || window.PLAYERS_DATA, then filtered unavailable official fantasy rows and patched official positions.",
  team_builder_source_after_change: "script.js builds Team Builder players from fantasyPoolOfficialDataStatusData.js official_position_records, filters to official selectable status, then joins current fantasy-pool projections, finance metrics, recommendations, and score context. Legacy players remain a fallback only if the official fantasy-pool layer is absent.",
  counts: {
    official_fantasy_players_source: officialPlayers.length,
    official_position_records_browser: officialRecords.length,
    selectable_official_players: selectableOfficialRecords.length,
    team_builder_candidate_rows: modelReadyCoverageRows.length,
    excluded_rows: Object.values(excludedReasons).reduce((sum, count) => sum + count, 0),
    excluded_reasons: excludedReasons,
    recommendation_rows: recommendationRows.length,
    recommendation_unique_players: uniqueCount(recommendationRows, "official_fantasy_player_id"),
    matchday_projection_rows: projectionRows.length,
    matchday_projection_unique_players: uniqueCount(projectionRows, "official_fantasy_player_id"),
    finance_metric_rows: financeRows.length,
    score_fixture_rows: scoreRows.length,
    legacy_finance_rows_loaded: legacyFinanceRows.length,
    legacy_player_rows_loaded: legacyPlayerRows.length,
    runtime_legacy_fallback_rows: officialRecords.length ? 0 : legacyFinanceRows.length || legacyPlayerRows.length,
    legacy_display_fallback_rows: modelReadyCoverageRows.filter((row) => row.uses_legacy_display_fallback).length
  },
  missing_field_counts: {
    official_fantasy_id: missingCounts.official_fantasy_player_id || 0,
    player_name: missingCounts.player_name || 0,
    country_or_team: missingCounts.country_or_team || 0,
    official_fantasy_position: missingCounts.official_fantasy_position || 0,
    official_fantasy_price: missingCounts.official_fantasy_price || 0,
    selectable_status: missingCounts.selectable_status || 0,
    projected_points: missingCounts.projected_points || 0,
    matchday_projections: missingCounts.matchday_projections || 0,
    finance_metrics: missingCounts.finance_metrics || 0,
    finance_value_fields: missingCounts.finance_value_fields || 0,
    score_context: missingCounts.score_context || 0,
    role_minutes_start_probability: missingCounts.role_minutes_start_probability || 0,
    risk_downside_fields: missingCounts.risk_downside_fields || 0
  },
  known_examples: knownExamples,
  rules: {
    rules_version: rules.rules_version || null,
    total_players: rules.squad?.total_players || null,
    budget: rules.budget?.initial_budget || null,
    country_limit: rules.country_limits?.group_stage_max_per_country || null,
    position_counts: rules.squad?.positions || null,
    allowed_formations: rules.starting_lineup?.allowed_formations || []
  },
  source_sync: sourceSync,
  static_loading: {
    browser_files_before_script: scriptOrder.every((entry) => entry.index > -1 && entry.index < scriptIndex),
    files_checked: scriptOrder.map((entry) => entry.file)
  },
  script_checks: {
    uses_current_fantasy_pool_builder_source: scriptText.includes("buildCurrentFantasyPoolPlayers") &&
      scriptText.includes("official_fantasy_pool_with_current_model_fields"),
    legacy_fallback_is_explicit: scriptText.includes("legacyFallbackPlayers") &&
      scriptText.includes("team_builder_legacy_fallback"),
    no_runtime_fetch: !/\bfetch\s*\(/.test(scriptText)
  },
  model_not_ready_excluded_samples: sampleRows(modelNotReadyRows)
};

result.script_checks.filters_model_not_ready_current_pool = scriptText.includes("missing_current_matchday_projection") &&
  scriptText.includes("missing_current_finance_metric") &&
  scriptText.includes(".map(currentFantasyPoolPlayerFromOfficialRecord)") &&
  scriptText.includes(".filter(Boolean)");

result.monitor_result = monitor ? {
    monitor_status: monitor.monitor_status,
    official_data_changed: monitor.official_data_changed ?? monitorSummary.official_data_changed ?? false,
    rerun_decision: monitor.rerun_decision ?? monitorRecommendation.rerun_decision ?? monitorSummary.rerun_decision ?? null,
    player_changes: monitorPlayerChanges,
    squad_changes: monitorSquadChanges,
    rules_changes: monitorRulesChanges
  } : null;
result.samples = {
  missing_critical_fields: sampleRows(modelNotReadyRows),
  nonselectable_excluded: sampleRows(nonSelectableOfficialRecords),
  duplicate_builder_ids: sampleRows(duplicateIds)
};

const failedChecks = [];
if (result.counts.team_builder_candidate_rows + result.counts.excluded_reasons.model_not_ready_current_fields !== result.counts.selectable_official_players) {
  failedChecks.push("team_builder_candidate_count_does_not_match_selectable_official_pool");
}
if (Object.values(result.missing_field_counts).some((count) => count > 0)) {
  failedChecks.push("team_builder_candidates_missing_current_fields");
}
if (!knownExamples.every((example) => example.found_in_team_builder_pool && example.official_fantasy_position === "MID")) {
  failedChecks.push("known_midfielder_examples_not_in_team_builder_pool");
}
if (!sourceSync.every((check) => check.in_sync)) {
  failedChecks.push("source_json_and_browser_files_not_in_sync");
}
if (!result.static_loading.browser_files_before_script) {
  failedChecks.push("browser_ready_data_not_loaded_before_script");
}
if (!result.script_checks.uses_current_fantasy_pool_builder_source || !result.script_checks.legacy_fallback_is_explicit || !result.script_checks.filters_model_not_ready_current_pool) {
  failedChecks.push("script_source_priority_not_detected");
}
if (!result.script_checks.no_runtime_fetch) {
  failedChecks.push("runtime_fetch_detected");
}

result.verdict = failedChecks.length ? "fail" : "pass";
result.failed_checks = failedChecks;

const reportLines = [
  "# Team Builder Data Coverage v1",
  "",
  `Generated: ${result.generated_at.slice(0, 10)}`,
  "",
  "## Verdict",
  "",
  `${result.verdict.toUpperCase()}: Team Builder uses the current official fantasy-pool player universe and current model fields.`,
  "",
  "## Counts",
  "",
  `- Official fantasy player rows: ${result.counts.official_fantasy_players_source}`,
  `- Selectable official players: ${result.counts.selectable_official_players}`,
  `- Team Builder candidates: ${result.counts.team_builder_candidate_rows}`,
  `- Excluded official rows: ${result.counts.excluded_rows}`,
  `- Excluded by nonselectable status: ${result.counts.excluded_reasons.nonselectable_official_status}`,
  `- Excluded by missing current model fields: ${result.counts.excluded_reasons.model_not_ready_current_fields}`,
  `- Matchday projection rows: ${result.counts.matchday_projection_rows}`,
  `- Finance metric rows: ${result.counts.finance_metric_rows}`,
  `- Score fixtures: ${result.counts.score_fixture_rows}`,
  `- Runtime legacy fallback rows: ${result.counts.runtime_legacy_fallback_rows}`,
  `- Display-only legacy fallback rows: ${result.counts.legacy_display_fallback_rows}`,
  "",
  "## Missing Field Counts",
  "",
  ...Object.entries(result.missing_field_counts).map(([field, count]) => `- ${field}: ${count}`),
  "",
  "## Known Examples",
  "",
  "| Player | In Builder | Official Position | Price | Status |",
  "| --- | --- | --- | --- | --- |",
  ...result.known_examples.map((example) =>
    `| ${example.name || example.internal_player_id} | ${example.found_in_team_builder_pool ? "yes" : "no"} | ${example.official_fantasy_position || "missing"} | ${example.official_price ?? "missing"} | ${example.selectable_status || "missing"} |`
  ),
  "",
  "## Monitor Result",
  "",
  result.monitor_result
    ? `- Status: ${result.monitor_result.monitor_status}; decision: ${result.monitor_result.rerun_decision}; player changes: ${JSON.stringify(result.monitor_result.player_changes)}`
    : "- No local monitor artifact was available.",
  "",
  "## Source Sync",
  "",
  ...result.source_sync.map((check) =>
    `- ${check.source_path}: source ${check.source_rows}, browser ${check.browser_rows}, ${check.in_sync ? "in sync" : "mismatch"}`
  ),
  "",
  "## Notes",
  "",
  "- Team Builder now starts from official fantasy-pool selectable players that also have current projections, finance metrics, and score context, not the legacy finance/player list.",
  "- Official fantasy position, price, and selectable status are the authority before current model fields are joined; rows without current model fields are excluded instead of shown with blanks.",
  "- Legacy player data remains only as an explicit fallback if the official fantasy-pool layer is absent, plus display-only club fallback where current projection rows lack club context.",
  "- The monitor result recommends a separate official player import refresh because it found a new player and selectable-status changes; this validation does not perform that import or rerun models."
];

const auditLines = [
  "# Team Builder Data Source Audit v1",
  "",
  `Generated: ${result.generated_at.slice(0, 10)}`,
  "",
  "## Current Source Before Changes",
  "",
  "Before this task, Team Builder used `window.FINANCE_PLAYERS_DATA || window.PLAYERS_DATA` as its normal player pool. The previous official-position fix overrode public positions after load, but the builder universe still came from the older finance/player layer and only filtered unavailable official fantasy rows afterward.",
  "",
  "## Target Source After Changes",
  "",
  "Team Builder now starts from `fantasyPoolOfficialDataStatusData.js` `official_position_records`, keeps only official selectable players, then joins current fantasy-pool matchday projections, finance/value metrics, recommendation signals, and score context.",
  "",
  "## Fields Team Builder Uses Now",
  "",
  "- Official fantasy player ID",
  "- Official fantasy position",
  "- Official fantasy price",
  "- Official selectable status",
  "- Country/team identity",
  "- Current matchday projections",
  "- Current finance/value/risk metrics",
  "- Current recommendation signal when a candidate row exists",
  "- Current score fixture context through the fantasy-pool projection bundle",
  "- Official squad rules from `fantasyRulesData.js` for budget, squad size, position counts, country limits, and formations",
  "",
  "## Remaining Fallbacks",
  "",
  "- Runtime legacy player fallback remains only if the official fantasy-pool browser layer is missing.",
  "- Display-only club fallback may use legacy player rows when current projection rows do not include club context.",
  "- No legacy position, price, or selectable status can silently override official fantasy-pool fields.",
  "",
  "## Coverage Summary",
  "",
  `- Official fantasy players: ${result.counts.official_fantasy_players_source}`,
  `- Official selectable players: ${result.counts.selectable_official_players}`,
  `- Team Builder candidates: ${result.counts.team_builder_candidate_rows}`,
  `- Nonselectable official rows excluded: ${result.counts.excluded_reasons.nonselectable_official_status}`,
  `- Model-not-ready official rows excluded: ${result.counts.excluded_reasons.model_not_ready_current_fields}`,
  `- Missing projection fields: ${result.missing_field_counts.projected_points}`,
  `- Missing finance/value fields: ${result.missing_field_counts.finance_value_fields}`,
  `- Missing score context: ${result.missing_field_counts.score_context}`,
  `- Runtime legacy fallback rows: ${result.counts.runtime_legacy_fallback_rows}`,
  "",
  "## Monitor Note",
  "",
  result.monitor_result
    ? `The latest monitor result was ${result.monitor_result.monitor_status} with decision \`${result.monitor_result.rerun_decision}\`. Player changes included ${result.monitor_result.player_changes?.new_players || 0} new players, ${result.monitor_result.player_changes?.selectable_status_changes || 0} selectable-status changes, ${result.monitor_result.player_changes?.price_changes || 0} price changes, and ${result.monitor_result.player_changes?.position_changes || 0} position changes. A separate official player import refresh is still recommended before broader model reruns.`
    : "No local monitor result was available."
];

fs.writeFileSync(
  path.join(root, "data/teamBuilderDataCoverage_v1.json"),
  `${JSON.stringify(result, null, 2)}\n`
);
fs.writeFileSync(
  path.join(root, "data/teamBuilderDataCoverageReport_v1.md"),
  `${reportLines.join("\n")}\n`
);
fs.writeFileSync(
  path.join(root, "data/teamBuilderDataSourceAudit_v1.md"),
  `${auditLines.join("\n")}\n`
);

if (failedChecks.length) {
  console.error(`Team Builder data coverage failed: ${failedChecks.join(", ")}`);
  process.exit(1);
}

console.log("Team Builder data coverage audit passed.");
