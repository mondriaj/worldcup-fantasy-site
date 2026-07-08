import fs from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const generatedAt = new Date().toISOString();

const files = {
  bracketPrediction: "data/knockoutBracketPrediction_v1.json",
  browserData: "knockoutBracketPredictionData.js",
  fixtureAuthority: "data/r32FixtureAuthority_v1.json",
  qfFixtureAuthority: "data/qfFixtureAuthority_v1.json",
  knockoutScorePredictor: "data/knockoutScorePredictor_v1.json",
  bracketPoolStrategy: "data/bracketPoolStrategyModel_v1.json",
  index: "index.html",
  script: "script.js",
  style: "style.css",
  qaJson: "data/knockoutBracketPredictionQa_v1.json",
  qaReport: "data/knockoutBracketPredictionQaReport_v1.md"
};

const expectedCounts = {
  r32: 16,
  r16: 8,
  qf: 4,
  sf: 2,
  final: 1
};

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

function mdTable(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((value) => String(value ?? "")).join(" | ")} |`)
  ].join("\n");
}

function teamId(team) {
  return team?.teamId || team?.team_id || "";
}

function teamLabel(team) {
  return team?.name || team?.team || teamId(team) || "Pending";
}

function sameTeam(a, b) {
  return Boolean(teamId(a) && teamId(a) === teamId(b));
}

function matchBySlot(data, slotId) {
  return (data.matches || []).find((match) => match.bracketSlotId === slotId);
}

function matchHasTeam(match, teamNameOrId) {
  const normalized = String(teamNameOrId || "").toLowerCase();
  return [match?.teamA, match?.teamB, match?.actualTeamA, match?.actualTeamB, match?.predictedWinner, match?.actualWinner]
    .filter(Boolean)
    .some((team) => [teamId(team), teamLabel(team)].map((value) => String(value).toLowerCase()).includes(normalized));
}

function resultCounts(data) {
  return (data.matches || []).reduce((counts, match) => {
    counts[match.predictionResult] = (counts[match.predictionResult] || 0) + 1;
    return counts;
  }, {});
}

function addCheck(checks, failures, id, passed, detail = null) {
  checks.push({ id, status: passed ? "pass" : "fail", detail });
  if (!passed) failures.push({ id, detail });
}

function validateData(data, authority, qfAuthority, knockout, bracketPool, browserDataText, indexText, scriptText, styleText) {
  const checks = [];
  const failures = [];
  const matches = data.matches || [];
  const countsByRound = matches.reduce((counts, match) => {
    counts[match.round] = (counts[match.round] || 0) + 1;
    return counts;
  }, {});
  const nonFinalFranceArgentina = matches.filter((match) =>
    match.round !== "final" &&
    [match.teamA, match.teamB, match.actualTeamA, match.actualTeamB].some((team) => teamId(team) === "france") &&
    [match.teamA, match.teamB, match.actualTeamA, match.actualTeamB].some((team) => teamId(team) === "argentina")
  );
  const r16FranceArgentina = matches.filter((match) =>
    match.round === "r16" &&
    [match.teamA, match.teamB, match.actualTeamA, match.actualTeamB].some((team) => teamId(team) === "france") &&
    [match.teamA, match.teamB, match.actualTeamA, match.actualTeamB].some((team) => teamId(team) === "argentina")
  );
  const predictedWinnerFailures = matches
    .filter((match) => match.predictedWinner && !sameTeam(match.predictedWinner, match.teamA) && !sameTeam(match.predictedWinner, match.teamB))
    .map((match) => `${match.bracketSlotId}: ${teamLabel(match.predictedWinner)} not in ${teamLabel(match.teamA)} / ${teamLabel(match.teamB)}`);
  const actualWinnerFailures = matches
    .filter((match) => match.actualWinner)
    .filter((match) => {
      const actualA = match.actualTeamA || match.teamA;
      const actualB = match.actualTeamB || match.teamB;
      return !sameTeam(match.actualWinner, actualA) && !sameTeam(match.actualWinner, actualB);
    })
    .map((match) => `${match.bracketSlotId}: ${teamLabel(match.actualWinner)} not in actual participants`);
  const nonFinalActualScoreFailures = matches
    .filter((match) => match.status !== "final" && match.actualScore)
    .map((match) => `${match.bracketSlotId}: ${match.actualScore}`);
  const finalPredictionResultFailures = matches
    .filter((match) => match.status === "final" && !["correct", "wrong", "not_available"].includes(match.predictionResult))
    .map((match) => match.bracketSlotId);
  const missingTeamFlagOrCode = matches
    .flatMap((match) => [match.teamA, match.teamB, match.actualTeamA, match.actualTeamB].filter(Boolean))
    .filter((team) => team.sourceConfidence !== "pending" && !team.flag && !team.code)
    .map(teamLabel);
  const franceSlot = matchBySlot(data, "M77");
  const franceR16 = matchBySlot(data, "M89");
  const argentinaSlot = matchBySlot(data, "M86");
  const argentinaR16 = matchBySlot(data, "M95");
  const safeStrategy = (bracketPool.strategies || []).find((strategy) => strategy.strategy_id === data.defaultStrategy?.strategyId);
  const qfAuthorityTeams = new Set((qfAuthority.fixtures || []).flatMap((fixture) => [fixture.team_a?.team_id, fixture.team_b?.team_id].filter(Boolean)));
  const qfRows = matches.filter((match) => match.round === "qf");
  const qfRowTeams = new Set(qfRows.flatMap((match) => [teamId(match.teamA), teamId(match.teamB)].filter(Boolean)));
  const qfMissingAuthorityTeams = [...qfAuthorityTeams].filter((team) => !qfRowTeams.has(team));
  const qfUnexpectedTeams = [...qfRowTeams].filter((team) => !qfAuthorityTeams.has(team));
  const qfPendingTeamRows = qfRows.filter((match) => [match.teamA, match.teamB].some((team) => team?.sourceConfidence === "pending"));

  addCheck(checks, failures, "r32_fixture_authority_pass", authority.status === "pass", authority.status);
  addCheck(checks, failures, "qf_fixture_authority_pass", qfAuthority.status === "pass", qfAuthority.status);
  addCheck(checks, failures, "browser_data_global_present", /window\.KNOCKOUT_BRACKET_PREDICTION_DATA/.test(browserDataText), null);
  addCheck(checks, failures, "index_loads_browser_data_before_script", indexText.indexOf("knockoutBracketPredictionData.js") > -1 && indexText.indexOf("knockoutBracketPredictionData.js") < indexText.indexOf("script.js"), null);
  addCheck(checks, failures, "script_reads_active_bracket_prediction_data", /knockoutBracketPrediction/.test(scriptText) && /KNOCKOUT_BRACKET_PREDICTION_DATA/.test(scriptText), null);
  addCheck(checks, failures, "styles_include_visual_bracket", /knockout-bracket-board/.test(styleText) && /knockout-bracket-match/.test(styleText), null);
  for (const [roundId, expected] of Object.entries(expectedCounts)) {
    addCheck(checks, failures, `${roundId}_match_count`, countsByRound[roundId] === expected, countsByRound[roundId] || 0);
  }
  addCheck(checks, failures, "third_place_supported_or_absent", !countsByRound.third_place || countsByRound.third_place === 1, countsByRound.third_place || 0);
  addCheck(checks, failures, "summary_predicted_champion_present", Boolean(data.summary?.predictedChampion?.name), data.summary?.predictedChampion?.name || null);
  addCheck(checks, failures, "summary_predicted_finalists_present", (data.summary?.predictedFinalists || []).length === 2, (data.summary?.predictedFinalists || []).map(teamLabel));
  addCheck(checks, failures, "summary_predicted_semifinalists_present", (data.summary?.predictedSemifinalists || []).length === 4, (data.summary?.predictedSemifinalists || []).map(teamLabel));
  addCheck(checks, failures, "france_argentina_not_before_final", nonFinalFranceArgentina.length === 0, nonFinalFranceArgentina.map((match) => match.bracketSlotId));
  addCheck(checks, failures, "france_argentina_not_r16", r16FranceArgentina.length === 0, r16FranceArgentina.map((match) => match.bracketSlotId));
  addCheck(checks, failures, "france_path_feeds_m89", franceSlot?.bracketSlotId === "M77" && franceR16 && matchHasTeam(franceR16, "france"), {
    franceSlot: franceSlot?.bracketSlotId,
    franceR16: franceR16 ? `${teamLabel(franceR16.teamA)} vs ${teamLabel(franceR16.teamB)}` : null
  });
  addCheck(checks, failures, "argentina_path_feeds_m95", argentinaSlot?.bracketSlotId === "M86" && argentinaR16 && matchHasTeam(argentinaR16, "argentina"), {
    argentinaSlot: argentinaSlot?.bracketSlotId,
    argentinaR16: argentinaR16 ? `${teamLabel(argentinaR16.teamA)} vs ${teamLabel(argentinaR16.teamB)}` : null
  });
  addCheck(checks, failures, "predicted_winners_are_participants", predictedWinnerFailures.length === 0, predictedWinnerFailures.slice(0, 20));
  addCheck(checks, failures, "actual_winners_are_actual_participants", actualWinnerFailures.length === 0, actualWinnerFailures.slice(0, 20));
  addCheck(checks, failures, "non_final_matches_do_not_show_actual_scores", nonFinalActualScoreFailures.length === 0, nonFinalActualScoreFailures.slice(0, 20));
  addCheck(checks, failures, "final_matches_have_prediction_result", finalPredictionResultFailures.length === 0, finalPredictionResultFailures);
  addCheck(checks, failures, "known_teams_have_flags_or_code_fallback", missingTeamFlagOrCode.length === 0, missingTeamFlagOrCode.slice(0, 20));
  addCheck(checks, failures, "qf_rows_match_qf_authority", qfMissingAuthorityTeams.length === 0 && qfUnexpectedTeams.length === 0 && qfPendingTeamRows.length === 0, {
    missing_authority_teams: qfMissingAuthorityTeams,
    unexpected_qf_teams: qfUnexpectedTeams,
    pending_qf_slots: qfPendingTeamRows.map((match) => match.bracketSlotId)
  });
  addCheck(checks, failures, "qf_matches_not_marked_final_before_play", qfRows.every((match) => match.status !== "final" && !match.actualScore), qfRows.map((match) => ({ slot: match.bracketSlotId, status: match.status, actualScore: match.actualScore })));
  addCheck(checks, failures, "knockout_score_predictor_r32_coverage", (knockout.known_r32_predictions || []).length === 16, (knockout.known_r32_predictions || []).length);
  addCheck(checks, failures, "default_strategy_has_full_tree", Boolean(safeStrategy && (safeStrategy.matches || []).length === 31), safeStrategy ? `${safeStrategy.strategy_id}: ${(safeStrategy.matches || []).length}` : null);

  return { checks, failures, countsByRound };
}

function buildReport(qa) {
  const checkRows = qa.checks.map((check) => [
    check.id,
    check.status,
    Array.isArray(check.detail) ? check.detail.join("; ") : check.detail === null ? "" : JSON.stringify(check.detail)
  ]);
  const countRows = Object.entries(qa.match_counts_by_round).map(([round, count]) => [round, count]);
  const summaryRows = [
    ["Predicted champion", qa.summary.predictedChampion],
    ["Predicted finalists", qa.summary.predictedFinalists.join(", ")],
    ["Predicted semifinalists", qa.summary.predictedSemifinalists.join(", ")],
    ["Decided matches", qa.summary.decidedKnockoutMatches],
    ["Correct", qa.summary.correctWinnerPredictions],
    ["Wrong", qa.summary.wrongWinnerPredictions],
    ["Pending", qa.summary.pendingPredictions],
    ["Accuracy", qa.summary.accuracyPct === null ? "Pending first final result" : `${qa.summary.accuracyPct}%`],
    ["Flags missing/fallback", qa.summary.flagsMissingFallbackCount]
  ];

  return `# Knockout Bracket Prediction QA v1

