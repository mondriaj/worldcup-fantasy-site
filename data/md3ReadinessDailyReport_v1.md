# MD3 Readiness Daily Report v1

Generated: 2026-06-22T14:16:54.082Z

## Summary

| Item | Result |
| --- | --- |
| Public MD2 live update status | green |
| Safe to share public MD2 | yes |
| Completed MD1 fixtures | 24 / 24 |
| Completed MD2 fixtures used | 16 |
| MD2 in-progress fixtures excluded | 0 |
| MD2 scheduled fixtures excluded | 8 |
| MD2 player point rows imported | 507 |
| Official monitor result | no_change |
| Material player/rule changes | no |
| Tracked status changes MD2-actionable | 0 |
| Tracked status changes MD3-only | 8 |
| World Cup fixtures page current | yes |
| MD3 model rebuild safe today | no |
| MD3 staging status | skipped_live_player_manual_review_needed |
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
| Ownership changes | 0 |
| Rules source/header changes | 0 |
| Deadline/round changes | 0 |
| Clean Sheet Shield text changes | 0 |

Ownership movement is recorded as non-model signal. No price, position, selectable status, team/country, new/removed player, scoring, booster, deadline, or lock-content change is present after the round-status metadata refresh.

## Status Change Actionability

| ID | Player | Team | Status Change | MD2 Fixture | Fixture Status | MD2 Actionable | MD3 Defer |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 141 | Tarik Muharemovic | Bosnia and Herzegovina | playing -> suspended | Switzerland vs Bosnia and Herzegovina | completed | no | yes |
| 245 | Ismaël Koné | Canada | playing -> injured | Canada vs Qatar | completed | no | yes |
| 741 | César Montes | Mexico | suspended -> playing | Mexico vs Korea Republic | completed | no | yes |
| 901 | Miguel Almirón | Paraguay | playing -> suspended | Türkiye vs Paraguay | completed | no | yes |
| 947 | Assim Omer Al Haj Madibo | Qatar | playing -> suspended | Canada vs Qatar | completed | no | yes |
| 1058 | Teboho Mokoena | South Africa | playing -> suspended | Czechia vs South Africa | completed | no | yes |
| 1062 | Sphephelo S'Miso Sithole | South Africa | suspended -> playing | Czechia vs South Africa | completed | no | yes |
| 1506 | Homam El Amin Mohamed Ahmed | Qatar | playing -> suspended | Canada vs Qatar | completed | no | yes |

All tracked status changes are MD3-relevant only because their MD2 fixtures are completed or no longer actionable. The MD2 player-side stack was not rebuilt from these changes.

## Live Fixture Gate

| Metric | Count |
| --- | --- |
| Total fixtures | 72 |
| Mapped fixtures | 72 |
| Completed MD1 fixtures | 24 |
| Completed MD2 fixtures | 16 |
| MD2 in-progress fixtures | 0 |
| MD2 scheduled fixtures | 8 |
| Scheduled future fixtures | 32 |
| Safe final scores shown | 40 |
| Unsafe fixture/player point leaks | 0 |

## World Cup Fixtures Page

| Metric | Result |
| --- | --- |
| QA status | passed |
| Completed MD1 finals visible | 24 / 24 |
| Completed MD2 finals visible | 16 / 16 |
| Playing MD2 fixtures marked live | 0 / 0 |
| Scheduled fixtures marked scheduled | 32 / 32 |
| Unsafe score leaks | 0 |

## Completed MD2 Fixtures Used

