# World Cup Fantasy Helper: Official Data Collection, Player Matching, Model Rerun, and Final Team Builder Roadmap

**Document purpose:** Codex-ready implementation plan for the data-first stage.  
**Primary goal:** collect, validate, reconcile, enrich, and rerun all official-data-dependent models before the UX redesign.  
**Top priority for this stage:** official fantasy data quality and model correctness.  
**Product priority after this stage:** user experience redesign using the official data foundation.  
**Date:** 2026-06-02

---

## 0. Executive Summary

This document defines the first major implementation stage for the World Cup Fantasy Helper revision.

The order should be:

1. Collect official fantasy data.
2. Validate official fantasy rules, players, prices, positions, squads, deadlines, captain rules, and substitution rules.
3. Match every official fantasy player to the existing internal player model when possible.
4. For new or unmatched players, match them to local club context and previous national-team or qualifier data.
5. Create a manual review queue for uncertain matches.
6. Freeze official player identity mapping.
7. Rerun the score predictor only after official squad, player, and availability inputs are reconciled.
8. Rerun player matchday projections.
9. Rerun price, value, finance, risk, captain, and recommendation models.
10. Update the Team Builder to use official prices and official rules.
11. Run full QA.
12. Only then start the full UX redesign.

The site should not keep building on prototype prices, prototype positions, or draft fantasy rules. The existing project docs already say that the project is paused at the official-data gate and that model expansion should wait until official squads, fantasy players, positions, prices, and rules are imported and validated.

---

## 1. Implementation Principles

### 1.1 Official data comes first

Do not redesign or expand these areas until official data is imported and validated:

- Team Builder legality
- player value model
- recommendation rankings
- captain recommendation logic
- substitution decision logic
- budget logic
- position logic
- scoring model
- official game status copy

Small UX-only cleanup is acceptable only if it does not depend on official model outputs.

Examples of safe parallel cleanup:

- moving long methodology text into Model Notes
- renaming labels from “Punts” to “Differentials”
- hiding advanced metrics behind a toggle
- simplifying navigation labels
- adding data status copy that remains accurate

### 1.2 Do not invent official values

Codex must not invent:

- official player IDs
- official prices
- official fantasy positions
- official deadlines
- official scoring rules
- official captain rules
- official substitution rules
- official booster rules
- official final squad status
- injury status
- starting status

If a field is unavailable, keep it null and add it to a review queue.

### 1.3 Source hierarchy

Use this source hierarchy:

1. **Official FIFA fantasy game and official FIFA help/rules pages**
   - authoritative for fantasy prices, player IDs, positions, selectable status, budgets, scoring, deadlines, transfers, boosters, captain rules, and substitution rules

2. **Official FIFA tournament and team pages**
   - authoritative for fixtures, match dates, teams, groups, venue, kickoff times, and final squads where published

3. **Official national federation squad announcements**
   - strong source for final squad status when FIFA squad data is incomplete or delayed

4. **Existing project data**
   - useful for internal IDs, existing roster candidates, previous model fields, PELE team ratings, score prediction inputs, player performance matching, national-team usage, and qualifier context

5. **Reliable football data sources**
   - useful for local club, league, recent club minutes, current club role, and player identity fields if official FIFA data is incomplete

6. **Manual review**
   - required when automated matching is uncertain

Official fantasy fields should never be overwritten by supporting sources. Supporting sources can only enrich non-official context fields.

### 1.4 Preserve version history

Do not overwrite old model files without preserving them.

Keep existing prototype files and create new official-data versions. Recommended names are:

```text
data/playerValueModel_v2.json
data/playerFinanceMetrics_v1.json
data/playerRecommendationInputs_v1.json
data/playerMinutesModel_v1.json
data/scorePredictions_v3.json
data/playerMatchdayProjections_v3.json
data/matchdayRecommendations_v3.json
data/recommendationQa_v3.json
data/recommendationQaReport_v3.md
```

### 1.5 Keep the site static

The site should continue to work on GitHub Pages and local static hosting. Browser-ready data files should still be generated before deployment.

Do not add a runtime API requirement unless explicitly approved later.

---

## 2. Source Inventory and Data Fields

## 2.1 Official fantasy player data

### Required output file

```text
data/imports/officialFantasyPlayers.csv
```

### Required fields

```csv
official_fantasy_player_id,
name,
country,
team_id,
official_fantasy_position,
official_price,
selectable_status,
source_url,
source_checked
```

### Recommended additional fields

```csv
display_name,
first_name,
last_name,
shirt_name,
shirt_number,
club,
date_of_birth,
fifa_player_profile_url,
fantasy_player_url,
position_raw,
price_raw,
country_raw,
team_name_raw,
is_selectable,
is_locked,
source_notes
```

### Field rules

- `official_fantasy_player_id` must be treated as the official game key when available.
- `official_price` must be numeric.
- `official_fantasy_position` must be one of the official position labels.
- `selectable_status` should distinguish selectable, unavailable, removed, doubtful, locked, or unknown if the source supports this.
- Every row must have `source_url` and `source_checked`.
- If the official game only exposes data in a JavaScript app, Codex should work only with accessible public data and user-provided exports. Do not bypass access restrictions.

---

## 2.2 Official final squads

### Required output file

```text
data/imports/officialSquads.csv
```

### Required fields

```csv
name,
country,
team_id,
roster_status,
source_url,
source_checked
```

### Recommended additional fields

```csv
display_name,
fifa_player_id,
club,
club_country,
shirt_number,
official_position,
date_of_birth,
federation_source_url,
squad_announcement_date,
team_squad_complete,
source_notes
```

### Roster status values

Use controlled values:

```text
confirmed_final_squad
confirmed_provisional_squad
selectable_fantasy_player
not_in_final_squad
injured_removed
replacement_player
review
unknown
```

### Field rules

- A player can be selectable in the fantasy game before all final squad fields are complete.
- A player can appear in the official final squad but not be selectable in fantasy.
- If final squad status and fantasy selectable status conflict, keep both fields and create a review item.
- Do not mark a team complete unless the source clearly confirms final squad completion.

---

## 2.3 Official fantasy rules

### Required output file

```text
data/imports/officialFantasyRules.json
```

### Required sections

```json
{
  "source": {},
  "squad_rules": {},
  "budget_rules": {},
  "position_rules": {},
  "formation_rules": {},
  "country_limits": {},
  "captain_rules": {},
  "substitution_rules": {},
  "transfer_rules": {},
  "booster_rules": {},
  "scoring_rules": {},
  "deadline_rules": {},
  "stage_rules": {},
  "validation_notes": []
}
```

### Minimum required fields

- squad size
- number of goalkeepers
- number of defenders
- number of midfielders
- number of forwards
- starting XI size
- valid formations
- initial budget
- knockout-stage budget
- per-country limits by stage
- deadline structure
- transfer counts by stage or matchday
- transfer penalty
- captain scoring
- captain change rule
- vice captain rule
- manual substitution rule
- automatic substitution rule
- booster/chip list
- scoring by event
- scoring by position
- source URL
- source checked date

### Rule validation

Rules are not ready until Codex can answer:

- Can the builder form a legal 15-player squad?
- Can the builder form a legal starting XI?
- What is the active budget for each stage?
- What is the per-country limit for each stage?
- How do captain switches work?
- How do bench substitutions work?
- What happens to points after a manual captain or substitution change?
- What are the deadlines?
- Which boosters exist and when are they available?
- How are points scored by position?

---

## 2.4 Fixtures and deadlines

### Existing files to inspect

```text
worldCupData.js
scorePredictionsData.js
matchdayProjectionsData.js
```

