# Recommendation Finance Value Audit Fantasy Pool v3

Generated: 2026-06-03T16:56:58.583Z

Model stage: fantasy_pool_only. This audit does not promote recommendations, does not update active v2 recommendations, does not update browser-ready files, and does not make Team Builder, captain/substitution, or UX changes.

## Summary

- Recommendation QA status: pass_with_staging_stop_conditions.
- Finance diagnostic rows: 4992.
- Efficient-frontier rows: 61.
- Dominated rows: 4931.
- Above-replacement rows: 256.
- Differential candidates on efficient frontier: 41.
- Differential candidates dominated: 59.
- Balanced vs Differential top-10 overlap: 0.
- Balanced vs Differential top-25 overlap: 1.
- Safe for preliminary review: true.
- Safe for public recommendations: false.

## Methodology

- Value over replacement: Replacement level is position-specific within each scope: GK 12th, DEF 20th, MID 20th, FWD 16th by risk-adjusted points.
- Scarcity-adjusted value: Value over replacement plus small capped scarcity bonuses for position depth, price-tier depth, matchday depth, and country diversification. Scarcity is deliberately small so it cannot dominate raw quality.
- Efficient frontier: A row is frontier-eligible when it is not clearly dominated by another row at the same position or same price band with similar or better points, lower or similar price, equal/better confidence, and no worse major risk flags.
- Opportunity cost: Difference between a row's risk-adjusted points and the best risk-adjusted points in the same price-tier/position group.
- Ownership policy: No ownership data is used; obviousness is approximated only from staged mode ranks, raw/captain rank, and price percentile.

## Rank Correlation Between Modes

| Pair | Compared rows | Rank limit | Spearman rank correlation |
| --- | --- | --- | --- |
| balanced_vs_safe | 142 | 100 | 0.1915 |
| balanced_vs_upside | 165 | 100 | -0.316 |
| balanced_vs_differential | 166 | 100 | -0.3154 |
| balanced_vs_captain | 143 | 100 | 0.1698 |
| safe_vs_upside | 182 | 100 | -0.498 |
| safe_vs_differential | 189 | 100 | -0.5701 |
| safe_vs_captain | 166 | 100 | -0.196 |
| upside_vs_differential | 136 | 100 | -0.0085 |
| upside_vs_captain | 172 | 100 | -0.501 |
| differential_vs_captain | 166 | 100 | -0.4368 |

## Mode Overlap

| Pair | Top-10 overlap | Top-25 overlap |
| --- | --- | --- |
| Balanced vs Safe | 2 | 8 |
| Balanced vs Differential | 0 | 1 |
| Safe vs Differential | 0 | 0 |
| Upside vs Captain Alpha | 0 | 0 |

## Mode Winners

| Mode | Winner | Country | Pos | Scope | Score | Price |
| --- | --- | --- | --- | --- | --- | --- |
| Balanced | Lionel Messi | Argentina | FWD | md3 | 82.947 | 10 |
| Safe | Camilo Vargas | Colombia | GK | md1 | 89.896 | 4.3 |
| Upside | Luis Suárez | Colombia | FWD | md1 | 77.474 | 5.7 |
| Differential | Giorgian de Arrascaeta | Uruguay | MID | md1 | 88.724 | 6.5 |
| Captain Alpha | Lionel Messi | Argentina | FWD | md3 | 98.178 | 10 |

## Mode Distributions

