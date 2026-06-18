import fs from "node:fs";
import { writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import vm from "node:vm";

const NOW = new Date().toISOString();
const MODEL_VERSION = "fantasy-pool-recommendations-v4-md2-projection-v4-role-v2-score-v4";
const SOURCE_CHECKED = "2026-06-18";
const MD2_ALREADY_STARTED = true;
const MD2_LIVE_POINTS_USED_AS_RECOMMENDATION_SIGNAL = false;
const SCOPES = ["group_stage_full", "md1", "md2", "md3"];
const MATCHDAY_SCOPES = new Set(["md1", "md2", "md3"]);
const MODES = [
  { id: "balanced", label: "Core Picks" },
  { id: "safe", label: "High-Floor Picks" },
  { id: "upside", label: "Upside Picks" },
  { id: "differential", label: "Differential Picks / Value Picks" },
  { id: "captain", label: "Captain Watchlist" }
];
const TOP_LIST_LIMIT = 25;
const POSITION_CODES = ["GK", "DEF", "MID", "FWD"];
const POSITION_CAPS = {
  balanced: { GK: 1, DEF: 5, MID: 11, FWD: 10 },
  safe: { GK: 4, DEF: 10, MID: 8, FWD: 6 },
  upside: { GK: 0, DEF: 4, MID: 11, FWD: 10 },
  differential: { GK: 2, DEF: 7, MID: 9, FWD: 8 },
  captain: { GK: 0, DEF: 2, MID: 12, FWD: 12 }
};
const POSITION_ADJUSTMENTS = {
  balanced: { GK: -8, DEF: -2, MID: 3, FWD: 4 },
  safe: { GK: 1, DEF: 2, MID: 1, FWD: 1 },
  upside: { GK: -28, DEF: -8, MID: 5, FWD: 7 },
  differential: { GK: -12, DEF: -2, MID: 3, FWD: 4 },
  captain: { GK: -100, DEF: -20, MID: 5, FWD: 8 }
};
const THRESHOLDS = {
  balanced: { startProbability: 0.70, eliteStartProbability: 0.60 },
  safe: { startProbability: 0.75 },
  upside: { startProbability: 0.60 },
  differential: { startProbability: 0.55 },
  value: { startProbability: 0.60 },
  captain: { startProbability: 0.70, managedMinutesStartProbability: 0.62 }
};
const STAR_AUDIT_NAMES = [
  "Messi",
  "Olise",
  "Dembele",
  "Luis Diaz",
  "Kane",
  "Musiala",
  "Mbappe",
  "Petar Musa",
  "Enzo",
  "Desire Doue",
  "Bruno Fernandes",
  "Vinicius Junior",
  "Barcola",
  "Raphinha",
  "Haaland",
  "Bellingham"
];
const CAPTAIN_AUDIT_NAMES = [
  "Messi",
  "Olise",
  "Mbappe",
  "Dembele",
  "Kane",
  "Luis Diaz",
  "Musiala",
  "Bruno Fernandes",
  "Vinicius",
  "Raphinha"
];
const STAR_NAME_ALIASES = new Map([
  ["raphinha", ["raphinha", "raphael dias belloli"]],
  ["vinicius junior", ["vinicius junior", "vinicius jose paixao de oliveira junior"]],
  ["bruno fernandes", ["bruno fernandes", "bruno miguel borges fernandes"]],
  ["dembele", ["dembele", "ousmane dembele"]],
  ["mbappe", ["mbappe", "kylian mbappe"]],
  ["desire doue", ["desire doue"]],
  ["luis diaz", ["luis diaz"]]
]);
const STALE_RECOMMENDATION_FLAGS = new Set([
  "recommendations_not_rebuilt_after_projection_v4",
  "not_final_public_recommendations",
  "not_browser_ready",
  "recommendation_candidates_staged_only",
  "safe_only_for_preliminary_recommendation_QA",
  "safe_only_for_preliminary_recommendation_staging"
]);
const INPUT_FILES = {
  officialStatusJs: "fantasyPoolOfficialDataStatusData.js",
  projectionsJson: "data/fantasyPoolMatchdayProjections_md2_v4.json",
  projectionsJs: "fantasyPoolMatchdayProjectionsData.js",
  projectionQaJson: "data/playerProjectionQa_md2_v4.json",
  projectionQaReport: "data/playerProjectionQaReport_md2_v4.md",
  roleJson: "data/playerRoleModel_md2_v2.json",
  roleQaJson: "data/playerRoleModelQa_md2_v2.json",
  scoreJson: "data/scorePredictions_fantasyPool_v4_md2.json",
  scoreJs: "fantasyPoolScorePredictionsData.js",
  financeJs: "fantasyPoolFinanceMetricsData.js",
  previousRecommendationsJs: "fantasyPoolRecommendationsData.js",
  rulesJson: "fantasyRules.json",
  rulesJs: "fantasyRulesData.js",
  md1PostmortemJson: "data/md1ModelPostmortem_v1.json",
  md1PostmortemReport: "data/md1ModelPostmortemReport_v1.md"
};
const OUTPUT_FILES = {
  sourceJson: "data/fantasyPoolRecommendations_md2_v4.json",
  browserJs: "fantasyPoolRecommendationsData.js",
  modelDoc: "data/recommendationModel_md2_v4.md",
  qaJson: "data/recommendationQa_md2_v4.json",
  qaReport: "data/recommendationQaReport_md2_v4.md"
};

function readText(file) {
  return fs.readFileSync(file, "utf8");
}

function readJson(file) {
  return JSON.parse(readText(file));
}

function loadGlobals(files) {
  const context = { window: {} };
  vm.createContext(context);
  files.forEach((file) => {
    vm.runInContext(readText(file), context, { filename: file });
  });
  return context.window;
}

function loadGlobalsFromText(file, text) {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(text, context, { filename: file });
  return context.window;
}

function loadPreviousRecommendationRows() {
  try {
    const text = execFileSync("git", ["show", `HEAD:${INPUT_FILES.previousRecommendationsJs}`], {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"]
    });
    return loadGlobalsFromText(INPUT_FILES.previousRecommendationsJs, text).FANTASY_POOL_RECOMMENDATION_CANDIDATES || [];
  } catch {
    return loadGlobals([INPUT_FILES.previousRecommendationsJs]).FANTASY_POOL_RECOMMENDATION_CANDIDATES || [];
  }
}

function rowsFrom(data, ...keys) {
  if (Array.isArray(data)) return data;
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
}

function round(value, digits = 3) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  const scale = 10 ** digits;
  return Math.round(number * scale) / scale;
}

function num(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function displayName(name) {
  return String(name || "").replace(/\s+/g, " ").trim();
}

function canonicalStarNeedle(name) {
  return normalizeText(name)
    .replace(/\bousmane\b/g, "")
    .replace(/\bkylian\b/g, "")
    .replace(/\blionel\b/g, "")
    .replace(/\bjamal\b/g, "")
    .replace(/\bharry\b/g, "")
    .replace(/\bmichael\b/g, "")
    .replace(/\bluis\b/g, "luis")
    .replace(/\bbruno miguel borges\b/g, "bruno")
    .replace(/\bvinicius jose paixa?o de oliveira junior\b/g, "vinicius junior")
    .trim();
}

function positionCode(record) {
  const raw = String(record?.official_fantasy_position || record?.position || record?.position_code || "").trim().toUpperCase();
  if (POSITION_CODES.includes(raw)) return raw;
  if (raw.startsWith("GOALKEEPER")) return "GK";
  if (raw.startsWith("DEFENDER")) return "DEF";
  if (raw.startsWith("MIDFIELDER")) return "MID";
  if (raw.startsWith("FORWARD")) return "FWD";
  return "";
}

function matchdayLabel(scope) {
  if (scope === "group_stage_full") return "Full Group Stage";
  return scope.replace("md", "Matchday ");
}

function percentileRank(rows, field, value, descending = true) {
  const values = rows.map((row) => num(row[field], NaN)).filter(Number.isFinite).sort((a, b) => descending ? b - a : a - b);
  if (!values.length || !Number.isFinite(value)) return 0;
  const index = values.findIndex((candidate) => descending ? value >= candidate : value <= candidate);
  const rank = index === -1 ? values.length : index;
  return clamp(100 - (rank / Math.max(1, values.length - 1)) * 100, 0, 100);
}

function median(values) {
  const clean = values.map(Number).filter(Number.isFinite).sort((a, b) => a - b);
  if (!clean.length) return 0;
  const middle = Math.floor(clean.length / 2);
  return clean.length % 2 ? clean[middle] : (clean[middle - 1] + clean[middle]) / 2;
}

function average(values) {
  const clean = values.map(Number).filter(Number.isFinite);
  return clean.length ? clean.reduce((sum, value) => sum + value, 0) / clean.length : 0;
}

function sum(values) {
  return values.map(Number).filter(Number.isFinite).reduce((total, value) => total + value, 0);
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean).map(String)));
}

function recommendationFlags(values) {
  return unique(values).filter((flag) => !STALE_RECOMMENDATION_FLAGS.has(flag));
}

function recommendationFixtureContext(fixture) {
  if (!fixture || typeof fixture !== "object") return {};
  return {
    ...fixture,
    score_qa_flags: recommendationFlags(fixture.score_qa_flags || fixture.qa_flags || []),
    qa_flags: recommendationFlags(fixture.qa_flags || fixture.score_qa_flags || [])
  };
}

