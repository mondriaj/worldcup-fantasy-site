# Official Fantasy Rules Collection Report v1

Generated: 2026-06-02

## Scope

This report documents the official FIFA World Cup 2026 Fantasy rules collected for `data/imports/officialFantasyRules.json`.

The collection is for official-data preparation only. It does not promote rules into active model inputs, does not update `fantasyRules.json`, does not update `fantasyRulesData.js`, and does not rerun recommendations, Team Builder, captain tools, substitution tools, browser-ready files, or UX.

## Sources Used

| source_id | source_type | url | checked_at | fields used | confidence | notes |
| --- | --- | --- | --- | --- | --- | --- |
| fifaFantasyHelpPagesJson | official_fantasy_rules | https://play.fifa.com/json/fantasy/help_pages.json | 2026-06-02 | squad, lineup, formations, budget, country limits, captain, substitutions, transfers, boosters, scoring, lockout text | official | Public FIFA Play help-pages JSON. English `how_to_play` entry id 793 contains the detailed rules used for this import. Response `Last-Modified`: 2026-05-29T09:05:39Z. |
| fifaFantasyRoundsJson | official_fantasy_deadlines | https://play.fifa.com/json/fantasy/rounds.json | 2026-06-02 | fantasy round ids, status, start dates, end dates | official | Public FIFA Play rounds JSON. Used for round-level lock references because the help page says transfers use fixed round lockout. Response `Last-Modified`: 2026-06-01T12:01:04Z. |
| fifaFantasyLaunchArticle | official_fantasy_rules | https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/world-cup-fantasy-game-launched | 2026-06-02 | high-level corroboration for squad, budget, country limits, transfers, boosters, scoring areas | official | Official FIFA launch article. Used as corroborating context only; detailed values come from the FIFA Play help-pages JSON. |
| fifaFantasyLanguageJson | official_fantasy_rules | https://play.fifa.com/json/langs/fantasy/en.json | 2026-06-02 | app labels, modal text, scoring labels, booster labels, transfer penalty text | official | Public FIFA Play language JSON. Used to corroborate app-facing labels and modal copy. Response `Last-Modified`: 2026-06-02T12:00:51Z. |

## Sections Completed

| section | status | source-backed values |
| --- | --- | --- |
| Squad | complete | 15 players: 2 GK, 5 DEF, 5 MID, 3 FWD |
| Starting lineup | complete | 11 active players, 4 bench players, default 4-4-2 |
| Allowed formations | complete | 4-4-2, 4-3-3, 4-5-1, 3-4-3, 3-5-2, 5-4-1, 5-3-2 |
| Budget | complete | Initial $100m, knockout increase +$5m, fixed player prices |
| Country limits | complete | Group/Round of 32 max 3; Round of 16 max 4; quarter-final max 5; semi-final max 6; final max 8 |
| Captain and vice-captain | complete for import | Captain required, vice-captain required, captain multiplier 2x, live-round change rules imported |
| Substitutions | complete for import | Pre-lock unlimited substitutions, manual live-round substitutions, automatic substitution conditions, lock definitions |
| Transfers | complete | Free transfer allocations by stage, group-stage carryover rule, -3 point extra-transfer penalty |
| Boosters | mostly complete | Wildcard, 12th Man, Maximum Captain, Qualification Booster, Mystery Booster placeholder rules, one-use/no-stacking rules |
| Scoring | complete | 26 official scoring categories with point values |
| Deadlines and lock windows | complete for current public sources | 8 round start/end timestamps from official rounds feed plus fixed/rolling lock text from official help page |

## Scoring Import Summary

The import includes numeric point values for:

- All-player actions: appearance, assist, cards, own goal, winning/conceding penalties.
- Goalkeeper scoring: clean sheet, goals conceded, goal scored, penalty save, saves.
- Defender scoring: clean sheet, goals conceded, goal scored.
- Midfielder scoring: clean sheet, goal scored, tackles, chances created.
- Forward scoring: goal scored, shots on target.
- Bonus scoring: direct free-kick goal bonus and scouting bonus.

No scoring point values were inferred from the prior draft rules.

## Deadline Handling

The official help page defines fixed transfer lockout and rolling live-round player lockout. The official rounds feed provides round start/end timestamps for all 8 fantasy rounds.

The current import therefore stores round start dates as round-level lock references and keeps a review note that any later FIFA app-specific deadline refinement must be checked before active promotion.

## Differences From Current Draft Rules

This session did not compare or replace every active draft rule mechanically because active promotion is out of scope. Important official values now available for the next promotion session include:

- Official knockout country limits are available by stage.
- Official free transfer allocations are available by stage.
- Official scoring values are available, including goalkeeper, defender, midfielder, forward, and bonus categories.
- Official captain and vice-captain live-round rules are available.
- Official automatic substitution cancellation rules are available.
- Official booster rules are available, except the Mystery Booster effect remains intentionally unresolved until FIFA reveals it.

## Null Or Unresolved Fields

| field | status | blocker |
| --- | --- | --- |
| `boosters.details[mystery_booster].effect` | null | FIFA help page says the Mystery Booster will be revealed once Round 3 locks and Round of 32 opens. Do not invent the effect. |
| app-specific deadline refinements beyond round start/end | review needed | Public sources provide round start/end and lockout rules. If FIFA later publishes separate deadline ids or timezone-specific deadline rows, import them before active promotion. |

## Validation Result

`data/imports/officialFantasyRules.json` is sufficiently complete to run `node scripts/importOfficialFantasyRules.mjs`.

Import status after validation: `imported_needs_manual_review` with 0 errors and 4 warnings. The warnings intentionally preserve review blockers for staged-rule status, the unresolved Mystery Booster effect, and final deadline-semantics confirmation before active promotion.

## Remaining Blockers Before Active Promotion

- Do not promote rules into active `fantasyRules.json` until final squad import and full official-data readiness review are complete.
- Do not update `fantasyRulesData.js` until active rules are intentionally promoted.
- Do not update captain/substitution tools until the official rules are wired into active browser-ready data and tested.
- Do not treat the Mystery Booster effect as known until an official source provides it.
- Confirm whether round start timestamps from the public rounds feed remain the official deadline references immediately before promotion.
