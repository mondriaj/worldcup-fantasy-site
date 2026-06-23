# MD2 Status Change Actionability v1

Generated: 2026-06-23T13:40:46.805Z

Status: passed

## Summary

| Metric | Value |
| --- | --- |
| Tracked selectable-status changes | 10 |
| Explicitly tracked status changes | 10 |
| Detected from previous commit | 2 |
| Imported current statuses matched expected | 10 / 10 |
| MD2 actionable changes | 0 |
| MD3-relevant only changes | 10 |
| Unknown/caution changes | 0 |
| Official monitor status | completed |
| Official monitor rerun decision | no_change |
| Live completed fixtures | 44 |
| Live playing fixtures | 0 |
| Live scheduled fixtures | 28 |

## Actionability

| ID | Player | Team | Status Change | Source | MD2 Fixture | Fixture Status | MD2 Actionable | MD3 Defer |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 123 | Nathan Ngoy | Belgium | playing -> suspended | explicit_tracking,previous_commit_diff | Belgium vs IR Iran | completed | no | yes |
| 141 | Tarik Muharemovic | Bosnia and Herzegovina | playing -> suspended | explicit_tracking | Switzerland vs Bosnia and Herzegovina | completed | no | yes |
| 203 | Sidny Lopes Cabral | Cabo Verde | playing -> suspended | explicit_tracking,previous_commit_diff | Uruguay vs Cabo Verde | completed | no | yes |
| 245 | Ismaël Koné | Canada | playing -> injured | explicit_tracking | Canada vs Qatar | completed | no | yes |
| 741 | César Montes | Mexico | suspended -> playing | explicit_tracking | Mexico vs Korea Republic | completed | no | yes |
| 901 | Miguel Almirón | Paraguay | playing -> suspended | explicit_tracking | Türkiye vs Paraguay | completed | no | yes |
| 947 | Assim Omer Al Haj Madibo | Qatar | playing -> suspended | explicit_tracking | Canada vs Qatar | completed | no | yes |
| 1058 | Teboho Mokoena | South Africa | playing -> suspended | explicit_tracking | Czechia vs South Africa | completed | no | yes |
| 1062 | Sphephelo S'Miso Sithole | South Africa | suspended -> playing | explicit_tracking | Czechia vs South Africa | completed | no | yes |
| 1506 | Homam El Amin Mohamed Ahmed | Qatar | playing -> suspended | explicit_tracking | Canada vs Qatar | completed | no | yes |

## Decision

No tracked status changes are actionable for remaining MD2 decisions. Do not rebuild the MD2 player-side stack from these changes.

## Notes

- Ownership movement is not used as model signal.
- Completed or playing MD2 fixture changes are recorded for MD3 preparation only.
- Scheduled/not-started MD2 fixture changes are the only status changes allowed to trigger a targeted MD2 player-side rebuild.
- Tracked changes include explicit MD2 status tracking plus selectable-status differences detected against the previous committed official player artifact.
- This artifact does not claim source-backed final squads.
