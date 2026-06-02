# Official Squad Review Resolution Report v1

Generated: 2026-06-02

## Scope

This pass resolves the squad staging layer only. It does not promote fantasy-selectable players to confirmed final squads and does not change model inputs, browser-ready files, recommendations, projections, Team Builder, captain logic, or substitution logic.

## Before and After

| Metric | Before | After | Decision |
| --- | --- | --- | --- |
| Imported squad rows | 1,481 | 1481 | unchanged |
| Review rows | 225 | 225 | unchanged; reasons clarified |
| Confirmed final squad rows | 0 | 0 | unchanged; no player-level final source imported |
| Fantasy-selectable-only rows | 1,256 | 1256 | unchanged |
| Teams marked complete | 0 | 0 | unchanged |
| Import validation errors | 0 | 0 | unchanged |
| Current-player matches | 1,481 | 1481 | unchanged; identity layer is not the blocker |

## Review Reasons

| Reason | Rows | Resolution |
| --- | --- | --- |
| fantasy_status_transferred_no_final_squad_source | 225 | Keep review. Fantasy transferred status is not proof of final-squad exclusion or removal. |
| duplicate_name_distinct_official_fantasy_ids | 2 | Document and keep separate unless a hard duplicate conflict appears. |

All 225 review rows have official fantasy status `transferred`; none are unresolved identity joins. The imported status stays `imported_needs_manual_review` because no final-squad source confirms whether those players are in, out, removed, or replacement players.

## Countries With Most Review Rows

| Country | Review rows |
| --- | --- |
| Argentina | 29 |
| Paraguay | 29 |
| Mexico | 25 |
| Morocco | 20 |
| Australia | 10 |
| Ecuador | 10 |
| Qatar | 9 |
| Türkiye | 9 |
| Uruguay | 9 |
| Iraq | 8 |
| Netherlands | 8 |
| Algeria | 6 |
| Canada | 6 |
| South Africa | 6 |
| IR Iran | 5 |
| Panama | 5 |
| Saudi Arabia | 5 |
| USA | 5 |
| Jordan | 4 |
| Czechia | 3 |
| Ghana | 3 |
| Senegal | 3 |
| Bosnia and Herzegovina | 1 |
| Côte d'Ivoire | 1 |
| Egypt | 1 |
| Germany | 1 |
| Japan | 1 |
| Korea Republic | 1 |
| Scotland | 1 |
| Sweden | 1 |

## Review Rows by Official Fantasy Position

| Official fantasy position | Review rows |
| --- | --- |
| MID | 85 |
| DEF | 70 |
| FWD | 36 |
| GK | 34 |

## Duplicate-Name Cases

| Country / name | Official fantasy IDs | Fantasy positions | Mapped internal player IDs | Decision |
| --- | --- | --- | --- | --- |
| Mexico / Jesús Angulo | 745, 1475 | DEF, MID | mexico-jesus-alberto-angulo, mexico-jesus-ricardo-angulo | distinct official fantasy IDs; keep separate |

The Mexico `Jesús Angulo` duplicate is not a merge problem. Official fantasy IDs `745` and `1475` map to separate internal identities and remain separate. Both still require squad-status review because the fantasy status is `transferred` and no final-squad source is imported for either row.

## Fantasy Status vs Squad Status Conflicts

No rows were promoted to `confirmed_final_squad`, `injured_removed`, `replacement_player`, or `not_in_final_squad` from fantasy status alone. The current classification is intentionally conservative:

| Fantasy status | Current roster_status | Rows | Interpretation |
| --- | --- | --- | --- |
| playing | selectable_fantasy_player | 1256 | In official fantasy pool only; not final-squad proof. |
| transferred | review | 225 | Needs player-level source before inclusion/exclusion can be decided. |

## Evidence Missing Before a Row Can Be Final

A row can only become `confirmed_final_squad` when an official FIFA tournament squad source, official FIFA team page, or national federation final squad source provides player-level squad membership. A team can only be marked complete when the full player-level final squad is source-backed. Removal and replacement statuses also need explicit source-backed evidence.

## Review Row Decisions

Every row below remains `review`; no row can safely become final, excluded, removed, or replacement from the current repo evidence.

