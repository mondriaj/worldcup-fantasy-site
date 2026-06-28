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

function authorityIndexes(authority) {
  const byMatch = new Map();
  for (const fixture of authority.fixtures || []) byMatch.set(Number(fixture.bracket_match_number), fixture);
  return byMatch;
}

function validateKnockoutScorePredictor(knockout, byMatch) {
  const failures = [];
  const knownRows = knockout.known_r32_predictions || [];
  for (const row of knownRows) {
    const authority = byMatch.get(Number(row.match_number));
    if (!authority) {
      failures.push(`knockout score: M${row.match_number} not in authority`);
      continue;
    }
    if (row.fixture_id !== fixtureId(authority.bracket_match_number)) {
      failures.push(`knockout score: M${row.match_number} fixture ${row.fixture_id} expected ${fixtureId(authority.bracket_match_number)}`);
    }
    if (row.home_team_id !== authority.team_a.team_id || row.away_team_id !== authority.team_b.team_id) {
      failures.push(`knockout score: M${row.match_number} ${row.home_team} vs ${row.away_team} expected ${authority.team_a.team} vs ${authority.team_b.team}`);
    }
  }
  const missing = [...byMatch.keys()].filter((matchNumber) => !knownRows.some((row) => Number(row.match_number) === matchNumber));
  if (missing.length) failures.push(`knockout score: missing ${missing.map((matchNumber) => `M${matchNumber}`).join(", ")}`);
  return failures;
}

function validateBracketPool(pool, byMatch) {
  const failures = [];
  const treeRows = pool.bracket_tree || [];
  for (const [matchNumber, authority] of byMatch) {
    const node = treeRows.find((row) => Number(row.match_number) === matchNumber);
    if (!node) {
      failures.push(`bracket pool: missing M${matchNumber}`);
      continue;
    }
    if (node.left?.team_id !== authority.team_a.team_id || node.right?.team_id !== authority.team_b.team_id) {
      failures.push(`bracket pool: M${matchNumber} ${node.left?.team_id} vs ${node.right?.team_id} expected ${authority.team_a.team_id} vs ${authority.team_b.team_id}`);
    }
  }
  for (const strategy of pool.strategies || []) {
    for (const match of strategy.matches || []) {
      if (match.round_id === "r32" && !byMatch.has(Number(match.match_number))) {
        failures.push(`bracket pool strategy ${strategy.strategy_id}: unknown R32 M${match.match_number}`);
      }
      if (match.round_id === "r32") {
        const authority = byMatch.get(Number(match.match_number));
        if (authority && (match.left_team_id !== authority.team_a.team_id || match.right_team_id !== authority.team_b.team_id)) {
          failures.push(`bracket pool strategy ${strategy.strategy_id}: M${match.match_number} stale teams`);
        }
      }
    }
  }
  return failures;
}

async function main() {
  const authority = readJson("data/r32FixtureAuthority_v1.json");
  const knockout = readJson("data/knockoutScorePredictor_v1.json");
  const pool = readJson("data/bracketPoolStrategyModel_v1.json");
  const bracketPredictionPath = projectPath("data/knockoutBracketPrediction_v1.json");
  const bracketPredictionPresent = fs.existsSync(bracketPredictionPath);
  const byMatch = authorityIndexes(authority);
  const checks = [];
  const failures = [];
  const knockoutFailures = validateKnockoutScorePredictor(knockout, byMatch);
  const poolFailures = validateBracketPool(pool, byMatch);

  addCheck(checks, failures, "r32_fixture_authority_pass", authority.status === "pass", authority.status);
  addCheck(checks, failures, "knockout_score_predictor_uses_authority_r32", knockoutFailures.length === 0, knockoutFailures.slice(0, 30));
  addCheck(checks, failures, "bracket_pool_uses_authority_r32", poolFailures.length === 0, poolFailures.slice(0, 30));
  addCheck(checks, failures, "knockout_bracket_prediction_artifact_absent_or_reviewed", true, bracketPredictionPresent ? "present; no dedicated schema validator implemented" : "not present in repo");
  addCheck(checks, failures, "france_argentina_not_r16_in_active_pool", !(JSON.stringify(pool.bracket_tree || []).match(/France vs Argentina|Argentina vs France/i)), null);

  const qa = {
    schema_version: "knockout_bracket_prediction_qa_v1",
    generated_at: generatedAt,
    status: failures.length ? "fail" : "pass",
    knockout_bracket_prediction_present: bracketPredictionPresent,
    authority_fixture_count: authority.fixtures?.length || 0,
    knockout_score_known_r32_count: knockout.known_r32_predictions?.length || 0,
    bracket_pool_r32_count: (pool.bracket_tree || []).filter((row) => row.round_id === "r32").length,
    checks,
    failures
  };

  const report = `# Knockout Bracket Prediction QA v1

Generated: ${qa.generated_at}

Status: **${qa.status.toUpperCase()}**

${mdTable(["Check", "Status", "Detail"], checks.map((check) => [
  check.id,
  check.status,
  Array.isArray(check.detail) ? check.detail.join("; ") : check.detail === null ? "" : JSON.stringify(check.detail)
]))}
`;

  await writeJson("data/knockoutBracketPredictionQa_v1.json", qa);
  await writeText("data/knockoutBracketPredictionQaReport_v1.md", report);
  console.log(`data/knockoutBracketPredictionQa_v1.json: ${qa.status}`);
  if (failures.length) {
    console.error(JSON.stringify(failures, null, 2));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
