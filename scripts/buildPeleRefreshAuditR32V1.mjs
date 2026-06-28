import { readFile, writeFile } from "node:fs/promises";

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

function finite(value) {
  return Number.isFinite(Number(value));
}

function markdownTable(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.join(" | ")} |`)
  ].join("\n");
}

const [teamQuality, peleRatings, scoreQa, recommendationQa] = await Promise.all([
  readJson("data/teamQuality.json"),
  readJson("data/peleRatings_v1.json"),
  readJson("data/scorePredictionQa_v2.json"),
  readJson("data/recommendationQa_v2.json")
]);

const teams = Array.isArray(teamQuality.teams) ? teamQuality.teams : [];
const peleRows = Array.isArray(peleRatings.rows) ? peleRatings.rows : [];
const missingPeleTeams = teams.filter((team) => !finite(team.current_strength_inputs?.pele_rating));
const invalidPeleRows = teams.filter((team) => {
  const inputs = team.current_strength_inputs || {};
  return !finite(inputs.pele_rating) || !finite(inputs.pele_offense_gf) || !finite(inputs.pele_defense_ga);
});
const duplicateTeamIds = [...teams.reduce((counts, team) => {
  const key = team.team_id || team.country;
  counts.set(key, (counts.get(key) || 0) + 1);
  return counts;
}, new Map()).entries()].filter(([, count]) => count > 1).map(([teamId]) => teamId);
const worldCupPeleMatches = teams.filter((team) => finite(team.current_strength_inputs?.pele_rating)).length;
const checks = [
  { id: "pele_rows_available", status: peleRows.length >= 48 ? "pass" : "fail", detail: peleRows.length },
  { id: "world_cup_team_coverage", status: worldCupPeleMatches === teams.length && teams.length === 48 ? "pass" : "fail", detail: `${worldCupPeleMatches}/${teams.length}` },
  { id: "no_duplicate_team_ids", status: duplicateTeamIds.length ? "fail" : "pass", detail: duplicateTeamIds.length },
  { id: "numeric_pele_inputs", status: invalidPeleRows.length ? "fail" : "pass", detail: invalidPeleRows.length },
  { id: "score_qa_available", status: scoreQa.overall_status === "pass" || scoreQa.data_status ? "pass" : "fail", detail: scoreQa.overall_status || scoreQa.data_status || "missing" },
  { id: "recommendation_qa_available", status: recommendationQa.global_summary || recommendationQa.scope ? "pass" : "fail", detail: recommendationQa.scope || "loaded" }
];
const status = checks.every((check) => check.status === "pass") ? "pass" : "fail";
const audit = {
  schema_version: "pele_refresh_audit_r32_v1",
  generated_at: new Date().toISOString(),
  status,
  source_checked: peleRatings.source_checked,
  pele_refreshed: true,
  pele_source_urls: peleRatings.source_urls,
  summary: {
    pele_rows: peleRows.length,
    world_cup_team_rows: teams.length,
    world_cup_pele_matches: worldCupPeleMatches,
    missing_pele_team_count: missingPeleTeams.length,
    duplicate_team_id_count: duplicateTeamIds.length,
    invalid_numeric_team_count: invalidPeleRows.length,
    team_quality_generated_at: teamQuality.generated_at,
    team_quality_formula: teamQuality.model?.team_quality_v2_formula || teamQuality.teams?.[0]?.team_quality_v2?.formula_version || null,
    ownership_used_as_signal: false,
    final_squads_source_backed: false
  },
  checks,
  caveats: [
    "Ownership is not used as a model signal.",
    "Final squads remain not source-backed.",
    "R32 outputs use known official knockout fixtures and keep unresolved slots uncertain."
  ]
};
const provisionalAudit = {
  ...audit,
  schema_version: "pele_refresh_audit_r32_provisional_v1",
  release_status: "provisional_r32_setup"
};
const finalAudit = {
  ...audit,
  schema_version: "pele_refresh_audit_r32_final_v1",
  release_status: "final_r32_setup"
};
const markdown = [
  "# PELE Refresh Audit R32 v1",
  "",
  `Status: ${status}`,
  "",
  markdownTable(["Metric", "Value"], [
    ["PELE rows", String(audit.summary.pele_rows)],
    ["World Cup teams covered", `${worldCupPeleMatches}/${teams.length}`],
    ["Missing PELE teams", String(missingPeleTeams.length)],
    ["Duplicate team IDs", String(duplicateTeamIds.length)],
    ["Invalid numeric inputs", String(invalidPeleRows.length)],
    ["Ownership used as signal", "false"],
    ["Final squads source-backed", "false"]
  ]),
  "",
  markdownTable(["Check", "Status", "Detail"], checks.map((check) => [check.id, check.status, String(check.detail)])),
  ""
].join("\n");

await writeFile("data/peleRefreshAudit_r32_v1.json", `${JSON.stringify(audit, null, 2)}\n`, "utf8");
await writeFile("data/peleRefreshAudit_r32_v1.md", markdown, "utf8");
await writeFile("data/peleRefreshAudit_r32_provisional_v1.json", `${JSON.stringify(provisionalAudit, null, 2)}\n`, "utf8");
await writeFile("data/peleRefreshAudit_r32_provisional_v1.md", markdown.replace("# PELE Refresh Audit R32 v1", "# PELE Refresh Audit R32 Provisional v1"), "utf8");
await writeFile("data/peleRefreshAudit_r32_final_v1.json", `${JSON.stringify(finalAudit, null, 2)}\n`, "utf8");
await writeFile("data/peleRefreshAudit_r32_final_v1.md", markdown.replace("# PELE Refresh Audit R32 v1", "# PELE Refresh Audit R32 Final v1"), "utf8");

console.log(JSON.stringify({
  status,
  pele_rows: peleRows.length,
  world_cup_pele_matches: worldCupPeleMatches,
  missing_pele_team_count: missingPeleTeams.length,
  duplicate_team_id_count: duplicateTeamIds.length,
  invalid_numeric_team_count: invalidPeleRows.length
}, null, 2));

if (status !== "pass") {
  process.exitCode = 1;
}