### New or updated files to consider

```text
data/officialFixtureSchedule_v1.json
data/officialFantasyDeadlines_v1.json
data/officialMatchdayWindows_v1.json
```

### Required fields

```json
{
  "match_id": "",
  "matchday": "",
  "stage": "",
  "home_team_id": "",
  "away_team_id": "",
  "home_team": "",
  "away_team": "",
  "kickoff_utc": "",
  "kickoff_local": "",
  "venue": "",
  "city": "",
  "source_url": "",
  "source_checked": ""
}
```

### Deadline-specific fields

```json
{
  "deadline_id": "",
  "matchday": "",
  "stage": "",
  "deadline_utc": "",
  "deadline_local": "",
  "deadline_type": "initial_lock | matchday_lock | transfer_deadline | booster_deadline",
  "source_url": "",
  "source_checked": ""
}
```

### Why this matters

Matchday Desk, captain changes, substitution warnings, and saved squad timeline all depend on correct kickoff and deadline context. If live deadlines cannot be verified, the UI should say that users must confirm in the official game.

---

## 2.5 Player identity, club, and qualifier data

This is the most important extension beyond the current official import files.

### New output files

```text
data/mappings/playerIdentityMap_v1.csv
data/review/playerIdentityReviewQueue_v1.csv
data/playerClubContext_v1.csv
data/playerQualifierUsage_v1.csv
data/playerDataCoverageReport_v1.json
```

### `playerIdentityMap_v1.csv`

Purpose: connect official fantasy players to existing internal players and external identifiers.

Recommended fields:

```csv
internal_player_id,
official_fantasy_player_id,
official_name,
normalized_official_name,
country,
team_id,
matched_existing_player_id,
match_status,
match_confidence,
match_method,
matched_name,
matched_country,
matched_club,
matched_dob,
official_fantasy_position,
existing_model_position,
source_url,
source_checked,
review_notes
```

Controlled values for `match_status`:

```text
exact_match
strong_match
manual_confirmed
new_player_created
needs_review
rejected_match
duplicate_candidate
insufficient_data
```

Controlled values for `match_method`:

```text
official_id
exact_name_country
name_country_dob
name_country_club
name_country_position
alias_match
fuzzy_name_country
manual
new_profile
```

### `playerIdentityReviewQueue_v1.csv`

Purpose: list all uncertain or conflicting identity cases.

Recommended fields:

```csv
review_id,
official_fantasy_player_id,
official_name,
country,
team_id,
official_position,
official_price,
candidate_internal_player_ids,
candidate_names,
candidate_clubs,
candidate_positions,
candidate_scores,
reason_for_review,
recommended_action,
review_status,
reviewed_by,
reviewed_at,
final_internal_player_id,
notes
```

Controlled `reason_for_review` values:

```text
no_candidate_found
multiple_candidate_matches
name_conflict
club_conflict
position_conflict
country_conflict
date_of_birth_conflict
duplicate_official_id
missing_official_price
missing_official_position
squad_status_conflict
fantasy_selectable_conflict
```

### `playerClubContext_v1.csv`

Purpose: give every player local club context for role and minutes modeling.

Recommended fields:

```csv
internal_player_id,
official_fantasy_player_id,
name,
country,
current_club,
current_club_country,
current_league,
club_source_url,
club_source_checked,
club_minutes_recent,
club_starts_recent,
club_position_role,
club_role_confidence,
club_data_status,
notes
```

Controlled `club_data_status`:

```text
official_verified
source_verified
existing_project_data
manual_review
missing
not_applicable
```

### `playerQualifierUsage_v1.csv`

Purpose: match fantasy players to previous national-team qualifier and international usage data.

Recommended fields:

```csv
internal_player_id,
official_fantasy_player_id,
name,
country,
qualifier_matches_available,
qualifier_minutes,
qualifier_starts,
qualifier_goals,
qualifier_assists,
qualifier_clean_sheets,
qualifier_cards,
recent_nt_minutes,
recent_nt_starts,
recent_nt_role,
last_nt_start_date,
set_piece_role,
penalty_role,
corner_role,
free_kick_role,
usage_source_url,
usage_source_checked,
usage_confidence,
notes
```

Controlled `usage_confidence`:

```text
high
medium
low
missing
manual_review
```

---

## 3. Data Collection Workflow

## Phase DATA-0: Repository and pipeline audit

### Goal

Understand current data files, scripts, and assumptions before adding official data.

### Tasks

#### DATA-0.1: Read required docs

Codex should read:

```text
README.md
SITE_FEATURES.md
OFFICIAL_DATA_NEXT_STEPS.md
data/officialDataReadiness_v0.md
data/officialFantasyImportPipeline_v0.md
data/officialFantasyRulesImportPipeline_v0.md
data/officialSquadsImportPipeline_v0.md
data/playerValueModel_v1.json
data/squadPortfolioAnalytics_v0.md
data/portfolioOptimizerModel_v0.md
```

#### DATA-0.2: Create a data inventory

Create:

```text
data/dataInventory_officialDataStage_v1.md
```

Include:

- current active model files
- current prototype files
- scripts that generate each file
- browser-ready output files
- files that depend on proxy prices
- files that depend on draft rules
- files that depend on old player IDs
- files that must be regenerated after official import

#### DATA-0.3: Run baseline checks

Run:

```bash
git diff --check
node --check script.js
node --check worldCupPage.js
node scripts/validateOfficialDataReadiness.mjs
```

Also run JSON parsing checks across data files.

#### DATA-0.4: Confirm branch and versioning rule

Recommended branch:

```text
official-data-foundation
```

Acceptance:

- no model file is overwritten without versioning
- current public preview remains recoverable
- data inventory file exists
- readiness status is documented before changes

---

## Phase DATA-1: Official source collection

### Goal

Collect official fantasy players, prices, positions, rules, deadlines, fixtures, and final squad status.

### Tasks

#### DATA-1.1: Collect official fantasy rules

Output:

```text
data/imports/officialFantasyRules.json
```

Minimum sections:

- squad structure
- budget
- positions
- formations
- country limits by stage
- transfers
- captain rules
- substitution rules
- auto-sub rules
- vice captain rules
- boosters/chips
- scoring
- deadlines
- source metadata

Acceptance:

- every required section exists
- each rule has a source reference
- unknown sections are explicitly null and added to review
- draft rules are not treated as official

#### DATA-1.2: Collect official fantasy player list

Output:

```text
data/imports/officialFantasyPlayers.csv
```

Required for every official fantasy player:

- official fantasy player ID
- name
- country
- team ID
- official fantasy position
- official price
- selectable status
- source URL
- source checked date

Acceptance:

- every row has source URL and checked date
- prices parse as numbers
- positions map to official allowed positions
- duplicate official IDs are blocked
- duplicate name-country-position combinations are reviewed
- missing values stay null

#### DATA-1.3: Collect official final squads

Output:

```text
data/imports/officialSquads.csv
```

Acceptance:

- team ID and country mapping are consistent
- each row has source URL and checked date
- teams with complete squads are marked clearly
- teams with incomplete squads are not treated as complete
- replacements and injured removals are represented if source-backed

#### DATA-1.4: Collect official fixture and kickoff schedule

Output:

```text
data/officialFixtureSchedule_v1.json
```

Acceptance:

- 104 World Cup matches are represented if knockout placeholders are included
- group-stage matches have real teams
- kickoff times include UTC
- local time and venue are included if available
- source URL and checked date present

#### DATA-1.5: Collect official fantasy deadlines

Output:

```text
data/officialFantasyDeadlines_v1.json
```

Acceptance:

