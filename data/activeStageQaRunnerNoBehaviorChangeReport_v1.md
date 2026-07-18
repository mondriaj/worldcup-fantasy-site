# Active Stage QA Runner No-Behavior-Change Report v1

Generated: 2026-07-18T13:08:00.000Z

Status: **pass**

## Scope

This is a tooling-only change. The scoped commit adds the manifest-driven active QA runner, extends the active-stage manifest/report, updates the manifest validator so it gates the runner section, and writes runner QA reports.

No public HTML, browser app logic, public wrappers, recommendations, projections, score predictions, PELE data, or Team Builder output are part of the scoped change.

## Public Behavior Comparison

| Metric | Before | After | Changed |
| --- | --- | --- | --- |
| Active stage | finalRound | finalRound | no |
| Team Builder players | 15 | 15 | no |
| Team Builder budget | 94.8 / 105 | 94.8 / 105 | no |
| Team Builder team counts | Argentina 8; Spain 5; France 1; England 1 | Argentina 8; Spain 5; France 1; England 1 | no |
| Team Builder fixture counts | final 13; third_place 2 | final 13; third_place 2 | no |
| Recommendations rows | 175 | 175 | no |
| Projections rows | 134 | 134 | no |
| Score fixtures | 2 | 2 | no |
| Active eligible teams | France, England, Spain, Argentina | France, England, Spain, Argentina | no |
| `index.html` active wrapper list | unchanged | unchanged | no |
| `world-cup.html` active wrapper list | unchanged | unchanged | no |

## Result

Public behavior unchanged: **yes**

The runner is an orchestration/reporting layer only. It does not rebuild models, tune weights, change recommendations, change projections, change score predictions, change Team Builder output, or publish the refereeing/conspiracy section.
