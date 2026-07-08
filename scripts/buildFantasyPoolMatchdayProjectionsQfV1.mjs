import { buildQfArtifacts } from "./lib/qfFinalArtifacts.mjs";

const { projections } = await buildQfArtifacts();

console.log(JSON.stringify({
  status: projections.qa_status,
  projection_rows: projections.summary.projection_rows,
  known_fixture_teams: projections.summary.known_fixture_teams,
  default_matchday: projections.summary.defaultMatchday
}, null, 2));
