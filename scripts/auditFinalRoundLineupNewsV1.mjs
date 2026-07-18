import { buildFinalRoundArtifacts } from "./lib/finalRoundArtifacts.mjs";

const result = await buildFinalRoundArtifacts();

console.log(JSON.stringify({
  output: "data/finalRoundLineupNewsAudit_v1.json",
  status: result.lineupNewsAudit.status,
  summary: result.lineupNewsAudit.summary
}, null, 2));

if (result.lineupNewsAudit.status !== "pass") {
  process.exitCode = 1;
}
