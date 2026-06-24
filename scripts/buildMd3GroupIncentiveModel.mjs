import { runStep } from "./lib/md3ReleaseStack.mjs";

const { output, qa } = await runStep("group-incentive");
console.log(JSON.stringify({
  status: qa.status,
  output_json: "data/groupIncentiveModel_md3_v1.json",
  output_report: "data/groupIncentiveModel_md3_v1.md",
  qa_json: "data/groupIncentiveQa_md3_v1.json",
  qa_report: "data/groupIncentiveQaReport_md3_v1.md",
  completedMd1FixturesUsed: output.completed_md1_fixtures_used,
  completedMd2FixturesUsed: output.completed_md2_fixtures_used,
  md3FixtureCount: output.md3_fixture_count,
  veryHighRotationRiskTeams: qa.teams_classified_very_high_rotation_risk,
  mustPlayStrongTeams: qa.teams_classified_must_play_strong
}, null, 2));
if (qa.status !== "GREEN") process.exitCode = 1;
