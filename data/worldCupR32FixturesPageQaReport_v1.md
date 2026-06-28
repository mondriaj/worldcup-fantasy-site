# World Cup R32 Fixtures Page QA v1

Generated: 2026-06-28T12:54:55.870Z

Status: **PASS**

| Check | Status | Detail |
| --- | --- | --- |
| authority_status_pass | pass | "pass" |
| authority_has_16_r32_fixtures | pass | 16 |
| world_cup_data_has_72_group_fixtures | pass | 72 |
| all_r32_bracket_slots_present | pass |  |
| no_duplicate_r32_slots | pass |  |
| no_duplicate_r32_teams | pass |  |
| no_known_r32_tbd_teams | pass |  |
| page_loads_authority_before_renderer | pass | {"r32ScriptIndex":6842,"pageScriptIndex":6918} |
| page_renderer_reads_authority_global | pass |  |
| page_renderer_distinguishes_source_fixture_id | pass |  |
| france_slot_and_r16_path_correct | pass | {"bracket_match_number":77,"bracket_slot_id":"M77","source_fixture_id":"79","source_fixture_order":79,"source_fixture_id_is_bracket_match_number":false,"source_fixture_id_role":"feed_source_id_only_not_bracket_slot","round":"R32","stage":"round_of_32","fixture_id":"fwc2026-m077","status":"scheduled","kickoff":{"source_datetime":"2026-06-30T22:00:00+01:00","eastern_datetime_label":"Jun 30, 2026 · 5:00 PM ET"},"venue":{"name":"Metlife Stadium","city":"East Rutherford, New Jersey"},"team_a":{"team":"France","team_id":"france","code":"FRA","flag":"🇫🇷"},"team_b":{"team":"Sweden","team_id":"sweden","code":"SWE","flag":"🇸🇪"},"winner_advances_to":{"round":"R16","bracket_match_number":89,"bracket_slot_id":"M89","path":"Winner Match 74 v Winner Match 77"},"bracket_quarter":"winner_m97","bracket_half":"winner_m101","final_path":"winner_m104","bracket_path":"Group I winner v third-place team from Group C/D/F/G/H","derived_from":{"mapping_basis":"group_rank_bracket_path","mapping_status":"mapped_by_group_rank_path","group_rank_path":"Group I winner v third-place team from Group C/D/F/G/H","team_a_group_rank":{"group":"I","rank":1,"points":9,"goal_difference":8},"team_b_group_rank":{"group":"F","rank":3,"points":4,"goal_difference":0},"candidate_match_ids":["77"]},"source_confidence":"locked_group_rank_bracket_slot"} |
| argentina_slot_and_r16_path_correct | pass | {"bracket_match_number":86,"bracket_slot_id":"M86","source_fixture_id":"80","source_fixture_order":80,"source_fixture_id_is_bracket_match_number":false,"source_fixture_id_role":"feed_source_id_only_not_bracket_slot","round":"R32","stage":"round_of_32","fixture_id":"fwc2026-m086","status":"scheduled","kickoff":{"source_datetime":"2026-07-03T23:00:00+01:00","eastern_datetime_label":"Jul 3, 2026 · 6:00 PM ET"},"venue":{"name":"Hard Rock Stadium","city":"Miami Gardens, Florida"},"team_a":{"team":"Argentina","team_id":"argentina","code":"ARG","flag":"🇦🇷"},"team_b":{"team":"Cabo Verde","team_id":"cabo-verde","code":"CPV","flag":"🇨🇻"},"winner_advances_to":{"round":"R16","bracket_match_number":95,"bracket_slot_id":"M95","path":"Winner Match 86 v Winner Match 88"},"bracket_quarter":"winner_m100","bracket_half":"winner_m102","final_path":"winner_m104","bracket_path":"Group J winner v Group H runner-up","derived_from":{"mapping_basis":"group_rank_bracket_path","mapping_status":"mapped_by_group_rank_path","group_rank_path":"Group J winner v Group H runner-up","team_a_group_rank":{"group":"J","rank":1,"points":9,"goal_difference":7},"team_b_group_rank":{"group":"H","rank":2,"points":3,"goal_difference":0},"candidate_match_ids":["86"]},"source_confidence":"locked_group_rank_bracket_slot"} |
| france_argentina_not_same_r16 | pass | {"france_r16":89,"argentina_r16":95} |

## R32 Fixtures

| Slot | Source ID | Fixture | Kickoff | Advances To |
| --- | --- | --- | --- | --- |
| M73 | 73 | South Africa vs Canada | Jun 28, 2026 · 3:00 PM ET | M90 |
| M74 | 78 | Germany vs Paraguay | Jun 29, 2026 · 4:30 PM ET | M89 |
| M75 | 75 | Netherlands vs Morocco | Jun 29, 2026 · 9:00 PM ET | M90 |
| M76 | 74 | Brazil vs Japan | Jun 29, 2026 · 1:00 PM ET | M91 |
| M77 | 79 | France vs Sweden | Jun 30, 2026 · 5:00 PM ET | M89 |
| M78 | 77 | Côte d'Ivoire vs Norway | Jun 30, 2026 · 1:00 PM ET | M91 |
| M79 | 82 | Mexico vs Ecuador | Jun 30, 2026 · 9:00 PM ET | M92 |
| M80 | 83 | England vs Congo DR | Jul 1, 2026 · 12:00 PM ET | M92 |
| M81 | 76 | USA vs Bosnia and Herzegovina | Jul 1, 2026 · 8:00 PM ET | M94 |
| M82 | 84 | Belgium vs Senegal | Jul 1, 2026 · 4:00 PM ET | M94 |
| M83 | 85 | Portugal vs Croatia | Jul 2, 2026 · 7:00 PM ET | M93 |
| M84 | 87 | Spain vs Austria | Jul 2, 2026 · 3:00 PM ET | M93 |
| M85 | 88 | Switzerland vs Algeria | Jul 2, 2026 · 11:00 PM ET | M96 |
| M86 | 80 | Argentina vs Cabo Verde | Jul 3, 2026 · 6:00 PM ET | M95 |
| M87 | 86 | Colombia vs Ghana | Jul 3, 2026 · 9:30 PM ET | M96 |
| M88 | 81 | Australia vs Egypt | Jul 3, 2026 · 2:00 PM ET | M95 |
