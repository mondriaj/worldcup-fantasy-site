# Live Matchday Status Report v1

Generated: 2026-07-04T13:07:06.995Z

Status: static live/post-match support import. Model predictions, PELE data, recommendations, projections, finance metrics, Team Builder weights, and website formulas were not rerun by this script.

## Sources

- fifaFantasyPlayersJson: ok, last modified 2026-07-04T13:04:23Z
- fifaFantasySquadsJson: ok, last modified 2026-07-04T03:33:04Z
- fifaFantasyRoundsJson: ok, last modified 2026-07-04T12:01:02Z

Fetch failures: 0

## Round And Fixture Status

Rounds imported: 8
Fixtures imported: 96
Group-stage fixtures mapped locally: 72
R32 fixtures mapped locally: 16
R16 fixtures mapped locally: 8
Fixtures with score fields populated: 88
Completed/played fixtures: 88
Playing fixtures: 0
Scheduled fixtures: 8
In-progress fixture scores hidden until final: 0
Safe final scores shown: 88
Unmatched live fixtures: 0
Ambiguous live fixtures: 0
Reversed mappings handled: 0

Mapping status counts:

- matched: 96

Mapping orientation counts:

- direct: 96

Round status counts:

- complete: 4
- scheduled: 4

Fixture status counts:

- complete: 88
- scheduled: 8

## Player Live Fields

Players imported: 1489
Players with total points: 1021
Players with last-round points: 1021
Players with round-points maps: 1021
Players with unfinished-fixture points suppressed: 0
Ownership changes >= 0.1 percentage points: 73

Player status counts:

- eliminated: 955
- injured: 1
- playing: 414
- suspended: 1
- transferred: 118

matchStatus counts:

- none: 1489

## Material Change Check

Update recommendation: `display_only_refresh`
Secondary recommendations: none
Model rerun needed now: no
Score prediction rerun needed now: no

Reasons:

- final fixture score/status changes are display/support data only
- final actual fantasy points are display/support data only
- ownership changes do not trigger model reruns

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
