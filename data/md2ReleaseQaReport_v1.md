# MD2 Release QA v1

Generated: 2026-06-18T18:04:02.064Z
Release status: **GREEN**
Safe to share: **Yes**
Deploy recommendation: **Share the public MD2 site after deployment propagation. PELE prior is refreshed and MD2 in-progress actuals remain excluded from model signal.**

## Model Stack

- Score model: score-v4-md2-pele-md1-calibrated
- Projection model: player-projection-v4-md2-score-v4-role-v2
- Recommendation model: fantasy-pool-recommendations-v4-md2-projection-v4-role-v2-score-v4
- Team Builder optimizer: team_builder_optimizer_md2_v4
- Default public matchday: md2
- PELE/team-quality rebuilt: **Yes**
- MD2 already started: **Yes**
- MD2 live actuals used for calibration: **No**
- Ownership used as signal: **No**
- Final squads source-backed: **No**

## Checks

- Official monitor: completed; rerun decision minor_change_no_model_rerun_needed
- PELE refresh audit: GREEN; 48/48 teams covered
- Score v4 QA: pass; failures 0
- Projection v4 QA: pass; failures 0
- Recommendation v4 QA: pass; failures 0
- Team Builder v4 QA: pass; Balanced starter points 83.134
- Active data-flow QA: pass
- Live fixture mapping QA: passed; in-progress suppressed 1; unsafe leaks 0
- Local browser QA: pass; console errors 0; old globals 0
- Legacy public path check: pass; matches 0
- Syntax checks: pass

## Official Monitor

- New/removed players: 0/0
- Price changes: 0
- Position changes: 0
- Selectable status changes: 0
- Team/country changes: 0
- Squad changes: 0
- Rules/deadline changes: 0
- Ownership-percent changes: 100 (non-model signal)
- Fetch failures: 0

## Live Support

- Completed MD1 fixtures included: 24
- In-progress fixtures suppressed: 1
- Scheduled fixtures: 47
- Player actual-point rows imported: 753
- Player match-status rows imported: 1488 (61 non-empty; 29 unfinalized suppressed)
- Unsafe fixture/player point leaks: 0

## Top Projected MD2 Picks

| # | Player | Team | Pos | Opp | Pts | Start % |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Lionel Messi | Argentina | FWD |  | 9.446 | 93.5 |
| 2 | Michael Olise | France | MID |  | 9.146 | 93.5 |
| 3 | Ousmane Dembélé | France | MID |  | 8.907 | 79 |
| 4 | Luis Díaz | Colombia | MID |  | 8.773 | 93.5 |
| 5 | Kylian Mbappé | France | FWD |  | 8.614 | 93.5 |
| 6 | Harry Kane | England | FWD |  | 8.613 | 93.5 |
| 7 | Jamal Musiala | Germany | MID |  | 8.559 | 79 |
| 8 | Petar Musa | Croatia | FWD |  | 8.014 | 79 |
| 9 | Désiré Doué | France | MID |  | 7.977 | 79 |
| 10 | Bradley Barcola | France | MID |  | 7.799 | 73.5 |

## Top Captain Watchlist

| # | Player | Team | Pos | Opp | Pts | Captain |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Michael Olise | France | MID |  | 9.146 | 28.027 |
| 2 | Lionel Messi | Argentina | FWD |  | 9.446 | 27.432 |
| 3 | Kylian Mbappé | France | FWD |  | 8.614 | 26.976 |
| 4 | Ousmane Dembélé | France | MID |  | 8.907 | 26.74 |
| 5 | Harry Kane | England | FWD |  | 8.613 | 25.769 |
| 6 | Désiré Doué | France | MID |  | 7.977 | 24.708 |
| 7 | Luis Díaz | Colombia | MID |  | 8.773 | 24.69 |
| 8 | Jamal Musiala | Germany | MID |  | 8.559 | 23.745 |
| 9 | Bradley Barcola | France | MID |  | 7.799 | 23.634 |
| 10 | Enzo Fernández | Argentina | MID |  | 7.781 | 23.47 |

## Balanced Squad

- Status: pass
- Formation: 4-3-3
- Budget used/left: 99.6/0.4
- Starter projected points: 83.134
- Captain: Michael Olise (France)
- Vice captain: Lionel Messi (Argentina)

## Largest Score Total xG Changes

| Fixture | MD | Old xG | New xG | Delta |
| --- | --- | --- | --- | --- |
| France vs Iraq | md2 | 3.221 | 4.954 | 1.733 |
| Norway vs France | md3 | 2.854 | 4.409 | 1.555 |
| Norway vs Senegal | md2 | 2.485 | 3.82 | 1.335 |
| Curaçao vs Côte d'Ivoire | md3 | 2.593 | 3.923 | 1.33 |
| Tunisia vs Japan | md2 | 2.303 | 3.558 | 1.255 |
| Senegal vs Iraq | md3 | 2.334 | 3.546 | 1.212 |
| Japan vs Sweden | md3 | 2.635 | 3.802 | 1.167 |
| Tunisia vs Netherlands | md3 | 2.679 | 3.834 | 1.155 |
| Ecuador vs Germany | md3 | 2.784 | 3.928 | 1.144 |
| Panama vs England | md3 | 2.918 | 4.04 | 1.122 |

## Known Limits

- Final squads are not source-backed in the active data path.
- Official lock/deadline legality is not claimed as verified by this refresh.
- MD2 in-progress fixture/player actuals are display/support only and not model calibration signal.
- Ownership movement is monitored as a feed change but is not used as a model signal.
- This remains an independent fantasy helper, not an official FIFA recommendation.
