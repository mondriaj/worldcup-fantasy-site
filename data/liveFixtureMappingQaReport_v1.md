# Live Fixture Mapping QA v1

Generated: 2026-07-18T02:29:18.905Z

Status: passed

## Summary

- Total local fixtures: 102
- Group-stage local fixtures: 72
- R32 authority fixtures: 16
- R16 final-known authority fixtures: 8
- QF final-known authority fixtures: 4
- SF final-known authority fixtures: 2
- Total live fixtures: 104
- Group-stage live fixtures: 72
- Extra non-group live fixtures: 32
- Total score-prediction fixtures: 102
- R32 score-prediction fixtures: 88
- R16 score-prediction fixtures: 8
- QF score-prediction fixtures: 4
- SF score-prediction fixtures: 2
- Matched fixtures: 102
- Final fixtures shown: 102
- In-progress fixtures suppressed: 0
- Scheduled fixtures: 2
- Unmatched fixtures: 2
- Ambiguous fixtures: 0
- Reversed mappings: 0

Mapping status counts:

- matched: 102
- unmatched: 2

Mapping orientation counts:

- direct: 102
- unknown: 2

## Regression Examples

- spain_cabo_verde: passed (Spain vs Cabo Verde, source 13, complete, final, score 0-0)
- saudi_arabia_uruguay: passed (Saudi Arabia vs Uruguay, source 15, complete, final, score 1-1)
- ir_iran_new_zealand: passed (IR Iran vs New Zealand, source 16, complete, final, score 2-2)

## Browser Lookup Checks

- script.js uses live data global: yes
- worldCupPage.js uses live data global: yes
- script.js has safe mapping guard: yes
- worldCupPage.js has safe mapping guard: yes
- script.js uses canonical local fixture lookup: yes
- worldCupPage.js uses canonical local fixture lookup: yes
- script.js live lookup avoids raw source ids: yes
- worldCupPage.js live lookup avoids raw source ids: yes
- script.js live lookup avoids direct numeric keys: yes
- worldCupPage.js live lookup avoids direct numeric keys: yes

## Display Lookup Audit

- Match Environment / Score Prediction rows: score-prediction fixture_id/match_id is normalized to the canonical local fixture key, matched against live resolved_local_fixture_key/local_fixture_id, then rechecked against home/away team names before showing an actual score.
- world-cup.html fixture rows: local match_number is converted to the canonical local fixture key, matched against the same live resolved_local_fixture_key/local_fixture_id, then rechecked against the local fixture home/away team names.
- Matchday Desk fixture list: filters static live fixtures by round_id and shows fixture scores only through isSafeMappedFinalFixture; in-progress and scheduled scores remain hidden.
- Saved squad timeline and decision tools: player points and matchStatus are matched by official fantasy player ID; unfinished fixture round points are suppressed by the live importer.
- Player Profile fixture context and Team Builder fixture risk context: continue to use model projection fixture IDs for prediction context and do not display live actual scores there.
- Raw FIFA fixture IDs: retained only as source_fixture_id/source_fixture_order audit metadata in generated live data and not referenced by public browser lookup helpers.

## Errors

None

## Warnings

None

## Manual Spot Checks

- Early sample: Match 1 Mexico vs South Africa maps to fwc2026-m001 and score-prediction team pair.
- Middle sample: Match 14 Spain vs Cabo Verde maps to fwc2026-m014 and does not attach to Match 13 or Match 15.
- Late sample: Match 72 Congo DR vs Uzbekistan maps by round/team pair rather than source fixture order.
