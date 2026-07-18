# Code Elegance Audit v1

Generated: 2026-07-18T12:16:55.421Z

Status: **pass**

## Scores

- correctness: 4/5
- elegance: 3/5
- maintainability: 3/5
- testability: 3/5
- data_architecture: 3/5
- model_transparency: 3/5
- ui_polish: 4/5
- performance: 3/5
- client_readiness: 3/5

## Largest Files

- `script.js`: 15400 lines, 599320 bytes
- `style.css`: 6295 lines, 116285 bytes
- `scripts/buildFantasyPoolRecommendationsV3.mjs`: 3894 lines, 186543 bytes
- `scripts/buildFantasyPoolScorePredictionsV3.mjs`: 1849 lines, 90999 bytes
- `scripts/buildPlayerEnrichmentLayer.mjs`: 1771 lines, 84163 bytes
- `scripts/step66PeleForwardRecalibration.mjs`: 1681 lines, 94450 bytes
- `scripts/step65PeleIntegration.mjs`: 1666 lines, 93183 bytes
- `scripts/buildFantasyPoolMatchdayProjectionsV3.mjs`: 1552 lines, 74215 bytes
- `scripts/buildFantasyPoolMinutesModel.mjs`: 1499 lines, 62845 bytes
- `scripts/buildFantasyPoolRecommendationsV4Md2.mjs`: 1492 lines, 71787 bytes
- `scripts/matchOfficialFantasyPlayers.mjs`: 1444 lines, 59157 bytes
- `scripts/buildFantasyPoolMatchdayProjectionsV4Md2.mjs`: 1436 lines, 69036 bytes

## Longest Functions

- `script.js:1536` formationListText: 736 lines
- `script.js:2417` financeContextScore: 565 lines
- `script.js:1080` currentFantasyPoolPlayerFromOfficialRecord: 181 lines
- `script.js:15184` setupBuilder: 175 lines
- `script.js:12888` optimizerCandidatePools: 171 lines
- `script.js:9198` renderSubstitutionAdvisor: 156 lines
- `script.js:8952` renderCaptainChangeAdvisor: 152 lines
- `script.js:628` isUnavailableInOfficialFantasy: 149 lines
- `script.js:4306` publicProfileTagHelpHtml: 141 lines
- `script.js:10509` squadStrategyReportData: 139 lines

## Top Elegance Problems

- Large monolithic script.js mixes public UI, model logic, Team Builder optimization, export/import, and caveat rendering.
- Team Builder has both generated artifact default and browser optimizer path.
- Fallback logic is scattered and hard to audit globally.
- Stage-specific concepts are represented by strings across code and data rather than a single stage manifest.
- Budget/rules copy and budget/rules execution can drift.
- Generated data contains internal diagnostics in public wrappers.
- Historical stage artifacts remain close to active artifacts in naming and load logic.
- QA scripts are numerous and phase-specific, with no single active public contract.
- CSS is a single large file with many feature-specific selectors.
- Model weights live across docs, generated artifacts, and browser constants.

## Easiest Cleanup Wins

- Update Stats Notes budget copy for Final Round.
- Add an activePublicStageManifest_v1.json consumed by build and QA scripts.
- Centralize fallback declarations in one reportable object.
- Split Team Builder browser optimizer from DOM rendering.
- Move current-stage source/caveat copy into generated public metadata.
- Add wrapper/source parity checks to one command.
- Create compact public projections and keep diagnostics internal.
- Archive old stage scripts from default QA docs.
- Add file headers to active wrapper builders naming source and validator.
- Create a short client-readable model weights appendix.

## Structural Refactors

- Introduce scripts/lib/stageManifest.mjs as the only active-stage source.
- Move Team Builder scoring profiles and optimizer into scripts/lib/teamBuilderModel.mjs.
- Generate public Team Builder artifacts for every strategy instead of recomputing defaults in the browser.
- Split script.js into data-access, renderers, decision tools, and Team Builder modules.
- Split public wrapper data into display and diagnostics payloads.
- Create a manifest-driven QA runner that executes source, wrapper, browser, and deployment gates.
- Normalize player identity fields across official and legacy rows.
- Normalize fixture identity into bracket_slot_id plus source_fixture_id metadata.
- Move long Stats Notes into versioned docs with short in-page summaries.
- Retire old stage paths from public controls when active stage is Final Round.

## Issues

- **WARN / Large files:** script.js and style.css are large, combining UI rendering, model joins, optimizer logic, and copy in files that are hard to review end to end. Evidence: `[{"file":"script.js","lines":15400,"bytes":599320},{"file":"style.css","lines":6295,"bytes":116285}]`.
- **WARN / Function length:** Several browser functions are long enough to hide stage-specific behavior and fallback decisions. Evidence: `{"longestFunctions":[{"file":"script.js","name":"formationListText","start":1536,"lines":736},{"file":"script.js","name":"financeContextScore","start":2417,"lines":565},{"file":"script.js","name":"currentFantasyPoolPlayerFromOfficialRecord","start":1080,"lines`.
- **WARN / Hidden fallback logic:** Fallback behavior exists across data loading, score labels, pick modes, and optimizer candidate pools. Most is defensive, but it is scattered. Evidence: `{"fallbackMentions":78}`.
- **WARN / Generated/UI boundary:** Generated model data is cleanly wrapped, but browser code still computes many strategic scores and squad adjustments.
