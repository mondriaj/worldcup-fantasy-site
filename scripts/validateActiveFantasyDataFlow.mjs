import fs from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const ACTIVE_VERSION = "20260628-r32-final";
const ACTIVE_MATCHDAY_ID = "r32";
const ACTIVE_MATCHDAY_LABEL = "R32";
const REQUIRED_SCRIPT_ORDER = [
  "playersData.js",
  "fantasyRulesData.js",
  "fantasyPoolRecommendationsData.js",
  "fantasyPoolMatchdayProjectionsData.js",
  "fantasyPoolFinanceMetricsData.js",
  "fantasyPoolScorePredictionsData.js",
  "knockoutScorePredictorData.js",
  "bracketPoolStrategyData.js",
  "fantasyPoolOfficialDataStatusData.js",
  "liveMatchdayStatusData.js",
  "livePlayerStatusData.js",
  "script.js"
];
const ACTIVE_BROWSER_DATA_FILES = REQUIRED_SCRIPT_ORDER.filter((file) => file !== "script.js");
const ACTIVE_OFFICIAL_UNIVERSE_FIELD = "official_position_records";
const LEGACY_PUBLIC_FILES = [
  "financePlayersData.js",
  "matchdayProjectionsData.js",
  "scorePredictionsData.js"
];
const STALE_STRINGS = [
  "20260603",
  "official-final",
  "20260603-official-final"
];
const OLD_GLOBAL_READS = [
  "window.FINANCE_PLAYERS_DATA",
  "window.PLAYER_MATCHDAY_PROJECTIONS_DATA",
  "window.MATCHDAY_MODEL_SUMMARY",
  "window.FINANCE_MODEL_SUMMARY",
  "window.SCORE_FIXTURE_PREDICTIONS_DATA",
  "window.SCORE_PREDICTIONS_SUMMARY"
];
const PUBLIC_FALLBACK_REFERENCES = [
  "scorePredictionsData.js",
  "data/scorePredictions_v2.json",
  "financePlayersData.js",
  "matchdayProjectionsData.js"
];
const POSITION_CODES = ["GK", "DEF", "MID", "FWD"];
const NUMERIC_FIELD_PATHS = [
  "raw_expected_points",
  "risk_adjusted_points",
  "ceiling_points",
  "floor_points",
  "start_probability",
  "expected_minutes",
  "fixture_context.expected_goals",
  "fixture_context.expected_goals_against",
  "fixture_context.clean_sheet_probability",
  "fixture_context.win_probability",
  "total_expected_goals",
  "home_expected_goals",
  "away_expected_goals",
  "expected_goals",
  "home_projected_xg",
  "away_projected_xg",
  "homeMatchXg",
  "awayMatchXg",
  "home_match_xg",
  "away_match_xg",
  "homeXgBase",
  "awayXgBase",
  "home_xg_base",
  "away_xg_base",
  "group_stage_expected_points",
  "group_stage_risk_adjusted_points",
  "average_start_probability",
  "average_expected_minutes"
];

function projectPath(relativePath) {
  return path.join(root, relativePath);
}

function readText(relativePath) {
  return fs.readFileSync(projectPath(relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function exists(relativePath) {
  return fs.existsSync(projectPath(relativePath));
}

function rowsFrom(data, keys = []) {
  if (Array.isArray(data)) {
    return data;
  }

  for (const key of keys) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }

  return [];
}

function sorted(values) {
  return [...values].sort((a, b) => String(a).localeCompare(String(b)));
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean).map(String)));
}

function sample(values, limit = 12) {
  return values.slice(0, limit);
}

function addFailure(report, id, message, detail = {}) {
  report.failures.push({ id, message, detail });
}

function addWarning(report, id, message, detail = {}) {
  report.warnings.push({ id, message, detail });
}

function addCheck(report, id, status, detail = {}) {
  report.checks.push({ id, status, detail });
}

function scriptBaseName(src) {
  return path.basename(String(src || "").split("?")[0]);
}

function parseScriptSources(indexHtml) {
  return Array.from(indexHtml.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi))
    .map((match) => ({
      src: match[1],
      file: scriptBaseName(match[1])
    }));
}

function loadBrowserGlobals(files = ACTIVE_BROWSER_DATA_FILES) {
  const context = { window: {} };
  vm.createContext(context);

  files.forEach((relativePath) => {
    vm.runInContext(readText(relativePath), context, { filename: relativePath });
  });

  return context.window;
}

