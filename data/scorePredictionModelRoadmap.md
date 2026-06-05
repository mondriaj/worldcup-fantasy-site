# Score Prediction Model Roadmap

Status: active score model notes

## Current Public Model

Match Environment is PELE-anchored and fantasy-facing. It shows fixture-specific Projected xG, Win / Draw / Win, Most Likely Score, Match Uncertainty, and Clean-Sheet Context.

Projected xG means expected goals for the listed team in that exact matchup. It is not a generic team average or a PELE rating label. Total goals range stays as supporting context, and broad attacking labels stay out of the main public table so the meaning of Projected xG stays clear.

The public score context also supports:

- short player-card fixture notes when the context is useful
- compact Player Profile fixture context
- Team Builder squad metrics such as Fixture Stack Risk, Bad-Week Floor, Upside Ceiling, and Bench Strength

## What The Model Uses

- World Cup group-stage fixtures
- PELE team-quality signals from Silver Bulletin
- FIFA ranking and World Football Elo as secondary team-strength inputs
- Host context where it applies
- Team attack and defense proxies
- Fixture-level probability grids for scorelines, clean sheets, and match outcomes

## What The Model Produces

- Expected goals for each team
- Win, draw, and loss probabilities
- Clean-sheet probability for each team
- Most likely scorelines
- Goal environment
- Match uncertainty
- Defender and keeper context
- Supporting context for fantasy player explanations

## What The Model Does Not Claim

- It does not know official lineups.
- It does not know injuries or suspensions.
- It does not confirm final squads.
- It does not know live scores, deadlines, locks, or official fantasy-game legality.
- It does not guarantee exact scores.

## Current Explanation Rules

- Player cards use at most one short fixture note.
- Attackers mention team projected xG only when it helps explain the pick.
- Defenders and keepers mention clean-sheet context only when it helps.
- Match uncertainty appears only when it clarifies the risk or opportunity.
- Player Profile keeps compact fixture labels: Team projected xG, Opponent projected xG, Win / Draw / Win, Most likely score, Clean-sheet context, and Match uncertainty.

The main public fields do not present Upset Risk, xG Base, Goal Range, or Attacker Context as headline stats.

## Future Upgrade Path

Useful future upgrades include:

- roster-weighted team strength once final squads and expected roles are source-backed
- better injury and availability inputs when source-backed
- recent-form inputs after they are audited
- backtesting and calibration for low-score and draw behavior
- stronger player-level links between team projected xG, start probability, role confidence, and fantasy scoring

Until those upgrades are source-backed, the current score model should stay transparent and conservative in public wording.
