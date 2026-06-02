# Official Data Stage Inventory v1

Date: 2026-06-02

Scope: DATA-0 official-data preparation only. No recommendation model, Team Builder model, captain logic, substitution logic, UX flow, proxy price replacement, or model rerun was performed for this inventory.

## Current Gate Status

- Official data readiness file: `data/officialDataReadiness_v0.json`
- Current readiness status: `blocked_waiting_for_official_fantasy_data`
- Official fantasy player import report: `data/officialFantasyImportReport_v0.json` with status `awaiting_official_input`
- Official squad import report: `data/officialSquadsImportReport_v0.json` with status `awaiting_official_squads_input`
- Official fantasy rules import report: `data/officialFantasyRulesImportReport_v0.json` with status `awaiting_official_rules_input`
- Current active prices: `proxy_price_v1`, not official fantasy prices
- Current active rules in the browser: root `fantasyRules.json` and `fantasyRulesData.js`, both based on Week 5 draft rules
- Future official-rules placeholder: `data/fantasyRules.json`, status `not_imported`

## Current Active Model And Data Files

These files are active in the current public preview, but they remain prototype or official-data-blocked until official imports pass readiness.

- `data/players.json` - active World Cup roster/player pool with 1,339 rows; official fantasy IDs are still missing.
- `data/teams.json` - active 48-team data, including PELE-forward team-quality fields.
- `data/fixtures.json` - active 72 group-stage fixture data.
- `data/matchdays.json` - active prototype group-stage fantasy matchday grouping.
- `data/peleRatings_v1.json` - active PELE ratings input.
- `data/teamQuality.json` - active PELE-forward team-quality model.
- `data/scorePredictions_v2.json` - active PELE-forward group-stage score-prediction model.
- `data/playerRecommendationInputs_v0.json` - active recommendation input layer.
- `data/playerMinutesModel_v0.json` - active starter/minutes confidence model.
- `data/playerValueModel_v1.json` - active proxy-price value model.
- `data/playerFinanceMetrics_v0.json` - active finance-style player metrics.
- `data/playerMatchdayProjections_v2.json` - active PELE-forward player matchday projections.
- `data/matchdayRecommendations_v2.json` - active matchday recommendation shortlists.
- `data/recommendationQa_v2.json` - active recommendation QA audit.
- `data/recommendationQaReport_v2.md` - active human-readable recommendation QA report.
- `data/scorePredictionQa_v2.json` - active score-prediction QA audit.
- `data/scorePredictionQaReport_v2.md` - active human-readable score-prediction QA report.
- `data/playerPerformance.json` - active club-performance match layer.
- `data/playerNationalTeamPerformance.json` - active national-team usage layer.
- `data/squadPortfolioAnalytics_v0.md` - active portfolio analytics model note.
- `data/portfolioOptimizerModel_v0.md` - active portfolio optimizer model note.
- `data/recommendationTrustModel_v0.md` - active recommendation-mode trust note.
- `data/captainChangeAdvisorModel_v0.md` - active manual captain-switch model note.
- `data/substitutionAdvisorModel_v0.md` - active manual substitution-check model note.
- `data/teamExportModel_v1.md` - active Team Export payload note.
- `data/teamImportModel_v0.md` - active Team Import restore note.
- `data/userSquadSelection_v0.md` - active user-selected captain, vice captain, and bench-order note.
- `data/matchdayDecisionCenter_v0.md` - active decision center note.
- `data/savedSquadDecisionMode_v0.md` - active saved-squad advisor-fill note.
- `data/savedSquadMatchdayTimeline_v0.md` - active saved-squad matchday timeline note.
- `data/savedDecisionExport_v0.md` - active saved-decision export note.
- `data/savedDecisionImport_v0.md` - active saved-decision import note.
- `data/decisionToolsQaPolish_v0.md` - active decision-tool QA polish note.

## Prototype, Starter, Preserved, And Supporting Files

These files must be preserved. Some are active prototype files; others are preserved older versions, starter schemas, source probes, or supporting import outputs.

