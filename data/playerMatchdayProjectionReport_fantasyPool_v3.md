# Player Matchday Projection Report Fantasy Pool v3

Generated: 2026-06-17T22:45:32.257Z

## Status

This is a staged `fantasy_pool_only` player matchday projection layer. It is not final-squad-backed, not final public recommendations, not Team Builder-ready, and safe only for preliminary recommendation staging.

| Metric | Value |
| --- | --- |
| Overall QA status | pass_with_staging_stop_conditions |
| Projection rows | 3699 |
| Players projected | 1233 |
| Blocked players | 255 |
| Safe for preliminary recommendation staging | true |
| Safe for final public recommendations | false |
| Safe for Team Builder promotion | false |

## Methodology

The model uses official fantasy player IDs, official prices, official positions, official scoring categories, the preliminary fantasy-pool minutes model, and `scorePredictions_fantasyPool_v3` fixture context. Existing source-backed player performance rates are used where available. Missing event rates use conservative position/team priors and carry explicit data-quality flags. Price is not used as event-rate evidence.

This coverage pass adds separate official-scoring components for midfielder tackles, midfielder chances created, and forward shots on target. Source-backed player rates are used when available; otherwise the added components use small capped priors dampened by expected minutes, role confidence, thin-profile status, and projection confidence.

## Coverage

| Matchday | Rows |
| --- | --- |
| md1 | 1233 |
| md2 | 1233 |
| md3 | 1233 |

## Projections By Position

| Position | Rows |
| --- | --- |
| DEF | 1215 |
| FWD | 801 |
| MID | 1248 |
| GK | 435 |

## Confidence Distribution

| Confidence | Rows |
| --- | --- |
| high | 987 |
| low | 972 |
| medium | 1344 |
| thin_profile | 261 |
| missing | 135 |

## Added Official Scoring Components

| Component | Min | Avg | Max |
| --- | --- | --- | --- |
| Tackle component | 0 | 0.054 | 1.1 |
| Chance-created component | 0 | 0.081 | 1.15 |
| Shot-on-target component | 0 | 0.04 | 0.95 |
| Added components total | 0 | 0.176 | 1.71 |

## Top Added-Component Totals

| Name | Country | Pos | MD | Opponent | Added total | Tackle | Chance | SOT | Confidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Ben Gannon-Doak | Scotland | MID | md1 | Haiti | 1.71 | 1.1 | 0.61 | 0 | high |
| Bruno Miguel Borges Fernandes | Portugal | MID | md1 | Congo DR | 1.566 | 0.416 | 1.15 | 0 | high |
| Bruno Miguel Borges Fernandes | Portugal | MID | md2 | Uzbekistan | 1.566 | 0.416 | 1.15 | 0 | high |
| Bruno Miguel Borges Fernandes | Portugal | MID | md3 | Colombia | 1.566 | 0.416 | 1.15 | 0 | high |
| Ben Gannon-Doak | Scotland | MID | md2 | Morocco | 1.466 | 1.1 | 0.366 | 0 | high |
| Ben Gannon-Doak | Scotland | MID | md3 | Brazil | 1.466 | 1.1 | 0.366 | 0 | high |
| Martin Ødegaard | Norway | MID | md1 | Iraq | 1.461 | 0.314 | 1.147 | 0 | high |
| Jérémy Doku | Belgium | MID | md1 | Egypt | 1.449 | 0.299 | 1.15 | 0 | high |
| Jérémy Doku | Belgium | MID | md2 | IR Iran | 1.449 | 0.299 | 1.15 | 0 | high |
| Jérémy Doku | Belgium | MID | md3 | New Zealand | 1.449 | 0.299 | 1.15 | 0 | high |
| Declan Rice | England | MID | md1 | Croatia | 1.436 | 0.505 | 0.931 | 0 | high |
| Declan Rice | England | MID | md2 | Ghana | 1.436 | 0.505 | 0.931 | 0 | high |
| Declan Rice | England | MID | md3 | Panama | 1.436 | 0.505 | 0.931 | 0 | high |
| Florian Wirtz | Germany | MID | md1 | Curaçao | 1.415 | 0.318 | 1.097 | 0 | high |
| Florian Wirtz | Germany | MID | md2 | Côte d'Ivoire | 1.415 | 0.318 | 1.097 | 0 | high |
| Florian Wirtz | Germany | MID | md3 | Ecuador | 1.41 | 0.318 | 1.092 | 0 | high |
| Bruno Guimarães Rodriguez Moura | Brazil | MID | md2 | Haiti | 1.394 | 0.601 | 0.793 | 0 | high |
| Bruno Guimarães Rodriguez Moura | Brazil | MID | md3 | Scotland | 1.394 | 0.601 | 0.793 | 0 | high |
| Carlos Henrique Casimiro | Brazil | MID | md2 | Haiti | 1.384 | 0.807 | 0.577 | 0 | high |
| Carlos Henrique Casimiro | Brazil | MID | md3 | Scotland | 1.384 | 0.807 | 0.577 | 0 | high |
| Luis Díaz | Colombia | MID | md1 | Uzbekistan | 1.38 | 0.23 | 1.15 | 0 | high |
| Luis Díaz | Colombia | MID | md2 | Congo DR | 1.38 | 0.23 | 1.15 | 0 | high |
| Raphael Dias Belloli | Brazil | MID | md1 | Morocco | 1.38 | 0.23 | 1.15 | 0 | high |
| Raphael Dias Belloli | Brazil | MID | md2 | Haiti | 1.38 | 0.23 | 1.15 | 0 | high |
| Raphael Dias Belloli | Brazil | MID | md3 | Scotland | 1.38 | 0.23 | 1.15 | 0 | high |

