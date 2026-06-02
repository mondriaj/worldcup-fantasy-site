# Player Matchday Projection Report Fantasy Pool v3

Generated: 2026-06-02T17:52:11.470Z

## Status

This is a staged `fantasy_pool_only` player matchday projection layer. It is not final-squad-backed, not final public recommendations, not Team Builder-ready, and safe only for preliminary recommendation staging.

| Metric | Value |
| --- | --- |
| Overall QA status | pass_with_staging_stop_conditions |
| Projection rows | 3768 |
| Players projected | 1256 |
| Blocked players | 225 |
| Safe for preliminary recommendation staging | true |
| Safe for final public recommendations | false |
| Safe for Team Builder promotion | false |

## Methodology

The model uses official fantasy player IDs, official prices, official positions, official scoring categories, the preliminary fantasy-pool minutes model, and `scorePredictions_fantasyPool_v3` fixture context. Existing source-backed player performance rates are used where available. Missing event rates use conservative position/team priors and carry explicit data-quality flags. Price is not used as event-rate evidence.

This coverage pass adds separate official-scoring components for midfielder tackles, midfielder chances created, and forward shots on target. Source-backed player rates are used when available; otherwise the added components use small capped priors dampened by expected minutes, role confidence, thin-profile status, and projection confidence.

## Coverage

| Matchday | Rows |
| --- | --- |
| md1 | 1256 |
| md2 | 1256 |
| md3 | 1256 |

## Projections By Position

| Position | Rows |
| --- | --- |
| DEF | 1236 |
| FWD | 810 |
| MID | 1281 |
| GK | 441 |

## Confidence Distribution

| Confidence | Rows |
| --- | --- |
| high | 1842 |
| low | 1221 |
| thin_profile | 267 |
| medium | 438 |

## Added Official Scoring Components

| Component | Min | Avg | Max |
| --- | --- | --- | --- |
| Tackle component | 0 | 0.056 | 1.1 |
| Chance-created component | 0 | 0.082 | 1.15 |
| Shot-on-target component | 0 | 0.04 | 0.95 |
| Added components total | 0 | 0.178 | 1.71 |

## Top Added-Component Totals

| Name | Country | Pos | MD | Opponent | Added total | Tackle | Chance | SOT | Confidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Ben Gannon-Doak | Scotland | MID | md1 | Haiti | 1.71 | 1.1 | 0.61 | 0 | high |
| Bruno Miguel Borges Fernandes | Portugal | MID | md1 | Congo DR | 1.566 | 0.416 | 1.15 | 0 | high |
| Bruno Miguel Borges Fernandes | Portugal | MID | md2 | Uzbekistan | 1.566 | 0.416 | 1.15 | 0 | high |
| Bruno Miguel Borges Fernandes | Portugal | MID | md3 | Colombia | 1.566 | 0.416 | 1.15 | 0 | high |
| Ben Gannon-Doak | Scotland | MID | md2 | Morocco | 1.466 | 1.1 | 0.366 | 0 | high |
| Ben Gannon-Doak | Scotland | MID | md3 | Brazil | 1.466 | 1.1 | 0.366 | 0 | high |
| Jérémy Doku | Belgium | MID | md1 | Egypt | 1.449 | 0.299 | 1.15 | 0 | high |
| Jérémy Doku | Belgium | MID | md2 | IR Iran | 1.449 | 0.299 | 1.15 | 0 | high |
| Jérémy Doku | Belgium | MID | md3 | New Zealand | 1.449 | 0.299 | 1.15 | 0 | high |
| Declan Rice | England | MID | md1 | Croatia | 1.436 | 0.505 | 0.931 | 0 | high |
| Declan Rice | England | MID | md2 | Ghana | 1.436 | 0.505 | 0.931 | 0 | high |
| Declan Rice | England | MID | md3 | Panama | 1.436 | 0.505 | 0.931 | 0 | high |
| Florian Wirtz | Germany | MID | md1 | Curaçao | 1.415 | 0.318 | 1.097 | 0 | high |
| Florian Wirtz | Germany | MID | md2 | Côte d'Ivoire | 1.415 | 0.318 | 1.097 | 0 | high |
| Bruno Guimarães Rodriguez Moura | Brazil | MID | md2 | Haiti | 1.394 | 0.601 | 0.793 | 0 | high |
| Bruno Guimarães Rodriguez Moura | Brazil | MID | md3 | Scotland | 1.394 | 0.601 | 0.793 | 0 | high |
| Carlos Henrique Casimiro | Brazil | MID | md2 | Haiti | 1.384 | 0.807 | 0.577 | 0 | high |
| Carlos Henrique Casimiro | Brazil | MID | md3 | Scotland | 1.384 | 0.807 | 0.577 | 0 | high |
| Luis Díaz | Colombia | MID | md1 | Uzbekistan | 1.38 | 0.23 | 1.15 | 0 | high |
| Luis Díaz | Colombia | MID | md2 | Congo DR | 1.38 | 0.23 | 1.15 | 0 | high |
| Raphael Dias Belloli | Brazil | MID | md1 | Morocco | 1.38 | 0.23 | 1.15 | 0 | high |
| Raphael Dias Belloli | Brazil | MID | md2 | Haiti | 1.38 | 0.23 | 1.15 | 0 | high |
| Raphael Dias Belloli | Brazil | MID | md3 | Scotland | 1.38 | 0.23 | 1.15 | 0 | high |
| Arda Güler | Türkiye | MID | md1 | Australia | 1.376 | 0.226 | 1.15 | 0 | high |
| Arda Güler | Türkiye | MID | md2 | Paraguay | 1.376 | 0.226 | 1.15 | 0 | high |

