# Recommendation Finance Value Audit Fantasy Pool v3

Generated: 2026-06-17T22:53:19.339Z

Model stage: fantasy_pool_only. This audit does not promote recommendations, does not update active v2 recommendations, does not update browser-ready files, and does not make Team Builder, captain/substitution, or UX changes.

## Summary

- Recommendation QA status: pass_with_staging_stop_conditions.
- Finance diagnostic rows: 4932.
- Efficient-frontier rows: 55.
- Dominated rows: 4877.
- Above-replacement rows: 256.
- Differential candidates on efficient frontier: 24.
- Differential candidates dominated: 76.
- Balanced vs Differential top-10 overlap: 0.
- Balanced vs Differential top-25 overlap: 4.
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
| balanced_vs_safe | 136 | 100 | 0.4101 |
| balanced_vs_upside | 169 | 100 | -0.3844 |
| balanced_vs_differential | 162 | 100 | -0.285 |
| balanced_vs_captain | 135 | 100 | 0.439 |
| safe_vs_upside | 181 | 100 | -0.491 |
| safe_vs_differential | 170 | 100 | -0.4883 |
| safe_vs_captain | 155 | 100 | 0.0764 |
| upside_vs_differential | 158 | 100 | -0.1162 |
| upside_vs_captain | 165 | 100 | -0.3304 |
| differential_vs_captain | 169 | 100 | -0.5478 |

## Mode Overlap

| Pair | Top-10 overlap | Top-25 overlap |
| --- | --- | --- |
| Balanced vs Safe | 4 | 14 |
| Balanced vs Differential | 0 | 4 |
| Safe vs Differential | 0 | 0 |
| Upside vs Captain Alpha | 0 | 0 |

## Mode Winners

| Mode | Winner | Country | Pos | Scope | Score | Price |
| --- | --- | --- | --- | --- | --- | --- |
| Balanced | Lionel Messi | Argentina | FWD | md3 | 82.411 | 10 |
| Safe | Enzo Fernández | Argentina | MID | md3 | 83.792 | 7.5 |
| Upside | Luis Suárez | Colombia | FWD | md2 | 79.582 | 5.7 |
| Differential | Hiroki Ito | Japan | DEF | md2 | 84.686 | 3.9 |
| Captain Alpha | Lionel Messi | Argentina | FWD | md3 | 98.623 | 10 |

## Mode Distributions

