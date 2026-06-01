# Week 6 Real Data Plan

Plan date: May 31, 2026  
Project root: `project/`  
Goal: build the real data engine for World Cup fantasy using teams, rosters, fixtures, matchdays, player performance, fixture difficulty, and prototype score predictions.

Important planning note: this file is a plan only. No website code or data engine code has been changed yet.

## 1. Current Project Structure

The website is a static HTML, CSS, and JavaScript project. It is designed to work on GitHub Pages and from a local static server.

Current main folder:

```text
project/
  index.html
  style.css
  script.js
  world-cup.html
  worldCupPage.js
  players.json
  playersData.js
  fantasyRules.json
  fantasyRulesData.js
  worldCupData.js
  dataSources.md
  rulesSources.md
  euroScoringGuide.md
  countryMappings.json
  source-nationalities.csv
  addEuroScoring.js
  applyCountryMappings.js
  README.md
  AGENTS.md
```

What each main part does now:

- `index.html` is the main fantasy helper page.
- `script.js` powers Quick Picks, Captain Picks, Team Advice, Team Builder, rules validation, and Optimizer v0.
- `style.css` holds the visual design for both the main page and the World Cup page.
- `world-cup.html` is a separate tournament page for groups, fixtures, bracket structure, and source notes.
- `worldCupPage.js` renders the tournament page from `window.WORLD_CUP_DATA`.
- `players.json` is the readable source player file.
- `playersData.js` is the browser-ready copy of `players.json`.
- `fantasyRules.json` is the readable source rules file.
- `fantasyRulesData.js` is the browser-ready copy of `fantasyRules.json`.
- `worldCupData.js` is the current browser-ready World Cup groups and group-stage fixture file.

The current loading pattern is important:

```html
<script src="playersData.js"></script>
<script src="fantasyRulesData.js"></script>
<script src="script.js"></script>
```

For the World Cup page:

```html
<script src="worldCupData.js"></script>
<script src="worldCupPage.js"></script>
```

The site does not currently use runtime `fetch()` for data. Data is loaded through JavaScript files that attach arrays or objects to `window`. Week 6 should keep this static-site pattern unless we deliberately decide to change the architecture.

There is a Git repo inside `project/`. The parent workspace is not a Git repo. Current Git status in `project/` already shows `stage_b_world_cup_features_plan.md` as untracked, so Week 6 work should avoid touching or reverting that file.

## 2. Current Data Files

### Main Website Data

`players.json`

- Current count: 100 players.
- Current purpose: EPL/FPL-style test player pool.
- Current status: useful for UI testing and performance-model prototyping, but not a real World Cup player pool.
- Key fields include:
  - `id`
  - `name`
  - `country`
  - `club`
  - `position`
  - `price`
  - `attack_score`
  - `defense_score`
  - `risk_score`
  - `team_elo`
  - FPL-style fields such as `total_points`, `points_per_game`, `minutes`, `goals_scored`, `assists`, `clean_sheets`, `expected_goals`, `expected_assists`
  - FBref-style enrichment fields such as `fbref_nation_code`, `fbref_position_detail`, `fbref_minutes`, `fbref_goals_per90`, `fbref_assists_per90`
  - EURO-style estimated scoring fields
  - risk fields used by the advanced pick styles

`playersData.js`

- Browser-ready copy of `players.json`.
- Defines `window.PLAYERS_DATA`.
- Must stay in sync with `players.json` when player data changes.

`fantasyRules.json`

- Current version: `week_5_draft`.
- Current status: draft rules based on past tournament fantasy games, not final official 2026 rules.
- Current main rules:
  - 15-player squad.
  - 2 goalkeepers, 5 defenders, 5 midfielders, 3 forwards.
  - 11-player starting lineup.
  - 100 fantasy-unit budget.
  - group-stage max 3 players per country.
  - captain multiplier is 2.
  - transfers and chips are documented only, not fully implemented.

`fantasyRulesData.js`

- Browser-ready copy of `fantasyRules.json`.
- Defines `window.FANTASY_RULES_DATA`.
- Must stay in sync with `fantasyRules.json`.

`worldCupData.js`

- Defines `window.WORLD_CUP_DATA`.
- Current source check date inside the file: May 13, 2026.
- Current contents:
  - 12 groups.
  - 48 group teams.
  - 72 group-stage fixtures.
  - FIFA and OpenFootball source notes.
  - knockout bracket placeholders.
