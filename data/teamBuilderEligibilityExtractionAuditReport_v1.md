# Team Builder Eligibility Extraction Audit v1

Generated: 2026-07-18T22:14:25.691Z

Status: **green pending full QA**

## Scope

This pass centralizes only Final Round Team Builder eligibility: fixture-authority teams plus active Final Round projection availability. It does not change model outputs, generated artifacts, scoring, optimizer ordering, locks, substitutions, risk controls, price filters, public copy, or public data wrappers.

## Direct Answers

| Question | Answer |
| --- | --- |
| Where does browser Team Builder decide eligibility? | `script.js:getActiveStageEligibleTeams`, `recordMatchesActiveStageEligibleTeam`, `playerHasActiveMatchdayProjection`, and `playerAllowedForActiveMatchday`; these gate picker, fill candidates, optimizer pools, locked players, and analytics. |
| Where do validators decide eligibility? | `validateFinalRoundEligiblePlayersV1`, `validateTeamBuilderGoldenFinalRoundV1`, `validateFinalRoundBrowserContentContractV1`, and the new `validateTeamBuilderEligibilityHelpersV1`. |
| Are those rules identical? | Yes for fixture-authority team eligibility and active projection availability. Downstream risk, trust, price, lock, country, and optimizer filters remain separate. |
| Are any rules hardcoded? | Production helpers derive eligible teams from fixture authority. Validators intentionally freeze France, England, Spain, Argentina and Brazil/Colombia regression examples. |
| Historical fallback? | Active Final Round Team Builder eligibility admits no historical fallback candidates. |
| Fantasy points as proxy? | No. Eligibility does not use fantasy points as starter evidence. |
| Eliminated teams blocked by what? | Fixture authority, with string blocklists only as regression assertions. |
| Safe to extract now? | Pure fixture authority normalization, active projection availability, eligibility decisions, candidate filtering, and no-eliminated assertions. |

## Completed Extraction

| Logic | Shared helper location | Browser call site | Risk |
| --- | --- | --- | --- |
| Fixture-authority eligible teams and fixture teams | `scripts/lib/teamBuilderPublicModel.mjs:194-233`, `teamBuilderPublicHelpers.js:194-233` | `script.js:391-405` | Low |
| Final Round team matching | `scripts/lib/teamBuilderPublicModel.mjs:235-249`, `teamBuilderPublicHelpers.js:235-249` | `script.js:399-405` | Low |
| Active projection availability | `scripts/lib/teamBuilderPublicModel.mjs:251-270`, `teamBuilderPublicHelpers.js:251-270` | `script.js:408-413` | Low |
| Candidate decision/filter/assertion helpers | `scripts/lib/teamBuilderPublicModel.mjs:272-344`, `teamBuilderPublicHelpers.js:272-344` | `script.js:416-425` | Low |

`script.js` line count moved from 15,305 to 15,273, for a 32-line reduction.

## Candidate Counts

The shared eligibility pool has 104 players: France 26, Spain 26, Argentina 26, England 26. Existing Team Builder QA/browser candidate count remains 101 after downstream filters: Argentina 25, Spain 26, France 26, England 24. The 3-player delta belongs to non-eligibility filters, so it is reported but not treated as an eligibility failure.

## Kept In Place

- Optimizer scoring, ranking, and objective logic.
- Lock/substitution behavior.
- Trust, risk, price, country, search, and position filters.
- Generated artifact loading and default artifact-backed rendering.
- Picks, Captain Watchlist, and Player Profile rendering.

## Rollback Plan

1. Restore local eligibility logic in `script.js`.
2. Remove the new eligibility helper exports from `scripts/lib/teamBuilderPublicModel.mjs` and `teamBuilderPublicHelpers.js`.
3. Revert validator imports to their prior local fixture-authority extraction.
4. Remove `scripts/validateTeamBuilderEligibilityHelpersV1.mjs` from the active-stage manifest.
5. Remove the generated eligibility QA, audit, and no-behavior-change proof artifacts.

## Remaining Cleanup

- Deeper optimizer-loop extraction.
- Generated-artifact builder/browser unification.
- Final code elegance audit.
