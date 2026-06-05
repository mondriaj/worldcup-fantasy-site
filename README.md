# World Cup Fantasy Helper

A static fantasy football website for comparing quick picks, captain options, captain switches, manual substitutions, player rankings, and squad ideas.

## Current Status

This site treats FIFA's official fantasy player feed as the working authority for public picks. Recommendation sections show **Official Fantasy Picks** using official fantasy players, prices, positions, selectable status, and scoring. Keep running the monitor before major updates because FIFA can still change player status, prices, positions, rules, or deadlines.

The current UX is task-first: Home, Picks, Team Builder, Matchday Desk, Fantasy Finance, World Cup Guide, and Model Notes. The homepage centers the three primary actions - Build My Squad, See Top Picks, and Open Matchday Desk. Picks are card-first with one primary pick-type badge; Player Profile and Captain Watchlist keep the deeper practical rationale, captain context, and caution context. Squad Builder Starter shows an 8-card curated starter pack instead of one card per model: 1 Top Projection, 2 Core Picks, 1 High-Floor Pick, 1 Upside Pick, 2 value-oriented picks with a Budget Enabler when available, and 1 Differential Pick. Team Builder uses a guided step flow with squad-building strategies, and Matchday Desk groups saved-squad captain, bench, and timeline decisions.

Public player-pick labels are **Projected Points**, **Core Picks**, **High-Floor Picks**, **Upside Picks**, **Value Picks**, and **Differential Picks**. Captain is handled through the dedicated Captain Watchlist, Player Profile context, and matchday tools rather than as a normal public pick model or repeated card badge. Value Quant and Risk-Control remain advanced/internal variants for model notes and older exports, not main dropdown choices. Team Builder strategy labels are **Balanced Squad**, **Diversified Squad**, **Concentrated Upside**, **Stars and Scrubs**, and **Value Squad**; the builder now applies strategy-aware squad scoring weights after legal candidate squads are formed. Stars and Scrubs is tuned to separate from Balanced Squad by accepting a weaker bench for stronger premium-starter concentration when feasible. After a build, the review step adds a compact **Squad Strategy Report** with Country Stack Risk, Fixture Stack Risk, Star Dependence, Bench Strength, Bad-Week Floor, Upside Ceiling, Budget Shape, and a short strategy-fit note. An advanced Team Builder comparison check can run all five strategies under the same current settings, show squad overlap, and flag weak strategy identity. Finance language is simple by default: Squad Risk Report, Portfolio Health, Bad-Week Floor, Country Stack Risk, Fixture Stack Risk, and Budget Pressure. Advanced finance/model fields remain in Model Notes and export payloads for transparency.

Team Builder is a planning tool. Users should confirm squad legality, locks, deadlines, boosters, live points, and played/unplayed status inside the official FIFA fantasy game before saving or acting.

The current data/model stack uses browser-ready official fantasy-pool files for recommendations, matchday projections, finance/value metrics, score predictions, and official-data status. Match Environment now prefers the fantasy-pool score projection bundle and keeps the PELE-forward v2 score bundle as a static fallback. Preserved model versions remain available for model inspection, but the public experience is organized around the fantasy jobs: find picks, build a squad, and make matchday decisions.