- Current limit: it is a tournament display file, not yet a data engine. It does not connect fixtures to fantasy recommendations.

### Supporting Data And Notes

`source-nationalities.csv`

- Local enrichment file.
- Used to add country/nationality and FBref-style fields to the test player data.
- Useful for performance prototypes, but it is not an official World Cup squad or fantasy source.

`countryMappings.json`

- Manual country correction map.
- Small support file for player country cleanup.

`dataSources.md`

- Explains the current data source story.
- Still says FPL-Core-Insights is the main player source, which was true for earlier weeks.
- Week 6 should update this later because official FIFA fantasy data is now available.

`rulesSources.md`

- Documents the earlier draft fantasy rules.
- Week 6 should update this later with official FIFA fantasy source notes.

`euroScoringGuide.md`

- Explains the EURO-style estimated scoring model.
- Useful as a prototype scoring reference, but it should not be presented as final World Cup fantasy scoring.

`addEuroScoring.js`

- Existing script that enriches `players.json` with EURO-style scoring and risk fields.
- It reads local FPL-Core-Insights gameweek stats.
- It is useful as a model reference, but should not be used as the final official World Cup scoring engine without changes.

`applyCountryMappings.js`

- Existing script that applies manual country mappings to `players.json`.

### Reference Data Outside `project/`

`../FPL-Core-Insights/`

- Local clone/reference dataset.
- Includes 2024-2025 and 2025-2026 player, team, match, fixture, and gameweek CSV files.
- Useful for season performance, minutes, and risk prototypes.
- Not a World Cup roster source.

`../football.json/`

- Local open football data collection with many competition fixture JSON files.
- Useful as reference material only.
- Not currently wired into the site.

`../soccerdata/`

- Local copy of the `soccerdata` Python package.
- Contains connectors for sources such as FBref, ESPN, Sofascore, ClubElo, Understat, and others.
- Useful later if we decide to create data-import scripts, but Week 6 should be careful about source terms, scrape stability, and reproducibility.

## 3. Missing Data Files

The site is missing a real World Cup data layer. These files do not exist yet and should be created during Week 6, after the schema is agreed.

Missing core files:

- `data/source_manifest.json`
- `data/raw/`
- `data/processed/`
- `data/browser/`
- `data/processed/teams.json`
- `data/processed/rosters.json`
- `data/processed/players.json`
- `data/processed/fixtures.json`
- `data/processed/matchdays.json`
- `data/processed/fantasy_rules.json`
- `data/processed/player_performance.json`
- `data/processed/team_strength.json`
- `data/processed/fixture_difficulty.json`
- `data/processed/predictions.json`
- `data/browser/worldCupTeamsData.js`
- `data/browser/worldCupPlayersData.js`
- `data/browser/worldCupFixturesData.js`
- `data/browser/worldCupFantasyRulesData.js`
- `data/browser/worldCupPerformanceData.js`
- `data/browser/worldCupDifficultyData.js`
- `data/browser/worldCupPredictionsData.js`

Missing utility scripts:

- `scripts/data/validateData.js`
- `scripts/data/buildBrowserData.js`
- `scripts/data/importFantasyRules.js`
- `scripts/data/importFantasyPlayers.js`
- `scripts/data/importSquads.js`
- `scripts/data/importFixtures.js`
- `scripts/data/importRankings.js`
- `scripts/data/buildMatchdays.js`
- `scripts/data/buildFixtureDifficulty.js`
- `scripts/data/buildPredictions.js`

Missing docs:

- `data/README.md`
- updated `dataSources.md`
- updated `rulesSources.md`
- a short `predictionModel.md` explaining the prototype prediction formula

Missing data concepts:

- Official fantasy player IDs.
- Official fantasy positions.
- Official fantasy prices.
- Official player nations.
- Official player squad status.
- Official roster source date.
- Matchday IDs.
- Fixture IDs shared by all files.
- Team IDs shared by teams, rosters, fixtures, difficulty, and predictions.
- Player performance baselines connected to the official player pool.
- Fixture difficulty numbers.
- Prototype score predictions.
- Clear flags for official data vs estimated data.

## 4. Proposed Data Folder Structure

The data folder should separate raw source snapshots, cleaned data, browser-ready data, and scripts.

