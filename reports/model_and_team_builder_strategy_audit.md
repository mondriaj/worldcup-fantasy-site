# Model And Team Builder Strategy Audit

Date: 2026-06-05

Scope: audit and proposal only. This report does not change public website behavior, browser data, player scoring logic, score prediction logic, or Team Builder optimization code.

## Executive Summary

The current site has two different strategy systems that look similar to users but work differently under the hood:

- Player pick models are mostly generated ranking modes plus a few browser-side re-sorts.
- Team Builder uses those same labels, but it is mainly an individual-player ranking search with budget, position, country, lock, remove, and risk controls. It only applies a small portfolio-style adjustment after candidate squads are already formed.

That means Team Builder is not currently a true portfolio optimizer. It can create useful squads, but labels such as Balanced, Safe, Upside, Differential, Value, Value Quant, Captain, and Risk-Control are too player-centric for a squad-building workflow. They also make some modes sound more distinct than they really are.

Recommended direction:

- Simplify player selection labels around user-understandable goals: Projected Points, Steady Picks, High-Floor Picks, Upside Picks, Value Picks, Captain Picks, and Differential Picks.
- Hide or demote Value Quant and Risk-Control Pick from the main public model dropdown unless they are renamed and explained as advanced filters.
- Redesign Team Builder strategy labels around squad construction, not individual player ranking: Balanced Squad, Diversified Squad, Concentrated Upside, Stars and Scrubs, Value Squad, Captain-First, and optionally No-Stars Balanced.
- Add explicit squad-level objectives for concentration, diversification, bench strength, captain coverage, price concentration, and downside protection.
- Keep Score Predictor as a static precomputed model, but improve calibration, fixture context, scoreline distribution, uncertainty bands, and the way score environments feed player and squad risk.

## Evidence Reviewed

Primary files inspected:

- `AGENTS.md`
- `README.md`
- `SITE_FEATURES.md`
- `index.html`
- `script.js`
- `financePlayersData.js`
- `fantasyPoolRecommendationsData.js`
- `scorePredictionsData.js`
- `fantasyPoolScorePredictionsData.js`
- `scripts/buildFantasyPoolPreviewBrowserData.mjs`
- `scripts/buildFantasyPoolRecommendationsV3.mjs`
- `scripts/step66PeleForwardRecalibration.mjs`
- `data/README.md`
- `data/scorePredictions_v2.json`
- `data/scorePredictionModelRoadmap.md`
- `data/dataSources.md`
- `data/recommendationModeSeparationAudit_fantasyPool_v3.md`
- `data/recommendationFinanceValueAudit_fantasyPool_v3.md`
- `data/portfolioOptimizerModel_v0.md`
- `data/captainChangeAdvisorModel_v0.md`
- `data/substitutionAdvisorModel_v0.md`

The report intentionally stays at the proposal layer. No data files, browser bundles, scoring scripts, or website pages were edited.

## Current Public Data Flow

The website loads data through static browser files in `index.html`, then `script.js` reads the values from `window.*`.

Important current paths:

- `financePlayersData.js` is preferred over `playersData.js` for the main `players` array because `script.js` reads `window.FINANCE_PLAYERS_DATA || window.PLAYERS_DATA || []`.
- `fantasyPoolRecommendationsData.js` is loaded before `script.js` and supplies `window.FANTASY_POOL_RECOMMENDATION_CANDIDATES`.
- `scorePredictionsData.js` is loaded and supplies `window.SCORE_FIXTURE_PREDICTIONS_DATA`.
- `fantasyPoolScorePredictionsData.js` exists, but the public `index.html` path inspected does not load it for the Match Environment surface.

One important nuance: `data/matchdayRecommendations_fantasyPool_v3.json` still carries staging-oriented metadata, while `scripts/buildFantasyPoolPreviewBrowserData.mjs` exports browser files that the public code now consumes. The public Pick Explorer and quick pick advice are therefore using the fantasy-pool preview bundle even though the source JSON metadata still has conservative staging wording.

## Current Player Selection Models

The generated fantasy-pool recommendation source has five real modes:

