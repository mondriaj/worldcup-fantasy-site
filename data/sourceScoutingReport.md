# Week 6 Source Scouting Report

Status: StatBunker first pass imported; remaining notes are future source leads.  
Last checked: 2026-05-31.

## Short Answer

There are sources that get closer to FPL-Core-Insights for non-English leagues, but they are split across different ecosystems.

The best next path is:

1. Use StatBunker as the broad Big 5 fantasy-style source. First pass complete.
2. Keep Understat for xG/xA and attacking quality.
3. Add league-specific fantasy APIs only where access is stable and allowed.
4. Use Transfermarkt-style datasets for market value, injuries, national-team history, and identity matching.

## Best Immediate Candidate

### StatBunker Big 5 Fantasy and Player Stats

Why it matters:

- It has fantasy-style player tables for major leagues.
- It includes fields that Understat does not expose, especially starts and clean sheets.
- It also has player standings, assists, cards, shots on goal, fouls/cards, injuries and suspensions, and fantasy form.

Pages imported:

- Premier League 25/26 fantasy players: `https://www.statbunker.com/competitions/FantasyFootballPlayersStats?comp_id=776`
- La Liga 25/26 fantasy players: `https://www.statbunker.com/competitions/FantasyFootballPlayersStats?comp_id=777`
- Serie A 25/26 fantasy players: `https://www.statbunker.com/competitions/FantasyFootballPlayersStats?comp_id=785`
- Ligue 1 25/26 fantasy players: `https://www.statbunker.com/competitions/FantasyFootballPlayersStats?comp_id=787`
- Bundesliga 24/25 fantasy players: `https://www.statbunker.com/competitions/FantasyFootballPlayersStats?comp_id=762`

Fields seen:

- fantasy points
- position
- starts
- goals
- assists
- clean sheets
- yellow cards
- red cards
- substitute starts
- came on
- taken off
- penalties saved
- penalties missed
- goals conceded
- own goals

Import value:

- This is the closest broad public source to the FPL-Core-Insights shape.
- It is now `statbunkerBig5Fantasy`.
- It fills `starts`, `clean_sheets`, `goals_conceded`, and fantasy-style points where a current-season row matched safely.

Risks:

- It is HTML, not a clean public JSON API.
- Some pages show mirror domains or intermittent internal errors.
- Bundesliga 25/26 was not found in the scanned StatBunker fantasy competition IDs, so Bundesliga is previous-season context only.
- Ligue 1 25/26 imported only 40 fantasy rows in this pass, so Ligue 1 StatBunker coverage is currently weak.

## Best GitHub Candidates

### GitHub soccer-stats Topic Scan

URL: `https://github.com/topics/soccer-stats`

Why it matters:

- The topic page lists public repos that are not only Big 5 focused.
- It is especially useful for MLS and North American player data.
- It also points to Brazil and broad football-data API wrappers, though several repos are app demos rather than reusable datasets.

High-value candidates from this topic:

- `sportsdataverse/usfootballR`
- `gautam0826/FMLS-Projections`
- `lohxx/brasileirao`
- `inglorious-ratbastard/botnSoccerApp`
- `CodeWithKola/sport-insight`

Current verdict:

- MLS is the strongest non-Big-5 lead from this topic.
- Brazil is useful for standings through the CBF source wrapper, but not player-level performance yet.
- Football-Data.org wrappers can help with scorers, assists, standings, and fixtures across leagues, but they are not full player-performance datasets.
- Some repos require API keys or hidden/private fantasy APIs, so they need a safe credential policy before import.

### sportsdataverse/usfootballR

URL: `https://github.com/sportsdataverse/usfootballR`

Why it matters:

- The repo describes MLS and NWSL play-by-play data.
- The package accesses ESPN live play-by-play and box score data, with shot locations when available.
- It also exposes standings and results.

Useful fields:

- MLS fixtures and results.
- MLS box-score player usage.
- Play-by-play events.
- Shot locations when ESPN exposes them.

Import value:

- Best immediate lead for MLS players outside the Big 5.
- Could help players from USA, Canada, Mexico, Uruguay, Argentina, Paraguay, Ecuador, and others who are in MLS.
- Could become `usfootballRMLS` or a direct ESPN MLS importer.

