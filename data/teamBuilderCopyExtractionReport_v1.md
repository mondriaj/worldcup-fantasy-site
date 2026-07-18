# Team Builder Copy Extraction Report v1

Generated: 2026-07-18

This pass extracted display copy and explanation formatters from `script.js` without touching Team Builder scoring, optimizer search, candidate selection, locks, captain/vice logic, generated artifacts, or model data.

## Moved Out Of `script.js`

- Strategy option labels/descriptions and strategy aliases.
- Strategy comparison key list.
- Team Builder status messages used by `renderTeam`.
- Artifact-backed objective summary text.
- Pure strategy-fit explanation text.
- Count summary and objective summary formatters added to the helper for future low-risk report/view cleanup.

## Still In `script.js`

- Portfolio metric labels and warning rendering, because they sit inside DOM construction.
- Rule validation budget text, because it is coupled to legal checks.
- Captain/vice and decision-tool copy, because it depends on user state and exports.
- Third Place risk/profile tag copy, because it is still tied to pick-card/profile rendering.
- All optimizer weights, scoring formulas, candidate filtering, and user lock behavior.

## Visible Wording

No visible wording was intentionally changed. The default artifact-backed Team Builder message remains identical.

## Line Count

- `script.js` before: 15423 lines.
- `script.js` after: 15286 lines.
- Net reduction: 137 lines.

## Remaining Duplicate Labels

- Budget Pressure as both metric and warning.
- Captain Watchlist/Captain Option across cards, tables, and decision tools.
- Third Place risk/Role caution across profile tags and recommendation tags.
- Final-squad/source-backed caveats across data labels and exports.

## Next Safe Extraction Step

Move portfolio metric label definitions and public profile tag definitions into helper constants, then add exact browser assertions for Picks, Captain Watchlist, and Match Environment copy. Elegance improved in this pass because `script.js` now delegates strategy copy and Team Builder status copy to the public helper layer.
