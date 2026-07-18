# Worktree Hygiene Plan v1

Generated: 2026-07-18T19:08:44.180Z

Status: **YELLOW - documentation-only plan; no destructive cleanup recommended in this prompt.**

## Files To Leave Untouched

- All model output artifacts: `data/fantasyPoolRecommendations_finalRound_v1.json`, `data/fantasyPoolMatchdayProjections_finalRound_v1.json`, `data/scorePredictions_fantasyPool_finalRound_v1.json`, `data/finalRoundFixtureAuthority_v1.json`, `data/playerRoleModel_finalRound_v1.json`, public wrappers such as `fantasyPoolFinanceMetricsData.js` and `finalRoundFixtureAuthorityData.js`, and related generated model QA outputs.
- All refereeing/conspiracy analysis drafts under `data/refereeingOutcomes*`, `data/refereeingOutcomes*/`, `scripts/*RefereeingOutcomes*`, and `analysis/`.
- `.gitignore` until the user approves a separate ignore-only hygiene commit.

## Files Safe To Revert

- Some generated QA/report files appear to be timestamp-only or validator-rerun churn, but others include changed counts from prior model output changes. Do not revert automatically in this prompt. A safe revert pass should compare each generated report against its source artifact and run QA afterward.

## Files Safe To Delete

- None identified as clearly safe to delete. The untracked referee files may be useful drafts, and no temp-only duplicate files were found in the repo tree.

## Files To Keep Untracked

- Refereeing/conspiracy analysis drafts and pipeline scripts should stay untracked/private unless there is an explicit future post-tournament publication decision.
- `analysis/` should remain a scratch/private area for now.

## Files To Add To `.gitignore`

- Proposed separate commit, only if approved: keep the existing `.gitignore` additions for `data/refereeingOutcomesModels_v1/*.nc` and `scripts/__pycache__/`.
- Do not add broad ignores for `data/refereeingOutcomes*` or `analysis/` without a deliberate policy decision; broad ignores can hide real work.

## Files To Commit Separately

- This audit and plan only: `data/worktreeHygieneAudit_v1.json`, `data/worktreeHygieneAuditReport_v1.md`, and `data/worktreeHygienePlan_v1.md`.
- Optional later: a narrow `.gitignore` commit for cache/model-fit byproducts.
- Do not commit public wrappers, generated fantasy model outputs, or referee/conspiracy drafts in a hygiene commit.

## Risks

- Some dirty model artifacts are one-line JSON files where Git shows the whole line changed; they may contain material model output changes, not just timestamps.
- Public wrappers are loaded by the site. Reverting or committing them casually can change public behavior.
- Refereeing/conspiracy work is not public-ready and must remain out of public wiring.

## Recommended Commands

```bash
# Documentation-only commit, if desired
git add data/worktreeHygieneAudit_v1.json data/worktreeHygieneAuditReport_v1.md data/worktreeHygienePlan_v1.md
git commit -m "Document worktree hygiene plan"
git push

# Optional future ignore-only commit after approval
git add .gitignore
git commit -m "Ignore local referee model cache files"
git push

# Optional future generated-output revert pass after explicit approval
# Review each file first; do not use broad checkout/reset.
git diff -- <file>
git restore -- <file>
```
