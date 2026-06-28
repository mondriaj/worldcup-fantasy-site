# Official Fantasy Players Live Collection v1

Generated: 2026-06-28T11:17:50.424Z

## Sources

- Players: https://play.fifa.com/json/fantasy/players.json (200, Last-Modified Sun, 28 Jun 2026 11:04:23 GMT)
- Squads: https://play.fifa.com/json/fantasy/squads.json (200, Last-Modified Sun, 28 Jun 2026 04:37:18 GMT)

## Output

- Import file: data/imports/officialFantasyPlayers_live_v1.json
- Player rows: 1489
- Selectable-status counts: {"playing":828,"transferred":175,"suspended":4,"injured":1,"eliminated":481}
- Position counts: {"DEF":486,"FWD":307,"MID":515,"GK":181}

## Safeguards

- This script snapshots the official FIFA fantasy feed into the existing local import schema.
- It does not claim final-squad confirmation; selectable status remains the official fantasy status only.
- Runtime site code is not changed and no browser fetch is introduced.
