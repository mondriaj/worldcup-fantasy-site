# Public Preview Browser QA Report v1

Generated: 2026-06-02T20:03:47.690Z

## Verdict

**safe_to_deploy_as_official_fantasy_pool_preview_with_warnings**

The Official Fantasy Pool Preview passed real browser QA as a clearly labeled public preview. It remains blocked from final-squad-backed promotion and Team Builder promotion.

## Pages Tested

- `http://127.0.0.1:8766/index.html`
- `http://127.0.0.1:8766/world-cup.html`

Browser runner:

- `scripts/runPublicPreviewBrowserQa.mjs`
- Headless Chromium executable: `/Users/jordimondria/Library/Caches/ms-playwright/chromium_headless_shell-1217/chrome-headless-shell-mac-arm64/chrome-headless-shell`

Screenshots captured:

- `/private/tmp/public_preview_browser_qa_screenshots/index-360.png`
- `/private/tmp/public_preview_browser_qa_screenshots/index-390.png`
- `/private/tmp/public_preview_browser_qa_screenshots/index-768.png`
- `/private/tmp/public_preview_browser_qa_screenshots/index-1024.png`
- `/private/tmp/public_preview_browser_qa_screenshots/index-1440.png`
- `/private/tmp/public_preview_browser_qa_screenshots/index-390-fallback.png`
- `/private/tmp/public_preview_browser_qa_screenshots/world-cup-360.png`
- `/private/tmp/public_preview_browser_qa_screenshots/world-cup-390.png`
- `/private/tmp/public_preview_browser_qa_screenshots/world-cup-768.png`
- `/private/tmp/public_preview_browser_qa_screenshots/world-cup-1024.png`
- `/private/tmp/public_preview_browser_qa_screenshots/world-cup-1440.png`

## Viewports Tested

- 360px
- 390px
- 768px
- 1024px
- 1440px

## Console And Network

- Console errors: 0
- Console warnings: 0
- Failed requests: 0
- Page errors: 0
- Failed script loads: 0
- Undefined preview globals found: 0

## Preview Data Load Status

Passed.

- `fantasyPoolRecommendationsData.js`: loaded
- `fantasyPoolMatchdayProjectionsData.js`: loaded
- `fantasyPoolFinanceMetricsData.js`: loaded
- `fantasyPoolScorePredictionsData.js`: loaded
- `fantasyPoolOfficialDataStatusData.js`: loaded

Loaded preview globals:

- Recommendation candidates: 500
- Preview projection rows: 3,768
- Preview finance metric players: 1,256
- Preview score fixtures: 72
- Official preview status object: present

Legacy fallback globals also remained present:

- Legacy finance players: 1,335
- Legacy matchday projections: 4,005
- Legacy score fixtures: 72

## Public Recommendation Sections

Passed.

Quick Picks rendered preview cards:

- Balanced Preview
- Captain Alpha Preview
- Safe Preview
- Differential Preview
- Upside Preview

Example preview players rendered:

- Lionel Messi
- Harry Kane
- Bruno Miguel Borges Fernandes
- Charles De Ketelaere
- Kylian Mbappe

Captain Picks rendered preview candidates. Team Advice rendered preview candidates. Match Environment still rendered fixture rows.

## Fallback Status

Passed.

A fallback test intentionally disabled all `fantasyPool*.js` globals. The site rendered legacy recommendations instead of preview cards, confirming the fallback path works.

Fallback labels observed:

- Best Overall
- Captain Candidate
- Reliable Pick
- Best Value Prototype
- Attack Heavy
- Very Risky Upside

## Warning Verification

Passed.

Visible warning/status copy includes:

- Official Fantasy Pool Preview
- official fantasy prices, positions, and scoring
- final squad status is not source-backed
- recommendations may change
- rules still have manual-review warnings
- Mystery Booster unknown
- deadline semantics under review

## Team Builder Warning

Passed.

Team Builder remains clearly marked prototype/blocked. The warning is visible before builder actions and says generated squads should not be treated as final.

Team Builder was not promoted to official. Preview recommendation data is not used as final Team Builder data.

## Click-Test Results

Passed.

- Quick Picks render: pass
- Captain Picks render: pass
- Team Advice render: pass
- Team Advice position filter: pass
- Team Advice matchday filter: pass
- Player Profile opens from Quick Picks: pass
- Player Profile opens from Captain Picks: pass
- Player Profile opens from Team Advice: pass
- Player Profile shows official price context: pass
- Player Profile shows position context: pass
- Player Profile shows preview/final-squad warning context: pass
- Player Profile closes cleanly: pass
- Match Environment renders: pass
- World Cup page renders: pass

## Mobile And Overflow

Passed after one CSS fix.

Final QA result:

- Index page overflow: none at 360, 390, 768, 1024, or 1440
- World Cup page overflow: none at 360, 390, 768, 1024, or 1440
- Warnings readable: pass
- Recommendation cards/tables readable: pass
- Player Profile usable: pass
- Team Builder warning readable: pass
- Navigation clickable: pass
- Tables use contained overflow where needed: pass

## Bugs Found

1. **Homepage page-level overflow at 1024px**
   - Cause: Team Builder summary chips used a fixed five-column grid while the builder sidebar still consumed width.
   - Impact: page-level horizontal scroll at 1024px.
   - Fixed: changed `.team-summary` to auto-wrap with `repeat(auto-fit, minmax(120px, 1fr))`.

2. **Stale World Cup page status copy**
   - Cause: `world-cup.html` still said fantasy picks were not fixture-adjusted and prices/rules were pending.
   - Impact: not a data-loading failure, but it contradicted the public preview state.
   - Fixed: updated only the status sentences to say main-page recommendations are Official Fantasy Pool Preview and final-squad-backed promotion remains blocked.

## Bugs Fixed

- Team Builder summary-chip overflow at 1024px.
- Stale tournament-page status copy.

## Remaining Bugs

No preview-blocking browser bugs remain from this QA pass.

## Deployment Status

The preview is safe to deploy as **Official Fantasy Pool Preview** with the existing warnings.

It is not safe to deploy as final-squad-backed recommendations. Team Builder remains prototype/blocked.

## Remaining Final-Promotion Blockers

- Final squads are not source-backed.
- Mystery Booster effect remains under review.
- Deadline semantics remain under review.
- Final-squad-backed model reruns are still blocked.
- Team Builder promotion remains blocked.
