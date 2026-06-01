# Week 6 Data Folder

This folder is the starter home for the real World Cup data engine.

The current live site now prefers the generated Week 6 finance browser file:

- `financePlayersData.js`

The older root files still exist as fallbacks or supporting browser data:

- `players.json`
- `playersData.js`
- `fantasyRules.json`
- `fantasyRulesData.js`
- `worldCupData.js`

The main homepage is wired to `financePlayersData.js`, which is generated from `playerFinanceMetrics_v0.json`, `playerRecommendationInputs_v0.json`, and `playerValueModel_v1.json`. It also loads `matchdayProjectionsData.js` and `scorePredictionsData.js` so matchday advice, player profile fixture tables, and fixture-level score environments can be inspected without fetching JSON at runtime. Step 6.5 now uses the PELE-forward v2 score and matchday projection files. Most files in this `data/` folder remain source-of-truth JSON rather than directly loaded browser files.

## Naming Rule

Use camelCase file names for new data-engine files because the site already uses names like `worldCupData.js`, `playersData.js`, and `fantasyRulesData.js`.

## Files

- `teams.json` - one record per World Cup team.
- `fixtures.json` - one record per match.
- `matchdays.json` - groups fixtures into fantasy matchdays.
- `players.json` - source-backed World Cup roster player rows, with official fantasy IDs still waiting for the fantasy-player import.
- `peleRatings_v1.json` - imported Silver Bulletin PELE ratings, Tilt, and round-robin offense/defense data from downloadable Datawrapper CSVs.
- `rosters.json` - official or provisional national-team squad records.
- `fantasyRules.json` - official World Cup fantasy rules once imported.
- `playerPerformance.json` - source-backed Big 5 league performance matches plus refreshed national-team usage context for matched players.
- `playerNationalTeamPerformance.json` - one national-team profile per roster player, with UEFA qualifier stats where matched, OneFootball qualifier match-page supplements where matched, and caps proxy fields where available.
- `playerRecommendationInputs_v0.json` - generated one-row-per-player recommendation input layer that merges roster identity, best available club form, national-team usage, team quality, group fixtures, and data confidence.
- `playerRecommendationTiers_v0.json` - generated player tier file with high/medium/low/review/insufficient recommendation-readiness labels.
- `playerFinanceMetrics_v0.json` - generated finance-style fantasy metrics with expected return, volatility, VaR, CVaR, Sharpe-like, Sortino-like, tail risk, and strategy scores.
- `playerMinutesModel_v0.json` - generated starter/minutes confidence model with start probability, expected minutes, minutes floor, substitution risk, and country role.
- `playerValueModel_v0.json` - original generated proxy-price and value model for testing Best Value, Cheap Enabler, and Premium Worth It styles before official prices are available.
- `playerValueModel_v1.json` - active generated proxy-price calibration used by the website. It role-adjusts expected return by start probability, expected minutes, and role confidence so the Team Builder is less distorted by low-minute upside rows.
- `playerMatchdayProjections_v2.json` - active fixture-by-fixture player projection rows for Matchday 1, Matchday 2, and Matchday 3, enriched with the PELE-forward score-prediction match environment.
- `playerMatchdayProjections_v1.json` - preserved first PELE-backed matchday projection model.
- `playerMatchdayProjections_v0.json` - preserved pre-PELE matchday projection model.
- `matchdayRecommendations_v2.json` - active matchday-specific shortlists for risk-adjusted, safe-floor, upside, attack-heavy, defensive-heavy, very-risky, tail-risk, and captain styles.
- `matchdayRecommendations_v1.json` - preserved first PELE-backed matchday recommendation shortlists.
- `recommendationQa_v2.json` - generated QA audit of top recommendation pools by style, matchday, position, country, data quality, role risk, and fixture context after PELE-forward recalibration.
- `recommendationQaReport_v2.md` - human-readable summary of the Recommendation QA v2 audit, including watchlists and recommended next fixes.
- `recommendationTrustModel_v0.md` - plain-language model note for Balanced, Safer Picks, High Upside, and Punts recommendation modes used by the live recommendation UI.
- `captainChangeAdvisorModel_v0.md` - plain-language model note for the manual Quick Captain Switch Check, including inputs, thresholds, and caveats.
- `substitutionAdvisorModel_v0.md` - plain-language model note for the manual Quick Substitution Check, including inputs, thresholds, formation caveats, and played/unplayed limitations.
- `teamExportModel_v1.md` - plain-language model note for Team Export JSON v1, including model metadata, builder settings, squad state, and future decision-tool placeholders.
- `fullFeatureTestReport_v0.md` - human-readable report for the Step 10 browser/static validation pass across the main homepage, World Cup page, Team Builder, export, and manual decision tools.
- `squadPortfolioAnalytics_v0.md` - plain-language model note for Team Builder portfolio analytics, including expected return, risk-adjusted return, VaR/CVaR, QA load, country concentration, fixture concentration, and premium squeeze.
- `portfolioOptimizerModel_v0.md` - plain-language model note for the small portfolio-aware adjustment used when the Team Builder ranks completed candidate squads.
- `scorePredictions_v2.json` - active PELE-forward Poisson score model with expected goals, win/draw/loss probabilities, clean-sheet probability, goal environment, and upset risk for each group fixture.
- `scorePredictions_v1.json` - preserved first PELE/Elo/team-quality Poisson score model.
- `scorePredictions_v0.json` - preserved pre-PELE score prediction model.
- `scorePredictionModelRoadmap.md` - notes for when to upgrade score predictions to v1 and v2.
- `scorePredictionQa_v2.json` - generated score-prediction QA checks for fixture coverage, probability bounds, xG guardrails, PELE input coverage, favorite consistency, and player-matchday integration.
- `scorePredictionQaReport_v2.md` - human-readable summary of the Score Prediction QA v2 hardening pass.
- `fantasyFinanceModel_v0.md` - plain-language model notes for the finance-style fantasy metrics.
- `statbunkerBig5Fantasy.json` - imported StatBunker fantasy-style source rows for starts, clean sheets, points, sub usage, goals conceded, penalties, and own goals.
- `nonBig5LeagueSourceTest.json` - source-feasibility probe for Portugal, Belgium, Poland, Greece, MLS, Brazil, and Argentina. It records ESPN, FootyStats, FBref, and Excel4Soccer test results but does not merge stats into player performance yet.
- `espnLeagueCoverage.json` - ESPN soccer competition scan across 168 competitions, including status, team API summary, scoreboard API summary, and leaderboard table counts.
- `espnLeagueLeaderboards.json` - parsed ESPN public leaderboard rows for usable competitions, mainly top scorers and top assists with appearances, ESPN player IDs, and team IDs.
- `espnRosterLeaderboardMatches.json` - prototype matches between World Cup roster players and ESPN leaderboard rows, split into high-confidence name-and-club matches and name-only review rows.
- `espnDetailedMatchPlayerStats.json` - detailed ESPN match-level player stats from Saudi Pro League match summaries and core player-stat endpoints.
- `espnDetailedSeasonPlayerStats.json` - Saudi Pro League season aggregates built from the detailed ESPN match-player rows.
- `espnDetailedRosterPlayerStats.json` - prototype matches between World Cup roster players and detailed ESPN Saudi season aggregates.
- `espnSummaryImportReport.json` - ESPN summary-roster fallback import report across domestic leagues for World Cup countries.
- `espnSummaryMatchedPlayerStats.json` - matched World Cup roster player-match rows from ESPN match summaries, with estimated minutes clearly flagged.
- `espnSummaryMatchedSeasonStats.json` - season aggregates from the ESPN summary-roster fallback import.
- `worldCupLeagueCoverageMap.json` - country-by-country map of domestic league source coverage and fallback rules.
- `oneFootballKoreaQatarImportReport.json` - OneFootball supplemental import report for K League 1 and Qatar Stars League.
- `oneFootballKoreaQatarLeagueStats.json` - OneFootball league leaderboards and standings for K League 1 and Qatar Stars League.
- `oneFootballKoreaQatarMatchPlayerStats.json` - OneFootball match-page player rows from confirmed lineups, substitutions, goals, assists, and cards.
- `oneFootballKoreaQatarSeasonPlayerStats.json` - season aggregates from the OneFootball Korea/Qatar match-player rows.
- `oneFootballKoreaQatarRosterMatches.json` - World Cup roster matches to OneFootball Korea/Qatar season rows.
- `oneFootballLeagueCoverageProbe.json` - OneFootball coverage probe across 32 target leagues to decide where it can complement ESPN, StatBunker, and other sources.
- `oneFootballAllImportReport.json` - full OneFootball complement import report across 30 usable leagues.
- `oneFootballAllLeagueStats.json` - OneFootball league leaderboards, standings, and team match-stat rows across the broad import.
- `oneFootballAllSeasonPlayerStats.json` - OneFootball season-player aggregates for all parsed players in the 30-league import.
- `oneFootballAllRosterMatches.json` - World Cup roster matches to broad OneFootball season-player aggregates.
- `oneFootballAllRosterMatchPlayerStats.json` - match-level OneFootball rows only for roster-matched players.
- `oneFootballNationalTeamMatchProbe.json` - OneFootball national-team feed probe used to find World Cup qualifier competition IDs.
- `oneFootballQualifierImportReport.json` - OneFootball World Cup qualifier import report across UEFA, OFC, CONCACAF, CAF, AFC, and CONMEBOL qualifying.
- `oneFootballQualifierRosterSeasonStats.json` - roster-player qualifier aggregates from OneFootball match pages.
- `oneFootballQualifierRosterMatchStats.json` - match-level OneFootball qualifier rows only for roster-matched players.
- `nonEnglishLeagueSourceProbe.json` - source probe for OneFootball, K League official pages, QSL official pages, and FootyStats Korea/Qatar candidates.
- `playerPerformanceMergePlan.md` - field-level plan for merging exact, estimated, and supplemental performance sources.
- `teamStrength.json` - team strength inputs for difficulty and predictions.
- `teamQuality.json` - active PELE-forward `team_quality_v2`, historical World Cup stats, current quality inputs, PELE inputs, group outlook, and goals/clean-sheet proxy scores.
- `teamQuality_v1.json` - preserved first PELE-backed team-quality model.
- `teamQuality_v0.json` - preserved pre-PELE team-quality model.
- `fixtureDifficulty.json` - fixture difficulty by team and opponent.
- `scorePredictions.json` - starter schema/example for fixture and player score predictions.
- `sourceManifest.json` - source IDs, URLs, priority, and fallback rules.
- `dataSources.md` - plain-language source notes.
- `dataQualityReport.md` - current import status and quality checks.
- `sourceScoutingReport.md` - researched candidate sources for the next player-performance and fantasy-data import pass.

## Data Policy

Some files now contain real Week 6 imports, while a few model-output files are still starter examples.

Treat records with `dataStatus`, `data_status`, or notes marked `schema_example`, `starter_example`, `not_imported`, `not_calculated`, or `prototype` as non-production placeholders.

## Website Use Later

After import and validation, generated browser-ready files should be created from these JSON files. Current generated files:

- `../financePlayersData.js` - homepage player recommendations, Player Profile identity/role/performance fields, and finance scoring.
- `../matchdayProjectionsData.js` - homepage matchday opponent adjustments, Player Profile fixture tables, and PELE-forward score-prediction xG, clean-sheet, and upset-risk fields.
- `../scorePredictionsData.js` - homepage Match Environment panel for PELE-forward fixture xG, favorites, clean-sheet watches, goal environment, and upset risk.

Example future files:

- `data/browser/worldCupTeamsData.js`
- `data/browser/worldCupPlayersData.js`
- `data/browser/worldCupFixturesData.js`
- `data/browser/worldCupMatchdaysData.js`
- `data/browser/worldCupPerformanceData.js`
- `data/browser/worldCupDifficultyData.js`
- `data/browser/worldCupPredictionsData.js`

Those generated files should define `window.*` globals, matching the current static-site pattern.
