# Official Final Round Rollover Audit v1

Generated: 2026-07-18T02:22:11.323Z

## Verdict

Status: `GREEN`

The observed status-change count was not reproduced from the working snapshot.

## Snapshot Comparisons

| Comparison | Local rows | Live rows | New | Removed | Name | Price | Position | Status | Team | FIFA ID | Ownership |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Restored working snapshot vs live | 1489 | 1489 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 |
| Committed previous snapshot vs live | 1489 | 1489 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 209 |

Ownership changes are reported for monitoring only and are not model signal.

## Final Round Fixtures From Live Feed

- Third Place: France v England
- Final: Spain v Argentina

## Status Change Classification

None

## New Player Triage

| ID | Name | Team | Status | Team status | Price | Position | Identity | Action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2073 | Éderson José dos Santos Lourenço da Silva | Brazil | eliminated | eliminated before Final Round | 6.3 | MID | mapped_thin_profile | Team is outside Final and Third Place; safely excluded from Final Round model pool. |
| 2074 | Lutsharel Geertruida | Netherlands | eliminated | eliminated before Final Round | 4.3 | DEF | mapped_thin_profile | Team is outside Final and Third Place; safely excluded from Final Round model pool. |
| 2075 | Dejan Ljubicic | Austria | eliminated | eliminated before Final Round | 5 | MID | mapped_thin_profile | Team is outside Final and Third Place; safely excluded from Final Round model pool. |
| 2076 | Shuto Machino | Japan | eliminated | eliminated before Final Round | 4.8 | FWD | mapped_thin_profile | Team is outside Final and Third Place; safely excluded from Final Round model pool. |
| 2077 | Garven Metusala | Haiti | eliminated | eliminated before Final Round | 3.5 | DEF | mapped_thin_profile | Team is outside Final and Third Place; safely excluded from Final Round model pool. |
| 2078 | Trevoh Chalobah | England | playing | in Third Place | 4.5 | DEF | mapped_thin_profile | Final Round team player has a staged thin identity only; safe only with explicit exclusion/caution or source-backed manual projection coverage. |
| 2079 | Arjan Malic | Bosnia and Herzegovina | eliminated | eliminated before Final Round | 3.7 | DEF | missing_identity_map_row | Team is outside Final and Third Place; safely excluded from Final Round model pool. |

## Name Change Triage

| ID | Old | New | Team | Identity | Stable | Action |
| --- | --- | --- | --- | --- | --- | --- |
| 1311 | Abduvokhid Ne'matov | Abduvokhid Nematov | Uzbekistan | mapped | yes | Stable official fantasy ID; display-name variant is safe for identity joins. |

## Committed Snapshot Status Changes

| ID | Name | Team | Old | New | Team status | Identity | Reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1708 | Jarell Quansah | England | suspended | playing | in Third Place | mapped | Final Round team player has complete official fantasy metadata and stable identity mapping. |

## Warnings

None

## Blockers

None