- `players.json` - older root player source used by legacy browser fallback generation.
- `playersData.js` - older browser fallback generated from root `players.json`.
- `fantasyRules.json` - active Week 5 draft rules, not official.
- `fantasyRulesData.js` - browser-ready copy of root draft rules.
- `data/fantasyRules.json` - starter placeholder for future official rules, status `not_imported`.
- `data/rosters.json` - example-only roster row.
- `data/teamStrength.json` - example-only team-strength row.
- `data/fixtureDifficulty.json` - example-only fixture-difficulty row.
- `data/scorePredictions.json` - starter schema/example score-prediction file.
- `data/teamQuality_v0.json` - preserved pre-PELE team-quality model.
- `data/teamQuality_v1.json` - preserved first PELE-backed team-quality model.
- `data/scorePredictions_v0.json` - preserved pre-PELE score model.
- `data/scorePredictions_v1.json` - preserved first PELE-backed score model.
- `data/playerMatchdayProjections_v0.json` - preserved pre-PELE player matchday projections.
- `data/playerMatchdayProjections_v1.json` - preserved first PELE-backed player matchday projections.
- `data/matchdayRecommendations_v0.json` - preserved earlier recommendation shortlist model.
- `data/matchdayRecommendations_v1.json` - preserved first PELE-backed recommendation shortlist model.
- `data/playerValueModel_v0.json` - preserved original proxy-price value model.
- `data/playerValueModel_v1.json` - active but still prototype because it uses proxy prices.
- `data/playerRecommendationTiers_v0.json` - generated tier model before official fantasy data.
- `data/recommendationQa_v0.json` - preserved recommendation QA audit.
- `data/recommendationQa_v1.json` - preserved first PELE-backed recommendation QA audit.
- `data/recommendationQaReport_v0.md` - preserved recommendation QA report.
- `data/recommendationQaReport_v1.md` - preserved first PELE-backed recommendation QA report.
- `data/scorePredictionQa_v0.json` - preserved score-prediction QA audit.
- `data/scorePredictionQa_v1.json` - preserved first PELE-backed score-prediction QA audit.
- `data/scorePredictionQaReport_v0.md` - preserved score-prediction QA report.
- `data/scorePredictionQaReport_v1.md` - preserved first PELE-backed score-prediction QA report.
- `data/proxyPriceModel_v1.md` - proxy-price model note.
- `data/fantasyFinanceModel_v0.md` - finance-model note before official fantasy prices.
- `data/fullFeatureTestReport_v0.md` - prior browser/static validation report.
- `data/scorePredictionModelRoadmap.md` - score-model roadmap.
- `data/playerPerformanceMergePlan.md` - performance-source merge plan.
- `data/sourceScoutingReport.md` - source scouting report.
- `data/nonBig5LeagueSourceTest.json` - non-Big-5 source feasibility probe.
- `data/nonEnglishLeagueSourceProbe.json` - non-English source probe.
- `data/oneFootballLeagueCoverageProbe.json` - OneFootball coverage probe.
- `data/oneFootballNationalTeamMatchProbe.json` - OneFootball national-team feed probe.
- `data/oneFootballKoreaQatarImportReport.json` - OneFootball Korea/Qatar import report.
- `data/oneFootballKoreaQatarLeagueStats.json` - OneFootball Korea/Qatar league stats.
- `data/oneFootballKoreaQatarMatchPlayerStats.json` - OneFootball Korea/Qatar match-player stats.
- `data/oneFootballKoreaQatarSeasonPlayerStats.json` - OneFootball Korea/Qatar season-player aggregates.
- `data/oneFootballKoreaQatarRosterMatches.json` - OneFootball Korea/Qatar roster matches.
- `data/oneFootballAllImportReport.json` - broad OneFootball import report.
- `data/oneFootballAllLeagueStats.json` - broad OneFootball league stats.
- `data/oneFootballAllSeasonPlayerStats.json` - broad OneFootball season-player aggregates.
- `data/oneFootballAllRosterMatches.json` - broad OneFootball roster matches.
- `data/oneFootballAllRosterMatchPlayerStats.json` - broad OneFootball roster match-player stats.
- `data/oneFootballQualifierImportReport.json` - qualifier import report.
- `data/oneFootballQualifierRosterSeasonStats.json` - qualifier roster season aggregates.
- `data/oneFootballQualifierRosterMatchStats.json` - qualifier roster match stats.
- `data/espnLeagueCoverage.json` - ESPN coverage scan.
- `data/espnLeagueLeaderboards.json` - ESPN leaderboard rows.
- `data/espnRosterLeaderboardMatches.json` - ESPN roster-leaderboard matches.
- `data/espnDetailedMatchPlayerStats.json` - detailed ESPN match-player stats.
- `data/espnDetailedSeasonPlayerStats.json` - detailed ESPN season aggregates.
- `data/espnDetailedRosterPlayerStats.json` - detailed ESPN roster-player stats.
- `data/espnSummaryImportReport.json` - ESPN summary import report.
- `data/espnSummaryMatchedPlayerStats.json` - ESPN summary matched player rows.
- `data/espnSummaryMatchedSeasonStats.json` - ESPN summary season aggregates.
- `data/espnExpandedImportReport.json` - ESPN expanded import report.
- `data/espnExpandedMatchedPlayerStats.json` - ESPN expanded matched player rows.
- `data/espnExpandedMatchedSeasonStats.json` - ESPN expanded season aggregates.
- `data/statbunkerBig5Fantasy.json` - StatBunker fantasy-style supporting source rows.
- `data/worldCupLeagueCoverageMap.json` - league coverage and fallback map.
- `data/sourceManifest.json` - Week 6 source registry.
- `data/dataSources.md` - source notes.
- `data/dataQualityReport.md` - current data-quality report.

