# Live Matchday Update Model v1

Date: 2026-06-12

Purpose: provide a lightweight static update path for daily matchday support data without changing the fantasy projection, recommendation, finance, Team Builder, or score prediction models.

## Scope

The live matchday update imports official FIFA fantasy player and round feeds into separate static data files:

- `data/liveMatchdayStatus_v1.json`
- `data/livePlayerStatus_v1.json`
- `liveMatchdayStatusData.js`
- `livePlayerStatusData.js`

These files are display/support data. They do not replace model projections or modify recommendation ranking logic.

Scores and player points are exposed only for fixtures that FIFA marks final through `complete`, `completed`, or `played` status and that pass the local fixture mapping checks. In-progress fixture scores and player points are held back until final so the public site does not show provisional match totals.

## Available Fields

Player feed fields used:

- official fantasy player ID
- name
- squad/team ID and name
- fantasy position
- price
- selectable `status`
- `matchStatus`
- ownership through `percentSelected` and `roundsSelected`
- actual points through `stats.totalPoints`, `stats.lastRoundPoints`, and `stats.roundPoints`
- next fixture IDs through `stats.nextFixtureFromActiveRound` and `stats.nextFixtureFromScheduledRound`

Round feed fields used:

- round ID, status, stage, start date, and end date
- fixture ID, status, period, match clock, and extra minutes
- fixture date
- home/away squad IDs, names, and abbreviations
- home/away scores
- home/away penalty scores
- scorer/assist IDs when supplied
- venue ID, name, and city

Fixture `minutes` and `extra_minutes` are match-clock fields. They are not player minutes. FIFA fantasy fixture IDs are stored only as `source_fixture_id` / `source_fixture_order` audit metadata and are not treated as local match numbers. Live fixtures are mapped to local fixtures by fantasy round plus normalized home/away team pair before scores are displayed.

Each live fixture row stores the resolved local key and safety state:

- `resolved_local_fixture_key`
- `local_fixture_id` / `match_id`
- `match_number`
- `local_home_team` and `local_away_team`
- `live_home_team` and `live_away_team`
- `mapping_status`: `matched`, `matched_reversed`, `unmatched`, or `ambiguous`
- `mapping_orientation`: `direct`, `reversed`, or `unknown`
- `safe_to_display_score`

If a live fixture is reversed, local-orientation score fields are flipped before display. Public browser code looks up live scores by `resolved_local_fixture_key` / `local_fixture_id`, then rechecks the local home/away team pair before rendering. If a fixture is unmatched, ambiguous, not final, missing complete score values, or otherwise unsafe, public score and scorer fields stay empty.

## Not Available

The current feed does not provide source-backed player injury, doubtful, risk, unavailable-reason, chance-of-playing, actual player minutes, user locks, user substitutions, captain changes, boosters, or user-specific legality.

The player `status` field is preserved as selectable-status context when FIFA supplies values such as `playing`, `transferred`, or `suspended`. The feed does not provide a separate suspension reason, return date, or chance-of-playing field.

`matchStatus` is useful lineup/status context, but it is not a full minutes model and should not be treated as one.

## Update Decisions

The import script produces one conservative recommendation:

- `display_only_refresh` for fixture score/status changes, actual fantasy points, ownership-only changes, or normal `matchStatus` updates.
- `official_player_import_needed` when player pool, selectable status, price, position, or team fields changed versus the local official import.
- `projection_rebuild_needed` and `recommendation_rerun_needed` may be listed as secondary recommendations after material player changes, but this importer does not run those models.
- `score_prediction_rerun_needed` is reserved for explicit score-model input changes, PELE/team-strength changes, or an intentional post-match model refresh.
- `manual_review_needed` is used when validation fails, feed access fails, rules/scoring change outside this importer, or many important players need human review.

Ownership-only updates do not require model reruns.

## Public Site Use

The Matchday Desk may show current round status, actual points, and `matchStatus` where available. Captain switches, substitutions, boosters, official game locks, and legality remain manual confirmations inside FIFA.

The World Cup fixture page may show final scores and fixture status from the static live file only when the live row is safely mapped to the same local fixture/team pair. Group tables are not recalculated from actual scores in this version.

The Match Environment keeps model predictions visible. If a fixture has finished and passes mapping validation, the final score/status appears as separate actual context and does not replace the model prediction.
