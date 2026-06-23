# Team Builder Optimizer MD3 v5 QA

Generated: 2026-06-23T14:23:23.313Z

Final status: **PASS**

## Strategy Comparison

| Strategy | Starter MD3 pts | Squad MD3 pts | Budget used | Budget left | Captain | Risky count | Top-star overlap |
|---|---:|---:|---:|---:|---|---:|---:|
| Balanced Squad | 85.4 | 111.4 | 99.4 | 0.6 | Lionel Messi | 0 | 10 |
| Diversified Squad | 85.4 | 110.6 | 99.3 | 0.7 | Lionel Messi | 0 | 10 |
| Concentrated Upside | 85.9 | 111.1 | 99.9 | 0.1 | Lionel Messi | 0 | 10 |
| Stars and Scrubs | 86.1 | 111.7 | 99.9 | 0.1 | Lionel Messi | 0 | 10 |
| Value Squad | 82.2 | 105.6 | 99.5 | 0.5 | Lionel Messi | 0 | 9 |

Greedy baseline starter MD3 points: **86.4**.
Balanced gap vs greedy baseline: **-1.0**.

## Balanced Squad

Captain: **Lionel Messi**. Vice-captain: **Harry Kane**.

| Role | Pos | Player | Country | Price | MD3 pts | Start | Minutes | Role tier | Opponent |
|---|---|---|---|---:|---:|---:|---:|---|---|
| starter | GK | Yahia Fofana | Côte d'Ivoire | 4.2 | 6.4 | 96.9% | 88.1 | locked_starter | Curaçao |
| starter | FWD | Lionel Messi | Argentina | 10.0 | 9.2 | 97.0% | 75.2 | locked_starter | Jordan |
| starter | FWD | Harry Kane | England | 10.5 | 8.5 | 93.8% | 71.0 | locked_starter | Panama |
| starter | FWD | Ayase Ueda | Japan | 7.0 | 7.7 | 95.8% | 74.9 | locked_starter | Sweden |
| starter | DEF | Nico O'Reilly | England | 4.7 | 7.1 | 88.8% | 76.6 | locked_starter | Panama |
| starter | DEF | Achraf Hakimi | Morocco | 6.0 | 7.4 | 93.5% | 82.2 | locked_starter | Haiti |
| starter | DEF | Denzel Dumfries | Netherlands | 5.7 | 7.2 | 94.5% | 82.3 | locked_starter | Tunisia |
| starter | DEF | Emmanuel Agbadou | Côte d'Ivoire | 3.9 | 6.3 | 95.0% | 80.9 | locked_starter | Curaçao |
| starter | MID | Michael Olise | France | 9.5 | 9.1 | 97.0% | 77.8 | locked_starter | Norway |
| starter | MID | Ousmane Dembélé | France | 10.0 | 8.8 | 81.8% | 70.2 | likely_starter | Norway |
| starter | MID | Enzo Fernández | Argentina | 7.5 | 7.7 | 95.9% | 79.0 | locked_starter | Jordan |
| bench | GK | Emiliano Martínez | Argentina | 5.0 | 6.1 | 97.0% | 88.5 | locked_starter | Jordan |
| bench | DEF | Wilfried Singo | Côte d'Ivoire | 4.4 | 6.6 | 80.8% | 70.1 | likely_starter | Curaçao |
| bench | MID | Ismael Saibari | Morocco | 6.8 | 8.1 | 82.3% | 70.2 | likely_starter | Haiti |
| bench | MID | Petar Sucic | Croatia | 4.2 | 5.2 | 92.2% | 72.8 | locked_starter | Ghana |

## Omitted Stars

