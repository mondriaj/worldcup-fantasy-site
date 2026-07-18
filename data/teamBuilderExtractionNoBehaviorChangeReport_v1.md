# Team Builder Extraction No-Behavior-Change Proof v1

Generated: 2026-07-18

Result: no public behavior change. The only intentional public wiring change is adding `teamBuilderPublicHelpers.js` before `script.js`.

## Artifact Squad

Unchanged 15-player artifact list:

Emiliano Martínez; Unai Simón; Nicolás Tagliafico; Nahuel Molina; Lisandro Martínez; Cristian Romero; Pau Cubarsí; Leandro Paredes; Alexis Mac Allister; Enzo Fernández; Álex Baena; Fabián Ruiz; Kylian Mbappé; Harry Kane; Mikel Oyarzabal.

## Metric Comparison

| Metric | Before | After |
| --- | --- | --- |
| Budget | 94.8 / 105 | 94.8 / 105 |
| Team counts | Argentina 8, Spain 5, France 1, England 1 | Argentina 8, Spain 5, France 1, England 1 |
| Fixture counts | final 13, third_place 2 | final 13, third_place 2 |
| Captain | Mikel Oyarzabal | Mikel Oyarzabal |
| Vice captain | Leandro Paredes | Leandro Paredes |
| Raw projected points | 59.552 | 59.552 |
| Optionality score | 5.291 | 5.291 |
| Composite score | 1014.93 | 1014.93 |
| Source recommendation rows | 175 | 175 |
| Public recommendation rows | 675 total / 175 active | 675 total / 175 active |
| Source projection rows | 134 | 134 |
| Public projection rows | 1659 total / 134 active | 1659 total / 134 active |
| Active eligible teams | France, England, Spain, Argentina | France, England, Spain, Argentina |

## Browser Proof

The browser-visible squad is validated by `scripts/validateFinalRoundBuilderBrowserEquivalenceV1.mjs`, which compares visible starters/bench, team counts, fixture counts, captain, vice captain, optionality display, old globals, and console/page errors against the generated artifact.

Direct browser equivalence result: pass. The visible browser squad matched the generated artifact, the generated-artifact default message was present, optionality was visible as `5.3`, old globals were absent, and console/page errors were `0`.

Public preview browser QA result: pass. It tested 5 index viewports and 5 World Cup viewports, with `0` console errors, `0` console warnings, and `0` blocking failed requests.

## Intentional Difference

`teamBuilderPublicHelpers.js` is now loaded by `index.html` between `teamBuilderFinalRoundArtifactData.js` and `script.js`. This adds no selected-player data and does not rebuild the model; it exposes pure public helper functions used by `script.js`.
