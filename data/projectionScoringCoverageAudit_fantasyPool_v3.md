# Projection Scoring Coverage Audit Fantasy Pool v3

Generated: 2026-06-02T17:52:11.470Z

Model stage: fantasy_pool_only. This audit is not final-squad-backed, not final public recommendations, not Team Builder-ready, and safe only for preliminary recommendation staging.

## Summary

- Official scoring categories audited: 26.
- Added in this pass: MID tackles, MID chances created, and FWD shots on target.
- Added-component source-backed projection rows: 1149.
- Added-component conservative-prior projection rows: 2142.
- Categories still omitted or partial because current data cannot support them: 6.
- QA status after coverage pass: pass_with_staging_stop_conditions.

## Category Coverage

| Category ID | Label | Pts | Applies | Status | Component | Rate/source | Fallback | Risk | Recommendation impact | Action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| appearance_up_to_60 | Appearance (Up to 60 minutes) | 1 | all_players | modeled | existing projection component | official rules plus minutes/fixture context | Fixture/minutes-based model component. | Low to medium depending on player-rate availability. | Already included in raw, risk-adjusted, captain, and value candidate scores. | kept_modeled |
| appearance_60_plus | Appearance (60+ minutes) | 1 | all_players | modeled | existing projection component | official rules plus minutes/fixture context | Fixture/minutes-based model component. | Low to medium depending on player-rate availability. | Already included in raw, risk-adjusted, captain, and value candidate scores. | kept_modeled |
| assist | Assist | 3 | all_players | modeled | existing projection component | existing player attacking rates where available; conservative priors otherwise | Conservative position priors flagged when source-backed rates are missing. | Low to medium depending on player-rate availability. | Already included in raw, risk-adjusted, captain, and value candidate scores. | kept_modeled |
| yellow_card | Yellow Card | -1 | all_players | modeled | existing projection component | official rules plus minutes/fixture context | Fixture/minutes-based model component. | Low to medium depending on player-rate availability. | Already included in raw, risk-adjusted, captain, and value candidate scores. | kept_modeled |
| red_card | Red Card | -2 | all_players | modeled | existing projection component | official rules plus minutes/fixture context | Fixture/minutes-based model component. | Low to medium depending on player-rate availability. | Already included in raw, risk-adjusted, captain, and value candidate scores. | kept_modeled |
| own_goal | Own Goal | -2 | all_players | impossible_with_current_data | not emitted | No source-backed own-goal event-rate data. | No conservative prior used; omission is flagged rather than invented. | Low to medium because these are sparse events but can swing individual rows. | Future event-rate source needed; do not use priors for rare negative events. | future_work |
| winning_penalty | Winning a penalty | 2 | all_players | impossible_with_current_data | not emitted | No source-backed penalty-won rate or penalty-role event data. | No conservative prior used; omission is flagged rather than invented. | Low to medium because these are sparse events but can swing individual rows. | Future sourced penalty-won/conceded rates needed. | future_work |
| conceding_penalty | Conceding a penalty | -1 | all_players | impossible_with_current_data | not emitted | No source-backed penalty-conceded rate. | No conservative prior used; omission is flagged rather than invented. | Low to medium because these are sparse events but can swing individual rows. | Future sourced defensive event-rate data needed. | future_work |
| gk_clean_sheet | Clean Sheet (must have played 60+ minutes) | 5 | GK | modeled | existing projection component | official rules plus minutes/fixture context | Fixture/minutes-based model component. | Low to medium depending on player-rate availability. | Already included in raw, risk-adjusted, captain, and value candidate scores. | kept_modeled |
| gk_first_goal_conceded | First goal conceded | 0 | GK | modeled_neutral_zero_points | none | No component required because official points value is 0. | No fallback needed. | Low. | No scoring impact under imported rules. | leave_as_neutral |
| gk_each_additional_goal_conceded | Each additional goal conceded | -1 | GK | modeled | existing projection component | official rules plus minutes/fixture context | Fixture/minutes-based model component. | Low to medium depending on player-rate availability. | Already included in raw, risk-adjusted, captain, and value candidate scores. | kept_modeled |
| gk_goal_scored | Goal Scored | 9 | GK | modeled | existing projection component | existing player attacking rates where available; conservative priors otherwise | Conservative position priors flagged when source-backed rates are missing. | Low to medium depending on player-rate availability. | Already included in raw, risk-adjusted, captain, and value candidate scores. | kept_modeled |
| gk_penalty_save | Penalty save | 3 | GK | impossible_with_current_data | not emitted | No source-backed penalty-save opportunity/save rates. | No conservative prior used; omission is flagged rather than invented. | Low to medium because these are sparse events but can swing individual rows. | Future goalkeeper penalty-event source needed. | future_work |
| gk_every_3_saves | Every 3 Saves | 1 | GK | modeled | existing projection component | official rules plus minutes/fixture context | Fixture/minutes-based model component. | Low to medium depending on player-rate availability. | Already included in raw, risk-adjusted, captain, and value candidate scores. | kept_modeled |
| def_clean_sheet | Clean Sheet (must have played 60+ minutes) | 5 | DEF | modeled | existing projection component | official rules plus minutes/fixture context | Fixture/minutes-based model component. | Low to medium depending on player-rate availability. | Already included in raw, risk-adjusted, captain, and value candidate scores. | kept_modeled |
| def_first_goal_conceded | First goal conceded | 0 | DEF | modeled_neutral_zero_points | none | No component required because official points value is 0. | No fallback needed. | Low. | No scoring impact under imported rules. | leave_as_neutral |
| def_each_additional_goal_conceded | Each additional goal conceded | -1 | DEF | modeled | existing projection component | official rules plus minutes/fixture context | Fixture/minutes-based model component. | Low to medium depending on player-rate availability. | Already included in raw, risk-adjusted, captain, and value candidate scores. | kept_modeled |
| def_goal_scored | Goal scored | 7 | DEF | modeled | existing projection component | existing player attacking rates where available; conservative priors otherwise | Conservative position priors flagged when source-backed rates are missing. | Low to medium depending on player-rate availability. | Already included in raw, risk-adjusted, captain, and value candidate scores. | kept_modeled |
| mid_clean_sheet | Clean Sheet (must have played 60+ minutes) | 1 | MID | modeled | existing projection component | official rules plus minutes/fixture context | Fixture/minutes-based model component. | Low to medium depending on player-rate availability. | Already included in raw, risk-adjusted, captain, and value candidate scores. | kept_modeled |
| mid_goal_scored | Goal scored | 6 | MID | modeled | existing projection component | existing player attacking rates where available; conservative priors otherwise | Conservative position priors flagged when source-backed rates are missing. | Low to medium depending on player-rate availability. | Already included in raw, risk-adjusted, captain, and value candidate scores. | kept_modeled |
| mid_every_3_tackles | Every 3 tackles | 1 | MID | modeled_source_backed_and_prior_fallback | tackle_component | playerPerformance defensive.tackles/minutes where available; otherwise capped MID prior. | Small MID-only conservative prior dampened by expected minutes and role confidence. | Medium: rewards ball-winning midfielders and can affect MID ordering, but caps prevent it dominating. | Improves midfielder floor/value representation in Balanced and Safe without creating captain proof. | added_now |
| mid_every_2_chances_created | Every 2 chances created | 1 | MID | modeled_source_backed_and_prior_fallback | chance_created_component | playerPerformance chances_created_per90 where available; otherwise capped MID prior. | Small MID-only conservative prior scaled by fixture goal environment and dampened by confidence. | Medium-high: attacking mids were previously under-modeled; capped priors reduce over-correction. | Improves attacking-midfielder treatment in Balanced, Upside, and Captain Alpha review. | added_now |
| fwd_goal_scored | Goal scored | 5 | FWD | modeled | existing projection component | existing player attacking rates where available; conservative priors otherwise | Conservative position priors flagged when source-backed rates are missing. | Low to medium depending on player-rate availability. | Already included in raw, risk-adjusted, captain, and value candidate scores. | kept_modeled |
| fwd_every_2_shots_on_target | Every 2 shots on target | 1 | FWD | modeled_source_backed_and_prior_fallback | shot_on_target_component | playerPerformance and playerFinanceMetrics shots_on_target/minutes where available; otherwise capped FWD prior. | Small FWD-only conservative prior scaled by fixture goal environment and dampened by confidence. | Medium-high: forwards were previously missing an official event path; cap keeps goals/assists primary. | Improves forward upside/captain comparability without treating price or fame as shot volume. | added_now |
| direct_free_kick_goal_bonus | Goal from direct free-kick | 1 | all_players | partially_modeled_goal_only | not emitted | Direct free-kick goals are included only as ordinary goals because no source-backed direct-free-kick goal rate exists. | No conservative prior used; omission is flagged rather than invented. | Low to medium because these are sparse events but can swing individual rows. | Future source-backed direct-free-kick event source needed. | future_work |
| scouting_bonus | Scouting bonus | 2 | all_players | impossible_with_current_data | not emitted | No official selection-rate or scouting-bonus trigger evidence. | No conservative prior used; omission is flagged rather than invented. | Medium if the bonus is common; currently unresolved due rules/source gap. | Future official rules clarification and selection-rate source needed. | future_work |

