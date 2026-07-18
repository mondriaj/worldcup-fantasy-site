const COMMON_PLAYER_FIELDS = [
  "player_matchday_projection_id",
  "internal_player_id",
  "official_fantasy_player_id",
  "source_player_id",
  "playerId",
  "id",
  "name",
  "display_name",
  "country",
  "team_id",
  "official_team_id",
  "team",
  "team_name",
  "official_fantasy_position",
  "position",
  "position_code",
  "fantasyPosition",
  "fantasy_position",
  "official_price",
  "price",
  "selectable_status",
  "roster_status"
];

const PROJECTION_ROW_FIELDS = [
  ...COMMON_PLAYER_FIELDS,
  "matchday",
  "matchday_id",
  "matchday_label",
  "opponent",
  "opponent_team_id",
  "fixture_id",
  "match_id",
  "match_number",
  "fixture_stage",
  "side",
  "expected_minutes",
  "expectedMinutes",
  "start_probability",
  "startProb",
  "start_probability_percent",
  "raw_expected_points",
  "projectedPoints",
  "risk_adjusted_points",
  "floor_points",
  "ceiling_points",
  "captain_score",
  "captainUpsideScore",
  "value_score",
  "projection_confidence",
  "role_label",
  "role_confidence",
  "roleTier",
  "roleConfidence",
  "role_volatility_score",
  "third_place_rotation_risk",
  "majorRoleCaution",
  "roleCaution",
  "role_caution",
  "caution",
  "thin_profile",
  "lineupEvidenceType",
  "sfStarted",
  "sfSubstitute",
  "qfStarted",
  "qfSubstitute",
  "data_quality_flags",
  "dataQualityFlags",
  "modelVersion",
  "model_version",
  "model_stage",
  "defaultMatchday"
];

const RECOMMENDATION_ROW_FIELDS = [
  ...PROJECTION_ROW_FIELDS,
  "mode",
  "mode_label",
  "pickType",
  "recommendation_surface",
  "rank",
  "recommendation_score",
  "recommendation_tier",
  "recommendation_tags",
  "why_pick",
  "why_careful",
  "final_round_strategy",
  "finance_context",
  "coreEligibilityReason",
  "coreEligibilityWarning",
  "allowedCorePick"
];

const FIXTURE_CONTEXT_FIELDS = [
  "fixture_id",
  "match_id",
  "match_number",
  "opponent_team_id",
  "opponent",
  "side",
  "expected_goals",
  "projected_xg",
  "expected_goals_against",
  "win_probability",
  "draw_probability",
  "loss_probability",
  "clean_sheet_probability",
  "base_clean_sheet_probability",
  "clean_sheet_form_multiplier",
  "clean_sheet_form_adjustment",
  "defensive_form_label",
  "fixture_difficulty_score",
  "fixture_difficulty_band",
  "captain_environment_score",
  "matchUncertainty",
  "upset_risk_probability",
  "upset_risk_band",
  "fixture_count",
  "opponents",
  "known_or_projected_path_status",
  "live_fixture_status",
  "live_round_status",
  "live_score_status",
  "live_status_display_only"
];

const MINUTES_CONTEXT_FIELDS = [
  "role_label",
  "role_confidence",
  "evidence_level",
  "md2_actual_fantasy_points",
  "md2_actual_points_available",
  "two_game_actual_fantasy_points",
  "two_game_projected_points",
  "two_game_projection_error",
  "two_game_form_evidence_type",
  "md3_rotation_risk_category",
  "md3_group_incentive_status",
  "r32_role_interpretation",
  "r32_start_context"
];

const FINANCE_CONTEXT_FIELDS = [
  "downside_risk_score",
  "volatility_score",
  "role_stability_score",
  "value_role",
  "price_tier_opportunity_cost",
  "risk_adjusted_points_per_price",
  "points_per_price"
];

