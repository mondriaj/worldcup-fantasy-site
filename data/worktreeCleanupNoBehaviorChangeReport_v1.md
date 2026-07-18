# Worktree Cleanup No-Behavior-Change Report v1

Generated: 2026-07-18T19:35:00Z

Status: **GREEN - scoped cleanup completed; public behavior unchanged.**

## Cleanup Summary

| Metric | Before Cleanup | After Cleanup Before Reports |
| --- | ---: | ---: |
| Dirty status entries | 85 | 35 |
| Tracked dirty files | 54 | 3 |
| Untracked status entries | 31 | 32 |
| Untracked files from `git ls-files --others --exclude-standard` | 35 | 36 |

The extra untracked entry after cleanup is `data/worktreeCleanupExecutionPlan_v1.md`, created by this prompt.

## Files Reverted

51 tracked files were restored to committed state. The reverted set is listed in `data/worktreeCleanupExecutionPlan_v1.md` under "A. Revert Tracked Timestamp-Only Or Non-Material Churn".

This included the two public wrappers previously classified as timestamp-only churn:

- `fantasyPoolFinanceMetricsData.js`
- `finalRoundFixtureAuthorityData.js`

## Files Removed

None. No untracked files were classified as safe generated clutter.

## Files Left Untouched

- `.gitignore`
- `data/activeStageQaRunReport_v1.md`
- `data/publicPreviewBrowserQaReport_v1.md`
- `analysis/`
- `data/refereeingOutcomes*`
- `data/refereeingOutcomes*/`
- `scripts/*RefereeingOutcomes*`

## QA Evidence

| Gate | Result |
| --- | --- |
| Active stage QA runner | pass - 44/44 checks |
| Team Builder golden Final Round | pass |
| Final Round browser equivalence | pass |
| Public preview browser QA | pass |
| `git diff --check` | pass |

## Behavior Evidence

| Check | Result |
| --- | --- |
| Active eligible teams unchanged | pass |
| Public default unchanged | pass |
| No eliminated active player leakage | pass |
| No public refereeing/conspiracy exposure | pass |
| Model output values unchanged | pass |
| Public wrappers clean/reverted to committed state | pass |

## Conclusion

Cleanup is cleanly scoped. The worktree now leaves only intentionally untouched private/manual-review files dirty, plus these cleanup report artifacts. Commit only the cleanup reports and do not stage `.gitignore`, public wrappers, model output JSON, projections, recommendations, score data, Team Builder artifacts, `analysis/`, or refereeing/research files.
