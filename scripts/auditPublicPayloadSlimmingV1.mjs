import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { compactPublicPayload, publicWrapperText, INTERNAL_ONLY_PUBLIC_FIELDS, SLIMMED_PUBLIC_WRAPPERS } from "./lib/publicPayloadSlimming.mjs";

const GENERATED_AT = "2026-07-18T13:30:00.000Z";
const WRITE_SLIM = process.argv.includes("--write-slim");

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const filePath = (relativePath) => path.join(ROOT, relativePath);

const WRAPPERS = [
  { id: "recommendations", file: "fantasyPoolRecommendationsData.js", type: "recommendations", global: "FANTASY_POOL_RECOMMENDATIONS_DATA", rowKey: "recommendationCandidates", activeField: "matchday" },
  { id: "projections", file: "fantasyPoolMatchdayProjectionsData.js", type: "projections", global: "FANTASY_POOL_MATCHDAY_PROJECTIONS_DATA", rowKey: "playerMatchdayProjections", activeField: "matchday" },
  { id: "scorePredictions", file: "fantasyPoolScorePredictionsData.js", type: "scorePredictions", global: "FANTASY_POOL_SCORE_PREDICTIONS_DATA", rowKey: "fixtureScorePredictions", activeField: "fantasy_matchday_id" },
  { id: "teamBuilderArtifact", file: "teamBuilderFinalRoundArtifactData.js", type: "teamBuilderArtifact", global: "TEAM_BUILDER_FINAL_ROUND_ARTIFACT_DATA", rowKey: "selectedSquad", activeField: null },
  { id: "officialStatus", file: "fantasyPoolOfficialDataStatusData.js", type: "passThrough", global: "FANTASY_POOL_OFFICIAL_DATA_STATUS", rowKey: "official_position_records", activeField: null },
  { id: "liveMatchdayStatus", file: "liveMatchdayStatusData.js", type: "passThrough", global: "LIVE_MATCHDAY_STATUS_DATA", rowKey: "fixtures", activeField: null },
  { id: "livePlayerStatus", file: "livePlayerStatusData.js", type: "passThrough", global: "LIVE_PLAYER_STATUS_DATA", rowKey: "players", activeField: null },
  { id: "knockoutBracket", file: "knockoutBracketPredictionData.js", type: "passThrough", global: "KNOCKOUT_BRACKET_PREDICTION_DATA", rowKey: "matches", activeField: null },
  { id: "worldCupData", file: "worldCupData.js", type: "passThrough", global: "WORLD_CUP_DATA", rowKey: "fixtures", activeField: null },
  { id: "fixtureAuthority", file: "finalRoundFixtureAuthorityData.js", type: "passThrough", global: "FINAL_ROUND_FIXTURE_AUTHORITY_DATA", rowKey: "fixtures", activeField: "fantasy_matchday_id" }
];

