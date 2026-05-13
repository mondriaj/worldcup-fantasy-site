# World Cup Fantasy Helper

A static fantasy football website for comparing quick picks, captain options, player rankings, and squad ideas.

## Current Status

This is a public preview. The site is built with a World Cup fantasy structure, but it currently uses a 100-player EPL/FPL-style test dataset while final World Cup squads, prices, fixtures, and fantasy rules are pending.

## Run Locally

```bash
cd project
python3 -m http.server 8766
```

Then open:

```text
http://127.0.0.1:8766/index.html
```

## Files Overview

- `index.html` - page structure and content
- `style.css` - responsive layout and visual styling
- `script.js` - Quick Picks, Captain Picks, Team Advice, and Team Builder logic
- `playersData.js` - browser-ready player dataset
- `players.json` - source player dataset
- `dataSources.md` - data source notes
- `euroScoringGuide.md` - scoring and model notes
- `countryMappingGuide.md` - country mapping notes

## Known Limits

- Current picks use test data.
- Final World Cup squads are not loaded yet.
- Official fantasy prices and rules are pending, and fixture-adjusted advice is not loaded yet.
- This is independent and not official FIFA fantasy advice.
- No betting or gambling content is included.

## Future World Cup Data Plan

When reliable World Cup data becomes available, update the player database, squad status, fixtures, official rules, prices, and matchday-specific advice.

Stage B will first add fixture and group structure, then connect real fixture data only after the source and schema are approved.

## Deployment

The site is static and can be hosted on GitHub Pages from the `project/` repository.
