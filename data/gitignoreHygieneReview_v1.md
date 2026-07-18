# Gitignore Hygiene Review v1

Generated: 2026-07-18T19:45:00Z

Status: **GREEN - narrow cache ignores are safe to commit.**

## Diff Reviewed

```diff
+data/refereeingOutcomesModels_v1/*.nc
+scripts/__pycache__/
```

## Pattern Review

| Pattern | Accepted | Reason | Risk |
| --- | --- | --- | --- |
| `data/refereeingOutcomesModels_v1/*.nc` | yes | Ignores local NetCDF model-fit posterior/cache files in the private refereeing model output folder. | Low. It is scoped to one private model-fit directory and one binary cache extension. It does not ignore JSON, JS, MD, public wrappers, projections, recommendations, score data, or Team Builder artifacts. |
| `scripts/__pycache__/` | yes | Ignores Python bytecode cache created by local research/QA scripts under `scripts/`. | Low. It is scoped to the root `scripts/__pycache__/` cache directory and does not ignore source scripts. |

## Required Checks

| Check | Result |
| --- | --- |
| Includes `**pycache**/` | no |
| Includes `*.pyc` | no |
| Includes broad `*.nc` | no |
| Includes narrow model-fit/cache output | yes, `data/refereeingOutcomesModels_v1/*.nc` |
| Includes broad `data/*` | no |
| Includes broad `analysis/*` | no |
| Includes broad `*.json` | no |
| Includes broad `*.js` | no |
| Includes broad `*.md` | no |

`git check-ignore -v` matched only sample `.nc` files under `data/refereeingOutcomesModels_v1/` and sample files under `scripts/__pycache__/`. It did not match active public files, model JSON outputs, `analysis/`, or public scripts.

## Recommendation

Commit `.gitignore` and this review only. Do not stage QA reports, public wrappers, model outputs, `analysis/`, refereeing/conspiracy artifacts, or research/referee scripts.

QA status before commit:

- `git diff --check`: pass.
- `node scripts/runActiveStageQaFromManifestV1.mjs`: pass, 44/44 checks.
- Public behavior unchanged: yes. The accepted ignore patterns do not affect tracked active files or public site loading.