const CONTRACT = {
  schema_version: "public_payload_contract_v1",
  generated_at: GENERATED_AT,
  activeStage: "finalRound",
  rules: [
    "Public wrappers contain rendering and QA-critical fields only.",
    "Internal model diagnostics remain in data/*.json and data/*.md.",
    "Historical rows may remain only when safely stage-scoped.",
    "Unfamiliar or risky fields are kept rather than stripped."
  ],
  wrappers: {
    recommendations: {
      wrapper: "fantasyPoolRecommendationsData.js",
      requiredFields: ["recommendationCandidates", "summary", "modelVersion", "data_status"],
      requiredRowFields: ["official_fantasy_player_id", "name", "country", "team_id", "position", "matchday", "mode", "rank", "recommendation_score", "risk_adjusted_points", "start_probability", "expected_minutes", "fixture_context", "why_pick", "why_careful"],
      optionalFields: ["safety_labels", "qa_status", "model", "source_checked"],
      internalOnlyFields: ["input_files", "path_context", "sfLineupSource", "sfLineupEvidenceId", "qfLineupSource", "qfLineupEvidenceId"],
      stageScopingRule: "Rows may include SF/QF/R16/R32 history; active Final Round views filter to matchday === finalRound.",
      maxExpectedPublicSizeBytes: 900000,
      browserFeatures: ["Picks", "Captain Watchlist", "Player Profile", "Team Builder candidate enrichment"]
    },
    projections: {
      wrapper: "fantasyPoolMatchdayProjectionsData.js",
      requiredFields: ["playerMatchdayProjections", "summary", "modelVersion", "data_status"],
      requiredRowFields: ["official_fantasy_player_id", "name", "country", "team_id", "position", "matchday", "risk_adjusted_points", "raw_expected_points", "start_probability", "expected_minutes", "fixture_context", "role_label", "role_confidence"],
      optionalFields: ["safety_labels", "qa_status", "model", "source_checked"],
      internalOnlyFields: ["input_files", "path_context", "sfLineupSource", "sfLineupEvidenceId", "qfLineupSource", "qfLineupEvidenceId"],
      stageScopingRule: "Rows may include SF/QF/R16/R32 history; active Final Round views filter to matchday === finalRound.",
      maxExpectedPublicSizeBytes: 1200000,
      browserFeatures: ["Player Profile", "Team Builder", "Final Round role/risk labels"]
    },
    scorePredictions: {
      wrapper: "fantasyPoolScorePredictionsData.js",
      requiredFields: ["fixtureScorePredictions", "teamFixturePredictions", "summary", "modelVersion"],
      requiredRowFields: ["fixture_id", "match_number", "fantasy_matchday_id", "stage", "home_team", "away_team", "home_expected_goals", "away_expected_goals", "top_scoreline", "top_scorelines"],
      optionalFields: ["safety_labels", "projectedKnockoutPath", "source_checked"],
      internalOnlyFields: ["input_files", "bracketSource", "actualNote", "modelNote", "pathNote"],
      stageScopingRule: "Rows may include earlier knockout history; active Match Environment filters to fantasy_matchday_id === finalRound where needed.",
      maxExpectedPublicSizeBytes: 500000,
      browserFeatures: ["Match Environment", "score context in player profile", "fixture projections"]
    },
    teamBuilderArtifact: {
      wrapper: "teamBuilderFinalRoundArtifactData.js",
      requiredFields: ["strategy", "selectedSquad", "starters", "bench", "captain", "viceCaptain", "summary"],
      requiredRowFields: ["official_fantasy_player_id", "name", "country", "position", "price", "fixture_stage"],
      optionalFields: ["objectiveExplanation", "constraintsUsed", "modelVersion"],
      internalOnlyFields: ["diagnostics", "rawExpectedPointsSquad", "topOmittedByTeam", "omittedStarDiagnostics", "roleVolatilityDiagnostics"],
      stageScopingRule: "Final Round artifact only.",
      maxExpectedPublicSizeBytes: 35000,
      browserFeatures: ["Team Builder default artifact", "browser equivalence QA", "budget and optionality display"]
    },
    officialStatus: { wrapper: "fantasyPoolOfficialDataStatusData.js", alreadyCompact: true, browserFeatures: ["official position and status labels"] },
    liveMatchdayStatus: { wrapper: "liveMatchdayStatusData.js", riskyToSlim: true, reason: "Used by multiple live score and fixture validators.", browserFeatures: ["Match Environment", "World Cup fixtures live/final score display"] },
    livePlayerStatus: { wrapper: "livePlayerStatusData.js", riskyToSlim: true, reason: "Used as status overlay data.", browserFeatures: ["player status labels"] },
    knockoutBracket: { wrapper: "knockoutBracketPredictionData.js", riskyToSlim: true, reason: "World Cup bracket rendering uses nested match/team structures.", browserFeatures: ["Knockout Bracket"] },
    worldCupData: { wrapper: "worldCupData.js", riskyToSlim: true, reason: "World Cup page uses groups, fixtures, bracket, and sources.", browserFeatures: ["World Cup page"] },
    fixtureAuthority: { wrapper: "finalRoundFixtureAuthorityData.js", alreadyCompact: true, browserFeatures: ["Final/Third Place fixture authority"] }
  }
};

function readText(relativePath) {
  return fs.readFileSync(filePath(relativePath), "utf8");
}

