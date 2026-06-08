# Team Builder Data Coverage v1

Generated: 2026-06-08

## Verdict

PASS: Team Builder uses the current official fantasy-pool player universe and current model fields.

## Counts

- Official fantasy player rows: 1481
- Selectable official players: 1248
- Team Builder candidates: 1248
- Excluded official rows: 233
- Excluded by nonselectable status: 233
- Matchday projection rows: 3768
- Finance metric rows: 1256
- Score fixtures: 72
- Runtime legacy fallback rows: 0
- Display-only legacy fallback rows: 95

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

- Status: completed; decision: official_player_import_rerun_needed; player changes: {"new_players":1,"removed_players":0,"name_changes":0,"price_changes":0,"position_changes":0,"selectable_status_changes":8,"country_team_changes":0,"fifa_player_id_changes":0,"ownership_percent_changes":318}

## Source Sync

- data/matchdayRecommendations_fantasyPool_v3.json: source 500, browser 500, in sync
- data/playerMatchdayProjections_fantasyPool_v3.json: source 3768, browser 3768, in sync
- data/playerFinanceMetrics_fantasyPool_v1.json: source 1256, browser 1256, in sync
- data/scorePredictions_fantasyPool_v3.json: source 72, browser 72, in sync

## Notes

- Team Builder now starts from official fantasy-pool selectable players, not the legacy finance/player list.
- Official fantasy position, price, and selectable status are the authority before current model fields are joined.
- Legacy player data remains only as an explicit fallback if the official fantasy-pool layer is absent, plus display-only club fallback where current projection rows lack club context.
- The monitor result recommends a separate official player import refresh because it found a new player and selectable-status changes; this validation does not perform that import or rerun models.
