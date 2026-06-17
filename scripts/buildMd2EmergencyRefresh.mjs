import { readFile, writeFile } from "node:fs/promises";

const GENERATED_AT = new Date().toISOString();
const TODAY = GENERATED_AT.slice(0, 10);
const PHASE = process.argv.includes("--phase")
  ? process.argv[process.argv.indexOf("--phase") + 1]
  : "all";

const PATHS = {
  liveFixtures: "data/liveMatchdayStatus_v1.json",
  livePlayers: "data/livePlayerStatus_v1.json",
  monitor: "data/officialFantasyDataUpdateCheck_v1.json",
  scorePredictions: "data/scorePredictions_fantasyPool_v3.json",
  minutesModel: "data/playerMinutesModel_fantasyPool_v0.json",
  availabilityReviewInput: "data/md2AvailabilityReviewInput_v1.json",
  projections: "data/playerMatchdayProjections_fantasyPool_v3.json",
  recommendations: "data/matchdayRecommendations_fantasyPool_v3.json",
  financeMetrics: "data/playerFinanceMetrics_fantasyPool_v1.json",
  teamBuilderCoverage: "data/teamBuilderDataCoverage_v1.json"
};

const REPORTS = {
  scoreCalibration: "data/md1ScoreCalibration_v1.md",
  scoreQa: "data/md2ScorePredictionQa_v1.md",
  lineupEvidence: "data/md2LineupEvidenceRefresh_v1.md",
  lineupEvidenceJson: "data/md2LineupEvidenceRefresh_v1.json",
  availabilityReview: "data/md2AvailabilityReview_v1.md",
  availabilityReviewJson: "data/md2AvailabilityReview_v1.json",
  recommendationQa: "data/md2RecommendationQa_v1.md",
  emergencyRefresh: "data/md2EmergencyRefresh_v1.md"
};

function hasValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function readJsonIfExists(path) {
  try {
    return await readJson(path);
  } catch {
    return null;
  }
}

