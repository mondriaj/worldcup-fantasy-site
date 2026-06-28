import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const generatedAt = new Date().toISOString();
const modelVersion = "bracket-pool-strategy-v1";
const sourceKnockoutPath = "data/knockoutScorePredictor_v1.json";
const sourcePathModelPath = "data/r32BracketPathModel_v1.json";
const sourceWorldCupDataPath = "worldCupData.js";

const roundPoints = {
  r32: 1,
  r16: 2,
  qf: 4,
  sf: 8,
  final: 16
};

const roundLabels = {
  r32: "R32",
  r16: "R16",
  qf: "QF",
  sf: "SF",
  final: "Final"
};

const roundReachFields = {
  r32: "reach_r16_probability",
  r16: "reach_qf_probability",
  qf: "reach_sf_probability",
  sf: "reach_final_probability",
  final: "win_tournament_probability"
};

const roundDifficultyWeights = {
  r16: 1.2,
  qf: 1.5,
  sf: 1.9,
  final: 2.4
};

const strategies = [
  {
    strategy_id: "safe",
    label: "Safe",
    description: "Prioritizes expected bracket-pool points and lower bust risk."
  },
  {
    strategy_id: "path_value",
    label: "Path Value",
    description: "Prioritizes teams whose expected points are helped by a softer route."
  },
  {
    strategy_id: "upside",
    label: "Upside",
    description: "Prioritizes deep-run and title equity when the matchup is still plausible."
  },
  {
    strategy_id: "favorite_heavy",
    label: "Favorite Heavy",
    description: "Leans into team-quality favorites and avoids marginal upsets."
  },
  {
    strategy_id: "high_variance",
    label: "High Variance",
    description: "Allows plausible lower-probability advances with useful path value."
  }
];

const namedPathNoteTeams = [
  "argentina",
  "england",
  "colombia",
  "spain",
  "france",
  "germany",
  "portugal"
];

function projectPath(...parts) {
  return path.join(root, ...parts);
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(projectPath(relativePath), "utf8"));
}

async function loadWorldCupData() {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(await readFile(projectPath(sourceWorldCupDataPath), "utf8"), context, { filename: sourceWorldCupDataPath });
  return context.window.WORLD_CUP_DATA;
}

