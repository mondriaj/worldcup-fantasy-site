import { buildQfArtifacts } from "./lib/qfFinalArtifacts.mjs";

const { authority } = await buildQfArtifacts();

console.log(JSON.stringify({
  status: authority.status,
  fixture_count: authority.fixtures.length,
  final_known_fixture_count: authority.summary.final_known,
  completed_r16_fixtures_used: authority.summary.completed_r16_fixtures_used,
  incomplete_r16_fixtures: authority.summary.incomplete_r16_fixtures
}, null, 2));
