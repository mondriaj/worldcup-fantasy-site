# Team Builder Golden Final Round v1

Status: frozen QA fixture

## Purpose

This golden file protects the Final Round Team Builder from accidental behavior changes during optimizer extraction and shared-model refactors. It freezes the public default squad, budget, team mix, fixture mix, captain/vice choices, and objective score outputs that were GREEN after the artifact-backed browser fix.

## Frozen Values

| Metric | Value |
| --- | --- |
| Active stage | finalRound |
| Budget | 94.8 / 105 |
| Team counts | Argentina 8, Spain 5, France 1, England 1 |
| Fixture counts | final 13, third_place 2 |
| Captain | Mikel Oyarzabal |
| Vice captain | Leandro Paredes |
| Raw projected points | 59.552 |
| Optionality score | 5.291 |
| Composite score | 1014.93 |
| Eligible teams | France, England, Spain, Argentina |

## Frozen Squad

Emiliano Martínez, Unai Simón, Nicolás Tagliafico, Nahuel Molina, Lisandro Martínez, Cristian Romero, Pau Cubarsí, Leandro Paredes, Alexis Mac Allister, Enzo Fernández, Álex Baena, Fabián Ruiz, Kylian Mbappé, Harry Kane, Mikel Oyarzabal.

## Why It Should Fail

The golden validator should fail during accidental refactors if any selected player changes, captain/vice changes, budget shifts, objective scores drift beyond tolerance, fixture/team counts change, the browser wrapper diverges from the artifact, or eliminated-player guardrails regress.

## Intentional Updates

If this failure is intentional after a model change, regenerate the golden file and explain the model change in a separate commit. Do not update the fixture in the same commit as optimizer extraction or public wiring cleanup.
