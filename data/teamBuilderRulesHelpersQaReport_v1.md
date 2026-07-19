# Team Builder Rules Helpers QA v1

Generated: 2026-07-19T02:24:37.920Z

Status: **pass**

## Summary

| Item | Value |
| --- | --- |
| Active stage | finalRound |
| Rules source | current-implementation-backed |
| Budget limit | 105 |
| Budget limit source | artifact_constraints |
| Country/team cap | 8 |
| Country/team cap source | artifact_constraints |
| Squad size | 15 |
| Starter / bench | 11 / 4 |
| Position requirements | {"GK":2,"DEF":5,"MID":5,"FWD":3} |
| Active formation | 4-3-3 |
| Starter requirements | {"GK":1,"DEF":4,"MID":3,"FWD":3} |
| Captain/vice rule source | official_rules_data_and_current_validator_contract |
| Lock/removal rule source | current_browser_state_and_official_manual_check_caveat |
| Official source backed | yes |
| Current implementation backed | yes |
| Selected squad changed | no |
| Optimizer behavior changed | no |
| Model outputs changed | no |

## Checks

| ID | Status |
| --- | --- |
| final_round_budget_limit_equals_105 | pass |
| golden_squad_budget_used_remains_94_8 | pass |
| golden_squad_passes_squad_size_rules | pass |
| golden_squad_passes_starter_bench_rules | pass |
| golden_squad_passes_position_rules | pass |
| golden_squad_passes_captain_vice_rules | pass |
| team_country_limit_matches_current_implementation | pass |
| formation_rules_include_active_4_3_3 | pass |
| malformed_rules_config_fails_with_useful_error | pass |
| explicit_bad_normalized_config_fails_with_useful_errors | pass |
| helper_output_is_deterministic | pass |
| helpers_do_not_mutate_inputs | pass |
| rule_source_classification_is_present | pass |
| browser_rules_helper_matches_module | pass |
| lock_removal_rules_are_manual_check_guardrails | pass |

## Notes

The rules helpers centralize current Team Builder rule constants and derivation only. They do not score, rank, reorder, select, lock, exclude, mutate candidates, rebuild artifacts, or claim live FIFA lock/deadline state is verified.
