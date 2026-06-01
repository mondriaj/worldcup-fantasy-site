# Recommendation QA v2

Generated: 2026-06-01T19:09:25.131Z

This report audits the browser-ready recommendation data after PELE-forward Score Prediction v2.

## Executive Summary

- Browser player rows audited: 1335.
- Browser matchday projection rows audited: 4005.
- Top-pick rows audited across styles and matchdays: 1000.
- Unique players appearing in top-pick pools: 218.
- Players with all three matchday projections: 1335.
- Hard-fixture projection rows: 927.

## Matchday Fixture Audit Sample

| Matchday | Style | Status | Top Pick | Avg Team xG | Avg Clean Sheet | Avg Upset Risk | Warnings |
| --- |--- |--- |--- |--- |--- |--- |--- |
| Full Group Stage | Best Overall | review | Lionel Messi (Argentina, Forwards) | 2.04 | 60.2% | 13.8% | low_start_probability:6 |
| Full Group Stage | Expected Return | review | Lionel Messi (Argentina, Forwards) | 2.04 | 60.2% | 13.8% | low_start_probability:6 |
| Full Group Stage | Safe Floor | review | Lionel Messi (Argentina, Forwards) | 1.95 | 55.9% | 14.8% | low_start_probability:2 |
| Full Group Stage | Upside | review | Lionel Messi (Argentina, Forwards) | 1.94 | 58.0% | 14.7% | low_start_probability:12 |
| Full Group Stage | Attack Heavy | review | Lionel Messi (Argentina, Forwards) | 2.09 | 60.8% | 14.0% | low_start_probability:4 |
| Full Group Stage | Defensive Heavy | review | Alisson (Brazil, Goalkeepers) | 2.31 | 69.2% | 8.4% | low_start_probability:8 |
| Full Group Stage | Very Risky | review | Rubén Lezcano (Paraguay, Midfielders) | 1.11 | 32.7% | 32.4% | low_start_probability:25; high_composite_risk:15 |
| Full Group Stage | Minutes Floor | review | Abdelatif Ramdane (Algeria, Goalkeepers) | 1.03 | 27.0% | 21.0% | low_start_probability:13; high_composite_risk:10 |
| Full Group Stage | Tail Risk Avoidance | review | Lionel Messi (Argentina, Forwards) | 1.99 | 57.2% | 15.3% | low_start_probability:6 |
| Full Group Stage | Captain | pass | Lionel Messi (Argentina, Forwards) | 2.09 | 60.5% | 14.0% | none |
| Matchday 1 | Best Overall | review | Lionel Messi (Argentina, Forwards) | 2.3 | 68.5% | 8.8% | low_start_probability:6 |
| Matchday 1 | Expected Return | review | Lionel Messi (Argentina, Forwards) | 2.3 | 68.5% | 8.8% | low_start_probability:6 |
| Matchday 1 | Safe Floor | review | Lionel Messi (Argentina, Forwards) | 2.33 | 64.5% | 9.6% | low_start_probability:4 |
| Matchday 1 | Upside | review | Lionel Messi (Argentina, Forwards) | 2.11 | 67.2% | 10.7% | low_start_probability:12 |
| Matchday 1 | Attack Heavy | review | Lionel Messi (Argentina, Forwards) | 2.21 | 66.7% | 10.2% | low_start_probability:6 |
| Matchday 1 | Defensive Heavy | review | Sander Tangvik (Norway, Goalkeepers) | 2.47 | 70.3% | 7.2% | low_start_probability:5 |
| Matchday 1 | Very Risky | review | Tomas Rodriguez (Panama, Forwards) | 1.11 | 34.2% | 38.3% | low_start_probability:24; high_composite_risk:20 |
| Matchday 1 | Minutes Floor | review | Lionel Messi (Argentina, Forwards) | 1.84 | 58.6% | 12.6% | hard_fixture:1 |
| Matchday 1 | Tail Risk Avoidance | review | Lionel Messi (Argentina, Forwards) | 2.24 | 66.5% | 9.1% | low_start_probability:6 |
| Matchday 1 | Captain | review | Lionel Messi (Argentina, Forwards) | 2.32 | 67.3% | 9.2% | low_start_probability:2 |

## Main Caveats

- Official World Cup fantasy prices are missing, so value and budget rankings use proxy prices only.
- Final squads, official positions, official scoring rules, injuries, and starting lineups can change recommendations.
- Score-prediction fields are prototype match-environment signals, not betting odds or official forecasts.

## Recommended Next Fixes

- Re-run QA after final squads and official fantasy positions are imported.
- Add lineup/injury status as a hard filter before the tournament starts.
- Recalibrate value metrics when official prices arrive.
