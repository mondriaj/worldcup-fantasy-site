# Player Enrichment Source Inventory v1

Generated: 2026-06-02

## Scope

This inventory documents existing repo sources inspected for club context, national-team usage, qualifier usage, minutes, starts, roles, and supporting player performance fields. It does not promote any prototype model output into an official model input.

## Source Summary

- Official fantasy player rows inspected: 1481
- Official fantasy import CSV rows inspected: 1481
- Identity-map rows inspected: 1481
- Existing internal player rows inspected: 1339
- Recommendation input rows inspected: 1339
- National-team performance rows inspected: 1339
- Targeted national-team usage import rows inspected: 274
- Club/player performance rows inspected: 442
- Existing minutes-model rows inspected as audit context: 1339
- OneFootball club rows inspected: 801
- OneFootball qualifier season rows inspected: 852
- OneFootball qualifier match rows inspected: 5181
- ESPN matched season rows inspected: 937
- ESPN roster leaderboard rows inspected: 1459

## Inspected Sources

| Source file | Fields available | Club context support | National-team usage support | Minutes or role support | Source type | Known limitations |
| --- | --- | --- | --- | --- | --- | --- |
| data/officialFantasyPlayers_v0.json | official_fantasy_player_id, name, country, team_id, official_fantasy_position, official_price, selectable_status, source_url, source_checked | No direct club context in current import; club fields are null. | No national-team usage. | No minutes or role confidence. | official fantasy import | Authoritative for official fantasy IDs/prices/positions only; status remains imported_needs_manual_review at import layer. |
| data/imports/officialFantasyPlayers.csv | official_fantasy_player_id, name, display_name, first_name, last_name, country, team_id, official_fantasy_position, official_price, source_url, source_checked | No populated club context in current import CSV. | No national-team usage. | No minutes or role confidence. | official fantasy import input | Used only as source-backed display/name-order evidence for hard identity join gaps; not used to invent club, minutes, starts, or roles. |
| data/mappings/playerIdentityMap_v1.csv | internal_player_id, official_fantasy_player_id, matched_existing_player_id, match_status, official_fantasy_position, data_quality_flags | Yes, as the bridge to existing internal club context. | Yes, as the bridge to existing usage context. | Carries position conflict flags only. | official-data preparation | Does not contain club minutes or usage values itself. |
| data/players.json | player_id, name, country, team_id, position, club, league, roster_status, source_urls, data_quality, match_keys | Yes, current club and some league fields. | Limited senior caps and roster context only. | No model role confidence; roster status only. | supporting context/prototype roster | Not final official squads; 191 current player rows lack club and most league fields are null. |
| data/playerRecommendationInputs_v0.json | best_available_club_performance_v0, national_team_usage_v0, data_confidence_v0, roster_context | Yes, consolidated club performance and field source details. | Yes, consolidated national qualifier usage. | Yes, data confidence and recommendation tier caveats. | supporting context/prototype model input | Derived prototype input; not a fresh official-data model. |
| data/playerNationalTeamPerformance.json | national_team_profile, best_available_qualifier_stats_v0, country_role_signal, qualifier starts/minutes/goals/cards | No, except copied roster club. | Yes, primary source for national-team/qualifier usage. | Yes, country_role_signal and data-quality caveats. | supporting context | OneFootball minutes are estimated from lineups/substitution clocks; some players have no matched qualifier rows. |
| data/imports/targetedNationalTeamUsage.csv | official_fantasy_player_id, internal_player_id, source_type, source_url, source_checked, evidence_window, recent_nt_starts, recent_nt_minutes, qualifier_starts, qualifier_minutes, role_evidence, usage_confidence | No club context. | Yes, targeted national-team usage or role evidence for high-impact low-confidence players. | Yes, when source-backed role_evidence is present with a source URL and checked date. | supporting context/targeted manual import | Only source-backed rows with high/medium/low confidence can fill missing usage. Rows marked missing_source_gap are documentation only and do not invent starts, minutes, or role. |
| data/playerPerformance.json | club, league, minutes, starts, goals, assists, clean_sheets, set_pieces, source_files | Yes, club performance source. | Limited embedded national context only; not primary for usage. | Club starts/minutes can support role confidence. | supporting context | Mostly Big 5/available league coverage; many rows lack starts or clean sheets. |
| data/playerMinutesModel_v0.json | country_role, role_confidence, start_probability_v0, expected_minutes_v0, model_inputs_v0, data_quality | Supports club minutes/starter context when source-backed in model_inputs_v0. | Supports national minutes/starter context when source-backed in model_inputs_v0. | Yes, controlled prototype role and confidence. | prototype model output used as audit context | Not rerun here; used only to carry existing role labels/confidence. |
| data/oneFootballAllRosterMatches.json | roster_player_id, roster_club, competition_name, competition_country, appearances, starts, minutes, goals, assists | Yes, supplemental club performance/minutes. | No national-team usage. | Starts/minutes support role confidence. | supporting context | Minutes are estimated from lineups/substitution clocks; not official fantasy data. |
| data/oneFootballQualifierRosterSeasonStats.json | roster_player_id, appearances, starts, minutes, goals, assists, cards, clean_sheet_appearances | No. | Yes, qualifier season totals. | Starts/minutes support role labels. | supporting context | Supplemental public match-page data with estimated minutes. |
| data/oneFootballQualifierRosterMatchStats.json | roster_player_id, kickoff, starter, minutes, goals, assists, cards | No. | Yes, match-level qualifier evidence and last start date. | Lineup starter flags support role evidence. | supporting context | Estimated minutes; used only for last_nt_start_date and audit context. |
| data/espnSummaryMatchedSeasonStats.json | roster_player_id, roster_player_name, roster_club, league_name, match_count, minutes, starts, appearances, goals, assists | Yes, supplemental club season stats; also already represented through consolidated recommendation inputs. | No World Cup qualifier or national-team usage. | Club minutes and starts can support role context when consolidated upstream. | supporting context | Club-season source only; not a national-team usage source. |
| data/espnRosterLeaderboardMatches.json | player_id, player_name, espn_league_name, espn_table, espn_team_name, row.appearances, row.totalGoals | Yes, sparse leaderboard support for club competitions such as FIFA Club World Cup. | Limited historical/non-qualifier national-team leaderboard evidence where team is a country, but no minutes, starts, or qualifier usage. | No minutes or role confidence. | supporting context/audit only | Leaderboard rows are not complete player usage rows and should not fill qualifier minutes, starts, or role labels. |
| data/playerFinanceMetrics_v0.json | club, league, source_status, input_features_v0, finance_metrics_v0, labels | Secondary only; derived from other sources. | Secondary only; derived from other sources. | Contains derived source_status and input_features. | prototype finance model output | Uses proxy prices and should not drive official-data model reruns. |
| data/playerValueModel_v1.json | official_price, proxy_price_v1, model_inputs_v0 | No direct club context. | No direct usage context. | Derived role context only. | prototype value model output | Proxy-price model; inspected but not used as active enrichment source. |
| players.json | legacy/browser player sample fields, club, minutes, starts, FPL/FBref fields | Not used for official pool enrichment. | No World Cup national-team usage. | Legacy club minutes only. | prototype/legacy | Only 100 legacy rows and not keyed to official World Cup identity map. |
| financePlayersData.js | browser-ready finance player data generated from v0/v1 model files | Derived copy only. | Derived copy only. | Derived copy only. | browser-ready derivative | Inspected but not used; source JSON files are preferred. |
| playersData.js | browser-ready legacy players | Derived copy only. | No official pool usage. | Derived copy only. | browser-ready derivative | Inspected but not used; not official-pool keyed. |
| matchdayProjectionsData.js | browser-ready projection rows | No primary club context. | No primary usage context. | Derived projection context. | browser-ready derivative | Inspected but not used because this session does not rerun or depend on projections. |
| scorePredictionsData.js | browser-ready fixture score predictions | No player club context. | No player usage context. | No player role context. | browser-ready derivative | Inspected but not used for player enrichment. |
| data/espnDetailedRosterPlayerStats.json | leagues_imported, matches, completed_events | Potential club performance source through prior consolidated files. | No national-team usage. | Potential minutes/source support. | supporting context | Nested raw detail; this pass uses consolidated recommendation/player-performance fields instead. |
| data/espnExpandedMatchedPlayerStats.json | rows | No rows currently available. | No rows currently available. | No rows currently available. | supporting context | Empty rows array in current repo. |

## Use In This Session

- Primary bridge: `data/mappings/playerIdentityMap_v1.csv`.
- Club context priority: official fantasy club field if present, then existing consolidated club performance, raw player performance, OneFootball club stats, and finally existing roster club fields.
- National-team usage priority: existing national-team performance and OneFootball qualifier totals, with match-level qualifier rows used for last known start date.
- Existing `data/playerMinutesModel_v0.json` role labels and confidence were carried as audit context only. The minutes model was not rerun.
- Browser-ready files were inspected as derivatives and were not used as primary enrichment sources.
