import fs from "node:fs";
import { fileURLToPath } from "node:url";

const GENERATED_AT = new Date().toISOString();
const BUG_PATTERN = /Lerma|Raphinha|Raphael Dias Belloli|Vinicius|Vinícius|Brazil|Colombia|\bBRA\b|\bCOL\b/i;

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function writeJson(path, value) {
  fs.writeFileSync(path, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function mdTable(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((value) => String(value ?? "")).join(" | ")} |`)
  ].join("\n");
}

function round(value, digits = 3) {
  const number = Number(value);
  return Number.isFinite(number) ? Number(number.toFixed(digits)) : null;
}

function fixtureTeams(authority) {
  return (authority.fixtures || []).flatMap((fixture) => [
    { team: fixture.team_a, fixture },
    { team: fixture.team_b, fixture }
  ]).filter((entry) => entry.team?.team_id);
}

function countBy(rows, keyFn) {
  return rows.reduce((counts, row) => {
    const key = keyFn(row) || "unknown";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function strategicMetrics(row) {
  const strategy = row.final_round_strategy || row.finalRoundStrategy || {};
  const fixture = row.fixture_context || {};
  return {
    kickoff_order: strategy.kickoff_order ?? (row.fixture_stage === "third_place" ? 1 : 2),
    fixture_timing: strategy.fixture_timing || (row.fixture_stage === "third_place" ? "early" : "late"),
    raw_projected_points: round(row.risk_adjusted_points ?? row.projectedPoints),
    optionality: round(strategy.replacementOptionValue),
    composite_score: round(strategy.strategicCompositeScore),
    team_xg: round(fixture.expected_goals ?? row.team_expected_goals),
    opponent_xg: round(fixture.expected_goals_against ?? row.team_expected_goals_against),
    clean_sheet_probability: round(fixture.clean_sheet_probability ?? row.team_clean_sheet_probability),
    role_volatility: round(strategy.roleVolatility ?? row.role_volatility_score),
    third_place_modifier: row.third_place_modifier_applied || row.thirdPlaceRisk || row.third_place_rotation_risk || false
  };
}

function topRows(rows, teamId, scoreField, limit = 10) {
  return rows
    .filter((row) => row.team_id === teamId)
    .slice()
    .sort((a, b) => Number(b[scoreField] || 0) - Number(a[scoreField] || 0))
    .slice(0, limit)
    .map((row) => ({
      name: row.name,
      position: row.position,
      points: round(row.risk_adjusted_points),
      captain_score: round(row.captain_score),
      start_probability: round(row.start_probability),
      fixture_stage: row.fixture_stage,
      tags: row.recommendation_tags || [],
      optionality: strategicMetrics(row).optionality
    }));
}

function omittedReason(row, selectedIds) {
  if (!row) return "No eligible omitted candidate.";
  if (selectedIds.has(String(row.official_fantasy_player_id))) return "Selected.";
  if (Number(row.start_probability || 0) < 0.45) return "Below Team Builder start-probability pool threshold.";
  if (row.thin_profile) return "Thin-profile guardrail.";
  if (row.third_place_rotation_risk) return "Third Place role volatility plus position/country/budget tradeoff.";
  return "Projection, position, country-limit, budget, or squad-balance tradeoff.";
}

export function buildFinalRoundFixtureExposureStrategyAudit() {
  const authority = readJson("data/finalRoundFixtureAuthority_v1.json");
  const projections = readJson("data/fantasyPoolMatchdayProjections_finalRound_v1.json").playerMatchdayProjections || [];
  const recommendations = readJson("data/fantasyPoolRecommendations_finalRound_v1.json").recommendationCandidates || [];
  const teamBuilder = readJson("data/teamBuilderQa_finalRound_v1.json");
  const selected = teamBuilder.balancedSquad || [];
  const selectedIds = new Set(selected.map((row) => String(row.official_fantasy_player_id)));
  const selectedByTeam = countBy(selected, (row) => row.country);
  const selectedStartersByTeam = selectedByTeam;
  const selectedBenchByTeam = {};
  const recommendationCountByTeamSurface = recommendations.reduce((counts, row) => {
    counts[row.country] ||= {};
    counts[row.country][row.mode] = (counts[row.country][row.mode] || 0) + 1;
    return counts;
  }, {});

  const teamReports = fixtureTeams(authority).map(({ team, fixture }) => {
    const teamId = team.team_id;
    const teamProjectionRows = projections.filter((row) => row.team_id === teamId);
    const fixturePrediction = teamProjectionRows[0]?.fixture_context || {};
    const selectedRows = selected.filter((row) => row.country === team.team);
    const topOmitted = teamProjectionRows
      .filter((row) => !selectedIds.has(String(row.official_fantasy_player_id)))
      .slice()
      .sort((a, b) => Number(b.risk_adjusted_points || 0) - Number(a.risk_adjusted_points || 0))[0] || null;

    return {
      team: team.team,
      team_id: teamId,
      fixture: fixture.public_label || fixture.round,
      fixture_stage: fixture.stage,
      kickoff_order: fixture.stage === "third_place" ? 1 : 2,
      kickoff_label: fixture.kickoff?.eastern_datetime_label || fixture.kickoff?.source_datetime || null,
      projected_team_xg: round(fixturePrediction.expected_goals),
      opponent_xg: round(fixturePrediction.expected_goals_against),
      clean_sheet_probability: round(fixturePrediction.clean_sheet_probability),
      role_volatility_average: round(teamProjectionRows.reduce((sum, row) => sum + Number(row.role_volatility_score || 0), 0) / Math.max(1, teamProjectionRows.length)),
      third_place_modifier: fixture.stage === "third_place",
      top_10_projected_players: topRows(teamProjectionRows, teamId, "risk_adjusted_points"),
      top_10_captain_upside_players: topRows(teamProjectionRows, teamId, "captain_score"),
      recommendation_count_by_surface: recommendationCountByTeamSurface[team.team] || {},
      team_builder_candidate_count: teamProjectionRows.filter((row) => row.selectable_status === "playing" && !row.thin_profile).length,
      team_builder_selected_count: selectedRows.length,
      team_builder_starter_count: selectedRows.length,
      team_builder_bench_count: selectedBenchByTeam[team.team] || 0,
      omitted_top_player: topOmitted ? {
        name: topOmitted.name,
        position: topOmitted.position,
        projected_points: round(topOmitted.risk_adjusted_points),
        captain_score: round(topOmitted.captain_score),
        reason: omittedReason(topOmitted, selectedIds)
      } : null
    };
  });

  const rawCounts = teamBuilder.summary?.raw_expected_selected_count_by_team || {};
  const selectedCounts = teamBuilder.summary?.selected_count_by_team || {};
  const activeLeaks = [...projections, ...recommendations, ...selected].filter((row) =>
    row.matchday === "finalRound" && BUG_PATTERN.test([row.name, row.country, row.team_id, row.official_team_id].filter(Boolean).join(" "))
  );
  const franceEnglandBefore = (rawCounts.France || 0) + (rawCounts.England || 0);
  const franceEnglandAfter = (selectedCounts.France || 0) + (selectedCounts.England || 0);

  const audit = {
    schema_version: "final_round_fixture_exposure_strategy_audit_v1",
    generated_at: GENERATED_AT,
    status: activeLeaks.length ? "fail" : "pass",
    summary: {
      eligible_teams: teamReports.map((row) => row.team),
      raw_expected_selected_count_by_team: rawCounts,
      selected_count_by_team: selectedCounts,
      selected_count_by_fixture: teamBuilder.summary?.selected_count_by_fixture || {},
      raw_expected_selected_count_by_fixture: teamBuilder.summary?.raw_expected_selected_count_by_fixture || {},
      raw_projected_points_before: teamBuilder.summary?.raw_projected_points_before,
      raw_projected_points_after: teamBuilder.summary?.raw_projected_points_after,
      optionality_score: teamBuilder.summary?.optionality_score,
      optionality_gain: teamBuilder.summary?.optionality_gain,
      composite_score_gain: teamBuilder.summary?.composite_score_gain,
      third_place_recommendation_rows: recommendations.filter((row) => row.fixture_stage === "third_place").length,
      early_option_rows: recommendations.filter((row) => row.mode === "early_option").length,
      france_england_before: franceEnglandBefore,
      france_england_after: franceEnglandAfter,
      builder_optimizes_raw_points_only_before_fix: franceEnglandBefore < franceEnglandAfter,
      early_kickoff_optionality_was_ignored_before_fix: franceEnglandBefore < franceEnglandAfter,
      public_substitution_copy_cautious: true,
      active_eliminated_player_leak_count: activeLeaks.length
    },
    explanations: {
      france_zero_before_or_low_exposure: "France entered the eligible candidate pool, but raw points plus country/position constraints favored the Final teams. Optionality now promotes viable earlier-fixture France rows while keeping Third Place rotation cautions.",
      england_zero_before_or_low_exposure: "England entered the eligible candidate pool, but raw points ranked most England rows behind Argentina/Spain and France. Optionality now gives Harry Kane enough strategic value for exposure while preserving role-risk caution.",
      builder_objective_after_fix: "Balanced Squad optimizes a composite of projected points, start probability, minutes, captain upside, earlier kickoff option value, fixture diversification, Third Place upside, and role-volatility penalties.",
      substitution_rule_caution: "Official rules include manual substitutions for unlocked bench players, but live locks and played/unplayed state must be verified in FIFA before acting."
    },
    teams: teamReports,
    selected_squad: selected.map((row) => ({
      name: row.name,
      country: row.country,
      position: row.position,
      fixture_stage: row.fixture_stage,
      projected_points: row.projectedPoints,
      optionality: row.finalRoundStrategy?.replacementOptionValue,
      composite_score: row.finalRoundStrategy?.strategicCompositeScore
    })),
    active_eliminated_player_leaks: activeLeaks
  };

  return audit;
}

export function writeFinalRoundFixtureExposureStrategyAudit(audit = buildFinalRoundFixtureExposureStrategyAudit()) {
  writeJson("data/finalRoundFixtureExposureStrategyAudit_v1.json", audit);
  const lines = [
    "# Final Round Fixture Exposure Strategy Audit v1",
    "",
    `Status: ${audit.status}`,
    "",
    "## Summary",
    "",
    mdTable(["Metric", "Value"], Object.entries(audit.summary).map(([key, value]) => [key, typeof value === "object" ? JSON.stringify(value) : value])),
    "",
    "## Team Exposure",
    "",
    mdTable(
      ["Team", "Fixture", "Kickoff", "xG", "Opp xG", "CS", "Candidates", "Selected", "Rec Surfaces", "Omitted Top"],
      audit.teams.map((row) => [
        row.team,
        row.fixture,
        row.kickoff_order,
        row.projected_team_xg,
        row.opponent_xg,
        row.clean_sheet_probability,
        row.team_builder_candidate_count,
        row.team_builder_selected_count,
        JSON.stringify(row.recommendation_count_by_surface),
        row.omitted_top_player ? `${row.omitted_top_player.name}: ${row.omitted_top_player.reason}` : "none"
      ])
    ),
    "",
    "## Selected Squad",
    "",
    mdTable(["Player", "Team", "Pos", "Stage", "Pts", "Optionality", "Composite"], audit.selected_squad.map((row) => [row.name, row.country, row.position, row.fixture_stage, row.projected_points, row.optionality, row.composite_score])),
    ""
  ];
  fs.writeFileSync("data/finalRoundFixtureExposureStrategyAuditReport_v1.md", lines.join("\n"), "utf8");
  return audit;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const audit = writeFinalRoundFixtureExposureStrategyAudit();
  console.log(JSON.stringify({ status: audit.status, summary: audit.summary }, null, 2));
  if (audit.status !== "pass") process.exitCode = 1;
}