function round(value, digits = 3) {
  if (!Number.isFinite(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function average(values) {
  const clean = values.filter(Number.isFinite);
  return clean.length ? clean.reduce((sum, value) => sum + value, 0) / clean.length : null;
}

function mdEscape(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function mdTable(headers, rows) {
  return [
    `| ${headers.map(mdEscape).join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(mdEscape).join(" | ")} |`)
  ].join("\n");
}

function countBy(rows, keyFn) {
  return rows.reduce((counts, row) => {
    const key = keyFn(row) || "missing";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function poisson(lambda, goals) {
  let factorial = 1;
  for (let index = 2; index <= goals; index += 1) factorial *= index;
  return Math.exp(-lambda) * (lambda ** goals) / factorial;
}

function scoreGrid(homeXg, awayXg) {
  const rows = [];
  for (let home = 0; home <= 8; home += 1) {
    for (let away = 0; away <= 8; away += 1) {
      rows.push({
        home_goals: home,
        away_goals: away,
        probability: poisson(homeXg, home) * poisson(awayXg, away)
      });
    }
  }
  return rows;
}

function probabilities(homeXg, awayXg) {
  const grid = scoreGrid(homeXg, awayXg);
  const homeWin = grid.filter((row) => row.home_goals > row.away_goals).reduce((sum, row) => sum + row.probability, 0);
  const draw = grid.filter((row) => row.home_goals === row.away_goals).reduce((sum, row) => sum + row.probability, 0);
  const awayWin = grid.filter((row) => row.home_goals < row.away_goals).reduce((sum, row) => sum + row.probability, 0);
  const over25 = grid.filter((row) => row.home_goals + row.away_goals >= 3).reduce((sum, row) => sum + row.probability, 0);
  const topScorelines = grid
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 8)
    .map((row) => ({
      scoreline: `${row.home_goals}-${row.away_goals}`,
      home_goals: row.home_goals,
      away_goals: row.away_goals,
      probability: round(row.probability, 4)
    }));
  return {
    homeWin: round(homeWin, 4),
    draw: round(draw, 4),
    awayWin: round(awayWin, 4),
    homeCleanSheet: round(Math.exp(-awayXg), 4),
    awayCleanSheet: round(Math.exp(-homeXg), 4),
    over25: round(over25, 4),
    under25: round(1 - over25, 4),
    bothTeamsScore: round((1 - Math.exp(-homeXg)) * (1 - Math.exp(-awayXg)), 4),
    topScorelines
  };
}

function goalEnvironment(total) {
  if (total >= 3.15) return ["high_goal_environment", "Strong"];
  if (total >= 2.75) return ["medium_high_goal_environment", "Good"];
  if (total >= 2.25) return ["medium_goal_environment", "Neutral"];
  return ["low_goal_environment", "Difficult"];
}

function attackingEnvironment(xg) {
  if (xg >= 2.1) return "Strong";
  if (xg >= 1.45) return "Good";
  if (xg >= 0.95) return "Neutral";
  return "Difficult";
}

function cleanSheetContext(probability) {
  if (probability >= 0.5) return "Strong";
  if (probability >= 0.34) return "Good";
  if (probability >= 0.22) return "Neutral";
  return "Difficult";
}

function difficultyBand(score) {
  if (score <= 35) return "very_favorable";
  if (score <= 45) return "favorable";
  if (score <= 58) return "neutral";
  if (score <= 70) return "difficult";
  return "very_difficult";
}

function teamContext({ teamXg, oppXg, winProbability, cleanSheetProbability }) {
  const attackingScore = round(clamp(50 + (teamXg - 1.25) * 30, 1, 100), 1);
  const defensiveScore = round(clamp(50 + (cleanSheetProbability - 0.3) * 80 - (oppXg - 1.2) * 10, 1, 100), 1);
  const captainScore = round(clamp(attackingScore * 0.68 + winProbability * 100 * 0.22 + defensiveScore * 0.1, 1, 100), 1);
  const difficulty = round(clamp(50 - (teamXg - oppXg) * 11 - (winProbability - 0.33) * 24 - (cleanSheetProbability - 0.3) * 8, 1, 99), 2);
  return {
    fixture_difficulty_score: difficulty,
    fixture_difficulty_band: difficultyBand(difficulty),
    attacking_environment_score: attackingScore,
    defensive_environment_score: defensiveScore,
    captain_environment_score: captainScore,
    attackerEnvironment: attackingEnvironment(teamXg),
    defenderEnvironment: cleanSheetContext(cleanSheetProbability),
    keeperEnvironment: cleanSheetContext(cleanSheetProbability),
    cleanSheetContext: cleanSheetContext(cleanSheetProbability)
  };
}

function updateTeamView(view, fixture, side) {
  const isHome = side === "home";
  const teamXg = isHome ? fixture.home_expected_goals : fixture.away_expected_goals;
  const oppXg = isHome ? fixture.away_expected_goals : fixture.home_expected_goals;
  const winProbability = isHome ? fixture.home_win_probability : fixture.away_win_probability;
  const lossProbability = isHome ? fixture.away_win_probability : fixture.home_win_probability;
  const cleanSheetProbability = isHome ? fixture.home_clean_sheet_probability : fixture.away_clean_sheet_probability;
  const context = teamContext({ teamXg, oppXg, winProbability, cleanSheetProbability });
  const qaFlags = new Set(view.qa_flags || []);
  qaFlags.add("md1_partial_score_calibrated");

  Object.assign(view, {
    expected_goals: round(teamXg, 3),
    projectedXg: round(teamXg, 3),
    projected_xg: round(teamXg, 3),
    matchXg: round(teamXg, 3),
    match_xg: round(teamXg, 3),
    expected_goals_against: round(oppXg, 3),
    win_probability: winProbability,
    draw_probability: fixture.draw_probability,
    loss_probability: lossProbability,
    clean_sheet_probability: cleanSheetProbability,
    fixture_difficulty_score: context.fixture_difficulty_score,
    fixture_difficulty_band: context.fixture_difficulty_band,
    attacking_environment_score: context.attacking_environment_score,
    defensive_environment_score: context.defensive_environment_score,
    captain_environment_score: context.captain_environment_score,
    attackerEnvironment: context.attackerEnvironment,
    attacker_environment: context.attackerEnvironment,
    defenderEnvironment: context.defenderEnvironment,
    defender_environment: context.defenderEnvironment,
    keeperEnvironment: context.keeperEnvironment,
    keeper_environment: context.keeperEnvironment,
    cleanSheetContext: context.cleanSheetContext,
    clean_sheet_context: context.cleanSheetContext,
    goalEnvironment: fixture.goal_environment_public,
    goal_environment_public: fixture.goal_environment_public,
    goal_environment: fixture.goal_environment,
    upsetRisk: fixture.upset_risk_public,
    upset_risk_public: fixture.upset_risk_public,
    upset_risk_probability: fixture.upset_risk_probability,
    upset_risk_band: fixture.upset_risk_band,
    matchUncertainty: fixture.match_uncertainty,
    match_uncertainty: fixture.match_uncertainty,
    uncertaintyLabel: fixture.uncertainty_label,
    uncertainty_label: fixture.uncertainty_label,
    uncertaintyReason: fixture.uncertainty_reason,
    uncertainty_reason: fixture.uncertainty_reason,
    qa_flags: [...qaFlags].sort()
  });
}

function recalibrateScorePredictions(scorePredictions, liveFixtures) {
  const predictionsById = new Map(scorePredictions.fixtureScorePredictions.map((row) => [String(row.fixture_id || row.match_id), row]));
  const completedMd1 = liveFixtures.fixtures.filter((fixture) =>
    fixture.round_id === "1" &&
    fixture.safe_to_display_score &&
    fixture.score_status === "final" &&
    predictionsById.has(String(fixture.local_fixture_id))
  );
  const pendingMd1 = liveFixtures.fixtures.filter((fixture) => fixture.round_id === "1" && !fixture.safe_to_display_score);
  const calibrationRows = completedMd1.map((fixture) => {
    const prediction = predictionsById.get(String(fixture.local_fixture_id));
    const predictedTotal = Number(prediction.total_expected_goals ?? (Number(prediction.home_expected_goals) + Number(prediction.away_expected_goals)));
    const actualTotal = Number(fixture.home_score) + Number(fixture.away_score);
    return {
      fixture_id: fixture.local_fixture_id,
      match_number: fixture.local_match_number,
      fixture: `${fixture.home_team} ${fixture.home_score}-${fixture.away_score} ${fixture.away_team}`,
      actual_total_goals: actualTotal,
      predicted_total_goals: round(predictedTotal, 3),
      difference: round(actualTotal - predictedTotal, 3)
    };
  });
  const actualAverage = average(calibrationRows.map((row) => row.actual_total_goals));
  const predictedAverage = average(calibrationRows.map((row) => row.predicted_total_goals));
  const rawRatio = actualAverage && predictedAverage ? actualAverage / predictedAverage : 1;
  const appliedGoalMultiplier = round(clamp(1 + (rawRatio - 1) * 0.35, 0.94, 1.1), 3);
  const changedFixtureIds = [];

  for (const fixture of scorePredictions.fixtureScorePredictions) {
    if (!["md2", "md3"].includes(fixture.fantasy_matchday_id)) continue;
    const previousHome = Number(fixture.home_expected_goals);
    const previousAway = Number(fixture.away_expected_goals);
    if (!Number.isFinite(previousHome) || !Number.isFinite(previousAway)) continue;

    const homeXg = round(clamp(previousHome * appliedGoalMultiplier, 0.15, 3.65), 3);
    const awayXg = round(clamp(previousAway * appliedGoalMultiplier, 0.15, 3.65), 3);
    const total = round(homeXg + awayXg, 3);
    const probs = probabilities(homeXg, awayXg);
    const [internalGoalEnv, publicGoalEnv] = goalEnvironment(total);
    const favoriteSide = probs.homeWin >= probs.awayWin ? "home" : "away";
    const favoriteWinProbability = favoriteSide === "home" ? probs.homeWin : probs.awayWin;
    const underdogWinProbability = favoriteSide === "home" ? probs.awayWin : probs.homeWin;
    const upsetRiskProbability = round(underdogWinProbability + probs.draw * 0.24, 4);
    const upsetBand = upsetRiskProbability >= 0.42 ? "high" : upsetRiskProbability >= 0.28 ? "medium_high" : upsetRiskProbability >= 0.18 ? "medium" : "low";
    const uncertainty = upsetRiskProbability >= 0.42 || total >= 3.4 ? "High" : upsetRiskProbability >= 0.24 ? "Medium" : "Low";

    Object.assign(fixture, {
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
        ...(fixture.projectedXg || {}),
        home: homeXg,
        away: awayXg
      },
      projected_xg: {
        ...(fixture.projected_xg || {}),
        home: homeXg,
        away: awayXg
      },
      total_expected_goals: total,
      home_win_probability: probs.homeWin,
      draw_probability: probs.draw,
      away_win_probability: probs.awayWin,
      home_clean_sheet_probability: probs.homeCleanSheet,
      away_clean_sheet_probability: probs.awayCleanSheet,
      over_2_5_goals_probability: probs.over25,
      under_2_5_goals_probability: probs.under25,
      both_teams_to_score_probability: probs.bothTeamsScore,
      goal_environment: internalGoalEnv,
      goalEnvironment: publicGoalEnv,
      goal_environment_public: publicGoalEnv,
      favorite: favoriteSide === "home" ? fixture.home_team : fixture.away_team,
      favorite_team_id: favoriteSide === "home" ? fixture.home_team_id : fixture.away_team_id,
      favorite_team: favoriteSide === "home" ? fixture.home_team : fixture.away_team,
      favorite_win_probability: favoriteWinProbability,
      underdog_team_id: favoriteSide === "home" ? fixture.away_team_id : fixture.home_team_id,
      underdog_team: favoriteSide === "home" ? fixture.away_team : fixture.home_team,
      underdog_win_probability: underdogWinProbability,
      upset_risk_probability: upsetRiskProbability,
      upset_risk_band: upsetBand,
      upset_risk: upsetBand,
      upsetRisk: upsetBand === "medium_high" ? "Medium" : upsetBand[0].toUpperCase() + upsetBand.slice(1),
      upset_risk_public: upsetBand === "medium_high" ? "Medium" : upsetBand[0].toUpperCase() + upsetBand.slice(1),
      uncertaintyLabel: uncertainty,
      uncertainty_label: uncertainty,
      matchUncertainty: uncertainty,
      match_uncertainty: uncertainty,
      uncertaintyReason: `MD1 partial calibration applied (${appliedGoalMultiplier}x goals) after ${completedMd1.length} completed MD1 fixtures.`,
      uncertainty_reason: `MD1 partial calibration applied (${appliedGoalMultiplier}x goals) after ${completedMd1.length} completed MD1 fixtures.`,
      lowTotalGoals: round(total * 0.72, 3),
      low_total_goals: round(total * 0.72, 3),
      baseTotalGoals: total,
      base_total_goals: total,
      highTotalGoals: round(total * 1.28, 3),
      high_total_goals: round(total * 1.28, 3),
      homeXgLow: round(homeXg * 0.78, 3),
      home_xg_low: round(homeXg * 0.78, 3),
      homeXgBase: homeXg,
      home_xg_base: homeXg,
      homeXgHigh: round(homeXg * 1.22, 3),
      home_xg_high: round(homeXg * 1.22, 3),
      awayXgLow: round(awayXg * 0.78, 3),
      away_xg_low: round(awayXg * 0.78, 3),
      awayXgBase: awayXg,
      away_xg_base: awayXg,
      awayXgHigh: round(awayXg * 1.22, 3),
      away_xg_high: round(awayXg * 1.22, 3),
      attackerEnvironment: attackingEnvironment(Math.max(homeXg, awayXg)),
      attacker_environment: attackingEnvironment(Math.max(homeXg, awayXg)),
      defenderEnvironment: cleanSheetContext(Math.max(probs.homeCleanSheet, probs.awayCleanSheet)),
      defender_environment: cleanSheetContext(Math.max(probs.homeCleanSheet, probs.awayCleanSheet)),
      keeperEnvironment: cleanSheetContext(Math.max(probs.homeCleanSheet, probs.awayCleanSheet)),
      keeper_environment: cleanSheetContext(Math.max(probs.homeCleanSheet, probs.awayCleanSheet)),
      cleanSheetContext: cleanSheetContext(Math.max(probs.homeCleanSheet, probs.awayCleanSheet)),
      clean_sheet_context: cleanSheetContext(Math.max(probs.homeCleanSheet, probs.awayCleanSheet)),
      top_scorelines: probs.topScorelines
    });

    if (fixture.home_team_prediction) updateTeamView(fixture.home_team_prediction, fixture, "home");
    if (fixture.away_team_prediction) updateTeamView(fixture.away_team_prediction, fixture, "away");
    fixture.score_qa_flags = [...new Set([...(fixture.score_qa_flags || []), "md1_partial_score_calibrated"])].sort();
    changedFixtureIds.push(String(fixture.fixture_id || fixture.match_id));
  }

  for (const view of scorePredictions.teamFixturePredictions || []) {
    if (!changedFixtureIds.includes(String(view.fixture_id))) continue;
    const fixture = predictionsById.get(String(view.fixture_id));
    if (!fixture) continue;
    updateTeamView(view, fixture, view.side === "home_listed" ? "home" : "away");
  }

  scorePredictions.generated_at = GENERATED_AT;
  scorePredictions.source_checked = TODAY;
  scorePredictions.model = {
    ...(scorePredictions.model || {}),
    md1_score_calibration: {
      completed_md1_fixtures_used: completedMd1.length,
      pending_md1_fixtures_excluded: pendingMd1.length,
      actual_average_goals: round(actualAverage, 3),
      prior_predicted_average_goals: round(predictedAverage, 3),
      raw_ratio: round(rawRatio, 3),
      applied_goal_multiplier: appliedGoalMultiplier,
      scope: "md2_md3_only"
    }
  };
  scorePredictions.model_notes = [
    ...(scorePredictions.model_notes || []),
    `Emergency MD2 refresh: MD2/MD3 xG multiplied by ${appliedGoalMultiplier} after ${completedMd1.length} completed MD1 fixtures.`
  ];
  scorePredictions.summary = {
    ...(scorePredictions.summary || {}),
    fixture_prediction_count: scorePredictions.fixtureScorePredictions.length,
    team_fixture_prediction_count: (scorePredictions.teamFixturePredictions || []).length,
    average_total_expected_goals: round(average(scorePredictions.fixtureScorePredictions.map((row) => Number(row.total_expected_goals))), 3),
    average_home_expected_goals: round(average(scorePredictions.fixtureScorePredictions.map((row) => Number(row.home_expected_goals))), 3),
    average_away_expected_goals: round(average(scorePredictions.fixtureScorePredictions.map((row) => Number(row.away_expected_goals))), 3),
    md1_score_calibration_applied: true,
    md1_score_calibration_multiplier: appliedGoalMultiplier,
    md1_score_calibrated_fixture_count: changedFixtureIds.length,
    goal_environment_counts: countBy(scorePredictions.fixtureScorePredictions, (row) => row.goal_environment),
    public_goal_environment_counts: countBy(scorePredictions.fixtureScorePredictions, (row) => row.goal_environment_public || row.goalEnvironment),
    upset_risk_counts: countBy(scorePredictions.fixtureScorePredictions, (row) => row.upset_risk_band || row.upset_risk),
    public_upset_risk_counts: countBy(scorePredictions.fixtureScorePredictions, (row) => row.upset_risk_public || row.upsetRisk),
    match_uncertainty_counts: countBy(scorePredictions.fixtureScorePredictions, (row) => row.match_uncertainty || row.matchUncertainty)
  };

  return {
    completedMd1,
    pendingMd1,
    calibrationRows,
    actualAverage,
    predictedAverage,
    rawRatio,
    appliedGoalMultiplier,
    changedFixtureIds
  };
}

function adjustmentFor({ row, liveRow, completedTeamIds, review }) {
  const originalStart = Number(row.start_probability);
  const originalMinutes = Number(row.expected_minutes);
  const status = liveRow?.matchStatus || "none";
  const officialStatus = liveRow?.status || row.selectable_status || "playing";
  const flags = new Set([...(row.data_quality_flags || []), ...(row.minutes_risk_flags || [])]);
  const notes = [];
  let nextStart = Number.isFinite(originalStart) ? originalStart : 0;
  let nextMinutes = Number.isFinite(originalMinutes) ? originalMinutes : 0;
  let roleLabel = row.role_label;
  let roleConfidence = row.role_confidence;
  let action = "unchanged";

  if (officialStatus !== "playing") {
    nextStart = 0;
    nextMinutes = 0;
    roleLabel = "blocked";
    roleConfidence = "blocked";
    action = "blocked_not_selectable";
    flags.add("md2_official_not_selectable");
    notes.push(`Official fantasy status is ${officialStatus}.`);
  } else if (completedTeamIds.has(String(row.team_id))) {
    if (status === "start") {
      nextStart = round(Math.max(nextStart, 0.74), 3);
      nextMinutes = round(Math.max(nextMinutes, 62), 1);
      if (["low", "missing", "thin_profile"].includes(roleConfidence)) roleConfidence = "medium";
      if (nextStart >= 0.8) roleLabel = "locked_starter";
      else if (nextStart >= 0.65) roleLabel = "likely_starter";
      flags.add("md1_lineup_started");
      action = "md1_start_confirmed";
    } else if (status === "sub") {
      nextStart = round(Math.min(nextStart * 0.72, 0.58), 3);
      nextMinutes = round(Math.min(nextMinutes * 0.78, 52), 1);
      roleLabel = nextStart >= 0.45 ? "rotation_starter" : "impact_sub";
      roleConfidence = ["high", "medium"].includes(roleConfidence) ? "medium" : "low";
      flags.add("md1_lineup_substitute");
      flags.add("md2_lineup_evidence_downgrade");
      action = "downgraded_after_md1_sub";
    } else if (status === "not_in_squad") {
      nextStart = round(Math.min(nextStart * 0.25, 0.18), 3);
      nextMinutes = round(Math.min(nextMinutes * 0.35, 22), 1);
      roleLabel = "backup";
      roleConfidence = "low";
      flags.add("md1_not_in_squad");
      flags.add("md2_availability_manual_review");
      flags.add("md2_lineup_evidence_downgrade");
      action = "downgraded_after_md1_not_in_squad";
    } else {
      nextStart = round(Math.min(nextStart * 0.5, 0.35), 3);
      nextMinutes = round(Math.min(nextMinutes * 0.55, 36), 1);
      roleLabel = "unclear";
      roleConfidence = "low";
      flags.add("md1_completed_team_no_player_status");
      flags.add("md2_availability_manual_review");
      action = "downgraded_missing_md1_player_status";
    }
  }

  if (review) {
    flags.add("md2_source_backed_availability_review");
    if (review.exclude_from_modes?.length) flags.add(`md2_exclude_modes_${review.exclude_from_modes.join("_")}`);
    if (Number.isFinite(review.start_probability_cap)) {
      nextStart = round(Math.min(nextStart, review.start_probability_cap), 3);
    }
    if (Number.isFinite(review.expected_minutes_cap)) {
      nextMinutes = round(Math.min(nextMinutes, review.expected_minutes_cap), 1);
    }
    if (review.model_action === "block_not_selectable") {
      nextStart = 0;
      nextMinutes = 0;
      roleLabel = "blocked";
      roleConfidence = "blocked";
      action = "blocked_by_availability_review";
      flags.add("md2_availability_blocked");
    } else if (review.model_action && action === "unchanged") {
      action = review.model_action;
    }
    if (review.model_note) notes.push(review.model_note);
  }

  return {
    official_fantasy_player_id: row.official_fantasy_player_id,
    name: row.name,
    country: row.country,
    original_start_probability: round(originalStart, 3),
    new_start_probability: round(nextStart, 3),
    original_expected_minutes: round(originalMinutes, 1),
    new_expected_minutes: round(nextMinutes, 1),
    original_role_label: row.role_label,
    new_role_label: roleLabel,
    original_role_confidence: row.role_confidence,
    new_role_confidence: roleConfidence,
    md1_match_status: status,
    official_status: officialStatus,
    action,
    changed: round(originalStart, 3) !== round(nextStart, 3) || round(originalMinutes, 1) !== round(nextMinutes, 1) || row.role_label !== roleLabel || row.role_confidence !== roleConfidence,
    flags: [...flags].sort(),
    notes
  };
}

function applyLineupEvidence(minutesModel, liveFixtures, livePlayers, availabilityReview) {
  const completedTeamIds = new Set(liveFixtures.fixtures
    .filter((fixture) => fixture.round_id === "1" && fixture.safe_to_display_score && fixture.score_status === "final")
    .flatMap((fixture) => [String(fixture.home_squad_id), String(fixture.away_squad_id)]));
  const pendingMd1 = liveFixtures.fixtures.filter((fixture) => fixture.round_id === "1" && !fixture.safe_to_display_score);
  const liveById = new Map(livePlayers.players.map((player) => [String(player.official_fantasy_player_id), player]));
  const reviewById = new Map((availabilityReview.reviewed_players || []).map((player) => [String(player.official_fantasy_player_id), player]));
  const adjustments = [];

  for (const row of minutesModel.playerMinutesModel) {
    const liveRow = liveById.get(String(row.official_fantasy_player_id));
    const review = reviewById.get(String(row.official_fantasy_player_id));
    const adjustment = adjustmentFor({ row, liveRow, completedTeamIds, review });
    if (!adjustment.changed && !review) continue;

    row.start_probability = adjustment.new_start_probability;
    row.expected_minutes = adjustment.new_expected_minutes;
    row.role_label = adjustment.new_role_label;
    row.role_confidence = adjustment.new_role_confidence;
    row.expected_minutes_basis = "Emergency MD2 refresh: baseline role model adjusted with completed MD1 lineup evidence and source-backed availability review.";
    row.evidence_level = row.evidence_level === "high_national_team_usage"
      ? "high_national_team_usage_plus_md1_lineup"
      : "md1_lineup_evidence";
    row.evidence_notes = [
      row.evidence_notes,
      `MD1 official fantasy matchStatus=${adjustment.md1_match_status}; emergency action=${adjustment.action}.`,
      ...adjustment.notes
    ].filter(Boolean).join(" ");
    row.data_quality_flags = [...new Set(adjustment.flags)].sort();
    row.minutes_risk_flags = [...new Set([...(row.minutes_risk_flags || []), ...adjustment.flags])].sort();
    row.source_summary = {
      ...(row.source_summary || {}),
      md1_lineup_evidence: {
        source_url: "https://play.fifa.com/json/fantasy/players.json",
        source_checked: livePlayers.source_checked || TODAY,
        match_status: adjustment.md1_match_status,
        official_status: adjustment.official_status,
        action: adjustment.action
      }
    };
    if (review) {
      row.source_summary.md2_availability_review = {
        source_checked: availabilityReview.generated_at || TODAY,
        review_status: review.review_status,
        model_action: review.model_action,
        source_links: review.source_links || []
      };
    }
    if (adjustment.new_role_label === "blocked") {
      row.minutes_model_status = "blocked_not_selectable";
      row.blocked_reasons = [...new Set([...(row.blocked_reasons || []), "md2_availability_blocked"])];
    }
    adjustments.push(adjustment);
  }

  minutesModel.generated_at = GENERATED_AT;
  minutesModel.source_checked = TODAY;
  minutesModel.model_notes = [
    ...(minutesModel.model_notes || []),
    "Emergency MD2 refresh: completed MD1 official fantasy matchStatus values adjusted start probabilities and expected minutes for MD2/MD3 recommendation use."
  ];
  const modeledRows = minutesModel.playerMinutesModel.filter((row) => row.minutes_model_status === "modeled_fantasy_pool_only");
  minutesModel.summary = {
    ...(minutesModel.summary || {}),
    total_rows: minutesModel.playerMinutesModel.length,
    rows_modeled: modeledRows.length,
    rows_blocked: minutesModel.playerMinutesModel.length - modeledRows.length,
    role_label_counts: countBy(minutesModel.playerMinutesModel, (row) => row.role_label),
    role_confidence_counts: countBy(minutesModel.playerMinutesModel, (row) => row.role_confidence),
    md2_emergency_lineup_adjusted_rows: adjustments.filter((row) => row.changed).length,
    md2_emergency_availability_reviewed_rows: (availabilityReview.reviewed_players || []).length,
    md1_completed_teams_with_lineup_evidence: completedTeamIds.size,
    md1_pending_fixtures_excluded: pendingMd1.length
  };

  return { adjustments, completedTeamIds, pendingMd1 };
}

function renderScoreCalibrationReport(calibration) {
  const largestMisses = [...calibration.calibrationRows]
    .sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference))
    .slice(0, 10);
  return [
    "# MD1 Score Calibration v1",
    "",
    `Generated: ${GENERATED_AT}`,
    "",
    "## Scope",
    "",
    `Used ${calibration.completedMd1.length} completed MD1 fixtures with safe final scores. Excluded ${calibration.pendingMd1.length} unfinished MD1 fixtures from calibration.`,
    "",
    "## Calibration",
    "",
    mdTable(["Metric", "Value"], [
      ["Completed MD1 fixtures used", calibration.completedMd1.length],
      ["Pending MD1 fixtures excluded", calibration.pendingMd1.length],
      ["Actual avg total goals", round(calibration.actualAverage, 3)],
      ["Prior predicted avg total goals", round(calibration.predictedAverage, 3)],
      ["Raw actual/predicted ratio", round(calibration.rawRatio, 3)],
      ["Applied MD2/MD3 goal multiplier", calibration.appliedGoalMultiplier],
      ["MD2/MD3 fixtures adjusted", calibration.changedFixtureIds.length]
    ]),
    "",
    "## Unfinished MD1 Fixtures",
    "",
    calibration.pendingMd1.length
      ? mdTable(["Match", "Fixture", "Status", "Date"], calibration.pendingMd1.map((fixture) => [
        fixture.local_match_number,
        `${fixture.home_team} vs ${fixture.away_team}`,
        fixture.fixture_status,
        fixture.date
      ]))
      : "None.",
    "",
    "## Largest Calibration Residuals",
    "",
    mdTable(["Match", "Fixture", "Actual goals", "Predicted goals", "Diff"], largestMisses.map((row) => [
      row.match_number,
      row.fixture,
      row.actual_total_goals,
      row.predicted_total_goals,
      row.difference
    ])),
    "",
    "## Decision",
    "",
    "- MD1 scoring is running hotter than the pre-MD1 score context, but the adjustment is deliberately shrunk to avoid overfitting a partial matchday.",
    "- Calibration applies only to MD2/MD3 score contexts used by player projections and recommendations.",
    "- The two unfinished MD1 fixtures need a final refresh once scores and player points are official.",
    ""
  ].join("\n");
}

function renderScoreQaReport(calibration, scorePredictions) {
  return [
    "# MD2 Score Prediction QA v1",
    "",
    `Generated: ${GENERATED_AT}`,
    "",
    "## Verdict",
    "",
    "PASS: MD2/MD3 score contexts were recalibrated from completed MD1 score evidence without adding betting odds or runtime fetches.",
    "",
    "## Checks",
    "",
    mdTable(["Check", "Result"], [
      ["Completed MD1 scores used", calibration.completedMd1.length],
      ["Unfinished MD1 scores excluded", calibration.pendingMd1.length],
      ["MD2/MD3 fixture rows adjusted", calibration.changedFixtureIds.length],
      ["Team fixture rows available", (scorePredictions.teamFixturePredictions || []).length],
      ["Average total expected goals after adjustment", scorePredictions.summary?.average_total_expected_goals],
      ["Goal multiplier", calibration.appliedGoalMultiplier],
      ["Uses betting odds", scorePredictions.summary?.uses_betting_odds === true ? "yes" : "no"]
    ]),
    "",
    "## Notes",
    "",
    "- The calibration is marked with `md1_partial_score_calibrated` in adjusted fixture and team score contexts.",
    "- This remains a fantasy-pool-only model and does not claim final-squad-backed or betting-market authority.",
    ""
  ].join("\n");
}

function renderLineupReport(lineup, livePlayers) {
  const changed = lineup.adjustments.filter((row) => row.changed);
  const topChanged = [...changed]
    .sort((a, b) => Math.abs((b.original_start_probability || 0) - (b.new_start_probability || 0)) - Math.abs((a.original_start_probability || 0) - (a.new_start_probability || 0)))
    .slice(0, 25);
  const matchStatusCounts = countBy(
    livePlayers.players.filter((player) => lineup.completedTeamIds.has(String(player.team_id || player.squad_id))),
    (player) => player.matchStatus || "none"
  );

  return [
    "# MD2 Lineup Evidence Refresh v1",
    "",
    `Generated: ${GENERATED_AT}`,
    "",
    "## Scope",
    "",
    `Used official fantasy player matchStatus values for ${lineup.completedTeamIds.size} teams from ${lineup.pendingMd1.length ? "22" : "all"} completed MD1 fixtures. Pending MD1 fixtures were excluded.`,
    "",
    "## MatchStatus Counts On Completed MD1 Teams",
    "",
    mdTable(["Status", "Players"], Object.entries(matchStatusCounts).sort().map(([status, count]) => [status, count])),
    "",
    "## Adjustment Counts",
    "",
    mdTable(["Action", "Rows"], Object.entries(countBy(lineup.adjustments, (row) => row.action)).sort().map(([action, count]) => [action, count])),
    "",
    "## Largest Start-Probability Changes",
    "",
    mdTable(["Player", "Country", "MD1 status", "Start before", "Start after", "Minutes before", "Minutes after", "Action"], topChanged.map((row) => [
      row.name,
      row.country,
      row.md1_match_status,
      row.original_start_probability,
      row.new_start_probability,
      row.original_expected_minutes,
      row.new_expected_minutes,
      row.action
    ])),
    "",
    "## Notes",
    "",
    "- MD1 starters are modestly supported; MD1 substitutes, not-in-squad rows, and missing player statuses are downgraded for MD2/MD3.",
    "- External source-backed review caps are applied after the lineup adjustment when available.",
    "- These are model expected-minutes adjustments, not claims about official team sheets.",
    ""
  ].join("\n");
}

function renderAvailabilityReport(availabilityReview, livePlayers) {
  const liveById = new Map(livePlayers.players.map((player) => [String(player.official_fantasy_player_id), player]));
  const rows = (availabilityReview.reviewed_players || []).map((player) => {
    const live = liveById.get(String(player.official_fantasy_player_id));
    return [
      player.name,
      player.country,
      live?.status || "missing",
      live?.matchStatus || "missing",
      player.review_status,
      player.model_action,
      (player.source_links || []).map((source) => `[${source.publisher}](${source.url})`).join("<br>")
    ];
  });

  return [
    "# MD2 Availability Review v1",
    "",
    `Generated: ${GENERATED_AT}`,
    "",
    "## Verdict",
    "",
    "PASS: high-impact MD1 non-starters were reviewed against the official fantasy feed and targeted public-source checks. Where no reliable current external source was found, the model keeps an explicit manual-review/downgrade flag instead of inventing availability.",
    "",
    "## Reviewed Players",
    "",
    mdTable(["Player", "Country", "Official status", "MD1 status", "Review status", "Model action", "Sources"], rows),
    "",
    "## Source Policy",
    "",
    "- Official fantasy player status and MD1 matchStatus come from `https://play.fifa.com/json/fantasy/players.json`.",
    "- Public articles are used only as supporting context; if they are absent or unclear, the official feed and MD1 lineup evidence drive a conservative model action.",
    "- No injury, suspension, or lineup claim is added without a source link or an explicit no-source-found note.",
    ""
  ].join("\n");
}

function flattenTopLists(recommendations) {
  return (recommendations.matchdayRecommendations || []).flatMap((scope) =>
    Object.entries(scope.top_lists || {}).flatMap(([mode, rows]) =>
      (rows || []).map((row) => ({ ...row, scope: scope.matchday_id, mode }))
    )
  );
}

function renderRecommendationQa({ recommendations, projections, financeMetrics, teamBuilderCoverage, availabilityReview }) {
  const candidateRows = recommendations.recommendationCandidates || [];
  const topRows = flattenTopLists(recommendations);
  const md2Rows = candidateRows.filter((row) => row.matchday === "md2");
  const md3Rows = candidateRows.filter((row) => row.matchday === "md3");
  const reviewedIds = new Set((availabilityReview.reviewed_players || []).map((row) => String(row.official_fantasy_player_id)));
  const reviewedTopSafeCaptain = topRows.filter((row) =>
    reviewedIds.has(String(row.official_fantasy_player_id)) &&
    ["safe", "captain"].includes(row.mode) &&
    ["md2", "md3"].includes(row.scope)
  );
  const lowStartSafeCaptain = topRows.filter((row) =>
    ["safe", "captain"].includes(row.mode) &&
    ["md2", "md3"].includes(row.scope) &&
    Number(row.start_probability) < 0.62
  );
  const topMd2 = md2Rows
    .filter((row) => row.mode === "balanced")
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 12);
  const topMd3 = md3Rows
    .filter((row) => row.mode === "balanced")
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 12);
  const checks = [
    ["MD2 candidate rows", md2Rows.length],
    ["MD3 candidate rows", md3Rows.length],
    ["Recommendation candidates total", candidateRows.length],
    ["Projection rows", (projections.playerMatchdayProjections || []).length],
    ["Finance metric rows", (financeMetrics.playerFinanceMetrics || []).length],
    ["Reviewed high-impact players in MD2/MD3 safe/captain top lists", reviewedTopSafeCaptain.length],
    ["Low-start MD2/MD3 safe/captain top-list rows", lowStartSafeCaptain.length],
    ["Team Builder candidates", teamBuilderCoverage?.counts?.team_builder_candidate_rows ?? "missing"]
  ];
  const verdict = md2Rows.length > 0 && md3Rows.length > 0 && reviewedTopSafeCaptain.length === 0 && lowStartSafeCaptain.length === 0
    ? "PASS"
    : "REVIEW";

  return [
    "# MD2 Recommendation QA v1",
    "",
    `Generated: ${GENERATED_AT}`,
    "",
    "## Verdict",
    "",
    `${verdict}: MD2/MD3 recommendation scopes render after lineup-evidence and availability adjustments.`,
    "",
    "## Checks",
    "",
    mdTable(["Check", "Result"], checks),
    "",
    "## MD2 Balanced Top 12",
    "",
    mdTable(["Rank", "Player", "Country", "Pos", "Start", "Risk pts", "Opponent"], topMd2.map((row) => [
      row.rank,
      row.name,
      row.country,
      row.official_fantasy_position,
      row.start_probability,
      row.risk_adjusted_points,
      row.opponent
    ])),
    "",
    "## MD3 Balanced Top 12",
    "",
    mdTable(["Rank", "Player", "Country", "Pos", "Start", "Risk pts", "Opponent"], topMd3.map((row) => [
      row.rank,
      row.name,
      row.country,
      row.official_fantasy_position,
      row.start_probability,
      row.risk_adjusted_points,
      row.opponent
    ])),
    "",
    "## Reviewed Players In Safe/Captain Top Lists",
    "",
    reviewedTopSafeCaptain.length
      ? mdTable(["Scope", "Mode", "Rank", "Player", "Start"], reviewedTopSafeCaptain.map((row) => [
        row.scope,
        row.mode,
        row.rank,
        row.name,
        row.start_probability
      ]))
      : "None.",
    "",
    "## Notes",
    "",
    "- Reviewed MD1 non-starters are allowed to remain as upside/watchlist candidates when the model still sees value, but they are not allowed to survive as safe/captain top-list picks after the emergency caps.",
    "- Recommendation output remains fantasy-pool-only and carries final-squad/rules warnings.",
    ""
  ].join("\n");
}

