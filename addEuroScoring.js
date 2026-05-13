const fs = require("fs");
const path = require("path");

const playersPath = path.join(__dirname, "players.json");
const scoringGuidePath = path.join(__dirname, "euroScoringGuide.md");
const gameweekDir = path.join(
  __dirname,
  "..",
  "FPL-Core-Insights",
  "data",
  "2025-2026",
  "By Gameweek"
);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function round(value, decimals = 2) {
  return Number(value.toFixed(decimals));
}

function mean(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values) {
  if (values.length <= 1) return 0;
  const avg = mean(values);
  const variance =
    values.reduce((sum, value) => sum + ((value - avg) ** 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function downsideDeviation(values, target) {
  if (!values.length) return 0;
  const downsideSquares = values.map((value) => Math.min(0, value - target) ** 2);
  return Math.sqrt(mean(downsideSquares));
}

function percentile(values, percentileValue) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * percentileValue;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) return sorted[lower];

  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

function cvar(values, tailShare) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const tailCount = Math.max(1, Math.ceil(sorted.length * tailShare));
  return mean(sorted.slice(0, tailCount));
}

function percentileIndex(values, currentValue) {
  const sorted = values
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);

  if (sorted.length <= 1) return 50;

  const firstIndex = sorted.findIndex((value) => value === currentValue);
  const lastIndex = sorted.length - 1 - [...sorted].reverse().findIndex((value) => value === currentValue);

  if (firstIndex < 0) return 0;
  if (currentValue === sorted[0]) return 0;
  if (currentValue === sorted[sorted.length - 1]) return 100;

  const averageRank = (firstIndex + lastIndex) / 2;
  return clamp(Math.round((averageRank / (sorted.length - 1)) * 100), 0, 100);
}

function toNumber(value) {
  if (typeof value === "number") return value;
  if (value === null || value === undefined || value === "") return 0;
  return Number(value) || 0;
}

function goalPoints(position) {
  if (position === "Goalkeeper" || position === "Defender") return 6;
  if (position === "Midfielder") return 5;
  return 4;
}

function cleanSheetPoints(position) {
  if (position === "Goalkeeper" || position === "Defender") return 4;
  if (position === "Midfielder") return 1;
  return 0;
}

function estimateSixtyMinuteMatches(player) {
  const appearances = toNumber(player.fbref_appearances);
  const starts = toNumber(player.fbref_starts || player.starts);
  const minutes = toNumber(player.fbref_minutes || player.minutes);
  const estimatedFromMinutes = Math.floor(minutes / 60);

  return Math.min(appearances, Math.max(starts, estimatedFromMinutes));
}

function buildReason(player, reliabilityScore, compositeRisk, shrunkPointsPerAppearance) {
  const parts = [];

  if ((player.fbref_goals || 0) >= 10 || (player.fbref_assists || 0) >= 8) {
    parts.push("scores or assists often");
  }

  if ((player.clean_sheets || 0) >= 10 || (player.saves || 0) >= 90) {
    parts.push("gets clean sheets or save points");
  }

  if ((player.recoveries || 0) >= 150) {
    parts.push("adds points from ball recoveries");
  }

  if (reliabilityScore >= 80) {
    parts.push("plays regularly");
  } else if (reliabilityScore <= 45) {
    parts.push("not enough playing-time data yet");
  }

  if (compositeRisk >= 65) {
    parts.push("higher chance of a bad week");
  } else if (compositeRisk <= 30) {
    parts.push("lower risk profile");
  }

  if (parts.length === 0) {
    parts.push("balanced profile");
  }

  return `${parts.slice(0, 2).join(", ")}. Estimated points next match: ${round(shrunkPointsPerAppearance)}.`;
}

