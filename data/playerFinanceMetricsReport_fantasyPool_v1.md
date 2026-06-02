# Player Finance Metrics Fantasy Pool v1

Generated: 2026-06-02T19:21:41.046Z

Model stage: fantasy_pool_only. This file is fantasy_pool_only, not final-squad-backed, not final public recommendations, not Team Builder-ready, not browser-ready, and safe only for preliminary finance/value QA.

## Purpose

This staged layer turns official fantasy prices, v3 fantasy-pool projections, preliminary minutes, and recommendation finance diagnostics into player-level value and risk metrics. It is intended to prepare future Team Builder and Fantasy Finance work without promoting any active product files.

## Inputs Used

- data/playerMatchdayProjections_fantasyPool_v3.json
- data/playerRecommendationInputs_v1.json
- data/playerMinutesModel_fantasyPool_v0.json
- data/recommendationFinanceDiagnostics_fantasyPool_v3.json
- data/officialFantasyRules_v0.json

Preserved active files:

- data/playerValueModel_v1.json
- data/playerFinanceMetrics_v0.json

## Why Fantasy Pool Only

Final squads are not source-backed and official rules still carry manual-review warnings. All rows carry final-squad uncertainty and staged-only flags. These metrics are not suitable for public recommendations or final Team Builder promotion.

## Formulas

- Expected points: sum of v3 raw expected points across group-stage matchdays.
- Risk-adjusted points: sum of v3 risk-adjusted points across group-stage matchdays.
- Points per price: expected points divided by official fantasy price.
- Risk-adjusted points per price: risk-adjusted points divided by official fantasy price.
- Value over replacement: imported from recommendation finance diagnostics using position-specific replacement levels.
- Scarcity-adjusted value: value over replacement plus small scarcity bonuses for position, price tier, matchday, and diversification.
- Confidence-adjusted value: risk-adjusted return divided by price and dampened by projection confidence.
- Volatility proxy: matchday expected-point standard deviation plus a small projection-spread term.
- Downside risk proxy: projection risk gap plus bad-floor exposure.
- Stress-case floor: group-stage floor minus volatility proxy.
- Uncertainty penalty: projection risk gap plus minutes, role, data, final-squad, thin-profile, and missing-usage penalties.

## Price Tier Thresholds

Thresholds are position-specific; no global price tier is used.

| Position | Tier | Minimum price |
| --- | --- | --- |
| GK | premium | 5.5 |
| GK | upper_mid | 5 |
| GK | mid_price | 4.5 |
| GK | budget | 4 |
| GK | ultra_budget | 0 |
| DEF | premium | 6 |
| DEF | upper_mid | 5 |
| DEF | mid_price | 4.5 |
| DEF | budget | 4 |
| DEF | ultra_budget | 0 |
| MID | premium | 8.5 |
| MID | upper_mid | 7 |
| MID | mid_price | 5.5 |
| MID | budget | 4.5 |
| MID | ultra_budget | 0 |
| FWD | premium | 9 |
| FWD | upper_mid | 7.5 |
| FWD | mid_price | 6 |
| FWD | budget | 5 |
| FWD | ultra_budget | 0 |

## Replacement-Level Rules

Replacement level is position-specific within the group-stage scope.

| Position | Replacement rank |
| --- | --- |
| GK | 12 |
| DEF | 20 |
| MID | 20 |
| FWD | 16 |

## Efficient Frontier Definition

A player is dominated if another player in the same position or same price band has higher or similar risk-adjusted points, lower or similar official price, equal or better confidence, and equal or fewer major risk flags. Efficient-frontier rows are not clearly dominated under that rule.

## Coverage Summary

- Players with finance metrics: 1256
- Blocked players excluded: 225
- Efficient-frontier players: 17
- Dominated players: 1239
- Above-replacement players: 64
- Final-squad uncertainty rows: 1256
- Neymar rows: 1
- Brazil uncertainty rows: 26
- QA status: pass_with_staging_stop_conditions

