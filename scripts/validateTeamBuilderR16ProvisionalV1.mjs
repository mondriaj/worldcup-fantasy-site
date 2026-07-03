import { buildR16ProvisionalArtifacts } from "./lib/r16ProvisionalArtifacts.mjs";

const { teamBuilder, releaseQa } = await buildR16ProvisionalArtifacts();

console.log(JSON.stringify({
  status: teamBuilder.status,
  release_status: releaseQa.status,
  projection_rows: teamBuilder.summary.projection_rows,
  recommendation_rows: teamBuilder.summary.recommendation_rows,
  balanced_projected_points: teamBuilder.summary.balanced_projected_points,
  greedy_projected_points: teamBuilder.summary.greedy_projected_points,
  known_qualified_teams_preferred: teamBuilder.summary.known_qualified_teams_preferred,
  eliminated_and_unavailable_excluded: teamBuilder.summary.eliminated_and_unavailable_excluded,
  ownership_used_as_signal: teamBuilder.ownership_used_as_signal,
  final_squads_source_backed: teamBuilder.final_squads_source_backed
}, null, 2));

if (teamBuilder.status !== "pass" || releaseQa.status !== "pass") {
  process.exitCode = 1;
}
