# Country Mapping Step

This project now keeps country mapping as a separate step.

Why:
- `players.json` was built from real source files in `FPL-Core-Insights`
- those source files include player names, clubs, positions, prices, and stats
- they do **not** include player national teams
- because of that, the `country` field is currently set to `needs_check`

## Files

- `players.json`
  - Main player database used by the website
- `countryMappings.json`
  - Manual country mapping file
- `applyCountryMappings.js`
  - Script that copies checked countries into `players.json`

## How To Use It

1. Open `countryMappings.json`
2. Add player ids under `mappings`
3. For each player, add:
   - `country`
   - `source_note`
4. Run:

```bash
cd /Users/jordimondria/Dropbox/worldcup_ai_project_pack_docx/worldcup-project-jordi/project
node applyCountryMappings.js
```

## Example Mapping

```json
{
  "mappings": {
    "1": {
      "country": "Spain",
      "source_note": "Checked manually against a trusted squad source."
    }
  }
}
```

## Important Rule

Do not invent countries.

Only fill in a country after checking a trusted source such as:
- an official club page
- an official national team page
- a trusted football database

If a player is not checked yet, leave them out of `mappings` or leave the country blank.
