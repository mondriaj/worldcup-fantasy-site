# Fantasy Rules Sources

This file records the sources used for the Week 5 fantasy rules research.

## Primary Source

### FIFA World Cup Fantasy 2026 official launch article

URL: https://www.fifa.com/en/articles/world-cup-fantasy-game-launched

Used for:
- Confirming that an official FIFA World Cup 2026 Fantasy game exists.
- Confirming the basic squad size: 15 players.
- Confirming squad positions: 2 goalkeepers, 5 defenders, 5 midfielders, 3 forwards.
- Confirming the starting budget: $100m.
- Confirming the knockout budget increase: +$5m.
- Confirming player prices do not fluctuate.
- Confirming group-stage country limit starts at 3 players per nation.
- Confirming captain switches and bench substitutions are part of the game.
- Confirming booster names: Wildcard, 12th Man, Maximum Captain, Qualification Booster, Mystery Booster.
- Confirming broad scoring categories.

Notes:
- This is the most important source for the draft rules engine.
- It gives strong high-level rules, but not every detailed edge case.

## Supporting Sources

### FIFA Club World Cup Fantasy official launch article

URL: https://www.fifa.com/en/articles/fantasy-game-launched

Used for:
- Comparing FIFA fantasy structure across tournament games.
- Checking that the 15-player squad, $100m budget, team limits, substitutions, captain switches, boosters, and broad scoring categories match a recent FIFA fantasy format.
- Helping decide which rules should be configurable in the engine.

Notes:
- This is not a World Cup 2026 source.
- It should only be used as a supporting reference when the 2026 source is not detailed enough.

### Fantasy Football Hub 2026 rules guide

URL: https://www.fantasyfootballhub.co.uk/fifa-world-cup-fantasy-2026-how-to-play-guide

Used for:
- Understanding likely point values by position.
- Checking transfer limits by round.
- Checking valid formations.
- Checking booster behavior in plain language.
- Cross-checking details that are not fully listed in the FIFA launch summary.

Notes:
- This is a third-party guide, not an official FIFA source.
- It is useful for draft planning, but official FIFA rules should win if there is a conflict.

### Ingenuity Fantasy Football 2026 rules explainer

URL: https://ingenuityfantasy.com/feature-articles/fifa-world-cup-fantasy-2026-rules-explained-complete-beginners-guide-scoring-transfers-boosters/

Used for:
- Cross-checking squad setup, budget, country limits, valid formations, transfers, and boosters.
- Understanding beginner-facing explanations of the game.
- Helping decide which rules should be displayed simply on the website.

Notes:
- This is a third-party guide, not an official FIFA source.
- Use it as a cross-check only.

## Sources Not Used As Primary Rules

### UEFA EURO 2024 Fantasy

Used for:
- General comparison only if needed later.

Notes:
- Not used as the main Week 5 rules source because FIFA World Cup 2026 fantasy information is now available.

### Fantasy Premier League

Used for:
- General comparison only if needed later.

Notes:
- FPL is a season-long club fantasy game, so it should not drive World Cup tournament rules.

## Week 5 Rule Source Decision

For the Week 5 draft rules engine:
- Use FIFA World Cup 2026 as the primary source.
- Keep detailed scoring, transfers, booster behavior, and formation rules configurable.
- Do not treat third-party guides as final if they conflict with FIFA.
- Do not invent rules that are not supported by a source.
