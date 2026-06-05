# Team Builder Strategy Weights v1

Date: 2026-06-05

## Purpose

Team Builder Strategy Weights v1 makes the five public Team Builder strategies affect squad scoring, not only labels and report copy.

The builder still uses the same browser-side constraints:

- budget
- position counts
- country limit
- locked players
- removed or avoided players
- price filters
- country and position filters
- start probability and expected-minutes risk controls

This phase changes how legal candidate squads are ranked after those constraints are applied. It does not add official deadline, lock, booster, live-points, final-squad, or lineup claims.

## Strategy Profiles

### Balanced Squad

Balanced Squad is the default all-around profile. It rewards starter quality, bench strength, budget efficiency, moderate upside, and moderate diversification. It penalizes very weak bench spots, excessive country or fixture concentration, high dependence on only a few stars, and unnecessary third-premium pressure when playable depth is available.

### Diversified Squad

Diversified Squad puts more weight on reliable starts, expected minutes, downside floor, playable bench depth, and lower country or fixture concentration. It penalizes Country Stack Risk, Fixture Stack Risk, top-player dependence, weak bench spots, fragile minutes, and premium squeeze more than Balanced Squad.

### Concentrated Upside

Concentrated Upside puts more weight on ceiling, attacking fixture context, favorable fixtures, and controlled two- or three-player stacks in stronger attacking environments. It relaxes concentration penalties compared with Balanced Squad, but still penalizes extreme stacks, very weak bench spots, and fragile roles.

### Stars and Scrubs

Stars and Scrubs puts more weight on elite starter quality, top projected players, captain-style ceiling, premium count, and premium players who justify their price. It allows a weaker bench than Balanced Squad when the premiums are strong enough, but still penalizes unusable bench spots and expensive players who do not project as elite starters.

### Value Squad

Value Squad puts more weight on points per price, value scores, cheap playable options, budget efficiency, and bench strength. It now leans more clearly toward depth than Balanced Squad so the advanced comparison does not collapse the two strategies when enough eligible players exist. It penalizes premium squeeze and weak bench depth more strongly than Stars and Scrubs.

## Inputs Used

The strategy weights reuse existing fields already loaded by the static site:

- expected fantasy return
- risk-adjusted return
- upside points
- bad-week floor fields
- start probability
- expected minutes
- player price
- value and cheap-enabler scores
- premium-worth-it scores
- premium count and premium concentration
- captain score as a supporting starter-ceiling signal
- fixture-specific Projected xG
- match uncertainty
- clean-sheet context for defenders and keepers
- country concentration
- fixture concentration
- favorable and hard fixture counts
- bench weakness
- top-three projected share

## Implementation Notes

The optimizer still searches legal squad paths first. Strategy weights affect:

- candidate pools considered by the search
- starter ordering inside a completed squad
- bench contribution to the final score
- budget-buffer value
- portfolio adjustment for stack risk, star dependence, bench strength, upside, and budget shape
- match-context adjustment for strong team projected xG, difficult attacking spots, good or difficult clean-sheet context, high match uncertainty, and repeated exposure to the same uncertain fixture

This remains a hand-calibrated browser-side model. It is meant to make strategy choices visibly different and useful, not to prove an optimal tournament-winning squad.

## Phase 3D Match Context Note

Phase 3D keeps the optimizer structure intact and adds cleaned Match Environment context to existing strategy scoring. Balanced Squad and Diversified Squad apply more caution to high-uncertainty exposure. Concentrated Upside can accept uncertainty when team projected xG is strong. Stars and Scrubs is more cautious about expensive players in weak projected environments. Value Squad gives cheaper playable players a small boost when their projected environment is useful.

## Current Limits

- The model uses current static projections and fantasy-pool data.
- It does not know live lineups, live scores, ownership, official deadlines, or official lock state.
- Users should still confirm squad legality and timing inside the official FIFA fantasy game before acting.
