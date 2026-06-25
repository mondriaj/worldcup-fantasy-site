# Official Fantasy Round Status Refresh v1

Generated: 2026-06-25T17:20:54.154Z

## Source

- https://play.fifa.com/json/fantasy/rounds.json (200, Last-Modified Thu, 25 Jun 2026 15:01:02 GMT)

## Changes

| Matchday | Field | Before | After |
| --- | --- | --- | --- |
| 3 | round_status | scheduled | playing |

## Safeguards

- Only deadline/round status fields already present in the staged rules file were refreshed.
- This script does not infer lock semantics, booster rules, transfers, scoring, or final-squad status.
