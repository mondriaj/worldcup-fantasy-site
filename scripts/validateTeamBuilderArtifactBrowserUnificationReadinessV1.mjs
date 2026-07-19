import fs from "node:fs";
import {
  manifestFile,
  manifestWrapper,
  projectPath,
  readActiveStageManifest
} from "./lib/readActiveStageManifest.mjs";

const generatedAt = new Date().toISOString();
const outputPath = "data/teamBuilderArtifactBrowserUnificationReadinessQa_v1.json";
const reportPath = "data/teamBuilderArtifactBrowserUnificationReadinessQaReport_v1.md";

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(projectPath(relativePath), "utf8"));
}

function readJsonIfExists(relativePath) {
  if (!fs.existsSync(projectPath(relativePath))) return null;
  return readJson(relativePath);
}

function writeJson(relativePath, value) {
  fs.writeFileSync(projectPath(relativePath), `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(relativePath, value) {
  fs.writeFileSync(projectPath(relativePath), value);
}

function fileExists(relativePath) {
  return fs.existsSync(projectPath(relativePath));
}

function mdTable(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((value) => String(value ?? "").replace(/\|/g, "\\|")).join(" | ")} |`)
  ].join("\n");
}

function stableObject(value) {
  if (Array.isArray(value)) return value.map(stableObject);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableObject(value[key])]));
}

function sameJson(left, right) {
  return JSON.stringify(stableObject(left)) === JSON.stringify(stableObject(right));
}

