# Team Builder Eligibility Helpers QA v1

Generated: 2026-07-18T22:24:09.237Z

Status: **pass**

## Summary

| Metric | Value |
| --- | --- |
| eligible_teams | ["France","England","Spain","Argentina"] |
| final_fixture_teams | ["Spain","Argentina"] |
| third_place_fixture_teams | ["France","England"] |
| active_projection_rows | 134 |
| official_playing_rows | 414 |
| browser_seed_rows | 409 |
| active_team_builder_candidates | 104 |
| candidate_count_by_team | {"France":26,"Spain":26,"Argentina":26,"England":26} |
| existing_team_builder_qa_candidates | 101 |
| existing_team_builder_qa_candidate_count_by_team | {"Argentina":25,"Spain":26,"France":26,"England":24} |
| downstream_filter_delta | 3 |
| eliminated_candidate_count | 0 |
| candidates_missing_active_projections | 0 |
| candidates_excluded_due_to_non_eligible_team | 305 |
| historical_fallback_candidates | 0 |

## Checks

| Check | Status |
| --- | --- |
| eligible_teams_equal_fixture_authority_teams | pass |
| final_fixture_teams_are_spain_argentina | pass |
| third_place_fixture_teams_are_france_england | pass |
| brazil_colombia_not_eligible | pass |
| blocked_eliminated_player_names_not_active_candidates | pass |
| golden_squad_players_all_pass_eligibility | pass |
| every_team_builder_candidate_has_active_final_round_projection | pass |
| no_candidate_admitted_only_through_historical_projection_fallback | pass |
| eligible_candidate_pool_covers_existing_team_builder_qa | pass |
| assert_no_eliminated_active_candidates_passes_for_candidates | pass |
| assert_no_eliminated_active_candidates_rejects_blocked_candidate | pass |
| helper_output_is_deterministic | pass |
| helpers_do_not_mutate_inputs | pass |
| malformed_fixture_authority_fails_with_useful_error | pass |
| browser_wrapper_matches_module_eligibility | pass |
