# Live Matchday Status Report v1

Generated: 2026-07-03T20:38:04.792Z

Status: static live/post-match support import. Model predictions, PELE data, recommendations, projections, finance metrics, Team Builder weights, and website formulas were not rerun by this script.

## Sources

- fifaFantasyPlayersJson: ok, last modified 2026-07-03T20:37:04Z
- fifaFantasySquadsJson: ok, last modified 2026-07-03T07:59:04Z
- fifaFantasyRoundsJson: ok, last modified 2026-07-03T20:37:03Z

Fetch failures: 0

## Round And Fixture Status

Rounds imported: 8
Fixtures imported: 94
Group-stage fixtures mapped locally: 72
R32 fixtures mapped locally: 16
R16 fixtures mapped locally: 6
Fixtures with score fields populated: 85
Completed/played fixtures: 85
Playing fixtures: 1
Scheduled fixtures: 8
In-progress fixture scores hidden until final: 1
Safe final scores shown: 85
Unmatched live fixtures: 0
Ambiguous live fixtures: 0
Reversed mappings handled: 0

Mapping status counts:

- matched: 94

Mapping orientation counts:

- direct: 94

Round status counts:

- complete: 3
- playing: 1
- scheduled: 4

Fixture status counts:

- complete: 85
- playing: 1
- scheduled: 8

## Player Live Fields

Players imported: 1489
Players with total points: 1016
Players with last-round points: 1016
Players with round-points maps: 1016
Players with unfinished-fixture points suppressed: 33
Ownership changes >= 0.1 percentage points: 0

Player status counts:

- eliminated: 864
- injured: 1
- playing: 491
- suspended: 2
- transferred: 131

matchStatus counts:

- none: 618
- not_in_squad: 161
- start: 308
- sub: 402

## Material Change Check

Update recommendation: `manual_review_needed`
Secondary recommendations: none
Model rerun needed now: no
Score prediction rerun needed now: no

Reasons:

- 161 players are marked not_in_squad; review before changing projections

Material change summary:

None

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
