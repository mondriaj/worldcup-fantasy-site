import { readFile } from "node:fs/promises";

const qa = JSON.parse(await readFile("data/teamBuilderQa_r16_v1.json", "utf8"));
const errors = [];

if (qa.status !== "pass") errors.push(`Team Builder QA status is ${qa.status}.`);
if (qa.summary?.defaultMatchday !== "r16") errors.push(`Expected defaultMatchday r16, found ${qa.summary?.defaultMatchday}.`);
if ((qa.summary?.projection_rows || 0) <= 0) errors.push("No R16 projection rows available for Team Builder.");
if (!qa.summary?.eliminated_and_unavailable_excluded) errors.push("Team Builder QA does not confirm eliminated/unavailable exclusions.");

console.log(JSON.stringify({
  status: errors.length ? "fail" : "pass",
  projection_rows: qa.summary?.projection_rows,
  balanced_projected_points: qa.summary?.balanced_projected_points,
  greedy_projected_points: qa.summary?.greedy_projected_points,
  errors
}, null, 2));

if (errors.length) process.exitCode = 1;
