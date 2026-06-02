# Player Recommendation Inputs Report v1

Generated: 2026-06-02

## Scope

This is a limited `fantasy_pool_only` staging layer. It combines official fantasy player IDs, prices, positions, identity mappings, squad staging, club context, and national-team usage enrichment. It does not treat fantasy-selectable players as final-squad-confirmed players and does not update active recommendations, projections, Team Builder, browser-ready files, captain logic, substitution logic, or UX.

## Summary

| Metric | Count / status |
| --- | --- |
| Total official fantasy players | 1481 |
| Rows in playerRecommendationInputs_v1.json | 1481 |
| Selectable players | 1256 |
| Not selectable players | 225 |
| Final-squad-confirmed players | 0 |
| Fantasy-pool-only players | 1256 |
| Squad review players | 225 |
| Rows blocked from future modeling | 225 |
| Rows usable with warnings | 596 |
| Rows usable as fantasy-pool-only | 660 |
| Rows needing review | 0 |
| Thin profiles | 221 |
| Missing club context | 325 |
| Missing national-team usage | 630 |
| High-price players missing usage | 1 |
| Position-conflict audit rows | 135 |
| Rules manual-review flagged rows | 1481 |
| Squad-status manual-review flagged rows | 225 |
| Official squad import status | imported_needs_manual_review |
| Official rules import status | imported_needs_manual_review |

## Model Input Status Counts

| Status | Rows |
| --- | --- |
| usable_fantasy_pool_only | 660 |
| usable_with_warning | 596 |
| blocked_not_selectable | 225 |

## Top Data-Quality Flags

| Flag | Rows |
| --- | --- |
| deadline_semantics_review | 1481 |
| fantasy_pool_only_not_final_squad_confirmed | 1481 |
| final_squad_source_missing | 1481 |
| mystery_booster_unknown | 1481 |
| rules_manual_review | 1481 |
| missing_national_team_usage | 630 |
| missing_role_confidence | 630 |
| missing_club_context | 325 |
| squad_review_status | 225 |
| thin_profile | 221 |
| position_conflict_audit | 135 |
| low_usage_confidence | 78 |

## Largest Country Pools

| Country | Rows |
| --- | --- |
| Argentina | 55 |
| Paraguay | 55 |
| Mexico | 51 |
| Morocco | 46 |
| Australia | 36 |
| Ecuador | 36 |
| Qatar | 35 |
| Türkiye | 35 |
| Uruguay | 35 |
| Iraq | 34 |
| Netherlands | 34 |
| Algeria | 33 |

## Stop Conditions

| Stop condition | Status | Count | Details |
| --- | --- | --- | --- |
| official_price_missing | pass | 0 | Official fantasy prices are present for all staged rows. |
| official_position_missing | pass | 0 | Official fantasy positions are present for all staged rows. |
| identity_review_queue_not_empty | pass | 0 | Player identity review queue is empty. |
| duplicate_official_fantasy_ids | pass | 0 | No duplicate official fantasy IDs detected. |
| unresolved_identity_conflicts | pass | 0 | No unresolved identity conflicts detected. |
| final_squads_not_source_backed | stop | 225 | Final squad import is not source-backed complete; fantasy pool rows must not be treated as final squads. |
| official_rules_manual_review | stop | 1 | Official rules import still has manual-review status. |
| no_final_squad_rows_exist | stop | 0 | There are 0 confirmed_final_squad rows in the staged official squad file. |
| browser_ready_files_not_regenerated | stop | 1 | This staging pass intentionally did not regenerate browser-ready files or active recommendation data. |

## Top Blockers

| Blocker | Count | Details |
| --- | --- | --- |
| final_squads_not_source_backed | 225 | Final squad import is not source-backed complete; fantasy pool rows must not be treated as final squads. |
| official_rules_manual_review | 1 | Official rules import still has manual-review status. |
| no_final_squad_rows_exist | 0 | There are 0 confirmed_final_squad rows in the staged official squad file. |
| browser_ready_files_not_regenerated | 1 | This staging pass intentionally did not regenerate browser-ready files or active recommendation data. |

## Safety Decision

- Safe for a preliminary minutes/model staging pass: yes, only as `fantasy_pool_only` and only with conservative handling of missing usage, missing club context, thin profiles, and squad-review rows.
- Safe for final public recommendations: no.
- Safe for final Team Builder promotion: no.

## Required Next Step

Resolve source-backed final squads and remaining official-rules manual-review warnings before final model promotion. Browser-ready files must be regenerated only after the active official model inputs are intentionally promoted.
