import { readFile, writeFile } from "node:fs/promises";
import vm from "node:vm";

const NOW = new Date().toISOString();
const SOURCE_CHECKED = "2026-06-18";
const MODEL_VERSION = "player-projection-v4-md2-score-v4-role-v2";
const FORMULA_VERSION = "fantasy_pool_player_projection_v4_md2_score_v4_role_v2_2026-06-18";

const PATHS = {
  priorProjection: "data/playerMatchdayProjections_fantasyPool_v3.json",
  roleModel: "data/playerRoleModel_md2_v2.json",
  roleQa: "data/playerRoleModelQa_md2_v2.json",
  scoreModel: "data/scorePredictions_fantasyPool_v4_md2.json",
  scoreBrowser: "fantasyPoolScorePredictionsData.js",
  rulesJson: "fantasyRules.json",
  rulesBrowser: "fantasyRulesData.js",
  officialStatusBrowser: "fantasyPoolOfficialDataStatusData.js",
  recommendationsBrowser: "fantasyPoolRecommendationsData.js",
  financeBrowser: "fantasyPoolFinanceMetricsData.js",
  livePlayerStatus: "data/livePlayerStatus_v1.json",
  liveMatchdayStatus: "data/liveMatchdayStatus_v1.json",
  md1CalibrationDataset: "data/md1CalibrationDataset_v1.json",
  md1Postmortem: "data/md1ModelPostmortem_v1.json",
  outputJson: "data/fantasyPoolMatchdayProjections_md2_v4.json",
  outputBrowser: "fantasyPoolMatchdayProjectionsData.js",
  modelDoc: "data/playerProjectionModel_md2_v4.md",
  qaJson: "data/playerProjectionQa_md2_v4.json",
  qaReport: "data/playerProjectionQaReport_md2_v4.md"
};

const SAFETY_LABELS = [
  "active_md2_player_projection_support",
  "fantasy_pool_only",
  "not final-squad-backed",
  "recommendations not rebuilt in this prompt",
  "Team Builder weights not rebuilt in this prompt",
  "finance metrics not rebuilt in this prompt"
];

const POSITION_CODES = ["GK", "DEF", "MID", "FWD"];
const UNCERTAINTY_RISK = {
  Low: 0.03,
  Medium: 0.09,
  High: 0.18
};
const ROLE_TIER_BONUS = {
  locked_starter: 0.08,
  likely_starter: 0.04,
  managed_minutes_star: 0.03,
  possible_starter: -0.03,
  rotation_risk: -0.07,
  impact_sub: -0.12,
  bench_depth: -0.18,
  unavailable_or_not_selectable: -0.5,
  no_md1_evidence: -0.12
};

