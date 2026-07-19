# Final Technical Debt Register v1

Status: **GREEN / defer behavior-sensitive work**

| Item | Value | Risk | Recommended timing | Required before current Final Round public use? | Defer? |
| --- | --- | --- | --- | --- | --- |
| Optimizer scoring extraction | Would reduce `script.js` size and align browser optimizer logic with Node fixtures. | High. Scoring, tie-breaking, and candidate ordering are public-behavior-sensitive. | Later, after exact score fixtures cover path search, strategy weights, tie-breaks, locked players, removals, and user-state divergence. | No | Yes |
| Captain/vice ranking extraction | Would centralize captain logic and reduce future drift. | High. Captain/vice ordering is visible and frozen by golden assertions. | Later, alongside optimizer extraction fixtures. | No | Yes |
| Generated-artifact builder/browser unification implementation | Would make the browser consume more artifact-derived state and reduce duplicate implementation. | Medium. The default is already artifact-backed; user interaction paths still need careful divergence handling. | Later, after unification fixtures cover locks, removals, price filters, and strategy comparisons. | No | Yes |
| Further `script.js` reduction | Would improve maintainability. | Medium. Large functions are heavily user-facing and easy to perturb. | Incrementally, one validator-backed slice at a time. | No | Yes |
| Public payload cleanup if more savings exist | Could improve load time. | Medium. Slimming can accidentally remove fields used by browser views. | Later, only through the public payload contract and browser QA. | No | Yes |
| Browser helper wrapper generation from Node helper | Would reduce drift between `scripts/lib/teamBuilderPublicModel.mjs` and `teamBuilderPublicHelpers.js`. | Medium. Build tooling must preserve the static-site architecture and browser globals. | Good next maintainability pass after current public use. | No | Yes |
| Post-tournament refereeing section decision | Could become a separate analysis product if deliberately published. | High. Currently private and potentially sensitive; accidental exposure is unacceptable. | Only after an explicit product/editorial decision and separate publication review. | No | Yes |
| Official final squad source-backing if available | Would strengthen trust and reduce caveats. | Medium. Requires current source validation and data sync. | Only when official final squads are available and verified through official-data readiness gates. | No | Yes |
| User locks/substitutions/boosters import if ever supported | Would improve in-game personalization and legality checks. | High. Live state and official game rules are volatile and need verified integrations. | Future feature, not a cleanup task. | No | Yes |

## Recommendation

Defer optimizer scoring extraction and captain/vice ranking extraction. The current Final Round public use case is better served by preserving the artifact-backed default, frozen golden values, and deployed QA coverage.
