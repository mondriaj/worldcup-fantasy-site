# Official Fantasy Player Refresh v1

Generated: 2026-06-08

## Summary

The official FIFA fantasy player feed was refreshed after the monitor detected player-pool changes. The live feed now has 1,482 official fantasy players: 1,243 `playing` rows and 239 `transferred` rows.

One new selectable player was imported:

| Official ID | Player | Country | Position | Price | Status | Identity outcome |
| --- | --- | --- | --- | --- | --- | --- |
| 2072 | Assan Ouédraogo | Germany | MID | 4.5 | playing | `new_player_created`; staged as `thin_profile` |

The identity review queue remains empty. The new player is included in the current official fantasy-pool model path and browser layer with 3 matchday projection rows and 1 finance row.

## Monitor Result

- Monitor status: `completed`
- Rerun decision: `official_player_import_rerun_needed`
- New players: 1
- Removed players: 0
- Name changes: 0
- Price changes: 0
- Position changes: 0
- Selectable-status changes: 8
- Country/team changes: 0
- FIFA player ID changes: 0
- Ownership-percent changes: 319
- Squad/rules changes: 0 observed in this refresh scope

## Selectable Status Changes

| Official ID | Player | Country | Previous | Current |
| --- | --- | --- | --- | --- |
| 244 | Marcelo Flores | Canada | playing | transferred |
| 518 | Lennart Karl | Germany | playing | transferred |
| 645 | Ahmed Hasan Maknzi Al Deeshawee | Iraq | transferred | playing |
| 705 | Ibrahim Mohammad Abdallah Sabra | Jordan | playing | transferred |
| 1325 | Leonardo Balerdi | Argentina | playing | transferred |
| 1346 | Wesley Vinícius França Lima | Brazil | playing | transferred |
| 1565 | Ahmed Yahya Mahmood Al Hajjaj | Iraq | playing | transferred |
| 2057 | José Murillo | Panama | playing | transferred |

Ahmed Hasan Maknzi Al Deeshawee and Assan Ouédraogo are both included in the refreshed selectable pool with current model coverage: 3 projection rows and 1 finance row each. The seven players moved to `transferred` are blocked from the selectable model path.

## Files Refreshed

- Official feed import CSVs: `data/imports/officialFantasyPlayers.csv`, `data/imports/officialSquads.csv`
- Official source artifacts: `data/officialFantasyPlayers_v0.json`, `data/officialFantasyImportReport_v0.json`, `data/officialSquads_v0.json`, `data/officialSquadsImportReport_v0.json`
- Identity artifacts: `data/mappings/playerIdentityMap_v1.csv`, `data/review/playerIdentityReviewQueue_v1.csv`, `data/playerIdentityMatchReport_v1.md`
- Model inputs and coverage: `data/playerRecommendationInputs_v1.json`, `data/playerMinutesModel_fantasyPool_v0.json`, `data/playerMatchdayProjections_fantasyPool_v3.json`, `data/playerFinanceMetrics_fantasyPool_v1.json`, `data/playerValueModel_fantasyPool_v2.json`
- Browser bundles: `fantasyPoolOfficialDataStatusData.js`, `fantasyPoolMatchdayProjectionsData.js`, `fantasyPoolFinanceMetricsData.js`, `fantasyPoolRecommendationsData.js`
- Validation reports: `data/officialFantasyPositionAudit_v1.md`, `data/teamBuilderDataCoverage_v1.json`, `data/teamBuilderDataCoverageReport_v1.md`, `data/teamBuilderDataSourceAudit_v1.md`

## Rerun Scope Decision

Reran official player import, identity matching, official squad import, model inputs, minutes, matchday projections, active fantasy-pool finance metrics, and browser-data export.

Did not rerun the recommendation ranking model. There were no price, position, scoring, team, PELE, or score-fixture changes, and all changed/new player IDs have 0 rows in the current `matchdayRecommendations_fantasyPool_v3.json` candidate output. Ownership changes were observed, but ownership-only movement is not a recommendation-model rerun trigger under the current launch checklist. The unchanged recommendation source was still re-exported to the browser bundle so browser data remains internally synced.

## Validation

- `node scripts/validateOfficialFantasyPositions.mjs`: passed
- `node scripts/validateOfficialDataReadiness.mjs`: completed; readiness remains blocked by expected final-squad/official-data promotion blockers
- `node scripts/validateTeamBuilderDataCoverage.mjs`: passed
- Syntax checks passed for `script.js`, `worldCupPage.js`, refreshed builder scripts, and refreshed browser bundles
- Focused browser-data smoke: `source_checked` is `2026-06-08`; official status shows 1,482 player records and 1,243 selectable rows

## Browser QA

- `scripts/runPublicPreviewBrowserQa.mjs` against `http://127.0.0.1:8771`: 5 index viewports, 5 World Cup viewports, fallback test passed; 0 console errors, 0 console warnings, no overflow, no profile failures, no warning failures. The 6 failed requests were headless Google Analytics collection aborts, not local asset failures.
- `scripts/runLaunchBrowserQa.mjs http://127.0.0.1:8771`: `index.html` desktop and mobile loaded with no stale public copy, no console messages, no page errors, no field overlaps, and Team Builder built a 15-player squad with 11 starter cards. `world-cup.html` loaded successfully on desktop.

## Remaining Blockers

- Official fantasy pool is still not final-squad-backed.
- Official rules still carry manual-review warnings.
- `officialDataReadiness_v0.json` remains `blocked_waiting_for_official_fantasy_data`.
- 239 transferred rows remain in squad review status and are excluded from selectable-player modeling.
