import { buildSfArtifacts } from "./lib/sfFinalArtifacts.mjs";

const { role } = await buildSfArtifacts();

console.log(JSON.stringify({
  status: role.summary.explicit_qf_starting_xi_available && role.summary.points_only_start_inference_rows === 0 ? "pass" : "fail",
  role_rows: role.summary.role_rows,
  main_pool_players: role.summary.main_pool_players,
  qf_explicit_starter_rows: role.summary.qf_explicit_starter_rows,
  qf_explicit_non_starter_rows: role.summary.qf_explicit_non_starter_rows,
  unavailable_zeroed: role.summary.unavailable_zeroed,
  sf_teams_with_explicit_qf_starters: role.summary.sf_teams_with_explicit_qf_starters
}, null, 2));
