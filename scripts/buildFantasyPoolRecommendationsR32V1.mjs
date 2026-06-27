import { buildAllR32Artifacts } from "./lib/r32Artifacts.mjs";

const { recommendations } = await buildAllR32Artifacts();
console.log(JSON.stringify({
  status: recommendations.qa_status === "pass" && recommendations.recommendationCandidates.length > 0 ? "pass" : "fail",
  recommendation_candidates: recommendations.recommendationCandidates.length,
  qa_status: recommendations.qa_status,
  default_matchday: recommendations.summary.defaultMatchday
}, null, 2));
