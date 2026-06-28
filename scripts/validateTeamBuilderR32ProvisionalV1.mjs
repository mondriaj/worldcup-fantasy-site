import { buildAllR32Artifacts } from "./lib/r32Artifacts.mjs";

const { teamBuilder } = await buildAllR32Artifacts();

console.log(JSON.stringify({
  status: teamBuilder.status,
  squad_players: teamBuilder.summary.squad_players,
  starters: teamBuilder.summary.starters,
  default_matchday: teamBuilder.summary.defaultMatchday,
  starter_projected_points: teamBuilder.summary.starterProjectedPoints,
  greedy_starter_projected_points: teamBuilder.summary.greedyStarterProjectedPoints,
  gap_vs_greedy: teamBuilder.summary.gapVsGreedy
}, null, 2));
