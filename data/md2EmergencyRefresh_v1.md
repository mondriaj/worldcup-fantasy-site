# MD2 Emergency Refresh v1

Generated: 2026-06-17T22:57:02.295Z

## Executive Summary

Emergency refresh completed using 22 completed MD1 fixtures, 902 lineup-driven minutes adjustments, and 8 targeted high-impact availability reviews. 2 MD1 fixtures remain excluded until final.

## Completed MD1 Games Used

| Match | Fixture | Score |
| --- | --- | --- |
| 1 | Mexico vs South Africa | 2-0 |
| 2 | Korea Republic vs Czechia | 2-1 |
| 3 | Canada vs Bosnia and Herzegovina | 1-1 |
| 4 | USA vs Paraguay | 4-1 |
| 8 | Qatar vs Switzerland | 1-1 |
| 7 | Brazil vs Morocco | 1-1 |
| 5 | Haiti vs Scotland | 0-1 |
| 6 | Australia vs Türkiye | 2-0 |
| 10 | Germany vs Curaçao | 7-1 |
| 11 | Netherlands vs Japan | 2-2 |
| 9 | Côte d'Ivoire vs Ecuador | 1-0 |
| 12 | Sweden vs Tunisia | 5-1 |
| 14 | Spain vs Cabo Verde | 0-0 |
| 16 | Belgium vs Egypt | 1-1 |
| 13 | Saudi Arabia vs Uruguay | 1-1 |
| 15 | IR Iran vs New Zealand | 2-2 |
| 17 | France vs Senegal | 3-1 |
| 18 | Iraq vs Norway | 1-4 |
| 19 | Argentina vs Algeria | 3-0 |
| 20 | Austria vs Jordan | 3-1 |
| 23 | Portugal vs Congo DR | 1-1 |
| 22 | England vs Croatia | 4-2 |

## Missing MD1 Games

| Match | Fixture | Status | Date |
| --- | --- | --- | --- |
| 21 | Ghana vs Panama | scheduled | 2026-06-18T00:00:00+01:00 |
| 24 | Uzbekistan vs Colombia | scheduled | 2026-06-18T03:00:00+01:00 |

## Official Monitor

| Item | Result |
| --- | --- |
| Monitor status | completed |
| Official data changed | true |
| Rerun decision | full_model_rerun_recommended |
| New players | 6 |
| Selectable-status changes | 16 |
| Deadline/round changes | 1 |

## PELE And Score Calibration

- PELE status: Local PELE/team-quality inputs were not re-scraped; score context was recalibrated from completed MD1 score evidence on top of the existing PELE-anchored model.
- MD1 actual average goals: 3.182
- Prior predicted average goals: 2.469
- Applied MD2/MD3 score multiplier: 1.1

## Lineup And Availability Changes

| Metric | Count |
| --- | --- |
| Lineup adjustment rows | 902 |
| Availability-reviewed players | 8 |
| MD1 completed teams | 44 |
| Pending MD1 fixtures excluded | 2 |

## High-Impact Reviewed Players

| Player | Country | Review status | Model action |
| --- | --- | --- | --- |
| Lamine Yamal Nasraoui Ebana | Spain | available_managed_minutes | cap_below_safe |
| Alphonso Davies | Canada | available_low_start_evidence | maintain_low_role |
| Bukayo Saka | England | available_managed_minutes | cap_below_safe |
| Tino Livramento | England | ruled_out_replaced | block_not_selectable |
| Giorgian de Arrascaeta | Uruguay | no_external_update_found | cap_after_not_in_squad |
| Ronald Araujo | Uruguay | no_external_update_found | cap_after_not_in_squad |
| Julian Alvarez | Argentina | md1_sub_no_external_issue_found | rotation_after_sub |
| Nico Williams | Spain | md1_sub_no_external_issue_found | rotation_after_sub |

## Recommendation Result

| Metric | Result |
| --- | --- |
| Candidate rows | 500 |
| MD2 candidates | 125 |
| MD3 candidates | 125 |
| Low-confidence top-list candidates | 0 |
| Safe for public recommendations flag | false |

## Team Builder

Team Builder candidate count: 1233. Coverage report remains the authority for field completeness and static loading checks.

## Final MD1 Refresh Needed

Yes. Re-run live import, fixture mapping QA, score calibration, lineup evidence, projections, finance metrics, recommendations, and browser QA after Ghana vs Panama and Uzbekistan vs Colombia finish.

## Source Files

- data/md1ScoreCalibration_v1.md
- data/md2ScorePredictionQa_v1.md
- data/md2LineupEvidenceRefresh_v1.md
- data/md2LineupEvidenceRefresh_v1.json
- data/md2AvailabilityReview_v1.md
- data/md2AvailabilityReview_v1.json
- data/md2RecommendationQa_v1.md
- data/md2EmergencyRefresh_v1.md
