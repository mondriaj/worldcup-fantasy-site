# Week 6 Data Quality Report

Status: team, PELE, group-stage fixture, matchday, roster player, finance, value, score prediction, matchday projection, and recommendation QA data imported.  
Website wiring status: homepage is wired to finance player data, matchday projection browser data, score-prediction browser data, and Player Profile views.  
Current purpose: real team-strength, roster, finance-style fantasy metrics, score environment, matchday-specific recommendation foundation, and recommendation QA guardrails.

## Current Data State

- `teams.json` has all 48 FIFA World Cup 2026 teams.
- `teams.json` includes group, qualification status, FIFA ranking, FIFA ranking points, World Football Elo rating, Elo rank, PELE rating, PELE rank, PELE Tilt, group opponents, and group-level prediction input fields.
- `teams.json` now includes embedded `team_quality_v2`, `world_cup_history`, `goals_clean_sheet_inputs_v2`, `group_outlook_v2`, and `tournament_outlook_v2` for each team.
- `teamQuality.json` has the full active PELE-forward `team_quality_v2` model output for all 48 teams.
- `teamQuality_v1.json` preserves the first PELE-backed `team_quality_v1` model.
- `teamQuality_v0.json` preserves the pre-PELE `team_quality_v0` model.
- `peleRatings_v1.json` has 211 PELE rows downloaded from Silver Bulletin Datawrapper CSVs, with all 48 World Cup teams matched.
- `fixtures.json` has all 72 FIFA World Cup 2026 group-stage fixtures.
- `fixtures.json` includes match ID, match number, matchday, date, local time, time zone, UTC datetime, ET display time, teams, team IDs, group, venue, city, source notes, and per-fixture data quality.
- `matchdays.json` has prototype fantasy group-stage matchday groupings built from `fixtures.json`.
- `matchdays.json` includes `md1`, `md2`, `md3`, and `group_stage_full`.
- `players.json` has 1,339 source-backed World Cup 2026 roster/player rows.
- `players.json` covers all 48 World Cup 2026 teams.
- `players.json` includes roster status, current club where available, position, source URLs, data quality, recommendation status, and matching keys for later fantasy/stat matching.
- `rosters.json` has one example-only roster row.
- `fantasyRules.json` has empty official-rule placeholders.
- `playerPerformance.json` has 442 matched Big 5 league performance rows plus unmatched Big 5 candidate reporting.
- `playerPerformance.json` now includes StatBunker fantasy-style context for 261 current-season matched rows and 40 previous-season Bundesliga context rows.
- `playerNationalTeamPerformance.json` has one national-team profile for each of the 1,339 roster players, including UEFA official qualifier stats where matched and OneFootball qualifier match-page supplements where matched.
- `statbunkerBig5Fantasy.json` has 2,488 imported StatBunker fantasy-style source rows.
- `teamStrength.json` has one example-only strength row.
- `fixtureDifficulty.json` has one example-only difficulty row.
- `scorePredictions.json` has one example-only fixture prediction and one example-only player prediction.
- `scorePredictions_v2.json` has active prototype model outputs for all 72 group-stage fixtures and 144 team-fixture views using PELE-forward team quality.
- `scorePredictions_v1.json` is preserved as the first PELE-backed score model.
- `scorePredictions_v0.json` is preserved as the pre-PELE score model.
- `sourceManifest.json` has planned source records.

## Official Data Readiness

Status: `blocked_waiting_for_official_fantasy_data`

Official Data Readiness v0 was added on June 1, 2026 to prevent proxy and preliminary fields from being treated as official fantasy data.

Current readiness counts:

- 1,339 roster/player rows.
- 48 World Cup teams covered.
- 0 official fantasy player IDs imported.
- 0 official fantasy prices imported.
- 1,339 rows still use proxy prices.
- 0 finance rows have official price-adjusted return.

Expected blockers:

- Final official squads are not imported as final roster status.
- Official fantasy player IDs are missing.
- Official fantasy positions are missing.
- Official fantasy prices are missing.
- Official rules, scoring, transfers, boosters, deadlines, captain rules, and substitution windows are missing.

Validation command:

```bash
node scripts/validateOfficialDataReadiness.mjs
```

## Teams Data Quality

Complete:

- 48 teams imported.
- 12 groups represented.
- 4 teams per group.
- Every team is marked `qualified: true`.
- Every team has `team_id`, `country`, `group`, `qualified`, `team_elo`, `pele_rating`, `pele_rank`, `pele_tilt`, `pele_offense`, `pele_defense`, `fifa_ranking`, `source_note`, and `data_quality`.
- Every team has a FIFA ranking from the official FIFA ranking API.
- Every team has a World Football Elo rating from `eloratings.net`.
- Every team has three `group_opponents`.
- Every team has `group_prediction_inputs` for v0 fixture difficulty and score prediction work.
- Every team has a calculated `team_quality_v2.overall_score`.
- Every team has current strength inputs from PELE, FIFA ranking points, and World Football Elo.
- Every team has historical World Cup fields from Fjelstul's World Cup database, with zero appearances for teams that do not have a men's World Cup history in the source.
- Every team has first-pass attack, defense, goal-scoring, and clean-sheet proxy scores.
- Every team has first-pass group and tournament outlook proxy scores.

Missing or intentionally null:

- Recent non-World-Cup goals for, recent non-World-Cup goals against, xG for, and xG against are not imported yet outside the PELE model inputs.
- Squad/player-strength inputs are not included yet because official squads and fantasy players are handled in separate files.
- Market value, squad age, and player availability are not included yet.

Data caveats:

- FIFA group names and OpenFootball names do not always match exactly, so `openfootball_name` preserves the cross-check name when it differs.
- World Football Elo country codes are their own site-specific codes, stored as `elo_code`.
- PELE is a reputable source, and only downloaded CSV values are imported. Missing PELE values must remain null and must not be inferred.
- `team_quality_v2` scores are model signals, not calibrated probabilities.
- Group and tournament outlook fields are proxy scores for fantasy planning, not predictions of exact finishing position.

## Fixtures Data Quality

Complete:

- 72 group-stage fixtures imported.
- 12 groups represented.
- 6 fixtures per group.
- Every fixture has `match_id`, `match_number`, `matchday`, `date`, `time_local`, `time_zone`, `home_team`, `away_team`, `home_team_id`, `away_team_id`, `stage`, `group`, `venue`, `city`, `source_note`, and `data_quality`.
- Every fixture links to valid team IDs from `teams.json`.
- Every fixture was cross-checked against OpenFootball 2026 `worldcup.json`.
- Every OpenFootball cross-check matched on teams and group.
- Every OpenFootball date check matched.
- Every OpenFootball local time check matched.

Missing or intentionally null:

- `home_score` and `away_score` are `null` because all fixtures are scheduled future matches.
- Knockout-stage fixtures are not included in `fixtures.json` yet.
- FIFA internal match IDs are not included because the current source snapshot uses match numbers but not stable FIFA internal IDs.

Data caveats:

- `home_team` and `away_team` mean the source-listed first and second teams. They should not be treated as true home advantage by the prediction model unless a separate host/venue rule says so.
- `matchday` comes from OpenFootball labels. Later we may want a separate fantasy-deadline matchday model in `matchdays.json`.
- Time zones come from OpenFootball local kickoff strings and were cross-checked against the existing UTC datetime.
- Knockout-stage match slots can be added later with null teams/placeholders if we decide the website needs the full tournament shell in this file.

