# Recommendation Calibration Audit Fantasy Pool v3

Generated: 2026-06-02T18:41:18.502Z

Model stage: fantasy_pool_only. This audit does not promote recommendations, does not update active v2 recommendations, does not update browser-ready files, and does not make Team Builder, captain/substitution, or UX changes.

## Executive Summary

- Candidate rows after calibration: 500.
- QA status: pass_with_staging_stop_conditions.
- Low-confidence top-list candidates: 0.
- Thin-profile top-list candidates: 0.
- True missing-usage top-list candidates: 0.
- Brazil uncertainty candidate rows: 19.
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
- Kept all outputs fantasy_pool_only and staged; active v2 recommendation files and browser-ready files are not written.

Projection-generation coverage was improved in this session. The staged v3 projection layer now emits separate capped components for official MID tackle points, MID chance-created points, and FWD shots-on-target points. Source-backed player rates are used where available; otherwise small conservative position priors are dampened and flagged. These additions improve MID/FWD representation without promoting the model or treating priors as final player event rates.

## Original Calibration Before And After Mode Winners

Baseline note: Baseline from the first uncalibrated fantasyPool_v3 recommendation output generated on 2026-06-02.

| Mode | Before winner | Before pos | After winner | After pos | After score |
| --- | --- | --- | --- | --- | --- |
| Balanced | Nuno Alexandre Tavares Mendes (md2) | DEF | Nuno Alexandre Tavares Mendes (md2) | DEF | 86.341 |
| Safe | Camilo Vargas (md1) | GK | Nuno Alexandre Tavares Mendes (md2) | DEF | 87.657 |
| Upside | Lionel Messi (md3) | FWD | Lionel Messi (md3) | FWD | 92.325 |
| Differential | Nicolás Tagliafico (md3) | DEF | Giorgian de Arrascaeta (md1) | MID | 77.668 |
| Captain Alpha | Nuno Alexandre Tavares Mendes (md2) | DEF | Lionel Messi (md3) | FWD | 96.249 |

## Original Calibration Before And After Position Distribution

| Position | Before rows | After rows |
| --- | --- | --- |
| GK | 79 | 40 |
| DEF | 300 | 147 |
| MID | 64 | 155 |
| FWD | 57 | 158 |

## Scoring-Coverage Pass Before And After Mode Winners

| Mode | Before coverage winner | Before pos | After coverage winner | After pos | After score |
| --- | --- | --- | --- | --- | --- |
| Balanced | Nuno Alexandre Tavares Mendes (md2) | DEF | Nuno Alexandre Tavares Mendes (md2) | DEF | 86.341 |
| Safe | Nuno Alexandre Tavares Mendes (md2) | DEF | Nuno Alexandre Tavares Mendes (md2) | DEF | 87.657 |
| Upside | Lionel Messi (md3) | FWD | Lionel Messi (md3) | FWD | 92.325 |
| Differential | Giorgian de Arrascaeta (md1) | MID | Giorgian de Arrascaeta (md1) | MID | 77.668 |
| Captain Alpha | Lionel Messi (md3) | FWD | Lionel Messi (md3) | FWD | 96.249 |

## Scoring-Coverage Pass Before And After Position Distribution

| Position | Before coverage rows | After coverage rows |
| --- | --- | --- |
| GK | 40 | 40 |
| DEF | 147 | 147 |
| MID | 155 | 155 |
| FWD | 158 | 158 |

## Position-Balance Safeguards

| Scope | Mode | Top candidate | GK | DEF | MID | FWD | Warning |
| --- | --- | --- | --- | --- | --- | --- | --- |
| group_stage_full | balanced | Lionel Messi | 2 | 10 | 8 | 5 | none |
| group_stage_full | safe | Bruno Miguel Borges Fernandes | 5 | 10 | 4 | 6 | none |
| group_stage_full | upside | Lionel Messi | 0 | 5 | 10 | 10 | none |
| group_stage_full | differential | Charles De Ketelaere | 2 | 8 | 7 | 8 | none |
| group_stage_full | captain | Lionel Messi | 0 | 3 | 10 | 12 | none |
| md1 | balanced | Nuno Alexandre Tavares Mendes | 4 | 10 | 7 | 4 | none |
| md1 | safe | Nuno Alexandre Tavares Mendes | 6 | 10 | 4 | 5 | none |
| md1 | upside | Lionel Messi | 0 | 5 | 10 | 10 | none |
| md1 | differential | Giorgian de Arrascaeta | 2 | 9 | 7 | 7 | none |
| md1 | captain | Lionel Messi | 0 | 3 | 10 | 12 | none |
| md2 | balanced | Nuno Alexandre Tavares Mendes | 2 | 10 | 9 | 4 | none |
| md2 | safe | Nuno Alexandre Tavares Mendes | 6 | 10 | 5 | 4 | none |
| md2 | upside | Lionel Messi | 0 | 5 | 10 | 10 | none |
| md2 | differential | Hiroki Ito | 3 | 9 | 6 | 7 | none |
| md2 | captain | Lionel Messi | 0 | 3 | 10 | 12 | none |
| md3 | balanced | Lionel Messi | 2 | 10 | 7 | 6 | none |
| md3 | safe | Lionel Messi | 6 | 10 | 4 | 5 | none |
| md3 | upside | Lionel Messi | 0 | 5 | 10 | 10 | none |
| md3 | differential | Nicolas Jackson | 0 | 9 | 7 | 9 | none |
| md3 | captain | Lionel Messi | 0 | 3 | 10 | 12 | none |

## Does The Top Of Each Mode Make Sense?

- Nuno Mendes as Balanced and Safe: still plausible as a staged candidate because his source-backed fullback attacking/assist rates combine with Portugal's favorable clean-sheet fixtures and DEF clean-sheet scoring. The calibration keeps him eligible but prevents defender-only pools.
- Nuno Mendes as Captain Alpha: corrected at the recommendation layer. Defender captain outcomes can be strong under official scoring, but Captain Alpha now applies attacker preference and DEF/GK dampening so clean-sheet upside does not dominate captain review.
- Nuno Mendes as Differential: corrected at the mode-separation layer. His old Differential rank was a mode-weight/obviousness issue, not a projection bug; he remains excellent in Balanced/Safe but is penalized away from Differential because he is already top in both modes.
- Camilo Vargas in Safe mode: goalkeeper appearance/minutes security, clean-sheet probability, and save points create a stable floor, but Safe mode now caps GK exposure so it is not a goalkeeper list.
- Giorgian de Arrascaeta as Differential: plausible after the finance pass because he combines positive value over replacement, scarcity-adjusted value, efficient-frontier status, high confidence, acceptable starts/minutes, and only limited Balanced/Captain obviousness.
- Luis Suárez as Differential: still a defensible lower-obviousness candidate in some rows, but the finance pass no longer forces him to win the mode when stronger value-over-replacement/frontier candidates exist.
- Nicolás Tagliafico as a Differential candidate: still plausible as a value-looking staged candidate, but mode-separation penalties now stop high-overall defensive candidates from repeating the Balanced list.
- Lionel Messi as Upside and Captain Alpha: plausible and expected. Upside/Captain Alpha now better reward elite attackers and attacking mids while keeping minutes and confidence safeguards.

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

Position distribution: {"DEF":14,"MID":7,"FWD":4}

| Rank | Name | Country | Pos | Scope | Opponent | Score | Tier | Raw | Risk | Captain | Value | Start | Min | Conf |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Nuno Alexandre Tavares Mendes | Portugal | DEF | md2 | Uzbekistan | 86.341 | top_pick_candidate | 8.252 | 7.675 | 17.223 | 1.323 | 0.892 | 74.2 | high |
| 1 | Nuno Alexandre Tavares Mendes | Portugal | DEF | md1 | Congo DR | 85.983 | top_pick_candidate | 8.193 | 7.62 | 17.066 | 1.314 | 0.892 | 74.2 | high |
| 2 | Bruno Miguel Borges Fernandes | Portugal | MID | md2 | Uzbekistan | 84.75 | top_pick_candidate | 8.122 | 7.554 | 17.457 | 0.889 | 0.92 | 68.9 | high |
| 1 | Lionel Messi | Argentina | FWD | md3 | Jordan | 83.835 | top_pick_candidate | 8.119 | 7.55 | 17.928 | 0.755 | 0.95 | 65.3 | high |
| 2 | Bruno Miguel Borges Fernandes | Portugal | MID | md1 | Congo DR | 83.591 | top_pick_candidate | 7.965 | 7.408 | 17.068 | 0.872 | 0.92 | 68.9 | high |
| 2 | Enzo Fernández | Argentina | MID | md3 | Jordan | 83.52 | top_pick_candidate | 7.481 | 6.957 | 16.342 | 0.928 | 0.95 | 70.8 | high |
| 3 | Nicolás Tagliafico | Argentina | DEF | md3 | Jordan | 82.55 | top_pick_candidate | 6.78 | 6.305 | 14.335 | 1.466 | 0.93 | 77 | high |
| 3 | David Raum | Germany | DEF | md1 | Curaçao | 81.992 | top_pick_candidate | 7.353 | 6.838 | 15.186 | 1.396 | 0.9 | 74.8 | high |
| 4 | Julian Ryerson | Norway | DEF | md1 | Iraq | 81.808 | top_pick_candidate | 6.959 | 6.472 | 14.203 | 1.541 | 0.924 | 76.5 | high |
| 5 | Lionel Messi | Argentina | FWD | md1 | Algeria | 81.549 | top_pick_candidate | 8.119 | 7.55 | 17.875 | 0.755 | 0.95 | 65.3 | high |
| 3 | Lionel Messi | Argentina | FWD | md2 | Austria | 81.346 | top_pick_candidate | 8.119 | 7.55 | 17.827 | 0.755 | 0.95 | 65.3 | high |
| 6 | Enzo Fernández | Argentina | MID | md1 | Algeria | 81.236 | top_pick_candidate | 7.481 | 6.957 | 16.289 | 0.928 | 0.95 | 70.8 | high |
| 7 | Nicolás Tagliafico | Argentina | DEF | md1 | Algeria | 80.78 | top_pick_candidate | 6.78 | 6.305 | 14.282 | 1.466 | 0.93 | 77 | high |
| 8 | Daniel Muñoz | Colombia | DEF | md1 | Uzbekistan | 80.724 | top_pick_candidate | 6.537 | 6.079 | 13.596 | 1.322 | 0.94 | 77.7 | high |
| 4 | Enzo Fernández | Argentina | MID | md2 | Austria | 80.588 | top_pick_candidate | 7.396 | 6.878 | 16.052 | 0.917 | 0.95 | 70.8 | high |
| 9 | Joshua Kimmich | Germany | DEF | md1 | Curaçao | 80.57 | top_pick_candidate | 7.254 | 6.746 | 15.051 | 1.227 | 0.91 | 75.5 | high |
| 1 | Lionel Messi | Argentina | FWD | group_stage_full | Group stage average | 80.542 | top_pick_candidate | 24.357 | 22.65 | 17.928 | 2.265 | 0.95 | 65.3 | high |
| 2 | Nicolás Tagliafico | Argentina | DEF | group_stage_full | Group stage average | 80.481 | top_pick_candidate | 20.294 | 18.873 | 14.335 | 4.389 | 0.93 | 77 | high |
| 4 | Nico O'Reilly | England | DEF | md3 | Panama | 80.367 | top_pick_candidate | 6.925 | 6.44 | 14.724 | 1.37 | 0.876 | 73.1 | high |
| 5 | Nicolás Tagliafico | Argentina | DEF | md2 | Austria | 80.285 | top_pick_candidate | 6.734 | 6.263 | 14.134 | 1.457 | 0.93 | 77 | high |
| 3 | Nuno Alexandre Tavares Mendes | Portugal | DEF | group_stage_full | Group stage average | 80.253 | top_pick_candidate | 21.68 | 20.164 | 17.223 | 3.477 | 0.892 | 74.2 | high |
| 5 | Denzel Dumfries | Netherlands | DEF | md3 | Tunisia | 80.25 | top_pick_candidate | 7.102 | 6.605 | 15.014 | 1.159 | 0.908 | 75.4 | high |
| 4 | Enzo Fernández | Argentina | MID | group_stage_full | Group stage average | 80.133 | top_pick_candidate | 22.358 | 20.792 | 16.342 | 2.772 | 0.95 | 70.8 | high |
| 10 | Luis Díaz | Colombia | MID | md1 | Uzbekistan | 80.019 | top_pick_candidate | 8.47 | 7.877 | 18.278 | 0.972 | 0.95 | 70.8 | high |
| 6 | Daniel Muñoz | Colombia | DEF | md2 | Congo DR | 80.004 | top_pick_candidate | 6.44 | 5.989 | 13.368 | 1.302 | 0.94 | 77.7 | high |

### Safe

Position distribution: {"DEF":9,"MID":7,"GK":5,"FWD":4}

