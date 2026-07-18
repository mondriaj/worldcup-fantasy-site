# Team Builder Shared Model Extraction No-Behavior-Change Proof v1

Generated: 2026-07-18T21:53:39.873Z

Status: **pass**

## Frozen Values

| Check | Value |
| --- | --- |
| Budget | 94.8 / 105 |
| Captain | Mikel Oyarzabal |
| Vice captain | Leandro Paredes |
| Team counts | Argentina 8, Spain 5, France 1, England 1 |
| Fixture counts | final 13, third_place 2 |
| Raw projected | 59.552 |
| Optionality | 5.291 |
| Composite | 1014.93 |

Selected squad remained unchanged: Emiliano Martínez, Unai Simón, Nicolás Tagliafico, Nahuel Molina, Lisandro Martínez, Cristian Romero, Pau Cubarsí, Leandro Paredes, Alexis Mac Allister, Enzo Fernández, Álex Baena, Fabián Ruiz, Kylian Mbappé, Harry Kane, Mikel Oyarzabal.

## QA Evidence

| Gate | Result |
| --- | --- |
| Shared-helper validator | pass, 16 checks |
| Team Builder golden Final Round validator | pass |
| Final Round browser content contract validator | pass |
| Final Round eligible-player validator | pass |
| Local Team Builder browser equivalence | pass |
| Local public preview browser QA | pass |
| Active QA runner | pass, 46/46 |
| Requested syntax checks | pass |
| `git diff --check` | pass |

## Behavior Guardrails

- Public behavior unchanged: yes.
- Model outputs unchanged: yes.
- Optimizer behavior changed: no.
- Candidate eligibility changed: no.
- Artifact loading changed: no.
- Public copy changed: no.
- Public refereeing/conspiracy exposure: none.
- Final Round remains artifact-backed by default.
- No active eliminated-player leakage found by validator; search hits are historical/data-wrapper hits allowed by the active-stage gate.

## Files Deliberately Not Changed

- `data/teamBuilderFinalRoundArtifact_v1.json`
- `teamBuilderFinalRoundArtifactData.js`
- `fantasyPoolRecommendationsData.js`
- `fantasyPoolMatchdayProjectionsData.js`
- `fantasyPoolScorePredictionsData.js`

`script.js` moved from 15,307 lines to 15,305 lines.
