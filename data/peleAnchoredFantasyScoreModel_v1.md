# PELE-Anchored Fantasy Score Model v1

Date: 2026-06-05

## Purpose

This note explains the active fantasy-facing score projection layer used by Match Environment after the Phase 3B uncertainty pass and Phase 3C display cleanup. It documents the PELE anchor, the local fantasy model layered on top of it, the fixture-specific Projected xG meaning, the uncertainty fields, and the current limits.

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

Projected xG in the public Match Environment table means fixture-specific expected goals for the listed team against the listed opponent. It is not a generic team average, a PELE rating, or a raw attack-strength proxy. The values match `home_expected_goals` and `away_expected_goals`, which are the expected-goal inputs used by the Poisson score grid.

Phase 3C adds clearer aliases for those same values: `homeProjectedXg`, `awayProjectedXg`, `homeMatchXg`, and `awayMatchXg` on fixture rows, plus `projectedXg` on team-fixture rows. Phase 3C does not replace `home_expected_goals`, `away_expected_goals`, win/draw/loss probabilities, clean-sheet probabilities, or the score grid.

The uncertainty layer adds explanatory bands around the projected expected-goal values:

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

These labels are for fantasy planning and model inspection. Phase 3C keeps clean-sheet, goal, and uncertainty context in the main Match Environment table, but removes the generic match-level attack column from that main public display because it could mislead users about what Projected xG means. A Phase 3C follow-up also removes public Upset Risk from the main table because Win / Draw / Win is the clearer outcome view. The underlying upset-risk fields remain available for internal scoring, model notes, and exports. The fields do not claim official lineups, injuries, deadlines, locks, final squads, or live match state.

Phase 3D uses the cleaned fields beyond the Match Environment table. Player cards and Player Profile fixture notes can use fixture-specific Projected xG, Win / Draw / Win, Most likely score, Clean-sheet context, and Match uncertainty. Team Builder also uses that context in squad-risk scoring: uncertain match stacks can lower Bad-Week Floor and raise Fixture Stack Risk, strong team projected xG can lift Upside Ceiling, and good clean-sheet context can help defender/keeper squad value. This does not change the PELE anchor, expected-goal formulas, Poisson scoreline grid, or static browser data-loading pattern.

Phase 3E keeps those integrations but polishes the public copy. Player cards now use a single short fixture note only when the context is useful, Player Profile keeps the compact fixture context labels, and the Squad Strategy Report keeps the same metrics with shorter fixture-risk and upside explanations. Upset Risk, xG Base, Goal Range, and Attacker Context stay out of the main public fields.

## Current Limits

Phase 3B intentionally does not add historical backtesting, Dixon-Coles-style low-score calibration, draw tuning, roster-weighted likely XI strength, injury adjustments, or live lineup logic.

Future phases can improve calibration, roster-weighted team strength, and low-score/draw behavior after the static score model is ready for a deeper model pass.
