# Recommendation Calibration Audit Fantasy Pool v3

Generated: 2026-06-17T22:53:19.339Z

Model stage: fantasy_pool_only. This audit does not promote recommendations, does not update active v2 recommendations, does not update browser-ready files, and does not make Team Builder, captain/substitution, or UX changes.

## Executive Summary

- Candidate rows after calibration: 500.
- QA status: pass_with_staging_stop_conditions.
- Low-confidence top-list candidates: 0.
- Thin-profile top-list candidates: 0.
- True missing-usage top-list candidates: 0.
- Brazil uncertainty candidate rows: 25.
- Neymar candidate rows: 0.
- Position-balance warning lists: 0.
- Safe for preliminary recommendation review: true.
- Safe for public recommendations: false.

## Calibration Changes

- Applied mode-specific position caps so candidate pools do not become defender- or goalkeeper-only lists.
- Dampened defender and goalkeeper scoring in Captain Alpha and Upside modes so captain review does not blindly follow clean-sheet-driven raw points.
- Reduced Differential mode's cheapness signal and increased its need for defensible raw, ceiling, and attacking context.
- Consumed projection v3 coverage components for MID tackles, MID chances created, and FWD shots on target while keeping source/prior uncertainty visible.
- Strengthened Differential mode's premium-obviousness proxy after the scoring coverage pass exposed premium captain-type players at the top of the differential list.
- Added per-scope Differential obviousness penalties based on Balanced/Safe rank, Captain Alpha rank, raw projection rank, price percentile by position, and cross-mode top-list status.
- Added finance-style diagnostics for value over replacement, scarcity-adjusted value, opportunity cost, efficient frontier status, and mode rank correlation.
- Softened Differential obviousness penalties with value-over-replacement and efficient-frontier credit so good value rows are not excluded merely to force zero overlap.
- Consumed staged playerFinanceMetrics_fantasyPool_v1 finance-alpha, portfolio-fit, downside-risk, volatility, role-stability, premium-squeeze, and bridge-confidence fields.
- Reframed the staged Upside scoring around ceiling and attacking paths per official price, with explicit penalties for obvious Captain Alpha rows.
- Kept all outputs fantasy_pool_only and staged; active v2 recommendation files and browser-ready files are not written.

Projection-generation coverage was improved in this session. The staged v3 projection layer now emits separate capped components for official MID tackle points, MID chance-created points, and FWD shots-on-target points. Source-backed player rates are used where available; otherwise small conservative position priors are dampened and flagged. These additions improve MID/FWD representation without promoting the model or treating priors as final player event rates.

## Original Calibration Before And After Mode Winners

Baseline note: Baseline from the first uncalibrated fantasyPool_v3 recommendation output generated on 2026-06-02.

| Mode | Before winner | Before pos | After winner | After pos | After score |
| --- | --- | --- | --- | --- | --- |
| Balanced | Nuno Alexandre Tavares Mendes (md2) | DEF | Lionel Messi (md3) | FWD | 82.411 |
| Safe | Camilo Vargas (md1) | GK | Enzo Fernández (md3) | MID | 83.792 |
| Upside | Lionel Messi (md3) | FWD | Luis Suárez (md2) | FWD | 79.582 |
| Differential | Nicolás Tagliafico (md3) | DEF | Hiroki Ito (md2) | DEF | 84.686 |
| Captain Alpha | Nuno Alexandre Tavares Mendes (md2) | DEF | Lionel Messi (md3) | FWD | 98.623 |

## Original Calibration Before And After Position Distribution

| Position | Before rows | After rows |
| --- | --- | --- |
| GK | 79 | 47 |
| DEF | 300 | 143 |
| MID | 64 | 143 |
| FWD | 57 | 167 |

## Scoring-Coverage Pass Before And After Mode Winners

| Mode | Before coverage winner | Before pos | After coverage winner | After pos | After score |
| --- | --- | --- | --- | --- | --- |
| Balanced | Lionel Messi (md3) | FWD | Lionel Messi (md3) | FWD | 82.411 |
| Safe | Enzo Fernández (md3) | MID | Enzo Fernández (md3) | MID | 83.792 |
| Upside | Luis Suárez (md2) | FWD | Luis Suárez (md2) | FWD | 79.582 |
| Differential | Hiroki Ito (md2) | DEF | Hiroki Ito (md2) | DEF | 84.686 |
| Captain Alpha | Lionel Messi (md3) | FWD | Lionel Messi (md3) | FWD | 98.623 |

## Scoring-Coverage Pass Before And After Position Distribution

| Position | Before coverage rows | After coverage rows |
| --- | --- | --- |
| GK | 47 | 47 |
| DEF | 143 | 143 |
| MID | 143 | 143 |
| FWD | 167 | 167 |

## Position-Balance Safeguards

| Scope | Mode | Top candidate | GK | DEF | MID | FWD | Warning |
| --- | --- | --- | --- | --- | --- | --- | --- |
| group_stage_full | balanced | Enzo Fernández | 4 | 7 | 7 | 7 | none |
| group_stage_full | safe | Enzo Fernández | 5 | 5 | 7 | 8 | none |
| group_stage_full | upside | Luis Suárez | 0 | 8 | 7 | 10 | none |
| group_stage_full | differential | Hiroki Ito | 3 | 9 | 8 | 5 | none |
| group_stage_full | captain | Lionel Messi | 0 | 3 | 10 | 12 | none |
| md1 | balanced | Nuno Alexandre Tavares Mendes | 3 | 10 | 4 | 8 | none |
| md1 | safe | Enzo Fernández | 6 | 8 | 5 | 6 | none |
| md1 | upside | Luis Suárez | 0 | 8 | 7 | 10 | none |
| md1 | differential | Santiago Arias | 3 | 9 | 7 | 6 | none |
| md1 | captain | Lionel Messi | 0 | 3 | 10 | 12 | none |
| md2 | balanced | Nuno Alexandre Tavares Mendes | 2 | 9 | 6 | 8 | none |
| md2 | safe | Camilo Vargas | 5 | 9 | 5 | 6 | none |
| md2 | upside | Luis Suárez | 0 | 8 | 7 | 10 | none |
| md2 | differential | Hiroki Ito | 3 | 9 | 7 | 6 | none |
| md2 | captain | Lionel Messi | 0 | 3 | 10 | 12 | none |
| md3 | balanced | Lionel Messi | 4 | 7 | 7 | 7 | none |
| md3 | safe | Enzo Fernández | 6 | 8 | 5 | 6 | none |
| md3 | upside | Donyell Malen | 0 | 8 | 7 | 10 | none |
| md3 | differential | Josip Stanisic | 3 | 9 | 7 | 6 | none |
| md3 | captain | Lionel Messi | 0 | 3 | 10 | 12 | none |

## Does The Top Of Each Mode Make Sense?

- Nuno Mendes as Balanced and Safe: still plausible as a staged candidate because his source-backed fullback attacking/assist rates combine with Portugal's favorable clean-sheet fixtures and DEF clean-sheet scoring. The calibration keeps him eligible but prevents defender-only pools.
- Nuno Mendes as Captain Alpha: corrected at the recommendation layer. Defender captain outcomes can be strong under official scoring, but Captain Alpha now applies attacker preference and DEF/GK dampening so clean-sheet upside does not dominate captain review.
- Nuno Mendes as Differential: corrected at the mode-separation layer. His old Differential rank was a mode-weight/obviousness issue, not a projection bug; he remains excellent in Balanced/Safe but is penalized away from Differential because he is already top in both modes.
- Camilo Vargas in Safe mode: goalkeeper appearance/minutes security, clean-sheet probability, and save points create a stable floor, but Safe mode now caps GK exposure so it is not a goalkeeper list.
- Giorgian de Arrascaeta as Differential: plausible after the finance pass because he combines positive value over replacement, scarcity-adjusted value, efficient-frontier status, high confidence, acceptable starts/minutes, and only limited Balanced/Captain obviousness.
- Luis Suárez as Differential: still a defensible lower-obviousness candidate in some rows, but the finance pass no longer forces him to win the mode when stronger value-over-replacement/frontier candidates exist.
- Nicolás Tagliafico as a Differential candidate: still plausible as a value-looking staged candidate, but mode-separation penalties now stop high-overall defensive candidates from repeating the Balanced list.
- Upside vs Captain Alpha: Upside now discounts obvious armband rows, while Captain Alpha remains the armband ceiling list.

## Official Scoring Effects

| Category | Points | Applies to | Model effect |
| --- | --- | --- | --- |
| Appearance (Up to 60 minutes) | 1 | all_players | used or carried as context |
| Appearance (60+ minutes) | 1 | all_players | used or carried as context |
| Assist | 3 | all_players | used or carried as context |
| Yellow Card | -1 | all_players | used or carried as context |
| Red Card | -2 | all_players | used or carried as context |
| Own Goal | -2 | all_players | not modeled because no source-backed own-goal rate exists |
| Winning a penalty | 2 | all_players | not modeled because no source-backed penalty-won rate exists |
| Conceding a penalty | -1 | all_players | not modeled because no source-backed penalty-conceded rate exists |
| Clean Sheet (must have played 60+ minutes) | 5 | GK | strongly favors high-minute GK/DEF in favorable fixtures |
| First goal conceded | 0 | GK | used or carried as context |
| Each additional goal conceded | -1 | GK | used or carried as context |
| Goal Scored | 9 | GK | used or carried as context |
| Penalty save | 3 | GK | not modeled because no source-backed penalty-save opportunity/save rate exists |
| Every 3 Saves | 1 | GK | used or carried as context |
| Clean Sheet (must have played 60+ minutes) | 5 | DEF | strongly favors high-minute GK/DEF in favorable fixtures |
| First goal conceded | 0 | DEF | used or carried as context |
| Each additional goal conceded | -1 | DEF | used or carried as context |
| Goal scored | 7 | DEF | favors attacking defenders/fullbacks when source-backed attacking rates exist |
| Clean Sheet (must have played 60+ minutes) | 1 | MID | small midfielder defensive bonus |
| Goal scored | 6 | MID | used or carried as context |
| Every 3 tackles | 1 | MID | modeled in projection v3 coverage pass with source-backed rates where available and capped conservative MID priors otherwise |
| Every 2 chances created | 1 | MID | modeled in projection v3 coverage pass with source-backed rates where available and capped conservative MID priors otherwise |
| Goal scored | 5 | FWD | used or carried as context |
| Every 2 shots on target | 1 | FWD | modeled in projection v3 coverage pass with source-backed shots-on-target rates where available and capped conservative FWD priors otherwise |
| Goal from direct free-kick | 1 | all_players | partially modeled as ordinary goal scoring only; no direct-free-kick bonus rate |
| Scouting bonus | 2 | all_players | not modeled because selection-rate evidence is unavailable |

Interpretation: official scoring naturally makes strong-defense GK/DEF candidates valuable because clean sheets are worth 5 points for GK/DEF and only 1 for MID. It also makes attacking fullbacks powerful because DEF goals are worth 7 and assists are worth 3. The current coverage pass reduces a known attacker under-ranking risk by modeling MID tackle/chance-created points and FWD shots-on-target points, but these remain staged because many rows still rely on capped priors rather than full source-backed player-level rates.

## Top 25 By Mode

### Balanced

Position distribution: {"FWD":12,"MID":7,"DEF":6}

| Rank | Name | Country | Pos | Scope | Opponent | Score | Tier | Raw | Risk | Captain | Value | Alpha | Portfolio | Downside | Start | Min | Conf |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Lionel Messi | Argentina | FWD | md3 | Jordan | 82.411 | top_pick_candidate | 8.119 | 7.55 | 17.926 | 0.755 | 100 | 77.1 | 55.8 | 0.95 | 65.3 | high |
| 2 | Enzo Fernández | Argentina | MID | md3 | Jordan | 82.348 | top_pick_candidate | 7.458 | 6.936 | 16.297 | 0.925 | 100 | 80.7 | 52.3 | 0.95 | 70.8 | high |
| 1 | Nuno Alexandre Tavares Mendes | Portugal | DEF | md1 | Congo DR | 81.415 | top_pick_candidate | 8.192 | 7.618 | 17.062 | 1.313 | 100 | 78.3 | 53.9 | 0.892 | 74.2 | high |
| 1 | Nuno Alexandre Tavares Mendes | Portugal | DEF | md2 | Uzbekistan | 80.975 | top_pick_candidate | 8.135 | 7.565 | 16.988 | 1.304 | 100 | 78.3 | 53.9 | 0.892 | 74.2 | high |
| 2 | Bruno Miguel Borges Fernandes | Portugal | MID | md2 | Uzbekistan | 80.903 | top_pick_candidate | 8.101 | 7.534 | 17.404 | 0.886 | 98.5 | 74.2 | 52.3 | 0.92 | 68.9 | high |
| 1 | Enzo Fernández | Argentina | MID | group_stage_full | Group stage average | 80.736 | top_pick_candidate | 22.397 | 20.829 | 16.297 | 2.777 | 100 | 80.7 | 52.3 | 0.95 | 70.8 | high |
| 2 | Lionel Messi | Argentina | FWD | group_stage_full | Group stage average | 80.693 | top_pick_candidate | 24.357 | 22.65 | 17.926 | 2.265 | 100 | 77.1 | 55.8 | 0.95 | 65.3 | high |
| 2 | Lionel Messi | Argentina | FWD | md1 | Algeria | 80.642 | top_pick_candidate | 8.119 | 7.55 | 17.875 | 0.755 | 100 | 77.1 | 55.8 | 0.95 | 65.3 | high |
| 3 | Enzo Fernández | Argentina | MID | md1 | Algeria | 80.571 | top_pick_candidate | 7.481 | 6.957 | 16.289 | 0.928 | 100 | 80.7 | 52.3 | 0.95 | 70.8 | high |
| 4 | Bruno Miguel Borges Fernandes | Portugal | MID | md1 | Congo DR | 80.253 | top_pick_candidate | 7.962 | 7.404 | 17.059 | 0.871 | 98.5 | 74.2 | 52.3 | 0.92 | 68.9 | high |
| 3 | Lionel Messi | Argentina | FWD | md2 | Austria | 80.249 | top_pick_candidate | 8.119 | 7.55 | 17.827 | 0.755 | 100 | 77.1 | 55.8 | 0.95 | 65.3 | high |
| 4 | Enzo Fernández | Argentina | MID | md2 | Austria | 80.082 | top_pick_candidate | 7.458 | 6.936 | 16.198 | 0.925 | 100 | 80.7 | 52.3 | 0.95 | 70.8 | high |
| 3 | Harry Kane | England | FWD | md3 | Panama | 79.115 | strong_candidate | 7.552 | 7.023 | 16.782 | 0.669 | 100 | 75.6 | 51.1 | 0.944 | 65 | high |
| 5 | Harry Kane | England | FWD | md2 | Ghana | 78.437 | strong_candidate | 7.552 | 7.023 | 16.855 | 0.669 | 100 | 75.6 | 51.1 | 0.944 | 65 | high |
| 3 | Bruno Miguel Borges Fernandes | Portugal | MID | group_stage_full | Group stage average | 78.158 | strong_candidate | 22.001 | 20.46 | 17.404 | 2.407 | 98.5 | 74.2 | 52.3 | 0.92 | 68.9 | high |
| 5 | Harry Kane | England | FWD | md1 | Croatia | 77.936 | strong_candidate | 7.265 | 6.757 | 16.033 | 0.644 | 100 | 75.6 | 51.1 | 0.944 | 65 | high |
| 4 | Nuno Alexandre Tavares Mendes | Portugal | DEF | group_stage_full | Group stage average | 77.822 | strong_candidate | 21.559 | 20.049 | 17.062 | 3.457 | 100 | 78.3 | 53.9 | 0.892 | 74.2 | high |
| 5 | Harry Kane | England | FWD | group_stage_full | Group stage average | 77.763 | strong_candidate | 22.369 | 20.803 | 16.855 | 1.981 | 100 | 75.6 | 51.1 | 0.944 | 65 | high |
| 4 | Nico O'Reilly | England | DEF | md3 | Panama | 77.506 | strong_candidate | 6.81 | 6.333 | 14.485 | 1.347 | 93.3 | 75.2 | 49.3 | 0.876 | 73.1 | high |
| 5 | Kylian Mbappé | France | FWD | md3 | Norway | 77.41 | strong_candidate | 7.154 | 6.653 | 15.832 | 0.634 | 100 | 72.6 | 52.8 | 0.912 | 63.2 | high |
| 6 | Mikel Oyarzabal | Spain | FWD | md1 | Cabo Verde | 77.119 | strong_candidate | 6.326 | 5.883 | 14.358 | 0.726 | 100 | 74.7 | 45.9 | 0.928 | 64.1 | high |
| 7 | Joshua Kimmich | Germany | DEF | md1 | Curaçao | 76.622 | strong_candidate | 7.254 | 6.746 | 15.051 | 1.227 | 76.1 | 67.2 | 46.4 | 0.91 | 75.5 | high |
| 6 | Denzel Dumfries | Netherlands | DEF | md3 | Tunisia | 76.548 | strong_candidate | 6.993 | 6.503 | 14.807 | 1.141 | 81.6 | 69.7 | 46.9 | 0.908 | 75.4 | high |
| 6 | Kylian Mbappé | France | FWD | md2 | Iraq | 76.425 | strong_candidate | 7.281 | 6.772 | 16.348 | 0.645 | 100 | 72.6 | 52.8 | 0.912 | 63.2 | high |
| 7 | Lautaro Martínez | Argentina | FWD | md3 | Jordan | 76.156 | strong_candidate | 6.428 | 5.978 | 14.746 | 0.679 | 97.7 | 74.6 | 46.9 | 0.944 | 65 | high |

### Safe

Position distribution: {"MID":6,"GK":7,"FWD":9,"DEF":3}

