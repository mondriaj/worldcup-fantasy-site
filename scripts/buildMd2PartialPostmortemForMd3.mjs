import { runStep } from "./lib/md3ReleaseStack.mjs";

const result = await runStep("partial");
console.log(JSON.stringify({
  status: "completed",
  output_json: "data/md2PartialCalibrationDataset_for_md3_v1.json",
  report: "data/md2PartialModelPostmortemReport_for_md3_v1.md",
  completedMd2FixturesUsed: result.summary.completedMd2FixturesUsed,
  remainingMd2FixturesExcluded: result.summary.remainingMd2FixturesExcluded
}, null, 2));
