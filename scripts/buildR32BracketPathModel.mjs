import { buildAllR32Artifacts } from "./lib/r32Artifacts.mjs";

const { bracket } = await buildAllR32Artifacts();
console.log(JSON.stringify({
  known_r32_fixtures: bracket.known_r32_fixtures.length,
  unresolved_r32_matches: bracket.unresolved_r32_matches.length,
  ownership_used_as_signal: bracket.ownership_used_as_signal,
  final_squads_source_backed: bracket.final_squads_source_backed
}, null, 2));