| Rank | Name | Country | Pos | Scope | Opponent | Score | Tier | Raw | Risk | Captain | Value | Alpha | Portfolio | Downside | Start | Min | Conf |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Enzo Fernández | Argentina | MID | md3 | Jordan | 83.792 | top_pick_candidate | 7.458 | 6.936 | 16.297 | 0.925 | 100 | 80.7 | 52.3 | 0.95 | 70.8 | high |
| 1 | Camilo Vargas | Colombia | GK | md2 | Congo DR | 83.644 | top_pick_candidate | 6.171 | 5.739 | 12.408 | 1.335 | 81.2 | 74.6 | 42.5 | 0.94 | 82.7 | high |
| 2 | Lionel Messi | Argentina | FWD | md3 | Jordan | 83.258 | top_pick_candidate | 8.119 | 7.55 | 17.926 | 0.755 | 100 | 77.1 | 55.8 | 0.95 | 65.3 | high |
| 1 | Enzo Fernández | Argentina | MID | md1 | Algeria | 83.175 | top_pick_candidate | 7.481 | 6.957 | 16.289 | 0.928 | 100 | 80.7 | 52.3 | 0.95 | 70.8 | high |
| 2 | Enzo Fernández | Argentina | MID | md2 | Austria | 83.032 | top_pick_candidate | 7.458 | 6.936 | 16.198 | 0.925 | 100 | 80.7 | 52.3 | 0.95 | 70.8 | high |
| 2 | Harry Kane | England | FWD | md1 | Croatia | 82.933 | top_pick_candidate | 7.265 | 6.757 | 16.033 | 0.644 | 100 | 75.6 | 51.1 | 0.944 | 65 | high |
| 3 | Emiliano Martínez | Argentina | GK | md3 | Jordan | 82.917 | top_pick_candidate | 5.925 | 5.51 | 12.112 | 1.102 | 100 | 82.1 | 44.2 | 0.94 | 82.7 | high |
| 3 | Emiliano Martínez | Argentina | GK | md1 | Algeria | 82.833 | top_pick_candidate | 6.049 | 5.626 | 12.294 | 1.125 | 100 | 82.1 | 44.2 | 0.94 | 82.7 | high |
| 4 | Lionel Messi | Argentina | FWD | md1 | Algeria | 82.605 | top_pick_candidate | 8.119 | 7.55 | 17.875 | 0.755 | 100 | 77.1 | 55.8 | 0.95 | 65.3 | high |
| 3 | Emiliano Martínez | Argentina | GK | md2 | Austria | 82.547 | top_pick_candidate | 5.925 | 5.51 | 12.013 | 1.102 | 100 | 82.1 | 44.2 | 0.94 | 82.7 | high |
| 1 | Enzo Fernández | Argentina | MID | group_stage_full | Group stage average | 82.501 | top_pick_candidate | 22.397 | 20.829 | 16.297 | 2.777 | 100 | 80.7 | 52.3 | 0.95 | 70.8 | high |
| 4 | Lionel Messi | Argentina | FWD | md2 | Austria | 82.482 | top_pick_candidate | 8.119 | 7.55 | 17.827 | 0.755 | 100 | 77.1 | 55.8 | 0.95 | 65.3 | high |
| 2 | Emiliano Martínez | Argentina | GK | group_stage_full | Group stage average | 82.278 | top_pick_candidate | 17.899 | 16.646 | 12.294 | 3.329 | 100 | 82.1 | 44.2 | 0.94 | 82.7 | high |
| 5 | Unai Simón | Spain | GK | md1 | Cabo Verde | 82.274 | top_pick_candidate | 5.838 | 5.429 | 11.957 | 1.086 | 81.2 | 72 | 42.8 | 0.908 | 79.9 | high |
| 5 | Harry Kane | England | FWD | md2 | Ghana | 82.216 | top_pick_candidate | 7.552 | 7.023 | 16.855 | 0.669 | 100 | 75.6 | 51.1 | 0.944 | 65 | high |
| 6 | Daniel Muñoz | Colombia | DEF | md2 | Congo DR | 82.184 | top_pick_candidate | 6.465 | 6.013 | 13.414 | 1.307 | 60.4 | 62.1 | 43.3 | 0.94 | 77.7 | high |
| 4 | Harry Kane | England | FWD | md3 | Panama | 82.156 | top_pick_candidate | 7.552 | 7.023 | 16.782 | 0.669 | 100 | 75.6 | 51.1 | 0.944 | 65 | high |
| 3 | Lionel Messi | Argentina | FWD | group_stage_full | Group stage average | 81.962 | top_pick_candidate | 24.357 | 22.65 | 17.926 | 2.265 | 100 | 77.1 | 55.8 | 0.95 | 65.3 | high |
| 7 | Jhon Lucumí | Colombia | DEF | md2 | Congo DR | 81.934 | top_pick_candidate | 5.584 | 5.193 | 11.548 | 1.208 | 38 | 51.8 | 39.1 | 0.94 | 77.7 | high |
| 6 | Camilo Vargas | Colombia | GK | md1 | Uzbekistan | 81.912 | top_pick_candidate | 6.295 | 5.855 | 12.704 | 1.362 | 81.2 | 74.6 | 42.5 | 0.94 | 82.7 | high |
| 7 | Mikel Oyarzabal | Spain | FWD | md1 | Cabo Verde | 81.901 | top_pick_candidate | 6.326 | 5.883 | 14.358 | 0.726 | 100 | 74.7 | 45.9 | 0.928 | 64.1 | high |
| 8 | Bruno Miguel Borges Fernandes | Portugal | MID | md2 | Uzbekistan | 81.415 | top_pick_candidate | 8.101 | 7.534 | 17.404 | 0.886 | 98.5 | 74.2 | 52.3 | 0.92 | 68.9 | high |
| 8 | Florian Wirtz | Germany | MID | md1 | Curaçao | 81.311 | top_pick_candidate | 6.615 | 6.152 | 14.284 | 0.82 | 62.2 | 61.6 | 45.5 | 0.923 | 69.1 | high |
| 5 | Virgil van Dijk | Netherlands | DEF | md3 | Tunisia | 81.281 | top_pick_candidate | 6.075 | 5.65 | 12.719 | 1.027 | 47.3 | 55 | 39.9 | 0.934 | 77.2 | high |
| 4 | Harry Kane | England | FWD | group_stage_full | Group stage average | 81.222 | top_pick_candidate | 22.369 | 20.803 | 16.855 | 1.981 | 100 | 75.6 | 51.1 | 0.944 | 65 | high |

### Upside

Position distribution: {"FWD":21,"DEF":2,"MID":2}

| Rank | Name | Country | Pos | Scope | Opponent | Score | Tier | Raw | Risk | Captain | Value | Alpha | Portfolio | Downside | Start | Min | Conf |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Luis Suárez | Colombia | FWD | md2 | Congo DR | 79.582 | strong_candidate | 6.487 | 6.033 | 14.689 | 1.058 | 82.5 | 59.7 | 60.7 | 0.73 | 53.4 | high |
| 1 | Luis Suárez | Colombia | FWD | md1 | Uzbekistan | 78.119 | strong_candidate | 6.469 | 6.016 | 14.718 | 1.055 | 82.5 | 59.7 | 60.7 | 0.73 | 53.4 | high |
| 1 | Luis Suárez | Colombia | FWD | group_stage_full | Group stage average | 74.787 | strong_candidate | 17.549 | 16.32 | 14.718 | 2.863 | 82.5 | 59.7 | 60.7 | 0.73 | 53.4 | high |
| 2 | Donyell Malen | Netherlands | FWD | md2 | Sweden | 72.101 | strong_candidate | 5.893 | 5.481 | 13.543 | 0.899 | 75.9 | 61.3 | 54.5 | 0.75 | 62 | high |
| 3 | Petar Musa | Croatia | FWD | md2 | Panama | 71.15 | strong_candidate | 6.621 | 6.158 | 14.878 | 1.207 | 35.9 | 41.3 | 53.5 | 0.74 | 62 | high |
| 1 | Donyell Malen | Netherlands | FWD | md3 | Tunisia | 69.55 | strong_candidate | 5.907 | 5.494 | 13.665 | 0.901 | 75.9 | 61.3 | 54.5 | 0.75 | 62 | high |
| 2 | Petar Musa | Croatia | FWD | md3 | Ghana | 69.015 | strong_candidate | 6.71 | 6.24 | 15.153 | 1.224 | 35.9 | 41.3 | 53.5 | 0.74 | 62 | high |
| 3 | Ivan Perisic | Croatia | FWD | md3 | Ghana | 68.075 | strong_candidate | 5.374 | 4.998 | 11.737 | 0.926 | 36.9 | 51.3 | 37.5 | 0.908 | 63 | high |
| 2 | Donyell Malen | Netherlands | FWD | group_stage_full | Group stage average | 68.021 | strong_candidate | 17.55 | 16.322 | 13.665 | 2.676 | 75.9 | 61.3 | 54.5 | 0.75 | 62 | high |
| 4 | Enner Valencia | Ecuador | FWD | md2 | Curaçao | 66.603 | strong_candidate | 5.885 | 5.473 | 13.47 | 0.928 | 53.6 | 61.3 | 37.9 | 0.94 | 64.8 | high |
| 5 | Hiroki Ito | Japan | DEF | md2 | Tunisia | 65.922 | watchlist_candidate | 6.609 | 6.146 | 13.8 | 1.576 | 66.2 | 66.7 | 41.6 | 0.89 | 74.1 | high |
| 2 | Donyell Malen | Netherlands | FWD | md1 | Japan | 64.995 | watchlist_candidate | 5.75 | 5.347 | 13.095 | 0.877 | 75.9 | 61.3 | 54.5 | 0.75 | 62 | high |
| 4 | Charles De Ketelaere | Belgium | MID | md3 | New Zealand | 64.646 | watchlist_candidate | 6.754 | 6.281 | 14.207 | 1.122 | 92.9 | 66.9 | 59.6 | 0.902 | 67.7 | high |
| 5 | Romelu Lukaku | Belgium | FWD | md3 | New Zealand | 64.111 | watchlist_candidate | 5.114 | 4.256 | 11.303 | 0.575 | 61.9 | 38.1 | 100 | 0.522 | 41.5 | medium |
| 6 | Ayase Ueda | Japan | FWD | md2 | Tunisia | 63.548 | watchlist_candidate | 6.446 | 5.995 | 14.582 | 0.856 | 88.1 | 77.7 | 42.6 | 0.947 | 65.1 | high |
| 3 | Petar Musa | Croatia | FWD | group_stage_full | Group stage average | 63.314 | watchlist_candidate | 16.988 | 15.799 | 15.153 | 3.098 | 35.9 | 41.3 | 53.5 | 0.74 | 62 | high |
| 3 | Ferran Torres | Spain | FWD | md1 | Cabo Verde | 62.865 | watchlist_candidate | 6.594 | 6.132 | 15.065 | 0.786 | 51.4 | 47.7 | 58.9 | 0.74 | 62 | high |
| 7 | Ivan Perisic | Croatia | FWD | md2 | Panama | 62.471 | watchlist_candidate | 5.074 | 4.718 | 10.966 | 0.874 | 36.9 | 51.3 | 37.5 | 0.908 | 63 | high |
| 6 | Esmir Bajraktarevic | Bosnia and Herzegovina | FWD | md3 | Qatar | 61.847 | watchlist_candidate | 5.213 | 4.849 | 11.361 | 1.032 | 30.2 | 38.7 | 47.8 | 0.882 | 62 | high |
| 4 | Lawrence Shankland | Scotland | FWD | md1 | Haiti | 61.666 | watchlist_candidate | 5.349 | 4.975 | 12.158 | 0.905 | 22 | 32.7 | 43.8 | 0.74 | 62 | high |
| 4 | Ayase Ueda | Japan | FWD | group_stage_full | Group stage average | 61.277 | watchlist_candidate | 17.507 | 16.282 | 14.582 | 2.326 | 88.1 | 77.7 | 42.6 | 0.947 | 65.1 | high |
| 8 | Amine Gouiri | Algeria | FWD | md2 | Jordan | 61.192 | watchlist_candidate | 5.563 | 5.173 | 12.263 | 0.834 | 31.8 | 49.1 | 36.9 | 0.916 | 63.5 | high |
| 9 | Nuno Alexandre Tavares Mendes | Portugal | DEF | md2 | Uzbekistan | 61.136 | watchlist_candidate | 8.135 | 7.565 | 16.988 | 1.304 | 100 | 78.3 | 53.9 | 0.892 | 74.2 | high |
| 5 | Enner Valencia | Ecuador | FWD | group_stage_full | Group stage average | 60.976 | watchlist_candidate | 14.517 | 13.501 | 13.47 | 2.288 | 53.6 | 61.3 | 37.9 | 0.94 | 64.8 | high |
| 6 | Charles De Ketelaere | Belgium | MID | group_stage_full | Group stage average | 60.662 | watchlist_candidate | 19.332 | 17.979 | 14.207 | 3.211 | 92.9 | 66.9 | 59.6 | 0.902 | 67.7 | high |

### Differential

Position distribution: {"DEF":14,"MID":2,"GK":2,"FWD":7}

| Rank | Name | Country | Pos | Scope | Opponent | Score | Tier | Raw | Risk | Captain | Value | Alpha | Portfolio | Downside | Start | Min | Conf |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Hiroki Ito | Japan | DEF | md2 | Tunisia | 84.686 | top_pick_candidate | 6.609 | 6.146 | 13.8 | 1.576 | 66.2 | 66.7 | 41.6 | 0.89 | 74.1 | high |
| 1 | Josip Stanisic | Croatia | DEF | md3 | Ghana | 79.177 | strong_candidate | 6.326 | 5.883 | 13.07 | 1.368 | 35.8 | 48.7 | 40.7 | 0.892 | 74.2 | high |
| 1 | Hiroki Ito | Japan | DEF | group_stage_full | Group stage average | 76.059 | strong_candidate | 14.479 | 13.466 | 13.8 | 3.453 | 66.2 | 66.7 | 41.6 | 0.89 | 74.1 | high |
| 2 | Nico O'Reilly | England | DEF | group_stage_full | Group stage average | 75.309 | strong_candidate | 19.269 | 17.919 | 14.558 | 3.813 | 93.3 | 75.2 | 49.3 | 0.876 | 73.1 | high |
| 2 | Bruno Guimarães Rodriguez Moura | Brazil | MID | md2 | Haiti | 75.049 | strong_candidate | 6.224 | 5.789 | 13.454 | 0.851 | 55.2 | 59.4 | 43.5 | 0.95 | 70.8 | high |
| 1 | Santiago Arias | Colombia | DEF | md1 | Uzbekistan | 74.624 | strong_candidate | 5.639 | 5.244 | 11.47 | 1.345 | 64 | 65.3 | 41.7 | 0.882 | 73.5 | high |
| 3 | Nico O'Reilly | England | DEF | md2 | Ghana | 73.518 | strong_candidate | 6.81 | 6.333 | 14.558 | 1.347 | 93.3 | 75.2 | 49.3 | 0.876 | 73.1 | high |
| 3 | Hernán Galíndez | Ecuador | GK | group_stage_full | Group stage average | 73.233 | strong_candidate | 14.257 | 13.259 | 11.77 | 3.157 | 60.2 | 64.8 | 39 | 0.94 | 82.7 | high |
| 4 | Nuno Alexandre Tavares Mendes | Portugal | DEF | group_stage_full | Group stage average | 72.185 | strong_candidate | 21.559 | 20.049 | 17.062 | 3.457 | 100 | 78.3 | 53.9 | 0.892 | 74.2 | high |
| 5 | Bruno Guimarães Rodriguez Moura | Brazil | MID | group_stage_full | Group stage average | 72.062 | strong_candidate | 17.677 | 16.441 | 13.454 | 2.418 | 55.2 | 59.4 | 43.5 | 0.95 | 70.8 | high |
| 2 | Johan Mojica | Colombia | DEF | md1 | Uzbekistan | 71.475 | strong_candidate | 5.699 | 5.3 | 11.7 | 1.359 | 65.4 | 67.8 | 40.1 | 0.924 | 76.5 | high |
| 4 | Enner Valencia | Ecuador | FWD | md2 | Curaçao | 71.307 | strong_candidate | 5.885 | 5.473 | 13.47 | 0.928 | 53.6 | 61.3 | 37.9 | 0.94 | 64.8 | high |
| 2 | Nico O'Reilly | England | DEF | md3 | Panama | 69.248 | strong_candidate | 6.81 | 6.333 | 14.485 | 1.347 | 93.3 | 75.2 | 49.3 | 0.876 | 73.1 | high |
| 5 | Patrik Schick | Czechia | FWD | md2 | South Africa | 69.141 | strong_candidate | 6.276 | 5.837 | 13.992 | 0.8 | 60.2 | 63.9 | 40.2 | 0.939 | 64.7 | high |
| 6 | Hernán Galíndez | Ecuador | GK | md2 | Curaçao | 68.576 | strong_candidate | 5.777 | 5.373 | 11.77 | 1.279 | 60.2 | 64.8 | 39 | 0.94 | 82.7 | high |
| 7 | Ayase Ueda | Japan | FWD | md2 | Tunisia | 68.459 | strong_candidate | 6.446 | 5.995 | 14.582 | 0.856 | 88.1 | 77.7 | 42.6 | 0.947 | 65.1 | high |
| 3 | Ivan Perisic | Croatia | FWD | md3 | Ghana | 67.187 | strong_candidate | 5.374 | 4.998 | 11.737 | 0.926 | 36.9 | 51.3 | 37.5 | 0.908 | 63 | high |
| 8 | Nuno Alexandre Tavares Mendes | Portugal | DEF | md2 | Uzbekistan | 66.322 | strong_candidate | 8.135 | 7.565 | 16.988 | 1.304 | 100 | 78.3 | 53.9 | 0.892 | 74.2 | high |
| 3 | Nuno Alexandre Tavares Mendes | Portugal | DEF | md1 | Congo DR | 64.888 | watchlist_candidate | 8.192 | 7.618 | 17.062 | 1.313 | 100 | 78.3 | 53.9 | 0.892 | 74.2 | high |
| 6 | Enner Valencia | Ecuador | FWD | group_stage_full | Group stage average | 64.68 | watchlist_candidate | 14.517 | 13.501 | 13.47 | 2.288 | 53.6 | 61.3 | 37.9 | 0.94 | 64.8 | high |
| 4 | Nico O'Reilly | England | DEF | md1 | Croatia | 63.753 | watchlist_candidate | 5.649 | 5.253 | 11.957 | 1.118 | 93.3 | 75.2 | 49.3 | 0.876 | 73.1 | high |
| 4 | Hiroki Ito | Japan | DEF | md3 | Sweden | 63.349 | watchlist_candidate | 4.945 | 4.599 | 10.471 | 1.179 | 66.2 | 66.7 | 41.6 | 0.89 | 74.1 | high |
| 9 | Joel Ordóñez | Ecuador | DEF | md2 | Curaçao | 63.044 | watchlist_candidate | 5.816 | 5.409 | 12.31 | 1.387 | 39.9 | 56.9 | 39.2 | 0.924 | 76.5 | high |
| 7 | Patrik Schick | Czechia | FWD | group_stage_full | Group stage average | 63.018 | watchlist_candidate | 15.53 | 14.444 | 13.992 | 1.979 | 60.2 | 63.9 | 40.2 | 0.939 | 64.7 | high |
| 5 | Ayase Ueda | Japan | FWD | md1 | Netherlands | 62.914 | watchlist_candidate | 4.631 | 4.307 | 10.06 | 0.615 | 88.1 | 77.7 | 42.6 | 0.947 | 65.1 | high |

### Captain Alpha

Position distribution: {"FWD":17,"MID":8}