| Mode | Positions | Price buckets | Confidence | Matchdays | Top countries |
| --- | --- | --- | --- | --- | --- |
| Balanced | DEF: 40; MID: 24; FWD: 23; GK: 13 | 8.0+: 37; 4.0-4.9: 33; 5.0-6.4: 17; 6.5-7.9: 9; under_4.0: 4 | high: 100 | group_stage_full: 25; md1: 25; md2: 25; md3: 25 | Argentina: 24; Colombia: 12; England: 10; Spain: 10; Portugal: 9; France: 8; Germany: 5; Japan: 4; Belgium: 3; Brazil: 3 |
| Safe | DEF: 40; GK: 24; MID: 20; FWD: 16 | 4.0-4.9: 40; 5.0-6.4: 25; 8.0+: 19; 6.5-7.9: 15; under_4.0: 1 | high: 100 | group_stage_full: 25; md1: 25; md2: 25; md3: 25 | Argentina: 23; England: 19; Portugal: 15; Colombia: 12; Spain: 8; Germany: 5; Netherlands: 5; Belgium: 4; Brazil: 2; France: 2 |
| Upside | FWD: 40; DEF: 31; MID: 29 | 5.0-6.4: 42; 4.0-4.9: 33; 6.5-7.9: 18; 8.0+: 6; under_4.0: 1 | high: 99; medium: 1 | group_stage_full: 25; md1: 25; md2: 25; md3: 25 | Argentina: 18; Croatia: 11; Portugal: 8; Belgium: 7; Colombia: 7; Spain: 6; England: 5; Germany: 5; Japan: 5; Netherlands: 5 |
| Differential | DEF: 35; FWD: 29; MID: 28; GK: 8 | 5.0-6.4: 39; 4.0-4.9: 28; under_4.0: 14; 6.5-7.9: 12; 8.0+: 7 | high: 100 | group_stage_full: 25; md1: 25; md2: 25; md3: 25 | Argentina: 12; Colombia: 11; Uruguay: 10; Japan: 9; Croatia: 8; Ecuador: 8; Belgium: 7; Portugal: 6; England: 5; Spain: 5 |
| Captain Alpha | FWD: 48; MID: 40; DEF: 12 | 8.0+: 50; 6.5-7.9: 27; 5.0-6.4: 17; 4.0-4.9: 6 | high: 100 | group_stage_full: 25; md1: 25; md2: 25; md3: 25 | Argentina: 20; Portugal: 12; Spain: 9; France: 8; England: 7; Uruguay: 7; Belgium: 4; Germany: 4; Brazil: 3; Colombia: 3 |

## Distinct Purpose Assessment

- Balanced: best all-around staged candidate score. It should correlate with most modes but not define Differential alone.
- Safe: floor, minutes, role/confidence, and low data-quality risk. Balanced/Safe overlap is natural.
- Upside: ceiling and attacking context per official price. It should surface explosive non-captain value rather than repeat the armband list.
- Captain Alpha: captain-relevant ceiling and starts; not pure value.
- Differential: defensible lower-obviousness value. It now uses value over replacement, scarcity-adjusted value, frontier status, and opportunity cost, while retaining an obviousness penalty.

Differential has limited overlap where finance value supports it, which is the intended softer behavior.

## Value Over Replacement Leaders

| Name | Country | Pos | Scope | Opponent | Price | Risk | VOR | Scarcity value | Pts/price | Risk/price | Frontier | Dominated | Opp cost | Def score |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Lionel Messi | Argentina | FWD | group_stage_full | Group stage average | 10 | 22.65 | 9.009 | 9.109 | 2.4357 | 2.265 | true | false | 0 | 100 |
| Lamine Yamal Nasraoui Ebana | Spain | MID | group_stage_full | Group stage average | 10 | 24.011 | 7.559 | 8.132 | 2.5819 | 2.4011 | true | false | 0 | 100 |
| Harry Kane | England | FWD | group_stage_full | Group stage average | 10.5 | 20.803 | 7.162 | 7.342 | 2.1304 | 1.9812 | false | true | 1.847 | 96.227 |
| Raphael Dias Belloli | Brazil | MID | group_stage_full | Group stage average | 8.2 | 23.187 | 6.735 | 7.308 | 3.0402 | 2.8277 | true | false | 0.824 | 100 |
| Kylian Mbappé | France | FWD | group_stage_full | Group stage average | 10.5 | 19.907 | 6.266 | 6.446 | 2.0386 | 1.8959 | false | true | 2.743 | 92.475 |
| Michael Olise | France | MID | group_stage_full | Group stage average | 9.5 | 22.576 | 6.124 | 6.697 | 2.5553 | 2.3764 | false | true | 1.435 | 89.715 |
| Nuno Alexandre Tavares Mendes | Portugal | DEF | group_stage_full | Group stage average | 5.8 | 20.164 | 5.046 | 5.69 | 3.7379 | 3.4766 | true | false | 0 | 100 |
| Luis Díaz | Colombia | MID | group_stage_full | Group stage average | 8.1 | 20.979 | 4.527 | 5.18 | 2.7851 | 2.59 | true | false | 3.032 | 100 |
| Vinícius José Paixão de Oliveira Júnior | Brazil | MID | group_stage_full | Group stage average | 10 | 20.859 | 4.407 | 4.98 | 2.2429 | 2.0859 | false | true | 3.152 | 85.523 |
| Enzo Fernández | Argentina | MID | group_stage_full | Group stage average | 7.5 | 20.792 | 4.34 | 4.833 | 2.9811 | 2.7723 | true | false | 0 | 100 |
| Lautaro Martínez | Argentina | FWD | group_stage_full | Group stage average | 8.8 | 17.914 | 4.273 | 4.373 | 2.1889 | 2.0357 | false | true | 4.736 | 85.052 |
| Cristiano Ronaldo dos Santos Aveiro | Portugal | FWD | group_stage_full | Group stage average | 10 | 17.589 | 3.948 | 4.128 | 1.8912 | 1.7589 | false | true | 5.061 | 81.997 |
| Bruno Miguel Borges Fernandes | Portugal | MID | group_stage_full | Group stage average | 8.5 | 20.317 | 3.865 | 4.438 | 2.57 | 2.3902 | false | true | 3.694 | 87.879 |
| Nicolás Tagliafico | Argentina | DEF | group_stage_full | Group stage average | 4.3 | 18.873 | 3.755 | 4.319 | 4.7195 | 4.3891 | true | false | 0 | 100 |
| Julián Alvarez | Argentina | FWD | group_stage_full | Group stage average | 8.6 | 16.988 | 3.347 | 3.447 | 2.124 | 1.9753 | false | true | 5.662 | 74.844 |

