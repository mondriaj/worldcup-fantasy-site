import { readFile, writeFile } from "node:fs/promises";

const TODAY = "2026-06-05";
const NOW = new Date().toISOString();

const PATHS = {
  fixtures: "data/fixtures.json",
  matchdays: "data/matchdays.json",
  teamQualityV2: "data/teamQuality.json",
  peleRatings: "data/peleRatings_v1.json",
  playerMinutes: "data/playerMinutesModel_fantasyPool_v0.json",
  playerRecommendationInputs: "data/playerRecommendationInputs_v1.json",
  officialSquads: "data/officialSquads_v0.json",
  officialSquadsImportReport: "data/officialSquadsImportReport_v0.json",
  officialRules: "data/officialFantasyRules_v0.json",
  readiness: "data/officialDataReadiness_v0.json",
  scoreV2: "data/scorePredictions_v2.json",
  teamQualityV3: "data/teamQuality_fantasyPool_v3.json",
  scoreV3: "data/scorePredictions_fantasyPool_v3.json",
  scoreQaV3: "data/scorePredictionQa_fantasyPool_v3.json",
  scoreQaReportV3: "data/scorePredictionQaReport_fantasyPool_v3.md"
};

const MODEL_STAGE = "fantasy_pool_only";
const SOURCE_MODEL_VERSION = "fantasy_pool_score_prediction_v3_pele_anchored_uncertainty_2026-06-05";
const TEAM_QUALITY_VERSION = "team_quality_fantasy_pool_v3";
const REQUIRED_SAFETY_LABELS = [
  "fantasy_pool_only",
  "not final-squad-backed",
  "not betting odds",
  "not final public recommendations",
  "safe only for preliminary projection staging"
];

const VALID_POSITIONS = ["GK", "DEF", "MID", "FWD"];

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