| Rank | Name | Country | Pos | Scope | Opponent | Score | Tier | Raw | Risk | Captain | Value | Alpha | Portfolio | Downside | Start | Min | Conf |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Lionel Messi | Argentina | FWD | md3 | Jordan | 98.623 | top_pick_candidate | 8.119 | 7.55 | 17.926 | 0.755 | 100 | 77.1 | 55.8 | 0.95 | 65.3 | high |
| 1 | Lionel Messi | Argentina | FWD | md1 | Algeria | 97.549 | top_pick_candidate | 8.119 | 7.55 | 17.875 | 0.755 | 100 | 77.1 | 55.8 | 0.95 | 65.3 | high |
| 1 | Lionel Messi | Argentina | FWD | md2 | Austria | 97.065 | top_pick_candidate | 8.119 | 7.55 | 17.827 | 0.755 | 100 | 77.1 | 55.8 | 0.95 | 65.3 | high |
| 1 | Lionel Messi | Argentina | FWD | group_stage_full | Group stage average | 96.776 | top_pick_candidate | 24.357 | 22.65 | 17.926 | 2.265 | 100 | 77.1 | 55.8 | 0.95 | 65.3 | high |
| 2 | Harry Kane | England | FWD | md3 | Panama | 93.616 | top_pick_candidate | 7.552 | 7.023 | 16.782 | 0.669 | 100 | 75.6 | 51.1 | 0.944 | 65 | high |
| 2 | Harry Kane | England | FWD | md2 | Ghana | 93.135 | top_pick_candidate | 7.552 | 7.023 | 16.855 | 0.669 | 100 | 75.6 | 51.1 | 0.944 | 65 | high |
| 2 | Harry Kane | England | FWD | md1 | Croatia | 92.036 | top_pick_candidate | 7.265 | 6.757 | 16.033 | 0.644 | 100 | 75.6 | 51.1 | 0.944 | 65 | high |
| 2 | Harry Kane | England | FWD | group_stage_full | Group stage average | 91.853 | top_pick_candidate | 22.369 | 20.803 | 16.855 | 1.981 | 100 | 75.6 | 51.1 | 0.944 | 65 | high |
| 3 | Kylian Mbappé | France | FWD | md3 | Norway | 91.405 | top_pick_candidate | 7.154 | 6.653 | 15.832 | 0.634 | 100 | 72.6 | 52.8 | 0.912 | 63.2 | high |
| 3 | Bruno Miguel Borges Fernandes | Portugal | MID | md2 | Uzbekistan | 90.984 | top_pick_candidate | 8.101 | 7.534 | 17.404 | 0.886 | 98.5 | 74.2 | 52.3 | 0.92 | 68.9 | high |
| 4 | Kylian Mbappé | France | FWD | md2 | Iraq | 90.838 | top_pick_candidate | 7.281 | 6.772 | 16.348 | 0.645 | 100 | 72.6 | 52.8 | 0.912 | 63.2 | high |
| 3 | Bruno Miguel Borges Fernandes | Portugal | MID | md1 | Congo DR | 89.876 | top_pick_candidate | 7.962 | 7.404 | 17.059 | 0.871 | 98.5 | 74.2 | 52.3 | 0.92 | 68.9 | high |
| 3 | Kylian Mbappé | France | FWD | group_stage_full | Group stage average | 89.303 | top_pick_candidate | 21.476 | 19.973 | 16.348 | 1.902 | 100 | 72.6 | 52.8 | 0.912 | 63.2 | high |
| 4 | Enzo Fernández | Argentina | MID | md3 | Jordan | 88.93 | top_pick_candidate | 7.458 | 6.936 | 16.297 | 0.925 | 100 | 80.7 | 52.3 | 0.95 | 70.8 | high |
| 5 | Lautaro Martínez | Argentina | FWD | md3 | Jordan | 88.355 | top_pick_candidate | 6.428 | 5.978 | 14.746 | 0.679 | 97.7 | 74.6 | 46.9 | 0.944 | 65 | high |
| 5 | Luis Díaz | Colombia | MID | md2 | Congo DR | 88.075 | top_pick_candidate | 8.493 | 7.899 | 18.261 | 0.975 | 100 | 66.8 | 64.5 | 0.95 | 70.8 | high |
| 4 | Kylian Mbappé | France | FWD | md1 | Senegal | 88.059 | top_pick_candidate | 7.041 | 6.548 | 15.632 | 0.624 | 100 | 72.6 | 52.8 | 0.912 | 63.2 | high |
| 5 | Enzo Fernández | Argentina | MID | md1 | Algeria | 88.025 | top_pick_candidate | 7.481 | 6.957 | 16.289 | 0.928 | 100 | 80.7 | 52.3 | 0.95 | 70.8 | high |
| 6 | Enzo Fernández | Argentina | MID | md2 | Austria | 87.45 | top_pick_candidate | 7.458 | 6.936 | 16.198 | 0.925 | 100 | 80.7 | 52.3 | 0.95 | 70.8 | high |
| 6 | Lautaro Martínez | Argentina | FWD | md1 | Algeria | 87.402 | top_pick_candidate | 6.428 | 5.978 | 14.695 | 0.679 | 97.7 | 74.6 | 46.9 | 0.944 | 65 | high |
| 4 | Enzo Fernández | Argentina | MID | group_stage_full | Group stage average | 87.14 | top_pick_candidate | 22.397 | 20.829 | 16.297 | 2.777 | 100 | 80.7 | 52.3 | 0.95 | 70.8 | high |
| 7 | Mikel Oyarzabal | Spain | FWD | md1 | Cabo Verde | 87.033 | top_pick_candidate | 6.326 | 5.883 | 14.358 | 0.726 | 100 | 74.7 | 45.9 | 0.928 | 64.1 | high |
| 7 | Michael Olise | France | MID | md2 | Iraq | 86.965 | top_pick_candidate | 8.542 | 7.944 | 18.517 | 0.836 | 100 | 64.9 | 68.4 | 0.92 | 68.9 | high |
| 8 | Lautaro Martínez | Argentina | FWD | md2 | Austria | 86.962 | top_pick_candidate | 6.428 | 5.978 | 14.647 | 0.679 | 97.7 | 74.6 | 46.9 | 0.944 | 65 | high |
| 5 | Lautaro Martínez | Argentina | FWD | group_stage_full | Group stage average | 86.574 | top_pick_candidate | 19.284 | 17.934 | 14.746 | 2.038 | 97.7 | 74.6 | 46.9 | 0.944 | 65 | high |

## Top 25 By Matchday

### group_stage_full

| Rank | Name | Country | Pos | Scope | Opponent | Score | Tier | Raw | Risk | Captain | Value | Alpha | Portfolio | Downside | Start | Min | Conf |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Lionel Messi | Argentina | FWD | group_stage_full | Group stage average | 96.776 | top_pick_candidate | 24.357 | 22.65 | 17.926 | 2.265 | 100 | 77.1 | 55.8 | 0.95 | 65.3 | high |
| 2 | Harry Kane | England | FWD | group_stage_full | Group stage average | 91.853 | top_pick_candidate | 22.369 | 20.803 | 16.855 | 1.981 | 100 | 75.6 | 51.1 | 0.944 | 65 | high |
| 3 | Kylian Mbappé | France | FWD | group_stage_full | Group stage average | 89.303 | top_pick_candidate | 21.476 | 19.973 | 16.348 | 1.902 | 100 | 72.6 | 52.8 | 0.912 | 63.2 | high |
| 4 | Enzo Fernández | Argentina | MID | group_stage_full | Group stage average | 87.14 | top_pick_candidate | 22.397 | 20.829 | 16.297 | 2.777 | 100 | 80.7 | 52.3 | 0.95 | 70.8 | high |
| 5 | Lautaro Martínez | Argentina | FWD | group_stage_full | Group stage average | 86.574 | top_pick_candidate | 19.284 | 17.934 | 14.746 | 2.038 | 97.7 | 74.6 | 46.9 | 0.944 | 65 | high |
| 6 | Bruno Miguel Borges Fernandes | Portugal | MID | group_stage_full | Group stage average | 86.47 | top_pick_candidate | 22.001 | 20.46 | 17.404 | 2.407 | 98.5 | 74.2 | 52.3 | 0.92 | 68.9 | high |
| 7 | Michael Olise | France | MID | group_stage_full | Group stage average | 84.299 | top_pick_candidate | 24.503 | 22.788 | 18.517 | 2.399 | 100 | 64.9 | 68.4 | 0.92 | 68.9 | high |
| 8 | Cristiano Ronaldo dos Santos Aveiro | Portugal | FWD | group_stage_full | Group stage average | 84.169 | top_pick_candidate | 19.29 | 17.94 | 15.163 | 1.794 | 95.6 | 70.5 | 47.9 | 0.92 | 63.7 | high |
| 9 | Mikel Oyarzabal | Spain | FWD | group_stage_full | Group stage average | 82.65 | top_pick_candidate | 18.471 | 17.178 | 14.358 | 2.121 | 100 | 74.7 | 45.9 | 0.928 | 64.1 | high |
| 1 | Enzo Fernández | Argentina | MID | group_stage_full | Group stage average | 82.501 | top_pick_candidate | 22.397 | 20.829 | 16.297 | 2.777 | 100 | 80.7 | 52.3 | 0.95 | 70.8 | high |
| 2 | Emiliano Martínez | Argentina | GK | group_stage_full | Group stage average | 82.278 | top_pick_candidate | 17.899 | 16.646 | 12.294 | 3.329 | 100 | 82.1 | 44.2 | 0.94 | 82.7 | high |
| 10 | Luis Díaz | Colombia | MID | group_stage_full | Group stage average | 81.982 | top_pick_candidate | 22.989 | 21.38 | 18.282 | 2.64 | 100 | 66.8 | 64.5 | 0.95 | 70.8 | high |
| 3 | Lionel Messi | Argentina | FWD | group_stage_full | Group stage average | 81.962 | top_pick_candidate | 24.357 | 22.65 | 17.926 | 2.265 | 100 | 77.1 | 55.8 | 0.95 | 65.3 | high |
| 11 | Ferran Torres | Spain | FWD | group_stage_full | Group stage average | 81.38 | top_pick_candidate | 19.718 | 18.337 | 15.065 | 2.351 | 51.4 | 47.7 | 58.9 | 0.74 | 62 | high |
| 4 | Harry Kane | England | FWD | group_stage_full | Group stage average | 81.222 | top_pick_candidate | 22.369 | 20.803 | 16.855 | 1.981 | 100 | 75.6 | 51.1 | 0.944 | 65 | high |
| 12 | Ayase Ueda | Japan | FWD | group_stage_full | Group stage average | 81.036 | top_pick_candidate | 17.507 | 16.282 | 14.582 | 2.326 | 88.1 | 77.7 | 42.6 | 0.947 | 65.1 | high |
| 1 | Enzo Fernández | Argentina | MID | group_stage_full | Group stage average | 80.736 | top_pick_candidate | 22.397 | 20.829 | 16.297 | 2.777 | 100 | 80.7 | 52.3 | 0.95 | 70.8 | high |
| 2 | Lionel Messi | Argentina | FWD | group_stage_full | Group stage average | 80.693 | top_pick_candidate | 24.357 | 22.65 | 17.926 | 2.265 | 100 | 77.1 | 55.8 | 0.95 | 65.3 | high |
| 5 | Bruno Miguel Borges Fernandes | Portugal | MID | group_stage_full | Group stage average | 79.857 | strong_candidate | 22.001 | 20.46 | 17.404 | 2.407 | 98.5 | 74.2 | 52.3 | 0.92 | 68.9 | high |
| 6 | Lautaro Martínez | Argentina | FWD | group_stage_full | Group stage average | 79.79 | strong_candidate | 19.284 | 17.934 | 14.746 | 2.038 | 97.7 | 74.6 | 46.9 | 0.944 | 65 | high |
| 13 | Erling Haaland | Norway | FWD | group_stage_full | Group stage average | 79.685 | strong_candidate | 16.748 | 15.576 | 15.117 | 1.483 | 66.3 | 57.8 | 42.1 | 0.944 | 65 | high |
| 7 | Florian Wirtz | Germany | MID | group_stage_full | Group stage average | 79.669 | strong_candidate | 18.529 | 17.232 | 14.284 | 2.298 | 62.2 | 61.6 | 45.5 | 0.923 | 69.1 | high |
| 8 | Alexis Mac Allister | Argentina | MID | group_stage_full | Group stage average | 79.483 | strong_candidate | 14.035 | 13.053 | 10.236 | 1.978 | 28.7 | 46.5 | 36.8 | 0.95 | 70.8 | high |
| 9 | Ayase Ueda | Japan | FWD | group_stage_full | Group stage average | 79.476 | strong_candidate | 17.507 | 16.282 | 14.582 | 2.326 | 88.1 | 77.7 | 42.6 | 0.947 | 65.1 | high |
| 10 | Declan Rice | England | MID | group_stage_full | Group stage average | 79.23 | strong_candidate | 16.089 | 14.963 | 11.79 | 2.138 | 39.1 | 51.4 | 40.1 | 0.931 | 69.6 | high |

### md1

| Rank | Name | Country | Pos | Scope | Opponent | Score | Tier | Raw | Risk | Captain | Value | Alpha | Portfolio | Downside | Start | Min | Conf |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Lionel Messi | Argentina | FWD | md1 | Algeria | 97.549 | top_pick_candidate | 8.119 | 7.55 | 17.875 | 0.755 | 100 | 77.1 | 55.8 | 0.95 | 65.3 | high |
| 2 | Harry Kane | England | FWD | md1 | Croatia | 92.036 | top_pick_candidate | 7.265 | 6.757 | 16.033 | 0.644 | 100 | 75.6 | 51.1 | 0.944 | 65 | high |
| 3 | Bruno Miguel Borges Fernandes | Portugal | MID | md1 | Congo DR | 89.876 | top_pick_candidate | 7.962 | 7.404 | 17.059 | 0.871 | 98.5 | 74.2 | 52.3 | 0.92 | 68.9 | high |
| 4 | Kylian Mbappé | France | FWD | md1 | Senegal | 88.059 | top_pick_candidate | 7.041 | 6.548 | 15.632 | 0.624 | 100 | 72.6 | 52.8 | 0.912 | 63.2 | high |
| 5 | Enzo Fernández | Argentina | MID | md1 | Algeria | 88.025 | top_pick_candidate | 7.481 | 6.957 | 16.289 | 0.928 | 100 | 80.7 | 52.3 | 0.95 | 70.8 | high |
| 6 | Lautaro Martínez | Argentina | FWD | md1 | Algeria | 87.402 | top_pick_candidate | 6.428 | 5.978 | 14.695 | 0.679 | 97.7 | 74.6 | 46.9 | 0.944 | 65 | high |
| 7 | Mikel Oyarzabal | Spain | FWD | md1 | Cabo Verde | 87.033 | top_pick_candidate | 6.326 | 5.883 | 14.358 | 0.726 | 100 | 74.7 | 45.9 | 0.928 | 64.1 | high |
| 8 | Luis Díaz | Colombia | MID | md1 | Uzbekistan | 86.318 | top_pick_candidate | 8.471 | 7.878 | 18.282 | 0.973 | 100 | 66.8 | 64.5 | 0.95 | 70.8 | high |
| 9 | Erling Haaland | Norway | FWD | md1 | Iraq | 85.988 | top_pick_candidate | 6.655 | 6.19 | 15.117 | 0.59 | 66.3 | 57.8 | 42.1 | 0.944 | 65 | high |
| 10 | Cristiano Ronaldo dos Santos Aveiro | Portugal | FWD | md1 | Congo DR | 85.946 | top_pick_candidate | 6.676 | 6.209 | 15.111 | 0.621 | 95.6 | 70.5 | 47.9 | 0.92 | 63.7 | high |
| 11 | Ferran Torres | Spain | FWD | md1 | Cabo Verde | 84.915 | top_pick_candidate | 6.594 | 6.132 | 15.065 | 0.786 | 51.4 | 47.7 | 58.9 | 0.74 | 62 | high |
| 1 | Enzo Fernández | Argentina | MID | md1 | Algeria | 83.175 | top_pick_candidate | 7.481 | 6.957 | 16.289 | 0.928 | 100 | 80.7 | 52.3 | 0.95 | 70.8 | high |
| 2 | Harry Kane | England | FWD | md1 | Croatia | 82.933 | top_pick_candidate | 7.265 | 6.757 | 16.033 | 0.644 | 100 | 75.6 | 51.1 | 0.944 | 65 | high |
| 3 | Emiliano Martínez | Argentina | GK | md1 | Algeria | 82.833 | top_pick_candidate | 6.049 | 5.626 | 12.294 | 1.125 | 100 | 82.1 | 44.2 | 0.94 | 82.7 | high |
| 4 | Lionel Messi | Argentina | FWD | md1 | Algeria | 82.605 | top_pick_candidate | 8.119 | 7.55 | 17.875 | 0.755 | 100 | 77.1 | 55.8 | 0.95 | 65.3 | high |
| 5 | Unai Simón | Spain | GK | md1 | Cabo Verde | 82.274 | top_pick_candidate | 5.838 | 5.429 | 11.957 | 1.086 | 81.2 | 72 | 42.8 | 0.908 | 79.9 | high |
| 6 | Camilo Vargas | Colombia | GK | md1 | Uzbekistan | 81.912 | top_pick_candidate | 6.295 | 5.855 | 12.704 | 1.362 | 81.2 | 74.6 | 42.5 | 0.94 | 82.7 | high |
| 7 | Mikel Oyarzabal | Spain | FWD | md1 | Cabo Verde | 81.901 | top_pick_candidate | 6.326 | 5.883 | 14.358 | 0.726 | 100 | 74.7 | 45.9 | 0.928 | 64.1 | high |
| 1 | Nuno Alexandre Tavares Mendes | Portugal | DEF | md1 | Congo DR | 81.415 | top_pick_candidate | 8.192 | 7.618 | 17.062 | 1.313 | 100 | 78.3 | 53.9 | 0.892 | 74.2 | high |
| 8 | Florian Wirtz | Germany | MID | md1 | Curaçao | 81.311 | top_pick_candidate | 6.615 | 6.152 | 14.284 | 0.82 | 62.2 | 61.6 | 45.5 | 0.923 | 69.1 | high |
| 9 | Bruno Miguel Borges Fernandes | Portugal | MID | md1 | Congo DR | 81.067 | top_pick_candidate | 7.962 | 7.404 | 17.059 | 0.871 | 98.5 | 74.2 | 52.3 | 0.92 | 68.9 | high |
| 10 | Joshua Kimmich | Germany | DEF | md1 | Curaçao | 80.877 | top_pick_candidate | 7.254 | 6.746 | 15.051 | 1.227 | 76.1 | 67.2 | 46.4 | 0.91 | 75.5 | high |
| 11 | Declan Rice | England | MID | md1 | Croatia | 80.728 | top_pick_candidate | 4.965 | 4.617 | 10.284 | 0.66 | 39.1 | 51.4 | 40.1 | 0.931 | 69.6 | high |
| 12 | Hernán Galíndez | Ecuador | GK | md1 | Côte d'Ivoire | 80.646 | top_pick_candidate | 5.735 | 5.333 | 11.424 | 1.27 | 60.2 | 64.8 | 39 | 0.94 | 82.7 | high |
| 2 | Lionel Messi | Argentina | FWD | md1 | Algeria | 80.642 | top_pick_candidate | 8.119 | 7.55 | 17.875 | 0.755 | 100 | 77.1 | 55.8 | 0.95 | 65.3 | high |

### md2

