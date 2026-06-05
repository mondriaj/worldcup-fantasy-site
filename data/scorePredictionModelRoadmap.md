# Score Prediction Model Roadmap

Status: active score model notes
Current public Match Environment flow: `fantasyPoolScorePredictionsData.js` from `scorePredictions_fantasyPool_v3.json`, with `scorePredictionsData.js` from `scorePredictions_v2.json` preserved as the static fallback.
Preserved base model: `scorePredictions_v2.json`

## Current Public Data Flow: Phase 3A

The public Match Environment table now prefers the fantasy-pool score projection context:

- Browser file: `../fantasyPoolScorePredictionsData.js`
- Source file: `scorePredictions_fantasyPool_v3.json`
- Window rows used by `script.js`: `window.FANTASY_POOL_SCORE_FIXTURE_PREDICTIONS`

The older PELE-forward v2 browser bundle remains loaded as a safe static fallback:

- Browser file: `../scorePredictionsData.js`
- Source file: `scorePredictions_v2.json`
- Window rows used if the fantasy-pool bundle is unavailable: `window.SCORE_FIXTURE_PREDICTIONS_DATA`

See `scorePredictionDataFlow_v1.md` for the plain-language browser data-flow note.

## Preserved Base Model: v2

Use v2 as the preserved PELE-forward base model and fallback score projection context.

Model type: PELE-forward team-quality adjusted Poisson.

What it uses:

- World Cup 2026 group fixtures.
- Team quality v2.
- PELE rating, Tilt, and round-robin offense/defense inputs from Silver Bulletin downloadable CSVs as leading current-strength inputs.
- World Football Elo as a secondary current-strength input and smaller direct score adjustment.
- FIFA ranking inputs already inside team quality.
- Attack and defense proxy scores led by PELE offense/defense, with World Cup history and current team strength retained as secondary checks.
- Host-venue boost only when a host country plays in its own country.

What it produces:

- Expected goals for each team.
- Win, draw, and loss probabilities.
- Clean-sheet probability for each team.
- Over 2.5 goals probability.
- Both-teams-to-score probability.
- Most likely scorelines.
- Goal environment.
- Upset risk.
- Attack, defense, and captain environment scores for fantasy use.

What it does not use yet:

- Final 26-player squads.
- Injuries or suspensions.
- Official fantasy prices.
- Official fantasy scoring rules.
- Betting odds.
- Recent friendlies or full recent international form.
- Player-weighted attack and defense strength.

## Step 6.5 PELE Data Integration: v1

Status: complete as of June 1, 2026.

This pass created the first PELE-backed v1 while preserving the pre-PELE v0 files for audit. v1 is now preserved because v2 is active.

Files added or updated:

- `peleRatings_v1.json` stores downloaded PELE, Tilt, and offense/defense data.
- `teamQuality.json` contained active `team_quality_v1` after this pass; `teamQuality_v1.json` now preserves it.
- `scorePredictions_v1.json` is the preserved first PELE-backed score model.
- `scorePredictionQa_v1.json` records machine-readable QA checks.
- `scorePredictionQaReport_v1.md` summarizes the checks in plain language.
- `playerMatchdayProjections_v1.json`, `matchdayRecommendations_v1.json`, and `recommendationQa_v1.json` regenerate downstream recommendation context.
- `scorePredictionsData.js` and `matchdayProjectionsData.js` exposed v1 data to the homepage before the v2 recalibration.

Checks now covered:

- Every group-stage fixture has one prediction row.
- Every fixture has two team-view rows.
- Every player-matchday projection has score-prediction context.
- Elo, FIFA ranking, and PELE rating inputs are present for every team.
- Expected goals are non-negative and below the v1 guardrail.
- Probabilities stay between 0 and 1.
- Home/draw/away probabilities sum to 1 within tolerance.
- Favorites match the higher home/away win probability.
- Top scorelines exist and stay within the scoreline guardrail.

Current QA result:

- Overall status: `pass`.
- Checks run: 11.
- Passed: 11.
- Failed: 0.
- Caveats: 0.

