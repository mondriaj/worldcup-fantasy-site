import { buildR16ProvisionalArtifacts } from "./lib/r16ProvisionalArtifacts.mjs";

const { score } = await buildR16ProvisionalArtifacts();

const status = score.fixtureScorePredictions.length > 0 && score.data_status?.endsWith("_pass") ? "pass" : "fail";

console.log(JSON.stringify({
  status,
  fixture_score_predictions: score.fixtureScorePredictions.length,
  final_known_fixture_count: score.summary.final_known_fixture_predictions,
  partial_or_pending_fixture_rows: score.summary.partial_or_pending_fixture_rows,
  completed_r32_fixtures_used: score.summary.completedR32FixturesUsed,
  remaining_r32_fixtures_pending: score.summary.remainingR32FixturesPending
}, null, 2));

if (status !== "pass") {
  process.exitCode = 1;
}