## Top Raw Expected Points

| Name | Country | Pos | MD | Opponent | Raw | Confidence |
| --- | --- | --- | --- | --- | --- | --- |
| Michael Olise | France | MID | md2 | Iraq | 8.542 | high |
| Raphael Dias Belloli | Brazil | MID | md2 | Haiti | 8.533 | high |
| Luis Díaz | Colombia | MID | md2 | Congo DR | 8.493 | high |
| Luis Díaz | Colombia | MID | md1 | Uzbekistan | 8.471 | high |
| Raphael Dias Belloli | Brazil | MID | md3 | Scotland | 8.375 | high |
| Ousmane Dembélé | France | MID | md2 | Iraq | 8.278 | high |
| Nuno Alexandre Tavares Mendes | Portugal | DEF | md1 | Congo DR | 8.192 | high |
| Nuno Alexandre Tavares Mendes | Portugal | DEF | md2 | Uzbekistan | 8.135 | high |
| Lionel Messi | Argentina | FWD | md1 | Algeria | 8.119 | high |
| Lionel Messi | Argentina | FWD | md2 | Austria | 8.119 | high |
| Lionel Messi | Argentina | FWD | md3 | Jordan | 8.119 | high |
| Bruno Miguel Borges Fernandes | Portugal | MID | md2 | Uzbekistan | 8.101 | high |
| Michael Olise | France | MID | md3 | Norway | 8.1 | high |
| Raphael Dias Belloli | Brazil | MID | md1 | Morocco | 8.077 | high |
| Bruno Miguel Borges Fernandes | Portugal | MID | md1 | Congo DR | 7.962 | high |
| Vinícius José Paixão de Oliveira Júnior | Brazil | MID | md2 | Haiti | 7.913 | high |
| Ousmane Dembélé | France | MID | md3 | Norway | 7.876 | high |
| Michael Olise | France | MID | md1 | Senegal | 7.861 | high |
| Vinícius José Paixão de Oliveira Júnior | Brazil | MID | md3 | Scotland | 7.807 | high |
| Jamal Musiala | Germany | MID | md1 | Curaçao | 7.733 | medium |
| Jamal Musiala | Germany | MID | md2 | Côte d'Ivoire | 7.625 | medium |
| Lamine Yamal Nasraoui Ebana | Spain | MID | md1 | Cabo Verde | 7.577 | medium |
| Lamine Yamal Nasraoui Ebana | Spain | MID | md2 | Saudi Arabia | 7.568 | medium |
| Harry Kane | England | FWD | md2 | Ghana | 7.552 | high |
| Harry Kane | England | FWD | md3 | Panama | 7.552 | high |