| Mode | Current role | Main scoring idea |
| --- | --- | --- |
| Balanced | Generated candidate mode | Mix of risk-adjusted return, raw projection, starts, minutes, row completeness, value, fixture, role, finance alpha, portfolio fit, role stability, and downside safety. |
| Safe | Generated candidate mode | Strongly favors start probability, expected minutes, floor, lower risk, role stability, and downside safety. |
| Upside | Generated candidate mode | Favors ceiling, ceiling per price, attacking environment, attack per price, fixture, upside prior, and finance alpha. |
| Differential | Generated candidate mode | Favors defensible lower-obviousness picks with projection, ceiling, value, scarcity, finance alpha, portfolio fit, and obviousness penalties. |
| Captain | Generated candidate mode | Favors captain score, raw projection, ceiling, attacking role, starts, minutes, fixture, captain prior, and finance alpha. |

The public model dropdown has more labels than the generated model has true source modes:

| Public label | Current implementation | Audit view |
| --- | --- | --- |
| Balanced | Uses generated Balanced source mode. | Distinct and useful. |
| Safe | Uses generated Safe source mode. | Distinct and useful, though public naming could be warmer. |
| Upside | Uses generated Upside source mode. | Distinct and useful. |
| Differential | Uses generated Differential source mode. | Distinct and useful after the v3 mode-separation calibration. |
| Value | Uses the Differential source pool, then re-sorts by value-oriented browser scoring. | Useful idea, but not a separate generated mode. It can confuse users if it appears equal to the generated modes. |
| Value Quant | Uses the Balanced source pool, then applies a custom value/finance-alpha formula. | Advanced variant of Value. Too technical for the main public dropdown. |
| Captain | Uses generated Captain source mode. | Distinct and useful. |
| Risk-Control Pick | Uses the Safe source pool, then applies a stricter browser score. | Useful internally, but public overlap with Safe is high. Better as a slider or advanced safety setting. |

The trust toggle further adjusts rankings for Safe, Balanced, Upside, and Differential styles. It does not hard-filter the list in the inspected implementation; it changes score penalties and boosts. This is helpful, but it compounds the public-label problem because a user can choose both a model and a trust style that sound similar.

## Are The Labels Actually Different?

Yes for the generated modes, partly for the browser-side variants.

The v3 mode-separation audit shows the main generated modes are meaningfully separated after calibration:

- Balanced and Safe still overlap because both avoid fragile picks, but they are not identical.
- Balanced and Differential are now well separated at the top.
- Safe and Differential are strongly separated.
- Upside and Captain are separated because Upside discounts obvious captain rows.

The browser-side variants are less clearly distinct:

- Value and Value Quant both lean on value-style scoring. They differ in source pool and formula, but the user-facing concept is too close.
- Risk-Control Pick is essentially a stricter safety re-rank over the Safe source pool.
- Best public simplification: keep one Value mode and one safety-first player mode, then move extra knobs into advanced controls.

## Recommended Player Model Labels

Recommended main public labels:

| Recommended label | User-facing meaning | Current support | Difficulty |
| --- | --- | --- | --- |
| Projected Points | Highest expected fantasy return. | Supported by raw expected points and expected return fields. | Low |
| Steady Picks | Balanced return with reliability. Good default. | Supported by Balanced and risk-adjusted fields. | Low |
| High-Floor Picks | Prioritizes likely starters, minutes, and lower downside. | Supported by Safe mode, floor, start, minutes, volatility, and tail-risk fields. | Low to medium |
| Upside Picks | Chases higher ceiling when the matchup can break open. | Supported by Upside mode, ceiling, attack environment, and fixture fields. | Low |
| Value Picks | Strong return for price. | Supported by official fantasy prices in the fantasy-pool bundle and value/VOR/scarcity fields in model files. | Medium |
| Captain Picks | Players with captain-worthy ceiling and minutes. | Supported by Captain mode and captain score fields. | Low |
| Differential Picks | Less obvious picks that still project well. | Supported by Differential mode and rank-based obviousness proxies. | Medium |

Recommended removals or demotions:

- Remove `Value Quant` from the main dropdown, or keep it only as an advanced model note.
- Replace `Risk-Control Pick` with either `High-Floor Picks` or a safety slider.
- Avoid showing both `Safe` and `Risk-Control Pick` as equal top-level choices.