function recordIdentityValues(record) {
  return unique([
    record?.id,
    record?.player_id,
    record?.internal_player_id,
    record?.matched_existing_player_id,
    record?.source_player_id,
    record?.official_fantasy_player_id,
    record?.officialFantasyPlayerId,
    record?.preview_player_key
  ]);
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function nameCountryKey(record) {
  const name = normalizeText(record?.name || record?.display_name);
  const country = normalizeText(record?.country || record?.team || record?.team_id);
  return name && country ? `${name}|${country}` : "";
}

function identityUniverse(rows) {
  const ids = new Set();
  const nameCountry = new Set();

  rows.forEach((row) => {
    recordIdentityValues(row).forEach((id) => ids.add(id));
    const key = nameCountryKey(row);
    if (key) {
      nameCountry.add(key);
    }
  });

  return { ids, nameCountry };
}

function resolvesToUniverse(record, universe) {
  const ids = recordIdentityValues(record);
  if (ids.some((id) => universe.ids.has(id))) {
    return true;
  }

  const key = nameCountryKey(record);
  return Boolean(key && universe.nameCountry.has(key));
}

function entityKey(record) {
  return String(
    record?.official_fantasy_player_id ||
    record?.internal_player_id ||
    record?.player_id ||
    record?.id ||
    nameCountryKey(record)
  ).trim();
}

function officialFantasyId(record) {
  return String(record?.official_fantasy_player_id || record?.officialFantasyPlayerId || "").trim();
}

function activeOfficialRecordsFromStatus(officialStatus) {
  return rowsFrom(officialStatus?.[ACTIVE_OFFICIAL_UNIVERSE_FIELD], [ACTIVE_OFFICIAL_UNIVERSE_FIELD]);
}

function buildActiveIdentity(officialRecords) {
  const officialIds = new Set();
  const duplicateOfficialIds = new Set();
  const byIdentity = new Map();
  const bySlug = new Map();

  officialRecords.forEach((record) => {
    const officialId = officialFantasyId(record);

    if (officialId) {
      if (officialIds.has(officialId)) {
        duplicateOfficialIds.add(officialId);
      }
      officialIds.add(officialId);
    }

    recordIdentityValues(record).forEach((identityValue) => {
      if (officialId && !byIdentity.has(identityValue)) {
        byIdentity.set(identityValue, officialId);
      }
    });

    const slug = nameCountryKey(record);
    if (officialId && slug && !bySlug.has(slug)) {
      bySlug.set(slug, officialId);
    }
  });

  return {
    officialRecords,
    officialIds,
    duplicateOfficialIds: sorted([...duplicateOfficialIds]),
    byIdentity,
    bySlug,
    universe: identityUniverse(officialRecords)
  };
}

function activeOfficialIdForRecord(record, activeIdentity) {
  for (const identityValue of recordIdentityValues(record)) {
    const resolvedOfficialId = activeIdentity.byIdentity.get(identityValue);
    if (resolvedOfficialId) {
      return resolvedOfficialId;
    }
  }

  const slug = nameCountryKey(record);
  return slug ? activeIdentity.bySlug.get(slug) || "" : "";
}

function rowsMissingActiveIdentity(rows, activeIdentity) {
  return rows.filter((row) => !activeOfficialIdForRecord(row, activeIdentity));
}

function resolvedOfficialIdSet(rows, activeIdentity) {
  return new Set(rows
    .map((row) => activeOfficialIdForRecord(row, activeIdentity))
    .filter(Boolean));
}

function matchdayId(record) {
  return String(record?.fantasy_matchday_id || record?.matchday || record?.matchday_id || "").trim();
}

function projectionKey(record) {
  return `${entityKey(record)}|${matchdayId(record)}`;
}

function positionCode(record) {
  const raw = String(record?.official_fantasy_position || record?.position_code || record?.position || "").trim().toUpperCase();
  if (POSITION_CODES.includes(raw)) {
    return raw;
  }

  if (raw.startsWith("GOALKEEPER")) return "GK";
  if (raw.startsWith("DEFENDER")) return "DEF";
  if (raw.startsWith("MIDFIELDER")) return "MID";
  if (raw.startsWith("FORWARD")) return "FWD";
  return "";
}

function selectableStatus(record) {
  return String(record?.selectable_status || "playing").trim().toLowerCase();
}

function isSelectable(record) {
  return selectableStatus(record) === "playing";
}

function numberAtPath(record, fieldPath) {
  return fieldPath.split(".").reduce((value, key) => value?.[key], record);
}

function validateFiniteNumbers(rows, rowType) {
  const invalid = [];

  rows.forEach((row, index) => {
    NUMERIC_FIELD_PATHS.forEach((fieldPath) => {
      const rawValue = numberAtPath(row, fieldPath);
      if (rawValue === null || rawValue === undefined || rawValue === "") {
        return;
      }

      if (typeof rawValue === "object") {
        return;
      }

      const number = Number(rawValue);
      if (!Number.isFinite(number)) {
        invalid.push({
          row_type: rowType,
          index,
          field: fieldPath,
          value: String(rawValue),
          id: entityKey(row) || row?.fixture_id || null,
          name: row?.name || row?.fixture || null
        });
      }
    });
  });

  return invalid;
}

function compareIdSets(sourceRows, browserRows) {
  const sourceIds = new Set(sourceRows.map((row) => String(row?.id || "")).filter(Boolean));
  const browserIds = new Set(browserRows.map((row) => String(row?.id || "")).filter(Boolean));
  const missingInBrowser = sorted([...sourceIds].filter((id) => !browserIds.has(id)));
  const missingInSource = sorted([...browserIds].filter((id) => !sourceIds.has(id)));

  return {
    source_id_count: sourceIds.size,
    browser_id_count: browserIds.size,
    missing_in_browser: missingInBrowser,
    missing_in_source: missingInSource,
    in_sync: missingInBrowser.length === 0 && missingInSource.length === 0
  };
}

function verifyPublicScripts(report, indexHtml, scriptJs) {
  const scriptSources = parseScriptSources(indexHtml);
  const localScriptFiles = scriptSources
    .map((script) => script.file)
    .filter((file) => !/^https?:/i.test(file));
  const localOrder = localScriptFiles.filter((file) => REQUIRED_SCRIPT_ORDER.includes(file) || LEGACY_PUBLIC_FILES.includes(file));
  const requiredIndexes = REQUIRED_SCRIPT_ORDER.map((file) => localScriptFiles.indexOf(file));
  const missingRequired = REQUIRED_SCRIPT_ORDER.filter((file, index) => requiredIndexes[index] === -1);
  const isRequiredOrderValid = missingRequired.length === 0 &&
    requiredIndexes.every((index, arrayIndex) => arrayIndex === 0 || requiredIndexes[arrayIndex - 1] < index);
  const loadedLegacyFiles = localScriptFiles.filter((file) => LEGACY_PUBLIC_FILES.includes(file));
  const stalePublicVersionStrings = [];
  const oldGlobalReadHits = [];
  const oldPublicFallbackReferences = [];

  if (missingRequired.length) {
    addFailure(report, "required_scripts_missing", "Required active browser scripts are missing from index.html.", { missing: missingRequired });
  }

  if (!isRequiredOrderValid) {
    addFailure(report, "required_scripts_order", "Required active browser scripts are not loaded in the R32 active-path order.", {
      expected: REQUIRED_SCRIPT_ORDER,
      actual_relevant_order: localOrder
    });
  }

  if (loadedLegacyFiles.length) {
    addFailure(report, "legacy_public_scripts_loaded", "index.html loads legacy public model browser files.", { loaded_legacy_files: loadedLegacyFiles });
  }

  for (const file of ACTIVE_BROWSER_DATA_FILES) {
    if (!exists(file)) {
      addFailure(report, "active_browser_data_file_missing", `Required active browser data file is missing: ${file}`, { file });
    }
  }

  STALE_STRINGS.forEach((staleString) => {
    const locations = [];
    if (indexHtml.includes(staleString)) locations.push("index.html");
    if (scriptJs.includes(staleString)) locations.push("script.js");
    if (locations.length) {
      stalePublicVersionStrings.push({ stale_string: staleString, locations });
      addFailure(report, "stale_public_version_string", `Stale cache/version string remains in public files: ${staleString}`, { stale_string: staleString, locations });
    }
  });

  OLD_GLOBAL_READS.forEach((oldGlobal) => {
    if (scriptJs.includes(oldGlobal)) {
      oldGlobalReadHits.push(oldGlobal);
      addFailure(report, "old_public_global_read", `script.js reads old public data global: ${oldGlobal}`, { old_global: oldGlobal });
    }
  });

  PUBLIC_FALLBACK_REFERENCES.forEach((reference) => {
    if (scriptJs.includes(reference)) {
      oldPublicFallbackReferences.push(reference);
      addFailure(report, "old_public_fallback_reference", `script.js contains old public fallback reference: ${reference}`, { reference });
    }
  });

  const detail = {
    expected: REQUIRED_SCRIPT_ORDER,
    actual_relevant_order: localOrder,
    loaded_legacy_files: loadedLegacyFiles,
    stale_public_version_strings: stalePublicVersionStrings,
    old_global_reads: oldGlobalReadHits,
    old_public_fallback_references: oldPublicFallbackReferences,
    passed: isRequiredOrderValid &&
      !missingRequired.length &&
      !loadedLegacyFiles.length &&
      !stalePublicVersionStrings.length &&
      !oldGlobalReadHits.length &&
      !oldPublicFallbackReferences.length
  };

  addCheck(report, "public_stale_path_block", detail.passed ? "pass" : "fail", detail);
  return detail;
}

function verifySourceSync(report, windowGlobals) {
  const sourcePlayers = readJson("players.json");
  const browserPlayers = rowsFrom(windowGlobals.PLAYERS_DATA, ["players"]);
  const sourcePlayerRows = rowsFrom(sourcePlayers, ["players"]);
  const idComparison = compareIdSets(sourcePlayerRows, browserPlayers);
  const playerSync = {
    source_count: sourcePlayerRows.length,
    browser_count: browserPlayers.length,
    count_in_sync: sourcePlayerRows.length === browserPlayers.length,
    id_comparison: {
      ...idComparison,
      missing_in_browser: sample(idComparison.missing_in_browser),
      missing_in_source: sample(idComparison.missing_in_source),
      missing_in_browser_count: idComparison.missing_in_browser.length,
      missing_in_source_count: idComparison.missing_in_source.length
    }
  };

  if (!playerSync.count_in_sync || !idComparison.in_sync) {
    addFailure(report, "players_source_browser_sync", "players.json and playersData.js are not in sync.", playerSync);
  }

  const sourceRules = readJson("fantasyRules.json");
  const browserRules = windowGlobals.FANTASY_RULES_DATA || {};
  const sourceRuleKeys = sorted(Object.keys(sourceRules));
  const browserRuleKeys = sorted(Object.keys(browserRules));
  const missingRuleKeysInBrowser = sourceRuleKeys.filter((key) => !browserRuleKeys.includes(key));
  const extraRuleKeysInBrowser = browserRuleKeys.filter((key) => !sourceRuleKeys.includes(key));
  const metadataKeys = ["rules_version", "rules_status", "source_checked", "public_status"];
  const metadataMismatches = metadataKeys
    .filter((key) => sourceRules[key] !== undefined || browserRules[key] !== undefined)
    .filter((key) => JSON.stringify(sourceRules[key]) !== JSON.stringify(browserRules[key]))
    .map((key) => ({ key, source: sourceRules[key] ?? null, browser: browserRules[key] ?? null }));
  const rulesSync = {
    source_top_level_keys: sourceRuleKeys,
    browser_top_level_keys: browserRuleKeys,
    missing_keys_in_browser: missingRuleKeysInBrowser,
    extra_keys_in_browser: extraRuleKeysInBrowser,
    metadata_mismatches: metadataMismatches,
    in_sync: missingRuleKeysInBrowser.length === 0 && extraRuleKeysInBrowser.length === 0 && metadataMismatches.length === 0
  };

  if (!rulesSync.in_sync) {
    addFailure(report, "rules_source_browser_sync", "fantasyRules.json and fantasyRulesData.js are not in sync.", rulesSync);
  }

  addCheck(report, "players_json_players_data_sync", playerSync.count_in_sync && idComparison.in_sync ? "pass" : "fail", playerSync);
  addCheck(report, "fantasy_rules_json_browser_sync", rulesSync.in_sync ? "pass" : "fail", rulesSync);

  return { sourcePlayerRows, browserPlayers, sourceRules, browserRules, playerSync, rulesSync };
}

function verifyActiveGlobals(report, windowGlobals) {
  const recommendationRows = rowsFrom(windowGlobals.FANTASY_POOL_RECOMMENDATION_CANDIDATES, ["recommendationCandidates"]);
  const projectionRows = rowsFrom(windowGlobals.FANTASY_POOL_PLAYER_MATCHDAY_PROJECTIONS, ["playerMatchdayProjections"]);
  const financeRows = rowsFrom(windowGlobals.FANTASY_POOL_PLAYER_FINANCE_METRICS, ["playerFinanceMetrics"]);
  const scoreData = windowGlobals.FANTASY_POOL_SCORE_PREDICTIONS_DATA || {};
  const scoreRows = rowsFrom(windowGlobals.FANTASY_POOL_SCORE_FIXTURE_PREDICTIONS, ["fixtureScorePredictions"]).length
    ? rowsFrom(windowGlobals.FANTASY_POOL_SCORE_FIXTURE_PREDICTIONS, ["fixtureScorePredictions"])
    : rowsFrom(scoreData.fixtureScorePredictions, ["fixtureScorePredictions"]);
  const teamScoreRows = rowsFrom(windowGlobals.FANTASY_POOL_TEAM_FIXTURE_PREDICTIONS, ["teamFixturePredictions"]).length
    ? rowsFrom(windowGlobals.FANTASY_POOL_TEAM_FIXTURE_PREDICTIONS, ["teamFixturePredictions"])
    : rowsFrom(scoreData.teamFixturePredictions, ["teamFixturePredictions"]);
  const officialStatus = windowGlobals.FANTASY_POOL_OFFICIAL_DATA_STATUS || null;
  const officialRecords = activeOfficialRecordsFromStatus(officialStatus);
  const liveMatchday = windowGlobals.LIVE_MATCHDAY_STATUS_DATA || null;
  const livePlayer = windowGlobals.LIVE_PLAYER_STATUS_DATA || null;
  const bracketPoolStrategyData = windowGlobals.BRACKET_POOL_STRATEGY_DATA || null;

  const requiredGlobals = [
    ["FANTASY_POOL_RECOMMENDATION_CANDIDATES", recommendationRows.length > 0],
    ["FANTASY_POOL_PLAYER_MATCHDAY_PROJECTIONS", projectionRows.length > 0],
    ["FANTASY_POOL_PLAYER_FINANCE_METRICS", financeRows.length > 0],
    ["FANTASY_POOL_SCORE_PREDICTIONS", scoreRows.length > 0],
    ["BRACKET_POOL_STRATEGY_DATA", Boolean(bracketPoolStrategyData?.strategies?.length)],
    ["FANTASY_POOL_OFFICIAL_DATA_STATUS", Boolean(officialStatus)],
    [`FANTASY_POOL_OFFICIAL_DATA_STATUS.${ACTIVE_OFFICIAL_UNIVERSE_FIELD}`, officialRecords.length > 0],
    ["LIVE_MATCHDAY_STATUS_DATA", Boolean(liveMatchday)],
    ["LIVE_PLAYER_STATUS_DATA", Boolean(livePlayer)]
  ];

  requiredGlobals.forEach(([name, ok]) => {
    if (!ok) {
      addFailure(report, "active_global_missing_or_empty", `Active browser global is missing or empty: ${name}`, { global: name });
    }
  });

  const activeCounts = {
    recommendation_rows: recommendationRows.length,
    projection_rows: projectionRows.length,
    finance_rows: financeRows.length,
    score_fixture_rows: scoreRows.length,
    score_team_fixture_rows: teamScoreRows.length,
    bracket_pool_strategy_count: bracketPoolStrategyData?.strategies?.length || 0,
    bracket_pool_team_metric_count: bracketPoolStrategyData?.team_metrics?.length || 0,
    [ACTIVE_OFFICIAL_UNIVERSE_FIELD]: officialRecords.length,
    live_fixture_rows: liveMatchday?.fixtures?.length || 0,
    live_player_rows: livePlayer?.players?.length || 0
  };
  addCheck(report, "active_browser_globals_loaded", requiredGlobals.every(([, ok]) => ok) ? "pass" : "fail", activeCounts);

  return {
    recommendationRows,
    projectionRows,
    financeRows,
    scoreRows,
    teamScoreRows,
    officialStatus,
    officialRecords,
    liveMatchday,
    livePlayer,
    bracketPoolStrategyData,
    activeCounts
  };
}

function verifyActiveIdentity(report, active, browserPlayers, activeIdentity) {
  const officialRecords = activeIdentity.officialRecords;
  const missingOfficialIdRecords = officialRecords.filter((row) => !officialFantasyId(row));
  const playersDataUniverse = identityUniverse(browserPlayers);
  const selectableRecords = officialRecords.filter(isSelectable);
  const selectablePositionCounts = POSITION_CODES.reduce((counts, position) => {
    counts[position] = selectableRecords.filter((row) => positionCode(row) === position).length;
    return counts;
  }, {});
  const recommendationMissing = rowsMissingActiveIdentity(active.recommendationRows, activeIdentity);
  const projectionMissing = rowsMissingActiveIdentity(active.projectionRows, activeIdentity);
  const financeMissing = rowsMissingActiveIdentity(active.financeRows, activeIdentity);
  const projectionOfficialIds = resolvedOfficialIdSet(active.projectionRows, activeIdentity);
  const financeOfficialIds = resolvedOfficialIdSet(active.financeRows, activeIdentity);
  const projectionsWithoutFinance = sorted([...projectionOfficialIds].filter((id) => !financeOfficialIds.has(id)));
  const financeWithoutProjections = sorted([...financeOfficialIds].filter((id) => !projectionOfficialIds.has(id)));
  const playersDataResolvedRecords = officialRecords.filter((row) => resolvesToUniverse(row, playersDataUniverse));
  const enrichmentCoverage = {
    identity_role: "supplemental_enrichment_only",
    active_official_fantasy_players: officialRecords.length,
    players_data_rows: browserPlayers.length,
    active_players_resolving_to_players_data: playersDataResolvedRecords.length,
    active_players_not_resolving_to_players_data: officialRecords.length - playersDataResolvedRecords.length,
    coverage_percent: officialRecords.length
      ? Number(((playersDataResolvedRecords.length / officialRecords.length) * 100).toFixed(2))
      : 0
  };

  if (!officialRecords.length) {
    addFailure(report, "active_official_fantasy_universe_missing", "The active official fantasy player universe is missing or empty.", {
      field: ACTIVE_OFFICIAL_UNIVERSE_FIELD
    });
  }

  if (activeIdentity.duplicateOfficialIds.length) {
    addFailure(report, "active_official_fantasy_duplicate_ids", "The active official fantasy pool has duplicate official fantasy player IDs.", {
      duplicate_official_fantasy_player_ids: activeIdentity.duplicateOfficialIds
    });
  }

  if (missingOfficialIdRecords.length) {
    addFailure(report, "active_official_fantasy_missing_ids", "The active official fantasy pool has rows missing official fantasy player IDs.", {
      missing_count: missingOfficialIdRecords.length,
      sample: sample(missingOfficialIdRecords.map((row) => ({ name: row.name || null, country: row.country || null })))
    });
  }

  if (recommendationMissing.length) {
    addFailure(report, "recommendations_missing_active_official_identity", "Some fantasyPool recommendation rows do not resolve to the active official fantasy pool.", {
      missing_count: recommendationMissing.length,
      sample: sample(recommendationMissing.map((row) => ({
        id: entityKey(row),
        name: row.name || null,
        country: row.country || null,
        matchday: matchdayId(row) || null
      })))
    });
  }

  if (projectionMissing.length) {
    addFailure(report, "projections_missing_active_official_identity", "Some fantasyPool projection rows do not resolve to the active official fantasy pool.", {
      missing_count: projectionMissing.length,
      sample: sample(projectionMissing.map((row) => ({
        id: entityKey(row),
        name: row.name || null,
        country: row.country || null,
        matchday: matchdayId(row) || null
      })))
    });
  }

  if (financeMissing.length) {
    addFailure(report, "finance_missing_active_official_identity", "Some fantasyPool finance rows do not resolve to the active official fantasy pool.", {
      missing_count: financeMissing.length,
      sample: sample(financeMissing.map((row) => ({
        id: entityKey(row),
        name: row.name || null,
        country: row.country || null
      })))
    });
  }

  if (projectionsWithoutFinance.length || financeWithoutProjections.length) {
    addFailure(report, "projection_finance_id_system_mismatch", "Projection and finance rows resolve to different active official fantasy player ID sets.", {
      projection_unique_player_count: projectionOfficialIds.size,
      finance_unique_player_count: financeOfficialIds.size,
      projections_without_finance_count: projectionsWithoutFinance.length,
      finance_without_projections_count: financeWithoutProjections.length,
      projections_without_finance_sample: sample(projectionsWithoutFinance),
      finance_without_projections_sample: sample(financeWithoutProjections)
    });
  }

  const detail = {
    active_official_universe_field: ACTIVE_OFFICIAL_UNIVERSE_FIELD,
    active_official_fantasy_players: officialRecords.length,
    missing_official_fantasy_player_id_count: missingOfficialIdRecords.length,
    duplicate_official_fantasy_player_id_count: activeIdentity.duplicateOfficialIds.length,
    duplicate_official_fantasy_player_ids: sample(activeIdentity.duplicateOfficialIds),
    selectable_official_records: selectableRecords.length,
    selectable_position_counts: selectablePositionCounts,
    recommendation_identity_coverage: {
      resolved: active.recommendationRows.length - recommendationMissing.length,
      total: active.recommendationRows.length,
      missing: recommendationMissing.length
    },
    projection_identity_coverage: {
      resolved: active.projectionRows.length - projectionMissing.length,
      total: active.projectionRows.length,
      missing: projectionMissing.length,
      unique_active_official_players: projectionOfficialIds.size
    },
    finance_identity_coverage: {
      resolved: active.financeRows.length - financeMissing.length,
      total: active.financeRows.length,
      missing: financeMissing.length,
      unique_active_official_players: financeOfficialIds.size
    },
    projection_finance_id_alignment: {
      projection_unique_player_count: projectionOfficialIds.size,
      finance_unique_player_count: financeOfficialIds.size,
      projections_without_finance_count: projectionsWithoutFinance.length,
      finance_without_projections_count: financeWithoutProjections.length
    },
    players_data_enrichment: enrichmentCoverage
  };

  addCheck(report, "active_official_fantasy_identity_universe", officialRecords.length && !missingOfficialIdRecords.length && !activeIdentity.duplicateOfficialIds.length ? "pass" : "fail", {
    active_official_universe_field: detail.active_official_universe_field,
    active_official_fantasy_players: detail.active_official_fantasy_players,
    missing_official_fantasy_player_id_count: detail.missing_official_fantasy_player_id_count,
    duplicate_official_fantasy_player_id_count: detail.duplicate_official_fantasy_player_id_count,
    selectable_position_counts: detail.selectable_position_counts
  });
  addCheck(report, "fantasy_pool_recommendation_identity_coverage", recommendationMissing.length ? "fail" : "pass", detail.recommendation_identity_coverage);
  addCheck(report, "fantasy_pool_projection_identity_coverage", projectionMissing.length ? "fail" : "pass", detail.projection_identity_coverage);
  addCheck(report, "fantasy_pool_finance_identity_coverage", financeMissing.length ? "fail" : "pass", detail.finance_identity_coverage);
  addCheck(report, "projection_finance_id_system_alignment", projectionsWithoutFinance.length || financeWithoutProjections.length ? "fail" : "pass", detail.projection_finance_id_alignment);
  addCheck(report, "players_data_enrichment_coverage", "pass", enrichmentCoverage);

  return detail;
}

function verifyActiveMatchdayConsistency(report, active, activeIdentity, browserPlayers) {
  const playersDataUniverse = identityUniverse(browserPlayers);
  const activeRecommendations = active.recommendationRows.filter((row) => matchdayId(row) === ACTIVE_MATCHDAY_ID);
  const activeProjections = active.projectionRows.filter((row) => matchdayId(row) === ACTIVE_MATCHDAY_ID);
  const activeProjectionResolvedKeys = new Set(activeProjections
    .map((row) => {
      const officialId = activeOfficialIdForRecord(row, activeIdentity);
      const md = matchdayId(row);
      return officialId && md ? `${officialId}|${md}` : "";
    })
    .filter(Boolean));
  const recommendationActiveIdentityMissing = rowsMissingActiveIdentity(activeRecommendations, activeIdentity);
  const projectionActiveIdentityMissing = rowsMissingActiveIdentity(activeProjections, activeIdentity);
  const financeActiveIdentityMissing = rowsMissingActiveIdentity(active.financeRows, activeIdentity);
  const recommendationProjectionMissing = activeRecommendations.filter((row) => {
    const officialId = activeOfficialIdForRecord(row, activeIdentity);
    return !officialId || !activeProjectionResolvedKeys.has(`${officialId}|${matchdayId(row)}`);
  });
  const recommendationPlayersDataMissing = activeRecommendations.filter((row) => !resolvesToUniverse(row, playersDataUniverse));
  const projectionPlayersDataMissing = activeProjections.filter((row) => !resolvesToUniverse(row, playersDataUniverse));
  const financePlayersDataMissing = active.financeRows.filter((row) => !resolvesToUniverse(row, playersDataUniverse));
  const activeScoreRows = active.scoreRows.filter((row) => matchdayId(row) === ACTIVE_MATCHDAY_ID);
  const scoreFixtureKeys = active.scoreRows.map((row) => String(row.fixture_id || row.match_id || "").trim()).filter(Boolean);
  const duplicateScoreFixtureKeys = sorted(scoreFixtureKeys.filter((key, index) => scoreFixtureKeys.indexOf(key) !== index));
  const invalidNumbers = [
    ...validateFiniteNumbers(activeRecommendations, "active_matchday_recommendation"),
    ...validateFiniteNumbers(activeProjections, "active_matchday_projection"),
    ...validateFiniteNumbers(active.financeRows, "finance_metric"),
    ...validateFiniteNumbers(active.scoreRows, "score_fixture")
  ];

  if (!activeRecommendations.length) {
    addFailure(report, "active_matchday_recommendations_missing", `No ${ACTIVE_MATCHDAY_LABEL} recommendation candidates are present.`, {});
  }

  if (!activeProjections.length) {
    addFailure(report, "active_matchday_projections_missing", `No ${ACTIVE_MATCHDAY_LABEL} matchday projection rows are present.`, {});
  }

  if (recommendationActiveIdentityMissing.length) {
    addFailure(report, "active_matchday_recommendations_missing_active_official_identity", `Some ${ACTIVE_MATCHDAY_LABEL} recommendation candidates do not resolve to the active official fantasy pool.`, {
      missing_count: recommendationActiveIdentityMissing.length,
      sample: sample(recommendationActiveIdentityMissing.map((row) => ({
        id: entityKey(row),
        name: row.name || null,
        country: row.country || null,
        matchday: matchdayId(row)
      })))
    });
  }

  if (recommendationProjectionMissing.length) {
    addFailure(report, "active_matchday_recommendations_missing_projection", `Some ${ACTIVE_MATCHDAY_LABEL} recommendation candidates do not have matching ${ACTIVE_MATCHDAY_LABEL} projection rows after active official fantasy identity resolution.`, {
      missing_count: recommendationProjectionMissing.length,
      sample: sample(recommendationProjectionMissing.map((row) => ({
        id: activeOfficialIdForRecord(row, activeIdentity) || entityKey(row),
        name: row.name || null,
        matchday: matchdayId(row)
      })))
    });
  }

  if (projectionActiveIdentityMissing.length) {
    addFailure(report, "active_matchday_projections_missing_active_official_identity", `Some ${ACTIVE_MATCHDAY_LABEL} projection rows do not resolve to the active official fantasy pool.`, {
      missing_count: projectionActiveIdentityMissing.length,
      sample: sample(projectionActiveIdentityMissing.map((row) => ({ id: entityKey(row), name: row.name || null })))
    });
  }

  if (financeActiveIdentityMissing.length) {
    addFailure(report, "finance_rows_missing_active_official_identity", "Some finance metric rows do not resolve to the active official fantasy pool.", {
      missing_count: financeActiveIdentityMissing.length,
      sample: sample(financeActiveIdentityMissing.map((row) => ({ id: entityKey(row), name: row.name || null })))
    });
  }

  if (!activeScoreRows.length) {
    addFailure(report, "active_matchday_score_fixture_coverage_missing", `Score prediction rows do not cover ${ACTIVE_MATCHDAY_LABEL} fixtures.`, {});
  }

  if (duplicateScoreFixtureKeys.length) {
    addFailure(report, "duplicate_active_score_fixture_keys", "Active score fixture predictions contain duplicate fixture keys.", {
      duplicate_fixture_keys: duplicateScoreFixtureKeys
    });
  }

  if (invalidNumbers.length) {
    addFailure(report, "invalid_numeric_model_values", "NaN, Infinity, or non-finite numeric values found in active model fields.", {
      invalid_count: invalidNumbers.length,
      sample: sample(invalidNumbers)
    });
  }

  const consistency = {
    active_matchday_id: ACTIVE_MATCHDAY_ID,
    active_matchday_label: ACTIVE_MATCHDAY_LABEL,
    active_recommendation_rows: activeRecommendations.length,
    active_projection_rows: activeProjections.length,
    active_score_fixture_rows: activeScoreRows.length,
    active_recommendations_resolving_active_identity_count: activeRecommendations.length - recommendationActiveIdentityMissing.length,
    active_recommendations_missing_active_identity_count: recommendationActiveIdentityMissing.length,
    active_projections_missing_active_identity_count: projectionActiveIdentityMissing.length,
    finance_missing_active_identity_count: financeActiveIdentityMissing.length,
    recommendation_projection_missing_count: recommendationProjectionMissing.length,
    active_recommendations_missing_players_data_enrichment_count: recommendationPlayersDataMissing.length,
    active_projections_missing_players_data_enrichment_count: projectionPlayersDataMissing.length,
    finance_missing_players_data_enrichment_count: financePlayersDataMissing.length,
    players_data_role: "supplemental_enrichment_only",
    duplicate_score_fixture_key_count: duplicateScoreFixtureKeys.length,
    invalid_numeric_value_count: invalidNumbers.length
  };
  addCheck(report, "active_matchday_recommendation_identity_and_projection_coverage", recommendationActiveIdentityMissing.length || recommendationProjectionMissing.length ? "fail" : "pass", consistency);
  addCheck(report, "active_matchday_score_fixture_coverage", activeScoreRows.length && !duplicateScoreFixtureKeys.length ? "pass" : "fail", {
    active_score_fixture_rows: activeScoreRows.length,
    duplicate_score_fixture_key_count: duplicateScoreFixtureKeys.length
  });
  addCheck(report, "active_numeric_fields_finite", invalidNumbers.length ? "fail" : "pass", {
    invalid_numeric_value_count: invalidNumbers.length
  });

  return consistency;
}

function verifyTeamBuilderMinimum(report, active, rules) {
  const officialRecords = active.officialRecords;
  const selectableRecords = officialRecords.filter(isSelectable);
  const positionCounts = POSITION_CODES.reduce((counts, position) => {
    counts[position] = selectableRecords.filter((row) => positionCode(row) === position).length;
    return counts;
  }, {});
  const requiredPositions = rules?.squad?.positions || null;
  const missingRuleCounts = !requiredPositions || POSITION_CODES.some((position) => !Number.isFinite(Number(requiredPositions[position])));
  const enoughByPosition = !missingRuleCounts && POSITION_CODES.every((position) =>
    positionCounts[position] >= Number(requiredPositions[position])
  );
  const missingRequiredFields = selectableRecords.filter((row) => {
    const price = Number(row?.official_price);
    return !recordIdentityValues(row).length ||
      !row?.name ||
      !(row?.country || row?.team_id) ||
      !positionCode(row) ||
      !Number.isFinite(price) ||
      !row?.selectable_status;
  });

  if (missingRuleCounts) {
    addWarning(report, "team_builder_rule_counts_missing", "Legal squad validation could not be fully checked because squad position counts are missing from fantasy rules.", {
      rules_positions: requiredPositions
    });
  } else if (!enoughByPosition) {
    addFailure(report, "team_builder_not_enough_selectable_positions", "Not enough selectable official fantasy records exist to form the official squad position counts.", {
      required_positions: requiredPositions,
      selectable_position_counts: positionCounts
    });
  }

  if (missingRequiredFields.length) {
    addFailure(report, "team_builder_candidate_required_fields_missing", "Selectable official fantasy records are missing required Team Builder fields.", {
      missing_count: missingRequiredFields.length,
      sample: sample(missingRequiredFields.map((row) => ({
        id: entityKey(row),
        name: row.name || null,
        country: row.country || null,
        team_id: row.team_id || null,
        position: row.official_fantasy_position || row.position || null,
        price: row.official_price ?? null,
        selectable_status: row.selectable_status || null
      })))
    });
  }

  const detail = {
    selectable_official_records: selectableRecords.length,
    selectable_position_counts: positionCounts,
    required_positions: requiredPositions,
    legal_squad_counts_checked: !missingRuleCounts,
    enough_by_position: enoughByPosition,
    missing_required_field_count: missingRequiredFields.length
  };
  addCheck(report, "team_builder_minimum_data", !missingRuleCounts && enoughByPosition && !missingRequiredFields.length ? "pass" : missingRuleCounts ? "warning" : "fail", detail);
  return detail;
}

function buildMarkdownReport(report) {
  const activeIdentity = report.active_identity || {};
  const enrichment = report.enrichment_coverage || activeIdentity.players_data_enrichment || {};
  const staleBlock = report.public_stale_path_block || {};
  const activeMatchday = report.active_matchday_consistency || {};
  const lines = [];
  lines.push("# Active R32 Data Flow QA Report");
  lines.push("");
  lines.push(`Generated: ${report.generated_at}`);
  lines.push(`Status: **${report.status.toUpperCase()}**`);
  lines.push(`Active version: \`${report.active_version}\``);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Failures: ${report.failures.length}`);
  lines.push(`- Warnings: ${report.warnings.length}`);
  lines.push(`- Checks: ${report.checks.length}`);
  lines.push("");
  lines.push("## A. Static Source Sync");
  lines.push("");
  lines.push(`- players.json rows: ${report.players_sync?.source_count ?? "n/a"}`);
  lines.push(`- playersData.js rows: ${report.players_sync?.browser_count ?? "n/a"}`);
  lines.push(`- players sync: ${report.players_sync?.count_in_sync && report.players_sync?.id_comparison?.in_sync ? "pass" : "fail"}`);
  lines.push(`- fantasyRules sync: ${report.rules_sync?.in_sync ? "pass" : "fail"}`);
  lines.push("");
  lines.push("## B. Active Fantasy Identity");
  lines.push("");
  lines.push(`- active official universe field: \`${activeIdentity.active_official_universe_field || ACTIVE_OFFICIAL_UNIVERSE_FIELD}\``);
  lines.push(`- active official fantasy players: ${activeIdentity.active_official_fantasy_players ?? "n/a"}`);
  lines.push(`- missing official fantasy player IDs: ${activeIdentity.missing_official_fantasy_player_id_count ?? "n/a"}`);
  lines.push(`- duplicate official fantasy player IDs: ${activeIdentity.duplicate_official_fantasy_player_id_count ?? "n/a"}`);
  lines.push(`- selectable official records: ${activeIdentity.selectable_official_records ?? "n/a"}`);
  lines.push(`- selectable by position: GK ${activeIdentity.selectable_position_counts?.GK ?? "n/a"}, DEF ${activeIdentity.selectable_position_counts?.DEF ?? "n/a"}, MID ${activeIdentity.selectable_position_counts?.MID ?? "n/a"}, FWD ${activeIdentity.selectable_position_counts?.FWD ?? "n/a"}`);
  lines.push(`- recommendation identity coverage: ${activeIdentity.recommendation_identity_coverage?.resolved ?? "n/a"} / ${activeIdentity.recommendation_identity_coverage?.total ?? "n/a"} resolved`);
  lines.push(`- projection identity coverage: ${activeIdentity.projection_identity_coverage?.resolved ?? "n/a"} / ${activeIdentity.projection_identity_coverage?.total ?? "n/a"} resolved`);
  lines.push(`- finance identity coverage: ${activeIdentity.finance_identity_coverage?.resolved ?? "n/a"} / ${activeIdentity.finance_identity_coverage?.total ?? "n/a"} resolved`);
  lines.push(`- projection/finance active ID alignment: ${activeIdentity.projection_finance_id_alignment?.projections_without_finance_count ?? "n/a"} projection-only, ${activeIdentity.projection_finance_id_alignment?.finance_without_projections_count ?? "n/a"} finance-only`);
  lines.push("");
  lines.push("## C. Enrichment Coverage");
  lines.push("");
  lines.push(`- role: ${enrichment.identity_role || "supplemental_enrichment_only"}`);
  lines.push(`- active fantasy players resolving to playersData.js: ${enrichment.active_players_resolving_to_players_data ?? "n/a"} / ${enrichment.active_official_fantasy_players ?? "n/a"}`);
  lines.push(`- active fantasy players not resolving to playersData.js: ${enrichment.active_players_not_resolving_to_players_data ?? "n/a"}`);
  lines.push(`- coverage: ${enrichment.coverage_percent ?? "n/a"}%`);
  lines.push("");
  lines.push("## D. Public Stale-Path Block");
  lines.push("");
  lines.push(`- index.html old scripts absent: ${staleBlock.loaded_legacy_files?.length ? "fail" : "pass"}`);
  lines.push(`- old globals absent from script.js: ${staleBlock.old_global_reads?.length ? "fail" : "pass"}`);
  lines.push(`- stale cache strings absent: ${staleBlock.stale_public_version_strings?.length ? "fail" : "pass"}`);
  lines.push(`- public fallback references absent: ${staleBlock.old_public_fallback_references?.length ? "fail" : "pass"}`);
  lines.push("");
  lines.push(`## ${ACTIVE_MATCHDAY_LABEL} Gate`);
  lines.push("");
  lines.push(`- ${ACTIVE_MATCHDAY_LABEL} recommendations: ${activeMatchday.active_recommendation_rows ?? "n/a"}`);
  lines.push(`- ${ACTIVE_MATCHDAY_LABEL} recommendation active identity coverage: ${activeMatchday.active_recommendations_resolving_active_identity_count ?? "n/a"} / ${activeMatchday.active_recommendation_rows ?? "n/a"}`);
  lines.push(`- ${ACTIVE_MATCHDAY_LABEL} recommendation projection misses: ${activeMatchday.recommendation_projection_missing_count ?? "n/a"}`);
  lines.push(`- ${ACTIVE_MATCHDAY_LABEL} projections: ${activeMatchday.active_projection_rows ?? "n/a"}`);
  lines.push(`- ${ACTIVE_MATCHDAY_LABEL} score fixtures: ${activeMatchday.active_score_fixture_rows ?? "n/a"}`);
  lines.push(`- playersData.js ${ACTIVE_MATCHDAY_LABEL} recommendation enrichment misses: ${activeMatchday.active_recommendations_missing_players_data_enrichment_count ?? "n/a"}`);
  lines.push(`- playersData.js ${ACTIVE_MATCHDAY_LABEL} projection enrichment misses: ${activeMatchday.active_projections_missing_players_data_enrichment_count ?? "n/a"}`);
  lines.push(`- playersData.js finance enrichment misses: ${activeMatchday.finance_missing_players_data_enrichment_count ?? "n/a"}`);
  lines.push("");
  lines.push("## Checks");
  lines.push("");
  report.checks.forEach((check) => {
    lines.push(`- **${check.status.toUpperCase()}** \`${check.id}\``);
  });
  lines.push("");
  lines.push("## Failures");
  lines.push("");
  if (!report.failures.length) {
    lines.push("- None");
  } else {
    report.failures.forEach((failure) => {
      lines.push(`- \`${failure.id}\`: ${failure.message}`);
    });
  }
  lines.push("");
  lines.push("## Warnings");
  lines.push("");
  if (!report.warnings.length) {
    lines.push("- None");
  } else {
    report.warnings.forEach((warning) => {
      lines.push(`- \`${warning.id}\`: ${warning.message}`);
      if (warning.detail?.missing_count !== undefined) {
        lines.push(`  Missing count: ${warning.detail.missing_count}`);
      }
    });
  }
  lines.push("");
  lines.push("## Public Script Order");
  lines.push("");
  lines.push("```text");
  lines.push(...REQUIRED_SCRIPT_ORDER);
  lines.push("```");
  lines.push("");
  lines.push("## Notes");
  lines.push("");
  lines.push("- Old model files are allowed in docs/archive files only; this gate checks `index.html` and public `script.js`.");
  lines.push("- Live matchday/player status data is treated as display/support input only.");
  lines.push("- `playersData.js` coverage is enrichment-only for fantasyPool model rows. The active public identity universe is `FANTASY_POOL_OFFICIAL_DATA_STATUS.official_position_records`.");
  lines.push("");
  return `${lines.join("\n")}\n`;
}

