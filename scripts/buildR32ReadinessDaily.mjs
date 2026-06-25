import { readFile, writeFile } from "node:fs/promises";
import vm from "node:vm";

const PATHS = {
  worldCupData: "worldCupData.js",
  liveMatchday: "data/liveMatchdayStatus_v1.json",
  livePlayers: "data/livePlayerStatus_v1.json",
  officialPlayers: "data/officialFantasyPlayers_v0.json",
  roleModel: "data/playerRoleModel_md3_v3.json",
  projections: "data/fantasyPoolMatchdayProjections_md3_v5.json",
  readinessJson: "data/r32ReadinessDaily_v1.json",
  readinessReport: "data/r32ReadinessDailyReport_v1.md",
  qualifiedTeamsStagingJson: "data/r32QualifiedTeamsStaging_v1.json",
  qualifiedTeamsStagingReport: "data/r32QualifiedTeamsStagingReport_v1.md",
  playerReadinessStagingJson: "data/r32PlayerReadinessStaging_v1.json",
  playerReadinessStagingReport: "data/r32PlayerReadinessStagingReport_v1.md"
};

const GENERATED_AT = new Date().toISOString();
const FINAL_STATUSES = new Set(["complete", "completed", "played"]);

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function teamKey(value) {
  return normalizeText(value).replace(/\s+/g, "-");
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

async function readWorldCupData() {
  const sandbox = { window: {} };
  sandbox.globalThis = sandbox;
  sandbox.window.window = sandbox.window;
  vm.runInNewContext(await readFile(PATHS.worldCupData, "utf8"), sandbox, { filename: PATHS.worldCupData });
  return sandbox.window.WORLD_CUP_DATA;
}

function mdTable(headers, rows) {
  if (!rows.length) return "_None._";
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((value) => String(value ?? "")).join(" | ")} |`)
  ].join("\n");
}

function statusCounts(rows, getStatus) {
  return rows.reduce((counts, row) => {
    const status = getStatus(row) || "unknown";
    counts[status] = (counts[status] || 0) + 1;
    return counts;
  }, {});
}

function newStanding(team, group) {
  return {
    team,
    team_id: teamKey(team),
    group,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goals_for: 0,
    goals_against: 0,
    goal_difference: 0,
    points: 0
  };
}

function applyResult(table, fixture, homeScore, awayScore) {
  const home = table.get(fixture.team_1);
  const away = table.get(fixture.team_2);
  home.played += 1;
  away.played += 1;
  home.goals_for += homeScore;
  home.goals_against += awayScore;
  away.goals_for += awayScore;
  away.goals_against += homeScore;
  if (homeScore > awayScore) {
    home.wins += 1;
    away.losses += 1;
    home.points += 3;
  } else if (awayScore > homeScore) {
    away.wins += 1;
    home.losses += 1;
    away.points += 3;
  } else {
    home.draws += 1;
    away.draws += 1;
    home.points += 1;
    away.points += 1;
  }
  home.goal_difference = home.goals_for - home.goals_against;
  away.goal_difference = away.goals_for - away.goals_against;
}

function sortStandings(rows) {
  return [...rows].sort((a, b) =>
    b.points - a.points ||
    b.goal_difference - a.goal_difference ||
    b.goals_for - a.goals_for ||
    a.team.localeCompare(b.team)
  );
}

function isSafeFinalFixture(fixture) {
  return FINAL_STATUSES.has(String(fixture?.fixture_status || "").toLowerCase()) &&
    fixture?.safe_to_display_score === true &&
    fixture?.local_fixture_id;
}

function fixtureLabel(fixture) {
  return `${fixture.local_home_team || fixture.home_team || fixture.live_home_team} vs ${fixture.local_away_team || fixture.away_team || fixture.live_away_team}`;
}

function playerRoundPoints(player, roundId) {
  const value = Number(player?.stats?.roundPoints?.[roundId]);
  return Number.isFinite(value) ? value : null;
}

function r32Report(readiness) {
  return [
    "# R32 Readiness Daily Report v1",
    "",
    `Generated: ${readiness.generated_at}`,
    "",
    "## Summary",
    "",
    mdTable(
      ["Metric", "Value"],
      [
        ["Completed MD3 fixtures", readiness.summary.completed_md3_fixtures],
        ["Complete groups", readiness.summary.complete_groups],
        ["Safe top-two qualifiers from complete groups", readiness.summary.safe_top_two_qualifiers],
        ["Official R32 source fixtures", readiness.summary.official_r32_source_fixtures],
        ["R32 staging safe today", readiness.summary.r32_staging_safe_today ? "partial official-source staging only" : "no"],
        ["Public promotion blocked", readiness.summary.r32_public_promotion_blocked ? "yes" : "no"]
      ]
    ),
    "",
    "## Groups",
    "",
    mdTable(
      ["Group", "Completed", "Safe Qualified", "Still Uncertain", "Safe Eliminated"],
      readiness.groups.map((group) => [
        group.group,
        `${group.completed_fixtures}/6`,
        group.safe_qualified.map((row) => row.team).join(", ") || "none",
        group.still_uncertain.map((row) => row.team).join(", ") || "none",
        group.safe_eliminated.map((row) => row.team).join(", ") || "none"
      ])
    ),
    "",
    "## Official R32 Source Fixtures",
    "",
    mdTable(
      ["Source Fixture", "Status", "Fixture", "Date"],
      readiness.official_r32_source_fixtures.map((fixture) => [
        fixture.source_fixture_id,
        fixture.fixture_status,
        fixture.fixture,
        fixture.date
      ])
    ),
    "",
    "## Top Completed-MD3 Form",
    "",
    mdTable(
      ["Player", "Team", "Status", "Pts", "Match Status"],
      readiness.top_md3_form_players.slice(0, 15).map((player) => [
        player.name,
        player.team,
        player.selectable_status,
        player.round3_points,
        player.match_status || "none"
      ])
    ),
    "",
    "## Notes",
    "",
    readiness.notes.map((note) => `- ${note}`).join("\n"),
    ""
  ].join("\n");
}

function qualifiedTeamsReport(staging) {
  return [
    "# R32 Qualified Teams Staging v1",
    "",
    `Generated: ${staging.generated_at}`,
    "",
    `Status: ${staging.status}`,
    "",
    "## Official Source Fixtures",
    "",
    mdTable(
      ["Fixture", "Home", "Away", "Source", "Public"],
      staging.official_r32_fixtures.map((fixture) => [
        fixture.fixture,
        fixture.home_team,
        fixture.away_team,
        fixture.source_fixture_id,
        fixture.public_promotion
      ])
    ),
    "",
    "## Safe Top-Two Group Qualifiers",
    "",
    mdTable(
      ["Group", "Team", "Seed Type", "Basis"],
      staging.safe_group_qualifiers.map((row) => [
        row.group,
        row.team,
        row.seed_type,
        row.basis
      ])
    ),
    "",
    "Public promotion remains blocked.",
    ""
  ].join("\n");
}

function playerReadinessReport(staging) {
  return [
    "# R32 Player Readiness Staging v1",
    "",
    `Generated: ${staging.generated_at}`,
    "",
    `Status: ${staging.status}`,
    "",
    "## Team Status",
    "",
    mdTable(
      ["Team", "Official Players", "Playing", "Suspended", "Injured", "Transferred"],
      staging.team_status.map((team) => [
        team.team,
        team.official_player_count,
        team.selectable_status_counts.playing || 0,
        team.selectable_status_counts.suspended || 0,
        team.selectable_status_counts.injured || 0,
        team.selectable_status_counts.transferred || 0
      ])
    ),
    "",
    "## Top R32-Staging Team MD3 Form",
    "",
    mdTable(
      ["Player", "Team", "Pts", "Status", "Match Status"],
      staging.top_md3_form_players.map((player) => [
        player.name,
        player.team,
        player.round3_points,
        player.selectable_status,
        player.match_status || "none"
      ])
    ),
    "",
    "## New Player Note",
    "",
    staging.new_player_notes.map((note) => `- ${note}`).join("\n"),
    ""
  ].join("\n");
}

const [worldCupData, liveMatchday, livePlayers, officialPlayersData, roleModel, projections] = await Promise.all([
  readWorldCupData(),
  readJson(PATHS.liveMatchday),
  readJson(PATHS.livePlayers),
  readJson(PATHS.officialPlayers),
  readJson(PATHS.roleModel),
  readJson(PATHS.projections)
]);

const localFixtures = (worldCupData?.fixtures || []).filter((fixture) => fixture.stage === "group");
const localByMatch = new Map(localFixtures.map((fixture) => [Number(fixture.match_number), fixture]));
const liveFixtures = liveMatchday.fixtures || [];
const safeCompletedGroupFixtures = liveFixtures
  .filter(isSafeFinalFixture)
  .map((fixture) => ({
    live: fixture,
    local: localByMatch.get(Number(fixture.match_number))
  }))
  .filter((row) => row.local);
const completedMd3Fixtures = safeCompletedGroupFixtures
  .filter((row) => String(row.live.round_id) === "3");
const groups = [...new Set(localFixtures.map((fixture) => fixture.group))].sort();
const groupReports = [];
const safeGroupQualifiers = [];
const safeEliminated = [];

for (const group of groups) {
  const fixtures = localFixtures.filter((fixture) => fixture.group === group);
  const table = new Map();
  fixtures.forEach((fixture) => {
    if (!table.has(fixture.team_1)) table.set(fixture.team_1, newStanding(fixture.team_1, group));
    if (!table.has(fixture.team_2)) table.set(fixture.team_2, newStanding(fixture.team_2, group));
  });
  const completed = safeCompletedGroupFixtures.filter((row) => row.local.group === group);
  completed.forEach((row) => applyResult(table, row.local, Number(row.live.home_score), Number(row.live.away_score)));
  const standings = sortStandings([...table.values()]);
  const complete = completed.length === 6;
  const qualified = complete ? standings.slice(0, 2).map((row, index) => ({
    ...row,
    seed_type: index === 0 ? "group_winner_or_tiebreaker_leader" : "group_runner_up_or_tiebreaker_second",
    basis: "complete_group_top_two_standings"
  })) : [];
  const eliminated = complete ? standings.slice(3).map((row) => ({
    ...row,
    basis: "complete_group_fourth_place_not_in_best_third_pool"
  })) : [];
  const uncertain = complete ? standings.slice(2, 3) : standings;
  safeGroupQualifiers.push(...qualified);
  safeEliminated.push(...eliminated);
  groupReports.push({
    group,
    completed_fixtures: completed.length,
    group_complete: complete,
    standings,
    safe_qualified: qualified,
    safe_eliminated: eliminated,
    still_uncertain: uncertain
  });
}

const officialFantasyPlayers = rowsFromJson(officialPlayersData, ["officialFantasyPlayers", "players"]);
const officialByTeamId = new Map();
officialFantasyPlayers.forEach((player) => {
  const teamId = String(player.team_id || "");
  if (!officialByTeamId.has(teamId)) officialByTeamId.set(teamId, []);
  officialByTeamId.get(teamId).push(player);
});

const completedMd3TeamIds = new Set(completedMd3Fixtures.flatMap(({ live }) => [
  String(live.home_squad_id),
  String(live.away_squad_id)
]));
const livePlayersRows = livePlayers.players || [];
const topMd3FormPlayers = livePlayersRows
  .filter((player) => completedMd3TeamIds.has(String(player.team_id || player.squad_id || "")))
  .map((player) => ({
    official_fantasy_player_id: player.official_fantasy_player_id,
    name: player.name,
    team: player.team_name,
    team_id: String(player.team_id || player.squad_id || ""),
    position: player.position,
    selectable_status: player.status,
    match_status: player.matchStatus || null,
    round3_points: playerRoundPoints(player, "3")
  }))
  .filter((player) => Number.isFinite(player.round3_points))
  .sort((a, b) => b.round3_points - a.round3_points)
  .slice(0, 30);

const officialR32Fixtures = liveFixtures
  .filter((fixture) => String(fixture.round_id) === "4" || String(fixture.round_stage || "").toUpperCase() === "R32")
  .map((fixture) => ({
    source_fixture_id: fixture.source_fixture_id,
    fixture_status: fixture.fixture_status,
    score_status: fixture.score_status,
    fixture: fixtureLabel(fixture),
    home_team: fixture.live_home_team || fixture.home_team,
    home_squad_id: String(fixture.live_home_squad_id || fixture.home_squad_id || ""),
    away_team: fixture.live_away_team || fixture.away_team,
    away_squad_id: String(fixture.live_away_squad_id || fixture.away_squad_id || ""),
    date: fixture.date,
    safe_to_display_score: fixture.safe_to_display_score === true,
    public_promotion: "blocked_md3_public_default"
  }));

const arjanRole = (roleModel.playerRoleRows || []).find((row) => String(row.official_fantasy_player_id) === "2079");
const arjanProjectionCoverage = (projections.blockedPlayers || []).find((row) => String(row.official_fantasy_player_id) === "2079");
const stagingSafe = officialR32Fixtures.length > 0;
const readiness = {
  schema_version: "r32_readiness_daily_v1",
  generated_at: GENERATED_AT,
  source_files: PATHS,
  summary: {
    completed_md3_fixtures: completedMd3Fixtures.length,
    complete_groups: groupReports.filter((group) => group.group_complete).length,
    safe_top_two_qualifiers: safeGroupQualifiers.length,
    safe_eliminated_teams: safeEliminated.length,
    uncertain_teams: groupReports.reduce((total, group) => total + group.still_uncertain.length, 0),
    official_r32_source_fixtures: officialR32Fixtures.length,
    r32_staging_safe_today: stagingSafe,
    r32_public_promotion_blocked: true
  },
  groups: groupReports,
  official_r32_source_fixtures: officialR32Fixtures,
  new_player_arjan_malic: {
    official_fantasy_player_id: "2079",
    incorporated_in_role_coverage: Boolean(arjanRole),
    incorporated_in_projection_coverage: Boolean(arjanProjectionCoverage),
    r32_readiness_impact_today: officialR32Fixtures.some((fixture) => [fixture.home_team, fixture.away_team].includes("Bosnia and Herzegovina"))
      ? "monitor_if_bosnia_r32_slot_remains_source_backed"
      : "no_direct_r32_staging_effect_today",
    projection_status: arjanProjectionCoverage?.roleTier || arjanRole?.roleTier || "missing"
  },
  top_md3_form_players: topMd3FormPlayers,
  role_lineup_evidence: {
    completed_md3_team_ids: [...completedMd3TeamIds].sort(),
    completed_md3_match_status_counts: statusCounts(
      livePlayersRows.filter((player) => completedMd3TeamIds.has(String(player.team_id || player.squad_id || ""))),
      (player) => player.matchStatus || "none"
    )
  },
  missing_tiebreaker_assumptions: [
    "Best third-place ranking is not resolved until enough groups complete.",
    "Only points, goal difference, goals for, and team-name ordering are modeled for completed-group top-two staging; deeper FIFA tiebreakers remain manual review if tied.",
    "Official R32 source fixtures from the live fantasy feed are staged as source fixtures, not public promotion."
  ],
  notes: [
    "R32 public promotion remains blocked; MD3 stays the public default.",
    "Final squads remain fantasy-pool-only, not source-backed final squad claims.",
    "In-progress/scheduled MD3 player points are not used.",
    "Ownership is not used as a model signal."
  ]
};

await writeFile(PATHS.readinessJson, `${JSON.stringify(readiness, null, 2)}\n`, "utf8");
await writeFile(PATHS.readinessReport, r32Report(readiness), "utf8");

if (stagingSafe) {
  const qualifiedStaging = {
    schema_version: "r32_qualified_teams_staging_v1",
    generated_at: GENERATED_AT,
    status: "partial_official_source_staging_only",
    public_promotion: "blocked_md3_public_default",
    official_r32_fixtures: officialR32Fixtures,
    safe_group_qualifiers: safeGroupQualifiers,
    safe_eliminated_teams: safeEliminated,
    still_uncertain_teams: groupReports.flatMap((group) => group.still_uncertain.map((row) => ({
      group: group.group,
      team: row.team,
      points: row.points,
      basis: group.group_complete ? "complete_group_third_place_best_third_unresolved" : "group_not_complete"
    }))),
    missing_tiebreaker_assumptions: readiness.missing_tiebreaker_assumptions
  };

  const stagingTeamIds = new Set(officialR32Fixtures.flatMap((fixture) => [fixture.home_squad_id, fixture.away_squad_id]));
  const teamStatus = officialR32Fixtures.flatMap((fixture) => [
    { team: fixture.home_team, team_id: fixture.home_squad_id },
    { team: fixture.away_team, team_id: fixture.away_squad_id }
  ]).map((team) => {
    const rows = officialByTeamId.get(team.team_id) || [];
    return {
      ...team,
      official_player_count: rows.length,
      selectable_status_counts: statusCounts(rows, (row) => row.selectable_status || "unknown"),
      players_newly_injured_suspended_not_selectable: rows
        .filter((row) => ["injured", "suspended"].includes(String(row.selectable_status || "").toLowerCase()))
        .map((row) => ({
          official_fantasy_player_id: row.official_fantasy_player_id,
          name: row.name,
          position: row.official_fantasy_position,
          selectable_status: row.selectable_status
        }))
    };
  });

  const playerStaging = {
    schema_version: "r32_player_readiness_staging_v1",
    generated_at: GENERATED_AT,
    status: "partial_official_source_staging_only",
    public_promotion: "blocked_md3_public_default",
    source_fixture_count: officialR32Fixtures.length,
    team_status: teamStatus,
    top_md3_form_players: topMd3FormPlayers
      .filter((player) => stagingTeamIds.has(player.team_id))
      .slice(0, 20),
    new_player_notes: [
      `Arjan Malic (official id 2079) is incorporated as zero role/projection coverage: ${readiness.new_player_arjan_malic.projection_status}.`,
      `R32 staging impact today: ${readiness.new_player_arjan_malic.r32_readiness_impact_today}.`
    ],
    safeguards: [
      "No R32 public UI promotion.",
      "No final-squad source-backed claim.",
      "No in-progress MD3 player points used.",
      "Official R32 source fixtures remain staging only."
    ]
  };

  await writeFile(PATHS.qualifiedTeamsStagingJson, `${JSON.stringify(qualifiedStaging, null, 2)}\n`, "utf8");
  await writeFile(PATHS.qualifiedTeamsStagingReport, qualifiedTeamsReport(qualifiedStaging), "utf8");
  await writeFile(PATHS.playerReadinessStagingJson, `${JSON.stringify(playerStaging, null, 2)}\n`, "utf8");
  await writeFile(PATHS.playerReadinessStagingReport, playerReadinessReport(playerStaging), "utf8");
}

console.log(JSON.stringify({
  status: "passed",
  readiness_json: PATHS.readinessJson,
  readiness_report: PATHS.readinessReport,
  r32_staging_created: stagingSafe,
  official_r32_source_fixtures: officialR32Fixtures.length,
  completed_md3_fixtures: completedMd3Fixtures.length,
  complete_groups: readiness.summary.complete_groups,
  safe_top_two_qualifiers: readiness.summary.safe_top_two_qualifiers
}, null, 2));
