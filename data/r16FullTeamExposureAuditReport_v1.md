# R16 Full Team Exposure Model Trust Audit v1

Generated: 2026-07-04T13:12:52.336Z
Status: **PASS**
Model imbalance found: **no**
Hardcoded team/player scoring logic found: **no**

## Gate Summary

| Gate | Result |
| --- | --- |
| r16_fixture_authority_status | pass |
| completed_r32_fixtures_used | 16 |
| r16_fixture_count | 8 |
| unsafe_fixture_player_point_leaks | 0 |
| ownership_used_as_signal | false |
| final_squads_source_backed | false |

## Team Table

| Team | Opp | xG | Opp xG | Adv | CS | Path | Proj Total | Recs | Diagnostic Builder | R32 Result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Argentina | Egypt | 2.466 | 0.35 | 91% | 70% | 0.987 | 79.226 | 47 | 4/4/0 | ARG 3-2 CPV |
| France | Paraguay | 2.023 | 0.35 | 87% | 70% | 0.898 | 74.978 | 30 | 4/3/1 | FRA 3-0 SWE |
| England | Mexico | 1.809 | 0.375 | 84% | 69% | 0.818 | 71.118 | 21 | 3/2/1 | ENG 2-1 COD |
| Spain | Portugal | 1.724 | 0.79 | 72% | 45% | 0.538 | 61.887 | 15 | 0/0/0 | ESP 3-0 AUT |
| Brazil | Norway | 1.534 | 0.83 | 68% | 44% | 0.432 | 52.76 | 0 | 1/0/1 | BRA 2-1 JPN |
| Colombia | Switzerland | 1.401 | 0.728 | 68% | 48% | 0.422 | 61.122 | 3 | 0/0/0 | COL 1-0 GHA |
| Belgium | USA | 1.362 | 0.8 | 65% | 45% | 0.352 | 55.992 | 7 | 2/2/0 | BEL 3-2 SEN |
| Morocco | Canada | 1.212 | 0.532 | 69% | 59% | 0.463 | 50.674 | 2 | 1/0/1 | NED 1-1 MAR, 2-3 pens |
| Norway | Brazil | 0.83 | 1.534 | 32% | 22% | -0.432 | 37.047 | 0 | 0/0/0 | CIV 1-2 NOR |
| USA | Belgium | 0.8 | 1.362 | 35% | 26% | -0.352 | 36.597 | 0 | 0/0/0 | USA 2-0 BIH |
| Portugal | Spain | 0.79 | 1.724 | 28% | 18% | -0.538 | 48.729 | 0 | 0/0/0 | POR 2-1 CRO |
| Switzerland | Colombia | 0.728 | 1.401 | 32% | 25% | -0.422 | 40.981 | 0 | 0/0/0 | SUI 2-0 ALG |
| Canada | Morocco | 0.532 | 1.212 | 31% | 30% | -0.463 | 39.459 | 0 | 0/0/0 | RSA 0-1 CAN |
| Mexico | England | 0.375 | 1.809 | 16% | 16% | -0.818 | 32.609 | 0 | 0/0/0 | MEX 2-0 ECU |
| Paraguay | France | 0.35 | 2.023 | 13% | 13% | -0.898 | 30.362 | 0 | 0/0/0 | GER 1-1 PAR, 3-4 pens |
| Egypt | Argentina | 0.35 | 2.466 | 9% | 8% | -0.987 | 27.189 | 0 | 0/0/0 | AUS 1-1 EGY, 2-4 pens |

## Sorted Views

### by_projected_team_xg
| Rank | Team | Value | Recs | Diagnostic Builder |
| --- | --- | --- | --- | --- |
| 1 | Argentina | 2.466 | 47 | 4 |
| 2 | France | 2.023 | 30 | 4 |
| 3 | England | 1.809 | 21 | 3 |
| 4 | Spain | 1.724 | 15 | 0 |
| 5 | Brazil | 1.534 | 0 | 1 |
| 6 | Colombia | 1.401 | 3 | 0 |
| 7 | Belgium | 1.362 | 7 | 2 |
| 8 | Morocco | 1.212 | 2 | 1 |
| 9 | Norway | 0.83 | 0 | 0 |
| 10 | USA | 0.8 | 0 | 0 |
| 11 | Portugal | 0.79 | 0 | 0 |
| 12 | Switzerland | 0.728 | 0 | 0 |
| 13 | Canada | 0.532 | 0 | 0 |
| 14 | Mexico | 0.375 | 0 | 0 |
| 15 | Paraguay | 0.35 | 0 | 0 |
| 16 | Egypt | 0.35 | 0 | 0 |

