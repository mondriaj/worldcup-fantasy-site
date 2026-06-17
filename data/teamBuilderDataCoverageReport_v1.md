# Team Builder Data Coverage v1

Generated: 2026-06-17

## Verdict

PASS: Team Builder uses the current official fantasy-pool player universe and current model fields.

## Counts

- Official fantasy player rows: 1488
- Selectable official players: 1245
- Team Builder candidates: 1233
- Excluded official rows: 255
- Excluded by nonselectable status: 243
- Excluded by missing current model fields: 12
- Matchday projection rows: 3699
- Finance metric rows: 1233
- Score fixtures: 72
- Runtime legacy fallback rows: 0
- Display-only legacy fallback rows: 94

## Missing Field Counts

- official_fantasy_id: 0
- player_name: 0
- country_or_team: 0
- official_fantasy_position: 0
- official_fantasy_price: 0
- selectable_status: 0
- projected_points: 0
- matchday_projections: 0
- finance_metrics: 0
- finance_value_fields: 0
- score_context: 0
- role_minutes_start_probability: 0
- risk_downside_fields: 0

## Known Examples

| Player | In Builder | Official Position | Price | Status |
| --- | --- | --- | --- | --- |
| Luis Díaz | yes | MID | 8.1 | playing |
| Vinícius José Paixão de Oliveira Júnior | yes | MID | 10 | playing |

## Monitor Result

- Status: completed; decision: full_model_rerun_recommended; player changes: {"new_players":6,"removed_players":0,"name_changes":0,"price_changes":0,"position_changes":0,"selectable_status_changes":16,"country_team_changes":0,"fifa_player_id_changes":1247,"ownership_percent_changes":421}

## Source Sync

- data/matchdayRecommendations_fantasyPool_v3.json: source 500, browser 500, in sync
- data/playerMatchdayProjections_fantasyPool_v3.json: source 3699, browser 3699, in sync
- data/playerFinanceMetrics_fantasyPool_v1.json: source 1233, browser 1233, in sync
- data/scorePredictions_fantasyPool_v3.json: source 72, browser 72, in sync

## Notes

- Team Builder now starts from official fantasy-pool selectable players that also have current projections, finance metrics, and score context, not the legacy finance/player list.
- Official fantasy position, price, and selectable status are the authority before current model fields are joined; rows without current model fields are excluded instead of shown with blanks.
- Legacy player data remains only as an explicit fallback if the official fantasy-pool layer is absent, plus display-only club fallback where current projection rows lack club context.
- The monitor result recommends a separate official player import refresh because it found a new player and selectable-status changes; this validation does not perform that import or rerun models.
