# Live Matchday Status Report v1

Generated: 2026-06-28T02:12:18.935Z

Status: static live/post-match support import. Model predictions, PELE data, recommendations, projections, finance metrics, Team Builder weights, and website formulas were not rerun by this script.

## Sources

- fifaFantasyPlayersJson: ok, last modified 2026-06-28T02:04:22Z
- fifaFantasySquadsJson: ok, last modified 2026-06-27T06:09:15Z
- fifaFantasyRoundsJson: ok, last modified 2026-06-28T02:11:04Z

Fetch failures: 0

## Round And Fixture Status

Rounds imported: 8
Fixtures imported: 86
Group-stage fixtures mapped locally: 72
Fixtures with score fields populated: 70
Completed/played fixtures: 70
Playing fixtures: 2
Scheduled fixtures: 14
In-progress fixture scores hidden until final: 2
Safe final scores shown: 70
Unmatched live fixtures: 14
Ambiguous live fixtures: 0
Reversed mappings handled: 0

Mapping status counts:

- matched: 72
- unmatched: 14

Mapping orientation counts:

- direct: 72
- unknown: 14

Round status counts:

- complete: 2
- playing: 1
- scheduled: 5

Fixture status counts:

- complete: 70
- playing: 2
- scheduled: 14

## Player Live Fields

Players imported: 1489
Players with total points: 988
Players with last-round points: 988
Players with round-points maps: 988
Players with unfinished-fixture points suppressed: 44
Ownership changes >= 0.1 percentage points: 136

Player status counts:

- eliminated: 304
- injured: 1
- playing: 984
- suspended: 4
- transferred: 196

matchStatus counts:

- none: 1
- not_in_squad: 269
- start: 528
- sub: 691

## Material Change Check

Update recommendation: `manual_review_needed`
Secondary recommendations: none
Model rerun needed now: no
Score prediction rerun needed now: no

Reasons:

- 269 players are marked not_in_squad; review before changing projections

Material change summary:

None

## Validation

Validation status: passed_with_warnings

Warnings:

- 14 group-stage live fixtures did not map to local fixtures

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
