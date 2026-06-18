# Score Model v4 MD2

Generated: 2026-06-18T17:50:28.195Z

## Purpose

Score Model v4 is an emergency MD1-calibrated Match Environment model for MD2/MD3. It uses the refreshed PELE/teamQuality prior and applies only completed MD1 fixture evidence from `data/md1CalibrationDataset_v1.json`.

This run refreshes PELE/teamQuality first, then rebuilds the dependent score layer. It does not change player role, finance, or Team Builder weighting logic.

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
| PELE rebuilt | true |
| PELE source checked | 2026-06-18 |
| MD2 already started | true |
| MD2 live actuals used for calibration | false |
| Final squads source-backed | false |
| Ownership used as signal | false |

## Method

- Start from refreshed `data/scorePredictions_fantasyPool_v3.json`, rebuilt from the refreshed PELE/teamQuality prior.
- Retain MD1 prior prediction fields for postmortem/display support.
- Recompute MD2/MD3 expected goals with a shrunken global goal-environment lift plus team attack and defensive weakness residual multipliers.
- Recompute scoreline distribution from the new xG using the Poisson grid already used by prior score models.
- Recompute W/D/L, then blend modestly toward neutral tournament uncertainty because MD1 result calibration was weak.
- Recompute clean-sheet probabilities from new opponent xG and apply an extra shrunken clean-sheet correction because MD1 clean-sheet calls were too optimistic.
- Do not use MD2 live or in-progress scores as calibration signal.
- Keep public language fantasy-facing; this is not betting odds and not official projection language.

## Largest MD2/MD3 xG Changes

| Match | Fixture | MD | Prior xG | New xG | Delta |
| --- | --- | --- | --- | --- | --- |
| 42 | France vs Iraq | md2 | 3.221 | 4.954 | 1.733 |
| 61 | Norway vs France | md3 | 2.854 | 4.409 | 1.555 |
| 41 | Norway vs Senegal | md2 | 2.485 | 3.82 | 1.335 |
| 55 | Curaçao vs Côte d'Ivoire | md3 | 2.593 | 3.923 | 1.33 |
| 36 | Tunisia vs Japan | md2 | 2.303 | 3.558 | 1.255 |
| 62 | Senegal vs Iraq | md3 | 2.334 | 3.546 | 1.212 |
| 57 | Japan vs Sweden | md3 | 2.635 | 3.802 | 1.167 |
| 58 | Tunisia vs Netherlands | md3 | 2.679 | 3.834 | 1.155 |
| 56 | Ecuador vs Germany | md3 | 2.784 | 3.928 | 1.144 |
| 67 | Panama vs England | md3 | 2.918 | 4.04 | 1.122 |

## Trust Notes

- PELE/teamQuality was refreshed before this score rebuild.
- Final squads remain not source-backed.
- No ownership-only changes were used as model signal.
- Completed MD1 final-score support remains separate in the live support layer.
