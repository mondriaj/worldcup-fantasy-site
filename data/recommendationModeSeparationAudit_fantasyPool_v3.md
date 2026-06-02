# Recommendation Mode Separation Audit Fantasy Pool v3

Generated: 2026-06-02T18:41:18.502Z

Model stage: fantasy_pool_only. This audit does not promote recommendations, does not update active v2 recommendations, does not update browser-ready files, and does not make Team Builder, captain/substitution, or UX changes.

## Summary

- Before Differential winner: Nuno Alexandre Tavares Mendes (md2).
- After Differential winner: Giorgian de Arrascaeta (md1).
- After Balanced winner: Nuno Alexandre Tavares Mendes (md2).
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
| Balanced | Nuno Alexandre Tavares Mendes | Portugal | DEF | md2 | 86.341 | 5.8 |
| Safe | Nuno Alexandre Tavares Mendes | Portugal | DEF | md2 | 87.657 | 5.8 |
| Upside | Lionel Messi | Argentina | FWD | md3 | 92.325 | 10 |
| Differential | Giorgian de Arrascaeta | Uruguay | MID | md1 | 77.668 | 6.5 |
| Captain Alpha | Lionel Messi | Argentina | FWD | md3 | 96.249 | 10 |

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
| Balanced vs Safe | 6 | 13 | Nuno Alexandre Tavares Mendes (md2); Nuno Alexandre Tavares Mendes (md1); Bruno Miguel Borges Fernandes (md2); Bruno Miguel Borges Fernandes (md1); Lionel Messi (md3); Enzo Fernández (md3) |
| Balanced vs Differential | 0 | 2 |  |
| Safe vs Differential | 0 | 0 |  |
| Upside vs Captain Alpha | 8 | 20 | Lionel Messi (md3); Lionel Messi (md1); Lionel Messi (md2); Lionel Messi (group_stage_full); Harry Kane (md3); Bruno Miguel Borges Fernandes (md2) |

## Top-25 All-Mode Overlap

| Metric | Count | Examples |
| --- | --- | --- |
| Before all-mode top-25 overlap | 1 | Enzo Fernández (md3) |
| After all-mode top-25 overlap | 0 |  |

## Mode Purpose Assessment

| Mode | Purpose | Expected overlap | Assessment |
| --- | --- | --- | --- |
| Balanced | Best all-around staged candidate score: risk-adjusted points, raw points, starts/minutes, confidence, value, fixture context, and data-quality penalties. | Can overlap with Safe and Captain candidates when the player is simply strong overall. | Purpose is distinct if it is not used as the Differential source of truth. |
| Safe | Floor-first score: role confidence, start probability, expected minutes, floor/risk-adjusted points, and low data-quality risk. | Some overlap with Balanced is expected and acceptable. | Safe has acceptable separation from Balanced. |
| Upside | Ceiling/attack/captain-environment score for aggressive preliminary review. | Can overlap heavily with Captain Alpha because elite attackers lead both. | Upside has enough separation from Captain Alpha. |
| Differential | Defensible value/upside with lower obviousness, not simply the best Balanced/Safe player repeated. | Should penalize top Balanced/Safe rows and premium obvious picks. | Differential is meaningfully separated from Balanced. |

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
| Balanced | 1 | Nuno Alexandre Tavares Mendes | DEF | md2 | Uzbekistan | 5.8 | 86.341 | 8.252 | 7.675 | 0.892 | 74.2 | high |  |  |
| Safe | 1 | Nuno Alexandre Tavares Mendes | DEF | md2 | Uzbekistan | 5.8 | 87.657 | 8.252 | 7.675 | 0.892 | 74.2 | high |  |  |
| Upside | 6 | Nuno Alexandre Tavares Mendes | DEF | md2 | Uzbekistan | 5.8 | 80.813 | 8.252 | 7.675 | 0.892 | 74.2 | high |  |  |
| Captain Alpha | 22 | Nuno Alexandre Tavares Mendes | DEF | md2 | Uzbekistan | 5.8 | 75.68 | 8.252 | 7.675 | 0.892 | 74.2 | high |  |  |

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
| 1 | Giorgian de Arrascaeta | Uruguay | MID | md1 | Saudi Arabia | 6.5 | 77.668 | 7.541 | 7.013 | 0.923 | 69.1 | high | 15 | Balanced rank 19; Captain Alpha rank 12; Raw projection rank 8; price percentile 0.87 by position |
| 1 | Nicolas Jackson | Senegal | FWD | md3 | Iraq | 6.7 | 77.42 | 6.181 | 5.748 | 0.755 | 54.8 | high | 5 | price percentile 0.87 by position |
| 1 | Hiroki Ito | Japan | DEF | md2 | Tunisia | 3.9 | 77.011 | 6.567 | 6.107 | 0.89 | 74.1 | high | 4 | Balanced rank 12; Raw projection rank 20 |
| 2 | Luis Suárez | Colombia | FWD | md1 | Uzbekistan | 5.7 | 73.997 | 6.468 | 6.015 | 0.73 | 53.4 | high | 2 | Raw projection rank 25 |
| 2 | Luis Suárez | Colombia | FWD | md2 | Congo DR | 5.7 | 73.885 | 6.433 | 5.983 | 0.73 | 53.4 | high | 1 |  |
| 2 | Martin Erlic | Croatia | DEF | md3 | Ghana | 3.9 | 73.659 | 5.671 | 5.274 | 0.858 | 71.8 | high | 0 |  |
| 3 | Santiago Arias | Colombia | DEF | md1 | Uzbekistan | 3.9 | 72.62 | 5.638 | 5.244 | 0.882 | 73.5 | high | 0 |  |
| 3 | Emmanuel Agbadou | Côte d'Ivoire | DEF | md3 | Curaçao | 3.9 | 72.506 | 5.597 | 5.205 | 0.882 | 73.5 | high | 0 |  |
| 4 | Ismael Saibari | Morocco | MID | md3 | Haiti | 6.8 | 72.076 | 6.574 | 6.114 | 0.755 | 58.3 | high | 6 | Raw projection rank 18; price percentile 0.89 by position |
| 1 | Charles De Ketelaere | Belgium | MID | group_stage_full | Group stage average | 5.6 | 71.605 | 18.988 | 17.659 | 0.902 | 67.7 | high | 1 | Raw projection rank 19 |

## Decision

Differential now has a clearer staged meaning: it is a defensible lower-obviousness list, not a copy of Balanced or Safe. Safe still overlaps with Balanced, but it remains floor/minutes/confidence focused and is not identical. Upside and Captain Alpha remain attacker-led and can overlap because both naturally reward elite attacking rows.

The recommendation layer is still fantasy_pool_only, not final-squad-backed, not browser-ready, not Team Builder-ready, and blocked from public promotion.
