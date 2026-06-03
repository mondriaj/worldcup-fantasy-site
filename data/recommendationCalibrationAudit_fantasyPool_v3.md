# Recommendation Calibration Audit Fantasy Pool v3

Generated: 2026-06-03T16:56:58.583Z

Model stage: fantasy_pool_only. This audit does not promote recommendations, does not update active v2 recommendations, does not update browser-ready files, and does not make Team Builder, captain/substitution, or UX changes.

## Executive Summary

- Candidate rows after calibration: 500.
- QA status: pass_with_staging_stop_conditions.
- Low-confidence top-list candidates: 0.
- Thin-profile top-list candidates: 0.
- True missing-usage top-list candidates: 0.
- Brazil uncertainty candidate rows: 14.
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
- Consumed staged playerFinanceMetrics_fantasyPool_v2 finance-alpha, portfolio-fit, downside-risk, volatility, role-stability, premium-squeeze, and bridge-confidence fields.
- Reframed the staged Upside scoring around ceiling and attacking paths per official price, with explicit penalties for obvious Captain Alpha rows.
- Kept all outputs fantasy_pool_only and staged; active v2 recommendation files and browser-ready files are not written.

Projection-generation coverage was improved in this session. The staged v3 projection layer now emits separate capped components for official MID tackle points, MID chance-created points, and FWD shots-on-target points. Source-backed player rates are used where available; otherwise small conservative position priors are dampened and flagged. These additions improve MID/FWD representation without promoting the model or treating priors as final player event rates.

## Original Calibration Before And After Mode Winners

Baseline note: Baseline from the first uncalibrated fantasyPool_v3 recommendation output generated on 2026-06-02.

| Mode | Before winner | Before pos | After winner | After pos | After score |
| --- | --- | --- | --- | --- | --- |
| Balanced | Nuno Alexandre Tavares Mendes (md2) | DEF | Lionel Messi (md3) | FWD | 82.947 |
| Safe | Camilo Vargas (md1) | GK | Camilo Vargas (md1) | GK | 89.896 |
| Upside | Lionel Messi (md3) | FWD | Luis Suárez (md1) | FWD | 77.474 |
| Differential | Nicolás Tagliafico (md3) | DEF | Giorgian de Arrascaeta (md1) | MID | 88.724 |
| Captain Alpha | Nuno Alexandre Tavares Mendes (md2) | DEF | Lionel Messi (md3) | FWD | 98.178 |

## Original Calibration Before And After Position Distribution

| Position | Before rows | After rows |
| --- | --- | --- |
| GK | 79 | 45 |
| DEF | 300 | 158 |
| MID | 64 | 141 |
| FWD | 57 | 156 |

## Scoring-Coverage Pass Before And After Mode Winners

| Mode | Before coverage winner | Before pos | After coverage winner | After pos | After score |
| --- | --- | --- | --- | --- | --- |
| Balanced | Lionel Messi (md3) | FWD | Lionel Messi (md3) | FWD | 82.947 |
| Safe | Camilo Vargas (md1) | GK | Camilo Vargas (md1) | GK | 89.896 |
| Upside | Luis Suárez (md1) | FWD | Luis Suárez (md1) | FWD | 77.474 |
| Differential | Giorgian de Arrascaeta (md1) | MID | Giorgian de Arrascaeta (md1) | MID | 88.724 |
| Captain Alpha | Lionel Messi (md3) | FWD | Lionel Messi (md3) | FWD | 98.178 |

## Scoring-Coverage Pass Before And After Position Distribution

| Position | Before coverage rows | After coverage rows |
| --- | --- | --- |
| GK | 45 | 45 |
| DEF | 156 | 158 |
| MID | 143 | 141 |
| FWD | 156 | 156 |

## Position-Balance Safeguards

| Scope | Mode | Top candidate | GK | DEF | MID | FWD | Warning |
| --- | --- | --- | --- | --- | --- | --- | --- |
| group_stage_full | balanced | Lionel Messi | 2 | 10 | 6 | 7 | none |
| group_stage_full | safe | Emiliano Martínez | 6 | 10 | 5 | 4 | none |
| group_stage_full | upside | Luis Suárez | 0 | 7 | 8 | 10 | none |
| group_stage_full | differential | Charles De Ketelaere | 2 | 8 | 7 | 8 | none |
| group_stage_full | captain | Lionel Messi | 0 | 3 | 10 | 12 | none |
| md1 | balanced | Nuno Alexandre Tavares Mendes | 4 | 10 | 6 | 5 | none |
| md1 | safe | Camilo Vargas | 6 | 10 | 6 | 3 | none |
| md1 | upside | Luis Suárez | 0 | 8 | 7 | 10 | none |
| md1 | differential | Giorgian de Arrascaeta | 2 | 9 | 8 | 6 | none |
| md1 | captain | Lionel Messi | 0 | 3 | 10 | 12 | none |
| md2 | balanced | Nuno Alexandre Tavares Mendes | 3 | 10 | 7 | 5 | none |
| md2 | safe | Camilo Vargas | 6 | 10 | 5 | 4 | none |
| md2 | upside | Luis Suárez | 0 | 8 | 7 | 10 | none |
| md2 | differential | Giorgian de Arrascaeta | 3 | 9 | 6 | 7 | none |
| md2 | captain | Lionel Messi | 0 | 3 | 10 | 12 | none |
| md3 | balanced | Lionel Messi | 4 | 10 | 5 | 6 | none |
| md3 | safe | Enzo Fernández | 6 | 10 | 4 | 5 | none |
| md3 | upside | Petar Musa | 0 | 8 | 7 | 10 | none |
| md3 | differential | Ismael Saibari | 1 | 9 | 7 | 8 | none |
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

Position distribution: {"FWD":6,"DEF":11,"MID":8}

| Rank | Name | Country | Pos | Scope | Opponent | Score | Tier | Raw | Risk | Captain | Value | Alpha | Portfolio | Downside | Start | Min | Conf |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Lionel Messi | Argentina | FWD | md3 | Jordan | 82.947 | top_pick_candidate | 8.119 | 7.55 | 17.928 | 0.755 | 77.6 | 82.4 | 14.7 | 0.95 | 65.3 | high |
| 1 | Nuno Alexandre Tavares Mendes | Portugal | DEF | md2 | Uzbekistan | 82.893 | top_pick_candidate | 8.252 | 7.675 | 17.223 | 1.323 | 72.8 | 78.5 | 30.1 | 0.892 | 74.2 | high |
| 1 | Nuno Alexandre Tavares Mendes | Portugal | DEF | md1 | Congo DR | 82.595 | top_pick_candidate | 8.193 | 7.62 | 17.066 | 1.314 | 72.8 | 78.5 | 30.1 | 0.892 | 74.2 | high |
| 2 | Enzo Fernández | Argentina | MID | md3 | Jordan | 81.914 | top_pick_candidate | 7.481 | 6.957 | 16.342 | 0.928 | 71.2 | 84.7 | 22.2 | 0.95 | 70.8 | high |
| 2 | Bruno Miguel Borges Fernandes | Portugal | MID | md2 | Uzbekistan | 81.409 | top_pick_candidate | 8.122 | 7.554 | 17.457 | 0.889 | 52.2 | 75.3 | 18.8 | 0.92 | 68.9 | high |
| 2 | Lionel Messi | Argentina | FWD | md1 | Algeria | 81.097 | top_pick_candidate | 8.119 | 7.55 | 17.875 | 0.755 | 77.6 | 82.4 | 14.7 | 0.95 | 65.3 | high |
| 3 | Lionel Messi | Argentina | FWD | md2 | Austria | 80.935 | top_pick_candidate | 8.119 | 7.55 | 17.827 | 0.755 | 77.6 | 82.4 | 14.7 | 0.95 | 65.3 | high |
| 3 | Bruno Miguel Borges Fernandes | Portugal | MID | md1 | Congo DR | 80.466 | top_pick_candidate | 7.965 | 7.408 | 17.068 | 0.872 | 52.2 | 75.3 | 18.8 | 0.92 | 68.9 | high |
| 3 | Nicolás Tagliafico | Argentina | DEF | md3 | Jordan | 80.38 | top_pick_candidate | 6.78 | 6.305 | 14.335 | 1.466 | 72.2 | 91.3 | 25.6 | 0.93 | 77 | high |
| 1 | Lionel Messi | Argentina | FWD | group_stage_full | Group stage average | 80.222 | top_pick_candidate | 24.357 | 22.65 | 17.928 | 2.265 | 77.6 | 82.4 | 14.7 | 0.95 | 65.3 | high |
| 4 | Enzo Fernández | Argentina | MID | md1 | Algeria | 80.069 | top_pick_candidate | 7.481 | 6.957 | 16.289 | 0.928 | 71.2 | 84.7 | 22.2 | 0.95 | 70.8 | high |
| 4 | Enzo Fernández | Argentina | MID | md2 | Austria | 79.557 | strong_candidate | 7.396 | 6.878 | 16.052 | 0.917 | 71.2 | 84.7 | 22.2 | 0.95 | 70.8 | high |
| 5 | David Raum | Germany | DEF | md1 | Curaçao | 79.16 | strong_candidate | 7.353 | 6.838 | 15.186 | 1.396 | 57.8 | 87.3 | 15.2 | 0.9 | 74.8 | high |
| 2 | Enzo Fernández | Argentina | MID | group_stage_full | Group stage average | 79.116 | strong_candidate | 22.358 | 20.792 | 16.342 | 2.772 | 71.2 | 84.7 | 22.2 | 0.95 | 70.8 | high |
| 6 | Nicolás Tagliafico | Argentina | DEF | md1 | Algeria | 78.979 | strong_candidate | 6.78 | 6.305 | 14.282 | 1.466 | 72.2 | 91.3 | 25.6 | 0.93 | 77 | high |
| 3 | Nicolás Tagliafico | Argentina | DEF | group_stage_full | Group stage average | 78.675 | strong_candidate | 20.294 | 18.873 | 14.335 | 4.389 | 72.2 | 91.3 | 25.6 | 0.93 | 77 | high |
| 5 | Nicolás Tagliafico | Argentina | DEF | md2 | Austria | 78.593 | strong_candidate | 6.734 | 6.263 | 14.134 | 1.457 | 72.2 | 91.3 | 25.6 | 0.93 | 77 | high |
| 7 | Lamine Yamal Nasraoui Ebana | Spain | MID | md1 | Cabo Verde | 78.194 | strong_candidate | 8.684 | 8.076 | 18.795 | 0.808 | 75.4 | 82.4 | 20.9 | 0.896 | 67.3 | high |
| 4 | Harry Kane | England | FWD | md3 | Panama | 78.032 | strong_candidate | 7.552 | 7.023 | 16.804 | 0.669 | 58.3 | 81.4 | 15.7 | 0.944 | 65 | high |
| 4 | Nuno Alexandre Tavares Mendes | Portugal | DEF | group_stage_full | Group stage average | 78.002 | strong_candidate | 21.68 | 20.164 | 17.223 | 3.477 | 72.8 | 78.5 | 30.1 | 0.892 | 74.2 | high |
| 5 | Nico O'Reilly | England | DEF | md3 | Panama | 77.997 | strong_candidate | 6.925 | 6.44 | 14.724 | 1.37 | 59.3 | 89.4 | 16.4 | 0.876 | 73.1 | high |
| 8 | Silvan Widmer | Switzerland | DEF | md1 | Qatar | 77.71 | strong_candidate | 6.606 | 6.144 | 14.001 | 1.463 | 71.9 | 86.8 | 26.9 | 0.908 | 75.4 | high |
| 9 | Luis Díaz | Colombia | MID | md1 | Uzbekistan | 77.702 | strong_candidate | 8.47 | 7.877 | 18.278 | 0.972 | 69 | 83.3 | 23.4 | 0.95 | 70.8 | high |
| 10 | Daniel Muñoz | Colombia | DEF | md1 | Uzbekistan | 77.626 | strong_candidate | 6.537 | 6.079 | 13.596 | 1.322 | 49.7 | 86.1 | 20.3 | 0.94 | 77.7 | high |
| 6 | Harry Kane | England | FWD | md2 | Ghana | 77.499 | strong_candidate | 7.552 | 7.023 | 16.855 | 0.669 | 58.3 | 81.4 | 15.7 | 0.944 | 65 | high |

### Safe

Position distribution: {"GK":11,"MID":6,"FWD":2,"DEF":6}

| Rank | Name | Country | Pos | Scope | Opponent | Score | Tier | Raw | Risk | Captain | Value | Alpha | Portfolio | Downside | Start | Min | Conf |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Camilo Vargas | Colombia | GK | md1 | Uzbekistan | 89.896 | top_pick_candidate | 6.295 | 5.855 | 12.703 | 1.362 | 56.4 | 87.9 | 15.6 | 0.94 | 82.7 | high |
| 1 | Camilo Vargas | Colombia | GK | md2 | Congo DR | 89.888 | top_pick_candidate | 6.295 | 5.855 | 12.684 | 1.362 | 56.4 | 87.9 | 15.6 | 0.94 | 82.7 | high |
| 1 | Enzo Fernández | Argentina | MID | md3 | Jordan | 88.889 | top_pick_candidate | 7.481 | 6.957 | 16.342 | 0.928 | 71.2 | 84.7 | 22.2 | 0.95 | 70.8 | high |
| 2 | Emiliano Martínez | Argentina | GK | md3 | Jordan | 88.826 | top_pick_candidate | 6.049 | 5.626 | 12.347 | 1.125 | 71.6 | 87.2 | 17.7 | 0.94 | 82.7 | high |
| 2 | Unai Simón | Spain | GK | md1 | Cabo Verde | 88.732 | top_pick_candidate | 5.838 | 5.429 | 11.957 | 1.086 | 53.1 | 85.8 | 20.2 | 0.908 | 79.9 | high |
| 2 | Bruno Miguel Borges Fernandes | Portugal | MID | md2 | Uzbekistan | 88.483 | top_pick_candidate | 8.122 | 7.554 | 17.457 | 0.889 | 52.2 | 75.3 | 18.8 | 0.92 | 68.9 | high |
| 3 | Emiliano Martínez | Argentina | GK | md1 | Algeria | 88.417 | top_pick_candidate | 6.049 | 5.626 | 12.294 | 1.125 | 71.6 | 87.2 | 17.7 | 0.94 | 82.7 | high |
| 3 | Emiliano Martínez | Argentina | GK | md2 | Austria | 88.389 | top_pick_candidate | 6.049 | 5.626 | 12.246 | 1.125 | 71.6 | 87.2 | 17.7 | 0.94 | 82.7 | high |
| 3 | Thibaut Courtois | Belgium | GK | md3 | New Zealand | 88.229 | top_pick_candidate | 5.595 | 5.203 | 11.388 | 1.062 | 53.4 | 85.4 | 13.2 | 0.892 | 78.5 | high |
| 4 | Enzo Fernández | Argentina | MID | md1 | Algeria | 88.109 | top_pick_candidate | 7.481 | 6.957 | 16.289 | 0.928 | 71.2 | 84.7 | 22.2 | 0.95 | 70.8 | high |
| 5 | Bruno Miguel Borges Fernandes | Portugal | MID | md1 | Congo DR | 88.051 | top_pick_candidate | 7.965 | 7.408 | 17.068 | 0.872 | 52.2 | 75.3 | 18.8 | 0.92 | 68.9 | high |
| 4 | Lionel Messi | Argentina | FWD | md3 | Jordan | 87.995 | top_pick_candidate | 8.119 | 7.55 | 17.928 | 0.755 | 77.6 | 82.4 | 14.7 | 0.95 | 65.3 | high |
| 6 | Daniel Muñoz | Colombia | DEF | md1 | Uzbekistan | 87.987 | top_pick_candidate | 6.537 | 6.079 | 13.596 | 1.322 | 49.7 | 86.1 | 20.3 | 0.94 | 77.7 | high |
| 4 | Enzo Fernández | Argentina | MID | md2 | Austria | 87.957 | top_pick_candidate | 7.396 | 6.878 | 16.052 | 0.917 | 71.2 | 84.7 | 22.2 | 0.95 | 70.8 | high |
| 1 | Emiliano Martínez | Argentina | GK | group_stage_full | Group stage average | 87.947 | top_pick_candidate | 18.147 | 16.878 | 12.347 | 3.376 | 71.6 | 87.2 | 17.7 | 0.94 | 82.7 | high |
| 5 | Virgil van Dijk | Netherlands | DEF | md3 | Tunisia | 87.891 | top_pick_candidate | 6.17 | 5.738 | 12.888 | 1.043 | 44.1 | 83.3 | 16.6 | 0.934 | 77.2 | high |
| 5 | Daniel Muñoz | Colombia | DEF | md2 | Congo DR | 87.867 | top_pick_candidate | 6.44 | 5.989 | 13.368 | 1.302 | 49.7 | 86.1 | 20.3 | 0.94 | 77.7 | high |
| 6 | Nicolás Otamendi | Argentina | DEF | md3 | Jordan | 87.706 | top_pick_candidate | 5.657 | 5.261 | 11.935 | 1.196 | 53 | 87.7 | 13.6 | 0.94 | 77.7 | high |
| 7 | Harry Kane | England | FWD | md1 | Croatia | 87.553 | top_pick_candidate | 7.265 | 6.757 | 16.033 | 0.644 | 58.3 | 81.4 | 15.7 | 0.944 | 65 | high |
| 7 | Zeno Debast | Belgium | DEF | md3 | New Zealand | 87.465 | top_pick_candidate | 5.512 | 5.126 | 11.231 | 1.192 | 48.3 | 86.1 | 21 | 0.898 | 74.7 | high |
| 2 | Camilo Vargas | Colombia | GK | group_stage_full | Group stage average | 87.462 | top_pick_candidate | 16.551 | 15.394 | 12.703 | 3.58 | 56.4 | 87.9 | 15.6 | 0.94 | 82.7 | high |
| 6 | Alisson Ramsés Becker | Brazil | GK | md2 | Haiti | 87.437 | top_pick_candidate | 5.809 | 5.402 | 11.892 | 1.08 | 56 | 86.6 | 13.7 | 0.932 | 82 | high |
| 7 | Diogo Meireles da Costa | Portugal | GK | md2 | Uzbekistan | 87.395 | top_pick_candidate | 5.525 | 5.138 | 11.306 | 1.049 | 48.7 | 76.5 | 10.8 | 0.908 | 79.9 | high |
| 8 | Joshua Kimmich | Germany | DEF | md1 | Curaçao | 87.353 | top_pick_candidate | 7.254 | 6.746 | 15.051 | 1.227 | 52 | 85.3 | 15.9 | 0.91 | 75.5 | high |
| 3 | Enzo Fernández | Argentina | MID | group_stage_full | Group stage average | 87.346 | top_pick_candidate | 22.358 | 20.792 | 16.342 | 2.772 | 71.2 | 84.7 | 22.2 | 0.95 | 70.8 | high |

