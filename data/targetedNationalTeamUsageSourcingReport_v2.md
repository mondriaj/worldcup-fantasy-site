# Targeted National-Team Usage Sourcing Report v2

Generated: 2026-06-02

## Scope

This final targeted pass reviews the remaining high-impact `P0`/`P1` national-team usage gaps for the `fantasy_pool_only` minutes model. It does not rerun score predictions, matchday projections, recommendations, Team Builder, captain/substitution logic, browser-ready files, or UX.

Every output remains `fantasy_pool_only`, not final-squad-ready, not safe for final public recommendations, and not safe for final Team Builder promotion.

## Summary

| Metric | Count |
| --- | --- |
| P0/P1 players reviewed | 46 |
| P0 reviewed | 7 |
| P1 reviewed | 39 |
| Source-backed v2 import rows | 22 |
| Source-backed rows added in this final pass | 5 |
| Players still source gaps in v2 | 24 |
| Remaining P0 source gaps | 1 |
| Low-confidence modeled rows after | 496 |
| High-price uncertainty fallback count after | 0 |

## Six Priority Players Before And After

| Official ID | Name | Country | Before role | Before confidence | Before start | Before minutes | After role | After confidence | After start | After minutes | Source type | Usage confidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1712 | Ivan Toney | England | unclear_high_price | low | 0.33 | 33.2 | impact_sub | low | 0.285 | 35.4 | manual_source_backed | low |
| 1369 | Neymar da Silva Santos Júnior | Brazil | unclear | missing | 0.16 | 20.2 | unclear | missing | 0.16 | 20.2 | missing_source_gap | missing |
| 531 | Deniz Undav | Germany | unclear | low | 0.215 | 25.6 | rotation_starter | medium | 0.495 | 39.8 | manual_source_backed | medium |
| 270 | James Rodríguez | Colombia | unclear | low | 0.215 | 23.8 | likely_starter | medium | 0.685 | 53.8 | manual_source_backed | medium |
| 1493 | Chris Wood | New Zealand | unclear | low | 0.175 | 23.5 | likely_starter | medium | 0.675 | 50.5 | fifa_match_report | medium |
| 1683 | Fredrik Aursnes | Norway | unclear | low | 0.235 | 25 | impact_sub | low | 0.325 | 35.1 | official_federation | low |

## Players Improved

| Official ID | Name | Country | Source type | Recent starts | Recent minutes | Role evidence | Confidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1712 | Ivan Toney | England | manual_source_backed |  | 43 | impact_sub | low |
| 531 | Deniz Undav | Germany | manual_source_backed |  | 175 | rotation_starter | medium |
| 270 | James Rodríguez | Colombia | manual_source_backed |  |  | likely_starter | medium |
| 1493 | Chris Wood | New Zealand | fifa_match_report |  |  | likely_starter | medium |
| 1683 | Fredrik Aursnes | Norway | official_federation |  |  | rotation_or_recent_squad_player | low |

## Players Still Source Gaps

