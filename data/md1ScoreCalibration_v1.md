# MD1 Score Calibration v1

Generated: 2026-06-17T22:45:24.963Z

## Scope

Used 22 completed MD1 fixtures with safe final scores. Excluded 2 unfinished MD1 fixtures from calibration.

## Calibration

| Metric | Value |
| --- | --- |
| Completed MD1 fixtures used | 22 |
| Pending MD1 fixtures excluded | 2 |
| Actual avg total goals | 3.182 |
| Prior predicted avg total goals | 2.469 |
| Raw actual/predicted ratio | 1.289 |
| Applied MD2/MD3 goal multiplier | 1.1 |
| MD2/MD3 fixtures adjusted | 48 |

## Unfinished MD1 Fixtures

| Match | Fixture | Status | Date |
| --- | --- | --- | --- |
| 21 | Ghana vs Panama | scheduled | 2026-06-18T00:00:00+01:00 |
| 24 | Uzbekistan vs Colombia | scheduled | 2026-06-18T03:00:00+01:00 |

## Largest Calibration Residuals

| Match | Fixture | Actual goals | Predicted goals | Diff |
| --- | --- | --- | --- | --- |
| 10 | Germany 7-1 Curaçao | 8 | 3.395 | 4.605 |
| 12 | Sweden 5-1 Tunisia | 6 | 2.239 | 3.761 |
| 22 | England 4-2 Croatia | 6 | 2.336 | 3.664 |
| 14 | Spain 0-0 Cabo Verde | 0 | 3.55 | -3.55 |
| 4 | USA 4-1 Paraguay | 5 | 2.315 | 2.685 |
| 18 | Iraq 1-4 Norway | 5 | 2.71 | 2.29 |
| 15 | IR Iran 2-2 New Zealand | 4 | 1.989 | 2.011 |
| 17 | France 3-1 Senegal | 4 | 2.182 | 1.818 |
| 5 | Haiti 0-1 Scotland | 1 | 2.574 | -1.574 |
| 20 | Austria 3-1 Jordan | 4 | 2.436 | 1.564 |

## Decision

- MD1 scoring is running hotter than the pre-MD1 score context, but the adjustment is deliberately shrunk to avoid overfitting a partial matchday.
- Calibration applies only to MD2/MD3 score contexts used by player projections and recommendations.
- The two unfinished MD1 fixtures need a final refresh once scores and player points are official.
