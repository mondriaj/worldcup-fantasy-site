# Week 6 Data Sources

This file explains which sources the new `data/` folder is prepared to use.

The existing root `dataSources.md` still describes the earlier test-player setup. This file is for the Week 6 World Cup data engine.

## Primary Sources

### FIFA World Cup 2026 Schedule

Source ID: `fifaSchedule`  
Use for: fixtures, match numbers, dates, kickoff times, stadiums, and cities.  
Fallback rule: FIFA wins if another fixture source disagrees.

Current `fixtures.json` use:

- The 72 group-stage fixtures are built from the existing `worldCupData.js` FIFA API-derived snapshot used by `world-cup.html`.
- Imported fields include match number, date, local time, UTC datetime, ET display time, teams, group, venue, and city.
- Knockout-stage match slots are not included yet because the team fields are placeholders until the tournament is played.

Current `matchdays.json` use:

- Matchday groupings are built from `data/fixtures.json`.
- Official FIFA fantasy matchday deadlines are not imported yet.
- The current matchday model is a prototype fantasy grouping:
  - `md1` = first group fixture for every team.
  - `md2` = second group fixture for every team.
  - `md3` = third group fixture for every team.
  - `group_stage_full` = all 72 group fixtures.

### FIFA World Cup Fantasy

Source ID: `fifaFantasy`  
Use for: official fantasy player pool, positions, prices, rules, budget, transfers, boosters, and scoring categories.  
Fallback rule: official fantasy values win over local estimates.

Current readiness use:

- Official fantasy players are not imported yet.
- Official fantasy prices are not imported yet.
- Official fantasy positions are not imported yet.
- Official fantasy scoring, transfer, booster, deadline, captain, and substitution rules are not imported yet.
- `data/officialFantasyImportSchema_v0.json` defines the required import fields.
- `scripts/importOfficialFantasyPlayers.mjs` is ready to parse CSV, TSV, or JSON official fantasy player files.
- `data/imports/officialFantasyPlayers_TEMPLATE.csv` defines the preferred raw import columns.
- `data/officialFantasyImportReport_v0.json` currently reports `awaiting_official_input`.
- `scripts/importOfficialFantasyRules.mjs` is ready to parse official fantasy rules JSON.
- `data/imports/officialFantasyRules_TEMPLATE.json` defines the preferred official rules structure.
- `data/officialFantasyRulesImportReport_v0.json` currently reports `awaiting_official_rules_input`.
- `data/officialDataReadiness_v0.json` currently reports `blocked_waiting_for_official_fantasy_data`.

Import rule:

- Do not infer missing official fantasy fields.
- `official_price` must stay `null` until an official source supplies it.
- `official_fantasy_position` must come from the official fantasy player list, not from roster-position inference.
- `proxy_price_v1` can remain as an audit field after official prices arrive, but it should not drive Team Builder budget once official prices are validated.

### FIFA Squad Announcements

Source ID: `fifaSquads`  
Use for: provisional squads, final squads, replacements, and roster status.  
Fallback rule: final FIFA squad lists win over provisional announcements.

Current `players.json` use:

- FIFA's official World Cup 2026 squad announcement hub was used as the primary roster source.
- The importer followed the hub's linked squad articles and parsed player names by position where FIFA exposed a complete list.
- FIFA was used directly for 44 article checks, including Ghana's 28-player preliminary squad and Australia's partial train-on squad.
- Australia's file rows are intentionally marked `needs_check` because FIFA has only announced an initial train-on group, not a full final or preliminary squad in the imported source.
- FIFA notes that all squads still need the final FIFA list publication on June 2, 2026, so confirmed rows should be re-checked after that date before production advice.
- `scripts/importOfficialSquads.mjs` is ready to parse official final squad CSV, TSV, or JSON files.
- `data/imports/officialSquads_TEMPLATE.csv` defines the preferred final squad import columns.
- `data/officialSquadsImportReport_v0.json` currently reports `awaiting_official_squads_input`.
- Final squad reconciliation will write separate review outputs and will not delete current players automatically.

Fields supplied or checked by this source:

- `name`
- `country`
- `team_id`
- `position`
- `roster_status`
- `source_note`
- `data_quality`

### FIFA Men's World Ranking

Source ID: `fifaRankings`  
Use for: team strength, fixture difficulty, and score-prediction seed values.  
Fallback rule: use the latest published ranking snapshot and store the ranking date.

Current `teams.json` use:

- Source endpoint used: `https://inside.fifa.com/api/ranking-overview?locale=en&dateId=id15065`
- Ranking date returned by the API rows: April 1, 2026.
- Imported fields: `fifa_ranking`, `fifa_ranking_points`, `fifa_previous_ranking`, `fifa_previous_points`, `fifa_team_id`, `fifa_country_code`, and `confederation`.

### World Football Elo Ratings

Source ID: `worldFootballElo`  
Use for: team Elo rating, Elo rank, historical best/average/lowest Elo context, fixture difficulty, and score prediction seed values.  
Source files used: `https://www.eloratings.net/World.tsv` and `https://www.eloratings.net/en.teams.tsv`.  
Fallback rule: keep `team_elo` as `null` if a team cannot be matched cleanly.

Current `teams.json` use:

- All 48 World Cup teams were matched.
- Imported fields: `team_elo`, `elo_rank`, `elo_code`, `elo_best_rank`, `elo_best_rating`, `elo_average_rank`, `elo_average_rating`, `elo_lowest_rank`, and `elo_lowest_rating`.
- Response `last-modified` value is stored in each row as `elo_source_date`.

### PELE International Football Rankings

Source ID: `peleRatings`  
Use for: PELE rating, PELE rank, Tilt rating, and round-robin offense/defense model inputs.  
Fallback rule: use the downloaded Silver Bulletin/Datawrapper CSV values where matched. If a PELE numeric field is missing in a future update, leave it `null` and exclude it from that weighted blend; do not impute.

Current `teams.json` use:

- `pele_rating`, `pele_rank`, `pele_tilt`, `pele_offense`, and `pele_defense` are filled for all 48 World Cup teams.
- `data/peleRatings_v1.json` stores 211 downloaded PELE rows.
- Raw downloaded CSV snapshots are stored in `data/peleRatingsDatawrapper_4oVop_2026-06-01.csv`, `data/peleTiltDatawrapper_dxUJw_2026-06-01.csv`, and `data/peleOffenseDefenseDatawrapper_DcqkH_2026-06-01.csv`.
- `team_quality_v2` is the active PELE-forward model. PELE rating is the dominant current-strength input, and PELE offense/defense fields lead the attack and defense proxies.

## Secondary Sources

### World Cup 2026 Stats Squad Tracker

Source ID: `worldCupStatsSquadTracker`  
Use for: current club, age, international caps, international goals, captain flag, and fallback roster rows where FIFA coverage was incomplete.  
Source used: `https://worldcupstats.football/squads/`  
Fallback rule: use this as enrichment or fallback only; FIFA/federation final lists win conflicts.

Current `players.json` use:

- Used for club/caps enrichment on many FIFA-sourced players.
- Used as the primary player-list source for teams where FIFA rows were missing or under-parsed in this import, including Algeria, Mexico, Paraguay, Portugal, and Senegal.
- Each imported row keeps source URLs in `source_urls`.

### NBC Sports Squad Tracker

Source ID: `nbcSquadTracker`  
Use for: club cross-checks and roster enrichment for published final 26-player teams.  
Source used: `https://www.nbcsports.com/soccer/news/2026-world-cup-squads-confirmed-rosters-for-all-48-teams`  
Fallback rule: use as a reputable media cross-check; FIFA/federation roster status wins conflicts.

### FIFAWorldCupNews Ecuador Fallback

Source ID: `fifaWorldCupNewsEcuador`  
Use for: Ecuador preliminary roster fallback only.  
Source used: `https://www.fifaworldcupnews.com/ecuador-world-cup-2026-squad-official/`  
Fallback rule: replace this with FIFA or Ecuador federation data as soon as a complete official squad source is available.