## Browser-Ready Files

Current browser-ready application and data files:

- `index.html` - main fantasy helper page.
- `world-cup.html` - World Cup tournament page.
- `style.css` - shared site styles.
- `script.js` - main fantasy helper application logic.
- `worldCupPage.js` - World Cup tournament page renderer.
- `worldCupData.js` - browser-ready tournament structure and fixture data.
- `financePlayersData.js` - browser-ready active player recommendation and finance data.
- `matchdayProjectionsData.js` - browser-ready active matchday projection data.
- `scorePredictionsData.js` - browser-ready active score-prediction data.
- `playersData.js` - browser-ready older player fallback.
- `fantasyRulesData.js` - browser-ready active draft rules.
- `favicon.svg` - browser asset.

Script load order in `index.html`:

1. `financePlayersData.js`
2. `matchdayProjectionsData.js`
3. `scorePredictionsData.js`
4. `playersData.js`
5. `fantasyRulesData.js`
6. `script.js`

Script load order in `world-cup.html`:

1. `worldCupData.js`
2. `worldCupPage.js`

## Scripts That Generate Data Outputs

- `scripts/importOfficialFantasyPlayers.mjs`
  - Reads `data/imports/officialFantasyPlayers.csv` by default.
  - Writes `data/officialFantasyPlayers_v0.json` when official input exists.
  - Writes `data/officialFantasyImportReport_v0.json`.

- `scripts/importOfficialSquads.mjs`
  - Reads `data/imports/officialSquads.csv` by default.
  - Writes `data/officialSquads_v0.json` when official input exists.
  - Writes `data/officialSquadsImportReport_v0.json`.

- `scripts/importOfficialFantasyRules.mjs`
  - Reads `data/imports/officialFantasyRules.json` by default.
  - Writes `data/officialFantasyRules_v0.json` when official input exists.
  - Writes `data/officialFantasyRulesImportReport_v0.json`.

- `scripts/validateOfficialDataReadiness.mjs`
  - Reads current player, value, finance, rules, and import-report files.
  - Writes `data/officialDataReadiness_v0.json`.

- `scripts/step65PeleIntegration.mjs`
  - Downloads/parses PELE Datawrapper CSV inputs.
  - Writes `data/peleRatings_v1.json`.
  - Writes PELE CSV snapshots in `data/`.
  - Writes or preserves `data/teamQuality.json` and `data/teamQuality_v0.json`.
  - Writes `data/scorePredictions_v1.json`, `data/scorePredictionQa_v1.json`, `data/scorePredictionQaReport_v1.md`.
  - Writes `data/playerMatchdayProjections_v1.json`.
  - Writes `data/matchdayRecommendations_v1.json`.
  - Writes `data/recommendationQa_v1.json`, `data/recommendationQaReport_v1.md`.
  - Writes `scorePredictionsData.js` and `matchdayProjectionsData.js`.

- `scripts/step66PeleForwardRecalibration.mjs`
  - Downloads/parses PELE Datawrapper CSV inputs.
  - Writes `data/peleRatings_v1.json`.
  - Writes PELE CSV snapshots in `data/`.
  - Writes or preserves `data/teamQuality.json`, `data/teamQuality_v0.json`, and `data/teamQuality_v1.json`.
  - Updates `data/teams.json` with PELE-forward fields.
  - Writes `data/scorePredictions_v2.json`, `data/scorePredictionQa_v2.json`, `data/scorePredictionQaReport_v2.md`.
  - Writes `data/playerMatchdayProjections_v2.json`.
  - Writes `data/matchdayRecommendations_v2.json`.
  - Writes `data/recommendationQa_v2.json`, `data/recommendationQaReport_v2.md`.
  - Writes `scorePredictionsData.js` and `matchdayProjectionsData.js`.

- `applyCountryMappings.js`
  - Reads root `players.json` and `countryMappings.json`.
  - Writes root `players.json`.

- `addEuroScoring.js`
  - Reads root `players.json` and local FPL-Core-Insights files.
  - Writes root `players.json`.

