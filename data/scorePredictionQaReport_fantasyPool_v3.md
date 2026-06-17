# Score Prediction QA Report Fantasy Pool v3

Generated: 2026-06-17T22:45:11.984Z

## Status

This is a staged `fantasy_pool_only` score predictor. It is not final-squad-backed, not betting odds, not final public recommendations, and safe only for preliminary projection staging.

| Metric | Value |
| --- | --- |
| Overall QA status | pass_with_staging_stop_conditions |
| Fixtures covered | 72 |
| Team-fixture rows | 144 |
| Teams covered | 48 |
| PELE coverage complete | true |
| Final-squad-confirmed rows | 0 |
| Squad review rows | 239 |
| Safe for preliminary projection staging | true |
| Safe for final public recommendations | false |
| Safe for final Team Builder promotion | false |
| Average goal-range width | 1.11 |

## Model Purpose

Score Predictor v3 starts from the active PELE-forward v2 team-quality and Poisson score model, then adds a small, transparent fantasy-pool context layer from official fantasy-pool players and the preliminary minutes model. PELE remains the dominant team-strength signal. Phase 3C clarifies that public Projected xG is fixture-specific expected goals against the listed opponent, while total goals range and Match uncertainty remain supporting context.

## Inputs Used

- `data/teamQuality.json`
- `data/peleRatings_v1.json`
- `data/fixtures.json`
- `data/matchdays.json`
- `data/playerMinutesModel_fantasyPool_v0.json`
- `data/playerRecommendationInputs_v1.json`
- `data/officialSquads_v0.json`
- `data/scorePredictions_v2.json`

## Why Fantasy Pool Only

Confirmed final squad rows are still zero, official squads are not source-backed complete, and official rules still have manual-review warnings. Every team carries `final_squad_source_status: fantasy_pool_only` plus a final-squad uncertainty penalty. The preserved fallback stays in `scorePredictionsData.js`.

The active public bundle is `fantasyPoolScorePredictionsData.js`; `scorePredictionsData.js` remains the preserved PELE-forward fallback.

## Phase 3C Projected xG And Match Context

Projected xG values match the expected-goal inputs used by the scoreline grid. Total goals ranges are supporting bands around those values. They use transparent proxies already in this source: team-quality gap, upset risk, goal environment, team-role uncertainty flags, Brazil role-source review, and host venue context where present.

### Match Uncertainty Counts

| Label | Fixtures |
| --- | --- |
| Medium | 14 |
| High | 19 |
| Low | 39 |

### Fantasy Context Counts

| Field | Counts |
| --- | --- |
| Attack outlook | {"Good":29,"Difficult":3,"Neutral":15,"Strong":25} |
| Clean-sheet context | {"Strong":40,"Neutral":7,"Good":25} |
| Upset risk | {"Medium":28,"High":13,"Low":31} |

### Highest Match Uncertainty Fixtures

| Fixture | Uncertainty | Score | Goal range | Reason |
| --- | --- | --- | --- | --- |
| USA vs Paraguay | High | 66 | 1.508-3.122 | High uncertainty: close team-quality gap, higher upset risk, team-role context needs review. |
| Egypt vs IR Iran | High | 63 | 1.221-2.735 | High uncertainty: close team-quality gap, higher upset risk, lower-goal setup can swing on one moment. |
| Korea Republic vs Czechia | High | 62 | 1.313-2.857 | High uncertainty: close team-quality gap, higher upset risk, team-role context needs review. |
| Congo DR vs Uzbekistan | High | 62 | 1.339-2.895 | High uncertainty: close team-quality gap, higher upset risk, team-role context needs review. |
| USA vs Australia | High | 58 | 1.508-3.124 | High uncertainty: moderate team-quality gap, higher upset risk, team-role context needs review. |
| Cabo Verde vs Saudi Arabia | High | 55 | 1.021-2.463 | High uncertainty: moderate team-quality gap, higher upset risk, lower-goal setup can swing on one moment. |
| Türkiye vs Paraguay | High | 54 | 1.545-3.173 | High uncertainty: moderate team-quality gap, higher upset risk, team-role context needs review. |
| Paraguay vs Australia | High | 53 | 1.142-2.628 | High uncertainty: moderate team-quality gap, credible upset path, lower-goal setup can swing on one moment. |