Risks:

- It is an R package, so we need either R runtime support or to port the ESPN calls into Node/Python.
- ESPN coverage varies by match and field.
- It likely gives match logs rather than fantasy prices.

### gautam0826/FMLS-Projections

URL: `https://github.com/gautam0826/FMLS-Projections`

Why it matters:

- It creates points projections for Fantasy MLS.
- Its README says raw JSON comes from a hidden FMLS API and is saved by season.
- It builds player-game observations, SQLite views, lagging player stats, adjusted points, and fantasy projection features.

Useful fields:

- Fantasy MLS points.
- Player match/gameweek stats.
- Goals, assists, shots, and other lagged player stats.
- Team and opponent recent form.
- Adjusted fantasy points and projection features.

Import value:

- Best Fantasy MLS-specific modeling reference.
- Useful for our model design even if we do not import the raw hidden API.
- Could inspire a `fantasyMlsContext` layer for MLS players.

Risks:

- The source API is described as hidden, so we should not use it blindly.
- Repo was last updated in 2020.
- Need confirm whether current Fantasy MLS API access is public and allowed.

### lohxx/brasileirao

URL: `https://github.com/lohxx/brasileirao`

Why it matters:

- Scrapes CBF Serie A standings.
- Exports current or historical Brasileirão tables to JSON, CSV, or Excel.

Useful fields:

- Brazilian Serie A team standings.
- Season/year support.
- Club ranking/table context.

Import value:

- Useful team-strength context for Brazil-based players.
- Could help fixture or league-strength context for Brazilian clubs.

Risks:

- It is standings-only, not player-performance data.
- It does not solve minutes, starts, goals, assists, or fantasy scoring by player.

### inglorious-ratbastard/botnSoccerApp

URL: `https://github.com/inglorious-ratbastard/botnSoccerApp`

Why it matters:

- Wraps the Football-Data.org API.
- The README says it supports Premier League, Bundesliga, La Liga, Serie A, Ligue 1, Eredivisie, Primeira Liga, Brasileirão, and FIFA World Cup.
- It includes matches, standings, top scorers, assists, and penalties per league.

Useful fields:

- Fixtures.
- Results.
- Standings.
- Top scorers.
- Assists and penalties where API plan/source supports them.

Import value:

- Useful for Portugal, Netherlands, Brazil, and broad league context.
- Could help players outside Big 5 when only scorer/assist context is needed.

Risks:

- Requires a Football-Data.org API key.
- Free tier may be limited.
- It is not a full player-level minutes/starts/clean-sheet source.

### CodeWithKola/sport-insight

URL: `https://github.com/CodeWithKola/sport-insight`

Why it matters:

- It is a football match analysis app with historical match data, team performance, odds, and recent form.
- It uses a `scalesp.com` API key.

Import value:

- Could be useful for team form and match context if the API is accessible and allowed.

Risks:

- Requires API credentials.
- The repo is more match/team analysis than player-performance data.
- Includes odds-oriented context, which we should not use for prototype predictions unless explicitly allowed later.

### salimt/football-datasets

URL: `https://github.com/salimt/football-datasets`

Why it matters:

- Transfermarkt-style datalake.
- Claims 92,671 player profiles and 1,878,719 player performance records.
- Includes player profiles, performances, market values, transfer histories, injury histories, national-team performances, and teammates.

Useful fields:

- player identity
- current club
- position
- market value history
- injuries
- goals
- assists
- minutes
- clean sheets
- goals conceded
- national-team performance summary

Import value:

- Excellent identity and market-value supplement.
- Useful for players outside Big 5 leagues.
- Could help our player matching and risk model more than fantasy points directly.

Risks:

- Transfermarkt-derived data may have licensing/terms concerns.
- Need inspect actual CSV freshness and whether 2025-2026 rows are complete before importing.

### carlosgeos/laligafantasy

URL: `https://github.com/carlosgeos/laligafantasy`

Why it matters:

- Targets LaLiga Fantasy directly.
- Fetches LaLiga Fantasy API data for player metrics, prices, points, market trends, and dashboards.

