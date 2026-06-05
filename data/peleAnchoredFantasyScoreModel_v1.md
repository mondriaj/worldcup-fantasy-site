# PELE-Anchored Fantasy Score Model

Date: 2026-06-05

## Purpose

This note explains the fantasy-facing score projection layer used by Match Environment, player fixture notes, Player Profile, and Team Builder squad context. It covers the PELE anchor, the meaning of Projected xG, uncertainty labels, and current limits.

## PELE Anchor

PELE is the main team-quality anchor. The local model combines PELE with fixture context and secondary team-strength checks to create score projection context for fantasy planning.

PELE is useful because it gives a current-strength view of national teams. It is still only one input. The site does not treat it as an official FIFA projection, a lineup claim, or an exact-score forecast.

## Projected xG

Projected xG in Match Environment means match-specific expected goals for the listed team against the listed opponent.

It is not:

- a generic team average
- a PELE rating
- an attacking grade
- a player-level expected-goals claim

The scoreline grid uses the same team expected-goal values to produce win/draw/win probabilities, clean-sheet probabilities, and most likely scorelines.

## Match Uncertainty

Match uncertainty is a simple Low, Medium, or High label for how fragile the projected match path looks. It uses transparent cues already available in the static model, including team-quality gap, goal environment, role uncertainty, and host context where relevant.

Uncertainty is meant to explain fantasy risk, not to predict chaos with certainty. It helps identify fixtures where a projected edge may be less stable.

## Fantasy Context Labels

The score model translates fixture output into fantasy-facing context:

- Team projected xG
- Opponent projected xG
- Win / Draw / Win
- Most likely score
- Clean-sheet context
- Match uncertainty
- Goal environment as supporting detail

Player cards and Player Profile use these labels only when they help explain the pick. Team Builder uses the same context inside existing squad metrics such as Fixture Stack Risk, Bad-Week Floor, Upside Ceiling, Bench Strength, and Budget Shape.

## Current Limits

- The model does not know official lineups, injuries, live scores, locks, deadlines, or final squad confirmations.
- It does not add official FIFA fantasy rules or booster claims beyond the imported rules summary.
- It does not rewrite the expected-goal formulas or scoreline grid when public wording changes.
- Users should still confirm official-game legality, deadlines, locks, boosters, and played/unplayed status inside FIFA before acting.

Future score-model work can improve calibration, roster-weighted team strength, and low-score/draw behavior after the needed inputs are source-backed.
