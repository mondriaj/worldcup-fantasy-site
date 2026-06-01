# Score Prediction QA Report v0

Status: Pass with prototype caveats  
Generated: 2026-06-01T18:14:29.429Z  
Source checked: 2026-06-01

## What Was Checked

- Fixture coverage: 72/72 group fixtures have score predictions.
- Team-fixture coverage: 144/144 team views exist.
- Player matchday integration: 4017/4017 player-matchday rows have score-prediction context.
- Input coverage: 48/48 teams have Elo, 48/48 have FIFA ranking, and 0/48 have numeric PELE ratings.
- Probability fields were checked to stay between 0 and 1.
- Home/draw/away probabilities were checked to sum to 1 within a 0.002 tolerance.
- Expected goals were checked to stay non-negative and below the v0 guardrail.
- Favorites were checked against home/away win probabilities.
- Top scorelines were checked for presence and reasonable size.

## Results

- Checks run: 21.
- Passed: 20.
- Failed: 0.
- Caveats: 1.

Current output ranges:

- Total expected goals: 2.496 to 3.124, average 2.709.
- Favorite win probability: 0.3994 to 0.8735.
- Upset risk probability: 0.0283 to 0.3815.
- Home clean-sheet probability: 0.0724 to 0.7047.
- Away clean-sheet probability: 0.0624 to 0.7047.

## Important Caveats

- This validates internal consistency, not real predictive accuracy.
- PELE ratings remain unavailable as reusable numeric data, so `pele_rating` stays `null` and is not imputed.
- The model still does not use final squads, injuries, official fantasy prices, official fantasy scoring rules, betting odds, or recent-form calibration.
- Plain Poisson low-score and draw calibration is still reserved for v2.

## Fallback Rules

- If any hard QA check fails, keep the affected fixture in prototype review and do not use it for confident advice.
- If Elo or FIFA ranking is missing, lower fixture confidence and fall back to `team_quality_v0`.
- If PELE is missing, leave it null. Do not fabricate a replacement.
- If probability or xG bounds fail, fix the source model and regenerate browser data before showing advice.
