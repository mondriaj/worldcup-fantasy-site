# Data Model Elegance Audit v1

Generated: 2026-07-18T12:16:55.341Z

Status: **pass**

## Active File Schema Summary

- `players.json`: 100 rows, 409483 bytes, keys id, name, country, club, position, price, attack_score, defense_score, risk_score, team_elo, short_reason, data_note
- `fantasyRules.json`: 4 rows, 18052 bytes, keys top-level only
- `data/finalRoundFixtureAuthority_v1.json`: 2 rows, 5660 bytes, keys official_bracket_slot, bracket_match_number, bracket_slot_id, fixture_id, source_fixture_id, source_fixture_id_role, round, fantasy_matchday_id, stage, classification, status, public_label
- `data/teamBuilderFinalRoundArtifact_v1.json`: 15 rows, 57668 bytes, keys official_fantasy_player_id, name, country, position, price, opponent, fixture_stage, projectedPoints, start_probability, captainScore, lineupEvidenceType, thirdPlaceRisk
- `data/teamBuilderQa_finalRound_v1.json`: 15 rows, 38604 bytes, keys official_fantasy_player_id, name, country, position, price, opponent, fixture_stage, projectedPoints, start_probability, captainScore, lineupEvidenceType, thirdPlaceRisk
- `data/finalRoundBuilderBrowserEquivalenceQa_v1.json`: 0 rows, 3606 bytes, keys top-level only
- `data/fantasyPoolRecommendations_finalRound_v1.json`: 175 rows, 738192 bytes, keys player_matchday_projection_id, internal_player_id, official_fantasy_player_id, name, display_name, country, team_id, official_team_id, official_fantasy_position, position, official_price, price
- `data/fantasyPoolMatchdayProjections_finalRound_v1.json`: 134 rows, 427892 bytes, keys player_matchday_projection_id, internal_player_id, official_fantasy_player_id, name, display_name, country, team_id, official_team_id, official_fantasy_position, position, official_price, price
- `data/scorePredictions_fantasyPool_finalRound_v1.json`: 2 rows, 8568 bytes, keys prediction_id, match_id, fixture_id, match_number, matchday, fantasy_matchday_id, stage, group, date, eastern_datetime_label, fixture_authority_status, public_label
- `data/playerRoleModel_finalRound_v1.json`: 134 rows, 350394 bytes, keys official_fantasy_player_id, internal_player_id, name, display_name, country, team_id, official_team_id, official_fantasy_position, official_price, selectable_status, fixture_id, match_id
- `data/finalRoundCorePickLineupEvidenceQa_v1.json`: 0 rows, 372 bytes, keys top-level only
- `data/finalRoundThinProfilePlayerAudit_v1.json`: 2 rows, 3323 bytes, keys official_fantasy_player_id, name, country, team_id, team_status, official_fantasy_position, official_price, selectable_status, identity_status, internal_player_id, mapping_confidence, metadata_complete
- `data/finalRoundEligiblePlayersQa_v1.json`: 21 rows, 24062 bytes, keys id, status, details
- `data/finalRoundReleaseQa_v1.json`: 9 rows, 1224 bytes, keys id, status
- `data/knockoutBracketPrediction_v1.json`: 6 rows, 81433 bytes, keys round, label, matchIds
- `data/knockoutScorePredictor_v1.json`: 16 rows, 3821093 bytes, keys prediction_id, match_id, fixture_id, match_number, matchday, fantasy_matchday_id, stage, path_status, bracket_path, date, home_team_id, home_team
- `data/liveMatchdayStatus_v1.json`: 104 rows, 220064 bytes, keys round_id, round_status, round_stage, source_fixture_id, source_fixture_order, resolved_local_fixture_key, local_fixture_id, match_id, local_match_number, match_number, mapping_status, mapping_orientation
- `data/worldCupFixturesPageLiveScoresQa_v1.json`: 24 rows, 13399 bytes, keys match_number, fixture, round_id, expected_score_text, visible, reversed
- `data/matchEnvironmentLiveScoresQa_v1.json`: 24 rows, 11609 bytes, keys match_number, fixture_id, fixture, round_id, score, supported, reversed

## Public Wrapper Summary

