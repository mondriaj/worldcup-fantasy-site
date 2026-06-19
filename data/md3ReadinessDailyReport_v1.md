# MD3 Readiness Daily Report v1

Generated: 2026-06-19T00:27:47.154Z

## Summary

| Item | Result |
| --- | --- |
| Public MD2 live update status | green |
| Safe to share public MD2 | yes |
| Completed MD1 fixtures | 24 / 24 |
| Completed MD2 fixtures used | 3 |
| MD2 in-progress fixtures excluded | 0 |
| MD2 scheduled fixtures excluded | 21 |
| MD2 player point rows imported | 94 |
| Official monitor result | minor_change_no_model_rerun_needed |
| Material player/rule changes | no |
| MD3 model rebuild safe today | no |
| MD3 staging created | no |

## Official Monitor

| Check | Count |
| --- | --- |
| New players | 0 |
| Removed players | 0 |
| Price changes | 0 |
| Position changes | 0 |
| Selectable status changes | 0 |
| Country/team changes | 0 |
| Ownership changes | 183 |
| Rules source/header changes | 0 |
| Deadline/round changes | 0 |
| Clean Sheet Shield text changes | 0 |

Ownership movement is recorded as non-model signal. No price, position, selectable status, team/country, new/removed player, scoring, booster, deadline, or lock-content change is present after the round-status metadata refresh.

## Live Fixture Gate

| Metric | Count |
| --- | --- |
| Total fixtures | 72 |
| Mapped fixtures | 72 |
| Completed MD1 fixtures | 24 |
| Completed MD2 fixtures | 3 |
| MD2 in-progress fixtures | 0 |
| MD2 scheduled fixtures | 21 |
| Scheduled future fixtures | 45 |
| Safe final scores shown | 27 |
| Unsafe fixture/player point leaks | 0 |

## Completed MD2 Fixtures Used

| Match | Fixture | Score | Pred xG | Total Residual |
| --- | --- | --- | --- | --- |
| 25 | Czechia vs South Africa | 1-1 | 1.717-0.714 | -0.431 |
| 26 | Switzerland vs Bosnia and Herzegovina | 4-1 | 1.811-0.862 | 2.327 |
| 27 | Canada vs Qatar | 6-0 | 2.002-0.495 | 3.503 |

## Team Residuals

| Team | Opponent | GF Res | GA Res | CS Prob | CS Actual |
| --- | --- | --- | --- | --- | --- |
| Canada | Qatar | 3.998 | -0.495 | 0.457 | yes |
| Switzerland | Bosnia and Herzegovina | 2.189 | 0.138 | 0.317 | no |
| Czechia | South Africa | -0.717 | 0.286 | 0.367 | no |
| Qatar | Canada | -0.495 | 3.998 | 0.101 | no |
| South Africa | Czechia | 0.286 | -0.717 | 0.135 | no |
| Bosnia and Herzegovina | Switzerland | 0.138 | 2.189 | 0.123 | no |

## Clean Sheet Checks

| Team | Opponent | CS Prob | Actual CS | Threshold Result |
| --- | --- | --- | --- | --- |
| Czechia | South Africa | 0.367 | no | hit |
| South Africa | Czechia | 0.135 | no | hit |
| Switzerland | Bosnia and Herzegovina | 0.317 | no | hit |
| Bosnia and Herzegovina | Switzerland | 0.123 | no | hit |
| Canada | Qatar | 0.457 | yes | miss |
| Qatar | Canada | 0.101 | no | hit |

## Player Projection Misses

| Player | Team | Pos | Actual | Projected | Residual | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Jonathan David | Canada | FWD | 24 | 5.538 | 18.462 | start |
| Johan Manzambi | Switzerland | MID | 15 | 2.159 | 12.841 | sub |
| Nathan Saliba | Canada | MID | 13 | 0.218 | 12.782 | sub |
| Cyle Larin | Canada | FWD | 13 | 1.787 | 11.213 | start |
| Rubén Vargas | Switzerland | MID | 15 | 4.612 | 10.388 | sub |
| Michal Sadílek | Czechia | MID | 11 | 1.185 | 9.815 | start |
| Ermin Mahmic | Bosnia and Herzegovina | MID | 9 | 0.086 | 8.914 | sub |
| Homam El Amin Mohamed Ahmed | Qatar | DEF | -6 | 1.554 | -7.554 | start |
| Silvan Widmer | Switzerland | DEF | 9 | 1.875 | 7.125 | start |
| Thapelo Maseko | South Africa | FWD | 7 | 0.041 | 6.959 | start |
| Granit Xhaka | Switzerland | MID | 10 | 3.22 | 6.78 | start |
| Ali Ahmed | Canada | MID | 8 | 1.461 | 6.539 | start |
| Teboho Mokoena | South Africa | MID | 9 | 2.545 | 6.455 | start |
| Pavel Sulc | Czechia | MID | 0 | 5.828 | -5.828 | sub |
| Luc De Fougerolles | Canada | DEF | 9 | 3.222 | 5.778 | start |
| Alistair Johnston | Canada | DEF | 9 | 3.37 | 5.63 | start |
| Maxime Crépeau | Canada | GK | 9 | 4.073 | 4.927 | start |
| Pedro Miguel Carvalho Deus Correia | Qatar | DEF | -3 | 1.695 | -4.695 | start |
| Richie Laryea | Canada | DEF | 9 | 4.354 | 4.646 | start |
| Tarik Muharemovic | Bosnia and Herzegovina | DEF | -3 | 1.607 | -4.607 | start |

## Role And Participation Evidence

| Bucket | Count |
| --- | --- |
| start | 66 |
| sub | 28 |

| Prior Role Tier | Count |
| --- | --- |
| locked_starter | 31 |
| likely_starter | 29 |
| bench_depth | 12 |
| impact_sub | 10 |
| rotation_risk | 7 |
| possible_starter | 5 |

## MD3 Decision

- Only 3/24 MD2 fixtures are final; this is too thin for a useful MD3 staging rebuild.
- Live player feed has manual-review flags before projection or role changes.

MD3 should remain staging only. No MD3 staging rebuild was created today because the official monitor is clean for model fields, but only a small partial MD2 sample is final and live player status still has manual-review flags. In-progress or scheduled MD2 scores and player points were not used.

## Known Limits

- Only 3 of 24 MD2 fixtures are final, so residuals are volatile.
- The live player feed provides fantasy points and matchStatus, not official player minutes or injury reasons.
- 58 players are marked not_in_squad in the live feed and require manual review before projection or role changes.
- Final squads remain not source-backed.
- No betting odds, confirmed lineups, locks, user-team state, substitutions, or booster state are imported.