## Added Component Ranges

| Component | Min | Avg | Max |
| --- | --- | --- | --- |
| Tackle component | 0 | 0.056 | 1.1 |
| Chance-created component | 0 | 0.082 | 1.15 |
| Shot-on-target component | 0 | 0.04 | 0.95 |
| Added components total | 0 | 0.178 | 1.71 |

## Added Component Coverage Flags

| Flag | Rows |
| --- | --- |
| mid_every_3_tackles_not_applicable | 2487 |
| mid_every_2_chances_created_not_applicable | 2487 |
| fwd_every_2_shots_on_target_not_applicable | 2958 |
| fwd_every_2_shots_on_target_modeled_zero | 72 |
| fwd_every_2_shots_on_target_modeled_source_backed | 471 |
| mid_every_3_tackles_modeled_conservative_prior | 1107 |
| mid_every_2_chances_created_modeled_conservative_prior | 768 |
| fwd_every_2_shots_on_target_modeled_conservative_prior | 267 |
| mid_every_2_chances_created_modeled_source_backed | 507 |
| mid_every_3_tackles_modeled_source_backed | 171 |
| mid_every_3_tackles_modeled_zero | 3 |
| mid_every_2_chances_created_modeled_zero | 6 |

## Top Added-Component Rows

| Name | Country | Pos | MD | Opponent | Added total | Tackle | Chance | SOT | Conf | Coverage flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Ben Gannon-Doak | Scotland | MID | md1 | Haiti | 1.71 | 1.1 | 0.61 | 0 | high | mid_every_3_tackles_modeled_source_backed; mid_every_2_chances_created_modeled_source_backed; fwd_every_2_shots_on_target_not_applicable |
| Bruno Miguel Borges Fernandes | Portugal | MID | md1 | Congo DR | 1.566 | 0.416 | 1.15 | 0 | high | mid_every_3_tackles_modeled_source_backed; mid_every_2_chances_created_modeled_source_backed; fwd_every_2_shots_on_target_not_applicable |
| Bruno Miguel Borges Fernandes | Portugal | MID | md2 | Uzbekistan | 1.566 | 0.416 | 1.15 | 0 | high | mid_every_3_tackles_modeled_source_backed; mid_every_2_chances_created_modeled_source_backed; fwd_every_2_shots_on_target_not_applicable |
| Bruno Miguel Borges Fernandes | Portugal | MID | md3 | Colombia | 1.566 | 0.416 | 1.15 | 0 | high | mid_every_3_tackles_modeled_source_backed; mid_every_2_chances_created_modeled_source_backed; fwd_every_2_shots_on_target_not_applicable |
| Ben Gannon-Doak | Scotland | MID | md2 | Morocco | 1.466 | 1.1 | 0.366 | 0 | high | mid_every_3_tackles_modeled_source_backed; mid_every_2_chances_created_modeled_source_backed; fwd_every_2_shots_on_target_not_applicable |
| Ben Gannon-Doak | Scotland | MID | md3 | Brazil | 1.466 | 1.1 | 0.366 | 0 | high | mid_every_3_tackles_modeled_source_backed; mid_every_2_chances_created_modeled_source_backed; fwd_every_2_shots_on_target_not_applicable |
| Jérémy Doku | Belgium | MID | md1 | Egypt | 1.449 | 0.299 | 1.15 | 0 | high | mid_every_3_tackles_modeled_source_backed; mid_every_2_chances_created_modeled_source_backed; fwd_every_2_shots_on_target_not_applicable |
| Jérémy Doku | Belgium | MID | md2 | IR Iran | 1.449 | 0.299 | 1.15 | 0 | high | mid_every_3_tackles_modeled_source_backed; mid_every_2_chances_created_modeled_source_backed; fwd_every_2_shots_on_target_not_applicable |
| Jérémy Doku | Belgium | MID | md3 | New Zealand | 1.449 | 0.299 | 1.15 | 0 | high | mid_every_3_tackles_modeled_source_backed; mid_every_2_chances_created_modeled_source_backed; fwd_every_2_shots_on_target_not_applicable |
| Declan Rice | England | MID | md1 | Croatia | 1.436 | 0.505 | 0.931 | 0 | high | mid_every_3_tackles_modeled_source_backed; mid_every_2_chances_created_modeled_source_backed; fwd_every_2_shots_on_target_not_applicable |
| Declan Rice | England | MID | md2 | Ghana | 1.436 | 0.505 | 0.931 | 0 | high | mid_every_3_tackles_modeled_source_backed; mid_every_2_chances_created_modeled_source_backed; fwd_every_2_shots_on_target_not_applicable |
| Declan Rice | England | MID | md3 | Panama | 1.436 | 0.505 | 0.931 | 0 | high | mid_every_3_tackles_modeled_source_backed; mid_every_2_chances_created_modeled_source_backed; fwd_every_2_shots_on_target_not_applicable |
| Florian Wirtz | Germany | MID | md1 | Curaçao | 1.415 | 0.318 | 1.097 | 0 | high | mid_every_3_tackles_modeled_source_backed; mid_every_2_chances_created_modeled_source_backed; fwd_every_2_shots_on_target_not_applicable |
| Florian Wirtz | Germany | MID | md2 | Côte d'Ivoire | 1.415 | 0.318 | 1.097 | 0 | high | mid_every_3_tackles_modeled_source_backed; mid_every_2_chances_created_modeled_source_backed; fwd_every_2_shots_on_target_not_applicable |
| Bruno Guimarães Rodriguez Moura | Brazil | MID | md2 | Haiti | 1.394 | 0.601 | 0.793 | 0 | high | mid_every_3_tackles_modeled_source_backed; mid_every_2_chances_created_modeled_source_backed; fwd_every_2_shots_on_target_not_applicable |
| Bruno Guimarães Rodriguez Moura | Brazil | MID | md3 | Scotland | 1.394 | 0.601 | 0.793 | 0 | high | mid_every_3_tackles_modeled_source_backed; mid_every_2_chances_created_modeled_source_backed; fwd_every_2_shots_on_target_not_applicable |
| Carlos Henrique Casimiro | Brazil | MID | md2 | Haiti | 1.384 | 0.807 | 0.577 | 0 | high | mid_every_3_tackles_modeled_source_backed; mid_every_2_chances_created_modeled_source_backed; fwd_every_2_shots_on_target_not_applicable |
| Carlos Henrique Casimiro | Brazil | MID | md3 | Scotland | 1.384 | 0.807 | 0.577 | 0 | high | mid_every_3_tackles_modeled_source_backed; mid_every_2_chances_created_modeled_source_backed; fwd_every_2_shots_on_target_not_applicable |
| Luis Díaz | Colombia | MID | md1 | Uzbekistan | 1.38 | 0.23 | 1.15 | 0 | high | mid_every_3_tackles_modeled_conservative_prior; mid_every_2_chances_created_modeled_source_backed; fwd_every_2_shots_on_target_not_applicable |
| Luis Díaz | Colombia | MID | md2 | Congo DR | 1.38 | 0.23 | 1.15 | 0 | high | mid_every_3_tackles_modeled_conservative_prior; mid_every_2_chances_created_modeled_source_backed; fwd_every_2_shots_on_target_not_applicable |
| Raphael Dias Belloli | Brazil | MID | md1 | Morocco | 1.38 | 0.23 | 1.15 | 0 | high | mid_every_3_tackles_modeled_conservative_prior; mid_every_2_chances_created_modeled_source_backed; fwd_every_2_shots_on_target_not_applicable |
| Raphael Dias Belloli | Brazil | MID | md2 | Haiti | 1.38 | 0.23 | 1.15 | 0 | high | mid_every_3_tackles_modeled_conservative_prior; mid_every_2_chances_created_modeled_source_backed; fwd_every_2_shots_on_target_not_applicable |
| Raphael Dias Belloli | Brazil | MID | md3 | Scotland | 1.38 | 0.23 | 1.15 | 0 | high | mid_every_3_tackles_modeled_conservative_prior; mid_every_2_chances_created_modeled_source_backed; fwd_every_2_shots_on_target_not_applicable |
| Arda Güler | Türkiye | MID | md1 | Australia | 1.376 | 0.226 | 1.15 | 0 | high | mid_every_3_tackles_modeled_conservative_prior; mid_every_2_chances_created_modeled_source_backed; fwd_every_2_shots_on_target_not_applicable |
| Arda Güler | Türkiye | MID | md2 | Paraguay | 1.376 | 0.226 | 1.15 | 0 | high | mid_every_3_tackles_modeled_conservative_prior; mid_every_2_chances_created_modeled_source_backed; fwd_every_2_shots_on_target_not_applicable |

## QA Notes

- Added components are capped and dampened when they rely on conservative priors.
- Added components are not based on price, fame, or unsourced player reputation.
- Thin profiles and low-confidence rows receive lower prior contribution through the dampener.
- Public promotion remains blocked by final-squad sourcing, official rules warnings, Neymar usage uncertainty, and browser-ready regeneration.
