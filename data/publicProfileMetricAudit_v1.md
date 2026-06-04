# Public Profile Metric Display Audit v1

Date: 2026-06-04

Scope: public Picks and Player Profile display only. This audit does not change player data, recommendation logic, model logic, rules data, or official data pipelines.

## Display Changes

- Picks intro text is shown once in the normal Picks section description.
- Player Profile fantasy point metrics are displayed as points per matchday.
- Player Profile finance/model/risk metrics are displayed as a 0 to 100 index plus a percentile.
- Bad-Week Probability was removed from public Player Profile display.

## Comparison Pool

- Pool: `FANTASY_POOL_PLAYER_FINANCE_METRICS`.
- Size: 1,256 current public fantasy-pool finance rows.
- Deduping key: official fantasy player ID, then internal player ID, then name.
- Percentiles are calculated across the full public player pool, not position-specific pools.

## Formulas

- Expected Points: selected/default matchday `raw_expected_points`.
- Points After Risk: selected/default matchday `risk_adjusted_points`.
- Value Index: min-max normalized `risk_adjusted_points_per_price`; percentile ranks the same raw field, higher is better.
- Squad Fit Index: min-max normalized `scarcity_adjusted_value`; percentile ranks the same raw field, higher is better.
- Captain Alpha Index: min-max normalized `captain_score`; percentile ranks the same raw field, higher is better.
- Bad-Week Floor Index: min-max normalized `bad_week_floor`; percentile ranks the same raw field, higher is better.
- Risk-Control Index: min-max normalized inverse of `downside_risk_proxy + volatility_proxy + minutes_risk + role_risk`; percentile ranks the same inverted risk sum, lower raw risk is better.
- Budget Ease Index: min-max normalized inverse of `price_tier_opportunity_cost`; percentile ranks the same inverted field, lower raw opportunity cost is better.

Missing values: if a public metric value is missing, that metric is omitted from the profile rather than shown as "Needs check".

Bad-Week Probability: the older fallback finance model includes a `finance_bad_week_probability` field, but the current public fantasy-pool profile feed does not provide a consistent probability field for these 1,256 rows. The public profile therefore removes Bad-Week Probability and uses Bad-Week Floor Index from the current public finance feed instead.

## Sample Checks

| Player | Country | Expected pts / matchday | Risk-adjusted pts / matchday | Value Index | Squad Fit Index | Captain Alpha Index | Bad-Week Floor Index | Risk-Control Index | Budget Ease Index |
| --- | --- | ---: | ---: | --- | --- | --- | --- | --- | --- |
| Lionel Messi | Argentina | 8.12 | 7.55 | 52/100 (89th percentile) | 100/100 (100th percentile) | 96/100 (100th percentile) | 91/100 (96th percentile) | 98/100 (89th percentile) | 100/100 (100th percentile) |
| Harry Kane | England | 7.46 | 6.93 | 45/100 (83rd percentile) | 93/100 (100th percentile) | 89/100 (100th percentile) | 93/100 (98th percentile) | 98/100 (89th percentile) | 91/100 (96th percentile) |
| Kylian Mbappe | France | 7.14 | 6.64 | 43/100 (81st percentile) | 89/100 (100th percentile) | 86/100 (99th percentile) | 86/100 (90th percentile) | 97/100 (77th percentile) | 86/100 (95th percentile) |
| Cristiano Ronaldo dos Santos Aveiro | Portugal | 6.30 | 5.86 | 40/100 (77th percentile) | 80/100 (99th percentile) | 76/100 (99th percentile) | 89/100 (93rd percentile) | 97/100 (81st percentile) | 75/100 (88th percentile) |
| Erling Haaland | Norway | 5.40 | 5.02 | 33/100 (66th percentile) | 70/100 (97th percentile) | 64/100 (96th percentile) | 91/100 (97th percentile) | 99/100 (91st percentile) | 62/100 (74th percentile) |
| Emiliano Martinez | Argentina | 6.05 | 5.63 | 77/100 (99th percentile) | 78/100 (99th percentile) | 66/100 (97th percentile) | 94/100 (99th percentile) | 99/100 (95th percentile) | 100/100 (100th percentile) |

Sample check result: no sample public profile metric requires "Needs check".
