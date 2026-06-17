# Recommendation Mode Separation Audit Fantasy Pool v3

Generated: 2026-06-17T22:53:19.339Z

Model stage: fantasy_pool_only. This audit does not promote recommendations, does not update active v2 recommendations, does not update browser-ready files, and does not make Team Builder, captain/substitution, or UX changes.

## Summary

- Before Differential winner: Nuno Alexandre Tavares Mendes (md2).
- After Differential winner: Hiroki Ito (md2).
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
| Balanced | Lionel Messi | Argentina | FWD | md3 | 82.411 | 10 |
| Safe | Enzo Fernández | Argentina | MID | md3 | 83.792 | 7.5 |
| Upside | Luis Suárez | Colombia | FWD | md2 | 79.582 | 5.7 |
| Differential | Hiroki Ito | Japan | DEF | md2 | 84.686 | 3.9 |
| Captain Alpha | Lionel Messi | Argentina | FWD | md3 | 98.623 | 10 |

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
| Balanced vs Safe | 4 | 14 | Enzo Fernández (md3); Lionel Messi (md3); Enzo Fernández (md1); Lionel Messi (md1) |
| Balanced vs Differential | 0 | 4 |  |
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
| Balanced | 1 | Nuno Alexandre Tavares Mendes | DEF | md1 | Congo DR | 5.8 | 81.415 | 8.192 | 7.618 | 0.892 | 74.2 | high |  |  |
| Safe | 14 | Nuno Alexandre Tavares Mendes | DEF | md1 | Congo DR | 5.8 | 80.504 | 8.192 | 7.618 | 0.892 | 74.2 | high |  |  |
| Upside | 9 | Nuno Alexandre Tavares Mendes | DEF | md2 | Uzbekistan | 5.8 | 61.136 | 8.135 | 7.565 | 0.892 | 74.2 | high |  |  |
| Differential | 4 | Nuno Alexandre Tavares Mendes | DEF | group_stage_full | Group stage average | 5.8 | 72.185 | 21.559 | 20.049 | 0.892 | 74.2 | high | 31 | Balanced rank 4; Safe rank 23; Captain Alpha rank 23; Raw projection rank 12; price percentile 1 by position |
| Captain Alpha | 18 | Nuno Alexandre Tavares Mendes | DEF | md1 | Congo DR | 5.8 | 75.911 | 8.192 | 7.618 | 0.892 | 74.2 | high |  |  |

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
| 1 | Hiroki Ito | Japan | DEF | md2 | Tunisia | 3.9 | 84.686 | 6.609 | 6.146 | 0.89 | 74.1 | high | 4 | Balanced rank 12; Raw projection rank 21 |
| 1 | Josip Stanisic | Croatia | DEF | md3 | Ghana | 4.3 | 79.177 | 6.326 | 5.883 | 0.892 | 74.2 | high | 4.5 | Balanced rank 19; price percentile 0.73 by position |
| 1 | Hiroki Ito | Japan | DEF | group_stage_full | Group stage average | 3.9 | 76.059 | 14.479 | 13.466 | 0.89 | 74.1 | high | 0 |  |
| 2 | Nico O'Reilly | England | DEF | group_stage_full | Group stage average | 4.7 | 75.309 | 19.269 | 17.919 | 0.876 | 73.1 | high | 22 | Balanced rank 7; Captain Alpha rank 24; Raw projection rank 21; price percentile 0.87 by position; top-10 in 2 modes |
| 2 | Bruno Guimarães Rodriguez Moura | Brazil | MID | md2 | Haiti | 6.8 | 75.049 | 6.224 | 5.789 | 0.95 | 70.8 | high | 4 | price percentile 0.9 by position |
| 1 | Santiago Arias | Colombia | DEF | md1 | Uzbekistan | 3.9 | 74.624 | 5.639 | 5.244 | 0.882 | 73.5 | high | 3 | Balanced rank 25 |
| 3 | Nico O'Reilly | England | DEF | md2 | Ghana | 4.7 | 73.518 | 6.81 | 6.333 | 0.876 | 73.1 | high | 20 | Balanced rank 7; Captain Alpha rank 24; Raw projection rank 16; price percentile 0.87 by position |
| 3 | Hernán Galíndez | Ecuador | GK | group_stage_full | Group stage average | 4.2 | 73.233 | 14.257 | 13.259 | 0.94 | 82.7 | high | 0 |  |
| 4 | Nuno Alexandre Tavares Mendes | Portugal | DEF | group_stage_full | Group stage average | 5.8 | 72.185 | 21.559 | 20.049 | 0.892 | 74.2 | high | 31 | Balanced rank 4; Safe rank 23; Captain Alpha rank 23; Raw projection rank 12; price percentile 1 by position |
| 5 | Bruno Guimarães Rodriguez Moura | Brazil | MID | group_stage_full | Group stage average | 6.8 | 72.062 | 17.677 | 16.441 | 0.95 | 70.8 | high | 4 | price percentile 0.9 by position |

## Decision

Differential now has a clearer staged meaning: it is a defensible lower-obviousness list, not a copy of Balanced or Safe. Safe still overlaps with Balanced, but it remains floor/minutes/confidence focused and is not identical. Upside now discounts obvious Captain Alpha rows so it can surface explosive non-captain value.

The recommendation layer is still fantasy_pool_only, not final-squad-backed, not browser-ready, not Team Builder-ready, and blocked from public promotion.