## Price Tier Counts By Position

| Position | Tier | Players |
| --- | --- | --- |
| DEF | mid_price | 44 |
| DEF | budget | 119 |
| DEF | ultra_budget | 211 |
| DEF | upper_mid | 37 |
| DEF | premium | 1 |
| FWD | mid_price | 52 |
| FWD | budget | 76 |
| FWD | ultra_budget | 122 |
| FWD | premium | 5 |
| FWD | upper_mid | 15 |
| MID | mid_price | 189 |
| MID | ultra_budget | 30 |
| MID | budget | 167 |
| MID | upper_mid | 34 |
| MID | premium | 7 |
| GK | ultra_budget | 76 |
| GK | upper_mid | 7 |
| GK | mid_price | 21 |
| GK | budget | 43 |

## Frontier And Dominated Counts

| Position | Efficient frontier | Dominated |
| --- | --- | --- |
| GK | 3 | 144 |
| DEF | 6 | 406 |
| MID | 6 | 421 |
| FWD | 2 | 268 |

## Top Value Over Replacement Players

| Rank | Player | Country | Pos | Price | VOR | Scarcity value | Frontier |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Lionel Messi | Argentina | FWD | 10 | 9.009 | 9.109 | true |
| 2 | Lamine Yamal Nasraoui Ebana | Spain | MID | 10 | 7.559 | 8.132 | true |
| 3 | Harry Kane | England | FWD | 10.5 | 7.162 | 7.342 | false |
| 4 | Raphael Dias Belloli | Brazil | MID | 8.2 | 6.735 | 7.308 | true |
| 5 | Kylian Mbappé | France | FWD | 10.5 | 6.266 | 6.446 | false |
| 6 | Michael Olise | France | MID | 9.5 | 6.124 | 6.697 | false |
| 7 | Nuno Alexandre Tavares Mendes | Portugal | DEF | 5.8 | 5.046 | 5.69 | true |
| 8 | Luis Díaz | Colombia | MID | 8.1 | 4.527 | 5.18 | true |
| 9 | Vinícius José Paixão de Oliveira Júnior | Brazil | MID | 10 | 4.407 | 4.98 | false |
| 10 | Enzo Fernández | Argentina | MID | 7.5 | 4.34 | 4.833 | true |
| 11 | Lautaro Martínez | Argentina | FWD | 8.8 | 4.273 | 4.373 | false |
| 12 | Cristiano Ronaldo dos Santos Aveiro | Portugal | FWD | 10 | 3.948 | 4.128 | false |
| 13 | Bruno Miguel Borges Fernandes | Portugal | MID | 8.5 | 3.865 | 4.438 | false |
| 14 | Nicolás Tagliafico | Argentina | DEF | 4.3 | 3.755 | 4.319 | true |
| 15 | Julián Alvarez | Argentina | FWD | 8.6 | 3.347 | 3.447 | false |

## Top Value Players By Position

