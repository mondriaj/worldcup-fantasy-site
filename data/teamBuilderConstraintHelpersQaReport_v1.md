# Team Builder Constraint Helpers QA v1

Generated: 2026-07-19T01:35:57.145Z

Status: **pass**

## Summary

| Item | Value |
| --- | --- |
| Checks run | 18 |
| Budget | 94.8 / 105 |
| Selected count | 15 |
| Team counts | {"Argentina":8,"Spain":5,"France":1,"England":1} |
| Fixture counts | {"final":13,"third_place":2} |
| Position counts | {"GK":2,"DEF":5,"MID":5,"FWD":3} |
| Captain | Mikel Oyarzabal |
| Vice captain | Leandro Paredes |
| Optimizer behavior changed | no |
| Selected squad changed | no |
| Model outputs changed | no |

## Checks

| ID | Status |
| --- | --- |
| golden_squad_passes_all_constraints | pass |
| over_budget_squad_fails_budget_constraint | pass |
| duplicate_player_squad_fails_duplicate_constraint | pass |
| squad_missing_captain_fails_captain_vice_constraint | pass |
| captain_equal_to_vice_fails_captain_vice_constraint | pass |
| eliminated_player_squad_fails_eligibility_constraint | pass |
| invalid_team_count_squad_fails_team_constraint | pass |
| invalid_position_count_squad_fails_position_constraint | pass |
| locked_player_missing_fails_locked_player_constraint | pass |
| excluded_player_present_fails_excluded_player_constraint | pass |
| squad_size_helper_passes_and_fails | pass |
| starter_bench_structure_passes_golden | pass |
| helper_output_is_deterministic | pass |
| helper_does_not_mutate_inputs | pass |
| malformed_inputs_fail_with_useful_errors | pass |
| browser_helper_summary_matches_node | pass |
| browser_helper_report_matches_node | pass |
| public_behavior_not_changed_by_constraint_helpers | pass |

## Notes

The constraint helpers are pure validators. They do not score, rank, reorder, select, lock, exclude, or mutate Team Builder candidates.