## Top Risk-Adjusted Points

| Name | Country | Pos | MD | Opponent | Risk-adj | Confidence |
| --- | --- | --- | --- | --- | --- | --- |
| Michael Olise | France | MID | md2 | Iraq | 7.944 | high |
| Raphael Dias Belloli | Brazil | MID | md2 | Haiti | 7.936 | high |
| Luis Díaz | Colombia | MID | md2 | Congo DR | 7.899 | high |
| Luis Díaz | Colombia | MID | md1 | Uzbekistan | 7.878 | high |
| Raphael Dias Belloli | Brazil | MID | md3 | Scotland | 7.789 | high |
| Ousmane Dembélé | France | MID | md2 | Iraq | 7.698 | high |
| Nuno Alexandre Tavares Mendes | Portugal | DEF | md1 | Congo DR | 7.618 | high |
| Nuno Alexandre Tavares Mendes | Portugal | DEF | md2 | Uzbekistan | 7.565 | high |
| Lionel Messi | Argentina | FWD | md1 | Algeria | 7.55 | high |
| Lionel Messi | Argentina | FWD | md2 | Austria | 7.55 | high |
| Lionel Messi | Argentina | FWD | md3 | Jordan | 7.55 | high |
| Bruno Miguel Borges Fernandes | Portugal | MID | md2 | Uzbekistan | 7.534 | high |
| Michael Olise | France | MID | md3 | Norway | 7.533 | high |
| Raphael Dias Belloli | Brazil | MID | md1 | Morocco | 7.512 | high |
| Bruno Miguel Borges Fernandes | Portugal | MID | md1 | Congo DR | 7.404 | high |
| Vinícius José Paixão de Oliveira Júnior | Brazil | MID | md2 | Haiti | 7.359 | high |
| Ousmane Dembélé | France | MID | md3 | Norway | 7.324 | high |
| Michael Olise | France | MID | md1 | Senegal | 7.311 | high |
| Vinícius José Paixão de Oliveira Júnior | Brazil | MID | md3 | Scotland | 7.261 | high |
| Harry Kane | England | FWD | md2 | Ghana | 7.023 | high |
| Harry Kane | England | FWD | md3 | Panama | 7.023 | high |
| Ousmane Dembélé | France | MID | md1 | Senegal | 7.01 | high |
| Enzo Fernández | Argentina | MID | md1 | Algeria | 6.957 | high |
| Enzo Fernández | Argentina | MID | md2 | Austria | 6.936 | high |
| Enzo Fernández | Argentina | MID | md3 | Jordan | 6.936 | high |

## Top Captain Scores

| Name | Country | Pos | MD | Opponent | Captain score | Confidence |
| --- | --- | --- | --- | --- | --- | --- |
| Michael Olise | France | MID | md2 | Iraq | 18.517 | high |
| Raphael Dias Belloli | Brazil | MID | md2 | Haiti | 18.501 | high |
| Luis Díaz | Colombia | MID | md1 | Uzbekistan | 18.282 | high |
| Luis Díaz | Colombia | MID | md2 | Congo DR | 18.261 | high |
| Ousmane Dembélé | France | MID | md2 | Iraq | 18.02 | high |
| Raphael Dias Belloli | Brazil | MID | md3 | Scotland | 18.013 | high |
| Lionel Messi | Argentina | FWD | md3 | Jordan | 17.926 | high |
| Lionel Messi | Argentina | FWD | md1 | Algeria | 17.875 | high |
| Lionel Messi | Argentina | FWD | md2 | Austria | 17.827 | high |
| Bruno Miguel Borges Fernandes | Portugal | MID | md2 | Uzbekistan | 17.404 | high |
| Raphael Dias Belloli | Brazil | MID | md1 | Morocco | 17.339 | high |
| Vinícius José Paixão de Oliveira Júnior | Brazil | MID | md2 | Haiti | 17.335 | high |
| Michael Olise | France | MID | md3 | Norway | 17.325 | high |
| Nuno Alexandre Tavares Mendes | Portugal | DEF | md1 | Congo DR | 17.062 | high |
| Bruno Miguel Borges Fernandes | Portugal | MID | md1 | Congo DR | 17.059 | high |
| Ousmane Dembélé | France | MID | md3 | Norway | 16.988 | high |
| Nuno Alexandre Tavares Mendes | Portugal | DEF | md2 | Uzbekistan | 16.988 | high |
| Vinícius José Paixão de Oliveira Júnior | Brazil | MID | md3 | Scotland | 16.945 | high |
| Harry Kane | England | FWD | md2 | Ghana | 16.855 | high |
| Harry Kane | England | FWD | md3 | Panama | 16.782 | high |
| Michael Olise | France | MID | md1 | Senegal | 16.687 | high |
| Kylian Mbappé | France | FWD | md2 | Iraq | 16.348 | high |
| Enzo Fernández | Argentina | MID | md3 | Jordan | 16.297 | high |
| Enzo Fernández | Argentina | MID | md1 | Algeria | 16.289 | high |
| Ousmane Dembélé | France | MID | md1 | Senegal | 16.237 | high |

