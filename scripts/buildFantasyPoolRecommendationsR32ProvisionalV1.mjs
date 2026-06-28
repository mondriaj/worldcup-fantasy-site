import { buildAllR32Artifacts } from "./lib/r32Artifacts.mjs";

const { recommendations } = await buildAllR32Artifacts();

console.log(JSON.stringify({
  status: recommendations.qa_status,
  candidates: recommendations.recommendationCandidates.length,
  known_r32_fixtures_used: recommendations.summary.knownR32FixturesUsed,
  default_matchday: recommendations.summary.defaultMatchday
}, null, 2));
