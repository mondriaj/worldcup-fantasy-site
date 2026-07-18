import { buildFinalRoundArtifacts } from "./lib/finalRoundArtifacts.mjs";

const result = await buildFinalRoundArtifacts();

console.log(JSON.stringify({
  output: "data/playerRoleModel_finalRound_v1.json",
  status: result.role.qa.status,
  summary: result.role.summary
}, null, 2));

if (result.role.qa.status !== "pass") {
  process.exitCode = 1;
}