No current generator script was found in `scripts/` for `financePlayersData.js`, `playersData.js`, `fantasyRulesData.js`, or `worldCupData.js`. They are browser-ready outputs or static data files and should not be hand-edited during official-data import unless a regeneration path is defined.

## Files Depending On Proxy Prices

These files currently depend directly on proxy prices, proxy-price status, or price-is-proxy fields:

- `data/playerValueModel_v0.json`
- `data/playerValueModel_v1.json`
- `data/playerFinanceMetrics_v0.json`
- `financePlayersData.js`
- `script.js`
- `data/proxyPriceModel_v1.md`
- `data/squadPortfolioAnalytics_v0.md`
- `data/recommendationTrustModel_v0.md`
- `data/recommendationQa_v0.json`
- `data/recommendationQa_v1.json`
- `data/recommendationQa_v2.json`
- `data/recommendationQaReport_v0.md`
- `data/recommendationQaReport_v1.md`
- `data/recommendationQaReport_v2.md`
- `data/officialDataReadiness_v0.json`
- `data/officialDataReadiness_v0.md`
- `data/officialFantasyImportSchema_v0.json`
- `data/dataQualityReport.md`
- `data/dataSources.md`
- `README.md`
- `SITE_FEATURES.md`
- `OFFICIAL_DATA_NEXT_STEPS.md`
- `WEEK6_RECOMMENDATION_ENGINE_PLAN.md`
- `World_Cup_Fantasy_Official_Data_Model_Roadmap.md`
- `AGENTS.md`
- `index.html`

Operational impact: official prices must not replace these fields until official fantasy player import, official rules import, and readiness validation pass. Keep proxy fields as audit fields after official prices are imported.

## Files Depending On Draft Rules

These files currently depend on draft or starter rule data:

- `fantasyRules.json` - active Week 5 draft rules.
- `fantasyRulesData.js` - browser-ready active draft rules.
- `script.js` - Team Builder, captain, validation, export metadata, and warnings read `window.FANTASY_RULES_DATA`.
- `index.html` - loads `fantasyRulesData.js`.
- `rulesSources.md` - source notes for draft rules.
- `data/fantasyRules.json` - future official-rule placeholder, not active.
- `data/officialFantasyRulesImportReport_v0.json` - awaiting official rules.
- `data/officialFantasyRulesImportPipeline_v0.md` - official rules import plan.
- `data/officialFantasyImportSchema_v0.json` - official rules contract.
- `data/officialDataReadiness_v0.json` - rules blocker snapshot.
- `data/officialDataReadiness_v0.md` - rules blocker notes.
- `data/dataQualityReport.md` - official rules blocker notes.
- `data/dataSources.md` - draft and future official source notes.
- `README.md`
- `SITE_FEATURES.md`
- `OFFICIAL_DATA_NEXT_STEPS.md`
- `WEEK6_RECOMMENDATION_ENGINE_PLAN.md`
- `World_Cup_Fantasy_Official_Data_Model_Roadmap.md`
- `AGENTS.md`
- `WEEK6_DATA_PLAN.md`

Operational impact: draft rules must remain visibly non-official. Official rules must be imported into `data/officialFantasyRules_v0.json`, reviewed via `data/officialFantasyRulesImportReport_v0.json`, then promoted and regenerated only after readiness criteria are met.

## Files Depending On Current Prototype Player IDs

Current browser player identity uses `player.id`; data-engine identity uses `player_id`. These are current prototype/internal IDs, not official fantasy player IDs.

Files that depend on those IDs:

- `data/players.json`
- `data/playerRecommendationInputs_v0.json`
- `data/playerMinutesModel_v0.json`
- `data/playerValueModel_v0.json`
- `data/playerValueModel_v1.json`
- `data/playerFinanceMetrics_v0.json`
- `data/playerPerformance.json`
- `data/playerNationalTeamPerformance.json`
- `data/playerMatchdayProjections_v0.json`
- `data/playerMatchdayProjections_v1.json`
- `data/playerMatchdayProjections_v2.json`
- `data/matchdayRecommendations_v0.json`
- `data/matchdayRecommendations_v1.json`
- `data/matchdayRecommendations_v2.json`
- `data/recommendationQa_v0.json`
- `data/recommendationQa_v1.json`
- `data/recommendationQa_v2.json`
- `financePlayersData.js`
- `matchdayProjectionsData.js`
- `playersData.js`
- `script.js`
- `data/teamExportModel_v1.md`
- `data/teamImportModel_v0.md`
- `data/userSquadSelection_v0.md`
- `data/savedDecisionImport_v0.md`
- `data/savedSquadDecisionMode_v0.md`
- `data/savedSquadMatchdayTimeline_v0.md`
- `data/matchdayDecisionCenter_v0.md`
- `README.md`
- `SITE_FEATURES.md`
- `OFFICIAL_DATA_NEXT_STEPS.md`
- `World_Cup_Fantasy_Official_Data_Model_Roadmap.md`

