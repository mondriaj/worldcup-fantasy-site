# Team Builder Constraint Extraction No-Behavior-Change Proof v1

Generated: 2026-07-19T02:10:00.000Z

Status: **green**

| Item | Value |
| --- | --- |
| Public behavior changed | no |
| Model outputs changed | no |
| Optimizer behavior changed | no |
| Selected squad changed | no |
| Public data wrappers changed | no |
| Team Builder public helper wrapper changed | yes, helper-only |
| Public copy changed | no |
| Recommendations/projections/score predictions/fixtures changed | no |
| Budget | 94.8 / 105 |
| Captain / vice | Mikel Oyarzabal / Leandro Paredes |
| Team counts | Argentina 8, Spain 5, France 1, England 1 |
| Fixture counts | final 13, third_place 2 |
| Objective | raw 59.552, optionality 5.291, composite 1014.93 |
| Active candidate count | 101 |
| `script.js` line count before/after | 15273 / 15351 |

The extraction moves pure constraint validation into shared helpers. Browser DOM state, user locks/removals, candidate ordering, optimizer scoring, captain/vice ranking, and public warning copy remain in `script.js`. Public data wrappers, recommendations, projections, score predictions, fixtures, and the generated Team Builder artifact are unchanged.
