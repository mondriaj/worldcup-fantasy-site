# Model Output Dirty Review v1

Generated: 2026-07-18T19:18:35.745Z

Status: **YELLOW - generated/model/public-wrapper changes still require cautious manual handling**

## Inventory

| Metric | Value |
| --- | --- |
| Dirty entries reviewed | 85 |
| Tracked dirty | 54 |
| Untracked | 31 |
| Modified | 54 |
| New | 31 |
| Deleted | 0 |

## Diff Types

| Diff type | Count |
| --- | --- |
| count-changing QA/report | 2 |
| QA/report rerun only, non-material | 4 |
| timestamp-only churn | 47 |
| unrelated analysis/research | 32 |

## Active Public Wrapper Focus

| File | Dirty | Loaded | Diff type | Public visible change | Recommendation |
| --- | --- | --- | --- | --- | --- |
| fantasyPoolRecommendationsData.js | no | yes | clean | no | clean_no_action |
| fantasyPoolMatchdayProjectionsData.js | no | yes | clean | no | clean_no_action |
| fantasyPoolScorePredictionsData.js | no | yes | clean | no | clean_no_action |
| teamBuilderFinalRoundArtifactData.js | no | yes | clean | no | clean_no_action |
| fantasyPoolOfficialDataStatusData.js | no | yes | clean | no | clean_no_action |
| liveMatchdayStatusData.js | no | yes | clean | no | clean_no_action |
| livePlayerStatusData.js | no | yes | clean | no | clean_no_action |
| knockoutBracketPredictionData.js | no | yes | clean | no | clean_no_action |
| worldCupData.js | no | yes | clean | no | clean_no_action |
| finalRoundFixtureAuthorityData.js | yes | yes | timestamp-only churn | no | safe_to_revert_later_after_batch_review |
| fantasyPoolFinanceMetricsData.js | yes | yes | timestamp-only churn | no | safe_to_revert_later_after_batch_review |
| teamBuilderPublicHelpers.js | no | yes | clean | no | clean_no_action |
| script.js | no | yes | clean | no | clean_no_action |
| index.html | no | yes | clean | no | clean_no_action |
| world-cup.html | no | yes | clean | no | clean_no_action |
| worldCupPage.js | no | yes | clean | no | clean_no_action |

## Manual Review Items

| Path | Diff type | Fields changed | Counts changed | Recommendation |
| --- | --- | --- | --- | --- |
| data/activeStageQaRunReport_v1.md | count-changing QA/report | see text diff | no | manual_review_before_revert_or_commit |
| data/publicPreviewBrowserQaReport_v1.md | count-changing QA/report | see text diff | no | manual_review_before_revert_or_commit |

## Timestamp / Non-Material Churn