- initial deadline exists
- matchday deadlines exist if official game defines them
- transfer deadlines exist if separate
- booster deadlines exist if relevant
- any missing deadline is flagged
- Matchday Desk does not claim a deadline unless source-backed

#### DATA-1.6: Create source manifest

Output:

```text
data/officialDataSourceManifest_v1.json
```

Recommended structure:

```json
{
  "created_at": "YYYY-MM-DD",
  "sources": [
    {
      "source_id": "fifa_fantasy_help_v1",
      "source_type": "official_fantasy_rules",
      "url": "",
      "checked_at": "",
      "fields_used": [],
      "confidence": "official",
      "notes": ""
    }
  ],
  "collection_notes": [],
  "known_gaps": []
}
```

Acceptance:

- every official import file links back to this manifest
- known gaps are explicit
- no source is anonymous

---

## Phase DATA-2: Import official data and stop at readiness gate

### Goal

Use the existing import pipelines before any model rerun.

### Tasks

#### DATA-2.1: Import official squads

Run:

```bash
node scripts/importOfficialSquads.mjs
```

Inspect:

```text
data/officialSquadsImportReport_v0.json
```

Acceptance:

- status is `imported_ready_for_readiness_check`
- no unresolved duplicate rows
- review rows exported
- final squad completeness is not overstated

#### DATA-2.2: Import official fantasy players

Run:

```bash
node scripts/importOfficialFantasyPlayers.mjs
```

Inspect:

```text
data/officialFantasyImportReport_v0.json
```

Acceptance:

- official fantasy IDs imported
- official prices imported
- official positions imported
- selectable status imported
- missing prices or positions are blocked or reviewed
- unmatched rows are not ignored

#### DATA-2.3: Import official fantasy rules

Run:

```bash
node scripts/importOfficialFantasyRules.mjs
```

Inspect:

```text
data/officialFantasyRulesImportReport_v0.json
```

Acceptance:

- required rule sections imported
- scoring is complete enough for projections
- captain and substitution rules are complete enough for Matchday Desk
- deadlines are represented or flagged
- source metadata exists

#### DATA-2.4: Run readiness validator

Run:

```bash
node scripts/validateOfficialDataReadiness.mjs
```

Expected output:

```text
ready_for_official_model_rerun
```

Stop if any output says:

```text
awaiting_*
imported_with_errors
imported_needs_manual_review
imported_needs_team_completion_review
blocked_waiting_for_official_fantasy_data
```

Acceptance:

- readiness passes before model reruns
- if readiness fails, Codex reports exact blockers
- no model rerun starts before readiness passes

---

## Phase MATCH-1: Player identity resolution

### Goal

Connect official fantasy players to existing internal players and create new profiles for true new players.

### Why this matters

The model currently uses existing player data, performance matching, national-team usage, and finance-style fantasy metrics. Official fantasy data will introduce new IDs and may include players not in the existing internal dataset. If matching is weak, every downstream output becomes unreliable.

### Matching pipeline

#### Step 1: Normalize names

Create helper functions:

```js
normalizeName(name)
removeDiacritics(name)
normalizeCountry(country)
normalizePosition(position)
normalizeClub(club)
```

Name normalization should handle:

- diacritics
- punctuation
- hyphens
- apostrophes
- multiple spaces
- suffixes
- common abbreviations
- initials
- inverted names
- known display-name aliases

Examples:

```text
Joao Cancelo -> joao cancelo
João Cancelo -> joao cancelo
A. Griezmann -> antoine griezmann, if alias table confirms
Luis Diaz -> luis diaz
Luis Díaz -> luis diaz
```

#### Step 2: Create candidate matches

For every official fantasy player, generate candidate existing players by:

1. exact official ID, if any prior mapping exists
2. exact normalized name + country
3. exact normalized name + team ID
4. normalized name + date of birth
5. normalized name + current club
6. fuzzy name + country + position
7. alias table
8. manual review

#### Step 3: Score candidates

Suggested scoring model:

```text
+0.45 exact normalized name
+0.25 same country/team_id
+0.15 same date of birth
+0.10 same current club
+0.05 same broad position
+0.05 alias match
-0.20 conflicting country
-0.15 conflicting date of birth
-0.10 conflicting club
-0.10 conflicting position group
```

Suggested thresholds:

```text
score >= 0.95: exact_match or strong_match
0.85 <= score < 0.95: needs_review
0.70 <= score < 0.85: weak_candidate_review
score < 0.70: no_candidate_found
```

If multiple candidates are within 0.05 of the top score, send to manual review.

#### Step 4: Resolve duplicates

Duplicate cases to review:

- same official fantasy ID maps to multiple internal players
- same internal player maps to multiple official fantasy IDs
- same name and country appears for different players
- player appears under different spelling in squad and fantasy files
- official position conflicts with existing model position
- club conflict
- date of birth conflict

#### Step 5: Create new player profiles

If no reliable match exists, create a new internal profile.

New profile fields:

```json
{
  "internal_player_id": "generated_stable_id",
  "official_fantasy_player_id": "",
  "name": "",
  "country": "",
  "team_id": "",
  "official_fantasy_position": "",
  "official_price": null,
  "club": null,
  "created_from": "official_fantasy_import",
  "profile_status": "thin_profile",
  "data_quality": "needs_enrichment",
  "source_url": "",
  "source_checked": ""
}
```

Do not assign fake historical performance to a new player. Use team-position priors until real club or qualifier context is matched.

### Outputs

```text
data/mappings/playerIdentityMap_v1.csv
data/review/playerIdentityReviewQueue_v1.csv
data/playerIdentityMatchReport_v1.md
```

### Acceptance criteria

- every official fantasy player has one identity status
- no duplicate official fantasy IDs
- no duplicate final internal mappings unless justified
- all low-confidence cases are in review queue
- all new players are marked as `thin_profile` until enriched
- no downstream model treats `needs_review` as a clean match

---

## Phase MATCH-2: Local club matching

### Goal

Attach current club and league context to every official fantasy player where possible.

### Why this matters

Local club context improves:

- minutes model
- role confidence
- attacking profile
- defensive profile
- set-piece role
- card risk
- recent form
- fallback estimates for new players
- player profile trust

### Club source precedence

1. official FIFA fantasy player profile, if it includes club
2. official FIFA player or squad page
3. official national federation squad page
4. existing project player data
5. reliable football reference source
6. manual review

### Matching fields

```text
official name
normalized name
country
date of birth
club
club country
league
position
source URL
source checked date
```

### Special cases

#### Player recently transferred

Keep both:

```text
current_club
previous_club
club_status = transferred_recently
source_checked
```

Do not mix old club minutes with new club role without marking context.

#### Free agent

Use:

```text
current_club = null
club_status = free_agent
```

#### Domestic league with sparse data

Use national-team usage more heavily.

#### Goalkeepers

Prioritize starts and clean sheet context over attacking metrics.

#### Young or uncapped player

Use club role and team-position priors. Flag as high uncertainty.

### Output

```text
data/playerClubContext_v1.csv
data/playerClubContextReport_v1.md
```

### Acceptance criteria

- every official fantasy player has a club context status
- missing club is explicit, not silent
- conflicting club fields go to review
- recent transfer status is flagged
- club context is not treated as official fantasy data

---

## Phase MATCH-3: Previous country qualifier and national-team usage matching

### Goal

Attach prior national-team usage to each player.

### Why this matters

World Cup fantasy value depends heavily on national-team role, not only club ability. A star club player who rarely starts for his country may be less useful than a stable national-team starter.

### Usage fields

Use the best available national-team and qualifier data.

Recommended fields:

```text
qualifier_matches
qualifier_starts
qualifier_minutes
qualifier_goals
qualifier_assists
qualifier_cards
recent_friendly_minutes
recent_friendly_starts
recent_competitive_minutes
recent_competitive_starts
last_5_nt_matches_minutes
last_5_nt_starts
last_10_nt_matches_minutes
last_10_nt_starts
role_label
role_confidence
set_piece_role
penalty_role
corner_role
free_kick_role
source_url
source_checked
```

### Role labels

```text
locked_starter
likely_starter
rotation_starter
impact_sub
backup
third_choice
squad_depth
unclear
new_callup
```

### Role confidence

```text
high
medium
low
missing
```

### Matching process

1. Match official fantasy player to existing national-team usage records by internal player ID.
2. If not found, match by normalized name + country.
3. If still not found, match by name + club + country.
4. If no usage exists, mark `usage_confidence = missing`.
5. If the player is in the official fantasy game but has no national-team usage, create a fallback estimate from:
   - team strength
   - official fantasy price
   - position
   - final squad role if known
   - club role
   - manual review notes

### Output

```text
data/playerQualifierUsage_v1.csv
data/playerNationalTeamUsageReport_v1.md
```

### Acceptance criteria

- every player has a national-team usage status
- players with no qualifier history are not silently treated as average
- existing country qualifier data is preserved
- new players get explicit thin-profile fallback logic
- role confidence is visible to QA and Player Profile

---

## Phase MATCH-4: Player data coverage and review lock

### Goal

Know exactly how complete the player data is before model reruns.

### Output

```text
data/playerDataCoverageReport_v1.json
data/playerDataCoverageReport_v1.md
```

### Coverage metrics

Track:

- total official fantasy players
- matched to existing internal player
- new player profiles created
- players with current club
- players with qualifier usage
- players with high role confidence
- players with missing price
- players with missing position
- players with missing club
- players with missing national-team usage
- players in manual review
- players blocked from model rerun
- players allowed with thin-profile fallback

### Acceptance thresholds

Suggested thresholds before official model rerun:

```text
100% official fantasy players have official price or explicit blocker
100% official fantasy players have official position or explicit blocker
100% official fantasy players have identity status
0 duplicate official fantasy IDs
0 unresolved high-risk identity conflicts
>= 90% players matched to either existing data or club/usage enrichment
100% unmatched players have thin-profile fallback
100% review items have status
```

If a threshold fails, stop and report.

---

## 4. Official Rules Model

## Phase RULES-1: Formalize official game rules

### Goal

Turn the official fantasy rules into a machine-readable contract.

### Output

```text
data/officialFantasyRules_v1.json
data/officialFantasyRulesValidationReport_v1.md
```

### Rule contract sections

#### Squad structure

```json
{
  "squad_size": 15,
  "positions": {
    "GK": 2,
    "DEF": 5,
    "MID": 5,
    "FWD": 3
  },
  "starting_xi_size": 11
}
```

#### Formation rules

```json
{
  "valid_formations": [
    {"GK": 1, "DEF": 4, "MID": 4, "FWD": 2},
    {"GK": 1, "DEF": 4, "MID": 3, "FWD": 3},
    {"GK": 1, "DEF": 4, "MID": 5, "FWD": 1}
  ]
}
```

Codex must fill this from official rules only.

#### Budget rules

```json
{
  "group_stage_budget": 100.0,
  "knockout_budget": 105.0,
  "price_changes": false
}
```

Codex must verify exact values from official sources.

#### Country limits

```json
{
  "group_stage": 3,
  "round_of_32": 3,
  "round_of_16": 4,
  "quarter_final": 5,
  "semi_final": 6,
  "final": 8
}
```

Codex must verify exact values from official sources.

#### Captain rules

```json
{
  "captain_multiplier": 2,
  "manual_captain_change_allowed": true,
  "new_captain_must_not_have_played": true,
  "old_captain_points_lost_after_switch": true,
  "vice_captain_rule": "",
  "source_url": "",
  "source_checked": ""
}
```

#### Substitution rules

```json
{
  "manual_substitution_allowed": true,
  "incoming_player_must_not_have_played": true,
  "manual_substitution_irreversible": true,
  "auto_sub_rule": "",
  "valid_formation_required": true,
  "source_url": "",
  "source_checked": ""
}
```

#### Transfer rules

```json
{
  "pre_tournament": "unlimited",
  "before_md2": 2,
  "before_md3": 2,
  "before_round_of_32": "unlimited",
  "before_round_of_16": 4,
  "before_quarter_final": 4,
  "before_semi_final": 5,
  "before_final": 6,
  "additional_transfer_penalty": -3
}
```

Codex must verify exact transfer values from official sources.

#### Booster rules

```json
{
  "boosters": [
    {
      "id": "",
      "name": "",
      "description": "",
      "availability": "",
      "source_url": "",
      "source_checked": ""
    }
  ]
}
```

#### Scoring rules

Scoring should be exact and position-specific.

Example structure:

```json
{
  "all_players": {
    "appearance_under_60": null,
    "appearance_60_plus": null,
    "assist": null,
    "yellow_card": null,
    "red_card": null,
    "own_goal": null
  },
  "goalkeepers": {},
  "defenders": {},
  "midfielders": {},
  "forwards": {},
  "bonus": {}
}
```

Do not fill a scoring field unless source-backed.

### Acceptance criteria

- all required rule sections exist
- scoring rules are machine-readable
- team builder can read squad, budget, country, position, and formation rules
- captain and substitution tools can read official rule flags
- the current draft `fantasyRules.json` is no longer the active source once official rules pass validation
- old draft rules remain preserved for audit

---

## 5. Model Rerun Roadmap

## 5.1 Current model chain

The current chain is approximately:

```text
team data
fixtures
roster candidates
player performance matching
national-team usage
PELE team ratings
score predictor
matchday player projections
finance metrics
recommendations
Team Builder
portfolio analytics
captain/substitution tools
browser-ready files
```

After official data import, the new chain should be:

```text
official squads
official fantasy players
official prices
official positions
official rules
official fixture/deadline data
player identity map
club context
qualifier usage
team-quality update
score predictions v3
player matchday projections v3
official player value model v2
official finance metrics v1
recommendations v3
captain model v1
Team Builder official optimizer v1
portfolio analytics official v1
browser-ready files
site QA
```

---

## Phase MODEL-1: Create official player model inputs

### Goal

Create one clean file that combines official fantasy data with identity, club, qualifier, role, and team context.

### Output

```text
data/playerRecommendationInputs_v1.json
```

### Required fields per player

```json
{
  "internal_player_id": "",
  "official_fantasy_player_id": "",
  "name": "",
  "country": "",
  "team_id": "",
  "official_fantasy_position": "",
  "official_price": null,
  "selectable_status": "",
  "roster_status": "",
  "current_club": "",
  "current_league": "",
  "match_status": "",
  "match_confidence": null,
  "role_label": "",
  "role_confidence": "",
  "qualifier_minutes": null,
  "qualifier_starts": null,
  "recent_nt_minutes": null,
  "recent_nt_starts": null,
  "club_minutes_recent": null,
  "club_starts_recent": null,
  "set_piece_role": "",
  "penalty_role": "",
  "data_quality_flags": [],
  "source_summary": []
}
```

### Data quality flags

Use controlled flags:

```text
identity_review
thin_profile
missing_club
missing_qualifier_usage
missing_recent_minutes
position_conflict
squad_status_conflict
low_role_confidence
new_callup
injury_review
price_outlier
role_rotation_risk
```

### Acceptance criteria

