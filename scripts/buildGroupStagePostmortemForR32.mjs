import { buildAllR32Artifacts } from "./lib/r32Artifacts.mjs";

const { postmortem } = await buildAllR32Artifacts();
console.log(JSON.stringify({
  status: postmortem.unfinished_md3_excluded && postmortem.final_fixture_count > 0 ? "pass" : "fail",
  completed_fixtures_used: postmortem.final_fixture_count,
  completed_md3_fixture_count: postmortem.completed_md3_fixture_count,
  unfinished_md3_fixtures_excluded: postmortem.unfinished_md3_excluded
}, null, 2));
