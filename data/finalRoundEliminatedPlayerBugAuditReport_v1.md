# Final Round Eliminated Player Bug Audit v1

Status: pass

## Root Cause

- script.js built Team Builder players from the full official fantasy pool.
- currentFantasyPoolPlayerFromOfficialRecord accepted any historical projection row as sufficient context when a finalRound projection was missing.
- renderPlayerPicker, optimizerCandidatePools, availableFillCandidates, getValidLockedSquadPlayers, and optimizerPriceFloorsByPosition did not enforce Final Round fixture-authority team eligibility.
- countryLimitForMatchday did not map finalRound to the official knockout final limit, so it fell back to the group-stage max of 3 per country.

## Why Previous QA Missed It

- data/teamBuilderQa_finalRound_v1.json was generated from already-filtered Final Round projection rows, not the actual browser Team Builder candidate pool.
- scripts/runPublicPreviewBrowserQa.mjs checked that a squad rendered but did not assert that selected players and picker candidates belonged only to Final/Third Place teams.
- Historical projection rows in public wrappers were allowed for history views, but the browser did not require active finalRound rows before using them as Team Builder context.

## Player Status After Fix

| Player | Active projections | Active recs | Team Builder selected | Historical projection rows allowed | Finance rows not active |
| --- | --- | --- | --- | --- | --- |
| Lerma | absent | absent | absent | 2 | 1 |
| Raphinha | absent | absent | absent | 2 | 1 |
| Vinicius | absent | absent | absent | 2 | 1 |

## Affected Before Fix

| Surface | Affected |
| --- | --- |
| team_builder_squad | yes |
| team_builder_candidates | yes |
| player_profile_from_team_builder_candidates | yes |
| picks | no |
| captain_watchlist | no |
| final_round_projection_source_rows | no |
| final_round_recommendation_source_rows | no |
