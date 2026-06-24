import { runStep } from "./lib/md3ReleaseStack.mjs";

const result = await runStep("postmortem");
console.log(JSON.stringify({
  status: "completed",
  output_json: "data/md2CalibrationDataset_for_md3_v1.json",
  postmortem_json: "data/md2ModelPostmortem_for_md3_v1.json",
  report: "data/md2ModelPostmortemReport_for_md3_v1.md",
  completedMd1FixturesUsed: result.summary.completedMd1FixturesUsed,
  completedMd2FixturesUsed: result.summary.completedMd2FixturesUsed,
  remainingMd2FixturesExcluded: result.summary.remainingMd2FixturesExcluded,
  twoGamePlayerRows: result.summary.twoGamePlayerRows
}, null, 2));
