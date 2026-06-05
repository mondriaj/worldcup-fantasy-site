# Site Features Summary

This document summarizes what the World Cup Fantasy Helper site can do today. It is a product-level guide, not a data-model changelog.

## Core Site

- Static website that can run from GitHub Pages or a local HTTP server.
- Main fantasy helper page for player recommendations, squad building, matchday decisions, and model inspection.
- Primary navigation is task-based: Home, Picks, Team Builder, Matchday Desk, Fantasy Finance, World Cup Guide, and Model Notes.
- The default experience is simple and card-first, with deeper tables, model details, and finance terminology kept in advanced sections.
- Separate World Cup page for tournament groups, group-stage fixtures, and bracket-path context.
- Browser-ready data files are loaded directly by the page, so the site does not need runtime API calls.
- Player names in the main recommendation views open a Player Profile view focused first on why to pick him, why to be careful, best use, fixture outlook, fantasy finance, and data checks.

## Player Recommendations

- Picks show Official Fantasy Picks using official fantasy prices, positions, selectable status, scoring, projections, and finance metrics.
- Squad Builder Starter shows an 8-card curated starter pack instead of one card per model: 1 Top Projection, 2 Core Picks, 1 High-Floor Pick, 1 Upside Pick, 2 value-oriented picks with a Budget Enabler when available, and 1 Differential Pick.
- Player cards are the default surface and include one primary pick-type badge, a short caution/reason line, fixture context, View Profile, and Add to Builder when the player is available to the builder.
- Picks include a compact Builder tray that shows locked players, lets users remove them, and links directly to Team Builder.
- Picks include a Captain Watchlist lane for captain candidates from the official fantasy pool.
- The deeper Pick Explorer remains available behind the card-first experience for filtered Official Fantasy Picks by strategy, matchday, position, and pick pool.
- Normal public pick labels are Projected Points, Core Picks, High-Floor Picks, Upside Picks, Value Picks, and Differential Picks. Captain Watchlist is a dedicated captain surface; captain usefulness lives there, in Player Profile, and in matchday tools rather than as a repeated card badge.
- Recommendation explanations show projected score context, strategy score context, role risk, data checks, and fixture environment notes.
- Recommendations use the current official FIFA fantasy pool. The monitor should be rerun when FIFA changes player, price, position, status, rule, or deadline data.

## Match Environment

- Fixture-level score prediction panel shows group-stage match environments.
- Match Environment prefers the fantasy-pool score projection bundle and keeps the PELE-forward v2 bundle as a static fallback.
- Public columns emphasize Projected xG, Win / Draw / Win, Most Likely Score, Match Uncertainty, and Clean-Sheet Context.
- Projected xG is fixture-specific expected goals for each team against the listed opponent. It is not a generic team average or PELE rating label.
- Clean-sheet context displays each team on its own line so defender and keeper outlooks are easy to scan.
- Row details keep total goals range as supporting context and still show team-specific clean-sheet probability, favorite probability, and top scoreline context.
- Score prediction checks verify fixture coverage, probability bounds, PELE input coverage, favorite consistency, ordered uncertainty bands, expected-goal preservation, fantasy context labels, and player-matchday integration.

## Team Builder

- Builds a fantasy squad plan using selected strategy, official budget, position counts, country limit, locked players, removed players, and filters.
- Team Builder is planning help and should be checked against the official game before saving.
- Public Team Builder strategy labels are Balanced Squad, Diversified Squad, Concentrated Upside, Stars and Scrubs, and Value Squad. The builder applies strategy-aware squad scoring weights after legal candidate squads are formed, without replacing the existing constraints engine.
- Stars and Scrubs is calibrated to be more top-heavy than Balanced Squad when feasible: stronger premium-starter concentration, weaker bench tolerance, and penalties for expensive players who do not justify the spend.
- The Team Builder surface follows visible step cards: choose strategy, lock or avoid players, build squad, review legality and risk, then save or export.
- After a build, the review step shows a compact Squad Strategy Report with Country Stack Risk, Fixture Stack Risk, Star Dependence, Bench Strength, Bad-Week Floor, Upside Ceiling, Budget Shape, and a short note on how the squad fits the selected strategy.
- An advanced Team Builder comparison check can run all five public strategies under the same current settings, show squad overlap, and flag high-overlap or weak-identity builds for model inspection.
- Supports advanced risk controls for minimum start probability, expected minutes, data-review count, and risky fill-ins.
- Users should confirm locks, deadlines, boosters, and official-game legality inside FIFA's game.
- Provides clear builder warnings when constraints are tight or force weaker/riskier picks.
- Allows users to mark captain, vice captain, and bench order on built or imported squads.
- Preserves user-selected captain, vice captain, and bench order through Team Export/Import when player IDs still match.
- Team Export JSON records the selected strategy, mapped scoring view, strategy weight version, portfolio analytics, and strategy-aware portfolio optimizer inputs.

## Portfolio Analytics

- Fantasy Finance uses simple default labels such as Squad Risk Report, Portfolio Health, Bad-Week Floor, Country Stack Risk, Fixture Stack Risk, and Budget Pressure.
- Squad Portfolio Analytics explains the built squad as a whole, not only as individual picks.
- Default metrics include projected points, portfolio health, bad-week floor, data checks, country concentration, fixture concentration, and budget-pressure warnings.
- Squad Strategy Report summarizes the squad as a portfolio with simple Low, Medium, High, and budget-shape labels tied to the selected Team Builder strategy.
- The advanced strategy comparison uses the same Squad Strategy Report metrics to compare strategy outputs without replacing the normal build flow.
- Advanced model notes and exported JSON preserve deeper portfolio fields for transparency.
- Team Builder uses squad-level portfolio context and strategy-specific weights when choosing between completed candidate squads.

