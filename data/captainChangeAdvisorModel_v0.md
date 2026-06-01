# Captain Change Advisor Model v0

Status: active prototype, quick-check scope.

## Scope

Captain Change Advisor v0 is the Quick Captain Switch Check. It does not require the user to enter a full squad. The user manually enters:

- matchday
- current captain, optional but useful for display and same-player checks
- current captain raw points before the captain double
- one replacement captain candidate
- risk style: safer, balanced, or upside

The replacement candidate should be in the user's squad and should not have played yet in the selected matchday. Saved Squad Decision Mode v0 can fill the current and replacement fields from a built or imported Team Builder squad, but the user still confirms played/unplayed status.

## Inputs

- `financePlayersData.js`
- `matchdayProjectionsData.js`, generated from `data/playerMatchdayProjections_v2.json`
- `scorePredictionsData.js`, generated from `data/scorePredictions_v2.json`
- manual user-entered current captain raw points

## Decision Logic

The check compares the current captain raw score against a replacement switch score for the selected matchday. The switch score is intentionally more conservative than the headline expected-return metric because user-entered captain scores are real raw points while the projection layer is still prototype model output.

Raw signal compression:

- Expected and risk-adjusted model signals at 2 points or lower are kept as-is.
- Signals above 2 points are compressed with a square-root curve and capped at 9.5 raw points.
- Upside uses a looser square-root curve and is capped at 11 raw points.
- VaR 10% floor is clamped to a non-negative value and capped at 7 raw points.

Switch score blend:

- Safer = 35% compressed risk-adjusted signal, 20% compressed expected signal, 45% capped floor.
- Balanced = 50% compressed expected signal, 25% compressed risk-adjusted signal, 25% capped floor.
- Upside = 42% compressed expected signal, 30% compressed upside signal, 14% compressed risk-adjusted signal, 14% capped floor.

The switch threshold is intentionally conservative:

- Safer needs the replacement projection to beat the current raw score by 1.5 points.
- Balanced needs a 0.8-point buffer.
- Upside needs a 0.2-point buffer.

Close-call labels appear when the replacement is near the current score but does not clear the selected threshold.

A current score of 12+ raw points is treated as excellent. The UI explicitly warns that the advisor is conservative from that point, because most realistic captain candidates should not be assumed to average that score.

## Output

The UI returns:

- Switch captain
- Keep captain
- Close call
- Needs check

It also shows current raw points, the selected raw switch score, raw expected/floor/upside signals, fixture difficulty, start probability, expected minutes, QA flags, and the PELE-forward match environment reason.

## Saved Squad Mode

If the Team Builder has a full built or imported squad, the advisor shows saved-squad buttons for current captain and new captain. These buttons only fill the existing quick-check fields. They do not create live squad tracking.

When the user runs the quick check, the latest captain-change result is included in Team Export JSON v1 under `decision_tools.captain_change_advisor` until the advisor is reset, the result is replaced, the inputs become invalid, or the Team Builder squad changes.

## Caveats

- No live fantasy scores are invented or fetched.
- Current captain points must be entered by the user.
- Without a built or imported Team Builder squad, the tool does not know the user's full squad.
- The tool does not know whether the replacement has already played.
- Official 2026 captain-switch rules may differ from previous tournament fantasy rules and must be checked once FIFA publishes the rule set.
- All projections are prototype model outputs, not official fantasy advice or betting odds.
