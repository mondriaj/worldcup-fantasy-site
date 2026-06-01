# Stage B World Cup Features Plan

Plan date: May 13, 2026  
Repo root: `project/`  
Report location decision: no `docs/` folder exists, so this plan is saved in the repo root.  
Planning rule: no website, data, or source-code edits are included in this report.

## Inspection Summary

The working tree was clean before this report was created.

Files inspected:

- `index.html`
- `style.css`
- `script.js`
- `README.md`
- `dataSources.md`
- `countryMappingGuide.md`
- `euroScoringGuide.md`
- `../Reviews/staged_world_cup_website_plan.md`
- existing project files from `rg --files`

No existing fixture, group, team, or World Cup data folders/files were found in the repo. The current site is still a static single-page app using `playersData.js` and `players.json` for the EPL/FPL-style test player dataset.

## Public Source Notes

Reliable sources checked:

- FIFA match schedule, fixtures, venues, dates, and results page: https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/match-schedule-fixtures-results-teams-stadiums
- FIFA groups, qualification rules, and tie-breakers page: https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/groups-how-teams-qualify-tie-breakers
- FIFA qualified teams page: https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/world-cup-2026-who-has-qualified
- FIFA squad-list timing page: https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/squad-lists-number-date
- FIFA/Coca-Cola Men's World Ranking page: https://inside.fifa.com/fifa-world-ranking/men
- FIFA historical World Cup Fantasy article from 2022: https://www.fifa.com/en/articles/play-fifa-world-cup-fantasy
- OpenFootball public World Cup JSON repo: https://github.com/openfootball/worldcup.json
- OpenFootball raw 2026 JSON schedule: https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json

Important current findings:

- FIFA has public 2026 fixture, group, qualified-team, and squad-list timing information.
- FIFA says the 48-team field and 12 groups are complete.
- FIFA's schedule page covers 104 fixtures from June 11, 2026 through the final on July 19, 2026.
- FIFA's squad-list page says 26 players are permitted per squad, with final squads between 23 and 26 players and at least three goalkeepers.
- FIFA has a current official men's ranking page; the last official update visible in search results was April 1, 2026.
- I did not find public official FIFA World Cup 2026 fantasy rules, official fantasy player prices, or an official 2026 fantasy player list. The FIFA fantasy article found is for Qatar 2022 and should be treated as historical reference only.
- OpenFootball has public JSON for 2026 fixtures and appears useful as a technical fixture seed, but fixture data should be cross-checked against FIFA before publishing.

---

# 1. What Is Safe To Build Now

## Fixtures Page Or Section

- Why it is safe now: The tournament schedule is public on FIFA, and OpenFootball has a machine-readable 2026 schedule that can be cross-checked against FIFA.
- Data source needed: FIFA schedule page as primary source; OpenFootball JSON as optional implementation seed.
- Files likely involved: `index.html`, `style.css`, optional future `fixtures.json`, optional `script.js` if dynamic filtering is needed.
- Implement now or later: Implement now as Stage B1 if kept factual and separate from player recommendations.

## Groups Page Or Section

- Why it is safe now: FIFA says the 48-team field and 12 groups are complete.
- Data source needed: FIFA groups page and qualified teams page.
- Files likely involved: `index.html`, `style.css`, optional future `groups.json`, optional future `teams.json`.
- Implement now or later: Implement now as part of Stage B1, but keep it compact.

## Qualified Teams Page Or Section

- Why it is safe now: FIFA has a qualified-teams page listing all 48 teams.
- Data source needed: FIFA qualified teams page.
- Files likely involved: `index.html`, `style.css`, optional future `teams.json`.
- Implement now or later: Implement now only if it supports the fixtures/groups section. Avoid turning the homepage into a long encyclopedia.

## Host Cities Or Venues

- Why it is safe now: FIFA has public venue/city information through the schedule and host-city pages.
- Data source needed: FIFA schedule and host-city pages.
- Files likely involved: `index.html`, `style.css`, optional future `venues.json`.
- Implement now or later: Later unless needed for fixtures. Venue details are useful, but not the first fantasy need.

## Fixture Difficulty Prototype

- Why it is safe now: Fixtures and FIFA rankings are public, so a team-level experimental difficulty shell can be designed.
- Data source needed: FIFA schedule, FIFA rankings, possibly group data.
- Files likely involved: `script.js`, `index.html`, `style.css`, optional `teams.json`, optional `fixtures.json`.
- Implement now or later: Shell now, scoring later. Do not publish numeric difficulty as serious fantasy advice until the data model is reviewed.

