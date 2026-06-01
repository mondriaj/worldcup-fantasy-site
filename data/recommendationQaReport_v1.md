# Recommendation QA v1

Generated: 2026-06-01T18:44:04.083Z

This report audits the browser-ready recommendation data after PELE Data Integration Step 6.5.

## Executive Summary

- Browser player rows audited: 1335.
- Browser matchday projection rows audited: 4005.
- Top-pick rows audited across styles and matchdays: 1000.
- Unique players appearing in top-pick pools: 224.
- Players with all three matchday projections: 1335.
- Hard-fixture projection rows: 927.

## Matchday Fixture Audit Sample

| Matchday | Style | Status | Top Pick | Avg Team xG | Avg Clean Sheet | Avg Upset Risk | Warnings |
| --- |--- |--- |--- |--- |--- |--- |--- |
| Full Group Stage | Best Overall | review | Lionel Messi (Argentina, Forwards) | 2.06 | 57.2% | 14.9% | low_start_probability:5 |
| Full Group Stage | Expected Return | review | Lionel Messi (Argentina, Forwards) | 2.06 | 57.2% | 14.9% | low_start_probability:5 |
| Full Group Stage | Safe Floor | review | Lionel Messi (Argentina, Forwards) | 1.96 | 53.4% | 15.9% | low_start_probability:2 |
| Full Group Stage | Upside | review | Lionel Messi (Argentina, Forwards) | 1.99 | 56.0% | 15.2% | low_start_probability:12 |
| Full Group Stage | Attack Heavy | review | Lionel Messi (Argentina, Forwards) | 2.1 | 58.0% | 14.9% | low_start_probability:4 |
| Full Group Stage | Defensive Heavy | review | Nicolas Otamendi (Argentina, Defenders) | 2.39 | 65.3% | 9.5% | low_start_probability:7 |
| Full Group Stage | Very Risky | review | Rubén Lezcano (Paraguay, Midfielders) | 1.18 | 29.4% | 35.2% | low_start_probability:25; high_composite_risk:16 |
| Full Group Stage | Minutes Floor | review | Abdelatif Ramdane (Algeria, Goalkeepers) | 1.04 | 25.0% | 22.0% | low_start_probability:13; high_composite_risk:10 |
| Full Group Stage | Tail Risk Avoidance | review | Lionel Messi (Argentina, Forwards) | 1.98 | 54.4% | 16.5% | low_start_probability:7 |
| Full Group Stage | Captain | pass | Lionel Messi (Argentina, Forwards) | 2.1 | 57.2% | 15.1% | none |
| Matchday 1 | Best Overall | review | Lionel Messi (Argentina, Forwards) | 2.26 | 66.8% | 9.7% | low_start_probability:6 |
| Matchday 1 | Expected Return | review | Lionel Messi (Argentina, Forwards) | 2.26 | 66.8% | 9.7% | low_start_probability:6 |
| Matchday 1 | Safe Floor | review | Lionel Messi (Argentina, Forwards) | 2.31 | 63.8% | 10.1% | low_start_probability:3 |
| Matchday 1 | Upside | review | Lionel Messi (Argentina, Forwards) | 2.11 | 65.1% | 11.5% | low_start_probability:13 |
| Matchday 1 | Attack Heavy | review | Lionel Messi (Argentina, Forwards) | 2.19 | 64.5% | 11.3% | low_start_probability:8 |
| Matchday 1 | Defensive Heavy | review | Sander Tangvik (Norway, Goalkeepers) | 2.53 | 70.5% | 6.6% | low_start_probability:5 |
| Matchday 1 | Very Risky | review | Tomas Rodriguez (Panama, Forwards) | 1.23 | 29.5% | 42.0% | low_start_probability:25; high_composite_risk:16 |
| Matchday 1 | Minutes Floor | review | Lionel Messi (Argentina, Forwards) | 1.88 | 55.6% | 13.8% | hard_fixture:1 |
| Matchday 1 | Tail Risk Avoidance | review | Lionel Messi (Argentina, Forwards) | 2.22 | 64.8% | 10.0% | low_start_probability:6 |
| Matchday 1 | Captain | review | Lionel Messi (Argentina, Forwards) | 2.28 | 65.3% | 10.2% | low_start_probability:2 |

## Main Caveats

- Official World Cup fantasy prices are missing, so value and budget rankings use proxy prices only.
- Final squads, official positions, official scoring rules, injuries, and starting lineups can change recommendations.
- Score-prediction fields are prototype match-environment signals, not betting odds or official forecasts.

## Recommended Next Fixes

- Re-run QA after final squads and official fantasy positions are imported.
- Add lineup/injury status as a hard filter before the tournament starts.
- Recalibrate value metrics when official prices arrive.