Official fantasy browser data lives in separate browser-ready files: `fantasyPoolRecommendationsData.js`, `fantasyPoolMatchdayProjectionsData.js`, `fantasyPoolFinanceMetricsData.js`, `fantasyPoolScorePredictionsData.js`, and `fantasyPoolOfficialDataStatusData.js`. These are generated from fantasy-pool source files and preserve the older fallback files.

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
- `script.js` - uses browser-ready player, rules, matchday, score-prediction, and official fantasy-pool data; public recommendation sections prefer official fantasy candidates with legacy fallback, and Player Profile can send available players into Team Builder
- `AGENTS.md` - project instructions for Codex, including the player/rules data loading pattern
- `WEEK6_RECOMMENDATION_ENGINE_PLAN.md` - legacy model roadmap for recommendation trust, Team Builder constraints, budget/value calibration, portfolio-aware squad scoring, and future score-predictor upgrades
- `players.json` - source player dataset
- `playersData.js` - browser-ready copy of `players.json`
- `financePlayersData.js` - browser-ready Week 6 World Cup finance-model player data
- `matchdayProjectionsData.js` - browser-ready Matchday 1, Matchday 2, and Matchday 3 opponent adjustments from PELE-backed score predictions
- `scorePredictionsData.js` - browser-ready legacy fallback fixture score prediction data from `data/scorePredictions_v2.json`
- `fantasyPoolRecommendationsData.js` - browser-ready Official Fantasy Picks recommendation candidates from `data/matchdayRecommendations_fantasyPool_v3.json`
- `fantasyPoolMatchdayProjectionsData.js` - browser-ready staged v3 fantasy-pool player projections from `data/playerMatchdayProjections_fantasyPool_v3.json`
- `fantasyPoolFinanceMetricsData.js` - browser-ready staged fantasy-pool finance/value metrics from `data/playerFinanceMetrics_fantasyPool_v1.json`
- `fantasyPoolScorePredictionsData.js` - active browser-ready Match Environment score projection context from `data/scorePredictions_fantasyPool_v3.json`
- `fantasyPoolOfficialDataStatusData.js` - browser-ready official fantasy status and monitor copy
- `data/peleRatings_v1.json` - downloaded PELE rating, Tilt, and offense/defense data from Silver Bulletin Datawrapper CSVs
- `data/teamQuality.json` - active PELE-forward `team_quality_v2` model; `data/teamQuality_v1.json` and `data/teamQuality_v0.json` preserve earlier models
- `data/scorePredictions_fantasyPool_v3.json` - active fantasy-pool score projection source for public Match Environment context
- `data/scorePredictions_v2.json` - preserved PELE-forward generated score prediction model and static fallback for group-stage match environments
- `data/scorePredictionDataFlow_v1.md` - plain-language note for the active score prediction browser data flow
- `data/scorePredictions_v1.json` - preserved first PELE-backed score prediction model
- `data/scorePredictions_v0.json` - preserved pre-PELE score prediction model
- `data/scorePredictionModelRoadmap.md` - v1/v2 score model upgrade notes
- `data/scorePredictionQa_v2.json` - generated score-prediction coverage, bounds, PELE coverage, and integration checks
- `data/scorePredictionQaReport_v2.md` - human-readable score-prediction check summary
- `data/recommendationQa_v2.json` - generated audit of top recommendation pools by style, matchday, position, country, data quality, role risk, and fixture context
- `data/recommendationQaReport_v2.md` - human-readable recommendation-check summary and watchlists
- `data/recommendationTrustModel_v0.md` - legacy recommendation-trust notes; the current public pick labels are Projected Points, Core Picks, High-Floor Picks, Upside Picks, Value Picks, and Differential Picks
- `data/captainChangeAdvisorModel_v0.md` - plain-language notes for the manual Quick Captain Switch Check
- `data/substitutionAdvisorModel_v0.md` - plain-language notes for the manual Quick Substitution Check
- `data/teamExportModel_v1.md` - plain-language notes for the Team Export JSON v1 payload
- `data/teamImportModel_v0.md` - plain-language notes for restoring a saved Team Export JSON v1 file
- `data/userSquadSelection_v0.md` - plain-language notes for user-selected captain, vice captain, and bench order on built/imported squads
- `data/teamBuilderStrategyWeights_v1.md` - plain-language notes for strategy-aware Team Builder squad scoring weights
- `data/teamBuilderStrategyComparison_v1.md` - plain-language notes for the advanced Team Builder strategy comparison check
- `data/matchdayDecisionCenter_v0.md` - plain-language notes for the saved-squad captain and bench decision center
- `data/officialDataReadiness_v0.json` - generated readiness snapshot for official squads, fantasy player IDs, positions, prices, rules, scoring, and deadlines
- `data/officialFantasyImportSchema_v0.json` - machine-readable import contract for future official fantasy player, final squad, and rules data
- `data/officialFantasyImportReport_v0.json` - generated import-pipeline report for the official fantasy player feed
- `data/officialFantasyImportPipeline_v0.md` - plain-language notes for the official fantasy player import pipeline
- `data/officialFantasyRulesImportReport_v0.json` - generated official fantasy rules-import report; deadline semantics still require manual live-game confirmation
- `data/officialFantasyRulesImportPipeline_v0.md` - plain-language notes for the official fantasy rules import pipeline
- `data/officialSquadsImportReport_v0.json` - generated final-squad reconciliation report; final squad source-backing remains an internal audit blocker
- `data/officialSquadsImportPipeline_v0.md` - plain-language notes for the final official squad reconciliation pipeline
- `data/officialDataReadiness_v0.md` - plain-language notes for the official-data gate and model rerun sequence
- `data/savedSquadDecisionMode_v0.md` - plain-language notes for using a built/imported Team Builder squad inside the manual decision tools
- `data/savedSquadMatchdayTimeline_v0.md` - plain-language notes for the built/imported squad kickoff timeline and advisor quick-fill buttons
- `data/savedDecisionExport_v0.md` - plain-language notes for exporting the latest manual captain/substitution quick-check result
- `data/savedDecisionImport_v0.md` - plain-language notes for restoring saved decision scenarios as imported review context
- `data/decisionToolsQaPolish_v0.md` - plain-language notes for advisor status badges, imported-rerun warnings, and focused decision-tool checks
- `data/playerValueModel_v1.json` - legacy budget/value calibration data preserved for compatibility with older model paths
- `data/squadPortfolioAnalytics_v0.md` - plain-language notes for Team Builder squad-level risk, return, concentration, and premium-squeeze analytics
- `data/portfolioOptimizerModel_v0.md` - plain-language notes for the portfolio-aware Team Builder scoring adjustment used to choose between completed squad candidates
- `fantasyRules.json` - active official fantasy rules summary promoted from `data/officialFantasyRules_v0.json`
- `fantasyRulesData.js` - browser-ready copy of `fantasyRules.json`
- `rulesSources.md` - source notes for the official fantasy rules import and remaining manual checks
- `world-cup.html` - separate tournament information page
- `worldCupData.js` - static World Cup groups, group-stage fixtures, bracket paths, and source notes
- `worldCupPage.js` - renderer for the tournament information page
- `dataSources.md` - data source notes
- `euroScoringGuide.md` - scoring and model notes
- `countryMappingGuide.md` - country mapping notes