| Mode | Positions | Price buckets | Confidence | Matchdays | Top countries |
| --- | --- | --- | --- | --- | --- |
| Balanced | DEF: 33; FWD: 30; MID: 24; GK: 13 | 8.0+: 39; 5.0-6.4: 22; 4.0-4.9: 20; 6.5-7.9: 14; under_4.0: 5 | high: 100 | group_stage_full: 25; md1: 25; md2: 25; md3: 25 | Argentina: 19; Colombia: 13; England: 12; Portugal: 11; Spain: 9; France: 8; Germany: 6; Belgium: 4; Japan: 4; Brazil: 3 |
| Safe | DEF: 30; FWD: 26; GK: 22; MID: 22 | 4.0-4.9: 31; 6.5-7.9: 24; 8.0+: 23; 5.0-6.4: 20; under_4.0: 2 | high: 100 | group_stage_full: 25; md1: 25; md2: 25; md3: 25 | Argentina: 22; England: 17; Colombia: 10; Spain: 9; Portugal: 7; Ecuador: 5; Germany: 5; Netherlands: 5; Uruguay: 4; Japan: 3 |
| Upside | FWD: 40; DEF: 32; MID: 28 | 5.0-6.4: 43; 6.5-7.9: 26; 4.0-4.9: 19; under_4.0: 8; 8.0+: 4 | high: 96; medium: 4 | group_stage_full: 25; md1: 25; md2: 25; md3: 25 | Argentina: 9; Colombia: 9; Croatia: 9; Japan: 9; Belgium: 8; England: 7; Spain: 7; Netherlands: 5; Brazil: 4; Czechia: 4 |
| Differential | DEF: 36; MID: 29; FWD: 23; GK: 12 | 5.0-6.4: 38; 6.5-7.9: 24; 4.0-4.9: 22; under_4.0: 10; 8.0+: 6 | high: 100 | group_stage_full: 25; md1: 25; md2: 25; md3: 25 | Argentina: 11; Brazil: 11; Colombia: 11; Ecuador: 9; England: 7; Japan: 7; Croatia: 6; Czechia: 5; France: 5; Portugal: 4 |
| Captain Alpha | FWD: 48; MID: 40; DEF: 12 | 8.0+: 52; 6.5-7.9: 27; 5.0-6.4: 16; 4.0-4.9: 5 | high: 98; medium: 2 | group_stage_full: 25; md1: 25; md2: 25; md3: 25 | Argentina: 12; France: 12; Portugal: 11; England: 10; Spain: 8; Brazil: 6; Germany: 6; Netherlands: 5; Belgium: 4; Colombia: 4 |

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
| Lionel Messi | Argentina | FWD | group_stage_full | Group stage average | 10 | 22.65 | 9.149 | 9.329 | 2.4357 | 2.265 | true | false | 0 | 100 |
| Raphael Dias Belloli | Brazil | MID | group_stage_full | Group stage average | 8.2 | 23.237 | 7.926 | 8.106 | 3.047 | 2.8338 | true | false | 0 | 100 |
| Michael Olise | France | MID | group_stage_full | Group stage average | 9.5 | 22.788 | 7.477 | 7.657 | 2.5793 | 2.3987 | false | true | 0.449 | 92.673 |
| Harry Kane | England | FWD | group_stage_full | Group stage average | 10.5 | 20.803 | 7.302 | 7.482 | 2.1304 | 1.9812 | false | true | 1.847 | 96.227 |
| Nuno Alexandre Tavares Mendes | Portugal | DEF | group_stage_full | Group stage average | 5.8 | 20.049 | 6.793 | 7.16 | 3.7171 | 3.4567 | true | false | 0 | 100 |
| Ousmane Dembélé | France | MID | group_stage_full | Group stage average | 10 | 22.032 | 6.721 | 6.901 | 2.3692 | 2.2032 | false | true | 1.205 | 85.065 |
| Kylian Mbappé | France | FWD | group_stage_full | Group stage average | 10.5 | 19.973 | 6.472 | 6.652 | 2.0453 | 1.9022 | false | true | 2.677 | 92.673 |
| Luis Díaz | Colombia | MID | group_stage_full | Group stage average | 8.1 | 21.38 | 6.069 | 6.249 | 2.8381 | 2.6395 | true | false | 1.857 | 100 |
| Vinícius José Paixão de Oliveira Júnior | Brazil | MID | group_stage_full | Group stage average | 10 | 21.023 | 5.712 | 5.892 | 2.2605 | 2.1023 | false | true | 2.214 | 88.418 |
| Enzo Fernández | Argentina | MID | group_stage_full | Group stage average | 7.5 | 20.829 | 5.518 | 5.698 | 2.9863 | 2.7772 | true | false | 0 | 100 |
| Bruno Miguel Borges Fernandes | Portugal | MID | group_stage_full | Group stage average | 8.5 | 20.46 | 5.149 | 5.409 | 2.5884 | 2.4071 | false | true | 2.777 | 93.689 |
| Ferran Torres | Spain | FWD | group_stage_full | Group stage average | 7.8 | 18.337 | 4.836 | 5.016 | 2.5279 | 2.3509 | false | true | 0 | 96.68 |
| Emiliano Martínez | Argentina | GK | group_stage_full | Group stage average | 5 | 16.646 | 4.804 | 4.984 | 3.5798 | 3.3292 | true | false | 0 | 100 |
| Nico O'Reilly | England | DEF | group_stage_full | Group stage average | 4.7 | 17.919 | 4.663 | 4.95 | 4.0998 | 3.8126 | true | false | 0 | 100 |
| Cristiano Ronaldo dos Santos Aveiro | Portugal | FWD | group_stage_full | Group stage average | 10 | 17.94 | 4.439 | 4.699 | 1.929 | 1.794 | false | true | 4.71 | 85.646 |

