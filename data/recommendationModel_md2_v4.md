# Recommendation Model v4 MD2

Generated: 2026-06-18T17:53:00.015Z
Model version: `fantasy-pool-recommendations-v4-md2-projection-v4-role-v2-score-v4`

## Purpose

Recommendations v4 refreshes public MD2 Official Fantasy Picks after MD1 using Component Player Projection Model v4, Player Role / Start / Minutes Model v2, Score Model v4 fixture context, and the active official fantasy identity universe.

## Inputs

- `fantasyPoolOfficialDataStatusData.js`
- `data/fantasyPoolMatchdayProjections_md2_v4.json`
- `fantasyPoolMatchdayProjectionsData.js`
- `data/playerProjectionQa_md2_v4.json`
- `data/playerProjectionQaReport_md2_v4.md`
- `data/playerRoleModel_md2_v2.json`
- `data/playerRoleModelQa_md2_v2.json`
- `data/scorePredictions_fantasyPool_v4_md2.json`
- `fantasyPoolScorePredictionsData.js`
- `fantasyPoolFinanceMetricsData.js`
- `fantasyPoolRecommendationsData.js`
- `fantasyRules.json`
- `fantasyRulesData.js`
- `data/md1ModelPostmortem_v1.json`
- `data/md1ModelPostmortemReport_v1.md`

## Ranking Principles

- Projection is first: projected points, start probability, expected minutes, role confidence, floor/ceiling, and captain upside drive all surfaces.
- Finance is secondary: it shapes Value Picks inside the shared differential/value pool and cannot rescue poor projection or role rows.
- Captain Watchlist is not value-first: captain upside, projected points, ceiling, starts, minutes, and team xG drive it.
- Differential Picks must be playable: they require projection, start probability, and ceiling floors before value or lower-price signals help.
- Ownership fields are not used as model signal.

## Thresholds

| Surface | Start floor | Other floor |
| --- | ---: | --- |
| Core Picks | 0.70 | elite/high-upside may pass at 0.60 with caution |
| High-Floor Picks | 0.75 | floor above positional median |
| Upside Picks | 0.60 | ceiling above positional median or strong captain upside |
| Value Picks | 0.60 | projection above positional median or strong value with minimum projection |
| Differential Picks | 0.55 | projection and ceiling must be credible |
| Captain Watchlist | 0.70 | managed-minutes stars may pass at 0.62 with caution |

## QA Summary

- Status: **PASS**
- Total rows: 500
- MD2 rows: 125
- Failures: 0
- Warnings: 0

## Public Limits

- This remains a fantasy-pool model, not official FIFA advice.
- Final squads are not claimed as source-backed.
- Users must confirm official lineup, locks, deadlines, boosters, and squad legality inside FIFA.
