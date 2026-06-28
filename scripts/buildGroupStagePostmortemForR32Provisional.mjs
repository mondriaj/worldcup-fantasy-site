import { buildAllR32Artifacts } from "./lib/r32Artifacts.mjs";

const { postmortem } = await buildAllR32Artifacts();

console.log(JSON.stringify({
  status: postmortem.completed_md3_fixture_count >= 22 && postmortem.unfinished_md3_fixture_count <= 2 ? "pass" : "fail",
  final_fixtures_used: postmortem.final_fixture_count,
  completed_md3_fixture_count: postmortem.completed_md3_fixture_count,
  unfinished_md3_fixture_count: postmortem.unfinished_md3_fixture_count,
  unfinished_group_fixtures: postmortem.unfinished_group_fixtures
}, null, 2));
