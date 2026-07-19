import fs from "node:fs";
import vm from "node:vm";
import {
  compareTeamBuilderSummaryToGolden,
  getTeamBuilderBenchNames,
  getTeamBuilderBudgetSummary,
  getTeamBuilderCaptainSummary,
  getTeamBuilderFixtureCounts,
  getTeamBuilderObjectiveSummary,
  getTeamBuilderRulesConfig,
  getTeamBuilderSelectedPlayerNames,
  getTeamBuilderStarterNames,
  getTeamBuilderTeamCounts,
  summarizeTeamBuilderArtifact
} from "./lib/teamBuilderPublicModel.mjs";
import {
  manifestFile,
  manifestWrapper,
  projectPath,
  readActiveStageManifest
} from "./lib/readActiveStageManifest.mjs";

const generatedAt = new Date().toISOString();
const goldenPath = "data/teamBuilderGoldenFinalRound_v1.json";
const outputPath = "data/teamBuilderSharedModelHelpersQa_v1.json";
const reportPath = "data/teamBuilderSharedModelHelpersQaReport_v1.md";
const tolerances = {
  rawProjectedPoints: 0.001,
  optionalityScore: 0.001,
  compositeScore: 0.01
};

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(projectPath(relativePath), "utf8"));
}

function writeJson(relativePath, value) {
  fs.writeFileSync(projectPath(relativePath), `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(relativePath, value) {
  fs.writeFileSync(projectPath(relativePath), value);
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

function numericMatch(actual, expected, tolerance) {
  return Math.abs(Number(actual) - Number(expected)) <= tolerance;
}

function check(id, passed, details = {}) {
  return { id, status: passed ? "pass" : "fail", details };
}

function parseBrowserHelpers(relativePath) {
  const source = fs.readFileSync(projectPath(relativePath), "utf8");
  const sandbox = { window: {} };
  vm.runInNewContext(source, sandbox, { filename: relativePath, timeout: 1000 });
  return sandbox.window.TEAM_BUILDER_PUBLIC_HELPERS || {};
}

const manifest = readActiveStageManifest();
const artifactPath = manifestFile(manifest, "teamBuilderArtifact");
const rulesPath = manifestFile(manifest, "rules");
const wrapperPath = manifestWrapper(manifest, "teamBuilderPublicHelpers");
const artifact = readJson(artifactPath);
const rules = readJson(rulesPath);
const golden = readJson(goldenPath);
const artifactBefore = JSON.stringify(artifact);
const summary = summarizeTeamBuilderArtifact(artifact);
const summaryAgain = summarizeTeamBuilderArtifact(artifact);
const artifactAfter = JSON.stringify(artifact);
const comparison = compareTeamBuilderSummaryToGolden(summary, golden, tolerances);
const browserHelpers = parseBrowserHelpers(wrapperPath);
const browserSummary = browserHelpers.summarizeTeamBuilderArtifact(artifact);
const rulesConfig = getTeamBuilderRulesConfig({ rules, artifact, activeStage: manifest.activeStage });
const browserRulesConfig = typeof browserHelpers.getTeamBuilderRulesConfig === "function"
  ? browserHelpers.getTeamBuilderRulesConfig({ rules, artifact, activeStage: manifest.activeStage })
  : null;
let malformedError = "";

try {
  summarizeTeamBuilderArtifact({ schema_version: "bad" });
} catch (error) {
  malformedError = String(error?.message || error);
}

const checks = [
  check("budget_summary_equals_golden", numericMatch(getTeamBuilderBudgetSummary(artifact).used, golden.budgetUsed, 0.001) &&
    numericMatch(getTeamBuilderBudgetSummary(artifact).limit, golden.budgetLimit, 0.001), {
    helper: getTeamBuilderBudgetSummary(artifact),
    golden: { used: golden.budgetUsed, limit: golden.budgetLimit }
  }),
  check("team_counts_equal_golden", sameJson(getTeamBuilderTeamCounts(artifact), golden.teamCounts), {
    helper: getTeamBuilderTeamCounts(artifact),
    golden: golden.teamCounts
  }),
  check("fixture_counts_equal_golden", sameJson(getTeamBuilderFixtureCounts(artifact), golden.fixtureCounts), {
    helper: getTeamBuilderFixtureCounts(artifact),
    golden: golden.fixtureCounts
  }),
  check("captain_vice_equal_golden", getTeamBuilderCaptainSummary(artifact).captain === golden.captain &&
    getTeamBuilderCaptainSummary(artifact).viceCaptain === golden.viceCaptain, {
    helper: getTeamBuilderCaptainSummary(artifact),
    golden: { captain: golden.captain, viceCaptain: golden.viceCaptain }
  }),
  check("selected_player_names_equal_golden", sameJson(getTeamBuilderSelectedPlayerNames(artifact), golden.selectedPlayers.map((row) => row.name)), {
    helper: getTeamBuilderSelectedPlayerNames(artifact),
    golden: golden.selectedPlayers.map((row) => row.name)
  }),
  check("starter_names_equal_golden", sameJson(getTeamBuilderStarterNames(artifact), golden.starters.map((row) => row.name)), {
    helper: getTeamBuilderStarterNames(artifact),
    golden: golden.starters.map((row) => row.name)
  }),
  check("bench_names_equal_golden", sameJson(getTeamBuilderBenchNames(artifact), golden.bench.map((row) => row.name)), {
    helper: getTeamBuilderBenchNames(artifact),
    golden: golden.bench.map((row) => row.name)
  }),
  check("raw_projected_equals_golden", numericMatch(getTeamBuilderObjectiveSummary(artifact).rawProjectedPoints, golden.rawProjectedPoints, tolerances.rawProjectedPoints), {
    helper: getTeamBuilderObjectiveSummary(artifact).rawProjectedPoints,
    golden: golden.rawProjectedPoints
  }),
  check("optionality_equals_golden", numericMatch(getTeamBuilderObjectiveSummary(artifact).optionalityScore, golden.optionalityScore, tolerances.optionalityScore), {
    helper: getTeamBuilderObjectiveSummary(artifact).optionalityScore,
    golden: golden.optionalityScore
  }),
  check("composite_equals_golden", numericMatch(getTeamBuilderObjectiveSummary(artifact).compositeScore, golden.compositeScore, tolerances.compositeScore), {
    helper: getTeamBuilderObjectiveSummary(artifact).compositeScore,
    golden: golden.compositeScore
  }),
  check("compare_summary_to_golden_passes", comparison.status === "pass", comparison.checks),
  check("helper_output_deterministic", sameJson(summary, summaryAgain), {
    first: summary,
    second: summaryAgain
  }),
  check("helper_does_not_mutate_input_artifact", artifactBefore === artifactAfter, {}),
  check("malformed_artifact_rejected_with_useful_error", /invalid team builder artifact/i.test(malformedError), {
    malformedError
  }),
  check("browser_wrapper_exposes_shared_helpers", [
    "summarizeTeamBuilderArtifact",
    "getTeamBuilderBudgetSummary",
    "getTeamBuilderTeamCounts",
    "getTeamBuilderFixtureCounts",
    "getTeamBuilderCaptainSummary",
    "getTeamBuilderObjectiveSummary",
    "compareTeamBuilderSummaryToGolden",
    "getTeamBuilderRulesConfig",
    "getTeamBuilderBudgetLimit",
    "getTeamBuilderCountryLimit",
    "validateTeamBuilderRulesConfig"
  ].every((key) => typeof browserHelpers[key] === "function"), {
    exportedKeys: Object.keys(browserHelpers).sort()
  }),
  check("browser_wrapper_summary_matches_module_summary", sameJson(browserSummary, summary), {
    browserSummary,
    moduleSummary: summary
  }),
  check("rules_config_matches_golden_values", rulesConfig.budget.limit === golden.budgetLimit &&
    rulesConfig.countryLimit.limit === artifact.constraintsUsed?.country_limit &&
    rulesConfig.squad.totalPlayers === golden.selectedPlayers.length &&
    rulesConfig.starterBench.starterSize === golden.starters.length &&
    rulesConfig.starterBench.benchSize === golden.bench.length, {
    budgetLimit: rulesConfig.budget.limit,
    countryLimit: rulesConfig.countryLimit.limit,
    squadSize: rulesConfig.squad.totalPlayers
  }),
  check("browser_wrapper_rules_config_matches_module", sameJson(browserRulesConfig, rulesConfig), {
    browserRulesConfig,
    moduleRulesConfig: rulesConfig
  })
];

const failed = checks.filter((entry) => entry.status !== "pass");
const report = {
  schema_version: "team_builder_shared_model_helpers_qa_v1",
  generated_at: generatedAt,
  status: failed.length ? "fail" : "pass",
  activeStage: manifest.activeStage,
  artifactPath,
  rulesPath,
  browserHelperWrapperPath: wrapperPath,
  summary,
  rulesConfig,
  comparison,
  checks
};

writeJson(outputPath, report);
writeText(reportPath, `# Team Builder Shared Model Helpers QA v1

Generated: ${generatedAt}

Status: **${report.status}**

## Summary

${mdTable(["Metric", "Value"], [
  ["Active stage", manifest.activeStage],
  ["Artifact", artifactPath],
  ["Rules", rulesPath],
  ["Browser helper wrapper", wrapperPath],
  ["Budget", summary.budget.display],
  ["Rules budget limit", rulesConfig.budget.limit],
  ["Rules budget source", rulesConfig.budget.detail.source],
  ["Rules country/team cap", rulesConfig.countryLimit.limit],
  ["Rules country/team cap source", rulesConfig.countryLimit.detail.source],
  ["Rules source", rulesConfig.sourceClassification],
  ["Captain", summary.captain.captain],
  ["Vice captain", summary.captain.viceCaptain],
  ["Raw projected", summary.objective.rawProjectedPoints],
  ["Optionality", summary.objective.optionalityScore],
  ["Composite", summary.objective.compositeScore]
])}

## Checks

${mdTable(["Check", "Status"], checks.map((entry) => [entry.id, entry.status]))}
`);

if (failed.length) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  status: report.status,
  checksRun: checks.length,
  outputJson: outputPath,
  outputReport: reportPath
}, null, 2));