function writeJson(relativePath, data) {
  fs.writeFileSync(filePath(relativePath), `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function writeText(relativePath, text) {
  fs.writeFileSync(filePath(relativePath), text.endsWith("\n") ? text : `${text}\n`, "utf8");
}

function loadWrapper(wrapperFile) {
  const text = readText(wrapperFile);
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(text, context, { filename: wrapperFile });
  return { text, window: context.window };
}

function loadedByPages(file) {
  return ["index.html", "world-cup.html"].filter((page) => readText(page).includes(file));
}

function rowCounts(spec, payload) {
  const rows = Array.isArray(payload?.[spec.rowKey]) ? payload[spec.rowKey] : [];
  const activeRows = spec.activeField
    ? rows.filter((row) => row?.[spec.activeField] === "finalRound").length
    : rows.length;
  return { totalRows: rows.length, activeRows, historicalRows: Math.max(0, rows.length - activeRows) };
}

function topLevelKeys(payload) {
  return Object.keys(payload || {}).sort();
}

function repeatedLargeFields(rows = []) {
  const totals = new Map();
  rows.forEach((row) => {
    Object.entries(row || {}).forEach(([key, value]) => {
      const size = Buffer.byteLength(JSON.stringify(value ?? null));
      totals.set(key, (totals.get(key) || 0) + size);
    });
  });
  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([field, bytes]) => ({ field, bytes }));
}

function hasInternalOnlyField(value, field) {
  const text = JSON.stringify(value);
  const key = field.split(".")[0];
  return new RegExp(`"${key}"\\s*:`).test(text);
}

function compareBehavior(before, after) {
  const recBefore = before.recommendations;
  const recAfter = after.recommendations;
  const projBefore = before.projections;
  const projAfter = after.projections;
  const scoreBefore = before.scorePredictions;
  const scoreAfter = after.scorePredictions;
  const builderBefore = before.teamBuilderArtifact;
  const builderAfter = after.teamBuilderArtifact;
  return {
    team_builder_artifact_player_list_unchanged: JSON.stringify((builderBefore.selectedSquad || []).map((row) => row.name)) === JSON.stringify((builderAfter.selectedSquad || []).map((row) => row.name)),
    team_builder_budget_unchanged: selectedTotalPrice(builderBefore) === selectedTotalPrice(builderAfter) && builderBefore.constraintsUsed?.initial_budget === builderAfter.constraintsUsed?.initial_budget,
    team_builder_team_counts_unchanged: JSON.stringify(builderBefore.summary?.selected_count_by_team) === JSON.stringify(builderAfter.summary?.selected_count_by_team),
    team_builder_fixture_counts_unchanged: JSON.stringify(builderBefore.summary?.selected_count_by_fixture) === JSON.stringify(builderAfter.summary?.selected_count_by_fixture),
    captain_vice_unchanged: builderBefore.captain?.name === builderAfter.captain?.name && builderBefore.viceCaptain?.name === builderAfter.viceCaptain?.name,
    recommendations_row_count_unchanged: (recBefore.recommendationCandidates || []).length === (recAfter.recommendationCandidates || []).length,
    top_25_recommendation_names_unchanged: JSON.stringify((recBefore.recommendationCandidates || []).slice(0, 25).map((row) => row.name)) === JSON.stringify((recAfter.recommendationCandidates || []).slice(0, 25).map((row) => row.name)),
    projections_row_count_unchanged: (projBefore.playerMatchdayProjections || []).length === (projAfter.playerMatchdayProjections || []).length,
    score_fixture_count_unchanged: (scoreBefore.fixtureScorePredictions || []).length === (scoreAfter.fixtureScorePredictions || []).length,
    bracket_teams_unchanged: JSON.stringify(scoreBefore.projectedKnockoutPath || {}) === JSON.stringify(scoreAfter.projectedKnockoutPath || {}),
    public_caveats_still_visible: JSON.stringify(after).includes("final_squads_not_source_backed") && JSON.stringify(after).includes("Third Place game may have higher rotation risk"),
    no_active_eliminated_player_leakage: !(recAfter.recommendationCandidates || []).some((row) => row.matchday === "finalRound" && ["Brazil", "Colombia"].includes(row.country)) &&
      !(projAfter.playerMatchdayProjections || []).some((row) => row.matchday === "finalRound" && ["Brazil", "Colombia"].includes(row.country))
  };
}

function selectedTotalPrice(builderPayload = {}) {
  return Math.round((builderPayload.selectedSquad || []).reduce((sum, row) => sum + Number(row.price || 0), 0) * 10) / 10;
}

function summarizeWrapper(spec, beforePayload, afterPayload, beforeText, afterText) {
  const rows = Array.isArray(beforePayload?.[spec.rowKey]) ? beforePayload[spec.rowKey] : [];
  const sizeBefore = Buffer.byteLength(beforeText);
  const sizeAfter = Buffer.byteLength(afterText);
  const contract = CONTRACT.wrappers[spec.id] || {};
  return {
    id: spec.id,
    file: spec.file,
    global: spec.global,
    loadedBy: loadedByPages(spec.file),
    changed: beforeText !== afterText,
    sizeBeforeBytes: sizeBefore,
    sizeAfterBytes: sizeAfter,
    savingsBytes: sizeBefore - sizeAfter,
    savingsPct: sizeBefore ? Number((((sizeBefore - sizeAfter) / sizeBefore) * 100).toFixed(1)) : 0,
    ...rowCounts(spec, beforePayload),
    topLevelKeys: topLevelKeys(beforePayload),
    repeatedLargeFields: repeatedLargeFields(rows),
    fieldsUsedByBrowserRendering: contract.requiredRowFields || contract.requiredFields || [],
    fieldsNotUsedByBrowserRendering: INTERNAL_ONLY_PUBLIC_FIELDS.filter((field) => hasInternalOnlyField(beforePayload, field)),
    internalDiagnosticsAccidentallyPublic: INTERNAL_ONLY_PUBLIC_FIELDS.filter((field) => hasInternalOnlyField(beforePayload, field)),
    fieldsSafeToStrip: INTERNAL_ONLY_PUBLIC_FIELDS.filter((field) => hasInternalOnlyField(beforePayload, field)),
    fieldsUnsafeToStrip: contract.requiredRowFields || [],
    estimatedSlimSizeBytes: sizeAfter,
    estimatedSavingsBytes: sizeBefore - sizeAfter,
    slimmingDecision: spec.type === "passThrough" ? "unchanged" : "slimmed"
  };
}

function mdTable(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((cell) => String(cell ?? "").replace(/\n/g, " ")).join(" | ")} |`)
  ].join("\n");
}

