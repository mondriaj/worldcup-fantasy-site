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
- Active `fantasyRules.json` is now promoted from `data/officialFantasyRules_v0.json`; keep it synced through `scripts/promoteOfficialFantasyRules.mjs`.
- Keep live deadline, lock, booster, captain, and substitution checks as manual confirmations inside FIFA unless a future pass implements and verifies live rule logic.
- Do not connect player recommendations to final-squad claims unless final squads are source-backed.

## Official Data Roadmap

When official World Cup fantasy data changes, read `OFFICIAL_DATA_NEXT_STEPS.md` before making model changes. Use the monitor, import pipelines, and readiness validator as the gate before replacing public browser data, score predictions, matchday projections, or player recommendations.