### Upside

Position distribution: {"FWD":22,"DEF":1,"MID":2}

| Rank | Name | Country | Pos | Scope | Opponent | Score | Tier | Raw | Risk | Captain | Value | Alpha | Portfolio | Downside | Start | Min | Conf |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Luis Suárez | Colombia | FWD | md1 | Uzbekistan | 77.474 | strong_candidate | 6.468 | 6.015 | 14.716 | 1.055 | 60.3 | 81 | 19.3 | 0.73 | 53.4 | high |
| 1 | Luis Suárez | Colombia | FWD | md2 | Congo DR | 76.829 | strong_candidate | 6.433 | 5.983 | 14.631 | 1.05 | 60.3 | 81 | 19.3 | 0.73 | 53.4 | high |
| 1 | Petar Musa | Croatia | FWD | md3 | Ghana | 72.005 | strong_candidate | 5.618 | 5.225 | 13.014 | 1.025 | 43.2 | 76.9 | 19.5 | 0.53 | 41.3 | high |
| 2 | Donyell Malen | Netherlands | FWD | md3 | Tunisia | 70.51 | strong_candidate | 5.73 | 5.329 | 13.333 | 0.874 | 56.9 | 79.4 | 20.5 | 0.75 | 54.5 | high |
| 1 | Luis Suárez | Colombia | FWD | group_stage_full | Group stage average | 69.163 | strong_candidate | 17.194 | 15.99 | 14.716 | 2.805 | 60.3 | 81 | 19.3 | 0.73 | 53.4 | high |
| 2 | Donyell Malen | Netherlands | FWD | md2 | Sweden | 68.916 | strong_candidate | 5.699 | 5.3 | 13.235 | 0.869 | 56.9 | 79.4 | 20.5 | 0.75 | 54.5 | high |
| 3 | Romelu Lukaku | Belgium | FWD | md3 | New Zealand | 68.258 | strong_candidate | 5.261 | 4.892 | 12.447 | 0.661 | 42 | 68.6 | 55 | 0.725 | 53.2 | high |
| 2 | Donyell Malen | Netherlands | FWD | group_stage_full | Group stage average | 66.272 | strong_candidate | 16.574 | 15.414 | 13.333 | 2.527 | 56.9 | 79.4 | 20.5 | 0.75 | 54.5 | high |
| 3 | Kevin Rodríguez | Ecuador | FWD | md2 | Curaçao | 66.188 | strong_candidate | 5.729 | 5.328 | 13.039 | 1.087 | 48.2 | 59.9 | 42.9 | 0.9 | 62.6 | high |
| 4 | Enner Valencia | Ecuador | FWD | md2 | Curaçao | 64.912 | watchlist_candidate | 5.885 | 5.473 | 13.479 | 0.928 | 47.1 | 70.6 | 39.4 | 0.94 | 64.8 | high |
| 5 | Petar Musa | Croatia | FWD | md2 | Panama | 63.778 | watchlist_candidate | 5.018 | 4.667 | 11.539 | 0.915 | 43.2 | 76.9 | 19.5 | 0.53 | 41.3 | high |
| 6 | Romelu Lukaku | Belgium | FWD | md2 | IR Iran | 63.609 | watchlist_candidate | 5.094 | 4.738 | 12.072 | 0.64 | 42 | 68.6 | 55 | 0.725 | 53.2 | high |
| 2 | Julian Ryerson | Norway | DEF | md1 | Iraq | 63.161 | watchlist_candidate | 6.959 | 6.472 | 14.203 | 1.541 | 42.6 | 83.7 | 17.7 | 0.924 | 76.5 | high |
| 3 | Romelu Lukaku | Belgium | FWD | group_stage_full | Group stage average | 63.043 | watchlist_candidate | 15.369 | 14.293 | 12.447 | 1.931 | 42 | 68.6 | 55 | 0.725 | 53.2 | high |
| 4 | Nicolas Jackson | Senegal | FWD | md3 | Iraq | 62.772 | watchlist_candidate | 6.181 | 5.748 | 14.084 | 0.858 | 32.4 | 55.3 | 47.5 | 0.755 | 54.8 | high |
| 3 | Romelu Lukaku | Belgium | FWD | md1 | Egypt | 62.541 | watchlist_candidate | 5.014 | 4.663 | 11.866 | 0.63 | 42 | 68.6 | 55 | 0.725 | 53.2 | high |
| 4 | Donyell Malen | Netherlands | FWD | md1 | Japan | 62.036 | watchlist_candidate | 5.145 | 4.785 | 11.755 | 0.784 | 56.9 | 79.4 | 20.5 | 0.75 | 54.5 | high |
| 7 | Koki Ogawa | Japan | FWD | md2 | Tunisia | 60.999 | watchlist_candidate | 4.904 | 4.561 | 11.101 | 0.931 | 38.6 | 68.2 | 39.8 | 0.73 | 53.4 | high |
| 5 | Mikel Oyarzabal | Spain | FWD | md1 | Cabo Verde | 60.856 | watchlist_candidate | 6.326 | 5.883 | 14.358 | 0.726 | 65.7 | 80.9 | 22.2 | 0.928 | 64.1 | high |
| 5 | Ivan Perisic | Croatia | FWD | md3 | Ghana | 60.781 | watchlist_candidate | 5.264 | 4.896 | 11.502 | 0.907 | 41.2 | 80.2 | 26.2 | 0.908 | 63 | high |
| 8 | João Félix Sequeira | Portugal | FWD | md2 | Uzbekistan | 60.693 | watchlist_candidate | 5.254 | 4.886 | 11.957 | 0.752 | 41.4 | 67.7 | 18.8 | 0.565 | 42.9 | high |
| 9 | Andrej Kramaric | Croatia | FWD | md2 | Panama | 60.624 | watchlist_candidate | 5.402 | 5.024 | 12.064 | 0.81 | 50 | 79.7 | 28.2 | 0.91 | 63.1 | high |
| 10 | Mikel Merino | Spain | MID | md2 | Saudi Arabia | 60.337 | watchlist_candidate | 6.135 | 5.705 | 13.475 | 0.92 | 51.2 | 80.8 | 33.5 | 0.908 | 68.1 | high |
| 11 | Ayase Ueda | Japan | FWD | md2 | Tunisia | 60.011 | watchlist_candidate | 6.435 | 5.984 | 14.583 | 0.855 | 54.5 | 82.1 | 17.6 | 0.947 | 65.1 | high |
| 6 | Rúben Diogo da Silva Neves | Portugal | MID | md1 | Congo DR | 59.995 | watchlist_candidate | 6.296 | 5.855 | 13.941 | 0.992 | 53.1 | 74.8 | 18.1 | 0.902 | 67.7 | high |

### Differential

Position distribution: {"MID":7,"DEF":9,"FWD":4,"GK":5}

| Rank | Name | Country | Pos | Scope | Opponent | Score | Tier | Raw | Risk | Captain | Value | Alpha | Portfolio | Downside | Start | Min | Conf |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Giorgian de Arrascaeta | Uruguay | MID | md1 | Saudi Arabia | 88.724 | top_pick_candidate | 7.541 | 7.013 | 16.481 | 1.079 | 66.1 | 82.7 | 25.3 | 0.923 | 69.1 | high |
| 1 | Giorgian de Arrascaeta | Uruguay | MID | md2 | Cabo Verde | 86.457 | top_pick_candidate | 7.818 | 7.271 | 17.1 | 1.119 | 66.1 | 82.7 | 25.3 | 0.923 | 69.1 | high |
| 2 | Hiroki Ito | Japan | DEF | md2 | Tunisia | 83.942 | top_pick_candidate | 6.567 | 6.107 | 13.689 | 1.566 | 69 | 85.1 | 25.3 | 0.89 | 74.1 | high |
| 2 | Julian Ryerson | Norway | DEF | md1 | Iraq | 83.44 | top_pick_candidate | 6.959 | 6.472 | 14.203 | 1.541 | 42.6 | 83.7 | 17.7 | 0.924 | 76.5 | high |
| 3 | Luis Suárez | Colombia | FWD | md2 | Congo DR | 82.532 | top_pick_candidate | 6.433 | 5.983 | 14.631 | 1.05 | 60.3 | 81 | 19.3 | 0.73 | 53.4 | high |
| 3 | Luis Suárez | Colombia | FWD | md1 | Uzbekistan | 82.356 | top_pick_candidate | 6.468 | 6.015 | 14.716 | 1.055 | 60.3 | 81 | 19.3 | 0.73 | 53.4 | high |
| 1 | Charles De Ketelaere | Belgium | MID | group_stage_full | Group stage average | 80.024 | top_pick_candidate | 18.988 | 17.659 | 13.996 | 3.153 | 69.4 | 81.4 | 37.6 | 0.902 | 67.7 | high |
| 2 | Silvan Widmer | Switzerland | DEF | group_stage_full | Group stage average | 78.446 | strong_candidate | 17.429 | 16.21 | 14.001 | 3.86 | 71.9 | 86.8 | 26.9 | 0.908 | 75.4 | high |
| 4 | Johan Mojica | Colombia | DEF | md1 | Uzbekistan | 78.061 | strong_candidate | 5.699 | 5.3 | 11.697 | 1.359 | 66.3 | 82 | 32.2 | 0.924 | 76.5 | high |
| 3 | Luis Suárez | Colombia | FWD | group_stage_full | Group stage average | 78.044 | strong_candidate | 17.194 | 15.99 | 14.716 | 2.805 | 60.3 | 81 | 19.3 | 0.73 | 53.4 | high |
| 1 | Ismael Saibari | Morocco | MID | md3 | Haiti | 77.727 | strong_candidate | 6.574 | 6.114 | 14.65 | 0.899 | 37.5 | 76.9 | 16.3 | 0.755 | 58.3 | high |
| 5 | Santiago Arias | Colombia | DEF | md1 | Uzbekistan | 76.491 | strong_candidate | 5.638 | 5.244 | 11.468 | 1.345 | 65.9 | 81.2 | 28.2 | 0.882 | 73.5 | high |
| 2 | Martin Erlic | Croatia | DEF | md3 | Ghana | 76.252 | strong_candidate | 5.671 | 5.274 | 12.049 | 1.352 | 38.3 | 76.1 | 33.8 | 0.858 | 71.8 | high |
| 4 | Raphael Dias Belloli | Brazil | MID | md2 | Haiti | 75.764 | strong_candidate | 8.555 | 7.957 | 18.544 | 0.97 | 72.2 | 83.9 | 28.9 | 0.95 | 70.8 | high |
| 3 | Yahia Fofana | Côte d'Ivoire | GK | md3 | Curaçao | 75.714 | strong_candidate | 6.19 | 5.757 | 12.427 | 1.371 | 40.8 | 82.1 | 17.8 | 0.932 | 82 | high |
| 4 | Giorgian de Arrascaeta | Uruguay | MID | group_stage_full | Group stage average | 75.591 | strong_candidate | 18.996 | 17.667 | 17.1 | 2.718 | 66.1 | 82.7 | 25.3 | 0.923 | 69.1 | high |
| 5 | Sergio Rochet | Uruguay | GK | md2 | Cabo Verde | 75.028 | strong_candidate | 5.985 | 5.566 | 12.166 | 1.358 | 69.7 | 84.2 | 22.5 | 0.94 | 82.7 | high |
| 6 | Junnosuke Suzuki | Japan | DEF | md2 | Tunisia | 74.75 | strong_candidate | 5.552 | 5.163 | 11.582 | 1.475 | 42.1 | 82.4 | 20.9 | 0.858 | 71.8 | high |
| 6 | Nicolás Tagliafico | Argentina | DEF | md1 | Algeria | 74.397 | strong_candidate | 6.78 | 6.305 | 14.282 | 1.466 | 72.2 | 91.3 | 25.6 | 0.93 | 77 | high |
| 7 | Hernán Galíndez | Ecuador | GK | md2 | Curaçao | 74.348 | strong_candidate | 5.901 | 5.488 | 12.012 | 1.307 | 49.4 | 78.2 | 20.5 | 0.94 | 82.7 | high |
| 4 | Donyell Malen | Netherlands | FWD | md3 | Tunisia | 74.316 | strong_candidate | 5.73 | 5.329 | 13.333 | 0.874 | 56.9 | 79.4 | 20.5 | 0.75 | 54.5 | high |
| 8 | Santiago Mele | Uruguay | GK | md2 | Cabo Verde | 74.275 | strong_candidate | 5.465 | 5.082 | 11.189 | 1.452 | 66.7 | 79.9 | 21.8 | 0.872 | 76.7 | high |
| 5 | Raphael Dias Belloli | Brazil | MID | md3 | Scotland | 73.767 | strong_candidate | 8.294 | 7.714 | 17.898 | 0.941 | 72.2 | 83.9 | 28.9 | 0.95 | 70.8 | high |
| 5 | Hiroki Ito | Japan | DEF | group_stage_full | Group stage average | 73.54 | strong_candidate | 14.496 | 13.482 | 13.689 | 3.457 | 69 | 85.1 | 25.3 | 0.89 | 74.1 | high |
| 7 | Santiago Mele | Uruguay | GK | md1 | Saudi Arabia | 73.406 | strong_candidate | 5.465 | 5.082 | 11.139 | 1.452 | 66.7 | 79.9 | 21.8 | 0.872 | 76.7 | high |

### Captain Alpha

Position distribution: {"FWD":18,"MID":7}

| Rank | Name | Country | Pos | Scope | Opponent | Score | Tier | Raw | Risk | Captain | Value | Alpha | Portfolio | Downside | Start | Min | Conf |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Lionel Messi | Argentina | FWD | md3 | Jordan | 98.178 | top_pick_candidate | 8.119 | 7.55 | 17.928 | 0.755 | 77.6 | 82.4 | 14.7 | 0.95 | 65.3 | high |
| 1 | Lionel Messi | Argentina | FWD | md1 | Algeria | 96.457 | top_pick_candidate | 8.119 | 7.55 | 17.875 | 0.755 | 77.6 | 82.4 | 14.7 | 0.95 | 65.3 | high |
| 1 | Lionel Messi | Argentina | FWD | md2 | Austria | 96.352 | top_pick_candidate | 8.119 | 7.55 | 17.827 | 0.755 | 77.6 | 82.4 | 14.7 | 0.95 | 65.3 | high |
| 1 | Lionel Messi | Argentina | FWD | group_stage_full | Group stage average | 95.831 | top_pick_candidate | 24.357 | 22.65 | 17.928 | 2.265 | 77.6 | 82.4 | 14.7 | 0.95 | 65.3 | high |
| 2 | Harry Kane | England | FWD | md3 | Panama | 92.042 | top_pick_candidate | 7.552 | 7.023 | 16.804 | 0.669 | 58.3 | 81.4 | 15.7 | 0.944 | 65 | high |
| 2 | Harry Kane | England | FWD | md2 | Ghana | 91.299 | top_pick_candidate | 7.552 | 7.023 | 16.855 | 0.669 | 58.3 | 81.4 | 15.7 | 0.944 | 65 | high |
| 2 | Harry Kane | England | FWD | md1 | Croatia | 89.87 | top_pick_candidate | 7.265 | 6.757 | 16.033 | 0.644 | 58.3 | 81.4 | 15.7 | 0.944 | 65 | high |
| 2 | Harry Kane | England | FWD | group_stage_full | Group stage average | 89.806 | top_pick_candidate | 22.369 | 20.803 | 16.855 | 1.981 | 58.3 | 81.4 | 15.7 | 0.944 | 65 | high |
| 3 | Bruno Miguel Borges Fernandes | Portugal | MID | md2 | Uzbekistan | 89.361 | top_pick_candidate | 8.122 | 7.554 | 17.457 | 0.889 | 52.2 | 75.3 | 18.8 | 0.92 | 68.9 | high |
| 3 | Kylian Mbappé | France | FWD | md3 | Norway | 88.518 | top_pick_candidate | 7.083 | 6.587 | 15.77 | 0.627 | 55.6 | 80.6 | 16.9 | 0.912 | 63.2 | high |
| 4 | Kylian Mbappé | France | FWD | md2 | Iraq | 88.165 | top_pick_candidate | 7.281 | 6.772 | 16.349 | 0.645 | 55.6 | 80.6 | 16.9 | 0.912 | 63.2 | high |
| 3 | Bruno Miguel Borges Fernandes | Portugal | MID | md1 | Congo DR | 87.808 | top_pick_candidate | 7.965 | 7.408 | 17.068 | 0.872 | 52.2 | 75.3 | 18.8 | 0.92 | 68.9 | high |
| 4 | Lautaro Martínez | Argentina | FWD | md3 | Jordan | 86.651 | top_pick_candidate | 6.428 | 5.978 | 14.748 | 0.679 | 50 | 77.5 | 23.2 | 0.944 | 65 | high |
| 4 | Lamine Yamal Nasraoui Ebana | Spain | MID | md1 | Cabo Verde | 86.54 | top_pick_candidate | 8.684 | 8.076 | 18.795 | 0.808 | 75.4 | 82.4 | 20.9 | 0.896 | 67.3 | high |
| 3 | Kylian Mbappé | France | FWD | group_stage_full | Group stage average | 86.306 | top_pick_candidate | 21.405 | 19.907 | 16.349 | 1.896 | 55.6 | 80.6 | 16.9 | 0.912 | 63.2 | high |
| 5 | Giorgian de Arrascaeta | Uruguay | MID | md2 | Cabo Verde | 85.679 | top_pick_candidate | 7.818 | 7.271 | 17.1 | 1.119 | 66.1 | 82.7 | 25.3 | 0.923 | 69.1 | high |
| 5 | Kylian Mbappé | France | FWD | md1 | Senegal | 85.059 | top_pick_candidate | 7.041 | 6.548 | 15.633 | 0.624 | 55.6 | 80.6 | 16.9 | 0.912 | 63.2 | high |
| 6 | Lautaro Martínez | Argentina | FWD | md1 | Algeria | 85.034 | top_pick_candidate | 6.428 | 5.978 | 14.695 | 0.679 | 50 | 77.5 | 23.2 | 0.944 | 65 | high |
| 5 | Enzo Fernández | Argentina | MID | md3 | Jordan | 85.016 | top_pick_candidate | 7.481 | 6.957 | 16.342 | 0.928 | 71.2 | 84.7 | 22.2 | 0.95 | 70.8 | high |
| 6 | Cristiano Ronaldo dos Santos Aveiro | Portugal | FWD | md2 | Uzbekistan | 84.909 | top_pick_candidate | 6.686 | 6.218 | 15.177 | 0.622 | 48.9 | 72.4 | 16.8 | 0.92 | 63.7 | high |
| 7 | Lautaro Martínez | Argentina | FWD | md2 | Austria | 84.742 | top_pick_candidate | 6.406 | 5.958 | 14.606 | 0.677 | 50 | 77.5 | 23.2 | 0.944 | 65 | high |
| 8 | Lamine Yamal Nasraoui Ebana | Spain | MID | md2 | Saudi Arabia | 84.54 | top_pick_candidate | 8.684 | 8.076 | 18.79 | 0.808 | 75.4 | 82.4 | 20.9 | 0.896 | 67.3 | high |
| 7 | Cristiano Ronaldo dos Santos Aveiro | Portugal | FWD | md1 | Congo DR | 84.539 | top_pick_candidate | 6.676 | 6.209 | 15.113 | 0.621 | 48.9 | 72.4 | 16.8 | 0.92 | 63.7 | high |
| 8 | Luis Díaz | Colombia | MID | md1 | Uzbekistan | 84.359 | top_pick_candidate | 8.47 | 7.877 | 18.278 | 0.972 | 69 | 83.3 | 23.4 | 0.95 | 70.8 | high |
| 4 | Lautaro Martínez | Argentina | FWD | group_stage_full | Group stage average | 84.335 | top_pick_candidate | 19.262 | 17.914 | 14.748 | 2.036 | 50 | 77.5 | 23.2 | 0.944 | 65 | high |