## Matchdays Data Quality

Complete:

- `md1` has 24 fixtures.
- `md2` has 24 fixtures.
- `md3` has 24 fixtures.
- `group_stage_full` has 72 fixtures.
- Every matchday has `matchday_id`, `label`, `start_date`, `end_date`, `fixture_ids`, and `notes`.
- Every fixture ID in `matchdays.json` exists in `fixtures.json`.
- Each group-stage fixture appears exactly once across `md1`, `md2`, and `md3`.

Prototype status:

- Official FIFA fantasy matchday deadlines are not available in this data folder yet.
- The current grouping is a fantasy-planning prototype.
- The grouping method is: sort each group's six fixtures by UTC kickoff, then assign the first two to `md1`, the middle two to `md2`, and the final two to `md3`.

Missing or intentionally null:

- Official fantasy deadlines are not included.
- Official transfer windows are not included.
- Official captain-lock or substitution-lock rules are not included.

## Players Data Quality

Complete:

- 1,339 player rows imported.
- All 48 World Cup teams have at least one player row.
- Every player has `player_id`, `name`, `country`, `team_id`, `club`, `league`, `position`, `roster_status`, `data_quality`, `recommendation_status`, `source_note`, and `data_note`.
- Every `team_id` links to a valid team in `teams.json`.
- Every `player_id` is unique.
- FIFA official squad articles are used where complete enough to parse.
- World Cup Stats and NBC Sports are used for club/caps enrichment and fallback rows.
- Ecuador uses a clearly marked fallback source because complete FIFA/tracker coverage was missing during this import.
- Australia uses FIFA's official train-on article only; those eight rows are not treated as a full squad.

Roster status counts:

- `confirmed`: 832 players.
- `preliminary`: 499 players.
- `needs_check`: 8 players.

Missing or intentionally null:

- `league` is now filled for 451 Big 5 club players matched through source-backed club matching. It remains `null` for 888 players outside the matched Big 5 club set.
- `club` is `null` for 191 players because the source used for those players did not supply a club or the club could not be matched safely.
- `position` is `null` for 4 Australia train-on players because the official article named them without a clear position.
- Official fantasy player IDs, FIFA player IDs, FBref IDs, Transfermarkt IDs, and local project player matches are all `null` until the matching sprint.
- Non-UEFA qualifier match stats now live in `playerNationalTeamPerformance.json`, not directly in `players.json`.

Data caveats:

- FIFA says final squad publication is due on June 2, 2026, so rows marked `confirmed` should still be re-checked against FIFA's final published list before production recommendations.
- Some teams currently use tracker rows as the primary roster source because the FIFA article was missing, incomplete, or not parseable enough for a full roster import.
- `recommendation_status` is now upgraded for players with a Week 6 club-performance match or UEFA qualifier context. Other players remain `needs_performance_match`.
- Club names are source text, not normalized club IDs.
- No player score projections are calculated from this file yet.

## Player Performance Data Quality

Complete:

- `playerPerformance.json` was rebuilt from source-backed local and public performance data.
- 1,339 roster players were checked.
- 451 roster players were identified as Big 5 league candidates from Premier League, La Liga, Bundesliga, Serie A, or Ligue 1 clubs.
- 442 roster players were matched to league performance data.
- 897 roster players are unmatched to league performance data.
- 9 Big 5 league candidates are still unmatched.
- Every matched row has `player_id`, `season`, `club`, `league`, `minutes`, `starts`, `goals`, `assists`, `clean_sheets`, `yellow_cards`, `red_cards`, `source_note`, and `data_quality`.
- Every matched row links to an existing `player_id` from `players.json`.
- Every matched row includes the refreshed `national_team_profile` from `playerNationalTeamPerformance.json` so club form and country usage can be compared in one place.
- 442 embedded national-team profiles were refreshed from the current national-team file.
- 9 unmatched top-European candidate profiles were also refreshed from the current national-team file.
- 335 matched Big 5 performance rows now have embedded OneFootball qualifier profiles.
- 365 matched Big 5 performance rows now have embedded `best_available_qualifier_stats_v0`.
- 261 matched rows have current-season StatBunker fantasy-style context.
- 40 Bundesliga rows have previous-season StatBunker context only.

Match rates:

- Overall roster match rate: 442 / 1,339.
- Big 5 league candidate match rate: 442 / 451.
- Premier League candidate match rate: 152 / 155.
- La Liga candidate match rate: 69 / 70.
- Bundesliga candidate match rate: 96 / 96.
- Serie A candidate match rate: 60 / 62.
- Ligue 1 candidate match rate: 65 / 68.

StatBunker fantasy-style coverage:

- StatBunker rows imported: 2,488.
- Current-season StatBunker rows imported: 2,030.
- Previous-season context rows imported: 458.
- Current-season StatBunker matches: 261 / 442 performance rows.
- Previous-season StatBunker context matches: 40 / 442 performance rows.
- Premier League current-season StatBunker matches: 144 / 152.
- La Liga current-season StatBunker matches: 64 / 69.
- Serie A current-season StatBunker matches: 52 / 60.
- Ligue 1 current-season StatBunker matches: 1 / 65.
- Bundesliga previous-season context matches: 40 / 96.

Sources used:

- `localFplCoreInsights` for Premier League GW34 player stats, fantasy fields, expected stats, defensive fields, goalkeeper fields, and match-log aggregates.
- `localSourceNationalities` for local FBref-style Premier League standard stats.
- `understatBig5` for Big 5 league minutes, appearances, goals, assists, xG, xA, shots, key passes, and cards.
- `uefaEuropeanQualifiersStats` for UEFA qualifier minutes, appearances, goals, assists, attempts, cards, distance covered, and top speed where a safe country/name match exists.
- `oneFootballQualifierStats` through refreshed embedded national-team profiles for qualifier starts, estimated minutes, clean-sheet context, goals conceded, and non-UEFA qualifier coverage where matched.
- `statbunkerBig5Fantasy` for fantasy-style points, starts, clean sheets, partial clean sheets, sub usage, goals conceded, penalties saved/missed, and own goals where source rows matched safely.

Missing or intentionally null:

- `starts` is `null` for rows matched only through Understat or previous-season StatBunker context because Understat does not expose starts and previous-season context does not overwrite current-season fields.
- `clean_sheets` is `null` for rows not matched to FPL-Core-Insights or current-season StatBunker because Understat and the local FBref-style export do not expose clean sheets.
- UEFA qualifier `qualifier_starts` is `null` because the public UEFA stats endpoint used here does not expose starts.
- Bundesliga 25/26 StatBunker fantasy data was not found in the competition scan, so Bundesliga StatBunker data is previous-season context only.
- Ligue 1 25/26 StatBunker fantasy data imported only 40 rows in this check, so Ligue 1 StatBunker coverage is very weak.
- Non-UEFA qualifier match stats are now available through refreshed `national_team_profile` rows where OneFootball matched a qualifier appearance.
- Official World Cup fantasy IDs and prices are not imported here.
- Non-Big-5 club-performance imports are not added yet from the GitHub `soccer-stats` topic scan. Those sources are documented as candidates until data freshness, field coverage, and usage terms are verified.

