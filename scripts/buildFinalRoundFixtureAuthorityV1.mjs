import { buildFinalRoundArtifacts } from "./lib/finalRoundArtifacts.mjs";

const result = await buildFinalRoundArtifacts();

console.log(JSON.stringify({
  output: "data/finalRoundFixtureAuthority_v1.json",
  status: result.authority.status,
  summary: result.authority.summary
}, null, 2));

if (result.authority.status !== "pass") {
  process.exitCode = 1;
}