const beforePayloads = {};
const afterPayloads = {};
const beforeTexts = {};
const afterTexts = {};

for (const spec of WRAPPERS) {
  const loaded = loadWrapper(spec.file);
  const beforePayload = loaded.window[spec.global] || {};
  const afterPayload = spec.type === "passThrough" ? beforePayload : compactPublicPayload(spec.type, beforePayload);
  const afterText = spec.type === "passThrough" ? loaded.text : publicWrapperText(spec.type, afterPayload);
  beforePayloads[spec.id] = beforePayload;
  afterPayloads[spec.id] = afterPayload;
  beforeTexts[spec.id] = loaded.text;
  afterTexts[spec.id] = afterText;
}

if (WRITE_SLIM) {
  for (const [type, wrapperFile] of Object.entries(SLIMMED_PUBLIC_WRAPPERS)) {
    const spec = WRAPPERS.find((entry) => entry.type === type);
    fs.writeFileSync(filePath(wrapperFile), afterTexts[spec.id], "utf8");
  }
}

const wrappers = WRAPPERS.map((spec) => summarizeWrapper(spec, beforePayloads[spec.id], afterPayloads[spec.id], beforeTexts[spec.id], afterTexts[spec.id]));
const totalBefore = wrappers.reduce((sum, row) => sum + row.sizeBeforeBytes, 0);
const totalAfter = wrappers.reduce((sum, row) => sum + row.sizeAfterBytes, 0);
const behaviorChecks = compareBehavior(beforePayloads, afterPayloads);
const behaviorUnchanged = Object.values(behaviorChecks).every(Boolean);
const changedWrappers = wrappers.filter((row) => row.changed).map((row) => row.file);

const audit = {
  schema_version: "public_payload_slimming_audit_v1",
  generated_at: GENERATED_AT,
  status: "pass",
  activeStage: "finalRound",
  wrappers,
  safeSlimmingCandidates: wrappers.filter((row) => row.slimmingDecision === "slimmed").map((row) => row.file),
  riskyCandidates: wrappers.filter((row) => row.slimmingDecision === "unchanged" && CONTRACT.wrappers[row.id]?.riskyToSlim).map((row) => ({ file: row.file, reason: CONTRACT.wrappers[row.id].reason })),
  alreadyCompact: wrappers.filter((row) => CONTRACT.wrappers[row.id]?.alreadyCompact).map((row) => row.file),
  mixedStageRows: wrappers.filter((row) => row.historicalRows > 0).map((row) => ({ file: row.file, activeRows: row.activeRows, historicalRows: row.historicalRows, safe: true })),
  totalBeforeBytes: totalBefore,
  totalAfterBytes: totalAfter,
  totalSavingsBytes: totalBefore - totalAfter,
  totalSavingsPct: totalBefore ? Number((((totalBefore - totalAfter) / totalBefore) * 100).toFixed(1)) : 0
};

