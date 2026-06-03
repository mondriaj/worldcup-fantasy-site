# Recommendation Mode Separation Audit Fantasy Pool v3

Generated: 2026-06-03T16:56:58.583Z

Model stage: fantasy_pool_only. This audit does not promote recommendations, does not update active v2 recommendations, does not update browser-ready files, and does not make Team Builder, captain/substitution, or UX changes.

## Summary

- Before Differential winner: Nuno Alexandre Tavares Mendes (md2).
- After Differential winner: Giorgian de Arrascaeta (md1).
- After Balanced winner: Lionel Messi (md3).
- Differential repeats Balanced top row after calibration: false.
- Differential vs Balanced top-10 overlap after calibration: 0.
- Differential vs Safe top-10 overlap after calibration: 0.
- Safe for preliminary recommendation review: true.
- Safe for public recommendations: false.

## Before Mode Winners

Baseline note: Baseline from the staged fantasyPool_v3 recommendation output at the start of the mode-separation pass on 2026-06-02.

| Mode | Winner | Country | Pos | Scope | Score | Price |
| --- | --- | --- | --- | --- | --- | --- |
| Balanced | Nuno Alexandre Tavares Mendes | Portugal | DEF | md2 | 86.341 | 5.8 |
| Safe | Nuno Alexandre Tavares Mendes | Portugal | DEF | md2 | 87.657 | 5.8 |
| Upside | Lionel Messi | Argentina | FWD | md3 | 92.325 | 10 |
| Differential | Nuno Alexandre Tavares Mendes | Portugal | DEF | md2 | 77.386 | 5.8 |
| Captain Alpha | Lionel Messi | Argentina | FWD | md3 | 96.249 | 10 |

## After Mode Winners

| Mode | Winner | Country | Pos | Scope | Score | Price |
| --- | --- | --- | --- | --- | --- | --- |
| Balanced | Lionel Messi | Argentina | FWD | md3 | 82.947 | 10 |
| Safe | Camilo Vargas | Colombia | GK | md1 | 89.896 | 4.3 |
| Upside | Luis Suárez | Colombia | FWD | md1 | 77.474 | 5.7 |
| Differential | Giorgian de Arrascaeta | Uruguay | MID | md1 | 88.724 | 6.5 |
| Captain Alpha | Lionel Messi | Argentina | FWD | md3 | 98.178 | 10 |

## Before Top-List Overlap

| Pair | Top-10 overlap | Top-25 overlap | Top-10 shared examples |
| --- | --- | --- | --- |
| Balanced vs Safe | 6 | 13 | Nuno Alexandre Tavares Mendes (md2); Nuno Alexandre Tavares Mendes (md1); Bruno Miguel Borges Fernandes (md2); Bruno Miguel Borges Fernandes (md1); Lionel Messi (md3); Enzo Fernández (md3) |
| Balanced vs Differential | 5 | 12 | Nuno Alexandre Tavares Mendes (md2); Nuno Alexandre Tavares Mendes (md1); David Raum (md1); Nicolás Tagliafico (md3); Julian Ryerson (md1) |
| Safe vs Differential | 2 | 4 | Nuno Alexandre Tavares Mendes (md2); Nuno Alexandre Tavares Mendes (md1) |
| Upside vs Captain Alpha | 8 | 20 | Lionel Messi (md3); Lionel Messi (md1); Lionel Messi (md2); Lionel Messi (group_stage_full); Harry Kane (md3); Bruno Miguel Borges Fernandes (md2) |

## After Top-List Overlap

| Pair | Top-10 overlap | Top-25 overlap | Top-10 shared examples |
| --- | --- | --- | --- |
| Balanced vs Safe | 2 | 8 | Enzo Fernández (md3); Bruno Miguel Borges Fernandes (md2) |
| Balanced vs Differential | 0 | 1 |  |
| Safe vs Differential | 0 | 0 |  |
| Upside vs Captain Alpha | 0 | 0 |  |

## Top-25 All-Mode Overlap

