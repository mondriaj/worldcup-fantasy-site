# QA Report Churn Review v1

Generated: 2026-07-18T19:55:00Z

Status: **GREEN - report diffs are volatile run metadata only.**

## Scope

Reviewed only:

- `data/activeStageQaRunReport_v1.md`
- `data/publicPreviewBrowserQaReport_v1.md`

No model outputs, public wrappers, public files, `analysis/`, refereeing/conspiracy files, or research/referee scripts were changed.

## Report Classifications

| Report | Changed lines | Classification | Pass/fail changed | Check count changed | Failure/warning changed | Browser assertions changed | Recommendation |
| --- | ---: | --- | --- | --- | --- | --- | --- |
| `data/activeStageQaRunReport_v1.md` | 39 added / 39 removed | run-duration/order-only plus generated timestamp | no, remained pass with 44 passed / 0 failed / 0 required failed | no, remained 44 checks | no | no | revert to committed state |
| `data/publicPreviewBrowserQaReport_v1.md` | 1 added / 1 removed | timestamp-only | no | no | no, console/page errors, warnings, failed requests, blocking failures, overflow counts, and profile-click failures unchanged | no | revert to committed state |

## Details

`data/activeStageQaRunReport_v1.md` changed its `Generated:` timestamp and per-check duration values. The required check IDs and statuses were unchanged, and every check stayed `pass`.

`data/publicPreviewBrowserQaReport_v1.md` changed only its `Generated:` timestamp. Public browser QA summary values stayed unchanged:

- Console/page errors: 0
- Console warnings: 0
- Failed requests: 5
- Blocking failed requests: 0
- Ignored non-blocking failed requests: 5
- Index overflow viewports: 0
- World Cup overflow viewports: 0
- Profile click failures: 0

## Decision

Revert both tracked QA report files to committed state. Do not commit the reverted reports. Commit this review only if post-revert QA passes and staged scope remains limited to `data/qaReportChurnReview_v1.md`.

## QA

- `node scripts/runActiveStageQaFromManifestV1.mjs`: pass, 44/44 checks.
- `node scripts/runPublicPreviewBrowserQa.mjs`: pass, with output redirected to `/private/tmp`; 0 console/page errors, 0 console warnings, 0 blocking failed requests.
- `git diff --check`: pass.

The active QA runner regenerated volatile report and QA-output files. Reinspection showed the two target reports remained timestamp/run-metadata-only churn, so they were reverted again after QA.

Final commit recommendation: commit this review only.
