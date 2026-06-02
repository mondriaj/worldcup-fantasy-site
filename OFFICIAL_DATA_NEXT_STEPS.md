# Official Data Next Steps

This is the first file future Codex sessions should read when official World Cup fantasy data becomes available.

The project is currently paused at the official-data gate. Do not expand the recommendation model again until final squads, official fantasy player data, prices, positions, and rules are imported and validated.

## Current Expected State

- Official data readiness: `blocked_waiting_for_official_fantasy_data`
- Official fantasy players: waiting for `data/imports/officialFantasyPlayers.csv`
- Official fantasy rules: waiting for `data/imports/officialFantasyRules.json`
- Official final squads: waiting for `data/imports/officialSquads.csv`
- Active prices: `proxy_price_v1`, not official prices
- Active score model: PELE-forward prototype `data/scorePredictions_v2.json`
- Active matchday projections: `data/playerMatchdayProjections_v2.json`
- Active recommendation shortlists: `data/matchdayRecommendations_v2.json`

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

If only one official file is available, import that file and stop at the readiness gate.

If all official files are available, use this preferred order:

1. Import final official squads.
2. Import official fantasy players, IDs, positions, prices, and selectable status.
3. Import official fantasy rules, scoring, deadlines, captain rules, and substitution rules.
4. Run the official-data readiness validator.
5. Only continue to model reruns if readiness says `ready_for_official_model_rerun`.

Commands:

```bash
node scripts/importOfficialSquads.mjs
node scripts/importOfficialFantasyPlayers.mjs
node scripts/importOfficialFantasyRules.mjs
node scripts/validateOfficialDataReadiness.mjs
```

Expected import-success statuses before model reruns:

- `data/officialSquadsImportReport_v0.json`: `imported_ready_for_readiness_check`
- `data/officialFantasyImportReport_v0.json`: `imported_ready_for_readiness_check`
- `data/officialFantasyRulesImportReport_v0.json`: `imported_ready_for_readiness_check`
- `data/officialDataReadiness_v0.json`: `ready_for_official_model_rerun`

Stop if any report says `awaiting_*`, `imported_with_errors`, `imported_needs_manual_review`, `imported_needs_team_completion_review`, or `blocked_waiting_for_official_fantasy_data`.

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

After official prices and rules pass validation:

- Replace prototype budget behavior with official prices.
- Replace draft squad, budget, country, position, transfer, booster, captain, and substitution rules with official rules only after review.
- Keep proxy prices as audit fields, not active budget values.
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
- official rules are incomplete or still draft/starter status
- readiness does not return `ready_for_official_model_rerun`
- browser validation fails after regeneration

The right behavior is to leave the site clearly marked as a prototype until the official-data gate passes.
