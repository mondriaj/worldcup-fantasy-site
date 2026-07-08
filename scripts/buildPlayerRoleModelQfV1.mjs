import { buildQfArtifacts } from "./lib/qfFinalArtifacts.mjs";

const { role } = await buildQfArtifacts();

console.log(JSON.stringify({
  status: role.summary.r16_explicit_starter_rows >= 88 && role.summary.points_only_start_inference_rows === 0 ? "pass" : "fail",
  role_rows: role.summary.role_rows,
  main_pool_players: role.summary.main_pool_players,
  r16_explicit_starter_rows: role.summary.r16_explicit_starter_rows,
  r16_explicit_non_starter_rows: role.summary.r16_explicit_non_starter_rows,
  points_only_appearance_rows: role.summary.points_only_appearance_rows,
  points_only_start_inference_rows: role.summary.points_only_start_inference_rows,
  unavailable_zeroed: role.summary.unavailable_zeroed,
  explicit_starting_xi_available: role.summary.explicit_starting_xi_available
}, null, 2));