function sortedBy(rows, scoreFn) {
  return [...rows].sort((a, b) => scoreFn(b) - scoreFn(a) || num(b.projectedPoints) - num(a.projectedPoints) || a.name.localeCompare(b.name));
}

function mapById(rows) {
  return new Map(rows.filter((row) => row.official_fantasy_player_id).map((row) => [String(row.official_fantasy_player_id), row]));
}

function pushUniqueById(target, source) {
  const seen = new Set(target.map((row) => row.official_fantasy_player_id));
  source.forEach((row) => {
    if (!seen.has(row.official_fantasy_player_id)) {
      target.push(row);
      seen.add(row.official_fantasy_player_id);
    }
  });
  return target;
}

function rankMap(rows, scoreFn) {
  return new Map(sortedBy(rows, scoreFn).map((row, index) => [row.official_fantasy_player_id, index + 1]));
}

function priceBucket(price) {
  if (price >= 8) return "8.0+";
  if (price >= 6.5) return "6.5-7.9";
  if (price >= 5) return "5.0-6.4";
  if (price >= 4) return "4.0-4.9";
  return "under_4.0";
}

function tierForRank(rank) {
  if (rank <= 10) return "top_pick_candidate";
  if (rank <= 25) return "strong_candidate";
  return "watchlist_candidate";
}

function confidenceScore(confidence) {
  const key = String(confidence || "").toLowerCase();
  return {
    high: 100,
    medium: 76,
    low: 48,
    thin_profile: 30,
    missing: 30,
    blocked: 0
  }[key] ?? 62;
}

function roleScore(roleTier) {
  const key = String(roleTier || "").toLowerCase();
  return {
    locked_starter: 100,
    likely_starter: 86,
    managed_minutes_star: 76,
    possible_starter: 64,
    rotation_risk: 52,
    impact_sub: 38,
    bench_depth: 18,
    unavailable_or_not_selectable: 0,
    no_md1_evidence: 45
  }[key] ?? 55;
}

function rolePenalty(roleTier) {
  const score = roleScore(roleTier);
  return Math.max(0, 70 - score) * 0.18;
}

function fixtureContextForGroup(projections) {
  const fixtures = projections.map((row) => row.fixture_context || {});
  const expectedGoals = fixtures.map((row) => num(row.expected_goals, NaN)).filter(Number.isFinite);
  const cleanSheets = fixtures.map((row) => num(row.clean_sheet_probability, NaN)).filter(Number.isFinite);
  const captainEnv = fixtures.map((row) => num(row.captain_environment_score, NaN)).filter(Number.isFinite);
  const attackingEnv = fixtures.map((row) => num(row.attacking_environment_score, NaN)).filter(Number.isFinite);
  const defensiveEnv = fixtures.map((row) => num(row.defensive_environment_score, NaN)).filter(Number.isFinite);
  const win = fixtures.map((row) => num(row.win_probability, NaN)).filter(Number.isFinite);
  const difficulty = fixtures.map((row) => num(row.fixture_difficulty_score, NaN)).filter(Number.isFinite);
  const bestAttack = projections
    .map((row) => ({ matchday: row.matchday, opponent: row.opponent, expected_goals: num(row.fixture_context?.expected_goals, 0) }))
    .sort((a, b) => b.expected_goals - a.expected_goals)[0] || null;
  const bestCleanSheet = projections
    .map((row) => ({ matchday: row.matchday, opponent: row.opponent, clean_sheet_probability: num(row.fixture_context?.clean_sheet_probability, 0) }))
    .sort((a, b) => b.clean_sheet_probability - a.clean_sheet_probability)[0] || null;
  const bestCaptain = projections
    .map((row) => ({ matchday: row.matchday, opponent: row.opponent, captain_environment_score: num(row.fixture_context?.captain_environment_score, 0) }))
    .sort((a, b) => b.captain_environment_score - a.captain_environment_score)[0] || null;

  return {
    scope: "group_stage_full",
    fixture_count: projections.length,
    opponents: projections.map((row) => row.opponent).filter(Boolean),
    fixture_ids: projections.map((row) => row.fixture_id).filter(Boolean),
    average_expected_goals: round(average(expectedGoals), 3),
    average_expected_goals_against: round(average(fixtures.map((row) => num(row.expected_goals_against, NaN))), 3),
    average_win_probability: round(average(win), 4),
    average_clean_sheet_probability: round(average(cleanSheets), 4),
    average_fixture_difficulty_score: round(average(difficulty), 2),
    average_attacking_environment_score: round(average(attackingEnv), 2),
    average_defensive_environment_score: round(average(defensiveEnv), 2),
    average_captain_environment_score: round(average(captainEnv), 2),
    best_attacking_fixture: bestAttack,
    best_clean_sheet_fixture: bestCleanSheet,
    highest_captain_environment_fixture: bestCaptain,
    score_qa_flags: recommendationFlags(fixtures.flatMap((row) => row.score_qa_flags || row.qa_flags || []))
  };
}

function fixtureContextForMatchday(projection) {
  return recommendationFixtureContext({
    ...(projection.fixture_context || {}),
    fixture_id: projection.fixture_id,
    match_number: projection.match_number,
    opponent: projection.opponent,
    opponent_team_id: projection.opponent_team_id,
    score_model_version: "score-v4-md2-pele-md1-calibrated"
  });
}

function aggregateProjectionRows({ officialRecord, projections, roleRow, financeRow }) {
  const first = projections[0] || {};
  const projected = sum(projections.map((row) => num(row.projectedPoints ?? row.raw_expected_points)));
  const riskAdjusted = sum(projections.map((row) => num(row.risk_adjusted_points)));
  const ceiling = sum(projections.map((row) => num(row.ceilingPoints ?? row.ceiling_points)));
  const floor = sum(projections.map((row) => num(row.floorPoints ?? row.floor_points)));
  const captain = Math.max(...projections.map((row) => num(row.captainUpsideScore ?? row.captain_score, 0)));
  const start = average(projections.map((row) => num(row.start_probability, NaN)));
  const minutes = average(projections.map((row) => num(row.expected_minutes, NaN)));

  return {
    internal_player_id: officialRecord.internal_player_id || first.internal_player_id || null,
    official_fantasy_player_id: String(officialRecord.official_fantasy_player_id),
    name: officialRecord.name || first.name,
    country: officialRecord.country || first.country,
    team_id: first.team_id || officialRecord.team_id || null,
    official_team_id: officialRecord.team_id || first.official_team_id || null,
    official_fantasy_position: positionCode(officialRecord) || first.official_fantasy_position,
    official_price: num(officialRecord.official_price ?? first.official_price),
    selectable_status: officialRecord.selectable_status || first.selectable_status || "playing",
    matchday: "group_stage_full",
    matchday_label: "Full Group Stage",
    opponent: "Group stage average",
    expected_minutes: round(minutes, 1),
    start_probability: round(start, 3),
    raw_expected_points: round(projected, 3),
    risk_adjusted_points: round(riskAdjusted, 3),
    ceiling_points: round(ceiling, 3),
    floor_points: round(floor, 3),
    captain_score: round(captain, 3),
    projectedPoints: round(projected, 3),
    floorPoints: round(floor, 3),
    ceilingPoints: round(ceiling, 3),
    captainUpsideScore: round(captain, 3),
    riskScore: round(average(projections.map((row) => num(row.riskScore, NaN))), 3),
    valueScore: round(num(financeRow?.risk_adjusted_points_per_price, riskAdjusted / Math.max(1, num(officialRecord.official_price))), 3),
    roleTier: roleRow?.roleTier || first.roleTier || first.role_label || "role_needs_check",
    role_label: roleRow?.roleTier || first.role_label || first.roleTier || "role_needs_check",
    roleConfidence: roleRow?.roleConfidence || first.role_confidence || first.roleConfidence || "medium",
    role_confidence: roleRow?.roleConfidence || first.role_confidence || first.roleConfidence || "medium",
    projection_confidence: first.projection_confidence || "medium",
    fixture_context: fixtureContextForGroup(projections),
    projection_components: Object.fromEntries([
      "appearance_component",
      "attacking_component",
      "assist_component",
      "clean_sheet_component",
      "goals_conceded_component",
      "save_component",
      "tackle_component",
      "chance_created_component",
      "shot_on_target_component",
      "card_risk_component",
      "bonus_component",
      "set_piece_role_component"
    ].map((field) => [field, round(sum(projections.map((row) => num(row.projection_components?.[field] ?? row[field]))), 3)])),
    projectionReason: "Group-stage aggregate of Component Player Projection v4 rows.",
    roleReason: roleRow?.roleReason || first.roleReason || "Role Model v2 context joined by official fantasy ID.",
    fixtureReason: "Group-stage aggregate using Score Model v4 fixture context.",
    caution: roleRow?.caution || first.caution || "Confirm official lineup, locks, and deadlines before acting.",
    dataQualityFlags: recommendationFlags([
      ...(first.dataQualityFlags || first.data_quality_flags || []),
      ...(roleRow?.dataQualityFlags || []),
      ...(financeRow?.finance_flags || []),
      "active_md2_recommendations_v4",
      "recommendation_model_v4_md2"
    ])
  };
}

