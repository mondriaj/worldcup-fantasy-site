import { buildFinalRoundArtifacts } from "./lib/finalRoundArtifacts.mjs";

const result = await buildFinalRoundArtifacts();

console.log(JSON.stringify({
  output: "data/fantasyPoolRecommendations_finalRound_v1.json",
  status: result.recommendations.data_status,
  summary: result.recommendations.summary
}, null, 2));

if (result.recommendations.data_status !== "active_final_round_recommendations_v1_pass") {
  process.exitCode = 1;
}