## Top Points Per Price, Not Recommendations

| Name | Country | Pos | MD | Opponent | Raw | Pts/price | Confidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Hiroki Ito | Japan | DEF | md2 | Tunisia | 6.609 | 1.695 | high |
| Julian Ryerson | Norway | DEF | md1 | Iraq | 6.959 | 1.657 | high |
| Joel Ordóñez | Ecuador | DEF | md2 | Curaçao | 5.816 | 1.491 | high |
| Torbjørn Heggem | Norway | DEF | md1 | Iraq | 5.474 | 1.479 | high |
| Josip Stanisic | Croatia | DEF | md3 | Ghana | 6.326 | 1.471 | high |
| Camilo Vargas | Colombia | GK | md1 | Uzbekistan | 6.295 | 1.464 | high |
| Johan Mojica | Colombia | DEF | md1 | Uzbekistan | 5.699 | 1.461 | high |
| Mathías Olivera | Uruguay | DEF | md2 | Cabo Verde | 6.277 | 1.46 | high |
| Mathías Olivera | Uruguay | DEF | md1 | Saudi Arabia | 6.243 | 1.452 | high |
| Nico O'Reilly | England | DEF | md2 | Ghana | 6.81 | 1.449 | high |
| Nico O'Reilly | England | DEF | md3 | Panama | 6.81 | 1.449 | high |
| Santiago Arias | Colombia | DEF | md1 | Uzbekistan | 5.639 | 1.446 | high |
| Yahia Fofana | Côte d'Ivoire | GK | md3 | Curaçao | 6.065 | 1.444 | high |
| Ritsu Doan | Japan | DEF | md2 | Tunisia | 7.352 | 1.442 | high |
| Johan Mojica | Colombia | DEF | md2 | Congo DR | 5.603 | 1.437 | high |
| Camilo Vargas | Colombia | GK | md2 | Congo DR | 6.171 | 1.435 | high |
| Emmanuel Agbadou | Côte d'Ivoire | DEF | md3 | Curaçao | 5.574 | 1.429 | high |
| Santiago Arias | Colombia | DEF | md2 | Congo DR | 5.548 | 1.423 | high |
| Daniel Muñoz | Colombia | DEF | md1 | Uzbekistan | 6.538 | 1.421 | high |
| Nuno Alexandre Tavares Mendes | Portugal | DEF | md1 | Congo DR | 8.192 | 1.412 | high |
| Daniel Muñoz | Colombia | DEF | md2 | Congo DR | 6.465 | 1.405 | high |
| Nuno Alexandre Tavares Mendes | Portugal | DEF | md2 | Uzbekistan | 8.135 | 1.403 | high |
| Joel Ordóñez | Ecuador | DEF | md1 | Côte d'Ivoire | 5.434 | 1.393 | high |
| Guillermo Varela | Uruguay | DEF | md2 | Cabo Verde | 5.786 | 1.378 | high |
| Guillermo Varela | Uruguay | DEF | md1 | Saudi Arabia | 5.783 | 1.377 | high |

## High-Risk / High-Projection Players

