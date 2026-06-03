# Official Data Next Steps

This is the first file future Codex sessions should read when official World Cup fantasy data changes.

The project now has an official fantasy-pool public layer. Do not expand the recommendation model again unless the monitor finds player, price, position, status, rules, round, or language changes that affect model fields, or unless final squads become source-backed.

## Current Expected State

- Official data readiness: public official-fantasy-pool layer is active; final model rerun remains blocked by final-squad source-backing.
- Official fantasy players: imported from FIFA's fantasy player JSON.
- Official fantasy rules: imported, with active rules promoted to `fantasyRules.json` and `fantasyRulesData.js`.
- Official final squads: fantasy pool is used as the public site authority; final-squad source-backing remains an internal audit blocker.
- Active public pick prices: official fantasy prices.
- Active score model: PELE-forward prototype `data/scorePredictions_v2.json`
- Active public official-pool browser files: `fantasyPoolRecommendationsData.js`, `fantasyPoolMatchdayProjectionsData.js`, `fantasyPoolFinanceMetricsData.js`, `fantasyPoolScorePredictionsData.js`, and `fantasyPoolOfficialDataStatusData.js`.

## Input Files To Add

Use the templates in `data/imports/` and keep source URLs/dates on every row.

- `data/imports/officialSquads.csv`
  - Template: `data/imports/officialSquads_TEMPLATE.csv`
  - Required: `name`, `country`, `team_id`, `roster_status`, `source_url`, `source_checked`

- `data/imports/officialFantasyPlayers.csv`
  - Template: `data/imports/officialFantasyPlayers_TEMPLATE.csv`
  - Required: `official_fantasy_player_id`, `name`, `country`, `team_id`, `official_fantasy_position`, `official_price`, `selectable_status`, `source_url`, `source_checked`

- `data/imports/officialFantasyRules.json`
  - Template: `data/imports/officialFantasyRules_TEMPLATE.json`
  - Required: squad rules, budget, country limits, captain rules, substitutions, transfers, boosters, scoring, deadlines, source IDs, and source checked date

## Import Order

If the monitor finds material changes, use this preferred order:

1. Import official fantasy players, IDs, positions, prices, and selectable status when player fields changed.
2. Import official fantasy rules, scoring, deadlines, captain rules, and substitution rules when rules or language fields changed.
3. Import or reconcile final official squads only when a source-backed final-squad feed or source list is available.
4. Run the official-data update check and readiness validator.
5. Continue to model reruns only if the change affects model fields or final-squad source-backing becomes ready.

Commands:

```bash
node scripts/importOfficialSquads.mjs
node scripts/importOfficialFantasyPlayers.mjs
node scripts/importOfficialFantasyRules.mjs
node scripts/validateOfficialDataReadiness.mjs
```

Expected import-success statuses before a full final-squad model rerun:

- `data/officialSquadsImportReport_v0.json`: `imported_ready_for_readiness_check`
- `data/officialFantasyImportReport_v0.json`: `imported_ready_for_readiness_check`
- `data/officialFantasyRulesImportReport_v0.json`: `imported_ready_for_readiness_check`
- `data/officialDataReadiness_v0.json`: `ready_for_official_model_rerun`

Stop a full final-squad model rerun if any report says `awaiting_*`, `imported_with_errors`, `imported_needs_manual_review`, `imported_needs_team_completion_review`, or `blocked_waiting_for_official_fantasy_data`. Public official-pool maintenance can still proceed when the monitor reports only non-model-field changes.

## Manual Review Before Model Reruns

Before touching active model files, inspect:

- unmatched official fantasy player rows
- duplicate official fantasy IDs
- null or non-numeric official prices
- missing official fantasy positions
- official squad rows with `review` status
- excluded current players from teams marked `team_squad_complete=true`
- missing captain, substitution, transfer, booster, scoring, or deadline rule sections

Do not invent missing values. Keep missing official fields null and mark them for review.

## Model Rerun Plan

