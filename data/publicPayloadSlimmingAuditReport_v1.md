# Public Payload Slimming Audit v1

Generated: 2026-07-18T13:30:00.000Z

Status: **pass**

| File | Global | Loaded by | Before | After | Savings | Rows | Active | Historical | Decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| fantasyPoolRecommendationsData.js | FANTASY_POOL_RECOMMENDATIONS_DATA | index.html | 2508699 | 1933970 | 574729 | 675 | 175 | 500 | slimmed |
| fantasyPoolMatchdayProjectionsData.js | FANTASY_POOL_MATCHDAY_PROJECTIONS_DATA | index.html | 4641345 | 3597075 | 1044270 | 1659 | 134 | 1525 | slimmed |
| fantasyPoolScorePredictionsData.js | FANTASY_POOL_SCORE_PREDICTIONS_DATA | index.html | 1846419 | 343711 | 1502708 | 104 | 2 | 102 | slimmed |
| teamBuilderFinalRoundArtifactData.js | TEAM_BUILDER_FINAL_ROUND_ARTIFACT_DATA | index.html | 41340 | 27526 | 13814 | 15 | 15 | 0 | slimmed |
| fantasyPoolOfficialDataStatusData.js | FANTASY_POOL_OFFICIAL_DATA_STATUS | index.html | 798676 | 798676 | 0 | 1489 | 1489 | 0 | unchanged |
| liveMatchdayStatusData.js | LIVE_MATCHDAY_STATUS_DATA | index.html, world-cup.html | 220263 | 220263 | 0 | 104 | 104 | 0 | unchanged |
| livePlayerStatusData.js | LIVE_PLAYER_STATUS_DATA | index.html | 985154 | 985154 | 0 | 1489 | 1489 | 0 | unchanged |
| knockoutBracketPredictionData.js | KNOCKOUT_BRACKET_PREDICTION_DATA | index.html | 58083 | 58083 | 0 | 32 | 32 | 0 | unchanged |
| worldCupData.js | WORLD_CUP_DATA | world-cup.html | 42069 | 42069 | 0 | 72 | 72 | 0 | unchanged |
| finalRoundFixtureAuthorityData.js | FINAL_ROUND_FIXTURE_AUTHORITY_DATA | index.html, world-cup.html | 3947 | 3947 | 0 | 2 | 2 | 0 | unchanged |

## Risky Or Unchanged

- liveMatchdayStatusData.js: Used by multiple live score and fixture validators.
- livePlayerStatusData.js: Used as status overlay data.
- knockoutBracketPredictionData.js: World Cup bracket rendering uses nested match/team structures.
- worldCupData.js: World Cup page uses groups, fixtures, bracket, and sources.

## Internal Diagnostics Preserved

Internal diagnostics remain in source `data/*.json` and report `data/*.md` artifacts. The public wrappers strip only browser-unneeded fields.
