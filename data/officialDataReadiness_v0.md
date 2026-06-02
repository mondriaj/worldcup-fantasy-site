# Official Data Readiness v0

Generated: 2026-06-01

## Purpose

Official Data Readiness v0 is a gate between the current prototype model and a future official fantasy-data model.

The current site is useful for model testing, Team Builder workflow testing, captain-switch logic, substitution checks, and UX polish. It is not ready to be treated as final fantasy advice because official fantasy data is still missing.

## Current Status

Status: `blocked_waiting_for_official_fantasy_data`

The blocking inputs are:

- Final official squads.
- Official fantasy player IDs.
- Official fantasy positions.
- Official fantasy prices.
- Official fantasy scoring rules, budget rules, transfer rules, boosters, deadlines, captain rules, and substitution windows.

Current snapshot:

- 1,339 roster/player rows.
- 48 World Cup teams covered.
- 0 official fantasy player IDs imported.
- 0 official fantasy prices imported.
- 1,339 rows still use proxy prices.
- 0 finance rows have official price-adjusted return.

## What This Changes

This step adds a readiness gate, not a new prediction model.

It prevents us from accidentally treating proxy price logic, draft rules, or preliminary roster rows as official data. It also defines the import contract for the first official fantasy-player import.

New files:

- `data/officialDataReadiness_v0.json`
- `data/officialFantasyImportSchema_v0.json`
- `data/officialFantasyImportReport_v0.json`
- `data/officialFantasyRulesImportReport_v0.json`
- `data/officialSquadsImportReport_v0.json`
- `scripts/validateOfficialDataReadiness.mjs`
- `scripts/importOfficialFantasyPlayers.mjs`
- `scripts/importOfficialFantasyRules.mjs`
- `scripts/importOfficialSquads.mjs`

## Official Import Contract

The future official fantasy-player import must include:

- official fantasy player ID
- name
- country
- team ID
- official fantasy position
- official price
- selectable status
- source URL
- source checked date

The future final-squad import must include:

- player name
- country
- team ID
- final roster status
- source URL
- source checked date

The future official-rules import must include:

- squad size and position counts
- budget
- country limits
- scoring categories
- transfers
- boosters
- deadlines
- captain rules
- substitution rules and lock windows

## Rerun Sequence

When official data arrives:

1. Import official fantasy players, positions, prices, and selectable status.
2. Import or refresh final official squads.
3. Import official fantasy rules, scoring, and deadlines.
4. Match official fantasy players to current player IDs.
5. Regenerate value and finance models using official prices.
6. Regenerate player recommendation inputs, matchday projections, and recommendation QA.
7. Re-test Team Builder, Team Export/Import, Captain Change Advisor, Substitution Advisor, and Matchday Decision Center.
8. Update README, data sources, data quality report, source manifest, and roadmap.

## Guardrails

- Do not invent official prices.
- Do not infer official fantasy positions from roster positions.
- Do not promote draft rules to official rules.
- Do not remove proxy price fields until official price coverage is validated.
- Keep unmatched or ambiguous official rows in manual review.

## Validation

Run:

```bash
node scripts/validateOfficialDataReadiness.mjs
```

Run the official fantasy player import pipeline:

```bash
node scripts/importOfficialFantasyPlayers.mjs
```

Run the official fantasy rules import pipeline:

```bash
node scripts/importOfficialFantasyRules.mjs
```

Run the final official squad reconciliation pipeline:

```bash
node scripts/importOfficialSquads.mjs
```

Expected current result:

```text
data/officialDataReadiness_v0.json: blocked_waiting_for_official_fantasy_data
```