| Rank | Name | Country | Pos | Scope | Opponent | Score | Tier | Raw | Risk | Captain | Value | Start | Min | Conf |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Nuno Alexandre Tavares Mendes | Portugal | DEF | md2 | Uzbekistan | 87.657 | top_pick_candidate | 8.252 | 7.675 | 17.223 | 1.323 | 0.892 | 74.2 | high |
| 1 | Nuno Alexandre Tavares Mendes | Portugal | DEF | md1 | Congo DR | 87.436 | top_pick_candidate | 8.193 | 7.62 | 17.066 | 1.314 | 0.892 | 74.2 | high |
| 2 | Bruno Miguel Borges Fernandes | Portugal | MID | md2 | Uzbekistan | 87.192 | top_pick_candidate | 8.122 | 7.554 | 17.457 | 0.889 | 0.92 | 68.9 | high |
| 2 | Camilo Vargas | Colombia | GK | md1 | Uzbekistan | 86.842 | top_pick_candidate | 6.295 | 5.855 | 12.703 | 1.362 | 0.94 | 82.7 | high |
| 3 | Camilo Vargas | Colombia | GK | md2 | Congo DR | 86.831 | top_pick_candidate | 6.295 | 5.855 | 12.684 | 1.362 | 0.94 | 82.7 | high |
| 3 | Bruno Miguel Borges Fernandes | Portugal | MID | md1 | Congo DR | 86.64 | top_pick_candidate | 7.965 | 7.408 | 17.068 | 0.872 | 0.92 | 68.9 | high |
| 1 | Lionel Messi | Argentina | FWD | md3 | Jordan | 86.03 | top_pick_candidate | 8.119 | 7.55 | 17.928 | 0.755 | 0.95 | 65.3 | high |
| 2 | Enzo Fernández | Argentina | MID | md3 | Jordan | 86.03 | top_pick_candidate | 7.481 | 6.957 | 16.342 | 0.928 | 0.95 | 70.8 | high |
| 4 | Daniel Muñoz | Colombia | DEF | md1 | Uzbekistan | 85.723 | top_pick_candidate | 6.537 | 6.079 | 13.596 | 1.322 | 0.94 | 77.7 | high |
| 4 | Daniel Muñoz | Colombia | DEF | md2 | Congo DR | 85.579 | top_pick_candidate | 6.44 | 5.989 | 13.368 | 1.302 | 0.94 | 77.7 | high |
| 5 | Jhon Lucumí | Colombia | DEF | md1 | Uzbekistan | 85.384 | top_pick_candidate | 5.686 | 5.288 | 11.795 | 1.23 | 0.94 | 77.7 | high |
| 5 | Jhon Lucumí | Colombia | DEF | md2 | Congo DR | 85.319 | top_pick_candidate | 5.647 | 5.251 | 11.687 | 1.221 | 0.94 | 77.7 | high |
| 6 | Unai Simón | Spain | GK | md1 | Cabo Verde | 85.21 | top_pick_candidate | 5.838 | 5.429 | 11.957 | 1.086 | 0.908 | 79.9 | high |
| 3 | Emiliano Martínez | Argentina | GK | md3 | Jordan | 85.104 | top_pick_candidate | 6.049 | 5.626 | 12.347 | 1.125 | 0.94 | 82.7 | high |
| 7 | Joshua Kimmich | Germany | DEF | md1 | Curaçao | 85.031 | top_pick_candidate | 7.254 | 6.746 | 15.051 | 1.227 | 0.91 | 75.5 | high |
| 8 | Enzo Fernández | Argentina | MID | md1 | Algeria | 85.022 | top_pick_candidate | 7.481 | 6.957 | 16.289 | 0.928 | 0.95 | 70.8 | high |
| 9 | Lionel Messi | Argentina | FWD | md1 | Algeria | 84.998 | top_pick_candidate | 8.119 | 7.55 | 17.875 | 0.755 | 0.95 | 65.3 | high |
| 1 | Bruno Miguel Borges Fernandes | Portugal | MID | group_stage_full | Group stage average | 84.962 | top_pick_candidate | 21.845 | 20.317 | 17.457 | 2.39 | 0.92 | 68.9 | high |
| 6 | Lionel Messi | Argentina | FWD | md2 | Austria | 84.925 | top_pick_candidate | 8.119 | 7.55 | 17.827 | 0.755 | 0.95 | 65.3 | high |
| 10 | Harry Kane | England | FWD | md1 | Croatia | 84.867 | top_pick_candidate | 7.265 | 6.757 | 16.033 | 0.644 | 0.944 | 65 | high |
| 7 | Enzo Fernández | Argentina | MID | md2 | Austria | 84.831 | top_pick_candidate | 7.396 | 6.878 | 16.052 | 0.917 | 0.95 | 70.8 | high |
| 8 | Sergio Rochet | Uruguay | GK | md2 | Cabo Verde | 84.724 | top_pick_candidate | 5.985 | 5.566 | 12.166 | 1.358 | 0.94 | 82.7 | high |
| 4 | Virgil van Dijk | Netherlands | DEF | md3 | Tunisia | 84.716 | top_pick_candidate | 6.17 | 5.738 | 12.888 | 1.043 | 0.934 | 77.2 | high |
| 11 | Mikel Merino | Spain | MID | md1 | Cabo Verde | 84.709 | top_pick_candidate | 6.135 | 5.705 | 13.48 | 0.92 | 0.908 | 68.1 | high |
| 9 | Willian Pacho | Ecuador | DEF | md2 | Curaçao | 84.707 | top_pick_candidate | 5.42 | 5.04 | 11.198 | 1.145 | 0.94 | 77.7 | high |

### Upside

Position distribution: {"FWD":12,"MID":11,"DEF":2}

| Rank | Name | Country | Pos | Scope | Opponent | Score | Tier | Raw | Risk | Captain | Value | Start | Min | Conf |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Lionel Messi | Argentina | FWD | md3 | Jordan | 92.325 | top_pick_candidate | 8.119 | 7.55 | 17.928 | 0.755 | 0.95 | 65.3 | high |
| 1 | Lionel Messi | Argentina | FWD | md1 | Algeria | 89.107 | top_pick_candidate | 8.119 | 7.55 | 17.875 | 0.755 | 0.95 | 65.3 | high |
| 1 | Lionel Messi | Argentina | FWD | md2 | Austria | 88.786 | top_pick_candidate | 8.119 | 7.55 | 17.827 | 0.755 | 0.95 | 65.3 | high |
| 1 | Lionel Messi | Argentina | FWD | group_stage_full | Group stage average | 86.254 | top_pick_candidate | 24.357 | 22.65 | 17.928 | 2.265 | 0.95 | 65.3 | high |
| 2 | Harry Kane | England | FWD | md2 | Ghana | 84.542 | top_pick_candidate | 7.552 | 7.023 | 16.855 | 0.669 | 0.944 | 65 | high |
| 2 | Harry Kane | England | FWD | md3 | Panama | 84.54 | top_pick_candidate | 7.552 | 7.023 | 16.804 | 0.669 | 0.944 | 65 | high |
| 3 | Bruno Miguel Borges Fernandes | Portugal | MID | md2 | Uzbekistan | 84.525 | top_pick_candidate | 8.122 | 7.554 | 17.457 | 0.889 | 0.92 | 68.9 | high |
| 2 | Lamine Yamal Nasraoui Ebana | Spain | MID | md1 | Cabo Verde | 83.264 | top_pick_candidate | 8.684 | 8.076 | 18.795 | 0.808 | 0.896 | 67.3 | high |
| 4 | Kylian Mbappé | France | FWD | md2 | Iraq | 82.591 | top_pick_candidate | 7.281 | 6.772 | 16.349 | 0.645 | 0.912 | 63.2 | high |
| 3 | Bruno Miguel Borges Fernandes | Portugal | MID | md1 | Congo DR | 81.964 | top_pick_candidate | 7.965 | 7.408 | 17.068 | 0.872 | 0.92 | 68.9 | high |
| 3 | Enzo Fernández | Argentina | MID | md3 | Jordan | 81.546 | top_pick_candidate | 7.481 | 6.957 | 16.342 | 0.928 | 0.95 | 70.8 | high |
| 5 | Lamine Yamal Nasraoui Ebana | Spain | MID | md2 | Saudi Arabia | 81.189 | top_pick_candidate | 8.684 | 8.076 | 18.79 | 0.808 | 0.896 | 67.3 | high |
| 4 | Lautaro Martínez | Argentina | FWD | md3 | Jordan | 81.139 | top_pick_candidate | 6.428 | 5.978 | 14.748 | 0.679 | 0.944 | 65 | high |
| 6 | Nuno Alexandre Tavares Mendes | Portugal | DEF | md2 | Uzbekistan | 80.813 | top_pick_candidate | 8.252 | 7.675 | 17.223 | 1.323 | 0.892 | 74.2 | high |
| 7 | Michael Olise | France | MID | md2 | Iraq | 80.496 | top_pick_candidate | 8.563 | 7.964 | 18.558 | 0.838 | 0.92 | 68.9 | high |
| 8 | Raphael Dias Belloli | Brazil | MID | md2 | Haiti | 80.21 | top_pick_candidate | 8.555 | 7.957 | 18.544 | 0.97 | 0.95 | 70.8 | high |
| 9 | Giorgian de Arrascaeta | Uruguay | MID | md2 | Cabo Verde | 80.109 | top_pick_candidate | 7.818 | 7.271 | 17.1 | 1.119 | 0.923 | 69.1 | high |
| 4 | Nuno Alexandre Tavares Mendes | Portugal | DEF | md1 | Congo DR | 79.9 | strong_candidate | 8.193 | 7.62 | 17.066 | 1.314 | 0.892 | 74.2 | high |
| 5 | Kylian Mbappé | France | FWD | md3 | Norway | 79.774 | strong_candidate | 7.083 | 6.587 | 15.77 | 0.627 | 0.912 | 63.2 | high |
| 2 | Harry Kane | England | FWD | group_stage_full | Group stage average | 79.727 | strong_candidate | 22.369 | 20.803 | 16.855 | 1.981 | 0.944 | 65 | high |
| 5 | Harry Kane | England | FWD | md1 | Croatia | 79.658 | strong_candidate | 7.265 | 6.757 | 16.033 | 0.644 | 0.944 | 65 | high |
| 6 | Luis Díaz | Colombia | MID | md1 | Uzbekistan | 79.49 | strong_candidate | 8.47 | 7.877 | 18.278 | 0.972 | 0.95 | 70.8 | high |
| 10 | Luis Díaz | Colombia | MID | md2 | Congo DR | 78.554 | strong_candidate | 8.384 | 7.797 | 18.099 | 0.963 | 0.95 | 70.8 | high |
| 7 | Mikel Oyarzabal | Spain | FWD | md1 | Cabo Verde | 78.422 | strong_candidate | 6.326 | 5.883 | 14.358 | 0.726 | 0.928 | 64.1 | high |
| 8 | Enzo Fernández | Argentina | MID | md1 | Algeria | 78.348 | strong_candidate | 7.481 | 6.957 | 16.289 | 0.928 | 0.95 | 70.8 | high |

### Differential

Position distribution: {"MID":4,"FWD":6,"DEF":13,"GK":2}

| Rank | Name | Country | Pos | Scope | Opponent | Score | Tier | Raw | Risk | Captain | Value | Start | Min | Conf |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Giorgian de Arrascaeta | Uruguay | MID | md1 | Saudi Arabia | 77.668 | strong_candidate | 7.541 | 7.013 | 16.481 | 1.079 | 0.923 | 69.1 | high |
| 1 | Nicolas Jackson | Senegal | FWD | md3 | Iraq | 77.42 | strong_candidate | 6.181 | 5.748 | 14.084 | 0.858 | 0.755 | 54.8 | high |
| 1 | Hiroki Ito | Japan | DEF | md2 | Tunisia | 77.011 | strong_candidate | 6.567 | 6.107 | 13.689 | 1.566 | 0.89 | 74.1 | high |
| 2 | Luis Suárez | Colombia | FWD | md1 | Uzbekistan | 73.997 | strong_candidate | 6.468 | 6.015 | 14.716 | 1.055 | 0.73 | 53.4 | high |
| 2 | Luis Suárez | Colombia | FWD | md2 | Congo DR | 73.885 | strong_candidate | 6.433 | 5.983 | 14.631 | 1.05 | 0.73 | 53.4 | high |
| 2 | Martin Erlic | Croatia | DEF | md3 | Ghana | 73.659 | strong_candidate | 5.671 | 5.274 | 12.049 | 1.352 | 0.858 | 71.8 | high |
| 3 | Santiago Arias | Colombia | DEF | md1 | Uzbekistan | 72.62 | strong_candidate | 5.638 | 5.244 | 11.468 | 1.345 | 0.882 | 73.5 | high |
| 3 | Emmanuel Agbadou | Côte d'Ivoire | DEF | md3 | Curaçao | 72.506 | strong_candidate | 5.597 | 5.205 | 11.611 | 1.335 | 0.882 | 73.5 | high |
| 4 | Ismael Saibari | Morocco | MID | md3 | Haiti | 72.076 | strong_candidate | 6.574 | 6.114 | 14.65 | 0.899 | 0.755 | 58.3 | high |
| 1 | Charles De Ketelaere | Belgium | MID | group_stage_full | Group stage average | 71.605 | strong_candidate | 18.988 | 17.659 | 13.996 | 3.153 | 0.902 | 67.7 | high |
| 4 | Nicolás Tagliafico | Argentina | DEF | md1 | Algeria | 70.936 | strong_candidate | 6.78 | 6.305 | 14.282 | 1.466 | 0.93 | 77 | high |
| 5 | Johan Mojica | Colombia | DEF | md1 | Uzbekistan | 70.923 | strong_candidate | 5.699 | 5.3 | 11.697 | 1.359 | 0.924 | 76.5 | high |
| 5 | Duje Caleta-Car | Croatia | DEF | md3 | Ghana | 70.833 | strong_candidate | 5.569 | 5.179 | 11.681 | 1.295 | 0.908 | 75.4 | high |
| 3 | Junnosuke Suzuki | Japan | DEF | md2 | Tunisia | 70.615 | strong_candidate | 5.552 | 5.163 | 11.582 | 1.475 | 0.858 | 71.8 | high |
| 2 | Silvan Widmer | Switzerland | DEF | group_stage_full | Group stage average | 70.39 | strong_candidate | 17.429 | 16.21 | 14.001 | 3.86 | 0.908 | 75.4 | high |
| 6 | Torbjørn Heggem | Norway | DEF | md1 | Iraq | 69.872 | strong_candidate | 5.474 | 5.091 | 11.409 | 1.376 | 0.916 | 76 | high |
| 3 | Luis Suárez | Colombia | FWD | group_stage_full | Group stage average | 69.617 | strong_candidate | 17.194 | 15.99 | 14.716 | 2.805 | 0.73 | 53.4 | high |
| 4 | Nico O'Reilly | England | DEF | md2 | Ghana | 69.037 | strong_candidate | 6.925 | 6.44 | 14.775 | 1.37 | 0.876 | 73.1 | high |
| 5 | Ritsu Doan | Japan | DEF | md2 | Tunisia | 68.948 | strong_candidate | 7.254 | 6.746 | 15.031 | 1.323 | 0.94 | 77.7 | high |
| 6 | Christoph Baumgartner | Austria | MID | md3 | Algeria | 67.951 | strong_candidate | 6.246 | 5.809 | 13.759 | 0.867 | 0.931 | 69.6 | high |
| 7 | Julian Ryerson | Norway | DEF | md1 | Iraq | 67.839 | strong_candidate | 6.959 | 6.472 | 14.203 | 1.541 | 0.924 | 76.5 | high |
| 6 | Santiago Mele | Uruguay | GK | md2 | Cabo Verde | 67.409 | strong_candidate | 5.465 | 5.082 | 11.189 | 1.452 | 0.872 | 76.7 | high |
| 7 | Kevin Rodríguez | Ecuador | FWD | md2 | Curaçao | 67.254 | strong_candidate | 5.729 | 5.328 | 13.039 | 1.087 | 0.9 | 62.6 | high |
| 8 | Santiago Mele | Uruguay | GK | md1 | Saudi Arabia | 66.848 | strong_candidate | 5.465 | 5.082 | 11.139 | 1.452 | 0.872 | 76.7 | high |
| 4 | Mikel Oyarzabal | Spain | FWD | group_stage_full | Group stage average | 66.757 | strong_candidate | 18.151 | 16.88 | 14.358 | 2.084 | 0.928 | 64.1 | high |

### Captain Alpha

Position distribution: {"FWD":15,"MID":10}