Import value:

- Best La Liga fantasy-specific lead.
- Could provide price and fantasy points, which Understat cannot.

Risks:

- Requires LaLiga Fantasy credentials and league/account IDs.
- Tokens expire.
- Need confirm current API still works and that usage is allowed.

### LaLiga Fantasy scraper repos

URLs:

- `https://github.com/diegoparrilla/marca-fantasy-scraper`
- `https://github.com/alxgarci/marca-fantasy-api-scraper-updated`

Why they matter:

- Historical LaLiga Fantasy API scrapers.
- Designed to export player/team CSV or JSON, including market-value history.

Import value:

- Good for reverse-engineering fields and endpoint behavior.

Risks:

- One updated scraper says it currently does not work because endpoints changed and web access moved app-only.
- Treat these as research references, not current production sources.

### jaschrs/LaLigaAPI

URL: `https://github.com/jaschrs/LaLigaAPI`

Why it matters:

- Unofficial La Liga player-stat API over FotMob-sourced data.
- Example output includes starts, matches, minutes, goals, assists, rating, yellow cards, and red cards.

Import value:

- Could supplement La Liga if StatBunker is weak.

Risks:

- Marked deprecated.
- Requires a FotMob request key refreshed roughly daily.
- FotMob rights/terms need caution.

### Serie A Fantacalcio / Fantamaster leads

URLs:

- `https://github.com/uPeppe/fantabeto`
- `https://github.com/FilippoPisello/serie-a-db`

Why they matter:

- They point toward Fantacalcio/Fantamaster-style Serie A data.
- `fantabeto` uses Fantacalcio votes/fantavotes plus FBref to model player performance.
- `serie-a-db` notes Fantacalcio grades and a Fantamaster player-stats API.

Import value:

- Best Serie A fantasy-specific research lead.
- Could provide player grades/fantasy scores if endpoints are still accessible.

Risks:

- Need endpoint validation.
- Some fantasy scores are game-specific, not universal.
- Official rights/terms need review before production use.

### Kickbase Bundesliga ecosystem

URLs:

- `https://github.com/kevinskyba/kickbase-api-doc`
- `https://github.com/kevinskyba/kickbase-api-python`
- `https://github.com/casudo/Kickbase-Insights`
- `https://github.com/LennardFe/Kickbase-Trading-Advisor`

Why it matters:

- Kickbase is a major Bundesliga fantasy game.
- Repos document or wrap Kickbase API behavior.
- Available fields may include market values, points, live points, transfer-market data, and manager/league context.

Import value:

- Best Bundesliga fantasy-specific lead.
- Could fill fantasy points and market values if credentials are available.

Risks:

- Requires Kickbase credentials.
- Some API methods have known issues or changing behavior.
- Some tooling is built around a user's private fantasy league, not a public all-player feed.

### MPG / Mon Petit Gazon for France

URL: `https://github.com/axel3rd/mpg-coach-bot`

Why it matters:

- MPG is a major French fantasy-football game.
- The bot uses MPG credentials and external data to optimize weekly actions.

Import value:

- Best Ligue 1 fantasy-specific GitHub lead.
- Could help with price/quotation and injury/team-selection context if access works.

Risks:

- Requires MPG credentials.
- It is optimized for a user's league, not necessarily a public player-stat export.
- Need confirm 2025-2026 Ligue 1 support.

### FBref / Top 5 Scraping Repos

URLs:

- `https://github.com/hadjdeh/football-data-analysis`
- `https://github.com/parth1902/Scrape-FBref-data`

Why they matter:

- They document top-five league FBref scraping workflows.
- FBref has starts, minutes, standard, shooting, passing, defensive, possession, and keeper tables.

Import value:

- Useful if direct FBref access becomes reliable or if a cached export is available.

Risks:

- Direct FBref access was blocked in our current environment.
- Cloudflare/rate limits make it fragile.

## Other Non-GitHub Sources Worth Testing

### Official Bundesliga Stats

URL: `https://www.bundesliga.com/en/bundesliga/stats/player`

Value:

- Official player stats and official fantasy entry points.
- Good fallback if Kickbase requires private credentials.

