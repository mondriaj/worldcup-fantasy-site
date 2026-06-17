# Player Minutes Model Fantasy Pool v0 Report

Generated: 2026-06-08

## Purpose

This is a preliminary `fantasy_pool_only` minutes and role model for staging only. It is not final-squad-ready, not safe for final public recommendations, and not safe for final Team Builder promotion.

## Input Files

- `data/playerRecommendationInputs_v1.json`
- `data/playerClubContext_v1.csv`
- `data/playerQualifierUsage_v1.csv`
- `data/playerDataCoverageReport_v1.json`
- `data/officialFantasyPlayers_v0.json`
- `data/officialFantasyRules_v0.json`
- `data/officialSquads_v0.json`
- `data/officialDataReadiness_v0.json`

## Methodology

National-team usage is the strongest role signal. High recent starts, high qualifier starts, and high national-team minutes can place a player in `locked_starter`, `likely_starter`, or `rotation_starter` bands. Club context is supporting evidence only and can make a small confidence/probability adjustment. Official fantasy price is a weak signal only and cannot by itself create a starter label. Missing usage is never treated as average.

## Conservative Assumptions

- Blocked/not-selectable rows receive no start probability or expected minutes.
- Thin profiles use `thin_profile_unclear` with conservative low-confidence priors.
- Missing national-team usage usually uses `unclear` and a conservative position prior.
- High-price players with source-verified club context but missing national-team usage can use `unclear_high_price` or `club_star_nt_usage_missing`; these remain low-confidence uncertainty labels, not starter proof.
- Starting goalkeepers are assumed near 90 minutes when role evidence is strong.
- Defenders generally receive higher expected minutes than forwards when starting.
- Forwards and attacking midfielders carry more substitution risk.
- Rules and final-squad warnings are carried into every row as promotion blockers.

## Coverage Summary

| Metric | Value |
| --- | --- |
| Total rows | 1488 |
| Rows modeled | 1233 |
| Rows blocked | 255 |
| Fantasy-pool-only rows | 1243 |
| Final-squad-confirmed rows | 0 |
| High-price missing-usage players | 0 |
| High-price uncertainty fallback players | 0 |
| Low-confidence modeled rows | 483 |
| Safe for preliminary staging | yes |
| Safe for final public recommendations | no |
| Safe for final Team Builder promotion | no |

## Role Label Counts

| Role label | Rows |
| --- | --- |
| locked_starter | 353 |
| unclear | 313 |
| blocked | 255 |
| rotation_starter | 218 |
| likely_starter | 178 |
| thin_profile_unclear | 87 |
| impact_sub | 61 |
| backup | 11 |
| squad_depth | 11 |
| third_choice | 1 |

## Role Confidence Counts

| Role confidence | Rows |
| --- | --- |
| high | 606 |
| low | 272 |
| blocked | 255 |
| medium | 144 |
| missing | 124 |
| thin_profile | 87 |

## Average Start Probability by Position

| Position | Average start probability |
| --- | --- |
| DEF | 0.551 |
| FWD | 0.495 |
| GK | 0.372 |
| MID | 0.558 |

## Average Expected Minutes by Position

| Position | Average expected minutes |
| --- | --- |
| DEF | 49.683 |
| FWD | 40.429 |
| GK | 32.69 |
| MID | 45.823 |

## High-Risk Cases

No high-price missing-usage players were flagged.

## High-Price Low-Confidence Watchlist