## Scarcity-Adjusted Value Leaders

| Name | Country | Pos | Scope | Opponent | Price | Risk | VOR | Scarcity value | Pts/price | Risk/price | Frontier | Dominated | Opp cost | Def score |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Lionel Messi | Argentina | FWD | group_stage_full | Group stage average | 10 | 22.65 | 9.149 | 9.329 | 2.4357 | 2.265 | true | false | 0 | 100 |
| Raphael Dias Belloli | Brazil | MID | group_stage_full | Group stage average | 8.2 | 23.237 | 7.926 | 8.106 | 3.047 | 2.8338 | true | false | 0 | 100 |
| Michael Olise | France | MID | group_stage_full | Group stage average | 9.5 | 22.788 | 7.477 | 7.657 | 2.5793 | 2.3987 | false | true | 0.449 | 92.673 |
| Harry Kane | England | FWD | group_stage_full | Group stage average | 10.5 | 20.803 | 7.302 | 7.482 | 2.1304 | 1.9812 | false | true | 1.847 | 96.227 |
| Nuno Alexandre Tavares Mendes | Portugal | DEF | group_stage_full | Group stage average | 5.8 | 20.049 | 6.793 | 7.16 | 3.7171 | 3.4567 | true | false | 0 | 100 |
| Ousmane Dembélé | France | MID | group_stage_full | Group stage average | 10 | 22.032 | 6.721 | 6.901 | 2.3692 | 2.2032 | false | true | 1.205 | 85.065 |
| Kylian Mbappé | France | FWD | group_stage_full | Group stage average | 10.5 | 19.973 | 6.472 | 6.652 | 2.0453 | 1.9022 | false | true | 2.677 | 92.673 |
| Luis Díaz | Colombia | MID | group_stage_full | Group stage average | 8.1 | 21.38 | 6.069 | 6.249 | 2.8381 | 2.6395 | true | false | 1.857 | 100 |
| Vinícius José Paixão de Oliveira Júnior | Brazil | MID | group_stage_full | Group stage average | 10 | 21.023 | 5.712 | 5.892 | 2.2605 | 2.1023 | false | true | 2.214 | 88.418 |
| Enzo Fernández | Argentina | MID | group_stage_full | Group stage average | 7.5 | 20.829 | 5.518 | 5.698 | 2.9863 | 2.7772 | true | false | 0 | 100 |
| Bruno Miguel Borges Fernandes | Portugal | MID | group_stage_full | Group stage average | 8.5 | 20.46 | 5.149 | 5.409 | 2.5884 | 2.4071 | false | true | 2.777 | 93.689 |
| Ferran Torres | Spain | FWD | group_stage_full | Group stage average | 7.8 | 18.337 | 4.836 | 5.016 | 2.5279 | 2.3509 | false | true | 0 | 96.68 |
| Emiliano Martínez | Argentina | GK | group_stage_full | Group stage average | 5 | 16.646 | 4.804 | 4.984 | 3.5798 | 3.3292 | true | false | 0 | 100 |
| Nico O'Reilly | England | DEF | group_stage_full | Group stage average | 4.7 | 17.919 | 4.663 | 4.95 | 4.0998 | 3.8126 | true | false | 0 | 100 |
| Cristiano Ronaldo dos Santos Aveiro | Portugal | FWD | group_stage_full | Group stage average | 10 | 17.94 | 4.439 | 4.699 | 1.929 | 1.794 | false | true | 4.71 | 85.646 |

## Risk-Adjusted Points Per Price Leaders