Current `players.json` use:

- Used because the primary tracker and FIFA hub did not provide a complete Ecuador row set in this import.
- Ecuador rows are marked `preliminary`.

### OpenFootball World Cup JSON

Source ID: `openFootballWorldCup`  
Use for: machine-readable fixture seeding and technical cross-checks.  
Fallback rule: do not publish OpenFootball fixture values unless they match FIFA.

Current `teams.json` use:

- OpenFootball 2026 `worldcup.json` was used to cross-check group membership and alternate country names.
- Some OpenFootball names differ from FIFA-style names, for example `South Korea` versus `Korea Republic`, `Czech Republic` versus `Czechia`, and `Ivory Coast` versus `Côte d'Ivoire`.

Current `fixtures.json` use:

- OpenFootball 2026 `worldcup.json` was used to cross-check all 72 group-stage fixtures.
- OpenFootball supplies the `matchday` label and local UTC offset in `fixtures.json`.
- All group fixtures matched after normalizing alternate team names.

Current `matchdays.json` use:

- OpenFootball-derived fixture data helps confirm kickoff order and group fixture sequencing.
- The matchday grouping is still labeled prototype because it is not an official FIFA fantasy deadline schedule.

### Fjelstul World Cup Database

Source ID: `fjelstulWorldCup`  
Use for: historical World Cup appearances, match record, goals for, goals against, clean sheets, knockout experience, titles, best performance, and recent performance.  
Source files used:

- `https://raw.githubusercontent.com/jfjelstul/worldcup/master/data-csv/teams.csv`
- `https://raw.githubusercontent.com/jfjelstul/worldcup/master/data-csv/qualified_teams.csv`
- `https://raw.githubusercontent.com/jfjelstul/worldcup/master/data-csv/matches.csv`
- `https://raw.githubusercontent.com/jfjelstul/worldcup/master/data-csv/tournaments.csv`

Current `teamQuality.json` use:

- Historical World Cup record is calculated for each 2026 team where a historical match exists.
- Teams with no historical men's World Cup sample in the database keep appearances and matches at zero.
- Historical data is used as one model input, not as a substitute for current team strength.

## Team Quality V2

File: `teamQuality.json`  
Embedded summary: each team in `teams.json` also has `team_quality_v2`. The first PELE-backed model is preserved in `teamQuality_v1.json`; the pre-PELE model is preserved in `teamQuality_v0.json`.

Formula:

```text
overall_score =
  0.82 current_strength_score
  + 0.10 historical_performance_score
  + 0.04 knockout_experience_score
  + 0.04 host_bonus_score
```

Current strength:

```text
current_strength_score =
  0.62 normalized PELE
  + 0.23 normalized World Football Elo
  + 0.15 normalized FIFA ranking points
```

Historical performance uses World Cup appearances, points per match, goal difference per match, clean-sheet rate, best performance, and recent performance since 2014.

Knockout experience uses knockout matches, knockout win rate, World Cup titles, and best performance.

Attack and defense proxies are PELE-forward: 0.44 PELE offense/defense, 0.38 current strength, and 0.18 historical scoring/clean-sheet context.

The file also includes:

- `goals_clean_sheet_inputs_v2`
- `group_outlook_v2`
- `tournament_outlook_v2`
- model limitations for each team

### Local FPL-Core-Insights Snapshot

Source ID: `localFplCoreInsights`  
Use for: temporary club-season performance estimates and risk prototypes.  
Fallback rule: do not use this for official World Cup squad status, fantasy prices, or official fantasy positions.

Current `playerPerformance.json` use:

- Used for Premier League player performance rows where roster players could be safely matched by name and club.
- Files used:
  - `FPL-Core-Insights/data/2025-2026/By Tournament/Premier League/GW34/playerstats.csv`
  - `FPL-Core-Insights/data/2025-2026/By Tournament/Premier League/GW34/players.csv`
  - `FPL-Core-Insights/data/2025-2026/By Tournament/Premier League/GW34/teams.csv`
  - `FPL-Core-Insights/data/2025-2026/By Tournament/Premier League/GW*/playermatchstats.csv`
- Useful fields include minutes, starts, goals, assists, clean sheets, cards, saves, expected goals, expected assists, expected goals conceded, defensive contribution, tackles, recoveries, fantasy points, ICT-style fields, set-piece order, and availability/news fields.
- GW35-GW38 local Premier League `playerstats.csv` files were empty, so GW34 is the latest usable local snapshot.

### Local source-nationalities.csv

Source ID: `localSourceNationalities`  
Use for: player matching help and existing FBref-style enrichment fields.  
Fallback rule: mark imported fields as supporting or estimated.

Current `playerPerformance.json` use:

- Used as a local FBref-style Premier League standard stats export.
- Useful fields include appearances, starts, minutes, 90s, goals, assists, non-penalty goals, penalties, yellow cards, red cards, and per-90 rates.
- This source does not include clean sheets, expected stats, fantasy points, or detailed match-log actions.

### Understat Big 5 League Player Data

Source ID: `understatBig5`  
Use for: Big 5 club-season performance where roster players can be safely matched by name and club.  
Source pages used:

- `https://understat.com/getLeagueData/EPL/2025`
- `https://understat.com/getLeagueData/La_liga/2025`
- `https://understat.com/getLeagueData/Bundesliga/2025`
- `https://understat.com/getLeagueData/Serie_A/2025`
- `https://understat.com/getLeagueData/Ligue_1/2025`

Current `playerPerformance.json` use:

- Used for Premier League, La Liga, Bundesliga, Serie A, and Ligue 1 roster players.
- Imported fields include appearances, minutes, goals, assists, xG, xA, non-penalty goals, non-penalty xG, shots, key passes, yellow cards, red cards, xGChain, and xGBuildup.
- This raised the Big 5 performance match from 137 players to 442 players.

Fallback rule:

- Use only when player name and club match safely.
- Keep starts and clean sheets as `null` because this endpoint does not expose those fields.
- Do not use Understat as an official FIFA fantasy price, fantasy position, or roster-status source.

### UEFA European Qualifiers Player Stats

Source ID: `uefaEuropeanQualifiersStats`  
Use for: country-level usage and form for UEFA teams.  
Source pages and endpoints used:

- `https://www.uefa.com/european-qualifiers/statistics/players/`
- `https://comp.uefa.com/v2/players?competitionId=17&seasonYear=2026`
- `https://compstats.uefa.com/v1/player-statistics`

Current `players.json` and `playerNationalTeamPerformance.json` use:

- Used for European World Cup teams only.
- Imported fields include qualifier appearances, minutes, goals, assists, attempts, attempts on target, attempts off target, attempts blocked, corners, offsides, clearances, goals conceded, fouls committed, fouls suffered, yellow cards, red cards, distance covered, and top speed.
- `players.json` now has a `national_team_profile` object for every player.
- `playerPerformance.json` includes the same national-team profile for matched club-performance rows.

Fallback rule:

- Use UEFA stats only for safe country/name matches.
- Keep `qualifier_starts` as `null` because the public stats endpoint used here does not expose starts.
- Use `qualifier_starting_signal` only as a minutes-per-appearance proxy.
- Non-UEFA qualifier stats need a separate source path.

### StatBunker Big 5 Fantasy-Style Player Stats

Source ID: `statbunkerBig5Fantasy`  
Use for: fantasy-style starts, clean sheets, points, substitute usage, goals conceded, penalties, and own goals.  
Source pages used:

- `https://www.statbunker.com/competitions/FantasyFootballPlayersStats?comp_id=776`
- `https://www.statbunker.com/competitions/FantasyFootballPlayersStats?comp_id=777`
- `https://www.statbunker.com/competitions/FantasyFootballPlayersStats?comp_id=785`
- `https://www.statbunker.com/competitions/FantasyFootballPlayersStats?comp_id=787`
- `https://www.statbunker.com/competitions/FantasyFootballPlayersStats?comp_id=762`

Current `statbunkerBig5Fantasy.json` use:

