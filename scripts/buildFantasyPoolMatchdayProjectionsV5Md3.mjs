import { runStep } from "./lib/md3ReleaseStack.mjs";

const { qa, output } = await runStep("projection");
console.log(JSON.stringify({
  status: qa.status,
  modelVersion: output.modelVersion,
  projectionRows: output.summary.projection_rows,
  md3ProjectionRows: output.summary.md3_projection_rows,
  output_json: "data/fantasyPoolMatchdayProjections_md3_v5.json"
}, null, 2));
if (qa.status !== "pass") process.exitCode = 1;
