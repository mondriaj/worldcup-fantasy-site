# Player Data Coverage Report v1

Generated: 2026-06-02

## Scope

This report summarizes enrichment coverage for all official fantasy players after the clean identity-map pass. It does not update active model inputs or browser-ready files.

## Coverage Summary

| Metric | Count |
| --- | ---: |
| Total official fantasy players | 1481 |
| Players with club context | 1156 |
| Players missing club context | 325 |
| Players with national-team usage | 873 |
| Players missing national-team usage | 608 |
| High usage confidence | 632 |
| Medium usage confidence | 150 |
| Low usage confidence | 91 |
| Thin profiles | 221 |
| Thin profiles with club context | 0 |
| Thin profiles with usage context | 0 |
| Position-conflict players | 135 |
| Players with missing enrichment | 654 |

## Missing Coverage By Country

Club context:

- Australia: 33
- Argentina: 29
- Iraq: 29
- Jordan: 28
- Korea Republic: 22
- Morocco: 21
- Paraguay: 15
- Qatar: 15
- Ghana: 12
- Egypt: 10

National-team usage:

- Mexico: 44
- Argentina: 33
- Morocco: 33
- Australia: 32
- Paraguay: 31
- Canada: 30
- USA: 25
- Korea Republic: 20
- Jordan: 17
- Uzbekistan: 17

Any missing enrichment:

- Mexico: 44
- Argentina: 33
- Australia: 33
- Morocco: 33
- Paraguay: 31
- Canada: 30
- Iraq: 30
- Jordan: 30
- USA: 25
- Korea Republic: 23

## Missing Coverage By Position

Club context:

- DEF: 108
- MID: 107
- FWD: 56
- GK: 54

National-team usage:

- MID: 192
- DEF: 190
- FWD: 116
- GK: 110

Any missing enrichment:

- MID: 210
- DEF: 203
- FWD: 127
- GK: 114

## High-Risk Missing-Data Cases

| Official ID | Name | Country | Position | Price | Missing club | Missing usage | Flags |
| --- | --- | --- | --- | ---: | --- | --- | --- |
| 1327 | Emiliano Buendía | Argentina | MID | 6.5 | yes | yes | thin_profile|thin_profile_missing|missing_usage|source_gap|famous_player_missing_usage|missing_role_confidence|missing_club|missing_league|missing_club_minutes|missing_club_starts|low_club_role_confidence |
| 815 | Xavi Simons | Netherlands | MID | 6.5 | yes | yes | thin_profile|thin_profile_missing|missing_usage|source_gap|famous_player_missing_usage|missing_role_confidence|missing_club|missing_league|missing_club_minutes|missing_club_starts|low_club_role_confidence |
| 1671 | Sofiane Boufal | Morocco | MID | 6.3 | yes | yes | thin_profile|thin_profile_missing|missing_usage|source_gap|famous_player_missing_usage|missing_role_confidence|missing_club|missing_league|missing_club_minutes|missing_club_starts|low_club_role_confidence |
| 1335 | Matías Soulé | Argentina | MID | 6.2 | yes | yes | thin_profile|thin_profile_missing|missing_usage|source_gap|famous_player_missing_usage|missing_role_confidence|missing_club|missing_league|missing_club_minutes|missing_club_starts|low_club_role_confidence |
| 1257 | Johnny Cardoso | USA | MID | 6.2 | yes | yes | thin_profile|thin_profile_missing|missing_usage|source_gap|famous_player_missing_usage|missing_role_confidence|missing_club|missing_league|missing_club_minutes|missing_club_starts|low_club_role_confidence |
| 813 | Jerdy Schouten | Netherlands | MID | 6.1 | yes | yes | thin_profile|thin_profile_missing|missing_usage|source_gap|missing_role_confidence|missing_club|missing_league|missing_club_minutes|missing_club_starts|low_club_role_confidence |
| 1340 | Santiago Castro | Argentina | FWD | 6 | yes | yes | thin_profile|thin_profile_missing|missing_usage|source_gap|missing_role_confidence|missing_club|missing_league|missing_club_minutes|missing_club_starts|low_club_role_confidence |
| 2050 | Cristian Volpato | Australia | MID | 6 | yes | yes | thin_profile|thin_profile_missing|missing_usage|source_gap|missing_role_confidence|missing_club|missing_league|missing_club_minutes|missing_club_starts|low_club_role_confidence |
| 84 | Riley McGree | Australia | MID | 5.9 | yes | yes | thin_profile|thin_profile_missing|missing_usage|source_gap|missing_role_confidence|missing_club|missing_league|missing_club_minutes|missing_club_starts|low_club_role_confidence |
| 735 | Jun-Ho Bae | Korea Republic | MID | 5.9 | yes | yes | thin_profile|thin_profile_missing|missing_usage|source_gap|missing_role_confidence|missing_club|missing_league|missing_club_minutes|missing_club_starts|low_club_role_confidence |
| 1705 | Patrick Maswanganyi | South Africa | MID | 5.9 | yes | yes | thin_profile|thin_profile_missing|missing_usage|source_gap|missing_role_confidence|missing_club|missing_league|missing_club_minutes|missing_club_starts|low_club_role_confidence |
| 44 | Franco Mastantuono | Argentina | MID | 5.8 | yes | yes | thin_profile|thin_profile_missing|missing_usage|source_gap|missing_role_confidence|missing_club|missing_league|missing_club_minutes|missing_club_starts|low_club_role_confidence |
| 83 | Ajdin Hrustic | Australia | MID | 5.7 | yes | yes | thin_profile|thin_profile_missing|missing_usage|source_gap|missing_role_confidence|missing_club|missing_league|missing_club_minutes|missing_club_starts|low_club_role_confidence |
| 1672 | Imrân Louza | Morocco | MID | 5.7 | yes | yes | thin_profile|thin_profile_missing|missing_usage|source_gap|missing_role_confidence|missing_club|missing_league|missing_club_minutes|missing_club_starts|low_club_role_confidence |
| 25 | Adil Aouchiche | Algeria | MID | 5.6 | yes | yes | thin_profile|thin_profile_missing|missing_usage|source_gap|missing_role_confidence|missing_club|missing_league|missing_club_minutes|missing_club_starts|low_club_role_confidence |

## QA Gates

- Official players missing club-context output rows: 0
- Official players missing usage output rows: 0
- Duplicate official fantasy IDs: 0
- Duplicate existing internal IDs where not expected: 0
- Missing club role confidence: 325
- Missing usage confidence: 608
- Position conflicts carried from identity map: 135
- High-price players with missing usage: 0
- Likely starters missing usage: 0
- Goalkeepers without role confidence: 110

## Minutes-Model Readiness

Coverage status: `not_sufficient_for_final_minutes_model_without_targeted_missing-data review`

This enrichment layer is complete as an inventory and QA layer for all 1,481 official fantasy players. It is not yet sufficient for a final official minutes model because missing club/usage context, thin profiles, final squads, and official rules still need review before model reruns.
