# Active Stage Manifest Report v1

Generated: 2026-07-18T12:23:36.151Z

## Why This Exists

The site had the right Final Round behavior, but the active-stage contract was spread across HTML script tags, wrapper globals, validators, generated files, browser QA, and long blocks in `script.js`. That is correct enough for public sharing but not clean enough for a high-standard code review.

`data/activeStageManifest_v1.json` centralizes the active Final Round wiring so future promotion work starts from one explicit contract.

## What It Owns

- Active stage: `finalRound`
- Public cache-bust/version expectations
- Public page script wiring for `index.html` and `world-cup.html`
- Active source data files and public wrappers
- Final Round Team Builder artifact and validators
- Final Round Team Builder golden-score fixture and validator
- Final Round Team Builder shared-model helper validator
- Final Round Team Builder eligibility helper validator
- Final Round Team Builder optimizer utility validator
- Final Round Team Builder artifact/browser unification readiness validator
- Final Round Team Builder public helper wrapper loaded before `script.js`
- Required active validators and browser assertions
- Final Round browser content contract for Picks, Captain Watchlist, Match Environment, Player Profile, and Team Builder golden visibility
- Manifest-driven active QA runner commands, syntax checks, search checks, and expected public behavior assertions
- Public payload slimming audit, contract, validator, and wrapper size metadata
- Known public caveats
- Forbidden refereeing/conspiracy surfaces
- Deprecated globals and legacy files that active public views should block

## What It Does Not Own

- Model tuning, projections, recommendations, PELE, score predictions, or Team Builder squad composition
- Public UI copy or rendering behavior
- Official FIFA live locks, boosters, substitutions, or confirmed XIs
- Historical-stage artifacts beyond keeping them out of active Final Round defaults

## Future Stage Promotion

Promotion should change the manifest first, then update builders, wrappers, and validators to match. A future stage is not ready until the manifest validator, active data-flow validator, browser content contract validator, Team Builder artifact validator, Team Builder golden-score validator, Team Builder shared-model helper validator, Team Builder eligibility helper validator, Team Builder optimizer utility validator, Team Builder artifact/browser unification readiness validator, browser equivalence validator, and public browser QA all pass.

## Past Bug Prevention

- Eliminated-player leakage: active eligible teams and blocked legacy globals are explicit.
- Team Builder/browser mismatch: the active Team Builder artifact and browser equivalence validator are manifest-owned.
- Accidental optimizer drift: the Team Builder golden-score validator freezes the public default squad, budget, captain/vice, counts, and objective scores.
- Shared helper drift: the Team Builder shared-model helper validator freezes artifact summary helpers against the golden Final Round output and the browser wrapper.
- Eligibility drift: the Team Builder eligibility helper validator freezes fixture-authority team eligibility and active-projection requirements so eliminated teams cannot re-enter active Team Builder candidates through historical fallback rows.
- Optimizer utility drift: the Team Builder optimizer utility validator freezes read-only budget, position, team, fixture, and captain/vice constraint helpers against the generated artifact and golden Final Round output before any future optimizer-loop extraction.
- Artifact/browser extraction drift: the Team Builder artifact/browser unification readiness validator records which generated and browser behaviors are equivalent, divergent, or risky before any deeper optimizer-loop extraction.
- Wrong budget: the active Team Builder artifact and validator are tied to `finalRound`.
- Source fixture ID/bracket slot confusion: fixture authority is an explicit manifest-owned source.
- Render-only browser QA gaps: the browser content contract requires exact Final Round Picks, Captain Watchlist, Match Environment, and Player Profile content.
- Refereeing/conspiracy leakage: forbidden public surfaces are checked by the manifest validator.

## Wiring Status

Wired now:

- `scripts/validateFinalRoundEligiblePlayersV1.mjs`
- `scripts/validateFinalRoundBrowserContentContractV1.mjs`
- `scripts/validateFinalRoundBuilderBrowserEquivalenceV1.mjs`
- `scripts/validateTeamBuilderGoldenFinalRoundV1.mjs`
- `scripts/validateTeamBuilderSharedModelHelpersV1.mjs`
- `scripts/validateTeamBuilderEligibilityHelpersV1.mjs`
- `scripts/validateTeamBuilderOptimizerUtilitiesV1.mjs`
- `scripts/validateTeamBuilderArtifactBrowserUnificationReadinessV1.mjs`
- `scripts/runPublicPreviewBrowserQa.mjs`

Skipped for now:

- Release/build aggregators. Wiring them would touch model-generation paths and is too invasive for a no-model-change cleanup pass.

## Active QA Runner

`scripts/runActiveStageQaFromManifestV1.mjs` reads the `qaRunner` section and provides the single active-stage gate for future cleanup prompts. The runner owns:

- Required command checks for manifest validation, Final Round data validators, browser content contract validation, Team Builder artifact/browser equivalence, Team Builder golden-score validation, Team Builder shared-model helper validation, Team Builder eligibility helper validation, Team Builder optimizer utility validation, Team Builder artifact/browser unification readiness validation, live score checks, bracket checks, public preview browser QA, and `git diff --check`.
- Syntax checks for active public app scripts, active public wrappers, the manifest validator, and the manifest helper.
- Search checks for old globals/legacy paths, active eliminated-player leakage, and public refereeing/conspiracy leakage.
- A local static server for browser QA checks that need a real URL.

The runner does not rebuild models, tune weights, change recommendations, change projections, change score predictions, change Team Builder output, stage files, commit files, or push.

## Team Builder Public Helpers

`scripts/lib/teamBuilderPublicModel.mjs` and `teamBuilderPublicHelpers.js` hold the safe public Team Builder helper layer for artifact validation, fixture-authority eligible-team keys, active Final Round candidate eligibility, selected-squad summaries, read-only optimizer constraint utilities, budget/team/fixture/captain/objective helpers, golden artifact comparison, count summaries, strategy display copy, objective summary labels, and artifact-backed explanation copy. The browser wrapper is loaded after `teamBuilderFinalRoundArtifactData.js` and before `script.js`, so the public default can keep rendering the generated artifact without turning the legacy app bundle into a module.

## Team Builder Artifact Browser Unification

`data/teamBuilderArtifactBrowserEquivalenceMatrix_v1.json` and `scripts/validateTeamBuilderArtifactBrowserUnificationReadinessV1.mjs` make deeper extraction safer by separating shared/equivalent behavior from browser-only user interaction and high-risk duplicated optimizer logic. The readiness validator deliberately does not change public behavior, rebuild outputs, or wire the browser into a new optimizer module.

## Public Payload Contract

The manifest now references `data/publicPayloadContract_v1.json` and the public payload slimming audit/diff reports. `scripts/validatePublicPayloadContractV1.mjs` is included in the manifest-driven QA runner so compact public wrappers must still parse, expose required browser fields, keep active Final Round rows available, retain Team Builder artifact fields, and exclude internal-only diagnostics from slimmed public wrappers.
