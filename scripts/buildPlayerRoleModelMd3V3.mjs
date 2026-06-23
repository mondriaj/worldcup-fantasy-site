import { runStep } from "./lib/md3ReleaseStack.mjs";

const { qa, output } = await runStep("role");
console.log(JSON.stringify({
  status: qa.status,
  modelVersion: output.modelVersion,
  roleRows: output.summary.role_rows,
  completedMd2PlayerEvidenceRows: output.summary.completedMd2PlayerEvidenceRows,
  output_json: "data/playerRoleModel_md3_v3.json"
}, null, 2));
if (qa.status !== "pass") process.exitCode = 1;