- every selectable official fantasy player has a model input row
- all rows have official position and official price
- all rows have identity status
- every data gap is represented by a flag
- no prototype price is used as active price

---

## Phase MODEL-2: Improve minutes and role model

### Goal

Estimate start probability and expected minutes using official squads plus club and national-team evidence.

### Output

```text
data/playerMinutesModel_v1.json
data/playerMinutesModelReport_v1.md
```

### Inputs

- official squad status
- selectable status
- official fantasy position
- qualifier minutes
- recent national-team starts
- recent national-team role
- club minutes
- club starts
- current club role
- injury or availability flags
- team strength
- fixture difficulty
- rotation risk
- match importance
- player price as weak signal only

### Suggested logic

#### Start probability tiers

```text
locked_starter: 0.80 to 0.95
likely_starter: 0.65 to 0.80
rotation_starter: 0.45 to 0.65
impact_sub: 0.20 to 0.45
backup: 0.05 to 0.25
third_choice: 0.00 to 0.10
unclear: team-position prior
```

#### Expected minutes

```text
expected_minutes = start_probability * starter_minutes_mean
                 + (1 - start_probability) * substitute_minutes_mean
```

Position and role should adjust the means:

- goalkeepers are usually 90 if starting
- central defenders are more likely to play 90
- attacking mids and forwards have more substitution risk
- players returning from injury get reduced minutes
- rotation-heavy teams get lower confidence

### Special cases

#### No national-team usage but high official price

Use club role and official price as a signal, but flag:

```text
thin_profile
low_role_confidence
```

#### Strong national-team role but low club minutes

Do not over-penalize if the player is a country starter.

#### Strong club role but weak national-team role

Do not overrate. National-team role matters more.

#### Goalkeeper backups

Use strong penalty. Backup goalkeepers usually have low expected points unless confirmed starter.

### Acceptance criteria

- start probability is numeric for every selectable player
- expected minutes is numeric for every selectable player
- role confidence exists for every player
- all low-confidence players are flagged
- top recommendations are not dominated by players with low start probability unless intentionally in Differential mode

---

## Phase MODEL-3: Improve score predictor to v3

### Goal

Update team and match environment predictions using official squad context.

### Output

```text
data/scorePredictions_v3.json
data/scorePredictionQa_v3.json
data/scorePredictionQaReport_v3.md
```

### Inputs

- PELE team ratings
- official squads
- player availability
- projected starting strength
- team attacking quality
- team defensive quality
- fixture venue if relevant
- group-stage context
- team-level injury or suspension flags
- prior scorePredictions_v2 for comparison

### What should improve from v2

#### 1. Squad-aware team strength

Adjust team strength where official squads materially change expected quality.

Examples:

- star attacker missing
- first-choice goalkeeper missing
- defensive core missing
- several starters injured or unavailable
- unusually young or experimental squad

#### 2. Position-group adjustments

Create team-level components:

```text
attack_strength_adjustment
midfield_strength_adjustment
defense_strength_adjustment
goalkeeper_strength_adjustment
availability_adjustment
```

#### 3. Clean-sheet calibration

Defender and goalkeeper projections need clean-sheet probabilities. QA should specifically check whether clean-sheet probabilities are plausible and bounded.

#### 4. Low-score calibration

If time allows, add a conservative draw/low-score adjustment. The README already notes future calibration with a Dixon-Coles-style adjustment after the roster-weighted model is stable.

#### 5. Upset risk

Keep upset risk because it is useful for fixture interpretation and stack warnings.

### Score prediction output fields

```json
{
  "match_id": "",
  "matchday": "",
  "home_team": "",
  "away_team": "",
  "home_expected_goals": null,
  "away_expected_goals": null,
  "home_win_probability": null,
  "draw_probability": null,
  "away_win_probability": null,
  "home_clean_sheet_probability": null,
  "away_clean_sheet_probability": null,
  "goal_environment": "",
  "upset_risk": "",
  "favorite": "",
  "team_quality_version": "team_quality_v3",
  "source_model_version": "score_predictor_v3",
  "qa_flags": []
}
```

### QA checks

- all group-stage fixtures covered
- probabilities sum to approximately 1
- probabilities are between 0 and 1
- expected goals are non-negative
- clean-sheet probabilities are between 0 and 1
- favorites are consistent with probabilities
- PELE coverage is complete
- official squad adjustment is documented
- v3 changes from v2 are explained
- no extreme outputs without QA flag

### Acceptance criteria

- v3 outputs exist
- v2 is preserved
- QA report exists
- player matchday projection script consumes v3
- no score prediction is treated as betting advice
- Match Environment or Fixture Outlook uses clear model language

---

## Phase MODEL-4: Rerun player matchday projections

### Goal

Generate player-level expected points by matchday using official prices, official positions, improved minutes, and v3 score predictions.

### Output

```text
data/playerMatchdayProjections_v3.json
data/playerMatchdayProjectionReport_v3.md
```

### Inputs

- official player position
- official price
- expected minutes
- start probability
- team fixture
- score prediction v3
- clean-sheet probability
- player attacking profile
- player defensive/scoring profile
- set-piece role
- penalty role
- card risk
- role confidence
- data-quality flags

### Position-specific projection logic

#### Goalkeepers

Drivers:

- start probability
- expected minutes
- clean-sheet probability
- saves expectation
- goals conceded risk
- penalty save probability if modeled
- card risk

#### Defenders

Drivers:

- start probability
- expected minutes
- clean-sheet probability
- goals conceded risk
- attacking threat
- set-piece role
- card risk

#### Midfielders

Drivers:

- start probability
- expected minutes
- goal involvement
- assists
- chances created
- tackles if scoring rules reward them
- clean-sheet points if official rules reward midfielders
- card risk

#### Forwards

Drivers:

- start probability
- expected minutes
- goals
- assists
- shots on target if scoring rules reward them
- penalty role
- card risk

### Projection output fields

```json
{
  "internal_player_id": "",
  "official_fantasy_player_id": "",
  "name": "",
  "country": "",
  "official_fantasy_position": "",
  "official_price": null,
  "matchday": "",
  "opponent": "",
  "expected_minutes": null,
  "start_probability": null,
  "raw_expected_points": null,
  "risk_adjusted_points": null,
  "ceiling_points": null,
  "floor_points": null,
  "captain_score": null,
  "clean_sheet_component": null,
  "attacking_component": null,
  "appearance_component": null,
  "bonus_component": null,
  "card_risk_component": null,
  "fixture_context": {},
  "data_quality_flags": []
}
```

### Acceptance criteria

- every selectable fantasy player has MD1, MD2, and MD3 projection rows where group fixtures exist
- players with missing usage are projected conservatively
- low-minutes players are not over-ranked in Safe mode
- captain score is available for captain recommendations
- projection report identifies outliers and data gaps

---

## Phase MODEL-5: Official price, value, and finance metrics

### Goal

Replace proxy prices with official prices and generate fantasy finance metrics.

### Outputs

```text
data/playerValueModel_v2.json
data/playerFinanceMetrics_v1.json
data/playerFinanceMetricsReport_v1.md
```

### Inputs

- official price
- official position
- expected points
- risk-adjusted points
- expected minutes
- start probability
- volatility proxy
- downside floor
- role confidence
- data-quality flags
- fixture quality

### Required metrics

#### Simple metrics

```text
expected_points
points_after_risk
value_score
price_tier
risk_label
upside_label
minutes_risk
data_check_label
```

#### Finance metrics

```text
risk_adjusted_return
volatility
downside_risk
bad_week_floor
stress_case_floor
var_floor
cvar_floor
country_concentration_input
fixture_concentration_input
premium_squeeze_input
```

