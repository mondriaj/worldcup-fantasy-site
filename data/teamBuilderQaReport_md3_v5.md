# Team Builder Optimizer MD3 v5 QA

Generated: 2026-06-25T17:54:14.335Z

Final status: **PASS**

## Strategy Comparison

| Strategy | Starter MD3 pts | Squad MD3 pts | Budget used | Budget left | Captain | Risky count | Top-star overlap |
|---|---:|---:|---:|---:|---|---:|---:|
| Balanced Squad | 84.3 | 110.7 | 99.7 | 0.3 | Lionel Messi | 0 | 12 |
| Diversified Squad | 84.3 | 110.6 | 99.9 | 0.1 | Lionel Messi | 0 | 12 |
| Concentrated Upside | 84.3 | 110.4 | 99.9 | 0.1 | Lionel Messi | 0 | 11 |
| Stars and Scrubs | 84.3 | 110.7 | 99.7 | 0.3 | Lionel Messi | 0 | 12 |
| Value Squad | 76.6 | 102.7 | 99.9 | 0.1 | Lionel Messi | 0 | 8 |

Greedy baseline starter MD3 points: **84.5**.
Balanced gap vs greedy baseline: **-0.2**.

## Balanced Squad

Captain: **Lionel Messi**. Vice-captain: **Sadio Mané**.

| Role | Pos | Player | Country | Price | MD3 pts | Start | Minutes | Role tier | Opponent |
|---|---|---|---|---:|---:|---:|---:|---|---|
| starter | GK | Yahia Fofana | Côte d'Ivoire | 4.2 | 6.9 | 96.8% | 88.7 | locked_starter | Curaçao |
| starter | FWD | Lionel Messi | Argentina | 10.0 | 9.1 | 86.5% | 67.4 | likely_starter | Jordan |
| starter | FWD | Kylian Mbappé | France | 10.5 | 8.2 | 86.5% | 66.0 | likely_starter | Norway |
| starter | FWD | Nicolas Jackson | Senegal | 6.7 | 7.5 | 82.7% | 70.2 | likely_starter | Iraq |
| starter | DEF | Achraf Hakimi | Morocco | 6.0 | 7.1 | 86.0% | 75.6 | locked_starter | Haiti |
| starter | DEF | Emmanuel Agbadou | Côte d'Ivoire | 3.9 | 6.9 | 95.8% | 81.3 | locked_starter | Curaçao |
| starter | DEF | Wilfried Singo | Côte d'Ivoire | 4.4 | 7.3 | 81.1% | 70.1 | likely_starter | Curaçao |
| starter | DEF | Denzel Dumfries | Netherlands | 5.7 | 6.7 | 85.1% | 73.8 | likely_starter | Tunisia |
| starter | MID | Michael Olise | France | 9.5 | 8.5 | 86.5% | 69.7 | locked_starter | Norway |
| starter | MID | Ousmane Dembélé | France | 10.0 | 8.2 | 73.4% | 62.7 | likely_starter | Norway |
| starter | MID | Sadio Mané | Senegal | 7.6 | 7.9 | 95.3% | 78.7 | locked_starter | Iraq |
| bench | GK | Dominik Livakovic | Croatia | 4.5 | 5.7 | 92.0% | 83.8 | locked_starter | Ghana |
| bench | DEF | Josip Stanisic | Croatia | 4.3 | 6.2 | 89.1% | 74.1 | locked_starter | Ghana |
| bench | MID | Ismael Saibari | Morocco | 6.8 | 8.1 | 75.7% | 64.5 | likely_starter | Haiti |
| bench | MID | Charles De Ketelaere | Belgium | 5.6 | 6.3 | 84.3% | 68.4 | likely_starter | New Zealand |

## Omitted Stars