## Top Raw Expected Points

| Name | Country | Pos | MD | Opponent | Raw | Confidence |
| --- | --- | --- | --- | --- | --- | --- |
| Lamine Yamal Nasraoui Ebana | Spain | MID | md1 | Cabo Verde | 8.684 | high |
| Lamine Yamal Nasraoui Ebana | Spain | MID | md2 | Saudi Arabia | 8.684 | high |
| Michael Olise | France | MID | md2 | Iraq | 8.563 | high |
| Raphael Dias Belloli | Brazil | MID | md2 | Haiti | 8.555 | high |
| Luis Díaz | Colombia | MID | md1 | Uzbekistan | 8.47 | high |
| Lamine Yamal Nasraoui Ebana | Spain | MID | md3 | Uruguay | 8.451 | high |
| Luis Díaz | Colombia | MID | md2 | Congo DR | 8.384 | high |
| Raphael Dias Belloli | Brazil | MID | md3 | Scotland | 8.294 | high |
| Nuno Alexandre Tavares Mendes | Portugal | DEF | md2 | Uzbekistan | 8.252 | high |
| Nuno Alexandre Tavares Mendes | Portugal | DEF | md1 | Congo DR | 8.193 | high |
| Bruno Miguel Borges Fernandes | Portugal | MID | md2 | Uzbekistan | 8.122 | high |
| Lionel Messi | Argentina | FWD | md1 | Algeria | 8.119 | high |
| Lionel Messi | Argentina | FWD | md2 | Austria | 8.119 | high |
| Lionel Messi | Argentina | FWD | md3 | Jordan | 8.119 | high |
| Raphael Dias Belloli | Brazil | MID | md1 | Morocco | 8.081 | high |
| Bruno Miguel Borges Fernandes | Portugal | MID | md1 | Congo DR | 7.965 | high |
| Vinícius José Paixão de Oliveira Júnior | Brazil | MID | md2 | Haiti | 7.936 | high |
| Michael Olise | France | MID | md1 | Senegal | 7.863 | high |
| Michael Olise | France | MID | md3 | Norway | 7.849 | high |
| Giorgian de Arrascaeta | Uruguay | MID | md2 | Cabo Verde | 7.818 | high |
| Vinícius José Paixão de Oliveira Júnior | Brazil | MID | md3 | Scotland | 7.592 | high |
| Harry Kane | England | FWD | md2 | Ghana | 7.552 | high |
| Harry Kane | England | FWD | md3 | Panama | 7.552 | high |
| Giorgian de Arrascaeta | Uruguay | MID | md1 | Saudi Arabia | 7.541 | high |
| Enzo Fernández | Argentina | MID | md1 | Algeria | 7.481 | high |