| Rank | Name | Country | Pos | Scope | Opponent | Score | Tier | Raw | Risk | Captain | Value | Start | Min | Conf |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Lionel Messi | Argentina | FWD | md3 | Jordan | 96.249 | top_pick_candidate | 8.119 | 7.55 | 17.928 | 0.755 | 0.95 | 65.3 | high |
| 1 | Lionel Messi | Argentina | FWD | md1 | Algeria | 94.54 | top_pick_candidate | 8.119 | 7.55 | 17.875 | 0.755 | 0.95 | 65.3 | high |
| 1 | Lionel Messi | Argentina | FWD | md2 | Austria | 94.437 | top_pick_candidate | 8.119 | 7.55 | 17.827 | 0.755 | 0.95 | 65.3 | high |
| 1 | Lionel Messi | Argentina | FWD | group_stage_full | Group stage average | 93.92 | top_pick_candidate | 24.357 | 22.65 | 17.928 | 2.265 | 0.95 | 65.3 | high |
| 2 | Harry Kane | England | FWD | md3 | Panama | 91.185 | top_pick_candidate | 7.552 | 7.023 | 16.804 | 0.669 | 0.944 | 65 | high |
| 2 | Bruno Miguel Borges Fernandes | Portugal | MID | md2 | Uzbekistan | 90.477 | top_pick_candidate | 8.122 | 7.554 | 17.457 | 0.889 | 0.92 | 68.9 | high |
| 3 | Harry Kane | England | FWD | md2 | Ghana | 90.449 | top_pick_candidate | 7.552 | 7.023 | 16.855 | 0.669 | 0.944 | 65 | high |
| 2 | Harry Kane | England | FWD | md1 | Croatia | 88.993 | top_pick_candidate | 7.265 | 6.757 | 16.033 | 0.644 | 0.944 | 65 | high |
| 2 | Harry Kane | England | FWD | group_stage_full | Group stage average | 88.94 | top_pick_candidate | 22.369 | 20.803 | 16.855 | 1.981 | 0.944 | 65 | high |
| 3 | Bruno Miguel Borges Fernandes | Portugal | MID | md1 | Congo DR | 88.904 | top_pick_candidate | 7.965 | 7.408 | 17.068 | 0.872 | 0.92 | 68.9 | high |
| 3 | Kylian Mbappé | France | FWD | md3 | Norway | 88.395 | top_pick_candidate | 7.083 | 6.587 | 15.77 | 0.627 | 0.912 | 63.2 | high |
| 4 | Kylian Mbappé | France | FWD | md2 | Iraq | 88.067 | top_pick_candidate | 7.281 | 6.772 | 16.349 | 0.645 | 0.912 | 63.2 | high |
| 4 | Enzo Fernández | Argentina | MID | md3 | Jordan | 86.66 | top_pick_candidate | 7.481 | 6.957 | 16.342 | 0.928 | 0.95 | 70.8 | high |
| 4 | Lamine Yamal Nasraoui Ebana | Spain | MID | md1 | Cabo Verde | 86.592 | top_pick_candidate | 8.684 | 8.076 | 18.795 | 0.808 | 0.896 | 67.3 | high |
| 3 | Kylian Mbappé | France | FWD | group_stage_full | Group stage average | 86.18 | top_pick_candidate | 21.405 | 19.907 | 16.349 | 1.896 | 0.912 | 63.2 | high |
| 5 | Lautaro Martínez | Argentina | FWD | md3 | Jordan | 85.898 | top_pick_candidate | 6.428 | 5.978 | 14.748 | 0.679 | 0.944 | 65 | high |
| 5 | Giorgian de Arrascaeta | Uruguay | MID | md2 | Cabo Verde | 85.413 | top_pick_candidate | 7.818 | 7.271 | 17.1 | 1.119 | 0.923 | 69.1 | high |
| 5 | Luis Díaz | Colombia | MID | md1 | Uzbekistan | 85.374 | top_pick_candidate | 8.47 | 7.877 | 18.278 | 0.972 | 0.95 | 70.8 | high |
| 6 | Cristiano Ronaldo dos Santos Aveiro | Portugal | FWD | md2 | Uzbekistan | 85.275 | top_pick_candidate | 6.686 | 6.218 | 15.177 | 0.622 | 0.92 | 63.7 | high |
| 4 | Bruno Miguel Borges Fernandes | Portugal | MID | group_stage_full | Group stage average | 85.181 | top_pick_candidate | 21.845 | 20.317 | 17.457 | 2.39 | 0.92 | 68.9 | high |
| 6 | Enzo Fernández | Argentina | MID | md1 | Algeria | 85.053 | top_pick_candidate | 7.481 | 6.957 | 16.289 | 0.928 | 0.95 | 70.8 | high |
| 7 | Kylian Mbappé | France | FWD | md1 | Senegal | 84.94 | top_pick_candidate | 7.041 | 6.548 | 15.633 | 0.624 | 0.912 | 63.2 | high |
| 8 | Cristiano Ronaldo dos Santos Aveiro | Portugal | FWD | md1 | Congo DR | 84.906 | top_pick_candidate | 6.676 | 6.209 | 15.113 | 0.621 | 0.92 | 63.7 | high |
| 7 | Luis Díaz | Colombia | MID | md2 | Congo DR | 84.716 | top_pick_candidate | 8.384 | 7.797 | 18.099 | 0.963 | 0.95 | 70.8 | high |
| 8 | Lamine Yamal Nasraoui Ebana | Spain | MID | md2 | Saudi Arabia | 84.592 | top_pick_candidate | 8.684 | 8.076 | 18.79 | 0.808 | 0.896 | 67.3 | high |

## Top 25 By Matchday

### group_stage_full

| Rank | Name | Country | Pos | Scope | Opponent | Score | Tier | Raw | Risk | Captain | Value | Start | Min | Conf |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Lionel Messi | Argentina | FWD | group_stage_full | Group stage average | 93.92 | top_pick_candidate | 24.357 | 22.65 | 17.928 | 2.265 | 0.95 | 65.3 | high |
| 2 | Harry Kane | England | FWD | group_stage_full | Group stage average | 88.94 | top_pick_candidate | 22.369 | 20.803 | 16.855 | 1.981 | 0.944 | 65 | high |
| 1 | Lionel Messi | Argentina | FWD | group_stage_full | Group stage average | 86.254 | top_pick_candidate | 24.357 | 22.65 | 17.928 | 2.265 | 0.95 | 65.3 | high |
| 3 | Kylian Mbappé | France | FWD | group_stage_full | Group stage average | 86.18 | top_pick_candidate | 21.405 | 19.907 | 16.349 | 1.896 | 0.912 | 63.2 | high |
| 4 | Bruno Miguel Borges Fernandes | Portugal | MID | group_stage_full | Group stage average | 85.181 | top_pick_candidate | 21.845 | 20.317 | 17.457 | 2.39 | 0.92 | 68.9 | high |
| 1 | Bruno Miguel Borges Fernandes | Portugal | MID | group_stage_full | Group stage average | 84.962 | top_pick_candidate | 21.845 | 20.317 | 17.457 | 2.39 | 0.92 | 68.9 | high |
| 2 | Nuno Alexandre Tavares Mendes | Portugal | DEF | group_stage_full | Group stage average | 84.366 | top_pick_candidate | 21.68 | 20.164 | 17.223 | 3.477 | 0.892 | 74.2 | high |
| 5 | Enzo Fernández | Argentina | MID | group_stage_full | Group stage average | 84.25 | top_pick_candidate | 22.358 | 20.792 | 16.342 | 2.772 | 0.95 | 70.8 | high |
| 3 | Lionel Messi | Argentina | FWD | group_stage_full | Group stage average | 84.022 | top_pick_candidate | 24.357 | 22.65 | 17.928 | 2.265 | 0.95 | 65.3 | high |
| 4 | Enzo Fernández | Argentina | MID | group_stage_full | Group stage average | 83.999 | top_pick_candidate | 22.358 | 20.792 | 16.342 | 2.772 | 0.95 | 70.8 | high |
| 5 | Emiliano Martínez | Argentina | GK | group_stage_full | Group stage average | 83.948 | top_pick_candidate | 18.147 | 16.878 | 12.347 | 3.376 | 0.94 | 82.7 | high |
| 6 | Lautaro Martínez | Argentina | FWD | group_stage_full | Group stage average | 83.711 | top_pick_candidate | 19.262 | 17.914 | 14.748 | 2.036 | 0.944 | 65 | high |
| 6 | Camilo Vargas | Colombia | GK | group_stage_full | Group stage average | 83.709 | top_pick_candidate | 16.551 | 15.394 | 12.703 | 3.58 | 0.94 | 82.7 | high |
| 7 | Harry Kane | England | FWD | group_stage_full | Group stage average | 83.108 | top_pick_candidate | 22.369 | 20.803 | 16.855 | 1.981 | 0.944 | 65 | high |
| 7 | Lamine Yamal Nasraoui Ebana | Spain | MID | group_stage_full | Group stage average | 83.065 | top_pick_candidate | 25.819 | 24.011 | 18.795 | 2.401 | 0.896 | 67.3 | high |
| 8 | Cristiano Ronaldo dos Santos Aveiro | Portugal | FWD | group_stage_full | Group stage average | 82.574 | top_pick_candidate | 18.912 | 17.589 | 15.177 | 1.759 | 0.92 | 63.7 | high |
| 8 | Nahuel Molina | Argentina | DEF | group_stage_full | Group stage average | 82.433 | top_pick_candidate | 18.434 | 17.143 | 12.677 | 3.896 | 0.93 | 77 | high |
| 9 | Daniel Muñoz | Colombia | DEF | group_stage_full | Group stage average | 82.195 | top_pick_candidate | 16.419 | 15.269 | 13.596 | 3.319 | 0.94 | 77.7 | high |
| 10 | Jhon Lucumí | Colombia | DEF | group_stage_full | Group stage average | 82.095 | top_pick_candidate | 14.405 | 13.396 | 11.795 | 3.115 | 0.94 | 77.7 | high |
| 11 | Cristiano Ronaldo dos Santos Aveiro | Portugal | FWD | group_stage_full | Group stage average | 82.074 | top_pick_candidate | 18.912 | 17.589 | 15.177 | 1.759 | 0.92 | 63.7 | high |
| 12 | Florian Wirtz | Germany | MID | group_stage_full | Group stage average | 82.06 | top_pick_candidate | 18.19 | 16.916 | 14.284 | 2.255 | 0.923 | 69.1 | high |
| 13 | Nicolás Otamendi | Argentina | DEF | group_stage_full | Group stage average | 82.021 | top_pick_candidate | 16.955 | 15.768 | 11.935 | 3.584 | 0.94 | 77.7 | high |
| 14 | Nicolás Tagliafico | Argentina | DEF | group_stage_full | Group stage average | 81.73 | top_pick_candidate | 20.294 | 18.873 | 14.335 | 4.389 | 0.93 | 77 | high |
| 15 | Unai Simón | Spain | GK | group_stage_full | Group stage average | 81.539 | top_pick_candidate | 16.737 | 15.565 | 11.957 | 3.113 | 0.908 | 79.9 | high |
| 16 | Diogo Meireles da Costa | Portugal | GK | group_stage_full | Group stage average | 81.184 | top_pick_candidate | 14.642 | 13.617 | 11.306 | 2.779 | 0.908 | 79.9 | high |

### md1

| Rank | Name | Country | Pos | Scope | Opponent | Score | Tier | Raw | Risk | Captain | Value | Start | Min | Conf |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Lionel Messi | Argentina | FWD | md1 | Algeria | 94.54 | top_pick_candidate | 8.119 | 7.55 | 17.875 | 0.755 | 0.95 | 65.3 | high |
| 1 | Lionel Messi | Argentina | FWD | md1 | Algeria | 89.107 | top_pick_candidate | 8.119 | 7.55 | 17.875 | 0.755 | 0.95 | 65.3 | high |
| 2 | Harry Kane | England | FWD | md1 | Croatia | 88.993 | top_pick_candidate | 7.265 | 6.757 | 16.033 | 0.644 | 0.944 | 65 | high |
| 3 | Bruno Miguel Borges Fernandes | Portugal | MID | md1 | Congo DR | 88.904 | top_pick_candidate | 7.965 | 7.408 | 17.068 | 0.872 | 0.92 | 68.9 | high |
| 1 | Nuno Alexandre Tavares Mendes | Portugal | DEF | md1 | Congo DR | 87.436 | top_pick_candidate | 8.193 | 7.62 | 17.066 | 1.314 | 0.892 | 74.2 | high |
| 2 | Camilo Vargas | Colombia | GK | md1 | Uzbekistan | 86.842 | top_pick_candidate | 6.295 | 5.855 | 12.703 | 1.362 | 0.94 | 82.7 | high |
| 3 | Bruno Miguel Borges Fernandes | Portugal | MID | md1 | Congo DR | 86.64 | top_pick_candidate | 7.965 | 7.408 | 17.068 | 0.872 | 0.92 | 68.9 | high |
| 4 | Lamine Yamal Nasraoui Ebana | Spain | MID | md1 | Cabo Verde | 86.592 | top_pick_candidate | 8.684 | 8.076 | 18.795 | 0.808 | 0.896 | 67.3 | high |
| 1 | Nuno Alexandre Tavares Mendes | Portugal | DEF | md1 | Congo DR | 85.983 | top_pick_candidate | 8.193 | 7.62 | 17.066 | 1.314 | 0.892 | 74.2 | high |
| 4 | Daniel Muñoz | Colombia | DEF | md1 | Uzbekistan | 85.723 | top_pick_candidate | 6.537 | 6.079 | 13.596 | 1.322 | 0.94 | 77.7 | high |
| 5 | Jhon Lucumí | Colombia | DEF | md1 | Uzbekistan | 85.384 | top_pick_candidate | 5.686 | 5.288 | 11.795 | 1.23 | 0.94 | 77.7 | high |
| 5 | Luis Díaz | Colombia | MID | md1 | Uzbekistan | 85.374 | top_pick_candidate | 8.47 | 7.877 | 18.278 | 0.972 | 0.95 | 70.8 | high |
| 6 | Unai Simón | Spain | GK | md1 | Cabo Verde | 85.21 | top_pick_candidate | 5.838 | 5.429 | 11.957 | 1.086 | 0.908 | 79.9 | high |
| 6 | Enzo Fernández | Argentina | MID | md1 | Algeria | 85.053 | top_pick_candidate | 7.481 | 6.957 | 16.289 | 0.928 | 0.95 | 70.8 | high |
| 7 | Joshua Kimmich | Germany | DEF | md1 | Curaçao | 85.031 | top_pick_candidate | 7.254 | 6.746 | 15.051 | 1.227 | 0.91 | 75.5 | high |
| 8 | Enzo Fernández | Argentina | MID | md1 | Algeria | 85.022 | top_pick_candidate | 7.481 | 6.957 | 16.289 | 0.928 | 0.95 | 70.8 | high |
| 9 | Lionel Messi | Argentina | FWD | md1 | Algeria | 84.998 | top_pick_candidate | 8.119 | 7.55 | 17.875 | 0.755 | 0.95 | 65.3 | high |
| 7 | Kylian Mbappé | France | FWD | md1 | Senegal | 84.94 | top_pick_candidate | 7.041 | 6.548 | 15.633 | 0.624 | 0.912 | 63.2 | high |
| 8 | Cristiano Ronaldo dos Santos Aveiro | Portugal | FWD | md1 | Congo DR | 84.906 | top_pick_candidate | 6.676 | 6.209 | 15.113 | 0.621 | 0.92 | 63.7 | high |
| 10 | Harry Kane | England | FWD | md1 | Croatia | 84.867 | top_pick_candidate | 7.265 | 6.757 | 16.033 | 0.644 | 0.944 | 65 | high |
| 11 | Mikel Merino | Spain | MID | md1 | Cabo Verde | 84.709 | top_pick_candidate | 6.135 | 5.705 | 13.48 | 0.92 | 0.908 | 68.1 | high |
| 12 | Emiliano Martínez | Argentina | GK | md1 | Algeria | 84.583 | top_pick_candidate | 6.049 | 5.626 | 12.294 | 1.125 | 0.94 | 82.7 | high |
| 13 | Sergio Rochet | Uruguay | GK | md1 | Saudi Arabia | 84.542 | top_pick_candidate | 5.985 | 5.566 | 12.116 | 1.358 | 0.94 | 82.7 | high |
| 9 | Lautaro Martínez | Argentina | FWD | md1 | Algeria | 84.415 | top_pick_candidate | 6.428 | 5.978 | 14.695 | 0.679 | 0.944 | 65 | high |
| 14 | Florian Wirtz | Germany | MID | md1 | Curaçao | 84.414 | top_pick_candidate | 6.615 | 6.152 | 14.284 | 0.82 | 0.923 | 69.1 | high |

