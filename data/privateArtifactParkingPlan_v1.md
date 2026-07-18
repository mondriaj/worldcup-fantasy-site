# Private Artifact Parking Plan v1

Generated: 2026-07-18T21:27:11.849Z

Status: **GREEN - choose Option A, leave untracked and document.**

## Options Reviewed

| Option | Decision | Rationale |
| --- | --- | --- |
| Option A - leave untracked and document | recommended | Safest conservative choice while the analysis remains private, draft-like, and possibly changing. No public paths load these files, and no additional ignore or move risk is introduced. |
| Option B - move to `_private/refereeing/` | not executed | Could be safe later, but moving many draft artifacts creates churn and does not materially reduce risk while they are already untracked and unreferenced by public files. |
| Option C - create private branch | document only | Useful only if the user wants version control for private analysis. Do not create or merge such a branch into `main` without an explicit future request. |

## Chosen Parking Approach

Leave the private artifacts untracked and commit only this audit/plan. No files are moved. `.gitignore` is unchanged.

## Files And Groups To Leave Untracked

- `analysis/`
- `data/refereeingOutcomes*`
- `data/refereeingOutcomes*/`
- `scripts/*RefereeingOutcomes*`

## Guardrails

- Do not stage or commit private refereeing/conspiracy artifacts to `main`.
- Do not add links or script tags for private artifacts in `index.html`, `world-cup.html`, `script.js`, or `worldCupPage.js`.
- Do not add broad ignore patterns such as `analysis/*`, `data/*`, `*.json`, `*.js`, or `*.md`.
- Keep the existing narrow cache ignores only.

## Optional Future Commands, Not Executed

If private version control becomes useful later, create a separate private branch deliberately:

```bash
git switch -c private/refereeing-outcomes-draft
# Review and stage only private-analysis files on that private branch.
# Do not merge the branch into main while the analysis is private.
```

If a dedicated private folder is later desired, do it in a separate prompt with explicit approval and another public-exposure check.

## Commit Scope

Commit only:

- `data/privateArtifactParkingAudit_v1.json`
- `data/privateArtifactParkingAuditReport_v1.md`
- `data/privateArtifactParkingPlan_v1.md`

Do not stage private artifacts or public-site files.

## QA

| Gate | Result |
| --- | --- |
| Active stage QA runner | pass - 44/44 checks |
| Public preview browser QA | pass |
| `git diff --check` | pass |

Public behavior remains unchanged. No private artifacts were moved, staged, or loaded by public pages.