```text
project/
  data/
    README.md
    source_manifest.json

    raw/
      fifa/
        fantasy/
          fantasy_rules_2026-05-31.md
          fantasy_player_pool_2026-05-31.json
        squads/
          squad_announcements_2026-05-31.json
          official_squads_2026-06-02.json
        fixtures/
          fifa_fixtures_2026-05-31.json
        rankings/
          fifa_rankings_2026-04-01.json
          fifa_rankings_2026-06-11.json
      openfootball/
        worldcup_2026_2026-05-31.json
      local/
        fpl_core_insights_snapshot_notes.md

    processed/
      teams.json
      rosters.json
      players.json
      fixtures.json
      matchdays.json
      fantasy_rules.json
      player_performance.json
      team_strength.json
      fixture_difficulty.json
      predictions.json

    browser/
      worldCupTeamsData.js
      worldCupRostersData.js
      worldCupPlayersData.js
      worldCupFixturesData.js
      worldCupMatchdaysData.js
      worldCupFantasyRulesData.js
      worldCupPerformanceData.js
      worldCupTeamStrengthData.js
      worldCupDifficultyData.js
      worldCupPredictionsData.js

  scripts/
    data/
      validateData.js
      buildBrowserData.js
      importFantasyRules.js
      importFantasyPlayers.js
      importSquads.js
      importFixtures.js
      importRankings.js
      buildMatchdays.js
      buildFixtureDifficulty.js
      buildPredictions.js
```

Recommended static loading pattern for Week 6:

```html
<script src="data/browser/worldCupTeamsData.js"></script>
<script src="data/browser/worldCupRostersData.js"></script>
<script src="data/browser/worldCupPlayersData.js"></script>
<script src="data/browser/worldCupFixturesData.js"></script>
<script src="data/browser/worldCupMatchdaysData.js"></script>
<script src="data/browser/worldCupFantasyRulesData.js"></script>
<script src="data/browser/worldCupPerformanceData.js"></script>
<script src="data/browser/worldCupTeamStrengthData.js"></script>
<script src="data/browser/worldCupDifficultyData.js"></script>
<script src="data/browser/worldCupPredictionsData.js"></script>
<script src="script.js"></script>
```

Recommended browser globals:

- `window.WORLD_CUP_TEAMS_DATA`
- `window.WORLD_CUP_ROSTERS_DATA`
- `window.WORLD_CUP_PLAYERS_DATA`
- `window.WORLD_CUP_FIXTURES_DATA`
- `window.WORLD_CUP_MATCHDAYS_DATA`
- `window.WORLD_CUP_FANTASY_RULES_DATA`
- `window.WORLD_CUP_PERFORMANCE_DATA`
- `window.WORLD_CUP_TEAM_STRENGTH_DATA`
- `window.WORLD_CUP_DIFFICULTY_DATA`
- `window.WORLD_CUP_PREDICTIONS_DATA`

Important rule: keep readable JSON as the source of truth and generate browser-ready `.js` files from it. Do not hand-edit the generated browser files except for emergency fixes.

## 5. Sources We Will Use

### Primary Official Sources

FIFA World Cup 2026 match schedule  
URL: https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/match-schedule-fixtures-results-teams-stadiums

Use for:

- fixtures
- kickoff dates and times
- stadiums
- cities
- match numbers
- final source check against any machine-readable fixture seed

FIFA World Cup 2026 squad list rules and timing  
URL: https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/squad-lists-number-date

Use for:

- squad-size rules
- official final squad date
- roster status rules
- replacement rules

Current source finding:

- FIFA says final squad lists are confirmed on June 2, 2026.
- Until that date, squad announcements should be treated as provisional.
- FIFA permits up to 26 players, with final lists between 23 and 26 players and at least three goalkeepers.

FIFA all squad announcements hub  
URL: https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/all-world-cup-squad-announcements

Use for:

- provisional squad announcements before June 2.
- links to team-specific squad articles.
- source notes for roster confidence.

FIFA official fantasy launch article  
URL: https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/world-cup-fantasy-game-launched

Use for:

- official fantasy structure.
- budget.
- squad composition.
- country limits.
- transfer/chip/booster overview.
- scoring-category overview.
- official examples of high-priced players.

Current source finding:

- The official FIFA World Cup 2026 fantasy game launched on May 26, 2026.
- Official squad shape matches the current draft shape: 15 players, 2 goalkeepers, 5 defenders, 5 midfielders, 3 forwards.
- Official starting budget is $100m.
- Group-stage country limit starts at 3 players per nation.
- An extra $5m is applied for the knockout stage.
- Prices do not fluctuate during the tournament.
- There are official boosters and transfer limits.
- Scoring categories include minutes, goals, assists, goals conceded, cards, penalties, tackles, chances created, shots on target, direct free-kick goals, and a scouting bonus.

