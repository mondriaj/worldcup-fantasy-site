# Official Fantasy Round Status Refresh v1

Generated: 2026-07-03T20:19:53.192Z

## Source

- https://play.fifa.com/json/fantasy/rounds.json (200, Last-Modified Fri, 03 Jul 2026 20:19:04 GMT)

## Changes

| Matchday | Field | Before | After |
| --- | --- | --- | --- |
| 4 | round_status | scheduled | playing |

## Safeguards

- Only deadline/round status fields already present in the staged rules file were refreshed.
- This script does not infer lock semantics, booster rules, transfers, scoring, or final-squad status.