## Top Risk-Adjusted Points

| Name | Country | Pos | MD | Opponent | Risk-adj | Confidence |
| --- | --- | --- | --- | --- | --- | --- |
| Lamine Yamal Nasraoui Ebana | Spain | MID | md1 | Cabo Verde | 8.076 | high |
| Lamine Yamal Nasraoui Ebana | Spain | MID | md2 | Saudi Arabia | 8.076 | high |
| Michael Olise | France | MID | md2 | Iraq | 7.964 | high |
| Raphael Dias Belloli | Brazil | MID | md2 | Haiti | 7.957 | high |
| Luis Díaz | Colombia | MID | md1 | Uzbekistan | 7.877 | high |
| Lamine Yamal Nasraoui Ebana | Spain | MID | md3 | Uruguay | 7.859 | high |
| Luis Díaz | Colombia | MID | md2 | Congo DR | 7.797 | high |
| Raphael Dias Belloli | Brazil | MID | md3 | Scotland | 7.714 | high |
| Nuno Alexandre Tavares Mendes | Portugal | DEF | md2 | Uzbekistan | 7.675 | high |
| Nuno Alexandre Tavares Mendes | Portugal | DEF | md1 | Congo DR | 7.62 | high |
| Bruno Miguel Borges Fernandes | Portugal | MID | md2 | Uzbekistan | 7.554 | high |
| Lionel Messi | Argentina | FWD | md1 | Algeria | 7.55 | high |
| Lionel Messi | Argentina | FWD | md2 | Austria | 7.55 | high |
| Lionel Messi | Argentina | FWD | md3 | Jordan | 7.55 | high |
| Raphael Dias Belloli | Brazil | MID | md1 | Morocco | 7.516 | high |
| Bruno Miguel Borges Fernandes | Portugal | MID | md1 | Congo DR | 7.408 | high |
| Vinícius José Paixão de Oliveira Júnior | Brazil | MID | md2 | Haiti | 7.38 | high |
| Michael Olise | France | MID | md1 | Senegal | 7.312 | high |
| Michael Olise | France | MID | md3 | Norway | 7.3 | high |
| Giorgian de Arrascaeta | Uruguay | MID | md2 | Cabo Verde | 7.271 | high |
| Vinícius José Paixão de Oliveira Júnior | Brazil | MID | md3 | Scotland | 7.061 | high |
| Harry Kane | England | FWD | md2 | Ghana | 7.023 | high |
| Harry Kane | England | FWD | md3 | Panama | 7.023 | high |
| Giorgian de Arrascaeta | Uruguay | MID | md1 | Saudi Arabia | 7.013 | high |
| Enzo Fernández | Argentina | MID | md1 | Algeria | 6.957 | high |

## Top Captain Scores