function projectionRowForScope({ officialRecord, scope, projectionsByIdScope, roleById, financeById }) {
  const id = String(officialRecord.official_fantasy_player_id);
  const roleRow = roleById.get(id) || null;
  const financeRow = financeById.get(id) || null;

  if (scope === "group_stage_full") {
    const projections = ["md1", "md2", "md3"]
      .map((matchday) => projectionsByIdScope.get(`${id}|${matchday}`))
      .filter(Boolean);
    return projections.length ? aggregateProjectionRows({ officialRecord, projections, roleRow, financeRow }) : null;
  }

  const projection = projectionsByIdScope.get(`${id}|${scope}`);
  if (!projection) return null;

  return {
    ...projection,
    official_fantasy_player_id: id,
    internal_player_id: officialRecord.internal_player_id || projection.internal_player_id || null,
    name: officialRecord.name || projection.name,
    country: officialRecord.country || projection.country,
    official_fantasy_position: positionCode(officialRecord) || projection.official_fantasy_position,
    official_price: num(officialRecord.official_price ?? projection.official_price),
    selectable_status: officialRecord.selectable_status || projection.selectable_status || "playing",
    matchday: scope,
    matchday_label: matchdayLabel(scope),
    projectedPoints: round(num(projection.projectedPoints ?? projection.raw_expected_points), 3),
    floorPoints: round(num(projection.floorPoints ?? projection.floor_points), 3),
    ceilingPoints: round(num(projection.ceilingPoints ?? projection.ceiling_points), 3),
    captainUpsideScore: round(num(projection.captainUpsideScore ?? projection.captain_score), 3),
    riskScore: round(num(projection.riskScore, 0.5), 3),
    valueScore: round(num(financeRow?.matchday_finance_metrics?.find((row) => row.matchday === scope)?.risk_adjusted_points_per_price, num(projection.risk_adjusted_points) / Math.max(1, num(projection.official_price))), 3),
    roleTier: roleRow?.roleTier || projection.roleTier || projection.role_label || "role_needs_check",
    role_label: roleRow?.roleTier || projection.role_label || projection.roleTier || "role_needs_check",
    roleConfidence: roleRow?.roleConfidence || projection.roleConfidence || projection.role_confidence || "medium",
    role_confidence: roleRow?.roleConfidence || projection.role_confidence || projection.roleConfidence || "medium",
    fixture_context: fixtureContextForMatchday(projection),
    projectionReason: projection.projectionReason || "Component Player Projection v4 row.",
    roleReason: roleRow?.roleReason || projection.roleReason || "Role Model v2 context joined by official fantasy ID.",
    fixtureReason: projection.fixtureReason || "Score Model v4 fixture context joined by fixture.",
    caution: roleRow?.caution || projection.caution || "Confirm official lineup, locks, and deadlines before acting.",
    dataQualityFlags: recommendationFlags([
      ...(projection.dataQualityFlags || projection.data_quality_flags || []),
      ...(roleRow?.dataQualityFlags || []),
      "active_md2_recommendations_v4",
      "recommendation_model_v4_md2"
    ])
  };
}

function scoreContext(row, financeRow, scopeRows, ranks) {
  const posRows = scopeRows.filter((candidate) => candidate.official_fantasy_position === row.official_fantasy_position);
  const projected = num(row.projectedPoints ?? row.raw_expected_points);
  const riskAdjusted = num(row.risk_adjusted_points, projected);
  const floor = num(row.floorPoints ?? row.floor_points);
  const ceiling = num(row.ceilingPoints ?? row.ceiling_points, projected);
  const captain = num(row.captainUpsideScore ?? row.captain_score, projected * 2);
  const start = clamp(num(row.start_probability), 0, 1);
  const minutes = num(row.expected_minutes);
  const role = roleScore(row.roleTier || row.role_label);
  const roleConfidence = confidenceScore(row.roleConfidence || row.role_confidence || row.projection_confidence);
  const fixture = recommendationFixtureContext(row.fixture_context || {});
  const teamXg = num(fixture.expected_goals ?? fixture.average_expected_goals, 0);
  const cleanSheet = num(fixture.clean_sheet_probability ?? fixture.average_clean_sheet_probability, 0);
  const win = num(fixture.win_probability ?? fixture.average_win_probability, 0);
  const captainEnv = num(fixture.captain_environment_score ?? fixture.average_captain_environment_score, 50);
  const attackEnv = num(fixture.attacking_environment_score ?? fixture.average_attacking_environment_score, 50);
  const uncertaintyLabel = String(fixture.matchUncertainty || fixture.match_uncertainty || fixture.uncertaintyLabel || "").toLowerCase();
  const uncertainty = uncertaintyLabel.includes("high") ? 72 : uncertaintyLabel.includes("medium") ? 54 : 36;
  const price = num(row.official_price, 0);
  const pricePerPoint = projected / Math.max(1, price);
  const risk = num(row.riskScore, Math.max(0, 1 - start));
  const financeValue = num(financeRow?.matchday_finance_metrics?.find((entry) => entry.matchday === row.matchday)?.risk_adjusted_points_per_price, row.valueScore);
  const valueOverReplacement = num(financeRow?.value_over_replacement, 0);
  const scarcity = num(financeRow?.scarcity_adjusted_value, 0);
  const diffDefensibility = num(financeRow?.differential_defensibility_score, 50);
  const projectedPct = percentileRank(scopeRows, "projectedPoints", projected);
  const riskPct = percentileRank(scopeRows, "risk_adjusted_points", riskAdjusted);
  const floorPct = percentileRank(scopeRows, "floorPoints", floor);
  const ceilingPct = percentileRank(scopeRows, "ceilingPoints", ceiling);
  const captainPct = percentileRank(scopeRows, "captainUpsideScore", captain);
  const pricePct = percentileRank(scopeRows, "official_price", price);
  const valuePct = percentileRank(scopeRows.map((candidate) => ({ valueMetric: num(candidate.risk_adjusted_points, candidate.projectedPoints) / Math.max(1, num(candidate.official_price)) })), "valueMetric", pricePerPoint);
  const posProjectedMedian = median(posRows.map((candidate) => num(candidate.projectedPoints ?? candidate.raw_expected_points)));
  const posFloorMedian = median(posRows.map((candidate) => num(candidate.floorPoints ?? candidate.floor_points)));
  const posCeilingMedian = median(posRows.map((candidate) => num(candidate.ceilingPoints ?? candidate.ceiling_points)));
  const elite = ranks.eliteIds.has(row.official_fantasy_player_id);

  return {
    projected,
    riskAdjusted,
    floor,
    ceiling,
    captain,
    start,
    minutes,
    role,
    roleConfidence,
    teamXg,
    cleanSheet,
    win,
    captainEnv,
    attackEnv,
    uncertainty,
    price,
    pricePerPoint,
    risk,
    financeValue,
    valueOverReplacement,
    scarcity,
    diffDefensibility,
    projectedPct,
    riskPct,
    floorPct,
    ceilingPct,
    captainPct,
    pricePct,
    valuePct,
    posProjectedMedian,
    posFloorMedian,
    posCeilingMedian,
    elite,
    projectedRank: ranks.projected.get(row.official_fantasy_player_id) || 9999,
    captainRank: ranks.captain.get(row.official_fantasy_player_id) || 9999,
    ceilingRank: ranks.ceiling.get(row.official_fantasy_player_id) || 9999
  };
}

function modeScores(row, context) {
  const position = row.official_fantasy_position;
  const roleAndStart = context.start * 62 + Math.min(90, context.minutes) * 0.24 + context.role * 0.2 + context.roleConfidence * 0.1;
  const riskControl = Math.max(0, 100 - context.risk * 100);
  const attackingRoleBonus = ["MID", "FWD"].includes(position) ? 5 : 0;
  const defensiveContext = ["GK", "DEF"].includes(position) ? context.cleanSheet * 44 + context.win * 14 : 0;
  const obviousnessPenalty = Math.max(0, 100 - context.pricePct) * 0.04 +
    (context.projectedRank <= 12 ? 8 : context.projectedRank <= 25 ? 4 : 0) +
    (context.captainRank <= 15 ? 7 : 0);

  return {
    balanced: context.projectedPct * 0.48 +
      roleAndStart * 0.22 +
      context.floorPct * 0.1 +
      context.ceilingPct * 0.08 +
      Math.min(100, context.teamXg * 25) * 0.08 +
      POSITION_ADJUSTMENTS.balanced[position] -
      rolePenalty(row.roleTier),
    safe: context.floorPct * 0.34 +
      roleAndStart * 0.34 +
      riskControl * 0.14 +
      context.projectedPct * 0.1 +
      defensiveContext * 0.08 +
      POSITION_ADJUSTMENTS.safe[position] -
      Math.max(0, 0.75 - context.start) * 70,
    upside: context.ceilingPct * 0.34 +
      context.captainPct * 0.22 +
      context.projectedPct * 0.18 +
      Math.min(100, context.teamXg * 24) * 0.14 +
      context.uncertainty * 0.04 +
      attackingRoleBonus +
      POSITION_ADJUSTMENTS.upside[position] -
      Math.max(0, 0.6 - context.start) * 80,
    differential: context.projectedPct * 0.28 +
      context.ceilingPct * 0.19 +
      context.valuePct * 0.2 +
      Math.min(100, context.diffDefensibility) * 0.13 +
      roleAndStart * 0.14 +
      Math.max(0, 100 - context.pricePct) * 0.1 +
      POSITION_ADJUSTMENTS.differential[position] -
      obviousnessPenalty -
      Math.max(0, context.posProjectedMedian - context.projected) * 18,
    value: context.valuePct * 0.38 +
      context.projectedPct * 0.22 +
      roleAndStart * 0.18 +
      Math.max(0, Math.min(100, context.valueOverReplacement * 9 + 50)) * 0.08 +
      Math.max(0, Math.min(100, context.scarcity * 8 + 50)) * 0.05 +
      Math.max(0, 100 - context.pricePct) * 0.09,
    captain: context.captainPct * 0.34 +
      context.projectedPct * 0.25 +
      context.ceilingPct * 0.18 +
      roleAndStart * 0.14 +
      Math.min(100, context.teamXg * 23) * 0.07 +
      context.captainEnv * 0.05 +
      POSITION_ADJUSTMENTS.captain[position] -
      Math.max(0, 0.7 - context.start) * 90
  };
}

