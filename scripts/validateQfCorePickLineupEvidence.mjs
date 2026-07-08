import { readFile, writeFile } from "node:fs/promises";

const GENERATED_AT = new Date().toISOString();

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function writeText(filePath, text) {
  await writeFile(filePath, `${text.trimEnd()}\n`, "utf8");
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function rowsFromJson(data, keys) {
  if (Array.isArray(data)) return data;
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
}

function mdTable(headers, rows) {
  if (!rows.length) return "_None._";
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((value) => String(value ?? "")).join(" | ")} |`)
  ].join("\n");
}

function hasLegacyPointsStartFlag(row) {
  const flags = [...(row.data_quality_flags || []), ...(row.dataQualityFlags || [])];
  return flags.includes("r16_participation_points_weighted") ||
    flags.includes("r16_participation_evidence_weighted") ||
    String(row.evidenceStrength || "").includes("participation_points");
}

function isCoreEligible(row) {
  return row.allowedCorePick === true &&
    row.r16Started === true &&
    row.lineupEvidenceType === "explicit_r16_starter" &&
    Number(row.start_probability || row.startProb || 0) >= 0.74 &&
    !hasLegacyPointsStartFlag(row) &&
    !(row.data_quality_flags || []).includes("points_only_appearance_not_start");
}

const recommendations = await readJson("data/fantasyPoolRecommendations_qf_v1.json");
const projections = await readJson("data/fantasyPoolMatchdayProjections_qf_v1.json");
const role = await readJson("data/playerRoleModel_qf_v1.json");
const lineupQa = await readJson("data/worldCupLineupEvidenceQa_v1.json");
const teamBuilderQa = await readJson("data/teamBuilderQa_qf_v1.json");

const recommendationRows = rowsFromJson(recommendations, ["recommendationCandidates"]);
const projectionRows = rowsFromJson(projections, ["playerMatchdayProjections"]);
const roleRows = rowsFromJson(role, ["playerRoleRows"]);
const coreRows = recommendationRows.filter((row) => row.mode === "balanced" || row.pickType === "Core Picks");
const unsafeCoreRows = coreRows.filter((row) => !isCoreEligible(row));
const medinaCoreRows = coreRows.filter((row) => normalizeText(`${row.name} ${row.display_name}`).includes("facundo medina"));
const medinaRoleRows = roleRows.filter((row) => normalizeText(`${row.name} ${row.display_name}`).includes("facundo medina"));
const legacyPointFlagRows = [
  ...roleRows.filter(hasLegacyPointsStartFlag).map((row) => ({ surface: "role", name: row.name, country: row.country, flag: row.evidenceStrength || "legacy_flag" })),
  ...projectionRows.filter(hasLegacyPointsStartFlag).map((row) => ({ surface: "projection", name: row.name, country: row.country, flag: row.evidenceStrength || "legacy_flag" })),
  ...recommendationRows.filter(hasLegacyPointsStartFlag).map((row) => ({ surface: "recommendation", name: row.name, country: row.country, flag: row.evidenceStrength || "legacy_flag", mode: row.mode }))
];

const errors = [];
if (lineupQa.status !== "pass") errors.push(`World Cup lineup evidence QA is ${lineupQa.status}.`);
if ((role.summary?.r16_explicit_starter_rows || 0) < 88) errors.push(`Expected at least 88 explicit R16 starter rows in QF role model, found ${role.summary?.r16_explicit_starter_rows}.`);
if (role.summary?.points_can_imply_starter !== false) errors.push("Role model does not explicitly block points from implying starts.");
if ((role.summary?.points_only_start_inference_rows || 0) !== 0) errors.push("Role model reports points-only start inference rows.");
if (!coreRows.length) errors.push("No QF Core Pick rows found.");
if (unsafeCoreRows.length) errors.push(`${unsafeCoreRows.length} Core Pick row(s) lack explicit R16 starter evidence.`);
if (medinaCoreRows.length) errors.push("Facundo Medina remains in QF Core Picks.");
if (!medinaRoleRows.some((row) => row.r16Started === false && row.lineupEvidenceType === "explicit_r16_non_starter")) {
  errors.push("Facundo Medina is not recorded as an explicit R16 non-starter in the QF role model.");
}
if (legacyPointFlagRows.length) errors.push(`${legacyPointFlagRows.length} QF row(s) still carry legacy participation-points starter flags.`);
if (!teamBuilderQa.summary?.explicit_r16_starters_only_for_builder_samples) errors.push("Team Builder samples are not restricted to explicit R16 starters.");
if ((teamBuilderQa.summary?.points_only_rows_used_as_starters || 0) !== 0) errors.push("Team Builder samples use points-only rows as starters.");
if ((teamBuilderQa.unsafe_sample_rows || []).length) errors.push(`Team Builder has ${teamBuilderQa.unsafe_sample_rows.length} unsafe sample row(s).`);

const qa = {
  schema_version: "qf_core_pick_lineup_evidence_qa_v1",
  generated_at: GENERATED_AT,
  status: errors.length ? "fail" : "pass",
  summary: {
    core_pick_rows: coreRows.length,
    unsafe_core_pick_rows: unsafeCoreRows.length,
    medina_core_pick_rows: medinaCoreRows.length,
    medina_role_rows: medinaRoleRows.length,
    legacy_points_start_flag_rows: legacyPointFlagRows.length,
    team_builder_unsafe_sample_rows: (teamBuilderQa.unsafe_sample_rows || []).length,
    lineup_evidence_qa_status: lineupQa.status,
    role_explicit_r16_starter_rows: role.summary?.r16_explicit_starter_rows,
    points_can_imply_starter: role.summary?.points_can_imply_starter
  },
  errors,
  unsafe_core_rows: unsafeCoreRows.slice(0, 25),
  medina_core_rows: medinaCoreRows,
  medina_role_rows: medinaRoleRows,
  legacy_points_start_flag_rows: legacyPointFlagRows.slice(0, 50),
  core_pick_sample: coreRows.slice(0, 25).map((row) => ({
    rank: row.rank,
    name: row.name,
    country: row.country,
    lineupEvidenceType: row.lineupEvidenceType,
    r16Started: row.r16Started,
    start_probability: row.start_probability,
    coreEligibilityReason: row.coreEligibilityReason
  }))
};

await writeJson("data/qfCorePickLineupEvidenceQa_v1.json", qa);
await writeText("data/qfCorePickLineupEvidenceQaReport_v1.md", [
  "# QF Core Pick Lineup Evidence QA v1",
  "",
  `Generated: ${GENERATED_AT}`,
  "",
  `Status: ${qa.status}`,
  "",
  mdTable(["Metric", "Value"], Object.entries(qa.summary)),
  "",
  "## Errors",
  "",
  errors.length ? errors.map((error) => `- ${error}`).join("\n") : "_None._",
  "",
  "## Core Pick Sample",
  "",
  mdTable(["Rank", "Player", "Team", "Evidence", "R16 started", "Start prob"], qa.core_pick_sample.map((row) => [
    row.rank,
    row.name,
    row.country,
    row.lineupEvidenceType,
    row.r16Started,
    row.start_probability
  ]))
].join("\n"));

console.log(JSON.stringify({
  status: qa.status,
  core_pick_rows: qa.summary.core_pick_rows,
  unsafe_core_pick_rows: qa.summary.unsafe_core_pick_rows,
  medina_core_pick_rows: qa.summary.medina_core_pick_rows,
  legacy_points_start_flag_rows: qa.summary.legacy_points_start_flag_rows,
  errors
}, null, 2));

if (errors.length) process.exitCode = 1;
