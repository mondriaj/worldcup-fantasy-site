# Player Identity Match Report v1

Generated: 2026-06-02

## Scope

This MATCH-1 pass prepares official fantasy player identity matching only. It does not rerun score predictions, player projections, recommendations, Team Builder logic, captain logic, substitution logic, browser-ready files, or any active model output.

## Input Status

- Official player source checked: `data/officialFantasyPlayers_v0.json`
- Input status: `imported_needs_manual_review`
- Official fantasy players processed: 1481
- Active internal player source: `data/players.json`
- Supporting identity context inspected: `data/playerRecommendationInputs_v0.json`, `data/playerNationalTeamPerformance.json`, `data/playerPerformance.json`, `data/playerMinutesModel_v0.json`

## Internal Player Inventory

- Internal player rows: 1339
- Unique internal player IDs: 1339
- Current team IDs: algeria, argentina, australia, austria, belgium, bosnia-and-herzegovina, brazil, cabo-verde, canada, colombia, congo-dr, cote-d-ivoire, croatia, curacao, czechia, ecuador, egypt, england, france, germany, ghana, haiti, ir-iran, iraq, japan, jordan, korea-republic, mexico, morocco, netherlands, new-zealand, norway, panama, paraguay, portugal, qatar, saudi-arabia, scotland, senegal, south-africa, spain, sweden, switzerland, tunisia, turkiye, uruguay, usa, uzbekistan
- Rows with club: 1148
- Rows with league: 451
- Rows with national-team usage signal: 913
- Rows with club-performance signal: 956
- Alias rows loaded: 0
- Manual override rows loaded: 25

## Match Summary

- Exact matches: 1003
- Strong matches: 234
- Manual-confirmed matches: 23
- New thin profiles staged: 221
- Confirmed thin profiles absent from current internal data: 221
- Review cases: 0
- Position conflicts accepted as identity matches with audit flag: 135
- Position conflicts still unresolved: 0
- Duplicate official fantasy ID conflicts: 0
- One-official-to-multiple-internal review cases: 0
- One-internal-to-multiple-official review cases: 0
- Duplicate accepted internal-player mapping conflicts: 0
- Duplicate internal name-country keys available for review detection: 0
- Missing official prices: 0
- Missing official positions: 0

## Review Queue Breakdown

Top review reasons:

- None

Top review countries:

- None

Review positions:

- None

## Outputs

- `data/mappings/playerIdentityMap_v1.csv`
- `data/review/playerIdentityReviewQueue_v1.csv`
- `data/playerIdentityMatchReport_v1.md`
- `scripts/matchOfficialFantasyPlayers.mjs`

## Matching Rules Implemented

The helper normalizes names, removes diacritics, normalizes country/team IDs, positions, and clubs, and supports optional alias rows from `data/playerAliases_v1.json` or `data/mappings/playerAliases_v1.csv` if either file exists.

Manual override rows from `data/mappings/playerIdentityManualOverrides_v1.csv`, when present, are applied before automated candidate scoring.

Candidate order:

1. Existing official fantasy ID.
2. Exact normalized name plus country.
3. Exact normalized name plus team ID.
4. Normalized name plus date of birth, when available.
5. Normalized name plus current club, when available.
6. Fuzzy name plus country/team plus broad position.
7. Alias table, if available.
8. Manual review or thin-profile staging.

Acceptance thresholds:

- `>= 0.95`: accepted only if no duplicate, official-field, country, date-of-birth, or club conflict is triggered.
- Clean official-position conflicts are accepted as identity matches only when official name/country evidence is otherwise safe; the official fantasy position remains the future active fantasy position and the internal position remains audit context.
- `0.85` to `< 0.95`: review.
- `< 0.85`: review or no reliable match.
- Candidate scores within 0.05 of the top candidate trigger review.

## Quality Gates

- PASS: Duplicate official fantasy IDs (0)
- PASS: One official player mapped to multiple internal candidates (0)
- PASS: One internal player accepted for multiple official players (0)
- PASS: Missing official prices (0)
- PASS: Missing official positions (0)
- PASS: Unresolved high-risk identity conflicts (0)

## Blockers Before Model Rerun

- Identity matching has no open blocker in this report, but full official-data readiness must still pass before model reruns.








- Official-data readiness must still pass `node scripts/validateOfficialDataReadiness.mjs`.
- Official final squads, official fantasy prices, official fantasy positions, official rules, scoring, and deadlines remain required before any model rerun.

## Duplicate Internal Mapping Details

- None among accepted clean matches.

## Recommended Next Codex Session

Identity matching is clean enough to proceed to the club-context and national-team usage enrichment stage. Do not rerun models until readiness passes.
