# Codex Project Instructions

## Player And Rules Data

When working on players, fantasy rules, or the Team Builder, keep this data-loading pattern:

- `players.json` is the source player database.
- `playersData.js` is the browser-ready copy of `players.json`.
- `fantasyRules.json` is the source fantasy rules database.
- `fantasyRulesData.js` is the browser-ready copy of `fantasyRules.json`.
- `index.html` should load data scripts before app logic:
  - `playersData.js`
  - `fantasyRulesData.js`
  - `script.js`
- `script.js` should read player data from `window.PLAYERS_DATA`.
- `script.js` should read fantasy rules from `window.FANTASY_RULES_DATA`.
- Do not use runtime `fetch()` for `players.json` or `fantasyRules.json` unless the project deliberately changes architecture.
- When changing player data, keep `players.json` and `playersData.js` in sync.
- When changing fantasy rules, keep `fantasyRules.json` and `fantasyRulesData.js` in sync.

This site is a static GitHub Pages-style project. Browser-ready data scripts avoid local `file://` and CORS problems while preserving readable JSON source files.

## Fantasy Rules Caution

- Do not invent official FIFA World Cup 2026 fantasy rules.
- Keep Week 5 rules clearly marked as draft rules until official rules are available.
- Do not connect rules, fixtures, or player recommendations to final World Cup claims until official squads, prices, positions, and rules are available.
