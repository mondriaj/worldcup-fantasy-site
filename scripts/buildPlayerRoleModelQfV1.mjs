import { buildQfArtifacts } from "./lib/qfFinalArtifacts.mjs";

const { role } = await buildQfArtifacts();

console.log(JSON.stringify({
  status: role.summary.r16_participation_points_weighted > 0 ? "pass" : "fail",
  role_rows: role.summary.role_rows,
  main_pool_players: role.summary.main_pool_players,
  r16_participation_points_weighted: role.summary.r16_participation_points_weighted,
  r16_no_points_downgraded: role.summary.r16_no_points_downgraded,
  unavailable_zeroed: role.summary.unavailable_zeroed,
  explicit_starting_xi_available: role.summary.explicit_starting_xi_available
}, null, 2));