FIFA official fantasy game  
URL: https://play.fifa.com/fantasy/

Use for:

- official fantasy player pool.
- official player prices.
- official player positions.
- official game rules if exposed in the app.

Current source finding:

- The player pool is provisional and is expected to update after FIFA confirms final squads on June 2, 2026.
- This should become the primary player source, replacing the current EPL/FPL-style test player pool.

FIFA/Coca-Cola Men's World Ranking  
URL: https://inside.fifa.com/fifa-world-ranking/men

Use for:

- team strength seed.
- fixture difficulty prototype.
- prediction model seed.

Current source finding:

- Last official update shown: April 1, 2026.
- Next official update shown: June 11, 2026.
- Use the April 1 ranking first, then refresh when the June 11 ranking is published.

### Secondary Technical Sources

OpenFootball World Cup JSON  
URL: https://github.com/openfootball/worldcup.json

Use for:

- machine-readable fixture seed.
- quick technical cross-check.
- easier import format.

Fallback rule:

- FIFA wins if OpenFootball conflicts with FIFA.

Existing local FPL-Core-Insights data  
URL: https://github.com/olbauday/FPL-Core-Insights

Use for:

- temporary player performance baseline.
- recent season form for players already present in the local data.
- prototype risk fields while official World Cup match data is not available.

Fallback rule:

- This is not a World Cup roster source and not an official fantasy source.
- It can support early player performance estimates, but official FIFA fantasy player data must own player identity, country, position, and price.

Existing local `source-nationalities.csv`

Use for:

- temporary player matching help.
- FBref-style season stats already in the project.

Fallback rule:

- Do not use it as proof of official World Cup squad status.
- Mark fields from this file as external/estimated.

### Sources We Should Avoid For Week 6

- Betting odds.
- Anonymous prediction accounts.
- Unsourced squad rumors.
- Scraped social posts unless the same information is confirmed by FIFA or a national federation.
- Any data source whose license does not allow reuse in this project.

## 6. Exact Tasks In Order

### Step 1: Freeze The Current Baseline

Do this before any data engine changes.

Tasks:

- Confirm the current site still loads.
- Record current counts:
  - 100 test players.
  - 12 groups.
  - 48 group teams.
  - 72 group fixtures.
  - Week 5 draft fantasy rules.
- Save a short baseline note in `data/README.md` when the data folder is created.

Expected result:

- We know exactly what changed after Week 6 starts.

Test after this step:

- Run a static server from `project/`.
- Open `index.html`.
- Open `world-cup.html`.
- Check the browser console for errors.
- Build a squad in Team Builder.
- Confirm the World Cup page renders groups and fixtures.

### Step 2: Create The Data Folder And Source Manifest

Tasks:

- Create `data/`.
- Create `data/raw/`, `data/processed/`, and `data/browser/`.
- Create `data/source_manifest.json`.
- Add source records for FIFA schedule, FIFA squads, FIFA fantasy, FIFA rankings, OpenFootball, and local FPL-Core-Insights.
- Each source record should include:
  - `source_id`
  - `name`
  - `url`
  - `source_type`
  - `priority`
  - `last_checked`
  - `allowed_use`
  - `fallback_rule`

Expected result:

- Every dataset can point back to its source.

Test after this step:

- Validate `source_manifest.json` as JSON.
- Confirm every processed file planned in later steps can reference a `source_id`.

### Step 3: Define Stable IDs And Schemas

Tasks:

- Define `team_id` values for all 48 teams.
- Define `fixture_id` values for all fixtures.
- Define `matchday_id` values.
- Define `player_id` strategy:
  - use official FIFA fantasy ID if available.
  - otherwise create a temporary ID with a `provisional_id` flag.
- Create schema notes in `data/README.md`.

Recommended IDs:

- `team_id`: lowercase FIFA/common country name with hyphens, for example `united-states`, `korea-republic`, `cote-divoire`.
- `fixture_id`: `fwc2026-m001`, `fwc2026-m002`, etc.
- `matchday_id`: `md1`, `md2`, etc.
- `player_id`: official fantasy ID if available; otherwise `temp-{team_id}-{slug-name}`.

Expected result:

- All future files can join cleanly.

Test after this step:

- Run a schema validation script once it exists.
- Check that no `team_id`, `fixture_id`, or `player_id` duplicates exist.
- Check that every fixture references valid teams.

