import { writeFile } from "node:fs/promises";

function round(value, digits = 3) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  const factor = 10 ** digits;
  return Math.round(number * factor) / factor;
}

function pickArray(value, limit = 8) {
  return Array.isArray(value) ? value.filter(Boolean).slice(0, limit) : [];
}

function shortText(value, limit = 180) {
  if (value === null || value === undefined) return null;
  const text = String(value).replace(/\s+/g, " ").trim();
  return text.length > limit ? `${text.slice(0, limit - 1)}...` : text;
}

function compactFixtureContext(context = {}) {
  if (!context || typeof context !== "object") return {};
  return {
    fixture_id: context.fixture_id || context.match_id || null,
    match_number: context.match_number ?? null,
    opponent_team_id: context.opponent_team_id || null,
    opponent: context.opponent || null,
    side: context.side || null,
    expected_goals: round(context.expected_goals ?? context.projected_xg ?? context.matchXg),
    expected_goals_against: round(context.expected_goals_against),
    win_probability: round(context.win_probability),
    draw_probability: round(context.draw_probability),
    loss_probability: round(context.loss_probability),
    clean_sheet_probability: round(context.clean_sheet_probability),
    base_clean_sheet_probability: round(context.base_clean_sheet_probability),
    clean_sheet_form_multiplier: round(context.clean_sheet_form_multiplier),
    clean_sheet_form_adjustment: round(context.clean_sheet_form_adjustment),
    defensive_form_label: context.defensive_form_label || null,
    fixture_difficulty_score: round(context.fixture_difficulty_score, 2),
    fixture_difficulty_band: context.fixture_difficulty_band || null,
    captain_environment_score: round(context.captain_environment_score, 1),
    matchUncertainty: context.matchUncertainty || context.match_uncertainty || context.uncertaintyLabel || null,
    upset_risk_probability: round(context.upset_risk_probability),
    upset_risk_band: context.upset_risk_band || null,
    live_fixture_status: context.live_fixture_status || null,
    live_round_status: context.live_round_status || null,
    live_score_status: context.live_score_status || null,
    live_status_display_only: context.live_status_display_only === true || undefined,
    known_or_projected_path_status: context.known_or_projected_path_status || null
  };
}

function compactMinutesContext(context = {}) {
  if (!context || typeof context !== "object") return {};
  return {
    role_label: context.role_label || null,
    role_confidence: context.role_confidence || null,
    evidence_level: context.evidence_level || null,
    md2_actual_fantasy_points: round(context.md2_actual_fantasy_points),
    md2_actual_points_available: context.md2_actual_points_available === true || undefined,
    two_game_actual_fantasy_points: round(context.two_game_actual_fantasy_points),
    two_game_projected_points: round(context.two_game_projected_points),
    two_game_projection_error: round(context.two_game_projection_error),
    two_game_form_evidence_type: context.two_game_form_evidence_type || null,
    md3_rotation_risk_category: context.md3_rotation_risk_category || null,
    md3_group_incentive_status: context.md3_group_incentive_status || null,
    r32_role_interpretation: context.r32_role_interpretation || null,
    r32_start_context: context.r32_start_context || null
  };
}

function stripNullish(object) {
  return Object.fromEntries(
    Object.entries(object).filter(([, value]) => value !== null && value !== undefined && value !== "")
  );
}

