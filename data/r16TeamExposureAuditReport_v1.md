# R16 Team Exposure Audit v1

Generated: 2026-07-04T12:42:40.870Z
Status: **PASS**

## France vs Belgium Summary

| Metric | France | Belgium |
| --- | --- | --- |
| R16 opponent | Paraguay | USA |
| R16 xG | 2.023 | 1.362 |
| Opponent xG | 0.35 | 0.8 |
| Advance probability | 87% | 65% |
| Clean-sheet probability | 70% | 45% |
| Group GF-GA | 10-2 | 6-2 |
| R32 GF-GA | 3-0 | 3-2 |
| Total GF-GA | 13-2 | 9-4 |
| Clean sheets | 2 | 1 |
| Conceded matches | 2 | 3 |
| Recent form adjustment | 16.65 | 8.6 |
| Path value | 0.898 | 0.352 |
| Projection total | 74.978 | 55.992 |
| Recommendation rows | 30 | 7 |

## Audit Answers

- **Does France have a stronger R16 attacking environment than Belgium?:** Yes. France xG 2.023 vs Belgium xG 1.362.
- **Does France have stronger recent form than Belgium?:** Yes. France recent-form adjustment 16.65 vs Belgium 8.6.
- **Does Belgium have a better path value than France?:** No. France path value 0.898 is above Belgium 0.352; active R16 projections only encode R16 advance probability, not a future-round path boost.
- **Is the builder choosing Belgium because of path value, budget, position constraints, player projections, or stale weights?:** Belgium exposure is mainly player-projection/budget/position fit. Belgium path value is lower than France, and selected Belgium rows are not lifted by a superior path value.
- **Is France exposure capped by position, country limit, budget, or recommendation pool construction?:** Before the fix, yes: the legacy public builder wiring used country limit 3, while R16 rules allow 4; France rises from 3 to 4 with the active R16 limit.
- **Are French players missing from candidate pools before optimization?:** No. France has 26 projection rows and 30 recommendation rows before optimization.
- **Are French players present but losing in optimization?:** Yes. French players are present; omitted top rows lose to active R16 country cap, position, budget, or higher composite squad score.
- **Are Belgian players selected mainly because of value/path rather than projected points?:** Selected Belgian rows have explainable projected-points/value fit; path is not a superior Belgium signal versus France.

## Builder Exposure

| Scenario | Country Limit | France Selected | France Starters | Belgium Selected | Belgium Starters | Projected Pts | Cost |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Legacy group-stage limit (before fix) | 3 | 3 | 3 | 2 | 2 | 77.274 | 99.8 |
| Active public R16 limit (after fix) | 4 | 4 | 3 | 2 | 2 | 78.238 | 99.2 |

## Active R16 Balanced Squad

| Role | Player | Team | Pos | Pts | Start | Price |
| --- | --- | --- | --- | --- | --- | --- |
| Starter | Mike Maignan | France | GK | 5.319 | 87% | 5 |
| Starter | Facundo Medina | Argentina | DEF | 5.898 | 86% | 4 |
| Starter | Lisandro Martínez | Argentina | DEF | 5.79 | 86% | 4.6 |
| Starter | Ezri Konsa | England | DEF | 5.687 | 86% | 4.8 |
| Starter | Dayot Upamecano | France | DEF | 5.668 | 87% | 5.3 |
| Starter | Jules Koundé | France | DEF | 5.551 | 86% | 5.4 |
| Starter | Kevin De Bruyne | Belgium | MID | 4.628 | 98% | 7.5 |
| Starter | Jude Bellingham | England | MID | 4.693 | 87% | 8.3 |
| Starter | Leandro Trossard | Belgium | MID | 4.436 | 87% | 6.6 |
| Starter | Lionel Messi | Argentina | FWD | 5.852 | 87% | 10 |
| Starter | Lautaro Martínez | Argentina | FWD | 5.463 | 86% | 8.8 |
| Bench | Jordan Pickford | England | GK | 5.077 | 86% | 4.8 |
| Bench | Kylian Mbappé | France | FWD | 5.405 | 89% | 10.5 |
| Bench | Ismael Saibari | Morocco | MID | 4.434 | 86% | 6.8 |
| Bench | Bruno Guimarães Rodriguez Moura | Brazil | MID | 4.337 | 89% | 6.8 |

## Top Omitted France Players

| Player | Pos | Pts | Price | Reason |
| --- | --- | --- | --- | --- |
| Ousmane Dembélé | MID | 4.936 | 10 | France country cap reached (4/4); MID slots filled by higher squad score/budget fit; premium price creates budget pressure |
| Michael Olise | MID | 4.828 | 9.5 | France country cap reached (4/4); MID slots filled by higher squad score/budget fit; premium price creates budget pressure |
| Theo Hernández | DEF | 4.486 | 5 | France country cap reached (4/4); DEF slots filled by higher squad score/budget fit |
| Aurélien Tchouaméni | MID | 4.084 | 6.5 | France country cap reached (4/4); MID slots filled by higher squad score/budget fit |
| William Saliba | DEF | 3.879 | 5.3 | France country cap reached (4/4); DEF slots filled by higher squad score/budget fit; start probability below top-player range |
| Lucas Digne | DEF | 3.74 | 5 | France country cap reached (4/4); DEF slots filled by higher squad score/budget fit; start probability below top-player range |
| Bradley Barcola | MID | 3.684 | 8 | France country cap reached (4/4); MID slots filled by higher squad score/budget fit; start probability below top-player range |
| Désiré Doué | MID | 3.273 | 7.5 | France country cap reached (4/4); MID slots filled by higher squad score/budget fit; start probability below top-player range |

## Selected Belgium Players

| Player | Role | Pos | Pts | Price | Reason |
| --- | --- | --- | --- | --- | --- |
| Kevin De Bruyne | starter | MID | 4.628 | 7.5 | 4.628 projected R16 points; 98% start probability; 79.6 expected minutes; 29.982 captain score; positive path value 0.352 |
| Leandro Trossard | starter | MID | 4.436 | 6.6 | 4.436 projected R16 points; 87% start probability; 72.4 expected minutes; 26.006 captain score; positive path value 0.352 |

## Limits

- Explicit R32 starting XI data is not available in the current feed; R32 participation evidence is weighted instead.
- Ownership is not used as a model signal.
- Final squads remain not source-backed.
