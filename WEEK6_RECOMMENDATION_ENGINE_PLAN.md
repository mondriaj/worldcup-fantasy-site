# Week 6 Recommendation Engine Plan

Created: June 1, 2026  
Status: living plan. Update this file as work is completed, changed, or replaced.

## Purpose

This plan keeps the Week 6 recommendation work in one clear order.

We now have several useful model pieces:

- player finance metrics
- matchday projections
- score predictions
- recommendation trust modes
- Team Builder optimizer rules
- squad portfolio analytics
- proxy fantasy prices
- matchday captain-change advice
- matchday substitution advice

The next work should connect those pieces in a deliberate order instead of adding features one at a time without a shared roadmap.

## Status Legend

- `DONE` - already built and checked
- `NEXT` - should be worked on next
- `QUEUED` - important, but after the `NEXT` items
- `LATER` - valuable after official data improves
- `BLOCKED` - waiting for official or external data

## Why The Previous Next Steps Sounded Different

The ideas were all valid, but they belong to different layers.

- QA-adjusted scores decide which players are trustworthy enough to recommend.
- Team Advice filters decide how much risk the user wants to see.
- Team Builder constraints decide what the squad optimizer is allowed to select.
- Proxy price calibration decides whether the budget model is distorting squad quality.
- Squad portfolio analytics explains whether a built squad has good risk and return.
- Portfolio-aware optimization would make those portfolio metrics change the squad search itself.

The correct order is:

1. make player-level recommendation trust consistent
2. give users simple risk filters in advice views
3. give users risk constraints in Team Builder
4. calibrate proxy prices so the budget model behaves better
5. then let portfolio analytics influence the optimizer
6. then add manual matchday decision tools for captain changes and substitutions
7. finish with export JSON cleanup and full feature testing

Portfolio-aware optimization is powerful, but it should come after proxy price v1. If proxy prices are too tight or badly distributed, the optimizer may solve the wrong problem.

## Current Baseline

`DONE`

- Built the Week 6 data folder and starter data files.
- Built World Cup 2026 teams, fixtures, matchdays, team quality, and score-prediction data.
- Added PELE Data Integration Step 6.5 from Silver Bulletin Datawrapper CSVs.
- Built roster and player-performance data from multiple public sources.
- Added national-team and qualifier-performance data where available.
- Created finance-style player metrics in `data/playerFinanceMetrics_v0.json`.
- Created recommendation inputs in `data/playerRecommendationInputs_v0.json`.
- Created matchday player projections in `data/playerMatchdayProjections_v0.json`.
- Created score prediction model notes in `data/scorePredictionModelRoadmap.md`.
- Added Recommendation Trust Modes v0, now shown to users as Safer Picks, Balanced, High Upside, and Punts.
- Added Team Builder budget-reserve logic so Balanced and Safer Picks can fill full 15-player squads when explicit advanced controls allow it.
- Added Squad Portfolio Analytics v0 to explain built squads after the optimizer runs.
- Added export support for portfolio analytics.
- Updated active team quality, score predictions, matchday projections, score QA, and recommendation QA to PELE-forward v2 files while preserving PELE-backed v1 and pre-PELE v0 files for audit.

Known baseline limits:

- Final official World Cup squads are still not fully locked.
- Official 2026 fantasy prices are not available.
- Official 2026 fantasy positions and scoring rules are not available.
- Current prices use `proxy_price_v1`; `proxy_price_v0` remains available for audit.
- Current VaR, CVaR, and expected return are prototype estimates, not backtested tournament fantasy outcomes.

## Ordered Work Plan

### 1. Recommendation Reliability Pass

Status: `DONE`

Goal: make sure the existing measures and trust modes are applied consistently across the site.

Tasks:

- Review Quick Picks, Captain Picks, Team Advice, Player Profile, and Team Builder scoring.
- Confirm that all views use the same trust-adjusted score logic where appropriate.
- Penalize low data confidence, uncertain roster status, low start probability, low expected minutes, hard fixture, missing fixture data, high volatility, and high tail risk.
- Keep the original style scores visible or recoverable so the model does not become a black box.
- Make sure Safer Picks is conservative but not empty or painful.
- Make sure High Upside and Punts still surface upside and punt options with warnings.

Tests after this step:

- Run JavaScript syntax check.
- Parse all JSON data files.
- Open the site in the browser.
- Check Quick Picks, Captain Picks, Team Advice, Player Profile, and Team Builder.
- Confirm each trust mode changes rankings in a visible way.
- Confirm no section goes blank without a useful fallback.
- Confirm exported squad data includes the active trust mode and recommendation context.

Completion note, June 1, 2026:

- Added visible raw versus trust-adjusted score breakdowns to Captain Picks and Team Advice.
- Added adjusted/raw score context to Quick Picks cards and player-picker score tooltips.
- Made Player Profile QA context follow the view that opened it, such as captain, attack-heavy, or very-risky advice.
- Split recommendation-use warnings into safer categories: caveat, watchlist-only, manual review, and do-not-rank-yet.
- Added missing fixture-projection context as a QA watch flag.
- Added per-player `recommendation_score` breakdowns to exported Team JSON.
- Verified JavaScript syntax, HTML parsing, JSON parsing, trust-mode behavior, QA chips, portfolio analytics, full Safer Picks/Balanced squads, and export score breakdowns.

### 2. Team Advice Trust Filter

Status: `DONE`

Goal: let the user choose between playable recommendations and broader watchlist punts.

Tasks:

- Add a clear Team Advice control with at least two states:
  - playable recommendations only
  - include watchlist punts
- Respect the active trust mode.
- Show clear counts so the user understands when players were filtered out.
- Keep risky players visible in High Upside or Punts mode when the user asks for upside.
- Do not remove players from the database just because they are filtered from one view.

Tests after this step:

- Check Team Advice for every position.
- Check Team Advice for each matchday.
- Check all four trust modes.
- Confirm playable-only mode does not include players marked as high review unless explicitly allowed.
- Confirm watchlist mode brings back upside options with warning chips.

Completion note, June 1, 2026:

- Added a Team Advice `Recommendation Pool` control with `Playable recommendations` and `Include watchlist punts`.
- Playable mode hides QA-review, watchlist-only, manual-review, and do-not-rank players from Team Advice.
- Watchlist mode keeps the broader pool so High Upside and Punts users can see punt candidates with warning chips.
- Added count text showing how many players are ranked, hidden by trust mode, hidden by playable filtering, or included as QA-review/watch players.
- Verified Team Advice across all positions, all matchday views, all four trust modes, and both pool settings.

### 3. Team Builder Risk Constraint Controls

Status: `DONE`

Goal: give the user practical squad-building controls instead of hiding all risk logic inside the optimizer.

Tasks:

- Add a minimum start probability control.
- Add a maximum QA-review players control.
- Add an allow risky picks control.
- Consider a minimum expected minutes control if the first version is not enough.
- Connect the controls to Team Builder candidate selection.
- Keep locked players visible even when they violate a new constraint.
- Explain constraint failures with useful warnings.

Tests after this step:

- Build squads in Balanced, Safer Picks, High Upside, and Punts.
- Test with low and high start-probability requirements.
- Test with zero QA-review players allowed.
- Test locked risky players.
- Confirm the builder either creates a full legal squad or explains why it cannot.
- Confirm no partial squad appears silently.

Completion note, June 1, 2026:

- Added Team Builder controls for minimum start probability, minimum expected minutes, maximum QA-review players, and allowing or blocking risky fill-ins.
- Kept locked players visible even when they break a new risk control.
- Connected the controls to player picker filtering, optimizer candidate pools, budget-reserve candidate floors, optimizer warnings, Team Builder messages, and exported Team JSON.
- Exported squads now include `builder_risk_constraints` with active settings, squad QA-review count, risky-player count, violations, and a locked-player note.
- Partial squads caused by over-tight risk controls now show explicit warnings and cannot be exported as Team JSON.
- Verified default, start/minutes floors, no-risky-fill-ins, max-QA-review zero, Safer Picks max-QA-review zero, and intentionally over-tight combined settings.

### 3A. Recommendation Mode UX Softening

Status: `DONE`

Goal: prevent conservative settings from feeling like a broken product.

Tasks:

- Rename public-facing modes from model-lab language to user-friendly choices:
  - Strict becomes Safer Picks
  - Aggressive becomes High Upside
  - Chaos/Risky becomes Punts
- Keep Balanced as the default and smoothest experience.
- Change Safer Picks from a hard ranking filter into a strong scoring preference.
- Keep the internal `strict` id for backwards-compatible exports and tests.
- Make advanced Team Builder risk controls clearer, especially QA Review Limit `0`.
- Keep partial squad protection: if explicit advanced controls make a full squad impossible, warn clearly and block Team JSON export.

Tests after this step:

- Confirm recommendation-mode labels update across Quick Picks, Captain Picks, Team Advice, and Team Builder.
- Confirm Safer Picks can still build a full squad with default controls.
- Confirm QA Review Limit `0` is clearly treated as advanced and can still warn/block export when too tight.
- Confirm exported Team JSON still includes the selected trust mode id and label.

Completion note, June 1, 2026:

