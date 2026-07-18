# Worktree Cleanup Execution Plan v1

Generated: 2026-07-18T19:35:00Z

Status: **GREEN - scoped cleanup may proceed.**

## Inputs Checked

- `data/modelOutputDirtyReview_v1.json`
- `data/modelOutputDirtyReviewReport_v1.md`
- `data/modelOutputDirtyReviewPlan_v1.md`
- `data/worktreeHygieneAudit_v1.json`
- `data/worktreeHygienePlan_v1.md`
- `git status --short`
- `git diff --stat`
- `git diff --name-only`
- `git ls-files --others --exclude-standard`

## Starting Dirty Counts

| Metric | Count |
| --- | ---: |
| Dirty status entries | 85 |
| Tracked dirty files | 54 |
| Untracked status entries | 31 |
| Untracked files from `git ls-files --others --exclude-standard` | 35 |

## A. Revert Tracked Timestamp-Only Or Non-Material Churn

These files were explicitly classified as `timestamp-only churn`, `safe_to_revert_later_after_batch_review`, or `QA/report rerun only, non-material` in `data/modelOutputDirtyReview_v1.json`.

- `data/activeFantasyDataFlowQa.json`
- `data/activeFantasyDataFlowQaReport.md`
- `data/activeStageManifestQaReport_v1.md`
- `data/activeStageManifestQa_v1.json`
- `data/activeStageQaRun_v1.json`
- `data/bracketPathIntegrityAuditReport_v1.md`
- `data/bracketPathIntegrityAudit_v1.json`
- `data/fantasyPoolMatchdayProjections_finalRound_v1.json`
- `data/fantasyPoolRecommendations_finalRound_v1.json`
- `data/finalRoundBrowserContentContractQaReport_v1.md`
- `data/finalRoundBrowserContentContractQa_v1.json`
- `data/finalRoundBuilderArtifactBrowserMismatch_v1.json`
- `data/finalRoundBuilderBrowserEquivalenceQa_v1.json`
- `data/finalRoundCorePickLineupEvidenceQa_v1.json`
- `data/finalRoundEligiblePlayersQa_v1.json`
- `data/finalRoundEliminatedPlayerBugAudit_v1.json`
- `data/finalRoundFinanceBridgeQa_v1.json`
- `data/finalRoundFixtureAuthorityQa_v1.json`
- `data/finalRoundFixtureAuthority_v1.json`
- `data/finalRoundFixtureExposureStrategyAudit_v1.json`
- `data/finalRoundFixtureExposureStrategyQa_v1.json`
- `data/finalRoundLineupNewsAudit_v1.json`
- `data/finalRoundReleaseQa_v1.json`
- `data/knockoutBracketPredictionQaReport_v1.md`
- `data/knockoutBracketPredictionQa_v1.json`
- `data/knockoutCalibrationDataset_for_finalRound_v1.json`
- `data/knockoutModelPostmortem_for_finalRound_v1.json`
- `data/liveFixtureMappingQaReport_v1.md`
- `data/liveFixtureMappingQa_v1.json`
- `data/matchEnvironmentLiveScoresQaReport_v1.md`
- `data/matchEnvironmentLiveScoresQa_v1.json`
- `data/peleRefreshAudit_finalRound_v1.json`
- `data/playerProjectionQa_finalRound_v1.json`
- `data/playerRoleModelQa_finalRound_v1.json`
- `data/playerRoleModel_finalRound_v1.json`
- `data/publicPayloadContractQaReport_v1.md`
- `data/publicPayloadContractQa_v1.json`
- `data/recommendationQa_finalRound_v1.json`
- `data/scorePredictionQa_finalRound_v1.json`
- `data/scorePredictions_fantasyPool_finalRound_v1.json`
- `data/sfLineupEvidenceForFinalRound_v1.json`
- `data/teamBuilderGoldenFinalRoundQaReport_v1.md`
- `data/teamBuilderGoldenFinalRoundQa_v1.json`
- `data/teamBuilderGoldenTestsNoBehaviorChangeReport_v1.md`
- `data/teamBuilderGoldenTestsNoBehaviorChange_v1.json`
- `data/thirdPlaceHistoricalProfileQa_v1.json`
- `data/thirdPlaceHistoricalProfile_v1.json`
- `data/worldCupFixturesPageLiveScoresQaReport_v1.md`
- `data/worldCupFixturesPageLiveScoresQa_v1.json`
- `fantasyPoolFinanceMetricsData.js`
- `finalRoundFixtureAuthorityData.js`

Exact cleanup command:

```bash
git restore -- data/activeFantasyDataFlowQa.json data/activeFantasyDataFlowQaReport.md data/activeStageManifestQaReport_v1.md data/activeStageManifestQa_v1.json data/activeStageQaRun_v1.json data/bracketPathIntegrityAuditReport_v1.md data/bracketPathIntegrityAudit_v1.json data/fantasyPoolMatchdayProjections_finalRound_v1.json data/fantasyPoolRecommendations_finalRound_v1.json data/finalRoundBrowserContentContractQaReport_v1.md data/finalRoundBrowserContentContractQa_v1.json data/finalRoundBuilderArtifactBrowserMismatch_v1.json data/finalRoundBuilderBrowserEquivalenceQa_v1.json data/finalRoundCorePickLineupEvidenceQa_v1.json data/finalRoundEligiblePlayersQa_v1.json data/finalRoundEliminatedPlayerBugAudit_v1.json data/finalRoundFinanceBridgeQa_v1.json data/finalRoundFixtureAuthorityQa_v1.json data/finalRoundFixtureAuthority_v1.json data/finalRoundFixtureExposureStrategyAudit_v1.json data/finalRoundFixtureExposureStrategyQa_v1.json data/finalRoundLineupNewsAudit_v1.json data/finalRoundReleaseQa_v1.json data/knockoutBracketPredictionQaReport_v1.md data/knockoutBracketPredictionQa_v1.json data/knockoutCalibrationDataset_for_finalRound_v1.json data/knockoutModelPostmortem_for_finalRound_v1.json data/liveFixtureMappingQaReport_v1.md data/liveFixtureMappingQa_v1.json data/matchEnvironmentLiveScoresQaReport_v1.md data/matchEnvironmentLiveScoresQa_v1.json data/peleRefreshAudit_finalRound_v1.json data/playerProjectionQa_finalRound_v1.json data/playerRoleModelQa_finalRound_v1.json data/playerRoleModel_finalRound_v1.json data/publicPayloadContractQaReport_v1.md data/publicPayloadContractQa_v1.json data/recommendationQa_finalRound_v1.json data/scorePredictionQa_finalRound_v1.json data/scorePredictions_fantasyPool_finalRound_v1.json data/sfLineupEvidenceForFinalRound_v1.json data/teamBuilderGoldenFinalRoundQaReport_v1.md data/teamBuilderGoldenFinalRoundQa_v1.json data/teamBuilderGoldenTestsNoBehaviorChangeReport_v1.md data/teamBuilderGoldenTestsNoBehaviorChange_v1.json data/thirdPlaceHistoricalProfileQa_v1.json data/thirdPlaceHistoricalProfile_v1.json data/worldCupFixturesPageLiveScoresQaReport_v1.md data/worldCupFixturesPageLiveScoresQa_v1.json fantasyPoolFinanceMetricsData.js finalRoundFixtureAuthorityData.js
```

## B. Remove Untracked Generated Clutter

None. The prior reviews did not classify any untracked file as safe generated clutter.

No removal command will be run.

## C. Leave Untouched

- `.gitignore`
- `analysis/`
- `data/refereeingOutcomesAnalysisValidation_v1.json`
- `data/refereeingOutcomesAnalysisValidation_v1.md`
- `data/refereeingOutcomesCalledEvents_v1.json`
- `data/refereeingOutcomesFeatureQa_v1.json`
- `data/refereeingOutcomesFeatureQa_v1.md`
- `data/refereeingOutcomesFigures_v1/`
- `data/refereeingOutcomesMeasurementContract_v1.md`
- `data/refereeingOutcomesModelData_v1.json`
- `data/refereeingOutcomesModelReport_v1.md`
- `data/refereeingOutcomesModels_v1/`
- `data/refereeingOutcomesResults_v1.json`
- `data/refereeingOutcomesResults_v1.md`
- `data/refereeingOutcomesRobustness_v1.json`
- `data/refereeingOutcomesRobustness_v1.md`
- `data/refereeingOutcomesSourceManifest_v1.json`
- `data/refereeingOutcomesSourceQA_v1.json`
- `data/refereeingOutcomesSourceQA_v1.md`
- `data/refereeingOutcomesStrengthSnapshot_v1.json`
- `data/refereeingOutcomesTeamMatches_v1.json`
- `scripts/analyzeRefereeingOutcomesModelsV1.py`
- `scripts/buildRefereeingOutcomesFeaturesV1.mjs`
- `scripts/buildRefereeingOutcomesFiguresV1.py`
- `scripts/buildRefereeingOutcomesNotebookV1.py`
- `scripts/buildRefereeingOutcomesReportV1.py`
- `scripts/buildRefereeingOutcomesSourceSnapshotV1.mjs`
- `scripts/fitRefereeingOutcomesModelsV1.py`
- `scripts/runRefereeingOutcomesPipelineV1.sh`
- `scripts/runRefereeingOutcomesRobustnessV1.py`
- `scripts/validateRefereeingOutcomesAnalysisV1.py`
- `scripts/validateRefereeingOutcomesSourceSnapshotV1.mjs`

## D. Manual Review Later

- `data/activeStageQaRunReport_v1.md`
- `data/publicPreviewBrowserQaReport_v1.md`

## Verification Commands

```bash
node scripts/runActiveStageQaFromManifestV1.mjs
node scripts/validateTeamBuilderGoldenFinalRoundV1.mjs
node scripts/validateFinalRoundBuilderBrowserEquivalenceV1.mjs
node scripts/runPublicPreviewBrowserQa.mjs
git diff --check
git status --short
```

Because the active QA runner writes generated QA output files, allowed generated churn may be restored again after the QA gates so the final tree only contains intentionally untouched files plus the cleanup report artifacts.