Operational impact: official import must create and freeze a player identity map before any old export/import or Team Builder state can be trusted against official fantasy IDs.

## Files To Regenerate After Official Fantasy Data Is Imported

Run import and readiness files first:

- `data/officialSquads_v0.json`
- `data/officialSquadsImportReport_v0.json`
- `data/officialFantasyPlayers_v0.json`
- `data/officialFantasyImportReport_v0.json`
- `data/officialFantasyRules_v0.json`
- `data/officialFantasyRulesImportReport_v0.json`
- `data/officialDataReadiness_v0.json`

Create or update identity and review artifacts before model reruns:

- `data/mappings/playerIdentityMap_v1.csv`
- `data/review/playerIdentityReviewQueue_v1.csv`
- `data/playerClubContext_v1.csv`
- `data/playerQualifierUsage_v1.csv`
- `data/playerDataCoverageReport_v1.json`

Only after readiness returns `ready_for_official_model_rerun`, regenerate versioned official-data model files:

- `data/playerValueModel_v2.json`
- `data/playerFinanceMetrics_v1.json`
- `data/playerRecommendationInputs_v1.json`
- `data/playerMinutesModel_v1.json`
- `data/scorePredictions_v3.json` if official squads, injuries, or team context materially change score inputs.
- `data/playerMatchdayProjections_v3.json`
- `data/matchdayRecommendations_v3.json`
- `data/recommendationQa_v3.json`
- `data/recommendationQaReport_v3.md`

Regenerate browser-ready files after model outputs and rules are reviewed:

- `playersData.js` if active player IDs, statuses, or identity fields change.
- `financePlayersData.js`
- `fantasyRulesData.js`
- `scorePredictionsData.js` if score predictions are regenerated.
- `matchdayProjectionsData.js`
- `worldCupData.js` if official fixture/deadline/tournament shell data changes.

Update documentation after import and validation:

- `README.md`
- `SITE_FEATURES.md`
- `OFFICIAL_DATA_NEXT_STEPS.md`
- `WEEK6_RECOMMENDATION_ENGINE_PLAN.md`
- `data/README.md`
- `data/dataSources.md`
- `data/dataQualityReport.md`
- `data/sourceManifest.json`
- `data/officialDataReadiness_v0.md`

## Existing Official Import Templates And Reports

Templates present in `data/imports/`:

- `data/imports/officialFantasyPlayers_TEMPLATE.csv`
- `data/imports/officialSquads_TEMPLATE.csv`
- `data/imports/officialFantasyRules_TEMPLATE.json`
- `data/imports/README.md`

Required official input files still missing:

- `data/imports/officialFantasyPlayers.csv`
- `data/imports/officialSquads.csv`
- `data/imports/officialFantasyRules.json`

Current reports:

- `data/officialFantasyImportReport_v0.json`: `awaiting_official_input`
- `data/officialSquadsImportReport_v0.json`: `awaiting_official_squads_input`
- `data/officialFantasyRulesImportReport_v0.json`: `awaiting_official_rules_input`
- `data/officialDataReadiness_v0.json`: `blocked_waiting_for_official_fantasy_data`

## Missing Before Official Import Can Proceed

- Official fantasy player list with `official_fantasy_player_id`, `name`, `country`, `team_id`, `official_fantasy_position`, `official_price`, `selectable_status`, `source_url`, and `source_checked`.
- Official final squad file with `name`, `country`, `team_id`, `roster_status`, `source_url`, and `source_checked`.
- Official rules file with squad, budget, position, formation, country-limit, captain, substitution, transfer, booster, scoring, deadline, source ID, and checked-date fields.
- Source manifest entries for official fantasy rules, official fantasy player data, final squads, deadlines, and any supporting enrichment sources actually used.
- Player identity map between official fantasy IDs and current internal `player_id` values.
- Manual review queue for unmatched, duplicate, conflicting, or missing official fields.
- Regeneration scripts or documented commands for official-price finance data and browser-ready files that currently have no checked-in generator.

## Next Safe Commands

Use these commands only after the corresponding official input files exist:

```bash
node scripts/importOfficialSquads.mjs
node scripts/importOfficialFantasyPlayers.mjs
node scripts/importOfficialFantasyRules.mjs
node scripts/validateOfficialDataReadiness.mjs
```

Stop at the gate unless readiness returns:

```text
ready_for_official_model_rerun
```
