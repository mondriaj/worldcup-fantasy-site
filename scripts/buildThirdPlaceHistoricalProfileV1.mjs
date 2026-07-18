import { buildFinalRoundArtifacts } from "./lib/finalRoundArtifacts.mjs";

const result = await buildFinalRoundArtifacts();

console.log(JSON.stringify({
  output: "data/thirdPlaceHistoricalProfile_v1.json",
  status: result.thirdPlaceProfile.status,
  score_audit: {
    games: result.thirdPlaceProfile.score_audit.game_count,
    average_goals: result.thirdPlaceProfile.score_audit.average_goals,
    median_goals: result.thirdPlaceProfile.score_audit.median_goals
  },
  modifiers: result.thirdPlaceProfile.modifiers
}, null, 2));

if (result.thirdPlaceProfile.status !== "pass") {
  process.exitCode = 1;
}
