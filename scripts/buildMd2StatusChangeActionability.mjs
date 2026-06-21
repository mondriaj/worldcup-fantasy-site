import { readFile, writeFile } from "node:fs/promises";

const PATHS = {
  officialPlayers: "data/officialFantasyPlayers_v0.json",
  livePlayers: "data/livePlayerStatus_v1.json",
  liveMatchday: "data/liveMatchdayStatus_v1.json",
  officialMonitor: "data/officialFantasyDataUpdateCheck_v1.json",
  outputJson: "data/md2StatusChangeActionability_v1.json",
  outputReport: "data/md2StatusChangeActionabilityReport_v1.md"
};

const GENERATED_AT = new Date().toISOString();

const STATUS_CHANGES = [
  { official_fantasy_player_id: "141", name: "Tarik Muharemovic", previous_status: "playing", expected_current_status: "suspended" },
  { official_fantasy_player_id: "245", name: "Ismaël Koné", previous_status: "playing", expected_current_status: "injured" },
  { official_fantasy_player_id: "741", name: "César Montes", previous_status: "suspended", expected_current_status: "playing" },
  { official_fantasy_player_id: "901", name: "Miguel Almirón", previous_status: "playing", expected_current_status: "suspended" },
  { official_fantasy_player_id: "947", name: "Assim Omer Al Haj Madibo", previous_status: "playing", expected_current_status: "suspended" },
  { official_fantasy_player_id: "1058", name: "Teboho Mokoena", previous_status: "playing", expected_current_status: "suspended" },
  { official_fantasy_player_id: "1062", name: "Sphephelo S'Miso Sithole", previous_status: "suspended", expected_current_status: "playing" },
  { official_fantasy_player_id: "1506", name: "Homam El Amin Mohamed Ahmed", previous_status: "playing", expected_current_status: "suspended" }
];

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function rowsFromJson(data, keys) {
  if (Array.isArray(data)) return data;
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
}

function fixtureStatusClass(fixture) {
  const status = String(fixture?.fixture_status || "").toLowerCase();
  if (["complete", "completed", "played"].includes(status)) return "completed";
  if (status === "playing") return "playing";
  if (status === "scheduled") return "scheduled/not started";
  return "unknown";
}

function scoreText(fixture) {
  if (!fixture || fixture.home_score === null || fixture.home_score === undefined || fixture.away_score === null || fixture.away_score === undefined) {
    return null;
  }
  return `${fixture.home_team || fixture.local_home_team} ${fixture.home_score}-${fixture.away_score} ${fixture.away_team || fixture.local_away_team}`;
}