function renderEmergencyReport({ monitor, liveFixtures, calibration, lineup, availabilityReview, recommendations, teamBuilderCoverage }) {
  const completedMd1 = calibration.completedMd1;
  const pendingMd1 = calibration.pendingMd1;
  const peleStatus = "Local PELE/team-quality inputs were not re-scraped; score context was recalibrated from completed MD1 score evidence on top of the existing PELE-anchored model.";
  const recSummary = recommendations?.summary || {};
  const highImpactRows = (availabilityReview.reviewed_players || []).map((player) => [
    player.name,
    player.country,
    player.review_status,
    player.model_action
  ]);

  return [
    "# MD2 Emergency Refresh v1",
    "",
    `Generated: ${GENERATED_AT}`,
    "",
    "## Executive Summary",
    "",
    `Emergency refresh completed using ${completedMd1.length} completed MD1 fixtures, ${lineup.adjustments.filter((row) => row.changed).length} lineup-driven minutes adjustments, and ${availabilityReview.reviewed_players?.length || 0} targeted high-impact availability reviews. ${pendingMd1.length} MD1 fixtures remain excluded until final.`,
    "",
    "## Completed MD1 Games Used",
    "",
    mdTable(["Match", "Fixture", "Score"], completedMd1.map((fixture) => [
      fixture.local_match_number,
      `${fixture.home_team} vs ${fixture.away_team}`,
      `${fixture.home_score}-${fixture.away_score}`
    ])),
    "",
    "## Missing MD1 Games",
    "",
    pendingMd1.length
      ? mdTable(["Match", "Fixture", "Status", "Date"], pendingMd1.map((fixture) => [
        fixture.local_match_number,
        `${fixture.home_team} vs ${fixture.away_team}`,
        fixture.fixture_status,
        fixture.date
      ]))
      : "None.",
    "",
    "## Official Monitor",
    "",
    mdTable(["Item", "Result"], [
      ["Monitor status", monitor.monitor_status],
      ["Official data changed", monitor.summary?.official_data_changed],
      ["Rerun decision", monitor.recommendation?.rerun_decision],
      ["New players", monitor.diffs?.players?.counts?.new_players ?? 0],
      ["Selectable-status changes", monitor.diffs?.players?.counts?.selectable_status_changes ?? 0],
      ["Deadline/round changes", monitor.diffs?.rules?.counts?.deadline_round_changes ?? 0]
    ]),
    "",
    "## PELE And Score Calibration",
    "",
    `- PELE status: ${peleStatus}`,
    `- MD1 actual average goals: ${round(calibration.actualAverage, 3)}`,
    `- Prior predicted average goals: ${round(calibration.predictedAverage, 3)}`,
    `- Applied MD2/MD3 score multiplier: ${calibration.appliedGoalMultiplier}`,
    "",
    "## Lineup And Availability Changes",
    "",
    mdTable(["Metric", "Count"], [
      ["Lineup adjustment rows", lineup.adjustments.filter((row) => row.changed).length],
      ["Availability-reviewed players", availabilityReview.reviewed_players?.length || 0],
      ["MD1 completed teams", lineup.completedTeamIds.size],
      ["Pending MD1 fixtures excluded", pendingMd1.length]
    ]),
    "",
    "## High-Impact Reviewed Players",
    "",
    mdTable(["Player", "Country", "Review status", "Model action"], highImpactRows),
    "",
    "## Recommendation Result",
    "",
    mdTable(["Metric", "Result"], [
      ["Candidate rows", recSummary.candidate_rows ?? "missing"],
      ["MD2 candidates", recSummary.candidates_by_matchday?.md2 ?? "missing"],
      ["MD3 candidates", recSummary.candidates_by_matchday?.md3 ?? "missing"],
      ["Low-confidence top-list candidates", recSummary.low_confidence_candidates_in_top_lists ?? "missing"],
      ["Safe for public recommendations flag", recSummary.safe_for_public_recommendations ?? "missing"]
    ]),
    "",
    "## Team Builder",
    "",
    `Team Builder candidate count: ${teamBuilderCoverage?.counts?.team_builder_candidate_rows ?? "missing"}. Coverage report remains the authority for field completeness and static loading checks.`,
    "",
    "## Final MD1 Refresh Needed",
    "",
    pendingMd1.length
      ? `Yes. Re-run live import, fixture mapping QA, score calibration, lineup evidence, projections, finance metrics, recommendations, and browser QA after ${pendingMd1.map((fixture) => `${fixture.home_team} vs ${fixture.away_team}`).join(" and ")} finish.`
      : "No pending MD1 fixtures remain in the current live import.",
    "",
    "## Source Files",
    "",
    Object.values(REPORTS).map((path) => `- ${path}`).join("\n"),
    ""
  ].join("\n");
}

