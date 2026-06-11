# Daily Matchday Update Audit v1

Date: 2026-06-11

Status: audit only. No public browser data, model output, score prediction, Team Builder logic, UI, analytics, or domain metadata was changed.

## Sources Checked

- `https://play.fifa.com/json/fantasy/players.json`
- `https://play.fifa.com/json/fantasy/squads.json`
- `https://play.fifa.com/json/fantasy/rounds.json`
- `https://play.fifa.com/json/fantasy/help_pages.json`
- `https://play.fifa.com/json/langs/fantasy/en.json`
- `scripts/checkOfficialFantasyDataUpdates.mjs`
- `scripts/importOfficialFantasyPlayers.mjs`
- `scripts/buildFantasyPoolPreviewBrowserData.mjs`
- `data/fixtures.json`
- `worldCupData.js`
- `fantasyRules.json`
- `fantasyRulesData.js`
- `fantasyPoolOfficialDataStatusData.js`
- `fantasyPoolMatchdayProjectionsData.js`
- `fantasyPoolRecommendationsData.js`
- `fantasyPoolFinanceMetricsData.js`

The official data monitor was run with its normal output paths redirected to `/tmp` so this audit did not overwrite generated repo data. Current monitor result at `2026-06-11T19:29:34Z`: `completed`, with `rerun_decision: full_model_rerun_recommended`, `fetch_failures: 0`, 3 new fantasy players, 7 selectable-status changes, 357 ownership-percent changes, and MD1 round status changed from `scheduled` to `playing`.

## Available Live/Post-Match Fields

### Official fantasy players feed

Source: `players.json` from FIFA Play, monitored by `scripts/checkOfficialFantasyDataUpdates.mjs`.

Observed player fields:

- `id`
- `firstName`
- `lastName`
- `knownName`
- `squadId`
- `position`
- `price`
- `status`
- `matchStatus`
- `percentSelected`
- `roundsSelected`
- `stats.totalPoints`
- `stats.avgPoints`
- `stats.form`
- `stats.lastRoundPoints`
- `stats.roundPoints`
- `stats.nextFixtureFromActiveRound`
- `stats.nextFixtureFromScheduledRound`
- `oneToWatch`
- `oneToWatchText`
- `qualificationRoundIds`
- `fifaId`

Useful live/post-match meanings:

- `status`: current fantasy-pool selectable status, currently values such as `playing` and `transferred`.
- `matchStatus`: live squad/match involvement status when available, currently observed as `start`, `sub`, `not_in_squad`, or null.
- `percentSelected`: ownership percentage.
- `roundsSelected`: ownership percentage by round, currently keyed by round ID.
- `stats.totalPoints`: actual fantasy points total in the FIFA feed.
- `stats.lastRoundPoints`: latest round fantasy points.
- `stats.roundPoints`: actual fantasy points by round when populated; during the live MD1 opener, started players had values such as `{ "1": 1 }`.
- `stats.nextFixtureFromActiveRound` and `stats.nextFixtureFromScheduledRound`: fixture IDs that can help infer whether a player still has an active or scheduled fixture, but they are not a complete official played/unplayed lock flag.
- `oneToWatch` and `oneToWatchText`: editorial/promotional flag, not an availability or injury field.

### Official rounds feed

Source: `rounds.json` from FIFA Play, monitored by `scripts/checkOfficialFantasyDataUpdates.mjs`.

Observed round fields:

- `id`
- `status`
- `startDate`
- `endDate`
- `stage`
- `tournaments`

Observed tournament fixture fields inside `rounds[].tournaments[]`:

- `id`
- `period`
- `minutes`
- `extraMinutes`
- `date`
- `status`
- `isSuspended`
- `homeSquadId`
- `awaySquadId`
- `homeSquadName`
- `awaySquadName`
- `homeSquadAbbr`
- `awaySquadAbbr`
- `homeScore`
- `awayScore`
- `homePenaltyScore`
- `awayPenaltyScore`
- `homeGoalScorersAssists`
- `awayGoalScorersAssists`
- `venueId`
- `venueName`
- `venueCity`

Useful live/post-match meanings:

- `round.status`: round state, currently MD1 moved to `playing`.
- `tournaments[].status`: fixture state such as `scheduled` or `playing`.
- `tournaments[].period`: match period, currently observed as `first_half` and `pre_match`.
- `tournaments[].minutes` and `extraMinutes`: match clock, not player minutes.
- `tournaments[].homeScore` and `awayScore`: actual fixture score.
- `tournaments[].homeGoalScorersAssists` and `awayGoalScorersAssists`: scorer and assist player IDs when available.
- `tournaments[].isSuspended`: match suspension flag, not player suspension.

### Official squads feed

Source: `squads.json` from FIFA Play.

Observed squad fields:

- `id`
- `name`
- `abbr`
- `group`
- `isEliminated`

This is useful for team metadata and elimination state, but it does not prove final squad membership.

## Unavailable Or Not Reliable Fields

The current official fantasy player feed does not expose clear player-level fields for:

