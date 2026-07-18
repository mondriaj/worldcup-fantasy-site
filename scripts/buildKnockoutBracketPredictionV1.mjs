import fs from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const generatedAt = new Date().toISOString();

const files = {
  worldCupData: "worldCupData.js",
  fixtureAuthority: "data/r32FixtureAuthority_v1.json",
  r16FixtureAuthority: "data/r16FixtureAuthority_v1.json",
  qfFixtureAuthority: "data/qfFixtureAuthority_v1.json",
  sfFixtureAuthority: "data/sfFixtureAuthority_v1.json",
  finalRoundFixtureAuthority: "data/finalRoundFixtureAuthority_v1.json",
  liveMatchday: "data/liveMatchdayStatus_v1.json",
  knockoutScorePredictor: "data/knockoutScorePredictor_v1.json",
  bracketPoolStrategy: "data/bracketPoolStrategyModel_v1.json",
  outputJson: "data/knockoutBracketPrediction_v1.json",
  outputDataJs: "knockoutBracketPredictionData.js",
  outputModel: "data/knockoutBracketPredictionModel_v1.md"
};

const roundLabels = {
  r32: "Round of 32",
  r16: "Round of 16",
  qf: "Quarterfinals",
  sf: "Semifinals",
  final: "Final",
  third_place: "Third Place"
};

const roundOrder = ["r32", "r16", "qf", "sf", "final", "third_place"];

function projectPath(...parts) {
  return path.join(root, ...parts);
}

