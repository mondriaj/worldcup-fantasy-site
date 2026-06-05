# Team Builder Strategy Comparison

Date: 2026-06-05

## Purpose

Team Builder Strategy Comparison is an advanced check for the five public Team Builder strategies:

- Balanced Squad
- Diversified Squad
- Concentrated Upside
- Stars and Scrubs
- Value Squad

The check runs each strategy with the same current Team Builder settings. That includes the tactic, match view, safety setting, price filters, country and position filters, locked players, removed players, and advanced safety controls.

## What It Shows

For each strategy, the comparison shows:

- squad size and budget use
- top country concentration
- biggest fixture stack
- Country Stack Risk
- Fixture Stack Risk
- Star Dependence
- Bench Strength
- Bad-Week Floor
- Upside Ceiling
- Budget Shape
- starter and bench player lists

It also shows squad overlap between strategies and the shared player core across all five builds.

The shared Squad Strategy Report metrics include Match Environment context. Fixture Stack Risk can reflect repeated exposure to the same uncertain match. Bad-Week Floor can reflect high match uncertainty. Upside Ceiling can reflect strong team projected xG and useful clean-sheet spots.

## Warning Checks

The comparison flags two kinds of problems:

- High overlap: two strategies share too many players, or all five strategies share a large common core.
- Weak strategy identity: a strategy does not show the expected direction versus its reference build.

The identity checks are intentionally simple:

- Diversified Squad should lower country or fixture concentration versus Balanced Squad when feasible.
- Concentrated Upside should raise upside or controlled stack exposure versus Balanced Squad when feasible.
- Stars and Scrubs should increase star dependence, premium pressure, or top-heavy budget shape versus Balanced Squad when feasible.
- Value Squad should improve bench strength or budget shape versus Stars and Scrubs when feasible.

## How To Use It

Use the comparison after changing Team Builder strategy preferences, portfolio adjustments, player projections, prices, or safety controls. If the comparison flags high overlap or weak identity under normal settings, inspect whether the strategy preferences need tuning.

The comparison is not meant to choose the final squad for a user. It is a visibility check that helps confirm that public strategy labels correspond to meaningfully different builder behavior.

Stars and Scrubs should usually show higher Star Dependence or a more top-heavy Budget Shape than Balanced Squad. If locks, removed players, filters, or safety controls force the pool to converge, high overlap can still be a valid warning rather than a bug.

## Current Limits

- The check uses the current static player and projection data.
- It does not know live lineups, official lock state, live scores, official deadlines, or official fantasy-game legality.
- Tight locks, removed players, filters, or safety controls can make strategies converge because the eligible pool is too constrained.
- Users should still confirm squad legality, deadlines, locks, boosters, and played/unplayed status inside the official FIFA fantasy game before acting.