async function writeJson(relativePath, value) {
  await writeFile(projectPath(relativePath), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function writeText(relativePath, value) {
  await writeFile(projectPath(relativePath), `${value.trimEnd()}\n`, "utf8");
}

function round(value, digits = 4) {
  if (!Number.isFinite(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function value(number, fallback = 0) {
  return Number.isFinite(Number(number)) ? Number(number) : fallback;
}

function pct(valueToFormat) {
  return `${round(valueToFormat * 100, 1)}%`;
}

function points(valueToFormat) {
  return `${round(valueToFormat, 2)} pts`;
}

function sortedTop(rows, scoreField, count = 10) {
  return [...rows]
    .sort((a, b) => value(b[scoreField]) - value(a[scoreField]) || a.team.localeCompare(b.team))
    .slice(0, count);
}

function mapToDistributionObject(map) {
  return Object.fromEntries([...map.entries()].map(([teamId, probability]) => [teamId, round(probability)]));
}

function addToMap(map, key, amount) {
  map.set(key, value(map.get(key)) + amount);
}

function mdTable(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((cell) => String(cell ?? "")).join(" | ")} |`)
  ].join("\n");
}

function buildTeamIndex(knockoutData) {
  const teams = new Map();
  knockoutData.teams.forEach((team) => {
    teams.set(team.team_id, {
      team_id: team.team_id,
      team: team.team,
      quality_score: value(team.quality_score)
    });
  });
  return teams;
}

function buildMatchupLookup(knockoutData) {
  const lookup = new Map();
  [...knockoutData.known_r32_predictions, ...knockoutData.arbitrary_matchup_predictions].forEach((row) => {
    lookup.set(`${row.home_team_id}|${row.away_team_id}`, row);
  });
  return lookup;
}

function roundIdForWorldCupRound(roundName, matchPath) {
  const normalized = String(roundName || "").toLowerCase();
  const pathText = String(matchPath || "").toLowerCase();
  if (normalized.includes("round of 32")) return "r32";
  if (normalized.includes("round of 16")) return "r16";
  if (normalized.includes("quarter")) return "qf";
  if (normalized.includes("semi")) return "sf";
  if (normalized.includes("final") && pathText.includes("winner match")) return "final";
  return null;
}

function winnerDependencies(matchPath) {
  return Array.from(String(matchPath || "").matchAll(/Winner Match (\d+)/g)).map((entry) => Number(entry[1]));
}

function orientedPrediction(lookup, teamAId, teamBId) {
  const direct = lookup.get(`${teamAId}|${teamBId}`);
  if (direct) {
    return {
      row: direct,
      teamAAdvanceProbability: value(direct.home_advance_probability),
      teamBAdvanceProbability: value(direct.away_advance_probability),
      teamAExpectedGoals: value(direct.home_expected_goals),
      teamBExpectedGoals: value(direct.away_expected_goals),
      projectedAdvancingTeamId: direct.favorite_team_id || (
        value(direct.home_advance_probability) >= value(direct.away_advance_probability)
          ? direct.home_team_id
          : direct.away_team_id
      )
    };
  }

  const reverse = lookup.get(`${teamBId}|${teamAId}`);
  if (reverse) {
    return {
      row: reverse,
      teamAAdvanceProbability: value(reverse.away_advance_probability),
      teamBAdvanceProbability: value(reverse.home_advance_probability),
      teamAExpectedGoals: value(reverse.away_expected_goals),
      teamBExpectedGoals: value(reverse.home_expected_goals),
      projectedAdvancingTeamId: reverse.favorite_team_id || (
        value(reverse.away_advance_probability) >= value(reverse.home_advance_probability)
          ? reverse.away_team_id
          : reverse.home_team_id
      )
    };
  }

  throw new Error(`Missing knockout matchup prediction for ${teamAId} vs ${teamBId}.`);
}

function emptyTeamMetric(team, pathRow) {
  return {
    team_id: team.team_id,
    team: team.team,
    quality_score: round(team.quality_score, 2),
    r32_match_id: pathRow?.r32_match_id || null,
    r32_opponent: pathRow?.r32_opponent || null,
    reach_r32_probability: 1,
    reach_r16_probability: 0,
    reach_qf_probability: 0,
    reach_sf_probability: 0,
    reach_final_probability: 0,
    win_tournament_probability: 0,
    expected_pool_points: 0,
    path_difficulty_score: 0,
    path_ease_score: 0,
    path_value_score: 0,
    bust_risk_probability: 0,
    probable_opponents_by_round: {},
    likely_toughest_next_opponent: null,
    likely_toughest_round_before_final: null,
    hard_path_note: null,
    easy_path_note: null,
    bracket_pool_value_note: null,
    computed_note_source: "bracket_propagation_v1"
  };
}

function buildTree(knockoutData, worldCupData) {
  const knownByMatch = new Map(
    knockoutData.known_r32_predictions.map((row) => [Number(row.match_number), row])
  );

  const nodes = new Map();
  const bracketRounds = Array.isArray(worldCupData?.bracket?.rounds) ? worldCupData.bracket.rounds : [];
  for (const round of bracketRounds) {
    for (const match of round.matches || []) {
      const matchNumber = Number(match.id);
      const roundId = roundIdForWorldCupRound(round.name, match.path);
      if (!roundId) continue;
      if (roundId === "r32") {
        const fixture = knownByMatch.get(matchNumber);
        if (!fixture) throw new Error(`Missing known R32 fixture for match ${matchNumber}.`);
        nodes.set(matchNumber, {
          match_id: String(matchNumber),
          match_number: matchNumber,
          round_id: roundId,
          round_label: roundLabels[roundId],
          bracket_path: fixture.bracket_path || match.path || "Round of 32",
          left: { type: "team", team_id: fixture.home_team_id },
          right: { type: "team", team_id: fixture.away_team_id },
          source_fixture: fixture
        });
        continue;
      }

      const dependencies = winnerDependencies(match.path);
      if (dependencies.length !== 2) {
        throw new Error(`Bracket match ${match.id} must have exactly two winner dependencies.`);
      }
      nodes.set(matchNumber, {
        match_id: String(matchNumber),
        match_number: matchNumber,
        round_id: roundId,
        round_label: roundLabels[roundId],
        bracket_path: match.path,
        left: { type: "match", match_number: dependencies[0] },
        right: { type: "match", match_number: dependencies[1] }
      });
    }
  }

  if (![...nodes.values()].some((node) => node.round_id === "final")) {
    throw new Error("Official bracket tree did not include a Winner Match final.");
  }

  return nodes;
}

function distributionForSource(nodes, source) {
  if (source.type === "team") return new Map([[source.team_id, 1]]);
  const node = nodes.get(source.match_number);
  if (!node?.winner_distribution_map) {
    throw new Error(`Node ${source.match_number} has no winner distribution yet.`);
  }
  return node.winner_distribution_map;
}

function recordOpponentRound(teamMetrics, teamIndex, teamId, roundId, opponentId, conditionalProbability, encounterProbability) {
  const metric = teamMetrics.get(teamId);
  if (!metric) return;
  if (!metric.probable_opponents_by_round[roundId]) {
    metric.probable_opponents_by_round[roundId] = new Map();
  }

  const opponent = teamIndex.get(opponentId);
  const roundMap = metric.probable_opponents_by_round[roundId];
  const current = roundMap.get(opponentId) || {
    team_id: opponentId,
    team: opponent?.team || opponentId,
    quality_score: round(opponent?.quality_score || 0, 2),
    conditional_probability: 0,
    encounter_probability: 0
  };
  current.conditional_probability += conditionalProbability;
  current.encounter_probability += encounterProbability;
  roundMap.set(opponentId, current);
}

function propagateBracket(nodes, teamMetrics, teamIndex, matchupLookup) {
  for (const [, node] of nodes) {
    const leftDist = distributionForSource(nodes, node.left);
    const rightDist = distributionForSource(nodes, node.right);
    const winnerDist = new Map();

    for (const [leftTeamId, leftProbability] of leftDist) {
      for (const [rightTeamId, rightProbability] of rightDist) {
        const encounterProbability = leftProbability * rightProbability;
        recordOpponentRound(teamMetrics, teamIndex, leftTeamId, node.round_id, rightTeamId, rightProbability, encounterProbability);
        recordOpponentRound(teamMetrics, teamIndex, rightTeamId, node.round_id, leftTeamId, leftProbability, encounterProbability);

        const prediction = orientedPrediction(matchupLookup, leftTeamId, rightTeamId);
        addToMap(winnerDist, leftTeamId, encounterProbability * prediction.teamAAdvanceProbability);
        addToMap(winnerDist, rightTeamId, encounterProbability * prediction.teamBAdvanceProbability);
      }
    }

    node.left_distribution = mapToDistributionObject(leftDist);
    node.right_distribution = mapToDistributionObject(rightDist);
    node.winner_distribution_map = winnerDist;
    node.winner_distribution = mapToDistributionObject(winnerDist);

    const reachField = roundReachFields[node.round_id];
    for (const [teamId, probability] of winnerDist) {
      const metric = teamMetrics.get(teamId);
      if (metric && reachField) {
        metric[reachField] = probability;
      }
    }
  }
}

function summarizeOpponents(teamMetrics, teamIndex) {
  for (const metric of teamMetrics.values()) {
    const summarized = {};
    for (const [roundId, opponentMap] of Object.entries(metric.probable_opponents_by_round)) {
      summarized[roundId] = [...opponentMap.values()]
        .map((opponent) => ({
          ...opponent,
          conditional_probability: round(opponent.conditional_probability),
          encounter_probability: round(opponent.encounter_probability)
        }))
        .sort((a, b) =>
          value(b.conditional_probability) - value(a.conditional_probability) ||
          value(b.quality_score) - value(a.quality_score)
        );
    }
    metric.probable_opponents_by_round = summarized;

    const r16Opponents = summarized.r16 || [];
    const likelyNext = [...r16Opponents]
      .sort((a, b) =>
        value(b.conditional_probability) * value(b.quality_score) -
        value(a.conditional_probability) * value(a.quality_score)
      )[0] || null;
    metric.likely_toughest_next_opponent = likelyNext ? {
      round: "R16",
      team_id: likelyNext.team_id,
      team: likelyNext.team,
      conditional_probability: likelyNext.conditional_probability,
      quality_score: likelyNext.quality_score
    } : null;

    const roundSummaries = ["r16", "qf", "sf", "final"].map((roundId) => {
      const opponents = summarized[roundId] || [];
      const expectedQuality = opponents.reduce((total, opponent) =>
        total + value(opponent.conditional_probability) * value(opponent.quality_score), 0);
      const toughestLikely = [...opponents]
        .sort((a, b) =>
          value(b.conditional_probability) * value(b.quality_score) -
          value(a.conditional_probability) * value(a.quality_score)
        )[0] || null;
      return {
        round_id: roundId,
        round_label: roundLabels[roundId],
        expected_opponent_quality: expectedQuality,
        toughest_likely_opponent: toughestLikely
      };
    });

    const beforeFinal = roundSummaries.filter((summary) => summary.round_id !== "final");
    const toughestBeforeFinal = [...beforeFinal]
      .sort((a, b) => value(b.expected_opponent_quality) - value(a.expected_opponent_quality))[0] || null;
    metric.likely_toughest_round_before_final = toughestBeforeFinal?.toughest_likely_opponent ? {
      round: toughestBeforeFinal.round_label,
      expected_opponent_quality: round(toughestBeforeFinal.expected_opponent_quality, 2),
      team_id: toughestBeforeFinal.toughest_likely_opponent.team_id,
      team: toughestBeforeFinal.toughest_likely_opponent.team,
      conditional_probability: toughestBeforeFinal.toughest_likely_opponent.conditional_probability,
      quality_score: toughestBeforeFinal.toughest_likely_opponent.quality_score
    } : null;

    const weightedDifficulty = roundSummaries.reduce((total, summary) =>
      total + summary.expected_opponent_quality * roundDifficultyWeights[summary.round_id], 0);
    const totalWeight = roundSummaries.reduce((total, summary) => total + roundDifficultyWeights[summary.round_id], 0);
    metric.path_difficulty_score = totalWeight ? weightedDifficulty / totalWeight : 0;
    metric.path_ease_score = clamp((100 - metric.path_difficulty_score) / 100, 0, 1) * 100;
    metric.expected_pool_points =
      value(metric.reach_r16_probability) * roundPoints.r32 +
      value(metric.reach_qf_probability) * roundPoints.r16 +
      value(metric.reach_sf_probability) * roundPoints.qf +
      value(metric.reach_final_probability) * roundPoints.sf +
      value(metric.win_tournament_probability) * roundPoints.final;
    metric.bust_risk_probability = 1 - value(metric.reach_qf_probability);
  }

  const rows = [...teamMetrics.values()];
  const medianDifficulty = [...rows].sort((a, b) => a.path_difficulty_score - b.path_difficulty_score)[Math.floor(rows.length / 2)]?.path_difficulty_score || 0;
  const expectedMedian = [...rows].sort((a, b) => a.expected_pool_points - b.expected_pool_points)[Math.floor(rows.length / 2)]?.expected_pool_points || 0;

  for (const metric of teamMetrics.values()) {
    const difficultyDelta = medianDifficulty - metric.path_difficulty_score;
    metric.path_value_score = metric.expected_pool_points * (1 + clamp(difficultyDelta / 80, -0.35, 0.45));

    const nextOpponent = metric.likely_toughest_next_opponent;
    const toughestRound = metric.likely_toughest_round_before_final;
    if (nextOpponent && value(nextOpponent.quality_score) >= 70 && value(nextOpponent.conditional_probability) >= 0.55) {
      metric.hard_path_note = `Likely R16 path runs through ${nextOpponent.team} (${pct(value(nextOpponent.conditional_probability))} if both sides advance).`;
    } else if (toughestRound && value(toughestRound.expected_opponent_quality) >= 64) {
      metric.hard_path_note = `Toughest pre-final pocket projects as ${toughestRound.round} against ${toughestRound.team}.`;
    }

    if (!metric.hard_path_note && metric.expected_pool_points >= expectedMedian && metric.path_difficulty_score <= medianDifficulty - 8) {
      metric.easy_path_note = `Better-than-field path support for ${points(metric.expected_pool_points)} expected pool value.`;
    }

    metric.bracket_pool_value_note = `${metric.team}: ${points(metric.expected_pool_points)} expected pool value; ${round(metric.path_value_score, 2)} path-value score.`;
    [
      "reach_r16_probability",
      "reach_qf_probability",
      "reach_sf_probability",
      "reach_final_probability",
      "win_tournament_probability",
      "expected_pool_points",
      "path_difficulty_score",
      "path_ease_score",
      "path_value_score",
      "bust_risk_probability"
    ].forEach((field) => {
      metric[field] = round(metric[field]);
    });
  }
}

function strategyScore(strategyId, candidate, opponent, localAdvanceProbability, maxes) {
  const metric = candidate.metric;
  const opponentMetric = opponent.metric;
  const expected = value(metric.expected_pool_points);
  const pathValue = value(metric.path_value_score);
  const champion = value(metric.win_tournament_probability);
  const reachFinal = value(metric.reach_final_probability);
  const quality = value(metric.quality_score);
  const ease = value(metric.path_ease_score);
  const difficulty = value(metric.path_difficulty_score);
  const bustRisk = value(metric.bust_risk_probability);
  const qualityGap = quality - value(opponentMetric.quality_score);
  const underdogBonus = qualityGap < 0 && localAdvanceProbability >= 0.28
    ? Math.max(0, 0.52 - localAdvanceProbability) * 30 + Math.min(10, Math.abs(qualityGap) / 4)
    : 0;
  const viableUpsetBonus = localAdvanceProbability >= 0.36 && pathValue >= value(opponentMetric.path_value_score) * 0.86 ? 6 : 0;

  if (strategyId === "safe") {
    return localAdvanceProbability * 72 + expected * 4 + value(metric.reach_qf_probability) * 24 + (1 - bustRisk) * 14 - difficulty * 0.04;
  }

  if (strategyId === "path_value") {
    return localAdvanceProbability * 58 + pathValue * 7.2 + ease * 0.14 + expected * 1.7 - difficulty * 0.05;
  }

  if (strategyId === "upside") {
    return localAdvanceProbability * 48 + champion * 260 + reachFinal * 82 + expected * 2.4 + quality * 0.22;
  }

  if (strategyId === "favorite_heavy") {
    return localAdvanceProbability * 130 + quality * 1.15 + expected;
  }

  if (strategyId === "high_variance") {
    return localAdvanceProbability * 36 + pathValue * 4.8 + champion * 115 + ease * 0.16 + underdogBonus + viableUpsetBonus;
  }

  return localAdvanceProbability * 100 + expected;
}

function buildStrategyBracket(strategy, nodes, teamMetrics, teamIndex, matchupLookup, maxes) {
  const picks = new Map();
  const matches = [];

  for (const [, sourceNode] of nodes) {
    const leftTeamId = sourceNode.left.type === "team"
      ? sourceNode.left.team_id
      : picks.get(sourceNode.left.match_number);
    const rightTeamId = sourceNode.right.type === "team"
      ? sourceNode.right.team_id
      : picks.get(sourceNode.right.match_number);
    if (!leftTeamId || !rightTeamId) {
      throw new Error(`Strategy ${strategy.strategy_id} missing input for match ${sourceNode.match_number}.`);
    }

    const prediction = orientedPrediction(matchupLookup, leftTeamId, rightTeamId);
    const leftMetric = teamMetrics.get(leftTeamId);
    const rightMetric = teamMetrics.get(rightTeamId);
    const leftCandidate = {
      team_id: leftTeamId,
      team: teamIndex.get(leftTeamId)?.team || leftTeamId,
      metric: leftMetric,
      advance_probability: prediction.teamAAdvanceProbability,
      score: 0
    };
    const rightCandidate = {
      team_id: rightTeamId,
      team: teamIndex.get(rightTeamId)?.team || rightTeamId,
      metric: rightMetric,
      advance_probability: prediction.teamBAdvanceProbability,
      score: 0
    };
    leftCandidate.score = strategyScore(strategy.strategy_id, leftCandidate, rightCandidate, leftCandidate.advance_probability, maxes);
    rightCandidate.score = strategyScore(strategy.strategy_id, rightCandidate, leftCandidate, rightCandidate.advance_probability, maxes);

    let pick = leftCandidate.score >= rightCandidate.score ? leftCandidate : rightCandidate;
    const favorite = leftCandidate.advance_probability >= rightCandidate.advance_probability ? leftCandidate : rightCandidate;
    const underdog = favorite.team_id === leftCandidate.team_id ? rightCandidate : leftCandidate;
    if (
      strategy.strategy_id === "path_value" &&
      underdog.advance_probability >= 0.42 &&
      value(underdog.metric.path_value_score) > value(favorite.metric.path_value_score) * 1.08
    ) {
      pick = underdog;
    }
    if (
      strategy.strategy_id === "high_variance" &&
      favorite.advance_probability <= 0.67 &&
      underdog.advance_probability >= 0.36 &&
      value(underdog.metric.quality_score) >= 55 &&
      value(underdog.metric.expected_pool_points) >= 2
    ) {
      pick = underdog;
    }
    const other = pick.team_id === leftTeamId ? rightCandidate : leftCandidate;
    picks.set(sourceNode.match_number, pick.team_id);

    const pathNote = pick.metric.hard_path_note || pick.metric.easy_path_note ||
      (pick.metric.likely_toughest_round_before_final
        ? `Toughest pre-final round: ${pick.metric.likely_toughest_round_before_final.round} vs ${pick.metric.likely_toughest_round_before_final.team}.`
        : "Path note unavailable.");
    const valueNote = `${pick.team}: ${points(value(pick.metric.expected_pool_points))} expected pool points; ${round(value(pick.metric.path_value_score), 2)} path value.`;

    matches.push({
      match_id: sourceNode.match_id,
      match_number: sourceNode.match_number,
      round_id: sourceNode.round_id,
      round_label: sourceNode.round_label,
      left_team_id: leftTeamId,
      left_team: leftCandidate.team,
      right_team_id: rightTeamId,
      right_team: rightCandidate.team,
      model_pick_team_id: pick.team_id,
      model_pick: pick.team,
      model_pick_advance_probability: round(pick.advance_probability),
      other_team_id: other.team_id,
      other_team: other.team,
      strategy_score: round(pick.score, 3),
      bracket_pool_value_note: valueNote,
      path_note: pathNote,
      xg_note: `${pick.team} ${round(pick.team_id === leftTeamId ? prediction.teamAExpectedGoals : prediction.teamBExpectedGoals, 2)} xG projection in this matchup.`
    });
  }

  const finalMatch = matches.find((match) => match.round_id === "final");
  const semifinalMatches = matches.filter((match) => match.round_id === "sf");
  const finalistIds = finalMatch ? [finalMatch.left_team_id, finalMatch.right_team_id] : [];
  const semifinalistIds = [...new Set(semifinalMatches.flatMap((match) => [match.left_team_id, match.right_team_id]))];
  const championId = finalMatch?.model_pick_team_id || null;

  return {
    strategy_id: strategy.strategy_id,
    label: strategy.label,
    description: strategy.description,
    champion: championId ? {
      team_id: championId,
      team: teamIndex.get(championId)?.team || championId,
      win_tournament_probability: teamMetrics.get(championId)?.win_tournament_probability || null,
      expected_pool_points: teamMetrics.get(championId)?.expected_pool_points || null
    } : null,
    finalists: finalistIds.map((teamId) => ({
      team_id: teamId,
      team: teamIndex.get(teamId)?.team || teamId,
      reach_final_probability: teamMetrics.get(teamId)?.reach_final_probability || null
    })),
    semifinalists: semifinalistIds.map((teamId) => ({
      team_id: teamId,
      team: teamIndex.get(teamId)?.team || teamId,
      reach_sf_probability: teamMetrics.get(teamId)?.reach_sf_probability || null
    })),
    matches
  };
}

function buildSummaries(teamMetrics) {
  const rows = [...teamMetrics.values()];
  const expectedPoolTop10 = sortedTop(rows, "expected_pool_points", 10);
  const pathValueTop10 = sortedTop(rows, "path_value_score", 10);
  const riskyFavorites = rows
    .filter((row) =>
      value(row.reach_r16_probability) >= 0.66 &&
      (value(row.bust_risk_probability) >= 0.42 || row.hard_path_note)
    )
    .sort((a, b) =>
      value(b.bust_risk_probability) - value(a.bust_risk_probability) ||
      value(b.path_difficulty_score) - value(a.path_difficulty_score)
    )
    .slice(0, 10);
  const hardPathWarnings = rows
    .filter((row) => row.hard_path_note)
    .sort((a, b) => value(b.path_difficulty_score) - value(a.path_difficulty_score))
    .slice(0, 12);
  const goodR32BadNextRound = rows
    .filter((row) =>
      value(row.reach_r16_probability) >= 0.72 &&
      value(row.likely_toughest_next_opponent?.quality_score) >= 68
    )
    .sort((a, b) =>
      value(b.likely_toughest_next_opponent?.quality_score) - value(a.likely_toughest_next_opponent?.quality_score)
    )
    .slice(0, 10);
  const averageR32StrongLongPath = rows
    .filter((row) => value(row.reach_r16_probability) >= 0.42 && value(row.reach_r16_probability) <= 0.72)
    .sort((a, b) => value(b.path_value_score) - value(a.path_value_score))
    .slice(0, 10);

  return {
    expected_pool_top_10: expectedPoolTop10,
    path_value_top_10: pathValueTop10,
    risky_favorites: riskyFavorites,
    hard_path_warnings: hardPathWarnings,
    good_r32_bad_next_round: goodR32BadNextRound,
    average_r32_strong_long_path: averageR32StrongLongPath
  };
}

function compactTeamList(rows, fields = ["expected_pool_points", "path_value_score"]) {
  return rows.map((row) => ({
    team_id: row.team_id,
    team: row.team,
    ...Object.fromEntries(fields.map((field) => [field, row[field]])),
    path_note: row.hard_path_note || row.easy_path_note || null
  }));
}

function validateStrategyBracket(strategy, nodes, r32TeamIds) {
  const failures = [];
  const matchByNumber = new Map(strategy.matches.map((match) => [match.match_number, match]));
  const winners = new Map();
  const finalNode = [...nodes.values()].find((node) => node.round_id === "final");

  for (const [, sourceNode] of nodes) {
    const match = matchByNumber.get(sourceNode.match_number);
    if (!match) {
      failures.push(`Strategy ${strategy.strategy_id} missing match ${sourceNode.match_number}.`);
      continue;
    }

    const expectedLeft = sourceNode.left.type === "team"
      ? sourceNode.left.team_id
      : winners.get(sourceNode.left.match_number);
    const expectedRight = sourceNode.right.type === "team"
      ? sourceNode.right.team_id
      : winners.get(sourceNode.right.match_number);

    if (match.left_team_id !== expectedLeft || match.right_team_id !== expectedRight) {
      failures.push(`Strategy ${strategy.strategy_id} impossible inputs in match ${sourceNode.match_number}.`);
    }
    if (![match.left_team_id, match.right_team_id].includes(match.model_pick_team_id)) {
      failures.push(`Strategy ${strategy.strategy_id} pick is not in match ${sourceNode.match_number}.`);
    }
    if (![match.left_team_id, match.right_team_id, match.model_pick_team_id].every((teamId) => r32TeamIds.has(teamId))) {
      failures.push(`Strategy ${strategy.strategy_id} uses non-R32 team in match ${sourceNode.match_number}.`);
    }
    if (value(match.model_pick_advance_probability) < 0 || value(match.model_pick_advance_probability) > 1) {
      failures.push(`Strategy ${strategy.strategy_id} invalid advance probability in match ${sourceNode.match_number}.`);
    }
    winners.set(sourceNode.match_number, match.model_pick_team_id);
  }

  if (!finalNode) {
    failures.push(`Strategy ${strategy.strategy_id} official final node missing.`);
  } else if (strategy.champion?.team_id !== winners.get(finalNode.match_number)) {
    failures.push(`Strategy ${strategy.strategy_id} champion does not match final winner.`);
  }

  return failures;
}

function buildQa(model, nodes, teamMetrics, r32TeamIds) {
  const failures = [];
  const checks = [];
  const rows = [...teamMetrics.values()];
  const probabilityFields = [
    "reach_r32_probability",
    "reach_r16_probability",
    "reach_qf_probability",
    "reach_sf_probability",
    "reach_final_probability",
    "win_tournament_probability",
    "bust_risk_probability"
  ];

  const probabilityOutOfRange = rows.flatMap((row) =>
    probabilityFields
      .filter((field) => value(row[field]) < -0.000001 || value(row[field]) > 1.000001)
      .map((field) => `${row.team}.${field}`)
  );
  const winProbabilitySum = rows.reduce((total, row) => total + value(row.win_tournament_probability), 0);
  const negativeExpectedPoints = rows.filter((row) => value(row.expected_pool_points) < -0.000001).map((row) => row.team);
  const strategyFailures = model.strategies.flatMap((strategy) => validateStrategyBracket(strategy, nodes, r32TeamIds));
  const namedTeamMissingNotes = namedPathNoteTeams.filter((teamId) => {
    const metric = teamMetrics.get(teamId);
    return !metric || !(metric.hard_path_note || metric.easy_path_note || metric.likely_toughest_round_before_final);
  });
  const hardWarningsWithoutSource = rows
    .filter((row) => row.hard_path_note && row.computed_note_source !== "bracket_propagation_v1")
    .map((row) => row.team);

  const checkDefinitions = [
    ["probabilities_within_0_1", probabilityOutOfRange.length === 0, probabilityOutOfRange],
    ["tournament_win_probabilities_sum_to_one", Math.abs(winProbabilitySum - 1) <= 0.01, round(winProbabilitySum, 6)],
    ["expected_points_nonnegative", negativeExpectedPoints.length === 0, negativeExpectedPoints],
    ["each_strategy_valid_bracket", strategyFailures.length === 0, strategyFailures],
    ["no_eliminated_team_or_impossible_matchup", strategyFailures.length === 0, strategyFailures],
    ["path_warnings_computed_not_hardcoded", hardWarningsWithoutSource.length === 0, hardWarningsWithoutSource],
    ["named_team_path_notes_computed", namedTeamMissingNotes.length === 0, namedTeamMissingNotes]
  ];

  checkDefinitions.forEach(([id, passed, detail]) => {
    checks.push({ id, status: passed ? "pass" : "fail", detail });
    if (!passed) failures.push({ id, detail });
  });

  return {
    schema_version: "bracket_pool_strategy_qa_v1",
    generated_at: generatedAt,
    model_version: modelVersion,
    source_files: [sourceKnockoutPath, sourcePathModelPath, sourceWorldCupDataPath],
    status: failures.length ? "fail" : "pass",
    checks,
    failures,
    probability_summary: {
      tournament_win_probability_sum: round(winProbabilitySum, 6),
      team_count: rows.length,
      strategy_count: model.strategies.length
    }
  };
}

function markdownModelReport(model, summaries) {
  const strategyRows = model.strategies.map((strategy) => [
    strategy.label,
    strategy.champion?.team || "n/a",
    strategy.finalists.map((team) => team.team).join(" v "),
    strategy.semifinalists.map((team) => team.team).join(", ")
  ]);

  return `# Bracket Pool Strategy Model v1

Generated: ${generatedAt}

## Purpose

This model adds bracket-pool strategy context on top of the final Round of 32 knockout predictor. Bracket pools reward surviving rounds. A team with a slightly easier path can be a better pool pick than a slightly stronger team with a very hard path.

## Default Scoring

${mdTable(["Round pick", "Points"], [
  ["R32 winner reaches R16", roundPoints.r32],
  ["R16 winner reaches QF", roundPoints.r16],
  ["QF winner reaches SF", roundPoints.qf],
  ["SF winner reaches Final", roundPoints.sf],
  ["Final/Champion", roundPoints.final]
])}

Expected pool points are computed as:

\`P(R16)*1 + P(QF)*2 + P(SF)*4 + P(Final)*8 + P(Champion)*16\`.

## Sources

- \`${sourceKnockoutPath}\`
- \`${sourcePathModelPath}\`
- \`${sourceWorldCupDataPath}\`

The model uses bracket propagation through the official final R32 tree in \`${sourceWorldCupDataPath}\` and matchup advancement probabilities from the knockout score predictor. No betting odds, ownership, invented lineups, or final-squad assumptions are used.

## Strategy Winners

${mdTable(["Strategy", "Champion", "Finalists", "Semifinalists"], strategyRows)}

## Top 10 Expected Pool Points

${mdTable(["Team", "Expected pts", "Win title", "Path note"], summaries.expected_pool_top_10.map((row) => [
  row.team,
  row.expected_pool_points,
  pct(value(row.win_tournament_probability)),
  row.hard_path_note || row.easy_path_note || ""
]))}

## Top 10 Path Value

${mdTable(["Team", "Path value", "Expected pts", "Path difficulty"], summaries.path_value_top_10.map((row) => [
  row.team,
  row.path_value_score,
  row.expected_pool_points,
  row.path_difficulty_score
]))}

## Risky Favorites

${mdTable(["Team", "R32 advance", "Bust risk", "Path note"], summaries.risky_favorites.map((row) => [
  row.team,
  pct(value(row.reach_r16_probability)),
  pct(value(row.bust_risk_probability)),
  row.hard_path_note || row.easy_path_note || ""
]))}

## Hard Path Warnings

${mdTable(["Team", "Difficulty", "Warning"], summaries.hard_path_warnings.map((row) => [
  row.team,
  row.path_difficulty_score,
  row.hard_path_note || ""
]))}
`;
}

function markdownQaReport(qa) {
  return `# Bracket Pool Strategy QA v1

Generated: ${qa.generated_at}

Status: **${qa.status.toUpperCase()}**

## Probability Summary

- Team count: ${qa.probability_summary.team_count}
- Strategy count: ${qa.probability_summary.strategy_count}
- Tournament-win probability sum: ${qa.probability_summary.tournament_win_probability_sum}

## Checks

${mdTable(["Check", "Status", "Detail"], qa.checks.map((check) => [
  check.id,
  check.status,
  Array.isArray(check.detail) ? check.detail.join("; ") : JSON.stringify(check.detail)
]))}
`;
}

async function main() {
  const knockoutData = await readJson(sourceKnockoutPath);
  const pathModel = await readJson(sourcePathModelPath);
  const worldCupData = await loadWorldCupData();
  const teamIndex = buildTeamIndex(knockoutData);
  const matchupLookup = buildMatchupLookup(knockoutData);
  const pathRowsByTeamId = new Map((pathModel.team_paths || []).map((row) => [row.team_id, row]));
  const nodes = buildTree(knockoutData, worldCupData);

  const r32TeamIds = new Set(
    knockoutData.known_r32_predictions.flatMap((row) => [row.home_team_id, row.away_team_id])
  );
  const teamMetrics = new Map(
    [...r32TeamIds].map((teamId) => [teamId, emptyTeamMetric(teamIndex.get(teamId), pathRowsByTeamId.get(teamId))])
  );

  propagateBracket(nodes, teamMetrics, teamIndex, matchupLookup);
  summarizeOpponents(teamMetrics, teamIndex);

  const teamRows = [...teamMetrics.values()].sort((a, b) =>
    value(b.expected_pool_points) - value(a.expected_pool_points) ||
    a.team.localeCompare(b.team)
  );
  const maxes = {
    expected_pool_points: Math.max(...teamRows.map((row) => value(row.expected_pool_points))),
    path_value_score: Math.max(...teamRows.map((row) => value(row.path_value_score)))
  };
  const strategyResults = strategies.map((strategy) =>
    buildStrategyBracket(strategy, nodes, teamMetrics, teamIndex, matchupLookup, maxes)
  );
  const summaries = buildSummaries(teamMetrics);

  const model = {
    schema_version: "bracket_pool_strategy_model_v1",
    generated_at: generatedAt,
    model_version: modelVersion,
    release_status: "final_r32_strategy_overlay",
    source_files: [sourceKnockoutPath, sourcePathModelPath, sourceWorldCupDataPath],
    scoring: {
      default_round_points: roundPoints,
      expected_points_formula: "P(R16)*1 + P(QF)*2 + P(SF)*4 + P(Final)*8 + P(Champion)*16"
    },
    explanation: "Bracket pools reward surviving rounds. A team with a slightly easier path can be a better pool pick than a slightly stronger team with a very hard path.",
    assumptions: [
      "The final official Round of 32 tree is fixed before propagation.",
      "Each strategy advances winners through the bracket tree, so every later match is reachable from prior picks.",
      "Matchup advance probabilities come from the existing knockout score predictor model.",
      "No betting odds, ownership, invented lineups, or final-squad assumptions are used."
    ],
    ownership_used_as_signal: false,
    final_squads_source_backed: false,
    bracket_tree: [...nodes.values()].map((node) => ({
      match_id: node.match_id,
      match_number: node.match_number,
      round_id: node.round_id,
      round_label: node.round_label,
      bracket_path: node.bracket_path,
      left: node.left,
      right: node.right,
      winner_distribution: node.winner_distribution
    })),
    team_metrics: teamRows,
    strategy_summaries: {
      expected_pool_top_10: compactTeamList(summaries.expected_pool_top_10, ["expected_pool_points", "win_tournament_probability", "path_difficulty_score"]),
      path_value_top_10: compactTeamList(summaries.path_value_top_10, ["path_value_score", "expected_pool_points", "path_difficulty_score"]),
      risky_favorites: compactTeamList(summaries.risky_favorites, ["reach_r16_probability", "bust_risk_probability", "path_difficulty_score"]),
      hard_path_warnings: compactTeamList(summaries.hard_path_warnings, ["path_difficulty_score", "expected_pool_points"]),
      good_r32_bad_next_round: compactTeamList(summaries.good_r32_bad_next_round, ["reach_r16_probability", "path_difficulty_score"]),
      average_r32_strong_long_path: compactTeamList(summaries.average_r32_strong_long_path, ["reach_r16_probability", "path_value_score", "expected_pool_points"])
    },
    strategies: strategyResults
  };

  const qa = buildQa(model, nodes, teamMetrics, r32TeamIds);
  if (qa.status !== "pass") {
    console.error(JSON.stringify(qa.failures, null, 2));
    throw new Error("Bracket pool strategy QA failed.");
  }

  await writeJson("data/bracketPoolStrategyModel_v1.json", model);
  await writeText("data/bracketPoolStrategyModel_v1.md", markdownModelReport(model, summaries));
  await writeJson("data/bracketPoolStrategyQa_v1.json", qa);
  await writeText("data/bracketPoolStrategyQaReport_v1.md", markdownQaReport(qa));
  await writeText("bracketPoolStrategyData.js", `// Generated by scripts/buildBracketPoolStrategyModelV1.mjs.\nwindow.BRACKET_POOL_STRATEGY_DATA = ${JSON.stringify(model)};`);

  console.log(`data/bracketPoolStrategyModel_v1.json: ${model.team_metrics.length} teams, ${model.strategies.length} strategies`);
  console.log(`data/bracketPoolStrategyQa_v1.json: ${qa.status}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
