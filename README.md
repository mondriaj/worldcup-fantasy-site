# World Cup Fantasy Helper

A static fantasy football website for comparing quick picks, captain options, captain switches, manual substitutions, player rankings, and squad ideas.

## Current Status

This is a public preview. The public recommendation sections now show **Official Fantasy Pool Preview** picks using official fantasy players, prices, positions, and scoring. These are not final-squad-backed recommendations: final squad status is not source-backed yet, deadline semantics still have a manual-review warning, and recommendations may change after final squad confirmation.

The current UX roadmap pass makes the site task-first: Home, Picks, Team Builder, Matchday Desk, Fantasy Finance, World Cup Guide, and Model Notes. The homepage centers the three primary actions - Build My Squad, See Top Picks, and Open Matchday Desk - while long status and methodology details sit lower in the page. Picks are card-first, Player Profile leads with user-facing pick rationale, Team Builder uses a guided flow, and Matchday Desk groups captain, bench, and saved-squad decisions.

Team Builder remains prototype/blocked. It still uses the existing prototype path and should not be treated as official or final until final squad and rule gates pass.

Week 5 adds Optimizer v0: the Team Builder now searches for a rules-valid squad using the selected pick style, draft budget, position counts, country limit, locked players, filters, and removed-player exclusions.

Week 6 adds `financePlayersData.js`, generated from `data/playerFinanceMetrics_v0.json`, `data/playerRecommendationInputs_v0.json`, `data/playerMinutesModel_v0.json`, `data/playerValueModel_v0.json`, and `data/playerValueModel_v1.json`. Step 6.5 imports PELE ratings from Silver Bulletin's downloadable Datawrapper CSVs into `data/peleRatings_v1.json`. The active model is now PELE-forward: `data/teamQuality.json` contains `team_quality_v2`, `data/teamQuality_v1.json` preserves the first PELE-backed blend, and `data/teamQuality_v0.json` preserves the pre-PELE model. `scorePredictionsData.js` now uses `data/scorePredictions_v2.json`, and `matchdayProjectionsData.js` is generated from `data/playerMatchdayProjections_v2.json`, so rankings and recommendation explanations use the PELE-forward score environment. Score Predictor v2 has machine-readable QA checks in `data/scorePredictionQa_v2.json` and passes with 48/48 World Cup teams matched to numeric PELE ratings. Player names in Quick Picks, Captain Picks, Team Advice, and Team Builder open a Player Profile view with identity, role, finance metrics, matchday fixtures, performance signals, and data-quality notes. Recommendation Modes v0 add Balanced, Safer Picks, High Upside, and Punts choices on top of the existing style scores, with visible raw versus trust-adjusted score breakdowns in recommendation views and exports. Team Advice now has a recommendation-pool filter for playable recommendations versus broader watchlist punts. Captain Change Advisor v0 adds a Quick Captain Switch Check: users enter a current captain's raw points and one replacement candidate, then the site compares that score against the candidate's compressed raw switch score, start probability, fixture context, and QA flags. Substitution Advisor v0 adds a manual quick check for one played starter against one unplayed bench player, using the same compressed raw-points scale plus start/minutes, fixture, QA, and formation-warning context. Team Export JSON v1 adds model metadata, builder settings, squad state, captain/vice references, locked/removed player context, portfolio analytics, and null-safe decision-tool fields. User Squad Selection v0 lets users mark captain, vice captain, and bench order on built/imported Team Builder squads; Team Export/Import preserves those choices by exact player ID with model captain fallback when unset. Matchday Decision Center v0 adds one saved-squad view for captain-switch and bench-order checks, using manual raw points and fill buttons that send one comparison into the detailed advisors. Saved Decision Export v0 now includes the latest manual captain/substitution quick-check result in Team Export JSON after the user runs one. Team Import v0 restores that saved JSON by exact player IDs without rerunning the optimizer, and Saved Decision Import v0 restores saved advisor scenarios as imported review context. Decision Tools QA Polish v0 adds Manual/Saved/Imported status badges and stronger rerun warnings for imported advisor scenarios. Saved Squad Decision Mode v0 lets the captain and substitution tools fill their manual fields from the current built/imported Team Builder squad while still requiring user-entered points and manual played/unplayed checks. Saved Squad Matchday Timeline v0 groups the built/imported squad by MD1/MD2/MD3 kickoff and can quick-fill captain/substitution advisor fields. Team Builder now has risk controls for start probability, expected minutes, QA-review count, and risky fill-ins, while Safer Picks acts as a scoring preference instead of a hard wall. Proxy Price v1 makes prototype prices more role-aware before official prices arrive. Squad Portfolio Analytics v0 adds team-level expected return, risk-adjusted return, VaR/CVaR floor, QA load, country concentration, fixture concentration, and premium-squeeze warnings to the Team Builder. Portfolio Optimizer v0 now uses those squad-level metrics as a small adjustment when choosing between completed candidate squads. The old `playersData.js` remains as a fallback, but the live homepage prefers the Week 6 finance data when it is present.

