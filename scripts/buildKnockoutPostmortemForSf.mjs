import { buildSfArtifacts } from "./lib/sfFinalArtifacts.mjs";

const { postmortem } = await buildSfArtifacts();

console.log(JSON.stringify({
  status: postmortem.status,
  residual_rows: postmortem.residuals.length,
  role_change_groups: Object.keys(postmortem.role_changes || {})
}, null, 2));
