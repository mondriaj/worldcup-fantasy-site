import fs from "node:fs";
import vm from "node:vm";
import {
  getTeamBuilderBudgetFeasibility,
  getTeamBuilderBudgetLimit,
  getTeamBuilderCaptainRules,
  getTeamBuilderCountryLimit,
  getTeamBuilderFormationRules,
  getTeamBuilderLockRemovalRules,
  getTeamBuilderPositionRules,
  getTeamBuilderRulesConfig,
  getTeamBuilderSquadSizeRules,
  getTeamBuilderStarterBenchRules,
  validateTeamBuilderCaptainVice,
  validateTeamBuilderPositionConstraints,
  validateTeamBuilderRulesConfig,
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
const outputPath = "data/teamBuilderRulesHelpersQa_v1.json";
const reportPath = "data/teamBuilderRulesHelpersQaReport_v1.md";

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

function mdTable(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((value) => String(value ?? "").replace(/\|/g, "\\|")).join(" | ")} |`)
  ].join("\n");
}

function check(id, passed, details = {}) {
  return { id, status: passed ? "pass" : "fail", details };
}

const manifest = readActiveStageManifest();
const rulesPath = manifestFile(manifest, "rules");
const artifactPath = manifestFile(manifest, "teamBuilderArtifact");
const wrapperPath = manifestWrapper(manifest, "teamBuilderPublicHelpers");
const rules = readJson(rulesPath);
const artifact = readJson(artifactPath);
const golden = readJson("data/teamBuilderGoldenFinalRound_v1.json");
const browserHelpers = parseWrapper(wrapperPath, "TEAM_BUILDER_PUBLIC_HELPERS") || {};
const input = { rules, artifact, activeStage: manifest.activeStage };
const beforeRules = JSON.stringify(rules);
const beforeArtifact = JSON.stringify(artifact);
const rulesConfig = getTeamBuilderRulesConfig(input);
const rulesConfigAgain = getTeamBuilderRulesConfig(clone(input));
const browserRulesConfig = typeof browserHelpers.getTeamBuilderRulesConfig === "function"
  ? browserHelpers.getTeamBuilderRulesConfig(input)
  : null;
const squadSizeRules = getTeamBuilderSquadSizeRules(rulesConfig);
const positionRules = getTeamBuilderPositionRules(rulesConfig);
const formationRules = getTeamBuilderFormationRules(rulesConfig);
const captainRules = getTeamBuilderCaptainRules(rulesConfig);
const starterBenchRules = getTeamBuilderStarterBenchRules(rulesConfig);
const lockRemovalRules = getTeamBuilderLockRemovalRules(rulesConfig);
const budget = getTeamBuilderBudgetFeasibility(artifact, { budgetLimit: getTeamBuilderBudgetLimit(rulesConfig) });
const positionValidation = validateTeamBuilderPositionConstraints(artifact, {
  positionRequirements: positionRules.positionRequirementsByCode
});
const starterBenchValidation = validateTeamBuilderStarterBenchStructure({
  starters: artifact.starters,
  bench: artifact.bench
}, {
  starterSize: starterBenchRules.starterSize,
  benchSize: starterBenchRules.benchSize,
  starterRequirements: starterBenchRules.starterRequirementsByCode
});
const captainValidation = validateTeamBuilderCaptainVice(artifact, {
  captain: golden.captain,
  viceCaptain: golden.viceCaptain
});
const teamLimitValidation = validateTeamBuilderTeamConstraint(artifact, {
  countryLimit: getTeamBuilderCountryLimit(rulesConfig),
  expectedTeamCounts: golden.teamCounts
});
const malformedRules = clone(rules);
delete malformedRules.budget.initial_budget;
const malformedValidation = validateTeamBuilderRulesConfig({
  rules: malformedRules,
  artifact,
  activeStage: manifest.activeStage
});
const failedConfigValidation = validateTeamBuilderRulesConfig({
  schema_version: "team_builder_rules_config_v1",
  sourceClassification: "",
  budget: { limit: -1 },
  squad: { totalPlayers: 15, positionRequirements: { Goalkeeper: 2 } },
  starterBench: { starterSize: 11, starterRequirements: { Goalkeeper: 1 } },
  countryLimit: { limit: 0 },
  warnings: []
});

const checks = [
  check("final_round_budget_limit_equals_105", rulesConfig.budget.limit === 105, {
    budgetLimit: rulesConfig.budget.limit,
    source: rulesConfig.budget.detail.source
  }),
  check("golden_squad_budget_used_remains_94_8", Math.abs(budget.used - 94.8) <= 0.001, budget),
  check("golden_squad_passes_squad_size_rules", validateTeamBuilderSquadSize(artifact, {
    squadSize: squadSizeRules.totalPlayers
  }).status === "pass", squadSizeRules),
  check("golden_squad_passes_starter_bench_rules", starterBenchValidation.status === "pass", starterBenchValidation),
  check("golden_squad_passes_position_rules", positionValidation.status === "pass", positionValidation),
  check("golden_squad_passes_captain_vice_rules", captainValidation.status === "pass" &&
    captainRules.captainRequired &&
    captainRules.viceCaptainRequired &&
    captainRules.captainMustDifferFromVice &&
    captainRules.goalkeeperAllowed === false, {
    captainRules,
    captainValidation
  }),
  check("team_country_limit_matches_current_implementation", getTeamBuilderCountryLimit(rulesConfig) === 8 &&
    teamLimitValidation.status === "pass", {
    countryLimit: getTeamBuilderCountryLimit(rulesConfig),
    teamLimitValidation
  }),
  check("formation_rules_include_active_4_3_3", formationRules.allowedFormations.includes("4-3-3") &&
    sameJson(formationRules.requirementsByCode["4-3-3"], { GK: 1, DEF: 4, MID: 3, FWD: 3 }), {
    activeFormation: formationRules.activeFormation,
    allowedFormations: formationRules.allowedFormations
  }),
  check("malformed_rules_config_fails_with_useful_error", malformedValidation.status === "fail" &&
    /budget\.initial_budget|budget/i.test(malformedValidation.errors.join(" ")), malformedValidation),
  check("explicit_bad_normalized_config_fails_with_useful_errors", failedConfigValidation.status === "fail" &&
    failedConfigValidation.errors.length >= 3, failedConfigValidation),
  check("helper_output_is_deterministic", sameJson(rulesConfig, rulesConfigAgain), {}),
  check("helpers_do_not_mutate_inputs", beforeRules === JSON.stringify(rules) && beforeArtifact === JSON.stringify(artifact), {}),
  check("rule_source_classification_is_present", rulesConfig.sourceClassification === "current-implementation-backed" &&
    Boolean(rulesConfig.budget.detail.source) &&
    Boolean(rulesConfig.countryLimit.detail.source) &&
    Boolean(rulesConfig.squad.detail.source), {
    sourceClassification: rulesConfig.sourceClassification,
    budgetSource: rulesConfig.budget.detail.source,
    countryLimitSource: rulesConfig.countryLimit.detail.source,
    squadSource: rulesConfig.squad.detail.source
  }),
  check("browser_rules_helper_matches_module", sameJson(browserRulesConfig, rulesConfig), { browserHelperAvailable: Boolean(browserRulesConfig) }),
  check("lock_removal_rules_are_manual_check_guardrails", lockRemovalRules.lockedPlayersMustRemainPresent &&
    lockRemovalRules.excludedPlayersMustRemainAbsent &&
    lockRemovalRules.liveLockStateManualCheckRequired, lockRemovalRules)
];

const failed = checks.filter((entry) => entry.status !== "pass");
const result = {
  schema_version: "team_builder_rules_helpers_qa_v1",
  generated_at: generatedAt,
  status: failed.length ? "fail" : "pass",
  activeStage: manifest.activeStage,
  rulesPath,
  artifactPath,
  browserHelperWrapperPath: wrapperPath,
  checks_run: checks.length,
  checks,
  failed_checks: failed.map((entry) => entry.id),
  summary: {
    rulesSource: rulesConfig.sourceClassification,
    budgetLimit: rulesConfig.budget.limit,
    budgetLimitSource: rulesConfig.budget.detail.source,
    countryLimit: rulesConfig.countryLimit.limit,
    countryLimitSource: rulesConfig.countryLimit.detail.source,
    squadSize: squadSizeRules.totalPlayers,
    starterSize: squadSizeRules.starterSize,
    benchSize: squadSizeRules.benchSize,
    positionRequirements: positionRules.positionRequirementsByCode,
    activeFormation: formationRules.activeFormation,
    starterRequirements: starterBenchRules.starterRequirementsByCode,
    captainRulesSource: captainRules.source,
    lockRemovalRulesSource: lockRemovalRules.source,
    officialSourceBacked: rulesConfig.budget.detail.officialSourceBacked,
    currentImplementationBacked: rulesConfig.budget.detail.currentImplementationBacked,
    selectedSquadChanged: false,
    optimizerBehaviorChanged: false,
    modelOutputsChanged: false
  }
};

const report = `# Team Builder Rules Helpers QA v1

Generated: ${generatedAt}

Status: **${result.status}**

## Summary

${mdTable(["Item", "Value"], [
  ["Active stage", manifest.activeStage],
  ["Rules source", result.summary.rulesSource],
  ["Budget limit", result.summary.budgetLimit],
  ["Budget limit source", result.summary.budgetLimitSource],
  ["Country/team cap", result.summary.countryLimit],
  ["Country/team cap source", result.summary.countryLimitSource],
  ["Squad size", result.summary.squadSize],
  ["Starter / bench", `${result.summary.starterSize} / ${result.summary.benchSize}`],
  ["Position requirements", JSON.stringify(result.summary.positionRequirements)],
  ["Active formation", result.summary.activeFormation],
  ["Starter requirements", JSON.stringify(result.summary.starterRequirements)],
  ["Captain/vice rule source", result.summary.captainRulesSource],
  ["Lock/removal rule source", result.summary.lockRemovalRulesSource],
  ["Official source backed", result.summary.officialSourceBacked ? "yes" : "no"],
  ["Current implementation backed", result.summary.currentImplementationBacked ? "yes" : "no"],
  ["Selected squad changed", "no"],
  ["Optimizer behavior changed", "no"],
  ["Model outputs changed", "no"]
])}

## Checks

${mdTable(["ID", "Status"], checks.map((entry) => [entry.id, entry.status]))}

## Notes

The rules helpers centralize current Team Builder rule constants and derivation only. They do not score, rank, reorder, select, lock, exclude, mutate candidates, rebuild artifacts, or claim live FIFA lock/deadline state is verified.
`;

writeJson(outputPath, result);
writeText(reportPath, report);

console.log(JSON.stringify({
  status: result.status,
  checksRun: result.checks_run,
  budgetLimit: result.summary.budgetLimit,
  countryLimit: result.summary.countryLimit,
  outputJson: outputPath,
  outputReport: reportPath
}, null, 2));

if (result.status !== "pass") {
  process.exitCode = 1;
}
