# Active R32 Data Flow QA Report

Generated: 2026-06-28T12:32:03.936Z
Status: **PASS**
Active version: `20260628-r32-final`

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
- active official fantasy players: 1489
- missing official fantasy player IDs: 0
- duplicate official fantasy player IDs: 0
- selectable official records: 1240
- selectable by position: GK 145, DEF 408, MID 418, FWD 269
- recommendation identity coverage: 250 / 250 resolved
- projection identity coverage: 4515 / 4515 resolved
- finance identity coverage: 1233 / 1233 resolved
- projection/finance active ID alignment: 0 projection-only, 0 finance-only

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

## R32 Gate

- R32 recommendations: 125
- R32 recommendation active identity coverage: 125 / 125
- R32 recommendation projection misses: 0
- R32 projections: 816
- R32 score fixtures: 16
- playersData.js R32 recommendation enrichment misses: 100
- playersData.js R32 projection enrichment misses: 722
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
script.js
```

## Notes

- Old model files are allowed in docs/archive files only; this gate checks `index.html` and public `script.js`.
- Live matchday/player status data is treated as display/support input only.
- `playersData.js` coverage is enrichment-only for fantasyPool model rows. The active public identity universe is `FANTASY_POOL_OFFICIAL_DATA_STATUS.official_position_records`.

