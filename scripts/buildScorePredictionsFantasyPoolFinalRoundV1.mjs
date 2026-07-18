import { buildFinalRoundArtifacts } from "./lib/finalRoundArtifacts.mjs";

const result = await buildFinalRoundArtifacts();

console.log(JSON.stringify({
  output: "data/scorePredictions_fantasyPool_finalRound_v1.json",
  status: result.score.data_status,
  summary: result.score.summary
}, null, 2));

if (result.score.data_status !== "final_round_score_prediction_pass") {
  process.exitCode = 1;
}