| Match | Fixture | Score | Pred xG | Total Residual |
| --- | --- | --- | --- | --- |
| 25 | Czechia vs South Africa | 1-1 | 1.717-0.714 | -0.431 |
| 26 | Switzerland vs Bosnia and Herzegovina | 4-1 | 1.811-0.862 | 2.327 |
| 27 | Canada vs Qatar | 6-0 | 2.002-0.495 | 3.503 |
| 28 | Mexico vs Korea Republic | 1-0 | 1.797-0.82 | -1.617 |
| 32 | USA vs Australia | 2-0 | 1.666-1.27 | -0.936 |
| 30 | Scotland vs Morocco | 0-1 | 0.685-1.267 | -0.952 |
| 29 | Brazil vs Haiti | 3-0 | 2.708-0.405 | -0.113 |
| 31 | Türkiye vs Paraguay | 0-1 | 1.727-1.204 | -1.931 |
| 35 | Netherlands vs Sweden | 5-1 | 2.597-1.213 | 2.19 |
| 33 | Germany vs Côte d'Ivoire | 2-1 | 2.666-1.043 | -0.709 |
| 34 | Ecuador vs Curaçao | 0-0 | 3.062-0.549 | -3.611 |
| 36 | Tunisia vs Japan | 0-4 | 0.457-3.101 | 0.442 |
| 38 | Spain vs Saudi Arabia | 4-0 | 2.515-0.409 | 1.076 |
| 39 | Belgium vs IR Iran | 0-0 | 2.215-0.753 | -2.968 |
| 37 | Uruguay vs Cabo Verde | 2-2 | 1.828-0.409 | 1.763 |
| 40 | New Zealand vs Egypt | 1-3 | 0.721-2.264 | 1.015 |

## Team Residuals

| Team | Opponent | GF Res | GA Res | CS Prob | CS Actual |
| --- | --- | --- | --- | --- | --- |
| Canada | Qatar | 3.998 | -0.495 | 0.457 | yes |
| Ecuador | Curaçao | -3.062 | -0.549 | 0.433 | yes |
| Netherlands | Sweden | 2.403 | -0.213 | 0.223 | no |
| Belgium | IR Iran | -2.215 | -0.753 | 0.353 | yes |
| Switzerland | Bosnia and Herzegovina | 2.189 | 0.138 | 0.317 | no |
| Türkiye | Paraguay | -1.727 | -0.204 | 0.225 | no |
| Cabo Verde | Uruguay | 1.591 | 0.172 | 0.121 | no |
| Spain | Saudi Arabia | 1.485 | -0.409 | 0.498 | yes |
| Australia | USA | -1.27 | 0.334 | 0.142 | no |
| Japan | Tunisia | 0.899 | -0.457 | 0.475 | yes |
| Korea Republic | Mexico | -0.82 | -0.797 | 0.124 | no |
| Mexico | Korea Republic | -0.797 | -0.82 | 0.33 | yes |

## Clean Sheet Checks

| Team | Opponent | CS Prob | Actual CS | Threshold Result |
| --- | --- | --- | --- | --- |
| Czechia | South Africa | 0.367 | no | hit |
| South Africa | Czechia | 0.135 | no | hit |
| Switzerland | Bosnia and Herzegovina | 0.317 | no | hit |
| Bosnia and Herzegovina | Switzerland | 0.123 | no | hit |
| Canada | Qatar | 0.457 | yes | miss |
| Qatar | Canada | 0.101 | no | hit |
| Mexico | Korea Republic | 0.33 | yes | miss |
| Korea Republic | Mexico | 0.124 | no | hit |
| USA | Australia | 0.211 | yes | miss |
| Australia | USA | 0.142 | no | hit |
| Scotland | Morocco | 0.211 | no | hit |
| Morocco | Scotland | 0.378 | yes | miss |
| Brazil | Haiti | 0.5 | yes | hit |
| Haiti | Brazil | 0.05 | no | hit |
| Türkiye | Paraguay | 0.225 | no | hit |
| Paraguay | Türkiye | 0.133 | yes | miss |
| Netherlands | Sweden | 0.223 | no | hit |
| Sweden | Netherlands | 0.056 | no | hit |
| Germany | Côte d'Ivoire | 0.264 | no | hit |
| Côte d'Ivoire | Germany | 0.052 | no | hit |
| Ecuador | Curaçao | 0.433 | yes | miss |
| Curaçao | Ecuador | 0.035 | yes | miss |
| Tunisia | Japan | 0.034 | no | hit |
| Japan | Tunisia | 0.475 | yes | miss |
| Spain | Saudi Arabia | 0.498 | yes | miss |
| Saudi Arabia | Spain | 0.061 | no | hit |
| Belgium | IR Iran | 0.353 | yes | miss |
| IR Iran | Belgium | 0.082 | yes | miss |
| Uruguay | Cabo Verde | 0.498 | no | hit |
| Cabo Verde | Uruguay | 0.121 | no | hit |
| New Zealand | Egypt | 0.078 | no | hit |
| Egypt | New Zealand | 0.365 | no | hit |

