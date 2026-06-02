# Official Fantasy Import Landing Folder

Use this folder for raw official fantasy files when FIFA World Cup fantasy data becomes available.

Default player import path:

```text
data/imports/officialFantasyPlayers.csv
```

Template:

```text
data/imports/officialFantasyPlayers_TEMPLATE.csv
```

Run:

```bash
node scripts/importOfficialFantasyPlayers.mjs
```

Or pass a custom file:

```bash
node scripts/importOfficialFantasyPlayers.mjs --input data/imports/my-official-file.csv
```

Accepted formats:

- CSV
- TSV
- JSON array
- JSON object with `officialFantasyPlayers`, `players`, `rows`, or `data`

Required fields:

- `official_fantasy_player_id`
- `name`
- `country`
- `team_id`
- `official_fantasy_position`
- `official_price`
- `selectable_status`
- `source_url`
- `source_checked`

Default rules import path:

```text
data/imports/officialFantasyRules.json
```

Rules template:

```text
data/imports/officialFantasyRules_TEMPLATE.json
```

Run:

```bash
node scripts/importOfficialFantasyRules.mjs
```

Or pass a custom file:

```bash
node scripts/importOfficialFantasyRules.mjs --input data/imports/my-official-rules.json
```

Important:

- Do not put proxy prices in `official_price`.
- Do not infer official fantasy position from roster position.
- Leave missing official values blank; the importer will mark them for review.
- Review `data/officialFantasyImportReport_v0.json` before any model rerun.
- Do not promote official rules into active `fantasyRules.json` until `data/officialFantasyRulesImportReport_v0.json` is clean enough and the browser rules file is regenerated.
