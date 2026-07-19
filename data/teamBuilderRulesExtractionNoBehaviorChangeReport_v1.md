# Team Builder Rules Extraction No-Behavior-Change Report v1

Status: GREEN

The rules extraction is intended to be behavior-neutral. It centralizes rule constants and derivation only; it does not change optimizer scoring, candidate ordering, captain ranking, recommendations, projections, score predictions, fixtures, public copy, public data wrappers, or the generated Team Builder artifact.

## Frozen values

| Fact | Value |
| --- | --- |
| Budget used / limit | 94.8 / 105 |
| Country/team cap | 8 |
| Squad size | 15 |
| Starters / bench | 11 / 4 |
| Active formation | 4-3-3 |
| Position requirements | GK 2, DEF 5, MID 5, FWD 3 |
| Starter requirements | GK 1, DEF 4, MID 3, FWD 3 |
| Captain | Mikel Oyarzabal |
| Vice-captain | Leandro Paredes |
| Team counts | Argentina 8, Spain 5, France 1, England 1 |
| Fixture counts | Final 13, Third Place 2 |
| Objective | raw 59.552, optionality 5.291, composite 1014.93 |
| Active candidate count | 101 |

`script.js` line count changed from `15351` to `15258`.

## Source classification

Rules are current-implementation-backed for Team Builder behavior. The official rules data backs the base squad structure, allowed formations, 100 budget plus 5 knockout increase, captain required flag, and Final Round country cap. The active generated artifact confirms the public Final Round implementation values used by the browser default.