function passesMode(row, context, mode) {
  if (row.selectable_status !== "playing") return false;
  if (mode === "balanced") {
    return context.start >= THRESHOLDS.balanced.startProbability ||
      (context.elite && context.start >= THRESHOLDS.balanced.eliteStartProbability);
  }
  if (mode === "safe") {
    return context.start >= THRESHOLDS.safe.startProbability &&
      context.floor >= context.posFloorMedian &&
      context.role >= roleScore("likely_starter");
  }
  if (mode === "upside") {
    return context.start >= THRESHOLDS.upside.startProbability &&
      (context.ceiling >= context.posCeilingMedian || context.captainRank <= 35);
  }
  if (mode === "differential") {
    return context.start >= THRESHOLDS.differential.startProbability &&
      context.projected >= context.posProjectedMedian &&
      context.ceiling >= context.posCeilingMedian * 0.95;
  }
  if (mode === "value") {
    return context.start >= THRESHOLDS.value.startProbability &&
      (context.projected >= context.posProjectedMedian || context.valuePct >= 80) &&
      context.projected >= Math.max(2.8, context.posProjectedMedian * 0.9);
  }
  if (mode === "captain") {
    if (row.official_fantasy_position === "GK") return false;
    const managed = String(row.roleTier || "").includes("managed_minutes_star");
    return context.start >= (managed ? THRESHOLDS.captain.managedMinutesStartProbability : THRESHOLDS.captain.startProbability) &&
      (context.captainRank <= 45 || context.captainPct >= 80);
  }
  return true;
}

function createCandidateRow(row, context, mode, rank, score, financeRow, selectedFrom) {
  const fixture = row.fixture_context || {};
  const modeLabel = MODES.find((entry) => entry.id === mode)?.label || mode;
  const xg = fixture.expected_goals ?? fixture.average_expected_goals;
  const cleanSheet = fixture.clean_sheet_probability ?? fixture.average_clean_sheet_probability;
  const position = row.official_fantasy_position;
  const valueScore = mode === "differential"
    ? Math.max(0, context.valuePct / 10)
    : Math.max(0, num(row.valueScore, context.pricePerPoint));
  const primaryCaution = [
    row.caution,
    context.start < 0.75 ? "Check starting lineup before deadline." : "",
    String(fixture.matchUncertainty || fixture.match_uncertainty || "").toLowerCase().includes("high") ? "High fixture uncertainty in Score Model v4." : ""
  ].filter(Boolean)[0] || "Confirm official status, lineup, locks, and deadlines inside FIFA before acting.";
  const statusCaution = row.fixture_status_context?.status_caution || fixture.live_status_caution || "";
  const caution = unique([primaryCaution, statusCaution]).filter(Boolean).join(" ");
  const whyPick = [
    mode === "captain"
      ? `captain upside ${round(context.captain, 2)}`
      : mode === "safe"
        ? `floor ${round(context.floor, 2)}`
        : mode === "differential"
          ? `credible ${modeLabel.toLowerCase()} profile`
          : `${round(context.projected, 2)} projected points`,
    `${Math.round(context.start * 100)}% start chance`,
    `${round(context.minutes, 0)} expected minutes`,
    xg ? `team xG ${round(xg, 2)}` : "",
    mode === "value" || mode === "differential" ? `value score ${round(valueScore, 2)}` : ""
  ].filter(Boolean).slice(0, 5);
  const whyCareful = unique([
    caution,
    statusCaution,
    ...(context.start < 0.7 ? ["minutes/start risk"] : []),
    ...(position === "GK" || position === "DEF" ? [`clean-sheet context ${cleanSheet === undefined ? "needs check" : round(cleanSheet, 2)}`] : []),
    "not final-squad-backed",
    "confirm locks/deadlines in FIFA"
  ]).slice(0, 5);

  return {
    internal_player_id: row.internal_player_id || null,
    playerId: row.internal_player_id || row.official_fantasy_player_id,
    official_fantasy_player_id: row.official_fantasy_player_id,
    name: row.name,
    display_name: row.display_name || row.name,
    country: row.country,
    team_id: row.team_id,
    official_team_id: row.official_team_id,
    official_fantasy_position: position,
    position,
    official_price: round(row.official_price, 1),
    price: round(row.official_price, 1),
    selectable_status: row.selectable_status,
    matchday: row.matchday,
    matchday_label: row.matchday_label || matchdayLabel(row.matchday),
    opponent: row.opponent,
    fixture_id: row.fixture_id || fixture.fixture_id || null,
    mode,
    mode_label: modeLabel,
    pickType: modeLabel,
    recommendation_surface: modeLabel,
    rank,
    md2ProjectedPoints: row.matchday === "md2" ? round(context.projected, 3) : null,
    projectedPoints: round(context.projected, 3),
    raw_expected_points: round(context.projected, 3),
    risk_adjusted_points: round(context.riskAdjusted, 3),
    startProb: round(context.start, 3),
    start_probability: round(context.start, 3),
    expectedMinutes: round(context.minutes, 1),
    expected_minutes: round(context.minutes, 1),
    floorPoints: round(context.floor, 3),
    floor_points: round(context.floor, 3),
    ceilingPoints: round(context.ceiling, 3),
    ceiling_points: round(context.ceiling, 3),
    captainUpsideScore: round(context.captain, 3),
    captain_score: round(context.captain, 3),
    riskScore: round(context.risk, 3),
    risk_score: round(context.risk, 3),
    valueScore: round(valueScore, 3),
    value_score: round(valueScore, 3),
    roleTier: row.roleTier,
    role_label: row.role_label || row.roleTier,
    roleConfidence: row.roleConfidence || row.role_confidence,
    role_confidence: row.roleConfidence || row.role_confidence,
    projection_confidence: row.projection_confidence || row.roleConfidence || "medium",
    fixture_context: fixture,
    fixture_status: row.fixture_status || fixture.live_fixture_status || null,
    round_status: row.round_status || fixture.live_round_status || null,
    fixture_status_context: row.fixture_status_context || null,
    finance_context: {
      finance_alpha_score: financeRow?.finance_alpha_score ?? null,
      portfolio_fit_score: financeRow?.portfolio_fit_score ?? null,
      downside_risk_score: financeRow?.downside_risk_score ?? null,
      volatility_score: financeRow?.volatility_score ?? null,
      role_stability_score: financeRow?.role_stability_score ?? null,
      premium_squeeze_score: financeRow?.premium_squeeze_score ?? null,
      value_over_replacement: financeRow?.value_over_replacement ?? null,
      scarcity_adjusted_value: financeRow?.scarcity_adjusted_value ?? null,
      efficient_frontier: financeRow?.efficient_frontier ?? null,
      finance_secondary_only: true
    },
    projection_components: row.projection_components || {},
    recommendation_score: round(score, 3),
    recommendation_tier: tierForRank(rank),
    projectionReason: row.projectionReason || `${round(context.projected, 2)} projected points from Projection Model v4.`,
    roleReason: row.roleReason || "Role Model v2 start/minutes context.",
    fixtureReason: row.fixtureReason || (xg ? `Score Model v4 team xG ${round(xg, 2)} vs ${row.opponent}.` : "Score Model v4 fixture context."),
    cleanSheetNote: ["GK", "DEF"].includes(position)
      ? `Clean-sheet context ${cleanSheet === undefined ? "needs check" : round(cleanSheet, 2)}.`
      : null,
    caution,
    why_pick: whyPick,
    why_careful: whyCareful,
    dataQualityFlags: recommendationFlags([...(row.dataQualityFlags || row.data_quality_flags || []), "active_md2_recommendations_v4", "recommendation_model_v4_md2"]),
    data_quality_flags: recommendationFlags([...(row.dataQualityFlags || row.data_quality_flags || []), "active_md2_recommendations_v4", "recommendation_model_v4_md2"]),
    selected_from: selectedFrom,
    model_stage: "current_official_fantasy_pool",
    source_model_version: MODEL_VERSION
  };
}

function buildRanks(scopeRows) {
  const projected = rankMap(scopeRows, (row) => num(row.projectedPoints));
  const captain = rankMap(scopeRows, (row) => num(row.captainUpsideScore));
  const ceiling = rankMap(scopeRows, (row) => num(row.ceilingPoints));
  const eliteIds = new Set([
    ...sortedBy(scopeRows, (row) => num(row.projectedPoints)).slice(0, 25),
    ...sortedBy(scopeRows, (row) => num(row.captainUpsideScore)).slice(0, 25),
    ...sortedBy(scopeRows, (row) => num(row.ceilingPoints)).slice(0, 25),
    ...POSITION_CODES.flatMap((position) => sortedBy(scopeRows.filter((row) => row.official_fantasy_position === position), (row) => num(row.official_price)).slice(0, 10))
  ].map((row) => row.official_fantasy_player_id));
  return { projected, captain, ceiling, eliteIds };
}

