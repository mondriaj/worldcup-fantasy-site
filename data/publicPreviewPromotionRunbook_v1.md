# Public Preview Promotion Runbook v1

## Scope

Promotion label: Official Fantasy Pool Preview.

This promotion shows staged fantasy-pool recommendation candidates publicly with warnings. It does not promote final-squad-backed recommendations, Team Builder, captain/substitution tools, or active v2 model files.

## New Browser-Ready Files

- `fantasyPoolRecommendationsData.js`
- `fantasyPoolMatchdayProjectionsData.js`
- `fantasyPoolFinanceMetricsData.js`
- `fantasyPoolScorePredictionsData.js`
- `fantasyPoolOfficialDataStatusData.js`

Generator:

- `scripts/buildFantasyPoolPreviewBrowserData.mjs`

Primary staged sources:

- `data/matchdayRecommendations_fantasyPool_v3.json`
- `data/playerMatchdayProjections_fantasyPool_v3.json`
- `data/playerFinanceMetrics_fantasyPool_v1.json`
- `data/scorePredictions_fantasyPool_v3.json`
- `data/publicPreviewPromotionReadinessQa_v1.json`

## Rollback

To revert public recommendation sections to the old prototype path:

1. Remove the five `fantasyPool*.js` script tags from `index.html`.
2. Keep `financePlayersData.js`, `matchdayProjectionsData.js`, `scorePredictionsData.js`, `playersData.js`, and `fantasyRulesData.js` loaded before `script.js`.
3. Revert the `script.js` preview branch changes or leave them dormant; without `FANTASY_POOL_*` globals, the current fallback path uses the legacy data arrays.
4. Restore the previous static warning copy in `index.html`, `README.md`, and `SITE_FEATURES.md` if the preview is pulled from public view.

Old active files are preserved and should not be deleted:

- `matchdayRecommendationsData.js`, if present
- `matchdayProjectionsData.js`
- `scorePredictionsData.js`
- `financePlayersData.js`
- `playersData.js`

## Smoke-Test Checklist

- Homepage loads with no console errors.
- Quick Picks render Official Fantasy Pool Preview candidates.
- Captain Picks render preview candidates.
- Team Advice renders preview candidates and respects matchday/position controls.
- Preview warning appears near recommendation sections.
- Team Builder warning says prototype/blocked and does not claim final squad readiness.
- Player Profile opens from preview candidate names.
- Old data files remain present.
- Mobile width has no page-level horizontal overflow.

## Stop Conditions

Pull back or do not publish the preview if any of these are true:

- Preview recommendations do not render.
- Preview warnings are missing.
- Team Builder appears promoted as official or final.
- Final squad uncertainty is hidden.
- Rules warnings are hidden.
- Browser-ready preview files fail to parse.
- `node scripts/validateOfficialDataReadiness.mjs` unexpectedly reports final readiness.

## Remaining Final-Promotion Blockers

- Final squads are not source-backed.
- Mystery Booster effect remains under review.
- Deadline semantics remain under review.
- Team Builder remains prototype/blocked.
- Final public recommendations require a separate final-squad-backed promotion.