## Top 25 By Matchday

### group_stage_full

| Rank | Name | Country | Pos | Scope | Opponent | Score | Tier | Raw | Risk | Captain | Value | Alpha | Portfolio | Downside | Start | Min | Conf |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Lionel Messi | Argentina | FWD | group_stage_full | Group stage average | 95.831 | top_pick_candidate | 24.357 | 22.65 | 17.928 | 2.265 | 77.6 | 82.4 | 14.7 | 0.95 | 65.3 | high |
| 2 | Harry Kane | England | FWD | group_stage_full | Group stage average | 89.806 | top_pick_candidate | 22.369 | 20.803 | 16.855 | 1.981 | 58.3 | 81.4 | 15.7 | 0.944 | 65 | high |
| 1 | Emiliano Martínez | Argentina | GK | group_stage_full | Group stage average | 87.947 | top_pick_candidate | 18.147 | 16.878 | 12.347 | 3.376 | 71.6 | 87.2 | 17.7 | 0.94 | 82.7 | high |
| 2 | Camilo Vargas | Colombia | GK | group_stage_full | Group stage average | 87.462 | top_pick_candidate | 16.551 | 15.394 | 12.703 | 3.58 | 56.4 | 87.9 | 15.6 | 0.94 | 82.7 | high |
| 3 | Enzo Fernández | Argentina | MID | group_stage_full | Group stage average | 87.346 | top_pick_candidate | 22.358 | 20.792 | 16.342 | 2.772 | 71.2 | 84.7 | 22.2 | 0.95 | 70.8 | high |
| 4 | Nicolás Otamendi | Argentina | DEF | group_stage_full | Group stage average | 86.828 | top_pick_candidate | 16.955 | 15.768 | 11.935 | 3.584 | 53 | 87.7 | 13.6 | 0.94 | 77.7 | high |
| 5 | Bruno Miguel Borges Fernandes | Portugal | MID | group_stage_full | Group stage average | 86.722 | top_pick_candidate | 21.845 | 20.317 | 17.457 | 2.39 | 52.2 | 75.3 | 18.8 | 0.92 | 68.9 | high |
| 6 | Lionel Messi | Argentina | FWD | group_stage_full | Group stage average | 86.471 | top_pick_candidate | 24.357 | 22.65 | 17.928 | 2.265 | 77.6 | 82.4 | 14.7 | 0.95 | 65.3 | high |
| 3 | Kylian Mbappé | France | FWD | group_stage_full | Group stage average | 86.306 | top_pick_candidate | 21.405 | 19.907 | 16.349 | 1.896 | 55.6 | 80.6 | 16.9 | 0.912 | 63.2 | high |
| 7 | Harry Kane | England | FWD | group_stage_full | Group stage average | 85.764 | top_pick_candidate | 22.369 | 20.803 | 16.855 | 1.981 | 58.3 | 81.4 | 15.7 | 0.944 | 65 | high |
| 8 | Jordan Pickford | England | GK | group_stage_full | Group stage average | 85.465 | top_pick_candidate | 16.478 | 15.324 | 11.866 | 3.193 | 54.5 | 86.5 | 16.4 | 0.916 | 80.6 | high |
| 9 | Unai Simón | Spain | GK | group_stage_full | Group stage average | 85.455 | top_pick_candidate | 16.737 | 15.565 | 11.957 | 3.113 | 53.1 | 85.8 | 20.2 | 0.908 | 79.9 | high |
| 10 | Nicolás Tagliafico | Argentina | DEF | group_stage_full | Group stage average | 85.371 | top_pick_candidate | 20.294 | 18.873 | 14.335 | 4.389 | 72.2 | 91.3 | 25.6 | 0.93 | 77 | high |
| 11 | Daniel Muñoz | Colombia | DEF | group_stage_full | Group stage average | 85.224 | top_pick_candidate | 16.419 | 15.269 | 13.596 | 3.319 | 49.7 | 86.1 | 20.3 | 0.94 | 77.7 | high |
| 12 | Diogo Meireles da Costa | Portugal | GK | group_stage_full | Group stage average | 85.213 | top_pick_candidate | 14.642 | 13.617 | 11.306 | 2.779 | 48.7 | 76.5 | 10.8 | 0.908 | 79.9 | high |
| 13 | Thibaut Courtois | Belgium | GK | group_stage_full | Group stage average | 85.083 | top_pick_candidate | 16.045 | 14.922 | 11.388 | 3.045 | 53.4 | 85.4 | 13.2 | 0.892 | 78.5 | high |
| 14 | Florian Wirtz | Germany | MID | group_stage_full | Group stage average | 84.983 | top_pick_candidate | 18.19 | 16.916 | 14.284 | 2.255 | 46 | 81.9 | 23.4 | 0.923 | 69.1 | high |
| 15 | Ezri Konsa | England | DEF | group_stage_full | Group stage average | 84.933 | top_pick_candidate | 15.469 | 14.384 | 11.497 | 2.997 | 45.6 | 83.4 | 22 | 0.908 | 75.4 | high |
| 16 | Declan Rice | England | MID | group_stage_full | Group stage average | 84.93 | top_pick_candidate | 16.133 | 15.003 | 11.831 | 2.143 | 41.5 | 81.2 | 19.2 | 0.931 | 69.6 | high |
| 17 | Virgil van Dijk | Netherlands | DEF | group_stage_full | Group stage average | 84.868 | top_pick_candidate | 15.392 | 14.315 | 12.888 | 2.603 | 44.1 | 83.3 | 16.6 | 0.934 | 77.2 | high |
| 18 | Dávinson Sánchez | Colombia | DEF | group_stage_full | Group stage average | 84.746 | top_pick_candidate | 13.429 | 12.489 | 10.997 | 2.904 | 41.6 | 83.8 | 19.8 | 0.94 | 77.7 | high |
| 19 | Rúben dos Santos Gato Alves Dias | Portugal | DEF | group_stage_full | Group stage average | 84.644 | top_pick_candidate | 13.995 | 13.015 | 11.184 | 2.603 | 40.4 | 75.3 | 16.2 | 0.908 | 75.4 | high |
| 20 | Nico O'Reilly | England | DEF | group_stage_full | Group stage average | 84.628 | top_pick_candidate | 19.499 | 18.133 | 14.775 | 3.858 | 59.3 | 89.4 | 16.4 | 0.876 | 73.1 | high |
| 21 | Cristiano Ronaldo dos Santos Aveiro | Portugal | FWD | group_stage_full | Group stage average | 84.561 | top_pick_candidate | 18.912 | 17.589 | 15.177 | 1.759 | 48.9 | 72.4 | 16.8 | 0.92 | 63.7 | high |
| 22 | Nuno Alexandre Tavares Mendes | Portugal | DEF | group_stage_full | Group stage average | 84.5 | top_pick_candidate | 21.68 | 20.164 | 17.223 | 3.477 | 72.8 | 78.5 | 30.1 | 0.892 | 74.2 | high |

### md1

| Rank | Name | Country | Pos | Scope | Opponent | Score | Tier | Raw | Risk | Captain | Value | Alpha | Portfolio | Downside | Start | Min | Conf |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Lionel Messi | Argentina | FWD | md1 | Algeria | 96.457 | top_pick_candidate | 8.119 | 7.55 | 17.875 | 0.755 | 77.6 | 82.4 | 14.7 | 0.95 | 65.3 | high |
| 1 | Camilo Vargas | Colombia | GK | md1 | Uzbekistan | 89.896 | top_pick_candidate | 6.295 | 5.855 | 12.703 | 1.362 | 56.4 | 87.9 | 15.6 | 0.94 | 82.7 | high |
| 2 | Harry Kane | England | FWD | md1 | Croatia | 89.87 | top_pick_candidate | 7.265 | 6.757 | 16.033 | 0.644 | 58.3 | 81.4 | 15.7 | 0.944 | 65 | high |
| 2 | Unai Simón | Spain | GK | md1 | Cabo Verde | 88.732 | top_pick_candidate | 5.838 | 5.429 | 11.957 | 1.086 | 53.1 | 85.8 | 20.2 | 0.908 | 79.9 | high |
| 1 | Giorgian de Arrascaeta | Uruguay | MID | md1 | Saudi Arabia | 88.724 | top_pick_candidate | 7.541 | 7.013 | 16.481 | 1.079 | 66.1 | 82.7 | 25.3 | 0.923 | 69.1 | high |
| 3 | Emiliano Martínez | Argentina | GK | md1 | Algeria | 88.417 | top_pick_candidate | 6.049 | 5.626 | 12.294 | 1.125 | 71.6 | 87.2 | 17.7 | 0.94 | 82.7 | high |
| 4 | Enzo Fernández | Argentina | MID | md1 | Algeria | 88.109 | top_pick_candidate | 7.481 | 6.957 | 16.289 | 0.928 | 71.2 | 84.7 | 22.2 | 0.95 | 70.8 | high |
| 5 | Bruno Miguel Borges Fernandes | Portugal | MID | md1 | Congo DR | 88.051 | top_pick_candidate | 7.965 | 7.408 | 17.068 | 0.872 | 52.2 | 75.3 | 18.8 | 0.92 | 68.9 | high |
| 6 | Daniel Muñoz | Colombia | DEF | md1 | Uzbekistan | 87.987 | top_pick_candidate | 6.537 | 6.079 | 13.596 | 1.322 | 49.7 | 86.1 | 20.3 | 0.94 | 77.7 | high |
| 3 | Bruno Miguel Borges Fernandes | Portugal | MID | md1 | Congo DR | 87.808 | top_pick_candidate | 7.965 | 7.408 | 17.068 | 0.872 | 52.2 | 75.3 | 18.8 | 0.92 | 68.9 | high |
| 7 | Harry Kane | England | FWD | md1 | Croatia | 87.553 | top_pick_candidate | 7.265 | 6.757 | 16.033 | 0.644 | 58.3 | 81.4 | 15.7 | 0.944 | 65 | high |
| 8 | Joshua Kimmich | Germany | DEF | md1 | Curaçao | 87.353 | top_pick_candidate | 7.254 | 6.746 | 15.051 | 1.227 | 52 | 85.3 | 15.9 | 0.91 | 75.5 | high |
| 9 | Nicolás Otamendi | Argentina | DEF | md1 | Algeria | 87.309 | top_pick_candidate | 5.657 | 5.261 | 11.882 | 1.196 | 53 | 87.7 | 13.6 | 0.94 | 77.7 | high |
| 10 | Diogo Meireles da Costa | Portugal | GK | md1 | Congo DR | 87.29 | top_pick_candidate | 5.525 | 5.138 | 11.26 | 1.049 | 48.7 | 76.5 | 10.8 | 0.908 | 79.9 | high |
| 11 | Dávinson Sánchez | Colombia | DEF | md1 | Uzbekistan | 87.247 | top_pick_candidate | 5.304 | 4.932 | 10.997 | 1.147 | 41.6 | 83.8 | 19.8 | 0.94 | 77.7 | high |
| 12 | Lionel Messi | Argentina | FWD | md1 | Algeria | 87.194 | top_pick_candidate | 8.119 | 7.55 | 17.875 | 0.755 | 77.6 | 82.4 | 14.7 | 0.95 | 65.3 | high |
| 13 | Pedro Porro | Spain | DEF | md1 | Cabo Verde | 87.106 | top_pick_candidate | 5.699 | 5.3 | 11.834 | 0.964 | 45.4 | 83.6 | 22 | 0.91 | 75.5 | high |
| 14 | Marc Cucurella | Spain | DEF | md1 | Cabo Verde | 87.076 | top_pick_candidate | 6.208 | 5.773 | 13.064 | 1.132 | 50.1 | 86 | 23.6 | 0.9 | 74.8 | high |
| 15 | Nuno Alexandre Tavares Mendes | Portugal | DEF | md1 | Congo DR | 86.906 | top_pick_candidate | 8.193 | 7.62 | 17.066 | 1.314 | 72.8 | 78.5 | 30.1 | 0.892 | 74.2 | high |
| 16 | Florian Wirtz | Germany | MID | md1 | Curaçao | 86.806 | top_pick_candidate | 6.615 | 6.152 | 14.284 | 0.82 | 46 | 81.9 | 23.4 | 0.923 | 69.1 | high |
| 17 | Rúben dos Santos Gato Alves Dias | Portugal | DEF | md1 | Congo DR | 86.794 | top_pick_candidate | 5.37 | 4.994 | 11.102 | 0.999 | 40.4 | 75.3 | 16.2 | 0.908 | 75.4 | high |
| 18 | Gregor Kobel | Switzerland | GK | md1 | Qatar | 86.779 | top_pick_candidate | 5.754 | 5.351 | 11.785 | 1.139 | 52.6 | 85.6 | 10.6 | 0.908 | 79.9 | high |
| 19 | David Raum | Germany | DEF | md1 | Curaçao | 86.709 | top_pick_candidate | 7.353 | 6.838 | 15.186 | 1.396 | 57.8 | 87.3 | 15.2 | 0.9 | 74.8 | high |
| 20 | Jhon Lucumí | Colombia | DEF | md1 | Uzbekistan | 86.596 | top_pick_candidate | 5.686 | 5.288 | 11.795 | 1.23 | 42.5 | 81.5 | 27.4 | 0.94 | 77.7 | high |
| 4 | Lamine Yamal Nasraoui Ebana | Spain | MID | md1 | Cabo Verde | 86.54 | top_pick_candidate | 8.684 | 8.076 | 18.795 | 0.808 | 75.4 | 82.4 | 20.9 | 0.896 | 67.3 | high |

### md2

| Rank | Name | Country | Pos | Scope | Opponent | Score | Tier | Raw | Risk | Captain | Value | Alpha | Portfolio | Downside | Start | Min | Conf |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Lionel Messi | Argentina | FWD | md2 | Austria | 96.352 | top_pick_candidate | 8.119 | 7.55 | 17.827 | 0.755 | 77.6 | 82.4 | 14.7 | 0.95 | 65.3 | high |
| 2 | Harry Kane | England | FWD | md2 | Ghana | 91.299 | top_pick_candidate | 7.552 | 7.023 | 16.855 | 0.669 | 58.3 | 81.4 | 15.7 | 0.944 | 65 | high |
| 1 | Camilo Vargas | Colombia | GK | md2 | Congo DR | 89.888 | top_pick_candidate | 6.295 | 5.855 | 12.684 | 1.362 | 56.4 | 87.9 | 15.6 | 0.94 | 82.7 | high |
| 3 | Bruno Miguel Borges Fernandes | Portugal | MID | md2 | Uzbekistan | 89.361 | top_pick_candidate | 8.122 | 7.554 | 17.457 | 0.889 | 52.2 | 75.3 | 18.8 | 0.92 | 68.9 | high |
| 2 | Bruno Miguel Borges Fernandes | Portugal | MID | md2 | Uzbekistan | 88.483 | top_pick_candidate | 8.122 | 7.554 | 17.457 | 0.889 | 52.2 | 75.3 | 18.8 | 0.92 | 68.9 | high |
| 3 | Emiliano Martínez | Argentina | GK | md2 | Austria | 88.389 | top_pick_candidate | 6.049 | 5.626 | 12.246 | 1.125 | 71.6 | 87.2 | 17.7 | 0.94 | 82.7 | high |
| 4 | Kylian Mbappé | France | FWD | md2 | Iraq | 88.165 | top_pick_candidate | 7.281 | 6.772 | 16.349 | 0.645 | 55.6 | 80.6 | 16.9 | 0.912 | 63.2 | high |
| 4 | Enzo Fernández | Argentina | MID | md2 | Austria | 87.957 | top_pick_candidate | 7.396 | 6.878 | 16.052 | 0.917 | 71.2 | 84.7 | 22.2 | 0.95 | 70.8 | high |
| 5 | Daniel Muñoz | Colombia | DEF | md2 | Congo DR | 87.867 | top_pick_candidate | 6.44 | 5.989 | 13.368 | 1.302 | 49.7 | 86.1 | 20.3 | 0.94 | 77.7 | high |
| 6 | Alisson Ramsés Becker | Brazil | GK | md2 | Haiti | 87.437 | top_pick_candidate | 5.809 | 5.402 | 11.892 | 1.08 | 56 | 86.6 | 13.7 | 0.932 | 82 | high |
| 7 | Diogo Meireles da Costa | Portugal | GK | md2 | Uzbekistan | 87.395 | top_pick_candidate | 5.525 | 5.138 | 11.306 | 1.049 | 48.7 | 76.5 | 10.8 | 0.908 | 79.9 | high |
| 8 | Nicolás Otamendi | Argentina | DEF | md2 | Austria | 87.263 | top_pick_candidate | 5.641 | 5.246 | 11.796 | 1.192 | 53 | 87.7 | 13.6 | 0.94 | 77.7 | high |
| 9 | Dávinson Sánchez | Colombia | DEF | md2 | Congo DR | 87.215 | top_pick_candidate | 5.282 | 4.913 | 10.928 | 1.143 | 41.6 | 83.8 | 19.8 | 0.94 | 77.7 | high |
| 10 | Lionel Messi | Argentina | FWD | md2 | Austria | 87.14 | top_pick_candidate | 8.119 | 7.55 | 17.827 | 0.755 | 77.6 | 82.4 | 14.7 | 0.95 | 65.3 | high |
| 11 | Nuno Alexandre Tavares Mendes | Portugal | DEF | md2 | Uzbekistan | 87.079 | top_pick_candidate | 8.252 | 7.675 | 17.223 | 1.323 | 72.8 | 78.5 | 30.1 | 0.892 | 74.2 | high |
| 12 | Rúben dos Santos Gato Alves Dias | Portugal | DEF | md2 | Uzbekistan | 86.919 | top_pick_candidate | 5.387 | 5.01 | 11.184 | 1.002 | 40.4 | 75.3 | 16.2 | 0.908 | 75.4 | high |
| 13 | Harry Kane | England | FWD | md2 | Ghana | 86.897 | top_pick_candidate | 7.552 | 7.023 | 16.855 | 0.669 | 58.3 | 81.4 | 15.7 | 0.944 | 65 | high |
| 14 | Jordan Pickford | England | GK | md2 | Ghana | 86.757 | top_pick_candidate | 5.797 | 5.391 | 11.866 | 1.123 | 54.5 | 86.5 | 16.4 | 0.916 | 80.6 | high |
| 15 | Unai Simón | Spain | GK | md2 | Saudi Arabia | 86.732 | top_pick_candidate | 5.838 | 5.429 | 11.952 | 1.086 | 53.1 | 85.8 | 20.2 | 0.908 | 79.9 | high |
| 16 | Jhon Lucumí | Colombia | DEF | md2 | Congo DR | 86.543 | top_pick_candidate | 5.647 | 5.251 | 11.687 | 1.221 | 42.5 | 81.5 | 27.4 | 0.94 | 77.7 | high |
| 1 | Giorgian de Arrascaeta | Uruguay | MID | md2 | Cabo Verde | 86.457 | top_pick_candidate | 7.818 | 7.271 | 17.1 | 1.119 | 66.1 | 82.7 | 25.3 | 0.923 | 69.1 | high |
| 17 | Ezri Konsa | England | DEF | md2 | Ghana | 86.276 | top_pick_candidate | 5.503 | 5.117 | 11.497 | 1.066 | 45.6 | 83.4 | 22 | 0.908 | 75.4 | high |
| 18 | Declan Rice | England | MID | md2 | Ghana | 86.217 | top_pick_candidate | 5.584 | 5.193 | 11.831 | 0.742 | 41.5 | 81.2 | 19.2 | 0.931 | 69.6 | high |
| 19 | Nico O'Reilly | England | DEF | md2 | Ghana | 86.036 | top_pick_candidate | 6.925 | 6.44 | 14.775 | 1.37 | 59.3 | 89.4 | 16.4 | 0.876 | 73.1 | high |
| 20 | Bruno Guimarães Rodriguez Moura | Brazil | MID | md2 | Haiti | 86.032 | top_pick_candidate | 6.247 | 5.81 | 13.497 | 0.854 | 45.9 | 82.2 | 19.4 | 0.95 | 70.8 | high |