async function main() {
  const report = {
    schema_version: "active_fantasy_data_flow_qa_v1",
    generated_at: new Date().toISOString(),
    active_version: ACTIVE_VERSION,
    status: "unknown",
    checks: [],
    failures: [],
    warnings: []
  };

  const indexHtml = readText("index.html");
  const scriptJs = readText("script.js");
  report.public_stale_path_block = verifyPublicScripts(report, indexHtml, scriptJs);

  const windowGlobals = loadBrowserGlobals();
  const sync = verifySourceSync(report, windowGlobals);
  const active = verifyActiveGlobals(report, windowGlobals);
  const activeIdentity = buildActiveIdentity(active.officialRecords);
  report.active_counts = active.activeCounts;
  report.players_sync = sync.playerSync;
  report.rules_sync = sync.rulesSync;
  report.active_identity = verifyActiveIdentity(report, active, sync.browserPlayers, activeIdentity);
  report.enrichment_coverage = report.active_identity.players_data_enrichment;
  report.active_matchday_consistency = verifyActiveMatchdayConsistency(report, active, activeIdentity, sync.browserPlayers);
  report.team_builder_minimum_data = verifyTeamBuilderMinimum(report, active, sync.browserRules);

  report.status = report.failures.length
    ? "fail"
    : report.warnings.length
      ? "pass_with_warnings"
      : "pass";

  await writeFile(projectPath("data/activeFantasyDataFlowQa.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeFile(projectPath("data/activeFantasyDataFlowQaReport.md"), buildMarkdownReport(report), "utf8");

  console.log(`data/activeFantasyDataFlowQa.json: ${report.status}`);
  console.log(`failures: ${report.failures.length}`);
  console.log(`warnings: ${report.warnings.length}`);

  if (report.failures.length) {
    report.failures.forEach((failure) => {
      console.error(`FAIL ${failure.id}: ${failure.message}`);
    });
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
