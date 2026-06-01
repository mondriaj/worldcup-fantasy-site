# World Cup Fantasy Helper

A static fantasy football website for comparing quick picks, captain options, captain switches, manual substitutions, player rankings, and squad ideas.

## Current Status

This is a public preview. The site now uses the Week 6 World Cup data engine for teams, fixtures, roster candidates, player performance matching, national-team usage, and finance-style fantasy metrics. Official fantasy prices and official fantasy rules are still pending. Tournament groups and group-stage fixtures are shown separately on the World Cup page.

Week 5 adds Optimizer v0: the Team Builder now searches for a rules-valid squad using the selected pick style, draft budget, position counts, country limit, locked players, filters, and removed-player exclusions.

Week 6 adds `financePlayersData.js`, generated from `data/playerFinanceMetrics_v0.json`, `data/playerRecommendationInputs_v0.json`, `data/playerMinutesModel_v0.json`, `data/playerValueModel_v0.json`, and `data/playerValueModel_v1.json`. Step 6.5 imports PELE ratings from Silver Bulletin's downloadable Datawrapper CSVs into `data/peleRatings_v1.json`. The active model is now PELE-forward: `data/teamQuality.json` contains `team_quality_v2`, `data/teamQuality_v1.json` preserves the first PELE-backed blend, and `data/teamQuality_v0.json` preserves the pre-PELE model. `scorePredictionsData.js` now uses `data/scorePredictions_v2.json`, and `matchdayProjectionsData.js` is generated from `data/playerMatchdayProjections_v2.json`, so rankings and recommendation explanations use the PELE-forward score environment. Score Predictor v2 has machine-readable QA checks in `data/scorePredictionQa_v2.json` and passes with 48/48 World Cup teams matched to numeric PELE ratings. Player names in Quick Picks, Captain Picks, Team Advice, and Team Builder open a Player Profile view with identity, role, finance metrics, matchday fixtures, performance signals, and data-quality notes. Recommendation Modes v0 add Balanced, Safer Picks, High Upside, and Punts choices on top of the existing style scores, with visible raw versus trust-adjusted score breakdowns in recommendation views and exports. Team Advice now has a recommendation-pool filter for playable recommendations versus broader watchlist punts. Captain Change Advisor v0 adds a Quick Captain Switch Check: users enter a current captain's raw points and one replacement candidate, then the site compares that score against the candidate's compressed raw switch score, start probability, fixture context, and QA flags. Substitution Advisor v0 adds a manual quick check for one played starter against one unplayed bench player, using the same compressed raw-points scale plus start/minutes, fixture, QA, and formation-warning context. Team Export JSON v1 adds model metadata, builder settings, squad state, captain/vice placeholders, locked/removed player context, portfolio analytics, and future decision-tool placeholders. Team Import v0 restores that saved JSON by exact player IDs without rerunning the optimizer. Saved Squad Decision Mode v0 lets the captain and substitution tools fill their manual fields from the current built/imported Team Builder squad while still requiring user-entered points and manual played/unplayed checks. Saved Squad Matchday Timeline v0 groups the built/imported squad by MD1/MD2/MD3 kickoff and can quick-fill captain/substitution advisor fields. Team Builder now has risk controls for start probability, expected minutes, QA-review count, and risky fill-ins, while Safer Picks acts as a scoring preference instead of a hard wall. Proxy Price v1 makes prototype prices more role-aware before official prices arrive. Squad Portfolio Analytics v0 adds team-level expected return, risk-adjusted return, VaR/CVaR floor, QA load, country concentration, fixture concentration, and premium-squeeze warnings to the Team Builder. Portfolio Optimizer v0 now uses those squad-level metrics as a small adjustment when choosing between completed candidate squads. The old `playersData.js` remains as a fallback, but the live homepage prefers the Week 6 finance data when it is present.

## Run Locally

```bash
cd project
python3 -m http.server 8766
```

Then open:

```text
http://127.0.0.1:8766/index.html
```

The site can be opened from GitHub Pages or a local server. It loads browser-ready data scripts, so it does not need to fetch JSON files at runtime.

## Files Overview