| Name | Country | Pos | MD | Opponent | Captain score | Confidence |
| --- | --- | --- | --- | --- | --- | --- |
| Lamine Yamal Nasraoui Ebana | Spain | MID | md1 | Cabo Verde | 18.795 | high |
| Lamine Yamal Nasraoui Ebana | Spain | MID | md2 | Saudi Arabia | 18.79 | high |
| Michael Olise | France | MID | md2 | Iraq | 18.558 | high |
| Raphael Dias Belloli | Brazil | MID | md2 | Haiti | 18.544 | high |
| Luis Díaz | Colombia | MID | md1 | Uzbekistan | 18.278 | high |
| Lamine Yamal Nasraoui Ebana | Spain | MID | md3 | Uruguay | 18.133 | high |
| Luis Díaz | Colombia | MID | md2 | Congo DR | 18.099 | high |
| Lionel Messi | Argentina | FWD | md3 | Jordan | 17.928 | high |
| Raphael Dias Belloli | Brazil | MID | md3 | Scotland | 17.898 | high |
| Lionel Messi | Argentina | FWD | md1 | Algeria | 17.875 | high |
| Lionel Messi | Argentina | FWD | md2 | Austria | 17.827 | high |
| Bruno Miguel Borges Fernandes | Portugal | MID | md2 | Uzbekistan | 17.457 | high |
| Vinícius José Paixão de Oliveira Júnior | Brazil | MID | md2 | Haiti | 17.378 | high |
| Raphael Dias Belloli | Brazil | MID | md1 | Morocco | 17.35 | high |
| Nuno Alexandre Tavares Mendes | Portugal | DEF | md2 | Uzbekistan | 17.223 | high |
| Giorgian de Arrascaeta | Uruguay | MID | md2 | Cabo Verde | 17.1 | high |
| Bruno Miguel Borges Fernandes | Portugal | MID | md1 | Congo DR | 17.068 | high |
| Nuno Alexandre Tavares Mendes | Portugal | DEF | md1 | Congo DR | 17.066 | high |
| Harry Kane | England | FWD | md2 | Ghana | 16.855 | high |
| Harry Kane | England | FWD | md3 | Panama | 16.804 | high |
| Michael Olise | France | MID | md3 | Norway | 16.798 | high |
| Michael Olise | France | MID | md1 | Senegal | 16.691 | high |
| Vinícius José Paixão de Oliveira Júnior | Brazil | MID | md3 | Scotland | 16.495 | high |
| Giorgian de Arrascaeta | Uruguay | MID | md1 | Saudi Arabia | 16.481 | high |
| Kylian Mbappé | France | FWD | md2 | Iraq | 16.349 | high |

## Top Points Per Price, Not Recommendations

| Name | Country | Pos | MD | Opponent | Raw | Pts/price | Confidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Hiroki Ito | Japan | DEF | md2 | Tunisia | 6.567 | 1.684 | high |
| Julian Ryerson | Norway | DEF | md1 | Iraq | 6.959 | 1.657 | high |
| Junnosuke Suzuki | Japan | DEF | md2 | Tunisia | 5.552 | 1.586 | high |
| Nicolás Tagliafico | Argentina | DEF | md1 | Algeria | 6.78 | 1.577 | high |
| Nicolás Tagliafico | Argentina | DEF | md3 | Jordan | 6.78 | 1.577 | high |
| Silvan Widmer | Switzerland | DEF | md1 | Qatar | 6.606 | 1.573 | high |
| Nicolás Tagliafico | Argentina | DEF | md2 | Austria | 6.734 | 1.566 | high |
| Santiago Mele | Uruguay | GK | md1 | Saudi Arabia | 5.465 | 1.561 | high |
| Santiago Mele | Uruguay | GK | md2 | Cabo Verde | 5.465 | 1.561 | high |
| Joel Ordóñez | Ecuador | DEF | md2 | Curaçao | 5.938 | 1.523 | high |
| Félix Torres | Ecuador | DEF | md2 | Curaçao | 5.906 | 1.514 | high |
| David Raum | Germany | DEF | md1 | Curaçao | 7.353 | 1.501 | high |
| Mathías Olivera | Uruguay | DEF | md2 | Cabo Verde | 6.392 | 1.487 | high |
| Torbjørn Heggem | Norway | DEF | md1 | Iraq | 5.474 | 1.479 | high |
| Josip Stanisic | Croatia | DEF | md3 | Ghana | 6.349 | 1.477 | high |
| Yahia Fofana | Côte d'Ivoire | GK | md3 | Curaçao | 6.19 | 1.474 | high |
| Nico O'Reilly | England | DEF | md2 | Ghana | 6.925 | 1.473 | high |
| Nico O'Reilly | England | DEF | md3 | Panama | 6.925 | 1.473 | high |
| Camilo Vargas | Colombia | GK | md1 | Uzbekistan | 6.295 | 1.464 | high |
| Camilo Vargas | Colombia | GK | md2 | Congo DR | 6.295 | 1.464 | high |
| Johan Mojica | Colombia | DEF | md1 | Uzbekistan | 5.699 | 1.461 | high |
| Sergio Rochet | Uruguay | GK | md1 | Saudi Arabia | 5.985 | 1.46 | high |
| Sergio Rochet | Uruguay | GK | md2 | Cabo Verde | 5.985 | 1.46 | high |
| Martin Erlic | Croatia | DEF | md3 | Ghana | 5.671 | 1.454 | high |
| Mathías Olivera | Uruguay | DEF | md1 | Saudi Arabia | 6.243 | 1.452 | high |