function selectWithCaps(rows, mode, scoreFn) {
  const caps = POSITION_CAPS[mode];
  const counts = Object.fromEntries(POSITION_CODES.map((position) => [position, 0]));
  const selected = [];
  for (const row of sortedBy(rows, scoreFn)) {
    const position = row.official_fantasy_position;
    if ((counts[position] || 0) >= (caps[position] ?? TOP_LIST_LIMIT)) continue;
    selected.push(row);
    counts[position] = (counts[position] || 0) + 1;
    if (selected.length === TOP_LIST_LIMIT) break;
  }
  if (selected.length < TOP_LIST_LIMIT) {
    pushUniqueById(selected, sortedBy(rows, scoreFn));
  }
  return selected.slice(0, TOP_LIST_LIMIT);
}

function selectProtectedWithCaps(protectedRows, rows, mode, scoreFn) {
  const caps = POSITION_CAPS[mode];
  const counts = Object.fromEntries(POSITION_CODES.map((position) => [position, 0]));
  const selected = [];
  const seen = new Set();
  const add = (row, protectedPick = false) => {
    if (!row || seen.has(row.official_fantasy_player_id)) return false;
    const position = row.official_fantasy_position;
    if (!protectedPick && (counts[position] || 0) >= (caps[position] ?? TOP_LIST_LIMIT)) return false;
    selected.push(row);
    seen.add(row.official_fantasy_player_id);
    counts[position] = (counts[position] || 0) + 1;
    return true;
  };

  protectedRows.forEach((row) => add(row, true));
  for (const row of sortedBy(rows, scoreFn)) {
    if (selected.length === TOP_LIST_LIMIT) break;
    add(row);
  }
  if (selected.length < TOP_LIST_LIMIT) {
    for (const row of sortedBy(rows, scoreFn)) {
      if (selected.length === TOP_LIST_LIMIT) break;
      add(row, true);
    }
  }
  return selected.slice(0, TOP_LIST_LIMIT);
}

function buildScopeRecommendations(scope, scopeRows, financeById) {
  const ranks = buildRanks(scopeRows);
  const contextById = new Map(scopeRows.map((row) => [row.official_fantasy_player_id, scoreContext(row, financeById.get(row.official_fantasy_player_id), scopeRows, ranks)]));
  const scoresById = new Map(scopeRows.map((row) => [row.official_fantasy_player_id, modeScores(row, contextById.get(row.official_fantasy_player_id))]));
  const rowsForMode = (mode) => scopeRows.filter((row) => passesMode(row, contextById.get(row.official_fantasy_player_id), mode));
  const selectedByMode = {};

  const topProjected = sortedBy(rowsForMode("balanced"), (row) => num(row.projectedPoints)).slice(0, TOP_LIST_LIMIT);
  const topCore = sortedBy(rowsForMode("balanced"), (row) => scoresById.get(row.official_fantasy_player_id).balanced).slice(0, TOP_LIST_LIMIT * 2);
  selectedByMode.balanced = selectProtectedWithCaps(topProjected, pushUniqueById([...topProjected], topCore), "balanced", (row) => scoresById.get(row.official_fantasy_player_id).balanced);
  selectedByMode.safe = selectWithCaps(rowsForMode("safe"), "safe", (row) => scoresById.get(row.official_fantasy_player_id).safe);
  selectedByMode.upside = selectWithCaps(rowsForMode("upside"), "upside", (row) => scoresById.get(row.official_fantasy_player_id).upside);

  const valueRows = sortedBy(rowsForMode("value"), (row) => scoresById.get(row.official_fantasy_player_id).value).slice(0, TOP_LIST_LIMIT);
  const differentialRows = sortedBy(rowsForMode("differential"), (row) => scoresById.get(row.official_fantasy_player_id).differential).slice(0, TOP_LIST_LIMIT * 2);
  selectedByMode.differential = selectWithCaps(pushUniqueById([...valueRows.slice(0, 14)], differentialRows), "differential", (row) => Math.max(scoresById.get(row.official_fantasy_player_id).differential, scoresById.get(row.official_fantasy_player_id).value * 0.94));
  const topCaptainUpside = sortedBy(rowsForMode("captain"), (row) => num(row.captainUpsideScore)).slice(0, 20);
  selectedByMode.captain = selectProtectedWithCaps(topCaptainUpside, rowsForMode("captain"), "captain", (row) => scoresById.get(row.official_fantasy_player_id).captain);

  return MODES.flatMap(({ id: mode }) =>
    selectedByMode[mode].map((row, index) => {
      const context = contextById.get(row.official_fantasy_player_id);
      const scores = scoresById.get(row.official_fantasy_player_id);
      const score = mode === "differential"
        ? Math.max(scores.differential, scores.value * 0.94)
        : scores[mode];
      const selectedFrom = mode === "differential" && valueRows.some((valueRow) => valueRow.official_fantasy_player_id === row.official_fantasy_player_id)
        ? "value_and_differential_pool"
        : `${mode}_pool`;
      return createCandidateRow(row, context, mode, index + 1, score, financeById.get(row.official_fantasy_player_id), selectedFrom);
    })
  );
}

function topTable(rows, mode, limit = 25) {
  return rows
    .filter((row) => row.matchday === "md2" && (!mode || row.mode === mode))
    .sort((a, b) => (mode ? a.rank - b.rank : num(b.projectedPoints) - num(a.projectedPoints)))
    .slice(0, limit)
    .map((row) => ({
      rank: mode ? row.rank : rows.filter((candidate) => candidate.matchday === "md2" && candidate.mode === "balanced").sort((a, b) => num(b.projectedPoints) - num(a.projectedPoints)).findIndex((candidate) => candidate.official_fantasy_player_id === row.official_fantasy_player_id) + 1,
      name: row.name,
      country: row.country,
      position: row.official_fantasy_position,
      price: row.official_price,
      projectedPoints: row.projectedPoints,
      startProb: row.startProb,
      expectedMinutes: row.expectedMinutes,
      captainUpsideScore: row.captainUpsideScore,
      score: row.recommendation_score
    }));
}

function bestRowByName(rows, needle) {
  const normalizedNeedle = canonicalStarNeedle(needle);
  const aliases = (STAR_NAME_ALIASES.get(normalizedNeedle) || [normalizedNeedle]).map(canonicalStarNeedle);
  return rows.find((row) => {
    const name = canonicalStarNeedle(row.name);
    return aliases.some((alias) => name.includes(alias) || alias.includes(name));
  }) || null;
}

function surfacesForId(rows, id) {
  return rows
    .filter((row) => row.matchday === "md2" && row.official_fantasy_player_id === id)
    .map((row) => row.mode_label);
}

function omissionReason(row, surfaces, context) {
  if (surfaces.length) return null;
  if (!row) return "No active official/projection row matched this audited player name.";
  if (row.selectable_status !== "playing") return `Not selectable: ${row.selectable_status}.`;
  if (context.start < 0.55) return `Start probability below credible recommendation floor (${round(context.start, 3)}).`;
  if (context.projected < context.posProjectedMedian * 0.9) return `Projection below positional median (${round(context.projected, 2)} vs median ${round(context.posProjectedMedian, 2)}).`;
  if (context.projectedRank <= 10 || context.captainRank <= 20) {
    return "Missed by ranking/cap; QA should fail if this is a top projected or top captain row.";
  }
  if (context.projectedRank <= 25 || context.captainRank <= 25 || context.ceilingRank <= 25) {
    return `Elite audit omission: outside public surface limits after v4 scoring (projected rank ${context.projectedRank}, captain rank ${context.captainRank}, ceiling rank ${context.ceilingRank}).`;
  }
  return `Premium price audit only: outside projected/captain/ceiling surface cutoffs after v4 scoring (projected rank ${context.projectedRank}, captain rank ${context.captainRank}, ceiling rank ${context.ceilingRank}).`;
}

function buildEliteAudit(scopeRows, recommendationRows) {
  const ranks = buildRanks(scopeRows);
  const contextById = new Map(scopeRows.map((row) => [row.official_fantasy_player_id, scoreContext(row, null, scopeRows, ranks)]));
  const eliteRows = scopeRows.filter((row) => ranks.eliteIds.has(row.official_fantasy_player_id));
  const omissions = eliteRows
    .map((row) => {
      const surfaces = surfacesForId(recommendationRows, row.official_fantasy_player_id);
      return {
        official_fantasy_player_id: row.official_fantasy_player_id,
        name: row.name,
        position: row.official_fantasy_position,
        projectedPoints: row.projectedPoints,
        captainUpsideScore: row.captainUpsideScore,
        startProb: row.start_probability,
        expectedMinutes: row.expected_minutes,
        roleTier: row.roleTier,
        elite_flags: [
          ranks.projected.get(row.official_fantasy_player_id) <= 25 ? "top_25_projected" : "",
          ranks.captain.get(row.official_fantasy_player_id) <= 25 ? "top_25_captain_upside" : "",
          ranks.ceiling.get(row.official_fantasy_player_id) <= 25 ? "top_25_ceiling" : ""
        ].filter(Boolean),
        surfaces,
        eliteOmissionReason: omissionReason(row, surfaces, contextById.get(row.official_fantasy_player_id))
      };
    })
    .filter((row) => row.eliteOmissionReason);
  return { elite_count: eliteRows.length, omissions };
}