| Player | Country | Pos | Price | MD3 pts | Captain score | Reason |
|---|---|---|---:|---:|---:|---|
| Kylian Mbappé | France | FWD | 10.5 | 8.4 | 24.2 | position quota, budget |
| Jude Bellingham | England | MID | 8.3 | 8.0 | 24.1 | position quota, budget |
| Lamine Yamal Nasraoui Ebana | Spain | MID | 10.0 | 8.1 | 21.8 | position quota, budget |
| Sadio Mané | Senegal | MID | 7.6 | 7.8 | 22.5 | position quota, budget |
| Jamal Musiala | Germany | MID | 8.0 | 8.0 | 21.3 | position quota, budget |
| Vinícius José Paixão de Oliveira Júnior | Brazil | MID | 10.0 | 7.9 | 21.0 | position quota, budget |
| Anthony Gordon | England | MID | 7.0 | 7.3 | 22.2 | position quota, budget |
| Nicolas Jackson | Senegal | FWD | 6.7 | 7.4 | 21.7 | position quota, budget |
| Raphael Dias Belloli | Brazil | MID | 8.2 | 7.7 | 20.7 | position quota, budget |
| Petar Musa | Croatia | FWD | 5.1 | 7.3 | 21.3 | position quota, budget |

## Checks

| Check | Status | Detail |
|---|---|---|
| active-official-universe | pass | {"source":"FANTASY_POOL_OFFICIAL_DATA_STATUS.official_position_records","activePlayerRows":1225} |
| all-strategies-legal | pass | {"statuses":[{"strategy":"Balanced Squad","status":"pass","legal":{"squadSize":true,"starterSize":true,"budget":true,"positions":true,"formation":true,"countryLimit":true,"selectable":true,"activeOfficialIds":true,"projectionRows":true,"roleRows":true}},{"strategy":"Diversified Squad","status":"pass","legal":{"squadSize":true,"starterSize":true,"budget":true,"positions":true,"formation":true,"countryLimit":true,"selectable":true,"activeOfficialIds":true,"projectionRows":true,"roleRows":true}},{"strategy":"Concentrated Upside","status":"pass","legal":{"squadSize":true,"starterSize":true,"budget":true,"positions":true,"formation":true,"countryLimit":true,"selectable":true,"activeOfficialIds":true,"projectionRows":true,"roleRows":true}},{"strategy":"Stars and Scrubs","status":"pass","legal":{"squadSize":true,"starterSize":true,"budget":true,"positions":true,"formation":true,"countryLimit":true,"selectable":true,"activeOfficialIds":true,"projectionRows":true,"roleRows":true}},{"strategy":"Value Squad","status":"pass","legal":{"squadSize":true,"starterSize":true,"budget":true,"positions":true,"formation":true,"countryLimit":true,"selectable":true,"activeOfficialIds":true,"projectionRows":true,"roleRows":true}}]} |
| balanced-projection-gap | pass | {"balancedStarterProjected":85.371,"greedyBaselineStarterProjected":86.395,"gap":-1.024} |
| balanced-captain-quality | pass | {"captain":{"id":"38","name":"Lionel Messi","country":"Argentina","position":"FWD","price":10,"projectedPoints":9.183,"riskAdjustedPoints":8.686,"captainScore":27.33,"startProbability":0.97,"expectedMinutes":75.2,"roleTier":"locked_starter","roleConfidence":"medium","opponent":"Jordan"}} |
| balanced-start-security | pass | {"startAveragePercent":93.6,"riskyCount":0} |
| balanced-not-cheap-value-dominated | pass | {"cheapLowProjectionStarterCount":0,"budgetUsed":99.4} |
| elite-player-access | pass | {"topStarOverlap":10,"omittedStars":[{"id":"500","name":"Kylian Mbappé","country":"France","position":"FWD","price":10.5,"projectedPoints":8.364,"captainScore":24.183,"reason":"position quota, budget"},{"id":"491","name":"Jude Bellingham","country":"England","position":"MID","price":8.3,"projectedPoints":7.971,"captainScore":24.116,"reason":"position quota, budget"},{"id":"1092","name":"Lamine Yamal Nasraoui Ebana","country":"Spain","position":"MID","price":10,"projectedPoints":8.086,"captainScore":21.766,"reason":"position quota, budget"},{"id":"1696","name":"Sadio Mané","country":"Senegal","position":"MID","price":7.6,"projectedPoints":7.753,"captainScore":22.465,"reason":"position quota, budget"},{"id":"1600","name":"Jamal Musiala","country":"Germany","position":"MID","price":8,"projectedPoints":8.015,"captainScore":21.345,"reason":"position quota, budget"}]} |
