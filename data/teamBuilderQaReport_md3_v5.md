# Team Builder Optimizer MD3 v5 QA

Generated: 2026-06-27T16:48:30.639Z

Final status: **PASS**

## Strategy Comparison

| Strategy | Starter MD3 pts | Squad MD3 pts | Budget used | Budget left | Captain | Risky count | Top-star overlap |
|---|---:|---:|---:|---:|---|---:|---:|
| Balanced Squad | 83.3 | 109.9 | 100.0 | 0.0 | Lionel Messi | 0 | 11 |
| Diversified Squad | 82.5 | 107.5 | 99.8 | 0.2 | Lionel Messi | 0 | 10 |
| Concentrated Upside | 83.3 | 109.9 | 100.0 | 0.0 | Lionel Messi | 0 | 11 |
| Stars and Scrubs | 83.3 | 109.9 | 100.0 | 0.0 | Lionel Messi | 0 | 11 |
| Value Squad | 77.0 | 103.2 | 99.9 | 0.1 | Lionel Messi | 0 | 8 |

Greedy baseline starter MD3 points: **83.9**.
Balanced gap vs greedy baseline: **-0.6**.

## Balanced Squad

Captain: **Lionel Messi**. Vice-captain: **Sadio Mané**.

| Role | Pos | Player | Country | Price | MD3 pts | Start | Minutes | Role tier | Opponent |
|---|---|---|---|---:|---:|---:|---:|---|---|
| starter | GK | Yahia Fofana | Côte d'Ivoire | 4.2 | 7.0 | 98.0% | 90.7 | locked_starter | Curaçao |
| starter | FWD | Lionel Messi | Argentina | 10.0 | 9.1 | 86.5% | 67.4 | likely_starter | Jordan |
| starter | FWD | Kylian Mbappé | France | 10.5 | 8.3 | 89.2% | 67.8 | likely_starter | Norway |
| starter | FWD | Ayase Ueda | Japan | 7.0 | 7.3 | 88.2% | 69.0 | locked_starter | Sweden |
| starter | DEF | Achraf Hakimi | Morocco | 6.0 | 7.1 | 86.0% | 75.6 | locked_starter | Haiti |
| starter | DEF | Denzel Dumfries | Netherlands | 5.7 | 6.7 | 86.9% | 75.7 | locked_starter | Tunisia |
| starter | DEF | Josip Stanisic | Croatia | 4.3 | 6.2 | 89.1% | 74.1 | locked_starter | Ghana |
| starter | DEF | Wilfried Singo | Côte d'Ivoire | 4.4 | 6.8 | 59.7% | 55.6 | possible_starter | Curaçao |
| starter | MID | Michael Olise | France | 9.5 | 8.6 | 89.2% | 71.6 | locked_starter | Norway |
| starter | MID | Ousmane Dembélé | France | 10.0 | 8.2 | 75.2% | 64.5 | likely_starter | Norway |
| starter | MID | Sadio Mané | Senegal | 7.6 | 8.0 | 97.4% | 80.8 | locked_starter | Iraq |
| bench | GK | Dominik Livakovic | Croatia | 4.5 | 5.7 | 92.0% | 83.8 | locked_starter | Ghana |
| bench | DEF | Guéla Doué | Côte d'Ivoire | 3.9 | 6.2 | 83.2% | 72.2 | likely_starter | Curaçao |
| bench | MID | Ismael Saibari | Morocco | 6.8 | 8.1 | 75.7% | 64.5 | likely_starter | Haiti |
| bench | MID | Charles De Ketelaere | Belgium | 5.6 | 6.5 | 91.2% | 74.4 | locked_starter | New Zealand |

## Omitted Stars

