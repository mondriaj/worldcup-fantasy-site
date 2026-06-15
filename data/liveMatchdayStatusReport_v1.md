# Live Matchday Status Report v1

Generated: 2026-06-15T23:11:02.079Z

Status: static live/post-match support import. Model predictions, PELE data, recommendations, projections, finance metrics, Team Builder weights, and website formulas were not rerun by this script.

## Sources

- fifaFantasyPlayersJson: ok, last modified 2026-06-15T23:10:04Z
- fifaFantasySquadsJson: ok, last modified 2026-05-13T10:08:23Z
- fifaFantasyRoundsJson: ok, last modified 2026-06-15T23:10:03Z

Fetch failures: 0

## Round And Fixture Status

Rounds imported: 8
Fixtures imported: 72
Group-stage fixtures mapped locally: 72
Fixtures with score fields populated: 14
Completed/played fixtures: 14
Playing fixtures: 1
Scheduled fixtures: 57
In-progress fixture scores hidden until final: 1
Safe final scores shown: 14
Unmatched live fixtures: 0
Ambiguous live fixtures: 0
Reversed mappings handled: 0

Mapping status counts:

- matched: 72

Mapping orientation counts:

- direct: 72

Round status counts:

- playing: 1
- scheduled: 7

Fixture status counts:

- complete: 14
- playing: 1
- scheduled: 57

## Player Live Fields

Players imported: 1487
Players with total points: 439
Players with last-round points: 439
Players with round-points maps: 439
Players with unfinished-fixture points suppressed: 23
Ownership changes >= 0.1 percentage points: 479

Player status counts:

- playing: 1245
- suspended: 3
- transferred: 239

matchStatus counts:

- none: 540
- not_in_squad: 172
- start: 330
- sub: 445

## Material Change Check

Update recommendation: `official_player_import_needed`
Secondary recommendations: `projection_rebuild_needed`, `recommendation_rerun_needed`
Model rerun needed now: no
Score prediction rerun needed now: no

Reasons:

- player pool/status/price/position/team fields changed compared with local official import

Material change summary:

- New players: 5, first sample Éderson José dos Santos Lourenço da Silva
- Selectable status changes: 13, first sample Marcos Senesi

## Validation

Validation status: passed

Warnings:

None

Errors:

None

## Unavailable Fields

The current live import does not provide source-backed injury, doubtful, risk, unavailable-reason, chance-of-playing, actual player minutes, official user locks, official substitutions, captain changes, booster state, or user-specific legality. The player `status` field is preserved as selectable-status context when FIFA supplies values such as playing, transferred, or suspended, but the feed does not provide separate suspension reason or return-date detail.

`matchStatus` is lineup/status context from the official fantasy player feed. Fixture `minutes` and `extra_minutes` are match-clock fields and are not player minutes.

## Daily Update Decision Rules

- Fixture score/status only: `display_only_refresh`.
- Actual fantasy points only: `display_only_refresh`.
- Ownership only: `display_only_refresh`.
- matchStatus only: `display_only_refresh`, unless many important players need manual review.
- Player pool, selectable status, price, position, or team changes: `official_player_import_needed` with projection/recommendation review.
- Rules or scoring changes: run the official monitor and treat as `manual_review_needed`.
