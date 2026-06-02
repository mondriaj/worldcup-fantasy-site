# Fantasy Pool Recommendation Candidates v3 QA

Generated: 2026-06-02T18:41:18.502Z

Model stage: fantasy_pool_only. These outputs are not final-squad-backed, not final public recommendations, not Team Builder-ready, not browser-ready, and safe only for preliminary recommendation QA.

## Purpose

This staged layer converts playerMatchdayProjections_fantasyPool_v3 into preliminary candidate lists for Balanced, Safe, Upside, Differential, and Captain Alpha review. It does not update data/matchdayRecommendations_v2.json, recommendationQa_v2.json, recommendationQaReport_v2.md, matchdayProjectionsData.js, or any active browser-ready file.

## Inputs

- data/playerRecommendationInputs_v1.json
- data/playerMinutesModel_fantasyPool_v0.json
- data/playerMatchdayProjections_fantasyPool_v3.json
- data/scorePredictions_fantasyPool_v3.json
- data/officialFantasyRules_v0.json
- data/officialFantasyRulesImportReport_v0.json
- data/matchdayRecommendations_v2.json for comparison only

## Mode Definitions

- Balanced: risk-adjusted points, raw projection, start probability, minutes, projection confidence, value, fixture context, and data-quality penalties.
- Safe: start probability, minutes, floor, risk-adjusted points, confidence, role confidence, and downside penalties.
- Upside: ceiling, attacking and assist components, captain score, raw projection, fixture context, and acceptable minutes risk.
- Differential: defensible lower-obviousness value using value over replacement, scarcity-adjusted value, efficient-frontier status, opportunity cost, upside, and sufficient projection floor. Weak players are not promoted just for being cheap.
- Captain Alpha: captain score, raw points, ceiling, start probability, minutes, favorite/goal context, role confidence, and strong penalties for low starts, missing usage, thin profiles, and Neymar/Brazil uncertainty.

## Summary

- Candidate rows generated: 500.
- Candidate scopes: 4.
- Projection rows available: 3768.
- Blocked players excluded: 225.
- Low-confidence rows in top lists: 0.
- Thin-profile rows in top lists: 0.
- Missing-usage rows in top lists: 0.
- Safe for preliminary recommendation review: true.
- Safe for public recommendations: false.
- Safe for Team Builder: false.

## Mode Separation

| Pair | Top-10 overlap | Top-25 overlap |
| --- | --- | --- |
| Balanced vs Safe | 6 | 13 |
| Balanced vs Differential | 0 | 2 |
| Safe vs Differential | 0 | 0 |
| Upside vs Captain Alpha | 8 | 20 |

- Differential distinct from Balanced: true.
- Safe distinct from Balanced: true.
- Upside distinct from Captain Alpha: true.

## Candidate Counts

| Mode | Candidate rows | Low-confidence top-25 rows | Missing-usage top-25 rows |
| --- | --- | --- | --- |
| Balanced | 100 | 0 | 0 |
| Safe | 100 | 0 | 0 |
| Upside | 100 | 0 | 0 |
| Differential | 100 | 0 | 0 |
| Captain Alpha | 100 | 0 | 0 |

## Top Candidates By Mode

| Mode | Top candidate | Country | Scope | Opponent | Pos | Score | Tier | Confidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Balanced | Nuno Alexandre Tavares Mendes | Portugal | md2 | Uzbekistan | DEF | 86.341 | top_pick_candidate | high |
| Safe | Nuno Alexandre Tavares Mendes | Portugal | md2 | Uzbekistan | DEF | 87.657 | top_pick_candidate | high |
| Upside | Lionel Messi | Argentina | md3 | Jordan | FWD | 92.325 | top_pick_candidate | high |
| Differential | Giorgian de Arrascaeta | Uruguay | md1 | Saudi Arabia | MID | 77.668 | strong_candidate | high |
| Captain Alpha | Lionel Messi | Argentina | md3 | Jordan | FWD | 96.249 | top_pick_candidate | high |

## Country Concentration

| Country | Top-list candidate rows |
| --- | --- |
| Argentina | 95 |
| Portugal | 50 |
| England | 41 |
| Colombia | 40 |
| Spain | 39 |
| Uruguay | 35 |
| France | 24 |
| Germany | 23 |
| Japan | 21 |
| Belgium | 19 |

## Low-Confidence Top-List Warnings

| Name | Country | Scope | Opponent | Mode | Score | Confidence | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- |

## Neymar And Brazil

Brazil candidate rows carrying Neymar uncertainty: 19.

No Neymar rows appear in top candidate lists.

Neymar remains a P0 usage source gap. Brazil team context keeps uncertainty flags, and Neymar is not treated as confirmed team strength or a public captain recommendation.

## V3 vs V2 Comparison

- Comparable top lists: 20.
- Average top-25 overlap rate: 0.364.
- V2 used prototype/player finance recommendation inputs and active browser files; v3 uses official fantasy-pool staged projections. Lower overlap is expected.

## Stop Conditions Before Public Promotion

| Stop condition | Status | Count | Details |
| --- | --- | --- | --- |
| final_squads_not_source_backed | stop | 48 | No source-backed final squad rows are available; recommendation candidates remain fantasy_pool_only. |
| official_rules_manual_review | stop | 1 | Official rules still carry manual-review warnings, including unresolved booster/deadline semantics. |
| projection_v3_staging_stop_conditions | stop | 7 | Player projection v3 is staged and blocked from final promotion. |
| score_predictor_v3_staging_stop_conditions | stop | 7 | Score predictor v3 is fantasy-pool-only and not final-squad-backed. |
| readiness_not_ready_for_model_rerun | stop | 1 | Official data readiness is blocked_waiting_for_official_fantasy_data. |
| browser_ready_files_not_regenerated | stop | 1 | This script intentionally does not update browser-ready recommendation files. |
| active_recommendations_not_updated | stop | 1 | Active v2 recommendation files are preserved; v3 candidates are separate staged outputs. |
| neymar_p0_usage_source_gap | stop | 1 | Neymar remains a P0 national-team usage source gap; Brazil context keeps uncertainty flags. |

## Decision

This file is safe for preliminary recommendation review only. It remains blocked from public recommendations, Team Builder promotion, and browser-ready deployment until source-backed final squads, rules warning resolution, and official-data readiness gates are complete.
