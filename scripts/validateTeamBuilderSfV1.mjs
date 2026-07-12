import { readFile, writeFile } from "node:fs/promises";

const CHECKED_AT = new Date().toISOString();

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function mdList(items) {
  return items.length ? items.map((item) => `- ${item}`).join("\n") : "_None._";
}

const qa = await readJson("data/teamBuilderQa_sf_v1.json");
const errors = [];
const balanced = qa.balanced_squad || [];
const sfTeams = new Set(["France", "Spain", "England", "Argentina"]);

if (qa.status !== "pass") errors.push(`Team Builder QA status is ${qa.status}.`);
if (qa.summary?.defaultMatchday !== "sf") errors.push("Team Builder default matchday is not sf.");
if (balanced.length !== 15) errors.push(`Balanced squad has ${balanced.length} players, expected 15.`);
if (!qa.summary?.path_value_to_final_third_place_included) errors.push("Path value to Final/Third Place is not included.");
if (!qa.summary?.role_volatility_included) errors.push("Role volatility is not included.");
if (!qa.summary?.explicit_qf_starters_only_for_builder_samples) errors.push("Balanced squad includes a non-explicit-QF-starter sample.");
if (qa.summary?.points_only_rows_used_as_starters) errors.push("Balanced squad includes points-only starter evidence.");

for (const row of balanced) {
  if (!sfTeams.has(row.country)) errors.push(`${row.name} is not on an SF team.`);
  if (row.qfStarted !== true || row.lineupEvidenceType !== "explicit_qf_starter") errors.push(`${row.name} lacks explicit QF starter evidence.`);
}

const out = {
  schema_version: "team_builder_sf_validation_v1",
  generated_at: CHECKED_AT,
  status: errors.length ? "fail" : "pass",
  summary: qa.summary,
  balanced_squad: balanced,
  errors
};
const report = [
  "# Team Builder SF Validation v1",
  "",
  `Generated: ${CHECKED_AT}`,
  "",
  `Status: ${out.status}`,
  "",
  "## Errors",
  "",
  mdList(errors)
].join("\n");

await writeFile("data/teamBuilderValidation_sf_v1.json", `${JSON.stringify(out, null, 2)}\n`, "utf8");
await writeFile("data/teamBuilderValidationReport_sf_v1.md", `${report}\n`, "utf8");
console.log(JSON.stringify({ status: out.status, balanced_players: balanced.length, errors }, null, 2));
if (errors.length) process.exitCode = 1;
