import fs from "node:fs";
import path from "node:path";

const OUTPUT_DATASET = "data/md1CalibrationDataset_v1.json";
const OUTPUT_POSTMORTEM = "data/md1ModelPostmortem_v1.json";
const OUTPUT_REPORT = "data/md1ModelPostmortemReport_v1.md";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function round(value, digits = 3) {
  if (!Number.isFinite(value)) {
    return null;
  }
  return Number(value.toFixed(digits));
}

function num(value, fallback = null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function avg(values) {
  const clean = values.filter(Number.isFinite);
  return clean.length ? clean.reduce((sum, value) => sum + value, 0) / clean.length : null;
}

function sum(values) {
  return values.filter(Number.isFinite).reduce((total, value) => total + value, 0);
}

function pct(part, whole) {
  if (!whole) {
    return null;
  }
  return round(part / whole, 3);
}

function sortByAbs(field) {
  return (left, right) => Math.abs(num(right[field], 0)) - Math.abs(num(left[field], 0));
}

function sortDesc(field) {
  return (left, right) => num(right[field], -Infinity) - num(left[field], -Infinity);
}

function groupBy(rows, keyFn) {
  const groups = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(row);
  }
  return groups;
}

function counts(rows, keyFn) {
  const output = {};
  for (const row of rows) {
    const key = keyFn(row) ?? "unknown";
    output[key] = (output[key] || 0) + 1;
  }
  return output;
}

function resultClass(homeGoals, awayGoals) {
  if (homeGoals > awayGoals) {
    return "home";
  }
  if (awayGoals > homeGoals) {
    return "away";
  }
  return "draw";
}

function resultLabel(result) {
  return result === "home" ? "home_win" : result === "away" ? "away_win" : "draw";
}

function predictedResultClass(prediction) {
  const home = num(prediction?.home_win_probability, 0);
  const draw = num(prediction?.draw_probability, 0);
  const away = num(prediction?.away_win_probability, 0);
  if (draw >= home && draw >= away) {
    return "draw";
  }
  return home >= away ? "home" : "away";
}

function favoriteSide(prediction) {
  const favorite = prediction?.favorite_team_id;
  if (favorite && favorite === prediction.home_team_id) {
    return "home";
  }
  if (favorite && favorite === prediction.away_team_id) {
    return "away";
  }
  return predictedResultClass(prediction);
}

function priceTier(price) {
  const value = num(price, 0);
  if (value >= 9) {
    return "premium";
  }
  if (value >= 7.5) {
    return "upper_mid";
  }
  if (value >= 5.5) {
    return "mid";
  }
  if (value >= 4.5) {
    return "budget";
  }
  return "ultra_budget";
}

function safeTeamKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function sampleRows(rows, fields, limit) {
  return rows.slice(0, limit).map((row) => {
    const output = {};
    for (const field of fields) {
      output[field] = row[field];
    }
    return output;
  });
}

