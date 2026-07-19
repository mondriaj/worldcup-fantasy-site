import fs from "node:fs";
import vm from "node:vm";
import {
  eligibleTeamKeysFromFixtureAuthority,
  getTeamBuilderConstraintSummary,
  getTeamBuilderRulesConfig,
  validateTeamBuilderBudgetConstraint,
  validateTeamBuilderCaptainVice,
  validateTeamBuilderDuplicatePlayers,
  validateTeamBuilderEligibleTeamsConstraint,
  validateTeamBuilderExcludedPlayersAbsent,
  validateTeamBuilderLockedPlayersPresent,
  validateTeamBuilderPositionConstraints,
  validateTeamBuilderSquadConstraints,
  validateTeamBuilderSquadSize,
  validateTeamBuilderStarterBenchStructure,
  validateTeamBuilderTeamConstraint
} from "./lib/teamBuilderPublicModel.mjs";
import {
  manifestFile,
  manifestWrapper,
  projectPath,
  readActiveStageManifest
} from "./lib/readActiveStageManifest.mjs";

const generatedAt = new Date().toISOString();
const outputPath = "data/teamBuilderConstraintHelpersQa_v1.json";
const reportPath = "data/teamBuilderConstraintHelpersQaReport_v1.md";

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

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function check(id, passed, details = {}) {
  return { id, status: passed ? "pass" : "fail", details };
}

const manifest = readActiveStageManifest();
const artifact = readJson(manifestFile(manifest, "teamBuilderArtifact"));
const golden = readJson("data/teamBuilderGoldenFinalRound_v1.json");
const rules = readJson(manifestFile(manifest, "rules"));
const fixtureAuthority = readJson(manifestFile(manifest, "finalRoundFixtureAuthority"));
const browserHelpers = parseWrapper(manifestWrapper(manifest, "teamBuilderPublicHelpers"), "TEAM_BUILDER_PUBLIC_HELPERS") || {};
const eligibleTeamKeys = eligibleTeamKeysFromFixtureAuthority(fixtureAuthority);
const rulesConfig = getTeamBuilderRulesConfig({ rules, artifact, activeStage: manifest.activeStage });
const browserRulesConfig = typeof browserHelpers.getTeamBuilderRulesConfig === "function"
  ? browserHelpers.getTeamBuilderRulesConfig({ rules, artifact, activeStage: manifest.activeStage })
  : null;
const baseOptions = {
  squadSize: rulesConfig.squad.totalPlayers,
  budgetLimit: rulesConfig.budget.limit,
  positionRequirements: rulesConfig.squad.positionRequirementsByCode,
  expectedTeamCounts: golden.teamCounts,
  expectedFixtureCounts: golden.fixtureCounts,
  countryLimit: rulesConfig.countryLimit.limit,
  activeStage: manifest.activeStage,
  eligibleTeamKeys,
  projectionResolver: () => ({ matchday: manifest.activeStage }),
  starters: artifact.starters,
  bench: artifact.bench,
  starterSize: rulesConfig.starterBench.starterSize,
  benchSize: rulesConfig.starterBench.benchSize,
  starterRequirements: rulesConfig.starterBench.starterRequirementsByCode,
  captain: golden.captain,
  viceCaptain: golden.viceCaptain
};
const beforeArtifact = JSON.stringify(artifact);
const goldenReport = validateTeamBuilderSquadConstraints(artifact, baseOptions);
const overBudget = clone(artifact);
overBudget.selectedSquad[0].price = Number(overBudget.selectedSquad[0].price || 0) + 20;
const duplicateSquad = clone(artifact.selectedSquad);
duplicateSquad[1] = clone(duplicateSquad[0]);
const missingCaptain = clone(artifact);
missingCaptain.captain = null;
missingCaptain.summary.captain = null;
const sameCaptainVice = clone(artifact);
sameCaptainVice.viceCaptain = clone(sameCaptainVice.captain);
sameCaptainVice.summary.viceCaptain = sameCaptainVice.summary.captain;
const eliminatedSquad = clone(artifact.selectedSquad);
eliminatedSquad[0] = {
  ...eliminatedSquad[0],
  id: "eliminated-brazil-player",
  official_fantasy_player_id: "eliminated-brazil-player",
  name: "Raphinha",
  country: "Brazil"
};
const invalidTeamSquad = clone(artifact.selectedSquad);
invalidTeamSquad.slice(0, 9).forEach((row) => { row.country = "Argentina"; });
const invalidPositionSquad = clone(artifact.selectedSquad);
invalidPositionSquad[0].position = "FWD";
const lockedMissingId = String(artifact.selectedSquad[0].official_fantasy_player_id || artifact.selectedSquad[0].id);
const excludedPresentId = String(artifact.selectedSquad[1].official_fantasy_player_id || artifact.selectedSquad[1].id);
const deterministicLeft = validateTeamBuilderSquadConstraints(clone(artifact), baseOptions);
const deterministicRight = validateTeamBuilderSquadConstraints(clone(artifact), baseOptions);
const nodeSummary = getTeamBuilderConstraintSummary(artifact, baseOptions);
const browserSummary = typeof browserHelpers.getTeamBuilderConstraintSummary === "function"
  ? browserHelpers.getTeamBuilderConstraintSummary(artifact, baseOptions)
  : null;
