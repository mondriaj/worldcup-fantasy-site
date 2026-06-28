import fs from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
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

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function slug(value) {
  return normalizeText(value).replace(/\s+/g, "-");
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

function fixtureId(matchNumber) {
  return `fwc2026-m${String(matchNumber).padStart(3, "0")}`;
}

function buildAuthorityIndexes(authority) {
  const byMatch = new Map();
  const byTeam = new Map();
  for (const fixture of authority.fixtures || []) {
    byMatch.set(Number(fixture.bracket_match_number), fixture);
    for (const [teamKey, opponentKey] of [["team_a", "team_b"], ["team_b", "team_a"]]) {
      const team = fixture[teamKey];
      const opponent = fixture[opponentKey];
      if (team?.team_id) {
        byTeam.set(team.team_id, { fixture, team, opponent });
      }
    }
  }
  return { byMatch, byTeam };
}

function rowLabel(row) {
  return `${row.name || row.playerId || row.prediction_id || "row"} (${row.country || row.home_team || ""})`;
}

function validatePlayerRows(rows, byTeam, rowKind) {
  const failures = [];
  for (const row of rows) {
    const teamId = row.team_id || slug(row.country);
    const context = byTeam.get(teamId);
    if (!context) {
      failures.push(`${rowKind}: ${rowLabel(row)} team not in R32 authority`);
      continue;
    }
    const expectedFixtureId = fixtureId(context.fixture.bracket_match_number);
    const expectedOpponentId = context.opponent.team_id;
    const expectedOpponentName = context.opponent.team;
    const actualOpponentId = row.opponent_team_id || row.fixture_context?.opponent_team_id || slug(row.opponent);
    const actualMatchNumber = Number(row.match_number || row.fixture_context?.match_number || row.path_context?.r32_match_id);
    if (row.matchday && row.matchday !== "r32") {
      failures.push(`${rowKind}: ${rowLabel(row)} has non-R32 matchday ${row.matchday}`);
    }
    if (row.fixture_id && row.fixture_id !== expectedFixtureId) {
      failures.push(`${rowKind}: ${rowLabel(row)} fixture ${row.fixture_id} expected ${expectedFixtureId}`);
    }
    if (Number.isFinite(actualMatchNumber) && actualMatchNumber !== context.fixture.bracket_match_number) {
      failures.push(`${rowKind}: ${rowLabel(row)} match ${actualMatchNumber} expected ${context.fixture.bracket_match_number}`);
    }
    if (actualOpponentId && actualOpponentId !== expectedOpponentId) {
      failures.push(`${rowKind}: ${rowLabel(row)} opponent ${actualOpponentId} expected ${expectedOpponentId}`);
    }
    if (row.opponent && normalizeText(row.opponent) !== normalizeText(expectedOpponentName)) {
      failures.push(`${rowKind}: ${rowLabel(row)} opponent ${row.opponent} expected ${expectedOpponentName}`);
    }
    if (String(row.selectable_status || "playing").toLowerCase() !== "playing" && Number(row.projectedPoints || row.raw_expected_points || 0) > 0) {
      failures.push(`${rowKind}: ${rowLabel(row)} is not selectable but has positive recommendation/projection points`);
    }
    const pathText = `${row.hard_path_warning || ""} ${row.caution || ""} ${row.why_careful || ""}`;
    if (teamId === "france" && /argentina/i.test(pathText)) {
      failures.push(`${rowKind}: ${rowLabel(row)} resurrects impossible France/Argentina R16 warning`);
    }
    if (teamId === "argentina" && /france/i.test(pathText)) {
      failures.push(`${rowKind}: ${rowLabel(row)} resurrects impossible Argentina/France R16 warning`);
    }
  }
  return failures;
}

function validateScoreRows(rows, byMatch) {
  const failures = [];
  const r32Rows = rows.filter((row) => Number(row.match_number) >= 73 && Number(row.match_number) <= 88);
  for (const row of r32Rows) {
    const authority = byMatch.get(Number(row.match_number));
    if (!authority) {
      failures.push(`score: M${row.match_number} not in authority`);
      continue;
    }
    const homeId = authority.team_a.team_id;
    const awayId = authority.team_b.team_id;
    if (row.fixture_id !== fixtureId(authority.bracket_match_number)) {
      failures.push(`score: M${row.match_number} fixture ${row.fixture_id} expected ${fixtureId(authority.bracket_match_number)}`);
    }
    if (row.home_team_id !== homeId || row.away_team_id !== awayId) {
      failures.push(`score: M${row.match_number} ${row.home_team_id} vs ${row.away_team_id} expected ${homeId} vs ${awayId}`);
    }
  }
  const missing = [...byMatch.keys()].filter((matchNumber) => !r32Rows.some((row) => Number(row.match_number) === matchNumber));
  if (missing.length) failures.push(`score: missing R32 slots ${missing.map((match) => `M${match}`).join(", ")}`);
  return { failures, r32Rows };
}

async function main() {
  const authority = readJson("data/r32FixtureAuthority_v1.json");
  const recommendations = readJson("data/fantasyPoolRecommendations_r32_v1.json");
  const projections = readJson("data/fantasyPoolMatchdayProjections_r32_v1.json");
  const scores = readJson("data/scorePredictions_fantasyPool_r32_v1.json");
  const teamBuilder = readJson("data/teamBuilderQa_r32_v1.json");
  const bracketAudit = readJson("data/bracketPathIntegrityAudit_v1.json");
  const { byMatch, byTeam } = buildAuthorityIndexes(authority);
  const checks = [];
  const failures = [];

  const recommendationRows = recommendations.recommendationCandidates || [];
  const projectionRows = projections.playerMatchdayProjections || [];
  const scoreResult = validateScoreRows(scores.fixtureScorePredictions || [], byMatch);
  const recommendationFailures = validatePlayerRows(recommendationRows, byTeam, "recommendation");
  const projectionFailures = validatePlayerRows(projectionRows, byTeam, "projection");
  const captainRows = teamBuilder.top_captain_watchlist || [];
  const captainFailures = validatePlayerRows(captainRows, byTeam, "team_builder_captain");
  const r32Teams = new Set([...byTeam.keys()]);
  const recommendationTeams = new Set(recommendationRows.map((row) => row.team_id || slug(row.country)));
  const uncoveredAuthorityTeams = [...r32Teams].filter((teamId) => !projectionRows.some((row) => (row.team_id || slug(row.country)) === teamId));
  const france = bracketAudit.sanity?.find((row) => row.team === "France");
  const argentina = bracketAudit.sanity?.find((row) => row.team === "Argentina");
  const spain = bracketAudit.sanity?.find((row) => row.team === "Spain");
  const portugal = bracketAudit.sanity?.find((row) => row.team === "Portugal");

  addCheck(checks, failures, "authority_status_pass", authority.status === "pass", authority.status);
  addCheck(checks, failures, "score_predictions_cover_16_r32_fixtures", scoreResult.r32Rows.length === 16 && scoreResult.failures.length === 0, scoreResult.failures);
  addCheck(checks, failures, "recommendations_align_to_authority", recommendationFailures.length === 0, recommendationFailures.slice(0, 30));
  addCheck(checks, failures, "projections_align_to_authority", projectionFailures.length === 0, projectionFailures.slice(0, 30));
  addCheck(checks, failures, "team_builder_captain_watchlist_aligns_to_authority", captainFailures.length === 0, captainFailures.slice(0, 30));
  addCheck(checks, failures, "all_r32_authority_teams_have_projection_coverage", uncoveredAuthorityTeams.length === 0, uncoveredAuthorityTeams);
  addCheck(checks, failures, "recommendations_only_use_r32_teams", [...recommendationTeams].every((teamId) => r32Teams.has(teamId)), [...recommendationTeams].filter((teamId) => !r32Teams.has(teamId)));
  addCheck(checks, failures, "france_argentina_impossible_r16_absent", !france?.possible_r16_opponents?.includes("Argentina") && !argentina?.possible_r16_opponents?.includes("France"), {
    france_r16: france?.possible_r16_opponents || [],
    argentina_r16: argentina?.possible_r16_opponents || []
  });
  addCheck(checks, failures, "france_germany_path_computed", france?.possible_r16_opponents?.includes("Germany"), france?.possible_r16_opponents || []);
  addCheck(checks, failures, "argentina_path_computed", argentina?.possible_r16_opponents?.includes("Australia") && argentina?.possible_r16_opponents?.includes("Egypt"), argentina?.possible_r16_opponents || []);
  addCheck(checks, failures, "spain_portugal_path_computed", spain?.possible_r16_opponents?.includes("Portugal") && portugal?.possible_r16_opponents?.includes("Spain"), {
    spain_r16: spain?.possible_r16_opponents || [],
    portugal_r16: portugal?.possible_r16_opponents || []
  });

  const qa = {
    schema_version: "r32_recommendation_fixture_alignment_qa_v1",
    generated_at: generatedAt,
    status: failures.length ? "fail" : "pass",
    authority_fixture_count: authority.fixtures?.length || 0,
    score_prediction_r32_fixture_count: scoreResult.r32Rows.length,
    recommendation_count: recommendationRows.length,
    projection_count: projectionRows.length,
    team_builder_captain_watchlist_count: captainRows.length,
    checks,
    failures
  };

  const report = `# R32 Recommendation Fixture Alignment QA v1

Generated: ${qa.generated_at}

Status: **${qa.status.toUpperCase()}**

${mdTable(["Check", "Status", "Detail"], checks.map((check) => [
  check.id,
  check.status,
  Array.isArray(check.detail) ? check.detail.join("; ") : check.detail === null ? "" : JSON.stringify(check.detail)
]))}

## Counts

${mdTable(["Metric", "Value"], [
  ["Authority R32 fixtures", qa.authority_fixture_count],
  ["Score prediction R32 fixtures", qa.score_prediction_r32_fixture_count],
  ["Recommendations checked", qa.recommendation_count],
  ["Projections checked", qa.projection_count],
  ["Team Builder captain rows checked", qa.team_builder_captain_watchlist_count]
])}
`;

  await writeJson("data/r32RecommendationFixtureAlignmentQa_v1.json", qa);
  await writeText("data/r32RecommendationFixtureAlignmentQaReport_v1.md", report);
  console.log(`data/r32RecommendationFixtureAlignmentQa_v1.json: ${qa.status}`);
  if (failures.length) {
    console.error(JSON.stringify(failures, null, 2));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