## High-Risk / High-Projection Players

| Name | Country | Pos | MD | Opponent | Raw | Confidence |
| --- | --- | --- | --- | --- | --- | --- |
| Jamal Musiala | Germany | MID | md1 | Curaçao | 6.412 | medium |
| Jamal Musiala | Germany | MID | md2 | Côte d'Ivoire | 6.306 | medium |
| Ivan Toney | England | FWD | md2 | Ghana | 5.545 | low |
| Ivan Toney | England | FWD | md3 | Panama | 5.545 | low |
| Deniz Undav | Germany | FWD | md1 | Curaçao | 5.111 | medium |

## Low-Confidence High Projections

| Name | Country | Pos | MD | Opponent | Raw | Confidence |
| --- | --- | --- | --- | --- | --- | --- |
| Ivan Toney | England | FWD | md2 | Ghana | 5.545 | low |
| Ivan Toney | England | FWD | md3 | Panama | 5.545 | low |
| Ivan Toney | England | FWD | md1 | Croatia | 4.417 | low |
| Jeremy Arévalo | Ecuador | FWD | md2 | Curaçao | 3.334 | low |
| Julián Quiñones | Mexico | FWD | md1 | South Africa | 3.233 | low |
| Julián Quiñones | Mexico | FWD | md3 | Czechia | 2.816 | low |
| Julián Quiñones | Mexico | FWD | md2 | Korea Republic | 2.809 | low |
| Armando González | Mexico | FWD | md1 | South Africa | 2.726 | low |
| Folarin Balogun | USA | FWD | md2 | Australia | 2.718 | low |
| Guus Til | Netherlands | MID | md3 | Tunisia | 2.678 | low |
| Lennart Karl | Germany | MID | md1 | Curaçao | 2.677 | low |
| Jeremy Arévalo | Ecuador | FWD | md1 | Côte d'Ivoire | 2.632 | low |
| Lennart Karl | Germany | MID | md2 | Côte d'Ivoire | 2.601 | low |
| Igor Thiago Nascimento Rodrigues | Brazil | FWD | md2 | Haiti | 2.564 | low |
| Bamba Dieng | Senegal | FWD | md3 | Iraq | 2.562 | low |
| Malik Tillman | USA | MID | md2 | Australia | 2.551 | low |
| Weston McKennie | USA | MID | md2 | Australia | 2.535 | low |
| Guus Til | Netherlands | MID | md2 | Sweden | 2.486 | low |
| Sander Tangvik | Norway | GK | md1 | Iraq | 2.479 | low |
| Sander Tangvik | Norway | GK | md2 | Senegal | 2.479 | low |
| Sander Tangvik | Norway | GK | md3 | France | 2.479 | low |
| Ricardo Pepi | USA | FWD | md2 | Australia | 2.477 | low |
| Orbelín Pineda | Mexico | MID | md1 | South Africa | 2.449 | low |
| Armando González | Mexico | FWD | md3 | Czechia | 2.395 | low |
| Armando González | Mexico | FWD | md2 | Korea Republic | 2.389 | low |

## Thin-Profile High Projections

