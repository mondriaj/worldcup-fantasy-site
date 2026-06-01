# Player Performance Merge Plan

This file explains how to merge the Week 6 performance sources later without losing source quality.

## Goal

Create one rich player profile per World Cup roster player, while preserving source labels and confidence.

## Source Priority

1. Official fantasy/FIFA player identity and prices when available.
2. Exact league/fantasy sources where available, such as FPL-Core-Insights, StatBunker, Understat, and ESPN core match-player stats.
3. OneFootball match-page data for starts, substitute appearances, estimated minutes, goals, assists, cards, clean-sheet context, goals conceded, and team match context.
4. ESPN summary roster rows for broad non-Big-5 coverage when core stats are unavailable.
5. Leaderboard-only rows as weak context for goals, assists, and cards.
6. National-team qualifier context from `playerNationalTeamPerformance.json`, preferring official UEFA stats where present and OneFootball qualifier match-page rows for non-UEFA coverage and starts.

## Field Rules

- Keep `source_id` for every imported measure.
- Keep exact and estimated minutes separate.
- OneFootball minutes are acceptable for modeling, but should stay marked as estimated.
- Use high-confidence name-and-club matches first.
- Keep review-only matches out of user-facing recommendations until checked.
- For goals, assists, and cards, prefer exact source totals when present and use OneFootball as a cross-check or filler.
- For starts and substitute usage, OneFootball is a strong source when match pages show confirmed lineups.
- Clean sheets and goals conceded should be applied by position later.
- Team standings and team match stats should become team-context features, not player-owned skill stats.
- Keep `onefootball_qualifier_profile` separate inside national-team profiles so the model can see which national-team minutes are estimated.
- Use `best_available_qualifier_stats_v0` as the first modeling input for country-level usage because it combines official UEFA fields and OneFootball qualifier supplements without losing source labels.
- Do not treat missing OneFootball qualifier rows as proof a player will not make the squad; use them as a review flag or low national-team usage signal.

## Next Merge Output

The first generated recommendation-input merge file now exists:

- `playerRecommendationInputs_v0.json`
- `playerRecommendationTiers_v0.json`

Together they include:

- one row per roster player
- roster identity
- best available club performance
- field-level source labels
- national-team usage context
- team quality
- group fixture context
- data-confidence scores
- recommendation-readiness tiers
- flags for missing, estimated, review-only, or conflicting data

The next deeper player-performance file should still be a new generated file, not a destructive rewrite:

- `playerPerformanceMergedV0.json`

It should include:

- roster player identity
- best available minutes/starts source
- all source-backed goal/assist/card values
- source confidence summary
- club league context
- national-team usage context
- flags for missing, estimated, review-only, or conflicting data
