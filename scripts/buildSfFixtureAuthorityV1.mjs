import { readFile, writeFile } from "node:fs/promises";

const GENERATED_AT = new Date().toISOString();

function hasValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function slug(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, "-");
}

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

function fixtureId(matchNumber) {
  return `fwc2026-m${String(matchNumber).padStart(3, "0")}`;
}

function easternLabel(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const dateText = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Toronto",
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
  const timeText = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Toronto",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).format(date);
  return `${dateText} · ${timeText} ET`;
}

function scoreLabel(fixture, live) {
  const homeScore = Number(live.home_score);
  const awayScore = Number(live.away_score);
  const homePens = Number(live.home_penalty_score || 0);
  const awayPens = Number(live.away_penalty_score || 0);
  const penaltyText = homeScore === awayScore && (homePens || awayPens)
    ? `, ${homePens}-${awayPens} pens`
    : "";
  return `${fixture.team_a?.code || fixture.team_a?.team} ${homeScore}-${awayScore} ${fixture.team_b?.code || fixture.team_b?.team}${penaltyText}`;
}

function liveIsFinal(live) {
  const status = String(live?.fixture_status || "").toLowerCase();
  return ["complete", "completed", "played"].includes(status) &&
    live?.safe_to_display_score === true &&
    Number.isFinite(Number(live.home_score)) &&
    Number.isFinite(Number(live.away_score));
}

function qfResult(fixture, liveRows) {
  const live = liveRows.find((row) =>
    row.local_fixture_id === fixture.fixture_id ||
    Number(row.match_number) === Number(fixture.bracket_match_number)
  );

  if (!liveIsFinal(live)) {
    return {
      match_number: Number(fixture.bracket_match_number),
      fixture_id: fixture.fixture_id,
      status: live?.fixture_status || "missing",
      score_status: live?.score_status || "not_final",
      winner: null,
      loser: null,
      score: null
    };
  }

  const homeScore = Number(live.home_score);
  const awayScore = Number(live.away_score);
  const homePens = Number(live.home_penalty_score || 0);
  const awayPens = Number(live.away_penalty_score || 0);
  const homeWins = homeScore > awayScore || (homeScore === awayScore && (homePens || awayPens) && homePens > awayPens);
  return {
    match_number: Number(fixture.bracket_match_number),
    fixture_id: fixture.fixture_id,
    status: "complete",
    score_status: "final",
    winner: homeWins ? fixture.team_a : fixture.team_b,
    loser: homeWins ? fixture.team_b : fixture.team_a,
    score: {
      home_score: homeScore,
      away_score: awayScore,
      home_penalty_score: live.home_penalty_score,
      away_penalty_score: live.away_penalty_score,
      label: scoreLabel(fixture, live)
    },
    source_fixture_id: live.source_fixture_id || fixture.source_fixture_id || null
  };
}

function liveBySfPair(liveRows) {
  const out = new Map();
  for (const row of liveRows.filter((fixture) => String(fixture.round_id) === "7")) {
    const home = slug(row.live_home_team || row.home_team);
    const away = slug(row.live_away_team || row.away_team);
    if (home && away) {
      out.set(`${home}|${away}`, { row, reversed: false });
      out.set(`${away}|${home}`, { row, reversed: true });
    }
  }
  return out;
}

