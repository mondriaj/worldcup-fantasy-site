# Official Fantasy Rules Import Pipeline v0

Generated: 2026-06-01

## Purpose

Official Fantasy Rules Import Pipeline v0 prepares the project for the first official World Cup fantasy rules file.

It does not replace the active draft rules yet. The importer writes a separate official-rules output and a validation report so rules can be reviewed before `fantasyRules.json` and `fantasyRulesData.js` are changed.

## Files

- `data/imports/officialFantasyRules_TEMPLATE.json`
- `scripts/importOfficialFantasyRules.mjs`
- `data/officialFantasyRulesImportReport_v0.json`

When a real official rules file exists, the importer also writes:

- `data/officialFantasyRules_v0.json`

## Command

Default:

```bash
node scripts/importOfficialFantasyRules.mjs
```

Custom input:

```bash
node scripts/importOfficialFantasyRules.mjs --input data/imports/officialFantasyRules.json
```

## Required Rule Areas

- squad size and position counts
- starting lineup size and allowed formations
- budget
- country limits
- captain rules and captain-change rules
- manual substitution rules and lock rules
- transfer rules
- boosters or chips
- scoring categories
- matchday deadlines and lock windows
- official source IDs and source checked date

## Guardrails

- Do not promote draft or placeholder rules.
- Do not infer missing official rules from past tournaments.
- Do not overwrite active `fantasyRules.json` automatically.
- Keep Captain Change Advisor, Substitution Advisor, and Matchday Decision Center deadline warnings active while lock windows are missing or unresolved.

## Current Expected Result

Until an official rules input file is added, the command writes:

```text
data/officialFantasyRulesImportReport_v0.json: awaiting_official_rules_input
```