| Path | Diff type | Recommendation |
| --- | --- | --- |
| data/activeFantasyDataFlowQa.json | QA/report rerun only, non-material | ignore_or_revert_later |
| data/activeFantasyDataFlowQaReport.md | timestamp-only churn | safe_to_revert_later_after_batch_review |
| data/activeStageManifestQaReport_v1.md | timestamp-only churn | safe_to_revert_later_after_batch_review |
| data/activeStageManifestQa_v1.json | timestamp-only churn | safe_to_revert_later_after_batch_review |
| data/activeStageQaRun_v1.json | QA/report rerun only, non-material | ignore_or_revert_later |
| data/bracketPathIntegrityAuditReport_v1.md | timestamp-only churn | safe_to_revert_later_after_batch_review |
| data/bracketPathIntegrityAudit_v1.json | timestamp-only churn | safe_to_revert_later_after_batch_review |
| data/fantasyPoolMatchdayProjections_finalRound_v1.json | timestamp-only churn | safe_to_revert_later_after_batch_review |
| data/fantasyPoolRecommendations_finalRound_v1.json | timestamp-only churn | safe_to_revert_later_after_batch_review |
| data/finalRoundBrowserContentContractQaReport_v1.md | timestamp-only churn | safe_to_revert_later_after_batch_review |
| data/finalRoundBrowserContentContractQa_v1.json | timestamp-only churn | safe_to_revert_later_after_batch_review |
| data/finalRoundBuilderArtifactBrowserMismatch_v1.json | timestamp-only churn | safe_to_revert_later_after_batch_review |
| data/finalRoundBuilderBrowserEquivalenceQa_v1.json | QA/report rerun only, non-material | ignore_or_revert_later |
| data/finalRoundCorePickLineupEvidenceQa_v1.json | timestamp-only churn | safe_to_revert_later_after_batch_review |
| data/finalRoundEligiblePlayersQa_v1.json | timestamp-only churn | safe_to_revert_later_after_batch_review |
| data/finalRoundEliminatedPlayerBugAudit_v1.json | QA/report rerun only, non-material | ignore_or_revert_later |
| data/finalRoundFinanceBridgeQa_v1.json | timestamp-only churn | safe_to_revert_later_after_batch_review |
| data/finalRoundFixtureAuthorityQa_v1.json | timestamp-only churn | safe_to_revert_later_after_batch_review |
| data/finalRoundFixtureAuthority_v1.json | timestamp-only churn | safe_to_revert_later_after_batch_review |
| data/finalRoundFixtureExposureStrategyAudit_v1.json | timestamp-only churn | safe_to_revert_later_after_batch_review |
| data/finalRoundFixtureExposureStrategyQa_v1.json | timestamp-only churn | safe_to_revert_later_after_batch_review |
| data/finalRoundLineupNewsAudit_v1.json | timestamp-only churn | safe_to_revert_later_after_batch_review |
| data/finalRoundReleaseQa_v1.json | timestamp-only churn | safe_to_revert_later_after_batch_review |
| data/knockoutBracketPredictionQaReport_v1.md | timestamp-only churn | safe_to_revert_later_after_batch_review |
| data/knockoutBracketPredictionQa_v1.json | timestamp-only churn | safe_to_revert_later_after_batch_review |
| data/knockoutCalibrationDataset_for_finalRound_v1.json | timestamp-only churn | safe_to_revert_later_after_batch_review |
| data/knockoutModelPostmortem_for_finalRound_v1.json | timestamp-only churn | safe_to_revert_later_after_batch_review |
| data/liveFixtureMappingQaReport_v1.md | timestamp-only churn | safe_to_revert_later_after_batch_review |
| data/liveFixtureMappingQa_v1.json | timestamp-only churn | safe_to_revert_later_after_batch_review |
| data/matchEnvironmentLiveScoresQaReport_v1.md | timestamp-only churn | safe_to_revert_later_after_batch_review |
| data/matchEnvironmentLiveScoresQa_v1.json | timestamp-only churn | safe_to_revert_later_after_batch_review |
| data/peleRefreshAudit_finalRound_v1.json | timestamp-only churn | safe_to_revert_later_after_batch_review |
| data/playerProjectionQa_finalRound_v1.json | timestamp-only churn | safe_to_revert_later_after_batch_review |
| data/playerRoleModelQa_finalRound_v1.json | timestamp-only churn | safe_to_revert_later_after_batch_review |
| data/playerRoleModel_finalRound_v1.json | timestamp-only churn | safe_to_revert_later_after_batch_review |
| data/publicPayloadContractQaReport_v1.md | timestamp-only churn | safe_to_revert_later_after_batch_review |
| data/publicPayloadContractQa_v1.json | timestamp-only churn | safe_to_revert_later_after_batch_review |
| data/recommendationQa_finalRound_v1.json | timestamp-only churn | safe_to_revert_later_after_batch_review |
| data/scorePredictionQa_finalRound_v1.json | timestamp-only churn | safe_to_revert_later_after_batch_review |
| data/scorePredictions_fantasyPool_finalRound_v1.json | timestamp-only churn | safe_to_revert_later_after_batch_review |
| data/sfLineupEvidenceForFinalRound_v1.json | timestamp-only churn | safe_to_revert_later_after_batch_review |
| data/teamBuilderGoldenFinalRoundQaReport_v1.md | timestamp-only churn | safe_to_revert_later_after_batch_review |
| data/teamBuilderGoldenFinalRoundQa_v1.json | timestamp-only churn | safe_to_revert_later_after_batch_review |
| data/teamBuilderGoldenTestsNoBehaviorChangeReport_v1.md | timestamp-only churn | safe_to_revert_later_after_batch_review |
| data/teamBuilderGoldenTestsNoBehaviorChange_v1.json | timestamp-only churn | safe_to_revert_later_after_batch_review |
| data/thirdPlaceHistoricalProfileQa_v1.json | timestamp-only churn | safe_to_revert_later_after_batch_review |
| data/thirdPlaceHistoricalProfile_v1.json | timestamp-only churn | safe_to_revert_later_after_batch_review |
| data/worldCupFixturesPageLiveScoresQaReport_v1.md | timestamp-only churn | safe_to_revert_later_after_batch_review |
| data/worldCupFixturesPageLiveScoresQa_v1.json | timestamp-only churn | safe_to_revert_later_after_batch_review |
| fantasyPoolFinanceMetricsData.js | timestamp-only churn | safe_to_revert_later_after_batch_review |
| finalRoundFixtureAuthorityData.js | timestamp-only churn | safe_to_revert_later_after_batch_review |

## Private / Untracked Analysis