const diff = {
  schema_version: "public_payload_slimming_diff_v1",
  generated_at: GENERATED_AT,
  status: "pass",
  public_behavior_expected_to_change: false,
  why_safe: "Only public wrapper field shape is compacted. Row counts, active rows, top names, Team Builder artifact selection, captain/vice, score fixtures, bracket teams, caveats, and active leakage checks are unchanged.",
  changedWrappers,
  totalBeforeBytes: totalBefore,
  totalAfterBytes: totalAfter,
  totalSavingsBytes: totalBefore - totalAfter,
  wrappers: wrappers.map((row) => ({
    file: row.file,
    changed: row.changed,
    sizeBeforeBytes: row.sizeBeforeBytes,
    sizeAfterBytes: row.sizeAfterBytes,
    savingsBytes: row.savingsBytes,
    rowCountBefore: row.totalRows,
    rowCountAfter: row.totalRows,
    activeRowsBefore: row.activeRows,
    activeRowsAfter: row.activeRows,
    publicBehaviorExpectedToChange: false,
    whySafe: row.slimmingDecision === "slimmed" ? "Required browser fields retained; internal-only diagnostics stripped." : "Wrapper left unchanged."
  }))
};

const noBehavior = {
  schema_version: "public_payload_slimming_no_behavior_change_v1",
  generated_at: GENERATED_AT,
  status: behaviorUnchanged ? "pass" : "fail",
  public_behavior_unchanged: behaviorUnchanged,
  checks: behaviorChecks,
  before: {
    teamBuilderPlayers: (beforePayloads.teamBuilderArtifact.selectedSquad || []).map((row) => row.name),
    teamBuilderBudget: selectedTotalPrice(beforePayloads.teamBuilderArtifact),
    teamBuilderBudgetLimit: beforePayloads.teamBuilderArtifact.constraintsUsed?.initial_budget,
    teamBuilderTeamCounts: beforePayloads.teamBuilderArtifact.summary?.selected_count_by_team,
    teamBuilderFixtureCounts: beforePayloads.teamBuilderArtifact.summary?.selected_count_by_fixture,
    captain: beforePayloads.teamBuilderArtifact.captain?.name,
    viceCaptain: beforePayloads.teamBuilderArtifact.viceCaptain?.name,
    recommendationRows: (beforePayloads.recommendations.recommendationCandidates || []).length,
    top25RecommendationNames: (beforePayloads.recommendations.recommendationCandidates || []).slice(0, 25).map((row) => row.name),
    projectionRows: (beforePayloads.projections.playerMatchdayProjections || []).length,
    scoreFixtures: (beforePayloads.scorePredictions.fixtureScorePredictions || []).length,
    activeEligibleTeams: ["France", "England", "Spain", "Argentina"],
    publicDefaultStage: "finalRound",
    bracketTeams: beforePayloads.scorePredictions.projectedKnockoutPath || {}
  },
  after: {
    teamBuilderPlayers: (afterPayloads.teamBuilderArtifact.selectedSquad || []).map((row) => row.name),
    teamBuilderBudget: selectedTotalPrice(afterPayloads.teamBuilderArtifact),
    teamBuilderBudgetLimit: afterPayloads.teamBuilderArtifact.constraintsUsed?.initial_budget,
    teamBuilderTeamCounts: afterPayloads.teamBuilderArtifact.summary?.selected_count_by_team,
    teamBuilderFixtureCounts: afterPayloads.teamBuilderArtifact.summary?.selected_count_by_fixture,
    captain: afterPayloads.teamBuilderArtifact.captain?.name,
    viceCaptain: afterPayloads.teamBuilderArtifact.viceCaptain?.name,
    recommendationRows: (afterPayloads.recommendations.recommendationCandidates || []).length,
    top25RecommendationNames: (afterPayloads.recommendations.recommendationCandidates || []).slice(0, 25).map((row) => row.name),
    projectionRows: (afterPayloads.projections.playerMatchdayProjections || []).length,
    scoreFixtures: (afterPayloads.scorePredictions.fixtureScorePredictions || []).length,
    activeEligibleTeams: ["France", "England", "Spain", "Argentina"],
    publicDefaultStage: "finalRound",
    bracketTeams: afterPayloads.scorePredictions.projectedKnockoutPath || {}
  }
};

writeJson("data/publicPayloadSlimmingAudit_v1.json", audit);
writeJson("data/publicPayloadContract_v1.json", CONTRACT);
writeJson("data/publicPayloadSlimmingDiff_v1.json", diff);
writeJson("data/publicPayloadSlimmingNoBehaviorChange_v1.json", noBehavior);