| Rank | Player | Country | Pos | Price | VOR | Risk adj / price |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Emiliano Martínez | Argentina | GK | 5 | 3.264 | 3.3756 |
| 2 | Alisson Ramsés Becker | Brazil | GK | 5 | 2.559 | 3.2346 |
| 3 | Unai Simón | Spain | GK | 5 | 1.951 | 3.113 |
| 4 | Camilo Vargas | Colombia | GK | 4.3 | 1.78 | 3.58 |
| 5 | Ederson Santana de Moraes | Brazil | GK | 5 | 1.749 | 3.0726 |
| 1 | Nuno Alexandre Tavares Mendes | Portugal | DEF | 5.8 | 5.046 | 3.4766 |
| 2 | Nicolás Tagliafico | Argentina | DEF | 4.3 | 3.755 | 4.3891 |
| 3 | Nico O'Reilly | England | DEF | 4.7 | 3.015 | 3.8581 |
| 4 | Denzel Dumfries | Netherlands | DEF | 5.7 | 2.101 | 3.0209 |
| 5 | Nahuel Molina | Argentina | DEF | 4.4 | 2.025 | 3.8961 |
| 1 | Lamine Yamal Nasraoui Ebana | Spain | MID | 10 | 7.559 | 2.4011 |
| 2 | Raphael Dias Belloli | Brazil | MID | 8.2 | 6.735 | 2.8277 |
| 3 | Michael Olise | France | MID | 9.5 | 6.124 | 2.3764 |
| 4 | Luis Díaz | Colombia | MID | 8.1 | 4.527 | 2.59 |
| 5 | Vinícius José Paixão de Oliveira Júnior | Brazil | MID | 10 | 4.407 | 2.0859 |
| 1 | Lionel Messi | Argentina | FWD | 10 | 9.009 | 2.265 |
| 2 | Harry Kane | England | FWD | 10.5 | 7.162 | 1.9812 |
| 3 | Kylian Mbappé | France | FWD | 10.5 | 6.266 | 1.8959 |
| 4 | Lautaro Martínez | Argentina | FWD | 8.8 | 4.273 | 2.0357 |
| 5 | Cristiano Ronaldo dos Santos Aveiro | Portugal | FWD | 10 | 3.948 | 1.7589 |

## Top Risk-Adjusted Return Players

| Rank | Player | Country | Pos | Risk adj return | Conf adj value |
| --- | --- | --- | --- | --- | --- |
| 1 | Lamine Yamal Nasraoui Ebana | Spain | MID | 19.208 | 1.9208 |
| 2 | Raphael Dias Belloli | Brazil | MID | 18.385 | 2.2421 |
| 3 | Lionel Messi | Argentina | FWD | 18.08 | 1.808 |
| 4 | Michael Olise | France | MID | 17.869 | 1.8809 |
| 5 | Harry Kane | England | FWD | 16.544 | 1.5756 |
| 6 | Enzo Fernández | Argentina | MID | 16.392 | 2.1856 |
| 7 | Luis Díaz | Colombia | MID | 16.256 | 2.0069 |
| 8 | Vinícius José Paixão de Oliveira Júnior | Brazil | MID | 16.213 | 1.6213 |
| 9 | Bruno Miguel Borges Fernandes | Portugal | MID | 15.939 | 1.8752 |
| 10 | Nuno Alexandre Tavares Mendes | Portugal | DEF | 15.705 | 2.7078 |
| 11 | Kylian Mbappé | France | FWD | 15.606 | 1.4863 |
| 12 | Nicolás Tagliafico | Argentina | DEF | 14.613 | 3.3984 |
| 13 | Kevin De Bruyne | Belgium | MID | 14.249 | 1.8999 |
| 14 | Bradley Barcola | France | MID | 14.052 | 1.7565 |
| 15 | Nico O'Reilly | England | DEF | 13.979 | 2.9743 |

## Top Frontier Players

| Rank | Player | Country | Pos | Price | Conf adj value | VOR |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Nicolás Tagliafico | Argentina | DEF | 4.3 | 3.3984 | 3.755 |
| 2 | Silvan Widmer | Switzerland | DEF | 4.2 | 2.889 | 1.092 |
| 3 | Nuno Alexandre Tavares Mendes | Portugal | DEF | 5.8 | 2.7078 | 5.046 |
| 4 | Emiliano Martínez | Argentina | GK | 5 | 2.5662 | 3.264 |
| 5 | Hiroki Ito | Japan | DEF | 3.9 | 2.4315 | -1.636 |
| 6 | Johan Mojica | Colombia | DEF | 3.9 | 2.4295 | -1.724 |
| 7 | Santiago Arias | Colombia | DEF | 3.9 | 2.4115 | -1.788 |
| 8 | Charles De Ketelaere | Belgium | MID | 5.6 | 2.3907 | 1.207 |
| 9 | Santiago Mele | Uruguay | GK | 3.5 | 2.3871 | -1.36 |
| 10 | Sergio Rochet | Uruguay | GK | 4.1 | 2.3166 | -0.142 |
| 11 | Raphael Dias Belloli | Brazil | MID | 8.2 | 2.2421 | 6.735 |
| 12 | Enzo Fernández | Argentina | MID | 7.5 | 2.1856 | 4.34 |
| 13 | Giorgian de Arrascaeta | Uruguay | MID | 6.5 | 2.04 | 1.215 |
| 14 | Luis Díaz | Colombia | MID | 8.1 | 2.0069 | 4.527 |
| 15 | Lamine Yamal Nasraoui Ebana | Spain | MID | 10 | 1.9208 | 7.559 |

