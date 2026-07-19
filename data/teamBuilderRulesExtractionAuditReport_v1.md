# Team Builder Rules Extraction Audit v1

Status: GREEN

Scope: centralize rules-derived Team Builder limits without changing the generated artifact, public squad, optimizer scoring, candidate ordering, model outputs, projections, recommendations, public copy, or wrappers beyond the helper wrapper itself.

## What moved

`script.js` no longer locally parses the core Team Builder rules for budget, knockout country caps, squad size, position requirements, and allowed formations. Those now flow through `TEAM_BUILDER_PUBLIC_HELPERS.getTeamBuilderRulesConfig()` and focused accessors for budget, country cap, squad size, position rules, formation rules, starter/bench rules, captain rules, and lock/removal rules.

Line count: `script.js` moved from `15351` to `15258` lines.

## Rule sources

| Rule | Value | Source |
| --- | ---: | --- |
| Budget limit | 105 | Current implementation backed; official rules data gives 100 + 5 knockout increase and the active artifact records 105. |
| Country/team cap | 8 | Current implementation backed; official rules data and artifact both record Final Round cap 8. |
| Squad size | 15 | Official rules data backed and current implementation backed. |
| Starters | 11 | Official rules data backed and current implementation backed. |
| Bench | 4 | Derived from 15 - 11. |
| Position requirements | GK 2, DEF 5, MID 5, FWD 3 | Official rules data backed and artifact confirmed. |
| Active formation | 4-3-3 | Official allowed formation, artifact confirmed. |
| Captain/vice | required, selected, starters, different, non-GK | Official rules data plus current validator contract. |
| Locks/removals | locked present, excluded absent, live state manual | Current browser state plus manual FIFA lock caveat. |

## Answers

- Browser budget source: shared rules config.
- Browser country/team cap source: shared rules config.
- Browser formation and position source: shared rules config with code and browser-label maps.
- Browser squad size source: shared squad-size rules helper.
- Browser captain/vice source: shared captain rules helper plus existing captain/vice validator.
- Duplicated rule values remaining: frozen golden assertions only.
- Risky hardcoded values remaining: optimizer scoring/ranking and captain ranking are intentionally not touched.

## Recommendation

Commit this refactor only if all QA gates pass. The next cleanup should still avoid scoring and captain ranking until exact score fixtures exist.