### md3

| Rank | Name | Country | Pos | Scope | Opponent | Score | Tier | Raw | Risk | Captain | Value | Alpha | Portfolio | Downside | Start | Min | Conf |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Lionel Messi | Argentina | FWD | md3 | Jordan | 98.178 | top_pick_candidate | 8.119 | 7.55 | 17.928 | 0.755 | 77.6 | 82.4 | 14.7 | 0.95 | 65.3 | high |
| 2 | Harry Kane | England | FWD | md3 | Panama | 92.042 | top_pick_candidate | 7.552 | 7.023 | 16.804 | 0.669 | 58.3 | 81.4 | 15.7 | 0.944 | 65 | high |
| 1 | Enzo Fernández | Argentina | MID | md3 | Jordan | 88.889 | top_pick_candidate | 7.481 | 6.957 | 16.342 | 0.928 | 71.2 | 84.7 | 22.2 | 0.95 | 70.8 | high |
| 2 | Emiliano Martínez | Argentina | GK | md3 | Jordan | 88.826 | top_pick_candidate | 6.049 | 5.626 | 12.347 | 1.125 | 71.6 | 87.2 | 17.7 | 0.94 | 82.7 | high |
| 3 | Kylian Mbappé | France | FWD | md3 | Norway | 88.518 | top_pick_candidate | 7.083 | 6.587 | 15.77 | 0.627 | 55.6 | 80.6 | 16.9 | 0.912 | 63.2 | high |
| 3 | Thibaut Courtois | Belgium | GK | md3 | New Zealand | 88.229 | top_pick_candidate | 5.595 | 5.203 | 11.388 | 1.062 | 53.4 | 85.4 | 13.2 | 0.892 | 78.5 | high |
| 4 | Lionel Messi | Argentina | FWD | md3 | Jordan | 87.995 | top_pick_candidate | 8.119 | 7.55 | 17.928 | 0.755 | 77.6 | 82.4 | 14.7 | 0.95 | 65.3 | high |
| 5 | Virgil van Dijk | Netherlands | DEF | md3 | Tunisia | 87.891 | top_pick_candidate | 6.17 | 5.738 | 12.888 | 1.043 | 44.1 | 83.3 | 16.6 | 0.934 | 77.2 | high |
| 6 | Nicolás Otamendi | Argentina | DEF | md3 | Jordan | 87.706 | top_pick_candidate | 5.657 | 5.261 | 11.935 | 1.196 | 53 | 87.7 | 13.6 | 0.94 | 77.7 | high |
| 7 | Zeno Debast | Belgium | DEF | md3 | New Zealand | 87.465 | top_pick_candidate | 5.512 | 5.126 | 11.231 | 1.192 | 48.3 | 86.1 | 21 | 0.898 | 74.7 | high |
| 8 | Harry Kane | England | FWD | md3 | Panama | 86.897 | top_pick_candidate | 7.552 | 7.023 | 16.804 | 0.669 | 58.3 | 81.4 | 15.7 | 0.944 | 65 | high |
| 9 | Jordan Pickford | England | GK | md3 | Panama | 86.841 | top_pick_candidate | 5.797 | 5.391 | 11.815 | 1.123 | 54.5 | 86.5 | 16.4 | 0.916 | 80.6 | high |
| 10 | Denzel Dumfries | Netherlands | DEF | md3 | Tunisia | 86.754 | top_pick_candidate | 7.102 | 6.605 | 15.014 | 1.159 | 52.1 | 84.7 | 22.7 | 0.908 | 75.4 | high |
| 4 | Lautaro Martínez | Argentina | FWD | md3 | Jordan | 86.651 | top_pick_candidate | 6.428 | 5.978 | 14.748 | 0.679 | 50 | 77.5 | 23.2 | 0.944 | 65 | high |
| 11 | Yahia Fofana | Côte d'Ivoire | GK | md3 | Curaçao | 86.503 | top_pick_candidate | 6.19 | 5.757 | 12.427 | 1.371 | 40.8 | 82.1 | 17.8 | 0.932 | 82 | high |
| 12 | Bart Verbruggen | Netherlands | GK | md3 | Tunisia | 86.422 | top_pick_candidate | 5.805 | 5.399 | 11.788 | 1.149 | 49.9 | 84.7 | 14.9 | 0.908 | 79.9 | high |
| 13 | Arthur Theate | Belgium | DEF | md3 | New Zealand | 86.389 | top_pick_candidate | 5.447 | 5.066 | 11.371 | 1.126 | 43.9 | 81.6 | 27.7 | 0.908 | 75.4 | high |
| 14 | Ezri Konsa | England | DEF | md3 | Panama | 86.35 | top_pick_candidate | 5.503 | 5.117 | 11.446 | 1.066 | 45.6 | 83.4 | 22 | 0.908 | 75.4 | high |
| 15 | Nicolás Tagliafico | Argentina | DEF | md3 | Jordan | 86.283 | top_pick_candidate | 6.78 | 6.305 | 14.335 | 1.466 | 72.2 | 91.3 | 25.6 | 0.93 | 77 | high |
| 16 | Nico O'Reilly | England | DEF | md3 | Panama | 86.156 | top_pick_candidate | 6.925 | 6.44 | 14.724 | 1.37 | 59.3 | 89.4 | 16.4 | 0.876 | 73.1 | high |
| 17 | Declan Rice | England | MID | md3 | Panama | 86.155 | top_pick_candidate | 5.584 | 5.193 | 11.78 | 0.742 | 41.5 | 81.2 | 19.2 | 0.931 | 69.6 | high |
| 18 | Édouard Mendy | Senegal | GK | md3 | Iraq | 86.012 | top_pick_candidate | 5.632 | 5.238 | 11.442 | 1.164 | 38.8 | 73.5 | 13.1 | 0.932 | 82 | high |
| 19 | Kylian Mbappé | France | FWD | md3 | Norway | 85.988 | top_pick_candidate | 7.083 | 6.587 | 15.77 | 0.627 | 55.6 | 80.6 | 16.9 | 0.912 | 63.2 | high |
| 20 | Jurriën Timber | Netherlands | DEF | md3 | Tunisia | 85.954 | top_pick_candidate | 6.761 | 6.287 | 14.337 | 1.209 | 49.6 | 84.3 | 13.4 | 0.892 | 74.2 | high |
| 21 | Marc Guéhi | England | DEF | md3 | Panama | 85.928 | top_pick_candidate | 6.294 | 5.854 | 13.292 | 1.148 | 51.8 | 86.5 | 14.2 | 0.884 | 73.6 | high |

## Top 25 By Position

### GK

| Rank | Name | Country | Pos | Scope | Opponent | Score | Tier | Raw | Risk | Captain | Value | Alpha | Portfolio | Downside | Start | Min | Conf |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Camilo Vargas | Colombia | GK | md1 | Uzbekistan | 89.896 | top_pick_candidate | 6.295 | 5.855 | 12.703 | 1.362 | 56.4 | 87.9 | 15.6 | 0.94 | 82.7 | high |
| 1 | Camilo Vargas | Colombia | GK | md2 | Congo DR | 89.888 | top_pick_candidate | 6.295 | 5.855 | 12.684 | 1.362 | 56.4 | 87.9 | 15.6 | 0.94 | 82.7 | high |
| 2 | Emiliano Martínez | Argentina | GK | md3 | Jordan | 88.826 | top_pick_candidate | 6.049 | 5.626 | 12.347 | 1.125 | 71.6 | 87.2 | 17.7 | 0.94 | 82.7 | high |
| 2 | Unai Simón | Spain | GK | md1 | Cabo Verde | 88.732 | top_pick_candidate | 5.838 | 5.429 | 11.957 | 1.086 | 53.1 | 85.8 | 20.2 | 0.908 | 79.9 | high |
| 3 | Emiliano Martínez | Argentina | GK | md1 | Algeria | 88.417 | top_pick_candidate | 6.049 | 5.626 | 12.294 | 1.125 | 71.6 | 87.2 | 17.7 | 0.94 | 82.7 | high |
| 3 | Emiliano Martínez | Argentina | GK | md2 | Austria | 88.389 | top_pick_candidate | 6.049 | 5.626 | 12.246 | 1.125 | 71.6 | 87.2 | 17.7 | 0.94 | 82.7 | high |
| 3 | Thibaut Courtois | Belgium | GK | md3 | New Zealand | 88.229 | top_pick_candidate | 5.595 | 5.203 | 11.388 | 1.062 | 53.4 | 85.4 | 13.2 | 0.892 | 78.5 | high |
| 1 | Emiliano Martínez | Argentina | GK | group_stage_full | Group stage average | 87.947 | top_pick_candidate | 18.147 | 16.878 | 12.347 | 3.376 | 71.6 | 87.2 | 17.7 | 0.94 | 82.7 | high |
| 2 | Camilo Vargas | Colombia | GK | group_stage_full | Group stage average | 87.462 | top_pick_candidate | 16.551 | 15.394 | 12.703 | 3.58 | 56.4 | 87.9 | 15.6 | 0.94 | 82.7 | high |
| 6 | Alisson Ramsés Becker | Brazil | GK | md2 | Haiti | 87.437 | top_pick_candidate | 5.809 | 5.402 | 11.892 | 1.08 | 56 | 86.6 | 13.7 | 0.932 | 82 | high |
| 7 | Diogo Meireles da Costa | Portugal | GK | md2 | Uzbekistan | 87.395 | top_pick_candidate | 5.525 | 5.138 | 11.306 | 1.049 | 48.7 | 76.5 | 10.8 | 0.908 | 79.9 | high |
| 10 | Diogo Meireles da Costa | Portugal | GK | md1 | Congo DR | 87.29 | top_pick_candidate | 5.525 | 5.138 | 11.26 | 1.049 | 48.7 | 76.5 | 10.8 | 0.908 | 79.9 | high |
| 9 | Jordan Pickford | England | GK | md3 | Panama | 86.841 | top_pick_candidate | 5.797 | 5.391 | 11.815 | 1.123 | 54.5 | 86.5 | 16.4 | 0.916 | 80.6 | high |
| 18 | Gregor Kobel | Switzerland | GK | md1 | Qatar | 86.779 | top_pick_candidate | 5.754 | 5.351 | 11.785 | 1.139 | 52.6 | 85.6 | 10.6 | 0.908 | 79.9 | high |
| 14 | Jordan Pickford | England | GK | md2 | Ghana | 86.757 | top_pick_candidate | 5.797 | 5.391 | 11.866 | 1.123 | 54.5 | 86.5 | 16.4 | 0.916 | 80.6 | high |
| 15 | Unai Simón | Spain | GK | md2 | Saudi Arabia | 86.732 | top_pick_candidate | 5.838 | 5.429 | 11.952 | 1.086 | 53.1 | 85.8 | 20.2 | 0.908 | 79.9 | high |
| 11 | Yahia Fofana | Côte d'Ivoire | GK | md3 | Curaçao | 86.503 | top_pick_candidate | 6.19 | 5.757 | 12.427 | 1.371 | 40.8 | 82.1 | 17.8 | 0.932 | 82 | high |
| 22 | Sergio Rochet | Uruguay | GK | md1 | Saudi Arabia | 86.473 | top_pick_candidate | 5.985 | 5.566 | 12.116 | 1.358 | 69.7 | 84.2 | 22.5 | 0.94 | 82.7 | high |
| 12 | Bart Verbruggen | Netherlands | GK | md3 | Tunisia | 86.422 | top_pick_candidate | 5.805 | 5.399 | 11.788 | 1.149 | 49.9 | 84.7 | 14.9 | 0.908 | 79.9 | high |
| 18 | Édouard Mendy | Senegal | GK | md3 | Iraq | 86.012 | top_pick_candidate | 5.632 | 5.238 | 11.442 | 1.164 | 38.8 | 73.5 | 13.1 | 0.932 | 82 | high |
| 8 | Jordan Pickford | England | GK | group_stage_full | Group stage average | 85.465 | top_pick_candidate | 16.478 | 15.324 | 11.866 | 3.193 | 54.5 | 86.5 | 16.4 | 0.916 | 80.6 | high |
| 9 | Unai Simón | Spain | GK | group_stage_full | Group stage average | 85.455 | top_pick_candidate | 16.737 | 15.565 | 11.957 | 3.113 | 53.1 | 85.8 | 20.2 | 0.908 | 79.9 | high |
| 12 | Diogo Meireles da Costa | Portugal | GK | group_stage_full | Group stage average | 85.213 | top_pick_candidate | 14.642 | 13.617 | 11.306 | 2.779 | 48.7 | 76.5 | 10.8 | 0.908 | 79.9 | high |
| 13 | Thibaut Courtois | Belgium | GK | group_stage_full | Group stage average | 85.083 | top_pick_candidate | 16.045 | 14.922 | 11.388 | 3.045 | 53.4 | 85.4 | 13.2 | 0.892 | 78.5 | high |
| 13 | Camilo Vargas | Colombia | GK | md1 | Uzbekistan | 77.036 | strong_candidate | 6.295 | 5.855 | 12.703 | 1.362 | 56.4 | 87.9 | 15.6 | 0.94 | 82.7 | high |

### DEF