### by_total_player_projection
| Rank | Team | Value | Recs | Diagnostic Builder |
| --- | --- | --- | --- | --- |
| 1 | Argentina | 79.226 | 47 | 4 |
| 2 | France | 74.978 | 30 | 4 |
| 3 | England | 71.118 | 21 | 3 |
| 4 | Spain | 61.887 | 15 | 0 |
| 5 | Colombia | 61.122 | 3 | 0 |
| 6 | Belgium | 55.992 | 7 | 2 |
| 7 | Brazil | 52.76 | 0 | 1 |
| 8 | Morocco | 50.674 | 2 | 1 |
| 9 | Portugal | 48.729 | 0 | 0 |
| 10 | Switzerland | 40.981 | 0 | 0 |
| 11 | Canada | 39.459 | 0 | 0 |
| 12 | Norway | 37.047 | 0 | 0 |
| 13 | USA | 36.597 | 0 | 0 |
| 14 | Mexico | 32.609 | 0 | 0 |
| 15 | Paraguay | 30.362 | 0 | 0 |
| 16 | Egypt | 27.189 | 0 | 0 |

### by_recommendation_count
| Rank | Team | Value | Recs | Diagnostic Builder |
| --- | --- | --- | --- | --- |
| 1 | Argentina | 47 | 47 | 4 |
| 2 | France | 30 | 30 | 4 |
| 3 | England | 21 | 21 | 3 |
| 4 | Spain | 15 | 15 | 0 |
| 5 | Belgium | 7 | 7 | 2 |
| 6 | Colombia | 3 | 3 | 0 |
| 7 | Morocco | 2 | 2 | 1 |
| 8 | Paraguay | 0 | 0 | 0 |
| 9 | Canada | 0 | 0 | 0 |
| 10 | Brazil | 0 | 0 | 1 |
| 11 | Norway | 0 | 0 | 0 |
| 12 | Mexico | 0 | 0 | 0 |
| 13 | Portugal | 0 | 0 | 0 |
| 14 | USA | 0 | 0 | 0 |
| 15 | Egypt | 0 | 0 | 0 |
| 16 | Switzerland | 0 | 0 | 0 |

### by_builder_selected_count
| Rank | Team | Value | Recs | Diagnostic Builder |
| --- | --- | --- | --- | --- |
| 1 | France | 4 | 30 | 4 |
| 2 | Argentina | 4 | 47 | 4 |
| 3 | England | 3 | 21 | 3 |
| 4 | Belgium | 2 | 7 | 2 |
| 5 | Morocco | 1 | 2 | 1 |
| 6 | Brazil | 1 | 0 | 1 |
| 7 | Paraguay | 0 | 0 | 0 |
| 8 | Canada | 0 | 0 | 0 |
| 9 | Norway | 0 | 0 | 0 |
| 10 | Mexico | 0 | 0 | 0 |
| 11 | Portugal | 0 | 0 | 0 |
| 12 | Spain | 0 | 15 | 0 |
| 13 | USA | 0 | 0 | 0 |
| 14 | Egypt | 0 | 0 | 0 |
| 15 | Switzerland | 0 | 0 | 0 |
| 16 | Colombia | 0 | 3 | 0 |

### by_path_value
| Rank | Team | Value | Recs | Diagnostic Builder |
| --- | --- | --- | --- | --- |
| 1 | Argentina | 0.987 | 47 | 4 |
| 2 | France | 0.898 | 30 | 4 |
| 3 | England | 0.818 | 21 | 3 |
| 4 | Spain | 0.538 | 15 | 0 |
| 5 | Morocco | 0.463 | 2 | 1 |
| 6 | Brazil | 0.432 | 0 | 1 |
| 7 | Colombia | 0.422 | 3 | 0 |
| 8 | Belgium | 0.352 | 7 | 2 |
| 9 | USA | -0.352 | 0 | 0 |
| 10 | Switzerland | -0.422 | 0 | 0 |
| 11 | Norway | -0.432 | 0 | 0 |
| 12 | Canada | -0.463 | 0 | 0 |
| 13 | Portugal | -0.538 | 0 | 0 |
| 14 | Mexico | -0.818 | 0 | 0 |
| 15 | Paraguay | -0.898 | 0 | 0 |
| 16 | Egypt | -0.987 | 0 | 0 |

