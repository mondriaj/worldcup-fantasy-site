# Score Prediction Data Flow v1

Date: 2026-06-05

## Purpose

This note documents which static score projection files the public site uses after the Phase 3A data-flow cleanup, the Phase 3B PELE-anchored uncertainty pass, and the Phase 3C Match Environment display cleanup. Phase 3C clarifies public Projected xG labels; it does not replace the expected-goal formulas, probability model, player recommendations, or Team Builder optimizer.

## Public Site Loading

`index.html` loads browser-ready data files before `script.js`. For score projection context it loads both:

- `fantasyPoolScorePredictionsData.js`
- `scorePredictionsData.js`

No runtime JSON fetch is used for score prediction data.

## Active Match Environment Source

`script.js` now prefers `window.FANTASY_POOL_SCORE_FIXTURE_PREDICTIONS` from `fantasyPoolScorePredictionsData.js` for the public Match Environment table.

That bundle is generated from `data/scorePredictions_fantasyPool_v3.json`. It has all 72 group-stage fixture rows and carries the Match Environment fields the table displays:

- Projected xG
- Win / Draw / Win
- Most likely score
- Match uncertainty
- Clean-sheet context
- Upset risk

Projected xG is fixture-specific expected goals for the listed matchup. It uses the same final expected-goal values that feed the scoreline grid: `home_expected_goals` and `away_expected_goals`, now also exposed as `homeProjectedXg`, `awayProjectedXg`, `homeMatchXg`, and `awayMatchXg` aliases for clearer browser display code.

The same rows still carry total goals range, win/draw/loss probabilities, clean-sheet probabilities, goal environment, top scorelines, and upset-risk probability for details and fallback display. Total goals range is supporting context, not the lead public stat.

## Fallback Source

If the fantasy-pool score bundle is missing or empty, `script.js` falls back to `window.SCORE_FIXTURE_PREDICTIONS_DATA` from `scorePredictionsData.js`.

That fallback is generated from `data/scorePredictions_v2.json`, the preserved PELE-forward score projection model.

## Player Recommendations And Team Builder Context

Player recommendation cards and the Pick Explorer use `fantasyPoolRecommendationsData.js`, `fantasyPoolMatchdayProjectionsData.js`, and `fantasyPoolFinanceMetricsData.js` when those official fantasy-pool browser files are loaded.

Team Builder uses the same current official fantasy-pool player layer and player-level projection/finance context for squad construction. Fixture-level score rows support Match Environment and player profile fixture context; they are not fetched from JSON at runtime.

## Phase 3B/3C PELE, Projected xG, And Uncertainty Notes

The active fantasy-pool score source remains PELE-anchored through `data/peleRatings_v1.json` and the PELE-forward team-quality model. On 2026-06-05, the existing PELE Datawrapper source URLs were reachable and matched the local 2026-06-01 CSV files, so no PELE refresh was needed.

PELE remains the core team-strength anchor. The local score model converts PELE plus fixture context into fantasy-facing score projection context: fixture-specific Projected xG, scoreline probabilities, clean-sheet probabilities, uncertainty, and upset risk.

Phase 3B adds these fixture-level uncertainty fields while preserving the expected-goal fields:

- `uncertaintyLabel`
- `lowTotalGoals`, `baseTotalGoals`, `highTotalGoals`
- `homeXgLow`, `homeXgBase`, `homeXgHigh`
- `awayXgLow`, `awayXgBase`, `awayXgHigh`
- `uncertaintyReason`

It also adds fantasy-facing context fields:

- `attackerEnvironment`
- `defenderEnvironment`
- `keeperEnvironment`
- `cleanSheetContext`
- `goalEnvironment`
- `upsetRisk`
- `matchUncertainty`

Phase 3C removes the generic match-level attack column from the main public Match Environment table because it could imply a generic attacking grade. Attack-related fields remain available for model inspection and player-level context where needed.

See `peleAnchoredFantasyScoreModel_v1.md` for the model note and PELE source check.

## Current Limits

- This is a static score projection context, not live match data.
- It does not know official lineups, injuries, live scores, lock state, deadlines, or final squad confirmations.
- Users should still confirm squad legality, locks, deadlines, boosters, and played/unplayed status inside the official fantasy game before acting.
