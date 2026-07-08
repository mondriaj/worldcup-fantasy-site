# QF Lineup Evidence Audit v1

Generated: 2026-07-08T14:58:27.790Z

Status: pass

## Findings

| Finding | Severity | Summary |
| --- | --- | --- |
| legacy_points_only_start_inference | high | Legacy QF role logic used R16 fantasy round points as participation evidence and lifted start probability from that signal. |
| facundo_medina_core_pick | high | Facundo Medina appeared in the legacy QF recommendation surface despite being source-backed as an R16 non-starter. |
| current_core_pick_gate | none | Current Core Picks must have explicit R16 starter evidence and must not rely on points-only appearance evidence. |

## Before Repair Snapshot

| Metric | Value |
| --- | --- |
| captured_at | 2026-07-08T14:48:08.003Z |
| role_rows | 1489 |
| projection_rows | 203 |
| recommendation_rows | 125 |
| role_points_only_or_participation_rows | 118 |
| projections_points_only_or_participation_rows | 203 |
| core_pick_points_only_or_participation_rows | 25 |
| core_pick_rows | 25 |

## Current Snapshot

| Metric | Value |
| --- | --- |
| captured_at | 2026-07-08T14:58:27.790Z |
| role_rows | 1489 |
| projection_rows | 203 |
| recommendation_rows | 125 |
| role_points_only_or_participation_rows | 5 |
| projections_points_only_or_participation_rows | 5 |
| core_pick_points_only_or_participation_rows | 0 |
| core_pick_rows | 25 |
