import { runStep } from "./lib/md3ReleaseStack.mjs";

const qa = await runStep("release-qa");
console.log(JSON.stringify({
  status: qa.status,
  safe_to_share: qa.safe_to_share,
  completed_md2_fixtures_used: qa.completed_md2_fixtures_used,
  remaining_md2_fixtures_excluded: qa.remaining_md2_fixtures_excluded,
  output_json: "data/md3ReleaseQa_v1.json"
}, null, 2));
if (qa.status === "RED") process.exitCode = 1;