function round(value, digits = 3) {
  if (!Number.isFinite(value)) return null;
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function num(value, fallback = null) {
  if (value === null || value === undefined || value === "") return fallback;
  const parsed = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function sum(values) {
  return values.filter((value) => Number.isFinite(value)).reduce((total, value) => total + value, 0);
}

function average(values, fallback = null) {
  const valid = values.filter((value) => Number.isFinite(value));
  return valid.length ? sum(valid) / valid.length : fallback;
}

function unique(values) {
  return [...new Set(values.filter((value) => value !== null && value !== undefined && value !== "").map(String))];
}

function countBy(rows, keyFn) {
  return rows.reduce((counts, row) => {
    const key = keyFn(row);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function top(rows, limit, scoreFn) {
  return [...rows].sort((a, b) => scoreFn(b) - scoreFn(a)).slice(0, limit);
}

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function safeRatio(numerator, denominator, fallback = 1) {
  const n = num(numerator);
  const d = num(denominator);
  if (!Number.isFinite(n) || !Number.isFinite(d) || d <= 0) return fallback;
  return n / d;
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function loadBrowserGlobals(paths) {
  const context = { window: {} };
  vm.createContext(context);
  for (const path of paths) {
    vm.runInContext(await readFile(path, "utf8"), context, { filename: path });
  }
  return context.window;
}

function rowsFrom(data, keys = []) {
  if (Array.isArray(data)) return data;
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
}

function scoringMap(rules) {
  const categories = rules.scoring?.categories || rules.officialFantasyRules?.scoring?.categories || [];
  return new Map(categories.map((category) => [category.category_id || category.categoryId, category]));
}

function points(scoring, categoryId, fallback = 0) {
  return num(scoring.get(categoryId)?.points, fallback) ?? fallback;
}

function matchdayLabel(matchday) {
  return {
    md1: "Matchday 1",
    md2: "Matchday 2",
    md3: "Matchday 3"
  }[matchday] || matchday || "Unknown";
}

function appearanceProbabilities(expectedMinutes, startProbability) {
  const minutes = clamp(num(expectedMinutes, 0) ?? 0, 0, 95);
  const start = clamp(num(startProbability, 0) ?? 0, 0, 1);
  const appearanceProbability = clamp(Math.max(start, minutes / 30), 0, 1);
  const sixtyMinuteProbability = clamp(start * clamp((minutes - 18) / 54, 0, 1), 0, 1);
  return { minutes, start, appearanceProbability, sixtyMinuteProbability };
}

function poissonProbability(lambda, goals) {
  let factorial = 1;
  for (let index = 2; index <= goals; index += 1) factorial *= index;
  return (Math.E ** -lambda) * (lambda ** goals) / factorial;
}

function expectedAdditionalGoalsConceded(lambda) {
  if (!Number.isFinite(lambda) || lambda <= 0) return 0;
  return Math.max(0, lambda - (1 - poissonProbability(lambda, 0)));
}

function officialFantasyId(row) {
  return String(row?.official_fantasy_player_id || row?.officialFantasyPlayerId || "").trim();
}

function dataQualityFlags(prior, role, scoreView, extra = []) {
  return unique([
    "active_md2_projection_v4",
    "fantasy_pool_only",
    "not_final_squad_backed",
    "official_fantasy_pool_identity",
    "score_model_v4_md1_calibrated",
    "role_model_v2",
    "ownership_not_used_as_signal",
    "recommendations_not_rebuilt_after_projection_v4",
    ...(prior.data_quality_flags || []),
    ...(role?.dataQualityFlags || []),
    ...(scoreView?.qa_flags || []),
    ...extra
  ]);
}

function fixtureContext(scoreView, prior) {
  const context = scoreView || prior.fixture_context || {};
  return {
    fixture_id: context.fixture_id || prior.fixture_id || null,
    match_number: num(context.match_number, prior.match_number),
    opponent_team_id: context.opponent_team_id || prior.opponent_team_id || null,
    opponent: context.opponent || prior.opponent || null,
    side: context.side || prior.side || null,
    expected_goals: round(num(context.expected_goals, prior.fixture_context?.expected_goals ?? 0), 3),
    projectedXg: round(num(context.projectedXg, context.expected_goals ?? prior.fixture_context?.expected_goals ?? 0), 3),
    projected_xg: round(num(context.projected_xg, context.expected_goals ?? prior.fixture_context?.expected_goals ?? 0), 3),
    expected_goals_against: round(num(context.expected_goals_against, prior.fixture_context?.expected_goals_against ?? 0), 3),
    win_probability: round(num(context.win_probability, prior.fixture_context?.win_probability ?? 0), 4),
    draw_probability: round(num(context.draw_probability, prior.fixture_context?.draw_probability ?? 0), 4),
    loss_probability: round(num(context.loss_probability, prior.fixture_context?.loss_probability ?? 0), 4),
    clean_sheet_probability: round(num(context.clean_sheet_probability, prior.fixture_context?.clean_sheet_probability ?? 0), 4),
    fixture_difficulty_score: round(num(context.fixture_difficulty_score, prior.fixture_context?.fixture_difficulty_score ?? 50), 2),
    fixture_difficulty_band: context.fixture_difficulty_band || prior.fixture_context?.fixture_difficulty_band || null,
    attacking_environment_score: round(num(context.attacking_environment_score, prior.fixture_context?.attacking_environment_score ?? 0), 1),
    defensive_environment_score: round(num(context.defensive_environment_score, prior.fixture_context?.defensive_environment_score ?? 0), 1),
    captain_environment_score: round(num(context.captain_environment_score, prior.fixture_context?.captain_environment_score ?? 0), 1),
    attackerEnvironment: context.attackerEnvironment || context.attacker_environment || null,
    defenderEnvironment: context.defenderEnvironment || context.defender_environment || null,
    keeperEnvironment: context.keeperEnvironment || context.keeper_environment || null,
    cleanSheetContext: context.cleanSheetContext || context.clean_sheet_context || null,
    goalEnvironment: context.goalEnvironment || context.goal_environment_public || null,
    matchUncertainty: context.matchUncertainty || context.match_uncertainty || context.uncertaintyLabel || null,
    match_uncertainty: context.match_uncertainty || context.matchUncertainty || context.uncertainty_label || null,
    goal_environment: context.goal_environment || prior.fixture_context?.goal_environment || null,
    upset_risk_probability: round(num(context.upset_risk_probability, prior.fixture_context?.upset_risk_probability ?? 0), 4),
    upset_risk_band: context.upset_risk_band || prior.fixture_context?.upset_risk_band || null,
    score_model_stage: context.model_stage || context.score_model_stage || "fantasy_pool_only",
    score_qa_flags: context.qa_flags || prior.fixture_context?.score_qa_flags || [],
    source_model_version: context.source_model_version || null,
    v4_calibration: context.v4_calibration || null
  };
}

function cleanSheetPointsForPosition(scoring, position) {
  return {
    GK: points(scoring, "gk_clean_sheet", 5),
    DEF: points(scoring, "def_clean_sheet", 5),
    MID: points(scoring, "mid_clean_sheet", 1),
    FWD: 0
  }[position] ?? 0;
}

function goalConcededPointsForPosition(scoring, position) {
  return {
    GK: points(scoring, "gk_each_additional_goal_conceded", -1),
    DEF: points(scoring, "def_each_additional_goal_conceded", -1),
    MID: 0,
    FWD: 0
  }[position] ?? 0;
}

function confidenceFromRole(prior, role, matchday) {
  const roleConfidence = role?.roleConfidence || prior.minutes_context?.role_confidence || prior.role_confidence || prior.projection_confidence || "low";
  const evidence = role?.evidenceStrength || "weak";
  if (matchday === "md3" && evidence !== "strong") return roleConfidence === "low" ? "low" : "medium";
  if (roleConfidence === "high" && evidence === "strong") return "high";
  if (["high", "medium"].includes(roleConfidence) && evidence === "medium") return "medium";
  if (String(role?.roleTier || "").includes("bench") || String(role?.roleTier || "").includes("impact")) return "low";
  return roleConfidence === "thin_profile" ? "thin_profile" : "low";
}

function md1FormAdjustment(role) {
  const actual = num(role?.md1_actual_fantasy_points);
  const priorProjected = num(role?.prior_md1_projected_points);
  const start = num(role?.md2StartProb, 0) ?? 0;
  const evidence = role?.evidenceStrength || "weak";
  const eliteProtected = Boolean(role?.elite_high_prior || role?.protected_from_weak_md1_over_downgrade);
  let adjustment = 0;

  if (Number.isFinite(actual) && Number.isFinite(priorProjected)) {
    adjustment = (actual - priorProjected) * 0.07;
    if (actual >= 8 && start >= 0.65) adjustment += 0.08;
    if (actual === 0 && evidence === "weak") adjustment -= eliteProtected ? 0.04 : 0.14;
  } else if (evidence === "weak") {
    adjustment = eliteProtected ? -0.04 : -0.16;
  }

  return round(clamp(adjustment, -0.35, 0.45), 3);
}

function fixtureReason(scoreView, prior) {
  if (!scoreView) return "Prior fixture context preserved because Score v4 match view is unavailable.";
  const oldXg = num(prior.fixture_context?.expected_goals);
  const newXg = num(scoreView.expected_goals);
  const xgMove = Number.isFinite(oldXg) && Number.isFinite(newXg)
    ? newXg - oldXg
    : 0;
  const moveText = xgMove > 0.12
    ? "raises team goal environment"
    : xgMove < -0.12
      ? "lowers team goal environment"
      : "keeps team goal environment close to prior";
  const cleanSheetText = scoreView.cleanSheetContext || scoreView.clean_sheet_context || "neutral";
  const uncertainty = scoreView.matchUncertainty || scoreView.match_uncertainty || "Medium";
  return `Score v4 ${moveText}; xG ${round(newXg, 2)}, clean-sheet ${cleanSheetText}, uncertainty ${uncertainty}.`;
}

function projectionReason(role, scoreView, projected, priorProjected, matchday) {
  if (matchday === "md1") {
    return "MD1 prior projection preserved; actual points remain in live support data, not overwritten as projections.";
  }
  const move = projected - priorProjected;
  const roleText = role?.roleTier ? `Role v2 ${role.roleTier.replaceAll("_", " ")}` : "Role v2 unavailable";
  const scoreText = scoreView ? "Score v4 fixture context applied" : "prior fixture context retained";
  const moveText = move > 0.3 ? "projection upgraded" : move < -0.3 ? "projection downgraded" : "projection held near prior";
  return `${roleText}; ${scoreText}; ${moveText} after capped MD1 form adjustment.`;
}

function roleCaution(role, scoreView, matchday) {
  if (matchday === "md1") return "MD1 actuals should be read from livePlayerStatusData.js.";
  if (role?.caution) return role.caution;
  if (role?.evidenceStrength === "weak") return "Weak MD1 role evidence; verify role before deadline.";
  if ((scoreView?.matchUncertainty || scoreView?.match_uncertainty) === "High") return "High fixture uncertainty in Score v4.";
  if (matchday === "md3") return "MD3 uses MD2 role evidence as a lower-confidence prior.";
  return "Verify official status, lineup, and deadline inside FIFA before acting.";
}

function buildScoreMaps(scoreRows) {
  const byTeamMatchday = new Map();
  const byFixtureTeam = new Map();
  for (const row of scoreRows) {
    const teamId = String(row.team_id || "").trim();
    const matchday = String(row.fantasy_matchday_id || row.matchday || "").trim();
    const fixtureId = String(row.fixture_id || row.match_id || "").trim();
    if (teamId && matchday) byTeamMatchday.set(`${teamId}|${matchday}`, row);
    if (fixtureId && teamId) byFixtureTeam.set(`${fixtureId}|${teamId}`, row);
  }
  return { byTeamMatchday, byFixtureTeam };
}

function scoreViewForRow(row, scoreMaps) {
  const byTeam = scoreMaps.byTeamMatchday.get(`${row.team_id}|${row.matchday}`);
  if (byTeam) return byTeam;
  return scoreMaps.byFixtureTeam.get(`${row.fixture_id}|${row.team_id}`) || null;
}

function resolveRoleInputs(prior, role) {
  const priorStart = clamp(num(prior.start_probability, 0) ?? 0, 0, 1);
  const priorMinutes = clamp(num(prior.expected_minutes, 0) ?? 0, 0, 95);
  const roleStart = clamp(num(role?.md2StartProb, priorStart) ?? priorStart, 0, 1);
  const roleMinutes = clamp(num(role?.md2ExpectedMinutes, priorMinutes) ?? priorMinutes, 0, 95);

  if (prior.matchday === "md2") {
    return { startProbability: roleStart, expectedMinutes: roleMinutes, roleWeight: 1 };
  }

  if (prior.matchday === "md3") {
    return {
      startProbability: clamp(roleStart * 0.65 + priorStart * 0.35, 0, 1),
      expectedMinutes: clamp(roleMinutes * 0.65 + priorMinutes * 0.35, 0, 95),
      roleWeight: 0.65
    };
  }

  return { startProbability: priorStart, expectedMinutes: priorMinutes, roleWeight: 0 };
}

function componentModel(prior, role, scoreView, scoring) {
  const position = prior.official_fantasy_position;
  const matchday = prior.matchday;
  const priorProjected = num(prior.raw_expected_points, 0) ?? 0;
  const priorRiskAdjusted = num(prior.risk_adjusted_points, priorProjected) ?? priorProjected;
  const priorStart = clamp(num(prior.start_probability, 0) ?? 0, 0, 1);
  const priorMinutes = clamp(num(prior.expected_minutes, 0) ?? 0, 0, 95);
  const { startProbability, expectedMinutes, roleWeight } = resolveRoleInputs(prior, role);
  const scoreContext = scoreView || prior.fixture_context || {};
  const apps = appearanceProbabilities(expectedMinutes, startProbability);
  const priorApps = appearanceProbabilities(priorMinutes, priorStart);
  const priorAvailability = clamp(priorApps.minutes / 90 * 0.55 + priorApps.start * 0.45, 0.05, 1.05);
  const newAvailability = clamp(apps.minutes / 90 * 0.55 + apps.start * 0.45, 0, 1.05);
  const roleScale = clamp(newAvailability / priorAvailability, 0, matchday === "md3" ? 1.18 : 1.25);
  const teamXgRatio = safeRatio(scoreContext.expected_goals, prior.fixture_context?.expected_goals, 1);
  const oppXgRatio = safeRatio(scoreContext.expected_goals_against, prior.fixture_context?.expected_goals_against, 1);
  const attackElasticity = matchday === "md3" ? 0.48 : 0.55;
  const attackMultiplier = clamp(1 + (teamXgRatio - 1) * attackElasticity, 0.65, 1.45);
  const supportAttackMultiplier = clamp(1 + (teamXgRatio - 1) * 0.32, 0.72, 1.3);
  const goalsAgainstMultiplier = clamp(1 + (oppXgRatio - 1) * 0.72, 0.6, 1.55);

  if (matchday === "md1") {
    const projected = Math.max(0, priorProjected);
    return {
      expectedMinutes,
      startProbability,
      projected,
      riskAdjusted: Math.max(0, priorRiskAdjusted),
      ceiling: Math.max(projected, num(prior.ceiling_points, projected) ?? projected),
      floor: Math.min(projected, Math.max(0, num(prior.floor_points, 0) ?? 0)),
      captainUpside: Math.max(0, num(prior.captain_score, 0) ?? 0),
      riskScore: round(clamp(1 - (priorRiskAdjusted / Math.max(priorProjected, 0.01)), 0, 1), 3),
      roleAdjustment: 0,
      fixtureAdjustment: 0,
      md1Adjustment: 0,
      roleScale: 1,
      attackMultiplier: 1,
      components: {
        appearance: num(prior.appearance_component, 0) ?? 0,
        minutes: 0,
        attacking: num(prior.attacking_component, 0) ?? 0,
        assist: num(prior.assist_component, 0) ?? 0,
        cleanSheet: num(prior.clean_sheet_component, 0) ?? 0,
        defensiveRisk: num(prior.goals_conceded_component, 0) ?? 0,
        save: num(prior.save_component, 0) ?? 0,
        tackle: num(prior.tackle_component, 0) ?? 0,
        chanceCreated: num(prior.chance_created_component, 0) ?? 0,
        shotOnTarget: num(prior.shot_on_target_component, 0) ?? 0,
        cardRisk: num(prior.card_risk_component, 0) ?? 0,
        bonus: num(prior.bonus_component, 0) ?? 0,
        setPieceRole: num(prior.set_piece_role_component, 0) ?? 0
      }
    };
  }

  const appearanceComponent = (
    apps.appearanceProbability * points(scoring, "appearance_up_to_60", 1)
      + apps.sixtyMinuteProbability * points(scoring, "appearance_60_plus", 1)
  );
  const minutesComponent = apps.sixtyMinuteProbability * points(scoring, "appearance_60_plus", 1);
  const attackCap = { GK: 0.25, DEF: 2.1, MID: 3.8, FWD: 4.25 }[position] ?? 3.5;
  const assistCap = position === "GK" ? 0.3 : 2.2;
  const attackingComponent = clamp((num(prior.attacking_component, 0) ?? 0) * roleScale * attackMultiplier, 0, attackCap);
  const assistComponent = clamp((num(prior.assist_component, 0) ?? 0) * roleScale * supportAttackMultiplier, 0, assistCap);
  const cleanSheetComponent = cleanSheetPointsForPosition(scoring, position)
    * clamp(num(scoreContext.clean_sheet_probability, prior.fixture_context?.clean_sheet_probability ?? 0) ?? 0, 0, 1)
    * apps.sixtyMinuteProbability;
  const concededPoints = goalConcededPointsForPosition(scoring, position);
  const goalsConcededComponent = concededPoints
    ? expectedAdditionalGoalsConceded(num(scoreContext.expected_goals_against, 0) ?? 0) * concededPoints * apps.sixtyMinuteProbability
    : 0;
  const saveComponent = position === "GK"
    ? clamp((num(prior.save_component, 0) ?? 0) * roleScale * goalsAgainstMultiplier, 0, 2.2)
    : 0;
  const tackleComponent = clamp((num(prior.tackle_component, 0) ?? 0) * roleScale, 0, 1.1);
  const chanceCreatedComponent = clamp((num(prior.chance_created_component, 0) ?? 0) * roleScale * supportAttackMultiplier, 0, 1.15);
  const shotOnTargetComponent = clamp((num(prior.shot_on_target_component, 0) ?? 0) * roleScale * attackMultiplier, 0, 0.95);
  const cardRiskComponent = (num(prior.card_risk_component, 0) ?? 0) * clamp(roleScale, 0, 1.15);
  const setPieceRoleComponent = (num(prior.set_piece_role_component, 0) ?? 0) * roleScale;
  const bonusComponent = (num(prior.bonus_component, 0) ?? 0) * roleScale;
  const componentSubtotal = Math.max(0, sum([
    appearanceComponent,
    attackingComponent,
    assistComponent,
    cleanSheetComponent,
    goalsConcededComponent,
    saveComponent,
    tackleComponent,
    chanceCreatedComponent,
    shotOnTargetComponent,
    cardRiskComponent,
    setPieceRoleComponent,
    bonusComponent
  ]));
  const md1Adjustment = matchday === "md2" ? md1FormAdjustment(role) : round(md1FormAdjustment(role) * 0.45, 3);
  const cap = ["GK", "DEF"].includes(position) ? 11.8 : 12.8;
  const projected = round(clamp(componentSubtotal + md1Adjustment, 0, cap), 3);
  const roleOnlyEstimate = priorProjected * roleScale;
  const roleAdjustment = round(roleOnlyEstimate - priorProjected, 3);
  const fixtureAdjustment = round(componentSubtotal - roleOnlyEstimate, 3);
  const uncertainty = scoreContext.matchUncertainty || scoreContext.match_uncertainty || scoreContext.uncertaintyLabel || "Medium";
  const uncertaintyRisk = UNCERTAINTY_RISK[uncertainty] ?? 0.09;
  const roleRisk = clamp(num(role?.roleRiskScore, 0.45) ?? 0.45, 0, 1);
  const weakEvidenceRisk = role?.evidenceStrength === "weak" ? 0.08 : 0;
  const md3Risk = matchday === "md3" ? 0.08 : 0;
  const riskScore = round(clamp(roleRisk * 0.62 + uncertaintyRisk + weakEvidenceRisk + md3Risk, 0, 1), 3);
  const riskAdjusted = round(clamp(projected * (1 - riskScore * 0.12) - riskScore * 0.22, 0, projected), 3);
  const floor = round(clamp(appearanceComponent + Math.min(0, goalsConcededComponent) + cardRiskComponent - riskScore * 0.55 + startProbability * 0.18, 0, projected), 3);
  const eventUpside = attackingComponent * 1.1
    + assistComponent * 0.8
    + shotOnTargetComponent * 0.6
    + chanceCreatedComponent * 0.45
    + (["GK", "DEF"].includes(position) ? cleanSheetComponent * 0.45 : 0);
  const ceilingCap = ["GK", "DEF"].includes(position) ? 16.5 : 18;
  const ceiling = round(clamp(projected + Math.max(1.1, eventUpside + startProbability * 0.9 + (num(scoreContext.expected_goals, 1.3) ?? 1.3) * 0.25), projected, ceilingCap), 3);
  const roleTierBonus = ROLE_TIER_BONUS[role?.roleTier] ?? -0.02;
  const captainUpside = round(clamp(
    riskAdjusted * 1.25
      + ceiling * 0.55
      + (num(scoreContext.expected_goals, 1.2) ?? 1.2) * 1.1
      + startProbability * 1.6
      + (expectedMinutes / 90) * 1.1
      + Math.max(0, roleTierBonus) * 8
      - uncertaintyRisk * 2.2,
    0,
    30
  ), 3);

  return {
    expectedMinutes,
    startProbability,
    projected,
    riskAdjusted,
    ceiling,
    floor,
    captainUpside,
    riskScore,
    roleAdjustment,
    fixtureAdjustment,
    md1Adjustment,
    roleScale: round(roleScale, 4),
    roleWeight,
    attackMultiplier: round(attackMultiplier, 4),
    components: {
      appearance: round(appearanceComponent, 3),
      minutes: round(minutesComponent, 3),
      attacking: round(attackingComponent, 3),
      assist: round(assistComponent, 3),
      cleanSheet: round(cleanSheetComponent, 3),
      defensiveRisk: round(goalsConcededComponent, 3),
      save: round(saveComponent, 3),
      tackle: round(tackleComponent, 3),
      chanceCreated: round(chanceCreatedComponent, 3),
      shotOnTarget: round(shotOnTargetComponent, 3),
      cardRisk: round(cardRiskComponent, 3),
      bonus: round(bonusComponent, 3),
      setPieceRole: round(setPieceRoleComponent, 3)
    }
  };
}

function buildProjectionRow(prior, role, scoreView, scoring, financeById, md1ById) {
  const model = componentModel(prior, role, scoreView, scoring);
  const flags = dataQualityFlags(prior, role, scoreView, [
    prior.matchday === "md3" ? "md3_uses_md2_role_prior_lower_confidence" : null,
    role?.evidenceStrength === "weak" ? "weak_md1_role_evidence" : null,
    role?.elite_high_prior ? "elite_high_prior" : null
  ]);
  const context = fixtureContext(scoreView, prior);
  const projectionConfidence = confidenceFromRole(prior, role, prior.matchday);
  const finance = financeById.get(officialFantasyId(prior));
  const md1 = md1ById.get(officialFantasyId(prior));
  const projected = model.projected;
  const priorProjected = num(prior.raw_expected_points, 0) ?? 0;
  const rowRoleReason = prior.matchday === "md1"
    ? "MD1 prior role context preserved."
    : role?.roleReason || "Role Model v2 row unavailable; prior role context retained.";
  const caution = roleCaution(role, scoreView, prior.matchday);
  const reason = projectionReason(role, scoreView, projected, priorProjected, prior.matchday);
  const rowFixtureReason = fixtureReason(scoreView, prior);
  const valueScore = Number.isFinite(finance?.risk_adjusted_points_per_price)
    ? round(finance.risk_adjusted_points_per_price, 4)
    : Number.isFinite(finance?.points_per_price)
      ? round(finance.points_per_price, 4)
      : null;

  return {
    ...prior,
    player_matchday_projection_id: `${officialFantasyId(prior)}-${prior.matchday}-fantasy-pool-v4-md2`,
    expected_minutes: model.expectedMinutes,
    start_probability: model.startProbability,
    raw_expected_points: model.projected,
    risk_adjusted_points: model.riskAdjusted,
    ceiling_points: model.ceiling,
    floor_points: model.floor,
    captain_score: model.captainUpside,
    projectedPoints: model.projected,
    floorPoints: model.floor,
    ceilingPoints: model.ceiling,
    captainUpsideScore: model.captainUpside,
    riskScore: model.riskScore,
    valueScore,
    value_score: valueScore,
    appearance_component: model.components.appearance,
    attacking_component: model.components.attacking,
    assist_component: model.components.assist,
    clean_sheet_component: model.components.cleanSheet,
    goals_conceded_component: model.components.defensiveRisk,
    save_component: model.components.save,
    tackle_component: model.components.tackle,
    chance_created_component: model.components.chanceCreated,
    shot_on_target_component: model.components.shotOnTarget,
    card_risk_component: model.components.cardRisk,
    bonus_component: model.components.bonus,
    set_piece_role_component: model.components.setPieceRole,
    appearanceComponent: model.components.appearance,
    minutesComponent: model.components.minutes,
    attackingComponent: round(sum([
      model.components.attacking,
      model.components.assist,
      model.components.tackle,
      model.components.chanceCreated,
      model.components.shotOnTarget,
      model.components.setPieceRole
    ]), 3),
    cleanSheetComponent: model.components.cleanSheet,
    defensiveRiskComponent: model.components.defensiveRisk,
    saveComponent: model.components.save,
    cardRiskComponent: model.components.cardRisk,
    roleAdjustment: model.roleAdjustment,
    fixtureAdjustment: model.fixtureAdjustment,
    md1FormAdjustment: model.md1Adjustment,
    roleScale: model.roleScale,
    fixtureAttackMultiplier: model.attackMultiplier,
    fixture_context: context,
    opponent: context.opponent,
    opponent_team_id: context.opponent_team_id,
    fixture_id: context.fixture_id,
    match_id: context.fixture_id,
    match_number: context.match_number,
    side: context.side,
    projection_confidence: projectionConfidence,
    role_label: role?.roleTier || prior.minutes_context?.role_label || prior.role_label || "unclear",
    role_confidence: role?.roleConfidence || prior.minutes_context?.role_confidence || prior.role_confidence || projectionConfidence,
    roleTier: role?.roleTier || null,
    roleReason: rowRoleReason,
    fixtureReason: rowFixtureReason,
    projectionReason: reason,
    caution,
    data_quality_flags: flags,
    dataQualityFlags: flags,
    official_scoring_coverage_flags: prior.official_scoring_coverage_flags || [],
    projection_components: {
      appearance_component: model.components.appearance,
      minutes_component: model.components.minutes,
      attacking_component: model.components.attacking,
      assist_component: model.components.assist,
      clean_sheet_component: model.components.cleanSheet,
      goals_conceded_component: model.components.defensiveRisk,
      save_component: model.components.save,
      tackle_component: model.components.tackle,
      chance_created_component: model.components.chanceCreated,
      shot_on_target_component: model.components.shotOnTarget,
      card_risk_component: model.components.cardRisk,
      bonus_component: model.components.bonus,
      set_piece_role_component: model.components.setPieceRole,
      role_adjustment: model.roleAdjustment,
      fixture_adjustment: model.fixtureAdjustment,
      md1_form_adjustment: model.md1Adjustment
    },
    minutes_context: {
      role_label: role?.roleTier || prior.minutes_context?.role_label || null,
      role_confidence: role?.roleConfidence || prior.minutes_context?.role_confidence || null,
      evidence_level: role?.evidenceStrength || prior.minutes_context?.evidence_level || null,
      evidence_notes: rowRoleReason,
      role_risk_score: num(role?.roleRiskScore),
      role_caution: caution,
      md1_actual_fantasy_points: num(role?.md1_actual_fantasy_points),
      md1_actual_points_available: Boolean(role?.md1_actual_points_available),
      md1_role_evidence_type: role?.md1_role_evidence_type || md1?.role_evidence?.inferred_status || null,
      source_usage: prior.minutes_context?.source_usage || null,
      source_club_context: prior.minutes_context?.source_club_context || null
    },
    scoring_context: {
      rules_version: "fifa_world_cup_2026_official_fantasy_rules_v1",
      official_rules_status: "official_imported_needs_manual_review",
      uses_official_scoring_rules: true,
      component_policy: "Official scoring categories are preserved from v3. V4 refreshes role gating and Score v4 fixture/clean-sheet context only.",
      bonus_modeling_note: "Scouting bonus remains unmodeled because selection-rate evidence is unavailable."
    },
    md1_actual_points_context: {
      actual_points: num(role?.md1_actual_fantasy_points),
      available: Boolean(role?.md1_actual_points_available),
      adjustment_applied: model.md1Adjustment,
      policy: "MD1 actuals are capped form/role-confidence input only and do not overwrite projections."
    },
    model_stage: "active_md2_player_projection_support",
    source_model_version: FORMULA_VERSION,
    source_note: "Component player projection v4 refreshes MD2 role/start/minutes with Role Model v2 and fixture context with Score Model v4. Recommendations, Team Builder weights, finance metrics, PELE, and score predictions were not rebuilt."
  };
}

function buildBlockedPlayers(officialRecords, projectedIds, roleById, liveById) {
  return officialRecords
    .filter((record) => !projectedIds.has(officialFantasyId(record)))
    .map((record) => {
      const id = officialFantasyId(record);
      const role = roleById.get(id);
      const live = liveById.get(id);
      const reason = record.selectable_status !== "playing"
        ? `Not selectable in official fantasy pool: ${record.selectable_status}.`
        : "No active public projection row in the current finance/projection identity set.";
      return {
        official_fantasy_player_id: id,
        internal_player_id: record.internal_player_id || role?.internal_player_id || null,
        name: record.name || role?.name || live?.name || null,
        country: record.country || role?.country || live?.team_name || null,
        official_fantasy_position: record.official_fantasy_position || role?.official_fantasy_position || null,
        official_price: num(record.official_price, role?.official_price ?? live?.price ?? null),
        selectable_status: record.selectable_status || role?.selectable_status || live?.status || null,
        roleTier: role?.roleTier || null,
        md2StartProb: record.selectable_status === "playing" ? num(role?.md2StartProb, 0) : 0,
        md2ExpectedMinutes: record.selectable_status === "playing" ? num(role?.md2ExpectedMinutes, 0) : 0,
        projectedPoints: 0,
        risk_adjusted_points: 0,
        captainUpsideScore: 0,
        riskScore: 1,
        blocked_reasons: unique([
          "not_in_active_public_projection_identity_set",
          record.selectable_status !== "playing" ? `selectable_status_${record.selectable_status}` : null,
          role?.caution || null
        ]),
        projectionReason: reason,
        caution: "Excluded from public projection rows; projected points set to zero in support coverage.",
        dataQualityFlags: unique([
          "active_official_record_covered_as_zero_projection",
          "not_in_public_projection_rows",
          record.selectable_status !== "playing" ? "not_selectable_zero_projection" : "playing_without_public_projection_row"
        ])
      };
    });
}

function compactRow(row) {
  return {
    official_fantasy_player_id: officialFantasyId(row),
    name: row.name,
    country: row.country,
    position: row.official_fantasy_position,
    price: row.official_price,
    matchday: row.matchday,
    opponent: row.opponent,
    projectedPoints: row.projectedPoints,
    risk_adjusted_points: row.risk_adjusted_points,
    floorPoints: row.floorPoints,
    ceilingPoints: row.ceilingPoints,
    captainUpsideScore: row.captainUpsideScore,
    start_probability: row.start_probability,
    expected_minutes: row.expected_minutes,
    roleTier: row.roleTier,
    role_confidence: row.role_confidence,
    evidence: row.minutes_context?.evidence_level || null,
    riskScore: row.riskScore,
    projectionReason: row.projectionReason,
    roleReason: row.roleReason,
    fixtureReason: row.fixtureReason,
    caution: row.caution
  };
}

function rangeSummary(values) {
  const valid = values.filter((value) => Number.isFinite(value));
  if (!valid.length) return { min: null, average: null, max: null };
  return {
    min: round(Math.min(...valid), 3),
    average: round(average(valid), 3),
    max: round(Math.max(...valid), 3)
  };
}

function movementRows(md2Rows, priorMd2ById, roleById) {
  return md2Rows
    .map((row) => {
      const prior = priorMd2ById.get(officialFantasyId(row));
      if (!prior) return null;
      const role = roleById.get(officialFantasyId(row));
      const delta = round(row.projectedPoints - (num(prior.raw_expected_points, 0) ?? 0), 3);
      return {
        ...compactRow(row),
        prior_projected_points: num(prior.raw_expected_points, 0),
        v4_projected_points: row.projectedPoints,
        delta,
        role_delta: row.roleAdjustment,
        fixture_delta: row.fixtureAdjustment,
        md1_form_adjustment: row.md1FormAdjustment,
        elite_high_prior: Boolean(role?.elite_high_prior),
        elite_high_prior_flags: role?.elite_high_prior_flags || []
      };
    })
    .filter(Boolean);
}

function buildQa({
  rows,
  blockedPlayers,
  officialRecords,
  recommendations,
  priorRows,
  roleById,
  scoreRows,
  scoreModel,
  roleQa,
  liveMatchday
}) {
  const checks = [];
  const failures = [];
  const reviewFlags = [];
  const pass = (id, ok, detail) => {
    checks.push({ id, status: ok ? "pass" : "fail", detail });
    if (!ok) failures.push({ id, detail });
  };
  const md2Rows = rows.filter((row) => row.matchday === "md2");
  const priorMd2ById = new Map(priorRows.filter((row) => row.matchday === "md2").map((row) => [officialFantasyId(row), row]));
  const projectedIds = new Set(rows.map(officialFantasyId));
  const officialIds = new Set(officialRecords.map(officialFantasyId));
  const blockedIds = new Set(blockedPlayers.map(officialFantasyId));
  const activeCoverageCount = new Set([...projectedIds, ...blockedIds]).size;
  const md2RecommendationIds = new Set(recommendations.filter((row) => row.matchday === "md2").map(officialFantasyId));
  const md2ProjectionIds = new Set(md2Rows.map(officialFantasyId));
  const missingRecommendationProjectionIds = [...md2RecommendationIds].filter((id) => !md2ProjectionIds.has(id));
  const duplicatePlayerMatchdays = Object.entries(countBy(rows, (row) => `${officialFantasyId(row)}|${row.matchday}`)).filter(([, count]) => count > 1);
  const duplicateOfficialIdsByMd = Object.entries(countBy(rows, (row) => `${row.matchday}|${officialFantasyId(row)}`)).filter(([, count]) => count > 1);
  const md2MissingFixture = md2Rows.filter((row) => !row.fixture_context?.fixture_id || !Number.isFinite(num(row.fixture_context?.expected_goals)));
  const numericFields = [
    "projectedPoints",
    "raw_expected_points",
    "risk_adjusted_points",
    "floorPoints",
    "ceilingPoints",
    "captainUpsideScore",
    "start_probability",
    "expected_minutes",
    "riskScore",
    "appearance_component",
    "attacking_component",
    "assist_component",
    "clean_sheet_component",
    "goals_conceded_component",
    "save_component",
    "card_risk_component"
  ];
  const invalidNumeric = rows.flatMap((row) => numericFields
    .filter((field) => !Number.isFinite(num(row[field])))
    .map((field) => ({ id: officialFantasyId(row), matchday: row.matchday, field, value: row[field] })));
  const movement = movementRows(md2Rows, priorMd2ById, roleById);
  const biggestUpgrades = top(movement, 50, (row) => row.delta);
  const biggestDowngrades = top(movement, 50, (row) => -row.delta);
  const movesOverThree = movement.filter((row) => Math.abs(row.delta) > 3);
  const eliteDowngrades = movement.filter((row) => row.elite_high_prior && row.delta < -1.5);
  const weakRoleWithoutCaution = md2Rows.filter((row) => row.minutes_context?.evidence_level === "weak" && !row.caution);
  const nonSelectableTopRows = md2Rows.filter((row) => row.selectable_status !== "playing" && row.projectedPoints > 0);
  const top50 = top(md2Rows, 50, (row) => row.projectedPoints);
  const top50PremiumElite = top50.filter((row) => {
    const role = roleById.get(officialFantasyId(row));
    return Boolean(role?.elite_high_prior) || num(row.official_price, 0) >= 8 || ["locked_starter", "likely_starter", "managed_minutes_star"].includes(row.roleTier);
  });
  const captainTop30 = top(md2Rows, 30, (row) => row.captainUpsideScore);
  const captainPremiumAttackers = captainTop30.filter((row) => ["MID", "FWD"].includes(row.official_fantasy_position) && (num(row.official_price, 0) >= 7.5 || roleById.get(officialFantasyId(row))?.elite_high_prior));
  const cheapTop50 = top50.filter((row) => num(row.official_price, 0) <= 4.5);
  const cheapValueOnlyFlags = cheapTop50.filter((row) => row.projectedPoints < 4.5);
  const priorMd2 = priorRows.filter((row) => row.matchday === "md2");
  const oldDefCs = average(priorMd2.filter((row) => ["GK", "DEF"].includes(row.official_fantasy_position)).map((row) => num(row.clean_sheet_component)));
  const newDefCs = average(md2Rows.filter((row) => ["GK", "DEF"].includes(row.official_fantasy_position)).map((row) => num(row.clean_sheet_component)));
  const avgByPosition = POSITION_CODES.reduce((acc, position) => {
    const posRows = md2Rows.filter((row) => row.official_fantasy_position === position);
    acc[position] = {
      rows: posRows.length,
      projectedPoints: round(average(posRows.map((row) => row.projectedPoints)), 3),
      startProbability: round(average(posRows.map((row) => row.start_probability)), 3),
      expectedMinutes: round(average(posRows.map((row) => row.expected_minutes)), 3),
      cleanSheetComponent: round(average(posRows.map((row) => row.clean_sheet_component)), 3)
    };
    return acc;
  }, {});

  if (movesOverThree.length) reviewFlags.push({ id: "projection_moves_over_three_points", count: movesOverThree.length, sample: movesOverThree.slice(0, 15) });
  if (eliteDowngrades.length) reviewFlags.push({ id: "elite_high_prior_downgrades_over_1_5", count: eliteDowngrades.length, sample: eliteDowngrades.slice(0, 15) });
  if (cheapValueOnlyFlags.length) reviewFlags.push({ id: "cheap_value_top50_review", count: cheapValueOnlyFlags.length, sample: cheapValueOnlyFlags.slice(0, 15) });

  pass("active_official_players_covered", activeCoverageCount === officialRecords.length, {
    active_official_players: officialRecords.length,
    projected_unique_players: projectedIds.size,
    blocked_zero_projection_players: blockedIds.size,
    covered_unique_players: activeCoverageCount
  });
  pass("md2_projection_rows_resolve_to_official_pool", md2Rows.every((row) => officialIds.has(officialFantasyId(row))), {
    md2_projection_rows: md2Rows.length,
    missing_count: md2Rows.filter((row) => !officialIds.has(officialFantasyId(row))).length
  });
  pass("md2_recommendation_projection_coverage", missingRecommendationProjectionIds.length === 0, {
    md2_recommendation_unique_players: md2RecommendationIds.size,
    missing_projection_count: missingRecommendationProjectionIds.length,
    missing_projection_ids: missingRecommendationProjectionIds.slice(0, 20)
  });
  pass("no_duplicate_player_matchday_rows", duplicatePlayerMatchdays.length === 0, { duplicate_count: duplicatePlayerMatchdays.length });
  pass("no_duplicate_official_ids_within_matchday", duplicateOfficialIdsByMd.length === 0, { duplicate_count: duplicateOfficialIdsByMd.length });
  pass("md2_fixture_context_present", md2MissingFixture.length === 0, { missing_count: md2MissingFixture.length });
  pass("numeric_fields_finite", invalidNumeric.length === 0, { invalid_count: invalidNumeric.length, sample: invalidNumeric.slice(0, 20) });
  pass("projection_numeric_bounds", rows.every((row) => (
    row.projectedPoints >= 0
      && row.start_probability >= 0 && row.start_probability <= 1
      && row.expected_minutes >= 0 && row.expected_minutes <= 95
      && row.floorPoints <= row.projectedPoints + 0.001
      && row.projectedPoints <= row.ceilingPoints + 0.001
      && row.captainUpsideScore >= 0 && row.captainUpsideScore <= 30
      && row.riskScore >= 0 && row.riskScore <= 1
  )), { checked_rows: rows.length });
  pass("not_selectable_players_zero_projected", blockedPlayers.every((row) => row.projectedPoints === 0) && nonSelectableTopRows.length === 0, {
    blocked_zero_projection_players: blockedPlayers.length,
    non_selectable_projected_rows: nonSelectableTopRows.length
  });
  pass("md2_explanation_fields_present", md2Rows.every((row) => row.projectionReason && row.roleReason && row.fixtureReason && row.caution), {
    md2_rows: md2Rows.length
  });
  pass("weak_role_evidence_has_caution", weakRoleWithoutCaution.length === 0, { missing_caution_count: weakRoleWithoutCaution.length });
  pass("top50_premium_world_class_sanity", top50PremiumElite.length >= 28, {
    premium_or_elite_top50_count: top50PremiumElite.length,
    top50_count: top50.length
  });
  pass("captain_top30_attack_upside_sanity", captainPremiumAttackers.length >= 18, {
    premium_mid_fwd_top30_count: captainPremiumAttackers.length,
    captain_top30_count: captainTop30.length
  });
  pass("cheap_value_not_dominating_top_projected_points", cheapValueOnlyFlags.length <= 8, {
    cheap_top50_count: cheapTop50.length,
    cheap_value_only_flags: cheapValueOnlyFlags.length
  });
  pass("gk_def_clean_sheet_context_reduced", Number.isFinite(oldDefCs) && Number.isFinite(newDefCs) && newDefCs <= oldDefCs * 1.02, {
    prior_md2_gk_def_avg_clean_sheet_component: round(oldDefCs, 3),
    v4_md2_gk_def_avg_clean_sheet_component: round(newDefCs, 3)
  });
  pass("no_final_squad_backed_claims", rows.every((row) => !row.final_squad_confirmed && !String(row.source_note || "").includes("final-squad-backed")), {
    rows_checked: rows.length
  });

  const checksFailed = checks.filter((check) => check.status === "fail").length;
  return {
    schema_version: "player_projection_qa_md2_v4",
    generated_at: NOW,
    modelVersion: MODEL_VERSION,
    status: checksFailed ? "fail" : "pass",
    source_files: Object.values(PATHS).filter((path) => !path.includes("playerProjectionQa") && !path.includes("fantasyPoolMatchdayProjections_md2_v4")),
    summary: {
      checks_total: checks.length,
      checks_failed: checksFailed,
      projection_rows: rows.length,
      md2_projection_rows: md2Rows.length,
      projected_unique_players: projectedIds.size,
      active_official_player_count: officialRecords.length,
      active_official_player_coverage_count: activeCoverageCount,
      blocked_zero_projection_players: blockedPlayers.length,
      md2_recommendation_unique_players: md2RecommendationIds.size,
      md2_recommendation_projection_missing_count: missingRecommendationProjectionIds.length,
      score_model_version: scoreModel.modelVersion || scoreModel.model_version || scoreModel.model?.formula_version,
      role_model_version: roleQa.modelVersion || roleQa.model_version || "player_role_model_md2_v2",
      md1_final_fixtures_used_by_score_v4: scoreModel.summary?.md1_fixture_count ?? null,
      live_completed_fixtures: liveMatchday.summary?.completed_fixture_count ?? null,
      md2_average_projected_points_by_position: avgByPosition,
      moves_over_three_points_count: movesOverThree.length,
      elite_downgrades_over_1_5_count: eliteDowngrades.length,
      prior_md2_gk_def_avg_clean_sheet_component: round(oldDefCs, 3),
      v4_md2_gk_def_avg_clean_sheet_component: round(newDefCs, 3),
      safe_to_proceed_to_recommendations_v4: checksFailed === 0
    },
    ranges: {
      md2_projectedPoints: rangeSummary(md2Rows.map((row) => row.projectedPoints)),
      md2_riskAdjustedPoints: rangeSummary(md2Rows.map((row) => row.risk_adjusted_points)),
      md2_captainUpsideScore: rangeSummary(md2Rows.map((row) => row.captainUpsideScore)),
      md2_riskScore: rangeSummary(md2Rows.map((row) => row.riskScore))
    },
    top_50_md2_projections: top50.map(compactRow),
    top_20_md2_by_position: POSITION_CODES.reduce((acc, position) => {
      acc[position] = top(md2Rows.filter((row) => row.official_fantasy_position === position), 20, (row) => row.projectedPoints).map(compactRow);
      return acc;
    }, {}),
    top_30_captainUpsideScore: captainTop30.map(compactRow),
    top_30_floor_players: top(md2Rows, 30, (row) => row.floorPoints).map(compactRow),
    top_30_ceiling_players: top(md2Rows, 30, (row) => row.ceilingPoints).map(compactRow),
    biggest_projection_upgrades: biggestUpgrades.slice(0, 50),
    biggest_projection_downgrades: biggestDowngrades.slice(0, 50),
    biggest_role_driven_upgrades: top(movement, 30, (row) => row.role_delta).slice(0, 30),
    biggest_role_driven_downgrades: top(movement, 30, (row) => -row.role_delta).slice(0, 30),
    biggest_score_v4_fixture_driven_upgrades: top(movement, 30, (row) => row.fixture_delta).slice(0, 30),
    biggest_score_v4_fixture_driven_downgrades: top(movement, 30, (row) => -row.fixture_delta).slice(0, 30),
    moves_over_three_points: movesOverThree.slice(0, 50),
    elite_high_prior_downgrades: eliteDowngrades.slice(0, 50),
    not_selectable_zero_projection_count: blockedPlayers.length,
    missing_context: {
      md2_missing_fixture_context: md2MissingFixture.map(compactRow),
      md2_recommendations_missing_projection: missingRecommendationProjectionIds,
      weak_role_without_caution: weakRoleWithoutCaution.map(compactRow)
    },
    reviewFlags,
    checks,
    failures
  };
}

function markdownTable(rows, headers) {
  if (!rows.length) return "_None._";
  return [
    `| ${headers.map((header) => header.label).join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${headers.map((header) => String(row[header.key] ?? "")).join(" | ")} |`)
  ].join("\n");
}

function compactTableRows(rows) {
  return rows.map((row) => ({
    name: row.name,
    country: row.country,
    pos: row.position || row.official_fantasy_position,
    opp: row.opponent,
    proj: row.projectedPoints ?? row.v4_projected_points,
    prior: row.prior_projected_points ?? "",
    delta: row.delta ?? "",
    cap: row.captainUpsideScore,
    start: row.start_probability,
    min: row.expected_minutes,
    role: row.roleTier,
    reason: row.projectionReason
  }));
}

function buildQaReport(qa) {
  const headers = [
    { key: "name", label: "Name" },
    { key: "country", label: "Country" },
    { key: "pos", label: "Pos" },
    { key: "opp", label: "Opp" },
    { key: "proj", label: "Proj" },
    { key: "cap", label: "Captain" },
    { key: "start", label: "Start" },
    { key: "min", label: "Min" },
    { key: "role", label: "Role" }
  ];
  const movementHeaders = [
    { key: "name", label: "Name" },
    { key: "country", label: "Country" },
    { key: "pos", label: "Pos" },
    { key: "opp", label: "Opp" },
    { key: "prior", label: "Prior" },
    { key: "proj", label: "V4" },
    { key: "delta", label: "Delta" },
    { key: "role", label: "Role" }
  ];
  const avg = qa.summary.md2_average_projected_points_by_position;
  const lines = [];
  lines.push("# Player Projection QA MD2 v4");
  lines.push("");
  lines.push(`Generated: ${qa.generated_at}`);
  lines.push(`Status: **${qa.status.toUpperCase()}**`);
  lines.push(`Model: \`${qa.modelVersion}\``);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Projection rows: ${qa.summary.projection_rows}`);
  lines.push(`- MD2 projection rows: ${qa.summary.md2_projection_rows}`);
  lines.push(`- Active official player coverage: ${qa.summary.active_official_player_coverage_count} / ${qa.summary.active_official_player_count}`);
  lines.push(`- Blocked/not-projected zero rows: ${qa.summary.blocked_zero_projection_players}`);
  lines.push(`- MD2 recommendation projection misses: ${qa.summary.md2_recommendation_projection_missing_count}`);
  lines.push(`- Safe to proceed to recommendations v4: ${qa.summary.safe_to_proceed_to_recommendations_v4}`);
  lines.push("");
  lines.push("## MD2 Average Projected Points By Position");
  lines.push("");
  lines.push(markdownTable(POSITION_CODES.map((position) => ({
    position,
    rows: avg[position]?.rows,
    projected: avg[position]?.projectedPoints,
    start: avg[position]?.startProbability,
    minutes: avg[position]?.expectedMinutes,
    cs: avg[position]?.cleanSheetComponent
  })), [
    { key: "position", label: "Position" },
    { key: "rows", label: "Rows" },
    { key: "projected", label: "Avg Proj" },
    { key: "start", label: "Avg Start" },
    { key: "minutes", label: "Avg Min" },
    { key: "cs", label: "Avg CS Comp" }
  ]));
  lines.push("");
  lines.push("## Top 50 MD2 Projections");
  lines.push("");
  lines.push(markdownTable(compactTableRows(qa.top_50_md2_projections), headers));
  lines.push("");
  lines.push("## Top 20 MD2 By Position");
  for (const position of POSITION_CODES) {
    lines.push("");
    lines.push(`### ${position}`);
    lines.push("");
    lines.push(markdownTable(compactTableRows(qa.top_20_md2_by_position[position]), headers));
  }
  lines.push("");
  lines.push("## Top 30 Captain Upside");
  lines.push("");
  lines.push(markdownTable(compactTableRows(qa.top_30_captainUpsideScore), headers));
  lines.push("");
  lines.push("## Top 30 Floor Players");
  lines.push("");
  lines.push(markdownTable(compactTableRows(qa.top_30_floor_players), headers));
  lines.push("");
  lines.push("## Top 30 Ceiling Players");
  lines.push("");
  lines.push(markdownTable(compactTableRows(qa.top_30_ceiling_players), headers));
  lines.push("");
  lines.push("## Biggest Projection Upgrades");
  lines.push("");
  lines.push(markdownTable(compactTableRows(qa.biggest_projection_upgrades.slice(0, 30)), movementHeaders));
  lines.push("");
  lines.push("## Biggest Projection Downgrades");
  lines.push("");
  lines.push(markdownTable(compactTableRows(qa.biggest_projection_downgrades.slice(0, 30)), movementHeaders));
  lines.push("");
  lines.push("## Biggest Role-Driven Changes");
  lines.push("");
  lines.push("### Upgrades");
  lines.push("");
  lines.push(markdownTable(compactTableRows(qa.biggest_role_driven_upgrades.slice(0, 20)), movementHeaders));
  lines.push("");
  lines.push("### Downgrades");
  lines.push("");
  lines.push(markdownTable(compactTableRows(qa.biggest_role_driven_downgrades.slice(0, 20)), movementHeaders));
  lines.push("");
  lines.push("## Biggest Score v4 Fixture-Driven Changes");
  lines.push("");
  lines.push("### Upgrades");
  lines.push("");
  lines.push(markdownTable(compactTableRows(qa.biggest_score_v4_fixture_driven_upgrades.slice(0, 20)), movementHeaders));
  lines.push("");
  lines.push("### Downgrades");
  lines.push("");
  lines.push(markdownTable(compactTableRows(qa.biggest_score_v4_fixture_driven_downgrades.slice(0, 20)), movementHeaders));
  lines.push("");
  lines.push("## Elite/High-Prior Downgrades Over 1.5");
  lines.push("");
  lines.push(markdownTable(compactTableRows(qa.elite_high_prior_downgrades.slice(0, 30)), movementHeaders));
  lines.push("");
  lines.push("## Missing Context");
  lines.push("");
  lines.push(`- MD2 missing fixture context: ${qa.missing_context.md2_missing_fixture_context.length}`);
  lines.push(`- MD2 recommendation projection misses: ${qa.missing_context.md2_recommendations_missing_projection.length}`);
  lines.push(`- Weak role rows without caution: ${qa.missing_context.weak_role_without_caution.length}`);
  lines.push("");
  lines.push("## Checks");
  lines.push("");
  qa.checks.forEach((check) => {
    lines.push(`- **${check.status.toUpperCase()}** \`${check.id}\``);
  });
  lines.push("");
  lines.push("## Review Flags");
  lines.push("");
  if (!qa.reviewFlags.length) {
    lines.push("- None.");
  } else {
    qa.reviewFlags.forEach((flag) => {
      lines.push(`- \`${flag.id}\`: ${flag.count}`);
    });
  }
  lines.push("");
  lines.push("## Failures");
  lines.push("");
  if (!qa.failures.length) {
    lines.push("- None.");
  } else {
    qa.failures.forEach((failure) => {
      lines.push(`- \`${failure.id}\`: ${JSON.stringify(failure.detail)}`);
    });
  }
  lines.push("");
  return `${lines.join("\n").trimEnd()}\n`;
}

function buildModelDoc(scoreModel, roleModel, rules) {
  const categories = (rules.scoring?.categories || []).map((category) => category.category_id).filter(Boolean);
  const lines = [];
  lines.push("# Component Player Projection Model v4 for MD2");
  lines.push("");
  lines.push(`Generated: ${NOW}`);
  lines.push(`Model version: \`${MODEL_VERSION}\``);
  lines.push("");
  lines.push("## Purpose");
  lines.push("");
  lines.push("This model refreshes the active fantasy-pool player matchday projection layer for MD2. It does not rebuild recommendations, Team Builder weights, finance metrics, score predictions, PELE data, or public UI logic.");
  lines.push("");
  lines.push("## Inputs");
  lines.push("");
  lines.push(`- Prior projection baseline: \`${PATHS.priorProjection}\``);
  lines.push(`- Score Model v4: \`${scoreModel.modelVersion || scoreModel.model_version || scoreModel.model?.formula_version}\``);
  lines.push(`- Role Model v2 rows: ${roleModel.summary?.role_rows ?? "n/a"}`);
  lines.push("- Canonical identity: `FANTASY_POOL_OFFICIAL_DATA_STATUS.official_position_records`");
  lines.push("- Official fantasy rules: `fantasyRules.json` and `fantasyRulesData.js`");
  lines.push("- MD1 actual points: capped form/role-confidence signal only, from completed-fixture live support data and the MD1 calibration dataset.");
  lines.push("");
  lines.push("## Scoring Categories Used");
  lines.push("");
  lines.push(categories.length ? categories.map((category) => `- \`${category}\``).join("\n") : "- No scoring categories found.");
  lines.push("");
  lines.push("## Method");
  lines.push("");
  lines.push("- Start from the prior v3 component row so public schema and component fields remain stable.");
  lines.push("- Replace MD2 start probability and expected minutes with Role Model v2 `md2StartProb` and `md2ExpectedMinutes`.");
  lines.push("- For MD3, use the Role Model v2 MD2 evidence as a lower-confidence prior blended with the old projection role inputs.");
  lines.push("- Preserve MD1 prior projection rows and point users to live support actuals; MD1 actual points are not written over projections.");
  lines.push("- Replace fixture context with Score Model v4 team xG, opponent xG, W/D/L, clean-sheet probability, uncertainty, and public context labels.");
  lines.push("- Attack components use 0.55 elasticity to team xG movement for MD2 and 0.48 for MD3, so player points move less than raw team xG.");
  lines.push("- Clean-sheet components use direct Score v4 clean-sheet probability bounded by official position scoring and 60-minute appearance probability.");
  lines.push("- MD1 actual fantasy points are capped as a small form adjustment between -0.35 and +0.45 points.");
  lines.push("- Price is carried as value context only and is not used as an event-rate signal.");
  lines.push("");
  lines.push("## Public Contract");
  lines.push("");
  lines.push("- Browser global preserved: `FANTASY_POOL_PLAYER_MATCHDAY_PROJECTIONS`.");
  lines.push("- Legacy fields preserved: `raw_expected_points`, `risk_adjusted_points`, `floor_points`, `ceiling_points`, `captain_score`, `fixture_context`, `start_probability`, `expected_minutes`.");
  lines.push("- v4 aliases added: `projectedPoints`, `floorPoints`, `ceilingPoints`, `captainUpsideScore`, `riskScore`, `projectionReason`, `roleReason`, `fixtureReason`, `caution`, `dataQualityFlags`.");
  lines.push("");
  lines.push("## Limits");
  lines.push("");
  lines.push("- Final squads are not claimed source-backed.");
  lines.push("- Direct starter/sub/not-in-squad evidence is not available for MD1 in this role model; MD1 points are participation evidence only.");
  lines.push("- Users still need to verify official lineup, status, deadline, and legality inside FIFA.");
  lines.push("");
  return `${lines.join("\n").trimEnd()}\n`;
}

function buildOutput(rows, blockedPlayers, qa, scoreModel, roleModel, roleQa) {
  return {
    schema_version: "fantasy_pool_matchday_projections_md2_v4",
    generated_at: NOW,
    source_checked: SOURCE_CHECKED,
    modelVersion: MODEL_VERSION,
    model_version: MODEL_VERSION,
    model_stage: "active_md2_player_projection_support",
    data_status: qa.status === "pass" ? "active_md2_projection_v4_pass" : "active_md2_projection_v4_fail",
    safety_labels: SAFETY_LABELS,
    previous_active_projection_file: PATHS.priorProjection,
    browser_ready_files_updated: true,
    input_files: [
      PATHS.priorProjection,
      PATHS.roleModel,
      PATHS.roleQa,
      PATHS.scoreModel,
      PATHS.rulesJson,
      PATHS.rulesBrowser,
      PATHS.officialStatusBrowser,
      PATHS.recommendationsBrowser,
      PATHS.financeBrowser,
      PATHS.livePlayerStatus,
      PATHS.liveMatchdayStatus,
      PATHS.md1CalibrationDataset,
      PATHS.md1Postmortem
    ],
    model: {
      model_name: "Component Player Projection Model v4 for MD2",
      formula_version: FORMULA_VERSION,
      score_model_version: scoreModel.modelVersion || scoreModel.model_version || scoreModel.model?.formula_version,
      role_model_version: roleModel.modelVersion || roleQa.modelVersion || "player_role_model_md2_v2",
      uses_official_fantasy_prices: true,
      uses_official_fantasy_positions: true,
      uses_official_scoring_rules: true,
      active_identity_source: "FANTASY_POOL_OFFICIAL_DATA_STATUS.official_position_records",
      primary_join_key: "official_fantasy_player_id",
      md1_actual_points_policy: "capped form/role-confidence adjustment only; actuals remain in live support data",
      attack_elasticity_md2: 0.55,
      attack_elasticity_md3: 0.48,
      clean_sheet_policy: "direct Score v4 clean-sheet probability bounded by official position scoring and 60-minute appearance probability",
      ownership_policy: "Ownership fields are not used as projection signal.",
      preserved_public_global: "FANTASY_POOL_PLAYER_MATCHDAY_PROJECTIONS"
    },
    summary: qa.summary,
    qa_status: qa.status,
    playerMatchdayProjections: rows,
    blockedPlayers
  };
}

async function main() {
  const [
    priorProjection,
    roleModel,
    roleQa,
    scoreModel,
    rules,
    livePlayerStatus,
    liveMatchdayStatus,
    md1CalibrationDataset
  ] = await Promise.all([
    readJson(PATHS.priorProjection),
    readJson(PATHS.roleModel),
    readJson(PATHS.roleQa),
    readJson(PATHS.scoreModel),
    readJson(PATHS.rulesJson),
    readJson(PATHS.livePlayerStatus),
    readJson(PATHS.liveMatchdayStatus),
    readJson(PATHS.md1CalibrationDataset)
  ]);
  const globals = await loadBrowserGlobals([
    PATHS.rulesBrowser,
    PATHS.officialStatusBrowser,
    PATHS.recommendationsBrowser,
    PATHS.financeBrowser,
    PATHS.scoreBrowser
  ]);

  const officialRecords = rowsFrom(globals.FANTASY_POOL_OFFICIAL_DATA_STATUS?.official_position_records, ["official_position_records"]);
  const recommendations = rowsFrom(globals.FANTASY_POOL_RECOMMENDATION_CANDIDATES, ["recommendationCandidates"]);
  const financeRows = rowsFrom(globals.FANTASY_POOL_PLAYER_FINANCE_METRICS, ["playerFinanceMetrics"]);
  const priorRows = rowsFrom(priorProjection.playerMatchdayProjections, ["playerMatchdayProjections"]);
  const roleRows = rowsFrom(roleModel.playerRoleRows, ["playerRoleRows"]);
  const scoreRows = rowsFrom(scoreModel.teamFixturePredictions, ["teamFixturePredictions"]);
  const scoring = scoringMap(rules);
  const roleById = new Map(roleRows.map((row) => [officialFantasyId(row), row]));
  const financeById = new Map(financeRows.map((row) => [officialFantasyId(row), row]));
  const liveById = new Map((livePlayerStatus.players || []).map((row) => [officialFantasyId(row), row]));
  const md1ById = new Map((md1CalibrationDataset.player_rows || []).map((row) => [officialFantasyId(row), row]));
  const scoreMaps = buildScoreMaps(scoreRows);

  const rows = priorRows.map((prior) => {
    const id = officialFantasyId(prior);
    return buildProjectionRow(
      prior,
      roleById.get(id),
      scoreViewForRow(prior, scoreMaps),
      scoring,
      financeById,
      md1ById
    );
  });
  const projectedIds = new Set(rows.map(officialFantasyId));
  const blockedPlayers = buildBlockedPlayers(officialRecords, projectedIds, roleById, liveById);
  const qa = buildQa({
    rows,
    blockedPlayers,
    officialRecords,
    recommendations,
    priorRows,
    roleById,
    scoreRows,
    scoreModel,
    roleQa,
    liveMatchday: liveMatchdayStatus
  });
  const output = buildOutput(rows, blockedPlayers, qa, scoreModel, roleModel, roleQa);
  const browser = [
    "// Generated by scripts/buildFantasyPoolMatchdayProjectionsV4Md2.mjs.",
    `// Source files: ${PATHS.outputJson}`,
    "// Active MD2 component player projection browser data.",
    `window.FANTASY_POOL_MATCHDAY_PROJECTIONS_DATA = ${JSON.stringify(output)};`,
    "window.FANTASY_POOL_PLAYER_MATCHDAY_PROJECTIONS = window.FANTASY_POOL_MATCHDAY_PROJECTIONS_DATA.playerMatchdayProjections;",
    "window.FANTASY_POOL_MATCHDAY_PROJECTIONS_SUMMARY = window.FANTASY_POOL_MATCHDAY_PROJECTIONS_DATA.summary;",
    ""
  ].join("\n");

  await writeFile(PATHS.outputJson, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  await writeFile(PATHS.outputBrowser, browser, "utf8");
  await writeFile(PATHS.qaJson, `${JSON.stringify(qa, null, 2)}\n`, "utf8");
  await writeFile(PATHS.qaReport, buildQaReport(qa), "utf8");
  await writeFile(PATHS.modelDoc, buildModelDoc(scoreModel, roleModel, rules), "utf8");

  console.log(`${PATHS.outputJson}: ${qa.status}`);
  console.log(`projection rows: ${rows.length}`);
  console.log(`MD2 rows: ${rows.filter((row) => row.matchday === "md2").length}`);
  console.log(`active official coverage: ${qa.summary.active_official_player_coverage_count}/${qa.summary.active_official_player_count}`);
  console.log(`blocked zero-projection players: ${blockedPlayers.length}`);
  console.log(`safe to proceed to recommendations v4: ${qa.summary.safe_to_proceed_to_recommendations_v4}`);

  if (qa.status !== "pass") {
    qa.failures.forEach((failure) => {
      console.error(`FAIL ${failure.id}: ${JSON.stringify(failure.detail)}`);
    });
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