Weak data:

- No Big 5 league is below the current 65% match-rate warning threshold.
- Countries with unmatched Big 5 candidates: Canada, Colombia, Egypt, France, Morocco, New Zealand, Sweden, and Tunisia.

Data caveats:

- FPL-Core-Insights GW35-GW38 local Premier League `playerstats.csv` files were empty, so GW34 is the latest usable local Premier League snapshot.
- Club-to-league classification is used for matching and weak-data reporting only. It is not a replacement for a full club registry.
- Numeric stats are never guessed. Missing values remain `null`.
- The national-team starting signal is an estimated minutes-per-appearance proxy, not an official start count.
- StatBunker fantasy points are league fantasy-style points, not official FIFA World Cup fantasy points.
- StatBunker and Understat can disagree on goals or assists because their snapshots and stat rules differ. The imported rows keep StatBunker goal/assist deltas inside the `fantasy` object instead of overwriting Understat totals.

## National Team Performance Data Quality

Complete:

- `playerNationalTeamPerformance.json` was created with one national-team profile per roster player.
- 1,339 roster players have a `national_team_profile`.
- 429 roster players are from UEFA teams.
- 376 roster players were matched to UEFA European Qualifiers 2026 player stats.
- 1 UEFA player identity match had no public stat row.
- 52 UEFA roster players still need identity review against UEFA's player list.
- 107 host-team players are marked `not_applicable_auto_qualified_host`.
- OneFootball World Cup qualifier match pages were imported for UEFA, OFC, CONCACAF, CAF, AFC, and CONMEBOL qualifying.
- OneFootball qualifier import covered 911 matches with 0 match-page failures.
- 27,852 OneFootball qualifier match-player rows were parsed.
- 5,181 World Cup roster match-player rows were retained.
- 852 roster players matched OneFootball qualifier appearance rows.
- 765 roster players have OneFootball qualifier starts.
- 849 roster players have OneFootball qualifier minutes.
- 455 roster players have OneFootball qualifier goal involvements.
- 913 roster players now have some qualifier stat signal from UEFA official stats, OneFootball match pages, or both.
- 536 players had generic qualifier fields filled from OneFootball because they did not already have official UEFA stats.
- 45 World Cup roster countries matched the OneFootball qualifier layer.
- Canada, Mexico, and USA are the only countries without OneFootball qualifier rows, because they auto-qualified as hosts.

Sources used:

- `uefaEuropeanQualifiersStats` for official UEFA qualifier player stats.
- `oneFootballQualifierStats` for supplemental qualifier match-page player stats across all six World Cup qualifying confederation feeds.
- `worldCupStatsSquadTracker` for senior caps, senior goals, and captain flags where available.

Missing or intentionally null:

- 426 players still do not have matched qualifier appearance stats. This can mean no parsed qualifier appearance, a display-name mismatch, or a roster identity that still needs review.
- OneFootball qualifier minutes are estimated from lineups and substitution clocks, not official exact minutes.
- Official UEFA public stats remain the stronger source where already present; OneFootball is used as a supplement for starts, clean-sheet context, goals conceded, and non-UEFA coverage.
- Senior caps and senior goals remain null when the roster source did not provide them.

## Non-Big-5 League Source Probe

Complete:

- `nonBig5LeagueSourceTest.json` was created as a source-feasibility probe.
- Seven leagues were tested: Portuguese Primeira Liga, Belgian Pro League, Polish Ekstraklasa, Greek Super League, MLS, Brazilian Serie A, and Argentine Liga Profesional.
- ESPN public leaderboard pages were parsed successfully for Portugal, Belgium, Greece, MLS, Brazil, and Argentina.
- ESPN teams and scoreboard APIs were reachable for those six leagues.
- FootyStats dataset metadata was reachable for all seven leagues.

FootyStats current dataset row counts seen:

- Portugal: 644 player rows, 306 match rows.
- Belgium: 555 player rows, 313 match rows.
- Poland: 627 player rows, 306 match rows.
- Greece: 516 player rows, 236 match rows.
- MLS: 814 player rows, 510 match rows.
- Brazil: 712 player rows, 380 match rows.
- Argentina: 954 player rows, 495 match rows.

Missing or intentionally not imported:

- No rows from `nonBig5LeagueSourceTest.json` have been merged into `playerPerformance.json`.
- ESPN leaderboard rows are useful but incomplete; they do not provide full minutes, starts, clean sheets, or defensive/goalkeeper stats.
- ESPN did not expose a working Poland/Ekstraklasa endpoint in this pass.
- FootyStats current CSV/API data requires Premium/API-key access before a full import.
- FBref current pages exist, but direct local fetch was blocked by Cloudflare.
- Excel4Soccer workbook pages were found for Portugal and Belgium, but direct workbook download was not confirmed in the automated HTML test.

## ESPN League Leaderboard Coverage

Complete:

- `espnLeagueCoverage.json` was created from the ESPN soccer competitions page.
- `espnLeagueLeaderboards.json` was created with parsed public ESPN leaderboard rows.
- `espnRosterLeaderboardMatches.json` was created with prototype roster-to-ESPN leaderboard matches.
- 168 ESPN soccer competitions were discovered and tested.
- 168 competitions returned parseable public leaderboard tables.
- Saudi Pro League was confirmed as ESPN league code `ksa.1`.
- ESPN leaderboard data is now available for Saudi Arabia, Turkey, Netherlands, Mexico, Japan, China, South Africa, Scotland, Austria, Switzerland, Denmark, Norway, Sweden, Portugal, Belgium, Greece, MLS, Brazil, Argentina, and many cup/international competitions.

Roster match results:

- Total prototype roster-to-ESPN leaderboard matches: 1,459.
- High-confidence name-and-club matches: 787.
- Name-only rows needing review: 672.
- Unique roster players with at least one ESPN leaderboard match: 595.
- Saudi Pro League roster leaderboard matches: 26.

Missing or intentionally not imported:

- ESPN leaderboard rows have not been merged into `playerPerformance.json` yet.
- ESPN leaderboard rows do not provide full minutes, starts, clean sheets, defensive actions, goalkeeper stats, or fantasy points.
- Some ESPN competition pages are cup or international competitions, so those rows must not be mixed with domestic league rows without competition labels.
- Name-only matches must be reviewed before use in user-facing recommendations.

## ESPN Detailed Saudi Match-Player Stats

Complete:

- `espnDetailedMatchPlayerStats.json` was created from ESPN Saudi Pro League match summaries and ESPN core player-stat endpoints.
- `espnDetailedSeasonPlayerStats.json` was created as a season aggregate from those match-player rows.
- `espnDetailedRosterPlayerStats.json` was created as a prototype World Cup roster match file.
- Saudi Pro League 2025-26 completed matches imported: 306.
- Match-player rows imported: 9,214.
- Unique ESPN players imported: 525.
- Season-player aggregate rows created: 555.
- Core stat endpoint failures: 0.
- Summary endpoint failures: 0.

Roster match results:

- Total detailed Saudi roster matches: 44.
- High-confidence name-and-club matches: 35.
- Name-only rows needing review: 9.
- Unique World Cup roster players matched: 42.

Useful fields now available:

- Minutes and starts.
- Substitute appearances and sub-outs.
- Goals and assists.
- Shots, shots on target, shots off target, shots on post, attempts in box, and attempts out of box.
- Yellow cards, red cards, own goals, fouls committed, fouls suffered, and offsides.
- Goals conceded, saves, and clean-sheet flags.
- Penalty and free-kick detail where ESPN exposes it.

Missing or caveated:

- Detailed ESPN Saudi rows have not been merged into `playerPerformance.json` yet.
- Name-only rows need review before use in recommendations.
- Some defensive fields are present in ESPN's core stat schema but appear sparse or zero-filled in this feed, so defensive coverage should be treated as incomplete until cross-checked.
- ESPN clean-sheet and goals-conceded fields appear on player rows across positions; use them for fantasy scoring only after position-specific rules are applied.
- This detailed import currently covers Saudi Pro League only; the same method should be expanded in batches to other ESPN leagues.

## ESPN Summary Roster Fallback Expansion

Complete:

- `espnSummaryImportReport.json` was created as the import report for a broad ESPN summary-roster pass.
- `espnSummaryMatchedPlayerStats.json` was created with matched World Cup roster player-match rows.
- `espnSummaryMatchedSeasonStats.json` was created with season aggregates for matched roster players.
- Target league codes tested: 30.
- Scoreboards reached: 30.
- Completed events seen: 8,886.
- Summary endpoints requested: 8,886.
- Summary endpoint failures: 2.
- Matched player-match rows imported: 21,014.
- Season-player aggregate rows created: 937.
- Unique World Cup roster players matched: 806.

Roster match results:

- High-confidence aggregate rows: 714.
- Name-only or weaker review aggregate rows: 223.
- Countries covered by at least one matched player include 46 of 48 World Cup teams.
- Korea Republic and Qatar are the only World Cup countries still not covered by this ESPN summary fallback pass.
- Leagues with matched rows: Argentina, Australia, Austria, Belgium, Brazil, Colombia, Denmark, England, Spain, France, Germany, Greece, Japan, Saudi Arabia, Mexico, Netherlands, Norway, Portugal, South Africa, Scotland, Switzerland, Sweden, Türkiye, and MLS.
- `worldCupLeagueCoverageMap.json` now maps all 48 World Cup countries to domestic league coverage status and fallback rules.
- Domestic ESPN league found for 26 of 48 World Cup teams.
- Domestic ESPN summary rows matched roster players for 22 World Cup-country domestic leagues.
- Domestic ESPN league was reachable but produced no current roster matches for Ecuador, Ghana, Paraguay, and Uruguay.
- Twenty countries had no domestic ESPN league in this scan but did have roster-player coverage through players' club leagues elsewhere.

Useful fields now available:

- Starts and substitute appearances.
- Goals and assists.
- Shots and shots on target where ESPN exposes them.
- Yellow cards, red cards, own goals, and fouls.
- Goals conceded and saves where ESPN exposes them.
- Estimated minutes from starter/substitution timing when exact minutes are absent.

Missing or caveated:

- ESPN core per-player stat endpoints began returning blocked responses during the broad expansion attempt, so this fallback uses site summary roster data instead.
- Minutes are estimated in many rows; use `minutes_is_estimated`, `minutes_estimate_basis`, and season-level `estimated_minutes_rows` before modeling.
- Name-only rows need review before use in recommendations.
- Defensive and goalkeeper coverage varies by league and match feed.
- These rows have not been merged into `playerPerformance.json` yet.

## OneFootball Korea and Qatar Supplemental Data Quality

Complete:

- `oneFootballKoreaQatarImportReport.json` was created as the import report.
- `oneFootballKoreaQatarLeagueStats.json` was created with OneFootball league leaderboard and standings data.
- `oneFootballKoreaQatarMatchPlayerStats.json` was created from OneFootball match pages.
- `oneFootballKoreaQatarSeasonPlayerStats.json` was created as the season aggregate.
- `oneFootballKoreaQatarRosterMatches.json` was created for World Cup roster matching.
- `nonEnglishLeagueSourceProbe.json` was created for OneFootball, K League official, QSL official, and FootyStats Korea/Qatar source checks.
- Competitions imported: K League 1 and Qatar Stars League.
- Match pages parsed successfully: 222 / 222.
- Match-player rows imported: 6,896.
- Season-player aggregate rows created: 694.
- World Cup roster matches created: 29.
- High-confidence roster matches: 27.
- Review roster matches: 2.
- Korea Republic roster matches: 7.
- Qatar roster matches: 22.
- After this supplement, `worldCupLeagueCoverageMap.json` has no World Cup country with zero performance-source coverage path.

Useful fields now available:

- Confirmed starters.
- Substitute appearances.
- Estimated minutes.
- Goals and assists.
- Yellow and red cards.
- League leaderboard goals, assists, goals plus assists, yellow cards, and red cards.
- Team standings and basic team match stats where exposed.

Missing or caveated:

- OneFootball endpoints are public web/app endpoints, not an official league API.
- Minutes are estimated from lineup and substitution timing.
- Goalkeeper clean sheets are not directly calculated in this import yet, even though match scores and starts are available.
- Two roster matches are review-only because name and country/league matched but club did not.
- These rows have not been merged into `playerPerformance.json` yet.

## OneFootball Broad League Coverage Probe

Complete:

- `oneFootballLeagueCoverageProbe.json` was created as a coverage probe, not a full player import.
- Target leagues tested: 32.
- OneFootball competitions found: 30.
- Match feeds worked: 30.
- League statistics endpoints returned: 30.
- Standings endpoints returned: 30.
- Sample match pages parsed: 30.
- Sample match pages with confirmed lineups: 30.
- Sample match pages with match events: 30.
- Sample match pages with team match stats: 26.
- Likely useful complement leagues: 30.

Missing or weak:

- OneFootball search/API probe did not find usable Ghanaian Premier League or Nigerian Professional League competitions.
- Brazil, Costa Rica, Ecuador, Norway, Paraguay, Sweden, and Uruguay had match feeds, standings, lineups, and events, but empty OneFootball league-stat leaderboard groups in this pass.
- Costa Rica, Korea Republic, Paraguay, and Uruguay sample match pages did not expose team match-stat widgets in this pass.

Recommendation:

- OneFootball is worth using as a broad complement source, especially for starts, substitute usage, estimated minutes, goals, assists, cards, and team context.
- Do not replace stronger exact sources with OneFootball where we already have stronger fields.
- Use OneFootball as a second source and gap-filler in the next `playerPerformance.json` merge pass.

## OneFootball Broad Complement Import

Complete:

- `oneFootballAllImportReport.json` was created.
- `oneFootballAllLeagueStats.json` was created with league leaderboards, standings, and team match-stat rows.
- `oneFootballAllSeasonPlayerStats.json` was created with all-player season aggregates for the 30-league import.
- `oneFootballAllRosterMatches.json` was created with World Cup roster-to-OneFootball season matches.
- `oneFootballAllRosterMatchPlayerStats.json` was created with match-level rows only for roster-matched players.
- Target leagues imported: 30.
- Metadata failures: 0.
- Matches seen: 6,987.
- Full-time match pages parsed: 6,941.
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

Useful fields now available:

- Estimated minutes, starts, substitute appearances, and appearances.
- Goals, assists, goal involvements, yellow cards, red cards, and own goals.
- Clean-sheet appearances and goals conceded while appearing.
- Team/opponent match-stat totals where available.
- Team standings context.
- Top-30 league leaderboard context where available.

