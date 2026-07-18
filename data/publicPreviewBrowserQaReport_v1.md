# Public Preview Browser QA Report v1

Generated: 2026-07-18T17:28:55.709Z

## Verdict

**pass - safe_to_share_final_round_public_preview**

The public preview browser QA exercised `index.html` and `world-cup.html` across desktop and mobile widths. Final Round is the public default, SF/QF/R16/R32 and MD1/MD2/MD3 remain accessible as historical views, live completed scores are shown only through the safe mapping path, Final and Third Place fixtures are known, and old public globals are absent.

## Run Context

| Item | Result |
| --- | --- |
| Base URL | http://127.0.0.1:8772 |
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
| Team Builder explains fixture exposure | pass |
| Third Place strategy visible | pass |
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

## Exact Content Assertions

| Surface | Result |
| --- | --- |
| Picks | pass |
| Captain Watchlist | pass |
| Match Environment | pass |
| Player Profile | pass |
| Team Builder Golden | pass |
| Eliminated leakage | pass |

## Exact Content Samples

| Surface | Sample |
| --- | --- |
| Picks | [{"name":"Lionel Messi","country":"Spain","stage":"final","text":"TOP PROJECTION Lionel Messi Argentina · Fantasy position: Forward 5.2 projected points for Final Round · 88.8% start chance Final Round vs Spain · neutral Starter pack: highest projected return from the filtered pool. Caution: Watch squad b"},{"name":"Kylian Mbappé","country":"France","stage":"final","text":"CORE PICK Kylian Mbappé France · Fantasy position: Forward 4.1 projected points for Final Round · 59.1% start chance Final Round vs England · neutral Starter pack: reliable core option balancing projected return, starts, and minutes. Cautio"},{"name":"Harry Kane","country":"France","stage":"final","text":"CORE PICK Harry Kane England · Fantasy position: Forward 4.1 projected points for Final Round · 58.6% start chance Final Round vs France · neutral Starter pack: reliable core option balancing projected return, starts, and minutes. Caution: "},{"name":"Julián Alvarez","country":"Spain","stage":"final","text":"HIGH-FLOOR PICK Julián Alvarez Argentina · Fantasy position: Forward 5.2 projected points for Final Round · 88.8% start chance Final Round vs Spain · neutral Starter pack: safer-minutes option with lower downside. Caution: Watch squad budge"},{"name":"Mikel Oyarzabal","country":"Spain","stage":"final","text":"UPSIDE PICK Mikel Oyarzabal Spain · Fantasy position: Forward 5 projected points for Final Round · 89% start chance Final Round vs Argentina · neutral Starter pack: ceiling-focused option in a stronger attacking spot. Fixture note: High-var"},{"name":"Nicolás Tagliafico","country":"Spain","stage":"final","text":"BUDGET ENABLER Nicolás Tagliafico Argentina · Fantasy position: Defender 3.7 projected points for Final Round · 88.8% start chance Final Round vs Spain · neutral Starter pack: lower-price player with a playable role. Fixture note: Tight mat"},{"name":"Nahuel Molina","country":"Spain","stage":"final","text":"VALUE PICK Nahuel Molina Argentina · Fantasy position: Defender 3.7 projected points for Final Round · 88.8% start chance Final Round vs Spain · neutral Starter pack: strong projected return for the price. Fixture note: Tight matchup. Cauti"},{"name":"Leandro Paredes","country":"Spain","stage":"final","text":"DIFFERENTIAL PICK Leandro Paredes Argentina · Fantasy position: Midfielder 4.4 projected points for Final Round · 88.8% start chance Final Round vs Spain · neutral Starter pack: less obvious pick that still projects well. Fixture note: High"}] |
| Captain Watchlist | [{"name":"Lionel Messi","country":"Spain","stage":"final","text":"TOP PROJECTION Lionel Messi Argentina · Fantasy position: Forward 5.2 projected points for Final Round · 88.8% start chance Final Round vs Spain · neutral Captain watchlist based on projected points, matchup, start chance, and downside. Vie"},{"name":"Julián Alvarez","country":"Spain","stage":"final","text":"TOP PROJECTION Julián Alvarez Argentina · Fantasy position: Forward 5.2 projected points for Final Round · 88.8% start chance Final Round vs Spain · neutral Captain watchlist based on projected points, matchup, start chance, and downside. V"},{"name":"Mikel Oyarzabal","country":"Spain","stage":"final","text":"TOP PROJECTION Mikel Oyarzabal Spain · Fantasy position: Forward 5 projected points for Final Round · 89% start chance Final Round vs Argentina · neutral Captain watchlist based on projected points, matchup, start chance, and downside. Caut"},{"name":"Leandro Paredes","country":"Spain","stage":"final","text":"TOP PROJECTION Leandro Paredes Argentina · Fantasy position: Midfielder 4.4 projected points for Final Round · 88.8% start chance Final Round vs Spain · neutral Captain watchlist based on projected points, matchup, start chance, and downsid"},{"name":"Alexis Mac Allister","country":"Spain","stage":"final","text":"TOP PROJECTION Alexis Mac Allister Argentina · Fantasy position: Midfielder 4.4 projected points for Final Round · 88.8% start chance Final Round vs Spain · neutral Captain watchlist based on projected points, matchup, start chance, and dow"},{"name":"Enzo Fernández","country":"Spain","stage":"final","text":"TOP PROJECTION Enzo Fernández Argentina · Fantasy position: Midfielder 4.4 projected points for Final Round · 88.8% start chance Final Round vs Spain · neutral Captain watchlist based on projected points, matchup, start chance, and downside"},{"name":"Álex Baena","country":"Spain","stage":"final","text":"TOP PROJECTION Álex Baena Spain · Fantasy position: Midfielder 4.3 projected points for Final Round · 89% start chance Final Round vs Argentina · neutral Captain watchlist based on projected points, matchup, start chance, and downside. Caut"},{"name":"Lamine Yamal Nasraoui Ebana","country":"Spain","stage":"final","text":"TOP PROJECTION Lamine Yamal Nasraoui Ebana Spain · Fantasy position: Midfielder 4.3 projected points for Final Round · 89% start chance Final Round vs Argentina · neutral Captain watchlist based on projected points, matchup, start chance, a"}] |
| Match Environment | ["France vs England\nGroup Third Place · Final Round · Jul 18, 2026 · 5:00 PM ET\nSource SF scores: France 0-2 Spain · England 1-2 Argentina\nFRA 1.5 - ENG 1.5\nExpected goals for this matchup.\nFRA 37% · Draw 27% · ENG 36%\n1-1 (13%)\nOther likely scores: 1-0 (10%) · 0-1 (10%)\nTotal goals range: 0-0\nHigh\nOpen match\nFRA Neutral\nENG Neutral\nFRA 28% clean sheet\nENG 28% clean sheet","Spain vs Argentina\nGroup Final · Final Round · Jul 19, 2026 · 3:00 PM ET\nSource SF scores: France 0-2 Spain · England 1-2 Argentina\nESP 1.3 - ARG 1.4\nExpected goals for this matchup.\nESP 36% · Draw 26% · ARG 39%\n1-1 (12%)\nOther likely scores: 0-1 (9%) · 1-0 (9%)\nTotal goals range: 0-0\nHigh\nClose match\nESP Neutral\nARG Neutral\nESP 25% clean sheet\nARG 26% clean sheet"] |
| Player Profiles | [{"label":"Exact Final Profile Player Profile","status":"pass","rows":[{"name":"Mikel Oyarzabal","country":"Spain","matchday":"finalRound","fixture_stage":"final","opponent":"Argentina","selectable_status":"playing","projected_points":5.05},{"name":"Mikel Oyarzabal","country":"Spain","matchday":"finalRound","fixture_stage":"final","opponent":"Argentina","selectable_status":"playing","projected_points":5.05},{"name":"Mikel Oyarzabal","country":"Spain","matchday":"finalRound","fixture_stage":"final","opponent":"Argentina","selectable_status":"playing","projected_points":5.05}],"sample":"PLAYER PROFILE\n\nMikel Oyarzabal\n\nSpain · Official fantasy position: Forward\n\nX\nUpside Picks\n?\nAdd to Builder\nWhy Pick Him\nWhy Pick Him\nUpside Picks: 10.6 upside ceiling with 5 projected points for Final Round.\nFixture note: High-variance match setup.\nWhy Be Careful\nRisk view: Main risks are boom-or-bust scoring profile and lower floor.\nBest Use\nBEST USE\nHigh-floor starter\nUpside Picks\nPROJECTED PTS / MATCHDAY\n5\nFinal Round vs Argentina\nROLE CAUTION\nSafer floor\n26.1 downside score\nSTART CHANCE\n89"},{"label":"Exact Third Place Profile Player Profile","status":"pass","rows":[{"name":"Kylian Mbappé","country":"France","matchday":"finalRound","fixture_stage":"third_place","opponent":"England","selectable_status":"playing","projected_points":4.104},{"name":"Kylian Mbappé","country":"France","matchday":"finalRound","fixture_stage":"third_place","opponent":"England","selectable_status":"playing","projected_points":4.104},{"name":"Kylian Mbappé","country":"France","matchday":"finalRound","fixture_stage":"third_place","opponent":"England","selectable_status":"playing","projected_points":4.104}],"sample":"PLAYER PROFILE\n\nKylian Mbappé\n\nFrance · Official fantasy position: Forward\n\nX\nCore Picks\nEarly game option\nReplacement flexibility\n?\nAdd to Builder\nWhy Pick Him\nWhy Pick Him\nCore Picks: 4.1 projected points for Final Round with 59% start chance.\nFixture note: High-variance match setup.\nWhy Be Careful\nRisk view: Main risks are minutes risk and rotation risk.\nBest Use\nBEST USE\nCore pick\nCore Picks\nPROJECTED PTS / MATCHDAY\n4.1\nFinal Round vs England\nROLE CAUTION\nCheck role\n58.6 downside score\nSTART"}] |
| Team Builder Golden Match | yes |

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
| Fixture exposure explanation | yes |
| Third Place strategy text | yes |
| Optionality text | Optionality Score 5.3 earlier kickoff flexibility; verify official locks |
| France selected / starters / bench | 1 / 1 / 0 |
| Spain selected / starters / bench | 5 / 1 / 4 |
| England selected / starters / bench | 1 / 1 / 0 |
| Argentina selected / starters / bench | 8 / 8 / 0 |
| Brazil selected | 0 |
| Colombia selected | 0 |
| Top country | Balanced Squad, Balanced safety, Final Round. Top country: Argentina 8/8. Fixture spread: Final Round: 0 hard, 0 favorable, 11 high-uncertainty. Early fixture: 2 squad / 2 starters. Optionality 5.3. |

