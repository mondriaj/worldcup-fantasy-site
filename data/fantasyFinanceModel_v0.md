# Fantasy Finance Model v0

This file explains the first finance-style fantasy model.

Status: prototype.  
Output file: `playerFinanceMetrics_v0.json`.  
Input file: `playerRecommendationInputs_v0.json`.

## Core Idea

Treat a fantasy player like an asset.

- Expected return = prototype expected fantasy points per match.
- Volatility = uncertainty around that expected return.
- Downside risk = bad-match and low-floor risk.
- Tail risk = chance of a very poor fantasy return.
- Risk-adjusted return = expected return after risk penalty.

Official World Cup fantasy prices are not imported yet, so price-adjusted return is intentionally `null`.

## Metrics

- `expected_return_points` - prototype expected fantasy points per match.
- `volatility_points` - model-estimated points volatility.
- `downside_deviation_points` - downside-only volatility below a 2-point target.
- `value_at_risk_10_points` - parametric 10th percentile expected outcome.
- `conditional_value_at_risk_20_points` - average-style estimate for the bad left tail.
- `upside_p90_points` - parametric high-upside outcome.
- `bad_week_probability` - probability proxy for scoring 2 points or fewer.
- `tail_risk_score` - 0-100 bad-left-tail score.
- `composite_risk_score` - 0-100 blended risk score.
- `sharpe_like_raw` - return above a 2-point target divided by volatility.
- `sortino_like_raw` - return above a 2-point target divided by downside deviation.
- `omega_like_raw` - upside over downside proxy.
- `risk_adjusted_return_points` - expected return after composite-risk penalty.
- `certainty_equivalent_return_points` - expected return less volatility and drawdown penalties.

## Strategy Scores

- `risk_adjusted` - best risk/reward balance.
- `safe_floor` - reliable, lower tail-risk options.
- `upside` - high-ceiling options.
- `attack_heavy` - forwards/mids/attack-producing players.
- `defensive_heavy` - goalkeepers/defenders/clean-sheet and save profiles.
- `very_risky` - high-variance upside picks.
- `minutes_floor` - players with stronger expected playing time.
- `tail_risk_avoidance` - players least exposed to bad-week outcomes.

## Risk Profiles

- `defensive_floor` - lower risk and lower tail exposure.
- `balanced` - middle risk/reward profile.
- `volatile` - higher composite risk.
- `boom_bust` - high variance and high upside.
- `low_floor` - weak downside profile.
- `data_gap` - insufficient data.
- `review_risk` - needs roster, source, or identity review.

## Caveats

- This is not official FIFA fantasy scoring.
- VaR and CVaR are modeled from aggregate player data, not observed World Cup fantasy match returns.
- Prices are missing, so value-over-price metrics are not calculated yet.
- Final squads and official fantasy prices can change tiers and risk labels.