The user-suggested direction of "normal points, risk-adjusted low, risk-adjusted medium, risk-adjusted high, value" is directionally right. The main caution is naming: most users will understand "Projected Points", "Steady Picks", and "High-Floor Picks" faster than "low/medium/high risk-adjusted points". The risk-penalty language can still live in tooltips or model notes.

## Public Explanation Copy

Suggested public copy should be short and concrete:

- Projected Points: "Favors the highest expected fantasy return."
- Steady Picks: "Balances projected return with reliable starts and minutes."
- High-Floor Picks: "Prioritizes players with safer minutes and lower downside."
- Upside Picks: "Chases higher ceilings in stronger attacking spots."
- Value Picks: "Looks for strong return for the price."
- Captain Picks: "Highlights captain-worthy players with ceiling and minutes."
- Differential Picks: "Finds less obvious picks that still project well."

Avoid public wording about validation processes, incomplete inputs, private review state, or live-provider mechanics. Those ideas are useful for development, but they make the product feel less confident and less helpful to a normal fantasy user.

## Current Score Predictor Model

The public Match Environment table uses `scorePredictionsData.js`, generated from `data/scorePredictions_v2.json`. The model is a PELE-forward team-quality adjusted Poisson model.

Current ingredients:

- Group fixtures and matchdays.
- Team quality values.
- PELE rating, tilt, offense, and defense inputs.
- World Football Elo.
- FIFA ranking.
- Attack and defense proxy scores.
- Host-venue boost only when a host country plays in its own host country.

Current method:

- Starts from a base World Cup team goal rate.
- Applies attack, opponent defense, quality gap, Elo gap, PELE gap, tilt, and venue context adjustments.
- Clamps expected goals to a controlled range.
- Uses an independent Poisson score grid to estimate win/draw/loss probabilities, clean-sheet probabilities, over-2.5, both-teams-to-score, and most likely scorelines.
- Converts fixture-level output into fantasy-facing attacking, defensive, captain, difficulty, and upset-risk environments.

Current limitations:

- No roster-weighted likely XI strength.
- No injuries, suspensions, or late team news.
- No recent-form module beyond the rating inputs.
- No official fantasy prices or scoring in the score model itself.
- Limited calibration against historical international tournament score distributions.
- Independent Poisson assumptions do not capture all low-score/draw tendencies.
- Score uncertainty is not yet exposed as a first-class input into squad strategy.

## Recommended Score Predictor Improvements

The best improvements should remain compatible with static hosting:

| Improvement | Why it helps | Difficulty |
| --- | --- | --- |
| Historical calibration | Tune average goals, draw rate, clean sheets, and scoreline distribution against past World Cup and comparable international matches. | Medium |
| Low-score correction | Improve 0-0, 1-0, 1-1, and low-total matches compared with independent Poisson. | Medium |
| Roster-weighted team strength | Blend expected starters into attack/defense once lineups and squads are reliable enough. | Hard |
| Player-role impact | Let elite attackers, set-piece takers, starting keepers, and defensive anchors move team attack/defense modestly. | Hard |
| Better venue context | Keep host-country boosts, but separate true home-country games, listed home team, travel, and venue effects. | Medium |
| Fantasy-specific fixture difficulty | Produce separate attacker, defender, keeper, and captain contexts instead of one generic difficulty. | Medium |
| Score uncertainty bands | Add high/medium/low uncertainty around expected goals and scoreline spread. | Medium |
| Squad-risk integration | Let upset risk, goal uncertainty, and fixture concentration affect player volatility and Team Builder risk. | Medium |
| Scenario exports | Precompute conservative, base, and aggressive match environments into static JSON. | Medium |

Do not make score prediction public copy about market probabilities or wagering. The model should stay a football/fantasy projection model.

## Current Team Builder Model

Short answer: Team Builder is currently individual-ranking based, not portfolio-first.

Current Team Builder behavior:

- Reads the active strategy from `measure-select`.
- Maps that selection to the same player model options used elsewhere.
- Scores players with `trustAdjustedScore(player, measure, mode)`.
- Sorts candidates by individual player score.
- Applies budget, position, country, lock, remove, price, start, and minutes constraints.
- Searches candidate squad paths by position slot.
- Chooses starters within each position by individual score.
- Ranks full squads with starter score, discounted bench score, captain bonus, budget buffer, and a portfolio adjustment.

