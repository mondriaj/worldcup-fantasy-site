# Recommendation Finance Value Audit Fantasy Pool v3

Generated: 2026-06-02T18:41:18.502Z

Model stage: fantasy_pool_only. This audit does not promote recommendations, does not update active v2 recommendations, does not update browser-ready files, and does not make Team Builder, captain/substitution, or UX changes.

## Summary

- Recommendation QA status: pass_with_staging_stop_conditions.
- Finance diagnostic rows: 5024.
- Efficient-frontier rows: 62.
- Dominated rows: 4962.
- Above-replacement rows: 256.
- Differential candidates on efficient frontier: 40.
- Differential candidates dominated: 60.
- Balanced vs Differential top-10 overlap: 0.
- Balanced vs Differential top-25 overlap: 2.
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
| balanced_vs_safe | 140 | 100 | 0.297 |
| balanced_vs_upside | 132 | 100 | 0.2446 |
| balanced_vs_differential | 175 | 100 | -0.3217 |
| balanced_vs_captain | 143 | 100 | 0.1027 |
| safe_vs_upside | 159 | 100 | -0.021 |
| safe_vs_differential | 192 | 100 | -0.555 |
| safe_vs_captain | 160 | 100 | -0.0948 |
| upside_vs_differential | 163 | 100 | -0.3822 |
| upside_vs_captain | 123 | 100 | 0.7417 |
| differential_vs_captain | 172 | 100 | -0.4962 |

## Mode Overlap

| Pair | Top-10 overlap | Top-25 overlap |
| --- | --- | --- |
| Balanced vs Safe | 6 | 13 |
| Balanced vs Differential | 0 | 2 |
| Safe vs Differential | 0 | 0 |
| Upside vs Captain Alpha | 8 | 20 |

## Mode Winners

| Mode | Winner | Country | Pos | Scope | Score | Price |
| --- | --- | --- | --- | --- | --- | --- |
| Balanced | Nuno Alexandre Tavares Mendes | Portugal | DEF | md2 | 86.341 | 5.8 |
| Safe | Nuno Alexandre Tavares Mendes | Portugal | DEF | md2 | 87.657 | 5.8 |
| Upside | Lionel Messi | Argentina | FWD | md3 | 92.325 | 10 |
| Differential | Giorgian de Arrascaeta | Uruguay | MID | md1 | 77.668 | 6.5 |
| Captain Alpha | Lionel Messi | Argentina | FWD | md3 | 96.249 | 10 |

## Mode Distributions

| Mode | Positions | Price buckets | Confidence | Matchdays | Top countries |
| --- | --- | --- | --- | --- | --- |
| Balanced | DEF: 40; MID: 31; FWD: 19; GK: 10 | 8.0+: 34; 4.0-4.9: 28; 5.0-6.4: 24; 6.5-7.9: 12; under_4.0: 2 | high: 100 | group_stage_full: 25; md1: 25; md2: 25; md3: 25 | Argentina: 22; Colombia: 10; Spain: 10; Portugal: 9; England: 8; Uruguay: 8; France: 7; Germany: 5; Brazil: 4; Netherlands: 4 |
| Safe | DEF: 40; GK: 23; FWD: 20; MID: 17 | 4.0-4.9: 40; 5.0-6.4: 22; 8.0+: 21; 6.5-7.9: 15; under_4.0: 2 | high: 100 | group_stage_full: 25; md1: 25; md2: 25; md3: 25 | Argentina: 23; Portugal: 15; Colombia: 14; England: 11; Uruguay: 6; Germany: 5; Netherlands: 5; Spain: 5; Ecuador: 4; Belgium: 3 |
| Upside | FWD: 40; MID: 40; DEF: 20 | 8.0+: 48; 5.0-6.4: 21; 6.5-7.9: 21; 4.0-4.9: 10 | high: 100 | group_stage_full: 25; md1: 25; md2: 25; md3: 25 | Argentina: 19; Portugal: 10; Spain: 10; England: 8; France: 8; Brazil: 7; Colombia: 6; Germany: 5; Uruguay: 5; Belgium: 4 |
| Differential | DEF: 35; FWD: 31; MID: 27; GK: 7 | 5.0-6.4: 34; 4.0-4.9: 31; under_4.0: 16; 6.5-7.9: 15; 8.0+: 4 | high: 100 | group_stage_full: 25; md1: 25; md2: 25; md3: 25 | Argentina: 13; Japan: 10; Uruguay: 9; Ecuador: 8; Belgium: 7; Colombia: 7; Croatia: 7; Spain: 5; Austria: 4; England: 4 |
| Captain Alpha | FWD: 48; MID: 40; DEF: 12 | 8.0+: 51; 6.5-7.9: 28; 5.0-6.4: 14; 4.0-4.9: 7 | high: 100 | group_stage_full: 25; md1: 25; md2: 25; md3: 25 | Argentina: 18; Portugal: 13; England: 10; Spain: 9; France: 8; Uruguay: 7; Germany: 5; Brazil: 3; Colombia: 3; Croatia: 3 |