| Name | Country | Pos | MD | Opponent | Raw | Confidence |
| --- | --- | --- | --- | --- | --- | --- |
| Endrick Felipe Moreira de Sousa | Brazil | FWD | md2 | Haiti | 0.643 | thin_profile |
| Andrés Gómez | Colombia | FWD | md1 | Uzbekistan | 0.624 | thin_profile |
| Andrés Gómez | Colombia | FWD | md2 | Congo DR | 0.611 | thin_profile |
| Endrick Felipe Moreira de Sousa | Brazil | FWD | md3 | Scotland | 0.603 | thin_profile |
| Ahmed Benbouali | Algeria | FWD | md2 | Jordan | 0.579 | thin_profile |
| Endrick Felipe Moreira de Sousa | Brazil | FWD | md1 | Morocco | 0.567 | thin_profile |
| Fábio Henrique Tavares | Brazil | MID | md2 | Haiti | 0.555 | thin_profile |
| Alexandro Maidana | Paraguay | FWD | md1 | USA | 0.541 | thin_profile |
| Haissem Hassan | Egypt | FWD | md2 | New Zealand | 0.54 | thin_profile |
| Alexandro Maidana | Paraguay | FWD | md3 | Australia | 0.534 | thin_profile |
| Shahriyar Moghanlou | IR Iran | FWD | md1 | New Zealand | 0.532 | thin_profile |
| Gue-Sung Cho | Korea Republic | FWD | md3 | South Africa | 0.529 | thin_profile |
| Hyeon-Gyu Oh | Korea Republic | FWD | md3 | South Africa | 0.529 | thin_profile |
| Hyun-Jun Yang | Korea Republic | FWD | md3 | South Africa | 0.529 | thin_profile |
| Ji-Sung Eom | Korea Republic | FWD | md3 | South Africa | 0.529 | thin_profile |
| Fábio Henrique Tavares | Brazil | MID | md3 | Scotland | 0.526 | thin_profile |
| Haissem Hassan | Egypt | FWD | md3 | IR Iran | 0.512 | thin_profile |
| Ahmed Benbouali | Algeria | FWD | md3 | Austria | 0.506 | thin_profile |
| Andrés Gómez | Colombia | FWD | md3 | Portugal | 0.506 | thin_profile |
| Gue-Sung Cho | Korea Republic | FWD | md1 | Czechia | 0.504 | thin_profile |
| Hyeon-Gyu Oh | Korea Republic | FWD | md1 | Czechia | 0.504 | thin_profile |
| Hyun-Jun Yang | Korea Republic | FWD | md1 | Czechia | 0.504 | thin_profile |
| Ji-Sung Eom | Korea Republic | FWD | md1 | Czechia | 0.504 | thin_profile |
| Nestory Irankunda | Australia | FWD | md2 | USA | 0.502 | thin_profile |
| Mohamed Touré | Australia | FWD | md2 | USA | 0.502 | thin_profile |

## Neymar / Brazil Treatment

Neymar remains a P0 national-team usage source gap. His rows carry `neymar_p0_usage_source_gap` and Brazil fixtures carry `brazil_neymar_usage_source_gap`. The model does not invent Neymar starts, minutes, set-piece role, penalty role, or final squad status.

## v3 vs v2 Comparison

| Metric | Value |
| --- | --- |
| Comparable rows | 3501 |
| Average raw delta | 0.095 |
| Average absolute raw delta | 0.914 |
| Average risk-adjusted delta | 0.35 |

## Largest Differences From v2