## Imbalance Flags

- **INFO top_5_team_xg_zero_recommendations_documented (Brazil):** Top-5 team xG but zero active recommendation rows. Best player Douglas dos Santos Justino de Melo is overall projection rank 33; public rows are top-25 per surface.
- **INFO strong_recent_form_zero_recommendations_documented (Norway):** Strong recent form but zero active recommendation rows. Best player Erling Haaland is overall projection rank 105; public rows are top-25 per surface.
- **INFO strong_recent_form_zero_recommendations_documented (Mexico):** Strong recent form but zero active recommendation rows. Best player Israel Reyes is overall projection rank 90; public rows are top-25 per surface.
- **INFO top_5_path_value_zero_builder_exposure_documented (Spain):** Top-5 path value but zero diagnostic builder exposure. Best player Marc Cucurella is overall projection rank 11; public rows are top-25 per surface.
- **INFO strong_recent_form_zero_recommendations_documented (USA):** Strong recent form but zero active recommendation rows. Best player Alexander Freeman is overall projection rank 78; public rows are top-25 per surface.

## Watch Team Details

### France
- R32 result updated: yes (FRA 3-0 SWE)
- R16 opponent: Paraguay; kickoff: Jul 4, 2026 · 5:00 PM ET; path: Winner Match 74 v Winner Match 77; QF path: M97
- Team xG 2.023, opponent xG 0.35, advance 87%, clean sheet 70%, path value 0.898.
- Projection total 74.978; recommendations 30; diagnostic builder selected/starters/bench 4/3/1.
- Top projected: Dayot Upamecano 5.668, Jules Koundé 5.551, Kylian Mbappé 5.405, Mike Maignan 5.319, Ousmane Dembélé 4.936.
- Omitted reasons: Ousmane Dembélé: country cap already reached (4/4); MID slots filled by higher diagnostic squad score/budget fit; premium price creates budget pressure; entered candidate pool but lost to roster constraints/composite score | Michael Olise: country cap already reached (4/4); MID slots filled by higher diagnostic squad score/budget fit; premium price creates budget pressure; entered candidate pool but lost to roster constraints/composite score | Theo Hernández: country cap already reached (4/4); DEF slots filled by higher diagnostic squad score/budget fit; entered candidate pool but lost to roster constraints/composite score

### Belgium
- R32 result updated: yes (BEL 3-2 SEN)
- R16 opponent: USA; kickoff: Jul 6, 2026 · 8:00 PM ET; path: Winner Match 81 v Winner Match 82; QF path: M99
- Team xG 1.362, opponent xG 0.8, advance 65%, clean sheet 45%, path value 0.352.
- Projection total 55.992; recommendations 7; diagnostic builder selected/starters/bench 2/2/0.
- Top projected: Thibaut Courtois 4.761, Kevin De Bruyne 4.628, Leandro Trossard 4.436, Youri Tielemans 3.548, Brandon Mechele 3.342.
- Omitted reasons: Thibaut Courtois: GK slots filled by higher diagnostic squad score/budget fit; entered candidate pool but lost to roster constraints/composite score | Youri Tielemans: MID slots filled by higher diagnostic squad score/budget fit; entered candidate pool but lost to roster constraints/composite score | Brandon Mechele: DEF slots filled by higher diagnostic squad score/budget fit; start probability below top-player range; entered candidate pool but lost to roster constraints/composite score

### Colombia
- R32 result updated: yes (COL 1-0 GHA)
- R16 opponent: Switzerland; kickoff: Jul 7, 2026 · 4:00 PM ET; path: Winner Match 85 v Winner Match 87; QF path: M100
- Team xG 1.401, opponent xG 0.728, advance 68%, clean sheet 48%, path value 0.422.
- Projection total 61.122; recommendations 3; diagnostic builder selected/starters/bench 0/0/0.
- Top projected: Daniel Muñoz 4.899, Dávinson Sánchez 4.782, Jhon Lucumí 4.743, Camilo Vargas 4.363, Johan Mojica 4.29.
- Omitted reasons: Daniel Muñoz: DEF slots filled by higher diagnostic squad score/budget fit; entered candidate pool but lost to roster constraints/composite score | Dávinson Sánchez: DEF slots filled by higher diagnostic squad score/budget fit; entered candidate pool but lost to roster constraints/composite score | Jhon Lucumí: DEF slots filled by higher diagnostic squad score/budget fit; entered candidate pool but lost to roster constraints/composite score