Missing or caveated:

- Ghana, Iraq, and Jordan did not receive roster matches from this broad OneFootball layer.
- OneFootball minutes are estimated from lineup and substitution timing.
- Review rows must be checked before use in recommendations.
- This is still a supplemental layer and has not been merged into production `playerPerformance.json`.

## Player Recommendation Input Layer v0

Complete:

- `playerRecommendationInputs_v0.json` was created as the first merged modeling-input file.
- It has one row for each of the 1,339 roster players.
- Every row has roster identity, team context, group fixture context, source coverage flags, best available club performance, national-team usage, and data confidence.
- Every player has complete three-fixture group-stage context.
- Field-level club-performance source labels are included in `best_available_club_performance_v0.field_sources`.
- Source snapshots are kept for primary Big 5, ESPN detailed, ESPN summary, and OneFootball club matches where available.
- National-team usage comes from `playerNationalTeamPerformance.json`.
- Original input-layer team strength comes from `teams.json` and `team_quality_v0`; active PELE-forward fixture and score environments now live in the v2 downstream score/matchday files.

Coverage:

- Rows with high-confidence club performance: 886.
- Rows with any club performance including review rows: 956.
- Rows with national qualifier usage: 913.
- Rows with both club and national signal: 664.
- Rows with club-only signal: 222.
- Rows with national-only signal: 249.
- Rows with weak review/caps-only signal: 35.
- Rows with insufficient signal: 169.
- Rows usable for recommendation v0: 1,135.

Data confidence bands:

- High: 664.
- Medium: 384.
- Low: 88.
- Weak: 203.

Missing or caveated:

- This is an input layer, not final user-facing player recommendations.
- Official fantasy prices, final FIFA fantasy positions, and official fantasy player IDs are still missing.
- The fixture difficulty values inside this file are prototype seed values only; `fixtureDifficulty.json` is still not calculated.
- ESPN summary and OneFootball minutes can be estimated from lineups and substitution timing.
- Review-only source matches are retained but flagged.

## Player Recommendation Tiers v0

Complete:

- `playerRecommendationTiers_v0.json` was created from `playerRecommendationInputs_v0.json`.
- Every one of the 1,339 roster players has a `recommendation_tier_v0`.
- `playerRecommendationInputs_v0.json` was also updated so each player row carries the tier object directly.
- Tier rules are conservative: strong data with roster or identity problems is held in `needs_review`, not promoted.

Tier counts:

- `ready_high_confidence`: 489.
- `ready_medium_confidence`: 427.
- `usable_low_confidence`: 169.
- `needs_review`: 87.
- `insufficient_data`: 167.
- Recommendation-ready tiers total: 1,085.
- Not recommendation-ready yet: 254.

Position-level weak spots:

- Goalkeepers with `insufficient_data`: 37.
- Defenders with `insufficient_data`: 57.
- Midfielders with `insufficient_data`: 47.
- Forwards with `insufficient_data`: 26.
- Unknown-position players needing review: 4.

Countries with the most `needs_review` or `insufficient_data` players:

- Ghana: 22.
- Iraq: 19.
- Uzbekistan: 17.
- Jordan: 15.
- Cabo Verde: 13.
- IR Iran: 13.
- Qatar: 13.
- Egypt: 12.
- Saudi Arabia: 12.

Missing or caveated:

- The tier file is recommendation readiness, not final fantasy scoring.
- Low-confidence players should be watchlist/fallback options only.
- Needs-review players require identity, roster, position, or weak-source checking before ranking.
- Final FIFA squads and official fantasy prices may move players between tiers.

## Fantasy Finance Metrics v0

Complete:

- `playerFinanceMetrics_v0.json` was created from `playerRecommendationInputs_v0.json`.
- `fantasyFinanceModel_v0.md` documents the model in plain language.
- All 1,339 roster players have finance-style fantasy metrics.
- All rows include expected return, volatility, downside deviation, VaR, CVaR, upside, Sharpe-like, Sortino-like, Omega-like, tail risk, composite risk, risk-adjusted return, and certainty-equivalent return.
- Strategy scores exist for risk-adjusted, safe floor, upside, attack-heavy, defensive-heavy, very risky, minutes floor, and tail-risk avoidance styles.

Current summary:

- Recommendation-ready rows: 1,085.
- High or medium ready rows: 916.
- Average expected return: 2.25 prototype points per match.
- Average volatility: 4.84 points.
- Average tail-risk score: 81.98.

Finance-model labels:

- `target`: 229.
- `strong_option`: 179.
- `high_upside_option`: 25.
- `high_risk_high_upside`: 56.
- `safe_filler`: 68.
- `watchlist`: 528.
- `needs_review`: 87.
- `avoid_for_now`: 167.

Risk profiles:

- `balanced`: 526.
- `low_floor`: 349.
- `data_gap`: 167.
- `defensive_floor`: 116.
- `review_risk`: 87.
- `volatile`: 74.
- `boom_bust`: 20.

Missing or caveated:

- Official FIFA fantasy prices are still missing, so price-adjusted return fields are intentionally `null`.
- VaR and CVaR are parametric estimates from aggregate data, not observed World Cup fantasy match distributions.
- This is not final fantasy advice; it is a model input layer for recommendation screens.
- Official scoring, prices, final squads, and matchday rules can change the final rankings.

## Website Finance Data Wiring

Complete:

- `financePlayersData.js` was generated from `playerFinanceMetrics_v0.json` joined to `playerRecommendationInputs_v0.json`.
- The homepage now loads `financePlayersData.js` before the older `playersData.js` fallback.
- Browser-ready site rows: 1,335.
- Source finance rows: 1,339.
- Excluded from the browser player list: 4 rows with missing or unsupported positions, because the Team Builder cannot place players without a valid GK/DEF/MID/FWD role.
- Site pick styles now include the existing simple styles plus value, VaR, CVaR, Omega-style, attack-heavy, defensive-heavy, and very risky upside styles.

Missing or caveated:

- Official prices are still missing. `financePlayersData.js` uses `proxy_price_v1` only so the value and budget workflows can be tested before official prices arrive. `proxy_price_v0` remains available for audit.
- Price-adjusted ranking should stay disabled or clearly caveated until official World Cup fantasy prices are imported.
- The richer source JSON remains the source of truth; `financePlayersData.js` is a generated browser convenience file.

## Player Value Model v0

Complete:

- `playerValueModel_v0.json` was created with one row per roster player.
- All 1,339 rows have `official_price: null` and `price_status: missing_official_price`.
- All 1,339 rows have `proxy_price_v0` for prototype value testing.
- `financePlayersData.js` originally used `proxy_price_v0` as the displayed proxy price. It now uses `proxy_price_v1`, while v0 remains available for audit.
- The site now includes Best Value Prototype, Cheap Enabler, and Premium Worth It pick styles.
- Desktop and mobile browser checks built a full Best Value Prototype Matchday 2 squad at exactly 100.0 / 100.0 units with all rule checks passing.

Current summary:

- Average proxy price: 6.02 units.
- Minimum proxy price: 4.0 units.
- Maximum proxy price: 11.5 units.
- Premium target: 163.
- Fair value: 900.
- Cheap enabler: 61.
- Avoid until price confirmed: 215.

