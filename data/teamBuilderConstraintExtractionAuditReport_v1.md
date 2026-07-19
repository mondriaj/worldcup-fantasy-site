# Team Builder Constraint Extraction Audit v1

Generated: 2026-07-19T02:05:00.000Z

Status: **green**

## Direct Answers

| Question | Answer |
| --- | --- |
| Which functions currently reject invalid squads? | `getValidLockedSquadPlayers`, `optimizerStateIsValidFullSquad`, `generatedFinalRoundBalancedSquad`, `swapStarterWithBench`, and `buildRuleValidations`. |
| Which constraints are checked before optimization? | Active eligibility, exclusions, price/country/risk/trust filters, locked-player fit, position slots, and team cap. |
| Which constraints are checked after optimization? | Squad size, budget, position counts, team cap, starter/bench shape, artifact row resolution, and active eligibility. |
| Which constraints are only display warnings? | Price-filter inversion, ignored locks, locked country-filter conflicts, missing slots, budget/country fit failures, optimizer failure, and risk-control warnings. |
| Which checks mutate candidate/squad state? | Locked-player seeding, optimizer state expansion, starter selection, and starter/bench swaps. |
| Which checks read DOM/user locks? | Price/risk controls, country filter, locked/excluded sets, default-artifact gating, and swap selection. |
| Which checks already existed in helpers? | Budget, position/team/fixture counts, captain/vice validation, fixture authority, active eligibility, and selected-squad summaries. |
| What is safe to replace now? | Pure post-assembly validation booleans and display validation booleans. |

## Decision

The extraction is intentionally partial. Pure constraint checks now live in `scripts/lib/teamBuilderPublicModel.mjs` and `teamBuilderPublicHelpers.js`; optimizer scoring, candidate ordering, DOM state, locks/removals collection, and swap mutation remain in `script.js`.