## Matchday Schedule Shell

- Why it is safe now: Dates and fixtures are public. This can help fantasy users prepare without player-specific claims.
- Data source needed: FIFA schedule and/or OpenFootball JSON.
- Files likely involved: `index.html`, `style.css`, optional `fixtures.json`.
- Implement now or later: Implement now only as a simple section: upcoming group-stage dates, not a full app.

## Data Adapter Structure For Future Official Squads

- Why it is safe now: A schema can be designed without importing final squad data.
- Data source needed: Future official FIFA squad list, future official fantasy player list if available.
- Files likely involved: future data scripts, `players.json`, `playersData.js`, possible `worldcupPlayers.json`.
- Implement now or later: Plan now. Do not code heavily until official data shape is known.

## Source Notes For FIFA And Fixture Data

- Why it is safe now: Source transparency helps trust and can be added without importing data.
- Data source needed: FIFA pages and OpenFootball repo links.
- Files likely involved: `index.html`, `README.md`, possibly `dataSources.md` later with approval.
- Implement now or later: Implement with Stage B1 if the fixtures/groups section is added.

---

# 2. What Should Still Wait

## Final Player Database

- Wait because: Official final squads are not loaded into the project yet.
- Trigger: FIFA publishes official final squad lists, or official squads are available and cross-checked.

## Official Fantasy Prices

- Wait because: No official 2026 fantasy player prices were found.
- Trigger: FIFA or the official fantasy game publishes the 2026 player pool and prices.

## Official Positions

- Wait because: Current positions come from EPL/FPL-style data, not the 2026 official fantasy game.
- Trigger: Official 2026 fantasy game publishes positions or FIFA squad data includes positions suitable for fantasy use.

## Official Budget

- Wait because: The only official fantasy budget found is from FIFA's 2022 fantasy article.
- Trigger: Official 2026 fantasy rules publish budget and phase changes, if any.

## Max Players Per Country

- Wait because: Historical 2022 limits may not match 2026.
- Trigger: Official 2026 fantasy squad-building rules are published.

## Official Scoring Rules

- Wait because: Current model uses EURO-style estimates and historical reference, not final 2026 rules.
- Trigger: Official 2026 fantasy scoring rules are published.

## Official Substitutions And Captain Rules

- Wait because: Historical 2022 rules may not carry over.
- Trigger: Official 2026 fantasy rules explain substitutions, captain switches, boosters, and deadlines.

## Real Captain Picks

- Wait because: Real captain advice needs official squads, roles, prices, positions, fixtures, and likely minutes.
- Trigger: Official squads plus matchday data are available.

## Predicted Lineups

- Wait because: Lineups are speculative before squads and pre-match reporting.
- Trigger: Official squads are out and reliable team-news sources are available.

## Injury Tracker

- Wait because: Injury data needs a stable player pool and frequent updates.
- Trigger: Official squads are out and a source policy is approved.

## Team Reveal

- Wait because: A real team reveal needs final game rules, prices, positions, and budget.
- Trigger: Official fantasy game launches with player pool and rules.

## National Team Pages

- Goal: Create one page per national team once official squads are available.
- Example URLs: `teams/mexico.html`, `teams/canada.html`, `teams/usa.html`, or another clean structure if a better routing pattern is chosen later.
- Each team page could include: group, fixtures, squad list, likely starters only when reliable, fantasy-relevant players, injury or availability notes, penalty takers and set-piece notes if reliable, and links back to the World Cup page and fantasy tools.
- Trigger: Start this only after official national team squads are announced and reliable squad/player data is available.
- Constraints: Do not create team pages in Stage B. Do not use estimated squads as final squads. Do not connect team pages to fantasy recommendations until official squads and fantasy rules are available. Keep FIFA and official federation sources as primary sources where possible.

---

# 3. Recommended Stage B1 Implementation

Recommended first batch: add a compact `World Cup Fixtures` section that introduces groups, schedule context, fixture difficulty status, and data source status without touching player recommendations.

Recommended heading:

```text
World Cup Fixtures
```

Recommended subheading:

```text
Track the tournament schedule and prepare for fixture-aware fantasy picks once squads and rules are available.
```

Recommended compact cards:

1. `Groups and teams`
   - Copy: `The 48-team field and 12 groups are public. Use this section to track the tournament structure before player data is connected.`
2. `Match schedule`
   - Copy: `Fixtures run from June 11 to July 19, 2026. A fixture table can be connected after the data file is approved.`
