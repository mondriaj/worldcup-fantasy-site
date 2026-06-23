# Official Fantasy Players Live Collection v1

Generated: 2026-06-23T13:37:12.192Z

## Sources

- Players: https://play.fifa.com/json/fantasy/players.json (200, Last-Modified Tue, 23 Jun 2026 13:25:03 GMT)
- Squads: https://play.fifa.com/json/fantasy/squads.json (200, Last-Modified Thu, 18 Jun 2026 04:02:03 GMT)

## Output

- Import file: data/imports/officialFantasyPlayers_live_v1.json
- Player rows: 1488
- Selectable-status counts: {"playing":1239,"transferred":240,"suspended":8,"injured":1}
- Position counts: {"DEF":485,"FWD":307,"MID":515,"GK":181}

## Safeguards

- This script snapshots the official FIFA fantasy feed into the existing local import schema.
- It does not claim final-squad confirmation; selectable status remains the official fantasy status only.
- Runtime site code is not changed and no browser fetch is introduced.
