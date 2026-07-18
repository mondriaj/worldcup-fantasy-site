# Private Artifact Parking Audit v1

Generated: 2026-07-18T21:27:11.849Z

Status: **GREEN - no public exposure found; document-only parking recommended.**

## Summary

| Metric | Value |
| --- | --- |
| Head commit | 760bfc8 |
| Tracked worktree clean before prompt | yes |
| Untracked files inventoried | 35 |
| Public artifact path hits | 0 |
| Public sensitive phrase hits | 0 |
| Files moved | no |
| .gitignore changed | no |

## Groups

| Group | Files |
| --- | --- |
| analysis/ scratch files | 2 |
| data/refereeingOutcomes* private analysis artifacts | 17 |
| data/refereeingOutcomes*/ figure outputs | 3 |
| data/refereeingOutcomes*/ model summaries | 2 |
| scripts/*RefereeingOutcomes* research scripts | 11 |

## Public Exposure Check

No hits were found in `index.html`, `world-cup.html`, `script.js`, or `worldCupPage.js` for the requested private-artifact and sensitive public-exposure terms. No artifact-path references were found in `data/activeStageManifest_v1.json` or `scripts/runActiveStageQaFromManifestV1.mjs`. The active manifest still contains sensitive phrase strings as an exposure-prevention blocklist, which is a QA guardrail rather than a public load/reference.

## Inventory

| Path | Bytes | Type | Group | Public loads | Manifest ref | QA runner ref | Refereeing content | Action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| analysis/refereeing_outcomes_model_v1.ipynb | 573499 | notebook | analysis/ scratch files | no | no | no | yes | leave_untracked_private_document_only |
| analysis/requirements-refereeing-outcomes-v1.txt | 171 | text dependency list | analysis/ scratch files | no | no | no | yes | leave_untracked_private_document_only |
| data/refereeingOutcomesAnalysisValidation_v1.json | 3271 | json data artifact | data/refereeingOutcomes* private analysis artifacts | no | no | no | yes | leave_untracked_private_document_only |
| data/refereeingOutcomesAnalysisValidation_v1.md | 1912 | markdown report/contract | data/refereeingOutcomes* private analysis artifacts | no | no | no | yes | leave_untracked_private_document_only |
| data/refereeingOutcomesCalledEvents_v1.json | 8059257 | json data artifact | data/refereeingOutcomes* private analysis artifacts | no | no | no | yes | leave_untracked_private_document_only |
| data/refereeingOutcomesFeatureQa_v1.json | 1968 | json data artifact | data/refereeingOutcomes* private analysis artifacts | no | no | no | yes | leave_untracked_private_document_only |
| data/refereeingOutcomesFeatureQa_v1.md | 1690 | markdown report/contract | data/refereeingOutcomes* private analysis artifacts | no | no | no | yes | leave_untracked_private_document_only |
| data/refereeingOutcomesFigures_v1/focal_effects.png | 66120 | png figure | data/refereeingOutcomes*/ figure outputs | no | no | no | yes | leave_untracked_private_document_only |
| data/refereeingOutcomesFigures_v1/robustness_forest.png | 165204 | png figure | data/refereeingOutcomes*/ figure outputs | no | no | no | yes | leave_untracked_private_document_only |
| data/refereeingOutcomesFigures_v1/team_predictive_checks.png | 177737 | png figure | data/refereeingOutcomes*/ figure outputs | no | no | no | yes | leave_untracked_private_document_only |
| data/refereeingOutcomesMeasurementContract_v1.md | 10953 | markdown report/contract | data/refereeingOutcomes* private analysis artifacts | no | no | no | yes | leave_untracked_private_document_only |
| data/refereeingOutcomesModelData_v1.json | 1223589 | json data artifact | data/refereeingOutcomes* private analysis artifacts | no | no | no | yes | leave_untracked_private_document_only |
| data/refereeingOutcomesModelReport_v1.md | 5667 | markdown report/contract | data/refereeingOutcomes* private analysis artifacts | no | no | no | yes | leave_untracked_private_document_only |
| data/refereeingOutcomesModels_v1/fouls_model_fit_summary.json | 4503 | json data artifact | data/refereeingOutcomes*/ model summaries | no | no | no | yes | leave_untracked_private_document_only |
| data/refereeingOutcomesModels_v1/model_fit_summary.json | 11705 | json data artifact | data/refereeingOutcomes*/ model summaries | no | no | no | yes | leave_untracked_private_document_only |
| data/refereeingOutcomesResults_v1.json | 63203 | json data artifact | data/refereeingOutcomes* private analysis artifacts | no | no | no | yes | leave_untracked_private_document_only |
| data/refereeingOutcomesResults_v1.md | 5888 | markdown report/contract | data/refereeingOutcomes* private analysis artifacts | no | no | no | yes | leave_untracked_private_document_only |
| data/refereeingOutcomesRobustness_v1.json | 20792 | json data artifact | data/refereeingOutcomes* private analysis artifacts | no | no | no | yes | leave_untracked_private_document_only |
| data/refereeingOutcomesRobustness_v1.md | 3935 | markdown report/contract | data/refereeingOutcomes* private analysis artifacts | no | no | no | yes | leave_untracked_private_document_only |
| data/refereeingOutcomesSourceManifest_v1.json | 179427 | json data artifact | data/refereeingOutcomes* private analysis artifacts | no | no | no | yes | leave_untracked_private_document_only |
| data/refereeingOutcomesSourceQA_v1.json | 10180 | json data artifact | data/refereeingOutcomes* private analysis artifacts | no | no | no | yes | leave_untracked_private_document_only |
| data/refereeingOutcomesSourceQA_v1.md | 3768 | markdown report/contract | data/refereeingOutcomes* private analysis artifacts | no | no | no | yes | leave_untracked_private_document_only |
| data/refereeingOutcomesStrengthSnapshot_v1.json | 238566 | json data artifact | data/refereeingOutcomes* private analysis artifacts | no | no | no | yes | leave_untracked_private_document_only |
| data/refereeingOutcomesTeamMatches_v1.json | 781813 | json data artifact | data/refereeingOutcomes* private analysis artifacts | no | no | no | yes | leave_untracked_private_document_only |
| scripts/analyzeRefereeingOutcomesModelsV1.py | 9903 | python research/QA script | scripts/*RefereeingOutcomes* research scripts | no | no | no | yes | leave_untracked_private_document_only |
| scripts/buildRefereeingOutcomesFeaturesV1.mjs | 17488 | node research/QA script | scripts/*RefereeingOutcomes* research scripts | no | no | no | yes | leave_untracked_private_document_only |
| scripts/buildRefereeingOutcomesFiguresV1.py | 5985 | python research/QA script | scripts/*RefereeingOutcomes* research scripts | no | no | no | yes | leave_untracked_private_document_only |
| scripts/buildRefereeingOutcomesNotebookV1.py | 8208 | python research/QA script | scripts/*RefereeingOutcomes* research scripts | no | no | no | yes | leave_untracked_private_document_only |
| scripts/buildRefereeingOutcomesReportV1.py | 8748 | python research/QA script | scripts/*RefereeingOutcomes* research scripts | no | no | no | yes | leave_untracked_private_document_only |
| scripts/buildRefereeingOutcomesSourceSnapshotV1.mjs | 22568 | node research/QA script | scripts/*RefereeingOutcomes* research scripts | no | no | no | yes | leave_untracked_private_document_only |
| scripts/fitRefereeingOutcomesModelsV1.py | 7432 | python research/QA script | scripts/*RefereeingOutcomes* research scripts | no | no | no | yes | leave_untracked_private_document_only |
| scripts/runRefereeingOutcomesPipelineV1.sh | 1251 | shell pipeline script | scripts/*RefereeingOutcomes* research scripts | no | no | no | yes | leave_untracked_private_document_only |
| scripts/runRefereeingOutcomesRobustnessV1.py | 15100 | python research/QA script | scripts/*RefereeingOutcomes* research scripts | no | no | no | yes | leave_untracked_private_document_only |
| scripts/validateRefereeingOutcomesAnalysisV1.py | 8167 | python research/QA script | scripts/*RefereeingOutcomes* research scripts | no | no | no | yes | leave_untracked_private_document_only |
| scripts/validateRefereeingOutcomesSourceSnapshotV1.mjs | 18416 | node research/QA script | scripts/*RefereeingOutcomes* research scripts | no | no | no | yes | leave_untracked_private_document_only |

## Ignored Private Cache Artifacts

The following private cache artifacts are already ignored by narrow `.gitignore` rules and are not part of the visible untracked inventory:

- `data/refereeingOutcomesModels_v1/cards_model_posterior.nc`
- `data/refereeingOutcomesModels_v1/fouls_model_posterior.nc`
- `scripts/__pycache__/analyzeRefereeingOutcomesModelsV1.cpython-312.pyc`
- `scripts/__pycache__/buildRefereeingOutcomesFiguresV1.cpython-312.pyc`
- `scripts/__pycache__/buildRefereeingOutcomesNotebookV1.cpython-312.pyc`
- `scripts/__pycache__/buildRefereeingOutcomesReportV1.cpython-312.pyc`
- `scripts/__pycache__/fitRefereeingOutcomesModelsV1.cpython-312.pyc`
- `scripts/__pycache__/runRefereeingOutcomesRobustnessV1.cpython-312.pyc`
- `scripts/__pycache__/validateRefereeingOutcomesAnalysisV1.cpython-312.pyc`

## Recommendation

Use Option A: leave these files untracked and document the parking decision. The files appear private, still draft-like, and outside public loading paths. Do not move them, do not add broad ignore rules, and do not commit the private artifacts to `main`.

## QA

| Gate | Result |
| --- | --- |
| Active stage QA runner | pass - 44/44 checks |
| Public preview browser QA | pass - 0 console/page errors, 0 console warnings, 0 blocking failed requests |
| `git diff --check` | pass |

The active QA runner refreshed known volatile generated QA outputs; they were restored to committed state after QA. Public preview browser QA wrote output to `/private/tmp`.
