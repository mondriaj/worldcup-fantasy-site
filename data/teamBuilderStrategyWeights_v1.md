# Team Builder Strategy Weights

Date: 2026-06-05

## Purpose

Team Builder strategies make the five public squad styles behave differently after the builder has found legal candidate squads.

The builder still respects the same constraints:

- budget
- position counts
- country limit
- locked players
- removed or avoided players
- price filters
- country and position filters
- start probability and expected-minutes safety controls

The strategies change how legal squads are ranked. They do not add official deadline, lock, booster, live-points, final-squad, injury, or lineup claims.

## Strategy Profiles

### Balanced Squad

What it tries to build: a strong all-around 15-player squad.

How it chooses players: balances starter quality, reliable minutes, playable bench depth, budget efficiency, moderate upside, and moderate diversification.

Main tradeoff: it may pass on a sharper stack or extra premium if that weakens the bench or concentrates too much risk.

Best for users who want: the default squad plan with no single extreme.

### Diversified Squad

What it tries to build: a squad that spreads risk across countries, fixtures, and star players.

How it chooses players: rewards reliable starts, bench strength, lower country concentration, lower fixture concentration, and downside protection.

Main tradeoff: it can give up some explosive upside from stacking one strong match environment.

Best for users who want: steadier portfolio protection.

### Concentrated Upside

What it tries to build: a higher-ceiling squad built around strong attacking spots.

How it chooses players: rewards ceiling, favorable attacking fixtures, and controlled player stacks while checking roles and minutes.

Main tradeoff: it can be more fragile if the stacked fixture misses.

Best for users who want: to chase upside with some guardrails.

### Stars and Scrubs

What it tries to build: a top-heavy squad that spends on elite starters and fills the bench cheaply.

How it chooses players: rewards premium players who justify price through projection, role, and ceiling while keeping minimum bench playability.

Main tradeoff: the bench can be weaker and more budget-sensitive.

Best for users who want: elite starter firepower with a thinner bench.

### Value Squad

What it tries to build: a deeper squad that squeezes more usable points from the budget.

How it chooses players: rewards points per price, playable cheaper options, budget efficiency, and bench depth.

Main tradeoff: it may skip some premium ceiling if the price hurts squad depth.

Best for users who want: efficient spend and stronger substitutes.

## Inputs Used

The strategies reuse existing player and squad context:

- expected fantasy return
- risk-adjusted return
- upside points
- bad-week floor
- start probability
- expected minutes
- player price
- value and budget-enabler signals
- premium-value signals
- premium count and premium concentration
- starter-ceiling signals
- fixture-specific Projected xG
- match uncertainty
- clean-sheet context for defenders and keepers
- country concentration
- fixture concentration
- favorable and difficult fixture counts
- bench weakness
- top-player projected share

## Match Context

Match Environment context supports existing strategy behavior. Balanced Squad and Diversified Squad are more cautious about repeated high-uncertainty exposure. Concentrated Upside can accept uncertainty when team projected xG is strong. Stars and Scrubs is more cautious about expensive players in weak projected environments. Value Squad gives cheaper playable players a small lift when their projected environment is useful.

## Current Limits

- The model uses current static projections and fantasy-pool data.
- It does not know live lineups, live scores, ownership, official deadlines, or official lock state.
- Users should still confirm squad legality and timing inside the official FIFA fantasy game before acting.
