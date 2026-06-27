import { buildAllR32Artifacts } from "./lib/r32Artifacts.mjs";

const { score } = await buildAllR32Artifacts();
console.log(JSON.stringify({
  status: score.summary.r32_fixture_count > 0 && score.fixtureScorePredictions.length > 0 ? "pass" : "fail",
  fixture_score_predictions: score.fixtureScorePredictions.length,
  r32_fixture_count: score.summary.r32_fixture_count,
  unfinished_md3_fixtures_excluded: score.summary.unfinishedMd3FixturesExcluded
}, null, 2));
