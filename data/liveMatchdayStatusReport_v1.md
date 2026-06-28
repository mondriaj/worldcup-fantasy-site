# Live Matchday Status Report v1

Generated: 2026-06-28T11:17:00.994Z

Status: static live/post-match support import. Model predictions, PELE data, recommendations, projections, finance metrics, Team Builder weights, and website formulas were not rerun by this script.

## Sources

- fifaFantasyPlayersJson: ok, last modified 2026-06-28T11:04:23Z
- fifaFantasySquadsJson: ok, last modified 2026-06-28T04:37:18Z
- fifaFantasyRoundsJson: ok, last modified 2026-06-28T10:01:02Z

Fetch failures: 0

## Round And Fixture Status

Rounds imported: 8
Fixtures imported: 88
Group-stage fixtures mapped locally: 72
Fixtures with score fields populated: 72
Completed/played fixtures: 72
Playing fixtures: 0
Scheduled fixtures: 16
In-progress fixture scores hidden until final: 0
Safe final scores shown: 72
Unmatched live fixtures: 16
Ambiguous live fixtures: 0
Reversed mappings handled: 0

Mapping status counts:

- matched: 72
- unmatched: 16

Mapping orientation counts:

- direct: 72
- unknown: 16

Round status counts:

- complete: 3
- scheduled: 5

Fixture status counts:

- complete: 72
- scheduled: 16

## Player Live Fields

Players imported: 1489
Players with total points: 999
Players with last-round points: 999
Players with round-points maps: 999
Players with unfinished-fixture points suppressed: 0
Ownership changes >= 0.1 percentage points: 334

Player status counts:

- eliminated: 481
- injured: 1
- playing: 828
- suspended: 4
- transferred: 175

matchStatus counts:

- none: 1489

## Material Change Check

Update recommendation: `official_player_import_needed`
Secondary recommendations: `projection_rebuild_needed`, `recommendation_rerun_needed`
Model rerun needed now: no
Score prediction rerun needed now: no

Reasons:

- player pool/status/price/position/team fields changed compared with local official import

Material change summary:

- Selectable status changes: 177, first sample Amir Mohammad Razzaghinia

## Validation

Validation status: passed_with_warnings

Warnings:

- 16 group-stage live fixtures did not map to local fixtures

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
