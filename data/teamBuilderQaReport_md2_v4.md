# Team Builder Optimizer MD2 v4 QA

Generated: 2026-06-22T14:17:25.010Z

Final status: **PASS**

## Strategy Comparison

| Strategy | Starter MD2 pts | Squad MD2 pts | Budget used | Budget left | Captain | Risky count | Top-star overlap |
|---|---:|---:|---:|---:|---|---:|---:|
| Balanced Squad | 83.1 | 109.0 | 99.6 | 0.4 | Michael Olise | 0 | 8 |
| Diversified Squad | 83.1 | 108.5 | 99.8 | 0.2 | Michael Olise | 0 | 8 |
| Concentrated Upside | 83.1 | 109.1 | 100.0 | 0.0 | Michael Olise | 0 | 8 |
| Stars and Scrubs | 83.1 | 108.5 | 99.8 | 0.2 | Michael Olise | 0 | 8 |
| Value Squad | 81.6 | 106.2 | 98.4 | 1.6 | Michael Olise | 0 | 7 |

Greedy baseline starter MD2 points: **83.4**.
Balanced gap vs greedy baseline: **-0.3**.

## Balanced Squad

Captain: **Michael Olise**. Vice-captain: **Lionel Messi**.

| Role | Pos | Player | Country | Price | MD2 pts | Start | Minutes | Role tier | Opponent |
|---|---|---|---|---:|---:|---:|---:|---|---|
| starter | GK | Emiliano Martínez | Argentina | 5.0 | 5.2 | 93.5% | 85.5 | locked_starter | Austria |
| starter | FWD | Lionel Messi | Argentina | 10.0 | 9.4 | 93.5% | 74.4 | locked_starter | Austria |
| starter | FWD | Kylian Mbappé | France | 10.5 | 8.6 | 93.5% | 73.2 | locked_starter | Iraq |
| starter | FWD | Petar Musa | Croatia | 5.1 | 8.0 | 79.0% | 68.4 | likely_starter | Panama |
| starter | DEF | Nuno Alexandre Tavares Mendes | Portugal | 5.8 | 6.7 | 89.5% | 79.1 | locked_starter | Uzbekistan |
| starter | DEF | Ritsu Doan | Japan | 5.1 | 6.6 | 89.5% | 81.1 | locked_starter | Tunisia |
| starter | DEF | Hiroki Ito | Japan | 3.9 | 6.1 | 89.5% | 79.1 | locked_starter | Tunisia |
| starter | DEF | Nico O'Reilly | England | 4.7 | 5.7 | 89.5% | 78.5 | locked_starter | Ghana |
| starter | MID | Michael Olise | France | 9.5 | 9.1 | 93.5% | 76.4 | locked_starter | Iraq |
| starter | MID | Ousmane Dembélé | France | 10.0 | 8.9 | 79.0% | 68.4 | likely_starter | Iraq |
| starter | MID | Luis Díaz | Colombia | 8.1 | 8.8 | 93.5% | 77.4 | locked_starter | Congo DR |
| bench | GK | Camilo Vargas | Colombia | 4.3 | 4.8 | 89.5% | 85.5 | locked_starter | Congo DR |
| bench | DEF | Daniel Muñoz | Colombia | 4.6 | 5.5 | 93.5% | 81.2 | locked_starter | Congo DR |
| bench | MID | Jamal Musiala | Germany | 8.0 | 8.6 | 79.0% | 68.4 | likely_starter | Côte d'Ivoire |
| bench | MID | Daizen Maeda | Japan | 5.0 | 6.9 | 79.0% | 68.4 | likely_starter | Tunisia |

## Omitted Stars