- Imported 2,488 StatBunker fantasy-style rows.
- Imported 2,030 current-season rows from Premier League, La Liga, Serie A, and partial Ligue 1 tables.
- Imported 458 Bundesliga 2024-2025 rows as previous-season context only.

Current `playerPerformance.json` use:

- 261 matched performance rows now have current-season StatBunker fantasy-style context.
- 40 Bundesliga rows have previous-season StatBunker context only.
- Current-season StatBunker fields fill starts, clean sheets, fantasy-style points, sub usage, goals conceded, penalties, and own goals where a safe player-and-club match exists.
- StatBunker goal/assist values are stored as source-specific fields and deltas instead of replacing Understat totals.

Fallback rule:

- Use only when player name and club match safely.
- Treat StatBunker points as league fantasy-style points, not official FIFA World Cup fantasy points.
- Do not use Bundesliga 2024-2025 rows to overwrite current-season starts or clean sheets.
- Treat the Ligue 1 current-season StatBunker table as partial until coverage improves.

### Soccerdata / FBref Check

Source ID: not imported in this pass  
Use for: future Big 5 league player-performance import if accessible.  
Fallback rule: do not invent non-Premier-League performance numbers.

Current status:

- The local `soccerdata` package is present and supports FBref Big 5 leagues.
- Direct FBref Big 5 access was blocked by Cloudflare during the earlier run, so FBref was not practical as the Big 5 import path.
- Understat is now the working Big 5 source for this sprint.
- FBref remains useful later if we need starts, clean sheets, progressive passing, defensive actions, and keeper fields beyond the current Understat endpoint.

### StatBunker and FootyStats Qualifier Checks

Source ID: not imported in this pass  
Use for: possible non-UEFA qualifier stats if accessible and matchable.  
Fallback rule: do not import partial rows unless the competition, player, country, and stat definition are clear.

Current status:

- StatBunker was checked for World Cup qualifier player appearances, but no stable current 2026 competition endpoint was identified in this pass.
- FootyStats has CONCACAF qualifier pages and public top-scorer tables, but that is not enough for full player starts/minutes matching.
- These sources are candidates for the next non-UEFA qualifier sprint, not current numeric imports.

### GitHub soccer-stats Topic Scan

Source ID: `githubSoccerStatsTopic`  
Use for: finding non-Big-5 league data sources, especially MLS, Brazil, and API wrappers for leagues outside the current Understat/StatBunker coverage.  
Source used: `https://github.com/topics/soccer-stats`  
Fallback rule: do not import from topic-linked repos until the underlying data source, freshness, and usage terms are clear.

Current status:

- The topic page is now documented in `sourceScoutingReport.md`.
- Best immediate lead: `sportsdataverse/usfootballR` for MLS/NWSL play-by-play, box scores, standings, and results.
- Best MLS fantasy-model reference: `gautam0826/FMLS-Projections`, but it is older and references a hidden Fantasy MLS API.
- Brazil lead: `lohxx/brasileirao`, useful for CBF standings context but not player-level performance.
- Broad API lead: `inglorious-ratbastard/botnSoccerApp`, which wraps Football-Data.org for matches, standings, top scorers, assists, and penalties across several leagues.
- Team-form lead: `CodeWithKola/sport-insight`, but it requires API credentials and is more match/team focused than player-performance focused.

Import stance:

- Use MLS as the next non-Big-5 import candidate.
- Treat Football-Data.org style data as scorer/assist/standings context, not a full replacement for minutes, starts, clean sheets, or fantasy points.
- Do not store API keys or hidden fantasy endpoints in project data files.

### Non-Big-5 League Source Probe

Source file: `data/nonBig5LeagueSourceTest.json`  
Use for: testing which sources can support player-performance imports outside the Big 5 leagues.  
Leagues tested: Portuguese Primeira Liga, Belgian Pro League, Polish Ekstraklasa, Greek Super League, MLS, Brazilian Serie A, and Argentine Liga Profesional.  
Fallback rule: this is a source probe only; do not merge sample leaderboard values into `playerPerformance.json` until importer matching and data-quality rules are added.

Sources tested:

- `espnSoccerStatsPages` for public ESPN soccer stats pages, teams API, and scoreboard API.
- `footyStatsDatasetsApi` for dataset row counts, player pages, CSV/API availability, and player-stat field definitions.
- `fbrefWorldwideStatsCandidate` for FBref player-standard-stat pages.
- `excel4soccerWorkbooks` for ESPN-derived workbook pages for Portugal and Belgium.
- `usfootballR` remains the MLS-specific package lead from GitHub.

Current status:

- ESPN public stats pages were usable for Portugal, Belgium, Greece, MLS, Brazil, and Argentina.
- ESPN did not expose a working `pol.1` league endpoint in this pass, so Poland should start with FootyStats or another Ekstraklasa-specific source.
- ESPN source rows currently provide leaderboard-style player context such as goals, assists, appearances, player IDs, and team IDs. They are not full minutes/starts/clean-sheet data by themselves.
- FootyStats dataset metadata was available for all seven target leagues and showed current player CSV row counts, but current CSV downloads redirected to Premium and the JSON player endpoint requires an API key.
- FBref pages were identified, but direct local fetch returned Cloudflare challenge pages.
- Excel4Soccer workbook pages were found for Portugal and Belgium; the pages say the workbooks are ESPN-derived, but the automated HTML test saw locked WordPress Download Manager links.

Best next import path:

1. Build an ESPN leaderboard importer for Portugal, Belgium, Greece, MLS, Brazil, and Argentina.
2. Use FootyStats API or CSV only if credentials/access are explicitly available.
3. Use Excel4Soccer as a validation source for Portugal and Belgium if direct workbook access is confirmed.
4. Keep FBref as a future browser/manual or cached-export path.

### ESPN Soccer League Coverage Scan

Source ID: `espnSoccerStatsPages`  
Source files: `data/espnLeagueCoverage.json`, `data/espnLeagueLeaderboards.json`, and `data/espnRosterLeaderboardMatches.json`  
Use for: broad player leaderboard context across ESPN soccer competitions, especially leagues outside the Big 5.  
Source used: `https://www.espn.com/soccer/competitions`

Current status:

- ESPN competitions page produced 168 soccer competition codes in this pass.
- All 168 tested competition stats pages returned parseable public leaderboard tables.
- Saudi Pro League is confirmed as ESPN league code `ksa.1`.
- `espnLeagueLeaderboards.json` stores parsed public leaderboard rows for each usable league.
- `espnRosterLeaderboardMatches.json` stores prototype matches between World Cup roster players and ESPN leaderboard rows.

Useful fields imported:

- ESPN league code and league name.
- ESPN stats page URL.
- ESPN team API URL and sample teams.
- ESPN scoreboard API URL and current event count.
- Leaderboard table title.
- Player rank.
- Player name.
- ESPN player UID and player URL.
- Team name and team URL.
- Appearances.
- Goals from top-scorer tables.
- Assists from top-assist tables.

High-value leagues confirmed:

- Saudi Pro League: `ksa.1`
- Turkish Super Lig: `tur.1`
- Dutch Eredivisie: `ned.1`
- Mexican Liga MX: `mex.1`
- Japanese J.League: `jpn.1`
- Chinese Super League: `chn.1`
- South African Premiership: `rsa.1`
- Scottish Premiership: `sco.1`
- Austrian Bundesliga: `aut.1`
- Swiss Super League: `sui.1`
- Danish Superliga: `den.1`
- Norwegian Eliteserien: `nor.1`
- Swedish Allsvenskan: `swe.1`

Fallback rule:

- ESPN leaderboard rows are real source-backed context, but they are not full `playerPerformance.json` rows yet.
- Use them for player identity, ESPN IDs, appearances, goals, assists, and weak form signals.
- Do not use them for minutes, starts, clean sheets, defensive stats, goalkeeper stats, or fantasy points unless another source fills those fields.
- Name-only roster matches must be reviewed before merging into production advice.

### ESPN Match Summary and Core Player Stats

