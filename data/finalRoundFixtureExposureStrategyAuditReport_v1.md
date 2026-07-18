# Final Round Fixture Exposure Strategy Audit v1

Status: pass

## Summary

| Metric | Value |
| --- | --- |
| eligible_teams | ["France","England","Spain","Argentina"] |
| raw_expected_selected_count_by_team | {"France":1,"Spain":6,"Argentina":8} |
| selected_count_by_team | {"France":2,"Spain":4,"Argentina":8,"England":1} |
| selected_count_by_fixture | {"third_place":3,"final":12} |
| raw_expected_selected_count_by_fixture | {"third_place":1,"final":14} |
| raw_projected_points_before | 60.681 |
| raw_projected_points_after | 58.689 |
| optionality_score | 6.814 |
| optionality_gain | 5.291 |
| composite_score_gain | 5.027 |
| third_place_recommendation_rows | 72 |
| early_option_rows | 25 |
| france_england_before | 1 |
| france_england_after | 3 |
| builder_optimizes_raw_points_only_before_fix | true |
| early_kickoff_optionality_was_ignored_before_fix | true |
| public_substitution_copy_cautious | true |
| active_eliminated_player_leak_count | 0 |

## Team Exposure

| Team | Fixture | Kickoff | xG | Opp xG | CS | Candidates | Selected | Rec Surfaces | Omitted Top |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| France | Third Place | 1 | 1.464 | 1.451 | 0.279 | 26 | 2 | {"balanced":6,"safe":2,"upside":6,"differential":4,"early_option":6,"third_place_risk":13,"captain":4} | Ousmane Dembélé: Third Place role volatility plus position/country/budget tradeoff. |
| England | Third Place | 1 | 1.451 | 1.464 | 0.276 | 24 | 1 | {"balanced":5,"safe":1,"upside":6,"differential":1,"early_option":5,"third_place_risk":12,"captain":1} | Anthony Gordon: Third Place role volatility plus position/country/budget tradeoff. |
| Spain | Final | 2 | 1.341 | 1.399 | 0.247 | 26 | 4 | {"balanced":6,"safe":11,"upside":6,"differential":10,"early_option":6,"captain":10} | Mikel Oyarzabal: Projection, position, country-limit, budget, or squad-balance tradeoff. |
| Argentina | Final | 2 | 1.399 | 1.341 | 0.262 | 25 | 8 | {"balanced":8,"safe":11,"upside":7,"differential":10,"early_option":8,"captain":10} | Julián Alvarez: Projection, position, country-limit, budget, or squad-balance tradeoff. |

## Selected Squad

| Player | Team | Pos | Stage | Pts | Optionality | Composite |
| --- | --- | --- | --- | --- | --- | --- |
| Mike Maignan | France | GK | third_place | 2.147 | 1.523 | 48.272 |
| Unai Simón | Spain | GK | final | 3.083 | 0 | 54.361 |
| Cristian Romero | Argentina | DEF | final | 3.725 | 0 | 62.509 |
| Nahuel Molina | Argentina | DEF | final | 3.725 | 0 | 62.509 |
| Nicolás Tagliafico | Argentina | DEF | final | 3.725 | 0 | 62.509 |
| Lisandro Martínez | Argentina | DEF | final | 3.725 | 0 | 62.509 |
| Pedro Porro | Spain | DEF | final | 3.636 | 0 | 61.392 |
| Leandro Paredes | Argentina | MID | final | 4.358 | 0 | 70.518 |
| Alexis Mac Allister | Argentina | MID | final | 4.358 | 0 | 70.518 |
| Enzo Fernández | Argentina | MID | final | 4.358 | 0 | 70.518 |
| Álex Baena | Spain | MID | final | 4.25 | 0 | 69.21 |
| Lamine Yamal Nasraoui Ebana | Spain | MID | final | 4.25 | 0 | 69.21 |
| Kylian Mbappé | France | FWD | third_place | 4.104 | 2.658 | 83.353 |
| Harry Kane | England | FWD | third_place | 4.055 | 2.633 | 81.166 |
| Lionel Messi | Argentina | FWD | final | 5.19 | 0 | 81.161 |
