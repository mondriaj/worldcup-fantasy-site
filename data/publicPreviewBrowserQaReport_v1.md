# Public Preview Browser QA Report v1

Generated: 2026-06-28T02:23:21.567Z

## Verdict

**pass - safe_to_share_r32_provisional_public_preview**

The public preview browser QA exercised `index.html` and `world-cup.html` across desktop and mobile widths. Provisional R32 is the public default, MD1/MD2/MD3 remain accessible as historical views, live completed scores are shown only through the safe mapping path, unfinished Match 69/70 are not shown final, and old public globals are absent.

## Run Context

| Item | Result |
| --- | --- |
| Base URL | http://127.0.0.1:8766 |
| Runner | scripts/runPublicPreviewBrowserQa.mjs |
| Browser executable | /Users/jordimondria/Library/Caches/ms-playwright/chromium_headless_shell-1217/chrome-headless-shell-mac-arm64/chrome-headless-shell |
| Index viewports | 5 |
| World Cup viewports | 5 |
| Screenshots | 10 |

## Core Checks

| Check | Result |
| --- | --- |
| Picks default to R32 | pass |
| Provisional label visible | pass |
| Captain Watchlist opens on R32 | pass |
| Match Environment opens on R32 | pass |
| MD1 remains accessible | pass |
| MD2 remains accessible | pass |
| Team Builder opens on R32 | pass |
| Knockout predictor renders | pass |
| Player Profile opens | pass |
| Current data scripts loaded | pass |
| Old globals absent | pass |
| Live group-stage support data loaded | pass |
| World Cup page renders | pass |

## Data Loaded

| Dataset | Rows |
| --- | --- |
| Players sample | 100 |
| Recommendation candidates | 250 |
| Projection rows | 1946 |
| R32 projection rows | 713 |
| Known knockout predictions | 14 |
| Score fixtures | 86 |
| Official records | 1489 |
| Live fixtures | 86 |
| Live players | 1489 |

## Console, Network, And Layout

| Metric | Count |
| --- | --- |
| Console/page errors | 0 |
| Console warnings | 0 |
| Failed requests | 6 |
| Blocking failed requests | 0 |
| Ignored non-blocking failed requests | 6 |
| Index overflow viewports | 0 |
| World Cup overflow viewports | 0 |
| Profile click failures | 0 |
| Old globals present | 0 |
| Missing active globals | 0 |

## Screenshots

- /private/tmp/public_preview_browser_qa_screenshots/index-360.png
- /private/tmp/public_preview_browser_qa_screenshots/index-390.png
- /private/tmp/public_preview_browser_qa_screenshots/index-768.png
- /private/tmp/public_preview_browser_qa_screenshots/index-1024.png
- /private/tmp/public_preview_browser_qa_screenshots/index-1440.png
- /private/tmp/public_preview_browser_qa_screenshots/world-cup-360.png
- /private/tmp/public_preview_browser_qa_screenshots/world-cup-390.png
- /private/tmp/public_preview_browser_qa_screenshots/world-cup-768.png
- /private/tmp/public_preview_browser_qa_screenshots/world-cup-1024.png
- /private/tmp/public_preview_browser_qa_screenshots/world-cup-1440.png

## Remaining Limits

- Browser QA confirms the public provisional R32 data path, knockout predictor, and live display plumbing.
- Final squads remain not source-backed.
- Team Builder remains planning help and must be checked inside the official FIFA game.
- User-specific locks, substitutions, captain state, and boosters are not imported.
