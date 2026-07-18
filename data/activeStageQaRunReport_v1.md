# Active Stage QA Run Report v1

Generated: 2026-07-18T13:04:20.637Z

Status: **pass**

## Summary

| Item | Value |
| --- | --- |
| Active stage | finalRound |
| Checks run | 33 |
| Passed | 33 |
| Failed | 0 |
| Skipped | 0 |
| Required failed | 0 |
| Optional skipped | none |
| Local server | pass (http://127.0.0.1:8772) |

## Checks

| ID | Type | Required | Status | Duration ms | Command |
| --- | --- | --- | --- | --- | --- |
| local_static_server | commandCheck | yes | pass | 0 | python3 -m http.server 8772 |
| manifest_validation | commandCheck | yes | pass | 33 | node scripts/validateActiveStageManifestV1.mjs |
| team_builder_browser_equivalence | commandCheck | yes | pass | 610 | node scripts/validateFinalRoundBuilderBrowserEquivalenceV1.mjs |
| eligible_players | commandCheck | yes | pass | 147 | node scripts/validateFinalRoundEligiblePlayersV1.mjs |
| fixture_exposure_strategy | commandCheck | yes | pass | 35 | node scripts/validateFinalRoundFixtureExposureStrategyV1.mjs |
| team_builder_final_round | commandCheck | yes | pass | 21 | node scripts/validateTeamBuilderFinalRoundV1.mjs |
| core_pick_lineup_evidence | commandCheck | yes | pass | 21 | node scripts/validateFinalRoundCorePickLineupEvidence.mjs |
| active_fantasy_data_flow | commandCheck | yes | pass | 198 | node scripts/validateActiveFantasyDataFlow.mjs |
| live_fixture_mapping | commandCheck | yes | pass | 39 | node scripts/validateLiveFixtureMapping.mjs |
| match_environment_live_scores | commandCheck | yes | pass | 29 | node scripts/validateMatchEnvironmentLiveScores.mjs |
| world_cup_fixtures_page_live_scores | commandCheck | yes | pass | 27 | node scripts/validateWorldCupFixturesPageLiveScores.mjs |
| final_round_fixture_authority | commandCheck | yes | pass | 23 | node scripts/validateFinalRoundFixtureAuthorityV1.mjs |
| bracket_path_integrity | commandCheck | yes | pass | 30 | node scripts/validateBracketPathIntegrityV1.mjs |
| knockout_bracket_prediction | commandCheck | yes | pass | 32 | node scripts/validateKnockoutBracketPredictionV1.mjs |
| public_preview_browser_qa | commandCheck | yes | pass | 8342 | node scripts/runPublicPreviewBrowserQa.mjs |
| git_diff_whitespace | commandCheck | yes | pass | 71 | git diff --check |
| syntax:script.js | syntaxCheck | yes | pass | 21 | node --check script.js |
| syntax:worldCupPage.js | syntaxCheck | yes | pass | 17 | node --check worldCupPage.js |
| syntax:worldCupData.js | syntaxCheck | yes | pass | 16 | node --check worldCupData.js |
| syntax:knockoutBracketPredictionData.js | syntaxCheck | yes | pass | 17 | node --check knockoutBracketPredictionData.js |
| syntax:fantasyPoolRecommendationsData.js | syntaxCheck | yes | pass | 30 | node --check fantasyPoolRecommendationsData.js |
| syntax:fantasyPoolMatchdayProjectionsData.js | syntaxCheck | yes | pass | 43 | node --check fantasyPoolMatchdayProjectionsData.js |
| syntax:fantasyPoolScorePredictionsData.js | syntaxCheck | yes | pass | 28 | node --check fantasyPoolScorePredictionsData.js |
| syntax:fantasyPoolOfficialDataStatusData.js | syntaxCheck | yes | pass | 22 | node --check fantasyPoolOfficialDataStatusData.js |
| syntax:liveMatchdayStatusData.js | syntaxCheck | yes | pass | 18 | node --check liveMatchdayStatusData.js |
| syntax:livePlayerStatusData.js | syntaxCheck | yes | pass | 26 | node --check livePlayerStatusData.js |
| syntax:teamBuilderFinalRoundArtifactData.js | syntaxCheck | yes | pass | 17 | node --check teamBuilderFinalRoundArtifactData.js |
| syntax:scripts/runActiveStageQaFromManifestV1.mjs | syntaxCheck | yes | pass | 16 | node --check scripts/runActiveStageQaFromManifestV1.mjs |
| syntax:scripts/validateActiveStageManifestV1.mjs | syntaxCheck | yes | pass | 16 | node --check scripts/validateActiveStageManifestV1.mjs |
| syntax:scripts/lib/readActiveStageManifest.mjs | syntaxCheck | yes | pass | 16 | node --check scripts/lib/readActiveStageManifest.mjs |
| old_globals_legacy_paths_public_files | searchCheck | yes | pass | 3 | zero_hits_required |
| active_eliminated_player_leakage | searchCheck | yes | pass | 14 | historical_hits_allowed_with_explanation |
| public_refereeing_conspiracy_leakage | searchCheck | yes | pass | 2 | zero_hits_required |

## Output Excerpts

### local_static_server

Status: pass

```
Started local static server.
```

### manifest_validation

Status: pass

No output.

### team_builder_browser_equivalence

Status: pass

No output.

### eligible_players

Status: pass

No output.

### fixture_exposure_strategy

Status: pass

No output.

### team_builder_final_round

Status: pass

No output.

### core_pick_lineup_evidence

Status: pass

No output.

### active_fantasy_data_flow

Status: pass

No output.

### live_fixture_mapping

Status: pass

No output.

### match_environment_live_scores

Status: pass

No output.

### world_cup_fixtures_page_live_scores

Status: pass

No output.

### final_round_fixture_authority

Status: pass

No output.

### bracket_path_integrity

Status: pass

No output.

### knockout_bracket_prediction

Status: pass

No output.

### public_preview_browser_qa

Status: pass

No output.

### git_diff_whitespace

Status: pass

No output.

### syntax:script.js

Status: pass

No output.

### syntax:worldCupPage.js

Status: pass

No output.

### syntax:worldCupData.js

Status: pass

No output.

### syntax:knockoutBracketPredictionData.js

Status: pass

No output.

### syntax:fantasyPoolRecommendationsData.js

Status: pass

No output.

### syntax:fantasyPoolMatchdayProjectionsData.js

Status: pass

No output.

### syntax:fantasyPoolScorePredictionsData.js

Status: pass

No output.

### syntax:fantasyPoolOfficialDataStatusData.js

Status: pass

No output.

### syntax:liveMatchdayStatusData.js

Status: pass

No output.

### syntax:livePlayerStatusData.js

Status: pass

No output.

### syntax:teamBuilderFinalRoundArtifactData.js

Status: pass

No output.

### syntax:scripts/runActiveStageQaFromManifestV1.mjs

Status: pass

No output.

### syntax:scripts/validateActiveStageManifestV1.mjs

Status: pass

No output.

### syntax:scripts/lib/readActiveStageManifest.mjs

Status: pass

No output.

### old_globals_legacy_paths_public_files

Status: pass

Hits: 0. Active leaks: 0.

### active_eliminated_player_leakage

Status: pass

Hits: 5. Active leaks: 0. France, England, Spain, and Argentina active Final Round hits are expected; Brazil/Colombia historical wrapper rows are allowed only outside active finalRound rows and are covered by eligible-player QA.

### public_refereeing_conspiracy_leakage

Status: pass

Hits: 0. Active leaks: 0.
