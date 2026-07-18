# Model Output Dirty Review Plan v1

Generated: 2026-07-18T19:18:35.745Z

Status: **YELLOW - review-only; no destructive commands executed.**

## A. Safe To Leave Untracked / Private

- Refereeing/conspiracy analysis files under `data/refereeingOutcomes*` and `data/refereeingOutcomes*/`.
- Referee research scripts under `scripts/*RefereeingOutcomes*`.
- `analysis/refereeing_outcomes_model_v1.ipynb` and `analysis/requirements-refereeing-outcomes-v1.txt`.
These are not loaded by `index.html` or `world-cup.html` and should not be staged or published.

## B. Safe To Ignore Via `.gitignore`

Only narrow local/generated cache patterns are recommended, and `.gitignore` is not edited here:

```gitignore
data/refereeingOutcomesModels_v1/*.nc
scripts/__pycache__/
```

## C. Safe To Revert Later

Potential revert candidates are timestamp-only or non-material QA/report reruns, but only in a dedicated revert pass after reviewing each file and rerunning QA:

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

Suggested command pattern, not executed here:

```bash
git diff -- <file>
git restore -- <file>
```

## D. Requires Manual / Model Review

Do not commit or revert these in a hygiene prompt:

- `data/activeStageQaRunReport_v1.md` - count-changing QA/report; manual_review_before_revert_or_commit
- `data/publicPreviewBrowserQaReport_v1.md` - count-changing QA/report; manual_review_before_revert_or_commit

## E. QA Gates Run

- Active stage QA runner: pass, 44/44 checks.
- Team Builder golden Final Round: pass.
- Final Round browser equivalence: pass.
- Public preview browser QA: pass.
- `git diff --check`: pass.

## Recommended Next Command Set

```bash
# Review count-changing QA/report artifacts first
git diff -- data/activeFantasyDataFlowQa.json data/finalRoundEliminatedPlayerBugAudit_v1.json

# Review public wrappers before any restore, even though structured compare says timestamp-only
git diff -- fantasyPoolFinanceMetricsData.js finalRoundFixtureAuthorityData.js

# Optional review-report commit only
git add data/modelOutputDirtyReview_v1.json data/modelOutputDirtyReviewReport_v1.md data/modelOutputDirtyReviewPlan_v1.md
git commit -m "Review dirty model output artifacts"
git push
```