const FINAL_ROUND_STRATEGY_FIELDS = [
  "kickoff_order",
  "fixture_timing",
  "fixture_stage",
  "rawProjectedPoints",
  "startProbability",
  "expectedMinutes",
  "roleVolatility",
  "teamXg",
  "opponentXg",
  "cleanSheetProbability",
  "goalEnvironment",
  "earlyFixtureOptionalityBonus",
  "replacementOptionValue",
  "lateFixtureReplacementValue",
  "fixtureDiversificationValue",
  "thirdPlaceRiskPenalty",
  "thirdPlaceUpsideModifier",
  "roleVolatilityPenalty",
  "strategicCompositeScore",
  "recommendation_score"
];

const SCORE_FIXTURE_FIELDS = [
  "prediction_id",
  "match_id",
  "fixture_id",
  "match_number",
  "matchday",
  "fantasy_matchday_id",
  "stage",
  "group",
  "date",
  "eastern_datetime_label",
  "fixture_authority_status",
  "public_label",
  "home_team_id",
  "home_team",
  "away_team_id",
  "away_team",
  "home_expected_goals",
  "away_expected_goals",
  "home_projected_xg",
  "away_projected_xg",
  "total_expected_goals",
  "home_win_probability",
  "draw_probability",
  "away_win_probability",
  "home_clean_sheet_probability",
  "away_clean_sheet_probability",
  "both_teams_to_score_probability",
  "upset_risk_probability",
  "probability_extra_time",
  "home_advance_probability",
  "away_advance_probability",
  "home_advance_in_90_probability",
  "away_advance_in_90_probability",
  "home_advance_after_extra_time_probability",
  "away_advance_after_extra_time_probability",
  "home_advance_on_penalties_probability",
  "away_advance_on_penalties_probability",
  "favorite_team_id",
  "favorite_team",
  "favorite_win_probability",
  "projected_advancing_team",
  "matchUncertainty",
  "uncertainty_label",
  "top_scorelines",
  "top_scoreline",
  "third_place_modifiers",
  "data_quality_flags",
  "winner_advances_to",
  "loser_advances_to"
];

const TEAM_FIXTURE_FIELDS = [
  "team_fixture_prediction_id",
  "match_id",
  "fixture_id",
  "match_number",
  "fantasy_matchday_id",
  "stage",
  "team_id",
  "team",
  "opponent_team_id",
  "opponent",
  "side",
  "expected_goals",
  "projectedXg",
  "projected_xg",
  "expected_goals_against",
  "win_probability",
  "draw_probability",
  "loss_probability",
  "advance_probability",
  "clean_sheet_probability",
  "base_clean_sheet_probability",
  "clean_sheet_form_multiplier",
  "clean_sheet_form_adjustment",
  "defensive_form_label",
  "fixture_difficulty_score",
  "fixture_difficulty_band",
  "captain_environment_score",
  "matchUncertainty",
  "score_model_version",
  "qa_flags"
];

const TEAM_BUILDER_ROW_FIELDS = [
  ...COMMON_PLAYER_FIELDS,
  "opponent",
  "fixture_stage",
  "projectedPoints",
  "start_probability",
  "captainScore",
  "lineupEvidenceType",
  "thirdPlaceRisk",
  "roleCaution",
  "finalRoundStrategy"
];

const TOP_LEVEL_FIELDS = [
  "schema_version",
  "generatedAt",
  "generated_at",
  "source_checked",
  "modelVersion",
  "model_version",
  "model_stage",
  "data_status",
  "safety_labels",
  "model",
  "summary",
  "qa_status",
  "defaultMatchday",
  "ownershipUsedAsSignal",
  "finalSquadsSourceBacked",
  "projectedKnockoutPath"
];

export const SLIMMED_PUBLIC_WRAPPERS = {
  recommendations: "fantasyPoolRecommendationsData.js",
  projections: "fantasyPoolMatchdayProjectionsData.js",
  scorePredictions: "fantasyPoolScorePredictionsData.js",
  teamBuilderArtifact: "teamBuilderFinalRoundArtifactData.js"
};

