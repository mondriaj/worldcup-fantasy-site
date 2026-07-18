import { validateTeamBuilderFinalRound } from "./lib/finalRoundArtifacts.mjs";

const result = await validateTeamBuilderFinalRound();

console.log(JSON.stringify({
  status: result.status,
  summary: result.qa.summary,
  errors: result.errors
}, null, 2));

if (result.status !== "pass") {
  process.exitCode = 1;
}
