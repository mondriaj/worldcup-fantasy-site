# Component Player Projection Model v4 for MD2

Generated: 2026-06-18T17:50:33.200Z
Model version: `player-projection-v4-md2-score-v4-role-v2`

## Purpose

This model refreshes the active fantasy-pool player matchday projection layer for MD2 using refreshed Score Model v4 context. Recommendations are rebuilt downstream from this output; Team Builder weights, finance metrics, and public UI logic are not changed by this projection builder.

## Inputs

- Prior projection baseline: `data/playerMatchdayProjections_fantasyPool_v3.json`
- Score Model v4: `score-v4-md2-pele-md1-calibrated`
- Role Model v2 rows: 1488
- Canonical identity: `FANTASY_POOL_OFFICIAL_DATA_STATUS.official_position_records`
- Official fantasy rules: `fantasyRules.json` and `fantasyRulesData.js`
- MD1 actual points: capped form/role-confidence signal only, from completed-fixture live support data and the MD1 calibration dataset.
- MD2 live fixture status: display/support caution only; MD2 live player points are not used as model signal.

## Scoring Categories Used

- `appearance_up_to_60`
- `appearance_60_plus`
- `assist`
- `yellow_card`
- `red_card`
- `own_goal`
- `winning_penalty`
- `conceding_penalty`
- `gk_clean_sheet`
- `gk_first_goal_conceded`
- `gk_each_additional_goal_conceded`
- `gk_goal_scored`
- `gk_penalty_save`
- `gk_every_3_saves`
- `def_clean_sheet`
- `def_first_goal_conceded`
- `def_each_additional_goal_conceded`
- `def_goal_scored`
- `mid_clean_sheet`
- `mid_goal_scored`
- `mid_every_3_tackles`
- `mid_every_2_chances_created`
- `fwd_goal_scored`
- `fwd_every_2_shots_on_target`
- `direct_free_kick_goal_bonus`
- `scouting_bonus`

## Method

- Start from the prior v3 component row so public schema and component fields remain stable.
- Replace MD2 start probability and expected minutes with Role Model v2 `md2StartProb` and `md2ExpectedMinutes`.
- For MD3, use the Role Model v2 MD2 evidence as a lower-confidence prior blended with the old projection role inputs.
- Preserve MD1 prior projection rows and point users to live support actuals; MD1 actual points are not written over projections.
- Replace fixture context with Score Model v4 team xG, opponent xG, W/D/L, clean-sheet probability, uncertainty, and public context labels.
- Attack components use 0.55 elasticity to team xG movement for MD2 and 0.48 for MD3, so player points move less than raw team xG.
- Clean-sheet components use direct Score v4 clean-sheet probability bounded by official position scoring and 60-minute appearance probability.
- MD1 actual fantasy points are capped as a small form adjustment between -0.35 and +0.45 points.
- Price is carried as value context only and is not used as an event-rate signal.

## Public Contract

- Browser global preserved: `FANTASY_POOL_PLAYER_MATCHDAY_PROJECTIONS`.
- Legacy fields preserved: `raw_expected_points`, `risk_adjusted_points`, `floor_points`, `ceiling_points`, `captain_score`, `fixture_context`, `start_probability`, `expected_minutes`.
- v4 aliases added: `projectedPoints`, `floorPoints`, `ceilingPoints`, `captainUpsideScore`, `riskScore`, `projectionReason`, `roleReason`, `fixtureReason`, `caution`, `dataQualityFlags`.

## Limits

- Final squads are not claimed source-backed.
- Direct starter/sub/not-in-squad evidence is not available for MD1 in this role model; MD1 points are participation evidence only.
- Users still need to verify official lineup, status, deadline, and legality inside FIFA.
