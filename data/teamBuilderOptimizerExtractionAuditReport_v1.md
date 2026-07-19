# Team Builder Optimizer Extraction Audit v1

Generated: 2026-07-19T00:43:18.277Z

Status: **green**

## Scope

This pass prepares deeper optimizer extraction without moving the optimizer loop. It extracts only read-only selected-squad utility helpers for budget, position, team, fixture, and captain/vice constraint validation.

`script.js` line count stayed at 15,273. No optimizer scoring, candidate ordering, lock handling, fallback behavior, or generated artifact loading changed.

## Optimizer Map

| Area | Current owner |
| --- | --- |
| Optimizer loop | `script.js:buildSuggestedSquad` |
| Candidate pool | `playerAllowedForActiveMatchday`, `priceMatchesFilters`, `playerMatchesBuilderCountryFilter`, `playerMatchesBuilderRiskControls`, `trustFilteredPlayers`, `optimizerCandidatePools` |
| User locks | `lockedPlayerIds`, `getValidLockedSquadPlayers` |
| Exclusions | `excludedPlayerIds` inside candidate filtering |
| Budget | `initialBudget`, `optimizerPriceFloorsByPosition`, `optimizerCheapestRemainingCost`, `optimizerCanAffordCompletion`, `optimizerStateIsValidFullSquad` |
| Positions | `squadRequirements`, `tactics`, `countsByPosition`, `optimizerRemainingNeeds`, `optimizerSlotOrder`, `positionsMatchRequirements` |
| Team limits | `countryCountsFromPlayers`, `canAddCountry`, `countryLimitViolations` |
| State ranking | `optimizerStateRank`, `teamBuilderStrategyPlayerScore`, `portfolioOptimizerAdjustment` |
| Captain signal | `captainRecommendationScore` inside `optimizerStateRank` |
| Default public squad | `generatedFinalRoundBalancedSquad`, artifact-backed |
| Rendering | `renderTeam`, `renderRuleChecks`, `renderPortfolioAnalytics`, `renderSquadStrategyReport` |

## Direct Answers

| Question | Answer |
| --- | --- |
| Where is the optimizer loop? | `script.js:buildSuggestedSquad`, supported by state, pool, and rank helpers around the same block. |
| Which functions select or reorder candidates? | `sortPlayersForBuilderStrategy`, `getValidLockedSquadPlayers`, `chooseStartersFromSquad`, `optimizerCandidatePools`, `uniqueOptimizerCandidates`, `pruneOptimizerStates`, `buildSuggestedSquad`. |
| Which functions affect selected squad? | Active eligibility/filter helpers, trust/risk/price/country filters, strategy scoring, state ranking, affordability checks, full-squad legality checks, and artifact default loading. |
| Which functions affect only summaries/display? | Artifact summary helpers, new selected-squad constraint helpers, warning/report renderers, and strategy display helpers. |
| Which functions are pure and deterministic? | New optimizer utility helpers, existing artifact summary helpers, and fixture-authority eligibility helpers. |
| Which functions read DOM/user state? | Strategy/trust/risk/price controls, locks/avoids, and default artifact input checks. |
| Which functions mutate candidates/artifacts? | New helpers do not mutate inputs. Existing optimizer state helpers create new state objects; render functions mutate DOM/app state. |
| Which logic enforces budget/positions/team constraints? | `optimizerStateIsValidFullSquad`, `optimizerCanAffordCompletion`, `optimizerRemainingNeeds`, `optimizerSlotOrder`, `canAddCountry`, and `countryLimitViolations`. |
| Which logic handles locks? | `getValidLockedSquadPlayers`. |
| Which logic controls captain/vice? | Captain ranking bonus remains in `optimizerStateRank`; user/display captain and vice behavior remains in `script.js`. |
| Smallest safe extraction? | Read-only selected-squad constraint utilities for validators and audit reports only. |

## Classification

Already covered by shared helpers:

- Artifact summary, budget display, team counts, fixture counts, captain/vice labels, objective summary.
- Fixture-authority eligibility and active Final Round projection availability.

Extracted now:

- Selected squad row reader.
- Position code normalizer.
- Position counts.
- Budget feasibility summary.
- Captain/vice membership validation.
- Selected squad constraint summary and validation.

Left for later:

- Display-only warning assembly.
- Portfolio report display summaries.
- Non-ranking constraint explanation copy.

Risky optimizer core, not extracted:

- `optimizerCandidatePools`
- `optimizerStateRank`
- `pruneOptimizerStates`
- `buildSuggestedSquad`
- `teamBuilderStrategyPlayerScore`
- `portfolioOptimizerAdjustment`
- `captainRecommendationScore`
- Trust/risk/price/lock behavior

## Recommendation

Proceed with this tiny utility extraction if the full QA suite stays GREEN. Main optimizer-loop extraction should remain a separate later pass with stronger before/after path-search fixtures.
