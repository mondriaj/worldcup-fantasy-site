import { readFile, writeFile } from "node:fs/promises";

const CHECKED_AT = new Date().toISOString();

function rowsFromJson(data, keys) {
  if (Array.isArray(data)) return data;
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function mdList(items) {
  return items.length ? items.map((item) => `- ${item}`).join("\n") : "_None._";
}

function qfWinner(fixture, liveRows) {
  const live = liveRows.find((row) =>
    row.local_fixture_id === fixture.fixture_id ||
    Number(row.match_number) === Number(fixture.bracket_match_number)
  );
  const final = ["complete", "completed", "played"].includes(String(live?.fixture_status || "").toLowerCase()) &&
    live?.safe_to_display_score === true &&
    Number.isFinite(Number(live.home_score)) &&
    Number.isFinite(Number(live.away_score));
  if (!final) return null;
  const homeScore = Number(live.home_score);
  const awayScore = Number(live.away_score);
  const homePens = Number(live.home_penalty_score || 0);
  const awayPens = Number(live.away_penalty_score || 0);
  const homeWins = homeScore > awayScore || (homeScore === awayScore && (homePens || awayPens) && homePens > awayPens);
  return homeWins ? fixture.team_a : fixture.team_b;
}

async function main() {
  const [authority, qfAuthority, live] = await Promise.all([
    readJson("data/sfFixtureAuthority_v1.json"),
    readJson("data/qfFixtureAuthority_v1.json"),
    readJson("data/liveMatchdayStatus_v1.json")
  ]);
  const fixtures = rowsFromJson(authority, ["fixtures"]);
  const qfFixtures = rowsFromJson(qfAuthority, ["fixtures"]);
  const liveRows = rowsFromJson(live, ["fixtures"]);
  const expectedWinners = qfFixtures.map((fixture) => qfWinner(fixture, liveRows)).filter(Boolean);
  const sfTeams = fixtures.flatMap((fixture) => [fixture.team_a, fixture.team_b].filter(Boolean));
  const sfTeamIds = sfTeams.map((team) => team.team_id);
  const duplicateTeams = sfTeamIds.filter((teamId, index, list) => teamId && list.indexOf(teamId) !== index);
  const duplicateFixtures = fixtures
    .map((fixture) => [fixture.team_a?.team_id, fixture.team_b?.team_id].filter(Boolean).sort().join("|"))
    .filter((key, index, list) => key && list.indexOf(key) !== index);
  const errors = [];

  if (authority.status !== "pass") errors.push(`SF authority status is ${authority.status}, expected pass.`);
  if (fixtures.length !== 2) errors.push(`Expected 2 SF fixtures, found ${fixtures.length}.`);
  if (expectedWinners.length !== 4) errors.push(`Expected 4 completed QF winners, found ${expectedWinners.length}.`);
  if (sfTeams.length !== 4) errors.push(`Expected 4 final SF participants, found ${sfTeams.length}.`);
  if (fixtures.some((fixture) => fixture.classification !== "final_known" || fixture.status !== "final_known")) {
    errors.push("At least one SF fixture is not final_known.");
  }
  if (fixtures.some((fixture) => !fixture.team_a || !fixture.team_b)) errors.push("At least one SF fixture has a TBD participant.");
  if (fixtures.some((fixture) => !fixture.kickoff?.source_datetime)) errors.push("At least one SF fixture is missing kickoff time.");
  if (duplicateTeams.length) errors.push(`Duplicate SF team(s): ${[...new Set(duplicateTeams)].join(", ")}.`);
  if (duplicateFixtures.length) errors.push(`Duplicate SF fixture(s): ${[...new Set(duplicateFixtures)].join(", ")}.`);

  for (const winner of expectedWinners) {
    if (!sfTeamIds.includes(winner.team_id)) {
      errors.push(`QF winner ${winner.team} is missing from SF authority.`);
    }
  }

  const expectedSlots = new Map([
    ["M101", ["france", "spain"]],
    ["M102", ["england", "argentina"]]
  ]);
  for (const fixture of fixtures) {
    const expected = expectedSlots.get(fixture.bracket_slot_id);
    const observed = [fixture.team_a?.team_id, fixture.team_b?.team_id].filter(Boolean);
    if (expected && expected.some((teamId) => !observed.includes(teamId))) {
      errors.push(`${fixture.bracket_slot_id} has ${observed.join(" v ")}, expected ${expected.join(" v ")}.`);
    }
    if (fixture.winner_advances_to?.bracket_slot_id !== "M104") errors.push(`${fixture.bracket_slot_id} winner path does not advance to M104.`);
    if (fixture.loser_advances_to?.bracket_slot_id !== "M103") errors.push(`${fixture.bracket_slot_id} loser path does not advance to M103.`);
  }

  const qa = {
    schema_version: "sf_fixture_authority_qa_v1",
    generated_at: CHECKED_AT,
    status: errors.length ? "fail" : "pass",
    summary: {
      sf_fixture_count: fixtures.length,
      qf_winners_used: expectedWinners.length,
      final_sf_participants: sfTeams.length,
      duplicate_team_count: [...new Set(duplicateTeams)].length,
      duplicate_fixture_count: [...new Set(duplicateFixtures)].length
    },
    fixtures: fixtures.map((fixture) => ({
      slot: fixture.bracket_slot_id,
      teams: [fixture.team_a?.team, fixture.team_b?.team].filter(Boolean).join(" vs "),
      kickoff: fixture.kickoff?.eastern_datetime_label || null,
      winner_advances_to: fixture.winner_advances_to?.bracket_slot_id || null,
      loser_advances_to: fixture.loser_advances_to?.bracket_slot_id || null
    })),
    errors
  };
  const report = [
    "# SF Fixture Authority QA v1",
    "",
    `Generated: ${CHECKED_AT}`,
    "",
    `Status: ${qa.status}`,
    "",
    "## Errors",
    "",
    mdList(errors)
  ].join("\n");

  await writeFile("data/sfFixtureAuthorityQa_v1.json", `${JSON.stringify(qa, null, 2)}\n`, "utf8");
  await writeFile("data/sfFixtureAuthorityQaReport_v1.md", `${report}\n`, "utf8");
  console.log(JSON.stringify({ status: qa.status, summary: qa.summary, errors }, null, 2));
  if (errors.length) process.exitCode = 1;
}

await main();
