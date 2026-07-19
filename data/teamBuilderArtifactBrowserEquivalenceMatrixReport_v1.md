# Team Builder Artifact Browser Equivalence Matrix v1

Generated: 2026-07-19T01:05:00.000Z

Status: **green**

## Summary

| Item | Value |
| --- | --- |
| Artifact builder | `scripts/lib/finalRoundArtifacts.mjs` `buildTeamBuilder` and `buildTeamBuilderArtifact` |
| Browser default path | `script.js` `generatedFinalRoundBalancedSquad` when `defaultFinalRoundArtifactInputsActive` is true |
| Browser fallback path | `script.js` `buildSuggestedSquad` for locks, removals, filters, and non-default settings |
| High-risk uncovered rows | 0 |
| Tiny helper extraction completed | no |

## Matrix

| Area | Classification | Risk | Validator coverage | Recommendation |
| --- | --- | --- | --- | --- |
| active stage selection | duplicated and equivalent | medium | `validateFinalRoundBuilderBrowserEquivalenceV1`, `validateTeamBuilderGoldenFinalRoundV1`, `validateActiveStageManifestV1` | Keep manifest-owned until a stage-promotion harness exists. |
| fixture authority | shared already | low | `validateFinalRoundBrowserContentContractV1`, `validateTeamBuilderEligibilityHelpersV1` | Keep shared helper checks. |
| eligible teams | shared already | low | `validateTeamBuilderEligibilityHelpersV1`, `validateFinalRoundEligiblePlayersV1` | Keep authority-derived eligibility. |
| active projections | duplicated and equivalent | medium | `validateTeamBuilderEligibilityHelpersV1`, `validateFinalRoundEligiblePlayersV1` | Unify projection lookup only after browser seed-row construction is separately tested. |
| candidate pool | duplicated and risky | high | `validateFinalRoundBuilderBrowserEquivalenceV1`, `validateTeamBuilderEligibilityHelpersV1`, `validateTeamBuilderOptimizerUtilitiesV1` | Do not unify now; add path-search fixtures before implementation. |
| budget limit | duplicated and equivalent | medium | `validateTeamBuilderGoldenFinalRoundV1`, `validateTeamBuilderOptimizerUtilitiesV1` | Consider shared budget helper later. |
| budget usage | shared already | low | `validateTeamBuilderOptimizerUtilitiesV1` | Keep read-only helper coverage. |
| positions | duplicated and equivalent | medium | `validateTeamBuilderGoldenFinalRoundV1`, `validateTeamBuilderOptimizerUtilitiesV1` | Extract constants only after historical stage compatibility checks. |
| team caps | duplicated and equivalent | medium | `validateTeamBuilderOptimizerUtilitiesV1`, `validateFinalRoundEligiblePlayersV1` | Leave live browser checks in place until country-limit rules are centralized. |
| fixture diversification | duplicated and risky | high | `validateFinalRoundBuilderBrowserEquivalenceV1`, `validateFinalRoundFixtureExposureStrategyV1` | Do not unify without isolated portfolio fixtures. |
| optionality | duplicated and risky | high | `validateFinalRoundBuilderBrowserEquivalenceV1`, `validateFinalRoundFixtureExposureStrategyV1` | Keep artifact as public default; document formulas before extraction. |
| Third Place risk | duplicated and risky | high | `validateFinalRoundEligiblePlayersV1`, `validateFinalRoundBuilderBrowserEquivalenceV1` | Leave divergent user-risk controls untouched. |
| role/trust filters | browser-only | high | `validateTeamBuilderOptimizerUtilitiesV1` | Should remain divergent because of user interaction. |
| price filters | browser-only | medium | `validateFinalRoundBuilderBrowserEquivalenceV1` | Keep browser-only; user filters must bypass artifact default. |
| locks/exclusions | should remain divergent because of user interaction | high | `validateFinalRoundBuilderBrowserEquivalenceV1` | Do not move into generated artifact builder. |
| captain/vice selection | duplicated and risky | high | `validateTeamBuilderGoldenFinalRoundV1`, `validateFinalRoundBuilderBrowserEquivalenceV1` | Keep frozen by golden tests before extracting ranking. |
| objective formula | generated-only for public default | high | `validateTeamBuilderGoldenFinalRoundV1`, `validateFinalRoundBuilderBrowserEquivalenceV1` | Do not unify until isolated golden fixtures exist. |
| tie-breaking | duplicated and risky | high | `validateFinalRoundBuilderBrowserEquivalenceV1` | Add exhaustive deterministic fixtures before changing. |
| final squad serialization | duplicated and equivalent | medium | `validateFinalRoundBuilderBrowserEquivalenceV1`, `validateTeamBuilderGoldenFinalRoundV1` | Consider a shared serializer only after export schema tests. |
| display summary | shared already | low | `validateTeamBuilderSharedModelHelpersV1`, `validateFinalRoundBuilderBrowserEquivalenceV1` | Keep shared helper layer. |

## Readiness Judgment

The safe next step is audit and validator coverage, not optimizer-loop extraction. Every high-risk duplicated row is covered by at least one existing validator, but the browser interactive path still contains user-state behavior that should remain separate from the static generated artifact.
