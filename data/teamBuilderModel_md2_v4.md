# Team Builder Optimizer MD2 v4

Generated: 2026-06-18

## Purpose

Team Builder Optimizer MD2 v4 updates only the public Team Builder optimizer/scoring/review path so the default Balanced Squad and the four alternate public strategies use the active MD2 model stack.

It does not rebuild score predictions, player projections, recommendations, finance metrics, PELE, or Team Builder source data. The optimizer consumes the already active public data path.

## Active Data Contract

- Identity universe: `FANTASY_POOL_OFFICIAL_DATA_STATUS.official_position_records`
- Primary join key: `official_fantasy_player_id`
- Rule source: `fantasyRulesData.js` / `fantasyRules.json`
- Primary scoring source: `fantasyPoolMatchdayProjectionsData.js` / `data/fantasyPoolMatchdayProjections_md2_v4.json`
- Role/start/minutes support: `data/playerRoleModel_md2_v2.json`
- Secondary context: `fantasyPoolRecommendationsData.js`, `fantasyPoolScorePredictionsData.js`, `fantasyPoolFinanceMetricsData.js`
- Supplemental enrichment only: `playersData.js`
- Ownership signal: not used

## Public Strategies Kept

- Balanced Squad
- Diversified Squad
- Concentrated Upside
- Stars and Scrubs
- Value Squad

## Optimizer Changes

- The default active public matchday now prefers `md2` when available, so Team Builder starts from the active MD2 projection context.
- Strategy profile version is now `team_builder_optimizer_md2_v4`.
- Balanced Squad is projection-first for the starting XI, with strong captain, risk-adjusted, start-probability, expected-minutes, and bench-playability checks.
- The old Balanced anti-premium and cheap-depth bias was removed. Low-projection cheap picks are penalized unless they are genuinely useful in the active MD2 model.
- Candidate pools explicitly include top MD2 projected players, captain-priority players, playable projection rows, role-secure players, and value-depth players.
- Completed legal squads are still checked against budget, position, formation, country-limit, selectable-status, active official ID, projection-row, and role-row constraints.

## QA Gate

The permanent QA script is `scripts/validateTeamBuilderMd2V4.mjs`.

It loads the current public active data files, builds all five public strategy squads with default settings, builds a simple legal greedy projection baseline, checks squad legality and data identity, compares strategy outputs, and writes:

- `data/teamBuilderQa_md2_v4.json`
- `data/teamBuilderQaReport_md2_v4.md`

Latest local QA result:

- Status: PASS
- Balanced starter MD2 projected points: 83.402
- Greedy legal baseline starter MD2 projected points: 83.741
- Balanced gap vs greedy: -0.339
- Balanced budget used: 100.0
- Balanced risky count: 0
- Balanced captain: Michael Olise
- Balanced vice-captain: Lionel Messi
- Balanced top-star overlap: 8

## Guardrails

This is an optimizer-path update only. If official players, prices, positions, statuses, rules, score predictions, projections, recommendations, finance metrics, or PELE data change, those pipelines must be rerun through their own scripts before this optimizer QA is treated as current again.
