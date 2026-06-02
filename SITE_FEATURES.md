# Site Features Summary

This document summarizes what the World Cup Fantasy Helper site can do today. It is a product-level guide, not a data-model changelog.

## Core Site

- Static website that can run from GitHub Pages or a local HTTP server.
- Main fantasy helper page for player recommendations, squad building, matchday decisions, and model inspection.
- Separate World Cup page for tournament groups, group-stage fixtures, and bracket-path context.
- Browser-ready data files are loaded directly by the page, so the site does not need runtime API calls.
- Player names in the main recommendation views open a Player Profile view with identity, role, finance metrics, matchday fixtures, performance signals, and data-quality notes.

## Player Recommendations

- Quick Picks show Official Fantasy Pool Preview candidates using official fantasy prices, positions, scoring, staged projections, and staged finance metrics.
- Captain Picks focus on staged Captain Alpha preview candidates.
- Team Advice provides filtered Official Fantasy Pool Preview candidate pools by matchday, position, risk style, and recommendation pool.
- Recommendation modes include Balanced, Safer Picks, High Upside, and Punts.
- Recommendation explanations show raw score context, trust-adjusted score context, role risk, data-quality warnings, and fixture environment notes.
- Preview recommendations remain fantasy-pool-only, not final-squad-backed, not Team Builder-ready, and not final public recommendations.

## Match Environment

- Fixture-level score prediction panel shows group-stage match environments.
- Score Predictor v2 uses a PELE-forward team-quality model and preserved previous versions for comparison.
- Predictions include expected goals, win/draw/loss probabilities, clean-sheet probability, goal environment, and upset risk.
- Score prediction QA checks verify fixture coverage, probability bounds, PELE input coverage, favorite consistency, and player-matchday integration.

## Team Builder

- Builds a prototype fantasy squad using selected pick style, draft budget, position counts, country limit, locked players, removed players, and filters.
- Team Builder remains prototype/blocked after the Official Fantasy Pool Preview promotion.
- Supports risk controls for minimum start probability, expected minutes, QA-review count, and risky fill-ins.
- It should not be treated as official or final until final squad and rule gates pass.
- Provides optimizer warnings when constraints are tight or force weaker/riskier picks.
- Allows users to mark captain, vice captain, and bench order on built or imported squads.
- Preserves user-selected captain, vice captain, and bench order through Team Export/Import when player IDs still match.

## Portfolio Analytics

- Squad Portfolio Analytics explains the built squad as a whole, not only as individual picks.
- Metrics include expected return, risk-adjusted return, volatility, VaR/CVaR floor, QA load, country concentration, fixture concentration, and premium-squeeze warnings.
- Portfolio Optimizer v0 uses these squad-level metrics as a small adjustment when choosing between completed candidate squads.
- Exported team JSON includes portfolio metrics and optimizer context.

## Matchday Decision Tools

- Captain Change Advisor v0 provides a manual Quick Captain Switch Check.
- Users enter the current captain's raw fantasy points and compare one possible replacement who has not played yet.
- The advisor is intentionally conservative with strong captain scores; a 12+ raw captain score should usually lead to keep unless the user is deliberately chasing a risky upside move.
- Substitution Advisor v0 compares one played starter against one unplayed bench player using manual points and projection context.
- Saved Squad Decision Mode can fill captain and substitution advisor fields from the current built or imported Team Builder squad.
- Saved Squad Matchday Timeline groups a built/imported squad by MD1, MD2, and MD3 kickoff context and provides quick-fill buttons for decision tools.
- Matchday Decision Center v0 gives one saved-squad hub for captain-switch and bench-order checks before users open the detailed advisor tools.
- Decision tool status badges distinguish Manual, Saved, and Imported review states.

## Export And Import

- Team Export JSON v1 records model metadata, builder settings, squad state, starters, bench, captain/vice references, locked and removed players, portfolio analytics, and decision-tool fields.
- Saved Decision Export v0 includes the latest manual captain-change or substitution quick-check result after the user runs one.
- Team Import v0 restores saved squads by exact current player IDs without rerunning the optimizer.
- Saved Decision Import v0 restores previous advisor scenarios as imported review context, not as fresh live recommendations.

## Data And Model Engine

- Week 6 data engine combines team data, fixtures, roster candidates, player performance matching, national-team usage, and finance-style fantasy metrics.
- PELE ratings from Silver Bulletin are imported into `data/peleRatings_v1.json` and are central to the active team-quality and score-prediction model.
- Active score predictions use `data/scorePredictions_v2.json`.
- Active matchday player projections use `data/playerMatchdayProjections_v2.json`.
- Active recommendation shortlists use `data/matchdayRecommendations_v2.json`.
- Public preview recommendation sections now load separate staged fantasy-pool browser files: `fantasyPoolRecommendationsData.js`, `fantasyPoolMatchdayProjectionsData.js`, `fantasyPoolFinanceMetricsData.js`, `fantasyPoolScorePredictionsData.js`, and `fantasyPoolOfficialDataStatusData.js`.
- The staged source files are `data/matchdayRecommendations_fantasyPool_v3.json`, `data/playerMatchdayProjections_fantasyPool_v3.json`, `data/playerFinanceMetrics_fantasyPool_v1.json`, and `data/scorePredictions_fantasyPool_v3.json`.
- Previous model versions are preserved where material changes were made.
- Official Data Readiness v0 tracks blockers before rerunning final value, Team Builder, score, and recommendation models.

## Official Data Pipelines

- Official fantasy players, prices, positions, and scoring have been imported for preview recommendations.
- Official fantasy rules still carry manual-review warnings for Mystery Booster and deadline semantics.
- Official final squad reconciliation exists, but final squads are not source-backed yet.
- Import templates are provided in `data/imports/`.
- Readiness validation reports whether final model reruns are allowed or still blocked by missing official data.

## Current Limits

- The site is a public preview, not official FIFA fantasy advice.
- Public recommendations are labeled Official Fantasy Pool Preview, not final recommendations.
- Final squad status is not source-backed; fantasy-pool selectable status is not final squad confirmation.
- Official fantasy prices, positions, and scoring are available for preview, but rules still have manual-review warnings.
- Team Builder remains prototype/blocked and should not be treated as final.
- Score predictions are prototype model outputs, not official projections or betting odds.
- Captain and substitution tools require manual points and manual played/unplayed checks.
- The site does not track live scores, official deadlines, official lineup locks, or official fantasy-game legality.
- Team Import restores current prototype player IDs only and may need migration after official fantasy IDs arrive.
- No betting or gambling content is included.

## Most Important Next Step

Use the preview as clearly labeled public staging only. The next final-promotion gate is source-backed final squads plus resolution of the remaining official rules warnings, followed by final score predictions, matchday projections, recommendations, and Team Builder value/model reruns.