### md2

| Rank | Name | Country | Pos | Scope | Opponent | Score | Tier | Raw | Risk | Captain | Value | Start | Min | Conf |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Lionel Messi | Argentina | FWD | md2 | Austria | 94.437 | top_pick_candidate | 8.119 | 7.55 | 17.827 | 0.755 | 0.95 | 65.3 | high |
| 2 | Bruno Miguel Borges Fernandes | Portugal | MID | md2 | Uzbekistan | 90.477 | top_pick_candidate | 8.122 | 7.554 | 17.457 | 0.889 | 0.92 | 68.9 | high |
| 3 | Harry Kane | England | FWD | md2 | Ghana | 90.449 | top_pick_candidate | 7.552 | 7.023 | 16.855 | 0.669 | 0.944 | 65 | high |
| 1 | Lionel Messi | Argentina | FWD | md2 | Austria | 88.786 | top_pick_candidate | 8.119 | 7.55 | 17.827 | 0.755 | 0.95 | 65.3 | high |
| 4 | Kylian Mbappé | France | FWD | md2 | Iraq | 88.067 | top_pick_candidate | 7.281 | 6.772 | 16.349 | 0.645 | 0.912 | 63.2 | high |
| 1 | Nuno Alexandre Tavares Mendes | Portugal | DEF | md2 | Uzbekistan | 87.657 | top_pick_candidate | 8.252 | 7.675 | 17.223 | 1.323 | 0.892 | 74.2 | high |
| 2 | Bruno Miguel Borges Fernandes | Portugal | MID | md2 | Uzbekistan | 87.192 | top_pick_candidate | 8.122 | 7.554 | 17.457 | 0.889 | 0.92 | 68.9 | high |
| 3 | Camilo Vargas | Colombia | GK | md2 | Congo DR | 86.831 | top_pick_candidate | 6.295 | 5.855 | 12.684 | 1.362 | 0.94 | 82.7 | high |
| 1 | Nuno Alexandre Tavares Mendes | Portugal | DEF | md2 | Uzbekistan | 86.341 | top_pick_candidate | 8.252 | 7.675 | 17.223 | 1.323 | 0.892 | 74.2 | high |
| 4 | Daniel Muñoz | Colombia | DEF | md2 | Congo DR | 85.579 | top_pick_candidate | 6.44 | 5.989 | 13.368 | 1.302 | 0.94 | 77.7 | high |
| 5 | Giorgian de Arrascaeta | Uruguay | MID | md2 | Cabo Verde | 85.413 | top_pick_candidate | 7.818 | 7.271 | 17.1 | 1.119 | 0.923 | 69.1 | high |
| 5 | Jhon Lucumí | Colombia | DEF | md2 | Congo DR | 85.319 | top_pick_candidate | 5.647 | 5.251 | 11.687 | 1.221 | 0.94 | 77.7 | high |
| 6 | Cristiano Ronaldo dos Santos Aveiro | Portugal | FWD | md2 | Uzbekistan | 85.275 | top_pick_candidate | 6.686 | 6.218 | 15.177 | 0.622 | 0.92 | 63.7 | high |
| 6 | Lionel Messi | Argentina | FWD | md2 | Austria | 84.925 | top_pick_candidate | 8.119 | 7.55 | 17.827 | 0.755 | 0.95 | 65.3 | high |
| 7 | Enzo Fernández | Argentina | MID | md2 | Austria | 84.831 | top_pick_candidate | 7.396 | 6.878 | 16.052 | 0.917 | 0.95 | 70.8 | high |
| 2 | Bruno Miguel Borges Fernandes | Portugal | MID | md2 | Uzbekistan | 84.75 | top_pick_candidate | 8.122 | 7.554 | 17.457 | 0.889 | 0.92 | 68.9 | high |
| 8 | Sergio Rochet | Uruguay | GK | md2 | Cabo Verde | 84.724 | top_pick_candidate | 5.985 | 5.566 | 12.166 | 1.358 | 0.94 | 82.7 | high |
| 7 | Luis Díaz | Colombia | MID | md2 | Congo DR | 84.716 | top_pick_candidate | 8.384 | 7.797 | 18.099 | 0.963 | 0.95 | 70.8 | high |
| 9 | Willian Pacho | Ecuador | DEF | md2 | Curaçao | 84.707 | top_pick_candidate | 5.42 | 5.04 | 11.198 | 1.145 | 0.94 | 77.7 | high |
| 10 | Hernán Galíndez | Ecuador | GK | md2 | Curaçao | 84.693 | top_pick_candidate | 5.901 | 5.488 | 12.012 | 1.307 | 0.94 | 82.7 | high |
| 11 | Harry Kane | England | FWD | md2 | Ghana | 84.615 | top_pick_candidate | 7.552 | 7.023 | 16.855 | 0.669 | 0.944 | 65 | high |
| 8 | Lamine Yamal Nasraoui Ebana | Spain | MID | md2 | Saudi Arabia | 84.592 | top_pick_candidate | 8.684 | 8.076 | 18.79 | 0.808 | 0.896 | 67.3 | high |
| 12 | Emiliano Martínez | Argentina | GK | md2 | Austria | 84.547 | top_pick_candidate | 6.049 | 5.626 | 12.246 | 1.125 | 0.94 | 82.7 | high |
| 2 | Harry Kane | England | FWD | md2 | Ghana | 84.542 | top_pick_candidate | 7.552 | 7.023 | 16.855 | 0.669 | 0.944 | 65 | high |
| 3 | Bruno Miguel Borges Fernandes | Portugal | MID | md2 | Uzbekistan | 84.525 | top_pick_candidate | 8.122 | 7.554 | 17.457 | 0.889 | 0.92 | 68.9 | high |

### md3

| Rank | Name | Country | Pos | Scope | Opponent | Score | Tier | Raw | Risk | Captain | Value | Start | Min | Conf |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Lionel Messi | Argentina | FWD | md3 | Jordan | 96.249 | top_pick_candidate | 8.119 | 7.55 | 17.928 | 0.755 | 0.95 | 65.3 | high |
| 1 | Lionel Messi | Argentina | FWD | md3 | Jordan | 92.325 | top_pick_candidate | 8.119 | 7.55 | 17.928 | 0.755 | 0.95 | 65.3 | high |
| 2 | Harry Kane | England | FWD | md3 | Panama | 91.185 | top_pick_candidate | 7.552 | 7.023 | 16.804 | 0.669 | 0.944 | 65 | high |
| 3 | Kylian Mbappé | France | FWD | md3 | Norway | 88.395 | top_pick_candidate | 7.083 | 6.587 | 15.77 | 0.627 | 0.912 | 63.2 | high |
| 4 | Enzo Fernández | Argentina | MID | md3 | Jordan | 86.66 | top_pick_candidate | 7.481 | 6.957 | 16.342 | 0.928 | 0.95 | 70.8 | high |
| 1 | Lionel Messi | Argentina | FWD | md3 | Jordan | 86.03 | top_pick_candidate | 8.119 | 7.55 | 17.928 | 0.755 | 0.95 | 65.3 | high |
| 2 | Enzo Fernández | Argentina | MID | md3 | Jordan | 86.03 | top_pick_candidate | 7.481 | 6.957 | 16.342 | 0.928 | 0.95 | 70.8 | high |
| 5 | Lautaro Martínez | Argentina | FWD | md3 | Jordan | 85.898 | top_pick_candidate | 6.428 | 5.978 | 14.748 | 0.679 | 0.944 | 65 | high |
| 3 | Emiliano Martínez | Argentina | GK | md3 | Jordan | 85.104 | top_pick_candidate | 6.049 | 5.626 | 12.347 | 1.125 | 0.94 | 82.7 | high |
| 4 | Virgil van Dijk | Netherlands | DEF | md3 | Tunisia | 84.716 | top_pick_candidate | 6.17 | 5.738 | 12.888 | 1.043 | 0.934 | 77.2 | high |
| 5 | Denzel Dumfries | Netherlands | DEF | md3 | Tunisia | 84.635 | top_pick_candidate | 7.102 | 6.605 | 15.014 | 1.159 | 0.908 | 75.4 | high |
| 6 | Harry Kane | England | FWD | md3 | Panama | 84.583 | top_pick_candidate | 7.552 | 7.023 | 16.804 | 0.669 | 0.944 | 65 | high |
| 2 | Harry Kane | England | FWD | md3 | Panama | 84.54 | top_pick_candidate | 7.552 | 7.023 | 16.804 | 0.669 | 0.944 | 65 | high |
| 7 | Yahia Fofana | Côte d'Ivoire | GK | md3 | Curaçao | 84.285 | top_pick_candidate | 6.19 | 5.757 | 12.427 | 1.371 | 0.932 | 82 | high |
| 8 | Thibaut Courtois | Belgium | GK | md3 | New Zealand | 83.85 | top_pick_candidate | 5.595 | 5.203 | 11.388 | 1.062 | 0.892 | 78.5 | high |
| 1 | Lionel Messi | Argentina | FWD | md3 | Jordan | 83.835 | top_pick_candidate | 8.119 | 7.55 | 17.928 | 0.755 | 0.95 | 65.3 | high |
| 9 | Zeno Debast | Belgium | DEF | md3 | New Zealand | 83.716 | top_pick_candidate | 5.512 | 5.126 | 11.231 | 1.192 | 0.898 | 74.7 | high |
| 10 | Nahuel Molina | Argentina | DEF | md3 | Jordan | 83.604 | top_pick_candidate | 6.154 | 5.723 | 12.677 | 1.301 | 0.93 | 77 | high |
| 11 | Édouard Mendy | Senegal | GK | md3 | Iraq | 83.595 | top_pick_candidate | 5.632 | 5.238 | 11.442 | 1.164 | 0.932 | 82 | high |
| 2 | Enzo Fernández | Argentina | MID | md3 | Jordan | 83.52 | top_pick_candidate | 7.481 | 6.957 | 16.342 | 0.928 | 0.95 | 70.8 | high |
| 12 | Josip Stanisic | Croatia | DEF | md3 | Ghana | 83.347 | top_pick_candidate | 6.349 | 5.905 | 13.113 | 1.373 | 0.892 | 74.2 | high |
| 13 | Nicolás Otamendi | Argentina | DEF | md3 | Jordan | 83.174 | top_pick_candidate | 5.657 | 5.261 | 11.935 | 1.196 | 0.94 | 77.7 | high |
| 14 | Julián Alvarez | Argentina | FWD | md3 | Jordan | 83.154 | top_pick_candidate | 6.117 | 5.689 | 13.663 | 0.662 | 0.95 | 65.3 | high |
| 6 | Lamine Yamal Nasraoui Ebana | Spain | MID | md3 | Uruguay | 83.06 | top_pick_candidate | 8.451 | 7.859 | 18.133 | 0.786 | 0.896 | 67.3 | high |
| 15 | Jérémy Doku | Belgium | MID | md3 | New Zealand | 83.006 | top_pick_candidate | 6.209 | 5.774 | 13.023 | 0.77 | 0.929 | 69.5 | high |

## Top 25 By Position

### GK