The portfolio adjustment exists, but it is a late-stage nudge:

- It adds rewards for expected points, risk-adjusted points, upside, floor, start probability, minutes, favorable fixtures, and bench health.
- It subtracts penalties for volatility, tail risk, composite risk, review/watch flags, weak bench, premium squeeze, country-limit pressure, and hard-fixture load.
- It has mode-specific weights.
- It does not replace the core individual-player ranking search.

This is useful but modest. The model is closer to "best legal squad from individually scored players" than "optimize a portfolio of correlated assets".

## Current Team Builder Label Problem

The Team Builder dropdown currently borrows the player-selection labels. That creates a mismatch:

- A player label answers "Which individual players should I like?"
- A squad label should answer "What kind of 15-player squad do I want?"

Examples:

- `Captain` makes sense for player picks, but Team Builder should not simply build the squad with the highest individual captain score. A squad strategy would be `Captain-First` or `Captain Coverage`.
- `Differential` makes sense for players, but a full squad strategy should define how many lower-obviousness picks are appropriate and where to place them.
- `Value` makes sense for players, but a squad strategy should define whether value means stronger bench, fewer premiums, or more starter depth.
- `Safe` makes sense for players, but a squad strategy should decide how much to diversify countries, fixtures, price spend, captain dependency, and bench exposure.

## Recommended Team Builder Strategies

Recommended main Team Builder labels:

| Strategy | Public meaning | Optimizer objective | Risk tradeoff | Current support | Difficulty |
| --- | --- | --- | --- | --- | --- |
| Balanced Squad | Strong default 15-player squad. | Mix starter points, bench strength, captain options, budget efficiency, and moderate diversification. | May not maximize ceiling. | Mostly supported. | Medium |
| Diversified Squad | Reduces dependence on one country or match. | Penalize country, fixture, premium, and top-player concentration; reward bench strength and stable starts. | Lower explosive upside. | Partly supported by country, fixture, and bench fields. | Medium |
| Concentrated Upside | Leans into strong attacking spots. | Reward stacks in high team-xG or favorable fixtures; loosen concentration penalties. | More fragile if the stack fails. | Partly supported by country, fixture, xG, attack environment, and captain context. | Medium to hard |
| Stars and Scrubs | Spends heavily on elite starters. | Increase starter and captain weight; reduce bench weight while preserving minimum playable bench. | Weak bench and higher dependence on premiums. | Supported by price, starter score, bench score, and captain score. | Medium |
| Value Squad | Builds the deepest squad for the budget. | Reward points per price, VOR, scarcity, and playable bench. | May underweight elite captain ceilings. | Partly supported; cleaner after builder price alignment. | Medium |
| Captain-First | Builds around captain coverage. | Require multiple captain candidates across matchdays and reward captain score diversity. | Can sacrifice value or bench depth. | Partly supported by captain scores and matchday projections. | Medium to hard |
| No-Stars Balanced | Caps expensive-player count and spreads budget. | Cap premium count or max price; reward depth and balanced starters. | May miss top captain hauls. | Supported by prices and premium counts. | Low to medium |

Recommended default:

- Use `Balanced Squad` as the default.
- Put `Diversified Squad`, `Concentrated Upside`, `Stars and Scrubs`, `Value Squad`, and `Captain-First` in the main strategy select.
- Keep `No-Stars Balanced` as optional if the product wants a clear anti-premium build.

## Proposed Team Builder Strategy Details

### Balanced Squad

Goal: best all-around 15-player squad.

Suggested scoring:

- Starter score: high weight.
- Bench score: medium weight.
- Captain options: medium weight.
- Budget left: small positive weight.
- Country concentration: small penalty.
- Fixture concentration: small penalty.
- Weak bench: medium penalty.
- Downside and volatility: medium penalty.

### Diversified Squad

Goal: reduce dependence on one country, one fixture, or one small set of stars.

Suggested scoring:

- Increase penalties for top country count, starter country concentration, fixture concentration, and top-3 projected point share.
- Increase reward for playable bench.
- Increase downside protection and start/minutes reliability weights.
- Cap or penalize too many expensive players if it creates bench weakness.

This is the closest true portfolio strategy to add first.

