# QA Coverage Audit v1

Generated: 2026-07-18T12:16:55.407Z

Status: **pass**

## QA Inventory

- QA scripts inventoried: 56
- QA reports inventoried: 272

## Past Bug Coverage

- Covered: stale MD2/MD3 data path (scripts/validateActiveFantasyDataFlow.mjs, data/activeFantasyDataFlowQa.json, data/activeFantasyDataFlowQaReport.md)
- Covered: wrong source fixture ID as bracket slot (scripts/validateBracketPathIntegrityV1.mjs, data/bracketPathIntegrityAuditReport_v1.md, data/bracketPathIntegrityAudit_v1.json)
- Covered: France/Argentina impossible bracket path (scripts/validateBracketPathIntegrityV1.mjs, data/knockoutBracketPredictionQaReport_v1.md, data/knockoutBracketPredictionQa_v1.json)
- Covered: Medina Core Pick despite non-start (scripts/validateFinalRoundCorePickLineupEvidence.mjs, data/finalRoundCorePickLineupEvidenceQaReport_v1.md, data/finalRoundCorePickLineupEvidenceQa_v1.json)
- Covered: eliminated players in Final Round Builder (scripts/validateFinalRoundEligiblePlayersV1.mjs, data/finalRoundEliminatedPlayerBugAuditReport_v1.md, data/finalRoundEliminatedPlayerBugAudit_v1.json)
- Covered: generated/browser Team Builder mismatch (scripts/validateFinalRoundBuilderBrowserEquivalenceV1.mjs, data/finalRoundBuilderBrowserEquivalenceQaReport_v1.md, data/finalRoundBuilderBrowserEquivalenceQa_v1.json)
- Covered: Final Round budget 100 instead of 105 (scripts/validateTeamBuilderFinalRoundV1.mjs, data/teamBuilderQa_finalRound_v1.json)
- Covered: browser fallback to historical projection rows (scripts/validateFinalRoundBuilderBrowserEquivalenceV1.mjs, data/activeFantasyDataFlowQa.json, data/activeFantasyDataFlowQaReport.md)
- Covered: no Third Place exposure without explanation (scripts/validateFinalRoundFixtureExposureStrategyV1.mjs, data/finalRoundFixtureExposureStrategyQaReport_v1.md, data/finalRoundFixtureExposureStrategyQa_v1.json)

## Top Five Improvements

- Add one active-stage QA manifest that declares every public surface, source artifact, wrapper, and browser assertion.
- Extend browser assertions for Picks, Captain Watchlist, Match Environment, and World Cup Guide to verify exact expected names/fixtures, not just rendered content.
- Add deployed-site parity checks against local validated artifacts after every cache-bust promotion.
- Centralize eliminated-team/player leakage checks across recommendations, projections, score predictions, Team Builder artifact, and rendered DOM.
- Retire or archive historical stage QA from the default active-stage command so reviewers see one current gate first.

## Issues

- **WARN / Browser assertions:** Team Builder equivalence has strong content assertions; other surfaces rely more on render/status QA and should assert actual player/fixture text.
- **WARN / QA sprawl:** There are many stage-specific QA scripts with similar responsibilities. A top-client codebase would benefit from a single manifest-driven active-stage QA runner. Evidence: `{"qaScriptCount":56}`.
- **WARN / Deployment assertions:** GitHub Pages smoke coverage is present historically, but the active audit found no single current deployment gate that replays all public Final Round content assertions.
