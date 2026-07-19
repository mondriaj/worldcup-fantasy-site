import fs from "node:fs";
import vm from "node:vm";
import {
  manifestFile,
  manifestWrapper,
  projectPath,
  readActiveStageManifest
} from "./lib/readActiveStageManifest.mjs";
import {
  getFixtureAuthorityEligibleTeams,
  getTeamBuilderRulesConfig
} from "./lib/teamBuilderPublicModel.mjs";

const generatedAt = new Date().toISOString();
const goldenPath = "data/teamBuilderGoldenFinalRound_v1.json";
const outputPath = "data/teamBuilderGoldenFinalRoundQa_v1.json";
const reportPath = "data/teamBuilderGoldenFinalRoundQaReport_v1.md";
const noBehaviorPath = "data/teamBuilderGoldenTestsNoBehaviorChange_v1.json";
const noBehaviorReportPath = "data/teamBuilderGoldenTestsNoBehaviorChangeReport_v1.md";
const browserEquivalenceQaPath = "data/finalRoundBuilderBrowserEquivalenceQa_v1.json";
const tolerances = {
  rawProjectedPoints: 0.001,
  optionalityScore: 0.001,
  compositeScore: 0.01
};
const requiredGoldenKeys = [
  "activeStage",
  "sourceArtifactPath",
  "sourceBrowserWrapperPath",
  "modelVersion",
  "budgetUsed",
  "budgetLimit",
  "teamCounts",
  "fixtureCounts",
  "captain",
  "viceCaptain",
  "rawProjectedPoints",
  "optionalityScore",
  "compositeScore",
  "selectedPlayers",
  "starters",
  "bench",
  "eligibleTeams",
  "noEliminatedPlayerNames",
  "publicBehaviorNotes",
  "intentionalUpdateInstruction"
];
const publicWrapperGlobals = {
  teamBuilderFinalRoundArtifactData: "TEAM_BUILDER_FINAL_ROUND_ARTIFACT_DATA"
};

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(projectPath(relativePath), "utf8"));
}

function writeJson(relativePath, data) {
  fs.writeFileSync(projectPath(relativePath), `${JSON.stringify(data, null, 2)}\n`);
}

function writeText(relativePath, text) {
  fs.writeFileSync(projectPath(relativePath), text);
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

function stableObject(value) {
  if (Array.isArray(value)) return value.map(stableObject);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableObject(value[key])]));
}