## Scarcity-Adjusted Value Leaders

| Name | Country | Pos | Scope | Opponent | Price | Risk | VOR | Scarcity value | Pts/price | Risk/price | Frontier | Dominated | Opp cost | Def score |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Lionel Messi | Argentina | FWD | group_stage_full | Group stage average | 10 | 22.65 | 9.009 | 9.109 | 2.4357 | 2.265 | true | false | 0 | 100 |
| Lamine Yamal Nasraoui Ebana | Spain | MID | group_stage_full | Group stage average | 10 | 24.011 | 7.559 | 8.132 | 2.5819 | 2.4011 | true | false | 0 | 100 |
| Harry Kane | England | FWD | group_stage_full | Group stage average | 10.5 | 20.803 | 7.162 | 7.342 | 2.1304 | 1.9812 | false | true | 1.847 | 96.227 |
| Raphael Dias Belloli | Brazil | MID | group_stage_full | Group stage average | 8.2 | 23.187 | 6.735 | 7.308 | 3.0402 | 2.8277 | true | false | 0.824 | 100 |
| Michael Olise | France | MID | group_stage_full | Group stage average | 9.5 | 22.576 | 6.124 | 6.697 | 2.5553 | 2.3764 | false | true | 1.435 | 89.715 |
| Kylian Mbappé | France | FWD | group_stage_full | Group stage average | 10.5 | 19.907 | 6.266 | 6.446 | 2.0386 | 1.8959 | false | true | 2.743 | 92.475 |
| Nuno Alexandre Tavares Mendes | Portugal | DEF | group_stage_full | Group stage average | 5.8 | 20.164 | 5.046 | 5.69 | 3.7379 | 3.4766 | true | false | 0 | 100 |
| Luis Díaz | Colombia | MID | group_stage_full | Group stage average | 8.1 | 20.979 | 4.527 | 5.18 | 2.7851 | 2.59 | true | false | 3.032 | 100 |
| Vinícius José Paixão de Oliveira Júnior | Brazil | MID | group_stage_full | Group stage average | 10 | 20.859 | 4.407 | 4.98 | 2.2429 | 2.0859 | false | true | 3.152 | 85.523 |
| Enzo Fernández | Argentina | MID | group_stage_full | Group stage average | 7.5 | 20.792 | 4.34 | 4.833 | 2.9811 | 2.7723 | true | false | 0 | 100 |
| Bruno Miguel Borges Fernandes | Portugal | MID | group_stage_full | Group stage average | 8.5 | 20.317 | 3.865 | 4.438 | 2.57 | 2.3902 | false | true | 3.694 | 87.879 |
| Lautaro Martínez | Argentina | FWD | group_stage_full | Group stage average | 8.8 | 17.914 | 4.273 | 4.373 | 2.1889 | 2.0357 | false | true | 4.736 | 85.052 |
| Nicolás Tagliafico | Argentina | DEF | group_stage_full | Group stage average | 4.3 | 18.873 | 3.755 | 4.319 | 4.7195 | 4.3891 | true | false | 0 | 100 |
| Cristiano Ronaldo dos Santos Aveiro | Portugal | FWD | group_stage_full | Group stage average | 10 | 17.589 | 3.948 | 4.128 | 1.8912 | 1.7589 | false | true | 5.061 | 81.997 |
| Nico O'Reilly | England | DEF | group_stage_full | Group stage average | 4.7 | 18.133 | 3.015 | 3.659 | 4.1487 | 3.8581 | false | true | 0.74 | 88.399 |

