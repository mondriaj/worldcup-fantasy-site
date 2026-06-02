# Targeted National-Team Usage Sourcing Report v1

Generated: 2026-06-02

## Scope

This is a targeted `fantasy_pool_only` national-team usage sourcing layer for high-impact low-confidence players. It does not rerun score predictions, matchday projections, recommendations, Team Builder, captain/substitution logic, browser-ready files, or UX.

## Summary

| Metric | Count |
| --- | --- |
| Targeted players | 274 |
| P0 targets | 7 |
| P1 targets | 39 |
| P2 targets | 222 |
| P3 targets | 6 |
| Players sourced from existing repo data | 10 |
| Players sourced from new manual source-backed data | 12 |
| Players still missing source-backed usage | 252 |
| Source-backed usage rows added | 22 |
| Low-confidence modeled rows after | 496 |
| High-price missing-usage count after | 0 |

## Priority Counts

| Priority | Rows |
| --- | --- |
| P2 | 222 |
| P1 | 39 |
| P0 | 7 |
| P3 | 6 |

## Import Source Counts

| Source type | Rows |
| --- | --- |
| missing_source_gap | 252 |
| existing_repo_data | 10 |
| manual_source_backed | 6 |
| official_federation | 5 |
| fifa_match_report | 1 |

## Source-Backed Rows Added

| Official ID | Name | Country | Source type | Recent starts | Recent minutes | Role evidence | Confidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1600 | Jamal Musiala | Germany | manual_source_backed | 2 |  | rotation_starter | medium |
| 528 | Kai Havertz | Germany | manual_source_backed |  | 300 | likely_starter | medium |
| 1712 | Ivan Toney | England | manual_source_backed |  | 43 | impact_sub | low |
| 226 | Jonathan David | Canada | official_federation | 1 |  | regular_national_team_player | medium |
| 748 | Raúl Jiménez | Mexico | manual_source_backed |  |  | likely_starter | medium |
| 1274 | Christian Pulisic | USA | official_federation | 2 |  | established_national_team_player | medium |
| 1485 | Santiago Giménez | Mexico | existing_repo_data |  |  | regular_national_team_player | low |
| 531 | Deniz Undav | Germany | manual_source_backed |  | 175 | rotation_starter | medium |
| 270 | James Rodríguez | Colombia | manual_source_backed |  |  | likely_starter | medium |
| 1493 | Chris Wood | New Zealand | fifa_match_report |  |  | likely_starter | medium |
| 1683 | Fredrik Aursnes | Norway | official_federation |  |  | rotation_or_recent_squad_player | low |
| 763 | Álvaro Fidalgo | Mexico | existing_repo_data |  |  | limited_senior_international_sample | low |
| 1473 | César Huerta | Mexico | existing_repo_data |  |  | regular_national_team_player | low |
| 1477 | Luis Chávez | Mexico | existing_repo_data |  |  | regular_national_team_player | low |
| 762 | Orbelín Pineda | Mexico | existing_repo_data |  |  | established_national_team_player | low |
| 1254 | Malik Tillman | USA | existing_repo_data |  |  | regular_national_team_player | low |
| 1255 | Weston McKennie | USA | existing_repo_data |  |  | established_national_team_player | low |
| 1474 | Edson Álvarez | Mexico | existing_repo_data |  |  | established_national_team_player | low |
| 1267 | Folarin Balogun | USA | existing_repo_data |  |  | regular_national_team_player | low |
| 2033 | Tyler Adams | USA | official_federation | 2 |  | established_national_team_player | medium |
| 1258 | Antonee Robinson | USA | existing_repo_data |  |  | established_national_team_player | low |
| 1961 | Alphonso Davies | Canada | official_federation | 1 | 12 | rotation_starter | low |

## Required Before/After Checks

