# Team Builder Artifact Browser Unification Audit v1

Generated: 2026-07-19T01:20:00.000Z

Status: **green**

## Direct Answers

| Question | Answer |
| --- | --- |
| Which script creates `data/teamBuilderFinalRoundArtifact_v1.json`? | `scripts/lib/finalRoundArtifacts.mjs` `writeBrowserArtifacts`, using `buildTeamBuilderArtifact(buildTeamBuilder(...))`. |
| Which script creates `teamBuilderFinalRoundArtifactData.js`? | `scripts/lib/finalRoundArtifacts.mjs` `writeBrowserArtifacts`, through `publicWrapperText("teamBuilderArtifact", slimTeamBuilderArtifact)`. |
| What is the browser default path? | `script.js` `buildTeam` uses `generatedFinalRoundBalancedSquad()` first when `defaultFinalRoundArtifactInputsActive()` is true. |
| What is the browser lock/substitution path? | `script.js` `buildSuggestedSquad`, lock/remove state, export/render flows, and `swapStarterWithBench` remain browser-only user interaction. |
| Should the main optimizer loop be extracted now? | No. The loop combines candidate search, scoring, risk/trust controls, tie-breaking, and user state that still needs isolated fixtures. |

## Generated But Not Browser

- Static Final Round artifact generation.
- Final Round strategic-composite objective construction.
- `rawRowScore`, `strategicRowScore`, and static search in `buildSquadByScore`.
- `rawExpectedPointsSquad`, omitted-player diagnostics, and slim public wrapper emission.

## Browser But Not Generated

- DOM state and rendering.
- Locks, removals, country/price/trust/minutes/start/risk filters.
- Substitution advisor, starter-bench swaps, saved export/import state, and manual captain state.

## Safe Decision

No public files, model outputs, public wrappers, or Team Builder behavior were changed. The audit recommends readiness validation and documentation only; deeper unification should wait for isolated optimizer fixtures that cover path search, scoring, tie-breaking, and user-state divergence.
