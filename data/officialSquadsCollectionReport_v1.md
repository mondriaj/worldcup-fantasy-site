# Official Squads Collection Report v1

Generated: 2026-06-02

## Scope

This report documents `data/imports/officialSquads.csv`. The import is source-backed by the official FIFA fantasy player pool and team metadata, but it does not claim that final 26-player World Cup squads are confirmed. No active model inputs, Team Builder logic, recommendation files, browser-ready files, or UX files were changed.

## Sources Used

| source_id | source_type | url | checked_at | fields used | confidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| fifaFantasyPlayersJson | official_fantasy_player_data | https://play.fifa.com/json/fantasy/players.json | 2026-06-02 | player name, country, team_id, official fantasy ID, official fantasy position, official price, fantasy status | official | Used to create player-level rows. Rows with fantasy status `playing` are marked `selectable_fantasy_player`, not `confirmed_final_squad`. |
| fifaFantasySquadsJson | official_squads | https://play.fifa.com/json/fantasy/squads.json | 2026-06-02 | team id, country/team name, group, abbreviation | official | Public FIFA Play team metadata only; it does not contain player-level final squads. |
| fifaSquadAnnouncementsHub | official_squads | https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/all-world-cup-squad-announcements | 2026-06-02 | checked for final squad availability | official_checked_not_imported | Direct page check did not provide parseable player-level final squad rows for this import, so no row is marked final from this source. |

## Import Classification

Official fantasy players with status `playing` are classified as `selectable_fantasy_player`. This means the player is present in the official fantasy pool, but final squad inclusion has not been independently confirmed by a complete final-squad source.

Official fantasy players with status other than `playing` are classified as `review`. In this import, those are the rows with fantasy status `transferred`. They are not marked `not_in_final_squad` because the fantasy status alone is not a final-squad exclusion source.

No team is marked `team_squad_complete=true`.

## Summary Counts

| Metric | Count |
| --- | ---: |
| Squad rows collected | 1481 |
| Countries covered | 48 |
| Confirmed final squad players | 0 |
| Fantasy-selectable-only players | 1256 |
| Confirmed provisional players | 0 |
| Review rows | 225 |
| Teams marked complete | 0 |
| Duplicate official fantasy IDs | 0 |
| Duplicate name-country groups | 1 |

## Players By Country

| Country | Team ID | Rows | Fantasy-selectable-only | Review |
| --- | ---: | ---: | ---: | ---: |
| Algeria | 1 | 33 | 27 | 6 |
| Argentina | 2 | 55 | 26 | 29 |
| Australia | 3 | 36 | 26 | 10 |
| Austria | 4 | 26 | 26 | 0 |
| Belgium | 5 | 26 | 26 | 0 |
| Bosnia and Herzegovina | 6 | 27 | 26 | 1 |
| Brazil | 7 | 26 | 26 | 0 |
| Cabo Verde | 8 | 26 | 26 | 0 |
| Canada | 9 | 32 | 26 | 6 |
| Colombia | 10 | 26 | 26 | 0 |
| Congo DR | 11 | 26 | 26 | 0 |
| Côte d'Ivoire | 12 | 27 | 26 | 1 |
| Croatia | 13 | 26 | 26 | 0 |
| Curaçao | 14 | 26 | 26 | 0 |
| Czechia | 15 | 29 | 26 | 3 |
| Ecuador | 16 | 36 | 26 | 10 |
| Egypt | 17 | 27 | 26 | 1 |
| England | 18 | 26 | 26 | 0 |
| France | 19 | 26 | 26 | 0 |
| Germany | 20 | 27 | 26 | 1 |
| Ghana | 21 | 29 | 26 | 3 |
| Haiti | 22 | 26 | 26 | 0 |
| IR Iran | 23 | 31 | 26 | 5 |
| Iraq | 24 | 34 | 26 | 8 |
| Japan | 25 | 27 | 26 | 1 |
| Jordan | 26 | 30 | 26 | 4 |
| Korea Republic | 27 | 27 | 26 | 1 |
| Mexico | 28 | 51 | 26 | 25 |
| Morocco | 29 | 46 | 26 | 20 |
| Netherlands | 30 | 34 | 26 | 8 |
| New Zealand | 31 | 26 | 26 | 0 |
| Norway | 32 | 26 | 26 | 0 |
| Panama | 33 | 32 | 27 | 5 |
| Paraguay | 34 | 55 | 26 | 29 |
| Portugal | 35 | 27 | 27 | 0 |
| Qatar | 36 | 35 | 26 | 9 |
| Saudi Arabia | 37 | 31 | 26 | 5 |
| Scotland | 38 | 27 | 26 | 1 |
| Senegal | 39 | 29 | 26 | 3 |
| South Africa | 40 | 32 | 26 | 6 |
| Spain | 41 | 26 | 26 | 0 |
| Sweden | 42 | 28 | 27 | 1 |
| Switzerland | 43 | 26 | 26 | 0 |
| Tunisia | 44 | 26 | 26 | 0 |
| Türkiye | 45 | 35 | 26 | 9 |
| Uruguay | 46 | 35 | 26 | 9 |
| USA | 47 | 31 | 26 | 5 |
| Uzbekistan | 48 | 30 | 30 | 0 |

## Duplicate Name-Country Rows

- Mexico / Jesús Angulo: 745 DEF review; 1475 MID review

Duplicate name-country rows are not merged. Distinct official fantasy IDs are preserved, and rows remain review where fantasy status is not `playing`.

## Countries With Incomplete Squad Status

All 48 countries are incomplete for final-squad purposes because no source-backed complete final squad list was imported and no row is marked `confirmed_final_squad`.

## Conflicts

- Final squad versus fantasy-selectable conflicts found: 0 evaluated conflicts. Final squad status is unavailable, so this import cannot compare confirmed final rows against fantasy-selectable rows yet.
- Fantasy status `transferred` rows requiring review: 225.

## Blockers Before Readiness

- Final official squads are still not imported.
- No team has a source-backed complete final squad.
- `confirmed_final_squad` rows: 0.
- `review` rows: 225.
- Official fantasy rules still have manual-review warnings for Mystery Booster effect and deadline semantics.
- Active model inputs still use proxy prices and have not merged official fantasy IDs, prices, positions, or squad status.

## Next Actions

1. Import source-backed final squad rows from FIFA team/squad pages, the FIFA tournament squad source, or official federation final squad announcements.
2. Mark `team_squad_complete=true` only for countries with a complete source-backed final squad.
3. Resolve `review` rows, especially fantasy status `transferred`, before any model input build.
4. Re-run `node scripts/importOfficialSquads.mjs` and `node scripts/validateOfficialDataReadiness.mjs`.