function fixtureFromSources({ matchNumber, sourceA, sourceB, liveInfo }) {
  const teamA = sourceA?.winner || null;
  const teamB = sourceB?.winner || null;
  const live = liveInfo?.row || null;
  const complete = Boolean(teamA && teamB);
  return {
    official_bracket_slot: `M${matchNumber}`,
    bracket_match_number: matchNumber,
    bracket_slot_id: `M${matchNumber}`,
    fixture_id: fixtureId(matchNumber),
    source_fixture_id: live?.source_fixture_id || null,
    source_fixture_id_role: live ? "feed_source_id_only_not_bracket_slot" : null,
    round: "SF",
    stage: "semifinal",
    classification: complete ? "final_known" : "blocked",
    status: complete ? "final_known" : "blocked",
    public_label: complete ? "Final" : "Blocked",
    team_a: teamA,
    team_b: teamB,
    pending_sources: [sourceA, sourceB]
      .filter((source) => !source?.winner)
      .map((source) => ({
        source_match: `M${source?.match_number || "unknown"}`,
        fixture_status: source?.status || "missing",
        score_status: source?.score_status || "missing"
      })),
    source_matches: [sourceA, sourceB].map((source) => ({
      source_match: `M${source?.match_number || "unknown"}`,
      winner: source?.winner || null,
      loser: source?.loser || null,
      status: source?.status || "missing",
      score_status: source?.score_status || "missing",
      score: source?.score || null
    })),
    kickoff: {
      source_datetime: live?.date || null,
      eastern_datetime_label: easternLabel(live?.date)
    },
    venue: live ? {
      name: live.venue_name || null,
      city: live.venue_city || null
    } : null,
    bracket_path: matchNumber === 101 ? "Winner Match 97 v Winner Match 98" : "Winner Match 99 v Winner Match 100",
    winner_advances_to: {
      bracket_slot_id: "M104",
      fixture_id: "fwc2026-m104",
      round: "Final",
      path: "Winner Match 101 v Winner Match 102"
    },
    loser_advances_to: {
      bracket_slot_id: "M103",
      fixture_id: "fwc2026-m103",
      round: "Third Place",
      path: "Loser Match 101 v Loser Match 102"
    },
    source_confidence: complete
      ? "final_qf_winners_mapped_to_official_sf_bracket_slot"
      : "blocked_pending_qf_source_match_not_final",
    public_note: complete
      ? "Final SF fixture from completed QF winners."
      : "Blocked: all source QF fixtures must be final before SF promotion."
  };
}

