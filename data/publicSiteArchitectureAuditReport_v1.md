# Public Site Architecture Audit v1

Generated: 2026-07-18T12:16:55.188Z

Status: **pass**

## Active Public Load

- Active data version in `script.js`: `20260718-final-round`
- Active default stage: `finalRound`
- Pages audited: index.html, world-cup.html

## Script Load Order

- index.html: 1. `https://www.googletagmanager.com/gtag/js?id=G-MSZET05H11`
- index.html: 2. `playersData.js?v=20260718-final-round`
- index.html: 3. `fantasyRulesData.js?v=20260718-final-round`
- index.html: 4. `fantasyPoolRecommendationsData.js?v=20260718-final-round`
- index.html: 5. `fantasyPoolMatchdayProjectionsData.js?v=20260718-final-round`
- index.html: 6. `fantasyPoolFinanceMetricsData.js?v=20260718-final-round`
- index.html: 7. `fantasyPoolScorePredictionsData.js?v=20260718-final-round`
- index.html: 8. `knockoutBracketPredictionData.js?v=20260718-final-round`
- index.html: 9. `fantasyPoolOfficialDataStatusData.js?v=20260718-final-round`
- index.html: 10. `liveMatchdayStatusData.js?v=20260718-final-round`
- index.html: 11. `livePlayerStatusData.js?v=20260718-final-round`
- index.html: 12. `r16FixtureAuthorityData.js?v=20260718-final-round`
- index.html: 13. `qfFixtureAuthorityData.js?v=20260718-final-round`
- index.html: 14. `sfFixtureAuthorityData.js?v=20260718-final-round`
- index.html: 15. `finalRoundFixtureAuthorityData.js?v=20260718-final-round`
- index.html: 16. `teamBuilderFinalRoundArtifactData.js?v=20260718-builder-artifact-equivalence`
- index.html: 17. `script.js?v=20260718-builder-artifact-equivalence`
- world-cup.html: 1. `https://www.googletagmanager.com/gtag/js?id=G-MSZET05H11`
- world-cup.html: 2. `worldCupData.js?v=20260718-final-round`
- world-cup.html: 3. `liveMatchdayStatusData.js?v=20260718-final-round`
- world-cup.html: 4. `r32FixtureAuthorityData.js?v=20260718-final-round`
- world-cup.html: 5. `r16FixtureAuthorityData.js?v=20260718-final-round`
- world-cup.html: 6. `qfFixtureAuthorityData.js?v=20260718-final-round`
- world-cup.html: 7. `sfFixtureAuthorityData.js?v=20260718-final-round`
- world-cup.html: 8. `finalRoundFixtureAuthorityData.js?v=20260718-final-round`
- world-cup.html: 9. `worldCupPage.js?v=20260718-final-round`

## Public Globals Used

- `FANTASY_POOL_FINANCE_METRICS_DATA`
- `FANTASY_POOL_FINANCE_METRICS_SUMMARY`
- `FANTASY_POOL_MATCHDAY_PROJECTIONS_DATA`
- `FANTASY_POOL_MATCHDAY_PROJECTIONS_SUMMARY`
- `FANTASY_POOL_OFFICIAL_DATA_STATUS`
- `FANTASY_POOL_PLAYER_FINANCE_METRICS`
- `FANTASY_POOL_PLAYER_MATCHDAY_PROJECTIONS`
- `FANTASY_POOL_RECOMMENDATIONS_DATA`
- `FANTASY_POOL_RECOMMENDATIONS_SUMMARY`
- `FANTASY_POOL_RECOMMENDATION_CANDIDATES`
- `FANTASY_POOL_SCORE_FIXTURE_PREDICTIONS`
- `FANTASY_POOL_SCORE_PREDICTIONS_DATA`
- `FANTASY_POOL_SCORE_PREDICTIONS_SUMMARY`
- `FANTASY_POOL_TEAM_FIXTURE_PREDICTIONS`
- `FANTASY_RULES_DATA`
- `FINAL_ROUND_FIXTURE_AUTHORITY_DATA`
- `KNOCKOUT_BRACKET_PREDICTION_DATA`
- `LIVE_MATCHDAY_STATUS_DATA`
- `LIVE_PLAYER_STATUS_DATA`
- `PLAYERS_DATA`
- `QF_FIXTURE_AUTHORITY_DATA`
- `R16_FIXTURE_AUTHORITY_DATA`
- `R32_FIXTURE_AUTHORITY_DATA`
- `SF_FIXTURE_AUTHORITY_DATA`
- `TEAM_BUILDER_FINAL_ROUND_ARTIFACT_DATA`
- `WORLD_CUP_DATA`

## Feature Inventory

