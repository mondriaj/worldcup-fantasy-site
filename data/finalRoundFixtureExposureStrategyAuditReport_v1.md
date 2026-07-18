# Final Round Fixture Exposure Strategy Audit v1

Status: pass

## Summary

| Metric | Value |
| --- | --- |
| eligible_teams | ["France","England","Spain","Argentina"] |
| raw_expected_selected_count_by_team | {"Argentina":8,"Spain":5,"France":1,"England":1} |
| selected_count_by_team | {"Argentina":8,"Spain":5,"France":1,"England":1} |
| selected_count_by_fixture | {"final":13,"third_place":2} |
| raw_expected_selected_count_by_fixture | {"final":13,"third_place":2} |
| raw_projected_points_before | 59.552 |
| raw_projected_points_after | 59.552 |
| optionality_score | 5.291 |
| optionality_gain | 0 |
| composite_score_gain | 0 |
| third_place_recommendation_rows | 72 |
| early_option_rows | 25 |
| france_england_before | 2 |
| france_england_after | 2 |
| builder_optimizes_raw_points_only_before_fix | false |
| early_kickoff_optionality_was_ignored_before_fix | false |
| public_substitution_copy_cautious | true |
| active_eliminated_player_leak_count | 0 |

## Team Exposure

| Team | Fixture | Kickoff | xG | Opp xG | CS | Candidates | Selected | Rec Surfaces | Omitted Top |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| France | Third Place | 1 | 1.464 | 1.451 | 0.279 | 26 | 1 | {"balanced":6,"safe":2,"upside":6,"differential":4,"early_option":6,"third_place_risk":13,"captain":4} | Ousmane Dembélé: Third Place role volatility plus position/country/budget tradeoff. |
| England | Third Place | 1 | 1.451 | 1.464 | 0.276 | 24 | 1 | {"balanced":5,"safe":1,"upside":6,"differential":1,"early_option":5,"third_place_risk":12,"captain":1} | Anthony Gordon: Third Place role volatility plus position/country/budget tradeoff. |
| Spain | Final | 2 | 1.341 | 1.399 | 0.247 | 26 | 5 | {"balanced":6,"safe":11,"upside":6,"differential":10,"early_option":6,"captain":10} | Lamine Yamal Nasraoui Ebana: Projection, position, country-limit, budget, or squad-balance tradeoff. |
| Argentina | Final | 2 | 1.399 | 1.341 | 0.262 | 25 | 8 | {"balanced":8,"safe":11,"upside":7,"differential":10,"early_option":8,"captain":10} | Lionel Messi: Projection, position, country-limit, budget, or squad-balance tradeoff. |

## Selected Squad

| Player | Team | Pos | Stage | Pts | Optionality | Composite |
| --- | --- | --- | --- | --- | --- | --- |
| Emiliano Martínez | Argentina | GK | final | 3.15 | 0 | 55.2 |
| Unai Simón | Spain | GK | final | 3.083 | 0 | 54.361 |
| Nicolás Tagliafico | Argentina | DEF | final | 3.725 | 0 | 62.509 |
| Nahuel Molina | Argentina | DEF | final | 3.725 | 0 | 62.509 |
| Lisandro Martínez | Argentina | DEF | final | 3.725 | 0 | 62.509 |
| Cristian Romero | Argentina | DEF | final | 3.725 | 0 | 62.509 |
| Pau Cubarsí | Spain | DEF | final | 3.636 | 0 | 61.392 |
| Leandro Paredes | Argentina | MID | final | 4.358 | 0 | 70.518 |
| Alexis Mac Allister | Argentina | MID | final | 4.358 | 0 | 70.518 |
| Enzo Fernández | Argentina | MID | final | 4.358 | 0 | 70.518 |
| Álex Baena | Spain | MID | final | 4.25 | 0 | 69.21 |
| Fabián Ruiz | Spain | MID | final | 4.25 | 0 | 69.21 |
| Kylian Mbappé | France | FWD | third_place | 4.104 | 2.658 | 83.353 |
| Harry Kane | England | FWD | third_place | 4.055 | 2.633 | 81.166 |
| Mikel Oyarzabal | Spain | FWD | final | 5.05 | 0 | 79.448 |