| Official ID | Name | Country | Position | Price | Fantasy status | Review reasons | Safe decision | Evidence still needed |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 25 | Adil Aouchiche | Algeria | MID | 5.6 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 16 | Amin Chiakha | Algeria | FWD | 4 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 17 | Anthony Mandréa | Algeria | GK | 3.9 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 20 | Kilian Belazzoug | Algeria | GK | 3.5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 4 | Mehdi Dorval | Algeria | DEF | 3.7 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 6 | Sohaib Nair | Algeria | DEF | 3.5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 36 | Agustín Giay | Argentina | DEF | 3.7 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1331 | Alan Varela | Argentina | MID | 5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 52 | Alejandro Garnacho | Argentina | MID | 5.5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1328 | Aníbal Moreno | Argentina | MID | 5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1334 | Claudio Echeverri | Argentina | MID | 5.5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1327 | Emiliano Buendía | Argentina | MID | 6.5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1329 | Equi Fernández | Argentina | MID | 5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1315 | Facundo Cambeses | Argentina | GK | 4 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 44 | Franco Mastantuono | Argentina | MID | 5.8 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 35 | Gabriel Rojas | Argentina | DEF | 4 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1319 | Germán Pezzella | Argentina | DEF | 4.2 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 40 | Gianluca Prestianni | Argentina | MID | 5.6 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1330 | Guido Rodríguez | Argentina | MID | 5.6 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1324 | Kevin Mac Allister | Argentina | DEF | 3.8 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1322 | Lautaro Di Lollo | Argentina | DEF | 3.5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 33 | Lucas Martínez Quarta | Argentina | DEF | 4.3 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 32 | Marcos Acuña | Argentina | DEF | 4.3 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 29 | Marcos Senesi | Argentina | DEF | 4.7 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1339 | Mateo Pellegrino | Argentina | FWD | 5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1335 | Matías Soulé | Argentina | MID | 6.2 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 49 | Máximo Perrone | Argentina | MID | 5.6 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1337 | Milton Delgado | Argentina | MID | 4.2 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1336 | Nicolás Capaldo | Argentina | MID | 5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1333 | Nicolás Domínguez | Argentina | MID | 5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1317 | Santiago Beltrán | Argentina | GK | 4 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1340 | Santiago Castro | Argentina | FWD | 6 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1332 | Tomás Aranda | Argentina | MID | 4.3 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1316 | Walter Benítez | Argentina | GK | 4.5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1321 | Zaid Romero | Argentina | DEF | 3.5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 79 | Alex Robertson | Australia | MID | 5.1 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 73 | Ante Suto | Australia | FWD | 4 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 2008 | Brandon Borrello | Australia | FWD | 4.4 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 71 | Deni Juric | Australia | FWD | 4.2 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 65 | Fran Karacic | Australia | DEF | 3.6 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 2001 | Joe Gauci | Australia | GK | 3.9 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 59 | Kye Rowles | Australia | DEF | 3.9 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 69 | Martin Boyle | Australia | FWD | 5.1 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 78 | Patrick Yazbek | Australia | MID | 4.9 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 84 | Riley McGree | Australia | MID | 5.9 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 154 | Osman Hadzikic | Bosnia and Herzegovina | GK | 3.6 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 233 | Daniel Jebbison | Canada | FWD | 4.2 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 232 | Jacen Russell-Rowe | Canada | FWD | 4.5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1965 | Jamie Knight-Lebel | Canada | DEF | 3.7 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1969 | Jayden Nelson | Canada | MID | 5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 239 | Ralph Priso | Canada | MID | 4.9 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1962 | Zorhan Bassong | Canada | DEF | 3.7 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 306 | Clément Akpa | Côte d'Ivoire | DEF | 3.6 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1423 | Christophe Kabongo | Czechia | FWD | 4.5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 392 | Pavel Bucha | Czechia | MID | 5.5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 386 | Tomás Ladra | Czechia | FWD | 4.4 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1945 | Bruno Caicedo | Ecuador | MID | 5.2 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1939 | Cristhian Loor | Ecuador | GK | 4 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1943 | Darwin Guagua | Ecuador | MID | 4.8 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1940 | Deinner Ordóñez | Ecuador | DEF | 4.1 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1942 | Ederson Castillo | Ecuador | MID | 4.2 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1941 | Fricio Caicedo | Ecuador | DEF | 4 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 419 | John Mercado | Ecuador | FWD | 4.4 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 406 | José Hurtado | Ecuador | DEF | 3.9 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1946 | Luis Fragozo | Ecuador | MID | 5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1944 | Malcom DaCosta | Ecuador | MID | 3.8 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1595 | Aqtay Abdallah | Egypt | FWD | 4.3 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 2054 | Jonas Urbig | Germany | GK | 4 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1978 | Alexander Djiku | Ghana | DEF | 4 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1433 | Paul Reverson | Ghana | GK | 3.5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1434 | Solomon Agbasi | Ghana | GK | 3.5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 618 | Amirhossein Mahmoudi | IR Iran | FWD | 4 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 595 | Hadi Habibinejad | IR Iran | MID | 4.7 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1562 | Kasra Taheri | IR Iran | FWD | 4.7 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 623 | Mohammad Khalifeh | IR Iran | GK | 3.5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 624 | Omid Noorafkan | IR Iran | MID | 5.3 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 645 | Ahmed Hasan Maknzi Al Deeshawee | Iraq | DEF | 3.5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1566 | Dario Naamo | Iraq | DEF | 3.5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 632 | Hasan Abdulkareem Jabbar Sayyid | Iraq | MID | 4.7 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1567 | Jussef Nasrawe | Iraq | MID | 4.4 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 652 | Karar Nabeel Hussein Al Janat | Iraq | MID | 4 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 655 | Kumel Saadi Latif Al Rekabe | Iraq | GK | 3.5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 640 | Maytham Jabbar Mutlag Al Farttoosi | Iraq | DEF | 3.6 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 633 | Peter Gwargis | Iraq | MID | 5.1 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1609 | Maya Yoshida | Japan | DEF | 3.7 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 697 | Ahmad Fawzi Abdalateef Assaf | Jordan | DEF | 3.5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1542 | Ahmad Mohannad Talab Al Juaidi | Jordan | GK | 3.6 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 696 | Mohammad Ahmed Mohammad Taha | Jordan | DEF | 3.5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 685 | Yousef Hussein Abed Qashi | Jordan | MID | 4.2 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 717 | Yu-Min Cho | Korea Republic | DEF | 3.9 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1463 | Alejandro Gómez | Mexico | DEF | 3.5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1461 | Álex Padilla | Mexico | GK | 3.5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1483 | Alexéi Domínguez | Mexico | FWD | 4.5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1481 | Alexis Gutiérrez | Mexico | MID | 4.9 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1459 | Antonio Rodríguez | Mexico | GK | 3.7 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1467 | Bryan González | Mexico | DEF | 3.5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1460 | Carlos Moreno | Mexico | GK | 3.6 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 760 | Carlos Rodríguez | Mexico | MID | 5.9 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1472 | Diego Lainez | Mexico | MID | 5.9 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1484 | Efraín Álvarez | Mexico | MID | 5.5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1479 | Elías Montiel | Mexico | MID | 4.5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 761 | Érick Sánchez | Mexico | MID | 4.5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 747 | Everardo López | Mexico | DEF | 3.5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 749 | Germán Berterame | Mexico | FWD | 5.6 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1482 | Jeremy Márquez | Mexico | MID | 4.7 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 745 | Jesús Angulo | Mexico | DEF | 3.9 | transferred | fantasy_status_transferred_no_final_squad_source; duplicate_name_distinct_official_fantasy_ids | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1475 | Jesús Angulo | Mexico | MID | 5.3 | transferred | fantasy_status_transferred_no_final_squad_source; duplicate_name_distinct_official_fantasy_ids | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1471 | Jordán Carrillo | Mexico | MID | 5.1 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1486 | Jorge Ruvalcaba | Mexico | FWD | 4.9 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1462 | Julián Araujo | Mexico | DEF | 4 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1480 | Kevin Castañeda | Mexico | MID | 4.9 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1470 | Marcel Ruiz | Mexico | MID | 5.9 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1464 | Ramón Juárez | Mexico | DEF | 3.6 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 746 | Richard Ledezma | Mexico | DEF | 3.9 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1468 | Víctor Guzmán | Mexico | DEF | 3.6 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 775 | Abdelhamid Aït Boudlal | Morocco | DEF | 3.5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1713 | Amine Sbaï | Morocco | FWD | 4.8 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 787 | El Mehdi Al Harrar | Morocco | GK | 3.5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1666 | Ibrahim Gomis | Morocco | GK | 3.5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1672 | Imrân Louza | Morocco | MID | 5.7 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 774 | Ismaël Baouf | Morocco | DEF | 3.5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1675 | Marwane Saadane | Morocco | MID | 4.7 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1670 | Mohamed Chibi | Morocco | DEF | 3.8 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1678 | Othmane Maamma | Morocco | MID | 4.7 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 766 | Oussama Targhalline | Morocco | MID | 5.3 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 783 | Rayane Bounida | Morocco | FWD | 4 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1671 | Sofiane Boufal | Morocco | MID | 6.3 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 770 | Souffian El Karouani | Morocco | DEF | 4 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1677 | Soufiane Benjdida | Morocco | FWD | 4.7 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1669 | Soufiane Bouftini | Morocco | DEF | 4 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1673 | Soufiane El-Faouzi | Morocco | MID | 4.9 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1679 | Tawfik Bentayeb | Morocco | FWD | 4.7 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1680 | Yanis Begraoui | Morocco | MID | 5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1667 | Yanis Benchaouch | Morocco | GK | 3.5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 784 | Yassir Zabiri | Morocco | FWD | 4 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 813 | Jerdy Schouten | Netherlands | MID | 6.1 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 799 | Jeremie Frimpong | Netherlands | DEF | 5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 811 | Justin Bijlow | Netherlands | GK | 4.3 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 793 | Kees Smit | Netherlands | MID | 4.7 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 794 | Luciano Valente | Netherlands | MID | 4.9 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 800 | Lutsharel Geertruida | Netherlands | DEF | 4.8 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 801 | Stefan de Vrij | Netherlands | DEF | 4.5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 815 | Xavi Simons | Netherlands | MID | 6.5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 2056 | Iván Anderson | Panama | DEF | 4 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 2055 | JD Gunn | Panama | GK | 4 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 883 | Kadir Barría | Panama | FWD | 4 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 877 | Martín Krug | Panama | DEF | 3.5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 2058 | Víctor Griffith | Panama | MID | 5.3 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1690 | Adam Bareiro | Paraguay | FWD | 5.7 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1689 | Adrián Alcaraz | Paraguay | FWD | 4.5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1500 | Agustín Sández | Paraguay | DEF | 3.7 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 897 | Alan Benítez | Paraguay | DEF | 3.8 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1501 | Alan Núñez | Paraguay | DEF | 3.5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1499 | Alcides Benítez | Paraguay | DEF | 3.5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1617 | Álvaro Campuzano | Paraguay | MID | 4.6 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1618 | Ángel Romero | Paraguay | MID | 4.9 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1498 | Blás Riveros | Paraguay | DEF | 3.9 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1496 | Carlos Coronel | Paraguay | GK | 4.1 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1687 | Carlos González | Paraguay | FWD | 5.7 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1621 | Diego González | Paraguay | MID | 5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1503 | Diego León | Paraguay | DEF | 3.5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1620 | Enso González | Paraguay | MID | 5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1615 | Hugo Cuenca | Paraguay | MID | 4.8 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1495 | Juan Espínola | Paraguay | GK | 3.5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1685 | Lorenzo Melgarejo | Paraguay | MID | 5.5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 891 | Lucas Romero | Paraguay | MID | 5.6 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1611 | Mateo Gamarra | Paraguay | DEF | 3.9 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1614 | Mathías Villasanti | Paraguay | MID | 4.6 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1613 | Óscar Romero | Paraguay | MID | 4.6 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1692 | Robert Morales | Paraguay | FWD | 5.3 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1612 | Robert Piris Da Motta | Paraguay | MID | 4.7 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1619 | Rodney Redes | Paraguay | MID | 4.8 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1610 | Ronaldo Dejesús | Paraguay | DEF | 3.8 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1691 | Ronaldo Martínez | Paraguay | MID | 5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1686 | Rubén Lezcano | Paraguay | MID | 5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1497 | Santiago Rojas | Paraguay | GK | 3.5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1502 | Saúl Salcedo | Paraguay | DEF | 3.7 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1512 | Andrés Sebastián Soria Quintana | Qatar | FWD | 5.1 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 950 | Bassam Husham Ali Al Rawi | Qatar | DEF | 3.8 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1575 | Fahad Younis Ahmed Mohammed Baker | Qatar | GK | 3.7 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 948 | Mohammed Waad Abdulwahhab Jadoua Al Bayati | Qatar | MID | 5.3 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 966 | Mubarak Shanan Khader Hamza | Qatar | FWD | 4 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 954 | Niall Aadya Mason | Qatar | DEF | 3.5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1505 | Rayyan Ahmed Al Ali | Qatar | DEF | 3.5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 970 | Shehab Mamdouh Abdelfadel Ellethy | Qatar | GK | 3.6 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1504 | Tarek Salman Suleiman Odeh | Qatar | DEF | 3.7 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1960 | Abdullah bin Ibrahim bin Ahmed Al Salem | Saudi Arabia | FWD | 5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1950 | Abdulquddus bin Atiah bin Mohammed Atiah Khaoud | Saudi Arabia | GK | 4 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 2059 | Abdulrahman bin Salem bin Fadhel Al Sanbi | Saudi Arabia | GK | 4 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1959 | Saleh bin Waheeb bin Saeed Abu Al Shamat | Saudi Arabia | FWD | 5.3 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1952 | Zakaria bin Siraj bin Ahmed Hawsawi | Saudi Arabia | DEF | 4 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1005 | Billy Gilmour | Scotland | MID | 5.1 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1693 | Ilay Camara | Senegal | DEF | 3.8 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1694 | Moustapha Mbow | Senegal | DEF | 3.7 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 2061 | Pape Sy | Senegal | GK | 3.8 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1697 | Brandon Petersen | South Africa | GK | 3.6 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1706 | Brooklyn Poggenpoel | South Africa | MID | 4.3 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1703 | Lebohang Maboe | South Africa | MID | 5.1 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1705 | Patrick Maswanganyi | South Africa | MID | 5.9 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1699 | Thabiso Monyane | South Africa | DEF | 3.6 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1702 | Thapelo Morena | South Africa | DEF | 3.8 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1517 | Emil Holm | Sweden | DEF | 4.1 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1203 | Ahmetcan Kaplan | Türkiye | DEF | 3.5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1587 | Aral Simsir | Türkiye | MID | 4.7 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1190 | Atakan Karazor | Türkiye | MID | 4.7 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1588 | Demir Ege Tiknaz | Türkiye | MID | 4.4 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1584 | Ersin Destanoglu | Türkiye | GK | 4 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1214 | Muhammed Sengezer | Türkiye | GK | 3.9 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1202 | Mustafa Eskihellaç | Türkiye | DEF | 3.9 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1585 | Yusuf Akçiçek | Türkiye | DEF | 4 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1590 | Yusuf Sari | Türkiye | MID | 5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1243 | Agustín Álvarez | Uruguay | FWD | 5.2 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1235 | Benjamín García | Uruguay | DEF | 3.5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1234 | Brian Barboza | Uruguay | DEF | 3.7 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1242 | Facundo Martínez | Uruguay | FWD | 5.3 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1240 | Facundo Torres | Uruguay | FWD | 5.4 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1233 | José Rodríguez | Uruguay | DEF | 3.9 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1220 | Luciano González | Uruguay | MID | 4.7 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1221 | Nicolás Fonseca | Uruguay | MID | 5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1217 | Pablo Alcoba | Uruguay | MID | 4.3 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1252 | Aidan Morris | USA | MID | 5.6 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1257 | Johnny Cardoso | USA | MID | 6.2 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1268 | Patrick Agyemang | USA | FWD | 4.9 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1272 | Patrick Schulte | USA | GK | 3.5 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |
| 1251 | Tanner Tessmann | USA | MID | 5.6 | transferred | fantasy_status_transferred_no_final_squad_source | keep review | Missing player-level final-squad, removal, or replacement source. |

## Blockers Before Readiness

- Final squads are not imported as complete, source-backed `confirmed_final_squad` rows.
- The 225 `transferred` fantasy-status rows need player-level source review before model-input promotion.
- Teams cannot be marked complete from fantasy pool data or partial/candidate article references.
- Official rules still have manual-review warnings outside this squad pass.
