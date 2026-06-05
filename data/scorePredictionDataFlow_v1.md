# Score Prediction Data Flow v1

Date: 2026-06-05

## Purpose

This note documents which static score projection files the public site uses after the Phase 3A data-flow cleanup and the Phase 3B PELE-anchored uncertainty pass. Phase 3B adds public goal-range and fantasy-context fields; it does not replace the base expected-goal formulas, probability model, player recommendations, or Team Builder optimizer.

## Public Site Loading

`index.html` loads browser-ready data files before `script.js`. For score projection context it loads both:

- `fantasyPoolScorePredictionsData.js`
- `scorePredictionsData.js`

No runtime JSON fetch is used for score prediction data.

## Active Match Environment Source

`script.js` now prefers `window.FANTASY_POOL_SCORE_FIXTURE_PREDICTIONS` from `fantasyPoolScorePredictionsData.js` for the public Match Environment table.

That bundle is generated from `data/scorePredictions_fantasyPool_v3.json`. It has all 72 group-stage fixture rows and carries the Match Environment fields the table displays:

- Goal range
- Match uncertainty
- Attacker context
- Clean-sheet context
- Upset risk

The same rows still carry base expected goals, win/draw/loss probabilities, clean-sheet probabilities, goal environment, top scorelines, and upset-risk probability for details and fallback display.

## Fallback Source

If the fantasy-pool score bundle is missing or empty, `script.js` falls back to `window.SCORE_FIXTURE_PREDICTIONS_DATA` from `scorePredictionsData.js`.

That fallback is generated from `data/scorePredictions_v2.json`, the preserved PELE-forward score projection model.

## Player Recommendations And Team Builder Context

Player recommendation cards and the Pick Explorer use `fantasyPoolRecommendationsData.js`, `fantasyPoolMatchdayProjectionsData.js`, and `fantasyPoolFinanceMetricsData.js` when those official fantasy-pool browser files are loaded.

Team Builder uses the same current official fantasy-pool player layer and player-level projection/finance context for squad construction. Fixture-level score rows support Match Environment and player profile fixture context; they are not fetched from JSON at runtime.

## Phase 3B PELE And Uncertainty Notes

The active fantasy-pool score source remains PELE-anchored through `data/peleRatings_v1.json` and the PELE-forward team-quality model. On 2026-06-05, the existing PELE Datawrapper source URLs were reachable and matched the local 2026-06-01 CSV files, so no PELE refresh was needed.

Phase 3B adds these fixture-level uncertainty fields while preserving the base xG fields:

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

See `peleAnchoredFantasyScoreModel_v1.md` for the model note and PELE source check.

## Current Limits

- This is a static score projection context, not live match data.
- It does not know official lineups, injuries, live scores, lock state, deadlines, or final squad confirmations.
- Users should still confirm squad legality, locks, deadlines, boosters, and played/unplayed status inside the official fantasy game before acting.