| Official ID | Name | Country | Priority | Reason | Needed source |
| --- | --- | --- | --- | --- | --- |
| 1369 | Neymar da Silva Santos Júnior | Brazil | P0 | high_price_low_role_confidence\|high_price_missing_national_team_usage\|high_price_start_probability_below_0.35\|high_impact_watchlist_player\|high_price_start_probability_below_0.45 | Official federation/confederation lineup or stats source with starts, minutes, or explicit role. |
| 1327 | Emiliano Buendía | Argentina | P1 | earlier_high_risk_example\|high_price_low_role_confidence\|high_price_missing_national_team_usage | Official federation/confederation lineup or stats source with starts, minutes, or explicit role. |
| 815 | Xavi Simons | Netherlands | P1 | earlier_high_risk_example\|high_price_low_role_confidence\|high_price_missing_national_team_usage | Official federation/confederation lineup or stats source with starts, minutes, or explicit role. |
| 1999 | Pablo Páez Gavira | Spain | P1 | high_price_low_role_confidence\|high_price_missing_national_team_usage\|high_price_start_probability_below_0.35\|high_impact_watchlist_player | Official federation/confederation lineup or stats source with starts, minutes, or explicit role. |
| 1990 | Abdul Fatawu | Ghana | P1 | high_price_low_role_confidence\|high_price_start_probability_below_0.35 | Official federation/confederation lineup or stats source with starts, minutes, or explicit role. |
| 1396 | Cucho Hernández | Colombia | P1 | high_price_low_role_confidence\|high_price_missing_national_team_usage\|high_price_start_probability_below_0.35\|strong_club_context_missing_national_team_usage | Official federation/confederation lineup or stats source with starts, minutes, or explicit role. |
| 1671 | Sofiane Boufal | Morocco | P1 | earlier_high_risk_example\|high_price_low_role_confidence\|high_price_missing_national_team_usage | Official federation/confederation lineup or stats source with starts, minutes, or explicit role. |
| 9 | Mohammed Amoura | Algeria | P1 | high_price_low_role_confidence\|high_price_missing_national_team_usage\|high_price_start_probability_below_0.35\|strong_club_context_missing_national_team_usage | Official federation/confederation lineup or stats source with starts, minutes, or explicit role. |
| 1335 | Matías Soulé | Argentina | P1 | earlier_high_risk_example\|high_price_low_role_confidence\|high_price_missing_national_team_usage | Official federation/confederation lineup or stats source with starts, minutes, or explicit role. |
| 53 | Valentín Barco | Argentina | P1 | high_price_low_role_confidence\|high_price_missing_national_team_usage\|high_price_start_probability_below_0.35\|strong_club_context_missing_national_team_usage | Official federation/confederation lineup or stats source with starts, minutes, or explicit role. |
| 227 | Cyle Larin | Canada | P1 | high_price_low_role_confidence\|high_price_missing_national_team_usage\|high_price_start_probability_below_0.35\|strong_club_context_missing_national_team_usage | Official federation/confederation lineup or stats source with starts, minutes, or explicit role. |
| 2022 | Bilal El Khannouss | Morocco | P1 | high_price_low_role_confidence\|high_price_missing_national_team_usage\|high_price_start_probability_below_0.35\|strong_club_context_missing_national_team_usage | Official federation/confederation lineup or stats source with starts, minutes, or explicit role. |
| 814 | Teun Koopmeiners | Netherlands | P1 | high_price_low_role_confidence\|high_price_missing_national_team_usage\|high_price_start_probability_below_0.35\|strong_club_context_missing_national_team_usage | Official federation/confederation lineup or stats source with starts, minutes, or explicit role. |
| 1257 | Johnny Cardoso | USA | P1 | earlier_high_risk_example\|high_price_low_role_confidence\|high_price_missing_national_team_usage | Official federation/confederation lineup or stats source with starts, minutes, or explicit role. |
| 1292 | Abbosbek Fayzullaev | Uzbekistan | P1 | high_price_low_role_confidence\|high_price_missing_national_team_usage\|high_price_start_probability_below_0.35\|strong_club_context_missing_national_team_usage | Official federation/confederation lineup or stats source with starts, minutes, or explicit role. |
| 271 | Jorge Carrascal | Colombia | P1 | high_price_low_role_confidence\|high_price_missing_national_team_usage\|high_price_start_probability_below_0.35\|strong_club_context_missing_national_team_usage | Official federation/confederation lineup or stats source with starts, minutes, or explicit role. |
| 485 | Kobbie Mainoo | England | P1 | high_price_low_role_confidence\|high_price_missing_national_team_usage\|high_price_start_probability_below_0.35\|strong_club_context_missing_national_team_usage | Official federation/confederation lineup or stats source with starts, minutes, or explicit role. |
| 813 | Jerdy Schouten | Netherlands | P1 | high_price_low_role_confidence\|high_price_missing_national_team_usage | Official federation/confederation lineup or stats source with starts, minutes, or explicit role. |
| 1307 | Igor Sergeev | Uzbekistan | P1 | high_price_low_role_confidence\|high_price_start_probability_below_0.35 | Official federation/confederation lineup or stats source with starts, minutes, or explicit role. |
| 1291 | Jaloliddin Masharipov | Uzbekistan | P1 | high_price_low_role_confidence | Official federation/confederation lineup or stats source with starts, minutes, or explicit role. |
| 1340 | Santiago Castro | Argentina | P1 | high_price_low_role_confidence\|high_price_missing_national_team_usage | Official federation/confederation lineup or stats source with starts, minutes, or explicit role. |
| 2050 | Cristian Volpato | Australia | P1 | high_price_low_role_confidence\|high_price_missing_national_team_usage\|high_price_start_probability_below_0.35 | Official federation/confederation lineup or stats source with starts, minutes, or explicit role. |
| 97 | Sasa Kalajdzic | Austria | P1 | high_price_low_role_confidence\|high_price_missing_national_team_usage\|high_price_start_probability_below_0.35\|strong_club_context_missing_national_team_usage | Official federation/confederation lineup or stats source with starts, minutes, or explicit role. |
| 245 | Ismaël Koné | Canada | P1 | high_price_low_role_confidence\|high_price_missing_national_team_usage\|high_price_start_probability_below_0.35\|strong_club_context_missing_national_team_usage | Official federation/confederation lineup or stats source with starts, minutes, or explicit role. |

## Source URLs Used

| Official ID | Name | Country | Source type | Source URL |
| --- | --- | --- | --- | --- |
| 1712 | Ivan Toney | England | manual_source_backed | https://editorial.uefa.com/resources/028f-1b6f7f14a391-e1beafb781cc-1000/euro2024_mini-tech-report_v7.pdf |
| 531 | Deniz Undav | Germany | manual_source_backed | https://fr.uefa.com/uefanationsleague/teams/players/250194673--deniz-undav/ |
| 270 | James Rodríguez | Colombia | manual_source_backed | https://copaamerica.com/en/news/james-rodriguez-colombia-best-player-copa-america-2024-award |
| 1493 | Chris Wood | New Zealand | fifa_match_report | https://inside.fifa.com/organisation/news/new-zealand-caledonia-world-cup-2026-chris-wood-interview\|https://www.oceaniafootball.com/fifa-world-cup-26-oceania-qualifiers-round-three/ |
| 1683 | Fredrik Aursnes | Norway | official_federation | https://www.fotball.no/landslag/norge-a-herrer/2026/her-er-norges-vm-tropp/\|https://www.fotball.no/landslag/norge-a-herrer/2026/norges-tropp-mot-nederland-og-sveits/ |

## Remaining P0 Blockers

| Official ID | Name | Country | Reason |
| --- | --- | --- | --- |
| 1369 | Neymar da Silva Santos Júnior | Brazil | high_price_low_role_confidence\|high_price_missing_national_team_usage\|high_price_start_probability_below_0.35\|high_impact_watchlist_player\|high_price_start_probability_below_0.45 |

## Score Predictor Staging Decision

- It is now reasonable to proceed to score predictor v3 staging only if that stage keeps the `fantasy_pool_only` label, carries the missing-usage warnings, and blocks final promotion.
- It is not safe for final public recommendations or final Team Builder promotion because source-backed final squads, final browser-ready regeneration, and official-rules manual-review warnings remain unresolved.
- Neymar remains a P0 source gap: current checked sources provide injury/return/squad context, but not clean starts, minutes, or a source-backed role label.
- Rows with `missing_source_gap` do not add starts, minutes, or role values.
