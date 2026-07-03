import { buildR16ProvisionalArtifacts } from "./lib/r16ProvisionalArtifacts.mjs";

const { recommendations } = await buildR16ProvisionalArtifacts();

const status = recommendations.qa_status === "pass" && recommendations.recommendationCandidates.length > 0 ? "pass" : "fail";

console.log(JSON.stringify({
  status,
  recommendation_candidates: recommendations.summary.recommendationCandidates,
  r16_candidates: recommendations.summary.r16Candidates,
  modes: recommendations.summary.modes,
  known_r16_fixtures_used: recommendations.summary.knownR16FixturesUsed
}, null, 2));

if (status !== "pass") {
  process.exitCode = 1;
}