| Rank | Name | Country | Pos | Scope | Opponent | Score | Tier | Raw | Risk | Captain | Value | Start | Min | Conf |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2 | Camilo Vargas | Colombia | GK | md1 | Uzbekistan | 86.842 | top_pick_candidate | 6.295 | 5.855 | 12.703 | 1.362 | 0.94 | 82.7 | high |
| 3 | Camilo Vargas | Colombia | GK | md2 | Congo DR | 86.831 | top_pick_candidate | 6.295 | 5.855 | 12.684 | 1.362 | 0.94 | 82.7 | high |
| 6 | Unai Simón | Spain | GK | md1 | Cabo Verde | 85.21 | top_pick_candidate | 5.838 | 5.429 | 11.957 | 1.086 | 0.908 | 79.9 | high |
| 3 | Emiliano Martínez | Argentina | GK | md3 | Jordan | 85.104 | top_pick_candidate | 6.049 | 5.626 | 12.347 | 1.125 | 0.94 | 82.7 | high |
| 8 | Sergio Rochet | Uruguay | GK | md2 | Cabo Verde | 84.724 | top_pick_candidate | 5.985 | 5.566 | 12.166 | 1.358 | 0.94 | 82.7 | high |
| 10 | Hernán Galíndez | Ecuador | GK | md2 | Curaçao | 84.693 | top_pick_candidate | 5.901 | 5.488 | 12.012 | 1.307 | 0.94 | 82.7 | high |
| 12 | Emiliano Martínez | Argentina | GK | md1 | Algeria | 84.583 | top_pick_candidate | 6.049 | 5.626 | 12.294 | 1.125 | 0.94 | 82.7 | high |
| 12 | Emiliano Martínez | Argentina | GK | md2 | Austria | 84.547 | top_pick_candidate | 6.049 | 5.626 | 12.246 | 1.125 | 0.94 | 82.7 | high |
| 13 | Sergio Rochet | Uruguay | GK | md1 | Saudi Arabia | 84.542 | top_pick_candidate | 5.985 | 5.566 | 12.116 | 1.358 | 0.94 | 82.7 | high |
| 7 | Yahia Fofana | Côte d'Ivoire | GK | md3 | Curaçao | 84.285 | top_pick_candidate | 6.19 | 5.757 | 12.427 | 1.371 | 0.932 | 82 | high |
| 18 | Diogo Meireles da Costa | Portugal | GK | md2 | Uzbekistan | 84.002 | top_pick_candidate | 5.525 | 5.138 | 11.306 | 1.049 | 0.908 | 79.9 | high |
| 5 | Emiliano Martínez | Argentina | GK | group_stage_full | Group stage average | 83.948 | top_pick_candidate | 18.147 | 16.878 | 12.347 | 3.376 | 0.94 | 82.7 | high |
| 21 | Diogo Meireles da Costa | Portugal | GK | md1 | Congo DR | 83.862 | top_pick_candidate | 5.525 | 5.138 | 11.26 | 1.049 | 0.908 | 79.9 | high |
| 8 | Thibaut Courtois | Belgium | GK | md3 | New Zealand | 83.85 | top_pick_candidate | 5.595 | 5.203 | 11.388 | 1.062 | 0.892 | 78.5 | high |
| 23 | Hernán Galíndez | Ecuador | GK | md1 | Côte d'Ivoire | 83.724 | top_pick_candidate | 5.738 | 5.337 | 11.431 | 1.271 | 0.94 | 82.7 | high |
| 6 | Camilo Vargas | Colombia | GK | group_stage_full | Group stage average | 83.709 | top_pick_candidate | 16.551 | 15.394 | 12.703 | 3.58 | 0.94 | 82.7 | high |
| 11 | Édouard Mendy | Senegal | GK | md3 | Iraq | 83.595 | top_pick_candidate | 5.632 | 5.238 | 11.442 | 1.164 | 0.932 | 82 | high |
| 21 | Alisson Ramsés Becker | Brazil | GK | md2 | Haiti | 83.296 | top_pick_candidate | 5.809 | 5.402 | 11.892 | 1.08 | 0.932 | 82 | high |
| 22 | Jordan Pickford | England | GK | md3 | Panama | 82.822 | top_pick_candidate | 5.797 | 5.391 | 11.815 | 1.123 | 0.916 | 80.6 | high |
| 24 | Bart Verbruggen | Netherlands | GK | md3 | Tunisia | 82.601 | top_pick_candidate | 5.805 | 5.399 | 11.788 | 1.149 | 0.908 | 79.9 | high |
| 15 | Unai Simón | Spain | GK | group_stage_full | Group stage average | 81.539 | top_pick_candidate | 16.737 | 15.565 | 11.957 | 3.113 | 0.908 | 79.9 | high |
| 16 | Diogo Meireles da Costa | Portugal | GK | group_stage_full | Group stage average | 81.184 | top_pick_candidate | 14.642 | 13.617 | 11.306 | 2.779 | 0.908 | 79.9 | high |
| 21 | Jordan Pickford | England | GK | group_stage_full | Group stage average | 81.052 | top_pick_candidate | 16.478 | 15.324 | 11.866 | 3.193 | 0.916 | 80.6 | high |
| 13 | Camilo Vargas | Colombia | GK | md1 | Uzbekistan | 79.286 | strong_candidate | 6.295 | 5.855 | 12.703 | 1.362 | 0.94 | 82.7 | high |
| 10 | Camilo Vargas | Colombia | GK | md2 | Congo DR | 79.102 | strong_candidate | 6.295 | 5.855 | 12.684 | 1.362 | 0.94 | 82.7 | high |

### DEF

| Rank | Name | Country | Pos | Scope | Opponent | Score | Tier | Raw | Risk | Captain | Value | Start | Min | Conf |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Nuno Alexandre Tavares Mendes | Portugal | DEF | md2 | Uzbekistan | 87.657 | top_pick_candidate | 8.252 | 7.675 | 17.223 | 1.323 | 0.892 | 74.2 | high |
| 1 | Nuno Alexandre Tavares Mendes | Portugal | DEF | md1 | Congo DR | 87.436 | top_pick_candidate | 8.193 | 7.62 | 17.066 | 1.314 | 0.892 | 74.2 | high |
| 1 | Nuno Alexandre Tavares Mendes | Portugal | DEF | md2 | Uzbekistan | 86.341 | top_pick_candidate | 8.252 | 7.675 | 17.223 | 1.323 | 0.892 | 74.2 | high |
| 1 | Nuno Alexandre Tavares Mendes | Portugal | DEF | md1 | Congo DR | 85.983 | top_pick_candidate | 8.193 | 7.62 | 17.066 | 1.314 | 0.892 | 74.2 | high |
| 4 | Daniel Muñoz | Colombia | DEF | md1 | Uzbekistan | 85.723 | top_pick_candidate | 6.537 | 6.079 | 13.596 | 1.322 | 0.94 | 77.7 | high |
| 4 | Daniel Muñoz | Colombia | DEF | md2 | Congo DR | 85.579 | top_pick_candidate | 6.44 | 5.989 | 13.368 | 1.302 | 0.94 | 77.7 | high |
| 5 | Jhon Lucumí | Colombia | DEF | md1 | Uzbekistan | 85.384 | top_pick_candidate | 5.686 | 5.288 | 11.795 | 1.23 | 0.94 | 77.7 | high |
| 5 | Jhon Lucumí | Colombia | DEF | md2 | Congo DR | 85.319 | top_pick_candidate | 5.647 | 5.251 | 11.687 | 1.221 | 0.94 | 77.7 | high |
| 7 | Joshua Kimmich | Germany | DEF | md1 | Curaçao | 85.031 | top_pick_candidate | 7.254 | 6.746 | 15.051 | 1.227 | 0.91 | 75.5 | high |
| 4 | Virgil van Dijk | Netherlands | DEF | md3 | Tunisia | 84.716 | top_pick_candidate | 6.17 | 5.738 | 12.888 | 1.043 | 0.934 | 77.2 | high |
| 9 | Willian Pacho | Ecuador | DEF | md2 | Curaçao | 84.707 | top_pick_candidate | 5.42 | 5.04 | 11.198 | 1.145 | 0.94 | 77.7 | high |
| 5 | Denzel Dumfries | Netherlands | DEF | md3 | Tunisia | 84.635 | top_pick_candidate | 7.102 | 6.605 | 15.014 | 1.159 | 0.908 | 75.4 | high |
| 2 | Nuno Alexandre Tavares Mendes | Portugal | DEF | group_stage_full | Group stage average | 84.366 | top_pick_candidate | 21.68 | 20.164 | 17.223 | 3.477 | 0.892 | 74.2 | high |
| 15 | Dávinson Sánchez | Colombia | DEF | md1 | Uzbekistan | 84.142 | top_pick_candidate | 5.304 | 4.932 | 10.997 | 1.147 | 0.94 | 77.7 | high |
| 13 | Ronald Araujo | Uruguay | DEF | md2 | Cabo Verde | 84.124 | top_pick_candidate | 6.914 | 6.43 | 14.702 | 1.286 | 0.914 | 75.8 | high |
| 14 | Dávinson Sánchez | Colombia | DEF | md2 | Congo DR | 84.103 | top_pick_candidate | 5.282 | 4.913 | 10.928 | 1.143 | 0.94 | 77.7 | high |
| 16 | Johan Mojica | Colombia | DEF | md1 | Uzbekistan | 84.101 | top_pick_candidate | 5.699 | 5.3 | 11.697 | 1.359 | 0.924 | 76.5 | high |
| 15 | Rúben dos Santos Gato Alves Dias | Portugal | DEF | md2 | Uzbekistan | 84.065 | top_pick_candidate | 5.387 | 5.01 | 11.184 | 1.002 | 0.908 | 75.4 | high |
| 16 | Johan Mojica | Colombia | DEF | md2 | Congo DR | 84.024 | top_pick_candidate | 5.65 | 5.255 | 11.581 | 1.347 | 0.924 | 76.5 | high |
| 17 | Mathías Olivera | Uruguay | DEF | md2 | Cabo Verde | 84.016 | top_pick_candidate | 6.392 | 5.944 | 13.485 | 1.382 | 0.93 | 77 | high |
| 18 | David Raum | Germany | DEF | md1 | Curaçao | 84.012 | top_pick_candidate | 7.353 | 6.838 | 15.186 | 1.396 | 0.9 | 74.8 | high |
| 19 | Ronald Araujo | Uruguay | DEF | md1 | Saudi Arabia | 83.909 | top_pick_candidate | 6.89 | 6.408 | 14.607 | 1.282 | 0.914 | 75.8 | high |
| 20 | Rúben dos Santos Gato Alves Dias | Portugal | DEF | md1 | Congo DR | 83.901 | top_pick_candidate | 5.37 | 4.994 | 11.102 | 0.999 | 0.908 | 75.4 | high |
| 22 | Aymeric Laporte | Spain | DEF | md1 | Cabo Verde | 83.807 | top_pick_candidate | 5.734 | 5.332 | 12.12 | 0.969 | 0.894 | 74.4 | high |
| 19 | Piero Hincapié | Ecuador | DEF | md2 | Curaçao | 83.759 | top_pick_candidate | 5.678 | 5.281 | 11.688 | 1.124 | 0.93 | 77 | high |

### MID

| Rank | Name | Country | Pos | Scope | Opponent | Score | Tier | Raw | Risk | Captain | Value | Start | Min | Conf |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2 | Bruno Miguel Borges Fernandes | Portugal | MID | md2 | Uzbekistan | 90.477 | top_pick_candidate | 8.122 | 7.554 | 17.457 | 0.889 | 0.92 | 68.9 | high |
| 3 | Bruno Miguel Borges Fernandes | Portugal | MID | md1 | Congo DR | 88.904 | top_pick_candidate | 7.965 | 7.408 | 17.068 | 0.872 | 0.92 | 68.9 | high |
| 2 | Bruno Miguel Borges Fernandes | Portugal | MID | md2 | Uzbekistan | 87.192 | top_pick_candidate | 8.122 | 7.554 | 17.457 | 0.889 | 0.92 | 68.9 | high |
| 4 | Enzo Fernández | Argentina | MID | md3 | Jordan | 86.66 | top_pick_candidate | 7.481 | 6.957 | 16.342 | 0.928 | 0.95 | 70.8 | high |
| 3 | Bruno Miguel Borges Fernandes | Portugal | MID | md1 | Congo DR | 86.64 | top_pick_candidate | 7.965 | 7.408 | 17.068 | 0.872 | 0.92 | 68.9 | high |
| 4 | Lamine Yamal Nasraoui Ebana | Spain | MID | md1 | Cabo Verde | 86.592 | top_pick_candidate | 8.684 | 8.076 | 18.795 | 0.808 | 0.896 | 67.3 | high |
| 2 | Enzo Fernández | Argentina | MID | md3 | Jordan | 86.03 | top_pick_candidate | 7.481 | 6.957 | 16.342 | 0.928 | 0.95 | 70.8 | high |
| 5 | Giorgian de Arrascaeta | Uruguay | MID | md2 | Cabo Verde | 85.413 | top_pick_candidate | 7.818 | 7.271 | 17.1 | 1.119 | 0.923 | 69.1 | high |
| 5 | Luis Díaz | Colombia | MID | md1 | Uzbekistan | 85.374 | top_pick_candidate | 8.47 | 7.877 | 18.278 | 0.972 | 0.95 | 70.8 | high |
| 4 | Bruno Miguel Borges Fernandes | Portugal | MID | group_stage_full | Group stage average | 85.181 | top_pick_candidate | 21.845 | 20.317 | 17.457 | 2.39 | 0.92 | 68.9 | high |
| 6 | Enzo Fernández | Argentina | MID | md1 | Algeria | 85.053 | top_pick_candidate | 7.481 | 6.957 | 16.289 | 0.928 | 0.95 | 70.8 | high |
| 8 | Enzo Fernández | Argentina | MID | md1 | Algeria | 85.022 | top_pick_candidate | 7.481 | 6.957 | 16.289 | 0.928 | 0.95 | 70.8 | high |
| 1 | Bruno Miguel Borges Fernandes | Portugal | MID | group_stage_full | Group stage average | 84.962 | top_pick_candidate | 21.845 | 20.317 | 17.457 | 2.39 | 0.92 | 68.9 | high |
| 7 | Enzo Fernández | Argentina | MID | md2 | Austria | 84.831 | top_pick_candidate | 7.396 | 6.878 | 16.052 | 0.917 | 0.95 | 70.8 | high |
| 2 | Bruno Miguel Borges Fernandes | Portugal | MID | md2 | Uzbekistan | 84.75 | top_pick_candidate | 8.122 | 7.554 | 17.457 | 0.889 | 0.92 | 68.9 | high |
| 7 | Luis Díaz | Colombia | MID | md2 | Congo DR | 84.716 | top_pick_candidate | 8.384 | 7.797 | 18.099 | 0.963 | 0.95 | 70.8 | high |
| 11 | Mikel Merino | Spain | MID | md1 | Cabo Verde | 84.709 | top_pick_candidate | 6.135 | 5.705 | 13.48 | 0.92 | 0.908 | 68.1 | high |
| 8 | Lamine Yamal Nasraoui Ebana | Spain | MID | md2 | Saudi Arabia | 84.592 | top_pick_candidate | 8.684 | 8.076 | 18.79 | 0.808 | 0.896 | 67.3 | high |
| 3 | Bruno Miguel Borges Fernandes | Portugal | MID | md2 | Uzbekistan | 84.525 | top_pick_candidate | 8.122 | 7.554 | 17.457 | 0.889 | 0.92 | 68.9 | high |
| 9 | Michael Olise | France | MID | md2 | Iraq | 84.467 | top_pick_candidate | 8.563 | 7.964 | 18.558 | 0.838 | 0.92 | 68.9 | high |
| 14 | Florian Wirtz | Germany | MID | md1 | Curaçao | 84.414 | top_pick_candidate | 6.615 | 6.152 | 14.284 | 0.82 | 0.923 | 69.1 | high |
| 10 | Enzo Fernández | Argentina | MID | md2 | Austria | 84.255 | top_pick_candidate | 7.396 | 6.878 | 16.052 | 0.917 | 0.95 | 70.8 | high |
| 5 | Enzo Fernández | Argentina | MID | group_stage_full | Group stage average | 84.25 | top_pick_candidate | 22.358 | 20.792 | 16.342 | 2.772 | 0.95 | 70.8 | high |
| 4 | Enzo Fernández | Argentina | MID | group_stage_full | Group stage average | 83.999 | top_pick_candidate | 22.358 | 20.792 | 16.342 | 2.772 | 0.95 | 70.8 | high |
| 2 | Bruno Miguel Borges Fernandes | Portugal | MID | md1 | Congo DR | 83.591 | top_pick_candidate | 7.965 | 7.408 | 17.068 | 0.872 | 0.92 | 68.9 | high |

### FWD