Source ID: `espnSoccerMatchSummaryCoreStats`  
Source files: `data/espnDetailedMatchPlayerStats.json`, `data/espnDetailedSeasonPlayerStats.json`, and `data/espnDetailedRosterPlayerStats.json`  
Use for: detailed match-level player stats where ESPN exposes full match rosters and core player-stat endpoints.  
Source URL patterns:

- `https://site.api.espn.com/apis/site/v2/sports/soccer/{league_code}/scoreboard?dates={date_range}&limit=1000`
- `https://site.api.espn.com/apis/site/v2/sports/soccer/{league_code}/summary?event={event_id}`
- `https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league_code}/events/{event_id}/competitions/{competition_id}/competitors/{team_id}/roster/{player_id}/statistics/0?lang=en&region=us`

Current import:

- League imported: Saudi Pro League, ESPN code `ksa.1`.
- Completed matches imported: 306.
- Match-player rows imported: 9,214.
- Unique ESPN players imported: 525.
- Season aggregate rows created: 555.
- World Cup roster-player matches created: 44.
- High-confidence roster matches: 35.

Useful fields imported:

- Minutes.
- Starts.
- Substitute appearances.
- Sub-outs.
- Goals.
- Assists.
- Shots.
- Shots on target.
- Shots off target.
- Shots on post.
- Attempts in box.
- Attempts out of box.
- Yellow cards.
- Red cards.
- Own goals.
- Fouls committed.
- Fouls suffered.
- Offsides.
- Goals conceded.
- Saves.
- Save percentage when available.
- Clean-sheet flag.
- Penalty goals, attempts, misses, saves, and concessions.
- Free-kick shots and goals.
- Handballs.

Fallback rule:

- This source is stronger than ESPN leaderboard rows for minutes and starts.
- Treat name-and-club roster matches as usable after review.
- Treat name-only roster matches as review-only.
- Some ESPN defensive fields exist in the core schema but may be sparse or zero-filled depending on the league/feed, so do not assume defensive coverage is complete.

### ESPN Summary Roster Fallback Expansion

Source ID: `espnSoccerSummaryRosterStats`  
Source files: `data/espnSummaryImportReport.json`, `data/espnSummaryMatchedPlayerStats.json`, `data/espnSummaryMatchedSeasonStats.json`, and `data/worldCupLeagueCoverageMap.json`  
Use for: broader non-Big-5 player availability, starter/substitute usage, goals, assists, cards, goalkeeper context, and rough minutes where ESPN exposes only summary rosters.  
Source URL patterns:

- `https://site.api.espn.com/apis/site/v2/sports/soccer/{league_code}/scoreboard?dates={date_range}&limit=1000`
- `https://site.api.espn.com/apis/site/v2/sports/soccer/{league_code}/summary?event={event_id}`

Current import:

- Target league codes tested: 30.
- Scoreboards reached: 30.
- Completed events seen: 8,886.
- Summary endpoints requested: 8,886.
- Summary endpoint failures: 2.
- Matched player-match rows imported: 21,014.
- Season aggregate rows created: 937.
- Unique World Cup roster players matched: 806.
- High-confidence aggregate rows: 714.
- Review aggregate rows: 223.
- Leagues with matched rows: Argentina, Australia, Austria, Belgium, Brazil, Colombia, Denmark, England, Spain, France, Germany, Greece, Japan, Saudi Arabia, Mexico, Netherlands, Norway, Portugal, South Africa, Scotland, Switzerland, Sweden, Türkiye, and MLS.
- World Cup countries still not covered by this ESPN summary fallback: Korea Republic and Qatar.

Coverage map:

- `worldCupLeagueCoverageMap.json` maps all 48 World Cup countries to the domestic league source found in this sprint.
- Domestic ESPN league found for 26 of 48 World Cup teams.
- Domestic ESPN summary rows matched roster players for 22 World Cup-country domestic leagues.
- Four domestic ESPN leagues were reachable but produced no current roster matches in this pass: Ecuador, Ghana, Paraguay, and Uruguay.
- Twenty countries had no domestic ESPN league in this scan but did have roster-player coverage through players' club leagues elsewhere.

Useful fields imported:

- Starts.
- Substitute appearances.
- Bench appearances where ESPN roster status allowed it.
- Goals.
- Assists.
- Shots and shots on target where ESPN exposes them.
- Yellow cards.
- Red cards.
- Own goals.
- Fouls.
- Goals conceded.
- Saves.
- Estimated minutes from starter/substitution timing when exact minutes were not present.

Fallback rule:

- Use this source when ESPN core per-player endpoints are blocked or unavailable in broad batch runs.
- Treat high-confidence name-and-club matches as usable after spot review.
- Treat name-only rows as review-only until a second identifier confirms the player.
- Use `minutes_is_estimated`, `minutes_estimate_basis`, and season-level `estimated_minutes_rows` before feeding minutes into a fantasy model.
- Do not treat estimated minutes as equal to source-provided exact minutes.

### OneFootball Korea and Qatar Supplemental Import

Source ID: `oneFootballWebStats`  
Source files: `data/oneFootballKoreaQatarImportReport.json`, `data/oneFootballKoreaQatarLeagueStats.json`, `data/oneFootballKoreaQatarMatchPlayerStats.json`, `data/oneFootballKoreaQatarSeasonPlayerStats.json`, `data/oneFootballKoreaQatarRosterMatches.json`, `data/oneFootballLeagueCoverageProbe.json`, `data/nonEnglishLeagueSourceProbe.json`, and `data/worldCupLeagueCoverageMap.json`  
Use for: filling the Korea Republic and Qatar gaps left by ESPN, plus checking non-English/region-specific league sources.  
Source URL patterns:

- `https://search-api.onefootball.com/v2/en/search?q={query}`
- `https://scores-api.onefootball.com/v1/en/competitions/{competition_id}/matches?number_next=0&number_previous=1000`
- `https://feedmonster.onefootball.com/feeds/il/en/competitions/{competition_id}/{season_id}/league_statistics.json`
- `https://feedmonster.onefootball.com/feeds/il/en/competitions/{competition_id}/{season_id}/standings.json`
- `https://onefootball.com/en/match/{match_id}`

Current import:

- Competitions imported: K League 1, OneFootball competition ID `130`, season ID `43358`; Qatar Stars League, OneFootball competition ID `158`, season ID `43062`.
- Match pages parsed: 222 / 222.
- Match-player rows imported: 6,896.
- Season-player aggregate rows created: 694.
- World Cup roster matches created: 29.
- High-confidence name-and-club roster matches: 27.
- Review roster matches: 2.
- Korea Republic roster matches: 7.
- Qatar roster matches: 22.
- `worldCupLeagueCoverageMap.json` now shows no World Cup country without at least one performance-source coverage path after the OneFootball supplement.

Useful fields imported:

- Confirmed starters from match pages.
- Substitute appearances from substitution events.
- Estimated minutes from starter/substitution timing.
- Goals and assists from match events.
- Yellow and red cards from match events.
- League leaderboard goals, assists, goals plus assists, yellow cards, and red cards.
- Team standings and team match stats where exposed.

Related non-English/source checks:

- `kLeagueOfficialPlayerRank` was checked at `https://www.kleague.com/record/player.do?leagueId=1`.
- The K League official page exposes goals, assists, attack points, goals conceded, corners, fouls, shots, offsides, cards, clean sheets, played, substitutions, and per-stat rankings in English/Korean UI.
- `qslOfficial` was checked at `https://qsl.qa/en/qatar-stars-league-20252026` and `https://qsl.qa/en/doha-bank-stars-league`.
- QSL official pages are useful for schedule/news/match-document context, but this pass did not find a clean player-stat table endpoint.
- FootyStats Korea/Qatar player and dataset pages were found as candidate backup sources, but they still need an access-path check before import.

Fallback rule:

- Use OneFootball Korea/Qatar rows as supplemental domestic-league context.
- Minutes are estimated, not official exact minutes.
- High-confidence name-and-club matches can be used after spot review.
- Review matches should not drive user-facing recommendations until manually checked.
- Keep OneFootball domestic-league rows separate from `playerPerformance.json` until the merge rules handle estimated minutes and source priority.