| Metric | Count | Examples |
| --- | --- | --- |
| Before all-mode top-25 overlap | 1 | Enzo Fernández (md3) |
| After all-mode top-25 overlap | 0 |  |

## Mode Purpose Assessment

| Mode | Purpose | Expected overlap | Assessment |
| --- | --- | --- | --- |
| Balanced | Best all-around staged candidate score: projection, starts/minutes, confidence, value, fixture context, finance alpha, portfolio fit, role stability, downside safety, and data-quality penalties. | Can overlap with Safe and Captain candidates when the player is simply strong overall. | Purpose is distinct if it is not used as the Differential source of truth. |
| Safe | Floor-first score: role confidence, start probability, expected minutes, floor/risk-adjusted points, role stability, low downside, low volatility, and low data-quality risk. | Some overlap with Balanced is expected and acceptable. | Safe has acceptable separation from Balanced. |
| Upside | Ceiling and attacking paths per official price, with v2 upside prior and finance-alpha support. | Can overlap with Captain Alpha, but should avoid duplicating the obvious armband list. | Upside has acceptable separation from Captain Alpha. |
| Differential | Defensible value/upside with lower obviousness, finance alpha, portfolio fit, v2 differential prior, frontier/scarcity context, and downside/role guardrails. | Should penalize top Balanced/Safe rows and premium obvious picks. | Differential is meaningfully separated from Balanced. |

## Nuno Mendes Audit

Nuno Mendes ranks well in Balanced and Safe for understandable staged-model reasons: high projection confidence, strong expected minutes/start profile, Portugal fixture context, DEF clean-sheet scoring, and source-backed fullback attacking/assist rates. His old Differential win was not a projection bug and not a price-only bug; it was a mode-weight/separation bug. Differential was rewarding the same strong value profile without penalizing that he was already the top Balanced and Safe candidate.

### Nuno Before

| Mode | Rank | Name | Pos | Scope | Opponent | Price | Score | Raw | Risk | Start | Minutes | Confidence | Obviousness penalty | Reasons |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Balanced | 1 | Nuno Alexandre Tavares Mendes | DEF | md2 | Uzbekistan | 5.8 | 86.341 | 8.252 | 7.675 | 0.892 | 74.2 | high |  |  |
| Safe | 1 | Nuno Alexandre Tavares Mendes | DEF | md2 | Uzbekistan | 5.8 | 87.657 | 8.252 | 7.675 | 0.892 | 74.2 | high |  |  |
| Upside | 6 | Nuno Alexandre Tavares Mendes | DEF | md2 | Uzbekistan | 5.8 | 80.813 | 8.252 | 7.675 | 0.892 | 74.2 | high |  |  |
| Differential | 1 | Nuno Alexandre Tavares Mendes | DEF | md2 | Uzbekistan | 5.8 | 77.386 | 8.252 | 7.675 | 0.892 | 74.2 | high |  |  |
| Captain Alpha | 22 | Nuno Alexandre Tavares Mendes | DEF | md2 | Uzbekistan | 5.8 | 75.68 | 8.252 | 7.675 | 0.892 | 74.2 | high |  |  |

### Nuno After

| Mode | Rank | Name | Pos | Scope | Opponent | Price | Score | Raw | Risk | Start | Minutes | Confidence | Obviousness penalty | Reasons |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Balanced | 1 | Nuno Alexandre Tavares Mendes | DEF | md2 | Uzbekistan | 5.8 | 82.893 | 8.252 | 7.675 | 0.892 | 74.2 | high |  |  |
| Safe | 11 | Nuno Alexandre Tavares Mendes | DEF | md2 | Uzbekistan | 5.8 | 87.079 | 8.252 | 7.675 | 0.892 | 74.2 | high |  |  |
| Upside | 14 | Nuno Alexandre Tavares Mendes | DEF | md2 | Uzbekistan | 5.8 | 58.733 | 8.252 | 7.675 | 0.892 | 74.2 | high |  |  |
| Differential | 21 | Nuno Alexandre Tavares Mendes | DEF | md2 | Uzbekistan | 5.8 | 66.128 | 8.252 | 7.675 | 0.892 | 74.2 | high | 39 | Balanced rank 1; Safe rank 11; Captain Alpha rank 21; Raw projection rank 5; price percentile 1 by position |
| Captain Alpha | 21 | Nuno Alexandre Tavares Mendes | DEF | md2 | Uzbekistan | 5.8 | 76.931 | 8.252 | 7.675 | 0.892 | 74.2 | high |  |  |