### Price tiers

Suggested:

```text
premium
upper_mid
mid_price
budget
ultra_budget
```

These should be calculated by position because pricing differs by position.

### Risk labels

```text
Safe
Balanced
Upside
Differential
Boom-or-Bust
Avoid Unless Chasing
```

### Acceptance criteria

- no active metric uses `proxy_price_v1` as active price
- official price appears in every active value calculation
- proxy price remains only as an audit comparison field
- value rankings are position-aware
- top value picks pass QA
- finance metrics preserve the portfolio identity

---

## Phase MODEL-6: Recommendation engine v3

### Goal

Create official-data recommendations for Top Picks, Captain Alpha, Pick Explorer, and Differentials.

### Output

```text
data/matchdayRecommendations_v3.json
data/recommendationQa_v3.json
data/recommendationQaReport_v3.md
```

### Recommendation modes

Use internal modes:

```text
balanced
safe
upside
differential
captain
```

Map to user labels:

```text
Balanced
Safe
Upside
Differential
Captain Alpha
```

### Balanced mode

Prioritize:

- expected points
- start probability
- official price value
- role confidence
- fixture context
- moderate upside
- moderate risk control

### Safe mode

Prioritize:

- start probability
- expected minutes
- role confidence
- low data-quality flags
- lower downside risk
- stable returns

### Upside mode

Prioritize:

- ceiling points
- attacking involvement
- goal environment
- captain potential
- acceptable minutes risk

### Differential mode

Prioritize:

- lower obviousness
- upside
- price value
- less standard picks
- clear risk warnings

Do not let Differential mode become a list of weak players. It should be “less obvious but defensible,” not “bad picks.”

### Captain Alpha

Prioritize:

- high expected points
- high ceiling
- high start probability
- strong fixture
- penalty/set-piece role
- team favorite status
- role confidence
- not already played, where matchday context is used

### QA checks

- top 20 by mode
- top 10 by position
- top captain candidates
- low-start-probability warnings
- missing-data warnings
- price outliers
- position distribution
- country concentration in recommendations
- fixture concentration
- duplicate players
- official price coverage
- official position coverage

### Acceptance criteria

- recommendations use official prices and positions
- old v2 recommendations are preserved
- v3 recommendations are browser-ready
- QA report explains major changes from v2
- no player with unresolved identity review appears in main Top Picks
- thin-profile players can appear only with clear Data Check flags

---

## Phase MODEL-7: Team Builder official optimizer

### Goal

Make Team Builder create legal, useful official fantasy squads.

### Output files

```text
data/teamBuilderModelOfficial_v1.md
data/teamBuilderQa_v1.json
data/teamBuilderQaReport_v1.md
```

Browser behavior should consume:

```text
financePlayersData.js
fantasyRulesData.js
matchdayProjectionsData.js
```

### Official constraints

Team Builder must enforce:

- official squad size
- official position counts
- official budget
- official country limit by stage
- official player prices
- official fantasy positions
- selectable status
- valid starting XI formations
- captain and vice captain eligibility
- bench order rules where relevant

### Objective functions

Keep multiple strategies, but make them consistent:

#### Balanced objective

```text
maximize total risk-adjusted expected points
+ value score
+ captain option coverage
- concentration risk
- data quality penalty
- minutes risk penalty
```

#### Safe objective

```text
maximize start probability and expected minutes
+ risk-adjusted points
+ floor
- role uncertainty
- data quality penalty
- thin-profile penalty
```

#### Upside objective

```text
maximize ceiling
+ captain upside
+ attacking/clean-sheet environment
+ value
- extreme non-start risk
```

#### Differential objective

```text
maximize upside and value among less obvious players
+ lower concentration in obvious teams
- weak projection penalty
- severe minutes risk penalty
```

### Portfolio-aware adjustments

Squad-level metrics should influence final selection:

- expected total points
- points after risk
- bad-week floor
- stress-case floor
- country stack risk
- fixture stack risk
- budget pressure
- captain coverage
- bench optionality
- data-check load

### Team Builder output

Each built squad should include:

```json
{
  "model_version": "team_builder_official_v1",
  "rules_version": "officialFantasyRules_v1",
  "data_version": "official_fantasy_data_v1",
  "strategy": "balanced",
  "budget_used": null,
  "budget_remaining": null,
  "country_limit_status": {},
  "position_counts": {},
  "starters": [],
  "bench": [],
  "captain": null,
  "vice_captain": null,
  "portfolio_metrics": {},
  "optimizer_warnings": [],
  "data_quality_flags": []
}
```

### Builder failure states

If no squad can be built, show precise cause:

```text
budget_too_tight
too_many_locked_players_same_country
too_many_locked_players_same_position
locked_player_unavailable
position_pool_too_small
min_start_probability_too_strict
expected_minutes_filter_too_strict
data_check_limit_too_strict
country_limit_blocks_solution
```

### One-click fixes

Offer:

- clear one locked player
- relax start probability
- relax expected minutes
- allow one data-check player
- increase risk tolerance
- switch to Balanced
- reset filters

### Acceptance criteria

- Team Builder creates a legal official 15-player squad
- budget is official
- positions are official
- country limits are official
- proxy prices are not active
- all locked players are validated
- imported old prototype squads show migration warning
- Squad Risk Report reflects official data
- exported JSON includes official data versions
- no invalid squad is labeled legal

---

## Phase MODEL-8: Captain and substitution decision logic

### Goal

Make matchday decision tools rule-aware using official captain and substitution rules.

### Outputs

```text
data/captainChangeAdvisorModel_v1.md
data/substitutionAdvisorModel_v1.md
data/matchdayDecisionRules_v1.json
```

### Captain switch logic

Inputs:

- current captain
- current captain raw points
- replacement candidate
- replacement not yet played
- current matchday
- strategy: Safe, Balanced, Chase
- official captain rules
- replacement projection
- replacement start probability
- fixture context
- data-quality flags

Outputs:

```text
Keep captain
Switch if chasing
Switch looks attractive
Do not switch
Manual official-game check required
```

### Conservative rule

Keep the current design principle:

- Strong captain scores should usually be kept.
- A 12+ raw captain score should usually lead to keep unless user explicitly chooses a chase mode.

### Substitution logic

Inputs:

- played starter
- starter points
- unplayed bench player
- official substitution rule
- formation validity
- replacement projection
- replacement start probability
- data-quality flags

Outputs:

```text
Keep starter
Switch looks reasonable
Switch only if chasing
Manual formation check required
Do not switch
```

### Acceptance criteria

- manual points entry remains
- no tool claims to know live scores unless live feed is added later
- no tool claims to know official played/unplayed status unless source-backed
- captain and substitution rules match official rules
- strong captain scores remain conservative
- imported decisions show rerun warning

---

## Phase MODEL-9: Browser-ready data refresh

### Goal

Regenerate static browser files after official-data models pass QA.

### Files to regenerate

```text
playersData.js
financePlayersData.js
fantasyRulesData.js
scorePredictionsData.js
matchdayProjectionsData.js
```

Potential new browser-ready files:

```text
officialDataStatusData.js
teamBuilderQaData.js
playerIdentityCoverageData.js
```

### Acceptance criteria

- homepage loads without runtime fetch
- Picks render using official v3 data
- Player Profiles show official fields
- Team Builder uses official rules
- Squad Risk Report uses official prices
- Matchday Desk uses official decision rules
- World Cup Guide uses official fixture/deadline data where applicable
- no console errors

---

## 6. QA and Validation Plan

## 6.1 Static checks

Run:

```bash
git diff --check
node --check script.js
node --check worldCupPage.js
node scripts/validateOfficialDataReadiness.mjs
```

Run JSON parse checks across all JSON files.

Suggested command:

```bash
find data -name "*.json" -print0 | xargs -0 -n1 node -e "const fs=require('fs'); JSON.parse(fs.readFileSync(process.argv[1],'utf8')); console.log(process.argv[1])"
```

## 6.2 Data QA checks

Create reports for:

```text
data/officialFantasyImportReport_v1.json
data/officialSquadsImportReport_v1.json
data/officialFantasyRulesImportReport_v1.json
data/playerIdentityMatchReport_v1.md
data/playerDataCoverageReport_v1.md
data/playerMinutesModelReport_v1.md
data/scorePredictionQaReport_v3.md
data/playerMatchdayProjectionReport_v3.md
data/playerFinanceMetricsReport_v1.md
data/recommendationQaReport_v3.md
data/teamBuilderQaReport_v1.md
```

## 6.3 Manual spot-checks

Spot-check:

- top 20 most expensive players
- top 20 projected players
- top 20 value players
- every captain candidate
- every goalkeeper above recommendation threshold
- every thin-profile player in recommendations
- every player with position conflict
- every player with club conflict
- every player with squad status conflict
- every team with unusual country or team ID mapping
- every team with fewer or more than expected fantasy players
- every exact duplicate name

## 6.4 Browser QA

Run locally:

```bash
python3 -m http.server 8766
```

Check:

```text
http://127.0.0.1:8766/index.html
http://127.0.0.1:8766/world-cup.html
```

Manual QA:

- homepage loads
- data status is accurate
- Top Picks render
- Captain Alpha renders
- Pick Explorer filters work
- Player Profile opens
- Player Profile shows official price and position
- Fixture Outlook renders v3 score predictions
- Team Builder builds legal squad
- Team Builder budget uses official price
- Team Builder country limit uses official rules
- Squad Risk Report appears
- Save Squad works
- Load Squad works
- imported old prototype squad shows migration warning if needed
- Captain Switch Check remains manual but rule-aware
- Bench Switch Check remains manual but rule-aware
- Matchday timeline uses official fixture/deadline data where available
- no console errors

## 6.5 Mobile QA

Test widths:

```text
360px
390px
768px
1024px
1440px
```

Acceptance:

- no page-level horizontal overflow
- data tables do not break main flow
- Team Builder controls usable
- Player Profile usable
- Matchday Desk usable
- long player names wrap cleanly
- cards remain readable

## 6.6 Stop conditions

Stop and report blocker if:

- official fantasy player file is incomplete
- official prices are missing
- official positions are missing
- official rules are incomplete
- official deadlines are unknown and required for a tool
- identity matching has unresolved high-risk conflicts
- duplicate official fantasy IDs exist
- readiness does not return `ready_for_official_model_rerun`
- model rerun creates extreme outliers without explanation
- Team Builder cannot create a legal official squad
- browser-ready files fail to load
- mobile has page-level overflow
- old prototype data is still active in official-data-dependent tools

---

## 7. Documentation Updates

Update these after official data and model reruns:

```text
README.md
SITE_FEATURES.md
OFFICIAL_DATA_NEXT_STEPS.md
data/README.md
data/dataSources.md
data/dataQualityReport.md
data/sourceManifest.json
data/officialDataReadiness_v0.md
data/playerIdentityMatchReport_v1.md
data/playerDataCoverageReport_v1.md
data/scorePredictionQaReport_v3.md
data/recommendationQaReport_v3.md
data/teamBuilderQaReport_v1.md
```

README should clearly say:

- official fantasy data imported or not
- official data version
- model output version
- Team Builder rule status
- known remaining gaps
- how to rerun official-data validation
- how to regenerate browser-ready files

---

## 8. Detailed Task Backlog

| ID | Task | Priority | Main files | Acceptance |
|---|---|---|---|---|
| DATA-001 | Repository and data inventory | Must Fix | `data/dataInventory_officialDataStage_v1.md` | active files and dependencies documented |
| DATA-002 | Official source manifest | Must Fix | `data/officialDataSourceManifest_v1.json` | every source has URL, checked date, fields used |
| DATA-003 | Official fantasy rules collection | Must Fix | `data/imports/officialFantasyRules.json` | all required rule sections present |
| DATA-004 | Official fantasy player collection | Must Fix | `data/imports/officialFantasyPlayers.csv` | IDs, positions, prices, status collected |
| DATA-005 | Official squad collection | Must Fix | `data/imports/officialSquads.csv` | squad status source-backed |
| DATA-006 | Official fixture/deadline collection | Must Fix | `data/officialFixtureSchedule_v1.json`, `data/officialFantasyDeadlines_v1.json` | kickoff and deadline data source-backed |
| DATA-007 | Import official squads | Must Fix | import scripts, reports | import report ready |
| DATA-008 | Import official fantasy players | Must Fix | import scripts, reports | prices and positions imported |
| DATA-009 | Import official rules | Must Fix | import scripts, reports | rule report ready |
| DATA-010 | Readiness validation | Must Fix | `data/officialDataReadiness_v0.json` | ready before model rerun |
| MATCH-001 | Name normalization helpers | Must Fix | scripts | normalized matching works |
| MATCH-002 | Player identity map | Must Fix | `data/mappings/playerIdentityMap_v1.csv` | every official player has identity status |
| MATCH-003 | Review queue | Must Fix | `data/review/playerIdentityReviewQueue_v1.csv` | all uncertain matches listed |
| MATCH-004 | New player profile creation | Must Fix | generated player inputs | true new players become thin profiles |
| MATCH-005 | Club context matching | Should Fix | `data/playerClubContext_v1.csv` | club status for every player |
| MATCH-006 | Qualifier usage matching | Should Fix | `data/playerQualifierUsage_v1.csv` | NT usage status for every player |
| MATCH-007 | Coverage report | Must Fix | `data/playerDataCoverageReport_v1.md` | coverage thresholds reported |
| RULES-001 | Official rules machine contract | Must Fix | `data/officialFantasyRules_v1.json` | Team Builder can consume rules |
| MODEL-001 | Official recommendation inputs | Must Fix | `data/playerRecommendationInputs_v1.json` | all selectable players included |
| MODEL-002 | Minutes model v1 | Must Fix | `data/playerMinutesModel_v1.json` | start and minutes numeric |
| MODEL-003 | Score predictor v3 | Must Fix | `data/scorePredictions_v3.json` | squad-aware score outputs |
| MODEL-004 | Score prediction QA v3 | Must Fix | QA files | coverage and bounds pass |
| MODEL-005 | Matchday projections v3 | Must Fix | `data/playerMatchdayProjections_v3.json` | projections for selectable players |
| MODEL-006 | Value model v2 | Must Fix | `data/playerValueModel_v2.json` | official prices active |
| MODEL-007 | Finance metrics v1 | Must Fix | `data/playerFinanceMetrics_v1.json` | official price/risk metrics |
| MODEL-008 | Recommendations v3 | Must Fix | `data/matchdayRecommendations_v3.json` | official recommendations ready |
| MODEL-009 | Recommendation QA v3 | Must Fix | QA files | top picks reviewed |
| BUILDER-001 | Official Team Builder constraints | Must Fix | `script.js`, rules data | official legal squads |
| BUILDER-002 | Portfolio optimizer official update | Must Fix | builder logic | squad risk uses official data |
| BUILDER-003 | Builder failure explanations | Should Fix | `script.js` | clear failure reasons |
| DECISION-001 | Captain rules update | Must Fix | decision logic | official captain rules reflected |
| DECISION-002 | Substitution rules update | Must Fix | decision logic | official sub rules reflected |
| BROWSER-001 | Browser-ready data refresh | Must Fix | data JS files | site uses official outputs |
| QA-001 | Static QA | Must Fix | all | syntax and JSON checks pass |
| QA-002 | Browser QA | Must Fix | site | no console errors |
| QA-003 | Mobile QA | Must Fix | CSS/site | no page overflow |
| DOC-001 | Docs update | Must Fix | README and docs | official state documented |

