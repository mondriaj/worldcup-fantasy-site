# Exact Browser Assertions No-Behavior-Change Report v1

Status: pass

## Result

Model behavior is unchanged. The Team Builder artifact, golden values, recommendations, projections, score predictions, fixtures, and public default stage were not regenerated or retuned.

## Public Visibility Fixes

This pass intentionally made two existing Final Round facts visible because the new browser content contract requires them:

- Match Environment rows now show source SF scores for Final Round fixtures.
- Visible caveats now use concise planning-help wording while preserving final-squad and lineup verification warnings.

## Unchanged Model Counts

| Dataset | Rows |
| --- | --- |
| Final Round recommendations source | 175 |
| Final Round projections source | 134 |
| Final Round score prediction fixtures | 2 |
| Final Round fixture authority fixtures | 2 |
| Team Builder golden players | 15 |

## Team Builder Golden

Budget remains `94.8 / 105`; captain remains Mikel Oyarzabal; vice remains Leandro Paredes; team counts remain Argentina 8, Spain 5, France 1, England 1; fixture counts remain Final 13 and Third Place 2.
