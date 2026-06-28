# Bracket Path Integrity Audit v1

Generated: 2026-06-28T12:16:32.086Z

Status: **PASS**

## Source Of Truth

- Final R32 fixtures: `data/r32BracketPathModel_v1.json`
- Bracket slot/winner mapping: `worldCupData.js`
- Bracket-pool strategy model checked: `data/bracketPoolStrategyModel_v1.json`

## R32 Winner Slots

| Match | Fixture | Winner slot | Feeds match | Feeds side | Path |
| --- | --- | --- | --- | --- | --- |
| 73 | South Africa vs Canada | W73 | 90 | left | Group A runner-up v Group B runner-up |
| 74 | Brazil vs Japan | W74 | 89 | left | Group E winner v third-place team from Group A/B/C/D/F |
| 75 | Netherlands vs Morocco | W75 | 90 | right | Group F winner v Group C runner-up |
| 76 | USA vs Bosnia and Herzegovina | W76 | 91 | left | Group C winner v Group F runner-up |
| 77 | Côte d'Ivoire vs Norway | W77 | 89 | right | Group I winner v third-place team from Group C/D/F/G/H |
| 78 | Germany vs Paraguay | W78 | 91 | right | Group E runner-up v Group I runner-up |
| 79 | France vs Sweden | W79 | 92 | left | Group A winner v third-place team from Group C/E/F/H/I |
| 80 | Argentina vs Cabo Verde | W80 | 92 | right | Group L winner v third-place team from Group E/H/I/J/K |
| 81 | Australia vs Egypt | W81 | 94 | left | Group D winner v third-place team from Group B/E/F/I/J |
| 82 | Mexico vs Ecuador | W82 | 94 | right | Group G winner v third-place team from Group A/E/H/I/J |
| 83 | England vs Congo DR | W83 | 93 | left | Group K runner-up v Group L runner-up |
| 84 | Belgium vs Senegal | W84 | 93 | right | Group H winner v Group J runner-up |
| 85 | Portugal vs Croatia | W85 | 96 | left | Group B winner v third-place team from Group E/F/G/I/J |
| 86 | Colombia vs Ghana | W86 | 95 | left | Group J winner v Group H runner-up |
| 87 | Spain vs Austria | W87 | 96 | right | Group K winner v third-place team from Group D/E/I/J/L |
| 88 | Switzerland vs Algeria | W88 | 95 | right | Group D runner-up v Group G runner-up |

## Later-Round Winner Slots

| Match | Round | Left source | Right source | Left possible teams | Right possible teams |
| --- | --- | --- | --- | --- | --- |
| 89 | R16 | W74 | W77 | Brazil, Japan | Côte d'Ivoire, Norway |
| 90 | R16 | W73 | W75 | Canada, South Africa | Morocco, Netherlands |
| 91 | R16 | W76 | W78 | Bosnia and Herzegovina, USA | Germany, Paraguay |
| 92 | R16 | W79 | W80 | France, Sweden | Argentina, Cabo Verde |
| 93 | R16 | W83 | W84 | Congo DR, England | Belgium, Senegal |
| 94 | R16 | W81 | W82 | Australia, Egypt | Ecuador, Mexico |
| 95 | R16 | W86 | W88 | Colombia, Ghana | Algeria, Switzerland |
| 96 | R16 | W85 | W87 | Croatia, Portugal | Austria, Spain |
| 97 | QF | W89 | W90 | Brazil, Côte d'Ivoire, Japan, Norway | Canada, Morocco, Netherlands, South Africa |
| 98 | QF | W93 | W94 | Belgium, Congo DR, England, Senegal | Australia, Ecuador, Egypt, Mexico |
| 99 | QF | W91 | W92 | Bosnia and Herzegovina, Germany, Paraguay, USA | Argentina, Cabo Verde, France, Sweden |
| 100 | QF | W95 | W96 | Algeria, Colombia, Ghana, Switzerland | Austria, Croatia, Portugal, Spain |
| 101 | SF | W97 | W98 | Brazil, Canada, Côte d'Ivoire, Japan, Morocco, Netherlands, Norway, South Africa | Australia, Belgium, Congo DR, Ecuador, Egypt, England, Mexico, Senegal |
| 102 | SF | W99 | W100 | Argentina, Bosnia and Herzegovina, Cabo Verde, France, Germany, Paraguay, Sweden, USA | Algeria, Austria, Colombia, Croatia, Ghana, Portugal, Spain, Switzerland |
| 104 | Final | W101 | W102 | Australia, Belgium, Brazil, Canada, Congo DR, Côte d'Ivoire, Ecuador, Egypt, England, Japan, Mexico, Morocco, Netherlands, Norway, Senegal, South Africa | Algeria, Argentina, Austria, Bosnia and Herzegovina, Cabo Verde, Colombia, Croatia, France, Germany, Ghana, Paraguay, Portugal, Spain, Sweden, Switzerland, USA |