| Name | Country | Pos | MD | Opponent | Raw | Confidence |
| --- | --- | --- | --- | --- | --- | --- |
| Jamal Musiala | Germany | MID | md1 | Curaçao | 7.733 | medium |
| Jamal Musiala | Germany | MID | md2 | Côte d'Ivoire | 7.625 | medium |
| Lamine Yamal Nasraoui Ebana | Spain | MID | md1 | Cabo Verde | 7.577 | medium |
| Lamine Yamal Nasraoui Ebana | Spain | MID | md2 | Saudi Arabia | 7.568 | medium |
| Jamal Musiala | Germany | MID | md3 | Ecuador | 7.091 | medium |
| Lamine Yamal Nasraoui Ebana | Spain | MID | md3 | Uruguay | 7.077 | medium |
| Julián Quiñones | Mexico | FWD | md1 | South Africa | 6.442 | missing |
| Julián Quiñones | Mexico | FWD | md3 | Czechia | 6.334 | missing |
| Julián Quiñones | Mexico | FWD | md2 | Korea Republic | 6.331 | missing |
| Bradley Barcola | France | MID | md2 | Iraq | 5.947 | medium |
| Jonathan David | Canada | FWD | md2 | Qatar | 5.861 | medium |
| Igor Thiago Nascimento Rodrigues | Brazil | FWD | md2 | Haiti | 5.75 | missing |
| Christian Pulisic | USA | MID | md2 | Australia | 5.744 | medium |
| Adam Hlozek | Czechia | FWD | md2 | South Africa | 5.456 | medium |
| Igor Thiago Nascimento Rodrigues | Brazil | FWD | md3 | Scotland | 5.433 | missing |
| Bradley Barcola | France | MID | md3 | Norway | 5.335 | medium |
| Sasa Kalajdzic | Austria | FWD | md1 | Jordan | 5.321 | missing |
| Adam Hlozek | Czechia | FWD | md1 | Korea Republic | 5.271 | medium |
| Adam Hlozek | Czechia | FWD | md3 | Mexico | 5.25 | medium |
| Kai Havertz | Germany | FWD | md1 | Curaçao | 5.133 | medium |
| Kai Havertz | Germany | FWD | md2 | Côte d'Ivoire | 5.133 | medium |
| Wilfried Singo | Côte d'Ivoire | DEF | md3 | Curaçao | 5.127 | missing |
| Romelu Lukaku | Belgium | FWD | md3 | New Zealand | 5.114 | medium |
| Bilal El Khannouss | Morocco | MID | md3 | Haiti | 5.028 | missing |

## Low-Confidence High Projections

| Name | Country | Pos | MD | Opponent | Raw | Confidence |
| --- | --- | --- | --- | --- | --- | --- |
| Julián Quiñones | Mexico | FWD | md1 | South Africa | 6.442 | missing |
| Julián Quiñones | Mexico | FWD | md3 | Czechia | 6.334 | missing |
| Julián Quiñones | Mexico | FWD | md2 | Korea Republic | 6.331 | missing |
| Igor Thiago Nascimento Rodrigues | Brazil | FWD | md2 | Haiti | 5.75 | missing |
| Igor Thiago Nascimento Rodrigues | Brazil | FWD | md3 | Scotland | 5.433 | missing |
| Sasa Kalajdzic | Austria | FWD | md1 | Jordan | 5.321 | missing |
| Wilfried Singo | Côte d'Ivoire | DEF | md3 | Curaçao | 5.127 | missing |
| Bilal El Khannouss | Morocco | MID | md3 | Haiti | 5.028 | missing |
| Richie Laryea | Canada | DEF | md2 | Qatar | 4.898 | missing |
| Jesús Gallardo | Mexico | DEF | md1 | South Africa | 4.832 | missing |
| Sasa Kalajdzic | Austria | FWD | md3 | Algeria | 4.75 | missing |
| Crysencio Summerville | Netherlands | MID | md3 | Tunisia | 4.676 | missing |
| Tani Oluwaseyi | Canada | FWD | md2 | Qatar | 4.615 | missing |
| Igor Thiago Nascimento Rodrigues | Brazil | FWD | md1 | Morocco | 4.53 | missing |
| Crysencio Summerville | Netherlands | MID | md2 | Sweden | 4.485 | missing |
| Ivan Toney | England | FWD | md2 | Ghana | 4.429 | low |
| Ivan Toney | England | FWD | md3 | Panama | 4.429 | low |
| Elye Wahi | Côte d'Ivoire | FWD | md3 | Curaçao | 4.367 | missing |
| Maxime Crépeau | Canada | GK | md2 | Qatar | 4.364 | missing |
| Tomás Lemos Araújo | Portugal | DEF | md1 | Congo DR | 4.353 | missing |
| Tomás Lemos Araújo | Portugal | DEF | md2 | Uzbekistan | 4.306 | missing |
| Issa Diop | Morocco | DEF | md3 | Haiti | 4.306 | missing |
| Fernando Muslera | Uruguay | GK | md1 | Saudi Arabia | 4.191 | missing |
| Raúl Rangel | Mexico | GK | md1 | South Africa | 4.188 | missing |
| Fernando Muslera | Uruguay | GK | md2 | Cabo Verde | 4.112 | missing |

