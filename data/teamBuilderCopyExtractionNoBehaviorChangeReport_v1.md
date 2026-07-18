# Team Builder Copy Extraction No-Behavior-Change Proof v1

Generated: 2026-07-18

Result: no model/output behavior change and no visible Team Builder wording change. The only intentional public loading difference is the cache-bust query for `teamBuilderPublicHelpers.js`.

## Stable Public Output

| Metric | Before | After |
| --- | --- | --- |
| Team Builder explanation | Recommended Balanced Squad loaded from the validated Final Round Team Builder artifact: 11 starters on the field and 4 substitutes below. Raw projected points 59.6; optionality 5.3; composite 1014.9. | Same |
| Budget | 94.8 / 105 | 94.8 / 105 |
| Team counts | Argentina 8, Spain 5, France 1, England 1 | Argentina 8, Spain 5, France 1, England 1 |
| Fixture counts | final 13, third_place 2 | final 13, third_place 2 |
| Captain | Mikel Oyarzabal | Mikel Oyarzabal |
| Vice captain | Leandro Paredes | Leandro Paredes |
| Raw projected points | 59.552 | 59.552 |
| Optionality score | 5.291 | 5.291 |
| Composite score | 1014.93 | 1014.93 |
| Public recommendation rows | 675 total / 175 active | 675 total / 175 active |
| Public projection rows | 1659 total / 134 active | 1659 total / 134 active |

## Intentional Loading Difference

`teamBuilderPublicHelpers.js` moved from `?v=20260718-team-builder-public-helpers` to `?v=20260718-team-builder-display-labels` so the deployed page receives the updated display-helper content.

## Browser Proof

The browser-visible squad and explanation are validated by `scripts/validateFinalRoundBuilderBrowserEquivalenceV1.mjs`, and full viewport/browser public behavior is validated by `scripts/runPublicPreviewBrowserQa.mjs`.

Direct browser equivalence result: pass. The visible squad matched the generated artifact, the artifact-backed explanation text remained unchanged, optionality text was visible, old globals were absent, and console/page errors were `0`.

Public preview browser QA result: pass. It tested 5 index viewports and 5 World Cup viewports, with `0` console errors, `0` console warnings, and `0` blocking failed requests.
