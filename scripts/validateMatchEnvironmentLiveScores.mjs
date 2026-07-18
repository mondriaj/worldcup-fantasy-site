import { readFile, writeFile } from "node:fs/promises";

const PATHS = {
  html: "index.html",
  script: "script.js",
  r32ScorePredictions: "data/scorePredictions_fantasyPool_r32_v1.json",
  r16ScorePredictions: "data/scorePredictions_fantasyPool_r16_v1.json",
  qfScorePredictions: "data/scorePredictions_fantasyPool_qf_v1.json",
  sfScorePredictions: "data/scorePredictions_fantasyPool_sf_v1.json",
  finalRoundScorePredictions: "data/scorePredictions_fantasyPool_finalRound_v1.json",
  liveMatchday: "data/liveMatchdayStatus_v1.json",
  liveFixtureQa: "data/liveFixtureMappingQa_v1.json",
  outputJson: "data/matchEnvironmentLiveScoresQa_v1.json",
  outputReport: "data/matchEnvironmentLiveScoresQaReport_v1.md"
};

const GENERATED_AT = new Date().toISOString();
const FINAL_STATUS_VALUES = new Set(["complete", "completed", "played"]);

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function rowsFromJson(data, keys) {
  if (Array.isArray(data)) return data;
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function localFixtureIdFromMatchNumber(matchNumber) {
  const number = Number(matchNumber);
  return Number.isFinite(number) && number > 0 ? `fwc2026-m${String(number).padStart(3, "0")}` : "";
}

function validLocalFixtureKey(value) {
  const key = String(value || "").trim();
  return /^fwc2026-m\d{3}$/i.test(key) ? key.toLowerCase() : "";
}

function liveFixtureKey(fixture) {
  return validLocalFixtureKey(
    fixture?.resolved_local_fixture_key ||
    fixture?.local_fixture_id ||
    fixture?.match_id ||
    localFixtureIdFromMatchNumber(fixture?.match_number)
  );
}

function predictionFixtureKey(row) {
  return validLocalFixtureKey(
    row?.fixture_id ||
    row?.match_id ||
    localFixtureIdFromMatchNumber(row?.match_number)
  );
}

function isSafeFinalFixture(fixture) {
  const mappingStatus = String(fixture?.mapping_status || "").toLowerCase();
  const fixtureStatus = String(fixture?.fixture_status || "").toLowerCase();
  return ["matched", "matched_reversed"].includes(mappingStatus) &&
    fixture?.safe_to_display_score === true &&
    FINAL_STATUS_VALUES.has(fixtureStatus) &&
    Boolean(liveFixtureKey(fixture));
}

function scoreIsPresent(fixture) {
  return fixture?.home_score !== null &&
    fixture?.home_score !== undefined &&
    fixture?.away_score !== null &&
    fixture?.away_score !== undefined;
}

function sameTeamPair(liveFixture, prediction) {
  const liveHome = normalizeText(liveFixture?.local_home_team || liveFixture?.home_team);
  const liveAway = normalizeText(liveFixture?.local_away_team || liveFixture?.away_team);
  const predictionHome = normalizeText(prediction?.home_team);
  const predictionAway = normalizeText(prediction?.away_team);
  return Boolean(liveHome && liveAway && predictionHome && predictionAway &&
    liveHome === predictionHome &&
    liveAway === predictionAway);
}

function mdTable(headers, rows) {
  if (!rows.length) return "_None._";
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((value) => String(value ?? "")).join(" | ")} |`)
  ].join("\n");
}

function buildReport(qa) {
  return [
    "# Match Environment Live Scores QA v1",
    "",
    `Generated: ${qa.generated_at}`,
    "",
    `Status: ${qa.status}`,
    "",
    "## Summary",
    "",
    mdTable(
      ["Metric", "Value"],
      [
        ["Score prediction fixtures", qa.summary.score_prediction_fixture_count],
        ["Group-stage score prediction fixtures", qa.summary.group_stage_score_prediction_fixture_count],
        ["Live fixtures", qa.summary.live_fixture_count],
        ["Matched final score support", `${qa.summary.final_score_support_rows} / ${qa.summary.final_fixture_count}`],
        ["Completed MD1 scores supported", `${qa.summary.completed_md1_final_scores_supported} / ${qa.summary.completed_md1_fixture_count}`],
        ["Completed MD2 scores supported", `${qa.summary.completed_md2_final_scores_supported} / ${qa.summary.completed_md2_fixture_count}`],
        ["Completed MD3 scores supported", `${qa.summary.completed_md3_final_scores_supported} / ${qa.summary.completed_md3_fixture_count}`],
        ["Playing fixtures shown final", qa.summary.playing_fixture_final_leak_count],
        ["Non-final score leaks", qa.summary.non_final_score_leak_count],
        ["Reversed score/team errors", qa.summary.reversed_score_error_count],
        ["Final Round default", qa.summary.final_round_default ? "yes" : "no"],
        ["Final Round/SF/QF/R16/R32/MD views accessible", qa.summary.active_matchdays_accessible ? "yes" : "no"]
      ]
    ),
    "",
    "## Completed MD3 Checks",
    "",
    mdTable(
      ["Match", "Fixture", "Score", "Supported"],
      qa.completed_md3_checks.map((row) => [
        row.match_number,
        row.fixture,
        row.score,
        row.supported ? "yes" : "no"
      ])
    ),
    "",
    "## Errors",
    "",
    qa.errors.length ? qa.errors.map((error) => `- ${error}`).join("\n") : "None",
    "",
    "## Warnings",
    "",
    qa.warnings.length ? qa.warnings.map((warning) => `- ${warning}`).join("\n") : "None",
    ""
  ].join("\n");
}

const [html, scriptText, r32ScorePredictionData, r16ScorePredictionData, qfScorePredictionData, sfScorePredictionData, finalRoundScorePredictionData, liveMatchdayData, liveFixtureQa] = await Promise.all([
  readFile(PATHS.html, "utf8"),
  readFile(PATHS.script, "utf8"),
  readJson(PATHS.r32ScorePredictions),
  readJson(PATHS.r16ScorePredictions),
  readJson(PATHS.qfScorePredictions),
  readJson(PATHS.sfScorePredictions),
  readJson(PATHS.finalRoundScorePredictions),
  readJson(PATHS.liveMatchday),
  readJson(PATHS.liveFixtureQa)
]);

const r32ScoreRows = rowsFromJson(r32ScorePredictionData, ["fixtureScorePredictions"]);
const r16ScoreRows = rowsFromJson(r16ScorePredictionData, ["fixtureScorePredictions"]);
const qfScoreRows = rowsFromJson(qfScorePredictionData, ["fixtureScorePredictions"]);
const sfScoreRows = rowsFromJson(sfScorePredictionData, ["fixtureScorePredictions"]);
const finalRoundScoreRows = rowsFromJson(finalRoundScorePredictionData, ["fixtureScorePredictions"]);
const scoreRows = [...finalRoundScoreRows, ...sfScoreRows, ...qfScoreRows, ...r16ScoreRows, ...r32ScoreRows];
const groupScoreRows = scoreRows.filter((row) => {
  const matchNumber = Number(row.match_number || String(row.fixture_id || row.match_id || "").match(/m(\d{3})/i)?.[1]);
  return Number.isFinite(matchNumber) && matchNumber <= 72;
});
const liveFixtures = rowsFromJson(liveMatchdayData, ["fixtures"]);
const predictionsByFixtureId = new Map(scoreRows
  .map((row) => [predictionFixtureKey(row), row])
  .filter(([key]) => key));
const finalFixtures = liveFixtures.filter(isSafeFinalFixture);
const finalSupportChecks = finalFixtures.map((fixture) => {
  const key = liveFixtureKey(fixture);
  const prediction = predictionsByFixtureId.get(key);
  const teamPairMatches = sameTeamPair(fixture, prediction);
  return {
    match_number: Number(fixture.match_number),
    fixture_id: key,
    fixture: `${fixture.local_home_team || fixture.home_team} vs ${fixture.local_away_team || fixture.away_team}`,
    round_id: String(fixture.round_id || ""),
    score: `${fixture.home_score}-${fixture.away_score}`,
    supported: Boolean(prediction && teamPairMatches),
    reversed: Boolean(prediction && (
      normalizeText(fixture.local_home_team || fixture.home_team) === normalizeText(prediction.away_team) ||
      normalizeText(fixture.local_away_team || fixture.away_team) === normalizeText(prediction.home_team)
    ))
  };
});

const nonFinalScoreLeaks = liveFixtures.filter((fixture) => !isSafeFinalFixture(fixture) && (
  scoreIsPresent(fixture) ||
  fixture.safe_to_display_score === true ||
  String(fixture.score_status || "").toLowerCase() === "final"
));
const playingFinalLeaks = liveFixtures.filter((fixture) =>
  String(fixture.fixture_status || "").toLowerCase() === "playing" &&
  (fixture.safe_to_display_score === true || String(fixture.score_status || "").toLowerCase() === "final")
);

const completePredictionRows = scoreRows.filter((row) => {
  const status = String(row.fixture_authority_status || "final_known").toLowerCase();
  return !["pending", "partial_known"].includes(status) &&
    row.home_team &&
    row.away_team &&
    normalizeText(row.home_team) !== "tbd" &&
    normalizeText(row.away_team) !== "tbd";
});
const predictedFieldChecks = {
  projected_xg: completePredictionRows.every((row) => row.home_expected_goals !== undefined && row.away_expected_goals !== undefined),
  wdl: completePredictionRows.every((row) => row.home_win_probability !== undefined && row.draw_probability !== undefined && row.away_win_probability !== undefined),
  top_scoreline: completePredictionRows.every((row) =>
    (Array.isArray(row.top_scorelines) && row.top_scorelines[0]?.scoreline) ||
    row.top_scoreline ||
    row.most_likely_score
  ),
  uncertainty: completePredictionRows.every((row) => row.uncertaintyLabel || row.uncertainty_label || row.matchUncertainty || row.match_uncertainty),
  clean_sheet: completePredictionRows.every((row) => row.home_clean_sheet_probability !== undefined && row.away_clean_sheet_probability !== undefined)
};

const requiredScriptHooks = {
  uses_live_global: scriptText.includes("LIVE_MATCHDAY_STATUS_DATA"),
  builds_live_lookup: scriptText.includes("buildLiveFixtureLookup") && scriptText.includes("liveFixtureLookup"),
  safe_final_guard: scriptText.includes("isSafeMappedFinalFixture") && scriptText.includes("safe_to_display_score"),
  prediction_team_guard: scriptText.includes("liveFixtureMatchesScorePrediction"),
  context_in_match_environment: scriptText.includes("liveFixtureContextHtml(liveFixture)") && scriptText.includes("live-score-context"),
  keeps_prediction_fields: ["projectedXgText(row)", "winDrawWinText(row)", "topScorelineText(row)", "matchUncertaintyLabel(row)", "cleanSheetContextText(row)"]
    .every((snippet) => scriptText.includes(snippet))
};

const liveBeforeScript = html.indexOf("liveMatchdayStatusData.js") >= 0 &&
  html.indexOf("script.js") >= 0 &&
  html.indexOf("liveMatchdayStatusData.js") < html.indexOf("script.js");
const finalRoundDefault = /defaultPublicMatchdayId\s*=\s*"finalRound"/.test(scriptText) &&
  /let activeEnvironmentMatchdayId\s*=\s*defaultActiveMatchdayId/.test(scriptText);
const activeMatchdaysAccessible = /matchday_id:\s*"finalRound"/.test(scriptText) &&
  /matchday_id:\s*"sf"/.test(scriptText) &&
  /matchday_id:\s*"qf"/.test(scriptText) &&
  /matchday_id:\s*"r16"/.test(scriptText) &&
  /matchday_id:\s*"r32"/.test(scriptText) &&
  /matchday_id:\s*"md1"/.test(scriptText) &&
  /matchday_id:\s*"md2"/.test(scriptText) &&
  /matchday_id:\s*"md3"/.test(scriptText);

const errors = [];
const warnings = [];

if (!liveBeforeScript) errors.push("index.html must load liveMatchdayStatusData.js before script.js.");
if (liveFixtureQa.status !== "passed") errors.push(`Live fixture mapping QA status is ${liveFixtureQa.status}.`);
if (groupScoreRows.length !== 72) errors.push(`Expected 72 group-stage score-prediction fixtures, found ${groupScoreRows.length}.`);
if ((liveFixtureQa.summary?.matched_fixtures || 0) !== 102) {
  errors.push(`Expected 102 matched live fixtures, found ${liveFixtureQa.summary?.matched_fixtures}.`);
}
if ((liveFixtureQa.summary?.unsafe_fixture_player_point_leak_count || 0) !== 0) {
  errors.push(`Live fixture QA reports ${liveFixtureQa.summary.unsafe_fixture_player_point_leak_count} unsafe fixture/player point leaks.`);
}

Object.entries(requiredScriptHooks).forEach(([key, passed]) => {
  if (!passed) errors.push(`Match Environment live-score hook missing: ${key}.`);
});
Object.entries(predictedFieldChecks).forEach(([key, passed]) => {
  if (!passed) errors.push(`Score prediction field missing from one or more rows: ${key}.`);
});

const unsupportedFinals = finalSupportChecks.filter((row) => !row.supported);
const reversedErrors = finalSupportChecks.filter((row) => row.reversed);
if (unsupportedFinals.length) errors.push(`Final fixtures without Match Environment support: ${unsupportedFinals.map((row) => row.match_number).join(", ")}.`);
if (reversedErrors.length) errors.push(`Possible reversed Match Environment mappings: ${reversedErrors.map((row) => row.match_number).join(", ")}.`);
if (nonFinalScoreLeaks.length) errors.push(`Non-final fixtures exposing final score state: ${nonFinalScoreLeaks.map((fixture) => fixture.match_number || fixture.source_fixture_id).join(", ")}.`);
if (playingFinalLeaks.length) errors.push(`Playing fixtures shown as final: ${playingFinalLeaks.map((fixture) => fixture.match_number || fixture.source_fixture_id).join(", ")}.`);
if (!finalRoundDefault) errors.push("Match Environment does not default to Final Round.");
if (!activeMatchdaysAccessible) errors.push("Final Round, SF, QF, R16, R32, MD1, MD2, and MD3 are not all available in matchday options.");

const completedMd1 = finalSupportChecks.filter((row) => row.round_id === "1");
const completedMd2 = finalSupportChecks.filter((row) => row.round_id === "2");
const completedMd3 = finalSupportChecks.filter((row) => row.round_id === "3");

const qa = {
  schema_version: "match_environment_live_scores_qa_v1",
  generated_at: GENERATED_AT,
  status: errors.length ? "failed" : "passed",
  files: PATHS,
  summary: {
    score_prediction_fixture_count: scoreRows.length,
    r32_score_prediction_fixture_count: r32ScoreRows.length,
    r16_score_prediction_fixture_count: r16ScoreRows.length,
    qf_score_prediction_fixture_count: qfScoreRows.length,
    sf_score_prediction_fixture_count: sfScoreRows.length,
    final_round_score_prediction_fixture_count: finalRoundScoreRows.length,
    complete_prediction_fixture_count: completePredictionRows.length,
    group_stage_score_prediction_fixture_count: groupScoreRows.length,
    live_fixture_count: liveFixtures.length,
    final_fixture_count: finalFixtures.length,
    final_score_support_rows: finalSupportChecks.filter((row) => row.supported).length,
    completed_md1_fixture_count: completedMd1.length,
    completed_md1_final_scores_supported: completedMd1.filter((row) => row.supported).length,
    completed_md2_fixture_count: completedMd2.length,
    completed_md2_final_scores_supported: completedMd2.filter((row) => row.supported).length,
    completed_md3_fixture_count: completedMd3.length,
    completed_md3_final_scores_supported: completedMd3.filter((row) => row.supported).length,
    non_final_score_leak_count: nonFinalScoreLeaks.length,
    playing_fixture_final_leak_count: playingFinalLeaks.length,
    reversed_score_error_count: reversedErrors.length,
    final_round_default: finalRoundDefault,
    active_matchdays_accessible: activeMatchdaysAccessible,
    live_script_loaded_before_app_script: liveBeforeScript,
    predicted_field_checks: predictedFieldChecks,
    script_hook_checks: requiredScriptHooks
  },
  completed_md3_checks: completedMd3,
  final_support_sample: finalSupportChecks.slice(0, 20),
  non_final_score_leaks_sample: nonFinalScoreLeaks.slice(0, 20).map((fixture) => ({
    source_fixture_id: fixture.source_fixture_id,
    match_number: fixture.match_number,
    round_id: fixture.round_id,
    fixture_status: fixture.fixture_status,
    score_status: fixture.score_status,
    safe_to_display_score: fixture.safe_to_display_score
  })),
  errors,
  warnings
};

await writeFile(PATHS.outputJson, `${JSON.stringify(qa, null, 2)}\n`, "utf8");
await writeFile(PATHS.outputReport, buildReport(qa), "utf8");

console.log(JSON.stringify({
  status: qa.status,
  output_json: PATHS.outputJson,
  output_report: PATHS.outputReport,
  completed_md1_final_scores_supported: `${qa.summary.completed_md1_final_scores_supported}/${qa.summary.completed_md1_fixture_count}`,
  completed_md2_final_scores_supported: `${qa.summary.completed_md2_final_scores_supported}/${qa.summary.completed_md2_fixture_count}`,
  completed_md3_final_scores_supported: `${qa.summary.completed_md3_final_scores_supported}/${qa.summary.completed_md3_fixture_count}`,
  non_final_score_leak_count: qa.summary.non_final_score_leak_count,
  reversed_score_error_count: qa.summary.reversed_score_error_count
}, null, 2));

if (qa.status !== "passed") {
  process.exitCode = 1;
}