## Player Projection Misses

| Player | Team | Pos | Actual | Projected | Residual | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Jonathan David | Canada | FWD | 24 | 5.538 | 18.462 | start |
| Cody Gakpo | Netherlands | FWD | 19 | 4.308 | 14.692 | start |
| Brian Brobbey | Netherlands | FWD | 15 | 1.248 | 13.752 | start |
| Alexander Freeman | USA | DEF | 16 | 2.252 | 13.748 | start |
| Johan Manzambi | Switzerland | MID | 15 | 2.159 | 12.841 | sub |
| Nathan Saliba | Canada | MID | 13 | 0.218 | 12.782 | sub |
| Eloy Room | Curaçao | GK | 14 | 1.283 | 12.717 | start |
| Matheus Santos Carneiro da Cunha | Brazil | FWD | 15 | 2.356 | 12.644 | start |
| Luis Romo | Mexico | MID | 12 | 0.144 | 11.856 | start |
| Mostafa Mohamed Zaki Abdelraouf | Egypt | MID | 14 | 2.584 | 11.416 | start |
| Ayase Ueda | Japan | FWD | 18 | 6.653 | 11.347 | start |
| Cyle Larin | Canada | FWD | 13 | 1.787 | 11.213 | start |
| Rubén Vargas | Switzerland | MID | 15 | 4.612 | 10.388 | sub |
| Ko Itakura | Japan | DEF | 12 | 1.691 | 10.309 | start |
| Matías Galarza | Paraguay | MID | 11 | 0.829 | 10.171 | start |
| Michal Sadílek | Czechia | MID | 11 | 1.185 | 9.815 | start |
| Mikel Oyarzabal | Spain | FWD | 15 | 5.578 | 9.422 | start |
| Orlando Gill | Paraguay | GK | 10 | 0.821 | 9.179 | start |
| Sergiño Dest | USA | DEF | 12 | 2.895 | 9.105 | start |
| Alireza Beiranvand | IR Iran | GK | 11 | 1.974 | 9.026 | start |

## Role And Participation Evidence

| Bucket | Count |
| --- | --- |
| start | 352 |
| sub | 155 |

| Prior Role Tier | Count |
| --- | --- |
| likely_starter | 163 |
| locked_starter | 134 |
| impact_sub | 60 |
| possible_starter | 50 |
| bench_depth | 47 |
| rotation_risk | 43 |
| managed_minutes_star | 9 |
| no_md1_evidence | 1 |

## MD3 Decision

- Live player feed has manual-review flags before projection or role changes.

MD3 should remain staging only. No MD3 staging rebuild was created today; staging status is `skipped_live_player_manual_review_needed`. In-progress or scheduled MD2 scores and player points were not used.

## Known Limits

- Only 16 of 24 MD2 fixtures are final, so residuals are still partial.
- The live player feed provides fantasy points and matchStatus, not official player minutes, injury reasons, suspension reasons, or return dates.
- 189 players are marked not_in_squad in the live feed and require manual review before projection or role changes.
- Final squads remain not source-backed.
- No betting odds, confirmed lineups, locks, user-team state, substitutions, or booster state are imported.