3. `Fixture difficulty preview`
   - Copy: `Experimental fixture difficulty can be added later using FIFA rankings and group context. It will not use betting odds.`
4. `Data status`
   - Copy: `Fixture and group data can be sourced from FIFA, with OpenFootball JSON used only after cross-checking. Player recommendations remain based on the current test dataset.`

Why this is the right first Stage B step:

- It makes the site feel more World Cup-specific.
- It does not require final squads, fantasy prices, or fantasy rules.
- It creates a natural bridge to future fixture-aware player recommendations.
- It keeps the current Quick Picks, Captain Picks, Team Advice, and Team Builder honest and separate from tournament fixtures.

Do not add real fixture-adjusted recommendations in B1. Add only the structure and source-aware status.

---

# 4. Data Model Proposal

Do not create these files yet. This is the proposed shape for approval.

## `fixtures.json`

Suggested fields:

- `match_id`: stable string such as `wc2026-gs-a-001` or official match number if available
- `date`: ISO date, for example `2026-06-11`
- `kickoff_time`: local kickoff time, for example `13:00`
- `timezone`: IANA timezone if converted, or original offset if preserving source, for example `UTC-6`
- `group`: `Group A`, `Group B`, etc. Blank or null for knockout fixtures.
- `home_team`: display name
- `away_team`: display name
- `home_team_id`: stable team id
- `away_team_id`: stable team id
- `venue`: stadium name or FIFA venue label
- `city`: host city
- `stage`: `group`, `round_of_32`, `round_of_16`, `quarter_final`, `semi_final`, `third_place`, `final`
- `matchday_label`: source round label or site display label
- `source`: source URL
- `source_last_checked`: date checked
- `status`: `scheduled`, `played`, `placeholder`, etc.

## `teams.json`

Suggested fields:

- `team_id`: stable slug, for example `mexico`
- `team_name`: public display name
- `fifa_team_name`: exact FIFA display name if different
- `group`: `Group A`, etc.
- `confederation`: if available from FIFA or another reliable source
- `fifa_ranking`: optional, only if pulled from FIFA ranking source
- `fifa_ranking_date`: ranking edition date
- `qualified_status`: `qualified`
- `source`: source URL
- `source_last_checked`: date checked

## `groups.json`

Suggested fields:

- `group_id`: `A`, `B`, etc.
- `group_name`: `Group A`, `Group B`, etc.
- `team_ids`: array of four team ids
- `source`: source URL
- `source_last_checked`: date checked
- `notes`: optional source notes

## Optional Future `venues.json`

Suggested fields:

- `venue_id`
- `venue_name`
- `city`
- `country`
- `timezone`
- `source`

Implementation note:

- Keep fixture/team/group data separate from player data.
- Do not attach current EPL/FPL players to World Cup teams until official squads exist.
- Prefer a small static JSON file first. A larger data pipeline can come later.

---

# 5. Fixture Difficulty Approach

Recommended first version: leave fixture difficulty as a clearly labelled shell in B1.

Possible later inputs:

- Opponent strength using FIFA/Coca-Cola Men's World Ranking.
- Group strength using the average or median ranking of group opponents.
- Rest days between fixtures if date/time parsing is reliable.
- Travel/venue context only if it can be computed simply and explained clearly.
- Home-host context for Canada, Mexico, and USA if used cautiously.

Avoid:

- Betting odds.
- Market-implied probabilities.
- Gambling language.
- Any claim that a fixture score is a final fantasy prediction.

Recommended label:

```text
Experimental fixture difficulty
```

Recommended status copy:

```text
Fixture difficulty is planned as a team-level planning aid. It will use public football data such as schedule context and FIFA rankings, not betting odds, and will stay separate from player picks until official squads and fantasy rules are loaded.
```

Recommendation:

- B1: show shell only.
- B2: add a non-scoring fixtures/groups table if approved.
- B3 or later: add experimental difficulty scores after the source and formula are approved.

---

# 6. Website Placement

Recommended placement for B1:

- Add a new `World Cup Fixtures` section after `Team Builder` and before `Methodology`.
- Add a footer link to `World Cup Fixtures`.
- Keep the section compact, using cards similar to the existing `Data Sources`, `Changelog`, and `About` sections.

Why this placement:

- It keeps the core fantasy tools first.
- It makes the site more World Cup-specific before the technical methodology.
- It avoids changing the hero, SEO metadata, or player recommendation flow.
- It is the smallest clean approach for the current static site.