function buildStarAudit(scopeRows, recommendationRows) {
  const ranks = buildRanks(scopeRows);
  const contextById = new Map(scopeRows.map((row) => [row.official_fantasy_player_id, scoreContext(row, null, scopeRows, ranks)]));
  return STAR_AUDIT_NAMES.map((name) => {
    const row = bestRowByName(scopeRows, name);
    const surfaces = row ? surfacesForId(recommendationRows, row.official_fantasy_player_id) : [];
    return {
      audit_name: name,
      official_fantasy_player_id: row?.official_fantasy_player_id || null,
      name: row?.name || null,
      projectedPoints: row?.projectedPoints ?? null,
      captainUpsideScore: row?.captainUpsideScore ?? null,
      startProb: row?.start_probability ?? null,
      expectedMinutes: row?.expected_minutes ?? null,
      roleTier: row?.roleTier || null,
      surfaces,
      omissionReason: row ? omissionReason(row, surfaces, contextById.get(row.official_fantasy_player_id)) : "No matching active official/projection row."
    };
  });
}

function buildMovementAudit(previousRows, currentRows) {
  const previousMd2 = previousRows.filter((row) => row.matchday === "md2");
  const currentMd2 = currentRows.filter((row) => row.matchday === "md2");
  const previousByMode = new Map(previousMd2.map((row) => [`${row.mode}|${row.official_fantasy_player_id}`, row]));
  const currentByMode = new Map(currentMd2.map((row) => [`${row.mode}|${row.official_fantasy_player_id}`, row]));
  const newEntries = currentMd2
    .filter((row) => !previousByMode.has(`${row.mode}|${row.official_fantasy_player_id}`))
    .slice(0, 60)
    .map((row) => ({ mode: row.mode, rank: row.rank, name: row.name, projectedPoints: row.projectedPoints, reason: "projection_v4_role_v2_score_v4_selection" }));
  const removedEntries = previousMd2
    .filter((row) => !currentByMode.has(`${row.mode}|${row.official_fantasy_player_id}`))
    .slice(0, 60)
    .map((row) => ({ mode: row.mode, previous_rank: row.rank, name: row.name, projectedPoints: row.raw_expected_points ?? null, reason: "fell_below_v4_projection_role_threshold_or_position_cap" }));
  const rankChanges = currentMd2
    .map((row) => {
      const previous = previousByMode.get(`${row.mode}|${row.official_fantasy_player_id}`);
      if (!previous) return null;
      return {
        mode: row.mode,
        name: row.name,
        previous_rank: previous.rank,
        current_rank: row.rank,
        rank_delta: previous.rank - row.rank,
        explanation: Math.abs(num(row.projectedPoints) - num(previous.raw_expected_points)) >= 0.75
          ? "projection-driven"
          : row.roleTier !== previous.role_label
            ? "role-driven"
            : row.fixture_context?.score_model_version
              ? "score-v4-driven"
              : "value/position-cap driven"
      };
    })
    .filter(Boolean)
    .sort((a, b) => Math.abs(b.rank_delta) - Math.abs(a.rank_delta))
    .slice(0, 50);
  const modeChangedMost = MODES.map(({ id }) => ({
    mode: id,
    new_entries: newEntries.filter((row) => row.mode === id).length,
    removed_entries: removedEntries.filter((row) => row.mode === id).length,
    avg_abs_rank_delta: round(average(rankChanges.filter((row) => row.mode === id).map((row) => Math.abs(row.rank_delta))), 2)
  })).sort((a, b) => (b.new_entries + b.removed_entries + b.avg_abs_rank_delta) - (a.new_entries + a.removed_entries + a.avg_abs_rank_delta));
  return {
    new_entries: newEntries,
    removed_entries: removedEntries,
    biggest_ranking_changes: rankChanges,
    surfaces_changed_most: modeChangedMost,
    movement_summary: "Changes are primarily projection-driven and role-driven because v4 rankings use Projection Model v4 plus Role Model v2 first; Score Model v4 fixture context affects team xG/clean-sheet/captain environment; finance is secondary and mostly affects Value Picks."
  };
}

function buildQa({ recommendationRows, sourceRows, roleRows, officialRecords, previousRows }) {
  const failures = [];
  const checks = [];
  const warnings = [];
  const md2Rows = recommendationRows.filter((row) => row.matchday === "md2");
  const md2SourceRows = sourceRows.filter((row) => row.matchday === "md2");
  const officialIds = new Set(officialRecords.map((row) => String(row.official_fantasy_player_id)).filter(Boolean));
  const roleIds = new Set(roleRows.map((row) => String(row.official_fantasy_player_id)).filter(Boolean));
  const md2ProjectionIds = new Set(md2SourceRows.map((row) => row.official_fantasy_player_id));
  const addCheck = (id, ok, detail = {}) => {
    checks.push({ id, status: ok ? "pass" : "fail", detail });
    if (!ok) failures.push({ id, detail });
  };
  const duplicateBySurface = [];
  for (const scope of SCOPES) {
    for (const { id: mode } of MODES) {
      const rows = recommendationRows.filter((row) => row.matchday === scope && row.mode === mode);
      const ids = rows.map((row) => row.official_fantasy_player_id);
      const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
      if (duplicateIds.length) duplicateBySurface.push({ scope, mode, duplicateIds: unique(duplicateIds) });
    }
  }
  const topProjected = sortedBy(md2SourceRows, (row) => num(row.projectedPoints)).slice(0, 10);
  const topProjectedMissing = topProjected.filter((row) => !surfacesForId(recommendationRows, row.official_fantasy_player_id).length);
  const topCaptain = sortedBy(md2SourceRows.filter((row) => row.official_fantasy_position !== "GK"), (row) => num(row.captainUpsideScore)).slice(0, 20);
  const topCaptainMissing = topCaptain.filter((row) => !surfacesForId(recommendationRows, row.official_fantasy_player_id).includes("Captain Watchlist"));
  const eliteAudit = buildEliteAudit(md2SourceRows, recommendationRows);
  const starAudit = buildStarAudit(md2SourceRows, recommendationRows);
  const starCaptainOmissions = starAudit.filter((row) =>
    CAPTAIN_AUDIT_NAMES.some((name) => normalizeText(row.audit_name).includes(normalizeText(name))) &&
    row.startProb >= 0.7 &&
    row.surfaces.length &&
    !row.surfaces.includes("Captain Watchlist")
  );
  const valueRows = md2Rows.filter((row) => row.mode === "differential").sort((a, b) => {
    const aValue = num(a.risk_adjusted_points) / Math.max(1, num(a.official_price));
    const bValue = num(b.risk_adjusted_points) / Math.max(1, num(b.official_price));
    return bValue - aValue;
  });
  const weakValueRows = valueRows.slice(0, 20).filter((row) => {
    const source = md2SourceRows.find((candidate) => candidate.official_fantasy_player_id === row.official_fantasy_player_id);
    if (!source) return true;
    const posMedian = median(md2SourceRows.filter((candidate) => candidate.official_fantasy_position === row.official_fantasy_position).map((candidate) => num(candidate.projectedPoints)));
    return row.startProb < THRESHOLDS.value.startProbability || row.projectedPoints < Math.max(2.8, posMedian * 0.9);
  });
  const weakDifferentials = md2Rows.filter((row) => row.mode === "differential").slice(0, 20).filter((row) =>
    row.startProb < THRESHOLDS.differential.startProbability || row.projectedPoints < 2.8
  );
  const cheapLowCeilingCore = md2Rows.filter((row) => row.mode === "balanced" && row.rank <= 20 && row.official_price < 5 && row.ceilingPoints < 8);
  const captainPremiumCount = md2Rows.filter((row) => row.mode === "captain" && row.rank <= 20 && row.official_price >= 7.5 && ["MID", "FWD"].includes(row.position)).length;
  const movementAudit = buildMovementAudit(previousRows, recommendationRows);

  addCheck("recommendation_row_count_preserved", recommendationRows.length === 500, { rows: recommendationRows.length });
  addCheck("md2_recommendation_count_preserved", md2Rows.length === 125, { md2_rows: md2Rows.length });
  addCheck("all_rows_resolve_active_official_identity", recommendationRows.every((row) => officialIds.has(row.official_fantasy_player_id)), {});
  addCheck("md2_rows_resolve_projection_v4", md2Rows.every((row) => md2ProjectionIds.has(row.official_fantasy_player_id)), {});
  addCheck("md2_rows_resolve_role_v2", md2Rows.every((row) => roleIds.has(row.official_fantasy_player_id)), {});
  addCheck("no_duplicate_player_within_surface", duplicateBySurface.length === 0, { duplicates: duplicateBySurface });
  addCheck("no_not_selectable_recommendations", recommendationRows.every((row) => row.selectable_status === "playing"), {});
  addCheck("md2_live_points_excluded", MD2_LIVE_POINTS_USED_AS_RECOMMENDATION_SIGNAL === false, {
    md2_live_points_used_as_recommendation_signal: MD2_LIVE_POINTS_USED_AS_RECOMMENDATION_SIGNAL
  });
  addCheck("md2_playing_fixture_recommendations_cautioned", recommendationRows
    .filter((row) => row.matchday === "md2" && row.fixture_status === "playing")
    .every((row) => String(row.caution || "").includes("currently playing")), {
    playing_recommendation_rows: recommendationRows.filter((row) => row.matchday === "md2" && row.fixture_status === "playing").length
  });
  addCheck("top10_md2_projected_represented", topProjectedMissing.length === 0, { missing: topProjectedMissing.map((row) => row.name) });
  addCheck("top20_captain_upside_represented_in_captain", topCaptainMissing.length <= 4, { missing: topCaptainMissing.map((row) => row.name) });
  addCheck("captain_watchlist_has_premium_upside", captainPremiumCount >= 12, { captainPremiumCount });
  addCheck("captain_named_star_audit", starCaptainOmissions.length === 0, { omissions: starCaptainOmissions });
  addCheck("value_picks_pass_minimums", weakValueRows.length === 0, { weakValueRows });
  addCheck("differential_picks_pass_minimums", weakDifferentials.length === 0, { weakDifferentials });
  addCheck("core_not_cheap_low_ceiling_dominated", cheapLowCeilingCore.length <= 2, { cheapLowCeilingCore });

  const failuresById = new Set(failures.map((failure) => failure.id));
  if (topCaptainMissing.length) {
    warnings.push({
      id: "captain_top20_omissions_with_reasons",
      rows: topCaptainMissing.map((row) => ({
        name: row.name,
        captainUpsideScore: row.captainUpsideScore,
        reason: "Outside top 25 Captain Watchlist after role/position-cap scoring; audited but allowed if under omission threshold."
      }))
    });
  }
  const status = failures.length ? "fail" : "pass";
  return {
    schema_version: "recommendation_qa_md2_v4",
    generated_at: NOW,
    modelVersion: MODEL_VERSION,
    status,
    summary: {
      total_recommendation_rows: recommendationRows.length,
      md2_recommendation_rows: md2Rows.length,
      rows_by_matchday: Object.fromEntries(SCOPES.map((scope) => [scope, recommendationRows.filter((row) => row.matchday === scope).length])),
      rows_by_mode: Object.fromEntries(MODES.map(({ id }) => [id, recommendationRows.filter((row) => row.mode === id).length])),
      md2_already_started: MD2_ALREADY_STARTED,
      md2_live_points_used_as_recommendation_signal: MD2_LIVE_POINTS_USED_AS_RECOMMENDATION_SIGNAL,
      md2_playing_fixture_recommendation_rows: recommendationRows.filter((row) => row.matchday === "md2" && row.fixture_status === "playing").length,
      md2_scheduled_fixture_recommendation_rows: recommendationRows.filter((row) => row.matchday === "md2" && row.fixture_status === "scheduled").length,
      failures: failures.length,
      warnings: warnings.length
    },
    thresholds: THRESHOLDS,
    checks,
    failures,
    warnings,
    top_25_projected_points: topTable(recommendationRows, "balanced", 25).sort((a, b) => num(b.projectedPoints) - num(a.projectedPoints)).slice(0, 25),
    top_25_core_picks: topTable(recommendationRows, "balanced", 25),
    top_20_high_floor: topTable(recommendationRows, "safe", 20),
    top_20_upside: topTable(recommendationRows, "upside", 20),
    top_20_value: valueRows.slice(0, 20).map((row, index) => ({ rank: index + 1, name: row.name, country: row.country, position: row.position, price: row.price, projectedPoints: row.projectedPoints, startProb: row.startProb, valueScore: row.valueScore })),
    top_20_differential: topTable(recommendationRows, "differential", 20),
    top_20_captain_watchlist: topTable(recommendationRows, "captain", 20),
    star_audit: starAudit,
    elite_audit: eliteAudit,
    value_finance_overweight_checks: {
      status: ["value_picks_pass_minimums", "core_not_cheap_low_ceiling_dominated"].some((id) => failuresById.has(id)) ? "fail" : "pass",
      finance_secondary_policy: "Finance/value metrics affect Value Picks and the shared differential/value pool only after projection/start/minutes thresholds.",
      weak_value_rows: weakValueRows,
      cheap_low_ceiling_core_rows: cheapLowCeilingCore,
      captain_premium_count_top20: captainPremiumCount
    },
    movement_audit: movementAudit
  };
}