## Known Limits

- Public recommendation sections use the current official FIFA fantasy pool.
- FIFA can still update player status, prices, positions, rules, or deadlines; rerun the monitor before major updates.
- Official fantasy prices, positions, scoring, and the Clean Sheet Shield booster rule are imported for recommendations.
- Official Data Readiness v0 remains an internal audit gate for deeper model promotion, even though the public site now treats the fantasy feed as the website authority.
- Team Builder is planning help and should be verified inside the official game before saving.
- Team Builder is a practical browser-side squad search, not a final tournament prediction model.
- Score predictions are prototype model outputs and are not official projections or betting odds.
- Captain Change Advisor v0 is a manual switch check. Without a built/imported Team Builder squad it does not know the user's full squad; with saved-squad mode it still cannot track live scores or verify played/unplayed status.
- Substitution Advisor v0 is a manual one-bench-player check. Without a built/imported Team Builder squad it does not know the user's full squad; with saved-squad mode it still cannot verify played/unplayed status and flags different-position moves for manual formation checks.
- Team Import v0 restores saved current player IDs only. It does not migrate old exports across future ID changes or confirm that a saved squad is legal in the official game.
- User Squad Selection v0 stores captain, vice captain, and bench order as local browser state only. It does not validate official deadlines, live points, or official fantasy-game legality.
- Matchday Decision Center v0 does not infer played/unplayed state, live points, official deadlines, or formation legality. It only organizes manual checks from the saved squad.
- Saved Squad Decision Mode v0 can fill advisor fields from a built/imported Team Builder squad, but it still cannot verify live points, played/unplayed status, or official-game legality.
- Saved Decision Export v0 stores only the latest manual quick-check result after the user runs it.
- Saved Decision Import v0 restores saved quick-check scenarios as imported review context, not fresh live recommendations.
- Decision tool status badges are UI guidance only; users still must confirm actual scores, played/unplayed state, deadlines, and official-game legality.
- Saved Squad Matchday Timeline v0 uses model matchday projection kickoff labels. It does not infer live match status, official fantasy deadlines, or same-day captain/substitution legality.
- This is independent and not official FIFA fantasy advice.
- No betting or gambling content is included.

## Future World Cup Data Plan

When FIFA fantasy data changes, rerun the official data monitor, import only the changed official data, and refresh affected public recommendation files.

Score model upgrade notes:

- v2: active PELE-forward model. Upgrade again after source-backed final squads, injuries, and updated national-team form materially change team context.
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
