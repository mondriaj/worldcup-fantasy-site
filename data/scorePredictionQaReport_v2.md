# Score Prediction QA Report v2

Status: Pass
Generated: 2026-06-23T14:03:16.184Z
Source checked: 2026-06-18

## What Was Checked

- Fixture coverage: 72/72 group fixtures have score predictions.
- Team-fixture coverage: 144/144 team views exist.
- Player matchday integration: 4017/4017 player-matchday rows have score-prediction context.
- Input coverage: 48/48 teams have Elo, 48/48 have FIFA ranking, and 48/48 have numeric PELE ratings.
- Probability fields, expected-goals bounds, favorite consistency, and top scorelines were checked.

## Results

- Checks run: 11.
- Passed: 11.
- Failed: 0.
- Caveats: 0.

Current output ranges:

- Total expected goals: 1.872 to 3.55, average 2.559.
- Favorite win probability: 0.3666 to 0.9092.
- Upset risk probability: 0.0368 to 0.4097.
- Home clean-sheet probability: 0.0504 to 0.7047.
- Away clean-sheet probability: 0.0408 to 0.7047.

## Important Caveats

- This validates internal consistency, not real predictive accuracy.
- PELE ratings are now imported from the Silver Bulletin Datawrapper CSVs; no PELE values were inferred.
- The model still does not use final squads, injuries, official fantasy prices, official fantasy scoring rules, betting odds, or lineup news.
- Plain Poisson low-score and draw calibration is still reserved for a later model.

## Fallback Rules

- If any hard QA check fails, keep the affected fixture in prototype review and do not use it for confident advice.
- If Elo, FIFA, or PELE is missing in a future update, leave the missing value null and lower fixture confidence.
- If probability or xG bounds fail, fix the source model and regenerate browser data before showing advice.