- injury status
- injury risk
- doubtful status
- suspended status
- unavailable reason
- chance of playing
- expected minutes
- actual player minutes played
- detailed live fantasy scoring breakdown by action
- official captain/vice lock state for a user's squad
- user-specific played/unplayed/substitution legality

The import script has optional columns and aliases for `availability_status` and `injury_status`, but the current live feed does not provide a separate injury/risk field. In the current local import, `availability_status` mirrors `status`, and `injury_status` is empty for all rows.

## Current Local Site Storage

- `data/fixtures.json` already has `result_status`, `home_score`, and `away_score` fields for all 72 group-stage fixtures, but all rows are currently `result_status: scheduled` with null scores.
- `worldCupData.js` stores group-stage fixtures for the public World Cup page, but it does not currently store actual scores.
- The site does not currently update group tables from actual scores. `worldCupPage.js` renders group membership and fixtures by group; it does not calculate standings.
- `fantasyPoolOfficialDataStatusData.js` stores official fantasy status, unavailable player IDs, and public warning copy, but not live points or live fixture scores.
- `fantasyPoolMatchdayProjectionsData.js`, `fantasyPoolRecommendationsData.js`, and `fantasyPoolFinanceMetricsData.js` store model projections/recommendations/finance metrics, not actual post-match outcomes.

## Existing Scripts And What They Can Import

- `scripts/checkOfficialFantasyDataUpdates.mjs`
  - Fetches live players, squads, help pages, rounds, and language JSON.
  - Compares player name, price, position, selectable status, country/team, FIFA player ID, and ownership percent.
  - Compares squad metadata and round/deadline status.
  - Audits source field paths.
  - Does not import player stats, live points, match scores, starting lineup state, or fixture results into public browser data.

- `scripts/importOfficialFantasyPlayers.mjs`
  - Imports official player ID, name, country, team ID, position, price, selectable status, source URL, source checked date, FIFA player ID, shirt number, club, availability status, injury status, ownership percent, and selected-by percent from local CSV/JSON input.
  - Can preserve `availability_status` and `injury_status` if a future source provides them.
  - Does not currently import `matchStatus`, `stats.totalPoints`, `stats.roundPoints`, or live fixture scores.

- `scripts/buildFantasyPoolPreviewBrowserData.mjs`
  - Regenerates `fantasyPoolRecommendationsData.js`, `fantasyPoolMatchdayProjectionsData.js`, `fantasyPoolFinanceMetricsData.js`, `fantasyPoolScorePredictionsData.js`, and `fantasyPoolOfficialDataStatusData.js`.
  - With `--status-only`, regenerates only `fantasyPoolOfficialDataStatusData.js`.
  - It currently reads local model/source JSON files. It does not fetch live FIFA data itself.

There is not yet a dedicated importer for `rounds.json` fixture scores, player live points, or player `matchStatus`.

## Browser Files For Daily Updates

Existing browser files that would need regeneration after supported source refreshes:

- `fantasyPoolOfficialDataStatusData.js`
  - Regenerate after official player status/player pool/rules/readiness updates.
  - Can be regenerated alone with `scripts/buildFantasyPoolPreviewBrowserData.mjs --status-only`.

- `fantasyPoolMatchdayProjectionsData.js`
  - Regenerate after player projections are rebuilt because player availability, roles, minutes assumptions, scoring, or score context changed.

- `fantasyPoolRecommendationsData.js`
  - Regenerate after recommendation candidates are rebuilt, or after source data is re-exported for internal consistency.

- `fantasyPoolFinanceMetricsData.js`
  - Regenerate after finance/value metrics are rebuilt because prices, projections, scoring, or player pool changed.

- `fantasyPoolScorePredictionsData.js`
  - Regenerate after score predictions are rebuilt.

Potential future browser data that does not exist yet:

- a lightweight live matchday status bundle for `rounds.json` fixture scores/status/minutes
- a lightweight live player points/status bundle for `stats.*` and `matchStatus`

Those should be separate from projection/recommendation data so ownership-only or score-only updates do not force model reruns.

## Recommended Daily Update Routine During Matchday 1

1. Run the official data monitor.
2. Capture live `players.json` and `rounds.json` field deltas for review.
3. If only ownership fields changed (`percentSelected`, `roundsSelected`), do not rerun models.
4. If `round.status` or `tournaments[].status/minutes/score` changed, record fixture status and actual scores in a dedicated live/post-match data path. Do not rerun recommendations for score-only live updates.
5. If new players, removed players, `status`, price, position, team, or FIFA ID changed, run the official fantasy player import path and review identity coverage.
6. If `matchStatus` is available, treat it as lineup/status context for the current fixture only. Do not treat it as a full expected-minutes model.
7. If actual fantasy points (`stats.totalPoints`, `stats.lastRoundPoints`, `stats.roundPoints`) are needed for Matchday Desk decisions, expose them through a lightweight live points/status file rather than rebuilding projections.
8. Regenerate `fantasyPoolOfficialDataStatusData.js` when official status/player pool/rules/readiness data changes.
9. Regenerate projection, recommendation, and finance browser files only after their source model files are intentionally rebuilt.
10. Keep captain switches, substitutions, played/unplayed legality, locks, boosters, and user-specific official-game legality as manual confirmation inside FIFA.