### Morocco
- R32 result updated: yes (NED 1-1 MAR, 2-3 pens)
- R16 opponent: Canada; kickoff: Jul 4, 2026 · 1:00 PM ET; path: Winner Match 73 v Winner Match 75; QF path: M97
- Team xG 1.212, opponent xG 0.532, advance 69%, clean sheet 59%, path value 0.463.
- Projection total 50.674; recommendations 2; diagnostic builder selected/starters/bench 1/0/1.
- Top projected: Achraf Hakimi 4.847, Ismael Saibari 4.434, Chadi Riad 4.382, Brahim Díaz 4.154, Yassine Bounou 3.952.
- Omitted reasons: Achraf Hakimi: DEF slots filled by higher diagnostic squad score/budget fit; entered candidate pool but lost to roster constraints/composite score | Chadi Riad: DEF slots filled by higher diagnostic squad score/budget fit; entered candidate pool but lost to roster constraints/composite score | Brahim Díaz: MID slots filled by higher diagnostic squad score/budget fit; entered candidate pool but lost to roster constraints/composite score

### Argentina
- R32 result updated: yes (ARG 3-2 CPV)
- R16 opponent: Egypt; kickoff: Jul 7, 2026 · 12:00 PM ET; path: Winner Match 86 v Winner Match 88; QF path: M100
- Team xG 2.466, opponent xG 0.35, advance 91%, clean sheet 70%, path value 0.987.
- Projection total 79.226; recommendations 47; diagnostic builder selected/starters/bench 4/4/0.
- Top projected: Facundo Medina 5.898, Lionel Messi 5.852, Lisandro Martínez 5.79, Lautaro Martínez 5.463, Emiliano Martínez 5.325.
- Omitted reasons: Emiliano Martínez: country cap already reached (4/4); GK slots filled by higher diagnostic squad score/budget fit; entered candidate pool but lost to roster constraints/composite score | Cristian Romero: country cap already reached (4/4); DEF slots filled by higher diagnostic squad score/budget fit; entered candidate pool but lost to roster constraints/composite score | Alexis Mac Allister: country cap already reached (4/4); MID slots filled by higher diagnostic squad score/budget fit; entered candidate pool but lost to roster constraints/composite score

### England
- R32 result updated: yes (ENG 2-1 COD)
- R16 opponent: Mexico; kickoff: Jul 5, 2026 · 8:00 PM ET; path: Winner Match 79 v Winner Match 80; QF path: M98
- Team xG 1.809, opponent xG 0.375, advance 84%, clean sheet 69%, path value 0.818.
- Projection total 71.118; recommendations 21; diagnostic builder selected/starters/bench 3/2/1.
- Top projected: Ezri Konsa 5.687, Jordan Pickford 5.077, Harry Kane 4.92, Jude Bellingham 4.693, Noni Madueke 4.274.
- Omitted reasons: Harry Kane: FWD slots filled by higher diagnostic squad score/budget fit; premium price creates budget pressure; entered candidate pool but lost to roster constraints/composite score | Noni Madueke: FWD slots filled by higher diagnostic squad score/budget fit; entered candidate pool but lost to roster constraints/composite score | Elliot Anderson: MID slots filled by higher diagnostic squad score/budget fit; entered candidate pool but lost to roster constraints/composite score

### Spain
- R32 result updated: yes (ESP 3-0 AUT)
- R16 opponent: Portugal; kickoff: Jul 6, 2026 · 3:00 PM ET; path: Winner Match 83 v Winner Match 84; QF path: M99
- Team xG 1.724, opponent xG 0.79, advance 72%, clean sheet 45%, path value 0.538.
- Projection total 61.887; recommendations 15; diagnostic builder selected/starters/bench 0/0/0.
- Top projected: Marc Cucurella 5.195, Aymeric Laporte 5.182, Unai Simón 4.779, Pau Cubarsí 4.767, Mikel Oyarzabal 4.663.
- Omitted reasons: Marc Cucurella: DEF slots filled by higher diagnostic squad score/budget fit; entered candidate pool but lost to roster constraints/composite score | Aymeric Laporte: DEF slots filled by higher diagnostic squad score/budget fit; entered candidate pool but lost to roster constraints/composite score | Unai Simón: GK slots filled by higher diagnostic squad score/budget fit; entered candidate pool but lost to roster constraints/composite score