| Official ID | Name | Country | Before role | Before confidence | Before start | Before minutes | After role | After confidence | After start | After minutes | Source type | Usage confidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1600 | Jamal Musiala | Germany | club_star_nt_usage_missing | low | 0.355 | 34 | rotation_starter | medium | 0.528 | 43.5 | manual_source_backed | medium |
| 528 | Kai Havertz | Germany | unclear_high_price | low | 0.3 | 31.6 | likely_starter | medium | 0.675 | 50.5 | manual_source_backed | medium |
| 1712 | Ivan Toney | England | unclear_high_price | low | 0.33 | 33.2 | impact_sub | low | 0.285 | 35.4 | manual_source_backed | low |
| 226 | Jonathan David | Canada | unclear_high_price | low | 0.315 | 32.4 | likely_starter | medium | 0.695 | 51.5 | official_federation | medium |
| 748 | Raúl Jiménez | Mexico | unclear_high_price | low | 0.33 | 33.2 | likely_starter | medium | 0.695 | 51.5 | manual_source_backed | medium |
| 1274 | Christian Pulisic | USA | unclear_high_price | low | 0.335 | 32.8 | likely_starter | medium | 0.705 | 55.1 | official_federation | medium |

## Still Missing Source-Backed Usage

| Official ID | Name | Country | Priority | Reason | Recommended action |
| --- | --- | --- | --- | --- | --- |
| 1369 | Neymar da Silva Santos Júnior | Brazil | P0 | high_price_low_role_confidence\|high_price_missing_national_team_usage\|high_price_start_probability_below_0.35\|high_impact_watchlist_player\|high_price_start_probability_below_0.45 | keep_existing_conservative_low_confidence_treatment |
| 1327 | Emiliano Buendía | Argentina | P1 | earlier_high_risk_example\|high_price_low_role_confidence\|high_price_missing_national_team_usage | keep_blocked_until_selectable_status_and_squad_review_are_resolved |
| 815 | Xavi Simons | Netherlands | P1 | earlier_high_risk_example\|high_price_low_role_confidence\|high_price_missing_national_team_usage | keep_blocked_until_selectable_status_and_squad_review_are_resolved |
| 1999 | Pablo Páez Gavira | Spain | P1 | high_price_low_role_confidence\|high_price_missing_national_team_usage\|high_price_start_probability_below_0.35\|high_impact_watchlist_player | keep_existing_conservative_low_confidence_treatment |
| 1990 | Abdul Fatawu | Ghana | P1 | high_price_low_role_confidence\|high_price_start_probability_below_0.35 | keep_existing_conservative_low_confidence_treatment |
| 1396 | Cucho Hernández | Colombia | P1 | high_price_low_role_confidence\|high_price_missing_national_team_usage\|high_price_start_probability_below_0.35\|strong_club_context_missing_national_team_usage | source_national_team_usage_before_final_minutes_promotion |
| 1671 | Sofiane Boufal | Morocco | P1 | earlier_high_risk_example\|high_price_low_role_confidence\|high_price_missing_national_team_usage | keep_blocked_until_selectable_status_and_squad_review_are_resolved |
| 9 | Mohammed Amoura | Algeria | P1 | high_price_low_role_confidence\|high_price_missing_national_team_usage\|high_price_start_probability_below_0.35\|strong_club_context_missing_national_team_usage | source_national_team_usage_before_final_minutes_promotion |
| 1335 | Matías Soulé | Argentina | P1 | earlier_high_risk_example\|high_price_low_role_confidence\|high_price_missing_national_team_usage | keep_blocked_until_selectable_status_and_squad_review_are_resolved |
| 53 | Valentín Barco | Argentina | P1 | high_price_low_role_confidence\|high_price_missing_national_team_usage\|high_price_start_probability_below_0.35\|strong_club_context_missing_national_team_usage | source_national_team_usage_before_final_minutes_promotion |
| 227 | Cyle Larin | Canada | P1 | high_price_low_role_confidence\|high_price_missing_national_team_usage\|high_price_start_probability_below_0.35\|strong_club_context_missing_national_team_usage | source_national_team_usage_before_final_minutes_promotion |
| 2022 | Bilal El Khannouss | Morocco | P1 | high_price_low_role_confidence\|high_price_missing_national_team_usage\|high_price_start_probability_below_0.35\|strong_club_context_missing_national_team_usage | source_national_team_usage_before_final_minutes_promotion |
| 814 | Teun Koopmeiners | Netherlands | P1 | high_price_low_role_confidence\|high_price_missing_national_team_usage\|high_price_start_probability_below_0.35\|strong_club_context_missing_national_team_usage | source_national_team_usage_before_final_minutes_promotion |
| 1257 | Johnny Cardoso | USA | P1 | earlier_high_risk_example\|high_price_low_role_confidence\|high_price_missing_national_team_usage | keep_blocked_until_selectable_status_and_squad_review_are_resolved |
| 1292 | Abbosbek Fayzullaev | Uzbekistan | P1 | high_price_low_role_confidence\|high_price_missing_national_team_usage\|high_price_start_probability_below_0.35\|strong_club_context_missing_national_team_usage | source_national_team_usage_before_final_minutes_promotion |
| 271 | Jorge Carrascal | Colombia | P1 | high_price_low_role_confidence\|high_price_missing_national_team_usage\|high_price_start_probability_below_0.35\|strong_club_context_missing_national_team_usage | source_national_team_usage_before_final_minutes_promotion |
| 485 | Kobbie Mainoo | England | P1 | high_price_low_role_confidence\|high_price_missing_national_team_usage\|high_price_start_probability_below_0.35\|strong_club_context_missing_national_team_usage | source_national_team_usage_before_final_minutes_promotion |
| 813 | Jerdy Schouten | Netherlands | P1 | high_price_low_role_confidence\|high_price_missing_national_team_usage | keep_blocked_until_selectable_status_and_squad_review_are_resolved |
| 1307 | Igor Sergeev | Uzbekistan | P1 | high_price_low_role_confidence\|high_price_start_probability_below_0.35 | keep_existing_conservative_low_confidence_treatment |
| 1291 | Jaloliddin Masharipov | Uzbekistan | P1 | high_price_low_role_confidence | keep_existing_conservative_low_confidence_treatment |
| 1340 | Santiago Castro | Argentina | P1 | high_price_low_role_confidence\|high_price_missing_national_team_usage | keep_blocked_until_selectable_status_and_squad_review_are_resolved |
| 2050 | Cristian Volpato | Australia | P1 | high_price_low_role_confidence\|high_price_missing_national_team_usage\|high_price_start_probability_below_0.35 | keep_thin_profile_conservative_until_source_backed_profile_enrichment |
| 97 | Sasa Kalajdzic | Austria | P1 | high_price_low_role_confidence\|high_price_missing_national_team_usage\|high_price_start_probability_below_0.35\|strong_club_context_missing_national_team_usage | source_national_team_usage_before_final_minutes_promotion |
| 245 | Ismaël Koné | Canada | P1 | high_price_low_role_confidence\|high_price_missing_national_team_usage\|high_price_start_probability_below_0.35\|strong_club_context_missing_national_team_usage | source_national_team_usage_before_final_minutes_promotion |
| 51 | Nico Paz | Argentina | P2 | strong_club_context_missing_national_team_usage | source_national_team_usage_before_final_minutes_promotion |
| 178 | Igor Thiago Nascimento Rodrigues | Brazil | P2 | strong_club_context_missing_national_team_usage | source_national_team_usage_before_final_minutes_promotion |
| 309 | Elye Wahi | Côte d'Ivoire | P2 | strong_club_context_missing_national_team_usage | source_national_team_usage_before_final_minutes_promotion |
| 760 | Carlos Rodríguez | Mexico | P2 | strong_club_context_missing_national_team_usage | keep_blocked_until_selectable_status_and_squad_review_are_resolved |
| 1472 | Diego Lainez | Mexico | P2 | strong_club_context_missing_national_team_usage | keep_blocked_until_selectable_status_and_squad_review_are_resolved |
| 1470 | Marcel Ruiz | Mexico | P2 | strong_club_context_missing_national_team_usage | keep_blocked_until_selectable_status_and_squad_review_are_resolved |

## Safety Notes

- Added starts/minutes/role fields are present only where a source URL and checked date are recorded.
- Rows with `missing_source_gap` do not add usage values and should not change the enrichment output.
- Existing repo caps/role evidence is imported as low-confidence role evidence only unless a separate official line-up or stats source was checked.
- Missing national-team usage remains missing; it is not treated as average.
- This remains `fantasy_pool_only`, not final-squad-ready, not safe for final public recommendations, and not safe for final Team Builder promotion.

## Remaining Warnings And Promotion Blockers

- Preliminary `fantasy_pool_only` score/projection staging is safer after this pass, but it should keep explicit warnings for remaining missing-source rows.
- Remaining P0 missing-source cases: Neymar da Silva Santos Júnior.
- Final squads are still not source-backed and remain a final-promotion blocker.
- Official rules still have manual-review warnings and remain a final-promotion blocker.
- Browser-ready files were intentionally not regenerated and must not be promoted from this staging pass.
