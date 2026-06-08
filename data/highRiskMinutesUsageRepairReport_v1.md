# High-Risk Minutes Usage Repair Report v1

Generated: 2026-06-08

## Scope

This is a targeted `fantasy_pool_only` repair pass for high-risk minutes and national-team usage staging. It does not rerun score predictions, matchday projections, recommendations, Team Builder, captain/substitution tools, browser-ready files, or UX.

## Summary

| Metric | Before | After / current |
| --- | --- | --- |
| High-risk players audited |  | 265 |
| Join gaps fixed in this pass |  | 0 |
| Players still missing source-backed usage in audit |  | 243 |
| High-price uncertainty fallback players |  | 0 |
| High-price missing-usage players | 0 | 0 |
| Low-confidence modeled rows | 486 | 486 |
| Rows modeled | 1243 | 1243 |
| Rows blocked | 239 | 239 |

## Repair Logic

- No national-team starts, minutes, set pieces, penalties, or final-squad status were invented.
- No enrichment join repair was found for this pass; `data/playerQualifierUsage_v1.csv` remains source-backed and missing where source-backed usage is absent.
- High-price players with clean identity, fantasy-pool selectable status, source-verified club context, and missing national-team usage now receive `unclear_high_price` or `club_star_nt_usage_missing` instead of the generic `unclear` bucket.
- The new labels are low-confidence uncertainty labels. They do not prove starts and do not make the model final.

## Source Gap Types

| Source gap type | Rows |
| --- | --- |
| club_context_available_usage_missing | 172 |
| manual_review_needed | 63 |
| position_or_role_conflict | 19 |
| thin_profile | 8 |
| true_source_gap | 3 |

## Jamal Musiala Before And After

| Official ID | Name | Country | Position | Price | Before role | Before start | Before minutes | After role | After start | After minutes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1600 | Jamal Musiala | Germany | MID | 8 | rotation_starter | 0.528 | 43.5 | rotation_starter | 0.528 | 43.5 |

Musiala remains missing source-backed Germany qualifier/national-team starts and minutes in the current repo. The repair uses only his clean identity, official fantasy price, selectable fantasy-pool status, and source-verified Bayern Munich club context to move him into a low-confidence high-price uncertainty bucket.

## Major Player Before And After

| Official ID | Name | Country | Position | Price | Before role | Before start | Before minutes | After role | After start | After minutes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1257 | Johnny Cardoso | USA | MID | 6.2 | blocked |  |  | blocked |  |  |
| 1274 | Christian Pulisic | USA | MID | 7 | likely_starter | 0.705 | 55.1 | likely_starter | 0.705 | 55.1 |
| 1327 | Emiliano Buendía | Argentina | MID | 6.5 | blocked |  |  | blocked |  |  |
| 1335 | Matías Soulé | Argentina | MID | 6.2 | blocked |  |  | blocked |  |  |
| 1369 | Neymar da Silva Santos Júnior | Brazil | MID | 7.2 | unclear | 0.16 | 20.2 | unclear | 0.16 | 20.2 |
| 1600 | Jamal Musiala | Germany | MID | 8 | rotation_starter | 0.528 | 43.5 | rotation_starter | 0.528 | 43.5 |
| 1671 | Sofiane Boufal | Morocco | MID | 6.3 | blocked |  |  | blocked |  |  |
| 226 | Jonathan David | Canada | FWD | 7 | likely_starter | 0.695 | 51.5 | likely_starter | 0.695 | 51.5 |
| 528 | Kai Havertz | Germany | FWD | 7.8 | likely_starter | 0.675 | 50.5 | likely_starter | 0.675 | 50.5 |
| 815 | Xavi Simons | Netherlands | MID | 6.5 | blocked |  |  | blocked |  |  |

## High-Risk Audit List Preview

