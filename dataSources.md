# Data Sources

Good data projects explain where the data came from.

This file explains which data source we plan to use for the World Cup fantasy website, and which fields are still prototype fields.

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