function readText(relativePath) {
  return fs.readFileSync(projectPath(relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

async function writeJson(relativePath, value) {
  await writeFile(projectPath(relativePath), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function writeText(relativePath, value) {
  await writeFile(projectPath(relativePath), `${value.trimEnd()}\n`, "utf8");
}

function loadWorldCupData() {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(readText(files.worldCupData), context, { filename: files.worldCupData });
  return context.window.WORLD_CUP_DATA;
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function slug(value) {
  return normalizeText(value).replace(/\s+/g, "-");
}

function compactPercent(value) {
  const number = Number(value);
  return Number.isFinite(number) ? `${Math.round(number * 100)}%` : "n/a";
}

function roundIdForWorldCupRound(roundName, matchPath) {
  const normalized = String(roundName || "").toLowerCase();
  const pathText = String(matchPath || "").toLowerCase();
  if (normalized.includes("round of 32")) return "r32";
  if (normalized.includes("round of 16")) return "r16";
  if (normalized.includes("quarter")) return "qf";
  if (normalized.includes("semi")) return "sf";
  if (normalized.includes("final") && pathText.includes("winner match")) return "final";
  if (normalized.includes("final") && pathText.includes("loser match")) return "third_place";
  return null;
}

function sourceNumbers(matchPath, type = "Winner") {
  return Array.from(String(matchPath || "").matchAll(new RegExp(`${type} Match (\\d+)`, "g")))
    .map((entry) => Number(entry[1]));
}

function localFixtureIdFromMatchNumber(matchNumber) {
  const number = Number(matchNumber);
  return Number.isFinite(number) && number > 0 ? `fwc2026-m${String(number).padStart(3, "0")}` : "";
}

function validLocalFixtureKey(value) {
  const key = String(value || "").trim();
  return /^fwc2026-m\d{3}$/i.test(key) ? key.toLowerCase() : "";
}

function buildBracketNodes(worldCupData) {
  const nodes = new Map();
  for (const round of worldCupData.bracket?.rounds || []) {
    for (const match of round.matches || []) {
      const matchNumber = Number(match.id);
      const roundId = roundIdForWorldCupRound(round.name, match.path);
      if (!roundId) continue;
      nodes.set(matchNumber, {
        matchId: String(matchNumber),
        matchNumber,
        bracketSlotId: `M${matchNumber}`,
        round: roundId,
        roundLabel: roundLabels[roundId] || round.name,
        bracketPath: match.path,
        winnerSources: sourceNumbers(match.path, "Winner"),
        loserSources: sourceNumbers(match.path, "Loser")
      });
    }
  }
  return nodes;
}

function buildParentIndex(nodes) {
  const parentByChild = new Map();
  for (const node of nodes.values()) {
    for (const source of node.winnerSources || []) parentByChild.set(source, node);
  }
  return parentByChild;
}

function teamFromParts({ teamId, name, code, flag, sourceConfidence = "predicted" }) {
  if (!teamId && !name) {
    return {
      code: "TBD",
      name: "Pending",
      flag: null,
      sourceConfidence: "pending"
    };
  }

  return {
    code: code || String(teamId || name || "TBD").slice(0, 3).toUpperCase(),
    name: name || teamId,
    flag: flag || null,
    sourceConfidence,
    teamId: teamId || slug(name)
  };
}

function pendingTeam(label = "Pending") {
  return teamFromParts({ name: label, code: "TBD", sourceConfidence: "pending" });
}

function teamKey(team) {
  return team?.teamId || team?.team_id || slug(team?.name || team?.team || "");
}

function sameTeam(a, b) {
  return Boolean(teamKey(a) && teamKey(a) === teamKey(b));
}

function asPredictedTeam(team) {
  if (!team) return null;
  return {
    ...team,
    sourceConfidence: team.sourceConfidence === "pending" ? "pending" : "predicted"
  };
}

function winnerLoserFromPick(teamA, teamB, pickId, pickName) {
  const pickKey = pickId || slug(pickName);
  if (pickKey && pickKey === teamKey(teamA)) return { winner: teamA, loser: teamB };
  if (pickKey && pickKey === teamKey(teamB)) return { winner: teamB, loser: teamA };
  return { winner: null, loser: null };
}

function liveFixtureForAuthority(fixture, liveIndexes) {
  const localKey = validLocalFixtureKey(fixture?.fixture_id || localFixtureIdFromMatchNumber(fixture?.bracket_match_number));
  return (localKey ? liveIndexes.byLocal.get(localKey) : null) ||
    (fixture?.source_fixture_id ? liveIndexes.bySource.get(String(fixture.source_fixture_id)) : null) ||
    liveIndexes.byMatch.get(Number(fixture?.bracket_match_number)) ||
    null;
}

function actualResultForFixture(fixture, liveIndexes) {
  const live = liveFixtureForAuthority(fixture, liveIndexes);

  if (!live) return null;
  const status = String(live.fixture_status || live.status || "").toLowerCase();
  const scoreStatus = String(live.score_status || "").toLowerCase();
  const final = ["complete", "completed", "played", "full_time"].includes(status) || scoreStatus === "final";
  const homeScore = live.home_score;
  const awayScore = live.away_score;
  const safeScore = live.safe_to_display_score === true || fixture.round !== "R32";

  if (!final || !safeScore || homeScore === null || homeScore === undefined || awayScore === null || awayScore === undefined) {
    return null;
  }

  const teamA = fixture.team_a;
  const teamB = fixture.team_b;
  const homeWins = Number(homeScore) > Number(awayScore);
  const awayWins = Number(awayScore) > Number(homeScore);
  const homePenalty = Number(live.home_penalty_score || 0);
  const awayPenalty = Number(live.away_penalty_score || 0);
  const penaltiesDecide = !homeWins && !awayWins && (homePenalty || awayPenalty);
  const winner = homeWins || (penaltiesDecide && homePenalty > awayPenalty) ? teamA : teamB;
  const loser = sameTeam(winner, teamA) ? teamB : teamA;
  const penaltyLabel = penaltiesDecide ? `, ${homePenalty}-${awayPenalty} pens` : "";

  return {
    status: "final",
    winner,
    loser,
    score: `${teamA.code || teamA.name} ${homeScore}-${awayScore} ${teamB.code || teamB.name}${penaltyLabel}`,
    note: "Actual result from safe live-status final score."
  };
}

function buildLiveIndexes(liveMatchday) {
  const byLocal = new Map();
  const bySource = new Map();
  const byMatch = new Map();
  for (const fixture of liveMatchday.fixtures || []) {
    const localKey = validLocalFixtureKey(
      fixture.resolved_local_fixture_key ||
      fixture.local_fixture_id ||
      fixture.match_id ||
      localFixtureIdFromMatchNumber(fixture.match_number)
    );
    if (localKey) byLocal.set(localKey, fixture);
    if (fixture.source_fixture_id) bySource.set(String(fixture.source_fixture_id), fixture);
    if (fixture.match_number) byMatch.set(Number(fixture.match_number), fixture);
    if (fixture.local_match_number) byMatch.set(Number(fixture.local_match_number), fixture);
  }
  return { byLocal, bySource, byMatch };
}

function predictionLookup(knockout) {
  const byKnownMatch = new Map();
  const byTeams = new Map();
  for (const row of knockout.known_r32_predictions || []) {
    byKnownMatch.set(Number(row.match_number), row);
    byTeams.set(`${row.home_team_id}|${row.away_team_id}`, row);
  }
  for (const row of knockout.arbitrary_matchup_predictions || []) {
    byTeams.set(`${row.home_team_id}|${row.away_team_id}`, row);
  }
  return { byKnownMatch, byTeams };
}

function predictionForTeams(lookup, teamA, teamB) {
  const direct = lookup.byTeams.get(`${teamKey(teamA)}|${teamKey(teamB)}`);
  if (direct) return { row: direct, reversed: false };
  const reverse = lookup.byTeams.get(`${teamKey(teamB)}|${teamKey(teamA)}`);
  if (reverse) return { row: reverse, reversed: true };
  return { row: null, reversed: false };
}

function scorelineForPrediction(predictionInfo) {
  const row = predictionInfo?.row;
  const topScoreline = Array.isArray(row?.top_scorelines) ? row.top_scorelines[0] : null;
  if (!topScoreline?.scoreline) return null;
  if (!predictionInfo.reversed) return topScoreline.scoreline;
  const parts = String(topScoreline.scoreline).split("-");
  return parts.length === 2 ? `${parts[1]}-${parts[0]}` : topScoreline.scoreline;
}

function probabilityForTeam(predictionInfo, team) {
  const row = predictionInfo?.row;
  if (!row || !teamKey(team)) return null;
  if (!predictionInfo.reversed) {
    if (teamKey(team) === row.home_team_id) return row.home_advance_probability;
    if (teamKey(team) === row.away_team_id) return row.away_advance_probability;
  } else {
    if (teamKey(team) === row.away_team_id) return row.away_advance_probability;
    if (teamKey(team) === row.home_team_id) return row.home_advance_probability;
  }
  return null;
}

function predictedWinnerFromPrediction(predictionInfo, teamA, teamB) {
  const row = predictionInfo?.row;
  if (!row) return { winner: null, loser: null };
  return winnerLoserFromPick(teamA, teamB, row.projected_final_advancing_team_id || row.favorite_team_id, row.projected_final_advancing_team || row.favorite_team);
}

function strategyMatchFor(strategy, matchNumber) {
  return (strategy.matches || []).find((row) => Number(row.match_number) === Number(matchNumber)) || null;
}

function statusFromLiveFixture(fixture, liveIndexes) {
  const live = liveFixtureForAuthority(fixture, liveIndexes);
  const status = String(live?.fixture_status || fixture?.status || "").toLowerCase();
  if (["complete", "completed", "played", "full_time"].includes(status) || live?.score_status === "final") return "final";
  if (["playing", "in_progress", "live"].includes(status)) return "playing";
  if (["scheduled", "pending"].includes(status)) return status;
  return fixture?.status || "scheduled";
}

function matchStatusFromActual(actualResult, round, sourceStatus = null) {
  if (actualResult) return "final";
  if (sourceStatus === "playing") return "playing";
  if (sourceStatus) return sourceStatus;
  if (round === "r32") return sourceStatus || "scheduled";
  return "pending";
}

function buildMatchRow({ node, teamA, teamB, actualTeamA, actualTeamB, predictionInfo, strategyMatch, actualResult, sourceFixtureId, sourceFixtureOrder, bracketQuarter, bracketHalf, sourceStatus, sourceConfidence }) {
  const predicted = predictedWinnerFromPrediction(predictionInfo, teamA, teamB);
  if (!predicted.winner && strategyMatch) {
    Object.assign(predicted, winnerLoserFromPick(teamA, teamB, strategyMatch.model_pick_team_id, strategyMatch.model_pick));
  }
  const predictedScore90 = scorelineForPrediction(predictionInfo);
  const teamAAdvanceProb = probabilityForTeam(predictionInfo, teamA);
  const teamBAdvanceProb = probabilityForTeam(predictionInfo, teamB);
  const status = matchStatusFromActual(actualResult, node.round, sourceStatus);
  let predictionResult = "pending";

  if (status === "final" && actualResult?.winner) {
    predictionResult = predicted.winner
      ? sameTeam(predicted.winner, actualResult.winner) ? "correct" : "wrong"
      : "not_available";
  }

  return {
    matchId: node.matchId,
    bracketSlotId: node.bracketSlotId,
    sourceFixtureId: sourceFixtureId || null,
    sourceFixtureIdRole: sourceFixtureId ? "source fixture id, not bracket slot" : null,
    round: node.round,
    roundLabel: node.roundLabel,
    bracketSide: bracketHalf || null,
    bracketQuarter: bracketQuarter || null,
    bracketPath: node.bracketPath,
    feedsFrom: node.winnerSources?.length ? node.winnerSources.map((matchNumber) => `M${matchNumber}`) : node.loserSources.map((matchNumber) => `L${matchNumber}`),
    teamA,
    teamB,
    actualTeamA: actualTeamA || null,
    actualTeamB: actualTeamB || null,
    status,
    predictedWinner: predicted.winner,
    predictedLoser: predicted.loser,
    predictedScore90,
    predictedScoreLabel: predictedScore90 ? `${teamA.code || teamA.name} ${predictedScore90} ${teamB.code || teamB.name}` : "Projected score unavailable",
    teamAAdvanceProb,
    teamBAdvanceProb,
    actualWinner: actualResult?.winner || null,
    actualLoser: actualResult?.loser || null,
    actualScore: actualResult?.score || null,
    predictionResult,
    modelNote: predictionInfo?.row?.explanation || strategyMatch?.xg_note || "Model note unavailable.",
    actualNote: actualResult?.note || "Actual result pending.",
    pathNote: strategyMatch?.path_note || `Official path: ${node.bracketPath}`,
    sourceConfidence: sourceConfidence || (node.round === "r32" ? "source-backed" : "predicted"),
    sourceFixtureOrder: sourceFixtureOrder ?? null
  };
}

function buildKnockoutBracketPrediction() {
  const worldCupData = loadWorldCupData();
  const fixtureAuthority = readJson(files.fixtureAuthority);
  const r16FixtureAuthority = readJson(files.r16FixtureAuthority);
  const qfFixtureAuthority = readJson(files.qfFixtureAuthority);
  const sfFixtureAuthority = readJson(files.sfFixtureAuthority);
  const finalRoundFixtureAuthority = readJson(files.finalRoundFixtureAuthority);
  const liveMatchday = readJson(files.liveMatchday);
  const knockout = readJson(files.knockoutScorePredictor);
  const bracketPool = readJson(files.bracketPoolStrategy);
  const defaultStrategy = bracketPool.strategies?.find((strategy) => strategy.strategy_id === "safe") || bracketPool.strategies?.[0] || null;
  const nodes = buildBracketNodes(worldCupData);
  const parentByChild = buildParentIndex(nodes);
  const liveIndexes = buildLiveIndexes(liveMatchday);
  const predictions = predictionLookup(knockout);
  const authorityByMatch = new Map((fixtureAuthority.fixtures || []).map((fixture) => [Number(fixture.bracket_match_number), fixture]));
  const r16AuthorityByMatch = new Map((r16FixtureAuthority.fixtures || []).map((fixture) => [Number(fixture.bracket_match_number), fixture]));
  const qfAuthorityByMatch = new Map((qfFixtureAuthority.fixtures || []).map((fixture) => [Number(fixture.bracket_match_number), fixture]));
  const sfAuthorityByMatch = new Map((sfFixtureAuthority.fixtures || []).map((fixture) => [Number(fixture.bracket_match_number), fixture]));
  const finalRoundAuthorityByMatch = new Map((finalRoundFixtureAuthority.fixtures || []).map((fixture) => [Number(fixture.bracket_match_number), fixture]));
  const rowsByMatch = new Map();
  const actualWinnersByMatch = new Map();
  const actualLosersByMatch = new Map();
  const predictedWinnersByMatch = new Map();
  const predictedLosersByMatch = new Map();
  const roundMatches = [];

  for (const roundId of roundOrder) {
    const roundNodes = [...nodes.values()]
      .filter((node) => node.round === roundId)
      .sort((a, b) => a.matchNumber - b.matchNumber);

    for (const node of roundNodes) {
      let teamA = pendingTeam("Pending A");
      let teamB = pendingTeam("Pending B");
      let actualTeamA = null;
      let actualTeamB = null;
      let sourceFixtureId = null;
      let sourceFixtureOrder = null;
      let bracketQuarter = null;
      let bracketHalf = null;
      let actualResult = null;
      let sourceStatus = null;

      if (node.round === "r32") {
        const authority = authorityByMatch.get(node.matchNumber);
        teamA = teamFromParts({
          teamId: authority?.team_a?.team_id,
          name: authority?.team_a?.team,
          code: authority?.team_a?.code,
          flag: authority?.team_a?.flag,
          sourceConfidence: "source-backed"
        });
        teamB = teamFromParts({
          teamId: authority?.team_b?.team_id,
          name: authority?.team_b?.team,
          code: authority?.team_b?.code,
          flag: authority?.team_b?.flag,
          sourceConfidence: "source-backed"
        });
        actualTeamA = teamA;
        actualTeamB = teamB;
        sourceFixtureId = authority?.source_fixture_id || null;
        sourceFixtureOrder = authority?.source_fixture_order ?? null;
        bracketQuarter = authority?.bracket_quarter || null;
        bracketHalf = authority?.bracket_half || null;
        actualResult = actualResultForFixture(authority, liveIndexes);
        sourceStatus = statusFromLiveFixture(authority, liveIndexes);
      } else if (node.round === "r16" || node.round === "qf" || node.round === "sf") {
        const authority = node.round === "r16"
          ? r16AuthorityByMatch.get(node.matchNumber)
          : node.round === "qf"
            ? qfAuthorityByMatch.get(node.matchNumber)
            : sfAuthorityByMatch.get(node.matchNumber);
        if (authority?.team_a && authority?.team_b) {
          teamA = teamFromParts({
            teamId: authority.team_a.team_id,
            name: authority.team_a.team,
            code: authority.team_a.code,
            flag: authority.team_a.flag,
            sourceConfidence: "source-backed"
          });
          teamB = teamFromParts({
            teamId: authority.team_b.team_id,
            name: authority.team_b.team,
            code: authority.team_b.code,
            flag: authority.team_b.flag,
            sourceConfidence: "source-backed"
          });
          actualTeamA = teamA;
          actualTeamB = teamB;
          sourceFixtureId = authority.source_fixture_id || null;
          sourceFixtureOrder = authority.source_fixture_order ?? null;
          bracketQuarter = authority.bracket_quarter || null;
          bracketHalf = authority.bracket_half || null;
          actualResult = actualResultForFixture(authority, liveIndexes);
          sourceStatus = statusFromLiveFixture(authority, liveIndexes);
        } else {
          const firstSource = rowsByMatch.get(node.winnerSources[0]);
          const secondSource = rowsByMatch.get(node.winnerSources[1]);
          teamA = asPredictedTeam(predictedWinnersByMatch.get(node.winnerSources[0])) || pendingTeam(`Winner M${node.winnerSources[0]}`);
          teamB = asPredictedTeam(predictedWinnersByMatch.get(node.winnerSources[1])) || pendingTeam(`Winner M${node.winnerSources[1]}`);
          actualTeamA = actualWinnersByMatch.get(node.winnerSources[0]) || null;
          actualTeamB = actualWinnersByMatch.get(node.winnerSources[1]) || null;
          bracketQuarter = firstSource?.bracketQuarter || secondSource?.bracketQuarter || null;
          bracketHalf = firstSource?.bracketSide || secondSource?.bracketSide || null;
        }
      } else if (node.round === "third_place") {
        const authority = finalRoundAuthorityByMatch.get(node.matchNumber);
        const firstSource = rowsByMatch.get(node.loserSources[0]);
        const secondSource = rowsByMatch.get(node.loserSources[1]);
        if (authority?.team_a && authority?.team_b) {
          teamA = teamFromParts({
            teamId: authority.team_a.team_id,
            name: authority.team_a.team,
            code: authority.team_a.code,
            flag: authority.team_a.flag,
            sourceConfidence: "source-backed"
          });
          teamB = teamFromParts({
            teamId: authority.team_b.team_id,
            name: authority.team_b.team,
            code: authority.team_b.code,
            flag: authority.team_b.flag,
            sourceConfidence: "source-backed"
          });
          actualTeamA = teamA;
          actualTeamB = teamB;
          sourceFixtureId = authority.source_fixture_id || null;
          sourceFixtureOrder = authority.source_fixture_order ?? null;
          sourceStatus = statusFromLiveFixture(authority, liveIndexes);
        } else {
          teamA = asPredictedTeam(predictedLosersByMatch.get(node.loserSources[0])) || pendingTeam(`Loser M${node.loserSources[0]}`);
          teamB = asPredictedTeam(predictedLosersByMatch.get(node.loserSources[1])) || pendingTeam(`Loser M${node.loserSources[1]}`);
          actualTeamA = actualLosersByMatch.get(node.loserSources[0]) || null;
          actualTeamB = actualLosersByMatch.get(node.loserSources[1]) || null;
        }
        bracketQuarter = null;
        bracketHalf = `${firstSource?.bracketSide || ""}|${secondSource?.bracketSide || ""}`.replace(/^\||\|$/g, "") || null;
      } else {
        const authority = finalRoundAuthorityByMatch.get(node.matchNumber);
        const firstSource = rowsByMatch.get(node.winnerSources[0]);
        const secondSource = rowsByMatch.get(node.winnerSources[1]);
        if (authority?.team_a && authority?.team_b) {
          teamA = teamFromParts({
            teamId: authority.team_a.team_id,
            name: authority.team_a.team,
            code: authority.team_a.code,
            flag: authority.team_a.flag,
            sourceConfidence: "source-backed"
          });
          teamB = teamFromParts({
            teamId: authority.team_b.team_id,
            name: authority.team_b.team,
            code: authority.team_b.code,
            flag: authority.team_b.flag,
            sourceConfidence: "source-backed"
          });
          actualTeamA = teamA;
          actualTeamB = teamB;
          sourceFixtureId = authority.source_fixture_id || null;
          sourceFixtureOrder = authority.source_fixture_order ?? null;
          sourceStatus = statusFromLiveFixture(authority, liveIndexes);
        } else {
          teamA = asPredictedTeam(predictedWinnersByMatch.get(node.winnerSources[0])) || pendingTeam(`Winner M${node.winnerSources[0]}`);
          teamB = asPredictedTeam(predictedWinnersByMatch.get(node.winnerSources[1])) || pendingTeam(`Winner M${node.winnerSources[1]}`);
          actualTeamA = actualWinnersByMatch.get(node.winnerSources[0]) || null;
          actualTeamB = actualWinnersByMatch.get(node.winnerSources[1]) || null;
        }
        bracketQuarter = firstSource?.bracketQuarter || secondSource?.bracketQuarter || null;
        bracketHalf = firstSource?.bracketSide || secondSource?.bracketSide || null;
      }

      const predictionInfo = node.round === "r32" && predictions.byKnownMatch.has(node.matchNumber)
        ? { row: predictions.byKnownMatch.get(node.matchNumber), reversed: false }
        : predictionForTeams(predictions, teamA, teamB);
      const strategyMatch = strategyMatchFor(defaultStrategy, node.matchNumber);
      const row = buildMatchRow({
        node,
        teamA,
        teamB,
        actualTeamA,
        actualTeamB,
        predictionInfo,
        strategyMatch,
        actualResult,
        sourceFixtureId,
        sourceFixtureOrder,
        bracketQuarter,
        bracketHalf,
        sourceStatus,
        sourceConfidence: node.round === "r16" || node.round === "qf" || node.round === "sf" ? "source-backed" : null
      });

      rowsByMatch.set(node.matchNumber, row);
      if (row.predictedWinner) predictedWinnersByMatch.set(node.matchNumber, row.predictedWinner);
      if (row.predictedLoser) predictedLosersByMatch.set(node.matchNumber, row.predictedLoser);
      if (row.actualWinner) actualWinnersByMatch.set(node.matchNumber, row.actualWinner);
      if (row.actualLoser) actualLosersByMatch.set(node.matchNumber, row.actualLoser);
      roundMatches.push(row);
    }
  }

  const matches = roundMatches.filter((row) => row.round !== "third_place" || row.predictedWinner);
  const decidedMatches = matches.filter((row) => row.status === "final" && row.actualWinner);
  const correctWinnerPredictions = decidedMatches.filter((row) => row.predictionResult === "correct").length;
  const wrongWinnerPredictions = decidedMatches.filter((row) => row.predictionResult === "wrong").length;
  const finalMatch = rowsByMatch.get(104);
  const semifinalists = [rowsByMatch.get(101), rowsByMatch.get(102)]
    .flatMap((row) => [row?.teamA, row?.teamB])
    .filter(Boolean);

  return {
    schema_version: "knockout_bracket_prediction_v1",
    generatedAt,
    generated_at: generatedAt,
    modelVersion: "knockout-bracket-prediction-v1",
    model_version: "knockout-bracket-prediction-v1",
    bracketSource: {
      r32FixtureAuthority: files.fixtureAuthority,
      r16FixtureAuthority: files.r16FixtureAuthority,
      qfFixtureAuthority: files.qfFixtureAuthority,
      sfFixtureAuthority: files.sfFixtureAuthority,
      finalRoundFixtureAuthority: files.finalRoundFixtureAuthority,
      officialBracket: files.worldCupData,
      modelPicks: files.bracketPoolStrategy,
      scorePredictions: files.knockoutScorePredictor,
      actualResults: files.liveMatchday
    },
    fixtureAuthorityVersion: fixtureAuthority.schema_version,
    defaultStrategy: defaultStrategy ? {
      strategyId: defaultStrategy.strategy_id,
      label: defaultStrategy.label,
      description: defaultStrategy.description
    } : null,
    predictionStatus: fixtureAuthority.status === "pass" && String(bracketPool.release_status || "").startsWith("final_") ? "final" : "provisional",
    ownershipUsedAsSignal: false,
    finalSquadsSourceBacked: false,
    rounds: roundOrder
      .map((roundId) => {
        const roundRows = matches.filter((row) => row.round === roundId);
        return roundRows.length ? {
          round: roundId,
          label: roundLabels[roundId],
          matchIds: roundRows.map((row) => row.matchId)
        } : null;
      })
      .filter(Boolean),
    summary: {
      predictedChampion: finalMatch?.predictedWinner || null,
      predictedFinalists: [finalMatch?.teamA, finalMatch?.teamB].filter(Boolean),
      predictedSemifinalists: semifinalists,
      decidedKnockoutMatches: decidedMatches.length,
      correctWinnerPredictions,
      wrongWinnerPredictions,
      pendingPredictions: matches.length - decidedMatches.length,
      accuracyPct: decidedMatches.length ? Number(((correctWinnerPredictions / decidedMatches.length) * 100).toFixed(1)) : null,
      flagsMissingFallbackCount: matches
        .flatMap((row) => [row.teamA, row.teamB, row.actualTeamA, row.actualTeamB].filter(Boolean))
        .filter((team) => team.sourceConfidence !== "pending" && !team.flag && !team.code).length
    },
    matches
  };
}

function mdTable(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((value) => String(value ?? "")).join(" | ")} |`)
  ].join("\n");
}

function buildModelReport(data) {
  const counts = data.rounds.map((round) => [
    round.label,
    round.matchIds.length
  ]);
  return `# Knockout Bracket Prediction Model v1

Generated: ${data.generatedAt}

Status: **${data.predictionStatus.toUpperCase()}**

## Sources

- R32 fixtures: \`${data.bracketSource.r32FixtureAuthority}\`
- R16 fixtures: \`${data.bracketSource.r16FixtureAuthority}\`
- QF fixtures: \`${data.bracketSource.qfFixtureAuthority}\`
- SF fixtures: \`${data.bracketSource.sfFixtureAuthority}\`
- Final Round fixtures: \`${data.bracketSource.finalRoundFixtureAuthority}\`
- Bracket tree: \`${data.bracketSource.officialBracket}\`
- Model picks: \`${data.bracketSource.modelPicks}\`
- Predicted scores: \`${data.bracketSource.scorePredictions}\`
- Actual results: \`${data.bracketSource.actualResults}\`

## Default Strategy

${data.defaultStrategy?.label || "Unavailable"}: ${data.defaultStrategy?.description || "No strategy description available."}

No ownership signal is used. Final squads are not source-backed.

## Summary

| Metric | Value |
| --- | --- |
| Predicted champion | ${data.summary.predictedChampion?.name || "Pending"} |
| Predicted finalists | ${data.summary.predictedFinalists.map((team) => team.name).join(", ")} |
| Predicted semifinalists | ${data.summary.predictedSemifinalists.map((team) => team.name).join(", ")} |
| Decided knockout matches | ${data.summary.decidedKnockoutMatches} |
| Correct predictions | ${data.summary.correctWinnerPredictions} |
| Wrong predictions | ${data.summary.wrongWinnerPredictions} |
| Pending predictions | ${data.summary.pendingPredictions} |
| Accuracy | ${data.summary.accuracyPct === null ? "Pending first final result" : `${data.summary.accuracyPct}%`} |
| Flags missing with no code fallback | ${data.summary.flagsMissingFallbackCount} |

## Round Counts

${mdTable(["Round", "Matches"], counts)}
`;
}

async function main() {
  const data = buildKnockoutBracketPrediction();
  await writeJson(files.outputJson, data);
  await writeText(files.outputDataJs, `// Generated by scripts/buildKnockoutBracketPredictionV1.mjs.\nwindow.KNOCKOUT_BRACKET_PREDICTION_DATA = ${JSON.stringify(data)};`);
  await writeText(files.outputModel, buildModelReport(data));
  console.log(`${files.outputJson}: ${data.predictionStatus}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