| Rank | Name | Country | Pos | Scope | Opponent | Score | Tier | Raw | Risk | Captain | Value | Start | Min | Conf |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Lionel Messi | Argentina | FWD | md3 | Jordan | 96.249 | top_pick_candidate | 8.119 | 7.55 | 17.928 | 0.755 | 0.95 | 65.3 | high |
| 1 | Lionel Messi | Argentina | FWD | md1 | Algeria | 94.54 | top_pick_candidate | 8.119 | 7.55 | 17.875 | 0.755 | 0.95 | 65.3 | high |
| 1 | Lionel Messi | Argentina | FWD | md2 | Austria | 94.437 | top_pick_candidate | 8.119 | 7.55 | 17.827 | 0.755 | 0.95 | 65.3 | high |
| 1 | Lionel Messi | Argentina | FWD | group_stage_full | Group stage average | 93.92 | top_pick_candidate | 24.357 | 22.65 | 17.928 | 2.265 | 0.95 | 65.3 | high |
| 1 | Lionel Messi | Argentina | FWD | md3 | Jordan | 92.325 | top_pick_candidate | 8.119 | 7.55 | 17.928 | 0.755 | 0.95 | 65.3 | high |
| 2 | Harry Kane | England | FWD | md3 | Panama | 91.185 | top_pick_candidate | 7.552 | 7.023 | 16.804 | 0.669 | 0.944 | 65 | high |
| 3 | Harry Kane | England | FWD | md2 | Ghana | 90.449 | top_pick_candidate | 7.552 | 7.023 | 16.855 | 0.669 | 0.944 | 65 | high |
| 1 | Lionel Messi | Argentina | FWD | md1 | Algeria | 89.107 | top_pick_candidate | 8.119 | 7.55 | 17.875 | 0.755 | 0.95 | 65.3 | high |
| 2 | Harry Kane | England | FWD | md1 | Croatia | 88.993 | top_pick_candidate | 7.265 | 6.757 | 16.033 | 0.644 | 0.944 | 65 | high |
| 2 | Harry Kane | England | FWD | group_stage_full | Group stage average | 88.94 | top_pick_candidate | 22.369 | 20.803 | 16.855 | 1.981 | 0.944 | 65 | high |
| 1 | Lionel Messi | Argentina | FWD | md2 | Austria | 88.786 | top_pick_candidate | 8.119 | 7.55 | 17.827 | 0.755 | 0.95 | 65.3 | high |
| 3 | Kylian Mbappé | France | FWD | md3 | Norway | 88.395 | top_pick_candidate | 7.083 | 6.587 | 15.77 | 0.627 | 0.912 | 63.2 | high |
| 4 | Kylian Mbappé | France | FWD | md2 | Iraq | 88.067 | top_pick_candidate | 7.281 | 6.772 | 16.349 | 0.645 | 0.912 | 63.2 | high |
| 1 | Lionel Messi | Argentina | FWD | group_stage_full | Group stage average | 86.254 | top_pick_candidate | 24.357 | 22.65 | 17.928 | 2.265 | 0.95 | 65.3 | high |
| 3 | Kylian Mbappé | France | FWD | group_stage_full | Group stage average | 86.18 | top_pick_candidate | 21.405 | 19.907 | 16.349 | 1.896 | 0.912 | 63.2 | high |
| 1 | Lionel Messi | Argentina | FWD | md3 | Jordan | 86.03 | top_pick_candidate | 8.119 | 7.55 | 17.928 | 0.755 | 0.95 | 65.3 | high |
| 5 | Lautaro Martínez | Argentina | FWD | md3 | Jordan | 85.898 | top_pick_candidate | 6.428 | 5.978 | 14.748 | 0.679 | 0.944 | 65 | high |
| 6 | Cristiano Ronaldo dos Santos Aveiro | Portugal | FWD | md2 | Uzbekistan | 85.275 | top_pick_candidate | 6.686 | 6.218 | 15.177 | 0.622 | 0.92 | 63.7 | high |
| 9 | Lionel Messi | Argentina | FWD | md1 | Algeria | 84.998 | top_pick_candidate | 8.119 | 7.55 | 17.875 | 0.755 | 0.95 | 65.3 | high |
| 7 | Kylian Mbappé | France | FWD | md1 | Senegal | 84.94 | top_pick_candidate | 7.041 | 6.548 | 15.633 | 0.624 | 0.912 | 63.2 | high |
| 6 | Lionel Messi | Argentina | FWD | md2 | Austria | 84.925 | top_pick_candidate | 8.119 | 7.55 | 17.827 | 0.755 | 0.95 | 65.3 | high |
| 8 | Cristiano Ronaldo dos Santos Aveiro | Portugal | FWD | md1 | Congo DR | 84.906 | top_pick_candidate | 6.676 | 6.209 | 15.113 | 0.621 | 0.92 | 63.7 | high |
| 10 | Harry Kane | England | FWD | md1 | Croatia | 84.867 | top_pick_candidate | 7.265 | 6.757 | 16.033 | 0.644 | 0.944 | 65 | high |
| 11 | Harry Kane | England | FWD | md2 | Ghana | 84.615 | top_pick_candidate | 7.552 | 7.023 | 16.855 | 0.669 | 0.944 | 65 | high |
| 6 | Harry Kane | England | FWD | md3 | Panama | 84.583 | top_pick_candidate | 7.552 | 7.023 | 16.804 | 0.669 | 0.944 | 65 | high |

## Top Captain Candidates

| Rank | Name | Country | Pos | Scope | Opponent | Score | Tier | Raw | Risk | Captain | Value | Start | Min | Conf |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Lionel Messi | Argentina | FWD | md3 | Jordan | 96.249 | top_pick_candidate | 8.119 | 7.55 | 17.928 | 0.755 | 0.95 | 65.3 | high |
| 1 | Lionel Messi | Argentina | FWD | md1 | Algeria | 94.54 | top_pick_candidate | 8.119 | 7.55 | 17.875 | 0.755 | 0.95 | 65.3 | high |
| 1 | Lionel Messi | Argentina | FWD | md2 | Austria | 94.437 | top_pick_candidate | 8.119 | 7.55 | 17.827 | 0.755 | 0.95 | 65.3 | high |
| 1 | Lionel Messi | Argentina | FWD | group_stage_full | Group stage average | 93.92 | top_pick_candidate | 24.357 | 22.65 | 17.928 | 2.265 | 0.95 | 65.3 | high |
| 2 | Harry Kane | England | FWD | md3 | Panama | 91.185 | top_pick_candidate | 7.552 | 7.023 | 16.804 | 0.669 | 0.944 | 65 | high |
| 2 | Bruno Miguel Borges Fernandes | Portugal | MID | md2 | Uzbekistan | 90.477 | top_pick_candidate | 8.122 | 7.554 | 17.457 | 0.889 | 0.92 | 68.9 | high |
| 3 | Harry Kane | England | FWD | md2 | Ghana | 90.449 | top_pick_candidate | 7.552 | 7.023 | 16.855 | 0.669 | 0.944 | 65 | high |
| 2 | Harry Kane | England | FWD | md1 | Croatia | 88.993 | top_pick_candidate | 7.265 | 6.757 | 16.033 | 0.644 | 0.944 | 65 | high |
| 2 | Harry Kane | England | FWD | group_stage_full | Group stage average | 88.94 | top_pick_candidate | 22.369 | 20.803 | 16.855 | 1.981 | 0.944 | 65 | high |
| 3 | Bruno Miguel Borges Fernandes | Portugal | MID | md1 | Congo DR | 88.904 | top_pick_candidate | 7.965 | 7.408 | 17.068 | 0.872 | 0.92 | 68.9 | high |
| 3 | Kylian Mbappé | France | FWD | md3 | Norway | 88.395 | top_pick_candidate | 7.083 | 6.587 | 15.77 | 0.627 | 0.912 | 63.2 | high |
| 4 | Kylian Mbappé | France | FWD | md2 | Iraq | 88.067 | top_pick_candidate | 7.281 | 6.772 | 16.349 | 0.645 | 0.912 | 63.2 | high |
| 4 | Enzo Fernández | Argentina | MID | md3 | Jordan | 86.66 | top_pick_candidate | 7.481 | 6.957 | 16.342 | 0.928 | 0.95 | 70.8 | high |
| 4 | Lamine Yamal Nasraoui Ebana | Spain | MID | md1 | Cabo Verde | 86.592 | top_pick_candidate | 8.684 | 8.076 | 18.795 | 0.808 | 0.896 | 67.3 | high |
| 3 | Kylian Mbappé | France | FWD | group_stage_full | Group stage average | 86.18 | top_pick_candidate | 21.405 | 19.907 | 16.349 | 1.896 | 0.912 | 63.2 | high |
| 5 | Lautaro Martínez | Argentina | FWD | md3 | Jordan | 85.898 | top_pick_candidate | 6.428 | 5.978 | 14.748 | 0.679 | 0.944 | 65 | high |
| 5 | Giorgian de Arrascaeta | Uruguay | MID | md2 | Cabo Verde | 85.413 | top_pick_candidate | 7.818 | 7.271 | 17.1 | 1.119 | 0.923 | 69.1 | high |
| 5 | Luis Díaz | Colombia | MID | md1 | Uzbekistan | 85.374 | top_pick_candidate | 8.47 | 7.877 | 18.278 | 0.972 | 0.95 | 70.8 | high |
| 6 | Cristiano Ronaldo dos Santos Aveiro | Portugal | FWD | md2 | Uzbekistan | 85.275 | top_pick_candidate | 6.686 | 6.218 | 15.177 | 0.622 | 0.92 | 63.7 | high |
| 4 | Bruno Miguel Borges Fernandes | Portugal | MID | group_stage_full | Group stage average | 85.181 | top_pick_candidate | 21.845 | 20.317 | 17.457 | 2.39 | 0.92 | 68.9 | high |
| 6 | Enzo Fernández | Argentina | MID | md1 | Algeria | 85.053 | top_pick_candidate | 7.481 | 6.957 | 16.289 | 0.928 | 0.95 | 70.8 | high |
| 7 | Kylian Mbappé | France | FWD | md1 | Senegal | 84.94 | top_pick_candidate | 7.041 | 6.548 | 15.633 | 0.624 | 0.912 | 63.2 | high |
| 8 | Cristiano Ronaldo dos Santos Aveiro | Portugal | FWD | md1 | Congo DR | 84.906 | top_pick_candidate | 6.676 | 6.209 | 15.113 | 0.621 | 0.92 | 63.7 | high |
| 7 | Luis Díaz | Colombia | MID | md2 | Congo DR | 84.716 | top_pick_candidate | 8.384 | 7.797 | 18.099 | 0.963 | 0.95 | 70.8 | high |
| 8 | Lamine Yamal Nasraoui Ebana | Spain | MID | md2 | Saudi Arabia | 84.592 | top_pick_candidate | 8.684 | 8.076 | 18.79 | 0.808 | 0.896 | 67.3 | high |

## Top Value-Looking Candidates

| Rank | Name | Country | Pos | Scope | Opponent | Score | Tier | Raw | Risk | Captain | Value | Start | Min | Conf |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2 | Nicolás Tagliafico | Argentina | DEF | group_stage_full | Group stage average | 80.481 | top_pick_candidate | 20.294 | 18.873 | 14.335 | 4.389 | 0.93 | 77 | high |
| 14 | Nicolás Tagliafico | Argentina | DEF | group_stage_full | Group stage average | 81.73 | top_pick_candidate | 20.294 | 18.873 | 14.335 | 4.389 | 0.93 | 77 | high |
| 18 | Nicolás Tagliafico | Argentina | DEF | group_stage_full | Group stage average | 66.187 | strong_candidate | 20.294 | 18.873 | 14.335 | 4.389 | 0.93 | 77 | high |
| 6 | Nicolás Tagliafico | Argentina | DEF | group_stage_full | Group stage average | 65.291 | watchlist_candidate | 20.294 | 18.873 | 14.335 | 4.389 | 0.93 | 77 | high |
| 24 | Nicolás Tagliafico | Argentina | DEF | group_stage_full | Group stage average | 63.5 | watchlist_candidate | 20.294 | 18.873 | 14.335 | 4.389 | 0.93 | 77 | high |
| 7 | Nahuel Molina | Argentina | DEF | group_stage_full | Group stage average | 76.612 | strong_candidate | 18.434 | 17.143 | 12.677 | 3.896 | 0.93 | 77 | high |
| 8 | Nahuel Molina | Argentina | DEF | group_stage_full | Group stage average | 82.433 | top_pick_candidate | 18.434 | 17.143 | 12.677 | 3.896 | 0.93 | 77 | high |
| 15 | Silvan Widmer | Switzerland | DEF | group_stage_full | Group stage average | 74.037 | strong_candidate | 17.429 | 16.21 | 14.001 | 3.86 | 0.908 | 75.4 | high |
| 2 | Silvan Widmer | Switzerland | DEF | group_stage_full | Group stage average | 70.39 | strong_candidate | 17.429 | 16.21 | 14.001 | 3.86 | 0.908 | 75.4 | high |
| 8 | Nico O'Reilly | England | DEF | group_stage_full | Group stage average | 76.118 | strong_candidate | 19.499 | 18.133 | 14.775 | 3.858 | 0.876 | 73.1 | high |
| 21 | Nico O'Reilly | England | DEF | group_stage_full | Group stage average | 62.743 | watchlist_candidate | 19.499 | 18.133 | 14.775 | 3.858 | 0.876 | 73.1 | high |
| 25 | Nico O'Reilly | England | DEF | group_stage_full | Group stage average | 61.327 | watchlist_candidate | 19.499 | 18.133 | 14.775 | 3.858 | 0.876 | 73.1 | high |
| 19 | Jarell Quansah | England | DEF | group_stage_full | Group stage average | 55.662 | watchlist_candidate | 17.068 | 15.874 | 13.082 | 3.608 | 0.868 | 72.5 | high |
| 21 | Gonzalo Montiel | Argentina | DEF | group_stage_full | Group stage average | 54.325 | watchlist_candidate | 16.655 | 15.489 | 12.201 | 3.602 | 0.75 | 64 | high |
| 14 | Nicolás Otamendi | Argentina | DEF | group_stage_full | Group stage average | 74.046 | strong_candidate | 16.955 | 15.768 | 11.935 | 3.584 | 0.94 | 77.7 | high |
| 13 | Nicolás Otamendi | Argentina | DEF | group_stage_full | Group stage average | 82.021 | top_pick_candidate | 16.955 | 15.768 | 11.935 | 3.584 | 0.94 | 77.7 | high |
| 13 | Camilo Vargas | Colombia | GK | group_stage_full | Group stage average | 74.146 | strong_candidate | 16.551 | 15.394 | 12.703 | 3.58 | 0.94 | 82.7 | high |
| 6 | Camilo Vargas | Colombia | GK | group_stage_full | Group stage average | 83.709 | top_pick_candidate | 16.551 | 15.394 | 12.703 | 3.58 | 0.94 | 82.7 | high |
| 17 | Santiago Mele | Uruguay | GK | group_stage_full | Group stage average | 57.077 | watchlist_candidate | 13.177 | 12.254 | 11.189 | 3.501 | 0.872 | 76.7 | high |
| 19 | David Raum | Germany | DEF | group_stage_full | Group stage average | 73.709 | strong_candidate | 18.323 | 17.04 | 15.186 | 3.478 | 0.9 | 74.8 | high |
| 24 | David Raum | Germany | DEF | group_stage_full | Group stage average | 60.158 | watchlist_candidate | 18.323 | 17.04 | 15.186 | 3.478 | 0.9 | 74.8 | high |
| 24 | David Raum | Germany | DEF | group_stage_full | Group stage average | 52.749 | watchlist_candidate | 18.323 | 17.04 | 15.186 | 3.478 | 0.9 | 74.8 | high |
| 3 | Nuno Alexandre Tavares Mendes | Portugal | DEF | group_stage_full | Group stage average | 80.253 | top_pick_candidate | 21.68 | 20.164 | 17.223 | 3.477 | 0.892 | 74.2 | high |
| 2 | Nuno Alexandre Tavares Mendes | Portugal | DEF | group_stage_full | Group stage average | 84.366 | top_pick_candidate | 21.68 | 20.164 | 17.223 | 3.477 | 0.892 | 74.2 | high |
| 11 | Nuno Alexandre Tavares Mendes | Portugal | DEF | group_stage_full | Group stage average | 71.624 | strong_candidate | 21.68 | 20.164 | 17.223 | 3.477 | 0.892 | 74.2 | high |