After readiness passes, create or adapt versioned regeneration scripts. Do not overwrite old model versions without preserving audit files.

Recommended version targets:

- `data/playerValueModel_v2.json` from official prices
- `data/playerFinanceMetrics_v1.json` from official prices and scoring rules
- `data/playerRecommendationInputs_v1.json` with official squad/fantasy matching fields
- `data/playerMinutesModel_v1.json` if final squads or availability materially change role confidence
- `data/scorePredictions_v3.json` if official squads, injuries, or updated team context materially change team strength
- `data/playerMatchdayProjections_v3.json` from the official-data score and player model
- `data/matchdayRecommendations_v3.json` from the official-data projection model
- `data/recommendationQa_v3.json` and `data/recommendationQaReport_v3.md`

Browser-ready files to regenerate after review:

- `playersData.js`, if active player IDs/statuses changed
- `financePlayersData.js`
- `fantasyRulesData.js`
- `scorePredictionsData.js`
- `matchdayProjectionsData.js`

Important: `scripts/step66PeleForwardRecalibration.mjs` is the current PELE-forward recalibration script. Do not treat it as a full official-data rerun unless it has been adapted to consume official squads, official prices, official positions, and official rules.

## Score Prediction Guidance

PELE should remain a major driver of team quality and score predictions.

Use official squad and injury/news data to adjust team context only where source-backed. Do not reduce PELE to a marginal input just because other data arrives.

Preserve:

- `data/teamQuality_v0.json`
- `data/teamQuality_v1.json`
- current `data/teamQuality.json`
- `data/scorePredictions_v0.json`
- `data/scorePredictions_v1.json`
- `data/scorePredictions_v2.json`

Create a new version if the score model changes materially.

## Team Builder And Decision Tool Updates

Current launch state:

- Active public picks use official prices, positions, selectable status, and scoring.
- Active `fantasyRules.json` uses the official rules import summary.
- Team Builder remains planning help and must be checked inside the official FIFA game.

For future material changes:

- Refresh affected public browser-ready files only after the monitor or import reports identify model-field changes.
- Keep older proxy-price fields as audit fields, not public pick values.
- Re-test Team Builder legality against official rules.
- Re-test Captain Change Advisor and Substitution Advisor against official captain/substitution windows.
- Keep manual points entry unless a reliable official live fantasy feed is added.

## Required QA Before Calling It Ready

Run static checks:

```bash
node scripts/validateOfficialDataReadiness.mjs
git diff --check
```

Run JSON and JS syntax checks. If no project-specific test script exists, use Node parse checks across JSON and JS/MJS files.

Run browser checks on desktop and mobile:

- homepage loads
- Quick Picks render
- Captain Picks render
- Team Advice filters work
- Player Profile opens
- Match Environment renders score predictions
- Team Builder builds a full squad
- official rules/prices appear in Team Builder context
- Team Export JSON parses
- Team Import restores exact players
- Captain Change Advisor remains conservative for strong scores
- Substitution Advisor still requires manual played/unplayed checks
- Matchday Decision Center reflects the built/imported squad
- World Cup page renders
- no console errors
- no page-level horizontal overflow

## Documentation To Update

After official data is imported and model files are regenerated, update:

- `README.md`
- `SITE_FEATURES.md`
- `WEEK6_RECOMMENDATION_ENGINE_PLAN.md`
- `data/README.md`
- `data/dataSources.md`
- `data/dataQualityReport.md`
- `data/sourceManifest.json`
- `data/officialDataReadiness_v0.md`
- this file

## Stop Conditions

Stop and report the blocker instead of continuing if:

- official input files are unavailable
- source URLs or checked dates are missing
- official prices are incomplete
- official fantasy positions are incomplete
- official squad matching has unresolved review rows
- official rules become incomplete, missing, or materially changed without review
- readiness does not return `ready_for_official_model_rerun`
- browser validation fails after regeneration

The right behavior is to leave public picks marked as current official-fantasy-pool picks, while clearly separating any blocked final-squad model rerun from the public recommendation layer.
