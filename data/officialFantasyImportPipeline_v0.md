# Official Fantasy Import Pipeline v0

Generated: 2026-06-01

## Purpose

Official Fantasy Import Pipeline v0 prepares the project for the first official World Cup fantasy player file.

It does not import official data yet because the official fantasy player list, positions, prices, and rules are not present in the repo. Instead, it creates the exact landing folder, template, importer, and report format we will use when the file becomes available.

## Files

- `data/imports/README.md`
- `data/imports/officialFantasyPlayers_TEMPLATE.csv`
- `scripts/importOfficialFantasyPlayers.mjs`
- `data/officialFantasyImportReport_v0.json`

When a real input file exists, the importer also writes:

- `data/officialFantasyPlayers_v0.json`

## Command

Default:

```bash
node scripts/importOfficialFantasyPlayers.mjs
```

Custom input:

```bash
node scripts/importOfficialFantasyPlayers.mjs --input data/imports/officialFantasyPlayers.csv
```

## Required Fields

- official fantasy player ID
- name
- country
- team ID
- official fantasy position
- official price
- selectable status
- source URL
- source checked date

## Validation

The importer checks:

- required fields
- duplicate official fantasy IDs
- numeric official prices
- valid fantasy positions: `GK`, `DEF`, `MID`, `FWD`
- exact or review-needed matches to the current `data/players.json` player pool

## Matching Rules

The importer tries matches in this order:

1. Existing official fantasy ID, if already present.
2. Team ID plus normalized player name.
3. Country plus normalized player name.
4. Name-only match, marked for manual review.
5. Unmatched, marked for manual review.

## Guardrails

- Do not invent official fantasy IDs.
- Do not put proxy prices in `official_price`.
- Do not infer official fantasy positions from roster positions.
- Do not merge name-only matches without manual review.
- Do not rerun value or recommendation models until the import report is clean enough and official rules are also imported.

## Current Expected Result

Until an official input file is added, the command writes:

```text
data/officialFantasyImportReport_v0.json: awaiting_official_input
```