| Official ID | Name | Country | Position | Price | Role | Confidence | Start probability | Expected minutes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1712 | Ivan Toney | England | FWD | 7.5 | impact_sub | low | 0.285 | 35.4 |
| 1369 | Neymar da Silva Santos Júnior | Brazil | MID | 7.2 | unclear | missing | 0.16 | 20.2 |
| 1485 | Santiago Giménez | Mexico | FWD | 6.8 | rotation_starter | low | 0.465 | 38.5 |
| 112 | Christoph Baumgartner | Austria | MID | 6.7 | blocked | blocked |  |  |
| 1683 | Fredrik Aursnes | Norway | MID | 6.5 | impact_sub | low | 0.325 | 35.1 |
| 1999 | Pablo Páez Gavira | Spain | MID | 6.5 | unclear | missing | 0.16 | 20.2 |
| 1327 | Emiliano Buendía | Argentina | MID | 6.5 | blocked | blocked |  |  |
| 815 | Xavi Simons | Netherlands | MID | 6.5 | blocked | blocked |  |  |
| 1990 | Abdul Fatawu | Ghana | FWD | 6.4 | impact_sub | low | 0.25 | 34.5 |
| 763 | Álvaro Fidalgo | Mexico | MID | 6.4 | squad_depth | low | 0.09 | 12.1 |
| 1473 | César Huerta | Mexico | MID | 6.3 | rotation_starter | low | 0.45 | 39.4 |
| 1477 | Luis Chávez | Mexico | MID | 6.3 | rotation_starter | low | 0.45 | 39.4 |
| 1396 | Cucho Hernández | Colombia | FWD | 6.3 | unclear | low | 0.21 | 25.3 |
| 2073 | Éderson José dos Santos Lourenço da Silva | Brazil | MID | 6.3 | blocked | blocked |  |  |
| 1671 | Sofiane Boufal | Morocco | MID | 6.3 | blocked | blocked |  |  |
| 762 | Orbelín Pineda | Mexico | MID | 6.2 | rotation_starter | low | 0.45 | 39.4 |
| 814 | Teun Koopmeiners | Netherlands | MID | 6.2 | unclear | low | 0.23 | 24.7 |
| 53 | Valentín Barco | Argentina | MID | 6.2 | unclear | low | 0.23 | 24.7 |
| 1292 | Abbosbek Fayzullaev | Uzbekistan | MID | 6.2 | unclear | low | 0.21 | 23.4 |
| 2022 | Bilal El Khannouss | Morocco | MID | 6.2 | unclear | low | 0.21 | 23.4 |
| 9 | Mohammed Amoura | Algeria | FWD | 6.2 | unclear | low | 0.21 | 25.3 |
| 227 | Cyle Larin | Canada | FWD | 6.2 | unclear | low | 0.17 | 23.2 |
| 1257 | Johnny Cardoso | USA | MID | 6.2 | blocked | blocked |  |  |
| 1335 | Matías Soulé | Argentina | MID | 6.2 | blocked | blocked |  |  |
| 1255 | Weston McKennie | USA | MID | 6.1 | rotation_starter | low | 0.47 | 40.4 |

## Blockers Before Final Minutes Model

| Stop condition | Status | Count | Details |
| --- | --- | --- | --- |
| input_final_squads_not_source_backed | stop | 239 | Final squad import is not source-backed complete; fantasy pool rows must not be treated as final squads. |
| input_official_rules_manual_review | stop | 1 | Official rules import still has manual-review status. |
| input_no_final_squad_rows_exist | stop | 0 | There are 0 confirmed_final_squad rows in the staged official squad file. |
| input_browser_ready_files_not_regenerated | stop | 1 | This staging pass intentionally did not regenerate browser-ready files or active recommendation data. |
| fantasy_pool_only_not_final_squad_ready | stop | 0 | This model has 0 confirmed final-squad rows and must not be treated as final. |
| readiness_not_ready_for_model_rerun | stop | 1 | Official data readiness is blocked_waiting_for_official_fantasy_data. |
| official_rules_manual_review | stop | 1 | Official rules still have manual-review warnings, including Mystery Booster/deadline semantics. |
| blocked_player_rows_present | stop | 255 | Blocked rows do not receive preliminary minutes. |
| missing_national_team_usage_present | warning | 615 | Missing national-team usage is kept missing and not treated as average. |
| thin_profiles_present | warning | 228 | Thin profiles use conservative low-confidence priors only. |
| not_safe_for_browser_ready_promotion | stop | 1 | Browser-ready files were intentionally not regenerated in this staging pass. |

## Safety Decision

- Safe for preliminary score/projection staging: yes, only as `fantasy_pool_only` and only with visible warnings.
- Safe for final public recommendations: no.
- Safe for final Team Builder promotion: no.

## Why This Is Not Final

Final squads are not source-backed, no `confirmed_final_squad` rows exist, official rules still have manual-review warnings, and browser-ready active site files were intentionally not regenerated.