Official Fantasy Pool Preview promotion adds separate browser-ready preview files: `fantasyPoolRecommendationsData.js`, `fantasyPoolMatchdayProjectionsData.js`, `fantasyPoolFinanceMetricsData.js`, `fantasyPoolScorePredictionsData.js`, and `fantasyPoolOfficialDataStatusData.js`. These are generated from staged fantasy-pool source files and do not overwrite the active v2/prototype files.

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

- `SITE_FEATURES.md` - readable product-level summary of the site's current features, data/model engine, official-data pipelines, and limits
- `OFFICIAL_DATA_NEXT_STEPS.md` - operational roadmap for what Codex should do when official squads, fantasy players, prices, positions, and rules become available
- `index.html` - task-first page structure, primary navigation, hero actions, Picks, Team Builder, Matchday Desk, Fantasy Finance, World Cup Guide, and Model Notes content
- `style.css` - responsive layout and visual styling
- `script.js` - uses browser-ready player, rules, matchday, score-prediction, and Official Fantasy Pool Preview data; public recommendation sections prefer preview candidates with legacy fallback, Player Profile can send available players into Team Builder, while Team Builder remains on the prototype path
- `AGENTS.md` - project instructions for Codex, including the player/rules data loading pattern
- `WEEK6_RECOMMENDATION_ENGINE_PLAN.md` - living plan for recommendation trust, Team Advice filters, Team Builder constraints, proxy price calibration, portfolio-aware optimization, and future score-predictor upgrades
- `players.json` - source player dataset
- `playersData.js` - browser-ready copy of `players.json`
- `financePlayersData.js` - browser-ready Week 6 World Cup finance-model player data
- `matchdayProjectionsData.js` - browser-ready Matchday 1, Matchday 2, and Matchday 3 opponent adjustments from PELE-backed score predictions
- `scorePredictionsData.js` - browser-ready fixture score prediction data for the Match Environment panel
- `fantasyPoolRecommendationsData.js` - browser-ready Official Fantasy Pool Preview recommendation candidates from `data/matchdayRecommendations_fantasyPool_v3.json`
- `fantasyPoolMatchdayProjectionsData.js` - browser-ready staged v3 fantasy-pool player projections from `data/playerMatchdayProjections_fantasyPool_v3.json`
- `fantasyPoolFinanceMetricsData.js` - browser-ready staged fantasy-pool finance/value metrics from `data/playerFinanceMetrics_fantasyPool_v1.json`
- `fantasyPoolScorePredictionsData.js` - browser-ready staged fantasy-pool score predictions from `data/scorePredictions_fantasyPool_v3.json`
- `fantasyPoolOfficialDataStatusData.js` - browser-ready public preview status and warning copy
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
- `data/userSquadSelection_v0.md` - plain-language notes for user-selected captain, vice captain, and bench order on built/imported squads
- `data/matchdayDecisionCenter_v0.md` - plain-language notes for the saved-squad captain and bench decision center
- `data/officialDataReadiness_v0.json` - generated readiness snapshot for official squads, fantasy player IDs, positions, prices, rules, scoring, and deadlines
- `data/officialFantasyImportSchema_v0.json` - machine-readable import contract for future official fantasy player, final squad, and rules data
- `data/officialFantasyImportReport_v0.json` - generated import-pipeline report; currently waiting for the official fantasy player file
- `data/officialFantasyImportPipeline_v0.md` - plain-language notes for the official fantasy player import pipeline
- `data/officialFantasyRulesImportReport_v0.json` - generated rules-import report; currently waiting for official fantasy rules
- `data/officialFantasyRulesImportPipeline_v0.md` - plain-language notes for the official fantasy rules import pipeline
- `data/officialSquadsImportReport_v0.json` - generated final-squad reconciliation report; currently waiting for official final squad input
- `data/officialSquadsImportPipeline_v0.md` - plain-language notes for the final official squad reconciliation pipeline
- `data/officialDataReadiness_v0.md` - plain-language notes for the official-data gate and model rerun sequence
- `data/savedSquadDecisionMode_v0.md` - plain-language notes for using a built/imported Team Builder squad inside the manual decision tools
- `data/savedSquadMatchdayTimeline_v0.md` - plain-language notes for the built/imported squad kickoff timeline and advisor quick-fill buttons
- `data/savedDecisionExport_v0.md` - plain-language notes for exporting the latest manual captain/substitution quick-check result
- `data/savedDecisionImport_v0.md` - plain-language notes for restoring saved decision scenarios as imported review context
- `data/decisionToolsQaPolish_v0.md` - plain-language notes for advisor status badges, imported-rerun warnings, and focused decision-tool QA
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