| Player | Country | Pos | Price | MD3 pts | Captain score | Reason |
|---|---|---|---:|---:|---:|---|
| Harry Kane | England | FWD | 10.5 | 7.7 | 22.3 | position quota, budget |
| Nicolas Jackson | Senegal | FWD | 6.7 | 7.0 | 22.6 | position quota, budget, role/minutes risk |
| Jude Bellingham | England | MID | 8.3 | 7.4 | 20.8 | position quota, budget |
| Kevin De Bruyne | Belgium | MID | 7.5 | 7.1 | 20.7 | position quota, budget |
| Enzo Fernández | Argentina | MID | 7.5 | 7.0 | 20.4 | position quota, budget |
| Jamal Musiala | Germany | MID | 8.0 | 7.6 | 18.7 | position quota, budget |
| Vinícius José Paixão de Oliveira Júnior | Brazil | MID | 10.0 | 7.5 | 18.6 | position quota, budget |
| Lamine Yamal Nasraoui Ebana | Spain | MID | 10.0 | 7.4 | 18.6 | position quota, budget, role/minutes risk |
| Yan Diomande | Côte d'Ivoire | FWD | 5.9 | 6.0 | 20.2 | position quota, country limit, budget |
| Petar Musa | Croatia | FWD | 5.1 | 6.4 | 18.9 | position quota, budget |

## Checks

| Check | Status | Detail |
|---|---|---|
| active-official-universe | pass | {"source":"FANTASY_POOL_OFFICIAL_DATA_STATUS.official_position_records","activePlayerRows":1225} |
| all-strategies-legal | pass | {"statuses":[{"strategy":"Balanced Squad","status":"pass","legal":{"squadSize":true,"starterSize":true,"budget":true,"positions":true,"formation":true,"countryLimit":true,"selectable":true,"activeOfficialIds":true,"projectionRows":true,"roleRows":true}},{"strategy":"Diversified Squad","status":"pass","legal":{"squadSize":true,"starterSize":true,"budget":true,"positions":true,"formation":true,"countryLimit":true,"selectable":true,"activeOfficialIds":true,"projectionRows":true,"roleRows":true}},{"strategy":"Concentrated Upside","status":"pass","legal":{"squadSize":true,"starterSize":true,"budget":true,"positions":true,"formation":true,"countryLimit":true,"selectable":true,"activeOfficialIds":true,"projectionRows":true,"roleRows":true}},{"strategy":"Stars and Scrubs","status":"pass","legal":{"squadSize":true,"starterSize":true,"budget":true,"positions":true,"formation":true,"countryLimit":true,"selectable":true,"activeOfficialIds":true,"projectionRows":true,"roleRows":true}},{"strategy":"Value Squad","status":"pass","legal":{"squadSize":true,"starterSize":true,"budget":true,"positions":true,"formation":true,"countryLimit":true,"selectable":true,"activeOfficialIds":true,"projectionRows":true,"roleRows":true}}]} |
| balanced-projection-gap | pass | {"balancedStarterProjected":83.34,"greedyBaselineStarterProjected":83.898,"gap":-0.558} |
| balanced-captain-quality | pass | {"captain":{"id":"38","name":"Lionel Messi","country":"Argentina","position":"FWD","price":10,"projectedPoints":9.074,"riskAdjustedPoints":8.542,"captainScore":25.465,"startProbability":0.865,"expectedMinutes":67.4,"roleTier":"likely_starter","roleConfidence":"medium","opponent":"Jordan"}} |
| balanced-start-security | pass | {"startAveragePercent":85.9,"riskyCount":0} |
| balanced-not-cheap-value-dominated | pass | {"cheapLowProjectionStarterCount":0,"budgetUsed":100} |
| elite-player-access | pass | {"topStarOverlap":11,"omittedStars":[{"id":"468","name":"Harry Kane","country":"England","position":"FWD","price":10.5,"projectedPoints":7.736,"captainScore":22.318,"reason":"position quota, budget"},{"id":"1041","name":"Nicolas Jackson","country":"Senegal","position":"FWD","price":6.7,"projectedPoints":7.019,"captainScore":22.634,"reason":"position quota, budget, role/minutes risk"},{"id":"491","name":"Jude Bellingham","country":"England","position":"MID","price":8.3,"projectedPoints":7.374,"captainScore":20.751,"reason":"position quota, budget"},{"id":"138","name":"Kevin De Bruyne","country":"Belgium","position":"MID","price":7.5,"projectedPoints":7.089,"captainScore":20.722,"reason":"position quota, budget"},{"id":"57","name":"Enzo Fernández","country":"Argentina","position":"MID","price":7.5,"projectedPoints":7.049,"captainScore":20.372,"reason":"position quota, budget"}]} |
