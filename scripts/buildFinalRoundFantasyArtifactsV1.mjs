import { buildFinalRoundArtifacts } from "./lib/finalRoundArtifacts.mjs";

const result = await buildFinalRoundArtifacts();

console.log(JSON.stringify({
  status: result.releaseQa.status,
  fixtures: result.authority.summary,
  projections: result.projections.summary.projection_rows,
  recommendations: result.recommendations.summary.recommendationCandidates,
  team_builder: result.teamBuilder.status
}, null, 2));

if (result.releaseQa.status !== "pass") {
  process.exitCode = 1;
}
