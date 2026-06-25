# Official Fantasy Data Update Check v1

Generated: 2026-06-25T17:37:17.918Z

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
| fifaFantasyPlayersJson | 200 | yes | 2026-06-25T17:20:02Z | 1256515 |
| fifaFantasySquadsJson | 200 | yes | 2026-06-24T03:58:03Z | 6430 |
| fifaFantasyHelpPagesJson | 200 | yes | 2026-06-25T11:05:16Z | 179312 |
| fifaFantasyRoundsJson | 200 | yes | 2026-06-25T16:01:03Z | 103467 |
| fifaFantasyLanguageJson | 200 | yes | 2026-06-25T11:14:41Z | 27459 |

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
| Ownership percent changes | 0 |

## Recommendation

Decision: `minor_change_no_model_rerun_needed`

Reasons:
- Only non-model source headers or ownership-style values changed.

This script is reporting-only. It does not import players, import squads, import rules, rerun models, update browser-ready files, or change Team Builder.

## Player Changes

- Local official fantasy players: 1489
- Live official fantasy players: 1489
- Selectable status counts live: {"playing":1240,"transferred":240,"suspended":8,"injured":1}
- Position counts live: {"DEF":486,"FWD":307,"MID":515,"GK":181}

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

- Help pages hash: `a9ae56a3a5d5ccdf26dbc70bfc6fd4b9bdea6a75b085d1356fd6b78d8a302cf3`
- Language hash: `71e9748e99b99ed13cbf8be48287f63e3ec0be8e73e76c046edb77eceff15c62`
- Rounds hash: `e73b80d760caec0296a37a94c464e5a4d6d116726593b45ae63930f3c190d089`
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