### Concentrated Upside

Goal: intentionally stack strong environments.

Suggested scoring:

- Reward two or three attackers from a strong attacking fixture.
- Reward a captain plus teammate combination when team xG and captain environment are strong.
- Reduce country and fixture concentration penalties.
- Increase ceiling and attacking-environment weights.
- Keep minimum start/minutes guardrails so the strategy does not become reckless.

This should be clearly labeled as higher variance.

### Stars And Scrubs

Goal: maximize the starting XI and captain ceiling while accepting a cheaper bench.

Suggested scoring:

- Increase starter score and captain score.
- Reduce bench score weight, but enforce minimum playable bench rules.
- Reward premium players only when their captain or raw projection justifies the price.
- Penalize expensive players who do not project as captain options.

This needs official-price alignment in Team Builder to be fully trustworthy.

### Value Squad

Goal: squeeze the most projected return out of the budget.

Suggested scoring:

- Increase points-per-price, VOR, scarcity-adjusted value, and efficient-frontier weights.
- Increase bench strength weight.
- Penalize premium squeeze.
- Keep enough captain coverage so the squad is not just cheap.

### Captain-First

Goal: build a squad with strong captaincy paths.

Suggested scoring:

- Require or reward multiple non-GK captain candidates.
- Reward captain candidates across different matchdays or kickoff windows when available.
- Reward strong captain score plus start/minutes reliability.
- Penalize squads where one player accounts for nearly all captain value.

### No-Stars Balanced

Goal: avoid heavy premium dependence and spread budget.

Suggested scoring:

- Cap max price or premium count.
- Increase bench and starter-depth weight.
- Increase diversification weight.
- Keep a minimum captain-score threshold.

This can be a fun strategy, but it should be optional because it is a constraint style, not a universal squad-building goal.

## Portfolio Measures To Add Or Promote

| Measure | Meaning | Higher or lower is safer? | Public or development-facing? | Current support |
| --- | --- | --- | --- | --- |
| Country concentration | How much the squad depends on one country. | Lower is safer unless stacking. | Public summary. | Supported. |
| Starter country concentration | Country concentration among starters only. | Lower is safer unless stacking. | Public summary. | Can be computed. |
| Fixture concentration | How many players depend on the same match environment. | Lower is safer unless stacking. | Public summary. | Partly supported. |
| Hard-fixture load | Number of starters in difficult matchups. | Lower is safer. | Public summary. | Supported. |
| Favorable-fixture load | Number of starters in good matchups. | Higher can be better. | Public summary. | Supported. |
| Bench strength | How playable the substitutes are. | Higher is safer. | Public summary. | Supported. |
| Bench expected points | Projected return from bench players. | Higher is safer. | Public summary. | Supported. |
| Usable captain options | Number of credible captain candidates. | Higher is safer. | Public summary. | Supported. |
| Captain concentration | How dependent captain value is on one player. | Lower is safer. | Public summary. | Can be computed. |
| Premium share | Share of budget or players in expensive assets. | Strategy-dependent. | Public summary. | Supported by price fields. |
| Top-3 points share | How much projection comes from the top three players. | Lower is more diversified. | Public summary as "star dependence". | Can be computed. |
| Downside floor | How bad a normal poor outcome could look. | Higher floor is safer. | Public summary. | Supported by VaR/CVaR style fields. |
| Upside ceiling | How high the squad can spike. | Higher is better for upside. | Public summary. | Supported. |
| Correlation proxy | Whether picks rise and fall together by team and fixture. | Lower safer, higher for stacks. | Development-facing with simple public summary. | Can be computed. |
| Price concentration | Whether spend is spread or top-heavy. | Strategy-dependent. | Public summary. | Supported. |

The most important first additions are country concentration, fixture concentration, top-3 points share, captain options, bench strength, and downside floor. Those are easy to explain and useful for squad strategy.

## Captain And Bench Switch Tools

The Captain Change Advisor and Substitution Advisor are not separate full prediction models. They reuse player projections, score environments, manual current points, and strategy-specific blends.

Current Captain Change Advisor:

- Safe favors floor and risk-adjusted return and requires a larger switch buffer.
- Balanced blends expected points, risk-adjusted points, and floor.
- Upside gives more weight to ceiling and has a smaller buffer.
- Differential is also present in code with a very small buffer and higher upside weighting.

