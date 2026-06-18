# Final MD2 Release QA v1

Generated: 2026-06-18T15:54:06.431Z
Release status: **GREEN**
Deploy recommendation: **Share the public MD2 site. No model rebuild is indicated by this QA pass.**
Safe to share tonight: **YES**

## Model Stack

- Score model: `score-v4-md2-pele-md1-calibrated`
- Projection model: `player-projection-v4-md2-score-v4-role-v2`
- Recommendation model: `fantasy-pool-recommendations-v4-md2-projection-v4-role-v2-score-v4`
- Team Builder optimizer: `team_builder_optimizer_md2_v4`
- Default public matchday: `md2`
- PELE/team-quality rebuilt in this release: **No**; active score rows carry `pele_prior_not_rebuilt`.
- Final squads source-backed: **No**; status `still_blocked_no_source_backed_final_squads`.

## Checks Passed

- Official monitor completed; 140 ownership-only changes, no model rerun needed.
- Active data-flow QA: pass, failures 0, warnings 0.
- Live fixture mapping QA: passed, matched 72, unsafe leaks 0.
- Team Builder v4 QA: pass, Balanced starter points 83.402.
- Local full public browser QA: pass.
- Deployed full public browser QA on https://fantasyeconomist.com: pass.
- Targeted deployed smoke: pass for MD2 defaults, Add to Builder, profile, Match Environment MD1 access, and Balanced Squad build.
- Syntax checks: pass for all requested JS/data files.
- Legacy public path check: pass with zero matches.
- Static script loading: required active scripts present in order; no forbidden legacy scripts loaded.

## Official Monitor

- Price changes: 0
- Position changes: 0
- Selectable status changes: 0
- Team/country changes: 0
- New/removed players: 0/0
- Rules/source header changes: 0
- Booster text changes: 0
- Deadline round changes: 0
- Fetch failures: 0
- Ownership-percent changes: 140 (non-model signal)

## Active Data Coverage

- Official records: 1488; selectable: 1245
- Recommendation candidates: 500; MD2 candidates: 125
- Player matchday projections: 3699; MD2 projections: 1233
- Finance rows: 1233
- Score fixtures: 72; MD2 fixtures: 24
- Live fixtures: 72; live player rows: 1488

## Picks Sanity

MD2 public pick surfaces include credible premium/core players across projection, core, and captain lanes. Value/differential lanes surface cheaper playable alternatives.

### Top 15 Projected Points

| # | Player | Team | Pos | Opp | Pts | Start % |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Lionel Messi | Argentina | FWD | Austria | 9.496 | 93.5 |
| 2 | Michael Olise | France | MID | Iraq | 9.139 | 93.5 |
| 3 | Ousmane Dembélé | France | MID | Iraq | 8.905 | 79 |
| 4 | Luis Díaz | Colombia | MID | Congo DR | 8.869 | 93.5 |
| 5 | Harry Kane | England | FWD | Ghana | 8.738 | 93.5 |
| 6 | Jamal Musiala | Germany | MID | Côte d'Ivoire | 8.649 | 79 |
| 7 | Kylian Mbappé | France | FWD | Iraq | 8.623 | 93.5 |
| 8 | Petar Musa | Croatia | FWD | Panama | 8.028 | 79 |
| 9 | Enzo Fernández | Argentina | MID | Austria | 7.98 | 89.5 |
| 10 | Désiré Doué | France | MID | Iraq | 7.976 | 79 |
| 11 | Bruno Miguel Borges Fernandes | Portugal | MID | Uzbekistan | 7.891 | 89.5 |
| 12 | Vinícius José Paixão de Oliveira Júnior | Brazil | MID | Haiti | 7.801 | 93.5 |
| 13 | Bradley Barcola | France | MID | Iraq | 7.801 | 73.5 |
| 14 | Raphael Dias Belloli | Brazil | MID | Haiti | 7.727 | 89.5 |
| 15 | Erling Haaland | Norway | FWD | Senegal | 7.722 | 93.5 |

### Top 15 Core Picks

