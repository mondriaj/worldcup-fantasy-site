# Squad Portfolio Analytics v0

Generated for Week 6 data sprint.

## Purpose

Squad Portfolio Analytics v0 explains a built fantasy squad as a portfolio.

The Team Builder already checks whether a squad is legal. This layer checks whether the squad has a useful risk and return profile.

The same metrics now feed Portfolio Optimizer v0 as a small squad-selection adjustment.

## Metrics Shown

- **XI Expected**: sum of expected fantasy return for the starting 11.
- **XI Risk-Adjusted**: sum of risk-adjusted expected fantasy return for the starting 11.
- **Avg Start**: average start probability for the starting 11.
- **Expected Minutes**: total expected minutes for the starting 11.
- **Volatility**: portfolio-style starting XI volatility. It uses square-root-of-sum-squares as a simple independence proxy.
- **VaR 10%**: summed 10th percentile downside floor for the starting 11.
- **CVaR Worst 20%**: summed average of the worst 20% modeled outcomes for the starting 11.
- **Tail Risk**: average squad tail-risk score.
- **QA Review**: number of squad players carrying QA review status, plus watch count.
- **Premium Squeeze**: number of premium proxy-price players and weak bench players.

## Concentration Checks

The panel also checks:

- country concentration against the group-stage country limit
- hard-fixture concentration by matchday
- favorable-fixture count by matchday
- bench fragility from low start probability, low expected minutes, or QA review status
- premium squeeze, where expensive stars force weak bench fillers
- high average tail risk

## Important Limits

- Official World Cup fantasy prices are still pending, so price concentration uses proxy_price_v1 while proxy_price_v0 remains available for audit.
- Current VaR and CVaR are prototype finance-model estimates, not backtested World Cup fantasy outcomes.
- Fixture concentration uses score-prediction and fixture-difficulty v0 outputs.
- Warnings are decision aids, not automatic exclusions.

## Future Upgrades

Upgrade to v1 after official fantasy prices and final rosters are imported.

Upgrade to v2 after ownership, captaincy, predicted lineups, injuries, and real fantasy scoring data are available.
