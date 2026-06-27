import { buildAllR32Artifacts } from "./lib/r32Artifacts.mjs";

const { projections } = await buildAllR32Artifacts();
console.log(JSON.stringify({
  status: projections.qa_status === "pass" && projections.playerMatchdayProjections.length > 0 ? "pass" : "fail",
  player_matchday_projection_rows: projections.playerMatchdayProjections.length,
  qa_status: projections.qa_status,
  default_matchday: projections.summary.defaultMatchday
}, null, 2));
