import { runStep } from "./lib/md3ReleaseStack.mjs";

const result = await runStep("postmortem");
console.log(JSON.stringify({
  status: "completed",
  output_json: "data/md2CalibrationDataset_for_md3_v1.json",
  report: "data/md2ModelPostmortemReport_for_md3_v1.md",
  completedMd2FixturesUsed: result.summary.completedMd2FixturesUsed,
  remainingMd2FixturesExcluded: result.summary.remainingMd2FixturesExcluded
}, null, 2));