| # | Player | Team | Pos | Opp | Pts | Start % |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Lionel Messi | Argentina | FWD | Austria | 9.496 | 93.5 |
| 2 | Michael Olise | France | MID | Iraq | 9.139 | 93.5 |
| 3 | Ousmane Dembélé | France | MID | Iraq | 8.905 | 79 |
| 4 | Luis Díaz | Colombia | MID | Congo DR | 8.869 | 93.5 |
| 5 | Harry Kane | England | FWD | Ghana | 8.738 | 93.5 |
| 6 | Jamal Musiala | Germany | MID | Côte d'Ivoire | 8.649 | 79 |
| 7 | Kylian Mbappé | France | FWD | Iraq | 8.623 | 93.5 |
| 8 | Petar Musa | Croatia | FWD | Panama | 8.028 | 79 |
| 9 | Enzo Fernández | Argentina | MID | Austria | 7.98 | 89.5 |
| 10 | Désiré Doué | France | MID | Iraq | 7.976 | 79 |
| 11 | Bruno Miguel Borges Fernandes | Portugal | MID | Uzbekistan | 7.891 | 89.5 |
| 12 | Bradley Barcola | France | MID | Iraq | 7.801 | 73.5 |
| 13 | Vinícius José Paixão de Oliveira Júnior | Brazil | MID | Haiti | 7.801 | 93.5 |
| 14 | Raphael Dias Belloli | Brazil | MID | Haiti | 7.727 | 89.5 |
| 15 | Erling Haaland | Norway | FWD | Senegal | 7.722 | 93.5 |

### Top 15 Captain Watchlist

| # | Player | Team | Pos | Opp | Pts | Start % |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Michael Olise | France | MID | Iraq | 9.139 | 93.5 |
| 2 | Lionel Messi | Argentina | FWD | Austria | 9.496 | 93.5 |
| 3 | Kylian Mbappé | France | FWD | Iraq | 8.623 | 93.5 |
| 4 | Ousmane Dembélé | France | MID | Iraq | 8.905 | 79 |
| 5 | Harry Kane | England | FWD | Ghana | 8.738 | 93.5 |
| 6 | Luis Díaz | Colombia | MID | Congo DR | 8.869 | 93.5 |
| 7 | Désiré Doué | France | MID | Iraq | 7.976 | 79 |
| 8 | Jamal Musiala | Germany | MID | Côte d'Ivoire | 8.649 | 79 |
| 9 | Enzo Fernández | Argentina | MID | Austria | 7.98 | 89.5 |
| 10 | Bradley Barcola | France | MID | Iraq | 7.801 | 73.5 |
| 11 | Jude Bellingham | England | MID | Ghana | 7.64 | 93.5 |
| 12 | Petar Musa | Croatia | FWD | Panama | 8.028 | 79 |
| 13 | Bruno Miguel Borges Fernandes | Portugal | MID | Uzbekistan | 7.891 | 89.5 |
| 14 | Vinícius José Paixão de Oliveira Júnior | Brazil | MID | Haiti | 7.801 | 93.5 |
| 15 | Raphael Dias Belloli | Brazil | MID | Haiti | 7.727 | 89.5 |

### Top 10 Value Picks

| # | Player | Team | Pos | Opp | Pts | Start % |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Hiroki Ito | Japan | DEF | Tunisia | 6.038 | 89.5 |
| 2 | Petar Sucic | Croatia | MID | Panama | 5.35 | 93.5 |
| 3 | Luis Suárez | Colombia | FWD | Congo DR | 7.102 | 78 |
| 4 | Ivan Perisic | Croatia | FWD | Panama | 6.556 | 93.5 |
| 5 | Nico O'Reilly | England | DEF | Ghana | 5.694 | 89.5 |
| 6 | Daniel Muñoz | Colombia | DEF | Congo DR | 5.422 | 93.5 |
| 7 | Nuno Alexandre Tavares Mendes | Portugal | DEF | Uzbekistan | 6.73 | 89.5 |
| 8 | Charles De Ketelaere | Belgium | MID | IR Iran | 6.499 | 89.5 |
| 9 | Camilo Vargas | Colombia | GK | Congo DR | 4.805 | 89.5 |
| 10 | Enner Valencia | Ecuador | FWD | Curaçao | 6.332 | 89.5 |

### Top 10 Differential Picks

