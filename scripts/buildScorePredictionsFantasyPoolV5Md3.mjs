import { runStep } from "./lib/md3ReleaseStack.mjs";

const { qa, output } = await runStep("score");
console.log(JSON.stringify({
  status: qa.status,
  modelVersion: output.modelVersion,
  defaultMatchday: output.defaultMatchday,
  completedMd2FixturesUsed: output.summary.completedMd2FixturesUsed,
  remainingMd2FixturesExcluded: output.summary.remainingMd2FixturesExcluded,
  output_json: "data/scorePredictions_fantasyPool_v5_md3.json"
}, null, 2));
if (qa.status !== "pass") process.exitCode = 1;