## Risk-Adjusted Points Per Price Leaders

| Name | Country | Pos | Scope | Opponent | Price | Risk | VOR | Scarcity value | Pts/price | Risk/price | Frontier | Dominated | Opp cost | Def score |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Nicolás Tagliafico | Argentina | DEF | group_stage_full | Group stage average | 4.3 | 18.873 | 3.755 | 4.319 | 4.7195 | 4.3891 | true | false | 0 | 100 |
| Nahuel Molina | Argentina | DEF | group_stage_full | Group stage average | 4.4 | 17.143 | 2.025 | 2.589 | 4.1895 | 3.8961 | false | true | 1.73 | 77.177 |
| Silvan Widmer | Switzerland | DEF | group_stage_full | Group stage average | 4.2 | 16.21 | 1.092 | 1.886 | 4.1498 | 3.8595 | true | false | 2.663 | 83.164 |
| Nico O'Reilly | England | DEF | group_stage_full | Group stage average | 4.7 | 18.133 | 3.015 | 3.659 | 4.1487 | 3.8581 | false | true | 0.74 | 88.399 |
| Jarell Quansah | England | DEF | group_stage_full | Group stage average | 4.4 | 15.874 | 0.756 | 1.4 | 3.8791 | 3.6077 | false | true | 2.999 | 58.736 |
| Gonzalo Montiel | Argentina | DEF | group_stage_full | Group stage average | 4.3 | 15.489 | 0.371 | 0.935 | 3.8733 | 3.6021 | false | true | 3.384 | 49.115 |
| Nicolás Otamendi | Argentina | DEF | group_stage_full | Group stage average | 4.4 | 15.768 | 0.65 | 1.214 | 3.8534 | 3.5836 | false | true | 3.105 | 59.662 |
| Camilo Vargas | Colombia | GK | group_stage_full | Group stage average | 4.3 | 15.394 | 1.78 | 2.12 | 3.8491 | 3.58 | false | true | 0 | 80.38 |
| Santiago Mele | Uruguay | GK | group_stage_full | Group stage average | 3.5 | 12.254 | -1.36 | -0.78 | 3.7649 | 3.5011 | true | false | 0 | 65.244 |
| David Raum | Germany | DEF | group_stage_full | Group stage average | 4.9 | 17.04 | 1.922 | 2.646 | 3.7394 | 3.4776 | false | true | 1.833 | 75.378 |
| Nuno Alexandre Tavares Mendes | Portugal | DEF | group_stage_full | Group stage average | 5.8 | 20.164 | 5.046 | 5.69 | 3.7379 | 3.4766 | true | false | 0 | 100 |
| Hiroki Ito | Japan | DEF | group_stage_full | Group stage average | 3.9 | 13.482 | -1.636 | -1.012 | 3.7169 | 3.4569 | true | false | 0 | 62.537 |
| Johan Mojica | Colombia | DEF | group_stage_full | Group stage average | 3.9 | 13.394 | -1.724 | -1.17 | 3.6928 | 3.4344 | true | false | 0.088 | 62.341 |
| Santiago Arias | Colombia | DEF | group_stage_full | Group stage average | 3.9 | 13.33 | -1.788 | -1.234 | 3.6749 | 3.4179 | true | false | 0.152 | 59.985 |
| Zeno Debast | Belgium | DEF | group_stage_full | Group stage average | 4.3 | 14.521 | -0.597 | 0.127 | 3.6312 | 3.377 | false | true | 4.352 | 42.567 |

## Efficient Frontier Sample

