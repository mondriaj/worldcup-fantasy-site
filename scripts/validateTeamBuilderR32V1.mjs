import { buildAllR32Artifacts } from "./lib/r32Artifacts.mjs";

const { teamBuilder } = await buildAllR32Artifacts();
console.log(JSON.stringify({
  status: teamBuilder.status,
  squad_size: teamBuilder.summary.squad_size,
  starter_count: teamBuilder.summary.starter_count,
  starter_projected_points: teamBuilder.summary.starter_projected_points,
  ownership_used_as_signal: teamBuilder.ownership_used_as_signal,
  final_squads_source_backed: teamBuilder.final_squads_source_backed
}, null, 2));

if (teamBuilder.status !== "pass") {
  process.exitCode = 1;
}
