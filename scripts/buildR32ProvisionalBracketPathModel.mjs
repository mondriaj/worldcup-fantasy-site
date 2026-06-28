import { buildAllR32Artifacts } from "./lib/r32Artifacts.mjs";

const { bracket } = await buildAllR32Artifacts();

console.log(JSON.stringify({
  status: bracket.known_r32_fixtures.length + bracket.uncertain_r32_slots.length === 16 ? "pass" : "fail",
  known_official_r32_fixtures: bracket.known_r32_fixtures.length,
  locked_r32_slots: bracket.locked_r32_slots.length,
  provisional_r32_slots: bracket.provisional_r32_slots.length,
  uncertain_r32_slots: bracket.uncertain_r32_slots.length,
  final_refresh_blockers: bracket.final_refresh_blockers
}, null, 2));
