import { buildR16ProvisionalArtifacts } from "./lib/r16ProvisionalArtifacts.mjs";

const { role } = await buildR16ProvisionalArtifacts();

const status = role.playerRoleRows.length > 0 ? "pass" : "fail";

console.log(JSON.stringify({
  status,
  player_count: role.playerRoleRows.length,
  main_pool_players: role.summary.main_pool_players,
  conditional_pool_players: role.summary.conditional_pool_players,
  excluded_players: role.summary.excluded_players,
  r32_starters_preserved: role.summary.r32_starters_preserved
}, null, 2));

if (status !== "pass") {
  process.exitCode = 1;
}
