import { buildR16Artifacts } from "./lib/r16FinalArtifacts.mjs";

const { projections } = await buildR16Artifacts();

console.log(JSON.stringify({
  status: projections.qa_status,
  projection_rows: projections.summary.projection_rows,
  default_matchday: projections.summary.defaultMatchday
}, null, 2));