| Name | Country | Pos | Scope | Opponent | Price | Risk | VOR | Scarcity value | Pts/price | Risk/price | Frontier | Dominated | Opp cost | Def score |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Lionel Messi | Argentina | FWD | group_stage_full | Group stage average | 10 | 22.65 | 9.009 | 9.109 | 2.4357 | 2.265 | true | false | 0 | 100 |
| Lamine Yamal Nasraoui Ebana | Spain | MID | group_stage_full | Group stage average | 10 | 24.011 | 7.559 | 8.132 | 2.5819 | 2.4011 | true | false | 0 | 100 |
| Raphael Dias Belloli | Brazil | MID | group_stage_full | Group stage average | 8.2 | 23.187 | 6.735 | 7.308 | 3.0402 | 2.8277 | true | false | 0.824 | 100 |
| Nuno Alexandre Tavares Mendes | Portugal | DEF | group_stage_full | Group stage average | 5.8 | 20.164 | 5.046 | 5.69 | 3.7379 | 3.4766 | true | false | 0 | 100 |
| Luis Díaz | Colombia | MID | group_stage_full | Group stage average | 8.1 | 20.979 | 4.527 | 5.18 | 2.7851 | 2.59 | true | false | 3.032 | 100 |
| Enzo Fernández | Argentina | MID | group_stage_full | Group stage average | 7.5 | 20.792 | 4.34 | 4.833 | 2.9811 | 2.7723 | true | false | 0 | 100 |
| Nicolás Tagliafico | Argentina | DEF | group_stage_full | Group stage average | 4.3 | 18.873 | 3.755 | 4.319 | 4.7195 | 4.3891 | true | false | 0 | 100 |
| Emiliano Martínez | Argentina | GK | group_stage_full | Group stage average | 5 | 16.878 | 3.264 | 3.614 | 3.6294 | 3.3756 | true | false | 0 | 100 |
| Lionel Messi | Argentina | FWD | md3 | Jordan | 10 | 7.55 | 2.658 | 3.488 | 0.8119 | 0.755 | true | false | 0 | 100 |
| Lamine Yamal Nasraoui Ebana | Spain | MID | md1 | Cabo Verde | 10 | 8.076 | 2.69 | 3.487 | 0.8684 | 0.8076 | true | false | 0 | 97.261 |
| Mikel Oyarzabal | Spain | FWD | group_stage_full | Group stage average | 8.1 | 16.88 | 3.239 | 3.419 | 2.2409 | 2.084 | true | false | 5.77 | 91.036 |
| Nuno Alexandre Tavares Mendes | Portugal | DEF | md1 | Congo DR | 5.8 | 7.62 | 2.344 | 3.383 | 1.4126 | 1.3138 | true | false | 0 | 100 |
| Lamine Yamal Nasraoui Ebana | Spain | MID | md3 | Uruguay | 10 | 7.859 | 2.413 | 3.352 | 0.8451 | 0.7859 | true | false | 0 | 95.056 |
| Lionel Messi | Argentina | FWD | md1 | Algeria | 10 | 7.55 | 2.811 | 3.341 | 0.8119 | 0.755 | true | false | 0 | 100 |
| Luis Díaz | Colombia | MID | md1 | Uzbekistan | 8.1 | 7.877 | 2.491 | 3.288 | 1.0457 | 0.9725 | true | false | 0.199 | 96.562 |

## Dominated Player Sample