Fallback rules:

- If any hard QA check fails, keep the affected fixture in prototype review before using it for confident advice.
- If Elo or FIFA ranking is missing, lower fixture confidence and fall back to the available team-quality fields.
- If PELE is missing in a future update, leave it null and exclude it from that weighted blend.
- If probability or expected-goals bounds fail, fix and regenerate the source model before using the browser data.

## Step 6.6 PELE-Forward Recalibration: v2

Status: complete as of June 1, 2026.

This pass keeps the PELE import unchanged but makes PELE materially stronger in team quality and score predictions.

Files added or updated:

- `teamQuality_v1.json` preserves the first PELE-backed team-quality blend.
- `teamQuality.json` now contains active `team_quality_v2`.
- `scorePredictions_v2.json` is the preserved PELE-forward score model and Match Environment fallback.
- `scorePredictionQa_v2.json` and `scorePredictionQaReport_v2.md` record the v2 QA pass.
- `playerMatchdayProjections_v2.json`, `matchdayRecommendations_v2.json`, `recommendationQa_v2.json`, and `recommendationQaReport_v2.md` regenerate downstream recommendation context.
- `scorePredictionsData.js` preserves the v2 score rows as the homepage fallback, while `fantasyPoolScorePredictionsData.js` now supplies the preferred public Match Environment score projection context.

Main v2 changes:

- Current strength is now 0.62 PELE, 0.23 World Football Elo, and 0.15 FIFA ranking points.
- Overall team quality now gives 0.82 weight to current strength.
- Attack and defense proxies now give 0.44 weight to PELE offense/defense.
- Direct PELE rating gap in expected goals nearly doubles versus v1, while direct Elo gap is reduced.
- Missing PELE values are still never invented; missing numeric PELE fields remain null and are excluded from weighted blends.

Current QA result:

- Overall status: `pass`.
- Checks run: 11.
- Passed: 11.
- Failed: 0.
- Caveats: 0.

## Best Time To Upgrade To v3

Upgrade to v3 when the main fantasy inputs become real enough to affect player recommendations beyond team-level PELE strength.

Trigger checklist:

- Final World Cup squads are confirmed.
- Official fantasy player list is available.
- Official fantasy prices are available.
- Official fantasy positions are available.
- Official scoring rules and squad rules are imported.
- Recent qualifier, continental tournament, and friendly form has been merged.
- Injury and availability notes are added.
- Player minutes model has been reviewed after final squads.

Main v3 change:

Move from a team-only model to a roster-weighted model. Team expected goals and clean-sheet probabilities should depend on likely starters, player quality, role confidence, and price/value context.

Fantasy use:

- Recalibrate Best Value after official prices.
- Improve captain picks using team expected goals plus player start probability.
- Improve defender and goalkeeper picks using clean-sheet probability plus role security.
- Improve risky picks by separating real upside from weak-data noise.

## Best Time To Upgrade To v4

Upgrade to v4 after v3 is stable and we are ready to improve probability calibration.

Ideal timing:

- Before final tournament launch if we have enough time to backtest.
- Otherwise after Matchday 1 starts producing real tournament signals.

Main v3 change:

Move from plain Poisson to Dixon-Coles-style adjusted Poisson or another low-score football model. This corrects the tendency of plain Poisson to mis-handle 0-0, 1-0, 0-1, and 1-1 scorelines.

Data needed:

- Historical World Cup, qualifier, and continental match scorelines.
- Team ratings at match time where available.
- Host/neutral venue flags.
- Recent-form inputs.
- Backtest report comparing v0, v1, v2, and v3.

Fantasy use:

- Better clean-sheet probabilities.
- Better draw and low-scoring match risk.
- Better defensive-heavy recommendations.
- Better downside and tail-risk estimates.

## Upgrade Rule

Do not replace the active model only because a more complex model sounds better. Replace it when the new model gives clearer fantasy decisions and passes a backtest or spot-check review.

Keep each model version visible in the data so we can compare recommendations over time.