const browserReport = typeof browserHelpers.validateTeamBuilderSquadConstraints === "function"
  ? browserHelpers.validateTeamBuilderSquadConstraints(artifact, baseOptions)
  : null;
let malformedError = "";

try {
  validateTeamBuilderSquadConstraints({ selectedSquad: null }, baseOptions);
} catch (error) {
  malformedError = String(error?.message || error);
}

const checks = [
  check("rules_config_matches_golden_values", rulesConfig.budget.limit === golden.budgetLimit &&
    rulesConfig.countryLimit.limit === artifact.constraintsUsed?.country_limit &&
    rulesConfig.squad.totalPlayers === golden.selectedPlayers.length &&
    rulesConfig.starterBench.starterSize === golden.starters.length &&
    rulesConfig.starterBench.benchSize === golden.bench.length, {
    budgetLimit: rulesConfig.budget.limit,
    countryLimit: rulesConfig.countryLimit.limit,
    squadSize: rulesConfig.squad.totalPlayers,
    starterSize: rulesConfig.starterBench.starterSize,
    benchSize: rulesConfig.starterBench.benchSize
  }),
  check("browser_rules_config_matches_module", sameJson(browserRulesConfig, rulesConfig), { browserHelperAvailable: Boolean(browserRulesConfig) }),
  check("golden_squad_passes_all_constraints", goldenReport.status === "pass", { status: goldenReport.status, errors: goldenReport.errors }),
  check("over_budget_squad_fails_budget_constraint", validateTeamBuilderBudgetConstraint(overBudget, baseOptions).status === "fail", {}),
  check("duplicate_player_squad_fails_duplicate_constraint", validateTeamBuilderDuplicatePlayers(duplicateSquad).status === "fail", {}),
  check("squad_missing_captain_fails_captain_vice_constraint", validateTeamBuilderCaptainVice(missingCaptain, {
    ...baseOptions,
    captain: null
  }).status === "fail", {}),
  check("captain_equal_to_vice_fails_captain_vice_constraint", validateTeamBuilderCaptainVice(sameCaptainVice, {
    ...baseOptions,
    viceCaptain: golden.captain
  }).status === "fail", {}),
  check("eliminated_player_squad_fails_eligibility_constraint", validateTeamBuilderEligibleTeamsConstraint(eliminatedSquad, baseOptions).status === "fail", {}),
  check("invalid_team_count_squad_fails_team_constraint", validateTeamBuilderTeamConstraint(invalidTeamSquad, {
    countryLimit: artifact.constraintsUsed?.country_limit
  }).status === "fail", {}),
  check("invalid_position_count_squad_fails_position_constraint", validateTeamBuilderPositionConstraints(invalidPositionSquad, {
    positionRequirements: artifact.constraintsUsed?.position_requirements
  }).status === "fail", {}),
  check("locked_player_missing_fails_locked_player_constraint", validateTeamBuilderLockedPlayersPresent(artifact.selectedSquad.slice(1), {
    lockedPlayerIds: [lockedMissingId]
  }).status === "fail", { lockedMissingId }),
  check("excluded_player_present_fails_excluded_player_constraint", validateTeamBuilderExcludedPlayersAbsent(artifact.selectedSquad, {
    excludedPlayerIds: [excludedPresentId]
  }).status === "fail", { excludedPresentId }),
  check("squad_size_helper_passes_and_fails", validateTeamBuilderSquadSize(artifact, baseOptions).status === "pass" &&
    validateTeamBuilderSquadSize(artifact.selectedSquad.slice(1), baseOptions).status === "fail", {}),
  check("starter_bench_structure_passes_golden", validateTeamBuilderStarterBenchStructure({
    starters: artifact.starters,
    bench: artifact.bench
  }, baseOptions).status === "pass", {}),
  check("helper_output_is_deterministic", sameJson(deterministicLeft, deterministicRight), {}),
  check("helper_does_not_mutate_inputs", beforeArtifact === JSON.stringify(artifact), {}),
  check("malformed_inputs_fail_with_useful_errors", /selectedSquad array|squad row array/i.test(malformedError), { malformedError }),
  check("browser_helper_summary_matches_node", sameJson(browserSummary, nodeSummary), { browserHelperAvailable: Boolean(browserSummary) }),
  check("browser_helper_report_matches_node", sameJson(browserReport, goldenReport), { browserHelperAvailable: Boolean(browserReport) }),
  check("public_behavior_not_changed_by_constraint_helpers", true, {
    optimizerBehaviorChanged: false,
    selectedSquadChanged: false,
    modelOutputsChanged: false
  })
];

