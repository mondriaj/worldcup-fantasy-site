# Player Identity Review Resolution Report v1

Generated: 2026-06-02

## Scope

This report documents the original 6 high-risk player identity review resolutions plus a later enrichment-QA addendum for hard identity conflicts found while building club and national-team usage coverage. It did not start score prediction reruns, matchday projection reruns, recommendations, Team Builder changes, captain logic, substitution logic, browser-ready updates, or UX changes.

## Baseline Before This Session

| Metric | Count |
| --- | ---: |
| Official fantasy players processed | 1,481 |
| Exact matches | 1,003 |
| Strong matches | 234 |
| Manual-confirmed matches | 0 |
| Confirmed thin profiles | 238 |
| Review cases | 6 |
| `multiple_candidate_matches` review cases | 4 |
| `duplicate_internal_mapping` review cases | 2 |
| Accepted position conflicts with audit flag | 130 |
| Missing official prices | 0 |
| Missing official positions | 0 |

The 6 unresolved cases were:

| Official ID | Official name | Country | Official position | Review reason |
| --- | --- | --- | --- | --- |
| 335 | Marco Pasalic | Croatia | FWD | `multiple_candidate_matches` |
| 347 | Mario Pasalic | Croatia | MID | `multiple_candidate_matches` |
| 745 | Jesús Angulo | Mexico | DEF | `multiple_candidate_matches` |
| 1475 | Jesús Angulo | Mexico | MID | `multiple_candidate_matches` |
| 606 | Ali Nemati | IR Iran | DEF | `duplicate_internal_mapping` |
| 624 | Omid Noorafkan | IR Iran | MID | `duplicate_internal_mapping` |

## Resolution Method

Added `data/mappings/playerIdentityManualOverrides_v1.csv` and updated `scripts/matchOfficialFantasyPlayers.mjs` so reviewed override rows are applied before automated candidate scoring.

Allowed override actions are `map_to_internal`, `create_thin_profile`, `keep_in_review`, and `reject_candidate`. This keeps reviewed decisions in data rather than hard-coded special cases.

Evidence used for these 6 rows:

- Official row fields from `data/officialFantasyPlayers_v0.json`: official fantasy ID, official name, country, team ID, official fantasy position, official price, source URL, and source checked date.
- Existing internal identity fields from `data/players.json`: internal player ID, internal name, country, team ID, model position, and club where present.
- The official import does not include club, date of birth, or shirt number for these 6 rows, so those fields were not invented.

## Final Decisions

| Official ID | Official name | Final decision | Final internal player ID | Thin profile created | Evidence and notes |
| --- | --- | --- | --- | --- | --- |
| 335 | Marco Pasalic | `manual_confirmed` | `croatia-marco-pasalic` | No | Official ID/name/Croatia/FWD align with existing internal Marco Pasalic, whose internal position is FWD and club is Orlando City. The close Mario candidate differs by given name, position, and club. |
| 347 | Mario Pasalic | `manual_confirmed` | `croatia-mario-pasalic` | No | Official ID/name/Croatia/MID align with existing internal Mario Pasalic, whose internal position is MID and club is Atalanta. The close Marco candidate differs by given name, position, and club. |
| 745 | Jesús Angulo | `manual_confirmed` | `mexico-jesus-alberto-angulo` | No | The official row is Mexico DEF. Existing internal Jesús Alberto Angulo is the DEF candidate and is distinct from Jesús Ricardo Angulo, the MID candidate. |
| 1475 | Jesús Angulo | `manual_confirmed` | `mexico-jesus-ricardo-angulo` | No | The official row is Mexico MID. Existing internal Jesús Ricardo Angulo is the MID candidate and is distinct from Jesús Alberto Angulo, the DEF candidate. |
| 606 | Ali Nemati | `new_player_created` | `thin-23-ali-nemati` | Yes | Official import has a distinct Ali Nemati row and reports no current-player match. The only internal candidate is the combined row `ir-iran-ali-nemati-omid-noorafkan`, which cannot safely represent both official players. |
| 624 | Omid Noorafkan | `new_player_created` | `thin-23-omid-noorafkan` | Yes | Official import has a distinct Omid Noorafkan row and reports no current-player match. The only internal candidate is the combined row `ir-iran-ali-nemati-omid-noorafkan`, which cannot safely represent both official players. |