## Differential Definition Applied

Differential now prioritizes defensible upside and finance-style value while applying an explicit obviousness penalty. The finance layer uses value over replacement, scarcity-adjusted value, efficient-frontier status, and price-tier opportunity cost. The obviousness penalty uses only staged proxies already available in this project: Balanced rank, Safe rank, Captain Alpha rank, raw projection rank, captain-score rank, official price percentile by position, and cross-mode top-list status. It does not use ownership data because no source-backed ownership exists.

Differential defensibility floor:

- high or medium projection confidence
- no thin profile
- no true missing-usage row
- start probability at least 0.52
- expected minutes at least 48
- raw expected points at least 3.2
- risk-adjusted points at least 2.7

## Differential Top 10 After Calibration

| Rank | Name | Country | Pos | Scope | Opponent | Price | Score | Raw | Risk | Start | Minutes | Confidence | Obviousness penalty | Reasons |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Giorgian de Arrascaeta | Uruguay | MID | md1 | Saudi Arabia | 6.5 | 88.724 | 7.541 | 7.013 | 0.923 | 69.1 | high | 12 | Captain Alpha rank 10; Raw projection rank 8; price percentile 0.87 by position |
| 1 | Giorgian de Arrascaeta | Uruguay | MID | md2 | Cabo Verde | 6.5 | 86.457 | 7.818 | 7.271 | 0.923 | 69.1 | high | 17 | Balanced rank 25; Captain Alpha rank 5; Raw projection rank 9; price percentile 0.87 by position |
| 2 | Hiroki Ito | Japan | DEF | md2 | Tunisia | 3.9 | 83.942 | 6.567 | 6.107 | 0.89 | 74.1 | high | 4 | Balanced rank 11; Raw projection rank 20 |
| 2 | Julian Ryerson | Norway | DEF | md1 | Iraq | 4.2 | 83.44 | 6.959 | 6.472 | 0.924 | 76.5 | high | 5 | Balanced rank 12; Raw projection rank 14 |
| 3 | Luis Suárez | Colombia | FWD | md2 | Congo DR | 5.7 | 82.532 | 6.433 | 5.983 | 0.73 | 53.4 | high | 1 |  |
| 3 | Luis Suárez | Colombia | FWD | md1 | Uzbekistan | 5.7 | 82.356 | 6.468 | 6.015 | 0.73 | 53.4 | high | 2 | Raw projection rank 24 |
| 1 | Charles De Ketelaere | Belgium | MID | group_stage_full | Group stage average | 5.6 | 80.024 | 18.988 | 17.659 | 0.902 | 67.7 | high | 1 | Raw projection rank 19 |
| 2 | Silvan Widmer | Switzerland | DEF | group_stage_full | Group stage average | 4.2 | 78.446 | 17.429 | 16.21 | 0.908 | 75.4 | high | 3 | Balanced rank 12 |
| 4 | Johan Mojica | Colombia | DEF | md1 | Uzbekistan | 3.9 | 78.061 | 5.699 | 5.3 | 0.924 | 76.5 | high | 3 | Balanced rank 16 |
| 3 | Luis Suárez | Colombia | FWD | group_stage_full | Group stage average | 5.7 | 78.044 | 17.194 | 15.99 | 0.73 | 53.4 | high | 1 |  |

## Decision

Differential now has a clearer staged meaning: it is a defensible lower-obviousness list, not a copy of Balanced or Safe. Safe still overlaps with Balanced, but it remains floor/minutes/confidence focused and is not identical. Upside now discounts obvious Captain Alpha rows so it can surface explosive non-captain value.

The recommendation layer is still fantasy_pool_only, not final-squad-backed, not browser-ready, not Team Builder-ready, and blocked from public promotion.