| Rank | Name | Country | Pos | Scope | Opponent | Score | Tier | Raw | Risk | Captain | Value | Alpha | Portfolio | Downside | Start | Min | Conf |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 6 | Daniel Muñoz | Colombia | DEF | md1 | Uzbekistan | 87.987 | top_pick_candidate | 6.537 | 6.079 | 13.596 | 1.322 | 49.7 | 86.1 | 20.3 | 0.94 | 77.7 | high |
| 5 | Virgil van Dijk | Netherlands | DEF | md3 | Tunisia | 87.891 | top_pick_candidate | 6.17 | 5.738 | 12.888 | 1.043 | 44.1 | 83.3 | 16.6 | 0.934 | 77.2 | high |
| 5 | Daniel Muñoz | Colombia | DEF | md2 | Congo DR | 87.867 | top_pick_candidate | 6.44 | 5.989 | 13.368 | 1.302 | 49.7 | 86.1 | 20.3 | 0.94 | 77.7 | high |
| 6 | Nicolás Otamendi | Argentina | DEF | md3 | Jordan | 87.706 | top_pick_candidate | 5.657 | 5.261 | 11.935 | 1.196 | 53 | 87.7 | 13.6 | 0.94 | 77.7 | high |
| 7 | Zeno Debast | Belgium | DEF | md3 | New Zealand | 87.465 | top_pick_candidate | 5.512 | 5.126 | 11.231 | 1.192 | 48.3 | 86.1 | 21 | 0.898 | 74.7 | high |
| 8 | Joshua Kimmich | Germany | DEF | md1 | Curaçao | 87.353 | top_pick_candidate | 7.254 | 6.746 | 15.051 | 1.227 | 52 | 85.3 | 15.9 | 0.91 | 75.5 | high |
| 9 | Nicolás Otamendi | Argentina | DEF | md1 | Algeria | 87.309 | top_pick_candidate | 5.657 | 5.261 | 11.882 | 1.196 | 53 | 87.7 | 13.6 | 0.94 | 77.7 | high |
| 8 | Nicolás Otamendi | Argentina | DEF | md2 | Austria | 87.263 | top_pick_candidate | 5.641 | 5.246 | 11.796 | 1.192 | 53 | 87.7 | 13.6 | 0.94 | 77.7 | high |
| 11 | Dávinson Sánchez | Colombia | DEF | md1 | Uzbekistan | 87.247 | top_pick_candidate | 5.304 | 4.932 | 10.997 | 1.147 | 41.6 | 83.8 | 19.8 | 0.94 | 77.7 | high |
| 9 | Dávinson Sánchez | Colombia | DEF | md2 | Congo DR | 87.215 | top_pick_candidate | 5.282 | 4.913 | 10.928 | 1.143 | 41.6 | 83.8 | 19.8 | 0.94 | 77.7 | high |
| 13 | Pedro Porro | Spain | DEF | md1 | Cabo Verde | 87.106 | top_pick_candidate | 5.699 | 5.3 | 11.834 | 0.964 | 45.4 | 83.6 | 22 | 0.91 | 75.5 | high |
| 11 | Nuno Alexandre Tavares Mendes | Portugal | DEF | md2 | Uzbekistan | 87.079 | top_pick_candidate | 8.252 | 7.675 | 17.223 | 1.323 | 72.8 | 78.5 | 30.1 | 0.892 | 74.2 | high |
| 14 | Marc Cucurella | Spain | DEF | md1 | Cabo Verde | 87.076 | top_pick_candidate | 6.208 | 5.773 | 13.064 | 1.132 | 50.1 | 86 | 23.6 | 0.9 | 74.8 | high |
| 12 | Rúben dos Santos Gato Alves Dias | Portugal | DEF | md2 | Uzbekistan | 86.919 | top_pick_candidate | 5.387 | 5.01 | 11.184 | 1.002 | 40.4 | 75.3 | 16.2 | 0.908 | 75.4 | high |
| 15 | Nuno Alexandre Tavares Mendes | Portugal | DEF | md1 | Congo DR | 86.906 | top_pick_candidate | 8.193 | 7.62 | 17.066 | 1.314 | 72.8 | 78.5 | 30.1 | 0.892 | 74.2 | high |
| 4 | Nicolás Otamendi | Argentina | DEF | group_stage_full | Group stage average | 86.828 | top_pick_candidate | 16.955 | 15.768 | 11.935 | 3.584 | 53 | 87.7 | 13.6 | 0.94 | 77.7 | high |
| 17 | Rúben dos Santos Gato Alves Dias | Portugal | DEF | md1 | Congo DR | 86.794 | top_pick_candidate | 5.37 | 4.994 | 11.102 | 0.999 | 40.4 | 75.3 | 16.2 | 0.908 | 75.4 | high |
| 10 | Denzel Dumfries | Netherlands | DEF | md3 | Tunisia | 86.754 | top_pick_candidate | 7.102 | 6.605 | 15.014 | 1.159 | 52.1 | 84.7 | 22.7 | 0.908 | 75.4 | high |
| 19 | David Raum | Germany | DEF | md1 | Curaçao | 86.709 | top_pick_candidate | 7.353 | 6.838 | 15.186 | 1.396 | 57.8 | 87.3 | 15.2 | 0.9 | 74.8 | high |
| 20 | Jhon Lucumí | Colombia | DEF | md1 | Uzbekistan | 86.596 | top_pick_candidate | 5.686 | 5.288 | 11.795 | 1.23 | 42.5 | 81.5 | 27.4 | 0.94 | 77.7 | high |
| 16 | Jhon Lucumí | Colombia | DEF | md2 | Congo DR | 86.543 | top_pick_candidate | 5.647 | 5.251 | 11.687 | 1.221 | 42.5 | 81.5 | 27.4 | 0.94 | 77.7 | high |
| 13 | Arthur Theate | Belgium | DEF | md3 | New Zealand | 86.389 | top_pick_candidate | 5.447 | 5.066 | 11.371 | 1.126 | 43.9 | 81.6 | 27.7 | 0.908 | 75.4 | high |
| 14 | Ezri Konsa | England | DEF | md3 | Panama | 86.35 | top_pick_candidate | 5.503 | 5.117 | 11.446 | 1.066 | 45.6 | 83.4 | 22 | 0.908 | 75.4 | high |
| 15 | Nicolás Tagliafico | Argentina | DEF | md3 | Jordan | 86.283 | top_pick_candidate | 6.78 | 6.305 | 14.335 | 1.466 | 72.2 | 91.3 | 25.6 | 0.93 | 77 | high |
| 17 | Ezri Konsa | England | DEF | md2 | Ghana | 86.276 | top_pick_candidate | 5.503 | 5.117 | 11.497 | 1.066 | 45.6 | 83.4 | 22 | 0.908 | 75.4 | high |

### MID

| Rank | Name | Country | Pos | Scope | Opponent | Score | Tier | Raw | Risk | Captain | Value | Alpha | Portfolio | Downside | Start | Min | Conf |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 3 | Bruno Miguel Borges Fernandes | Portugal | MID | md2 | Uzbekistan | 89.361 | top_pick_candidate | 8.122 | 7.554 | 17.457 | 0.889 | 52.2 | 75.3 | 18.8 | 0.92 | 68.9 | high |
| 1 | Enzo Fernández | Argentina | MID | md3 | Jordan | 88.889 | top_pick_candidate | 7.481 | 6.957 | 16.342 | 0.928 | 71.2 | 84.7 | 22.2 | 0.95 | 70.8 | high |
| 1 | Giorgian de Arrascaeta | Uruguay | MID | md1 | Saudi Arabia | 88.724 | top_pick_candidate | 7.541 | 7.013 | 16.481 | 1.079 | 66.1 | 82.7 | 25.3 | 0.923 | 69.1 | high |
| 2 | Bruno Miguel Borges Fernandes | Portugal | MID | md2 | Uzbekistan | 88.483 | top_pick_candidate | 8.122 | 7.554 | 17.457 | 0.889 | 52.2 | 75.3 | 18.8 | 0.92 | 68.9 | high |
| 4 | Enzo Fernández | Argentina | MID | md1 | Algeria | 88.109 | top_pick_candidate | 7.481 | 6.957 | 16.289 | 0.928 | 71.2 | 84.7 | 22.2 | 0.95 | 70.8 | high |
| 5 | Bruno Miguel Borges Fernandes | Portugal | MID | md1 | Congo DR | 88.051 | top_pick_candidate | 7.965 | 7.408 | 17.068 | 0.872 | 52.2 | 75.3 | 18.8 | 0.92 | 68.9 | high |
| 4 | Enzo Fernández | Argentina | MID | md2 | Austria | 87.957 | top_pick_candidate | 7.396 | 6.878 | 16.052 | 0.917 | 71.2 | 84.7 | 22.2 | 0.95 | 70.8 | high |
| 3 | Bruno Miguel Borges Fernandes | Portugal | MID | md1 | Congo DR | 87.808 | top_pick_candidate | 7.965 | 7.408 | 17.068 | 0.872 | 52.2 | 75.3 | 18.8 | 0.92 | 68.9 | high |
| 3 | Enzo Fernández | Argentina | MID | group_stage_full | Group stage average | 87.346 | top_pick_candidate | 22.358 | 20.792 | 16.342 | 2.772 | 71.2 | 84.7 | 22.2 | 0.95 | 70.8 | high |
| 16 | Florian Wirtz | Germany | MID | md1 | Curaçao | 86.806 | top_pick_candidate | 6.615 | 6.152 | 14.284 | 0.82 | 46 | 81.9 | 23.4 | 0.923 | 69.1 | high |
| 5 | Bruno Miguel Borges Fernandes | Portugal | MID | group_stage_full | Group stage average | 86.722 | top_pick_candidate | 21.845 | 20.317 | 17.457 | 2.39 | 52.2 | 75.3 | 18.8 | 0.92 | 68.9 | high |
| 4 | Lamine Yamal Nasraoui Ebana | Spain | MID | md1 | Cabo Verde | 86.54 | top_pick_candidate | 8.684 | 8.076 | 18.795 | 0.808 | 75.4 | 82.4 | 20.9 | 0.896 | 67.3 | high |
| 21 | Declan Rice | England | MID | md1 | Croatia | 86.475 | top_pick_candidate | 4.965 | 4.617 | 10.284 | 0.66 | 41.5 | 81.2 | 19.2 | 0.931 | 69.6 | high |
| 1 | Giorgian de Arrascaeta | Uruguay | MID | md2 | Cabo Verde | 86.457 | top_pick_candidate | 7.818 | 7.271 | 17.1 | 1.119 | 66.1 | 82.7 | 25.3 | 0.923 | 69.1 | high |
| 24 | Mikel Merino | Spain | MID | md1 | Cabo Verde | 86.237 | top_pick_candidate | 6.135 | 5.705 | 13.48 | 0.92 | 51.2 | 80.8 | 33.5 | 0.908 | 68.1 | high |
| 18 | Declan Rice | England | MID | md2 | Ghana | 86.217 | top_pick_candidate | 5.584 | 5.193 | 11.831 | 0.742 | 41.5 | 81.2 | 19.2 | 0.931 | 69.6 | high |
| 17 | Declan Rice | England | MID | md3 | Panama | 86.155 | top_pick_candidate | 5.584 | 5.193 | 11.78 | 0.742 | 41.5 | 81.2 | 19.2 | 0.931 | 69.6 | high |
| 20 | Bruno Guimarães Rodriguez Moura | Brazil | MID | md2 | Haiti | 86.032 | top_pick_candidate | 6.247 | 5.81 | 13.497 | 0.854 | 45.9 | 82.2 | 19.4 | 0.95 | 70.8 | high |
| 22 | Florian Wirtz | Germany | MID | md2 | Côte d'Ivoire | 85.923 | top_pick_candidate | 6.362 | 5.916 | 13.687 | 0.789 | 46 | 81.9 | 23.4 | 0.923 | 69.1 | high |
| 25 | Martín Zubimendi | Spain | MID | md1 | Cabo Verde | 85.906 | top_pick_candidate | 4.095 | 3.808 | 9 | 0.624 | 32.7 | 79.1 | 19.8 | 0.91 | 68.2 | high |
| 5 | Giorgian de Arrascaeta | Uruguay | MID | md2 | Cabo Verde | 85.679 | top_pick_candidate | 7.818 | 7.271 | 17.1 | 1.119 | 66.1 | 82.7 | 25.3 | 0.923 | 69.1 | high |
| 22 | Alexis Mac Allister | Argentina | MID | md3 | Jordan | 85.595 | top_pick_candidate | 4.693 | 4.365 | 10.28 | 0.661 | 34.5 | 77.9 | 26.2 | 0.95 | 70.8 | high |
| 5 | Enzo Fernández | Argentina | MID | md3 | Jordan | 85.016 | top_pick_candidate | 7.481 | 6.957 | 16.342 | 0.928 | 71.2 | 84.7 | 22.2 | 0.95 | 70.8 | high |
| 14 | Florian Wirtz | Germany | MID | group_stage_full | Group stage average | 84.983 | top_pick_candidate | 18.19 | 16.916 | 14.284 | 2.255 | 46 | 81.9 | 23.4 | 0.923 | 69.1 | high |
| 16 | Declan Rice | England | MID | group_stage_full | Group stage average | 84.93 | top_pick_candidate | 16.133 | 15.003 | 11.831 | 2.143 | 41.5 | 81.2 | 19.2 | 0.931 | 69.6 | high |

### FWD

| Rank | Name | Country | Pos | Scope | Opponent | Score | Tier | Raw | Risk | Captain | Value | Alpha | Portfolio | Downside | Start | Min | Conf |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Lionel Messi | Argentina | FWD | md3 | Jordan | 98.178 | top_pick_candidate | 8.119 | 7.55 | 17.928 | 0.755 | 77.6 | 82.4 | 14.7 | 0.95 | 65.3 | high |
| 1 | Lionel Messi | Argentina | FWD | md1 | Algeria | 96.457 | top_pick_candidate | 8.119 | 7.55 | 17.875 | 0.755 | 77.6 | 82.4 | 14.7 | 0.95 | 65.3 | high |
| 1 | Lionel Messi | Argentina | FWD | md2 | Austria | 96.352 | top_pick_candidate | 8.119 | 7.55 | 17.827 | 0.755 | 77.6 | 82.4 | 14.7 | 0.95 | 65.3 | high |
| 1 | Lionel Messi | Argentina | FWD | group_stage_full | Group stage average | 95.831 | top_pick_candidate | 24.357 | 22.65 | 17.928 | 2.265 | 77.6 | 82.4 | 14.7 | 0.95 | 65.3 | high |
| 2 | Harry Kane | England | FWD | md3 | Panama | 92.042 | top_pick_candidate | 7.552 | 7.023 | 16.804 | 0.669 | 58.3 | 81.4 | 15.7 | 0.944 | 65 | high |
| 2 | Harry Kane | England | FWD | md2 | Ghana | 91.299 | top_pick_candidate | 7.552 | 7.023 | 16.855 | 0.669 | 58.3 | 81.4 | 15.7 | 0.944 | 65 | high |
| 2 | Harry Kane | England | FWD | md1 | Croatia | 89.87 | top_pick_candidate | 7.265 | 6.757 | 16.033 | 0.644 | 58.3 | 81.4 | 15.7 | 0.944 | 65 | high |
| 2 | Harry Kane | England | FWD | group_stage_full | Group stage average | 89.806 | top_pick_candidate | 22.369 | 20.803 | 16.855 | 1.981 | 58.3 | 81.4 | 15.7 | 0.944 | 65 | high |
| 3 | Kylian Mbappé | France | FWD | md3 | Norway | 88.518 | top_pick_candidate | 7.083 | 6.587 | 15.77 | 0.627 | 55.6 | 80.6 | 16.9 | 0.912 | 63.2 | high |
| 4 | Kylian Mbappé | France | FWD | md2 | Iraq | 88.165 | top_pick_candidate | 7.281 | 6.772 | 16.349 | 0.645 | 55.6 | 80.6 | 16.9 | 0.912 | 63.2 | high |
| 4 | Lionel Messi | Argentina | FWD | md3 | Jordan | 87.995 | top_pick_candidate | 8.119 | 7.55 | 17.928 | 0.755 | 77.6 | 82.4 | 14.7 | 0.95 | 65.3 | high |
| 7 | Harry Kane | England | FWD | md1 | Croatia | 87.553 | top_pick_candidate | 7.265 | 6.757 | 16.033 | 0.644 | 58.3 | 81.4 | 15.7 | 0.944 | 65 | high |
| 12 | Lionel Messi | Argentina | FWD | md1 | Algeria | 87.194 | top_pick_candidate | 8.119 | 7.55 | 17.875 | 0.755 | 77.6 | 82.4 | 14.7 | 0.95 | 65.3 | high |
| 10 | Lionel Messi | Argentina | FWD | md2 | Austria | 87.14 | top_pick_candidate | 8.119 | 7.55 | 17.827 | 0.755 | 77.6 | 82.4 | 14.7 | 0.95 | 65.3 | high |
| 13 | Harry Kane | England | FWD | md2 | Ghana | 86.897 | top_pick_candidate | 7.552 | 7.023 | 16.855 | 0.669 | 58.3 | 81.4 | 15.7 | 0.944 | 65 | high |
| 8 | Harry Kane | England | FWD | md3 | Panama | 86.897 | top_pick_candidate | 7.552 | 7.023 | 16.804 | 0.669 | 58.3 | 81.4 | 15.7 | 0.944 | 65 | high |
| 4 | Lautaro Martínez | Argentina | FWD | md3 | Jordan | 86.651 | top_pick_candidate | 6.428 | 5.978 | 14.748 | 0.679 | 50 | 77.5 | 23.2 | 0.944 | 65 | high |
| 6 | Lionel Messi | Argentina | FWD | group_stage_full | Group stage average | 86.471 | top_pick_candidate | 24.357 | 22.65 | 17.928 | 2.265 | 77.6 | 82.4 | 14.7 | 0.95 | 65.3 | high |
| 23 | Mikel Oyarzabal | Spain | FWD | md1 | Cabo Verde | 86.434 | top_pick_candidate | 6.326 | 5.883 | 14.358 | 0.726 | 65.7 | 80.9 | 22.2 | 0.928 | 64.1 | high |
| 3 | Kylian Mbappé | France | FWD | group_stage_full | Group stage average | 86.306 | top_pick_candidate | 21.405 | 19.907 | 16.349 | 1.896 | 55.6 | 80.6 | 16.9 | 0.912 | 63.2 | high |
| 19 | Kylian Mbappé | France | FWD | md3 | Norway | 85.988 | top_pick_candidate | 7.083 | 6.587 | 15.77 | 0.627 | 55.6 | 80.6 | 16.9 | 0.912 | 63.2 | high |
| 24 | Cristiano Ronaldo dos Santos Aveiro | Portugal | FWD | md2 | Uzbekistan | 85.795 | top_pick_candidate | 6.686 | 6.218 | 15.177 | 0.622 | 48.9 | 72.4 | 16.8 | 0.92 | 63.7 | high |
| 7 | Harry Kane | England | FWD | group_stage_full | Group stage average | 85.764 | top_pick_candidate | 22.369 | 20.803 | 16.855 | 1.981 | 58.3 | 81.4 | 15.7 | 0.944 | 65 | high |
| 23 | Julián Alvarez | Argentina | FWD | md3 | Jordan | 85.333 | top_pick_candidate | 6.117 | 5.689 | 13.663 | 0.662 | 47.8 | 80 | 26.7 | 0.95 | 65.3 | high |
| 5 | Kylian Mbappé | France | FWD | md1 | Senegal | 85.059 | top_pick_candidate | 7.041 | 6.548 | 15.633 | 0.624 | 55.6 | 80.6 | 16.9 | 0.912 | 63.2 | high |

## Top Captain Candidates

