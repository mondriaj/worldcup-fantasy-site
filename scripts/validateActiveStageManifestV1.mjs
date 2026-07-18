import fs from "node:fs";
import path from "node:path";
import {
  manifestBlockedGlobals,
  manifestFile,
  manifestPageScripts,
  manifestValidator,
  manifestWrapper,
  projectPath,
  readActiveStageManifest
} from "./lib/readActiveStageManifest.mjs";

const generatedAt = new Date().toISOString();
const manifestPath = "data/activeStageManifest_v1.json";
const outputPath = "data/activeStageManifestQa_v1.json";
const reportPath = "data/activeStageManifestQaReport_v1.md";

function readText(relativePath) {
  return fs.readFileSync(projectPath(relativePath), "utf8");
}

function exists(relativePath) {
  return fs.existsSync(projectPath(relativePath));
}

function scriptSrcsFromHtml(relativePath) {
  const html = readText(relativePath);
  return [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*><\/script>/gi)].map((match, index) => {
    const src = match[1];
    const [file, query = ""] = src.split("?");
    const cacheBust = new URLSearchParams(query).get("v");
    return { order: index + 1, src, file, cacheBust };
  });
}

function expectedCacheBust(manifest, file) {
  return manifest.cacheBust?.overrides?.[file] || manifest.cacheBust?.default || manifest.publicVersion || null;
}

function check(id, passed, details = {}) {
  return { id, status: passed ? "pass" : "fail", details };
}

