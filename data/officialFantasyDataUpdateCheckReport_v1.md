# Official Fantasy Data Update Check v1

Generated: 2026-06-18T12:07:44.613Z

## Summary

| Item | Result |
| --- | --- |
| Official data changed | yes |
| Rerun decision | minor_change_no_model_rerun_needed |
| Model outputs updated | no |
| Final squad status | still_blocked_no_source_backed_final_squads |
| Fetch failures | 0 |

## Source Checks

| Source | HTTP | Parsed | Last-Modified | Bytes |
| --- | --- | --- | --- | --- |
| fifaFantasyPlayersJson | 200 | yes | 2026-06-18T12:04:22Z | 1165055 |
| fifaFantasySquadsJson | 200 | yes | 2026-06-18T04:02:03Z | 6430 |
| fifaFantasyHelpPagesJson | 200 | yes | 2026-05-29T09:05:39Z | 179308 |
| fifaFantasyRoundsJson | 200 | yes | 2026-06-18T10:01:03Z | 87297 |
| fifaFantasyLanguageJson | 200 | yes | 2026-06-03T13:21:47Z | 27057 |

## Change Counts

| Check | Count |
| --- | --- |
| New fantasy players | 0 |
| Removed fantasy players | 0 |
| Price changes | 0 |
| Position changes | 0 |
| Selectable status changes | 0 |
| Country/team changes | 0 |
| Squad metadata changes | 0 |
| Rules source/header changes | 0 |
| Deadline/round changes | 0 |
| Clean Sheet Shield text changes | 0 |
| Ownership percent changes | 41 |

## Recommendation

Decision: `minor_change_no_model_rerun_needed`

Reasons:
- Only non-model source headers or ownership-style values changed.

This script is reporting-only. It does not import players, import squads, import rules, rerun models, update browser-ready files, or change Team Builder.

## Player Changes

- Local official fantasy players: 1488
- Live official fantasy players: 1488
- Selectable status counts live: {"playing":1245,"transferred":240,"suspended":3}
- Position counts live: {"DEF":485,"FWD":307,"MID":515,"GK":181}

No player import-field changes found.

## Squad Metadata Changes

- Local teams: 48
- Live teams: 48
- Live squad metadata fields: abbr, group, id, isEliminated, name
- Explicit final-squad-status source field found: no

Candidate fields that may be useful for status auditing but do not prove final squads:
- player.fifaId
- player.matchStatus
- player.status
- round.status
- round.tournaments[].status
- squad.isEliminated

## Rules, Rounds, and Clean Sheet Shield

- Help pages hash: `192427fcd9b60cb9f7b8f8d38cf881dc712ff7379371aa3c124ed0a4fe100a58`
- Language hash: `18e6b9114fdff3dbd7c28cd20c0f0a597442e9d7dd2372e13abf0e3ca846b9ac`
- Rounds hash: `b8cd1ff94ee4c108c9b65c4898474671fb82f66889e4d250f7f8c5856873f575`
- Clean Sheet Shield text changed vs imported rules: no
- Live Clean Sheet Shield header: Clean Sheet Shield
- Live Clean Sheet Shield description: Activate the Clean Sheet Shield to gain an edge in any of the Knockout stages. Any goalkeeper, defender, or midfielder in your team will only lose their clean sheet after conceding 2 goals.
- Imported Clean Sheet Shield effect: Activate the Clean Sheet Shield to gain an edge in any of the Knockout stages. Any goalkeeper, defender, or midfielder in your team will only lose their clean sheet after conceding 2 goals.

No deadline/round value changes found against imported rules.

## Source Manifest Coverage

| Source | Present in manifest | Manifest entries |
| --- | --- | --- |
| fifaFantasyPlayersJson | yes | official_squads/fifaFantasyPlayersJson |
| fifaFantasySquadsJson | yes | official_squads/fifaFantasySquadsJson |
| fifaFantasyHelpPagesJson | yes | official_fantasy_rules/fifaFantasyHelpPagesJson |
| fifaFantasyRoundsJson | yes | official_fantasy_rules/fifaFantasyRoundsJson |
| fifaFantasyLanguageJson | yes | official_fantasy_rules/fifaFantasyLanguageJson |

## Final Squad Blocker

Final squad status remains blocked. The live fantasy player feed still confirms fantasy-pool membership, not source-backed final squad membership. No final model rerun or Team Builder promotion should start from this check alone.