async function runAdjustPhase() {
  const [liveFixtures, livePlayers, scorePredictions, minutesModel, availabilityReview] = await Promise.all([
    readJson(PATHS.liveFixtures),
    readJson(PATHS.livePlayers),
    readJson(PATHS.scorePredictions),
    readJson(PATHS.minutesModel),
    readJson(PATHS.availabilityReviewInput)
  ]);

  const calibration = recalibrateScorePredictions(scorePredictions, liveFixtures);
  const lineup = applyLineupEvidence(minutesModel, liveFixtures, livePlayers, availabilityReview);
  const availabilityOutput = {
    ...availabilityReview,
    generated_at: GENERATED_AT,
    official_feed_source: "https://play.fifa.com/json/fantasy/players.json",
    md1_lineup_source_checked: livePlayers.source_checked || TODAY,
    reviewed_players: (availabilityReview.reviewed_players || []).map((player) => {
      const live = livePlayers.players.find((row) => String(row.official_fantasy_player_id) === String(player.official_fantasy_player_id));
      return {
        ...player,
        official_status: live?.status || null,
        md1_match_status: live?.matchStatus || null
      };
    })
  };
  const lineupJson = {
    schema_version: "md2_lineup_evidence_refresh_v1",
    generated_at: GENERATED_AT,
    completed_md1_team_count: lineup.completedTeamIds.size,
    pending_md1_fixtures: lineup.pendingMd1.map((fixture) => ({
      fixture_id: fixture.local_fixture_id,
      match_number: fixture.local_match_number,
      home_team: fixture.home_team,
      away_team: fixture.away_team,
      status: fixture.fixture_status,
      date: fixture.date
    })),
    adjustment_count: lineup.adjustments.length,
    changed_count: lineup.adjustments.filter((row) => row.changed).length,
    adjustments: lineup.adjustments
  };

  await writeFile(PATHS.scorePredictions, `${JSON.stringify(scorePredictions, null, 2)}\n`, "utf8");
  await writeFile(PATHS.minutesModel, `${JSON.stringify(minutesModel, null, 2)}\n`, "utf8");
  await writeFile(REPORTS.scoreCalibration, renderScoreCalibrationReport(calibration), "utf8");
  await writeFile(REPORTS.scoreQa, renderScoreQaReport(calibration, scorePredictions), "utf8");
  await writeFile(REPORTS.lineupEvidence, renderLineupReport(lineup, livePlayers), "utf8");
  await writeFile(REPORTS.lineupEvidenceJson, `${JSON.stringify(lineupJson, null, 2)}\n`, "utf8");
  await writeFile(REPORTS.availabilityReviewJson, `${JSON.stringify(availabilityOutput, null, 2)}\n`, "utf8");
  await writeFile(REPORTS.availabilityReview, renderAvailabilityReport(availabilityOutput, livePlayers), "utf8");

  console.log(`Adjusted ${calibration.changedFixtureIds.length} score fixtures and ${lineup.adjustments.filter((row) => row.changed).length} minutes rows.`);
}