| Rank | Name | Country | Pos | Scope | Opponent | Score | Tier | Raw | Risk | Captain | Value | Alpha | Portfolio | Downside | Start | Min | Conf |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Lionel Messi | Argentina | FWD | md3 | Jordan | 98.178 | top_pick_candidate | 8.119 | 7.55 | 17.928 | 0.755 | 77.6 | 82.4 | 14.7 | 0.95 | 65.3 | high |
| 1 | Lionel Messi | Argentina | FWD | md1 | Algeria | 96.457 | top_pick_candidate | 8.119 | 7.55 | 17.875 | 0.755 | 77.6 | 82.4 | 14.7 | 0.95 | 65.3 | high |
| 1 | Lionel Messi | Argentina | FWD | md2 | Austria | 96.352 | top_pick_candidate | 8.119 | 7.55 | 17.827 | 0.755 | 77.6 | 82.4 | 14.7 | 0.95 | 65.3 | high |
| 1 | Lionel Messi | Argentina | FWD | group_stage_full | Group stage average | 95.831 | top_pick_candidate | 24.357 | 22.65 | 17.928 | 2.265 | 77.6 | 82.4 | 14.7 | 0.95 | 65.3 | high |
| 2 | Harry Kane | England | FWD | md3 | Panama | 92.042 | top_pick_candidate | 7.552 | 7.023 | 16.804 | 0.669 | 58.3 | 81.4 | 15.7 | 0.944 | 65 | high |
| 2 | Harry Kane | England | FWD | md2 | Ghana | 91.299 | top_pick_candidate | 7.552 | 7.023 | 16.855 | 0.669 | 58.3 | 81.4 | 15.7 | 0.944 | 65 | high |
| 2 | Harry Kane | England | FWD | md1 | Croatia | 89.87 | top_pick_candidate | 7.265 | 6.757 | 16.033 | 0.644 | 58.3 | 81.4 | 15.7 | 0.944 | 65 | high |
| 2 | Harry Kane | England | FWD | group_stage_full | Group stage average | 89.806 | top_pick_candidate | 22.369 | 20.803 | 16.855 | 1.981 | 58.3 | 81.4 | 15.7 | 0.944 | 65 | high |
| 3 | Bruno Miguel Borges Fernandes | Portugal | MID | md2 | Uzbekistan | 89.361 | top_pick_candidate | 8.122 | 7.554 | 17.457 | 0.889 | 52.2 | 75.3 | 18.8 | 0.92 | 68.9 | high |
| 3 | Kylian Mbappé | France | FWD | md3 | Norway | 88.518 | top_pick_candidate | 7.083 | 6.587 | 15.77 | 0.627 | 55.6 | 80.6 | 16.9 | 0.912 | 63.2 | high |
| 4 | Kylian Mbappé | France | FWD | md2 | Iraq | 88.165 | top_pick_candidate | 7.281 | 6.772 | 16.349 | 0.645 | 55.6 | 80.6 | 16.9 | 0.912 | 63.2 | high |
| 3 | Bruno Miguel Borges Fernandes | Portugal | MID | md1 | Congo DR | 87.808 | top_pick_candidate | 7.965 | 7.408 | 17.068 | 0.872 | 52.2 | 75.3 | 18.8 | 0.92 | 68.9 | high |
| 4 | Lautaro Martínez | Argentina | FWD | md3 | Jordan | 86.651 | top_pick_candidate | 6.428 | 5.978 | 14.748 | 0.679 | 50 | 77.5 | 23.2 | 0.944 | 65 | high |
| 4 | Lamine Yamal Nasraoui Ebana | Spain | MID | md1 | Cabo Verde | 86.54 | top_pick_candidate | 8.684 | 8.076 | 18.795 | 0.808 | 75.4 | 82.4 | 20.9 | 0.896 | 67.3 | high |
| 3 | Kylian Mbappé | France | FWD | group_stage_full | Group stage average | 86.306 | top_pick_candidate | 21.405 | 19.907 | 16.349 | 1.896 | 55.6 | 80.6 | 16.9 | 0.912 | 63.2 | high |
| 5 | Giorgian de Arrascaeta | Uruguay | MID | md2 | Cabo Verde | 85.679 | top_pick_candidate | 7.818 | 7.271 | 17.1 | 1.119 | 66.1 | 82.7 | 25.3 | 0.923 | 69.1 | high |
| 5 | Kylian Mbappé | France | FWD | md1 | Senegal | 85.059 | top_pick_candidate | 7.041 | 6.548 | 15.633 | 0.624 | 55.6 | 80.6 | 16.9 | 0.912 | 63.2 | high |
| 6 | Lautaro Martínez | Argentina | FWD | md1 | Algeria | 85.034 | top_pick_candidate | 6.428 | 5.978 | 14.695 | 0.679 | 50 | 77.5 | 23.2 | 0.944 | 65 | high |
| 5 | Enzo Fernández | Argentina | MID | md3 | Jordan | 85.016 | top_pick_candidate | 7.481 | 6.957 | 16.342 | 0.928 | 71.2 | 84.7 | 22.2 | 0.95 | 70.8 | high |
| 6 | Cristiano Ronaldo dos Santos Aveiro | Portugal | FWD | md2 | Uzbekistan | 84.909 | top_pick_candidate | 6.686 | 6.218 | 15.177 | 0.622 | 48.9 | 72.4 | 16.8 | 0.92 | 63.7 | high |
| 7 | Lautaro Martínez | Argentina | FWD | md2 | Austria | 84.742 | top_pick_candidate | 6.406 | 5.958 | 14.606 | 0.677 | 50 | 77.5 | 23.2 | 0.944 | 65 | high |
| 8 | Lamine Yamal Nasraoui Ebana | Spain | MID | md2 | Saudi Arabia | 84.54 | top_pick_candidate | 8.684 | 8.076 | 18.79 | 0.808 | 75.4 | 82.4 | 20.9 | 0.896 | 67.3 | high |
| 7 | Cristiano Ronaldo dos Santos Aveiro | Portugal | FWD | md1 | Congo DR | 84.539 | top_pick_candidate | 6.676 | 6.209 | 15.113 | 0.621 | 48.9 | 72.4 | 16.8 | 0.92 | 63.7 | high |
| 8 | Luis Díaz | Colombia | MID | md1 | Uzbekistan | 84.359 | top_pick_candidate | 8.47 | 7.877 | 18.278 | 0.972 | 69 | 83.3 | 23.4 | 0.95 | 70.8 | high |
| 4 | Lautaro Martínez | Argentina | FWD | group_stage_full | Group stage average | 84.335 | top_pick_candidate | 19.262 | 17.914 | 14.748 | 2.036 | 50 | 77.5 | 23.2 | 0.944 | 65 | high |

## Top Value-Looking Candidates

| Rank | Name | Country | Pos | Scope | Opponent | Score | Tier | Raw | Risk | Captain | Value | Alpha | Portfolio | Downside | Start | Min | Conf |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 3 | Nicolás Tagliafico | Argentina | DEF | group_stage_full | Group stage average | 78.675 | strong_candidate | 20.294 | 18.873 | 14.335 | 4.389 | 72.2 | 91.3 | 25.6 | 0.93 | 77 | high |
| 10 | Nicolás Tagliafico | Argentina | DEF | group_stage_full | Group stage average | 85.371 | top_pick_candidate | 20.294 | 18.873 | 14.335 | 4.389 | 72.2 | 91.3 | 25.6 | 0.93 | 77 | high |
| 7 | Nicolás Tagliafico | Argentina | DEF | group_stage_full | Group stage average | 57.269 | watchlist_candidate | 20.294 | 18.873 | 14.335 | 4.389 | 72.2 | 91.3 | 25.6 | 0.93 | 77 | high |
| 24 | Nicolás Tagliafico | Argentina | DEF | group_stage_full | Group stage average | 64.369 | watchlist_candidate | 20.294 | 18.873 | 14.335 | 4.389 | 72.2 | 91.3 | 25.6 | 0.93 | 77 | high |
| 13 | Nahuel Molina | Argentina | DEF | group_stage_full | Group stage average | 72.991 | strong_candidate | 18.434 | 17.143 | 12.677 | 3.896 | 52.8 | 80.2 | 35.1 | 0.93 | 77 | high |
| 23 | Nahuel Molina | Argentina | DEF | group_stage_full | Group stage average | 48.032 | risky_candidate | 18.434 | 17.143 | 12.677 | 3.896 | 52.8 | 80.2 | 35.1 | 0.93 | 77 | high |
| 24 | Nahuel Molina | Argentina | DEF | group_stage_full | Group stage average | 61.821 | watchlist_candidate | 18.434 | 17.143 | 12.677 | 3.896 | 52.8 | 80.2 | 35.1 | 0.93 | 77 | high |
| 12 | Silvan Widmer | Switzerland | DEF | group_stage_full | Group stage average | 73.324 | strong_candidate | 17.429 | 16.21 | 14.001 | 3.86 | 71.9 | 86.8 | 26.9 | 0.908 | 75.4 | high |
| 18 | Silvan Widmer | Switzerland | DEF | group_stage_full | Group stage average | 51.628 | watchlist_candidate | 17.429 | 16.21 | 14.001 | 3.86 | 71.9 | 86.8 | 26.9 | 0.908 | 75.4 | high |
| 2 | Silvan Widmer | Switzerland | DEF | group_stage_full | Group stage average | 78.446 | strong_candidate | 17.429 | 16.21 | 14.001 | 3.86 | 71.9 | 86.8 | 26.9 | 0.908 | 75.4 | high |
| 7 | Nico O'Reilly | England | DEF | group_stage_full | Group stage average | 74.586 | strong_candidate | 19.499 | 18.133 | 14.775 | 3.858 | 59.3 | 89.4 | 16.4 | 0.876 | 73.1 | high |
| 20 | Nico O'Reilly | England | DEF | group_stage_full | Group stage average | 84.628 | top_pick_candidate | 19.499 | 18.133 | 14.775 | 3.858 | 59.3 | 89.4 | 16.4 | 0.876 | 73.1 | high |
| 14 | Nico O'Reilly | England | DEF | group_stage_full | Group stage average | 53.961 | watchlist_candidate | 19.499 | 18.133 | 14.775 | 3.858 | 59.3 | 89.4 | 16.4 | 0.876 | 73.1 | high |
| 22 | Jarell Quansah | England | DEF | group_stage_full | Group stage average | 62.376 | watchlist_candidate | 17.068 | 15.874 | 13.082 | 3.608 | 56.8 | 86 | 25.9 | 0.868 | 72.5 | high |
| 16 | Gonzalo Montiel | Argentina | DEF | group_stage_full | Group stage average | 52.084 | watchlist_candidate | 16.655 | 15.489 | 12.201 | 3.602 | 57.7 | 84.8 | 14 | 0.75 | 64 | high |
| 25 | Gonzalo Montiel | Argentina | DEF | group_stage_full | Group stage average | 61.577 | watchlist_candidate | 16.655 | 15.489 | 12.201 | 3.602 | 57.7 | 84.8 | 14 | 0.75 | 64 | high |
| 16 | Nicolás Otamendi | Argentina | DEF | group_stage_full | Group stage average | 72.516 | strong_candidate | 16.955 | 15.768 | 11.935 | 3.584 | 53 | 87.7 | 13.6 | 0.94 | 77.7 | high |
| 4 | Nicolás Otamendi | Argentina | DEF | group_stage_full | Group stage average | 86.828 | top_pick_candidate | 16.955 | 15.768 | 11.935 | 3.584 | 53 | 87.7 | 13.6 | 0.94 | 77.7 | high |
| 14 | Camilo Vargas | Colombia | GK | group_stage_full | Group stage average | 72.918 | strong_candidate | 16.551 | 15.394 | 12.703 | 3.58 | 56.4 | 87.9 | 15.6 | 0.94 | 82.7 | high |
| 2 | Camilo Vargas | Colombia | GK | group_stage_full | Group stage average | 87.462 | top_pick_candidate | 16.551 | 15.394 | 12.703 | 3.58 | 56.4 | 87.9 | 15.6 | 0.94 | 82.7 | high |
| 16 | Santiago Mele | Uruguay | GK | group_stage_full | Group stage average | 65.315 | watchlist_candidate | 13.177 | 12.254 | 11.189 | 3.501 | 66.7 | 79.9 | 21.8 | 0.872 | 76.7 | high |
| 15 | David Raum | Germany | DEF | group_stage_full | Group stage average | 72.53 | strong_candidate | 18.323 | 17.04 | 15.186 | 3.478 | 57.8 | 87.3 | 15.2 | 0.9 | 74.8 | high |
| 19 | David Raum | Germany | DEF | group_stage_full | Group stage average | 51.123 | watchlist_candidate | 18.323 | 17.04 | 15.186 | 3.478 | 57.8 | 87.3 | 15.2 | 0.9 | 74.8 | high |
| 4 | Nuno Alexandre Tavares Mendes | Portugal | DEF | group_stage_full | Group stage average | 78.002 | strong_candidate | 21.68 | 20.164 | 17.223 | 3.477 | 72.8 | 78.5 | 30.1 | 0.892 | 74.2 | high |
| 22 | Nuno Alexandre Tavares Mendes | Portugal | DEF | group_stage_full | Group stage average | 84.5 | top_pick_candidate | 21.68 | 20.164 | 17.223 | 3.477 | 72.8 | 78.5 | 30.1 | 0.892 | 74.2 | high |

## Projection Components For Top Candidates By Mode

| Mode | Rank | Name | Pos | Scope | Opponent | App | Att | Ast | CS | GC | Save | Tackle | Chance | SOT | Card | Bonus | Raw | Risk | Captain |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Balanced | 1 | Lionel Messi | FWD | md3 | Jordan | 1.832 | 3.75 | 1.65 | 0 | 0 | 0 | 0 | 0 | 0.95 | -0.063 | 0 | 8.119 | 7.55 | 17.928 |
| Balanced | 1 | Nuno Alexandre Tavares Mendes | DEF | md2 | Uzbekistan | 1.892 | 1.75 | 1.576 | 3.143 | -0.049 | 0 | 0 | 0 | 0 | -0.059 | 0 | 8.252 | 7.675 | 17.223 |
| Balanced | 1 | Nuno Alexandre Tavares Mendes | DEF | md1 | Congo DR | 1.892 | 1.75 | 1.516 | 3.143 | -0.049 | 0 | 0 | 0 | 0 | -0.059 | 0 | 8.193 | 7.62 | 17.066 |
| Balanced | 2 | Enzo Fernández | MID | md3 | Jordan | 1.929 | 2.891 | 0.867 | 0.655 | 0 | 0 | 0.428 | 0.916 | 0 | -0.205 | 0 | 7.481 | 6.957 | 16.342 |
| Balanced | 2 | Bruno Miguel Borges Fernandes | MID | md2 | Uzbekistan | 1.867 | 2.813 | 1.367 | 0.611 | 0 | 0 | 0.416 | 1.15 | 0 | -0.102 | 0 | 8.122 | 7.554 | 17.457 |
| Safe | 1 | Camilo Vargas | GK | md1 | Uzbekistan | 1.94 | 0 | 0.12 | 3.312 | -0.051 | 1.03 | 0 | 0 | 0 | -0.056 | 0 | 6.295 | 5.855 | 12.703 |
| Safe | 1 | Camilo Vargas | GK | md2 | Congo DR | 1.94 | 0 | 0.12 | 3.312 | -0.051 | 1.03 | 0 | 0 | 0 | -0.056 | 0 | 6.295 | 5.855 | 12.684 |
| Safe | 1 | Enzo Fernández | MID | md3 | Jordan | 1.929 | 2.891 | 0.867 | 0.655 | 0 | 0 | 0.428 | 0.916 | 0 | -0.205 | 0 | 7.481 | 6.957 | 16.342 |
| Safe | 2 | Emiliano Martínez | GK | md3 | Jordan | 1.94 | 0 | 0 | 3.312 | -0.051 | 0.913 | 0 | 0 | 0 | -0.064 | 0 | 6.049 | 5.626 | 12.347 |
| Safe | 2 | Unai Simón | GK | md1 | Cabo Verde | 1.908 | 0 | 0.005 | 3.199 | -0.05 | 0.8 | 0 | 0 | 0 | -0.024 | 0 | 5.838 | 5.429 | 11.957 |
| Upside | 1 | Luis Suárez | FWD | md1 | Uzbekistan | 1.479 | 3.75 | 0.575 | 0 | 0 | 0 | 0 | 0 | 0.803 | -0.139 | 0 | 6.468 | 6.015 | 14.716 |
| Upside | 1 | Luis Suárez | FWD | md2 | Congo DR | 1.479 | 3.75 | 0.541 | 0 | 0 | 0 | 0 | 0 | 0.803 | -0.139 | 0 | 6.433 | 5.983 | 14.631 |
| Upside | 1 | Petar Musa | FWD | md3 | Ghana | 1.229 | 3.515 | 0.439 | 0 | 0 | 0 | 0 | 0 | 0.506 | -0.071 | 0 | 5.618 | 5.225 | 13.014 |
| Upside | 2 | Donyell Malen | FWD | md3 | Tunisia | 1.507 | 3.75 | 0.288 | 0 | 0 | 0 | 0 | 0 | 0.221 | -0.036 | 0 | 5.73 | 5.329 | 13.333 |
| Upside | 1 | Luis Suárez | FWD | group_stage_full | Group stage average | 4.437 | 9.699 | 1.399 | 0 | 0 | 0 | 0 | 0 | 2.077 | -0.417 | 0 | 17.194 | 15.99 | 14.716 |
| Differential | 1 | Giorgian de Arrascaeta | MID | md1 | Saudi Arabia | 1.873 | 3.196 | 1.465 | 0.616 | 0 | 0 | 0.225 | 0.281 | 0 | -0.114 | 0 | 7.541 | 7.013 | 16.481 |
| Differential | 1 | Giorgian de Arrascaeta | MID | md2 | Cabo Verde | 1.873 | 3.3 | 1.638 | 0.616 | 0 | 0 | 0.225 | 0.281 | 0 | -0.114 | 0 | 7.818 | 7.271 | 17.1 |
| Differential | 2 | Hiroki Ito | DEF | md2 | Tunisia | 1.89 | 1.209 | 0.381 | 3.136 | -0.049 | 0 | 0 | 0 | 0 | 0 | 0 | 6.567 | 6.107 | 13.689 |
| Differential | 2 | Julian Ryerson | DEF | md1 | Iraq | 1.924 | 0.448 | 1.65 | 3.256 | -0.051 | 0 | 0 | 0 | 0 | -0.268 | 0 | 6.959 | 6.472 | 14.203 |
| Differential | 3 | Luis Suárez | FWD | md2 | Congo DR | 1.479 | 3.75 | 0.541 | 0 | 0 | 0 | 0 | 0 | 0.803 | -0.139 | 0 | 6.433 | 5.983 | 14.631 |
| Captain Alpha | 1 | Lionel Messi | FWD | md3 | Jordan | 1.832 | 3.75 | 1.65 | 0 | 0 | 0 | 0 | 0 | 0.95 | -0.063 | 0 | 8.119 | 7.55 | 17.928 |
| Captain Alpha | 1 | Lionel Messi | FWD | md1 | Algeria | 1.832 | 3.75 | 1.65 | 0 | 0 | 0 | 0 | 0 | 0.95 | -0.063 | 0 | 8.119 | 7.55 | 17.875 |
| Captain Alpha | 1 | Lionel Messi | FWD | md2 | Austria | 1.832 | 3.75 | 1.65 | 0 | 0 | 0 | 0 | 0 | 0.95 | -0.063 | 0 | 8.119 | 7.55 | 17.827 |
| Captain Alpha | 1 | Lionel Messi | FWD | group_stage_full | Group stage average | 5.496 | 11.25 | 4.95 | 0 | 0 | 0 | 0 | 0 | 2.85 | -0.189 | 0 | 24.357 | 22.65 | 17.928 |
| Captain Alpha | 2 | Harry Kane | FWD | md3 | Panama | 1.822 | 3.75 | 1.058 | 0 | 0 | 0 | 0 | 0 | 0.95 | -0.027 | 0 | 7.552 | 7.023 | 16.804 |

## High-Projection Defender Candidates

