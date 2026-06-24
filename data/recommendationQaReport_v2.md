# Recommendation QA v2

Generated: 2026-06-24T11:26:56.651Z

This report audits the browser-ready recommendation data after PELE-forward Score Prediction v2.

## Executive Summary

- Browser player rows audited: 1335.
- Browser matchday projection rows audited: 4005.
- Top-pick rows audited across styles and matchdays: 1000.
- Unique players appearing in top-pick pools: 218.
- Players with all three matchday projections: 1335.
- Hard-fixture projection rows: 981.

## Matchday Fixture Audit Sample

| Matchday | Style | Status | Top Pick | Avg Team xG | Avg Clean Sheet | Avg Upset Risk | Warnings |
| --- |--- |--- |--- |--- |--- |--- |--- |
| Full Group Stage | Best Overall | review | Lionel Messi (Argentina, Forwards) | 2.09 | 57.9% | 14.3% | low_start_probability:5 |
| Full Group Stage | Expected Return | review | Lionel Messi (Argentina, Forwards) | 2.09 | 57.9% | 14.3% | low_start_probability:5 |
| Full Group Stage | Safe Floor | review | Lionel Messi (Argentina, Forwards) | 2.08 | 55.7% | 14.5% | low_start_probability:3 |
| Full Group Stage | Upside | review | Lionel Messi (Argentina, Forwards) | 2.02 | 56.8% | 14.3% | low_start_probability:13 |
| Full Group Stage | Attack Heavy | review | Lionel Messi (Argentina, Forwards) | 2.13 | 58.4% | 13.8% | low_start_probability:4 |
| Full Group Stage | Defensive Heavy | review | Nicolas Otamendi (Argentina, Defenders) | 2.49 | 67.5% | 7.7% | low_start_probability:8 |
| Full Group Stage | Very Risky | review | Rubén Lezcano (Paraguay, Midfielders) | 1.18 | 29.3% | 34.4% | low_start_probability:25; high_composite_risk:15 |
| Full Group Stage | Minutes Floor | review | Abdelatif Ramdane (Algeria, Goalkeepers) | 1.08 | 27.0% | 20.0% | low_start_probability:13; high_composite_risk:10 |
| Full Group Stage | Tail Risk Avoidance | review | Lionel Messi (Argentina, Forwards) | 2.03 | 55.5% | 15.5% | low_start_probability:7 |
| Full Group Stage | Captain | review | Lionel Messi (Argentina, Forwards) | 2.19 | 59.3% | 13.8% | low_start_probability:1 |
| Matchday 1 | Best Overall | review | Lionel Messi (Argentina, Forwards) | 2.34 | 67.7% | 8.8% | low_start_probability:7 |
| Matchday 1 | Expected Return | review | Lionel Messi (Argentina, Forwards) | 2.34 | 67.7% | 8.8% | low_start_probability:7 |
| Matchday 1 | Safe Floor | review | Lionel Messi (Argentina, Forwards) | 2.45 | 64.8% | 9.2% | low_start_probability:3 |
| Matchday 1 | Upside | review | Lionel Messi (Argentina, Forwards) | 2.2 | 66.6% | 10.2% | low_start_probability:14 |
| Matchday 1 | Attack Heavy | review | Lionel Messi (Argentina, Forwards) | 2.32 | 67.8% | 8.7% | low_start_probability:6 |
| Matchday 1 | Defensive Heavy | review | Sander Tangvik (Norway, Goalkeepers) | 2.64 | 70.5% | 6.1% | low_start_probability:4 |
| Matchday 1 | Very Risky | review | Tomas Rodriguez (Panama, Forwards) | 1.11 | 28.7% | 37.0% | low_start_probability:24; high_composite_risk:21 |
| Matchday 1 | Minutes Floor | review | Lionel Messi (Argentina, Forwards) | 1.96 | 59.1% | 11.3% | hard_fixture:2 |
| Matchday 1 | Tail Risk Avoidance | review | Lionel Messi (Argentina, Forwards) | 2.3 | 65.8% | 9.2% | low_start_probability:7 |
| Matchday 1 | Captain | review | Lionel Messi (Argentina, Forwards) | 2.4 | 67.6% | 8.4% | low_start_probability:2 |

## Main Caveats

- Official World Cup fantasy prices are missing, so value and budget rankings use proxy prices only.
- Final squads, official positions, official scoring rules, injuries, and starting lineups can change recommendations.
- Score-prediction fields are prototype match-environment signals, not betting odds or official forecasts.

## Recommended Next Fixes

- Re-run QA after final squads and official fantasy positions are imported.
- Add lineup/injury status as a hard filter before the tournament starts.
- Recalibrate value metrics when official prices arrive.
