# Model Elegance Audit v1

Generated: 2026-07-18T12:16:55.342Z

Status: **pass**

## Models

- **score prediction model:** source `data/scorePredictionModel_finalRound_v1.md`, output `data/scorePredictions_fantasyPool_finalRound_v1.json`. QA: Covered by phase-specific QA where available; browser QA strongest for Team Builder equivalence.
- **PELE/team-quality layer:** source `data/peleRefreshAudit_finalRound_v1.json`, output `data/teamQuality_fantasyPool_v3.json`. QA: Covered by phase-specific QA where available; browser QA strongest for Team Builder equivalence.
- **player role/start probability model:** source `data/playerRoleModel_finalRound_v1.md`, output `data/playerRoleModel_finalRound_v1.json`. QA: Covered by phase-specific QA where available; browser QA strongest for Team Builder equivalence.
- **lineup evidence model:** source `data/sfLineupEvidenceForFinalRound_v1.json`, output `data/finalRoundCorePickLineupEvidenceQa_v1.json`. QA: Covered by phase-specific QA where available; browser QA strongest for Team Builder equivalence.
- **player projection model:** source `data/playerProjectionModel_finalRound_v1.md`, output `data/fantasyPoolMatchdayProjections_finalRound_v1.json`. QA: Covered by phase-specific QA where available; browser QA strongest for Team Builder equivalence.
- **recommendation model:** source `data/recommendationModel_finalRound_v1.md`, output `data/fantasyPoolRecommendations_finalRound_v1.json`. QA: Covered by phase-specific QA where available; browser QA strongest for Team Builder equivalence.
- **Team Builder objective:** source `data/teamBuilderModel_finalRound_v1.md`, output `data/teamBuilderFinalRoundArtifact_v1.json`. QA: Covered by phase-specific QA where available; browser QA strongest for Team Builder equivalence.
- **Final Round fixture optionality layer:** source `scripts/buildFinalRoundFantasyArtifactsV1.mjs`, output `data/teamBuilderFinalRoundArtifact_v1.json`. QA: Covered by phase-specific QA where available; browser QA strongest for Team Builder equivalence.
- **Third Place historical modifier:** source `data/thirdPlaceHistoricalProfileReport_v1.md`, output `data/thirdPlaceHistoricalProfile_v1.json`. QA: Covered by phase-specific QA where available; browser QA strongest for Team Builder equivalence.
- **knockout prediction model:** source `data/knockoutScorePredictor_v1.json`, output `knockoutScorePredictorData.js`. QA: Covered by phase-specific QA where available; browser QA strongest for Team Builder equivalence.
- **bracket prediction model:** source `data/knockoutBracketPredictionModel_v1.md`, output `data/knockoutBracketPrediction_v1.json`. QA: Covered by phase-specific QA where available; browser QA strongest for Team Builder equivalence.

## Implementation Observations

- Numeric literal mentions in `script.js`: 1048
- Fallback mentions in `script.js`: 78
- Ownership mentions in `script.js`: 0

## Issues

- **WARN / Magic numbers:** script.js contains many numeric weights/thresholds. Several are likely legitimate strategy weights, but they are not centralized in a single model contract. Evidence: `{"numericLiteralMentions":1048}`.
- **WARN / Browser model logic:** Team Builder ranking, portfolio adjustment, and fallback scoring still live in script.js alongside UI rendering. Evidence: `{"file":"script.js"}`.
- **WARN / Duplicated logic risk:** Generated artifact and browser optimizer are kept equivalent by QA, but two executable paths remain for the same concept. Evidence: `{"artifact":"data/teamBuilderFinalRoundArtifact_v1.json","browser":"script.js"}`.
- **WARN / Public precision:** Public copy generally uses caveats, but detailed numeric indices can read more precise than the evidence supports unless the caveat remains nearby.
