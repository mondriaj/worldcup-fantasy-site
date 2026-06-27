# Official Fantasy Players Live Collection v1

Generated: 2026-06-27T16:45:49.890Z

## Sources

- Players: https://play.fifa.com/json/fantasy/players.json (200, Last-Modified Sat, 27 Jun 2026 16:45:03 GMT)
- Squads: https://play.fifa.com/json/fantasy/squads.json (200, Last-Modified Sat, 27 Jun 2026 06:09:15 GMT)

## Output

- Import file: data/imports/officialFantasyPlayers_live_v1.json
- Player rows: 1489
- Selectable-status counts: {"playing":984,"transferred":196,"suspended":4,"injured":1,"eliminated":304}
- Position counts: {"DEF":486,"FWD":307,"MID":515,"GK":181}

## Safeguards

- This script snapshots the official FIFA fantasy feed into the existing local import schema.
- It does not claim final-squad confirmation; selectable status remains the official fantasy status only.
- Runtime site code is not changed and no browser fetch is introduced.