Missing or caveated:

- Official fantasy prices are not available yet.
- Proxy price is not an official FIFA or fantasy-game price.
- Value rankings should be treated as model testing until official prices are imported and the value model is recalibrated.

## Player Value Model v1

Complete:

- `playerValueModel_v1.json` was created from `playerValueModel_v0.json`, `playerFinanceMetrics_v0.json`, `playerRecommendationInputs_v0.json`, and `playerMinutesModel_v0.json`.
- All 1,339 rows keep `official_price: null` and `price_status: missing_official_price`.
- All 1,339 rows have `proxy_price_v1` for prototype value testing.
- `financePlayersData.js` now uses `proxy_price_v1` as the active displayed proxy price.
- `proxy_price_v0` remains in the data for audit and comparison.
- The v1 model is documented in `proxyPriceModel_v1.md`.

Current summary:

- Position-ready players: 1,335.
- Average proxy price moved from 6.03 to 5.59 units.
- Minimum proxy price: 4.0 units.
- Maximum proxy price: 11.0 units.
- Reduced price count: 701.
- Unchanged price count: 620.
- Increased price count: 14.
- v1 value role counts: 905 fair value, 60 premium target, 22 cheap enabler, 352 avoid until price confirmed.

Missing or caveated:

- `proxy_price_v1` is still not an official fantasy price.
- The model is calibrated for smoother prototype squad-building, not trained against official 2026 fantasy pricing.
- Recalibrate or replace it when official prices, official positions, and final scoring rules are available.

## Matchday Player Projections v2

Complete:

- `playerMatchdayProjections_v2.json` was created from `playerFinanceMetrics_v0.json`, each player's group fixture context in `playerRecommendationInputs_v0.json`, `playerMinutesModel_v0.json`, and `scorePredictions_v2.json`.
- `matchdayRecommendations_v2.json` was created with top lists for Matchday 1, Matchday 2, Matchday 3, and Full Group Stage.
- `matchdayProjectionsData.js` was regenerated for the homepage from v2 projections.
- Source projection rows: 4,017.
- Browser projection rows: 4,005. The 12 excluded browser rows come from four players with missing or unsupported positions across three fixtures; the source file keeps them.
- The homepage now has matchday selectors in Team Advice and Team Builder.
- Matchday scoring adjusts expected return, risk-adjusted return, VaR, CVaR, volatility, tail risk, composite risk, attack-heavy score, defensive-heavy score, very-risky score, and captain score by opponent.
- Score prediction context is now attached to each player-fixture row: team expected goals, expected goals against, win/draw/loss probabilities, clean-sheet probability, attacking environment, defensive environment, captain environment, goal environment, and upset risk.
- Team Advice and Quick Picks now expose score-model fixture explanation text. Full Group Stage reasons show aggregate group xG and clean-sheet context; single-matchday reasons show exact opponent team xG, clean-sheet probability, fixture difficulty, goal environment, win chance, and upset risk.
- Player Profile is now available from player names in Quick Picks, Captain Picks, Team Advice, the Team Builder lock list, and Team Builder field/bench cards. It shows identity, role model, finance metrics, Matchday 1-3 fixture table, performance signals, recommendation labels, and data-quality notes.

## Captain Change Advisor v0

Complete:

- The homepage now includes a Quick Captain Switch Check.
- The section now includes a short user guide explaining the matchday, raw-points, replacement-candidate, and risk-style inputs.
- The user manually enters the current captain's raw points before the captain double.
- The user selects one replacement candidate from the player list and a matchday.
- The result uses the selected player's v2 matchday projection, risk-adjusted return, upside, start probability, expected minutes, fixture difficulty, PELE-forward score environment, and QA flags.
- Risk styles are available for safer, balanced, and upside switch thresholds. The switch score is compressed to a realistic raw-points scale and floor-aware so prototype upside does not dominate raw-point comparisons.
- A 12+ raw captain score is treated as an excellent current score and should generally lead to a keep result unless the user is intentionally chasing a high-risk upside move.
- `data/captainChangeAdvisorModel_v0.md` documents the model behavior and caveats.

Missing or caveated:

- The tool does not know the user's full squad.
- The tool does not know whether the replacement has already played.
- No live fantasy score is fetched or invented.
- Official 2026 fantasy captain-switch rules are still pending.

## Substitution Advisor v0

Complete:

- The homepage now includes a Quick Substitution Check.
- The section includes a short user guide explaining the matchday, played-starter points, bench-candidate, and formation-check inputs.
- The user manually enters the played starter's raw fantasy points.
- The user selects one bench candidate from the player list and a matchday.
- The result uses the selected bench player's v2 matchday projection, compressed raw-scale sub score, start probability, expected minutes, fixture difficulty, PELE-forward score environment, and QA flags.
- Risk styles are available for safer, balanced, and upside substitution thresholds.
- `data/substitutionAdvisorModel_v0.md` documents the model behavior and caveats.

Missing or caveated:

- The tool does not know the user's full squad.
- The tool does not know whether the bench candidate has already played.
- The tool flags different-position substitutions but cannot fully validate formation legality without the full lineup.
- No live fantasy score is fetched or invented.
- Official 2026 fantasy substitution rules are still pending.

## Team Export JSON v1

Complete:

- Team Builder exports now use `schema_version: team-export-v1`.
- The download filename is now `world-cup-fantasy-team-v1.json`.
- The export preserves existing readable fields: players, starting 11, bench, captain, price totals, rule checks, risk constraints, portfolio analytics, optimizer adjustment, and explanation.
- The export adds `model_metadata` for finance data, matchday projections, score predictions, and fantasy rules.
- The export adds `builder_settings` for formation, render mode, matchday, recommendation style, trust mode, advice pool, filters, risk controls, and budget.
- The export adds `squad_state` with squad IDs, starter IDs, bench IDs, captain and vice-captain references, locked players, removed players, ignored locked players, starter slots, and bench slots.
- The export now records user-selected captain, vice captain, and bench order when present, with source labels that distinguish user selections from model fallbacks.
- The export adds null-safe fields for Captain Change Advisor v0 and Substitution Advisor v0.
- The export now includes the latest saved manual captain-change or substitution quick-check result after the user runs one.
- `data/teamExportModel_v1.md` documents the payload behavior and caveats.

Missing or caveated:

- Captain, vice captain, and bench order are official only if the eventual fantasy game accepts the same choices. Current selections are local prototype user state.
- Official fantasy player IDs, official prices, official positions, final squads, and final rules are still pending.
- Decision-tool scenario fields remain null until a user runs a quick check.
- Saved decision-tool results are restored by Team Import v0 only as imported review context.

## Full Feature Test Pass v0

Complete:

- `data/fullFeatureTestReport_v0.md` records the Step 10 validation pass.
- JSON parse passed for 71 files.
- JavaScript syntax passed for 12 JS/MJS files.
- Local server returned 200 for `index.html` and `world-cup.html`.
- Desktop browser pass covered Quick Picks, Captain Picks, Team Advice, Player Profile, Match Environment, Captain Change Advisor, Substitution Advisor, Team Builder, Portfolio Analytics, Team Export JSON v1, and World Cup page.
- Mobile browser pass covered expanded homepage sections, manual decision tools, Team Builder, World Cup page, and page-level overflow checks.
- No browser console errors or warnings were captured in the final desktop or mobile passes.
- No document-level horizontal overflow was detected in the final desktop or mobile passes.

