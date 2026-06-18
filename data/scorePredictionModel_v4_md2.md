# Score Model v4 MD2

Generated: 2026-06-18T12:46:53.517Z

## Purpose

Score Model v4 is an emergency MD1-calibrated Match Environment model for MD2/MD3. It keeps PELE/teamQuality as the prior and applies only completed MD1 fixture evidence from `data/md1CalibrationDataset_v1.json`.

It does not rebuild PELE, teamQuality, player projections, recommendations, finance metrics, or Team Builder weights.

## Calibration

| Metric | Value |
| --- | --- |
| Model version | score-v4-md2-pele-md1-calibrated |
| MD1 fixtures used | 24 |
| MD1 predicted goals per match | 2.461 |
| MD1 actual goals per match | 3.125 |
| Calibration ratio | 1.2699 |
| Global shrink | 0.55 |
| Global goal multiplier | 1.1404 |
| Team attack shrink | 0.35 |
| Team defense shrink | 0.35 |
| Clean-sheet calibration used | true |
| Clean-sheet multiplier | 0.75 |
| W/D/L confidence shrink used | true |
| W/D/L confidence shrink | 0.1133 |
| PELE rebuilt | false |
| Final squads source-backed | false |
| Ownership used as signal | false |

## Method

- Start from `data/scorePredictions_fantasyPool_v3.json`.
- Retain MD1 prior prediction fields for postmortem/display support.
- Recompute MD2/MD3 expected goals with a shrunken global goal-environment lift plus team attack and defensive weakness residual multipliers.
- Recompute scoreline distribution from the new xG using the Poisson grid already used by prior score models.
- Recompute W/D/L, then blend modestly toward neutral tournament uncertainty because MD1 result calibration was weak.
- Recompute clean-sheet probabilities from new opponent xG and apply an extra shrunken clean-sheet correction because MD1 clean-sheet calls were too optimistic.
- Keep public language fantasy-facing; this is not betting odds and not official projection language.

## Largest MD2/MD3 xG Changes

| Match | Fixture | MD | Prior xG | New xG | Delta |
| --- | --- | --- | --- | --- | --- |
| 42 | France vs Iraq | md2 | 3.468 | 5.091 | 1.623 |
| 61 | Norway vs France | md3 | 2.949 | 4.56 | 1.611 |
| 41 | Norway vs Senegal | md2 | 2.579 | 3.964 | 1.385 |
| 62 | Senegal vs Iraq | md3 | 2.614 | 3.971 | 1.357 |
| 36 | Tunisia vs Japan | md2 | 2.473 | 3.819 | 1.346 |
| 58 | Tunisia vs Netherlands | md3 | 2.881 | 4.124 | 1.243 |
| 55 | Curaçao vs Côte d'Ivoire | md3 | 2.46 | 3.697 | 1.237 |
| 57 | Japan vs Sweden | md3 | 2.721 | 3.929 | 1.208 |
| 67 | Panama vs England | md3 | 2.977 | 4.115 | 1.138 |
| 56 | Ecuador vs Germany | md3 | 2.889 | 4.024 | 1.135 |

## Trust Notes

- PELE/teamQuality remains the prior and was not rebuilt.
- Final squads remain not source-backed.
- No ownership-only changes were used as model signal.
- Completed MD1 final-score support remains separate in the live support layer.
