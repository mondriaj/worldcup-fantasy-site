# Team Builder Duplication Map v1

Status: GREEN

## Map

| Area | State | Risk | Recommendation |
| --- | --- | --- | --- |
| Strategy copy, labels, aliases | Centralized | Low | Keep shared helper coverage. |
| Final-round eligible teams | Centralized | Low | Keep active leakage checks in manifest QA. |
| Active projection presence | Centralized | Low | Keep browser and Node helper parity checks. |
| Artifact summary and objective display | Centralized | Low | Keep golden summary assertions. |
| Selected squad constraints | Partially centralized | Medium | Keep shared pure validators; avoid growing browser adapter glue. |
| Country and budget limits by matchday | Duplicated | Medium-high | Good next extraction target. |
| Formation and squad requirement parsing | Duplicated | Medium | Extract with budget/country rule derivation if fixtures stay stable. |
| Optimizer scoring and ranking | Duplicated | High | Defer until exact score fixtures exist. |
| Captain and vice-captain ranking | Duplicated | High | Defer until ranking fixtures exist. |
| Browser helper wrapper | Manual mirror | Medium-high | Prefer generated or sync-checked wrapper next. |
| Validator report formatting | Intentionally local | Low | Accept as test-only duplication. |

## Conclusion

The helper stack reduced meaningful duplication in eligibility, copy, artifact summary, and pure constraint checks. The remaining risky duplication is concentrated in two places: rules-derived browser limits and behavior-sensitive scoring/ranking. The wrapper mirror is also a maintenance risk, but current validators make it safe enough for now.