## Team Path Table

| Team | R32 opponent | Possible R16 | Possible QF | Possible SF | Opposite-side finalists only |
| --- | --- | --- | --- | --- | --- |
| Algeria | Switzerland | Colombia, Ghana | Austria, Croatia, Portugal, Spain | Argentina, Bosnia and Herzegovina, Cabo Verde, France, Germany, Paraguay, Sweden, USA | Australia, Belgium, Brazil, Canada, Congo DR, Côte d'Ivoire, Ecuador, Egypt, England, Japan, Mexico, Morocco, Netherlands, Norway, Senegal, South Africa |
| Argentina | Cabo Verde | France, Sweden | Bosnia and Herzegovina, Germany, Paraguay, USA | Algeria, Austria, Colombia, Croatia, Ghana, Portugal, Spain, Switzerland | Australia, Belgium, Brazil, Canada, Congo DR, Côte d'Ivoire, Ecuador, Egypt, England, Japan, Mexico, Morocco, Netherlands, Norway, Senegal, South Africa |
| Australia | Egypt | Ecuador, Mexico | Belgium, Congo DR, England, Senegal | Brazil, Canada, Côte d'Ivoire, Japan, Morocco, Netherlands, Norway, South Africa | Algeria, Argentina, Austria, Bosnia and Herzegovina, Cabo Verde, Colombia, Croatia, France, Germany, Ghana, Paraguay, Portugal, Spain, Sweden, Switzerland, USA |
| Austria | Spain | Croatia, Portugal | Algeria, Colombia, Ghana, Switzerland | Argentina, Bosnia and Herzegovina, Cabo Verde, France, Germany, Paraguay, Sweden, USA | Australia, Belgium, Brazil, Canada, Congo DR, Côte d'Ivoire, Ecuador, Egypt, England, Japan, Mexico, Morocco, Netherlands, Norway, Senegal, South Africa |
| Belgium | Senegal | Congo DR, England | Australia, Ecuador, Egypt, Mexico | Brazil, Canada, Côte d'Ivoire, Japan, Morocco, Netherlands, Norway, South Africa | Algeria, Argentina, Austria, Bosnia and Herzegovina, Cabo Verde, Colombia, Croatia, France, Germany, Ghana, Paraguay, Portugal, Spain, Sweden, Switzerland, USA |
| Bosnia and Herzegovina | USA | Germany, Paraguay | Argentina, Cabo Verde, France, Sweden | Algeria, Austria, Colombia, Croatia, Ghana, Portugal, Spain, Switzerland | Australia, Belgium, Brazil, Canada, Congo DR, Côte d'Ivoire, Ecuador, Egypt, England, Japan, Mexico, Morocco, Netherlands, Norway, Senegal, South Africa |
| Brazil | Japan | Côte d'Ivoire, Norway | Canada, Morocco, Netherlands, South Africa | Australia, Belgium, Congo DR, Ecuador, Egypt, England, Mexico, Senegal | Algeria, Argentina, Austria, Bosnia and Herzegovina, Cabo Verde, Colombia, Croatia, France, Germany, Ghana, Paraguay, Portugal, Spain, Sweden, Switzerland, USA |
| Cabo Verde | Argentina | France, Sweden | Bosnia and Herzegovina, Germany, Paraguay, USA | Algeria, Austria, Colombia, Croatia, Ghana, Portugal, Spain, Switzerland | Australia, Belgium, Brazil, Canada, Congo DR, Côte d'Ivoire, Ecuador, Egypt, England, Japan, Mexico, Morocco, Netherlands, Norway, Senegal, South Africa |
| Canada | South Africa | Morocco, Netherlands | Brazil, Côte d'Ivoire, Japan, Norway | Australia, Belgium, Congo DR, Ecuador, Egypt, England, Mexico, Senegal | Algeria, Argentina, Austria, Bosnia and Herzegovina, Cabo Verde, Colombia, Croatia, France, Germany, Ghana, Paraguay, Portugal, Spain, Sweden, Switzerland, USA |
| Colombia | Ghana | Algeria, Switzerland | Austria, Croatia, Portugal, Spain | Argentina, Bosnia and Herzegovina, Cabo Verde, France, Germany, Paraguay, Sweden, USA | Australia, Belgium, Brazil, Canada, Congo DR, Côte d'Ivoire, Ecuador, Egypt, England, Japan, Mexico, Morocco, Netherlands, Norway, Senegal, South Africa |
| Congo DR | England | Belgium, Senegal | Australia, Ecuador, Egypt, Mexico | Brazil, Canada, Côte d'Ivoire, Japan, Morocco, Netherlands, Norway, South Africa | Algeria, Argentina, Austria, Bosnia and Herzegovina, Cabo Verde, Colombia, Croatia, France, Germany, Ghana, Paraguay, Portugal, Spain, Sweden, Switzerland, USA |
| Côte d'Ivoire | Norway | Brazil, Japan | Canada, Morocco, Netherlands, South Africa | Australia, Belgium, Congo DR, Ecuador, Egypt, England, Mexico, Senegal | Algeria, Argentina, Austria, Bosnia and Herzegovina, Cabo Verde, Colombia, Croatia, France, Germany, Ghana, Paraguay, Portugal, Spain, Sweden, Switzerland, USA |
| Croatia | Portugal | Austria, Spain | Algeria, Colombia, Ghana, Switzerland | Argentina, Bosnia and Herzegovina, Cabo Verde, France, Germany, Paraguay, Sweden, USA | Australia, Belgium, Brazil, Canada, Congo DR, Côte d'Ivoire, Ecuador, Egypt, England, Japan, Mexico, Morocco, Netherlands, Norway, Senegal, South Africa |
| Ecuador | Mexico | Australia, Egypt | Belgium, Congo DR, England, Senegal | Brazil, Canada, Côte d'Ivoire, Japan, Morocco, Netherlands, Norway, South Africa | Algeria, Argentina, Austria, Bosnia and Herzegovina, Cabo Verde, Colombia, Croatia, France, Germany, Ghana, Paraguay, Portugal, Spain, Sweden, Switzerland, USA |
| Egypt | Australia | Ecuador, Mexico | Belgium, Congo DR, England, Senegal | Brazil, Canada, Côte d'Ivoire, Japan, Morocco, Netherlands, Norway, South Africa | Algeria, Argentina, Austria, Bosnia and Herzegovina, Cabo Verde, Colombia, Croatia, France, Germany, Ghana, Paraguay, Portugal, Spain, Sweden, Switzerland, USA |
| England | Congo DR | Belgium, Senegal | Australia, Ecuador, Egypt, Mexico | Brazil, Canada, Côte d'Ivoire, Japan, Morocco, Netherlands, Norway, South Africa | Algeria, Argentina, Austria, Bosnia and Herzegovina, Cabo Verde, Colombia, Croatia, France, Germany, Ghana, Paraguay, Portugal, Spain, Sweden, Switzerland, USA |
| France | Sweden | Argentina, Cabo Verde | Bosnia and Herzegovina, Germany, Paraguay, USA | Algeria, Austria, Colombia, Croatia, Ghana, Portugal, Spain, Switzerland | Australia, Belgium, Brazil, Canada, Congo DR, Côte d'Ivoire, Ecuador, Egypt, England, Japan, Mexico, Morocco, Netherlands, Norway, Senegal, South Africa |
| Germany | Paraguay | Bosnia and Herzegovina, USA | Argentina, Cabo Verde, France, Sweden | Algeria, Austria, Colombia, Croatia, Ghana, Portugal, Spain, Switzerland | Australia, Belgium, Brazil, Canada, Congo DR, Côte d'Ivoire, Ecuador, Egypt, England, Japan, Mexico, Morocco, Netherlands, Norway, Senegal, South Africa |
| Ghana | Colombia | Algeria, Switzerland | Austria, Croatia, Portugal, Spain | Argentina, Bosnia and Herzegovina, Cabo Verde, France, Germany, Paraguay, Sweden, USA | Australia, Belgium, Brazil, Canada, Congo DR, Côte d'Ivoire, Ecuador, Egypt, England, Japan, Mexico, Morocco, Netherlands, Norway, Senegal, South Africa |
| Japan | Brazil | Côte d'Ivoire, Norway | Canada, Morocco, Netherlands, South Africa | Australia, Belgium, Congo DR, Ecuador, Egypt, England, Mexico, Senegal | Algeria, Argentina, Austria, Bosnia and Herzegovina, Cabo Verde, Colombia, Croatia, France, Germany, Ghana, Paraguay, Portugal, Spain, Sweden, Switzerland, USA |
| Mexico | Ecuador | Australia, Egypt | Belgium, Congo DR, England, Senegal | Brazil, Canada, Côte d'Ivoire, Japan, Morocco, Netherlands, Norway, South Africa | Algeria, Argentina, Austria, Bosnia and Herzegovina, Cabo Verde, Colombia, Croatia, France, Germany, Ghana, Paraguay, Portugal, Spain, Sweden, Switzerland, USA |
| Morocco | Netherlands | Canada, South Africa | Brazil, Côte d'Ivoire, Japan, Norway | Australia, Belgium, Congo DR, Ecuador, Egypt, England, Mexico, Senegal | Algeria, Argentina, Austria, Bosnia and Herzegovina, Cabo Verde, Colombia, Croatia, France, Germany, Ghana, Paraguay, Portugal, Spain, Sweden, Switzerland, USA |
| Netherlands | Morocco | Canada, South Africa | Brazil, Côte d'Ivoire, Japan, Norway | Australia, Belgium, Congo DR, Ecuador, Egypt, England, Mexico, Senegal | Algeria, Argentina, Austria, Bosnia and Herzegovina, Cabo Verde, Colombia, Croatia, France, Germany, Ghana, Paraguay, Portugal, Spain, Sweden, Switzerland, USA |
| Norway | Côte d'Ivoire | Brazil, Japan | Canada, Morocco, Netherlands, South Africa | Australia, Belgium, Congo DR, Ecuador, Egypt, England, Mexico, Senegal | Algeria, Argentina, Austria, Bosnia and Herzegovina, Cabo Verde, Colombia, Croatia, France, Germany, Ghana, Paraguay, Portugal, Spain, Sweden, Switzerland, USA |
| Paraguay | Germany | Bosnia and Herzegovina, USA | Argentina, Cabo Verde, France, Sweden | Algeria, Austria, Colombia, Croatia, Ghana, Portugal, Spain, Switzerland | Australia, Belgium, Brazil, Canada, Congo DR, Côte d'Ivoire, Ecuador, Egypt, England, Japan, Mexico, Morocco, Netherlands, Norway, Senegal, South Africa |
| Portugal | Croatia | Austria, Spain | Algeria, Colombia, Ghana, Switzerland | Argentina, Bosnia and Herzegovina, Cabo Verde, France, Germany, Paraguay, Sweden, USA | Australia, Belgium, Brazil, Canada, Congo DR, Côte d'Ivoire, Ecuador, Egypt, England, Japan, Mexico, Morocco, Netherlands, Norway, Senegal, South Africa |
| Senegal | Belgium | Congo DR, England | Australia, Ecuador, Egypt, Mexico | Brazil, Canada, Côte d'Ivoire, Japan, Morocco, Netherlands, Norway, South Africa | Algeria, Argentina, Austria, Bosnia and Herzegovina, Cabo Verde, Colombia, Croatia, France, Germany, Ghana, Paraguay, Portugal, Spain, Sweden, Switzerland, USA |
| South Africa | Canada | Morocco, Netherlands | Brazil, Côte d'Ivoire, Japan, Norway | Australia, Belgium, Congo DR, Ecuador, Egypt, England, Mexico, Senegal | Algeria, Argentina, Austria, Bosnia and Herzegovina, Cabo Verde, Colombia, Croatia, France, Germany, Ghana, Paraguay, Portugal, Spain, Sweden, Switzerland, USA |
| Spain | Austria | Croatia, Portugal | Algeria, Colombia, Ghana, Switzerland | Argentina, Bosnia and Herzegovina, Cabo Verde, France, Germany, Paraguay, Sweden, USA | Australia, Belgium, Brazil, Canada, Congo DR, Côte d'Ivoire, Ecuador, Egypt, England, Japan, Mexico, Morocco, Netherlands, Norway, Senegal, South Africa |
| Sweden | France | Argentina, Cabo Verde | Bosnia and Herzegovina, Germany, Paraguay, USA | Algeria, Austria, Colombia, Croatia, Ghana, Portugal, Spain, Switzerland | Australia, Belgium, Brazil, Canada, Congo DR, Côte d'Ivoire, Ecuador, Egypt, England, Japan, Mexico, Morocco, Netherlands, Norway, Senegal, South Africa |
| Switzerland | Algeria | Colombia, Ghana | Austria, Croatia, Portugal, Spain | Argentina, Bosnia and Herzegovina, Cabo Verde, France, Germany, Paraguay, Sweden, USA | Australia, Belgium, Brazil, Canada, Congo DR, Côte d'Ivoire, Ecuador, Egypt, England, Japan, Mexico, Morocco, Netherlands, Norway, Senegal, South Africa |
| USA | Bosnia and Herzegovina | Germany, Paraguay | Argentina, Cabo Verde, France, Sweden | Algeria, Austria, Colombia, Croatia, Ghana, Portugal, Spain, Switzerland | Australia, Belgium, Brazil, Canada, Congo DR, Côte d'Ivoire, Ecuador, Egypt, England, Japan, Mexico, Morocco, Netherlands, Norway, Senegal, South Africa |