## Differential Dominated-Candidate Discussion

- Differential candidate rows audited: 100
- Differential efficient-frontier rows: 40
- Differential dominated rows: 60
- Dominated but still defensible rows: 31

Dominated Differential rows are not automatically bugs because dominance is tested against same-position or same-price-band alternatives, while Differential also values low obviousness and matchday context. The count is still high enough that future Differential scoring should prefer efficient-frontier rows more strongly.

## High-Price Low-Value Players

| Rank | Player | Country | Pos | Price | VOR | Opportunity cost |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Mohamed Salah Hamed Mahrous Ghaly | Egypt | MID | 10 | -3.025 | 10.584 |
| 2 | Achraf Hakimi | Morocco | DEF | 6 | -2.424 | 7.47 |
| 3 | Ousmane Dembélé | France | MID | 10 | -0.005 | 7.564 |

## Budget High-Value Players

| Rank | Player | Country | Pos | Price | VOR | Scarcity value |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Nicolás Tagliafico | Argentina | DEF | 4.3 | 3.755 | 4.319 |
| 2 | Luis Suárez | Colombia | FWD | 5.7 | 2.349 | 2.609 |
| 3 | Nahuel Molina | Argentina | DEF | 4.4 | 2.025 | 2.589 |
| 4 | Camilo Vargas | Colombia | GK | 4.3 | 1.78 | 2.12 |
| 5 | Silvan Widmer | Switzerland | DEF | 4.2 | 1.092 | 1.886 |
| 6 | Jarell Quansah | England | DEF | 4.4 | 0.756 | 1.4 |
| 7 | Nicolás Otamendi | Argentina | DEF | 4.4 | 0.65 | 1.214 |
| 8 | Gonzalo Montiel | Argentina | DEF | 4.3 | 0.371 | 0.935 |
| 9 | Oliver Baumann | Germany | GK | 4.3 | 0.02 | 0.36 |

## QA Checks

| Check | Status | Count |
| --- | --- | --- |
| all_modeled_players_have_finance_metrics | pass | 1256 |
| blocked_players_excluded_or_flagged | warning | 225 |
| no_missing_official_prices | pass | 0 |
| no_missing_official_positions | pass | 0 |
| valid_position_specific_price_tiers | pass | 0 |
| no_negative_points_per_price_without_justification | pass | 0 |
| staged_labels_present | pass | 0 |
| readiness_gate_still_blocked | warning |  |

## How This Can Feed Team Builder Later

This layer can support preliminary portfolio-style Team Builder staging by supplying price-tier, frontier, dominated, value-over-replacement, opportunity-cost, volatility, downside, minutes-risk, role-risk, and final-squad-risk fields. It should remain an input candidate only until final squads and official rule warnings are resolved.

## Stop Conditions Before Team Builder

- Final squads are not source-backed.
- Official rules still require manual review.
- Browser-ready files were not regenerated.
- Active v2 recommendation, Team Builder, captain, and substitution files were not updated.

## Stop Conditions Before Public Promotion

- Official-data readiness remains blocked.
- These outputs are fantasy_pool_only and not final-squad-backed.
- The finance metrics are not backtested against official fantasy outcomes.
- The Differential dominated-candidate count should be reviewed before any public value mode.
