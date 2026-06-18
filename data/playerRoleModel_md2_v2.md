# Player Role / Start / Minutes Model MD2 v2

Generated: 2026-06-18T13:28:10.327Z

## Purpose

This is an MD2 role/start/minutes sidecar model. It uses the active official fantasy player pool as the identity universe, preserves the current MD2 projection row as the prior when available, and applies completed MD1 player point/status evidence plus Score Model v4 context.

It does **not** rebuild player projections, recommendations, finance metrics, Team Builder weights, score predictions, PELE, teamQuality, or public browser outputs.

## Inputs

- `fantasyPoolOfficialDataStatusData.js` for `FANTASY_POOL_OFFICIAL_DATA_STATUS.official_position_records`
- `fantasyPoolMatchdayProjectionsData.js` for active fantasy-pool MD1/MD2 projection priors
- `fantasyPoolRecommendationsData.js` for high-prior recommendation tiers only
- `fantasyPoolFinanceMetricsData.js` for preserved finance context only
- `data/md1CalibrationDataset_v1.json` and `data/livePlayerStatus_v1.json` for completed MD1 point/status evidence
- `data/scorePredictions_fantasyPool_v4_md2.json` and `fantasyPoolScorePredictionsData.js` for Score Model v4 light team/fixture context

## Evidence Limits

- Direct MD1 start/sub/not-in-squad evidence rows: 0
- Positive MD1 point rows are participation evidence, not exact minutes or confirmed starts.
- Zero/missing MD1 points are weak role evidence and are not allowed to destroy elite/high-prior players by themselves.
- Ownership fields exist in the live feed but are not used as model signal.
- Final squads are not source-backed.

## Summary

| Metric | Value |
| --- | --- |
| Model version | player-role-md2-v2-md1-evidence |
| Active official players | 1488 |
| Role rows | 1488 |
| QA status | pass |
| Elite/high-prior protected from over-downgrade | 42 |
| Not-selectable forced to zero | 243 |

## Role Tiers

| Tier | Rows |
| --- | --- |
| bench_depth | 278 |
| unavailable_or_not_selectable | 243 |
| likely_starter | 233 |
| locked_starter | 230 |
| impact_sub | 203 |
| rotation_risk | 136 |
| possible_starter | 125 |
| managed_minutes_star | 28 |
| no_md1_evidence | 12 |

## Safest Starters

| Player | Team | Pos | Opp | Tier | Start | Min | Prior | Delta | Evidence | Reason |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Emiliano Martínez | Argentina | GK | Austria | locked_starter | 0.935 | 85.5 | 0.94 | -0.005 | played_points_evidence | MD1 participation supports strong prior role, but starter field unavailable |
| Unai Simón | Spain | GK | Saudi Arabia | locked_starter | 0.935 | 84 | 0.908 | 0.027 | played_points_evidence | MD1 participation supports strong prior role, but starter field unavailable |
| Daniel Muñoz | Colombia | DEF | Congo DR | locked_starter | 0.935 | 81.2 | 0.94 | -0.005 | played_points_evidence | MD1 participation supports strong prior role, but starter field unavailable |
| Cristian Romero | Argentina | DEF | Austria | locked_starter | 0.935 | 81.2 | 0.94 | -0.005 | played_points_evidence | MD1 participation supports strong prior role, but starter field unavailable |
| Virgil van Dijk | Netherlands | DEF | Sweden | locked_starter | 0.935 | 80.9 | 0.934 | 0.001 | played_points_evidence | MD1 participation supports strong prior role, but starter field unavailable |
| Joshua Kimmich | Germany | DEF | Côte d'Ivoire | locked_starter | 0.935 | 80 | 0.91 | 0.025 | played_points_evidence | MD1 participation supports strong prior role, but starter field unavailable |
| Marc Cucurella | Spain | DEF | Saudi Arabia | locked_starter | 0.935 | 79.6 | 0.9 | 0.035 | played_points_evidence | MD1 participation supports strong prior role, but starter field unavailable |
| Aymeric Laporte | Spain | DEF | Saudi Arabia | locked_starter | 0.935 | 79.4 | 0.894 | 0.041 | played_points_evidence | MD1 participation supports strong prior role, but starter field unavailable |
| Luis Díaz | Colombia | MID | Congo DR | locked_starter | 0.935 | 77.4 | 0.95 | -0.015 | played_points_evidence | MD1 participation supports strong prior role, but starter field unavailable |
| Vinícius José Paixão de Oliveira Júnior | Brazil | MID | Haiti | locked_starter | 0.935 | 77.4 | 0.95 | -0.015 | played_points_evidence | MD1 participation supports strong prior role, but starter field unavailable |
| Bruno Guimarães Rodriguez Moura | Brazil | MID | Haiti | locked_starter | 0.935 | 77.4 | 0.95 | -0.015 | played_points_evidence | MD1 participation supports strong prior role, but starter field unavailable |
| Mohamed Salah Hamed Mahrous Ghaly | Egypt | MID | New Zealand | locked_starter | 0.935 | 77.4 | 0.95 | -0.015 | played_points_evidence | MD1 participation supports strong prior role, but starter field unavailable |
| Rodrigo De Paul | Argentina | MID | Austria | locked_starter | 0.935 | 77.4 | 0.95 | -0.015 | played_points_evidence | MD1 participation supports strong prior role, but starter field unavailable |
| Maxi Araújo | Uruguay | MID | Cabo Verde | locked_starter | 0.935 | 77.4 | 0.95 | -0.015 | played_points_evidence | MD1 participation supports strong prior role, but starter field unavailable |
| Alexis Mac Allister | Argentina | MID | Austria | locked_starter | 0.935 | 77.4 | 0.95 | -0.015 | played_points_evidence | MD1 participation supports strong prior role, but starter field unavailable |
| Takefusa Kubo | Japan | MID | Tunisia | locked_starter | 0.935 | 76.7 | 0.929 | 0.006 | played_points_evidence | MD1 participation supports strong prior role, but starter field unavailable |
| Declan Rice | England | MID | Ghana | locked_starter | 0.935 | 76.7 | 0.931 | 0.004 | played_points_evidence | MD1 participation supports strong prior role, but starter field unavailable |
| Florian Wirtz | Germany | MID | Côte d'Ivoire | locked_starter | 0.935 | 76.5 | 0.923 | 0.012 | played_points_evidence | MD1 participation supports strong prior role, but starter field unavailable |
| Daichi Kamada | Japan | MID | Tunisia | locked_starter | 0.935 | 76.5 | 0.924 | 0.011 | played_points_evidence | MD1 participation supports strong prior role, but starter field unavailable |
| Michael Olise | France | MID | Iraq | locked_starter | 0.935 | 76.4 | 0.92 | 0.015 | played_points_evidence | MD1 participation supports strong prior role, but starter field unavailable |