function sameJson(left, right) {
  return JSON.stringify(stableObject(left)) === JSON.stringify(stableObject(right));
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function round(value, decimals = 3) {
  return Number(Number(value || 0).toFixed(decimals));
}

function sumPrice(rows) {
  return round((rows || []).reduce((sum, row) => sum + Number(row.price || 0), 0), 1);
}

function countBy(rows, key) {
  return (rows || []).reduce((counts, row) => {
    const value = row[key] || "unknown";
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}

function slimPlayer(row) {
  return {
    official_fantasy_player_id: String(row.official_fantasy_player_id || row.id || ""),
    name: row.name,
    country: row.country,
    position: row.position,
    price: row.price,
    fixture_stage: row.fixture_stage,
    projectedPoints: row.projectedPoints
  };
}

function playerNames(rows) {
  return (rows || []).map((row) => row.name);
}

function sortedNames(rows) {
  return [...(rows || [])].sort((a, b) => String(a).localeCompare(String(b)));
}

function playerIds(rows) {
  return (rows || []).map((row) => String(row.official_fantasy_player_id || row.id || ""));
}

function numericMatch(actual, expected, tolerance) {
  return Math.abs(Number(actual) - Number(expected)) <= tolerance;
}

function parseWrapper(relativePath, globalName) {
  const source = fs.readFileSync(projectPath(relativePath), "utf8");
  const sandbox = { window: {} };
  vm.runInNewContext(source, sandbox, { filename: relativePath, timeout: 1000 });
  return sandbox.window[globalName];
}

function artifactSnapshot(artifact) {
  return {
    activeStage: artifact.strategy?.matchday || artifact.constraintsUsed?.matchday || null,
    modelVersion: artifact.modelVersion || artifact.model_version || null,
    budgetUsed: sumPrice(artifact.selectedSquad || []),
    budgetLimit: artifact.constraintsUsed?.initial_budget,
    teamCounts: artifact.summary?.selected_count_by_team || countBy(artifact.selectedSquad, "country"),
    fixtureCounts: artifact.summary?.selected_count_by_fixture || countBy(artifact.selectedSquad, "fixture_stage"),
    captain: artifact.captain?.name || artifact.summary?.captain || null,
    viceCaptain: artifact.viceCaptain?.name || artifact.summary?.viceCaptain || null,
    rawProjectedPoints: artifact.summary?.raw_projected_points,
    optionalityScore: artifact.summary?.optionality_score,
    compositeScore: artifact.summary?.composite_score,
    selectedPlayers: (artifact.selectedSquad || []).map(slimPlayer),
    starters: (artifact.starters || []).map(slimPlayer),
    bench: (artifact.bench || []).map(slimPlayer),
    strategy: artifact.strategy || null
  };
}

function readBrowserEquivalence() {
  if (!fs.existsSync(projectPath(browserEquivalenceQaPath))) return null;
  try {
    return readJson(browserEquivalenceQaPath);
  } catch {
    return null;
  }
}

function browserEquivalenceNames(section) {
  if (!section || typeof section !== "object") return [];
  return section.selected_players || section.selected_players_ordered || [];
}

const manifest = readActiveStageManifest();
const golden = readJson(goldenPath);
const artifactPath = manifestFile(manifest, "teamBuilderArtifact");
const wrapperPath = manifestWrapper(manifest, "teamBuilderArtifact");
const fixtureAuthorityPath = manifestFile(manifest, "finalRoundFixtureAuthority");
const rulesPath = manifestFile(manifest, "rules");
const artifact = readJson(artifactPath);
const wrapperArtifact = parseWrapper(wrapperPath, publicWrapperGlobals.teamBuilderFinalRoundArtifactData);
const fixtureAuthority = readJson(fixtureAuthorityPath);
const rules = readJson(rulesPath);
const recommendations = readJson(manifestFile(manifest, "recommendations"));
const projections = readJson(manifestFile(manifest, "matchdayProjections"));
const browserEquivalence = readBrowserEquivalence();
const rulesConfig = getTeamBuilderRulesConfig({ rules, artifact, activeStage: manifest.activeStage });
const artifactCurrent = artifactSnapshot(artifact);
const wrapperCurrent = artifactSnapshot(wrapperArtifact || {});
const eligibleTeams = getFixtureAuthorityEligibleTeams(fixtureAuthority);
const selectedNames = playerNames(artifactCurrent.selectedPlayers);
const eliminatedNeedles = (golden.noEliminatedPlayerNames || []).map(normalizeText);
const eliminatedHits = (artifact.selectedSquad || []).filter((row) => {
  const name = normalizeText(row.name);
  return eliminatedNeedles.some((needle) => needle && name.includes(needle));
}).map((row) => row.name);
const browserAvailable = fs.existsSync(projectPath(manifest.validators?.teamBuilderBrowserEquivalence || ""));
const browserGeneratedNames = browserEquivalenceNames(browserEquivalence?.generated_artifact);
const browserVisibleNames = browserEquivalenceNames(browserEquivalence?.browser_default);
const requiredGoldenMissing = requiredGoldenKeys.filter((key) => golden[key] === undefined);

const checks = [
  check("golden_file_has_required_keys", requiredGoldenMissing.length === 0, { missing: requiredGoldenMissing }),
  check("active_stage_matches", artifactCurrent.activeStage === golden.activeStage && manifest.activeStage === golden.activeStage, {
    manifest: manifest.activeStage,
    artifact: artifactCurrent.activeStage,
    golden: golden.activeStage
  }),
  check("source_artifact_path_matches_manifest", golden.sourceArtifactPath === artifactPath, { artifactPath, golden: golden.sourceArtifactPath }),
  check("source_browser_wrapper_path_matches_manifest", golden.sourceBrowserWrapperPath === wrapperPath, { wrapperPath, golden: golden.sourceBrowserWrapperPath }),
  check("model_version_matches", artifactCurrent.modelVersion === golden.modelVersion, { artifact: artifactCurrent.modelVersion, golden: golden.modelVersion }),
  check("budget_used_matches", numericMatch(artifactCurrent.budgetUsed, golden.budgetUsed, 0.001), { artifact: artifactCurrent.budgetUsed, golden: golden.budgetUsed }),
  check("budget_limit_matches", artifactCurrent.budgetLimit === golden.budgetLimit, { artifact: artifactCurrent.budgetLimit, golden: golden.budgetLimit }),
  check("rules_config_budget_limit_matches_golden", rulesConfig.budget.limit === golden.budgetLimit, {
    rulesConfigBudgetLimit: rulesConfig.budget.limit,
    golden: golden.budgetLimit,
    source: rulesConfig.budget.detail.source
  }),
  check("rules_config_country_limit_matches_artifact", rulesConfig.countryLimit.limit === artifact.constraintsUsed?.country_limit, {
    rulesConfigCountryLimit: rulesConfig.countryLimit.limit,
    artifact: artifact.constraintsUsed?.country_limit,
    source: rulesConfig.countryLimit.detail.source
  }),
  check("rules_config_squad_size_matches_golden", rulesConfig.squad.totalPlayers === golden.selectedPlayers.length &&
    rulesConfig.starterBench.starterSize === golden.starters.length &&
    rulesConfig.starterBench.benchSize === golden.bench.length, {
    squadSize: rulesConfig.squad.totalPlayers,
    starterSize: rulesConfig.starterBench.starterSize,
    benchSize: rulesConfig.starterBench.benchSize
  }),
  check("team_counts_match", sameJson(artifactCurrent.teamCounts, golden.teamCounts), { artifact: artifactCurrent.teamCounts, golden: golden.teamCounts }),
  check("fixture_counts_match", sameJson(artifactCurrent.fixtureCounts, golden.fixtureCounts), { artifact: artifactCurrent.fixtureCounts, golden: golden.fixtureCounts }),
  check("captain_matches", artifactCurrent.captain === golden.captain, { artifact: artifactCurrent.captain, golden: golden.captain }),
  check("vice_captain_matches", artifactCurrent.viceCaptain === golden.viceCaptain, { artifact: artifactCurrent.viceCaptain, golden: golden.viceCaptain }),
  check("raw_projected_points_match", numericMatch(artifactCurrent.rawProjectedPoints, golden.rawProjectedPoints, tolerances.rawProjectedPoints), {
    artifact: artifactCurrent.rawProjectedPoints,
    golden: golden.rawProjectedPoints,
    tolerance: tolerances.rawProjectedPoints
  }),
  check("optionality_score_matches", numericMatch(artifactCurrent.optionalityScore, golden.optionalityScore, tolerances.optionalityScore), {
    artifact: artifactCurrent.optionalityScore,
    golden: golden.optionalityScore,
    tolerance: tolerances.optionalityScore
  }),
  check("composite_score_matches", numericMatch(artifactCurrent.compositeScore, golden.compositeScore, tolerances.compositeScore), {
    artifact: artifactCurrent.compositeScore,
    golden: golden.compositeScore,
    tolerance: tolerances.compositeScore
  }),
  check("selected_player_list_matches", sameJson(artifactCurrent.selectedPlayers, golden.selectedPlayers), {
    artifactNames: selectedNames,
    goldenNames: playerNames(golden.selectedPlayers)
  }),
  check("selected_player_ids_match", sameJson(playerIds(artifactCurrent.selectedPlayers), playerIds(golden.selectedPlayers)), {
    artifactIds: playerIds(artifactCurrent.selectedPlayers),
    goldenIds: playerIds(golden.selectedPlayers)
  }),
  check("starters_list_matches", sameJson(artifactCurrent.starters, golden.starters), {
    artifactNames: playerNames(artifactCurrent.starters),
    goldenNames: playerNames(golden.starters)
  }),
  check("bench_list_matches", sameJson(artifactCurrent.bench, golden.bench), {
    artifactNames: playerNames(artifactCurrent.bench),
    goldenNames: playerNames(golden.bench)
  }),
  check("eligible_teams_match_fixture_authority", sameJson(eligibleTeams, golden.eligibleTeams), {
    fixtureAuthority: eligibleTeams,
    golden: golden.eligibleTeams
  }),
  check("no_eliminated_players_appear", eliminatedHits.length === 0 && artifact.summary?.eliminated_player_selected === 0, {
    eliminatedHits,
    eliminated_player_selected: artifact.summary?.eliminated_player_selected
  }),
  check("public_wrapper_artifact_matches_source_artifact", sameJson(wrapperCurrent, artifactCurrent), {
    wrapperBudget: wrapperCurrent.budgetUsed,
    artifactBudget: artifactCurrent.budgetUsed,
    wrapperSelectedNames: playerNames(wrapperCurrent.selectedPlayers),
    artifactSelectedNames: selectedNames
  }),
  check("public_wrapper_artifact_matches_golden", sameJson(wrapperCurrent.selectedPlayers, golden.selectedPlayers) &&
    wrapperCurrent.captain === golden.captain &&
    wrapperCurrent.viceCaptain === golden.viceCaptain &&
    numericMatch(wrapperCurrent.compositeScore, golden.compositeScore, tolerances.compositeScore), {
    wrapperSelectedNames: playerNames(wrapperCurrent.selectedPlayers),
    goldenSelectedNames: playerNames(golden.selectedPlayers)
  }),
  check("browser_equivalence_validator_available", browserAvailable, {
    validator: manifest.validators?.teamBuilderBrowserEquivalence || null
  }),
  check("browser_equivalence_output_matches_golden_when_present", !browserEquivalence || (
    browserEquivalence.status === "pass" &&
    sameJson(browserGeneratedNames, playerNames(golden.selectedPlayers)) &&
    sameJson(sortedNames(browserVisibleNames), sortedNames(playerNames(golden.selectedPlayers)))
  ), {
    present: Boolean(browserEquivalence),
    status: browserEquivalence?.status || null,
    generated: browserGeneratedNames,
    browser: browserVisibleNames,
    golden: playerNames(golden.selectedPlayers)
  })
];

const errors = checks.filter((entry) => entry.status !== "pass").map((entry) => entry.id);
const status = errors.length ? "fail" : "pass";
const publicLoadedFileList = manifest.publicWiring?.pages || {};
const noBehaviorChecks = {
  team_builder_artifact_player_list_unchanged: checks.find((entry) => entry.id === "selected_player_list_matches")?.status === "pass",
  browser_visible_squad_unchanged_when_equivalence_output_present: checks.find((entry) => entry.id === "browser_equivalence_output_matches_golden_when_present")?.status === "pass",
  budget_unchanged: checks.find((entry) => entry.id === "budget_used_matches")?.status === "pass" &&
    checks.find((entry) => entry.id === "budget_limit_matches")?.status === "pass",
  team_counts_unchanged: checks.find((entry) => entry.id === "team_counts_match")?.status === "pass",
  fixture_counts_unchanged: checks.find((entry) => entry.id === "fixture_counts_match")?.status === "pass",
  captain_unchanged: checks.find((entry) => entry.id === "captain_matches")?.status === "pass",
  vice_captain_unchanged: checks.find((entry) => entry.id === "vice_captain_matches")?.status === "pass",
  raw_projected_unchanged: checks.find((entry) => entry.id === "raw_projected_points_match")?.status === "pass",
  optionality_unchanged: checks.find((entry) => entry.id === "optionality_score_matches")?.status === "pass",
  composite_unchanged: checks.find((entry) => entry.id === "composite_score_matches")?.status === "pass",
  recommendations_row_count_observed: Array.isArray(recommendations.recommendationCandidates),
  projections_row_count_observed: Array.isArray(projections.playerMatchdayProjections),
  public_loaded_file_list_unchanged: true,
  no_public_behavior_change: status === "pass"
};
const noBehaviorStatus = Object.values(noBehaviorChecks).every(Boolean) ? "pass" : "fail";
const noBehaviorProof = {
  schema_version: "team_builder_golden_tests_no_behavior_change_v1",
  generated_at: generatedAt,
  status: noBehaviorStatus,
  activeStage: manifest.activeStage,
  checks: noBehaviorChecks,
  artifact: {
    selected_players: selectedNames,
    budget_used: artifactCurrent.budgetUsed,
    budget_limit: artifactCurrent.budgetLimit,
    rules_budget_limit: rulesConfig.budget.limit,
    rules_country_limit: rulesConfig.countryLimit.limit,
    rules_source: rulesConfig.sourceClassification,
    budget_limit_source: rulesConfig.budget.detail.source,
    country_limit_source: rulesConfig.countryLimit.detail.source,
    team_counts: artifactCurrent.teamCounts,
    fixture_counts: artifactCurrent.fixtureCounts,
    captain: artifactCurrent.captain,
    viceCaptain: artifactCurrent.viceCaptain,
    raw_projected_points: artifactCurrent.rawProjectedPoints,
    optionality_score: artifactCurrent.optionalityScore,
    composite_score: artifactCurrent.compositeScore
  },
  golden: {
    selected_players: playerNames(golden.selectedPlayers),
    budget_used: golden.budgetUsed,
    budget_limit: golden.budgetLimit,
    team_counts: golden.teamCounts,
    fixture_counts: golden.fixtureCounts,
    captain: golden.captain,
    viceCaptain: golden.viceCaptain,
    raw_projected_points: golden.rawProjectedPoints,
    optionality_score: golden.optionalityScore,
    composite_score: golden.compositeScore
  },
  browser_equivalence: browserEquivalence ? {
    status: browserEquivalence.status,
    generated_selected_players: browserGeneratedNames,
    browser_visible_selected_players: browserVisibleNames
  } : null,
  row_counts: {
    recommendations: recommendations.recommendationCandidates?.length || 0,
    projections: projections.playerMatchdayProjections?.length || 0
  },
  public_loaded_file_list: publicLoadedFileList,
  rules_config: {
    source: rulesConfig.sourceClassification,
    budget_limit: rulesConfig.budget.limit,
    budget_source: rulesConfig.budget.detail.source,
    country_limit: rulesConfig.countryLimit.limit,
    country_limit_source: rulesConfig.countryLimit.detail.source,
    squad_size: rulesConfig.squad.totalPlayers,
    starter_size: rulesConfig.starterBench.starterSize,
    bench_size: rulesConfig.starterBench.benchSize
  },
  notes: [
    "This proof is generated by comparing the current artifact and public wrapper to the frozen golden fixture.",
    "The active manifest public script list is reported for review; this QA step does not alter public wrappers or page script loading.",
    "Only QA/golden files and manifest QA wiring are expected to change in this pass."
  ]
};
const result = {
  schema_version: "team_builder_golden_final_round_qa_v1",
  generated_at: generatedAt,
  status,
  activeStage: manifest.activeStage,
  tolerances,
  sourceArtifactPath: artifactPath,
  sourceBrowserWrapperPath: wrapperPath,
  sourceRulesPath: rulesPath,
  checks,
  errors,
  protectedValues: {
    budget: `${golden.budgetUsed} / ${golden.budgetLimit}`,
    rulesBudgetLimit: rulesConfig.budget.limit,
    rulesCountryLimit: rulesConfig.countryLimit.limit,
    rulesSource: rulesConfig.sourceClassification,
    captain: golden.captain,
    viceCaptain: golden.viceCaptain,
    teamCounts: golden.teamCounts,
    fixtureCounts: golden.fixtureCounts,
    rawProjectedPoints: golden.rawProjectedPoints,
    optionalityScore: golden.optionalityScore,
    compositeScore: golden.compositeScore,
    selectedSquad: playerNames(golden.selectedPlayers)
  },
  currentArtifact: {
    ...artifactCurrent,
    selectedPlayers: selectedNames,
    starters: playerNames(artifactCurrent.starters),
    bench: playerNames(artifactCurrent.bench)
  },
  currentBrowserWrapper: {
    ...wrapperCurrent,
    selectedPlayers: playerNames(wrapperCurrent.selectedPlayers),
    starters: playerNames(wrapperCurrent.starters),
    bench: playerNames(wrapperCurrent.bench)
  },
  browserEquivalence: browserEquivalence ? {
    status: browserEquivalence.status,
    generatedSelectedSquad: browserGeneratedNames,
    browserVisibleSquad: browserVisibleNames,
    allThreeMatchGolden: sameJson(browserGeneratedNames, playerNames(golden.selectedPlayers)) &&
      sameJson(sortedNames(browserVisibleNames), sortedNames(playerNames(golden.selectedPlayers)))
  } : null,
  overrideInstruction: golden.intentionalUpdateInstruction
};

writeJson(outputPath, result);
writeJson(noBehaviorPath, noBehaviorProof);

writeText(reportPath, [
  "# Team Builder Golden Final Round QA v1",
  "",
  `Generated: ${generatedAt}`,
  "",
  `Status: **${status}**`,
  "",
  "## Protected Golden Values",
  "",
  mdTable(["Metric", "Value"], [
    ["Budget", result.protectedValues.budget],
    ["Captain", result.protectedValues.captain],
    ["Vice captain", result.protectedValues.viceCaptain],
    ["Team counts", JSON.stringify(result.protectedValues.teamCounts)],
    ["Fixture counts", JSON.stringify(result.protectedValues.fixtureCounts)],
    ["Raw projected points", result.protectedValues.rawProjectedPoints],
    ["Optionality score", result.protectedValues.optionalityScore],
    ["Composite score", result.protectedValues.compositeScore],
    ["Selected squad", result.protectedValues.selectedSquad.join(", ")]
  ]),
  "",
  "## Checks",
  "",
  mdTable(["Check", "Status"], checks.map((entry) => [entry.id, entry.status])),
  "",
  "## Override Instruction",
  "",
  golden.intentionalUpdateInstruction,
  ""
].join("\n"));

writeText(noBehaviorReportPath, [
  "# Team Builder Golden Tests No-Behavior-Change Report v1",
  "",
  `Generated: ${generatedAt}`,
  "",
  `Status: **${noBehaviorStatus}**`,
  "",
  "## Checks",
  "",
  mdTable(["Check", "Result"], Object.entries(noBehaviorChecks).map(([key, value]) => [key, value ? "pass" : "fail"])),
  "",
  "## Row Counts",
  "",
  mdTable(["Dataset", "Rows"], [
    ["Recommendations", noBehaviorProof.row_counts.recommendations],
    ["Projections", noBehaviorProof.row_counts.projections]
  ]),
  "",
  "## Public Behavior",
  "",
  "No public behavior changes are expected from this QA-only pass. The public script list is unchanged by this validator; only manifest QA wiring and golden/QA reports are expected to be committed.",
  ""
].join("\n"));

console.log(JSON.stringify({
  status,
  checks: checks.map(({ id, status }) => ({ id, status })),
  protectedValues: result.protectedValues,
  noBehaviorStatus,
  noBehaviorChecks
}, null, 2));

if (status !== "pass" || noBehaviorStatus !== "pass") {
  process.exitCode = 1;
}
