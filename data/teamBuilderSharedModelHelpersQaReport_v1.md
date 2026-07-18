# Team Builder Shared Model Helpers QA v1

Generated: 2026-07-18T21:53:40.905Z

Status: **pass**

## Summary

| Metric | Value |
| --- | --- |
| Active stage | finalRound |
| Artifact | data/teamBuilderFinalRoundArtifact_v1.json |
| Browser helper wrapper | teamBuilderPublicHelpers.js |
| Budget | 94.8 / 105 |
| Captain | Mikel Oyarzabal |
| Vice captain | Leandro Paredes |
| Raw projected | 59.552 |
| Optionality | 5.291 |
| Composite | 1014.93 |

## Checks

| Check | Status |
| --- | --- |
| budget_summary_equals_golden | pass |
| team_counts_equal_golden | pass |
| fixture_counts_equal_golden | pass |
| captain_vice_equal_golden | pass |
| selected_player_names_equal_golden | pass |
| starter_names_equal_golden | pass |
| bench_names_equal_golden | pass |
| raw_projected_equals_golden | pass |
| optionality_equals_golden | pass |
| composite_equals_golden | pass |
| compare_summary_to_golden_passes | pass |
| helper_output_deterministic | pass |
| helper_does_not_mutate_input_artifact | pass |
| malformed_artifact_rejected_with_useful_error | pass |
| browser_wrapper_exposes_shared_helpers | pass |
| browser_wrapper_summary_matches_module_summary | pass |
