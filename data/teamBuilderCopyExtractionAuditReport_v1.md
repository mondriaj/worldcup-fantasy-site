# Team Builder Copy Extraction Audit v1

Generated: 2026-07-18

Status: GREEN for copy/label extraction. This pass moved low-risk presentation logic only; no model outputs, weights, generated artifact data, projections, recommendations, score predictions, PELE, fixtures, or rankings were changed.

## Extracted Now

- Strategy option keys, labels, descriptions, aliases, and comparison strategy keys from `script.js` lines 1870-1968 into `scripts/lib/teamBuilderPublicModel.mjs` and `teamBuilderPublicHelpers.js`.
- Artifact-backed objective summary copy from the default Team Builder message.
- Team Builder render status messages for empty preview, locked preview, partial squad, over-budget squad, generated artifact load, and built squad.
- Pure squad strategy-fit explanation text from `squadStrategyFitText`.

## Left In `script.js`

- DOM-coupled rendering strings for player cards, portfolio metric cards, warning HTML, imports/exports, and decision tools.
- Budget legality text in rule validation because it sits next to validation state.
- Captain/vice copy because it depends on user selection, saved state, and export behavior.
- Third Place risk tag copy because it is currently tied to profile-tag and portfolio-warning rendering.

## Audit Findings

- Duplicate strings remain around Budget Pressure, Captain Watchlist/Captain Option, Third Place risk, role caution, and source-backed caveats.
- No stale Final Round budget wording was found.
- Potentially confusing labels remain: `Budget Pressure` has both metric and warning use; `Optionality Score` stays concise but needs its FIFA-lock caveat.
- Overlong caveats remain in imported decision-tool warnings and export model caveats, intentionally.
- Model labels are still hidden inside rendering code in portfolio analytics, strategy report metrics, profile tags, and pick-card labels.

## Line Count

- `script.js` before: 15423 lines.
- `script.js` after: 15286 lines.
- Reduction: 137 lines.