| Name | Country | Pos | Scope | Opponent | Price | Risk | VOR | Scarcity value | Pts/price | Risk/price | Frontier | Dominated | Opp cost | Def score |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Min-Jae Kim | Korea Republic | DEF | group_stage_full | Group stage average | 5 | 0.184 | -14.934 | -14.14 | 0.2456 | 0.0368 | false | true | 19.98 | 0 |
| Marcos Aoás Corrêa | Brazil | DEF | group_stage_full | Group stage average | 5.2 | 0.234 | -14.884 | -14.24 | 0.254 | 0.045 | false | true | 19.93 | 0 |
| Neymar da Silva Santos Júnior | Brazil | MID | group_stage_full | Group stage average | 7.2 | 1.789 | -14.663 | -14.09 | 0.4031 | 0.2485 | false | true | 19.003 | 0 |
| Pablo Páez Gavira | Spain | MID | group_stage_full | Group stage average | 6.5 | 1.849 | -14.603 | -14.03 | 0.4594 | 0.2845 | false | true | 18.943 | 0 |
| Amir Murillo | Panama | DEF | group_stage_full | Group stage average | 5 | 1.416 | -13.702 | -12.908 | 0.4764 | 0.2832 | false | true | 18.748 | 0 |
| Jordan Bos | Australia | DEF | group_stage_full | Group stage average | 4 | 0.171 | -14.947 | -14.153 | 0.301 | 0.0428 | false | true | 18.702 | 0 |
| Jacob Italiano | Australia | DEF | group_stage_full | Group stage average | 4.2 | 0.171 | -14.947 | -14.153 | 0.2867 | 0.0407 | false | true | 18.702 | 0 |
| José Murillo | Panama | DEF | group_stage_full | Group stage average | 4.3 | 0.178 | -14.94 | -14.146 | 0.2835 | 0.0414 | false | true | 18.695 | 0 |
| Young-Woo Seol | Korea Republic | DEF | group_stage_full | Group stage average | 4.2 | 0.184 | -14.934 | -14.14 | 0.2924 | 0.0438 | false | true | 18.689 | 0 |
| Gi-Hyuk Lee | Korea Republic | DEF | group_stage_full | Group stage average | 4.5 | 0.184 | -14.934 | -14.14 | 0.2729 | 0.0409 | false | true | 18.689 | 0 |
| Omar Alderete | Paraguay | DEF | group_stage_full | Group stage average | 4.1 | 0.195 | -14.923 | -14.129 | 0.3049 | 0.0476 | false | true | 18.678 | 0 |
| Fabián Balbuena | Paraguay | DEF | group_stage_full | Group stage average | 4 | 0.195 | -14.923 | -14.129 | 0.3125 | 0.0488 | false | true | 18.678 | 0 |
| Roger Ibañez da Silva | Brazil | DEF | group_stage_full | Group stage average | 4.4 | 0.234 | -14.884 | -14.24 | 0.3002 | 0.0532 | false | true | 18.639 | 0 |
| Danilo Luiz da Silva | Brazil | DEF | group_stage_full | Group stage average | 4.3 | 0.234 | -14.884 | -14.24 | 0.3072 | 0.0544 | false | true | 18.639 | 0 |
| Gleison Bremer Silva Nascimento | Brazil | DEF | group_stage_full | Group stage average | 4.3 | 0.234 | -14.884 | -14.24 | 0.3072 | 0.0544 | false | true | 18.639 | 0 |

## Differential Finance Top 25