| Name | Country | Pos | MD | Opponent | App | Att | Ast | CS | GC | Save | Tackle | Chance | SOT | Card | Raw | Risk | Captain | Conf |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Nuno Alexandre Tavares Mendes | Portugal | DEF | md2 | Uzbekistan | 1.892 | 1.75 | 1.576 | 3.143 | -0.049 | 0 | 0 | 0 | 0 | -0.059 | 8.252 | 7.675 | 17.223 | high |
| Nuno Alexandre Tavares Mendes | Portugal | DEF | md1 | Congo DR | 1.892 | 1.75 | 1.516 | 3.143 | -0.049 | 0 | 0 | 0 | 0 | -0.059 | 8.193 | 7.62 | 17.066 | high |
| David Raum | Germany | DEF | md1 | Curaçao | 1.9 | 0.855 | 1.65 | 3.171 | -0.049 | 0 | 0 | 0 | 0 | -0.175 | 7.353 | 6.838 | 15.186 | high |
| Joshua Kimmich | Germany | DEF | md1 | Curaçao | 1.91 | 0.966 | 1.321 | 3.206 | -0.05 | 0 | 0 | 0 | 0 | -0.1 | 7.254 | 6.746 | 15.051 | high |
| Ritsu Doan | Japan | DEF | md2 | Tunisia | 1.94 | 1.32 | 0.894 | 3.312 | -0.051 | 0 | 0 | 0 | 0 | -0.161 | 7.254 | 6.746 | 15.031 | high |
| Denzel Dumfries | Netherlands | DEF | md3 | Tunisia | 1.908 | 1.75 | 0.407 | 3.199 | -0.05 | 0 | 0 | 0 | 0 | -0.113 | 7.102 | 6.605 | 15.014 | high |
| Julian Ryerson | Norway | DEF | md1 | Iraq | 1.924 | 0.448 | 1.65 | 3.256 | -0.051 | 0 | 0 | 0 | 0 | -0.268 | 6.959 | 6.472 | 14.203 | high |
| Nico O'Reilly | England | DEF | md2 | Ghana | 1.876 | 1.75 | 0.384 | 3.087 | -0.048 | 0 | 0 | 0 | 0 | -0.123 | 6.925 | 6.44 | 14.775 | high |
| Nico O'Reilly | England | DEF | md3 | Panama | 1.876 | 1.75 | 0.384 | 3.087 | -0.048 | 0 | 0 | 0 | 0 | -0.123 | 6.925 | 6.44 | 14.724 | high |
| Ronald Araujo | Uruguay | DEF | md2 | Cabo Verde | 1.914 | 1.75 | 0.224 | 3.22 | -0.05 | 0 | 0 | 0 | 0 | -0.145 | 6.914 | 6.43 | 14.702 | high |
| Ronald Araujo | Uruguay | DEF | md1 | Saudi Arabia | 1.914 | 1.75 | 0.201 | 3.22 | -0.05 | 0 | 0 | 0 | 0 | -0.145 | 6.89 | 6.408 | 14.607 | high |
| Nicolás Tagliafico | Argentina | DEF | md1 | Algeria | 1.93 | 1.362 | 0.678 | 3.277 | -0.051 | 0 | 0 | 0 | 0 | -0.417 | 6.78 | 6.305 | 14.282 | high |
| Nicolás Tagliafico | Argentina | DEF | md3 | Jordan | 1.93 | 1.362 | 0.678 | 3.277 | -0.051 | 0 | 0 | 0 | 0 | -0.417 | 6.78 | 6.305 | 14.335 | high |
| Jurriën Timber | Netherlands | DEF | md3 | Tunisia | 1.892 | 1.673 | 0.253 | 3.143 | -0.049 | 0 | 0 | 0 | 0 | -0.152 | 6.761 | 6.287 | 14.337 | high |
| Nicolás Tagliafico | Argentina | DEF | md2 | Austria | 1.93 | 1.332 | 0.663 | 3.277 | -0.051 | 0 | 0 | 0 | 0 | -0.417 | 6.734 | 6.263 | 14.134 | high |
| Achraf Hakimi | Morocco | DEF | md3 | Haiti | 1.908 | 1.538 | 0.344 | 3.199 | -0.05 | 0 | 0 | 0 | 0 | -0.272 | 6.667 | 6.2 | 14.031 | high |
| Silvan Widmer | Switzerland | DEF | md1 | Qatar | 1.908 | 1.365 | 0.387 | 3.199 | -0.05 | 0 | 0 | 0 | 0 | -0.204 | 6.606 | 6.144 | 14.001 | high |
| Hiroki Ito | Japan | DEF | md2 | Tunisia | 1.89 | 1.209 | 0.381 | 3.136 | -0.049 | 0 | 0 | 0 | 0 | 0 | 6.567 | 6.107 | 13.689 | high |
| Theo Hernández | France | DEF | md2 | Iraq | 1.884 | 1.643 | 0.141 | 3.115 | -0.048 | 0 | 0 | 0 | 0 | -0.188 | 6.547 | 6.089 | 14.019 | high |
| David Raum | Germany | DEF | md2 | Côte d'Ivoire | 1.9 | 0.816 | 1.611 | 2.512 | -0.127 | 0 | 0 | 0 | 0 | -0.175 | 6.538 | 6.08 | 13.555 | high |
| Daniel Muñoz | Colombia | DEF | md1 | Uzbekistan | 1.94 | 0.975 | 0.627 | 3.312 | -0.051 | 0 | 0 | 0 | 0 | -0.265 | 6.537 | 6.079 | 13.596 | high |
| Jules Koundé | France | DEF | md2 | Iraq | 1.892 | 0.889 | 0.805 | 3.143 | -0.049 | 0 | 0 | 0 | 0 | -0.198 | 6.482 | 6.028 | 13.558 | high |
| Daniel Muñoz | Colombia | DEF | md2 | Congo DR | 1.94 | 0.916 | 0.589 | 3.312 | -0.051 | 0 | 0 | 0 | 0 | -0.265 | 6.44 | 5.989 | 13.368 | high |
| Joshua Kimmich | Germany | DEF | md2 | Côte d'Ivoire | 1.91 | 0.922 | 1.261 | 2.54 | -0.129 | 0 | 0 | 0 | 0 | -0.1 | 6.404 | 5.956 | 13.351 | high |
| Josko Gvardiol | Croatia | DEF | md3 | Ghana | 1.882 | 1.406 | 0.161 | 3.108 | -0.048 | 0 | 0 | 0 | 0 | -0.113 | 6.396 | 5.948 | 13.527 | high |

## High-Projection Goalkeeper Candidates

| Name | Country | Pos | MD | Opponent | App | Att | Ast | CS | GC | Save | Tackle | Chance | SOT | Card | Raw | Risk | Captain | Conf |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Camilo Vargas | Colombia | GK | md1 | Uzbekistan | 1.94 | 0 | 0.12 | 3.312 | -0.051 | 1.03 | 0 | 0 | 0 | -0.056 | 6.295 | 5.855 | 12.703 | high |
| Camilo Vargas | Colombia | GK | md2 | Congo DR | 1.94 | 0 | 0.12 | 3.312 | -0.051 | 1.03 | 0 | 0 | 0 | -0.056 | 6.295 | 5.855 | 12.684 | high |
| Yahia Fofana | Côte d'Ivoire | GK | md3 | Curaçao | 1.932 | 0 | 0.12 | 3.258 | -0.053 | 1.001 | 0 | 0 | 0 | -0.067 | 6.19 | 5.757 | 12.427 | high |
| Emiliano Martínez | Argentina | GK | md1 | Algeria | 1.94 | 0 | 0 | 3.312 | -0.051 | 0.913 | 0 | 0 | 0 | -0.064 | 6.049 | 5.626 | 12.294 | high |
| Emiliano Martínez | Argentina | GK | md2 | Austria | 1.94 | 0 | 0 | 3.312 | -0.051 | 0.913 | 0 | 0 | 0 | -0.064 | 6.049 | 5.626 | 12.246 | high |
| Emiliano Martínez | Argentina | GK | md3 | Jordan | 1.94 | 0 | 0 | 3.312 | -0.051 | 0.913 | 0 | 0 | 0 | -0.064 | 6.049 | 5.626 | 12.347 | high |
| Sergio Rochet | Uruguay | GK | md1 | Saudi Arabia | 1.94 | 0 | 0 | 3.312 | -0.051 | 0.821 | 0 | 0 | 0 | -0.037 | 5.985 | 5.566 | 12.116 | high |
| Sergio Rochet | Uruguay | GK | md2 | Cabo Verde | 1.94 | 0 | 0 | 3.312 | -0.051 | 0.821 | 0 | 0 | 0 | -0.037 | 5.985 | 5.566 | 12.166 | high |
| Hernán Galíndez | Ecuador | GK | md2 | Curaçao | 1.94 | 0 | 0 | 3.312 | -0.051 | 0.733 | 0 | 0 | 0 | -0.033 | 5.901 | 5.488 | 12.012 | high |
| Unai Simón | Spain | GK | md1 | Cabo Verde | 1.908 | 0 | 0.005 | 3.199 | -0.05 | 0.8 | 0 | 0 | 0 | -0.024 | 5.838 | 5.429 | 11.957 | high |
| Unai Simón | Spain | GK | md2 | Saudi Arabia | 1.908 | 0 | 0.005 | 3.199 | -0.05 | 0.8 | 0 | 0 | 0 | -0.024 | 5.838 | 5.429 | 11.952 | high |
| Oliver Baumann | Germany | GK | md1 | Curaçao | 1.908 | 0 | 0.005 | 3.199 | -0.05 | 0.844 | 0 | 0 | 0 | -0.078 | 5.828 | 5.42 | 11.934 | high |
| Alisson Ramsés Becker | Brazil | GK | md1 | Morocco | 1.932 | 0 | 0 | 3.284 | -0.051 | 0.68 | 0 | 0 | 0 | -0.036 | 5.809 | 5.402 | 11.59 | high |
| Alisson Ramsés Becker | Brazil | GK | md2 | Haiti | 1.932 | 0 | 0 | 3.284 | -0.051 | 0.68 | 0 | 0 | 0 | -0.036 | 5.809 | 5.402 | 11.892 | high |
| Bart Verbruggen | Netherlands | GK | md3 | Tunisia | 1.908 | 0 | 0 | 3.199 | -0.05 | 0.826 | 0 | 0 | 0 | -0.078 | 5.805 | 5.399 | 11.788 | high |
| Jordan Pickford | England | GK | md2 | Ghana | 1.916 | 0 | 0 | 3.228 | -0.05 | 0.809 | 0 | 0 | 0 | -0.106 | 5.797 | 5.391 | 11.866 | high |
| Jordan Pickford | England | GK | md3 | Panama | 1.916 | 0 | 0 | 3.228 | -0.05 | 0.809 | 0 | 0 | 0 | -0.106 | 5.797 | 5.391 | 11.815 | high |
| Alisson Ramsés Becker | Brazil | GK | md3 | Scotland | 1.932 | 0 | 0 | 3.251 | -0.054 | 0.68 | 0 | 0 | 0 | -0.036 | 5.773 | 5.369 | 11.671 | high |
| Gregor Kobel | Switzerland | GK | md1 | Qatar | 1.908 | 0 | 0 | 3.199 | -0.05 | 0.775 | 0 | 0 | 0 | -0.078 | 5.754 | 5.351 | 11.785 | high |
| Hernán Galíndez | Ecuador | GK | md1 | Côte d'Ivoire | 1.94 | 0 | 0 | 3.163 | -0.065 | 0.733 | 0 | 0 | 0 | -0.033 | 5.738 | 5.337 | 11.431 | high |
| Keisuke Osako | Japan | GK | md2 | Tunisia | 1.884 | 0 | 0 | 3.115 | -0.048 | 0.716 | 0 | 0 | 0 | 0 | 5.666 | 5.27 | 11.451 | high |
| Édouard Mendy | Senegal | GK | md3 | Iraq | 1.932 | 0 | 0 | 3.284 | -0.051 | 0.537 | 0 | 0 | 0 | -0.07 | 5.632 | 5.238 | 11.442 | high |
| Thibaut Courtois | Belgium | GK | md3 | New Zealand | 1.892 | 0 | 0 | 3.143 | -0.049 | 0.636 | 0 | 0 | 0 | -0.027 | 5.595 | 5.203 | 11.388 | high |
| Dominik Livakovic | Croatia | GK | md3 | Ghana | 1.896 | 0 | 0 | 3.157 | -0.049 | 0.584 | 0 | 0 | 0 | 0 | 5.588 | 5.197 | 11.375 | high |
| Alexander Schlager | Austria | GK | md1 | Jordan | 1.9 | 0 | 0 | 3.108 | -0.055 | 0.729 | 0 | 0 | 0 | -0.114 | 5.569 | 5.179 | 11.332 | high |

## Low-Confidence Candidates

No low-confidence candidates appear in top-25 candidate lists after calibration.

## Brazil Uncertainty And Neymar Exclusion

Brazil uncertainty candidate rows: 14.

| Rank | Name | Country | Pos | Scope | Opponent | Score | Tier | Raw | Risk | Captain | Value | Alpha | Portfolio | Downside | Start | Min | Conf |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 19 | Raphael Dias Belloli | Brazil | MID | group_stage_full | Group stage average | 71.612 | strong_candidate | 24.93 | 23.187 | 18.544 | 2.828 | 72.2 | 83.9 | 28.9 | 0.95 | 70.8 | high |
| 24 | Raphael Dias Belloli | Brazil | MID | group_stage_full | Group stage average | 47.366 | risky_candidate | 24.93 | 23.187 | 18.544 | 2.828 | 72.2 | 83.9 | 28.9 | 0.95 | 70.8 | high |
| 10 | Raphael Dias Belloli | Brazil | MID | group_stage_full | Group stage average | 70.65 | strong_candidate | 24.93 | 23.187 | 18.544 | 2.828 | 72.2 | 83.9 | 28.9 | 0.95 | 70.8 | high |
| 19 | Raphael Dias Belloli | Brazil | MID | group_stage_full | Group stage average | 73.392 | strong_candidate | 24.93 | 23.187 | 18.544 | 2.828 | 72.2 | 83.9 | 28.9 | 0.95 | 70.8 | high |
| 13 | Raphael Dias Belloli | Brazil | MID | md2 | Haiti | 75.985 | strong_candidate | 8.555 | 7.957 | 18.544 | 0.97 | 72.2 | 83.9 | 28.9 | 0.95 | 70.8 | high |
| 6 | Alisson Ramsés Becker | Brazil | GK | md2 | Haiti | 87.437 | top_pick_candidate | 5.809 | 5.402 | 11.892 | 1.08 | 56 | 86.6 | 13.7 | 0.932 | 82 | high |
| 20 | Bruno Guimarães Rodriguez Moura | Brazil | MID | md2 | Haiti | 86.032 | top_pick_candidate | 6.247 | 5.81 | 13.497 | 0.854 | 45.9 | 82.2 | 19.4 | 0.95 | 70.8 | high |
| 20 | Bruno Guimarães Rodriguez Moura | Brazil | MID | md2 | Haiti | 55.339 | watchlist_candidate | 6.247 | 5.81 | 13.497 | 0.854 | 45.9 | 82.2 | 19.4 | 0.95 | 70.8 | high |
| 21 | Raphael Dias Belloli | Brazil | MID | md2 | Haiti | 54.343 | watchlist_candidate | 8.555 | 7.957 | 18.544 | 0.97 | 72.2 | 83.9 | 28.9 | 0.95 | 70.8 | high |
| 4 | Raphael Dias Belloli | Brazil | MID | md2 | Haiti | 75.764 | strong_candidate | 8.555 | 7.957 | 18.544 | 0.97 | 72.2 | 83.9 | 28.9 | 0.95 | 70.8 | high |
| 17 | Raphael Dias Belloli | Brazil | MID | md2 | Haiti | 77.765 | strong_candidate | 8.555 | 7.957 | 18.544 | 0.97 | 72.2 | 83.9 | 28.9 | 0.95 | 70.8 | high |
| 22 | Raphael Dias Belloli | Brazil | MID | md3 | Scotland | 72.849 | strong_candidate | 8.294 | 7.714 | 17.898 | 0.941 | 72.2 | 83.9 | 28.9 | 0.95 | 70.8 | high |
| 5 | Raphael Dias Belloli | Brazil | MID | md3 | Scotland | 73.767 | strong_candidate | 8.294 | 7.714 | 17.898 | 0.941 | 72.2 | 83.9 | 28.9 | 0.95 | 70.8 | high |
| 15 | Raphael Dias Belloli | Brazil | MID | md3 | Scotland | 74.084 | strong_candidate | 8.294 | 7.714 | 17.898 | 0.941 | 72.2 | 83.9 | 28.9 | 0.95 | 70.8 | high |

Neymar projection rows remain present but excluded from recommendation candidate lists:

| Name | Country | Pos | MD | Opponent | App | Att | Ast | CS | GC | Save | Tackle | Chance | SOT | Card | Raw | Risk | Captain | Conf |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Neymar da Silva Santos Júnior | Brazil | MID | md1 | Morocco | 0.68 | 0.139 | 0.077 | 0.005 | 0 | 0 | 0.025 | 0.031 | 0 | -0.037 | 0.92 | 0.562 | 1.958 | low |
| Neymar da Silva Santos Júnior | Brazil | MID | md2 | Haiti | 0.68 | 0.2 | 0.112 | 0.005 | 0 | 0 | 0.025 | 0.032 | 0 | -0.037 | 1.017 | 0.632 | 2.436 | low |
| Neymar da Silva Santos Júnior | Brazil | MID | md3 | Scotland | 0.68 | 0.167 | 0.093 | 0.005 | 0 | 0 | 0.025 | 0.032 | 0 | -0.037 | 0.965 | 0.595 | 2.187 | low |

## Focus Player Audit

### Nuno Mendes

