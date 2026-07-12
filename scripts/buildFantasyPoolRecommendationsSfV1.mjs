import { buildSfArtifacts } from "./lib/sfFinalArtifacts.mjs";

const { recommendations } = await buildSfArtifacts();

console.log(JSON.stringify({
  status: recommendations.qa_status,
  recommendation_rows: recommendations.summary.recommendationCandidates,
  core_pick_rows: recommendations.summary.corePickRows,
  unsafe_core_pick_rows: recommendations.summary.corePickRowsWithoutExplicitQfStart,
  default_matchday: recommendations.summary.defaultMatchday,
  top_captains: recommendations.summary.topCaptainWatchlist.slice(0, 10)
}, null, 2));