### Step 4: Import Official Fantasy Rules

Tasks:

- Convert official FIFA fantasy rules into `data/processed/fantasy_rules.json`.
- Include:
  - squad size.
  - position counts.
  - budget.
  - country limits by phase if available.
  - knockout budget increase.
  - transfer rules.
  - boosters.
  - captain/substitution rules.
  - scoring categories.
  - source notes.
- Keep `rules_status` clear:
  - `official_summary` if sourced from FIFA article only.
  - `official_full_rules` only after the full rules page/app text is captured.

Expected result:

- The project moves from Week 5 draft rules to official 2026 fantasy rules, while still being honest about whether we have a full rules table or only the public summary.

Test after this step:

- Validate JSON.
- Compare with current `fantasyRules.json`.
- Confirm these official values:
  - total squad is 15.
  - GK 2, DEF 5, MID 5, FWD 3.
  - starting budget is 100.
  - group-stage country limit starts at 3.
  - knockout budget increase is 5.
- Do not wire rules to the UI until the data file passes validation.

### Step 5: Import Official Fantasy Player Pool

Tasks:

- Pull or manually capture the official fantasy player pool from `play.fifa.com/fantasy/`.
- Store the raw snapshot in `data/raw/fifa/fantasy/`.
- Create `data/processed/players.json`.
- Include:
  - official fantasy player ID if available.
  - player name.
  - team/nation.
  - position.
  - price.
  - availability/status if available.
  - source date.
  - `is_provisional`.
  - `source_id`.
- Keep current `project/players.json` unchanged until the new official file is validated.

Expected result:

- A real World Cup fantasy player pool exists separately from the old test player file.

Test after this step:

- Validate JSON.
- Check no duplicate official player IDs.
- Check every player has a team, position, and price.
- Check every player team exists in `teams.json`.
- Check all prices are numbers.
- Count players by team and position.
- Confirm provisional status is true before June 2 final confirmation.

### Step 6: Import Squads And Rosters

Tasks:

- Before June 2, use FIFA squad announcements as provisional roster data.
- On or after June 2, replace provisional rosters with FIFA-confirmed final rosters.
- Store raw snapshots in `data/raw/fifa/squads/`.
- Create `data/processed/rosters.json`.
- Include:
  - `team_id`.
  - `player_id`.
  - player name.
  - position if listed.
  - shirt number if available.
  - club if available.
  - roster status: `provisional`, `final`, or `replacement`.
  - source URL.
  - source date.

Expected result:

- The site can say who is actually in each World Cup squad, without pretending provisional lists are final.

Test after this step:

- Validate JSON.
- Check each team has no more than 26 final players.
- Check each final squad has at least 23 players.
- Check each final squad has at least 3 goalkeepers.
- Check every roster player joins to either an official fantasy player or a temporary player record.
- Flag unmatched players for manual review.

### Step 7: Normalize Fixtures And Matchdays

Tasks:

- Move the current fixture data out of `worldCupData.js` into `data/processed/fixtures.json`.
- Keep all 72 group fixtures.
- Add all 104 tournament fixtures if the FIFA schedule source supports a clean import.
- Create `data/processed/matchdays.json`.
- Each fixture should include:
  - `fixture_id`
  - match number
  - stage
  - group
  - home/team_1 team ID
  - away/team_2 team ID
  - date
  - local time
  - UTC datetime
  - Eastern datetime label
  - stadium
  - city
  - matchday ID
  - source ID
  - source last checked date

Expected result:

- Fixtures become reusable by the fantasy engine instead of only being page display data.

Test after this step:

- Validate JSON.
- Check 12 groups and 48 teams.
- Check 72 group-stage fixtures.
- If full schedule is imported, check 104 total fixtures.
- Check every group-stage team has 3 group fixtures.
- Check every fixture has two valid teams or a valid knockout placeholder.
- Check all datetimes parse correctly.
- Open `world-cup.html` and confirm the display still works after browser data is regenerated.

### Step 8: Build Team Strength

Tasks:

- Import FIFA rankings into `data/processed/team_strength.json`.
- Start with the April 1, 2026 ranking.
- Refresh after the June 11, 2026 ranking is published.
- Store:
  - `team_id`
  - FIFA rank
  - FIFA points if available
  - ranking date
  - normalized strength score
  - source ID
- Use a simple transparent formula first.

Recommended prototype formula:

```text
normalized_strength = 100 - percentile_rank_among_48_world_cup_teams
```

Where higher means stronger.