function mdTable(headers, rows) {
  if (!rows.length) return "_None._";
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((value) => String(value ?? "")).join(" | ")} |`)
  ].join("\n");
}

async function main() {
  const qfAuthority = await readJson("data/qfFixtureAuthority_v1.json");
  const live = await readJson("data/liveMatchdayStatus_v1.json");
  const liveRows = rowsFromJson(live, ["fixtures"]);
  const qfFixtures = rowsFromJson(qfAuthority, ["fixtures"]);
  const qfResults = new Map(qfFixtures.map((fixture) => [Number(fixture.bracket_match_number), qfResult(fixture, liveRows)]));
  const sfLiveByPair = liveBySfPair(liveRows);
  const sourcePairs = [
    [101, qfResults.get(97), qfResults.get(98)],
    [102, qfResults.get(99), qfResults.get(100)]
  ];
  const fixtures = sourcePairs.map(([matchNumber, sourceA, sourceB]) => {
    const teamA = sourceA?.winner;
    const teamB = sourceB?.winner;
    const liveInfo = teamA && teamB ? sfLiveByPair.get(`${teamA.team_id}|${teamB.team_id}`) : null;
    return fixtureFromSources({ matchNumber, sourceA, sourceB, liveInfo });
  });
  const qaErrors = [];
  const completedQf = [...qfResults.values()].filter((result) => result?.winner);
  const sfTeams = fixtures.flatMap((fixture) => [fixture.team_a?.team_id, fixture.team_b?.team_id].filter(Boolean));
  const duplicateTeams = sfTeams.filter((teamId, index, list) => teamId && list.indexOf(teamId) !== index);
  const duplicateFixtures = fixtures
    .map((fixture) => [fixture.team_a?.team_id, fixture.team_b?.team_id].filter(Boolean).sort().join("|"))
    .filter((key, index, list) => key && list.indexOf(key) !== index);

  if (qfFixtures.length !== 4) qaErrors.push(`Expected 4 QF authority fixtures, found ${qfFixtures.length}.`);
  if (completedQf.length !== 4) qaErrors.push(`SF refresh requires 4 completed QF winners; found ${completedQf.length}.`);
  if (fixtures.length !== 2) qaErrors.push(`Expected 2 SF fixtures, found ${fixtures.length}.`);
  if (fixtures.some((fixture) => fixture.classification !== "final_known")) qaErrors.push("SF authority has blocked fixtures.");
  if (fixtures.some((fixture) => !fixture.team_a || !fixture.team_b)) qaErrors.push("SF authority contains TBD teams.");
  if (fixtures.some((fixture) => !fixture.kickoff?.source_datetime)) qaErrors.push("SF authority is missing kickoff times.");
  if (duplicateTeams.length) qaErrors.push(`Duplicate SF team(s): ${[...new Set(duplicateTeams)].join(", ")}.`);
  if (duplicateFixtures.length) qaErrors.push(`Duplicate SF fixture(s): ${[...new Set(duplicateFixtures)].join(", ")}.`);
  for (const result of completedQf) {
    const appears = fixtures.some((fixture) =>
      [fixture.team_a?.team_id, fixture.team_b?.team_id].includes(result.winner.team_id)
    );
    if (!appears) qaErrors.push(`Completed QF winner ${result.winner.team} from M${result.match_number} is missing from SF authority.`);
  }

  const authority = {
    schema_version: "sf_fixture_authority_v1",
    generated_at: GENERATED_AT,
    status: qaErrors.length ? "blocked" : "pass",
    release_status: "final_sf_setup",
    evidence_scope: "All 4 completed/final QF fixtures.",
    source_files: {
      qfFixtureAuthority: "data/qfFixtureAuthority_v1.json",
      liveMatchdayStatus: "data/liveMatchdayStatus_v1.json",
      worldCupData: "worldCupData.js"
    },
    summary: {
      total_sf_fixtures: fixtures.length,
      final_known: fixtures.filter((fixture) => fixture.classification === "final_known").length,
      blocked: qaErrors.length,
      completed_qf_fixtures_used: completedQf.length,
      incomplete_qf_fixtures: 4 - completedQf.length,
      scheduled_sf_fixtures: liveRows.filter((row) => String(row.round_id) === "7" && String(row.fixture_status).toLowerCase() === "scheduled").length,
      final_sf_participants: sfTeams.length
    },
    fixtures,
    qa: {
      status: qaErrors.length ? "fail" : "pass",
      errors: qaErrors,
      warnings: []
    }
  };

  const report = [
    "# SF Fixture Authority v1",
    "",
    `Generated: ${authority.generated_at}`,
    "",
    `Status: ${authority.status}`,
    "",
    mdTable(["Slot", "Team A", "Team B", "Kickoff", "Winner Advances", "Loser Advances"], fixtures.map((fixture) => [
      fixture.bracket_slot_id,
      fixture.team_a?.team || "TBD",
      fixture.team_b?.team || "TBD",
      fixture.kickoff?.eastern_datetime_label || "",
      fixture.winner_advances_to?.bracket_slot_id || "",
      fixture.loser_advances_to?.bracket_slot_id || ""
    ])),
    "",
    "## Source QF Results",
    "",
    mdTable(["QF", "Winner", "Loser", "Score"], [...qfResults.values()].map((row) => [
      `M${row.match_number}`,
      row.winner?.team || "TBD",
      row.loser?.team || "TBD",
      row.score?.label || row.score_status
    ]))
  ].join("\n");

  await writeFile("data/sfFixtureAuthority_v1.json", `${JSON.stringify(authority, null, 2)}\n`, "utf8");
  await writeFile("data/sfFixtureAuthorityReport_v1.md", `${report}\n`, "utf8");
  await writeFile("sfFixtureAuthorityData.js", [
    "// Generated by scripts/buildSfFixtureAuthorityV1.mjs.",
    `window.SF_FIXTURE_AUTHORITY_DATA = ${JSON.stringify(authority)};`,
    ""
  ].join("\n"), "utf8");

  console.log(JSON.stringify({
    status: authority.status,
    fixture_count: fixtures.length,
    completed_qf_fixtures_used: authority.summary.completed_qf_fixtures_used,
    incomplete_qf_fixtures: authority.summary.incomplete_qf_fixtures,
    sf_fixtures: fixtures.map((fixture) => `${fixture.team_a?.team} vs ${fixture.team_b?.team}`)
  }, null, 2));

  if (qaErrors.length) process.exitCode = 1;
}

await main();
