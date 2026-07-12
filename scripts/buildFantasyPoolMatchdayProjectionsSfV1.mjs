import { buildSfArtifacts } from "./lib/sfFinalArtifacts.mjs";

const { projections } = await buildSfArtifacts();

console.log(JSON.stringify({
  status: projections.qa_status,
  projection_rows: projections.summary.projection_rows,
  default_matchday: projections.summary.defaultMatchday,
  top_projected_players: projections.summary.topProjectedSfPlayers.slice(0, 10)
}, null, 2));
