# Team Builder Eligibility Extraction No-Behavior-Change Proof v1

Generated: 2026-07-18T22:24:08.264Z

Status: **pass**

## Summary

This refactor centralizes Final Round Team Builder eligibility around fixture authority and active Final Round projection availability. It does not change model outputs, generated artifacts, optimizer scoring, candidate scoring, artifact loading, public copy, or public data wrappers.

## Protected Values

| Value | Result |
| --- | --- |
| Budget | 94.8 / 105 |
| Captain | Mikel Oyarzabal |
| Vice captain | Leandro Paredes |
| Team counts | Argentina 8, Spain 5, France 1, England 1 |
| Fixture counts | final 13, third_place 2 |
| Raw projected points | 59.552 |
| Optionality score | 5.291 |
| Composite score | 1014.93 |
| Selected squad | Emiliano Martínez, Unai Simón, Nicolás Tagliafico, Nahuel Molina, Lisandro Martínez, Cristian Romero, Pau Cubarsí, Leandro Paredes, Alexis Mac Allister, Enzo Fernández, Álex Baena, Fabián Ruiz, Kylian Mbappé, Harry Kane, Mikel Oyarzabal |

## Eligibility Proof

| Check | Result |
| --- | --- |
| Eligible teams from fixture authority | France, England, Spain, Argentina |
| Final fixture teams | Spain, Argentina |
| Third-place fixture teams | France, England |
| Shared eligibility candidates | 104 |
| Existing Team Builder QA candidates after downstream filters | 101 |
| Downstream filter delta | 3 |
| Eliminated candidate count | 0 |
| Candidates missing active projections | 0 |
| Historical fallback candidates | 0 |

The 104-to-101 candidate delta is expected because this extraction covers only fixture-authority and active-projection eligibility. Existing downstream filters for risk, trust, price, locks, and optimizer constraints remain unchanged.

## QA Evidence

| Gate | Result |
| --- | --- |
| Eligibility helper validator | pass, 15 checks |
| Golden Team Builder validator | pass |
| Local Team Builder browser equivalence | pass |
| Local public preview browser QA | pass |
| Active-stage manifest runner | pass, 48/48 |
| Console errors | 0 |
| Blocking failed requests | 0 |

## Public Behavior

| Surface | Result |
| --- | --- |
| Public behavior unchanged | yes |
| Model outputs unchanged | yes |
| Optimizer behavior changed | no |
| Artifact loading changed | no |
| Candidate scoring changed | no |
| Public copy changed | no |
| Public data wrappers changed | no |
| Public refereeing/conspiracy exposure | no |

## File Scope

`script.js` moved from 15,305 lines to 15,273 lines by replacing local eligibility extraction and active projection guards with shared helper calls. Public helper code changed only to expose the same pure eligibility rules used by Node validators.

Unchanged model output paths:

- `data/teamBuilderFinalRoundArtifact_v1.json`
- `teamBuilderFinalRoundArtifactData.js`
- `fantasyPoolRecommendationsData.js`
- `fantasyPoolMatchdayProjectionsData.js`
- `fantasyPoolScorePredictionsData.js`
