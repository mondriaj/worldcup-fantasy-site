# Data Sources

Good data projects explain where the data came from.

This file explains which data source we plan to use for the World Cup fantasy website, and which fields are still prototype fields.

## Week 6 Team Data

The new Week 6 team file is:

- `data/teams.json`

It now contains all 48 FIFA World Cup 2026 teams with groups, qualification status, FIFA ranking data, World Football Elo ratings, PELE ratings, and group-level prediction input fields.

Sources used:

- FIFA World Cup 2026 schedule and groups pages for team/group truth.
- The existing FIFA API-derived `worldCupData.js` fixture snapshot for all 72 group-stage fixtures.
- FIFA ranking API on `inside.fifa.com` for official FIFA ranking and ranking points.
- OpenFootball 2026 `worldcup.json` for fixture/team cross-checking, matchday labels, and local UTC offsets.
- `data/matchdays.json` groups the 72 group fixtures into prototype fantasy Matchday 1, Matchday 2, Matchday 3, and Full Group Stage buckets.
- World Football Elo at `eloratings.net` for `team_elo`.
- Fjelstul's World Cup database for historical World Cup appearances, match record, goals, clean sheets, knockout experience, titles, best performance, and recent performance.
- PELE International Football Rankings from Silver Bulletin/Nate Silver, using the article's downloadable Datawrapper CSVs for rating, rank, Tilt, and round-robin offense/defense fields.
- `team_quality_v2` is the active PELE-forward team-quality model. It gives PELE the dominant current-strength role while retaining current FIFA ranking points, World Football Elo, historical World Cup performance, knockout experience, and host status. The first PELE blend is preserved in `data/teamQuality_v1.json`; the pre-PELE model is preserved in `data/teamQuality_v0.json`.

Detailed Week 6 source notes are in `data/dataSources.md`.

## Official Data Readiness

Official Data Readiness v0 now tracks the blockers before the project can replace proxy/preliminary data with official fantasy data.

Files:

- `data/officialDataReadiness_v0.json`
- `data/officialFantasyImportSchema_v0.json`
- `data/officialDataReadiness_v0.md`

Current status:

- Final official squads are not imported as final roster status.
- Official fantasy player IDs are not imported.
- Official fantasy positions are not imported.
- Official fantasy prices are not imported.
- Official scoring, deadline, captain, substitution, transfer, and booster rules are not imported.

Validation command:

```bash
node scripts/validateOfficialDataReadiness.mjs
```

## Recommendation UI Models

The live homepage uses browser-ready generated files instead of fetching source JSON at runtime:

- `financePlayersData.js`
- `matchdayProjectionsData.js`
- `scorePredictionsData.js`

Captain Change Advisor v0 is a manual Quick Captain Switch Check. It uses the PELE-forward matchday projection files plus the user's manually entered current captain raw points. It does not invent live fantasy scores, full-squad membership, or played/unplayed status.

Substitution Advisor v0 is a manual Quick Substitution Check. It uses the same browser-ready files plus the user's manually entered starter score. It checks one played starter against one unplayed bench candidate and flags different-position substitutions for manual formation review.

Team Export JSON v1 records the current Team Builder state, active model versions, squad structure, portfolio analytics, locked/removed player context, and null-safe placeholders for future Captain Change and Substitution saved scenarios.

## Week 6 Player Roster Data

The new Week 6 player roster file is:

- `data/players.json`

It now contains 1,339 World Cup 2026 roster/player rows across all 48 teams.

Sources used:

- FIFA official World Cup 2026 squad announcement hub and linked squad articles for roster names, positions, and roster status where complete enough to parse.
- World Cup 2026 Stats squad tracker for current club, age, caps, goals, captain flag, and fallback roster rows where FIFA coverage was incomplete.
- NBC Sports 2026 World Cup squads tracker as a club and roster cross-check for published final squads.
- FIFAWorldCupNews Ecuador preliminary squad article as an Ecuador-only fallback until an official Ecuador/FIFA final source is available.

Important notes:

- `league` is now filled for 451 source-backed Big 5 club matches and remains `null` for 888 players outside that matched set.
- Every player now has a `national_team_profile` object. UEFA players have qualifier stats where safely matched; other confederations still need a later qualifier import.
- Australia is only a partial train-on import and is marked `needs_check`.
- FIFA's final published squad list should be checked after June 2, 2026 before using these rows for production fantasy recommendations.

## Week 6 Player Performance Data

The new Week 6 performance file is:

- `data/playerPerformance.json`
- `data/playerNationalTeamPerformance.json`
- `data/statbunkerBig5Fantasy.json`

It now contains 442 matched Big 5 league performance rows for World Cup roster players, one national-team profile per roster player, and 2,488 imported StatBunker fantasy-style source rows.

Sources used:

- Local FPL-Core-Insights 2025-2026 Premier League GW34 snapshot for minutes, starts, goals, assists, clean sheets, cards, saves, expected stats, fantasy fields, availability, set pieces, defensive contribution, and match-log aggregates.
- Local `source-nationalities.csv` FBref-style Premier League export for appearances, minutes, starts, goals, assists, cards, and per-90 rates.
- Understat Big 5 2025 season endpoints for appearances, minutes, goals, assists, xG, xA, shots, key passes, and cards across Premier League, La Liga, Bundesliga, Serie A, and Ligue 1.
- UEFA European Qualifiers 2026 player statistics for UEFA national-team appearances, minutes, goals, assists, attempts, cards, distance, and top speed.
- StatBunker fantasy-style league tables for current-season Premier League, La Liga, Serie A, and partial Ligue 1 starts, clean sheets, fantasy-style points, sub usage, goals conceded, penalties, and own goals.

Important notes:

- Numeric performance stats are only imported where a safe name-and-club match was found.
- Starts and clean sheets remain `null` for Understat-only rows because that endpoint does not expose them, but StatBunker now fills these fields for matched current-season rows.
- Bundesliga StatBunker data is previous-season 2024-2025 context only because a 2025-2026 Bundesliga fantasy table was not found in this scan.
- Ligue 1 StatBunker current-season coverage is partial in this pass.
- UEFA qualifier starts remain `null`; the starting signal is a minutes-per-appearance proxy, not an official lineup count.
- Non-UEFA qualifier player stats are still pending.

## Main GitHub Source

For the first real player database, the best source is:

- FPL-Core-Insights
- GitHub link: https://github.com/olbauday/FPL-Core-Insights

We chose this source because it already includes player-level data, team data, positions, and fantasy-style fields such as price and points.

## Added Local Source File

We also used this local file:

- `source-nationalities.csv`

This file was added to the project folder to help fill in:
- national team / country
- extra player stats that may help with fantasy decisions

Important note:
- This CSV is a separate source from FPL-Core-Insights
- It was used to enrich `players.json`
- It is not the original source for player names, clubs, or prices

## Scoring Rules Source

We also use the official UEFA EURO 2024 fantasy rules as the model for performance measures:

- UEFA EURO 2024 fantasy rules
- Link: https://www.uefa.com/uefaeuro/history/news/0268-121c6d842f48-45f4db182115-1000--euro-2024-fantasy-football-rules/

This source is used for:
- score ideas
- point weights
- fantasy-style performance measures

Important note:
- The EURO rules are used as a scoring model
- they are not the source of the raw player stats
- our EURO-style score fields are still estimates built from our available data

## What This Source Is Used For

### Player names

Source:
- FPL-Core-Insights
- File type described in the repo: `players.csv`

Used for:
- `first_name`
- `second_name`
- `web_name`

Notes:
- These are real player names from the source.

### Clubs

Source:
- FPL-Core-Insights
- Files described in the repo: `players.csv` and `teams.csv`

Used for:
- team or club link for each player
- team code

Notes:
- This source uses club teams, not World Cup national teams.
- If we later switch to a true World Cup source, this section should be updated.

### Positions

Source:
- FPL-Core-Insights
- File described in the repo: `players.csv`

Used for:
- `position`

Notes:
- The repo documentation says positions include:
  - `GKP`
  - `DEF`
  - `MID`
  - `FWD`

### Prices

Source:
- FPL-Core-Insights
- File described in the repo: `playerstats.csv`

Used for:
- `now_cost`, if we include price in our website data

Notes:
- This is fantasy-style price data.
- It is available in the source.

### Country or team strength

Current status:
- `country` was added from `source-nationalities.csv` by matching player names and clubs.
- FPL-Core-Insights does not include national team or country fields.

Possible source:
- FPL-Core-Insights includes team-level data and Elo-style strength context in its documentation.
- GitHub link: https://github.com/olbauday/FPL-Core-Insights

Important note:
- This is not the same as World Cup national team strength.
- If we add country strength later, we should document the exact source separately.
- A separate manual mapping step is still available in `countryMappings.json` if a player ever needs to be corrected.

### Extra stats from the added CSV

Source:
- `source-nationalities.csv`

Used for:
- `country`
- `fbref_nation_code`
- `fbref_position_detail`
- `fbref_age`
- `fbref_birth_year`
- `fbref_appearances`
- `fbref_starts`
- `fbref_minutes`
- `fbref_nineties`
- `fbref_goals`
- `fbref_assists`
- `fbref_goal_contributions`
- `fbref_non_penalty_goals`
- `fbref_penalties_scored`
- `fbref_penalties_attempted`
- `fbref_yellow_cards`
- `fbref_red_cards`
- `fbref_goals_per90`
- `fbref_assists_per90`
- `fbref_goal_contributions_per90`
- `fbref_non_penalty_goals_per90`
- `fbref_goal_plus_assist_minus_penalties_per90`

Notes:
- These fields came from the added CSV source, not from FPL-Core-Insights.
- They are useful for fantasy decisions because they add more context about scoring, assists, discipline, and playing time.

## Prototype Fields

These fields should be treated as prototype estimates unless they come directly from a real source:

- `attack_score`
- `defense_score`
- `risk_score`
- `short_reason`

Notes:
- These are helpful for building and testing the website.
- But they are not confirmed real-source fields right now.
- If we calculate them ourselves, we should label them as estimated fields.

## Simple Rule For This Project

Real-source fields:
- player names
- club or team link
- position
- price, if we use it from the source

Prototype or estimated fields:
- attack score
- defense score
- risk score
- short reason

This helps us stay honest about what is real data and what is a prototype for learning.
