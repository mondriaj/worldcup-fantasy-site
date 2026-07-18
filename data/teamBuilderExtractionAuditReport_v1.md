# Team Builder Extraction Audit v1

Generated: 2026-07-18

Status: GREEN for a small first extraction. This is a refactor-only pass; no model output, generated artifact, projections, recommendations, score predictions, PELE, fixtures, or public rankings were changed.

## Current Behavior

- Active stage remains `finalRound`.
- Browser Team Builder default is artifact-backed.
- The browser optimizer still exists for custom locks, filters, non-default strategy choices, or changed risk controls.
- The browser optimizer cannot affect the default squad while the artifact gate is active.
- Default budget remains `94.8 / 105`.
- Eligible teams remain fixture-authority driven: France, England, Spain, Argentina.

## Safe To Extract Now

- Public artifact schema/shape validation.
- Eligible-team helper wrappers that read from Final Round fixture authority.
- Count-by-team and count-by-fixture summary helpers.
- Public objective-component labels and simple risk/optionality labels.
- The generated-artifact explanation string shown by the default Team Builder result.

## Risky To Extract Now

- `teamBuilderStrategyScoringProfiles`, `teamBuilderStrategyPlayerScore`, `portfolioOptimizerWeights`, and `portfolioOptimizerAdjustment`: behavior-sensitive scoring logic.
- `optimizerCandidatePools` and `buildSuggestedSquad`: candidate filtering, price floors, risk controls, trust modes, locks, and fallback ranking are intertwined.
- `chooseStartersFromSquad`, captain/vice selection, and user bench ordering: user-visible state.
- `finalRoundPlayerStrategicMetrics`: optionality, Third Place risk, role volatility, and fixture context all feed scoring.

## Should Remain In `script.js` For Now

- DOM rendering: `renderTeam`, `renderBench`, `renderPlayerPicker`, `renderPickCard`.
- User interaction state: locks, removed players, country/price/risk filters, swap state, import/export UI.
- Browser lookup glue: resolving artifact rows to local player records.

## Later Cleanup

- Move optimizer/model formulas into one shared model module only with artifact/browser equivalence tests around every score.
- Delete or heavily constrain the hidden browser fallback after custom-input behavior has a source-backed replacement.
- Split long rendering functions into view helpers once model logic is separated.

## Explicit Audit Answers

- Browser default artifact-backed: yes.
- Browser optimizer still exists: yes.
- Browser optimizer can affect default squad: no, not when default artifact inputs are active.
- Duplicate objective logic remains: yes.
- Hidden fallback could reintroduce old bugs: yes, for non-default/custom inputs if future edits bypass active-stage gates.
- Functions too long or mixed-purpose: `buildSuggestedSquad`, `optimizerCandidatePools`, `portfolioOptimizerAdjustment`, `squadPortfolioAnalytics`, `renderTeam`, `renderPlayerPicker`, `renderPickCard`, `renderSquadStrategyReport`, `strategyComparisonResult`, `finalRoundPlayerStrategicMetrics`.
- Safest extraction now: public artifact validation, fixture-authority helpers, count helpers, objective labels, risk/optionality labels, and generated-artifact explanation copy.
