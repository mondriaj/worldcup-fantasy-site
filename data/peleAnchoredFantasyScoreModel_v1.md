# PELE-Anchored Fantasy Score Model v1

Date: 2026-06-05

## Purpose

This note explains the active fantasy-facing score projection layer used by Match Environment after Phase 3B. It documents the PELE anchor, the local fantasy model layered on top of it, the new uncertainty fields, and the current limits.

## Active Public Data Flow

The public site loads score projection context statically:

- Source JSON: `data/scorePredictions_fantasyPool_v3.json`
- Browser bundle: `fantasyPoolScorePredictionsData.js`
- Window rows used by `script.js`: `window.FANTASY_POOL_SCORE_FIXTURE_PREDICTIONS`
- Static fallback: `scorePredictionsData.js` from `data/scorePredictions_v2.json`

No runtime JSON fetch is used.

## PELE Input Status

The local PELE input file is `data/peleRatings_v1.json`.

It was generated from the existing project PELE integration script:

```bash
node scripts/step65PeleIntegration.mjs
```

The script points to the Silver Bulletin PELE article and its Datawrapper CSV downloads:

- Ratings CSV: `https://datawrapper.dwcdn.net/4oVop/19/dataset.csv`
- Tilt CSV: `https://datawrapper.dwcdn.net/dxUJw/15/dataset.csv`
- Offense/defense CSV: `https://datawrapper.dwcdn.net/DcqkH/13/dataset.csv`

Remote freshness check on 2026-06-05:

- Ratings CSV matched the local `data/peleRatingsDatawrapper_4oVop_2026-06-01.csv` file.
- Tilt CSV matched the local `data/peleTiltDatawrapper_dxUJw_2026-06-01.csv` file.
- Offense/defense CSV matched the local `data/peleOffenseDefenseDatawrapper_DcqkH_2026-06-01.csv` file.

Because the remote CSVs matched the local files, Phase 3B did not refresh PELE ratings or rerun the broader PELE integration pipeline.

## Model Layers

Base team strength stays PELE-forward. `data/teamQuality_fantasyPool_v3.json` starts from the active PELE-forward `team_quality_v2` model, then adds only small fantasy-pool team-position, availability, and data-quality adjustments.

Base fixture xG stays the same score-model output. Phase 3B does not replace `home_expected_goals`, `away_expected_goals`, win/draw/loss probabilities, clean-sheet probabilities, or the Poisson score grid.

The new uncertainty layer adds explanatory bands around the base xG:

- `uncertaintyLabel`: Low, Medium, or High
- `lowTotalGoals`, `baseTotalGoals`, `highTotalGoals`
- `homeXgLow`, `homeXgBase`, `homeXgHigh`
- `awayXgLow`, `awayXgBase`, `awayXgHigh`
- `uncertaintyReason`

The bands use transparent proxies already available in the static model: team-quality gap, upset risk, goal environment, team-role uncertainty flags, Brazil role-source review, and host venue context where present.

The fantasy context layer translates fixture output into simple public labels:

- `attackerEnvironment`
- `defenderEnvironment`
- `keeperEnvironment`
- `cleanSheetContext`
- `goalEnvironment`
- `upsetRisk`
- `matchUncertainty`

These labels are for fantasy planning and Match Environment display. They do not claim official lineups, injuries, deadlines, locks, final squads, or live match state.

## Current Limits

Phase 3B intentionally does not add historical backtesting, Dixon-Coles-style low-score calibration, draw tuning, roster-weighted likely XI strength, injury adjustments, or live lineup logic.

Future phases can feed match uncertainty into player recommendations, Team Builder portfolio risk, and squad strategy comparisons after the uncertainty labels have been reviewed in the public Match Environment surface.