Risk:

- Need inspect browser/API calls before import.

### Kickest Serie A

URL: `https://www.kickest.it/en/serie-a/stats/players/table?iframe=yes`

Value:

- Serie A fantasy-style stats table.
- Fields seen in search include points, credits, appearances, starter, minutes, goals, shots, and shots on target.

Risk:

- Need parser/API validation and usage review.

### FootyStats

Example:

- `https://footystats.org/france/ligue-1/players`

Value:

- Broad player tables for Ligue 1 and other leagues.
- Could help with non-UEFA qualifier and lower-league coverage.

Risk:

- Often partial tables or paginated/protected content.

## Non-Big-5 League Source Test

Output file:

- `data/nonBig5LeagueSourceTest.json`

Leagues tested:

- Portuguese Primeira Liga
- Belgian Pro League
- Polish Ekstraklasa
- Greek Super League
- MLS
- Brazilian Serie A
- Argentine Liga Profesional

### ESPN Soccer Stats and Site API

URLs:

- `https://www.espn.com/soccer/stats/_/league/por.1`
- `https://www.espn.com/soccer/stats/_/league/bel.1`
- `https://www.espn.com/soccer/stats/_/league/gre.1`
- `https://www.espn.com/soccer/stats/_/league/usa.1`
- `https://www.espn.com/soccer/stats/_/league/bra.1`
- `https://www.espn.com/soccer/stats/_/league/arg.1`

Value:

- Public ESPN stats pages exposed parseable leaderboard tables for six of the seven tested leagues.
- The ESPN teams API and scoreboard API also returned team and fixture context for those leagues.
- The parsed leaderboard rows include player name, ESPN player UID, team, appearances, goals, and assists depending on table.

Risk:

- This is leaderboard data, not a full player-season table.
- It does not solve minutes, starts, clean sheets, or defensive/goalkeeper measures by itself.
- ESPN did not expose a working `pol.1` endpoint in this test.

Verdict:

- Best free immediate path for Portugal, Belgium, Greece, MLS, Brazil, and Argentina.
- Use as a first import layer for player identity, team IDs, goals, assists, and appearances.
- Pair with FootyStats, Excel4Soccer, match summaries, or another lineup source for minutes and starts.

### ESPN Broad Coverage Scan

Output files:

- `data/espnLeagueCoverage.json`
- `data/espnLeagueLeaderboards.json`
- `data/espnRosterLeaderboardMatches.json`

Value:

- ESPN's competitions page exposed 168 soccer competition codes in this pass.
- All 168 tested stats pages returned parseable public leaderboard tables.
- Saudi Pro League is available at `https://www.espn.com/soccer/stats/_/league/ksa.1`.
- The scan stores top-scorer and top-assist rows with appearances, ESPN player UID, ESPN player URL, team, and team URL.
- The roster-match file found 1,459 prototype matches between World Cup roster players and ESPN leaderboard rows.
- 787 of those matches are high-confidence name-and-club matches.

Priority league examples confirmed:

- `ksa.1` - Saudi Pro League
- `tur.1` - Turkish Super Lig
- `ned.1` - Dutch Eredivisie
- `mex.1` - Mexican Liga MX
- `jpn.1` - Japanese J.League
- `chn.1` - Chinese Super League
- `rsa.1` - South African Premiership
- `sco.1` - Scottish Premiership
- `aut.1` - Austrian Bundesliga
- `sui.1` - Swiss Super League
- `den.1` - Danish Superliga
- `nor.1` - Norwegian Eliteserien
- `swe.1` - Swedish Allsvenskan

Risk:

- ESPN leaderboards are not complete player-season tables.
- They do not include minutes, starts, clean sheets, defensive actions, goalkeeper stats, or fantasy points.
- The current roster matching is prototype matching. Name-only rows need manual or source-backed review before merging.

Verdict:

- This is the best broad no-credential source layer found so far.
- It should be merged into player profiles as ESPN leaderboard context, not as final full performance data.

### ESPN Detailed Match-Player Stats

Output files:

- `data/espnDetailedMatchPlayerStats.json`
- `data/espnDetailedSeasonPlayerStats.json`
- `data/espnDetailedRosterPlayerStats.json`

Value:

- ESPN match summaries expose full match rosters for Saudi Pro League.
- Each appeared player can be expanded through ESPN's core per-player match-stat endpoint.
- The detailed endpoint includes minutes, starts, substitute appearances, sub-outs, shots, shots on target, cards, fouls, goals conceded, saves, clean-sheet flags, penalty stats, free-kick stats, and more.
- The first deep import covered the full 2025-26 Saudi Pro League regular season: 306 completed matches and 9,214 player-match rows.
- This created 555 Saudi season-player aggregate rows.
- This created 44 prototype World Cup roster matches, including 35 high-confidence name-and-club matches.

Risk:

- It requires many requests because each appeared player has a separate core-stat endpoint.
- The feed is strong for minutes/starts/attacking/goalkeeper stats, but some defensive fields are sparse or zero-filled in the Saudi feed.
- Name-only roster matches still need review.

Verdict:

- This is the best source found so far for non-Big-5 minutes and starts without credentials.
- Expand this same importer next to MLS, Liga MX, Brazil, Argentina, Portugal, Belgium, Turkey, Netherlands, and Japan in batches.

### ESPN Summary Roster Fallback

Output files:

- `data/espnSummaryImportReport.json`
- `data/espnSummaryMatchedPlayerStats.json`
- `data/espnSummaryMatchedSeasonStats.json`

Value:

- The broad ESPN core-stat expansion hit blocked core endpoint responses, so the fallback importer uses ESPN's public site scoreboard and summary APIs only.
- This pass tested 30 league codes connected to World Cup countries.
- It reached all 30 scoreboards, read 8,886 completed events, and imported 21,014 matched World Cup roster player-match rows.
- It created 937 season aggregate rows for 806 World Cup roster players.
- It produced matched rows in Argentina, Australia, Austria, Belgium, Brazil, Colombia, Denmark, England, Spain, France, Germany, Greece, Japan, Saudi Arabia, Mexico, Netherlands, Norway, Portugal, South Africa, Scotland, Switzerland, Sweden, Türkiye, and MLS.
- Korea Republic and Qatar are the only World Cup countries still not covered by this ESPN summary fallback pass.
- `data/worldCupLeagueCoverageMap.json` now records domestic-league source coverage for all 48 World Cup countries.
- Domestic ESPN league was found for 26 World Cup countries, and 22 of those produced matched roster rows.

Risk:

- Exact minutes are not always exposed in ESPN summary rosters, so the fallback estimates minutes from starter/substitution timing and marks that in the output.
- Name-only matches remain review-only.
- Defensive and goalkeeper stat coverage varies by league and event.

Verdict:

- This is the best broad no-credential expansion layer found after the core-stat endpoint became unreliable for batch use.
- Use it as non-Big-5 player context and as a staging source for a future `playerPerformance.json` merge, with minutes confidence kept separate.

### OneFootball and Non-English Korea/Qatar Sources

Output files:

- `data/oneFootballKoreaQatarImportReport.json`
- `data/oneFootballKoreaQatarLeagueStats.json`
- `data/oneFootballKoreaQatarMatchPlayerStats.json`
- `data/oneFootballKoreaQatarSeasonPlayerStats.json`
- `data/oneFootballKoreaQatarRosterMatches.json`
- `data/nonEnglishLeagueSourceProbe.json`

Value:

- OneFootball search found K League 1 as competition ID `130` and Qatar Stars League as competition ID `158`.
- OneFootball match feeds exposed current season IDs `43358` for K League 1 and `43062` for Qatar Stars League.
- OneFootball league statistics exposed top scorers, assists, goals plus assists, yellow cards, and red cards.
- OneFootball match pages exposed confirmed lineups, substitutions, goals, assists, cards, and basic team match stats.
- The import parsed 222 match pages, created 6,896 match-player rows, and built 694 season-player aggregate rows.
- It matched 29 World Cup roster rows: 7 Korea Republic and 22 Qatar.
- 27 roster matches are high-confidence name-and-club matches; 2 are review-only.
- This filled the two countries left uncovered by the ESPN summary pass.