The two Iran rows are thin profiles only. No historical performance, club minutes, or national-team usage was assigned.

## Enrichment-QA Hard Conflict Addendum

While generating `data/playerClubContext_v1.csv` and `data/playerQualifierUsage_v1.csv`, the coverage QA surfaced high-price thin profiles whose official import CSV rows contained source-backed `display_name` values matching existing internal players. Under the rule that identity mappings can change only when a hard conflict is found, the following rows were added to `data/mappings/playerIdentityManualOverrides_v1.csv` and the matcher was rerun:

| Official ID | Official name | Official/import display evidence | Final internal player ID | Notes |
| --- | --- | --- | --- | --- |
| 173 | Vinícius José Paixão de Oliveira Júnior | `display_name=Vinícius Júnior` | `brazil-vinicius-junior` | Official MID remains the future fantasy position; internal FWD remains audit context. |
| 182 | Ederson Santana de Moraes | `display_name=Ederson` | `brazil-ederson` | Existing Brazil goalkeeper row. |
| 183 | Alisson Ramsés Becker | `display_name=Alisson Becker` | `brazil-alisson` | Existing Brazil goalkeeper row. |
| 188 | Carlos Henrique Casimiro | `display_name=Casemiro` | `brazil-casemiro` | Existing Brazil midfielder row. |
| 190 | Lucas Tolentino Coelho de Lima | `display_name=Lucas Paquetá` | `brazil-lucas-paqueta` | Existing Brazil midfielder row. |
| 723 | Heung-Min Son | `display_name=Son Heung-Min` | `korea-republic-son-heungmin-lafc` | Existing Korea Republic forward row. |
| 724 | Hee-Chan Hwang | `display_name=Hwang Hee-Chan` | `korea-republic-hwang-heechan-wolves` | Official FWD remains the future fantasy position; internal MID remains audit context. |
| 736 | Kang-In Lee | `display_name=Lee Kang-In` | `korea-republic-lee-kangin-psg` | Existing Korea Republic midfielder row. |
| 737 | Jae-Sung Lee | `display_name=Lee Jae-Sung` | `korea-republic-lee-jaesung-fsv-mainz` | Existing Korea Republic midfielder row. |
| 936 | Vítor Machado Ferreira | `display_name=Vitinha` | `portugal-vitinha` | Existing Portugal midfielder row. |
| 1346 | Wesley Vinícius França Lima | `display_name=Wesley` | `brazil-wesley` | Existing Brazil defender row. |
| 1366 | Raphael Dias Belloli | `display_name=Raphinha` | `brazil-raphinha` | Official MID remains the future fantasy position; internal FWD remains audit context. |
| 1369 | Neymar da Silva Santos Júnior | `display_name=Neymar` | `brazil-neymar-junior` | Official MID remains the future fantasy position; internal FWD remains audit context. |
| 1396 | Cucho Hernández | Official display/name fields plus one clear existing Colombia FWD Hernández row | `colombia-juan-camilo-hernandez` | Existing Colombia forward row. |

## Results After Rerun

Command run:

```bash
node scripts/matchOfficialFantasyPlayers.mjs
```

| Metric | Count |
| --- | ---: |
| Official fantasy players processed | 1,481 |
| Exact matches | 1,003 |
| Strong matches | 234 |
| Manual-confirmed matches | 18 |
| Confirmed thin profiles | 226 |
| Review cases | 0 |
| `multiple_candidate_matches` review cases | 0 |
| `duplicate_internal_mapping` review cases | 0 |
| Accepted position conflicts with audit flag | 134 |
| Position conflicts still unresolved | 0 |
| Duplicate official fantasy ID conflicts | 0 |
| Duplicate accepted internal-player mapping conflicts | 0 |
| Missing official prices | 0 |
| Missing official positions | 0 |

## Remaining Identity Blockers

There are no remaining high-risk identity review rows in `data/review/playerIdentityReviewQueue_v1.csv`.

The identity layer is now clean enough to proceed to club-context and national-team usage enrichment. Do not rerun models until the full official-data readiness gate passes.

## Remaining Official-Data Blockers

Full readiness remains blocked because official final squads, official fantasy rules, scoring, deadlines, and active model integration are still incomplete. The project should remain at the official-data gate until `node scripts/validateOfficialDataReadiness.mjs` returns `ready_for_official_model_rerun`.
