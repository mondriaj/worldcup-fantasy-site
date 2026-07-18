# Final Round Builder Browser Equivalence QA v1

Status: pass

## Checks

| Check | Result |
| --- | --- |
| artifact_loaded_in_browser | pass |
| browser_default_uses_generated_artifact_objective | pass |
| generated_and_browser_selected_players_match | pass |
| selected_count_by_team_matches | pass |
| selected_count_by_fixture_matches | pass |
| captain_matches | pass |
| vice_captain_matches | pass |
| generated_artifact_matches_team_builder_qa | pass |
| candidate_pool_by_team_matches_generated_qa | pass |
| optionality_visible | pass |
| old_globals_absent | pass |
| no_console_or_page_errors | pass |
| golden_selected_squad_matches_generated_artifact | pass |
| golden_selected_squad_matches_browser_visible | pass |

## Generated Artifact

| Metric | Value |
| --- | --- |
| strategy | {"id":"balancedSquad","name":"Recommended Balanced Squad","label":"Recommended Balanced Squad","matchday":"finalRound","formation":"4-3-3"} |
| selected_count_by_team | {"Argentina":8,"Spain":5,"France":1,"England":1} |
| selected_count_by_fixture | {"final":13,"third_place":2} |
| captain | Mikel Oyarzabal |
| viceCaptain | Leandro Paredes |
| raw_projected_points | 59.552 |
| optionality_score | 5.291 |
| composite_score | 1014.93 |
| selected_players | ["Emiliano Martínez","Unai Simón","Nicolás Tagliafico","Nahuel Molina","Lisandro Martínez","Cristian Romero","Pau Cubarsí","Leandro Paredes","Alexis Mac Allister","Enzo Fernández","Álex Baena","Fabián Ruiz","Kylian Mbappé","Harry Kane","Mikel Oyarzabal"] |

## Browser Default

| Metric | Value |
| --- | --- |
| strategy | {"id":"balancedSquad","name":"Recommended Balanced Squad","label":"Recommended Balanced Squad","matchday":"finalRound","formation":"4-3-3"} |
| selected_count_by_team | {"France":1,"England":1,"Spain":5,"Argentina":8} |
| selected_count_by_fixture | {"third_place":2,"final":13} |
| captain | Mikel Oyarzabal |
| viceCaptain | Leandro Paredes |
| optionality_text | Optionality Score 5.3 earlier kickoff flexibility; verify official locks |
| message | Balanced Squad loaded for the Final Round: 11 starters on the field and 4 substitutes below. Projection 59.6; optionality 5.3; squad score 1014.9. |
| selected_players | ["Kylian Mbappé","Harry Kane","Mikel Oyarzabal","Leandro Paredes","Alexis Mac Allister","Enzo Fernández","Nicolás Tagliafico","Nahuel Molina","Lisandro Martínez","Cristian Romero","Emiliano Martínez","Unai Simón","Pau Cubarsí","Álex Baena","Fabián Ruiz"] |
| starters | ["Kylian Mbappé","Harry Kane","Mikel Oyarzabal","Leandro Paredes","Alexis Mac Allister","Enzo Fernández","Nicolás Tagliafico","Nahuel Molina","Lisandro Martínez","Cristian Romero","Emiliano Martínez"] |
| bench | ["Unai Simón","Pau Cubarsí","Álex Baena","Fabián Ruiz"] |
| candidate_count_by_team | {"Argentina":25,"Spain":26,"France":26,"England":24} |

## Golden Comparison

| Metric | Value |
| --- | --- |
| golden_file | data/teamBuilderGoldenFinalRound_v1.json |
| golden_selected_squad | ["Emiliano Martínez","Unai Simón","Nicolás Tagliafico","Nahuel Molina","Lisandro Martínez","Cristian Romero","Pau Cubarsí","Leandro Paredes","Alexis Mac Allister","Enzo Fernández","Álex Baena","Fabián Ruiz","Kylian Mbappé","Harry Kane","Mikel Oyarzabal"] |
| current_artifact_squad | ["Emiliano Martínez","Unai Simón","Nicolás Tagliafico","Nahuel Molina","Lisandro Martínez","Cristian Romero","Pau Cubarsí","Leandro Paredes","Alexis Mac Allister","Enzo Fernández","Álex Baena","Fabián Ruiz","Kylian Mbappé","Harry Kane","Mikel Oyarzabal"] |
| browser_visible_squad | ["Kylian Mbappé","Harry Kane","Mikel Oyarzabal","Leandro Paredes","Alexis Mac Allister","Enzo Fernández","Nicolás Tagliafico","Nahuel Molina","Lisandro Martínez","Cristian Romero","Emiliano Martínez","Unai Simón","Pau Cubarsí","Álex Baena","Fabián Ruiz"] |
| all_three_match | true |

## Diff

| Side | Players |
| --- | --- |
| Only generated | [] |
| Only browser | [] |