| Path | Group | Recommendation |
| --- | --- | --- |
| .gitignore | unrelated `.gitignore` | keep_untracked_or_unstaged_private |
| analysis/ | analysis/ scratch files | keep_untracked_or_unstaged_private |
| data/refereeingOutcomesAnalysisValidation_v1.json | refereeing/conspiracy analysis | keep_untracked_or_unstaged_private |
| data/refereeingOutcomesAnalysisValidation_v1.md | refereeing/conspiracy analysis | keep_untracked_or_unstaged_private |
| data/refereeingOutcomesCalledEvents_v1.json | refereeing/conspiracy analysis | keep_untracked_or_unstaged_private |
| data/refereeingOutcomesFeatureQa_v1.json | refereeing/conspiracy analysis | keep_untracked_or_unstaged_private |
| data/refereeingOutcomesFeatureQa_v1.md | refereeing/conspiracy analysis | keep_untracked_or_unstaged_private |
| data/refereeingOutcomesFigures_v1/ | refereeing/conspiracy analysis | keep_untracked_or_unstaged_private |
| data/refereeingOutcomesMeasurementContract_v1.md | refereeing/conspiracy analysis | keep_untracked_or_unstaged_private |
| data/refereeingOutcomesModelData_v1.json | refereeing/conspiracy analysis | keep_untracked_or_unstaged_private |
| data/refereeingOutcomesModelReport_v1.md | refereeing/conspiracy analysis | keep_untracked_or_unstaged_private |
| data/refereeingOutcomesModels_v1/ | refereeing/conspiracy analysis | keep_untracked_or_unstaged_private |
| data/refereeingOutcomesResults_v1.json | refereeing/conspiracy analysis | keep_untracked_or_unstaged_private |
| data/refereeingOutcomesResults_v1.md | refereeing/conspiracy analysis | keep_untracked_or_unstaged_private |
| data/refereeingOutcomesRobustness_v1.json | refereeing/conspiracy analysis | keep_untracked_or_unstaged_private |
| data/refereeingOutcomesRobustness_v1.md | refereeing/conspiracy analysis | keep_untracked_or_unstaged_private |
| data/refereeingOutcomesSourceManifest_v1.json | refereeing/conspiracy analysis | keep_untracked_or_unstaged_private |
| data/refereeingOutcomesSourceQA_v1.json | refereeing/conspiracy analysis | keep_untracked_or_unstaged_private |
| data/refereeingOutcomesSourceQA_v1.md | refereeing/conspiracy analysis | keep_untracked_or_unstaged_private |
| data/refereeingOutcomesStrengthSnapshot_v1.json | refereeing/conspiracy analysis | keep_untracked_or_unstaged_private |
| data/refereeingOutcomesTeamMatches_v1.json | refereeing/conspiracy analysis | keep_untracked_or_unstaged_private |
| scripts/analyzeRefereeingOutcomesModelsV1.py | research/referee files | keep_untracked_or_unstaged_private |
| scripts/buildRefereeingOutcomesFeaturesV1.mjs | research/referee files | keep_untracked_or_unstaged_private |
| scripts/buildRefereeingOutcomesFiguresV1.py | research/referee files | keep_untracked_or_unstaged_private |
| scripts/buildRefereeingOutcomesNotebookV1.py | research/referee files | keep_untracked_or_unstaged_private |
| scripts/buildRefereeingOutcomesReportV1.py | research/referee files | keep_untracked_or_unstaged_private |
| scripts/buildRefereeingOutcomesSourceSnapshotV1.mjs | research/referee files | keep_untracked_or_unstaged_private |
| scripts/fitRefereeingOutcomesModelsV1.py | research/referee files | keep_untracked_or_unstaged_private |
| scripts/runRefereeingOutcomesPipelineV1.sh | research/referee files | keep_untracked_or_unstaged_private |
| scripts/runRefereeingOutcomesRobustnessV1.py | research/referee files | keep_untracked_or_unstaged_private |
| scripts/validateRefereeingOutcomesAnalysisV1.py | research/referee files | keep_untracked_or_unstaged_private |
| scripts/validateRefereeingOutcomesSourceSnapshotV1.mjs | research/referee files | keep_untracked_or_unstaged_private |

## QA Evidence

| Gate | Result |
| --- | --- |
| Active stage QA runner | pass - 44/44 checks |
| Team Builder golden Final Round | pass |
| Final Round browser equivalence | pass |
| Public preview browser QA | pass |
| `git diff --check` | pass |

## Conclusion

No model-output or public-wrapper changes should be committed or reverted in this prompt. Most tracked churn compares as timestamp-only after structured parsing. The only count-changing items are QA/report artifacts, which require manual review because they reflect prior generated-output state. The dirty public wrappers loaded by the site compare as timestamp-only after parsing embedded JSON and are covered by active QA, but should still be reverted only in a dedicated cleanup pass.