| Name | Country | Pos | Scope | Opponent | Price | Risk | VOR | Scarcity value | Pts/price | Risk/price | Frontier | Dominated | Opp cost | Def score |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Nico O'Reilly | England | DEF | group_stage_full | Group stage average | 4.7 | 17.919 | 4.663 | 4.95 | 4.0998 | 3.8126 | true | false | 0 | 100 |
| Gonzalo Montiel | Argentina | DEF | group_stage_full | Group stage average | 4.3 | 15.336 | 2.08 | 2.367 | 3.8351 | 3.5665 | true | false | 2.583 | 85.5 |
| Camilo Vargas | Colombia | GK | group_stage_full | Group stage average | 4.3 | 15.063 | 3.221 | 3.231 | 3.7665 | 3.503 | false | true | 0.037 | 93.359 |
| Nuno Alexandre Tavares Mendes | Portugal | DEF | group_stage_full | Group stage average | 5.8 | 20.049 | 6.793 | 7.16 | 3.7171 | 3.4567 | true | false | 0 | 100 |
| Hiroki Ito | Japan | DEF | group_stage_full | Group stage average | 3.9 | 13.466 | 0.21 | 0.407 | 3.7126 | 3.4528 | true | false | 0 | 79.289 |
| Johan Mojica | Colombia | DEF | group_stage_full | Group stage average | 3.9 | 13.169 | -0.087 | 0.03 | 3.631 | 3.3767 | false | true | 0.297 | 58.336 |
| Santiago Arias | Colombia | DEF | group_stage_full | Group stage average | 3.9 | 13.118 | -0.138 | -0.021 | 3.6169 | 3.3636 | false | true | 0.348 | 56.149 |
| Emiliano Martínez | Argentina | GK | group_stage_full | Group stage average | 5 | 16.646 | 4.804 | 4.984 | 3.5798 | 3.3292 | true | false | 0 | 100 |
| Daniel Muñoz | Colombia | DEF | group_stage_full | Group stage average | 4.6 | 15.148 | 1.892 | 2.179 | 3.5407 | 3.293 | false | true | 2.771 | 71.976 |
| Brandon Mechele | Belgium | DEF | group_stage_full | Group stage average | 3.9 | 12.732 | -0.524 | -0.407 | 3.51 | 3.2646 | false | true | 0.734 | 45.707 |
| Joel Ordóñez | Ecuador | DEF | group_stage_full | Group stage average | 3.9 | 12.649 | -0.607 | -0.34 | 3.4872 | 3.2433 | false | true | 0.817 | 52.176 |
| Charles De Ketelaere | Belgium | MID | group_stage_full | Group stage average | 5.6 | 17.979 | 2.668 | 2.848 | 3.4521 | 3.2105 | true | false | 0 | 94.784 |
| Cristian Romero | Argentina | DEF | group_stage_full | Group stage average | 4.9 | 15.598 | 2.342 | 2.629 | 3.4231 | 3.1833 | false | true | 2.321 | 77.826 |
| Marc Cucurella | Spain | DEF | group_stage_full | Group stage average | 5.1 | 16.173 | 2.917 | 3.204 | 3.4098 | 3.1712 | false | true | 3.876 | 77.451 |
| Alisson Ramsés Becker | Brazil | GK | group_stage_full | Group stage average | 5 | 15.838 | 3.996 | 4.176 | 3.4062 | 3.1676 | false | true | 0.808 | 99.16 |

## Efficient Frontier Sample

