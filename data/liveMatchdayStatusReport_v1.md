# Live Matchday Status Report v1

Generated: 2026-06-25T17:53:01.481Z

Status: static live/post-match support import. Model predictions, PELE data, recommendations, projections, finance metrics, Team Builder weights, and website formulas were not rerun by this script.

## Sources

- fifaFantasyPlayersJson: ok, last modified 2026-06-25T17:04:22Z
- fifaFantasySquadsJson: ok, last modified 2026-06-24T03:58:03Z
- fifaFantasyRoundsJson: ok, last modified 2026-06-25T15:01:02Z

Fetch failures: 0

## Round And Fixture Status

Rounds imported: 8
Fixtures imported: 73
Group-stage fixtures mapped locally: 72
Fixtures with score fields populated: 54
Completed/played fixtures: 54
Playing fixtures: 0
Scheduled fixtures: 19
In-progress fixture scores hidden until final: 0
Safe final scores shown: 54
Unmatched live fixtures: 1
Ambiguous live fixtures: 0
Reversed mappings handled: 0

Mapping status counts:

- matched: 72
- unmatched: 1

Mapping orientation counts:

- direct: 72
- unknown: 1

Round status counts:

- complete: 2
- playing: 1
- scheduled: 5

Fixture status counts:

- complete: 54
- scheduled: 19

## Player Live Fields

Players imported: 1489
Players with total points: 916
Players with last-round points: 916
Players with round-points maps: 916
Players with unfinished-fixture points suppressed: 0
Ownership changes >= 0.1 percentage points: 0

Player status counts:

- injured: 1
- playing: 1240
- suspended: 8
- transferred: 240

matchStatus counts:

- none: 1102
- not_in_squad: 85
- start: 132
- sub: 170

## Material Change Check

Update recommendation: `manual_review_needed`
Secondary recommendations: none
Model rerun needed now: no
Score prediction rerun needed now: no

Reasons:

- 85 players are marked not_in_squad; review before changing projections

Material change summary:

None

## Validation

Validation status: passed_with_warnings

Warnings:

- 1 group-stage live fixtures did not map to local fixtures

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
