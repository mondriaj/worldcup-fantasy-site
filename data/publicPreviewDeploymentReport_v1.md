# Official Fantasy Pool Preview Deployment Report v1

Generated: 2026-06-02T20:13:28Z

## Deployment Summary

- Deployment verdict: deployed_public_preview_with_warnings
- Release commit: `e32bb66c6c35fb53cce732a3b8613ad4169445d3`
- Deployment method: pushed `main` to `origin` for the existing static GitHub Pages site.
- Live URL checked: `https://mondriaj.github.io/worldcup-fantasy-site/`
- Live QA completed: 2026-06-02T20:13:10.252Z
- Readiness state: still `blocked_waiting_for_official_fantasy_data`, as expected.

## Live Checks Passed

- Homepage loaded.
- `world-cup.html` loaded.
- Official Fantasy Pool Preview warning was visible.
- Quick Picks rendered with preview candidates.
- Captain Picks rendered with preview candidates.
- Team Advice rendered with preview candidates.
- Player Profile opened from Quick Picks, Captain Picks, and Team Advice.
- Player Profile showed official price and position context.
- Team Builder warning was visible and still described prototype/blocked status.
- No final-squad-backed claim was found.
- Preview data globals loaded:
  - recommendation candidates: 500
  - matchday projections: 3,768
  - finance metrics: 1,256
  - score predictions: 72
  - official data status: loaded
- Legacy fallback rendered when preview globals were disabled.
- Browser console errors: 0
- Browser console warnings: 0
- Failed requests: 0
- Page-level horizontal overflow: none at 360px, 390px, 768px, 1024px, or 1440px.

## Live Issues Found

None found in the deployment QA pass.

## Rollback Instructions

1. Revert release commit `e32bb66c6c35fb53cce732a3b8613ad4169445d3`.
2. Push the revert to `origin/main`.
3. Confirm the public homepage no longer loads the preview browser-ready files:
   - `fantasyPoolRecommendationsData.js`
   - `fantasyPoolMatchdayProjectionsData.js`
   - `fantasyPoolFinanceMetricsData.js`
   - `fantasyPoolScorePredictionsData.js`
   - `fantasyPoolOfficialDataStatusData.js`
4. Confirm legacy files still render:
   - `financePlayersData.js`
   - `matchdayProjectionsData.js`
   - `scorePredictionsData.js`
   - `playersData.js`
5. Rerun the browser smoke checklist from `data/publicPreviewPromotionRunbook_v1.md`.

## Remaining Blockers Before Final Promotion

- Final squads are not source-backed.
- Official rules still have manual-review warnings for Mystery Booster behavior and deadline semantics.
- Final score predictions, matchday projections, recommendations, and Team Builder inputs have not been rerun from final-squad-backed data.
- Team Builder remains prototype/blocked and must not be promoted as official.
- Browser-ready final recommendation files have not been generated.

## Status

The Official Fantasy Pool Preview is safe to deploy publicly with the existing warnings. Final-squad-backed recommendations and Team Builder promotion remain blocked.