Expected result:

- Every World Cup team has a transparent strength seed.

Test after this step:

- Validate JSON.
- Check all 48 teams have a ranking row.
- Check strength scores are between 0 and 100.
- Check the strongest teams rank higher than the weakest teams.
- Check source date is visible.

### Step 9: Build Fixture Difficulty

Tasks:

- Create `data/processed/fixture_difficulty.json`.
- Use opponent team strength and match context.
- Keep it simple for v0.
- Do not use betting odds.

Recommended prototype formula:

```text
opponent_difficulty = opponent_normalized_strength
group_match_difficulty = opponent_difficulty
team_group_difficulty = average difficulty of the team's 3 group opponents
```

Optional later additions:

- travel/rest days.
- kickoff temperature risk if sourced cleanly.
- host advantage.
- team defensive profile.
- expected minutes by player.

Expected result:

- The site can show which fixtures look easier or harder, while labeling the score as a prototype.

Test after this step:

- Validate JSON.
- Check every group fixture has a difficulty row for both teams.
- Check every team has exactly 3 group fixture difficulty rows.
- Check difficulty values are between 0 and 100.
- Check a team facing highly ranked opponents has a higher average difficulty than a team facing lower ranked opponents.

### Step 10: Build Player Performance Baselines

Tasks:

- Create `data/processed/player_performance.json`.
- Match official fantasy players to existing local performance data where possible.
- Use careful matching:
  - exact name and country.
  - normalized name and country.
  - manual review list for uncertain matches.
- Store:
  - `player_id`
  - minutes baseline.
  - goal baseline.
  - assist baseline.
  - clean-sheet baseline where relevant.
  - defensive contribution baseline if available.
  - cards/risk baseline.
  - confidence score.
  - source IDs.
  - `is_estimated`.

Fallback rule:

- If no reliable match exists, keep the player with neutral/default performance values and low confidence.
- Do not guess stats for a player.

Expected result:

- The official fantasy player pool has a performance layer, even if some players start with low-confidence estimates.

Test after this step:

- Validate JSON.
- Check every official fantasy player has one performance row.
- Check confidence is high only for strong matches.
- Export an unmatched-player report.
- Manually inspect top players and host-nation players.
- Confirm no player got performance stats from the wrong person with a similar name.

### Step 11: Build Prototype Score Predictions

Tasks:

- Create `data/processed/predictions.json`.
- Predict fixture-level team scores first.
- Then create player-level projected fantasy points from:
  - player performance baseline.
  - minutes confidence.
  - fixture difficulty.
  - official scoring categories where known.
  - position.
  - price.

Recommended v0 fixture prediction:

```text
team_attack_seed = team_strength
opponent_defense_seed = opponent_strength
expected_goal_edge = team_attack_seed - opponent_defense_seed
predicted_goals = clamp(1.1 + expected_goal_edge / 80, 0.2, 3.2)
```

Recommended v0 player projection:

```text
base_points = performance_baseline_points
fixture_adjustment = (50 - fixture_difficulty) / 20
minutes_adjustment = minutes_confidence / 100
projected_points = max(0, base_points + fixture_adjustment) * minutes_adjustment
```

Important labels:

- `prediction_status`: `prototype`
- `uses_betting_odds`: false
- `source_note`: explain formula and source inputs

Expected result:

- We get prototype predictions without pretending they are professional forecasts.

Test after this step:

- Validate JSON.
- Check every group fixture has predicted goals for both teams.
- Check predicted goals are within allowed bounds.
- Check every player has a projected points value.
- Check missing-performance players have low confidence.
- Spot-check that easier fixtures usually increase player projections and harder fixtures lower them.

### Step 12: Generate Browser Data Files

Tasks:

- Build `scripts/data/buildBrowserData.js`.
- Generate all files in `data/browser/` from `data/processed/`.
- Each browser file should be small and predictable:

```js
window.WORLD_CUP_PLAYERS_DATA = [...];
```

Expected result:

- The site can load the real data without runtime fetch.

Test after this step:

- Run the generator.
- Check every browser file exists.
- Check every browser file has the expected `window.*` global.
- Run a simple load test in Node or the browser to confirm the globals exist.

### Step 13: Wire The Data Engine Into The Website

Tasks:

- Add the new browser data scripts to `index.html`.
- Update `script.js` so it can use `WORLD_CUP_PLAYERS_DATA` and `WORLD_CUP_FANTASY_RULES_DATA`.
- Keep a fallback to the old `PLAYERS_DATA` until the real player pool is trusted.
- Add clear UI copy for:
  - official data.
  - provisional squad data.
  - estimated performance.
  - prototype predictions.