| Mode | Rank | Name | Pos | Scope | Opponent | App | Att | Ast | CS | GC | Save | Tackle | Chance | SOT | Card | Bonus | Raw | Risk | Captain |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Safe | 11 | Nuno Alexandre Tavares Mendes | DEF | md2 | Uzbekistan | 1.892 | 1.75 | 1.576 | 3.143 | -0.049 | 0 | 0 | 0 | 0 | -0.059 | 0 | 8.252 | 7.675 | 17.223 |
| Safe | 15 | Nuno Alexandre Tavares Mendes | DEF | md1 | Congo DR | 1.892 | 1.75 | 1.516 | 3.143 | -0.049 | 0 | 0 | 0 | 0 | -0.059 | 0 | 8.193 | 7.62 | 17.066 |
| Safe | 22 | Nuno Alexandre Tavares Mendes | DEF | group_stage_full | Group stage average | 5.676 | 4.907 | 3.893 | 7.84 | -0.457 | 0 | 0 | 0 | 0 | -0.177 | 0 | 21.68 | 20.164 | 17.223 |
| Balanced | 1 | Nuno Alexandre Tavares Mendes | DEF | md2 | Uzbekistan | 1.892 | 1.75 | 1.576 | 3.143 | -0.049 | 0 | 0 | 0 | 0 | -0.059 | 0 | 8.252 | 7.675 | 17.223 |
| Balanced | 1 | Nuno Alexandre Tavares Mendes | DEF | md1 | Congo DR | 1.892 | 1.75 | 1.516 | 3.143 | -0.049 | 0 | 0 | 0 | 0 | -0.059 | 0 | 8.193 | 7.62 | 17.066 |
| Balanced | 4 | Nuno Alexandre Tavares Mendes | DEF | group_stage_full | Group stage average | 5.676 | 4.907 | 3.893 | 7.84 | -0.457 | 0 | 0 | 0 | 0 | -0.177 | 0 | 21.68 | 20.164 | 17.223 |
| Captain Alpha | 21 | Nuno Alexandre Tavares Mendes | DEF | md2 | Uzbekistan | 1.892 | 1.75 | 1.576 | 3.143 | -0.049 | 0 | 0 | 0 | 0 | -0.059 | 0 | 8.252 | 7.675 | 17.223 |
| Captain Alpha | 18 | Nuno Alexandre Tavares Mendes | DEF | md1 | Congo DR | 1.892 | 1.75 | 1.516 | 3.143 | -0.049 | 0 | 0 | 0 | 0 | -0.059 | 0 | 8.193 | 7.62 | 17.066 |
| Captain Alpha | 22 | Nuno Alexandre Tavares Mendes | DEF | group_stage_full | Group stage average | 5.676 | 4.907 | 3.893 | 7.84 | -0.457 | 0 | 0 | 0 | 0 | -0.177 | 0 | 21.68 | 20.164 | 17.223 |
| Differential | 21 | Nuno Alexandre Tavares Mendes | DEF | md2 | Uzbekistan | 1.892 | 1.75 | 1.576 | 3.143 | -0.049 | 0 | 0 | 0 | 0 | -0.059 | 0 | 8.252 | 7.675 | 17.223 |

### Camilo Vargas

| Mode | Rank | Name | Pos | Scope | Opponent | App | Att | Ast | CS | GC | Save | Tackle | Chance | SOT | Card | Bonus | Raw | Risk | Captain |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Safe | 1 | Camilo Vargas | GK | md1 | Uzbekistan | 1.94 | 0 | 0.12 | 3.312 | -0.051 | 1.03 | 0 | 0 | 0 | -0.056 | 0 | 6.295 | 5.855 | 12.703 |
| Safe | 1 | Camilo Vargas | GK | md2 | Congo DR | 1.94 | 0 | 0.12 | 3.312 | -0.051 | 1.03 | 0 | 0 | 0 | -0.056 | 0 | 6.295 | 5.855 | 12.684 |
| Safe | 2 | Camilo Vargas | GK | group_stage_full | Group stage average | 5.82 | 0 | 0.306 | 8.064 | -0.562 | 3.09 | 0 | 0 | 0 | -0.168 | 0 | 16.551 | 15.394 | 12.703 |
| Balanced | 13 | Camilo Vargas | GK | md1 | Uzbekistan | 1.94 | 0 | 0.12 | 3.312 | -0.051 | 1.03 | 0 | 0 | 0 | -0.056 | 0 | 6.295 | 5.855 | 12.703 |
| Balanced | 10 | Camilo Vargas | GK | md2 | Congo DR | 1.94 | 0 | 0.12 | 3.312 | -0.051 | 1.03 | 0 | 0 | 0 | -0.056 | 0 | 6.295 | 5.855 | 12.684 |
| Balanced | 14 | Camilo Vargas | GK | group_stage_full | Group stage average | 5.82 | 0 | 0.306 | 8.064 | -0.562 | 3.09 | 0 | 0 | 0 | -0.168 | 0 | 16.551 | 15.394 | 12.703 |

### Nicolás Tagliafico

| Mode | Rank | Name | Pos | Scope | Opponent | App | Att | Ast | CS | GC | Save | Tackle | Chance | SOT | Card | Bonus | Raw | Risk | Captain |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Safe | 15 | Nicolás Tagliafico | DEF | md3 | Jordan | 1.93 | 1.362 | 0.678 | 3.277 | -0.051 | 0 | 0 | 0 | 0 | -0.417 | 0 | 6.78 | 6.305 | 14.335 |
| Safe | 10 | Nicolás Tagliafico | DEF | group_stage_full | Group stage average | 5.79 | 4.056 | 2.019 | 9.831 | -0.153 | 0 | 0 | 0 | 0 | -1.251 | 0 | 20.294 | 18.873 | 14.335 |
| Balanced | 3 | Nicolás Tagliafico | DEF | md3 | Jordan | 1.93 | 1.362 | 0.678 | 3.277 | -0.051 | 0 | 0 | 0 | 0 | -0.417 | 0 | 6.78 | 6.305 | 14.335 |
| Balanced | 6 | Nicolás Tagliafico | DEF | md1 | Algeria | 1.93 | 1.362 | 0.678 | 3.277 | -0.051 | 0 | 0 | 0 | 0 | -0.417 | 0 | 6.78 | 6.305 | 14.282 |
| Balanced | 3 | Nicolás Tagliafico | DEF | group_stage_full | Group stage average | 5.79 | 4.056 | 2.019 | 9.831 | -0.153 | 0 | 0 | 0 | 0 | -1.251 | 0 | 20.294 | 18.873 | 14.335 |
| Balanced | 5 | Nicolás Tagliafico | DEF | md2 | Austria | 1.93 | 1.332 | 0.663 | 3.277 | -0.051 | 0 | 0 | 0 | 0 | -0.417 | 0 | 6.734 | 6.263 | 14.134 |
| Differential | 6 | Nicolás Tagliafico | DEF | md1 | Algeria | 1.93 | 1.362 | 0.678 | 3.277 | -0.051 | 0 | 0 | 0 | 0 | -0.417 | 0 | 6.78 | 6.305 | 14.282 |
| Differential | 16 | Nicolás Tagliafico | DEF | md2 | Austria | 1.93 | 1.332 | 0.663 | 3.277 | -0.051 | 0 | 0 | 0 | 0 | -0.417 | 0 | 6.734 | 6.263 | 14.134 |
| Captain Alpha | 24 | Nicolás Tagliafico | DEF | md3 | Jordan | 1.93 | 1.362 | 0.678 | 3.277 | -0.051 | 0 | 0 | 0 | 0 | -0.417 | 0 | 6.78 | 6.305 | 14.335 |
| Differential | 13 | Nicolás Tagliafico | DEF | md3 | Jordan | 1.93 | 1.362 | 0.678 | 3.277 | -0.051 | 0 | 0 | 0 | 0 | -0.417 | 0 | 6.78 | 6.305 | 14.335 |

### Luis Suárez

| Mode | Rank | Name | Pos | Scope | Opponent | App | Att | Ast | CS | GC | Save | Tackle | Chance | SOT | Card | Bonus | Raw | Risk | Captain |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Differential | 3 | Luis Suárez | FWD | md2 | Congo DR | 1.479 | 3.75 | 0.541 | 0 | 0 | 0 | 0 | 0 | 0.803 | -0.139 | 0 | 6.433 | 5.983 | 14.631 |
| Differential | 3 | Luis Suárez | FWD | md1 | Uzbekistan | 1.479 | 3.75 | 0.575 | 0 | 0 | 0 | 0 | 0 | 0.803 | -0.139 | 0 | 6.468 | 6.015 | 14.716 |
| Differential | 3 | Luis Suárez | FWD | group_stage_full | Group stage average | 4.437 | 9.699 | 1.399 | 0 | 0 | 0 | 0 | 0 | 2.077 | -0.417 | 0 | 17.194 | 15.99 | 14.716 |
| Upside | 1 | Luis Suárez | FWD | md1 | Uzbekistan | 1.479 | 3.75 | 0.575 | 0 | 0 | 0 | 0 | 0 | 0.803 | -0.139 | 0 | 6.468 | 6.015 | 14.716 |
| Upside | 1 | Luis Suárez | FWD | md2 | Congo DR | 1.479 | 3.75 | 0.541 | 0 | 0 | 0 | 0 | 0 | 0.803 | -0.139 | 0 | 6.433 | 5.983 | 14.631 |
| Upside | 1 | Luis Suárez | FWD | group_stage_full | Group stage average | 4.437 | 9.699 | 1.399 | 0 | 0 | 0 | 0 | 0 | 2.077 | -0.417 | 0 | 17.194 | 15.99 | 14.716 |
| Differential | 20 | Luis Suárez | FWD | md3 | Portugal | 1.479 | 2.199 | 0.283 | 0 | 0 | 0 | 0 | 0 | 0.471 | -0.139 | 0 | 4.293 | 3.992 | 9.41 |
| Upside | 13 | Luis Suárez | FWD | md3 | Portugal | 1.479 | 2.199 | 0.283 | 0 | 0 | 0 | 0 | 0 | 0.471 | -0.139 | 0 | 4.293 | 3.992 | 9.41 |

### Lionel Messi

| Mode | Rank | Name | Pos | Scope | Opponent | App | Att | Ast | CS | GC | Save | Tackle | Chance | SOT | Card | Bonus | Raw | Risk | Captain |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Captain Alpha | 1 | Lionel Messi | FWD | md3 | Jordan | 1.832 | 3.75 | 1.65 | 0 | 0 | 0 | 0 | 0 | 0.95 | -0.063 | 0 | 8.119 | 7.55 | 17.928 |
| Captain Alpha | 1 | Lionel Messi | FWD | md1 | Algeria | 1.832 | 3.75 | 1.65 | 0 | 0 | 0 | 0 | 0 | 0.95 | -0.063 | 0 | 8.119 | 7.55 | 17.875 |
| Captain Alpha | 1 | Lionel Messi | FWD | md2 | Austria | 1.832 | 3.75 | 1.65 | 0 | 0 | 0 | 0 | 0 | 0.95 | -0.063 | 0 | 8.119 | 7.55 | 17.827 |
| Captain Alpha | 1 | Lionel Messi | FWD | group_stage_full | Group stage average | 5.496 | 11.25 | 4.95 | 0 | 0 | 0 | 0 | 0 | 2.85 | -0.189 | 0 | 24.357 | 22.65 | 17.928 |
| Safe | 4 | Lionel Messi | FWD | md3 | Jordan | 1.832 | 3.75 | 1.65 | 0 | 0 | 0 | 0 | 0 | 0.95 | -0.063 | 0 | 8.119 | 7.55 | 17.928 |
| Safe | 12 | Lionel Messi | FWD | md1 | Algeria | 1.832 | 3.75 | 1.65 | 0 | 0 | 0 | 0 | 0 | 0.95 | -0.063 | 0 | 8.119 | 7.55 | 17.875 |
| Safe | 10 | Lionel Messi | FWD | md2 | Austria | 1.832 | 3.75 | 1.65 | 0 | 0 | 0 | 0 | 0 | 0.95 | -0.063 | 0 | 8.119 | 7.55 | 17.827 |
| Safe | 6 | Lionel Messi | FWD | group_stage_full | Group stage average | 5.496 | 11.25 | 4.95 | 0 | 0 | 0 | 0 | 0 | 2.85 | -0.189 | 0 | 24.357 | 22.65 | 17.928 |
| Balanced | 1 | Lionel Messi | FWD | md3 | Jordan | 1.832 | 3.75 | 1.65 | 0 | 0 | 0 | 0 | 0 | 0.95 | -0.063 | 0 | 8.119 | 7.55 | 17.928 |
| Balanced | 2 | Lionel Messi | FWD | md1 | Algeria | 1.832 | 3.75 | 1.65 | 0 | 0 | 0 | 0 | 0 | 0.95 | -0.063 | 0 | 8.119 | 7.55 | 17.875 |

## V3 vs V2 Differences

- V2 unique top-pool players: 195.
- V3 unique top-pool players: 111.
- Overlapping players: 64.
- Newly appearing in v3: 47.
- Disappearing from v2: 131.
- Average list-level v2/v3 overlap rate: 0.316.

### Players Appearing In Both

| Name | Country | Pos | Mode/Source | Scope | Score |
| --- | --- | --- | --- | --- | --- |
| Lionel Messi | Argentina | FWD | balanced | group_stage_full | 80.222 |
| Enzo Fernández | Argentina | MID | balanced | group_stage_full | 79.116 |
| Nicolás Tagliafico | Argentina | DEF | balanced | group_stage_full | 78.675 |
| Bruno Miguel Borges Fernandes | Portugal | MID | balanced | group_stage_full | 77.256 |
| Harry Kane | England | FWD | balanced | group_stage_full | 75.792 |
| Nico O'Reilly | England | DEF | balanced | group_stage_full | 74.586 |
| Lamine Yamal Nasraoui Ebana | Spain | MID | balanced | group_stage_full | 74.144 |
| Emiliano Martínez | Argentina | GK | balanced | group_stage_full | 73.754 |
| Kylian Mbappé | France | FWD | balanced | group_stage_full | 73.608 |
| Luis Díaz | Colombia | MID | balanced | group_stage_full | 73.583 |
| Nahuel Molina | Argentina | DEF | balanced | group_stage_full | 72.991 |
| Camilo Vargas | Colombia | GK | balanced | group_stage_full | 72.918 |
| David Raum | Germany | DEF | balanced | group_stage_full | 72.53 |
| Nicolás Otamendi | Argentina | DEF | balanced | group_stage_full | 72.516 |
| Daniel Muñoz | Colombia | DEF | balanced | group_stage_full | 72.286 |
| Cristiano Ronaldo dos Santos Aveiro | Portugal | FWD | balanced | group_stage_full | 71.825 |
| Raphael Dias Belloli | Brazil | MID | balanced | group_stage_full | 71.612 |
| Michael Olise | France | MID | balanced | group_stage_full | 71.54 |
| Mikel Oyarzabal | Spain | FWD | balanced | group_stage_full | 71.347 |
| Cristian Romero | Argentina | DEF | balanced | group_stage_full | 71.304 |
| Denzel Dumfries | Netherlands | DEF | balanced | group_stage_full | 71.034 |
| Ayase Ueda | Japan | FWD | balanced | group_stage_full | 70.778 |
| Lautaro Martínez | Argentina | FWD | balanced | group_stage_full | 70.775 |
| Jordan Pickford | England | GK | safe | group_stage_full | 85.465 |
| Unai Simón | Spain | GK | safe | group_stage_full | 85.455 |
| Diogo Meireles da Costa | Portugal | GK | safe | group_stage_full | 85.213 |
| Thibaut Courtois | Belgium | GK | safe | group_stage_full | 85.083 |
| Florian Wirtz | Germany | MID | safe | group_stage_full | 84.983 |
| Ezri Konsa | England | DEF | safe | group_stage_full | 84.933 |
| Virgil van Dijk | Netherlands | DEF | safe | group_stage_full | 84.868 |

### Newly Appearing In V3

| Name | Country | Pos | Mode/Source | Scope | Score |
| --- | --- | --- | --- | --- | --- |
| Nuno Alexandre Tavares Mendes | Portugal | DEF | balanced | group_stage_full | 78.002 |
| Silvan Widmer | Switzerland | DEF | balanced | group_stage_full | 73.324 |
| Declan Rice | England | MID | safe | group_stage_full | 84.93 |
| Alexis Mac Allister | Argentina | MID | safe | group_stage_full | 84.133 |
| Julián Alvarez | Argentina | FWD | safe | group_stage_full | 83.819 |
| Romelu Lukaku | Belgium | FWD | upside | group_stage_full | 63.043 |
| Kevin Rodríguez | Ecuador | FWD | upside | group_stage_full | 58.014 |
| Mikel Merino | Spain | MID | upside | group_stage_full | 55.064 |
| Nico González | Argentina | MID | upside | group_stage_full | 54.468 |
| Ivan Perisic | Croatia | FWD | upside | group_stage_full | 53.776 |
| Charles De Ketelaere | Belgium | MID | upside | group_stage_full | 52.073 |
| Hiroki Ito | Japan | DEF | differential | group_stage_full | 73.54 |
| Johan Mojica | Colombia | DEF | differential | group_stage_full | 73.367 |
| Santiago Arias | Colombia | DEF | differential | group_stage_full | 72.103 |
| Santiago Mele | Uruguay | GK | differential | group_stage_full | 65.315 |
| Enner Valencia | Ecuador | FWD | differential | group_stage_full | 62.069 |
| Jude Bellingham | England | MID | captain | group_stage_full | 74.143 |
| Kevin De Bruyne | Belgium | MID | captain | group_stage_full | 73.566 |
| Marc Cucurella | Spain | DEF | balanced | md1 | 74.96 |
| Jhon Lucumí | Colombia | DEF | safe | md1 | 86.596 |
| Martín Zubimendi | Spain | MID | safe | md1 | 85.906 |
| Michael Gregoritsch | Austria | FWD | upside | md1 | 59.64 |
| Alexander Sørloth | Norway | FWD | upside | md1 | 58.765 |
| Ismael Díaz | Panama | FWD | upside | md1 | 56.797 |
| Jamal Musiala | Germany | MID | upside | md1 | 51.782 |
| Richard Ríos | Colombia | MID | upside | md1 | 51.772 |
| Romano Schmid | Austria | MID | differential | md1 | 66.157 |
| Mathías Olivera | Uruguay | DEF | differential | md1 | 62.506 |
| Breel Embolo | Switzerland | FWD | captain | md1 | 72.201 |
| Ritsu Doan | Japan | DEF | balanced | md2 | 73.926 |

### Disappearing From V2

| Name | Country | Pos | Mode/Source | Scope | Score |
| --- | --- | --- | --- | --- | --- |
| Ivan Toney | England | FWD | v2 |  |  |
| Christian Fassnacht | Switzerland | MID | v2 |  |  |
| Moisés Ramírez | Ecuador | GK | v2 |  |  |
| Alban Lafont | Côte d'Ivoire | GK | v2 |  |  |
| Vinicius Junior | Brazil | FWD | v2 |  |  |
| Marvin Keller | Switzerland | GK | v2 |  |  |
| Keisuke Osako | Japan | GK | v2 |  |  |
| Ugurcan Cakir | Türkiye | GK | v2 |  |  |
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
| Ederson | Brazil | GK | v2 |  |  |
| Alex Sandro | Brazil | DEF | v2 |  |  |
| Wesley | Brazil | DEF | v2 |  |  |
| Weverton | Brazil | GK | v2 |  |  |
| Marquinhos | Brazil | DEF | v2 |  |  |
| Ibanez | Brazil | DEF | v2 |  |  |
| Danilo | Brazil | DEF | v2 |  |  |
| Facundo Medina | Argentina | DEF | v2 |  |  |
| Leonardo Balerdi | Argentina | DEF | v2 |  |  |
| Douglas Santos | Brazil | DEF | v2 |  |  |
| Bremer | Brazil | DEF | v2 |  |  |
| Lisandro Martinez | Argentina | DEF | v2 |  |  |

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
