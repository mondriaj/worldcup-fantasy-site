import fs from "node:fs";
import { manifestFile, projectPath, readActiveStageManifest } from "./lib/readActiveStageManifest.mjs";
import { getFixtureAuthorityEligibleTeams } from "./lib/teamBuilderPublicModel.mjs";

const generatedAt = new Date().toISOString();
const contractPath = "data/finalRoundBrowserContentContract_v1.json";
const outputPath = "data/finalRoundBrowserContentContractQa_v1.json";
const reportPath = "data/finalRoundBrowserContentContractQaReport_v1.md";

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

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function sameSet(left, right) {
  const leftSet = new Set(left.map(normalize));
  const rightSet = new Set(right.map(normalize));
  return leftSet.size === rightSet.size && [...leftSet].every((entry) => rightSet.has(entry));
}

function includesNeedles(haystack, needles) {
  const text = normalize(haystack);
  return (needles || []).filter((needle) => !text.includes(normalize(needle)));
}

function check(id, passed, details = {}) {
  return { id, status: passed ? "pass" : "fail", details };
}

const manifest = readActiveStageManifest();
const contract = readJson(contractPath);
const authority = readJson(manifestFile(manifest, "finalRoundFixtureAuthority"));
const scorePredictions = readJson(manifestFile(manifest, "scorePredictions"));
const golden = readJson(contract.teamBuilderGoldenPath);
const pageText = `${fs.readFileSync(projectPath("index.html"), "utf8")}\n${fs.readFileSync(projectPath("script.js"), "utf8")}`;
const authorityFixtures = authority.fixtures || [];
const authorityTeams = getFixtureAuthorityEligibleTeams(authority);
const contractFixtureText = JSON.stringify(contract.matchEnvironment?.fixtures || []);
const authorityFixtureText = JSON.stringify(authorityFixtures);
const scorePredictionText = JSON.stringify(scorePredictions.fixtureScorePredictions || []);
const completedScores = authorityFixtures.flatMap((fixture) =>
  (fixture.source_matches || []).map((match) => match.score).filter(Boolean)
);
const contractPlayers = [
  ...(contract.picks?.requiredFinalPlayers || []),
  ...(contract.picks?.requiredThirdPlacePlayers || []),
  ...(contract.captainWatchlist?.requiredFinalPlayers || []),
  ...(contract.captainWatchlist?.requiredThirdPlacePlayers || []),
  ...(contract.playerProfile?.requiredProfiles || []).map((entry) => entry.player)
];
const activeRows = [
  ...(readJson(manifestFile(manifest, "recommendations")).recommendationCandidates || []),
  ...(readJson(manifestFile(manifest, "matchdayProjections")).playerMatchdayProjections || [])
].filter((row) => row.matchday === manifest.activeStage);
const activePlayerNames = new Set(activeRows.map((row) => normalize(row.name || row.display_name)));
const missingContractPlayers = contractPlayers.filter((name) => !activePlayerNames.has(normalize(name)));