Follow-up:

- Repeat the full feature pass after official fantasy rules, official fantasy prices, final squads, or major model changes are imported.

Croatia example:

- Croatia vs England is harder for Croatia than its group average: 0.627 team xG and 18.43% clean-sheet probability.
- Croatia vs Panama and Croatia vs Ghana are favorable, with Ghana currently the best score-model fixture in this pass: 2.065 team xG and 70.47% clean-sheet probability.

Missing or caveated:

- The matchday model is a prototype built from fixture difficulty, PELE-forward team-quality proxies, and score prediction v2 match-environment outputs.
- It does not use betting odds.
- It does not yet include final lineups, injuries, official fantasy prices, or official fantasy scoring rules.

## Recommendation QA v2

Complete:

- `recommendationQa_v2.json` was generated from the browser-ready homepage data in `financePlayersData.js` and PELE-forward `matchdayProjectionsData.js`.
- `recommendationQaReport_v2.md` was created as the human-readable audit summary.
- Browser player rows audited: 1,335.
- Browser matchday projection rows audited: 4,005.
- Top-pick rows audited across styles and matchdays: 1,000.
- Unique players appearing in top-pick pools: 218.
- Players with all three matchday projections: 1,335.
- The audit checks top pools by style, matchday, position, country concentration, data confidence, roster status, recommendation readiness, role risk, downside risk, and fixture context.
- QA watchlists now identify weak-data top-pool players, high-risk top-pool players, hard-fixture top-pool players, and strongest fixture-context top-pool players.

Current findings:

- All 1,335 browser-ready players still have missing official fantasy prices, so value QA is prototype-only.
- 1,335 browser-ready players have all three matchday projections.
- The v2 audit still flags low-start, high-risk, and hard-fixture players where they surface in top pools.
- More aggressive and single-matchday styles still need visible caveats when they surface low-start players, risky players, or hard fixtures.

Missing or caveated:

- QA flags are model review warnings, not automatic exclusions.
- Very Risky is intentionally high variance and should keep some flagged players visible.
- QA should be rerun after final squads, official prices, official positions, scoring rules, injuries, and starting lineups are imported.

## Player Minutes Model v0

Complete:

- `playerMinutesModel_v0.json` was created with one row per roster player.
- All 1,339 players have `start_probability_v0`, `expected_minutes_v0`, `minutes_floor`, `substitution_risk`, `country_role`, and `role_confidence`.
- The model uses national-team qualifier usage first, then club starts/minutes, senior caps/captain signal, roster status, data confidence, and position depth inside each country.
- `financePlayersData.js` now includes the minutes fields.
- `playerMatchdayProjections_v2.json` and `matchdayProjectionsData.js` include the minutes fields and use them to adjust matchday expected return and risk.

Current role counts:

- Locked starter: 227.
- Likely starter: 209.
- Rotation: 304.
- Bench option: 375.
- Needs check: 224.

Current role-confidence counts:

- High: 691.
- Medium: 312.
- Low: 129.
- Needs check: 207.

Missing or caveated:

- This is a prototype role model, not an official lineup prediction.
- Position depth uses broad fantasy positions, not exact tactical roles.
- Final squads, injuries, tactical changes, pre-tournament friendlies, and official lineups can change the role labels.

## Score Predictions v2

Complete:

- `scorePredictions_v2.json` was created from `fixtures.json`, `matchdays.json`, `teams.json`, `teamQuality.json`, and `peleRatings_v1.json`.
- Fixture predictions: 72.
- Team-fixture predictions: 144.
- Average total expected goals: 2.45.
- Average listed-home expected goals: 1.41.
- Average listed-away expected goals: 1.05.
- Goal environment counts: 7 high, 10 medium-high, 28 medium, and 27 low.
- Upset risk counts: 28 low, 15 medium, 12 medium-high, and 17 high.
- Every fixture prediction includes expected goals, win/draw/loss probabilities, clean-sheet probabilities, over 2.5 goals probability, both-teams-to-score probability, likely scorelines, favorite, upset risk, and team-view fantasy environment scores.
- `scorePredictionModelRoadmap.md` now records Step 6.5 PELE integration and Step 6.6 PELE-forward recalibration.
- `scorePredictionsData.js` was generated from `scorePredictions_v2.json` and is loaded by the homepage Match Environment panel.
- `scorePredictionQa_v2.json` and `scorePredictionQaReport_v2.md` were added for the PELE-forward recalibration pass.
- Score Prediction QA v2 status is `pass`: 11 checks run, 11 passed, 0 failed, and 0 caveats.
- The QA pass confirms 72/72 fixture predictions, 144/144 team-fixture views, 48/48 PELE team-rating matches, and 4,017/4,017 player-matchday projections with score-prediction context.
- The QA pass checks probability bounds, win/draw/loss sums, expected-goals guardrails, favorite consistency, top-scoreline presence, Elo/FIFA/PELE input coverage, and player-matchday multiplier bounds.

Missing or caveated:

- This is a prototype model output, not an official projection.
- It uses no betting odds.
- It does not yet include final squads, injuries, suspensions, official fantasy prices, official fantasy scoring rules, recent friendlies, or player-weighted attacking and defensive strength.
- PELE values are imported only where present in the downloaded Silver Bulletin CSVs. Do not infer missing values in future updates.
- Plain Poisson treats team goal counts as independent, so low-score/draw calibration is reserved for a later calibration pass.

Upgrade timing:

- The next model upgrade should happen after final squads, official fantasy prices, official fantasy positions, official scoring rules, injuries, and updated national-team form are imported.
- A later calibration pass should happen after the PELE-backed model is stable and we can backtest or calibrate low-score behavior with Dixon-Coles-style adjustment.

## Team Import v0

Complete:

- Team Builder now imports the same `team-export-v1` JSON created by Export Team JSON.
- Import restores formation, matchday view, recommendation style, trust mode, price filters, risk controls, locked players, removed players, starter IDs, and bench IDs where the IDs still exist in the current browser dataset.
- Import restores user-selected captain, vice captain, and bench order when the saved IDs still match valid restored starters or bench players.
- Import restores saved captain-change and substitution scenarios as imported review context when the saved player IDs still exist.
- The importer restores the saved squad by exact player ID and does not rerun the optimizer.
- `data/teamImportModel_v0.md` documents the behavior and caveats.

Missing or caveated:

- Import does not infer or migrate missing player IDs.
- Import does not know official fantasy IDs, live points, played/unplayed status, transfers, or official-game legality.
- Import warns instead of guessing missing captain, vice-captain, or bench-order IDs.
- Imported saved decisions must be rerun before acting.
- Old exports may need a migration step after official fantasy players and IDs replace the current prototype IDs.

## Saved Squad Decision Mode v0

Complete:

- Captain Change Advisor and Substitution Advisor now read the current full Team Builder squad after a build or import.
- Captain Change Advisor shows saved-squad buttons for current captain and new captain.
- Substitution Advisor shows saved starter buttons and saved bench buttons.
- Saved-squad cards display the selected advisor matchday, fixture opponent, compressed decision signal, start probability, and expected minutes.
- Manual search remains available when no full Team Builder squad exists.
- `data/savedSquadDecisionMode_v0.md` documents the workflow and caveats.

