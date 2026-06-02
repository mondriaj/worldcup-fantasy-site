# Official Fantasy Players Collection Report v1

Generated: 2026-06-02

## Scope

This collection pass created the official fantasy player import input only. It did not rerun score predictions, matchday projections, recommendations, Team Builder logic, captain logic, substitution logic, browser-ready files, or website UX.

## Sources Used

| Source | URL | Checked | Last-Modified | Fields used |
| --- | --- | --- | --- | --- |
| FIFA Fantasy players JSON | `https://play.fifa.com/json/fantasy/players.json` | 2026-06-02 | Tue, 02 Jun 2026 11:22:40 GMT | `id`, `firstName`, `lastName`, `knownName`, `squadId`, `position`, `price`, `status`, `percentSelected`, `fifaId` |
| FIFA Fantasy squads JSON | `https://play.fifa.com/json/fantasy/squads.json` | 2026-06-02 | Wed, 13 May 2026 10:08:23 GMT | `id`, `name`, `abbr` |

The source endpoints were found from the public FIFA Fantasy app bundle referenced by `https://play.fifa.com/fantasy/team`. No non-public, authenticated, or inferred player data was used.

## Input Created

- `data/imports/officialFantasyPlayers.csv`
- Rows collected: 1,481
- Countries/squads represented: 48
- Source URL used on every row: `https://play.fifa.com/json/fantasy/players.json`
- Source checked value used on every row: `2026-06-02`

## Required Field Coverage

| Check | Count |
| --- | ---: |
| Players collected | 1,481 |
| Missing official fantasy IDs | 0 |
| Missing prices | 0 |
| Missing positions | 0 |
| Missing team IDs | 0 |
| Duplicate official fantasy IDs | 0 |
| Rows missing `source_url` | 0 |
| Rows missing `source_checked` | 0 |

## Distribution

| Field | Counts |
| --- | --- |
| Positions | `GK`: 181, `DEF`: 482, `MID`: 512, `FWD`: 306 |
| Selectable status | `playing`: 1,256, `transferred`: 225 |

## Optional Field Gaps

The official player JSON did not provide club, date of birth, shirt number, fantasy player profile URL, or FIFA player profile URL values in this collection pass. Those fields were left blank in the CSV. `fifaId` was present as a source field but null for all collected rows, so `fifa_player_id` remains blank.

## Validation Result

The CSV passed the pre-import validation checks:

- Required columns are present.
- Official fantasy player IDs are present and unique.
- Official prices parse as numbers.
- Official positions are valid `GK`, `DEF`, `MID`, or `FWD` values.
- Official `squadId` values are consistent with one country each from `squads.json`.
- Every row has `source_url`.
- Every row has `source_checked`.

## Unresolved Blockers

- Official final squads are not imported in this session.
- Official fantasy rules, scoring, transfers, boosters, captain rules, substitution rules, and deadlines are not imported in this session.
- Club and national-team usage enrichment remains needed for identity review/thin-profile handling.
- The project must remain blocked at the full official-data gate until readiness validation passes after all required official-data stages are complete.