const checks = [
  check("contract_active_stage_matches_manifest", contract.activeStage === manifest.activeStage, {
    contract: contract.activeStage,
    manifest: manifest.activeStage
  }),
  check("contract_eligible_teams_match_fixture_authority", sameSet(contract.eligibleTeams || [], authorityTeams), {
    contract: contract.eligibleTeams,
    authorityTeams
  }),
  check("fixture_authority_has_final_and_third_place", authorityFixtures.some((fixture) => fixture.stage === "final") &&
    authorityFixtures.some((fixture) => fixture.stage === "third_place"), {
    stages: authorityFixtures.map((fixture) => fixture.stage)
  }),
  check("contract_fixtures_match_fixture_authority", (contract.matchEnvironment?.fixtures || []).every((expected) =>
    authorityFixtures.some((fixture) =>
      fixture.stage === expected.stage &&
      Number(fixture.bracket_match_number) === Number(expected.matchNumber) &&
      sameSet([fixture.team_a?.team, fixture.team_b?.team].filter(Boolean), expected.teams || [])
    )
  ), {
    contractFixtures: contract.matchEnvironment?.fixtures,
    authorityFixtures: authorityFixtures.map((fixture) => ({
      stage: fixture.stage,
      matchNumber: fixture.bracket_match_number,
      teams: [fixture.team_a?.team, fixture.team_b?.team]
    }))
  }),
  check("completed_sf_scores_match_fixture_authority", (contract.matchEnvironment?.completedSfScores || []).every((score) =>
    completedScores.includes(score)
  ), { contractScores: contract.matchEnvironment?.completedSfScores, completedScores }),
  check("score_predictions_have_final_and_third_place", (scorePredictions.fixtureScorePredictions || []).some((row) => row.stage === "final") &&
    (scorePredictions.fixtureScorePredictions || []).some((row) => row.stage === "third_place"), {
    stages: (scorePredictions.fixtureScorePredictions || []).map((row) => row.stage)
  }),
  check("contract_match_text_present_in_sources", includesNeedles(`${authorityFixtureText} ${scorePredictionText}`, [
    "Spain", "Argentina", "France", "England", "1-1"
  ]).length === 0, {}),
  check("contract_expected_players_exist_in_active_rows", missingContractPlayers.length === 0, { missingContractPlayers }),
  check("team_builder_golden_file_exists_and_matches_budget", golden.budgetUsed === 94.8 && golden.budgetLimit === 105, {
    budgetUsed: golden.budgetUsed,
    budgetLimit: golden.budgetLimit
  }),
  check("team_builder_golden_squad_has_expected_size", Array.isArray(golden.selectedPlayers) && golden.selectedPlayers.length === 15, {
    selectedPlayers: golden.selectedPlayers?.length
  }),
  check("eliminated_blocklist_present", ["Lerma", "Raphinha", "Vinicius", "Vinícius", "Brazil", "Colombia"].every((needle) =>
    (contract.eliminatedBlocklist || []).includes(needle)
  ), { eliminatedBlocklist: contract.eliminatedBlocklist }),
  check("required_caveats_defined", ["final squads", "final XIs", "locks", "Third Place"].every((needle) =>
    includesNeedles((contract.requiredCaveats || []).join(" "), [needle]).length === 0
  ), { requiredCaveats: contract.requiredCaveats }),
  check("public_caveat_copy_source_exists", includesNeedles(pageText, [
    "final squads",
    "locks",
    "Third Place"
  ]).length === 0 && /final\s+XIs\s+are\s+not\s+confirmed|confirmed\s+XIs/i.test(pageText), {})
];

const status = checks.every((entry) => entry.status === "pass") ? "pass" : "fail";
const result = {
  schema_version: "final_round_browser_content_contract_qa_v1",
  generated_at: generatedAt,
  status,
  contract: contractPath,
  activeStage: manifest.activeStage,
  checks,
  summary: {
    eligibleTeams: contract.eligibleTeams,
    fixtures: contract.matchEnvironment?.fixtures || [],
    completedSfScores: contract.matchEnvironment?.completedSfScores || [],
    protectedTeamBuilderBudget: `${golden.budgetUsed} / ${golden.budgetLimit}`
  }
};

writeJson(outputPath, result);
writeText(reportPath, [
  "# Final Round Browser Content Contract QA v1",
  "",
  `Generated: ${generatedAt}`,
  "",
  `Status: **${status}**`,
  "",
  "## Checks",
  "",
  mdTable(["Check", "Status"], checks.map((entry) => [entry.id, entry.status])),
  "",
  "## Contract Summary",
  "",
  mdTable(["Item", "Value"], [
    ["Active stage", result.activeStage],
    ["Eligible teams", result.summary.eligibleTeams.join(", ")],
    ["Fixtures", result.summary.fixtures.map((fixture) => `${fixture.label}: ${fixture.visibleText}`).join("; ")],
    ["Completed SF scores", result.summary.completedSfScores.join("; ")],
    ["Team Builder budget", result.summary.protectedTeamBuilderBudget]
  ]),
  ""
].join("\n"));

console.log(JSON.stringify({
  status,
  checks: checks.map(({ id, status }) => ({ id, status })),
  summary: result.summary
}, null, 2));

if (status !== "pass") {
  process.exitCode = 1;
}
