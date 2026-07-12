# Knockout Bracket Prediction QA v1

Generated: 2026-07-12T12:43:21.492Z

Status: **PASS**

## Summary

| Metric | Value |
| --- | --- |
| Predicted champion | Argentina |
| Predicted finalists | Spain, Argentina |
| Predicted semifinalists | France, Spain, England, Argentina |
| Decided matches | 28 |
| Correct | 22 |
| Wrong | 6 |
| Pending | 4 |
| Accuracy | 78.6% |
| Flags missing/fallback | 0 |

## Match Counts

| Round | Matches |
| --- | --- |
| r32 | 16 |
| r16 | 8 |
| qf | 4 |
| sf | 2 |
| final | 1 |
| third_place | 1 |

## Checks

| Check | Status | Detail |
| --- | --- | --- |
| r32_fixture_authority_pass | pass | "pass" |
| qf_fixture_authority_pass | pass | "pass" |
| sf_fixture_authority_pass | pass | "pass" |
| browser_data_global_present | pass |  |
| index_loads_browser_data_before_script | pass |  |
| script_reads_active_bracket_prediction_data | pass |  |
| styles_include_visual_bracket | pass |  |
| r32_match_count | pass | 16 |
| r16_match_count | pass | 8 |
| qf_match_count | pass | 4 |
| sf_match_count | pass | 2 |
| final_match_count | pass | 1 |
| third_place_supported_or_absent | pass | 1 |
| summary_predicted_champion_present | pass | "Argentina" |
| summary_predicted_finalists_present | pass | Spain; Argentina |
| summary_predicted_semifinalists_present | pass | France; Spain; England; Argentina |
| france_argentina_not_before_final | pass |  |
| france_argentina_not_r16 | pass |  |
| france_path_feeds_m89 | pass | {"franceSlot":"M77","franceR16":"Paraguay vs France"} |
| argentina_path_feeds_m95 | pass | {"argentinaSlot":"M86","argentinaR16":"Argentina vs Egypt"} |
| predicted_winners_are_participants | pass |  |
| actual_winners_are_actual_participants | pass |  |
| non_final_matches_do_not_show_actual_scores | pass |  |
| final_matches_have_prediction_result | pass |  |
| known_teams_have_flags_or_code_fallback | pass |  |
| qf_rows_match_qf_authority | pass | {"missing_authority_teams":[],"unexpected_qf_teams":[],"pending_qf_slots":[]} |
| qf_matches_marked_final_after_play | pass | [object Object]; [object Object]; [object Object]; [object Object] |
| sf_rows_match_sf_authority | pass | {"missing_authority_teams":[],"unexpected_sf_teams":[],"pending_sf_slots":[]} |
| sf_matches_not_marked_final_before_play | pass | [object Object]; [object Object] |
| knockout_score_predictor_r32_coverage | pass | 16 |
| default_strategy_has_full_tree | pass | "safe: 31" |
