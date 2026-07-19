# Team Builder Optimizer Utilities No-Behavior-Change Proof v1

Generated: 2026-07-19T00:43:18.277Z

Status: **pass**

## Summary

This pass adds read-only optimizer utility helpers for selected-squad constraint validation. It does not wire those helpers into `script.js`, does not change the optimizer loop, and does not change generated model outputs or public copy.

| Item | Value |
| --- | --- |
| Public behavior unchanged | yes |
| Model outputs unchanged | yes |
| Optimizer behavior changed | no |
| `script.js` optimizer loop changed | no |
| `script.js` line count | 15,273 -> 15,273 |
| Public data wrappers changed | no |
| Public copy changed | no |

## Protected Values

| Value | Result |
| --- | --- |
| Budget | 94.8 / 105 |
| Captain | Mikel Oyarzabal |
| Vice captain | Leandro Paredes |
| Team counts | Argentina 8, Spain 5, France 1, England 1 |
| Fixture counts | final 13, third_place 2 |
| Raw projected points | 59.552 |
| Optionality score | 5.291 |
| Composite score | 1014.93 |
| Selected squad | Emiliano Martínez, Unai Simón, Nicolás Tagliafico, Nahuel Molina, Lisandro Martínez, Cristian Romero, Pau Cubarsí, Leandro Paredes, Alexis Mac Allister, Enzo Fernández, Álex Baena, Fabián Ruiz, Kylian Mbappé, Harry Kane, Mikel Oyarzabal |

## Utility QA

| Check | Result |
| --- | --- |
| Optimizer utility validator | pass |
| Checks run | 16 |
| Budget feasibility | 94.8 / 105 |
| Position counts | GK 2, DEF 5, MID 5, FWD 3 |
| Team counts | Argentina 8, Spain 5, France 1, England 1 |
| Fixture counts | final 13, third_place 2 |
| Captain/vice valid | yes |
| Deterministic | yes |
| No input mutation | yes |
| Browser helper parity | yes |

## Unchanged Outputs

- `data/teamBuilderFinalRoundArtifact_v1.json`
- `teamBuilderFinalRoundArtifactData.js`
- `fantasyPoolRecommendationsData.js`
- `fantasyPoolMatchdayProjectionsData.js`
- `fantasyPoolScorePredictionsData.js`

## Boundary

The new helpers can support future optimizer extraction, but this pass deliberately leaves candidate scoring, path search, pruning, locks, avoids, substitutions, captain ranking, risk/trust controls, and rendering inside `script.js`.
