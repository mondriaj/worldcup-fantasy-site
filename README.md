# World Cup Fantasy Helper

A static fantasy football website for comparing quick picks, captain options, player rankings, and squad ideas.

## Current Status

This is a public preview. The site is built with a World Cup fantasy structure, but it currently uses a 100-player EPL/FPL-style test dataset while final World Cup squads, fantasy prices, and official fantasy rules are pending. Tournament groups and group-stage fixtures are shown separately on the World Cup page.

Week 5 adds Optimizer v0: the Team Builder now searches for a rules-valid squad using the selected pick style, draft budget, position counts, country limit, locked players, filters, and removed-player exclusions.

## Run Locally

```bash
cd project
python3 -m http.server 8766
```

Then open:

```text
http://127.0.0.1:8766/index.html
```

The site can be opened from GitHub Pages or a local server. It loads browser-ready data scripts, so it does not need to fetch JSON files at runtime.

## Files Overview

- `index.html` - page structure and content
- `style.css` - responsive layout and visual styling
- `script.js` - uses the browser-ready player and rules data, then powers Quick Picks, Captain Picks, Team Advice, Team Builder, rules validation, and Optimizer v0
- `AGENTS.md` - project instructions for Codex, including the player/rules data loading pattern
- `players.json` - source player dataset
- `playersData.js` - browser-ready copy of `players.json`
- `fantasyRules.json` - source Week 5 draft fantasy rules
- `fantasyRulesData.js` - browser-ready copy of `fantasyRules.json`
- `rulesSources.md` - source notes for the draft fantasy rules
- `world-cup.html` - separate tournament information page
- `worldCupData.js` - static World Cup groups, group-stage fixtures, bracket paths, and source notes
- `worldCupPage.js` - renderer for the tournament information page
- `dataSources.md` - data source notes
- `euroScoringGuide.md` - scoring and model notes
- `countryMappingGuide.md` - country mapping notes

## Known Limits

- Current picks use test data.
- Final World Cup squads are not loaded yet.
- Official fantasy prices and rules are pending, and fixture-adjusted advice is not loaded yet.
- Team Builder rules currently come from the Week 5 draft rules in `fantasyRules.json`, loaded in the browser through `fantasyRulesData.js`.
- Optimizer v0 is a practical browser-side search, not a final tournament prediction model.
- This is independent and not official FIFA fantasy advice.
- No betting or gambling content is included.

## Future World Cup Data Plan

When reliable World Cup fantasy data becomes available, update the player database, squad status, official rules, prices, and matchday-specific advice.

Stage B adds FIFA-sourced tournament structure and group-stage fixture data while keeping player recommendations separate.

Future Stage C: add national team pages after official squads are announced.

## Deployment

The site is static and can be hosted on GitHub Pages from the `project/` repository.
