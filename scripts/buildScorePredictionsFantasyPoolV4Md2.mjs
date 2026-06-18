import { readFile, writeFile } from "node:fs/promises";

const PATHS = {
  scoreV3: "data/scorePredictions_fantasyPool_v3.json",
  md1Dataset: "data/md1CalibrationDataset_v1.json",
  md1Postmortem: "data/md1ModelPostmortem_v1.json",
  teamQuality: "data/teamQuality.json",
  liveMatchday: "data/liveMatchdayStatus_v1.json",
  liveFixtureQa: "data/liveFixtureMappingQa_v1.json",
  scoreV4: "data/scorePredictions_fantasyPool_v4_md2.json",
  browserScoreData: "fantasyPoolScorePredictionsData.js",
  modelReport: "data/scorePredictionModel_v4_md2.md",
  qaJson: "data/scorePredictionQa_v4_md2.json",
  qaReport: "data/scorePredictionQaReport_v4_md2.md"
};

const MODEL_VERSION = "score-v4-md2-pele-md1-calibrated";
const MODEL_STAGE = "fantasy_pool_only";
const SOURCE_MODEL_VERSION = "fantasy_pool_score_prediction_v4_md2_pele_md1_calibrated_2026-06-18";
const GLOBAL_SHRINK = 0.55;
const TEAM_ATTACK_SHRINK = 0.35;
const TEAM_DEFENSE_SHRINK = 0.35;
const GLOBAL_CAP = [0.92, 1.18];
const ATTACK_CAP = [0.86, 1.18];
const DEFENSE_CAP = [0.86, 1.18];
const TEAM_XG_CAP = [0.15, 4.5];
const CLEAN_SHEET_EXTRA_CAP = [0.75, 1.05];
const WDL_SHRINK_CAP = 0.15;
const SCORE_GRID_MAX_GOALS = 10;