export function compactProjectionRow(row = {}) {
  const fixtureContext = compactFixtureContext(row.fixture_context || {});
  const minutesContext = compactMinutesContext(row.minutes_context || {});
  const flags = pickArray(row.data_quality_flags || row.dataQualityFlags, 6);
  return stripNullish({
    player_matchday_projection_id: row.player_matchday_projection_id || null,
    internal_player_id: row.internal_player_id || null,
    official_fantasy_player_id: row.official_fantasy_player_id || null,
    name: row.name || null,
    display_name: row.display_name || row.name || null,
    country: row.country || null,
    team_id: row.team_id || null,
    official_team_id: row.official_team_id || null,
    official_fantasy_position: row.official_fantasy_position || row.position || null,
    official_price: round(row.official_price ?? row.price, 1),
    selectable_status: row.selectable_status || null,
    matchday: row.matchday || row.matchday_id || null,
    matchday_label: row.matchday_label || null,
    opponent: row.opponent || fixtureContext.opponent || null,
    opponent_team_id: row.opponent_team_id || fixtureContext.opponent_team_id || null,
    fixture_id: row.fixture_id || fixtureContext.fixture_id || null,
    match_id: row.match_id || row.fixture_id || fixtureContext.fixture_id || null,
    match_number: row.match_number ?? fixtureContext.match_number ?? null,
    side: row.side || fixtureContext.side || null,
    expected_minutes: round(row.expected_minutes, 1),
    start_probability: round(row.start_probability),
    raw_expected_points: round(row.raw_expected_points ?? row.projectedPoints),
    risk_adjusted_points: round(row.risk_adjusted_points),
    floor_points: round(row.floor_points ?? row.floorPoints),
    ceiling_points: round(row.ceiling_points ?? row.ceilingPoints),
    captain_score: round(row.captain_score ?? row.captainUpsideScore),
    riskScore: round(row.riskScore),
    value_score: round(row.value_score ?? row.valueScore),
    projection_confidence: row.projection_confidence || null,
    role_label: row.role_label || row.roleTier || null,
    role_confidence: row.role_confidence || row.roleConfidence || null,
    roleTier: row.roleTier || row.role_label || null,
    caution: row.matchday === "r32" ? shortText(row.caution, 120) : null,
    fixture_context: stripNullish(fixtureContext),
    minutes_context: stripNullish(minutesContext),
    data_quality_flags: flags,
    modelVersion: row.matchday === "r32" ? row.modelVersion || row.model_version || null : null
  });
}

export function compactProjectionOutput(output = {}, rows = output.playerMatchdayProjections || []) {
  return {
    schema_version: output.schema_version,
    generated_at: output.generated_at,
    source_checked: output.source_checked,
    modelVersion: output.modelVersion || output.model_version,
    model_version: output.model_version || output.modelVersion,
    model_stage: output.model_stage,
    data_status: output.data_status,
    safety_labels: output.safety_labels || [],
    previous_active_projection_file: output.previous_active_projection_file || null,
    browser_ready_files_updated: true,
    input_files: output.input_files || [],
    model: output.model || {},
    summary: output.summary || {},
    qa_status: output.qa_status || null,
    playerMatchdayProjections: rows.map(compactProjectionRow),
    blockedPlayers: (output.blockedPlayers || []).map((row) => stripNullish({
      official_fantasy_player_id: row.official_fantasy_player_id,
      internal_player_id: row.internal_player_id,
      name: row.name,
      country: row.country,
      official_fantasy_position: row.official_fantasy_position || row.position,
      official_price: round(row.official_price ?? row.price, 1),
      selectable_status: row.selectable_status,
      roleTier: row.roleTier,
      projectedPoints: round(row.projectedPoints ?? row.raw_expected_points),
      risk_adjusted_points: round(row.risk_adjusted_points),
      captainUpsideScore: round(row.captainUpsideScore ?? row.captain_score),
      blocked_reasons: pickArray(row.blocked_reasons, 6),
      dataQualityFlags: pickArray(row.dataQualityFlags || row.data_quality_flags, 8)
    }))
  };
}

export async function writeProjectionBrowserData(filePath, output, options = {}) {
  const label = options.label || "Active fantasy-pool player projection browser data";
  const generator = options.generator || "generated projection compact writer";
  const compact = compactProjectionOutput(output, output.playerMatchdayProjections || []);
  const text = [
    `// Generated by ${generator}.`,
    `// ${label}.`,
    "window.FANTASY_POOL_MATCHDAY_PROJECTIONS_DATA = " + JSON.stringify(compact) + ";",
    "window.FANTASY_POOL_PLAYER_MATCHDAY_PROJECTIONS = window.FANTASY_POOL_MATCHDAY_PROJECTIONS_DATA.playerMatchdayProjections;",
    "window.FANTASY_POOL_MATCHDAY_PROJECTIONS_SUMMARY = window.FANTASY_POOL_MATCHDAY_PROJECTIONS_DATA.summary;",
    ""
  ].join("\n");
  await writeFile(filePath, text, "utf8");
  return compact;
}
