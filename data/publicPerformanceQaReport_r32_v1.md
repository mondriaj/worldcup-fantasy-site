# Public Performance QA R32 v1

Generated: 2026-06-27T17:34:08.896Z

## Verdict

**pass**

## Public Payload

| File | MB | Loaded By Homepage | Public |
| --- | --- | --- | --- |
| fantasyPoolMatchdayProjectionsData.js | 3.236 | yes | yes |
| fantasyPoolFinanceMetricsData.js | 2.354 | yes | yes |
| knockoutScorePredictorData.js | 1.201 | yes | yes |
| livePlayerStatusData.js | 0.895 | yes | yes |
| fantasyPoolRecommendationsData.js | 0.605 | yes | yes |
| fantasyPoolOfficialDataStatusData.js | 0.599 | yes | yes |
| playersData.js | 0.391 | yes | yes |
| fantasyPoolScorePredictionsData.js | 0.32 | yes | yes |
| liveMatchdayStatusData.js | 0.161 | yes | yes |
| fantasyRulesData.js | 0.017 | yes | yes |

Total homepage public data payload: 9.778 MB

## Large Generated Files

| File | MB | Public Browser Data | Needed By Site | Action |
| --- | --- | --- | --- | --- |
| data/fantasyPoolMatchdayProjections_md3_v5.json | 43.104 | no | no | reported_after_compaction |
| data/espnSummaryMatchedPlayerStats.json | 38.008 | no | no | reported_after_compaction |
| data/oneFootballAllRosterMatchPlayerStats.json | 34.076 | no | no | reported_after_compaction |
| data/playerMatchdayProjections_v2.json | 29.703 | no | no | reported_after_compaction |
| data/playerMatchdayProjections_v1.json | 29.693 | no | no | reported_after_compaction |
| data/oneFootballAllSeasonPlayerStats.json | 29.112 | no | no | reported_after_compaction |

## Compaction Actions

- fantasyPoolMatchdayProjectionsData.js: 7.381 MB -> 3.236 MB (compacted_browser_payload)
- fantasyPoolFinanceMetricsData.js: 2.354 MB -> 2.354 MB (compacted_finance_browser_payload)
- data/fantasyPoolMatchdayProjections_md2_v4.json: 6.388 MB -> 6.388 MB (compacted_rows_in_place)
- data/espnDetailedMatchPlayerStats.json: 0.002 MB -> 0.002 MB (replaced_raw_rows_with_compact_summary)

## Follow-Up

- Public browser payload is below the 10 MB per-file warning threshold after compaction.
- No committed JSON/JS/MD generated artifact exceeds 50 MB after compaction.
