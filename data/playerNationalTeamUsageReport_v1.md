# Player National-Team Usage Report v1

Generated: 2026-06-02

## Scope

This report covers national-team and qualifier usage enrichment for the official fantasy player pool only. It does not rerun the minutes model, projections, recommendations, Team Builder, captain/substitution logic, browser-ready files, or UX.

## Summary

- Official fantasy players processed: 1481
- Usage rows: 1481
- Players with national-team usage context: 873
- Players missing national-team usage context: 608
- High usage confidence: 632
- Medium usage confidence: 150
- Low usage confidence: 91
- Missing usage confidence: 387
- Thin-profile missing usage confidence: 221
- Thin profiles with usage context: 0

## Usage Confidence Counts

- high: 632
- missing: 387
- thin_profile_missing: 221
- medium: 150
- low: 91

## Recent Role Counts

- unclear: 406
- squad_depth: 331
- rotation_starter: 299
- locked_starter: 223
- likely_starter: 221
- impact_sub: 1

## Missing Usage By Country

- Mexico: 44
- Argentina: 33
- Morocco: 33
- Australia: 32
- Paraguay: 31
- Canada: 30
- USA: 25
- Korea Republic: 20
- Jordan: 17
- Uzbekistan: 17

## Missing Usage By Position

- MID: 192
- DEF: 190
- FWD: 116
- GK: 110

## QA Flags

- Official fantasy players not found in usage output: 0
- Usage confidence missing or thin-profile missing: 608
- Role confidence missing or thin-profile missing: 608
- High-price players with missing usage: 0
- Likely starters missing usage: 0
- Goalkeepers without role confidence: 110
- Position conflicts carried from identity map: 135

## Interpretation

Qualifier usage is source-backed from existing national-team performance rows and OneFootball qualifier match pages where available. Targeted import rows can add source-backed recent starts, minutes, or low-confidence role evidence for high-impact audit targets, while `missing_source_gap` rows remain documentation only. OneFootball minutes are supplemental and may be estimated from lineup and substitution clocks. Missing usage remains missing; it is not treated as average. Set-piece columns only carry sparse existing club-performance hints where present and are not official national-team set-piece duties.
