# Final Round Builder Artifact Browser Mismatch v1

Status: resolved

## Required Answers

| Question | Answer |
| --- | --- |
| Mismatch reproduced | yes |
| Browser output equals generated artifact after fix | yes |
| Exact root cause known | The Node artifact optimizer and browser Team Builder used separate source-of-truth logic. scripts/lib/finalRoundArtifacts.mjs generated a Final Round strategic-composite squad, while script.js built the public default through buildSuggestedSquad, optimizerStateRank, teamBuilderStrategyPlayerScore, and portfolioOptimizerAdjustment with different MD3-era weights/search pruning. The browser also treated Final Round as the base 100 budget instead of applying the official +5 knockout budget increase. |
| Public users affected before fix | yes |
| Previous QA insufficient | yes |

## Before Fix

| Metric | Generated | Browser |
| --- | --- | --- |
| Selected count by team | {"France":2,"England":1,"Spain":4,"Argentina":8} | {"France":1,"Spain":7,"England":0,"Argentina":7} |
| Selected count by fixture | {"third_place":3,"final":12} | {"third_place":1,"final":14} |
| Selected total price | 100.4 of 105 | browser used separate build |
| Selected players | ["Mike Maignan","Unai Simón","Cristian Romero","Nahuel Molina","Nicolás Tagliafico","Lisandro Martínez","Pedro Porro","Leandro Paredes","Alexis Mac Allister","Enzo Fernández","Álex Baena","Lamine Yamal Nasraoui Ebana","Kylian Mbappé","Harry Kane","Lionel Messi"] | ["Lionel Messi","Julián Alvarez","Mikel Oyarzabal","Alexis Mac Allister","Enzo Fernández","Fabián Ruiz","Lisandro Martínez","Nicolás Tagliafico","Marc Cucurella","Aymeric Laporte","Emiliano Martínez","Unai Simón","Pau Cubarsí","Rodrigo Hernández Cascante","Adrien Rabiot"] |

## After Fix

| Metric | Generated | Browser |
| --- | --- | --- |
| Selected count by team | {"Argentina":8,"Spain":5,"France":1,"England":1} | {"France":1,"England":1,"Spain":5,"Argentina":8} |
| Selected count by fixture | {"final":13,"third_place":2} | {"third_place":2,"final":13} |
| Selected total price | 94.8 | matches generated artifact |
| Selected players | ["Emiliano Martínez","Unai Simón","Nicolás Tagliafico","Nahuel Molina","Lisandro Martínez","Cristian Romero","Pau Cubarsí","Leandro Paredes","Alexis Mac Allister","Enzo Fernández","Álex Baena","Fabián Ruiz","Kylian Mbappé","Harry Kane","Mikel Oyarzabal"] | ["Kylian Mbappé","Harry Kane","Mikel Oyarzabal","Leandro Paredes","Alexis Mac Allister","Enzo Fernández","Nicolás Tagliafico","Nahuel Molina","Lisandro Martínez","Cristian Romero","Emiliano Martínez","Unai Simón","Pau Cubarsí","Álex Baena","Fabián Ruiz"] |
| Message |  | Balanced Squad loaded for the Final Round: 11 starters on the field and 4 substitutes below. Projection 59.6; optionality 5.3; squad score 1014.9. |
| Optionality |  | Optionality Score 5.3 earlier kickoff flexibility; verify official locks |

## Responsible Files And Functions

- scripts/lib/finalRoundArtifacts.mjs buildTeamBuilder
- script.js buildSuggestedSquad
- script.js optimizerStateRank
- script.js teamBuilderStrategyPlayerScore
- script.js portfolioOptimizerAdjustment