- Public recommendation sections are Official Fantasy Pool Preview recommendations, not final fantasy advice.
- Final squad status is not source-backed; fantasy-pool selectable status is not final squad confirmation.
- Official fantasy prices, positions, scoring, and the Clean Sheet Shield booster rule are imported for preview recommendations, but deadline semantics still have a manual-review warning.
- Official Data Readiness v0 still reports `blocked_waiting_for_official_fantasy_data` because final squads and remaining rule warnings are unresolved.
- Team Builder remains prototype/blocked and should not be treated as official or final.
- Optimizer v0 is a practical browser-side search, not a final tournament prediction model.
- Score predictions are prototype model outputs and are not official projections or betting odds.
- Captain Change Advisor v0 is a manual switch check. Without a built/imported Team Builder squad it does not know the user's full squad; with saved-squad mode it still cannot track live scores or verify played/unplayed status.
- Substitution Advisor v0 is a manual one-bench-player check. Without a built/imported Team Builder squad it does not know the user's full squad; with saved-squad mode it still cannot verify played/unplayed status and flags different-position moves for manual formation checks.
- Team Import v0 restores saved prototype player IDs only. It does not migrate old exports to future official fantasy IDs or confirm that a saved squad is legal in the official game.
- User Squad Selection v0 stores captain, vice captain, and bench order as local prototype user state only. It does not validate official deadlines, live points, or official fantasy-game legality.
- Matchday Decision Center v0 does not infer played/unplayed state, live points, official deadlines, or formation legality. It only organizes manual checks from the saved squad.
- Saved Squad Decision Mode v0 can fill advisor fields from a built/imported Team Builder squad, but it still cannot verify live points, played/unplayed status, or official-game legality.
- Saved Decision Export v0 stores only the latest manual quick-check result after the user runs it.
- Saved Decision Import v0 restores saved quick-check scenarios as imported review context, not fresh live recommendations.
- Decision tool status badges are UI guidance only; users still must confirm actual scores, played/unplayed state, deadlines, and official-game legality.
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

Official-data readiness check:

```bash
node scripts/validateOfficialDataReadiness.mjs
```

Official fantasy data update check:

```bash
node scripts/checkOfficialFantasyDataUpdates.mjs
```

This compares live FIFA fantasy players, squads, rules/help pages, rounds, and language JSON against the local official-data staging files. It writes `data/officialFantasyDataUpdateCheck_v1.json` and `data/officialFantasyDataUpdateCheckReport_v1.md`, then recommends whether an import or model rerun is needed. It does not import data or rerun models.

Official fantasy player import pipeline:

```bash
node scripts/importOfficialFantasyPlayers.mjs
```

Official fantasy rules import pipeline:

```bash
node scripts/importOfficialFantasyRules.mjs
```

Official final squad reconciliation pipeline:

```bash
node scripts/importOfficialSquads.mjs
```

## Deployment

The site is static and can be hosted on GitHub Pages from the `project/` repository.
