import fs from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const generatedAt = new Date().toISOString();

function projectPath(...parts) {
  return path.join(root, ...parts);
}

function readText(relativePath) {
  return fs.readFileSync(projectPath(relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

async function writeJson(relativePath, value) {
  await writeFile(projectPath(relativePath), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function writeText(relativePath, value) {
  await writeFile(projectPath(relativePath), `${value.trimEnd()}\n`, "utf8");
}

function loadWorldCupData() {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(readText("worldCupData.js"), context, { filename: "worldCupData.js" });
  return context.window.WORLD_CUP_DATA;
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function mdTable(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((value) => String(value ?? "")).join(" | ")} |`)
  ].join("\n");
}

function addCheck(checks, failures, id, passed, detail = null) {
  checks.push({ id, status: passed ? "pass" : "fail", detail });
  if (!passed) failures.push({ id, detail });
}

async function main() {
  const authority = readJson("data/r32FixtureAuthority_v1.json");
  const worldCupData = loadWorldCupData();
  const html = readText("world-cup.html");
  const pageJs = readText("worldCupPage.js");
  const checks = [];
  const failures = [];
  const fixtures = authority.fixtures || [];
  const bracketR32 = (worldCupData.bracket?.rounds || []).find((round) => round.name === "Round of 32")?.matches || [];
  const groupStageFixtures = (worldCupData.fixtures || []).filter((fixture) => fixture.stage === "group");
  const fixtureSlots = fixtures.map((fixture) => Number(fixture.bracket_match_number));
  const duplicateSlots = fixtureSlots.filter((slot, index) => fixtureSlots.indexOf(slot) !== index);
  const teams = fixtures.flatMap((fixture) => [fixture.team_a?.team_id, fixture.team_b?.team_id]).filter(Boolean);
  const duplicateTeams = teams.filter((team, index) => teams.indexOf(team) !== index);
  const missingBracketSlots = bracketR32
    .map((match) => Number(match.id))
    .filter((matchNumber) => !fixtures.some((fixture) => Number(fixture.bracket_match_number) === matchNumber));
  const staleTbd = fixtures.filter((fixture) =>
    [fixture.team_a?.team, fixture.team_b?.team].some((team) => /tbd|to be decided|pending/i.test(String(team || "")))
  );
  const wrongFrance = fixtures.find((fixture) => [fixture.team_a?.team_id, fixture.team_b?.team_id].includes("france"));
  const wrongArgentina = fixtures.find((fixture) => [fixture.team_a?.team_id, fixture.team_b?.team_id].includes("argentina"));
  const r32ScriptIndex = html.indexOf("r32FixtureAuthorityData.js");
  const pageScriptIndex = html.indexOf("worldCupPage.js");

  addCheck(checks, failures, "authority_status_pass", authority.status === "pass", authority.status);
  addCheck(checks, failures, "authority_has_16_r32_fixtures", fixtures.length === 16, fixtures.length);
  addCheck(checks, failures, "world_cup_data_has_72_group_fixtures", groupStageFixtures.length === 72, groupStageFixtures.length);
  addCheck(checks, failures, "all_r32_bracket_slots_present", missingBracketSlots.length === 0, missingBracketSlots);
  addCheck(checks, failures, "no_duplicate_r32_slots", duplicateSlots.length === 0, duplicateSlots);
  addCheck(checks, failures, "no_duplicate_r32_teams", duplicateTeams.length === 0, duplicateTeams);
  addCheck(checks, failures, "no_known_r32_tbd_teams", staleTbd.length === 0, staleTbd.map((fixture) => fixture.bracket_slot_id));
  addCheck(checks, failures, "page_loads_authority_before_renderer", r32ScriptIndex >= 0 && pageScriptIndex >= 0 && r32ScriptIndex < pageScriptIndex, { r32ScriptIndex, pageScriptIndex });
  addCheck(checks, failures, "page_renderer_reads_authority_global", pageJs.includes("R32_FIXTURE_AUTHORITY_DATA"), null);
  addCheck(checks, failures, "page_renderer_distinguishes_source_fixture_id", pageJs.includes("Feed source ID") && pageJs.includes("data-source-fixture-id"), null);
  addCheck(checks, failures, "france_slot_and_r16_path_correct", Number(wrongFrance?.bracket_match_number) === 77 && wrongFrance?.winner_advances_to?.bracket_match_number === 89, wrongFrance || null);
  addCheck(checks, failures, "argentina_slot_and_r16_path_correct", Number(wrongArgentina?.bracket_match_number) === 86 && wrongArgentina?.winner_advances_to?.bracket_match_number === 95, wrongArgentina || null);
  addCheck(checks, failures, "france_argentina_not_same_r16", wrongFrance?.winner_advances_to?.bracket_match_number !== wrongArgentina?.winner_advances_to?.bracket_match_number, {
    france_r16: wrongFrance?.winner_advances_to?.bracket_match_number,
    argentina_r16: wrongArgentina?.winner_advances_to?.bracket_match_number
  });

  const qa = {
    schema_version: "world_cup_r32_fixtures_page_qa_v1",
    generated_at: generatedAt,
    status: failures.length ? "fail" : "pass",
    authority_fixture_count: fixtures.length,
    world_cup_group_fixture_count: groupStageFixtures.length,
    checks,
    failures,
    fixture_slots: fixtures.map((fixture) => ({
      slot: fixture.bracket_slot_id,
      source_fixture_id: fixture.source_fixture_id,
      fixture: `${fixture.team_a?.team} vs ${fixture.team_b?.team}`,
      kickoff: fixture.kickoff?.eastern_datetime_label,
      advances_to: fixture.winner_advances_to?.bracket_slot_id
    }))
  };

  const report = `# World Cup R32 Fixtures Page QA v1

Generated: ${qa.generated_at}

Status: **${qa.status.toUpperCase()}**

${mdTable(["Check", "Status", "Detail"], checks.map((check) => [
  check.id,
  check.status,
  Array.isArray(check.detail) ? check.detail.join("; ") : check.detail === null ? "" : JSON.stringify(check.detail)
]))}

## R32 Fixtures

${mdTable(["Slot", "Source ID", "Fixture", "Kickoff", "Advances To"], qa.fixture_slots.map((fixture) => [
  fixture.slot,
  fixture.source_fixture_id,
  fixture.fixture,
  fixture.kickoff,
  fixture.advances_to
]))}
`;

  await writeJson("data/worldCupR32FixturesPageQa_v1.json", qa);
  await writeText("data/worldCupR32FixturesPageQaReport_v1.md", report);
  console.log(`data/worldCupR32FixturesPageQa_v1.json: ${qa.status}`);
  if (failures.length) {
    console.error(JSON.stringify(failures, null, 2));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
