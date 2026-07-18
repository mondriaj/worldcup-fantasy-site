import { buildFinalRoundArtifacts } from "./lib/finalRoundArtifacts.mjs";

const result = await buildFinalRoundArtifacts();

console.log(JSON.stringify({
  output: "data/fantasyPoolMatchdayProjections_finalRound_v1.json",
  status: result.projections.data_status,
  summary: result.projections.summary
}, null, 2));

if (result.projections.data_status !== "active_final_round_projection_v1_pass") {
  process.exitCode = 1;
}
