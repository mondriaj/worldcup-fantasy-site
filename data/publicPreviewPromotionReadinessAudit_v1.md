# Public Preview Promotion Readiness Audit v1

Generated: 2026-06-02T19:37:02.161Z

## Verdict

**ready_for_public_preview_with_warnings**

The staged fantasy-pool recommendations are reasonable to publish soon as **Official Fantasy Pool Preview** content, provided the public UI keeps the warnings explicit and nearby. They are not final recommendations, not final-squad-backed, and not Team Builder-ready.

## Decision Summary

| Item | Value |
| --- | --- |
| Official fantasy players | 1481 |
| Official prices complete | 1481/1481 |
| Official positions complete | 1481/1481 |
| Rules import status | imported_needs_manual_review |
| Rules validation warnings | 4 |
| Final-squad-confirmed rows | 0 |
| Fantasy-pool-only squad rows | 1256 |
| Squad review rows | 225 |
| Projection QA | pass_with_staging_stop_conditions |
| Recommendation QA | pass_with_staging_stop_conditions |
| Finance QA | pass_with_staging_stop_conditions |
| Readiness status | blocked_waiting_for_official_fantasy_data |

## Promotion Criteria

| Criterion | Status | Evidence | Notes |
| --- | --- | --- | --- |
| official_fantasy_players_imported | pass | 1481 | Official fantasy player import exists and has 0 error rows. |
| official_prices_complete | pass | 1481/1481 | Official prices are complete in the imported fantasy pool. |
| official_positions_complete | pass | 1481/1481 | Official positions are complete in the imported fantasy pool. |
| official_scoring_imported | pass_with_warning | imported_needs_manual_review | Official scoring is imported, but the rules import status remains manual-review. |
| official_rules_sufficiently_complete_for_recommendations | pass_with_warning | 4 warnings | Scoring categories are usable for preview recommendations; Mystery Booster and deadline semantics still need review. |
| final_squad_status_clearly_not_final | pass_with_warning | teams complete: 0 | Final squads are explicitly not source-backed; fantasy-pool-only status is visible. |
| staged_projections_pass_qa | pass_with_warning | pass_with_staging_stop_conditions | Projection QA passes with staging stop conditions. |
| staged_recommendations_pass_qa | pass_with_warning | pass_with_staging_stop_conditions | Recommendation QA passes with staging stop conditions. |
| staged_finance_metrics_pass_qa | pass_with_warning | pass_with_staging_stop_conditions | Finance metrics QA passes with staging stop conditions. |
| no_blocked_players_in_recommendations | pass | blocked available: 225; candidate rows: 500 | Blocked players are excluded from recommendation candidates. |
| no_low_confidence_top_balanced | pass | 0 | Balanced top 25 has no low-confidence rows. |
| no_thin_profile_top_balanced | pass | 0 | Balanced top 25 has no thin-profile rows. |
| no_true_missing_usage_top_balanced | pass | 0 | Balanced top 25 has no true missing-usage leakage. |
| neymar_brazil_uncertainty_visible | pass_with_warning | {"neymar_candidates":[],"brazil_uncertainty_candidate_count":19,"note":"Brazil candidates carry brazil_neymar_usage_source_gap when inherited from score/project | Brazil uncertainty is visible; Neymar is not promoted as a candidate. |
| final_squad_uncertainty_visible | pass | 1256/1256 | Every finance row carries final-squad uncertainty. |
| rules_warnings_visible | pass_with_warning | ["rulesStatus is official_imported_needs_manual_review; keep staged rules under review before active promotion.","boosters.rulesStatus is official_imported_need | Rules warnings are visible in source reports and staged output flags. |
| no_active_files_overwritten | pass | active v2/browser files unchanged in git status subset and staged metadata preserves previous active files | No active v2 files were overwritten by this audit. |
| browser_ready_files_not_yet_updated | pass | {"recommendations":false,"projections":false,"finance":false} | Browser-ready files remain untouched. |
| user_facing_label_can_be_truthful | pass | Official Fantasy Pool Preview | The label is accurate if paired with explicit final-squad and rules warnings. |
| public_copy_can_avoid_final_claims | pass | warning copy drafted | Preview copy can avoid final/final-squad-ready wording. |
| team_builder_remains_blocked | pass_with_warning | {"recommendation_safe_for_team_builder":false,"finance_safe_for_final_team_builder_promotion":false} | Team Builder remains blocked from final promotion. |
| recommendation_outputs_not_final_squad_backed | pass | staged_fantasy_pool_only_not_final_squad_backed | Recommendation output does not claim final-squad backing. |

## Top Recommendation List Audit

| Mode | Status | Winner | Positions in top 25 | Top country concentration | Leakage | Concern |
| --- | --- | --- | --- | --- | --- | --- |
| balanced | pass_with_warning | Nuno Alexandre Tavares Mendes (Portugal, DEF, md2) | DEF 14, MID 7, FWD 4 | Argentina 12, Portugal 5, Colombia 3, Germany 2, Norway 1 | low 0; thin 0; missing usage 0 | position concentration should be explained in preview copy |
| safe | pass_with_warning | Nuno Alexandre Tavares Mendes (Portugal, DEF, md2) | DEF 9, MID 7, GK 5, FWD 4 | Argentina 7, Colombia 6, Portugal 5, Spain 2, Germany 1 | low 0; thin 0; missing usage 0 | country concentration should be monitored |
| upside | pass_with_warning | Lionel Messi (Argentina, FWD, md3) | FWD 12, MID 11, DEF 2 | Argentina 7, England 4, Portugal 4, Spain 3, France 3 | low 0; thin 0; missing usage 0 | country concentration should be monitored |
| differential | pass_with_warning | Giorgian de Arrascaeta (Uruguay, MID, md1) | MID 4, FWD 6, DEF 13, GK 2 | Colombia 5, Uruguay 3, Japan 3, Croatia 2, Norway 2 | low 0; thin 0; missing usage 0 | position concentration should be explained in preview copy; Differential is usable as lower-obviousness value/watchlist content, but finance QA still finds many dominated Differential candidates |
| captain | pass_with_warning | Lionel Messi (Argentina, FWD, md3) | FWD 15, MID 10 | Argentina 7, Portugal 5, England 4, France 4, Spain 2 | low 0; thin 0; missing usage 0 | position concentration should be explained in preview copy |

### Manual Top-List Findings

- Balanced is usable as preview content. It is defender-heavy and Argentina-concentrated, but the rows are high confidence and have no thin-profile or true missing-usage leakage.
- Safe is usable as preview content. Goalkeepers appear, but they do not dominate the list.
- Upside is usable as preview content. It is attacker-led and includes credible high-ceiling players.
- Differential is usable only if framed as lower-obviousness value/watchlist content. It should not be described as hidden gems or guaranteed edges.
- Captain Alpha is usable as preview content. It is attacker-led and does not promote defenders or goalkeepers as captain defaults.
- Public tables should show matchday/scope clearly, because the same player can appear multiple times for MD1, MD2, MD3, and group-stage aggregate rows.

## Finance/Value Layer Audit

| Item | Finding |
| --- | --- |
| Value over replacement | Top VOR players are plausible preview names and include elite attackers plus high-scoring official-scoring defenders/midfielders. |
| Efficient frontier | Player-level frontier count is 17. This is plausible under strict group-stage aggregation; row-level recommendation diagnostics had 62 frontier rows because matchday rows are separate. |
| Dominated-player count | Dominated count is high because the dominance test is intentionally strict across same position or same price band. It should not be surfaced publicly as a simple bad-player label. |
| Differential dominated candidates | 60/100 Differential recommendation candidates are dominated, but 31 are still marked dominated-but-defensible. Acceptable for preview if Differential is described as watchlist/lower-obviousness value, not as a guaranteed edge. Needs tightening before a public Value mode or Team Builder optimizer. |

Finance metric counts:

| Metric | Count |
| --- | --- |
| Finance metric players | 1256 |
| Efficient-frontier players | 17 |
| Dominated players | 1239 |
| Above-replacement players | 64 |
| Differential dominated candidates | 60 |

Preview-safe finance language:

- Use preview value indicators, not market inefficiency claims.
- Avoid guaranteed edge, optimal portfolio, or final value wording.
- Keep final-squad uncertainty and rules-review caveats visible near finance/value tables.

## Required Public Warning Copy

- Official Fantasy Pool Preview
- Uses official fantasy prices, positions, and scoring.
- Final squad status is not yet source-backed.
- Recommendations may change after final squad confirmation.
- Rules import still has manual-review warnings for Mystery Booster details and deadline semantics.
- Team Builder remains in prototype mode until final squad and rule gates pass.

## Blockers For Final Promotion

- Final squads are not source-backed; teams_marked_complete is 0.
- Official rules still have manual-review warnings for Mystery Booster and deadline semantics.
- Browser-ready files have not been generated or smoke-tested for preview.
- Team Builder remains blocked and must not be presented as official-preview-ready.

## Promotion Plan Not Executed

Files that would need browser-ready treatment later:

- A preview-safe recommendation browser data file derived from data/matchdayRecommendations_fantasyPool_v3.json
- A preview-safe projection browser data file derived from data/playerMatchdayProjections_fantasyPool_v3.json
- A preview-safe finance/value browser data file derived from data/playerFinanceMetrics_fantasyPool_v1.json and data/playerValueModel_fantasyPool_v2.json
- A score context browser file or alias derived from data/scorePredictions_fantasyPool_v3.json
- A visible warnings/config file consumed by the UI

Data aliases needed later:

- Official Fantasy Pool Preview recommendation alias
- Official Fantasy Pool Preview projection alias
- Official Fantasy Pool Preview finance/value alias
- Preserve v2 active aliases for rollback

Docs to update later:

- README.md
- SITE_FEATURES.md
- data/README.md
- public model notes/methodology copy

QA required before publishing:

- Run full JSON parse and script syntax checks.
- Run local browser smoke test and confirm warning copy is visible in recommendation, projection, and finance panels.
- Confirm no copy says final, final-squad-ready, or Team Builder-ready.
- Confirm active v2 files are preserved or rollback branch/tag exists.
- Confirm top candidate tables show matchday/scope so repeated player rows are understandable.
- Confirm Neymar/Brazil uncertainty note is visible when Brazil candidates appear.

Rollback plan:

- Keep active v2 JSON and browser-ready files unchanged until preview switch.
- Use a single preview flag or data alias so the site can revert to v2 by alias rollback.
- Preserve staged v3 files as separate artifacts for audit.
- If preview QA fails, remove preview alias and leave staged files unreferenced by browser-ready code.

## Final Answer To The Preview Question

Yes, the staged fantasy-pool recommendations are safe to prepare for public preview under the label **Official Fantasy Pool Preview**, with explicit warnings. They are not safe to present as final recommendations, final-squad-backed recommendations, or Team Builder-ready data.