## Distinct Purpose Assessment

- Balanced: best all-around staged candidate score. It should correlate with most modes but not define Differential alone.
- Safe: floor, minutes, role/confidence, and low data-quality risk. Balanced/Safe overlap is natural.
- Upside: ceiling and attacking context. Upside/Captain overlap is natural when elite attackers dominate both.
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
| Mikel Oyarzabal | Spain | FWD | group_stage_full | Group stage average | 8.1 | 16.88 | 3.239 | 3.419 | 2.2409 | 2.084 | true | false | 5.77 | 91.036 |
| Nuno Alexandre Tavares Mendes | Portugal | DEF | md1 | Congo DR | 5.8 | 7.62 | 2.344 | 3.383 | 1.4126 | 1.3138 | true | false | 0 | 100 |
| Lamine Yamal Nasraoui Ebana | Spain | MID | md1 | Cabo Verde | 10 | 8.076 | 2.506 | 3.373 | 0.8684 | 0.8076 | true | false | 0 | 95.701 |
| Lionel Messi | Argentina | FWD | md1 | Algeria | 10 | 7.55 | 2.811 | 3.341 | 0.8119 | 0.755 | true | false | 0 | 100 |
| Lamine Yamal Nasraoui Ebana | Spain | MID | md3 | Uruguay | 10 | 7.859 | 2.332 | 3.271 | 0.8451 | 0.7859 | true | false | 0 | 94.246 |
| Nuno Alexandre Tavares Mendes | Portugal | DEF | md2 | Uzbekistan | 5.8 | 7.675 | 2.157 | 3.217 | 1.4228 | 1.3233 | true | false | 0 | 100 |

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
| 1 | Giorgian de Arrascaeta | Uruguay | MID | md1 | 6.5 | 77.668 | strong_candidate | 7.013 | 1.079 | 1.443 | 2.24 | true | false | 0 | 93.745 | 15 |
| 1 | Nicolas Jackson | Senegal | FWD | md3 | 6.7 | 77.42 | strong_candidate | 5.748 | 0.858 | 0.856 | 1.596 | true | false | 0.165 | 80.595 | 5 |
| 1 | Hiroki Ito | Japan | DEF | md2 | 3.9 | 77.011 | strong_candidate | 6.107 | 1.566 | 0.589 | 1.479 | true | false | 0 | 85.85 | 4 |
| 2 | Luis Suárez | Colombia | FWD | md1 | 5.7 | 73.997 | strong_candidate | 6.015 | 1.055 | 1.276 | 1.886 | false | true | 0 | 65.94 | 2 |
| 2 | Luis Suárez | Colombia | FWD | md2 | 5.7 | 73.885 | strong_candidate | 5.983 | 1.05 | 0.91 | 1.52 | false | true | 0 | 62.28 | 1 |
| 2 | Martin Erlic | Croatia | DEF | md3 | 3.9 | 73.659 | strong_candidate | 5.274 | 1.352 | 0.095 | 0.985 | true | false | 0 | 79.746 | 0 |
| 3 | Santiago Arias | Colombia | DEF | md1 | 3.9 | 72.62 | strong_candidate | 5.244 | 1.345 | -0.032 | 0.737 | true | false | 0.056 | 78.69 | 0 |
| 3 | Emmanuel Agbadou | Côte d'Ivoire | DEF | md3 | 3.9 | 72.506 | strong_candidate | 5.205 | 1.335 | 0.026 | 0.986 | true | false | 0.069 | 79.997 | 0 |
| 4 | Ismael Saibari | Morocco | MID | md3 | 6.8 | 72.076 | strong_candidate | 6.114 | 0.899 | 0.587 | 1.456 | true | false | 0.843 | 77.085 | 6 |
| 1 | Charles De Ketelaere | Belgium | MID | group_stage_full | 5.6 | 71.605 | strong_candidate | 17.659 | 3.153 | 1.207 | 1.86 | true | false | 0 | 82.065 | 1 |
| 4 | Nicolás Tagliafico | Argentina | DEF | md1 | 4.3 | 70.936 | strong_candidate | 6.305 | 1.466 | 1.029 | 1.818 | true | false | 0.533 | 89.705 | 12 |
| 5 | Johan Mojica | Colombia | DEF | md1 | 3.9 | 70.923 | strong_candidate | 5.3 | 1.359 | 0.024 | 0.793 | true | false | 0 | 80.942 | 3 |
| 5 | Duje Caleta-Car | Croatia | DEF | md3 | 4 | 70.833 | strong_candidate | 5.179 | 1.295 | 0 | 0.89 | true | false | 1.261 | 76.833 | 0 |
| 3 | Junnosuke Suzuki | Japan | DEF | md2 | 3.5 | 70.615 | strong_candidate | 5.163 | 1.475 | -0.355 | 0.535 | true | false | 0.944 | 72.414 | 0 |
| 2 | Silvan Widmer | Switzerland | DEF | group_stage_full | 4.2 | 70.39 | strong_candidate | 16.21 | 3.86 | 1.092 | 1.886 | true | false | 2.663 | 83.164 | 3 |
| 6 | Torbjørn Heggem | Norway | DEF | md1 | 3.7 | 69.872 | strong_candidate | 5.091 | 1.376 | -0.185 | 0.584 | true | false | 0.209 | 77.949 | 0 |
| 3 | Luis Suárez | Colombia | FWD | group_stage_full | 5.7 | 69.617 | strong_candidate | 15.99 | 2.805 | 2.349 | 2.609 | false | true | 0 | 75.27 | 0 |
| 4 | Nico O'Reilly | England | DEF | md2 | 4.7 | 69.037 | strong_candidate | 6.44 | 1.37 | 0.922 | 1.712 | true | false | 0 | 88.272 | 13 |
| 5 | Ritsu Doan | Japan | DEF | md2 | 5.1 | 68.948 | strong_candidate | 6.746 | 1.323 | 1.228 | 2.288 | true | false | 0.929 | 83.953 | 11 |
| 6 | Christoph Baumgartner | Austria | MID | md3 | 6.7 | 67.951 | strong_candidate | 5.809 | 0.867 | 0.282 | 1.221 | true | false | 1.148 | 79.532 | 7 |
| 7 | Julian Ryerson | Norway | DEF | md1 | 4.2 | 67.839 | strong_candidate | 6.472 | 1.541 | 1.196 | 2.065 | true | false | 0.366 | 91.964 | 17 |
| 6 | Santiago Mele | Uruguay | GK | md2 | 3.5 | 67.409 | strong_candidate | 5.082 | 1.452 | 0.077 | 1.137 | true | false | 0 | 81.534 | 0 |
| 7 | Kevin Rodríguez | Ecuador | FWD | md2 | 4.9 | 67.254 | strong_candidate | 5.328 | 1.087 | 0.255 | 1.035 | false | true | 0 | 61.99 | 2 |
| 8 | Santiago Mele | Uruguay | GK | md1 | 3.5 | 66.848 | strong_candidate | 5.082 | 1.452 | 0 | 1.06 | true | false | 0 | 80.764 | 0 |
| 4 | Mikel Oyarzabal | Spain | FWD | group_stage_full | 8.1 | 66.757 | strong_candidate | 16.88 | 2.084 | 3.239 | 3.419 | true | false | 5.77 | 91.036 | 8 |

## Recommendation Concerns

- Final squads are still not source-backed, so all recommendation candidates remain fantasy_pool_only.
- Official rules still have manual-review blockers.
- Finance diagnostics do not use ownership data; obviousness remains a staged proxy.
- Differential may still be conservative if top-25 overlap stays at zero in future runs, but the scoring no longer hard-excludes all strong overlapping value rows.
- Efficient-frontier and dominated-player labels are preliminary because they depend on staged projections and fantasy-pool-only squads.

## Decision

The finance diagnostics are useful for preliminary review and future Value/Fantasy Finance work. They are not safe for public recommendations, Team Builder, or browser-ready promotion until official-data blockers are resolved.
