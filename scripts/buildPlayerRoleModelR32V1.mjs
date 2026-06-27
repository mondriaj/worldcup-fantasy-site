import { buildAllR32Artifacts } from "./lib/r32Artifacts.mjs";

const { role } = await buildAllR32Artifacts();
console.log(JSON.stringify({
  status: role.playerRoleRows.length > 0 ? "pass" : "fail",
  player_role_rows: role.playerRoleRows.length,
  known_fixture_players: role.summary.knownFixturePlayers,
  uncertain_or_unavailable_players: role.summary.uncertainOrUnavailablePlayers,
  ownership_used_as_signal: role.summary.ownershipUsedAsSignal
}, null, 2));