| Rank | Name | Country | Pos | Scope | Opponent | Score | Tier | Raw | Risk | Captain | Value | Alpha | Portfolio | Downside | Start | Min | Conf |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Lionel Messi | Argentina | FWD | md2 | Austria | 97.065 | top_pick_candidate | 8.119 | 7.55 | 17.827 | 0.755 | 100 | 77.1 | 55.8 | 0.95 | 65.3 | high |
| 2 | Harry Kane | England | FWD | md2 | Ghana | 93.135 | top_pick_candidate | 7.552 | 7.023 | 16.855 | 0.669 | 100 | 75.6 | 51.1 | 0.944 | 65 | high |
| 3 | Bruno Miguel Borges Fernandes | Portugal | MID | md2 | Uzbekistan | 90.984 | top_pick_candidate | 8.101 | 7.534 | 17.404 | 0.886 | 98.5 | 74.2 | 52.3 | 0.92 | 68.9 | high |
| 4 | Kylian Mbappé | France | FWD | md2 | Iraq | 90.838 | top_pick_candidate | 7.281 | 6.772 | 16.348 | 0.645 | 100 | 72.6 | 52.8 | 0.912 | 63.2 | high |
| 5 | Luis Díaz | Colombia | MID | md2 | Congo DR | 88.075 | top_pick_candidate | 8.493 | 7.899 | 18.261 | 0.975 | 100 | 66.8 | 64.5 | 0.95 | 70.8 | high |
| 6 | Enzo Fernández | Argentina | MID | md2 | Austria | 87.45 | top_pick_candidate | 7.458 | 6.936 | 16.198 | 0.925 | 100 | 80.7 | 52.3 | 0.95 | 70.8 | high |
| 7 | Michael Olise | France | MID | md2 | Iraq | 86.965 | top_pick_candidate | 8.542 | 7.944 | 18.517 | 0.836 | 100 | 64.9 | 68.4 | 0.92 | 68.9 | high |
| 8 | Lautaro Martínez | Argentina | FWD | md2 | Austria | 86.962 | top_pick_candidate | 6.428 | 5.978 | 14.647 | 0.679 | 97.7 | 74.6 | 46.9 | 0.944 | 65 | high |
| 9 | Cristiano Ronaldo dos Santos Aveiro | Portugal | FWD | md2 | Uzbekistan | 85.972 | top_pick_candidate | 6.686 | 6.218 | 15.163 | 0.622 | 95.6 | 70.5 | 47.9 | 0.92 | 63.7 | high |
| 10 | Mikel Oyarzabal | Spain | FWD | md2 | Saudi Arabia | 84.687 | top_pick_candidate | 6.326 | 5.883 | 14.35 | 0.726 | 100 | 74.7 | 45.9 | 0.928 | 64.1 | high |
| 1 | Hiroki Ito | Japan | DEF | md2 | Tunisia | 84.686 | top_pick_candidate | 6.609 | 6.146 | 13.8 | 1.576 | 66.2 | 66.7 | 41.6 | 0.89 | 74.1 | high |
| 11 | Ayase Ueda | Japan | FWD | md2 | Tunisia | 84.326 | top_pick_candidate | 6.446 | 5.995 | 14.582 | 0.856 | 88.1 | 77.7 | 42.6 | 0.947 | 65.1 | high |
| 1 | Camilo Vargas | Colombia | GK | md2 | Congo DR | 83.644 | top_pick_candidate | 6.171 | 5.739 | 12.408 | 1.335 | 81.2 | 74.6 | 42.5 | 0.94 | 82.7 | high |
| 12 | Darwin Núñez | Uruguay | FWD | md2 | Cabo Verde | 83.301 | top_pick_candidate | 6.448 | 5.997 | 14.234 | 0.8 | 69 | 68.8 | 39.5 | 0.945 | 65 | high |
| 2 | Enzo Fernández | Argentina | MID | md2 | Austria | 83.032 | top_pick_candidate | 7.458 | 6.936 | 16.198 | 0.925 | 100 | 80.7 | 52.3 | 0.95 | 70.8 | high |
| 13 | Ferran Torres | Spain | FWD | md2 | Saudi Arabia | 82.56 | top_pick_candidate | 6.594 | 6.132 | 15.057 | 0.786 | 51.4 | 47.7 | 58.9 | 0.74 | 62 | high |
| 3 | Emiliano Martínez | Argentina | GK | md2 | Austria | 82.547 | top_pick_candidate | 5.925 | 5.51 | 12.013 | 1.102 | 100 | 82.1 | 44.2 | 0.94 | 82.7 | high |
| 4 | Lionel Messi | Argentina | FWD | md2 | Austria | 82.482 | top_pick_candidate | 8.119 | 7.55 | 17.827 | 0.755 | 100 | 77.1 | 55.8 | 0.95 | 65.3 | high |
| 5 | Harry Kane | England | FWD | md2 | Ghana | 82.216 | top_pick_candidate | 7.552 | 7.023 | 16.855 | 0.669 | 100 | 75.6 | 51.1 | 0.944 | 65 | high |
| 6 | Daniel Muñoz | Colombia | DEF | md2 | Congo DR | 82.184 | top_pick_candidate | 6.465 | 6.013 | 13.414 | 1.307 | 60.4 | 62.1 | 43.3 | 0.94 | 77.7 | high |
| 7 | Jhon Lucumí | Colombia | DEF | md2 | Congo DR | 81.934 | top_pick_candidate | 5.584 | 5.193 | 11.548 | 1.208 | 38 | 51.8 | 39.1 | 0.94 | 77.7 | high |
| 14 | Patrik Schick | Czechia | FWD | md2 | South Africa | 81.894 | top_pick_candidate | 6.276 | 5.837 | 13.992 | 0.8 | 60.2 | 63.9 | 40.2 | 0.939 | 64.7 | high |
| 8 | Bruno Miguel Borges Fernandes | Portugal | MID | md2 | Uzbekistan | 81.415 | top_pick_candidate | 8.101 | 7.534 | 17.404 | 0.886 | 98.5 | 74.2 | 52.3 | 0.92 | 68.9 | high |
| 15 | Petar Musa | Croatia | FWD | md2 | Panama | 81.395 | top_pick_candidate | 6.621 | 6.158 | 14.878 | 1.207 | 35.9 | 41.3 | 53.5 | 0.74 | 62 | high |
| 9 | Hernán Galíndez | Ecuador | GK | md2 | Curaçao | 81.145 | top_pick_candidate | 5.777 | 5.373 | 11.77 | 1.279 | 60.2 | 64.8 | 39 | 0.94 | 82.7 | high |

### md3

| Rank | Name | Country | Pos | Scope | Opponent | Score | Tier | Raw | Risk | Captain | Value | Alpha | Portfolio | Downside | Start | Min | Conf |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Lionel Messi | Argentina | FWD | md3 | Jordan | 98.623 | top_pick_candidate | 8.119 | 7.55 | 17.926 | 0.755 | 100 | 77.1 | 55.8 | 0.95 | 65.3 | high |
| 2 | Harry Kane | England | FWD | md3 | Panama | 93.616 | top_pick_candidate | 7.552 | 7.023 | 16.782 | 0.669 | 100 | 75.6 | 51.1 | 0.944 | 65 | high |
| 3 | Kylian Mbappé | France | FWD | md3 | Norway | 91.405 | top_pick_candidate | 7.154 | 6.653 | 15.832 | 0.634 | 100 | 72.6 | 52.8 | 0.912 | 63.2 | high |
| 4 | Enzo Fernández | Argentina | MID | md3 | Jordan | 88.93 | top_pick_candidate | 7.458 | 6.936 | 16.297 | 0.925 | 100 | 80.7 | 52.3 | 0.95 | 70.8 | high |
| 5 | Lautaro Martínez | Argentina | FWD | md3 | Jordan | 88.355 | top_pick_candidate | 6.428 | 5.978 | 14.746 | 0.679 | 97.7 | 74.6 | 46.9 | 0.944 | 65 | high |
| 6 | Michael Olise | France | MID | md3 | Norway | 85.73 | top_pick_candidate | 8.1 | 7.533 | 17.325 | 0.793 | 100 | 64.9 | 68.4 | 0.92 | 68.9 | high |
| 7 | Ayase Ueda | Japan | FWD | md3 | Sweden | 84.438 | top_pick_candidate | 6.43 | 5.98 | 14.429 | 0.854 | 88.1 | 77.7 | 42.6 | 0.947 | 65.1 | high |
| 1 | Enzo Fernández | Argentina | MID | md3 | Jordan | 83.792 | top_pick_candidate | 7.458 | 6.936 | 16.297 | 0.925 | 100 | 80.7 | 52.3 | 0.95 | 70.8 | high |
| 2 | Lionel Messi | Argentina | FWD | md3 | Jordan | 83.258 | top_pick_candidate | 8.119 | 7.55 | 17.926 | 0.755 | 100 | 77.1 | 55.8 | 0.95 | 65.3 | high |
| 8 | Petar Musa | Croatia | FWD | md3 | Ghana | 83.258 | top_pick_candidate | 6.71 | 6.24 | 15.153 | 1.224 | 35.9 | 41.3 | 53.5 | 0.74 | 62 | high |
| 9 | Nicolas Jackson | Senegal | FWD | md3 | Iraq | 82.969 | top_pick_candidate | 6.659 | 6.193 | 15.018 | 0.924 | 36.1 | 42.4 | 49.1 | 0.755 | 62 | high |
| 3 | Emiliano Martínez | Argentina | GK | md3 | Jordan | 82.917 | top_pick_candidate | 5.925 | 5.51 | 12.112 | 1.102 | 100 | 82.1 | 44.2 | 0.94 | 82.7 | high |
| 1 | Lionel Messi | Argentina | FWD | md3 | Jordan | 82.411 | top_pick_candidate | 8.119 | 7.55 | 17.926 | 0.755 | 100 | 77.1 | 55.8 | 0.95 | 65.3 | high |
| 2 | Enzo Fernández | Argentina | MID | md3 | Jordan | 82.348 | top_pick_candidate | 7.458 | 6.936 | 16.297 | 0.925 | 100 | 80.7 | 52.3 | 0.95 | 70.8 | high |
| 4 | Harry Kane | England | FWD | md3 | Panama | 82.156 | top_pick_candidate | 7.552 | 7.023 | 16.782 | 0.669 | 100 | 75.6 | 51.1 | 0.944 | 65 | high |
| 10 | Kevin De Bruyne | Belgium | MID | md3 | New Zealand | 81.552 | top_pick_candidate | 7.121 | 6.623 | 15.207 | 0.883 | 80 | 69.2 | 49.3 | 0.913 | 68.4 | high |
| 11 | Ferran Torres | Spain | FWD | md3 | Uruguay | 81.522 | top_pick_candidate | 6.53 | 6.073 | 14.697 | 0.779 | 51.4 | 47.7 | 58.9 | 0.74 | 62 | high |
| 5 | Virgil van Dijk | Netherlands | DEF | md3 | Tunisia | 81.281 | top_pick_candidate | 6.075 | 5.65 | 12.719 | 1.027 | 47.3 | 55 | 39.9 | 0.934 | 77.2 | high |
| 6 | Lautaro Martínez | Argentina | FWD | md3 | Jordan | 81.097 | top_pick_candidate | 6.428 | 5.978 | 14.746 | 0.679 | 97.7 | 74.6 | 46.9 | 0.944 | 65 | high |
| 7 | Alexis Mac Allister | Argentina | MID | md3 | Jordan | 80.793 | top_pick_candidate | 4.671 | 4.344 | 10.236 | 0.658 | 28.7 | 46.5 | 36.8 | 0.95 | 70.8 | high |
| 8 | Thibaut Courtois | Belgium | GK | md3 | New Zealand | 80.727 | top_pick_candidate | 5.478 | 5.094 | 11.149 | 1.04 | 74.7 | 69.8 | 42.2 | 0.892 | 78.5 | high |
| 9 | Denzel Dumfries | Netherlands | DEF | md3 | Tunisia | 80.661 | top_pick_candidate | 6.993 | 6.503 | 14.807 | 1.141 | 81.6 | 69.7 | 46.9 | 0.908 | 75.4 | high |
| 10 | Declan Rice | England | MID | md3 | Panama | 80.306 | top_pick_candidate | 5.562 | 5.173 | 11.717 | 0.739 | 39.1 | 51.4 | 40.1 | 0.931 | 69.6 | high |
| 11 | Ayase Ueda | Japan | FWD | md3 | Sweden | 80.266 | top_pick_candidate | 6.43 | 5.98 | 14.429 | 0.854 | 88.1 | 77.7 | 42.6 | 0.947 | 65.1 | high |
| 12 | Jordan Pickford | England | GK | md3 | Panama | 80.103 | top_pick_candidate | 5.676 | 5.279 | 11.566 | 1.1 | 79.6 | 73.2 | 41.6 | 0.916 | 80.6 | high |

## Top 25 By Position

### GK

| Rank | Name | Country | Pos | Scope | Opponent | Score | Tier | Raw | Risk | Captain | Value | Alpha | Portfolio | Downside | Start | Min | Conf |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Camilo Vargas | Colombia | GK | md2 | Congo DR | 83.644 | top_pick_candidate | 6.171 | 5.739 | 12.408 | 1.335 | 81.2 | 74.6 | 42.5 | 0.94 | 82.7 | high |
| 3 | Emiliano Martínez | Argentina | GK | md3 | Jordan | 82.917 | top_pick_candidate | 5.925 | 5.51 | 12.112 | 1.102 | 100 | 82.1 | 44.2 | 0.94 | 82.7 | high |
| 3 | Emiliano Martínez | Argentina | GK | md1 | Algeria | 82.833 | top_pick_candidate | 6.049 | 5.626 | 12.294 | 1.125 | 100 | 82.1 | 44.2 | 0.94 | 82.7 | high |
| 3 | Emiliano Martínez | Argentina | GK | md2 | Austria | 82.547 | top_pick_candidate | 5.925 | 5.51 | 12.013 | 1.102 | 100 | 82.1 | 44.2 | 0.94 | 82.7 | high |
| 2 | Emiliano Martínez | Argentina | GK | group_stage_full | Group stage average | 82.278 | top_pick_candidate | 17.899 | 16.646 | 12.294 | 3.329 | 100 | 82.1 | 44.2 | 0.94 | 82.7 | high |
| 5 | Unai Simón | Spain | GK | md1 | Cabo Verde | 82.274 | top_pick_candidate | 5.838 | 5.429 | 11.957 | 1.086 | 81.2 | 72 | 42.8 | 0.908 | 79.9 | high |
| 6 | Camilo Vargas | Colombia | GK | md1 | Uzbekistan | 81.912 | top_pick_candidate | 6.295 | 5.855 | 12.704 | 1.362 | 81.2 | 74.6 | 42.5 | 0.94 | 82.7 | high |
| 9 | Hernán Galíndez | Ecuador | GK | md2 | Curaçao | 81.145 | top_pick_candidate | 5.777 | 5.373 | 11.77 | 1.279 | 60.2 | 64.8 | 39 | 0.94 | 82.7 | high |
| 8 | Thibaut Courtois | Belgium | GK | md3 | New Zealand | 80.727 | top_pick_candidate | 5.478 | 5.094 | 11.149 | 1.04 | 74.7 | 69.8 | 42.2 | 0.892 | 78.5 | high |
| 12 | Hernán Galíndez | Ecuador | GK | md1 | Côte d'Ivoire | 80.646 | top_pick_candidate | 5.735 | 5.333 | 11.424 | 1.27 | 60.2 | 64.8 | 39 | 0.94 | 82.7 | high |
| 12 | Jordan Pickford | England | GK | md3 | Panama | 80.103 | top_pick_candidate | 5.676 | 5.279 | 11.566 | 1.1 | 79.6 | 73.2 | 41.6 | 0.916 | 80.6 | high |
| 13 | Yahia Fofana | Côte d'Ivoire | GK | md3 | Curaçao | 80.086 | top_pick_candidate | 6.065 | 5.64 | 12.172 | 1.343 | 33.3 | 51.2 | 35.6 | 0.932 | 82 | high |
| 20 | Jordan Pickford | England | GK | md2 | Ghana | 80.067 | top_pick_candidate | 5.676 | 5.279 | 11.639 | 1.1 | 79.6 | 73.2 | 41.6 | 0.916 | 80.6 | high |
| 21 | Unai Simón | Spain | GK | md2 | Saudi Arabia | 80.018 | top_pick_candidate | 5.719 | 5.318 | 11.724 | 1.064 | 81.2 | 72 | 42.8 | 0.908 | 79.9 | high |
| 14 | Édouard Mendy | Senegal | GK | md3 | Iraq | 80.003 | top_pick_candidate | 5.509 | 5.124 | 11.167 | 1.139 | 32.9 | 51.2 | 33.3 | 0.932 | 82 | high |
| 23 | Jordan Pickford | England | GK | md1 | Croatia | 79.706 | strong_candidate | 4.884 | 4.542 | 9.865 | 0.946 | 79.6 | 73.2 | 41.6 | 0.916 | 80.6 | high |
| 24 | Gregor Kobel | Switzerland | GK | md1 | Qatar | 79.491 | strong_candidate | 5.754 | 5.351 | 11.785 | 1.139 | 69.6 | 68 | 40.9 | 0.908 | 79.9 | high |
| 18 | Bart Verbruggen | Netherlands | GK | md3 | Tunisia | 79.222 | strong_candidate | 5.686 | 5.288 | 11.561 | 1.125 | 61.4 | 64.1 | 39.9 | 0.908 | 79.9 | high |
| 11 | Camilo Vargas | Colombia | GK | group_stage_full | Group stage average | 79.159 | strong_candidate | 16.196 | 15.063 | 12.704 | 3.503 | 81.2 | 74.6 | 42.5 | 0.94 | 82.7 | high |
| 12 | Jordan Pickford | England | GK | group_stage_full | Group stage average | 78.935 | strong_candidate | 16.236 | 15.1 | 11.639 | 3.146 | 79.6 | 73.2 | 41.6 | 0.916 | 80.6 | high |
| 13 | Unai Simón | Spain | GK | group_stage_full | Group stage average | 78.85 | strong_candidate | 16.453 | 15.3 | 11.957 | 3.06 | 81.2 | 72 | 42.8 | 0.908 | 79.9 | high |
| 18 | Alisson Ramsés Becker | Brazil | GK | group_stage_full | Group stage average | 78.378 | strong_candidate | 17.031 | 15.838 | 11.66 | 3.168 | 88.9 | 76.8 | 43 | 0.932 | 82 | high |
| 9 | Camilo Vargas | Colombia | GK | md2 | Congo DR | 75.747 | strong_candidate | 6.171 | 5.739 | 12.408 | 1.335 | 81.2 | 74.6 | 42.5 | 0.94 | 82.7 | high |
| 8 | Emiliano Martínez | Argentina | GK | md3 | Jordan | 75.318 | strong_candidate | 5.925 | 5.51 | 12.112 | 1.102 | 100 | 82.1 | 44.2 | 0.94 | 82.7 | high |
| 8 | Emiliano Martínez | Argentina | GK | group_stage_full | Group stage average | 74.928 | strong_candidate | 17.899 | 16.646 | 12.294 | 3.329 | 100 | 82.1 | 44.2 | 0.94 | 82.7 | high |

### DEF