Missing or caveated:

- The mode does not infer live points.
- The mode does not infer played/unplayed state.
- Filling fields from saved-squad buttons alone does not save a captain-change or substitution decision.
- Completed advisor quick checks can now be included in Team Export JSON v1 by Saved Decision Export v0.
- Different-position substitutions still require manual formation checks.

## Saved Squad Matchday Timeline v0

Complete:

- Saved Squad Timeline now reads the current full Team Builder squad after a build or import.
- Timeline selector supports MD1, MD2, and MD3.
- Saved players are grouped by fixture kickoff label from `matchdayProjectionsData.js`.
- Player cards show user captain/vice/bench-order labels when present, otherwise starter/bench status, plus opponent, fixture difficulty, balanced captain signal, balanced substitution signal, start probability, and expected minutes.
- Quick-fill buttons can send players to Captain Change Advisor or Substitution Advisor fields.
- `data/savedSquadMatchdayTimeline_v0.md` documents the workflow and caveats.

Missing or caveated:

- The timeline does not infer live score.
- The timeline does not infer played/unplayed status.
- The timeline does not know official fantasy deadlines or official same-day captain/substitution windows.
- Timeline quick-fill actions alone are not saved into Team Export JSON v1.
- Completed advisor quick checks can now be included in Team Export JSON v1 by Saved Decision Export v0.

## User Squad Selection v0

Complete:

- `data/userSquadSelection_v0.md` documents the workflow.
- Team Builder starter cards now include `C` and `VC` controls.
- Team Builder bench cards now include `B1`-`B4` controls.
- Captain and vice captain can only be restored or selected from current starters, and they cannot be the same player.
- Bench order can only be restored or selected from current bench players.
- Team Export JSON v1 records selected captain, vice captain, and bench order in `squad_state`.
- Team Import v0 restores those selections by exact current player ID and warns instead of guessing missing IDs.
- Captain Change Advisor, Substitution Advisor, and Saved Squad Timeline use the user labels as context.

Missing or caveated:

- This is local prototype user state, not an official FIFA fantasy selection.
- It does not infer live scores, played/unplayed state, official deadlines, or official-game legality.
- It depends on the current prototype player IDs staying stable until an official fantasy-ID migration exists.

## Matchday Decision Center v0

Complete:

- `data/matchdayDecisionCenter_v0.md` documents the workflow.
- The homepage now includes a Matchday Decision Center before the detailed Captain Change Advisor and Substitution Advisor.
- The center activates after a full Team Builder squad is built or imported.
- It shows saved captain, vice captain, bench order, selected matchday, and selected risk style.
- It accepts manual captain raw points.
- It accepts one played starter and that starter's manual raw points.
- It ranks captain-switch options with the existing Captain Change Advisor v0 score.
- It shows bench candidates in saved bench order with the existing Substitution Advisor v0 score.
- Fill buttons send one comparison into the detailed captain or substitution advisor.

Missing or caveated:

- The center does not infer live points.
- The center does not infer played/unplayed state.
- The center does not validate official deadlines, same-day switch windows, or formation legality.
- The center itself is not exported as a saved decision; completed detailed advisor checks are exported by Saved Decision Export v0.

## Saved Decision Export v0

Complete:

- `data/savedDecisionExport_v0.md` documents the saved decision export layer.
- Team Export JSON v1 keeps the existing `decision_tools` object.
- Captain Change Advisor exports `saved: true` after a completed quick check.
- Substitution Advisor exports `saved: true` after a completed quick check.
- Null-safe `saved: false` placeholders remain when no advisor check has been run.
- Saved decision objects include user-entered raw points, selected matchday, risk style, result, decision score, threshold, edge, compressed raw signal, player references, fixture projection snapshot, QA flags, and warnings.
- Saved decisions clear when the advisor is reset, advisor inputs become invalid, or the Team Builder squad is rebuilt, imported, reset, previewed, or manually swapped.

Missing or caveated:

- Team Import v0 restores saved decision results as imported review context only.
- The export does not infer live points, played/unplayed state, official deadlines, or official-game legality.
- Substitution formation legality is still a warning field, not a full rules engine.

## Saved Decision Import v0

Complete:

- `data/savedDecisionImport_v0.md` documents the import workflow.
- Team Import v0 now reads saved Captain Change Advisor and Substitution Advisor scenarios from `decision_tools`.
- Imported advisor scenarios restore matchday, risk style, user-entered raw points, and exact current player IDs where available.
- Imported scenarios render review-state advisor panels instead of silently becoming fresh recommendations.
- Imported saved decisions are re-exported with `imported: true`, `saved_decision_import_version: saved_decision_import_v0`, and `imported_requires_rerun: true`.
- User reruns replace imported context with fresh manual advisor results.

Missing or caveated:

- Missing player IDs are warned and not guessed from names.
- Imported decisions are not live score tracking.
- Played/unplayed status, official deadlines, and official-game legality are still manual checks.
- Substitution formation legality is still not fully validated.

## Decision Tools QA Polish v0

Complete:

- `data/decisionToolsQaPolish_v0.md` documents the UI safety layer.
- Captain Change Advisor and Substitution Advisor now show visible state badges.
- States are Manual, Saved, and Imported - rerun needed.
- Imported saved-check result panels now include a prominent rerun warning.
- Advisor heading copy now states that each tool compares one scored player against one unplayed option.
- Status badges update after valid checks, invalid inputs, resets, imports, and squad-changing actions.

Missing or caveated:

- Status badges are guidance, not official-game validation.
- Live points, played/unplayed state, official deadlines, and official-game legality remain manual checks.

## Not Ready Yet

- Official fantasy prices and player IDs have not been imported into `data/players.json`.
- Official final squads have not been imported into `data/rosters.json`.
- Official fantasy rules have not been imported into `data/fantasyRules.json`.
- FIFA rankings have not been imported into `data/teamStrength.json`.
- Fixture difficulty has not been calculated.
- `scorePredictions_v2.json` is wired into `playerMatchdayProjections_v2.json`, `matchdayProjectionsData.js`, and the homepage Match Environment panel through `scorePredictionsData.js`.
- Browser-ready files for teams, fixtures, and fixture difficulty have not been generated yet.
- ESPN and OneFootball domestic-league supplemental rows still need a merge pass before they become production `playerPerformance.json` inputs. OneFootball qualifier rows are already attached to `playerNationalTeamPerformance.json`.

## Quality Checks To Run Later

- JSON parses for every `.json` file.
- IDs are unique inside each file.
- Every player `teamId` exists in `teams.json`.
- Every roster `playerId` exists in `players.json`.
- Every fixture team exists in `teams.json`.
- Every fixture `matchdayId` exists in `matchdays.json`.
- Every difficulty row references a valid fixture and team.
- Every prediction row references a valid fixture and team or player.
- Every source ID exists in `sourceManifest.json`.
- Estimated fields are marked clearly.
- Prototype predictions do not use betting odds.

## Website Acceptance Checks Later

- `index.html` still loads without console errors.
- `world-cup.html` still loads without console errors.
- Team Builder still builds a valid squad.
- Matchday filters work after wiring.
- Fixture difficulty labels fit on mobile.
- Prediction labels say prototype or not calculated until real model outputs exist.