function round(value, digits = 3) {
  if (!Number.isFinite(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function num(value, fallback = null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function avg(values, fallback = null) {
  const clean = values.filter(Number.isFinite);
  return clean.length ? clean.reduce((sum, value) => sum + value, 0) / clean.length : fallback;
}

function sum(values) {
  return values.filter(Number.isFinite).reduce((total, value) => total + value, 0);
}

function countBy(rows, keyFn) {
  const output = {};
  for (const row of rows) {
    const key = keyFn(row) ?? "unknown";
    output[key] = (output[key] || 0) + 1;
  }
  return output;
}

function rangeSummary(values, digits = 3) {
  const clean = values.filter(Number.isFinite);
  if (!clean.length) {
    return { min: null, max: null, average: null };
  }
  return {
    min: round(Math.min(...clean), digits),
    max: round(Math.max(...clean), digits),
    average: round(avg(clean), digits)
  };
}

function slug(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, "-");
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function writeJson(filePath, data) {
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function poisson(k, lambda) {
  let factorial = 1;
  for (let index = 2; index <= k; index += 1) factorial *= index;
  return (Math.E ** -lambda) * (lambda ** k) / factorial;
}

function scoreGrid(homeXg, awayXg, maxGoals = SCORE_GRID_MAX_GOALS) {
  const grid = [];
  let total = 0;
  for (let home = 0; home <= maxGoals; home += 1) {
    for (let away = 0; away <= maxGoals; away += 1) {
      const probability = poisson(home, homeXg) * poisson(away, awayXg);
      total += probability;
      grid.push({ home_goals: home, away_goals: away, probability });
    }
  }

  let homeWin = 0;
  let draw = 0;
  let awayWin = 0;
  let homeCleanSheet = 0;
  let awayCleanSheet = 0;
  let over25 = 0;
  let btts = 0;

  for (const cell of grid) {
    const probability = cell.probability / total;
    if (cell.home_goals > cell.away_goals) homeWin += probability;
    if (cell.home_goals === cell.away_goals) draw += probability;
    if (cell.home_goals < cell.away_goals) awayWin += probability;
    if (cell.away_goals === 0) homeCleanSheet += probability;
    if (cell.home_goals === 0) awayCleanSheet += probability;
    if (cell.home_goals + cell.away_goals >= 3) over25 += probability;
    if (cell.home_goals > 0 && cell.away_goals > 0) btts += probability;
  }

  const topScorelines = grid
    .map((cell) => ({
      scoreline: `${cell.home_goals}-${cell.away_goals}`,
      home_goals: cell.home_goals,
      away_goals: cell.away_goals,
      probability: round(cell.probability / total, 4)
    }))
    .sort((left, right) => right.probability - left.probability)
    .slice(0, 6);

  return {
    homeWin: round(homeWin, 6),
    draw: round(draw, 6),
    awayWin: round(awayWin, 6),
    homeCleanSheet: round(homeCleanSheet, 6),
    awayCleanSheet: round(awayCleanSheet, 6),
    over25: round(over25, 6),
    under25: round(1 - over25, 6),
    btts: round(btts, 6),
    topScorelines
  };
}

function shrinkWdl(grid, shrink) {
  const neutral = 1 / 3;
  const home = grid.homeWin * (1 - shrink) + neutral * shrink;
  const draw = grid.draw * (1 - shrink) + neutral * shrink;
  const away = grid.awayWin * (1 - shrink) + neutral * shrink;
  const total = home + draw + away;
  return {
    homeWin: round(home / total, 4),
    draw: round(draw / total, 4),
    awayWin: round(away / total, 4)
  };
}

function goalEnvironment(totalExpectedGoals) {
  if (totalExpectedGoals >= 2.95) return "high_goal_environment";
  if (totalExpectedGoals >= 2.65) return "medium_high_goal_environment";
  if (totalExpectedGoals >= 2.35) return "medium_goal_environment";
  return "low_goal_environment";
}

function publicGoalEnvironmentLabel(totalExpectedGoals) {
  if (totalExpectedGoals >= 2.95) return "Strong";
  if (totalExpectedGoals >= 2.55) return "Good";
  if (totalExpectedGoals >= 2.2) return "Neutral";
  return "Difficult";
}

function publicUpsetRiskLabel(probability) {
  if (probability >= 0.28) return "High";
  if (probability >= 0.12) return "Medium";
  return "Low";
}

function upsetRiskBand(probability) {
  if (probability >= 0.28) return "high";
  if (probability >= 0.2) return "medium_high";
  if (probability >= 0.12) return "medium";
  return "low";
}

function cleanSheetBand(probability) {
  if (probability >= 0.55) return "strong";
  if (probability >= 0.38) return "good";
  if (probability >= 0.22) return "medium";
  if (probability >= 0.12) return "weak";
  return "poor";
}

function cleanSheetContextLabel(probability) {
  if (probability >= 0.55) return "Strong";
  if (probability >= 0.38) return "Good";
  if (probability >= 0.22) return "Neutral";
  return "Difficult";
}

function teamAttackerEnvironment(expectedGoals) {
  if (expectedGoals >= 1.9) return "Strong";
  if (expectedGoals >= 1.35) return "Good";
  if (expectedGoals >= 0.9) return "Neutral";
  return "Difficult";
}

function fixtureAttackerEnvironment(homeXg, awayXg, totalExpectedGoals) {
  const maxTeamXg = Math.max(homeXg, awayXg);
  if (maxTeamXg >= 2.05 || totalExpectedGoals >= 3.05) return "Strong";
  if (maxTeamXg >= 1.55 || totalExpectedGoals >= 2.6) return "Good";
  if (maxTeamXg >= 1.1 || totalExpectedGoals >= 2.25) return "Neutral";
  return "Difficult";
}

function defenderEnvironmentLabel(cleanSheetProbability, expectedGoalsAgainst) {
  if (cleanSheetProbability >= 0.55 && expectedGoalsAgainst <= 0.75) return "Strong";
  if (cleanSheetProbability >= 0.38 || expectedGoalsAgainst <= 1.05) return "Good";
  if (cleanSheetProbability >= 0.22 || expectedGoalsAgainst <= 1.45) return "Neutral";
  return "Difficult";
}

function keeperEnvironmentLabel(cleanSheetProbability, expectedGoalsAgainst) {
  if (cleanSheetProbability >= 0.55 && expectedGoalsAgainst <= 0.75) return "Strong";
  if (cleanSheetProbability >= 0.38 || expectedGoalsAgainst <= 1.1) return "Good";
  if (cleanSheetProbability >= 0.22 || expectedGoalsAgainst <= 1.65) return "Neutral";
  return "Difficult";
}

function difficultyBand(score) {
  if (score <= 25) return "very_favorable";
  if (score <= 40) return "favorable";
  if (score <= 60) return "neutral";
  if (score <= 75) return "difficult";
  return "very_difficult";
}

function fixtureDifficultyScore({ teamXg, opponentXg, winProbability, cleanSheetProbability }) {
  return round(clamp(
    82
      - winProbability * 36
      - teamXg * 12
      - cleanSheetProbability * 16
      + opponentXg * 7,
    1,
    99
  ), 2);
}

function environmentScores({ teamXg, opponentXg, winProbability, cleanSheetProbability }) {
  return {
    attacking: round(clamp(teamXg * 31 + winProbability * 30 - opponentXg * 3, 0, 100), 1),
    defensive: round(clamp(cleanSheetProbability * 76 + winProbability * 18 - opponentXg * 8, 0, 100), 1),
    captain: round(clamp(teamXg * 28 + winProbability * 32 + cleanSheetProbability * 8, 0, 100), 1)
  };
}

function goalBandSpread(expectedGoals, uncertaintyLabel) {
  const profiles = {
    Low: { base: 0.11, rate: 0.08, max: 0.32 },
    Medium: { base: 0.17, rate: 0.11, max: 0.45 },
    High: { base: 0.23, rate: 0.15, max: 0.62 }
  };
  const profile = profiles[uncertaintyLabel] || profiles.Medium;
  return round(clamp(profile.base + expectedGoals * profile.rate, 0.12, profile.max), 3);
}

function wdlShrunkAmount(row) {
  return Math.max(
    Math.abs(num(row.home_win_probability, 0) - num(row.v4_calibration?.pre_wdl_shrink_probabilities?.home_win, 0)),
    Math.abs(num(row.draw_probability, 0) - num(row.v4_calibration?.pre_wdl_shrink_probabilities?.draw, 0)),
    Math.abs(num(row.away_win_probability, 0) - num(row.v4_calibration?.pre_wdl_shrink_probabilities?.away_win, 0))
  );
}

function uncertaintyForFixture(prior, calibration) {
  const notes = [];
  let score = num(prior.uncertaintyScore ?? prior.uncertainty_score, 24);

  if (calibration.globalGoalMultiplier > 1.05) {
    score += 5;
    notes.push("Hotter MD1 goal environment");
  }
  if (calibration.homeAttackMultiplier >= 1.08 || calibration.awayAttackMultiplier >= 1.08) {
    score += 6;
    notes.push("Team attack upgraded after MD1");
  }
  if (calibration.homeDefenseWeaknessMultiplier >= 1.08 || calibration.awayDefenseWeaknessMultiplier >= 1.08) {
    score += 6;
    notes.push("Defense risk increased after MD1");
  }
  if (calibration.extremeResidualTeams.length) {
    score += 8;
    notes.push("Higher uncertainty after MD1 miss");
  }
  if (calibration.wdlConfidenceShrink >= 0.1) {
    score += 4;
  }

  score += Math.min(8, Math.abs(calibration.totalXgDelta) * 6);

  const uncertaintyScore = round(clamp(score, 0, 100), 1);
  const uncertaintyLabel = uncertaintyScore >= 40 ? "High" : uncertaintyScore >= 24 ? "Medium" : "Low";
  const reason = notes.slice(0, 3).join(", ") || (
    uncertaintyLabel === "Low"
      ? "clearer fantasy score path"
      : uncertaintyLabel === "Medium"
        ? "some fantasy score-path sensitivity"
        : "multiple fantasy score-path risks"
  );

  const homeSpread = goalBandSpread(calibration.homeXg, uncertaintyLabel);
  const awaySpread = goalBandSpread(calibration.awayXg, uncertaintyLabel);
  const homeXgLow = round(clamp(calibration.homeXg - homeSpread, 0.12, calibration.homeXg), 3);
  const awayXgLow = round(clamp(calibration.awayXg - awaySpread, 0.12, calibration.awayXg), 3);
  const homeXgHigh = round(calibration.homeXg + homeSpread, 3);
  const awayXgHigh = round(calibration.awayXg + awaySpread, 3);

  return {
    uncertaintyScore,
    uncertainty_score: uncertaintyScore,
    uncertaintyLabel,
    uncertainty_label: uncertaintyLabel,
    matchUncertainty: uncertaintyLabel,
    match_uncertainty: uncertaintyLabel,
    lowTotalGoals: round(homeXgLow + awayXgLow, 3),
    low_total_goals: round(homeXgLow + awayXgLow, 3),
    baseTotalGoals: round(calibration.homeXg + calibration.awayXg, 3),
    base_total_goals: round(calibration.homeXg + calibration.awayXg, 3),
    highTotalGoals: round(homeXgHigh + awayXgHigh, 3),
    high_total_goals: round(homeXgHigh + awayXgHigh, 3),
    homeXgLow,
    home_xg_low: homeXgLow,
    homeXgBase: calibration.homeXg,
    home_xg_base: calibration.homeXg,
    homeXgHigh,
    home_xg_high: homeXgHigh,
    awayXgLow,
    away_xg_low: awayXgLow,
    awayXgBase: calibration.awayXg,
    away_xg_base: calibration.awayXg,
    awayXgHigh,
    away_xg_high: awayXgHigh,
    uncertaintyReason: `${uncertaintyLabel} uncertainty: ${reason}.`,
    uncertainty_reason: `${uncertaintyLabel} uncertainty: ${reason}.`,
    uncertainty_inputs: {
      md1_calibration_notes: notes,
      global_goal_multiplier: calibration.globalGoalMultiplier,
      home_attack_multiplier: calibration.homeAttackMultiplier,
      away_attack_multiplier: calibration.awayAttackMultiplier,
      home_defense_weakness_multiplier: calibration.homeDefenseWeaknessMultiplier,
      away_defense_weakness_multiplier: calibration.awayDefenseWeaknessMultiplier,
      wdl_confidence_shrink: calibration.wdlConfidenceShrink,
      total_xg_delta: round(calibration.totalXgDelta, 3)
    }
  };
}

function fantasyContext({ homeXg, awayXg, totalExpectedGoals, homeCleanSheet, awayCleanSheet, upsetRiskProbability, uncertaintyLabel }) {
  const strongestCleanSheetProbability = Math.max(homeCleanSheet, awayCleanSheet);
  const cleanSheetContext = cleanSheetContextLabel(strongestCleanSheetProbability);
  const defenderEnvironment = defenderEnvironmentLabel(strongestCleanSheetProbability, Math.min(homeXg, awayXg));
  const keeperEnvironment = keeperEnvironmentLabel(strongestCleanSheetProbability, Math.min(homeXg, awayXg));
  const attackerEnvironment = fixtureAttackerEnvironment(homeXg, awayXg, totalExpectedGoals);
  const goalEnvironmentPublic = publicGoalEnvironmentLabel(totalExpectedGoals);
  const upsetRiskPublic = publicUpsetRiskLabel(upsetRiskProbability);

  return {
    attackerEnvironment,
    attacker_environment: attackerEnvironment,
    defenderEnvironment,
    defender_environment: defenderEnvironment,
    keeperEnvironment,
    keeper_environment: keeperEnvironment,
    cleanSheetContext,
    clean_sheet_context: cleanSheetContext,
    goalEnvironment: goalEnvironmentPublic,
    goal_environment_public: goalEnvironmentPublic,
    upsetRisk: upsetRiskPublic,
    upset_risk_public: upsetRiskPublic,
    matchUncertainty: uncertaintyLabel,
    match_uncertainty: uncertaintyLabel
  };
}

function teamPredictionView(priorTeamRow, fixture, side, teamXg, opponentXg, winProbability, drawProbability, lossProbability, cleanSheetProbability, goalEnv, upsetRiskProbability, upsetBand, uncertaintyLabel) {
  const scores = environmentScores({ teamXg, opponentXg, winProbability, cleanSheetProbability });
  const difficulty = fixtureDifficultyScore({ teamXg, opponentXg, winProbability, cleanSheetProbability });
  const attackerEnvironment = teamAttackerEnvironment(teamXg);
  const defenderEnvironment = defenderEnvironmentLabel(cleanSheetProbability, opponentXg);
  const keeperEnvironment = keeperEnvironmentLabel(cleanSheetProbability, opponentXg);
  const cleanSheetContext = cleanSheetContextLabel(cleanSheetProbability);
  const goalEnvironmentPublic = publicGoalEnvironmentLabel(teamXg + opponentXg);
  const upsetRiskPublic = publicUpsetRiskLabel(upsetRiskProbability);

  return {
    ...(priorTeamRow || {}),
    fixture_id: fixture.fixture_id,
    match_id: fixture.match_id,
    match_number: fixture.match_number,
    fantasy_matchday_id: fixture.fantasy_matchday_id,
    expected_goals: teamXg,
    projectedXg: teamXg,
    projected_xg: teamXg,
    matchXg: teamXg,
    match_xg: teamXg,
    expected_goals_against: opponentXg,
    win_probability: winProbability,
    draw_probability: drawProbability,
    loss_probability: lossProbability,
    clean_sheet_probability: cleanSheetProbability,
    clean_sheet_band: cleanSheetBand(cleanSheetProbability),
    fixture_difficulty_score: difficulty,
    fixture_difficulty_band: difficultyBand(difficulty),
    attacking_environment_score: scores.attacking,
    defensive_environment_score: scores.defensive,
    captain_environment_score: scores.captain,
    attackerEnvironment,
    attacker_environment: attackerEnvironment,
    defenderEnvironment,
    defender_environment: defenderEnvironment,
    keeperEnvironment,
    keeper_environment: keeperEnvironment,
    cleanSheetContext,
    clean_sheet_context: cleanSheetContext,
    goalEnvironment: goalEnvironmentPublic,
    goal_environment_public: goalEnvironmentPublic,
    upsetRisk: upsetRiskPublic,
    upset_risk_public: upsetRiskPublic,
    matchUncertainty: uncertaintyLabel,
    match_uncertainty: uncertaintyLabel,
    goal_environment: goalEnv,
    upset_risk_probability: upsetRiskProbability,
    upset_risk_band: upsetBand,
    uncertaintyLabel: uncertaintyLabel,
    uncertainty_label: uncertaintyLabel,
    side,
    model_stage: MODEL_STAGE
  };
}

function orderedProbabilitiesHomeFavorite(home, away) {
  if (home >= away) {
    return {
      favorite_side: "home",
      favorite_win_probability: home,
      underdog_win_probability: away
    };
  }
  return {
    favorite_side: "away",
    favorite_win_probability: away,
    underdog_win_probability: home
  };
}

function buildTeamIdMaps(scoreV3) {
  const output = new Map();
  for (const row of scoreV3.fixtureScorePredictions) {
    output.set(slug(row.home_team), row.home_team_id);
    output.set(slug(row.away_team), row.away_team_id);
    output.set(row.home_team_id, row.home_team_id);
    output.set(row.away_team_id, row.away_team_id);
  }
  return output;
}

function teamIdForAdjustment(row, teamIdMap) {
  return teamIdMap.get(slug(row.team)) || row.team_key || slug(row.team);
}

function teamAdjustmentExplanation(row, attackMultiplier, defenseMultiplier, uncertaintyFlag) {
  const notes = [];
  if (attackMultiplier >= 1.08) notes.push("attack upgraded after MD1");
  if (attackMultiplier <= 0.94) notes.push("attack cooled after MD1");
  if (defenseMultiplier >= 1.08) notes.push("defense risk increased after MD1");
  if (defenseMultiplier <= 0.94) notes.push("defense risk eased after MD1");
  if (uncertaintyFlag !== "normal") notes.push("large MD1 residual kept uncertain");
  return notes.length
    ? notes.join("; ")
    : "neutral or small MD1 residual; PELE prior remains dominant";
}

function buildTeamAdjustments(md1Dataset, teamIdMap) {
  return md1Dataset.team_residual_rows.map((row) => {
    const rawAttackResidual = Math.log((num(row.actual_goals_for, 0) + 0.7) / (num(row.predicted_goals_for, 0) + 0.7));
    const rawDefenseResidual = Math.log((num(row.actual_goals_against, 0) + 0.7) / (num(row.predicted_goals_against, 0) + 0.7));
    const attackMultiplier = round(clamp(Math.exp(TEAM_ATTACK_SHRINK * rawAttackResidual), ATTACK_CAP[0], ATTACK_CAP[1]), 4);
    const defenseWeaknessMultiplier = round(clamp(Math.exp(TEAM_DEFENSE_SHRINK * rawDefenseResidual), DEFENSE_CAP[0], DEFENSE_CAP[1]), 4);
    const uncertaintyFlag = row.residual_severity === "extreme"
      ? "extreme_md1_residual"
      : row.residual_severity === "moderate"
        ? "moderate_md1_residual"
        : "normal";
    return {
      team: row.team,
      team_id: teamIdForAdjustment(row, teamIdMap),
      opponent_in_md1: row.opponent,
      fixture_key: row.fixture_key,
      predicted_gf: row.predicted_goals_for,
      actual_gf: row.actual_goals_for,
      predicted_ga: row.predicted_goals_against,
      actual_ga: row.actual_goals_against,
      attack_residual: row.attack_residual,
      defense_residual: row.defense_residual,
      raw_attack_residual: round(rawAttackResidual, 4),
      raw_defense_weakness_residual: round(rawDefenseResidual, 4),
      attack_multiplier: attackMultiplier,
      defense_weakness_multiplier: defenseWeaknessMultiplier,
      uncertainty_flag: uncertaintyFlag,
      explanation: teamAdjustmentExplanation(row, attackMultiplier, defenseWeaknessMultiplier, uncertaintyFlag)
    };
  });
}

function computeCleanSheetMultiplier(md1Dataset) {
  const sides = md1Dataset.fixture_calibration_rows.flatMap((row) => [
    row.clean_sheet_evaluation.home,
    row.clean_sheet_evaluation.away
  ]);
  const expected = sum(sides.map((row) => num(row.prior_probability, 0)));
  const actual = sides.filter((row) => row.actual_clean_sheet).length;
  if (!expected) {
    return {
      cleanSheetCalibrationUsed: false,
      cleanSheetMultiplier: 1,
      expectedCleanSheets: 0,
      actualCleanSheets: actual,
      rawCleanSheetRatio: null
    };
  }

  const rawRatio = actual / expected;
  const multiplier = clamp(Math.exp(0.35 * Math.log(rawRatio)), CLEAN_SHEET_EXTRA_CAP[0], CLEAN_SHEET_EXTRA_CAP[1]);
  return {
    cleanSheetCalibrationUsed: Math.abs(multiplier - 1) > 0.005,
    cleanSheetMultiplier: round(multiplier, 4),
    expectedCleanSheets: round(expected, 3),
    actualCleanSheets: actual,
    rawCleanSheetRatio: round(rawRatio, 4)
  };
}

function buildCalibrationMetadata(md1Dataset) {
  const fixtures = md1Dataset.fixture_calibration_rows || [];
  const predictedGoalsPerMatch = avg(fixtures.map((row) => num(row.predicted_total_xg, null)));
  const actualGoalsPerMatch = avg(fixtures.map((row) => num(row.actual_total_goals, null)));
  const calibrationRatio = actualGoalsPerMatch / predictedGoalsPerMatch;
  const globalGoalMultiplier = clamp(Math.exp(GLOBAL_SHRINK * Math.log(calibrationRatio)), GLOBAL_CAP[0], GLOBAL_CAP[1]);
  const resultAccuracy = md1Dataset.summary?.fixture?.predicted_result_accuracy ?? 0.417;
  const favoriteAccuracy = md1Dataset.summary?.fixture?.favorite_result_accuracy ?? resultAccuracy;
  const resultGap = Math.max(0, 0.55 - Math.min(resultAccuracy, favoriteAccuracy));
  const wdlConfidenceShrink = clamp(0.08 + resultGap * 0.25, 0.08, WDL_SHRINK_CAP);
  const cleanSheet = computeCleanSheetMultiplier(md1Dataset);

  return {
    modelVersion: MODEL_VERSION,
    generatedAt: new Date().toISOString(),
    md1FixturesUsed: fixtures.length,
    actualGoalsPerMatch: round(actualGoalsPerMatch, 3),
    predictedGoalsPerMatch: round(predictedGoalsPerMatch, 3),
    calibrationRatio: round(calibrationRatio, 4),
    globalGoalMultiplier: round(globalGoalMultiplier, 4),
    globalShrink: GLOBAL_SHRINK,
    teamAttackShrink: TEAM_ATTACK_SHRINK,
    teamDefenseShrink: TEAM_DEFENSE_SHRINK,
    attackMultiplierCaps: ATTACK_CAP,
    defenseWeaknessMultiplierCaps: DEFENSE_CAP,
    cleanSheetCalibrationUsed: cleanSheet.cleanSheetCalibrationUsed,
    cleanSheetMultiplier: cleanSheet.cleanSheetMultiplier,
    expectedCleanSheetsPriorMd1: cleanSheet.expectedCleanSheets,
    actualCleanSheetsMd1: cleanSheet.actualCleanSheets,
    rawCleanSheetRatio: cleanSheet.rawCleanSheetRatio,
    wdlConfidenceShrinkUsed: wdlConfidenceShrink > 0,
    wdlConfidenceShrink: round(wdlConfidenceShrink, 4),
    md1ResultAccuracy: round(resultAccuracy, 4),
    md1FavoriteAccuracy: round(favoriteAccuracy, 4),
    peleRebuilt: false,
    finalSquadsSourceBacked: false,
    ownershipUsedAsSignal: false,
    md1ActualsScope: "completed_final_md1_fixtures_only",
    md2Md3ActualsUsed: false
  };
}

function xgAliases(homeXg, awayXg, homeTeam, awayTeam) {
  return {
    home_expected_goals: homeXg,
    away_expected_goals: awayXg,
    homeProjectedXg: homeXg,
    awayProjectedXg: awayXg,
    home_projected_xg: homeXg,
    away_projected_xg: awayXg,
    homeMatchXg: homeXg,
    awayMatchXg: awayXg,
    home_match_xg: homeXg,
    away_match_xg: awayXg,
    projectedXg: {
      home: homeXg,
      away: awayXg,
      home_team: homeTeam,
      away_team: awayTeam,
      meaning: "fixture_specific_expected_goals_against_listed_opponent"
    },
    projected_xg: {
      home: homeXg,
      away: awayXg,
      home_team: homeTeam,
      away_team: awayTeam,
      meaning: "fixture_specific_expected_goals_against_listed_opponent"
    },
    total_expected_goals: round(homeXg + awayXg, 3)
  };
}

function recalibrateFixture(prior, adjustmentsByTeam, calibrationMetadata) {
  if (prior.fantasy_matchday_id === "md1") {
    return {
      ...prior,
      modelVersion: MODEL_VERSION,
      model_version: MODEL_VERSION,
      v4_calibration: {
        calibration_applied: false,
        md1_prior_prediction_retained: true,
        reason: "Completed MD1 fixture; original prior prediction fields retained for postmortem/display support."
      }
    };
  }

  const homeAdjustment = adjustmentsByTeam.get(prior.home_team_id) || null;
  const awayAdjustment = adjustmentsByTeam.get(prior.away_team_id) || null;
  const homeAttackMultiplier = homeAdjustment?.attack_multiplier ?? 1;
  const awayAttackMultiplier = awayAdjustment?.attack_multiplier ?? 1;
  const homeDefenseWeaknessMultiplier = homeAdjustment?.defense_weakness_multiplier ?? 1;
  const awayDefenseWeaknessMultiplier = awayAdjustment?.defense_weakness_multiplier ?? 1;
  const homeXg = round(clamp(
    num(prior.home_expected_goals, 0)
      * calibrationMetadata.globalGoalMultiplier
      * homeAttackMultiplier
      * awayDefenseWeaknessMultiplier,
    TEAM_XG_CAP[0],
    TEAM_XG_CAP[1]
  ), 3);
  const awayXg = round(clamp(
    num(prior.away_expected_goals, 0)
      * calibrationMetadata.globalGoalMultiplier
      * awayAttackMultiplier
      * homeDefenseWeaknessMultiplier,
    TEAM_XG_CAP[0],
    TEAM_XG_CAP[1]
  ), 3);
  const grid = scoreGrid(homeXg, awayXg);
  const wdl = shrinkWdl(grid, calibrationMetadata.wdlConfidenceShrink);
  const homeCleanSheet = round(clamp(grid.homeCleanSheet * calibrationMetadata.cleanSheetMultiplier, 0, 1), 4);
  const awayCleanSheet = round(clamp(grid.awayCleanSheet * calibrationMetadata.cleanSheetMultiplier, 0, 1), 4);
  const favorite = orderedProbabilitiesHomeFavorite(wdl.homeWin, wdl.awayWin);
  const homeFavorite = favorite.favorite_side === "home";
  const underdogWinProbability = homeFavorite ? wdl.awayWin : wdl.homeWin;
  const upsetRiskProbability = round(underdogWinProbability + wdl.draw * 0.24, 4);
  const upsetBand = upsetRiskBand(upsetRiskProbability);
  const totalXg = round(homeXg + awayXg, 3);
  const goalEnv = goalEnvironment(totalXg);
  const extremeResidualTeams = [homeAdjustment, awayAdjustment]
    .filter(Boolean)
    .filter((row) => row.uncertainty_flag === "extreme_md1_residual")
    .map((row) => row.team);
  const calibration = {
    calibrationApplied: true,
    globalGoalMultiplier: calibrationMetadata.globalGoalMultiplier,
    homeAttackMultiplier,
    awayAttackMultiplier,
    homeDefenseWeaknessMultiplier,
    awayDefenseWeaknessMultiplier,
    homeXg,
    awayXg,
    totalXgDelta: totalXg - num(prior.total_expected_goals, 0),
    wdlConfidenceShrink: calibrationMetadata.wdlConfidenceShrink,
    extremeResidualTeams
  };
  const uncertainty = uncertaintyForFixture(prior, calibration);
  const context = fantasyContext({
    homeXg,
    awayXg,
    totalExpectedGoals: totalXg,
    homeCleanSheet,
    awayCleanSheet,
    upsetRiskProbability,
    uncertaintyLabel: uncertainty.uncertaintyLabel
  });
  const homeTeamPrediction = teamPredictionView(
    prior.home_team_prediction,
    prior,
    "home_listed",
    homeXg,
    awayXg,
    wdl.homeWin,
    wdl.draw,
    wdl.awayWin,
    homeCleanSheet,
    goalEnv,
    upsetRiskProbability,
    upsetBand,
    uncertainty.uncertaintyLabel
  );
  const awayTeamPrediction = teamPredictionView(
    prior.away_team_prediction,
    prior,
    "away_listed",
    awayXg,
    homeXg,
    wdl.awayWin,
    wdl.draw,
    wdl.homeWin,
    awayCleanSheet,
    goalEnv,
    upsetRiskProbability,
    upsetBand,
    uncertainty.uncertaintyLabel
  );
  const qaFlags = Array.from(new Set([
    ...(prior.qa_flags || []),
    "md1_final_calibrated_score_v4",
    "pele_prior_not_rebuilt",
    "final_squads_not_source_backed",
    "ownership_not_used_as_signal"
  ]));

  return {
    ...prior,
    prediction_id: String(prior.prediction_id || "").replace("fantasy-pool-v3", "fantasy-pool-v4-md2") || `${prior.fixture_id}-score-fantasy-pool-v4-md2`,
    ...xgAliases(homeXg, awayXg, prior.home_team, prior.away_team),
    home_win_probability: wdl.homeWin,
    draw_probability: wdl.draw,
    away_win_probability: wdl.awayWin,
    home_clean_sheet_probability: homeCleanSheet,
    away_clean_sheet_probability: awayCleanSheet,
    over_2_5_goals_probability: round(grid.over25, 4),
    under_2_5_goals_probability: round(grid.under25, 4),
    both_teams_to_score_probability: round(grid.btts, 4),
    goal_environment: goalEnv,
    upset_risk: upsetBand,
    favorite: homeFavorite ? prior.home_team : prior.away_team,
    favorite_team_id: homeFavorite ? prior.home_team_id : prior.away_team_id,
    favorite_team: homeFavorite ? prior.home_team : prior.away_team,
    favorite_win_probability: favorite.favorite_win_probability,
    underdog_team_id: homeFavorite ? prior.away_team_id : prior.home_team_id,
    underdog_team: homeFavorite ? prior.away_team : prior.home_team,
    underdog_win_probability: underdogWinProbability,
    upset_risk_probability: upsetRiskProbability,
    upset_risk_band: upsetBand,
    ...uncertainty,
    ...context,
    top_scorelines: grid.topScorelines,
    home_team_prediction: homeTeamPrediction,
    away_team_prediction: awayTeamPrediction,
    source_model_version: SOURCE_MODEL_VERSION,
    modelVersion: MODEL_VERSION,
    model_version: MODEL_VERSION,
    model_stage: MODEL_STAGE,
    qa_flags: qaFlags,
    comparison_to_v3: {
      home_expected_goals_delta: round(homeXg - num(prior.home_expected_goals, 0), 3),
      away_expected_goals_delta: round(awayXg - num(prior.away_expected_goals, 0), 3),
      total_expected_goals_delta: round(totalXg - num(prior.total_expected_goals, 0), 3),
      home_win_probability_delta: round(wdl.homeWin - num(prior.home_win_probability, 0), 4),
      draw_probability_delta: round(wdl.draw - num(prior.draw_probability, 0), 4),
      away_win_probability_delta: round(wdl.awayWin - num(prior.away_win_probability, 0), 4),
      home_clean_sheet_probability_delta: round(homeCleanSheet - num(prior.home_clean_sheet_probability, 0), 4),
      away_clean_sheet_probability_delta: round(awayCleanSheet - num(prior.away_clean_sheet_probability, 0), 4)
    },
    v4_calibration: {
      calibration_applied: true,
      md1_prior_prediction_retained: false,
      prior_home_xg: num(prior.home_expected_goals, null),
      prior_away_xg: num(prior.away_expected_goals, null),
      global_goal_multiplier: calibrationMetadata.globalGoalMultiplier,
      home_attack_multiplier: homeAttackMultiplier,
      away_attack_multiplier: awayAttackMultiplier,
      home_defense_weakness_multiplier: homeDefenseWeaknessMultiplier,
      away_defense_weakness_multiplier: awayDefenseWeaknessMultiplier,
      clean_sheet_multiplier: calibrationMetadata.cleanSheetMultiplier,
      wdl_confidence_shrink: calibrationMetadata.wdlConfidenceShrink,
      pre_wdl_shrink_probabilities: {
        home_win: round(grid.homeWin, 4),
        draw: round(grid.draw, 4),
        away_win: round(grid.awayWin, 4)
      },
      home_md1_adjustment: homeAdjustment,
      away_md1_adjustment: awayAdjustment,
      public_notes: uncertainty.uncertainty_inputs.md1_calibration_notes
    },
    data_quality: {
      ...(prior.data_quality || {}),
      uses_final_rosters: false,
      pele_rebuilt: false,
      ownership_used_as_signal: false,
      md2_md3_actuals_used: false
    },
    source_note: "MD1-calibrated fantasy-pool score v4 for MD2/MD3. PELE/teamQuality remains the prior; MD1 completed fixture residuals adjust goal environment, team attack/defense risk, W/D/L confidence, and clean-sheet optimism."
  };
}

function transformTeamFixtureRows(scoreRows, priorTeamRows) {
  const teamRows = [];
  const priorByKey = new Map(priorTeamRows.map((row) => [`${row.fixture_id}:${row.team_id}`, row]));

  for (const fixture of scoreRows) {
    const homePrior = priorByKey.get(`${fixture.fixture_id}:${fixture.home_team_id}`) || fixture.home_team_prediction || {};
    const awayPrior = priorByKey.get(`${fixture.fixture_id}:${fixture.away_team_id}`) || fixture.away_team_prediction || {};
    const md1Retained = fixture.fantasy_matchday_id === "md1";
    if (md1Retained) {
      teamRows.push({
        ...homePrior,
        source_model_version: homePrior.source_model_version || fixture.source_model_version,
        v4_calibration: { calibration_applied: false, md1_prior_prediction_retained: true }
      });
      teamRows.push({
        ...awayPrior,
        source_model_version: awayPrior.source_model_version || fixture.source_model_version,
        v4_calibration: { calibration_applied: false, md1_prior_prediction_retained: true }
      });
      continue;
    }

    const home = teamPredictionView(
      homePrior,
      fixture,
      "home_listed",
      fixture.home_expected_goals,
      fixture.away_expected_goals,
      fixture.home_win_probability,
      fixture.draw_probability,
      fixture.away_win_probability,
      fixture.home_clean_sheet_probability,
      fixture.goal_environment,
      fixture.upset_risk_probability,
      fixture.upset_risk_band,
      fixture.matchUncertainty
    );
    const away = teamPredictionView(
      awayPrior,
      fixture,
      "away_listed",
      fixture.away_expected_goals,
      fixture.home_expected_goals,
      fixture.away_win_probability,
      fixture.draw_probability,
      fixture.home_win_probability,
      fixture.away_clean_sheet_probability,
      fixture.goal_environment,
      fixture.upset_risk_probability,
      fixture.upset_risk_band,
      fixture.matchUncertainty
    );

    teamRows.push({
      ...home,
      team_fixture_prediction_id: String(home.team_fixture_prediction_id || "").replace("fantasy-pool-v3", "fantasy-pool-v4-md2") || `${fixture.fixture_id}-${fixture.home_team_id}-score-fantasy-pool-v4-md2`,
      uncertaintyReason: fixture.uncertaintyReason,
      uncertainty_reason: fixture.uncertainty_reason,
      qa_flags: fixture.qa_flags,
      source_model_version: SOURCE_MODEL_VERSION,
      v4_calibration: fixture.v4_calibration
    });
    teamRows.push({
      ...away,
      team_fixture_prediction_id: String(away.team_fixture_prediction_id || "").replace("fantasy-pool-v3", "fantasy-pool-v4-md2") || `${fixture.fixture_id}-${fixture.away_team_id}-score-fantasy-pool-v4-md2`,
      uncertaintyReason: fixture.uncertaintyReason,
      uncertainty_reason: fixture.uncertainty_reason,
      qa_flags: fixture.qa_flags,
      source_model_version: SOURCE_MODEL_VERSION,
      v4_calibration: fixture.v4_calibration
    });
  }

  return teamRows;
}

function buildSummary(fixtureRows, teamRows, metadata, teamAdjustments) {
  const md2Rows = fixtureRows.filter((row) => row.fantasy_matchday_id === "md2");
  const md3Rows = fixtureRows.filter((row) => row.fantasy_matchday_id === "md3");
  const adjustedRows = fixtureRows.filter((row) => row.v4_calibration?.calibration_applied);
  const topXgChanges = adjustedRows
    .map((row) => ({
      fixture_id: row.fixture_id,
      match_number: row.match_number,
      fixture: `${row.home_team} vs ${row.away_team}`,
      matchday: row.fantasy_matchday_id,
      prior_total_xg: round((row.v4_calibration.prior_home_xg || 0) + (row.v4_calibration.prior_away_xg || 0), 3),
      new_total_xg: row.total_expected_goals,
      total_xg_delta: row.comparison_to_v3.total_expected_goals_delta,
      home_xg_delta: row.comparison_to_v3.home_expected_goals_delta,
      away_xg_delta: row.comparison_to_v3.away_expected_goals_delta
    }))
    .sort((left, right) => Math.abs(right.total_xg_delta) - Math.abs(left.total_xg_delta))
    .slice(0, 10);

  return {
    fixture_prediction_count: fixtureRows.length,
    team_fixture_prediction_count: teamRows.length,
    md1_fixture_count: fixtureRows.filter((row) => row.fantasy_matchday_id === "md1").length,
    md2_fixture_count: md2Rows.length,
    md3_fixture_count: md3Rows.length,
    md2_md3_recalibrated_fixture_count: adjustedRows.length,
    average_total_expected_goals: round(avg(fixtureRows.map((row) => row.total_expected_goals)), 3),
    average_home_expected_goals: round(avg(fixtureRows.map((row) => row.home_expected_goals)), 3),
    average_away_expected_goals: round(avg(fixtureRows.map((row) => row.away_expected_goals)), 3),
    average_md2_total_expected_goals: round(avg(md2Rows.map((row) => row.total_expected_goals)), 3),
    average_md3_total_expected_goals: round(avg(md3Rows.map((row) => row.total_expected_goals)), 3),
    final_squad_source_status: "fantasy_pool_only_not_source_backed",
    final_squad_confirmed_teams: 0,
    uses_betting_odds: false,
    pele_rebuilt: false,
    ownership_used_as_signal: false,
    safe_for_preliminary_projection_staging: true,
    safe_for_final_public_recommendations: false,
    safe_for_final_team_builder_promotion: false,
    goal_environment_counts: countBy(fixtureRows, (row) => row.goal_environment),
    public_goal_environment_counts: countBy(fixtureRows, (row) => row.goalEnvironment),
    upset_risk_counts: countBy(fixtureRows, (row) => row.upset_risk),
    public_upset_risk_counts: countBy(fixtureRows, (row) => row.upsetRisk),
    match_uncertainty_counts: countBy(fixtureRows, (row) => row.matchUncertainty),
    attacker_environment_counts: countBy(fixtureRows, (row) => row.attackerEnvironment),
    clean_sheet_context_counts: countBy(fixtureRows, (row) => row.cleanSheetContext),
    average_goal_range_width: round(avg(fixtureRows.map((row) => row.highTotalGoals - row.lowTotalGoals)), 3),
    calibration: metadata,
    top_10_largest_xg_changes: topXgChanges,
    top_10_attack_upgrades: teamAdjustments
      .filter((row) => row.attack_multiplier > 1)
      .sort((left, right) => right.attack_multiplier - left.attack_multiplier || right.attack_residual - left.attack_residual)
      .slice(0, 10),
    top_10_defense_risk_upgrades: teamAdjustments
      .filter((row) => row.defense_weakness_multiplier > 1)
      .sort((left, right) => right.defense_weakness_multiplier - left.defense_weakness_multiplier || right.defense_residual - left.defense_residual)
      .slice(0, 10),
    top_10_confidence_shrunk_fixtures: adjustedRows
      .map((row) => ({
        fixture_id: row.fixture_id,
        match_number: row.match_number,
        fixture: `${row.home_team} vs ${row.away_team}`,
        matchday: row.fantasy_matchday_id,
        wdl_confidence_shrink: row.v4_calibration.wdl_confidence_shrink,
        max_probability_shift: round(wdlShrunkAmount(row), 4),
        favorite: row.favorite_team,
        favorite_win_probability: row.favorite_win_probability
      }))
      .sort((left, right) => right.max_probability_shift - left.max_probability_shift)
      .slice(0, 10)
  };
}

function hasInvalidNumber(value, path = "$", output = []) {
  if (typeof value === "number" && !Number.isFinite(value)) {
    output.push(path);
    return output;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => hasInvalidNumber(item, `${path}[${index}]`, output));
    return output;
  }
  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      hasInvalidNumber(item, `${path}.${key}`, output);
    }
  }
  return output;
}

function buildQa(scoreV4, metadata, teamAdjustments, scoreV3, teamQuality, liveFixtureQa) {
  const checks = [];
  const push = (id, status, detail, severity = "error") => checks.push({ id, status: status ? "pass" : "fail", severity, detail });
  const fixtureRows = scoreV4.fixtureScorePredictions;
  const teamRows = scoreV4.teamFixturePredictions;
  const fixtureIds = fixtureRows.map((row) => row.fixture_id);
  const md1Rows = fixtureRows.filter((row) => row.fantasy_matchday_id === "md1");
  const md2Rows = fixtureRows.filter((row) => row.fantasy_matchday_id === "md2");
  const md3Rows = fixtureRows.filter((row) => row.fantasy_matchday_id === "md3");
  const invalidNumbers = hasInvalidNumber(scoreV4);
  const allXg = fixtureRows.flatMap((row) => [row.home_expected_goals, row.away_expected_goals]);
  const adjustedRows = fixtureRows.filter((row) => row.v4_calibration?.calibration_applied);
  const teamIdsFromQuality = new Set((teamQuality.teams || []).map((row) => row.team_id || row.country_id).filter(Boolean));
  const adjustmentTeamIds = new Set(teamAdjustments.map((row) => row.team_id));
  const neutralMissingTeamIds = [...teamIdsFromQuality].filter((teamId) => !adjustmentTeamIds.has(teamId));

  push("fixture_coverage_72", fixtureRows.length === 72 && new Set(fixtureIds).size === 72, `${fixtureRows.length}/72 fixtures; ${new Set(fixtureIds).size} unique fixture IDs.`);
  push("matchday_coverage", md1Rows.length === 24 && md2Rows.length === 24 && md3Rows.length === 24, `MD1=${md1Rows.length}, MD2=${md2Rows.length}, MD3=${md3Rows.length}.`);
  push("team_fixture_coverage", teamRows.length === 144, `${teamRows.length}/144 team-fixture rows.`);
  push("md1_prior_fields_retained", md1Rows.every((row) => row.v4_calibration?.md1_prior_prediction_retained), "MD1 rows retain prior prediction fields and are marked uncalibrated.");
  push("no_nan_or_infinity", invalidNumbers.length === 0, invalidNumbers.length ? invalidNumbers.slice(0, 10).join(", ") : "No NaN or Infinity.");
  push("team_xg_bounds", allXg.every((value) => value >= TEAM_XG_CAP[0] && value <= TEAM_XG_CAP[1]), `xG range ${JSON.stringify(rangeSummary(allXg))}.`);
  push("total_xg_reasonable", fixtureRows.every((row) => row.total_expected_goals >= 0.3 && row.total_expected_goals <= 7), `total xG range ${JSON.stringify(rangeSummary(fixtureRows.map((row) => row.total_expected_goals)))}.`);
  push("wdl_probability_bounds", fixtureRows.every((row) => [row.home_win_probability, row.draw_probability, row.away_win_probability].every((value) => value >= 0 && value <= 1)), "W/D/L probabilities are between 0 and 1.");
  push("wdl_probability_sum", fixtureRows.every((row) => Math.abs(row.home_win_probability + row.draw_probability + row.away_win_probability - 1) <= 0.003), "W/D/L probabilities sum to approximately 1.");
  push("clean_sheet_probability_bounds", fixtureRows.every((row) => row.home_clean_sheet_probability >= 0 && row.home_clean_sheet_probability <= 1 && row.away_clean_sheet_probability >= 0 && row.away_clean_sheet_probability <= 1), "Clean-sheet probabilities are between 0 and 1.");
  push("global_goal_multiplier_cap", metadata.globalGoalMultiplier >= GLOBAL_CAP[0] && metadata.globalGoalMultiplier <= GLOBAL_CAP[1], `globalGoalMultiplier=${metadata.globalGoalMultiplier}.`);
  push("team_attack_multiplier_cap", teamAdjustments.every((row) => row.attack_multiplier >= ATTACK_CAP[0] && row.attack_multiplier <= ATTACK_CAP[1]), "All team attack multipliers are within cap.");
  push("team_defense_multiplier_cap", teamAdjustments.every((row) => row.defense_weakness_multiplier >= DEFENSE_CAP[0] && row.defense_weakness_multiplier <= DEFENSE_CAP[1]), "All team defense weakness multipliers are within cap.");
  push("teams_without_md1_neutral", neutralMissingTeamIds.length === 0, neutralMissingTeamIds.length ? `Missing MD1 adjustments: ${neutralMissingTeamIds.join(", ")}` : "Every team has MD1 data; no neutral fallback teams needed.");
  push("top_change_lists_present", scoreV4.summary.top_10_largest_xg_changes.length === 10 && scoreV4.summary.top_10_attack_upgrades.length === 10 && scoreV4.summary.top_10_defense_risk_upgrades.length === 10 && scoreV4.summary.top_10_confidence_shrunk_fixtures.length === 10, "Top-10 calibration lists are present.");
  push("browser_globals_same_shape", Boolean(scoreV4.fixtureScorePredictions && scoreV4.teamFixturePredictions && scoreV4.summary), "Output preserves active browser data shape.");
  push("pele_not_rebuilt", metadata.peleRebuilt === false && scoreV4.model.peleRebuilt === false, "PELE/teamQuality is retained as prior, not rebuilt.");
  push("final_squads_not_source_backed", metadata.finalSquadsSourceBacked === false && scoreV4.summary.final_squad_confirmed_teams === 0, "Final squads are not claimed source-backed.");
  push("ownership_not_model_signal", metadata.ownershipUsedAsSignal === false, "Ownership changes are not used as signal.");
  push("live_fixture_mapping_source_green", liveFixtureQa.status === "passed" && liveFixtureQa.summary?.final_fixtures_shown === 24, `Live mapping status=${liveFixtureQa.status}; final_fixtures_shown=${liveFixtureQa.summary?.final_fixtures_shown}.`);
  push("v4_changed_md2_md3_only", adjustedRows.length === 48 && md1Rows.every((row) => row.comparison_to_v3 === undefined || row.v4_calibration?.calibration_applied === false), `${adjustedRows.length}/48 MD2/MD3 fixtures recalibrated.`);
  push("v3_prior_fixture_coverage_preserved", scoreV3.fixtureScorePredictions.length === 72, "v3 prior has 72 fixtures.");

  const status = checks.every((check) => check.status === "pass") ? "pass" : "fail";
  return {
    schema_version: "score_prediction_qa_v4_md2",
    generated_at: metadata.generatedAt,
    status,
    modelVersion: MODEL_VERSION,
    summary: {
      fixture_predictions: fixtureRows.length,
      team_fixture_predictions: teamRows.length,
      md1_fixture_count: md1Rows.length,
      md2_fixture_count: md2Rows.length,
      md3_fixture_count: md3Rows.length,
      globalGoalMultiplier: metadata.globalGoalMultiplier,
      cleanSheetCalibrationUsed: metadata.cleanSheetCalibrationUsed,
      wdlConfidenceShrinkUsed: metadata.wdlConfidenceShrinkUsed,
      top_10_largest_xg_changes: scoreV4.summary.top_10_largest_xg_changes,
      top_10_attack_upgrades: scoreV4.summary.top_10_attack_upgrades,
      top_10_defense_risk_upgrades: scoreV4.summary.top_10_defense_risk_upgrades,
      top_10_confidence_shrunk_fixtures: scoreV4.summary.top_10_confidence_shrunk_fixtures
    },
    numeric_ranges: {
      home_expected_goals: rangeSummary(fixtureRows.map((row) => row.home_expected_goals)),
      away_expected_goals: rangeSummary(fixtureRows.map((row) => row.away_expected_goals)),
      total_expected_goals: rangeSummary(fixtureRows.map((row) => row.total_expected_goals)),
      home_clean_sheet_probability: rangeSummary(fixtureRows.map((row) => row.home_clean_sheet_probability), 4),
      away_clean_sheet_probability: rangeSummary(fixtureRows.map((row) => row.away_clean_sheet_probability), 4)
    },
    checks,
    failures: checks.filter((check) => check.status === "fail")
  };
}

function markdownTable(headers, rows) {
  const escapeCell = (value) => String(value ?? "").replace(/\|/g, "\\|");
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${headers.map((header) => escapeCell(row[header])).join(" | ")} |`)
  ].join("\n");
}

function buildQaReport(qa) {
  const xgRows = qa.summary.top_10_largest_xg_changes.map((row) => ({
    Match: row.match_number,
    Fixture: row.fixture,
    MD: row.matchday,
    "Prior xG": row.prior_total_xg,
    "New xG": row.new_total_xg,
    Delta: row.total_xg_delta
  }));
  const attackRows = qa.summary.top_10_attack_upgrades.map((row) => ({
    Team: row.team,
    Opponent: row.opponent_in_md1,
    "Pred GF": row.predicted_gf,
    "Actual GF": row.actual_gf,
    Mult: row.attack_multiplier,
    Note: row.explanation
  }));
  const defenseRows = qa.summary.top_10_defense_risk_upgrades.map((row) => ({
    Team: row.team,
    Opponent: row.opponent_in_md1,
    "Pred GA": row.predicted_ga,
    "Actual GA": row.actual_ga,
    Mult: row.defense_weakness_multiplier,
    Note: row.explanation
  }));

  return `# Score Prediction QA Report v4 MD2

Generated: ${qa.generated_at}

Status: **${qa.status}**

| Metric | Value |
| --- | --- |
| Fixture rows | ${qa.summary.fixture_predictions} |
| Team-fixture rows | ${qa.summary.team_fixture_predictions} |
| MD1 / MD2 / MD3 fixtures | ${qa.summary.md1_fixture_count} / ${qa.summary.md2_fixture_count} / ${qa.summary.md3_fixture_count} |
| Global goal multiplier | ${qa.summary.globalGoalMultiplier} |
| Clean-sheet calibration used | ${qa.summary.cleanSheetCalibrationUsed} |
| W/D/L confidence shrink used | ${qa.summary.wdlConfidenceShrinkUsed} |

## Largest MD2/MD3 xG Changes

${markdownTable(["Match", "Fixture", "MD", "Prior xG", "New xG", "Delta"], xgRows)}

## Team Attack Upgrades

${markdownTable(["Team", "Opponent", "Pred GF", "Actual GF", "Mult", "Note"], attackRows)}

## Team Defense-Risk Upgrades

${markdownTable(["Team", "Opponent", "Pred GA", "Actual GA", "Mult", "Note"], defenseRows)}

## Checks

| Check | Status | Detail |
| --- | --- | --- |
${qa.checks.map((check) => `| ${check.id} | ${check.status} | ${String(check.detail).replace(/\|/g, "\\|")} |`).join("\n")}
`;
}

function buildModelReport(scoreV4) {
  const metadata = scoreV4.model.calibration_metadata;
  const xgRows = scoreV4.summary.top_10_largest_xg_changes.map((row) => ({
    Match: row.match_number,
    Fixture: row.fixture,
    MD: row.matchday,
    "Prior xG": row.prior_total_xg,
    "New xG": row.new_total_xg,
    Delta: row.total_xg_delta
  }));

  return `# Score Model v4 MD2

Generated: ${metadata.generatedAt}

## Purpose

Score Model v4 is an emergency MD1-calibrated Match Environment model for MD2/MD3. It keeps PELE/teamQuality as the prior and applies only completed MD1 fixture evidence from \`data/md1CalibrationDataset_v1.json\`.

It does not rebuild PELE, teamQuality, player projections, recommendations, finance metrics, or Team Builder weights.

## Calibration

| Metric | Value |
| --- | --- |
| Model version | ${metadata.modelVersion} |
| MD1 fixtures used | ${metadata.md1FixturesUsed} |
| MD1 predicted goals per match | ${metadata.predictedGoalsPerMatch} |
| MD1 actual goals per match | ${metadata.actualGoalsPerMatch} |
| Calibration ratio | ${metadata.calibrationRatio} |
| Global shrink | ${metadata.globalShrink} |
| Global goal multiplier | ${metadata.globalGoalMultiplier} |
| Team attack shrink | ${metadata.teamAttackShrink} |
| Team defense shrink | ${metadata.teamDefenseShrink} |
| Clean-sheet calibration used | ${metadata.cleanSheetCalibrationUsed} |
| Clean-sheet multiplier | ${metadata.cleanSheetMultiplier} |
| W/D/L confidence shrink used | ${metadata.wdlConfidenceShrinkUsed} |
| W/D/L confidence shrink | ${metadata.wdlConfidenceShrink} |
| PELE rebuilt | ${metadata.peleRebuilt} |
| Final squads source-backed | ${metadata.finalSquadsSourceBacked} |
| Ownership used as signal | ${metadata.ownershipUsedAsSignal} |

## Method

- Start from \`data/scorePredictions_fantasyPool_v3.json\`.
- Retain MD1 prior prediction fields for postmortem/display support.
- Recompute MD2/MD3 expected goals with a shrunken global goal-environment lift plus team attack and defensive weakness residual multipliers.
- Recompute scoreline distribution from the new xG using the Poisson grid already used by prior score models.
- Recompute W/D/L, then blend modestly toward neutral tournament uncertainty because MD1 result calibration was weak.
- Recompute clean-sheet probabilities from new opponent xG and apply an extra shrunken clean-sheet correction because MD1 clean-sheet calls were too optimistic.
- Keep public language fantasy-facing; this is not betting odds and not official projection language.

## Largest MD2/MD3 xG Changes

${markdownTable(["Match", "Fixture", "MD", "Prior xG", "New xG", "Delta"], xgRows)}

## Trust Notes

- PELE/teamQuality remains the prior and was not rebuilt.
- Final squads remain not source-backed.
- No ownership-only changes were used as model signal.
- Completed MD1 final-score support remains separate in the live support layer.
`;
}

function writeBrowserData(scoreV4) {
  const header = [
    "// Generated by scripts/buildScorePredictionsFantasyPoolV4Md2.mjs.",
    `// Source files: ${PATHS.scoreV4}`,
    "// Current official fantasy-pool browser data."
  ].join("\n");
  const globals = {
    FANTASY_POOL_SCORE_PREDICTIONS_DATA: scoreV4,
    FANTASY_POOL_SCORE_FIXTURE_PREDICTIONS: scoreV4.fixtureScorePredictions,
    FANTASY_POOL_TEAM_FIXTURE_PREDICTIONS: scoreV4.teamFixturePredictions,
    FANTASY_POOL_SCORE_PREDICTIONS_SUMMARY: scoreV4.summary
  };
  const body = Object.entries(globals)
    .map(([key, value]) => `window.${key} = ${JSON.stringify(value)};`)
    .join("\n\n");
  return writeFile(PATHS.browserScoreData, `${header}\n${body}\n`, "utf8");
}

async function main() {
  const [scoreV3, md1Dataset, md1Postmortem, teamQuality, liveMatchday, liveFixtureQa] = await Promise.all([
    readJson(PATHS.scoreV3),
    readJson(PATHS.md1Dataset),
    readJson(PATHS.md1Postmortem),
    readJson(PATHS.teamQuality),
    readJson(PATHS.liveMatchday),
    readJson(PATHS.liveFixtureQa)
  ]);

  if (md1Dataset.qa?.status !== "pass" || md1Postmortem.status !== "pass") {
    throw new Error("MD1 postmortem/calibration dataset must pass QA before score v4 rebuild.");
  }

  const teamIdMap = buildTeamIdMaps(scoreV3);
  const teamAdjustments = buildTeamAdjustments(md1Dataset, teamIdMap);
  const adjustmentsByTeam = new Map(teamAdjustments.map((row) => [row.team_id, row]));
  const metadata = buildCalibrationMetadata(md1Dataset);
  const fixtureScorePredictions = scoreV3.fixtureScorePredictions.map((row) => recalibrateFixture(row, adjustmentsByTeam, metadata));
  const teamFixturePredictions = transformTeamFixtureRows(fixtureScorePredictions, scoreV3.teamFixturePredictions);
  const summary = buildSummary(fixtureScorePredictions, teamFixturePredictions, metadata, teamAdjustments);
  const scoreV4 = {
    ...scoreV3,
    schema_version: "score_predictions_fantasy_pool_v4_md2",
    generated_at: metadata.generatedAt,
    source_checked: "2026-06-18",
    model_stage: MODEL_STAGE,
    data_status: "md1_calibrated_for_md2_md3_fantasy_pool_only_not_final_squad_backed_not_betting_odds",
    modelVersion: MODEL_VERSION,
    model_version: MODEL_VERSION,
    previous_model_file: PATHS.scoreV3,
    team_quality_file: "data/teamQuality.json",
    safety_labels: [
      "fantasy_pool_only",
      "not final-squad-backed",
      "not betting odds",
      "not final public recommendations",
      "MD1-calibrated emergency score model for MD2/MD3",
      "PELE/teamQuality prior not rebuilt"
    ],
    model: {
      ...(scoreV3.model || {}),
      model_name: "PELE-prior MD1-calibrated fantasy-pool score predictor v4 for MD2/MD3",
      modelVersion: MODEL_VERSION,
      model_version: MODEL_VERSION,
      formula_version: SOURCE_MODEL_VERSION,
      source_model_version: SOURCE_MODEL_VERSION,
      team_quality_version: "team_quality_v2_prior_retained",
      current_inputs: [
        PATHS.scoreV3,
        PATHS.md1Dataset,
        PATHS.md1Postmortem,
        PATHS.teamQuality,
        PATHS.liveFixtureQa
      ],
      md1_score_calibration: {
        completed_md1_fixtures_used: metadata.md1FixturesUsed,
        actual_average_goals: metadata.actualGoalsPerMatch,
        prior_predicted_average_goals: metadata.predictedGoalsPerMatch,
        raw_ratio: metadata.calibrationRatio,
        applied_goal_multiplier: metadata.globalGoalMultiplier,
        scope: "md2_md3_only",
        shrinkage: metadata.globalShrink,
        source: PATHS.md1Dataset
      },
      peleRebuilt: false,
      finalSquadsSourceBacked: false,
      ownershipUsedAsSignal: false,
      calibration_metadata: metadata,
      plain_language_summary: "Start from the active PELE-prior fantasy-pool score v3 model, retain MD1 prior predictions, and recalibrate MD2/MD3 Match Environment xG, W/D/L confidence, clean-sheet context, and uncertainty using completed MD1 residuals."
    },
    summary,
    md1_calibration_metadata: metadata,
    teamAdjustmentTable: teamAdjustments,
    team_adjustment_table: teamAdjustments,
    model_notes: [
      ...(Array.isArray(scoreV3.model_notes) ? scoreV3.model_notes : []),
      "Score v4 uses completed MD1 calibration evidence for MD2/MD3 only.",
      "PELE/teamQuality remains the prior and was not rebuilt.",
      "Final squads remain not source-backed.",
      "Ownership-only changes are not used as model signal."
    ],
    fixtureScorePredictions,
    teamFixturePredictions
  };

  const qa = buildQa(scoreV4, metadata, teamAdjustments, scoreV3, teamQuality, liveFixtureQa);
  if (qa.status !== "pass") {
    console.error(JSON.stringify(qa.failures, null, 2));
  }

  await writeJson(PATHS.scoreV4, scoreV4);
  await writeJson(PATHS.qaJson, qa);
  await writeFile(PATHS.qaReport, buildQaReport(qa), "utf8");
  await writeFile(PATHS.modelReport, buildModelReport(scoreV4), "utf8");
  await writeBrowserData(scoreV4);

  console.log(JSON.stringify({
    status: qa.status,
    output: PATHS.scoreV4,
    browserData: PATHS.browserScoreData,
    modelVersion: MODEL_VERSION,
    md1FixturesUsed: metadata.md1FixturesUsed,
    predictedGoalsPerMatch: metadata.predictedGoalsPerMatch,
    actualGoalsPerMatch: metadata.actualGoalsPerMatch,
    calibrationRatio: metadata.calibrationRatio,
    globalGoalMultiplier: metadata.globalGoalMultiplier,
    cleanSheetCalibrationUsed: metadata.cleanSheetCalibrationUsed,
    cleanSheetMultiplier: metadata.cleanSheetMultiplier,
    wdlConfidenceShrinkUsed: metadata.wdlConfidenceShrinkUsed,
    wdlConfidenceShrink: metadata.wdlConfidenceShrink,
    md2FixtureCoverage: summary.md2_fixture_count,
    md3FixtureCoverage: summary.md3_fixture_count,
    top10LargestXgChanges: summary.top_10_largest_xg_changes,
    top10AttackUpgrades: summary.top_10_attack_upgrades.map((row) => ({
      team: row.team,
      opponent: row.opponent_in_md1,
      attack_multiplier: row.attack_multiplier,
      actual_gf: row.actual_gf,
      predicted_gf: row.predicted_gf
    })),
    top10DefenseRiskUpgrades: summary.top_10_defense_risk_upgrades.map((row) => ({
      team: row.team,
      opponent: row.opponent_in_md1,
      defense_weakness_multiplier: row.defense_weakness_multiplier,
      actual_ga: row.actual_ga,
      predicted_ga: row.predicted_ga
    }))
  }, null, 2));

  if (qa.status !== "pass") {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