export const INTERNAL_ONLY_PUBLIC_FIELDS = [
  "diagnostics",
  "rawDiagnostics",
  "source_matches",
  "sfLineupSource",
  "sfLineupEvidenceId",
  "qfLineupSource",
  "qfLineupEvidenceId",
  "path_context",
  "minutes_context.evidence_notes",
  "input_files",
  "bracketSource",
  "blockedPlayers",
  "topOmittedByTeam",
  "omittedStarDiagnostics",
  "roleVolatilityDiagnostics",
  "rawExpectedPointsSquad"
];

function deepClone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function stripEmpty(value) {
  if (Array.isArray(value)) {
    return value.map(stripEmpty).filter((entry) => entry !== undefined);
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value)
      .map(([key, entry]) => [key, stripEmpty(entry)])
      .filter(([, entry]) => entry !== undefined);
    return entries.length ? Object.fromEntries(entries) : undefined;
  }
  return value === null || value === undefined || value === "" ? undefined : value;
}

function pickFields(source = {}, fields = []) {
  const output = {};
  fields.forEach((field) => {
    if (Object.hasOwn(source, field)) {
      output[field] = deepClone(source[field]);
    }
  });
  return stripEmpty(output) || {};
}

function compactFixtureContext(context = {}) {
  return pickFields(context, FIXTURE_CONTEXT_FIELDS);
}

function compactMinutesContext(context = {}) {
  return pickFields(context, MINUTES_CONTEXT_FIELDS);
}

function compactFinanceContext(context = {}) {
  return pickFields(context, FINANCE_CONTEXT_FIELDS);
}

function compactFinalRoundStrategy(strategy = {}) {
  return pickFields(strategy, FINAL_ROUND_STRATEGY_FIELDS);
}

function compactProjectionRow(row = {}) {
  return {
    ...pickFields(row, PROJECTION_ROW_FIELDS),
    ...(row.fixture_context ? { fixture_context: compactFixtureContext(row.fixture_context) } : {}),
    ...(row.minutes_context ? { minutes_context: compactMinutesContext(row.minutes_context) } : {})
  };
}

function compactRecommendationRow(row = {}) {
  return {
    ...pickFields(row, RECOMMENDATION_ROW_FIELDS),
    ...(row.fixture_context ? { fixture_context: compactFixtureContext(row.fixture_context) } : {}),
    ...(row.minutes_context ? { minutes_context: compactMinutesContext(row.minutes_context) } : {}),
    ...(row.finance_context ? { finance_context: compactFinanceContext(row.finance_context) } : {}),
    ...(row.final_round_strategy ? { final_round_strategy: compactFinalRoundStrategy(row.final_round_strategy) } : {})
  };
}

function compactScoreFixture(row = {}) {
  return pickFields(row, SCORE_FIXTURE_FIELDS);
}

function compactTeamFixture(row = {}) {
  return pickFields(row, TEAM_FIXTURE_FIELDS);
}

function compactTeamBuilderRow(row = {}) {
  return {
    ...pickFields(row, TEAM_BUILDER_ROW_FIELDS),
    ...(row.finalRoundStrategy ? { finalRoundStrategy: compactFinalRoundStrategy(row.finalRoundStrategy) } : {})
  };
}

function compactTopLevel(output = {}) {
  return pickFields(output, TOP_LEVEL_FIELDS);
}