function loadGameweekSeries() {
  const byPlayerId = {};

  const folders = fs
    .readdirSync(gameweekDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^GW\d+$/i.test(entry.name))
    .sort((a, b) => Number(a.name.replace(/\D/g, "")) - Number(b.name.replace(/\D/g, "")));

  folders.forEach((folder) => {
    const gw = Number(folder.name.replace(/\D/g, ""));
    const filePath = path.join(gameweekDir, folder.name, "player_gameweek_stats.csv");
    const raw = fs.readFileSync(filePath, "utf8").trim().split("\n");
    const header = raw[0].split(",");

    const idIndex = header.indexOf("id");
    const eventPointsIndex = header.indexOf("event_points");
    const minutesIndex = header.indexOf("minutes");

    raw.slice(1).forEach((line) => {
      const cols = line.split(",");
      const playerId = cols[idIndex];
      const eventPoints = Number(cols[eventPointsIndex] || 0);
      const minutes = Number(cols[minutesIndex] || 0);

      if (!byPlayerId[playerId]) {
        byPlayerId[playerId] = [];
      }

      byPlayerId[playerId].push({
        gw,
        event_points: eventPoints,
        minutes
      });
    });
  });

  return {
    seriesByPlayer: byPlayerId,
    gameweekCount: folders.length
  };
}

const { seriesByPlayer, gameweekCount } = loadGameweekSeries();
const players = readJson(playersPath);

const firstPass = players.map((player) => {
  const appearances = toNumber(player.fbref_appearances);
  const nineties = toNumber(player.fbref_nineties);
  const sixtyMinuteMatches = estimateSixtyMinuteMatches(player);
  const goals = toNumber(player.goals_scored || player.fbref_goals);
  const assists = toNumber(player.assists || player.fbref_assists);
  const cleanSheets = toNumber(player.clean_sheets);
  const goalsConceded = toNumber(player.goals_conceded);
  const saves = toNumber(player.saves);
  const penaltiesSaved = toNumber(player.penalties_saved);
  const penaltiesMissed = toNumber(player.penalties_missed);
  const yellowCards = toNumber(player.yellow_cards || player.fbref_yellow_cards);
  const redCards = toNumber(player.red_cards || player.fbref_red_cards);
  const ownGoals = toNumber(player.own_goals);
  const recoveries = toNumber(player.recoveries);

  const appearancePoints = appearances;
  const sixtyMinutePoints = sixtyMinuteMatches;
  const attackPoints = goals * goalPoints(player.position) + assists * 3;
  const cleanSheetValue = cleanSheets * cleanSheetPoints(player.position);
  const recoveryPoints = Math.floor(recoveries / 3);
  const goalkeeperSavePoints =
    player.position === "Goalkeeper" ? Math.floor(saves / 3) : 0;
  const penaltySavePoints = penaltiesSaved * 5;
  const penaltyMissPenalty = penaltiesMissed * -2;
  const disciplinePenalty = (yellowCards * -1) + (redCards * -3) + (ownGoals * -2);
  const concedePenalty =
    player.position === "Goalkeeper" || player.position === "Defender"
      ? Math.floor(goalsConceded / 2) * -1
      : 0;

  const totalEstimate =
    appearancePoints +
    sixtyMinutePoints +
    attackPoints +
    cleanSheetValue +
    recoveryPoints +
    goalkeeperSavePoints +
    penaltySavePoints +
    penaltyMissPenalty +
    disciplinePenalty +
    concedePenalty;

  const rawPointsPer90Estimate = nineties > 0 ? totalEstimate / nineties : 0;
  const rawPointsPerAppearanceEstimate = appearances > 0 ? totalEstimate / appearances : 0;

  return {
    ...player,
    _calc: {
      appearances,
      nineties,
      sixtyMinuteMatches,
      totalEstimate,
      rawPointsPer90Estimate,
      rawPointsPerAppearanceEstimate,
      appearancePoints,
      attackPoints,
      cleanSheetValue,
      recoveryPoints,
      goalkeeperSavePoints,
      penaltySavePoints,
      penaltyMissPenalty,
      disciplinePenalty,
      concedePenalty
    }
  };
});

const positionBaselines = {};
["Goalkeeper", "Defender", "Midfielder", "Forward"].forEach((position) => {
  const values = firstPass
    .filter((player) => player.position === position && player._calc.nineties > 0)
    .map((player) => player._calc.rawPointsPer90Estimate);
  positionBaselines[position] = values.length ? mean(values) : 0;
});