- Make fixture-aware advice optional at first.

Expected result:

- The fantasy tools can run on the official World Cup fantasy player pool.

Test after this step:

- Open `index.html`.
- Confirm the player count comes from the World Cup player pool.
- Search by player, country, position, and price.
- Build a squad.
- Confirm budget and country-limit validation use official rules.
- Confirm the export JSON includes source status and prediction status.
- Check browser console for errors.

### Step 14: Add Fixture-Aware Views

Tasks:

- Add fixture difficulty to player cards or advice tables.
- Add matchday filters.
- Add team/group filters.
- Add predicted score display only where it is clearly labeled as prototype.
- Do not turn predictions into betting advice.

Expected result:

- Users can compare players by matchday and fixture context.

Test after this step:

- Open `index.html`.
- Filter to Matchday 1.
- Confirm players with Matchday 1 fixtures show opponent and difficulty.
- Confirm players without a fixture are handled cleanly.
- Confirm mobile layout does not overlap.
- Confirm no console errors.

### Step 15: Update Documentation

Tasks:

- Update `README.md`.
- Update `dataSources.md`.
- Update `rulesSources.md`.
- Add `data/README.md`.
- Add `predictionModel.md`.

Expected result:

- The project tells the truth about official data, provisional data, estimated data, and prototype predictions.

Test after this step:

- Read all docs and check for outdated claims like "official fantasy rules are pending."
- Confirm all source links work.
- Confirm every estimated field is labeled as estimated.

## 7. Risks And Fallback Rules

### Risk: Official Fantasy App Is Hard To Export

Problem:

- `play.fifa.com/fantasy/` is a JavaScript app. The raw player pool may not be easy to download.

Fallback:

- First look for public app data endpoints.
- If no clean endpoint is available, manually capture a small verified player sample for schema work.
- Do not scrape aggressively.
- Do not bypass access controls.
- Keep the current test data as UI fallback until a reliable official player export exists.

### Risk: Player Pool Is Provisional Until June 2

Problem:

- FIFA says the fantasy player pool is provisional before final squads are confirmed.

Fallback:

- Store `is_provisional: true`.
- Show "provisional" in source notes.
- Do not call any roster final until June 2 confirmation.
- Re-run import after June 2.

### Risk: Official Squad Announcements Differ From Final FIFA Squads

Problem:

- Teams can announce squads before FIFA confirms them.

Fallback:

- Use roster status values:
  - `announced`
  - `provisional`
  - `final`
  - `replacement`
- FIFA final list wins.

### Risk: Fantasy Rules Are Only Partially Public

Problem:

- The FIFA launch article gives a strong rules summary, but the full rule table may live inside the fantasy app.

Fallback:

- Store `rules_status: official_summary`.
- Only mark `official_full_rules` after full rules are captured and reviewed.
- Keep unknown fields as `null`, not guessed.

### Risk: Player Names Do Not Match Cleanly Across Sources

Problem:

- Names can include accents, initials, short names, or different ordering.

Fallback:

- Use official fantasy ID as primary ID.
- Match performance data by normalized name plus team/country.
- Put uncertain matches in a manual review file.
- Use low-confidence defaults when matching is uncertain.

### Risk: Performance Data Is Club-Based, Not National-Team-Based

Problem:

- Current local performance data is mostly club/FPL-style, not World Cup international performance.

Fallback:

- Label performance as season-form estimate.
- Keep national-team match performance separate when it becomes available.
- Do not present club performance as official World Cup performance.

### Risk: Fixture Difficulty Looks Too Certain

Problem:

- A single ranking-based difficulty number can feel more precise than it is.

Fallback:

- Label it `prototype`.
- Show bands such as Easy, Medium, Hard instead of over-precise decimals.
- Keep formula visible in docs.

### Risk: Predictions Are Mistaken For Betting Advice

Problem:

- Predicted scores can look like gambling content.

Fallback:

- Do not use betting odds.
- Add `uses_betting_odds: false`.
- Label predictions as prototype fantasy planning estimates.
- Avoid betting language.

### Risk: Data Files Become Too Large For A Static Page

Problem:

- 48 squads plus predictions can increase page weight.

Fallback:

- Split browser data by topic.
- Load only core data on `index.html`.
- Keep team pages or heavy match detail for later.