// Public wrappers should carry rendering data, not model-debug traces.
export function compactPublicPayload(type, output = {}) {
  if (type === "recommendations") {
    return {
      ...compactTopLevel(output),
      recommendationCandidates: (output.recommendationCandidates || []).map(compactRecommendationRow)
    };
  }

  if (type === "projections") {
    return {
      ...compactTopLevel(output),
      playerMatchdayProjections: (output.playerMatchdayProjections || []).map(compactProjectionRow)
    };
  }

  if (type === "scorePredictions") {
    return {
      ...compactTopLevel(output),
      fixtureScorePredictions: (output.fixtureScorePredictions || []).map(compactScoreFixture),
      teamFixturePredictions: (output.teamFixturePredictions || []).map(compactTeamFixture)
    };
  }

  if (type === "teamBuilderArtifact") {
    return {
      ...compactTopLevel(output),
      strategy: deepClone(output.strategy || {}),
      objectiveExplanation: output.objectiveExplanation || "",
      constraintsUsed: deepClone(output.constraintsUsed || {}),
      selectedSquad: (output.selectedSquad || []).map(compactTeamBuilderRow),
      starters: (output.starters || []).map(compactTeamBuilderRow),
      bench: (output.bench || []).map(compactTeamBuilderRow),
      captain: deepClone(output.captain || null),
      viceCaptain: deepClone(output.viceCaptain || null),
      summary: deepClone(output.summary || {})
    };
  }

  return deepClone(output);
}

export function publicWrapperText(type, payload) {
  if (type === "recommendations") {
    return [
      "// Generated by scripts/buildFantasyPoolRecommendationsFinalRoundV1.mjs.",
      "// Slim public Final Round recommendations plus safely stage-scoped history rows.",
      `window.FANTASY_POOL_RECOMMENDATIONS_DATA = ${JSON.stringify(payload)};`,
      "window.FANTASY_POOL_RECOMMENDATION_CANDIDATES = window.FANTASY_POOL_RECOMMENDATIONS_DATA.recommendationCandidates;",
      "window.FANTASY_POOL_RECOMMENDATIONS_SUMMARY = window.FANTASY_POOL_RECOMMENDATIONS_DATA.summary;",
      ""
    ].join("\n");
  }

  if (type === "projections") {
    return [
      "// Generated by scripts/buildFantasyPoolMatchdayProjectionsFinalRoundV1.mjs.",
      "// Slim public Final Round projection data plus safely stage-scoped history rows.",
      `window.FANTASY_POOL_MATCHDAY_PROJECTIONS_DATA = ${JSON.stringify(payload)};`,
      "window.FANTASY_POOL_PLAYER_MATCHDAY_PROJECTIONS = window.FANTASY_POOL_MATCHDAY_PROJECTIONS_DATA.playerMatchdayProjections;",
      "window.FANTASY_POOL_MATCHDAY_PROJECTIONS_SUMMARY = window.FANTASY_POOL_MATCHDAY_PROJECTIONS_DATA.summary;",
      ""
    ].join("\n");
  }

  if (type === "scorePredictions") {
    return [
      "// Generated by scripts/buildScorePredictionsFantasyPoolFinalRoundV1.mjs.",
      "// Slim public Final Round score prediction data plus safely stage-scoped history rows.",
      `window.FANTASY_POOL_SCORE_PREDICTIONS_DATA = ${JSON.stringify(payload)};`,
      "window.FANTASY_POOL_SCORE_FIXTURE_PREDICTIONS = window.FANTASY_POOL_SCORE_PREDICTIONS_DATA.fixtureScorePredictions;",
      "window.FANTASY_POOL_TEAM_FIXTURE_PREDICTIONS = window.FANTASY_POOL_SCORE_PREDICTIONS_DATA.teamFixturePredictions;",
      "window.FANTASY_POOL_SCORE_PREDICTIONS_SUMMARY = window.FANTASY_POOL_SCORE_PREDICTIONS_DATA.summary;",
      ""
    ].join("\n");
  }

  if (type === "teamBuilderArtifact") {
    return [
      "// Generated by scripts/buildFinalRoundFantasyArtifactsV1.mjs.",
      "// Slim public Final Round Team Builder artifact; internal diagnostics remain in data/teamBuilderFinalRoundArtifact_v1.json.",
      `window.TEAM_BUILDER_FINAL_ROUND_ARTIFACT_DATA = ${JSON.stringify(payload)};`,
      ""
    ].join("\n");
  }

  throw new Error(`Unsupported public payload type: ${type}`);
}
