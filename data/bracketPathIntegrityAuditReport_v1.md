# Bracket Path Integrity Audit v1

Generated: 2026-06-28T12:31:12.028Z

Status: **PASS**

## Source Of Truth

- Final R32 fixtures: `data/r32BracketPathModel_v1.json`
- Bracket slot/winner mapping: `worldCupData.js`
- Bracket-pool strategy model checked: `data/bracketPoolStrategyModel_v1.json`

## R32 Winner Slots

| Match | Fixture | Winner slot | Feeds match | Feeds side | Path |
| --- | --- | --- | --- | --- | --- |
| 73 | South Africa vs Canada | W73 | 90 | left | Group A runner-up v Group B runner-up |
| 74 | Germany vs Paraguay | W74 | 89 | left | Group E winner v third-place team from Group A/B/C/D/F |
| 75 | Netherlands vs Morocco | W75 | 90 | right | Group F winner v Group C runner-up |
| 76 | Brazil vs Japan | W76 | 91 | left | Group C winner v Group F runner-up |
| 77 | France vs Sweden | W77 | 89 | right | Group I winner v third-place team from Group C/D/F/G/H |
| 78 | Côte d'Ivoire vs Norway | W78 | 91 | right | Group E runner-up v Group I runner-up |
| 79 | Mexico vs Ecuador | W79 | 92 | left | Group A winner v third-place team from Group C/E/F/H/I |
| 80 | England vs Congo DR | W80 | 92 | right | Group L winner v third-place team from Group E/H/I/J/K |
| 81 | USA vs Bosnia and Herzegovina | W81 | 94 | left | Group D winner v third-place team from Group B/E/F/I/J |
| 82 | Belgium vs Senegal | W82 | 94 | right | Group G winner v third-place team from Group A/E/H/I/J |
| 83 | Portugal vs Croatia | W83 | 93 | left | Group K runner-up v Group L runner-up |
| 84 | Spain vs Austria | W84 | 93 | right | Group H winner v Group J runner-up |
| 85 | Switzerland vs Algeria | W85 | 96 | left | Group B winner v third-place team from Group E/F/G/I/J |
| 86 | Argentina vs Cabo Verde | W86 | 95 | left | Group J winner v Group H runner-up |
| 87 | Colombia vs Ghana | W87 | 96 | right | Group K winner v third-place team from Group D/E/I/J/L |
| 88 | Australia vs Egypt | W88 | 95 | right | Group D runner-up v Group G runner-up |

## Later-Round Winner Slots

| Match | Round | Left source | Right source | Left possible teams | Right possible teams |
| --- | --- | --- | --- | --- | --- |
| 89 | R16 | W74 | W77 | Germany, Paraguay | France, Sweden |
| 90 | R16 | W73 | W75 | Canada, South Africa | Morocco, Netherlands |
| 91 | R16 | W76 | W78 | Brazil, Japan | Côte d'Ivoire, Norway |
| 92 | R16 | W79 | W80 | Ecuador, Mexico | Congo DR, England |
| 93 | R16 | W83 | W84 | Croatia, Portugal | Austria, Spain |
| 94 | R16 | W81 | W82 | Bosnia and Herzegovina, USA | Belgium, Senegal |
| 95 | R16 | W86 | W88 | Argentina, Cabo Verde | Australia, Egypt |
| 96 | R16 | W85 | W87 | Algeria, Switzerland | Colombia, Ghana |
| 97 | QF | W89 | W90 | France, Germany, Paraguay, Sweden | Canada, Morocco, Netherlands, South Africa |
| 98 | QF | W93 | W94 | Austria, Croatia, Portugal, Spain | Belgium, Bosnia and Herzegovina, Senegal, USA |
| 99 | QF | W91 | W92 | Brazil, Côte d'Ivoire, Japan, Norway | Congo DR, Ecuador, England, Mexico |
| 100 | QF | W95 | W96 | Argentina, Australia, Cabo Verde, Egypt | Algeria, Colombia, Ghana, Switzerland |
| 101 | SF | W97 | W98 | Canada, France, Germany, Morocco, Netherlands, Paraguay, South Africa, Sweden | Austria, Belgium, Bosnia and Herzegovina, Croatia, Portugal, Senegal, Spain, USA |
| 102 | SF | W99 | W100 | Brazil, Congo DR, Côte d'Ivoire, Ecuador, England, Japan, Mexico, Norway | Algeria, Argentina, Australia, Cabo Verde, Colombia, Egypt, Ghana, Switzerland |
| 104 | Final | W101 | W102 | Austria, Belgium, Bosnia and Herzegovina, Canada, Croatia, France, Germany, Morocco, Netherlands, Paraguay, Portugal, Senegal, South Africa, Spain, Sweden, USA | Algeria, Argentina, Australia, Brazil, Cabo Verde, Colombia, Congo DR, Côte d'Ivoire, Ecuador, Egypt, England, Ghana, Japan, Mexico, Norway, Switzerland |