## Projection Components For Top Candidates By Mode

| Mode | Rank | Name | Pos | Scope | Opponent | App | Att | Ast | CS | GC | Save | Tackle | Chance | SOT | Card | Bonus | Raw | Risk | Captain |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Balanced | 1 | Nuno Alexandre Tavares Mendes | DEF | md2 | Uzbekistan | 1.892 | 1.75 | 1.576 | 3.143 | -0.049 | 0 | 0 | 0 | 0 | -0.059 | 0 | 8.252 | 7.675 | 17.223 |
| Balanced | 1 | Nuno Alexandre Tavares Mendes | DEF | md1 | Congo DR | 1.892 | 1.75 | 1.516 | 3.143 | -0.049 | 0 | 0 | 0 | 0 | -0.059 | 0 | 8.193 | 7.62 | 17.066 |
| Balanced | 2 | Bruno Miguel Borges Fernandes | MID | md2 | Uzbekistan | 1.867 | 2.813 | 1.367 | 0.611 | 0 | 0 | 0.416 | 1.15 | 0 | -0.102 | 0 | 8.122 | 7.554 | 17.457 |
| Balanced | 1 | Lionel Messi | FWD | md3 | Jordan | 1.832 | 3.75 | 1.65 | 0 | 0 | 0 | 0 | 0 | 0.95 | -0.063 | 0 | 8.119 | 7.55 | 17.928 |
| Balanced | 2 | Bruno Miguel Borges Fernandes | MID | md1 | Congo DR | 1.867 | 2.708 | 1.315 | 0.611 | 0 | 0 | 0.416 | 1.15 | 0 | -0.102 | 0 | 7.965 | 7.408 | 17.068 |
| Safe | 1 | Nuno Alexandre Tavares Mendes | DEF | md2 | Uzbekistan | 1.892 | 1.75 | 1.576 | 3.143 | -0.049 | 0 | 0 | 0 | 0 | -0.059 | 0 | 8.252 | 7.675 | 17.223 |
| Safe | 1 | Nuno Alexandre Tavares Mendes | DEF | md1 | Congo DR | 1.892 | 1.75 | 1.516 | 3.143 | -0.049 | 0 | 0 | 0 | 0 | -0.059 | 0 | 8.193 | 7.62 | 17.066 |
| Safe | 2 | Bruno Miguel Borges Fernandes | MID | md2 | Uzbekistan | 1.867 | 2.813 | 1.367 | 0.611 | 0 | 0 | 0.416 | 1.15 | 0 | -0.102 | 0 | 8.122 | 7.554 | 17.457 |
| Safe | 2 | Camilo Vargas | GK | md1 | Uzbekistan | 1.94 | 0 | 0.12 | 3.312 | -0.051 | 1.03 | 0 | 0 | 0 | -0.056 | 0 | 6.295 | 5.855 | 12.703 |
| Safe | 3 | Camilo Vargas | GK | md2 | Congo DR | 1.94 | 0 | 0.12 | 3.312 | -0.051 | 1.03 | 0 | 0 | 0 | -0.056 | 0 | 6.295 | 5.855 | 12.684 |
| Upside | 1 | Lionel Messi | FWD | md3 | Jordan | 1.832 | 3.75 | 1.65 | 0 | 0 | 0 | 0 | 0 | 0.95 | -0.063 | 0 | 8.119 | 7.55 | 17.928 |
| Upside | 1 | Lionel Messi | FWD | md1 | Algeria | 1.832 | 3.75 | 1.65 | 0 | 0 | 0 | 0 | 0 | 0.95 | -0.063 | 0 | 8.119 | 7.55 | 17.875 |
| Upside | 1 | Lionel Messi | FWD | md2 | Austria | 1.832 | 3.75 | 1.65 | 0 | 0 | 0 | 0 | 0 | 0.95 | -0.063 | 0 | 8.119 | 7.55 | 17.827 |
| Upside | 1 | Lionel Messi | FWD | group_stage_full | Group stage average | 5.496 | 11.25 | 4.95 | 0 | 0 | 0 | 0 | 0 | 2.85 | -0.189 | 0 | 24.357 | 22.65 | 17.928 |
| Upside | 2 | Harry Kane | FWD | md2 | Ghana | 1.822 | 3.75 | 1.058 | 0 | 0 | 0 | 0 | 0 | 0.95 | -0.027 | 0 | 7.552 | 7.023 | 16.855 |
| Differential | 1 | Giorgian de Arrascaeta | MID | md1 | Saudi Arabia | 1.873 | 3.196 | 1.465 | 0.616 | 0 | 0 | 0.225 | 0.281 | 0 | -0.114 | 0 | 7.541 | 7.013 | 16.481 |
| Differential | 1 | Nicolas Jackson | FWD | md3 | Iraq | 1.515 | 3.576 | 0.529 | 0 | 0 | 0 | 0 | 0 | 0.784 | -0.222 | 0 | 6.181 | 5.748 | 14.084 |
| Differential | 1 | Hiroki Ito | DEF | md2 | Tunisia | 1.89 | 1.209 | 0.381 | 3.136 | -0.049 | 0 | 0 | 0 | 0 | 0 | 0 | 6.567 | 6.107 | 13.689 |
| Differential | 2 | Luis Suárez | FWD | md1 | Uzbekistan | 1.479 | 3.75 | 0.575 | 0 | 0 | 0 | 0 | 0 | 0.803 | -0.139 | 0 | 6.468 | 6.015 | 14.716 |
| Differential | 2 | Luis Suárez | FWD | md2 | Congo DR | 1.479 | 3.75 | 0.541 | 0 | 0 | 0 | 0 | 0 | 0.803 | -0.139 | 0 | 6.433 | 5.983 | 14.631 |
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

Brazil uncertainty candidate rows: 19.

| Rank | Name | Country | Pos | Scope | Opponent | Score | Tier | Raw | Risk | Captain | Value | Start | Min | Conf |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 18 | Raphael Dias Belloli | Brazil | MID | group_stage_full | Group stage average | 73.773 | strong_candidate | 24.93 | 23.187 | 18.544 | 2.828 | 0.95 | 70.8 | high |
| 9 | Raphael Dias Belloli | Brazil | MID | group_stage_full | Group stage average | 71.788 | strong_candidate | 24.93 | 23.187 | 18.544 | 2.828 | 0.95 | 70.8 | high |
| 20 | Vinícius José Paixão de Oliveira Júnior | Brazil | MID | group_stage_full | Group stage average | 63.004 | watchlist_candidate | 22.429 | 20.859 | 17.378 | 2.086 | 0.95 | 70.8 | high |
| 11 | Raphael Dias Belloli | Brazil | MID | group_stage_full | Group stage average | 60.91 | watchlist_candidate | 24.93 | 23.187 | 18.544 | 2.828 | 0.95 | 70.8 | high |
| 16 | Raphael Dias Belloli | Brazil | MID | group_stage_full | Group stage average | 74.521 | strong_candidate | 24.93 | 23.187 | 18.544 | 2.828 | 0.95 | 70.8 | high |
| 22 | Raphael Dias Belloli | Brazil | MID | md1 | Morocco | 68.98 | strong_candidate | 8.081 | 7.516 | 17.35 | 0.917 | 0.95 | 70.8 | high |
| 14 | Raphael Dias Belloli | Brazil | MID | md2 | Haiti | 78.618 | strong_candidate | 8.555 | 7.957 | 18.544 | 0.97 | 0.95 | 70.8 | high |
| 25 | Bruno Guimarães Rodriguez Moura | Brazil | MID | md2 | Haiti | 75.426 | strong_candidate | 6.247 | 5.81 | 13.497 | 0.854 | 0.95 | 70.8 | high |
| 21 | Alisson Ramsés Becker | Brazil | GK | md2 | Haiti | 83.296 | top_pick_candidate | 5.809 | 5.402 | 11.892 | 1.08 | 0.932 | 82 | high |
| 23 | Bruno Guimarães Rodriguez Moura | Brazil | MID | md2 | Haiti | 83.211 | top_pick_candidate | 6.247 | 5.81 | 13.497 | 0.854 | 0.95 | 70.8 | high |
| 8 | Raphael Dias Belloli | Brazil | MID | md2 | Haiti | 80.21 | top_pick_candidate | 8.555 | 7.957 | 18.544 | 0.97 | 0.95 | 70.8 | high |
| 18 | Vinícius José Paixão de Oliveira Júnior | Brazil | MID | md2 | Haiti | 73.418 | strong_candidate | 7.936 | 7.38 | 17.378 | 0.738 | 0.95 | 70.8 | high |
| 9 | Raphael Dias Belloli | Brazil | MID | md2 | Haiti | 66.064 | strong_candidate | 8.555 | 7.957 | 18.544 | 0.97 | 0.95 | 70.8 | high |
| 15 | Raphael Dias Belloli | Brazil | MID | md2 | Haiti | 78.945 | strong_candidate | 8.555 | 7.957 | 18.544 | 0.97 | 0.95 | 70.8 | high |
| 21 | Raphael Dias Belloli | Brazil | MID | md3 | Scotland | 75.276 | strong_candidate | 8.294 | 7.714 | 17.898 | 0.941 | 0.95 | 70.8 | high |
| 9 | Raphael Dias Belloli | Brazil | MID | md3 | Scotland | 73.858 | strong_candidate | 8.294 | 7.714 | 17.898 | 0.941 | 0.95 | 70.8 | high |
| 23 | Vinícius José Paixão de Oliveira Júnior | Brazil | MID | md3 | Scotland | 65.971 | watchlist_candidate | 7.592 | 7.061 | 16.495 | 0.706 | 0.95 | 70.8 | high |
| 10 | Raphael Dias Belloli | Brazil | MID | md3 | Scotland | 61.837 | watchlist_candidate | 8.294 | 7.714 | 17.898 | 0.941 | 0.95 | 70.8 | high |
| 15 | Raphael Dias Belloli | Brazil | MID | md3 | Scotland | 75.226 | strong_candidate | 8.294 | 7.714 | 17.898 | 0.941 | 0.95 | 70.8 | high |

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
| Safe | 1 | Nuno Alexandre Tavares Mendes | DEF | md2 | Uzbekistan | 1.892 | 1.75 | 1.576 | 3.143 | -0.049 | 0 | 0 | 0 | 0 | -0.059 | 0 | 8.252 | 7.675 | 17.223 |
| Safe | 1 | Nuno Alexandre Tavares Mendes | DEF | md1 | Congo DR | 1.892 | 1.75 | 1.516 | 3.143 | -0.049 | 0 | 0 | 0 | 0 | -0.059 | 0 | 8.193 | 7.62 | 17.066 |
| Balanced | 1 | Nuno Alexandre Tavares Mendes | DEF | md2 | Uzbekistan | 1.892 | 1.75 | 1.576 | 3.143 | -0.049 | 0 | 0 | 0 | 0 | -0.059 | 0 | 8.252 | 7.675 | 17.223 |
| Balanced | 1 | Nuno Alexandre Tavares Mendes | DEF | md1 | Congo DR | 1.892 | 1.75 | 1.516 | 3.143 | -0.049 | 0 | 0 | 0 | 0 | -0.059 | 0 | 8.193 | 7.62 | 17.066 |
| Safe | 2 | Nuno Alexandre Tavares Mendes | DEF | group_stage_full | Group stage average | 5.676 | 4.907 | 3.893 | 7.84 | -0.457 | 0 | 0 | 0 | 0 | -0.177 | 0 | 21.68 | 20.164 | 17.223 |
| Upside | 6 | Nuno Alexandre Tavares Mendes | DEF | md2 | Uzbekistan | 1.892 | 1.75 | 1.576 | 3.143 | -0.049 | 0 | 0 | 0 | 0 | -0.059 | 0 | 8.252 | 7.675 | 17.223 |
| Balanced | 3 | Nuno Alexandre Tavares Mendes | DEF | group_stage_full | Group stage average | 5.676 | 4.907 | 3.893 | 7.84 | -0.457 | 0 | 0 | 0 | 0 | -0.177 | 0 | 21.68 | 20.164 | 17.223 |
| Upside | 4 | Nuno Alexandre Tavares Mendes | DEF | md1 | Congo DR | 1.892 | 1.75 | 1.516 | 3.143 | -0.049 | 0 | 0 | 0 | 0 | -0.059 | 0 | 8.193 | 7.62 | 17.066 |
| Captain Alpha | 22 | Nuno Alexandre Tavares Mendes | DEF | md2 | Uzbekistan | 1.892 | 1.75 | 1.576 | 3.143 | -0.049 | 0 | 0 | 0 | 0 | -0.059 | 0 | 8.252 | 7.675 | 17.223 |
| Captain Alpha | 20 | Nuno Alexandre Tavares Mendes | DEF | md1 | Congo DR | 1.892 | 1.75 | 1.516 | 3.143 | -0.049 | 0 | 0 | 0 | 0 | -0.059 | 0 | 8.193 | 7.62 | 17.066 |

### Camilo Vargas

| Mode | Rank | Name | Pos | Scope | Opponent | App | Att | Ast | CS | GC | Save | Tackle | Chance | SOT | Card | Bonus | Raw | Risk | Captain |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Safe | 2 | Camilo Vargas | GK | md1 | Uzbekistan | 1.94 | 0 | 0.12 | 3.312 | -0.051 | 1.03 | 0 | 0 | 0 | -0.056 | 0 | 6.295 | 5.855 | 12.703 |
| Safe | 3 | Camilo Vargas | GK | md2 | Congo DR | 1.94 | 0 | 0.12 | 3.312 | -0.051 | 1.03 | 0 | 0 | 0 | -0.056 | 0 | 6.295 | 5.855 | 12.684 |
| Safe | 6 | Camilo Vargas | GK | group_stage_full | Group stage average | 5.82 | 0 | 0.306 | 8.064 | -0.562 | 3.09 | 0 | 0 | 0 | -0.168 | 0 | 16.551 | 15.394 | 12.703 |
| Balanced | 13 | Camilo Vargas | GK | md1 | Uzbekistan | 1.94 | 0 | 0.12 | 3.312 | -0.051 | 1.03 | 0 | 0 | 0 | -0.056 | 0 | 6.295 | 5.855 | 12.703 |
| Balanced | 10 | Camilo Vargas | GK | md2 | Congo DR | 1.94 | 0 | 0.12 | 3.312 | -0.051 | 1.03 | 0 | 0 | 0 | -0.056 | 0 | 6.295 | 5.855 | 12.684 |
| Balanced | 13 | Camilo Vargas | GK | group_stage_full | Group stage average | 5.82 | 0 | 0.306 | 8.064 | -0.562 | 3.09 | 0 | 0 | 0 | -0.168 | 0 | 16.551 | 15.394 | 12.703 |