### Portugal
- R32 result updated: yes (POR 2-1 CRO)
- R16 opponent: Spain; kickoff: Jul 6, 2026 · 3:00 PM ET; path: Winner Match 83 v Winner Match 84; QF path: M99
- Team xG 0.79, opponent xG 1.724, advance 28%, clean sheet 18%, path value -0.538.
- Projection total 48.729; recommendations 0; diagnostic builder selected/starters/bench 0/0/0.
- Top projected: Nuno Alexandre Tavares Mendes 3.889, Renato Palma Veiga 3.717, Diogo Meireles da Costa 3.517, Cristiano Ronaldo dos Santos Aveiro 3.399, João Pedro Cavaco Cancelo 3.268.
- Omitted reasons: Nuno Alexandre Tavares Mendes: DEF slots filled by higher diagnostic squad score/budget fit; entered candidate pool but lost to roster constraints/composite score | Renato Palma Veiga: DEF slots filled by higher diagnostic squad score/budget fit; entered candidate pool but lost to roster constraints/composite score | Diogo Meireles da Costa: GK slots filled by higher diagnostic squad score/budget fit; entered candidate pool but lost to roster constraints/composite score

### Brazil
- R32 result updated: yes (BRA 2-1 JPN)
- R16 opponent: Norway; kickoff: Jul 5, 2026 · 4:00 PM ET; path: Winner Match 76 v Winner Match 78; QF path: M98
- Team xG 1.534, opponent xG 0.83, advance 68%, clean sheet 44%, path value 0.432.
- Projection total 52.76; recommendations 0; diagnostic builder selected/starters/bench 1/0/1.
- Top projected: Douglas dos Santos Justino de Melo 4.45, Alisson Ramsés Becker 4.357, Gabriel dos Santos Magalhães 4.346, Marcos Aoás Corrêa 4.346, Vinícius José Paixão de Oliveira Júnior 4.337.
- Omitted reasons: Douglas dos Santos Justino de Melo: DEF slots filled by higher diagnostic squad score/budget fit; entered candidate pool but lost to roster constraints/composite score | Alisson Ramsés Becker: GK slots filled by higher diagnostic squad score/budget fit; entered candidate pool but lost to roster constraints/composite score | Gabriel dos Santos Magalhães: DEF slots filled by higher diagnostic squad score/budget fit; entered candidate pool but lost to roster constraints/composite score

### Norway
- R32 result updated: yes (CIV 1-2 NOR)
- R16 opponent: Brazil; kickoff: Jul 5, 2026 · 4:00 PM ET; path: Winner Match 76 v Winner Match 78; QF path: M98
- Team xG 0.83, opponent xG 1.534, advance 32%, clean sheet 22%, path value -0.432.
- Projection total 37.047; recommendations 0; diagnostic builder selected/starters/bench 0/0/0.
- Top projected: Erling Haaland 3.001, Fredrik Aursnes 2.501, Martin Ødegaard 2.375, David Møller Wolfe 2.235, Patrick Berg 2.209.
- Omitted reasons: Erling Haaland: FWD slots filled by higher diagnostic squad score/budget fit; premium price creates budget pressure; start probability below top-player range; entered candidate pool but lost to roster constraints/composite score | Fredrik Aursnes: MID slots filled by higher diagnostic squad score/budget fit; entered candidate pool but lost to roster constraints/composite score | Martin Ødegaard: MID slots filled by higher diagnostic squad score/budget fit; start probability below top-player range; entered candidate pool but lost to roster constraints/composite score