## Team Path Table

| Team | R32 opponent | Possible R16 | Possible QF | Possible SF | Opposite-side finalists only |
| --- | --- | --- | --- | --- | --- |
| Algeria | Switzerland | Colombia, Ghana | Argentina, Australia, Cabo Verde, Egypt | Brazil, Congo DR, Côte d'Ivoire, Ecuador, England, Japan, Mexico, Norway | Austria, Belgium, Bosnia and Herzegovina, Canada, Croatia, France, Germany, Morocco, Netherlands, Paraguay, Portugal, Senegal, South Africa, Spain, Sweden, USA |
| Argentina | Cabo Verde | Australia, Egypt | Algeria, Colombia, Ghana, Switzerland | Brazil, Congo DR, Côte d'Ivoire, Ecuador, England, Japan, Mexico, Norway | Austria, Belgium, Bosnia and Herzegovina, Canada, Croatia, France, Germany, Morocco, Netherlands, Paraguay, Portugal, Senegal, South Africa, Spain, Sweden, USA |
| Australia | Egypt | Argentina, Cabo Verde | Algeria, Colombia, Ghana, Switzerland | Brazil, Congo DR, Côte d'Ivoire, Ecuador, England, Japan, Mexico, Norway | Austria, Belgium, Bosnia and Herzegovina, Canada, Croatia, France, Germany, Morocco, Netherlands, Paraguay, Portugal, Senegal, South Africa, Spain, Sweden, USA |
| Austria | Spain | Croatia, Portugal | Belgium, Bosnia and Herzegovina, Senegal, USA | Canada, France, Germany, Morocco, Netherlands, Paraguay, South Africa, Sweden | Algeria, Argentina, Australia, Brazil, Cabo Verde, Colombia, Congo DR, Côte d'Ivoire, Ecuador, Egypt, England, Ghana, Japan, Mexico, Norway, Switzerland |
| Belgium | Senegal | Bosnia and Herzegovina, USA | Austria, Croatia, Portugal, Spain | Canada, France, Germany, Morocco, Netherlands, Paraguay, South Africa, Sweden | Algeria, Argentina, Australia, Brazil, Cabo Verde, Colombia, Congo DR, Côte d'Ivoire, Ecuador, Egypt, England, Ghana, Japan, Mexico, Norway, Switzerland |
| Bosnia and Herzegovina | USA | Belgium, Senegal | Austria, Croatia, Portugal, Spain | Canada, France, Germany, Morocco, Netherlands, Paraguay, South Africa, Sweden | Algeria, Argentina, Australia, Brazil, Cabo Verde, Colombia, Congo DR, Côte d'Ivoire, Ecuador, Egypt, England, Ghana, Japan, Mexico, Norway, Switzerland |
| Brazil | Japan | Côte d'Ivoire, Norway | Congo DR, Ecuador, England, Mexico | Algeria, Argentina, Australia, Cabo Verde, Colombia, Egypt, Ghana, Switzerland | Austria, Belgium, Bosnia and Herzegovina, Canada, Croatia, France, Germany, Morocco, Netherlands, Paraguay, Portugal, Senegal, South Africa, Spain, Sweden, USA |
| Cabo Verde | Argentina | Australia, Egypt | Algeria, Colombia, Ghana, Switzerland | Brazil, Congo DR, Côte d'Ivoire, Ecuador, England, Japan, Mexico, Norway | Austria, Belgium, Bosnia and Herzegovina, Canada, Croatia, France, Germany, Morocco, Netherlands, Paraguay, Portugal, Senegal, South Africa, Spain, Sweden, USA |
| Canada | South Africa | Morocco, Netherlands | France, Germany, Paraguay, Sweden | Austria, Belgium, Bosnia and Herzegovina, Croatia, Portugal, Senegal, Spain, USA | Algeria, Argentina, Australia, Brazil, Cabo Verde, Colombia, Congo DR, Côte d'Ivoire, Ecuador, Egypt, England, Ghana, Japan, Mexico, Norway, Switzerland |
| Colombia | Ghana | Algeria, Switzerland | Argentina, Australia, Cabo Verde, Egypt | Brazil, Congo DR, Côte d'Ivoire, Ecuador, England, Japan, Mexico, Norway | Austria, Belgium, Bosnia and Herzegovina, Canada, Croatia, France, Germany, Morocco, Netherlands, Paraguay, Portugal, Senegal, South Africa, Spain, Sweden, USA |
| Congo DR | England | Ecuador, Mexico | Brazil, Côte d'Ivoire, Japan, Norway | Algeria, Argentina, Australia, Cabo Verde, Colombia, Egypt, Ghana, Switzerland | Austria, Belgium, Bosnia and Herzegovina, Canada, Croatia, France, Germany, Morocco, Netherlands, Paraguay, Portugal, Senegal, South Africa, Spain, Sweden, USA |
| Côte d'Ivoire | Norway | Brazil, Japan | Congo DR, Ecuador, England, Mexico | Algeria, Argentina, Australia, Cabo Verde, Colombia, Egypt, Ghana, Switzerland | Austria, Belgium, Bosnia and Herzegovina, Canada, Croatia, France, Germany, Morocco, Netherlands, Paraguay, Portugal, Senegal, South Africa, Spain, Sweden, USA |
| Croatia | Portugal | Austria, Spain | Belgium, Bosnia and Herzegovina, Senegal, USA | Canada, France, Germany, Morocco, Netherlands, Paraguay, South Africa, Sweden | Algeria, Argentina, Australia, Brazil, Cabo Verde, Colombia, Congo DR, Côte d'Ivoire, Ecuador, Egypt, England, Ghana, Japan, Mexico, Norway, Switzerland |
| Ecuador | Mexico | Congo DR, England | Brazil, Côte d'Ivoire, Japan, Norway | Algeria, Argentina, Australia, Cabo Verde, Colombia, Egypt, Ghana, Switzerland | Austria, Belgium, Bosnia and Herzegovina, Canada, Croatia, France, Germany, Morocco, Netherlands, Paraguay, Portugal, Senegal, South Africa, Spain, Sweden, USA |
| Egypt | Australia | Argentina, Cabo Verde | Algeria, Colombia, Ghana, Switzerland | Brazil, Congo DR, Côte d'Ivoire, Ecuador, England, Japan, Mexico, Norway | Austria, Belgium, Bosnia and Herzegovina, Canada, Croatia, France, Germany, Morocco, Netherlands, Paraguay, Portugal, Senegal, South Africa, Spain, Sweden, USA |
| England | Congo DR | Ecuador, Mexico | Brazil, Côte d'Ivoire, Japan, Norway | Algeria, Argentina, Australia, Cabo Verde, Colombia, Egypt, Ghana, Switzerland | Austria, Belgium, Bosnia and Herzegovina, Canada, Croatia, France, Germany, Morocco, Netherlands, Paraguay, Portugal, Senegal, South Africa, Spain, Sweden, USA |
| France | Sweden | Germany, Paraguay | Canada, Morocco, Netherlands, South Africa | Austria, Belgium, Bosnia and Herzegovina, Croatia, Portugal, Senegal, Spain, USA | Algeria, Argentina, Australia, Brazil, Cabo Verde, Colombia, Congo DR, Côte d'Ivoire, Ecuador, Egypt, England, Ghana, Japan, Mexico, Norway, Switzerland |
| Germany | Paraguay | France, Sweden | Canada, Morocco, Netherlands, South Africa | Austria, Belgium, Bosnia and Herzegovina, Croatia, Portugal, Senegal, Spain, USA | Algeria, Argentina, Australia, Brazil, Cabo Verde, Colombia, Congo DR, Côte d'Ivoire, Ecuador, Egypt, England, Ghana, Japan, Mexico, Norway, Switzerland |
| Ghana | Colombia | Algeria, Switzerland | Argentina, Australia, Cabo Verde, Egypt | Brazil, Congo DR, Côte d'Ivoire, Ecuador, England, Japan, Mexico, Norway | Austria, Belgium, Bosnia and Herzegovina, Canada, Croatia, France, Germany, Morocco, Netherlands, Paraguay, Portugal, Senegal, South Africa, Spain, Sweden, USA |
| Japan | Brazil | Côte d'Ivoire, Norway | Congo DR, Ecuador, England, Mexico | Algeria, Argentina, Australia, Cabo Verde, Colombia, Egypt, Ghana, Switzerland | Austria, Belgium, Bosnia and Herzegovina, Canada, Croatia, France, Germany, Morocco, Netherlands, Paraguay, Portugal, Senegal, South Africa, Spain, Sweden, USA |
| Mexico | Ecuador | Congo DR, England | Brazil, Côte d'Ivoire, Japan, Norway | Algeria, Argentina, Australia, Cabo Verde, Colombia, Egypt, Ghana, Switzerland | Austria, Belgium, Bosnia and Herzegovina, Canada, Croatia, France, Germany, Morocco, Netherlands, Paraguay, Portugal, Senegal, South Africa, Spain, Sweden, USA |
| Morocco | Netherlands | Canada, South Africa | France, Germany, Paraguay, Sweden | Austria, Belgium, Bosnia and Herzegovina, Croatia, Portugal, Senegal, Spain, USA | Algeria, Argentina, Australia, Brazil, Cabo Verde, Colombia, Congo DR, Côte d'Ivoire, Ecuador, Egypt, England, Ghana, Japan, Mexico, Norway, Switzerland |
| Netherlands | Morocco | Canada, South Africa | France, Germany, Paraguay, Sweden | Austria, Belgium, Bosnia and Herzegovina, Croatia, Portugal, Senegal, Spain, USA | Algeria, Argentina, Australia, Brazil, Cabo Verde, Colombia, Congo DR, Côte d'Ivoire, Ecuador, Egypt, England, Ghana, Japan, Mexico, Norway, Switzerland |
| Norway | Côte d'Ivoire | Brazil, Japan | Congo DR, Ecuador, England, Mexico | Algeria, Argentina, Australia, Cabo Verde, Colombia, Egypt, Ghana, Switzerland | Austria, Belgium, Bosnia and Herzegovina, Canada, Croatia, France, Germany, Morocco, Netherlands, Paraguay, Portugal, Senegal, South Africa, Spain, Sweden, USA |
| Paraguay | Germany | France, Sweden | Canada, Morocco, Netherlands, South Africa | Austria, Belgium, Bosnia and Herzegovina, Croatia, Portugal, Senegal, Spain, USA | Algeria, Argentina, Australia, Brazil, Cabo Verde, Colombia, Congo DR, Côte d'Ivoire, Ecuador, Egypt, England, Ghana, Japan, Mexico, Norway, Switzerland |
| Portugal | Croatia | Austria, Spain | Belgium, Bosnia and Herzegovina, Senegal, USA | Canada, France, Germany, Morocco, Netherlands, Paraguay, South Africa, Sweden | Algeria, Argentina, Australia, Brazil, Cabo Verde, Colombia, Congo DR, Côte d'Ivoire, Ecuador, Egypt, England, Ghana, Japan, Mexico, Norway, Switzerland |
| Senegal | Belgium | Bosnia and Herzegovina, USA | Austria, Croatia, Portugal, Spain | Canada, France, Germany, Morocco, Netherlands, Paraguay, South Africa, Sweden | Algeria, Argentina, Australia, Brazil, Cabo Verde, Colombia, Congo DR, Côte d'Ivoire, Ecuador, Egypt, England, Ghana, Japan, Mexico, Norway, Switzerland |
| South Africa | Canada | Morocco, Netherlands | France, Germany, Paraguay, Sweden | Austria, Belgium, Bosnia and Herzegovina, Croatia, Portugal, Senegal, Spain, USA | Algeria, Argentina, Australia, Brazil, Cabo Verde, Colombia, Congo DR, Côte d'Ivoire, Ecuador, Egypt, England, Ghana, Japan, Mexico, Norway, Switzerland |
| Spain | Austria | Croatia, Portugal | Belgium, Bosnia and Herzegovina, Senegal, USA | Canada, France, Germany, Morocco, Netherlands, Paraguay, South Africa, Sweden | Algeria, Argentina, Australia, Brazil, Cabo Verde, Colombia, Congo DR, Côte d'Ivoire, Ecuador, Egypt, England, Ghana, Japan, Mexico, Norway, Switzerland |
| Sweden | France | Germany, Paraguay | Canada, Morocco, Netherlands, South Africa | Austria, Belgium, Bosnia and Herzegovina, Croatia, Portugal, Senegal, Spain, USA | Algeria, Argentina, Australia, Brazil, Cabo Verde, Colombia, Congo DR, Côte d'Ivoire, Ecuador, Egypt, England, Ghana, Japan, Mexico, Norway, Switzerland |
| Switzerland | Algeria | Colombia, Ghana | Argentina, Australia, Cabo Verde, Egypt | Brazil, Congo DR, Côte d'Ivoire, Ecuador, England, Japan, Mexico, Norway | Austria, Belgium, Bosnia and Herzegovina, Canada, Croatia, France, Germany, Morocco, Netherlands, Paraguay, Portugal, Senegal, South Africa, Spain, Sweden, USA |
| USA | Bosnia and Herzegovina | Belgium, Senegal | Austria, Croatia, Portugal, Spain | Canada, France, Germany, Morocco, Netherlands, Paraguay, South Africa, Sweden | Algeria, Argentina, Australia, Brazil, Cabo Verde, Colombia, Congo DR, Côte d'Ivoire, Ecuador, Egypt, England, Ghana, Japan, Mexico, Norway, Switzerland |