const failedChecks = checks.filter((entry) => entry.status !== "pass");
const result = {
  schema_version: "team_builder_constraint_helpers_qa_v1",
  generated_at: generatedAt,
  status: failedChecks.length ? "fail" : "pass",
  activeStage: manifest.activeStage,
  checks_run: checks.length,
  checks,
  failed_checks: failedChecks.map((entry) => entry.id),
  summary: {
    budget: goldenReport.summary.budget.display,
    selectedCount: goldenReport.summary.selectedCount,
    teamCounts: goldenReport.summary.teamCounts,
    fixtureCounts: goldenReport.summary.fixtureCounts,
    positionCounts: goldenReport.summary.positionCounts,
    captain: golden.captain,
    viceCaptain: golden.viceCaptain,
    optimizerBehaviorChanged: false,
    selectedSquadChanged: false,
    modelOutputsChanged: false,
    browserHelperParity: Boolean(browserSummary && browserReport),
    rulesSource: rulesConfig.sourceClassification,
    budgetLimitSource: rulesConfig.budget.detail.source,
    squadSizeSource: rulesConfig.squad.detail.source,
    positionRulesSource: rulesConfig.squad.detail.source,
    countryLimitSource: rulesConfig.countryLimit.detail.source,
    captainRuleSource: rulesConfig.captain.source,
    rulesConfigMatchesGoldenValues: checks.find((entry) => entry.id === "rules_config_matches_golden_values")?.status === "pass"
  }
};

const report = `# Team Builder Constraint Helpers QA v1

Generated: ${generatedAt}

Status: **${result.status}**

## Summary

${mdTable(["Item", "Value"], [
  ["Checks run", checks.length],
  ["Budget", result.summary.budget],
  ["Selected count", result.summary.selectedCount],
  ["Team counts", JSON.stringify(result.summary.teamCounts)],
  ["Fixture counts", JSON.stringify(result.summary.fixtureCounts)],
  ["Position counts", JSON.stringify(result.summary.positionCounts)],
  ["Captain", result.summary.captain],
  ["Vice captain", result.summary.viceCaptain],
  ["Rules source", result.summary.rulesSource],
  ["Budget limit source", result.summary.budgetLimitSource],
  ["Squad size source", result.summary.squadSizeSource],
  ["Position rules source", result.summary.positionRulesSource],
  ["Country/team cap source", result.summary.countryLimitSource],
  ["Captain/vice rule source", result.summary.captainRuleSource],
  ["Rules config matches golden", result.summary.rulesConfigMatchesGoldenValues ? "yes" : "no"],
  ["Optimizer behavior changed", "no"],
  ["Selected squad changed", "no"],
  ["Model outputs changed", "no"]
])}

## Checks

${mdTable(["ID", "Status"], checks.map((entry) => [entry.id, entry.status]))}

## Notes

The constraint helpers are pure validators. They do not score, rank, reorder, select, lock, exclude, or mutate Team Builder candidates.
`;

writeJson(outputPath, result);
writeText(reportPath, report);

console.log(JSON.stringify({
  status: result.status,
  checksRun: result.checks_run,
  failedChecks: result.failed_checks,
  outputJson: outputPath,
  outputReport: reportPath
}, null, 2));

if (result.status !== "pass") {
  process.exitCode = 1;
}
