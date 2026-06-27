import { buildAllR32Artifacts } from "./lib/r32Artifacts.mjs";

const { knockout } = await buildAllR32Artifacts();
console.log(JSON.stringify({
  known_r32_predictions: knockout.known_r32_predictions.length,
  arbitrary_matchup_predictions: knockout.arbitrary_matchup_predictions.length,
  ownership_used_as_signal: knockout.ownership_used_as_signal,
  final_squads_source_backed: knockout.final_squads_source_backed
}, null, 2));