| Rank | Name | Country | Pos | Scope | Opponent | Score | Tier | Raw | Risk | Captain | Value | Alpha | Portfolio | Downside | Start | Min | Conf |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Hiroki Ito | Japan | DEF | md2 | Tunisia | 84.686 | top_pick_candidate | 6.609 | 6.146 | 13.8 | 1.576 | 66.2 | 66.7 | 41.6 | 0.89 | 74.1 | high |
| 6 | Daniel Muñoz | Colombia | DEF | md2 | Congo DR | 82.184 | top_pick_candidate | 6.465 | 6.013 | 13.414 | 1.307 | 60.4 | 62.1 | 43.3 | 0.94 | 77.7 | high |
| 7 | Jhon Lucumí | Colombia | DEF | md2 | Congo DR | 81.934 | top_pick_candidate | 5.584 | 5.193 | 11.548 | 1.208 | 38 | 51.8 | 39.1 | 0.94 | 77.7 | high |
| 1 | Nuno Alexandre Tavares Mendes | Portugal | DEF | md1 | Congo DR | 81.415 | top_pick_candidate | 8.192 | 7.618 | 17.062 | 1.313 | 100 | 78.3 | 53.9 | 0.892 | 74.2 | high |
| 5 | Virgil van Dijk | Netherlands | DEF | md3 | Tunisia | 81.281 | top_pick_candidate | 6.075 | 5.65 | 12.719 | 1.027 | 47.3 | 55 | 39.9 | 0.934 | 77.2 | high |
| 10 | Johan Mojica | Colombia | DEF | md2 | Congo DR | 81.099 | top_pick_candidate | 5.603 | 5.21 | 11.459 | 1.336 | 65.4 | 67.8 | 40.1 | 0.924 | 76.5 | high |
| 11 | Dávinson Sánchez | Colombia | DEF | md2 | Congo DR | 81.011 | top_pick_candidate | 5.191 | 4.828 | 10.729 | 1.123 | 31.2 | 48.5 | 37.4 | 0.94 | 77.7 | high |
| 1 | Nuno Alexandre Tavares Mendes | Portugal | DEF | md2 | Uzbekistan | 80.975 | top_pick_candidate | 8.135 | 7.565 | 16.988 | 1.304 | 100 | 78.3 | 53.9 | 0.892 | 74.2 | high |
| 10 | Joshua Kimmich | Germany | DEF | md1 | Curaçao | 80.877 | top_pick_candidate | 7.254 | 6.746 | 15.051 | 1.227 | 76.1 | 67.2 | 46.4 | 0.91 | 75.5 | high |
| 12 | Willian Pacho | Ecuador | DEF | md2 | Curaçao | 80.86 | top_pick_candidate | 5.296 | 4.925 | 10.956 | 1.119 | 30.4 | 48 | 35.9 | 0.94 | 77.7 | high |
| 9 | Denzel Dumfries | Netherlands | DEF | md3 | Tunisia | 80.661 | top_pick_candidate | 6.993 | 6.503 | 14.807 | 1.141 | 81.6 | 69.7 | 46.9 | 0.908 | 75.4 | high |
| 13 | Marc Cucurella | Spain | DEF | md1 | Cabo Verde | 80.62 | top_pick_candidate | 6.208 | 5.773 | 13.064 | 1.132 | 70.5 | 64.2 | 45.6 | 0.9 | 74.8 | high |
| 14 | Nuno Alexandre Tavares Mendes | Portugal | DEF | md1 | Congo DR | 80.504 | top_pick_candidate | 8.192 | 7.618 | 17.062 | 1.313 | 100 | 78.3 | 53.9 | 0.892 | 74.2 | high |
| 17 | Nuno Alexandre Tavares Mendes | Portugal | DEF | md2 | Uzbekistan | 80.407 | top_pick_candidate | 8.135 | 7.565 | 16.988 | 1.304 | 100 | 78.3 | 53.9 | 0.892 | 74.2 | high |
| 16 | Aymeric Laporte | Spain | DEF | md1 | Cabo Verde | 80.402 | top_pick_candidate | 5.734 | 5.332 | 12.12 | 0.969 | 55.9 | 57.2 | 43.1 | 0.894 | 74.4 | high |
| 17 | Daniel Muñoz | Colombia | DEF | md1 | Uzbekistan | 80.4 | top_pick_candidate | 6.538 | 6.081 | 13.601 | 1.322 | 60.4 | 62.1 | 43.3 | 0.94 | 77.7 | high |
| 18 | Willian Pacho | Ecuador | DEF | md1 | Côte d'Ivoire | 80.28 | top_pick_candidate | 5.181 | 4.819 | 10.444 | 1.095 | 30.4 | 48 | 35.9 | 0.94 | 77.7 | high |
| 20 | Jhon Lucumí | Colombia | DEF | md1 | Uzbekistan | 80.177 | top_pick_candidate | 5.687 | 5.289 | 11.797 | 1.23 | 38 | 51.8 | 39.1 | 0.94 | 77.7 | high |
| 23 | Piero Hincapié | Ecuador | DEF | md2 | Curaçao | 79.775 | strong_candidate | 5.556 | 5.167 | 11.449 | 1.099 | 31.7 | 48.3 | 37.6 | 0.93 | 77 | high |
| 16 | Ezri Konsa | England | DEF | md3 | Panama | 79.515 | strong_candidate | 5.383 | 5.006 | 11.199 | 1.043 | 49 | 56 | 40 | 0.908 | 75.4 | high |
| 24 | Ezri Konsa | England | DEF | md2 | Ghana | 79.487 | strong_candidate | 5.383 | 5.006 | 11.272 | 1.043 | 49 | 56 | 40 | 0.908 | 75.4 | high |
| 25 | Mathías Olivera | Uruguay | DEF | md2 | Cabo Verde | 79.344 | strong_candidate | 6.277 | 5.837 | 13.241 | 1.357 | 39.8 | 52 | 40.7 | 0.93 | 77 | high |
| 25 | Johan Mojica | Colombia | DEF | md1 | Uzbekistan | 79.329 | strong_candidate | 5.699 | 5.3 | 11.7 | 1.359 | 65.4 | 67.8 | 40.1 | 0.924 | 76.5 | high |
| 17 | Moussa Niakhaté | Senegal | DEF | md3 | Iraq | 79.265 | strong_candidate | 5.099 | 4.742 | 10.423 | 1.103 | 26.3 | 43.8 | 31.2 | 0.924 | 76.5 | high |
| 1 | Josip Stanisic | Croatia | DEF | md3 | Ghana | 79.177 | strong_candidate | 6.326 | 5.883 | 13.07 | 1.368 | 35.8 | 48.7 | 40.7 | 0.892 | 74.2 | high |

### MID

| Rank | Name | Country | Pos | Scope | Opponent | Score | Tier | Raw | Risk | Captain | Value | Alpha | Portfolio | Downside | Start | Min | Conf |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 3 | Bruno Miguel Borges Fernandes | Portugal | MID | md2 | Uzbekistan | 90.984 | top_pick_candidate | 8.101 | 7.534 | 17.404 | 0.886 | 98.5 | 74.2 | 52.3 | 0.92 | 68.9 | high |
| 3 | Bruno Miguel Borges Fernandes | Portugal | MID | md1 | Congo DR | 89.876 | top_pick_candidate | 7.962 | 7.404 | 17.059 | 0.871 | 98.5 | 74.2 | 52.3 | 0.92 | 68.9 | high |
| 4 | Enzo Fernández | Argentina | MID | md3 | Jordan | 88.93 | top_pick_candidate | 7.458 | 6.936 | 16.297 | 0.925 | 100 | 80.7 | 52.3 | 0.95 | 70.8 | high |
| 5 | Luis Díaz | Colombia | MID | md2 | Congo DR | 88.075 | top_pick_candidate | 8.493 | 7.899 | 18.261 | 0.975 | 100 | 66.8 | 64.5 | 0.95 | 70.8 | high |
| 5 | Enzo Fernández | Argentina | MID | md1 | Algeria | 88.025 | top_pick_candidate | 7.481 | 6.957 | 16.289 | 0.928 | 100 | 80.7 | 52.3 | 0.95 | 70.8 | high |
| 6 | Enzo Fernández | Argentina | MID | md2 | Austria | 87.45 | top_pick_candidate | 7.458 | 6.936 | 16.198 | 0.925 | 100 | 80.7 | 52.3 | 0.95 | 70.8 | high |
| 4 | Enzo Fernández | Argentina | MID | group_stage_full | Group stage average | 87.14 | top_pick_candidate | 22.397 | 20.829 | 16.297 | 2.777 | 100 | 80.7 | 52.3 | 0.95 | 70.8 | high |
| 7 | Michael Olise | France | MID | md2 | Iraq | 86.965 | top_pick_candidate | 8.542 | 7.944 | 18.517 | 0.836 | 100 | 64.9 | 68.4 | 0.92 | 68.9 | high |
| 6 | Bruno Miguel Borges Fernandes | Portugal | MID | group_stage_full | Group stage average | 86.47 | top_pick_candidate | 22.001 | 20.46 | 17.404 | 2.407 | 98.5 | 74.2 | 52.3 | 0.92 | 68.9 | high |
| 8 | Luis Díaz | Colombia | MID | md1 | Uzbekistan | 86.318 | top_pick_candidate | 8.471 | 7.878 | 18.282 | 0.973 | 100 | 66.8 | 64.5 | 0.95 | 70.8 | high |
| 6 | Michael Olise | France | MID | md3 | Norway | 85.73 | top_pick_candidate | 8.1 | 7.533 | 17.325 | 0.793 | 100 | 64.9 | 68.4 | 0.92 | 68.9 | high |
| 7 | Michael Olise | France | MID | group_stage_full | Group stage average | 84.299 | top_pick_candidate | 24.503 | 22.788 | 18.517 | 2.399 | 100 | 64.9 | 68.4 | 0.92 | 68.9 | high |
| 1 | Enzo Fernández | Argentina | MID | md3 | Jordan | 83.792 | top_pick_candidate | 7.458 | 6.936 | 16.297 | 0.925 | 100 | 80.7 | 52.3 | 0.95 | 70.8 | high |
| 1 | Enzo Fernández | Argentina | MID | md1 | Algeria | 83.175 | top_pick_candidate | 7.481 | 6.957 | 16.289 | 0.928 | 100 | 80.7 | 52.3 | 0.95 | 70.8 | high |
| 2 | Enzo Fernández | Argentina | MID | md2 | Austria | 83.032 | top_pick_candidate | 7.458 | 6.936 | 16.198 | 0.925 | 100 | 80.7 | 52.3 | 0.95 | 70.8 | high |
| 1 | Enzo Fernández | Argentina | MID | group_stage_full | Group stage average | 82.501 | top_pick_candidate | 22.397 | 20.829 | 16.297 | 2.777 | 100 | 80.7 | 52.3 | 0.95 | 70.8 | high |
| 2 | Enzo Fernández | Argentina | MID | md3 | Jordan | 82.348 | top_pick_candidate | 7.458 | 6.936 | 16.297 | 0.925 | 100 | 80.7 | 52.3 | 0.95 | 70.8 | high |
| 10 | Luis Díaz | Colombia | MID | group_stage_full | Group stage average | 81.982 | top_pick_candidate | 22.989 | 21.38 | 18.282 | 2.64 | 100 | 66.8 | 64.5 | 0.95 | 70.8 | high |
| 10 | Kevin De Bruyne | Belgium | MID | md3 | New Zealand | 81.552 | top_pick_candidate | 7.121 | 6.623 | 15.207 | 0.883 | 80 | 69.2 | 49.3 | 0.913 | 68.4 | high |
| 8 | Bruno Miguel Borges Fernandes | Portugal | MID | md2 | Uzbekistan | 81.415 | top_pick_candidate | 8.101 | 7.534 | 17.404 | 0.886 | 98.5 | 74.2 | 52.3 | 0.92 | 68.9 | high |
| 8 | Florian Wirtz | Germany | MID | md1 | Curaçao | 81.311 | top_pick_candidate | 6.615 | 6.152 | 14.284 | 0.82 | 62.2 | 61.6 | 45.5 | 0.923 | 69.1 | high |
| 9 | Bruno Miguel Borges Fernandes | Portugal | MID | md1 | Congo DR | 81.067 | top_pick_candidate | 7.962 | 7.404 | 17.059 | 0.871 | 98.5 | 74.2 | 52.3 | 0.92 | 68.9 | high |
| 2 | Bruno Miguel Borges Fernandes | Portugal | MID | md2 | Uzbekistan | 80.903 | top_pick_candidate | 8.101 | 7.534 | 17.404 | 0.886 | 98.5 | 74.2 | 52.3 | 0.92 | 68.9 | high |
| 7 | Alexis Mac Allister | Argentina | MID | md3 | Jordan | 80.793 | top_pick_candidate | 4.671 | 4.344 | 10.236 | 0.658 | 28.7 | 46.5 | 36.8 | 0.95 | 70.8 | high |
| 1 | Enzo Fernández | Argentina | MID | group_stage_full | Group stage average | 80.736 | top_pick_candidate | 22.397 | 20.829 | 16.297 | 2.777 | 100 | 80.7 | 52.3 | 0.95 | 70.8 | high |

### FWD

| Rank | Name | Country | Pos | Scope | Opponent | Score | Tier | Raw | Risk | Captain | Value | Alpha | Portfolio | Downside | Start | Min | Conf |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Lionel Messi | Argentina | FWD | md3 | Jordan | 98.623 | top_pick_candidate | 8.119 | 7.55 | 17.926 | 0.755 | 100 | 77.1 | 55.8 | 0.95 | 65.3 | high |
| 1 | Lionel Messi | Argentina | FWD | md1 | Algeria | 97.549 | top_pick_candidate | 8.119 | 7.55 | 17.875 | 0.755 | 100 | 77.1 | 55.8 | 0.95 | 65.3 | high |
| 1 | Lionel Messi | Argentina | FWD | md2 | Austria | 97.065 | top_pick_candidate | 8.119 | 7.55 | 17.827 | 0.755 | 100 | 77.1 | 55.8 | 0.95 | 65.3 | high |
| 1 | Lionel Messi | Argentina | FWD | group_stage_full | Group stage average | 96.776 | top_pick_candidate | 24.357 | 22.65 | 17.926 | 2.265 | 100 | 77.1 | 55.8 | 0.95 | 65.3 | high |
| 2 | Harry Kane | England | FWD | md3 | Panama | 93.616 | top_pick_candidate | 7.552 | 7.023 | 16.782 | 0.669 | 100 | 75.6 | 51.1 | 0.944 | 65 | high |
| 2 | Harry Kane | England | FWD | md2 | Ghana | 93.135 | top_pick_candidate | 7.552 | 7.023 | 16.855 | 0.669 | 100 | 75.6 | 51.1 | 0.944 | 65 | high |
| 2 | Harry Kane | England | FWD | md1 | Croatia | 92.036 | top_pick_candidate | 7.265 | 6.757 | 16.033 | 0.644 | 100 | 75.6 | 51.1 | 0.944 | 65 | high |
| 2 | Harry Kane | England | FWD | group_stage_full | Group stage average | 91.853 | top_pick_candidate | 22.369 | 20.803 | 16.855 | 1.981 | 100 | 75.6 | 51.1 | 0.944 | 65 | high |
| 3 | Kylian Mbappé | France | FWD | md3 | Norway | 91.405 | top_pick_candidate | 7.154 | 6.653 | 15.832 | 0.634 | 100 | 72.6 | 52.8 | 0.912 | 63.2 | high |
| 4 | Kylian Mbappé | France | FWD | md2 | Iraq | 90.838 | top_pick_candidate | 7.281 | 6.772 | 16.348 | 0.645 | 100 | 72.6 | 52.8 | 0.912 | 63.2 | high |
| 3 | Kylian Mbappé | France | FWD | group_stage_full | Group stage average | 89.303 | top_pick_candidate | 21.476 | 19.973 | 16.348 | 1.902 | 100 | 72.6 | 52.8 | 0.912 | 63.2 | high |
| 5 | Lautaro Martínez | Argentina | FWD | md3 | Jordan | 88.355 | top_pick_candidate | 6.428 | 5.978 | 14.746 | 0.679 | 97.7 | 74.6 | 46.9 | 0.944 | 65 | high |
| 4 | Kylian Mbappé | France | FWD | md1 | Senegal | 88.059 | top_pick_candidate | 7.041 | 6.548 | 15.632 | 0.624 | 100 | 72.6 | 52.8 | 0.912 | 63.2 | high |
| 6 | Lautaro Martínez | Argentina | FWD | md1 | Algeria | 87.402 | top_pick_candidate | 6.428 | 5.978 | 14.695 | 0.679 | 97.7 | 74.6 | 46.9 | 0.944 | 65 | high |
| 7 | Mikel Oyarzabal | Spain | FWD | md1 | Cabo Verde | 87.033 | top_pick_candidate | 6.326 | 5.883 | 14.358 | 0.726 | 100 | 74.7 | 45.9 | 0.928 | 64.1 | high |
| 8 | Lautaro Martínez | Argentina | FWD | md2 | Austria | 86.962 | top_pick_candidate | 6.428 | 5.978 | 14.647 | 0.679 | 97.7 | 74.6 | 46.9 | 0.944 | 65 | high |
| 5 | Lautaro Martínez | Argentina | FWD | group_stage_full | Group stage average | 86.574 | top_pick_candidate | 19.284 | 17.934 | 14.746 | 2.038 | 97.7 | 74.6 | 46.9 | 0.944 | 65 | high |
| 9 | Erling Haaland | Norway | FWD | md1 | Iraq | 85.988 | top_pick_candidate | 6.655 | 6.19 | 15.117 | 0.59 | 66.3 | 57.8 | 42.1 | 0.944 | 65 | high |
| 9 | Cristiano Ronaldo dos Santos Aveiro | Portugal | FWD | md2 | Uzbekistan | 85.972 | top_pick_candidate | 6.686 | 6.218 | 15.163 | 0.622 | 95.6 | 70.5 | 47.9 | 0.92 | 63.7 | high |
| 10 | Cristiano Ronaldo dos Santos Aveiro | Portugal | FWD | md1 | Congo DR | 85.946 | top_pick_candidate | 6.676 | 6.209 | 15.111 | 0.621 | 95.6 | 70.5 | 47.9 | 0.92 | 63.7 | high |
| 11 | Ferran Torres | Spain | FWD | md1 | Cabo Verde | 84.915 | top_pick_candidate | 6.594 | 6.132 | 15.065 | 0.786 | 51.4 | 47.7 | 58.9 | 0.74 | 62 | high |
| 10 | Mikel Oyarzabal | Spain | FWD | md2 | Saudi Arabia | 84.687 | top_pick_candidate | 6.326 | 5.883 | 14.35 | 0.726 | 100 | 74.7 | 45.9 | 0.928 | 64.1 | high |
| 7 | Ayase Ueda | Japan | FWD | md3 | Sweden | 84.438 | top_pick_candidate | 6.43 | 5.98 | 14.429 | 0.854 | 88.1 | 77.7 | 42.6 | 0.947 | 65.1 | high |
| 11 | Ayase Ueda | Japan | FWD | md2 | Tunisia | 84.326 | top_pick_candidate | 6.446 | 5.995 | 14.582 | 0.856 | 88.1 | 77.7 | 42.6 | 0.947 | 65.1 | high |
| 8 | Cristiano Ronaldo dos Santos Aveiro | Portugal | FWD | group_stage_full | Group stage average | 84.169 | top_pick_candidate | 19.29 | 17.94 | 15.163 | 1.794 | 95.6 | 70.5 | 47.9 | 0.92 | 63.7 | high |

## Top Captain Candidates

