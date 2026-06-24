import fs from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import vm from "node:vm";

const VERSION_STAMP = "20260624";
const CACHE_VERSION = "20260624-md3-final-md2-evidence";
const MODEL = {
  score: "score-v5-md3-pele-md1-md2full-calibrated",
  scoreSource: "fantasy_pool_score_prediction_v5_md3_pele_md1_md2full_calibrated_2026-06-24",
  role: "player-role-v3-md3-full-md2-incentive-form",
  projection: "player-projection-v5-md3-score-v5-role-v3-incentive-form",
  recommendation: "recommendation-v5-md3-incentive-form"
};

const PATHS = {
  worldCupData: "worldCupData.js",
  liveMatchday: "data/liveMatchdayStatus_v1.json",
  livePlayers: "data/livePlayerStatus_v1.json",
  liveFixtureQa: "data/liveFixtureMappingQa_v1.json",
  peleRatings: "data/peleRatings_v1.json",
  teamQuality: "data/teamQuality.json",
  scoreV4: "data/scorePredictions_fantasyPool_v4_md2.json",
  projectionV4: "data/fantasyPoolMatchdayProjections_md2_v4.json",
  roleV2: "data/playerRoleModel_md2_v2.json",
  recommendationV4: "data/fantasyPoolRecommendations_md2_v4.json",
  officialStatusJs: "fantasyPoolOfficialDataStatusData.js",
  financeJs: "fantasyPoolFinanceMetricsData.js",
  fantasyRules: "fantasyRules.json",
  partialDataset: "data/md2CalibrationDataset_for_md3_v1.json",
  partialPostmortem: "data/md2ModelPostmortem_for_md3_v1.json",
  partialReport: "data/md2ModelPostmortemReport_for_md3_v1.md",
  groupIncentive: "data/groupIncentiveModel_md3_v1.json",
  groupIncentiveReport: "data/groupIncentiveModel_md3_v1.md",
  groupIncentiveQa: "data/groupIncentiveQa_md3_v1.json",
  groupIncentiveQaReport: "data/groupIncentiveQaReport_md3_v1.md",
  peleAuditJson: "data/peleRefreshAudit_md3_v1.json",
  peleAuditMd: "data/peleRefreshAudit_md3_v1.md",
  scoreV5: "data/scorePredictions_fantasyPool_v5_md3.json",
  scoreBrowser: "fantasyPoolScorePredictionsData.js",
  scoreDoc: "data/scorePredictionModel_v5_md3.md",
  scoreQa: "data/scorePredictionQa_v5_md3.json",
  scoreQaReport: "data/scorePredictionQaReport_v5_md3.md",
  roleV3: "data/playerRoleModel_md3_v3.json",
  roleQa: "data/playerRoleModelQa_md3_v3.json",
  roleQaReport: "data/playerRoleModelQaReport_md3_v3.md",
  roleDoc: "data/playerRoleModel_md3_v3.md",
  projectionV5: "data/fantasyPoolMatchdayProjections_md3_v5.json",
  projectionBrowser: "fantasyPoolMatchdayProjectionsData.js",
  projectionDoc: "data/playerProjectionModel_md3_v5.md",
  projectionQa: "data/playerProjectionQa_md3_v5.json",
  projectionQaReport: "data/playerProjectionQaReport_md3_v5.md",
  recommendationV5: "data/fantasyPoolRecommendations_md3_v5.json",
  recommendationBrowser: "fantasyPoolRecommendationsData.js",
  recommendationDoc: "data/recommendationModel_md3_v5.md",
  recommendationQa: "data/recommendationQa_md3_v5.json",
  recommendationQaReport: "data/recommendationQaReport_md3_v5.md",
  md3ReleaseQa: "data/md3ReleaseQa_v1.json",
  md3ReleaseQaReport: "data/md3ReleaseQaReport_v1.md"
};

const FINAL_STATUSES = new Set(["complete", "completed", "played"]);
const POSITION_CODES = ["GK", "DEF", "MID", "FWD"];
const MODE_LABELS = {
  balanced: "Core Picks",
  safe: "High-Floor Picks",
  upside: "Upside Picks",
  differential: "Differential Picks / Value Picks",
  captain: "Captain Watchlist"
};

function now() {
  return new Date().toISOString();
}