- Renamed the public controls to Balanced, Safer Picks, High Upside, and Punts.
- Safer Picks now uses strong QA and role penalties instead of hard-filtering the whole ranking pool.
- Updated Team Builder helper copy so users understand Balanced is smoothest and advanced risk limits can reduce squad completion.
- Kept export compatibility by leaving the internal `strict` id and `strict_failure_penalty` field in place.

### 4. Proxy Price v1 Calibration

Status: `DONE`

Goal: make prototype prices more realistic so budget logic improves squad quality instead of accidentally blocking good squads.

Tasks:

- Audit `proxy_price_v0` distribution by position.
- Audit `proxy_price_v0` distribution by team quality.
- Audit price versus expected return, minutes confidence, and risk-adjusted return.
- Reduce overpricing where proxy prices are squeezing squads too much.
- Increase prices only where stars are clearly underpriced by the prototype model.
- Create `proxy_price_v1` or update the generated value model with clear version notes.
- Keep official fantasy price fields separate and null until official prices exist.

Tests after this step:

- Check that full squads can be built under Balanced and Safer Picks.
- Check that the best squads do not become all cheap players.
- Check that premium players are still selectable when justified.
- Check budget remaining, bench quality, and premium-squeeze warnings.
- Compare top value picks before and after calibration.

Completion note, June 1, 2026:

- Created `data/playerValueModel_v1.json` and documented it in `data/proxyPriceModel_v1.md`.
- Kept official fantasy prices separate and null.
- Preserved `proxy_price_v0` for audit and made `proxy_price_v1` the active browser price.
- v1 prices role-adjust expected return by start probability, expected minutes, and role confidence.
- Low-start or low-minute players cannot increase versus v0.
- Average position-ready proxy price moved from 6.03 to 5.59.
- 701 position-ready players became cheaper, 620 stayed unchanged, and 14 increased slightly.
- Updated `financePlayersData.js`, value scores, cheap-enabler scores, premium-worth-it scores, and overpay risk to use the v1 calibration.
- Updated the website, export text, README, and portfolio notes to reference `proxy_price_v1`.

### 5. Portfolio-Aware Team Builder Optimization

Status: `DONE`

Goal: move Squad Portfolio Analytics from explanation-only to optimizer input.

Tasks:

- Add portfolio-aware scoring to candidate squads.
- Penalize extreme country concentration.
- Penalize hard-fixture concentration on the same matchday.
- Penalize weak benches when premium players squeeze the squad.
- Reward stronger VaR and CVaR floors for conservative modes.
- Reward high upside and controlled volatility for High Upside mode.
- Keep Punts intentionally open to boom-bust squads.
- Make this a small adjustment at first, not a full rewrite of the optimizer.

Tests after this step:

- Compare the selected squad before and after portfolio-aware scoring.
- Confirm Safer Picks improves floor and QA profile.
- Confirm Balanced remains practical.
- Confirm High Upside still finds upside.
- Confirm Punts still creates high-upside squads.
- Confirm export includes portfolio metrics and optimizer mode context.

Completion note, June 1, 2026:

- Added Portfolio Optimizer v0 as a small adjustment inside completed squad ranking.
- Safer Picks now rewards stronger floor, start security, minutes, lower QA load, lower bench fragility, and lower tail risk.
- Balanced applies moderate return, floor, QA, bench, country, and fixture concentration weights.
- High Upside keeps stronger expected return and upside rewards while still applying smaller portfolio penalties.
- Punts stays permissive and can reward volatility/upside with only light concentration penalties.
- Team JSON export now includes `portfolio_optimizer` with the adjustment score and the inputs used.
- Added `data/portfolioOptimizerModel_v0.md`.

### 6. Score Predictor v0 Hardening

Status: `DONE`

Goal: improve the existing prototype match environment model without pretending it is final.

Tasks:

- Review team-quality inputs used by score predictions.
- Confirm Elo, FIFA ranking, team quality, and missing PELE values are handled consistently.
- Check matchday fixture effects for attacking and defensive player recommendations.
- Add simple sanity checks for extreme scorelines, clean-sheet probabilities, and upset probabilities.
- Keep the model documented as prototype v0.

Tests after this step:

- Check every group-stage fixture has a prediction row.
- Check expected goals are not negative or extreme.
- Check clean-sheet probabilities are between 0 and 1.
- Check favorites usually have better win probability than underdogs.
- Check matchday projections still load in the browser.

Completion note, June 1, 2026:

