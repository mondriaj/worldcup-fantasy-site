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

const [recommendations, projections, role] = await Promise.all([
  readJson("data/fantasyPoolRecommendations_sf_v1.json"),
  readJson("data/fantasyPoolMatchdayProjections_sf_v1.json"),
  readJson("data/playerRoleModel_sf_v1.json")
]);

const sfTeams = new Set(["france", "spain", "england", "argentina"]);
const coreRows = rowsFromJson(recommendations, ["recommendationCandidates"]).filter((row) => row.mode === "balanced" || row.pickType === "Core Picks");
const projectionRows = rowsFromJson(projections, ["playerMatchdayProjections"]);
const roleRows = rowsFromJson(role, ["playerRoleRows"]);
const errors = [];

const unsafeCore = coreRows.filter((row) =>
  row.qfStarted !== true ||
  row.lineupEvidenceType !== "explicit_qf_starter" ||
  row.allowedCorePick !== true ||
  Number(row.start_probability || 0) < 0.78 ||
  (row.data_quality_flags || []).includes("points_only_appearance_not_start") ||
  row.majorRoleCaution === true
);
if (unsafeCore.length) errors.push(`${unsafeCore.length} SF Core Pick row(s) lack explicit QF starter evidence or have a major role warning.`);

const eliminatedCore = coreRows.filter((row) => !sfTeams.has(row.team_id));
if (eliminatedCore.length) errors.push(`${eliminatedCore.length} eliminated-team player(s) appear in SF Core Picks.`);

const wrongFixtureRows = coreRows.filter((row) => row.matchday !== "sf" || !["fwc2026-m101", "fwc2026-m102"].includes(row.fixture_id));
if (wrongFixtureRows.length) errors.push(`${wrongFixtureRows.length} Core Pick row(s) have wrong SF fixture context.`);

const pointsOnlyCore = coreRows.filter((row) => String(row.evidenceStrength || "").includes("points") || row.lineupEvidenceType === "points_only_appearance");
if (pointsOnlyCore.length) errors.push(`${pointsOnlyCore.length} Core Pick row(s) use points-only appearance evidence.`);

const qfBenchCore = coreRows.filter((row) => row.qfStarted !== true);
if (qfBenchCore.length) errors.push(`${qfBenchCore.length} QF non-starter/bench row(s) appear as Core Picks.`);

const starterInferenceFlags = roleRows.filter((row) =>
  (row.data_quality_flags || []).includes("no_start_inferred_from_points") && row.qfStarted === true
);
if (starterInferenceFlags.length) errors.push(`${starterInferenceFlags.length} role row(s) both forbid points inference and mark QF started.`);

const qa = {
  schema_version: "sf_core_pick_lineup_evidence_qa_v1",
  generated_at: CHECKED_AT,
  status: errors.length ? "fail" : "pass",
  summary: {
    core_pick_rows: coreRows.length,
    unsafe_core_pick_rows: unsafeCore.length,
    eliminated_core_rows: eliminatedCore.length,
    wrong_fixture_rows: wrongFixtureRows.length,
    points_only_core_rows: pointsOnlyCore.length,
    qf_bench_core_rows: qfBenchCore.length,
    projection_rows: projectionRows.length,
    points_can_imply_starter: false
  },
  unsafe_core_pick_rows: unsafeCore,
  top_core_picks: coreRows.slice(0, 25).map((row) => ({
    rank: row.rank,
    name: row.name,
    team: row.country,
    evidence: row.lineupEvidenceType,
    qfStarted: row.qfStarted,
    start_probability: row.start_probability
  })),
  errors
};

const report = [
  "# SF Core Pick Lineup Evidence QA v1",
  "",
  `Generated: ${CHECKED_AT}`,
  "",
  `Status: ${qa.status}`,
  "",
  mdList(Object.entries(qa.summary).map(([key, value]) => `${key}: ${value}`)),
  "",
  "## Errors",
  "",
  mdList(errors)
].join("\n");

await writeFile("data/sfCorePickLineupEvidenceQa_v1.json", `${JSON.stringify(qa, null, 2)}\n`, "utf8");
await writeFile("data/sfCorePickLineupEvidenceQaReport_v1.md", `${report}\n`, "utf8");
console.log(JSON.stringify({ status: qa.status, summary: qa.summary, errors }, null, 2));
if (errors.length) process.exitCode = 1;