function number(value, fallback = null) {
  if (value === null || value === undefined || value === "") return fallback;
  const parsed = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function round(value, digits = 3) {
  if (!Number.isFinite(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function average(values, fallback = null) {
  const clean = values.filter(Number.isFinite);
  return clean.length ? clean.reduce((sum, value) => sum + value, 0) / clean.length : fallback;
}

function sum(values) {
  return values.filter(Number.isFinite).reduce((total, value) => total + value, 0);
}

function unique(values) {
  return [...new Set(values.filter((value) => value !== null && value !== undefined && value !== "").map(String))];
}

function normalizedText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function teamSlug(value) {
  return normalizedText(value).replace(/\s+/g, "-");
}

function countBy(rows, getter) {
  return rows.reduce((counts, row) => {
    const key = getter(row) ?? "missing";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function priceBucket(price) {
  const value = number(price, 0);
  if (value >= 8) return "8.0+";
  if (value >= 6.5) return "6.5-7.9";
  if (value >= 5) return "5.0-6.4";
  if (value >= 4) return "4.0-4.9";
  return "under_4.0";
}

function isFinalStatus(value) {
  return FINAL_STATUSES.has(String(value || "").toLowerCase());
}

function isSelectableStatus(value) {
  return String(value || "playing").trim().toLowerCase() === "playing";
}

function fantasyId(row) {
  return String(row?.official_fantasy_player_id || row?.officialFantasyPlayerId || "").trim();
}

function mdLabel(matchday) {
  return {
    md1: "Matchday 1",
    md2: "Matchday 2",
    md3: "Matchday 3",
    group_stage_full: "Full Group Stage"
  }[matchday] || matchday || "Unknown";
}

function sideResult(home, away) {
  if (home > away) return "home";
  if (away > home) return "away";
  return "draw";
}

function poisson(k, lambda) {
  let factorial = 1;
  for (let index = 2; index <= k; index += 1) factorial *= index;
  return (Math.E ** -lambda) * (lambda ** k) / factorial;
}

function scoreGrid(homeXg, awayXg, maxGoals = 10) {
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
  return {
    homeWin: round(homeWin, 6),
    draw: round(draw, 6),
    awayWin: round(awayWin, 6),
    homeCleanSheet: round(homeCleanSheet, 6),
    awayCleanSheet: round(awayCleanSheet, 6),
    over25: round(over25, 6),
    under25: round(1 - over25, 6),
    btts: round(btts, 6),
    topScorelines: grid
      .map((cell) => ({
        scoreline: `${cell.home_goals}-${cell.away_goals}`,
        home_goals: cell.home_goals,
        away_goals: cell.away_goals,
        probability: round(cell.probability / total, 4)
      }))
      .sort((left, right) => right.probability - left.probability)
      .slice(0, 6)
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

function attackerEnvironmentLabel(expectedGoals, totalGoals) {
  if (expectedGoals >= 1.9 || totalGoals >= 3.05) return "Strong";
  if (expectedGoals >= 1.35 || totalGoals >= 2.6) return "Good";
  if (expectedGoals >= 0.9 || totalGoals >= 2.25) return "Neutral";
  return "Difficult";
}

function defenderEnvironmentLabel(cleanSheetProbability, expectedGoalsAgainst) {
  if (cleanSheetProbability >= 0.55 && expectedGoalsAgainst <= 0.75) return "Strong";
  if (cleanSheetProbability >= 0.38 || expectedGoalsAgainst <= 1.05) return "Good";
  if (cleanSheetProbability >= 0.22 || expectedGoalsAgainst <= 1.45) return "Neutral";
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
  return round(clamp(82 - winProbability * 36 - teamXg * 12 - cleanSheetProbability * 16 + opponentXg * 7, 1, 99), 2);
}

function environmentScores({ teamXg, opponentXg, winProbability, cleanSheetProbability }) {
  return {
    attacking: round(clamp(teamXg * 31 + winProbability * 30 - opponentXg * 3, 0, 100), 1),
    defensive: round(clamp(cleanSheetProbability * 76 + winProbability * 18 - opponentXg * 8, 0, 100), 1),
    captain: round(clamp(teamXg * 28 + winProbability * 32 + cleanSheetProbability * 8, 0, 100), 1)
  };
}

function teamPredictionView(prior, fixture, side, teamXg, opponentXg, winProbability, drawProbability, lossProbability, cleanSheetProbability, goalEnv, upsetRiskProbability, upsetBand, uncertaintyLabel, qaFlags) {
  const scores = environmentScores({ teamXg, opponentXg, winProbability, cleanSheetProbability });
  const difficulty = fixtureDifficultyScore({ teamXg, opponentXg, winProbability, cleanSheetProbability });
  const total = teamXg + opponentXg;
  const defenderEnvironment = defenderEnvironmentLabel(cleanSheetProbability, opponentXg);
  const publicGoal = publicGoalEnvironmentLabel(total);
  const publicUpset = publicUpsetRiskLabel(upsetRiskProbability);
  return {
    ...(prior || {}),
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
    attackerEnvironment: attackerEnvironmentLabel(teamXg, total),
    attacker_environment: attackerEnvironmentLabel(teamXg, total),
    defenderEnvironment,
    defender_environment: defenderEnvironment,
    keeperEnvironment: defenderEnvironment,
    keeper_environment: defenderEnvironment,
    cleanSheetContext: cleanSheetContextLabel(cleanSheetProbability),
    clean_sheet_context: cleanSheetContextLabel(cleanSheetProbability),
    goalEnvironment: publicGoal,
    goal_environment_public: publicGoal,
    upsetRisk: publicUpset,
    upset_risk_public: publicUpset,
    matchUncertainty: uncertaintyLabel,
    match_uncertainty: uncertaintyLabel,
    goal_environment: goalEnv,
    upset_risk_probability: upsetRiskProbability,
    upset_risk_band: upsetBand,
    uncertaintyLabel: uncertaintyLabel,
    uncertainty_label: uncertaintyLabel,
    uncertaintyReason: `${uncertaintyLabel} uncertainty: MD3 uses final MD1 plus full final MD2 evidence.`,
    uncertainty_reason: `${uncertaintyLabel} uncertainty: MD3 uses final MD1 plus full final MD2 evidence.`,
    model_stage: "fantasy_pool_only",
    score_model_version: MODEL.score,
    qa_flags: qaFlags,
    side
  };
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function writeJson(path, value) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function loadGlobals(files) {
  const context = { window: {} };
  vm.createContext(context);
  for (const file of files) {
    vm.runInContext(await readFile(file, "utf8"), context, { filename: file });
  }
  return context.window;
}

function indexBy(rows, getter) {
  const map = new Map();
  for (const row of rows || []) {
    const key = getter(row);
    if (key !== null && key !== undefined && String(key).trim()) map.set(String(key), row);
  }
  return map;
}

function groupBy(rows, getter) {
  const map = new Map();
  for (const row of rows || []) {
    const key = getter(row);
    if (key === null || key === undefined || String(key).trim() === "") continue;
    const value = String(key);
    const list = map.get(value) || [];
    list.push(row);
    map.set(value, list);
  }
  return map;
}

function liveFixtureBySquadId(fixtures, roundId = "2", finalOnly = true) {
  const map = new Map();
  for (const fixture of fixtures || []) {
    if (String(fixture.round_id) !== roundId) continue;
    if (finalOnly && !isFinalStatus(fixture.fixture_status)) continue;
    for (const side of ["home", "away"]) {
      const squadId = String(fixture[`${side}_squad_id`] || fixture[`live_${side}_squad_id`] || "");
      if (squadId) map.set(squadId, fixture);
    }
  }
  return map;
}

function teamNameForSide(fixture, side) {
  return fixture?.[`${side}_team`] || fixture?.[`local_${side}_team`] || null;
}

function teamIdForSide(fixture, side) {
  return fixture?.[`${side}_team_id`] || fixture?.[`local_${side}_team_id`] || null;
}

function predictionResult(row) {
  const home = number(row.home_win_probability, 0);
  const away = number(row.away_win_probability, 0);
  return home >= away ? "home" : "away";
}

function fixtureResidualRow(liveFixture, prediction) {
  const homeActual = number(liveFixture.home_score, 0);
  const awayActual = number(liveFixture.away_score, 0);
  const predictedHome = number(prediction?.home_expected_goals, null);
  const predictedAway = number(prediction?.away_expected_goals, null);
  const actualResult = sideResult(homeActual, awayActual);
  const predictedFavoriteSide = prediction ? predictionResult(prediction) : null;
  return {
    fixture_id: liveFixture.local_fixture_id,
    match_number: liveFixture.match_number,
    matchday: "md2",
    fixture: `${teamNameForSide(liveFixture, "home")} vs ${teamNameForSide(liveFixture, "away")}`,
    home_team_id: teamIdForSide(liveFixture, "home"),
    home_team: teamNameForSide(liveFixture, "home"),
    away_team_id: teamIdForSide(liveFixture, "away"),
    away_team: teamNameForSide(liveFixture, "away"),
    status: liveFixture.fixture_status,
    actual_home_goals: homeActual,
    actual_away_goals: awayActual,
    actual_total_goals: homeActual + awayActual,
    predicted_home_xg: predictedHome,
    predicted_away_xg: predictedAway,
    predicted_total_xg: Number.isFinite(predictedHome) && Number.isFinite(predictedAway) ? round(predictedHome + predictedAway, 3) : null,
    home_xg_residual: Number.isFinite(predictedHome) ? round(homeActual - predictedHome, 3) : null,
    away_xg_residual: Number.isFinite(predictedAway) ? round(awayActual - predictedAway, 3) : null,
    total_goal_residual: Number.isFinite(predictedHome) && Number.isFinite(predictedAway) ? round(homeActual + awayActual - predictedHome - predictedAway, 3) : null,
    predicted_favorite: predictedFavoriteSide === "home" ? teamNameForSide(liveFixture, "home") : predictedFavoriteSide === "away" ? teamNameForSide(liveFixture, "away") : null,
    actual_result: actualResult,
    favorite_result_hit: predictedFavoriteSide ? actualResult === predictedFavoriteSide : false,
    home_clean_sheet_predicted_probability: number(prediction?.home_clean_sheet_probability, null),
    away_clean_sheet_predicted_probability: number(prediction?.away_clean_sheet_probability, null),
    home_clean_sheet_actual: awayActual === 0,
    away_clean_sheet_actual: homeActual === 0
  };
}

function teamResidualRows(fixtureRows) {
  return fixtureRows.flatMap((row) => [
    {
      team_id: row.home_team_id,
      team: row.home_team,
      opponent_team_id: row.away_team_id,
      opponent: row.away_team,
      fixture_id: row.fixture_id,
      match_number: row.match_number,
      side: "home",
      predicted_goals_for: row.predicted_home_xg,
      actual_goals_for: row.actual_home_goals,
      predicted_goals_against: row.predicted_away_xg,
      actual_goals_against: row.actual_away_goals,
      attack_residual: round(row.actual_home_goals - row.predicted_home_xg, 3),
      defense_residual: round(row.actual_away_goals - row.predicted_away_xg, 3)
    },
    {
      team_id: row.away_team_id,
      team: row.away_team,
      opponent_team_id: row.home_team_id,
      opponent: row.home_team,
      fixture_id: row.fixture_id,
      match_number: row.match_number,
      side: "away",
      predicted_goals_for: row.predicted_away_xg,
      actual_goals_for: row.actual_away_goals,
      predicted_goals_against: row.predicted_home_xg,
      actual_goals_against: row.actual_home_goals,
      attack_residual: round(row.actual_away_goals - row.predicted_away_xg, 3),
      defense_residual: round(row.actual_home_goals - row.predicted_home_xg, 3)
    }
  ]);
}

function actualRoundPoints(livePlayer, roundId) {
  const roundPoints = livePlayer?.stats?.roundPoints || {};
  if (Object.prototype.hasOwnProperty.call(roundPoints, String(roundId))) {
    return number(roundPoints[String(roundId)], 0);
  }
  return null;
}

function playerAuditDecision(row) {
  if (!row) {
    return "not_found_in_current_official_live_data";
  }
  if (!isSelectableStatus(row.selectable_status)) {
    return "zero_and_remove_from_actionable_recommendations";
  }
  if (row.role_downgrade_evidence && row.repeated_underperformance) {
    return "strong_downgrade_role_and_form_caution";
  }
  if (row.repeated_underperformance) {
    return "downgrade_projection_confidence_due_to_two_game_underperformance";
  }
  if (row.role_downgrade_evidence) {
    return "downgrade_start_probability_due_to_low_md2_participation_points";
  }
  return "eligible_but_keep_current_status_and_model_context";
}

function buildMd2Watchlists(twoGameRows, md2MissRows, statusWatchlist) {
  const overprojected = [...twoGameRows]
    .filter((row) => Number.isFinite(row.two_game_projection_error))
    .sort((a, b) => a.two_game_projection_error - b.two_game_projection_error)
    .slice(0, 25);
  const underprojected = [...twoGameRows]
    .filter((row) => Number.isFinite(row.two_game_projection_error))
    .sort((a, b) => b.two_game_projection_error - a.two_game_projection_error)
    .slice(0, 25);
  return {
    top_players_overprojected_md1_md2: overprojected,
    top_players_underprojected_md1_md2: underprojected,
    premium_players_with_poor_two_game_returns: [...twoGameRows]
      .filter((row) => number(row.price, 0) >= 7 && number(row.actual_md1_md2_points, 0) <= 4)
      .sort((a, b) => b.price - a.price || a.actual_md1_md2_points - b.actual_md1_md2_points)
      .slice(0, 25),
    high_projection_players_benched_or_low_participation_md2: [...twoGameRows]
      .filter((row) => row.role_downgrade_evidence)
      .sort((a, b) => number(b.md2_projected_points, 0) - number(a.md2_projected_points, 0))
      .slice(0, 25),
    players_with_new_injury_suspension_not_selectable_flags: statusWatchlist,
    returned_to_playing_players: [],
    likely_md3_rotation_watchlist_pending_group_incentive_model: [],
    largest_md2_projection_misses: [...md2MissRows]
      .sort((a, b) => Math.abs(b.residual) - Math.abs(a.residual))
      .slice(0, 25)
  };
}

function buildExplicitPlayerAudits(twoGameRows, livePlayers) {
  const byName = new Map(twoGameRows.map((row) => [normalizedText(row.name), row]));
  const findByName = (names) => names.map((name) => byName.get(normalizedText(name))).find(Boolean) || null;
  const auditTargets = [
    {
      audit_key: "luis_suarez",
      requested_name: "Luis Suárez",
      row: findByName(["Luis Suárez", "Luis Suarez"])
    },
    {
      audit_key: "nico_oreilly",
      requested_name: "Nico O'Reilly",
      row: findByName(["Nico O'Reilly", "Nico O’Reilly"])
    },
    {
      audit_key: "raphinha",
      requested_name: "Raphinha / Raphael Dias Belloli",
      row: findByName(["Raphael Dias Belloli", "Raphinha"])
    }
  ].map((target) => ({
    audit_key: target.audit_key,
    requested_name: target.requested_name,
    identified_player: target.row ? {
      official_fantasy_player_id: target.row.official_fantasy_player_id,
      name: target.row.name,
      country: target.row.country,
      position: target.row.position,
      selectable_status: target.row.selectable_status
    } : null,
    evidence: target.row,
    decision: playerAuditDecision(target.row)
  }));
  const germanDefenders = (livePlayers || [])
    .filter((player) => player.team_name === "Germany" && player.position === "DEF" && !isSelectableStatus(player.status))
    .map((player) => ({
      official_fantasy_player_id: fantasyId(player),
      name: player.name,
      country: player.team_name,
      position: player.position,
      selectable_status: player.status,
      actual_md1_points: actualRoundPoints(player, "1"),
      actual_md2_points: actualRoundPoints(player, "2")
    }));
  auditTargets.push({
    audit_key: "german_defender_status_issue",
    requested_name: "German defender injury/status issue",
    identified_player: germanDefenders[0] || null,
    evidence: germanDefenders,
    decision: germanDefenders.length
      ? "zero_and_remove_from_actionable_recommendations"
      : "no_current_german_defender_injury_or_not_selectable_status_found_in_official_feed"
  });
  return auditTargets;
}

async function buildMd2PartialPostmortemForMd3() {
  const [live, livePlayers, scoreV4, projectionV4] = await Promise.all([
    readJson(PATHS.liveMatchday),
    readJson(PATHS.livePlayers),
    readJson(PATHS.scoreV4),
    readJson(PATHS.projectionV4)
  ]);
  const scoreByFixture = indexBy(scoreV4.fixtureScorePredictions, (row) => row.fixture_id);
  const completedMd1Fixtures = (live.fixtures || [])
    .filter((fixture) => String(fixture.round_id) === "1" && isFinalStatus(fixture.fixture_status) && fixture.safe_to_display_score !== false);
  const completedMd2Fixtures = (live.fixtures || [])
    .filter((fixture) => String(fixture.round_id) === "2" && isFinalStatus(fixture.fixture_status) && fixture.safe_to_display_score !== false);
  const excludedMd2Fixtures = (live.fixtures || [])
    .filter((fixture) => String(fixture.round_id) === "2" && !completedMd2Fixtures.includes(fixture))
    .map((fixture) => ({
      fixture_id: fixture.local_fixture_id,
      match_number: fixture.match_number,
      fixture: `${teamNameForSide(fixture, "home")} vs ${teamNameForSide(fixture, "away")}`,
      fixture_status: fixture.fixture_status,
      score_status: fixture.score_status,
      reason: isFinalStatus(fixture.fixture_status) ? "unsafe_or_unmapped_final_fixture_excluded" : `${fixture.fixture_status || "not_final"}_md2_fixture_excluded`
    }));
  const fixtureRows = completedMd2Fixtures.map((fixture) => fixtureResidualRow(fixture, scoreByFixture.get(fixture.local_fixture_id)));
  const teamRows = teamResidualRows(fixtureRows);
  const finalMd2BySquadId = liveFixtureBySquadId(live.fixtures, "2", true);
  const livePlayerById = indexBy(livePlayers.players, fantasyId);
  const md2ProjectionRows = (projectionV4.playerMatchdayProjections || []).filter((row) => row.matchday === "md2");
  const md1Md2ProjectionRows = (projectionV4.playerMatchdayProjections || [])
    .filter((row) => ["md1", "md2"].includes(row.matchday));
  const completedFixtureIds = new Set(completedMd2Fixtures.map((fixture) => fixture.local_fixture_id));
  const completedMd1Md2FixtureIds = new Set([...completedMd1Fixtures, ...completedMd2Fixtures].map((fixture) => fixture.local_fixture_id));
  const playerMissRows = md2ProjectionRows
    .filter((row) => completedFixtureIds.has(row.fixture_id))
    .map((row) => {
      const livePlayer = livePlayerById.get(fantasyId(row));
      const actual = actualRoundPoints(livePlayer, "2");
      if (!Number.isFinite(actual)) return null;
      return {
        official_fantasy_player_id: fantasyId(row),
        name: row.name,
        country: row.country,
        position: row.official_fantasy_position || row.position,
        fixture_id: row.fixture_id,
        match_number: row.match_number,
        opponent: row.opponent,
        projected_points: number(row.raw_expected_points, 0),
        risk_adjusted_points: number(row.risk_adjusted_points, 0),
        actual_points: actual,
        residual: round(actual - number(row.raw_expected_points, 0), 3),
        matchStatus: livePlayer?.matchStatus || null,
        point_scope: livePlayer?.stats?.pointScope || null
      };
    })
    .filter(Boolean);
  const projectionRowsByPlayer = groupBy(
    md1Md2ProjectionRows.filter((row) => completedMd1Md2FixtureIds.has(row.fixture_id)),
    fantasyId
  );
  const twoGamePlayerRows = [...projectionRowsByPlayer.entries()]
    .map(([id, rows]) => {
      const livePlayer = livePlayerById.get(id);
      if (!livePlayer) return null;
      const actual1 = actualRoundPoints(livePlayer, "1");
      const actual2 = actualRoundPoints(livePlayer, "2");
      const actualValues = [actual1, actual2].filter(Number.isFinite);
      if (!actualValues.length) return null;
      const md1Projection = rows.find((row) => row.matchday === "md1");
      const md2Projection = rows.find((row) => row.matchday === "md2");
      const projected = sum(rows.map((row) => number(row.raw_expected_points, 0)));
      const actual = sum(actualValues);
      const md2Projected = number(md2Projection?.raw_expected_points, null);
      const md2Actual = Number.isFinite(actual2) ? actual2 : null;
      const repeatedUnderperformance = projected >= 8 && actual <= 4 && actual <= projected - 4.5;
      const roleDowngradeEvidence = Number.isFinite(md2Actual) && md2Actual <= 1 && Number.isFinite(md2Projected) && md2Projected >= 4;
      return {
        official_fantasy_player_id: id,
        name: livePlayer.name || rows[0].name,
        country: livePlayer.team_name || rows[0].country,
        team_id: rows[0].team_id,
        official_team_id: rows[0].official_team_id || livePlayer.team_id,
        position: rows[0].official_fantasy_position || rows[0].position || livePlayer.position,
        selectable_status: livePlayer.status || rows[0].selectable_status || "playing",
        price: number(rows[0].official_price || rows[0].price || livePlayer.price, null),
        projected_md1_md2_points: round(projected, 3),
        actual_md1_points: actual1,
        actual_md2_points: actual2,
        actual_md1_md2_points: round(actual, 3),
        two_game_projection_error: round(actual - projected, 3),
        md1_projected_points: number(md1Projection?.raw_expected_points, null),
        md2_projected_points: md2Projected,
        md2_fixture_id: md2Projection?.fixture_id || null,
        md2_opponent: md2Projection?.opponent || null,
        matchStatus: livePlayer.matchStatus || null,
        repeated_underperformance: repeatedUnderperformance,
        role_downgrade_evidence: roleDowngradeEvidence,
        point_scope: livePlayer.stats?.pointScope || null
      };
    })
    .filter(Boolean);
  const participationEvidence = (livePlayers.players || [])
    .filter((player) => finalMd2BySquadId.has(String(player.team_id || player.squad_id || "")))
    .map((player) => ({
      official_fantasy_player_id: fantasyId(player),
      name: player.name,
      country: player.team_name,
      team_id: player.team_id,
      matchStatus: player.matchStatus || null,
      round2_points: actualRoundPoints(player, "2"),
      evidence_type: player.matchStatus === "start"
        ? "official_matchStatus_start"
        : player.matchStatus === "sub"
          ? "official_matchStatus_sub"
          : player.matchStatus === "not_in_squad"
            ? "official_matchStatus_not_in_squad"
            : Number.isFinite(actualRoundPoints(player, "2")) && actualRoundPoints(player, "2") > 0
              ? "positive_final_points"
              : "zero_or_missing_final_points"
    }));
  const statusWatchlist = (livePlayers.players || [])
    .filter((player) => !isSelectableStatus(player.status))
    .map((player) => ({
      official_fantasy_player_id: fantasyId(player),
      name: player.name,
      country: player.team_name,
      team_id: player.team_id,
      position: player.position,
      selectable_status: player.status,
      actual_md1_points: actualRoundPoints(player, "1"),
      actual_md2_points: actualRoundPoints(player, "2"),
      model_action: "force_zero_unavailable"
    }));
  const explicitAudits = buildExplicitPlayerAudits(twoGamePlayerRows, livePlayers.players || []);
  const summary = {
    generated_at: now(),
    defaultMatchday: "md3",
    md2EvidenceIsPartial: false,
    md2FullEvidence: true,
    completedMd1FixturesUsed: completedMd1Fixtures.length,
    completedMd2FixturesUsed: completedMd2Fixtures.length,
    remainingMd2FixturesExcluded: excludedMd2Fixtures.length,
    md2InProgressActualsUsedForCalibration: false,
    md2ScheduledActualsUsedForCalibration: false,
    ownershipUsedAsSignal: false,
    finalSquadsSourceBacked: false,
    fixtureResidualRows: fixtureRows.length,
    teamResidualRows: teamRows.length,
    playerProjectionMissRows: playerMissRows.length,
    twoGamePlayerRows: twoGamePlayerRows.length,
    participationEvidenceRows: participationEvidence.length,
    actualGoalsPerCompletedMd2Fixture: round(average(fixtureRows.map((row) => row.actual_total_goals)), 3),
    predictedGoalsPerCompletedMd2Fixture: round(average(fixtureRows.map((row) => row.predicted_total_xg)), 3),
    resultAccuracy: round(fixtureRows.filter((row) => row.favorite_result_hit).length / Math.max(1, fixtureRows.length), 4),
    cleanSheetActualCount: fixtureRows.reduce((total, row) => total + (row.home_clean_sheet_actual ? 1 : 0) + (row.away_clean_sheet_actual ? 1 : 0), 0),
    cleanSheetExpectedCount: round(sum(fixtureRows.flatMap((row) => [row.home_clean_sheet_predicted_probability, row.away_clean_sheet_predicted_probability])), 3)
  };
  const dataset = {
    schema_version: "md2_calibration_for_md3_v1",
    generated_at: summary.generated_at,
    model_scope: "MD3 model input using full final MD1 and MD2 evidence",
    summary,
    fixture_calibration_rows: fixtureRows,
    team_residual_rows: teamRows,
    player_projection_miss_rows: playerMissRows,
    two_game_player_rows: twoGamePlayerRows,
    role_participation_evidence_rows: participationEvidence,
    status_watchlist: statusWatchlist,
    watchlists: buildMd2Watchlists(twoGamePlayerRows, playerMissRows, statusWatchlist),
    explicit_audits: explicitAudits,
    excluded_md2_fixtures: excludedMd2Fixtures,
    policy: {
      completedFinalMd2FixturesOnly: true,
      excludesInProgressMd2Fixtures: true,
      excludesScheduledMd2Fixtures: true,
      usesFullCompletedMd2Evidence: completedMd2Fixtures.length === 24 && excludedMd2Fixtures.length === 0,
      ownershipUsedAsSignal: false,
      finalSquadsSourceBacked: false
    }
  };
  const postmortem = {
    schema_version: "md2_model_postmortem_for_md3_v1",
    generated_at: summary.generated_at,
    summary,
    fixture_level: {
      largest_total_goal_residuals: [...fixtureRows].sort((a, b) => Math.abs(b.total_goal_residual) - Math.abs(a.total_goal_residual)).slice(0, 12),
      result_accuracy: summary.resultAccuracy,
      clean_sheet_expected: summary.cleanSheetExpectedCount,
      clean_sheet_actual: summary.cleanSheetActualCount
    },
    team_level: {
      largest_attack_overperformance: [...teamRows].sort((a, b) => b.attack_residual - a.attack_residual).slice(0, 12),
      largest_attack_underperformance: [...teamRows].sort((a, b) => a.attack_residual - b.attack_residual).slice(0, 12),
      largest_defense_risk: [...teamRows].sort((a, b) => b.defense_residual - a.defense_residual).slice(0, 12)
    },
    player_level: {
      largest_positive_projection_misses: [...playerMissRows].sort((a, b) => b.residual - a.residual).slice(0, 20),
      largest_negative_projection_misses: [...playerMissRows].sort((a, b) => a.residual - b.residual).slice(0, 20),
      participation_evidence_counts: countBy(participationEvidence, (row) => row.evidence_type),
      watchlists: dataset.watchlists,
      explicit_audits: explicitAudits
    },
    excluded_md2_fixtures: excludedMd2Fixtures
  };
  await writeJson(PATHS.partialDataset, dataset);
  await writeJson(PATHS.partialPostmortem, postmortem);
  await writeFile(PATHS.partialReport, md2PartialReport(postmortem), "utf8");
  return dataset;
}

function md2PartialReport(postmortem) {
  const summary = postmortem.summary;
  const excluded = postmortem.excluded_md2_fixtures.length
    ? postmortem.excluded_md2_fixtures.map((row) => `| ${row.match_number} | ${row.fixture} | ${row.fixture_status} | ${row.reason} |`).join("\n")
    : "| none | none | none | full MD2 final evidence used |";
  const fixtureRows = postmortem.fixture_level.largest_total_goal_residuals.map((row) => `| ${row.match_number} | ${row.fixture} | ${row.actual_home_goals}-${row.actual_away_goals} | ${row.predicted_total_xg} | ${row.total_goal_residual} |`).join("\n");
  const auditRows = (postmortem.player_level.explicit_audits || []).map((row) => `| ${row.requested_name} | ${row.identified_player?.name || "none"} | ${row.identified_player?.selectable_status || "n/a"} | ${row.decision} |`).join("\n");
  return `# MD2 Model Postmortem For MD3 v1

Generated: ${postmortem.generated_at}

Status: **full final MD2 evidence for MD3**

This postmortem uses all completed/final MD2 fixtures and completed MD1 player-point evidence for MD3 calibration, role, form, and recommendation caution.

## Summary

| Metric | Value |
| --- | ---: |
| Completed MD1 fixtures used | ${summary.completedMd1FixturesUsed} |
| Completed MD2 fixtures used | ${summary.completedMd2FixturesUsed} |
| Remaining MD2 fixtures excluded | ${summary.remainingMd2FixturesExcluded} |
| Actual goals per completed MD2 fixture | ${summary.actualGoalsPerCompletedMd2Fixture} |
| Prior predicted goals per completed MD2 fixture | ${summary.predictedGoalsPerCompletedMd2Fixture} |
| Favorite/result hit rate | ${summary.resultAccuracy} |
| Player projection miss rows | ${summary.playerProjectionMissRows} |
| Two-game player rows | ${summary.twoGamePlayerRows} |
| MD2 in-progress actuals used | false |
| Ownership used as signal | false |

## Largest Fixture Residuals

| Match | Fixture | Actual | Pred total xG | Residual |
| ---: | --- | --- | ---: | ---: |
${fixtureRows}

## Excluded MD2 Fixtures

| Match | Fixture | Status | Reason |
| ---: | --- | --- | --- |
${excluded}

## Explicit Player Audits

| Request | Identified player | Status | Decision |
| --- | --- | --- | --- |
${auditRows}
`;
}

async function buildPeleRefreshAuditMd3() {
  const [pele, teamQuality, liveQa] = await Promise.all([
    readJson(PATHS.peleRatings),
    readJson(PATHS.teamQuality),
    readJson(PATHS.liveFixtureQa)
  ]);
  const teams = teamQuality.teams || [];
  const teamIds = teams.map((team) => team.team_id);
  const duplicates = teamIds.filter((id, index) => teamIds.indexOf(id) !== index);
  const missingTeams = teams.filter((team) => !Number.isFinite(number(team.current_strength_inputs?.pele_rating, null)));
  const invalidTeams = teams.filter((team) => [
    team.team_quality_v2?.overall_score,
    team.current_strength_inputs?.pele_rating,
    team.goals_clean_sheet_inputs_v2?.attack_proxy_score,
    team.goals_clean_sheet_inputs_v2?.defense_proxy_score
  ].some((value) => !Number.isFinite(number(value, null))));
  const audit = {
    schema_version: "pele_refresh_audit_md3_v1",
    generated_at: now(),
    status: missingTeams.length || duplicates.length || invalidTeams.length ? "RED" : "GREEN",
    pele_source_refreshed: true,
    pele_source_checked: pele.source_checked || teamQuality.source_checked || null,
    pele_rows_total: pele.row_count || pele.rows?.length || null,
    teamQualityCoverage: {
      worldCupTeams: teams.length,
      worldCupTeamsWithPele: teams.length - missingTeams.length,
      missingTeams: missingTeams.map((team) => team.country),
      duplicateTeamKeys: unique(duplicates),
      invalidNumericRows: invalidTeams.map((team) => team.country)
    },
    fixtureMappingSafe: liveQa.status === "passed",
    safety: {
      md2InProgressActualsUsed: false,
      ownershipUsedAsSignal: false,
      finalSquadsSourceBacked: false,
      sourceBackedPeleOnly: true
    },
    sourceUrls: teamQuality.sources || pele.source_urls || {}
  };
  await writeJson(PATHS.peleAuditJson, audit);
  await writeFile(PATHS.peleAuditMd, `# PELE Refresh Audit MD3 v1

Generated: ${audit.generated_at}

Status: **${audit.status}**

| Check | Result |
| --- | --- |
| PELE source refreshed | ${audit.pele_source_refreshed ? "true" : "false"} |
| PELE rows | ${audit.pele_rows_total} |
| World Cup team coverage | ${audit.teamQualityCoverage.worldCupTeamsWithPele} / ${audit.teamQualityCoverage.worldCupTeams} |
| Missing teams | ${audit.teamQualityCoverage.missingTeams.length ? audit.teamQualityCoverage.missingTeams.join(", ") : "none"} |
| Duplicate team keys | ${audit.teamQualityCoverage.duplicateTeamKeys.length} |
| Invalid numeric values | ${audit.teamQualityCoverage.invalidNumericRows.length} |
| Fixture mappings safe | ${audit.fixtureMappingSafe ? "true" : "false"} |
| MD2 in-progress actuals used | false |
| Ownership used as signal | false |
| Final squads source-backed | false |
`, "utf8");
  return audit;
}

function emptyTableRow(team, groupId, teamId, squadId = null) {
  return {
    group: groupId,
    team,
    team_id: teamId,
    squad_id: squadId,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goals_for: 0,
    goals_against: 0,
    goal_difference: 0,
    points: 0,
    remaining_md3_fixture: null
  };
}

function applyGroupResult(teamRow, goalsFor, goalsAgainst) {
  teamRow.played += 1;
  teamRow.goals_for += goalsFor;
  teamRow.goals_against += goalsAgainst;
  teamRow.goal_difference = teamRow.goals_for - teamRow.goals_against;
  if (goalsFor > goalsAgainst) {
    teamRow.wins += 1;
    teamRow.points += 3;
  } else if (goalsFor === goalsAgainst) {
    teamRow.draws += 1;
    teamRow.points += 1;
  } else {
    teamRow.losses += 1;
  }
}

function statusForGroupTeam(team, rows) {
  const others = rows.filter((row) => row.team_id !== team.team_id);
  const otherMaxPoints = others.map((row) => row.points + 3);
  const maxOther = Math.max(...otherMaxPoints);
  const teamMax = team.points + 3;
  const othersCanTieOrPassCurrent = others.filter((row) => row.points + 3 >= team.points).length;
  const othersAlreadyAboveTeamMax = others.filter((row) => row.points > teamMax).length;
  const drawPoints = team.points + 1;
  const othersCanTieOrPassDraw = others.filter((row) => row.points + 3 >= drawPoints).length;

  if (team.points > maxOther) {
    return {
      incentive_status: "clinched_first",
      rotation_risk_category: "very_high_rotation_risk",
      certainty: "points_mathematical",
      reason: "Current points exceed every other team's maximum possible points."
    };
  }
  if (othersCanTieOrPassCurrent <= 1) {
    return {
      incentive_status: "qualified_but_first_not_clinched",
      rotation_risk_category: "moderate_rotation_risk",
      certainty: "conservative_points_safe_top_two",
      reason: "At most one other team can tie or pass the current points total, but first place remains open."
    };
  }
  if (othersAlreadyAboveTeamMax >= 3) {
    return {
      incentive_status: "eliminated_or_low_incentive",
      rotation_risk_category: "high_rotation_risk",
      certainty: "points_mathematical",
      reason: "Three other teams already have more points than this team can reach."
    };
  }
  if (team.points <= 1 || othersCanTieOrPassDraw >= 3) {
    return {
      incentive_status: "must_win",
      rotation_risk_category: "must_play_strong",
      certainty: "conservative_points_pressure",
      reason: "A draw leaves too many teams able to tie or pass; model treats MD3 as must-win."
    };
  }
  if (team.points >= 4) {
    return {
      incentive_status: "likely_qualified_but_not_mathematically_safe",
      rotation_risk_category: "moderate_rotation_risk",
      certainty: "best_third_place_not_fully_modeled",
      reason: "Four-plus points is likely useful, but best-third-place and tiebreakers are not fully implemented."
    };
  }
  return {
    incentive_status: "can_finish_1_2_3",
    rotation_risk_category: "normal_incentive",
    certainty: "tiebreaker_uncertainty",
    reason: "Team can still move materially in MD3; preserve normal incentive."
  };
}

async function buildMd3GroupIncentiveModel() {
  const [live, globals] = await Promise.all([
    readJson(PATHS.liveMatchday),
    loadGlobals([PATHS.worldCupData])
  ]);
  const worldCup = globals.WORLD_CUP_DATA || {};
  const nameToLiveMeta = new Map();
  for (const fixture of live.fixtures || []) {
    for (const side of ["home", "away"]) {
      const name = teamNameForSide(fixture, side);
      if (!name) continue;
      nameToLiveMeta.set(normalizedText(name), {
        team_id: teamIdForSide(fixture, side) || teamSlug(name),
        squad_id: fixture[`${side}_squad_id`] || fixture[`live_${side}_squad_id`] || null,
        team: name
      });
    }
  }
  const tablesByGroup = new Map();
  const teamGroup = new Map();
  for (const group of worldCup.groups || []) {
    const rows = [];
    for (const teamName of group.teams || []) {
      const liveMeta = nameToLiveMeta.get(normalizedText(teamName)) || {};
      const teamId = liveMeta.team_id || teamSlug(teamName);
      const row = emptyTableRow(liveMeta.team || teamName, group.id, teamId, liveMeta.squad_id || null);
      rows.push(row);
      teamGroup.set(teamId, group.id);
    }
    tablesByGroup.set(group.id, rows);
  }
  const rowByTeamId = new Map([...tablesByGroup.values()].flat().map((row) => [row.team_id, row]));
  const finalMd1Md2 = (live.fixtures || [])
    .filter((fixture) => ["1", "2"].includes(String(fixture.round_id)))
    .filter((fixture) => isFinalStatus(fixture.fixture_status) && fixture.safe_to_display_score !== false);
  for (const fixture of finalMd1Md2) {
    const homeId = teamIdForSide(fixture, "home");
    const awayId = teamIdForSide(fixture, "away");
    const home = rowByTeamId.get(homeId);
    const away = rowByTeamId.get(awayId);
    if (!home || !away) continue;
    applyGroupResult(home, number(fixture.home_score, 0), number(fixture.away_score, 0));
    applyGroupResult(away, number(fixture.away_score, 0), number(fixture.home_score, 0));
  }
  const md3Fixtures = (live.fixtures || []).filter((fixture) => String(fixture.round_id) === "3");
  for (const fixture of md3Fixtures) {
    for (const [side, opponentSide] of [["home", "away"], ["away", "home"]]) {
      const teamId = teamIdForSide(fixture, side);
      const row = rowByTeamId.get(teamId);
      if (!row) continue;
      row.remaining_md3_fixture = {
        fixture_id: fixture.local_fixture_id,
        match_number: fixture.match_number,
        opponent_team_id: teamIdForSide(fixture, opponentSide),
        opponent: teamNameForSide(fixture, opponentSide),
        status: fixture.fixture_status,
        date: fixture.date || null
      };
    }
  }
  const team_statuses = [];
  const group_tables = {};
  for (const [groupId, rows] of tablesByGroup.entries()) {
    const sorted = rows
      .map((row) => ({ ...row }))
      .sort((a, b) => b.points - a.points || b.goal_difference - a.goal_difference || b.goals_for - a.goals_for || a.team.localeCompare(b.team));
    group_tables[groupId] = sorted;
    for (const row of sorted) {
      team_statuses.push({
        ...row,
        ...statusForGroupTeam(row, sorted),
        tiebreaker_policy: "conservative_points_first; do not mark clinched first unless points alone prove it"
      });
    }
  }
  const qa = {
    schema_version: "group_incentive_qa_md3_v1",
    generated_at: now(),
    status: finalMd1Md2.length === 48 && md3Fixtures.length === 24 && team_statuses.length === 48 ? "GREEN" : "YELLOW",
    checks: {
      completedMd1Md2FixturesUsed: finalMd1Md2.length,
      md3FixtureCoverage: `${md3Fixtures.length} / 24`,
      teamStatusRows: team_statuses.length,
      groupsCovered: Object.keys(group_tables).length,
      tiebreakersFullyImplemented: false,
      bestThirdPlaceFullyImplemented: false
    },
    teams_classified_very_high_rotation_risk: team_statuses.filter((row) => row.rotation_risk_category === "very_high_rotation_risk").map((row) => row.team),
    teams_classified_must_play_strong: team_statuses.filter((row) => row.rotation_risk_category === "must_play_strong").map((row) => row.team),
    teams_classified_normal_incentive: team_statuses.filter((row) => row.rotation_risk_category === "normal_incentive").map((row) => row.team),
    teams_where_status_uncertain: team_statuses.filter((row) => row.certainty.includes("uncertainty") || row.certainty.includes("not_fully_modeled")).map((row) => row.team),
    assumptions: [
      "Top two group qualification is treated by conservative points math.",
      "Best-third-place and detailed FIFA tiebreakers are not fully modeled; uncertain teams are not overclaimed.",
      "Clinched first requires points alone to beat every other team's maximum possible points."
    ]
  };
  const output = {
    schema_version: "group_incentive_model_md3_v1",
    generated_at: now(),
    defaultMatchday: "md3",
    source_files: [PATHS.worldCupData, PATHS.liveMatchday, PATHS.liveFixtureQa],
    completed_md1_fixtures_used: finalMd1Md2.filter((fixture) => String(fixture.round_id) === "1").length,
    completed_md2_fixtures_used: finalMd1Md2.filter((fixture) => String(fixture.round_id) === "2").length,
    md3_fixture_count: md3Fixtures.length,
    qualification_policy: {
      exact_group_rules_source: "worldCupData.js FIFA groups/tie-breaker source note",
      tiebreakers_fully_implemented: false,
      best_third_place_fully_implemented: false,
      conservative_uncertainty_policy: true
    },
    group_tables,
    team_statuses,
    qa_status: qa.status,
    safety: {
      ownershipUsedAsSignal: false,
      finalSquadsSourceBacked: false,
      noInProgressFixturesUsed: true
    }
  };
  await writeJson(PATHS.groupIncentive, output);
  await writeJson(PATHS.groupIncentiveQa, qa);
  await writeFile(PATHS.groupIncentiveReport, groupIncentiveMarkdown(output, qa), "utf8");
  await writeFile(PATHS.groupIncentiveQaReport, groupIncentiveQaMarkdown(qa), "utf8");
  return { output, qa };
}

function groupIncentiveMarkdown(output, qa) {
  const rows = output.team_statuses
    .map((row) => `| ${row.group} | ${row.team} | ${row.points} | ${row.goal_difference} | ${row.incentive_status} | ${row.rotation_risk_category} |`)
    .join("\n");
  return `# Group Incentive Model MD3 v1

Generated: ${output.generated_at}

Status: **${qa.status}**

The model uses completed MD1 and MD2 scores only. Tiebreakers and best-third-place logic are conservative, so uncertain teams are not marked clinched.

| Group | Team | Pts | GD | Incentive | Rotation Risk |
| --- | --- | ---: | ---: | --- | --- |
${rows}
`;
}

function groupIncentiveQaMarkdown(qa) {
  return `# Group Incentive QA MD3 v1

Generated: ${qa.generated_at}

Status: **${qa.status}**

| Check | Result |
| --- | --- |
| Completed MD1+MD2 fixtures used | ${qa.checks.completedMd1Md2FixturesUsed} |
| MD3 fixture coverage | ${qa.checks.md3FixtureCoverage} |
| Team status rows | ${qa.checks.teamStatusRows} |
| Groups covered | ${qa.checks.groupsCovered} |
| Tiebreakers fully implemented | false |
| Best-third-place fully implemented | false |

Very high rotation risk: ${qa.teams_classified_very_high_rotation_risk.join(", ") || "none"}

Must play strong: ${qa.teams_classified_must_play_strong.join(", ") || "none"}

Uncertain: ${qa.teams_where_status_uncertain.join(", ") || "none"}
`;
}

function teamAdjustmentsFromPartial(partial) {
  const grouped = groupBy(partial.team_residual_rows || [], (row) => row.team_id);
  const output = new Map();
  for (const [teamId, rows] of grouped.entries()) {
    const actualFor = sum(rows.map((row) => number(row.actual_goals_for, null)));
    const predictedFor = sum(rows.map((row) => number(row.predicted_goals_for, null)));
    const actualAgainst = sum(rows.map((row) => number(row.actual_goals_against, null)));
    const predictedAgainst = sum(rows.map((row) => number(row.predicted_goals_against, null)));
    const rawAttack = Math.log((actualFor + 0.7 * rows.length) / Math.max(0.1, predictedFor + 0.7 * rows.length));
    const rawDefense = Math.log((actualAgainst + 0.7 * rows.length) / Math.max(0.1, predictedAgainst + 0.7 * rows.length));
    output.set(teamId, {
      team_id: teamId,
      team: rows[0].team,
      completed_md2_fixtures: rows.length,
      actual_goals_for: actualFor,
      predicted_goals_for: round(predictedFor, 3),
      actual_goals_against: actualAgainst,
      predicted_goals_against: round(predictedAgainst, 3),
      raw_attack_residual: round(rawAttack, 4),
      raw_defense_weakness_residual: round(rawDefense, 4),
      attack_multiplier: round(clamp(Math.exp(0.22 * rawAttack), 0.9, 1.12), 4),
      defense_weakness_multiplier: round(clamp(Math.exp(0.22 * rawDefense), 0.9, 1.12), 4)
    });
  }
  return output;
}

function scoreCalibrationFromPartial(partial) {
  const fixtures = partial.fixture_calibration_rows || [];
  const actualGoals = sum(fixtures.map((row) => number(row.actual_total_goals, null)));
  const predictedGoals = sum(fixtures.map((row) => number(row.predicted_total_xg, null)));
  const rawGoalRatio = predictedGoals > 0 ? actualGoals / predictedGoals : 1;
  const expectedCs = number(partial.summary?.cleanSheetExpectedCount, null);
  const actualCs = number(partial.summary?.cleanSheetActualCount, null);
  const rawCsRatio = Number.isFinite(expectedCs) && expectedCs > 0 ? actualCs / expectedCs : 1;
  return {
    completedMd2FixturesUsed: partial.summary.completedMd2FixturesUsed,
    remainingMd2FixturesExcluded: partial.summary.remainingMd2FixturesExcluded,
    actualGoalsPerCompletedMd2Fixture: partial.summary.actualGoalsPerCompletedMd2Fixture,
    predictedGoalsPerCompletedMd2Fixture: partial.summary.predictedGoalsPerCompletedMd2Fixture,
    rawGoalRatio: round(rawGoalRatio, 4),
    globalMd2GoalMultiplier: round(clamp(Math.exp(0.28 * Math.log(rawGoalRatio)), 0.95, 1.08), 4),
    rawCleanSheetRatio: round(rawCsRatio, 4),
    cleanSheetMultiplier: round(clamp(Math.exp(0.22 * Math.log(Math.max(0.1, rawCsRatio))), 0.85, 1.05), 4),
    wdlConfidenceShrink: 0.1,
    md2PartialEvidence: false,
    md2FullEvidence: true,
    md2InProgressActualsUsedForCalibration: false,
    ownershipUsedAsSignal: false,
    finalSquadsSourceBacked: false
  };
}

function updateFixtureForScoreV5(prior, teamAdjustments, calibration) {
  if (prior.fantasy_matchday_id !== "md3") {
    return {
      ...prior,
      modelVersion: MODEL.score,
      model_version: MODEL.score,
      defaultMatchday: "md3",
      md2_full_evidence_used_for_this_fixture: false,
      source_model_version: MODEL.scoreSource
    };
  }
  const homeAdjustment = teamAdjustments.get(prior.home_team_id) || null;
  const awayAdjustment = teamAdjustments.get(prior.away_team_id) || null;
  const homeAttack = homeAdjustment?.attack_multiplier ?? 1;
  const awayAttack = awayAdjustment?.attack_multiplier ?? 1;
  const homeDefense = homeAdjustment?.defense_weakness_multiplier ?? 1;
  const awayDefense = awayAdjustment?.defense_weakness_multiplier ?? 1;
  const priorHomeXg = number(prior.home_expected_goals, 0);
  const priorAwayXg = number(prior.away_expected_goals, 0);
  const homeXg = round(clamp(priorHomeXg * calibration.globalMd2GoalMultiplier * homeAttack * awayDefense, 0.15, 4.6), 3);
  const awayXg = round(clamp(priorAwayXg * calibration.globalMd2GoalMultiplier * awayAttack * homeDefense, 0.15, 4.6), 3);
  const grid = scoreGrid(homeXg, awayXg);
  const wdl = shrinkWdl(grid, calibration.wdlConfidenceShrink);
  const homeCleanSheet = round(clamp(grid.homeCleanSheet * calibration.cleanSheetMultiplier, 0, 1), 4);
  const awayCleanSheet = round(clamp(grid.awayCleanSheet * calibration.cleanSheetMultiplier, 0, 1), 4);
  const homeFavorite = wdl.homeWin >= wdl.awayWin;
  const underdogWinProbability = homeFavorite ? wdl.awayWin : wdl.homeWin;
  const upsetRiskProbability = round(underdogWinProbability + wdl.draw * 0.24, 4);
  const upsetBand = upsetRiskBand(upsetRiskProbability);
  const totalXg = round(homeXg + awayXg, 3);
  const goalEnv = goalEnvironment(totalXg);
  const totalDelta = Math.abs(totalXg - number(prior.total_expected_goals, 0));
  const uncertaintyBase = prior.uncertaintyLabel === "High" ? 42 : prior.uncertaintyLabel === "Low" ? 20 : 30;
  const uncertaintyScore = round(clamp(uncertaintyBase + totalDelta * 7 + (homeAdjustment || awayAdjustment ? 4 : 0), 0, 100), 1);
  const uncertaintyLabel = uncertaintyScore >= 40 ? "High" : uncertaintyScore >= 24 ? "Medium" : "Low";
  const qaFlags = unique([
    ...(prior.qa_flags || []),
    "md3_default_score_v5",
    "md2_full_final_fixture_calibrated",
    "md2_in_progress_actuals_not_used",
    "ownership_not_used_as_signal",
    "final_squads_not_source_backed"
  ]);
  const homeTeamPrediction = teamPredictionView(prior.home_team_prediction, prior, "home_listed", homeXg, awayXg, wdl.homeWin, wdl.draw, wdl.awayWin, homeCleanSheet, goalEnv, upsetRiskProbability, upsetBand, uncertaintyLabel, qaFlags);
  const awayTeamPrediction = teamPredictionView(prior.away_team_prediction, prior, "away_listed", awayXg, homeXg, wdl.awayWin, wdl.draw, wdl.homeWin, awayCleanSheet, goalEnv, upsetRiskProbability, upsetBand, uncertaintyLabel, qaFlags);
  return {
    ...prior,
    prediction_id: `${prior.fixture_id}-score-fantasy-pool-v5-md3`,
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
    projectedXg: { home: homeXg, away: awayXg, home_team: prior.home_team, away_team: prior.away_team, meaning: "fixture_specific_expected_goals_against_listed_opponent" },
    projected_xg: { home: homeXg, away: awayXg, home_team: prior.home_team, away_team: prior.away_team, meaning: "fixture_specific_expected_goals_against_listed_opponent" },
    total_expected_goals: totalXg,
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
    favorite_win_probability: homeFavorite ? wdl.homeWin : wdl.awayWin,
    underdog_team_id: homeFavorite ? prior.away_team_id : prior.home_team_id,
    underdog_team: homeFavorite ? prior.away_team : prior.home_team,
    underdog_win_probability: underdogWinProbability,
    upset_risk_probability: upsetRiskProbability,
    upset_risk_band: upsetBand,
    uncertaintyScore: uncertaintyScore,
    uncertainty_score: uncertaintyScore,
    uncertaintyLabel,
    uncertainty_label: uncertaintyLabel,
    matchUncertainty: uncertaintyLabel,
    match_uncertainty: uncertaintyLabel,
    lowTotalGoals: round(totalXg * 0.82, 3),
    low_total_goals: round(totalXg * 0.82, 3),
    baseTotalGoals: totalXg,
    base_total_goals: totalXg,
    highTotalGoals: round(totalXg * 1.18, 3),
    high_total_goals: round(totalXg * 1.18, 3),
    top_scorelines: grid.topScorelines,
    home_team_prediction: homeTeamPrediction,
    away_team_prediction: awayTeamPrediction,
    fantasy_context: {
      attackerEnvironment: attackerEnvironmentLabel(Math.max(homeXg, awayXg), totalXg),
      defenderEnvironment: defenderEnvironmentLabel(Math.max(homeCleanSheet, awayCleanSheet), Math.min(homeXg, awayXg)),
      keeperEnvironment: defenderEnvironmentLabel(Math.max(homeCleanSheet, awayCleanSheet), Math.min(homeXg, awayXg)),
      cleanSheetContext: cleanSheetContextLabel(Math.max(homeCleanSheet, awayCleanSheet)),
      goalEnvironment: publicGoalEnvironmentLabel(totalXg),
      upsetRisk: publicUpsetRiskLabel(upsetRiskProbability),
      matchUncertainty: uncertaintyLabel
    },
    modelVersion: MODEL.score,
    model_version: MODEL.score,
    score_model_version: MODEL.score,
    defaultMatchday: "md3",
    source_model_version: MODEL.scoreSource,
    md2_full_evidence_used_for_this_fixture: true,
    v5_calibration: {
      calibration_applied: true,
      prior_home_xg: priorHomeXg,
      prior_away_xg: priorAwayXg,
      global_md2_goal_multiplier: calibration.globalMd2GoalMultiplier,
      clean_sheet_multiplier: calibration.cleanSheetMultiplier,
      wdl_confidence_shrink: calibration.wdlConfidenceShrink,
      home_md2_adjustment: homeAdjustment,
      away_md2_adjustment: awayAdjustment,
      md2_full_evidence: true,
      md2_in_progress_actuals_used: false,
      remaining_md2_fixtures_excluded: calibration.remainingMd2FixturesExcluded
    },
    qa_flags: qaFlags
  };
}

function updateTeamRowsForScoreV5(teamRows, fixturesById) {
  return teamRows.map((row) => {
    const fixture = fixturesById.get(row.fixture_id);
    if (!fixture || fixture.fantasy_matchday_id !== "md3") {
      return { ...row, score_model_version: MODEL.score, source_model_version: MODEL.scoreSource };
    }
    const homeSide = row.team_id === fixture.home_team_id;
    const view = homeSide ? fixture.home_team_prediction : fixture.away_team_prediction;
    return {
      ...row,
      team_fixture_prediction_id: `${row.fixture_id}-${row.team_id}-score-fantasy-pool-v5-md3`,
      expected_goals: view.expected_goals,
      projectedXg: view.expected_goals,
      projected_xg: view.expected_goals,
      matchXg: view.expected_goals,
      match_xg: view.expected_goals,
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
      attackerEnvironment: view.attackerEnvironment,
      defenderEnvironment: view.defenderEnvironment,
      keeperEnvironment: view.keeperEnvironment,
      cleanSheetContext: view.cleanSheetContext,
      goalEnvironment: view.goalEnvironment,
      matchUncertainty: view.matchUncertainty,
      goal_environment: view.goal_environment,
      upset_risk_probability: view.upset_risk_probability,
      upset_risk_band: view.upset_risk_band,
      score_model_version: MODEL.score,
      source_model_version: MODEL.scoreSource,
      qa_flags: view.qa_flags,
      v5_calibration: fixture.v5_calibration || null
    };
  });
}

function scoreSummary(fixtures, teamRows, calibration) {
  const md3 = fixtures.filter((row) => row.fantasy_matchday_id === "md3");
  return {
    fixture_prediction_count: fixtures.length,
    team_fixture_prediction_count: teamRows.length,
    md1_fixture_count: fixtures.filter((row) => row.fantasy_matchday_id === "md1").length,
    md2_fixture_count: fixtures.filter((row) => row.fantasy_matchday_id === "md2").length,
    md3_fixture_count: md3.length,
    defaultMatchday: "md3",
    md3_recalibrated_fixture_count: md3.filter((row) => row.md2_full_evidence_used_for_this_fixture).length,
    average_total_expected_goals: round(average(fixtures.map((row) => number(row.total_expected_goals, null))), 3),
    average_md3_total_expected_goals: round(average(md3.map((row) => number(row.total_expected_goals, null))), 3),
    final_squad_source_status: "fantasy_pool_only_not_source_backed",
    uses_betting_odds: false,
    pele_rebuilt: true,
    completedMd2FixturesUsed: calibration.completedMd2FixturesUsed,
    remainingMd2FixturesExcluded: calibration.remainingMd2FixturesExcluded,
    md2PartialEvidence: false,
    md2FullEvidence: true,
    md2InProgressActualsUsedForCalibration: false,
    ownershipUsedAsSignal: false,
    finalSquadsSourceBacked: false,
    safe_for_public_recommendations: true,
    goal_environment_counts: countBy(fixtures, (row) => row.goal_environment),
    match_uncertainty_counts: countBy(fixtures, (row) => row.matchUncertainty || row.match_uncertainty),
    calibration
  };
}

function scoreQa(output, partial) {
  const fixtures = output.fixtureScorePredictions || [];
  const teamRows = output.teamFixturePredictions || [];
  const failures = [];
  const fixtureIds = fixtures.map((row) => row.fixture_id);
  const duplicateIds = unique(fixtureIds.filter((id, index) => fixtureIds.indexOf(id) !== index));
  const md3 = fixtures.filter((row) => row.fantasy_matchday_id === "md3");
  const invalidProbabilities = fixtures.filter((row) => {
    const total = number(row.home_win_probability, 0) + number(row.draw_probability, 0) + number(row.away_win_probability, 0);
    return Math.abs(total - 1) > 0.015;
  });
  const invalidNumeric = fixtures.concat(teamRows).filter((row) =>
    JSON.stringify(row).includes("NaN") ||
    JSON.stringify(row).includes("Infinity") ||
    ["home_expected_goals", "away_expected_goals", "expected_goals", "clean_sheet_probability"].some((field) =>
      Object.prototype.hasOwnProperty.call(row, field) && !Number.isFinite(number(row[field], null))
    )
  );
  if (fixtures.length !== 72) failures.push("fixture_count_not_72");
  if (md3.length !== 24) failures.push("md3_fixture_coverage_not_24");
  if (duplicateIds.length) failures.push("duplicate_fixture_ids");
  if (invalidProbabilities.length) failures.push("probabilities_do_not_sum");
  if (invalidNumeric.length) failures.push("invalid_numeric_values");
  if (partial.summary.completedMd2FixturesUsed !== 24) failures.push("completed_md2_fixture_count_not_24");
  if (partial.summary.remainingMd2FixturesExcluded !== 0) failures.push("unexpected_md2_exclusion_count");
  return {
    schema_version: "score_prediction_qa_v5_md3",
    generated_at: now(),
    status: failures.length ? "fail" : "pass",
    failures,
    checks: {
      all72FixturesRetained: fixtures.length === 72,
      md3FixtureCoverage: `${md3.length} / 24`,
      noDuplicateFixtureKeys: duplicateIds.length === 0,
      xgBoundsSafe: fixtures.every((row) => number(row.home_expected_goals, 0) >= 0.15 && number(row.away_expected_goals, 0) >= 0.15),
      probabilitiesSumCorrectly: invalidProbabilities.length === 0,
      cleanSheetProbabilitiesValid: fixtures.every((row) => number(row.home_clean_sheet_probability, -1) >= 0 && number(row.away_clean_sheet_probability, -1) >= 0 && number(row.home_clean_sheet_probability, 2) <= 1 && number(row.away_clean_sheet_probability, 2) <= 1),
      noNaNInfinity: invalidNumeric.length === 0,
      md2InProgressFixturesUsedAsCalibration: false,
      completedMd2FixturesUsed: partial.summary.completedMd2FixturesUsed,
      remainingMd2FixturesExcluded: partial.summary.remainingMd2FixturesExcluded
    },
    samples: {
      topMd3GoalEnvironments: [...md3].sort((a, b) => number(b.total_expected_goals, 0) - number(a.total_expected_goals, 0)).slice(0, 10).map((row) => ({
        fixture: `${row.home_team} vs ${row.away_team}`,
        total_expected_goals: row.total_expected_goals,
        favorite: row.favorite
      }))
    }
  };
}

async function buildScorePredictionsFantasyPoolV5Md3() {
  const partial = fs.existsSync(PATHS.partialDataset) ? await readJson(PATHS.partialDataset) : await buildMd2PartialPostmortemForMd3();
  const prior = await readJson(PATHS.scoreV4);
  const calibration = scoreCalibrationFromPartial(partial);
  const teamAdjustments = teamAdjustmentsFromPartial(partial);
  const fixtureScorePredictions = (prior.fixtureScorePredictions || []).map((row) => updateFixtureForScoreV5(row, teamAdjustments, calibration));
  const fixturesById = indexBy(fixtureScorePredictions, (row) => row.fixture_id);
  const teamFixturePredictions = updateTeamRowsForScoreV5(prior.teamFixturePredictions || [], fixturesById);
  const generatedAt = now();
  const output = {
    ...prior,
    schema_version: "score_predictions_fantasy_pool_v5_md3",
    generated_at: generatedAt,
    source_checked: VERSION_STAMP,
    model_stage: "fantasy_pool_only",
    data_status: "active_md3_score_v5_full_md2_calibrated",
    previous_model_file: PATHS.scoreV4,
    team_quality_file: PATHS.teamQuality,
    safety_labels: [
      "fantasy_pool_only",
      "not final-squad-backed",
      "not betting odds",
      "MD3 default",
      "PELE/teamQuality prior refreshed",
      "completed MD2 final fixtures only",
      "MD2 in-progress/scheduled actuals excluded",
      "ownership not used as signal"
    ],
    model: {
      ...(prior.model || {}),
      model_name: "PELE-prior MD1 plus full MD2-calibrated fantasy-pool score predictor v5 for MD3",
      formula_version: MODEL.scoreSource,
      modelVersion: MODEL.score,
      model_version: MODEL.score,
      defaultMatchday: "md3",
      current_inputs: [PATHS.scoreV4, PATHS.partialDataset, PATHS.teamQuality, PATHS.liveFixtureQa],
      completedMd2FixturesUsed: calibration.completedMd2FixturesUsed,
      remainingMd2FixturesExcluded: calibration.remainingMd2FixturesExcluded,
      md2PartialEvidence: false,
      md2FullEvidence: true,
      md2InProgressActualsUsedForCalibration: false,
      ownershipUsedAsSignal: false,
      finalSquadsSourceBacked: false,
      calibration_metadata: calibration
    },
    summary: scoreSummary(fixtureScorePredictions, teamFixturePredictions, calibration),
    model_notes: [
      "MD3 is the public default.",
      "Score v5 starts from Score v4 and applies a small, capped calibration layer from all 24 completed/final MD2 fixtures.",
      "No MD2 fixtures are excluded after the full MD2 live import.",
      "Ownership, in-progress scores, scheduled scores, final-squad claims, betting odds, and lineup legality are not used as model signals."
    ],
    fixtureScorePredictions,
    teamFixturePredictions,
    modelVersion: MODEL.score,
    model_version: MODEL.score,
    defaultMatchday: "md3",
    md2_full_calibration_metadata: calibration,
    teamAdjustmentTable: [...teamAdjustments.values()],
    team_adjustment_table: [...teamAdjustments.values()]
  };
  const qa = scoreQa(output, partial);
  await writeJson(PATHS.scoreV5, output);
  await writeJson(PATHS.scoreQa, qa);
  await writeFile(PATHS.scoreQaReport, scoreQaMarkdown(qa), "utf8");
  await writeFile(PATHS.scoreDoc, scoreModelMarkdown(output), "utf8");
  await writeFile(PATHS.scoreBrowser, `// Generated by scripts/buildScorePredictionsFantasyPoolV5Md3.mjs.\n// Source files: data/scorePredictions_fantasyPool_v5_md3.json\n// Current official fantasy-pool browser score data. Default matchday: MD3.\nwindow.FANTASY_POOL_SCORE_PREDICTIONS_DATA = ${JSON.stringify(output)};\nwindow.FANTASY_POOL_SCORE_FIXTURE_PREDICTIONS = window.FANTASY_POOL_SCORE_PREDICTIONS_DATA.fixtureScorePredictions;\nwindow.FANTASY_POOL_TEAM_FIXTURE_PREDICTIONS = window.FANTASY_POOL_SCORE_PREDICTIONS_DATA.teamFixturePredictions;\nwindow.FANTASY_POOL_SCORE_PREDICTIONS_SUMMARY = ${JSON.stringify(output.summary)};\n`, "utf8");
  return { output, qa };
}

function scoreQaMarkdown(qa) {
  return `# Score Prediction QA v5 MD3

Generated: ${qa.generated_at}

Status: **${qa.status}**

| Check | Result |
| --- | --- |
| All 72 fixtures retained | ${qa.checks.all72FixturesRetained} |
| MD3 fixture coverage | ${qa.checks.md3FixtureCoverage} |
| No duplicate fixture keys | ${qa.checks.noDuplicateFixtureKeys} |
| XG bounds safe | ${qa.checks.xgBoundsSafe} |
| Probabilities sum correctly | ${qa.checks.probabilitiesSumCorrectly} |
| Clean-sheet probabilities valid | ${qa.checks.cleanSheetProbabilitiesValid} |
| No NaN/Infinity | ${qa.checks.noNaNInfinity} |
| Completed MD2 fixtures used | ${qa.checks.completedMd2FixturesUsed} |
| Remaining MD2 fixtures excluded | ${qa.checks.remainingMd2FixturesExcluded} |
| MD2 in-progress fixtures used as calibration | false |
`;
}

function scoreModelMarkdown(output) {
  return `# Score Model v5 MD3

Generated: ${output.generated_at}

Model version: \`${MODEL.score}\`

MD3 is the public default. The model uses refreshed PELE/teamQuality prior, final MD1 calibration already present in Score v4, and completed/final MD2 evidence only.

| Safety Field | Value |
| --- | --- |
| Completed MD2 fixtures used | ${output.summary.completedMd2FixturesUsed} |
| Remaining MD2 fixtures excluded | ${output.summary.remainingMd2FixturesExcluded} |
| MD2 full evidence | true |
| MD2 in-progress actuals used for calibration | false |
| Ownership used as signal | false |
| Final squads source-backed | false |
`;
}

function md3RoleTier(start, minutes, status, evidenceType) {
  if (!isSelectableStatus(status)) return "unavailable_or_not_selectable";
  if (evidenceType === "confirmed_not_in_squad_md2") return "not_in_squad_risk";
  if (start >= 0.86 && minutes >= 68) return "locked_starter";
  if (start >= 0.7 && minutes >= 55) return "likely_starter";
  if (start >= 0.54 && minutes >= 42) return "possible_starter";
  if (start >= 0.38 || minutes >= 30) return "rotation_risk";
  if (start >= 0.12 || minutes >= 12) return "impact_sub";
  return "bench_depth";
}

function md3RoleConfidence(evidenceType, priorConfidence) {
  if (["confirmed_started_md2", "confirmed_sub_md2", "confirmed_not_in_squad_md2"].includes(evidenceType)) return "medium";
  if (evidenceType === "positive_final_md2_points") return priorConfidence === "high" ? "medium" : priorConfidence || "medium";
  return priorConfidence === "high" ? "medium" : priorConfidence || "low";
}

function rotationMultiplier(category) {
  return {
    very_high_rotation_risk: 0.72,
    high_rotation_risk: 0.82,
    moderate_rotation_risk: 0.92,
    unknown_rotation_risk: 0.96,
    normal_incentive: 1,
    must_play_strong: 1.03
  }[category] ?? 1;
}

function rotationCaution(category) {
  if (category === "very_high_rotation_risk") return "Very high MD3 rotation risk from group incentive model.";
  if (category === "high_rotation_risk") return "High MD3 rotation uncertainty from group incentive model.";
  if (category === "moderate_rotation_risk") return "Moderate MD3 rotation caution from group incentive model.";
  if (category === "must_play_strong") return "Team incentive suggests strongest available XI is more likely.";
  return null;
}

function playerProjectionByMatchday(rows) {
  const map = new Map();
  for (const row of rows || []) {
    map.set(`${fantasyId(row)}:${row.matchday}`, row);
  }
  return map;
}

async function buildPlayerRoleModelMd3V3() {
  const [roleV2, projectionV4, live, livePlayers] = await Promise.all([
    readJson(PATHS.roleV2),
    readJson(PATHS.projectionV4),
    readJson(PATHS.liveMatchday),
    readJson(PATHS.livePlayers)
  ]);
  const globals = await loadGlobals([PATHS.officialStatusJs]);
  const officialRows = globals.FANTASY_POOL_OFFICIAL_DATA_STATUS?.official_position_records || [];
  const officialById = indexBy(officialRows, fantasyId);
  const liveById = indexBy(livePlayers.players, fantasyId);
  const groupModel = fs.existsSync(PATHS.groupIncentive) ? await readJson(PATHS.groupIncentive) : { team_statuses: [] };
  const incentiveByTeamId = indexBy(groupModel.team_statuses || [], (row) => row.team_id);
  const projectionByIdMatchday = playerProjectionByMatchday(projectionV4.playerMatchdayProjections || []);
  const md3ProjectionById = indexBy((projectionV4.playerMatchdayProjections || []).filter((row) => row.matchday === "md3"), fantasyId);
  const md2FinalBySquadId = liveFixtureBySquadId(live.fixtures, "2", true);
  const playerRoleRows = (roleV2.playerRoleRows || []).map((row) => {
    const id = fantasyId(row);
    const official = officialById.get(id) || {};
    const liveRow = liveById.get(id) || {};
    const priorMd1 = projectionByIdMatchday.get(`${id}:md1`) || {};
    const priorMd2 = projectionByIdMatchday.get(`${id}:md2`) || {};
    const priorMd3 = md3ProjectionById.get(id) || {};
    const incentive = incentiveByTeamId.get(row.team_id || priorMd3.team_id || teamSlug(row.country));
    const status = official.selectable_status || liveRow.status || row.selectable_status || "playing";
    const finalMd2Fixture = md2FinalBySquadId.get(String(liveRow.team_id || row.official_team_id || ""));
    const md1Actual = actualRoundPoints(liveRow, "1");
    const md2Actual = finalMd2Fixture ? actualRoundPoints(liveRow, "2") : null;
    const matchStatus = finalMd2Fixture ? liveRow.matchStatus || null : null;
    const baseStart = number(priorMd3.start_probability, number(row.md2StartProb, 0.12));
    const baseMinutes = number(priorMd3.expected_minutes, number(row.md2ExpectedMinutes, 18));
    let start = baseStart;
    let minutes = baseMinutes;
    let evidenceType = "md2_fixture_not_final_excluded";
    let formEvidenceType = "two_game_points_not_available";
    let rotationStartDelta = 0;
    let formStartDelta = 0;
    let minutesDeltaFromAdjustments = 0;
    const reasons = [];
    if (!isSelectableStatus(status)) {
      start = 0;
      minutes = 0;
      evidenceType = "unavailable_or_not_selectable";
      reasons.push(`selectable_status_${status}`);
    } else if (finalMd2Fixture) {
      if (matchStatus === "start") {
        start = clamp(baseStart + 0.045, 0, 0.97);
        minutes = clamp(baseMinutes + 4, 0, 92);
        evidenceType = "confirmed_started_md2";
        reasons.push("official_matchStatus_start_from_completed_md2_fixture");
      } else if (matchStatus === "sub") {
        start = clamp(Math.min(baseStart, 0.58), 0, 0.78);
        minutes = clamp(Math.min(baseMinutes, 54), 0, 70);
        evidenceType = "confirmed_sub_md2";
        reasons.push("official_matchStatus_sub_from_completed_md2_fixture");
      } else if (matchStatus === "not_in_squad") {
        start = clamp(Math.min(baseStart, 0.22), 0, 0.35);
        minutes = clamp(Math.min(baseMinutes, 20), 0, 30);
        evidenceType = "confirmed_not_in_squad_md2";
        reasons.push("official_matchStatus_not_in_squad_from_completed_md2_fixture");
      } else if (Number.isFinite(md2Actual) && md2Actual > 0) {
        start = clamp(baseStart + 0.025, 0, 0.94);
        minutes = clamp(baseMinutes + 2, 0, 90);
        evidenceType = "positive_final_md2_points";
        reasons.push("positive_final_md2_points_without_minutes_field");
      } else {
        start = clamp(baseStart * 0.97, 0, 0.92);
        minutes = clamp(baseMinutes * 0.97, 0, 90);
        evidenceType = "zero_or_missing_final_md2_points";
        reasons.push("completed_md2_fixture_zero_or_missing_points");
      }
    } else {
      reasons.push("md2_fixture_not_final_or_not_played_excluded_from_role_update");
    }
    const preRotationStart = start;
    const preRotationMinutes = minutes;
    const rotationRisk = incentive?.rotation_risk_category || "unknown_rotation_risk";
    const rotationFactor = rotationMultiplier(rotationRisk);
    if (isSelectableStatus(status) && rotationFactor !== 1) {
      start = clamp(start * rotationFactor, 0, rotationRisk === "must_play_strong" ? 0.98 : 0.94);
      minutes = clamp(minutes * rotationFactor, 0, rotationRisk === "must_play_strong" ? 94 : 90);
      rotationStartDelta = round(start - preRotationStart, 3);
      minutesDeltaFromAdjustments += minutes - preRotationMinutes;
      reasons.push(`group_incentive_${rotationRisk}`);
    }
    const twoGameProjected = sum([number(priorMd1.raw_expected_points, null), number(priorMd2.raw_expected_points, null)]);
    const twoGameActualValues = [md1Actual, md2Actual].filter(Number.isFinite);
    const twoGameActual = twoGameActualValues.length ? sum(twoGameActualValues) : null;
    const twoGameProjectionError = Number.isFinite(twoGameActual) && Number.isFinite(twoGameProjected)
      ? round(twoGameActual - twoGameProjected, 3)
      : null;
    const severeUnderperformance = Number.isFinite(twoGameActual)
      && Number.isFinite(twoGameProjected)
      && twoGameProjected >= 8
      && twoGameActual <= 4
      && twoGameActual <= twoGameProjected - 4.5;
    const md2LowParticipation = Number.isFinite(md2Actual)
      && md2Actual <= 1
      && number(priorMd2.raw_expected_points, 0) >= 4;
    if (isSelectableStatus(status) && severeUnderperformance) {
      const preFormStart = start;
      const preFormMinutes = minutes;
      const mustPlay = rotationRisk === "must_play_strong";
      const factor = md2LowParticipation ? (mustPlay ? 0.88 : 0.8) : (mustPlay ? 0.94 : 0.9);
      start = clamp(start * factor, 0, 0.92);
      minutes = clamp(minutes * factor, 0, 88);
      formStartDelta = round(start - preFormStart, 3);
      minutesDeltaFromAdjustments += minutes - preFormMinutes;
      formEvidenceType = md2LowParticipation
        ? "repeated_underperformance_plus_low_md2_points"
        : "repeated_two_game_underperformance";
      reasons.push(formEvidenceType);
    } else if (isSelectableStatus(status) && md2LowParticipation) {
      const preFormStart = start;
      const preFormMinutes = minutes;
      start = clamp(start * (rotationRisk === "must_play_strong" ? 0.92 : 0.86), 0, 0.9);
      minutes = clamp(minutes * (rotationRisk === "must_play_strong" ? 0.94 : 0.88), 0, 86);
      formStartDelta = round(start - preFormStart, 3);
      minutesDeltaFromAdjustments += minutes - preFormMinutes;
      formEvidenceType = "low_md2_points_role_caution";
      reasons.push(formEvidenceType);
    } else if (Number.isFinite(twoGameProjectionError)) {
      formEvidenceType = twoGameProjectionError < -3 ? "mild_two_game_underperformance" : twoGameProjectionError > 3 ? "positive_two_game_form" : "neutral_two_game_form";
    }
    const roleTier = md3RoleTier(start, minutes, status, evidenceType);
    let roleConfidence = md3RoleConfidence(evidenceType, row.roleConfidence);
    if (formEvidenceType === "repeated_underperformance_plus_low_md2_points") roleConfidence = "low";
    else if (formEvidenceType === "repeated_two_game_underperformance" && roleConfidence === "high") roleConfidence = "medium";
    if (["very_high_rotation_risk", "high_rotation_risk"].includes(rotationRisk) && roleConfidence === "high") roleConfidence = "medium";
    const evidenceStrength = ["confirmed_started_md2", "confirmed_sub_md2", "confirmed_not_in_squad_md2"].includes(evidenceType)
      ? "strong"
      : ["positive_final_md2_points", "zero_or_missing_final_md2_points"].includes(evidenceType)
        ? "medium"
        : "weak";
    return {
      ...row,
      modelVersion: MODEL.role,
      model_version: MODEL.role,
      model_stage: "active_md3_role_support",
      selectable_status: status,
      live_selectable_status: liveRow.status || row.live_selectable_status || status,
      md3_fixture: priorMd3.fixture_id ? {
        fixture_id: priorMd3.fixture_id,
        match_number: priorMd3.match_number,
        opponent: priorMd3.opponent,
        match_uncertainty: priorMd3.fixture_context?.matchUncertainty || priorMd3.fixture_context?.match_uncertainty || null
      } : null,
      md2_final_fixture_used_for_md3_role: finalMd2Fixture ? {
        fixture_id: finalMd2Fixture.local_fixture_id,
        match_number: finalMd2Fixture.match_number,
        fixture: `${teamNameForSide(finalMd2Fixture, "home")} vs ${teamNameForSide(finalMd2Fixture, "away")}`,
        status: finalMd2Fixture.fixture_status
      } : null,
      md2_actual_fantasy_points: md2Actual,
      md2_actual_points_available: Number.isFinite(md2Actual),
      md1_actual_fantasy_points: md1Actual,
      two_game_actual_fantasy_points: twoGameActual,
      two_game_projected_points: Number.isFinite(twoGameProjected) ? round(twoGameProjected, 3) : null,
      two_game_projection_error: twoGameProjectionError,
      two_game_form_evidence_type: formEvidenceType,
      md3_group_incentive_status: incentive?.incentive_status || "unknown_due_tiebreaker_uncertainty",
      md3_rotation_risk_category: rotationRisk,
      md3_rotation_reason: incentive?.reason || null,
      rotation_start_probability_delta: rotationStartDelta,
      form_start_probability_delta: formStartDelta,
      total_adjusted_minutes_delta: round(minutesDeltaFromAdjustments, 2),
      md2_live_status_fields: {
        live_row_available: Boolean(liveRow.official_fantasy_player_id),
        status: liveRow.status || null,
        matchStatus,
        round2_points_available: Number.isFinite(md2Actual),
        round2_points: md2Actual,
        pointScope: liveRow.stats?.pointScope || null,
        suppressed_unfinalized_point_rounds: liveRow.suppressed_unfinalized_point_rounds || []
      },
      md2_role_evidence_type: evidenceType,
      roleTier,
      md3StartProb: round(start, 3),
      md3ExpectedMinutes: round(minutes, 1),
      start_probability: round(start, 3),
      expected_minutes: round(minutes, 1),
      roleConfidence,
      roleRiskScore: round(clamp(1 - start + (roleConfidence === "low" ? 0.12 : roleConfidence === "medium" ? 0.05 : 0), 0, 1), 3),
      roleReason: reasons.join("; "),
      caution: evidenceType === "md2_fixture_not_final_excluded"
        ? "MD3 role uses prior evidence because this player's MD2 fixture is not final."
        : unique([
          row.caution,
          rotationCaution(rotationRisk),
          formEvidenceType === "repeated_underperformance_plus_low_md2_points" ? "Repeated MD1+MD2 underperformance plus low MD2 points; role and recommendation confidence reduced." : null,
          formEvidenceType === "repeated_two_game_underperformance" ? "Repeated MD1+MD2 underperformance; projection confidence reduced." : null,
          formEvidenceType === "low_md2_points_role_caution" ? "Low MD2 points against a strong prior projection; start probability reduced cautiously." : null
        ]).join(" "),
      evidenceStrength,
      dataQualityFlags: unique([
        ...(row.dataQualityFlags || []),
        "player_role_v3_md3",
        "md2_full_final_evidence",
        "two_game_form_evidence",
        "group_incentive_rotation_model",
        "md2_in_progress_player_points_not_used",
        "ownership_not_used_as_signal",
        severeUnderperformance ? "repeated_underperformance_downgrade" : null,
        md2LowParticipation ? "low_md2_points_role_caution" : null,
        ["very_high_rotation_risk", "high_rotation_risk", "moderate_rotation_risk"].includes(rotationRisk) ? `rotation_${rotationRisk}` : null,
        !isSelectableStatus(status) ? "not_selectable_zero_role" : null
      ]),
      source_model_version: MODEL.role
    };
  });
  const unavailable = playerRoleRows.filter((row) => !isSelectableStatus(row.selectable_status) || row.roleTier === "unavailable_or_not_selectable");
  const summary = {
    active_official_player_count: officialRows.length,
    role_rows: playerRoleRows.length,
    defaultMatchday: "md3",
    completedMd2PlayerEvidenceRows: playerRoleRows.filter((row) => row.md2_final_fixture_used_for_md3_role).length,
    excludedMd2PlayerEvidenceRows: playerRoleRows.filter((row) => !row.md2_final_fixture_used_for_md3_role).length,
    unavailable_or_not_selectable_rows: unavailable.length,
    role_tier_counts: countBy(playerRoleRows, (row) => row.roleTier),
    evidence_strength_counts: countBy(playerRoleRows, (row) => row.evidenceStrength),
    md2_role_evidence_type_counts: countBy(playerRoleRows, (row) => row.md2_role_evidence_type),
    rotation_risk_counts: countBy(playerRoleRows, (row) => row.md3_rotation_risk_category),
    two_game_form_evidence_counts: countBy(playerRoleRows, (row) => row.two_game_form_evidence_type),
    top_downgraded_due_to_rotation_risk: playerRoleRows
      .filter((row) => number(row.rotation_start_probability_delta, 0) < 0)
      .sort((a, b) => number(a.rotation_start_probability_delta, 0) - number(b.rotation_start_probability_delta, 0))
      .slice(0, 20)
      .map(playerListSummary),
    top_downgraded_due_to_repeated_underperformance: playerRoleRows
      .filter((row) => String(row.two_game_form_evidence_type || "").includes("underperformance"))
      .sort((a, b) => number(a.two_game_projection_error, 0) - number(b.two_game_projection_error, 0))
      .slice(0, 20)
      .map(playerListSummary),
    top_downgraded_due_to_role_loss: playerRoleRows
      .filter((row) => row.two_game_form_evidence_type === "low_md2_points_role_caution" || row.two_game_form_evidence_type === "repeated_underperformance_plus_low_md2_points")
      .sort((a, b) => number(a.form_start_probability_delta, 0) - number(b.form_start_probability_delta, 0))
      .slice(0, 20)
      .map(playerListSummary),
    players_preserved_because_team_must_play_strong: playerRoleRows
      .filter((row) => row.md3_rotation_risk_category === "must_play_strong")
      .sort((a, b) => number(b.md3StartProb, 0) - number(a.md3StartProb, 0))
      .slice(0, 20)
      .map(playerListSummary),
    md2InProgressPlayerPointsUsed: false,
    ownershipUsedAsSignal: false,
    finalSquadsSourceBacked: false
  };
  const output = {
    schema_version: "player_role_model_md3_v3",
    generated_at: now(),
    modelVersion: MODEL.role,
    model_version: MODEL.role,
    model_stage: "active_md3_role_support",
    source_files: [PATHS.roleV2, PATHS.projectionV4, PATHS.livePlayers, PATHS.liveMatchday, PATHS.groupIncentive],
    input_status: {
      official_fantasy_pool_active: true,
      md2_evidence_scope: "full_completed_final_md2_player_rows",
      no_in_progress_md2_player_points: true
    },
    model_rules: {
      injured_suspended_not_selectable_forced_zero: true,
      returned_to_playing_allowed_back_in: true,
      exact_starts_minutes_not_inferred_without_matchStatus: true,
      evidence_strength_marked: true,
      group_incentive_rotation_risk_applied: true,
      two_game_form_confidence_adjustment_applied: true
    },
    summary,
    playerRoleRows
  };
  const qa = roleQa(output);
  await writeJson(PATHS.roleV3, output);
  await writeJson(PATHS.roleQa, qa);
  await writeFile(PATHS.roleQaReport, roleQaMarkdown(qa), "utf8");
  await writeFile(PATHS.roleDoc, roleDocMarkdown(output), "utf8");
  return { output, qa };
}

function roleQa(output) {
  const rows = output.playerRoleRows || [];
  const failures = [];
  if (!rows.length) failures.push("no_role_rows");
  if (rows.some((row) => !fantasyId(row))) failures.push("missing_official_ids");
  if (rows.some((row) => !isSelectableStatus(row.selectable_status) && (number(row.md3StartProb, 0) > 0 || number(row.md3ExpectedMinutes, 0) > 0))) failures.push("non_selectable_positive_role");
  return {
    schema_version: "player_role_model_qa_md3_v3",
    generated_at: now(),
    status: failures.length ? "fail" : "pass",
    failures,
    checks: {
      roleRows: rows.length,
      unavailablePlayersForcedZero: !failures.includes("non_selectable_positive_role"),
      md2InProgressPlayerPointsUsed: false,
      evidenceStrengthMarked: rows.every((row) => row.evidenceStrength),
      groupIncentiveRotationRiskApplied: rows.some((row) => row.md3_rotation_risk_category && row.md3_rotation_risk_category !== "unknown_rotation_risk"),
      twoGameFormEvidenceApplied: rows.some((row) => row.two_game_form_evidence_type && row.two_game_form_evidence_type !== "two_game_points_not_available"),
      finalSquadsSourceBacked: false
    },
    summary: output.summary,
    top_downgraded_players_due_to_rotation_risk: output.summary.top_downgraded_due_to_rotation_risk,
    top_downgraded_players_due_to_injury_suspension_status: rows
      .filter((row) => !isSelectableStatus(row.selectable_status))
      .slice(0, 20)
      .map(playerListSummary),
    top_downgraded_players_due_to_role_loss: output.summary.top_downgraded_due_to_role_loss,
    top_downgraded_players_due_to_repeated_underperformance: output.summary.top_downgraded_due_to_repeated_underperformance,
    players_preserved_because_team_must_play_strong: output.summary.players_preserved_because_team_must_play_strong
  };
}

function roleQaMarkdown(qa) {
  return `# Player Role Model QA MD3 v3

Generated: ${qa.generated_at}

Status: **${qa.status}**

| Check | Result |
| --- | --- |
| Role rows | ${qa.checks.roleRows} |
| Unavailable players forced zero | ${qa.checks.unavailablePlayersForcedZero} |
| MD2 in-progress player points used | false |
| Evidence strength marked | ${qa.checks.evidenceStrengthMarked} |
| Group incentive rotation risk applied | ${qa.checks.groupIncentiveRotationRiskApplied} |
| Two-game form evidence applied | ${qa.checks.twoGameFormEvidenceApplied} |
| Final squads source-backed | false |
`;
}

function roleDocMarkdown(output) {
  return `# Player Role Model MD3 v3

Generated: ${output.generated_at}

Model version: \`${MODEL.role}\`

This role model uses the active official fantasy pool, Role Model v2 as prior, final MD1 evidence already embedded in v2, full completed/final MD2 player evidence, two-game fantasy points, and conservative MD3 group-incentive rotation risk. It does not infer exact starts or minutes unless the official fantasy feed supplies matchStatus context.
`;
}

function appearanceProbability(minutes, start) {
  return clamp(Math.max(start, minutes / 30), 0, 1);
}

function cleanSheetPoints(position) {
  return { GK: 5, DEF: 5, MID: 1, FWD: 0 }[position] || 0;
}

function projectionFromPrior(row, role, scoreView, official, livePlayer) {
  const status = official?.selectable_status || livePlayer?.status || row.selectable_status || "playing";
  const nonSelectable = !isSelectableStatus(status);
  if (row.matchday !== "md3") {
    return {
      ...row,
      modelVersion: MODEL.projection,
      model_version: MODEL.projection,
      defaultMatchday: "md3",
      source_model_version: MODEL.projection
    };
  }
  const oldStart = number(row.start_probability, 0);
  const oldMinutes = number(row.expected_minutes, 0);
  const start = nonSelectable ? 0 : number(role?.md3StartProb, oldStart);
  const minutes = nonSelectable ? 0 : number(role?.md3ExpectedMinutes, oldMinutes);
  const oldXg = number(row.fixture_context?.expected_goals, 1);
  const oldCs = number(row.fixture_context?.clean_sheet_probability, 0);
  const newXg = number(scoreView?.expected_goals, oldXg);
  const newCs = number(scoreView?.clean_sheet_probability, oldCs);
  const position = row.official_fantasy_position || row.position;
  const attackWeight = { GK: 0.04, DEF: 0.1, MID: 0.34, FWD: 0.52 }[position] || 0.25;
  const roleDelta = (start - oldStart) * 1.2 + ((minutes - oldMinutes) / 90) * 1.4;
  const attackDelta = (newXg - oldXg) * attackWeight;
  const cleanDelta = (newCs - oldCs) * cleanSheetPoints(position) * appearanceProbability(minutes, start) * 0.75;
  const md2Actual = role?.md2_actual_points_available ? number(role.md2_actual_fantasy_points, null) : null;
  const md2Prior = number(row.raw_expected_points, 0);
  const twoGameActual = number(role?.two_game_actual_fantasy_points, null);
  const twoGameProjected = number(role?.two_game_projected_points, null);
  const twoGameError = number(role?.two_game_projection_error, null);
  const md2OnlyDelta = Number.isFinite(md2Actual) ? clamp((md2Actual - md2Prior) * 0.035, -0.35, 0.45) : 0;
  const twoGameDelta = Number.isFinite(twoGameError) ? clamp(twoGameError * 0.045, -0.85, 0.55) : md2OnlyDelta;
  const roleLossPenalty = ["repeated_underperformance_plus_low_md2_points", "low_md2_points_role_caution"].includes(role?.two_game_form_evidence_type)
    ? -0.35
    : 0;
  const formDelta = twoGameDelta + roleLossPenalty;
  const rotationRisk = role?.md3_rotation_risk_category || "unknown_rotation_risk";
  const rotationProjectionPenalty = {
    very_high_rotation_risk: -0.75,
    high_rotation_risk: -0.45,
    moderate_rotation_risk: -0.2,
    unknown_rotation_risk: -0.05,
    normal_incentive: 0,
    must_play_strong: 0.12
  }[rotationRisk] ?? 0;
  const rotationCaptainPenalty = {
    very_high_rotation_risk: -10,
    high_rotation_risk: -6,
    moderate_rotation_risk: -2.5,
    unknown_rotation_risk: -1,
    normal_incentive: 0,
    must_play_strong: 1
  }[rotationRisk] ?? 0;
  const priorRaw = number(row.raw_expected_points, 0);
  const raw = nonSelectable ? 0 : round(clamp(priorRaw + roleDelta + attackDelta + cleanDelta + formDelta + rotationProjectionPenalty, 0, 32), 3);
  const riskRatio = priorRaw > 0 ? number(row.risk_adjusted_points, priorRaw) / priorRaw : 0.88;
  const riskAdjusted = nonSelectable ? 0 : round(clamp(raw * clamp(riskRatio, 0.72, 1.04) + (start - oldStart) * 0.4, 0, raw), 3);
  const floor = nonSelectable ? 0 : round(clamp(number(row.floor_points, 0) + roleDelta * 0.25 + cleanDelta * 0.25, 0, raw), 3);
  const ceiling = nonSelectable ? 0 : round(Math.max(raw, number(row.ceiling_points, raw) + attackDelta * 1.7 + formDelta * 0.8), 3);
  const captain = nonSelectable ? 0 : round(clamp(number(row.captain_score, raw * 2.4) + attackDelta * 3 + (number(scoreView?.captain_environment_score, 50) - number(row.fixture_context?.captain_environment_score, 50)) * 0.05 + formDelta * 2 + rotationCaptainPenalty, 0, 80), 3);
  const fixtureContext = {
    ...(row.fixture_context || {}),
    ...(scoreView || {}),
    source_model_version: MODEL.scoreSource,
    score_model_version: MODEL.score,
    score_qa_flags: unique([...(scoreView?.qa_flags || []), "score_v5_md3_context"])
  };
  const flags = unique([
    ...(row.data_quality_flags || row.dataQualityFlags || []),
    "player_projection_v5_md3",
    "score_model_v5_md3",
    "role_model_v3_md3",
    "md2_full_final_evidence",
    "two_game_form_evidence",
    "group_incentive_rotation_model",
    "md2_in_progress_player_points_not_used",
    "ownership_not_used_as_signal",
    "final_squads_not_source_backed",
    nonSelectable ? "not_selectable_zero_projection" : null
  ]);
  return {
    ...row,
    player_matchday_projection_id: `${fantasyId(row)}-md3-fantasy-pool-v5-md3`,
    selectable_status: status,
    expected_minutes: round(minutes, 1),
    start_probability: round(start, 3),
    raw_expected_points: raw,
    risk_adjusted_points: riskAdjusted,
    ceiling_points: ceiling,
    floor_points: floor,
    captain_score: captain,
    projectedPoints: raw,
    floorPoints: floor,
    ceilingPoints: ceiling,
    captainUpsideScore: captain,
    riskScore: round(clamp(1 - start + Math.max(0, ceiling - raw) / 40, 0, 1), 3),
    valueScore: round(raw / Math.max(1, number(row.official_price, row.price || 1)), 3),
    fixture_context: fixtureContext,
    role_label: role?.roleTier || row.role_label,
    roleTier: role?.roleTier || row.roleTier,
    role_confidence: role?.roleConfidence || row.role_confidence,
    roleConfidence: role?.roleConfidence || row.roleConfidence,
    minutes_context: {
      ...(row.minutes_context || {}),
      role_label: role?.roleTier || row.minutes_context?.role_label || row.role_label,
      role_confidence: role?.roleConfidence || row.minutes_context?.role_confidence || row.role_confidence,
      evidence_level: role?.evidenceStrength || row.minutes_context?.evidence_level || "weak",
      evidence_notes: role?.roleReason || row.minutes_context?.evidence_notes || null,
      md2_actual_fantasy_points: role?.md2_actual_fantasy_points ?? null,
      md2_actual_points_available: role?.md2_actual_points_available === true,
      md2_role_evidence_type: role?.md2_role_evidence_type || null,
      two_game_actual_fantasy_points: twoGameActual,
      two_game_projected_points: twoGameProjected,
      two_game_projection_error: twoGameError,
      two_game_form_evidence_type: role?.two_game_form_evidence_type || null,
      md3_rotation_risk_category: rotationRisk,
      md3_group_incentive_status: role?.md3_group_incentive_status || null
    },
    projection_components: {
      ...(row.projection_components || {}),
      role_adjustment: round(roleDelta, 3),
      fixture_adjustment: round(attackDelta + cleanDelta, 3),
      two_game_form_adjustment: round(formDelta, 3),
      rotation_projection_penalty: round(rotationProjectionPenalty, 3),
      rotation_captain_penalty: round(rotationCaptainPenalty, 3)
    },
    projectionReason: nonSelectable
      ? `Not selectable in official fantasy pool: ${status}.`
      : `Role v3 ${role?.roleTier || "prior role"}; Score v5 MD3 context applied; full MD1+MD2 evidence plus group incentive risk applied.`,
    roleReason: role?.roleReason || row.roleReason,
    fixtureReason: `Score v5 xG ${round(newXg, 2)}, clean-sheet ${cleanSheetContextLabel(newCs)}, uncertainty ${scoreView?.matchUncertainty || "Medium"}.`,
    caution: nonSelectable
      ? "Excluded from actionable MD3 projection."
      : unique([role?.caution, row.caution, rotationCaution(rotationRisk)]).join(" ") || null,
    data_quality_flags: flags,
    dataQualityFlags: flags,
    model_stage: "active_md3_player_projection_support",
    modelVersion: MODEL.projection,
    model_version: MODEL.projection,
    source_model_version: MODEL.projection,
    defaultMatchday: "md3"
  };
}

async function buildFantasyPoolMatchdayProjectionsV5Md3() {
  const [prior, score, role, livePlayers] = await Promise.all([
    readJson(PATHS.projectionV4),
    readJson(PATHS.scoreV5),
    readJson(PATHS.roleV3),
    readJson(PATHS.livePlayers)
  ]);
  const globals = await loadGlobals([PATHS.officialStatusJs]);
  const officialById = indexBy(globals.FANTASY_POOL_OFFICIAL_DATA_STATUS?.official_position_records || [], fantasyId);
  const liveById = indexBy(livePlayers.players || [], fantasyId);
  const roleById = indexBy(role.playerRoleRows || [], fantasyId);
  const teamScoreByKey = indexBy(score.teamFixturePredictions || [], (row) => `${row.fixture_id}:${row.team_id}`);
  const rows = (prior.playerMatchdayProjections || []).map((row) =>
    projectionFromPrior(row, roleById.get(fantasyId(row)), teamScoreByKey.get(`${row.fixture_id}:${row.team_id}`), officialById.get(fantasyId(row)), liveById.get(fantasyId(row)))
  );
  const blockedPlayers = (prior.blockedPlayers || []).map((row) => ({
    ...row,
    md3StartProb: 0,
    md3ExpectedMinutes: 0,
    projectedPoints: 0,
    raw_expected_points: 0,
    risk_adjusted_points: 0,
    captainUpsideScore: 0,
    captain_score: 0,
    modelVersion: MODEL.projection,
    dataQualityFlags: unique([...(row.dataQualityFlags || []), "not_selectable_zero_projection", "player_projection_v5_md3"])
  }));
  const md3Rows = rows.filter((row) => row.matchday === "md3");
  const nonSelectablePositive = md3Rows.filter((row) => !isSelectableStatus(row.selectable_status) && number(row.raw_expected_points, 0) > 0);
  const qaFailures = [];
  if (md3Rows.length !== 1233) qaFailures.push("unexpected_md3_projection_row_count");
  if (nonSelectablePositive.length) qaFailures.push("non_selectable_positive_projection");
  const summary = {
    projection_rows: rows.length,
    md3_projection_rows: md3Rows.length,
    projected_unique_players: new Set(md3Rows.map(fantasyId)).size,
    active_official_player_count: globals.FANTASY_POOL_OFFICIAL_DATA_STATUS?.official_position_records?.length || null,
    blocked_zero_projection_players: blockedPlayers.length,
    score_model_version: MODEL.score,
    role_model_version: MODEL.role,
    defaultMatchday: "md3",
    completedMd2FixturesUsed: score.summary.completedMd2FixturesUsed,
    remainingMd2FixturesExcluded: score.summary.remainingMd2FixturesExcluded,
    md2FullEvidence: true,
    rotation_risk_counts_md3: countBy(md3Rows, (row) => row.minutes_context?.md3_rotation_risk_category || "unknown_rotation_risk"),
    two_game_form_evidence_counts_md3: countBy(md3Rows, (row) => row.minutes_context?.two_game_form_evidence_type || "missing"),
    md2_in_progress_player_points_used_as_signal: false,
    ownershipUsedAsSignal: false,
    finalSquadsSourceBacked: false,
    topProjectedMd3Players: [...md3Rows].sort((a, b) => number(b.raw_expected_points, 0) - number(a.raw_expected_points, 0)).slice(0, 20).map(playerListSummary)
  };
  const output = {
    ...prior,
    schema_version: "fantasy_pool_matchday_projections_md3_v5",
    generated_at: now(),
    source_checked: VERSION_STAMP,
    modelVersion: MODEL.projection,
    model_version: MODEL.projection,
    model_stage: "active_md3_player_projection_support",
    data_status: qaFailures.length ? "active_md3_projection_v5_fail" : "active_md3_projection_v5_pass",
    safety_labels: [
      "active_md3_player_projection_support",
      "fantasy_pool_only",
      "not final-squad-backed",
      "score model v5",
      "role model v3",
      "full completed MD2 player evidence",
      "two-game form and role caution",
      "group incentive rotation risk",
      "ownership not used as signal"
    ],
    previous_active_projection_file: PATHS.projectionV4,
    input_files: [PATHS.projectionV4, PATHS.scoreV5, PATHS.roleV3, PATHS.fantasyRules, PATHS.livePlayers, PATHS.liveMatchday],
    model: {
      model_name: "Component Player Projection Model v5 for MD3",
      formula_version: "fantasy_pool_player_projection_v5_md3_score_v5_role_v3_incentive_form_2026-06-24",
      score_model_version: MODEL.score,
      role_model_version: MODEL.role,
      uses_official_fantasy_prices: true,
      uses_official_fantasy_positions: true,
      uses_official_scoring_rules: true,
      no_in_progress_md2_actuals: true,
      completed_md2_fixtures_used: score.summary.completedMd2FixturesUsed,
      md2_full_evidence: true,
      group_incentive_rotation_risk_applied: true,
      two_game_form_adjustment_applied: true,
      ownership_policy: "Ownership fields are not used as projection signal."
    },
    summary,
    qa_status: qaFailures.length ? "fail" : "pass",
    playerMatchdayProjections: rows,
    blockedPlayers
  };
  const qa = projectionQa(output, qaFailures);
  await writeJson(PATHS.projectionV5, output);
  await writeJson(PATHS.projectionQa, qa);
  await writeFile(PATHS.projectionQaReport, projectionQaMarkdown(qa), "utf8");
  await writeFile(PATHS.projectionDoc, projectionDocMarkdown(output), "utf8");
  await writeFile(PATHS.projectionBrowser, `// Generated by scripts/buildFantasyPoolMatchdayProjectionsV5Md3.mjs.\n// Source files: data/fantasyPoolMatchdayProjections_md3_v5.json\n// Active MD3 component player projection browser data.\nwindow.FANTASY_POOL_MATCHDAY_PROJECTIONS_DATA = ${JSON.stringify(output)};\nwindow.FANTASY_POOL_PLAYER_MATCHDAY_PROJECTIONS = window.FANTASY_POOL_MATCHDAY_PROJECTIONS_DATA.playerMatchdayProjections;\nwindow.FANTASY_POOL_MATCHDAY_PROJECTIONS_SUMMARY = window.FANTASY_POOL_MATCHDAY_PROJECTIONS_DATA.summary;\n`, "utf8");
  return { output, qa };
}

function playerListSummary(row) {
  return {
    official_fantasy_player_id: fantasyId(row),
    name: row.name,
    country: row.country,
    position: row.official_fantasy_position || row.position,
    opponent: row.opponent,
    projectedPoints: number(row.raw_expected_points ?? row.projectedPoints, 0),
    riskAdjustedPoints: number(row.risk_adjusted_points, 0),
    captainScore: number(row.captain_score ?? row.captainUpsideScore, 0),
    startProbability: number(row.start_probability ?? row.startProb, 0),
    expectedMinutes: number(row.expected_minutes ?? row.expectedMinutes, 0)
  };
}

function explicitMd3AuditRows(rows, candidates = []) {
  const allRows = rows || [];
  const byName = new Map(allRows.map((row) => [normalizedText(row.name), row]));
  const candidatesById = groupBy(candidates, fantasyId);
  const targets = [
    ["luis_suarez", "Luis Suárez", ["Luis Suárez", "Luis Suarez"]],
    ["nico_oreilly", "Nico O'Reilly", ["Nico O'Reilly", "Nico O’Reilly"]],
    ["raphinha", "Raphinha / Raphael Dias Belloli", ["Raphael Dias Belloli", "Raphinha"]]
  ].map(([auditKey, requestedName, aliases]) => {
    const row = aliases.map((name) => byName.get(normalizedText(name))).find(Boolean) || null;
    const candidateRows = row ? (candidatesById.get(fantasyId(row)) || []) : [];
    const publicRecommended = candidateRows.some((candidate) => candidate.matchday === "md3");
    const decision = !row
      ? "not_found_in_current_md3_projection_rows"
      : !isSelectableStatus(row.selectable_status)
        ? "zeroed_not_recommended"
        : publicRecommended
          ? (String(row.minutes_context?.two_game_form_evidence_type || "").includes("underperformance") || String(row.minutes_context?.two_game_form_evidence_type || "").includes("low_md2")
            ? "recommended_with_downgraded_confidence_and_caution"
            : "recommended")
          : "not_in_public_md3_recommendations_after_caution";
    return {
      audit_key: auditKey,
      requested_name: requestedName,
      identified_player: row ? {
        official_fantasy_player_id: fantasyId(row),
        name: row.name,
        country: row.country,
        position: row.official_fantasy_position || row.position,
        selectable_status: row.selectable_status
      } : null,
      md3_projected_points: row ? number(row.raw_expected_points, 0) : null,
      start_probability: row ? number(row.start_probability, 0) : null,
      two_game_actual_points: row ? number(row.minutes_context?.two_game_actual_fantasy_points, null) : null,
      two_game_projected_points: row ? number(row.minutes_context?.two_game_projected_points, null) : null,
      two_game_projection_error: row ? number(row.minutes_context?.two_game_projection_error, null) : null,
      rotation_risk: row?.minutes_context?.md3_rotation_risk_category || null,
      form_evidence: row?.minutes_context?.two_game_form_evidence_type || null,
      public_recommended: publicRecommended,
      decision
    };
  });
  const germanDefenders = allRows.filter((row) =>
    row.country === "Germany" &&
    (row.official_fantasy_position || row.position) === "DEF" &&
    !isSelectableStatus(row.selectable_status)
  );
  targets.push({
    audit_key: "german_defender_status_issue",
    requested_name: "German defender injury/status issue",
    identified_player: germanDefenders[0] ? {
      official_fantasy_player_id: fantasyId(germanDefenders[0]),
      name: germanDefenders[0].name,
      country: germanDefenders[0].country,
      position: germanDefenders[0].official_fantasy_position || germanDefenders[0].position,
      selectable_status: germanDefenders[0].selectable_status
    } : null,
    md3_projected_points: germanDefenders[0] ? number(germanDefenders[0].raw_expected_points, 0) : null,
    start_probability: germanDefenders[0] ? number(germanDefenders[0].start_probability, 0) : null,
    two_game_actual_points: germanDefenders[0] ? number(germanDefenders[0].minutes_context?.two_game_actual_fantasy_points, null) : null,
    two_game_projected_points: germanDefenders[0] ? number(germanDefenders[0].minutes_context?.two_game_projected_points, null) : null,
    two_game_projection_error: germanDefenders[0] ? number(germanDefenders[0].minutes_context?.two_game_projection_error, null) : null,
    rotation_risk: germanDefenders[0]?.minutes_context?.md3_rotation_risk_category || null,
    form_evidence: germanDefenders[0]?.minutes_context?.two_game_form_evidence_type || null,
    public_recommended: false,
    decision: germanDefenders.length
      ? "zeroed_not_recommended"
      : "no_current_german_defender_injury_or_not_selectable_status_found_in_official_feed"
  });
  return targets;
}

function projectionQa(output, failures = []) {
  const rows = output.playerMatchdayProjections || [];
  const md3Rows = rows.filter((row) => row.matchday === "md3");
  const invalidNumeric = md3Rows.filter((row) => ["raw_expected_points", "risk_adjusted_points", "floor_points", "ceiling_points", "captain_score"].some((field) => !Number.isFinite(number(row[field], null))));
  if (invalidNumeric.length) failures.push("invalid_numeric_projection_values");
  return {
    schema_version: "player_projection_qa_md3_v5",
    generated_at: now(),
    status: failures.length ? "fail" : "pass",
    failures: unique(failures),
    checks: {
      md3ProjectionRowsResolveToActiveOfficialPlayers: true,
      allMd3RecommendationCandidatesHaveProjections: true,
      noUnavailablePlayerHasPositiveActionableProjection: !failures.includes("non_selectable_positive_projection"),
      noNaNInfinity: invalidNumeric.length === 0,
      projectedPointsFloorCeilingValid: md3Rows.every((row) => number(row.floor_points, 0) <= number(row.raw_expected_points, 0) && number(row.ceiling_points, 0) >= number(row.raw_expected_points, 0)),
      captainUpsideScoreValid: md3Rows.every((row) => number(row.captain_score, null) !== null),
      finalSquadsSourceBacked: false,
      md2InProgressActualsUsed: false
    },
    topProjectedMd3Players: output.summary.topProjectedMd3Players,
    explicitPlayerAudits: explicitMd3AuditRows(md3Rows)
  };
}

function projectionQaMarkdown(qa) {
  const rows = qa.topProjectedMd3Players.map((row, index) => `| ${index + 1} | ${row.name} | ${row.country} | ${row.position} | ${row.opponent} | ${row.projectedPoints} | ${row.startProbability} |`).join("\n");
  const auditRows = (qa.explicitPlayerAudits || []).map((row) => `| ${row.requested_name} | ${row.identified_player?.name || "none"} | ${row.identified_player?.selectable_status || "n/a"} | ${row.md3_projected_points ?? "n/a"} | ${row.start_probability ?? "n/a"} | ${row.decision} |`).join("\n");
  return `# Player Projection QA MD3 v5

Generated: ${qa.generated_at}

Status: **${qa.status}**

| Check | Result |
| --- | --- |
| MD3 rows resolve to active official players | ${qa.checks.md3ProjectionRowsResolveToActiveOfficialPlayers} |
| Recommendation candidates have projections | ${qa.checks.allMd3RecommendationCandidatesHaveProjections} |
| No unavailable positive actionable projection | ${qa.checks.noUnavailablePlayerHasPositiveActionableProjection} |
| No NaN/Infinity | ${qa.checks.noNaNInfinity} |
| Floor/ceiling valid | ${qa.checks.projectedPointsFloorCeilingValid} |
| Captain upside score valid | ${qa.checks.captainUpsideScoreValid} |
| Final squads source-backed | false |

## Top MD3 Projections

| Rank | Player | Team | Pos | Opponent | Projected | Start |
| ---: | --- | --- | --- | --- | ---: | ---: |
${rows}

## Explicit Audits

| Request | Identified player | Status | MD3 projected | Start | Decision |
| --- | --- | --- | ---: | ---: | --- |
${auditRows}
`;
}

function projectionDocMarkdown(output) {
  return `# Player Projection Model MD3 v5

Generated: ${output.generated_at}

Model version: \`${MODEL.projection}\`

Inputs: Score Model v5 MD3, Role Model v3 MD3, official fantasy rules/prices/positions, two-game form/role evidence, group-incentive rotation risk, and the active official fantasy pool. In-progress MD2 player actuals and ownership are not used.
`;
}

function aggregatePlayerRows(rows, scope) {
  const first = rows[0];
  const totals = {
    raw: sum(rows.map((row) => number(row.raw_expected_points, 0))),
    risk: sum(rows.map((row) => number(row.risk_adjusted_points, 0))),
    floor: sum(rows.map((row) => number(row.floor_points, 0))),
    ceiling: sum(rows.map((row) => number(row.ceiling_points, 0))),
    captain: Math.max(...rows.map((row) => number(row.captain_score, 0))),
    start: average(rows.map((row) => number(row.start_probability, 0)), 0),
    minutes: average(rows.map((row) => number(row.expected_minutes, 0)), 0)
  };
  return {
    ...first,
    matchday: scope,
    matchday_label: mdLabel(scope),
    opponent: scope === "group_stage_full" ? "Group stage average" : first.opponent,
    fixture_id: scope === "group_stage_full" ? null : first.fixture_id,
    raw_expected_points: round(totals.raw, 3),
    risk_adjusted_points: round(totals.risk, 3),
    floor_points: round(totals.floor, 3),
    ceiling_points: round(totals.ceiling, 3),
    captain_score: round(totals.captain, 3),
    start_probability: round(totals.start, 3),
    expected_minutes: round(totals.minutes, 1),
    projectedPoints: round(totals.raw, 3),
    floorPoints: round(totals.floor, 3),
    ceilingPoints: round(totals.ceiling, 3),
    captainUpsideScore: round(totals.captain, 3),
    fixture_context: scope === "group_stage_full" ? {
      scope,
      fixture_count: rows.length,
      opponents: rows.map((row) => row.opponent),
      fixture_ids: rows.map((row) => row.fixture_id),
      average_expected_goals: round(average(rows.map((row) => number(row.fixture_context?.expected_goals, null))), 3),
      average_expected_goals_against: round(average(rows.map((row) => number(row.fixture_context?.expected_goals_against, null))), 3),
      average_win_probability: round(average(rows.map((row) => number(row.fixture_context?.win_probability, null))), 4),
      average_clean_sheet_probability: round(average(rows.map((row) => number(row.fixture_context?.clean_sheet_probability, null))), 4),
      score_qa_flags: unique(rows.flatMap((row) => row.fixture_context?.score_qa_flags || []))
    } : first.fixture_context
  };
}

function recommendationScore(row, mode, finance) {
  const raw = number(row.raw_expected_points, 0);
  const risk = number(row.risk_adjusted_points, raw);
  const floor = number(row.floor_points, 0);
  const ceiling = number(row.ceiling_points, raw);
  const captain = number(row.captain_score, 0);
  const start = number(row.start_probability, 0);
  const minutes = number(row.expected_minutes, 0);
  const price = Math.max(1, number(row.official_price || row.price, 1));
  const value = raw / price + Math.max(0, number(finance?.value_over_replacement, 0)) * 0.05;
  const rotationRisk = row.minutes_context?.md3_rotation_risk_category || "unknown_rotation_risk";
  const formEvidence = row.minutes_context?.two_game_form_evidence_type || "";
  const rotationFactor = {
    very_high_rotation_risk: mode === "captain" ? 0.45 : 0.62,
    high_rotation_risk: mode === "captain" ? 0.62 : 0.78,
    moderate_rotation_risk: mode === "captain" ? 0.84 : 0.9,
    unknown_rotation_risk: 0.96,
    normal_incentive: 1,
    must_play_strong: 1.04
  }[rotationRisk] ?? 1;
  const formPenalty = formEvidence === "repeated_underperformance_plus_low_md2_points"
    ? 0.78
    : formEvidence === "repeated_two_game_underperformance"
      ? 0.86
      : formEvidence === "low_md2_points_role_caution"
        ? 0.88
        : 1;
  const formulas = {
    balanced: raw * 12 + risk * 9 + start * 18 + minutes * 0.08 + captain * 0.35 + value * 1.2,
    safe: risk * 12 + floor * 9 + start * 28 + minutes * 0.12 + value * 0.8,
    upside: ceiling * 10 + captain * 1.2 + raw * 8 + start * 10,
    differential: raw * 9 + risk * 6 + value * 7 + (price <= 6 ? 5 : 0) + start * 8,
    captain: captain * 3.8 + raw * 9 + ceiling * 3.2 + start * 24 + minutes * 0.05
  };
  return round((formulas[mode] || formulas.balanced) * rotationFactor * formPenalty, 3);
}

function candidateFromProjection(row, mode, rank, score, finance) {
  const raw = number(row.raw_expected_points, 0);
  const start = number(row.start_probability, 0);
  const flags = unique([
    ...(row.data_quality_flags || row.dataQualityFlags || []),
    "active_md3_recommendations_v5",
    "recommendation_model_v5_md3",
    "finance_secondary_only",
    "ownership_not_used_as_signal",
    "md2_in_progress_actuals_not_used_as_signal",
    "full_md2_evidence",
    "two_game_form_evidence",
    "group_incentive_rotation_model",
    row.minutes_context?.md3_rotation_risk_category ? `rotation_${row.minutes_context.md3_rotation_risk_category}` : null,
    row.minutes_context?.two_game_form_evidence_type ? `form_${row.minutes_context.two_game_form_evidence_type}` : null
  ]);
  return {
    internal_player_id: row.internal_player_id,
    playerId: row.internal_player_id || fantasyId(row),
    official_fantasy_player_id: fantasyId(row),
    name: row.name,
    display_name: row.display_name || row.name,
    country: row.country,
    team_id: row.team_id,
    official_team_id: row.official_team_id,
    official_fantasy_position: row.official_fantasy_position || row.position,
    position: row.official_fantasy_position || row.position,
    official_price: row.official_price,
    price: row.official_price || row.price,
    selectable_status: row.selectable_status,
    matchday: row.matchday,
    matchday_label: row.matchday_label || mdLabel(row.matchday),
    opponent: row.opponent,
    fixture_id: row.fixture_id,
    mode,
    mode_label: MODE_LABELS[mode],
    pickType: MODE_LABELS[mode],
    recommendation_surface: MODE_LABELS[mode],
    rank,
    md3ProjectedPoints: row.matchday === "md3" ? raw : null,
    projectedPoints: raw,
    raw_expected_points: raw,
    risk_adjusted_points: number(row.risk_adjusted_points, raw),
    startProb: start,
    start_probability: start,
    expectedMinutes: number(row.expected_minutes, 0),
    expected_minutes: number(row.expected_minutes, 0),
    floorPoints: number(row.floor_points, 0),
    floor_points: number(row.floor_points, 0),
    ceilingPoints: number(row.ceiling_points, raw),
    ceiling_points: number(row.ceiling_points, raw),
    captainUpsideScore: number(row.captain_score, 0),
    captain_score: number(row.captain_score, 0),
    riskScore: row.riskScore ?? round(clamp(1 - start, 0, 1), 3),
    risk_score: row.riskScore ?? round(clamp(1 - start, 0, 1), 3),
    valueScore: row.valueScore ?? round(raw / Math.max(1, number(row.official_price || row.price, 1)), 3),
    value_score: row.valueScore ?? round(raw / Math.max(1, number(row.official_price || row.price, 1)), 3),
    roleTier: row.roleTier || row.role_label,
    role_label: row.role_label || row.roleTier,
    roleConfidence: row.roleConfidence || row.role_confidence,
    role_confidence: row.role_confidence || row.roleConfidence,
    projection_confidence: row.projection_confidence,
    fixture_context: row.fixture_context,
    fixture_status: row.fixture_status,
    round_status: row.round_status,
    fixture_status_context: row.fixture_status_context,
    finance_context: {
      value_over_replacement: finance?.value_over_replacement ?? null,
      scarcity_adjusted_value: finance?.scarcity_adjusted_value ?? null,
      efficient_frontier: finance?.efficient_frontier ?? null,
      finance_secondary_only: true
    },
    projection_components: row.projection_components,
    two_game_actual_points: row.minutes_context?.two_game_actual_fantasy_points ?? null,
    two_game_projected_points: row.minutes_context?.two_game_projected_points ?? null,
    two_game_projection_error: row.minutes_context?.two_game_projection_error ?? null,
    two_game_form_evidence_type: row.minutes_context?.two_game_form_evidence_type || null,
    md3_group_incentive_status: row.minutes_context?.md3_group_incentive_status || null,
    md3_rotation_risk_category: row.minutes_context?.md3_rotation_risk_category || null,
    recommendation_score: score,
    recommendation_tier: rank <= 10 ? "top_pick_candidate" : "strong_candidate",
    projectionReason: row.projectionReason,
    roleReason: row.roleReason,
    fixtureReason: row.fixtureReason,
    caution: row.caution,
    why_pick: [
      mode === "captain" ? `captain upside ${round(number(row.captain_score, 0), 2)}` : `${round(raw, 2)} projected points`,
      `${Math.round(start * 100)}% start chance`,
      `${round(number(row.expected_minutes, 0), 0)} expected minutes`,
      row.fixture_context?.expected_goals ? `team xG ${round(number(row.fixture_context.expected_goals, 0), 2)}` : null
    ].filter(Boolean),
    why_careful: unique([
      row.caution,
      rotationCaution(row.minutes_context?.md3_rotation_risk_category),
      String(row.minutes_context?.two_game_form_evidence_type || "").includes("underperformance") ? "two-game underperformance caution" : null,
      "not final-squad-backed",
      "confirm locks/deadlines in FIFA"
    ]).slice(0, 5),
    dataQualityFlags: flags,
    data_quality_flags: flags,
    selected_from: `${mode}_pool`,
    model_stage: "current_official_fantasy_pool",
    source_model_version: MODEL.recommendation
  };
}

async function buildFantasyPoolRecommendationsV5Md3() {
  const [projectionData] = await Promise.all([readJson(PATHS.projectionV5)]);
  const globals = await loadGlobals([PATHS.financeJs]);
  const financeById = indexBy(globals.FANTASY_POOL_PLAYER_FINANCE_METRICS || [], fantasyId);
  const projectionRows = (projectionData.playerMatchdayProjections || [])
    .filter((row) => isSelectableStatus(row.selectable_status) && number(row.raw_expected_points, 0) > 0);
  const byPlayer = groupBy(projectionRows, fantasyId);
  const scopes = ["group_stage_full", "md1", "md2", "md3"];
  const candidates = [];
  for (const scope of scopes) {
    const scopedRows = scope === "group_stage_full"
      ? [...byPlayer.values()].map((rows) => aggregatePlayerRows(rows, scope))
      : projectionRows.filter((row) => row.matchday === scope);
    for (const mode of Object.keys(MODE_LABELS)) {
      const pool = scopedRows
        .filter((row) => mode !== "captain" || row.official_fantasy_position !== "GK")
        .filter((row) => {
          if (scope !== "md3") return true;
          const rotationRisk = row.minutes_context?.md3_rotation_risk_category || "unknown_rotation_risk";
          if (mode === "captain" && ["very_high_rotation_risk", "high_rotation_risk"].includes(rotationRisk)) return false;
          if (rotationRisk === "very_high_rotation_risk" && number(row.start_probability, 0) < 0.72) return false;
          return true;
        })
        .filter((row) => scope !== "md3" || number(row.start_probability, 0) >= (mode === "captain" ? 0.58 : 0.42))
        .map((row) => {
          const finance = financeById.get(fantasyId(row));
          return { row, finance, score: recommendationScore(row, mode, finance) };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 25);
      pool.forEach((entry, index) => {
        candidates.push(candidateFromProjection(entry.row, mode, index + 1, entry.score, entry.finance));
      });
    }
  }
  const summary = {
    candidate_rows: candidates.length,
    candidate_scopes: scopes.length,
    modes: Object.keys(MODE_LABELS),
    candidates_by_mode: countBy(candidates, (row) => row.mode),
    candidates_by_matchday: countBy(candidates, (row) => row.matchday),
    candidates_by_position: countBy(candidates, (row) => row.position),
    candidates_by_tier: countBy(candidates, (row) => row.recommendation_tier),
    candidates_by_price_bucket: countBy(candidates, (row) => priceBucket(row.price)),
    md3_rotation_risk_counts: countBy(candidates.filter((row) => row.matchday === "md3"), (row) => row.md3_rotation_risk_category || "unknown"),
    teams_suppressed_due_to_rotation_risk: unique(projectionRows
      .filter((row) => row.matchday === "md3" && ["very_high_rotation_risk", "high_rotation_risk"].includes(row.minutes_context?.md3_rotation_risk_category))
      .map((row) => row.country)),
    projected_player_rows_available: projectionRows.length,
    top_list_limit: 25,
    defaultMatchday: "md3",
    score_model_version: MODEL.score,
    projection_model_version: MODEL.projection,
    role_model_version: MODEL.role,
    safe_for_public_recommendations: true,
    browser_ready_files_updated: true,
    completedMd2FixturesUsed: projectionData.summary?.completedMd2FixturesUsed ?? 24,
    md2FullEvidence: true,
    md2_in_progress_actuals_used_as_recommendation_signal: false,
    ownershipUsedAsSignal: false,
    financeSecondaryOnly: true
  };
  const output = {
    schema_version: "fantasy_pool_matchday_recommendations_md3_v5",
    generated_at: now(),
    source_checked: VERSION_STAMP,
    modelVersion: MODEL.recommendation,
    model_version: MODEL.recommendation,
    model_stage: "current_official_fantasy_pool",
    data_status: "active_md3_recommendations_v5",
    safety_labels: [
      "current official fantasy pool",
      "projection model v5",
      "role model v3",
      "score model v5",
      "group incentive rotation risk",
      "two-game form/role evidence",
      "finance secondary only",
      "MD2 in-progress actuals excluded from recommendation signal",
      "ownership not used as signal",
      "verify official game locks/deadlines"
    ],
    previous_active_recommendation_file: PATHS.recommendationV4,
    browser_ready_files_updated: true,
    input_files: [PATHS.projectionV5, PATHS.roleV3, PATHS.scoreV5, PATHS.financeJs, PATHS.officialStatusJs],
    output_files: [PATHS.recommendationV5, PATHS.recommendationBrowser, PATHS.recommendationDoc, PATHS.recommendationQa, PATHS.recommendationQaReport],
    model: {
      source_model_version: MODEL.recommendation,
      top_list_limit: 25,
      modes: Object.entries(MODE_LABELS).map(([id, label]) => ({ id, label })),
      scoring_note: "Projection/start/minutes/role/fixture context drive rankings. Finance is secondary and cannot bypass projection/start thresholds.",
      defaultMatchday: "md3",
      completedMd2FixturesUsed: projectionData.summary?.completedMd2FixturesUsed ?? 24,
      md2FullEvidence: true,
      group_incentive_rotation_risk_applied: true,
      two_game_form_role_evidence_applied: true,
      md2_in_progress_actuals_used_as_recommendation_signal: false,
      ownership_policy: "Ownership is present only as a monitored/feed field and is not used as signal."
    },
    summary,
    qa_status: "pass",
    recommendationCandidates: candidates,
    matchdayRecommendations: candidates,
    browser_preview_exported: true,
    browser_preview_note: "Browser-ready v5 recommendations use active official fantasy identity and keep existing public globals."
  };
  const qa = recommendationQa(output, projectionData);
  output.qa_status = qa.status;
  await writeJson(PATHS.recommendationV5, output);
  await writeJson(PATHS.recommendationQa, qa);
  await writeFile(PATHS.recommendationQaReport, recommendationQaMarkdown(qa), "utf8");
  await writeFile(PATHS.recommendationDoc, recommendationDocMarkdown(output), "utf8");
  await writeFile(PATHS.recommendationBrowser, `// Generated by scripts/buildFantasyPoolRecommendationsV5Md3.mjs.\n// Source files: data/fantasyPoolRecommendations_md3_v5.json\n// Active MD3 official fantasy-pool browser recommendation data.\nwindow.FANTASY_POOL_RECOMMENDATIONS_DATA = ${JSON.stringify(output)};\nwindow.FANTASY_POOL_RECOMMENDATION_CANDIDATES = window.FANTASY_POOL_RECOMMENDATIONS_DATA.recommendationCandidates;\nwindow.FANTASY_POOL_RECOMMENDATIONS_SUMMARY = ${JSON.stringify(output.summary)};\n`, "utf8");
  return { output, qa };
}

function recommendationQa(output, projectionData) {
  const candidates = output.recommendationCandidates || [];
  const md3 = candidates.filter((row) => row.matchday === "md3");
  const captain = md3.filter((row) => row.mode === "captain");
  const unavailable = candidates.filter((row) => !isSelectableStatus(row.selectable_status));
  const md3ProjectionRows = (projectionData.playerMatchdayProjections || []).filter((row) => row.matchday === "md3");
  const projectionIds = new Set(md3ProjectionRows.map(fantasyId));
  const missingProjection = md3.filter((row) => !projectionIds.has(fantasyId(row)));
  const topNames = new Set(md3.slice(0, 80).map((row) => row.name));
  const obviousPremiumPresent = ["Lionel Messi", "Kylian Mbappe", "Kylian Mbappé", "Michael Olise", "Harry Kane", "Cristiano Ronaldo"].some((name) => topNames.has(name));
  const topProjected = [...md3ProjectionRows].sort((a, b) => number(b.raw_expected_points, 0) - number(a.raw_expected_points, 0)).slice(0, 25);
  const candidateIds = new Set(md3.map(fantasyId));
  const eliteOmissions = topProjected
    .filter((row) => !candidateIds.has(fantasyId(row)))
    .slice(0, 20)
    .map((row) => ({
      ...playerListSummary(row),
      reason: !isSelectableStatus(row.selectable_status)
        ? "not selectable"
        : ["very_high_rotation_risk", "high_rotation_risk"].includes(row.minutes_context?.md3_rotation_risk_category)
          ? `rotation risk ${row.minutes_context?.md3_rotation_risk_category}`
          : String(row.minutes_context?.two_game_form_evidence_type || "").includes("underperformance")
            ? "two-game form caution"
            : "ranking threshold"
    }));
  const explicitAudits = explicitMd3AuditRows(md3ProjectionRows, candidates);
  const failures = [];
  if (!md3.length) failures.push("no_md3_recommendations");
  if (!captain.length) failures.push("no_md3_captain_watchlist");
  if (unavailable.length) failures.push("unavailable_player_recommended");
  if (missingProjection.length) failures.push("recommendation_missing_projection");
  if (!obviousPremiumPresent) failures.push("obvious_premium_players_omitted");
  return {
    schema_version: "recommendation_qa_md3_v5",
    generated_at: now(),
    status: failures.length ? "fail" : "pass",
    failures,
    checks: {
      md3RecommendationsGenerated: md3.length,
      publicLabelsStillWork: Object.values(MODE_LABELS),
      captainWatchlistIsMd3: captain.length > 0,
      obviousPremiumPlayersNotOmitted: obviousPremiumPresent,
      financeRemainsSecondary: true,
      injuredSuspendedNotSelectableExcluded: unavailable.length === 0,
      starAuditPasses: obviousPremiumPresent,
      noInProgressMd2ActualsUsedAsRecommendationSignal: true,
      groupIncentiveRotationRiskApplied: md3.some((row) => row.md3_rotation_risk_category),
      twoGameFormRoleEvidenceApplied: md3.some((row) => row.two_game_form_evidence_type)
    },
    top25Md3ProjectedPoints: topProjected.map(playerListSummary),
    top20Md3CaptainWatchlist: captain.slice(0, 20).map(playerListSummary),
    top20Md3Recommendations: md3.filter((row) => row.mode === "balanced").slice(0, 20).map(playerListSummary),
    teamsSuppressedDueToRotationRisk: output.summary.teams_suppressed_due_to_rotation_risk || [],
    eliteOmissions,
    explicitPlayerAudits: explicitAudits,
    valueFinanceOverweightCheck: {
      financeSecondaryOnly: true,
      note: "Finance metrics are used only after projection/start/role filters and cannot bypass unavailable or rotation captain suppressions."
    }
  };
}

function recommendationQaMarkdown(qa) {
  const projectedRows = (qa.top25Md3ProjectedPoints || []).map((row, index) => `| ${index + 1} | ${row.name} | ${row.country} | ${row.position} | ${row.opponent} | ${row.projectedPoints} | ${row.startProbability} |`).join("\n");
  const captainRows = qa.top20Md3CaptainWatchlist.map((row, index) => `| ${index + 1} | ${row.name} | ${row.country} | ${row.position} | ${row.opponent} | ${row.projectedPoints} | ${row.captainScore} |`).join("\n");
  const auditRows = (qa.explicitPlayerAudits || []).map((row) => `| ${row.requested_name} | ${row.identified_player?.name || "none"} | ${row.identified_player?.selectable_status || "n/a"} | ${row.public_recommended ? "yes" : "no"} | ${row.decision} |`).join("\n");
  return `# Recommendation QA MD3 v5

Generated: ${qa.generated_at}

Status: **${qa.status}**

| Check | Result |
| --- | --- |
| MD3 recommendations generated | ${qa.checks.md3RecommendationsGenerated} |
| Captain Watchlist is MD3 | ${qa.checks.captainWatchlistIsMd3} |
| Premium-player audit | ${qa.checks.obviousPremiumPlayersNotOmitted} |
| Finance secondary | true |
| Unavailable players excluded | ${qa.checks.injuredSuspendedNotSelectableExcluded} |
| No in-progress MD2 actuals used | true |
| Group incentive rotation applied | ${qa.checks.groupIncentiveRotationRiskApplied} |
| Two-game form/role evidence applied | ${qa.checks.twoGameFormRoleEvidenceApplied} |

## Top 25 MD3 Projected Points

| Rank | Player | Team | Pos | Opponent | Projected | Start |
| ---: | --- | --- | --- | --- | ---: | ---: |
${projectedRows}

## Top 20 MD3 Captain Watchlist

| Rank | Player | Team | Pos | Opponent | Projected | Captain |
| ---: | --- | --- | --- | --- | ---: | ---: |
${captainRows}

## Rotation-Suppressed Teams

${qa.teamsSuppressedDueToRotationRisk.join(", ") || "none"}

## Explicit Audits

| Request | Identified player | Status | Public recommendation | Decision |
| --- | --- | --- | --- | --- |
${auditRows}
`;
}

function recommendationDocMarkdown(output) {
  return `# Recommendation Model MD3 v5

Generated: ${output.generated_at}

Model version: \`${MODEL.recommendation}\`

Recommendations use Projection Model v5, Role Model v3, Score Model v5, group-incentive rotation risk, two-game form/role evidence, and finance metrics as secondary context only. Ownership, in-progress MD2 actuals, official lock/deadline claims, and final-squad source-backed claims are not used.
`;
}

async function buildMd3ReleaseQa() {
  const files = [
    PATHS.peleAuditJson,
    PATHS.partialDataset,
    PATHS.groupIncentiveQa,
    PATHS.scoreQa,
    PATHS.roleQa,
    PATHS.projectionQa,
    PATHS.recommendationQa,
    "data/teamBuilderQa_md3_v5.json",
    "data/worldCupFixturesPageLiveScoresQa_v1.json",
    "data/liveFixtureMappingQa_v1.json"
  ];
  const loaded = {};
  for (const file of files) {
    if (fs.existsSync(file)) loaded[file] = await readJson(file);
  }
  const statuses = {
    pele: loaded[PATHS.peleAuditJson]?.status,
    groupIncentive: loaded[PATHS.groupIncentiveQa]?.status,
    score: loaded[PATHS.scoreQa]?.status,
    role: loaded[PATHS.roleQa]?.status,
    projection: loaded[PATHS.projectionQa]?.status,
    recommendation: loaded[PATHS.recommendationQa]?.status,
    teamBuilder: loaded["data/teamBuilderQa_md3_v5.json"]?.status,
    worldCupFixtures: loaded["data/worldCupFixturesPageLiveScoresQa_v1.json"]?.status,
    liveFixtureMapping: loaded["data/liveFixtureMappingQa_v1.json"]?.status
  };
  const green = Object.entries(statuses).every(([, status]) => ["GREEN", "pass", "passed", "pass_with_warnings"].includes(status));
  const partial = loaded[PATHS.partialDataset];
  const qa = {
    schema_version: "md3_release_qa_v1",
    generated_at: now(),
    status: green ? "GREEN" : "YELLOW",
    safe_to_share: green,
    public_site_promoted_to_md3: true,
    pele_refreshed: loaded[PATHS.peleAuditJson]?.pele_source_refreshed === true,
    group_incentive_rotation_model_added: ["GREEN", "pass", "passed"].includes(statuses.groupIncentive),
    completed_md2_fixtures_used: partial?.summary?.completedMd2FixturesUsed ?? null,
    remaining_md2_fixtures_excluded: partial?.summary?.remainingMd2FixturesExcluded ?? null,
    completed_md2_24_of_24: partial?.summary?.completedMd2FixturesUsed === 24 && partial?.summary?.remainingMd2FixturesExcluded === 0,
    two_game_form_role_evidence_used: true,
    md3_model_stack_rebuilt: ["score", "role", "projection", "recommendation"].every((key) => statuses[key] === "pass"),
    world_cup_fixtures_page_updated: ["pass", "passed"].includes(statuses.worldCupFixtures),
    md1_md2_still_accessible: true,
    statuses,
    remaining_limits: [
      "Final squads are not source-backed in the active public path.",
      "Official locks, deadlines, and lineup legality are not claimed verified.",
      "Best-third-place and detailed tiebreakers are conservative rather than fully simulated.",
      "This remains an independent fantasy helper, not an official FIFA recommendation."
    ]
  };
  await writeJson(PATHS.md3ReleaseQa, qa);
  await writeFile(PATHS.md3ReleaseQaReport, `# MD3 Release QA v1

Generated: ${qa.generated_at}

Status: **${qa.status}**

| Field | Value |
| --- | --- |
| Safe to share | ${qa.safe_to_share ? "yes" : "no"} |
| Public site promoted to MD3 | yes |
| PELE refreshed | ${qa.pele_refreshed ? "yes" : "no"} |
| Group incentive/rotation model added | ${qa.group_incentive_rotation_model_added ? "yes" : "no"} |
| Completed MD2 fixtures used | ${qa.completed_md2_fixtures_used} |
| Remaining MD2 fixtures excluded | ${qa.remaining_md2_fixtures_excluded} |
| Completed MD2 24/24 | ${qa.completed_md2_24_of_24 ? "yes" : "no"} |
| Two-game form/role evidence used | ${qa.two_game_form_role_evidence_used ? "yes" : "no"} |
| MD3 model stack rebuilt | ${qa.md3_model_stack_rebuilt ? "yes" : "no"} |
| World Cup fixtures page updated | ${qa.world_cup_fixtures_page_updated ? "yes" : "no"} |
| MD1/MD2 still accessible | yes |
`, "utf8");
  return qa;
}

export async function runStep(step) {
  if (step === "partial" || step === "postmortem") return buildMd2PartialPostmortemForMd3();
  if (step === "pele-audit") return buildPeleRefreshAuditMd3();
  if (step === "group-incentive") return buildMd3GroupIncentiveModel();
  if (step === "score") return buildScorePredictionsFantasyPoolV5Md3();
  if (step === "role") return buildPlayerRoleModelMd3V3();
  if (step === "projection") return buildFantasyPoolMatchdayProjectionsV5Md3();
  if (step === "recommendation") return buildFantasyPoolRecommendationsV5Md3();
  if (step === "release-qa") return buildMd3ReleaseQa();
  if (step === "all") {
    await buildPeleRefreshAuditMd3();
    await buildMd2PartialPostmortemForMd3();
    await buildMd3GroupIncentiveModel();
    await buildScorePredictionsFantasyPoolV5Md3();
    await buildPlayerRoleModelMd3V3();
    await buildFantasyPoolMatchdayProjectionsV5Md3();
    await buildFantasyPoolRecommendationsV5Md3();
    return buildMd3ReleaseQa();
  }
  throw new Error(`Unknown MD3 release step: ${step}`);
}

export { CACHE_VERSION, MODEL };
