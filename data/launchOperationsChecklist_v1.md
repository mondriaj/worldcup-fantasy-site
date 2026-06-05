# Launch Operations and Monitoring Checklist

Date: 2026-06-05

## Purpose

Use this checklist to decide what to do after launch when FIFA fantasy data, score context, PELE inputs, or public site behavior changes.

This is an operating note. It does not change player recommendations, Team Builder strategy weights, score prediction formulas, generated player data, generated recommendation data, fantasy rules data, or score prediction data.

## Regular Checks

Run these checks before major public updates, after FIFA fantasy feed changes, and on a regular launch-maintenance cadence.

- Run the official fantasy data monitor:

```bash
node scripts/checkOfficialFantasyDataUpdates.mjs
```

- Review whether the monitor found player, price, position, selectable status, squad, rules, round, deadline, language, or ownership changes.
- Run the readiness validator when a material data refresh is being considered:

```bash
node scripts/validateOfficialDataReadiness.mjs
```

- Check PELE only when the source notes suggest a refresh, a score-model task is planned, or team-quality context looks stale.
- Confirm the live site still loads and the public pages do not show internal notes or old model labels.

## Change Decision Table

| Change found | Action |
| --- | --- |
| Ownership only | No model rerun. Record the monitor result only. |
| Rules or help text only | Refresh rules or help copy. Do not rerun recommendations unless scoring or squad legality changed. |
| Booster wording changed | Refresh rules data and public copy. Review whether scoring or strategy logic is affected. Keep live booster use as a manual FIFA check unless verified logic is implemented. |
| Scoring changed | Refresh rules. Review player projections and recommendations. Rerun the recommendation model if scoring affects fantasy points. |
| Player price changed | Refresh official fantasy player data. Rerun value metrics and recommendations. Review Team Builder budget behavior. |
| Player position changed | Refresh official fantasy player data. Rerun recommendations. Review Team Builder legality and position counts. |
| Player selectable status changed | Refresh official fantasy player data. Rerun recommendations. Confirm unavailable players do not appear in public picks or builder outputs. |
| Player added or removed | Refresh official fantasy player data. Rerun recommendations. Review builder coverage and player IDs. |
| Squad or country metadata changed | Refresh official data. Review country limits and player-team mapping. Rerun recommendations if affected. |
| Deadline or lock wording changed | Refresh rules or help copy. Keep manual confirmation wording unless verified logic is implemented. Do not rerun recommendations unless player availability or scoring changed. |
| PELE data changed | Refresh PELE input data using existing source notes and scripts. Rerun team quality and score predictions. Regenerate active score browser data. Review Match Environment and player fixture context. |
| Final squad or player role data changed | Review player projections and role assumptions. Rerun recommendations if roles, minutes, or availability changed. |

## Existing Script References

Use only scripts that exist in the project. Do not invent a command for a missing pipeline.

Official data and rules:

```bash
node scripts/checkOfficialFantasyDataUpdates.mjs
node scripts/validateOfficialDataReadiness.mjs
node scripts/importOfficialFantasyPlayers.mjs
node scripts/importOfficialFantasyRules.mjs
node scripts/promoteOfficialFantasyRules.mjs
node scripts/importOfficialSquads.mjs
```

PELE, score, projection, and recommendation refresh scripts that may be relevant after review:

```bash
node scripts/step65PeleIntegration.mjs
node scripts/step66PeleForwardRecalibration.mjs
node scripts/buildFantasyPoolScorePredictionsV3.mjs
node scripts/buildFantasyPoolMatchdayProjectionsV3.mjs
node scripts/buildFantasyPoolRecommendationsV3.mjs
node scripts/buildFantasyPoolPreviewBrowserData.mjs
```

Run model-output scripts only after the decision table points to a real model-field change and the current source notes say the inputs are ready.

## Launch Checklist Before Sharing The Site

- Home loads.
- Picks load.
- Player cards show at most one badge.
- Player Profile opens.
- Add to Builder works.
- Team Builder builds a 15-player squad.
- Squad Strategy Report renders.
- Strategy comparison renders.
- Match Environment shows 72 group-stage fixtures.
- Match Environment shows only these main public fields:
  - Projected xG
  - Win / Draw / Win
  - Most Likely Score
  - Match Uncertainty
  - Clean-Sheet Context
- Matchday Desk loads.
- World Cup Guide loads.
- Export/import works if testable.
- Mobile layout has no obvious overflow.
- No internal production language appears in public UI.

Useful browser checks when available:

```bash
node scripts/runPublicPreviewBrowserQa.mjs
node scripts/runLaunchBrowserQa.mjs
```

## Public Wording Rules

- Do not show internal phase labels.
- Do not show week labels.
- Do not show implementation details.
- Do not show code file names or `window.*` data names to normal users.
- Do not show old removed labels such as xG Base, Goal Range as a main field, Attacker Context, Upset Risk as a main field, Value Quant, Risk-Control, or Captain option badge.
- Keep public wording simple and fantasy-facing.
- Keep deadline, lock, booster, captain, substitution, played/unplayed, lineup, and final-squad wording as manual FIFA checks unless verified official logic is implemented.

## When To Stop And Ask For Review

Stop and ask for review before changing active public data or model outputs when:

- official rules change affects scoring
- player prices or positions changed
- many player statuses changed
- score predictions changed materially
- Team Builder strategies become too similar
- public checks find confusing model text
- export/import compatibility may be affected
- source-backed final squad or role data becomes available but does not cleanly fit the current pipeline

## No-Action Cases

No model rerun is normally needed when:

- the monitor reports ownership-only changes
- a source header changed but monitored model fields did not change
- public help wording changed without scoring, squad legality, player availability, or projection impact
- a documentation-only note changes

Record the result, keep the site static, and avoid regenerating browser data unless the changed field affects the public site.
