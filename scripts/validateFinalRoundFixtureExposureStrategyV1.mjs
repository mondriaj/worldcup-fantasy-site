import fs from "node:fs";
import { buildFinalRoundFixtureExposureStrategyAudit, writeFinalRoundFixtureExposureStrategyAudit } from "./auditFinalRoundFixtureExposureStrategyV1.mjs";

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

function teamKeysFromAuthority(authority) {
  return new Set((authority.fixtures || []).flatMap((fixture) => [
    fixture.team_a?.team_id,
    fixture.team_b?.team_id
  ]).filter(Boolean));
}

function rowText(row) {
  return [row.name, row.display_name, row.country, row.team_id, row.official_team_id].filter(Boolean).join(" ");
}

function buildQa() {
  const audit = writeFinalRoundFixtureExposureStrategyAudit(buildFinalRoundFixtureExposureStrategyAudit());
  const authority = readJson("data/finalRoundFixtureAuthority_v1.json");
  const teamBuilder = readJson("data/teamBuilderQa_finalRound_v1.json");
  const projections = readJson("data/fantasyPoolMatchdayProjections_finalRound_v1.json").playerMatchdayProjections || [];
  const recommendations = readJson("data/fantasyPoolRecommendations_finalRound_v1.json").recommendationCandidates || [];
  const script = fs.readFileSync("script.js", "utf8");
  const eligibleTeamIds = teamKeysFromAuthority(authority);
  const selected = teamBuilder.balancedSquad || [];
  const activeRows = [...projections, ...recommendations].filter((row) => row.matchday === "finalRound");
  const errors = [];
  const checks = [];
  const addCheck = (id, passed, detail) => {
    checks.push({ id, status: passed ? "pass" : "fail", detail });
    if (!passed) errors.push(detail || id);
  };

  addCheck("audit_pass", audit.status === "pass", "Fixture exposure strategy audit failed.");
  addCheck("eligible_candidate_teams", projections.every((row) => eligibleTeamIds.has(row.team_id)), "Final Round projection candidate outside fixture authority.");
  addCheck("recommendation_teams", recommendations.filter((row) => row.matchday === "finalRound").every((row) => eligibleTeamIds.has(row.team_id)), "Final Round recommendation outside fixture authority.");
  addCheck("team_builder_selected_teams", selected.every((row) => [...eligibleTeamIds].some((teamId) => row.country === authorityTeamName(authority, teamId))), "Team Builder selected squad contains a team outside fixture authority.");
  addCheck("no_active_eliminated_leakage", activeRows.filter((row) => BUG_PATTERN.test(rowText(row))).length === 0, "Eliminated player/team leaked into an active Final Round row.");
  addCheck("team_builder_uses_final_round_rows", selected.every((row) => row.fixture_stage === "final" || row.fixture_stage === "third_place"), "Team Builder selected squad is missing Final Round fixture_stage metadata.");
  addCheck("fixture_counts_present", Boolean(teamBuilder.summary?.selected_count_by_fixture), "Team Builder QA missing selected count by fixture.");
  addCheck("optionality_fields_present", teamBuilder.summary?.optionality_score !== undefined && teamBuilder.summary?.composite_score !== undefined, "Team Builder QA missing optionality/composite fields.");
  addCheck("raw_comparison_present", Array.isArray(teamBuilder.rawExpectedPointsSquad) && teamBuilder.rawExpectedPointsSquad.length === 15, "Team Builder QA missing raw expected-points comparison.");
  addCheck("early_fixture_exposure_or_explanation", (teamBuilder.summary?.early_fixture_selected_count || 0) > 0 || (teamBuilder.summary?.minimum_early_fixture_players_when_viable || 0) === 0, "Balanced Squad has 0 earlier-fixture players without explanation.");
  addCheck("france_england_not_both_zero", (teamBuilder.summary?.selected_count_by_team?.France || 0) + (teamBuilder.summary?.selected_count_by_team?.England || 0) > 0, "France and England both have 0 selected players.");
  addCheck("third_place_recommendations_present", recommendations.filter((row) => row.fixture_stage === "third_place").length > 0, "Third Place players have no recommendation exposure.");
  addCheck("early_option_surface_present", recommendations.filter((row) => row.mode === "early_option").length > 0, "Early-game option recommendation surface missing.");
  addCheck("third_place_risk_surface_present", recommendations.filter((row) => row.mode === "third_place_risk").length > 0, "Third Place risk recommendation surface missing.");
  addCheck("recommendation_tags_present", recommendations.filter((row) => row.fixture_stage === "third_place").some((row) => (row.recommendation_tags || []).includes("Early game option")), "Third Place recommendation tags missing Early game option.");
  addCheck("public_copy_cautious", /if (your game rules|FIFA rules).*allow/i.test(script) && /verify FIFA substitution/i.test(script), "Public copy does not clearly caution that substitution flexibility depends on FIFA rules/locks.");

  return {
    schema_version: "final_round_fixture_exposure_strategy_qa_v1",
    generated_at: GENERATED_AT,
    status: errors.length ? "fail" : "pass",
    summary: {
      selected_count_by_team: teamBuilder.summary?.selected_count_by_team || {},
      selected_count_by_fixture: teamBuilder.summary?.selected_count_by_fixture || {},
      raw_expected_selected_count_by_team: teamBuilder.summary?.raw_expected_selected_count_by_team || {},
      raw_projected_points_before: teamBuilder.summary?.raw_projected_points_before,
      raw_projected_points_after: teamBuilder.summary?.raw_projected_points_after,
      optionality_score: teamBuilder.summary?.optionality_score,
      optionality_gain: teamBuilder.summary?.optionality_gain,
      composite_score_gain: teamBuilder.summary?.composite_score_gain,
      third_place_recommendation_rows: recommendations.filter((row) => row.fixture_stage === "third_place").length,
      early_option_rows: recommendations.filter((row) => row.mode === "early_option").length,
      third_place_risk_rows: recommendations.filter((row) => row.mode === "third_place_risk").length
    },
    checks,
    errors
  };
}

function authorityTeamName(authority, teamId) {
  const teams = (authority.fixtures || []).flatMap((fixture) => [fixture.team_a, fixture.team_b]).filter(Boolean);
  return teams.find((team) => team.team_id === teamId)?.team || teamId;
}

const qa = buildQa();
writeJson("data/finalRoundFixtureExposureStrategyQa_v1.json", qa);
fs.writeFileSync("data/finalRoundFixtureExposureStrategyQaReport_v1.md", [
  "# Final Round Fixture Exposure Strategy QA v1",
  "",
  `Status: ${qa.status}`,
  "",
  "## Summary",
  "",
  mdTable(["Metric", "Value"], Object.entries(qa.summary).map(([key, value]) => [key, typeof value === "object" ? JSON.stringify(value) : value])),
  "",
  "## Checks",
  "",
  mdTable(["Check", "Status", "Detail"], qa.checks.map((check) => [check.id, check.status, check.detail])),
  ""
].join("\n"), "utf8");

console.log(JSON.stringify({ status: qa.status, summary: qa.summary, errors: qa.errors }, null, 2));
if (qa.status !== "pass") process.exitCode = 1;
