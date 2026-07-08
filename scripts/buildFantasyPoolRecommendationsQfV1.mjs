import { buildQfArtifacts } from "./lib/qfFinalArtifacts.mjs";

const { recommendations } = await buildQfArtifacts();

console.log(JSON.stringify({
  status: recommendations.qa_status,
  recommendation_candidates: recommendations.summary.recommendationCandidates,
  known_qf_fixtures_used: recommendations.summary.knownQfFixturesUsed,
  default_matchday: recommendations.summary.defaultMatchday
}, null, 2));
