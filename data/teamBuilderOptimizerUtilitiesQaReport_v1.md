# Team Builder Optimizer Utilities QA v1

Generated: 2026-07-19T00:43:18.277Z

Status: **pass**

## Summary

| Item | Value |
| --- | --- |
| Checks run | 16 |
| Budget | 94.8 / 105 |
| Selected count | 15 |
| Team counts | Argentina 8, Spain 5, France 1, England 1 |
| Fixture counts | final 13, third_place 2 |
| Captain | Mikel Oyarzabal |
| Vice captain | Leandro Paredes |
| Optimizer behavior changed | no |
| Script optimizer loop wired | no |

## Checks

| ID | Status |
| --- | --- |
| golden_squad_satisfies_budget_limit | pass |
| golden_squad_budget_used_matches | pass |
| golden_squad_team_counts_match | pass |
| golden_squad_fixture_counts_match | pass |
| golden_squad_position_counts_match | pass |
| golden_squad_captain_vice_valid | pass |
| golden_squad_has_no_eliminated_active_players | pass |
| utility_functions_are_deterministic | pass |
| utility_functions_do_not_mutate_inputs | pass |
| malformed_rows_fail_with_useful_error | pass |
| malformed_budget_fails_with_useful_error | pass |
| helper_output_matches_artifact_summary | pass |
| browser_helper_summary_matches_module | pass |
| browser_helper_constraints_match_module | pass |
| position_normalizer_handles_display_and_code_values | pass |
| summary_counts_match_existing_artifact_counts | pass |

## Notes

These utilities validate the selected squad constraints and artifact summaries only. They do not select, score, rank, reorder, lock, exclude, or mutate Team Builder candidates.
