# Team Builder Golden Final Round QA v1

Generated: 2026-07-18T16:10:16.425Z

Status: **pass**

## Protected Golden Values

| Metric | Value |
| --- | --- |
| Budget | 94.8 / 105 |
| Captain | Mikel Oyarzabal |
| Vice captain | Leandro Paredes |
| Team counts | {"Argentina":8,"Spain":5,"France":1,"England":1} |
| Fixture counts | {"final":13,"third_place":2} |
| Raw projected points | 59.552 |
| Optionality score | 5.291 |
| Composite score | 1014.93 |
| Selected squad | Emiliano Martínez, Unai Simón, Nicolás Tagliafico, Nahuel Molina, Lisandro Martínez, Cristian Romero, Pau Cubarsí, Leandro Paredes, Alexis Mac Allister, Enzo Fernández, Álex Baena, Fabián Ruiz, Kylian Mbappé, Harry Kane, Mikel Oyarzabal |

## Checks

| Check | Status |
| --- | --- |
| golden_file_has_required_keys | pass |
| active_stage_matches | pass |
| source_artifact_path_matches_manifest | pass |
| source_browser_wrapper_path_matches_manifest | pass |
| model_version_matches | pass |
| budget_used_matches | pass |
| budget_limit_matches | pass |
| team_counts_match | pass |
| fixture_counts_match | pass |
| captain_matches | pass |
| vice_captain_matches | pass |
| raw_projected_points_match | pass |
| optionality_score_matches | pass |
| composite_score_matches | pass |
| selected_player_list_matches | pass |
| selected_player_ids_match | pass |
| starters_list_matches | pass |
| bench_list_matches | pass |
| eligible_teams_match_fixture_authority | pass |
| no_eliminated_players_appear | pass |
| public_wrapper_artifact_matches_source_artifact | pass |
| public_wrapper_artifact_matches_golden | pass |
| browser_equivalence_validator_available | pass |
| browser_equivalence_output_matches_golden_when_present | pass |

## Override Instruction

If this failure is intentional after a model change, regenerate the golden file and explain the model change in a separate commit.
