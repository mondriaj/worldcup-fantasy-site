# Active Stage Manifest QA Report v1

Generated: 2026-07-18T12:26:49.268Z

Status: **pass**

## Manifest Contract

| Item | Value |
| --- | --- |
| Active stage | finalRound |
| Public version | 20260718-final-round |
| Pages | index.html, world-cup.html |
| Source files | 13 |
| Wrappers | 15 |
| Validators | 15 |
| Blocked globals | 6 |

## Checks

| Check | Status |
| --- | --- |
| manifest_exists_and_parses | pass |
| active_stage_is_final_round | pass |
| cache_bust_present | pass |
| all_listed_source_files_exist | pass |
| all_listed_public_wrappers_exist | pass |
| all_listed_validators_exist | pass |
| required_manifest_entries_present | pass |
| html_references_expected_active_wrappers | pass |
| team_builder_artifact_wrapper_loaded_by_index | pass |
| manifest_stage_matches_script_default | pass |
| cache_bust_matches_html_for_manifest_scripts | pass |
| browser_equivalence_validator_listed | pass |
| eligible_player_validator_listed | pass |
| final_round_fixture_authority_listed | pass |
| old_deprecated_globals_blocked | pass |
| known_caveats_present | pass |
| forbidden_refereeing_conspiracy_surface_listed | pass |
| forbidden_refereeing_conspiracy_absent_from_public_pages | pass |

## Loaded Scripts

### index.html

| Order | File | Cache bust |
| --- | --- | --- |
| 1 | https://www.googletagmanager.com/gtag/js | none |
| 2 | playersData.js | 20260718-final-round |
| 3 | fantasyRulesData.js | 20260718-final-round |
| 4 | fantasyPoolRecommendationsData.js | 20260718-final-round |
| 5 | fantasyPoolMatchdayProjectionsData.js | 20260718-final-round |
| 6 | fantasyPoolFinanceMetricsData.js | 20260718-final-round |
| 7 | fantasyPoolScorePredictionsData.js | 20260718-final-round |
| 8 | knockoutBracketPredictionData.js | 20260718-final-round |
| 9 | fantasyPoolOfficialDataStatusData.js | 20260718-final-round |
| 10 | liveMatchdayStatusData.js | 20260718-final-round |
| 11 | livePlayerStatusData.js | 20260718-final-round |
| 12 | r16FixtureAuthorityData.js | 20260718-final-round |
| 13 | qfFixtureAuthorityData.js | 20260718-final-round |
| 14 | sfFixtureAuthorityData.js | 20260718-final-round |
| 15 | finalRoundFixtureAuthorityData.js | 20260718-final-round |
| 16 | teamBuilderFinalRoundArtifactData.js | 20260718-builder-artifact-equivalence |
| 17 | script.js | 20260718-builder-artifact-equivalence |

### world-cup.html

| Order | File | Cache bust |
| --- | --- | --- |
| 1 | https://www.googletagmanager.com/gtag/js | none |
| 2 | worldCupData.js | 20260718-final-round |
| 3 | liveMatchdayStatusData.js | 20260718-final-round |
| 4 | r32FixtureAuthorityData.js | 20260718-final-round |
| 5 | r16FixtureAuthorityData.js | 20260718-final-round |
| 6 | qfFixtureAuthorityData.js | 20260718-final-round |
| 7 | sfFixtureAuthorityData.js | 20260718-final-round |
| 8 | finalRoundFixtureAuthorityData.js | 20260718-final-round |
| 9 | worldCupPage.js | 20260718-final-round |
