# Recommendation Trust Model v0

Generated for Week 6 data sprint.

## Purpose

The recommendation trust model makes the site safer and more useful by adjusting rankings for data quality, roster certainty, minutes confidence, risk, and fixture context.

The site keeps the existing fantasy and finance measures, then applies a trust-mode layer on top.

## Recommendation Modes

### Safer Picks

Use this for conservative recommendations.

Safer Picks uses the same high-confidence checks that the old internal strict mode used, but it now works as a strong scoring preference instead of a hard wall. Players who fail these checks stay available, but their adjusted score is reduced:

- roster_status is confirmed
- recommendation_use is safe_to_rank
- data_confidence_score is at least 65
- start_probability_percent is at least 55
- expected_minutes_v0 is at least 45
- finance_composite_risk_score is below 65
- finance_tail_risk_score is below 70

Remaining QA warnings also reduce the score.

### Balanced

Use this as the default mode.

Balanced mode keeps the full player pool, but subtracts meaningful penalties for:

- rank review, watchlist-only status, or manual-review status
- safe-to-rank caveats
- weak data confidence
- roster not confirmed
- low start probability
- low expected minutes
- high substitution risk
- high composite risk
- high tail risk
- negative VaR floor
- multiple source-review flags
- missing league data
- hard fixture
- missing fixture xG
- missing fixture projection context
- style-specific warnings such as low team xG for attack-heavy picks

### High Upside

Use this when the user wants upside but still wants warnings.

High Upside keeps the full player pool, applies smaller QA penalties, and gives small boosts to upside and very-risky profile signals.

### Punts

Use this for punts and boom-or-bust watchlists.

Punts applies only small QA penalties. It boosts:

- very-risky strategy score
- upside percentile
- volatility percentile
- match upset probability

This mode is intentionally not a safe default.

## Website Usage

The trust mode affects:

- Quick Picks
- Captain Picks
- Team Advice
- Team Builder candidate pools
- exported Team JSON
- Player Profile QA context

The QA chips still appear even when a mode accepts the player. A chip is a warning, not always an exclusion.

Team Advice also has a recommendation-pool filter:

- `Playable recommendations` hides QA-review, watchlist-only, manual-review, and do-not-rank players.
- `Include watchlist punts` shows the broader pool so High Upside and Punts users can review upside punts with warning chips.

The Team Advice count note explains how many players are ranked, hidden by trust mode, hidden by playable filtering, or included as QA-review/watch players.

Team Builder also has risk-constraint controls:

- minimum start probability
- minimum expected minutes
- maximum QA-review players
- allow or block risky fill-ins

Locked players remain visible even if they break a risk control. If the controls are too tight for a full legal squad, the builder shows a warning instead of silently presenting a partial squad. Partial squads cannot be exported as Team JSON.

The Team Builder export includes `builder_risk_constraints` with the active settings, QA-review count, risky-player count, and any violations.

Recommendation tables now show both:

- raw model score
- adjusted score after recommendation-mode QA penalties, safer-pick checks, and upside boosts

The Team Builder export also includes a `recommendation_score` object for each player with raw score, adjusted score, QA penalty, safer-pick check penalty, trust boost, trust failures, QA status, and QA flags. The export field is still named `strict_failure_penalty` for compatibility with earlier Week 6 data.

## Recommendation Use Handling

The source model has several recommendation-use states. v0 treats them differently:

- `safe_to_rank` - no rank-use warning
- `safe_to_rank_with_caveat` - allowed, but marked with a caveat watch chip
- `use_as_filler_or_watchlist` - strongly warned as watchlist-only
- `manual_review_before_ranking` - marked for manual review
- `do_not_rank_yet` - strongly warned and heavily penalized

Safer Picks strongly prefers `safe_to_rank` players but does not remove the rest of the pool.

## Current Fallback Rules

- Safer Picks no longer hard-filters the Team Builder pool. It applies stronger penalties, then lets the optimizer complete a usable squad when the budget, country limit, and explicit advanced controls allow it.
- Explicit advanced controls, such as QA Review Limit `0`, can still make a full squad impossible. In that case, the site shows a warning and blocks partial Team JSON export instead of pretending it found a clean full team.
- The Team Builder now reserves enough budget for the cheapest remaining required positions while it searches. This prevents the optimizer from using too much proxy budget early and then failing to fill the final squad spots.
- Locked Team Builder players remain visible even if the current trust mode would not normally recommend them.
- Official World Cup fantasy prices are still missing, so value modes still rely on proxy_price_v0.
- Final squads are not fully official yet, so roster_status and recommendation_use should be rechecked later.

## Future Upgrades

Upgrade this to v1 after:

- official final World Cup rosters are complete
- official fantasy prices are imported
- official fantasy scoring rules are confirmed
- more qualifier and national-team lineup data is matched

Upgrade to v2 after:

- first matchday lineups or trusted predicted lineups are available
- injury and suspension feeds are available
- market ownership or popularity data is available
- model backtesting is possible against real World Cup fantasy scoring
