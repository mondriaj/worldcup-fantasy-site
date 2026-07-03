# Official Fantasy Players Live Collection v1

Generated: 2026-07-03T20:20:42.882Z

## Sources

- Players: https://play.fifa.com/json/fantasy/players.json (200, Last-Modified Fri, 03 Jul 2026 20:19:05 GMT)
- Squads: https://play.fifa.com/json/fantasy/squads.json (200, Last-Modified Fri, 03 Jul 2026 07:59:04 GMT)

## Output

- Import file: data/imports/officialFantasyPlayers_live_v1.json
- Player rows: 1489
- Selectable-status counts: {"eliminated":864,"playing":491,"transferred":131,"injured":1,"suspended":2}
- Position counts: {"DEF":486,"FWD":307,"MID":515,"GK":181}

## Safeguards

- This script snapshots the official FIFA fantasy feed into the existing local import schema.
- It does not claim final-squad confirmation; selectable status remains the official fantasy status only.
- Runtime site code is not changed and no browser fetch is introduced.