| Player | Country | Pos | Price | MD2 pts | Captain score | Reason |
|---|---|---|---:|---:|---:|---|
| Harry Kane | England | FWD | 10.5 | 8.6 | 25.8 | position quota, budget |
| Désiré Doué | France | MID | 7.5 | 8.0 | 24.7 | position quota, country limit, budget |
| Bradley Barcola | France | MID | 8.0 | 7.8 | 23.6 | position quota, country limit, budget |
| Enzo Fernández | Argentina | MID | 7.5 | 7.8 | 23.5 | position quota, budget |
| Vinícius José Paixão de Oliveira Júnior | Brazil | MID | 10.0 | 7.8 | 22.7 | position quota, budget |
| Raphael Dias Belloli | Brazil | MID | 8.2 | 7.7 | 22.6 | position quota, budget |
| Erling Haaland | Norway | FWD | 10.5 | 7.7 | 22.5 | position quota, budget |
| Jude Bellingham | England | MID | 8.3 | 7.5 | 22.9 | position quota, budget |
| Bruno Miguel Borges Fernandes | Portugal | MID | 8.5 | 7.7 | 22.3 | position quota, budget |
| Lamine Yamal Nasraoui Ebana | Spain | MID | 10.0 | 7.5 | 20.9 | position quota, budget |

## Checks

| Check | Status | Detail |
|---|---|---|
| active-official-universe | pass | {"source":"FANTASY_POOL_OFFICIAL_DATA_STATUS.official_position_records","activePlayerRows":1227} |
| all-strategies-legal | pass | {"statuses":[{"strategy":"Balanced Squad","status":"pass","legal":{"squadSize":true,"starterSize":true,"budget":true,"positions":true,"formation":true,"countryLimit":true,"selectable":true,"activeOfficialIds":true,"projectionRows":true,"roleRows":true}},{"strategy":"Diversified Squad","status":"pass","legal":{"squadSize":true,"starterSize":true,"budget":true,"positions":true,"formation":true,"countryLimit":true,"selectable":true,"activeOfficialIds":true,"projectionRows":true,"roleRows":true}},{"strategy":"Concentrated Upside","status":"pass","legal":{"squadSize":true,"starterSize":true,"budget":true,"positions":true,"formation":true,"countryLimit":true,"selectable":true,"activeOfficialIds":true,"projectionRows":true,"roleRows":true}},{"strategy":"Stars and Scrubs","status":"pass","legal":{"squadSize":true,"starterSize":true,"budget":true,"positions":true,"formation":true,"countryLimit":true,"selectable":true,"activeOfficialIds":true,"projectionRows":true,"roleRows":true}},{"strategy":"Value Squad","status":"pass","legal":{"squadSize":true,"starterSize":true,"budget":true,"positions":true,"formation":true,"countryLimit":true,"selectable":true,"activeOfficialIds":true,"projectionRows":true,"roleRows":true}}]} |
| balanced-projection-gap | pass | {"balancedStarterProjected":83.134,"greedyBaselineStarterProjected":83.385,"gap":-0.251} |
| balanced-captain-quality | pass | {"captain":{"id":"517","name":"Michael Olise","country":"France","position":"MID","price":9.5,"projectedPoints":9.146,"riskAdjustedPoints":8.745,"captainScore":28.027,"startProbability":0.935,"expectedMinutes":76.4,"roleTier":"locked_starter","roleConfidence":"medium","opponent":"Iraq"}} |
| balanced-start-security | pass | {"startAveragePercent":89.4,"riskyCount":0} |
| balanced-not-cheap-value-dominated | pass | {"cheapLowProjectionStarterCount":0,"budgetUsed":99.6} |
| elite-player-access | pass | {"topStarOverlap":8,"omittedStars":[{"id":"468","name":"Harry Kane","country":"England","position":"FWD","price":10.5,"projectedPoints":8.613,"captainScore":25.769,"reason":"position quota, budget"},{"id":"505","name":"Désiré Doué","country":"France","position":"MID","price":7.5,"projectedPoints":7.977,"captainScore":24.708,"reason":"position quota, country limit, budget"},{"id":"1431","name":"Bradley Barcola","country":"France","position":"MID","price":8,"projectedPoints":7.799,"captainScore":23.634,"reason":"position quota, country limit, budget"},{"id":"57","name":"Enzo Fernández","country":"Argentina","position":"MID","price":7.5,"projectedPoints":7.781,"captainScore":23.47,"reason":"position quota, budget"},{"id":"173","name":"Vinícius José Paixão de Oliveira Júnior","country":"Brazil","position":"MID","price":10,"projectedPoints":7.788,"captainScore":22.674,"reason":"position quota, budget"}]} |