- `index.html` - page structure and content
- `style.css` - responsive layout and visual styling
- `script.js` - uses the browser-ready player, rules, matchday, and score-prediction data, then powers Quick Picks, Captain Picks, Captain Change Advisor, Substitution Advisor, Team Advice, Player Profiles, Match Environment, Team Builder, rules validation, and Optimizer v0
- `AGENTS.md` - project instructions for Codex, including the player/rules data loading pattern
- `WEEK6_RECOMMENDATION_ENGINE_PLAN.md` - living plan for recommendation trust, Team Advice filters, Team Builder constraints, proxy price calibration, portfolio-aware optimization, and future score-predictor upgrades
- `players.json` - source player dataset
- `playersData.js` - browser-ready copy of `players.json`
- `financePlayersData.js` - browser-ready Week 6 World Cup finance-model player data
- `matchdayProjectionsData.js` - browser-ready Matchday 1, Matchday 2, and Matchday 3 opponent adjustments from PELE-backed score predictions
- `scorePredictionsData.js` - browser-ready fixture score prediction data for the Match Environment panel
- `data/peleRatings_v1.json` - downloaded PELE rating, Tilt, and offense/defense data from Silver Bulletin Datawrapper CSVs
- `data/teamQuality.json` - active PELE-forward `team_quality_v2` model; `data/teamQuality_v1.json` and `data/teamQuality_v0.json` preserve earlier models
- `data/scorePredictions_v2.json` - active PELE-forward generated score prediction model for group-stage match environments
- `data/scorePredictions_v1.json` - preserved first PELE-backed score prediction model
- `data/scorePredictions_v0.json` - preserved pre-PELE score prediction model
- `data/scorePredictionModelRoadmap.md` - v1/v2 score model upgrade notes
- `data/scorePredictionQa_v2.json` - generated score-prediction coverage, bounds, PELE coverage, and integration QA checks
- `data/scorePredictionQaReport_v2.md` - human-readable Score Prediction QA v2 summary
- `data/recommendationQa_v2.json` - generated audit of top recommendation pools by style, matchday, position, country, data quality, role risk, and fixture context
- `data/recommendationQaReport_v2.md` - human-readable Recommendation QA v2 summary and watchlists
- `data/recommendationTrustModel_v0.md` - plain-language notes for Balanced, Safer Picks, High Upside, and Punts recommendation modes
- `data/captainChangeAdvisorModel_v0.md` - plain-language notes for the manual Quick Captain Switch Check
- `data/substitutionAdvisorModel_v0.md` - plain-language notes for the manual Quick Substitution Check
- `data/teamExportModel_v1.md` - plain-language notes for the Team Export JSON v1 payload
- `data/teamImportModel_v0.md` - plain-language notes for restoring a saved Team Export JSON v1 file
- `data/savedSquadDecisionMode_v0.md` - plain-language notes for using a built/imported Team Builder squad inside the manual decision tools
- `data/savedSquadMatchdayTimeline_v0.md` - plain-language notes for the built/imported squad kickoff timeline and advisor quick-fill buttons
- `data/playerValueModel_v1.json` - active prototype proxy-price calibration for Team Builder and value styles until official fantasy prices exist
- `data/squadPortfolioAnalytics_v0.md` - plain-language notes for Team Builder squad-level risk, return, concentration, and premium-squeeze analytics
- `data/portfolioOptimizerModel_v0.md` - plain-language notes for the portfolio-aware Team Builder scoring adjustment
- `fantasyRules.json` - source Week 5 draft fantasy rules
- `fantasyRulesData.js` - browser-ready copy of `fantasyRules.json`
- `rulesSources.md` - source notes for the draft fantasy rules
- `world-cup.html` - separate tournament information page
- `worldCupData.js` - static World Cup groups, group-stage fixtures, bracket paths, and source notes
- `worldCupPage.js` - renderer for the tournament information page
- `dataSources.md` - data source notes
- `euroScoringGuide.md` - scoring and model notes
- `countryMappingGuide.md` - country mapping notes

## Known Limits

- Current picks use prototype World Cup data, matchday opponent adjustments, starter/minutes confidence, and score-model explanation text, not final fantasy advice.
- Some World Cup roster rows are preliminary, likely, or need manual checking.
- Official fantasy prices and rules are pending; the current builder uses `proxy_price_v1` only for prototype value-model testing.
- Team Builder rules currently come from the Week 5 draft rules in `fantasyRules.json`, loaded in the browser through `fantasyRulesData.js`.
- Optimizer v0 is a practical browser-side search, not a final tournament prediction model.
- Score predictions are prototype model outputs and are not official projections or betting odds.
- Captain Change Advisor v0 is a manual switch check. Without a built/imported Team Builder squad it does not know the user's full squad; with saved-squad mode it still cannot track live scores or verify played/unplayed status.
- Substitution Advisor v0 is a manual one-bench-player check. Without a built/imported Team Builder squad it does not know the user's full squad; with saved-squad mode it still cannot verify played/unplayed status and flags different-position moves for manual formation checks.
- Team Import v0 restores saved prototype player IDs only. It does not migrate old exports to future official fantasy IDs or confirm that a saved squad is legal in the official game.
- Saved Squad Decision Mode v0 can fill advisor fields from a built/imported Team Builder squad, but it still cannot verify live points, played/unplayed status, official-game legality, or user-confirmed captain/substitution decisions.
- Saved Squad Matchday Timeline v0 uses prototype matchday projection kickoff labels. It does not infer live match status, official fantasy deadlines, or same-day captain/substitution legality.
- This is independent and not official FIFA fantasy advice.
- No betting or gambling content is included.

## Future World Cup Data Plan

When reliable World Cup fantasy data becomes available, update final squad status, official rules, prices, and matchday-specific advice.

Score model upgrade notes:

- v2: active PELE-forward model. Upgrade again after final squads, official fantasy players, prices, positions, scoring rules, injuries, and updated national-team form are imported.
- Future calibration: after the roster-weighted model is stable, backtest or calibrate low-score/draw behavior with a Dixon-Coles-style adjustment.

Stage B adds FIFA-sourced tournament structure and group-stage fixture data while keeping player recommendations separate.

Future Stage C: add national team pages after official squads are announced.

Use `WEEK6_RECOMMENDATION_ENGINE_PLAN.md` as the active roadmap for the recommendation engine. Update it after each completed model or UI batch.

## Deployment

The site is static and can be hosted on GitHub Pages from the `project/` repository.
