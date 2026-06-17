# Official Fantasy Round Status Refresh v1

Generated: 2026-06-17T22:44:51.851Z

## Source

- https://play.fifa.com/json/fantasy/rounds.json (200, Last-Modified Wed, 17 Jun 2026 22:01:03 GMT)

## Changes

| Matchday | Field | Before | After |
| --- | --- | --- | --- |
| 1 | round_status | scheduled | playing |
| 4 | stage | round_of_32 | r32 |
| 5 | stage | round_of_16 | r16 |
| 6 | stage | quarter_finals | qf |
| 7 | stage | semi_finals | sf |
| 8 | stage | final | f |

## Safeguards

- Only deadline/round status fields already present in the staged rules file were refreshed.
- This script does not infer lock semantics, booster rules, transfers, scoring, or final-squad status.
