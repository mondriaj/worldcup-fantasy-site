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
- Required active validators and browser assertions
- Manifest-driven active QA runner commands, syntax checks, search checks, and expected public behavior assertions
- Known public caveats
- Forbidden refereeing/conspiracy surfaces
- Deprecated globals and legacy files that active public views should block

## What It Does Not Own

- Model tuning, projections, recommendations, PELE, score predictions, or Team Builder squad composition
- Public UI copy or rendering behavior
- Official FIFA live locks, boosters, substitutions, or confirmed XIs
- Historical-stage artifacts beyond keeping them out of active Final Round defaults

## Future Stage Promotion

Promotion should change the manifest first, then update builders, wrappers, and validators to match. A future stage is not ready until the manifest validator, active data-flow validator, Team Builder artifact validator, browser equivalence validator, and public browser QA all pass.

## Past Bug Prevention

- Eliminated-player leakage: active eligible teams and blocked legacy globals are explicit.
- Team Builder/browser mismatch: the active Team Builder artifact and browser equivalence validator are manifest-owned.
- Wrong budget: the active Team Builder artifact and validator are tied to `finalRound`.
- Source fixture ID/bracket slot confusion: fixture authority is an explicit manifest-owned source.
- Refereeing/conspiracy leakage: forbidden public surfaces are checked by the manifest validator.

## Wiring Status

Wired now:

- `scripts/validateFinalRoundEligiblePlayersV1.mjs`
- `scripts/validateFinalRoundBuilderBrowserEquivalenceV1.mjs`
- `scripts/runPublicPreviewBrowserQa.mjs`

Skipped for now:

- Release/build aggregators. Wiring them would touch model-generation paths and is too invasive for a no-model-change cleanup pass.

## Active QA Runner

`scripts/runActiveStageQaFromManifestV1.mjs` reads the `qaRunner` section and provides the single active-stage gate for future cleanup prompts. The runner owns:

- Required command checks for manifest validation, Final Round data validators, Team Builder artifact/browser equivalence, live score checks, bracket checks, public preview browser QA, and `git diff --check`.
- Syntax checks for active public app scripts, active public wrappers, the manifest validator, and the manifest helper.
- Search checks for old globals/legacy paths, active eliminated-player leakage, and public refereeing/conspiracy leakage.
- A local static server for browser QA checks that need a real URL.

The runner does not rebuild models, tune weights, change recommendations, change projections, change score predictions, change Team Builder output, stage files, commit files, or push.