## Team Builder Selected Squad

| Area | Slot | Player | Pos | Country |
| --- | --- | --- | --- | --- |
| Starter | 1 | Kylian Mbappé | Forward | France |
| Starter | 2 | Harry Kane | Forward | England |
| Starter | 3 | Mikel Oyarzabal | Forward | Spain |
| Starter | 4 | Leandro Paredes | Midfielder | Argentina |
| Starter | 5 | Alexis Mac Allister | Midfielder | Argentina |
| Starter | 6 | Enzo Fernández | Midfielder | Argentina |
| Starter | 7 | Nicolás Tagliafico | Defender | Argentina |
| Starter | 8 | Nahuel Molina | Defender | Argentina |
| Starter | 9 | Lisandro Martínez | Defender | Argentina |
| Starter | 10 | Cristian Romero | Defender | Argentina |
| Starter | 11 | Emiliano Martínez | Goalkeeper | Argentina |
| Bench | 1 | Unai Simón | Goalkeeper | Spain |
| Bench | 2 | Pau Cubarsí | Defender | Spain |
| Bench | 3 | Álex Baena | Midfielder | Spain |
| Bench | 4 | Fabián Ruiz | Midfielder | Spain |

## Data Loaded

| Dataset | Rows |
| --- | --- |
| Players sample | 100 |
| Recommendation candidates | 675 |
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
