# EURO-Style Scoring Guide

This project now uses the UEFA EURO 2024 fantasy rules as the main idea for player performance measures.

Official rules source:
- https://www.uefa.com/uefaeuro/history/news/0268-121c6d842f48-45f4db182115-1000--euro-2024-fantasy-football-rules/

## What We Are Doing

We are **not** recreating official tournament points exactly.

Instead, we are building a simple **EURO-style estimate** using the real player stats already stored in `players.json`.

This gives the team builder a more meaningful fantasy measure than raw stats alone.

## Small-Sample Correction

Some players can look amazing in raw stats after a very small sample.

Example:
- a player appears for 5 minutes
- scores one goal
- their raw per-90 number looks unrealistically high

To reduce this problem, we use a simple **shrinkage** method:

- each player keeps their own raw score
- but if they have only a small number of full-match equivalents (`90s`)
- we pull part of their estimate back toward the average for their position

Fields used for this:
- `euro_style_confidence_weight`
- `euro_style_sample_confidence_score`
- `euro_style_shrunk_points_per90_estimate`
- `euro_style_shrunk_points_per_appearance_estimate`

This works like a beginner-friendly Bayesian adjustment or regression-to-the-mean step.

## Main EURO Rules We Use

- Appearance: `+1`
- 60+ minutes: `+1`
- Assist: `+3`
- Every 3 balls recovered: `+1`
- Yellow card: `-1`
- Red card: `-3`
- Own goal: `-2`
- Penalty missed: `-2`

Position scoring:
- Goalkeeper goal: `+6`
- Defender goal: `+6`
- Midfielder goal: `+5`
- Forward goal: `+4`
- Goalkeeper clean sheet: `+4`
- Defender clean sheet: `+4`
- Midfielder clean sheet: `+1`
- Every 3 goalkeeper saves: `+1`
- Penalty save: `+5`
- Every 2 goals conceded by a goalkeeper or defender: `-1`

## Fields Added To players.json

- `euro_style_appearance_points_estimate`
- `euro_style_sixty_minute_points_estimate`
- `euro_style_attack_points_estimate`
- `euro_style_clean_sheet_points_estimate`
- `euro_style_recovery_points_estimate`
- `euro_style_goalkeeper_save_points_estimate`
- `euro_style_penalty_save_points_estimate`
- `euro_style_concede_penalty_estimate`
- `euro_style_discipline_penalty_estimate`
- `euro_style_total_points_estimate`
- `euro_style_points_per90_estimate`
- `euro_style_points_per_appearance_estimate`
- `euro_style_position_baseline_points_per90`
- `euro_style_confidence_weight`
- `euro_style_sample_confidence_score`
- `euro_style_shrunk_points_per90_estimate`
- `euro_style_shrunk_points_per_appearance_estimate`
- `euro_style_reliability_score`
- `euro_style_overall_score`
- `euro_style_scoring_note`
- `euro_style_short_reason`

## Risk Fields Added To players.json

- `risk_event_points_stddev`
- `risk_downside_deviation`
- `risk_bad_week_rate`
- `risk_value_at_risk_10`
- `risk_conditional_value_at_risk_20`
- `risk_availability_score`
- `risk_minutes_score`
- `risk_discipline_score`
- `risk_volatility_score`
- `risk_tail_score`
- `risk_composite_score`
- `risk_adjusted_sharpe_raw`
- `risk_adjusted_sortino_raw`
- `risk_adjusted_sharpe_like`
- `risk_adjusted_sortino_like`
- `risk_adjusted_expected_points_estimate`
- `risk_adjusted_overall_score`

## What The Risk Fields Mean

### Statistical risk

- `risk_event_points_stddev`
  - week-to-week volatility in actual fantasy points
- `risk_downside_deviation`
  - downside-only movement below a simple target; this is not directly comparable to standard deviation because good weeks count as zero downside
- `risk_value_at_risk_10`
  - rough 10th percentile bad-week estimate
- `risk_conditional_value_at_risk_20`
  - average of the worst 20% of weeks
- `risk_bad_week_rate`
  - share of weeks with 1 point or fewer

### Practical fantasy risk

- `risk_availability_score`
  - 0 to 100 index from status penalty, chance of playing, and missed-game share
- `risk_minutes_score`
  - benching, sub appearance, or low-minute risk
- `risk_discipline_score`
  - yellow/red card risk only; missed penalties are not included, and penalties committed are not available in the current source data
- `risk_volatility_score`
  - overall week-to-week instability
- `risk_tail_score`
  - weighted bad left-tail risk: bad-week rate is weighted most heavily, then Value at Risk and Conditional Value at Risk shortfalls
- `risk_composite_score`
  - combined risk score from the separate components

## Finance-Style Interpretation

These fields are inspired by finance ideas:

- `risk_adjusted_sharpe_like`
  - 0 to 100 percentile index based on the raw Sharpe-style ratio
- `risk_adjusted_sortino_like`
  - 0 to 100 percentile index based on the raw Sortino-style ratio
- `risk_adjusted_sharpe_raw`
  - raw ratio: expected points above a simple baseline divided by weekly volatility
- `risk_adjusted_sortino_raw`
  - raw ratio: expected points above a simple baseline divided by downside deviation
- `risk_adjusted_expected_points_estimate`
  - expected value after a simple risk penalty
- `risk_adjusted_overall_score`
  - a compact score combining expected value, confidence, and risk

## Important Limits

Some official EURO rules are **not included yet** because the needed data is not in our source files.

Currently missing:
- Player of the Match
- Winning a penalty
- Conceding a penalty
- Goals from outside the box

Also:
- `60+ minutes` is estimated from starts and total minutes
- these are season-based estimates, not actual matchday tournament scores
- the statistical risk fields use FPL gameweek history as the real performance series
- the EURO-style expected fields use EURO-inspired rules applied to available season stats

## How To Refresh Scores

Run:

```bash
cd /Users/jordimondria/Dropbox/worldcup_ai_project_pack_docx/worldcup-project-jordi/project
node addEuroScoring.js
```

This recalculates the EURO-style score fields inside `players.json`.
