# Public Preview Browser QA Report v1

Generated: 2026-07-03T22:11:49.490Z

## Verdict

**pass - safe_to_share_r16_provisional_public_preview**

The public preview browser QA exercised `index.html` and `world-cup.html` across desktop and mobile widths. Provisional R16 is the public default, R32 and MD1/MD2/MD3 remain accessible as historical views, live completed scores are shown only through the safe mapping path, all group-stage fixtures are final, and old public globals are absent.

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
| Picks default to provisional R16 | pass |
| Provisional R16 label visible | pass |
| Captain Watchlist opens on R16 | pass |
| Match Environment opens on R16 | pass |
| MD1 remains accessible | pass |
| MD2 remains accessible | pass |
| Team Builder opens on R16 | pass |
| Knockout predictor renders actual R16 games | pass |
| Visual bracket prediction renders | pass |
| Visual bracket prediction path guard | pass |
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
| Projection rows | 1119 |
| R16 projection rows | 303 |
| R32 projection rows | 816 |
| Bracket prediction matches | 32 |
| Score fixtures | 96 |
| Official records | 1489 |
| Live fixtures | 94 |
| Live players | 1489 |

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

- Browser QA confirms the public provisional R16 data path, knockout predictor, and live display plumbing.
- Final squads remain not source-backed.
- Team Builder remains planning help and must be checked inside the official FIFA game.
- User-specific locks, substitutions, captain state, and boosters are not imported.
