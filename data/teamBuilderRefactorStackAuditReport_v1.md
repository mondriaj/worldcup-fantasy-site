# Team Builder Refactor Stack Audit v1

Status: GREEN

Scope: audit-only review after the Team Builder shared model, eligibility, optimizer utility, artifact/browser readiness, and constraint helper extraction passes. No public code, model outputs, wrappers, or copy were changed in this audit.

## Current line counts

| File | Lines |
| --- | ---: |
| `script.js` | 15351 |
| `teamBuilderPublicHelpers.js` | 1124 |
| `scripts/lib/teamBuilderPublicModel.mjs` | 1051 |
| `scripts/validateTeamBuilderSharedModelHelpersV1.mjs` | 215 |
| `scripts/validateTeamBuilderEligibilityHelpersV1.mjs` | 393 |
| `scripts/validateTeamBuilderOptimizerUtilitiesV1.mjs` | 243 |
| `scripts/validateTeamBuilderConstraintHelpersV1.mjs` | 252 |
| `scripts/validateTeamBuilderArtifactBrowserUnificationReadinessV1.mjs` | 280 |
| `data/activeStageManifest_v1.json` | 281 |

## What improved

The refactor stack reduced risk in the places where the same facts must match across Node validators, browser code, and public wrapper logic:

- Strategy labels, aliases, objective component labels, and status/caveat text are centralized.
- Fixture-authority eligibility and active-stage projection checks now use shared helpers.
- Artifact summaries and golden comparison helpers now protect selected squad facts.
- Pure squad constraint helpers cover size, duplicates, budget, position, team cap, fixture cap, eligible teams, captain/vice, locked/excluded players, and starter/bench structure.

These are real risk reductions, not just cosmetic file movement.

## Helper inventory

Exported shared constants: `TEAM_BUILDER_PUBLIC_ARTIFACT_SCHEMA`, `TEAM_BUILDER_PUBLIC_STAGE_LABELS`, `TEAM_BUILDER_PUBLIC_OBJECTIVE_COMPONENT_LABELS`, `TEAM_BUILDER_STRATEGY_OPTION_KEYS`, `TEAM_BUILDER_STRATEGY_OPTIONS`, `TEAM_BUILDER_STRATEGY_ALIASES`, `TEAM_BUILDER_COMPARISON_STRATEGY_KEYS`, `TEAM_BUILDER_PUBLIC_SOURCE_OF_TRUTH_NOTE`.

Browser-used helpers include eligibility gates, active projection checks, strategy constants, `countByTeam`, `validateTeamBuilderPositionConstraints`, `validateTeamBuilderSquadConstraints`, `squadStrategyFitText`, `isFinalRoundTeamBuilderArtifact`, `teamBuilderStatusMessage`, and `getTeamBuilderObjectiveSummary`.

Validator-only or report-only helpers include the granular constraint validators, selected-squad summary/report helpers, no-eliminated-candidate assertions, fixture-authority inspectors, and golden comparison helpers. Those should remain validator-only for now because they protect public behavior without adding browser complexity.

Small helpers such as `formatTeamBuilderScoreNumber`, `budgetDisplay`, normalized fixture/team helpers, and summary text formatters are worth keeping. They are small, but they anchor browser/wrapper parity and reduce copy/format drift.

## What remains mixed

The constraint pass is useful, but it did not reduce `script.js` line count. It added browser adapter glue while moving pure checks into shared helpers. That is acceptable for this stage because exact browser assertions and golden tests protect behavior, but future extractions should aim to remove live duplicated logic rather than only adding parallel validators.

Logic still duplicated or adapter-heavy in `script.js`: `countryLimitForMatchday`, `budgetLimitForMatchday`, `squadRequirements`, country-count helpers, `teamBuilderConstraintRows`, `teamBuilderSharedSquadConstraintReport`, `teamBuilderStrategyPlayerScore`, `optimizerStateRank`, and `captainRecommendationScore`.

## Main drift risk

`teamBuilderPublicHelpers.js` manually mirrors `scripts/lib/teamBuilderPublicModel.mjs`. The current validator stack protects parity, but a future change can still update one side and forget the other. This is now the clearest low-behavior-risk cleanup target.

Dependency direction is correct: the browser wrapper loads before `script.js`, Node validators import `scripts/lib/teamBuilderPublicModel.mjs`, and there is no circular browser dependency.

## Scoring risk

Do not extract optimizer scoring or captain ranking next. Strategy player scoring, optimizer ranking, captain recommendation scoring, and artifact composite scoring remain high-risk and need exact score fixtures before any movement.

## Recommendation

Commit the audit artifacts only. The next safe extraction should either:

- centralize budget, country-limit, and formation/squad-requirement derivation from rules data, or
- add a generated/synced browser wrapper path from `scripts/lib/teamBuilderPublicModel.mjs`.

Public behavior and model outputs should remain unchanged.