- Added Score Prediction QA v0 with 21 hardening checks.
- Current QA status is `pass_with_prototype_caveats`: 20 checks passed, 0 failed, and 1 caveat for missing numeric PELE ratings.
- Confirmed 72/72 group fixtures have score-prediction rows and 144/144 team-fixture views exist.
- Confirmed 4,017/4,017 player-matchday projection rows have score-prediction context.
- Confirmed expected goals, probabilities, favorite fields, top scorelines, and player-matchday multipliers stay inside v0 guardrails.
- Added `data/scorePredictionQa_v0.json` and `data/scorePredictionQaReport_v0.md`.
- `scorePredictions_v0.json` now includes `hardening_v0`.
- `scorePredictionsData.js` now exposes the model QA status to the Match Environment panel.

### 6.5. PELE Data Integration

Status: `DONE`

Goal: import Nate Silver / Silver Bulletin PELE ratings and use them in team quality and score environments without inventing missing values.

Completion note, June 1, 2026:

- Downloaded the PELE Datawrapper CSVs linked from the Silver Bulletin article.
- Created `data/peleRatings_v1.json` with 211 PELE rows and matched all 48 World Cup teams.
- Preserved the pre-PELE model in `data/teamQuality_v0.json`.
- Updated active `data/teamQuality.json` to `team_quality_v1`, using PELE rating in current strength and PELE offense/defense fields in attack/defense proxies.
- Created `data/scorePredictions_v1.json` and left `data/scorePredictions_v0.json` in place for audit.
- Regenerated `data/playerMatchdayProjections_v1.json`, `data/matchdayRecommendations_v1.json`, `data/recommendationQa_v1.json`, `scorePredictionsData.js`, and `matchdayProjectionsData.js`.
- Updated `data/scorePredictionQa_v1.json`; QA status is `pass` with 11 checks passed, 0 failed, and 0 caveats.
- Confirmed no PELE values were imputed.

### 6.6. PELE-Forward Score Model Recalibration

Status: `DONE`

Goal: make PELE ratings a major driver of team quality, score predictions, and downstream recommendations rather than a marginal input.

Completion note, June 1, 2026:

- Preserved the first PELE-backed team-quality model in `data/teamQuality_v1.json`.
- Updated active `data/teamQuality.json` to `team_quality_v2`, with current strength weighted 0.62 PELE, 0.23 World Football Elo, and 0.15 FIFA ranking points.
- Increased PELE offense/defense weight in attack and defense proxies and strengthened the direct PELE rating gap in expected-goals adjustments.
- Created `data/scorePredictions_v2.json` while preserving `data/scorePredictions_v1.json` and `data/scorePredictions_v0.json`.
- Regenerated `data/playerMatchdayProjections_v2.json`, `data/matchdayRecommendations_v2.json`, `data/recommendationQa_v2.json`, `scorePredictionsData.js`, and `matchdayProjectionsData.js`.
- Updated `data/scorePredictionQa_v2.json`; QA status is `pass` with 11 checks passed, 0 failed, and 0 caveats.
- Confirmed no PELE values were imputed.

### 7. Captain Change Advisor v0

Status: `DONE`

Goal: add a quick website check that helps a user decide whether to keep or change captain after some matches in a matchday have already been played.

Working name:

- `Quick Captain Switch Check`

Core idea:

- The user does not enter a full squad.
- The user manually enters the current captain's raw fantasy score before the captain double.
- The user chooses one replacement candidate and matchday.
- The tool compares the current score against the candidate's PELE-forward matchday projection, risk-adjusted return, upside, start probability, fixture context, and QA flags.
- The user is responsible for choosing a replacement who is in their squad and has not played yet.

Example logic:

- If the captain scored 2 points and strong captain options remain, recommend changing.
- If the captain scored 10 points, recommend keeping.
- If the captain scored 5 or 6 points, use expected return, upside, risk style, start probability, expected minutes, and fixture context to decide whether it is a close call.

Inputs needed:

- matchday
- current captain, optional but useful for display and same-player checks
- current captain raw points before captain double
- one replacement candidate
- risk preference: safer, balanced, upside

Outputs:

- keep captain
- change captain
- borderline decision
- needs-check decision
- explanation using expected return, risk-adjusted return, upside, start probability, expected minutes, fixture context, and QA flags

Rules:

- Do not invent live fantasy scores.
- Use manual user-entered fantasy points until a reliable official live fantasy feed exists.
- Do not infer squad membership or whether the replacement has already played.
- If official 2026 captain-switch rules differ from the current assumption, update the model and UI.
- Keep advice probability-style, not absolute. A 6-point captain may be a keep or close call depending on the selected replacement and risk style.

Completion note, June 1, 2026:

- Added a `Captain Change Advisor` section to the homepage.
- Added a compact user guide for matchday, raw points, replacement candidate, and risk style.
- Implemented the manual Quick Captain Switch Check in `script.js`.
- Added safer, balanced, and upside risk thresholds with compressed, floor-aware raw switch scores so prototype upside does not dominate raw-point comparisons.
- Calibrated the advisor so a 12+ raw captain score is treated as an excellent keep-leaning result, not a normal score to chase.
- Added result states for switch, keep, close call, and needs check.
- Added model documentation in `data/captainChangeAdvisorModel_v0.md`.
- Updated `README.md`, `data/README.md`, `data/dataSources.md`, `data/dataQualityReport.md`, and `data/sourceManifest.json`.

Tests after this step:

- Test a low captain score with elite players remaining.
- Test a high captain score with elite players remaining.
- Test a 5 or 6 point borderline captain score.
- Test a candidate without a matchday projection.
- Test conservative and aggressive risk preferences.
- Test all matchdays.
- Confirm the section works with manually entered points and does not require live data.

### 8. Substitution Advisor v0

Status: `DONE`

Goal: add a quick website check that helps a user decide whether to manually sub in one bench player during a matchday.

Working name:

- `Quick Substitution Check`

Core idea:

- The user does not enter a full squad.
- The user manually enters one played starter's raw fantasy score.
- The user chooses one bench candidate and matchday.
- The tool compares the starter score against the bench player's compressed raw-scale sub score, start probability, expected minutes, fixture context, and QA flags.
- The user is responsible for choosing a bench player who is in their squad and has not played yet.
- Different-position substitutions are flagged because the tool cannot validate full formation legality without the full lineup.

Example logic:

- If a defender has 0 points and a bench player with good start probability remains, recommend subbing.
- If a player has 4 points, the recommendation depends on the bench player's expected return, downside risk, position eligibility, and minutes confidence.
- If the bench player is risky or unlikely to start, the tool may recommend keeping the 4 points.
- If the starter has 6+ points, keep or close call becomes more likely unless the bench player has a clear edge.

Inputs needed:

- matchday
- played starter, optional but useful for display and position checks
- played starter raw points
- one bench candidate
- risk preference: safer, balanced, upside

Outputs:

- keep current lineup
- make substitution
- close call
- needs-check decision
- explanation using compressed raw score, floor, upside, start probability, expected minutes, fixture context, QA flags, and formation warning

Rules:

- Do not invent live fantasy scores.
- Use manual user-entered fantasy points until a reliable official live fantasy feed exists.
- Do not infer squad membership or whether the bench candidate has already played.
- Do not claim formation legality for different-position substitutions without full lineup context.
- Do not recommend subbing out a player who has not played; this quick check assumes the starter has already played and has a real score.
- If official 2026 substitution rules differ from the current assumption, update the model and UI.

Completion note, June 1, 2026:

- Added a `Substitution Advisor` section to the homepage.
- Added a compact user guide for matchday, played-starter score, bench candidate, and formation checks.
- Implemented the manual Quick Substitution Check in `script.js`.
- Added safer, balanced, and upside risk thresholds using the same compressed raw-points scale as Captain Change Advisor v0.
- Added result states for sub in bench player, keep starter, close call, and needs check.
- Added different-position warnings because full formation legality is not available in quick-check scope.
- Added model documentation in `data/substitutionAdvisorModel_v0.md`.
- Updated `README.md`, `data/README.md`, `data/dataSources.md`, `data/dataQualityReport.md`, and `data/sourceManifest.json`.

Tests after this step:

- Test a 0-point starter with a strong bench option.
- Test a 4-point starter with a medium bench option.
- Test a starter with 6+ points.
- Test a bench player with weak start probability.
- Test defender, midfielder, forward, and goalkeeper cases.
- Test formation legality after each recommended substitution.
- Confirm the section works with manually entered points and does not require live data.

### 9. Export Team JSON v1

Status: `DONE`

Goal: make exported squad JSON complete enough to support saving, sharing, testing, and future matchday-decision tools.

Tasks:

- Review the current Team Builder export payload.
- Include squad, starters, bench, captain, vice captain if available, formation, budget, active trust mode, pick style, matchday, filters, locked players, removed players, rule checks, portfolio analytics, and recommendation notes.
- Add fields needed by Captain Change Advisor and Substitution Advisor, even if their values are null before those tools exist.
- Include model version metadata.
- Keep the export valid JSON and stable enough for later import.

Completion note, June 1, 2026:

- Upgraded Team Builder export to `schema_version: team-export-v1`.
- Changed the download filename to `world-cup-fantasy-team-v1.json`.
- Preserved older readable top-level fields for players, starting 11, bench, captain, budget, rule checks, portfolio analytics, optimizer adjustment, and explanation.
- Added `model_metadata` for finance data, matchday projections, score predictions, and fantasy rules.
- Added `builder_settings` for formation, render mode, matchday, recommendation style, trust mode, advice pool, filters, risk controls, and budget.
- Added `squad_state` with squad IDs, starter IDs, bench IDs, captain/vice references, locked players, removed players, ignored locked players, starter slots, and bench slots.
- Added null-safe `decision_tools` placeholders for Captain Change Advisor v0 and Substitution Advisor v0.
- Added model documentation in `data/teamExportModel_v1.md`.
- Updated `README.md`, `data/README.md`, `data/dataSources.md`, `data/dataQualityReport.md`, and `data/sourceManifest.json`.

Tests after this step:

- Export squads from Balanced, Safer Picks, High Upside, and Punts modes.
- Confirm each exported file parses as JSON.
- Confirm the payload includes the active model versions.
- Confirm exported portfolio analytics match the visible Team Builder panel.
- Confirm future matchday-decision fields are present or safely null.

### 9.5. Import Saved Team v0

Status: `DONE`

Goal: let a user restore a previously exported Team Builder JSON file without requiring accounts or live storage.

Tasks:

- Add an Import Team JSON control beside Export Team JSON.
- Accept only the existing `team-export-v1` schema.
- Restore builder settings, locked players, removed players, starter IDs, and bench IDs.
- Render the saved squad by exact current player IDs instead of rerunning the optimizer.
- Warn clearly when imported player IDs are missing or the saved lineup cannot be fully restored.
- Document the import behavior and caveats.

Completion note, June 1, 2026:

- Added Team Import v0 to the Team Builder controls.
- Import restores formation, matchday, pick style, trust mode, price filters, risk controls, locked players, removed players, starters, and bench where current player IDs still exist.
- Added `data/teamImportModel_v0.md`.
- Updated `README.md`, `data/dataQualityReport.md`, `data/sourceManifest.json`, and `data/teamExportModel_v1.md`.

Tests after this step:

- Export a built squad, import it back, and confirm starters and bench counts restore.
- Confirm the imported squad does not rerun the optimizer.
- Confirm invalid JSON or wrong schema shows a clear warning.
- Confirm missing IDs are warned instead of guessed.
- Confirm desktop and mobile Team Builder controls still fit.

### 9.6. Saved Squad Decision Mode v0

Status: `DONE`

Goal: let the manual captain-change and substitution tools use the current built or imported Team Builder squad without requiring user accounts, live scoring, or full live squad tracking.

Tasks:

- Add saved-squad panels to Captain Change Advisor and Substitution Advisor.
- Show an inactive state until a full Team Builder squad is built or imported.
- Let captain users fill current captain and new captain from saved-squad buttons.
- Let substitution users fill played starter and bench player from saved-squad buttons.
- Keep manual search available.
- Keep user-entered points and manual played/unplayed checks required.
- Document that this is a workflow layer, not a new projection model.

Completion note, June 1, 2026:

- Added saved-squad decision panels to the captain-change and substitution sections.
- Captain cards fill the existing current/new captain fields.
- Substitution cards fill the existing played-starter/bench-player fields.
- Saved-squad cards use selected advisor matchday and risk style to show fixture, start, minutes, and compressed decision signal context.
- Added `data/savedSquadDecisionMode_v0.md`.
- Updated the advisor model notes, README, data sources, data quality report, and source manifest.
- Validation passed: tracked JSON parse, JS syntax checks, desktop saved-squad advisor flow, export/reset/import panel restore, invalid empty-state behavior, and mobile page-overflow check.

Tests after this step:

- Build a Team Builder squad and confirm saved-squad panels activate.
- Use a saved captain button pair and confirm the captain advisor returns a result after points are entered.
- Use saved starter and bench buttons and confirm the substitution advisor returns a result after points are entered.
- Confirm manual mode still appears before a full squad is built or imported.
- Confirm mobile layout has no horizontal overflow.

### 9.7. Saved Squad Matchday Timeline v0

Status: `DONE`

Goal: show the current built or imported Team Builder squad in matchday kickoff order so users can decide captain switches and substitutions with less manual lookup.

Tasks:

- Add a Saved Squad Timeline section.
- Let users switch between MD1, MD2, and MD3.
- Group the current full Team Builder squad by kickoff label from `matchdayProjectionsData.js`.
- Show starter/bench status, opponent, fixture difficulty, start probability, expected minutes, captain signal, and substitution signal.
- Add quick-fill buttons for current captain, new captain, played starter, and bench option.
- Keep live points and played/unplayed status manual.
- Document the workflow and limitations.

Completion note, June 1, 2026:

- Added the Saved Squad Timeline section and footer link.
- Timeline activates after a full Team Builder squad is built or imported.
- Timeline cards group the saved squad by MD1/MD2/MD3 kickoff labels.
- Timeline quick-fill buttons write into the existing Captain Change Advisor and Substitution Advisor fields.
- Added `data/savedSquadMatchdayTimeline_v0.md`.
- Updated README, data source notes, data quality report, data README, and source manifest.
- Validation passed: tracked JSON parse, JS syntax checks, local page 200, desktop timeline flow, export/reset/import timeline restore, and mobile timeline overflow check.

Tests after this step:

- Confirm the timeline shows an empty state before a full squad exists.
- Build a squad and confirm timeline groups total 15 players for MD1/MD2/MD3.
- Use timeline captain quick-fill buttons and confirm the captain advisor receives the selected matchday and players.
- Use timeline substitution quick-fill buttons and confirm the substitution advisor receives the selected matchday and players.
- Import a saved team and confirm the timeline reactivates.
- Confirm mobile layout has no page-level horizontal overflow.

### 9.8. Saved Decision Export v0

Status: `DONE`

Goal: include the latest manual captain-change or substitution quick-check result in Team Export JSON v1 without adding live tracking or changing the export schema.

Tasks:

- Keep the existing `team-export-v1` payload shape.
- Keep null-safe decision-tool placeholders when no quick check has been run.
- Save the latest Captain Change Advisor result after the user runs a quick check.
- Save the latest Substitution Advisor result after the user runs a quick check.
- Store user-entered raw points, selected matchday, risk style, result, thresholds, edge, player references, projection context, QA flags, and warnings.
- Clear saved decisions when advisor inputs become invalid or the Team Builder squad changes.
- Document that saved decision import needs explicit review/rerun behavior.

Completion note, June 1, 2026:

- Added Saved Decision Export v0 to the Team Export JSON v1 `decision_tools` object.
- Captain Change Advisor now saves its latest manual result for export.
- Substitution Advisor now saves its latest manual result for export.
- Team Export JSON v1 still emits `saved: false` placeholders when no quick check has been run.
- Saved decisions clear on advisor reset, invalid advisor inputs, squad rebuild, import, reset, preview, or manual swap.
- Added `data/savedDecisionExport_v0.md`.
- Updated advisor model notes, Team Export docs, README, data source notes, data quality report, and source manifest.

Tests after this step:

- Build a Team Builder squad and run a captain quick check.
- Run a substitution quick check.
- Export Team JSON and confirm both decision tools have `saved: true`.
- Confirm the exported raw points match the user-entered inputs.
- Confirm reset or squad changes clear stale saved decisions.
- Confirm JSON parsing, JavaScript syntax, and browser export flow still pass.

### 9.9. Saved Decision Import v0

Status: `DONE`

Goal: restore saved captain-change and substitution quick-check scenarios from Team Export JSON v1 without treating them as fresh live recommendations.

Tasks:

- Read saved `decision_tools` during Team Import v0.
- Restore advisor matchday, risk style, user-entered raw points, and exact current player IDs where available.
- Show imported saved-check result panels.
- Re-export imported scenarios with review metadata.
- Warn instead of guessing missing player IDs.
- Replace imported context with fresh manual results when the user reruns an advisor.
- Document the behavior and caveats.

Completion note, June 1, 2026:

- Added Saved Decision Import v0 to Team Import v0.
- Captain Change Advisor and Substitution Advisor fields are restored from saved exports when the referenced player IDs still exist.
- Imported scenarios are tagged with `imported_requires_rerun: true` when re-exported.
- Advisor result panels clearly show imported review context.
- Added `data/savedDecisionImport_v0.md`.
- Updated README, data source notes, data quality report, Team Export/Import docs, Saved Decision Export docs, and source manifest.

Tests after this step:

- Export a team with both saved manual advisor checks.
- Import that export and confirm both advisor fields restore.
- Confirm imported result panels appear and require rerun before acting.
- Export immediately after import and confirm imported review metadata is present.
- Rerun advisors and confirm imported metadata is replaced by fresh manual results.
- Confirm missing IDs are warned instead of guessed.

### 9.10. Decision Tools QA Polish v0

Status: `DONE`

Goal: make Captain Change Advisor and Substitution Advisor state clearer and harder to misuse during real matchday workflows.

Tasks:

- Add visible Manual, Saved, and Imported - rerun needed status badges.
- Make imported saved-check warnings harder to miss.
- Keep concise instructions visible inside the advisor sections.
- Preserve conservative handling for high raw-point scores.
- Run focused browser QA across desktop/mobile for saved, imported, rerun, and reset states.