| Rank | Name | Country | Pos | Scope | Opponent | Score | Tier | Raw | Risk | Captain | Value | Alpha | Portfolio | Downside | Start | Min | Conf |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Lionel Messi | Argentina | FWD | md3 | Jordan | 98.623 | top_pick_candidate | 8.119 | 7.55 | 17.926 | 0.755 | 100 | 77.1 | 55.8 | 0.95 | 65.3 | high |
| 1 | Lionel Messi | Argentina | FWD | md1 | Algeria | 97.549 | top_pick_candidate | 8.119 | 7.55 | 17.875 | 0.755 | 100 | 77.1 | 55.8 | 0.95 | 65.3 | high |
| 1 | Lionel Messi | Argentina | FWD | md2 | Austria | 97.065 | top_pick_candidate | 8.119 | 7.55 | 17.827 | 0.755 | 100 | 77.1 | 55.8 | 0.95 | 65.3 | high |
| 1 | Lionel Messi | Argentina | FWD | group_stage_full | Group stage average | 96.776 | top_pick_candidate | 24.357 | 22.65 | 17.926 | 2.265 | 100 | 77.1 | 55.8 | 0.95 | 65.3 | high |
| 2 | Harry Kane | England | FWD | md3 | Panama | 93.616 | top_pick_candidate | 7.552 | 7.023 | 16.782 | 0.669 | 100 | 75.6 | 51.1 | 0.944 | 65 | high |
| 2 | Harry Kane | England | FWD | md2 | Ghana | 93.135 | top_pick_candidate | 7.552 | 7.023 | 16.855 | 0.669 | 100 | 75.6 | 51.1 | 0.944 | 65 | high |
| 2 | Harry Kane | England | FWD | md1 | Croatia | 92.036 | top_pick_candidate | 7.265 | 6.757 | 16.033 | 0.644 | 100 | 75.6 | 51.1 | 0.944 | 65 | high |
| 2 | Harry Kane | England | FWD | group_stage_full | Group stage average | 91.853 | top_pick_candidate | 22.369 | 20.803 | 16.855 | 1.981 | 100 | 75.6 | 51.1 | 0.944 | 65 | high |
| 3 | Kylian Mbappé | France | FWD | md3 | Norway | 91.405 | top_pick_candidate | 7.154 | 6.653 | 15.832 | 0.634 | 100 | 72.6 | 52.8 | 0.912 | 63.2 | high |
| 3 | Bruno Miguel Borges Fernandes | Portugal | MID | md2 | Uzbekistan | 90.984 | top_pick_candidate | 8.101 | 7.534 | 17.404 | 0.886 | 98.5 | 74.2 | 52.3 | 0.92 | 68.9 | high |
| 4 | Kylian Mbappé | France | FWD | md2 | Iraq | 90.838 | top_pick_candidate | 7.281 | 6.772 | 16.348 | 0.645 | 100 | 72.6 | 52.8 | 0.912 | 63.2 | high |
| 3 | Bruno Miguel Borges Fernandes | Portugal | MID | md1 | Congo DR | 89.876 | top_pick_candidate | 7.962 | 7.404 | 17.059 | 0.871 | 98.5 | 74.2 | 52.3 | 0.92 | 68.9 | high |
| 3 | Kylian Mbappé | France | FWD | group_stage_full | Group stage average | 89.303 | top_pick_candidate | 21.476 | 19.973 | 16.348 | 1.902 | 100 | 72.6 | 52.8 | 0.912 | 63.2 | high |
| 4 | Enzo Fernández | Argentina | MID | md3 | Jordan | 88.93 | top_pick_candidate | 7.458 | 6.936 | 16.297 | 0.925 | 100 | 80.7 | 52.3 | 0.95 | 70.8 | high |
| 5 | Lautaro Martínez | Argentina | FWD | md3 | Jordan | 88.355 | top_pick_candidate | 6.428 | 5.978 | 14.746 | 0.679 | 97.7 | 74.6 | 46.9 | 0.944 | 65 | high |
| 5 | Luis Díaz | Colombia | MID | md2 | Congo DR | 88.075 | top_pick_candidate | 8.493 | 7.899 | 18.261 | 0.975 | 100 | 66.8 | 64.5 | 0.95 | 70.8 | high |
| 4 | Kylian Mbappé | France | FWD | md1 | Senegal | 88.059 | top_pick_candidate | 7.041 | 6.548 | 15.632 | 0.624 | 100 | 72.6 | 52.8 | 0.912 | 63.2 | high |
| 5 | Enzo Fernández | Argentina | MID | md1 | Algeria | 88.025 | top_pick_candidate | 7.481 | 6.957 | 16.289 | 0.928 | 100 | 80.7 | 52.3 | 0.95 | 70.8 | high |
| 6 | Enzo Fernández | Argentina | MID | md2 | Austria | 87.45 | top_pick_candidate | 7.458 | 6.936 | 16.198 | 0.925 | 100 | 80.7 | 52.3 | 0.95 | 70.8 | high |
| 6 | Lautaro Martínez | Argentina | FWD | md1 | Algeria | 87.402 | top_pick_candidate | 6.428 | 5.978 | 14.695 | 0.679 | 97.7 | 74.6 | 46.9 | 0.944 | 65 | high |
| 4 | Enzo Fernández | Argentina | MID | group_stage_full | Group stage average | 87.14 | top_pick_candidate | 22.397 | 20.829 | 16.297 | 2.777 | 100 | 80.7 | 52.3 | 0.95 | 70.8 | high |
| 7 | Mikel Oyarzabal | Spain | FWD | md1 | Cabo Verde | 87.033 | top_pick_candidate | 6.326 | 5.883 | 14.358 | 0.726 | 100 | 74.7 | 45.9 | 0.928 | 64.1 | high |
| 7 | Michael Olise | France | MID | md2 | Iraq | 86.965 | top_pick_candidate | 8.542 | 7.944 | 18.517 | 0.836 | 100 | 64.9 | 68.4 | 0.92 | 68.9 | high |
| 8 | Lautaro Martínez | Argentina | FWD | md2 | Austria | 86.962 | top_pick_candidate | 6.428 | 5.978 | 14.647 | 0.679 | 97.7 | 74.6 | 46.9 | 0.944 | 65 | high |
| 5 | Lautaro Martínez | Argentina | FWD | group_stage_full | Group stage average | 86.574 | top_pick_candidate | 19.284 | 17.934 | 14.746 | 2.038 | 97.7 | 74.6 | 46.9 | 0.944 | 65 | high |

## Top Value-Looking Candidates

| Rank | Name | Country | Pos | Scope | Opponent | Score | Tier | Raw | Risk | Captain | Value | Alpha | Portfolio | Downside | Start | Min | Conf |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 7 | Nico O'Reilly | England | DEF | group_stage_full | Group stage average | 75.333 | strong_candidate | 19.269 | 17.919 | 14.558 | 3.813 | 93.3 | 75.2 | 49.3 | 0.876 | 73.1 | high |
| 10 | Nico O'Reilly | England | DEF | group_stage_full | Group stage average | 57.75 | watchlist_candidate | 19.269 | 17.919 | 14.558 | 3.813 | 93.3 | 75.2 | 49.3 | 0.876 | 73.1 | high |
| 2 | Nico O'Reilly | England | DEF | group_stage_full | Group stage average | 75.309 | strong_candidate | 19.269 | 17.919 | 14.558 | 3.813 | 93.3 | 75.2 | 49.3 | 0.876 | 73.1 | high |
| 24 | Nico O'Reilly | England | DEF | group_stage_full | Group stage average | 63.541 | watchlist_candidate | 19.269 | 17.919 | 14.558 | 3.813 | 93.3 | 75.2 | 49.3 | 0.876 | 73.1 | high |
| 13 | Gonzalo Montiel | Argentina | DEF | group_stage_full | Group stage average | 56.891 | watchlist_candidate | 16.491 | 15.336 | 12.148 | 3.567 | 59.5 | 52.6 | 52.8 | 0.75 | 64 | high |
| 17 | Camilo Vargas | Colombia | GK | group_stage_full | Group stage average | 71.125 | strong_candidate | 16.196 | 15.063 | 12.704 | 3.503 | 81.2 | 74.6 | 42.5 | 0.94 | 82.7 | high |
| 11 | Camilo Vargas | Colombia | GK | group_stage_full | Group stage average | 79.159 | strong_candidate | 16.196 | 15.063 | 12.704 | 3.503 | 81.2 | 74.6 | 42.5 | 0.94 | 82.7 | high |
| 13 | Camilo Vargas | Colombia | GK | group_stage_full | Group stage average | 59.374 | watchlist_candidate | 16.196 | 15.063 | 12.704 | 3.503 | 81.2 | 74.6 | 42.5 | 0.94 | 82.7 | high |
| 4 | Nuno Alexandre Tavares Mendes | Portugal | DEF | group_stage_full | Group stage average | 77.822 | strong_candidate | 21.559 | 20.049 | 17.062 | 3.457 | 100 | 78.3 | 53.9 | 0.892 | 74.2 | high |
| 23 | Nuno Alexandre Tavares Mendes | Portugal | DEF | group_stage_full | Group stage average | 77.918 | strong_candidate | 21.559 | 20.049 | 17.062 | 3.457 | 100 | 78.3 | 53.9 | 0.892 | 74.2 | high |
| 14 | Nuno Alexandre Tavares Mendes | Portugal | DEF | group_stage_full | Group stage average | 56.07 | watchlist_candidate | 21.559 | 20.049 | 17.062 | 3.457 | 100 | 78.3 | 53.9 | 0.892 | 74.2 | high |
| 4 | Nuno Alexandre Tavares Mendes | Portugal | DEF | group_stage_full | Group stage average | 72.185 | strong_candidate | 21.559 | 20.049 | 17.062 | 3.457 | 100 | 78.3 | 53.9 | 0.892 | 74.2 | high |
| 23 | Nuno Alexandre Tavares Mendes | Portugal | DEF | group_stage_full | Group stage average | 71.326 | strong_candidate | 21.559 | 20.049 | 17.062 | 3.457 | 100 | 78.3 | 53.9 | 0.892 | 74.2 | high |
| 16 | Hiroki Ito | Japan | DEF | group_stage_full | Group stage average | 54.577 | watchlist_candidate | 14.479 | 13.466 | 13.8 | 3.453 | 66.2 | 66.7 | 41.6 | 0.89 | 74.1 | high |
| 1 | Hiroki Ito | Japan | DEF | group_stage_full | Group stage average | 76.059 | strong_candidate | 14.479 | 13.466 | 13.8 | 3.453 | 66.2 | 66.7 | 41.6 | 0.89 | 74.1 | high |
| 8 | Johan Mojica | Colombia | DEF | group_stage_full | Group stage average | 60.872 | watchlist_candidate | 14.161 | 13.169 | 11.7 | 3.377 | 65.4 | 67.8 | 40.1 | 0.924 | 76.5 | high |
| 14 | Santiago Arias | Colombia | DEF | group_stage_full | Group stage average | 59.361 | watchlist_candidate | 14.106 | 13.118 | 11.47 | 3.364 | 64 | 65.3 | 41.7 | 0.882 | 73.5 | high |
| 8 | Emiliano Martínez | Argentina | GK | group_stage_full | Group stage average | 74.928 | strong_candidate | 17.899 | 16.646 | 12.294 | 3.329 | 100 | 82.1 | 44.2 | 0.94 | 82.7 | high |
| 2 | Emiliano Martínez | Argentina | GK | group_stage_full | Group stage average | 82.278 | top_pick_candidate | 17.899 | 16.646 | 12.294 | 3.329 | 100 | 82.1 | 44.2 | 0.94 | 82.7 | high |
| 25 | Daniel Muñoz | Colombia | DEF | group_stage_full | Group stage average | 69.359 | strong_candidate | 16.287 | 15.148 | 13.601 | 3.293 | 60.4 | 62.1 | 43.3 | 0.94 | 77.7 | high |
| 21 | Daniel Muñoz | Colombia | DEF | group_stage_full | Group stage average | 51.043 | watchlist_candidate | 16.287 | 15.148 | 13.601 | 3.293 | 60.4 | 62.1 | 43.3 | 0.94 | 77.7 | high |
| 16 | Daniel Muñoz | Colombia | DEF | group_stage_full | Group stage average | 57.491 | watchlist_candidate | 16.287 | 15.148 | 13.601 | 3.293 | 60.4 | 62.1 | 43.3 | 0.94 | 77.7 | high |
| 6 | Charles De Ketelaere | Belgium | MID | group_stage_full | Group stage average | 60.662 | watchlist_candidate | 19.332 | 17.979 | 14.207 | 3.211 | 92.9 | 66.9 | 59.6 | 0.902 | 67.7 | high |
| 20 | Cristian Romero | Argentina | DEF | group_stage_full | Group stage average | 70.73 | strong_candidate | 16.773 | 15.598 | 11.921 | 3.183 | 66.2 | 65 | 43.6 | 0.94 | 77.7 | high |
| 15 | Cristian Romero | Argentina | DEF | group_stage_full | Group stage average | 78.505 | strong_candidate | 16.773 | 15.598 | 11.921 | 3.183 | 66.2 | 65 | 43.6 | 0.94 | 77.7 | high |

## Projection Components For Top Candidates By Mode

| Mode | Rank | Name | Pos | Scope | Opponent | App | Att | Ast | CS | GC | Save | Tackle | Chance | SOT | Card | Bonus | Raw | Risk | Captain |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Balanced | 1 | Lionel Messi | FWD | md3 | Jordan | 1.832 | 3.75 | 1.65 | 0 | 0 | 0 | 0 | 0 | 0.95 | -0.063 | 0 | 8.119 | 7.55 | 17.926 |
| Balanced | 2 | Enzo Fernández | MID | md3 | Jordan | 1.929 | 2.891 | 0.867 | 0.632 | 0 | 0 | 0.428 | 0.916 | 0 | -0.205 | 0 | 7.458 | 6.936 | 16.297 |
| Balanced | 1 | Nuno Alexandre Tavares Mendes | DEF | md1 | Congo DR | 1.892 | 1.75 | 1.515 | 3.143 | -0.049 | 0 | 0 | 0 | 0 | -0.059 | 0 | 8.192 | 7.618 | 17.062 |
| Balanced | 1 | Nuno Alexandre Tavares Mendes | DEF | md2 | Uzbekistan | 1.892 | 1.75 | 1.576 | 3.035 | -0.058 | 0 | 0 | 0 | 0 | -0.059 | 0 | 8.135 | 7.565 | 16.988 |
| Balanced | 2 | Bruno Miguel Borges Fernandes | MID | md2 | Uzbekistan | 1.867 | 2.813 | 1.367 | 0.59 | 0 | 0 | 0.416 | 1.15 | 0 | -0.102 | 0 | 8.101 | 7.534 | 17.404 |
| Safe | 1 | Enzo Fernández | MID | md3 | Jordan | 1.929 | 2.891 | 0.867 | 0.632 | 0 | 0 | 0.428 | 0.916 | 0 | -0.205 | 0 | 7.458 | 6.936 | 16.297 |
| Safe | 1 | Camilo Vargas | GK | md2 | Congo DR | 1.94 | 0 | 0.12 | 3.198 | -0.062 | 1.03 | 0 | 0 | 0 | -0.056 | 0 | 6.171 | 5.739 | 12.408 |
| Safe | 2 | Lionel Messi | FWD | md3 | Jordan | 1.832 | 3.75 | 1.65 | 0 | 0 | 0 | 0 | 0 | 0.95 | -0.063 | 0 | 8.119 | 7.55 | 17.926 |
| Safe | 1 | Enzo Fernández | MID | md1 | Algeria | 1.929 | 2.891 | 0.867 | 0.655 | 0 | 0 | 0.428 | 0.916 | 0 | -0.205 | 0 | 7.481 | 6.957 | 16.289 |
| Safe | 2 | Enzo Fernández | MID | md2 | Austria | 1.929 | 2.891 | 0.867 | 0.632 | 0 | 0 | 0.428 | 0.916 | 0 | -0.205 | 0 | 7.458 | 6.936 | 16.198 |
| Upside | 1 | Luis Suárez | FWD | md2 | Congo DR | 1.479 | 3.75 | 0.594 | 0 | 0 | 0 | 0 | 0 | 0.803 | -0.139 | 0 | 6.487 | 6.033 | 14.689 |
| Upside | 1 | Luis Suárez | FWD | md1 | Uzbekistan | 1.479 | 3.75 | 0.576 | 0 | 0 | 0 | 0 | 0 | 0.803 | -0.139 | 0 | 6.469 | 6.016 | 14.718 |
| Upside | 1 | Luis Suárez | FWD | group_stage_full | Group stage average | 4.437 | 9.922 | 1.481 | 0 | 0 | 0 | 0 | 0 | 2.125 | -0.417 | 0 | 17.549 | 16.32 | 14.718 |
| Upside | 2 | Donyell Malen | FWD | md2 | Sweden | 1.611 | 3.75 | 0.322 | 0 | 0 | 0 | 0 | 0 | 0.251 | -0.041 | 0 | 5.893 | 5.481 | 13.543 |
| Upside | 3 | Petar Musa | FWD | md2 | Panama | 1.603 | 3.75 | 0.615 | 0 | 0 | 0 | 0 | 0 | 0.76 | -0.107 | 0 | 6.621 | 6.158 | 14.878 |
| Differential | 1 | Hiroki Ito | DEF | md2 | Tunisia | 1.89 | 1.33 | 0.419 | 3.028 | -0.058 | 0 | 0 | 0 | 0 | 0 | 0 | 6.609 | 6.146 | 13.8 |
| Differential | 1 | Josip Stanisic | DEF | md3 | Ghana | 1.892 | 0.727 | 0.77 | 3.035 | -0.058 | 0 | 0 | 0 | 0 | -0.04 | 0 | 6.326 | 5.883 | 13.07 |
| Differential | 1 | Hiroki Ito | DEF | group_stage_full | Group stage average | 5.67 | 3.109 | 0.979 | 5.752 | -1.03 | 0 | 0 | 0 | 0 | 0 | 0 | 14.479 | 13.466 | 13.8 |
| Differential | 2 | Nico O'Reilly | DEF | group_stage_full | Group stage average | 5.628 | 4.951 | 1.048 | 8.274 | -0.26 | 0 | 0 | 0 | 0 | -0.369 | 0 | 19.269 | 17.919 | 14.558 |
| Differential | 2 | Bruno Guimarães Rodriguez Moura | MID | md2 | Haiti | 1.929 | 1.735 | 0.702 | 0.632 | 0 | 0 | 0.601 | 0.793 | 0 | -0.167 | 0 | 6.224 | 5.789 | 13.454 |
| Captain Alpha | 1 | Lionel Messi | FWD | md3 | Jordan | 1.832 | 3.75 | 1.65 | 0 | 0 | 0 | 0 | 0 | 0.95 | -0.063 | 0 | 8.119 | 7.55 | 17.926 |
| Captain Alpha | 1 | Lionel Messi | FWD | md1 | Algeria | 1.832 | 3.75 | 1.65 | 0 | 0 | 0 | 0 | 0 | 0.95 | -0.063 | 0 | 8.119 | 7.55 | 17.875 |
| Captain Alpha | 1 | Lionel Messi | FWD | md2 | Austria | 1.832 | 3.75 | 1.65 | 0 | 0 | 0 | 0 | 0 | 0.95 | -0.063 | 0 | 8.119 | 7.55 | 17.827 |
| Captain Alpha | 1 | Lionel Messi | FWD | group_stage_full | Group stage average | 5.496 | 11.25 | 4.95 | 0 | 0 | 0 | 0 | 0 | 2.85 | -0.189 | 0 | 24.357 | 22.65 | 17.926 |
| Captain Alpha | 2 | Harry Kane | FWD | md3 | Panama | 1.822 | 3.75 | 1.058 | 0 | 0 | 0 | 0 | 0 | 0.95 | -0.027 | 0 | 7.552 | 7.023 | 16.782 |

## High-Projection Defender Candidates

