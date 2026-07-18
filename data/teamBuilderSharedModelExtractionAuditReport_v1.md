# Team Builder Shared Model Extraction Audit v1

Generated: 2026-07-18T21:50:15.683Z

Status: **green pending full QA**

## Scope

This pass is a refactor only. It moves pure Team Builder artifact summary helpers into the shared public model layer and keeps optimizer, eligibility, artifact loading, public copy, public squad, and model outputs unchanged.

## Completed Extraction

| Logic | Source / call site | Shared helper location | Risk | Decision |
| --- | --- | --- | --- | --- |
| Artifact objective display support | `script.js:13615-13624` | `scripts/lib/teamBuilderPublicModel.mjs:280-288`, `teamBuilderPublicHelpers.js:280-288` | Low | Extracted now |
| Selected, starter, and bench names | Shared helper only | `scripts/lib/teamBuilderPublicModel.mjs:235-251`, `teamBuilderPublicHelpers.js:235-251` | Low | Extracted now |
| Budget summary | Shared helper only | `scripts/lib/teamBuilderPublicModel.mjs:253-263`, `teamBuilderPublicHelpers.js:253-263` | Low | Extracted now |
| Team and fixture counts | Shared helper only | `scripts/lib/teamBuilderPublicModel.mjs:265-270`, `teamBuilderPublicHelpers.js:265-270` | Low | Extracted now |
| Captain and vice summary | Shared helper only | `scripts/lib/teamBuilderPublicModel.mjs:273-277`, `teamBuilderPublicHelpers.js:273-277` | Low | Extracted now |
| Full artifact summary and golden comparison | Validator/browser shared layer | `scripts/lib/teamBuilderPublicModel.mjs:309-358`, `teamBuilderPublicHelpers.js:309-358` | Low | Extracted now |

`script.js` line count moved from 15,307 to 15,305, for an expected reduction of 2 lines in this first deeper extraction pass.

## Kept In Place

| Block | Location | Classification | Reason |
| --- | --- | --- | --- |
| `countryCountsFromPlayers` | `script.js:9608-9612` | Already delegated | It already uses the public helper count function. |
| `finalRoundTeamBuilderArtifact` | `script.js:10156-10167` | Already delegated | It already uses shared artifact validation. |
| `generatedFinalRoundBalancedSquad` | `script.js:10169-10212` | Risky to extract now | It owns artifact selection and legacy fallback behavior. |
| Optimizer loop, locks, substitutions, candidate filtering | `script.js:6320-10300` | Extract later after stronger tests | This prompt forbids optimizer and eligibility behavior changes. |
| DOM renderers | `script.js:13200-14090` | Stay in DOM/rendering code | Rendering remains browser-specific; only pure summary support moved. |

## Duplicate Logic Addressed

- Objective score display formatting for raw projected, optionality, and composite scores.
- Selected-squad budget/count/captain/objective summaries needed by both Node validators and the browser wrapper.
- Golden artifact comparison logic now has a shared helper entry point instead of remaining validator-specific.

## Rollback Plan

1. Restore the direct `displayNumber` objective fields in `script.js`.
2. Remove the new shared helper exports from `scripts/lib/teamBuilderPublicModel.mjs` and `teamBuilderPublicHelpers.js`.
3. Remove `scripts/validateTeamBuilderSharedModelHelpersV1.mjs` from the active-stage manifest command and syntax checks.
4. Remove the generated shared-helper QA, audit, and no-behavior-change proof files from the scoped commit.

## Remaining Cleanup

- Deeper optimizer-loop extraction.
- Candidate eligibility shared model.
- Generated-artifact builder/browser unification.
- Final code elegance audit.
