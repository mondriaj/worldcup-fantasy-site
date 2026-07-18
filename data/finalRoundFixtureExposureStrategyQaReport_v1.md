# Final Round Fixture Exposure Strategy QA v1

Status: pass

## Summary

| Metric | Value |
| --- | --- |
| selected_count_by_team | {"France":2,"Spain":4,"Argentina":8,"England":1} |
| selected_count_by_fixture | {"third_place":3,"final":12} |
| raw_expected_selected_count_by_team | {"France":1,"Spain":6,"Argentina":8} |
| raw_projected_points_before | 60.681 |
| raw_projected_points_after | 58.689 |
| optionality_score | 6.814 |
| optionality_gain | 5.291 |
| composite_score_gain | 5.027 |
| third_place_recommendation_rows | 72 |
| early_option_rows | 25 |
| third_place_risk_rows | 25 |

## Checks

| Check | Status | Detail |
| --- | --- | --- |
| audit_pass | pass | Fixture exposure strategy audit failed. |
| eligible_candidate_teams | pass | Final Round projection candidate outside fixture authority. |
| recommendation_teams | pass | Final Round recommendation outside fixture authority. |
| team_builder_selected_teams | pass | Team Builder selected squad contains a team outside fixture authority. |
| no_active_eliminated_leakage | pass | Eliminated player/team leaked into an active Final Round row. |
| team_builder_uses_final_round_rows | pass | Team Builder selected squad is missing Final Round fixture_stage metadata. |
| fixture_counts_present | pass | Team Builder QA missing selected count by fixture. |
| optionality_fields_present | pass | Team Builder QA missing optionality/composite fields. |
| raw_comparison_present | pass | Team Builder QA missing raw expected-points comparison. |
| early_fixture_exposure_or_explanation | pass | Balanced Squad has 0 earlier-fixture players without explanation. |
| france_england_not_both_zero | pass | France and England both have 0 selected players. |
| third_place_recommendations_present | pass | Third Place players have no recommendation exposure. |
| early_option_surface_present | pass | Early-game option recommendation surface missing. |
| third_place_risk_surface_present | pass | Third Place risk recommendation surface missing. |
| recommendation_tags_present | pass | Third Place recommendation tags missing Early game option. |
| public_copy_cautious | pass | Public copy does not clearly caution that substitution flexibility depends on FIFA rules/locks. |
