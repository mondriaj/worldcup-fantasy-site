# Recommendation QA v0

Generated: 2026-06-01T14:12:18.134Z

This report audits the browser-ready recommendation data used by the homepage. It checks top picks by style, matchday, position, country concentration, data quality, role risk, and fixture context.

## Executive Summary

- Browser player rows audited: 1335.
- Browser matchday projection rows audited: 4005.
- Top-pick rows audited across styles and matchdays: 1700.
- Unique players appearing in top-pick pools: 259.
- Players with all three matchday projections: 1335.
- Players with low data confidence: 203.
- Players with non-confirmed roster status: 503.
- Official fantasy prices missing: 1335.

## QA Rules

- Review low data confidence: data confidence below 50.
- Review role risk: start probability below 40%, expected minutes below 35, or substitution risk at least 70.
- Review downside risk: composite risk or tail risk at least 70, or negative VaR 10% floor.
- Review fixture mismatch: attack-heavy picks with low team xG, defensive-heavy picks with low clean-sheet probability, or hard single-matchday fixtures.
- Review concentration: six or more players from one country in a top-25 list.

## Full Group Stage Style Audit

| Style | Status | Top Pick | Avg Start % | Avg Risk | Top Countries | Warnings |
| --- |--- |--- |--- |--- |--- |--- |
| Best Overall | watch | Alban Lafont (Côte d'Ivoire, Goalkeeper) | 65.76 | 19.04 | England 4, Switzerland 3, Argentina 2 | low_start_probability:7 |
| Expected Return | review | Lionel Messi (Argentina, Forward) | 49.52 | 24.16 | Mexico 3, Portugal 3, England 2 | not_safe_to_rank:10; low_start_probability:12 |
| Safe Floor | watch | Alban Lafont (Côte d'Ivoire, Goalkeeper) | 72.32 | 14.72 | England 4, Argentina 3, France 3 | low_start_probability:5 |
| Upside | watch | Harry Kane (England, Forward) | 61.36 | 25.32 | Brazil 3, France 3, Uruguay 3 | low_start_probability:9 |
| Attack Heavy | watch | Harry Kane (England, Forward) | 63.84 | 26.6 | France 4, Argentina 2, Brazil 2 | low_start_probability:7 |
| Defensive Heavy | watch | Alban Lafont (Côte d'Ivoire, Goalkeeper) | 51.12 | 17 | England 5, Argentina 3, France 3 | low_start_probability:13 |
| Very Risky Upside | review | Tomas Rodriguez (Panama, Forward) | 18.6 | 59.24 | Germany 4, Saudi Arabia 3, Canada 2 | not_safe_to_rank:23; low_start_probability:24 |
| Minutes Floor | watch | Alban Lafont (Côte d'Ivoire, Goalkeeper) | 75.2 | 17.68 | Germany 2, Korea Republic 2, Panama 2 | low_start_probability:6 |
| Tail-Risk Avoidance | watch | Alban Lafont (Côte d'Ivoire, Goalkeeper) | 69.8 | 14.56 | England 4, France 4, Argentina 3 | low_start_probability:6 |
| VaR Floor | review | Alban Lafont (Côte d'Ivoire, Goalkeeper) | 63.64 | 13.28 | Argentina 4, England 3, Switzerland 3 | not_safe_to_rank:6; low_start_probability:9 |
| CVaR Floor | review | Alban Lafont (Côte d'Ivoire, Goalkeeper) | 71.48 | 12.96 | Argentina 3, England 3, Switzerland 3 | not_safe_to_rank:4; low_start_probability:6 |
| Sharpe-Style | review | Alban Lafont (Côte d'Ivoire, Goalkeeper) | 63.72 | 15.88 | Mexico 3, Portugal 3, Switzerland 3 | not_safe_to_rank:9; low_start_probability:9 |
| Sortino-Style | review | Alban Lafont (Côte d'Ivoire, Goalkeeper) | 65.56 | 13.56 | Argentina 4, England 3, Portugal 3 | not_safe_to_rank:5; low_start_probability:8 |
| Best Value Prototype | review | Alban Lafont (Côte d'Ivoire, Goalkeeper) | 37.12 | 26.4 | South Africa 3, Switzerland 3, Côte d'Ivoire 2 | not_safe_to_rank:15; low_start_probability:18 |
| Cheap Enabler | review | Alisson (Brazil, Goalkeeper) | 65.76 | 26.92 | South Africa 3, Australia 2, Canada 2 | not_safe_to_rank:13; low_start_probability:8 |
| Premium Worth It | review | Lionel Messi (Argentina, Forward) | 59.72 | 20.16 | Portugal 4, England 3, France 2 | not_safe_to_rank:8; low_start_probability:9 |
| Captain | review | Lionel Messi (Argentina, Forward) | 60.84 | 20.52 | Portugal 4, Colombia 2, England 2 | not_safe_to_rank:8; low_start_probability:9 |

## Best Overall By Position

| Position | Top Pick | Score | Expected | Start % | Data Confidence | Flags |
| --- |--- |--- |--- |--- |--- |--- |
| Goalkeeper | Alban Lafont (Côte d'Ivoire, Goalkeeper) | 100 | 10.04 | 18 | 100 | low_start_probability, low_expected_minutes, high_substitution_risk, multiple_source_review_flags |
| Defender | David Raum (Germany, Defender) | 98 | 5.27 | 90 | 100 | none |
| Midfielder | Christian Fassnacht (Switzerland, Midfielder) | 100 | 8.03 | 24 | 100 | low_start_probability, low_expected_minutes, high_substitution_risk |
| Forward | Harry Kane (England, Forward) | 100 | 8.75 | 88 | 100 | none |

## Matchday Fixture Audit

| Matchday | Style | Status | Top Pick | Avg Team xG | Avg Clean Sheet | Avg Upset Risk | Warnings |
| --- |--- |--- |--- |--- |--- |--- |--- |
| Matchday 1 | Best Overall | review | Alejandro Grimaldo (Spain, Defender) | 2.31 | 63.5% | 6.6% | not_safe_to_rank:3; low_start_probability:3 |
| Matchday 1 | Attack Heavy | review | Alejandro Grimaldo (Spain, Defender) | 2.21 | 59.1% | 9.2% | not_safe_to_rank:3; low_start_probability:6 |
| Matchday 1 | Defensive Heavy | review | Alban Lafont (Côte d'Ivoire, Goalkeeper) | 2.14 | 55.1% | 10.1% | not_safe_to_rank:3; low_start_probability:9 |
| Matchday 1 | Very Risky Upside | review | Deniz Undav (Germany, Forward) | 2.01 | 51% | 11.3% | not_safe_to_rank:22; low_start_probability:23 |
| Matchday 1 | Captain | review | Lionel Messi (Argentina, Forward) | 2.28 | 61.8% | 7.7% | country_concentration:Portugal 6/25; not_safe_to_rank:6; low_start_probability:3 |
| Matchday 2 | Best Overall | review | Alejandro Grimaldo (Spain, Defender) | 2.31 | 62.4% | 6.7% | not_safe_to_rank:3; low_start_probability:2 |
| Matchday 2 | Attack Heavy | review | Adrien Rabiot (France, Midfielder) | 2.3 | 61.1% | 7.7% | not_safe_to_rank:4; low_start_probability:7 |
| Matchday 2 | Defensive Heavy | review | Alejandro Grimaldo (Spain, Defender) | 2.37 | 63.4% | 6.4% | not_safe_to_rank:5; low_start_probability:10 |
| Matchday 2 | Very Risky Upside | review | Juan Camilo Hernandez (Colombia, Forward) | 1.91 | 49.5% | 9.2% | not_safe_to_rank:23; low_start_probability:23; hard_fixture:5 |
| Matchday 2 | Captain | review | Lionel Messi (Argentina, Forward) | 2.46 | 66% | 5% | not_safe_to_rank:4; low_start_probability:1 |
| Matchday 3 | Best Overall | review | Alban Lafont (Côte d'Ivoire, Goalkeeper) | 2.19 | 60.3% | 8.8% | not_safe_to_rank:2; low_start_probability:3 |
| Matchday 3 | Attack Heavy | review | Adrien Rabiot (France, Midfielder) | 2.05 | 54.2% | 11.9% | not_safe_to_rank:3; low_start_probability:4 |
| Matchday 3 | Defensive Heavy | review | Alban Lafont (Côte d'Ivoire, Goalkeeper) | 2.19 | 60.6% | 8.2% | not_safe_to_rank:3; low_start_probability:11 |
| Matchday 3 | Very Risky Upside | review | Ange-Yoan Bonny (Côte d'Ivoire, Forward) | 1.65 | 41.5% | 17.5% | not_safe_to_rank:21; low_start_probability:23; hard_fixture:2 |
| Matchday 3 | Captain | review | Lionel Messi (Argentina, Forward) | 2.21 | 60.9% | 8.1% | not_safe_to_rank:2; low_start_probability:1 |

## Weak Data Watchlist

These are top-pool players that surfaced despite weaker data or role confidence. They should stay visible for upside discovery, but not be treated as safe defaults.

| Matchday | Style | Player | Data Confidence | Start % | Flags |
| --- |--- |--- |--- |--- |--- |
| Full Group Stage | Cheap Enabler | Hayden Matthews (Australia, Defender) | 50 | 42 | not_safe_to_rank, roster_not_confirmed, high_substitution_risk, high_tail_risk, negative_var10_floor, missing_league, multiple_source_review_flags |
| Matchday 1 | Cheap Enabler | Hayden Matthews (Australia, Defender) | 50 | 42 | not_safe_to_rank, roster_not_confirmed, high_substitution_risk, high_tail_risk, negative_var10_floor, missing_league, multiple_source_review_flags |
| Matchday 2 | Cheap Enabler | Hayden Matthews (Australia, Defender) | 50 | 42 | not_safe_to_rank, roster_not_confirmed, high_substitution_risk, high_tail_risk, negative_var10_floor, missing_league, multiple_source_review_flags |
| Matchday 3 | Cheap Enabler | Hayden Matthews (Australia, Defender) | 50 | 42 | not_safe_to_rank, roster_not_confirmed, high_substitution_risk, high_tail_risk, negative_var10_floor, missing_league, multiple_source_review_flags |
| Full Group Stage | Cheap Enabler | Harry Souttar (Australia, Defender) | 50 | 53 | not_safe_to_rank, roster_not_confirmed, high_tail_risk, negative_var10_floor, missing_league, multiple_source_review_flags |
| Matchday 1 | Cheap Enabler | Harry Souttar (Australia, Defender) | 50 | 53 | not_safe_to_rank, roster_not_confirmed, high_tail_risk, negative_var10_floor, missing_league, multiple_source_review_flags |
| Matchday 2 | Cheap Enabler | Harry Souttar (Australia, Defender) | 50 | 53 | not_safe_to_rank, roster_not_confirmed, high_tail_risk, negative_var10_floor, missing_league, multiple_source_review_flags |
| Matchday 3 | Cheap Enabler | Harry Souttar (Australia, Defender) | 50 | 53 | not_safe_to_rank, roster_not_confirmed, high_tail_risk, negative_var10_floor, missing_league, multiple_source_review_flags |
| Matchday 3 | Cheap Enabler | Benjamin Asare (Ghana, Goalkeeper) | 55 | 18 | not_safe_to_rank, roster_not_confirmed, low_start_probability, low_expected_minutes, high_substitution_risk, high_tail_risk, negative_var10_floor, missing_league, multiple_source_review_flags, hard_fixture |
| Full Group Stage | Cheap Enabler | Benjamin Asare (Ghana, Goalkeeper) | 55 | 18 | not_safe_to_rank, roster_not_confirmed, low_start_probability, low_expected_minutes, high_substitution_risk, high_tail_risk, negative_var10_floor, missing_league, multiple_source_review_flags |
| Matchday 1 | Cheap Enabler | Benjamin Asare (Ghana, Goalkeeper) | 55 | 18 | not_safe_to_rank, roster_not_confirmed, low_start_probability, low_expected_minutes, high_substitution_risk, high_tail_risk, negative_var10_floor, missing_league, multiple_source_review_flags |
| Matchday 2 | Very Risky Upside | Jeremy Arévalo (Ecuador, Forward) | 60 | 2 | not_safe_to_rank, roster_not_confirmed, low_start_probability, low_expected_minutes, high_substitution_risk, high_composite_risk, high_tail_risk, negative_var10_floor, multiple_source_review_flags, very_risky_low_upset_context, favorable_fixture |

## Hard Fixture Watchlist

These are players who still surfaced in top lists despite difficult single-matchday context.

| Matchday | Style | Player | Opponent | Difficulty | Team xG | Clean Sheet | Flags |
| --- |--- |--- |--- |--- |--- |--- |--- |
| Matchday 2 | Minutes Floor | Carlens Arcus (Haiti, Defender) | Brazil | 98.71 | 0.35 | 6.2% | high_tail_risk, negative_var10_floor, hard_fixture |
| Matchday 2 | Minutes Floor | Danley Jean Jacques (Haiti, Midfielder) | Brazil | 98.71 | 0.35 | 6.2% | high_tail_risk, negative_var10_floor, multiple_source_review_flags, hard_fixture |
| Matchday 3 | Minutes Floor | Carlens Arcus (Haiti, Defender) | Morocco | 84.82 | 0.35 | 9.4% | negative_var10_floor, hard_fixture |
| Matchday 3 | Minutes Floor | Danley Jean Jacques (Haiti, Midfielder) | Morocco | 84.82 | 0.35 | 9.4% | high_tail_risk, negative_var10_floor, multiple_source_review_flags, hard_fixture |
| Matchday 3 | Minutes Floor | Alex Rufer (New Zealand, Midfielder) | Belgium | 84 | 0.35 | 10.2% | high_tail_risk, negative_var10_floor, multiple_source_review_flags, hard_fixture |
| Matchday 3 | Cheap Enabler | Benjamin Asare (Ghana, Goalkeeper) | Croatia | 83.75 | 0.35 | 9.3% | not_safe_to_rank, roster_not_confirmed, low_start_probability, low_expected_minutes, high_substitution_risk, high_tail_risk, negative_var10_floor, missing_league, multiple_source_review_flags, hard_fixture |
| Matchday 1 | Minutes Floor | Aaron Wan-Bissaka (Congo DR, Defender) | Portugal | 82.14 | 0.35 | 8.9% | high_tail_risk, negative_var10_floor, hard_fixture |
| Matchday 3 | Very Risky Upside | Fidel Escobar (Panama, Defender) | England | 81.44 | 0.4 | 9.9% | high_composite_risk, high_tail_risk, negative_var10_floor, multiple_source_review_flags, very_risky_low_upset_context, hard_fixture |
| Matchday 3 | Very Risky Upside | Tomas Rodriguez (Panama, Forward) | England | 81.44 | 0.4 | 9.9% | low_start_probability, high_substitution_risk, high_tail_risk, negative_var10_floor, multiple_source_review_flags, very_risky_low_upset_context, hard_fixture |
| Matchday 3 | Minutes Floor | Andres Andrade (Panama, Defender) | England | 81.44 | 0.4 | 9.9% | negative_var10_floor, multiple_source_review_flags, hard_fixture |
| Matchday 1 | Minutes Floor | Akram Afif (Qatar, Forward) | Switzerland | 80.55 | 0.35 | 9.5% | not_safe_to_rank, roster_not_confirmed, negative_var10_floor, multiple_source_review_flags, hard_fixture |
| Matchday 3 | Tail-Risk Avoidance | Craig Gordon (Scotland, Goalkeeper) | Brazil | 79.33 | 0.55 | 11.4% | negative_var10_floor, hard_fixture |

## Main Caveats

- Official World Cup fantasy prices are missing, so value and budget rankings use proxy prices only.
- Final squads, official positions, official scoring rules, injuries, and starting lineups can change recommendations.
- Very Risky is intentionally aggressive and should not be read as safe advice.
- Score-prediction fields are prototype match-environment signals, not betting odds or official forecasts.

## Recommended Next Fixes

- Recalibrate value metrics when official prices arrive.
- Re-run QA after final squads and official fantasy positions are imported.
- Add lineup/injury status as a hard filter before the tournament starts.
- Add a visible "QA warning" chip in Player Profile for top-pool players with low data, low minutes, or hard fixtures.