| # | Player | Team | Pos | Opp | Pts | Start % |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Charles De Ketelaere | Belgium | MID | IR Iran | 6.499 | 89.5 |
| 2 | Mikel Oyarzabal | Spain | FWD | Saudi Arabia | 5.978 | 89.5 |
| 3 | Nuno Alexandre Tavares Mendes | Portugal | DEF | Uzbekistan | 6.73 | 89.5 |
| 4 | Donyell Malen | Netherlands | FWD | Sweden | 6.465 | 80 |
| 5 | Kevin De Bruyne | Belgium | MID | IR Iran | 6.744 | 89.5 |
| 6 | Nico O'Reilly | England | DEF | Ghana | 5.694 | 89.5 |
| 7 | Ayase Ueda | Japan | FWD | Tunisia | 7.006 | 89.5 |
| 8 | Enner Valencia | Ecuador | FWD | Curaçao | 6.332 | 89.5 |
| 9 | Patrik Schick | Czechia | FWD | South Africa | 6.759 | 88 |
| 10 | Hiroki Ito | Japan | DEF | Tunisia | 6.038 | 89.5 |

### Elite Omissions

| Player | Team | Pos | Pts | Reason |
| --- | --- | --- | --- | --- |
| Kylian Mbappé | France | FWD | 8.623 | position quota, budget |
| Désiré Doué | France | MID | 7.976 | position quota, budget |
| Enzo Fernández | Argentina | MID | 7.98 | position quota, country limit, budget |
| Bradley Barcola | France | MID | 7.801 | position quota, budget |
| Bruno Miguel Borges Fernandes | Portugal | MID | 7.891 | position quota, budget |
| Jude Bellingham | England | MID | 7.64 | position quota, budget |
| Vinícius José Paixão de Oliveira Júnior | Brazil | MID | 7.801 | position quota, budget |
| Raphael Dias Belloli | Brazil | MID | 7.727 | position quota, budget |
| Erling Haaland | Norway | FWD | 7.722 | position quota, budget |
| Lamine Yamal Nasraoui Ebana | Spain | MID | 7.696 | position quota, budget |

## Team Builder Sanity

- Balanced Squad status: pass
- Formation: 4-3-3
- Squad projected MD2 points: 109.428
- Starter projected MD2 points: 83.402
- Budget used/left: 100/0
- Captain: Michael Olise (France)
- Vice captain: Lionel Messi (Argentina)
- Risky players: 0
- Greedy baseline starter points: 83.741; Balanced gap: -0.339

### Balanced Starters

| Player | Team | Pos | Opp | Price | Pts | Role |
| --- | --- | --- | --- | --- | --- | --- |
| Emiliano Martínez | Argentina | GK | Austria | 5 | 5.155 | locked_starter |
| Lionel Messi | Argentina | FWD | Austria | 10 | 9.496 | locked_starter |
| Harry Kane | England | FWD | Ghana | 10.5 | 8.738 | locked_starter |
| Petar Musa | Croatia | FWD | Panama | 5.1 | 8.028 | likely_starter |
| Nuno Alexandre Tavares Mendes | Portugal | DEF | Uzbekistan | 5.8 | 6.73 | locked_starter |
| Ritsu Doan | Japan | DEF | Tunisia | 5.1 | 6.61 | locked_starter |
| Hiroki Ito | Japan | DEF | Tunisia | 3.9 | 6.038 | locked_starter |
| Nico O'Reilly | England | DEF | Ghana | 4.7 | 5.694 | locked_starter |
| Michael Olise | France | MID | Iraq | 9.5 | 9.139 | locked_starter |
| Ousmane Dembélé | France | MID | Iraq | 10 | 8.905 | likely_starter |
| Luis Díaz | Colombia | MID | Congo DR | 8.1 | 8.869 | locked_starter |

### Balanced Bench

| Player | Team | Pos | Opp | Price | Pts | Role |
| --- | --- | --- | --- | --- | --- | --- |
| Unai Simón | Spain | GK | Saudi Arabia | 5 | 5.084 | locked_starter |
| Gonzalo Montiel | Argentina | DEF | Austria | 4.3 | 5.332 | likely_starter |
| Jamal Musiala | Germany | MID | Côte d'Ivoire | 8 | 8.649 | likely_starter |
| Daizen Maeda | Japan | MID | Tunisia | 5 | 6.961 | likely_starter |

