# MD1 Model Postmortem v1

Generated: 2026-06-18T12:32:25.804Z

## Executive Summary

- **Data path:** green. Active MD2 data-flow QA is pass, live fixture mapping QA is pass, and this dataset uses all 24 completed MD1 fixtures.
- **Main failure:** model calibration, not identity plumbing. The score model predicted 2.461 average goals; MD1 delivered 3.125, a 1.27 actual/predicted ratio.
- **Result calibration:** weak. Predicted result class was correct 10/24; favorites won 10/24.
- **Player-role evidence:** incomplete but actionable. The live feed has 753 MD1 actual-point rows, but direct start/sub/not-in-squad matchStatus evidence is currently unavailable.
- **Recommendation failure:** mode results show role, fixture-environment, value/finance, and captain-upside calibration issues. There is no evidence of a stale legacy public data path.
- **Final squads:** not source-backed. This report uses the official fantasy pool as the active identity universe and does not claim final-squad backing.

## Score Model Failure

| Metric | Value |
| --- | --- |
| MD1 final fixtures used | 24 |
| Average predicted total goals | 2.461 |
| Average actual total goals | 3.125 |
| Actual/predicted calibration ratio | 1.27 |
| Mean absolute total-goal error | 1.542 |
| Predicted result accuracy | 10/24 |
| Favorite win accuracy | 10/24 |
| High-scoring misses | 10 |
| Low-scoring misses | 1 |
| Clean-sheet calls hit/miss | 4/14 |

The global MD1 goal environment was too low. The PELE prior should not be thrown away from one matchday, but score model v4 needs a shrinkage-calibrated goal lift, a stronger upset/draw uncertainty layer, and team residual updates.

### Biggest Fixture Misses

| Match | Fixture | Actual | Pred xG | Error | Pred | Final |
| --- | --- | --- | --- | --- | --- | --- |
| 10 | Germany vs Curaçao | 7-1 | 3.395 | 4.605 | home_win | home_win |
| 12 | Sweden vs Tunisia | 5-1 | 2.239 | 3.761 | home_win | home_win |
| 22 | England vs Croatia | 4-2 | 2.336 | 3.664 | home_win | home_win |
| 14 | Spain vs Cabo Verde | 0-0 | 3.55 | -3.55 | home_win | draw |
| 4 | USA vs Paraguay | 4-1 | 2.315 | 2.685 | away_win | home_win |
| 18 | Iraq vs Norway | 1-4 | 2.71 | 2.29 | away_win | away_win |
| 15 | IR Iran vs New Zealand | 2-2 | 1.989 | 2.011 | home_win | draw |
| 17 | France vs Senegal | 3-1 | 2.182 | 1.818 | home_win | home_win |
| 5 | Haiti vs Scotland | 0-1 | 2.574 | -1.574 | away_win | away_win |
| 20 | Austria vs Jordan | 3-1 | 2.436 | 1.564 | home_win | home_win |

### Attack Residual Upgrade Watch

| Team | Opponent | Pred GF | Actual GF | Residual | Action |
| --- | --- | --- | --- | --- | --- |
| Germany | Curaçao | 3.045 | 7 | 3.955 | small boost |
| Sweden | Tunisia | 1.571 | 5 | 3.429 | uncertainty increase |
| USA | Paraguay | 0.947 | 4 | 3.053 | uncertainty increase |
| England | Croatia | 1.697 | 4 | 2.303 | uncertainty increase |
| Norway | Iraq | 2.36 | 4 | 1.64 | small boost |
| Australia | Türkiye | 0.604 | 2 | 1.396 | small boost |
| Croatia | England | 0.639 | 2 | 1.361 | uncertainty increase |
| New Zealand | IR Iran | 0.695 | 2 | 1.305 | small boost |
| France | Senegal | 1.715 | 3 | 1.285 | small boost |
| Japan | Netherlands | 0.973 | 2 | 1.027 | none |

## Player Projection Failure

| Metric | Value |
| --- | --- |
| Player rows | 1488 |
| MD1 projection rows | 1233 |
| Actual-point rows | 753 |
| Average projection error | 0.084 |
| Mean absolute projection error | 2.319 |
| Possible start/role miss flags | 7 |
| Direct start/sub/not-in-squad statuses | 0 |

Role/start/minutes model v2 should heavily consume MD1 point-row presence and any future matchStatus values. Because direct start/sub labels are absent right now, the report separates hard evidence from possible role misses.

## Recommendation Failure

| Mode | Rows | Actual Rows | Avg Actual | Avg Error | Miss/No Actual |
| --- | --- | --- | --- | --- | --- |
| balanced | 25 | 24 | 6.208 | -0.528 | 4/1 |
| safe | 25 | 25 | 5.68 | -0.623 | 3/0 |
| upside | 25 | 24 | 3.042 | -2.963 | 6/1 |
| differential | 25 | 24 | 4.167 | -1.793 | 4/1 |
| captain | 25 | 25 | 6.08 | -0.899 | 2/0 |

The strongest recommendation concern is not a legacy data path. It is that value/finance and clean-sheet/fixture context can still over-promote players whose MD1 role evidence is weak or whose environment failed. Captain Watchlist also needs a stronger elite-upside QA pass.

## Team Builder MD1 Audit

No saved/generated Balanced Squad output was found, so the Team Builder audit is input-based only. Balanced MD1 inputs had average price 6.748, 10 low-price rows, and 9 premium rows. Value/finance overweight signal rows: 26.