## Recommended Full Refresh Routine After Matchday 1

1. Run the official data monitor after all MD1 fixtures are complete.
2. Import official fantasy players if player pool, status, price, position, or team fields changed.
3. Record actual MD1 fixture scores and final fixture statuses from `rounds.json`.
4. Record actual player round points from `stats.roundPoints`, `stats.lastRoundPoints`, and `stats.totalPoints`.
5. Review whether any `matchStatus`, not-in-squad pattern, injury/news source, or player status change should update role/minutes assumptions.
6. Rebuild matchday projections if availability, roles, scoring, player pool, or score context changed.
7. Rebuild finance metrics if prices, projections, scoring, or player pool changed.
8. Rebuild recommendations if projections, finance metrics, player pool, selectable status, scoring, or major role assumptions changed.
9. Rerun Team Builder data coverage and browser QA after any projection/recommendation/finance refresh.
10. Rerun future score predictions after full MD1 only if the score model is intentionally extended to consume actual results/form, or if there is a major team/player shock that materially changes team context before full MD1 is complete.

## Rerun Triggers

### Recommendation rerun triggers

- player added or removed
- `status` or selectable status changed for modeled/recommended players
- price changed
- position changed
- scoring rules changed
- player pool/team mapping changed
- source-backed injury, suspension, availability, role, or minutes signal becomes available
- projections or finance metrics were rebuilt
- actual round points are intentionally incorporated into a revised recommendation model

Ownership-only changes do not require recommendation reruns.

### Score prediction rerun triggers

- PELE data changed
- team-quality source changed
- score model formula changed
- source-backed final squads, injuries, suspensions, or major player availability changes materially alter team strength
- after full MD1, if actual results/form are intentionally added as a score-model input

Live score-only updates during MD1 should be recorded, but should not automatically rerun future score predictions unless there is a major team/player shock.

### Team Builder refresh triggers

- official player pool changed
- `status` or selectable status changed
- price changed
- position changed
- squad limits, country limits, transfer rules, or scoring changed
- projections, recommendations, or finance metrics were rebuilt
- unavailable players need to be removed from builder candidate pools

### Browser data refresh only

- ownership-only changes, if ownership is displayed
- round/fixture status and actual scores, if a lightweight live status bundle is added
- actual fantasy points, if a lightweight live points bundle is added
- official status warning copy/readiness update

## Manual Confirmation Fields

These should remain manual checks inside the official FIFA game unless a verified user-specific official feed is added:

- captain and vice-captain eligibility
- captain-change locks and exact switch legality
- substitution locks and exact substitution legality
- played/unplayed state for a user's squad
- user-specific lineup legality and formation legality after substitutions
- booster activation and eligibility
- live deadlines and lock timing
- official final fantasy-game legality before saving

## Direct Answers

1. Injury/risk/doubtful/suspended/unavailable/chance fields: no clear player-level injury/risk/chance fields in the live feed. `status` and `matchStatus` exist, and tournament `isSuspended` exists for matches, not player suspension.
2. Actual fantasy points after matches: yes, through player `stats.totalPoints`, `stats.lastRoundPoints`, and `stats.roundPoints`.
3. Played/unplayed state: partial. Fixture state is available in `rounds[].tournaments[].status/period/minutes`; player state is partially available through `matchStatus` and point/fixture fields. There is no complete user-specific played/unplayed legality field.
4. Ownership changes only or other live fields: more than ownership is available. The feed also exposes player price/status/position/player-pool fields, player points, player match status, round status, fixture status, clock, score, and scorer/assist IDs.
5. Starting lineup or minutes data: starting/sub/not-in-squad state is exposed through `matchStatus` when available. Player minutes are not exposed; only match clock minutes are exposed in `rounds[].tournaments[].minutes`.
6. Actual fixture scores stored locally: `data/fixtures.json` has `home_score`, `away_score`, and `result_status`, but all are currently null/scheduled.
7. Group tables from actual scores: no. Current World Cup page renders group lists and fixtures, not live standings.
8. Existing scripts that can import these fields: `importOfficialFantasyPlayers.mjs` can import official player pool fields and optional availability/injury fields if supplied, but not live points or fixture scores. `checkOfficialFantasyDataUpdates.mjs` can monitor live fields. No script currently imports live points or actual fixture scores.
9. Existing browser files needing regeneration: `fantasyPoolOfficialDataStatusData.js` for official status; `fantasyPoolMatchdayProjectionsData.js`, `fantasyPoolRecommendationsData.js`, and `fantasyPoolFinanceMetricsData.js` after model refreshes; `fantasyPoolScorePredictionsData.js` after score model refreshes. A new lightweight live status/points bundle is recommended for daily score/points updates.
10. Full model rerun vs browser refresh: ownership-only and score/points display updates should be browser-data refresh only. Player pool, price, position, selectable status, scoring, source-backed injury/risk/role, PELE, or team-strength changes may require imports plus projection/recommendation/finance/score reruns depending on affected fields.