## Main Differences From v2

| Metric | Value |
| --- | --- |
| Fixtures compared with v2 | 72 |
| Average absolute total xG change | 0.049 |
| Average max W/D/L probability change | 0.0245 |
| Favorite changes | 1 |
| Average total expected goals v3 | 2.46 |

## Top Expected-Goal Changes

| Fixture | Total xG delta | Home xG delta | Away xG delta |
| --- | --- | --- | --- |
| Mexico vs South Africa | -0.163 | -0.163 | 0 |
| Jordan vs Argentina | 0.152 | 0 | 0.152 |
| Uruguay vs Cabo Verde | 0.144 | 0.144 | 0 |
| Senegal vs Iraq | 0.142 | 0.142 | 0 |
| Iraq vs Norway | 0.138 | 0 | 0.138 |
| Canada vs Qatar | -0.136 | -0.165 | 0.029 |
| France vs Iraq | 0.134 | 0.134 | 0 |
| Uzbekistan vs Colombia | 0.133 | 0 | 0.133 |
| Tunisia vs Japan | 0.13 | 0 | 0.13 |
| Portugal vs Uzbekistan | 0.127 | 0.127 | 0 |

## Top Win-Probability Changes

| Fixture | Max W/D/L delta | Favorite v2 | Favorite v3 | Favorite changed |
| --- | --- | --- | --- | --- |
| Australia vs Türkiye | 0.0893 | Türkiye | Türkiye | false |
| Switzerland vs Canada | 0.0831 | Switzerland | Switzerland | false |
| Paraguay vs Australia | 0.0805 | Paraguay | Paraguay | false |
| Canada vs Bosnia and Herzegovina | 0.08 | Canada | Canada | false |
| Congo DR vs Uzbekistan | 0.0765 | Congo DR | Congo DR | false |
| Türkiye vs USA | 0.075 | Türkiye | Türkiye | false |
| Austria vs Jordan | 0.0661 | Austria | Austria | false |
| USA vs Paraguay | 0.0636 | Paraguay | Paraguay | false |
| Scotland vs Morocco | 0.0635 | Morocco | Morocco | false |
| South Africa vs Korea Republic | 0.0586 | Korea Republic | Korea Republic | false |

## Largest Team-Quality Adjustments

| Country | v2 score | v3 score | Adjustment | Uncertainty |
| --- | --- | --- | --- | --- |
| Australia | 42.85 | 39.94 | -2.91 | 82 |
| Canada | 45.48 | 42.75 | -2.73 | 73.81 |
| Jordan | 19.33 | 16.75 | -2.58 | 63.13 |
| Mexico | 58.77 | 56.26 | -2.51 | 69.37 |
| USA | 48.96 | 46.49 | -2.47 | 68.45 |
| Uzbekistan | 25.49 | 23.37 | -2.12 | 60.93 |
| IR Iran | 35.24 | 33.28 | -1.96 | 59.16 |
| Iraq | 18.71 | 16.78 | -1.93 | 55.88 |
| Korea Republic | 42.44 | 40.68 | -1.76 | 71.48 |
| Cabo Verde | 10.59 | 8.83 | -1.76 | 55.08 |

## Teams With Most Uncertainty

| Country | Uncertainty | Missing usage | Low confidence | Review rows | Neymar gap |
| --- | --- | --- | --- | --- | --- |
| Australia | 82 | 32 | 23 | 10 | false |
| Canada | 73.81 | 30 | 24 | 7 | false |
| Korea Republic | 71.48 | 20 | 19 | 1 | false |
| Mexico | 69.37 | 44 | 25 | 25 | false |
| USA | 68.45 | 25 | 24 | 5 | false |
| Morocco | 66.78 | 33 | 13 | 20 | false |
| Argentina | 63.27 | 33 | 4 | 30 | false |
| Jordan | 63.13 | 17 | 25 | 5 | false |
| Brazil | 62.38 | 13 | 13 | 1 | true |
| Uzbekistan | 60.93 | 17 | 24 | 4 | false |

## Neymar / Brazil Treatment

