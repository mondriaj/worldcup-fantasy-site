# Public Preview Browser QA Report v1

Generated: 2026-07-18T03:16:40.483Z

## Verdict

**pass - safe_to_share_final_round_public_preview**

The public preview browser QA exercised `index.html` and `world-cup.html` across desktop and mobile widths. Final Round is the public default, SF/QF/R16/R32 and MD1/MD2/MD3 remain accessible as historical views, live completed scores are shown only through the safe mapping path, Final and Third Place fixtures are known, and old public globals are absent.

## Run Context

| Item | Result |
| --- | --- |
| Base URL | http://127.0.0.1:8770 |
| Runner | scripts/runPublicPreviewBrowserQa.mjs |
| Browser executable | /Users/jordimondria/Library/Caches/ms-playwright/chromium_headless_shell-1217/chrome-headless-shell-mac-arm64/chrome-headless-shell |
| Index viewports | 5 |
| World Cup viewports | 5 |
| Screenshots | 10 |

## Core Checks

| Check | Result |
| --- | --- |
| Picks default to Final Round | pass |
| Picks exclude eliminated teams | pass |
| Final Round label visible | pass |
| Captain Watchlist opens on Final Round | pass |
| Captain Watchlist excludes eliminated teams | pass |
| Match Environment opens on Final Round | pass |
| MD1 remains accessible | pass |
| MD2 remains accessible | pass |
| Team Builder opens on Final Round | pass |
| Team Builder builds Final Round squad | pass |
| Team Builder selected players eligible | pass |
| Team Builder excludes known eliminated names | pass |
| Balanced Squad is visible | pass |
| France Player Profile opens | pass |
| Spain Player Profile opens | pass |
| England Player Profile opens | pass |
| Argentina Player Profile opens | pass |
| Messi Player Profile opens | pass |
| Mbappe Player Profile opens | pass |
| Knockout predictor renders Final Round games | pass |
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
| Matchday | finalRound |
| Strategy | balancedSquad |
| Starters / Bench | 11 / 4 |
| Eliminated selected | 0 |
| Known eliminated text in builder | no |
| Known eliminated text in picker | no |
| France selected / starters / bench | 0 / 0 / 0 |
| Spain selected / starters / bench | 7 / 3 / 4 |
| England selected / starters / bench | 0 / 0 / 0 |
| Argentina selected / starters / bench | 8 / 8 / 0 |
| Brazil selected | 0 |
| Colombia selected | 0 |
| Top country | Balanced Squad, Balanced safety, Final Round. Top country: Argentina 8/8. Fixture spread: Final Round: 0 hard, 0 favorable, 11 high-uncertainty. |

## Team Builder Selected Squad

| Area | Slot | Player | Pos | Country |
| --- | --- | --- | --- | --- |
| Starter | 1 | Lionel Messi | Forward | Argentina |
| Starter | 2 | Julián Alvarez | Forward | Argentina |
| Starter | 3 | Mikel Oyarzabal | Forward | Spain |
| Starter | 4 | Alexis Mac Allister | Midfielder | Argentina |
| Starter | 5 | Enzo Fernández | Midfielder | Argentina |
| Starter | 6 | Fabián Ruiz | Midfielder | Spain |
| Starter | 7 | Nicolás Tagliafico | Defender | Argentina |
| Starter | 8 | Nahuel Molina | Defender | Argentina |
| Starter | 9 | Lisandro Martínez | Defender | Argentina |
| Starter | 10 | Marc Cucurella | Defender | Spain |
| Starter | 11 | Emiliano Martínez | Goalkeeper | Argentina |
| Bench | 1 | Unai Simón | Goalkeeper | Spain |
| Bench | 2 | Pau Cubarsí | Defender | Spain |
| Bench | 3 | Rodrigo Hernández Cascante | Midfielder | Spain |
| Bench | 4 | Álex Baena | Midfielder | Spain |

## Data Loaded

| Dataset | Rows |
| --- | --- |
| Players sample | 100 |
| Recommendation candidates | 625 |
| Projection rows | 1659 |
| Final Round projection rows | 134 |
| SF projection rows | 100 |
| QF projection rows | 203 |
| R16 projection rows | 406 |
| R32 projection rows | 816 |
| Bracket prediction matches | 32 |
| Score fixtures | 104 |
| Official records | 1489 |
| Live fixtures | 104 |
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

- Browser QA confirms the public Final Round data path, knockout predictor, Team Builder, and live display plumbing.
- Final squads remain not source-backed.
- Team Builder remains planning help and must be checked inside the official FIFA game.
- User-specific locks, substitutions, captain state, and boosters are not imported.