---

## 9. Suggested Codex Prompts

Use these prompts one at a time.

### Prompt 1: Data inventory and source manifest

```text
Read README.md, SITE_FEATURES.md, OFFICIAL_DATA_NEXT_STEPS.md, and docs/OFFICIAL_FANTASY_DATA_COLLECTION_MODEL_ROADMAP.md. Implement DATA-001 and DATA-002 only. Create a data inventory that lists active model files, prototype files, scripts, browser-ready outputs, and official-data dependencies. Create an official source manifest schema. Do not change model logic. Run git diff --check and syntax checks.
```

### Prompt 2: Official rules collection contract

```text
Implement DATA-003 and RULES-001 only. Build or complete data/imports/officialFantasyRules.json using only source-backed official fantasy rules provided in the repo or by the user. Create data/officialFantasyRules_v1.json as the machine-readable contract. Do not invent missing rule values. If any rule section is missing, keep it null and add a blocker. Run validation and report blockers.
```

### Prompt 3: Official fantasy players collection contract

```text
Implement DATA-004 only. Fill or validate data/imports/officialFantasyPlayers.csv using source-backed official fantasy player data. Required fields are official_fantasy_player_id, name, country, team_id, official_fantasy_position, official_price, selectable_status, source_url, and source_checked. Do not invent missing values. Add duplicate and missing-field checks. Report blockers.
```

### Prompt 4: Official squads and fixtures

```text
Implement DATA-005 and DATA-006 only. Fill or validate officialSquads.csv, officialFixtureSchedule_v1.json, and officialFantasyDeadlines_v1.json using source-backed data. Keep incomplete squad or deadline data explicitly marked. Do not treat provisional squads as final unless the source says final. Report gaps.
```

### Prompt 5: Run existing official import pipelines

```text
Implement DATA-007 through DATA-010 only. Run importOfficialSquads.mjs, importOfficialFantasyPlayers.mjs, importOfficialFantasyRules.mjs, and validateOfficialDataReadiness.mjs. Stop if readiness is not ready_for_official_model_rerun. Do not change recommendation or Team Builder model logic yet. Report exact blockers.
```

### Prompt 6: Player identity matching

```text
Implement MATCH-001 through MATCH-004 only. Create player identity normalization and matching logic. Generate playerIdentityMap_v1.csv and playerIdentityReviewQueue_v1.csv. Match official fantasy players to existing internal players using official ID, normalized name, country, DOB, club, position, aliases, and fuzzy matching. Create thin profiles only for true new players. Do not let unresolved review rows into main model inputs.
```

### Prompt 7: Club and qualifier matching

```text
Implement MATCH-005 through MATCH-007 only. Match every official fantasy player to current club context and previous national-team or qualifier usage where available. Generate playerClubContext_v1.csv, playerQualifierUsage_v1.csv, and playerDataCoverageReport_v1.md. Keep missing values explicit. Flag thin profiles, missing usage, and low role confidence.
```

### Prompt 8: Official player model inputs and minutes model

```text
Implement MODEL-001 and MODEL-002 only. Create playerRecommendationInputs_v1.json and playerMinutesModel_v1.json from official fantasy data, identity map, club context, qualifier usage, and official rules. Ensure every selectable player has numeric start probability and expected minutes or a clear blocker. Generate model reports.
```

### Prompt 9: Score predictor v3

```text
Implement MODEL-003 and MODEL-004 only. Create scorePredictions_v3.json using PELE ratings plus official squad and availability context. Preserve scorePredictions_v2.json. Generate scorePredictionQa_v3.json and scorePredictionQaReport_v3.md. Check fixture coverage, probability bounds, clean-sheet probabilities, and v2-to-v3 changes. Do not use betting odds.
```

### Prompt 10: Matchday projections, value, and finance metrics

```text
Implement MODEL-005 through MODEL-007 only. Generate playerMatchdayProjections_v3.json, playerValueModel_v2.json, and playerFinanceMetrics_v1.json using official positions, official prices, official scoring rules, minutes model, and scorePredictions_v3. Keep proxy_price_v1 only as an audit field. Generate QA reports.
```

### Prompt 11: Recommendations v3

```text
Implement MODEL-008 and MODEL-009 only. Generate matchdayRecommendations_v3.json, recommendationQa_v3.json, and recommendationQaReport_v3.md. Use Balanced, Safe, Upside, Differential, and Captain modes. Exclude unresolved identity review rows from main recommendations. Include thin-profile players only with Data Check flags. Preserve v2 recommendations.
```

### Prompt 12: Official Team Builder

```text
Implement BUILDER-001 through BUILDER-003 only. Update Team Builder to use official prices, official positions, official budget, official country limits, official formations, and selectable status. Proxy prices must not be active. Add clear failure reasons. Preserve export/import fields and add migration warnings for old prototype squads.
```

### Prompt 13: Decision tools and browser-ready refresh

```text
Implement DECISION-001, DECISION-002, and BROWSER-001 only. Update captain and substitution tools to use official rules while keeping manual points entry. Regenerate browser-ready data files. Run browser QA on index.html and world-cup.html. Report changed files and remaining blockers.
```

### Prompt 14: Final QA and documentation

```text
Implement QA-001 through QA-003 and DOC-001 only. Run static checks, JSON checks, browser checks, mobile checks, and official-data readiness validation. Update README.md, SITE_FEATURES.md, data docs, and source manifests to reflect official data and model versions. Do not start UX redesign yet.
```

---

## 10. Final Data-First Acceptance Checklist

Before starting the redesign, all of these should be true:

- official fantasy players imported
- official fantasy prices imported
- official fantasy positions imported
- official fantasy IDs imported
- official fantasy rules imported
- official deadlines imported or explicitly blocked
- official squad status imported
- every official fantasy player has identity status
- every unmatched player has review or thin profile status
- current club context matched or explicitly missing
- qualifier/national-team usage matched or explicitly missing
- official-data readiness passes
- scorePredictions_v3 created or v2 explicitly retained with justification
- playerMatchdayProjections_v3 created
- playerValueModel_v2 created
- playerFinanceMetrics_v1 created
- matchdayRecommendations_v3 created
- Team Builder uses official prices and official rules
- captain/substitution tools use official rules
- browser-ready files regenerated
- no active tool uses proxy prices as final prices
- no active tool uses draft rules as official rules
- no unresolved high-risk identity match appears in recommendations
- QA reports created
- README and SITE_FEATURES updated
- site loads locally
- no console errors
- mobile has no page-level overflow

Only after this checklist passes should Codex begin the full UX redesign roadmap.

---

## 11. Recommended Final Status Message After Completion

When this stage is complete, the site should be able to say:

```text
Data status: Official fantasy data imported. Player prices, positions, rules, and Team Builder legality now use official fantasy data. Model outputs were regenerated on [date]. Some live matchday decisions still require manual point entry and official-game confirmation.
```

If not complete, it should say:

```text
Data status: Official fantasy data is partially imported. Some tools still use prototype assumptions. Check Model Notes for current blockers.
```

Do not claim official readiness until the readiness gate and QA pass.
