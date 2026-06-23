import { runStep } from "./lib/md3ReleaseStack.mjs";

const { qa, output } = await runStep("recommendation");
console.log(JSON.stringify({
  status: qa.status,
  modelVersion: output.modelVersion,
  recommendationCandidates: output.summary.candidate_rows,
  md3Candidates: output.summary.candidates_by_matchday.md3,
  output_json: "data/fantasyPoolRecommendations_md3_v5.json"
}, null, 2));
if (qa.status !== "pass") process.exitCode = 1;
