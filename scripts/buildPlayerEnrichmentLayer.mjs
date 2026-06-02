import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const TODAY = "2026-06-02";

const PATHS = {
  officialPlayers: "data/officialFantasyPlayers_v0.json",
  officialImportCsv: "data/imports/officialFantasyPlayers.csv",
  identityMap: "data/mappings/playerIdentityMap_v1.csv",
  identityOverrides: "data/mappings/playerIdentityManualOverrides_v1.csv",
  identityReport: "data/playerIdentityMatchReport_v1.md",
  players: "data/players.json",
  recommendationInputs: "data/playerRecommendationInputs_v0.json",
  nationalPerformance: "data/playerNationalTeamPerformance.json",
  playerPerformance: "data/playerPerformance.json",
  minutesModel: "data/playerMinutesModel_v0.json",
  financeMetrics: "data/playerFinanceMetrics_v0.json",
  valueModel: "data/playerValueModel_v1.json",
  oneFootballClub: "data/oneFootballAllRosterMatches.json",
  oneFootballQualifierSeason: "data/oneFootballQualifierRosterSeasonStats.json",
  oneFootballQualifierMatch: "data/oneFootballQualifierRosterMatchStats.json",
  espnSummaryMatchedSeasonStats: "data/espnSummaryMatchedSeasonStats.json",
  espnRosterLeaderboardMatches: "data/espnRosterLeaderboardMatches.json",
  espnDetailedRoster: "data/espnDetailedRosterPlayerStats.json",
  espnExpandedMatched: "data/espnExpandedMatchedPlayerStats.json",
  rootPlayers: "players.json",
  playersDataJs: "playersData.js",
  financePlayersDataJs: "financePlayersData.js",
  matchdayProjectionsDataJs: "matchdayProjectionsData.js",
  scorePredictionsDataJs: "scorePredictionsData.js",
  targetedUsageImport: "data/imports/targetedNationalTeamUsage.csv",
  sourceInventory: "data/playerEnrichmentSourceInventory_v1.md",
  clubContext: "data/playerClubContext_v1.csv",
  clubReport: "data/playerClubContextReport_v1.md",
  qualifierUsage: "data/playerQualifierUsage_v1.csv",
  usageReport: "data/playerNationalTeamUsageReport_v1.md",
  coverageJson: "data/playerDataCoverageReport_v1.json",
  coverageMd: "data/playerDataCoverageReport_v1.md",
  highRiskAudit: "data/highRiskMissingDataAudit_v1.md"
};

const HIGH_RISK_AUDIT_NAME_LABELS = [
  "Emiliano Buendía",
  "Xavi Simons",
  "Sofiane Boufal",
  "Matías Soulé",
  "Johnny Cardoso",
  "Jamal Musiala"
];

const OFFICIAL_JSON_FIELD_CHECKS = [
  "club",
  "date_of_birth",
  "shirt_number",
  "display_name",
  "position_raw",
  "team_name_raw",
  "fifa_player_profile_url",
  "fantasy_player_url"
];

const OFFICIAL_IMPORT_FIELD_CHECKS = [
  "display_name",
  "first_name",
  "last_name",
  "shirt_name",
  "shirt_number",
  "club",
  "date_of_birth",
  "position_raw",
  "team_name_raw",
  "fifa_player_profile_url",
  "fantasy_player_url"
];

const CLUB_HEADERS = [
  "internal_player_id",
  "official_fantasy_player_id",
  "name",
  "country",
  "official_fantasy_position",
  "official_price",
  "current_club",
  "current_club_country",
  "current_league",
  "club_source",
  "club_source_url",
  "club_source_checked",
  "club_minutes_recent",
  "club_starts_recent",
  "club_position_role",
  "club_role_confidence",
  "club_data_status",
  "data_quality_flags",
  "notes"
];

const USAGE_HEADERS = [
  "internal_player_id",
  "official_fantasy_player_id",
  "name",
  "country",
  "official_fantasy_position",
  "official_price",
  "qualifier_matches_available",
  "qualifier_minutes",
  "qualifier_starts",
  "qualifier_goals",
  "qualifier_assists",
  "qualifier_clean_sheets",
  "qualifier_cards",
  "recent_nt_minutes",
  "recent_nt_starts",
  "recent_nt_role",
  "last_nt_start_date",
  "set_piece_role",
  "penalty_role",
  "corner_role",
  "free_kick_role",
  "usage_source",
  "usage_source_url",
  "usage_source_checked",
  "usage_confidence",
  "data_quality_flags",
  "notes"
];

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

async function readOptionalJson(filePath) {
  if (!(await fileExists(filePath))) return null;
  return readJson(filePath);
}

async function lineCount(filePath) {
  if (!(await fileExists(filePath))) return 0;
  const text = await readFile(filePath, "utf8");
  if (!text) return 0;
  return text.split(/\r?\n/).length;
}

function parseDelimitedLine(line, delimiter) {
  const values = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === "\"" && quoted && next === "\"") {
      value += "\"";
      index += 1;
    } else if (char === "\"") {
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

async function readCsv(filePath) {
  return parseDelimited(await readFile(filePath, "utf8"));
}

async function readOptionalCsv(filePath) {
  if (!(await fileExists(filePath))) return [];
  return readCsv(filePath);
}

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const text = Array.isArray(value) ? value.filter(Boolean).join("|") : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(headers, rows) {
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(","))
  ].join("\n") + "\n";
}

function hasValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function num(value) {
  if (!hasValue(value)) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function firstValue(...values) {
  for (const value of values) {
    if (hasValue(value)) return value;
  }
  return "";
}

function firstNumber(...values) {
  for (const value of values) {
    const parsed = num(value);
    if (parsed !== null) return parsed;
  }
  return null;
}

function formatNumber(value) {
  const parsed = num(value);
  if (parsed === null) return "";
  return Number.isInteger(parsed) ? String(parsed) : String(Number(parsed.toFixed(2)));
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/["']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function splitFlags(value) {
  return String(value || "").split("|").map((flag) => flag.trim()).filter(Boolean);
}

function unique(values) {
  return [...new Set(values.filter((value) => hasValue(value)).map((value) => String(value)))];
}

function flagsList(values) {
  return unique(values).join("|");
}

function indexBy(rows, key) {
  return new Map((rows || []).filter((row) => hasValue(row?.[key])).map((row) => [String(row[key]), row]));
}

function rowsBy(rows, key) {
  const map = new Map();
  for (const row of rows || []) {
    const value = row?.[key];
    if (!hasValue(value)) continue;
    const list = map.get(String(value)) || [];
    list.push(row);
    map.set(String(value), list);
  }
  return map;
}

function topCounts(rows, key, limit = 10) {
  const counts = new Map();
  for (const row of rows) {
    const value = row[key] || "unknown";
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}

function markdownCounts(counts) {
  return counts.length
    ? counts.map(({ label, count }) => `- ${label}: ${count}`).join("\n")
    : "- None";
}

function fieldList(row, fields) {
  return fields.filter((field) => hasValue(row?.[field]));
}

function sourceFilesFromPerformance(performance) {
  const values = [];
  const files = performance?.source_files || {};
  for (const value of Object.values(files)) {
    if (hasValue(value)) values.push(value);
  }
  return values;
}

function sourceUrlForPlayer(player) {
  if (Array.isArray(player?.source_urls) && player.source_urls.length) {
    return player.source_urls.join("|");
  }
  return "";
}

function sourceUrlForClub({ official, player, performance, oneFootballClub, bestClub }) {
  if (hasValue(official?.club) && hasValue(official?.source_url)) return official.source_url;
  const performanceFiles = sourceFilesFromPerformance(performance);
  if (performanceFiles.length) return performanceFiles.join("|");
  if (oneFootballClub?.onefootball_player_id) {
    return `data/oneFootballAllRosterMatches.json#${oneFootballClub.onefootball_player_id}`;
  }
  if (bestClub?.primary_source_id) return `data/playerRecommendationInputs_v0.json#${bestClub.primary_source_id}`;
  return sourceUrlForPlayer(player) || PATHS.players;
}

function identityLookupId(identity) {
  if (hasValue(identity.matched_existing_player_id)) return identity.matched_existing_player_id;
  if (identity.match_status !== "new_player_created") return identity.internal_player_id;
  return "";
}

function isThinProfile(identity) {
  return identity.match_status === "new_player_created" || splitFlags(identity.data_quality_flags).includes("thin_profile");
}

function isJoinGapFixed(identity) {
  return identity.match_status === "manual_confirmed" && /hard join gap/i.test(identity.review_notes || "");
}

function isNamedHighRisk(name) {
  const normalized = normalizeText(name);
  return HIGH_RISK_AUDIT_NAME_LABELS.some((label) => normalizeText(label) === normalized);
}

function mapRole(rawRole, stats = {}) {
  const raw = String(rawRole || "").trim();
  const direct = new Map([
    ["locked_starter", "locked_starter"],
    ["likely_starter", "likely_starter"],
    ["rotation_starter", "rotation_starter"],
    ["rotation", "rotation_starter"],
    ["impact_sub", "impact_sub"],
    ["backup", "backup"],
    ["third_choice", "third_choice"],
    ["bench_option", "squad_depth"],
    ["squad_depth", "squad_depth"],
    ["new_callup", "new_callup"],
    ["needs_check", "unclear"],
    ["unknown", "unclear"],
    ["unclear", "unclear"],
    ["qualifier_core_player", "likely_starter"],
    ["qualifier_regular_or_rotation", "rotation_starter"],
    ["qualifier_depth_or_limited_minutes", "squad_depth"],
    ["regular_national_team_player", "likely_starter"],
    ["established_national_team_player", "likely_starter"],
    ["limited_senior_international_sample", "squad_depth"],
    ["rotation_or_recent_squad_player", "rotation_starter"]
  ]);
  if (direct.has(raw)) return direct.get(raw);

  const appearances = num(stats.appearances) || num(stats.match_count);
  const starts = num(stats.starts);
  if (appearances && starts !== null) {
    const startRate = starts / appearances;
    if (starts >= 6 && startRate >= 0.8) return "locked_starter";
    if (starts >= 4 && startRate >= 0.6) return "likely_starter";
    if (starts >= 1) return "rotation_starter";
    return "impact_sub";
  }

  return "unclear";
}

function roleConfidence(minutesRow, hasUsageStats, isThin) {
  if (isThin && !hasUsageStats) return "thin_profile_missing";
  const raw = String(minutesRow?.role_confidence || "").trim();
  if (["high", "medium", "low"].includes(raw) && hasUsageStats) return raw;
  if (hasUsageStats) return "medium";
  return "missing";
}

function validTargetedUsage(row) {
  if (!row || row.source_type === "missing_source_gap") return false;
  if (!hasValue(row.source_url) || !hasValue(row.source_checked)) return false;
  const confidence = String(row.usage_confidence || "").trim();
  if (!["high", "medium", "low"].includes(confidence)) return false;
  return [
    row.recent_nt_starts,
    row.recent_nt_minutes,
    row.qualifier_starts,
    row.qualifier_minutes,
    row.role_evidence
  ].some(hasValue);
}

function shouldApplyTargetedUsage(row, currentConfidence, currentHasUsageStats) {
  if (!validTargetedUsage(row)) return false;
  if (currentHasUsageStats && ["high", "medium"].includes(currentConfidence)) return false;
  return ["missing", "thin_profile_missing", "low"].includes(currentConfidence) || !currentHasUsageStats;
}

function usageSource(bestStats, natProfile, qualifierRow, minutesRow) {
  if (bestStats?.primary_source_id) return bestStats.primary_source_id;
  if (natProfile?.qualifier_player_source_id) return natProfile.qualifier_player_source_id;
  if (qualifierRow?.source_id) return qualifierRow.source_id;
  if (minutesRow?.model_inputs_v0?.national_minutes) return "data/playerMinutesModel_v0.json";
  return "";
}

function sourceChecked(...sources) {
  for (const source of sources) {
    if (hasValue(source)) return source;
  }
  return "";
}

function clubRoleConfidence({ bestClub, performance, oneFootballClub, minutes, club }) {
  if (bestClub?.has_high_confidence_club_performance || minutes?.data_quality?.has_high_confidence_club_performance) {
    return "high";
  }
  if (bestClub?.has_club_performance || performance?.player_id || oneFootballClub?.roster_player_id || minutes?.data_quality?.has_club_performance) {
    return "medium";
  }
  if (hasValue(club)) return "low";
  return "missing";
}

function clubDataStatus({ identity, official, club, bestClub, performance, oneFootballClub }) {
  if (isThinProfile(identity) && !hasValue(club)) return "thin_profile_missing";
  if (!hasValue(club)) return "missing";
  if (hasValue(official?.club)) return "official_verified";
  if (bestClub?.has_club_performance || performance?.player_id || oneFootballClub?.roster_player_id) return "source_verified";
  return "existing_project_data";
}

function setPieceValue(value, label) {
  if (!hasValue(value)) return "";
  return `${label}_${value}`;
}

function buildClubRows(context) {
  const {
    identityRows,
    officialById,
    playersById,
    recommendationById,
    nationalById,
    performanceById,
    minutesById,
    financeById,
    oneFootballClubById,
    sourceCheckedByFile
  } = context;

  return identityRows.map((identity) => {
    const officialId = String(identity.official_fantasy_player_id || "");
    const official = officialById.get(officialId) || {};
    const lookupId = identityLookupId(identity);
    const player = playersById.get(lookupId) || {};
    const recommendation = recommendationById.get(lookupId) || {};
    const national = nationalById.get(lookupId) || {};
    const performance = performanceById.get(lookupId) || {};
    const minutes = minutesById.get(lookupId) || {};
    const finance = financeById.get(lookupId) || {};
    const oneFootballClub = oneFootballClubById.get(lookupId) || {};
    const bestClub = recommendation.best_available_club_performance_v0 || {};

    const currentClub = firstValue(
      official.club,
      bestClub.club,
      performance.club,
      oneFootballClub.roster_club,
      player.club,
      recommendation.club,
      minutes.club,
      finance.club,
      identity.matched_club
    );
    const currentLeague = firstValue(
      bestClub.league,
      performance.league,
      oneFootballClub.competition_name,
      player.league,
      recommendation.league,
      minutes.league,
      finance.league
    );
    const clubCountry = firstValue(oneFootballClub.competition_country);
    const clubMinutes = firstNumber(bestClub.minutes, performance.minutes, oneFootballClub.minutes, minutes.model_inputs_v0?.club_minutes);
    const clubStarts = firstNumber(bestClub.starts, performance.starts, oneFootballClub.starts, minutes.model_inputs_v0?.club_starts);
    const clubSource = firstValue(
      hasValue(official.club) ? "official_fantasy_player_import" : "",
      bestClub.primary_source_id,
      performance.player_id ? PATHS.playerPerformance : "",
      oneFootballClub.roster_player_id ? PATHS.oneFootballClub : "",
      player.player_id ? PATHS.players : "",
      recommendation.player_id ? PATHS.recommendationInputs : ""
    );
    const confidence = clubRoleConfidence({ bestClub, performance, oneFootballClub, minutes, club: currentClub });
    const status = clubDataStatus({ identity, official, club: currentClub, bestClub, performance, oneFootballClub });
    const identityFlags = splitFlags(identity.data_quality_flags);
    const thin = isThinProfile(identity);
    const joinGapFixed = isJoinGapFixed(identity);
    const flags = [
      thin ? "thin_profile" : "",
      status === "thin_profile_missing" ? "thin_profile_missing" : "",
      joinGapFixed ? "join_gap_fixed" : "",
      identityFlags.includes("position_conflict") ? "position_conflict" : "",
      !hasValue(currentClub) ? "missing_club" : "",
      !hasValue(currentClub) ? "source_gap" : "",
      !hasValue(currentLeague) ? "missing_league" : "",
      clubMinutes === null ? "missing_club_minutes" : "",
      clubStarts === null ? "missing_club_starts" : "",
      ["low", "missing"].includes(confidence) ? "low_club_role_confidence" : "",
      status === "source_verified" && bestClub.review_flags?.length ? bestClub.review_flags.join("|") : ""
    ];

    const notes = [];
    if (thin) notes.push("Thin profile from official fantasy import; no existing internal club context unless source-backed later.");
    if (joinGapFixed) notes.push("Identity join gap fixed by source-backed official import display-name evidence; club context is joined through the confirmed internal player ID.");
    if (hasValue(currentClub) && status === "existing_project_data") notes.push("Club carried from existing project roster context; no verified club minutes source found.");
    if (hasValue(currentClub) && status === "official_verified") notes.push("Club carried from the official fantasy player import; minutes remain blank unless supported by another source.");
    if (status === "source_verified") notes.push("Club context has supporting performance or minutes source in existing repo data.");
    if (!hasValue(currentClub)) notes.push("No club context found in inspected sources.");
    if (identityFlags.includes("position_conflict")) notes.push("Official fantasy position differs from existing model position; official fantasy position remains active future fantasy position.");
    if (national?.national_team_profile?.data_quality?.caveats?.length) notes.push("National-team usage caveats are reported in the usage output.");

    return {
      internal_player_id: identity.internal_player_id,
      official_fantasy_player_id: officialId,
      name: identity.official_name || official.name,
      country: identity.country || official.country,
      official_fantasy_position: identity.official_fantasy_position || official.official_fantasy_position,
      official_price: formatNumber(official.official_price ?? identity.official_price),
      current_club: currentClub,
      current_club_country: clubCountry,
      current_league: currentLeague,
      club_source: clubSource,
      club_source_url: sourceUrlForClub({ official, player, performance, oneFootballClub, bestClub }),
      club_source_checked: sourceChecked(
        hasValue(official.club) ? official.source_checked : "",
        sourceCheckedByFile[PATHS.recommendationInputs],
        sourceCheckedByFile[PATHS.playerPerformance],
        sourceCheckedByFile[PATHS.oneFootballClub],
        sourceCheckedByFile[PATHS.players]
      ),
      club_minutes_recent: formatNumber(clubMinutes),
      club_starts_recent: formatNumber(clubStarts),
      club_position_role: firstValue(identity.existing_model_position, player.position, recommendation.position, minutes.position, finance.position),
      club_role_confidence: confidence,
      club_data_status: status,
      data_quality_flags: flagsList(flags.flatMap((flag) => String(flag || "").split("|"))),
      notes: notes.join(" ")
    };
  });
}

function buildUsageRows(context) {
  const {
    identityRows,
    officialById,
    nationalById,
    recommendationById,
    performanceById,
    minutesById,
    qualifierSeasonById,
    qualifierMatchRowsById,
    targetedUsageByOfficialId,
    sourceCheckedByFile
  } = context;

  return identityRows.map((identity) => {
    const officialId = String(identity.official_fantasy_player_id || "");
    const official = officialById.get(officialId) || {};
    const lookupId = identityLookupId(identity);
    const national = nationalById.get(lookupId) || {};
    const recommendation = recommendationById.get(lookupId) || {};
    const performance = performanceById.get(lookupId) || {};
    const minutes = minutesById.get(lookupId) || {};
    const qualifierRow = qualifierSeasonById.get(lookupId) || {};
    const targetedUsage = targetedUsageByOfficialId.get(officialId) || {};
    const natProfile = national.national_team_profile || {};
    const bestStats = natProfile.best_available_qualifier_stats_v0 || recommendation.national_team_usage_v0 || {};
    const matchRows = qualifierMatchRowsById.get(lookupId) || [];
    const latestStart = matchRows
      .filter((row) => row.starter && hasValue(row.kickoff))
      .map((row) => String(row.kickoff))
      .sort()
      .at(-1) || "";

    let qualifierAppearances = firstNumber(bestStats.appearances, bestStats.match_count, natProfile.qualifier_appearances, qualifierRow.appearances, qualifierRow.match_count);
    let qualifierStarts = firstNumber(bestStats.starts, natProfile.qualifier_starts, qualifierRow.starts, minutes.model_inputs_v0?.national_starts);
    let qualifierMinutes = firstNumber(bestStats.minutes, natProfile.qualifier_minutes, qualifierRow.minutes, minutes.model_inputs_v0?.national_minutes);
    const qualifierGoals = firstNumber(bestStats.goals, natProfile.qualifier_goals, qualifierRow.goals);
    const qualifierAssists = firstNumber(bestStats.assists, natProfile.qualifier_assists, qualifierRow.assists);
    const qualifierCleanSheets = firstNumber(bestStats.clean_sheet_appearances, qualifierRow.clean_sheet_appearances);
    const yellowCards = firstNumber(bestStats.yellow_cards, natProfile.qualifier_yellow_cards, qualifierRow.yellow_cards);
    const redCards = firstNumber(bestStats.red_cards, natProfile.qualifier_red_cards, qualifierRow.red_cards);
    const qualifierCards = yellowCards === null && redCards === null ? null : (yellowCards || 0) + (redCards || 0);
    let recentNtMinutes = qualifierMinutes;
    let recentNtStarts = qualifierStarts;
    let lastNtStartDate = latestStart;
    let hasUsageStats = [qualifierAppearances, qualifierStarts, qualifierMinutes, qualifierGoals, qualifierAssists].some((value) => value !== null);
    const thin = isThinProfile(identity);
    const joinGapFixed = isJoinGapFixed(identity);
    let confidence = roleConfidence(minutes, hasUsageStats, thin);
    let role = mapRole(minutes.country_role || natProfile.country_role_signal || bestStats.country_role_signal, {
      appearances: qualifierAppearances,
      starts: qualifierStarts,
      match_count: qualifierAppearances
    });
    let source = usageSource(bestStats, natProfile, qualifierRow, minutes);
    let usageSourceUrl = source ? (source === "oneFootballQualifierStats" ? PATHS.oneFootballQualifierSeason : PATHS.nationalPerformance) : "";
    let usageSourceChecked = sourceChecked(
      source === "oneFootballQualifierStats" ? sourceCheckedByFile[PATHS.oneFootballQualifierSeason] : "",
      sourceCheckedByFile[PATHS.nationalPerformance],
      sourceCheckedByFile[PATHS.recommendationInputs],
      sourceCheckedByFile[PATHS.minutesModel]
    );
    let targetedUsageApplied = false;
    let targetedUsageHasValues = false;
    let targetedUsageHasRoleEvidence = false;

    if (shouldApplyTargetedUsage(targetedUsage, confidence, hasUsageStats)) {
      const targetedQualifierStarts = firstNumber(targetedUsage.qualifier_starts);
      const targetedQualifierMinutes = firstNumber(targetedUsage.qualifier_minutes);
      const targetedRecentStarts = firstNumber(targetedUsage.recent_nt_starts);
      const targetedRecentMinutes = firstNumber(targetedUsage.recent_nt_minutes);
      if (targetedQualifierStarts !== null) qualifierStarts = targetedQualifierStarts;
      if (targetedQualifierMinutes !== null) qualifierMinutes = targetedQualifierMinutes;
      if (targetedRecentStarts !== null) recentNtStarts = targetedRecentStarts;
      if (targetedRecentMinutes !== null) recentNtMinutes = targetedRecentMinutes;
      if (hasValue(targetedUsage.last_nt_start_date)) lastNtStartDate = targetedUsage.last_nt_start_date;
      const targetedRole = mapRole(targetedUsage.role_evidence, {
        starts: firstNumber(targetedRecentStarts, targetedQualifierStarts),
        appearances: firstNumber(targetedRecentStarts, targetedQualifierStarts),
        match_count: firstNumber(targetedRecentStarts, targetedQualifierStarts)
      });
      if (targetedRole !== "unclear") role = targetedRole;
      confidence = targetedUsage.usage_confidence;
      source = "targetedNationalTeamUsageImport";
      usageSourceUrl = targetedUsage.source_url;
      usageSourceChecked = targetedUsage.source_checked;
      targetedUsageApplied = true;
      targetedUsageHasValues = [targetedQualifierStarts, targetedQualifierMinutes, targetedRecentStarts, targetedRecentMinutes].some((value) => value !== null);
      targetedUsageHasRoleEvidence = hasValue(targetedUsage.role_evidence);
      hasUsageStats = hasUsageStats || targetedUsageHasValues || targetedUsageHasRoleEvidence;
    }

    const officialPrice = num(official.official_price ?? identity.official_price);
    const identityFlags = splitFlags(identity.data_quality_flags);
    const missingUsage = ["missing", "thin_profile_missing"].includes(confidence);
    const likelyStarterMissingUsage = missingUsage && ["locked_starter", "likely_starter"].includes(role);
    const name = identity.official_name || official.name;
    const hasClubContextSignal = hasValue(performance.club)
      || hasValue(recommendation.club)
      || hasValue(recommendation.best_available_club_performance_v0?.club)
      || hasValue(minutes.club);
    const clubStarMissingUsage = missingUsage && !thin && hasClubContextSignal && officialPrice !== null && officialPrice >= 8;
    const highProfileMissingUsage = missingUsage && isNamedHighRisk(name);
    const setPieces = performance.set_pieces || {};
    const penaltyRole = setPieceValue(setPieces.penalties_order, "club_penalty_order")
      || (num(performance.attacking?.penalties_attempted) > 0 ? "club_penalty_attempts_seen" : "");
    const cornerRole = setPieceValue(setPieces.corners_and_indirect_freekicks_order, "club_corner_indirect_fk_order");
    const freeKickRole = setPieceValue(setPieces.direct_freekicks_order, "club_direct_fk_order");
    const flags = [
      thin ? "thin_profile" : "",
      thin && missingUsage ? "thin_profile_missing" : "",
      joinGapFixed ? "join_gap_fixed" : "",
      identityFlags.includes("position_conflict") ? "position_conflict" : "",
      missingUsage ? "missing_usage" : "",
      missingUsage && !hasUsageStats ? "source_gap" : "",
      highProfileMissingUsage ? "famous_player_missing_usage" : "",
      clubStarMissingUsage ? "club_star_missing_nt_usage" : "",
      confidence === "low" ? "low_role_confidence" : "",
      ["missing", "thin_profile_missing"].includes(confidence) ? "missing_role_confidence" : "",
      targetedUsageApplied ? "targeted_usage_import" : "",
      targetedUsageHasValues ? "targeted_usage_values" : "",
      targetedUsageHasRoleEvidence ? "targeted_usage_role_evidence" : "",
      targetedUsageApplied && targetedUsage.source_type ? `targeted_source_${targetedUsage.source_type}` : "",
      bestStats.minutes_is_estimated || natProfile.qualifier_starting_signal_is_estimated || minutes.model_inputs_v0?.national_minutes_is_estimated ? "estimated_qualifier_minutes" : "",
      officialPrice !== null && officialPrice >= 8 && missingUsage ? "high_price_missing_usage" : "",
      likelyStarterMissingUsage ? "likely_starter_missing_usage" : "",
      identity.official_fantasy_position === "GK" && ["missing", "thin_profile_missing"].includes(confidence) ? "goalkeeper_without_role_confidence" : ""
    ];
    const notes = [];
    const hasNumericUsageStats = [qualifierAppearances, qualifierStarts, qualifierMinutes, qualifierGoals, qualifierAssists, recentNtMinutes, recentNtStarts].some((value) => value !== null);

    if (thin) notes.push("Thin profile; no source-backed national-team usage found in current internal data.");
    if (joinGapFixed) notes.push("Identity join gap fixed by source-backed official import display-name evidence; usage context is joined through the confirmed internal player ID.");
    if (clubStarMissingUsage) notes.push("High-price matched player has club context but no source-backed national-team usage row in current repo data.");
    if (highProfileMissingUsage) notes.push("High-profile missing-usage audit flag only; fame is not used as evidence for minutes or role.");
    if (hasNumericUsageStats && !targetedUsageApplied) notes.push("Qualifier usage carried from existing national-team/OneFootball qualifier data; minutes may be estimated from lineup and substitution clocks.");
    if (targetedUsageApplied && targetedUsageHasValues) notes.push("Targeted national-team usage import added source-backed recent or qualifier starts/minutes.");
    if (targetedUsageApplied && targetedUsageHasRoleEvidence && !targetedUsageHasValues) notes.push("Targeted national-team usage import added source-backed role evidence only; starts and minutes remain blank.");
    if (targetedUsageApplied && hasValue(targetedUsage.notes)) notes.push(targetedUsage.notes);
    if (!hasNumericUsageStats && !targetedUsageHasRoleEvidence) notes.push("No qualifier or national-team usage row found in inspected sources.");
    if (setPieces.corners_and_indirect_freekicks_order || setPieces.direct_freekicks_order || setPieces.penalties_order) {
      notes.push("Set-piece columns carry existing club-performance order hints, not official national-team set-piece duties.");
    }
    if (identityFlags.includes("position_conflict")) notes.push("Official fantasy position differs from existing model position and is preserved as active future fantasy position.");

    return {
      internal_player_id: identity.internal_player_id,
      official_fantasy_player_id: officialId,
      name: identity.official_name || official.name,
      country: identity.country || official.country,
      official_fantasy_position: identity.official_fantasy_position || official.official_fantasy_position,
      official_price: formatNumber(officialPrice),
      qualifier_matches_available: formatNumber(qualifierAppearances),
      qualifier_minutes: formatNumber(qualifierMinutes),
      qualifier_starts: formatNumber(qualifierStarts),
      qualifier_goals: formatNumber(qualifierGoals),
      qualifier_assists: formatNumber(qualifierAssists),
      qualifier_clean_sheets: formatNumber(qualifierCleanSheets),
      qualifier_cards: formatNumber(qualifierCards),
      recent_nt_minutes: formatNumber(recentNtMinutes),
      recent_nt_starts: formatNumber(recentNtStarts),
      recent_nt_role: role,
      last_nt_start_date: lastNtStartDate,
      set_piece_role: cornerRole || freeKickRole || penaltyRole ? "club_set_piece_context_available" : "",
      penalty_role: penaltyRole,
      corner_role: cornerRole,
      free_kick_role: freeKickRole,
      usage_source: source,
      usage_source_url: usageSourceUrl,
      usage_source_checked: usageSourceChecked,
      usage_confidence: confidence,
      data_quality_flags: flagsList(flags),
      notes: notes.join(" ")
    };
  });
}

function countWhere(rows, predicate) {
  return rows.filter(predicate).length;
}

function missingBy(rows, key, missingPredicate, limit = 10) {
  const counts = new Map();
  for (const row of rows) {
    if (!missingPredicate(row)) continue;
    const value = row[key] || "unknown";
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}

function highRiskMissingRows(clubRows, usageRows, limit = 25) {
  const usageByOfficialId = indexBy(usageRows, "official_fantasy_player_id");
  return clubRows
    .map((club) => {
      const usage = usageByOfficialId.get(club.official_fantasy_player_id) || {};
      const price = num(club.official_price) || 0;
      const missingClub = !hasValue(club.current_club);
      const missingUsage = ["missing", "thin_profile_missing"].includes(usage.usage_confidence);
      const flags = splitFlags(usage.data_quality_flags).concat(splitFlags(club.data_quality_flags));
      const riskScore =
        price * 10 +
        (missingClub ? 15 : 0) +
        (missingUsage ? 25 : 0) +
        (flags.includes("thin_profile") ? 20 : 0) +
        (flags.includes("goalkeeper_without_role_confidence") ? 10 : 0);
      return {
        official_fantasy_player_id: club.official_fantasy_player_id,
        name: club.name,
        country: club.country,
        position: club.official_fantasy_position,
        official_price: club.official_price,
        missing_club: missingClub,
        missing_usage: missingUsage,
        flags: flagsList(flags),
        riskScore
      };
    })
    .filter((row) => row.missing_club || row.missing_usage)
    .sort((a, b) => b.riskScore - a.riskScore || a.country.localeCompare(b.country) || a.name.localeCompare(b.name))
    .slice(0, limit)
    .map(({ riskScore, ...row }) => row);
}

function coverageReport({ identityRows, clubRows, usageRows }) {
  const usageByOfficialId = indexBy(usageRows, "official_fantasy_player_id");
  const missingClub = (row) => !hasValue(row.current_club);
  const missingUsage = (row) => ["missing", "thin_profile_missing"].includes(row.usage_confidence);
  const thinProfileIds = new Set(identityRows.filter(isThinProfile).map((row) => row.official_fantasy_player_id));
  const positionConflictIds = new Set(identityRows
    .filter((row) => splitFlags(row.data_quality_flags).includes("position_conflict"))
    .map((row) => row.official_fantasy_player_id));
  const playersWithMissingEnrichment = clubRows.filter((club) => {
    const usage = usageByOfficialId.get(club.official_fantasy_player_id) || {};
    return missingClub(club) || missingUsage(usage);
  });
  const duplicateOfficialIds = Object.entries(clubRows.reduce((acc, row) => {
    acc[row.official_fantasy_player_id] = (acc[row.official_fantasy_player_id] || 0) + 1;
    return acc;
  }, {})).filter(([, count]) => count > 1).map(([id]) => id);
  const duplicateInternalIds = Object.entries(clubRows.reduce((acc, row) => {
    if (!row.internal_player_id || row.internal_player_id.startsWith("thin-")) return acc;
    acc[row.internal_player_id] = (acc[row.internal_player_id] || 0) + 1;
    return acc;
  }, {})).filter(([, count]) => count > 1).map(([id]) => id);

  const officialIds = new Set(identityRows.map((row) => row.official_fantasy_player_id));
  const clubIds = new Set(clubRows.map((row) => row.official_fantasy_player_id));
  const usageIds = new Set(usageRows.map((row) => row.official_fantasy_player_id));
  const missingClubOutputRows = [...officialIds].filter((id) => !clubIds.has(id));
  const missingUsageOutputRows = [...officialIds].filter((id) => !usageIds.has(id));

  return {
    schema_version: "player_data_coverage_report_v1",
    generated_at: TODAY,
    scope: "Official fantasy player enrichment coverage only; no model reruns or browser-ready files were updated.",
    totals: {
      total_official_fantasy_players: identityRows.length,
      club_context_rows: clubRows.length,
      national_team_usage_rows: usageRows.length,
      players_with_club_context: countWhere(clubRows, (row) => hasValue(row.current_club)),
      players_missing_club_context: countWhere(clubRows, missingClub),
      players_with_national_team_usage: countWhere(usageRows, (row) => !missingUsage(row)),
      players_missing_national_team_usage: countWhere(usageRows, missingUsage),
      high_usage_confidence: countWhere(usageRows, (row) => row.usage_confidence === "high"),
      medium_usage_confidence: countWhere(usageRows, (row) => row.usage_confidence === "medium"),
      low_usage_confidence: countWhere(usageRows, (row) => row.usage_confidence === "low"),
      missing_usage_confidence: countWhere(usageRows, (row) => row.usage_confidence === "missing"),
      thin_profile_missing_usage_confidence: countWhere(usageRows, (row) => row.usage_confidence === "thin_profile_missing"),
      thin_profiles: thinProfileIds.size,
      thin_profiles_with_club_context: countWhere(clubRows, (row) => thinProfileIds.has(row.official_fantasy_player_id) && hasValue(row.current_club)),
      thin_profiles_with_usage_context: countWhere(usageRows, (row) => thinProfileIds.has(row.official_fantasy_player_id) && !missingUsage(row)),
      position_conflict_players: positionConflictIds.size,
      players_with_missing_enrichment: playersWithMissingEnrichment.length
    },
    qa: {
      official_fantasy_players_not_found_in_club_context: missingClubOutputRows,
      official_fantasy_players_not_found_in_usage_context: missingUsageOutputRows,
      duplicate_official_fantasy_player_ids: duplicateOfficialIds,
      duplicate_internal_player_ids_where_not_expected: duplicateInternalIds,
      club_role_confidence_missing: clubRows.filter((row) => row.club_role_confidence === "missing").length,
      usage_confidence_missing: usageRows.filter((row) => ["missing", "thin_profile_missing"].includes(row.usage_confidence)).length,
      role_confidence_missing: usageRows.filter((row) => ["missing", "thin_profile_missing"].includes(row.usage_confidence)).length,
      position_conflicts_carried_from_identity_map: positionConflictIds.size,
      high_price_players_with_missing_usage: usageRows.filter((row) => splitFlags(row.data_quality_flags).includes("high_price_missing_usage")).map((row) => ({
        official_fantasy_player_id: row.official_fantasy_player_id,
        name: row.name,
        country: row.country,
        position: row.official_fantasy_position,
        official_price: row.official_price
      })),
      likely_starters_missing_usage: usageRows.filter((row) => splitFlags(row.data_quality_flags).includes("likely_starter_missing_usage")).map((row) => ({
        official_fantasy_player_id: row.official_fantasy_player_id,
        name: row.name,
        country: row.country,
        position: row.official_fantasy_position
      })),
      goalkeepers_without_role_confidence: usageRows.filter((row) => splitFlags(row.data_quality_flags).includes("goalkeeper_without_role_confidence")).map((row) => ({
        official_fantasy_player_id: row.official_fantasy_player_id,
        name: row.name,
        country: row.country,
        official_price: row.official_price
      })),
      minutes_model_sufficiency: playersWithMissingEnrichment.length === 0
        ? "sufficient_for_minutes_model_inputs_after_final_squads_and_rules"
        : "not_sufficient_for_final_minutes_model_without_targeted_missing-data review"
    },
    missing_coverage: {
      countries_with_highest_missing_club_context: missingBy(clubRows, "country", missingClub),
      countries_with_highest_missing_usage_context: missingBy(usageRows, "country", missingUsage),
      countries_with_highest_missing_any_enrichment: missingBy(playersWithMissingEnrichment, "country", () => true),
      positions_with_highest_missing_club_context: missingBy(clubRows, "official_fantasy_position", missingClub),
      positions_with_highest_missing_usage_context: missingBy(usageRows, "official_fantasy_position", missingUsage),
      positions_with_highest_missing_any_enrichment: missingBy(playersWithMissingEnrichment, "official_fantasy_position", () => true)
    },
    high_risk_missing_data_cases: highRiskMissingRows(clubRows, usageRows)
  };
}

function populatedFieldCounts(rows, fields) {
  return fields.map((field) => ({
    field,
    count: (rows || []).filter((row) => hasValue(row?.[field])).length
  }));
}

function markdownFieldCounts(counts) {
  return counts.map(({ field, count }) => `- ${field}: ${count}`).join("\n");
}

function mdEscape(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ").trim();
}

function sourceEvidenceForId(lookupId, sources) {
  if (!hasValue(lookupId)) return [];
  return [
    sources.playersById.get(lookupId) ? PATHS.players : "",
    sources.recommendationById.get(lookupId) ? PATHS.recommendationInputs : "",
    sources.nationalById.get(lookupId) ? PATHS.nationalPerformance : "",
    sources.performanceById.get(lookupId) ? PATHS.playerPerformance : "",
    sources.minutesById.get(lookupId) ? PATHS.minutesModel : "",
    sources.espnSummaryById?.get(lookupId) ? PATHS.espnSummaryMatchedSeasonStats : "",
    sources.espnLeaderboardRowsById?.get(lookupId)?.length ? PATHS.espnRosterLeaderboardMatches : ""
  ].filter(Boolean);
}

function leaderboardEvidenceForId(lookupId, sources) {
  const rows = sources.espnLeaderboardRowsById?.get(lookupId) || [];
  return rows.map((row) => {
    const competition = row.espn_league_name || row.espn_league_code;
    const table = row.espn_table;
    const team = row.espn_team_name;
    const appearances = row.row?.appearances;
    const goals = row.row?.totalGoals;
    const parts = [competition, table, team].filter(hasValue).join(" ");
    const statParts = [
      hasValue(appearances) ? `${appearances} apps` : "",
      hasValue(goals) ? `${goals} goals` : ""
    ].filter(Boolean).join(", ");
    return statParts ? `${parts} (${statParts})` : parts;
  }).filter(hasValue);
}

function auditReason({ official, importRow, identity, club, usage, sourceEvidence, leaderboardEvidence }) {
  const reasons = [];
  const missingClub = !hasValue(club?.current_club);
  const missingUsage = ["missing", "thin_profile_missing"].includes(usage?.usage_confidence);
  const thin = identity ? isThinProfile(identity) : false;
  const joinGapFixed = identity ? isJoinGapFixed(identity) : false;

  if (!official?.official_fantasy_player_id) {
    reasons.push("missing from official fantasy JSON");
  } else if (!identity?.official_fantasy_player_id) {
    reasons.push("present in official fantasy JSON but not extracted into identity map");
  } else if (joinGapFixed) {
    const display = hasValue(importRow?.display_name) ? ` (${importRow.display_name})` : "";
    reasons.push(`join_gap_fixed from official import CSV display_name${display}`);
  } else if (thin) {
    reasons.push("true thin profile in current identity map; no accepted existing internal row through source-backed matching");
  } else if (!sourceEvidence.length) {
    reasons.push("matched identity has no supporting source rows in inspected enrichment sources");
  } else {
    reasons.push(`matched identity joined to existing source rows: ${sourceEvidence.join("; ")}`);
  }

  if (hasValue(club?.current_club)) {
    const clubBits = [
      `club context found: ${club.current_club}`,
      hasValue(club.current_league) ? club.current_league : "",
      hasValue(club.club_minutes_recent) ? `${club.club_minutes_recent} club minutes` : "",
      hasValue(club.club_starts_recent) ? `${club.club_starts_recent} club starts` : ""
    ].filter(Boolean);
    reasons.push(clubBits.join(", "));
  }

  if (leaderboardEvidence.length) {
    reasons.push(`supporting ESPN leaderboard rows found: ${leaderboardEvidence.join("; ")}; these do not provide qualifier minutes or starts`);
  }

  if (missingClub && hasValue(official?.club)) {
    reasons.push("present in official fantasy JSON with club but not extracted into club context");
  } else if (missingClub) {
    reasons.push("club context unavailable from official JSON and current repo sources");
  }

  if (missingUsage) {
    reasons.push("national-team or qualifier usage unavailable or sparse in current repo sources");
  }

  if (!hasValue(official?.display_name) && hasValue(importRow?.display_name)) {
    reasons.push("raw import CSV has display_name evidence that officialFantasyPlayers_v0.json does not preserve");
  }

  return reasons;
}

function auditMissingFields({ club, usage }) {
  const fields = [];
  const missingUsage = ["missing", "thin_profile_missing"].includes(usage?.usage_confidence);
  if (!hasValue(club?.current_club)) fields.push("club_context");
  if (!hasValue(club?.club_minutes_recent)) fields.push("club_minutes");
  if (!hasValue(club?.club_starts_recent)) fields.push("club_starts");
  if (missingUsage) fields.push("national_team_usage");
  if (!hasValue(usage?.qualifier_minutes)) fields.push("qualifier_minutes");
  if (!hasValue(usage?.qualifier_starts)) fields.push("qualifier_starts");
  return fields.length ? fields : ["none_for_club_or_usage_context"];
}

function auditSourceNeeded({ club, usage, identity }) {
  const needs = [];
  const missingUsage = ["missing", "thin_profile_missing"].includes(usage?.usage_confidence);
  if (!hasValue(club?.current_club)) needs.push("official/current club source");
  if (!hasValue(club?.club_minutes_recent) || !hasValue(club?.club_starts_recent)) needs.push("club minutes/starts source");
  if (missingUsage || !hasValue(usage?.qualifier_minutes) || !hasValue(usage?.qualifier_starts)) needs.push("verified national-team or qualifier usage source");
  if (identity && isThinProfile(identity)) needs.push("source-backed internal player profile enrichment");
  return needs.length ? flagsList(needs) : "no additional source needed for current club/usage join";
}

function auditMinutesModelUse({ club, usage, identity }) {
  const missingUsage = ["missing", "thin_profile_missing"].includes(usage?.usage_confidence);
  const missingClub = !hasValue(club?.current_club);
  if (identity && isThinProfile(identity)) return "not clean; would require explicit thin-profile conservative handling";
  if (missingClub || missingUsage) return "limited; only with explicit missing-data flags and conservative low-confidence handling";
  return "yes, as source-backed enrichment context; still wait for final squads/rules";
}

function buildHighRiskAuditReport({
  coverage,
  identityRows,
  clubRows,
  usageRows,
  officialRows,
  officialImportRows,
  manualOverrides,
  sources
}) {
  const identityByOfficialId = indexBy(identityRows, "official_fantasy_player_id");
  const clubByOfficialId = indexBy(clubRows, "official_fantasy_player_id");
  const usageByOfficialId = indexBy(usageRows, "official_fantasy_player_id");
  const officialById = indexBy(officialRows, "official_fantasy_player_id");
  const importById = indexBy(officialImportRows, "official_fantasy_player_id");
  const auditIds = new Set();

  for (const row of coverage.high_risk_missing_data_cases || []) auditIds.add(String(row.official_fantasy_player_id));
  for (const row of coverage.qa.high_price_players_with_missing_usage || []) auditIds.add(String(row.official_fantasy_player_id));
  for (const row of officialRows || []) {
    if (isNamedHighRisk(row.name)) auditIds.add(String(row.official_fantasy_player_id));
  }
  for (const row of manualOverrides || []) {
    if (/hard join gap found during high-risk missing-data audit/i.test(row.reason || row.notes || "")) {
      auditIds.add(String(row.official_fantasy_player_id));
    }
  }

  const rows = [...auditIds]
    .map((officialId) => {
      const official = officialById.get(officialId) || {};
      const identity = identityByOfficialId.get(officialId) || {};
      const club = clubByOfficialId.get(officialId) || {};
      const usage = usageByOfficialId.get(officialId) || {};
      const importRow = importById.get(officialId) || {};
      const lookupId = identityLookupId(identity);
      const sourceEvidence = sourceEvidenceForId(lookupId, sources);
      const leaderboardEvidence = leaderboardEvidenceForId(lookupId, sources);
      const missingFields = auditMissingFields({ club, usage });
      const reasons = auditReason({ official, importRow, identity, club, usage, sourceEvidence, leaderboardEvidence });
      const fixed = isJoinGapFixed(identity) ? "yes_join_gap_fixed" : "no";
      const stillMissing = missingFields.includes("club_context") || missingFields.includes("national_team_usage") ? "yes" : "no_core_context_missing";

      return {
        official_fantasy_player_id: officialId,
        name: identity.official_name || official.name || importRow.name,
        country: identity.country || official.country || importRow.country,
        position: identity.official_fantasy_position || official.official_fantasy_position || importRow.official_fantasy_position,
        official_price: formatNumber(official.official_price ?? identity.official_price ?? importRow.official_price),
        missing_fields: flagsList(missingFields),
        why_missing: reasons.join("; "),
        fixed,
        still_missing: stillMissing,
        source_needed_later: auditSourceNeeded({ club, usage, identity }),
        conservative_minutes_model_use: auditMinutesModelUse({ club, usage, identity }),
        flags: flagsList(splitFlags(club.data_quality_flags).concat(splitFlags(usage.data_quality_flags)))
      };
    })
    .sort((a, b) => (num(b.official_price) || 0) - (num(a.official_price) || 0)
      || a.country.localeCompare(b.country)
      || a.name.localeCompare(b.name));

  const jsonFieldCounts = markdownFieldCounts(populatedFieldCounts(officialRows, OFFICIAL_JSON_FIELD_CHECKS));
  const importFieldCounts = markdownFieldCounts(populatedFieldCounts(officialImportRows, OFFICIAL_IMPORT_FIELD_CHECKS));
  const reviewedTable = rows.map((row) =>
    `| ${mdEscape(row.official_fantasy_player_id)} | ${mdEscape(row.name)} | ${mdEscape(row.country)} | ${mdEscape(row.position)} | ${mdEscape(row.official_price)} | ${mdEscape(row.missing_fields)} | ${mdEscape(row.why_missing)} | ${mdEscape(row.fixed)} | ${mdEscape(row.still_missing)} | ${mdEscape(row.source_needed_later)} | ${mdEscape(row.conservative_minutes_model_use)} |`
  ).join("\n") || "| None | | | | | | | | | | |";

  return `# High-Risk Missing Data Audit v1

Generated: ${TODAY}

## Scope

This audit reviews high-profile or high-price official fantasy players flagged with missing club context or missing national-team usage. It does not rerun score predictions, player projections, recommendations, Team Builder, browser-ready files, or UX.

## Official Fantasy JSON Field Check

\`${PATHS.officialPlayers}\` remains authoritative for official fantasy IDs, prices, positions, countries, and selectable status in this repo. It does not currently provide populated fields that can fill missing club context or identity display-name/order gaps:

${jsonFieldCounts}

\`${PATHS.officialImportCsv}\` is the raw import input and contains useful source-backed display/name-order fields. Those fields were used only for hard join-gap overrides where they matched existing repo player rows:

${importFieldCounts}

## Summary

- High-risk players reviewed: ${rows.length}
- Join gaps fixed in this audit: ${rows.filter((row) => row.fixed === "yes_join_gap_fixed").length}
- Players still missing core club context or national-team usage: ${rows.filter((row) => row.still_missing === "yes").length}
- High-price players with missing usage after fixes: ${coverage.qa.high_price_players_with_missing_usage.length}
- Thin-profile players in audit: ${rows.filter((row) => splitFlags(row.flags).includes("thin_profile")).length}

## Reviewed Players

| Official ID | Player | Country | Position | Price | Missing fields | Why fields were missing | Fixed | Still missing | Source needed later | Conservative minutes-model use |
| --- | --- | --- | --- | ---: | --- | --- | --- | --- | --- | --- |
${reviewedTable}

## Interpretation

- \`join_gap_fixed\` means the player was present in existing repo data under a display-name or name-order form and is now joined through a manual override.
- \`source_gap\` means the row is present in official fantasy data and the identity layer, but current inspected repo sources do not contain source-backed club or national-team usage values.
- \`famous_player_missing_usage\` and \`club_star_missing_nt_usage\` are audit flags only. They do not imply projected minutes, starts, set pieces, penalties, or role.
- Thin profiles remain thin. They should not receive historical performance, club minutes, national-team minutes, starts, or role labels until a source-backed enrichment pass supplies those fields.
`;
}

function statusCounts(rows, key) {
  return rows.reduce((acc, row) => {
    const value = row[key] || "unknown";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function buildSourceInventory({ filesMeta, counts }) {
  const rows = [
    {
      file: PATHS.officialPlayers,
      fields: "official_fantasy_player_id, name, country, team_id, official_fantasy_position, official_price, selectable_status, source_url, source_checked",
      club: "No direct club context in current import; club fields are null.",
      usage: "No national-team usage.",
      role: "No minutes or role confidence.",
      type: "official fantasy import",
      limitations: "Authoritative for official fantasy IDs/prices/positions only; status remains imported_needs_manual_review at import layer."
    },
    {
      file: PATHS.officialImportCsv,
      fields: "official_fantasy_player_id, name, display_name, first_name, last_name, country, team_id, official_fantasy_position, official_price, source_url, source_checked",
      club: "No populated club context in current import CSV.",
      usage: "No national-team usage.",
      role: "No minutes or role confidence.",
      type: "official fantasy import input",
      limitations: "Used only as source-backed display/name-order evidence for hard identity join gaps; not used to invent club, minutes, starts, or roles."
    },
    {
      file: PATHS.identityMap,
      fields: "internal_player_id, official_fantasy_player_id, matched_existing_player_id, match_status, official_fantasy_position, data_quality_flags",
      club: "Yes, as the bridge to existing internal club context.",
      usage: "Yes, as the bridge to existing usage context.",
      role: "Carries position conflict flags only.",
      type: "official-data preparation",
      limitations: "Does not contain club minutes or usage values itself."
    },
    {
      file: PATHS.players,
      fields: "player_id, name, country, team_id, position, club, league, roster_status, source_urls, data_quality, match_keys",
      club: "Yes, current club and some league fields.",
      usage: "Limited senior caps and roster context only.",
      role: "No model role confidence; roster status only.",
      type: "supporting context/prototype roster",
      limitations: "Not final official squads; 191 current player rows lack club and most league fields are null."
    },
    {
      file: PATHS.recommendationInputs,
      fields: "best_available_club_performance_v0, national_team_usage_v0, data_confidence_v0, roster_context",
      club: "Yes, consolidated club performance and field source details.",
      usage: "Yes, consolidated national qualifier usage.",
      role: "Yes, data confidence and recommendation tier caveats.",
      type: "supporting context/prototype model input",
      limitations: "Derived prototype input; not a fresh official-data model."
    },
    {
      file: PATHS.nationalPerformance,
      fields: "national_team_profile, best_available_qualifier_stats_v0, country_role_signal, qualifier starts/minutes/goals/cards",
      club: "No, except copied roster club.",
      usage: "Yes, primary source for national-team/qualifier usage.",
      role: "Yes, country_role_signal and data-quality caveats.",
      type: "supporting context",
      limitations: "OneFootball minutes are estimated from lineups/substitution clocks; some players have no matched qualifier rows."
    },
    {
      file: PATHS.targetedUsageImport,
      fields: "official_fantasy_player_id, internal_player_id, source_type, source_url, source_checked, evidence_window, recent_nt_starts, recent_nt_minutes, qualifier_starts, qualifier_minutes, role_evidence, usage_confidence",
      club: "No club context.",
      usage: "Yes, targeted national-team usage or role evidence for high-impact low-confidence players.",
      role: "Yes, when source-backed role_evidence is present with a source URL and checked date.",
      type: "supporting context/targeted manual import",
      limitations: "Only source-backed rows with high/medium/low confidence can fill missing usage. Rows marked missing_source_gap are documentation only and do not invent starts, minutes, or role."
    },
    {
      file: PATHS.playerPerformance,
      fields: "club, league, minutes, starts, goals, assists, clean_sheets, set_pieces, source_files",
      club: "Yes, club performance source.",
      usage: "Limited embedded national context only; not primary for usage.",
      role: "Club starts/minutes can support role confidence.",
      type: "supporting context",
      limitations: "Mostly Big 5/available league coverage; many rows lack starts or clean sheets."
    },
    {
      file: PATHS.minutesModel,
      fields: "country_role, role_confidence, start_probability_v0, expected_minutes_v0, model_inputs_v0, data_quality",
      club: "Supports club minutes/starter context when source-backed in model_inputs_v0.",
      usage: "Supports national minutes/starter context when source-backed in model_inputs_v0.",
      role: "Yes, controlled prototype role and confidence.",
      type: "prototype model output used as audit context",
      limitations: "Not rerun here; used only to carry existing role labels/confidence."
    },
    {
      file: PATHS.oneFootballClub,
      fields: "roster_player_id, roster_club, competition_name, competition_country, appearances, starts, minutes, goals, assists",
      club: "Yes, supplemental club performance/minutes.",
      usage: "No national-team usage.",
      role: "Starts/minutes support role confidence.",
      type: "supporting context",
      limitations: "Minutes are estimated from lineups/substitution clocks; not official fantasy data."
    },
    {
      file: PATHS.oneFootballQualifierSeason,
      fields: "roster_player_id, appearances, starts, minutes, goals, assists, cards, clean_sheet_appearances",
      club: "No.",
      usage: "Yes, qualifier season totals.",
      role: "Starts/minutes support role labels.",
      type: "supporting context",
      limitations: "Supplemental public match-page data with estimated minutes."
    },
    {
      file: PATHS.oneFootballQualifierMatch,
      fields: "roster_player_id, kickoff, starter, minutes, goals, assists, cards",
      club: "No.",
      usage: "Yes, match-level qualifier evidence and last start date.",
      role: "Lineup starter flags support role evidence.",
      type: "supporting context",
      limitations: "Estimated minutes; used only for last_nt_start_date and audit context."
    },
    {
      file: PATHS.espnSummaryMatchedSeasonStats,
      fields: "roster_player_id, roster_player_name, roster_club, league_name, match_count, minutes, starts, appearances, goals, assists",
      club: "Yes, supplemental club season stats; also already represented through consolidated recommendation inputs.",
      usage: "No World Cup qualifier or national-team usage.",
      role: "Club minutes and starts can support role context when consolidated upstream.",
      type: "supporting context",
      limitations: "Club-season source only; not a national-team usage source."
    },
    {
      file: PATHS.espnRosterLeaderboardMatches,
      fields: "player_id, player_name, espn_league_name, espn_table, espn_team_name, row.appearances, row.totalGoals",
      club: "Yes, sparse leaderboard support for club competitions such as FIFA Club World Cup.",
      usage: "Limited historical/non-qualifier national-team leaderboard evidence where team is a country, but no minutes, starts, or qualifier usage.",
      role: "No minutes or role confidence.",
      type: "supporting context/audit only",
      limitations: "Leaderboard rows are not complete player usage rows and should not fill qualifier minutes, starts, or role labels."
    },
    {
      file: PATHS.financeMetrics,
      fields: "club, league, source_status, input_features_v0, finance_metrics_v0, labels",
      club: "Secondary only; derived from other sources.",
      usage: "Secondary only; derived from other sources.",
      role: "Contains derived source_status and input_features.",
      type: "prototype finance model output",
      limitations: "Uses proxy prices and should not drive official-data model reruns."
    },
    {
      file: PATHS.valueModel,
      fields: "official_price, proxy_price_v1, model_inputs_v0",
      club: "No direct club context.",
      usage: "No direct usage context.",
      role: "Derived role context only.",
      type: "prototype value model output",
      limitations: "Proxy-price model; inspected but not used as active enrichment source."
    },
    {
      file: PATHS.rootPlayers,
      fields: "legacy/browser player sample fields, club, minutes, starts, FPL/FBref fields",
      club: "Not used for official pool enrichment.",
      usage: "No World Cup national-team usage.",
      role: "Legacy club minutes only.",
      type: "prototype/legacy",
      limitations: "Only 100 legacy rows and not keyed to official World Cup identity map."
    },
    {
      file: PATHS.financePlayersDataJs,
      fields: "browser-ready finance player data generated from v0/v1 model files",
      club: "Derived copy only.",
      usage: "Derived copy only.",
      role: "Derived copy only.",
      type: "browser-ready derivative",
      limitations: "Inspected but not used; source JSON files are preferred."
    },
    {
      file: PATHS.playersDataJs,
      fields: "browser-ready legacy players",
      club: "Derived copy only.",
      usage: "No official pool usage.",
      role: "Derived copy only.",
      type: "browser-ready derivative",
      limitations: "Inspected but not used; not official-pool keyed."
    },
    {
      file: PATHS.matchdayProjectionsDataJs,
      fields: "browser-ready projection rows",
      club: "No primary club context.",
      usage: "No primary usage context.",
      role: "Derived projection context.",
      type: "browser-ready derivative",
      limitations: "Inspected but not used because this session does not rerun or depend on projections."
    },
    {
      file: PATHS.scorePredictionsDataJs,
      fields: "browser-ready fixture score predictions",
      club: "No player club context.",
      usage: "No player usage context.",
      role: "No player role context.",
      type: "browser-ready derivative",
      limitations: "Inspected but not used for player enrichment."
    },
    {
      file: PATHS.espnDetailedRoster,
      fields: "leagues_imported, matches, completed_events",
      club: "Potential club performance source through prior consolidated files.",
      usage: "No national-team usage.",
      role: "Potential minutes/source support.",
      type: "supporting context",
      limitations: "Nested raw detail; this pass uses consolidated recommendation/player-performance fields instead."
    },
    {
      file: PATHS.espnExpandedMatched,
      fields: "rows",
      club: "No rows currently available.",
      usage: "No rows currently available.",
      role: "No rows currently available.",
      type: "supporting context",
      limitations: "Empty rows array in current repo."
    }
  ];

  const table = rows.map((row) =>
    `| ${row.file} | ${row.fields} | ${row.club} | ${row.usage} | ${row.role} | ${row.type} | ${row.limitations} |`
  ).join("\n");

  return `# Player Enrichment Source Inventory v1

Generated: ${TODAY}

## Scope

This inventory documents existing repo sources inspected for club context, national-team usage, qualifier usage, minutes, starts, roles, and supporting player performance fields. It does not promote any prototype model output into an official model input.

## Source Summary

- Official fantasy player rows inspected: ${counts.officialPlayers}
- Official fantasy import CSV rows inspected: ${counts.officialImportRows}
- Identity-map rows inspected: ${counts.identityRows}
- Existing internal player rows inspected: ${counts.players}
- Recommendation input rows inspected: ${counts.recommendationInputs}
- National-team performance rows inspected: ${counts.nationalPerformance}
- Targeted national-team usage import rows inspected: ${counts.targetedUsageImport}
- Club/player performance rows inspected: ${counts.playerPerformance}
- Existing minutes-model rows inspected as audit context: ${counts.minutesModel}
- OneFootball club rows inspected: ${counts.oneFootballClub}
- OneFootball qualifier season rows inspected: ${counts.oneFootballQualifierSeason}
- OneFootball qualifier match rows inspected: ${counts.oneFootballQualifierMatch}
- ESPN matched season rows inspected: ${counts.espnSummaryMatchedSeasonStats}
- ESPN roster leaderboard rows inspected: ${counts.espnRosterLeaderboardMatches}

## Inspected Sources

| Source file | Fields available | Club context support | National-team usage support | Minutes or role support | Source type | Known limitations |
| --- | --- | --- | --- | --- | --- | --- |
${table}

## Use In This Session

- Primary bridge: \`${PATHS.identityMap}\`.
- Club context priority: official fantasy club field if present, then existing consolidated club performance, raw player performance, OneFootball club stats, and finally existing roster club fields.
- National-team usage priority: existing national-team performance and OneFootball qualifier totals, with match-level qualifier rows used for last known start date.
- Existing \`${PATHS.minutesModel}\` role labels and confidence were carried as audit context only. The minutes model was not rerun.
- Browser-ready files were inspected as derivatives and were not used as primary enrichment sources.
`;
}

function buildClubReport({ clubRows, coverage }) {
  const statusCountsText = Object.entries(statusCounts(clubRows, "club_data_status"))
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([status, count]) => `- ${status}: ${count}`)
    .join("\n");
  const confidenceCountsText = Object.entries(statusCounts(clubRows, "club_role_confidence"))
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([status, count]) => `- ${status}: ${count}`)
    .join("\n");

  return `# Player Club Context Report v1

Generated: ${TODAY}

## Scope

This report covers club-context enrichment for the official fantasy player pool only. It does not rerun player projections, recommendations, Team Builder, captain/substitution logic, browser-ready files, or UX.

## Summary

- Official fantasy players processed: ${coverage.totals.total_official_fantasy_players}
- Club context rows: ${clubRows.length}
- Players with current club context: ${coverage.totals.players_with_club_context}
- Players missing club context: ${coverage.totals.players_missing_club_context}
- Thin profiles: ${coverage.totals.thin_profiles}
- Thin profiles with club context: ${coverage.totals.thin_profiles_with_club_context}
- Position conflicts carried from identity map: ${coverage.totals.position_conflict_players}

## Club Data Status Counts

${statusCountsText}

## Club Role Confidence Counts

${confidenceCountsText}

## Missing Club Context By Country

${markdownCounts(coverage.missing_coverage.countries_with_highest_missing_club_context)}

## Missing Club Context By Position

${markdownCounts(coverage.missing_coverage.positions_with_highest_missing_club_context)}

## QA Flags

- Official fantasy players not found in club-context output: ${coverage.qa.official_fantasy_players_not_found_in_club_context.length}
- Duplicate official fantasy player IDs in club-context output: ${coverage.qa.duplicate_official_fantasy_player_ids.length}
- Duplicate existing internal player IDs where not expected: ${coverage.qa.duplicate_internal_player_ids_where_not_expected.length}
- Club role confidence missing: ${coverage.qa.club_role_confidence_missing}
- Position conflicts carried from identity map: ${coverage.qa.position_conflicts_carried_from_identity_map}

## Interpretation

Rows with \`source_verified\` have supporting performance or minutes context in existing repo data. Rows with \`existing_project_data\` have a club from the existing roster/project context but no verified club minutes in the inspected sources. Thin profiles remain explicit and should not receive invented club, league, starts, or minutes.
`;
}

function buildUsageReport({ usageRows, coverage }) {
  const confidenceCountsText = Object.entries(statusCounts(usageRows, "usage_confidence"))
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([status, count]) => `- ${status}: ${count}`)
    .join("\n");
  const roleCountsText = Object.entries(statusCounts(usageRows, "recent_nt_role"))
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([status, count]) => `- ${status}: ${count}`)
    .join("\n");

  return `# Player National-Team Usage Report v1

Generated: ${TODAY}

## Scope

This report covers national-team and qualifier usage enrichment for the official fantasy player pool only. It does not rerun the minutes model, projections, recommendations, Team Builder, captain/substitution logic, browser-ready files, or UX.

## Summary

- Official fantasy players processed: ${coverage.totals.total_official_fantasy_players}
- Usage rows: ${usageRows.length}
- Players with national-team usage context: ${coverage.totals.players_with_national_team_usage}
- Players missing national-team usage context: ${coverage.totals.players_missing_national_team_usage}
- High usage confidence: ${coverage.totals.high_usage_confidence}
- Medium usage confidence: ${coverage.totals.medium_usage_confidence}
- Low usage confidence: ${coverage.totals.low_usage_confidence}
- Missing usage confidence: ${coverage.totals.missing_usage_confidence}
- Thin-profile missing usage confidence: ${coverage.totals.thin_profile_missing_usage_confidence}
- Thin profiles with usage context: ${coverage.totals.thin_profiles_with_usage_context}

## Usage Confidence Counts

${confidenceCountsText}

## Recent Role Counts

${roleCountsText}

## Missing Usage By Country

${markdownCounts(coverage.missing_coverage.countries_with_highest_missing_usage_context)}

## Missing Usage By Position

${markdownCounts(coverage.missing_coverage.positions_with_highest_missing_usage_context)}

## QA Flags

- Official fantasy players not found in usage output: ${coverage.qa.official_fantasy_players_not_found_in_usage_context.length}
- Usage confidence missing or thin-profile missing: ${coverage.qa.usage_confidence_missing}
- Role confidence missing or thin-profile missing: ${coverage.qa.role_confidence_missing}
- High-price players with missing usage: ${coverage.qa.high_price_players_with_missing_usage.length}
- Likely starters missing usage: ${coverage.qa.likely_starters_missing_usage.length}
- Goalkeepers without role confidence: ${coverage.qa.goalkeepers_without_role_confidence.length}
- Position conflicts carried from identity map: ${coverage.qa.position_conflicts_carried_from_identity_map}

## Interpretation

Qualifier usage is source-backed from existing national-team performance rows and OneFootball qualifier match pages where available. Targeted import rows can add source-backed recent starts, minutes, or low-confidence role evidence for high-impact audit targets, while \`missing_source_gap\` rows remain documentation only. OneFootball minutes are supplemental and may be estimated from lineup and substitution clocks. Missing usage remains missing; it is not treated as average. Set-piece columns only carry sparse existing club-performance hints where present and are not official national-team set-piece duties.
`;
}

function buildCoverageMarkdown(coverage) {
  const highRisk = coverage.high_risk_missing_data_cases.slice(0, 15).map((row) =>
    `| ${row.official_fantasy_player_id} | ${row.name} | ${row.country} | ${row.position} | ${row.official_price} | ${row.missing_club ? "yes" : "no"} | ${row.missing_usage ? "yes" : "no"} | ${row.flags} |`
  ).join("\n") || "| None | | | | | | | |";

  return `# Player Data Coverage Report v1

Generated: ${TODAY}

## Scope

This report summarizes enrichment coverage for all official fantasy players after the clean identity-map pass. It does not update active model inputs or browser-ready files.

## Coverage Summary

| Metric | Count |
| --- | ---: |
| Total official fantasy players | ${coverage.totals.total_official_fantasy_players} |
| Players with club context | ${coverage.totals.players_with_club_context} |
| Players missing club context | ${coverage.totals.players_missing_club_context} |
| Players with national-team usage | ${coverage.totals.players_with_national_team_usage} |
| Players missing national-team usage | ${coverage.totals.players_missing_national_team_usage} |
| High usage confidence | ${coverage.totals.high_usage_confidence} |
| Medium usage confidence | ${coverage.totals.medium_usage_confidence} |
| Low usage confidence | ${coverage.totals.low_usage_confidence} |
| Thin profiles | ${coverage.totals.thin_profiles} |
| Thin profiles with club context | ${coverage.totals.thin_profiles_with_club_context} |
| Thin profiles with usage context | ${coverage.totals.thin_profiles_with_usage_context} |
| Position-conflict players | ${coverage.totals.position_conflict_players} |
| Players with missing enrichment | ${coverage.totals.players_with_missing_enrichment} |

## Missing Coverage By Country

Club context:

${markdownCounts(coverage.missing_coverage.countries_with_highest_missing_club_context)}

National-team usage:

${markdownCounts(coverage.missing_coverage.countries_with_highest_missing_usage_context)}

Any missing enrichment:

${markdownCounts(coverage.missing_coverage.countries_with_highest_missing_any_enrichment)}

## Missing Coverage By Position

Club context:

${markdownCounts(coverage.missing_coverage.positions_with_highest_missing_club_context)}

National-team usage:

${markdownCounts(coverage.missing_coverage.positions_with_highest_missing_usage_context)}

Any missing enrichment:

${markdownCounts(coverage.missing_coverage.positions_with_highest_missing_any_enrichment)}

## High-Risk Missing-Data Cases

| Official ID | Name | Country | Position | Price | Missing club | Missing usage | Flags |
| --- | --- | --- | --- | ---: | --- | --- | --- |
${highRisk}

## QA Gates

- Official players missing club-context output rows: ${coverage.qa.official_fantasy_players_not_found_in_club_context.length}
- Official players missing usage output rows: ${coverage.qa.official_fantasy_players_not_found_in_usage_context.length}
- Duplicate official fantasy IDs: ${coverage.qa.duplicate_official_fantasy_player_ids.length}
- Duplicate existing internal IDs where not expected: ${coverage.qa.duplicate_internal_player_ids_where_not_expected.length}
- Missing club role confidence: ${coverage.qa.club_role_confidence_missing}
- Missing usage confidence: ${coverage.qa.usage_confidence_missing}
- Position conflicts carried from identity map: ${coverage.qa.position_conflicts_carried_from_identity_map}
- High-price players with missing usage: ${coverage.qa.high_price_players_with_missing_usage.length}
- Likely starters missing usage: ${coverage.qa.likely_starters_missing_usage.length}
- Goalkeepers without role confidence: ${coverage.qa.goalkeepers_without_role_confidence.length}

## Minutes-Model Readiness

Coverage status: \`${coverage.qa.minutes_model_sufficiency}\`

This enrichment layer is complete as an inventory and QA layer for all 1,481 official fantasy players. It is not yet sufficient for a final official minutes model because missing club/usage context, thin profiles, final squads, and official rules still need review before model reruns.
`;
}

async function main() {
  await mkdir(path.dirname(PATHS.clubContext), { recursive: true });

  const [
    officialData,
    officialImportRows,
    identityRows,
    manualOverrideRows,
    playersData,
    recommendationData,
    nationalData,
    performanceData,
    minutesData,
    financeData,
    valueData,
    oneFootballClubData,
    qualifierSeasonData,
    qualifierMatchData,
    targetedUsageRows,
    espnSummaryMatchedSeasonData,
    espnRosterLeaderboardData,
    espnDetailedData,
    espnExpandedData,
    rootPlayersData
  ] = await Promise.all([
    readJson(PATHS.officialPlayers),
    readOptionalCsv(PATHS.officialImportCsv),
    readCsv(PATHS.identityMap),
    readOptionalCsv(PATHS.identityOverrides),
    readJson(PATHS.players),
    readJson(PATHS.recommendationInputs),
    readJson(PATHS.nationalPerformance),
    readJson(PATHS.playerPerformance),
    readJson(PATHS.minutesModel),
    readJson(PATHS.financeMetrics),
    readJson(PATHS.valueModel),
    readJson(PATHS.oneFootballClub),
    readJson(PATHS.oneFootballQualifierSeason),
    readJson(PATHS.oneFootballQualifierMatch),
    readOptionalCsv(PATHS.targetedUsageImport),
    readOptionalJson(PATHS.espnSummaryMatchedSeasonStats),
    readOptionalJson(PATHS.espnRosterLeaderboardMatches),
    readOptionalJson(PATHS.espnDetailedRoster),
    readOptionalJson(PATHS.espnExpandedMatched),
    readOptionalJson(PATHS.rootPlayers)
  ]);

  const sourceCheckedByFile = {
    [PATHS.officialPlayers]: officialData.source_checked,
    [PATHS.officialImportCsv]: officialImportRows.find((row) => hasValue(row.source_checked))?.source_checked,
    [PATHS.players]: playersData.source_checked,
    [PATHS.recommendationInputs]: recommendationData.source_checked,
    [PATHS.nationalPerformance]: nationalData.source_checked,
    [PATHS.playerPerformance]: performanceData.source_checked,
    [PATHS.minutesModel]: minutesData.source_checked,
    [PATHS.financeMetrics]: financeData.source_checked,
    [PATHS.valueModel]: valueData.source_checked,
    [PATHS.oneFootballClub]: oneFootballClubData.source_checked,
    [PATHS.oneFootballQualifierSeason]: qualifierSeasonData.source_checked,
    [PATHS.oneFootballQualifierMatch]: qualifierMatchData.source_checked,
    [PATHS.targetedUsageImport]: targetedUsageRows.find((row) => hasValue(row.source_checked))?.source_checked,
    [PATHS.espnSummaryMatchedSeasonStats]: espnSummaryMatchedSeasonData?.source_checked,
    [PATHS.espnRosterLeaderboardMatches]: espnRosterLeaderboardData?.source_checked,
    [PATHS.espnDetailedRoster]: espnDetailedData?.source_checked,
    [PATHS.espnExpandedMatched]: espnExpandedData?.source_checked
  };

  const officialRows = officialData.officialFantasyPlayers || [];
  const officialById = indexBy(officialRows, "official_fantasy_player_id");
  const players = playersData.players || [];
  const recommendations = recommendationData.recommendationInputs || [];
  const nationalRows = nationalData.nationalTeamPerformance || [];
  const performanceRows = performanceData.playerPerformance || [];
  const minutesRows = minutesData.playerMinutesModel || [];
  const financeRows = financeData.playerFinanceMetrics || [];
  const oneFootballClubRows = oneFootballClubData.rows || [];
  const qualifierSeasonRows = qualifierSeasonData.rows || [];
  const qualifierMatchRows = qualifierMatchData.rows || [];
  const espnSummaryRows = espnSummaryMatchedSeasonData?.rows || [];
  const espnLeaderboardRows = espnRosterLeaderboardData?.matches || [];

  const context = {
    identityRows,
    officialById,
    playersById: indexBy(players, "player_id"),
    recommendationById: indexBy(recommendations, "player_id"),
    nationalById: indexBy(nationalRows, "player_id"),
    performanceById: indexBy(performanceRows, "player_id"),
    minutesById: indexBy(minutesRows, "player_id"),
    financeById: indexBy(financeRows, "player_id"),
    oneFootballClubById: indexBy(oneFootballClubRows, "roster_player_id"),
    qualifierSeasonById: indexBy(qualifierSeasonRows, "roster_player_id"),
    qualifierMatchRowsById: rowsBy(qualifierMatchRows, "roster_player_id"),
    targetedUsageByOfficialId: indexBy(targetedUsageRows, "official_fantasy_player_id"),
    sourceCheckedByFile
  };

  const clubRows = buildClubRows(context);
  const usageRows = buildUsageRows(context);
  const coverage = coverageReport({ identityRows, clubRows, usageRows });

  const counts = {
    officialPlayers: officialRows.length,
    officialImportRows: officialImportRows.length,
    manualOverrideRows: manualOverrideRows.length,
    identityRows: identityRows.length,
    players: players.length,
    recommendationInputs: recommendations.length,
    nationalPerformance: nationalRows.length,
    playerPerformance: performanceRows.length,
    targetedUsageImport: targetedUsageRows.length,
    minutesModel: minutesRows.length,
    financeMetrics: financeRows.length,
    playerValueModel: valueData.playerValueModel?.length || 0,
    oneFootballClub: oneFootballClubRows.length,
    oneFootballQualifierSeason: qualifierSeasonRows.length,
    oneFootballQualifierMatch: qualifierMatchRows.length,
    espnSummaryMatchedSeasonStats: espnSummaryRows.length,
    espnRosterLeaderboardMatches: espnLeaderboardRows.length,
    espnDetailedRoster: espnDetailedData?.matches?.length || 0,
    espnExpandedMatched: espnExpandedData?.rows?.length || 0,
    rootPlayers: Array.isArray(rootPlayersData) ? rootPlayersData.length : 0,
    playersDataJsLines: await lineCount(PATHS.playersDataJs),
    financePlayersDataJsLines: await lineCount(PATHS.financePlayersDataJs),
    matchdayProjectionsDataJsLines: await lineCount(PATHS.matchdayProjectionsDataJs),
    scorePredictionsDataJsLines: await lineCount(PATHS.scorePredictionsDataJs)
  };

  await writeFile(PATHS.sourceInventory, buildSourceInventory({ filesMeta: sourceCheckedByFile, counts }), "utf8");
  await writeFile(PATHS.clubContext, toCsv(CLUB_HEADERS, clubRows), "utf8");
  await writeFile(PATHS.clubReport, buildClubReport({ clubRows, coverage }), "utf8");
  await writeFile(PATHS.qualifierUsage, toCsv(USAGE_HEADERS, usageRows), "utf8");
  await writeFile(PATHS.usageReport, buildUsageReport({ usageRows, coverage }), "utf8");
  await writeFile(PATHS.coverageJson, JSON.stringify(coverage, null, 2) + "\n", "utf8");
  await writeFile(PATHS.coverageMd, buildCoverageMarkdown(coverage), "utf8");
  await writeFile(PATHS.highRiskAudit, buildHighRiskAuditReport({
    coverage,
    identityRows,
    clubRows,
    usageRows,
    officialRows,
    officialImportRows,
    manualOverrides: manualOverrideRows,
    sources: {
      playersById: context.playersById,
      recommendationById: context.recommendationById,
      nationalById: context.nationalById,
      performanceById: context.performanceById,
      minutesById: context.minutesById,
      espnSummaryById: indexBy(espnSummaryRows, "roster_player_id"),
      espnLeaderboardRowsById: rowsBy(espnLeaderboardRows, "player_id")
    }
  }), "utf8");

  console.log(`${PATHS.clubContext}: ${clubRows.length} rows`);
  console.log(`${PATHS.qualifierUsage}: ${usageRows.length} rows`);
  console.log(`${PATHS.highRiskAudit}: written`);
  console.log(`${PATHS.coverageJson}: ${coverage.totals.total_official_fantasy_players} official players`);
  console.log(`club context: ${coverage.totals.players_with_club_context}/${coverage.totals.total_official_fantasy_players}`);
  console.log(`usage context: ${coverage.totals.players_with_national_team_usage}/${coverage.totals.total_official_fantasy_players}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
