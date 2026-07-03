# Active Provisional R16 Data Flow QA Report

Generated: 2026-07-03T20:51:27.519Z
Status: **PASS**
Active version: `20260703-r16-provisional`

## Summary

- Failures: 0
- Warnings: 0
- Checks: 15

## A. Static Source Sync

- players.json rows: 100
- playersData.js rows: 100
- players sync: pass
- fantasyRules sync: pass

## B. Active Fantasy Identity

- active official universe field: `official_position_records`
- active official fantasy players: 1489
- missing official fantasy player IDs: 0
- duplicate official fantasy player IDs: 0
- selectable official records: 1240
- selectable by position: GK 145, DEF 408, MID 418, FWD 269
- recommendation identity coverage: 250 / 250 resolved
- projection identity coverage: 1119 / 1119 resolved
- finance identity coverage: 1233 / 1233 resolved
- projection/finance active ID alignment: 0 projection-only, 417 finance-only

## C. Enrichment Coverage

- role: supplemental_enrichment_only
- active fantasy players resolving to playersData.js: 120 / 1489
- active fantasy players not resolving to playersData.js: 1369
- coverage: 8.06%

## D. Public Stale-Path Block

- index.html old scripts absent: pass
- old globals absent from script.js: pass
- stale cache strings absent: pass
- public fallback references absent: pass

## Provisional R16 Gate

- Provisional R16 recommendations: 125
- Provisional R16 recommendation active identity coverage: 125 / 125
- Provisional R16 recommendation projection misses: 0
- Provisional R16 projections: 303
- Provisional R16 score fixtures: 8
- playersData.js Provisional R16 recommendation enrichment misses: 94
- playersData.js Provisional R16 projection enrichment misses: 266
- playersData.js finance enrichment misses: 1122

## Checks

- **PASS** `public_stale_path_block`
- **PASS** `players_json_players_data_sync`
- **PASS** `fantasy_rules_json_browser_sync`
- **PASS** `active_browser_globals_loaded`
- **PASS** `finance_pool_superset_for_active_projection`
- **PASS** `active_official_fantasy_identity_universe`
- **PASS** `fantasy_pool_recommendation_identity_coverage`
- **PASS** `fantasy_pool_projection_identity_coverage`
- **PASS** `fantasy_pool_finance_identity_coverage`
- **PASS** `projection_finance_id_system_alignment`
- **PASS** `players_data_enrichment_coverage`
- **PASS** `active_matchday_recommendation_identity_and_projection_coverage`
- **PASS** `active_matchday_score_fixture_coverage`
- **PASS** `active_numeric_fields_finite`
- **PASS** `team_builder_minimum_data`

## Failures

- None

## Warnings

- None

## Public Script Order

```text
playersData.js
fantasyRulesData.js
fantasyPoolRecommendationsData.js
fantasyPoolMatchdayProjectionsData.js
fantasyPoolFinanceMetricsData.js
fantasyPoolScorePredictionsData.js
knockoutScorePredictorData.js
bracketPoolStrategyData.js
fantasyPoolOfficialDataStatusData.js
liveMatchdayStatusData.js
livePlayerStatusData.js
r16ProvisionalFixtureAuthorityData.js
script.js
```

## Notes

- Old model files are allowed in docs/archive files only; this gate checks `index.html` and public `script.js`.
- Live matchday/player status data is treated as display/support input only.
- `playersData.js` coverage is enrichment-only for fantasyPool model rows. The active public identity universe is `FANTASY_POOL_OFFICIAL_DATA_STATUS.official_position_records`.

