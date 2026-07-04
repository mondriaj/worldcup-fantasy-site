import { buildR16Artifacts } from "./lib/r16FinalArtifacts.mjs";

const { authority } = await buildR16Artifacts();

console.log(JSON.stringify({
  status: authority.status,
  fixture_count: authority.fixtures.length,
  final_known_fixture_count: authority.summary.final_known,
  completed_r32_fixtures_used: authority.summary.completed_r32_fixtures_used,
  incomplete_r32_fixtures: authority.summary.incomplete_r32_fixtures
}, null, 2));