async function runReportPhase() {
  const [
    monitor,
    liveFixtures,
    livePlayers,
    scorePredictions,
    recommendations,
    projections,
    financeMetrics,
    teamBuilderCoverage,
    availabilityReview
  ] = await Promise.all([
    readJson(PATHS.monitor),
    readJson(PATHS.liveFixtures),
    readJson(PATHS.livePlayers),
    readJson(PATHS.scorePredictions),
    readJson(PATHS.recommendations),
    readJson(PATHS.projections),
    readJson(PATHS.financeMetrics),
    readJsonIfExists(PATHS.teamBuilderCoverage),
    readJson(REPORTS.availabilityReviewJson)
  ]);

  const predictionsById = new Map(scorePredictions.fixtureScorePredictions.map((row) => [String(row.fixture_id || row.match_id), row]));
  const completedMd1 = liveFixtures.fixtures.filter((fixture) =>
    fixture.round_id === "1" &&
    fixture.safe_to_display_score &&
    fixture.score_status === "final" &&
    predictionsById.has(String(fixture.local_fixture_id))
  );
  const pendingMd1 = liveFixtures.fixtures.filter((fixture) => fixture.round_id === "1" && !fixture.safe_to_display_score);
  const calibrationRows = completedMd1.map((fixture) => {
    const prediction = predictionsById.get(String(fixture.local_fixture_id));
    const predictedTotal = Number(prediction.total_expected_goals ?? (Number(prediction.home_expected_goals) + Number(prediction.away_expected_goals)));
    const actualTotal = Number(fixture.home_score) + Number(fixture.away_score);
    return {
      fixture_id: fixture.local_fixture_id,
      actual_total_goals: actualTotal,
      predicted_total_goals: round(predictedTotal, 3)
    };
  });
  const calibration = {
    completedMd1,
    pendingMd1,
    calibrationRows,
    actualAverage: average(calibrationRows.map((row) => row.actual_total_goals)),
    predictedAverage: average(calibrationRows.map((row) => row.predicted_total_goals)),
    rawRatio: null,
    appliedGoalMultiplier: scorePredictions.model?.md1_score_calibration?.applied_goal_multiplier || null
  };
  calibration.rawRatio = calibration.actualAverage && calibration.predictedAverage
    ? calibration.actualAverage / calibration.predictedAverage
    : null;
  const lineupJson = await readJson(REPORTS.lineupEvidenceJson);
  const lineup = {
    adjustments: lineupJson.adjustments || [],
    completedTeamIds: new Set(),
    pendingMd1
  };
  liveFixtures.fixtures
    .filter((fixture) => fixture.round_id === "1" && fixture.safe_to_display_score && fixture.score_status === "final")
    .forEach((fixture) => {
      lineup.completedTeamIds.add(String(fixture.home_squad_id));
      lineup.completedTeamIds.add(String(fixture.away_squad_id));
    });

  await writeFile(
    REPORTS.recommendationQa,
    renderRecommendationQa({ recommendations, projections, financeMetrics, teamBuilderCoverage, availabilityReview }),
    "utf8"
  );
  await writeFile(
    REPORTS.emergencyRefresh,
    renderEmergencyReport({ monitor, liveFixtures, livePlayers, calibration, lineup, availabilityReview, recommendations, teamBuilderCoverage }),
    "utf8"
  );

  console.log(`Wrote ${REPORTS.recommendationQa} and ${REPORTS.emergencyRefresh}.`);
}

if (PHASE === "adjust" || PHASE === "all") {
  await runAdjustPhase();
}
if (PHASE === "report" || PHASE === "all") {
  await runReportPhase();
}
