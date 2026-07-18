import { buildFinalRoundArtifacts } from "./lib/finalRoundArtifacts.mjs";

const result = await buildFinalRoundArtifacts();

console.log(JSON.stringify({
  output: "data/knockoutModelPostmortem_for_finalRound_v1.json",
  status: result.postmortem.status,
  summary: result.postmortem.summary
}, null, 2));

if (result.postmortem.status !== "pass") {
  process.exitCode = 1;
}