## Thin-Profile High Projections

| Name | Country | Pos | MD | Opponent | Raw | Confidence |
| --- | --- | --- | --- | --- | --- | --- |
| Marcos Aoás Corrêa | Brazil | DEF | md2 | Haiti | 3.865 | thin_profile |
| Roger Ibañez da Silva | Brazil | DEF | md2 | Haiti | 3.865 | thin_profile |
| Marcos Aoás Corrêa | Brazil | DEF | md1 | Morocco | 3.827 | thin_profile |
| Roger Ibañez da Silva | Brazil | DEF | md1 | Morocco | 3.827 | thin_profile |
| Marcos Aoás Corrêa | Brazil | DEF | md3 | Scotland | 3.736 | thin_profile |
| Roger Ibañez da Silva | Brazil | DEF | md3 | Scotland | 3.736 | thin_profile |
| Seung-Gyu Kim | Korea Republic | GK | md3 | South Africa | 3.31 | thin_profile |
| Omar Alderete | Paraguay | DEF | md3 | Australia | 3.206 | thin_profile |
| Ali Nemati | IR Iran | DEF | md1 | New Zealand | 3.072 | thin_profile |
| Min-Jae Kim | Korea Republic | DEF | md3 | South Africa | 3.07 | thin_profile |
| Young-Woo Seol | Korea Republic | DEF | md3 | South Africa | 3.07 | thin_profile |
| Han-Beom Lee | Korea Republic | DEF | md3 | South Africa | 3.07 | thin_profile |
| Tae-Seok Lee | Korea Republic | DEF | md3 | South Africa | 3.07 | thin_profile |
| Gi-Hyuk Lee | Korea Republic | DEF | md3 | South Africa | 3.07 | thin_profile |
| Seung-Gyu Kim | Korea Republic | GK | md1 | Czechia | 2.919 | thin_profile |
| Josimar José Évora Dias | Cabo Verde | GK | md3 | Saudi Arabia | 2.815 | thin_profile |
| Omar Alderete | Paraguay | DEF | md1 | USA | 2.664 | thin_profile |
| Patrick Beach | Australia | GK | md2 | USA | 2.607 | thin_profile |
| Patrick Beach | Australia | GK | md3 | Paraguay | 2.595 | thin_profile |
| Seung-Gyu Kim | Korea Republic | GK | md2 | Mexico | 2.551 | thin_profile |
| Mohanad Mostafa Ahmed Abdelmonem Lasheen | Egypt | MID | md2 | New Zealand | 2.511 | thin_profile |
| Mostafa Mohamed Zaki Abdelraouf | Egypt | MID | md2 | New Zealand | 2.511 | thin_profile |
| Min-Jae Kim | Korea Republic | DEF | md1 | Czechia | 2.458 | thin_profile |
| Young-Woo Seol | Korea Republic | DEF | md1 | Czechia | 2.458 | thin_profile |
| Han-Beom Lee | Korea Republic | DEF | md1 | Czechia | 2.458 | thin_profile |

## Neymar / Brazil Treatment

Neymar remains a P0 national-team usage source gap. His rows carry `neymar_p0_usage_source_gap` and Brazil fixtures carry `brazil_neymar_usage_source_gap`. The model does not invent Neymar starts, minutes, set-piece role, penalty role, or final squad status.

## v3 vs v2 Comparison