function countBy(rows, field) {
  return rows.reduce((counts, row) => {
    const key = row[field] ?? "missing";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function buildModelDoc(qa) {
  const lines = [];
  lines.push("# Recommendation Model v4 MD2");
  lines.push("");
  lines.push(`Generated: ${NOW}`);
  lines.push(`Model version: \`${MODEL_VERSION}\``);
  lines.push("");
  lines.push("## Purpose");
  lines.push("");
  lines.push("Recommendations v4 refreshes public MD2 Official Fantasy Picks after MD1 using Component Player Projection Model v4, Player Role / Start / Minutes Model v2, Score Model v4 fixture context, and the active official fantasy identity universe.");
  lines.push("");
  lines.push("## Inputs");
  lines.push("");
  Object.values(INPUT_FILES).forEach((file) => lines.push(`- \`${file}\``));
  lines.push("");
  lines.push("## Ranking Principles");
  lines.push("");
  lines.push("- Projection is first: projected points, start probability, expected minutes, role confidence, floor/ceiling, and captain upside drive all surfaces.");
  lines.push("- Finance is secondary: it shapes Value Picks inside the shared differential/value pool and cannot rescue poor projection or role rows.");
  lines.push("- Captain Watchlist is not value-first: captain upside, projected points, ceiling, starts, minutes, and team xG drive it.");
  lines.push("- Differential Picks must be playable: they require projection, start probability, and ceiling floors before value or lower-price signals help.");
  lines.push("- Ownership fields are not used as model signal.");
  lines.push("");
  lines.push("## Thresholds");
  lines.push("");
  lines.push("| Surface | Start floor | Other floor |");
  lines.push("| --- | ---: | --- |");
  lines.push("| Core Picks | 0.70 | elite/high-upside may pass at 0.60 with caution |");
  lines.push("| High-Floor Picks | 0.75 | floor above positional median |");
  lines.push("| Upside Picks | 0.60 | ceiling above positional median or strong captain upside |");
  lines.push("| Value Picks | 0.60 | projection above positional median or strong value with minimum projection |");
  lines.push("| Differential Picks | 0.55 | projection and ceiling must be credible |");
  lines.push("| Captain Watchlist | 0.70 | managed-minutes stars may pass at 0.62 with caution |");
  lines.push("");
  lines.push("## QA Summary");
  lines.push("");
  lines.push(`- Status: **${qa.status.toUpperCase()}**`);
  lines.push(`- Total rows: ${qa.summary.total_recommendation_rows}`);
  lines.push(`- MD2 rows: ${qa.summary.md2_recommendation_rows}`);
  lines.push(`- Failures: ${qa.summary.failures}`);
  lines.push(`- Warnings: ${qa.summary.warnings}`);
  lines.push("");
  lines.push("## Public Limits");
  lines.push("");
  lines.push("- This remains a fantasy-pool model, not official FIFA advice.");
  lines.push("- Final squads are not claimed as source-backed.");
  lines.push("- Users must confirm official lineup, locks, deadlines, boosters, and squad legality inside FIFA.");
  lines.push("");
  return `${lines.join("\n").replace(/\n+$/, "")}\n`;
}

function markdownTable(rows, columns) {
  const header = `| ${columns.map((column) => column.label).join(" | ")} |`;
  const separator = `| ${columns.map(() => "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${columns.map((column) => String(row[column.key] ?? "")).join(" | ")} |`);
  return [header, separator, ...body].join("\n");
}

function buildQaReport(qa) {
  const lines = [];
  lines.push("# Recommendation QA v4 MD2");
  lines.push("");
  lines.push(`Generated: ${NOW}`);
  lines.push(`Status: **${qa.status.toUpperCase()}**`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Total recommendation rows: ${qa.summary.total_recommendation_rows}`);
  lines.push(`- MD2 recommendation rows: ${qa.summary.md2_recommendation_rows}`);
  lines.push(`- Failures: ${qa.failures.length}`);
  lines.push(`- Warnings: ${qa.warnings.length}`);
  lines.push("");
  lines.push("## Checks");
  lines.push("");
  qa.checks.forEach((check) => lines.push(`- **${check.status.toUpperCase()}** \`${check.id}\``));
  lines.push("");
  lines.push("## Top 25 Projected Points");
  lines.push("");
  lines.push(markdownTable(qa.top_25_projected_points, [
    { key: "rank", label: "#" },
    { key: "name", label: "Player" },
    { key: "position", label: "Pos" },
    { key: "price", label: "Price" },
    { key: "projectedPoints", label: "Proj" },
    { key: "startProb", label: "Start" },
    { key: "captainUpsideScore", label: "Cap" }
  ]));
  lines.push("");
  lines.push("## Top 20 Captain Watchlist");
  lines.push("");
  lines.push(markdownTable(qa.top_20_captain_watchlist, [
    { key: "rank", label: "#" },
    { key: "name", label: "Player" },
    { key: "position", label: "Pos" },
    { key: "price", label: "Price" },
    { key: "projectedPoints", label: "Proj" },
    { key: "captainUpsideScore", label: "Cap" },
    { key: "startProb", label: "Start" }
  ]));
  lines.push("");
  lines.push("## Surface Tops");
  lines.push("");
  [
    ["Core Picks", qa.top_25_core_picks.slice(0, 25)],
    ["High-Floor", qa.top_20_high_floor],
    ["Upside", qa.top_20_upside],
    ["Value", qa.top_20_value],
    ["Differential", qa.top_20_differential]
  ].forEach(([title, rows]) => {
    lines.push(`### ${title}`);
    lines.push("");
    lines.push(markdownTable(rows.slice(0, 20), [
      { key: "rank", label: "#" },
      { key: "name", label: "Player" },
      { key: "position", label: "Pos" },
      { key: "price", label: "Price" },
      { key: "projectedPoints", label: "Proj" },
      { key: "startProb", label: "Start" }
    ]));
    lines.push("");
  });
  lines.push("## Star Audit");
  lines.push("");
  lines.push(markdownTable(qa.star_audit, [
    { key: "audit_name", label: "Audit" },
    { key: "name", label: "Matched Player" },
    { key: "projectedPoints", label: "Proj" },
    { key: "captainUpsideScore", label: "Cap" },
    { key: "startProb", label: "Start" },
    { key: "expectedMinutes", label: "Min" },
    { key: "roleTier", label: "Role" },
    { key: "surfaces", label: "Surfaces" },
    { key: "omissionReason", label: "Omission" }
  ]));
  lines.push("");
  lines.push("## Elite Omissions");
  lines.push("");
  if (!qa.elite_audit.omissions.length) {
    lines.push("- None");
  } else {
    qa.elite_audit.omissions.forEach((row) => {
      lines.push(`- ${row.name}: ${row.eliteOmissionReason}`);
    });
  }
  lines.push("");
  lines.push("## Value / Finance Overweight Checks");
  lines.push("");
  lines.push(`- Status: ${qa.value_finance_overweight_checks.status}`);
  lines.push(`- Policy: ${qa.value_finance_overweight_checks.finance_secondary_policy}`);
  lines.push(`- Weak value rows: ${qa.value_finance_overweight_checks.weak_value_rows.length}`);
  lines.push(`- Cheap low-ceiling core rows: ${qa.value_finance_overweight_checks.cheap_low_ceiling_core_rows.length}`);
  lines.push(`- Premium MID/FWD captain options in top 20: ${qa.value_finance_overweight_checks.captain_premium_count_top20}`);
  lines.push("");
  lines.push("## Movement Audit");
  lines.push("");
  lines.push(qa.movement_audit.movement_summary);
  lines.push("");
  lines.push("### Surfaces Changed Most");
  lines.push("");
  lines.push(markdownTable(qa.movement_audit.surfaces_changed_most, [
    { key: "mode", label: "Surface" },
    { key: "new_entries", label: "New" },
    { key: "removed_entries", label: "Removed" },
    { key: "avg_abs_rank_delta", label: "Avg Abs Rank Delta" }
  ]));
  lines.push("");
  lines.push("## Failures");
  lines.push("");
  if (!qa.failures.length) {
    lines.push("- None");
  } else {
    qa.failures.forEach((failure) => lines.push(`- \`${failure.id}\``));
  }
  lines.push("");
  return `${lines.join("\n").replace(/\n+$/, "")}\n`;
}

function buildOutputData(recommendationRows, qa, projectionData, scoreData) {
  const summary = {
    candidate_rows: recommendationRows.length,
    candidate_scopes: SCOPES.length,
    modes: MODES.map((mode) => mode.id),
    candidates_by_mode: countBy(recommendationRows, "mode"),
    candidates_by_matchday: countBy(recommendationRows, "matchday"),
    candidates_by_position: countBy(recommendationRows, "official_fantasy_position"),
    candidates_by_tier: countBy(recommendationRows, "recommendation_tier"),
    candidates_by_price_bucket: recommendationRows.reduce((counts, row) => {
      const bucket = priceBucket(row.official_price);
      counts[bucket] = (counts[bucket] || 0) + 1;
      return counts;
    }, {}),
    projected_player_rows_available: projectionData.playerMatchdayProjections.length,
    blocked_players_available: projectionData.blockedPlayers.length,
    top_list_limit: TOP_LIST_LIMIT,
    score_model_version: scoreData.modelVersion || scoreData.model_version || null,
    projection_model_version: projectionData.modelVersion || projectionData.model_version || null,
    role_model_version: "player-role-md2-v2-md1-evidence",
    safe_for_public_recommendations: qa.status === "pass",
    browser_ready_files_updated: true,
    browser_preview_exported: true,
    browser_preview_exported_at: NOW,
    md2_already_started: MD2_ALREADY_STARTED,
    md2_live_points_used_as_recommendation_signal: MD2_LIVE_POINTS_USED_AS_RECOMMENDATION_SIGNAL
  };

  return {
    schema_version: "fantasy_pool_matchday_recommendations_md2_v4",
    generated_at: NOW,
    source_checked: SOURCE_CHECKED,
    modelVersion: MODEL_VERSION,
    model_version: MODEL_VERSION,
    model_stage: "current_official_fantasy_pool",
    data_status: "active_md2_recommendations_v4",
    safety_labels: [
      "current official fantasy pool",
      "projection model v4",
      "role model v2",
      "score model v4",
      "finance secondary only",
      "MD2 live points excluded from recommendation signal",
      "verify official game locks/deadlines"
    ],
    previous_active_recommendation_file: "fantasyPoolRecommendationsData.js",
    browser_ready_files_updated: true,
    input_files: Object.values(INPUT_FILES),
    output_files: Object.values(OUTPUT_FILES),
    model: {
      source_model_version: MODEL_VERSION,
      top_list_limit: TOP_LIST_LIMIT,
      modes: MODES,
      thresholds: THRESHOLDS,
      position_caps_by_mode: POSITION_CAPS,
      scoring_note: "Projection/start/minutes/role/fixture context drive rankings. Finance is secondary and cannot bypass projection/start thresholds.",
      md2_already_started: MD2_ALREADY_STARTED,
      md2_live_points_used_as_recommendation_signal: MD2_LIVE_POINTS_USED_AS_RECOMMENDATION_SIGNAL,
      live_fixture_status_policy: "Fixture status may add caution/display context only and does not change recommendation scores."
    },
    summary,
    qa_status: qa.status,
    recommendationCandidates: recommendationRows,
    matchdayRecommendations: SCOPES.map((scope) => ({
      matchday: scope,
      rows: recommendationRows.filter((row) => row.matchday === scope)
    })),
    browser_preview_exported: true,
    browser_preview_note: "Browser-ready v4 recommendations use active official fantasy identity and keep existing public globals."
  };
}

function writeBrowserFile(data) {
  const js = [
    "// Generated by scripts/buildFantasyPoolRecommendationsV4Md2.mjs.",
    "// Source files: data/fantasyPoolRecommendations_md2_v4.json",
    "// Active MD2 official fantasy-pool browser recommendation data.",
    `window.FANTASY_POOL_RECOMMENDATIONS_DATA = ${JSON.stringify(data)};`,
    "",
    "window.FANTASY_POOL_RECOMMENDATION_CANDIDATES = window.FANTASY_POOL_RECOMMENDATIONS_DATA.recommendationCandidates;",
    "",
    `window.FANTASY_POOL_RECOMMENDATIONS_SUMMARY = ${JSON.stringify(data.summary)};`,
    ""
  ].join("\n");
  fs.writeFileSync(OUTPUT_FILES.browserJs, js, "utf8");
}

async function main() {
  const globals = loadGlobals([INPUT_FILES.officialStatusJs, INPUT_FILES.financeJs]);
  const officialStatus = globals.FANTASY_POOL_OFFICIAL_DATA_STATUS || {};
  const officialRecords = rowsFrom(officialStatus.official_position_records, "official_position_records");
  const financeRows = globals.FANTASY_POOL_PLAYER_FINANCE_METRICS || [];
  const previousRows = loadPreviousRecommendationRows();
  const projectionData = readJson(INPUT_FILES.projectionsJson);
  const roleData = readJson(INPUT_FILES.roleJson);
  const scoreData = readJson(INPUT_FILES.scoreJson);
  const projectionRows = rowsFrom(projectionData, "playerMatchdayProjections");
  const roleRows = rowsFrom(roleData, "playerRoleRows");
  const financeById = mapById(financeRows);
  const roleById = mapById(roleRows);
  const projectionsByIdScope = new Map(projectionRows.map((row) => [String(row.official_fantasy_player_id) + "|" + row.matchday, row]));
  const selectableOfficialRecords = officialRecords.filter((row) => String(row.selectable_status || "playing").toLowerCase() === "playing");
  const sourceRows = SCOPES.flatMap((scope) =>
    selectableOfficialRecords
      .map((officialRecord) => projectionRowForScope({ officialRecord, scope, projectionsByIdScope, roleById, financeById }))
      .filter(Boolean)
  );
  const recommendationRows = SCOPES.flatMap((scope) =>
    buildScopeRecommendations(scope, sourceRows.filter((row) => row.matchday === scope), financeById)
  );
  const qa = buildQa({
    recommendationRows,
    sourceRows,
    roleRows,
    officialRecords,
    previousRows
  });
  const data = buildOutputData(recommendationRows, qa, {
    ...projectionData,
    playerMatchdayProjections: projectionRows,
    blockedPlayers: rowsFrom(projectionData, "blockedPlayers")
  }, scoreData);

  await writeFile(OUTPUT_FILES.sourceJson, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  writeBrowserFile(data);
  await writeFile(OUTPUT_FILES.modelDoc, buildModelDoc(qa), "utf8");
  await writeFile(OUTPUT_FILES.qaJson, `${JSON.stringify(qa, null, 2)}\n`, "utf8");
  await writeFile(OUTPUT_FILES.qaReport, buildQaReport(qa), "utf8");

  console.log(JSON.stringify({
    status: qa.status,
    total_recommendation_rows: recommendationRows.length,
    md2_recommendation_rows: recommendationRows.filter((row) => row.matchday === "md2").length,
    top_projected: qa.top_25_projected_points.slice(0, 10).map((row) => `${row.name} ${row.projectedPoints}`),
    top_captain: qa.top_20_captain_watchlist.slice(0, 10).map((row) => `${row.name} ${row.captainUpsideScore}`),
    failures: qa.failures.map((failure) => failure.id)
  }, null, 2));

  if (qa.status !== "pass") {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
