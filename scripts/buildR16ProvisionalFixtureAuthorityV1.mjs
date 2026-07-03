import { buildR16ProvisionalArtifacts } from "./lib/r16ProvisionalArtifacts.mjs";

const { authority } = await buildR16ProvisionalArtifacts();

console.log(JSON.stringify({
  status: authority.status,
  fixture_count: authority.fixtures.length,
  final_known_fixture_count: authority.summary.final_known,
  partial_known_fixture_count: authority.summary.partial_known,
  pending_fixture_count: authority.summary.pending,
  completed_r32_fixtures_used: authority.summary.completed_r32_fixtures_used
}, null, 2));