Standalone page recommendation:

- Not yet. The current site has no routing framework. A new page is useful later if fixture data becomes large, but B1 should stay on the homepage as one compact section.

---

# 7. Exact Edit Plan

## Batch B1: Compact World Cup Fixtures Section

- Goal: Add a World Cup-specific section that is useful now but does not alter player recommendations.
- Files:
  - `index.html`
  - `style.css`
  - `README.md` only if we want to document the planned future fixture files
- Changes:
  - Add `#world-cup-fixtures` section after Team Builder.
  - Add four compact cards: Groups and teams, Match schedule, Fixture difficulty preview, Data status.
  - Add a footer link: `World Cup Fixtures`.
  - Add short source note pointing to FIFA and OpenFootball as planned data sources.
- Data source:
  - FIFA schedule and groups pages.
  - OpenFootball as optional future JSON source, not imported yet.
- Risks:
  - Page may get longer.
  - Users may assume fixture-aware recommendations are active unless the copy is clear.
  - Footer may wrap more on mobile, requiring a small CSS check.
- Tests:
  - Desktop render.
  - Mobile render at 390px.
  - Footer links still work.
  - Quick Picks, Captain Picks, Team Advice, and Team Builder still work.
  - No console errors.
  - Wording check: no final player data claims and no official FIFA fantasy-advice claim.

## Batch B2: Data File Proposal Or Fixture Data Shell

- Goal: Prepare fixture/team/group data files only after approving the exact source and schema.
- Files:
  - possible `fixtures.json`
  - possible `teams.json`
  - possible `groups.json`
  - `README.md`
  - possibly `dataSources.md` if approved separately
- Changes:
  - Add empty or minimal sourced data files only if approved.
  - Include `source`, `source_last_checked`, and clear status fields.
  - Keep these files disconnected from player recommendations.
- Data source:
  - FIFA as primary source.
  - OpenFootball raw JSON as implementation seed after cross-checking.
- Risks:
  - Hand-entered fixture data can drift from official updates.
  - OpenFootball names may differ from FIFA display names, for example `Turkey` vs `Turkiye`, `Czech Republic` vs `Czechia`, `Ivory Coast` vs FIFA's accented form.
  - Timezone conversion can introduce errors.
- Tests:
  - JSON validation.
  - Cross-check sample fixtures against FIFA.
  - No UI changes unless a display section is approved.

## Batch B3: Experimental Fixture Difficulty Shell

- Goal: Add a non-player-specific fixture difficulty concept if B1/B2 are working.
- Files:
  - `script.js` if dynamic
  - `index.html`
  - `style.css`
  - possible `teams.json`
- Changes:
  - Add a simple explanatory panel or disabled state for difficulty.
  - Optional later: compute a team-level difficulty label using FIFA rankings only.
- Data source:
  - FIFA rankings plus fixtures.
- Risks:
  - Even simple difficulty can look like a prediction.
  - Rankings are imperfect and date-sensitive.
  - Needs strong copy: experimental, team-level, not betting-based, not player advice.
- Tests:
  - Formula sanity check.
  - Wording check.
  - No betting/gambling content.

---

# 8. Testing Plan

After each approved Stage B edit batch:

- Desktop render test.
- Mobile render around 390px.
- Existing Quick Picks still render.
- Captain Picks still render.
- Team Advice dropdowns and mobile cards still work.
- Team Builder still builds a squad.
- Team Builder reset/remove/removed-player controls still work.
- Footer links and anchors still work.
- No console errors.
- No horizontal overflow.
- Wording check:
  - no final World Cup player-data claims
  - no fake World Cup player data
  - no official FIFA fantasy-advice claim
  - no final 2026 fantasy rules claim
  - no betting or gambling content
- Source check:
  - any fixture/group copy points to FIFA or explicitly says it is planned
  - OpenFootball is described as a technical fixture data source, not the official source

---

# Final Recommendation

Start Stage B with Batch B1 only.

Add one compact `World Cup Fixtures` section and a footer link. Keep the section factual, source-aware, and separate from player recommendations.

Do not touch the player database, Quick Picks logic, Captain Picks logic, Team Advice ranking logic, or Team Builder squad logic in B1.

Do not implement fixture difficulty scores yet. Show only a shell/status card until the source and formula are approved.

Do not use FIFA 2022 fantasy rules as 2026 rules. Keep the 2022 article as historical reference only until official 2026 fantasy rules, prices, positions, and player list are public.
