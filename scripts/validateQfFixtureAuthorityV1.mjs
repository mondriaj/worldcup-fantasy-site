import { readFile, writeFile } from "node:fs/promises";

const authority = JSON.parse(await readFile("data/qfFixtureAuthority_v1.json", "utf8"));
const errors = [];
const fixtures = authority.fixtures || [];
const teamIds = fixtures.flatMap((fixture) => [fixture.team_a?.team_id, fixture.team_b?.team_id].filter(Boolean));
const duplicateTeams = teamIds.filter((teamId, index) => teamIds.indexOf(teamId) !== index);
const duplicateFixtures = fixtures
  .map((fixture) => [fixture.team_a?.team_id, fixture.team_b?.team_id].filter(Boolean).sort().join("|"))
  .filter((key, index, list) => key && list.indexOf(key) !== index);

if (authority.status !== "pass") errors.push(`QF authority status is ${authority.status}.`);
if (fixtures.length !== 4) errors.push(`Expected 4 QF fixtures, found ${fixtures.length}.`);
if (authority.summary?.completed_r16_fixtures_used !== 8) errors.push(`Expected 8 completed R16 fixtures used, found ${authority.summary?.completed_r16_fixtures_used}.`);
if (authority.summary?.incomplete_r16_fixtures !== 0) errors.push(`Expected 0 incomplete R16 fixtures, found ${authority.summary?.incomplete_r16_fixtures}.`);
if (fixtures.some((fixture) => fixture.classification !== "final_known")) errors.push("At least one QF fixture is not final_known.");
if (fixtures.some((fixture) => !fixture.team_a?.team_id || !fixture.team_b?.team_id)) errors.push("At least one QF fixture has TBD participants.");
if (duplicateTeams.length) errors.push(`Duplicate QF teams: ${[...new Set(duplicateTeams)].join(", ")}.`);
if (duplicateFixtures.length) errors.push(`Duplicate QF fixtures: ${[...new Set(duplicateFixtures)].join(", ")}.`);
if (fixtures.some((fixture) => !fixture.kickoff?.eastern_datetime_label)) errors.push("At least one QF fixture is missing a kickoff time label.");
if (fixtures.some((fixture) => !fixture.winner_advances_to?.bracket_slot_id)) errors.push("At least one QF fixture is missing a winner-advances-to slot.");

const qa = {
  schema_version: "qf_fixture_authority_qa_v1",
  generated_at: new Date().toISOString(),
  status: errors.length ? "fail" : "pass",
  summary: authority.summary,
  fixture_count: fixtures.length,
  teams: teamIds,
  errors
};

await writeFile("data/qfFixtureAuthorityQa_v1.json", `${JSON.stringify(qa, null, 2)}\n`, "utf8");

console.log(JSON.stringify({
  status: qa.status,
  fixture_count: qa.fixture_count,
  completed_r16_fixtures_used: qa.summary?.completed_r16_fixtures_used,
  errors
}, null, 2));

if (errors.length) process.exitCode = 1;
