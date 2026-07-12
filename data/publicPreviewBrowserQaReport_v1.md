# Public Preview Browser QA Report v1

Generated: 2026-07-12T12:49:59.007Z

## Verdict

**pass - safe_to_share_sf_public_preview**

The public preview browser QA exercised `index.html` and `world-cup.html` across desktop and mobile widths. SF is the public default, QF/R16/R32 and MD1/MD2/MD3 remain accessible as historical views, live completed scores are shown only through the safe mapping path, all group-stage fixtures are final, and old public globals are absent.

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
| Picks default to final SF | pass |
| Final SF label visible | pass |
| Captain Watchlist opens on SF | pass |
| Match Environment opens on SF | pass |
| MD1 remains accessible | pass |
| MD2 remains accessible | pass |
| Team Builder opens on SF | pass |
| Team Builder builds SF squad | pass |
| Balanced Squad is visible | pass |
| France Player Profile opens | pass |
| Spain Player Profile opens | pass |
| England Player Profile opens | pass |
| Argentina Player Profile opens | pass |
| Messi Player Profile opens | pass |
| Mbappe Player Profile opens | pass |
| Knockout predictor renders SF games | pass |
| Visual bracket prediction renders | pass |
| Visual bracket prediction path guard | pass |
| Player Profile opens | pass |
| Current data scripts loaded | pass |
| Old globals absent | pass |
| Live group-stage support data loaded | pass |
| World Cup page renders | pass |

## Team Builder Build

| Item | Result |
| --- | --- |
| Build status | pass |
| Matchday | sf |
| Strategy | balancedSquad |
| Starters / Bench | 11 / 4 |
| France selected / starters / bench | 4 / 2 / 2 |
| Spain selected / starters / bench | 5 / 5 / 0 |
| England selected / starters / bench | 1 / 0 / 1 |
| Argentina selected / starters / bench | 5 / 4 / 1 |
| Top country | Balanced Squad, Balanced safety, SF. Top country: Argentina 5/6. Fixture spread: SF: 0 hard, 0 favorable, 11 high-uncertainty. |

## Data Loaded

| Dataset | Rows |
| --- | --- |
| Players sample | 100 |
| Recommendation candidates | 500 |
| Projection rows | 1525 |
| SF projection rows | 100 |
| QF projection rows | 203 |
| R16 projection rows | 406 |
| R32 projection rows | 816 |
| Bracket prediction matches | 32 |
| Score fixtures | 102 |
| Official records | 1489 |
| Live fixtures | 102 |
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

- Browser QA confirms the public final SF data path, knockout predictor, and live display plumbing.
- Final squads remain not source-backed.
- Team Builder remains planning help and must be checked inside the official FIFA game.
- User-specific locks, substitutions, captain state, and boosters are not imported.