function mdTable(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((value) => String(value ?? "")).join(" | ")} |`)
  ].join("\n");
}

function writeJson(relativePath, data) {
  fs.writeFileSync(projectPath(relativePath), `${JSON.stringify(data, null, 2)}\n`);
}

function writeText(relativePath, text) {
  fs.writeFileSync(projectPath(relativePath), text);
}

let manifest;
const parseErrors = [];
try {
  manifest = readActiveStageManifest(manifestPath);
} catch (error) {
  parseErrors.push(error.message);
  manifest = {};
}

const pageScripts = Object.fromEntries((manifest.pages || []).map((page) => [
  page,
  exists(page) ? scriptSrcsFromHtml(page) : []
]));
const allPublicPageText = (manifest.pages || [])
  .filter(exists)
  .map(readText)
  .join("\n");
const scriptSource = exists("script.js") ? readText("script.js") : "";
const defaultStage = scriptSource.match(/const defaultPublicMatchdayId = ["']([^"']+)["']/)?.[1] || null;
const listedSourceFiles = Object.values(manifest.files || {});
const listedWrappers = Object.values(manifest.wrappers || {});
const listedValidators = Object.values(manifest.validators || {});
const blockedGlobals = manifestBlockedGlobals(manifest);
const forbiddenPublicSurfaces = manifest.forbiddenPublicSurfaces || [];
const qaRunner = manifest.qaRunner || {};

const loadedByPage = (page) => new Set((pageScripts[page] || []).map((entry) => entry.file));
const missingExpectedScripts = Object.entries(manifest.publicWiring?.pages || {}).flatMap(([page, config]) => {
  const loaded = loadedByPage(page);
  return (config.scripts || [])
    .filter((script) => !loaded.has(script))
    .map((script) => ({ page, script }));
});
const cacheBustMismatches = Object.entries(manifest.publicWiring?.pages || {}).flatMap(([page, config]) => {
  const loaded = new Map((pageScripts[page] || []).map((entry) => [entry.file, entry]));
  return (config.scripts || [])
    .map((script) => {
      const entry = loaded.get(script);
      const expected = expectedCacheBust(manifest, script);
      return entry && expected && entry.cacheBust !== expected
        ? { page, script, expected, actual: entry.cacheBust }
        : null;
    })
    .filter(Boolean);
});
const forbiddenHits = forbiddenPublicSurfaces.filter((pattern) =>
  new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(allPublicPageText)
);

const requiredFiles = [
  ["finalRoundFixtureAuthority", () => manifestFile(manifest, "finalRoundFixtureAuthority")],
  ["teamBuilderArtifact", () => manifestFile(manifest, "teamBuilderArtifact")],
  ["teamBuilderArtifactWrapper", () => manifestWrapper(manifest, "teamBuilderArtifact")],
  ["teamBuilderBrowserEquivalenceValidator", () => manifestValidator(manifest, "teamBuilderBrowserEquivalence")],
  ["eligiblePlayersValidator", () => manifestValidator(manifest, "eligiblePlayers")],
  ["fixtureAuthorityValidator", () => manifestValidator(manifest, "finalRoundFixtureAuthority")]
].map(([id, getter]) => {
  try {
    return { id, value: getter(), ok: true };
  } catch (error) {
    return { id, value: error.message, ok: false };
  }
});
const requiredQaRunnerCommandIds = [
  "manifest_validation",
  "team_builder_browser_equivalence",
  "eligible_players",
  "fixture_exposure_strategy",
  "team_builder_final_round",
  "core_pick_lineup_evidence",
  "active_fantasy_data_flow",
  "live_fixture_mapping",
  "match_environment_live_scores",
  "world_cup_fixtures_page_live_scores",
  "final_round_fixture_authority",
  "bracket_path_integrity",
  "knockout_bracket_prediction",
  "public_payload_contract",
  "public_preview_browser_qa",
  "git_diff_whitespace"
];
const requiredSyntaxChecks = [
  "script.js",
  "worldCupPage.js",
  "worldCupData.js",
  "knockoutBracketPredictionData.js",
  "fantasyPoolRecommendationsData.js",
  "fantasyPoolMatchdayProjectionsData.js",
  "fantasyPoolScorePredictionsData.js",
  "fantasyPoolOfficialDataStatusData.js",
  "liveMatchdayStatusData.js",
  "livePlayerStatusData.js",
  "teamBuilderFinalRoundArtifactData.js",
  "teamBuilderPublicHelpers.js",
  "scripts/lib/teamBuilderPublicModel.mjs",
  "scripts/auditPublicPayloadSlimmingV1.mjs",
  "scripts/lib/publicPayloadSlimming.mjs",
  "scripts/validatePublicPayloadContractV1.mjs",
  "scripts/runActiveStageQaFromManifestV1.mjs",
  "scripts/validateActiveStageManifestV1.mjs",
  "scripts/lib/readActiveStageManifest.mjs"
];
const requiredSearchCheckIds = [
  "old_globals_legacy_paths_public_files",
  "active_eliminated_player_leakage",
  "public_refereeing_conspiracy_leakage"
];
const qaRunnerCommandIds = (qaRunner.requiredCommandChecks || []).map((entry) => entry.id);
const missingQaRunnerCommandIds = requiredQaRunnerCommandIds.filter((id) => !qaRunnerCommandIds.includes(id));
const missingSyntaxChecks = requiredSyntaxChecks.filter((file) => !(qaRunner.syntaxChecks || []).includes(file));
const searchCheckIds = (qaRunner.searchChecks || []).map((entry) => entry.id);
const missingSearchChecks = requiredSearchCheckIds.filter((id) => !searchCheckIds.includes(id));

const requiredBlockedGlobals = [
  "FINANCE_PLAYERS_DATA",
  "PLAYER_MATCHDAY_PROJECTIONS_DATA",
  "MATCHDAY_MODEL_SUMMARY",
  "FINANCE_MODEL_SUMMARY",
  "SCORE_FIXTURE_PREDICTIONS_DATA",
  "SCORE_PREDICTIONS_SUMMARY"
];
const missingBlockedGlobals = requiredBlockedGlobals.filter((name) => !blockedGlobals.includes(name));

const requiredCaveatNeedles = [
  /final squads/i,
  /final xis/i,
  /user locks/i,
  /third place/i,
  /planning help/i
];
const caveatText = (manifest.knownCaveats || []).join("\n");
const missingCaveats = requiredCaveatNeedles
  .filter((needle) => !needle.test(caveatText))
  .map(String);

const checks = [
  check("manifest_exists_and_parses", parseErrors.length === 0 && exists(manifestPath), { parseErrors }),
  check("active_stage_is_final_round", manifest.activeStage === "finalRound", { activeStage: manifest.activeStage }),
  check("cache_bust_present", Boolean(manifest.publicVersion && manifest.cacheBust?.default), {
    publicVersion: manifest.publicVersion,
    cacheBust: manifest.cacheBust
  }),
  check("all_listed_source_files_exist", listedSourceFiles.every(exists), {
    missing: listedSourceFiles.filter((file) => !exists(file))
  }),
  check("all_listed_public_wrappers_exist", listedWrappers.every(exists), {
    missing: listedWrappers.filter((file) => !exists(file))
  }),
  check("all_listed_validators_exist", listedValidators.every(exists), {
    missing: listedValidators.filter((file) => !exists(file))
  }),
  check("required_manifest_entries_present", requiredFiles.every((entry) => entry.ok), {
    entries: requiredFiles
  }),
  check("html_references_expected_active_wrappers", missingExpectedScripts.length === 0, {
    missingExpectedScripts
  }),
  check("team_builder_artifact_wrapper_loaded_by_index", loadedByPage("index.html").has("teamBuilderFinalRoundArtifactData.js"), {
    indexScripts: [...loadedByPage("index.html")]
  }),
  check("team_builder_public_helper_loaded_before_script", (() => {
    const indexScripts = [...loadedByPage("index.html")];
    return indexScripts.includes("teamBuilderPublicHelpers.js") &&
      indexScripts.indexOf("teamBuilderPublicHelpers.js") < indexScripts.indexOf("script.js");
  })(), {
    indexScripts: [...loadedByPage("index.html")]
  }),
  check("manifest_stage_matches_script_default", manifest.activeStage === defaultStage, {
    manifestStage: manifest.activeStage,
    scriptDefaultStage: defaultStage
  }),
  check("cache_bust_matches_html_for_manifest_scripts", cacheBustMismatches.length === 0, {
    cacheBustMismatches
  }),
  check("browser_equivalence_validator_listed", listedValidators.includes("scripts/validateFinalRoundBuilderBrowserEquivalenceV1.mjs"), {}),
  check("eligible_player_validator_listed", listedValidators.includes("scripts/validateFinalRoundEligiblePlayersV1.mjs"), {}),
  check("final_round_fixture_authority_listed", listedSourceFiles.includes("data/finalRoundFixtureAuthority_v1.json"), {}),
  check("old_deprecated_globals_blocked", missingBlockedGlobals.length === 0, { missingBlockedGlobals }),
  check("known_caveats_present", missingCaveats.length === 0, { missingCaveats }),
  check("forbidden_refereeing_conspiracy_surface_listed", forbiddenPublicSurfaces.includes("Refereeing Outcomes") && forbiddenPublicSurfaces.includes("conspiracy"), {
    forbiddenPublicSurfaces
  }),
  check("forbidden_refereeing_conspiracy_absent_from_public_pages", forbiddenHits.length === 0, {
    forbiddenHits
  }),
  check("qa_runner_section_present", Boolean(qaRunner.script && qaRunner.outputJson && qaRunner.outputReport), {
    script: qaRunner.script,
    outputJson: qaRunner.outputJson,
    outputReport: qaRunner.outputReport
  }),
  check("qa_runner_script_exists", Boolean(qaRunner.script && exists(qaRunner.script)), {
    script: qaRunner.script
  }),
  check("qa_runner_required_command_checks_present", missingQaRunnerCommandIds.length === 0, {
    missingQaRunnerCommandIds
  }),
  check("qa_runner_syntax_checks_present", missingSyntaxChecks.length === 0, {
    missingSyntaxChecks
  }),
  check("qa_runner_search_checks_present", missingSearchChecks.length === 0, {
    missingSearchChecks
  }),
  check("qa_runner_public_preview_uses_local_server", Boolean(qaRunner.localServer?.baseUrl && (qaRunner.requiredCommandChecks || []).some((entry) => entry.id === "public_preview_browser_qa" && entry.requiresLocalServer)), {
    localServer: qaRunner.localServer
  }),
  check("public_payload_contract_listed", Boolean(manifest.publicPayloads?.contract && manifest.validators?.publicPayloadContract), {
    publicPayloads: manifest.publicPayloads,
    validator: manifest.validators?.publicPayloadContract
  })
];

const status = checks.every((entry) => entry.status === "pass") ? "pass" : "fail";
const result = {
  schema_version: "active_stage_manifest_qa_v1",
  generated_at: generatedAt,
  status,
  manifest: manifestPath,
  activeStage: manifest.activeStage || null,
  publicVersion: manifest.publicVersion || null,
  pages: manifest.pages || [],
  sourceFiles: listedSourceFiles,
  publicWrappers: listedWrappers,
  validators: listedValidators,
  qaRunner,
  blockedGlobals,
  pageScripts,
  checks
};

const report = [
  "# Active Stage Manifest QA Report v1",
  "",
  `Generated: ${generatedAt}`,
  "",
  `Status: **${status}**`,
  "",
  "## Manifest Contract",
  "",
  mdTable(
    ["Item", "Value"],
    [
      ["Active stage", result.activeStage],
      ["Public version", result.publicVersion],
      ["Pages", result.pages.join(", ")],
      ["Source files", result.sourceFiles.length],
      ["Wrappers", result.publicWrappers.length],
      ["Validators", result.validators.length],
      ["Blocked globals", result.blockedGlobals.length]
    ]
  ),
  "",
  "## Checks",
  "",
  mdTable(["Check", "Status"], checks.map((entry) => [entry.id, entry.status])),
  "",
  "## Loaded Scripts",
  "",
  Object.entries(pageScripts)
    .map(([page, scripts]) => `### ${page}\n\n${mdTable(["Order", "File", "Cache bust"], scripts.map((entry) => [entry.order, entry.file, entry.cacheBust || "none"]))}`)
    .join("\n\n"),
  ""
].join("\n");

writeJson(outputPath, result);
writeText(reportPath, report);

console.log(JSON.stringify({ status, checks: checks.map(({ id, status }) => ({ id, status })) }, null, 2));

if (status !== "pass") {
  process.exitCode = 1;
}