| Name | Country | Pos | Scope | Opponent | Price | Risk | VOR | Scarcity value | Pts/price | Risk/price | Frontier | Dominated | Opp cost | Def score |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Lionel Messi | Argentina | FWD | group_stage_full | Group stage average | 10 | 22.65 | 9.149 | 9.329 | 2.4357 | 2.265 | true | false | 0 | 100 |
| Raphael Dias Belloli | Brazil | MID | group_stage_full | Group stage average | 8.2 | 23.237 | 7.926 | 8.106 | 3.047 | 2.8338 | true | false | 0 | 100 |
| Nuno Alexandre Tavares Mendes | Portugal | DEF | group_stage_full | Group stage average | 5.8 | 20.049 | 6.793 | 7.16 | 3.7171 | 3.4567 | true | false | 0 | 100 |
| Luis Díaz | Colombia | MID | group_stage_full | Group stage average | 8.1 | 21.38 | 6.069 | 6.249 | 2.8381 | 2.6395 | true | false | 1.857 | 100 |
| Enzo Fernández | Argentina | MID | group_stage_full | Group stage average | 7.5 | 20.829 | 5.518 | 5.698 | 2.9863 | 2.7772 | true | false | 0 | 100 |
| Emiliano Martínez | Argentina | GK | group_stage_full | Group stage average | 5 | 16.646 | 4.804 | 4.984 | 3.5798 | 3.3292 | true | false | 0 | 100 |
| Nico O'Reilly | England | DEF | group_stage_full | Group stage average | 4.7 | 17.919 | 4.663 | 4.95 | 4.0998 | 3.8126 | true | false | 0 | 100 |
| Nuno Alexandre Tavares Mendes | Portugal | DEF | md1 | Congo DR | 5.8 | 7.618 | 2.527 | 3.587 | 1.4124 | 1.3134 | true | false | 0 | 100 |
| Lionel Messi | Argentina | FWD | md1 | Algeria | 10 | 7.55 | 3.096 | 3.526 | 0.8119 | 0.755 | true | false | 0 | 100 |
| Nuno Alexandre Tavares Mendes | Portugal | DEF | md2 | Uzbekistan | 5.8 | 7.565 | 2.398 | 3.458 | 1.4026 | 1.3043 | true | false | 0 | 100 |
| Lionel Messi | Argentina | FWD | md3 | Jordan | 10 | 7.55 | 3.012 | 3.442 | 0.8119 | 0.755 | true | false | 0 | 100 |
| Luis Díaz | Colombia | MID | md1 | Uzbekistan | 8.1 | 7.878 | 2.561 | 3.135 | 1.0458 | 0.9726 | true | false | 0 | 96.967 |
| Raphael Dias Belloli | Brazil | MID | md3 | Scotland | 8.2 | 7.789 | 2.218 | 3.015 | 1.0213 | 0.9499 | true | false | 0 | 94.429 |
| Raphael Dias Belloli | Brazil | MID | md2 | Haiti | 8.2 | 7.936 | 2.424 | 2.907 | 1.0406 | 0.9678 | true | false | 0.008 | 95.207 |
| Luis Díaz | Colombia | MID | md2 | Congo DR | 8.1 | 7.899 | 2.387 | 2.87 | 1.0485 | 0.9752 | true | false | 0.045 | 94.726 |

## Dominated Player Sample

| Name | Country | Pos | Scope | Opponent | Price | Risk | VOR | Scarcity value | Pts/price | Risk/price | Frontier | Dominated | Opp cost | Def score |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Neymar da Silva Santos Júnior | Brazil | MID | group_stage_full | Group stage average | 7.2 | 0.449 | -14.862 | -14.682 | 0.1444 | 0.0624 | false | true | 20.38 | 0 |
| Amir Murillo | Panama | DEF | group_stage_full | Group stage average | 5 | 1.408 | -11.848 | -11.411 | 0.4744 | 0.2816 | false | true | 18.641 | 0 |
| Awer Mabil | Australia | MID | group_stage_full | Group stage average | 5.6 | 0.069 | -15.242 | -14.912 | 0.1816 | 0.0123 | false | true | 17.91 | 0 |
| Ajdin Hrustic | Australia | MID | group_stage_full | Group stage average | 5.7 | 0.069 | -15.242 | -14.912 | 0.1784 | 0.0121 | false | true | 17.91 | 0 |
| Jackson Irvine | Australia | MID | group_stage_full | Group stage average | 5.6 | 0.069 | -15.242 | -14.912 | 0.1816 | 0.0123 | false | true | 17.91 | 0 |
| Cristian Volpato | Australia | MID | group_stage_full | Group stage average | 6 | 0.069 | -15.242 | -14.912 | 0.1695 | 0.0115 | false | true | 17.91 | 0 |
| Jun-Ho Bae | Korea Republic | MID | group_stage_full | Group stage average | 5.9 | 0.095 | -15.216 | -14.886 | 0.1805 | 0.0161 | false | true | 17.884 | 0 |
| Fabián Balbuena | Paraguay | DEF | group_stage_full | Group stage average | 4 | 0.047 | -13.209 | -12.772 | 0.244 | 0.0118 | false | true | 17.872 | 0 |
| Danilo Luiz da Silva | Brazil | DEF | group_stage_full | Group stage average | 4.3 | 0.077 | -13.179 | -12.892 | 0.2395 | 0.0179 | false | true | 17.842 | 0 |
| Gleison Bremer Silva Nascimento | Brazil | DEF | group_stage_full | Group stage average | 4.3 | 0.077 | -13.179 | -12.892 | 0.2395 | 0.0179 | false | true | 17.842 | 0 |
| Fábio Henrique Tavares | Brazil | MID | group_stage_full | Group stage average | 5.2 | 0.193 | -15.118 | -14.938 | 0.2392 | 0.0371 | false | true | 17.786 | 0 |
| Ronald Araujo | Uruguay | DEF | group_stage_full | Group stage average | 5 | 2.31 | -10.946 | -10.509 | 0.725 | 0.462 | false | true | 17.739 | 0 |
| Samir Chergui | Algeria | DEF | group_stage_full | Group stage average | 4 | 0.354 | -12.902 | -12.465 | 0.2275 | 0.0885 | false | true | 17.565 | 0 |
| Moïse Bombito | Canada | DEF | group_stage_full | Group stage average | 4.1 | 0.816 | -12.44 | -12.003 | 0.378 | 0.199 | false | true | 17.103 | 0 |
| Jorge Sánchez | Mexico | DEF | group_stage_full | Group stage average | 4 | 0.83 | -12.426 | -11.989 | 0.3923 | 0.2075 | false | true | 17.089 | 0 |

