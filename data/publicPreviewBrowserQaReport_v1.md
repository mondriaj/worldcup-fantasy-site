# Public Preview Browser QA Report v1

Generated: 2026-06-22T14:18:03.944Z

## Verdict

**pass - safe_to_share_md2_public_preview**

The public preview browser QA exercised `index.html` and `world-cup.html` across desktop and mobile widths. MD2 remains the public default, MD1 remains accessible, live completed scores are shown only through the safe mapping path, and old public globals are absent.

## Run Context

| Item | Result |
| --- | --- |
| Base URL | http://127.0.0.1:8774 |
| Runner | scripts/runPublicPreviewBrowserQa.mjs |
| Browser executable | /Users/jordimondria/Library/Caches/ms-playwright/chromium_headless_shell-1217/chrome-headless-shell-mac-arm64/chrome-headless-shell |
| Index viewports | 5 |
| World Cup viewports | 5 |
| Screenshots | 10 |

## Core Checks

| Check | Result |
| --- | --- |
| Picks default to MD2 | pass |
| Captain Watchlist opens on MD2 | pass |
| Match Environment opens on MD2 | pass |
| MD1 remains accessible | pass |
| Team Builder opens on MD2 | pass |
| Player Profile opens | pass |
| Current data scripts loaded | pass |
| Old globals absent | pass |
| Live MD1/MD2 support data loaded | pass |
| World Cup page renders | pass |

## Data Loaded

| Dataset | Rows |
| --- | --- |
| Players sample | 100 |
| Recommendation candidates | 500 |
| Projection rows | 3699 |
| MD2 projection rows | 1233 |
| Score fixtures | 72 |
| Official records | 1488 |
| Live fixtures | 72 |
| Live players | 1488 |

## Console, Network, And Layout

| Metric | Count |
| --- | --- |
| Console/page errors | 0 |
| Console warnings | 0 |
| Failed requests | 5 |
| Blocking failed requests | 0 |
| Ignored non-blocking failed requests | 5 |
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

- Browser QA confirms the public MD2 data path and live display plumbing; it does not promote MD3.
- Final squads remain not source-backed.
- Team Builder remains planning help and must be checked inside the official FIFA game.
- User-specific locks, substitutions, captain state, and boosters are not imported.
