# Score Prediction Data Flow

Date: 2026-06-05

## Purpose

This note explains which score projection context the public site uses and how it reaches Match Environment, player explanations, Player Profile, and Team Builder. It is a data-flow note only; it does not change expected-goal formulas, scoreline probabilities, player recommendations, or Team Builder behavior.

## Public Site Loading

The site loads static data before the main app logic runs. Score projection context is included in those static data files, so the public page does not fetch score prediction JSON at runtime.

## Active Match Environment Context

Match Environment uses the current fantasy score projection context when it is available. A static score projection backup is also loaded so the table can still render if the current context is unavailable.

Every group-stage fixture should have score context for:

- Projected xG
- Win / Draw / Win
- Most likely score
- Match uncertainty
- Clean-sheet context

Projected xG means fixture-specific expected goals for the listed team against the listed opponent. It is not a generic team average, a raw PELE rating, or a season-long attacking grade.

The score rows also carry supporting details such as total goals range, clean-sheet probability, top scorelines, and goal environment. Those details support row details, player explanations, and model inspection, but they are not the main public Match Environment columns.

## Player Recommendations And Team Builder

Player cards and Player Profile use fixture-level context only when it helps explain the pick. Attackers can mention strong team projected xG, defenders and keepers can mention clean-sheet context, and any position can mention match uncertainty when the fixture shape is especially fragile.

Team Builder uses the same match context inside existing squad metrics. Repeated exposure to uncertain matches can affect Fixture Stack Risk and Bad-Week Floor. Strong team projected xG can support Upside Ceiling. Clean-sheet context can help explain defender and keeper value.

## PELE Anchor

PELE remains the main team-quality anchor. The local score model converts PELE plus fixture context into fantasy-facing score projection context: fixture-specific Projected xG, scoreline probabilities, clean-sheet probabilities, and match uncertainty.

## Current Limits

- This is static score projection context, not live match data.
- It does not know official lineups, injuries, live scores, lock state, deadlines, or final squad confirmations.
- Users should still confirm squad legality, locks, deadlines, boosters, and played/unplayed status inside the official fantasy game before acting.