Generated: ${qa.generated_at}

Status: **${qa.status.toUpperCase()}**

## Summary

${mdTable(["Metric", "Value"], summaryRows)}

## Match Counts

${mdTable(["Round", "Matches"], countRows)}

## Checks

${mdTable(["Check", "Status", "Detail"], checkRows)}
`;
}

async function main() {
  const data = readJson(files.bracketPrediction);
  const authority = readJson(files.fixtureAuthority);
  const qfAuthority = readJson(files.qfFixtureAuthority);
  const knockout = readJson(files.knockoutScorePredictor);
  const bracketPool = readJson(files.bracketPoolStrategy);
  const browserDataText = readText(files.browserData);
  const indexText = readText(files.index);
  const scriptText = readText(files.script);
  const styleText = readText(files.style);
  const { checks, failures, countsByRound } = validateData(data, authority, qfAuthority, knockout, bracketPool, browserDataText, indexText, scriptText, styleText);
  const resultCountsByStatus = resultCounts(data);
  const qa = {
    schema_version: "knockout_bracket_prediction_qa_v1",
    generated_at: generatedAt,
    status: failures.length ? "fail" : "pass",
    source_files: files,
    match_counts_by_round: countsByRound,
    result_counts: resultCountsByStatus,
    summary: {
      predictedChampion: data.summary?.predictedChampion?.name || null,
      predictedFinalists: (data.summary?.predictedFinalists || []).map(teamLabel),
      predictedSemifinalists: (data.summary?.predictedSemifinalists || []).map(teamLabel),
      decidedKnockoutMatches: data.summary?.decidedKnockoutMatches || 0,
      correctWinnerPredictions: data.summary?.correctWinnerPredictions || 0,
      wrongWinnerPredictions: data.summary?.wrongWinnerPredictions || 0,
      pendingPredictions: data.summary?.pendingPredictions || 0,
      accuracyPct: data.summary?.accuracyPct ?? null,
      flagsMissingFallbackCount: data.summary?.flagsMissingFallbackCount || 0
    },
    checks,
    failures
  };

  await writeJson(files.qaJson, qa);
  await writeText(files.qaReport, buildReport(qa));
  console.log(`${files.qaJson}: ${qa.status}`);
  if (failures.length) {
    console.error(JSON.stringify(failures, null, 2));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
