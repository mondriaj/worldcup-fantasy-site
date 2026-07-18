# Final Round Eligible Players QA v1

Status: pass

## Summary

| Metric | Value |
| --- | --- |
| eligible_teams | ["France","England","Spain","Argentina"] |
| active_projection_rows | 134 |
| active_recommendation_rows | 125 |
| core_pick_rows | 25 |
| captain_watchlist_rows | 25 |
| team_builder_candidate_count_by_team | {"Argentina":25,"Spain":26,"France":26,"England":24} |
| team_builder_selected_count_by_team | {"France":4,"Spain":2,"Argentina":8,"England":1} |
| eliminated_player_candidates | 0 |
| eliminated_player_selected | 0 |
| picks_eliminated_player_count | 0 |
| captain_watchlist_eliminated_player_count | 0 |
| player_profile_active_stage_eliminated_leakage | false |
| source_final_round_projection_bug_hits | 0 |
| source_final_round_recommendation_bug_hits | 0 |
| historical_projection_bug_hits_allowed | 102 |
| historical_recommendation_bug_hits_allowed | 27 |
| finance_bug_hits_not_active_surface | 51 |

## Checks

| Check | Status |
| --- | --- |
| fixture_authority_pass | pass |
| active_projection_rows_eligible | pass |
| active_recommendation_rows_eligible | pass |
| core_picks_eligible | pass |
| captain_watchlist_eligible | pass |
| team_builder_qa_pass | pass |
| team_builder_candidates_eligible | pass |
| team_builder_selected_eligible | pass |
| team_builder_captain_eligible | pass |
| team_builder_vice_eligible | pass |
| player_profile_active_stage_sources_eligible | pass |
| specific_lerma_absent_from_active_surfaces | pass |
| specific_raphinha_absent_from_active_surfaces | pass |
| specific_vinicius_absent_from_active_surfaces | pass |
| script_guard_finalRoundAuthorityLoaded | pass |
| script_guard_activeEligibleTeamHelper | pass |
| script_guard_activePlayerFilterHelper | pass |
| script_guard_finalRoundCountryLimitMapsToFinal | pass |
| script_guard_builderPickerFiltered | pass |
| script_guard_optimizerPoolsFiltered | pass |
| script_guard_lockedPlayersFiltered | pass |

## Known Historical Rows

Historical projection rows for eliminated teams remain in the public wrapper for history views: 102. They are not active Final Round rows.
