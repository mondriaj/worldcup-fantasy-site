# Live Matchday Status Report v1

Generated: 2026-06-12T12:56:49.105Z

Status: static live/post-match support import. Model predictions, PELE data, recommendations, projections, finance metrics, Team Builder weights, and website formulas were not rerun by this script.

## Sources

- fifaFantasyPlayersJson: ok, last modified 2026-06-12T12:04:20Z
- fifaFantasySquadsJson: ok, last modified 2026-05-13T10:08:23Z
- fifaFantasyRoundsJson: ok, last modified 2026-06-12T10:01:03Z

Fetch failures: 0

## Round And Fixture Status

Rounds imported: 8
Fixtures imported: 72
Group-stage fixtures mapped locally: 72
Fixtures with score fields populated: 2
Completed/played fixtures: 2
Playing fixtures: 0
Scheduled fixtures: 70

Round status counts:

- playing: 1
- scheduled: 7

Fixture status counts:

- complete: 2
- scheduled: 70

## Player Live Fields

Players imported: 1487
Players with total points: 1487
Players with last-round points: 1487
Players with round-points maps: 62
Ownership changes >= 0.1 percentage points: 451

Player status counts:

- playing: 1247
- transferred: 240

matchStatus counts:

- none: 1348
- not_in_squad: 35
- start: 44
- sub: 60

## Material Change Check

Update recommendation: `official_player_import_needed`
Secondary recommendations: `projection_rebuild_needed`, `recommendation_rerun_needed`
Model rerun needed now: no
Score prediction rerun needed now: no

Reasons:

- player pool/status/price/position/team fields changed compared with local official import

Material change summary:

- New players: 5, first sample Éderson José dos Santos Lourenço da Silva
- Selectable status changes: 9, first sample Marcos Senesi

## Validation

Validation status: passed

Warnings:

None

Errors:

None

## Unavailable Fields

The current live import does not provide source-backed injury, doubtful, risk, suspended, unavailable-reason, chance-of-playing, actual player minutes, official user locks, official substitutions, captain changes, booster state, or user-specific legality.

`matchStatus` is lineup/status context from the official fantasy player feed. Fixture `minutes` and `extra_minutes` are match-clock fields and are not player minutes.

## Daily Update Decision Rules

- Fixture score/status only: `display_only_refresh`.
- Actual fantasy points only: `display_only_refresh`.
- Ownership only: `display_only_refresh`.
- matchStatus only: `display_only_refresh`, unless many important players need manual review.
- Player pool, selectable status, price, position, or team changes: `official_player_import_needed` with projection/recommendation review.
- Rules or scoring changes: run the official monitor and treat as `manual_review_needed`.
