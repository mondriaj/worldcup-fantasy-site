import { buildR16Artifacts } from "./lib/r16FinalArtifacts.mjs";

const { role } = await buildR16Artifacts();

console.log(JSON.stringify({
  status: role.summary.r32_participation_points_weighted > 0 ? "pass" : "fail",
  role_rows: role.summary.role_rows,
  main_pool_players: role.summary.main_pool_players,
  r32_participation_points_weighted: role.summary.r32_participation_points_weighted,
  unavailable_zeroed: role.summary.unavailable_zeroed,
  explicit_starting_xi_available: role.summary.explicit_starting_xi_available
}, null, 2));
