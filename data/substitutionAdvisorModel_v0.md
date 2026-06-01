# Substitution Advisor Model v0

Status: active prototype, quick-check scope.

## Scope

Substitution Advisor v0 is a manual quick check. It does not ask the user to enter a full squad. The user manually enters:

- matchday
- played starter, optional but useful for display and position checks
- starter raw fantasy points
- one bench player candidate
- risk style: safer, balanced, or upside

The bench candidate should be in the user's squad and should not have played yet in the selected matchday. The tool cannot verify squad membership or played/unplayed state until a future saved-squad or live-match state exists.

## Inputs

- `financePlayersData.js`
- `matchdayProjectionsData.js`, generated from `data/playerMatchdayProjections_v2.json`
- `scorePredictionsData.js`, generated from `data/scorePredictions_v2.json`
- manual user-entered starter raw points

## Decision Logic

The check compares the played starter's raw score against a bench-player substitution score for the selected matchday. It reuses the compressed raw-signal layer from Captain Change Advisor v0 so prototype finance projections are not treated as literal raw fantasy-point averages.

Switch score blend:

- Safer = 30% compressed risk-adjusted signal, 20% compressed expected signal, 50% capped floor.
- Balanced = 45% compressed expected signal, 25% compressed risk-adjusted signal, 30% capped floor.
- Upside = 38% compressed expected signal, 28% compressed upside signal, 14% compressed risk-adjusted signal, 20% capped floor.

The substitution threshold is intentionally conservative:

- Safer needs the bench score to beat the starter by 1.3 points.
- Balanced needs a 0.7-point buffer.
- Upside needs a 0.2-point buffer.

Close-call labels appear when the bench player is near the starter score but does not clear the selected threshold.

## Output

The UI returns:

- Sub in bench player
- Keep starter
- Close call
- Needs check

It also shows starter raw points, the selected sub score, raw expected/floor/upside signals, fixture difficulty, start probability, expected minutes, QA flags, and the PELE-forward match environment reason.

## Caveats

- No live fantasy scores are invented or fetched.
- Starter points must be entered by the user.
- The tool does not know the user's full squad.
- The tool does not know whether the bench player has already played.
- The tool does not fully validate formation legality. Different-position substitutions are flagged for manual formation checks.
- Official 2026 substitution rules may differ from previous tournament fantasy rules and must be checked once FIFA publishes the rule set.
- All projections are prototype model outputs, not official fantasy advice or betting odds.