Current Substitution Advisor:

- Safe favors floor and requires a bigger improvement before recommending a switch.
- Balanced uses a moderate expected-points blend.
- Upside and Differential tolerate more volatility and smaller buffers.

Recommended public framing:

- "Captain Switch" should say whether a replacement is worth the armband based on projected return, ceiling, and safety margin.
- "Bench Switch" should say whether a substitute is worth bringing in based on projected return, floor, and lineup role.
- Keep buffers hidden or described as "switch margin" rather than technical formulas.

## Implementation Roadmap

### Phase 1: Rename And Simplify Player Models

No model rewrite required.

- Rename `Balanced` to `Steady Picks` or keep `Balanced` as default if the product wants continuity.
- Rename `Safe` to `High-Floor Picks`.
- Keep `Upside`, `Captain`, and `Differential`.
- Keep one `Value Picks` mode.
- Hide or demote `Value Quant`.
- Replace `Risk-Control Pick` with a safety control or fold it into `High-Floor Picks`.

Likely files for a later implementation:

- `script.js`
- `index.html`
- `README.md`
- `SITE_FEATURES.md`

### Phase 2: Split Team Builder Strategies From Player Pick Models

Moderate code change.

- Create a separate Team Builder strategy config instead of reusing `pickModelOptions` directly.
- Keep player model choice as an input, but let squad strategy control portfolio weights.
- Add explicit strategy labels: Balanced Squad, Diversified Squad, Concentrated Upside, Stars and Scrubs, Value Squad, Captain-First.

Likely files:

- `script.js`
- `index.html`
- `SITE_FEATURES.md`
- Possible new model note under `data/`.

### Phase 3: Add Portfolio Metrics To Builder Output

Moderate code change.

- Show country concentration.
- Show fixture concentration.
- Show bench strength.
- Show captain options.
- Show star dependence.
- Show downside floor and upside ceiling.

The current `squadPortfolioAnalytics` function already has many building blocks, so this is mostly an organization and presentation task.

### Phase 4: Add True Portfolio Strategy Weights

Larger code change.

- Extend `portfolioOptimizerWeights`.
- Add concentration rewards and penalties by strategy.
- Add strategy-specific hard constraints where appropriate.
- Tune with snapshot comparisons so strategies produce visibly different squads.

Important acceptance check: the top suggested squad for Diversified Squad, Concentrated Upside, Stars and Scrubs, and Value Squad should not collapse to the same 10 to 12 players.

### Phase 5: Score Predictor Calibration

Larger data/model change.

- Backtest score distributions against historical international matches.
- Tune expected goals, draw rate, clean-sheet rate, and scoreline probabilities.
- Add score uncertainty bands.
- Feed uncertainty into player projection volatility and Team Builder portfolio risk.

This can remain static by precomputing all outputs into browser data files.

## Recommended Acceptance Checks

For any future implementation, use these checks before shipping:

- Player model dropdown has no duplicate concepts.
- Pick Explorer top 20 lists differ visibly across Steady, High-Floor, Upside, Value, Captain, and Differential.
- Team Builder strategies produce different squads for the same budget and locks.
- Diversified Squad lowers country and fixture concentration versus Balanced Squad.
- Concentrated Upside increases controlled stack exposure versus Balanced Squad.
- Stars and Scrubs increases starter/captain weight while preserving at least a playable bench.
- Value Squad improves projected return per price and bench depth.
- Captain-First increases usable captain options.
- Score Predictor outputs still cover every fixture and team fixture row.
- Static browser data files remain loadable without runtime network calls.

## Final Recommendations

1. Treat Player Models and Team Builder Strategies as different product concepts.
2. Simplify the player model dropdown first because it is low risk and immediately improves clarity.
3. Make Team Builder portfolio-aware in a second phase rather than pretending the current labels already do that work.
4. Prioritize Diversified Squad and Concentrated Upside first because they prove the portfolio strategy concept most clearly.
5. Keep Score Predictor static, but calibrate it and expose fantasy-specific match environments more cleanly.
6. Avoid public copy that describes development process, validation state, incomplete rows, or provider mechanics. Users need clear fantasy decisions, not implementation caveats.