| Player | Country | Pos | Price | MD3 pts | Captain score | Reason |
|---|---|---|---:|---:|---:|---|
| Harry Kane | England | FWD | 10.5 | 7.7 | 22.3 | position quota, budget |
| Jude Bellingham | England | MID | 8.3 | 7.4 | 20.8 | position quota, budget |
| Ayase Ueda | Japan | FWD | 7.0 | 7.3 | 20.4 | position quota, budget |
| Kevin De Bruyne | Belgium | MID | 7.5 | 7.0 | 20.7 | position quota, budget |
| Enzo Fernández | Argentina | MID | 7.5 | 7.0 | 20.4 | position quota, budget |
| Jamal Musiala | Germany | MID | 8.0 | 7.6 | 18.7 | position quota, budget |
| Vinícius José Paixão de Oliveira Júnior | Brazil | MID | 10.0 | 7.5 | 18.6 | position quota, budget |
| Lamine Yamal Nasraoui Ebana | Spain | MID | 10.0 | 7.4 | 18.6 | position quota, budget, role/minutes risk |
| Petar Musa | Croatia | FWD | 5.1 | 6.4 | 18.9 | position quota, budget |
| Yan Diomande | Côte d'Ivoire | FWD | 5.9 | 5.9 | 20.2 | position quota, country limit, budget |

## Checks

| Check | Status | Detail |
|---|---|---|
| active-official-universe | pass | {"source":"FANTASY_POOL_OFFICIAL_DATA_STATUS.official_position_records","activePlayerRows":1225} |
| all-strategies-legal | pass | {"statuses":[{"strategy":"Balanced Squad","status":"pass","legal":{"squadSize":true,"starterSize":true,"budget":true,"positions":true,"formation":true,"countryLimit":true,"selectable":true,"activeOfficialIds":true,"projectionRows":true,"roleRows":true}},{"strategy":"Diversified Squad","status":"pass","legal":{"squadSize":true,"starterSize":true,"budget":true,"positions":true,"formation":true,"countryLimit":true,"selectable":true,"activeOfficialIds":true,"projectionRows":true,"roleRows":true}},{"strategy":"Concentrated Upside","status":"pass","legal":{"squadSize":true,"starterSize":true,"budget":true,"positions":true,"formation":true,"countryLimit":true,"selectable":true,"activeOfficialIds":true,"projectionRows":true,"roleRows":true}},{"strategy":"Stars and Scrubs","status":"pass","legal":{"squadSize":true,"starterSize":true,"budget":true,"positions":true,"formation":true,"countryLimit":true,"selectable":true,"activeOfficialIds":true,"projectionRows":true,"roleRows":true}},{"strategy":"Value Squad","status":"pass","legal":{"squadSize":true,"starterSize":true,"budget":true,"positions":true,"formation":true,"countryLimit":true,"selectable":true,"activeOfficialIds":true,"projectionRows":true,"roleRows":true}}]} |
| balanced-projection-gap | pass | {"balancedStarterProjected":84.336,"greedyBaselineStarterProjected":84.545,"gap":-0.209} |
| balanced-captain-quality | pass | {"captain":{"id":"38","name":"Lionel Messi","country":"Argentina","position":"FWD","price":10,"projectedPoints":9.074,"riskAdjustedPoints":8.542,"captainScore":25.465,"startProbability":0.865,"expectedMinutes":67.4,"roleTier":"likely_starter","roleConfidence":"medium","opponent":"Jordan"}} |
| balanced-start-security | pass | {"startAveragePercent":86.9,"riskyCount":0} |
| balanced-not-cheap-value-dominated | pass | {"cheapLowProjectionStarterCount":0,"budgetUsed":99.7} |
| elite-player-access | pass | {"topStarOverlap":12,"omittedStars":[{"id":"468","name":"Harry Kane","country":"England","position":"FWD","price":10.5,"projectedPoints":7.736,"captainScore":22.318,"reason":"position quota, budget"},{"id":"491","name":"Jude Bellingham","country":"England","position":"MID","price":8.3,"projectedPoints":7.374,"captainScore":20.751,"reason":"position quota, budget"},{"id":"672","name":"Ayase Ueda","country":"Japan","position":"FWD","price":7,"projectedPoints":7.277,"captainScore":20.382,"reason":"position quota, budget"},{"id":"138","name":"Kevin De Bruyne","country":"Belgium","position":"MID","price":7.5,"projectedPoints":7.031,"captainScore":20.722,"reason":"position quota, budget"},{"id":"57","name":"Enzo Fernández","country":"Argentina","position":"MID","price":7.5,"projectedPoints":7.049,"captainScore":20.372,"reason":"position quota, budget"}]} |
