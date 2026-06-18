# Score Prediction QA Report v4 MD2

Generated: 2026-06-18T12:46:53.517Z

Status: **pass**

| Metric | Value |
| --- | --- |
| Fixture rows | 72 |
| Team-fixture rows | 144 |
| MD1 / MD2 / MD3 fixtures | 24 / 24 / 24 |
| Global goal multiplier | 1.1404 |
| Clean-sheet calibration used | true |
| W/D/L confidence shrink used | true |

## Largest MD2/MD3 xG Changes

| Match | Fixture | MD | Prior xG | New xG | Delta |
| --- | --- | --- | --- | --- | --- |
| 42 | France vs Iraq | md2 | 3.468 | 5.091 | 1.623 |
| 61 | Norway vs France | md3 | 2.949 | 4.56 | 1.611 |
| 41 | Norway vs Senegal | md2 | 2.579 | 3.964 | 1.385 |
| 62 | Senegal vs Iraq | md3 | 2.614 | 3.971 | 1.357 |
| 36 | Tunisia vs Japan | md2 | 2.473 | 3.819 | 1.346 |
| 58 | Tunisia vs Netherlands | md3 | 2.881 | 4.124 | 1.243 |
| 55 | Curaçao vs Côte d'Ivoire | md3 | 2.46 | 3.697 | 1.237 |
| 57 | Japan vs Sweden | md3 | 2.721 | 3.929 | 1.208 |
| 67 | Panama vs England | md3 | 2.977 | 4.115 | 1.138 |
| 56 | Ecuador vs Germany | md3 | 2.889 | 4.024 | 1.135 |

## Team Attack Upgrades

| Team | Opponent | Pred GF | Actual GF | Mult | Note |
| --- | --- | --- | --- | --- | --- |
| Germany | Curaçao | 3.045 | 7 | 1.18 | attack upgraded after MD1; defense risk increased after MD1; large MD1 residual kept uncertain |
| Sweden | Tunisia | 1.571 | 5 | 1.18 | attack upgraded after MD1; large MD1 residual kept uncertain |
| USA | Paraguay | 0.947 | 4 | 1.18 | attack upgraded after MD1; defense risk eased after MD1; large MD1 residual kept uncertain |
| England | Croatia | 1.697 | 4 | 1.18 | attack upgraded after MD1; defense risk increased after MD1; large MD1 residual kept uncertain |
| Australia | Türkiye | 0.604 | 2 | 1.18 | attack upgraded after MD1; defense risk eased after MD1; large MD1 residual kept uncertain |
| Croatia | England | 0.639 | 2 | 1.18 | attack upgraded after MD1; defense risk increased after MD1; large MD1 residual kept uncertain |
| New Zealand | IR Iran | 0.695 | 2 | 1.18 | attack upgraded after MD1; defense risk increased after MD1; large MD1 residual kept uncertain |
| Japan | Netherlands | 0.973 | 2 | 1.18 | attack upgraded after MD1 |
| Morocco | Brazil | 0.35 | 1 | 1.18 | attack upgraded after MD1; defense risk eased after MD1 |
| Qatar | Switzerland | 0.35 | 1 | 1.18 | attack upgraded after MD1; defense risk eased after MD1 |

## Team Defense-Risk Upgrades

| Team | Opponent | Pred GA | Actual GA | Mult | Note |
| --- | --- | --- | --- | --- | --- |
| Curaçao | Germany | 3.045 | 7 | 1.18 | attack upgraded after MD1; defense risk increased after MD1; large MD1 residual kept uncertain |
| Tunisia | Sweden | 1.571 | 5 | 1.18 | defense risk increased after MD1; large MD1 residual kept uncertain |
| Paraguay | USA | 0.947 | 4 | 1.18 | attack cooled after MD1; defense risk increased after MD1; large MD1 residual kept uncertain |
| Croatia | England | 1.697 | 4 | 1.18 | attack upgraded after MD1; defense risk increased after MD1; large MD1 residual kept uncertain |
| Türkiye | Australia | 0.604 | 2 | 1.18 | attack cooled after MD1; defense risk increased after MD1; large MD1 residual kept uncertain |
| England | Croatia | 0.639 | 2 | 1.18 | attack upgraded after MD1; defense risk increased after MD1; large MD1 residual kept uncertain |
| IR Iran | New Zealand | 0.695 | 2 | 1.18 | attack upgraded after MD1; defense risk increased after MD1; large MD1 residual kept uncertain |
| Netherlands | Japan | 0.973 | 2 | 1.18 | defense risk increased after MD1 |
| Brazil | Morocco | 0.35 | 1 | 1.18 | attack cooled after MD1; defense risk increased after MD1 |
| Switzerland | Qatar | 0.35 | 1 | 1.18 | attack cooled after MD1; defense risk increased after MD1 |

## Checks

| Check | Status | Detail |
| --- | --- | --- |
| fixture_coverage_72 | pass | 72/72 fixtures; 72 unique fixture IDs. |
| matchday_coverage | pass | MD1=24, MD2=24, MD3=24. |
| team_fixture_coverage | pass | 144/144 team-fixture rows. |
| md1_prior_fields_retained | pass | MD1 rows retain prior prediction fields and are marked uncalibrated. |
| no_nan_or_infinity | pass | No NaN or Infinity. |
| team_xg_bounds | pass | xG range {"min":0.339,"max":4.5,"average":1.517}. |
| total_xg_reasonable | pass | total xG range {"min":1.955,"max":5.091,"average":3.033}. |
| wdl_probability_bounds | pass | W/D/L probabilities are between 0 and 1. |
| wdl_probability_sum | pass | W/D/L probabilities sum to approximately 1. |
| clean_sheet_probability_bounds | pass | Clean-sheet probabilities are between 0 and 1. |
| global_goal_multiplier_cap | pass | globalGoalMultiplier=1.1404. |
| team_attack_multiplier_cap | pass | All team attack multipliers are within cap. |
| team_defense_multiplier_cap | pass | All team defense weakness multipliers are within cap. |
| teams_without_md1_neutral | pass | Every team has MD1 data; no neutral fallback teams needed. |
| top_change_lists_present | pass | Top-10 calibration lists are present. |
| browser_globals_same_shape | pass | Output preserves active browser data shape. |
| pele_not_rebuilt | pass | PELE/teamQuality is retained as prior, not rebuilt. |
| final_squads_not_source_backed | pass | Final squads are not claimed source-backed. |
| ownership_not_model_signal | pass | Ownership changes are not used as signal. |
| live_fixture_mapping_source_green | pass | Live mapping status=passed; final_fixtures_shown=24. |
| v4_changed_md2_md3_only | pass | 48/48 MD2/MD3 fixtures recalibrated. |
| v3_prior_fixture_coverage_preserved | pass | v3 prior has 72 fixtures. |