## Sanity Section

| Team | Possible R16 | Possible QF | Bracket half |
| --- | --- | --- | --- |
| France | Argentina, Cabo Verde | Bosnia and Herzegovina, Germany, Paraguay, USA | winner_m102 |
| Argentina | France, Sweden | Bosnia and Herzegovina, Germany, Paraguay, USA | winner_m102 |
| Germany | Bosnia and Herzegovina, USA | Argentina, Cabo Verde, France, Sweden | winner_m102 |
| Spain | Croatia, Portugal | Algeria, Colombia, Ghana, Switzerland | winner_m102 |
| Portugal | Austria, Spain | Algeria, Colombia, Ghana, Switzerland | winner_m102 |
| England | Belgium, Senegal | Australia, Ecuador, Egypt, Mexico | winner_m101 |
| Colombia | Algeria, Switzerland | Austria, Croatia, Portugal, Spain | winner_m102 |

## Checks

| Check | Status | Detail |
| --- | --- | --- |
| known_r32_fixture_count | pass | 16 |
| official_r32_nodes_available | pass | 16 |
| no_duplicate_r32_fixtures | pass |  |
| no_team_in_two_r32_fixtures | pass |  |
| all_dependencies_resolve | pass |  |
| single_winner_final_match | pass | 104 |
| opposite_halves_do_not_meet_before_final | pass |  |
| final_opponents_are_opposite_half_only | pass |  |
| france_argentina_r16_matches_source_truth | pass | {"france_possible_r16_opponents":["Argentina","Cabo Verde"],"argentina_possible_r16_opponents":["France","Sweden"]} |
| bracket_pool_tree_matches_official_slots | pass |  |
| bracket_pool_strategies_use_valid_path_propagation | pass |  |

## Failures

- None