Completion note, June 1, 2026:

- Added advisor status panels to Captain Change Advisor and Substitution Advisor.
- Status updates after checks, resets, invalid inputs, imports, and squad-changing actions.
- Imported saved-check result panels now include a highlighted rerun warning.
- Added `data/decisionToolsQaPolish_v0.md`.
- Updated README, data source notes, data quality report, roadmap, and source manifest.

Tests after this step:

- Confirm default status is Manual on page load.
- Run captain and substitution checks and confirm status becomes Saved.
- Import saved scenarios and confirm status becomes Imported - rerun needed.
- Rerun imported checks and confirm status becomes Saved.
- Reset advisors and confirm status returns to Manual.
- Confirm mobile layout has no horizontal overflow.

### 10. Full Feature Test Pass

Status: `DONE`

Goal: test all important website features after the recommendation, optimizer, export, captain, and substitution work is complete.

Test areas:

- homepage load
- Quick Picks
- Captain Picks
- Team Advice
- Player Profile
- Match Environment
- Team Builder
- trust modes
- QA chips
- squad portfolio analytics
- export team JSON
- World Cup page
- fixtures and matchdays
- Captain Change Advisor
- Substitution Advisor
- mobile layout
- desktop layout
- all JSON data parsing

Tests after this step:

- Run JavaScript syntax check.
- Parse all JSON files.
- Run browser smoke tests.
- Run Team Builder tests for all trust modes.
- Run export JSON tests.
- Run captain-change and substitution scenario tests.
- Check browser console for errors.
- Check layout at desktop and mobile widths.
- Update this plan with pass/fail notes and any follow-up fixes.

Completion note, June 1, 2026:

- Added `data/fullFeatureTestReport_v0.md`.
- JSON parse passed for 71 files.
- JavaScript syntax passed for 12 JS/MJS files.
- Local server returned 200 for `index.html` and `world-cup.html`.
- Desktop browser pass covered homepage load, Quick Picks, Captain Picks, Team Advice, Player Profile, Match Environment, Captain Change Advisor, Substitution Advisor, Team Builder, Squad Portfolio Analytics, Team Export JSON v1, and World Cup page.
- Mobile browser pass covered expanded homepage sections, manual decision tools, Team Builder, World Cup page, and page-level overflow checks.
- Team Export JSON v1 was validated through the actual download button path.
- No final browser console errors or warnings were captured.
- No final desktop or mobile document-level horizontal overflow was detected.
- No production code fixes were required during this pass.

### 11. Score Predictor v1 Upgrade

Status: `LATER`

Upgrade when these are available:

- final official squads
- official fantasy player list
- official fantasy prices
- official fantasy positions
- official scoring rules
- better injury and availability information
- better national-team starter information

v1 should improve:

- team attacking strength
- team defensive strength
- player role by national team
- clean-sheet likelihood
- minutes and starter probabilities
- fixture-specific fantasy projections

### 12. Score Predictor v2 Upgrade

Status: `LATER`

Upgrade after v1 is stable and we can compare predictions with real tournament outcomes.

v2 should consider:

- first matchday lineups
- trusted predicted lineups
- injuries and suspensions
- ownership or popularity data if available
- backtesting against real World Cup fantasy scoring
- calibration for low-score and draw-heavy match behavior

## Decision Rules

Use these rules when the plan needs to change.

- If the site gives confusing advice, improve explanation and filters before adding a new model.
- If Team Builder cannot fill full squads, fix constraints or price calibration before adding smarter optimization.
- If proxy prices distort squad quality, calibrate prices before portfolio-aware optimization.
- If data quality is weak, lower confidence and show warnings instead of deleting players.
- If official data arrives, official rosters, prices, positions, and scoring rules take priority over prototype assumptions.
- If a model becomes too conservative, improve the user-facing mode behavior before adding more hard constraints.
- If a feature needs live matchday fantasy points, ask the user to enter them manually unless a reliable official live source has been added.
- If official 2026 fantasy captain or substitution rules differ from our assumption, update those tools before treating their advice as usable.

## How We Will Maintain This Plan

After each completed step:

- change the step status from `NEXT` or `QUEUED` to `DONE`
- add a short note explaining what changed
- add the files changed
- add the tests run
- move the next unfinished step to `NEXT`
- adjust the order if new evidence shows the current order is wrong

## Immediate Next Step

No queued Week 6 recommendation-engine implementation step remains.

Next development should either import official fantasy data when available or define the next feature explicitly. The model-upgrade items below remain `LATER` until final official squads, fantasy players, prices, positions, scoring rules, injuries, and stronger lineup information are available.