Brazil has `brazil_neymar_usage_source_gap` on every Brazil fixture because Neymar remains a P0 national-team usage source gap. The model does not invent Neymar starts, minutes, squad status, or role. Brazil's PELE baseline remains active, while Neymar is handled as uncertainty rather than confirmed extra attack strength.

| Brazil field | Value |
| --- | --- |
| Team quality v2 score | 81.25 |
| Fantasy-pool v3 score | 79.91 |
| Total fantasy-pool adjustment | -1.34 |
| Neymar usage source gap | true |
| Brazil uncertainty score | 62.38 |

## Stop Conditions Before Promotion

| Stop condition | Status | Count | Details |
| --- | --- | --- | --- |
| official_final_squads_not_source_backed | stop | 48 | Official final squads are not source-backed complete for any team; confirmed final squad rows are zero. |
| official_rules_manual_review | stop | 1 | Official fantasy rules still have manual-review warnings, including Mystery Booster/deadline semantics. |
| readiness_not_ready_for_model_rerun | stop | 1 | Official data readiness is blocked_waiting_for_official_fantasy_data. |
| no_final_squad_rows_exist | stop | 0 | There are 0 source-backed confirmed_final_squad rows in the official squad staging layer. |
| neymar_p0_usage_source_gap | stop | 1 | Neymar remains a P0 national-team usage source gap and is not credited as confirmed Brazil attack strength. |
| browser_ready_files_regenerated_by_preview_export | pass | 0 | After this source pass, run scripts/buildFantasyPoolPreviewBrowserData.mjs so fantasyPoolScorePredictionsData.js stays synced. |
| player_matchday_projection_not_rerun | stop | 1 | This staging pass intentionally did not rerun player matchday projections or recommendations. |

## QA Checks

| Check | Status | Severity | Detail |
| --- | --- | --- | --- |
| fixture_coverage | pass | error | 72/72 group-stage fixtures have one score prediction row; 72 unique fixture IDs. |
| team_fixture_coverage | pass | error | 144/144 team-fixture rows exist. |
| probability_bounds | pass | error | All probability fields are between 0 and 1. |
| win_draw_loss_sum | pass | error | Home/draw/away probabilities sum to 1 within tolerance. |
| expected_goals_non_negative | pass | error | Expected goals are non-negative. |
| clean_sheet_probability_bounds | pass | error | Clean-sheet probabilities are between 0 and 1. |
| favorite_consistency | pass | error | Favorite matches the higher home/away win probability. |
| pele_coverage | pass | error | 48/48 teams have numeric PELE ratings. |
| fantasy_pool_uncertainty_flags | pass | error | Every fixture carries fantasy_pool_only and not_final_squad_backed QA flags. |
| brazil_neymar_uncertainty | pass | error | 3 Brazil fixtures carry Neymar usage-source-gap QA flag. |
| no_final_squad_backed_claims | pass | error | All rows remain model_stage=fantasy_pool_only and uses_final_rosters=false. |
| score_uncertainty_fields | pass | error | Every fixture has Low/Medium/High uncertainty labels, xG bands, total-goal bands, and a short reason. |
| score_uncertainty_bands_ordered | pass | error | Every fixture has low <= base <= high for total, home xG, and away xG. |
| score_uncertainty_base_preserved | pass | error | homeXgBase, awayXgBase, and baseTotalGoals match the original expected-goal fields. |
| projected_xg_aliases_preserved | pass | error | Projected xG and match xG aliases match home_expected_goals and away_expected_goals. |
| fantasy_context_fields | pass | error | Every fixture has attacker, defender, keeper, clean-sheet, goal, upset-risk, and match-uncertainty public context labels. |
| extreme_expected_goals | pass | warning | 0 fixtures exceed the staging watch threshold. |
| extreme_win_probabilities | pass | warning | 0 fixtures exceed the staging watch threshold. |

## Promotion Decision

This file is safe for preliminary matchday projection staging, but it is not safe for final public recommendations or final Team Builder promotion. Final promotion remains blocked until source-backed final squads, official rules warnings, Neymar's P0 usage source gap, active browser-ready regeneration, and downstream player-projection QA are resolved.
