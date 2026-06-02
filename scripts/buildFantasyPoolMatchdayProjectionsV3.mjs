import { access, readFile, writeFile } from "node:fs/promises";

const TODAY = "2026-06-02";
const NOW = new Date().toISOString();

const PATHS = {
  playerInputs: "data/playerRecommendationInputs_v1.json",
  minutesModel: "data/playerMinutesModel_fantasyPool_v0.json",
  scorePredictions: "data/scorePredictions_fantasyPool_v3.json",
  officialRules: "data/officialFantasyRules_v0.json",
  officialRulesImportReport: "data/officialFantasyRulesImportReport_v0.json",
  officialFantasyPlayers: "data/officialFantasyPlayers_v0.json",
  officialSquads: "data/officialSquads_v0.json",
  playerDataCoverage: "data/playerDataCoverageReport_v1.json",
  playerPerformance: "data/playerPerformance.json",
  playerFinanceMetrics: "data/playerFinanceMetrics_v0.json",
  playerMatchdayV2: "data/playerMatchdayProjections_v2.json",
  readiness: "data/officialDataReadiness_v0.json",
  output: "data/playerMatchdayProjections_fantasyPool_v3.json",
  qa: "data/playerMatchdayProjectionQa_fantasyPool_v3.json",
  report: "data/playerMatchdayProjectionReport_fantasyPool_v3.md",
  scoringCoverageAudit: "data/projectionScoringCoverageAudit_fantasyPool_v3.md"
};

const MODEL_STAGE = "fantasy_pool_only";
const SOURCE_MODEL_VERSION = "fantasy_pool_matchday_projection_v3_official_scoring_coverage_preliminary_2026-06-02";
const SAFETY_LABELS = [
  "fantasy_pool_only",
  "not final-squad-backed",
  "not final public recommendations",
  "not Team Builder-ready",
  "safe only for preliminary recommendation staging"
];

const VALID_POSITIONS = new Set(["GK", "DEF", "MID", "FWD"]);
const POSITION_PRIORS = {
  GK: { goals_per90: 0.001, assists_per90: 0.003, yellow_cards_per90: 0.02, red_cards_per90: 0.001, shots_on_target_per90: 0, chances_created_per90: 0, tackles_per90: 0 },
  DEF: { goals_per90: 0.03, assists_per90: 0.035, yellow_cards_per90: 0.17, red_cards_per90: 0.009, shots_on_target_per90: 0.12, chances_created_per90: 0.35, tackles_per90: 1.15 },
  MID: { goals_per90: 0.085, assists_per90: 0.095, yellow_cards_per90: 0.15, red_cards_per90: 0.007, shots_on_target_per90: 0.38, chances_created_per90: 0.9, tackles_per90: 1.35 },
  FWD: { goals_per90: 0.16, assists_per90: 0.075, yellow_cards_per90: 0.11, red_cards_per90: 0.006, shots_on_target_per90: 0.72, chances_created_per90: 0.42, tackles_per90: 0.35 }
};

const ADDED_SCORING_COMPONENTS = [
  "tackle_component",
  "chance_created_component",
  "shot_on_target_component"
];

const CONFIDENCE_WEIGHT = {
  high: 0.93,
  medium: 0.84,
  low: 0.72,
  missing: 0.62,
  thin_profile: 0.54,
  blocked: 0
};