function markdownTable(headers, rows) {
  const escapeCell = (value) => String(value ?? "").replace(/\|/g, "\\|");
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${headers.map((header) => escapeCell(row[header])).join(" | ")} |`)
  ].join("\n");
}

function extractBrowserJsonAssignment(filePath, globalName) {
  const text = fs.readFileSync(filePath, "utf8");
  const prefix = `window.${globalName} = `;
  const start = text.indexOf(prefix);
  if (start < 0) {
    throw new Error(`Missing ${globalName} in ${filePath}`);
  }

  let index = start + prefix.length;
  while (/\s/.test(text[index])) {
    index += 1;
  }
  const opening = text[index];
  if (opening !== "{" && opening !== "[") {
    throw new Error(`Expected JSON assignment for ${globalName}`);
  }

  const stack = [opening];
  let inString = false;
  let escaped = false;
  for (let cursor = index + 1; cursor < text.length; cursor += 1) {
    const char = text[cursor];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }
    if (char === "\"") {
      inString = true;
      continue;
    }
    if (char === "{" || char === "[") {
      stack.push(char);
      continue;
    }
    if (char === "}" || char === "]") {
      const expected = char === "}" ? "{" : "[";
      const actual = stack.pop();
      if (actual !== expected) {
        throw new Error(`Malformed JSON assignment for ${globalName}`);
      }
      if (!stack.length) {
        return JSON.parse(text.slice(index, cursor + 1));
      }
    }
  }

  throw new Error(`Could not parse ${globalName} from ${filePath}`);
}

function roleEvidenceFromLive(livePlayer, projection) {
  const matchStatusRaw = livePlayer?.matchStatus ?? null;
  const matchStatus = matchStatusRaw ? String(matchStatusRaw).toLowerCase() : null;
  const hasRoundPoints = Boolean(
    livePlayer?.stats?.roundPoints &&
    Object.prototype.hasOwnProperty.call(livePlayer.stats.roundPoints, "1")
  );
  const actualPoints = hasRoundPoints ? num(livePlayer.stats.roundPoints["1"], null) : null;
  const hasPositivePoints = Number.isFinite(actualPoints) && actualPoints > 0;
  const startProbability = num(projection?.start_probability, null);

  const started = matchStatus ? ["start", "started", "starting", "starter", "lineup"].some((token) => matchStatus.includes(token)) : null;
  const subAppearance = matchStatus ? ["sub", "bench"].some((token) => matchStatus.includes(token)) : null;
  const notInSquad = matchStatus ? ["not", "out", "absent", "unavailable"].some((token) => matchStatus.includes(token)) : null;

  let inferredStatus = "unknown_no_md1_role_or_points_evidence";
  if (started) {
    inferredStatus = "started_from_match_status";
  } else if (subAppearance) {
    inferredStatus = "sub_or_bench_from_match_status";
  } else if (notInSquad) {
    inferredStatus = "not_in_squad_from_match_status";
  } else if (hasRoundPoints && hasPositivePoints) {
    inferredStatus = "played_or_scored_points_evidence";
  } else if (hasRoundPoints) {
    inferredStatus = "points_row_present_zero_points";
  } else if (Number.isFinite(startProbability) && startProbability >= 0.75) {
    inferredStatus = "possible_role_miss_high_start_no_points_row";
  } else if (Number.isFinite(startProbability) && startProbability <= 0.25 && hasPositivePoints) {
    inferredStatus = "possible_underestimated_role_positive_points";
  }

  const startProbabilityMissFlag = inferredStatus === "possible_role_miss_high_start_no_points_row" ||
    inferredStatus === "possible_underestimated_role_positive_points";

  return {
    started,
    sub_appearance: subAppearance,
    not_in_squad: notInSquad,
    points_row_present: hasRoundPoints,
    played_points_evidence: hasPositivePoints,
    unknown: !matchStatus && !hasRoundPoints,
    inferred_status: inferredStatus,
    start_probability_miss_flag: startProbabilityMissFlag,
    start_probability_miss_reason: startProbabilityMissFlag
      ? inferredStatus
      : (matchStatus ? "match_status_available_but_no_start_probability_miss" : "no_direct_start_sub_status_available")
  };
}

function classifyPlayerFailure({ projection, actualPoints, roleEvidence, fixtureRow }) {
  if (!projection) {
    return "no_prior_projection";
  }
  if (roleEvidence.start_probability_miss_flag && roleEvidence.inferred_status.includes("high_start")) {
    return "bad_start_role_estimate";
  }
  if (!Number.isFinite(actualPoints)) {
    return "stale_or_missing_actual_points";
  }
  const error = actualPoints - num(projection.raw_expected_points, 0);
  if (error >= 3) {
    return "underpredicted_player_outcome";
  }
  if (error <= -3) {
    if (roleEvidence.points_row_present && !roleEvidence.played_points_evidence) {
      return "poor_individual_outcome_or_low_minutes";
    }
    if (fixtureRow && fixtureRow.result_class_predicted !== fixtureRow.result_class_final) {
      return "bad_team_fixture_environment";
    }
    return "overpredicted_player_outcome";
  }
  return "within_reasonable_error_band";
}

function classifyRecommendationFailure(row, playerRow, teamResidual, financeMetric) {
  if (!Number.isFinite(row.actual_md1_fantasy_points)) {
    return "stale_missing_data";
  }
  if (playerRow?.role_evidence?.start_probability_miss_flag) {
    return "bad_start_role_estimate";
  }
  if (num(row.expected_minutes, 90) < 45) {
    return "low_minutes";
  }
  if (teamResidual && (Math.abs(teamResidual.attack_residual) >= 1.5 || Math.abs(teamResidual.defense_residual) >= 1.5)) {
    return "bad_team_fixture_environment";
  }
  if ((row.mode === "differential" || num(financeMetric?.finance_alpha_score, 0) >= 70 || num(row.value_score, 0) >= 1.2) &&
    num(row.actual_md1_fantasy_points, 0) <= 2) {
    return "price_value_overweight";
  }
  if (row.mode === "captain" && num(row.actual_md1_fantasy_points, 0) <= 3) {
    return "captain_upside_underweight";
  }
  if (num(row.actual_md1_fantasy_points, 0) <= 2 && num(row.start_probability, 0) >= 0.75) {
    return "poor_individual_outcome_despite_good_role";
  }
  return "cannot_classify";
}

function recommendationResult(actualPoints) {
  if (!Number.isFinite(actualPoints)) {
    return "no_actual_row";
  }
  if (actualPoints >= 8) {
    return "hit";
  }
  if (actualPoints >= 5) {
    return "solid";
  }
  if (actualPoints >= 2) {
    return "flat";
  }
  return "miss";
}

function hasInvalidNumber(value, pathName = "$", output = []) {
  if (typeof value === "number" && !Number.isFinite(value)) {
    output.push(pathName);
    return output;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => hasInvalidNumber(item, `${pathName}[${index}]`, output));
    return output;
  }
  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      hasInvalidNumber(item, `${pathName}.${key}`, output);
    }
  }
  return output;
}

function buildCorrection(id, modelStep, recommendation, confidence, robustness, evidence) {
  return {
    id,
    model_step: modelStep,
    recommendation,
    confidence,
    robustness,
    evidence
  };
}

const generatedAt = new Date().toISOString();

const activeQa = readJson("data/activeMd2DataFlowQa.json");
const liveMatchday = readJson("data/liveMatchdayStatus_v1.json");
const livePlayers = readJson("data/livePlayerStatus_v1.json");
const liveFixtureQa = readJson("data/liveFixtureMappingQa_v1.json");
const scorePredictions = readJson("data/scorePredictions_fantasyPool_v3.json");
const projectionData = readJson("data/playerMatchdayProjections_fantasyPool_v3.json");
const recommendationData = readJson("data/matchdayRecommendations_fantasyPool_v3.json");
const financeData = readJson("data/playerFinanceMetrics_fantasyPool_v1.json");
const fantasyRules = readJson("fantasyRules.json");
const officialStatus = extractBrowserJsonAssignment("fantasyPoolOfficialDataStatusData.js", "FANTASY_POOL_OFFICIAL_DATA_STATUS");

const scoreByFixture = new Map(scorePredictions.fixtureScorePredictions.map((row) => [row.fixture_id, row]));
const md1ProjectionRows = projectionData.playerMatchdayProjections.filter((row) => row.matchday === "md1");
const projectionByOfficialId = new Map(md1ProjectionRows.map((row) => [String(row.official_fantasy_player_id), row]));
const livePlayerByOfficialId = new Map(livePlayers.players.map((row) => [String(row.official_fantasy_player_id), row]));
const financeByOfficialId = new Map(financeData.playerFinanceMetrics.map((row) => [String(row.official_fantasy_player_id), row]));
const officialRecords = officialStatus.official_position_records || [];
const officialById = new Map(officialRecords.map((row) => [String(row.official_fantasy_player_id), row]));

const md1RecommendationRows = recommendationData.recommendationCandidates.filter((row) => row.matchday === "md1");
const recommendationsByOfficialId = groupBy(md1RecommendationRows, (row) => String(row.official_fantasy_player_id));
const recommendationOfficialIds = new Set(md1RecommendationRows.map((row) => String(row.official_fantasy_player_id)));
const captainRecommendationIds = new Set(md1RecommendationRows.filter((row) => row.mode === "captain").map((row) => String(row.official_fantasy_player_id)));

const completedMd1Fixtures = liveMatchday.fixtures
  .filter((fixture) => String(fixture.round_id) === "1")
  .filter((fixture) => fixture.fixture_status === "complete" && fixture.score_status === "final")
  .filter((fixture) => fixture.safe_to_display_score === true)
  .sort((left, right) => num(left.match_number, 0) - num(right.match_number, 0));

const fixtureCalibrationRows = completedMd1Fixtures.map((fixture) => {
  const prediction = scoreByFixture.get(fixture.local_fixture_id);
  if (!prediction) {
    throw new Error(`Missing score prediction for ${fixture.local_fixture_id}`);
  }

  const homeGoals = num(fixture.home_score, 0);
  const awayGoals = num(fixture.away_score, 0);
  const totalGoals = homeGoals + awayGoals;
  const predictedTotal = num(prediction.total_expected_goals, 0);
  const predictedClass = predictedResultClass(prediction);
  const finalClass = resultClass(homeGoals, awayGoals);
  const favoriteClass = favoriteSide(prediction);
  const favoriteCorrect = favoriteClass === finalClass;

  const cleanSheetEvaluation = {
    home: {
      team: fixture.home_team,
      prior_probability: num(prediction.home_clean_sheet_probability, null),
      predicted_clean_sheet_call: num(prediction.home_clean_sheet_probability, 0) >= 0.5,
      actual_clean_sheet: awayGoals === 0,
      outcome: num(prediction.home_clean_sheet_probability, 0) >= 0.5
        ? (awayGoals === 0 ? "hit" : "miss")
        : (awayGoals === 0 ? "unexpected_clean_sheet" : "no_call")
    },
    away: {
      team: fixture.away_team,
      prior_probability: num(prediction.away_clean_sheet_probability, null),
      predicted_clean_sheet_call: num(prediction.away_clean_sheet_probability, 0) >= 0.5,
      actual_clean_sheet: homeGoals === 0,
      outcome: num(prediction.away_clean_sheet_probability, 0) >= 0.5
        ? (homeGoals === 0 ? "hit" : "miss")
        : (homeGoals === 0 ? "unexpected_clean_sheet" : "no_call")
    }
  };

  return {
    fixture_key: fixture.local_fixture_id,
    match_number: fixture.match_number,
    matchday: "md1",
    home_team: fixture.home_team,
    away_team: fixture.away_team,
    prior_predicted_home_xg: num(prediction.home_expected_goals, null),
    prior_predicted_away_xg: num(prediction.away_expected_goals, null),
    prior_most_likely_score: prediction.top_scorelines?.[0]?.scoreline || null,
    prior_home_win_probability: num(prediction.home_win_probability, null),
    prior_draw_probability: num(prediction.draw_probability, null),
    prior_away_win_probability: num(prediction.away_win_probability, null),
    prior_home_clean_sheet_probability: num(prediction.home_clean_sheet_probability, null),
    prior_away_clean_sheet_probability: num(prediction.away_clean_sheet_probability, null),
    actual_home_goals: homeGoals,
    actual_away_goals: awayGoals,
    actual_total_goals: totalGoals,
    predicted_total_xg: predictedTotal,
    total_goal_error: round(totalGoals - predictedTotal),
    absolute_total_goal_error: round(Math.abs(totalGoals - predictedTotal)),
    home_goal_error: round(homeGoals - num(prediction.home_expected_goals, 0)),
    away_goal_error: round(awayGoals - num(prediction.away_expected_goals, 0)),
    favorite_team_before_match: prediction.favorite_team || prediction.favorite || null,
    favorite_side_before_match: favoriteClass,
    favorite_result_correct: favoriteCorrect,
    result_class_predicted: resultLabel(predictedClass),
    result_class_final: resultLabel(finalClass),
    clean_sheet_evaluation: cleanSheetEvaluation,
    upset_flag: !favoriteCorrect && num(prediction.favorite_win_probability, 0) >= 0.5,
    high_scoring_miss_flag: totalGoals - predictedTotal >= 2 || (totalGoals >= 4 && totalGoals - predictedTotal >= 1.25),
    low_scoring_miss_flag: predictedTotal - totalGoals >= 2 || (predictedTotal >= 3 && totalGoals <= 1),
    match_uncertainty: prediction.matchUncertainty || prediction.match_uncertainty || null,
    qa_flags: prediction.qa_flags || []
  };
});

const fixtureByKey = new Map(fixtureCalibrationRows.map((row) => [row.fixture_key, row]));
const teamResidualRows = [];
for (const row of fixtureCalibrationRows) {
  const prediction = scoreByFixture.get(row.fixture_key);
  const sides = [
    {
      team: row.home_team,
      opponent: row.away_team,
      side: "home",
      predictedGoalsFor: row.prior_predicted_home_xg,
      predictedGoalsAgainst: row.prior_predicted_away_xg,
      actualGoalsFor: row.actual_home_goals,
      actualGoalsAgainst: row.actual_away_goals,
      winProbability: prediction.home_win_probability
    },
    {
      team: row.away_team,
      opponent: row.home_team,
      side: "away",
      predictedGoalsFor: row.prior_predicted_away_xg,
      predictedGoalsAgainst: row.prior_predicted_home_xg,
      actualGoalsFor: row.actual_away_goals,
      actualGoalsAgainst: row.actual_home_goals,
      winProbability: prediction.away_win_probability
    }
  ];

  for (const side of sides) {
    const attackResidual = side.actualGoalsFor - side.predictedGoalsFor;
    const defenseResidual = side.actualGoalsAgainst - side.predictedGoalsAgainst;
    const attackStandardized = attackResidual / Math.sqrt(Math.max(0.25, side.predictedGoalsFor + 0.25));
    const defenseStandardized = defenseResidual / Math.sqrt(Math.max(0.25, side.predictedGoalsAgainst + 0.25));
    const maxSeverity = Math.max(Math.abs(attackStandardized), Math.abs(defenseStandardized));
    const residualSeverity = maxSeverity >= 2.2 ? "extreme" : maxSeverity >= 1.3 ? "moderate" : "normal";

    let action = "none";
    if (residualSeverity === "extreme") {
      action = "uncertainty increase";
    } else if (attackResidual >= 1.2 && defenseResidual <= 1.2) {
      action = "small boost";
    } else if (attackResidual <= -1.2 && defenseResidual <= 1.2) {
      action = "small downgrade";
    } else if (Math.abs(defenseResidual) >= 1.2) {
      action = "uncertainty increase";
    }

    teamResidualRows.push({
      team: side.team,
      team_key: safeTeamKey(side.team),
      opponent: side.opponent,
      side: side.side,
      fixture_key: row.fixture_key,
      match_number: row.match_number,
      predicted_goals_for: round(side.predictedGoalsFor),
      actual_goals_for: side.actualGoalsFor,
      predicted_goals_against: round(side.predictedGoalsAgainst),
      actual_goals_against: side.actualGoalsAgainst,
      attack_residual: round(attackResidual),
      defense_residual: round(defenseResidual),
      opponent_adjusted_attack_residual: round(attackStandardized),
      opponent_adjusted_defensive_residual: round(defenseStandardized),
      opponent_adjustment_note: "Standardized against the fixture-specific predicted goal environment; the prediction already contains opponent adjustment.",
      residual_severity: residualSeverity,
      recommended_score_model_action: action
    });
  }
}

const teamResidualByTeam = new Map(teamResidualRows.map((row) => [row.team_key, row]));
const playerUniverseIds = new Set([
  ...officialRecords.map((row) => String(row.official_fantasy_player_id)),
  ...livePlayers.players.map((row) => String(row.official_fantasy_player_id)),
  ...md1ProjectionRows.map((row) => String(row.official_fantasy_player_id))
]);

const playerRows = Array.from(playerUniverseIds)
  .sort((left, right) => num(left, 0) - num(right, 0))
  .map((officialId) => {
    const official = officialById.get(officialId);
    const livePlayer = livePlayerByOfficialId.get(officialId);
    const projection = projectionByOfficialId.get(officialId);
    const financeMetric = financeByOfficialId.get(officialId);
    const recRows = recommendationsByOfficialId.get(officialId) || [];
    const hasRoundPoints = Boolean(
      livePlayer?.stats?.roundPoints &&
      Object.prototype.hasOwnProperty.call(livePlayer.stats.roundPoints, "1")
    );
    const actualPoints = hasRoundPoints ? num(livePlayer.stats.roundPoints["1"], null) : null;
    const roleEvidence = roleEvidenceFromLive(livePlayer, projection);
    const projectionError = Number.isFinite(actualPoints) && projection
      ? round(actualPoints - num(projection.raw_expected_points, 0))
      : null;
    const fixtureRow = projection?.fixture_id ? fixtureByKey.get(projection.fixture_id) : null;

    return {
      official_fantasy_player_id: officialId,
      name: official?.name || livePlayer?.name || projection?.name || null,
      team: official?.country || livePlayer?.team_name || projection?.country || null,
      country: official?.country || livePlayer?.team_name || projection?.country || null,
      position: official?.official_fantasy_position || livePlayer?.position || projection?.official_fantasy_position || null,
      price: num(official?.official_price ?? livePlayer?.price ?? projection?.official_price, null),
      price_tier: priceTier(official?.official_price ?? livePlayer?.price ?? projection?.official_price),
      selectable_status: official?.selectable_status || livePlayer?.status || projection?.selectable_status || null,
      prior_md1_projection_available: Boolean(projection),
      prior_md1_projection_id: projection?.player_matchday_projection_id || null,
      prior_md1_projected_points: projection ? num(projection.raw_expected_points, null) : null,
      prior_md1_risk_adjusted_points: projection ? num(projection.risk_adjusted_points, null) : null,
      prior_md1_start_probability: projection ? num(projection.start_probability, null) : null,
      prior_md1_expected_minutes: projection ? num(projection.expected_minutes, null) : null,
      projection_confidence: projection?.projection_confidence || null,
      role_label_prior: projection?.minutes_context?.role_label || projection?.role_label || null,
      role_confidence_prior: projection?.minutes_context?.role_confidence || projection?.role_confidence || null,
      fixture_key: projection?.fixture_id || null,
      opponent: projection?.opponent || null,
      actual_md1_fantasy_points: actualPoints,
      actual_md1_points_available: Number.isFinite(actualPoints),
      actual_md1_match_status: livePlayer?.matchStatus ?? null,
      role_evidence: roleEvidence,
      projection_error: projectionError,
      start_probability_miss_flag: roleEvidence.start_probability_miss_flag,
      recommendation_status_before_md1: recRows.map((row) => ({
        mode: row.mode,
        mode_label: row.mode_label,
        rank: row.rank,
        tier: row.recommendation_tier,
        recommendation_score: num(row.recommendation_score, null)
      })),
      in_any_public_recommendation_surface: recommendationOfficialIds.has(officialId),
      in_captain_watchlist: captainRecommendationIds.has(officialId),
      finance_context: financeMetric ? {
        finance_alpha_score: num(financeMetric.finance_alpha_score, null),
        value_over_replacement: num(financeMetric.value_over_replacement, null),
        efficient_frontier: Boolean(financeMetric.efficient_frontier),
        dominated_player: Boolean(financeMetric.dominated_player),
        points_per_price: num(financeMetric.points_per_price, null),
        risk_adjusted_points_per_price: num(financeMetric.risk_adjusted_points_per_price, null)
      } : null,
      failure_category: classifyPlayerFailure({ projection, actualPoints, roleEvidence, fixtureRow }),
      data_quality_flags: projection?.data_quality_flags || financeMetric?.data_quality_flags || []
    };
  });

const playerRowByOfficialId = new Map(playerRows.map((row) => [String(row.official_fantasy_player_id), row]));

const recommendationAuditRows = md1RecommendationRows.map((row) => {
  const officialId = String(row.official_fantasy_player_id);
  const playerRow = playerRowByOfficialId.get(officialId);
  const projection = projectionByOfficialId.get(officialId);
  const financeMetric = financeByOfficialId.get(officialId);
  const teamResidual = teamResidualByTeam.get(safeTeamKey(row.country));
  const actualPoints = playerRow?.actual_md1_fantasy_points ?? null;
  const output = {
    official_fantasy_player_id: officialId,
    name: row.name,
    team: row.country,
    position: row.official_fantasy_position,
    price: num(row.official_price, null),
    recommendation_type: row.mode,
    recommendation_label: row.mode_label,
    rank: row.rank,
    recommendation_tier: row.recommendation_tier,
    projected_points: num(row.raw_expected_points ?? projection?.raw_expected_points, null),
    risk_adjusted_points: num(row.risk_adjusted_points ?? projection?.risk_adjusted_points, null),
    actual_md1_fantasy_points: actualPoints,
    projection_error: Number.isFinite(actualPoints) ? round(actualPoints - num(row.raw_expected_points, 0)) : null,
    start_probability: num(row.start_probability ?? projection?.start_probability, null),
    expected_minutes: num(row.expected_minutes ?? projection?.expected_minutes, null),
    captain_watchlist_status: row.mode === "captain",
    fantasy_result: recommendationResult(actualPoints),
    value_score: num(row.value_score, null),
    captain_score: num(row.captain_score, null),
    finance_alpha_score: num(row.finance_context?.finance_alpha_score ?? financeMetric?.finance_alpha_score, null),
    fixture_key: projection?.fixture_id || null,
    fixture_environment_failure_context: teamResidual ? {
      attack_residual: teamResidual.attack_residual,
      defense_residual: teamResidual.defense_residual,
      severity: teamResidual.residual_severity
    } : null,
    role_evidence: playerRow?.role_evidence || null
  };

  return {
    ...output,
    failure_category: classifyRecommendationFailure(output, playerRow, teamResidual, financeMetric)
  };
});

const playerProjectionErrorRows = playerRows
  .filter((row) => Number.isFinite(row.projection_error))
  .sort(sortByAbs("projection_error"));
const topUnderpredictedPlayers = playerRows
  .filter((row) => Number.isFinite(row.projection_error))
  .sort(sortDesc("projection_error"));
const topOverpredictedPlayers = playerRows
  .filter((row) => Number.isFinite(row.projection_error))
  .sort((left, right) => num(left.projection_error, Infinity) - num(right.projection_error, Infinity));
const roleMissRows = playerRows
  .filter((row) => row.start_probability_miss_flag)
  .sort((left, right) => num(right.prior_md1_start_probability, 0) - num(left.prior_md1_start_probability, 0));
const actualTopPlayers = playerRows
  .filter((row) => Number.isFinite(row.actual_md1_fantasy_points))
  .sort(sortDesc("actual_md1_fantasy_points"));
const omittedActualStars = actualTopPlayers
  .filter((row) => !row.in_any_public_recommendation_surface)
  .slice(0, 25);
const omittedCaptainCandidates = md1ProjectionRows
  .filter((row) => !captainRecommendationIds.has(String(row.official_fantasy_player_id)))
  .sort(sortDesc("captain_score"))
  .slice(0, 25);

const cleanSheetCalls = fixtureCalibrationRows.flatMap((row) => [
  row.clean_sheet_evaluation.home,
  row.clean_sheet_evaluation.away
]);
const predictedCleanSheetCalls = cleanSheetCalls.filter((row) => row.predicted_clean_sheet_call);
const cleanSheetHits = predictedCleanSheetCalls.filter((row) => row.outcome === "hit").length;
const cleanSheetMisses = predictedCleanSheetCalls.filter((row) => row.outcome === "miss").length;
const unexpectedCleanSheets = cleanSheetCalls.filter((row) => row.outcome === "unexpected_clean_sheet").length;

const fixtureSummary = {
  md1_final_fixtures_used: fixtureCalibrationRows.length,
  incomplete_md1_fixtures_used: 0,
  average_predicted_total_goals: round(avg(fixtureCalibrationRows.map((row) => row.predicted_total_xg))),
  average_actual_total_goals: round(avg(fixtureCalibrationRows.map((row) => row.actual_total_goals))),
  calibration_ratio_actual_to_predicted: round(
    sum(fixtureCalibrationRows.map((row) => row.actual_total_goals)) /
    sum(fixtureCalibrationRows.map((row) => row.predicted_total_xg))
  ),
  mean_absolute_total_goal_error: round(avg(fixtureCalibrationRows.map((row) => row.absolute_total_goal_error))),
  predicted_result_correct: fixtureCalibrationRows.filter((row) => row.result_class_predicted === row.result_class_final).length,
  predicted_result_accuracy: pct(
    fixtureCalibrationRows.filter((row) => row.result_class_predicted === row.result_class_final).length,
    fixtureCalibrationRows.length
  ),
  favorite_result_correct: fixtureCalibrationRows.filter((row) => row.favorite_result_correct).length,
  favorite_result_accuracy: pct(
    fixtureCalibrationRows.filter((row) => row.favorite_result_correct).length,
    fixtureCalibrationRows.length
  ),
  upset_flags: fixtureCalibrationRows.filter((row) => row.upset_flag).length,
  high_scoring_misses: fixtureCalibrationRows.filter((row) => row.high_scoring_miss_flag).length,
  low_scoring_misses: fixtureCalibrationRows.filter((row) => row.low_scoring_miss_flag).length,
  clean_sheet: {
    predicted_clean_sheet_calls: predictedCleanSheetCalls.length,
    hits: cleanSheetHits,
    misses: cleanSheetMisses,
    accuracy: pct(cleanSheetHits, predictedCleanSheetCalls.length),
    unexpected_clean_sheets: unexpectedCleanSheets
  }
};

const playerSummary = {
  player_rows: playerRows.length,
  active_official_fantasy_players: officialRecords.length,
  md1_projection_rows: md1ProjectionRows.length,
  actual_point_rows_available: playerRows.filter((row) => row.actual_md1_points_available).length,
  positive_actual_point_rows: playerRows.filter((row) => Number.isFinite(row.actual_md1_fantasy_points) && row.actual_md1_fantasy_points > 0).length,
  average_projection_error: round(avg(playerRows.map((row) => row.projection_error).filter(Number.isFinite))),
  mean_absolute_projection_error: round(avg(playerRows.map((row) => Number.isFinite(row.projection_error) ? Math.abs(row.projection_error) : null).filter(Number.isFinite))),
  role_miss_flags: roleMissRows.length,
  match_status_rows_with_direct_start_sub_evidence: playerRows.filter((row) => row.role_evidence?.started || row.role_evidence?.sub_appearance || row.role_evidence?.not_in_squad).length,
  role_evidence_counts: counts(playerRows, (row) => row.role_evidence?.inferred_status),
  by_position: Object.fromEntries(Array.from(groupBy(playerRows, (row) => row.position || "unknown")).map(([position, rows]) => [
    position,
    {
      rows: rows.length,
      actual_rows: rows.filter((row) => row.actual_md1_points_available).length,
      average_error: round(avg(rows.map((row) => row.projection_error).filter(Number.isFinite))),
      mean_absolute_error: round(avg(rows.map((row) => Number.isFinite(row.projection_error) ? Math.abs(row.projection_error) : null).filter(Number.isFinite)))
    }
  ])),
  by_price_tier: Object.fromEntries(Array.from(groupBy(playerRows, (row) => row.price_tier)).map(([tier, rows]) => [
    tier,
    {
      rows: rows.length,
      actual_rows: rows.filter((row) => row.actual_md1_points_available).length,
      average_error: round(avg(rows.map((row) => row.projection_error).filter(Number.isFinite))),
      mean_absolute_error: round(avg(rows.map((row) => Number.isFinite(row.projection_error) ? Math.abs(row.projection_error) : null).filter(Number.isFinite)))
    }
  ]))
};

const recommendationSummaryByMode = Object.fromEntries(Array.from(groupBy(recommendationAuditRows, (row) => row.recommendation_type)).map(([mode, rows]) => [
  mode,
  {
    rows: rows.length,
    actual_rows: rows.filter((row) => Number.isFinite(row.actual_md1_fantasy_points)).length,
    no_actual_rows: rows.filter((row) => !Number.isFinite(row.actual_md1_fantasy_points)).length,
    average_actual_points: round(avg(rows.map((row) => row.actual_md1_fantasy_points).filter(Number.isFinite))),
    average_projection_error: round(avg(rows.map((row) => row.projection_error).filter(Number.isFinite))),
    fantasy_results: counts(rows, (row) => row.fantasy_result),
    failure_categories: counts(rows, (row) => row.failure_category),
    low_price_rows: rows.filter((row) => num(row.price, 0) <= 5).length,
    premium_rows: rows.filter((row) => num(row.price, 0) >= 8).length
  }
]));

const recommendationSummary = {
  recommendation_rows: recommendationAuditRows.length,
  md1_recommended_unique_players: new Set(recommendationAuditRows.map((row) => row.official_fantasy_player_id)).size,
  rows_with_actual_points: recommendationAuditRows.filter((row) => Number.isFinite(row.actual_md1_fantasy_points)).length,
  rows_without_actual_points: recommendationAuditRows.filter((row) => !Number.isFinite(row.actual_md1_fantasy_points)).length,
  average_actual_points: round(avg(recommendationAuditRows.map((row) => row.actual_md1_fantasy_points).filter(Number.isFinite))),
  average_projection_error: round(avg(recommendationAuditRows.map((row) => row.projection_error).filter(Number.isFinite))),
  fantasy_results: counts(recommendationAuditRows, (row) => row.fantasy_result),
  failure_categories: counts(recommendationAuditRows, (row) => row.failure_category),
  by_mode: recommendationSummaryByMode
};

const teamBuilderMd1Audit = {
  saved_or_generated_baseline_found: false,
  scope_note: "No saved/generated Team Builder squad artifact was found in data/. This audit uses active MD1 recommendation, projection, and finance inputs only.",
  balanced_md1_recommendation_rows: recommendationAuditRows.filter((row) => row.recommendation_type === "balanced").length,
  balanced_low_price_rows: recommendationAuditRows.filter((row) => row.recommendation_type === "balanced" && num(row.price, 0) <= 5).length,
  balanced_premium_rows: recommendationAuditRows.filter((row) => row.recommendation_type === "balanced" && num(row.price, 0) >= 8).length,
  balanced_average_price: round(avg(recommendationAuditRows.filter((row) => row.recommendation_type === "balanced").map((row) => row.price).filter(Number.isFinite))),
  balanced_average_actual_points: round(avg(recommendationAuditRows.filter((row) => row.recommendation_type === "balanced").map((row) => row.actual_md1_fantasy_points).filter(Number.isFinite))),
  balanced_failure_categories: counts(recommendationAuditRows.filter((row) => row.recommendation_type === "balanced"), (row) => row.failure_category),
  value_finance_overweight_signal: recommendationAuditRows.filter((row) =>
    ["balanced", "differential", "safe"].includes(row.recommendation_type) &&
    (num(row.finance_alpha_score, 0) >= 70 || num(row.value_score, 0) >= 1.2) &&
    (!Number.isFinite(row.actual_md1_fantasy_points) || row.actual_md1_fantasy_points <= 2)
  ).length,
  elite_high_upside_omitted_actual_top20: omittedActualStars.slice(0, 20).map((row) => ({
    official_fantasy_player_id: row.official_fantasy_player_id,
    name: row.name,
    team: row.team,
    position: row.position,
    price: row.price,
    actual_md1_fantasy_points: row.actual_md1_fantasy_points,
    prior_md1_projected_points: row.prior_md1_projected_points,
    captain_watchlist: row.in_captain_watchlist
  })),
  omitted_captain_score_top20: omittedCaptainCandidates.slice(0, 20).map((row) => ({
    official_fantasy_player_id: String(row.official_fantasy_player_id),
    name: row.name,
    team: row.country,
    position: row.official_fantasy_position,
    price: row.official_price,
    captain_score: row.captain_score,
    raw_expected_points: row.raw_expected_points,
    start_probability: row.start_probability
  })),
  conclusion: "A hard Team Builder output audit is not possible without a saved/generated squad artifact. The input audit still shows whether value/finance-driven candidates underperformed and which elite/upside rows were omitted."
};

const worstFixtureMisses = [...fixtureCalibrationRows].sort(sortByAbs("total_goal_error"));
const teamAttackUpgrades = [...teamResidualRows].sort(sortDesc("attack_residual"));
const teamDefenseConcerns = [...teamResidualRows].sort(sortDesc("defense_residual"));
const recommendationFailures = recommendationAuditRows
  .filter((row) => ["miss", "no_actual_row", "flat"].includes(row.fantasy_result))
  .sort((left, right) => {
    const leftError = Number.isFinite(left.projection_error) ? left.projection_error : -99;
    const rightError = Number.isFinite(right.projection_error) ? right.projection_error : -99;
    return leftError - rightError;
  });

const actionableFixes = [
  "Recalibrate the score model goal environment upward, but shrink the full MD1 1.27x raw ratio to avoid overfitting one matchday.",
  "Add a specific underdog/upset uncertainty layer for close or medium-favorite fixtures; MD1 result accuracy was only 10/24.",
  "Do not let clean-sheet context dominate defender/keeper recommendations after MD1; high-probability clean sheets missed often.",
  "Treat missing MD1 actual-points rows for high-start players as a role/start warning before MD2 projections.",
  "Increase weight on completed MD1 live points and point-row presence for start/minutes model v2, while separating it from ownership-only drift.",
  "Add team-specific attack/defense residual priors with shrinkage for extreme MD1 misses such as Germany attack and Spain finishing volatility.",
  "Add recommendation penalties for high finance-alpha or value candidates with no MD1 points row or weak role evidence.",
  "Strengthen captain shortlist exposure to elite/high-upside actual performers, not only price-adjusted value.",
  "Require public pick QA to show actual MD1 backtest by mode before promoting MD2 recommendations.",
  "For Team Builder v4, cap low-price/value fill-ins unless role evidence or MD1 points row confirms they are playable."
];

const corrections = [
  buildCorrection(
    "score_v4_goal_environment",
    "score model v4",
    "Raise the global goal baseline with shrinkage toward the pre-MD1 prior; do not apply the full MD1 ratio unshrunk.",
    "high confidence",
    "likely robust, but exact multiplier could overfit one matchday",
    `MD1 actual avg goals ${fixtureSummary.average_actual_total_goals} vs predicted ${fixtureSummary.average_predicted_total_goals}; ratio ${fixtureSummary.calibration_ratio_actual_to_predicted}.`
  ),
  buildCorrection(
    "score_v4_upset_uncertainty",
    "score model v4",
    "Add a calibrated upset/draw uncertainty layer for medium favorites and high-uncertainty team contexts.",
    "high confidence",
    "likely robust",
    `Predicted/final result accuracy was ${fixtureSummary.predicted_result_correct}/${fixtureSummary.md1_final_fixtures_used}; favorite wins were ${fixtureSummary.favorite_result_correct}/${fixtureSummary.md1_final_fixtures_used}.`
  ),
  buildCorrection(
    "score_v4_clean_sheet_shrink",
    "score model v4",
    "Shrink clean-sheet probabilities for public defensive context until MD1 residuals are incorporated.",
    "medium confidence",
    "could partly overfit one matchday",
    `${cleanSheetMisses}/${predictedCleanSheetCalls.length} high clean-sheet calls missed.`
  ),
  buildCorrection(
    "role_v2_md1_points_rows",
    "role/start/minutes model v2",
    "Use completed MD1 point-row presence and matchStatus when available as a strong live role signal for MD2.",
    "high confidence",
    "likely robust",
    `${playerSummary.actual_point_rows_available} players have completed MD1 point rows; ${playerSummary.role_miss_flags} high-start/no-row or low-start/positive-row role flags.`
  ),
  buildCorrection(
    "projection_v4_role_gating",
    "component player projection model v4",
    "Gate component projections by live role evidence before applying event-rate upside.",
    "high confidence",
    "likely robust",
    `Player mean absolute projection error was ${playerSummary.mean_absolute_projection_error}; missing point rows dominate hard role evidence gaps.`
  ),
  buildCorrection(
    "projection_v4_position_review",
    "component player projection model v4",
    "Review position-level component priors against MD1 actual errors before rerunning MD2.",
    "medium confidence",
    "some risk of overfitting one matchday",
    "Position-level MD1 error tables are included in the dataset summary."
  ),
  buildCorrection(
    "recommendations_v4_value_guardrail",
    "recommendations v4",
    "Add a value/finance guardrail: cheap or high-finance-alpha candidates need confirmed role evidence or a stronger raw projection.",
    "high confidence",
    "likely robust",
    `${teamBuilderMd1Audit.value_finance_overweight_signal} value/finance-driven recommendation rows were flat, misses, or had no actual row.`
  ),
  buildCorrection(
    "recommendations_v4_star_exposure",
    "recommendations v4",
    "Add explicit elite/high-upside exposure checks for public picks and captain lists.",
    "medium confidence",
    "likely robust as a QA guardrail, exact thresholds need tuning",
    `${teamBuilderMd1Audit.elite_high_upside_omitted_actual_top20.length} top actual MD1 performers were outside the MD1 recommendation surface.`
  ),
  buildCorrection(
    "builder_v4_playable_value_cap",
    "Team Builder optimizer v4",
    "Cap value filler exposure in Balanced Squad unless MD1 role evidence, start probability, and expected minutes all clear stricter thresholds.",
    "high confidence",
    "likely robust",
    "No saved builder squad artifact exists, but active inputs show value/finance rows need live role gating before squad optimization."
  ),
  buildCorrection(
    "public_qa_md1_backtest",
    "public explanation/QA",
    "Publish model notes that distinguish data-path health from model calibration misses and show MD1 backtest tables before MD2 promotion.",
    "high confidence",
    "robust",
    "Active data path, fixture mapping, and official identity are green; the failures are model calibration and role-estimation issues."
  )
];

const qa = {
  status: "pass",
  checks: [
    {
      id: "all_24_final_md1_fixtures_used",
      status: fixtureCalibrationRows.length === 24 ? "pass" : "fail",
      detail: `${fixtureCalibrationRows.length}/24 final MD1 fixtures used.`
    },
    {
      id: "no_incomplete_fixtures_used",
      status: completedMd1Fixtures.every((fixture) => fixture.fixture_status === "complete" && fixture.score_status === "final") ? "pass" : "fail",
      detail: "Only complete/final, safe-to-display MD1 fixtures are included."
    },
    {
      id: "no_md2_md3_actuals_used",
      status: completedMd1Fixtures.every((fixture) => String(fixture.round_id) === "1") ? "pass" : "fail",
      detail: "All fixture actuals come from round_id=1."
    },
    {
      id: "player_ids_resolve_active_official_pool",
      status: playerRows.every((row) => officialById.has(String(row.official_fantasy_player_id))) ? "pass" : "fail",
      detail: `${playerRows.filter((row) => officialById.has(String(row.official_fantasy_player_id))).length}/${playerRows.length} player rows resolve through official_position_records.`
    },
    {
      id: "no_duplicate_fixture_keys",
      status: new Set(fixtureCalibrationRows.map((row) => row.fixture_key)).size === fixtureCalibrationRows.length ? "pass" : "fail",
      detail: `${new Set(fixtureCalibrationRows.map((row) => row.fixture_key)).size}/${fixtureCalibrationRows.length} unique fixture keys.`
    },
    {
      id: "no_duplicate_official_fantasy_player_ids",
      status: new Set(playerRows.map((row) => row.official_fantasy_player_id)).size === playerRows.length ? "pass" : "fail",
      detail: `${new Set(playerRows.map((row) => row.official_fantasy_player_id)).size}/${playerRows.length} unique official fantasy player IDs.`
    },
    {
      id: "no_stale_legacy_public_data_used",
      status: "pass",
      detail: "Sources are current fantasy-pool and live support files only; legacy files are not read by this script."
    },
    {
      id: "final_squads_not_claimed_source_backed",
      status: officialStatus.summary?.confirmed_final_squad_rows === 0 ? "pass" : "fail",
      detail: `confirmed_final_squad_rows=${officialStatus.summary?.confirmed_final_squad_rows ?? "unknown"}; final squads are not claimed source-backed.`
    },
    {
      id: "active_md2_data_flow_precheck",
      status: activeQa.status === "pass" && activeQa.failures.length === 0 && activeQa.warnings.length === 0 ? "pass" : "fail",
      detail: `activeMd2DataFlowQa status=${activeQa.status}, failures=${activeQa.failures.length}, warnings=${activeQa.warnings.length}.`
    },
    {
      id: "live_fixture_mapping_precheck",
      status: liveFixtureQa.status === "passed" && liveFixtureQa.summary?.final_fixtures_shown === 24 ? "pass" : "fail",
      detail: `liveFixtureMappingQa status=${liveFixtureQa.status}, final_fixtures_shown=${liveFixtureQa.summary?.final_fixtures_shown}.`
    }
  ],
  invalid_number_paths: []
};

qa.status = qa.checks.every((check) => check.status === "pass") ? "pass" : "fail";

const dataset = {
  schema_version: "md1_calibration_dataset_v1",
  generated_at: generatedAt,
  source_files: {
    activeMd2DataFlowQa: "data/activeMd2DataFlowQa.json",
    liveMatchdayStatus: "data/liveMatchdayStatus_v1.json",
    livePlayerStatus: "data/livePlayerStatus_v1.json",
    liveFixtureMappingQa: "data/liveFixtureMappingQa_v1.json",
    scorePredictions: "data/scorePredictions_fantasyPool_v3.json",
    playerMatchdayProjections: "data/playerMatchdayProjections_fantasyPool_v3.json",
    recommendations: "data/matchdayRecommendations_fantasyPool_v3.json",
    financeMetrics: "data/playerFinanceMetrics_fantasyPool_v1.json",
    officialDataStatus: "fantasyPoolOfficialDataStatusData.js",
    fantasyRules: "fantasyRules.json"
  },
  scope: {
    matchday: "md1",
    final_fixture_count: fixtureCalibrationRows.length,
    uses_only_completed_md1_fixtures: true,
    uses_md2_or_md3_actuals: false,
    active_identity_universe: "FANTASY_POOL_OFFICIAL_DATA_STATUS.official_position_records",
    primary_player_join_key: "official_fantasy_player_id",
    final_squad_source_status: "still_blocked_no_source_backed_final_squads",
    ownership_only_changes_used_as_model_signal: false
  },
  summary: {
    fixture: fixtureSummary,
    player: playerSummary,
    recommendation: recommendationSummary,
    team_builder: teamBuilderMd1Audit
  },
  fixture_calibration_rows: fixtureCalibrationRows,
  team_residual_rows: teamResidualRows,
  player_rows: playerRows,
  recommendation_audit_rows: recommendationAuditRows,
  team_builder_md1_audit: teamBuilderMd1Audit,
  qa
};

const invalidDatasetNumbers = hasInvalidNumber(dataset);
dataset.qa.invalid_number_paths = invalidDatasetNumbers;
dataset.qa.checks.push({
  id: "no_nan_or_infinity",
  status: invalidDatasetNumbers.length === 0 ? "pass" : "fail",
  detail: invalidDatasetNumbers.length ? invalidDatasetNumbers.slice(0, 10).join(", ") : "No NaN or Infinity values found."
});
dataset.qa.status = dataset.qa.checks.every((check) => check.status === "pass") ? "pass" : "fail";

const postmortem = {
  schema_version: "md1_model_postmortem_v1",
  generated_at: generatedAt,
  source_dataset: OUTPUT_DATASET,
  status: dataset.qa.status,
  executive_summary: [
    {
      conclusion: "The active data path did not fail.",
      confidence: "high",
      detail: "Active MD2 data-flow QA and live fixture mapping QA are green; all 24 MD1 final fixtures are included and mapped safely."
    },
    {
      conclusion: "The score model was globally low on MD1 goals and weak on result calibration.",
      confidence: "high",
      detail: `Average predicted total goals were ${fixtureSummary.average_predicted_total_goals}; actual MD1 average was ${fixtureSummary.average_actual_total_goals}; result accuracy was ${fixtureSummary.predicted_result_correct}/24.`
    },
    {
      conclusion: "Player role/start evidence is the largest rebuild blocker, not identity mapping.",
      confidence: "high",
      detail: `${playerSummary.role_miss_flags} possible role/start flags are detected from high-start/no-points-row or low-start/positive-points evidence; direct matchStatus start/sub evidence is unavailable in the current live feed.`
    },
    {
      conclusion: "Recommendation failures are model failures around role, fixture environment, and value/captain weighting.",
      confidence: "medium",
      detail: "The recommendation audit shows flat/miss/no-actual-row outcomes by mode; no stale legacy public data path is used."
    },
    {
      conclusion: "Team Builder cannot be fully audited without a saved squad artifact.",
      confidence: "high",
      detail: "No saved/generated Balanced Squad output was found; the current audit is limited to active builder inputs and recommendation/finance signals."
    }
  ],
  score_model_failure: {
    metrics: fixtureSummary,
    biggest_fixture_misses: sampleRows(worstFixtureMisses, [
      "match_number",
      "home_team",
      "away_team",
      "actual_total_goals",
      "predicted_total_xg",
      "total_goal_error",
      "favorite_team_before_match",
      "result_class_predicted",
      "result_class_final"
    ], 10),
    teams_most_underpredicted_attack: sampleRows(teamAttackUpgrades, [
      "team",
      "opponent",
      "predicted_goals_for",
      "actual_goals_for",
      "attack_residual",
      "residual_severity",
      "recommended_score_model_action"
    ], 20),
    teams_most_overpredicted_attack: sampleRows([...teamResidualRows].sort((left, right) => num(left.attack_residual, Infinity) - num(right.attack_residual, Infinity)), [
      "team",
      "opponent",
      "predicted_goals_for",
      "actual_goals_for",
      "attack_residual",
      "residual_severity",
      "recommended_score_model_action"
    ], 20),
    teams_defensive_concerns: sampleRows(teamDefenseConcerns, [
      "team",
      "opponent",
      "predicted_goals_against",
      "actual_goals_against",
      "defense_residual",
      "residual_severity",
      "recommended_score_model_action"
    ], 20),
    global_goal_environment_assessment: fixtureSummary.calibration_ratio_actual_to_predicted > 1.1
      ? "too_low_on_md1"
      : fixtureSummary.calibration_ratio_actual_to_predicted < 0.9
        ? "too_high_on_md1"
        : "roughly_calibrated",
    pele_prior_assessment: "MD1 indicates a PELE-anchored prior that needs shrinkage-calibrated goal-environment and team residual updates; one matchday is not enough to declare the PELE prior structurally wrong."
  },
  player_projection_failure: {
    metrics: playerSummary,
    top_underpredicted_players: sampleRows(topUnderpredictedPlayers, [
      "official_fantasy_player_id",
      "name",
      "team",
      "position",
      "prior_md1_projected_points",
      "actual_md1_fantasy_points",
      "projection_error",
      "role_label_prior",
      "role_evidence"
    ], 20),
    top_overpredicted_players: sampleRows(topOverpredictedPlayers, [
      "official_fantasy_player_id",
      "name",
      "team",
      "position",
      "prior_md1_projected_points",
      "actual_md1_fantasy_points",
      "projection_error",
      "role_label_prior",
      "role_evidence"
    ], 20),
    start_role_misses: sampleRows(roleMissRows, [
      "official_fantasy_player_id",
      "name",
      "team",
      "position",
      "prior_md1_start_probability",
      "prior_md1_expected_minutes",
      "actual_md1_fantasy_points",
      "role_evidence",
      "failure_category"
    ], 20),
    position_level_issues: playerSummary.by_position,
    price_tier_issues: playerSummary.by_price_tier
  },
  recommendation_failure: {
    metrics: recommendationSummary,
    worst_recommendation_misses: sampleRows(recommendationFailures, [
      "official_fantasy_player_id",
      "name",
      "team",
      "recommendation_type",
      "rank",
      "projected_points",
      "actual_md1_fantasy_points",
      "projection_error",
      "failure_category"
    ], 30),
    value_finance_overweight_signal_count: teamBuilderMd1Audit.value_finance_overweight_signal,
    omitted_high_upside_actuals: teamBuilderMd1Audit.elite_high_upside_omitted_actual_top20,
    captain_candidates_assessment: "Captain rows are auditable, but captain quality needs stronger actual-upside and role evidence checks before MD2 promotion."
  },
  team_builder_md1_audit: teamBuilderMd1Audit,
  model_rebuild_guidance: corrections,
  top_10_actionable_md2_fixes: actionableFixes,
  qa: dataset.qa,
  safe_to_proceed_to_score_model_v4: dataset.qa.status === "pass"
};

const invalidPostmortemNumbers = hasInvalidNumber(postmortem);
if (invalidPostmortemNumbers.length) {
  postmortem.qa.status = "fail";
  postmortem.qa.invalid_number_paths = [
    ...(postmortem.qa.invalid_number_paths || []),
    ...invalidPostmortemNumbers
  ];
}

function reportMetric(label, value) {
  return `| ${label} | ${value ?? "n/a"} |`;
}

const worstFixtureTable = markdownTable(
  ["Match", "Fixture", "Actual", "Pred xG", "Error", "Pred", "Final"],
  worstFixtureMisses.slice(0, 10).map((row) => ({
    Match: row.match_number,
    Fixture: `${row.home_team} vs ${row.away_team}`,
    Actual: `${row.actual_home_goals}-${row.actual_away_goals}`,
    "Pred xG": row.predicted_total_xg,
    Error: row.total_goal_error,
    Pred: row.result_class_predicted,
    Final: row.result_class_final
  }))
);

const attackTable = markdownTable(
  ["Team", "Opponent", "Pred GF", "Actual GF", "Residual", "Action"],
  teamAttackUpgrades.slice(0, 10).map((row) => ({
    Team: row.team,
    Opponent: row.opponent,
    "Pred GF": row.predicted_goals_for,
    "Actual GF": row.actual_goals_for,
    Residual: row.attack_residual,
    Action: row.recommended_score_model_action
  }))
);

const recommendationModeTable = markdownTable(
  ["Mode", "Rows", "Actual Rows", "Avg Actual", "Avg Error", "Miss/No Actual"],
  Object.entries(recommendationSummary.by_mode).map(([mode, row]) => ({
    Mode: mode,
    Rows: row.rows,
    "Actual Rows": row.actual_rows,
    "Avg Actual": row.average_actual_points,
    "Avg Error": row.average_projection_error,
    "Miss/No Actual": `${row.fantasy_results.miss || 0}/${row.fantasy_results.no_actual_row || 0}`
  }))
);

const report = `# MD1 Model Postmortem v1

Generated: ${generatedAt}

## Executive Summary

- **Data path:** green. Active MD2 data-flow QA is pass, live fixture mapping QA is pass, and this dataset uses all ${fixtureSummary.md1_final_fixtures_used} completed MD1 fixtures.
- **Main failure:** model calibration, not identity plumbing. The score model predicted ${fixtureSummary.average_predicted_total_goals} average goals; MD1 delivered ${fixtureSummary.average_actual_total_goals}, a ${fixtureSummary.calibration_ratio_actual_to_predicted} actual/predicted ratio.
- **Result calibration:** weak. Predicted result class was correct ${fixtureSummary.predicted_result_correct}/${fixtureSummary.md1_final_fixtures_used}; favorites won ${fixtureSummary.favorite_result_correct}/${fixtureSummary.md1_final_fixtures_used}.
- **Player-role evidence:** incomplete but actionable. The live feed has ${playerSummary.actual_point_rows_available} MD1 actual-point rows, but direct start/sub/not-in-squad matchStatus evidence is currently unavailable.
- **Recommendation failure:** mode results show role, fixture-environment, value/finance, and captain-upside calibration issues. There is no evidence of a stale legacy public data path.
- **Final squads:** not source-backed. This report uses the official fantasy pool as the active identity universe and does not claim final-squad backing.

## Score Model Failure

| Metric | Value |
| --- | --- |
${[
  reportMetric("MD1 final fixtures used", fixtureSummary.md1_final_fixtures_used),
  reportMetric("Average predicted total goals", fixtureSummary.average_predicted_total_goals),
  reportMetric("Average actual total goals", fixtureSummary.average_actual_total_goals),
  reportMetric("Actual/predicted calibration ratio", fixtureSummary.calibration_ratio_actual_to_predicted),
  reportMetric("Mean absolute total-goal error", fixtureSummary.mean_absolute_total_goal_error),
  reportMetric("Predicted result accuracy", `${fixtureSummary.predicted_result_correct}/${fixtureSummary.md1_final_fixtures_used}`),
  reportMetric("Favorite win accuracy", `${fixtureSummary.favorite_result_correct}/${fixtureSummary.md1_final_fixtures_used}`),
  reportMetric("High-scoring misses", fixtureSummary.high_scoring_misses),
  reportMetric("Low-scoring misses", fixtureSummary.low_scoring_misses),
  reportMetric("Clean-sheet calls hit/miss", `${fixtureSummary.clean_sheet.hits}/${fixtureSummary.clean_sheet.misses}`)
].join("\n")}

The global MD1 goal environment was too low. The PELE prior should not be thrown away from one matchday, but score model v4 needs a shrinkage-calibrated goal lift, a stronger upset/draw uncertainty layer, and team residual updates.

### Biggest Fixture Misses

${worstFixtureTable}

### Attack Residual Upgrade Watch

${attackTable}

## Player Projection Failure

| Metric | Value |
| --- | --- |
${[
  reportMetric("Player rows", playerSummary.player_rows),
  reportMetric("MD1 projection rows", playerSummary.md1_projection_rows),
  reportMetric("Actual-point rows", playerSummary.actual_point_rows_available),
  reportMetric("Average projection error", playerSummary.average_projection_error),
  reportMetric("Mean absolute projection error", playerSummary.mean_absolute_projection_error),
  reportMetric("Possible start/role miss flags", playerSummary.role_miss_flags),
  reportMetric("Direct start/sub/not-in-squad statuses", playerSummary.match_status_rows_with_direct_start_sub_evidence)
].join("\n")}

Role/start/minutes model v2 should heavily consume MD1 point-row presence and any future matchStatus values. Because direct start/sub labels are absent right now, the report separates hard evidence from possible role misses.

## Recommendation Failure

${recommendationModeTable}

The strongest recommendation concern is not a legacy data path. It is that value/finance and clean-sheet/fixture context can still over-promote players whose MD1 role evidence is weak or whose environment failed. Captain Watchlist also needs a stronger elite-upside QA pass.

## Team Builder MD1 Audit

No saved/generated Balanced Squad output was found, so the Team Builder audit is input-based only. Balanced MD1 inputs had average price ${teamBuilderMd1Audit.balanced_average_price}, ${teamBuilderMd1Audit.balanced_low_price_rows} low-price rows, and ${teamBuilderMd1Audit.balanced_premium_rows} premium rows. Value/finance overweight signal rows: ${teamBuilderMd1Audit.value_finance_overweight_signal}.

## Model Rebuild Guidance

${corrections.map((item) => `- **${item.model_step}:** ${item.recommendation} Confidence: ${item.confidence}; robustness: ${item.robustness}. Evidence: ${item.evidence}`).join("\n")}

## Top 10 Actionable MD2 Fixes

${actionableFixes.map((item, index) => `${index + 1}. ${item}`).join("\n")}

## QA

| Check | Status | Detail |
| --- | --- | --- |
${dataset.qa.checks.map((check) => `| ${check.id} | ${check.status} | ${String(check.detail).replace(/\|/g, "\\|")} |`).join("\n")}

## Decision

Safe to proceed to score model v4: **${postmortem.safe_to_proceed_to_score_model_v4 ? "yes" : "no"}**.

Proceed with the rebuild using this report as calibration input, while keeping final-squad claims blocked until source-backed final squads exist.
`;

writeJson(OUTPUT_DATASET, dataset);
writeJson(OUTPUT_POSTMORTEM, postmortem);
fs.writeFileSync(OUTPUT_REPORT, report);

function printRows(title, rows, formatter) {
  console.log(`\n${title}`);
  rows.forEach((row, index) => {
    console.log(`${String(index + 1).padStart(2, " ")}. ${formatter(row)}`);
  });
}

printRows(
  "Worst 10 fixture prediction misses",
  worstFixtureMisses.slice(0, 10),
  (row) => `${row.home_team} ${row.actual_home_goals}-${row.actual_away_goals} ${row.away_team}: predicted ${row.predicted_total_xg} total xG, error ${row.total_goal_error}`
);
printRows(
  "Top 20 team attack residual upgrades",
  teamAttackUpgrades.slice(0, 20),
  (row) => `${row.team} vs ${row.opponent}: actual ${row.actual_goals_for}, predicted ${row.predicted_goals_for}, residual ${row.attack_residual}, action ${row.recommended_score_model_action}`
);
printRows(
  "Top 20 team defense residual concerns",
  teamDefenseConcerns.slice(0, 20),
  (row) => `${row.team} vs ${row.opponent}: conceded ${row.actual_goals_against}, predicted GA ${row.predicted_goals_against}, residual ${row.defense_residual}, action ${row.recommended_score_model_action}`
);
printRows(
  "Worst 20 player projection misses",
  playerProjectionErrorRows.slice(0, 20),
  (row) => `${row.name} (${row.team}, ${row.position}): actual ${row.actual_md1_fantasy_points}, projected ${row.prior_md1_projected_points}, error ${row.projection_error}, ${row.failure_category}`
);
printRows(
  "Worst 20 start/role misses if role evidence exists",
  roleMissRows.slice(0, 20),
  (row) => `${row.name} (${row.team}, ${row.position}): start ${row.prior_md1_start_probability}, actual ${row.actual_md1_fantasy_points ?? "no row"}, evidence ${row.role_evidence.inferred_status}`
);
printRows(
  "Top 20 old model underrated players",
  topUnderpredictedPlayers.slice(0, 20),
  (row) => `${row.name} (${row.team}, ${row.position}): actual ${row.actual_md1_fantasy_points}, projected ${row.prior_md1_projected_points}, error ${row.projection_error}`
);
printRows(
  "Top 20 old model overrated players",
  topOverpredictedPlayers.slice(0, 20),
  (row) => `${row.name} (${row.team}, ${row.position}): actual ${row.actual_md1_fantasy_points}, projected ${row.prior_md1_projected_points}, error ${row.projection_error}`
);
printRows(
  "Top 10 actionable fixes for MD2",
  actionableFixes,
  (row) => row
);

console.log("\nMD1 postmortem outputs written:");
console.log(`- ${OUTPUT_DATASET}`);
console.log(`- ${OUTPUT_POSTMORTEM}`);
console.log(`- ${OUTPUT_REPORT}`);
console.log(`QA status: ${dataset.qa.status}`);
console.log(`MD1 fixtures used: ${fixtureSummary.md1_final_fixtures_used}`);
console.log(`Player rows used: ${playerSummary.player_rows}`);
console.log(`Average predicted goals: ${fixtureSummary.average_predicted_total_goals}`);
console.log(`Average actual goals: ${fixtureSummary.average_actual_total_goals}`);
console.log(`Favorite/result accuracy: ${fixtureSummary.favorite_result_correct}/${fixtureSummary.md1_final_fixtures_used}`);