| Metric | Value |
| --- | --- |
| Comparable rows | 3438 |
| Average raw delta | -0.003 |
| Average absolute raw delta | 0.995 |
| Average risk-adjusted delta | 0.182 |

## Largest Differences From v2

| Name | Country | Pos | MD | Opponent | v3 raw | v2 expected | Delta |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Alban Lafont | Côte d'Ivoire | GK | md3 | Curaçao | 0.276 | 8.89 | -8.614 |
| Lionel Messi | Argentina | FWD | md2 | Austria | 8.119 | 15.76 | -7.641 |
| Lionel Messi | Argentina | FWD | md1 | Algeria | 8.119 | 15.7 | -7.581 |
| Lionel Messi | Argentina | FWD | md3 | Jordan | 8.119 | 15.54 | -7.421 |
| Alban Lafont | Côte d'Ivoire | GK | md1 | Ecuador | 0.276 | 7.38 | -7.104 |
| Moisés Ramírez | Ecuador | GK | md1 | Côte d'Ivoire | 1.717 | 8.4 | -6.683 |
| Alban Lafont | Côte d'Ivoire | GK | md2 | Germany | 0.276 | 6.58 | -6.304 |
| Marvin Keller | Switzerland | GK | md1 | Qatar | 0.292 | 6.35 | -6.058 |
| Tomás Rodríguez | Panama | FWD | md1 | Ghana | 2.207 | 8.24 | -6.033 |
| Marvin Keller | Switzerland | GK | md2 | Bosnia and Herzegovina | 0.292 | 6.29 | -5.998 |
| Sander Tangvik | Norway | GK | md1 | Iraq | 1.942 | 7.91 | -5.968 |
| Moisés Ramírez | Ecuador | GK | md2 | Curaçao | 1.723 | 7.53 | -5.807 |
| Marvin Keller | Switzerland | GK | md3 | Canada | 0.292 | 5.86 | -5.568 |
| Adam Hlozek | Czechia | FWD | md2 | South Africa | 5.456 | 0.09 | 5.366 |
| Adam Hlozek | Czechia | FWD | md1 | Korea Republic | 5.271 | 0.09 | 5.181 |

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
| modeled_player_matchday_coverage | pass | error | 1233/1233 modeled selectable players have three matchday rows. |
| blocked_players_excluded | pass | error | 255 blocked/not-selectable players are listed separately and excluded from active projection rows. |
| official_price_position_present | pass | error | Every projection row has official price and official fantasy position. |
| projection_numeric_fields | pass | error | Projection numeric fields are present where expected. |
| minutes_bounds | pass | error | Expected minutes stay between 0 and 90. |
| start_probability_bounds | pass | error | Start probability stays between 0 and 1. |
| raw_expected_points_non_negative | pass | error | Raw expected points are non-negative after official scoring components are summed. |
| risk_adjusted_not_above_raw | pass | error | Risk-adjusted points do not exceed raw expected points. |
| captain_score_present | pass | error | Captain score is present for every projection row. |
| added_official_components_in_range | pass | error | 0 rows have added tackle/chance/SOT components that dominate raw points. |
| conservative_prior_components_capped | pass | error | 0 rows exceed conservative prior caps for added scoring categories. |
| thin_profiles_flagged | pass | error | 87 thin-profile players are flagged on their projection rows. |
| missing_usage_flagged | pass | error | 400 players with missing usage are flagged on their projection rows. |
| neymar_brazil_uncertainty_carried | pass | error | 3 Neymar rows carry source-gap uncertainty flags. |
| fantasy_pool_only_flags_present | pass | error | Every row carries fantasy_pool_only. |
| no_final_squad_backed_claims | pass | error | No projection row claims final-squad-backed status. |
| v3_v2_comparison_available | pass | error | 3438 rows can be compared to v2 by internal player ID and fixture. |
| top_projection_outliers_flagged | pass | warning | 48 high projection/captain outlier rows are listed for review. |

## Promotion Decision

These projections are safe for preliminary recommendation staging only. They remain blocked from public promotion and Team Builder use until final squads, official rules warnings, score predictor stop conditions, Neymar's P0 usage gap, and browser-ready regeneration are resolved.
