import fs from "node:fs";
import vm from "node:vm";
import {
  assertNoEliminatedActiveCandidates,
  compareTeamBuilderSummaryToGolden,
  eligibleTeamKeysFromFixtureAuthority,
  getFixtureAuthorityEligibleTeams,
  getTeamBuilderBudgetFeasibility,
  getTeamBuilderCaptainViceValidation,
  getTeamBuilderFixtureCounts,
  getTeamBuilderPositionCounts,
  getTeamBuilderRulesConfig,
  getTeamBuilderSquadConstraintSummary,
  getTeamBuilderTeamCounts,
  normalizeTeamBuilderPositionCode,
  summarizeTeamBuilderArtifact,
  validateTeamBuilderSelectedSquadConstraints
} from "./lib/teamBuilderPublicModel.mjs";
import {
  manifestFile,
  manifestWrapper,
  projectPath,
  readActiveStageManifest
} from "./lib/readActiveStageManifest.mjs";

const generatedAt = new Date().toISOString();
const outputPath = "data/teamBuilderOptimizerUtilitiesQa_v1.json";
const reportPath = "data/teamBuilderOptimizerUtilitiesQaReport_v1.md";

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(projectPath(relativePath), "utf8"));
}

function writeJson(relativePath, value) {
  fs.writeFileSync(projectPath(relativePath), `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(relativePath, value) {
  fs.writeFileSync(projectPath(relativePath), value);
}

function parseWrapper(relativePath, globalName) {
  const source = fs.readFileSync(projectPath(relativePath), "utf8");
  const sandbox = { window: {} };
  vm.runInNewContext(source, sandbox, { filename: relativePath, timeout: 1000 });
  return sandbox.window[globalName];
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

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function countBy(rows = [], field) {
  return rows.reduce((counts, row) => {
    const key = row?.[field] || "unknown";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

const manifest = readActiveStageManifest();
const artifact = readJson(manifestFile(manifest, "teamBuilderArtifact"));
const golden = readJson("data/teamBuilderGoldenFinalRound_v1.json");
const rules = readJson(manifestFile(manifest, "rules"));
const fixtureAuthority = readJson(manifestFile(manifest, "finalRoundFixtureAuthority"));
const browserHelpers = parseWrapper(manifestWrapper(manifest, "teamBuilderPublicHelpers"), "TEAM_BUILDER_PUBLIC_HELPERS") || {};
const eligibleTeamKeys = eligibleTeamKeysFromFixtureAuthority(fixtureAuthority);
const eligibleTeams = getFixtureAuthorityEligibleTeams(fixtureAuthority);
const rulesConfig = getTeamBuilderRulesConfig({ rules, artifact, activeStage: manifest.activeStage });
const rulesOptions = {
  squadSize: rulesConfig.squad.totalPlayers,
  budgetLimit: rulesConfig.budget.limit,
  positionRequirements: rulesConfig.squad.positionRequirementsByCode,
  expectedTeamCounts: golden.teamCounts,
  expectedFixtureCounts: golden.fixtureCounts,
  countryLimit: rulesConfig.countryLimit.limit
};
const beforeArtifact = JSON.stringify(artifact);
const beforeFixtureAuthority = JSON.stringify(fixtureAuthority);
const summary = summarizeTeamBuilderArtifact(artifact);
const goldenComparison = compareTeamBuilderSummaryToGolden(summary, golden);
const constraintSummary = getTeamBuilderSquadConstraintSummary(artifact);
const constraints = validateTeamBuilderSelectedSquadConstraints(artifact, rulesOptions);
const captain = getTeamBuilderCaptainViceValidation(artifact);
const budget = getTeamBuilderBudgetFeasibility(artifact, { budgetLimit: rulesConfig.budget.limit });
const positionCounts = getTeamBuilderPositionCounts(artifact);
const deterministicLeft = validateTeamBuilderSelectedSquadConstraints(clone(artifact), rulesOptions);
const deterministicRight = validateTeamBuilderSelectedSquadConstraints(clone(artifact), rulesOptions);
const browserConstraintSummary = typeof browserHelpers.getTeamBuilderSquadConstraintSummary === "function"
  ? browserHelpers.getTeamBuilderSquadConstraintSummary(artifact)
  : null;
const browserConstraints = typeof browserHelpers.validateTeamBuilderSelectedSquadConstraints === "function"
  ? browserHelpers.validateTeamBuilderSelectedSquadConstraints(artifact, rulesOptions)
  : null;
const browserRulesConfig = typeof browserHelpers.getTeamBuilderRulesConfig === "function"
  ? browserHelpers.getTeamBuilderRulesConfig({ rules, artifact, activeStage: manifest.activeStage })
  : null;
let malformedRowsError = "";
let malformedBudgetError = "";

try {
  getTeamBuilderSquadConstraintSummary({ selectedSquad: null });
} catch (error) {
  malformedRowsError = String(error?.message || error);
}

try {
  getTeamBuilderBudgetFeasibility([{ name: "No Limit", price: 1 }]);
} catch (error) {
  malformedBudgetError = String(error?.message || error);
}

assertNoEliminatedActiveCandidates(artifact.selectedSquad, {
  activeStage: manifest.activeStage,
  eligibleTeamKeys,
  projectionResolver: () => ({ matchday: manifest.activeStage })
});

const checks = [
  check("rules_config_matches_golden_values", rulesConfig.budget.limit === golden.budgetLimit &&
    rulesConfig.countryLimit.limit === artifact.constraintsUsed?.country_limit &&
    rulesConfig.squad.totalPlayers === golden.selectedPlayers.length &&
    rulesConfig.starterBench.starterSize === golden.starters.length &&
    rulesConfig.starterBench.benchSize === golden.bench.length, {
    budgetLimit: rulesConfig.budget.limit,
    countryLimit: rulesConfig.countryLimit.limit,
    squadSize: rulesConfig.squad.totalPlayers
  }),
  check("browser_rules_config_matches_module", sameJson(browserRulesConfig, rulesConfig), { browserHelperAvailable: Boolean(browserRulesConfig) }),
  check("golden_squad_satisfies_budget_limit", budget.isWithinBudget, budget),
  check("golden_squad_budget_used_matches", Math.abs(budget.used - golden.budgetUsed) <= 0.001, { used: budget.used, expected: golden.budgetUsed }),
  check("golden_squad_team_counts_match", sameJson(getTeamBuilderTeamCounts(artifact), golden.teamCounts), { actual: getTeamBuilderTeamCounts(artifact), expected: golden.teamCounts }),
  check("golden_squad_fixture_counts_match", sameJson(getTeamBuilderFixtureCounts(artifact), golden.fixtureCounts), { actual: getTeamBuilderFixtureCounts(artifact), expected: golden.fixtureCounts }),
  check("golden_squad_position_counts_match", sameJson(positionCounts, artifact.constraintsUsed?.position_requirements), { actual: positionCounts, expected: artifact.constraintsUsed?.position_requirements }),
  check("golden_squad_captain_vice_valid", constraints.checks.captain_vice_valid, captain),
  check("golden_squad_has_no_eliminated_active_players", true, { eligibleTeams }),
  check("utility_functions_are_deterministic", sameJson(deterministicLeft, deterministicRight), { leftStatus: deterministicLeft.status, rightStatus: deterministicRight.status }),
  check("utility_functions_do_not_mutate_inputs", beforeArtifact === JSON.stringify(artifact) && beforeFixtureAuthority === JSON.stringify(fixtureAuthority), {}),
  check("malformed_rows_fail_with_useful_error", /selectedSquad array|squad row array/i.test(malformedRowsError), { malformedRowsError }),
  check("malformed_budget_fails_with_useful_error", /budget limit/i.test(malformedBudgetError), { malformedBudgetError }),
  check("helper_output_matches_artifact_summary", constraints.status === "pass" && goldenComparison.status === "pass", { constraintStatus: constraints.status, goldenComparisonStatus: goldenComparison.status }),
  check("browser_helper_summary_matches_module", sameJson(browserConstraintSummary, constraintSummary), { browserHelperAvailable: Boolean(browserConstraintSummary) }),
  check("browser_helper_constraints_match_module", sameJson(browserConstraints, constraints), { browserHelperAvailable: Boolean(browserConstraints) }),
  check("position_normalizer_handles_display_and_code_values", normalizeTeamBuilderPositionCode("Goalkeeper") === "GK" && normalizeTeamBuilderPositionCode("MID") === "MID", {}),
  check("summary_counts_match_existing_artifact_counts", sameJson(constraintSummary.teamCounts, artifact.summary.selected_count_by_team) && sameJson(constraintSummary.fixtureCounts, artifact.summary.selected_count_by_fixture), {
    teamCounts: constraintSummary.teamCounts,
    fixtureCounts: constraintSummary.fixtureCounts
  })
];

const failedChecks = checks.filter((entry) => entry.status !== "pass");
const result = {
  schema_version: "team_builder_optimizer_utilities_qa_v1",
  generated_at: generatedAt,
  status: failedChecks.length ? "fail" : "pass",
  checks_run: checks.length,
  checks,
  summary: {
    budget,
    positionCounts,
    teamCounts: constraintSummary.teamCounts,
    fixtureCounts: constraintSummary.fixtureCounts,
    captain: captain.captain,
    viceCaptain: captain.viceCaptain,
    selectedCount: constraintSummary.selectedCount,
    selectedCountByTeamFromRows: countBy(artifact.selectedSquad, "country"),
    selectedCountByFixtureFromRows: countBy(artifact.selectedSquad, "fixture_stage"),
    eligibleTeams,
    rulesSource: rulesConfig.sourceClassification,
    budgetLimitSource: rulesConfig.budget.detail.source,
    squadSizeSource: rulesConfig.squad.detail.source,
    positionRulesSource: rulesConfig.squad.detail.source,
    countryLimitSource: rulesConfig.countryLimit.detail.source,
    captainRuleSource: rulesConfig.captain.source,
    optimizerBehaviorChanged: false,
    scriptJsWiredIntoOptimizerLoop: false
  },
  failed_checks: failedChecks.map((entry) => entry.id)
};

const report = `# Team Builder Optimizer Utilities QA v1

Generated: ${generatedAt}

Status: **${result.status}**

## Summary

${mdTable(["Item", "Value"], [
  ["Checks run", checks.length],
  ["Budget", budget.display],
  ["Selected count", constraintSummary.selectedCount],
  ["Team counts", Object.entries(constraintSummary.teamCounts).map(([team, count]) => `${team} ${count}`).join(", ")],
  ["Fixture counts", Object.entries(constraintSummary.fixtureCounts).map(([fixture, count]) => `${fixture} ${count}`).join(", ")],
  ["Captain", captain.captain],
  ["Vice captain", captain.viceCaptain],
  ["Rules source", rulesConfig.sourceClassification],
  ["Budget limit source", rulesConfig.budget.detail.source],
  ["Squad size source", rulesConfig.squad.detail.source],
  ["Position rules source", rulesConfig.squad.detail.source],
  ["Country/team cap source", rulesConfig.countryLimit.detail.source],
  ["Captain/vice rule source", rulesConfig.captain.source],
  ["Optimizer behavior changed", "no"],
  ["Script optimizer loop wired", "no"]
])}

## Checks

${mdTable(["ID", "Status"], checks.map((entry) => [entry.id, entry.status]))}

## Notes

These utilities validate the selected squad constraints and artifact summaries only. They do not select, score, rank, reorder, lock, exclude, or mutate Team Builder candidates.
`;

writeJson(outputPath, result);
writeText(reportPath, report);

console.log(JSON.stringify({
  status: result.status,
  checksRun: result.checks_run,
  budget: budget.display,
  outputJson: outputPath,
  outputReport: reportPath
}, null, 2));

if (result.status !== "pass") {
  process.exitCode = 1;
}
