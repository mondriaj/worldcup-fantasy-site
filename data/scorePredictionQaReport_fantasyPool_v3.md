# Score Prediction QA Report Fantasy Pool v3

Generated: 2026-06-18T17:50:21.634Z

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
| Average goal-range width | 1.122 |

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
| Medium | 10 |
| High | 20 |
| Low | 42 |

### Fantasy Context Counts

| Field | Counts |
| --- | --- |
| Attack outlook | {"Good":27,"Neutral":15,"Strong":28,"Difficult":2} |
| Clean-sheet context | {"Strong":37,"Neutral":12,"Good":23} |
| Upset risk | {"Low":30,"High":17,"Medium":25} |

### Highest Match Uncertainty Fixtures

| Fixture | Uncertainty | Score | Goal range | Reason |
| --- | --- | --- | --- | --- |
| Paraguay vs Australia | High | 69 | 1.276-2.81 | High uncertainty: close team-quality gap, higher upset risk, lower-goal setup can swing on one moment. |
| USA vs Paraguay | High | 66 | 1.605-3.253 | High uncertainty: close team-quality gap, higher upset risk, team-role context needs review. |
| Türkiye vs USA | High | 66 | 1.97-3.748 | High uncertainty: close team-quality gap, higher upset risk, team-role context needs review. |
| USA vs Australia | High | 58 | 1.623-3.279 | High uncertainty: moderate team-quality gap, higher upset risk, team-role context needs review. |
| Egypt vs IR Iran | High | 56 | 1.326-2.876 | High uncertainty: close team-quality gap, higher upset risk, some team-role uncertainty. |
| Korea Republic vs Czechia | High | 54 | 1.392-2.966 | High uncertainty: moderate team-quality gap, higher upset risk, team-role context needs review. |
| Congo DR vs Uzbekistan | High | 54 | 1.463-3.063 | High uncertainty: moderate team-quality gap, higher upset risk, team-role context needs review. |
| Scotland vs Morocco | High | 51 | 1.131-2.613 | High uncertainty: higher upset risk, lower-goal setup can swing on one moment, team-role context needs review. |

## Main Differences From v2

| Metric | Value |
| --- | --- |
| Fixtures compared with v2 | 72 |
| Average absolute total xG change | 0.038 |
| Average max W/D/L probability change | 0.0138 |
| Favorite changes | 0 |
| Average total expected goals v3 | 2.57 |

## Top Expected-Goal Changes

| Fixture | Total xG delta | Home xG delta | Away xG delta |
| --- | --- | --- | --- |
| Uzbekistan vs Colombia | 0.131 | 0 | 0.131 |
| Portugal vs Uzbekistan | 0.108 | 0.108 | 0 |
| England vs Ghana | 0.103 | 0.103 | 0 |
| Croatia vs Ghana | 0.102 | 0.102 | 0 |
| USA vs Australia | -0.092 | -0.051 | -0.041 |
| Iraq vs Norway | 0.09 | 0 | 0.09 |
| Senegal vs Iraq | 0.079 | 0.079 | 0 |
| Brazil vs Morocco | -0.078 | 0.013 | -0.091 |
| Morocco vs Haiti | -0.078 | -0.078 | 0 |
| Mexico vs South Africa | -0.076 | -0.076 | 0 |

## Top Win-Probability Changes

| Fixture | Max W/D/L delta | Favorite v2 | Favorite v3 | Favorite changed |
| --- | --- | --- | --- | --- |
| Congo DR vs Uzbekistan | 0.0626 | Congo DR | Congo DR | false |
| Scotland vs Morocco | 0.0498 | Morocco | Morocco | false |
| Switzerland vs Canada | 0.0447 | Switzerland | Switzerland | false |
| Australia vs Türkiye | 0.0443 | Türkiye | Türkiye | false |
| Canada vs Bosnia and Herzegovina | 0.0438 | Canada | Canada | false |
| Türkiye vs USA | 0.043 | Türkiye | Türkiye | false |
| Ghana vs Panama | 0.0348 | Panama | Panama | false |
| Czechia vs Mexico | 0.0342 | Mexico | Mexico | false |
| USA vs Paraguay | 0.0314 | USA | USA | false |
| Paraguay vs Australia | 0.0302 | Paraguay | Paraguay | false |

## Largest Team-Quality Adjustments

| Country | v2 score | v3 score | Adjustment | Uncertainty |
| --- | --- | --- | --- | --- |
| Uzbekistan | 25.68 | 23.44 | -2.24 | 60.27 |
| Canada | 45.18 | 43.34 | -1.84 | 68.19 |
| Mexico | 60.9 | 59.11 | -1.79 | 65.45 |
| USA | 53.21 | 51.45 | -1.76 | 62.65 |
| Jordan | 17.7 | 15.96 | -1.74 | 56.47 |
| Australia | 44.15 | 42.42 | -1.73 | 76.44 |
| Morocco | 57.59 | 55.9 | -1.69 | 65.48 |
| IR Iran | 36.44 | 34.75 | -1.69 | 52.71 |
| Ghana | 22.74 | 21.07 | -1.67 | 43.66 |
| Egypt | 37.9 | 36.24 | -1.66 | 51.93 |

## Teams With Most Uncertainty

| Country | Uncertainty | Missing usage | Low confidence | Review rows | Neymar gap |
| --- | --- | --- | --- | --- | --- |
| Australia | 76.44 | 32 | 13 | 10 | false |
| Canada | 68.19 | 30 | 15 | 7 | false |
| Korea Republic | 67.04 | 20 | 13 | 1 | false |
| Morocco | 65.48 | 33 | 10 | 20 | false |
| Mexico | 65.45 | 44 | 15 | 25 | false |
| Argentina | 63.64 | 33 | 5 | 30 | false |
| USA | 62.65 | 25 | 15 | 5 | false |
| Brazil | 60.7 | 14 | 10 | 1 | true |
| Uzbekistan | 60.27 | 17 | 23 | 4 | false |
| Paraguay | 59.31 | 31 | 7 | 29 | false |

## Neymar / Brazil Treatment

Brazil has `brazil_neymar_usage_source_gap` on every Brazil fixture because Neymar remains a P0 national-team usage source gap. The model does not invent Neymar starts, minutes, squad status, or role. Brazil's PELE baseline remains active, while Neymar is handled as uncertainty rather than confirmed extra attack strength.

| Brazil field | Value |
| --- | --- |
| Team quality v2 score | 80.15 |
| Fantasy-pool v3 score | 78.89 |
| Total fantasy-pool adjustment | -1.26 |
| Neymar usage source gap | true |
| Brazil uncertainty score | 60.7 |

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
