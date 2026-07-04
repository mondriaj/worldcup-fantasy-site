import { readFile, writeFile } from "node:fs/promises";

const GENERATED_AT = new Date().toISOString();
const authority = JSON.parse(await readFile("data/r16FixtureAuthority_v1.json", "utf8"));
const errors = [];
const fixtures = Array.isArray(authority.fixtures) ? authority.fixtures : [];

if (authority.status !== "pass") errors.push(`Authority status is ${authority.status}.`);
if (fixtures.length !== 8) errors.push(`Expected 8 R16 fixtures, found ${fixtures.length}.`);
if (authority.summary?.completed_r32_fixtures_used !== 16) errors.push(`Expected 16 completed R32 fixtures, found ${authority.summary?.completed_r32_fixtures_used}.`);
if (authority.summary?.incomplete_r32_fixtures !== 0) errors.push(`Expected 0 incomplete R32 fixtures, found ${authority.summary?.incomplete_r32_fixtures}.`);
if (fixtures.some((fixture) => fixture.classification !== "final_known")) errors.push("One or more R16 fixtures are not final_known.");
if (fixtures.some((fixture) => !fixture.team_a?.team_id || !fixture.team_b?.team_id)) errors.push("One or more R16 fixtures has a missing team.");
if (fixtures.some((fixture) => /TBD|Conditional|Pending/i.test(`${fixture.team_a?.team || ""} ${fixture.team_b?.team || ""} ${fixture.public_label || ""}`))) errors.push("TBD/conditional/pending text appears in final R16 authority.");

const slotIds = fixtures.map((fixture) => fixture.bracket_slot_id);
if (new Set(slotIds).size !== slotIds.length) errors.push("Duplicate R16 fixture slot appears.");

const teams = fixtures.flatMap((fixture) => [fixture.team_a?.team_id, fixture.team_b?.team_id].filter(Boolean));
if (new Set(teams).size !== teams.length) errors.push("Duplicate R16 team appears.");
if (fixtures.some((fixture) => [fixture.team_a?.team_id, fixture.team_b?.team_id].includes("france") && [fixture.team_a?.team_id, fixture.team_b?.team_id].includes("argentina"))) {
  errors.push("France/Argentina impossible early R16 path appears.");
}

const qa = {
  schema_version: "r16_fixture_authority_qa_v1",
  generated_at: GENERATED_AT,
  status: errors.length ? "fail" : "pass",
  summary: {
    fixture_count: fixtures.length,
    completed_r32_fixtures_used: authority.summary?.completed_r32_fixtures_used,
    incomplete_r32_fixtures: authority.summary?.incomplete_r32_fixtures
  },
  errors
};

await writeFile("data/r16FixtureAuthorityQa_v1.json", `${JSON.stringify(qa, null, 2)}\n`, "utf8");
await writeFile("data/r16FixtureAuthorityQaReport_v1.md", [
  "# R16 Fixture Authority QA v1",
  "",
  `Generated: ${qa.generated_at}`,
  "",
  `Status: ${qa.status}`,
  "",
  "## Errors",
  "",
  errors.length ? errors.map((error) => `- ${error}`).join("\n") : "None",
  ""
].join("\n"), "utf8");

console.log(JSON.stringify({ status: qa.status, errors }, null, 2));
if (errors.length) process.exitCode = 1;