const playersWithRawRisk = firstPass.map((player) => {
  const calc = player._calc;
  const weeklySeries = (seriesByPlayer[player.id] || [])
    .sort((a, b) => a.gw - b.gw)
    .map((entry) => Number(entry.event_points || 0));

  const stddevWeeklyPoints = standardDeviation(weeklySeries);
  const downsideDeviationPoints = downsideDeviation(weeklySeries, 2);
  const badWeekRate =
    weeklySeries.length > 0
      ? weeklySeries.filter((value) => value <= 1).length / weeklySeries.length
      : 0;
  const weeklyVar10 = percentile(weeklySeries, 0.1);
  const weeklyCvar20 = cvar(weeklySeries, 0.2);

  const confidenceWeight =
    calc.nineties > 0 ? calc.nineties / (calc.nineties + 8) : 0;
  const sampleConfidenceScore = clamp(Math.round(confidenceWeight * 100), 0, 100);

  const positionBaselinePer90 = positionBaselines[player.position] || 0;
  const shrunkPointsPer90Estimate =
    confidenceWeight * calc.rawPointsPer90Estimate +
    (1 - confidenceWeight) * positionBaselinePer90;

  const avgMinutesPerAppearance =
    calc.appearances > 0
      ? toNumber(player.fbref_minutes || player.minutes) / calc.appearances
      : 0;
  const shrunkPointsPerAppearanceEstimate =
    shrunkPointsPer90Estimate * (avgMinutesPerAppearance / 90);

  const startRate = calc.appearances > 0 ? toNumber(player.fbref_starts || player.starts) / calc.appearances : 0;
  const sixtyMinuteRate = calc.appearances > 0 ? calc.sixtyMinuteMatches / calc.appearances : 0;

  const statusPenaltyMap = {
    a: 0,
    d: 25,
    i: 40,
    s: 40,
    u: 45,
    n: 35
  };

  const rawChance = player.chance_of_playing_next_round;
  const chanceOfPlaying =
    rawChance === undefined || rawChance === null || rawChance === ""
      ? 100
      : toNumber(rawChance);

  const missedGameShare =
    gameweekCount > 0 ? 1 - Math.min(calc.appearances, gameweekCount) / gameweekCount : 0;

  const availabilityRiskScore = clamp(
    Math.round(
      (statusPenaltyMap[player.status] || 0) +
      ((100 - chanceOfPlaying) * 0.5) +
      (missedGameShare * 35)
    ),
    0,
    100
  );

  const minutesRiskScore = clamp(
    Math.round(
      ((1 - startRate) * 45) +
      ((1 - sixtyMinuteRate) * 30) +
      (Math.max(0, 75 - avgMinutesPerAppearance) * 0.7)
    ),
    0,
    100
  );

  const yellowPer90 = calc.nineties > 0 ? toNumber(player.fbref_yellow_cards || player.yellow_cards) / calc.nineties : 0;
  const redPer90 = calc.nineties > 0 ? toNumber(player.fbref_red_cards || player.red_cards) / calc.nineties : 0;
  const disciplineRiskScore = clamp(
    Math.round((yellowPer90 * 14) + (redPer90 * 45)),
    0,
    100
  );

  const volatilityRiskScore = clamp(Math.round(stddevWeeklyPoints * 12), 0, 100);
  const tailRiskScore = clamp(
    Math.round(
      (badWeekRate * 55) +
      (Math.max(0, 2 - weeklyVar10) * 12) +
      (Math.max(0, 2 - weeklyCvar20) * 10)
    ),
    0,
    100
  );

  const compositeRiskScore = clamp(
    Math.round(
      availabilityRiskScore * 0.28 +
      minutesRiskScore * 0.24 +
      disciplineRiskScore * 0.12 +
      volatilityRiskScore * 0.2 +
      tailRiskScore * 0.16
    ),
    0,
    100
  );

  const reliabilityScore = clamp(
    Math.round(
      sampleConfidenceScore * 0.45 +
      (100 - availabilityRiskScore) * 0.3 +
      (100 - minutesRiskScore) * 0.25
    ),
    0,
    100
  );

  const sharpeLike =
    stddevWeeklyPoints > 0
      ? (shrunkPointsPerAppearanceEstimate - 2) / stddevWeeklyPoints
      : 0;
  const sortinoLike =
    downsideDeviationPoints > 0
      ? (shrunkPointsPerAppearanceEstimate - 2) / downsideDeviationPoints
      : 0;

  const riskAdjustedExpectedPoints =
    shrunkPointsPerAppearanceEstimate * (1 - compositeRiskScore / 150);
  const riskAdjustedOverallScore = clamp(
    Math.round(
      (clamp(riskAdjustedExpectedPoints, 0, 10) / 10) * 65 +
      (reliabilityScore / 100) * 20 +
      ((100 - compositeRiskScore) / 100) * 15
    ),
    0,
    100
  );

  return {
    ...player,
    euro_style_appearance_points_estimate: calc.appearancePoints,
    euro_style_sixty_minute_points_estimate: calc.sixtyMinuteMatches,
    euro_style_attack_points_estimate: calc.attackPoints,
    euro_style_clean_sheet_points_estimate: calc.cleanSheetValue,
    euro_style_recovery_points_estimate: calc.recoveryPoints,
    euro_style_goalkeeper_save_points_estimate: calc.goalkeeperSavePoints,
    euro_style_penalty_save_points_estimate: calc.penaltySavePoints,
    euro_style_concede_penalty_estimate: calc.concedePenalty,
    euro_style_discipline_penalty_estimate: calc.disciplinePenalty + calc.penaltyMissPenalty,
    euro_style_total_points_estimate: calc.totalEstimate,
    euro_style_points_per90_estimate: round(calc.rawPointsPer90Estimate),
    euro_style_points_per_appearance_estimate: round(calc.rawPointsPerAppearanceEstimate),
    euro_style_position_baseline_points_per90: round(positionBaselinePer90),
    euro_style_confidence_weight: round(confidenceWeight),
    euro_style_sample_confidence_score: sampleConfidenceScore,
    euro_style_shrunk_points_per90_estimate: round(shrunkPointsPer90Estimate),
    euro_style_shrunk_points_per_appearance_estimate: round(shrunkPointsPerAppearanceEstimate),
    euro_style_reliability_score: reliabilityScore,
    euro_style_overall_score: clamp(
      Math.round(
        (clamp(calc.rawPointsPer90Estimate, 0, 12) / 12) * 70 +
        (reliabilityScore / 100) * 30
      ),
      0,
      100
    ),
    risk_event_points_stddev: round(stddevWeeklyPoints),
    risk_downside_deviation: round(downsideDeviationPoints),
    risk_bad_week_rate: round(badWeekRate),
    risk_value_at_risk_10: round(weeklyVar10),
    risk_conditional_value_at_risk_20: round(weeklyCvar20),
    risk_availability_score: availabilityRiskScore,
    risk_minutes_score: minutesRiskScore,
    risk_discipline_score: disciplineRiskScore,
    risk_volatility_score: volatilityRiskScore,
    risk_tail_score: tailRiskScore,
    risk_composite_score: compositeRiskScore,
    risk_adjusted_sharpe_raw: round(sharpeLike),
    risk_adjusted_sortino_raw: round(sortinoLike),
    risk_adjusted_expected_points_estimate: round(riskAdjustedExpectedPoints),
    risk_adjusted_overall_score: riskAdjustedOverallScore,
    euro_style_scoring_note:
      "Estimated from UEFA EURO 2024 fantasy rules using available season stats. Small-sample correction shrinks extreme rates toward the position average. Risk fields combine real gameweek volatility with availability, minutes, and discipline signals.",
    euro_style_short_reason: buildReason(
      player,
      reliabilityScore,
      compositeRiskScore,
      shrunkPointsPerAppearanceEstimate
    )
  };
});

const sharpeRawValues = playersWithRawRisk.map((player) => player.risk_adjusted_sharpe_raw);
const sortinoRawValues = playersWithRawRisk.map((player) => player.risk_adjusted_sortino_raw);

const enrichedPlayers = playersWithRawRisk.map((player) => {
  const copy = {
    ...player,
    risk_adjusted_sharpe_like: percentileIndex(sharpeRawValues, player.risk_adjusted_sharpe_raw),
    risk_adjusted_sortino_like: percentileIndex(sortinoRawValues, player.risk_adjusted_sortino_raw)
  };

  delete copy._calc;
  return copy;
});

writeJson(playersPath, enrichedPlayers);

console.log(`Updated EURO-style scoring and risk fields for ${enrichedPlayers.length} players.`);
console.log(`Reference guide: ${scoringGuidePath}`);
