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

Important:

- Do not put proxy prices in `official_price`.
- Do not infer official fantasy position from roster position.
- Leave missing official values blank; the importer will mark them for review.
- Review `data/officialFantasyImportReport_v0.json` before any model rerun.