Broad coverage probe:

- `oneFootballLeagueCoverageProbe.json` tested 32 target leagues.
- OneFootball competitions found: 30 / 32.
- Match feeds worked: 30 / 32.
- League statistics endpoints returned: 30 / 32.
- Standings endpoints returned: 30 / 32.
- Sample match pages worked: 30 / 32.
- Sample match pages with confirmed lineups: 30 / 32.
- Sample match pages with events: 30 / 32.
- Sample match pages with team stats: 26 / 32.
- Likely useful complement leagues: 30 / 32.
- Missing in OneFootball search/API probe: Ghanaian Premier League and Nigerian Professional League.
- Leagues with match/lineup/event coverage but empty league-stat leaderboards in this pass: Brazil, Costa Rica, Ecuador, Norway, Paraguay, Sweden, and Uruguay.

Best complement use:

- Use OneFootball match pages to validate or fill starts, substitute appearances, estimated minutes, goals, assists, cards, and match involvement.
- Use OneFootball league statistics to add top-30 scorer/assist/card leaderboard context where available.
- Use OneFootball standings to add team attacking/defensive context such as goals for, goals against, home/away splits, points, wins, draws, and losses.
- For Big 5 leagues, keep StatBunker/Understat/FPL-style data as primary where stronger, and use OneFootball as a cross-check for lineup/event data.
- For non-Big-5 leagues with ESPN rows, use OneFootball as a second source to improve confidence and fill fields ESPN does not expose consistently.

Broad complement import:

- Source files: `data/oneFootballAllImportReport.json`, `data/oneFootballAllLeagueStats.json`, `data/oneFootballAllSeasonPlayerStats.json`, `data/oneFootballAllRosterMatches.json`, and `data/oneFootballAllRosterMatchPlayerStats.json`.
- Target leagues imported: 30.
- Metadata failures: 0.
- Matches seen: 6,987.
- Full-time match pages parsed: 6,941 / 6,941.
- Match pages failed: 0.
- Match-player rows parsed in memory: 213,174.
- Season-player aggregate rows written: 15,689.
- League leaderboard rows written: 2,205.
- Standings rows written: 702.
- Team match-stat rows written: 25,464.
- World Cup roster season matches written: 801.
- Roster match-player rows written: 18,127.
- High-confidence roster matches: 733.
- Review roster matches: 68.
- World Cup roster countries matched by this OneFootball layer: 45.
- Roster countries not matched in this OneFootball layer: Ghana, Iraq, and Jordan.

Fields added in the broad import:

- Estimated minutes, starts, substitute appearances, appearances, goals, assists, yellow cards, red cards, own goals.
- Clean-sheet appearance flags and goals conceded while appearing, derived from match score plus appearance status.
- Team and opponent match-stat totals where OneFootball exposes match stat widgets.
- Team standings context, including goals for, goals against, goal difference, home/away splits, points, wins, draws, and losses.
- Top-30 league leaderboard context for goals, assists, goals plus assists, yellow cards, and red cards where available.

### OneFootball World Cup Qualifier Supplement

Source ID: `oneFootballQualifierStats`  
Source files: `data/oneFootballNationalTeamMatchProbe.json`, `data/oneFootballQualifierImportReport.json`, `data/oneFootballQualifierRosterSeasonStats.json`, `data/oneFootballQualifierRosterMatchStats.json`, `data/playerNationalTeamPerformance.json`, and refreshed embedded profiles in `data/playerPerformance.json`  
Use for: national-team qualifier appearances, starts, estimated minutes, goals, assists, cards, clean-sheet context, goals conceded while appearing, and country-role signals.  
Source URL patterns:

- `https://scores-api.onefootball.com/v1/en/competitions/69/matches?number_next=0&number_previous=1000`
- `https://scores-api.onefootball.com/v1/en/competitions/70/matches?number_next=0&number_previous=1000`
- `https://scores-api.onefootball.com/v1/en/competitions/71/matches?number_next=0&number_previous=1000`
- `https://scores-api.onefootball.com/v1/en/competitions/72/matches?number_next=0&number_previous=1000`
- `https://scores-api.onefootball.com/v1/en/competitions/73/matches?number_next=0&number_previous=1000`
- `https://scores-api.onefootball.com/v1/en/competitions/74/matches?number_next=0&number_previous=1000`
- `https://onefootball.com/en/match/{match_id}`

Competitions imported:

- UEFA World Cup Qualifying, OneFootball competition ID `69`, season ID `42055`.
- OFC World Cup Qualifying, OneFootball competition ID `70`, season ID `41898`.
- CONCACAF World Cup Qualifying, OneFootball competition ID `71`, season ID `41568`.
- CAF World Cup Qualifying, OneFootball competition ID `72`, season ID `40941`.
- AFC Asian Qualifiers - Road to 26, OneFootball competition ID `73`, season ID `40916`.
- CONMEBOL World Cup Qualifying, OneFootball competition ID `74`, season ID `40917`.

Current import:

- Competitions imported: 6.
- Matches seen: 911.
- Match pages parsed: 911 / 911.
- Match-page failures: 0.
- All match-player rows parsed: 27,852.
- World Cup roster match-player rows retained: 5,181.
- World Cup roster player season aggregates created: 852.
- Roster players with starts: 765.
- Roster players with minutes: 849.
- Roster players with goal involvements: 455.
- World Cup roster countries matched: 45.
- Countries without qualifier rows in this layer: Canada, Mexico, and USA, because they auto-qualified as hosts.
- `playerNationalTeamPerformance.json` now stores this source in `onefootball_qualifier_profile` and `best_available_qualifier_stats_v0` for each player.

Fallback rule:

- Keep official UEFA public stats as the stronger source where already present.
- Use OneFootball for non-UEFA qualifier coverage and for lineup-derived starts, clean-sheet context, and goals-conceded context.
- Treat OneFootball starts and minutes as supplemental; minutes are estimated from lineups and substitution clocks.
- A missing OneFootball match-page row means no parsed appearance match or a possible identity mismatch, not proof that the player is impossible to select.

## Generated Merge Outputs

### Player Recommendation Inputs v0

Output file: `data/playerRecommendationInputs_v0.json`  
Source IDs used: `fifaSquads`, `worldCupStatsSquadTracker`, `nbcSquadTracker`, `fifaSchedule`, `openFootballWorldCup`, `fifaRankings`, `worldFootballElo`, `fjelstulWorldCup`, `localFplCoreInsights`, `localSourceNationalities`, `understatBig5`, `statbunkerBig5Fantasy`, `espnSoccerMatchSummaryCoreStats`, `espnSoccerSummaryRosterStats`, `oneFootballWebStats`, and `oneFootballQualifierStats`.

Use for:

- One merged recommendation-input row per roster player.
- Roster identity and roster-source caveats.
- Best available club performance fields with field-level source labels.
- National-team qualifier usage and country-role context.
- Team quality, group outlook, and group-stage fixture context.
- Prototype fixture-difficulty seed values inside each group fixture.
- Data-confidence scores and review flags for later recommendation tiers.

Current merge:

- Roster player rows: 1,339.
- Rows with high-confidence club performance: 886.
- Rows with any club performance including review rows: 956.
- Rows with national qualifier usage: 913.
- Rows with both club and national signal: 664.
- Rows with club-only signal: 222.
- Rows with national-only signal: 249.
- Rows usable for recommendation v0: 1,135.
- Rows with complete three-fixture group context: 1,339.

Fallback rule:

- Treat this file as the modeling input layer, not final advice.
- Keep review flags visible when a player is matched only by a weaker source.
- Keep estimated-minute flags visible for ESPN summary and OneFootball rows.
- Keep official fantasy prices, final FIFA squad status, and official fantasy positions null until they are imported.

### Player Recommendation Tiers v0

