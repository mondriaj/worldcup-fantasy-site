# Launch Release v1

Date: 2026-06-05

## Release Marker

- Current branch: `main`
- Current HEAD before this release note: `08536a4dc54b206ef9400a6220a5dbf8b61fea4f`
- Intended release tag: `launch-ready-v1`
- Tag target: the commit that adds this release note.
- Remote status before this note: local `main`, local `origin/main`, and remote `refs/heads/main` all pointed to `08536a4dc54b206ef9400a6220a5dbf8b61fea4f`.

## Public Site Status

Status: launch-ready for the current static GitHub Pages site.

- Home, Picks, Team Builder, Matchday Desk, Fantasy Finance, World Cup Guide, Model Notes, and the separate World Cup page are present in the static site.
- Browser-ready data files remain loaded before `script.js`.
- No runtime data fetch was added for player, rules, or score prediction JSON files.
- The site is independent and not official FIFA fantasy advice.
- Users should confirm rules, deadlines, locks, boosters, squad legality, played/unplayed state, lineups, and live-game details inside the official FIFA game.

## Core Features Verified

Recent launch checks verified:

- `index.html` and `world-cup.html` load from a local server.
- Public preview browser QA passed without console errors, failed requests, profile failures, or page overflow.
- Launch browser QA passed and built a full 15-player Team Builder squad.
- Player cards render with the simplified one-badge rule.
- Player Profile, Add to Builder, Squad Builder Starter, Pick Explorer, Team Builder, Squad Strategy Report, Strategy Comparison, Match Environment, Matchday Desk, World Cup Guide, and export/import flows remained available.
- Match Environment retained 72 group-stage fixtures and the cleaned public fields: Projected xG, Win / Draw / Win, Most Likely Score, Match Uncertainty, and Clean-Sheet Context.

## Current Model Status

- No model outputs changed for this release marker.
- No generated player data, recommendation data, score prediction data, fantasy rules data, or Team Builder strategy weights changed for this release marker.
- Active recommendations use the official fantasy pool and existing static browser bundles.
- Active Match Environment context uses the current fantasy score projection source with the existing static backup.
- Team Builder strategy behavior remains unchanged.

## Data Gate Status

- Ownership-only changes do not require model reruns.
- Rules, price, position, selectable status, scoring, player, PELE, role, or final-squad changes should follow `data/launchOperationsChecklist_v1.md` before any public data promotion.
- Official fantasy rules wording has been refreshed for the current launch state; future rules or help-text changes should follow the operations checklist before any public data promotion.
- Deeper model refreshes remain gated by the official-data and source-readiness checks described in the operations checklist.

## Checks Run For This Release Note

- `node --check script.js`
- `node --check worldCupPage.js`
- `git diff --check`
- No runtime `fetch()` was found in the public page scripts.
- Static browser data files still load before `script.js`.
- No tracked generated player, rules, recommendation, score prediction, or Team Builder strategy data files are changed in this release note diff.
- `index.html` returned HTTP 200 from a local server.
- `world-cup.html` returned HTTP 200 from a local server.
- Public preview browser QA passed.
- Launch browser QA passed.

## Known Limits

- This site is a planning helper, not official FIFA fantasy advice.
- It does not track live scores, lineups, official deadlines, official locks, played/unplayed state, or live fantasy-game legality.
- Score projections are model estimates, not official projections or live match facts.
- Team Builder outputs should be checked inside the official game before users save or act.
- Support link, custom domain, canonical URL, and social preview image remain pending until real production inputs are available.

## Next Recommended Action

- The site is launch-ready.
- Continue normal monitoring using `data/launchOperationsChecklist_v1.md`.
- Do not rerun models for ownership-only changes.
- Run official data refresh only if player price, position, selectable status, player pool, scoring, squad, rule, deadline, or PELE data changes.
- Add Google Analytics, support link, or custom domain only when real values are available.

## Unrelated Worktree Items Left Untouched

The release note was prepared with unrelated modified and untracked files already present in the worktree. They were intentionally left unstaged, uncommitted, unreverted, and undeleted.

Modified files left untouched:

- `data/finalSquadSourcePlan_v1.md`
- `data/officialDataSourceManifest_v1.json`
- `scripts/buildFantasyPoolFinanceMetrics.mjs`

Untracked files left untouched:

- `.DS_Store`
- `World_Cup_Fantasy_Helper_Audit_Report.md`
- `World_Cup_Fantasy_Helper_Revision_Plan_Roadmap.md`
- `data/fantasyPoolFinanceBridgeRoadmap_v1.md`
- `data/finalSquadFeedDiscoveryReport_v1.md`
- `data/finalSquadSourceAudit_v1.md`
- `data/imports/officialSquads_MANUAL_TEMPLATE.csv`
- `data/manualFinalSquadSourcingGuide_v1.md`
- `data/manualFinalSquadSourcingQueue_v1.csv`
- `data/officialRulesWarningResolutionReport_v1.md`
- `data/officialRulesWarningResolutionReport_v2.md`
- `data/playerFinanceBridgeQa_v1.json`
- `data/playerFinanceBridgeReport_v1.md`
- `data/playerFinanceBridge_v2_to_v3.json`
- `data/playerFinanceMetricsQa_fantasyPool_v2.json`
- `data/playerFinanceMetricsReport_fantasyPool_v2.md`
- `data/playerFinanceMetrics_fantasyPool_v2.json`
- `data/recommendationSession6Review_v1.md`
- `data/recommendationUiControlArchitecture_v1.md`
- `scripts/auditFantasyPoolFinanceBridge.mjs`
- `scripts/buildFantasyPoolFinanceBridge.mjs`
- `scripts/validateManualFinalSquadRows.mjs`