- **Homepage shell:** source `index.html`, wrapper `none`, build `manual HTML`, validation `scripts/runLaunchBrowserQa.mjs / scripts/runPublicPreviewBrowserQa.mjs`. Fallback: noscript cards only
- **Picks / Squad Builder Starter:** source `data/fantasyPoolRecommendations_finalRound_v1.json`, wrapper `fantasyPoolRecommendationsData.js`, build `scripts/buildFantasyPoolRecommendationsFinalRoundV1.mjs`, validation `scripts/validateFinalRoundCorePickLineupEvidence.mjs, scripts/validateFinalRoundEligiblePlayersV1.mjs`. Fallback: script.js has historical matchday fallback copy for unavailable modes
- **Captain Watchlist:** source `data/fantasyPoolRecommendations_finalRound_v1.json`, wrapper `fantasyPoolRecommendationsData.js`, build `scripts/buildFantasyPoolRecommendationsFinalRoundV1.mjs`, validation `scripts/validateFinalRoundCorePickLineupEvidence.mjs`. Fallback: derived in browser from recommendation rows
- **Player Profile:** source `players.json plus active recommendation/projection/finance wrappers`, wrapper `playersData.js, fantasyPoolRecommendationsData.js, fantasyPoolMatchdayProjectionsData.js, fantasyPoolFinanceMetricsData.js`, build `scripts/buildFinalRoundFantasyArtifactsV1.mjs and upstream player-role/projection builders`, validation `data/playerProjectionQa_finalRound_v1.json and data/playerRoleModelQa_finalRound_v1.json`. Fallback: display helpers use 'Needs check' fallbacks for missing detail values
- **Team Builder:** source `data/teamBuilderFinalRoundArtifact_v1.json`, wrapper `teamBuilderFinalRoundArtifactData.js`, build `scripts/buildFinalRoundFantasyArtifactsV1.mjs`, validation `scripts/validateTeamBuilderFinalRoundV1.mjs, scripts/validateFinalRoundBuilderBrowserEquivalenceV1.mjs`. Fallback: browser optimizer remains available for user locks/filters and historical matchday views
- **Match Environment / Score Prediction:** source `data/scorePredictions_fantasyPool_finalRound_v1.json`, wrapper `fantasyPoolScorePredictionsData.js`, build `scripts/buildScorePredictionsFantasyPoolFinalRoundV1.mjs`, validation `scripts/validateMatchEnvironmentLiveScores.mjs and score QA reports`. Fallback: score context helper defaults missing labels to neutral/needs-check text
- **Knockout Bracket Prediction:** source `data/knockoutBracketPrediction_v1.json`, wrapper `knockoutBracketPredictionData.js`, build `scripts/buildKnockoutBracketPredictionV1.mjs`, validation `scripts/validateKnockoutBracketPredictionV1.mjs, scripts/validateBracketPathIntegrityV1.mjs`. Fallback: actual-result overlay coexists with modeled historical path rows
- **Knockout Predictor:** source `data/knockoutScorePredictor_v1.json and active score predictions`, wrapper `knockoutScorePredictorData.js, fantasyPoolScorePredictionsData.js`, build `scripts/buildKnockoutScorePredictorV1.mjs / scripts/buildScorePredictionsFantasyPoolFinalRoundV1.mjs`, validation `scripts/validateKnockoutBracketPredictionV1.mjs`. Fallback: historical knockout model data remains loaded for explanatory bracket contexts
- **World Cup fixtures page:** source `worldCupData.js and fixture-authority wrappers`, wrapper `worldCupData.js, liveMatchdayStatusData.js, r32/r16/qf/sf/finalRoundFixtureAuthorityData.js`, build `fixture authority builders by stage`, validation `scripts/validateWorldCupFixturesPageLiveScores.mjs and stage page validators`. Fallback: falls back to placeholder bracket matches when an authority fixture is missing
- **Official fantasy wrappers / live status:** source `data/officialFantasyReadiness_finalRound_v1.json, data/liveMatchdayStatus_v1.json, data/livePlayerStatus_v1.json`, wrapper `fantasyPoolOfficialDataStatusData.js, liveMatchdayStatusData.js, livePlayerStatusData.js`, build `scripts/refreshOfficialFantasyRoundStatuses.mjs, scripts/importLiveMatchdayStatus.mjs`, validation `scripts/validateOfficialDataReadiness.mjs, scripts/validateLiveFixtureMapping.mjs`. Fallback: manual confirmation caveats when live rules/status are uncertain

## Source-Of-Truth Map

- **fixtureAuthority:** data/finalRoundFixtureAuthority_v1.json
- **playerIdentity:** official_fantasy_player_id for official fantasy data; local player id for legacy players.json.
- **activeStage:** script.js defaultPublicMatchdayId = finalRound plus Final Round wrapper load order.
- **teamBuilderSquad:** data/teamBuilderFinalRoundArtifact_v1.json via teamBuilderFinalRoundArtifactData.js.
- **budgetRules:** fantasyRules.json and fantasyRulesData.js.
- **eligibleTeams:** data/finalRoundFixtureAuthority_v1.json fixtures[].team_a/team_b.
- **lineupEvidence:** data/sfLineupEvidenceForFinalRound_v1.json and data/playerRoleModel_finalRound_v1.json.
- **projections:** data/fantasyPoolMatchdayProjections_finalRound_v1.json via fantasyPoolMatchdayProjectionsData.js.
- **recommendations:** data/fantasyPoolRecommendations_finalRound_v1.json via fantasyPoolRecommendationsData.js.
- **bracketSlots:** stage fixture-authority files and data/knockoutBracketPrediction_v1.json.
- **scorePredictions:** data/scorePredictions_fantasyPool_finalRound_v1.json via fantasyPoolScorePredictionsData.js.

## Competing Source Findings

- **WARN / Team Builder:** Generated Final Round artifact is the public default, but a full browser optimizer remains in script.js for user locks and historical views. Evidence: `{"artifact":"data/teamBuilderFinalRoundArtifact_v1.json","browserLogic":"script.js"}`.
- **WARN / Active stage:** Historical matchday options and fallback wording remain in the active Team Builder controls; acceptable if intentionally historical, but not elegant for a stage-scoped public default. Evidence: `{"defaultStage":"finalRound"}`.
- **WARN / Budget/rules:** Budget source is rules-driven in code, but Stats Notes still contain legacy $100m copy that can confuse the Final Round 105 rule. Evidence: `{"file":"index.html"}`.