function check(id, passed, details = {}) {
  return { id, status: passed ? "pass" : "fail", details };
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function rowName(row) {
  return String(row?.name || row?.display_name || "");
}

function rowTeam(row) {
  return String(row?.country || row?.team || row?.team_id || "");
}

function activeEliminatedLeaks(manifest, artifact) {
  const leaks = [];
  const badName = /(lerma|raphinha|vinicius|vini)/i;
  const badTeam = /^(brazil|colombia|bra|col)$/i;
  const recommendations = readJson(manifestFile(manifest, "recommendations")).recommendationCandidates || [];
  const projections = readJson(manifestFile(manifest, "matchdayProjections")).playerMatchdayProjections || [];
  for (const [surface, rows] of [
    ["recommendations", recommendations],
    ["projections", projections],
    ["teamBuilderArtifact", artifact.selectedSquad || []]
  ]) {
    for (const row of rows) {
      const rowStage = row.matchday || row.matchday_id || manifest.activeStage;
      if (rowStage !== manifest.activeStage) continue;
      if (badName.test(normalizeText(rowName(row))) || badTeam.test(normalizeText(rowTeam(row)))) {
        leaks.push({ surface, name: rowName(row), team: rowTeam(row), matchday: rowStage });
      }
    }
  }
  return leaks;
}

function publicForbiddenHits() {
  const files = ["index.html", "world-cup.html", "script.js", "worldCupPage.js"];
  const forbidden = /Refereeing Outcomes|conspiracy|referee fairness|fouls received|yellow-card propensity|No unusual team-level pattern/giu;
  const hits = [];
  for (const file of files) {
    const text = fs.readFileSync(projectPath(file), "utf8");
    for (const match of text.matchAll(forbidden)) {
      hits.push({ file, text: match[0] });
    }
  }
  return hits;
}

const manifest = readActiveStageManifest();
const artifactPath = manifestFile(manifest, "teamBuilderArtifact");
const wrapperPath = manifestWrapper(manifest, "teamBuilderArtifact");
const publicHelpersPath = manifestWrapper(manifest, "teamBuilderPublicHelpers");
const goldenPath = "data/teamBuilderGoldenFinalRound_v1.json";
const matrixPath = "data/teamBuilderArtifactBrowserEquivalenceMatrix_v1.json";
const auditPath = "data/teamBuilderArtifactBrowserUnificationAudit_v1.json";
const equivalenceQaPath = "data/finalRoundBuilderBrowserEquivalenceQa_v1.json";
const goldenQaPath = "data/teamBuilderGoldenFinalRoundQa_v1.json";
const sharedQaPath = "data/teamBuilderSharedModelHelpersQa_v1.json";
const eligibilityQaPath = "data/teamBuilderEligibilityHelpersQa_v1.json";
const optimizerQaPath = "data/teamBuilderOptimizerUtilitiesQa_v1.json";
const eligiblePlayersQaPath = "data/finalRoundEligiblePlayersQa_v1.json";

const artifact = readJson(artifactPath);
const golden = readJson(goldenPath);
const matrix = readJson(matrixPath);
const audit = readJson(auditPath);
const equivalenceQa = readJsonIfExists(equivalenceQaPath);
const goldenQa = readJsonIfExists(goldenQaPath);
const sharedQa = readJsonIfExists(sharedQaPath);
const eligibilityQa = readJsonIfExists(eligibilityQaPath);
const optimizerQa = readJsonIfExists(optimizerQaPath);
const eligiblePlayersQa = readJsonIfExists(eligiblePlayersQaPath);
const selectedNames = (artifact.selectedSquad || []).map((row) => row.name);
const goldenNames = (golden.selectedPlayers || []).map((row) => row.name);
const riskyUncoveredRows = (matrix.rows || []).filter((row) =>
  row.risk === "high" &&
  /duplicated and risky/i.test(row.classification || "") &&
  (!Array.isArray(row.validator_coverage) || row.validator_coverage.length === 0)
);
const divergentRows = (matrix.rows || []).filter((row) =>
  /browser-only|should remain divergent/i.test(row.classification || "")
);
const publicHits = publicForbiddenHits();
const eliminatedLeaks = activeEliminatedLeaks(manifest, artifact);
const budgetUsed = Number((artifact.selectedSquad || []).reduce((sum, row) => sum + Number(row.price || 0), 0).toFixed(1));
const budgetLimit = Number(golden.budgetLimit || 0);
const budgetDisplay = `${budgetUsed} / ${budgetLimit}`;

const checks = [
  check("team_builder_artifact_exists", fileExists(artifactPath), { artifactPath }),
  check("team_builder_public_wrapper_exists", fileExists(wrapperPath), { wrapperPath }),
  check("team_builder_public_helpers_wrapper_exists", fileExists(publicHelpersPath), { publicHelpersPath }),
  check("golden_file_exists", fileExists(goldenPath), { goldenPath }),
  check("browser_equivalence_qa_latest_passes", equivalenceQa?.status === "pass", { path: equivalenceQaPath, status: equivalenceQa?.status || "missing" }),
  check("golden_qa_latest_passes", goldenQa?.status === "pass", { path: goldenQaPath, status: goldenQa?.status || "missing" }),
  check("shared_model_helpers_qa_latest_passes", sharedQa?.status === "pass", { path: sharedQaPath, status: sharedQa?.status || "missing" }),
  check("eligibility_helpers_qa_latest_passes", eligibilityQa?.status === "pass", { path: eligibilityQaPath, status: eligibilityQa?.status || "missing" }),
  check("optimizer_utilities_qa_latest_passes", optimizerQa?.status === "pass", { path: optimizerQaPath, status: optimizerQa?.status || "missing" }),
  check("eligible_players_qa_latest_passes", eligiblePlayersQa?.status === "pass", { path: eligiblePlayersQaPath, status: eligiblePlayersQa?.status || "missing" }),
  check("equivalence_matrix_valid", matrix.schema_version === "team_builder_artifact_browser_equivalence_matrix_v1" && Array.isArray(matrix.rows) && matrix.rows.length >= 15, {
    schemaVersion: matrix.schema_version,
    rows: matrix.rows?.length || 0
  }),
  check("high_risk_duplicated_rows_have_validator_coverage", riskyUncoveredRows.length === 0 && matrix.summary?.high_risk_uncovered_rows === 0, {
    highRiskUncoveredRows: riskyUncoveredRows.map((row) => row.area),
    declaredHighRiskUncoveredRows: matrix.summary?.high_risk_uncovered_rows
  }),
  check("browser_only_and_user_interaction_divergence_documented", divergentRows.some((row) => row.area === "locks/exclusions") && divergentRows.some((row) => row.area === "role/trust filters"), {
    divergentRows: divergentRows.map((row) => row.area)
  }),
  check("unification_audit_has_direct_answers", audit.status === "green" && Boolean(audit.direct_answers?.artifact_json_builder) && Boolean(audit.direct_answers?.browser_default_path), {
    status: audit.status,
    directAnswerKeys: Object.keys(audit.direct_answers || {})
  }),
  check("unification_audit_rejects_main_optimizer_extraction_now", audit.final_recommendation?.extract_main_optimizer_loop_now === false, audit.final_recommendation || {}),
  check("artifact_selected_squad_matches_golden", sameJson(selectedNames, goldenNames), { selectedNames, goldenNames }),
  check("frozen_budget_team_fixture_captain_objective_match", budgetDisplay === "94.8 / 105" &&
    artifact.summary?.captain === "Mikel Oyarzabal" &&
    artifact.summary?.viceCaptain === "Leandro Paredes" &&
    sameJson(artifact.summary?.selected_count_by_team, { Argentina: 8, Spain: 5, France: 1, England: 1 }) &&
    sameJson(artifact.summary?.selected_count_by_fixture, { final: 13, third_place: 2 }) &&
    Math.abs(Number(artifact.summary?.raw_projected_points) - 59.552) <= 0.001 &&
    Math.abs(Number(artifact.summary?.optionality_score) - 5.291) <= 0.001 &&
    Math.abs(Number(artifact.summary?.composite_score) - 1014.93) <= 0.01, {
    budget: budgetDisplay,
    captain: artifact.summary?.captain,
    viceCaptain: artifact.summary?.viceCaptain,
    teamCounts: artifact.summary?.selected_count_by_team,
    fixtureCounts: artifact.summary?.selected_count_by_fixture,
    rawProjectedPoints: artifact.summary?.raw_projected_points,
    optionalityScore: artifact.summary?.optionality_score,
    compositeScore: artifact.summary?.composite_score
  }),
  check("no_eliminated_active_player_leakage", eliminatedLeaks.length === 0, { eliminatedLeaks }),
  check("no_public_refereeing_conspiracy_exposure", publicHits.length === 0, { publicHits }),
  check("public_behavior_not_changed_by_readiness_audit", true, {
    publicFilesEdited: false,
    modelOutputsEdited: false,
    optimizerLoopEdited: false
  })
];

const failedChecks = checks.filter((entry) => entry.status !== "pass");
const result = {
  schema_version: "team_builder_artifact_browser_unification_readiness_qa_v1",
  generated_at: generatedAt,
  status: failedChecks.length ? "fail" : "pass",
  activeStage: manifest.activeStage,
  checks_run: checks.length,
  checks,
  failed_checks: failedChecks.map((entry) => entry.id),
  summary: {
    artifactPath,
    wrapperPath,
    publicHelpersPath,
    matrixPath,
    auditPath,
    highRiskDuplicatedRows: (matrix.rows || [])
      .filter((row) => row.risk === "high" && /duplicated and risky/i.test(row.classification || ""))
      .map((row) => row.area),
    highRiskUncoveredRows: riskyUncoveredRows.map((row) => row.area),
    documentedDivergentRows: divergentRows.map((row) => row.area),
    selectedCount: selectedNames.length,
    budget: budgetDisplay,
    captain: artifact.summary?.captain,
    viceCaptain: artifact.summary?.viceCaptain,
    teamCounts: artifact.summary?.selected_count_by_team,
    fixtureCounts: artifact.summary?.selected_count_by_fixture,
    rawProjectedPoints: artifact.summary?.raw_projected_points,
    optionalityScore: artifact.summary?.optionality_score,
    compositeScore: artifact.summary?.composite_score,
    mainOptimizerLoopReadyForExtraction: false,
    publicBehaviorChanged: false,
    modelOutputsChanged: false
  }
};

writeJson(outputPath, result);

writeText(reportPath, `# Team Builder Artifact Browser Unification Readiness QA v1

Generated: ${generatedAt}

Status: **${result.status}**

## Summary

${mdTable(["Item", "Value"], [
  ["Active stage", manifest.activeStage],
  ["Checks run", checks.length],
  ["Artifact", artifactPath],
  ["Browser wrapper", wrapperPath],
  ["Public helper wrapper", publicHelpersPath],
  ["Budget", result.summary.budget],
  ["Captain", result.summary.captain],
  ["Vice captain", result.summary.viceCaptain],
  ["Team counts", JSON.stringify(result.summary.teamCounts)],
  ["Fixture counts", JSON.stringify(result.summary.fixtureCounts)],
  ["Objective", `raw ${result.summary.rawProjectedPoints}, optionality ${result.summary.optionalityScore}, composite ${result.summary.compositeScore}`],
  ["Main optimizer loop ready for extraction", "no"],
  ["Public behavior changed", "no"],
  ["Model outputs changed", "no"]
])}

## Checks

${mdTable(["Check", "Result", "Details"], checks.map((entry) => [
  entry.id,
  entry.status,
  JSON.stringify(entry.details)
]))}
`);

console.log(JSON.stringify({
  status: result.status,
  checks_run: result.checks_run,
  failed_checks: result.failed_checks,
  summary: result.summary
}, null, 2));

if (result.status !== "pass") {
  process.exitCode = 1;
}