Output file: `data/playerRecommendationTiers_v0.json`  
Input file: `data/playerRecommendationInputs_v0.json`  
Use for: deciding which players can safely enter recommendation lists, which players should be watchlist/fallback options, and which players need manual review before ranking.

Tier IDs:

- `ready_high_confidence` - confirmed player with high-confidence club data and national-team qualifier usage.
- `ready_medium_confidence` - strong signal but with a caveat, such as preliminary roster status or only one of club/national signals for a confirmed player.
- `usable_low_confidence` - usable for watchlists or fallback advice, but not top recommendations.
- `needs_review` - manual review required because of roster status, missing position, review-only source matching, or caps-only signal.
- `insufficient_data` - not enough performance or qualifier usage data to rank yet.

Current tier counts:

- Ready high confidence: 489.
- Ready medium confidence: 427.
- Usable low confidence: 169.
- Needs review: 87.
- Insufficient data: 167.
- Recommendation-ready tiers total: 1,085.

Fallback rule:

- Use high and medium tiers for the first recommendation model.
- Use low confidence only for watchlists, depth options, or when a team/position lacks enough better data.
- Keep needs-review and insufficient-data players out of confident user-facing rankings until checked.

### Fantasy Finance Metrics v0

Output file: `data/playerFinanceMetrics_v0.json`  
Model notes: `data/fantasyFinanceModel_v0.md`  
Input file: `data/playerRecommendationInputs_v0.json`  
Use for: finance-style fantasy scoring, risk-adjusted player comparison, downside protection, high-upside punts, attack-heavy picks, and defensive-heavy picks.

Generated browser file: `financePlayersData.js`  
Use in site: homepage Quick Picks, Captain Picks, Team Advice, Player Profiles, Team Builder pick styles, and exported team JSON.

### Player Minutes Model v0

Output file: `data/playerMinutesModel_v0.json`  
Input file: `data/playerRecommendationInputs_v0.json`  
Use for: starter confidence, expected minutes, minutes floor, substitution risk, and country role labels.

Signals used:

- National-team qualifier starts and minutes.
- OneFootball qualifier lineup/substitution supplements where matched.
- Club starts and minutes.
- Senior caps and captain signal where available.
- Roster status.
- Data confidence tier.
- Position depth inside each country.

Role labels:

- `locked_starter`.
- `likely_starter`.
- `rotation`.
- `bench_option`.
- `needs_check`.

Fallback rule:

- National-team usage is weighted above club usage because World Cup fantasy value depends on country role.
- Club usage helps when national usage is missing or weak.
- Position depth caps starter probability so backup goalkeepers and deep bench players are not over-ranked only because they have club minutes.
- Treat this as a prototype role model until final squads, injuries, friendlies, and lineups are known.

### Player Value Model v0/v1

Output file: `data/playerValueModel_v0.json`  
Active output file: `data/playerValueModel_v1.json`  
Generated browser fields: `financePlayersData.js`  
Input files: `data/playerFinanceMetrics_v0.json`, `data/playerRecommendationInputs_v0.json`, `data/playerMinutesModel_v0.json`  
Use for: Best Value Prototype, Cheap Enabler, Premium Worth It, overpay risk, and budget workflow testing before official fantasy prices are available.

Important:

- `official_price` is `null` for every player.
- `price_status` is `missing_official_price`.
- `proxy_price_v0` and `proxy_price_v1` are prototype placeholders, not official prices.
- `proxy_price_v1` is the active website price.
- v1 role-adjusts expected return by start probability, expected minutes, and role confidence before applying position floors and caps.
- v1 keeps low-start, low-minute, and insufficient-data players from becoming more expensive than v0.

Value fields:

- `expected_points_per_price`.
- `risk_adjusted_points_per_price`.
- `value_sharpe`.
- `value_sortino`.
- `cheap_enabler_score`.
- `premium_worth_it_score`.
- `overpay_risk`.
- `value_role`.

Fallback rule:

- Use value styles only as prototype testing until official fantasy prices are imported.
- Replace or recalibrate `proxy_price_v1` as soon as official prices become available.
- Do not present proxy price as a real game price.

### Matchday Player Projections v2

Output file: `data/playerMatchdayProjections_v2.json`  
Recommendation file: `data/matchdayRecommendations_v2.json`  
Generated browser file: `matchdayProjectionsData.js`  
Input files: `data/playerFinanceMetrics_v0.json`, `data/playerRecommendationInputs_v0.json`, `data/playerMinutesModel_v0.json`, `data/scorePredictions_v2.json`, `data/matchdays.json`, `data/fixtures.json`  
Use for: opponent-specific player scoring by Matchday 1, Matchday 2, Matchday 3, and Full Group Stage.

Fields added:

- Fixture opponent and matchday context.
- Fixture difficulty score and band from the team's point of view.
- Score prediction context from the team's point of view: expected goals, expected goals against, win/draw/loss probabilities, clean-sheet probability, attacking environment, defensive environment, captain environment, goal environment, and upset risk.
- Browser explanation context for Team Advice and Quick Picks: Full Group Stage rows summarize average team xG and clean-sheet probability, while single-matchday rows call out exact opponent team xG, clean-sheet probability, fixture difficulty, goal environment, win chance, and upset risk.
- Player Profile fixture-table context: Matchday 1, Matchday 2, and Matchday 3 opponent, date, city, difficulty, team xG, xGA, clean-sheet probability, upset risk, and fixture-use label.
- Difficulty delta versus that player's average group difficulty.
- Attack, defense, return, and volatility multipliers.
- Matchday-adjusted expected return, risk-adjusted return, VaR, CVaR, volatility, downside deviation, tail risk, composite risk, and captain score.
- Matchday-adjusted start probability, expected minutes, minutes floor, substitution risk, country role, and role confidence from `playerMinutesModel_v0.json`.
- Matchday-adjusted strategy scores for risk-adjusted, safe-floor, upside, attack-heavy, defensive-heavy, very-risky, minutes-floor, tail-risk avoidance, and captain styles.

Fallback rule:

- Use `group_stage_full` for balanced squad construction across all three group matches.
- Use `md1`, `md2`, or `md3` when advice should reflect the exact opponent in that matchday.
- Treat the model as prototype because official fantasy prices, final squads, injuries, lineups, and scoring rules are still pending.
- Treat score-prediction inputs as match-environment signals, not official score forecasts.

Metrics added:

- Expected return: prototype expected fantasy points per match.
- Volatility: model-estimated points uncertainty.
- Downside deviation: downside-only volatility below a 2-point target.
- Value at Risk: `value_at_risk_10_points`.
- Conditional Value at Risk: `conditional_value_at_risk_20_points`.
- Upside: `upside_p90_points`.
- Sharpe-like and Sortino-like raw ratios.
- Omega-like raw ratio.
- Risk-adjusted return and certainty-equivalent return.
- Tail-risk score and composite-risk score.

Strategy scores added:

- `risk_adjusted`.
- `safe_floor`.
- `upside`.
- `attack_heavy`.
- `defensive_heavy`.
- `very_risky`.
- `minutes_floor`.
- `tail_risk_avoidance`.

Current finance-model labels:

- Target: 229.
- Strong option: 179.
- High-upside option: 25.
- High-risk high-upside: 56.
- Safe filler: 68.
- Watchlist: 528.
- Needs review: 87.
- Avoid for now: 167.

Fallback rule:

- Treat these as prototype fantasy-finance metrics until official fantasy scoring and prices are imported.
- Keep price-adjusted return fields null until official World Cup fantasy prices exist.
- Use `very_risky` only for intentional high-variance picks, not as a default ranking.

### Score Predictions v2

Output file: `data/scorePredictions_v2.json`  
Generated browser file: `scorePredictionsData.js`  
Roadmap file: `data/scorePredictionModelRoadmap.md`  
QA files: `data/scorePredictionQa_v2.json`, `data/scorePredictionQaReport_v2.md`  
Input files: `data/fixtures.json`, `data/matchdays.json`, `data/teams.json`, `data/teamQuality.json`, `data/peleRatings_v1.json`  
Use for: fixture-level score environment, expected goals, win/draw/loss probability, clean-sheet probability, goal environment, upset risk, the homepage Match Environment panel, and player recommendation multipliers.

