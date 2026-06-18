# Active MD2 Data Flow QA Report

Generated: 2026-06-18T11:42:24.728Z
Status: **PASS**
Active version: `20260618-md2-active-path`

## Summary

- Failures: 0
- Warnings: 0
- Checks: 14

## A. Static Source Sync

- players.json rows: 100
- playersData.js rows: 100
- players sync: pass
- fantasyRules sync: pass

## B. Active Fantasy Identity

- active official universe field: `official_position_records`
- active official fantasy players: 1488
- missing official fantasy player IDs: 0
- duplicate official fantasy player IDs: 0
- selectable official records: 1245
- selectable by position: GK 145, DEF 410, MID 421, FWD 269
- recommendation identity coverage: 500 / 500 resolved
- projection identity coverage: 3699 / 3699 resolved
- finance identity coverage: 1233 / 1233 resolved
- projection/finance active ID alignment: 0 projection-only, 0 finance-only

## C. Enrichment Coverage

- role: supplemental_enrichment_only
- active fantasy players resolving to playersData.js: 120 / 1488
- active fantasy players not resolving to playersData.js: 1368
- coverage: 8.06%

## D. Public Stale-Path Block

- index.html old scripts absent: pass
- old globals absent from script.js: pass
- stale cache strings absent: pass
- public fallback references absent: pass

## MD2 Gate

- MD2 recommendations: 125
- MD2 recommendation active identity coverage: 125 / 125
- MD2 recommendation projection misses: 0
- MD2 projections: 1233
- MD2 score fixtures: 24
- playersData.js MD2 recommendation enrichment misses: 99
- playersData.js MD2 projection enrichment misses: 1122
- playersData.js finance enrichment misses: 1122

## Checks

- **PASS** `public_stale_path_block`
- **PASS** `players_json_players_data_sync`
- **PASS** `fantasy_rules_json_browser_sync`
- **PASS** `active_browser_globals_loaded`
- **PASS** `active_official_fantasy_identity_universe`
- **PASS** `fantasy_pool_recommendation_identity_coverage`
- **PASS** `fantasy_pool_projection_identity_coverage`
- **PASS** `fantasy_pool_finance_identity_coverage`
- **PASS** `projection_finance_id_system_alignment`
- **PASS** `players_data_enrichment_coverage`
- **PASS** `md2_recommendation_identity_and_projection_coverage`
- **PASS** `md2_score_fixture_coverage`
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
fantasyPoolOfficialDataStatusData.js
liveMatchdayStatusData.js
livePlayerStatusData.js
script.js
```

## Notes

- Old model files are allowed in docs/archive files only; this gate checks `index.html` and public `script.js`.
- Live matchday/player status data is treated as display/support input only.
- `playersData.js` coverage is enrichment-only for fantasyPool model rows. The active public identity universe is `FANTASY_POOL_OFFICIAL_DATA_STATUS.official_position_records`.

