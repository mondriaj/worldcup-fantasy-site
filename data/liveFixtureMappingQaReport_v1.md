# Live Fixture Mapping QA v1

Generated: 2026-06-15T23:11:08.613Z

Status: passed

## Summary

- Total local fixtures: 72
- Total live fixtures: 72
- Total score-prediction fixtures: 72
- Matched fixtures: 72
- Final fixtures shown: 14
- In-progress fixtures suppressed: 1
- Scheduled fixtures: 57
- Unmatched fixtures: 0
- Ambiguous fixtures: 0
- Reversed mappings: 0

Mapping status counts:

- matched: 72

Mapping orientation counts:

- direct: 72

## Regression Examples

- spain_cabo_verde: passed (Spain vs Cabo Verde, source 13, complete, final, score 0-0)
- saudi_arabia_uruguay: passed (Saudi Arabia vs Uruguay, source 15, playing, not_final_hidden, score none)
- ir_iran_new_zealand: passed (IR Iran vs New Zealand, source 16, scheduled, not_final_hidden, score none)

## Browser Lookup Checks

- script.js uses live data global: yes
- worldCupPage.js uses live data global: yes
- script.js has safe mapping guard: yes
- worldCupPage.js has safe mapping guard: yes
- script.js live lookup avoids raw source ids: yes
- worldCupPage.js live lookup avoids raw source ids: yes

## Errors

None

## Warnings

None

## Manual Spot Checks

- Early sample: Match 1 Mexico vs South Africa maps to fwc2026-m001 and score-prediction team pair.
- Middle sample: Match 14 Spain vs Cabo Verde maps to fwc2026-m014 and does not attach to Match 13 or Match 15.
- Late sample: Match 72 Congo DR vs Uzbekistan maps by round/team pair rather than source fixture order.