## Differential Finance Top 25

| Rank | Name | Country | Pos | Scope | Price | Score | Tier | Risk | Value | VOR | Scarcity | Frontier | Dominated | Opp cost | Def score | Obviousness |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Hiroki Ito | Japan | DEF | md2 | 3.9 | 84.686 | top_pick_candidate | 6.146 | 1.576 | 0.979 | 2.039 | true | false | 0 | 90.43 | 4 |
| 1 | Josip Stanisic | Croatia | DEF | md3 | 4.3 | 79.177 | strong_candidate | 5.883 | 1.368 | 1.284 | 2.264 | true | false | 0.45 | 91.874 | 4.5 |
| 1 | Hiroki Ito | Japan | DEF | group_stage_full | 3.9 | 76.059 | strong_candidate | 13.466 | 3.453 | 0.21 | 0.407 | true | false | 0 | 79.289 | 0 |
| 2 | Nico O'Reilly | England | DEF | group_stage_full | 4.7 | 75.309 | strong_candidate | 17.919 | 3.813 | 4.663 | 4.95 | true | false | 0 | 100 | 22 |
| 2 | Bruno Guimarães Rodriguez Moura | Brazil | MID | md2 | 6.8 | 75.049 | strong_candidate | 5.789 | 0.851 | 0.277 | 0.86 | true | false | 1.147 | 78.72 | 4 |
| 1 | Santiago Arias | Colombia | DEF | md1 | 3.9 | 74.624 | strong_candidate | 5.244 | 1.345 | 0.153 | 0.963 | true | false | 0.056 | 80.706 | 3 |
| 3 | Nico O'Reilly | England | DEF | md2 | 4.7 | 73.518 | strong_candidate | 6.333 | 1.347 | 1.166 | 1.976 | true | false | 0 | 90.792 | 20 |
| 3 | Hernán Galíndez | Ecuador | GK | group_stage_full | 4.2 | 73.233 | strong_candidate | 13.259 | 3.157 | 1.417 | 1.577 | true | false | 1.841 | 88.507 | 0 |
| 4 | Nuno Alexandre Tavares Mendes | Portugal | DEF | group_stage_full | 5.8 | 72.185 | strong_candidate | 20.049 | 3.457 | 6.793 | 7.16 | true | false | 0 | 100 | 31 |
| 5 | Bruno Guimarães Rodriguez Moura | Brazil | MID | group_stage_full | 6.8 | 72.062 | strong_candidate | 16.441 | 2.418 | 1.13 | 1.31 | true | false | 4.388 | 75.916 | 4 |
| 2 | Johan Mojica | Colombia | DEF | md1 | 3.9 | 71.475 | strong_candidate | 5.3 | 1.359 | 0.209 | 1.019 | true | false | 0 | 82.958 | 8 |
| 4 | Enner Valencia | Ecuador | FWD | md2 | 5.9 | 71.307 | strong_candidate | 5.473 | 0.928 | 0.3 | 0.81 | false | true | 0.685 | 60.625 | 2 |
| 2 | Nico O'Reilly | England | DEF | md3 | 4.7 | 69.248 | strong_candidate | 6.333 | 1.347 | 1.734 | 2.714 | true | false | 0 | 97.152 | 31 |
| 5 | Patrik Schick | Czechia | FWD | md2 | 7.3 | 69.141 | strong_candidate | 5.837 | 0.8 | 0.664 | 1.174 | false | true | 0.295 | 65.393 | 6 |
| 6 | Hernán Galíndez | Ecuador | GK | md2 | 4.2 | 68.576 | strong_candidate | 5.373 | 1.279 | 0.902 | 1.662 | true | false | 0.366 | 90.182 | 7 |
| 7 | Ayase Ueda | Japan | FWD | md2 | 7 | 68.459 | strong_candidate | 5.995 | 0.856 | 0.822 | 1.262 | false | true | 0.137 | 67.423 | 15 |
| 3 | Ivan Perisic | Croatia | FWD | md3 | 5.4 | 67.187 | strong_candidate | 4.998 | 0.926 | 0.46 | 0.89 | false | true | 1.242 | 59.17 | 0 |
| 8 | Nuno Alexandre Tavares Mendes | Portugal | DEF | md2 | 5.8 | 66.322 | strong_candidate | 7.565 | 1.304 | 2.398 | 3.458 | true | false | 0 | 100 | 42 |
| 3 | Nuno Alexandre Tavares Mendes | Portugal | DEF | md1 | 5.8 | 64.888 | watchlist_candidate | 7.618 | 1.313 | 2.527 | 3.587 | true | false | 0 | 100 | 43 |
| 6 | Enner Valencia | Ecuador | FWD | group_stage_full | 5.9 | 64.68 | watchlist_candidate | 13.501 | 2.288 | 0 | 0.16 | false | true | 2.821 | 49.817 | 0 |
| 4 | Nico O'Reilly | England | DEF | md1 | 4.7 | 63.753 | watchlist_candidate | 5.253 | 1.118 | 0.162 | 1.122 | false | true | 1.219 | 59.695 | 7 |
| 4 | Hiroki Ito | Japan | DEF | md3 | 3.9 | 63.349 | watchlist_candidate | 4.599 | 1.179 | 0 | 0.96 | false | true | 0.584 | 60.488 | 0 |
| 9 | Joel Ordóñez | Ecuador | DEF | md2 | 3.9 | 63.044 | watchlist_candidate | 5.409 | 1.387 | 0.242 | 1.372 | false | true | 0.737 | 64.357 | 0 |
| 7 | Patrik Schick | Czechia | FWD | group_stage_full | 7.3 | 63.018 | watchlist_candidate | 14.444 | 1.979 | 0.943 | 1.273 | false | true | 3.893 | 56.669 | 4 |
| 5 | Ayase Ueda | Japan | FWD | md1 | 7 | 62.914 | watchlist_candidate | 4.307 | 0.615 | -0.147 | 0.433 | false | true | 1.825 | 53.229 | 4 |

## Recommendation Concerns

- Final squads are still not source-backed, so all recommendation candidates remain fantasy_pool_only.
- Official rules still have manual-review blockers.
- Finance diagnostics do not use ownership data; obviousness remains a staged proxy.
- Differential may still be conservative if top-25 overlap stays at zero in future runs, but the scoring no longer hard-excludes all strong overlapping value rows.
- Efficient-frontier and dominated-player labels are preliminary because they depend on staged projections and fantasy-pool-only squads.

## Decision

The finance diagnostics are useful for preliminary review and future Value/Fantasy Finance work. They are not safe for public recommendations, Team Builder, or browser-ready promotion until official-data blockers are resolved.
