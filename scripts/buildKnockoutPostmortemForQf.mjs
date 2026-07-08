import { buildQfArtifacts } from "./lib/qfFinalArtifacts.mjs";

const { postmortem } = await buildQfArtifacts();

console.log(JSON.stringify({
  status: postmortem.status,
  r16_fixtures_checked: postmortem.summary.r16_fixtures_checked,
  r16_final_scores_used: postmortem.summary.r16_final_scores_used,
  explicit_starting_xi_available: postmortem.summary.explicit_starting_xi_available
}, null, 2));
