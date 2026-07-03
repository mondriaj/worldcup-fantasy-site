import { buildR16ProvisionalArtifacts } from "./lib/r16ProvisionalArtifacts.mjs";

const { projections } = await buildR16ProvisionalArtifacts();

const status = projections.qa_status === "pass" && projections.playerMatchdayProjections.length > 0 ? "pass" : "fail";

console.log(JSON.stringify({
  status,
  projection_rows: projections.summary.projection_rows,
  r16_projection_rows: projections.summary.r16_projection_rows,
  known_fixture_teams: projections.summary.known_fixture_teams,
  default_matchday: projections.summary.defaultMatchday
}, null, 2));

if (status !== "pass") {
  process.exitCode = 1;
}