| Name | Country | Pos | MD | Opponent | App | Att | Ast | CS | GC | Save | Tackle | Chance | SOT | Card | Raw | Risk | Captain | Conf |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Nuno Alexandre Tavares Mendes | Portugal | DEF | md1 | Congo DR | 1.892 | 1.75 | 1.515 | 3.143 | -0.049 | 0 | 0 | 0 | 0 | -0.059 | 8.192 | 7.618 | 17.062 | high |
| Nuno Alexandre Tavares Mendes | Portugal | DEF | md2 | Uzbekistan | 1.892 | 1.75 | 1.576 | 3.035 | -0.058 | 0 | 0 | 0 | 0 | -0.059 | 8.135 | 7.565 | 16.988 | high |
| Ritsu Doan | Japan | DEF | md2 | Tunisia | 1.94 | 1.452 | 0.984 | 3.198 | -0.062 | 0 | 0 | 0 | 0 | -0.161 | 7.352 | 6.837 | 15.252 | high |
| Joshua Kimmich | Germany | DEF | md1 | Curaçao | 1.91 | 0.966 | 1.321 | 3.206 | -0.05 | 0 | 0 | 0 | 0 | -0.1 | 7.254 | 6.746 | 15.051 | high |
| Denzel Dumfries | Netherlands | DEF | md3 | Tunisia | 1.908 | 1.75 | 0.418 | 3.089 | -0.059 | 0 | 0 | 0 | 0 | -0.113 | 6.993 | 6.503 | 14.807 | high |
| Julian Ryerson | Norway | DEF | md1 | Iraq | 1.924 | 0.448 | 1.65 | 3.256 | -0.051 | 0 | 0 | 0 | 0 | -0.268 | 6.959 | 6.472 | 14.203 | high |
| Nico O'Reilly | England | DEF | md2 | Ghana | 1.876 | 1.75 | 0.384 | 2.981 | -0.057 | 0 | 0 | 0 | 0 | -0.123 | 6.81 | 6.333 | 14.558 | high |
| Nico O'Reilly | England | DEF | md3 | Panama | 1.876 | 1.75 | 0.384 | 2.981 | -0.057 | 0 | 0 | 0 | 0 | -0.123 | 6.81 | 6.333 | 14.485 | high |
| Achraf Hakimi | Morocco | DEF | md3 | Haiti | 1.908 | 1.689 | 0.378 | 3.089 | -0.059 | 0 | 0 | 0 | 0 | -0.272 | 6.733 | 6.262 | 14.2 | high |
| Hiroki Ito | Japan | DEF | md2 | Tunisia | 1.89 | 1.33 | 0.419 | 3.028 | -0.058 | 0 | 0 | 0 | 0 | 0 | 6.609 | 6.146 | 13.8 | high |
| Daniel Muñoz | Colombia | DEF | md1 | Uzbekistan | 1.94 | 0.976 | 0.627 | 3.312 | -0.051 | 0 | 0 | 0 | 0 | -0.265 | 6.538 | 6.081 | 13.601 | high |
| Daniel Muñoz | Colombia | DEF | md2 | Congo DR | 1.94 | 1.006 | 0.647 | 3.198 | -0.062 | 0 | 0 | 0 | 0 | -0.265 | 6.465 | 6.013 | 13.414 | high |
| Theo Hernández | France | DEF | md2 | Iraq | 1.884 | 1.643 | 0.141 | 3.008 | -0.058 | 0 | 0 | 0 | 0 | -0.188 | 6.43 | 5.98 | 13.799 | high |
| Josko Gvardiol | Croatia | DEF | md3 | Ghana | 1.882 | 1.501 | 0.172 | 3.001 | -0.058 | 0 | 0 | 0 | 0 | -0.113 | 6.385 | 5.938 | 13.529 | high |
| Jules Koundé | France | DEF | md2 | Iraq | 1.892 | 0.889 | 0.805 | 3.035 | -0.058 | 0 | 0 | 0 | 0 | -0.198 | 6.365 | 5.919 | 13.336 | high |
| Joshua Kimmich | Germany | DEF | md2 | Côte d'Ivoire | 1.91 | 0.966 | 1.321 | 2.394 | -0.153 | 0 | 0 | 0 | 0 | -0.1 | 6.339 | 5.895 | 13.183 | high |
| Josip Stanisic | Croatia | DEF | md3 | Ghana | 1.892 | 0.727 | 0.77 | 3.035 | -0.058 | 0 | 0 | 0 | 0 | -0.04 | 6.326 | 5.883 | 13.07 | high |
| Mathías Olivera | Uruguay | DEF | md2 | Cabo Verde | 1.93 | 1.237 | 0.175 | 3.164 | -0.061 | 0 | 0 | 0 | 0 | -0.169 | 6.277 | 5.837 | 13.241 | high |
| Mathías Olivera | Uruguay | DEF | md1 | Saudi Arabia | 1.93 | 1.1 | 0.156 | 3.277 | -0.051 | 0 | 0 | 0 | 0 | -0.169 | 6.243 | 5.806 | 13.097 | high |
| Nico Schlotterbeck | Germany | DEF | md1 | Curaçao | 1.884 | 1.362 | 0.163 | 3.115 | -0.048 | 0 | 0 | 0 | 0 | -0.234 | 6.242 | 5.805 | 13.325 | high |
| Marc Cucurella | Spain | DEF | md1 | Cabo Verde | 1.9 | 0.916 | 0.524 | 3.171 | -0.049 | 0 | 0 | 0 | 0 | -0.254 | 6.208 | 5.773 | 13.064 | high |
| Marc Cucurella | Spain | DEF | md2 | Saudi Arabia | 1.9 | 0.916 | 0.524 | 3.062 | -0.059 | 0 | 0 | 0 | 0 | -0.254 | 6.089 | 5.663 | 12.833 | high |
| Denzel Dumfries | Netherlands | DEF | md2 | Sweden | 1.908 | 1.75 | 0.4 | 2.305 | -0.169 | 0 | 0 | 0 | 0 | -0.113 | 6.081 | 5.655 | 12.997 | high |
| Virgil van Dijk | Netherlands | DEF | md3 | Tunisia | 1.934 | 0.946 | 0.18 | 3.178 | -0.061 | 0 | 0 | 0 | 0 | -0.101 | 6.075 | 5.65 | 12.719 | high |
| Reece James | England | DEF | md2 | Ghana | 1.9 | 0.509 | 0.655 | 3.062 | -0.059 | 0 | 0 | 0 | 0 | -0.158 | 5.909 | 5.495 | 12.306 | high |

## High-Projection Goalkeeper Candidates

| Name | Country | Pos | MD | Opponent | App | Att | Ast | CS | GC | Save | Tackle | Chance | SOT | Card | Raw | Risk | Captain | Conf |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Camilo Vargas | Colombia | GK | md1 | Uzbekistan | 1.94 | 0 | 0.12 | 3.312 | -0.051 | 1.03 | 0 | 0 | 0 | -0.056 | 6.295 | 5.855 | 12.704 | high |
| Camilo Vargas | Colombia | GK | md2 | Congo DR | 1.94 | 0 | 0.12 | 3.198 | -0.062 | 1.03 | 0 | 0 | 0 | -0.056 | 6.171 | 5.739 | 12.408 | high |
| Yahia Fofana | Côte d'Ivoire | GK | md3 | Curaçao | 1.932 | 0 | 0.12 | 3.143 | -0.064 | 1.001 | 0 | 0 | 0 | -0.067 | 6.065 | 5.64 | 12.172 | high |
| Emiliano Martínez | Argentina | GK | md1 | Algeria | 1.94 | 0 | 0 | 3.312 | -0.051 | 0.913 | 0 | 0 | 0 | -0.064 | 6.049 | 5.626 | 12.294 | high |
| Emiliano Martínez | Argentina | GK | md2 | Austria | 1.94 | 0 | 0 | 3.198 | -0.062 | 0.913 | 0 | 0 | 0 | -0.064 | 5.925 | 5.51 | 12.013 | high |
| Emiliano Martínez | Argentina | GK | md3 | Jordan | 1.94 | 0 | 0 | 3.198 | -0.062 | 0.913 | 0 | 0 | 0 | -0.064 | 5.925 | 5.51 | 12.112 | high |
| Unai Simón | Spain | GK | md1 | Cabo Verde | 1.908 | 0 | 0.005 | 3.199 | -0.05 | 0.8 | 0 | 0 | 0 | -0.024 | 5.838 | 5.429 | 11.957 | high |
| Alisson Ramsés Becker | Brazil | GK | md1 | Morocco | 1.932 | 0 | 0 | 3.284 | -0.051 | 0.68 | 0 | 0 | 0 | -0.036 | 5.809 | 5.402 | 11.587 | high |
| Hernán Galíndez | Ecuador | GK | md2 | Curaçao | 1.94 | 0 | 0 | 3.198 | -0.062 | 0.733 | 0 | 0 | 0 | -0.033 | 5.777 | 5.373 | 11.77 | high |
| Gregor Kobel | Switzerland | GK | md1 | Qatar | 1.908 | 0 | 0 | 3.199 | -0.05 | 0.775 | 0 | 0 | 0 | -0.078 | 5.754 | 5.351 | 11.785 | high |
| Hernán Galíndez | Ecuador | GK | md1 | Côte d'Ivoire | 1.94 | 0 | 0 | 3.16 | -0.065 | 0.733 | 0 | 0 | 0 | -0.033 | 5.735 | 5.333 | 11.424 | high |
| Unai Simón | Spain | GK | md2 | Saudi Arabia | 1.908 | 0 | 0.005 | 3.089 | -0.059 | 0.8 | 0 | 0 | 0 | -0.024 | 5.719 | 5.318 | 11.724 | high |
| Alisson Ramsés Becker | Brazil | GK | md2 | Haiti | 1.932 | 0 | 0 | 3.171 | -0.061 | 0.68 | 0 | 0 | 0 | -0.036 | 5.686 | 5.288 | 11.66 | high |
| Bart Verbruggen | Netherlands | GK | md3 | Tunisia | 1.908 | 0 | 0 | 3.089 | -0.059 | 0.826 | 0 | 0 | 0 | -0.078 | 5.686 | 5.288 | 11.561 | high |
| Jordan Pickford | England | GK | md2 | Ghana | 1.916 | 0 | 0 | 3.117 | -0.06 | 0.809 | 0 | 0 | 0 | -0.106 | 5.676 | 5.279 | 11.639 | high |
| Jordan Pickford | England | GK | md3 | Panama | 1.916 | 0 | 0 | 3.117 | -0.06 | 0.809 | 0 | 0 | 0 | -0.106 | 5.676 | 5.279 | 11.566 | high |
| Alexander Schlager | Austria | GK | md1 | Jordan | 1.9 | 0 | 0 | 3.105 | -0.055 | 0.729 | 0 | 0 | 0 | -0.114 | 5.565 | 5.176 | 11.325 | high |
| Alisson Ramsés Becker | Brazil | GK | md3 | Scotland | 1.932 | 0 | 0 | 3.035 | -0.075 | 0.68 | 0 | 0 | 0 | -0.036 | 5.536 | 5.148 | 11.188 | high |
| Diogo Meireles da Costa | Portugal | GK | md1 | Congo DR | 1.908 | 0 | 0 | 3.199 | -0.05 | 0.55 | 0 | 0 | 0 | -0.082 | 5.525 | 5.138 | 11.259 | high |
| Édouard Mendy | Senegal | GK | md3 | Iraq | 1.932 | 0 | 0 | 3.171 | -0.061 | 0.537 | 0 | 0 | 0 | -0.07 | 5.509 | 5.124 | 11.167 | high |
| Thibaut Courtois | Belgium | GK | md3 | New Zealand | 1.892 | 0 | 0 | 3.035 | -0.058 | 0.636 | 0 | 0 | 0 | -0.027 | 5.478 | 5.094 | 11.149 | high |
| Dominik Livakovic | Croatia | GK | md3 | Ghana | 1.896 | 0 | 0 | 3.049 | -0.059 | 0.584 | 0 | 0 | 0 | 0 | 5.47 | 5.087 | 11.133 | high |
| Diogo Meireles da Costa | Portugal | GK | md2 | Uzbekistan | 1.908 | 0 | 0 | 3.089 | -0.059 | 0.55 | 0 | 0 | 0 | -0.082 | 5.405 | 5.027 | 11.067 | high |
| Thibaut Courtois | Belgium | GK | md2 | IR Iran | 1.892 | 0 | 0 | 2.824 | -0.08 | 0.636 | 0 | 0 | 0 | -0.027 | 5.245 | 4.877 | 10.636 | high |
| Gregor Kobel | Switzerland | GK | md2 | Bosnia and Herzegovina | 1.908 | 0 | 0 | 2.625 | -0.115 | 0.775 | 0 | 0 | 0 | -0.078 | 5.115 | 4.757 | 10.42 | high |

## Low-Confidence Candidates

No low-confidence candidates appear in top-25 candidate lists after calibration.

## Brazil Uncertainty And Neymar Exclusion

Brazil uncertainty candidate rows: 25.

| Rank | Name | Country | Pos | Scope | Opponent | Score | Tier | Raw | Risk | Captain | Value | Alpha | Portfolio | Downside | Start | Min | Conf |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 16 | Raphael Dias Belloli | Brazil | MID | group_stage_full | Group stage average | 71.139 | strong_candidate | 24.985 | 23.237 | 18.501 | 2.834 | 100 | 68.1 | 68.3 | 0.95 | 70.8 | high |
| 18 | Alisson Ramsés Becker | Brazil | GK | group_stage_full | Group stage average | 78.378 | strong_candidate | 17.031 | 15.838 | 11.66 | 3.168 | 88.9 | 76.8 | 43 | 0.932 | 82 | high |
| 18 | Raphael Dias Belloli | Brazil | MID | group_stage_full | Group stage average | 52.512 | watchlist_candidate | 24.985 | 23.237 | 18.501 | 2.834 | 100 | 68.1 | 68.3 | 0.95 | 70.8 | high |
| 24 | Bruno Guimarães Rodriguez Moura | Brazil | MID | group_stage_full | Group stage average | 50.068 | watchlist_candidate | 17.677 | 16.441 | 13.454 | 2.418 | 55.2 | 59.4 | 43.5 | 0.95 | 70.8 | high |
| 5 | Bruno Guimarães Rodriguez Moura | Brazil | MID | group_stage_full | Group stage average | 72.062 | strong_candidate | 17.677 | 16.441 | 13.454 | 2.418 | 55.2 | 59.4 | 43.5 | 0.95 | 70.8 | high |
| 17 | Alisson Ramsés Becker | Brazil | GK | group_stage_full | Group stage average | 56.782 | watchlist_candidate | 17.031 | 15.838 | 11.66 | 3.168 | 88.9 | 76.8 | 43 | 0.932 | 82 | high |
| 22 | Carlos Henrique Casimiro | Brazil | MID | group_stage_full | Group stage average | 53.398 | watchlist_candidate | 15.858 | 14.748 | 12.106 | 2.341 | 39 | 53.5 | 41.9 | 0.926 | 69.3 | high |
| 15 | Raphael Dias Belloli | Brazil | MID | group_stage_full | Group stage average | 77.447 | strong_candidate | 24.985 | 23.237 | 18.501 | 2.834 | 100 | 68.1 | 68.3 | 0.95 | 70.8 | high |
| 18 | Alisson Ramsés Becker | Brazil | GK | md1 | Morocco | 56.409 | watchlist_candidate | 5.809 | 5.402 | 11.587 | 1.08 | 88.9 | 76.8 | 43 | 0.932 | 82 | high |
| 22 | Bruno Guimarães Rodriguez Moura | Brazil | MID | md1 | Morocco | 53.329 | watchlist_candidate | 5.463 | 5.081 | 11.475 | 0.747 | 55.2 | 59.4 | 43.5 | 0.95 | 70.8 | high |
| 19 | Raphael Dias Belloli | Brazil | MID | md1 | Morocco | 74.823 | strong_candidate | 8.077 | 7.512 | 17.339 | 0.916 | 100 | 68.1 | 68.3 | 0.95 | 70.8 | high |
| 20 | Raphael Dias Belloli | Brazil | MID | md2 | Haiti | 71.989 | strong_candidate | 8.533 | 7.936 | 18.501 | 0.968 | 100 | 68.1 | 68.3 | 0.95 | 70.8 | high |
| 24 | Raphael Dias Belloli | Brazil | MID | md2 | Haiti | 55.094 | watchlist_candidate | 8.533 | 7.936 | 18.501 | 0.968 | 100 | 68.1 | 68.3 | 0.95 | 70.8 | high |
| 25 | Bruno Guimarães Rodriguez Moura | Brazil | MID | md2 | Haiti | 54.738 | watchlist_candidate | 6.224 | 5.789 | 13.454 | 0.851 | 55.2 | 59.4 | 43.5 | 0.95 | 70.8 | high |
| 2 | Bruno Guimarães Rodriguez Moura | Brazil | MID | md2 | Haiti | 75.049 | strong_candidate | 6.224 | 5.789 | 13.454 | 0.851 | 55.2 | 59.4 | 43.5 | 0.95 | 70.8 | high |
| 20 | Alisson Ramsés Becker | Brazil | GK | md2 | Haiti | 56.652 | watchlist_candidate | 5.686 | 5.288 | 11.66 | 1.058 | 88.9 | 76.8 | 43 | 0.932 | 82 | high |
| 21 | Carlos Henrique Casimiro | Brazil | MID | md2 | Haiti | 56.422 | watchlist_candidate | 5.555 | 5.166 | 12.106 | 0.82 | 39 | 53.5 | 41.9 | 0.926 | 69.3 | high |
| 17 | Raphael Dias Belloli | Brazil | MID | md2 | Haiti | 79.362 | strong_candidate | 8.533 | 7.936 | 18.501 | 0.968 | 100 | 68.1 | 68.3 | 0.95 | 70.8 | high |
| 23 | Vinícius José Paixão de Oliveira Júnior | Brazil | MID | md2 | Haiti | 74.795 | strong_candidate | 7.913 | 7.359 | 17.335 | 0.736 | 99.4 | 64.5 | 63.8 | 0.95 | 70.8 | high |
| 13 | Raphael Dias Belloli | Brazil | MID | md3 | Scotland | 71.511 | strong_candidate | 8.375 | 7.789 | 18.013 | 0.95 | 100 | 68.1 | 68.3 | 0.95 | 70.8 | high |
| 8 | Bruno Guimarães Rodriguez Moura | Brazil | MID | md3 | Scotland | 59.258 | watchlist_candidate | 5.99 | 5.571 | 12.757 | 0.819 | 55.2 | 59.4 | 43.5 | 0.95 | 70.8 | high |
| 9 | Alisson Ramsés Becker | Brazil | GK | md3 | Scotland | 58.424 | watchlist_candidate | 5.536 | 5.148 | 11.188 | 1.03 | 88.9 | 76.8 | 43 | 0.932 | 82 | high |
| 20 | Carlos Henrique Casimiro | Brazil | MID | md3 | Scotland | 54.311 | watchlist_candidate | 5.361 | 4.986 | 11.492 | 0.791 | 39 | 53.5 | 41.9 | 0.926 | 69.3 | high |
| 16 | Raphael Dias Belloli | Brazil | MID | md3 | Scotland | 78.18 | strong_candidate | 8.375 | 7.789 | 18.013 | 0.95 | 100 | 68.1 | 68.3 | 0.95 | 70.8 | high |
| 21 | Vinícius José Paixão de Oliveira Júnior | Brazil | MID | md3 | Scotland | 73.939 | strong_candidate | 7.807 | 7.261 | 16.945 | 0.726 | 99.4 | 64.5 | 63.8 | 0.95 | 70.8 | high |

