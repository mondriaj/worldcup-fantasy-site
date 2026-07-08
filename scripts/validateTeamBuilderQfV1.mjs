import { readFile } from "node:fs/promises";

const qa = JSON.parse(await readFile("data/teamBuilderQa_qf_v1.json", "utf8"));
const errors = [];

if (qa.status !== "pass") errors.push(`Team Builder QA status is ${qa.status}.`);
if (qa.summary?.defaultMatchday !== "qf") errors.push(`Expected defaultMatchday qf, found ${qa.summary?.defaultMatchday}.`);
if ((qa.summary?.projection_rows || 0) <= 0) errors.push("No QF projection rows available for Team Builder.");
if (!qa.summary?.eliminated_and_unavailable_excluded) errors.push("Team Builder QA does not confirm eliminated/unavailable exclusions.");
if (!qa.summary?.path_value_beyond_qf_included) errors.push("Team Builder QA does not confirm path value beyond QF.");
if (!qa.summary?.role_volatility_included) errors.push("Team Builder QA does not confirm role volatility.");
if (!qa.summary?.explicit_r16_starters_only_for_builder_samples) errors.push("Team Builder samples include rows without explicit R16 starter evidence.");
if ((qa.summary?.points_only_rows_used_as_starters || 0) !== 0) errors.push("Team Builder samples use points-only rows as starters.");
if ((qa.unsafe_sample_rows || []).length) errors.push(`Team Builder has ${qa.unsafe_sample_rows.length} unsafe sample row(s).`);

console.log(JSON.stringify({
  status: errors.length ? "fail" : "pass",
  projection_rows: qa.summary?.projection_rows,
  builder_eligible_rows: qa.summary?.builder_eligible_rows,
  balanced_projected_points: qa.summary?.balanced_projected_points,
  greedy_projected_points: qa.summary?.greedy_projected_points,
  errors
}, null, 2));

if (errors.length) process.exitCode = 1;