Non-English/official checks:

- K League official player rank page: `https://www.kleague.com/record/player.do?leagueId=1`.
- K League official data portal link found on the same site: `https://data.kleague.com`.
- QSL official league page: `https://qsl.qa/en/qatar-stars-league-20252026`.
- QSL news/league page: `https://qsl.qa/en/doha-bank-stars-league`.
- FootyStats Korea/Qatar player and dataset pages were found as backup candidate sources.

Risk:

- OneFootball is a reputable public football app/source, but the import uses undocumented public web/app endpoints.
- Minutes are estimated from lineup and substitution clocks.
- Official K League and QSL sources should be used as cross-checks where complete tables or APIs can be identified.
- Review-only name matches must not drive recommendations before manual checking.

Verdict:

- OneFootball is the best practical fill source for Korea Republic and Qatar found in this pass.
- Keep it as a supplemental layer and merge it into `playerPerformance.json` only after source-priority and estimated-minute rules are added.

### OneFootball Broad Coverage Probe

Output file:

- `data/oneFootballLeagueCoverageProbe.json`

Value:

- Tested 32 target leagues that overlap with our World Cup data engine needs.
- Found usable OneFootball competitions for 30 of them.
- For all 30 found competitions, match feeds, league-stat endpoint checks, standings endpoint checks, sample match pages, confirmed lineups, and match events were available.
- Team match-stat widgets were present in 26 of the 30 found competitions.
- This makes OneFootball a strong complement layer for starts, substitute appearances, estimated minutes, goals, assists, cards, team standings, and match-context validation.

Missing or weak:

- Ghanaian Premier League and Nigerian Professional League were not found in the OneFootball search/API probe.
- Brazil, Costa Rica, Ecuador, Norway, Paraguay, Sweden, and Uruguay had empty league-stat leaderboard groups, although their match feeds and match-page lineup/event data worked.
- Costa Rica, Korea Republic, Paraguay, and Uruguay did not expose team match-stat widgets in the sampled match page.

Verdict:

- OneFootball should be added to the merge strategy for all usable leagues.
- It should not replace stronger exact feeds, but it can complement them and improve confidence across the roster pool.

### OneFootball Broad Complement Import

Output files:

- `data/oneFootballAllImportReport.json`
- `data/oneFootballAllLeagueStats.json`
- `data/oneFootballAllSeasonPlayerStats.json`
- `data/oneFootballAllRosterMatches.json`
- `data/oneFootballAllRosterMatchPlayerStats.json`

Value:

- Imported 30 usable OneFootball leagues from the broad coverage probe.
- Parsed 6,941 full-time match pages with zero failures.
- Built 15,689 all-player season aggregates.
- Kept 18,127 match-level rows for World Cup roster-matched players.
- Matched 801 World Cup roster season rows, including 733 high-confidence name-and-club matches.
- Added starts, substitute appearances, estimated minutes, goals, assists, cards, clean-sheet appearances, goals conceded while appearing, team standings context, and team/opponent match-stat totals.

Risk:

- OneFootball is supplemental, not a final source of truth.
- Minutes are estimated from lineup/substitution timing.
- Review-only rows should not drive recommendations until checked.
- Ghana, Iraq, and Jordan were not matched in this OneFootball layer.

Verdict:

- This is now the broadest player-performance complement layer in the data folder.
- Use it in the next merged player-performance build with clear source priority.

### OneFootball World Cup Qualifier Supplement

Output files:

- `data/oneFootballNationalTeamMatchProbe.json`
- `data/oneFootballQualifierImportReport.json`
- `data/oneFootballQualifierRosterSeasonStats.json`
- `data/oneFootballQualifierRosterMatchStats.json`
- `data/playerNationalTeamPerformance.json`
- refreshed embedded profiles in `data/playerPerformance.json`

Value:

- Found OneFootball competition feeds for all six World Cup qualifying paths: UEFA, OFC, CONCACAF, CAF, AFC, and CONMEBOL.
- Imported 911 qualifier matches with zero match-page failures.
- Parsed 27,852 match-player rows and retained 5,181 World Cup roster-player match rows.
- Built 852 roster-player qualifier aggregates.
- Added qualifier starts for 765 players, minutes for 849 players, and goal involvements for 455 players.
- Improved national-team usage coverage to 913 roster players with some qualifier stat signal.
- Matched 45 World Cup roster countries; Canada, Mexico, and USA are expected misses because they auto-qualified as hosts.

Risk:

- OneFootball qualifier minutes are estimated from lineup and substitution clocks.
- A missing OneFootball row can mean no appearance, display-name mismatch, or a parse/matching gap.
- Official UEFA public stats should remain the stronger source where already present.

Verdict:

- This is the best current source for broad national-team qualifier usage outside UEFA.
- It is now attached to every row in `playerNationalTeamPerformance.json` through `onefootball_qualifier_profile` and `best_available_qualifier_stats_v0`.

### FootyStats Dataset and API Path

URLs:

- `https://footystats.org/portugal/liga-nos/datasets`
- `https://footystats.org/belgium/pro-league/datasets`
- `https://footystats.org/poland/ekstraklasa/datasets`
- `https://footystats.org/greece/super-league/datasets`
- `https://footystats.org/usa/mls/datasets`
- `https://footystats.org/brazil/serie-a/datasets`
- `https://footystats.org/argentina/primera-division/datasets`
- `https://footystats.org/api/documentations/player-individual`

Value:

- Current dataset metadata was available for all seven target leagues.
- Player CSV row counts seen in the test: Portugal 644, Belgium 555, Poland 627, Greece 516, MLS 814, Brazil 712, Argentina 954.
- Match CSV row counts seen in the test: Portugal 306, Belgium 313, Poland 306, Greece 236, MLS 510, Brazil 380, Argentina 495.
- The player API documentation lists many useful fields, including goals, assists, cards, starts, sub appearances, xG, xA, shots, dribbles, tackles, interceptions, saves, and per-90 percentiles.

Risk:

- Current CSV downloads redirected to Premium in the automated test.
- The JSON player endpoint requires an API key.
- Use only if access is approved and credentials are kept out of the repo.

Verdict:

- Strongest broad full-data candidate across all seven leagues, including Poland.
- Not imported yet because the full current data requires access.

### Excel4Soccer

URLs:

- `https://www.excel4soccer.com/download/soccer-stats-in-excel-liga-portugal/`
- `https://www.excel4soccer.com/download/soccer-stats-in-excel-belgian-pro-league/`

Value:

- Workbook pages exist for Portugal and Belgium.
- The related articles say the workbooks include player statistics, rosters, team stats, lineups, match plays, tables, and fixtures.
- The articles say the primary source is ESPN's sports data API.

Risk:

- The automated HTML test saw locked WordPress Download Manager links.
- Workbook freshness and sheet structure still need direct download verification.

Verdict:

- Good validation path for Portugal and Belgium if direct workbook access works.
- Also hints that ESPN match and lineup APIs may be worth reverse-engineering for fuller imports.

## Recommended Next Import Order

1. Add a `sourceBackfillStatus` section showing which source filled each field.
2. Build a first ESPN leaderboard importer for Portugal, Belgium, Greece, MLS, Brazil, and Argentina.
3. Add a Poland-specific source path, starting with FootyStats access or another Ekstraklasa public source.
4. Find a current Bundesliga fantasy/stat source because StatBunker only exposed 24/25 Bundesliga in this pass.
5. Improve Ligue 1 starts/clean-sheet coverage because StatBunker 25/26 was partial.
6. Test LaLiga Fantasy API only if credentials are available and usage is acceptable.
7. Test Kickbase only if credentials are available and usage is acceptable.
8. Test Serie A Fantamaster/Fantacalcio endpoints.
9. Test MPG only if credentials are available and Ligue 1 coverage is confirmed.

## Data Policy

- Do not import private fantasy-league data.
- Do not store credentials in the repo.
- Prefer source-backed public league/player stats over logged-in fantasy-game APIs.
- Logged-in APIs can be used for research only if the user explicitly approves and credentials are stored outside the project.
- If the same stat exists in multiple sources, keep source attribution per field.