## Risky High-Upside Players

| Player | Team | Pos | Opp | Tier | Start | Min | Prior | Delta | Evidence | Reason |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Ivan Toney | England | FWD | Ghana | bench_depth | 0.175 | 19.2 | 0.205 | -0.03 | zero_or_missing_points_evidence | Downgraded after no MD1 point evidence |
| Alejandro Grimaldo | Spain | DEF | Saudi Arabia | impact_sub | 0.29 | 34.6 | 0.367 | -0.077 | zero_or_missing_points_evidence | Weak MD1 point evidence lowers role confidence |
| Borja Iglesias | Spain | FWD | Saudi Arabia | impact_sub | 0.299 | 33.3 | 0.378 | -0.079 | zero_or_missing_points_evidence | Weak MD1 point evidence lowers role confidence |
| Eberechi Eze | England | MID | Ghana | impact_sub | 0.317 | 35.2 | 0.403 | -0.086 | zero_or_missing_points_evidence | Weak MD1 point evidence lowers role confidence |
| Ollie Watkins | England | FWD | Ghana | bench_depth | 0.18 | 19.5 | 0.22 | -0.04 | zero_or_missing_points_evidence | Downgraded after no MD1 point evidence |
| Malo Gusto | France | DEF | Iraq | impact_sub | 0.312 | 36.3 | 0.396 | -0.084 | zero_or_missing_points_evidence | Weak MD1 point evidence lowers role confidence |
| Mark Flekken | Netherlands | GK | Sweden | impact_sub | 0.312 | 35.9 | 0.396 | -0.084 | zero_or_missing_points_evidence | Weak MD1 point evidence lowers role confidence |
| Lucas Hernández | France | DEF | Iraq | impact_sub | 0.302 | 35.5 | 0.382 | -0.08 | zero_or_missing_points_evidence | Weak MD1 point evidence lowers role confidence |
| Santiago Giménez | Mexico | FWD | Korea Republic | impact_sub | 0.251 | 30.4 | 0.335 | -0.084 | zero_or_missing_points_evidence | Downgraded after no MD1 point evidence |
| Alphonso Davies | Canada | DEF | Qatar | bench_depth | 0.175 | 18.6 | 0.18 | -0.005 | zero_or_missing_points_evidence | Downgraded after no MD1 point evidence |
| Ronald Araujo | Uruguay | DEF | Cabo Verde | bench_depth | 0.175 | 17.2 | 0.18 | -0.005 | zero_or_missing_points_evidence | Downgraded after no MD1 point evidence |
| Alexander Nübel | Germany | GK | Côte d'Ivoire | bench_depth | 0.175 | 12.9 | 0.101 | 0.074 | zero_or_missing_points_evidence | Downgraded after no MD1 point evidence |
| Robin Roefs | Netherlands | GK | Sweden | bench_depth | 0.175 | 12.9 | 0.101 | 0.074 | zero_or_missing_points_evidence | Downgraded after no MD1 point evidence |
| José Pedro Malheiro de Sá | Portugal | GK | Uzbekistan | bench_depth | 0.175 | 12.9 | 0.101 | 0.074 | zero_or_missing_points_evidence | Downgraded after no MD1 point evidence |
| Rui Tiago Dantas da Silva | Portugal | GK | Uzbekistan | bench_depth | 0.175 | 12.9 | 0.101 | 0.074 | zero_or_missing_points_evidence | Downgraded after no MD1 point evidence |
| David Raya | Spain | GK | Saudi Arabia | bench_depth | 0.175 | 12.9 | 0.101 | 0.074 | zero_or_missing_points_evidence | Downgraded after no MD1 point evidence |
| Neymar da Silva Santos Júnior | Brazil | MID | Haiti | bench_depth | 0.175 | 12 | 0.04 | 0.135 | zero_or_missing_points_evidence | Downgraded after no MD1 point evidence |
| Senne Lammens | Belgium | GK | IR Iran | bench_depth | 0.175 | 12.2 | 0.079 | 0.096 | zero_or_missing_points_evidence | Downgraded after no MD1 point evidence |
| Amir Murillo | Panama | DEF | Croatia | impact_sub | 0.28 | 27.3 | 0.18 | 0.1 | played_points_evidence | MD1 participation supports role, but starter field unavailable |
| Patrick Pentz | Austria | GK | Argentina | possible_starter | 0.55 | 57.3 | 0.533 | 0.017 | zero_or_missing_points_evidence | Elite prior preserved despite weak MD1 evidence |

## Safe-To-Proceed Note

This model is safe to feed the next component player projection model v4 step if QA passes. It should remain a sidecar until the next prompt explicitly rebuilds projections.