| Rank | Name | Country | Pos | Scope | Price | Score | Tier | Risk | Value | VOR | Scarcity | Frontier | Dominated | Opp cost | Def score | Obviousness |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Giorgian de Arrascaeta | Uruguay | MID | md1 | 6.5 | 88.724 | top_pick_candidate | 7.013 | 1.079 | 1.627 | 2.594 | true | false | 0 | 96.265 | 12 |
| 1 | Giorgian de Arrascaeta | Uruguay | MID | md2 | 6.5 | 86.457 | top_pick_candidate | 7.271 | 1.119 | 1.699 | 2.595 | true | false | 0 | 96.699 | 17 |
| 2 | Hiroki Ito | Japan | DEF | md2 | 3.9 | 83.942 | top_pick_candidate | 6.107 | 1.566 | 0.589 | 1.479 | true | false | 0 | 85.85 | 4 |
| 2 | Julian Ryerson | Norway | DEF | md1 | 4.2 | 83.44 | top_pick_candidate | 6.472 | 1.541 | 1.196 | 2.065 | true | false | 0.366 | 91.964 | 5 |
| 3 | Luis Suárez | Colombia | FWD | md2 | 5.7 | 82.532 | top_pick_candidate | 5.983 | 1.05 | 0.91 | 1.52 | false | true | 0 | 62.28 | 1 |
| 3 | Luis Suárez | Colombia | FWD | md1 | 5.7 | 82.356 | top_pick_candidate | 6.015 | 1.055 | 1.276 | 1.886 | false | true | 0 | 65.94 | 2 |
| 1 | Charles De Ketelaere | Belgium | MID | group_stage_full | 5.6 | 80.024 | top_pick_candidate | 17.659 | 3.153 | 1.207 | 1.86 | true | false | 0 | 82.065 | 1 |
| 2 | Silvan Widmer | Switzerland | DEF | group_stage_full | 4.2 | 78.446 | strong_candidate | 16.21 | 3.86 | 1.092 | 1.886 | true | false | 2.663 | 83.164 | 3 |
| 4 | Johan Mojica | Colombia | DEF | md1 | 3.9 | 78.061 | strong_candidate | 5.3 | 1.359 | 0.024 | 0.793 | true | false | 0 | 80.942 | 3 |
| 3 | Luis Suárez | Colombia | FWD | group_stage_full | 5.7 | 78.044 | strong_candidate | 15.99 | 2.805 | 2.349 | 2.609 | false | true | 0 | 75.27 | 1 |
| 1 | Ismael Saibari | Morocco | MID | md3 | 6.8 | 77.727 | strong_candidate | 6.114 | 0.899 | 0.668 | 1.537 | true | false | 0.843 | 77.895 | 6 |
| 5 | Santiago Arias | Colombia | DEF | md1 | 3.9 | 76.491 | strong_candidate | 5.244 | 1.345 | -0.032 | 0.737 | true | false | 0.056 | 78.69 | 3 |
| 2 | Martin Erlic | Croatia | DEF | md3 | 3.9 | 76.252 | strong_candidate | 5.274 | 1.352 | 0.095 | 0.985 | true | false | 0 | 79.746 | 0 |
| 4 | Raphael Dias Belloli | Brazil | MID | md2 | 8.2 | 75.764 | strong_candidate | 7.957 | 0.97 | 2.385 | 3.011 | true | false | 0.119 | 95.056 | 20 |
| 3 | Yahia Fofana | Côte d'Ivoire | GK | md3 | 4.2 | 75.714 | strong_candidate | 5.757 | 1.371 | 1.456 | 1.741 | true | false | 0 | 94.604 | 6 |
| 4 | Giorgian de Arrascaeta | Uruguay | MID | group_stage_full | 6.5 | 75.591 | strong_candidate | 17.667 | 2.718 | 1.215 | 1.938 | true | false | 3.125 | 81.792 | 9 |
| 5 | Sergio Rochet | Uruguay | GK | md2 | 4.1 | 75.028 | strong_candidate | 5.566 | 1.358 | 0.561 | 1.351 | true | false | 0.289 | 87.123 | 3 |
| 6 | Junnosuke Suzuki | Japan | DEF | md2 | 3.5 | 74.75 | strong_candidate | 5.163 | 1.475 | -0.355 | 0.535 | true | false | 0.944 | 72.414 | 0 |
| 6 | Nicolás Tagliafico | Argentina | DEF | md1 | 4.3 | 74.397 | strong_candidate | 6.305 | 1.466 | 1.029 | 1.818 | true | false | 0.533 | 89.705 | 16 |
| 7 | Hernán Galíndez | Ecuador | GK | md2 | 4.2 | 74.348 | strong_candidate | 5.488 | 1.307 | 0.483 | 1.343 | true | false | 0.367 | 86.389 | 0 |
| 4 | Donyell Malen | Netherlands | FWD | md3 | 6.1 | 74.316 | strong_candidate | 5.329 | 0.874 | 0.437 | 1.177 | false | true | 0.206 | 58.112 | 1.5 |
| 8 | Santiago Mele | Uruguay | GK | md2 | 3.5 | 74.275 | strong_candidate | 5.082 | 1.452 | 0.077 | 1.137 | true | false | 0 | 81.534 | 0 |
| 5 | Raphael Dias Belloli | Brazil | MID | md3 | 8.2 | 73.767 | strong_candidate | 7.714 | 0.941 | 2.268 | 3.137 | true | false | 0.145 | 94.779 | 18 |
| 5 | Hiroki Ito | Japan | DEF | group_stage_full | 3.9 | 73.54 | strong_candidate | 13.482 | 3.457 | -1.636 | -1.012 | true | false | 0 | 62.537 | 0 |
| 7 | Santiago Mele | Uruguay | GK | md1 | 3.5 | 73.406 | strong_candidate | 5.082 | 1.452 | 0 | 1.06 | true | false | 0 | 80.764 | 0 |

## Recommendation Concerns

- Final squads are still not source-backed, so all recommendation candidates remain fantasy_pool_only.
- Official rules still have manual-review blockers.
- Finance diagnostics do not use ownership data; obviousness remains a staged proxy.
- Differential may still be conservative if top-25 overlap stays at zero in future runs, but the scoring no longer hard-excludes all strong overlapping value rows.
- Efficient-frontier and dominated-player labels are preliminary because they depend on staged projections and fantasy-pool-only squads.

## Decision

The finance diagnostics are useful for preliminary review and future Value/Fantasy Finance work. They are not safe for public recommendations, Team Builder, or browser-ready promotion until official-data blockers are resolved.
