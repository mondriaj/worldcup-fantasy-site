import { buildAllR32Artifacts } from "./lib/r32Artifacts.mjs";

const { role } = await buildAllR32Artifacts();

console.log(JSON.stringify({
  status: role.summary.knownFixturePlayers > 0 ? "pass" : "fail",
  player_role_rows: role.summary.roleRows,
  known_fixture_players: role.summary.knownFixturePlayers,
  uncertain_or_unavailable_players: role.summary.uncertainOrUnavailablePlayers,
  rested_starter_preserved: role.summary.restedStarterPreserved
}, null, 2));