## Sanity Section

| Team | Possible R16 | Possible QF | Bracket half |
| --- | --- | --- | --- |
| France | Germany, Paraguay | Canada, Morocco, Netherlands, South Africa | winner_m101 |
| Argentina | Australia, Egypt | Algeria, Colombia, Ghana, Switzerland | winner_m102 |
| Germany | France, Sweden | Canada, Morocco, Netherlands, South Africa | winner_m101 |
| Spain | Croatia, Portugal | Belgium, Bosnia and Herzegovina, Senegal, USA | winner_m101 |
| Portugal | Austria, Spain | Belgium, Bosnia and Herzegovina, Senegal, USA | winner_m101 |
| England | Ecuador, Mexico | Brazil, Côte d'Ivoire, Japan, Norway | winner_m102 |
| Colombia | Algeria, Switzerland | Argentina, Australia, Cabo Verde, Egypt | winner_m102 |

## Checks

| Check | Status | Detail |
| --- | --- | --- |
| known_r32_fixture_count | pass | 16 |
| official_r32_nodes_available | pass | 16 |
| no_duplicate_r32_fixtures | pass |  |
| no_team_in_two_r32_fixtures | pass |  |
| r32_fixtures_fit_official_group_rank_slots | pass |  |
| r32_fixtures_not_mapped_by_raw_source_fixture_id | pass |  |
| all_dependencies_resolve | pass |  |
| single_winner_final_match | pass | 104 |
| opposite_halves_do_not_meet_before_final | pass |  |
| final_opponents_are_opposite_half_only | pass |  |
| france_argentina_not_r16_after_slot_mapping | pass | {"france_possible_r16_opponents":["Germany","Paraguay"],"argentina_possible_r16_opponents":["Australia","Egypt"]} |
| bracket_pool_tree_matches_official_slots | pass |  |
| bracket_pool_strategies_use_valid_path_propagation | pass |  |

## Failures

- None