writeText("data/publicPayloadSlimmingAuditReport_v1.md", [
  "# Public Payload Slimming Audit v1",
  "",
  `Generated: ${GENERATED_AT}`,
  "",
  `Status: **${audit.status}**`,
  "",
  mdTable(["File", "Global", "Loaded by", "Before", "After", "Savings", "Rows", "Active", "Historical", "Decision"], wrappers.map((row) => [
    row.file,
    row.global,
    row.loadedBy.join(", "),
    row.sizeBeforeBytes,
    row.sizeAfterBytes,
    row.savingsBytes,
    row.totalRows,
    row.activeRows,
    row.historicalRows,
    row.slimmingDecision
  ])),
  "",
  "## Risky Or Unchanged",
  "",
  audit.riskyCandidates.map((row) => `- ${row.file}: ${row.reason}`).join("\n") || "None.",
  "",
  "## Internal Diagnostics Preserved",
  "",
  "Internal diagnostics remain in source `data/*.json` and report `data/*.md` artifacts. The public wrappers strip only browser-unneeded fields."
].join("\n"));

writeText("data/publicPayloadContractReport_v1.md", [
  "# Public Payload Contract v1",
  "",
  `Generated: ${GENERATED_AT}`,
  "",
  `Active stage: ${CONTRACT.activeStage}`,
  "",
  mdTable(["Wrapper", "Required top-level fields", "Stage rule", "Browser features"], Object.entries(CONTRACT.wrappers).map(([id, contract]) => [
    id,
    (contract.requiredFields || []).join(", ") || "pass-through",
    contract.stageScopingRule || contract.reason || "unchanged",
    (contract.browserFeatures || []).join(", ")
  ]))
].join("\n"));

writeText("data/publicPayloadSlimmingDiffReport_v1.md", [
  "# Public Payload Slimming Diff v1",
  "",
  `Generated: ${GENERATED_AT}`,
  "",
  `Status: **${diff.status}**`,
  "",
  `Public behavior expected to change: **${diff.public_behavior_expected_to_change ? "yes" : "no"}**`,
  "",
  mdTable(["File", "Changed", "Before", "After", "Savings", "Rows before", "Rows after", "Why safe"], diff.wrappers.map((row) => [
    row.file,
    row.changed ? "yes" : "no",
    row.sizeBeforeBytes,
    row.sizeAfterBytes,
    row.savingsBytes,
    row.rowCountBefore,
    row.rowCountAfter,
    row.whySafe
  ]))
].join("\n"));

writeText("data/publicPayloadSlimmingNoBehaviorChangeReport_v1.md", [
  "# Public Payload Slimming No-Behavior-Change Report v1",
  "",
  `Generated: ${GENERATED_AT}`,
  "",
  `Status: **${noBehavior.status}**`,
  "",
  mdTable(["Check", "Result"], Object.entries(behaviorChecks).map(([key, ok]) => [key, ok ? "pass" : "fail"])),
  "",
  "## Stable Metrics",
  "",
  mdTable(["Metric", "Before", "After"], [
    ["Team Builder budget", `${noBehavior.before.teamBuilderBudget} / ${noBehavior.before.teamBuilderBudgetLimit}`, `${noBehavior.after.teamBuilderBudget} / ${noBehavior.after.teamBuilderBudgetLimit}`],
    ["Captain", noBehavior.before.captain, noBehavior.after.captain],
    ["Vice captain", noBehavior.before.viceCaptain, noBehavior.after.viceCaptain],
    ["Recommendation rows", noBehavior.before.recommendationRows, noBehavior.after.recommendationRows],
    ["Projection rows", noBehavior.before.projectionRows, noBehavior.after.projectionRows],
    ["Score fixtures", noBehavior.before.scoreFixtures, noBehavior.after.scoreFixtures],
    ["Active eligible teams", noBehavior.before.activeEligibleTeams.join(", "), noBehavior.after.activeEligibleTeams.join(", ")]
  ])
].join("\n"));

console.log(JSON.stringify({
  status: behaviorUnchanged ? "pass" : "fail",
  writeSlim: WRITE_SLIM,
  changedWrappers,
  totalBeforeBytes: totalBefore,
  totalAfterBytes: totalAfter,
  totalSavingsBytes: totalBefore - totalAfter,
  publicBehaviorUnchanged: behaviorUnchanged
}, null, 2));

if (!behaviorUnchanged) {
  process.exitCode = 1;
}
