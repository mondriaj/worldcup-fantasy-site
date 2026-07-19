# Team Builder Artifact Browser Unification Readiness QA v1

Generated: 2026-07-19T01:19:30.918Z

Status: **pass**

## Summary

| Item | Value |
| --- | --- |
| Active stage | finalRound |
| Checks run | 20 |
| Artifact | data/teamBuilderFinalRoundArtifact_v1.json |
| Browser wrapper | teamBuilderFinalRoundArtifactData.js |
| Public helper wrapper | teamBuilderPublicHelpers.js |
| Budget | 94.8 / 105 |
| Captain | Mikel Oyarzabal |
| Vice captain | Leandro Paredes |
| Team counts | {"Argentina":8,"Spain":5,"France":1,"England":1} |
| Fixture counts | {"final":13,"third_place":2} |
| Objective | raw 59.552, optionality 5.291, composite 1014.93 |
| Main optimizer loop ready for extraction | no |
| Public behavior changed | no |
| Model outputs changed | no |

## Checks

| Check | Result | Details |
| --- | --- | --- |
| team_builder_artifact_exists | pass | {"artifactPath":"data/teamBuilderFinalRoundArtifact_v1.json"} |
| team_builder_public_wrapper_exists | pass | {"wrapperPath":"teamBuilderFinalRoundArtifactData.js"} |
| team_builder_public_helpers_wrapper_exists | pass | {"publicHelpersPath":"teamBuilderPublicHelpers.js"} |
| golden_file_exists | pass | {"goldenPath":"data/teamBuilderGoldenFinalRound_v1.json"} |
| browser_equivalence_qa_latest_passes | pass | {"path":"data/finalRoundBuilderBrowserEquivalenceQa_v1.json","status":"pass"} |
| golden_qa_latest_passes | pass | {"path":"data/teamBuilderGoldenFinalRoundQa_v1.json","status":"pass"} |
| shared_model_helpers_qa_latest_passes | pass | {"path":"data/teamBuilderSharedModelHelpersQa_v1.json","status":"pass"} |
| eligibility_helpers_qa_latest_passes | pass | {"path":"data/teamBuilderEligibilityHelpersQa_v1.json","status":"pass"} |
| optimizer_utilities_qa_latest_passes | pass | {"path":"data/teamBuilderOptimizerUtilitiesQa_v1.json","status":"pass"} |
| eligible_players_qa_latest_passes | pass | {"path":"data/finalRoundEligiblePlayersQa_v1.json","status":"pass"} |
| equivalence_matrix_valid | pass | {"schemaVersion":"team_builder_artifact_browser_equivalence_matrix_v1","rows":20} |
| high_risk_duplicated_rows_have_validator_coverage | pass | {"highRiskUncoveredRows":[],"declaredHighRiskUncoveredRows":0} |
| browser_only_and_user_interaction_divergence_documented | pass | {"divergentRows":["role/trust filters","price filters","locks/exclusions"]} |
| unification_audit_has_direct_answers | pass | {"status":"green","directAnswerKeys":["artifact_json_builder","artifact_wrapper_builder","browser_default_path","browser_locks_and_substitutions_path","browser_artifact_bypass_conditions"]} |
| unification_audit_rejects_main_optimizer_extraction_now | pass | {"status":"green","extract_main_optimizer_loop_now":false,"commit_audit_and_readiness_validator":true,"smallest_safe_next_step":"Keep the public default artifact-backed, add the equivalence matrix and readiness validator, and defer deeper extraction until isolated optimizer fixtures cover path search, scoring, tie-breaking, and user-state divergence."} |
| artifact_selected_squad_matches_golden | pass | {"selectedNames":["Emiliano Martínez","Unai Simón","Nicolás Tagliafico","Nahuel Molina","Lisandro Martínez","Cristian Romero","Pau Cubarsí","Leandro Paredes","Alexis Mac Allister","Enzo Fernández","Álex Baena","Fabián Ruiz","Kylian Mbappé","Harry Kane","Mikel Oyarzabal"],"goldenNames":["Emiliano Martínez","Unai Simón","Nicolás Tagliafico","Nahuel Molina","Lisandro Martínez","Cristian Romero","Pau Cubarsí","Leandro Paredes","Alexis Mac Allister","Enzo Fernández","Álex Baena","Fabián Ruiz","Kylian Mbappé","Harry Kane","Mikel Oyarzabal"]} |
| frozen_budget_team_fixture_captain_objective_match | pass | {"budget":"94.8 / 105","captain":"Mikel Oyarzabal","viceCaptain":"Leandro Paredes","teamCounts":{"Argentina":8,"Spain":5,"France":1,"England":1},"fixtureCounts":{"final":13,"third_place":2},"rawProjectedPoints":59.552,"optionalityScore":5.291,"compositeScore":1014.93} |
| no_eliminated_active_player_leakage | pass | {"eliminatedLeaks":[]} |
| no_public_refereeing_conspiracy_exposure | pass | {"publicHits":[]} |
| public_behavior_not_changed_by_readiness_audit | pass | {"publicFilesEdited":false,"modelOutputsEdited":false,"optimizerLoopEdited":false} |