function mdTable(headers, rows) {
  if (!rows.length) return "_None._";
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((value) => String(value ?? "")).join(" | ")} |`)
  ].join("\n");
}

function buildReport(artifact) {
  return [
    "# MD2 Status Change Actionability v1",
    "",
    `Generated: ${artifact.generated_at}`,
    "",
    `Status: ${artifact.status}`,
    "",
    "## Summary",
    "",
    mdTable(
      ["Metric", "Value"],
      [
        ["Tracked selectable-status changes", artifact.summary.tracked_status_changes],
        ["Imported current statuses matched expected", `${artifact.summary.expected_status_matches} / ${artifact.summary.tracked_status_changes}`],
        ["MD2 actionable changes", artifact.summary.md2_actionable_count],
        ["MD3-relevant only changes", artifact.summary.md3_relevant_only_count],
        ["Unknown/caution changes", artifact.summary.unknown_actionability_count],
        ["Official monitor status", artifact.summary.official_monitor_status],
        ["Official monitor rerun decision", artifact.summary.official_monitor_rerun_decision],
        ["Live completed fixtures", artifact.summary.completed_fixture_count],
        ["Live playing fixtures", artifact.summary.playing_fixture_count],
        ["Live scheduled fixtures", artifact.summary.scheduled_fixture_count]
      ]
    ),
    "",
    "## Actionability",
    "",
    mdTable(
      ["ID", "Player", "Team", "Status Change", "MD2 Fixture", "Fixture Status", "MD2 Actionable", "MD3 Defer"],
      artifact.players.map((row) => [
        row.official_fantasy_player_id,
        row.name,
        row.country,
        `${row.previous_status} -> ${row.current_selectable_status}`,
        row.md2_fixture?.label || "unknown",
        row.md2_fixture_status,
        row.md2_actionable ? "yes" : "no",
        row.defer_to_md3_model_rebuild ? "yes" : "no"
      ])
    ),
    "",
    "## Decision",
    "",
    artifact.decision.rebuild_md2_player_side_stack
      ? "At least one tracked status change is still actionable for a scheduled MD2 fixture. A targeted MD2 player-side rebuild is allowed."
      : "No tracked status changes are actionable for remaining MD2 decisions. Do not rebuild the MD2 player-side stack from these changes.",
    "",
    "## Notes",
    "",
    ...artifact.notes.map((note) => `- ${note}`),
    ""
  ].join("\n");
}

const [officialPlayersData, livePlayersData, liveMatchdayData, officialMonitor] = await Promise.all([
  readJson(PATHS.officialPlayers),
  readJson(PATHS.livePlayers),
  readJson(PATHS.liveMatchday),
  readJson(PATHS.officialMonitor)
]);

const officialPlayers = rowsFromJson(officialPlayersData, ["officialFantasyPlayers", "players", "data"]);
const livePlayers = rowsFromJson(livePlayersData, ["players", "data"]);
const liveFixtures = rowsFromJson(liveMatchdayData, ["fixtures", "data"]);
const officialById = new Map(officialPlayers.map((row) => [String(row.official_fantasy_player_id), row]));
const liveById = new Map(livePlayers.map((row) => [String(row.official_fantasy_player_id), row]));

const md2FixturesByTeamId = new Map();
for (const fixture of liveFixtures.filter((row) => String(row.round_id) === "2")) {
  for (const teamId of [fixture.home_squad_id, fixture.away_squad_id, fixture.live_home_squad_id, fixture.live_away_squad_id]) {
    if (teamId) md2FixturesByTeamId.set(String(teamId), fixture);
  }
}

const players = STATUS_CHANGES.map((change) => {
  const official = officialById.get(change.official_fantasy_player_id);
  const live = liveById.get(change.official_fantasy_player_id);
  const teamId = String(official?.team_id || official?.squad_id || live?.team_id || live?.squad_id || "");
  const fixture = teamId ? md2FixturesByTeamId.get(teamId) : null;
  const statusClass = fixtureStatusClass(fixture);
  const md2Actionable = statusClass === "scheduled/not started";
  const caution = !official || !fixture || statusClass === "unknown";

  return {
    official_fantasy_player_id: change.official_fantasy_player_id,
    name: official?.name || live?.name || change.name,
    country: official?.country || live?.team_name || null,
    team_id: teamId || null,
    previous_status: change.previous_status,
    expected_current_status: change.expected_current_status,
    current_selectable_status: official?.selectable_status || live?.status || null,
    live_selectable_status: live?.status || null,
    status_matches_expected: (official?.selectable_status || live?.status || null) === change.expected_current_status,
    md2_fixture: fixture
      ? {
          match_number: fixture.match_number,
          fixture_id: fixture.local_fixture_id || fixture.match_id || fixture.resolved_local_fixture_key,
          label: `${fixture.local_home_team || fixture.home_team} vs ${fixture.local_away_team || fixture.away_team}`,
          kickoff: fixture.date || null,
          score: scoreText(fixture)
        }
      : null,
    md2_fixture_status: statusClass,
    md2_actionable: md2Actionable,
    defer_to_md3_model_rebuild: statusClass === "completed" || statusClass === "playing",
    caution: caution ? "unknown_or_missing_fixture_status_do_not_rebuild_silently" : null
  };
});

const md2Actionable = players.filter((row) => row.md2_actionable);
const md3Only = players.filter((row) => row.defer_to_md3_model_rebuild);
const unknown = players.filter((row) => row.caution);
const statusMismatches = players.filter((row) => !row.status_matches_expected);

const artifact = {
  schema_version: "md2_status_change_actionability_v1",
  generated_at: GENERATED_AT,
  status: !statusMismatches.length && !unknown.length ? "passed" : "needs_review",
  files: PATHS,
  summary: {
    tracked_status_changes: players.length,
    expected_status_matches: players.length - statusMismatches.length,
    md2_actionable_count: md2Actionable.length,
    md3_relevant_only_count: md3Only.length,
    unknown_actionability_count: unknown.length,
    official_monitor_status: officialMonitor.monitor_status || null,
    official_monitor_rerun_decision: officialMonitor.recommendation?.rerun_decision || officialMonitor.summary?.rerun_decision || null,
    completed_fixture_count: liveMatchdayData.summary?.completed_fixture_count ?? null,
    playing_fixture_count: liveMatchdayData.summary?.playing_fixture_count ?? null,
    scheduled_fixture_count: liveMatchdayData.summary?.scheduled_fixture_count ?? null
  },
  decision: {
    rebuild_md2_player_side_stack: md2Actionable.length > 0,
    rebuild_score_model_v4: false,
    score_model_v4_reason: "Tracked changes are player selectable-status changes only; score, fixture, team-quality, and scoring-rule inputs did not change.",
    skip_reason: md2Actionable.length
      ? null
      : "All tracked status changes map to completed MD2 fixtures, so users cannot still act on those MD2 fixtures."
  },
  players,
  md2_actionable_players: md2Actionable,
  md3_relevant_only_players: md3Only,
  unknown_actionability_players: unknown,
  notes: [
    "Ownership movement is not used as model signal.",
    "Completed or playing MD2 fixture changes are recorded for MD3 preparation only.",
    "Scheduled/not-started MD2 fixture changes are the only status changes allowed to trigger a targeted MD2 player-side rebuild.",
    "This artifact does not claim source-backed final squads."
  ]
};

await writeFile(PATHS.outputJson, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
await writeFile(PATHS.outputReport, buildReport(artifact), "utf8");

console.log(JSON.stringify({
  status: artifact.status,
  output_json: PATHS.outputJson,
  output_report: PATHS.outputReport,
  md2_actionable_count: artifact.summary.md2_actionable_count,
  md3_relevant_only_count: artifact.summary.md3_relevant_only_count,
  expected_status_matches: `${artifact.summary.expected_status_matches}/${artifact.summary.tracked_status_changes}`
}, null, 2));

if (artifact.status !== "passed") {
  process.exitCode = 1;
}
