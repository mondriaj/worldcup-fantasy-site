# Team Builder Extraction Report v1

Generated: 2026-07-18

This was a small first extraction, not a full Team Builder rewrite. Code elegance improved because the public artifact contract now has named helpers, but most model and rendering complexity still lives in `script.js`.

## Extracted

- `scripts/lib/teamBuilderPublicModel.mjs`: pure ESM helpers for artifact schema validation, fixture-authority eligible-team keys, team/fixture counts, selected-squad summary, budget display, objective labels, risk labels, optionality labels, and generated-artifact explanation copy.
- `teamBuilderPublicHelpers.js`: browser-safe global wrapper loaded before `script.js`.
- `script.js` now uses the helper for Final Round eligible-team keys, record eligibility matching, country count helper path, artifact validation, and artifact-backed default explanation text.

## Still In `script.js`

- Optimizer search and pruning.
- Candidate pools and fallback ranking.
- Strategy scoring profiles and portfolio optimizer formulas.
- Optionality, Third Place risk, role volatility, captain scoring, and user lock/picker logic.
- DOM rendering for the field, bench, cards, portfolio analytics, and strategy report.

These remain because they are behavior-sensitive, DOM-coupled, or both. Moving them safely needs a tighter equivalence harness than this first helper extraction required.

## Remaining Duplicate Logic

The browser optimizer and generated artifact builder still contain overlapping objective concepts. The public default uses the artifact, so the duplicate browser optimizer does not control the default squad, but it remains available for custom interactions.

## Next Safe Extraction Step

Move read-only Team Builder strategy copy and objective-component display labels out of `script.js`, then add a browser snapshot proving every visible explanation string remains stable. Risk: low to medium.

The next higher-risk step is extracting optimizer weights and optionality/Third Place formulas into a shared model module with golden score fixtures. Risk: medium to high unless the equivalence harness asserts every selected squad, score, captain, vice captain, and warning field.

## Public Behavior

Expected unchanged. The Final Round public default remains artifact-backed, budget remains `94.8 / 105`, eligible teams remain fixture-authority driven, and the generated artifact remains untouched.

## Remaining Cleanup Items

- Unify generated artifact and browser optimizer objective logic in one audited model module.
- Remove or constrain hidden browser fallback once custom-input behavior has an artifact-safe replacement.
- Continue public payload cleanup for any non-active historical rows that are not required by public views.
- Add exact browser assertions for Picks, Captain Watchlist, and Match Environment copy around Final Round context.
- Polish Team Builder copy after logic extraction is complete.
