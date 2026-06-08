# Official Fantasy Position Audit v1

Generated: 2026-06-08

## Verdict

PASS: public fantasy player positions normalize to the official FIFA fantasy position when an official feed position exists.

## Authority

1. Official FIFA fantasy feed position from `data/officialFantasyPlayers_v0.json`
2. Imported official fantasy position aliases from the identity map/browser status records
3. Existing fantasy position fields only when already official
4. Fallback position only when no official fantasy position can be matched, with a caution flag

## Summary

- Official feed rows: 1481
- Official position rows: 1481
- Selectable official rows missing official position: 0
- Legacy browser rows corrected by the official override: 135
- Public mismatches after normalization: 0
- Public rows using fallback position: 77

## Checks

| Check | Status | Detail |
| --- | --- | --- |
| official_position_records_exported | PASS | 1481/1481 official position records are in fantasyPoolOfficialDataStatusData.js. |
| no_selectable_official_positions_missing | PASS | 0 selectable official feed rows are missing official fantasy position. |
| fantasy_pool_generated_files_match_official | PASS | 0 generated fantasy-pool position mismatches; 0 rows missing an official match. |
| legacy_public_positions_normalized | PASS | 0 public browser player rows conflict after script.js normalization. |
| known_examples_are_midfielders | PASS | Luis Diaz: official=MID, public=MID; Vinicius: official=MID, public=MID |
| team_builder_uses_normalized_players | PASS | Team Builder filters/counts use player.position after raw players are normalized. |
| pick_explorer_uses_normalized_positions | PASS | Pick Explorer filters fantasy-pool preview players after they pass through the same normalizer. |
| exports_preserve_position_source | PASS | Team export includes official_fantasy_position, fantasy_position, position_source, and external_position. |
| static_data_loaded_before_script | PASS | Official fantasy status/position data loads before script.js. |
| no_runtime_fetch_added | PASS | script.js contains no runtime fetch(). |

## Known Examples

| Player | Internal ID | Official Position | Public Position | Source | Status |
| --- | --- | --- | --- | --- | --- |
| Luis Diaz | colombia-luis-diaz | MID | MID | official_fifa_fantasy_feed | PASS |
| Vinicius | brazil-vinicius-junior | MID | MID | official_fifa_fantasy_feed | PASS |

## Legacy Conflicts Corrected

These rows show source/browser legacy positions that differ from official fantasy positions. Public logic now overrides them before use.

| Player | Country | Legacy Position | Public Position | Source |
| --- | --- | --- | --- | --- |
| Ibrahim Maza | Algeria | MID | FWD | official_fifa_fantasy_feed |
| Adil Boulbina | Algeria | FWD | MID | official_fifa_fantasy_feed |
| Riyad Mahrez | Algeria | FWD | MID | official_fifa_fantasy_feed |
| Giuliano Simeone | Argentina | FWD | MID | official_fifa_fantasy_feed |
| Nicolas Gonzalez | Argentina | FWD | MID | official_fifa_fantasy_feed |
| Nicolas Paz | Argentina | FWD | MID | official_fifa_fantasy_feed |
| Thiago Almada | Argentina | FWD | MID | official_fifa_fantasy_feed |
| Alexis Saelemekars | Belgium | FWD | MID | official_fifa_fantasy_feed |
| Charles De Ketelaere | Belgium | FWD | MID | official_fifa_fantasy_feed |
| Diego Moreira | Belgium | FWD | MID | official_fifa_fantasy_feed |
| Jeremy Doku | Belgium | FWD | MID | official_fifa_fantasy_feed |
| Leandro Trossard | Belgium | FWD | MID | official_fifa_fantasy_feed |
| Esmir Bajraktarevic | Bosnia and Herzegovina | MID | FWD | official_fifa_fantasy_feed |
| Kerim Alajbegovic | Bosnia and Herzegovina | MID | FWD | official_fifa_fantasy_feed |
| Gabriel Martinelli | Brazil | FWD | MID | official_fifa_fantasy_feed |
| Neymar Junior | Brazil | FWD | MID | official_fifa_fantasy_feed |
| Raphinha | Brazil | FWD | MID | official_fifa_fantasy_feed |
| Vinicius Junior | Brazil | FWD | MID | official_fifa_fantasy_feed |
| Joao Paulo Fernandes | Cabo Verde | DEF | MID | official_fifa_fantasy_feed |
| Gilson Benchimol | Cabo Verde | FWD | MID | official_fifa_fantasy_feed |
| Helio Varela | Cabo Verde | FWD | MID | official_fifa_fantasy_feed |
| Niko Sigur | Canada | DEF | MID | official_fifa_fantasy_feed |
| Liam Millar | Canada | MID | FWD | official_fifa_fantasy_feed |
| Tajon Buchanan | Canada | MID | FWD | official_fifa_fantasy_feed |
| Luis Diaz | Colombia | FWD | MID | official_fifa_fantasy_feed |

## Missing Official Positions

No selectable official fantasy feed rows are missing official fantasy position.

## Notes

- Pick cards, Player Profile, Pick Explorer filters, Team Builder counts, and export/import read `player.position` after `script.js` normalizes it to official fantasy position.
- Legacy external or roster position is retained only as `external_position` when it conflicts with the official fantasy position.
- No model rerun was needed for score prediction formulas; this audit only changes authoritative position selection and validation.