Model:

- PELE-forward team-quality adjusted Poisson.
- Starts from a 1.33 base World Cup team goal rate.
- Adjusts expected goals using PELE-forward attack proxy, opponent defense proxy, team-quality gap, reduced Elo gap, stronger direct PELE rating gap, PELE Tilt, and host-venue boost.
- Converts expected goals to scoreline probabilities with a Poisson score grid.
- Uses no betting odds.

Fields added:

- `home_expected_goals` and `away_expected_goals`.
- `home_win_probability`, `draw_probability`, and `away_win_probability`.
- `home_clean_sheet_probability` and `away_clean_sheet_probability`.
- `over_2_5_goals_probability`.
- `both_teams_to_score_probability`.
- `goal_environment`.
- `favorite_team_id`.
- `upset_risk_probability`.
- `top_scorelines`.
- Team-view attack, defense, captain environment, and fixture difficulty scores.

Hardening checks:

- 72/72 group-stage fixtures have prediction rows.
- 144/144 team-fixture views exist.
- 4,017/4,017 player-matchday rows have score-prediction context.
- Elo, FIFA ranking, and PELE rating inputs are present for all 48 teams.
- Expected goals, probability fields, favorites, and top scorelines pass v2 guardrails.
- `scorePredictionsData.js` exposes the QA status to the Match Environment panel.

Upgrade timing:

- Upgrade the next model after final squads, official fantasy players, official prices, official scoring rules, injuries, and updated national-team form are imported.
- Add a later calibration pass when the model is stable and we are ready to backtest or calibrate low-score/draw behavior with a Dixon-Coles-style adjustment.

Fallback rule:

- Treat every score prediction as a prototype model output.
- Do not use it as a betting or gambling model.
- Do not present expected goals as official projections.

### Captain Change Advisor v0

Model notes: `data/captainChangeAdvisorModel_v0.md`  
Input files: `financePlayersData.js`, `matchdayProjectionsData.js`, `scorePredictionsData.js`  
Manual input: current captain raw points before captain double  
Use for: one-question captain switch checks inside the same matchday.

Current scope:

- Quick Captain Switch Check only.
- No full-squad entry.
- No live fantasy score feed.
- The user chooses one replacement candidate and confirms that player is in their squad and has not played yet.

Decision fields:

- Current captain raw score.
- Replacement matchday switch score, blended from compressed raw-scale expected signal, risk-adjusted signal, downside floor, and upside depending on risk style.
- Replacement matchday expected return as a model signal, not as the raw score forecast used directly for the switch decision.
- Replacement risk-adjusted return.
- Replacement upside per 90.
- Start probability and expected minutes.
- Fixture difficulty and PELE-forward score environment.
- Player QA flags.

Fallback rule:

- Do not invent live points, squad membership, or played/unplayed state.
- Treat 12+ raw captain points as an excellent current score unless the user is intentionally chasing with a very aggressive replacement.
- Keep the output as switch, keep, close call, or needs check.
- Update the assumptions after official 2026 fantasy captain-switch rules are published.

### Substitution Advisor v0

Model notes: `data/substitutionAdvisorModel_v0.md`  
Input files: `financePlayersData.js`, `matchdayProjectionsData.js`, `scorePredictionsData.js`  
Manual input: played starter raw fantasy points  
Use for: one-question substitution checks inside the same matchday.

Current scope:

- Quick Substitution Check only.
- No full-squad entry.
- No live fantasy score feed.
- The user chooses one played starter and one bench candidate.
- The user confirms that the bench candidate is in their squad and has not played yet.

Decision fields:

- Played starter raw score.
- Bench-player substitution score, blended from compressed raw-scale expected signal, risk-adjusted signal, downside floor, and upside depending on risk style.
- Bench-player expected return as a model signal, not as the raw score forecast used directly for the substitution decision.
- Start probability and expected minutes.
- Fixture difficulty and PELE-forward score environment.
- Player QA flags.
- Same-player and different-position warnings.

Fallback rule:

- Do not invent live points, squad membership, or played/unplayed state.
- Treat 6+ raw starter points as useful and 8+ as strong unless the user is intentionally chasing.
- Different-position substitutions must be checked manually against the user's current formation.
- Keep the output as sub in bench player, keep starter, close call, or needs check.
- Update the assumptions after official 2026 fantasy substitution rules are published.

### Team Export JSON v1

Model notes: `data/teamExportModel_v1.md`  
Browser output: downloaded `world-cup-fantasy-team-v1.json`  
Input files: `financePlayersData.js`, `matchdayProjectionsData.js`, `scorePredictionsData.js`, `fantasyRulesData.js`  
Use for: saving, sharing, testing, and Team Import v0 restore flows for Team Builder squads.

Current scope:

- Exports the current full Team Builder squad after a valid build.
- Preserves readable legacy fields such as players, starting 11, bench, captain, rule checks, and portfolio analytics.
- Adds `schema_version: team-export-v1`, model metadata, builder settings, squad state, recommendation notes, and decision-tool fields.
- Records locked players, removed players, ignored locked players, starter slots, and bench slots.
- Records user-selected captain, vice captain, and bench order when the user sets them on the built/imported squad.
- Includes null-safe Captain Change Advisor v0 and Substitution Advisor v0 fields.
- Includes the latest saved manual quick-check result after a user runs Captain Change Advisor or Substitution Advisor.

Fallback rule:

- Treat exported captain and vice-captain as prototype model suggestions only when the user has not selected them.
- Keep decision-tool scenario fields null unless a user has run a specific manual quick check.
- Restore saved decision-tool results only as imported review context that requires an advisor rerun.
- Do not treat proxy prices, draft rules, or prototype projections as official fantasy data.

### Team Import v0

Model notes: `data/teamImportModel_v0.md`
Browser input: uploaded `world-cup-fantasy-team-v1.json` or another valid `team-export-v1` file
Input files: `financePlayersData.js`, `matchdayProjectionsData.js`, `scorePredictionsData.js`, `fantasyRulesData.js`
Use for: restoring a saved Team Builder squad without user accounts or live storage.

Current scope:

- Accepts only `schema_version: team-export-v1`.
- Restores formation, matchday, recommendation style, trust mode, price filters, risk controls, locked players, removed players, starters, and bench.
- Restores user-selected captain, vice captain, and bench order by exact current player ID when those players are still valid in the restored squad.
- Uses exact current player IDs and warns when IDs are missing.
- Renders the saved squad directly instead of rerunning the optimizer.
- Restores saved captain-change and substitution scenarios as imported review context when their saved player IDs still exist.

Fallback rule:

- Do not infer missing player IDs or replacement players.
- Do not infer missing captain, vice-captain, or bench-order selections.
- Do not migrate prototype IDs to future official fantasy IDs until a deliberate migration step exists.
- Do not treat an imported squad as official-game legal until official rules, prices, positions, and player IDs are imported.
- Do not treat imported saved decisions as fresh live recommendations. The user must rerun the advisor before acting.

### Saved Squad Decision Mode v0

Model notes: `data/savedSquadDecisionMode_v0.md`
Browser state: current full Team Builder squad from a build or Team Import v0 restore
Input files: `financePlayersData.js`, `matchdayProjectionsData.js`, `scorePredictionsData.js`, `fantasyRulesData.js`
Use for: filling Captain Change Advisor and Substitution Advisor manual fields from saved-squad buttons.

Current scope:

- Shows saved-squad captain buttons for current captain and new captain.
- Shows saved starter and saved bench buttons for substitution checks.
- Uses the selected advisor matchday and risk style to display fixture, start, minutes, and compressed decision signal context.
- Leaves manual search available when no full saved squad exists.

Fallback rule:

- Do not infer live points.
- Do not infer played/unplayed state.
- Filling fields from saved-squad buttons alone is not a saved decision.
- Only a completed advisor quick check is saved into Team Export JSON v1.
- Do not treat saved-squad buttons as official-game legality checks.

