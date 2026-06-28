import { buildAllR32Artifacts } from "./lib/r32Artifacts.mjs";

const { projections } = await buildAllR32Artifacts();

console.log(JSON.stringify({
  status: projections.qa_status,
  projection_rows: projections.playerMatchdayProjections.length,
  known_fixture_teams: projections.summary.known_fixture_teams,
  default_matchday: projections.summary.defaultMatchday
}, null, 2));