### Risk: Source Data Changes During The Sprint

Problem:

- Squads, availability, and rankings can change quickly close to the tournament.

Fallback:

- Store dated raw snapshots.
- Keep `last_checked` fields.
- Rebuild processed files from raw snapshots.
- Never silently overwrite source status.

## 8. How To Test The Site After Each Step

### General Test Command

From `project/`:

```bash
python3 -m http.server 8766
```

Then open:

```text
http://127.0.0.1:8766/index.html
http://127.0.0.1:8766/world-cup.html
```

### Baseline Smoke Test

Run after any data or script change.

Checklist:

- `index.html` loads.
- `world-cup.html` loads.
- No browser console errors.
- Quick Picks render.
- Captain Picks render.
- Team Advice table renders.
- Team Builder renders player lock list.
- Team Builder can build a squad.
- Export Team JSON still works.
- World Cup groups render.
- World Cup fixtures render.

### Data Validation Test

Run after each new data file or import script.

Checklist:

- JSON parses.
- Required fields exist.
- IDs are unique.
- Foreign keys join:
  - player to team.
  - roster to player.
  - fixture to team.
  - difficulty to fixture.
  - prediction to fixture and player.
- Source IDs exist in `source_manifest.json`.
- `last_checked` exists for all imported source-backed files.
- estimated fields have `is_estimated` or `prediction_status`.

### Rules Test

Run after fantasy rules are imported or changed.

Checklist:

- Squad size is 15.
- Position counts are 2 GK, 5 DEF, 5 MID, 3 FWD.
- Budget is 100 before knockouts.
- Country limit starts at 3 for group stage.
- Knockout budget increase is represented if official source supports it.
- Team Builder validation uses these values.
- Old draft rules are not shown as official.

### Player Pool Test

Run after player imports.

Checklist:

- Every player has ID, name, team, position, and price.
- Every player team exists in `teams.json`.
- Every price is numeric.
- Every position maps to the UI position names.
- No duplicate official player IDs.
- Provisional status is correct.
- Top sample players from FIFA article can be found if present in the official pool.

### Roster Test

Run after squad imports.

Checklist:

- All 48 teams have roster records.
- Final squads have 23 to 26 players.
- Final squads have at least 3 goalkeepers.
- Provisional squads are labeled.
- Replacement players can be handled without deleting history.

### Fixture And Matchday Test

Run after fixture or matchday changes.

Checklist:

- 12 groups.
- 48 teams.
- 72 group fixtures.
- 104 total fixtures if the full schedule is imported.
- Each group-stage team has 3 fixtures.
- Each group has 6 fixtures.
- Every fixture has a stage.
- Every group fixture has a group ID.
- Every fixture datetime parses.
- Matchday filters include all group-stage matchdays.

### Fixture Difficulty Test

Run after difficulty changes.

Checklist:

- Every group fixture has difficulty for both teams.
- Every team has a group difficulty average.
- Difficulty scores are between 0 and 100.
- Difficulty bands are assigned.
- Source ranking date is visible.
- Formula is documented.

### Prediction Test

Run after prediction changes.

Checklist:

- Every group fixture has predicted goals for both teams.
- Predicted goals are within safe bounds.
- Every player projection has confidence.
- Predictions have `prediction_status: prototype`.
- No betting odds are used.
- UI copy says predictions are prototype estimates.

### Browser Data Test

Run after generating browser-ready data files.

Checklist:

- Every `data/browser/*.js` file defines the expected `window.*` global.
- `index.html` loads the files in the correct order.
- `script.js` handles missing optional data without crashing.
- `world-cup.html` still renders tournament data.

### Mobile Layout Test

Run after any UI integration.

Checklist:

- Test narrow mobile width.
- Text does not overlap.
- Tables or cards remain readable.
- Team Builder controls remain usable.
- Fixture difficulty labels fit.
- Prediction labels do not crowd player names.

### Final Week 6 Acceptance Test

The Week 6 data engine is ready when:

- There is a documented data folder.
- Official FIFA fantasy rules are represented at least as an official summary.
- Official fantasy player pool is imported or a clear import blocker is documented.
- Squad data is marked provisional or final correctly.
- Fixtures and matchdays are normalized.
- Team strength exists for all 48 teams.
- Fixture difficulty exists for all group fixtures.
- Prototype score predictions exist and are clearly labeled.
- The site still loads without console errors.
- Team Builder still works.
- Documentation explains what is official, what is provisional, and what is estimated.
