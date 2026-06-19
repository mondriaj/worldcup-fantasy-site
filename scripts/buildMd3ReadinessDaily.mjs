import { readFile, writeFile } from "node:fs/promises";

const PATHS = {
  officialMonitor: "data/officialFantasyDataUpdateCheck_v1.json",
  liveMatchday: "data/liveMatchdayStatus_v1.json",
  livePlayers: "data/livePlayerStatus_v1.json",
  liveFixtureQa: "data/liveFixtureMappingQa_v1.json",
  scoreV4: "data/scorePredictions_fantasyPool_v4_md2.json",
  projectionsV4: "data/fantasyPoolMatchdayProjections_md2_v4.json",
  roleModelV2: "data/playerRoleModel_md2_v2.json",
  outputJson: "data/md3ReadinessDaily_v1.json",
  outputReport: "data/md3ReadinessDailyReport_v1.md"
};

const GENERATED_AT = new Date().toISOString();

function round(value, digits = 3) {
  if (!Number.isFinite(Number(value))) return null;
  return Number(Number(value).toFixed(digits));
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function countBy(rows, getKey) {
  return rows.reduce((counts, row) => {
    const key = getKey(row) || "unknown";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function diffCount(group, key) {
  if (Number.isFinite(Number(group?.counts?.[key]))) return Number(group.counts[key]);
  if (Array.isArray(group?.[key])) return group[key].length;
  return group?.[key] ? 1 : 0;
}

function mdTable(headers, rows) {
  if (!rows.length) return "_None._";
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((value) => String(value ?? "")).join(" | ")} |`)
  ].join("\n");
}

function sortedByAbs(rows, key, limit = 20) {
  return [...rows]
    .sort((left, right) => Math.abs(Number(right[key] || 0)) - Math.abs(Number(left[key] || 0)))
    .slice(0, limit);
}

function isMaterialPlayerOrRuleChange(officialMonitor) {
  const players = officialMonitor.diffs?.players || {};
  const squads = officialMonitor.diffs?.squads || {};
  const rules = officialMonitor.diffs?.rules || {};
  return Boolean(
    diffCount(players, "new_players") ||
    diffCount(players, "removed_players") ||
    diffCount(players, "price_changes") ||
    diffCount(players, "position_changes") ||
    diffCount(players, "selectable_status_changes") ||
    diffCount(players, "country_team_changes") ||
    diffCount(players, "fifa_player_id_changes") ||
    diffCount(squads, "new_teams") ||
    diffCount(squads, "removed_teams") ||
    diffCount(squads, "team_name_changes") ||
    diffCount(rules, "mystery_booster_text_changes") ||
    diffCount(rules, "deadline_round_changes")
  );
}

function scoreFixtureForLive(scoreRows, liveFixture) {
  return scoreRows.find((row) =>
    row.fixture_id === liveFixture.local_fixture_id ||
    row.match_id === liveFixture.local_fixture_id ||
    Number(row.match_number) === Number(liveFixture.match_number)
  );
}

function projectionRowsByPlayer(projectionRows) {
  const map = new Map();
  for (const row of projectionRows) {
    if (row.matchday !== "md2") continue;
    map.set(String(row.official_fantasy_player_id), row);
  }
  return map;
}

function buildFixtureResiduals(completedMd2Fixtures, scoreRows) {
  return completedMd2Fixtures.map((fixture) => {
    const score = scoreFixtureForLive(scoreRows, fixture);
    const homePredicted = Number(score?.home_expected_goals);
    const awayPredicted = Number(score?.away_expected_goals);
    const actualHome = Number(fixture.home_score);
    const actualAway = Number(fixture.away_score);
    return {
      fixture_id: fixture.local_fixture_id,
      match_number: fixture.match_number,
      fixture: `${fixture.local_home_team} vs ${fixture.local_away_team}`,
      actual_score: `${fixture.home_score}-${fixture.away_score}`,
      predicted_home_xg: round(homePredicted),
      predicted_away_xg: round(awayPredicted),
      predicted_total_xg: round(score?.total_expected_goals),
      home_goal_residual: round(actualHome - homePredicted),
      away_goal_residual: round(actualAway - awayPredicted),
      total_goal_residual: round(actualHome + actualAway - Number(score?.total_expected_goals)),
      score_model_version: score?.modelVersion || score?.model_version || null,
      source_scope: "completed_md2_fixture_only"
    };
  });
}

function buildTeamResiduals(fixtureResiduals, completedMd2Fixtures, scoreRows) {
  const rows = [];
  for (const fixture of completedMd2Fixtures) {
    const score = scoreFixtureForLive(scoreRows, fixture);
    const sides = [
      {
        team: fixture.local_home_team,
        opponent: fixture.local_away_team,
        side: "home",
        actual_for: Number(fixture.home_score),
        actual_against: Number(fixture.away_score),
        predicted_for: Number(score?.home_expected_goals),
        predicted_against: Number(score?.away_expected_goals),
        clean_sheet_probability: Number(score?.home_clean_sheet_probability)
      },
      {
        team: fixture.local_away_team,
        opponent: fixture.local_home_team,
        side: "away",
        actual_for: Number(fixture.away_score),
        actual_against: Number(fixture.home_score),
        predicted_for: Number(score?.away_expected_goals),
        predicted_against: Number(score?.home_expected_goals),
        clean_sheet_probability: Number(score?.away_clean_sheet_probability)
      }
    ];

    for (const side of sides) {
      rows.push({
        team: side.team,
        opponent: side.opponent,
        fixture_id: fixture.local_fixture_id,
        match_number: fixture.match_number,
        side: side.side,
        actual_goals_for: side.actual_for,
        predicted_goals_for: round(side.predicted_for),
        attack_residual: round(side.actual_for - side.predicted_for),
        actual_goals_against: side.actual_against,
        predicted_goals_against: round(side.predicted_against),
        defense_residual: round(side.actual_against - side.predicted_against),
        clean_sheet_actual: side.actual_against === 0,
        clean_sheet_probability: round(side.clean_sheet_probability),
        source_scope: "completed_md2_fixture_only"
      });
    }
  }
  return rows;
}

function buildCleanSheetRows(teamResidualRows) {
  return teamResidualRows.map((row) => {
    const thresholdCall = Number(row.clean_sheet_probability) >= 0.5;
    return {
      team: row.team,
      opponent: row.opponent,
      fixture_id: row.fixture_id,
      match_number: row.match_number,
      clean_sheet_actual: row.clean_sheet_actual,
      clean_sheet_probability: row.clean_sheet_probability,
      threshold_call_clean_sheet: thresholdCall,
      threshold_result: thresholdCall === row.clean_sheet_actual ? "hit" : "miss"
    };
  });
}

function buildPlayerProjectionMisses(md2PointRows, projectionsByPlayer) {
  return md2PointRows
    .map((player) => {
      const projection = projectionsByPlayer.get(String(player.official_fantasy_player_id));
      const projected = Number(projection?.risk_adjusted_points ?? projection?.raw_expected_points);
      const actual = Number(player.stats?.roundPoints?.["2"]);
      if (!Number.isFinite(actual) || !Number.isFinite(projected)) return null;
      return {
        official_fantasy_player_id: player.official_fantasy_player_id,
        name: player.name,
        team: player.team_name,
        position: player.position,
        fixture_id: projection?.fixture_id || null,
        match_number: projection?.match_number || null,
        actual_points: actual,
        projected_points: round(projected),
        point_residual: round(actual - projected),
        abs_point_residual: round(Math.abs(actual - projected)),
        match_status: player.matchStatus || null,
        source_scope: "completed_md2_fixture_only"
      };
    })
    .filter(Boolean)
    .sort((left, right) => right.abs_point_residual - left.abs_point_residual);
}

function buildParticipationEvidence(md2PointRows, roleRows) {
  const roleByPlayer = new Map(roleRows.map((row) => [String(row.official_fantasy_player_id), row]));
  const rows = md2PointRows.map((player) => {
    const role = roleByPlayer.get(String(player.official_fantasy_player_id));
    return {
      official_fantasy_player_id: player.official_fantasy_player_id,
      name: player.name,
      team: player.team_name,
      position: player.position,
      actual_points: Number(player.stats?.roundPoints?.["2"]),
      match_status: player.matchStatus || null,
      prior_role_tier: role?.roleTier || null,
      prior_start_probability: role?.md2StartProb ?? null,
      prior_expected_minutes: role?.md2ExpectedMinutes ?? null,
      evidence_note: player.matchStatus === "start"
        ? "started_completed_md2_fixture"
        : player.matchStatus === "sub"
          ? "sub_completed_md2_fixture"
          : "completed_md2_points_without_explicit_role_status"
    };
  });

  return {
    row_count: rows.length,
    match_status_counts: countBy(rows, (row) => row.match_status || "none"),
    position_counts: countBy(rows, (row) => row.position),
    team_counts: countBy(rows, (row) => row.team),
    prior_role_tier_counts: countBy(rows, (row) => row.prior_role_tier || "missing_role_row"),
    sample: rows.slice(0, 30)
  };
}

function buildReadinessDecision({
  officialMonitor,
  liveMatchday,
  livePlayers,
  fixtureQa,
  completedMd2Fixtures
}) {
  const materialChange = isMaterialPlayerOrRuleChange(officialMonitor);
  const unsafeLeaks = Number(fixtureQa.summary?.unsafe_fixture_player_point_leak_count || 0);
  const officialMonitorClean = officialMonitor.monitor_status === "completed" &&
    officialMonitor.summary?.fetch_failures === 0 &&
    officialMonitor.recommendation?.model_outputs_should_update_now === false &&
    !materialChange;
  const liveMappingClean = fixtureQa.status === "passed" && unsafeLeaks === 0;
  const enoughMd2EvidenceForStaging = completedMd2Fixtures.length >= 8;
  const liveManualReviewNeeded = livePlayers.update_decision?.primary_recommendation === "manual_review_needed";

  const reasons = [];
  if (!officialMonitorClean) reasons.push("Official monitor is not clean for model work.");
  if (!liveMappingClean) reasons.push("Live fixture mapping or leak QA is not clean.");
  if (!enoughMd2EvidenceForStaging) reasons.push(`Only ${completedMd2Fixtures.length}/24 MD2 fixtures are final; this is too thin for a useful MD3 staging rebuild.`);
  if (liveManualReviewNeeded) reasons.push("Live player feed has manual-review flags before projection or role changes.");

  return {
    public_md2_live_update_status: officialMonitorClean && liveMappingClean ? "green" : "red",
    official_monitor_clean_for_model_work: officialMonitorClean,
    material_player_or_rule_changes: materialChange,
    md3_model_rebuild_safe_today: false,
    md3_staging_rebuild_recommended_today: false,
    md3_staging_status: "skipped_insufficient_completed_md2_evidence",
    md3_should_remain_staging_only: true,
    completed_md2_fixture_threshold_for_staging: 8,
    completed_md2_fixtures_available: completedMd2Fixtures.length,
    reasons
  };
}

function reportList(items) {
  return items.length ? items.map((item) => `- ${item}`).join("\n") : "- None";
}

function buildReport(readiness) {
  const summary = readiness.summary;
  const official = readiness.official_monitor;
  const live = readiness.live_status;
  const partial = readiness.partial_md2_calibration;
  const decision = readiness.md3_readiness_decision;

  return [
    "# MD3 Readiness Daily Report v1",
    "",
    `Generated: ${readiness.generated_at}`,
    "",
    "## Summary",
    "",
    mdTable(
      ["Item", "Result"],
      [
        ["Public MD2 live update status", decision.public_md2_live_update_status],
        ["Safe to share public MD2", summary.safe_to_share_public_md2 ? "yes" : "no"],
        ["Completed MD1 fixtures", `${live.completed_md1_fixtures} / 24`],
        ["Completed MD2 fixtures used", summary.completed_md2_fixtures_used],
        ["MD2 in-progress fixtures excluded", summary.md2_in_progress_fixtures_excluded],
        ["MD2 scheduled fixtures excluded", summary.md2_scheduled_fixtures_excluded],
        ["MD2 player point rows imported", summary.md2_player_actual_point_rows_imported],
        ["Official monitor result", official.rerun_decision],
        ["Material player/rule changes", official.material_player_or_rule_changes ? "yes" : "no"],
        ["MD3 model rebuild safe today", decision.md3_model_rebuild_safe_today ? "yes" : "no"],
        ["MD3 staging created", summary.md3_staging_created ? "yes" : "no"]
      ]
    ),
    "",
    "## Official Monitor",
    "",
    mdTable(
      ["Check", "Count"],
      [
        ["New players", official.player_changes.new_players],
        ["Removed players", official.player_changes.removed_players],
        ["Price changes", official.player_changes.price_changes],
        ["Position changes", official.player_changes.position_changes],
        ["Selectable status changes", official.player_changes.selectable_status_changes],
        ["Country/team changes", official.player_changes.country_team_changes],
        ["Ownership changes", official.player_changes.ownership_percent_changes],
        ["Rules source/header changes", official.rules_changes.source_header_changes],
        ["Deadline/round changes", official.rules_changes.deadline_round_changes],
        ["Clean Sheet Shield text changes", official.rules_changes.mystery_booster_text_changes]
      ]
    ),
    "",
    "Ownership movement is recorded as non-model signal. No price, position, selectable status, team/country, new/removed player, scoring, booster, deadline, or lock-content change is present after the round-status metadata refresh.",
    "",
    "## Live Fixture Gate",
    "",
    mdTable(
      ["Metric", "Count"],
      [
        ["Total fixtures", live.total_fixtures],
        ["Mapped fixtures", live.matched_fixtures],
        ["Completed MD1 fixtures", live.completed_md1_fixtures],
        ["Completed MD2 fixtures", live.completed_md2_fixtures],
        ["MD2 in-progress fixtures", live.md2_in_progress_fixtures],
        ["MD2 scheduled fixtures", live.md2_scheduled_fixtures],
        ["Scheduled future fixtures", live.scheduled_future_fixtures],
        ["Safe final scores shown", live.safe_final_scores_shown],
        ["Unsafe fixture/player point leaks", live.unsafe_fixture_player_point_leaks]
      ]
    ),
    "",
    "## Completed MD2 Fixtures Used",
    "",
    mdTable(
      ["Match", "Fixture", "Score", "Pred xG", "Total Residual"],
      partial.fixture_residuals.map((row) => [
        row.match_number,
        row.fixture,
        row.actual_score,
        `${row.predicted_home_xg}-${row.predicted_away_xg}`,
        row.total_goal_residual
      ])
    ),
    "",
    "## Team Residuals",
    "",
    mdTable(
      ["Team", "Opponent", "GF Res", "GA Res", "CS Prob", "CS Actual"],
      sortedByAbs(partial.team_residuals, "attack_residual", 12).map((row) => [
        row.team,
        row.opponent,
        row.attack_residual,
        row.defense_residual,
        row.clean_sheet_probability,
        row.clean_sheet_actual ? "yes" : "no"
      ])
    ),
    "",
    "## Clean Sheet Checks",
    "",
    mdTable(
      ["Team", "Opponent", "CS Prob", "Actual CS", "Threshold Result"],
      partial.clean_sheet_checks.map((row) => [
        row.team,
        row.opponent,
        row.clean_sheet_probability,
        row.clean_sheet_actual ? "yes" : "no",
        row.threshold_result
      ])
    ),
    "",
    "## Player Projection Misses",
    "",
    mdTable(
      ["Player", "Team", "Pos", "Actual", "Projected", "Residual", "Status"],
      partial.top_player_projection_misses.map((row) => [
        row.name,
        row.team,
        row.position,
        row.actual_points,
        row.projected_points,
        row.point_residual,
        row.match_status || ""
      ])
    ),
    "",
    "## Role And Participation Evidence",
    "",
    mdTable(
      ["Bucket", "Count"],
      Object.entries(partial.role_participation_evidence.match_status_counts)
    ),
    "",
    mdTable(
      ["Prior Role Tier", "Count"],
      Object.entries(partial.role_participation_evidence.prior_role_tier_counts)
        .sort((left, right) => right[1] - left[1])
    ),
    "",
    "## MD3 Decision",
    "",
    reportList(decision.reasons),
    "",
    "MD3 should remain staging only. No MD3 staging rebuild was created today because the official monitor is clean for model fields, but only a small partial MD2 sample is final and live player status still has manual-review flags. In-progress or scheduled MD2 scores and player points were not used.",
    "",
    "## Known Limits",
    "",
    reportList(readiness.known_limits),
    ""
  ].join("\n");
}

const [
  officialMonitor,
  liveMatchday,
  livePlayers,
  fixtureQa,
  scoreV4,
  projectionsV4,
  roleModelV2
] = await Promise.all([
  readJson(PATHS.officialMonitor),
  readJson(PATHS.liveMatchday),
  readJson(PATHS.livePlayers),
  readJson(PATHS.liveFixtureQa),
  readJson(PATHS.scoreV4),
  readJson(PATHS.projectionsV4),
  readJson(PATHS.roleModelV2)
]);

const fixtures = liveMatchday.fixtures || [];
const md1Fixtures = fixtures.filter((fixture) => fixture.round_id === "1");
const md2Fixtures = fixtures.filter((fixture) => fixture.round_id === "2");
const completedMd2Fixtures = md2Fixtures.filter((fixture) => fixture.fixture_status === "complete" && fixture.safe_to_display_score === true);
const inProgressMd2Fixtures = md2Fixtures.filter((fixture) => !["complete", "scheduled"].includes(fixture.fixture_status));
const scheduledMd2Fixtures = md2Fixtures.filter((fixture) => fixture.fixture_status === "scheduled");
const scheduledFutureFixtures = fixtures.filter((fixture) => fixture.fixture_status === "scheduled");
const md2PointRows = (livePlayers.players || []).filter((player) =>
  player.stats?.roundPoints &&
  Object.prototype.hasOwnProperty.call(player.stats.roundPoints, "2")
);

const scoreRows = scoreV4.fixtureScorePredictions || [];
const projectionRows = projectionsV4.playerMatchdayProjections || [];
const roleRows = roleModelV2.playerRoleRows || [];
const projectionsByPlayer = projectionRowsByPlayer(projectionRows);
const fixtureResiduals = buildFixtureResiduals(completedMd2Fixtures, scoreRows);
const teamResiduals = buildTeamResiduals(fixtureResiduals, completedMd2Fixtures, scoreRows);
const cleanSheetChecks = buildCleanSheetRows(teamResiduals);
const playerProjectionMisses = buildPlayerProjectionMisses(md2PointRows, projectionsByPlayer);
const participationEvidence = buildParticipationEvidence(md2PointRows, roleRows);
const materialChange = isMaterialPlayerOrRuleChange(officialMonitor);
const decision = buildReadinessDecision({
  officialMonitor,
  liveMatchday,
  livePlayers,
  fixtureQa,
  completedMd2Fixtures
});

const readiness = {
  schema_version: "md3_readiness_daily_v1",
  generated_at: GENERATED_AT,
  source_files: PATHS,
  summary: {
    safe_to_share_public_md2: decision.public_md2_live_update_status === "green",
    completed_md2_fixtures_used: completedMd2Fixtures.length,
    md2_in_progress_fixtures_excluded: inProgressMd2Fixtures.length,
    md2_scheduled_fixtures_excluded: scheduledMd2Fixtures.length,
    scheduled_future_fixtures_excluded: scheduledFutureFixtures.length,
    md2_player_actual_point_rows_imported: md2PointRows.length,
    official_monitor_status: officialMonitor.monitor_status,
    official_monitor_result: officialMonitor.recommendation?.rerun_decision || officialMonitor.summary?.rerun_decision,
    material_player_or_rule_changes: materialChange,
    md3_model_rebuild_safe_today: decision.md3_model_rebuild_safe_today,
    md3_staging_created: false,
    public_md2_model_files_changed: false,
    public_live_support_files_changed: true
  },
  official_monitor: {
    generated_at: officialMonitor.generated_at,
    status: officialMonitor.monitor_status,
    rerun_decision: officialMonitor.recommendation?.rerun_decision || officialMonitor.summary?.rerun_decision,
    reasons: officialMonitor.recommendation?.reasons || [],
    material_player_or_rule_changes: materialChange,
    player_changes: {
      new_players: diffCount(officialMonitor.diffs?.players, "new_players"),
      removed_players: diffCount(officialMonitor.diffs?.players, "removed_players"),
      price_changes: diffCount(officialMonitor.diffs?.players, "price_changes"),
      position_changes: diffCount(officialMonitor.diffs?.players, "position_changes"),
      selectable_status_changes: diffCount(officialMonitor.diffs?.players, "selectable_status_changes"),
      country_team_changes: diffCount(officialMonitor.diffs?.players, "country_team_changes"),
      fifa_player_id_changes: diffCount(officialMonitor.diffs?.players, "fifa_player_id_changes"),
      ownership_percent_changes: diffCount(officialMonitor.diffs?.players, "ownership_percent_changes")
    },
    squad_changes: {
      new_teams: diffCount(officialMonitor.diffs?.squads, "new_teams"),
      removed_teams: diffCount(officialMonitor.diffs?.squads, "removed_teams"),
      team_name_changes: diffCount(officialMonitor.diffs?.squads, "team_name_changes")
    },
    rules_changes: {
      source_header_changes: diffCount(officialMonitor.diffs?.rules, "source_header_changes"),
      mystery_booster_text_changes: diffCount(officialMonitor.diffs?.rules, "mystery_booster_text_changes"),
      deadline_round_changes: diffCount(officialMonitor.diffs?.rules, "deadline_round_changes")
    },
    ownership_changes_are_model_signal: false
  },
  live_status: {
    generated_at: liveMatchday.generated_at,
    total_fixtures: liveMatchday.summary?.fixture_count || fixtures.length,
    matched_fixtures: fixtureQa.summary?.matched_fixtures || null,
    completed_md1_fixtures: md1Fixtures.filter((fixture) => fixture.fixture_status === "complete").length,
    completed_md2_fixtures: completedMd2Fixtures.length,
    md2_in_progress_fixtures: inProgressMd2Fixtures.length,
    md2_scheduled_fixtures: scheduledMd2Fixtures.length,
    scheduled_future_fixtures: scheduledFutureFixtures.length,
    safe_final_scores_shown: liveMatchday.summary?.safe_final_scores_shown || fixtureQa.summary?.final_fixtures_shown || null,
    in_progress_scores_hidden: liveMatchday.summary?.in_progress_scores_hidden_count || 0,
    unsafe_fixture_player_point_leaks: fixtureQa.summary?.unsafe_fixture_player_point_leak_count || 0,
    players_with_unfinished_fixture_points_suppressed: livePlayers.summary?.players_with_suppressed_unfinalized_points || 0,
    player_point_scope: "completed_fixtures_only",
    live_update_recommendation: livePlayers.update_decision?.primary_recommendation || liveMatchday.update_decision?.primary_recommendation || null
  },
  partial_md2_calibration: {
    status: completedMd2Fixtures.length ? "partial_review_only_not_model_signal" : "no_completed_md2_fixtures_available",
    actuals_used_as_model_signal: false,
    completed_fixture_count: completedMd2Fixtures.length,
    fixture_residuals: fixtureResiduals,
    team_residuals: teamResiduals,
    clean_sheet_checks: cleanSheetChecks,
    player_actual_point_rows: md2PointRows.length,
    player_projection_miss_rows: playerProjectionMisses.length,
    top_player_projection_misses: playerProjectionMisses.slice(0, 20),
    role_participation_evidence: participationEvidence
  },
  md3_readiness_decision: decision,
  staging_outputs: {
    created: false,
    files: [],
    skipped_reason: "Only 3 completed MD2 fixtures are final; in-progress/scheduled MD2 data cannot be used and live player status has manual-review flags."
  },
  safeguards: [
    "Completed MD2 fixtures only are included in the partial review section.",
    "In-progress and scheduled MD2 fixtures are excluded.",
    "MD2 actuals are not used as Score v4, projection, recommendation, role, or Team Builder signal.",
    "Ownership changes are documented as non-model signal.",
    "Public MD2 model files remain unchanged unless an explicit promotion is requested."
  ],
  known_limits: [
    "Only 3 of 24 MD2 fixtures are final, so residuals are volatile.",
    "The live player feed provides fantasy points and matchStatus, not official player minutes or injury reasons.",
    "58 players are marked not_in_squad in the live feed and require manual review before projection or role changes.",
    "Final squads remain not source-backed.",
    "No betting odds, confirmed lineups, locks, user-team state, substitutions, or booster state are imported."
  ]
};

await writeFile(PATHS.outputJson, `${JSON.stringify(readiness, null, 2)}\n`, "utf8");
await writeFile(PATHS.outputReport, buildReport(readiness), "utf8");

console.log(JSON.stringify({
  status: readiness.summary.safe_to_share_public_md2 ? "green" : "red",
  output_json: PATHS.outputJson,
  output_report: PATHS.outputReport,
  completed_md2_fixtures_used: readiness.summary.completed_md2_fixtures_used,
  md2_player_actual_point_rows_imported: readiness.summary.md2_player_actual_point_rows_imported,
  md3_staging_created: readiness.summary.md3_staging_created
}, null, 2));
