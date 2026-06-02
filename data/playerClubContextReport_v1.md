# Player Club Context Report v1

Generated: 2026-06-02

## Scope

This report covers club-context enrichment for the official fantasy player pool only. It does not rerun player projections, recommendations, Team Builder, captain/substitution logic, browser-ready files, or UX.

## Summary

- Official fantasy players processed: 1481
- Club context rows: 1481
- Players with current club context: 1156
- Players missing club context: 325
- Thin profiles: 221
- Thin profiles with club context: 0
- Position conflicts carried from identity map: 135

## Club Data Status Counts

- source_verified: 922
- existing_project_data: 234
- thin_profile_missing: 221
- missing: 104

## Club Role Confidence Counts

- high: 854
- missing: 325
- low: 234
- medium: 68

## Missing Club Context By Country

- Australia: 33
- Argentina: 29
- Iraq: 29
- Jordan: 28
- Korea Republic: 22
- Morocco: 21
- Paraguay: 15
- Qatar: 15
- Ghana: 12
- Egypt: 10

## Missing Club Context By Position

- DEF: 108
- MID: 107
- FWD: 56
- GK: 54

## QA Flags

- Official fantasy players not found in club-context output: 0
- Duplicate official fantasy player IDs in club-context output: 0
- Duplicate existing internal player IDs where not expected: 0
- Club role confidence missing: 325
- Position conflicts carried from identity map: 135

## Interpretation

Rows with `source_verified` have supporting performance or minutes context in existing repo data. Rows with `existing_project_data` have a club from the existing roster/project context but no verified club minutes in the inspected sources. Thin profiles remain explicit and should not receive invented club, league, starts, or minutes.