## Matchday Decision Tools

- Matchday Desk is the repeat-use hub for saved-squad status, captain switch checks, bench switch checks, and the matchday timeline.
- Matchday Desk shows an action-first empty state, saved-squad readiness cards, and shortcut buttons into Captain Switch Check, Bench Switch Check, and My Matchday Timeline.
- Captain Change Advisor v0 provides a manual Quick Captain Switch Check.
- Users enter the current captain's actual fantasy points before the captain double and compare one possible replacement who has not played yet.
- The advisor is intentionally conservative with strong captain scores; a 12+ captain score should usually lead to keep unless the user is deliberately chasing a risky upside move.
- Substitution Advisor v0 compares one played starter against one unplayed bench player using manual points and projection context.
- Saved Squad Decision Mode can fill captain and substitution advisor fields from the current built or imported Team Builder squad.
- Saved Squad Matchday Timeline groups a built/imported squad by MD1, MD2, and MD3 kickoff context and provides quick-fill buttons for decision tools.
- Matchday Decision Center v0 gives one saved-squad hub for captain-switch and bench-order checks before users open the detailed advisor tools.
- Decision tool status badges distinguish Manual, Saved, and Imported review states.

## Export And Import

- Team Export JSON v1 records model metadata, builder settings, squad state, starters, bench, captain/vice references, locked and removed players, portfolio analytics, and decision-tool fields.
- Saved Decision Export v0 includes the latest manual captain-change or substitution quick-check result after the user runs one.
- Team Import v0 restores saved squads by exact current player IDs without rerunning Team Builder.
- Saved Decision Import v0 restores previous advisor scenarios as imported review context, not as fresh live recommendations.

## Data And Model Engine

- Week 6 data engine combines team data, fixtures, roster candidates, player performance matching, national-team usage, and finance-style fantasy metrics.
- PELE ratings from Silver Bulletin are imported into `data/peleRatings_v1.json` and are central to the active team-quality and score-prediction model.
- Active public Match Environment score projection context uses `data/scorePredictions_fantasyPool_v3.json` through `fantasyPoolScorePredictionsData.js`, with `data/scorePredictions_v2.json` and `scorePredictionsData.js` preserved as the fallback.
- The active score context is PELE-anchored and converts PELE plus fixture context into fantasy-facing Projected xG, scoreline, Match uncertainty, defender/keeper context, clean-sheet context, goal environment, and internal upset-risk labels.
- Active matchday player projections use `data/playerMatchdayProjections_v2.json`.
- Active recommendation shortlists use `data/matchdayRecommendations_v2.json`.
- Public recommendation sections load separate official fantasy-pool browser files: `fantasyPoolRecommendationsData.js`, `fantasyPoolMatchdayProjectionsData.js`, `fantasyPoolFinanceMetricsData.js`, `fantasyPoolScorePredictionsData.js`, and `fantasyPoolOfficialDataStatusData.js`.
- The staged source files are `data/matchdayRecommendations_fantasyPool_v3.json`, `data/playerMatchdayProjections_fantasyPool_v3.json`, `data/playerFinanceMetrics_fantasyPool_v1.json`, and `data/scorePredictions_fantasyPool_v3.json`; `data/scorePredictionDataFlow_v1.md` documents the active score projection browser flow.
- Previous model versions are preserved where material changes were made.
- Official Data Readiness v0 tracks blockers before rerunning final value, Team Builder, score, and recommendation models.

## Official Data Pipelines

- Official fantasy players, prices, positions, selectable status, scoring, squad structure, budget, country limits, transfers, and boosters have been imported.
- Official fantasy rules now include the Clean Sheet Shield booster rule; live deadline and lock semantics still require manual confirmation inside FIFA before acting.
- Official final squad reconciliation remains available as an internal audit trail, while the public site uses FIFA's fantasy pool as the working authority.
- `scripts/checkOfficialFantasyDataUpdates.mjs` monitors live FIFA fantasy JSON for player, squad, rules, round, and language changes before deciding whether imports or model reruns are needed.
- Import templates are provided in `data/imports/`.
- Readiness validation reports whether final model reruns are allowed or still blocked by missing official data.

## Current Limits

- The site is independent, not official FIFA fantasy advice.
- Public recommendations are labeled Official Fantasy Picks.
- FIFA can still update player status, prices, positions, rules, or deadlines; rerun the monitor before major changes.
- Official fantasy prices, positions, scoring, and the Clean Sheet Shield booster rule are available.
- Team Builder is planning help and should be verified in the official game.
- Score predictions are prototype model outputs, not official projections or live match facts.
- Captain and substitution tools require manual points and manual played/unplayed checks.
- The site does not track live scores, official deadlines, official lineup locks, or official fantasy-game legality.
- Team Import restores current player IDs only and may need migration if future model IDs change.

## Most Important Next Step

Use the site as the current official fantasy-pool helper. Keep the daily monitor as the operating gate for future FIFA feed changes.
