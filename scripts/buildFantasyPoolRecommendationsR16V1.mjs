import { buildR16Artifacts } from "./lib/r16FinalArtifacts.mjs";

const { recommendations } = await buildR16Artifacts();

console.log(JSON.stringify({
  status: recommendations.qa_status,
  recommendation_candidates: recommendations.summary.recommendationCandidates,
  known_r16_fixtures_used: recommendations.summary.knownR16FixturesUsed,
  default_matchday: recommendations.summary.defaultMatchday
}, null, 2));
