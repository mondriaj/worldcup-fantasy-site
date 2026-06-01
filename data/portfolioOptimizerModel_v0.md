# Portfolio Optimizer Model v0

Generated for Week 6 data sprint.

## Purpose

Portfolio Optimizer v0 makes Squad Portfolio Analytics influence the Team Builder search.

Before this step, the optimizer built a squad first and the portfolio panel explained it afterward. Now completed candidate squads receive a small portfolio adjustment before the optimizer chooses the final squad.

## Design Rule

This is a nudge, not a rewrite.

The main optimizer still cares about:

- selected pick style
- recommendation mode
- formation
- budget
- position limits
- country limit
- locked players
- removed players
- risk controls

Portfolio Optimizer v0 only adjusts the final rank of completed candidate squads.

## Signals Used

The adjustment uses:

- starting XI expected points
- starting XI risk-adjusted points
- starting XI upside points
- VaR 10% floor
- CVaR worst-20% floor
- average start probability
- starting XI expected minutes
- starting XI volatility
- average tail risk
- average composite risk
- QA review and QA watch counts
- weak bench count
- premium squeeze
- top-country concentration
- hard-fixture concentration
- favorable-fixture count

## Mode Behavior

### Safer Picks

Safer Picks gives more weight to:

- risk-adjusted points
- VaR and CVaR floor
- start probability
- expected minutes
- lower QA load
- lower bench fragility
- lower tail risk

### Balanced

Balanced uses moderate weights across return, floor, QA load, bench quality, and fixture concentration.

### High Upside

High Upside gives more room to:

- expected return
- upside points
- favorable attacking fixture context

It still applies smaller penalties for weak benches, QA load, and fixture concentration.

### Punts

Punts stays permissive. It rewards upside and even tolerates volatility, while keeping only light penalties for obvious concentration and bench problems.

## Export Fields

Team JSON export now includes:

- `portfolio_analytics`
- `portfolio_optimizer`

`portfolio_optimizer` includes:

- enabled status
- model version
- recommendation mode
- pick style key
- adjustment score
- the portfolio inputs used for the adjustment

## Current Limits

- The adjustment is hand-calibrated and not backtested.
- VaR and CVaR are prototype fantasy estimates.
- Official fantasy prices, final rosters, injuries, ownership, and lineups are still missing.
- The model should stay small until official fantasy prices and final rules are imported.