Neymar projection rows remain present but excluded from recommendation candidate lists:

| Name | Country | Pos | MD | Opponent | App | Att | Ast | CS | GC | Save | Tackle | Chance | SOT | Card | Raw | Risk | Captain | Conf |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Neymar da Silva Santos Júnior | Brazil | MID | md1 | Morocco | 0.237 | 0.049 | 0.027 | 0 | 0 | 0 | 0.012 | 0.015 | 0 | -0.013 | 0.327 | 0.135 | 1.011 | low |
| Neymar da Silva Santos Júnior | Brazil | MID | md2 | Haiti | 0.237 | 0.07 | 0.039 | 0 | 0 | 0 | 0.012 | 0.016 | 0 | -0.013 | 0.361 | 0.16 | 1.378 | low |
| Neymar da Silva Santos Júnior | Brazil | MID | md3 | Scotland | 0.237 | 0.064 | 0.036 | 0 | 0 | 0 | 0.012 | 0.016 | 0 | -0.013 | 0.352 | 0.154 | 1.171 | low |

## Focus Player Audit

### Nuno Mendes

| Mode | Rank | Name | Pos | Scope | Opponent | App | Att | Ast | CS | GC | Save | Tackle | Chance | SOT | Card | Bonus | Raw | Risk | Captain |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Balanced | 1 | Nuno Alexandre Tavares Mendes | DEF | md1 | Congo DR | 1.892 | 1.75 | 1.515 | 3.143 | -0.049 | 0 | 0 | 0 | 0 | -0.059 | 0 | 8.192 | 7.618 | 17.062 |
| Balanced | 1 | Nuno Alexandre Tavares Mendes | DEF | md2 | Uzbekistan | 1.892 | 1.75 | 1.576 | 3.035 | -0.058 | 0 | 0 | 0 | 0 | -0.059 | 0 | 8.135 | 7.565 | 16.988 |
| Safe | 14 | Nuno Alexandre Tavares Mendes | DEF | md1 | Congo DR | 1.892 | 1.75 | 1.515 | 3.143 | -0.049 | 0 | 0 | 0 | 0 | -0.059 | 0 | 8.192 | 7.618 | 17.062 |
| Safe | 17 | Nuno Alexandre Tavares Mendes | DEF | md2 | Uzbekistan | 1.892 | 1.75 | 1.576 | 3.035 | -0.058 | 0 | 0 | 0 | 0 | -0.059 | 0 | 8.135 | 7.565 | 16.988 |
| Safe | 23 | Nuno Alexandre Tavares Mendes | DEF | group_stage_full | Group stage average | 5.676 | 5.046 | 3.971 | 7.575 | -0.53 | 0 | 0 | 0 | 0 | -0.177 | 0 | 21.559 | 20.049 | 17.062 |
| Balanced | 4 | Nuno Alexandre Tavares Mendes | DEF | group_stage_full | Group stage average | 5.676 | 5.046 | 3.971 | 7.575 | -0.53 | 0 | 0 | 0 | 0 | -0.177 | 0 | 21.559 | 20.049 | 17.062 |
| Captain Alpha | 18 | Nuno Alexandre Tavares Mendes | DEF | md1 | Congo DR | 1.892 | 1.75 | 1.515 | 3.143 | -0.049 | 0 | 0 | 0 | 0 | -0.059 | 0 | 8.192 | 7.618 | 17.062 |
| Captain Alpha | 22 | Nuno Alexandre Tavares Mendes | DEF | md2 | Uzbekistan | 1.892 | 1.75 | 1.576 | 3.035 | -0.058 | 0 | 0 | 0 | 0 | -0.059 | 0 | 8.135 | 7.565 | 16.988 |
| Differential | 4 | Nuno Alexandre Tavares Mendes | DEF | group_stage_full | Group stage average | 5.676 | 5.046 | 3.971 | 7.575 | -0.53 | 0 | 0 | 0 | 0 | -0.177 | 0 | 21.559 | 20.049 | 17.062 |
| Captain Alpha | 23 | Nuno Alexandre Tavares Mendes | DEF | group_stage_full | Group stage average | 5.676 | 5.046 | 3.971 | 7.575 | -0.53 | 0 | 0 | 0 | 0 | -0.177 | 0 | 21.559 | 20.049 | 17.062 |

### Camilo Vargas

| Mode | Rank | Name | Pos | Scope | Opponent | App | Att | Ast | CS | GC | Save | Tackle | Chance | SOT | Card | Bonus | Raw | Risk | Captain |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Safe | 1 | Camilo Vargas | GK | md2 | Congo DR | 1.94 | 0 | 0.12 | 3.198 | -0.062 | 1.03 | 0 | 0 | 0 | -0.056 | 0 | 6.171 | 5.739 | 12.408 |
| Safe | 6 | Camilo Vargas | GK | md1 | Uzbekistan | 1.94 | 0 | 0.12 | 3.312 | -0.051 | 1.03 | 0 | 0 | 0 | -0.056 | 0 | 6.295 | 5.855 | 12.704 |
| Safe | 11 | Camilo Vargas | GK | group_stage_full | Group stage average | 5.82 | 0 | 0.313 | 7.791 | -0.651 | 3.09 | 0 | 0 | 0 | -0.168 | 0 | 16.196 | 15.063 | 12.704 |
| Balanced | 9 | Camilo Vargas | GK | md2 | Congo DR | 1.94 | 0 | 0.12 | 3.198 | -0.062 | 1.03 | 0 | 0 | 0 | -0.056 | 0 | 6.171 | 5.739 | 12.408 |
| Balanced | 8 | Camilo Vargas | GK | md1 | Uzbekistan | 1.94 | 0 | 0.12 | 3.312 | -0.051 | 1.03 | 0 | 0 | 0 | -0.056 | 0 | 6.295 | 5.855 | 12.704 |
| Balanced | 17 | Camilo Vargas | GK | group_stage_full | Group stage average | 5.82 | 0 | 0.313 | 7.791 | -0.651 | 3.09 | 0 | 0 | 0 | -0.168 | 0 | 16.196 | 15.063 | 12.704 |
| Differential | 13 | Camilo Vargas | GK | group_stage_full | Group stage average | 5.82 | 0 | 0.313 | 7.791 | -0.651 | 3.09 | 0 | 0 | 0 | -0.168 | 0 | 16.196 | 15.063 | 12.704 |

### Nicolás Tagliafico

No Nicolás Tagliafico candidate rows.

### Luis Suárez

| Mode | Rank | Name | Pos | Scope | Opponent | App | Att | Ast | CS | GC | Save | Tackle | Chance | SOT | Card | Bonus | Raw | Risk | Captain |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Upside | 1 | Luis Suárez | FWD | md2 | Congo DR | 1.479 | 3.75 | 0.594 | 0 | 0 | 0 | 0 | 0 | 0.803 | -0.139 | 0 | 6.487 | 6.033 | 14.689 |
| Upside | 1 | Luis Suárez | FWD | md1 | Uzbekistan | 1.479 | 3.75 | 0.576 | 0 | 0 | 0 | 0 | 0 | 0.803 | -0.139 | 0 | 6.469 | 6.016 | 14.718 |
| Upside | 1 | Luis Suárez | FWD | group_stage_full | Group stage average | 4.437 | 9.922 | 1.481 | 0 | 0 | 0 | 0 | 0 | 2.125 | -0.417 | 0 | 17.549 | 16.32 | 14.718 |
| Upside | 7 | Luis Suárez | FWD | md3 | Portugal | 1.479 | 2.422 | 0.311 | 0 | 0 | 0 | 0 | 0 | 0.519 | -0.139 | 0 | 4.593 | 4.271 | 10.17 |

### Lionel Messi

| Mode | Rank | Name | Pos | Scope | Opponent | App | Att | Ast | CS | GC | Save | Tackle | Chance | SOT | Card | Bonus | Raw | Risk | Captain |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Captain Alpha | 1 | Lionel Messi | FWD | md3 | Jordan | 1.832 | 3.75 | 1.65 | 0 | 0 | 0 | 0 | 0 | 0.95 | -0.063 | 0 | 8.119 | 7.55 | 17.926 |
| Captain Alpha | 1 | Lionel Messi | FWD | md1 | Algeria | 1.832 | 3.75 | 1.65 | 0 | 0 | 0 | 0 | 0 | 0.95 | -0.063 | 0 | 8.119 | 7.55 | 17.875 |
| Captain Alpha | 1 | Lionel Messi | FWD | md2 | Austria | 1.832 | 3.75 | 1.65 | 0 | 0 | 0 | 0 | 0 | 0.95 | -0.063 | 0 | 8.119 | 7.55 | 17.827 |
| Captain Alpha | 1 | Lionel Messi | FWD | group_stage_full | Group stage average | 5.496 | 11.25 | 4.95 | 0 | 0 | 0 | 0 | 0 | 2.85 | -0.189 | 0 | 24.357 | 22.65 | 17.926 |
| Safe | 2 | Lionel Messi | FWD | md3 | Jordan | 1.832 | 3.75 | 1.65 | 0 | 0 | 0 | 0 | 0 | 0.95 | -0.063 | 0 | 8.119 | 7.55 | 17.926 |
| Safe | 4 | Lionel Messi | FWD | md1 | Algeria | 1.832 | 3.75 | 1.65 | 0 | 0 | 0 | 0 | 0 | 0.95 | -0.063 | 0 | 8.119 | 7.55 | 17.875 |
| Safe | 4 | Lionel Messi | FWD | md2 | Austria | 1.832 | 3.75 | 1.65 | 0 | 0 | 0 | 0 | 0 | 0.95 | -0.063 | 0 | 8.119 | 7.55 | 17.827 |
| Balanced | 1 | Lionel Messi | FWD | md3 | Jordan | 1.832 | 3.75 | 1.65 | 0 | 0 | 0 | 0 | 0 | 0.95 | -0.063 | 0 | 8.119 | 7.55 | 17.926 |
| Safe | 3 | Lionel Messi | FWD | group_stage_full | Group stage average | 5.496 | 11.25 | 4.95 | 0 | 0 | 0 | 0 | 0 | 2.85 | -0.189 | 0 | 24.357 | 22.65 | 17.926 |
| Balanced | 2 | Lionel Messi | FWD | group_stage_full | Group stage average | 5.496 | 11.25 | 4.95 | 0 | 0 | 0 | 0 | 0 | 2.85 | -0.189 | 0 | 24.357 | 22.65 | 17.926 |

## V3 vs V2 Differences

- V2 unique top-pool players: 195.
- V3 unique top-pool players: 104.
- Overlapping players: 53.
- Newly appearing in v3: 51.
- Disappearing from v2: 142.
- Average list-level v2/v3 overlap rate: 0.3.

### Players Appearing In Both

| Name | Country | Pos | Mode/Source | Scope | Score |
| --- | --- | --- | --- | --- | --- |
| Enzo Fernández | Argentina | MID | balanced | group_stage_full | 80.736 |
| Lionel Messi | Argentina | FWD | balanced | group_stage_full | 80.693 |
| Bruno Miguel Borges Fernandes | Portugal | MID | balanced | group_stage_full | 78.158 |
| Harry Kane | England | FWD | balanced | group_stage_full | 77.763 |
| Kylian Mbappé | France | FWD | balanced | group_stage_full | 75.432 |
| Nico O'Reilly | England | DEF | balanced | group_stage_full | 75.333 |
| Emiliano Martínez | Argentina | GK | balanced | group_stage_full | 74.928 |
| Lautaro Martínez | Argentina | FWD | balanced | group_stage_full | 74.368 |
| Mikel Oyarzabal | Spain | FWD | balanced | group_stage_full | 73.423 |
| Cristiano Ronaldo dos Santos Aveiro | Portugal | FWD | balanced | group_stage_full | 72.705 |
| Ayase Ueda | Japan | FWD | balanced | group_stage_full | 72.698 |
| Denzel Dumfries | Netherlands | DEF | balanced | group_stage_full | 71.706 |
| Michael Olise | France | MID | balanced | group_stage_full | 71.596 |
| Luis Díaz | Colombia | MID | balanced | group_stage_full | 71.516 |
| Raphael Dias Belloli | Brazil | MID | balanced | group_stage_full | 71.139 |
| Camilo Vargas | Colombia | GK | balanced | group_stage_full | 71.125 |
| Joshua Kimmich | Germany | DEF | balanced | group_stage_full | 70.832 |
| Florian Wirtz | Germany | MID | balanced | group_stage_full | 70.829 |
| Cristian Romero | Argentina | DEF | balanced | group_stage_full | 70.73 |
| Jordan Pickford | England | GK | balanced | group_stage_full | 69.689 |
| Unai Simón | Spain | GK | balanced | group_stage_full | 69.505 |
| Daniel Muñoz | Colombia | DEF | balanced | group_stage_full | 69.359 |
| Darwin Núñez | Uruguay | FWD | safe | group_stage_full | 78.506 |
| Virgil van Dijk | Netherlands | DEF | safe | group_stage_full | 78.391 |
| Alisson Ramsés Becker | Brazil | GK | safe | group_stage_full | 78.378 |
| Ezri Konsa | England | DEF | safe | group_stage_full | 78.295 |
| Erling Haaland | Norway | FWD | safe | group_stage_full | 78.213 |
| Luis Suárez | Colombia | FWD | upside | group_stage_full | 74.787 |
| Donyell Malen | Netherlands | FWD | upside | group_stage_full | 68.021 |
| Petar Musa | Croatia | FWD | upside | group_stage_full | 63.314 |

### Newly Appearing In V3

| Name | Country | Pos | Mode/Source | Scope | Score |
| --- | --- | --- | --- | --- | --- |
| Nuno Alexandre Tavares Mendes | Portugal | DEF | balanced | group_stage_full | 77.822 |
| Kevin De Bruyne | Belgium | MID | balanced | group_stage_full | 70.628 |
| Marc Cucurella | Spain | DEF | balanced | group_stage_full | 70.221 |
| Alexis Mac Allister | Argentina | MID | safe | group_stage_full | 79.483 |
| Declan Rice | England | MID | safe | group_stage_full | 79.23 |
| Tomás Soucek | Czechia | MID | safe | group_stage_full | 77.826 |
| Diego Gómez | Paraguay | MID | safe | group_stage_full | 77.785 |
| Enner Valencia | Ecuador | FWD | upside | group_stage_full | 60.976 |
| Charles De Ketelaere | Belgium | MID | upside | group_stage_full | 60.662 |
| Romelu Lukaku | Belgium | FWD | upside | group_stage_full | 59.838 |
| Ferran Torres | Spain | FWD | upside | group_stage_full | 58.691 |
| Ivan Perisic | Croatia | FWD | upside | group_stage_full | 56.989 |
| Anthony Gordon | England | MID | upside | group_stage_full | 55.054 |
| Hiroki Ito | Japan | DEF | upside | group_stage_full | 54.577 |
| Pavel Sulc | Czechia | MID | upside | group_stage_full | 49.837 |
| Johan Mojica | Colombia | DEF | differential | group_stage_full | 60.872 |
| Santiago Arias | Colombia | DEF | differential | group_stage_full | 59.361 |
| Romano Schmid | Austria | MID | differential | group_stage_full | 54.122 |
| Carlos Henrique Casimiro | Brazil | MID | differential | group_stage_full | 53.398 |
| Richard Ríos | Colombia | MID | differential | group_stage_full | 52.752 |
| Jude Bellingham | England | MID | differential | group_stage_full | 50.841 |
| Ousmane Dembélé | France | MID | captain | group_stage_full | 74.987 |
| Jamal Musiala | Germany | MID | captain | group_stage_full | 73.709 |
| Mathías Olivera | Uruguay | DEF | balanced | md1 | 70.644 |
| Aymeric Laporte | Spain | DEF | safe | md1 | 80.402 |
| Willian Pacho | Ecuador | DEF | safe | md1 | 80.28 |
| Jhon Lucumí | Colombia | DEF | safe | md1 | 80.177 |
| Lawrence Shankland | Scotland | FWD | upside | md1 | 61.666 |
| Alexander Sørloth | Norway | FWD | upside | md1 | 60.64 |
| Benjamin Nygren | Sweden | FWD | upside | md1 | 58.346 |

### Disappearing From V2

| Name | Country | Pos | Mode/Source | Scope | Score |
| --- | --- | --- | --- | --- | --- |
| Ivan Toney | England | FWD | v2 |  |  |
| Christian Fassnacht | Switzerland | MID | v2 |  |  |
| Moisés Ramírez | Ecuador | GK | v2 |  |  |
| Diogo Costa | Portugal | GK | v2 |  |  |
| Alban Lafont | Côte d'Ivoire | GK | v2 |  |  |
| Marc Guehi | England | DEF | v2 |  |  |
| Joao Felix | Portugal | FWD | v2 |  |  |
| Marvin Keller | Switzerland | GK | v2 |  |  |
| Keisuke Osako | Japan | GK | v2 |  |  |
| Nicolas Otamendi | Argentina | DEF | v2 |  |  |
| Ugurcan Cakir | Türkiye | GK | v2 |  |  |
| David Raum | Germany | DEF | v2 |  |  |
| Ronwen Williams | South Africa | GK | v2 |  |  |
| Oliver Baumann | Germany | GK | v2 |  |  |
| Deniz Undav | Germany | FWD | v2 |  |  |
| Julián Quiñones | Mexico | FWD | v2 |  |  |
| Nicolas Paz | Argentina | FWD | v2 |  |  |
| Orbelín Pineda | Mexico | MID | v2 |  |  |
| Igor Thiago | Brazil | FWD | v2 |  |  |
| Endrick | Brazil | FWD | v2 |  |  |
| Sander Tangvik | Norway | GK | v2 |  |  |
| Geronimo Rulli | Argentina | GK | v2 |  |  |
| Nicolas Tagliafico | Argentina | DEF | v2 |  |  |
| Ederson | Brazil | GK | v2 |  |  |
| Alex Sandro | Brazil | DEF | v2 |  |  |
| Wesley | Brazil | DEF | v2 |  |  |
| Weverton | Brazil | GK | v2 |  |  |
| Nahuel Molina | Argentina | DEF | v2 |  |  |
| Marquinhos | Brazil | DEF | v2 |  |  |
| Ibanez | Brazil | DEF | v2 |  |  |

Interpretation: plausible changes are mostly driven by official scoring, official positions/prices, fantasy-pool minutes, score predictor v3, and the new capped MID/FWD scoring components. Suspicious changes should be checked against the added-component totals and source/coverage flags, especially where conservative priors rather than source-backed rates drive movement.

## Remaining Model Concerns

- Final squads are still not source-backed, so all candidate rows remain fantasy_pool_only.
- Official rules still have manual-review blockers.
- Projection v3 now models the main previously missing MID/FWD scoring categories, but rare-event categories such as penalties, own goals, direct-free-kick bonus, and scouting bonus remain omitted or partial because current data cannot support them.
- Selection-rate/scouting bonus remains unmodeled.
- Set-piece and penalty roles remain unmodeled unless source-backed role/event-rate data is added later.
- Neymar remains a P0 usage source gap and is excluded from recommendation candidates.

## Decision

The calibrated staged recommendation layer is safer for preliminary review, but it is still blocked from public promotion, Team Builder promotion, browser-ready deployment, and any final recommendation claim.