- `playersData.js`: 409591 bytes, globals PLAYERS_DATA
- `fantasyRulesData.js`: 18221 bytes, globals FANTASY_RULES_DATA
- `fantasyPoolRecommendationsData.js`: 2508699 bytes, globals FANTASY_POOL_RECOMMENDATIONS_DATA, FANTASY_POOL_RECOMMENDATION_CANDIDATES, FANTASY_POOL_RECOMMENDATIONS_SUMMARY
- `fantasyPoolMatchdayProjectionsData.js`: 4641345 bytes, globals FANTASY_POOL_MATCHDAY_PROJECTIONS_DATA, FANTASY_POOL_PLAYER_MATCHDAY_PROJECTIONS, FANTASY_POOL_MATCHDAY_PROJECTIONS_SUMMARY
- `fantasyPoolFinanceMetricsData.js`: 8282613 bytes, globals FANTASY_POOL_FINANCE_METRICS_DATA, FANTASY_POOL_PLAYER_FINANCE_METRICS, FANTASY_POOL_FINANCE_METRICS_SUMMARY
- `fantasyPoolScorePredictionsData.js`: 1846419 bytes, globals FANTASY_POOL_SCORE_PREDICTIONS_DATA, FANTASY_POOL_SCORE_FIXTURE_PREDICTIONS, FANTASY_POOL_TEAM_FIXTURE_PREDICTIONS, FANTASY_POOL_SCORE_PREDICTIONS_SUMMARY
- `knockoutBracketPredictionData.js`: 58083 bytes, globals KNOCKOUT_BRACKET_PREDICTION_DATA
- `fantasyPoolOfficialDataStatusData.js`: 798676 bytes, globals FANTASY_POOL_OFFICIAL_DATA_STATUS
- `liveMatchdayStatusData.js`: 220263 bytes, globals LIVE_MATCHDAY_STATUS_DATA
- `livePlayerStatusData.js`: 985154 bytes, globals LIVE_PLAYER_STATUS_DATA
- `r16FixtureAuthorityData.js`: 12080 bytes, globals R16_FIXTURE_AUTHORITY_DATA
- `qfFixtureAuthorityData.js`: 7755 bytes, globals QF_FIXTURE_AUTHORITY_DATA
- `sfFixtureAuthorityData.js`: 4568 bytes, globals SF_FIXTURE_AUTHORITY_DATA
- `finalRoundFixtureAuthorityData.js`: 3947 bytes, globals FINAL_ROUND_FIXTURE_AUTHORITY_DATA
- `teamBuilderFinalRoundArtifactData.js`: 41340 bytes, globals TEAM_BUILDER_FINAL_ROUND_ARTIFACT_DATA
- `worldCupData.js`: 42069 bytes, globals WORLD_CUP_DATA
- `r32FixtureAuthorityData.js`: 21759 bytes, globals R32_FIXTURE_AUTHORITY_DATA

## Issues

- **WARN / Public data size:** Some active or adjacent public data files are large enough to deserve compaction or internal/public splitting. Evidence: `{"largeFiles":["data/knockoutScorePredictor_v1.json"]}`.
- **WARN / Schema metadata:** Several active files lack generatedAt/modelVersion style metadata. Evidence: `{"files":["players.json","fantasyRules.json","data/finalRoundFixtureAuthority_v1.json","data/teamBuilderQa_finalRound_v1.json","data/finalRoundBuilderBrowserEquivalenceQa_v1.json","data/finalRoundCorePickLineupEvidenceQa_v1.json","data/finalRoundThinProfilePla`.
- **WARN / Identifier naming:** The codebase uses id, player_id, official_fantasy_player_id, fixture_id, source_fixture_id, and bracket_slot_id. The Final Round artifacts are mostly explicit, but the mixed historical vocabulary slows review.
- **WARN / Public/internal fields:** Generated player rows carry model internals such as strategicCompositeScore, penalties, and diagnostics into public wrappers. That is useful for QA but should be intentionally split for client-facing artifacts.

## Recommended Target Schema

```json
{
  "stage_id": "finalRound",
  "player_identity": {
    "official_fantasy_player_id": "string, required for official fantasy pool rows",
    "model_player_key": "stable internal key when official id is missing"
  },
  "fixture_identity": {
    "bracket_slot_id": "M103/M104-style tournament slot",
    "source_fixture_id": "feed metadata only",
    "fixture_stage": "final | third_place"
  },
  "role_evidence": {
    "role_evidence_type": "explicit_sf_starter | explicit_sf_substitute | points_only | inferred_prior",
    "starter_claim_allowed": "boolean tied only to lineup evidence"
  },
  "public_row": "compact display fields only",
  "internal_diagnostics": "separate artifact keyed by player id and model version"
}
```