| Name | Country | Pos | MD | Opponent | v3 raw | v2 expected | Delta |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Alban Lafont | Côte d'Ivoire | GK | md3 | Curaçao | 0.351 | 8.89 | -8.539 |
| Lionel Messi | Argentina | FWD | md2 | Austria | 8.119 | 15.76 | -7.641 |
| Lionel Messi | Argentina | FWD | md1 | Algeria | 8.119 | 15.7 | -7.581 |
| Lionel Messi | Argentina | FWD | md3 | Jordan | 8.119 | 15.54 | -7.421 |
| Alban Lafont | Côte d'Ivoire | GK | md1 | Ecuador | 0.351 | 7.38 | -7.029 |
| Alban Lafont | Côte d'Ivoire | GK | md2 | Germany | 0.351 | 6.58 | -6.229 |
| Tomás Rodríguez | Panama | FWD | md1 | Ghana | 2.207 | 8.24 | -6.033 |
| Moisés Ramírez | Ecuador | GK | md1 | Côte d'Ivoire | 2.413 | 8.4 | -5.987 |
| Marvin Keller | Switzerland | GK | md1 | Qatar | 0.372 | 6.35 | -5.978 |
| Marvin Keller | Switzerland | GK | md2 | Bosnia and Herzegovina | 0.372 | 6.29 | -5.918 |
| Adam Hlozek | Czechia | FWD | md2 | South Africa | 5.682 | 0.09 | 5.592 |
| Marvin Keller | Switzerland | GK | md3 | Canada | 0.372 | 5.86 | -5.488 |
| Sander Tangvik | Norway | GK | md1 | Iraq | 2.479 | 7.91 | -5.431 |
| Adam Hlozek | Czechia | FWD | md1 | Korea Republic | 5.515 | 0.09 | 5.425 |
| Adam Hlozek | Czechia | FWD | md3 | Mexico | 5.488 | 0.08 | 5.408 |

## Stop Conditions Before Recommendations

| Stop condition | Status | Count | Details |
| --- | --- | --- | --- |
| final_squads_not_source_backed | stop | 48 | Final squads are not source-backed complete; projections remain fantasy_pool_only. |
| official_rules_manual_review | stop | 1 | Official rules still have manual-review warnings. |
| score_predictor_v3_staging_stop_conditions | stop | 1 | Score predictor v3 is fantasy-pool-only and blocked from final public promotion. |
| readiness_not_ready_for_model_rerun | stop | 1 | Official data readiness is blocked_waiting_for_official_fantasy_data. |
| browser_ready_files_not_regenerated | stop | 1 | This session intentionally did not update matchdayProjectionsData.js or any browser-ready file. |
| recommendations_not_built | stop | 1 | This session intentionally did not build recommendations. |
| neymar_p0_usage_source_gap | stop | 1 | Neymar remains a P0 usage source gap and is projected conservatively with uncertainty flags. |

## QA Checks

| Check | Status | Severity | Detail |
| --- | --- | --- | --- |
| modeled_player_matchday_coverage | pass | error | 1256/1256 modeled selectable players have three matchday rows. |
| blocked_players_excluded | pass | error | 225 blocked/not-selectable players are listed separately and excluded from active projection rows. |
| official_price_position_present | pass | error | Every projection row has official price and official fantasy position. |
| projection_numeric_fields | pass | error | Projection numeric fields are present where expected. |
| minutes_bounds | pass | error | Expected minutes stay between 0 and 90. |
| start_probability_bounds | pass | error | Start probability stays between 0 and 1. |
| raw_expected_points_non_negative | pass | error | Raw expected points are non-negative after official scoring components are summed. |
| risk_adjusted_not_above_raw | pass | error | Risk-adjusted points do not exceed raw expected points. |
| captain_score_present | pass | error | Captain score is present for every projection row. |
| added_official_components_in_range | pass | error | 0 rows have added tackle/chance/SOT components that dominate raw points. |
| conservative_prior_components_capped | pass | error | 0 rows exceed conservative prior caps for added scoring categories. |
| thin_profiles_flagged | pass | error | 89 thin-profile players are flagged on their projection rows. |
| missing_usage_flagged | pass | error | 410 players with missing usage are flagged on their projection rows. |
| neymar_brazil_uncertainty_carried | pass | error | 3 Neymar rows carry source-gap uncertainty flags. |
| fantasy_pool_only_flags_present | pass | error | Every row carries fantasy_pool_only. |
| no_final_squad_backed_claims | pass | error | No projection row claims final-squad-backed status. |
| v3_v2_comparison_available | pass | error | 3501 rows can be compared to v2 by internal player ID and fixture. |
| top_projection_outliers_flagged | pass | warning | 41 high projection/captain outlier rows are listed for review. |

## Promotion Decision

These projections are safe for preliminary recommendation staging only. They remain blocked from public promotion and Team Builder use until final squads, official rules warnings, score predictor stop conditions, Neymar's P0 usage gap, and browser-ready regeneration are resolved.