## Model Rebuild Guidance

- **score model v4:** Raise the global goal baseline with shrinkage toward the pre-MD1 prior; do not apply the full MD1 ratio unshrunk. Confidence: high confidence; robustness: likely robust, but exact multiplier could overfit one matchday. Evidence: MD1 actual avg goals 3.125 vs predicted 2.461; ratio 1.27.
- **score model v4:** Add a calibrated upset/draw uncertainty layer for medium favorites and high-uncertainty team contexts. Confidence: high confidence; robustness: likely robust. Evidence: Predicted/final result accuracy was 10/24; favorite wins were 10/24.
- **score model v4:** Shrink clean-sheet probabilities for public defensive context until MD1 residuals are incorporated. Confidence: medium confidence; robustness: could partly overfit one matchday. Evidence: 14/18 high clean-sheet calls missed.
- **role/start/minutes model v2:** Use completed MD1 point-row presence and matchStatus when available as a strong live role signal for MD2. Confidence: high confidence; robustness: likely robust. Evidence: 753 players have completed MD1 point rows; 7 high-start/no-row or low-start/positive-row role flags.
- **component player projection model v4:** Gate component projections by live role evidence before applying event-rate upside. Confidence: high confidence; robustness: likely robust. Evidence: Player mean absolute projection error was 2.319; missing point rows dominate hard role evidence gaps.
- **component player projection model v4:** Review position-level component priors against MD1 actual errors before rerunning MD2. Confidence: medium confidence; robustness: some risk of overfitting one matchday. Evidence: Position-level MD1 error tables are included in the dataset summary.
- **recommendations v4:** Add a value/finance guardrail: cheap or high-finance-alpha candidates need confirmed role evidence or a stronger raw projection. Confidence: high confidence; robustness: likely robust. Evidence: 26 value/finance-driven recommendation rows were flat, misses, or had no actual row.
- **recommendations v4:** Add explicit elite/high-upside exposure checks for public picks and captain lists. Confidence: medium confidence; robustness: likely robust as a QA guardrail, exact thresholds need tuning. Evidence: 20 top actual MD1 performers were outside the MD1 recommendation surface.
- **Team Builder optimizer v4:** Cap value filler exposure in Balanced Squad unless MD1 role evidence, start probability, and expected minutes all clear stricter thresholds. Confidence: high confidence; robustness: likely robust. Evidence: No saved builder squad artifact exists, but active inputs show value/finance rows need live role gating before squad optimization.
- **public explanation/QA:** Publish model notes that distinguish data-path health from model calibration misses and show MD1 backtest tables before MD2 promotion. Confidence: high confidence; robustness: robust. Evidence: Active data path, fixture mapping, and official identity are green; the failures are model calibration and role-estimation issues.

## Top 10 Actionable MD2 Fixes

1. Recalibrate the score model goal environment upward, but shrink the full MD1 1.27x raw ratio to avoid overfitting one matchday.
2. Add a specific underdog/upset uncertainty layer for close or medium-favorite fixtures; MD1 result accuracy was only 10/24.
3. Do not let clean-sheet context dominate defender/keeper recommendations after MD1; high-probability clean sheets missed often.
4. Treat missing MD1 actual-points rows for high-start players as a role/start warning before MD2 projections.
5. Increase weight on completed MD1 live points and point-row presence for start/minutes model v2, while separating it from ownership-only drift.
6. Add team-specific attack/defense residual priors with shrinkage for extreme MD1 misses such as Germany attack and Spain finishing volatility.
7. Add recommendation penalties for high finance-alpha or value candidates with no MD1 points row or weak role evidence.
8. Strengthen captain shortlist exposure to elite/high-upside actual performers, not only price-adjusted value.
9. Require public pick QA to show actual MD1 backtest by mode before promoting MD2 recommendations.
10. For Team Builder v4, cap low-price/value fill-ins unless role evidence or MD1 points row confirms they are playable.

## QA

| Check | Status | Detail |
| --- | --- | --- |
| all_24_final_md1_fixtures_used | pass | 24/24 final MD1 fixtures used. |
| no_incomplete_fixtures_used | pass | Only complete/final, safe-to-display MD1 fixtures are included. |
| no_md2_md3_actuals_used | pass | All fixture actuals come from round_id=1. |
| player_ids_resolve_active_official_pool | pass | 1488/1488 player rows resolve through official_position_records. |
| no_duplicate_fixture_keys | pass | 24/24 unique fixture keys. |
| no_duplicate_official_fantasy_player_ids | pass | 1488/1488 unique official fantasy player IDs. |
| no_stale_legacy_public_data_used | pass | Sources are current fantasy-pool and live support files only; legacy files are not read by this script. |
| final_squads_not_claimed_source_backed | pass | confirmed_final_squad_rows=0; final squads are not claimed source-backed. |
| active_md2_data_flow_precheck | pass | activeMd2DataFlowQa status=pass, failures=0, warnings=0. |
| live_fixture_mapping_precheck | pass | liveFixtureMappingQa status=passed, final_fixtures_shown=24. |
| no_nan_or_infinity | pass | No NaN or Infinity values found. |

## Decision

Safe to proceed to score model v4: **yes**.

Proceed with the rebuild using this report as calibration input, while keeping final-squad claims blocked until source-backed final squads exist.
