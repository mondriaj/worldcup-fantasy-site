import { buildR16Artifacts } from "./lib/r16FinalArtifacts.mjs";

const { score } = await buildR16Artifacts();

console.log(JSON.stringify({
  status: score.summary.final_known_fixture_predictions === 8 && score.summary.partial_or_pending_fixture_rows === 0 ? "pass" : "fail",
  fixture_prediction_count: score.summary.fixture_prediction_count,
  final_known_fixture_predictions: score.summary.final_known_fixture_predictions,
  default_matchday: score.summary.defaultMatchday
}, null, 2));
