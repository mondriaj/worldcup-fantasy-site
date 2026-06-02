# Official Squads Import Pipeline v0

Generated: 2026-06-01

## Purpose

Official Squads Import Pipeline v0 prepares the project to reconcile final official squad data against the current `data/players.json` pool.

It does not delete or overwrite current players. It writes a separate official squad output and a reconciliation report so final, replacement, excluded, and review statuses can be inspected before any recommendation model rerun.

## Files

- `data/imports/officialSquads_TEMPLATE.csv`
- `scripts/importOfficialSquads.mjs`
- `data/officialSquadsImportReport_v0.json`

When a real official squad input file exists, the importer also writes:

- `data/officialSquads_v0.json`

## Command

Default:

```bash
node scripts/importOfficialSquads.mjs
```

Custom input:

```bash
node scripts/importOfficialSquads.mjs --input data/imports/officialSquads.csv
```

## Required Fields

- name
- country
- team ID
- roster status
- source URL
- source checked date

Optional but useful:

- official fantasy player ID
- FIFA player ID
- shirt number
- club
- position
- replacement status
- source note
- `team_squad_complete`

## Reconciliation Rules

The importer marks current players as:

- `final` when matched to an official final row.
- `replacement` when matched to an official replacement row.
- `excluded` when matched to an official excluded row.
- `excluded` when their team is explicitly marked `team_squad_complete=true` and they are absent from the official import.
- `review` when their team is not explicitly marked complete or the match is ambiguous.

## Guardrails

- No player is deleted automatically.
- No active recommendation file is changed by this importer.
- `team_squad_complete` must only be true when the official source covers the complete final squad for that team.
- Excluded/review players are reported as recommendation flags and require explicit promotion before model reruns.

## Current Expected Result

Until an official squad input file is added, the command writes:

```text
data/officialSquadsImportReport_v0.json: awaiting_official_squads_input
```