| Official ID | Name | Country | Position | Price | Current role | Confidence | Source gap type | Recommended action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1600 | Jamal Musiala | Germany | MID | 8 | rotation_starter | medium | manual_review_needed | keep_existing_conservative_low_confidence_treatment |
| 1711 | Ollie Watkins | England | FWD | 7.9 | impact_sub | high | manual_review_needed | keep_existing_conservative_low_confidence_treatment |
| 1712 | Ivan Toney | England | FWD | 7.5 | impact_sub | low | manual_review_needed | keep_existing_conservative_low_confidence_treatment |
| 1104 | Rodrigo Hernández Cascante | Spain | MID | 7.5 | impact_sub | medium | true_source_gap | keep_existing_conservative_low_confidence_treatment |
| 1369 | Neymar da Silva Santos Júnior | Brazil | MID | 7.2 | unclear | missing | position_or_role_conflict | keep_existing_conservative_low_confidence_treatment |
| 1485 | Santiago Giménez | Mexico | FWD | 6.8 | rotation_starter | low | manual_review_needed | keep_existing_conservative_low_confidence_treatment |
| 112 | Christoph Baumgartner | Austria | MID | 6.7 | blocked | blocked | manual_review_needed | keep_blocked_until_selectable_status_and_squad_review_are_resolved |
| 1327 | Emiliano Buendía | Argentina | MID | 6.5 | blocked | blocked | thin_profile | keep_blocked_until_selectable_status_and_squad_review_are_resolved |
| 815 | Xavi Simons | Netherlands | MID | 6.5 | blocked | blocked | thin_profile | keep_blocked_until_selectable_status_and_squad_review_are_resolved |
| 1683 | Fredrik Aursnes | Norway | MID | 6.5 | impact_sub | low | manual_review_needed | keep_existing_conservative_low_confidence_treatment |
| 1999 | Pablo Páez Gavira | Spain | MID | 6.5 | unclear | missing | true_source_gap | keep_existing_conservative_low_confidence_treatment |
| 1990 | Abdul Fatawu | Ghana | FWD | 6.4 | impact_sub | low | true_source_gap | keep_existing_conservative_low_confidence_treatment |
| 763 | Álvaro Fidalgo | Mexico | MID | 6.4 | squad_depth | low | manual_review_needed | keep_existing_conservative_low_confidence_treatment |
| 1396 | Cucho Hernández | Colombia | FWD | 6.3 | unclear | low | club_context_available_usage_missing | source_national_team_usage_before_final_minutes_promotion |
| 1473 | César Huerta | Mexico | MID | 6.3 | rotation_starter | low | manual_review_needed | keep_existing_conservative_low_confidence_treatment |
| 1477 | Luis Chávez | Mexico | MID | 6.3 | rotation_starter | low | manual_review_needed | keep_existing_conservative_low_confidence_treatment |
| 1671 | Sofiane Boufal | Morocco | MID | 6.3 | blocked | blocked | thin_profile | keep_blocked_until_selectable_status_and_squad_review_are_resolved |
| 9 | Mohammed Amoura | Algeria | FWD | 6.2 | unclear | low | club_context_available_usage_missing | source_national_team_usage_before_final_minutes_promotion |
| 1335 | Matías Soulé | Argentina | MID | 6.2 | blocked | blocked | thin_profile | keep_blocked_until_selectable_status_and_squad_review_are_resolved |
| 53 | Valentín Barco | Argentina | MID | 6.2 | unclear | low | club_context_available_usage_missing | source_national_team_usage_before_final_minutes_promotion |
| 227 | Cyle Larin | Canada | FWD | 6.2 | unclear | low | club_context_available_usage_missing | source_national_team_usage_before_final_minutes_promotion |
| 762 | Orbelín Pineda | Mexico | MID | 6.2 | rotation_starter | low | manual_review_needed | keep_existing_conservative_low_confidence_treatment |
| 2022 | Bilal El Khannouss | Morocco | MID | 6.2 | unclear | low | club_context_available_usage_missing | source_national_team_usage_before_final_minutes_promotion |
| 814 | Teun Koopmeiners | Netherlands | MID | 6.2 | unclear | low | club_context_available_usage_missing | source_national_team_usage_before_final_minutes_promotion |
| 1257 | Johnny Cardoso | USA | MID | 6.2 | blocked | blocked | thin_profile | keep_blocked_until_selectable_status_and_squad_review_are_resolved |

## Remaining High-Risk Issues

- Source-backed national-team usage remains missing for 243 audited rows.
- High-price missing-usage count is 0; this count only falls when source-backed usage is imported or joined.
- Low-confidence modeled rows are 486; this pass improves labels for the most material club-context cases but does not make low confidence disappear.
- Thin-profile and blocked players remain conservative or blocked. Famous names such as Xavi Simons, Emiliano Buendía, Matías Soulé, Johnny Cardoso, and Sofiane Boufal still need source-backed identity/enrichment before they can be treated as clean model inputs.

## Safety Decision

- Safer for preliminary minutes staging: yes, because high-price club-context source gaps are now explicit low-confidence uncertainty cases rather than generic unclear rows.
- Safe for final public recommendations: no.
- Safe for final Team Builder promotion: no.
- Official readiness remains blocked until final squads, official-rule warnings, and active model promotion gates are resolved.

## Recommended Next Session

Source national-team usage for the highest-price low-confidence players and host-team stars, with final squads still treated as a separate blocking gate.