### USA
- R32 result updated: yes (USA 2-0 BIH)
- R16 opponent: Belgium; kickoff: Jul 6, 2026 · 8:00 PM ET; path: Winner Match 81 v Winner Match 82; QF path: M99
- Team xG 0.8, opponent xG 1.362, advance 35%, clean sheet 26%, path value -0.352.
- Projection total 36.597; recommendations 0; diagnostic builder selected/starters/bench 0/0/0.
- Top projected: Alexander Freeman 3.436, Sergiño Dest 3.415, Weston McKennie 3.122, Tim Ream 2.954, Antonee Robinson 2.912.
- Omitted reasons: Alexander Freeman: DEF slots filled by higher diagnostic squad score/budget fit; start probability below top-player range; entered candidate pool but lost to roster constraints/composite score | Sergiño Dest: DEF slots filled by higher diagnostic squad score/budget fit; start probability below top-player range; entered candidate pool but lost to roster constraints/composite score | Weston McKennie: MID slots filled by higher diagnostic squad score/budget fit; entered candidate pool but lost to roster constraints/composite score

### Canada
- R32 result updated: yes (RSA 0-1 CAN)
- R16 opponent: Morocco; kickoff: Jul 4, 2026 · 1:00 PM ET; path: Winner Match 73 v Winner Match 75; QF path: M97
- Team xG 0.532, opponent xG 1.212, advance 31%, clean sheet 30%, path value -0.463.
- Projection total 39.459; recommendations 0; diagnostic builder selected/starters/bench 0/0/0.
- Top projected: Richie Laryea 4.004, Luc De Fougerolles 3.924, Alistair Johnston 3.924, Maxime Crépeau 3.79, Jonathan David 3.491.
- Omitted reasons: Richie Laryea: DEF slots filled by higher diagnostic squad score/budget fit; entered candidate pool but lost to roster constraints/composite score | Luc De Fougerolles: DEF slots filled by higher diagnostic squad score/budget fit; entered candidate pool but lost to roster constraints/composite score | Alistair Johnston: DEF slots filled by higher diagnostic squad score/budget fit; entered candidate pool but lost to roster constraints/composite score

## Morocco Player Checks

| Player | Team | Pts | Start | Min | Surfaces | Diagnostic Builder |
| --- | --- | --- | --- | --- | --- | --- |
| Achraf Hakimi | Morocco | 4.847 | 86% | 75.6 | balanced#25, safe#24, projected_points#20 | not_selected |
| Ismael Saibari | Morocco | 4.434 | 86% | 70 | none | bench |

## Hardcoded Name Scan

Unsafe hits: 0
| Classification | Count |
| --- | --- |
| safe_identity_mapping | 20 |
| safe_legacy_audit_output | 1 |
| safe_path_integrity_guard | 2 |
| safe_qa_or_report_text | 101 |

## Balanced Squad Diagnostic

Country cap used: 4; cost: 99.2; projected points: 78.238; captain: Lionel Messi; vice: Lautaro Martínez.
| Role | Player | Team | Pos | Pts | Price |
| --- | --- | --- | --- | --- | --- |
| Starter | Mike Maignan | France | GK | 5.319 | 5 |
| Starter | Facundo Medina | Argentina | DEF | 5.898 | 4 |
| Starter | Lisandro Martínez | Argentina | DEF | 5.79 | 4.6 |
| Starter | Ezri Konsa | England | DEF | 5.687 | 4.8 |
| Starter | Dayot Upamecano | France | DEF | 5.668 | 5.3 |
| Starter | Jules Koundé | France | DEF | 5.551 | 5.4 |
| Starter | Jude Bellingham | England | MID | 4.693 | 8.3 |
| Starter | Kevin De Bruyne | Belgium | MID | 4.628 | 7.5 |
| Starter | Leandro Trossard | Belgium | MID | 4.436 | 6.6 |
| Starter | Lionel Messi | Argentina | FWD | 5.852 | 10 |
| Starter | Lautaro Martínez | Argentina | FWD | 5.463 | 8.8 |
| Bench | Jordan Pickford | England | GK | 5.077 | 4.8 |
| Bench | Kylian Mbappé | France | FWD | 5.405 | 10.5 |
| Bench | Ismael Saibari | Morocco | MID | 4.434 | 6.8 |
| Bench | Bruno Guimarães Rodriguez Moura | Brazil | MID | 4.337 | 6.8 |

## Limits

- Browser/public exact Team Builder behavior is also covered by `scripts/runPublicPreviewBrowserQa.mjs`; this audit uses a deterministic local legal-squad diagnostic for cross-team exposure.
- Explicit R16 starting XIs and final squads are not source-backed.
- Ownership is not used as a model signal.
