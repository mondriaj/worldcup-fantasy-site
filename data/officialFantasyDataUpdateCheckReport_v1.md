# Official Fantasy Data Update Check v1

Generated: 2026-06-17T22:33:16.815Z

## Summary

| Item | Result |
| --- | --- |
| Official data changed | yes |
| Rerun decision | full_model_rerun_recommended |
| Model outputs updated | no |
| Final squad status | still_blocked_no_source_backed_final_squads |
| Fetch failures | 0 |

## Source Checks

| Source | HTTP | Parsed | Last-Modified | Bytes |
| --- | --- | --- | --- | --- |
| fifaFantasyPlayersJson | 200 | yes | 2026-06-17T22:04:22Z | 1167054 |
| fifaFantasySquadsJson | 200 | yes | 2026-05-13T10:08:23Z | 6430 |
| fifaFantasyHelpPagesJson | 200 | yes | 2026-05-29T09:05:39Z | 179308 |
| fifaFantasyRoundsJson | 200 | yes | 2026-06-17T22:01:03Z | 86421 |
| fifaFantasyLanguageJson | 200 | yes | 2026-06-03T13:21:47Z | 27057 |

## Change Counts

| Check | Count |
| --- | --- |
| New fantasy players | 6 |
| Removed fantasy players | 0 |
| Price changes | 0 |
| Position changes | 0 |
| Selectable status changes | 16 |
| Country/team changes | 0 |
| Squad metadata changes | 0 |
| Rules source/header changes | 0 |
| Deadline/round changes | 1 |
| Clean Sheet Shield text changes | 0 |
| Ownership percent changes | 421 |

## Recommendation

Decision: `full_model_rerun_recommended`

Reasons:
- Official fantasy player import fields changed.
- Official rules, rounds, deadlines, or Clean Sheet Shield text changed.

This script is reporting-only. It does not import players, import squads, import rules, rerun models, update browser-ready files, or change Team Builder.

## Player Changes

- Local official fantasy players: 1482
- Live official fantasy players: 1488
- Selectable status counts live: {"playing":1245,"transferred":240,"suspended":3}
- Position counts live: {"DEF":485,"FWD":307,"MID":515,"GK":181}

- Status: Marcos Senesi (29) transferred -> playing
- Status: Tino Livramento (459) playing -> transferred
- Status: Leverton Pierre (570) playing -> transferred
- Status: Mohammad Ahmed Mohammad Taha (696) transferred -> playing
- Status: César Montes (741) playing -> suspended
- New player: Éderson José dos Santos Lourenço da Silva (Brazil, 2073)
- New player: Lutsharel Geertruida (Netherlands, 2074)
- New player: Dejan Ljubicic (Austria, 2075)
- New player: Shuto Machino (Japan, 2076)
- New player: Garven Metusala (Haiti, 2077)

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
- Rounds hash: `6495dec818f45bae01675fc326b67591ea92e2463540f91346459ea0c4b9d7a0`
- Clean Sheet Shield text changed vs imported rules: no
- Live Clean Sheet Shield header: Clean Sheet Shield
- Live Clean Sheet Shield description: Activate the Clean Sheet Shield to gain an edge in any of the Knockout stages. Any goalkeeper, defender, or midfielder in your team will only lose their clean sheet after conceding 2 goals.
- Imported Clean Sheet Shield effect: Activate the Clean Sheet Shield to gain an edge in any of the Knockout stages. Any goalkeeper, defender, or midfielder in your team will only lose their clean sheet after conceding 2 goals.

Deadline/round changes:
- MD1 status: scheduled -> playing

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