## Match Environment Sanity

- MD2 fixture count: 24/24
- Missing fixtures: 0
- Bad probability rows: 0

### Top 10 Highest Projected Total Goals

| # | Fixture | Total xG | Favorite | Uncertainty |
| --- | --- | --- | --- | --- |
| 1 | France vs Iraq | 5.091 | France | High |
| 2 | Netherlands vs Sweden | 3.987 | Netherlands | High |
| 3 | England vs Ghana | 3.966 | England | Medium |
| 4 | Norway vs Senegal | 3.964 | Norway | High |
| 5 | Argentina vs Austria | 3.957 | Argentina | High |
| 6 | Germany vs Côte d'Ivoire | 3.83 | Germany | Medium |
| 7 | Tunisia vs Japan | 3.819 | Japan | High |
| 8 | Ecuador vs Curaçao | 3.681 | Ecuador | Medium |
| 9 | Panama vs Croatia | 3.539 | Croatia | Medium |
| 10 | Portugal vs Uzbekistan | 3.449 | Portugal | High |

### Top 10 Strongest Clean-Sheet Contexts

| # | Team | Opponent | CS Prob | Context |
| --- | --- | --- | --- | --- |
| 1 | Argentina | Austria | 0.4918 | Good |
| 2 | Brazil | Haiti | 0.4801 | Good |
| 3 | Uruguay | Cabo Verde | 0.4782 | Good |
| 4 | Spain | Saudi Arabia | 0.4782 | Good |
| 5 | Japan | Tunisia | 0.4535 | Good |
| 6 | England | Ghana | 0.4349 | Good |
| 7 | Canada | Qatar | 0.4229 | Good |
| 8 | France | Iraq | 0.4153 | Good |
| 9 | Ecuador | Curaçao | 0.41 | Good |
| 10 | Portugal | Uzbekistan | 0.4071 | Good |

## Public Trust And Disclosure

- Independent helper language present: true.
- Manual official-game verification language present: true.
- MD2 active model/data badge present in public UI: true.
- Not-official disclaimer present: true.
- No guarantee disclaimer present: true.
- Betting/gambling language appears only as a disclaimer: true.
- Final-squad-backed public claim absent: true.
- PELE-rebuilt public claim absent: true.

## Remaining Known Limits

- Official final squads are still not source-backed; the public identity universe remains the FIFA fantasy pool.
- Ownership-percent changes appeared in the official feed, but ownership is not used as an active model signal.
- Live locks, deadlines, boosters, played/unplayed state, and final in-game legality still require confirmation inside FIFA.
- PELE/team-quality priors were not rebuilt in this release; Score Model v4 applies MD1 calibration on top of the existing PELE/team-quality context.
- Live fixture/player status is display/support data only and does not rerun recommendations, projections, finance, score, PELE, or Team Builder weights.
- The site is independent planning help, not official FIFA fantasy advice and not betting or gambling advice.

## Commands Run

- `node scripts/checkOfficialFantasyDataUpdates.mjs`
- `node scripts/validateActiveMd2DataFlow.mjs`
- `node scripts/validateLiveFixtureMapping.mjs`
- `node scripts/validateTeamBuilderMd2V4.mjs`
- `node scripts/runPublicPreviewBrowserQa.mjs (local preview)`
- `node --check script.js`
- `node --check worldCupPage.js`
- `node --check fantasyPoolRecommendationsData.js`
- `node --check fantasyPoolMatchdayProjectionsData.js`
- `node --check fantasyPoolScorePredictionsData.js`
- `node --check fantasyPoolOfficialDataStatusData.js`
- `node --check liveMatchdayStatusData.js`
- `node --check livePlayerStatusData.js`
- `rg legacy public path check on index.html script.js`
- `static script loading check on index.html`
- `node scripts/runPublicPreviewBrowserQa.mjs with PUBLIC_PREVIEW_BASE_URL=https://fantasyeconomist.com`
- `targeted Playwright deployed smoke on https://fantasyeconomist.com`