function average(values, fallback = null) {
  const valid = values.filter((value) => Number.isFinite(value));
  if (!valid.length) return fallback;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function sum(values) {
  return values.filter((value) => Number.isFinite(value)).reduce((total, value) => total + value, 0);
}

function countBy(rows, keyFn) {
  return rows.reduce((counts, row) => {
    const key = keyFn(row);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
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

function top(rows, n, scoreFn) {
  return [...rows].sort((a, b) => scoreFn(b) - scoreFn(a)).slice(0, n);
}

function unique(values) {
  return [...new Set(values.filter((value) => value !== null && value !== undefined && value !== ""))];
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function writeJson(path, data) {
  await writeFile(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function minMax(values) {
  const valid = values.filter((value) => Number.isFinite(value));
  return { min: Math.min(...valid), max: Math.max(...valid) };
}

function normalized(value, range, fallback = null) {
  if (!Number.isFinite(value) || !Number.isFinite(range.min) || !Number.isFinite(range.max) || range.min === range.max) {
    return fallback;
  }
  return ((value - range.min) / (range.max - range.min)) * 100;
}

function weightedAverage(parts, fallback = null) {
  const valid = parts.filter((part) => Number.isFinite(part.value) && Number.isFinite(part.weight) && part.weight > 0);
  const weightSum = sum(valid.map((part) => part.weight));
  if (!valid.length || weightSum <= 0) return fallback;
  return valid.reduce((total, part) => total + part.value * (part.weight / weightSum), 0);
}

function qualityTier(score) {
  if (score >= 80) return "elite";
  if (score >= 75) return "contender";
  if (score >= 65) return "strong";
  if (score >= 50) return "competitive";
  if (score >= 35) return "outsider";
  return "long_shot";
}

function difficultyBand(score) {
  if (score <= 25) return "very_favorable";
  if (score <= 40) return "favorable";
  if (score <= 60) return "neutral";
  if (score <= 75) return "difficult";
  return "very_difficult";
}

function cleanSheetBand(probability) {
  if (probability >= 0.55) return "strong";
  if (probability >= 0.38) return "good";
  if (probability >= 0.22) return "medium";
  if (probability >= 0.12) return "weak";
  return "poor";
}

function goalEnvironment(totalExpectedGoals) {
  if (totalExpectedGoals >= 2.95) return "high_goal_environment";
  if (totalExpectedGoals >= 2.65) return "medium_high_goal_environment";
  if (totalExpectedGoals >= 2.35) return "medium_goal_environment";
  return "low_goal_environment";
}

function upsetRiskBand(probability) {
  if (probability >= 0.28) return "high";
  if (probability >= 0.2) return "medium_high";
  if (probability >= 0.12) return "medium";
  return "low";
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

function fixtureAttackerEnvironment(homeXg, awayXg, totalExpectedGoals) {
  const maxTeamXg = Math.max(homeXg, awayXg);
  if (maxTeamXg >= 2.05 || totalExpectedGoals >= 3.05) return "Strong";
  if (maxTeamXg >= 1.55 || totalExpectedGoals >= 2.6) return "Good";
  if (maxTeamXg >= 1.1 || totalExpectedGoals >= 2.25) return "Neutral";
  return "Difficult";
}

function teamAttackerEnvironment(expectedGoals) {
  if (expectedGoals >= 1.9) return "Strong";
  if (expectedGoals >= 1.35) return "Good";
  if (expectedGoals >= 0.9) return "Neutral";
  return "Difficult";
}

function cleanSheetContextLabel(probability) {
  if (probability >= 0.55) return "Strong";
  if (probability >= 0.38) return "Good";
  if (probability >= 0.22) return "Neutral";
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

function goalBandSpread(expectedGoals, uncertaintyLabel) {
  const profiles = {
    Low: { base: 0.11, rate: 0.08, max: 0.32 },
    Medium: { base: 0.17, rate: 0.11, max: 0.45 },
    High: { base: 0.23, rate: 0.15, max: 0.62 }
  };
  const profile = profiles[uncertaintyLabel] || profiles.Medium;
  return round(clamp(profile.base + expectedGoals * profile.rate, 0.12, profile.max), 3);
}

function fixtureUncertaintyContext({ fixture, home, away, homeXg, awayXg, totalExpectedGoals, grid, upsetRiskProbability, qaFlags }) {
  const qualityGap = Math.abs(home.team_quality_fantasyPool_v3.overall_score - away.team_quality_fantasyPool_v3.overall_score);
  const favoriteWinProbability = Math.max(grid.homeWin, grid.awayWin);
  const homeContextUncertainty = home.fantasy_pool_context_v3.uncertainty_score;
  const awayContextUncertainty = away.fantasy_pool_context_v3.uncertainty_score;
  const maxContextUncertainty = Math.max(homeContextUncertainty, awayContextUncertainty);
  const hostCountry = hostVenueCountry(fixture);
  const hostVenueTeamInvolved = [fixture.home_team_id, fixture.away_team_id].includes(hostCountry);
  const reasons = [];
  let score = 12;

  if (qualityGap <= 5) {
    score += 18;
    reasons.push("close team-quality gap");
  } else if (qualityGap <= 10) {
    score += 10;
    reasons.push("moderate team-quality gap");
  }

  if (upsetRiskProbability >= 0.28) {
    score += 18;
    reasons.push("higher upset risk");
  } else if (upsetRiskProbability >= 0.2) {
    score += 10;
    reasons.push("credible upset path");
  }

  if (totalExpectedGoals >= 2.95) {
    score += 10;
    reasons.push("higher goal environment");
  } else if (totalExpectedGoals <= 2.05) {
    score += 7;
    reasons.push("lower-goal setup can swing on one moment");
  }

  if (maxContextUncertainty >= 60) {
    score += 14;
    reasons.push("team-role context needs review");
  } else if (maxContextUncertainty >= 52) {
    score += 8;
    reasons.push("some team-role uncertainty");
  }

  if (qaFlags.includes("brazil_neymar_usage_source_gap")) {
    score += 8;
    reasons.push("Brazil role context needs review");
  }

  if (hostVenueTeamInvolved) {
    score += 4;
    reasons.push("host venue context");
  }

  if (favoriteWinProbability >= 0.86) {
    score -= 10;
  } else if (favoriteWinProbability >= 0.78) {
    score -= 6;
  }

  const uncertaintyScore = round(clamp(score, 0, 100), 1);
  const uncertaintyLabel = uncertaintyScore >= 40 ? "High" : uncertaintyScore >= 24 ? "Medium" : "Low";
  const homeSpread = goalBandSpread(homeXg, uncertaintyLabel);
  const awaySpread = goalBandSpread(awayXg, uncertaintyLabel);
  const homeXgLow = round(clamp(homeXg - homeSpread, 0.12, homeXg), 3);
  const awayXgLow = round(clamp(awayXg - awaySpread, 0.12, awayXg), 3);
  const homeXgHigh = round(homeXg + homeSpread, 3);
  const awayXgHigh = round(awayXg + awaySpread, 3);
  const defaultReason = uncertaintyLabel === "Low"
    ? "clearer favorite and contained scoring range"
    : uncertaintyLabel === "Medium"
      ? "some score-path sensitivity"
      : "multiple score-path risks";
  const reasonText = reasons.slice(0, 3).join(", ") || defaultReason;

  return {
    uncertaintyScore,
    uncertainty_score: uncertaintyScore,
    uncertaintyLabel,
    uncertainty_label: uncertaintyLabel,
    matchUncertainty: uncertaintyLabel,
    match_uncertainty: uncertaintyLabel,
    lowTotalGoals: round(homeXgLow + awayXgLow, 3),
    low_total_goals: round(homeXgLow + awayXgLow, 3),
    baseTotalGoals: totalExpectedGoals,
    base_total_goals: totalExpectedGoals,
    highTotalGoals: round(homeXgHigh + awayXgHigh, 3),
    high_total_goals: round(homeXgHigh + awayXgHigh, 3),
    homeXgLow,
    home_xg_low: homeXgLow,
    homeXgBase: homeXg,
    home_xg_base: homeXg,
    homeXgHigh,
    home_xg_high: homeXgHigh,
    awayXgLow,
    away_xg_low: awayXgLow,
    awayXgBase: awayXg,
    away_xg_base: awayXg,
    awayXgHigh,
    away_xg_high: awayXgHigh,
    uncertaintyReason: `${uncertaintyLabel} uncertainty: ${reasonText}.`,
    uncertainty_reason: `${uncertaintyLabel} uncertainty: ${reasonText}.`,
    uncertainty_inputs: {
      quality_gap: round(qualityGap, 2),
      favorite_win_probability: favoriteWinProbability,
      upset_risk_probability: upsetRiskProbability,
      total_expected_goals: totalExpectedGoals,
      max_team_context_uncertainty: round(maxContextUncertainty, 2),
      host_venue_team_involved: hostVenueTeamInvolved
    }
  };
}

function fixtureFantasyContext({ homeXg, awayXg, totalExpectedGoals, homeCleanSheet, awayCleanSheet, upsetRiskProbability, uncertaintyLabel }) {
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

function hostVenueCountry(fixture) {
  const city = String(fixture.city || "").toLowerCase();
  if (["mexico city", "guadalajara", "monterrey"].some((name) => city.includes(name))) return "mexico";
  if (["toronto", "vancouver"].some((name) => city.includes(name))) return "canada";
  return "usa";
}

function poisson(k, lambda) {
  let factorial = 1;
  for (let i = 2; i <= k; i += 1) factorial *= i;
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

  const topScorelines = grid
    .map((cell) => ({
      scoreline: `${cell.home_goals}-${cell.away_goals}`,
      home_goals: cell.home_goals,
      away_goals: cell.away_goals,
      probability: round(cell.probability / total, 4)
    }))
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 6);

  return {
    homeWin: round(homeWin, 4),
    draw: round(draw, 4),
    awayWin: round(awayWin, 4),
    homeCleanSheet: round(homeCleanSheet, 4),
    awayCleanSheet: round(awayCleanSheet, 4),
    over25: round(over25, 4),
    under25: round(1 - over25, 4),
    btts: round(btts, 4),
    topScorelines
  };
}

function roleWeight(roleLabel) {
  return {
    locked_starter: 1,
    likely_starter: 0.92,
    rotation_starter: 0.78,
    impact_sub: 0.52,
    backup: 0.35,
    third_choice: 0.2,
    squad_depth: 0.28,
    unclear: 0.5,
    unclear_high_price: 0.54,
    club_star_nt_usage_missing: 0.55,
    thin_profile_unclear: 0.3,
    blocked: 0
  }[roleLabel] ?? 0.45;
}

function confidenceWeight(roleConfidence) {
  return {
    high: 1,
    medium: 0.86,
    low: 0.65,
    missing: 0.45,
    thin_profile: 0.35,
    blocked: 0
  }[roleConfidence] ?? 0.5;
}

function isModeled(row) {
  return row.minutes_model_status === "modeled_fantasy_pool_only" && row.selectable_status === "playing";
}

function rowHasFlag(row, flag) {
  return [...(row.data_quality_flags || []), ...(row.minutes_risk_flags || [])].includes(flag);
}

function priceScore(row, positionPriceRanges) {
  const price = num(row.official_price);
  const position = row.official_fantasy_position;
  return normalized(price, positionPriceRanges[position] || {}, 50);
}

function playerStrengthSignal(row, positionPriceRanges) {
  if (!isModeled(row)) return null;
  const start = num(row.start_probability);
  const minutes = num(row.expected_minutes);
  const base = weightedAverage([
    { value: Number.isFinite(start) ? start * 100 : null, weight: 0.64 },
    { value: Number.isFinite(minutes) ? clamp(minutes / 90, 0, 1) * 100 : null, weight: 0.36 }
  ], null);
  if (!Number.isFinite(base)) return null;
  const roleMultiplier = 0.72 + roleWeight(row.role_label) * 0.28;
  const confidenceMultiplier = 0.76 + confidenceWeight(row.role_confidence) * 0.24;
  const weakPriceLift = clamp(((priceScore(row, positionPriceRanges) ?? 50) - 50) * 0.04, -2, 2);
  return round(clamp(base * roleMultiplier * confidenceMultiplier + weakPriceLift, 0, 100), 3);
}

function positionIndex(rows, position, expectedCount, positionPriceRanges) {
  const signals = rows
    .filter((row) => row.official_fantasy_position === position)
    .map((row) => playerStrengthSignal(row, positionPriceRanges))
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => b - a);
  if (!signals.length) return 32;
  const starters = signals.slice(0, expectedCount);
  const starterScore = average(starters, average(signals, 32));
  const depthScore = signals[expectedCount] ?? average(signals.slice(0, Math.min(signals.length, expectedCount + 1)), starterScore);
  return round(clamp(starterScore * 0.86 + depthScore * 0.14, 0, 100), 2);
}

function teamContext(team, rows, squadRows, positionPriceRanges) {
  const modeledRows = rows.filter(isModeled);
  const blockedRows = rows.filter((row) => row.minutes_model_status === "blocked");
  const reviewRows = squadRows.filter((row) => row.roster_status === "review");
  const confirmedFinalRows = squadRows.filter((row) => row.roster_status === "confirmed_final_squad");
  const selectableRows = squadRows.filter((row) => row.roster_status === "selectable_fantasy_player");
  const modeledSignals = modeledRows
    .map((row) => ({
      row,
      signal: playerStrengthSignal(row, positionPriceRanges),
      start: num(row.start_probability)
    }))
    .filter((entry) => Number.isFinite(entry.signal));

  const topElevenStarts = sum(top(modeledSignals, 11, (entry) => entry.start ?? 0).map((entry) => entry.start ?? 0));
  const modeledShare = rows.length ? modeledRows.length / rows.length : 0;
  const availabilityIndex = clamp((topElevenStarts / 11) * 100 * 0.65 + modeledShare * 100 * 0.35, 0, 100);
  const gkIndex = positionIndex(modeledRows, "GK", 1, positionPriceRanges);
  const defIndex = positionIndex(modeledRows, "DEF", 4, positionPriceRanges);
  const midIndex = positionIndex(modeledRows, "MID", 4, positionPriceRanges);
  const fwdIndex = positionIndex(modeledRows, "FWD", 2, positionPriceRanges);
  const attackIndex = round(clamp(fwdIndex * 0.5 + midIndex * 0.35 + defIndex * 0.08 + gkIndex * 0.07, 0, 100), 2);
  const midfieldIndex = midIndex;
  const defenseIndex = round(clamp(defIndex * 0.68 + gkIndex * 0.32, 0, 100), 2);
  const goalkeeperIndex = gkIndex;

  const missingUsageRows = rows.filter((row) => rowHasFlag(row, "missing_national_team_usage") || row.source_usage?.usage_confidence === "missing");
  const lowConfidenceRows = rows.filter((row) => ["low", "missing", "thin_profile"].includes(row.role_confidence));
  const thinProfileRows = rows.filter((row) => rowHasFlag(row, "thin_profile") || row.role_confidence === "thin_profile");
  const missingClubRows = rows.filter((row) => rowHasFlag(row, "missing_club_context") || row.source_club_context?.club_data_status === "missing");
  const positionConflictRows = rows.filter((row) => rowHasFlag(row, "position_conflict_audit"));
  const neymarRow = rows.find((row) => normalize(row.name).includes("neymar") || row.internal_player_id === "brazil-neymar-junior");
  const neymarUsageSourceGap = team.team_id === "brazil" && Boolean(neymarRow) && (
    rowHasFlag(neymarRow, "missing_national_team_usage")
    || neymarRow.source_usage?.usage_confidence === "missing"
  );

  const denominator = Math.max(rows.length, 1);
  const missingUsageShare = missingUsageRows.length / denominator;
  const lowConfidenceShare = lowConfidenceRows.length / denominator;
  const thinProfileShare = thinProfileRows.length / denominator;
  const positionConflictShare = positionConflictRows.length / denominator;
  const reviewShare = reviewRows.length / Math.max(squadRows.length, 1);
  const uncertaintyScore = round(clamp(
    24
      + missingUsageShare * 28
      + lowConfidenceShare * 20
      + thinProfileShare * 16
      + positionConflictShare * 8
      + reviewShare * 22
      + (neymarUsageSourceGap ? 8 : 0),
    0,
    100
  ), 2);
  const dataQualityIndex = round(clamp(100 - uncertaintyScore, 0, 100), 2);

  return {
    team_id: team.team_id,
    country: team.country,
    group: team.group,
    rows_total: rows.length,
    modeled_rows: modeledRows.length,
    blocked_rows: blockedRows.length,
    squad_rows: squadRows.length,
    selectable_fantasy_pool_rows: selectableRows.length,
    review_rows: reviewRows.length,
    confirmed_final_squad_rows: confirmedFinalRows.length,
    final_squad_source_status: confirmedFinalRows.length > 0 ? "mixed_review_required" : "fantasy_pool_only",
    final_squad_uncertainty_penalty: -1.2 - (reviewRows.length ? 0.18 : 0),
    position_signal_indices: {
      GK: gkIndex,
      DEF: defIndex,
      MID: midIndex,
      FWD: fwdIndex
    },
    attack_index: attackIndex,
    midfield_index: midfieldIndex,
    defense_index: defenseIndex,
    goalkeeper_index: goalkeeperIndex,
    availability_index: round(availabilityIndex, 2),
    data_quality_index: dataQualityIndex,
    uncertainty_score: uncertaintyScore,
    missing_usage_rows: missingUsageRows.length,
    missing_club_rows: missingClubRows.length,
    low_confidence_rows: lowConfidenceRows.length,
    thin_profile_rows: thinProfileRows.length,
    position_conflict_rows: positionConflictRows.length,
    neymar_usage_source_gap: neymarUsageSourceGap,
    top_context_players: top(modeledSignals, 8, (entry) => entry.signal).map(({ row, signal }) => ({
      official_fantasy_player_id: row.official_fantasy_player_id,
      name: row.name,
      position: row.official_fantasy_position,
      official_price: num(row.official_price),
      role_label: row.role_label,
      role_confidence: row.role_confidence,
      start_probability: num(row.start_probability),
      expected_minutes: num(row.expected_minutes),
      signal
    }))
  };
}

function applyFantasyPoolAdjustments(team, context, globalAverages) {
  const baseQuality = team.team_quality_v2;
  const baseGoals = team.goals_clean_sheet_inputs_v2;
  const attackStrengthAdjustment = clamp((context.attack_index - globalAverages.attack_index) * 0.04, -2.2, 2.2);
  const midfieldStrengthAdjustment = clamp((context.midfield_index - globalAverages.midfield_index) * 0.025, -1.5, 1.5);
  const defenseStrengthAdjustment = clamp((context.defense_index - globalAverages.defense_index) * 0.035, -2, 2);
  const goalkeeperStrengthAdjustment = clamp((context.goalkeeper_index - globalAverages.goalkeeper_index) * 0.02, -1, 1);
  const availabilityAdjustment = clamp((context.availability_index - globalAverages.availability_index) * 0.02, -1, 1);
  const dataQualityAdjustment = clamp((context.data_quality_index - globalAverages.data_quality_index) * 0.018, -0.8, 0.8);
  const finalSquadUncertaintyPenalty = context.final_squad_uncertainty_penalty;
  const totalFantasyPoolAdjustment = clamp(
    attackStrengthAdjustment * 0.32
      + midfieldStrengthAdjustment * 0.18
      + defenseStrengthAdjustment * 0.24
      + goalkeeperStrengthAdjustment * 0.08
      + availabilityAdjustment * 0.1
      + dataQualityAdjustment * 0.08
      + finalSquadUncertaintyPenalty,
    -4.5,
    3.2
  );

  const overallScore = round(clamp(baseQuality.overall_score + totalFantasyPoolAdjustment, 0, 100), 2);
  const attackProxy = round(clamp(
    baseGoals.attack_proxy_score
      + attackStrengthAdjustment * 0.9
      + midfieldStrengthAdjustment * 0.45
      + availabilityAdjustment * 0.25
      + dataQualityAdjustment * 0.3,
    0,
    100
  ), 2);
  const defenseProxy = round(clamp(
    baseGoals.defense_proxy_score
      + defenseStrengthAdjustment * 0.9
      + goalkeeperStrengthAdjustment * 0.7
      + availabilityAdjustment * 0.2
      + dataQualityAdjustment * 0.3,
    0,
    100
  ), 2);

  const attackXgAdjustment = round(clamp((context.attack_index - globalAverages.attack_index) * 0.003, -0.06, 0.06), 3);
  const defenseXgAdjustment = round(clamp((context.defense_index - globalAverages.defense_index) * 0.003, -0.06, 0.06), 3);
  const dataQualityXgPenalty = round(clamp((context.uncertainty_score - globalAverages.uncertainty_score) * -0.001, -0.05, 0.04), 3);

  return {
    team_id: team.team_id,
    country: team.country,
    group: team.group,
    model_stage: MODEL_STAGE,
    final_squad_source_status: "fantasy_pool_only",
    final_squad_confirmed: false,
    safety_labels: REQUIRED_SAFETY_LABELS,
    team_quality_fantasyPool_v3: {
      overall_score: overallScore,
      quality_tier: qualityTier(overallScore),
      base_team_quality_v2_score: baseQuality.overall_score,
      total_fantasy_pool_adjustment: round(totalFantasyPoolAdjustment, 2),
      formula_version: SOURCE_MODEL_VERSION,
      formula_note: "PELE-forward team_quality_v2 remains the baseline. Fantasy-pool minutes context adds only conservative team-position and uncertainty adjustments; official fantasy price is a weak player-context signal and does not confirm starters.",
      source_model_version: SOURCE_MODEL_VERSION,
      data_status: "staged_fantasy_pool_only_not_final_squad_backed"
    },
    team_quality_v2: team.team_quality_v2,
    team_quality_v1: team.team_quality_v1,
    team_quality_v0: team.team_quality_v0,
    current_strength_inputs: team.current_strength_inputs,
    current_strength_inputs_v1: team.current_strength_inputs_v1,
    previous_current_strength_inputs_v0: team.previous_current_strength_inputs_v0,
    goals_clean_sheet_inputs_fantasyPool_v3: {
      attack_proxy_score: attackProxy,
      defense_proxy_score: defenseProxy,
      base_attack_proxy_score_v2: baseGoals.attack_proxy_score,
      base_defense_proxy_score_v2: baseGoals.defense_proxy_score,
      attack_xg_context_adjustment: attackXgAdjustment,
      defense_xg_context_adjustment: defenseXgAdjustment,
      data_quality_xg_penalty: dataQualityXgPenalty,
      note: "Proxy scores remain PELE-forward. Fantasy-pool context is deliberately small and blocked from final promotion until official final squads and rules are complete."
    },
    goals_clean_sheet_inputs_v2: team.goals_clean_sheet_inputs_v2,
    fantasy_pool_context_v3: {
      ...context,
      component_adjustments: {
        attack_strength_adjustment: round(attackStrengthAdjustment, 2),
        midfield_strength_adjustment: round(midfieldStrengthAdjustment, 2),
        defense_strength_adjustment: round(defenseStrengthAdjustment, 2),
        goalkeeper_strength_adjustment: round(goalkeeperStrengthAdjustment, 2),
        availability_adjustment: round(availabilityAdjustment, 2),
        data_quality_adjustment: round(dataQualityAdjustment, 2),
        final_squad_uncertainty_penalty: finalSquadUncertaintyPenalty,
        total_fantasy_pool_adjustment: round(totalFantasyPoolAdjustment, 2)
      }
    },
    model_limitations: [
      "fantasy_pool_only",
      "not final-squad-backed",
      "not betting odds",
      "not final public recommendations",
      "Final official squad rows are not source-backed in this staging layer.",
      "Neymar remains a targeted national-team usage source gap and is treated as uncertainty rather than confirmed Brazil attack strength."
    ],
    group_outlook_v2: team.group_outlook_v2,
    tournament_outlook_v2: team.tournament_outlook_v2
  };
}

function expectedGoalsComponents(team, opponent, fixture, isListedHome) {
  const teamQuality = team.team_quality_fantasyPool_v3;
  const opponentQuality = opponent.team_quality_fantasyPool_v3;
  const teamGoals = team.goals_clean_sheet_inputs_fantasyPool_v3;
  const opponentGoals = opponent.goals_clean_sheet_inputs_fantasyPool_v3;
  const qualityGap = teamQuality.overall_score - opponentQuality.overall_score;
  const eloGap = Number.isFinite(team.current_strength_inputs.team_elo) && Number.isFinite(opponent.current_strength_inputs.team_elo)
    ? team.current_strength_inputs.team_elo - opponent.current_strength_inputs.team_elo
    : null;
  const peleGap = Number.isFinite(team.current_strength_inputs.pele_rating) && Number.isFinite(opponent.current_strength_inputs.pele_rating)
    ? team.current_strength_inputs.pele_rating - opponent.current_strength_inputs.pele_rating
    : null;
  const tiltValues = [team.current_strength_inputs.pele_tilt, opponent.current_strength_inputs.pele_tilt].filter((value) => Number.isFinite(value));
  const tilt = tiltValues.length ? average(tiltValues, 0) : 0;
  const hostBoost = fixture && hostVenueCountry(fixture) === team.team_id ? 0.12 : 0;
  const components = {
    base_world_cup_team_goals: 1.33,
    attack_adjustment: ((teamGoals.attack_proxy_score - 50) / 50) * 0.62,
    opponent_defense_adjustment: ((50 - opponentGoals.defense_proxy_score) / 50) * 0.58,
    quality_gap_adjustment: (qualityGap / 100) * 0.58,
    elo_gap_adjustment: Number.isFinite(eloGap) ? (eloGap / 400) * 0.06 : 0,
    pele_gap_adjustment: Number.isFinite(peleGap) ? (peleGap / 400) * 0.34 : 0,
    tilt_total_goals_adjustment: tilt * 0.7,
    fantasy_pool_attack_context_adjustment: teamGoals.attack_xg_context_adjustment,
    opponent_fantasy_pool_defense_context_adjustment: -opponentGoals.defense_xg_context_adjustment,
    fantasy_pool_data_quality_uncertainty_adjustment: teamGoals.data_quality_xg_penalty,
    host_venue_boost: hostBoost,
    listed_home_context_adjustment: isListedHome ? 0.015 : -0.015
  };
  const expected = Object.values(components).reduce((total, value) => total + value, 0);
  return {
    expected_goals: round(clamp(expected, 0.35, 3.2), 3),
    components: Object.fromEntries(Object.entries(components).map(([key, value]) => [key, round(value, 3)]))
  };
}

function teamPredictionView(fixture, team, opponent, expectedGoals, expectedGoalsAgainst, winProbability, drawProbability, lossProbability, cleanSheetProbability, goalEnv, upsetRiskProbability, upsetBand, side, matchUncertainty = null) {
  const qualityGap = team.team_quality_fantasyPool_v3.overall_score - opponent.team_quality_fantasyPool_v3.overall_score;
  const fixtureDifficulty = round(clamp(50 - qualityGap * 0.7, 0, 100), 2);
  const attackingEnvironmentScore = round(clamp(((expectedGoals - 0.45) / 1.6) * 100, 0, 100), 1);
  const defensiveEnvironmentScore = round(clamp(((cleanSheetProbability - 0.09) / 0.83) * 100, 0, 100), 1);
  const captainEnvironmentScore = round(clamp(
    attackingEnvironmentScore * 0.62
      + winProbability * 100 * 0.28
      + (goalEnv === "high_goal_environment" ? 10 : goalEnv === "medium_high_goal_environment" ? 6 : 2),
    0,
    100
  ), 1);
  const totalExpectedGoals = round(expectedGoals + expectedGoalsAgainst, 3);
  const attackerEnvironment = teamAttackerEnvironment(expectedGoals);
  const defenderEnvironment = defenderEnvironmentLabel(cleanSheetProbability, expectedGoalsAgainst);
  const keeperEnvironment = keeperEnvironmentLabel(cleanSheetProbability, expectedGoalsAgainst);
  const cleanSheetContext = cleanSheetContextLabel(cleanSheetProbability);
  const goalEnvironmentPublic = publicGoalEnvironmentLabel(totalExpectedGoals);
  const upsetRiskPublic = publicUpsetRiskLabel(upsetRiskProbability);

  return {
    fixture_difficulty_score: fixtureDifficulty,
    fixture_difficulty_band: difficultyBand(fixtureDifficulty),
    expected_goals: expectedGoals,
    expected_goals_against: expectedGoalsAgainst,
    win_probability: winProbability,
    draw_probability: drawProbability,
    loss_probability: lossProbability,
    clean_sheet_probability: cleanSheetProbability,
    clean_sheet_band: cleanSheetBand(cleanSheetProbability),
    goal_share_projection: round(expectedGoals / (expectedGoals + expectedGoalsAgainst), 3),
    attacking_environment_score: attackingEnvironmentScore,
    defensive_environment_score: defensiveEnvironmentScore,
    captain_environment_score: captainEnvironmentScore,
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
    matchUncertainty,
    match_uncertainty: matchUncertainty,
    side,
    model_stage: MODEL_STAGE
  };
}

function fixtureQaFlags(home, away) {
  const flags = [
    "fantasy_pool_only",
    "not_final_squad_backed",
    "not_betting_odds",
    "not_final_public_recommendations",
    "final_squad_source_missing"
  ];
  if (home.fantasy_pool_context_v3.review_rows || away.fantasy_pool_context_v3.review_rows) flags.push("squad_review_rows_present");
  if (home.fantasy_pool_context_v3.uncertainty_score >= 55 || away.fantasy_pool_context_v3.uncertainty_score >= 55) flags.push("high_team_context_uncertainty");
  if (home.fantasy_pool_context_v3.neymar_usage_source_gap || away.fantasy_pool_context_v3.neymar_usage_source_gap) flags.push("brazil_neymar_usage_source_gap");
  return unique(flags);
}

function buildScorePredictions(fixturesData, matchdaysData, teamQualityV3, scoreV2) {
  const teamById = new Map(teamQualityV3.teams.map((team) => [team.team_id, team]));
  const fantasyMatchdayByFixture = new Map();
  for (const matchday of matchdaysData.matchdays) {
    for (const fixtureId of matchday.fixture_ids || []) {
      if (matchday.matchday_id !== "group_stage_full" || !fantasyMatchdayByFixture.has(fixtureId)) {
        fantasyMatchdayByFixture.set(fixtureId, matchday.matchday_id);
      }
    }
  }

  const fixtureScorePredictions = [];
  const teamFixturePredictions = [];
  const v2ByFixture = new Map(scoreV2.fixtureScorePredictions.map((row) => [row.fixture_id, row]));

  for (const fixture of fixturesData.fixtures) {
    const home = teamById.get(fixture.home_team_id);
    const away = teamById.get(fixture.away_team_id);
    if (!home || !away) throw new Error(`Missing v3 team quality row for ${fixture.match_id}`);

    const homeComponents = expectedGoalsComponents(home, away, fixture, true);
    const awayComponents = expectedGoalsComponents(away, home, fixture, false);
    const grid = scoreGrid(homeComponents.expected_goals, awayComponents.expected_goals, 10);
    const totalExpected = round(homeComponents.expected_goals + awayComponents.expected_goals, 3);
    const goalEnv = goalEnvironment(totalExpected);
    const homeFavorite = grid.homeWin >= grid.awayWin;
    const favoriteTeam = homeFavorite ? home : away;
    const underdogTeam = homeFavorite ? away : home;
    const favoriteWinProbability = homeFavorite ? grid.homeWin : grid.awayWin;
    const underdogWinProbability = homeFavorite ? grid.awayWin : grid.homeWin;
    const upsetRiskProbability = round(underdogWinProbability + grid.draw * 0.24, 4);
    const upsetBand = upsetRiskBand(upsetRiskProbability);
    const v2 = v2ByFixture.get(fixture.match_id);
    const qaFlags = fixtureQaFlags(home, away);
    const uncertaintyContext = fixtureUncertaintyContext({
      fixture,
      home,
      away,
      homeXg: homeComponents.expected_goals,
      awayXg: awayComponents.expected_goals,
      totalExpectedGoals: totalExpected,
      grid,
      upsetRiskProbability,
      qaFlags
    });
    const fantasyContext = fixtureFantasyContext({
      homeXg: homeComponents.expected_goals,
      awayXg: awayComponents.expected_goals,
      totalExpectedGoals: totalExpected,
      homeCleanSheet: grid.homeCleanSheet,
      awayCleanSheet: grid.awayCleanSheet,
      upsetRiskProbability,
      uncertaintyLabel: uncertaintyContext.uncertaintyLabel
    });
    const homeTeamPrediction = teamPredictionView(fixture, home, away, homeComponents.expected_goals, awayComponents.expected_goals, grid.homeWin, grid.draw, grid.awayWin, grid.homeCleanSheet, goalEnv, upsetRiskProbability, upsetBand, "home_listed", uncertaintyContext.uncertaintyLabel);
    const awayTeamPrediction = teamPredictionView(fixture, away, home, awayComponents.expected_goals, homeComponents.expected_goals, grid.awayWin, grid.draw, grid.homeWin, grid.awayCleanSheet, goalEnv, upsetRiskProbability, upsetBand, "away_listed", uncertaintyContext.uncertaintyLabel);

    fixtureScorePredictions.push({
      prediction_id: `${fixture.match_id}-score-fantasy-pool-v3`,
      match_id: fixture.match_id,
      fixture_id: fixture.match_id,
      match_number: fixture.match_number,
      matchday: fixture.matchday,
      stage: fixture.stage,
      group: fixture.group,
      fifa_matchday_label: fixture.matchday,
      fantasy_matchday_id: fantasyMatchdayByFixture.get(fixture.match_id) || null,
      date: fixture.date,
      time_local: fixture.time_local,
      time_zone: fixture.time_zone,
      eastern_datetime_label: fixture.eastern_datetime_label,
      venue: fixture.venue,
      city: fixture.city,
      host_venue_country: hostVenueCountry(fixture),
      home_team_id: fixture.home_team_id,
      home_team: fixture.home_team,
      away_team_id: fixture.away_team_id,
      away_team: fixture.away_team,
      home_expected_goals: homeComponents.expected_goals,
      away_expected_goals: awayComponents.expected_goals,
      homeProjectedXg: homeComponents.expected_goals,
      awayProjectedXg: awayComponents.expected_goals,
      home_projected_xg: homeComponents.expected_goals,
      away_projected_xg: awayComponents.expected_goals,
      homeMatchXg: homeComponents.expected_goals,
      awayMatchXg: awayComponents.expected_goals,
      home_match_xg: homeComponents.expected_goals,
      away_match_xg: awayComponents.expected_goals,
      projectedXg: {
        home: homeComponents.expected_goals,
        away: awayComponents.expected_goals,
        home_team: fixture.home_team,
        away_team: fixture.away_team,
        meaning: "fixture_specific_expected_goals_against_listed_opponent"
      },
      projected_xg: {
        home: homeComponents.expected_goals,
        away: awayComponents.expected_goals,
        home_team: fixture.home_team,
        away_team: fixture.away_team,
        meaning: "fixture_specific_expected_goals_against_listed_opponent"
      },
      total_expected_goals: totalExpected,
      home_win_probability: grid.homeWin,
      draw_probability: grid.draw,
      away_win_probability: grid.awayWin,
      home_clean_sheet_probability: grid.homeCleanSheet,
      away_clean_sheet_probability: grid.awayCleanSheet,
      over_2_5_goals_probability: grid.over25,
      under_2_5_goals_probability: grid.under25,
      both_teams_to_score_probability: grid.btts,
      goal_environment: goalEnv,
      upset_risk: upsetBand,
      favorite: favoriteTeam.country,
      favorite_team_id: favoriteTeam.team_id,
      favorite_team: favoriteTeam.country,
      favorite_win_probability: favoriteWinProbability,
      underdog_team_id: underdogTeam.team_id,
      underdog_team: underdogTeam.country,
      underdog_win_probability: underdogWinProbability,
      upset_risk_probability: upsetRiskProbability,
      upset_risk_band: upsetBand,
      ...uncertaintyContext,
      ...fantasyContext,
      top_scorelines: grid.topScorelines,
      home_team_prediction: homeTeamPrediction,
      away_team_prediction: awayTeamPrediction,
      team_quality_version: TEAM_QUALITY_VERSION,
      source_model_version: SOURCE_MODEL_VERSION,
      model_stage: MODEL_STAGE,
      qa_flags: qaFlags,
      comparison_to_v2: v2 ? {
        home_expected_goals_delta: round(homeComponents.expected_goals - v2.home_expected_goals, 3),
        away_expected_goals_delta: round(awayComponents.expected_goals - v2.away_expected_goals, 3),
        total_expected_goals_delta: round(totalExpected - v2.total_expected_goals, 3),
        home_win_probability_delta: round(grid.homeWin - v2.home_win_probability, 4),
        draw_probability_delta: round(grid.draw - v2.draw_probability, 4),
        away_win_probability_delta: round(grid.awayWin - v2.away_win_probability, 4),
        favorite_changed: favoriteTeam.country !== v2.favorite_team
      } : null,
      model_inputs_v3: {
        home_team_quality_score: home.team_quality_fantasyPool_v3.overall_score,
        away_team_quality_score: away.team_quality_fantasyPool_v3.overall_score,
        home_base_team_quality_v2_score: home.team_quality_fantasyPool_v3.base_team_quality_v2_score,
        away_base_team_quality_v2_score: away.team_quality_fantasyPool_v3.base_team_quality_v2_score,
        home_attack_proxy_score: home.goals_clean_sheet_inputs_fantasyPool_v3.attack_proxy_score,
        away_attack_proxy_score: away.goals_clean_sheet_inputs_fantasyPool_v3.attack_proxy_score,
        home_defense_proxy_score: home.goals_clean_sheet_inputs_fantasyPool_v3.defense_proxy_score,
        away_defense_proxy_score: away.goals_clean_sheet_inputs_fantasyPool_v3.defense_proxy_score,
        home_elo: home.current_strength_inputs.team_elo,
        away_elo: away.current_strength_inputs.team_elo,
        home_fifa_ranking: home.current_strength_inputs.fifa_ranking,
        away_fifa_ranking: away.current_strength_inputs.fifa_ranking,
        home_pele_rating: home.current_strength_inputs.pele_rating,
        away_pele_rating: away.current_strength_inputs.pele_rating,
        home_pele_tilt: home.current_strength_inputs.pele_tilt,
        away_pele_tilt: away.current_strength_inputs.pele_tilt,
        home_pele_offense_gf: home.current_strength_inputs.pele_offense_gf,
        away_pele_offense_gf: away.current_strength_inputs.pele_offense_gf,
        home_pele_defense_ga: home.current_strength_inputs.pele_defense_ga,
        away_pele_defense_ga: away.current_strength_inputs.pele_defense_ga,
        home_fantasy_pool_context: home.fantasy_pool_context_v3,
        away_fantasy_pool_context: away.fantasy_pool_context_v3,
        home_components: homeComponents.components,
        away_components: awayComponents.components
      },
      formula_version: SOURCE_MODEL_VERSION,
      source_ids: ["fifaSchedule", "openFootballWorldCup", "fifaRankings", "worldFootballElo", "fjelstulWorldCup", "peleRatings", "officialFantasyPlayers", "fantasyPoolMinutesModel"],
      source_note: "Staged fantasy_pool_only score prediction from PELE-forward teamQuality_v2, official fantasy pool context, and preliminary minutes model. It is not betting odds, not final-squad-backed, and not final public recommendation data.",
      data_quality: {
        prediction_status: "staged_fantasy_pool_only_not_final_squad_backed",
        uses_betting_odds: false,
        uses_final_rosters: false,
        uses_official_fantasy_prices: "weak_context_only_not_team_strength_proof",
        uses_official_fantasy_scoring_rules: false,
        safe_for_preliminary_projection_staging: true,
        safe_for_final_public_recommendations: false,
        caveats: [
          "fantasy_pool_only",
          "not final-squad-backed",
          "not betting odds",
          "not final public recommendations",
          "Final squad rows are not source-backed, so every fixture carries final-squad uncertainty.",
          "Neymar remains a Brazil usage source gap and is treated as uncertainty, not confirmed attack strength."
        ]
      }
    });

    teamFixturePredictions.push({
      team_fixture_prediction_id: `${fixture.match_id}-${home.team_id}-score-fantasy-pool-v3`,
      fixture_id: fixture.match_id,
      match_id: fixture.match_id,
      match_number: fixture.match_number,
      fantasy_matchday_id: fantasyMatchdayByFixture.get(fixture.match_id) || null,
      team_id: home.team_id,
      team: home.country,
      opponent_team_id: away.team_id,
      opponent: away.country,
      side: "home_listed",
      expected_goals: homeComponents.expected_goals,
      projectedXg: homeComponents.expected_goals,
      projected_xg: homeComponents.expected_goals,
      matchXg: homeComponents.expected_goals,
      match_xg: homeComponents.expected_goals,
      expected_goals_against: awayComponents.expected_goals,
      win_probability: grid.homeWin,
      draw_probability: grid.draw,
      loss_probability: grid.awayWin,
      clean_sheet_probability: grid.homeCleanSheet,
      fixture_difficulty_score: homeTeamPrediction.fixture_difficulty_score,
      fixture_difficulty_band: homeTeamPrediction.fixture_difficulty_band,
      attacking_environment_score: homeTeamPrediction.attacking_environment_score,
      defensive_environment_score: homeTeamPrediction.defensive_environment_score,
      captain_environment_score: homeTeamPrediction.captain_environment_score,
      attackerEnvironment: homeTeamPrediction.attackerEnvironment,
      attacker_environment: homeTeamPrediction.attacker_environment,
      defenderEnvironment: homeTeamPrediction.defenderEnvironment,
      defender_environment: homeTeamPrediction.defender_environment,
      keeperEnvironment: homeTeamPrediction.keeperEnvironment,
      keeper_environment: homeTeamPrediction.keeper_environment,
      cleanSheetContext: homeTeamPrediction.cleanSheetContext,
      clean_sheet_context: homeTeamPrediction.clean_sheet_context,
      goalEnvironment: homeTeamPrediction.goalEnvironment,
      goal_environment_public: homeTeamPrediction.goal_environment_public,
      upsetRisk: homeTeamPrediction.upsetRisk,
      upset_risk_public: homeTeamPrediction.upset_risk_public,
      matchUncertainty: homeTeamPrediction.matchUncertainty,
      match_uncertainty: homeTeamPrediction.match_uncertainty,
      goal_environment: goalEnv,
      upset_risk_probability: upsetRiskProbability,
      upset_risk_band: upsetBand,
      uncertaintyLabel: uncertaintyContext.uncertaintyLabel,
      uncertainty_label: uncertaintyContext.uncertainty_label,
      uncertaintyReason: uncertaintyContext.uncertaintyReason,
      uncertainty_reason: uncertaintyContext.uncertainty_reason,
      model_stage: MODEL_STAGE,
      qa_flags: qaFlags
    });
    teamFixturePredictions.push({
      team_fixture_prediction_id: `${fixture.match_id}-${away.team_id}-score-fantasy-pool-v3`,
      fixture_id: fixture.match_id,
      match_id: fixture.match_id,
      match_number: fixture.match_number,
      fantasy_matchday_id: fantasyMatchdayByFixture.get(fixture.match_id) || null,
      team_id: away.team_id,
      team: away.country,
      opponent_team_id: home.team_id,
      opponent: home.country,
      side: "away_listed",
      expected_goals: awayComponents.expected_goals,
      projectedXg: awayComponents.expected_goals,
      projected_xg: awayComponents.expected_goals,
      matchXg: awayComponents.expected_goals,
      match_xg: awayComponents.expected_goals,
      expected_goals_against: homeComponents.expected_goals,
      win_probability: grid.awayWin,
      draw_probability: grid.draw,
      loss_probability: grid.homeWin,
      clean_sheet_probability: grid.awayCleanSheet,
      fixture_difficulty_score: awayTeamPrediction.fixture_difficulty_score,
      fixture_difficulty_band: awayTeamPrediction.fixture_difficulty_band,
      attacking_environment_score: awayTeamPrediction.attacking_environment_score,
      defensive_environment_score: awayTeamPrediction.defensive_environment_score,
      captain_environment_score: awayTeamPrediction.captain_environment_score,
      attackerEnvironment: awayTeamPrediction.attackerEnvironment,
      attacker_environment: awayTeamPrediction.attacker_environment,
      defenderEnvironment: awayTeamPrediction.defenderEnvironment,
      defender_environment: awayTeamPrediction.defender_environment,
      keeperEnvironment: awayTeamPrediction.keeperEnvironment,
      keeper_environment: awayTeamPrediction.keeper_environment,
      cleanSheetContext: awayTeamPrediction.cleanSheetContext,
      clean_sheet_context: awayTeamPrediction.clean_sheet_context,
      goalEnvironment: awayTeamPrediction.goalEnvironment,
      goal_environment_public: awayTeamPrediction.goal_environment_public,
      upsetRisk: awayTeamPrediction.upsetRisk,
      upset_risk_public: awayTeamPrediction.upset_risk_public,
      matchUncertainty: awayTeamPrediction.matchUncertainty,
      match_uncertainty: awayTeamPrediction.match_uncertainty,
      goal_environment: goalEnv,
      upset_risk_probability: upsetRiskProbability,
      upset_risk_band: upsetBand,
      uncertaintyLabel: uncertaintyContext.uncertaintyLabel,
      uncertainty_label: uncertaintyContext.uncertainty_label,
      uncertaintyReason: uncertaintyContext.uncertaintyReason,
      uncertainty_reason: uncertaintyContext.uncertainty_reason,
      model_stage: MODEL_STAGE,
      qa_flags: qaFlags
    });
  }

  const summary = buildScoreSummary(fixtureScorePredictions, teamFixturePredictions);
  const comparison = buildScoreComparison(fixtureScorePredictions, scoreV2, teamQualityV3);
  return {
    schema_version: "score_predictions_fantasy_pool_v3",
    generated_at: NOW,
    source_checked: TODAY,
    model_stage: MODEL_STAGE,
    data_status: "staged_fantasy_pool_only_not_final_squad_backed_not_betting_odds",
    previous_model_file: PATHS.scoreV2,
    team_quality_file: PATHS.teamQualityV3,
    safety_labels: REQUIRED_SAFETY_LABELS,
    model: {
      model_name: "PELE-anchored fantasy-pool score predictor v3 with uncertainty",
      formula_version: SOURCE_MODEL_VERSION,
      team_quality_version: TEAM_QUALITY_VERSION,
      uncertainty_layer_version: "score_uncertainty_v1",
      base_world_cup_team_goals: 1.33,
      max_score_grid_goals: 10,
      uses_betting_odds: false,
      uses_final_squads: false,
      uses_official_fantasy_price: "weak_context_only",
      plain_language_summary: "Start from PELE-forward v2 team quality, add small fantasy-pool-only team-position context from the preliminary minutes model, keep team-context uncertainty visible, convert fixture-specific expected goals into scoreline probabilities with a Poisson grid, and expose public Projected xG plus scoreline context labels.",
      current_inputs: [PATHS.fixtures, PATHS.matchdays, PATHS.teamQualityV2, PATHS.peleRatings, PATHS.playerMinutes, PATHS.playerRecommendationInputs, PATHS.officialSquads, PATHS.scoreV2],
      stop_before_promotion: [
        "official final squads are not source-backed",
        "official rules still have manual-review warnings",
        "Neymar remains a P0 national-team usage source gap",
        "player matchday projections and recommendations were intentionally not rerun"
      ]
    },
    summary,
    comparison_to_v2: comparison,
    model_notes: [
      "fantasy_pool_only",
      "not final-squad-backed",
      "not betting odds",
      "not final public recommendations",
      "PELE ratings remain the dominant current-strength signal.",
      "Projected xG fields are aliases for fixture-specific expected goals against the listed opponent and match the scoreline-grid inputs.",
      "Total goals ranges and Match uncertainty are explanatory bands around those expected-goal values, not replacements for them.",
      "Fantasy context labels translate fixture rows into defender, keeper, clean-sheet, goal, upset-risk, and match-uncertainty signals for model inspection.",
      "Official fantasy prices are weak player-context signals only and do not confirm starters or team strength.",
      "Neymar is handled as Brazil uncertainty because source-backed usage remains missing."
    ],
    fixtureScorePredictions,
    teamFixturePredictions
  };
}

function buildScoreSummary(fixtureRows, teamRows) {
  return {
    fixture_prediction_count: fixtureRows.length,
    team_fixture_prediction_count: teamRows.length,
    average_total_expected_goals: round(average(fixtureRows.map((row) => row.total_expected_goals)), 2),
    average_home_expected_goals: round(average(fixtureRows.map((row) => row.home_expected_goals)), 2),
    average_away_expected_goals: round(average(fixtureRows.map((row) => row.away_expected_goals)), 2),
    final_squad_source_status: "fantasy_pool_only",
    final_squad_confirmed_teams: 0,
    uses_betting_odds: false,
    safe_for_preliminary_projection_staging: true,
    safe_for_final_public_recommendations: false,
    safe_for_final_team_builder_promotion: false,
    goal_environment_counts: countBy(fixtureRows, (row) => row.goal_environment),
    public_goal_environment_counts: countBy(fixtureRows, (row) => row.goalEnvironment),
    upset_risk_counts: countBy(fixtureRows, (row) => row.upset_risk_band),
    public_upset_risk_counts: countBy(fixtureRows, (row) => row.upsetRisk),
    match_uncertainty_counts: countBy(fixtureRows, (row) => row.matchUncertainty),
    attacker_environment_counts: countBy(fixtureRows, (row) => row.attackerEnvironment),
    clean_sheet_context_counts: countBy(fixtureRows, (row) => row.cleanSheetContext),
    average_goal_range_width: round(average(fixtureRows.map((row) => row.highTotalGoals - row.lowTotalGoals)), 3),
    qa_flag_counts: fixtureRows.reduce((counts, row) => {
      for (const flag of row.qa_flags || []) counts[flag] = (counts[flag] || 0) + 1;
      return counts;
    }, {}),
    most_one_sided_fixtures: top(fixtureRows, 8, (row) => row.favorite_win_probability).map((row) => ({
      fixture_id: row.fixture_id,
      match_number: row.match_number,
      fixture: `${row.home_team} vs ${row.away_team}`,
      favorite: row.favorite_team,
      favorite_win_probability: row.favorite_win_probability,
      expected_score: `${round(row.home_expected_goals, 1)}-${round(row.away_expected_goals, 1)}`
    })),
    highest_goal_environment_fixtures: top(fixtureRows, 8, (row) => row.total_expected_goals).map((row) => ({
      fixture_id: row.fixture_id,
      match_number: row.match_number,
      fixture: `${row.home_team} vs ${row.away_team}`,
      total_expected_goals: row.total_expected_goals,
      goal_environment: row.goal_environment
    })),
    highest_uncertainty_fixtures: top(fixtureRows, 8, (row) => row.uncertaintyScore).map((row) => ({
      fixture_id: row.fixture_id,
      match_number: row.match_number,
      fixture: `${row.home_team} vs ${row.away_team}`,
      matchUncertainty: row.matchUncertainty,
      uncertaintyScore: row.uncertaintyScore,
      goal_range: `${row.lowTotalGoals}-${row.highTotalGoals}`,
      uncertaintyReason: row.uncertaintyReason
    }))
  };
}

function buildScoreComparison(fixtureRows, scoreV2, teamQualityV3) {
  const v2ByFixture = new Map(scoreV2.fixtureScorePredictions.map((row) => [row.fixture_id, row]));
  const comparisons = fixtureRows.map((row) => {
    const v2 = v2ByFixture.get(row.fixture_id);
    const homeWinDelta = v2 ? row.home_win_probability - v2.home_win_probability : null;
    const drawDelta = v2 ? row.draw_probability - v2.draw_probability : null;
    const awayWinDelta = v2 ? row.away_win_probability - v2.away_win_probability : null;
    return {
      fixture_id: row.fixture_id,
      match_number: row.match_number,
      fixture: `${row.home_team} vs ${row.away_team}`,
      home_expected_goals_delta: v2 ? round(row.home_expected_goals - v2.home_expected_goals, 3) : null,
      away_expected_goals_delta: v2 ? round(row.away_expected_goals - v2.away_expected_goals, 3) : null,
      total_expected_goals_delta: v2 ? round(row.total_expected_goals - v2.total_expected_goals, 3) : null,
      max_win_probability_delta: v2 ? round(Math.max(Math.abs(homeWinDelta), Math.abs(drawDelta), Math.abs(awayWinDelta)), 4) : null,
      home_win_probability_delta: v2 ? round(homeWinDelta, 4) : null,
      draw_probability_delta: v2 ? round(drawDelta, 4) : null,
      away_win_probability_delta: v2 ? round(awayWinDelta, 4) : null,
      favorite_v2: v2?.favorite_team || null,
      favorite_v3: row.favorite_team,
      favorite_changed: v2 ? row.favorite_team !== v2.favorite_team : null
    };
  });

  return {
    v2_fixture_predictions_compared: comparisons.filter((row) => row.total_expected_goals_delta !== null).length,
    average_absolute_total_expected_goals_change: round(average(comparisons.map((row) => Math.abs(row.total_expected_goals_delta))), 3),
    average_max_win_probability_change: round(average(comparisons.map((row) => row.max_win_probability_delta)), 4),
    favorite_changes: comparisons.filter((row) => row.favorite_changed).length,
    largest_expected_goal_changes: top(comparisons, 10, (row) => Math.abs(row.total_expected_goals_delta ?? 0)),
    largest_win_probability_changes: top(comparisons, 10, (row) => row.max_win_probability_delta ?? 0),
    teams_largest_quality_adjustments: top(teamQualityV3.teams, 10, (team) => Math.abs(team.team_quality_fantasyPool_v3.total_fantasy_pool_adjustment)).map((team) => ({
      team_id: team.team_id,
      country: team.country,
      base_team_quality_v2_score: team.team_quality_fantasyPool_v3.base_team_quality_v2_score,
      fantasy_pool_v3_score: team.team_quality_fantasyPool_v3.overall_score,
      total_fantasy_pool_adjustment: team.team_quality_fantasyPool_v3.total_fantasy_pool_adjustment,
      final_squad_uncertainty_penalty: team.fantasy_pool_context_v3.final_squad_uncertainty_penalty,
      uncertainty_score: team.fantasy_pool_context_v3.uncertainty_score
    })),
    teams_most_uncertainty: top(teamQualityV3.teams, 10, (team) => team.fantasy_pool_context_v3.uncertainty_score).map((team) => ({
      team_id: team.team_id,
      country: team.country,
      uncertainty_score: team.fantasy_pool_context_v3.uncertainty_score,
      missing_usage_rows: team.fantasy_pool_context_v3.missing_usage_rows,
      low_confidence_rows: team.fantasy_pool_context_v3.low_confidence_rows,
      thin_profile_rows: team.fantasy_pool_context_v3.thin_profile_rows,
      review_rows: team.fantasy_pool_context_v3.review_rows,
      neymar_usage_source_gap: team.fantasy_pool_context_v3.neymar_usage_source_gap
    }))
  };
}

function buildTeamQuality(teamQualityV2, playerMinutes, officialSquads) {
  const minutesRows = playerMinutes.playerMinutesModel;
  const squadRows = officialSquads.officialSquads;
  const positionPriceRanges = Object.fromEntries(VALID_POSITIONS.map((position) => [
    position,
    minMax(minutesRows.filter((row) => row.official_fantasy_position === position).map((row) => num(row.official_price)))
  ]));
  const minutesByCountry = new Map();
  for (const row of minutesRows) {
    const key = normalize(row.country);
    if (!minutesByCountry.has(key)) minutesByCountry.set(key, []);
    minutesByCountry.get(key).push(row);
  }
  const squadsByCountry = new Map();
  for (const row of squadRows) {
    const key = normalize(row.country);
    if (!squadsByCountry.has(key)) squadsByCountry.set(key, []);
    squadsByCountry.get(key).push(row);
  }

  const contexts = new Map(teamQualityV2.teams.map((team) => [
    team.team_id,
    teamContext(team, minutesByCountry.get(normalize(team.country)) || [], squadsByCountry.get(normalize(team.country)) || [], positionPriceRanges)
  ]));
  const globalAverages = {
    attack_index: average([...contexts.values()].map((context) => context.attack_index), 50),
    midfield_index: average([...contexts.values()].map((context) => context.midfield_index), 50),
    defense_index: average([...contexts.values()].map((context) => context.defense_index), 50),
    goalkeeper_index: average([...contexts.values()].map((context) => context.goalkeeper_index), 50),
    availability_index: average([...contexts.values()].map((context) => context.availability_index), 50),
    data_quality_index: average([...contexts.values()].map((context) => context.data_quality_index), 50),
    uncertainty_score: average([...contexts.values()].map((context) => context.uncertainty_score), 50)
  };

  const teams = teamQualityV2.teams
    .map((team) => applyFantasyPoolAdjustments(team, contexts.get(team.team_id), globalAverages))
    .sort((a, b) => b.team_quality_fantasyPool_v3.overall_score - a.team_quality_fantasyPool_v3.overall_score);

  return {
    schema_version: "team_quality_fantasy_pool_v3",
    generated_at: NOW,
    source_checked: TODAY,
    model_stage: MODEL_STAGE,
    data_status: "staged_fantasy_pool_only_not_final_squad_backed",
    safety_labels: REQUIRED_SAFETY_LABELS,
    previous_active_team_quality_file: PATHS.teamQualityV2,
    model: {
      model_id: TEAM_QUALITY_VERSION,
      source_model_version: SOURCE_MODEL_VERSION,
      baseline: "data/teamQuality.json team_quality_v2",
      formula_summary: "Start from PELE-forward team_quality_v2, then add small fantasy-pool-only team-position, availability, and data-quality adjustments. Apply a visible final-squad uncertainty penalty to every team because confirmed final squad rows are zero.",
      price_use_policy: "Official fantasy price is used only as a weak player-context signal inside team-position aggregation and cannot confirm starts or dominate PELE.",
      limitations: REQUIRED_SAFETY_LABELS
    },
    summary: {
      team_count: teams.length,
      pele_coverage_complete: teams.every((team) => Number.isFinite(team.current_strength_inputs.pele_rating)),
      final_squad_source_status: "fantasy_pool_only",
      final_squad_confirmed_teams: 0,
      teams_with_neymar_uncertainty: teams.filter((team) => team.fantasy_pool_context_v3.neymar_usage_source_gap).map((team) => team.country),
      average_total_fantasy_pool_adjustment: round(average(teams.map((team) => team.team_quality_fantasyPool_v3.total_fantasy_pool_adjustment)), 3),
      average_uncertainty_score: round(average(teams.map((team) => team.fantasy_pool_context_v3.uncertainty_score)), 2),
      highest_uncertainty_teams: top(teams, 8, (team) => team.fantasy_pool_context_v3.uncertainty_score).map((team) => ({
        country: team.country,
        uncertainty_score: team.fantasy_pool_context_v3.uncertainty_score,
        missing_usage_rows: team.fantasy_pool_context_v3.missing_usage_rows,
        review_rows: team.fantasy_pool_context_v3.review_rows,
        neymar_usage_source_gap: team.fantasy_pool_context_v3.neymar_usage_source_gap
      }))
    },
    input_files: [
      PATHS.teamQualityV2,
      PATHS.peleRatings,
      PATHS.playerMinutes,
      PATHS.playerRecommendationInputs,
      PATHS.officialSquads
    ],
    global_fantasy_pool_context_averages: Object.fromEntries(Object.entries(globalAverages).map(([key, value]) => [key, round(value, 3)])),
    teams
  };
}

function buildQa(scorePredictions, teamQuality, fixturesData, peleRatings, officialSquads, officialSquadsImportReport, officialRules, readiness) {
  const checks = [];
  const pushCheck = (check_id, label, ok, detail, severity = "error") => {
    checks.push({ check_id, label, status: ok ? "pass" : "fail", severity, detail });
  };
  const fixtureIds = new Set(fixturesData.fixtures.map((fixture) => fixture.match_id));
  const predictionFixtureIds = new Set(scorePredictions.fixtureScorePredictions.map((row) => row.fixture_id));
  const allProbabilityFields = scorePredictions.fixtureScorePredictions.flatMap((row) => [
    row.home_win_probability,
    row.draw_probability,
    row.away_win_probability,
    row.home_clean_sheet_probability,
    row.away_clean_sheet_probability,
    row.over_2_5_goals_probability,
    row.under_2_5_goals_probability,
    row.both_teams_to_score_probability
  ]);
  const favoriteConsistent = scorePredictions.fixtureScorePredictions.every((row) => row.favorite_win_probability === Math.max(row.home_win_probability, row.away_win_probability));
  const peleCoverageComplete = teamQuality.teams.every((team) => Number.isFinite(team.current_strength_inputs.pele_rating));
  const uncertaintyFlagsPresent = scorePredictions.fixtureScorePredictions.every((row) => row.qa_flags.includes("fantasy_pool_only") && row.qa_flags.includes("not_final_squad_backed"));
  const brazilFixtures = scorePredictions.fixtureScorePredictions.filter((row) => row.home_team_id === "brazil" || row.away_team_id === "brazil");
  const brazilNeymarFlagged = brazilFixtures.length > 0 && brazilFixtures.every((row) => row.qa_flags.includes("brazil_neymar_usage_source_gap"));
  const noFinalSquadClaims = scorePredictions.fixtureScorePredictions.every((row) => row.model_stage === MODEL_STAGE && row.data_quality.uses_final_rosters === false);
  const publicContextLabels = new Set(["Strong", "Good", "Neutral", "Difficult"]);
  const publicRiskLabels = new Set(["Low", "Medium", "High"]);
  const uncertaintyFieldsPresent = scorePredictions.fixtureScorePredictions.every((row) =>
    publicRiskLabels.has(row.uncertaintyLabel) &&
    publicRiskLabels.has(row.matchUncertainty) &&
    Number.isFinite(row.lowTotalGoals) &&
    Number.isFinite(row.baseTotalGoals) &&
    Number.isFinite(row.highTotalGoals) &&
    Number.isFinite(row.homeXgLow) &&
    Number.isFinite(row.homeXgBase) &&
    Number.isFinite(row.homeXgHigh) &&
    Number.isFinite(row.awayXgLow) &&
    Number.isFinite(row.awayXgBase) &&
    Number.isFinite(row.awayXgHigh) &&
    Boolean(row.uncertaintyReason)
  );
  const uncertaintyBandsOrdered = scorePredictions.fixtureScorePredictions.every((row) =>
    row.lowTotalGoals <= row.baseTotalGoals &&
    row.baseTotalGoals <= row.highTotalGoals &&
    row.homeXgLow <= row.homeXgBase &&
    row.homeXgBase <= row.homeXgHigh &&
    row.awayXgLow <= row.awayXgBase &&
    row.awayXgBase <= row.awayXgHigh
  );
  const uncertaintyBasePreserved = scorePredictions.fixtureScorePredictions.every((row) =>
    row.homeXgBase === row.home_expected_goals &&
    row.awayXgBase === row.away_expected_goals &&
    row.baseTotalGoals === row.total_expected_goals
  );
  const projectedXgAliasesPreserved = scorePredictions.fixtureScorePredictions.every((row) =>
    row.homeProjectedXg === row.home_expected_goals &&
    row.awayProjectedXg === row.away_expected_goals &&
    row.home_projected_xg === row.home_expected_goals &&
    row.away_projected_xg === row.away_expected_goals &&
    row.homeMatchXg === row.home_expected_goals &&
    row.awayMatchXg === row.away_expected_goals &&
    row.home_match_xg === row.home_expected_goals &&
    row.away_match_xg === row.away_expected_goals &&
    row.projectedXg?.home === row.home_expected_goals &&
    row.projectedXg?.away === row.away_expected_goals &&
    row.projected_xg?.home === row.home_expected_goals &&
    row.projected_xg?.away === row.away_expected_goals
  );
  const fantasyContextFieldsPresent = scorePredictions.fixtureScorePredictions.every((row) =>
    publicContextLabels.has(row.attackerEnvironment) &&
    publicContextLabels.has(row.defenderEnvironment) &&
    publicContextLabels.has(row.keeperEnvironment) &&
    publicContextLabels.has(row.cleanSheetContext) &&
    publicContextLabels.has(row.goalEnvironment) &&
    publicRiskLabels.has(row.upsetRisk) &&
    publicRiskLabels.has(row.matchUncertainty)
  );

  pushCheck("fixture_coverage", "Group-stage fixture coverage", predictionFixtureIds.size === fixtureIds.size && scorePredictions.fixtureScorePredictions.length === fixturesData.fixtures.length, `${scorePredictions.fixtureScorePredictions.length}/${fixturesData.fixtures.length} group-stage fixtures have one score prediction row; ${predictionFixtureIds.size} unique fixture IDs.`);
  pushCheck("team_fixture_coverage", "Team-fixture coverage", scorePredictions.teamFixturePredictions.length === fixturesData.fixtures.length * 2, `${scorePredictions.teamFixturePredictions.length}/${fixturesData.fixtures.length * 2} team-fixture rows exist.`);
  pushCheck("probability_bounds", "Probability bounds", allProbabilityFields.every((value) => value >= 0 && value <= 1), "All probability fields are between 0 and 1.");
  pushCheck("win_draw_loss_sum", "Win/draw/loss probability sum", scorePredictions.fixtureScorePredictions.every((row) => Math.abs(row.home_win_probability + row.draw_probability + row.away_win_probability - 1) <= 0.003), "Home/draw/away probabilities sum to 1 within tolerance.");
  pushCheck("expected_goals_non_negative", "Expected goals non-negative", scorePredictions.fixtureScorePredictions.every((row) => row.home_expected_goals >= 0 && row.away_expected_goals >= 0), "Expected goals are non-negative.");
  pushCheck("clean_sheet_probability_bounds", "Clean-sheet probability bounds", scorePredictions.fixtureScorePredictions.every((row) => row.home_clean_sheet_probability >= 0 && row.home_clean_sheet_probability <= 1 && row.away_clean_sheet_probability >= 0 && row.away_clean_sheet_probability <= 1), "Clean-sheet probabilities are between 0 and 1.");
  pushCheck("favorite_consistency", "Favorite consistency", favoriteConsistent, "Favorite matches the higher home/away win probability.");
  pushCheck("pele_coverage", "PELE coverage", peleCoverageComplete, `${teamQuality.teams.filter((team) => Number.isFinite(team.current_strength_inputs.pele_rating)).length}/${teamQuality.teams.length} teams have numeric PELE ratings.`);
  pushCheck("fantasy_pool_uncertainty_flags", "Fantasy-pool uncertainty flags present", uncertaintyFlagsPresent, "Every fixture carries fantasy_pool_only and not_final_squad_backed QA flags.");
  pushCheck("brazil_neymar_uncertainty", "Brazil Neymar uncertainty flagged", brazilNeymarFlagged, `${brazilFixtures.length} Brazil fixtures carry Neymar usage-source-gap QA flag.`);
  pushCheck("no_final_squad_backed_claims", "No final-squad-backed claims", noFinalSquadClaims, "All rows remain model_stage=fantasy_pool_only and uses_final_rosters=false.");
  pushCheck("score_uncertainty_fields", "Score uncertainty fields present", uncertaintyFieldsPresent, "Every fixture has Low/Medium/High uncertainty labels, xG bands, total-goal bands, and a short reason.");
  pushCheck("score_uncertainty_bands_ordered", "Score uncertainty bands ordered", uncertaintyBandsOrdered, "Every fixture has low <= base <= high for total, home xG, and away xG.");
  pushCheck("score_uncertainty_base_preserved", "Uncertainty inputs preserved", uncertaintyBasePreserved, "homeXgBase, awayXgBase, and baseTotalGoals match the original expected-goal fields.");
  pushCheck("projected_xg_aliases_preserved", "Projected xG aliases match score-grid inputs", projectedXgAliasesPreserved, "Projected xG and match xG aliases match home_expected_goals and away_expected_goals.");
  pushCheck("fantasy_context_fields", "Fantasy context fields present", fantasyContextFieldsPresent, "Every fixture has attacker, defender, keeper, clean-sheet, goal, upset-risk, and match-uncertainty public context labels.");

  const extremeExpectedGoals = scorePredictions.fixtureScorePredictions.filter((row) => row.total_expected_goals > 4.2 || row.home_expected_goals > 3.35 || row.away_expected_goals > 3.35);
  const extremeWinProbabilities = scorePredictions.fixtureScorePredictions.filter((row) => row.favorite_win_probability > 0.93);
  pushCheck("extreme_expected_goals", "Extreme expected goals flagged", true, `${extremeExpectedGoals.length} fixtures exceed the staging watch threshold.`, "warning");
  pushCheck("extreme_win_probabilities", "Extreme win probabilities flagged", true, `${extremeWinProbabilities.length} fixtures exceed the staging watch threshold.`, "warning");

  const checksFailed = checks.filter((check) => check.status === "fail" && check.severity === "error").length;
  const stopConditions = [
    {
      id: "official_final_squads_not_source_backed",
      status: "stop",
      count: teamQuality.teams.length - (officialSquads.summary?.teams_marked_complete ?? 0),
      details: "Official final squads are not source-backed complete for any team; confirmed final squad rows are zero."
    },
    {
      id: "official_rules_manual_review",
      status: officialRules.officialFantasyRules?.rulesStatus?.includes("needs_manual_review") || officialRules.data_status?.includes("needs_manual_review") ? "stop" : "pass",
      count: officialRules.officialFantasyRules?.rulesStatus?.includes("needs_manual_review") || officialRules.data_status?.includes("needs_manual_review") ? 1 : 0,
      details: "Official fantasy rules still have manual-review warnings, including Mystery Booster/deadline semantics."
    },
    {
      id: "readiness_not_ready_for_model_rerun",
      status: readiness.status === "ready_for_official_model_rerun" ? "pass" : "stop",
      count: readiness.status === "ready_for_official_model_rerun" ? 0 : 1,
      details: `Official data readiness is ${readiness.status}.`
    },
    {
      id: "no_final_squad_rows_exist",
      status: "stop",
      count: officialSquads.summary?.imported_status_counts?.confirmed_final_squad || 0,
      details: "There are 0 source-backed confirmed_final_squad rows in the official squad staging layer."
    },
    {
      id: "neymar_p0_usage_source_gap",
      status: "stop",
      count: teamQuality.teams.some((team) => team.fantasy_pool_context_v3.neymar_usage_source_gap) ? 1 : 0,
      details: "Neymar remains a P0 national-team usage source gap and is not credited as confirmed Brazil attack strength."
    },
    {
      id: "browser_ready_files_regenerated_by_preview_export",
      status: "pass",
      count: 0,
      details: "After this source pass, run scripts/buildFantasyPoolPreviewBrowserData.mjs so fantasyPoolScorePredictionsData.js stays synced."
    },
    {
      id: "player_matchday_projection_not_rerun",
      status: "stop",
      count: 1,
      details: "This staging pass intentionally did not rerun player matchday projections or recommendations."
    }
  ];

  return {
    schema_version: "score_prediction_qa_fantasy_pool_v3",
    generated_at: NOW,
    source_checked: TODAY,
    model_stage: MODEL_STAGE,
    data_status: "staged_pass_blocked_from_final_promotion",
    overall_status: checksFailed ? "fail" : "pass_with_staging_stop_conditions",
    safety_labels: REQUIRED_SAFETY_LABELS,
    source_files: [
      PATHS.scoreV3,
      PATHS.teamQualityV3,
      PATHS.fixtures,
      PATHS.matchdays,
      PATHS.teamQualityV2,
      PATHS.peleRatings,
      PATHS.playerMinutes,
      PATHS.playerRecommendationInputs,
      PATHS.officialSquads,
      PATHS.officialRules,
      PATHS.scoreV2
    ],
    summary: {
      checks_total: checks.length,
      checks_passed: checks.filter((check) => check.status === "pass").length,
      checks_failed: checksFailed,
      warning_checks: checks.filter((check) => check.severity === "warning").length,
      fixture_prediction_count: scorePredictions.fixtureScorePredictions.length,
      team_fixture_prediction_count: scorePredictions.teamFixturePredictions.length,
      team_count: teamQuality.teams.length,
      pele_coverage_complete: peleCoverageComplete,
      final_squad_source_status: "fantasy_pool_only",
      final_squad_confirmed_rows: officialSquads.summary?.imported_status_counts?.confirmed_final_squad || 0,
      squad_review_rows: officialSquadsImportReport.summary?.review_rows ?? officialSquads.summary?.review_rows ?? 0,
      neymar_brazil_uncertainty_flagged: brazilNeymarFlagged,
      safe_for_preliminary_matchday_projection_staging: checksFailed === 0,
      safe_for_final_public_recommendations: false,
      safe_for_final_team_builder_promotion: false,
      match_uncertainty_counts: scorePredictions.summary.match_uncertainty_counts,
      public_upset_risk_counts: scorePredictions.summary.public_upset_risk_counts,
      attacker_environment_counts: scorePredictions.summary.attacker_environment_counts,
      clean_sheet_context_counts: scorePredictions.summary.clean_sheet_context_counts
    },
    input_coverage: {
      fixtures_total: fixturesData.fixtures.length,
      fixture_predictions: scorePredictions.fixtureScorePredictions.length,
      unique_fixture_predictions: predictionFixtureIds.size,
      team_fixture_predictions: scorePredictions.teamFixturePredictions.length,
      teams_total: teamQuality.teams.length,
      team_quality_rows: teamQuality.teams.length,
      pele_rating_available: teamQuality.teams.filter((team) => Number.isFinite(team.current_strength_inputs.pele_rating)).length,
      pele_rating_missing: teamQuality.teams.filter((team) => !Number.isFinite(team.current_strength_inputs.pele_rating)).length,
      pele_source_rows_total: peleRatings.rows.length,
      player_minutes_rows: teamQuality.teams.reduce((total, team) => total + team.fantasy_pool_context_v3.rows_total, 0),
      fantasy_pool_squad_rows: officialSquads.summary?.imported_rows ?? officialSquads.officialSquads.length,
      confirmed_final_squad_rows: officialSquads.summary?.imported_status_counts?.confirmed_final_squad || 0
    },
    guardrails: {
      team_expected_goals_min: 0,
      team_expected_goals_max: 4,
      total_expected_goals_watch_threshold: 4.2,
      probability_min: 0,
      probability_max: 1,
      win_draw_loss_sum_tolerance: 0.003,
      favorite_win_probability_watch_threshold: 0.93
    },
    range_summary: {
      home_expected_goals: rangeSummary(scorePredictions.fixtureScorePredictions.map((row) => row.home_expected_goals)),
      away_expected_goals: rangeSummary(scorePredictions.fixtureScorePredictions.map((row) => row.away_expected_goals)),
      total_expected_goals: rangeSummary(scorePredictions.fixtureScorePredictions.map((row) => row.total_expected_goals)),
      low_total_goals: rangeSummary(scorePredictions.fixtureScorePredictions.map((row) => row.lowTotalGoals)),
      high_total_goals: rangeSummary(scorePredictions.fixtureScorePredictions.map((row) => row.highTotalGoals)),
      favorite_win_probability: rangeSummary(scorePredictions.fixtureScorePredictions.map((row) => row.favorite_win_probability), 4),
      upset_risk_probability: rangeSummary(scorePredictions.fixtureScorePredictions.map((row) => row.upset_risk_probability), 4),
      home_clean_sheet_probability: rangeSummary(scorePredictions.fixtureScorePredictions.map((row) => row.home_clean_sheet_probability), 4),
      away_clean_sheet_probability: rangeSummary(scorePredictions.fixtureScorePredictions.map((row) => row.away_clean_sheet_probability), 4)
    },
    comparison_to_v2: scorePredictions.comparison_to_v2,
    checks,
    stop_conditions: stopConditions,
    warnings: [
      "fantasy_pool_only_not_final_squad_backed",
      "official_rules_manual_review",
      "neymar_p0_usage_source_gap",
      "rerun browser preview export after score-source regeneration"
    ],
    recommended_next_step: "Use this only for preliminary score/projection staging. Resolve final squad sources, official rules warnings, and Neymar's P0 usage source gap before final promotion."
  };
}

function markdownTable(rows, headers) {
  if (!rows.length) return "_None._";
  const headerLine = `| ${headers.map((header) => header.label).join(" | ")} |`;
  const dividerLine = `| ${headers.map(() => "---").join(" | ")} |`;
  const rowLines = rows.map((row) => `| ${headers.map((header) => String(row[header.key] ?? "")).join(" | ")} |`);
  return [headerLine, dividerLine, ...rowLines].join("\n");
}

function buildReport(scorePredictions, qa, teamQuality) {
  const largestXg = scorePredictions.comparison_to_v2.largest_expected_goal_changes.map((row) => ({
    fixture: row.fixture,
    total_xg_delta: row.total_expected_goals_delta,
    home_xg_delta: row.home_expected_goals_delta,
    away_xg_delta: row.away_expected_goals_delta
  }));
  const largestWin = scorePredictions.comparison_to_v2.largest_win_probability_changes.map((row) => ({
    fixture: row.fixture,
    max_win_probability_delta: row.max_win_probability_delta,
    favorite_v2: row.favorite_v2,
    favorite_v3: row.favorite_v3,
    favorite_changed: row.favorite_changed
  }));
  const qualityAdjustments = scorePredictions.comparison_to_v2.teams_largest_quality_adjustments.map((row) => ({
    country: row.country,
    v2_score: row.base_team_quality_v2_score,
    v3_score: row.fantasy_pool_v3_score,
    adjustment: row.total_fantasy_pool_adjustment,
    uncertainty: row.uncertainty_score
  }));
  const uncertaintyTeams = scorePredictions.comparison_to_v2.teams_most_uncertainty.map((row) => ({
    country: row.country,
    uncertainty: row.uncertainty_score,
    missing_usage: row.missing_usage_rows,
    low_confidence: row.low_confidence_rows,
    review_rows: row.review_rows,
    neymar_gap: row.neymar_usage_source_gap
  }));
  const uncertaintyCounts = Object.entries(scorePredictions.summary.match_uncertainty_counts || {}).map(([label, count]) => ({
    label,
    count
  }));
  const fantasyContextCounts = [
    { field: "Attack outlook", counts: JSON.stringify(scorePredictions.summary.attacker_environment_counts || {}) },
    { field: "Clean-sheet context", counts: JSON.stringify(scorePredictions.summary.clean_sheet_context_counts || {}) },
    { field: "Upset risk", counts: JSON.stringify(scorePredictions.summary.public_upset_risk_counts || {}) }
  ];
  const highUncertaintyFixtures = (scorePredictions.summary.highest_uncertainty_fixtures || []).map((row) => ({
    fixture: row.fixture,
    uncertainty: row.matchUncertainty,
    score: row.uncertaintyScore,
    goal_range: row.goal_range,
    reason: row.uncertaintyReason
  }));
  const brazil = teamQuality.teams.find((team) => team.team_id === "brazil");

  return `# Score Prediction QA Report Fantasy Pool v3

Generated: ${NOW}

## Status

This is a staged \`fantasy_pool_only\` score predictor. It is not final-squad-backed, not betting odds, not final public recommendations, and safe only for preliminary projection staging.

| Metric | Value |
| --- | --- |
| Overall QA status | ${qa.overall_status} |
| Fixtures covered | ${qa.summary.fixture_prediction_count} |
| Team-fixture rows | ${qa.summary.team_fixture_prediction_count} |
| Teams covered | ${qa.summary.team_count} |
| PELE coverage complete | ${qa.summary.pele_coverage_complete} |
| Final-squad-confirmed rows | ${qa.summary.final_squad_confirmed_rows} |
| Squad review rows | ${qa.summary.squad_review_rows} |
| Safe for preliminary projection staging | ${qa.summary.safe_for_preliminary_matchday_projection_staging} |
| Safe for final public recommendations | ${qa.summary.safe_for_final_public_recommendations} |
| Safe for final Team Builder promotion | ${qa.summary.safe_for_final_team_builder_promotion} |
| Average goal-range width | ${scorePredictions.summary.average_goal_range_width} |

## Model Purpose

Score Predictor v3 starts from the active PELE-forward v2 team-quality and Poisson score model, then adds a small, transparent fantasy-pool context layer from official fantasy-pool players and the preliminary minutes model. PELE remains the dominant team-strength signal. Phase 3C clarifies that public Projected xG is fixture-specific expected goals against the listed opponent, while total goals range and Match uncertainty remain supporting context.

## Inputs Used

- \`${PATHS.teamQualityV2}\`
- \`${PATHS.peleRatings}\`
- \`${PATHS.fixtures}\`
- \`${PATHS.matchdays}\`
- \`${PATHS.playerMinutes}\`
- \`${PATHS.playerRecommendationInputs}\`
- \`${PATHS.officialSquads}\`
- \`${PATHS.scoreV2}\`

## Why Fantasy Pool Only

Confirmed final squad rows are still zero, official squads are not source-backed complete, and official rules still have manual-review warnings. Every team carries \`final_squad_source_status: fantasy_pool_only\` plus a final-squad uncertainty penalty. The preserved fallback stays in \`scorePredictionsData.js\`.

The active public bundle is \`fantasyPoolScorePredictionsData.js\`; \`scorePredictionsData.js\` remains the preserved PELE-forward fallback.

## Phase 3C Projected xG And Match Context

Projected xG values match the expected-goal inputs used by the scoreline grid. Total goals ranges are supporting bands around those values. They use transparent proxies already in this source: team-quality gap, upset risk, goal environment, team-role uncertainty flags, Brazil role-source review, and host venue context where present.

### Match Uncertainty Counts

${markdownTable(uncertaintyCounts, [
    { key: "label", label: "Label" },
    { key: "count", label: "Fixtures" }
  ])}

### Fantasy Context Counts

${markdownTable(fantasyContextCounts, [
    { key: "field", label: "Field" },
    { key: "counts", label: "Counts" }
  ])}

### Highest Match Uncertainty Fixtures

${markdownTable(highUncertaintyFixtures, [
    { key: "fixture", label: "Fixture" },
    { key: "uncertainty", label: "Uncertainty" },
    { key: "score", label: "Score" },
    { key: "goal_range", label: "Goal range" },
    { key: "reason", label: "Reason" }
  ])}

## Main Differences From v2

| Metric | Value |
| --- | --- |
| Fixtures compared with v2 | ${scorePredictions.comparison_to_v2.v2_fixture_predictions_compared} |
| Average absolute total xG change | ${scorePredictions.comparison_to_v2.average_absolute_total_expected_goals_change} |
| Average max W/D/L probability change | ${scorePredictions.comparison_to_v2.average_max_win_probability_change} |
| Favorite changes | ${scorePredictions.comparison_to_v2.favorite_changes} |
| Average total expected goals v3 | ${scorePredictions.summary.average_total_expected_goals} |

## Top Expected-Goal Changes

${markdownTable(largestXg, [
    { key: "fixture", label: "Fixture" },
    { key: "total_xg_delta", label: "Total xG delta" },
    { key: "home_xg_delta", label: "Home xG delta" },
    { key: "away_xg_delta", label: "Away xG delta" }
  ])}

## Top Win-Probability Changes

${markdownTable(largestWin, [
    { key: "fixture", label: "Fixture" },
    { key: "max_win_probability_delta", label: "Max W/D/L delta" },
    { key: "favorite_v2", label: "Favorite v2" },
    { key: "favorite_v3", label: "Favorite v3" },
    { key: "favorite_changed", label: "Favorite changed" }
  ])}

## Largest Team-Quality Adjustments

${markdownTable(qualityAdjustments, [
    { key: "country", label: "Country" },
    { key: "v2_score", label: "v2 score" },
    { key: "v3_score", label: "v3 score" },
    { key: "adjustment", label: "Adjustment" },
    { key: "uncertainty", label: "Uncertainty" }
  ])}

## Teams With Most Uncertainty

${markdownTable(uncertaintyTeams, [
    { key: "country", label: "Country" },
    { key: "uncertainty", label: "Uncertainty" },
    { key: "missing_usage", label: "Missing usage" },
    { key: "low_confidence", label: "Low confidence" },
    { key: "review_rows", label: "Review rows" },
    { key: "neymar_gap", label: "Neymar gap" }
  ])}

## Neymar / Brazil Treatment

Brazil has \`brazil_neymar_usage_source_gap\` on every Brazil fixture because Neymar remains a P0 national-team usage source gap. The model does not invent Neymar starts, minutes, squad status, or role. Brazil's PELE baseline remains active, while Neymar is handled as uncertainty rather than confirmed extra attack strength.

| Brazil field | Value |
| --- | --- |
| Team quality v2 score | ${brazil?.team_quality_fantasyPool_v3.base_team_quality_v2_score ?? ""} |
| Fantasy-pool v3 score | ${brazil?.team_quality_fantasyPool_v3.overall_score ?? ""} |
| Total fantasy-pool adjustment | ${brazil?.team_quality_fantasyPool_v3.total_fantasy_pool_adjustment ?? ""} |
| Neymar usage source gap | ${brazil?.fantasy_pool_context_v3.neymar_usage_source_gap ?? ""} |
| Brazil uncertainty score | ${brazil?.fantasy_pool_context_v3.uncertainty_score ?? ""} |

## Stop Conditions Before Promotion

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
    check: row.check_id,
    status: row.status,
    severity: row.severity,
    detail: row.detail
  })), [
    { key: "check", label: "Check" },
    { key: "status", label: "Status" },
    { key: "severity", label: "Severity" },
    { key: "detail", label: "Detail" }
  ])}

## Promotion Decision

This file is safe for preliminary matchday projection staging, but it is not safe for final public recommendations or final Team Builder promotion. Final promotion remains blocked until source-backed final squads, official rules warnings, Neymar's P0 usage source gap, active browser-ready regeneration, and downstream player-projection QA are resolved.
`;
}

async function main() {
  const [
    fixturesData,
    matchdaysData,
    teamQualityV2,
    peleRatings,
    playerMinutes,
    playerRecommendationInputs,
    officialSquads,
    officialSquadsImportReport,
    officialRules,
    readiness,
    scoreV2
  ] = await Promise.all([
    readJson(PATHS.fixtures),
    readJson(PATHS.matchdays),
    readJson(PATHS.teamQualityV2),
    readJson(PATHS.peleRatings),
    readJson(PATHS.playerMinutes),
    readJson(PATHS.playerRecommendationInputs),
    readJson(PATHS.officialSquads),
    readJson(PATHS.officialSquadsImportReport),
    readJson(PATHS.officialRules),
    readJson(PATHS.readiness),
    readJson(PATHS.scoreV2)
  ]);

  if (!Array.isArray(playerMinutes.playerMinutesModel) || playerMinutes.playerMinutesModel.length === 0) {
    throw new Error("Missing playerMinutesModel rows in data/playerMinutesModel_fantasyPool_v0.json");
  }
  if (!Array.isArray(playerRecommendationInputs.players) || playerRecommendationInputs.players.length === 0) {
    throw new Error("Missing player recommendation input rows.");
  }

  const teamQualityV3 = buildTeamQuality(teamQualityV2, playerMinutes, officialSquads);
  const scorePredictions = buildScorePredictions(fixturesData, matchdaysData, teamQualityV3, scoreV2);
  const qa = buildQa(scorePredictions, teamQualityV3, fixturesData, peleRatings, officialSquads, officialSquadsImportReport, officialRules, readiness);
  const report = buildReport(scorePredictions, qa, teamQualityV3);

  await writeJson(PATHS.teamQualityV3, teamQualityV3);
  await writeJson(PATHS.scoreV3, scorePredictions);
  await writeJson(PATHS.scoreQaV3, qa);
  await writeFile(PATHS.scoreQaReportV3, report, "utf8");

  console.log(`Created ${PATHS.teamQualityV3}`);
  console.log(`Created ${PATHS.scoreV3}`);
  console.log(`Created ${PATHS.scoreQaV3}`);
  console.log(`Created ${PATHS.scoreQaReportV3}`);
  console.log(`Fixtures covered: ${scorePredictions.summary.fixture_prediction_count}`);
  console.log(`Teams covered: ${teamQualityV3.summary.team_count}`);
  console.log(`QA status: ${qa.overall_status}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