### Saved Squad Matchday Timeline v0

Model notes: `data/savedSquadMatchdayTimeline_v0.md`
Browser state: current full Team Builder squad from a build or Team Import v0 restore
Input files: `matchdayProjectionsData.js`, `financePlayersData.js`, `scorePredictionsData.js`
Use for: grouping the saved squad by MD1/MD2/MD3 kickoff and quick-filling manual decision tools.

Current scope:

- Groups saved squad players by selected matchday kickoff.
- Shows starter/bench status, opponent, fixture difficulty, start probability, expected minutes, balanced captain signal, and balanced substitution signal.
- Provides quick-fill buttons for current captain, new captain, played starter, and bench option.
- Uses existing prototype matchday projection timing labels.

Fallback rule:

- Do not infer live score or played/unplayed status.
- Do not infer official matchday deadlines or captain/substitution windows.
- Timeline quick-fill actions alone are not saved user decisions.
- Only a completed advisor quick check is saved into Team Export JSON v1.
- Re-check this workflow once official 2026 fantasy rules and deadlines are published.

### User Squad Selection v0

Model notes: `data/userSquadSelection_v0.md`
Browser state: current full Team Builder squad from a build or Team Import v0 restore
Input files: `script.js`, `financePlayersData.js`, `matchdayProjectionsData.js`, `scorePredictionsData.js`
Use for: marking captain, vice captain, and bench order on a built/imported Team Builder squad.

Current scope:

- Adds `C` and `VC` controls to starter cards.
- Adds `B1`, `B2`, `B3`, and `B4` controls to bench cards.
- Requires captain and vice captain to be different starters.
- Requires bench-order selections to be current bench players.
- Uses selected labels in Captain Change Advisor, Substitution Advisor, and Saved Squad Timeline.
- Writes selected IDs and source labels into Team Export JSON v1.
- Restores selected IDs during Team Import v0 when the exact current player IDs still exist in the restored squad.

Fallback rule:

- Do not infer captain, vice captain, or bench order when the user has not selected them.
- Keep model captain and vice-captain fallbacks only as clearly labeled fallback export values.
- Do not infer live points, played/unplayed state, deadlines, or official-game legality.
- Warn instead of guessing if imported selection IDs no longer match the restored squad.

### Matchday Decision Center v0

Model notes: `data/matchdayDecisionCenter_v0.md`
Browser state: current full Team Builder squad from a build or Team Import v0 restore
Input files: `script.js`, `financePlayersData.js`, `matchdayProjectionsData.js`, `scorePredictionsData.js`
Use for: organizing captain-switch and bench-substitution checks from the saved squad during a matchday.

Current scope:

- Shows the saved captain, vice captain, bench order, selected matchday, and selected risk style.
- Accepts manual current-captain raw points.
- Accepts one played starter and that starter's manual raw points.
- Ranks captain-switch options with the existing Captain Change Advisor v0 compressed raw-point signal.
- Shows bench candidates in saved `B1`-`B4` order with the existing Substitution Advisor v0 compressed raw-point signal.
- Provides fill buttons that send one comparison into Captain Change Advisor or Substitution Advisor.

Fallback rule:

- Do not infer live points.
- Do not infer who has already played.
- Do not infer official captain/substitution windows or deadlines.
- Do not treat the center as a saved decision; only completed detailed advisor checks are exported by Saved Decision Export v0.
- Keep formation legality as a manual check for different-position substitutions.

### Saved Decision Export v0

Model notes: `data/savedDecisionExport_v0.md`
Browser output: `decision_tools` inside Team Export JSON v1
Input files: `script.js`, `financePlayersData.js`, `matchdayProjectionsData.js`, `scorePredictionsData.js`
Use for: carrying the latest manual captain-change or substitution quick-check result inside an exported Team Builder file.

Current scope:

- Keeps existing `team-export-v1` schema.
- Exports `saved: false` null-safe decision-tool placeholders when no quick check has been run.
- Exports `saved: true` for the latest Captain Change Advisor result after a user runs the quick check.
- Exports `saved: true` for the latest Substitution Advisor result after a user runs the quick check.
- Stores user-entered raw points, selected matchday, risk style, result, decision score, thresholds, player references, projection snapshot, QA flags, and warnings.
- Clears saved decisions when the advisor resets, inputs become invalid, or the Team Builder squad changes.

Fallback rule:

- Do not infer live points.
- Do not infer played/unplayed state.
- Do not infer official-game legality.
- Imported saved decision results must be tagged as requiring an advisor rerun.

### Saved Decision Import v0

Model notes: `data/savedDecisionImport_v0.md`
Browser input: `decision_tools` inside Team Export JSON v1
Input files: `script.js`, `financePlayersData.js`, `matchdayProjectionsData.js`, `scorePredictionsData.js`, `fantasyRulesData.js`
Use for: restoring saved captain-change and substitution quick-check scenarios after Team Import v0.

Current scope:

- Reads saved Captain Change Advisor and Substitution Advisor scenarios from `team-export-v1`.
- Restores matchday, risk style, user-entered raw points, and exact current player IDs where available.
- Shows imported saved-check panels in the advisor result areas.
- Re-exports imported scenarios with `imported: true`, `saved_decision_import_version: saved_decision_import_v0`, and `imported_requires_rerun: true`.
- Replaces imported context with a fresh manual decision when the user reruns the advisor.

Fallback rule:

- Do not guess missing player IDs from names.
- Do not infer live points.
- Do not infer played/unplayed state.
- Do not infer official-game legality.
- Treat imported decisions as review context until rerun.

### Decision Tools QA Polish v0

Model notes: `data/decisionToolsQaPolish_v0.md`
Browser files: `index.html`, `style.css`, `script.js`
Input files: `financePlayersData.js`, `matchdayProjectionsData.js`, `scorePredictionsData.js`, `fantasyRulesData.js`
Use for: making manual captain-change and substitution tool state clear to users.

Current scope:

- Adds visible Manual, Saved, and Imported - rerun needed status badges to both advisors.
- Makes imported saved-check warnings more prominent in the advisor result panels.
- Keeps concise in-section instructions visible under the advisor headings.
- Preserves conservative handling for high raw scores.

Fallback rule:

- Do not treat a status badge as official fantasy legality.
- Do not infer live points or played/unplayed state.
- Imported checks remain review context until rerun.

### Recommendation QA v2

Output file: `data/recommendationQa_v2.json`  
Report file: `data/recommendationQaReport_v2.md`  
Input files: `financePlayersData.js`, `matchdayProjectionsData.js`, `data/playerFinanceMetrics_v0.json`, `data/playerRecommendationInputs_v0.json`, `data/playerMinutesModel_v0.json`, `data/playerMatchdayProjections_v2.json`, `data/scorePredictions_v2.json`  
Use for: auditing top recommendation pools by style, matchday, position, country, data quality, role risk, and fixture context.

Checks added:

- Top 25 overall players per recommendation style and matchday.
- Top 10 players by position for each style and matchday.
- Country concentration in top pools.
- Data confidence, roster status, source-review flags, and recommendation-readiness checks.
- Role-risk checks for start probability, expected minutes, substitution risk, and country role.
- Finance downside checks for composite risk, tail risk, VaR, and CVaR.
- Fixture-context checks for hard fixtures, attack-heavy low team xG, defensive-heavy low clean-sheet probability, and very-risky low upset context.

Fallback rule:

- Treat QA flags as warnings for model review, not automatic player exclusions.
- Keep Very Risky picks visible even when flagged, because that style is intentionally high variance.
- Re-run QA after final squads, official prices, official positions, scoring rules, injuries, and starting lineup data are imported.

## Data Honesty Rules

- Official data should say it is official and include a source ID.
- Provisional squad data should say it is provisional.
- Estimated performance fields should say `isEstimated: true`.
- Prototype predictions should say `predictionStatus: prototype` or `not_calculated`.
- Score predictions must not use betting odds.
