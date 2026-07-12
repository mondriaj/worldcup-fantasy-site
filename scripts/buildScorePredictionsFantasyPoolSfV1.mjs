import { buildSfArtifacts } from "./lib/sfFinalArtifacts.mjs";

const { score } = await buildSfArtifacts();

console.log(JSON.stringify({
  status: score.summary.fixture_prediction_count === 2 && score.summary.final_known_fixture_predictions === 2 ? "pass" : "fail",
  fixture_prediction_count: score.summary.fixture_prediction_count,
  final_known_fixture_predictions: score.summary.final_known_fixture_predictions,
  default_matchday: score.summary.defaultMatchday,
  projected_final_match: score.summary.projected_final_match,
  projected_third_place_match: score.summary.projected_third_place_match
}, null, 2));
