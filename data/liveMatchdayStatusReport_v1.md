# Live Matchday Status Report v1

Generated: 2026-06-18T12:07:09.537Z

Status: static live/post-match support import. Model predictions, PELE data, recommendations, projections, finance metrics, Team Builder weights, and website formulas were not rerun by this script.

## Sources

- fifaFantasyPlayersJson: ok, last modified 2026-06-18T12:04:22Z
- fifaFantasySquadsJson: ok, last modified 2026-06-18T04:02:03Z
- fifaFantasyRoundsJson: ok, last modified 2026-06-18T10:01:03Z

Fetch failures: 0

## Round And Fixture Status

Rounds imported: 8
Fixtures imported: 72
Group-stage fixtures mapped locally: 72
Fixtures with score fields populated: 24
Completed/played fixtures: 24
Playing fixtures: 0
Scheduled fixtures: 48
In-progress fixture scores hidden until final: 0
Safe final scores shown: 24
Unmatched live fixtures: 0
Ambiguous live fixtures: 0
Reversed mappings handled: 0

Mapping status counts:

- matched: 72

Mapping orientation counts:

- direct: 72

Round status counts:

- complete: 1
- scheduled: 7

Fixture status counts:

- complete: 24
- scheduled: 48

## Player Live Fields

Players imported: 1488
Players with total points: 753
Players with last-round points: 753
Players with round-points maps: 753
Players with unfinished-fixture points suppressed: 0
Ownership changes >= 0.1 percentage points: 65

Player status counts:

- playing: 1245
- suspended: 3
- transferred: 240

matchStatus counts:

- none: 1488

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