### Nicolás Tagliafico

| Mode | Rank | Name | Pos | Scope | Opponent | App | Att | Ast | CS | GC | Save | Tackle | Chance | SOT | Card | Bonus | Raw | Risk | Captain |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Safe | 18 | Nicolás Tagliafico | DEF | md3 | Jordan | 1.93 | 1.362 | 0.678 | 3.277 | -0.051 | 0 | 0 | 0 | 0 | -0.417 | 0 | 6.78 | 6.305 | 14.335 |
| Balanced | 3 | Nicolás Tagliafico | DEF | md3 | Jordan | 1.93 | 1.362 | 0.678 | 3.277 | -0.051 | 0 | 0 | 0 | 0 | -0.417 | 0 | 6.78 | 6.305 | 14.335 |
| Safe | 14 | Nicolás Tagliafico | DEF | group_stage_full | Group stage average | 5.79 | 4.056 | 2.019 | 9.831 | -0.153 | 0 | 0 | 0 | 0 | -1.251 | 0 | 20.294 | 18.873 | 14.335 |
| Balanced | 7 | Nicolás Tagliafico | DEF | md1 | Algeria | 1.93 | 1.362 | 0.678 | 3.277 | -0.051 | 0 | 0 | 0 | 0 | -0.417 | 0 | 6.78 | 6.305 | 14.282 |
| Balanced | 2 | Nicolás Tagliafico | DEF | group_stage_full | Group stage average | 5.79 | 4.056 | 2.019 | 9.831 | -0.153 | 0 | 0 | 0 | 0 | -1.251 | 0 | 20.294 | 18.873 | 14.335 |
| Balanced | 5 | Nicolás Tagliafico | DEF | md2 | Austria | 1.93 | 1.332 | 0.663 | 3.277 | -0.051 | 0 | 0 | 0 | 0 | -0.417 | 0 | 6.734 | 6.263 | 14.134 |
| Differential | 4 | Nicolás Tagliafico | DEF | md1 | Algeria | 1.93 | 1.362 | 0.678 | 3.277 | -0.051 | 0 | 0 | 0 | 0 | -0.417 | 0 | 6.78 | 6.305 | 14.282 |
| Upside | 15 | Nicolás Tagliafico | DEF | md3 | Jordan | 1.93 | 1.362 | 0.678 | 3.277 | -0.051 | 0 | 0 | 0 | 0 | -0.417 | 0 | 6.78 | 6.305 | 14.335 |
| Upside | 25 | Nicolás Tagliafico | DEF | md1 | Algeria | 1.93 | 1.362 | 0.678 | 3.277 | -0.051 | 0 | 0 | 0 | 0 | -0.417 | 0 | 6.78 | 6.305 | 14.282 |
| Upside | 23 | Nicolás Tagliafico | DEF | md2 | Austria | 1.93 | 1.332 | 0.663 | 3.277 | -0.051 | 0 | 0 | 0 | 0 | -0.417 | 0 | 6.734 | 6.263 | 14.134 |

### Luis Suárez

| Mode | Rank | Name | Pos | Scope | Opponent | App | Att | Ast | CS | GC | Save | Tackle | Chance | SOT | Card | Bonus | Raw | Risk | Captain |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Upside | 10 | Luis Suárez | FWD | md1 | Uzbekistan | 1.479 | 3.75 | 0.575 | 0 | 0 | 0 | 0 | 0 | 0.803 | -0.139 | 0 | 6.468 | 6.015 | 14.716 |
| Upside | 14 | Luis Suárez | FWD | md2 | Congo DR | 1.479 | 3.75 | 0.541 | 0 | 0 | 0 | 0 | 0 | 0.803 | -0.139 | 0 | 6.433 | 5.983 | 14.631 |
| Differential | 2 | Luis Suárez | FWD | md1 | Uzbekistan | 1.479 | 3.75 | 0.575 | 0 | 0 | 0 | 0 | 0 | 0.803 | -0.139 | 0 | 6.468 | 6.015 | 14.716 |
| Differential | 2 | Luis Suárez | FWD | md2 | Congo DR | 1.479 | 3.75 | 0.541 | 0 | 0 | 0 | 0 | 0 | 0.803 | -0.139 | 0 | 6.433 | 5.983 | 14.631 |
| Differential | 3 | Luis Suárez | FWD | group_stage_full | Group stage average | 4.437 | 9.699 | 1.399 | 0 | 0 | 0 | 0 | 0 | 2.077 | -0.417 | 0 | 17.194 | 15.99 | 14.716 |
| Upside | 13 | Luis Suárez | FWD | group_stage_full | Group stage average | 4.437 | 9.699 | 1.399 | 0 | 0 | 0 | 0 | 0 | 2.077 | -0.417 | 0 | 17.194 | 15.99 | 14.716 |

### Lionel Messi

| Mode | Rank | Name | Pos | Scope | Opponent | App | Att | Ast | CS | GC | Save | Tackle | Chance | SOT | Card | Bonus | Raw | Risk | Captain |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Captain Alpha | 1 | Lionel Messi | FWD | md3 | Jordan | 1.832 | 3.75 | 1.65 | 0 | 0 | 0 | 0 | 0 | 0.95 | -0.063 | 0 | 8.119 | 7.55 | 17.928 |
| Captain Alpha | 1 | Lionel Messi | FWD | md1 | Algeria | 1.832 | 3.75 | 1.65 | 0 | 0 | 0 | 0 | 0 | 0.95 | -0.063 | 0 | 8.119 | 7.55 | 17.875 |
| Captain Alpha | 1 | Lionel Messi | FWD | md2 | Austria | 1.832 | 3.75 | 1.65 | 0 | 0 | 0 | 0 | 0 | 0.95 | -0.063 | 0 | 8.119 | 7.55 | 17.827 |
| Captain Alpha | 1 | Lionel Messi | FWD | group_stage_full | Group stage average | 5.496 | 11.25 | 4.95 | 0 | 0 | 0 | 0 | 0 | 2.85 | -0.189 | 0 | 24.357 | 22.65 | 17.928 |
| Upside | 1 | Lionel Messi | FWD | md3 | Jordan | 1.832 | 3.75 | 1.65 | 0 | 0 | 0 | 0 | 0 | 0.95 | -0.063 | 0 | 8.119 | 7.55 | 17.928 |
| Upside | 1 | Lionel Messi | FWD | md1 | Algeria | 1.832 | 3.75 | 1.65 | 0 | 0 | 0 | 0 | 0 | 0.95 | -0.063 | 0 | 8.119 | 7.55 | 17.875 |
| Upside | 1 | Lionel Messi | FWD | md2 | Austria | 1.832 | 3.75 | 1.65 | 0 | 0 | 0 | 0 | 0 | 0.95 | -0.063 | 0 | 8.119 | 7.55 | 17.827 |
| Upside | 1 | Lionel Messi | FWD | group_stage_full | Group stage average | 5.496 | 11.25 | 4.95 | 0 | 0 | 0 | 0 | 0 | 2.85 | -0.189 | 0 | 24.357 | 22.65 | 17.928 |
| Safe | 1 | Lionel Messi | FWD | md3 | Jordan | 1.832 | 3.75 | 1.65 | 0 | 0 | 0 | 0 | 0 | 0.95 | -0.063 | 0 | 8.119 | 7.55 | 17.928 |
| Safe | 9 | Lionel Messi | FWD | md1 | Algeria | 1.832 | 3.75 | 1.65 | 0 | 0 | 0 | 0 | 0 | 0.95 | -0.063 | 0 | 8.119 | 7.55 | 17.875 |

## V3 vs V2 Differences

- V2 unique top-pool players: 195.
- V3 unique top-pool players: 111.
- Overlapping players: 63.
- Newly appearing in v3: 48.
- Disappearing from v2: 132.
- Average list-level v2/v3 overlap rate: 0.364.

### Players Appearing In Both

| Name | Country | Pos | Mode/Source | Scope | Score |
| --- | --- | --- | --- | --- | --- |
| Lionel Messi | Argentina | FWD | balanced | group_stage_full | 80.542 |
| Nicolás Tagliafico | Argentina | DEF | balanced | group_stage_full | 80.481 |
| Enzo Fernández | Argentina | MID | balanced | group_stage_full | 80.133 |
| Bruno Miguel Borges Fernandes | Portugal | MID | balanced | group_stage_full | 79.614 |
| Harry Kane | England | FWD | balanced | group_stage_full | 76.933 |
| Nahuel Molina | Argentina | DEF | balanced | group_stage_full | 76.612 |
| Nico O'Reilly | England | DEF | balanced | group_stage_full | 76.118 |
| Lamine Yamal Nasraoui Ebana | Spain | MID | balanced | group_stage_full | 75.419 |
| Luis Díaz | Colombia | MID | balanced | group_stage_full | 74.885 |
| Kylian Mbappé | France | FWD | balanced | group_stage_full | 74.622 |
| Emiliano Martínez | Argentina | GK | balanced | group_stage_full | 74.316 |
| Camilo Vargas | Colombia | GK | balanced | group_stage_full | 74.146 |
| Nicolás Otamendi | Argentina | DEF | balanced | group_stage_full | 74.046 |
| Daniel Muñoz | Colombia | DEF | balanced | group_stage_full | 74.031 |
| Michael Olise | France | MID | balanced | group_stage_full | 73.869 |
| Raphael Dias Belloli | Brazil | MID | balanced | group_stage_full | 73.773 |
| David Raum | Germany | DEF | balanced | group_stage_full | 73.709 |
| Cristian Romero | Argentina | DEF | balanced | group_stage_full | 73.124 |
| Cristiano Ronaldo dos Santos Aveiro | Portugal | FWD | balanced | group_stage_full | 73.068 |
| Denzel Dumfries | Netherlands | DEF | balanced | group_stage_full | 73.002 |
| Lautaro Martínez | Argentina | FWD | balanced | group_stage_full | 72.871 |
| Florian Wirtz | Germany | MID | balanced | group_stage_full | 72.358 |
| Unai Simón | Spain | GK | safe | group_stage_full | 81.539 |
| Diogo Meireles da Costa | Portugal | GK | safe | group_stage_full | 81.184 |
| Rúben dos Santos Gato Alves Dias | Portugal | DEF | safe | group_stage_full | 81.137 |
| Ezri Konsa | England | DEF | safe | group_stage_full | 81.115 |
| Jordan Pickford | England | GK | safe | group_stage_full | 81.052 |
| Dávinson Sánchez | Colombia | DEF | safe | group_stage_full | 80.929 |
| Ayase Ueda | Japan | FWD | safe | group_stage_full | 80.728 |
| Luis Suárez | Colombia | FWD | upside | group_stage_full | 69.22 |

### Newly Appearing In V3

| Name | Country | Pos | Mode/Source | Scope | Score |
| --- | --- | --- | --- | --- | --- |
| Nuno Alexandre Tavares Mendes | Portugal | DEF | balanced | group_stage_full | 80.253 |
| Silvan Widmer | Switzerland | DEF | balanced | group_stage_full | 74.037 |
| Mikel Merino | Spain | MID | balanced | group_stage_full | 72.47 |
| Jhon Lucumí | Colombia | DEF | safe | group_stage_full | 82.095 |
| Declan Rice | England | MID | safe | group_stage_full | 81.183 |
| Julián Alvarez | Argentina | FWD | safe | group_stage_full | 81.157 |
| Romelu Lukaku | Belgium | FWD | upside | group_stage_full | 69.185 |
| Charles De Ketelaere | Belgium | MID | differential | group_stage_full | 71.605 |
| Johan Mojica | Colombia | DEF | differential | group_stage_full | 64.865 |
| Hiroki Ito | Japan | DEF | differential | group_stage_full | 64.24 |
| Santiago Arias | Colombia | DEF | differential | group_stage_full | 63.922 |
| Kevin Rodríguez | Ecuador | FWD | differential | group_stage_full | 57.844 |
| Nico González | Argentina | MID | differential | group_stage_full | 57.566 |
| Santiago Mele | Uruguay | GK | differential | group_stage_full | 57.077 |
| Enner Valencia | Ecuador | FWD | differential | group_stage_full | 53.902 |
| Jude Bellingham | England | MID | captain | group_stage_full | 73.279 |
| Kevin De Bruyne | Belgium | MID | captain | group_stage_full | 72.527 |
| Ronald Araujo | Uruguay | DEF | balanced | md1 | 79.008 |
| Mathías Olivera | Uruguay | DEF | balanced | md1 | 77.415 |
| Marc Cucurella | Spain | DEF | balanced | md1 | 77.412 |
| Aymeric Laporte | Spain | DEF | safe | md1 | 83.807 |
| Alexander Sørloth | Norway | FWD | upside | md1 | 70.951 |
| Torbjørn Heggem | Norway | DEF | differential | md1 | 69.872 |
| Romano Schmid | Austria | MID | differential | md1 | 61.632 |
| Michael Gregoritsch | Austria | FWD | differential | md1 | 57.108 |
| Ismael Díaz | Panama | FWD | differential | md1 | 56.795 |
| Breel Embolo | Switzerland | FWD | captain | md1 | 71.904 |
| Ritsu Doan | Japan | DEF | balanced | md2 | 78.348 |
| Willian Pacho | Ecuador | DEF | safe | md2 | 84.707 |
| Piero Hincapié | Ecuador | DEF | safe | md2 | 83.759 |

### Disappearing From V2

| Name | Country | Pos | Mode/Source | Scope | Score |
| --- | --- | --- | --- | --- | --- |
| Ivan Toney | England | FWD | v2 |  |  |
| Christian Fassnacht | Switzerland | MID | v2 |  |  |
| Moisés Ramírez | Ecuador | GK | v2 |  |  |
| Alban Lafont | Côte d'Ivoire | GK | v2 |  |  |
| Joao Felix | Portugal | FWD | v2 |  |  |
| Marvin Keller | Switzerland | GK | v2 |  |  |
| Gregor Kobel | Switzerland | GK | v2 |  |  |
| Ugurcan Cakir | Türkiye | GK | v2 |  |  |
| Ronwen Williams | South Africa | GK | v2 |  |  |
| Oliver Baumann | Germany | GK | v2 |  |  |
| Tomas Rodriguez | Panama | FWD | v2 |  |  |
| Deniz Undav | Germany | FWD | v2 |  |  |
| Julián Quiñones | Mexico | FWD | v2 |  |  |
| Nicolas Paz | Argentina | FWD | v2 |  |  |
| Orbelín Pineda | Mexico | MID | v2 |  |  |
| Igor Thiago | Brazil | FWD | v2 |  |  |
| Endrick | Brazil | FWD | v2 |  |  |
| Petar Musa | Croatia | FWD | v2 |  |  |
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