function round(value, digits = 2) {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function num(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
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

function sum(values) {
  return values.filter((value) => Number.isFinite(value)).reduce((total, value) => total + value, 0);
}

function average(values, fallback = null) {
  const valid = values.filter((value) => Number.isFinite(value));
  if (!valid.length) return fallback;
  return sum(valid) / valid.length;
}

function countBy(rows, keyFn) {
  return rows.reduce((counts, row) => {
    const key = keyFn(row);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function unique(values) {
  return [...new Set(values.filter((value) => value !== null && value !== undefined && value !== ""))];
}

function top(rows, limit, scoreFn) {
  return [...rows].sort((a, b) => scoreFn(b) - scoreFn(a)).slice(0, limit);
}

function rangeSummary(values, digits = 3) {
  const valid = values.filter((value) => Number.isFinite(value));
  if (!valid.length) return { min: null, max: null, average: null };
  return {
    min: round(Math.min(...valid), digits),
    max: round(Math.max(...valid), digits),
    average: round(average(valid), digits)
  };
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function maybeReadJson(path) {
  try {
    await access(path);
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return null;
  }
}

async function writeJson(path, data) {
  await writeFile(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function scoringMap(officialRules) {
  const categories = officialRules.officialFantasyRules?.scoring?.categories || [];
  return new Map(categories.map((category) => [category.categoryId, category]));
}

function points(scoring, categoryId, fallback = 0) {
  return num(scoring.get(categoryId)?.points) ?? fallback;
}

function buildCountryTeamMap(scorePredictions) {
  const map = new Map();
  for (const row of scorePredictions.teamFixturePredictions) {
    map.set(normalize(row.team), row.team_id);
  }
  return map;
}

function groupTeamViews(scorePredictions) {
  const byTeam = new Map();
  for (const view of scorePredictions.teamFixturePredictions) {
    if (!byTeam.has(view.team_id)) byTeam.set(view.team_id, []);
    byTeam.get(view.team_id).push(view);
  }
  for (const views of byTeam.values()) views.sort((a, b) => a.match_number - b.match_number);
  return byTeam;
}

function buildPerformanceMaps(playerPerformance, financeMetrics) {
  const performanceById = new Map((playerPerformance?.playerPerformance || []).map((row) => [row.player_id, row]));
  const financeById = new Map((financeMetrics?.playerFinanceMetrics || []).map((row) => [row.player_id, row]));
  return { performanceById, financeById };
}

function firstFinite(values) {
  for (const value of values) {
    const parsed = num(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function rateFromSeasonTotals(total, minutes) {
  const totalNum = num(total);
  const minutesNum = num(minutes);
  if (!Number.isFinite(totalNum) || !Number.isFinite(minutesNum) || minutesNum <= 0) return null;
  return totalNum / (minutesNum / 90);
}

function rateBundle(player, performanceById, financeById) {
  const performance = performanceById.get(player.internal_player_id);
  const finance = financeById.get(player.internal_player_id);
  const financeInput = finance?.input_features_v0 || {};
  const performanceMinutes = num(performance?.minutes);
  const financeMinutes = num(financeInput.club_minutes);
  const minutes = performanceMinutes || financeMinutes;

  const sourceFlags = [];
  const sourceIds = [];
  if (performance) {
    sourceFlags.push("source_backed_player_performance_rates");
    sourceIds.push(...(performance.source_ids || []));
  }
  if (finance) {
    sourceFlags.push("existing_finance_model_rate_context");
    sourceIds.push("playerFinanceMetrics_v0");
  }

  const goalsPer90 = firstFinite([
    performance?.expected?.expected_goals_per90,
    performance?.attacking?.goals_per90,
    rateFromSeasonTotals(performance?.goals, performance?.minutes),
    rateFromSeasonTotals(financeInput.goals, financeMinutes)
  ]);
  const assistsPer90 = firstFinite([
    performance?.expected?.expected_assists_per90,
    performance?.attacking?.assists_per90,
    rateFromSeasonTotals(performance?.assists, performance?.minutes),
    rateFromSeasonTotals(financeInput.assists, financeMinutes)
  ]);
  const shotsOnTargetPer90 = firstFinite([
    performance?.attacking?.shots_on_target_per90,
    rateFromSeasonTotals(performance?.attacking?.shots_on_target, performance?.minutes),
    rateFromSeasonTotals(financeInput.shots_on_target, financeMinutes)
  ]);
  const chancesCreatedPer90 = firstFinite([
    performance?.attacking?.chances_created_per90,
    rateFromSeasonTotals(performance?.attacking?.chances_created, performance?.minutes)
  ]);
  const tacklesPer90 = firstFinite([
    performance?.defensive?.tackles_per90,
    rateFromSeasonTotals(performance?.defensive?.tackles, performance?.minutes)
  ]);
  const yellowCardsPer90 = firstFinite([
    performance?.discipline?.yellow_cards_per90,
    rateFromSeasonTotals(performance?.yellow_cards, performance?.minutes),
    rateFromSeasonTotals(financeInput.yellow_cards, financeMinutes)
  ]);
  const redCardsPer90 = firstFinite([
    performance?.discipline?.red_cards_per90,
    rateFromSeasonTotals(performance?.red_cards, performance?.minutes),
    rateFromSeasonTotals(financeInput.red_cards, financeMinutes)
  ]);
  const savesPer90 = firstFinite([
    performance?.goalkeeping?.saves_per90,
    rateFromSeasonTotals(performance?.goalkeeping?.saves, performance?.minutes),
    rateFromSeasonTotals(financeInput.saves, financeMinutes)
  ]);

  return {
    source_found: Boolean(performance || finance),
    source_flags: unique(sourceFlags),
    source_ids: unique(sourceIds),
    rates: {
      goals_per90: goalsPer90,
      assists_per90: assistsPer90,
      shots_on_target_per90: shotsOnTargetPer90,
      chances_created_per90: chancesCreatedPer90,
      tackles_per90: tacklesPer90,
      yellow_cards_per90: yellowCardsPer90,
      red_cards_per90: redCardsPer90,
      saves_per90: savesPer90
    }
  };
}

function hasFlag(row, flag) {
  return [...(row.data_quality_flags || []), ...(row.minutes_risk_flags || [])].includes(flag);
}

function isThinProfile(player, minutes) {
  return hasFlag(minutes, "thin_profile")
    || (player.identity_data_quality_flags || []).includes("thin_profile")
    || minutes.role_confidence === "thin_profile"
    || String(player.internal_player_id || "").startsWith("thin-");
}

function projectionConfidence(player, minutes, rateSourceUsesPrior) {
  if (isThinProfile(player, minutes)) return "thin_profile";
  if (minutes.role_confidence === "high" && !rateSourceUsesPrior && !hasFlag(minutes, "missing_national_team_usage")) return "high";
  if (["high", "medium"].includes(minutes.role_confidence) && !hasFlag(minutes, "missing_national_team_usage")) return "medium";
  if (minutes.role_confidence === "low" || rateSourceUsesPrior) return "low";
  return "missing";
}

function appearanceProbabilities(minutes) {
  const expectedMinutes = clamp(num(minutes.expected_minutes) ?? 0, 0, 90);
  const startProbability = clamp(num(minutes.start_probability) ?? 0, 0, 1);
  const appearanceProbability = clamp(Math.max(startProbability, expectedMinutes / 30), 0, 1);
  const sixtyMinuteProbability = clamp(startProbability * clamp((expectedMinutes - 18) / 54, 0, 1), 0, 1);
  return { expectedMinutes, startProbability, appearanceProbability, sixtyMinuteProbability };
}

function poissonProbability(lambda, goals) {
  let factorial = 1;
  for (let i = 2; i <= goals; i += 1) factorial *= i;
  return (Math.E ** -lambda) * (lambda ** goals) / factorial;
}

function expectedAdditionalGoalsConceded(lambda) {
  if (!Number.isFinite(lambda) || lambda <= 0) return 0;
  return Math.max(0, lambda - (1 - poissonProbability(lambda, 0)));
}

function sourceOrPriorRate(position, rateName, rates, dataQualityFlags) {
  const sourceRate = rates[rateName];
  if (Number.isFinite(sourceRate)) return { value: sourceRate, source: "source_backed_existing_player_rate" };
  dataQualityFlags.add("conservative_position_team_prior_rates");
  dataQualityFlags.add(`missing_source_backed_${rateName}`);
  return { value: POSITION_PRIORS[position]?.[rateName] ?? 0, source: "conservative_position_team_prior" };
}

function priorComponentDampener(player, minutes) {
  if (isThinProfile(player, minutes)) return 0.15;
  if (minutes.role_confidence === "high") return 0.65;
  if (minutes.role_confidence === "medium") return 0.55;
  if (minutes.role_confidence === "low") return 0.35;
  return 0.25;
}

function eventRateComponent({ rate, events, denominator, pointsValue, sourceCap, priorCap, priorDampenerValue }) {
  const rawComponent = (events / denominator) * pointsValue;
  if (rate.source === "source_backed_existing_player_rate") return clamp(rawComponent, 0, sourceCap);
  return clamp(rawComponent * priorDampenerValue, 0, priorCap);
}

function componentCoverageFlag(categoryId, rate, componentValue) {
  if (!componentValue) return `${categoryId}_modeled_zero`;
  if (rate.source === "source_backed_existing_player_rate") return `${categoryId}_modeled_source_backed`;
  return `${categoryId}_modeled_conservative_prior`;
}

function fixtureContext(view) {
  return {
    fixture_id: view.fixture_id,
    match_number: view.match_number,
    opponent_team_id: view.opponent_team_id,
    opponent: view.opponent,
    side: view.side,
    expected_goals: view.expected_goals,
    expected_goals_against: view.expected_goals_against,
    win_probability: view.win_probability,
    draw_probability: view.draw_probability,
    loss_probability: view.loss_probability,
    clean_sheet_probability: view.clean_sheet_probability,
    fixture_difficulty_score: view.fixture_difficulty_score,
    fixture_difficulty_band: view.fixture_difficulty_band,
    attacking_environment_score: view.attacking_environment_score,
    defensive_environment_score: view.defensive_environment_score,
    captain_environment_score: view.captain_environment_score,
    goal_environment: view.goal_environment,
    upset_risk_probability: view.upset_risk_probability,
    upset_risk_band: view.upset_risk_band,
    score_model_stage: view.model_stage,
    score_qa_flags: view.qa_flags || []
  };
}

function scoringComponents(player, minutes, view, scoring, rateBundleForPlayer) {
  const position = player.official_fantasy_position;
  const flags = new Set([
    ...SAFETY_LABELS.map((label) => label.replaceAll(" ", "_").replaceAll("-", "_")),
    ...(player.data_quality_flags || []),
    ...(player.identity_data_quality_flags || []),
    ...(minutes.data_quality_flags || []),
    ...(minutes.minutes_risk_flags || []),
    ...(view.qa_flags || [])
  ]);

  if (view.qa_flags?.includes("brazil_neymar_usage_source_gap")) flags.add("brazil_neymar_usage_source_gap");
  if (normalize(player.name).includes("neymar")) flags.add("neymar_p0_usage_source_gap");

  const { expectedMinutes, startProbability, appearanceProbability, sixtyMinuteProbability } = appearanceProbabilities(minutes);
  const minutesShare = clamp(expectedMinutes / 90, 0, 1);
  const teamGoalFactor = clamp((view.expected_goals ?? 1.33) / 1.33, 0.45, 1.75);
  const rates = rateBundleForPlayer.rates;
  const goalRate = sourceOrPriorRate(position, "goals_per90", rates, flags);
  const assistRate = sourceOrPriorRate(position, "assists_per90", rates, flags);
  const yellowRate = sourceOrPriorRate(position, "yellow_cards_per90", rates, flags);
  const redRate = sourceOrPriorRate(position, "red_cards_per90", rates, flags);
  const coverageFlags = [];
  if (rateBundleForPlayer.source_found) {
    for (const flag of rateBundleForPlayer.source_flags) flags.add(flag);
  } else {
    flags.add("missing_existing_player_rate_source");
  }

  const goalPoints = {
    GK: points(scoring, "gk_goal_scored", 9),
    DEF: points(scoring, "def_goal_scored", 7),
    MID: points(scoring, "mid_goal_scored", 6),
    FWD: points(scoring, "fwd_goal_scored", 5)
  }[position] ?? 0;
  const cleanSheetPoints = {
    GK: points(scoring, "gk_clean_sheet", 5),
    DEF: points(scoring, "def_clean_sheet", 5),
    MID: points(scoring, "mid_clean_sheet", 1),
    FWD: 0
  }[position] ?? 0;

  const appearanceComponent = (
    appearanceProbability * points(scoring, "appearance_up_to_60", 1)
      + sixtyMinuteProbability * points(scoring, "appearance_60_plus", 1)
  );
  const goalEvents = clamp(goalRate.value * minutesShare * teamGoalFactor, 0, position === "FWD" ? 0.75 : position === "MID" ? 0.55 : position === "DEF" ? 0.25 : 0.03);
  const assistEvents = clamp(assistRate.value * minutesShare * teamGoalFactor, 0, position === "GK" ? 0.04 : 0.55);
  const attackingComponent = goalEvents * goalPoints;
  const assistComponent = assistEvents * points(scoring, "assist", 3);
  const cleanSheetComponent = cleanSheetPoints * view.clean_sheet_probability * sixtyMinuteProbability;
  const goalsConcededComponent = ["GK", "DEF"].includes(position)
    ? expectedAdditionalGoalsConceded(view.expected_goals_against) * (position === "GK" ? points(scoring, "gk_each_additional_goal_conceded", -1) : points(scoring, "def_each_additional_goal_conceded", -1)) * sixtyMinuteProbability
    : 0;

  let saveComponent = 0;
  if (position === "GK") {
    const sourceSaveRate = rates.saves_per90;
    const projectedSaves = Number.isFinite(sourceSaveRate)
      ? sourceSaveRate * minutesShare
      : clamp(view.expected_goals_against * 2.1 * minutesShare, 0, 6);
    if (!Number.isFinite(sourceSaveRate)) flags.add("conservative_goalkeeper_save_prior");
    saveComponent = (projectedSaves / 3) * points(scoring, "gk_every_3_saves", 1);
  }

  const priorDampenerValue = priorComponentDampener(player, minutes);
  let tackleComponent = 0;
  let chanceCreatedComponent = 0;
  let shotOnTargetComponent = 0;

  if (position === "MID") {
    const tackleRate = sourceOrPriorRate(position, "tackles_per90", rates, flags);
    const chanceRate = sourceOrPriorRate(position, "chances_created_per90", rates, flags);
    const tackleEvents = tackleRate.value * minutesShare;
    const chanceEvents = chanceRate.value * minutesShare * clamp(teamGoalFactor, 0.75, 1.25);
    tackleComponent = eventRateComponent({
      rate: tackleRate,
      events: tackleEvents,
      denominator: 3,
      pointsValue: points(scoring, "mid_every_3_tackles", 1),
      sourceCap: 1.1,
      priorCap: 0.32,
      priorDampenerValue
    });
    chanceCreatedComponent = eventRateComponent({
      rate: chanceRate,
      events: chanceEvents,
      denominator: 2,
      pointsValue: points(scoring, "mid_every_2_chances_created", 1),
      sourceCap: 1.15,
      priorCap: 0.34,
      priorDampenerValue
    });
    coverageFlags.push(componentCoverageFlag("mid_every_3_tackles", tackleRate, tackleComponent));
    coverageFlags.push(componentCoverageFlag("mid_every_2_chances_created", chanceRate, chanceCreatedComponent));
  } else {
    coverageFlags.push("mid_every_3_tackles_not_applicable");
    coverageFlags.push("mid_every_2_chances_created_not_applicable");
  }

  if (position === "FWD") {
    const shotOnTargetRate = sourceOrPriorRate(position, "shots_on_target_per90", rates, flags);
    const shotOnTargetEvents = shotOnTargetRate.value * minutesShare * clamp(teamGoalFactor, 0.75, 1.35);
    shotOnTargetComponent = eventRateComponent({
      rate: shotOnTargetRate,
      events: shotOnTargetEvents,
      denominator: 2,
      pointsValue: points(scoring, "fwd_every_2_shots_on_target", 1),
      sourceCap: 0.95,
      priorCap: 0.28,
      priorDampenerValue
    });
    coverageFlags.push(componentCoverageFlag("fwd_every_2_shots_on_target", shotOnTargetRate, shotOnTargetComponent));
  } else {
    coverageFlags.push("fwd_every_2_shots_on_target_not_applicable");
  }

  if (coverageFlags.some((flag) => flag.includes("conservative_prior"))) flags.add("official_scoring_added_components_use_conservative_priors");
  if (coverageFlags.some((flag) => flag.includes("source_backed"))) flags.add("official_scoring_added_components_source_backed");

  const cardRiskComponent = (
    yellowRate.value * minutesShare * points(scoring, "yellow_card", -1)
      + redRate.value * minutesShare * points(scoring, "red_card", -2)
  );

  let setPieceRoleComponent = 0;
  if (player.penalty_role || player.set_piece_role) {
    flags.add("source_backed_set_piece_role_present_event_rate_missing");
  } else {
    flags.add("no_source_backed_set_piece_or_penalty_role");
  }

  const bonusComponent = 0;
  flags.add("scouting_bonus_not_modeled_missing_selection_rate");

  const raw = Math.max(0, appearanceComponent + attackingComponent + assistComponent + cleanSheetComponent + goalsConcededComponent + saveComponent + tackleComponent + chanceCreatedComponent + shotOnTargetComponent + cardRiskComponent + setPieceRoleComponent + bonusComponent);
  const confidence = projectionConfidence(player, minutes, goalRate.source.includes("prior") || assistRate.source.includes("prior"));
  const confidenceFactor = CONFIDENCE_WEIGHT[confidence] ?? 0.65;
  const lowConfidencePenalty = confidence === "high" ? 0 : confidence === "medium" ? 0.04 : confidence === "low" ? 0.1 : 0.16;
  const riskAdjusted = Math.max(0, Math.min(raw, raw * confidenceFactor - lowConfidencePenalty));
  const eventUpside = attackingComponent * 1.35 + assistComponent * 0.9 + (position === "GK" || position === "DEF" ? cleanSheetComponent * 0.7 : 0);
  const ceiling = raw + Math.max(1.2, eventUpside + startProbability * 1.4);
  const floor = Math.max(0, appearanceComponent + goalsConcededComponent + cardRiskComponent - (1 - confidenceFactor) * 1.6);
  const captainScore = riskAdjusted * 1.7 + raw * 0.3 + Math.max(0, attackingComponent) * 0.45 + view.captain_environment_score * 0.01;

  if (confidence === "thin_profile") flags.add("thin_profile");
  if (hasFlag(minutes, "missing_national_team_usage") || minutes.source_usage?.usage_confidence === "missing") flags.add("missing_national_team_usage");
  if (confidence !== "high") flags.add("projection_low_or_medium_confidence");

  return {
    expectedMinutes,
    startProbability,
    raw_expected_points: round(raw, 3),
    risk_adjusted_points: round(riskAdjusted, 3),
    ceiling_points: round(ceiling, 3),
    floor_points: round(floor, 3),
    captain_score: round(captainScore, 3),
    appearance_component: round(appearanceComponent, 3),
    attacking_component: round(attackingComponent, 3),
    assist_component: round(assistComponent, 3),
    clean_sheet_component: round(cleanSheetComponent, 3),
    goals_conceded_component: round(goalsConcededComponent, 3),
    save_component: round(saveComponent, 3),
    tackle_component: round(tackleComponent, 3),
    chance_created_component: round(chanceCreatedComponent, 3),
    shot_on_target_component: round(shotOnTargetComponent, 3),
    card_risk_component: round(cardRiskComponent, 3),
    bonus_component: round(bonusComponent, 3),
    set_piece_role_component: round(setPieceRoleComponent, 3),
    projection_confidence: confidence,
    flags: unique([...flags]),
    official_scoring_coverage_flags: coverageFlags,
    rate_context: {
      goal_rate_per90: round(goalRate.value, 4),
      goal_rate_source: goalRate.source,
      assist_rate_per90: round(assistRate.value, 4),
      assist_rate_source: assistRate.source,
      shots_on_target_per90: round(rates.shots_on_target_per90 ?? POSITION_PRIORS[position]?.shots_on_target_per90 ?? 0, 4),
      shots_on_target_rate_source: rates.shots_on_target_per90 !== null && rates.shots_on_target_per90 !== undefined ? "source_backed_existing_player_rate" : "conservative_position_team_prior",
      chances_created_per90: round(rates.chances_created_per90 ?? POSITION_PRIORS[position]?.chances_created_per90 ?? 0, 4),
      chances_created_rate_source: rates.chances_created_per90 !== null && rates.chances_created_per90 !== undefined ? "source_backed_existing_player_rate" : "conservative_position_team_prior",
      tackles_per90: round(rates.tackles_per90 ?? POSITION_PRIORS[position]?.tackles_per90 ?? 0, 4),
      tackles_rate_source: rates.tackles_per90 !== null && rates.tackles_per90 !== undefined ? "source_backed_existing_player_rate" : "conservative_position_team_prior",
      yellow_cards_per90: round(yellowRate.value, 4),
      yellow_card_rate_source: yellowRate.source,
      red_cards_per90: round(redRate.value, 4),
      red_card_rate_source: redRate.source,
      source_ids: rateBundleForPlayer.source_ids
    }
  };
}

function matchdayLabel(matchdayId) {
  return {
    md1: "Matchday 1",
    md2: "Matchday 2",
    md3: "Matchday 3"
  }[matchdayId] || matchdayId || "Unknown";
}

function buildRows(inputs, minutesModel, scorePredictions, scoring, performanceMaps) {
  const inputsByOfficialId = new Map(inputs.players.map((row) => [String(row.official_fantasy_player_id), row]));
  const teamIdByCountry = buildCountryTeamMap(scorePredictions);
  const teamViews = groupTeamViews(scorePredictions);
  const rows = [];
  const blockedPlayers = [];

  for (const minutes of minutesModel.playerMinutesModel) {
    const player = inputsByOfficialId.get(String(minutes.official_fantasy_player_id)) || minutes;
    const localTeamId = teamIdByCountry.get(normalize(player.country));
    const views = localTeamId ? teamViews.get(localTeamId) || [] : [];
    const isBlocked = minutes.minutes_model_status === "blocked" || player.model_input_status?.startsWith("blocked") || player.selectable_status !== "playing";
    if (isBlocked) {
      blockedPlayers.push({
        internal_player_id: player.internal_player_id,
        official_fantasy_player_id: player.official_fantasy_player_id,
        name: player.name,
        country: player.country,
        official_fantasy_position: player.official_fantasy_position,
        official_price: num(player.official_price),
        model_input_status: player.model_input_status || null,
        minutes_model_status: minutes.minutes_model_status,
        blocked_reasons: unique([...(minutes.blocked_reasons || []), ...(player.data_quality_flags || []).filter((flag) => flag.includes("blocked") || flag.includes("review"))])
      });
      continue;
    }
    const rateContext = rateBundle(player, performanceMaps.performanceById, performanceMaps.financeById);
    for (const view of views) {
      const components = scoringComponents(player, minutes, view, scoring, rateContext);
      rows.push({
        player_matchday_projection_id: `${player.official_fantasy_player_id}-${view.fantasy_matchday_id || view.fixture_id}-fantasy-pool-v3`,
        internal_player_id: player.internal_player_id,
        official_fantasy_player_id: String(player.official_fantasy_player_id),
        name: player.name,
        display_name: player.display_name || player.name,
        country: player.country,
        team_id: localTeamId,
        official_team_id: player.team_id,
        official_fantasy_position: player.official_fantasy_position,
        official_price: num(player.official_price),
        selectable_status: player.selectable_status,
        roster_status: player.roster_status,
        matchday: view.fantasy_matchday_id,
        matchday_label: matchdayLabel(view.fantasy_matchday_id),
        opponent: view.opponent,
        opponent_team_id: view.opponent_team_id,
        fixture_id: view.fixture_id,
        match_id: view.fixture_id,
        match_number: view.match_number,
        side: view.side,
        expected_minutes: components.expectedMinutes,
        start_probability: components.startProbability,
        raw_expected_points: components.raw_expected_points,
        risk_adjusted_points: components.risk_adjusted_points,
        ceiling_points: components.ceiling_points,
        floor_points: components.floor_points,
        captain_score: components.captain_score,
        appearance_component: components.appearance_component,
        attacking_component: components.attacking_component,
        assist_component: components.assist_component,
        clean_sheet_component: components.clean_sheet_component,
        goals_conceded_component: components.goals_conceded_component,
        save_component: components.save_component,
        tackle_component: components.tackle_component,
        chance_created_component: components.chance_created_component,
        shot_on_target_component: components.shot_on_target_component,
        card_risk_component: components.card_risk_component,
        bonus_component: components.bonus_component,
        set_piece_role_component: components.set_piece_role_component,
        fixture_context: fixtureContext(view),
        projection_confidence: components.projection_confidence,
        data_quality_flags: components.flags,
        official_scoring_coverage_flags: components.official_scoring_coverage_flags,
        rate_context: components.rate_context,
        minutes_context: {
          role_label: minutes.role_label,
          role_confidence: minutes.role_confidence,
          evidence_level: minutes.evidence_level,
          evidence_notes: minutes.evidence_notes,
          source_usage: minutes.source_usage || null,
          source_club_context: minutes.source_club_context || null
        },
        scoring_context: {
          rules_version: "fifa_world_cup_2026_official_fantasy_rules_v1",
          official_rules_status: "official_imported_needs_manual_review",
          uses_official_scoring_rules: true,
          bonus_modeling_note: "Scouting bonus is not modeled because selection-rate evidence is unavailable."
        },
        model_stage: MODEL_STAGE,
        source_model_version: SOURCE_MODEL_VERSION,
        source_note: "Staged fantasy_pool_only official-scoring projection using official fantasy players/prices/positions, preliminary minutes model, scorePredictions_fantasyPool_v3, and existing source-backed player rates when available."
      });
    }
  }
  return { rows, blockedPlayers };
}

function comparisonToV2(rows, playerMatchdayV2) {
  const v2ByPlayerFixture = new Map((playerMatchdayV2?.playerMatchdayProjections || []).map((row) => [`${row.player_id}:${row.fixture_id}`, row]));
  const comparable = rows
    .map((row) => {
      const old = v2ByPlayerFixture.get(`${row.internal_player_id}:${row.fixture_id}`);
      if (!old) return null;
      return {
        internal_player_id: row.internal_player_id,
        official_fantasy_player_id: row.official_fantasy_player_id,
        name: row.name,
        country: row.country,
        position: row.official_fantasy_position,
        matchday: row.matchday,
        opponent: row.opponent,
        fixture_id: row.fixture_id,
        v3_raw_expected_points: row.raw_expected_points,
        v2_expected_return_points: old.projections_v2?.expected_return_points ?? null,
        raw_expected_points_delta: round(row.raw_expected_points - (old.projections_v2?.expected_return_points ?? 0), 3),
        v3_risk_adjusted_points: row.risk_adjusted_points,
        v2_risk_adjusted_return_points: old.projections_v2?.risk_adjusted_return_points ?? null,
        risk_adjusted_points_delta: round(row.risk_adjusted_points - (old.projections_v2?.risk_adjusted_return_points ?? 0), 3)
      };
    })
    .filter(Boolean);
  return {
    comparable_rows: comparable.length,
    average_raw_expected_points_delta: round(average(comparable.map((row) => row.raw_expected_points_delta)), 3),
    average_absolute_raw_expected_points_delta: round(average(comparable.map((row) => Math.abs(row.raw_expected_points_delta))), 3),
    average_risk_adjusted_points_delta: round(average(comparable.map((row) => row.risk_adjusted_points_delta)), 3),
    largest_raw_expected_points_differences: top(comparable, 25, (row) => Math.abs(row.raw_expected_points_delta)).map((row) => ({
      name: row.name,
      country: row.country,
      position: row.position,
      matchday: row.matchday,
      opponent: row.opponent,
      v3_raw_expected_points: row.v3_raw_expected_points,
      v2_expected_return_points: row.v2_expected_return_points,
      delta: row.raw_expected_points_delta
    })),
    largest_risk_adjusted_points_differences: top(comparable, 25, (row) => Math.abs(row.risk_adjusted_points_delta)).map((row) => ({
      name: row.name,
      country: row.country,
      position: row.position,
      matchday: row.matchday,
      opponent: row.opponent,
      v3_risk_adjusted_points: row.v3_risk_adjusted_points,
      v2_risk_adjusted_return_points: row.v2_risk_adjusted_return_points,
      delta: row.risk_adjusted_points_delta
    }))
  };
}

function rowSummary(row) {
  return {
    official_fantasy_player_id: row.official_fantasy_player_id,
    name: row.name,
    country: row.country,
    position: row.official_fantasy_position,
    price: row.official_price,
    matchday: row.matchday,
    opponent: row.opponent,
    raw_expected_points: row.raw_expected_points,
    risk_adjusted_points: row.risk_adjusted_points,
    captain_score: row.captain_score,
    tackle_component: row.tackle_component,
    chance_created_component: row.chance_created_component,
    shot_on_target_component: row.shot_on_target_component,
    expected_minutes: row.expected_minutes,
    start_probability: row.start_probability,
    projection_confidence: row.projection_confidence,
    data_quality_flags: row.data_quality_flags
  };
}

function buildQa(rows, blockedPlayers, inputs, minutesModel, scorePredictions, rules, rulesReport, squads, readiness, comparison) {
  const checks = [];
  const push = (check_id, label, ok, detail, severity = "error") => {
    checks.push({ check_id, label, status: ok ? "pass" : "fail", severity, detail });
  };
  const modeledPlayers = new Set(rows.map((row) => row.official_fantasy_player_id));
  const modeledSelectable = minutesModel.playerMinutesModel.filter((row) => row.minutes_model_status === "modeled_fantasy_pool_only" && row.selectable_status === "playing");
  const rowsByPlayer = new Map();
  for (const row of rows) {
    if (!rowsByPlayer.has(row.official_fantasy_player_id)) rowsByPlayer.set(row.official_fantasy_player_id, []);
    rowsByPlayer.get(row.official_fantasy_player_id).push(row);
  }
  const playersWithThreeRows = [...rowsByPlayer.values()].filter((playerRows) => new Set(playerRows.map((row) => row.matchday)).size === 3).length;
  const expectedNumericFields = [
    "expected_minutes",
    "start_probability",
    "raw_expected_points",
    "risk_adjusted_points",
    "ceiling_points",
    "floor_points",
    "captain_score",
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
    "bonus_component"
  ];
  const allNumeric = rows.every((row) => expectedNumericFields.every((field) => Number.isFinite(row[field])));
  const addedComponentRows = rows.map((row) => ({
    row,
    added: sum(ADDED_SCORING_COMPONENTS.map((field) => row[field]))
  }));
  const dominantAddedComponents = addedComponentRows.filter(({ row, added }) => added > Math.max(1.5, row.raw_expected_points * 0.35));
  const oversizedPriorComponents = rows.filter((row) => (
    (row.tackle_component > 0.33 && row.official_scoring_coverage_flags?.includes("mid_every_3_tackles_modeled_conservative_prior"))
      || (row.chance_created_component > 0.35 && row.official_scoring_coverage_flags?.includes("mid_every_2_chances_created_modeled_conservative_prior"))
      || (row.shot_on_target_component > 0.3 && row.official_scoring_coverage_flags?.includes("fwd_every_2_shots_on_target_modeled_conservative_prior"))
  ));
  const thinPlayers = new Set(modeledSelectable.filter((row) => hasFlag(row, "thin_profile") || row.role_confidence === "thin_profile" || String(row.internal_player_id || "").startsWith("thin-")).map((row) => String(row.official_fantasy_player_id)));
  const missingUsagePlayers = new Set(modeledSelectable.filter((row) => hasFlag(row, "missing_national_team_usage") || row.source_usage?.usage_confidence === "missing").map((row) => String(row.official_fantasy_player_id)));
  const neymarRows = rows.filter((row) => normalize(row.name).includes("neymar"));

  push("modeled_player_matchday_coverage", "Modeled selectable players have MD1/MD2/MD3 rows", playersWithThreeRows === modeledSelectable.length, `${playersWithThreeRows}/${modeledSelectable.length} modeled selectable players have three matchday rows.`);
  push("blocked_players_excluded", "Blocked players excluded from active projections", rows.every((row) => !blockedPlayers.some((player) => player.official_fantasy_player_id === row.official_fantasy_player_id)), `${blockedPlayers.length} blocked/not-selectable players are listed separately and excluded from active projection rows.`);
  push("official_price_position_present", "Official price and position present", rows.every((row) => Number.isFinite(row.official_price) && VALID_POSITIONS.has(row.official_fantasy_position)), "Every projection row has official price and official fantasy position.");
  push("projection_numeric_fields", "Projection numeric fields", allNumeric, "Projection numeric fields are present where expected.");
  push("minutes_bounds", "Expected minutes bounds", rows.every((row) => row.expected_minutes >= 0 && row.expected_minutes <= 90), "Expected minutes stay between 0 and 90.");
  push("start_probability_bounds", "Start probability bounds", rows.every((row) => row.start_probability >= 0 && row.start_probability <= 1), "Start probability stays between 0 and 1.");
  push("raw_expected_points_non_negative", "Raw expected points non-negative", rows.every((row) => row.raw_expected_points >= 0), "Raw expected points are non-negative after official scoring components are summed.");
  push("risk_adjusted_not_above_raw", "Risk-adjusted points not above raw", rows.every((row) => row.risk_adjusted_points <= row.raw_expected_points + 0.001), "Risk-adjusted points do not exceed raw expected points.");
  push("captain_score_present", "Captain score present", rows.every((row) => Number.isFinite(row.captain_score)), "Captain score is present for every projection row.");
  push("added_official_components_in_range", "Added official scoring components in range", dominantAddedComponents.length === 0, `${dominantAddedComponents.length} rows have added tackle/chance/SOT components that dominate raw points.`);
  push("conservative_prior_components_capped", "Conservative prior components capped", oversizedPriorComponents.length === 0, `${oversizedPriorComponents.length} rows exceed conservative prior caps for added scoring categories.`);
  push("thin_profiles_flagged", "Thin profiles flagged", rows.filter((row) => thinPlayers.has(row.official_fantasy_player_id)).every((row) => row.data_quality_flags.includes("thin_profile")), `${thinPlayers.size} thin-profile players are flagged on their projection rows.`);
  push("missing_usage_flagged", "Missing usage flagged", rows.filter((row) => missingUsagePlayers.has(row.official_fantasy_player_id)).every((row) => row.data_quality_flags.includes("missing_national_team_usage")), `${missingUsagePlayers.size} players with missing usage are flagged on their projection rows.`);
  push("neymar_brazil_uncertainty_carried", "Neymar/Brazil uncertainty carried forward", neymarRows.length === 0 || neymarRows.every((row) => row.data_quality_flags.includes("neymar_p0_usage_source_gap") && row.data_quality_flags.includes("brazil_neymar_usage_source_gap")), `${neymarRows.length} Neymar rows carry source-gap uncertainty flags.`);
  push("fantasy_pool_only_flags_present", "Fantasy-pool-only flags present", rows.every((row) => row.data_quality_flags.includes("fantasy_pool_only")), "Every row carries fantasy_pool_only.");
  push("no_final_squad_backed_claims", "No final-squad-backed claims", rows.every((row) => row.model_stage === MODEL_STAGE && row.data_quality_flags.includes("not_final_squad_backed")), "No projection row claims final-squad-backed status.");
  push("v3_v2_comparison_available", "v3 vs v2 comparison available", comparison.comparable_rows > 0, `${comparison.comparable_rows} rows can be compared to v2 by internal player ID and fixture.`);

  const highProjectionRows = rows.filter((row) => row.raw_expected_points >= 8 || row.captain_score >= 15);
  push("top_projection_outliers_flagged", "Top projection outliers flagged", true, `${highProjectionRows.length} high projection/captain outlier rows are listed for review.`, "warning");

  const checksFailed = checks.filter((check) => check.status === "fail" && check.severity === "error").length;
  const rowsByMatchday = countBy(rows, (row) => row.matchday);
  const rowsByPosition = countBy(rows, (row) => row.official_fantasy_position);
  const confidenceDistribution = countBy(rows, (row) => row.projection_confidence);
  const flagCounts = rows.reduce((counts, row) => {
    for (const flag of row.data_quality_flags || []) counts[flag] = (counts[flag] || 0) + 1;
    return counts;
  }, {});
  const coverageFlagCounts = rows.reduce((counts, row) => {
    for (const flag of row.official_scoring_coverage_flags || []) counts[flag] = (counts[flag] || 0) + 1;
    return counts;
  }, {});

  const topRaw = top(rows, 25, (row) => row.raw_expected_points).map(rowSummary);
  const topRiskAdjusted = top(rows, 25, (row) => row.risk_adjusted_points).map(rowSummary);
  const topCaptain = top(rows, 25, (row) => row.captain_score).map(rowSummary);
  const valueLooking = top(rows.filter((row) => row.official_price > 0), 25, (row) => row.raw_expected_points / row.official_price).map((row) => ({
    ...rowSummary(row),
    points_per_price: round(row.raw_expected_points / row.official_price, 3)
  }));
  const highRiskHighProjection = top(rows.filter((row) => row.raw_expected_points >= 5 && row.projection_confidence !== "high"), 25, (row) => row.raw_expected_points).map(rowSummary);
  const lowConfidenceHighProjection = top(rows.filter((row) => ["low", "missing", "thin_profile"].includes(row.projection_confidence)), 25, (row) => row.raw_expected_points).map(rowSummary);
  const thinProfileHighProjection = top(rows.filter((row) => row.data_quality_flags.includes("thin_profile")), 25, (row) => row.raw_expected_points).map(rowSummary);

  const stopConditions = [
    {
      id: "final_squads_not_source_backed",
      status: "stop",
      count: 48 - (squads.summary?.teams_marked_complete || 0),
      details: "Final squads are not source-backed complete; projections remain fantasy_pool_only."
    },
    {
      id: "official_rules_manual_review",
      status: rulesReport.status?.includes("needs_manual_review") || rules.officialFantasyRules?.rulesStatus?.includes("needs_manual_review") ? "stop" : "pass",
      count: rulesReport.status?.includes("needs_manual_review") || rules.officialFantasyRules?.rulesStatus?.includes("needs_manual_review") ? 1 : 0,
      details: "Official rules still have manual-review warnings."
    },
    {
      id: "score_predictor_v3_staging_stop_conditions",
      status: scorePredictions.summary?.safe_for_final_public_recommendations === false ? "stop" : "pass",
      count: scorePredictions.summary?.safe_for_final_public_recommendations === false ? 1 : 0,
      details: "Score predictor v3 is fantasy-pool-only and blocked from final public promotion."
    },
    {
      id: "readiness_not_ready_for_model_rerun",
      status: readiness.status === "ready_for_official_model_rerun" ? "pass" : "stop",
      count: readiness.status === "ready_for_official_model_rerun" ? 0 : 1,
      details: `Official data readiness is ${readiness.status}.`
    },
    {
      id: "browser_ready_files_not_regenerated",
      status: "stop",
      count: 1,
      details: "This session intentionally did not update matchdayProjectionsData.js or any browser-ready file."
    },
    {
      id: "recommendations_not_built",
      status: "stop",
      count: 1,
      details: "This session intentionally did not build recommendations."
    },
    {
      id: "neymar_p0_usage_source_gap",
      status: neymarRows.some((row) => row.data_quality_flags.includes("neymar_p0_usage_source_gap")) ? "stop" : "pass",
      count: neymarRows.some((row) => row.data_quality_flags.includes("neymar_p0_usage_source_gap")) ? 1 : 0,
      details: "Neymar remains a P0 usage source gap and is projected conservatively with uncertainty flags."
    }
  ];

  return {
    schema_version: "player_matchday_projection_qa_fantasy_pool_v3",
    generated_at: NOW,
    source_checked: TODAY,
    model_stage: MODEL_STAGE,
    data_status: "staged_pass_blocked_from_final_promotion",
    overall_status: checksFailed ? "fail" : "pass_with_staging_stop_conditions",
    safety_labels: SAFETY_LABELS,
    source_files: [
      PATHS.output,
      PATHS.playerInputs,
      PATHS.minutesModel,
      PATHS.scorePredictions,
      PATHS.officialRules,
      PATHS.playerPerformance,
      PATHS.playerFinanceMetrics,
      PATHS.playerMatchdayV2
    ],
    summary: {
      checks_total: checks.length,
      checks_passed: checks.filter((check) => check.status === "pass").length,
      checks_failed: checksFailed,
      warning_checks: checks.filter((check) => check.severity === "warning").length,
      total_projection_rows: rows.length,
      players_projected: modeledPlayers.size,
      blocked_players: blockedPlayers.length,
      rows_by_matchday: rowsByMatchday,
      projections_by_position: rowsByPosition,
      confidence_distribution: confidenceDistribution,
      thin_profile_players_projected: thinPlayers.size,
      missing_usage_players_projected: missingUsagePlayers.size,
      neymar_projection_rows: neymarRows.length,
      safe_for_preliminary_recommendation_staging: checksFailed === 0,
      safe_for_final_public_recommendations: false,
      safe_for_team_builder_promotion: false
    },
    range_summary: {
      raw_expected_points: rangeSummary(rows.map((row) => row.raw_expected_points)),
      risk_adjusted_points: rangeSummary(rows.map((row) => row.risk_adjusted_points)),
      ceiling_points: rangeSummary(rows.map((row) => row.ceiling_points)),
      floor_points: rangeSummary(rows.map((row) => row.floor_points)),
      captain_score: rangeSummary(rows.map((row) => row.captain_score)),
      expected_minutes: rangeSummary(rows.map((row) => row.expected_minutes)),
      start_probability: rangeSummary(rows.map((row) => row.start_probability))
    },
    added_component_ranges: {
      tackle_component: rangeSummary(rows.map((row) => row.tackle_component)),
      chance_created_component: rangeSummary(rows.map((row) => row.chance_created_component)),
      shot_on_target_component: rangeSummary(rows.map((row) => row.shot_on_target_component)),
      added_official_scoring_components_total: rangeSummary(addedComponentRows.map(({ added }) => added))
    },
    counts_by_data_quality_flag: flagCounts,
    counts_by_official_scoring_coverage_flag: coverageFlagCounts,
    top_25_raw_expected_points: topRaw,
    top_25_risk_adjusted_points: topRiskAdjusted,
    top_25_captain_scores: topCaptain,
    top_25_points_per_price_not_recommendations: valueLooking,
    high_risk_high_projection_players: highRiskHighProjection,
    low_confidence_high_projection_players: lowConfidenceHighProjection,
    thin_profile_high_projection_players: thinProfileHighProjection,
    top_projection_outliers: highProjectionRows.map(rowSummary).slice(0, 25),
    top_25_added_component_totals: top(addedComponentRows, 25, ({ added }) => added).map(({ row, added }) => ({
      ...rowSummary(row),
      added_component_total: round(added, 3),
      tackle_component: row.tackle_component,
      chance_created_component: row.chance_created_component,
      shot_on_target_component: row.shot_on_target_component,
      coverage_flags: row.official_scoring_coverage_flags
    })),
    comparison_to_v2: comparison,
    checks,
    stop_conditions: stopConditions,
    warnings: [
      "fantasy_pool_only_not_final_squad_backed",
      "official_rules_manual_review",
      "Neymar remains a P0 usage source gap",
      "Conservative position/team priors are used when source-backed event rates are missing",
      "matchdayProjectionsData.js intentionally not regenerated"
    ],
    recommended_next_step: "Use this only for preliminary recommendation staging. Do not build public recommendations until final squads, rules warnings, and source gaps are resolved."
  };
}

function buildOutput(rows, blockedPlayers, qa, scorePredictions, rulesReport) {
  return {
    schema_version: "player_matchday_projections_fantasy_pool_v3",
    generated_at: NOW,
    source_checked: TODAY,
    model_stage: MODEL_STAGE,
    data_status: "staged_fantasy_pool_only_not_final_squad_backed_not_final_public_recommendations",
    safety_labels: SAFETY_LABELS,
    previous_active_projection_file: PATHS.playerMatchdayV2,
    browser_ready_files_updated: false,
    input_files: [
      PATHS.playerInputs,
      PATHS.minutesModel,
      PATHS.scorePredictions,
      PATHS.officialRules,
      PATHS.playerPerformance,
      PATHS.playerFinanceMetrics,
      PATHS.playerMatchdayV2
    ],
    model: {
      model_name: "Fantasy-pool-only official-scoring player matchday projections v3",
      formula_version: SOURCE_MODEL_VERSION,
      uses_official_fantasy_prices: true,
      uses_official_fantasy_positions: true,
      uses_official_scoring_rules: true,
      official_rules_import_status: rulesReport.status,
    score_prediction_source_model: scorePredictions.source_model_version || scorePredictions.model?.formula_version,
    minutes_model_source: PATHS.minutesModel,
    added_official_scoring_components: [
      "midfielder tackles",
      "midfielder chances created",
      "forward shots on target"
    ],
    added_component_policy: "Added official scoring categories use source-backed player rates where available. When source-backed rates are missing, small position-specific priors are dampened by minutes and role confidence, capped, and flagged.",
    event_rate_policy: "Use existing source-backed player performance rates where available. If source-backed rates are missing, use conservative position/team priors and flag the row. Do not infer event rates from fame or price.",
    price_policy: "Official price is carried for value context only and is not used as event-rate evidence.",
    promotion_limits: SAFETY_LABELS
    },
    summary: qa.summary,
    stop_conditions: qa.stop_conditions,
    playerMatchdayProjections: rows,
    blockedPlayers: blockedPlayers
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

function compactPlayerRows(rows) {
  return rows.map((row) => ({
    name: row.name,
    country: row.country,
    pos: row.position || row.official_fantasy_position,
    matchday: row.matchday,
    opponent: row.opponent,
    raw: row.raw_expected_points,
    risk: row.risk_adjusted_points,
    captain: row.captain_score,
    added: row.added_component_total ?? round(sum(ADDED_SCORING_COMPONENTS.map((field) => row[field])), 3),
    tackle: row.tackle_component,
    chance: row.chance_created_component,
    sot: row.shot_on_target_component,
    confidence: row.projection_confidence
  }));
}

function compactCoverageRows(qa) {
  return qa.top_25_added_component_totals.map((row) => ({
    name: row.name,
    country: row.country,
    pos: row.position,
    matchday: row.matchday,
    opponent: row.opponent,
    added: row.added_component_total,
    tackle: row.tackle_component,
    chance: row.chance_created_component,
    sot: row.shot_on_target_component,
    confidence: row.projection_confidence,
    flags: row.coverage_flags.join("; ")
  }));
}

function scoringCategoryCoverage(category, qa) {
  const id = category.categoryId;
  const coverageCounts = qa.counts_by_official_scoring_coverage_flag || {};
  const modeledCore = new Set([
    "appearance_up_to_60",
    "appearance_60_plus",
    "assist",
    "yellow_card",
    "red_card",
    "gk_clean_sheet",
    "gk_each_additional_goal_conceded",
    "gk_goal_scored",
    "gk_every_3_saves",
    "def_clean_sheet",
    "def_each_additional_goal_conceded",
    "def_goal_scored",
    "mid_clean_sheet",
    "mid_goal_scored",
    "fwd_goal_scored"
  ]);
  const zeroPointNeutral = new Set(["gk_first_goal_conceded", "def_first_goal_conceded"]);
  const impossibleNow = new Set(["own_goal", "winning_penalty", "conceding_penalty", "gk_penalty_save", "direct_free_kick_goal_bonus", "scouting_bonus"]);
  const addedCategoryMap = {
    mid_every_3_tackles: {
      component: "tackle_component",
      source: "playerPerformance defensive.tackles/minutes where available; otherwise capped MID prior.",
      fallback: "Small MID-only conservative prior dampened by expected minutes and role confidence.",
      risk: "Medium: rewards ball-winning midfielders and can affect MID ordering, but caps prevent it dominating.",
      recommendationImpact: "Improves midfielder floor/value representation in Balanced and Safe without creating captain proof."
    },
    mid_every_2_chances_created: {
      component: "chance_created_component",
      source: "playerPerformance chances_created_per90 where available; otherwise capped MID prior.",
      fallback: "Small MID-only conservative prior scaled by fixture goal environment and dampened by confidence.",
      risk: "Medium-high: attacking mids were previously under-modeled; capped priors reduce over-correction.",
      recommendationImpact: "Improves attacking-midfielder treatment in Balanced, Upside, and Captain Alpha review."
    },
    fwd_every_2_shots_on_target: {
      component: "shot_on_target_component",
      source: "playerPerformance and playerFinanceMetrics shots_on_target/minutes where available; otherwise capped FWD prior.",
      fallback: "Small FWD-only conservative prior scaled by fixture goal environment and dampened by confidence.",
      risk: "Medium-high: forwards were previously missing an official event path; cap keeps goals/assists primary.",
      recommendationImpact: "Improves forward upside/captain comparability without treating price or fame as shot volume."
    }
  };

  if (addedCategoryMap[id]) {
    const sourceCount = coverageCounts[`${id}_modeled_source_backed`] || 0;
    const priorCount = coverageCounts[`${id}_modeled_conservative_prior`] || 0;
    const zeroCount = coverageCounts[`${id}_modeled_zero`] || 0;
    return {
      category_id: id,
      label: category.label,
      points: category.points,
      applies_to: category.appliesTo,
      status: sourceCount ? "modeled_source_backed_and_prior_fallback" : "modeled_conservative_prior",
      component: addedCategoryMap[id].component,
      event_rate_source: addedCategoryMap[id].source,
      fallback: addedCategoryMap[id].fallback,
      risk_of_omission_or_modeling: addedCategoryMap[id].risk,
      recommendation_impact: addedCategoryMap[id].recommendationImpact,
      action: "added_now",
      coverage_counts: { source_backed_rows: sourceCount, conservative_prior_rows: priorCount, zero_rows: zeroCount }
    };
  }

  if (modeledCore.has(id)) {
    return {
      category_id: id,
      label: category.label,
      points: category.points,
      applies_to: category.appliesTo,
      status: "modeled",
      component: "existing projection component",
      event_rate_source: id.includes("goal_scored") || id === "assist" ? "existing player attacking rates where available; conservative priors otherwise" : "official rules plus minutes/fixture context",
      fallback: id.includes("goal_scored") || id === "assist" ? "Conservative position priors flagged when source-backed rates are missing." : "Fixture/minutes-based model component.",
      risk_of_omission_or_modeling: "Low to medium depending on player-rate availability.",
      recommendation_impact: "Already included in raw, risk-adjusted, captain, and value candidate scores.",
      action: "kept_modeled",
      coverage_counts: {}
    };
  }

  if (zeroPointNeutral.has(id)) {
    return {
      category_id: id,
      label: category.label,
      points: category.points,
      applies_to: category.appliesTo,
      status: "modeled_neutral_zero_points",
      component: "none",
      event_rate_source: "No component required because official points value is 0.",
      fallback: "No fallback needed.",
      risk_of_omission_or_modeling: "Low.",
      recommendation_impact: "No scoring impact under imported rules.",
      action: "leave_as_neutral",
      coverage_counts: {}
    };
  }

  if (impossibleNow.has(id)) {
    const details = {
      own_goal: ["impossible_with_current_data", "No source-backed own-goal event-rate data.", "Future event-rate source needed; do not use priors for rare negative events."],
      winning_penalty: ["impossible_with_current_data", "No source-backed penalty-won rate or penalty-role event data.", "Future sourced penalty-won/conceded rates needed."],
      conceding_penalty: ["impossible_with_current_data", "No source-backed penalty-conceded rate.", "Future sourced defensive event-rate data needed."],
      gk_penalty_save: ["impossible_with_current_data", "No source-backed penalty-save opportunity/save rates.", "Future goalkeeper penalty-event source needed."],
      direct_free_kick_goal_bonus: ["partially_modeled_goal_only", "Direct free-kick goals are included only as ordinary goals because no source-backed direct-free-kick goal rate exists.", "Future source-backed direct-free-kick event source needed."],
      scouting_bonus: ["impossible_with_current_data", "No official selection-rate or scouting-bonus trigger evidence.", "Future official rules clarification and selection-rate source needed."]
    }[id];
    return {
      category_id: id,
      label: category.label,
      points: category.points,
      applies_to: category.appliesTo,
      status: details[0],
      component: "not emitted",
      event_rate_source: details[1],
      fallback: "No conservative prior used; omission is flagged rather than invented.",
      risk_of_omission_or_modeling: id === "scouting_bonus" ? "Medium if the bonus is common; currently unresolved due rules/source gap." : "Low to medium because these are sparse events but can swing individual rows.",
      recommendation_impact: details[2],
      action: "future_work",
      coverage_counts: {}
    };
  }

  return {
    category_id: id,
    label: category.label,
    points: category.points,
    applies_to: category.appliesTo,
    status: "review",
    component: "not classified",
    event_rate_source: "Needs manual review.",
    fallback: "None.",
    risk_of_omission_or_modeling: "Unknown.",
    recommendation_impact: "Unknown.",
    action: "review_before_promotion",
    coverage_counts: {}
  };
}

function buildScoringCoverageAudit(officialRules, qa) {
  const categories = officialRules.officialFantasyRules?.scoring?.categories || [];
  const coverageRows = categories.map((category) => scoringCategoryCoverage(category, qa));
  const sourceBackedRows = (qa.counts_by_official_scoring_coverage_flag?.mid_every_3_tackles_modeled_source_backed || 0)
    + (qa.counts_by_official_scoring_coverage_flag?.mid_every_2_chances_created_modeled_source_backed || 0)
    + (qa.counts_by_official_scoring_coverage_flag?.fwd_every_2_shots_on_target_modeled_source_backed || 0);
  const priorRows = (qa.counts_by_official_scoring_coverage_flag?.mid_every_3_tackles_modeled_conservative_prior || 0)
    + (qa.counts_by_official_scoring_coverage_flag?.mid_every_2_chances_created_modeled_conservative_prior || 0)
    + (qa.counts_by_official_scoring_coverage_flag?.fwd_every_2_shots_on_target_modeled_conservative_prior || 0);
  const omittedRows = coverageRows.filter((row) => ["impossible_with_current_data", "partially_modeled_goal_only"].includes(row.status));

  return `# Projection Scoring Coverage Audit Fantasy Pool v3

Generated: ${NOW}

Model stage: fantasy_pool_only. This audit is not final-squad-backed, not final public recommendations, not Team Builder-ready, and safe only for preliminary recommendation staging.

## Summary

- Official scoring categories audited: ${coverageRows.length}.
- Added in this pass: MID tackles, MID chances created, and FWD shots on target.
- Added-component source-backed projection rows: ${sourceBackedRows}.
- Added-component conservative-prior projection rows: ${priorRows}.
- Categories still omitted or partial because current data cannot support them: ${omittedRows.length}.
- QA status after coverage pass: ${qa.overall_status}.

## Category Coverage

${markdownTable(coverageRows.map((row) => ({
    id: row.category_id,
    label: row.label,
    points: row.points,
    applies_to: row.applies_to,
    status: row.status,
    component: row.component,
    source: row.event_rate_source,
    fallback: row.fallback,
    risk: row.risk_of_omission_or_modeling,
    impact: row.recommendation_impact,
    action: row.action
  })), [
    { key: "id", label: "Category ID" },
    { key: "label", label: "Label" },
    { key: "points", label: "Pts" },
    { key: "applies_to", label: "Applies" },
    { key: "status", label: "Status" },
    { key: "component", label: "Component" },
    { key: "source", label: "Rate/source" },
    { key: "fallback", label: "Fallback" },
    { key: "risk", label: "Risk" },
    { key: "impact", label: "Recommendation impact" },
    { key: "action", label: "Action" }
  ])}

## Added Component Ranges

| Component | Min | Avg | Max |
| --- | --- | --- | --- |
| Tackle component | ${qa.added_component_ranges.tackle_component.min} | ${qa.added_component_ranges.tackle_component.average} | ${qa.added_component_ranges.tackle_component.max} |
| Chance-created component | ${qa.added_component_ranges.chance_created_component.min} | ${qa.added_component_ranges.chance_created_component.average} | ${qa.added_component_ranges.chance_created_component.max} |
| Shot-on-target component | ${qa.added_component_ranges.shot_on_target_component.min} | ${qa.added_component_ranges.shot_on_target_component.average} | ${qa.added_component_ranges.shot_on_target_component.max} |
| Added components total | ${qa.added_component_ranges.added_official_scoring_components_total.min} | ${qa.added_component_ranges.added_official_scoring_components_total.average} | ${qa.added_component_ranges.added_official_scoring_components_total.max} |

## Added Component Coverage Flags

${markdownTable(Object.entries(qa.counts_by_official_scoring_coverage_flag).map(([flag, count]) => ({ flag, count })), [
    { key: "flag", label: "Flag" },
    { key: "count", label: "Rows" }
  ])}

## Top Added-Component Rows

${markdownTable(compactCoverageRows(qa).slice(0, 25), [
    { key: "name", label: "Name" },
    { key: "country", label: "Country" },
    { key: "pos", label: "Pos" },
    { key: "matchday", label: "MD" },
    { key: "opponent", label: "Opponent" },
    { key: "added", label: "Added total" },
    { key: "tackle", label: "Tackle" },
    { key: "chance", label: "Chance" },
    { key: "sot", label: "SOT" },
    { key: "confidence", label: "Conf" },
    { key: "flags", label: "Coverage flags" }
  ])}

## QA Notes

- Added components are capped and dampened when they rely on conservative priors.
- Added components are not based on price, fame, or unsourced player reputation.
- Thin profiles and low-confidence rows receive lower prior contribution through the dampener.
- Public promotion remains blocked by final-squad sourcing, official rules warnings, Neymar usage uncertainty, and browser-ready regeneration.
`;
}

function buildReport(qa) {
  return `# Player Matchday Projection Report Fantasy Pool v3

Generated: ${NOW}

## Status

This is a staged \`fantasy_pool_only\` player matchday projection layer. It is not final-squad-backed, not final public recommendations, not Team Builder-ready, and safe only for preliminary recommendation staging.

| Metric | Value |
| --- | --- |
| Overall QA status | ${qa.overall_status} |
| Projection rows | ${qa.summary.total_projection_rows} |
| Players projected | ${qa.summary.players_projected} |
| Blocked players | ${qa.summary.blocked_players} |
| Safe for preliminary recommendation staging | ${qa.summary.safe_for_preliminary_recommendation_staging} |
| Safe for final public recommendations | ${qa.summary.safe_for_final_public_recommendations} |
| Safe for Team Builder promotion | ${qa.summary.safe_for_team_builder_promotion} |

## Methodology

The model uses official fantasy player IDs, official prices, official positions, official scoring categories, the preliminary fantasy-pool minutes model, and \`scorePredictions_fantasyPool_v3\` fixture context. Existing source-backed player performance rates are used where available. Missing event rates use conservative position/team priors and carry explicit data-quality flags. Price is not used as event-rate evidence.

This coverage pass adds separate official-scoring components for midfielder tackles, midfielder chances created, and forward shots on target. Source-backed player rates are used when available; otherwise the added components use small capped priors dampened by expected minutes, role confidence, thin-profile status, and projection confidence.

## Coverage

| Matchday | Rows |
| --- | --- |
${Object.entries(qa.summary.rows_by_matchday).map(([key, value]) => `| ${key} | ${value} |`).join("\n")}

## Projections By Position

| Position | Rows |
| --- | --- |
${Object.entries(qa.summary.projections_by_position).map(([key, value]) => `| ${key} | ${value} |`).join("\n")}

## Confidence Distribution

| Confidence | Rows |
| --- | --- |
${Object.entries(qa.summary.confidence_distribution).map(([key, value]) => `| ${key} | ${value} |`).join("\n")}

## Added Official Scoring Components

| Component | Min | Avg | Max |
| --- | --- | --- | --- |
| Tackle component | ${qa.added_component_ranges.tackle_component.min} | ${qa.added_component_ranges.tackle_component.average} | ${qa.added_component_ranges.tackle_component.max} |
| Chance-created component | ${qa.added_component_ranges.chance_created_component.min} | ${qa.added_component_ranges.chance_created_component.average} | ${qa.added_component_ranges.chance_created_component.max} |
| Shot-on-target component | ${qa.added_component_ranges.shot_on_target_component.min} | ${qa.added_component_ranges.shot_on_target_component.average} | ${qa.added_component_ranges.shot_on_target_component.max} |
| Added components total | ${qa.added_component_ranges.added_official_scoring_components_total.min} | ${qa.added_component_ranges.added_official_scoring_components_total.average} | ${qa.added_component_ranges.added_official_scoring_components_total.max} |

## Top Added-Component Totals

${markdownTable(compactCoverageRows(qa), [
    { key: "name", label: "Name" },
    { key: "country", label: "Country" },
    { key: "pos", label: "Pos" },
    { key: "matchday", label: "MD" },
    { key: "opponent", label: "Opponent" },
    { key: "added", label: "Added total" },
    { key: "tackle", label: "Tackle" },
    { key: "chance", label: "Chance" },
    { key: "sot", label: "SOT" },
    { key: "confidence", label: "Confidence" }
  ])}

## Top Raw Expected Points

${markdownTable(compactPlayerRows(qa.top_25_raw_expected_points), [
    { key: "name", label: "Name" },
    { key: "country", label: "Country" },
    { key: "pos", label: "Pos" },
    { key: "matchday", label: "MD" },
    { key: "opponent", label: "Opponent" },
    { key: "raw", label: "Raw" },
    { key: "confidence", label: "Confidence" }
  ])}

## Top Risk-Adjusted Points

${markdownTable(compactPlayerRows(qa.top_25_risk_adjusted_points), [
    { key: "name", label: "Name" },
    { key: "country", label: "Country" },
    { key: "pos", label: "Pos" },
    { key: "matchday", label: "MD" },
    { key: "opponent", label: "Opponent" },
    { key: "risk", label: "Risk-adj" },
    { key: "confidence", label: "Confidence" }
  ])}

## Top Captain Scores

${markdownTable(compactPlayerRows(qa.top_25_captain_scores), [
    { key: "name", label: "Name" },
    { key: "country", label: "Country" },
    { key: "pos", label: "Pos" },
    { key: "matchday", label: "MD" },
    { key: "opponent", label: "Opponent" },
    { key: "captain", label: "Captain score" },
    { key: "confidence", label: "Confidence" }
  ])}

## Top Points Per Price, Not Recommendations

${markdownTable(qa.top_25_points_per_price_not_recommendations.map((row) => ({
    name: row.name,
    country: row.country,
    pos: row.position,
    matchday: row.matchday,
    opponent: row.opponent,
    raw: row.raw_expected_points,
    ppp: row.points_per_price,
    confidence: row.projection_confidence
  })), [
    { key: "name", label: "Name" },
    { key: "country", label: "Country" },
    { key: "pos", label: "Pos" },
    { key: "matchday", label: "MD" },
    { key: "opponent", label: "Opponent" },
    { key: "raw", label: "Raw" },
    { key: "ppp", label: "Pts/price" },
    { key: "confidence", label: "Confidence" }
  ])}

## High-Risk / High-Projection Players

${markdownTable(compactPlayerRows(qa.high_risk_high_projection_players), [
    { key: "name", label: "Name" },
    { key: "country", label: "Country" },
    { key: "pos", label: "Pos" },
    { key: "matchday", label: "MD" },
    { key: "opponent", label: "Opponent" },
    { key: "raw", label: "Raw" },
    { key: "confidence", label: "Confidence" }
  ])}

## Low-Confidence High Projections

${markdownTable(compactPlayerRows(qa.low_confidence_high_projection_players), [
    { key: "name", label: "Name" },
    { key: "country", label: "Country" },
    { key: "pos", label: "Pos" },
    { key: "matchday", label: "MD" },
    { key: "opponent", label: "Opponent" },
    { key: "raw", label: "Raw" },
    { key: "confidence", label: "Confidence" }
  ])}

## Thin-Profile High Projections

${markdownTable(compactPlayerRows(qa.thin_profile_high_projection_players), [
    { key: "name", label: "Name" },
    { key: "country", label: "Country" },
    { key: "pos", label: "Pos" },
    { key: "matchday", label: "MD" },
    { key: "opponent", label: "Opponent" },
    { key: "raw", label: "Raw" },
    { key: "confidence", label: "Confidence" }
  ])}

## Neymar / Brazil Treatment

Neymar remains a P0 national-team usage source gap. His rows carry \`neymar_p0_usage_source_gap\` and Brazil fixtures carry \`brazil_neymar_usage_source_gap\`. The model does not invent Neymar starts, minutes, set-piece role, penalty role, or final squad status.

## v3 vs v2 Comparison

| Metric | Value |
| --- | --- |
| Comparable rows | ${qa.comparison_to_v2.comparable_rows} |
| Average raw delta | ${qa.comparison_to_v2.average_raw_expected_points_delta} |
| Average absolute raw delta | ${qa.comparison_to_v2.average_absolute_raw_expected_points_delta} |
| Average risk-adjusted delta | ${qa.comparison_to_v2.average_risk_adjusted_points_delta} |

## Largest Differences From v2

${markdownTable(qa.comparison_to_v2.largest_raw_expected_points_differences.slice(0, 15), [
    { key: "name", label: "Name" },
    { key: "country", label: "Country" },
    { key: "position", label: "Pos" },
    { key: "matchday", label: "MD" },
    { key: "opponent", label: "Opponent" },
    { key: "v3_raw_expected_points", label: "v3 raw" },
    { key: "v2_expected_return_points", label: "v2 expected" },
    { key: "delta", label: "Delta" }
  ])}

## Stop Conditions Before Recommendations

${markdownTable(qa.stop_conditions.map((row) => ({
    id: row.id,
    status: row.status,
    count: row.count,
    details: row.details
  })), [
    { key: "id", label: "Stop condition" },
    { key: "status", label: "Status" },
    { key: "count", label: "Count" },
    { key: "details", label: "Details" }
  ])}

## QA Checks

${markdownTable(qa.checks.map((row) => ({
    id: row.check_id,
    status: row.status,
    severity: row.severity,
    detail: row.detail
  })), [
    { key: "id", label: "Check" },
    { key: "status", label: "Status" },
    { key: "severity", label: "Severity" },
    { key: "detail", label: "Detail" }
  ])}

## Promotion Decision

These projections are safe for preliminary recommendation staging only. They remain blocked from public promotion and Team Builder use until final squads, official rules warnings, score predictor stop conditions, Neymar's P0 usage gap, and browser-ready regeneration are resolved.
`;
}

async function main() {
  const [
    inputs,
    minutesModel,
    scorePredictions,
    officialRules,
    rulesReport,
    officialFantasyPlayers,
    officialSquads,
    playerDataCoverage,
    playerPerformance,
    financeMetrics,
    playerMatchdayV2,
    readiness
  ] = await Promise.all([
    readJson(PATHS.playerInputs),
    readJson(PATHS.minutesModel),
    readJson(PATHS.scorePredictions),
    readJson(PATHS.officialRules),
    readJson(PATHS.officialRulesImportReport),
    readJson(PATHS.officialFantasyPlayers),
    readJson(PATHS.officialSquads),
    readJson(PATHS.playerDataCoverage),
    maybeReadJson(PATHS.playerPerformance),
    maybeReadJson(PATHS.playerFinanceMetrics),
    readJson(PATHS.playerMatchdayV2),
    readJson(PATHS.readiness)
  ]);

  void officialFantasyPlayers;
  void playerDataCoverage;

  const scoring = scoringMap(officialRules);
  if (!scoring.size) throw new Error("Official fantasy scoring categories are missing.");
  const performanceMaps = buildPerformanceMaps(playerPerformance, financeMetrics);
  const { rows, blockedPlayers } = buildRows(inputs, minutesModel, scorePredictions, scoring, performanceMaps);
  const comparison = comparisonToV2(rows, playerMatchdayV2);
  const qa = buildQa(rows, blockedPlayers, inputs, minutesModel, scorePredictions, officialRules, rulesReport, officialSquads, readiness, comparison);
  const output = buildOutput(rows, blockedPlayers, qa, scorePredictions, rulesReport);
  const report = buildReport(qa);
  const scoringCoverageAudit = buildScoringCoverageAudit(officialRules, qa);

  await writeJson(PATHS.output, output);
  await writeJson(PATHS.qa, qa);
  await writeFile(PATHS.report, report, "utf8");
  await writeFile(PATHS.scoringCoverageAudit, scoringCoverageAudit, "utf8");

  console.log(`Created ${PATHS.output}`);
  console.log(`Created ${PATHS.qa}`);
  console.log(`Created ${PATHS.report}`);
  console.log(`Created ${PATHS.scoringCoverageAudit}`);
  console.log(`Projection rows: ${rows.length}`);
  console.log(`Players projected: ${qa.summary.players_projected}`);
  console.log(`Blocked players: ${blockedPlayers.length}`);
  console.log(`QA status: ${qa.overall_status}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
