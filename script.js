// Static data scripts are loaded before this file. They expose player, rules,
// score-projection, and official fantasy-pool data on window globals, so the
// public site can run without fetching JSON at runtime.
const ACTIVE_DATA_VERSION = "20260718-final-round";
const ACTIVE_DATA = {
  version: ACTIVE_DATA_VERSION,
  players: Array.isArray(window.PLAYERS_DATA) ? window.PLAYERS_DATA : [],
  rules: window.FANTASY_RULES_DATA || null,
  recommendations: Array.isArray(window.FANTASY_POOL_RECOMMENDATION_CANDIDATES)
    ? window.FANTASY_POOL_RECOMMENDATION_CANDIDATES
    : [],
  projections: Array.isArray(window.FANTASY_POOL_PLAYER_MATCHDAY_PROJECTIONS)
    ? window.FANTASY_POOL_PLAYER_MATCHDAY_PROJECTIONS
    : [],
  finance: Array.isArray(window.FANTASY_POOL_PLAYER_FINANCE_METRICS)
    ? window.FANTASY_POOL_PLAYER_FINANCE_METRICS
    : [],
  score: {
    data: window.FANTASY_POOL_SCORE_PREDICTIONS_DATA || null,
    fixtureRows: Array.isArray(window.FANTASY_POOL_SCORE_FIXTURE_PREDICTIONS)
      ? window.FANTASY_POOL_SCORE_FIXTURE_PREDICTIONS
      : Array.isArray(window.FANTASY_POOL_SCORE_PREDICTIONS_DATA?.fixtureScorePredictions)
        ? window.FANTASY_POOL_SCORE_PREDICTIONS_DATA.fixtureScorePredictions
        : [],
    teamRows: Array.isArray(window.FANTASY_POOL_TEAM_FIXTURE_PREDICTIONS)
      ? window.FANTASY_POOL_TEAM_FIXTURE_PREDICTIONS
      : Array.isArray(window.FANTASY_POOL_SCORE_PREDICTIONS_DATA?.teamFixturePredictions)
        ? window.FANTASY_POOL_SCORE_PREDICTIONS_DATA.teamFixturePredictions
        : [],
    summary: window.FANTASY_POOL_SCORE_PREDICTIONS_SUMMARY || window.FANTASY_POOL_SCORE_PREDICTIONS_DATA?.summary || null
  },
  officialStatus: window.FANTASY_POOL_OFFICIAL_DATA_STATUS || null,
  liveMatchday: window.LIVE_MATCHDAY_STATUS_DATA || null,
  livePlayer: window.LIVE_PLAYER_STATUS_DATA || null,
  knockoutBracketPrediction: window.KNOCKOUT_BRACKET_PREDICTION_DATA || null,
  finalRoundFixtureAuthority: window.FINAL_ROUND_FIXTURE_AUTHORITY_DATA || null,
  teamBuilderFinalRoundArtifact: window.TEAM_BUILDER_FINAL_ROUND_ARTIFACT_DATA || null
};

function scorePredictionSourceFromWindow() {
  const fantasyPoolData = ACTIVE_DATA.score.data;
  const fantasyPoolRows = ACTIVE_DATA.score.fixtureRows;
  const fantasyPoolTeamRows = ACTIVE_DATA.score.teamRows;

  if (fantasyPoolRows.length) {
    const summary = {
      ...(ACTIVE_DATA.score.summary || {}),
      schema_version: fantasyPoolData?.schema_version || null,
      generated_at: fantasyPoolData?.generated_at || null,
      source_schema_version: fantasyPoolData?.schema_version || null,
      source_generated_at: fantasyPoolData?.generated_at || null,
      source_checked: fantasyPoolData?.source_checked || null,
      model_name: fantasyPoolData?.model?.model_name || null,
      formula_version: fantasyPoolData?.model?.formula_version || null,
      uncertainty_layer_version: fantasyPoolData?.model?.uncertainty_layer_version || null,
      data_source_label: "Final Round fantasy score projection context",
      fallback_context_label: "Static score projection backup",
      fixture_prediction_count: fantasyPoolRows.length,
      team_fixture_prediction_count: fantasyPoolTeamRows.length || null
    };

    return {
      key: fantasyPoolData?.model_version || fantasyPoolData?.modelVersion || "fantasy_pool_score_predictions_final_round_v1",
      label: "Final Round fantasy score projection context",
      browserFile: "fantasyPoolScorePredictionsData.js",
      sourceFile: "data/scorePredictions_fantasyPool_finalRound_v1.json",
      rows: fantasyPoolRows,
      summary
    };
  }

  return {
    key: "active_match_environment_unavailable",
    label: "Active Match Environment data unavailable",
    browserFile: "fantasyPoolScorePredictionsData.js",
    sourceFile: "data/scorePredictions_fantasyPool_finalRound_v1.json",
    rows: [],
    summary: ACTIVE_DATA.score.summary || null
  };
}

const positionCodeLabels = {
  GK: "Goalkeeper",
  DEF: "Defender",
  MID: "Midfielder",
  FWD: "Forward"
};

const positionLabelCodes = Object.entries(positionCodeLabels).reduce((codes, [code, label]) => {
  codes[label] = code;
  return codes;
}, {});

function normalizeFantasyPositionCode(position) {
  const rawPosition = String(position || "").trim();
  const upperPosition = rawPosition.toUpperCase();
  const lowerPosition = rawPosition.toLowerCase();

  if (positionCodeLabels[upperPosition]) {
    return upperPosition;
  }

  if (lowerPosition.startsWith("goalkeeper") || lowerPosition === "keeper") {
    return "GK";
  }

  if (lowerPosition.startsWith("defender") || lowerPosition === "defence" || lowerPosition === "defense") {
    return "DEF";
  }

  if (lowerPosition.startsWith("midfielder") || lowerPosition === "midfield") {
    return "MID";
  }

  if (lowerPosition.startsWith("forward") || lowerPosition === "striker" || lowerPosition === "attacker") {
    return "FWD";
  }

  return null;
}

function fantasyPositionLabelFromCode(positionCode) {
  return positionCodeLabels[positionCode] || positionCode || "Position needs check";
}

function officialFantasyPositionLookupKeys(record) {
  const idValues = [
    ["official", record?.official_fantasy_player_id],
    ["official", record?.officialFantasyPlayerId],
    ["internal", record?.internal_player_id],
    ["internal", record?.matched_existing_player_id],
    ["internal", record?.source_player_id],
    ["internal", record?.player_id],
    ["internal", record?.id],
    ["internal", record?.preview_player_key]
  ];
  const keys = idValues
    .filter(([, valueToCheck]) => valueToCheck !== null && valueToCheck !== undefined && String(valueToCheck).trim())
    .map(([type, valueToCheck]) => `${type}:${String(valueToCheck).trim()}`);
  const nameKey = normalizeText(record?.name || record?.display_name || "");
  const countryKey = normalizeText(record?.country || "");

  if (nameKey && countryKey) {
    keys.push(`name-country:${nameKey}|${countryKey}`);
  }

  return Array.from(new Set(keys));
}

function buildOfficialFantasyPositionLookup(records) {
  const lookup = new Map();

  records.forEach((record) => {
    const positionCode = normalizeFantasyPositionCode(record?.official_fantasy_position || record?.officialFantasyPosition);

    if (!positionCode) {
      return;
    }

    const positionInfo = {
      code: positionCode,
      label: fantasyPositionLabelFromCode(positionCode),
      source: record?.position_source || "official_fifa_fantasy_feed",
      official: true,
      record
    };

    officialFantasyPositionLookupKeys(record).forEach((key) => {
      if (!lookup.has(key) || positionInfo.source === "official_fifa_fantasy_feed") {
        lookup.set(key, positionInfo);
      }
    });
  });

  return lookup;
}

function officialFantasyPositionRecordForPlayer(player) {
  for (const key of officialFantasyPositionLookupKeys(player)) {
    const positionInfo = officialFantasyPositionLookup.get(key);
    if (positionInfo) {
      return positionInfo;
    }
  }

  const directOfficialPosition = normalizeFantasyPositionCode(player?.official_fantasy_position || player?.officialFantasyPosition);
  if (directOfficialPosition) {
    return {
      code: directOfficialPosition,
      label: fantasyPositionLabelFromCode(directOfficialPosition),
      source: player?.position_source || "official_fantasy_position_field",
      official: true,
      record: player
    };
  }

  const fantasyPositionAlias = normalizeFantasyPositionCode(player?.fantasyPosition || player?.fantasy_position);
  if (fantasyPositionAlias) {
    return {
      code: fantasyPositionAlias,
      label: fantasyPositionLabelFromCode(fantasyPositionAlias),
      source: player?.position_source || "fantasy_position_alias",
      official: false,
      record: player
    };
  }

  const fallbackPosition = normalizeFantasyPositionCode(player?.position_code || player?.position);
  return fallbackPosition ? {
    code: fallbackPosition,
    label: fantasyPositionLabelFromCode(fallbackPosition),
    source: "fallback_non_official_position",
    official: false,
    caution: true,
    record: player
  } : {
    code: null,
    label: "Position needs check",
    source: "missing_position",
    official: false,
    caution: true,
    record: player
  };
}

function normalizePublicPlayerFantasyPosition(player) {
  const positionInfo = officialFantasyPositionRecordForPlayer(player);
  const fallbackPositionCode = normalizeFantasyPositionCode(player?.position_code || player?.position);
  const sourceFlags = new Set(Array.isArray(player?.source_review_flags) ? player.source_review_flags : []);

  if (positionInfo.caution || !positionInfo.official) {
    sourceFlags.add("fantasy_position_fallback_needs_official_review");
  }

  if (positionInfo.official && fallbackPositionCode && fallbackPositionCode !== positionInfo.code) {
    sourceFlags.add("position_conflict_audit");
  }

  return {
    ...player,
    position: positionInfo.label,
    fantasyPosition: positionInfo.label,
    officialFantasyPosition: positionInfo.official ? positionInfo.code : null,
    official_fantasy_position: positionInfo.official ? positionInfo.code : player?.official_fantasy_position || null,
    position_code: positionInfo.code,
    positionSource: positionInfo.source,
    position_source: positionInfo.source,
    external_position: positionInfo.official && fallbackPositionCode && fallbackPositionCode !== positionInfo.code
      ? player?.position
      : player?.external_position || null,
    fantasy_position_caution: Boolean(positionInfo.caution || !positionInfo.official),
    source_review_flags: Array.from(sourceFlags)
  };
}

const fantasyPoolPreviewStatus = ACTIVE_DATA.officialStatus;
const fantasyPoolRecommendationRows = ACTIVE_DATA.recommendations;
const fantasyPoolProjectionRows = ACTIVE_DATA.projections;
const fantasyPoolFinanceRows = ACTIVE_DATA.finance;
const activeFantasyPlayerRecords = Array.isArray(fantasyPoolPreviewStatus?.official_position_records)
  ? fantasyPoolPreviewStatus.official_position_records
  : [];
const officialFantasyPositionLookup = buildOfficialFantasyPositionLookup([
  ...activeFantasyPlayerRecords,
  ...fantasyPoolRecommendationRows,
  ...fantasyPoolProjectionRows,
  ...fantasyPoolFinanceRows
]);
const rawPlayerSource = ACTIVE_DATA.players;
const rawPlayers = rawPlayerSource.map(normalizePublicPlayerFantasyPosition);
const rawPlayerById = new Map();
rawPlayers.forEach((player) => {
  [
    player?.id,
    player?.internal_player_id,
    player?.source_player_id,
    player?.official_fantasy_player_id
  ].filter(Boolean).forEach((id) => {
    if (!rawPlayerById.has(String(id))) {
      rawPlayerById.set(String(id), player);
    }
  });
});
const playersDataById = rawPlayerById;

function activeFantasyPlayerIdentityValues(record) {
  return [
    record?.official_fantasy_player_id,
    record?.officialFantasyPlayerId,
    record?.internal_player_id,
    record?.matched_existing_player_id,
    record?.source_player_id,
    record?.player_id,
    record?.id,
    record?.preview_player_key
  ].filter((value) => value !== null && value !== undefined && String(value).trim())
    .map((value) => String(value).trim());
}

function activeFantasyPlayerSlug(record) {
  const nameKey = normalizeText(record?.name || record?.display_name || "");
  const teamKey = normalizeText(record?.country || record?.team || record?.team_id || "");
  return nameKey && teamKey ? `${nameKey}|${teamKey}` : "";
}

const activeFantasyPlayerById = new Map();
const activeFantasyPlayerBySlug = new Map();
activeFantasyPlayerRecords.forEach((record) => {
  activeFantasyPlayerIdentityValues(record).forEach((id) => {
    if (!activeFantasyPlayerById.has(id)) {
      activeFantasyPlayerById.set(id, record);
    }
  });

  const slug = activeFantasyPlayerSlug(record);
  if (slug && !activeFantasyPlayerBySlug.has(slug)) {
    activeFantasyPlayerBySlug.set(slug, record);
  }
});

function activeFantasyPlayerForRecord(record) {
  for (const id of activeFantasyPlayerIdentityValues(record)) {
    const officialRecord = activeFantasyPlayerById.get(id);
    if (officialRecord) {
      return officialRecord;
    }
  }

  const slug = activeFantasyPlayerSlug(record);
  return slug ? activeFantasyPlayerBySlug.get(slug) || null : null;
}

const officialUnavailablePlayerRecords = fantasyPoolPreviewStatus?.unavailable_players || [];
const officialUnavailablePlayerNames = new Set(
  officialUnavailablePlayerRecords.map((player) => normalizeText(player.name || "")).filter(Boolean)
);
const officialUnavailablePlayerIds = new Set(
  officialUnavailablePlayerRecords
    .flatMap((player) => [player.official_fantasy_player_id, player.internal_player_id])
    .filter(Boolean)
    .map(String)
);
const activeScorePredictionSource = scorePredictionSourceFromWindow();
const scorePredictionRows = activeScorePredictionSource.rows;
const scorePredictionSummary = activeScorePredictionSource.summary;
const liveMatchdayStatusData = ACTIVE_DATA.liveMatchday;
const livePlayerStatusData = ACTIVE_DATA.livePlayer;
const knockoutBracketPredictionData = ACTIVE_DATA.knockoutBracketPrediction;
const liveFixtureRows = Array.isArray(liveMatchdayStatusData?.fixtures) ? liveMatchdayStatusData.fixtures : [];
const liveRoundRows = Array.isArray(liveMatchdayStatusData?.rounds) ? liveMatchdayStatusData.rounds : [];
const livePlayerRows = Array.isArray(livePlayerStatusData?.players) ? livePlayerStatusData.players : [];
const knockoutKnownPredictionRows = scorePredictionRows.filter((row) => {
  const matchdayId = String(row?.fantasy_matchday_id || row?.matchday_id || "").toLowerCase();
  const status = String(row?.fixture_authority_status || "").toLowerCase();
  const homeTeam = normalizeText(row?.home_team);
  const awayTeam = normalizeText(row?.away_team);
  return matchdayId === "finalround" &&
    status === "final_known" &&
    homeTeam &&
    awayTeam &&
    homeTeam !== "tbd" &&
    awayTeam !== "tbd";
});
const usingFantasyPoolPreview = Boolean(fantasyPoolPreviewStatus && fantasyPoolRecommendationRows.length);
const defaultMatchdayOptions = [
  { matchday_id: "finalRound", label: "Final Round" },
  { matchday_id: "sf", label: "SF" },
  { matchday_id: "qf", label: "QF" },
  { matchday_id: "r16", label: "R16" },
  { matchday_id: "r32", label: "Round of 32" },
  { matchday_id: "group_stage_full", label: "Full Group Stage" },
  { matchday_id: "md1", label: "Matchday 1" },
  { matchday_id: "md2", label: "Matchday 2" },
  { matchday_id: "md3", label: "Matchday 3" }
];
const matchdayOptions = defaultMatchdayOptions;
const defaultPublicMatchdayId = "finalRound";
const defaultActiveMatchdayId = matchdayOptions.some((option) => option.matchday_id === defaultPublicMatchdayId)
  ? defaultPublicMatchdayId
  : matchdayOptions[0]?.matchday_id || "group_stage_full";
const defaultPickProjectionMatchdayId = defaultActiveMatchdayId;
let activeMatchdayId = defaultActiveMatchdayId;
let activeEnvironmentMatchdayId = defaultActiveMatchdayId;
let activeTrustModeId = "balanced";
let activeAdvicePoolModeId = "playable";
let activeQuickPickModelKey = "expected";
let activeQuickPickPosition = "All";
const browserSquadStorageKey = "worldCupFantasyHelper.teamExport.v1";

function teamEligibilityKeys(record) {
  return [
    record?.team_id,
    record?.teamId,
    record?.country,
    record?.team,
    record?.name,
    record?.code,
    record?.official_team_code,
    record?.preview_candidate?.team_id,
    record?.preview_candidate?.country,
    record?.preview_candidate?.team,
    record?.preview_candidate?.code
  ]
    .map(normalizeText)
    .filter(Boolean);
}

function getActiveStageEligibleTeams(matchdayId = activeMatchdayId) {
  if (matchdayId !== "finalRound") {
    return null;
  }

  const fixtures = Array.isArray(ACTIVE_DATA.finalRoundFixtureAuthority?.fixtures)
    ? ACTIVE_DATA.finalRoundFixtureAuthority.fixtures
    : [];
  const keys = new Set();

  fixtures.forEach((fixture) => {
    [fixture.team_a, fixture.team_b].filter(Boolean).forEach((team) => {
      teamEligibilityKeys(team).forEach((key) => keys.add(key));
    });
  });

  return keys;
}

function recordMatchesActiveStageEligibleTeam(record, matchdayId = activeMatchdayId) {
  const eligibleTeams = getActiveStageEligibleTeams(matchdayId);
  if (!eligibleTeams) {
    return true;
  }

  return teamEligibilityKeys(record).some((key) => eligibleTeams.has(key));
}

function playerHasActiveMatchdayProjection(player, matchdayId = activeMatchdayId) {
  if (!player || matchdayId === "group_stage_full") {
    return true;
  }

  return projectionIsAvailable(projectionForPlayerMatchday(player, matchdayId));
}

function playerAllowedForActiveMatchday(player, matchdayId = activeMatchdayId) {
  if (matchdayId !== "finalRound") {
    return true;
  }

  return recordMatchesActiveStageEligibleTeam(player, matchdayId) &&
    playerHasActiveMatchdayProjection(player, matchdayId);
}

function finalRoundPlayerStrategicMetrics(player) {
  const projection = activeMatchdayId === "finalRound" ? activeProjection(player) : null;
  const fixtureStage = projection?.fixture_stage || player?.preview_candidate?.fixture_stage || "";
  const isEarlyFixture = fixtureStage === "third_place";
  const raw = scoreValue(player, "finance_risk_adjusted_return_points", "risk_adjusted_expected_points_estimate");
  const start = scoreValue(player, "start_probability_percent") / 100;
  const minutes = scoreValue(player, "expected_minutes_v0");
  const captain = scoreValue(player, "finance_captain_score");
  const ceiling = scoreValue(player, "finance_upside_p90_points", "euro_style_points_per90_estimate");
  const floor = scoreValue(player, "finance_var10_points");
  const roleVolatility = Number(projection?.role_volatility_score ?? (projection?.third_place_rotation_risk ? 0.24 : 0.08));
  const fixture = projection?.fixture_context || {};
  const teamXg = firstFiniteNumberOrMissing(fixture.expected_goals, projection?.team_expected_goals) || 0;
  const opponentXg = firstFiniteNumberOrMissing(fixture.expected_goals_against, projection?.team_expected_goals_against) || 0;
  const cleanSheet = firstFiniteNumberOrMissing(fixture.clean_sheet_probability, projection?.team_clean_sheet_probability) || 0;
  const goalEnvironment = teamXg + opponentXg;
  const earlyFixtureOptionalityBonus = isEarlyFixture
    ? Math.min(2.35, Math.max(0, raw - 1.6) * 0.36 + start * 0.75 + Math.min(1, minutes / 90) * 0.45)
    : 0;
  const replacementOptionValue = isEarlyFixture
    ? earlyFixtureOptionalityBonus + Math.max(0, ceiling - raw) * 0.18 + Math.max(0, floor) * 0.04
    : 0;
  const lateFixtureReplacementValue = isEarlyFixture
    ? 0
    : Math.min(0.45, Math.max(0, raw - 2.5) * 0.08 + start * 0.12);
  const thirdPlaceUpsideModifier = isEarlyFixture
    ? Math.max(0, goalEnvironment - 2.45) * 0.75 + Math.max(0, ceiling - raw) * 0.16
    : 0;
  const thirdPlaceRiskPenalty = isEarlyFixture
    ? 0.55 + Math.max(0, 0.72 - start) * 1.25 + roleVolatility * 1.9
    : 0;
  const roleVolatilityPenalty = roleVolatility * 2.5 + (projection?.majorRoleCaution ? 1.4 : 0);
  const strategicScore =
    earlyFixtureOptionalityBonus * 7.5 +
    replacementOptionValue * 5.2 +
    lateFixtureReplacementValue * 1.2 +
    thirdPlaceUpsideModifier * 4.8 +
    (["Goalkeeper", "Defender"].includes(player.position) ? Math.max(0, cleanSheet - 0.22) * 3.2 : 0) +
    Math.max(0, goalEnvironment - 2.25) * 2.4 -
    thirdPlaceRiskPenalty * 4.1 -
    roleVolatilityPenalty * 1.8;

  return {
    fixtureStage,
    fixtureTiming: isEarlyFixture ? "early" : "late",
    kickoffOrder: isEarlyFixture ? 1 : 2,
    earlyFixtureOptionalityBonus,
    replacementOptionValue,
    lateFixtureReplacementValue,
    thirdPlaceUpsideModifier,
    thirdPlaceRiskPenalty,
    roleVolatilityPenalty,
    strategicScore,
    rawProjectedPoints: raw,
    teamXg,
    opponentXg,
    cleanSheet
  };
}

function finalRoundStrategicPlayerScore(player, role = "starter") {
  if (activeMatchdayId !== "finalRound") {
    return 0;
  }

  const metrics = finalRoundPlayerStrategicMetrics(player);
  const roleMultiplier = role === "bench" ? 0.82 : 1;
  return metrics.strategicScore * roleMultiplier;
}

function activeDataBadgeHtml() {
  return `
    <span class="model-data-badge" title="Public Final Round page uses only the current active static data path.">
      Final Round fantasy setup · Active static data path · ${ACTIVE_DATA.version}
    </span>
  `;
}

function modelDataWarningHtml(messages, options = {}) {
  const warnings = Array.isArray(messages) ? messages.filter(Boolean) : [messages].filter(Boolean);

  if (!warnings.length) {
    return "";
  }

  const className = options.className ? ` ${options.className}` : "";
  const title = options.title || "Active data warning";

  return `
    <div class="method-note method-note--warning model-data-warning${className}" role="status">
      <strong>${escapeHtml(title)}:</strong>
      ${escapeHtml(warnings.join(" "))}
    </div>
  `;
}

function modelDataWarningInlineHtml(messages, options = {}) {
  const warnings = Array.isArray(messages) ? messages.filter(Boolean) : [messages].filter(Boolean);

  if (!warnings.length) {
    return "";
  }

  const title = options.title || "Active data warning";

  return `<span class="model-data-warning-inline"><strong>${escapeHtml(title)}:</strong> ${escapeHtml(warnings.join(" "))}</span>`;
}

function hasActiveRecommendations(matchdayId = activeMatchdayId) {
  if (!fantasyPoolRecommendationRows.length) {
    return false;
  }

  if (!matchdayId || matchdayId === "group_stage_full") {
    return true;
  }

  return fantasyPoolRecommendationRows.some((row) => row.matchday === matchdayId);
}

function currentFantasyPoolFallbackWarning(mode, matchdayId = activeMatchdayId) {
  if (!mode || !matchdayId || matchdayId === "group_stage_full") {
    return "";
  }

  const hasMatchdayRows = fantasyPoolRecommendationRows.some((candidate) =>
    candidate.mode === mode && candidate.matchday === matchdayId
  );
  const hasGroupRows = fantasyPoolRecommendationRows.some((candidate) =>
    candidate.mode === mode && candidate.matchday === "group_stage_full"
  );

  return !hasMatchdayRows && hasGroupRows
    ? `${matchdayLabelFromId(matchdayId)}-specific ${titleFromSnake(mode).toLowerCase()} recommendations are unavailable; showing current fantasyPool group-stage fallback.`
    : "";
}

function activeDataWarningsForSection(section, options = {}) {
  const warnings = [];
  const matchdayId = options.matchdayId || activeMatchdayId;

  if (["home", "picks", "captain", "team_builder", "matchday_desk"].includes(section) && !fantasyPoolRecommendationRows.length) {
    warnings.push("Active fantasyPool recommendations unavailable.");
  }

  if (["home", "picks", "captain"].includes(section) && !hasActiveRecommendations(matchdayId)) {
    warnings.push(`${matchdayLabelFromId(matchdayId)} recommendations unavailable.`);
  }

  if (["home", "picks", "captain"].includes(section) && options.mode) {
    const fallbackWarning = currentFantasyPoolFallbackWarning(options.mode, matchdayId);
    if (fallbackWarning) {
      warnings.push(fallbackWarning);
    }
  }

  if (["player_profile", "team_builder", "matchday_desk"].includes(section) && !fantasyPoolProjectionRows.length) {
    warnings.push("Active fantasyPool matchday projections unavailable.");
  }

  if (["picks", "player_profile", "team_builder", "fantasy_finance"].includes(section) && !fantasyPoolFinanceRows.length) {
    warnings.push("Active fantasyPool finance metrics unavailable.");
  }

  if (["picks", "captain", "team_builder", "matchday_desk"].includes(section) && !currentFantasyPoolPlayers.length) {
    warnings.push("Active official fantasy player pool unavailable.");
  }

  if (section === "match_environment" && !scorePredictionRows.length) {
    warnings.push("Active Match Environment data unavailable.");
  }

  return Array.from(new Set(warnings));
}

function isUnavailableInOfficialFantasy(player) {
  const candidateIds = [
    player?.id,
    player?.internal_player_id,
    player?.official_fantasy_player_id,
    player?.source_player_id
  ].filter(Boolean).map(String);
  const nameKey = normalizeText(player?.name || "");

  return candidateIds.some((id) => officialUnavailablePlayerIds.has(id)) ||
    (nameKey && officialUnavailablePlayerNames.has(nameKey));
}

const projectionFieldMap = {
  risk_adjusted_overall_score: "finance_strategy_risk_adjusted",
  risk_adjusted_expected_points_estimate: "finance_risk_adjusted_return_points",
  euro_style_points_per90_estimate: "finance_upside_p90_points",
  euro_style_reliability_score: "finance_minutes_security_score",
  risk_composite_score: "finance_composite_risk_score",
  risk_tail_score: "finance_tail_risk_score",
  attack_score: "finance_strategy_attack_heavy",
  defense_score: "finance_strategy_defensive_heavy"
};

const scorePredictionLookup = new Map(scorePredictionRows.map((row) => [row.fixture_id, row]));
const liveFixtureLookup = buildLiveFixtureLookup(liveFixtureRows);
const liveRoundLookup = new Map(liveRoundRows
  .filter((round) => round.round_id)
  .map((round) => [String(round.round_id), round]));
const livePlayerByOfficialId = new Map(livePlayerRows
  .filter((player) => player.official_fantasy_player_id)
  .map((player) => [String(player.official_fantasy_player_id), player]));
const fantasyPoolFinanceLookup = fantasyPoolFinanceRows.reduce((lookup, row) => {
  const key = fantasyPoolPlayerKey(row);
  if (key) {
    lookup.set(key, row);
  }
  return lookup;
}, new Map());
const fantasyPoolPreviewProjectionLookup = fantasyPoolProjectionRows.reduce((lookup, row) => {
  const key = fantasyPoolPlayerKey(row);
  if (!key) {
    return lookup;
  }
  const projectionMap = lookup.get(key) || {};
  const normalizedProjection = normalizeFantasyPoolProjection(row);
  projectionMap[normalizedProjection.matchday_id] = normalizedProjection;
  lookup.set(key, projectionMap);
  return lookup;
}, new Map());
const fantasyPoolRecommendationLookup = fantasyPoolRecommendationRows.reduce((lookup, row) => {
  const key = fantasyPoolPlayerKey(row);
  if (!key) {
    return lookup;
  }

  const candidates = lookup.get(key) || [];
  candidates.push(row);
  lookup.set(key, candidates);
  return lookup;
}, new Map());
const financeByPlayerId = fantasyPoolFinanceLookup;
const projectionByPlayerId = fantasyPoolPreviewProjectionLookup;
const recommendationByPlayerId = fantasyPoolRecommendationLookup;
const fantasyPoolPreviewPlayers = usingFantasyPoolPreview
  ? fantasyPoolRecommendationRows.map(fantasyPoolCandidateToPlayer).filter(Boolean)
  : [];
const fantasyPoolPreviewPlayerById = new Map(fantasyPoolPreviewPlayers.map((player) => [player.id, player]));
const currentFantasyPoolPlayers = buildCurrentFantasyPoolPlayers();
const players = currentFantasyPoolPlayers;
const fantasyPoolPreviewPlayerByOfficialId = new Map(players
  .filter((player) => player.official_fantasy_player_id)
  .map((player) => [String(player.official_fantasy_player_id), player]));
const teamBuilderDataSourceSummary = {
  source: "official_fantasy_pool_with_current_model_fields",
  official_player_rows: fantasyPoolPreviewStatus?.official_position_records?.length || 0,
  selectable_official_rows: currentFantasyPoolPlayers.length || 0,
  player_source_rows: rawPlayers.length,
  finance_metric_rows: fantasyPoolFinanceRows.length,
  projection_rows: fantasyPoolProjectionRows.length,
  recommendation_rows: fantasyPoolRecommendationRows.length,
  score_fixture_rows: scorePredictionRows.length
};
const primaryStrategyKeys = ["balanced", "safe", "upside", "differential"];
const publicPickModelCopy = {
  expected: {
    label: "Projected Points",
    cardLabel: "Top Projection",
    help: "Favors the highest expected fantasy return.",
    cardDescription: "Projected Points favors the highest expected fantasy return."
  },
  balanced: {
    label: "Core Picks",
    cardLabel: "Core Pick",
    help: "Balances projected return with reliable starts and minutes.",
    cardDescription: "Core Picks balance projected return with reliable starts and minutes."
  },
  safe: {
    label: "High-Floor Picks",
    cardLabel: "High-Floor Pick",
    help: "Prioritizes safer minutes and lower downside.",
    cardDescription: "High-Floor Picks prioritize safer minutes and lower downside."
  },
  upside: {
    label: "Upside Picks",
    cardLabel: "Upside Pick",
    help: "Chases higher ceilings in stronger attacking spots.",
    cardDescription: "Upside Picks chase higher ceilings in stronger attacking spots."
  },
  bestValue: {
    label: "Value Picks",
    cardLabel: "Value Pick",
    help: "Looks for strong return for the price.",
    cardDescription: "Value Picks look for strong return for the price."
  },
  cheapEnabler: {
    label: "Budget Enabler",
    cardLabel: "Budget Enabler",
    help: "Highlights lower-price players with a playable role.",
    cardDescription: "Budget Enabler highlights lower-price players with a playable role."
  },
  differential: {
    label: "Differential Picks",
    cardLabel: "Differential Pick",
    help: "Finds less obvious picks that still project well.",
    cardDescription: "Differential Picks find less obvious picks that still project well."
  },
  captain: {
    label: "Captain Watchlist",
    cardLabel: "Captain Option",
    help: "Dedicated captain lane for armband candidates.",
    cardDescription: "Captain Watchlist highlights armband candidates without treating captain as a normal pick model."
  },
  valueQuant: {
    label: "Advanced Value Variant",
    cardLabel: "Advanced Value",
    help: "Internal value variant used for model notes and compatibility.",
    cardDescription: "Advanced value variant used for model notes and older exports."
  },
  riskControl: {
    label: "Advanced Safety Variant",
    cardLabel: "Advanced Safety",
    help: "Internal safety variant used for model notes and compatibility.",
    cardDescription: "Advanced safety variant used for model notes and older exports."
  }
};
const publicPickModelOptionKeys = ["expected", "balanced", "safe", "upside", "bestValue", "differential"];
const decisionStrategyOptionKeys = ["balanced", "safe", "upside", "differential"];

function fantasyPoolPlayerKey(record) {
  return String(record?.official_fantasy_player_id || record?.internal_player_id || "").trim();
}

function fantasyPoolPreviewPlayerId(candidate) {
  return [
    "fantasy-pool-preview",
    candidate.mode || "mode",
    candidate.matchday || "group_stage_full",
    fantasyPoolPlayerKey(candidate)
  ].join(":");
}

function confidenceScore(confidence) {
  const scores = {
    high: 90,
    medium: 72,
    low: 48,
    thin_profile: 35,
    missing: 35,
    blocked: 0
  };

  return scores[confidence] ?? 60;
}

function importantPreviewFlags(flags = []) {
  const priorityFlags = [
    "fantasy_pool_only_not_final_squad_confirmed",
    "final_squad_source_missing",
    "rules_manual_review",
    "mystery_booster_unknown",
    "deadline_semantics_review",
    "squad_review_rows_present",
    "high_team_context_uncertainty",
    "not_final_squad_backed",
    "not_final_public_recommendations",
    "not_Team_Builder_ready",
    "missing_national_team_usage_review",
    "position_conflict_audit",
    "brazil_neymar_uncertainty"
  ];

  return priorityFlags.filter((flag) => flags.includes(flag));
}

function fantasyPoolRiskScore(candidate, financeMetric) {
  const numberFrom = (...values) => {
    for (const valueToCheck of values) {
      const number = Number(valueToCheck);
      if (Number.isFinite(number)) {
        return number;
      }
    }
    return null;
  };
  const financeContext = candidate?.finance_context || {};
  const startProbability = Math.min(1, Math.max(0, numberFrom(candidate?.start_probability, financeMetric?.average_start_probability, 0) ?? 0));
  const expectedMinutes = Math.max(0, numberFrom(candidate?.expected_minutes, financeMetric?.average_expected_minutes, 0) ?? 0);
  const downsideRisk = numberFrom(financeContext.downside_risk_score, financeMetric?.downside_risk_score);
  const volatilityRisk = numberFrom(financeContext.volatility_score, financeMetric?.volatility_score);
  const roleStability = numberFrom(financeContext.role_stability_score, financeMetric?.role_stability_score);
  const ceilingPoints = numberFrom(candidate?.ceiling_points, 0) ?? 0;
  const floorPoints = numberFrom(candidate?.floor_points, 0) ?? 0;

  const startRisk = Math.max(0, 1 - startProbability) * 45;
  const minutesRisk = Math.max(0, 75 - expectedMinutes) * 0.35;
  const confidenceRisk = Math.max(0, 90 - confidenceScore(candidate?.projection_confidence || financeMetric?.projection_confidence)) * 0.5;
  const downsideRiskContribution = downsideRisk === null ? 8 : downsideRisk * 0.22;
  const volatilityRiskContribution = volatilityRisk === null ? 6 : volatilityRisk * 0.13;
  const roleRiskContribution = roleStability === null ? 6 : Math.max(0, 100 - roleStability) * 0.16;
  const floorSpreadRisk = Math.max(0, ceilingPoints - floorPoints) * 0.12;

  return Math.min(
    100,
    startRisk +
      minutesRisk +
      confidenceRisk +
      downsideRiskContribution +
      volatilityRiskContribution +
      roleRiskContribution +
      floorSpreadRisk
  );
}

function normalizeFantasyPoolProjection(row) {
  const fixture = row.fixture_context || {};
  const matchdayId = row.matchday || row.matchday_id || "group_stage_full";

  return {
    ...row,
    player_id: fantasyPoolPlayerKey(row),
    matchday_id: matchdayId,
    matchday_label: row.matchday_label || matchdayLabelFromId(matchdayId),
    opponent: row.opponent || fixture.opponent || "Opponent needs check",
    fixture_difficulty_score: fixture.fixture_difficulty_score ?? row.fixture_difficulty_score ?? null,
    fixture_difficulty_band: fixture.fixture_difficulty_band ?? row.fixture_difficulty_band ?? null,
    team_expected_goals: fixture.expected_goals ?? row.team_expected_goals ?? null,
    team_expected_goals_against: fixture.expected_goals_against ?? row.team_expected_goals_against ?? null,
    team_clean_sheet_probability: fixture.clean_sheet_probability ?? row.team_clean_sheet_probability ?? null,
    team_win_probability: fixture.win_probability ?? row.team_win_probability ?? null,
    match_upset_risk_probability: fixture.upset_risk_probability ?? row.match_upset_risk_probability ?? null,
    match_goal_environment: fixture.goal_environment ?? row.match_goal_environment ?? null,
    fixture_use: "current_official_fantasy_pool",
    finance_expected_return_points: row.raw_expected_points,
    finance_risk_adjusted_return_points: row.risk_adjusted_points,
    finance_upside_p90_points: row.ceiling_points,
    finance_captain_score: row.captain_score,
    finance_strategy_risk_adjusted: row.risk_adjusted_points,
    expected_minutes_v0: row.expected_minutes,
    start_probability_percent: Number(row.start_probability || 0) * 100,
    country_role: row.minutes_context?.role_label || row.role_label
  };
}

function fantasyPoolCandidateToPlayer(candidate) {
  const key = fantasyPoolPlayerKey(candidate);
  const officialRecord = activeFantasyPlayerForRecord(candidate);

  if (!officialRecord) {
    return null;
  }

  const officialFantasyPlayerId = String(officialRecord.official_fantasy_player_id || key || "");
  const financeMetric = financeByPlayerId.get(officialFantasyPlayerId) || financeByPlayerId.get(key) || {};
  const projectionMap = projectionByPlayerId.get(officialFantasyPlayerId) || projectionByPlayerId.get(key) || {};
  const positionCode = normalizeFantasyPositionCode(
    officialRecord.official_fantasy_position ||
    candidate.official_fantasy_position ||
    financeMetric.official_fantasy_position
  ) || "UNK";
  const confidence = candidate.projection_confidence || financeMetric.projection_confidence || "low";
  const dataConfidence = confidenceScore(confidence);
  const startProbability = Number(candidate.start_probability || financeMetric.average_start_probability || 0);
  const expectedMinutes = Number(candidate.expected_minutes || financeMetric.average_expected_minutes || 0);
  const riskScore = fantasyPoolRiskScore(candidate, financeMetric);
  const price = firstFiniteNumberOrMissing(
    officialRecord.official_price,
    candidate.official_price,
    financeMetric.official_price
  ) || 0;
  const flags = importantPreviewFlags(candidate.data_quality_flags || financeMetric.data_quality_flags || []);
  const valueScore = Number(candidate.value_score || financeMetric.risk_adjusted_points_per_price || 0);
  const recommendationScore = Number(candidate.recommendation_score || candidate.risk_adjusted_points || 0);
  const internalPlayerId = officialRecord.internal_player_id ||
    officialRecord.matched_existing_player_id ||
    candidate.internal_player_id ||
    null;

  return normalizePublicPlayerFantasyPosition({
    id: fantasyPoolPreviewPlayerId(candidate),
    preview_player_key: officialFantasyPlayerId || key,
    is_fantasy_pool_preview: true,
    preview_candidate: candidate,
    preview_matchday_projections_by_matchday: projectionMap,
    source_player_id: internalPlayerId,
    internal_player_id: internalPlayerId,
    official_fantasy_player_id: officialFantasyPlayerId || null,
    name: officialRecord.name || candidate.name || financeMetric.name || "Player needs check",
    country: officialRecord.country || candidate.country || financeMetric.country || "needs_check",
    team_id: officialRecord.team_id || candidate.team_id || financeMetric.team_id || "",
    position: positionCodeLabels[positionCode] || positionCode,
    position_code: positionCode,
    official_fantasy_position: positionCode,
    club: candidate.matchday === "group_stage_full"
      ? "Fantasy pool"
      : `Pick vs ${candidate.opponent || "opponent"}`,
    league: "Fantasy pool",
    price,
    official_price: price,
    price_is_proxy: false,
    price_note: "Official fantasy price",
    roster_status: "official_fantasy_pool",
    selectable_status: officialRecord.selectable_status || "playing",
    recommendation_use: "safe_to_rank",
    finance_label: "fantasy_pool_preview",
    portfolio_use: "fantasy_pool_planning",
    risk_profile: confidence,
    value_role: candidate.mode || "preview",
    data_confidence_score: dataConfidence,
    data_confidence_band: confidence,
    country_role: candidate.role_label || financeMetric.role_label || "unclear",
    expected_minutes_v0: expectedMinutes,
    start_probability_percent: startProbability * 100,
    substitution_risk: Math.max(0, 100 - startProbability * 100),
    risk_composite_score: riskScore,
    finance_composite_risk_score: riskScore,
    risk_tail_score: Math.min(100, riskScore + 8),
    finance_tail_risk_score: Math.min(100, riskScore + 8),
    risk_adjusted_expected_points_estimate: candidate.risk_adjusted_points,
    finance_expected_return_points: candidate.raw_expected_points,
    finance_risk_adjusted_return_points: candidate.risk_adjusted_points,
    finance_upside_p90_points: candidate.ceiling_points,
    finance_captain_score: candidate.captain_score,
    finance_var10_points: candidate.floor_points,
    finance_cvar20_points: candidate.floor_points,
    finance_strategy_risk_adjusted: recommendationScore,
    finance_strategy_safe_floor: candidate.mode === "safe" ? recommendationScore : (100 - riskScore) * 0.35 + Number(candidate.floor_points || 0) * 8 + startProbability * 25,
    finance_strategy_upside: candidate.mode === "upside" ? recommendationScore : Number(candidate.ceiling_points || 0) * 6 + Number(candidate.raw_expected_points || 0) * 2,
    finance_strategy_attack_heavy: candidate.mode === "upside" || ["MID", "FWD"].includes(positionCode) ? recommendationScore : Number(candidate.raw_expected_points || 0) * 5,
    finance_strategy_defensive_heavy: ["GK", "DEF"].includes(positionCode) ? recommendationScore : Number(candidate.risk_adjusted_points || 0) * 4,
    finance_strategy_very_risky: candidate.mode === "differential" ? recommendationScore : Number(candidate.ceiling_points || 0) * 3,
    value_score_v1: valueScore * 10,
    cheap_enabler_score_v1: valueScore * 12,
    premium_worth_it_score_v1: recommendationScore,
    overpay_risk_v1: financeMetric.price_tier_opportunity_cost ?? 0,
    proxy_price_percentile_v1: 50,
    source_review_flags: flags,
    short_reason: Array.isArray(candidate.why_pick) ? candidate.why_pick.join(". ") : "",
    data_note: fantasyPoolPreviewStatus?.public_warning_html || "Fantasy picks using the current data.",
    source_note: "Refresh when player, price, position, status, rule, or deadline data changes.",
    minutes_model_source_note: `Role label: ${titleFromSnake(candidate.role_label || "unclear")}; confidence: ${titleFromSnake(candidate.role_confidence || confidence)}.`,
    preview_why_pick: candidate.why_pick || [],
    preview_why_careful: candidate.why_careful || [],
    preview_finance_context: candidate.finance_context || {},
    preview_mode_label: candidate.mode_label || titleFromSnake(candidate.mode),
    preview_matchday: candidate.matchday,
    preview_opponent: candidate.opponent,
    recommendation_tier_label: titleFromSnake(candidate.recommendation_tier),
    model_stage: "current_official_fantasy_pool"
  });
}

function officialFantasySelectableStatus(status) {
  return String(status || "playing").trim().toLowerCase();
}

function isOfficialFantasySelectable(record) {
  return officialFantasySelectableStatus(record?.selectable_status) === "playing";
}

function firstFiniteNumberOrMissing(...valuesToCheck) {
  for (const valueToCheck of valuesToCheck) {
    const number = Number(valueToCheck);
    if (Number.isFinite(number)) {
      return number;
    }
  }

  return null;
}

function fantasyPoolProjectionRowsForPlayer(projectionMap = {}) {
  return Array.from(new Set([defaultPublicMatchdayId, "r16", "r32", "md1", "md2", "md3"]))
    .map((matchdayId) => projectionMap[matchdayId])
    .filter(Boolean);
}

function sumFantasyPoolProjectionField(projectionMap, fieldName) {
  const valuesToSum = fantasyPoolProjectionRowsForPlayer(projectionMap)
    .map((projection) => Number(projection[fieldName]))
    .filter(Number.isFinite);

  return valuesToSum.length
    ? valuesToSum.reduce((sum, valueToAdd) => sum + valueToAdd, 0)
    : null;
}

function averageFantasyPoolProjectionField(projectionMap, fieldName) {
  const valuesToAverage = fantasyPoolProjectionRowsForPlayer(projectionMap)
    .map((projection) => Number(projection[fieldName]))
    .filter(Number.isFinite);

  return valuesToAverage.length
    ? valuesToAverage.reduce((sum, valueToAdd) => sum + valueToAdd, 0) / valuesToAverage.length
    : null;
}

function bestFantasyPoolRecommendationForPlayer(officialFantasyPlayerId) {
  const recommendations = recommendationByPlayerId.get(String(officialFantasyPlayerId || "")) || [];
  const matchdayPriority = {
    [defaultPublicMatchdayId]: 0,
    r16: 0,
    r32: 1,
    md3: 2,
    md2: 3,
    md1: 4,
    group_stage_full: 5
  };
  const modePriority = {
    balanced: 0,
    safe: 1,
    upside: 2,
    differential: 3,
    captain: 4
  };

  return [...recommendations].sort((a, b) =>
    (matchdayPriority[a.matchday] ?? 9) - (matchdayPriority[b.matchday] ?? 9) ||
    (modePriority[a.mode] ?? 9) - (modePriority[b.mode] ?? 9) ||
    Number(a.rank || 999) - Number(b.rank || 999)
  )[0] || null;
}

function currentFantasyPoolPlayerId(record) {
  return String(
    record?.internal_player_id ||
    record?.matched_existing_player_id ||
    record?.source_player_id ||
    (record?.official_fantasy_player_id ? `official-fantasy-${record.official_fantasy_player_id}` : "")
  ).trim();
}

function currentFantasyPoolPlayerFromOfficialRecord(record) {
  const officialFantasyPlayerId = String(record?.official_fantasy_player_id || "");
  const id = currentFantasyPoolPlayerId(record);
  const financeMetric = financeByPlayerId.get(officialFantasyPlayerId) || {};
  const projectionMap = projectionByPlayerId.get(officialFantasyPlayerId) || {};
  const projections = fantasyPoolProjectionRowsForPlayer(projectionMap);
  const firstProjection = projections[0] || {};
  const recommendation = bestFantasyPoolRecommendationForPlayer(officialFantasyPlayerId);
  const activeProjectionRow = projectionMap[defaultPublicMatchdayId] || firstProjection;
  const supplementalPlayer = playersDataById.get(id) || playersDataById.get(officialFantasyPlayerId) || {};
  const positionCode = normalizeFantasyPositionCode(
    record?.official_fantasy_position ||
    financeMetric.official_fantasy_position ||
    firstProjection.official_fantasy_position
  );
  const price = firstFiniteNumberOrMissing(
    record?.official_price,
    financeMetric.official_price,
    firstProjection.official_price,
    recommendation?.official_price
  );
  const averageStartProbability = firstFiniteNumberOrMissing(
    activeProjectionRow.start_probability,
    recommendation?.start_probability,
    financeMetric.average_start_probability,
    averageFantasyPoolProjectionField(projectionMap, "start_probability")
  ) || 0;
  const averageExpectedMinutes = firstFiniteNumberOrMissing(
    activeProjectionRow.expected_minutes,
    recommendation?.expected_minutes,
    financeMetric.average_expected_minutes,
    averageFantasyPoolProjectionField(projectionMap, "expected_minutes")
  ) || 0;
  const groupStageExpectedPoints = firstFiniteNumberOrMissing(
    activeProjectionRow.finance_expected_return_points,
    activeProjectionRow.raw_expected_points,
    recommendation?.raw_expected_points,
    financeMetric.group_stage_expected_points,
    sumFantasyPoolProjectionField(projectionMap, "finance_expected_return_points"),
    sumFantasyPoolProjectionField(projectionMap, "raw_expected_points")
  ) || 0;
  const groupStageRiskAdjustedPoints = firstFiniteNumberOrMissing(
    activeProjectionRow.finance_risk_adjusted_return_points,
    activeProjectionRow.risk_adjusted_points,
    recommendation?.risk_adjusted_points,
    financeMetric.group_stage_risk_adjusted_points,
    sumFantasyPoolProjectionField(projectionMap, "finance_risk_adjusted_return_points"),
    sumFantasyPoolProjectionField(projectionMap, "risk_adjusted_points")
  ) || 0;
  const groupStageCeilingPoints = firstFiniteNumberOrMissing(
    activeProjectionRow.finance_upside_p90_points,
    activeProjectionRow.ceiling_points,
    recommendation?.ceiling_points,
    financeMetric.group_stage_ceiling_points,
    sumFantasyPoolProjectionField(projectionMap, "finance_upside_p90_points"),
    sumFantasyPoolProjectionField(projectionMap, "ceiling_points")
  ) || groupStageExpectedPoints;
  const groupStageFloorPoints = firstFiniteNumberOrMissing(
    activeProjectionRow.floor_points,
    recommendation?.floor_points,
    financeMetric.group_stage_floor_points,
    financeMetric.bad_week_floor,
    sumFantasyPoolProjectionField(projectionMap, "floor_points")
  ) || 0;
  const financeContext = recommendation?.finance_context || {};
  const riskScore = Math.min(100, Math.max(0, firstFiniteNumberOrMissing(
    financeMetric.downside_risk_proxy,
    financeMetric.volatility_proxy,
    financeMetric.data_risk,
    fantasyPoolRiskScore(recommendation, financeMetric)
  ) || 0));
  const confidence = financeMetric.projection_confidence || firstProjection.projection_confidence || recommendation?.projection_confidence || "low";
  const dataConfidence = confidenceScore(confidence);
  const recommendationScore = firstFiniteNumberOrMissing(recommendation?.recommendation_score);
  const baseStrategyScore = Math.max(
    0,
    groupStageRiskAdjustedPoints * 3.2 +
      averageStartProbability * 20 +
      Math.max(0, 100 - riskScore) * 0.18 +
      (Number.isFinite(recommendationScore) ? recommendationScore * 0.35 : 0)
  );
  const flags = importantPreviewFlags([
    ...(Array.isArray(record?.data_quality_flags) ? record.data_quality_flags : []),
    ...(Array.isArray(financeMetric.data_quality_flags) ? financeMetric.data_quality_flags : []),
    ...(Array.isArray(financeMetric.finance_flags) ? financeMetric.finance_flags : []),
    ...(Array.isArray(firstProjection.data_quality_flags) ? firstProjection.data_quality_flags : []),
    ...(Array.isArray(recommendation?.data_quality_flags) ? recommendation.data_quality_flags : [])
  ]);
  const missingCriticalFlags = [];

  if (!officialFantasyPlayerId) missingCriticalFlags.push("missing_official_fantasy_player_id");
  if (!positionCode) missingCriticalFlags.push("missing_official_fantasy_position");
  if (price === null) missingCriticalFlags.push("missing_official_fantasy_price");
  if (!projections.length) missingCriticalFlags.push("missing_current_matchday_projection");
  if (!Object.keys(financeMetric).length) missingCriticalFlags.push("missing_current_finance_metric");
  if (!Object.keys(firstProjection.fixture_context || {}).length) missingCriticalFlags.push("missing_score_context");

  if (missingCriticalFlags.length) {
    return null;
  }

  return normalizePublicPlayerFantasyPosition({
    id,
    internal_player_id: id,
    source_player_id: id,
    official_fantasy_player_id: officialFantasyPlayerId || null,
    official_team_id: record?.team_id || firstProjection.official_team_id || null,
    name: record?.name || financeMetric.name || firstProjection.name || supplementalPlayer.name || "Player needs check",
    display_name: record?.name || financeMetric.display_name || firstProjection.display_name || supplementalPlayer.display_name || null,
    country: record?.country || financeMetric.country || firstProjection.country || supplementalPlayer.country || "needs_check",
    team_id: record?.team_id || financeMetric.team_id || firstProjection.team_id || supplementalPlayer.team_id || "",
    position: fantasyPositionLabelFromCode(positionCode),
    position_code: positionCode,
    official_fantasy_position: positionCode,
    club: firstProjection.minutes_context?.source_club_context?.current_club || supplementalPlayer.club || financeMetric.club || "Fantasy pool",
    league: firstProjection.minutes_context?.source_club_context?.current_league || supplementalPlayer.league || "Fantasy pool",
    price: price ?? 0,
    official_price: price,
    price_is_proxy: false,
    price_note: "Official fantasy price",
    selectable_status: record?.selectable_status || financeMetric.selectable_status || firstProjection.selectable_status || "playing",
    roster_status: financeMetric.roster_status || firstProjection.roster_status || "selectable_fantasy_player",
    recommendation_use: missingCriticalFlags.length ? "safe_to_rank_with_caveat" : "safe_to_rank",
    finance_label: "current_fantasy_pool",
    portfolio_use: "fantasy_pool_planning",
    risk_profile: confidence,
    value_role: recommendation?.mode || "current_fantasy_pool",
    data_confidence_score: dataConfidence,
    data_confidence_band: confidence,
    country_role: financeMetric.role_label || firstProjection.minutes_context?.role_label || firstProjection.role_label || recommendation?.role_label || "unclear",
    role_confidence: financeMetric.role_confidence || firstProjection.minutes_context?.role_confidence || firstProjection.role_confidence || recommendation?.role_confidence || confidence,
    expected_minutes_v0: averageExpectedMinutes,
    start_probability_percent: averageStartProbability * 100,
    substitution_risk: Math.max(0, 100 - averageStartProbability * 100),
    risk_composite_score: riskScore,
    finance_composite_risk_score: riskScore,
    risk_tail_score: Math.min(100, riskScore + 8),
    finance_tail_risk_score: Math.min(100, riskScore + 8),
    risk_adjusted_expected_points_estimate: groupStageRiskAdjustedPoints,
    finance_expected_return_points: groupStageExpectedPoints,
    finance_risk_adjusted_return_points: groupStageRiskAdjustedPoints,
    finance_upside_p90_points: groupStageCeilingPoints,
    finance_captain_score: firstFiniteNumberOrMissing(financeMetric.captain_score, recommendation?.captain_score) || 0,
    finance_var10_points: groupStageFloorPoints,
    finance_cvar20_points: firstFiniteNumberOrMissing(financeMetric.stress_case_floor, financeMetric.group_stage_floor_points, groupStageFloorPoints) || 0,
    finance_strategy_risk_adjusted: baseStrategyScore,
    finance_strategy_safe_floor: Math.max(0, groupStageFloorPoints * 8 + Math.max(0, 100 - riskScore) * 0.35 + averageStartProbability * 25),
    finance_strategy_upside: Math.max(0, groupStageCeilingPoints * 2 + groupStageExpectedPoints * 2),
    finance_strategy_attack_heavy: ["MID", "FWD"].includes(positionCode)
      ? Math.max(0, groupStageCeilingPoints * 2 + groupStageExpectedPoints * 2.5)
      : Math.max(0, groupStageExpectedPoints * 1.5),
    finance_strategy_defensive_heavy: ["GK", "DEF"].includes(positionCode)
      ? Math.max(0, groupStageRiskAdjustedPoints * 3 + Math.max(0, 100 - riskScore) * 0.2)
      : Math.max(0, groupStageRiskAdjustedPoints),
    finance_strategy_very_risky: Math.max(0, groupStageCeilingPoints * 2.4 + (financeContext.volatility_score || financeMetric.volatility_proxy || 0) * 0.2),
    value_score_v1: Math.max(0, firstFiniteNumberOrMissing(financeMetric.risk_adjusted_points_per_price, financeMetric.points_per_price, recommendation?.value_score) || 0) * 10,
    cheap_enabler_score_v1: Math.max(0, firstFiniteNumberOrMissing(financeMetric.risk_adjusted_points_per_price, financeMetric.points_per_price, recommendation?.value_score) || 0) * 12,
    premium_worth_it_score_v1: Math.max(0, baseStrategyScore - (financeMetric.price_tier_opportunity_cost || 0)),
    overpay_risk_v1: financeMetric.price_tier_opportunity_cost ?? 0,
    proxy_price_percentile_v1: 50,
    preview_matchday_projections_by_matchday: projectionMap,
    preview_candidate: recommendation,
    preview_finance_context: recommendation?.finance_context || {},
    preview_matchday: recommendation?.matchday || "group_stage_full",
    preview_opponent: recommendation?.opponent || "Group stage average",
    recommendation_tier_label: recommendation ? titleFromSnake(recommendation.recommendation_tier) : "Current fantasy pool",
    source_review_flags: Array.from(new Set([
      ...flags,
      ...missingCriticalFlags,
      "team_builder_current_official_pool_source"
    ])),
    short_reason: Array.isArray(recommendation?.why_pick) ? recommendation.why_pick.join(". ") : "",
    data_note: fantasyPoolPreviewStatus?.public_warning_html || "Official fantasy-pool player with current model fields.",
    source_note: "Team Builder starts from the official fantasy pool, then joins current projections and finance metrics.",
    minutes_model_source_note: firstProjection.minutes_context?.evidence_notes || `Role label: ${titleFromSnake(financeMetric.role_label || "unclear")}; confidence: ${titleFromSnake(confidence)}.`,
    team_builder_source: "official_fantasy_pool_with_current_model_fields",
    is_current_fantasy_pool_player: true,
    model_stage: "current_official_fantasy_pool"
  });
}

function buildCurrentFantasyPoolPlayers() {
  const officialRows = Array.isArray(fantasyPoolPreviewStatus?.official_position_records)
    ? fantasyPoolPreviewStatus.official_position_records
    : [];

  return officialRows
    .filter(isOfficialFantasySelectable)
    .map(currentFantasyPoolPlayerFromOfficialRecord)
    .filter(Boolean)
    .filter((player) => player.id && player.official_fantasy_player_id)
    .filter((player, index, playerList) =>
      playerList.findIndex((candidate) => candidate.id === player.id) === index
    );
}

function fantasyPoolPreviewCandidatesForMode(mode, matchdayId = activeMatchdayId) {
  if (!usingFantasyPoolPreview) {
    return [];
  }

  const preferredMatchday = matchdayId || "group_stage_full";
  const candidates = fantasyPoolRecommendationRows.filter((candidate) =>
    candidate.mode === mode && candidate.matchday === preferredMatchday
  );
  const fallbackCandidates = preferredMatchday === "group_stage_full" || preferredMatchday === "finalRound"
    ? []
    : fantasyPoolRecommendationRows.filter((candidate) =>
      candidate.mode === mode && candidate.matchday === "group_stage_full"
    );

  return (candidates.length ? candidates : fallbackCandidates)
    .slice()
    .sort((a, b) => Number(a.rank || 999) - Number(b.rank || 999))
    .map((candidate) => fantasyPoolPreviewPlayerById.get(fantasyPoolPreviewPlayerId(candidate)))
    .filter(Boolean)
    .filter((player) => playerAllowedForActiveMatchday(player, preferredMatchday));
}

function fantasyPoolPreviewModeForAdvice(measureKey, trustMode) {
  if (pickModelOptions[measureKey]?.sourceMode) {
    return pickModelOptions[measureKey].sourceMode;
  }

  if (["balanced", "safe", "upside", "differential", "captain"].includes(measureKey)) {
    return measureKey;
  }

  if (trustMode?.id === "strict" || ["safe", "minutes", "lowTailRisk", "var10", "cvar20", "defensiveHeavy"].includes(measureKey)) {
    return "safe";
  }

  if (["upside", "attackHeavy", "veryRisky"].includes(measureKey) || trustMode?.id === "chaos") {
    return "upside";
  }

  if (["bestValue", "cheapEnabler", "premiumWorthIt", "sharpe", "sortino", "omega"].includes(measureKey)) {
    return "differential";
  }

  return "balanced";
}

let fantasyRules = null;
let tactics = {};
let squadRequirements = {};
let squadTotalPlayers = 0;
let startingLineupTotal = 0;
let benchTotalPlayers = 0;
let initialBudget = 0;
let budgetCurrencyLabel = "fantasy units";
let groupStageCountryLimit = 0;
let positionOrder = Object.values(positionCodeLabels);

function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function listText(items) {
  if (items.length <= 1) {
    return items[0] || "";
  }

  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function emptyPositionCounts() {
  return positionOrder.reduce((counts, position) => {
    counts[position] = 0;
    return counts;
  }, {});
}

function positionRequirementsFromRules(positionRules) {
  const requirements = {};

  Object.entries(positionCodeLabels).forEach(([code, label]) => {
    const count = Number(positionRules?.[code]);

    if (!Number.isFinite(count)) {
      throw new Error(`Missing squad rule for ${code}`);
    }

    requirements[label] = count;
  });

  return requirements;
}

function formationToRequirements(formation) {
  const match = String(formation).match(/^(\d)-(\d)-(\d)$/);

  if (!match) {
    throw new Error(`Unsupported formation in rules file: ${formation}`);
  }

  return {
    Goalkeeper: 1,
    Defender: Number(match[1]),
    Midfielder: Number(match[2]),
    Forward: Number(match[3])
  };
}

function requirementsTotal(requirements) {
  return Object.values(requirements).reduce((sum, count) => sum + Number(count), 0);
}

function budgetUnitLabel() {
  return budgetCurrencyLabel === "fantasy units" ? "units" : budgetCurrencyLabel;
}

function budgetText(number) {
  return `${value(number).toFixed(1)} ${budgetUnitLabel()}`;
}

function squadCost(squad) {
  return squad.reduce((sum, player) => sum + value(player.price), 0);
}

function remainingBudgetText(totalPrice) {
  return budgetText(initialBudget - totalPrice);
}

function loadFantasyRules() {
  if (!ACTIVE_DATA.rules) {
    throw new Error("Fantasy rules data is missing. Refresh after the static data files finish loading.");
  }

  return ACTIVE_DATA.rules;
}

function countryLimitForMatchday(rules, matchdayId = activeMatchdayId) {
  const groupLimit = Number(rules?.country_limits?.group_stage_max_per_country);
  const fallbackLimit = Number.isFinite(groupLimit) ? groupLimit : 0;
  const knockoutLimits = rules?.country_limits?.knockout_limits || {};
  const id = String(matchdayId || "").toLowerCase();
  const knockoutKeyByMatchday = {
    r32: "round_of_32",
    r16: "round_of_16",
    qf: "quarter_final",
    quarter_final: "quarter_final",
    sf: "semi_final",
    semi_final: "semi_final",
    finalround: "final",
    final: "final"
  };
  const knockoutKey = knockoutKeyByMatchday[id];

  if (knockoutKey) {
    const knockoutLimit = Number(knockoutLimits[knockoutKey]);

    if (Number.isFinite(knockoutLimit)) {
      return knockoutLimit;
    }
  }

  return fallbackLimit;
}

function budgetLimitForMatchday(rules, matchdayId = activeMatchdayId) {
  const baseBudget = Number(rules?.budget?.initial_budget);
  const knockoutIncrease = Number(rules?.budget?.knockout_increase || 0);
  const id = String(matchdayId || "").toLowerCase();
  const knockoutMatchdays = new Set(["r32", "r16", "qf", "quarter_final", "sf", "semi_final", "finalround", "final"]);

  if (!Number.isFinite(baseBudget)) {
    return 0;
  }

  return knockoutMatchdays.has(id) ? baseBudget + knockoutIncrease : baseBudget;
}

function refreshActiveCountryLimit() {
  groupStageCountryLimit = countryLimitForMatchday(fantasyRules, activeMatchdayId);
}

function refreshActiveBudgetLimit() {
  initialBudget = budgetLimitForMatchday(fantasyRules, activeMatchdayId);
}

function activeCountryLimitLabel() {
  return activeMatchdayLabel();
}

function applyFantasyRules(rules) {
  const totalPlayers = Number(rules?.squad?.total_players);
  const starterTotal = Number(rules?.starting_lineup?.total_players);
  const budgetLimit = Number(rules?.budget?.initial_budget);
  const countryLimit = Number(rules?.country_limits?.group_stage_max_per_country);
  const allowedFormations = rules?.starting_lineup?.allowed_formations;
  const nextSquadRequirements = positionRequirementsFromRules(rules?.squad?.positions);

  if (!Number.isFinite(totalPlayers) || !Number.isFinite(starterTotal)) {
    throw new Error("Fantasy rules are missing squad or starting-lineup totals.");
  }

  if (!Number.isFinite(budgetLimit)) {
    throw new Error("Fantasy rules are missing budget.initial_budget.");
  }

  if (!Number.isFinite(countryLimit)) {
    throw new Error("Fantasy rules are missing country_limits.group_stage_max_per_country.");
  }

  if (!Array.isArray(allowedFormations) || !allowedFormations.length) {
    throw new Error("Fantasy rules are missing allowed formations.");
  }

  if (requirementsTotal(nextSquadRequirements) !== totalPlayers) {
    throw new Error("Fantasy squad position counts do not match total_players.");
  }

  const nextTactics = allowedFormations.reduce((formations, formation) => {
    const requirements = formationToRequirements(formation);

    if (requirementsTotal(requirements) !== starterTotal) {
      throw new Error(`Formation ${formation} does not match starting_lineup.total_players.`);
    }

    formations[formation] = requirements;
    return formations;
  }, {});

  fantasyRules = rules;
  tactics = nextTactics;
  squadRequirements = nextSquadRequirements;
  squadTotalPlayers = totalPlayers;
  startingLineupTotal = starterTotal;
  benchTotalPlayers = Math.max(0, squadTotalPlayers - startingLineupTotal);
  initialBudget = budgetLimitForMatchday(rules, activeMatchdayId);
  budgetCurrencyLabel = rules?.budget?.currency_label || "fantasy units";
  groupStageCountryLimit = countryLimitForMatchday(rules, activeMatchdayId);
  positionOrder = Object.values(positionCodeLabels);
}

function squadLabel() {
  return `${squadTotalPlayers}-player squad`;
}

function benchLabel() {
  return pluralize(benchTotalPlayers, "substitute");
}

function positionRequirementText() {
  return listText(positionOrder.map((position) =>
    pluralize(squadRequirements[position], position.toLowerCase())
  ));
}

function compactPositionRequirementText(requirements = squadRequirements) {
  return positionOrder
    .map((position) => `${requirements[position] || 0} ${positionLabelCodes[position] || position}`)
    .join(", ");
}

function formationListText() {
  return listText(Object.keys(tactics));
}

const countryDisplayNames = {
  ARG: "Argentina",
  BEL: "Belgium",
  CMR: "Cameroon",
  COD: "DR Congo",
  CIV: "Ivory Coast",
  ECU: "Ecuador",
  EGY: "Egypt",
  GAM: "Gambia",
  GER: "Germany",
  GHA: "Ghana",
  GNB: "Guinea-Bissau",
  HUN: "Hungary",
  NOR: "Norway",
  SEN: "Senegal",
  SUI: "Switzerland"
};

// Each measure has a score function and a beginner explanation for the info panel.
const measures = {
  balanced: {
    label: "Core Picks",
    optionLabel: "Core Picks",
    description: "Best all-around option. It balances expected return, reliable starts, minutes, risk, and Final Round fixture optionality.",
    formula: "Player signal used: blends projected fantasy return, reliability, minutes security, lower downside, and early-fixture substitution flexibility when the active round supports it.",
    score: (player) => scoreValue(player, "finance_strategy_risk_adjusted", "risk_adjusted_overall_score") +
      finalRoundStrategicPlayerScore(player) * 1.8
  },
  expected: {
    label: "Projected Points",
    description: "Ranks players by modeled expected fantasy points for one group-stage match.",
    formula: "Player signal used: ranks the projected fantasy return for the selected match view.",
    score: (player) => scoreValue(player, "finance_expected_return_points", "risk_adjusted_expected_points_estimate")
  },
  safe: {
    label: "High-Floor Picks",
    optionLabel: "High-Floor Picks",
    description: "Prioritizes players with safer minutes and lower downside before chasing upside.",
    formula: "Player signal used: rewards projected return, minutes security, role confidence, and safer bad-week outcomes.",
    score: (player) => hasScoreValue(player, "finance_strategy_safe_floor")
      ? scoreValue(player, "finance_strategy_safe_floor")
      : (100 - value(player.risk_composite_score)) + value(player.risk_adjusted_expected_points_estimate) * 8
  },
  upside: {
    label: "Upside Picks",
    optionLabel: "Upside Picks",
    description: "Chases higher ceilings in stronger attacking spots.",
    formula: "Player signal used: leans toward projected return, ceiling, attacking involvement, and stronger matchups.",
    score: (player) => scoreValue(player, "finance_strategy_upside", "euro_style_points_per90_estimate")
  },
  minutes: {
    label: "Likely Minutes",
    description: "Looks for players who are more likely to play regularly.",
    formula: "Player signal used: favors club minutes, national-team usage, role confidence, and minutes security.",
    score: (player) => scoreValue(player, "finance_strategy_minutes_floor", "euro_style_reliability_score")
  },
  lowTailRisk: {
    label: "Avoid Bad Weeks",
    optionLabel: "Avoid Bad Weeks (low tail-risk)",
    secondaryLabel: "Advanced: low tail-risk score",
    description: "Looks for players less likely to produce a very poor score.",
    formula: "Uses the tail-risk avoidance strategy. It rewards better bad-week floor fields, lower bad-week probability, and useful projected points.",
    score: (player) => hasScoreValue(player, "finance_strategy_tail_risk_avoidance")
      ? scoreValue(player, "finance_strategy_tail_risk_avoidance")
      : (100 - value(player.risk_tail_score)) + value(player.risk_adjusted_expected_points_estimate) * 5
  },
  sharpe: {
    label: "Risk-Adjusted Pick",
    optionLabel: "Risk-Adjusted Pick (Sharpe-style)",
    secondaryLabel: "Advanced: Sharpe-style score",
    description: "Balances projected points against overall risk.",
    formula: "Raw formula: expected return above a 2-point baseline divided by modeled volatility. The site ranks the raw ratio as a 0-100 percentile.",
    score: (player) => scoreValue(player, "finance_sharpe_like_percentile", "risk_adjusted_sharpe_like")
  },
  sortino: {
    label: "Downside Protection Pick",
    optionLabel: "Downside Protection Pick (Sortino-style)",
    secondaryLabel: "Advanced: Sortino-style score",
    description: "Focuses more on avoiding bad outcomes.",
    formula: "Raw formula: expected return above a 2-point baseline divided by downside deviation. The site ranks the raw ratio as a 0-100 percentile.",
    score: (player) => scoreValue(player, "finance_sortino_like_percentile", "risk_adjusted_sortino_like")
  },
  bestValue: {
    label: "Value Picks",
    optionLabel: "Value Picks",
    secondaryLabel: "Budget-aware value score",
    description: "Ranks players by projected return for their budget, with role and budget pressure included.",
    formula: "Player signal used: blends projected return per budget unit, value score, start chance, and lower budget pressure.",
    score: (player) => {
      const price = proxyPrice(player);
      const riskAdjustedPerPrice = scoreValue(player, "finance_risk_adjusted_return_points", "risk_adjusted_expected_points_estimate") / price;
      const expectedPerPrice = scoreValue(player, "finance_expected_return_points") / price;

      return riskAdjustedPerPrice * 55 +
        expectedPerPrice * 25 +
        scoreValue(player, "value_score_v1", "value_score_v0") * 0.2 +
        scoreValue(player, "cheap_enabler_score_v1", "cheap_enabler_score") * 0.08 +
        scoreValue(player, "start_probability_percent") * 0.1 +
        (100 - scoreValue(player, "proxy_price_percentile_v1", "proxy_price_percentile")) * 0.12 +
        (100 - scoreValue(player, "overpay_risk_v1", "overpay_risk")) * 0.2;
    }
  },
  cheapEnabler: {
    label: "Cheap Enabler",
    optionLabel: "Cheap Enabler",
    secondaryLabel: "Budget-aware value score",
    description: "Finds lower-price players who still have a playable role and useful value score.",
    formula: "Player signal used: finds cheaper players with a playable role, useful value, and enough projected return for the spend.",
    score: (player) => scoreValue(player, "cheap_enabler_score_v1", "cheap_enabler_score") + (scoreValue(player, "finance_risk_adjusted_return_points") / proxyPrice(player)) * 14
  },
  premiumWorthIt: {
    label: "Premium Worth It",
    optionLabel: "Premium Worth It",
    secondaryLabel: "Budget-aware value score",
    description: "Checks whether expensive players still justify the spend.",
    formula: "Player signal used: checks whether premium players justify the price through projection, role, and start chance.",
    score: (player) => scoreValue(player, "premium_worth_it_score_v1", "premium_worth_it_score") + scoreValue(player, "finance_expected_return_points") * 4 + scoreValue(player, "start_probability_percent") * 0.08 - scoreValue(player, "overpay_risk_v1", "overpay_risk") * 0.08
  },
  var10: {
    label: "Bad-Week Floor Pick",
    optionLabel: "Bad-Week Floor Pick (10th percentile)",
    secondaryLabel: "Advanced: value at risk",
    description: "Finds players with a better modeled bad-outcome floor.",
    formula: "Ranks the 10th percentile fantasy-point outcome. A higher VaR means the model expects a less painful downside case.",
    score: (player) => scoreValue(player, "finance_var10_points", "finance_var10_percentile")
  },
  cvar20: {
    label: "Worst-Case Floor Pick",
    optionLabel: "Worst-Case Floor Pick (worst 20%)",
    secondaryLabel: "Advanced: conditional value at risk",
    description: "Looks at the average of the worst modeled outcomes, not just the cutoff point.",
    formula: "Ranks conditional value at risk for the worst 20% of modeled match outcomes. Higher is better.",
    score: (player) => scoreValue(player, "finance_cvar20_points", "finance_cvar20_percentile")
  },
  omega: {
    label: "Omega-Style Pick",
    optionLabel: "Omega-Style Pick",
    secondaryLabel: "Advanced: upside-to-downside balance",
    description: "Compares useful upside against downside risk.",
    formula: "Player signal used: compares useful upside against downside and ranks that balance.",
    score: (player) => scoreValue(player, "finance_omega_like_percentile")
  },
  attackHeavy: {
    label: "Attack Heavy",
    optionLabel: "Attack Heavy",
    description: "Chases attackers and attacking defenders with stronger goal, assist, shot, and upside signals.",
    formula: "Player signal used: rewards projected return, upside, attacking position, and attacking-event signals.",
    score: (player) => scoreValue(player, "finance_strategy_attack_heavy", "attack_score")
  },
  defensiveHeavy: {
    label: "Defensive Heavy",
    optionLabel: "Defensive Heavy",
    description: "Looks for goalkeepers and defenders with clean-sheet or defensive floor potential.",
    formula: "Player signal used: rewards defensive positions, clean-sheet context, defensive floor, and lower downside.",
    score: (player) => scoreValue(player, "finance_strategy_defensive_heavy", "defense_score")
  },
  veryRisky: {
    label: "Very Risky Upside",
    optionLabel: "Very Risky Upside",
    description: "A deliberately aggressive style for boom-or-bust recommendations.",
    formula: "Player signal used: rewards upside, volatility, and event dependence for an aggressive watchlist.",
    score: (player) => scoreValue(player, "finance_strategy_very_risky")
  },
  differential: {
    label: "Differential Picks",
    optionLabel: "Differential Picks",
    description: "Looks for lower-obviousness or mispriced players with a defensible projection.",
    formula: "Player signal used: looks for less obvious players who still have defensible projection, role, and value signals.",
    score: (player) => player.preview_candidate?.mode === "differential"
      ? scoreValue(player, "finance_strategy_risk_adjusted")
      : scoreValue(player, "finance_strategy_very_risky")
  },
  captain: {
    label: "Captain Watchlist",
    optionLabel: "Captain Watchlist",
    description: "Ranks armband candidates by captain ceiling, starts, raw points, and fixture context.",
    formula: "Player signal used: ranks armband candidates by ceiling, starts, raw points, and fixture context.",
    score: (player) => player.preview_candidate?.mode === "captain"
      ? scoreValue(player, "finance_strategy_risk_adjusted")
      : scoreValue(player, "finance_captain_score")
  }
};

Object.entries(measures).forEach(([key, measure]) => {
  measure.key = key;
});

const pickModelOptionKeys = [
  "expected",
  "balanced",
  "safe",
  "upside",
  "differential",
  "bestValue",
  "valueQuant",
  "captain",
  "riskControl"
];

const pickModelOptions = {
  expected: {
    id: "expected",
    label: "Projected Points",
    cardLabel: "Top Projection",
    group: "basic",
    sourceMode: "balanced",
    measureKey: "expected",
    help: "Favors the highest expected fantasy return.",
    cardDescription: "Projected Points favors the highest expected fantasy return."
  },
  balanced: {
    id: "balanced",
    label: "Core Picks",
    cardLabel: "Core Pick",
    group: "basic",
    sourceMode: "balanced",
    measureKey: "balanced",
    help: "Balances projected return with reliable starts, minutes, and Final Round fixture optionality.",
    cardDescription: "Core Picks balance projected return with reliable starts, minutes, and fixture optionality."
  },
  safe: {
    id: "safe",
    label: "High-Floor Picks",
    cardLabel: "High-Floor Pick",
    group: "basic",
    sourceMode: "safe",
    measureKey: "safe",
    help: "Prioritizes safer minutes and lower downside.",
    cardDescription: "High-Floor Picks prioritize safer minutes and lower downside."
  },
  upside: {
    id: "upside",
    label: "Upside Picks",
    cardLabel: "Upside Pick",
    group: "basic",
    sourceMode: "upside",
    measureKey: "upside",
    help: "Chases higher ceilings in stronger attacking spots.",
    cardDescription: "Upside Picks chase higher ceilings in stronger attacking spots."
  },
  differential: {
    id: "differential",
    label: "Differential Picks",
    cardLabel: "Differential Pick",
    group: "basic",
    sourceMode: "differential",
    measureKey: "differential",
    help: "Finds less obvious picks that still project well.",
    cardDescription: "Differential Picks find less obvious picks that still project well."
  },
  bestValue: {
    id: "bestValue",
    label: "Value Picks",
    cardLabel: "Value Pick",
    group: "basic",
    sourceMode: "differential",
    measureKey: "bestValue",
    help: "Looks for strong return for the price.",
    cardDescription: "Value Picks look for strong return for the price."
  },
  cheapEnabler: {
    id: "cheapEnabler",
    label: "Budget Enabler",
    cardLabel: "Budget Enabler",
    group: "starter",
    sourceMode: "differential",
    measureKey: "cheapEnabler",
    help: "Highlights lower-price players with a playable role.",
    cardDescription: "Budget Enabler highlights lower-price players with a playable role."
  },
  valueQuant: {
    id: "valueQuant",
    label: "Advanced Value Variant",
    cardLabel: "Advanced Value",
    group: "advanced",
    sourceMode: "balanced",
    measureKey: "bestValue",
    help: "Extra value lens kept outside the normal public pick list.",
    cardDescription: "Extra value lens kept outside the normal public pick list.",
    score: (player) => {
      const financeAlpha = financeContextScore(player, "finance_alpha_score");
      const valueScore = optionalScoreValue(player, "value_score_v1", "cheap_enabler_score_v1");
      const projectedPoints = optionalScoreValue(player, "finance_risk_adjusted_return_points", "risk_adjusted_expected_points_estimate");
      const price = proxyPrice(player);

      return (Number.isFinite(financeAlpha) ? financeAlpha : 0) * 1.8 +
        (Number.isFinite(valueScore) ? valueScore : 0) * 0.7 +
        (Number.isFinite(projectedPoints) && price > 0 ? (projectedPoints / price) * 22 : 0);
    }
  },
  captain: {
    id: "captain",
    label: "Captain Watchlist",
    cardLabel: "Captain Option",
    group: "advanced",
    sourceMode: "captain",
    measureKey: "captain",
    help: "Dedicated captain lane for armband candidates.",
    cardDescription: "Captain Watchlist highlights armband candidates without treating captain as a normal pick model.",
    score: (player) => captainRecommendationScore(player)
  },
  riskControl: {
    id: "riskControl",
    label: "Advanced Safety Variant",
    cardLabel: "Advanced Safety",
    group: "advanced",
    sourceMode: "safe",
    measureKey: "safe",
    help: "Extra safety lens kept outside the normal public pick list.",
    cardDescription: "Extra safety lens kept outside the normal public pick list.",
    score: (player, mode = activeTrustMode()) => trustAdjustedScore(player, measures.safe, mode) +
      Math.max(0, 100 - scoreValue(player, "finance_composite_risk_score", "risk_composite_score")) * 0.22 +
      scoreValue(player, "finance_minutes_security_score", "euro_style_reliability_score") * 0.16 +
      scoreValue(player, "finance_var10_points") * 2
  }
};

Object.entries(publicPickModelCopy).forEach(([key, copy]) => {
  if (pickModelOptions[key]) {
    Object.assign(pickModelOptions[key], copy);
  }
});

const teamBuilderStrategyOptionKeys = [
  "balancedSquad",
  "diversifiedSquad",
  "concentratedUpside",
  "starsAndScrubs",
  "valueSquad"
];

const teamBuilderStrategyOptions = {
  balancedSquad: {
    id: "balancedSquad",
    label: "Balanced Squad",
    measureKey: "balanced",
    description: "Strong all-around squad with a mix of starters, bench depth, budget efficiency, Final Round optionality, and moderate diversification.",
    whatItBuilds: "A strong all-around 15-player squad.",
    howItChooses: "Balances starter quality, reliable minutes, playable bench depth, budget efficiency, moderate upside, Final Round kickoff optionality, and moderate diversification.",
    mainTradeoff: "May pass on a sharper stack or extra premium if that weakens the bench, ignores the earlier fixture, or concentrates too much risk.",
    bestFor: "the default squad plan with no single extreme.",
    playerSignal: "Uses Core Picks as the main player signal, then checks the full squad shape and fixture order.",
    optimizationNote: "Balanced Squad is the default all-around optimizer profile. Earlier kickoff gives substitution flexibility if your game rules allow manual changes; verify FIFA substitution and lock rules."
  },
  diversifiedSquad: {
    id: "diversifiedSquad",
    label: "Diversified Squad",
    measureKey: "safe",
    description: "Reduces dependence on one country, one match, or a small group of stars.",
    whatItBuilds: "A squad that spreads risk across countries, fixtures, and star players.",
    howItChooses: "Rewards reliable starts, bench strength, lower country concentration, lower fixture concentration, and downside protection.",
    mainTradeoff: "Can give up some explosive upside from stacking one strong match environment.",
    bestFor: "steadier portfolio protection.",
    playerSignal: "Leans on High-Floor Picks, then adds stronger diversification checks.",
    optimizationNote: "Diversified Squad penalizes country stacks, fixture stacks, top-player dependence, weak bench spots, and fragile minutes more than the default."
  },
  concentratedUpside: {
    id: "concentratedUpside",
    label: "Concentrated Upside",
    measureKey: "upside",
    description: "Intentionally leans into strong attacking fixtures and higher-ceiling stacks.",
    whatItBuilds: "A higher-ceiling squad built around strong attacking spots.",
    howItChooses: "Rewards ceiling, favorable attacking fixtures, and controlled player stacks while checking roles and minutes.",
    mainTradeoff: "Can be more fragile if the stacked fixture misses.",
    bestFor: "chasing upside with some guardrails.",
    playerSignal: "Leans on Upside Picks: projected return, ceiling, attacking involvement, and matchup strength.",
    optimizationNote: "Concentrated Upside allows more stack exposure when the fixture context is strong."
  },
  starsAndScrubs: {
    id: "starsAndScrubs",
    label: "Stars and Scrubs",
    measureKey: "premiumWorthIt",
    description: "Spends heavily on elite starters and accepts a cheaper bench.",
    whatItBuilds: "A top-heavy squad that spends on elite starters and fills the bench cheaply.",
    howItChooses: "Rewards premium players who justify price through projection, role, and ceiling while keeping minimum bench playability.",
    mainTradeoff: "Bench can be weaker and more budget-sensitive.",
    bestFor: "elite starter firepower with a thinner bench.",
    playerSignal: "Leans on premium value, starter projection, and ceiling.",
    optimizationNote: "Stars and Scrubs tolerates more star dependence and weaker bench depth when premiums justify the spend."
  },
  valueSquad: {
    id: "valueSquad",
    label: "Value Squad",
    measureKey: "bestValue",
    description: "Builds the deepest squad for the budget.",
    whatItBuilds: "A deeper squad that squeezes more usable points from the budget.",
    howItChooses: "Rewards points per price, playable cheaper options, budget efficiency, and bench depth.",
    mainTradeoff: "May skip some premium ceiling if the price hurts squad depth.",
    bestFor: "efficient spend and stronger substitutes.",
    playerSignal: "Leans on Value Picks: return per price, start chance, and lower budget pressure.",
    optimizationNote: "Value Squad prefers efficient spend and a stronger bench over top-heavy premium concentration."
  }
};

const teamBuilderStrategyAliases = {
  balanced: "balancedSquad",
  core: "balancedSquad",
  expected: "balancedSquad",
  safe: "diversifiedSquad",
  highFloor: "diversifiedSquad",
  high_floor: "diversifiedSquad",
  differential: "diversifiedSquad",
  upside: "concentratedUpside",
  bestValue: "valueSquad",
  value: "valueSquad",
  cheapEnabler: "valueSquad",
  premiumWorthIt: "starsAndScrubs",
  starCore: "starsAndScrubs",
  star_core: "starsAndScrubs",
  captain: "balancedSquad",
  captainFirst: "balancedSquad",
  captain_first: "balancedSquad",
  noStarsBalanced: "balancedSquad",
  no_stars_balanced: "balancedSquad"
};

const teamBuilderComparisonStrategyKeys = [
  "balancedSquad",
  "diversifiedSquad",
  "concentratedUpside",
  "starsAndScrubs",
  "valueSquad"
];

const teamBuilderOptimizerVersion = "team_builder_optimizer_md3_v5";

const teamBuilderStrategyScoringProfiles = {
  balancedSquad: {
    id: "balancedSquad",
    version: teamBuilderOptimizerVersion,
    stateLimit: 780,
    partialBaseWeight: 0.36,
    partialStrategyWeight: 1.18,
    partialReserveWeight: 0.02,
    partialConcentrationPenalty: 0.85,
    partialPremiumReward: 1.25,
    partialCheapReward: -0.05,
    starterScoreWeight: 1.34,
    benchScoreWeight: 0.4,
    captainBonusWeight: 2.05,
    budgetBufferWeight: 0.08,
    playerWeights: {
      starter: { base: 0.1, expected: 0.7, riskAdjusted: 0.34, upside: 0.08, floor: 0.1, reliability: 0.23, value: 0.03, cheap: -0.02, premium: 0.1, price: -0.03, attackingContext: 0.05, captain: 0.28, fragilityPenalty: 0.42 },
      bench: { base: 0.08, expected: 0.3, riskAdjusted: 0.25, upside: 0.04, floor: 0.13, reliability: 0.24, value: 0.1, cheap: 0.04, premium: -0.02, price: -0.12, attackingContext: 0.02, captain: 0.04, fragilityPenalty: 0.55 }
    },
    portfolioWeights: {
      expected: 0.52,
      riskAdjusted: 0.24,
      upside: 0.06,
      var10: 0.06,
      cvar20: 0.04,
      start: 0.2,
      minutes: 0.02,
      benchExpectedReward: 0.16,
      benchStrengthReward: 0.18,
      valueEfficiencyReward: 0.03,
      budgetUseReward: 0.08,
      budgetRemainingReward: 0,
      topProjectedReward: 0.78,
      premiumReward: 0.95,
      premiumCountReward: 0.2,
      premiumConcentrationPenalty: 1.5,
      controlledStackReward: 0.16,
      attackingStackReward: 0.08,
      volatilityPenalty: 0.05,
      tailPenalty: 0.04,
      compositePenalty: 0.035,
      qaReviewPenalty: 1.6,
      qaWatchPenalty: 0.25,
      weakBenchPenalty: 1.9,
      premiumSqueezePenalty: 1.5,
      countryLimitPenalty: 1.05,
      hardFixturePenalty: 0.75,
      countryStackPenalty: 0.75,
      fixtureStackPenalty: 0.65,
      starDependencePenalty: 0.45,
      poorPremiumPenalty: 1.9,
      favorableFixtureReward: 0.18,
      matchUncertaintyPenalty: 0.5,
      uncertainFixtureStackPenalty: 1,
      strongXgReward: 0.46,
      cleanSheetContextReward: 0.34,
      lowXgPenalty: 0.55,
      difficultCleanSheetPenalty: 0.4,
      excessiveStackPenalty: 0.75,
      finalRoundOptionalityReward: 3.8,
      finalRoundEarlyFixtureReward: 2.4,
      finalRoundMissingEarlyFixturePenalty: 18
    }
  },
  diversifiedSquad: {
    id: "diversifiedSquad",
    version: teamBuilderOptimizerVersion,
    stateLimit: 620,
    partialBaseWeight: 0.42,
    partialStrategyWeight: 0.98,
    partialReserveWeight: 0.08,
    partialConcentrationPenalty: 4.8,
    partialPremiumReward: 0.35,
    partialCheapReward: 0.02,
    starterScoreWeight: 1.12,
    benchScoreWeight: 0.48,
    captainBonusWeight: 1.3,
    budgetBufferWeight: 0.15,
    playerWeights: {
      starter: { base: 0.16, expected: 0.46, riskAdjusted: 0.42, upside: 0.03, floor: 0.18, reliability: 0.3, value: 0.05, premium: 0.02, cheap: 0.02, price: -0.07, attackingContext: 0.01, captain: 0.14, fragilityPenalty: 0.62 },
      bench: { base: 0.12, expected: 0.24, riskAdjusted: 0.3, upside: 0.02, floor: 0.2, reliability: 0.3, value: 0.12, cheap: 0.06, premium: -0.04, price: -0.14, attackingContext: 0, captain: 0.02, fragilityPenalty: 0.7 }
    },
    portfolioWeights: {
      expected: 0.32,
      riskAdjusted: 0.34,
      upside: 0.03,
      var10: 0.16,
      cvar20: 0.12,
      start: 0.24,
      minutes: 0.028,
      benchExpectedReward: 0.18,
      benchStrengthReward: 0.34,
      valueEfficiencyReward: 0.04,
      budgetUseReward: 0.04,
      budgetRemainingReward: 0.01,
      topProjectedReward: 0.38,
      premiumReward: 0.22,
      premiumCountReward: -0.15,
      premiumConcentrationPenalty: 2.6,
      controlledStackReward: -0.02,
      attackingStackReward: -0.01,
      volatilityPenalty: 0.15,
      tailPenalty: 0.14,
      compositePenalty: 0.09,
      qaReviewPenalty: 2.8,
      qaWatchPenalty: 0.65,
      weakBenchPenalty: 2.4,
      premiumSqueezePenalty: 2.4,
      countryLimitPenalty: 3.4,
      hardFixturePenalty: 2.4,
      countryStackPenalty: 4.8,
      fixtureStackPenalty: 4.4,
      starDependencePenalty: 2.6,
      poorPremiumPenalty: 1.2,
      favorableFixtureReward: 0.1,
      matchUncertaintyPenalty: 0.8,
      uncertainFixtureStackPenalty: 2.2,
      strongXgReward: 0.22,
      cleanSheetContextReward: 0.32,
      lowXgPenalty: 0.75,
      difficultCleanSheetPenalty: 0.55,
      excessiveStackPenalty: 3.4
    }
  },
  concentratedUpside: {
    id: "concentratedUpside",
    version: teamBuilderOptimizerVersion,
    stateLimit: 580,
    partialBaseWeight: 0.38,
    partialStrategyWeight: 1.12,
    partialReserveWeight: -0.04,
    partialConcentrationPenalty: 0.3,
    partialPremiumReward: 1.35,
    partialCheapReward: -0.12,
    starterScoreWeight: 1.46,
    benchScoreWeight: 0.24,
    captainBonusWeight: 2.25,
    budgetBufferWeight: -0.04,
    playerWeights: {
      starter: { base: 0.08, expected: 0.58, riskAdjusted: 0.16, upside: 0.34, floor: -0.02, reliability: 0.1, value: 0.02, premium: 0.08, cheap: -0.04, price: -0.01, attackingContext: 0.28, captain: 0.32, fragilityPenalty: 0.32 },
      bench: { base: 0.06, expected: 0.2, riskAdjusted: 0.13, upside: 0.16, floor: 0.03, reliability: 0.13, value: 0.1, cheap: 0.05, premium: -0.03, price: -0.1, attackingContext: 0.08, captain: 0.03, fragilityPenalty: 0.52 }
    },
    portfolioWeights: {
      expected: 0.5,
      riskAdjusted: 0.1,
      upside: 0.24,
      var10: 0.02,
      cvar20: 0.01,
      start: 0.08,
      minutes: 0.008,
      benchExpectedReward: 0.07,
      benchStrengthReward: 0.05,
      valueEfficiencyReward: 0.01,
      budgetUseReward: 0.14,
      budgetRemainingReward: -0.04,
      topProjectedReward: 0.95,
      premiumReward: 0.5,
      premiumCountReward: 0.45,
      premiumConcentrationPenalty: 0,
      controlledStackReward: 1.3,
      attackingStackReward: 0.85,
      volatilityPenalty: 0.02,
      tailPenalty: 0.035,
      compositePenalty: 0.025,
      qaReviewPenalty: 0.9,
      qaWatchPenalty: 0.18,
      weakBenchPenalty: 0.75,
      premiumSqueezePenalty: 0.65,
      countryLimitPenalty: 0.25,
      hardFixturePenalty: 0.45,
      countryStackPenalty: 0.15,
      fixtureStackPenalty: 0.05,
      starDependencePenalty: -0.25,
      poorPremiumPenalty: 0.65,
      favorableFixtureReward: 0.42,
      matchUncertaintyPenalty: 0.18,
      uncertainFixtureStackPenalty: 0.25,
      strongXgReward: 0.85,
      cleanSheetContextReward: 0.2,
      lowXgPenalty: 0.2,
      difficultCleanSheetPenalty: 0.25,
      excessiveStackPenalty: 0.45
    }
  },
  starsAndScrubs: {
    id: "starsAndScrubs",
    version: teamBuilderOptimizerVersion,
    stateLimit: 700,
    partialBaseWeight: 0.32,
    partialStrategyWeight: 1.22,
    partialReserveWeight: -0.3,
    partialConcentrationPenalty: 0.55,
    partialPremiumReward: 4.6,
    partialCheapReward: 0.28,
    starterScoreWeight: 1.72,
    benchScoreWeight: 0.14,
    captainBonusWeight: 2.55,
    budgetBufferWeight: -0.04,
    playerWeights: {
      starter: { base: 0.06, expected: 0.72, riskAdjusted: 0.12, upside: 0.2, floor: -0.04, reliability: 0.08, value: -0.02, premium: 0.72, cheap: -0.18, price: 0.18, attackingContext: 0.08, captain: 0.36, fragilityPenalty: 0.26 },
      bench: { base: 0.08, expected: 0.13, riskAdjusted: 0.12, upside: 0.02, floor: 0.06, reliability: 0.11, value: 0.18, cheap: 0.28, premium: -0.12, price: -0.42, attackingContext: 0, captain: 0.01, fragilityPenalty: 0.66 }
    },
    portfolioWeights: {
      expected: 0.6,
      riskAdjusted: 0.08,
      upside: 0.12,
      var10: 0.01,
      cvar20: 0,
      start: 0.06,
      minutes: 0.006,
      benchExpectedReward: 0.03,
      benchStrengthReward: 0.04,
      valueEfficiencyReward: -0.02,
      budgetUseReward: 0.46,
      budgetRemainingReward: -0.24,
      topProjectedReward: 1.25,
      premiumReward: 2.4,
      premiumCountReward: 1.25,
      premiumConcentrationPenalty: -8,
      controlledStackReward: 0.12,
      attackingStackReward: 0.08,
      volatilityPenalty: 0.01,
      tailPenalty: 0.03,
      compositePenalty: 0.02,
      qaReviewPenalty: 0.75,
      qaWatchPenalty: 0.15,
      weakBenchPenalty: 0.45,
      premiumSqueezePenalty: -0.18,
      countryLimitPenalty: 0.45,
      hardFixturePenalty: 0.45,
      countryStackPenalty: 0.3,
      fixtureStackPenalty: 0.25,
      starDependencePenalty: -2.25,
      poorPremiumPenalty: 2.6,
      favorableFixtureReward: 0.18,
      matchUncertaintyPenalty: 0.35,
      uncertainFixtureStackPenalty: 0.7,
      strongXgReward: 0.55,
      cleanSheetContextReward: 0.2,
      lowXgPenalty: 1.2,
      difficultCleanSheetPenalty: 0.45,
      excessiveStackPenalty: 0.6
    }
  },
  valueSquad: {
    id: "valueSquad",
    version: teamBuilderOptimizerVersion,
    stateLimit: 640,
    partialBaseWeight: 0.38,
    partialStrategyWeight: 1,
    partialReserveWeight: 0.16,
    partialConcentrationPenalty: 0.9,
    partialPremiumReward: -0.25,
    partialCheapReward: 0.18,
    starterScoreWeight: 1.02,
    benchScoreWeight: 0.62,
    captainBonusWeight: 1,
    budgetBufferWeight: 0.35,
    playerWeights: {
      starter: { base: 0.1, expected: 0.36, riskAdjusted: 0.28, upside: 0.05, floor: 0.1, reliability: 0.2, value: 0.34, cheap: 0.1, premium: -0.08, price: -0.2, attackingContext: 0.02, captain: 0.08, fragilityPenalty: 0.48 },
      bench: { base: 0.08, expected: 0.22, riskAdjusted: 0.24, upside: 0.02, floor: 0.14, reliability: 0.24, value: 0.4, cheap: 0.18, premium: -0.1, price: -0.28, attackingContext: 0, captain: 0.02, fragilityPenalty: 0.62 }
    },
    portfolioWeights: {
      expected: 0.28,
      riskAdjusted: 0.24,
      upside: 0.03,
      var10: 0.08,
      cvar20: 0.06,
      start: 0.16,
      minutes: 0.018,
      benchExpectedReward: 0.36,
      benchStrengthReward: 0.48,
      valueEfficiencyReward: 0.7,
      budgetUseReward: 0.01,
      budgetRemainingReward: 0.1,
      topProjectedReward: 0.22,
      premiumReward: -0.1,
      premiumCountReward: -0.8,
      premiumConcentrationPenalty: 7,
      controlledStackReward: 0.02,
      attackingStackReward: 0.02,
      volatilityPenalty: 0.07,
      tailPenalty: 0.06,
      compositePenalty: 0.05,
      qaReviewPenalty: 1.6,
      qaWatchPenalty: 0.3,
      weakBenchPenalty: 4.2,
      premiumSqueezePenalty: 4.8,
      countryLimitPenalty: 0.8,
      hardFixturePenalty: 0.9,
      countryStackPenalty: 0.55,
      fixtureStackPenalty: 0.55,
      starDependencePenalty: 1.2,
      poorPremiumPenalty: 1.8,
      favorableFixtureReward: 0.1,
      matchUncertaintyPenalty: 0.42,
      uncertainFixtureStackPenalty: 0.75,
      strongXgReward: 0.48,
      cleanSheetContextReward: 0.45,
      lowXgPenalty: 0.35,
      difficultCleanSheetPenalty: 0.4,
      excessiveStackPenalty: 0.7
    }
  }
};

function knownTeamBuilderStrategyKey(key) {
  const normalizedKey = String(key || "").trim();
  return teamBuilderStrategyOptions[normalizedKey]
    ? normalizedKey
    : teamBuilderStrategyAliases[normalizedKey] || "";
}

function normalizeTeamBuilderStrategyKey(key) {
  return knownTeamBuilderStrategyKey(key) || "balancedSquad";
}

function teamBuilderStrategyOption(key) {
  return teamBuilderStrategyOptions[normalizeTeamBuilderStrategyKey(key)] || teamBuilderStrategyOptions.balancedSquad;
}

function teamBuilderStrategyKeyFromImport(styleKey, measureKey) {
  const candidates = [styleKey, measureKey].filter(Boolean);

  for (const candidate of candidates) {
    const normalizedKey = knownTeamBuilderStrategyKey(candidate);
    if (normalizedKey) {
      return normalizedKey;
    }
  }

  return "balancedSquad";
}

function teamBuilderStrategyMeasure(strategyOrKey) {
  const option = typeof strategyOrKey === "string"
    ? teamBuilderStrategyOption(strategyOrKey)
    : strategyOrKey;

  return measures[option?.measureKey] || measures.balanced;
}

function teamBuilderStrategyScoringProfile(strategyOrKey = activeBuilderStrategyOption()) {
  const option = typeof strategyOrKey === "string"
    ? teamBuilderStrategyOption(strategyOrKey)
    : strategyOrKey;

  return teamBuilderStrategyScoringProfiles[option?.id] || teamBuilderStrategyScoringProfiles.balancedSquad;
}

function pickModelOption(key) {
  return pickModelOptions[key] || pickModelOptions.balanced;
}

function publicPickModelLabel(key, fallback = "Pick") {
  return pickModelOptions[key]?.label || publicPickModelCopy[key]?.label || fallback;
}

function publicPickModelCardLabel(key, fallback = "Pick") {
  return pickModelOptions[key]?.cardLabel || publicPickModelCopy[key]?.cardLabel || fallback;
}

function publicPickModelKeyFromMode(mode) {
  const normalizedMode = String(mode || "").trim();
  const modeToPublicKey = {
    expected: "expected",
    projected: "expected",
    balanced: "balanced",
    core: "balanced",
    safe: "safe",
    high_floor: "safe",
    upside: "upside",
    bestValue: "bestValue",
    value: "bestValue",
    cheapEnabler: "cheapEnabler",
    budget: "cheapEnabler",
    budget_enabler: "cheapEnabler",
    differential: "differential",
    captain: "captain"
  };

  return modeToPublicKey[normalizedMode] || normalizedMode;
}

function publicPickModelLabelFromMode(mode, fallback = "Pick") {
  return publicPickModelLabel(publicPickModelKeyFromMode(mode), fallback);
}

function primaryPickTypeBadgeLabel({ label = "", measureKey = "balanced", modelKey = "" } = {}) {
  const rawLabel = String(label || "").toLowerCase();
  const key = publicPickModelKeyFromMode(modelKey || measureKey);
  const labelMap = {
    expected: "Top Projection",
    balanced: "Core Pick",
    safe: "High-Floor Pick",
    upside: "Upside Pick",
    bestValue: "Value Pick",
    differential: "Differential Pick",
    cheapEnabler: "Budget Enabler",
    captain: "Top Projection"
  };

  if (rawLabel.includes("budget enabler") || rawLabel.includes("cheap enabler")) return "Budget Enabler";
  if (rawLabel.includes("value")) return "Value Pick";
  if (rawLabel.includes("high-floor") || rawLabel.includes("high floor")) return "High-Floor Pick";
  if (rawLabel.includes("upside")) return "Upside Pick";
  if (rawLabel.includes("differential")) return "Differential Pick";
  if (rawLabel.includes("core")) return "Core Pick";
  if (rawLabel.includes("projection") || rawLabel.includes("projected points") || rawLabel.includes("captain")) return "Top Projection";

  return labelMap[key] || "Core Pick";
}

function pickModelMeasure(optionOrKey) {
  const option = typeof optionOrKey === "string" ? pickModelOption(optionOrKey) : optionOrKey;
  return measures[option?.measureKey] || measures.balanced;
}

function pickModelScore(player, optionOrKey, mode = activeTrustMode()) {
  const option = typeof optionOrKey === "string" ? pickModelOption(optionOrKey) : optionOrKey;
  if (typeof option?.score === "function") {
    return option.score(player, mode);
  }
  return trustAdjustedScore(player, pickModelMeasure(option), mode);
}

function sortByPickModel(playerList, optionOrKey, mode = activeTrustMode()) {
  return [...playerList].sort((a, b) => {
    const modelDifference = pickModelScore(b, optionOrKey, mode) - pickModelScore(a, optionOrKey, mode);

    if (modelDifference !== 0) {
      return modelDifference;
    }

    return scoreValue(b, "finance_risk_adjusted_return_points", "risk_adjusted_expected_points_estimate") -
      scoreValue(a, "finance_risk_adjusted_return_points", "risk_adjusted_expected_points_estimate");
  });
}

function pickListCardLabel(option, index) {
  return primaryPickTypeBadgeLabel({
    label: option.cardLabel || option.label,
    measureKey: option.measureKey,
    modelKey: option.id
  });
}

function previewFinanceContext(player) {
  return player.preview_candidate?.finance_context || player.preview_finance_context || {};
}

function financeContextScore(player, fieldName) {
  const rawValue = previewFinanceContext(player)[fieldName];
  if (rawValue === null || rawValue === undefined || rawValue === "") return null;

  const valueFromContext = Number(rawValue);
  return Number.isFinite(valueFromContext) ? valueFromContext : null;
}

const financeLenses = {
  styleRanking: {
    id: "styleRanking",
    label: "Style Ranking",
    shortLabel: "Style",
    description: "Keep the selected recommendation style order.",
    defaultLens: true,
    value: () => null
  },
  financeAlpha: {
    id: "financeAlpha",
    label: "Finance Alpha",
    shortLabel: "Alpha",
    description: "How much better the player looks than price, risk, and obviousness suggest.",
    value: (player) => financeContextScore(player, "finance_alpha_score")
  },
  valueOverReplacement: {
    id: "valueOverReplacement",
    label: "Value Over Replacement",
    shortLabel: "VOR",
    description: "Replacement-aware value signal when available; fallback uses risk-adjusted points per price.",
    value: (player) => {
      const replacementValue = financeContextScore(player, "value_over_replacement");
      if (Number.isFinite(replacementValue)) return replacementValue;

      const adjustedReturn = optionalScoreValue(player, "finance_risk_adjusted_return_points");
      const price = proxyPrice(player);
      return Number.isFinite(adjustedReturn) && price > 0 ? adjustedReturn / Math.max(price, 0.1) : null;
    }
  },
  downsideFloor: {
    id: "downsideFloor",
    label: "Downside Floor",
    shortLabel: "Floor",
    description: "Higher means a better modeled floor and less downside pressure.",
    value: (player) => {
      const downside = financeContextScore(player, "downside_risk_score");
      const floor = optionalScoreValue(player, "finance_var10_points");
      return Number.isFinite(downside) ? Math.max(0, 100 - downside) : floor;
    }
  },
  volatility: {
    id: "volatility",
    label: "Consistency",
    shortLabel: "Steady",
    description: "Higher means a steadier scoring profile.",
    value: (player) => {
      const volatility = financeContextScore(player, "volatility_score");
      const risk = optionalScoreValue(player, "finance_composite_risk_score", "risk_composite_score");
      return Number.isFinite(volatility)
        ? Math.max(0, 100 - volatility)
        : Number.isFinite(risk) ? Math.max(0, 100 - risk) : null;
    }
  },
  portfolioFit: {
    id: "portfolioFit",
    label: "Portfolio Fit",
    shortLabel: "Portfolio",
    description: "How well the player fits a balanced fantasy portfolio.",
    value: (player) => financeContextScore(player, "portfolio_fit_score")
  },
  premiumCheck: {
    id: "premiumCheck",
    label: "Premium Check",
    shortLabel: "Premium",
    description: "Higher means less premium squeeze or overpay pressure.",
    value: (player) => {
      const squeeze = financeContextScore(player, "premium_squeeze_score");
      const overpayRisk = optionalScoreValue(player, "overpay_risk_v1", "overpay_risk");
      const premiumWorthIt = optionalScoreValue(player, "premium_worth_it_score_v1", "premium_worth_it_score");
      if (Number.isFinite(squeeze)) return Math.max(0, 100 - squeeze);
      if (Number.isFinite(overpayRisk)) return Math.max(0, 100 - overpayRisk);
      return premiumWorthIt;
    }
  },
  sharpe: {
    id: "sharpe",
    label: "Sharpe-Like Efficiency",
    shortLabel: "Sharpe",
    description: "Expected return balanced against overall volatility.",
    value: (player) => optionalScoreValue(player, "finance_sharpe_like_percentile", "risk_adjusted_sharpe_like")
  },
  sortino: {
    id: "sortino",
    label: "Sortino-Like Efficiency",
    shortLabel: "Sortino",
    description: "Expected return balanced against downside volatility.",
    value: (player) => optionalScoreValue(player, "finance_sortino_like_percentile", "risk_adjusted_sortino_like")
  },
  var10: {
    id: "var10",
    label: "Bad-Week Floor",
    shortLabel: "Floor",
    description: "Modeled score line for a poor outcome.",
    value: (player) => optionalScoreValue(player, "finance_var10_points")
  },
  cvar20: {
    id: "cvar20",
    label: "Stress-Case Floor",
    shortLabel: "Stress",
    description: "Average score line for the weakest modeled outcomes.",
    value: (player) => optionalScoreValue(player, "finance_cvar20_points")
  }
};

const trustModes = {
  strict: {
    id: "strict",
    label: "Safe",
    optionLabel: "Safe",
    description: "Lower-risk preference. Strongly prefers confirmed players with better data, starts, minutes, and downside profile without making the squad builder feel blocked.",
    formula: "Conservative strongly penalizes uncertain roster status, non-safe recommendation use, input coverage below 65, start probability below 55%, expected minutes below 45, composite risk 65+, and tail risk 70+. It keeps players available so the builder can still complete squads.",
    filtersRanking: false,
    minDataConfidence: 65,
    minStartProbability: 55,
    minExpectedMinutes: 45,
    maxCompositeRisk: 65,
    maxTailRisk: 70,
    requireConfirmedRoster: true,
    allowedRecommendationUses: ["safe_to_rank"],
    flagPenaltyMultiplier: 1.15,
    failurePenalty: 12,
    upsideBoost: 0,
    volatilityBoost: 0,
    veryRiskyBoost: 0
  },
  balanced: {
    id: "balanced",
    label: "Balanced",
    optionLabel: "Balanced",
    description: "Default mode. Keeps the full recommendation pool but applies meaningful data-check penalties for weak data, uncertain role, and difficult fixtures.",
    formula: "Balanced mode keeps players available, then subtracts data-check penalties for source, roster, role, risk, tail-risk, and matchday fixture warnings.",
    filtersRanking: false,
    flagPenaltyMultiplier: 0.75,
    failurePenalty: 0,
    upsideBoost: 0,
    volatilityBoost: 0,
    veryRiskyBoost: 0
  },
  aggressive: {
    id: "aggressive",
    label: "Upside",
    optionLabel: "Upside",
    description: "Allows more uncertainty for users chasing upside. Data warnings still appear, but the score penalty is lighter.",
    formula: "Aggressive keeps the full player pool, applies lighter data-check penalties, and adds a small boost for upside, attack-heavy, and very-risky profile signals.",
    filtersRanking: false,
    flagPenaltyMultiplier: 0.35,
    failurePenalty: 0,
    upsideBoost: 0.04,
    volatilityBoost: 0.01,
    veryRiskyBoost: 0.04
  },
  chaos: {
    id: "chaos",
    label: "Differential",
    optionLabel: "Differential",
    description: "Speculative mode for differential picks and boom-or-bust watchlists. It tolerates weak floors and rewards upside and upset context.",
    formula: "Differential mode applies only small data-check penalties, then boosts very-risky strategy score, upside percentile, volatility percentile, and match upset probability.",
    filtersRanking: false,
    flagPenaltyMultiplier: 0.15,
    failurePenalty: 0,
    upsideBoost: 0.07,
    volatilityBoost: 0.04,
    veryRiskyBoost: 0.12,
    upsetBoost: 18
  }
};

const advicePoolModes = {
  playable: {
    id: "playable",
    label: "Main picks",
    shortLabel: "Playable",
    description: "Hides data-review, watchlist-only, manual-review, and do-not-rank players."
  },
  watchlist: {
    id: "watchlist",
    label: "Include watchlist differentials",
    shortLabel: "Watchlist",
    description: "Includes the broader pool so risky upside and data-review differentials can appear with warnings."
  }
};

const safeCaptainChangeRiskMode = {
  label: "High-Floor Picks",
  badge: "High-floor check",
  switchBuffer: 1.5,
  closeMargin: 0.8,
  projectionLabel: "High-floor switch score"
};

const captainChangeRiskModes = {
  safe: safeCaptainChangeRiskMode,
  safer: safeCaptainChangeRiskMode,
  balanced: {
    label: "Core Picks",
    badge: "Core check",
    switchBuffer: 0.8,
    closeMargin: 0.8,
    projectionLabel: "Core switch score"
  },
  upside: {
    label: "Upside Picks",
    badge: "Upside check",
    switchBuffer: 0.2,
    closeMargin: 0.6,
    projectionLabel: "Upside switch score"
  },
  differential: {
    label: "Differential Picks",
    badge: "Differential check",
    switchBuffer: 0,
    closeMargin: 0.5,
    projectionLabel: "Differential switch score"
  }
};

const safeSubstitutionAdvisorRiskMode = {
  label: "High-Floor Picks",
  badge: "High-floor check",
  subBuffer: 1.3,
  closeMargin: 0.8,
  projectionLabel: "High-floor sub score"
};

const substitutionAdvisorRiskModes = {
  safe: safeSubstitutionAdvisorRiskMode,
  safer: safeSubstitutionAdvisorRiskMode,
  balanced: {
    label: "Core Picks",
    badge: "Core check",
    subBuffer: 0.7,
    closeMargin: 0.7,
    projectionLabel: "Core sub score"
  },
  upside: {
    label: "Upside Picks",
    badge: "Upside check",
    subBuffer: 0.2,
    closeMargin: 0.6,
    projectionLabel: "Upside sub score"
  },
  differential: {
    label: "Differential Picks",
    badge: "Differential check",
    subBuffer: 0,
    closeMargin: 0.5,
    projectionLabel: "Differential sub score"
  }
};

const trustFlagPenalties = {
  not_safe_to_rank: 16,
  rank_caveat: 6,
  watchlist_only: 12,
  manual_rank_review: 18,
  do_not_rank_yet: 22,
  low_data_confidence: 12,
  roster_not_confirmed: 8,
  low_start_probability: 14,
  low_expected_minutes: 12,
  high_substitution_risk: 7,
  high_composite_risk: 7,
  high_tail_risk: 7,
  negative_var10_floor: 6,
  multiple_source_review_flags: 4,
  missing_league: 5,
  missing_fixture_context: 8,
  hard_fixture: 6,
  favorable_fixture: -2,
  missing_fixture_xg: 5,
  attack_pick_low_team_xg: 8,
  defensive_pick_low_clean_sheet: 8,
  very_risky_low_upset_context: 4
};

const captainTrustMeasure = {
  key: "captain",
  label: "Captain Score",
  score: (player) => captainScore(player)
};

// This menu controls the extra stat shown on each player card on the field.
const cardStats = {
  balanced: {
    label: "Strategy Score",
    value: (player) => teamBuilderStrategyPlayerScore(player, activeMeasure(), "starter", teamBuilderStrategyScoringProfile())
  },
  expected: {
    label: "Projected Points",
    value: (player) => value(player.risk_adjusted_expected_points_estimate)
  },
  reliability: {
    label: "Reliability",
    value: (player) => value(player.euro_style_reliability_score)
  },
  per90: {
    label: "Per 90",
    value: (player) => value(player.euro_style_points_per90_estimate)
  },
  risk: {
    label: "Risk",
    value: (player) => value(player.risk_composite_score)
  },
  tailRisk: {
    label: "Squad Risk",
    value: (player) => value(player.risk_tail_score)
  },
  sharpe: {
    label: "Sharpe-Style Score",
    value: (player) => value(player.risk_adjusted_sharpe_like)
  },
  sortino: {
    label: "Sortino-Style Score",
    value: (player) => value(player.risk_adjusted_sortino_like)
  },
  startProbability: {
    label: "Start %",
    value: (player) => scoreValue(player, "start_probability_percent")
  },
  expectedMinutes: {
    label: "Expected Minutes",
    value: (player) => scoreValue(player, "expected_minutes_v0")
  },
  substitutionRisk: {
    label: "Substitution Risk",
    value: (player) => scoreValue(player, "substitution_risk")
  },
  proxyPrice: {
    label: "Budget Price",
    value: (player) => proxyPrice(player)
  },
  bestValue: {
    label: "Value Score",
    value: (player) => measureScore(player, measures.bestValue)
  },
  cheapEnabler: {
    label: "Cheap Enabler",
    value: (player) => scoreValue(player, "cheap_enabler_score_v1", "cheap_enabler_score")
  },
  premiumWorthIt: {
    label: "Premium Worth It",
    value: (player) => scoreValue(player, "premium_worth_it_score_v1", "premium_worth_it_score")
  },
  overpayRisk: {
    label: "Budget Pressure",
    value: (player) => scoreValue(player, "overpay_risk_v1", "overpay_risk")
  },
  var10: {
    label: "Bad-Week Floor",
    value: (player) => scoreValue(player, "finance_var10_points")
  },
  cvar20: {
    label: "Worst-Case Floor",
    value: (player) => scoreValue(player, "finance_cvar20_points")
  },
  omega: {
    label: "Omega-Style Score",
    value: (player) => scoreValue(player, "finance_omega_like_percentile")
  },
  attackHeavy: {
    label: "Attack Heavy",
    value: (player) => scoreValue(player, "finance_strategy_attack_heavy", "attack_score")
  },
  defensiveHeavy: {
    label: "Defensive Heavy",
    value: (player) => scoreValue(player, "finance_strategy_defensive_heavy", "defense_score")
  },
  veryRisky: {
    label: "Very Risky Upside",
    value: (player) => scoreValue(player, "finance_strategy_very_risky")
  }
};

const lockedPlayerIds = new Set();
const excludedPlayerIds = new Set();

const buildTeamButtonTop = document.getElementById("build-team-btn-top");
const buildTeamButtonBottom = document.getElementById("build-team-btn-bottom");
const resetTeamButton = document.getElementById("reset-team-btn");
const clearLockedButton = document.getElementById("clear-locked-btn");
const removeSelectedPlayerButton = document.getElementById("remove-selected-player-btn");
const saveBrowserSquadButton = document.getElementById("save-browser-squad-btn");
const loadBrowserSquadButton = document.getElementById("load-browser-squad-btn");
const clearBrowserSquadButton = document.getElementById("clear-browser-squad-btn");
const browserSquadStatus = document.getElementById("browser-squad-status");
const exportTeamJsonButton = document.getElementById("export-team-json-btn");
const importTeamJsonInput = document.getElementById("import-team-json-input");
const removedPlayersPanel = document.getElementById("removed-players-panel");
const removedPlayersList = document.getElementById("removed-players-list");
const teamExportPanel = document.getElementById("team-export-panel");
const teamExportOutput = document.getElementById("team-export-output");
const heroSquadTotal = document.getElementById("hero-squad-total");
const heroSquadCopy = document.getElementById("hero-squad-copy");
const squadRuleNote = document.getElementById("squad-rule-note");
const tacticSelect = document.getElementById("tactic-select");
const measureSelect = document.getElementById("measure-select");
const adviceMeasureSelect = document.getElementById("advice-measure-select");
const adviceFinanceLensSelect = document.getElementById("advice-finance-lens-select");
const advicePositionSelect = document.getElementById("advice-position-select");
const adviceMatchdaySelect = document.getElementById("advice-matchday-select");
const advicePoolSelect = document.getElementById("advice-pool-select");
const builderMatchdaySelect = document.getElementById("builder-matchday-select");
const quickPickModelSelect = document.getElementById("quick-pick-model-select");
const quickPositionSelect = document.getElementById("quick-position-select");
const quickModelHelpButton = document.getElementById("quick-model-help-btn");
const quickModelHelp = document.getElementById("quick-model-help");
const quickModelHelpList = document.getElementById("quick-model-help-list");
const quickTrustModeSelect = document.getElementById("quick-trust-mode-select");
const captainTrustModeSelect = document.getElementById("captain-trust-mode-select");
const adviceTrustModeSelect = document.getElementById("advice-trust-mode-select");
const builderTrustModeSelect = document.getElementById("builder-trust-mode-select");
const environmentMatchdaySelect = document.getElementById("environment-matchday-select");
const environmentGroupSelect = document.getElementById("environment-group-select");
const environmentFilterSelect = document.getElementById("environment-filter-select");
const matchdayDecisionMatchdaySelect = document.getElementById("matchday-decision-matchday-select");
const matchdayDecisionRiskSelect = document.getElementById("matchday-decision-risk-select");
const matchdayDecisionCaptainPointsInput = document.getElementById("matchday-decision-captain-points-input");
const matchdayDecisionStarterSelect = document.getElementById("matchday-decision-starter-select");
const matchdayDecisionStarterPointsInput = document.getElementById("matchday-decision-starter-points-input");
const matchdayDecisionCenterContent = document.getElementById("matchday-decision-center-content");
const captainChangeForm = document.getElementById("captain-change-form");
const captainChangeMatchdaySelect = document.getElementById("captain-change-matchday-select");
const captainChangeCurrentCountrySelect = document.getElementById("captain-change-current-country-select");
const captainChangeCurrentPositionSelect = document.getElementById("captain-change-current-position-select");
const captainChangeCurrentPlayerInput = document.getElementById("captain-change-current-player-input");
const captainChangeCurrentPointsInput = document.getElementById("captain-change-current-points-input");
const captainChangeCandidateCountrySelect = document.getElementById("captain-change-candidate-country-select");
const captainChangeCandidatePositionSelect = document.getElementById("captain-change-candidate-position-select");
const captainChangeCandidateInput = document.getElementById("captain-change-candidate-input");
const captainChangeRiskSelect = document.getElementById("captain-change-risk-select");
const captainChangeResetButton = document.getElementById("captain-change-reset-btn");
const captainChangeSquadPanel = document.getElementById("captain-change-squad-panel");
const captainChangePlayerList = document.getElementById("captain-change-player-list");
const captainChangeStatus = document.getElementById("captain-change-status");
const captainChangeResult = document.getElementById("captain-change-result");
const substitutionAdvisorForm = document.getElementById("substitution-advisor-form");
const substitutionAdvisorMatchdaySelect = document.getElementById("substitution-advisor-matchday-select");
const substitutionAdvisorStarterCountrySelect = document.getElementById("substitution-advisor-starter-country-select");
const substitutionAdvisorStarterPositionSelect = document.getElementById("substitution-advisor-starter-position-select");
const substitutionAdvisorStarterInput = document.getElementById("substitution-advisor-starter-input");
const substitutionAdvisorPointsInput = document.getElementById("substitution-advisor-points-input");
const substitutionAdvisorBenchCountrySelect = document.getElementById("substitution-advisor-bench-country-select");
const substitutionAdvisorBenchPositionSelect = document.getElementById("substitution-advisor-bench-position-select");
const substitutionAdvisorBenchInput = document.getElementById("substitution-advisor-bench-input");
const substitutionAdvisorRiskSelect = document.getElementById("substitution-advisor-risk-select");
const substitutionAdvisorResetButton = document.getElementById("substitution-advisor-reset-btn");
const substitutionAdvisorSquadPanel = document.getElementById("substitution-advisor-squad-panel");
const substitutionAdvisorPlayerList = document.getElementById("substitution-advisor-player-list");
const substitutionAdvisorStatus = document.getElementById("substitution-advisor-status");
const substitutionAdvisorResult = document.getElementById("substitution-advisor-result");
const savedSquadTimelineMatchdaySelect = document.getElementById("saved-squad-timeline-matchday-select");
const savedSquadTimelineContent = document.getElementById("saved-squad-timeline-content");
const cardStatSelect = document.getElementById("card-stat-select");
const measureInfo = document.getElementById("measure-info");
const scoreInfoButton = document.getElementById("score-info-btn");
const scoreInfo = document.getElementById("score-info");
const playerSearch = document.getElementById("player-search");
const positionFilter = document.getElementById("position-filter");
const countryFilter = document.getElementById("country-filter");
const minStartFilter = document.getElementById("min-start-filter");
const minMinutesFilter = document.getElementById("min-minutes-filter");
const maxQaReviewFilter = document.getElementById("max-qa-review-filter");
const allowRiskyPicksToggle = document.getElementById("allow-risky-picks-toggle");
const minPriceFilter = document.getElementById("min-price-filter");
const maxPriceFilter = document.getElementById("max-price-filter");
const playerPicker = document.getElementById("player-picker");
const builderWarning = document.getElementById("builder-warning");
const builderReadyActions = document.getElementById("builder-ready-actions");
const builderReadySummary = document.getElementById("builder-ready-summary");
const ruleCheckSummary = document.getElementById("rule-check-summary");
const rulesValidationList = document.getElementById("rules-validation-list");
const countryCountsList = document.getElementById("country-counts-list");
const portfolioAnalytics = document.getElementById("portfolio-analytics");
const portfolioSummary = document.getElementById("portfolio-summary");
const portfolioRiskLabel = document.getElementById("portfolio-risk-label");
const portfolioMetrics = document.getElementById("portfolio-metrics");
const portfolioWarnings = document.getElementById("portfolio-warnings");
const squadStrategyReport = document.getElementById("squad-strategy-report");
const squadStrategyReportSummary = document.getElementById("squad-strategy-report-summary");
const squadStrategyReportLabel = document.getElementById("squad-strategy-report-label");
const squadStrategyReportMetrics = document.getElementById("squad-strategy-report-metrics");
const squadStrategyReportFit = document.getElementById("squad-strategy-report-fit");
const runStrategyComparisonButton = document.getElementById("run-strategy-comparison-btn");
const strategyComparisonStatus = document.getElementById("strategy-comparison-status");
const strategyComparisonAlerts = document.getElementById("strategy-comparison-alerts");
const strategyComparisonOverlap = document.getElementById("strategy-comparison-overlap");
const strategyComparisonGrid = document.getElementById("strategy-comparison-grid");
const teamField = document.getElementById("team-field");
const teamPlayers = document.getElementById("team-players");
const benchPanel = document.getElementById("bench-panel");
const benchPlayers = document.getElementById("bench-players");
const benchDescription = document.getElementById("bench-description");
const benchCount = document.getElementById("bench-count");
const swapMessage = document.getElementById("swap-message");
const teamMessage = document.getElementById("team-message");
const builderLockStatus = document.getElementById("builder-lock-status");
const builderRemovedStatus = document.getElementById("builder-removed-status");
const builderBuildGuidance = document.getElementById("builder-build-guidance");
const builderReviewStatus = document.getElementById("builder-review-status");
const builderFlowSteps = Array.from(document.querySelectorAll("[data-builder-flow-step]"));
const playerDetailModal = document.getElementById("player-detail-modal");
const playerDetailPanel = document.querySelector(".player-detail-panel");
const playerDetailTitle = document.getElementById("player-detail-title");
const playerDetailSubtitle = document.getElementById("player-detail-subtitle");
const playerDetailBody = document.getElementById("player-detail-body");
const playerDetailClose = document.getElementById("player-detail-close");
const summaryTactic = document.getElementById("summary-tactic");
const summaryPrice = document.getElementById("summary-price");
const summaryBudget = document.getElementById("summary-budget");
const summaryRisk = document.getElementById("summary-risk");
const summaryLocked = document.getElementById("summary-locked");
const dashboardGrid = document.getElementById("dashboard-grid");
const picksBuilderTray = document.getElementById("picks-builder-tray");
const captainCardGrid = document.getElementById("captain-card-grid");
const captainTableBody = document.getElementById("captain-table-body");
const adviceCardGrid = document.getElementById("advice-card-grid");
const adviceTableBody = document.getElementById("advice-table-body");
const adviceStyleNote = document.getElementById("advice-style-note");
const trustModeSummary = document.getElementById("trust-mode-summary");
const matchEnvironmentSummary = document.getElementById("match-environment-summary");
const matchEnvironmentTableBody = document.getElementById("match-environment-table-body");
const knockoutKnownFixturesBody = document.getElementById("knockout-known-fixtures-body");
const knockoutFixtureSelect = document.getElementById("knockout-fixture-select");
const knockoutMatchupResult = document.getElementById("knockout-matchup-result");
const knockoutBracketSummary = document.getElementById("knockout-bracket-summary");
const knockoutBracketBoard = document.getElementById("knockout-bracket-board");
const trustModeSelects = [
  quickTrustModeSelect,
  captainTrustModeSelect,
  adviceTrustModeSelect,
  builderTrustModeSelect
].filter(Boolean);

let selectedPositionFilter = "All";
let selectedCountryFilter = "All";
let currentRenderedTeam = [];
let currentBenchPlayers = [];
let currentIgnoredLockedPlayers = [];
let currentRenderMode = "preview";
let selectedSwap = null;
let currentStarterSlotsByPosition = {};
let currentBenchSlotsByPosition = {};
let lastPlayerDetailTrigger = null;
let lastCaptainChangeDecision = null;
let lastSubstitutionDecision = null;
let userCaptainId = null;
let userViceCaptainId = null;
let userBenchOrderIds = [];
let optimizerPriceFloorCache = null;
let optimizerStateRankCache = new WeakMap();
const qaFlagsCache = new Map();
const rawMeasureScoreCache = new Map();
const trustAdjustedScoreCache = new Map();
const teamBuilderStrategyPlayerScoreCache = new Map();
const captainChangePlayerLabelLookup = new Map();

function value(number) {
  return Number(number) || 0;
}

function hasScoreValue(player, fieldName) {
  const fieldValue = player?.[fieldName];

  return fieldValue !== null && fieldValue !== undefined && fieldValue !== "" && Number.isFinite(Number(fieldValue));
}

function activeMatchdayOption() {
  return matchdayOptions.find((option) => option.matchday_id === activeMatchdayId) || matchdayOptions[0];
}

function activeMatchdayLabel() {
  return activeMatchdayOption()?.label || "Full Group Stage";
}

function shortMatchdayLabel(matchdayId = activeMatchdayId) {
  const label = matchdayLabelFromId(matchdayId);
  if (label === "Full Group Stage") {
    return "Group Stage";
  }
  return label.replace(/^Matchday\s+/i, "MD");
}

function builderActionLabel() {
  return `Build ${shortMatchdayLabel(activeMatchdayId)} Squad`;
}

function renderBuilderActionCopy() {
  const label = builderActionLabel();
  [buildTeamButtonTop, buildTeamButtonBottom].filter(Boolean).forEach((button) => {
    button.textContent = label;
  });
  if (builderBuildGuidance) {
    builderBuildGuidance.textContent = `Click ${label} to fill 15 players from your strategy, locks, budget, and rules.`;
  }
}

function matchdayLabelFromId(matchdayId) {
  return matchdayOptions.find((option) => option.matchday_id === matchdayId)?.label || matchdayId || "Matchday";
}

function projectionIsAvailable(projection) {
  return Boolean(projection && projection.available !== false);
}

function projectionIsMissing(projection) {
  return Boolean(projection && projection.available === false);
}

function missingActiveFantasyPoolProjection(player, matchdayId) {
  return {
    available: false,
    reason: "Missing active fantasyPool MD projection",
    matchdayId,
    matchday_id: matchdayId,
    matchday_label: matchdayLabelFromId(matchdayId),
    playerId: player?.id || player?.official_fantasy_player_id || null,
    player_id: player?.id || player?.official_fantasy_player_id || null
  };
}

function projectionForPlayerMatchday(player, matchdayId) {
  if (!player || !matchdayId || matchdayId === "group_stage_full") {
    return null;
  }

  const playerProjection = player.preview_matchday_projections_by_matchday?.[matchdayId];
  if (playerProjection) {
    return playerProjection;
  }

  const projectionKeys = [
    fantasyPoolPlayerKey(player),
    player?.preview_player_key,
    player?.official_fantasy_player_id,
    player?.internal_player_id,
    player?.source_player_id,
    player?.id
  ].filter(Boolean).map(String);

  for (const key of projectionKeys) {
    const activeProjection = fantasyPoolPreviewProjectionLookup.get(key)?.[matchdayId];
    if (activeProjection) {
      return activeProjection;
    }
  }

  return missingActiveFantasyPoolProjection(player, matchdayId);
}

function activeProjection(player) {
  if (activeMatchdayId === "group_stage_full") {
    return null;
  }

  return projectionForPlayerMatchday(player, activeMatchdayId);
}

function projectionFieldName(fieldName) {
  return projectionFieldMap[fieldName] || fieldName;
}

function scoreValue(player, ...fieldNames) {
  const projection = activeProjection(player);

  if (projectionIsMissing(projection)) {
    return 0;
  }

  if (projectionIsAvailable(projection)) {
    const projectedField = fieldNames
      .map(projectionFieldName)
      .find((fieldName) => hasScoreValue(projection, fieldName));

    if (projectedField) {
      return Number(projection[projectedField]);
    }
  }

  const fieldName = fieldNames.find((name) => hasScoreValue(player, name));

  return fieldName ? Number(player[fieldName]) : 0;
}

function optionalScoreValue(player, ...fieldNames) {
  const projection = activeProjection(player);

  if (projectionIsMissing(projection)) {
    return null;
  }

  if (projectionIsAvailable(projection)) {
    const projectedField = fieldNames
      .map(projectionFieldName)
      .find((fieldName) => hasScoreValue(projection, fieldName));

    if (projectedField) {
      return Number(projection[projectedField]);
    }
  }

  const fieldName = fieldNames.find((name) => hasScoreValue(player, name));

  return fieldName ? Number(player[fieldName]) : null;
}

function projectionContextText(player) {
  const projection = activeProjection(player);

  if (!projectionIsAvailable(projection)) {
    return activeMatchdayLabel();
  }

  return `${projection.matchday_label} vs ${projection.opponent}`;
}

function roleLabel(role) {
  const labels = {
    locked_starter: "locked starter",
    likely_starter: "likely starter",
    rotation: "rotation",
    bench_option: "bench option",
    needs_check: "role needs check"
  };

  return labels[role] || "role needs check";
}

function playerRoleText(player) {
  const role = activeProjection(player)?.country_role || player.country_role;
  const expectedMinutes = scoreValue(player, "expected_minutes_v0");
  const startProbability = scoreValue(player, "start_probability_percent");

  if (!role && !expectedMinutes && !startProbability) {
    return "";
  }

  return `${roleLabel(role)} · ${displayNumber(startProbability)}% start · ${displayNumber(expectedMinutes)} min`;
}

function money(number) {
  return budgetText(number);
}

function proxyPrice(player) {
  return Math.max(scoreValue(player, "proxy_price_v1", "proxy_price_v0", "price"), 1);
}

function playerPriceText(player) {
  const priceText = money(player.price);

  return priceText;
}

function playerPriceDetailText(player) {
  const priceText = playerPriceText(player);

  return player.price_is_proxy ? `${priceText} est.` : priceText;
}

function displayNumber(number) {
  return value(number).toFixed(1).replace(".0", "");
}

function compactCount(number) {
  const count = Number(number) || 0;

  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(count >= 10000000 ? 0 : 1).replace(".0", "")}m`;
  }

  if (count >= 1000) {
    return `${Math.round(count / 1000)}k`;
  }

  return String(count);
}

function percentText(number) {
  return `${displayNumber(value(number) * 100)}%`;
}

function titleFromSnake(text) {
  return String(text || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function recommendationUseForPlayer(player) {
  if (player.recommendation_use) {
    return player.recommendation_use;
  }

  return fantasyPoolFinanceRows.length ? "safe_to_rank" : "manual_review_before_ranking";
}

function goalEnvironmentLabel(environment) {
  const labels = {
    high_goal_environment: "High",
    medium_high_goal_environment: "Medium High",
    medium_goal_environment: "Medium",
    low_goal_environment: "Low"
  };

  return labels[environment] || titleFromSnake(environment);
}

const compactTeamCodeOverrides = {
  "algeria": "ALG",
  "argentina": "ARG",
  "australia": "AUS",
  "austria": "AUT",
  "belgium": "BEL",
  "bosnia-and-herzegovina": "BIH",
  "brazil": "BRA",
  "cabo-verde": "CPV",
  "canada": "CAN",
  "colombia": "COL",
  "congo-dr": "COD",
  "cote-d-ivoire": "CIV",
  "croatia": "CRO",
  "curacao": "CUW",
  "czechia": "CZE",
  "ecuador": "ECU",
  "egypt": "EGY",
  "england": "ENG",
  "france": "FRA",
  "germany": "GER",
  "ghana": "GHA",
  "haiti": "HAI",
  "ir-iran": "IRN",
  "iraq": "IRQ",
  "japan": "JPN",
  "jordan": "JOR",
  "korea-republic": "KOR",
  "mexico": "MEX",
  "morocco": "MAR",
  "netherlands": "NED",
  "new-zealand": "NZL",
  "norway": "NOR",
  "panama": "PAN",
  "paraguay": "PAR",
  "portugal": "POR",
  "qatar": "QAT",
  "saudi-arabia": "KSA",
  "scotland": "SCO",
  "senegal": "SEN",
  "south-africa": "RSA",
  "spain": "ESP",
  "sweden": "SWE",
  "switzerland": "SUI",
  "tunisia": "TUN",
  "turkiye": "TUR",
  "uruguay": "URU",
  "usa": "USA",
  "uzbekistan": "UZB"
};

function compactTeamCode(teamId, teamName) {
  const key = String(teamId || "").toLowerCase();
  if (compactTeamCodeOverrides[key]) {
    return compactTeamCodeOverrides[key];
  }

  const name = String(teamName || "").replace(/[^a-zA-Z]/g, "");
  return name ? name.slice(0, 3).toUpperCase() : "TBD";
}

function scoreContextField(row, camelField, snakeField) {
  if (!row) {
    return null;
  }

  return row[camelField] ?? row[snakeField] ?? null;
}

function firstFiniteNumber(...numbers) {
  for (const number of numbers) {
    const nextValue = Number(number);
    if (Number.isFinite(nextValue)) {
      return nextValue;
    }
  }

  return 0;
}

function firstFiniteNumberOrNull(...numbers) {
  for (const number of numbers) {
    const nextValue = Number(number);
    if (Number.isFinite(nextValue)) {
      return nextValue;
    }
  }

  return null;
}

function compactPercentText(number) {
  return `${Math.round(value(number) * 100)}%`;
}

function displayMatchNumber(number) {
  const rounded = Math.round((value(number) + Number.EPSILON) * 10) / 10;
  return rounded.toFixed(1).replace(".0", "");
}

function publicGoalContextFromTotal(totalExpectedGoals) {
  const total = value(totalExpectedGoals);
  if (total >= 2.95) return "Strong";
  if (total >= 2.55) return "Good";
  if (total >= 2.2) return "Neutral";
  return "Difficult";
}

function publicUpsetRiskFromProbability(probability) {
  const risk = value(probability);
  if (risk >= 0.28) return "High";
  if (risk >= 0.12) return "Medium";
  return "Low";
}

function publicCleanSheetContextFromProbability(probability) {
  const cleanSheet = value(probability);
  if (cleanSheet >= 0.55) return "Strong";
  if (cleanSheet >= 0.38) return "Good";
  if (cleanSheet >= 0.22) return "Neutral";
  return "Difficult";
}

function scoreContextLabel(row, camelField, snakeField, fallback) {
  return scoreContextField(row, camelField, snakeField) || fallback || "Neutral";
}

function matchUncertaintyLabel(row) {
  const explicit = scoreContextField(row, "matchUncertainty", "match_uncertainty") ||
    scoreContextField(row, "uncertaintyLabel", "uncertainty_label");
  if (explicit) {
    return explicit;
  }

  const upsetRisk = value(row?.upset_risk_probability);
  const favoriteWin = value(row?.favorite_win_probability);
  const totalGoals = value(row?.total_expected_goals);
  if (upsetRisk >= 0.28 || favoriteWin < 0.48 || totalGoals >= 2.95) return "High";
  if (upsetRisk >= 0.12 || favoriteWin < 0.62 || totalGoals >= 2.55 || totalGoals <= 2.05) return "Medium";
  return "Low";
}

function matchUncertaintyReason(row) {
  return scoreContextField(row, "uncertaintyReason", "uncertainty_reason") || "Based on total goals range, favorite strength, and win/draw/win shape.";
}

function projectedXgForRow(row) {
  const projectedXg = row?.projectedXg || row?.projected_xg || {};
  const home = firstFiniteNumber(
    scoreContextField(row, "homeProjectedXg", "home_projected_xg"),
    scoreContextField(row, "homeMatchXg", "home_match_xg"),
    projectedXg.home,
    projectedXg.home_expected_goals,
    row?.home_expected_goals,
    scoreContextField(row, "homeXgBase", "home_xg_base")
  );
  const away = firstFiniteNumber(
    scoreContextField(row, "awayProjectedXg", "away_projected_xg"),
    scoreContextField(row, "awayMatchXg", "away_match_xg"),
    projectedXg.away,
    projectedXg.away_expected_goals,
    row?.away_expected_goals,
    scoreContextField(row, "awayXgBase", "away_xg_base")
  );

  return {
    home,
    away,
    total: firstFiniteNumber(row?.total_expected_goals, home + away)
  };
}

function projectedXgText(row) {
  const projectedXg = projectedXgForRow(row);
  const homeCode = compactTeamCode(row?.home_team_id, row?.home_team);
  const awayCode = compactTeamCode(row?.away_team_id, row?.away_team);
  return `${homeCode} ${displayMatchNumber(projectedXg.home)} - ${awayCode} ${displayMatchNumber(projectedXg.away)}`;
}

function winDrawWinText(row) {
  const homeCode = compactTeamCode(row?.home_team_id, row?.home_team);
  const awayCode = compactTeamCode(row?.away_team_id, row?.away_team);
  return `${homeCode} ${compactPercentText(row?.home_win_probability)} · Draw ${compactPercentText(row?.draw_probability)} · ${awayCode} ${compactPercentText(row?.away_win_probability)}`;
}

function topScorelineAlternativesText(row) {
  const alternatives = Array.isArray(row?.top_scorelines)
    ? row.top_scorelines.slice(1, 3).filter((scoreline) => scoreline?.scoreline)
    : [];

  if (!alternatives.length) {
    return "";
  }

  return `Other likely scores: ${alternatives.map((scoreline) => `${scoreline.scoreline} (${compactPercentText(scoreline.probability)})`).join(" · ")}`;
}

function totalGoalsRangeText(row) {
  const goalRange = goalRangeForRow(row);
  return `Total goals range: ${displayMatchNumber(goalRange.low)}-${displayMatchNumber(goalRange.high)}`;
}

function matchShapePhrase(row) {
  const projectedXg = projectedXgForRow(row);
  const totalGoals = projectedXg.total;
  const favoriteWin = value(row?.favorite_win_probability);
  const upsetRisk = value(row?.upset_risk_probability);
  const homeAwayGap = Math.abs(value(row?.home_win_probability) - value(row?.away_win_probability));

  if (favoriteWin >= 0.64 && upsetRisk >= 0.2) return "Favorite, not settled";
  if (favoriteWin >= 0.68) return "Clear favorite";
  if (totalGoals >= 2.85) return "Open match";
  if (totalGoals <= 2.15 && homeAwayGap <= 0.18) return "Tight low-score match";
  if (homeAwayGap <= 0.14 || favoriteWin < 0.55) return "Close match";
  return totalGoals <= 2.15 ? "Tight low-score match" : "Close match";
}

function cleanSheetContextForSide(row, side) {
  const isHome = side === "home";
  const prediction = isHome ? row?.home_team_prediction : row?.away_team_prediction;
  const probability = isHome ? row?.home_clean_sheet_probability : row?.away_clean_sheet_probability;
  return scoreContextLabel(prediction, "cleanSheetContext", "clean_sheet_context", publicCleanSheetContextFromProbability(probability));
}

function cleanSheetContextText(row) {
  const homeCode = compactTeamCode(row?.home_team_id, row?.home_team);
  const awayCode = compactTeamCode(row?.away_team_id, row?.away_team);
  return `
    <span>${homeCode} ${cleanSheetContextForSide(row, "home")}</span>
    <span>${awayCode} ${cleanSheetContextForSide(row, "away")}</span>
  `;
}

function cleanSheetProbabilityText(row) {
  const homeCode = compactTeamCode(row?.home_team_id, row?.home_team);
  const awayCode = compactTeamCode(row?.away_team_id, row?.away_team);
  return `
    <span>${homeCode} ${compactPercentText(row?.home_clean_sheet_probability)} clean sheet</span>
    <span>${awayCode} ${compactPercentText(row?.away_clean_sheet_probability)} clean sheet</span>
  `;
}

function goalRangeForRow(row) {
  const projectedXg = projectedXgForRow(row);
  const baseTotal = value(scoreContextField(row, "baseTotalGoals", "base_total_goals") ?? projectedXg.total);
  const homeBase = value(scoreContextField(row, "homeXgBase", "home_xg_base") ?? projectedXg.home);
  const awayBase = value(scoreContextField(row, "awayXgBase", "away_xg_base") ?? projectedXg.away);
  let low = value(scoreContextField(row, "lowTotalGoals", "low_total_goals"));
  let high = value(scoreContextField(row, "highTotalGoals", "high_total_goals"));

  if (!Number.isFinite(low) || !Number.isFinite(high)) {
    const fallbackSpread = matchUncertaintyLabel(row) === "High" ? 0.7 : matchUncertaintyLabel(row) === "Medium" ? 0.5 : 0.35;
    low = Math.max(0.3, baseTotal - fallbackSpread);
    high = baseTotal + fallbackSpread;
  }

  return { low, baseTotal, high, homeBase, awayBase };
}

function topScorelineText(row) {
  const topScoreline = Array.isArray(row?.top_scorelines) ? row.top_scorelines[0] : null;
  if (topScoreline?.scoreline) {
    return `${topScoreline.scoreline} (${compactPercentText(topScoreline.probability)})`;
  }

  if (row?.top_scoreline) {
    return `${row.top_scoreline} (${compactPercentText(row.top_scoreline_probability)})`;
  }

  return "needs check";
}

function validLocalFixtureKey(value) {
  const key = String(value || "").trim();
  return /^fwc2026-m\d{3}$/i.test(key) ? key.toLowerCase() : "";
}

function liveFixtureLookupKey(fixture) {
  return validLocalFixtureKey(
    fixture?.resolved_local_fixture_key ||
    fixture?.local_fixture_id ||
    fixture?.match_id ||
    localFixtureIdFromMatchNumber(fixture?.match_number)
  );
}

function scorePredictionFixtureKey(row) {
  return validLocalFixtureKey(
    row?.fixture_id ||
    row?.match_id ||
    localFixtureIdFromMatchNumber(row?.match_number)
  );
}

function buildLiveFixtureLookup(fixtures) {
  return fixtures.reduce((lookup, fixture) => {
    const key = liveFixtureLookupKey(fixture);
    if (key && !lookup.has(key)) {
      lookup.set(key, fixture);
    }
    return lookup;
  }, new Map());
}

function liveFixtureForScorePrediction(row) {
  if (!row || !liveFixtureLookup.size) {
    return null;
  }

  const key = scorePredictionFixtureKey(row);
  const liveFixture = key ? liveFixtureLookup.get(key) : null;
  if (liveFixtureMatchesScorePrediction(liveFixture, row)) {
    return liveFixture;
  }

  return null;
}

function localFixtureIdFromMatchNumber(matchNumber) {
  const number = Number(matchNumber);
  return Number.isFinite(number) && number > 0 ? `fwc2026-m${String(number).padStart(3, "0")}` : "";
}

function isSafeMappedFinalFixture(fixture) {
  if (!fixture) {
    return false;
  }

  const mappingStatus = String(fixture.mapping_status || "").toLowerCase();
  const fixtureStatus = String(fixture.fixture_status || "").toLowerCase();

  return ["matched", "matched_reversed"].includes(mappingStatus) &&
    fixture.safe_to_display_score === true &&
    ["complete", "completed", "played"].includes(fixtureStatus) &&
    Boolean(fixture.local_fixture_id || fixture.match_id || fixture.match_number);
}

function liveFixtureMatchesScorePrediction(fixture, row) {
  if (!isSafeMappedFinalFixture(fixture) || !row) {
    return false;
  }

  const liveLocalId = liveFixtureLookupKey(fixture);
  const rowLocalId = scorePredictionFixtureKey(row);

  if (!liveLocalId || !rowLocalId || liveLocalId !== rowLocalId) {
    return false;
  }

  const liveHome = normalizeText(fixture.local_home_team || fixture.home_team || "");
  const liveAway = normalizeText(fixture.local_away_team || fixture.away_team || "");
  const rowHome = normalizeText(row.home_team || "");
  const rowAway = normalizeText(row.away_team || "");

  return Boolean(liveHome && liveAway && rowHome && rowAway && liveHome === rowHome && liveAway === rowAway);
}

function liveFixtureStatusLabel(fixture) {
  const status = String(fixture?.fixture_status || "").toLowerCase();
  const period = String(fixture?.period || "").toLowerCase();
  const minute = Number(fixture?.minutes);
  const extraMinute = Number(fixture?.extra_minutes);

  if (["complete", "completed", "played"].includes(status)) {
    return "Full time";
  }

  if (status === "playing") {
    const clock = Number.isFinite(minute) && minute > 0
      ? `${displayNumber(minute)}${Number.isFinite(extraMinute) && extraMinute > 0 ? `+${displayNumber(extraMinute)}` : ""}'`
      : "";
    return [period ? titleFromSnake(period) : "Live", clock].filter(Boolean).join(" ");
  }

  if (status === "scheduled") {
    return "Scheduled";
  }

  return status ? titleFromSnake(status) : "Status pending";
}

function liveFixtureScoreText(fixture) {
  if (!isSafeMappedFinalFixture(fixture)) {
    return "";
  }

  if (fixture?.home_score === null || fixture?.home_score === undefined || fixture?.away_score === null || fixture?.away_score === undefined) {
    return "";
  }

  const homeCode = compactTeamCode(fixture.home_squad_id, fixture.home_abbr || fixture.home_team);
  const awayCode = compactTeamCode(fixture.away_squad_id, fixture.away_abbr || fixture.away_team);
  return `${homeCode} ${displayNumber(fixture.home_score)} - ${displayNumber(fixture.away_score)} ${awayCode}`;
}

function liveFixtureContextHtml(fixture) {
  if (!isSafeMappedFinalFixture(fixture)) {
    return "";
  }

  const status = liveFixtureStatusLabel(fixture);
  const score = liveFixtureScoreText(fixture);
  const label = ["complete", "completed", "played"].includes(String(fixture.fixture_status || "").toLowerCase())
    ? "Actual"
    : String(fixture.fixture_status || "").toLowerCase() === "playing"
      ? "Live"
      : "Fixture";
  const detail = [score, status].filter(Boolean).join(" · ");

  if (!detail || !score) {
    return "";
  }

  return `<span>${escapeHtml(label)}</span> ${escapeHtml(detail)}`;
}

function liveRoundIdFromMatchdayId(matchdayId) {
  const normalizedMatchdayId = String(matchdayId || "").toLowerCase();
  if (normalizedMatchdayId === "r16") return "5";
  if (normalizedMatchdayId === "r32") return "4";
  const match = normalizedMatchdayId.match(/md(\d+)/i);
  return match ? match[1] : null;
}

function liveFixturesForMatchdayId(matchdayId) {
  const roundId = liveRoundIdFromMatchdayId(matchdayId);
  return roundId ? liveFixtureRows.filter((fixture) => String(fixture.round_id || "") === roundId) : [];
}

function livePlayerForPlayer(player) {
  const ids = [
    player?.official_fantasy_player_id,
    player?.officialFantasyPlayerId,
    player?.preview_player_key,
    player?.preview_candidate?.official_fantasy_player_id,
    player?.source_player_id,
    player?.internal_player_id
  ]
    .filter((valueToCheck) => valueToCheck !== null && valueToCheck !== undefined && String(valueToCheck).trim())
    .map((valueToCheck) => String(valueToCheck).trim());

  for (const id of ids) {
    const livePlayer = livePlayerByOfficialId.get(id);
    if (livePlayer) {
      return livePlayer;
    }
  }

  return null;
}

function liveMatchStatusLabel(status) {
  const normalizedStatus = String(status || "").toLowerCase();
  if (normalizedStatus === "start") return "Started";
  if (normalizedStatus === "sub") return "Sub";
  if (normalizedStatus === "not_in_squad") return "Not in squad";
  return "";
}

function livePlayerSummaryForMatchday(player, matchdayId) {
  const livePlayer = livePlayerForPlayer(player);
  const roundId = liveRoundIdFromMatchdayId(matchdayId);
  const roundPoints = livePlayer?.stats?.roundPoints || {};
  const hasRoundPoints = Boolean(roundId && Object.prototype.hasOwnProperty.call(roundPoints, roundId));
  const points = hasRoundPoints ? Number(roundPoints[roundId]) : null;
  const matchStatus = liveMatchStatusLabel(livePlayer?.matchStatus);
  const hasUsefulData = Boolean(livePlayer && (hasRoundPoints || matchStatus));

  return {
    livePlayer,
    hasRoundPoints,
    points: Number.isFinite(points) ? points : null,
    matchStatus,
    hasUsefulData,
    valueText: hasRoundPoints && Number.isFinite(points) ? `${displayNumber(points)} pts` : matchStatus || "No live row",
    detailText: [matchStatus, hasRoundPoints ? "official points" : ""].filter(Boolean).join(" · ")
  };
}

function mostLikelyScoreText(row) {
  const homeCode = compactTeamCode(row?.home_team_id, row?.home_team);
  const awayCode = compactTeamCode(row?.away_team_id, row?.away_team);
  const topScoreline = Array.isArray(row?.top_scorelines) ? row.top_scorelines[0] : null;

  if (topScoreline?.scoreline) {
    return `${homeCode} ${topScoreline.scoreline} ${awayCode} (${compactPercentText(topScoreline.probability)})`;
  }

  if (row?.top_scoreline) {
    return `${homeCode} ${row.top_scoreline} ${awayCode} (${compactPercentText(row.top_scoreline_probability)})`;
  }

  return "Needs check";
}

function projectionSideKey(projection, row) {
  const side = String(projection?.side || projection?.fixture_context?.side || "").toLowerCase();
  if (side.includes("home")) {
    return "home";
  }
  if (side.includes("away")) {
    return "away";
  }

  const teamKeys = [
    projection?.team_id,
    projection?.country,
    projection?.team,
    projection?.team_name
  ].map((text) => normalizeText(String(text || ""))).filter(Boolean);
  const homeKeys = [row?.home_team_id, row?.home_team]
    .map((text) => normalizeText(String(text || "")))
    .filter(Boolean);
  const awayKeys = [row?.away_team_id, row?.away_team]
    .map((text) => normalizeText(String(text || "")))
    .filter(Boolean);

  if (teamKeys.some((key) => homeKeys.includes(key))) {
    return "home";
  }

  if (teamKeys.some((key) => awayKeys.includes(key))) {
    return "away";
  }

  return null;
}

function projectionSidePrediction(projection, row) {
  const sideKey = projectionSideKey(projection, row);

  if (sideKey === "home") {
    return row?.home_team_prediction || null;
  }

  if (sideKey === "away") {
    return row?.away_team_prediction || null;
  }

  return null;
}

function publicContextLevelScore(label, type = "cleanSheet") {
  const normalizedLabel = String(label || "").toLowerCase();
  const cleanSheetScores = {
    strong: 1,
    good: 0.74,
    neutral: 0.42,
    difficult: 0.12,
    weak: 0.12
  };
  const uncertaintyScores = {
    low: 0.2,
    medium: 0.56,
    high: 0.9
  };
  const scoreMap = type === "uncertainty" ? uncertaintyScores : cleanSheetScores;

  return scoreMap[normalizedLabel] ?? 0.42;
}

function projectedSideXg(row, sideKey) {
  const projectedXg = projectedXgForRow(row);

  if (sideKey === "home") {
    return {
      team: projectedXg.home,
      opponent: projectedXg.away
    };
  }

  if (sideKey === "away") {
    return {
      team: projectedXg.away,
      opponent: projectedXg.home
    };
  }

  return {
    team: null,
    opponent: null
  };
}

function projectionMatchContext(projection) {
  const row = scorePredictionForProjection(projection);
  const sideKey = projectionSideKey(projection, row);
  const sidePrediction = projectionSidePrediction(projection, row);
  const sideXg = row ? projectedSideXg(row, sideKey) : { team: null, opponent: null };
  const teamProjectedXg = firstFiniteNumberOrNull(
    fieldNumber(projection, "team_expected_goals"),
    sidePrediction?.expected_goals,
    sideXg.team
  );
  const opponentProjectedXg = firstFiniteNumberOrNull(
    fieldNumber(projection, "team_expected_goals_against"),
    sidePrediction?.expected_goals_against,
    sideXg.opponent
  );
  const winProbability = firstFiniteNumberOrNull(
    fieldNumber(projection, "team_win_probability"),
    sidePrediction?.win_probability,
    sideKey === "home" ? row?.home_win_probability : sideKey === "away" ? row?.away_win_probability : null
  );
  const cleanSheetProbability = firstFiniteNumberOrNull(
    fieldNumber(projection, "team_clean_sheet_probability"),
    sidePrediction?.clean_sheet_probability,
    sideKey === "home" ? row?.home_clean_sheet_probability : sideKey === "away" ? row?.away_clean_sheet_probability : null
  );
  const cleanSheetContext = sidePrediction
    ? scoreContextLabel(sidePrediction, "cleanSheetContext", "clean_sheet_context", publicCleanSheetContextFromProbability(cleanSheetProbability))
    : cleanSheetProbability === null
      ? "Neutral"
      : publicCleanSheetContextFromProbability(cleanSheetProbability);
  const matchUncertainty = row
    ? matchUncertaintyLabel(row)
    : scoreContextLabel(sidePrediction, "matchUncertainty", "match_uncertainty", "Medium");
  const fixtureShape = row ? matchShapePhrase(row) : "";
  const totalProjectedXg = row
    ? projectedXgForRow(row).total
    : teamProjectedXg !== null && opponentProjectedXg !== null
      ? teamProjectedXg + opponentProjectedXg
      : null;

  return {
    row,
    sideKey,
    sidePrediction,
    teamProjectedXg,
    opponentProjectedXg,
    winProbability,
    cleanSheetProbability,
    cleanSheetContext,
    cleanSheetContextScore: publicContextLevelScore(cleanSheetContext, "cleanSheet"),
    matchUncertainty,
    matchUncertaintyScore: publicContextLevelScore(matchUncertainty, "uncertainty"),
    totalProjectedXg,
    fixtureShape,
    winDrawWin: row ? winDrawWinText(row) : "Needs check",
    mostLikelyScore: row ? mostLikelyScoreText(row) : "Needs check",
    isCloseMatch: /close|tight/i.test(fixtureShape),
    isLowerScoring: Number.isFinite(totalProjectedXg) && totalProjectedXg <= 2.15,
    attackingEnvironmentScore: firstFiniteNumberOrNull(
      fieldNumber(projection, "team_attacking_environment_score"),
      sidePrediction?.attacking_environment_score
    ),
    fixtureDifficulty: fieldNumber(projection, "fixture_difficulty_score")
  };
}

function projectionMatchContextSummary(player, projection, options = {}) {
  if (!projectionIsAvailable(projection)) {
    return "";
  }

  const context = projectionMatchContext(projection);
  const isAttacker = ["Forward", "Midfielder"].includes(player?.position);
  const isDefenderOrKeeper = ["Goalkeeper", "Defender"].includes(player?.position);
  const measureKey = String(options.measureKey || options.modelKey || player?.preview_candidate?.mode || "").toLowerCase();
  const isCard = options.surface === "card";
  const isProfile = options.surface === "profile";
  const isUpsideLean = ["upside", "differential"].includes(measureKey);
  const isSafetyLean = ["safe", "highfloor", "high_floor", "bestvalue", "cheapenabler"].includes(measureKey);
  const fragments = [];
  const addFragment = (fragment) => {
    if (fragment && !fragments.includes(fragment)) {
      fragments.push(fragment);
    }
  };

  if (isCard && ["balanced", "core"].includes(measureKey)) {
    return "";
  }

  if (isAttacker && Number.isFinite(context.teamProjectedXg)) {
    if (context.teamProjectedXg >= (isCard && !isUpsideLean ? 2.1 : 1.9)) {
      addFragment(`Strong team projected xG (${displayMatchNumber(context.teamProjectedXg)}).`);
    } else if (!isCard && context.teamProjectedXg <= 0.85) {
      addFragment("Lower team projected xG in this matchup.");
    }
  }

  if (isDefenderOrKeeper && ["Strong", "Good"].includes(context.cleanSheetContext)) {
    if (context.cleanSheetContext === "Strong" || isSafetyLean || isProfile) {
      addFragment(`${context.cleanSheetContext} clean-sheet outlook.`);
    }
  } else if (!isCard && isDefenderOrKeeper && context.cleanSheetContext === "Difficult") {
    addFragment("Tougher clean-sheet outlook.");
  }

  if (!fragments.length && context.matchUncertainty === "High" && (isUpsideLean || !isCard)) {
    addFragment("High-variance match setup.");
  }

  if (!fragments.length && context.isCloseMatch && (isDefenderOrKeeper || !isCard)) {
    addFragment(context.isLowerScoring ? "Tight, lower-scoring setup." : "Tight matchup.");
  }

  if (!isCard && fragments.length < 2 && context.isLowerScoring && !fragments.some((fragment) => /lower-scoring/i.test(fragment))) {
    addFragment("Lower-scoring setup.");
  }

  return fragments.slice(0, isCard ? 1 : 2).join(" ");
}

function activeEnvironmentMatchdayIds(matchdayId = activeMatchdayId) {
  return matchdayId === "group_stage_full"
    ? ["md1", "md2", "md3"]
    : [matchdayId];
}

function averageFiniteValues(values) {
  const finiteValues = values.filter((number) => Number.isFinite(number));

  return finiteValues.length
    ? finiteValues.reduce((sum, number) => sum + number, 0) / finiteValues.length
    : null;
}

function playerMatchEnvironmentSummary(player, matchdayIds = activeEnvironmentMatchdayIds()) {
  const projections = matchdayIds
    .map((matchdayId) => projectionForPlayerMatchday(player, matchdayId))
    .filter(projectionIsAvailable);
  const contexts = projections.map(projectionMatchContext);

  if (!contexts.length) {
    return {
      projections,
      contexts,
      averageTeamXg: null,
      averageOpponentXg: null,
      averageCleanSheetProbability: null,
      averageCleanSheetContextScore: 0.42,
      averageMatchUncertaintyScore: 0,
      highUncertaintyCount: 0,
      uncertainCount: 0,
      strongProjectedXgCount: 0,
      lowProjectedXgCount: 0,
      goodCleanSheetContextCount: 0,
      difficultCleanSheetContextCount: 0
    };
  }

  return {
    projections,
    contexts,
    averageTeamXg: averageFiniteValues(contexts.map((context) => context.teamProjectedXg)),
    averageOpponentXg: averageFiniteValues(contexts.map((context) => context.opponentProjectedXg)),
    averageCleanSheetProbability: averageFiniteValues(contexts.map((context) => context.cleanSheetProbability)),
    averageCleanSheetContextScore: averageFiniteValues(contexts.map((context) => context.cleanSheetContextScore)) ?? 0.42,
    averageMatchUncertaintyScore: averageFiniteValues(contexts.map((context) => context.matchUncertaintyScore)) ?? 0,
    highUncertaintyCount: contexts.filter((context) => context.matchUncertainty === "High").length,
    uncertainCount: contexts.filter((context) => ["High", "Medium"].includes(context.matchUncertainty)).length,
    strongProjectedXgCount: contexts.filter((context) => Number.isFinite(context.teamProjectedXg) && context.teamProjectedXg >= 1.85).length,
    lowProjectedXgCount: contexts.filter((context) => Number.isFinite(context.teamProjectedXg) && context.teamProjectedXg <= 0.9).length,
    goodCleanSheetContextCount: contexts.filter((context) => ["Strong", "Good"].includes(context.cleanSheetContext)).length,
    difficultCleanSheetContextCount: contexts.filter((context) => context.cleanSheetContext === "Difficult").length
  };
}

function scorePredictionQualityLabel() {
  const quality = scorePredictionSummary?.quality_checks;

  if (!quality?.status) {
    return "";
  }

  if (quality.status === "pass") {
    return "Data check clear";
  }

  if (quality.status === "pass_with_prototype_caveats") {
    return "Model caveats";
  }

  if (quality.status === "fail") {
    return "Data check review";
  }

  return titleFromSnake(quality.status);
}

function scorePredictionQualityDetail() {
  const quality = scorePredictionSummary?.quality_checks;

  if (!quality) {
    return "";
  }

  return `${quality.checks_passed}/${quality.checks_total} checks passed · ${quality.checks_failed} failed · ${quality.caveats} caveat`;
}

function fixtureDifficultyLabel(band) {
  const labels = {
    very_easy: "very favorable",
    very_favorable: "very favorable",
    easy: "favorable",
    favorable: "favorable",
    neutral: "neutral",
    difficult: "difficult",
    very_difficult: "very difficult"
  };

  return labels[band] || titleFromSnake(band).toLowerCase();
}

function fieldNumber(record, fieldName) {
  if (!record || !hasScoreValue(record, fieldName)) {
    return null;
  }

  return Number(record[fieldName]);
}

function fieldDisplay(record, fieldName) {
  const number = fieldNumber(record, fieldName);
  return number === null ? null : displayNumber(number);
}

function fieldPercent(record, fieldName) {
  const number = fieldNumber(record, fieldName);
  return number === null ? null : percentText(number);
}

function playerMatchdayProjections(player) {
  const key = fantasyPoolPlayerKey(player);
  const projectionMap = player?.preview_matchday_projections_by_matchday ||
    (key ? fantasyPoolPreviewProjectionLookup.get(key) : null) ||
    {};

  return Array.from(new Set([defaultPublicMatchdayId, "r16", "r32", "md1", "md2", "md3"]))
    .map((matchdayId) => projectionMap[matchdayId])
    .filter(projectionIsAvailable);
}

function averageProjectionField(projections, fieldName) {
  const values = projections
    .map((projection) => fieldNumber(projection, fieldName))
    .filter((number) => number !== null);

  if (!values.length) {
    return null;
  }

  return values.reduce((sum, number) => sum + number, 0) / values.length;
}

function bestProjectionByField(projections, fieldName) {
  return projections
    .filter((projection) => hasScoreValue(projection, fieldName))
    .sort((a, b) => Number(b[fieldName]) - Number(a[fieldName]))[0] || null;
}

function scorePredictionForProjection(projection) {
  return projectionIsAvailable(projection) && projection.fixture_id
    ? scorePredictionLookup.get(projection.fixture_id) || null
    : null;
}

function singleFixtureModelReason(projection, focus = "overall") {
  if (!projectionIsAvailable(projection)) {
    return "";
  }

  const context = projectionMatchContext(projection);
  const teamXg = profileScore(context.teamProjectedXg);
  const opponentXg = profileScore(context.opponentProjectedXg);
  const cleanSheet = profilePercent(context.cleanSheetProbability);
  const winChance = profilePercent(context.winProbability);
  const goalEnvironment = goalEnvironmentLabel(projection.match_goal_environment || context.row?.goal_environment);
  const matchUncertainty = context.matchUncertainty.toLowerCase();
  const difficulty = fixtureDifficultyLabel(projection.fixture_difficulty_band);
  const fixturePrefix = `Fixture model vs ${projection.opponent}:`;
  const compactDifficulty = difficulty ? `${difficulty} fixture` : null;

  if (focus === "attack") {
    return ` ${fixturePrefix} Team projected xG ${teamXg}; ${context.mostLikelyScore}; ${compactDifficulty || `${goalEnvironment} goal environment`}.`;
  }

  if (focus === "defense") {
    return ` ${fixturePrefix} Clean-sheet context ${context.cleanSheetContext}; clean-sheet model ${cleanSheet}; opponent xG ${opponentXg}.`;
  }

  if (focus === "risk") {
    return ` ${fixturePrefix} Match uncertainty ${matchUncertainty}; ${context.fixtureShape || "match shape needs check"}; win chance ${winChance}.`;
  }

  return ` ${fixturePrefix} Team projected xG ${teamXg}; opponent xG ${opponentXg}; clean-sheet context ${context.cleanSheetContext}; match uncertainty ${matchUncertainty}.`;
}

function groupFixtureModelReason(player, focus = "overall") {
  const projections = playerMatchdayProjections(player);
  const environment = playerMatchEnvironmentSummary(player, ["md1", "md2", "md3"]);

  if (!projections.length) {
    return "";
  }

  const avgXg = averageProjectionField(projections, "team_expected_goals");
  const avgCleanSheet = averageProjectionField(projections, "team_clean_sheet_probability");
  const bestAttack = bestProjectionByField(projections, "team_expected_goals");
  const bestDefense = bestProjectionByField(projections, "team_clean_sheet_probability");
  const highestUncertainty = environment.contexts
    .map((context, index) => ({ context, projection: projections[index] }))
    .sort((a, b) => b.context.matchUncertaintyScore - a.context.matchUncertaintyScore)[0] || null;

  if (focus === "attack") {
    const bestAttackText = bestAttack
      ? ` best attacking fixture vs ${bestAttack.opponent} (${displayNumber(bestAttack.team_expected_goals)} xG)`
      : "";
    return ` Group model: avg Team xG: ${avgXg === null ? "needs check" : displayNumber(avgXg)};${bestAttackText || " best attacking fixture needs check"}.`;
  }

  if (focus === "defense") {
    const bestDefenseText = bestDefense
      ? ` best clean-sheet fixture vs ${bestDefense.opponent} (${percentText(bestDefense.team_clean_sheet_probability)})`
      : "";
    return ` Group model: avg Clean-sheet model: ${avgCleanSheet === null ? "needs check" : percentText(avgCleanSheet)};${bestDefenseText || " best clean-sheet fixture needs check"}.`;
  }

  if (focus === "risk") {
    const highestUncertaintyText = highestUncertainty
      ? ` highest match uncertainty vs ${highestUncertainty.projection.opponent} (${highestUncertainty.context.matchUncertainty})`
      : "";
    return ` Group model:${highestUncertaintyText || " match uncertainty needs check"}.`;
  }

  return ` Group model: avg Team projected xG ${avgXg === null ? "needs check" : displayNumber(avgXg)}; avg clean sheet ${avgCleanSheet === null ? "needs check" : percentText(avgCleanSheet)}; match uncertainty ${displayNumber(environment.averageMatchUncertaintyScore * 100)} index.`;
}

function fixtureModelReason(player, focus = "overall") {
  const projection = activeProjection(player);

  if (projectionIsAvailable(projection)) {
    return singleFixtureModelReason(projection, focus);
  }

  if (activeMatchdayId === "group_stage_full") {
    return groupFixtureModelReason(player, focus);
  }

  return "";
}

function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function displayDetailValue(valueToDisplay, fallback = "Needs check") {
  if (valueToDisplay === null || valueToDisplay === undefined || valueToDisplay === "") {
    return fallback;
  }

  if (Array.isArray(valueToDisplay)) {
    return valueToDisplay.length ? valueToDisplay.join(", ") : fallback;
  }

  return String(valueToDisplay);
}

function profilePercent(valueToDisplay) {
  return valueToDisplay === null || valueToDisplay === undefined || valueToDisplay === ""
    ? "Needs check"
    : percentText(Number(valueToDisplay));
}

function profileScore(valueToDisplay, suffix = "") {
  return valueToDisplay === null || valueToDisplay === undefined || valueToDisplay === ""
    ? "Needs check"
    : `${displayNumber(valueToDisplay)}${suffix}`;
}

function playerDetailButton(player, extraClass = "", measureKey = measureKeyForTrust(activeMeasure())) {

  return `
    <button class="player-name-button ${extraClass}" type="button" data-player-detail-id="${escapeHtml(player.id)}" data-player-detail-measure-key="${escapeHtml(measureKey)}">
      ${escapeHtml(player.name)}
    </button>
  `;
}

function profileTag(text, kind = "neutral") {
  if (!text) {
    return "";
  }

  return `<span class="profile-tag profile-tag--${kind}">${escapeHtml(text)}</span>`;
}

const publicProfileTagDefinitions = [
  {
    label: "Projected Points",
    kind: "neutral",
    explanation: "A pick with one of the strongest expected fantasy returns."
  },
  {
    label: "High-Floor Picks",
    kind: "safe",
    explanation: "A steadier pick with stronger role or minutes profile."
  },
  {
    label: "Core Picks",
    kind: "neutral",
    explanation: "A general pick with a mix of points, role, fixture, and risk."
  },
  {
    label: "Upside Picks",
    kind: "upside",
    explanation: "A pick with higher ceiling, but also more uncertainty."
  },
  {
    label: "Differential Picks",
    kind: "differential",
    explanation: "A less obvious pick that may help separate a squad."
  },
  {
    label: "Captain Option",
    kind: "captain",
    explanation: "A player who may be useful for captain planning."
  },
  {
    label: "Fixture Boost",
    kind: "fixture",
    explanation: "A player helped by the match environment."
  },
  {
    label: "Early game option",
    kind: "fixture",
    explanation: "A player in the earlier Final Round fixture who may offer manual-substitution flexibility if FIFA rules and locks allow it."
  },
  {
    label: "Replacement flexibility",
    kind: "fixture",
    explanation: "A player whose earlier kickoff can create a replace-or-hold decision point; verify live lock rules before acting."
  },
  {
    label: "Third Place risk",
    kind: "risk",
    explanation: "A Third Place player with useful upside but higher rotation or role volatility."
  },
  {
    label: "Role caution",
    kind: "risk",
    explanation: "A player with a specific role or lineup caution in the current model."
  },
  {
    label: "Minutes Risk",
    kind: "risk",
    explanation: "A player whose playing time may be less secure."
  },
  {
    label: "Rotation Risk",
    kind: "risk",
    explanation: "A player who may be more likely to be rested or rotated."
  },
  {
    label: "Boom-or-Bust",
    kind: "upside",
    explanation: "A player with useful upside, but a wider range of outcomes."
  },
  {
    label: "Value Picks",
    kind: "value",
    explanation: "A player who looks useful relative to price."
  }
];

const publicProfileTagByLabel = new Map(publicProfileTagDefinitions.map((definition) => [definition.label, definition]));

function publicProfileTagHelpHtml() {
  return `
    <div class="profile-tag-help hidden" id="profile-tag-help">
      <ul>
        ${publicProfileTagDefinitions.map((definition) => `
          <li>
            <strong>${escapeHtml(definition.label)}:</strong>
            <span>${escapeHtml(definition.explanation)}</span>
          </li>
        `).join("")}
      </ul>
      <p>For more detail, see the stats explanations in <a href="#stats-notes" data-profile-model-notes-link>Stats Notes</a>.</p>
    </div>
  `;
}

const qaFlagDefinitions = {
  not_safe_to_rank: {
    label: "Rank review",
    kind: "review",
    detail: "This player needs an extra source check before ranking confidently."
  },
  rank_caveat: {
    label: "Caveat",
    kind: "watch",
    detail: "This player can be ranked, but the available context still needs caution."
  },
  watchlist_only: {
    label: "Watchlist",
    kind: "review",
    detail: "This player is marked as a filler or watchlist option, not a default recommendation."
  },
  manual_rank_review: {
    label: "Manual review",
    kind: "review",
    detail: "This player needs manual review before ranking."
  },
  do_not_rank_yet: {
    label: "Do not rank",
    kind: "review",
    detail: "This player is held out of confident rankings for now."
  },
  low_data_confidence: {
    label: "Data",
    kind: "review",
    detail: "Data confidence is below 50 out of 100."
  },
  roster_not_confirmed: {
    label: "Roster",
    kind: "watch",
    detail: "Roster status is not confirmed."
  },
  low_start_probability: {
    label: "Start",
    kind: "review",
    detail: "Start probability is below 40%."
  },
  low_expected_minutes: {
    label: "Minutes",
    kind: "review",
    detail: "Expected minutes are below 35."
  },
  high_substitution_risk: {
    label: "Sub risk",
    kind: "watch",
    detail: "Substitution or minutes volatility risk is high."
  },
  high_composite_risk: {
    label: "Risk",
    kind: "watch",
    detail: "Composite fantasy risk is 70 or higher."
  },
  high_tail_risk: {
    label: "Tail",
    kind: "watch",
    detail: "Tail-risk score is 70 or higher."
  },
  negative_var10_floor: {
    label: "Floor",
    kind: "watch",
    detail: "The modeled 10th percentile point floor is negative."
  },
  multiple_source_review_flags: {
    label: "Sources",
    kind: "watch",
    detail: "Multiple source-review flags are attached to this player."
  },
  missing_league: {
    label: "League",
    kind: "watch",
    detail: "League data is missing or still needs checking."
  },
  missing_fixture_context: {
    label: "Fixture",
    kind: "watch",
    detail: "No matchday fixture projection is available for this player."
  },
  hard_fixture: {
    label: "Hard fixture",
    kind: "watch",
    detail: "Fixture difficulty is 70 or higher for the selected matchday."
  },
  favorable_fixture: {
    label: "Good fixture",
    kind: "info",
    detail: "Fixture difficulty is 35 or lower for the selected matchday."
  },
  missing_fixture_xg: {
    label: "xG missing",
    kind: "watch",
    detail: "The selected fixture is missing team expected-goals context."
  },
  attack_pick_low_team_xg: {
    label: "Low xG",
    kind: "review",
    detail: "Attack-heavy pick, but team expected goals are below 1.1."
  },
  defensive_pick_low_clean_sheet: {
    label: "Low CS",
    kind: "review",
    detail: "Defensive-heavy pick, but clean-sheet probability is below 25%."
  },
  very_risky_low_upset_context: {
    label: "Low upset",
    kind: "watch",
    detail: "Very-risky pick without much upset or chaos signal in this fixture."
  }
};

const qaReviewFlags = new Set([
  "not_safe_to_rank",
  "watchlist_only",
  "manual_rank_review",
  "do_not_rank_yet",
  "low_data_confidence",
  "low_start_probability",
  "low_expected_minutes",
  "attack_pick_low_team_xg",
  "defensive_pick_low_clean_sheet"
]);

function addQaFlag(flags, flagName) {
  if (qaFlagDefinitions[flagName] && !flags.includes(flagName)) {
    flags.push(flagName);
  }
}

function qaFixtureContext(player) {
  const projection = activeProjection(player);

  if (projectionIsAvailable(projection)) {
    return {
      label: projection.matchday_label || activeMatchdayLabel(),
      opponent: projection.opponent,
      difficulty: fieldNumber(projection, "fixture_difficulty_score"),
      teamXg: fieldNumber(projection, "team_expected_goals"),
      cleanSheet: fieldNumber(projection, "team_clean_sheet_probability"),
      upsetRisk: fieldNumber(projection, "match_upset_risk_probability"),
      fixtureUse: projection.fixture_use
    };
  }

  const projections = playerMatchdayProjections(player);

  return {
    label: activeMatchdayLabel(),
    opponent: null,
    difficulty: projections.length ? averageProjectionField(projections, "fixture_difficulty_score") : fieldNumber(player, "average_fixture_difficulty"),
    teamXg: projections.length ? averageProjectionField(projections, "team_expected_goals") : null,
    cleanSheet: projections.length ? averageProjectionField(projections, "team_clean_sheet_probability") : null,
    upsetRisk: projections.length ? averageProjectionField(projections, "match_upset_risk_probability") : null,
    fixtureUse: projections.length ? "group_stage_average" : null
  };
}

function qaFlagsForPlayer(player, measureKey = "balanced") {
  const cacheKey = `${activeMatchdayId}:${measureKey}:${player.id}`;

  if (qaFlagsCache.has(cacheKey)) {
    return [...qaFlagsCache.get(cacheKey)];
  }

  const flags = [];
  const startProbability = scoreValue(player, "start_probability_percent");
  const expectedMinutes = scoreValue(player, "expected_minutes_v0");
  const substitutionRisk = scoreValue(player, "substitution_risk");
  const compositeRisk = scoreValue(player, "finance_composite_risk_score", "risk_composite_score");
  const tailRisk = scoreValue(player, "finance_tail_risk_score", "risk_tail_score");
  const var10 = scoreValue(player, "finance_var10_points");
  const dataConfidence = value(player.data_confidence_score);
  const sourceReviewFlagCount = Array.isArray(player.source_review_flags) ? player.source_review_flags.length : 0;
  const fixtureContext = qaFixtureContext(player);
  const recommendationUse = recommendationUseForPlayer(player);
  const hasFixtureProjection = Boolean(activeProjection(player)) || playerMatchdayProjections(player).length > 0;

  if (recommendationUse === "safe_to_rank_with_caveat") {
    addQaFlag(flags, "rank_caveat");
  } else if (recommendationUse === "use_as_filler_or_watchlist") {
    addQaFlag(flags, "watchlist_only");
  } else if (recommendationUse === "manual_review_before_ranking") {
    addQaFlag(flags, "manual_rank_review");
  } else if (recommendationUse === "do_not_rank_yet") {
    addQaFlag(flags, "do_not_rank_yet");
  } else if (recommendationUse !== "safe_to_rank") {
    addQaFlag(flags, "not_safe_to_rank");
  }

  if (dataConfidence < 50) {
    addQaFlag(flags, "low_data_confidence");
  }

  if (player.roster_status && !["confirmed", "official_fantasy_pool"].includes(player.roster_status)) {
    addQaFlag(flags, "roster_not_confirmed");
  }

  if (startProbability < 40) {
    addQaFlag(flags, "low_start_probability");
  }

  if (expectedMinutes < 35) {
    addQaFlag(flags, "low_expected_minutes");
  }

  if (substitutionRisk >= 70) {
    addQaFlag(flags, "high_substitution_risk");
  }

  if (compositeRisk >= 70) {
    addQaFlag(flags, "high_composite_risk");
  }

  if (tailRisk >= 70) {
    addQaFlag(flags, "high_tail_risk");
  }

  if (var10 < 0) {
    addQaFlag(flags, "negative_var10_floor");
  }

  if (sourceReviewFlagCount >= 2) {
    addQaFlag(flags, "multiple_source_review_flags");
  }

  if (!player.league || player.league === "needs_check") {
    addQaFlag(flags, "missing_league");
  }

  if (!hasFixtureProjection) {
    addQaFlag(flags, "missing_fixture_context");
  }

  if (fixtureContext.difficulty !== null && fixtureContext.difficulty >= 70) {
    addQaFlag(flags, "hard_fixture");
  } else if (fixtureContext.difficulty !== null && fixtureContext.difficulty <= 35) {
    addQaFlag(flags, "favorable_fixture");
  }

  if (fixtureContext.teamXg === null) {
    addQaFlag(flags, "missing_fixture_xg");
  }

  if (measureKey === "attackHeavy" && fixtureContext.teamXg !== null && fixtureContext.teamXg < 1.1) {
    addQaFlag(flags, "attack_pick_low_team_xg");
  }

  if (measureKey === "defensiveHeavy" && fixtureContext.cleanSheet !== null && fixtureContext.cleanSheet < 0.25) {
    addQaFlag(flags, "defensive_pick_low_clean_sheet");
  }

  if (measureKey === "veryRisky" && fixtureContext.upsetRisk !== null && fixtureContext.upsetRisk < 0.1) {
    addQaFlag(flags, "very_risky_low_upset_context");
  }

  qaFlagsCache.set(cacheKey, flags);

  return [...flags];
}

function qaStatusFromFlags(flags) {
  if (flags.some((flag) => qaReviewFlags.has(flag))) {
    return "review";
  }

  if (flags.some((flag) => qaFlagDefinitions[flag]?.kind === "watch")) {
    return "watch";
  }

  return "pass";
}

function qaStatusLabel(status) {
  const labels = {
    review: "Data check review",
    watch: "Data check watch",
    pass: "Data check clear"
  };

  return labels[status] || "Data check watch";
}

function qaChipRow(flags, options = {}) {
  const status = qaStatusFromFlags(flags);
  const warningFlags = flags.filter((flag) => qaFlagDefinitions[flag]?.kind !== "info");
  const displayFlags = warningFlags.length ? warningFlags : flags;
  const maxVisible = options.maxVisible || 3;
  const visibleFlags = displayFlags.slice(0, maxVisible);
  const extraCount = displayFlags.length - visibleFlags.length;
  const chips = visibleFlags.length
    ? visibleFlags.map((flag) => {
      const definition = qaFlagDefinitions[flag];
      return `<span class="qa-chip qa-chip--${definition.kind}" title="${escapeHtml(definition.detail)}">${escapeHtml(definition.label)}</span>`;
    })
    : [`<span class="qa-chip qa-chip--pass">Data check clear</span>`];

  if (extraCount > 0) {
    chips.push(`<span class="qa-chip qa-chip--${status}" title="${escapeHtml(`${extraCount} more data-check flag${extraCount === 1 ? "" : "s"}.`)}">+${extraCount}</span>`);
  }

  return `<div class="qa-chip-row ${options.compact ? "qa-chip-row--compact" : ""}" aria-label="${escapeHtml(qaStatusLabel(status))}">${chips.join("")}</div>`;
}

function profileQaPanel(player, measureKey = measureKeyForTrust(activeMeasure())) {
  const flags = qaFlagsForPlayer(player, measureKey);
  const status = qaStatusFromFlags(flags);
  const fixtureContext = qaFixtureContext(player);
  const trustMode = activeTrustMode();
  const flagItems = flags.length
    ? flags.map((flag) => {
      const definition = qaFlagDefinitions[flag];
      return `
        <li>
          <strong>${escapeHtml(definition.label)}</strong>
          <span>${escapeHtml(definition.detail)}</span>
        </li>
      `;
    }).join("")
    : `
      <li>
        <strong>Data check clear</strong>
        <span>No major recommendation warnings for the selected matchday context.</span>
      </li>
    `;
  const fixtureNote = fixtureContext.opponent
    ? `${fixtureContext.label} vs ${fixtureContext.opponent}`
    : fixtureContext.label;
  const measureLabel = measureKey === "captain"
    ? "Captain Watchlist"
    : measures[measureKey]?.label || titleFromSnake(measureKey);

  return `
    <div class="qa-panel qa-panel--${status}">
      <div class="qa-panel__header">
        <div>
          <strong>${escapeHtml(qaStatusLabel(status))}</strong>
          <span>${escapeHtml(`${fixtureNote} · ${measureLabel} · ${trustMode.label} safety setting`)}</span>
        </div>
        ${qaChipRow(flags, { compact: true, maxVisible: 4 })}
      </div>
      <ul class="qa-flag-list">
        ${flagItems}
      </ul>
    </div>
  `;
}

function activeTrustMode() {
  return trustModes[activeTrustModeId] || trustModes.balanced;
}

function activeAdvicePoolMode() {
  return advicePoolModes[activeAdvicePoolModeId] || advicePoolModes.playable;
}

function trustModeLabel(mode = activeTrustMode()) {
  return `${mode.label} safety`;
}

function publicTrustModeDescription(mode = activeTrustMode()) {
  const descriptions = {
    strict: "Safe prefers steadier roles, starts, minutes, and lower downside.",
    balanced: "Balanced keeps the broad player pool and avoids leaning too hard on one signal.",
    aggressive: "Upside gives more room to ceiling and attacking opportunity.",
    chaos: "Differential gives more room to less obvious high-ceiling players."
  };

  return descriptions[mode.id] || descriptions.balanced;
}

function measureKeyForTrust(measure = activeMeasure()) {
  return measure?.key || "balanced";
}

function rawMeasureScore(player, measure = activeMeasure()) {
  const cacheKey = `${activeMatchdayId}:${measureKeyForTrust(measure)}:${player.id}`;

  if (rawMeasureScoreCache.has(cacheKey)) {
    return rawMeasureScoreCache.get(cacheKey);
  }

  const score = measure?.score ? measure.score(player) : 0;
  rawMeasureScoreCache.set(cacheKey, score);

  return score;
}

function trustModeFailures(player, measureKey = "balanced", mode = activeTrustMode()) {
  const failures = [];
  const recommendationUse = recommendationUseForPlayer(player);

  if (mode.allowedRecommendationUses && !mode.allowedRecommendationUses.includes(recommendationUse)) {
    failures.push("recommendation use needs extra review");
  }

  if (mode.requireConfirmedRoster && player.roster_status !== "confirmed") {
    failures.push("roster is not confirmed");
  }

  if (mode.minDataConfidence !== undefined && value(player.data_confidence_score) < mode.minDataConfidence) {
    failures.push(`input coverage below ${mode.minDataConfidence}`);
  }

  if (mode.minStartProbability !== undefined && scoreValue(player, "start_probability_percent") < mode.minStartProbability) {
    failures.push(`start probability below ${mode.minStartProbability}%`);
  }

  if (mode.minExpectedMinutes !== undefined && scoreValue(player, "expected_minutes_v0") < mode.minExpectedMinutes) {
    failures.push(`expected minutes below ${mode.minExpectedMinutes}`);
  }

  if (mode.maxCompositeRisk !== undefined && scoreValue(player, "finance_composite_risk_score", "risk_composite_score") >= mode.maxCompositeRisk) {
    failures.push(`composite risk at or above ${mode.maxCompositeRisk}`);
  }

  if (mode.maxTailRisk !== undefined && scoreValue(player, "finance_tail_risk_score", "risk_tail_score") >= mode.maxTailRisk) {
    failures.push(`tail risk at or above ${mode.maxTailRisk}`);
  }

  return failures;
}

function playerAllowedByTrustMode(player, measureKey = "balanced", mode = activeTrustMode()) {
  return !mode.filtersRanking || trustModeFailures(player, measureKey, mode).length === 0;
}

function playerAllowedByAdvicePool(player, measureKey = "balanced", poolMode = activeAdvicePoolMode()) {
  if (poolMode.id === "watchlist") {
    return true;
  }

  const recommendationUse = recommendationUseForPlayer(player);
  const allowedRecommendationUses = ["safe_to_rank", "safe_to_rank_with_caveat"];
  const qaStatus = qaStatusFromFlags(qaFlagsForPlayer(player, measureKey));

  return allowedRecommendationUses.includes(recommendationUse) && qaStatus !== "review";
}

function advicePoolCounts(playerList, basePool, visiblePool, measureKey, mode, poolMode) {
  const hiddenByTrust = mode.filtersRanking ? Math.max(0, playerList.length - basePool.length) : 0;
  const hiddenByPlayable = poolMode.id === "playable"
    ? Math.max(0, basePool.length - visiblePool.length)
    : 0;
  const reviewCount = visiblePool.filter((player) =>
    qaStatusFromFlags(qaFlagsForPlayer(player, measureKey)) === "review"
  ).length;
  const watchCount = visiblePool.filter((player) =>
    qaStatusFromFlags(qaFlagsForPlayer(player, measureKey)) === "watch"
  ).length;

  return {
    total: playerList.length,
    afterTrust: basePool.length,
    visible: visiblePool.length,
    hiddenByTrust,
    hiddenByPlayable,
    reviewCount,
    watchCount
  };
}

function advicePoolNote(counts, poolMode, trustFallbackUsed = false) {
  const parts = [
    `${counts.visible} ranked from ${counts.total} player${counts.total === 1 ? "" : "s"} in this position pool`
  ];

  if (counts.hiddenByTrust > 0) {
    parts.push(`${counts.hiddenByTrust} hidden by ${trustModeLabel()}`);
  }

  if (counts.hiddenByPlayable > 0) {
    parts.push(`${counts.hiddenByPlayable} hidden as watchlist or data-review`);
  }

  if (poolMode.id === "watchlist") {
    parts.push(`${counts.reviewCount} data-review and ${counts.watchCount} data-watch players included`);
  }

  if (trustFallbackUsed) {
    parts.push("safety fallback used because no high-confidence players matched the current filters");
  }

  return `${poolMode.shortLabel} pool: ${parts.join("; ")}.`;
}

function trustFilteredPlayers(playerList, measure = activeMeasure(), mode = activeTrustMode(), options = {}) {
  if (!mode.filtersRanking) {
    return [...playerList];
  }

  const measureKey = measureKeyForTrust(measure);
  const filtered = playerList.filter((player) =>
    playerAllowedByTrustMode(player, measureKey, mode) || (options.keepLocked && lockedPlayerIds.has(player.id))
  );

  if (options.allowFallback && !filtered.length) {
    return [...playerList];
  }

  return filtered;
}

function trustPenaltyForFlags(flags, mode = activeTrustMode()) {
  return flags.reduce((sum, flag) =>
    sum + (trustFlagPenalties[flag] || 0) * mode.flagPenaltyMultiplier,
  0);
}

function trustModeBoost(player, measureKey = "balanced", mode = activeTrustMode()) {
  const fixtureContext = qaFixtureContext(player);
  const upsideBoost = scoreValue(player, "finance_upside_p90_percentile") * (mode.upsideBoost || 0);
  const volatilityBoost = scoreValue(player, "finance_volatility_percentile") * (mode.volatilityBoost || 0);
  const veryRiskyBoost = scoreValue(player, "finance_strategy_very_risky") * (mode.veryRiskyBoost || 0);
  const upsetBoost = fixtureContext.upsetRisk === null ? 0 : fixtureContext.upsetRisk * (mode.upsetBoost || 0);
  const styleBoost = (
    measureKey === "attackHeavy" ||
    measureKey === "upside" ||
    measureKey === "veryRisky"
  ) ? upsideBoost : upsideBoost * 0.4;

  return styleBoost + volatilityBoost + veryRiskyBoost + upsetBoost;
}

function trustAdjustedScore(player, measure = activeMeasure(), mode = activeTrustMode()) {
  const cacheKey = `${activeMatchdayId}:${mode.id}:${measureKeyForTrust(measure)}:${player.id}`;

  if (trustAdjustedScoreCache.has(cacheKey)) {
    return trustAdjustedScoreCache.get(cacheKey);
  }

  const measureKey = measureKeyForTrust(measure);
  const rawScore = rawMeasureScore(player, measure);
  const flags = qaFlagsForPlayer(player, measureKey);
  const penalty = trustPenaltyForFlags(flags, mode);
  const failures = trustModeFailures(player, measureKey, mode);
  const failurePenalty = failures.length * (mode.failurePenalty || 0);

  const score = rawScore - penalty - failurePenalty + trustModeBoost(player, measureKey, mode);
  trustAdjustedScoreCache.set(cacheKey, score);

  return score;
}

function recommendationScoreBreakdown(player, measure = activeMeasure(), mode = activeTrustMode()) {
  const measureKey = measureKeyForTrust(measure);
  const rawScore = rawMeasureScore(player, measure);
  const flags = qaFlagsForPlayer(player, measureKey);
  const flagPenalty = trustPenaltyForFlags(flags, mode);
  const failures = trustModeFailures(player, measureKey, mode);
  const failurePenalty = failures.length * (mode.failurePenalty || 0);
  const boost = trustModeBoost(player, measureKey, mode);

  return {
    measure_key: measureKey,
    measure_label: measure?.label || titleFromSnake(measureKey),
    trust_mode: mode.id,
    raw_score: rawScore,
    adjusted_score: rawScore - flagPenalty - failurePenalty + boost,
    qa_penalty: flagPenalty,
    strict_failure_penalty: failurePenalty,
    trust_boost: boost,
    qa_status: qaStatusFromFlags(flags),
    qa_flags: flags,
    trust_failures: failures
  };
}

function scoreAdjustmentText(breakdown) {
  const parts = [`Base ${displayNumber(breakdown.raw_score)}`];

  if (Math.abs(breakdown.qa_penalty) >= 0.05) {
    const sign = breakdown.qa_penalty >= 0 ? "-" : "+";
    parts.push(`Model caution ${sign}${displayNumber(Math.abs(breakdown.qa_penalty))}`);
  }

  if (breakdown.strict_failure_penalty >= 0.05) {
    parts.push(`Safety -${displayNumber(breakdown.strict_failure_penalty)}`);
  }

  if (breakdown.trust_boost >= 0.05) {
    parts.push(`Boost +${displayNumber(breakdown.trust_boost)}`);
  }

  if (parts.length === 1) {
    parts.push("No model caution");
  }

  return parts.join(" · ");
}

function scoreBreakdownHtml(player, measure = activeMeasure(), mode = activeTrustMode()) {
  const breakdown = recommendationScoreBreakdown(player, measure, mode);
  const title = [
    `${breakdown.measure_label} after ${mode.label} safety setting`,
    scoreAdjustmentText(breakdown),
    breakdown.trust_failures.length ? `Safe-pick checks: ${breakdown.trust_failures.join(", ")}` : ""
  ].filter(Boolean).join(". ");

  return `
    <span class="score-breakdown" title="${escapeHtml(title)}">
      <strong>${displayNumber(breakdown.adjusted_score)}</strong>
      <small>${escapeHtml(scoreAdjustmentText(breakdown))}</small>
    </span>
  `;
}

function scoreSummaryText(player, measure = activeMeasure(), mode = activeTrustMode()) {
  const breakdown = recommendationScoreBreakdown(player, measure, mode);

  return `Adjusted ${displayNumber(breakdown.adjusted_score)} · ${scoreAdjustmentText(breakdown)}`;
}

function captainRecommendationScore(player, mode = activeTrustMode()) {
  return trustAdjustedScore(player, captainTrustMeasure, mode);
}

function trustModeSummaryText(mode = activeTrustMode()) {
  return `${activeQuickPickModelOption().label} model for ${activeQuickPickPositionLabel()} with ${trustModeLabel(mode)}: ${publicTrustModeDescription(mode)}`;
}

function renderTrustModeSummary() {
  if (trustModeSummary) {
    trustModeSummary.textContent = trustModeSummaryText();
  }
}

function updateQuickPickModel(nextModelKey) {
  activeQuickPickModelKey = publicPickModelOptionKeys.includes(nextModelKey) ? nextModelKey : "expected";
  if (quickPickModelSelect) {
    quickPickModelSelect.value = activeQuickPickModelKey;
  }
  renderTrustModeSummary();
  renderDashboardSections();
}

function updateQuickPickPosition(nextPosition) {
  activeQuickPickPosition = nextPosition === "All" || positionOrder.includes(nextPosition)
    ? nextPosition
    : "All";
  if (quickPositionSelect) {
    quickPositionSelect.value = activeQuickPickPosition;
  }
  renderTrustModeSummary();
  renderDashboardSections();
}

function toggleQuickModelHelp() {
  if (!quickModelHelp || !quickModelHelpButton) return;

  const isHidden = quickModelHelp.classList.toggle("hidden");
  quickModelHelpButton.setAttribute("aria-expanded", String(!isHidden));
}

function profileMetric(label, valueToDisplay, note = "") {
  return `
    <article class="profile-metric">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(displayDetailValue(valueToDisplay))}</strong>
      ${note ? `<small>${escapeHtml(note)}</small>` : ""}
    </article>
  `;
}

function metricNumber(valueToCheck) {
  const number = Number(valueToCheck);
  return Number.isFinite(number) ? number : null;
}

function metricFieldValue(record, ...fieldNames) {
  for (const fieldName of fieldNames) {
    const number = metricNumber(record?.[fieldName]);
    if (number !== null) {
      return number;
    }
  }

  return null;
}

function fantasyPoolFinanceRowForPlayer(player) {
  const key = fantasyPoolPlayerKey(player);
  return key ? fantasyPoolFinanceLookup.get(key) || null : null;
}

function publicMetricRecordForPlayer(player) {
  return fantasyPoolFinanceRowForPlayer(player);
}

function publicMetricPoolRecords() {
  const sourceRecords = fantasyPoolFinanceRows;
  const seen = new Set();

  return sourceRecords.filter((record) => {
    const key = fantasyPoolPlayerKey(record) ||
      record?.preview_player_key ||
      record?.source_player_id ||
      record?.id ||
      record?.name;

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function metricValuesForPool(metricFn) {
  return publicMetricPoolRecords()
    .map((record) => metricFn(record))
    .filter((number) => number !== null);
}

function metricIndex(valueToRank, values, options = {}) {
  const valueNumber = metricNumber(valueToRank);
  const numericValues = values.filter((number) => metricNumber(number) !== null);

  if (valueNumber === null || !numericValues.length) {
    return null;
  }

  const comparableValue = options.lowerIsBetter ? -valueNumber : valueNumber;
  const comparableValues = numericValues.map((number) => options.lowerIsBetter ? -number : number);
  const min = Math.min(...comparableValues);
  const max = Math.max(...comparableValues);

  if (min === max) {
    return 100;
  }

  return Math.max(0, Math.min(100, Math.round(((comparableValue - min) / (max - min)) * 100)));
}

function metricPercentile(valueToRank, values, options = {}) {
  const valueNumber = metricNumber(valueToRank);
  const numericValues = values.filter((number) => metricNumber(number) !== null);

  if (valueNumber === null || !numericValues.length) {
    return null;
  }

  const comparableValue = options.lowerIsBetter ? -valueNumber : valueNumber;
  const comparableValues = numericValues.map((number) => options.lowerIsBetter ? -number : number);
  const countAtOrBelow = comparableValues.filter((number) => number <= comparableValue).length;

  return Math.max(1, Math.min(100, Math.round((countAtOrBelow / comparableValues.length) * 100)));
}

function ordinalNumber(numberToFormat) {
  const number = Number(numberToFormat);

  if (!Number.isFinite(number)) {
    return "";
  }

  const rounded = Math.round(number);
  const lastTwo = rounded % 100;
  const suffix = lastTwo >= 11 && lastTwo <= 13
    ? "th"
    : rounded % 10 === 1
      ? "st"
      : rounded % 10 === 2
        ? "nd"
        : rounded % 10 === 3
          ? "rd"
          : "th";

  return `${rounded}${suffix}`;
}

function profileIndexMetric(label, valueToRank, poolValues, note = "", options = {}) {
  const index = metricIndex(valueToRank, poolValues, options);
  const percentile = metricPercentile(valueToRank, poolValues, options);

  if (index === null || percentile === null) {
    return "";
  }

  return profileMetric(label, `${index}/100 (${ordinalNumber(percentile)} percentile)`, note);
}

function profilePointMetric(label, pointValue, matchdayLabel, notePrefix) {
  const number = metricNumber(pointValue);

  if (number === null) {
    return "";
  }

  return profileMetric(label, `${displayNumber(number)} pts`, `${notePrefix} for ${matchdayLabel}.`);
}

function expectedMatchdayPointValue(player) {
  const projection = pickProjectionRow(player);

  if (projectionIsMissing(projection)) {
    return null;
  }

  if (projectionIsAvailable(projection)) {
    const projectedField = [
      "finance_expected_return_points",
      "raw_expected_points"
    ].find((fieldName) => hasScoreValue(projection, fieldName));

    if (projectedField) {
      return Number(projection[projectedField]);
    }
  }

  if (player?.preview_candidate) {
    const candidate = player.preview_candidate;
    const modeledPoints = Number(candidate.raw_expected_points);
    const fixtureCount = Number(candidate.fixture_context?.fixture_count);
    if (Number.isFinite(modeledPoints)) {
      return candidate.matchday === "group_stage_full" && Number.isFinite(fixtureCount) && fixtureCount > 0
        ? modeledPoints / fixtureCount
        : modeledPoints;
    }
  }

  const record = publicMetricRecordForPlayer(player);
  const matchdayExpected = metricFieldValue(record, "finance_expected_return_points");
  if (matchdayExpected !== null) {
    return matchdayExpected;
  }

  const groupStageExpected = metricFieldValue(record, "group_stage_expected_points");
  return groupStageExpected === null ? null : groupStageExpected / 3;
}

function riskAdjustedMatchdayPointValue(player) {
  const projected = projectedMatchdayPointValue(player);

  if (metricNumber(projected) !== null) {
    return projected;
  }

  const record = publicMetricRecordForPlayer(player);
  const groupStageProjected = metricFieldValue(record, "group_stage_risk_adjusted_points");
  return groupStageProjected === null ? null : groupStageProjected / 3;
}

function valueIndexRawMetric(record) {
  return metricFieldValue(record, "risk_adjusted_points_per_price", "value_over_replacement", "value_score_v1");
}

function squadFitIndexRawMetric(record) {
  return metricFieldValue(record, "scarcity_adjusted_value", "confidence_adjusted_value", "portfolio_fit_score");
}

function captainAlphaRawMetric(record) {
  return metricFieldValue(record, "captain_score", "finance_captain_score");
}

function badWeekFloorRawMetric(record) {
  return metricFieldValue(record, "bad_week_floor", "group_stage_floor_points", "finance_var10_points");
}

function budgetEaseRawMetric(record) {
  return metricFieldValue(record, "price_tier_opportunity_cost", "overpay_risk_v1");
}

function riskControlRawMetric(record) {
  const riskParts = [
    metricFieldValue(record, "downside_risk_proxy", "finance_composite_risk_score", "risk_composite_score"),
    metricFieldValue(record, "volatility_proxy", "finance_tail_risk_score", "risk_tail_score"),
    metricFieldValue(record, "minutes_risk"),
    metricFieldValue(record, "role_risk")
  ].filter((number) => number !== null);

  return riskParts.length
    ? riskParts.reduce((sum, number) => sum + number, 0)
    : null;
}

function playerRecommendationLabels(player, measureKey = measureKeyForTrust(activeMeasure())) {
  const labels = [];
  const startProbability = scoreValue(player, "start_probability_percent");
  const expectedMinutes = scoreValue(player, "expected_minutes_v0");
  const substitutionRisk = scoreValue(player, "substitution_risk");
  const risk = scoreValue(player, "finance_composite_risk_score", "risk_composite_score");
  const tailRisk = scoreValue(player, "finance_tail_risk_score", "risk_tail_score");
  const volatility = financeContextScore(player, "volatility_score");
  const valueScore = optionalScoreValue(player, "value_score_v1", "cheap_enabler_score_v1");
  const captainScore = scoreValue(player, "finance_captain_score");
  const fixtureContext = qaFixtureContext(player);
  const candidateMode = player.preview_candidate?.mode || player.value_role || measureKey;
  const primaryTagByMode = {
    expected: "Projected Points",
    balanced: "Core Picks",
    safe: "High-Floor Picks",
    upside: "Upside Picks",
    differential: "Differential Picks",
    bestValue: "Value Picks",
    valueQuant: "Value Picks",
    captain: "Captain Option",
    riskControl: "High-Floor Picks"
  };

  const addTag = (label) => {
    const definition = publicProfileTagByLabel.get(label);
    if (definition) {
      labels.push({ text: definition.label, kind: definition.kind });
    }
  };

  addTag(primaryTagByMode[measureKey] || primaryTagByMode[candidateMode] || "Core Picks");

  if ((candidateMode === "captain" || captainScore >= 70 || measureKey === "captain") && measureKey !== "captain") {
    addTag("Captain Option");
  }

  if (fixtureContext.difficulty !== null && fixtureContext.difficulty <= 35) {
    addTag("Fixture Boost");
  }

  const activeFinalRoundProjection = activeMatchdayId === "finalRound" ? activeProjection(player) : null;
  const strategyTags = Array.isArray(player.preview_candidate?.recommendation_tags)
    ? player.preview_candidate.recommendation_tags
    : [];

  strategyTags.forEach(addTag);

  if (activeFinalRoundProjection?.fixture_stage === "third_place") {
    addTag("Early game option");
    addTag("Replacement flexibility");
    if (activeFinalRoundProjection.third_place_rotation_risk) {
      addTag("Third Place risk");
    }
    if (activeFinalRoundProjection.roleCaution || activeFinalRoundProjection.role_caution) {
      addTag("Role caution");
    }
  }

  if (startProbability < 60 || expectedMinutes < 55) {
    addTag("Minutes Risk");
  }

  if (substitutionRisk >= 45 || ["rotation", "rotation_risk", "unclear"].includes(String(player.country_role || "").toLowerCase())) {
    addTag("Rotation Risk");
  }

  if ((scoreValue(player, "finance_strategy_upside") >= 75 || scoreValue(player, "finance_upside_p90_points") >= 8) && (tailRisk >= 60 || volatility >= 55)) {
    addTag("Boom-or-Bust");
  }

  if (Number.isFinite(valueScore) && valueScore >= 65 || ["bestValue", "valueQuant"].includes(measureKey) || candidateMode === "bestValue" || candidateMode === "valueQuant") {
    addTag("Value Picks");
  }

  if (!labels.length) {
    addTag("Core Picks");
  }

  const seen = new Set();
  return labels.filter((label) => {
    const key = `${label.kind}:${label.text}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  }).slice(0, 3);
}

function profileIdentityGrid(player) {
  return `
    <div class="profile-grid">
      ${profileMetric("Country", playerCountryText(player), `Group ${displayDetailValue(player.group, "?")}`)}
      ${profileMetric("Official Fantasy Position", player.position, player.position_code || "")}
      ${profileMetric("Club", player.club, player.league || "")}
      ${profileMetric("Roster", titleFromSnake(player.roster_status), recommendationUseForPlayer(player))}
      ${profileMetric("Budget Price", playerPriceDetailText(player), player.price_note || "Official fantasy price")}
      ${profileMetric("Data Confidence", `${displayNumber(player.data_confidence_score)} / 100`, titleFromSnake(player.data_confidence_band))}
    </div>
  `;
}

function profileRoleGrid(player) {
  return `
    <div class="profile-grid profile-grid--compact">
      ${profileMetric("Start Probability", profileScore(player.start_probability_percent, "%"), titleFromSnake(player.country_role))}
      ${profileMetric("Expected Minutes", profileScore(player.expected_minutes_v0), `Floor ${profileScore(player.minutes_floor)}`)}
      ${profileMetric("Substitution Risk", profileScore(player.substitution_risk, "%"), titleFromSnake(player.role_confidence))}
      ${profileMetric("Position Depth", `${displayDetailValue(player.position_depth_rank)}/${displayDetailValue(player.position_depth_count)}`, "country pool")}
    </div>
  `;
}

function profileFinanceGrid(player) {
  if (!fantasyPoolFinanceRows.length) {
    return `
      ${modelDataWarningHtml(activeDataWarningsForSection("fantasy_finance"), { title: "Fantasy Finance" })}
      <p class="profile-metric-explainer">Active fantasyPool finance metrics are unavailable.</p>
      <div class="profile-grid profile-grid--finance">
        ${profileMetric("Value Metrics", "Unavailable", "Active finance data unavailable.")}
      </div>
    `;
  }

  const record = publicMetricRecordForPlayer(player);
  const matchdayLabel = pickCardMatchdayLabel(player);
  const valuePool = metricValuesForPool(valueIndexRawMetric);
  const fitPool = metricValuesForPool(squadFitIndexRawMetric);
  const captainPool = metricValuesForPool(captainAlphaRawMetric);
  const floorPool = metricValuesForPool(badWeekFloorRawMetric);
  const riskPool = metricValuesForPool(riskControlRawMetric);
  const budgetPool = metricValuesForPool(budgetEaseRawMetric);
  const metrics = [
    profilePointMetric("Expected Points", expectedMatchdayPointValue(player), matchdayLabel, "Projected fantasy points"),
    profilePointMetric("Points After Risk", riskAdjustedMatchdayPointValue(player), matchdayLabel, "Risk-adjusted fantasy points"),
    profileIndexMetric("Value Index", valueIndexRawMetric(record), valuePool, "Value per price vs player pool."),
    profileIndexMetric("Squad Fit Index", squadFitIndexRawMetric(record), fitPool, "Scarcity-adjusted value vs player pool."),
    profileIndexMetric("Captain Option Index", captainAlphaRawMetric(record), captainPool, "Captain score vs player pool."),
    profileIndexMetric("Bad-Week Floor Index", badWeekFloorRawMetric(record), floorPool, "Higher floor is better."),
    profileIndexMetric("Advanced Safety Index", riskControlRawMetric(record), riskPool, "Lower downside, volatility, minutes, and role risk shown as better.", { lowerIsBetter: true }),
    profileIndexMetric("Budget Ease Index", budgetEaseRawMetric(record), budgetPool, "Lower opportunity cost shown as better.", { lowerIsBetter: true })
  ].filter(Boolean).join("");

  return `
    <p class="profile-metric-explainer">Points are shown per matchday. Indexes run from 0 to 100, and percentiles compare this player with the current player list.</p>
    <div class="profile-grid profile-grid--finance">
      ${metrics || profileMetric("Value Metrics", "Unavailable", "No public value metrics are available for this player.")}
    </div>
  `;
}

function publicFantasyNoteText(item) {
  const text = String(item || "").trim();
  const normalized = text.toLowerCase().replace(/[_-]/g, " ");

  if (!text) {
    return "";
  }

  if (
    normalized.includes("not final squad") ||
    normalized.includes("final squad source missing") ||
    normalized.includes("fantasy pool only not final squad")
  ) {
    return "Check latest availability before relying heavily on this pick.";
  }

  if (normalized.includes("not final public")) {
    return "Refresh the player feed before major recommendation changes.";
  }

  if (normalized.includes("not team builder")) {
    return "Use Team Builder as planning help and check squad legality before the deadline.";
  }

  if (
    (normalized.includes("official rules") && normalized.includes("manual")) ||
    normalized.includes("rules manual review")
  ) {
    return "Confirm boosters, deadlines, and scoring details before the matchday locks.";
  }

  if (normalized.includes("squad staging") || normalized.includes("squad review rows")) {
    return "Check latest squad status before the deadline.";
  }

  if (normalized.includes(["mystery", "booster"].join(" "))) {
    return "Confirm Clean Sheet Shield details before using it.";
  }

  if (normalized.includes("deadline semantics")) {
    return "Confirm deadline timing before the matchday locks.";
  }

  if (normalized.includes("high team context uncertainty")) {
    return "Team context still needs matchday confirmation.";
  }

  if (normalized.includes("missing national team usage review")) {
    return "National-team role is less clear for this player.";
  }

  return text.includes("_") ? titleFromSnake(text) : text;
}

function previewListItems(items, fallback) {
  const values = Array.isArray(items)
    ? items.filter(Boolean).map(publicFantasyNoteText).filter(Boolean)
    : [];
  const list = values.length ? values : [fallback];
  const seen = new Set();
  return list
    .filter((item) => {
      const key = item.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .slice(0, 3)
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");
}

function publicFantasyPickReasonItems(player) {
  const candidate = player.preview_candidate || {};
  const mode = candidate.mode || player.value_role || "balanced";
  const modeLabel = publicPickModelLabelFromMode(mode, candidate.mode_label || player.preview_mode_label || titleFromSnake(mode));
  const projected = projectedMatchdayPoints(player);
  const ceiling = fantasyPoolCandidateStat(player, "ceiling_points");
  const floor = fantasyPoolCandidateStat(player, "floor_points");
  const startProbability = Number(candidate.start_probability);
  const startText = Number.isFinite(startProbability)
    ? ` with ${Math.round(startProbability * 100)}% start chance`
    : "";
  const projection = pickProjectionRow(player);
  const availableProjection = projectionIsAvailable(projection) ? projection : null;
  const scopeMatchdayId = availableProjection?.matchday_id || candidate.matchday || activeMatchdayId;
  const isGroupStageScope = !availableProjection && scopeMatchdayId === "group_stage_full";
  const fixtureCount = Number(candidate.fixture_context?.fixture_count);
  const scopeText = isGroupStageScope
    ? `projected points per matchday across the group stage (${Number.isFinite(fixtureCount) && fixtureCount > 0 ? fixtureCount : 3} matches)`
    : `projected points for ${matchdayLabelFromId(scopeMatchdayId)}`;
  const matchContext = projectionMatchContextSummary(player, availableProjection, {
    measureKey: mode,
    modelKey: candidate.mode,
    surface: "profile"
  });
  const fixtureText = matchContext
    ? `Fixture note: ${matchContext}`
    : "";
  const reasons = [];

  if (mode === "captain") {
    reasons.push(`${modeLabel}: strong captain-planning profile with ${projected} ${scopeText}${startText}.`);
  } else if (mode === "safe") {
    reasons.push(`${modeLabel}: ${projected} ${scopeText}${startText} and a useful floor of ${floor}.`);
  } else if (mode === "upside") {
    reasons.push(`${modeLabel}: ${ceiling} upside ceiling with ${projected} ${scopeText}.`);
  } else if (mode === "differential") {
    reasons.push(`${modeLabel}: less obvious pick with ${projected} ${scopeText}${startText}.`);
  } else {
    reasons.push(`${modeLabel}: ${projected} ${scopeText}${startText}.`);
  }

  if (fixtureText) {
    reasons.push(fixtureText);
  }

  return reasons;
}

function profileWhyPickPanel(player, measureKey = measureKeyForTrust(activeMeasure())) {
  const previewPickReasons = player.preview_candidate
    ? publicFantasyPickReasonItems(player)
    : player.preview_why_pick;
  const defaultPick = player.short_reason || styleReason(player, measureKey);
  const carefulReasons = publicFantasyRiskReasons(player, measureKey);
  const carefulItems = carefulReasons.length
    ? [`Risk view: ${publicRiskSentence(carefulReasons)}`]
    : [];
  const carefulCard = carefulItems.length ? `
      <article class="profile-reason-card profile-reason-card--careful">
        <h4>Why Be Careful</h4>
        <ul>${carefulItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </article>
  ` : "";

  return `
    <div class="profile-reason-grid">
      <article class="profile-reason-card profile-reason-card--pick">
        <h4>Why Pick Him</h4>
        <ul>${previewListItems(previewPickReasons, defaultPick)}</ul>
      </article>
      ${carefulCard}
    </div>
  `;
}

function profileBestUseGrid(player, measureKey = measureKeyForTrust(activeMeasure())) {
  const risk = scoreValue(player, "finance_composite_risk_score", "risk_composite_score");
  const start = scoreValue(player, "start_probability_percent");
  const expected = projectedMatchdayPointValue(player);
  const captain = scoreValue(player, "finance_captain_score");
  const strategy = measures[measureKey]?.label || titleFromSnake(measureKey);
  const bestUse = measureKey === "captain" || isCaptainOption(player) || captain >= 70
    ? "Captain option"
    : measureKey === "safe" || (risk <= 45 && start >= 65)
      ? "High-floor starter"
      : measureKey === "upside"
        ? "Upside swing"
        : measureKey === "differential"
          ? "Differential watch"
          : measureKey === "expected"
            ? "Projected-points pick"
            : "Core pick";

  return `
    <div class="profile-grid profile-grid--compact">
      ${profileMetric("Best Use", bestUse, strategy)}
      ${profileMetric("Projected Pts / Matchday", profileScore(expected), pickProjectionContextText(player))}
      ${profileMetric("Role Caution", pickRiskLabel(player), `${displayNumber(risk)} downside score`)}
      ${profileMetric("Start Chance", profileScore(start, "%"), titleFromSnake(player.country_role))}
    </div>
  `;
}

function profilePerformanceGrid(player) {
  return `
    <div class="profile-grid profile-grid--finance">
      ${profileMetric("Club Minutes", profileScore(player.minutes), `${profileScore(player.starts)} starts`)}
      ${profileMetric("Club Goals", profileScore(player.goals), `${profileScore(player.assists)} assists`)}
      ${profileMetric("Goal Involvements", profileScore(player.goal_involvements), `${profileScore(player.shots)} shots`)}
      ${profileMetric("Clean Sheets", profileScore(player.clean_sheets), `${profileScore(player.goals_conceded)} goals conceded`)}
      ${profileMetric("Cards", `${profileScore(player.yellow_cards)} yellow`, `${profileScore(player.red_cards)} red`)}
      ${profileMetric("National Minutes", profileScore(player.national_minutes), `${profileScore(player.national_starts)} starts`)}
      ${profileMetric("National Goals", profileScore(player.national_goals), `${profileScore(player.national_assists)} assists`)}
      ${profileMetric("National Role", titleFromSnake(player.national_role_signal), `${profilePercent(player.national_start_rate)} start rate`)}
    </div>
  `;
}

function publicFixtureUseLabel(fixtureUse) {
  if (fixtureUse === "current_official_fantasy_pool") {
    return "Current fantasy pool";
  }

  return titleFromSnake(fixtureUse);
}

function profileFixtureRows(player) {
  const projections = playerMatchdayProjections(player);

  if (!projections.length) {
    return `
      <tr class="fallback-table-row">
        <td colspan="8">No matchday fixture projections are available for this player yet.</td>
      </tr>
    `;
  }

  return projections.map((projection) => {
    const context = projectionMatchContext(projection);
    return `
      <tr class="${projection.matchday_id === activeMatchdayId ? "is-active-fixture" : ""}">
        <td>
          <strong>${escapeHtml(projection.matchday_label)}</strong>
          <small>${escapeHtml(projection.eastern_datetime_label || projection.date || "")}</small>
        </td>
        <td>
          <strong>${escapeHtml(projection.opponent)}</strong>
          <small>${escapeHtml(projection.city || publicFixtureUseLabel(projection.fixture_use))}</small>
        </td>
        <td>${profileScore(context.teamProjectedXg)}</td>
        <td>${profileScore(context.opponentProjectedXg)}</td>
        <td>${escapeHtml(context.winDrawWin)}</td>
        <td>${escapeHtml(context.mostLikelyScore)}</td>
        <td>
          <strong>${escapeHtml(context.cleanSheetContext)}</strong>
          <small>${escapeHtml(profilePercent(context.cleanSheetProbability))}</small>
        </td>
        <td>${escapeHtml(context.matchUncertainty)}</td>
      </tr>
    `;
  }).join("");
}

function profileFixtureContextGrid(player) {
  const preferredProjection = pickProjectionRow(player);
  const activeMatchdayProjection = activeProjection(player);
  const projection = projectionIsAvailable(preferredProjection)
    ? preferredProjection
    : projectionIsAvailable(activeMatchdayProjection)
      ? activeMatchdayProjection
      : playerMatchdayProjections(player)[0];

  if (!projectionIsAvailable(projection)) {
    return "<p>No fixture context is available for this player yet.</p>";
  }

  const context = projectionMatchContext(projection);
  const fixtureNote = `${projection.matchday_label || matchdayLabelFromId(projection.matchday_id)} vs ${projection.opponent}`;
  const opponent = projection.opponent || "listed opponent";
  const metricHtml = [];
  const addMetric = (label, valueToDisplay, note, available = true) => {
    if (!available || valueToDisplay === null || valueToDisplay === undefined || valueToDisplay === "") {
      return;
    }

    if (String(valueToDisplay).toLowerCase().includes("needs check")) {
      return;
    }

    metricHtml.push(profileMetric(label, valueToDisplay, note));
  };

  addMetric(
    "Team projected xG",
    profileScore(context.teamProjectedXg),
    `Match-specific expected goals vs ${opponent}.`,
    Number.isFinite(context.teamProjectedXg)
  );
  addMetric(
    "Opponent projected xG",
    profileScore(context.opponentProjectedXg),
    `Opponent match-specific expected goals vs ${playerCountryText(player)}.`,
    Number.isFinite(context.opponentProjectedXg)
  );
  addMetric("Win / Draw / Win", context.winDrawWin, "Fixture outcome shape", Boolean(context.row));
  addMetric("Most likely score", context.mostLikelyScore, context.fixtureShape || fixtureNote, Boolean(context.row));
  addMetric(
    "Clean-sheet context",
    context.cleanSheetContext,
    Number.isFinite(context.cleanSheetProbability) ? profilePercent(context.cleanSheetProbability) : fixtureNote,
    Boolean(context.row) || Number.isFinite(context.cleanSheetProbability)
  );
  addMetric("Match uncertainty", context.matchUncertainty, "Higher means the match can swing more", Boolean(context.row || context.sidePrediction));

  if (!metricHtml.length) {
    return `<p>No compact fixture context is available for ${escapeHtml(fixtureNote)} yet.</p>`;
  }

  return `
    <div class="profile-grid profile-grid--compact">
      ${metricHtml.join("")}
    </div>
  `;
}

function profileNotesList(player) {
  const notes = [
    player.preview_candidate ? "" : player.short_reason,
    player.minutes_model_source_note,
    player.price_note,
    player.data_note,
    player.source_note
  ].filter(Boolean);

  if (Array.isArray(player.source_review_flags) && player.source_review_flags.length) {
    notes.unshift(`Review notes: ${player.source_review_flags.map(publicFantasyNoteText).join(", ")}.`);
  }

  if (!notes.length) {
    return "<li>No extra player notes are available yet.</li>";
  }

  return notes.map((note) => `<li>${escapeHtml(note)}</li>`).join("");
}

function profileBuilderActionHtml(player) {
  const lockId = builderLockPlayerId(player);
  const alreadyLocked = lockId && lockedPlayerIds.has(lockId);
  const lockLabel = alreadyLocked ? "Remove from Builder" : "Add to Builder";
  const lockButton = lockId
    ? `<button class="pick-card__action pick-card__action--lock${alreadyLocked ? " is-active" : ""}" type="button" data-lock-player-id="${escapeHtml(lockId)}" aria-pressed="${alreadyLocked}">${lockLabel}</button>`
    : `<button class="pick-card__action" type="button" disabled title="This player is not available in the current Team Builder path.">Unavailable</button>`;

  return `
    <div class="profile-action-row">
      ${lockButton}
    </div>
  `;
}

function renderPlayerDetail(player, measureKey = measureKeyForTrust(activeMeasure())) {
  const recommendationTags = playerRecommendationLabels(player, measureKey)
    .map((label) => profileTag(label.text, label.kind))
    .join("");
  const warningHtml = modelDataWarningHtml(activeDataWarningsForSection("player_profile"), {
    title: "Player Profile"
  });

  playerDetailTitle.textContent = player.name;
  playerDetailSubtitle.textContent = `${playerCountryText(player)} · Official fantasy position: ${player.position}`;
  playerDetailBody.innerHTML = `
    ${warningHtml}

    <div class="profile-tags-wrap">
      <div class="profile-tags-header">
        <div class="profile-tags">
          ${recommendationTags}
        </div>
        <button class="info-button info-button--small profile-tag-help-button" type="button" aria-expanded="false" aria-controls="profile-tag-help" data-profile-tag-help>?</button>
      </div>
      ${publicProfileTagHelpHtml()}
    </div>

    ${profileBuilderActionHtml(player)}

    <section class="profile-section">
      <h3>Why Pick Him</h3>
      ${profileWhyPickPanel(player, measureKey)}
    </section>

    <section class="profile-section">
      <h3>Best Use</h3>
      ${profileBestUseGrid(player, measureKey)}
    </section>

    <section class="profile-section">
      <h3>Fixture Context</h3>
      ${profileFixtureContextGrid(player)}
    </section>

    <details class="profile-section profile-section--advanced">
      <summary>Score Predictions</summary>
      <div class="profile-advanced-body">
        <div class="table-wrapper player-detail-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Matchday</th>
                <th>Opponent</th>
                <th>Team projected xG</th>
                <th>Opponent projected xG</th>
                <th>Win / Draw / Win</th>
                <th>Most likely score</th>
                <th>Clean-sheet context</th>
                <th>Match uncertainty</th>
              </tr>
            </thead>
            <tbody>${profileFixtureRows(player)}</tbody>
          </table>
        </div>
      </div>
    </details>

    <section class="profile-section">
      <h3>Value Metrics</h3>
      ${profileFinanceGrid(player)}
    </section>
  `;
}

function openPlayerDetail(playerId, trigger = null) {
  const player = playerById(playerId);

  if (!player || !playerDetailModal || !playerDetailBody) {
    return;
  }

  const measureKey = trigger?.dataset?.playerDetailMeasureKey || measureKeyForTrust(activeMeasure());
  lastPlayerDetailTrigger = trigger || document.activeElement;
  renderPlayerDetail(player, measureKey);
  playerDetailModal.classList.remove("hidden");
  document.body.classList.add("modal-open");
  playerDetailPanel?.focus();
}

function closePlayerDetail() {
  if (!playerDetailModal) {
    return;
  }

  playerDetailModal.classList.add("hidden");
  document.body.classList.remove("modal-open");
  lastPlayerDetailTrigger?.focus?.();
}

function handlePlayerDetailTrigger(event) {
  const trigger = event.target.closest("[data-player-detail-id]");

  if (!trigger) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation?.();
  openPlayerDetail(trigger.dataset.playerDetailId, trigger);
}

function signalFilterOptions() {
  return [
    { value: "all", label: "All Fixtures" },
    { value: "high_goals", label: "High Goal Environment" },
    { value: "clean_sheet", label: "Clean-Sheet Watch" },
    { value: "strong_favorite", label: "Strong Favorites" },
    { value: "btts", label: "Both Teams To Score" }
  ];
}

function fixtureDateSort(a, b) {
  return (a.date || "").localeCompare(b.date || "") ||
    value(a.match_number) - value(b.match_number);
}

function strongestCleanSheetTeam(row) {
  const homeCleanSheet = value(row.home_clean_sheet_probability);
  const awayCleanSheet = value(row.away_clean_sheet_probability);

  return homeCleanSheet >= awayCleanSheet
    ? { team: row.home_team, probability: homeCleanSheet }
    : { team: row.away_team, probability: awayCleanSheet };
}

function scorePredictionRowsForFilters() {
  const matchdayId = environmentMatchdaySelect?.value || activeEnvironmentMatchdayId;
  const groupValue = environmentGroupSelect?.value || "all";
  const signalValue = environmentFilterSelect?.value || "all";

  let rows = scorePredictionRows.filter((row) =>
    (matchdayId === "group_stage_full" || row.fantasy_matchday_id === matchdayId) &&
    (groupValue === "all" || row.group === groupValue)
  );

  if (signalValue === "high_goals") {
    rows = rows.filter((row) => value(row.total_expected_goals) >= 2.85);
  } else if (signalValue === "clean_sheet") {
    rows = rows.filter((row) => strongestCleanSheetTeam(row).probability >= 0.48);
  } else if (signalValue === "upset_risk") {
    rows = rows.filter((row) => value(row.upset_risk_probability) >= 0.18);
  } else if (signalValue === "strong_favorite") {
    rows = rows.filter((row) => value(row.favorite_win_probability) >= 0.68);
  } else if (signalValue === "btts") {
    rows = rows.filter((row) => value(row.both_teams_to_score_probability) >= 0.48);
  }

  return rows.sort((a, b) => {
    if (signalValue === "high_goals") {
      return value(b.total_expected_goals) - value(a.total_expected_goals) || fixtureDateSort(a, b);
    }
    if (signalValue === "clean_sheet") {
      return strongestCleanSheetTeam(b).probability - strongestCleanSheetTeam(a).probability || fixtureDateSort(a, b);
    }
    if (signalValue === "upset_risk") {
      return value(b.upset_risk_probability) - value(a.upset_risk_probability) || fixtureDateSort(a, b);
    }
    if (signalValue === "strong_favorite") {
      return value(b.favorite_win_probability) - value(a.favorite_win_probability) || fixtureDateSort(a, b);
    }
    if (signalValue === "btts") {
      return value(b.both_teams_to_score_probability) - value(a.both_teams_to_score_probability) || fixtureDateSort(a, b);
    }

    return fixtureDateSort(a, b);
  });
}

function renderMatchEnvironmentOptions() {
  if (!environmentMatchdaySelect || !environmentGroupSelect || !environmentFilterSelect) {
    return;
  }

  environmentMatchdaySelect.innerHTML = matchdayOptions
    .map((option) => `<option value="${option.matchday_id}">${option.label}</option>`)
    .join("");
  environmentMatchdaySelect.value = activeEnvironmentMatchdayId;

  const groups = [...new Set(scorePredictionRows.map((row) => row.group))]
    .filter(Boolean)
    .sort();
  environmentGroupSelect.innerHTML = [
    `<option value="all">All groups</option>`,
    ...groups.map((group) => `<option value="${group}">Group ${group}</option>`)
  ].join("");

  environmentFilterSelect.innerHTML = signalFilterOptions()
    .map((option) => `<option value="${option.value}">${option.label}</option>`)
    .join("");
}

function renderMatchEnvironmentTable() {
  if (!matchEnvironmentTableBody || !matchEnvironmentSummary) {
    return;
  }

  if (!scorePredictionRows.length) {
    matchEnvironmentSummary.hidden = false;
    matchEnvironmentSummary.setAttribute("aria-hidden", "false");
    matchEnvironmentSummary.innerHTML = modelDataWarningHtml(
      activeDataWarningsForSection("match_environment"),
      { title: "Match Environment" }
    );
    matchEnvironmentTableBody.innerHTML = `
      <tr>
        <td colspan="6">Active Match Environment data unavailable.</td>
      </tr>
    `;
    return;
  }

  const rows = scorePredictionRowsForFilters();
  const visibleRows = rows;
  matchEnvironmentSummary.hidden = true;
  matchEnvironmentSummary.setAttribute("aria-hidden", "true");
  matchEnvironmentSummary.textContent = "";

  if (!visibleRows.length) {
    matchEnvironmentTableBody.innerHTML = `
      <tr>
        <td colspan="6">No fixtures match this environment filter.</td>
      </tr>
    `;
    return;
  }

  matchEnvironmentTableBody.innerHTML = visibleRows.map((row) => {
    const matchUncertainty = matchUncertaintyLabel(row);
    const scorelineAlternatives = topScorelineAlternativesText(row);
    const liveFixture = liveFixtureForScorePrediction(row);
    const liveFixtureContext = liveFixtureContextHtml(liveFixture);

    return `
      <tr>
        <td>
          <strong>${row.home_team} vs ${row.away_team}</strong>
          <small>Group ${row.group} · ${matchdayLabelFromId(row.fantasy_matchday_id)} · ${row.eastern_datetime_label || row.date}</small>
          ${liveFixtureContext ? `<small class="live-score-context">${liveFixtureContext}</small>` : ""}
        </td>
        <td>
          <strong class="match-projected-xg" title="Expected goals for this matchup.">${projectedXgText(row)}</strong>
          <small>Expected goals for this matchup.</small>
        </td>
        <td>
          <strong class="match-compact-line">${winDrawWinText(row)}</strong>
        </td>
        <td>
          <strong>${topScorelineText(row)}</strong>
          ${scorelineAlternatives ? `<small>${scorelineAlternatives}</small>` : ""}
          <small>${totalGoalsRangeText(row)}</small>
        </td>
        <td>
          <strong>${matchUncertainty}</strong>
          <small>${matchShapePhrase(row)}</small>
        </td>
        <td>
          <strong class="clean-sheet-lines">${cleanSheetContextText(row)}</strong>
          <small class="clean-sheet-lines clean-sheet-lines--muted">${cleanSheetProbabilityText(row)}</small>
        </td>
      </tr>
    `;
  }).join("");
}

function knockoutScorelineText(row) {
  return (row.top_scorelines || [])
    .slice(0, 3)
    .map((scoreline) => `${scoreline.scoreline} ${compactPercentText(scoreline.probability)}`)
    .join(" · ");
}

function knockoutPredictionCardHtml(row, options = {}) {
  if (!row) {
    return "";
  }

  const label = options.label || "Knockout Matchup";
  return `
    <article class="knockout-prediction-card">
      <span class="info-card__label">${escapeHtml(label)}</span>
      <h3>${escapeHtml(row.home_team)} vs ${escapeHtml(row.away_team)}</h3>
      <div class="knockout-result-grid">
        <span><strong>${displayNumber(row.home_expected_goals)}</strong><small>${escapeHtml(row.home_team)} xG</small></span>
        <span><strong>${displayNumber(row.away_expected_goals)}</strong><small>${escapeHtml(row.away_team)} xG</small></span>
        <span><strong>${compactPercentText(row.probability_extra_time)}</strong><small>Extra time</small></span>
        <span><strong>${escapeHtml(row.projected_advancing_team || "Needs check")}</strong><small>Projected advancer</small></span>
      </div>
      <p class="knockout-probability-line">
        ${escapeHtml(row.home_team)} ${compactPercentText(row.home_advance_probability)}
        <span>vs</span>
        ${escapeHtml(row.away_team)} ${compactPercentText(row.away_advance_probability)}
      </p>
      <p>${escapeHtml(knockoutScorelineText(row) || row.uncertainty_label || "Scoreline needs check")}</p>
    </article>
  `;
}

function renderKnockoutKnownFixtures() {
  if (!knockoutKnownFixturesBody) {
    return;
  }

  if (!knockoutKnownPredictionRows.length) {
    knockoutKnownFixturesBody.innerHTML = `
      <tr>
        <td colspan="5">Known Final Round fixtures are not loaded yet.</td>
      </tr>
    `;
    return;
  }

  knockoutKnownFixturesBody.innerHTML = knockoutKnownPredictionRows
    .slice()
    .sort((a, b) => value(a.match_number) - value(b.match_number))
    .map((row) => {
      const projectedAdvancer = row.projected_advancing_team || row.favorite_team || "Needs check";
      const projectedAdvancerKey = normalizeText(projectedAdvancer);
      const homeAdvance = Number(row.home_advance_probability);
      const awayAdvance = Number(row.away_advance_probability);
      const advanceProbability = projectedAdvancerKey === normalizeText(row.home_team)
        ? homeAdvance
        : projectedAdvancerKey === normalizeText(row.away_team)
          ? awayAdvance
          : Number(row.favorite_win_probability);
      const advanceText = Number.isFinite(advanceProbability) ? compactPercentText(advanceProbability) : "needs check";
      const fixtureLabel = [
        row.match_number ? `M${row.match_number}` : "",
        row.public_label || "Known",
        "Final Round"
      ].filter(Boolean).join(" · ");

      return `
        <tr>
          <td><strong>${escapeHtml(row.home_team)} vs ${escapeHtml(row.away_team)}</strong><small>${escapeHtml(fixtureLabel)}</small></td>
          <td>${displayNumber(row.home_expected_goals)}-${displayNumber(row.away_expected_goals)}</td>
          <td>${compactPercentText(row.home_win_probability)} / ${compactPercentText(row.probability_extra_time || row.draw_probability)} / ${compactPercentText(row.away_win_probability)}</td>
          <td>${escapeHtml(projectedAdvancer)} <small>${escapeHtml(advanceText)} advance</small></td>
          <td>${escapeHtml(row.uncertainty_label || row.matchUncertainty || "Medium")}</td>
        </tr>
      `;
    })
    .join("");
}

function renderKnockoutMatchup() {
  if (!knockoutMatchupResult || !knockoutFixtureSelect) {
    return;
  }

  const selectedFixtureId = knockoutFixtureSelect.value;
  const row = knockoutKnownPredictionRows.find((fixture) =>
    String(fixture.fixture_id || fixture.match_id || fixture.match_number || "") === selectedFixtureId
  ) || knockoutKnownPredictionRows[0] || null;

  if (!row) {
    knockoutMatchupResult.innerHTML = modelDataWarningHtml("No known Final Round fixture is available yet.", { title: "Knockout predictor" });
    return;
  }

  knockoutMatchupResult.innerHTML = knockoutPredictionCardHtml(row, { label: `M${row.match_number || ""} · ${row.public_label || "Final Round"} Fixture` });
}

function renderKnockoutPredictor() {
  renderKnockoutKnownFixtures();

  if (!knockoutFixtureSelect) {
    return;
  }

  if (!knockoutKnownPredictionRows.length) {
    knockoutFixtureSelect.innerHTML = `<option value="">Known Final Round fixtures unavailable</option>`;
    renderKnockoutMatchup();
    return;
  }

  const optionsHtml = knockoutKnownPredictionRows
    .slice()
    .sort((a, b) => value(a.match_number) - value(b.match_number))
    .map((row) => {
      const fixtureKey = row.fixture_id || row.match_id || row.match_number || "";
      const label = [
        row.match_number ? `M${row.match_number}` : "",
        `${row.home_team} vs ${row.away_team}`
      ].filter(Boolean).join(" · ");
      return `<option value="${escapeHtml(fixtureKey)}">${escapeHtml(label)}</option>`;
    })
    .join("");
  knockoutFixtureSelect.innerHTML = optionsHtml;

  const defaultFixture = knockoutKnownPredictionRows[0];
  knockoutFixtureSelect.value = defaultFixture?.fixture_id || defaultFixture?.match_id || defaultFixture?.match_number || "";
  renderKnockoutMatchup();
}

function knockoutBracketTeamId(team) {
  return team?.teamId || team?.team_id || "";
}

function knockoutBracketTeamLabel(team) {
  if (!team) {
    return "Pending";
  }

  const name = team.name || team.team || "Pending";
  const code = team.code && team.code !== "TBD" ? ` ${team.code}` : "";
  const flag = team.flag || "";
  return `${flag ? `${flag} ` : ""}${name}${code ? ` (${code.trim()})` : ""}`;
}

function knockoutBracketCompactTeamLabel(team) {
  if (!team) {
    return "Pending";
  }

  return [team.flag, team.name || team.team || team.code || "Pending"].filter(Boolean).join(" ");
}

function knockoutBracketBadge(label, kind = "neutral") {
  return `<span class="knockout-bracket-badge knockout-bracket-badge--${escapeHtml(kind)}">${escapeHtml(label)}</span>`;
}

function knockoutBracketResultBadge(match) {
  const labels = {
    correct: ["Correct", "correct"],
    wrong: ["Wrong", "wrong"],
    pending: ["Pending", "pending"],
    not_available: ["Prediction unavailable", "pending"]
  };
  const [label, kind] = labels[match?.predictionResult] || labels.pending;
  return knockoutBracketBadge(label, kind);
}

function knockoutBracketStatusBadge(match) {
  if (match?.status === "final") return knockoutBracketBadge("Final", "final");
  if (match?.status === "playing") return knockoutBracketBadge("Live", "live");
  return knockoutBracketBadge("Prediction", "prediction");
}

function knockoutBracketProbabilityText(valueToDisplay) {
  return valueToDisplay === null || valueToDisplay === undefined ? "pending" : compactPercentText(valueToDisplay);
}

function knockoutBracketSummaryCard(label, valueToDisplay, note = "") {
  return `
    <article class="knockout-bracket-summary-card">
      <span class="info-card__label">${escapeHtml(label)}</span>
      <strong>${escapeHtml(valueToDisplay)}</strong>
      ${note ? `<p>${escapeHtml(note)}</p>` : ""}
    </article>
  `;
}

function renderKnockoutBracketSummary() {
  if (!knockoutBracketSummary) {
    return;
  }

  const data = knockoutBracketPredictionData;
  if (!data?.summary) {
    knockoutBracketSummary.innerHTML = modelDataWarningHtml("Bracket prediction data is not loaded.", { title: "Bracket Prediction" });
    return;
  }

  const summary = data.summary;
  const accuracyText = summary.accuracyPct === null || summary.accuracyPct === undefined
    ? "Pending"
    : `${displayNumber(summary.accuracyPct)}%`;
  const finalists = (summary.predictedFinalists || []).map(knockoutBracketCompactTeamLabel).join(" vs ") || "Pending";
  const semifinalists = (summary.predictedSemifinalists || []).map(knockoutBracketCompactTeamLabel).join(", ") || "Pending";
  const statusNote = `${summary.correctWinnerPredictions || 0} correct, ${summary.wrongWinnerPredictions || 0} wrong, ${summary.pendingPredictions || 0} pending`;

  knockoutBracketSummary.innerHTML = [
    knockoutBracketSummaryCard("Predicted Champion", knockoutBracketCompactTeamLabel(summary.predictedChampion), data.defaultStrategy?.label || "Default strategy"),
    knockoutBracketSummaryCard("Predicted Finalists", finalists),
    knockoutBracketSummaryCard("Predicted Semifinalists", semifinalists),
    knockoutBracketSummaryCard("Accuracy So Far", accuracyText, statusNote),
    knockoutBracketSummaryCard("Bracket Status", titleFromSnake(data.predictionStatus || "pending"), "Actual results will be tracked as matches finish.")
  ].join("");
}

function knockoutBracketTeamRow(match, team, side) {
  const probability = side === "A" ? match.teamAAdvanceProb : match.teamBAdvanceProb;
  const isModelPick = knockoutBracketTeamId(match.predictedWinner) && knockoutBracketTeamId(match.predictedWinner) === knockoutBracketTeamId(team);
  const isActualWinner = knockoutBracketTeamId(match.actualWinner) && knockoutBracketTeamId(match.actualWinner) === knockoutBracketTeamId(team);
  const rowClasses = [
    "knockout-bracket-team-row",
    isModelPick ? "is-model-pick" : "",
    isActualWinner ? "is-actual-winner" : ""
  ].filter(Boolean).join(" ");

  return `
    <div class="${rowClasses}">
      <span class="knockout-bracket-flag">${escapeHtml(team?.flag || team?.code || "TBD")}</span>
      <span class="knockout-bracket-team-name">${escapeHtml(team?.name || team?.team || "Pending")}</span>
      <span class="knockout-bracket-team-prob">${escapeHtml(knockoutBracketProbabilityText(probability))}</span>
    </div>
  `;
}

function knockoutBracketActualPathText(match) {
  if (match.status === "final" && match.actualWinner) {
    return `${knockoutBracketCompactTeamLabel(match.actualWinner)} · ${match.actualScore || "score pending"}`;
  }

  const actualTeams = [match.actualTeamA, match.actualTeamB].filter(Boolean);
  if (actualTeams.length === 2) {
    return `${actualTeams.map(knockoutBracketCompactTeamLabel).join(" vs ")} · pending result`;
  }

  return "Actual path pending";
}

function knockoutBracketMatchCard(match) {
  const resultBadge = knockoutBracketResultBadge(match);
  const statusBadge = knockoutBracketStatusBadge(match);
  const sourceLabel = match.sourceFixtureId ? `Source fixture ID ${match.sourceFixtureId}` : match.sourceConfidence;
  const actualWinnerBadge = match.actualWinner
    ? `<span class="knockout-bracket-inline-badge knockout-bracket-inline-badge--actual">Actual ${escapeHtml(knockoutBracketCompactTeamLabel(match.actualWinner))}</span>`
    : "";

  return `
    <article class="knockout-bracket-match" data-bracket-slot="${escapeHtml(match.bracketSlotId)}" data-round="${escapeHtml(match.round)}" data-prediction-result="${escapeHtml(match.predictionResult)}">
      <div class="knockout-bracket-match__topline">
        <span>${escapeHtml(match.bracketSlotId)}</span>
        <div>${statusBadge}${resultBadge}</div>
      </div>
      <div class="knockout-bracket-teams">
        ${knockoutBracketTeamRow(match, match.teamA, "A")}
        ${knockoutBracketTeamRow(match, match.teamB, "B")}
      </div>
      <div class="knockout-bracket-pick-row">
        <span>Model pick</span>
        <strong>${escapeHtml(knockoutBracketCompactTeamLabel(match.predictedWinner))}</strong>
      </div>
      <div class="knockout-bracket-detail-row">
        <span>Projected score</span>
        <strong>${escapeHtml(match.predictedScoreLabel || "Projected score unavailable")}</strong>
      </div>
      <div class="knockout-bracket-detail-row knockout-bracket-detail-row--actual">
        <span>Actual</span>
        <strong>${escapeHtml(knockoutBracketActualPathText(match))}</strong>
        ${actualWinnerBadge}
      </div>
      <p>${escapeHtml(match.pathNote || match.bracketPath || "Path note pending.")}</p>
      <small>${escapeHtml(sourceLabel || "prediction source pending")}</small>
    </article>
  `;
}

function renderKnockoutBracketPrediction() {
  renderKnockoutBracketSummary();

  if (!knockoutBracketBoard) {
    return;
  }

  const data = knockoutBracketPredictionData;
  const matches = Array.isArray(data?.matches) ? data.matches : [];
  if (!matches.length) {
    knockoutBracketBoard.innerHTML = modelDataWarningHtml("Bracket prediction data is not loaded.", { title: "Bracket Prediction" });
    return;
  }

  knockoutBracketBoard.innerHTML = (data.rounds || [])
    .map((round) => {
      const roundMatches = matches
        .filter((match) => match.round === round.round)
        .sort((a, b) => value(a.matchId) - value(b.matchId));

      if (!roundMatches.length) {
        return "";
      }

      return `
        <section class="knockout-bracket-round-column" data-bracket-round="${escapeHtml(round.round)}" aria-label="${escapeHtml(round.label)}">
          <h3>${escapeHtml(round.label)}</h3>
          <div class="knockout-bracket-round-stack">
            ${roundMatches.map(knockoutBracketMatchCard).join("")}
          </div>
        </section>
      `;
    })
    .join("");
}

function measureFromSelect(selectElement) {
  const selectedKey = selectElement?.value || "balanced";
  return measures[pickModelOptions[selectedKey]?.measureKey || selectedKey] || measures.balanced;
}

function activeMeasure() {
  return teamBuilderStrategyMeasure(measureSelect?.value);
}

function activeBuilderStrategyOption() {
  return teamBuilderStrategyOption(measureSelect?.value);
}

function activeBuilderStrategyLabel() {
  return activeBuilderStrategyOption().label;
}

function activeAdviceMeasure() {
  return measureFromSelect(adviceMeasureSelect);
}

function activeAdviceFinanceLens() {
  return financeLenses[adviceFinanceLensSelect?.value] || financeLenses.styleRanking;
}

function activeCardStat() {
  return cardStats[cardStatSelect.value] || cardStats.balanced;
}

function activeCardStatLabel(stat = activeCardStat()) {
  return stat === cardStats.balanced
    ? `${activeBuilderStrategyLabel()} Score`
    : stat.label;
}

function compactCardStatLabel(label) {
  return String(label || "Score")
    .replace(/\s+Score$/i, "")
    .replace("Projected Points", "Projected")
    .replace("Expected Minutes", "Minutes")
    .replace("Substitution Risk", "Sub Risk")
    .replace("Sharpe-Style", "Sharpe")
    .replace("Sortino-Style", "Sortino")
    .replace("Budget Price", "Price");
}

function measureScore(player, measure = activeMeasure(), mode = activeTrustMode()) {
  return trustAdjustedScore(player, measure, mode);
}

function sortPlayers(playerList, measure = activeMeasure(), mode = activeTrustMode()) {
  return [...playerList].sort((a, b) => {
    const scoreDifference = measureScore(b, measure, mode) - measureScore(a, measure, mode);

    if (scoreDifference !== 0) {
      return scoreDifference;
    }

    return scoreValue(b, "finance_risk_adjusted_return_points", "risk_adjusted_expected_points_estimate") -
      scoreValue(a, "finance_risk_adjusted_return_points", "risk_adjusted_expected_points_estimate");
  });
}

function playerReliabilityScore(player) {
  const startProbability = scoreValue(player, "start_probability_percent");
  const minutesScore = Math.min(100, (scoreValue(player, "expected_minutes_v0") / 90) * 100);

  return startProbability * 0.6 + minutesScore * 0.4;
}

function playerAttackingContextScore(player) {
  const summary = playerMatchEnvironmentSummary(player);
  const contexts = summary.contexts;

  if (!contexts.length) {
    return 0;
  }

  const teamXg = summary.averageTeamXg ?? 0;
  const attackEnvironment = averageFiniteValues(contexts.map((context) => context.attackingEnvironmentScore)) ?? 0;
  const favorableFixture = averageFiniteValues(contexts.map((context) =>
    context.fixtureDifficulty > 0 ? Math.max(0, 55 - context.fixtureDifficulty) : 0
  )) ?? 0;

  return teamXg * 24 + attackEnvironment * 0.32 + favorableFixture * 0.45;
}

function playerFloorScore(player) {
  const var10 = scoreValue(player, "finance_var10_points");
  const cvar20 = scoreValue(player, "finance_cvar20_points");
  const tailSafety = Math.max(0, 100 - scoreValue(player, "finance_tail_risk_score", "risk_tail_score"));

  return var10 * 9 + cvar20 * 5 + tailSafety * 0.32 + playerReliabilityScore(player) * 0.18;
}

function playerProjectedPoints(player) {
  return scoreValue(player, "finance_expected_return_points", "risk_adjusted_expected_points_estimate");
}

function playerRiskAdjustedPoints(player) {
  return scoreValue(player, "finance_risk_adjusted_return_points", "risk_adjusted_expected_points_estimate");
}

function playerCeilingPoints(player) {
  return scoreValue(player, "finance_upside_p90_points", "euro_style_points_per90_estimate");
}

function teamBuilderMd3V5ProjectionAdjustment(player, profile, role = "starter") {
  const projectedPoints = playerProjectedPoints(player);
  const riskAdjustedPoints = playerRiskAdjustedPoints(player);
  const ceilingPoints = playerCeilingPoints(player);
  const startProbability = scoreValue(player, "start_probability_percent");
  const expectedMinutes = scoreValue(player, "expected_minutes_v0");
  const price = proxyPrice(player);
  const captainSignal = captainRecommendationScore(player);
  const isStarter = role === "starter";
  const lowStartPenalty = Math.max(0, (isStarter ? 68 : 45) - startProbability) * (isStarter ? 0.34 : 0.14);
  const lowMinutesPenalty = Math.max(0, (isStarter ? 62 : 35) - expectedMinutes) * (isStarter ? 0.22 : 0.1);
  const cheapLowCeilingPenalty = price <= 6.5 && projectedPoints < (isStarter ? 4.8 : 3.4)
    ? (isStarter ? 9 : 3.5)
    : 0;
  const activeProjectionPenalty = activeMatchdayId !== "group_stage_full" && projectionIsMissing(activeProjection(player))
    ? 18
    : 0;
  const playableStarterBonus = startProbability >= 72 && expectedMinutes >= 62 ? 5 : 0;
  const captainBonus = isStarter ? Math.max(0, captainSignal - 70) * 0.12 : Math.max(0, captainSignal - 78) * 0.03;

  const strategyMultipliers = {
    balancedSquad: { projection: 8.2, risk: 3.2, ceiling: 0.6, premium: 1.1, value: 0.5 },
    diversifiedSquad: { projection: 5.7, risk: 4.2, ceiling: 0.25, premium: 0.35, value: 0.6 },
    concentratedUpside: { projection: 7.1, risk: 1.5, ceiling: 2.3, premium: 1.1, value: 0.2 },
    starsAndScrubs: { projection: 8.8, risk: 1.2, ceiling: 1.4, premium: 3.2, value: -0.2 },
    valueSquad: { projection: 4.6, risk: 3.1, ceiling: 0.35, premium: -0.25, value: 2.2 }
  };
  const multipliers = strategyMultipliers[profile.id] || strategyMultipliers.balancedSquad;
  const premiumTierBonus = price >= 9
    ? Math.max(0, projectedPoints - 5.8) * multipliers.premium
    : 0;
  const efficientValueBonus = price > 0
    ? Math.max(0, (riskAdjustedPoints / price) - 0.45) * 12 * multipliers.value
    : 0;

  return projectedPoints * multipliers.projection +
    riskAdjustedPoints * multipliers.risk +
    ceilingPoints * multipliers.ceiling +
    premiumTierBonus +
    efficientValueBonus +
    playableStarterBonus +
    captainBonus -
    lowStartPenalty -
    lowMinutesPenalty -
    cheapLowCeilingPenalty -
    activeProjectionPenalty;
}

function playerFragilityPenalty(player) {
  const startProbability = scoreValue(player, "start_probability_percent");
  const expectedMinutes = scoreValue(player, "expected_minutes_v0");
  const compositeRisk = scoreValue(player, "finance_composite_risk_score", "risk_composite_score");
  const tailRisk = scoreValue(player, "finance_tail_risk_score", "risk_tail_score");

  return Math.max(0, 45 - startProbability) * 1.1 +
    Math.max(0, 40 - expectedMinutes) * 0.9 +
    Math.max(0, compositeRisk - 75) * 0.25 +
    Math.max(0, tailRisk - 78) * 0.2;
}

function playerMatchEnvironmentAdjustment(player, profile = teamBuilderStrategyScoringProfile(), role = "starter") {
  const summary = playerMatchEnvironmentSummary(player);

  if (!summary.contexts.length) {
    return 0;
  }

  const isAttacker = ["Forward", "Midfielder"].includes(player.position);
  const isDefenderOrKeeper = ["Goalkeeper", "Defender"].includes(player.position);
  const price = proxyPrice(player);
  const averageTeamXg = summary.averageTeamXg ?? 1.25;
  const averageOpponentXg = summary.averageOpponentXg ?? 1.25;
  const uncertainty = summary.averageMatchUncertaintyScore;
  const cleanSheetScore = summary.averageCleanSheetContextScore;
  const roleMultiplier = role === "starter" ? 1 : 0.42;
  const uncertaintyPenaltyByStrategy = {
    balancedSquad: 2.1,
    diversifiedSquad: 3.2,
    concentratedUpside: averageTeamXg >= 1.7 ? 0.45 : 1.25,
    starsAndScrubs: 1.5,
    valueSquad: 1.8
  };
  let score = 0;

  if (isAttacker) {
    score += Math.max(-4, Math.min(6.5, (averageTeamXg - 1.25) * 5.2));
    score -= summary.lowProjectedXgCount * 0.9;
  }

  if (isDefenderOrKeeper) {
    score += (cleanSheetScore - 0.42) * 6.5;
    score -= Math.max(0, averageOpponentXg - 1.35) * 2.4;
    score -= summary.difficultCleanSheetContextCount * 0.55;
  }

  score -= uncertainty * (uncertaintyPenaltyByStrategy[profile.id] ?? 2);

  if (profile.id === "concentratedUpside" && isAttacker && averageTeamXg >= 1.7) {
    score += uncertainty * 2.2 + summary.strongProjectedXgCount * 0.9;
  }

  if (profile.id === "starsAndScrubs" && price >= 8.5) {
    const weakPremiumEnvironment = isAttacker && averageTeamXg < 1.15 ||
      isDefenderOrKeeper && cleanSheetScore < 0.35;
    if (weakPremiumEnvironment) {
      score -= 4.4;
    }
  }

  if (profile.id === "valueSquad" && price <= 6.5) {
    if ((isAttacker && averageTeamXg >= 1.45) || (isDefenderOrKeeper && cleanSheetScore >= 0.62)) {
      score += 2.6;
    }
  }

  if (profile.id === "balancedSquad" && summary.highUncertaintyCount >= 2) {
    score -= 1.2;
  }

  return score * roleMultiplier;
}

function teamBuilderStrategyPlayerScore(player, measure = activeMeasure(), role = "starter", profile = teamBuilderStrategyScoringProfile()) {
  const cacheKey = [
    activeMatchdayId,
    activeTrustMode().id,
    measureKeyForTrust(measure),
    profile.id,
    role,
    player.id
  ].join(":");

  if (teamBuilderStrategyPlayerScoreCache.has(cacheKey)) {
    return teamBuilderStrategyPlayerScoreCache.get(cacheKey);
  }

  const weights = profile.playerWeights?.[role] ||
    profile.playerWeights?.starter ||
    teamBuilderStrategyScoringProfiles.balancedSquad.playerWeights.starter;
  const price = proxyPrice(player);
  const expectedScore = scoreValue(player, "finance_expected_return_points", "risk_adjusted_expected_points_estimate") * 12;
  const riskAdjustedScore = scoreValue(player, "finance_risk_adjusted_return_points", "risk_adjusted_expected_points_estimate") * 12;
  const upsideScore = scoreValue(player, "finance_upside_p90_points", "euro_style_points_per90_estimate") * 8;
  const md3V5ProjectionAdjustment = teamBuilderMd3V5ProjectionAdjustment(player, profile, role);
  const valueScore = measureScore(player, measures.bestValue);
  const cheapScore = measureScore(player, measures.cheapEnabler);
  const premiumScore = measureScore(player, measures.premiumWorthIt);
  const captainSignal = captainRecommendationScore(player);
  const reliabilityScore = playerReliabilityScore(player);
  const floorScore = playerFloorScore(player);
  const attackingContext = playerAttackingContextScore(player);
  const matchEnvironmentAdjustment = playerMatchEnvironmentAdjustment(player, profile, role);
  const priceScore = price * 10;
  const fragilityWeight = weights.fragilityPenalty ?? (
    profile.id === "concentratedUpside" ? 0.28 :
      profile.id === "starsAndScrubs" ? 0.18 :
        profile.id === "diversifiedSquad" ? 0.55 :
          profile.id === "valueSquad" ? 0.42 : 0.35
  );

  const score =
    measureScore(player, measure) * (weights.base || 0) +
    expectedScore * (weights.expected || 0) +
    riskAdjustedScore * (weights.riskAdjusted || 0) +
    upsideScore * (weights.upside || 0) +
    floorScore * (weights.floor || 0) +
    reliabilityScore * (weights.reliability || 0) +
    valueScore * (weights.value || 0) +
    cheapScore * (weights.cheap || 0) +
    premiumScore * (weights.premium || 0) +
    attackingContext * (weights.attackingContext || 0) +
    matchEnvironmentAdjustment +
    md3V5ProjectionAdjustment +
    finalRoundStrategicPlayerScore(player, role) +
    captainSignal * (weights.captain || 0) +
    priceScore * (weights.price || 0) -
    playerFragilityPenalty(player) * fragilityWeight;

  teamBuilderStrategyPlayerScoreCache.set(cacheKey, score);
  return score;
}

function sortPlayersForBuilderStrategy(playerList, measure = activeMeasure(), role = "starter", profile = teamBuilderStrategyScoringProfile()) {
  return [...playerList].sort((a, b) => {
    const scoreDifference = teamBuilderStrategyPlayerScore(b, measure, role, profile) -
      teamBuilderStrategyPlayerScore(a, measure, role, profile);

    if (scoreDifference !== 0) {
      return scoreDifference;
    }

    return measureScore(b, measure) - measureScore(a, measure);
  });
}

function rankedRecommendationPlayers(playerList, measure = activeMeasure(), mode = activeTrustMode(), options = {}) {
  const filteredPlayers = trustFilteredPlayers(playerList, measure, mode, {
    allowFallback: options.allowFallback,
    keepLocked: options.keepLocked
  });

  return sortPlayers(filteredPlayers, measure, mode);
}

function displayCountry(country) {
  return countryDisplayNames[country] || country || "Unknown";
}

function hasNeedsCheckCountry(player) {
  return !player.country || String(player.country).toLowerCase() === "needs_check";
}

function playerCountryKey(player) {
  return hasNeedsCheckCountry(player) ? "needs_check" : displayCountry(player.country);
}

function countryCountLabel(countryKey) {
  return countryKey === "needs_check" ? "Unknown country" : countryKey;
}

function playerCountryText(player) {
  return countryCountLabel(playerCountryKey(player));
}

function playerSearchText(player) {
  return normalizeText(`${player.name} ${player.display_name || ""} ${player.club} ${player.country} ${playerCountryText(player)} ${player.position}`);
}

function topByPosition(position, measure) {
  return sortPlayers(players.filter((player) => player.position === position), measure)[0];
}

function playerById(playerId) {
  return fantasyPoolPreviewPlayerById.get(playerId) || players.find((player) => player.id === playerId);
}

function playerByOfficialFantasyId(officialFantasyPlayerId) {
  return fantasyPoolPreviewPlayerByOfficialId.get(String(officialFantasyPlayerId || "")) || null;
}

function captainChangeMatchdayIds() {
  return matchdayOptions
    .map((option) => option.matchday_id)
    .filter((matchdayId) => ["finalRound", "sf", "qf", "r16", "r32", "md1", "md2", "md3"].includes(matchdayId));
}

function defaultSingleMatchdayId() {
  const matchdayIds = captainChangeMatchdayIds();
  return matchdayIds.includes(defaultPublicMatchdayId)
    ? defaultPublicMatchdayId
    : matchdayIds[0] || defaultPublicMatchdayId;
}

function captainChangePlayerLabel(player) {
  return `${player.name} · ${player.position} · ${captainChangeCountryLabel(player)}`;
}

function captainChangeCountryLabel(player) {
  const country = playerCountryText(player);
  return country === "Needs check" ? "Unknown country" : country;
}

function decisionStrategyLabel(strategyKey) {
  if (strategyKey === "captain") {
    return "Captain Watchlist";
  }

  return pickModelOptions[strategyKey]?.label || titleFromSnake(strategyKey || "balanced");
}

function decisionStrategyOptionsHtml() {
  return decisionStrategyOptionKeys
    .map((strategyKey) => `<option value="${escapeHtml(strategyKey)}">${escapeHtml(decisionStrategyLabel(strategyKey))}</option>`)
    .join("");
}

function renderDecisionStrategyOptions() {
  const strategyHtml = decisionStrategyOptionsHtml();

  [captainChangeRiskSelect, substitutionAdvisorRiskSelect].filter(Boolean).forEach((select) => {
    const previousValue = select.value;
    select.innerHTML = strategyHtml;
    select.value = decisionStrategyOptionKeys.includes(previousValue) ? previousValue : "balanced";
  });
}

function decisionComparisonMode(select, modes) {
  const strategyKey = select?.value || "balanced";
  const selectedMode = modes[strategyKey];

  if (selectedMode) {
    return selectedMode;
  }

  const fallbackMode = modes.balanced;
  const strategyLabel = decisionStrategyLabel(strategyKey);

  return {
    ...fallbackMode,
    usesFallbackComparison: true,
    requestedStrategyLabel: strategyLabel
  };
}

function decisionSelectConfigFor(select) {
  if (select === captainChangeCurrentPlayerInput) {
    return {
      countrySelect: captainChangeCurrentCountrySelect,
      positionSelect: captainChangeCurrentPositionSelect,
      placeholder: "Choose current captain"
    };
  }

  if (select === captainChangeCandidateInput) {
    return {
      countrySelect: captainChangeCandidateCountrySelect,
      positionSelect: captainChangeCandidatePositionSelect,
      placeholder: "Choose possible new captain"
    };
  }

  if (select === substitutionAdvisorStarterInput) {
    return {
      countrySelect: substitutionAdvisorStarterCountrySelect,
      positionSelect: substitutionAdvisorStarterPositionSelect,
      placeholder: "Choose current starter"
    };
  }

  if (select === substitutionAdvisorBenchInput) {
    return {
      countrySelect: substitutionAdvisorBenchCountrySelect,
      positionSelect: substitutionAdvisorBenchPositionSelect,
      placeholder: "Choose possible substitute"
    };
  }

  return null;
}

function decisionPlayerSelects() {
  return [captainChangeCurrentPlayerInput, captainChangeCandidateInput, substitutionAdvisorStarterInput, substitutionAdvisorBenchInput]
    .filter(Boolean);
}

function decisionFilterSelects() {
  return [
    captainChangeCurrentCountrySelect,
    captainChangeCurrentPositionSelect,
    captainChangeCandidateCountrySelect,
    captainChangeCandidatePositionSelect,
    substitutionAdvisorStarterCountrySelect,
    substitutionAdvisorStarterPositionSelect,
    substitutionAdvisorBenchCountrySelect,
    substitutionAdvisorBenchPositionSelect
  ].filter(Boolean);
}

function decisionPlayerMatchesFilters(player, config) {
  const countryValue = config?.countrySelect?.value || "All";
  const positionValue = config?.positionSelect?.value || "All";

  return playerAllowedForActiveMatchday(player) &&
    (countryValue === "All" || captainChangeCountryLabel(player) === countryValue) &&
    (positionValue === "All" || player.position === positionValue);
}

function renderDecisionFilterOptions() {
  const decisionEligiblePlayers = players.filter((player) => playerAllowedForActiveMatchday(player));
  const countryOptions = [...new Set(decisionEligiblePlayers.map(captainChangeCountryLabel))]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
  const countryHtml = [
    `<option value="All">All countries</option>`,
    ...countryOptions.map((country) => `<option value="${escapeHtml(country)}">${escapeHtml(country)}</option>`)
  ].join("");
  const positionOptions = positionOrder.filter((position) =>
    decisionEligiblePlayers.some((player) => player.position === position)
  );
  const positionHtml = [
    `<option value="All">All positions</option>`,
    ...positionOptions.map((position) => `<option value="${escapeHtml(position)}">${escapeHtml(position)}</option>`)
  ].join("");

  [
    captainChangeCurrentCountrySelect,
    captainChangeCandidateCountrySelect,
    substitutionAdvisorStarterCountrySelect,
    substitutionAdvisorBenchCountrySelect
  ].filter(Boolean).forEach((select) => {
    const previousValue = select.value;
    select.innerHTML = countryHtml;
    select.value = countryOptions.includes(previousValue) ? previousValue : "All";
  });

  [
    captainChangeCurrentPositionSelect,
    captainChangeCandidatePositionSelect,
    substitutionAdvisorStarterPositionSelect,
    substitutionAdvisorBenchPositionSelect
  ].filter(Boolean).forEach((select) => {
    const previousValue = select.value;
    select.innerHTML = positionHtml;
    select.value = positionOptions.includes(previousValue) ? previousValue : "All";
  });
}

function renderDecisionPlayerSelect(select) {
  const config = decisionSelectConfigFor(select);

  if (!select || !config) {
    return;
  }

  const previousValue = select.value;
  const matchingPlayers = [...players]
    .filter((player) => decisionPlayerMatchesFilters(player, config))
    .sort((a, b) => a.name.localeCompare(b.name) || captainChangeCountryLabel(a).localeCompare(captainChangeCountryLabel(b)));

  if (!matchingPlayers.length) {
    select.innerHTML = `<option value="">No players match this country and position.</option>`;
    select.value = "";
    return;
  }

  select.innerHTML = [
    `<option value="">${escapeHtml(config.placeholder)}</option>`,
    ...matchingPlayers.map((player) => `<option value="${escapeHtml(player.id)}">${escapeHtml(captainChangePlayerLabel(player))}</option>`)
  ].join("");
  select.value = matchingPlayers.some((player) => player.id === previousValue) ? previousValue : "";
}

function renderDecisionPlayerSelects() {
  decisionPlayerSelects().forEach(renderDecisionPlayerSelect);
}

function refreshDecisionPlayerLookup() {
  captainChangePlayerLabelLookup.clear();
  players.forEach((player) => {
    captainChangePlayerLabelLookup.set(String(player.id).toLowerCase(), player);
    captainChangePlayerLabelLookup.set(captainChangePlayerLabel(player).toLowerCase(), player);
  });
}

function renderCaptainChangeOptions() {
  const matchdaySelects = [matchdayDecisionMatchdaySelect, captainChangeMatchdaySelect, substitutionAdvisorMatchdaySelect].filter(Boolean);

  if (!matchdaySelects.length && !decisionPlayerSelects().length) {
    return;
  }

  const matchdayIds = captainChangeMatchdayIds();
  const matchdayHtml = matchdayIds
    .map((matchdayId) => `<option value="${matchdayId}">${escapeHtml(matchdayLabelFromId(matchdayId))}</option>`)
    .join("");

  matchdaySelects.forEach((select) => {
    const previousValue = select.value;
    select.innerHTML = matchdayHtml;
    select.value = matchdayIds.includes(previousValue) ? previousValue : defaultSingleMatchdayId();
  });

  renderDecisionStrategyOptions();
  renderDecisionFilterOptions();
  refreshDecisionPlayerLookup();
  renderDecisionPlayerSelects();
}

function savedDecisionSquad() {
  const starters = [...currentRenderedTeam];
  const bench = [...currentBenchPlayers];
  const squad = [...starters, ...bench];
  const starterIds = new Set(starters.map((player) => player.id));
  const isFull = currentRenderMode === "built" &&
    starters.length === startingLineupTotal &&
    squad.length === squadTotalPlayers;

  return {
    starters,
    bench,
    squad,
    starterIds,
    isFull
  };
}

function fullBuiltSquadIsReady() {
  const squad = [...currentRenderedTeam, ...currentBenchPlayers];

  return currentRenderMode === "built" &&
    currentRenderedTeam.length === startingLineupTotal &&
    squad.length === squadTotalPlayers;
}

function browserSquadStorage() {
  try {
    return window.localStorage || null;
  } catch (error) {
    return null;
  }
}

function readBrowserSavedSquad() {
  const storage = browserSquadStorage();

  if (!storage) {
    return { payload: null, error: "Browser saving is not available in this browser." };
  }

  const jsonText = storage.getItem(browserSquadStorageKey);

  if (!jsonText) {
    return { payload: null, error: null };
  }

  try {
    return { payload: JSON.parse(jsonText), error: null };
  } catch (error) {
    return { payload: null, error: "Saved squad could not be read. Clear it and save again." };
  }
}

function browserSavedDateText(payload) {
  const savedAt = payload?.browser_saved_at || payload?.exported_at;

  if (!savedAt) {
    return "date needs check";
  }

  try {
    return new Date(savedAt).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  } catch (error) {
    return "date needs check";
  }
}

function renderBrowserSquadSaveStatus() {
  if (!browserSquadStatus) {
    return;
  }

  const canSave = fullBuiltSquadIsReady();
  const { payload, error } = readBrowserSavedSquad();
  const hasSavedSquad = payload?.schema_version === "team-export-v1";
  renderBuilderReadyActions(canSave, hasSavedSquad);

  if (saveBrowserSquadButton) {
    saveBrowserSquadButton.disabled = !canSave;
  }

  if (exportTeamJsonButton) {
    exportTeamJsonButton.disabled = !canSave;
  }

  if (loadBrowserSquadButton) {
    loadBrowserSquadButton.disabled = !hasSavedSquad;
  }

  if (clearBrowserSquadButton) {
    clearBrowserSquadButton.disabled = !hasSavedSquad;
  }

  if (error) {
    browserSquadStatus.textContent = error;
    return;
  }

  if (hasSavedSquad) {
    const captainText = payload.captain || payload.captain_player?.name || "captain needs check";
    browserSquadStatus.textContent = `Saved in this browser: ${payload.strategy || "strategy"} ${payload.formation || "squad"} from ${browserSavedDateText(payload)}. Captain: ${captainText}.`;
    return;
  }

  browserSquadStatus.textContent = canSave
    ? "No browser-saved squad yet. Save this squad here for quick Decision Tools access."
    : "Browser save is empty. Build a full squad, then save it here for quick Decision Tools access.";
}

function renderBuilderReadyActions(canSave = fullBuiltSquadIsReady(), hasSavedSquad = readBrowserSavedSquad().payload?.schema_version === "team-export-v1") {
  if (!builderReadyActions) {
    return;
  }

  builderReadyActions.classList.toggle("hidden", !canSave);
  builderReadyActions.setAttribute("aria-hidden", String(!canSave));

  builderReadyActions.querySelectorAll("[data-builder-ready-action]").forEach((button) => {
    button.disabled = !canSave;
  });

  if (!canSave || !builderReadySummary) {
    return;
  }

  const squad = [...currentRenderedTeam, ...currentBenchPlayers];
  const totalPrice = squadCost(squad);
  const savedText = hasSavedSquad ? "Saved squad found" : "Not saved yet";
  builderReadySummary.textContent = `${squad.length}/${squadTotalPlayers} players · ${tacticSelect.value || "formation"} · ${remainingBudgetText(totalPrice)} left · ${savedText}.`;
}

function handleBuilderReadyActionClick(event) {
  const actionButton = event.target.closest("[data-builder-ready-action]");

  if (!actionButton) {
    return;
  }

  if (actionButton.dataset.builderReadyAction === "save") {
    saveBrowserSquadButton?.click();
  }

  if (actionButton.dataset.builderReadyAction === "export") {
    exportTeamJsonButton?.click();
  }
}

function clearUserSquadSelections() {
  userCaptainId = null;
  userViceCaptainId = null;
  userBenchOrderIds = [];
}

function clearMatchdayDecisionInputs() {
  if (matchdayDecisionCaptainPointsInput) matchdayDecisionCaptainPointsInput.value = "";
  if (matchdayDecisionStarterPointsInput) matchdayDecisionStarterPointsInput.value = "";
  if (matchdayDecisionStarterSelect) matchdayDecisionStarterSelect.value = "";
  if (matchdayDecisionRiskSelect) matchdayDecisionRiskSelect.value = "balanced";
  if (matchdayDecisionMatchdaySelect) matchdayDecisionMatchdaySelect.value = defaultSingleMatchdayId();
}

function normalizeUserSquadSelections(starters = currentRenderedTeam, bench = currentBenchPlayers) {
  const starterIds = new Set(starters.map((player) => player.id));
  const benchIds = bench.map((player) => player.id);
  const benchIdSet = new Set(benchIds);

  if (!starterIds.has(userCaptainId)) {
    userCaptainId = null;
  }

  if (!starterIds.has(userViceCaptainId) || userViceCaptainId === userCaptainId) {
    userViceCaptainId = null;
  }

  if (userBenchOrderIds.length) {
    const orderedIds = userBenchOrderIds.filter((playerId) => benchIdSet.has(playerId));
    benchIds.forEach((playerId) => {
      if (!orderedIds.includes(playerId)) {
        orderedIds.push(playerId);
      }
    });
    userBenchOrderIds = orderedIds;
  }
}

function effectiveBenchOrderIds(bench = currentBenchPlayers) {
  const benchIds = bench.map((player) => player.id);
  const benchIdSet = new Set(benchIds);

  if (!userBenchOrderIds.length) {
    return benchIds;
  }

  const orderedIds = userBenchOrderIds.filter((playerId) => benchIdSet.has(playerId));
  benchIds.forEach((playerId) => {
    if (!orderedIds.includes(playerId)) {
      orderedIds.push(playerId);
    }
  });

  return orderedIds;
}

function benchOrderRank(playerId, bench = currentBenchPlayers) {
  const rank = effectiveBenchOrderIds(bench).indexOf(playerId);
  return rank >= 0 ? rank + 1 : null;
}

function userSelectionContextLabel(player, starterIds = new Set(currentRenderedTeam.map((starter) => starter.id))) {
  if (!player) {
    return "";
  }

  if (player.id === userCaptainId) {
    return "Captain";
  }

  if (player.id === userViceCaptainId) {
    return "Vice captain";
  }

  const benchRank = benchOrderRank(player.id);

  if (benchRank) {
    return `Bench ${benchRank}`;
  }

  return starterIds.has(player.id) ? "Starter" : "Bench";
}

function squadSelectionBadgeHtml(player, area) {
  if (area === "starter") {
    if (player.id === userCaptainId) {
      return `<span class="squad-selection-badge squad-selection-badge--captain">Captain</span>`;
    }

    if (player.id === userViceCaptainId) {
      return `<span class="squad-selection-badge squad-selection-badge--vice">Vice</span>`;
    }

    return "";
  }

  const rank = benchOrderRank(player.id);
  return rank
    ? `<span class="squad-selection-badge squad-selection-badge--bench">Bench ${rank}</span>`
    : "";
}

function starterSelectionControlsHtml(player) {
  const captainSelected = player.id === userCaptainId;
  const viceSelected = player.id === userViceCaptainId;

  return `
    <div class="squad-selection-controls" aria-label="Captain selection controls">
      <button class="squad-selection-button${captainSelected ? " is-active" : ""}" type="button" data-squad-role-action="captain" data-player-id="${escapeHtml(player.id)}" aria-label="Set ${escapeHtml(player.name)} as captain" title="Set captain" aria-pressed="${captainSelected}">C</button>
      <button class="squad-selection-button${viceSelected ? " is-active" : ""}" type="button" data-squad-role-action="vice" data-player-id="${escapeHtml(player.id)}" aria-label="Set ${escapeHtml(player.name)} as vice captain" title="Set vice captain" aria-pressed="${viceSelected}">VC</button>
    </div>
  `;
}

function benchSelectionControlsHtml(player) {
  const currentRank = benchOrderRank(player.id);
  const orderIds = effectiveBenchOrderIds();

  return `
    <div class="squad-selection-controls squad-selection-controls--bench" aria-label="Bench order controls">
      ${orderIds.map((_, index) => {
        const rank = index + 1;
        return `<button class="squad-selection-button${currentRank === rank ? " is-active" : ""}" type="button" data-squad-role-action="bench-order" data-player-id="${escapeHtml(player.id)}" data-bench-rank="${rank}" aria-label="Set ${escapeHtml(player.name)} as bench ${rank}" title="Set bench ${rank}" aria-pressed="${currentRank === rank}">B${rank}</button>`;
      }).join("")}
    </div>
  `;
}

function setUserCaptain(playerId) {
  const starterIds = new Set(currentRenderedTeam.map((player) => player.id));

  if (!starterIds.has(playerId)) {
    showBuilderWarning("Choose a starter as captain.");
    return false;
  }

  userCaptainId = userCaptainId === playerId ? null : playerId;

  if (userViceCaptainId === userCaptainId) {
    userViceCaptainId = null;
  }

  return true;
}

function setUserViceCaptain(playerId) {
  const starterIds = new Set(currentRenderedTeam.map((player) => player.id));

  if (!starterIds.has(playerId)) {
    showBuilderWarning("Choose a starter as vice captain.");
    return false;
  }

  if (playerId === userCaptainId) {
    showBuilderWarning("Captain and vice captain must be different players.");
    return false;
  }

  userViceCaptainId = userViceCaptainId === playerId ? null : playerId;

  return true;
}

function setUserBenchOrder(playerId, rank) {
  const benchIds = currentBenchPlayers.map((player) => player.id);

  if (!benchIds.includes(playerId)) {
    showBuilderWarning("Choose a bench player for bench order.");
    return false;
  }

  const orderedIds = effectiveBenchOrderIds();
  const nextRank = Math.min(Math.max(Number(rank) || 1, 1), orderedIds.length);
  const withoutPlayer = orderedIds.filter((id) => id !== playerId);
  withoutPlayer.splice(nextRank - 1, 0, playerId);

  if (withoutPlayer.join("|") === orderedIds.join("|")) {
    return false;
  }

  userBenchOrderIds = withoutPlayer;

  return true;
}

function handleSquadRoleAction(button) {
  const playerId = button.dataset.playerId;

  if (!playerId || currentRenderMode !== "built") {
    return;
  }

  let updated = false;

  if (button.dataset.squadRoleAction === "captain") {
    updated = setUserCaptain(playerId);
  } else if (button.dataset.squadRoleAction === "vice") {
    updated = setUserViceCaptain(playerId);
  } else if (button.dataset.squadRoleAction === "bench-order") {
    updated = setUserBenchOrder(playerId, button.dataset.benchRank);
  }

  if (!updated) {
    teamMessage.textContent = builderWarning.textContent || "No captain, vice, or bench order change was made.";
    return;
  }

  clearSavedDecisionExports();
  renderTeam(currentRenderedTeam, currentBenchPlayers, currentIgnoredLockedPlayers, currentRenderMode);
  renderSavedSquadDecisionPanels();
  teamMessage.textContent = "Updated captain, vice, or bench order selection. Rerun any manual advisor checks before exporting decisions.";
}

function savedDecisionSquadEmptyHtml(toolName) {
  return `
    <div class="decision-squad-heading">
      <div>
        <h3>Saved Squad Mode</h3>
        <p>Build or load a squad to unlock ${escapeHtml(toolName)} fields from your saved players. Manual search still works.</p>
      </div>
      <span class="decision-squad-tag">Manual</span>
    </div>
  `;
}

function decisionProjectionSummary(player, matchdayId, mode, scoreFunction, areaLabel) {
  const projection = projectionForMatchday(player, matchdayId);

  if (!projectionIsAvailable(projection)) {
    return {
      score: -Infinity,
      text: `${areaLabel} · ${player.position} · projection needs check`
    };
  }

  const startProbability = fieldNumber(projection, "start_probability_percent") ?? scoreValue(player, "start_probability_percent");
  const expectedMinutes = fieldNumber(projection, "expected_minutes_v0") ?? scoreValue(player, "expected_minutes_v0");
  const score = scoreFunction(projection, mode);

  return {
    score,
    text: `${areaLabel} · ${player.position} · vs ${projection.opponent} · ${displayNumber(score)} signal · ${displayNumber(startProbability)}% start · ${displayNumber(expectedMinutes)} min`
  };
}

function decisionSquadCard(player, summaryText, actionsHtml) {
  return `
    <article class="decision-squad-card">
      <strong>${escapeHtml(player.name)}</strong>
      <small>${escapeHtml(summaryText)}</small>
      ${actionsHtml}
    </article>
  `;
}

function renderCaptainSavedSquadPanel() {
  if (!captainChangeSquadPanel) {
    return;
  }

  const { squad, starterIds, isFull } = savedDecisionSquad();

  if (!isFull) {
    captainChangeSquadPanel.className = "decision-squad-panel decision-squad-panel--empty";
    captainChangeSquadPanel.innerHTML = savedDecisionSquadEmptyHtml("captain switch");
    return;
  }

  const matchdayId = captainChangeMatchdaySelect?.value || defaultSingleMatchdayId();
  const mode = captainChangeMode();
  const rows = squad
    .map((player) => {
      const contextLabel = userSelectionContextLabel(player, starterIds);
      const areaLabel = starterIds.has(player.id)
        ? contextLabel
        : `${contextLabel} option`;
      const summary = decisionProjectionSummary(player, matchdayId, mode, captainChangeProjectionScore, areaLabel);
      return { player, summary };
    })
    .sort((a, b) => b.summary.score - a.summary.score || a.player.name.localeCompare(b.player.name));

  captainChangeSquadPanel.className = "decision-squad-panel";
  captainChangeSquadPanel.innerHTML = `
    <div class="decision-squad-heading">
      <div>
        <h3>Saved Squad Captain Options</h3>
        <p>Use these buttons to fill the current captain or new captain fields from the Team Builder squad. Still confirm the new captain has not played.</p>
      </div>
      <span class="decision-squad-tag">${squad.length} players</span>
    </div>
    <div class="decision-squad-grid">
      ${rows.map(({ player, summary }) => decisionSquadCard(player, summary.text, `
        <div class="decision-squad-actions">
          <button class="decision-squad-button" type="button" data-captain-fill="current" data-player-id="${escapeHtml(player.id)}">Current</button>
          <button class="decision-squad-button" type="button" data-captain-fill="candidate" data-player-id="${escapeHtml(player.id)}">New</button>
        </div>
      `)).join("")}
    </div>
  `;
}

function renderSubstitutionSavedSquadPanel() {
  if (!substitutionAdvisorSquadPanel) {
    return;
  }

  const { starters, bench, isFull } = savedDecisionSquad();

  if (!isFull) {
    substitutionAdvisorSquadPanel.className = "decision-squad-panel decision-squad-panel--empty";
    substitutionAdvisorSquadPanel.innerHTML = savedDecisionSquadEmptyHtml("substitution");
    return;
  }

  const matchdayId = substitutionAdvisorMatchdaySelect?.value || defaultSingleMatchdayId();
  const mode = substitutionAdvisorMode();
  const starterCards = starters.map((player) => {
    const summary = decisionProjectionSummary(
      player,
      matchdayId,
      mode,
      substitutionAdvisorProjectionScore,
      userSelectionContextLabel(player, new Set(starters.map((starter) => starter.id)))
    );
    return decisionSquadCard(player, summary.text, `
      <div class="decision-squad-actions decision-squad-actions--single">
        <button class="decision-squad-button" type="button" data-substitution-fill="starter" data-player-id="${escapeHtml(player.id)}">Played starter</button>
      </div>
    `);
  });
  const benchCards = bench
    .map((player) => {
      const summary = decisionProjectionSummary(player, matchdayId, mode, substitutionAdvisorProjectionScore, userSelectionContextLabel(player));
      return { player, summary };
    })
    .sort((a, b) =>
      value(benchOrderRank(a.player.id)) - value(benchOrderRank(b.player.id)) ||
      b.summary.score - a.summary.score ||
      a.player.name.localeCompare(b.player.name)
    )
    .map(({ player, summary }) => decisionSquadCard(player, summary.text, `
      <div class="decision-squad-actions decision-squad-actions--single">
        <button class="decision-squad-button" type="button" data-substitution-fill="bench" data-player-id="${escapeHtml(player.id)}">Bench option</button>
      </div>
    `));

  substitutionAdvisorSquadPanel.className = "decision-squad-panel";
  substitutionAdvisorSquadPanel.innerHTML = `
    <div class="decision-squad-heading">
      <div>
        <h3>Saved Squad Substitution Options</h3>
        <p>Use the starter and bench buttons from the Team Builder squad. Still confirm the bench player has not played and the final formation is legal.</p>
      </div>
      <span class="decision-squad-tag">${starters.length} + ${bench.length}</span>
    </div>
    <div class="decision-squad-group">
      <h4>Played starter</h4>
      <div class="decision-squad-grid">${starterCards.join("")}</div>
    </div>
    <div class="decision-squad-group">
      <h4>Bench candidate</h4>
      <div class="decision-squad-grid">${benchCards.join("")}</div>
    </div>
  `;
}

function renderSavedSquadAdvisorPanels() {
  renderCaptainSavedSquadPanel();
  renderSubstitutionSavedSquadPanel();
}

function matchdayDecisionRiskStyle() {
  return matchdayDecisionRiskSelect?.value || "balanced";
}

function matchdayDecisionCaptainMode() {
  return captainChangeRiskModes[matchdayDecisionRiskStyle()] || captainChangeRiskModes.balanced;
}

function matchdayDecisionSubstitutionMode() {
  return substitutionAdvisorRiskModes[matchdayDecisionRiskStyle()] || substitutionAdvisorRiskModes.balanced;
}

function matchdayDecisionPoints(input) {
  const rawValue = String(input?.value ?? "").trim();
  const parsed = Number(rawValue);

  return {
    rawValue,
    value: Number.isFinite(parsed) && parsed >= 0 ? parsed : null,
    isValid: Boolean(rawValue) && Number.isFinite(parsed) && parsed >= 0
  };
}

function renderMatchdayDecisionStarterOptions(starters = []) {
  if (!matchdayDecisionStarterSelect) {
    return;
  }

  const previousValue = matchdayDecisionStarterSelect.value;
  matchdayDecisionStarterSelect.innerHTML = `
    <option value="">Choose played starter</option>
    ${starters.map((player) => `
      <option value="${escapeHtml(player.id)}">${escapeHtml(player.name)} · ${escapeHtml(userSelectionContextLabel(player, new Set(starters.map((starter) => starter.id))))} · ${escapeHtml(player.position)}</option>
    `).join("")}
  `;
  matchdayDecisionStarterSelect.value = starters.some((player) => player.id === previousValue)
    ? previousValue
    : "";
}

function matchdayDecisionEmptyHtml() {
  const { payload } = readBrowserSavedSquad();
  const hasSavedSquad = payload?.schema_version === "team-export-v1";

  return `
    <div class="matchday-decision-empty matchday-decision-empty--action">
      <div>
        <strong>Build or load a squad to unlock captain and bench checks.</strong>
        <p>The desk will then use your captain, vice captain, bench order, and matchday view to organize decisions.</p>
      </div>
      <div class="matchday-desk-actions">
        <a class="matchday-desk-button matchday-desk-button--primary" href="#team-builder">${escapeHtml(builderActionLabel())}</a>
        <button class="matchday-desk-button" type="button" data-matchday-desk-action="load-saved-squad" ${hasSavedSquad ? "" : "disabled"}>Load Saved Squad</button>
      </div>
    </div>
  `;
}

function matchdayLiveSupportHtml(matchdayId, squad) {
  if (!liveMatchdayStatusData && !livePlayerStatusData) {
    return "";
  }

  const roundId = liveRoundIdFromMatchdayId(matchdayId);
  const round = roundId ? liveRoundLookup.get(roundId) : null;
  const fixtures = liveFixturesForMatchdayId(matchdayId);
  const completedCount = fixtures.filter((fixture) => ["complete", "completed", "played"].includes(String(fixture.fixture_status || "").toLowerCase())).length;
  const playingCount = fixtures.filter((fixture) => String(fixture.fixture_status || "").toLowerCase() === "playing").length;
  const scheduledCount = fixtures.filter((fixture) => String(fixture.fixture_status || "").toLowerCase() === "scheduled").length;
  const updateDecision = liveMatchdayStatusData?.update_decision?.primary_recommendation ||
    livePlayerStatusData?.update_decision?.primary_recommendation ||
    "display_only_refresh";
  const livePlayerSummaries = squad.map((player) => ({
    player,
    summary: livePlayerSummaryForMatchday(player, matchdayId)
  }));
  const squadPlayersWithRoundPoints = livePlayerSummaries.filter((row) => row.summary.hasRoundPoints);
  const squadPlayersWithMatchStatus = livePlayerSummaries.filter((row) => row.summary.matchStatus);
  const liveRowsToShow = livePlayerSummaries
    .filter((row) => row.summary.hasUsefulData)
    .slice(0, 6);
  const fixtureRowsToShow = fixtures
    .filter((fixture) => isSafeMappedFinalFixture(fixture))
    .slice(0, 4);
  const fixtureStatusDetail = fixtures.length
    ? `${completedCount} complete · ${playingCount} live · ${scheduledCount} scheduled`
    : "No fixtures in this static round";

  return `
    <section class="matchday-live-support" aria-label="Official live matchday support">
      <div class="matchday-live-support__heading">
        <div>
          <h3>Official Live Support</h3>
          <p>${escapeHtml(liveMatchdayStatusData?.source_checked || livePlayerStatusData?.source_checked || "Static live file")}</p>
        </div>
        <span>${escapeHtml(titleFromSnake(updateDecision))}</span>
      </div>
      <div class="matchday-squad-status__grid">
        ${matchdayDecisionSummaryCard("Round status", round ? titleFromSnake(round.status || "status pending") : "No round row", fixtureStatusDetail)}
        ${matchdayDecisionSummaryCard("Squad points", `${squadPlayersWithRoundPoints.length}/${squad.length}`, "official round points")}
        ${matchdayDecisionSummaryCard("matchStatus", `${squadPlayersWithMatchStatus.length}/${squad.length}`, "start/sub/not in squad")}
        ${matchdayDecisionSummaryCard("Model rerun", liveMatchdayStatusData?.update_decision?.model_rerun_needed_now ? "Review needed" : "Not from live file", "display/support layer")}
      </div>
      ${liveRowsToShow.length ? `
        <div class="matchday-live-player-list">
          ${liveRowsToShow.map(({ player, summary }) => `
            <article>
              <strong>${escapeHtml(player.name)}</strong>
              <span>${escapeHtml(summary.valueText)}</span>
              ${summary.detailText ? `<small>${escapeHtml(summary.detailText)}</small>` : ""}
            </article>
          `).join("")}
        </div>
      ` : `
        <div class="matchday-live-empty">No saved-squad player points or matchStatus rows yet for ${escapeHtml(matchdayLabelFromId(matchdayId))}.</div>
      `}
      ${fixtureRowsToShow.length ? `
        <div class="matchday-live-fixture-list">
          ${fixtureRowsToShow.map((fixture) => `
            <span>${escapeHtml([liveFixtureScoreText(fixture), liveFixtureStatusLabel(fixture)].filter(Boolean).join(" · "))}</span>
          `).join("")}
        </div>
      ` : ""}
    </section>
  `;
}

function matchdayLivePlayerNoteHtml(player, matchdayId) {
  const summary = livePlayerSummaryForMatchday(player, matchdayId);

  if (!summary.hasUsefulData) {
    return "";
  }

  return `
    <div class="matchday-live-player-note">
      <span>Official live</span>
      <strong>${escapeHtml(summary.valueText)}</strong>
      ${summary.detailText ? `<small>${escapeHtml(summary.detailText)}</small>` : ""}
    </div>
  `;
}

function matchdayDecisionManualChecksHtml() {
  return `
    <div class="matchday-decision-checks">
      <span>Actual points required</span>
      <span>Confirm unplayed players</span>
      <span>Check official deadlines</span>
      <span>Check formation legality</span>
    </div>
  `;
}

function matchdayDecisionSquadStatusHtml({
  starters,
  bench,
  currentCaptain,
  currentViceCaptain,
  benchOrderText,
  matchdayId,
  strategyLabel,
  captainPoints,
  playedStarter,
  starterPoints
}) {
  const formationText = tacticSelect?.value || "Formation";
  const nextAction = !userCaptainId
    ? "Mark your captain in Team Builder."
    : !userViceCaptainId
      ? "Optional: mark your vice captain."
      : !userBenchOrderIds.length && bench.length
        ? "Confirm bench order if you want manual control."
        : !captainPoints.isValid
          ? "Enter captain points after he plays."
          : !playedStarter
            ? "Choose a played starter for bench checks."
            : !starterPoints.isValid
              ? "Enter that starter's points."
              : "Use a fill button for the detailed checks.";

  return `
    <section class="matchday-squad-status" aria-label="Saved squad status">
      <div class="matchday-squad-status__heading">
        <div>
          <span>Saved squad status</span>
          <strong>${starters.length + bench.length}/${squadTotalPlayers} players ready</strong>
        </div>
        <span>${escapeHtml(matchdayLabelFromId(matchdayId))} · ${escapeHtml(strategyLabel)} · ${escapeHtml(formationText)}</span>
      </div>
      <div class="matchday-squad-status__grid">
        ${matchdayDecisionSummaryCard("Captain", currentCaptain?.name || "Needs captain", userCaptainId ? "user selected" : "model fallback")}
        ${matchdayDecisionSummaryCard("Vice captain", currentViceCaptain?.name || "Needs vice", userViceCaptainId ? "user selected" : "model fallback")}
        ${matchdayDecisionSummaryCard("Bench order", benchOrderText || "Needs bench", userBenchOrderIds.length ? "user selected" : "builder default")}
        ${matchdayDecisionSummaryCard("Next action", nextAction, "manual matchday checks")}
      </div>
    </section>
  `;
}

function matchdayDeskActionCardHtml({ title, detail, status, action, primary = false, disabled = false }) {
  return `
    <article class="matchday-desk-card">
      <div>
        <span>${escapeHtml(status)}</span>
        <strong>${escapeHtml(title)}</strong>
        <p>${escapeHtml(detail)}</p>
      </div>
      <button class="matchday-desk-button ${primary ? "matchday-desk-button--primary" : ""}" type="button" data-matchday-desk-action="${escapeHtml(action)}" ${disabled ? "disabled" : ""}>Open</button>
    </article>
  `;
}

function matchdayDeskActionPanelHtml({
  currentCaptain,
  currentViceCaptain,
  bench,
  captainPoints,
  playedStarter,
  starterPoints,
  captainRows,
  benchRows
}) {
  const captainDetail = captainPoints.isValid
    ? `Compare ${currentCaptain?.name || "your captain"} against the best unplayed captain options.`
    : `Enter captain points for ${currentCaptain?.name || "your captain"}, then compare replacement options.`;
  const benchDetail = playedStarter && starterPoints.isValid
    ? `Compare ${playedStarter.name} against your bench order.`
    : "Choose a played starter and points, then compare bench options.";
  const timelineDetail = bench.length
    ? "See your starters and bench grouped by matchday kickoff."
    : "Build a full squad to see your kickoff order.";
  const captainStatus = !currentCaptain
    ? "needs captain"
    : captainPoints.isValid && captainRows.some((row) => row.verdict.className === "switch")
      ? "switch candidate"
      : captainPoints.isValid
        ? "ready"
        : "points needed";
  const benchStatus = !bench.length
    ? "needs bench"
    : playedStarter && starterPoints.isValid && benchRows.some((row) => row.verdict.className === "switch")
      ? "sub candidate"
      : playedStarter && starterPoints.isValid
        ? "ready"
        : "points needed";
  const selectionDetail = !userCaptainId
    ? "Mark captain"
    : !userViceCaptainId
      ? "Vice optional"
      : !userBenchOrderIds.length && bench.length
        ? "Bench default"
        : "Selections ready";

  return `
    <section class="matchday-desk-action-panel" aria-label="Matchday Desk actions">
      <div class="matchday-desk-action-panel__heading">
        <div>
          <h3>Matchday Actions</h3>
          <p>${escapeHtml(selectionDetail)}. Use these shortcuts for the repeat checks you are most likely to run.</p>
        </div>
        <a class="matchday-desk-button" href="#team-builder">Edit Squad</a>
      </div>
      <div class="matchday-desk-card-grid">
        ${matchdayDeskActionCardHtml({
          title: "Captain Switch Check",
          detail: captainDetail,
          status: captainStatus,
          action: "captain-check",
          primary: !captainPoints.isValid || captainRows.some((row) => ["switch", "close"].includes(row.verdict.className))
        })}
        ${matchdayDeskActionCardHtml({
          title: "Bench Switch Check",
          detail: benchDetail,
          status: benchStatus,
          action: "bench-check",
          primary: Boolean(playedStarter && starterPoints.isValid && benchRows.some((row) => ["switch", "close"].includes(row.verdict.className)))
        })}
        ${matchdayDeskActionCardHtml({
          title: "My Matchday Timeline",
          detail: timelineDetail,
          status: "timeline",
          action: "timeline",
          disabled: !bench.length
        })}
      </div>
    </section>
  `;
}

function matchdayDecisionSummaryCard(label, valueText, detailText = "") {
  return `
    <article class="matchday-decision-summary-card">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(valueText)}</strong>
      ${detailText ? `<small>${escapeHtml(detailText)}</small>` : ""}
    </article>
  `;
}

function matchdayDecisionMetric(label, valueText, detailText = "") {
  return `
    <span>
      ${escapeHtml(label)}
      <strong>${escapeHtml(valueText)}</strong>
      ${detailText ? `<small>${escapeHtml(detailText)}</small>` : ""}
    </span>
  `;
}

function matchdayDecisionWarningHtml(warnings) {
  if (!warnings.length) {
    return `<div class="matchday-decision-warnings"><span>No major model warning. Still confirm played/unplayed state manually.</span></div>`;
  }

  return `<div class="matchday-decision-warnings">${warnings.slice(0, 4).map((warning) => `<span>${escapeHtml(warning)}</span>`).join("")}</div>`;
}

function matchdayDecisionCaptainVerdict(candidate, projection, score, currentCaptain, captainPoints, mode, matchdayId) {
  if (!projectionIsAvailable(projection)) {
    return {
      label: "Needs projection",
      className: "review",
      detail: projection?.reason || "No matchday projection is available for this captain option.",
      edge: null,
      threshold: null,
      warnings: [projection?.reason || "No matchday projection is available for this captain option."]
    };
  }

  const warnings = captainChangeWarnings(candidate, projection, matchdayId, currentCaptain);

  if (!captainPoints.isValid) {
    return {
      label: "Enter captain points",
      className: "review",
      detail: "Enter actual points after your current captain plays, then compare one unplayed option.",
      edge: null,
      threshold: null,
      warnings
    };
  }

  const threshold = captainPoints.value + mode.switchBuffer;
  const edge = score - captainPoints.value;
  const highScoreDetail = captainPoints.value >= 12
    ? "12+ captain points is an excellent score before the double; keep unless you are making a deliberate high-risk chase."
    : captainPoints.value >= 8
      ? "8+ captain points is strong; switching needs a clear edge."
      : "";

  if (score >= threshold) {
    return {
      label: "Switch check",
      className: "switch",
      detail: `${candidate.name} clears the ${displayNumber(threshold)} switch threshold. Confirm they are unplayed before acting. ${highScoreDetail}`.trim(),
      edge,
      threshold,
      warnings
    };
  }

  if (score >= captainPoints.value - mode.closeMargin) {
    return {
      label: "Close call",
      className: "close",
      detail: `${candidate.name} is close, but does not clearly beat the ${mode.label.toLowerCase()} switch threshold. ${highScoreDetail}`.trim(),
      edge,
      threshold,
      warnings
    };
  }

  return {
    label: "Keep captain",
    className: "keep",
      detail: `${candidate.name} does not beat the current captain score enough for this strategy. ${highScoreDetail}`.trim(),
    edge,
    threshold,
    warnings
  };
}

function matchdayDecisionSubstitutionVerdict(starter, benchPlayer, projection, score, starterPoints, mode, matchdayId) {
  if (!projectionIsAvailable(projection)) {
    return {
      label: "Needs projection",
      className: "review",
      detail: projection?.reason || "No matchday projection is available for this bench option.",
      edge: null,
      threshold: null,
      warnings: [projection?.reason || "No matchday projection is available for this bench option."]
    };
  }

  if (!starter) {
    return {
      label: "Choose starter",
      className: "review",
      detail: "Choose the played starter before deciding whether a bench player is worth subbing in.",
      edge: null,
      threshold: null,
      warnings: []
    };
  }

  const warnings = starterPoints.isValid
    ? substitutionAdvisorWarnings(starter, benchPlayer, projection, matchdayId, starterPoints.value)
    : [];

  if (!starterPoints.isValid) {
    return {
      label: "Enter starter points",
      className: "review",
      detail: "Enter actual points after the starter plays, then compare one unplayed bench option.",
      edge: null,
      threshold: null,
      warnings
    };
  }

  const threshold = starterPoints.value + mode.subBuffer;
  const edge = score - starterPoints.value;
  const strongScoreDetail = starterPoints.value >= 8
    ? "8+ starter points is strong; subbing should need a very clear edge."
    : starterPoints.value >= 6
      ? "6+ starter points is useful; subbing needs a clear edge."
      : "";

  if (starter.id === benchPlayer.id) {
    return {
      label: "Needs check",
      className: "review",
      detail: "Starter and bench player cannot be the same player.",
      edge,
      threshold,
      warnings
    };
  }

  if (score >= threshold) {
    return {
      label: "Sub check",
      className: "switch",
      detail: `${benchPlayer.name} clears the ${displayNumber(threshold)} substitution threshold. Confirm they are unplayed and the final formation is legal. ${strongScoreDetail}`.trim(),
      edge,
      threshold,
      warnings
    };
  }

  if (score >= starterPoints.value - mode.closeMargin) {
    return {
      label: "Close call",
      className: "close",
      detail: `${benchPlayer.name} is close, but does not clearly beat the ${mode.label.toLowerCase()} substitution threshold. ${strongScoreDetail}`.trim(),
      edge,
      threshold,
      warnings
    };
  }

  return {
    label: "Keep starter",
    className: "keep",
      detail: `${benchPlayer.name} does not beat the starter score enough for this strategy. ${strongScoreDetail}`.trim(),
    edge,
    threshold,
    warnings
  };
}

function matchdayDecisionCaptainRows(squad, currentCaptain, matchdayId, mode, captainPoints) {
  const candidatePool = squad.filter((player) =>
    player.id !== currentCaptain?.id &&
    player.position !== "Goalkeeper"
  );
  const fallbackPool = squad.filter((player) => player.id !== currentCaptain?.id);
  const candidates = candidatePool.length ? candidatePool : fallbackPool;

  return candidates
    .map((player) => {
      const projection = projectionForMatchday(player, matchdayId);
      const score = projectionIsAvailable(projection) ? captainChangeProjectionScore(projection, mode) : -Infinity;
      const verdict = matchdayDecisionCaptainVerdict(player, projection, score, currentCaptain, captainPoints, mode, matchdayId);
      return { player, projection, score, verdict };
    })
    .sort((a, b) =>
      value(b.score) - value(a.score) ||
      a.player.name.localeCompare(b.player.name)
    );
}

function matchdayDecisionBenchRows(bench, starter, matchdayId, mode, starterPoints) {
  return effectiveBenchOrderIds(bench)
    .map(playerById)
    .filter(Boolean)
    .map((player) => {
      const projection = projectionForMatchday(player, matchdayId);
      const score = projectionIsAvailable(projection) ? substitutionAdvisorProjectionScore(projection, mode) : -Infinity;
      const verdict = matchdayDecisionSubstitutionVerdict(starter, player, projection, score, starterPoints, mode, matchdayId);
      return { player, projection, score, verdict, rank: benchOrderRank(player.id, bench) };
    });
}

function renderMatchdayDecisionCaptainCard(row, currentCaptain, captainPoints, mode, matchdayId = defaultSingleMatchdayId()) {
  const hasProjection = projectionIsAvailable(row.projection);
  const startProbability = hasProjection
    ? fieldNumber(row.projection, "start_probability_percent") ?? scoreValue(row.player, "start_probability_percent")
    : null;
  const expectedMinutes = hasProjection
    ? fieldNumber(row.projection, "expected_minutes_v0") ?? scoreValue(row.player, "expected_minutes_v0")
    : null;
  const edgeText = row.verdict.edge === null ? "Needs points" : `${displayNumber(row.verdict.edge)} edge`;
  const thresholdText = row.verdict.threshold === null ? mode.label : `threshold ${displayNumber(row.verdict.threshold)}`;
  const livePlayerNote = matchdayLivePlayerNoteHtml(row.player, matchdayId);

  return `
    <article class="matchday-decision-card matchday-decision-card--${row.verdict.className}">
      <div class="matchday-decision-card__top">
        <div>
          <strong>${escapeHtml(row.player.name)}</strong>
          <small>${escapeHtml(userSelectionContextLabel(row.player))} · ${escapeHtml(playerCountryText(row.player))} · vs ${escapeHtml(hasProjection ? row.projection.opponent : "projection needs check")}</small>
        </div>
        <span>${escapeHtml(row.verdict.label)}</span>
      </div>
      <p>${escapeHtml(row.verdict.detail)}</p>
      <div class="matchday-decision-metrics">
        ${matchdayDecisionMetric("Captain signal", row.score === -Infinity ? "N/A" : displayNumber(row.score), edgeText)}
        ${matchdayDecisionMetric("Strategy", mode.label, thresholdText)}
        ${matchdayDecisionMetric("Start", startProbability === null ? "N/A" : `${displayNumber(startProbability)}%`, expectedMinutes === null ? "minutes N/A" : `${displayNumber(expectedMinutes)} min`)}
      </div>
      ${livePlayerNote}
      ${matchdayDecisionWarningHtml(row.verdict.warnings)}
      <button class="matchday-decision-button" type="button" data-decision-center-action="captain-fill" data-player-id="${escapeHtml(row.player.id)}" ${currentCaptain ? "" : "disabled"}>${captainPoints.isValid ? "Fill Captain Check" : "Fill Captain Fields"}</button>
    </article>
  `;
}

function renderMatchdayDecisionBenchCard(row, starter, starterPoints, mode, matchdayId = defaultSingleMatchdayId()) {
  const hasProjection = projectionIsAvailable(row.projection);
  const startProbability = hasProjection
    ? fieldNumber(row.projection, "start_probability_percent") ?? scoreValue(row.player, "start_probability_percent")
    : null;
  const expectedMinutes = hasProjection
    ? fieldNumber(row.projection, "expected_minutes_v0") ?? scoreValue(row.player, "expected_minutes_v0")
    : null;
  const edgeText = row.verdict.edge === null ? "Needs points" : `${displayNumber(row.verdict.edge)} edge`;
  const thresholdText = row.verdict.threshold === null ? mode.label : `threshold ${displayNumber(row.verdict.threshold)}`;
  const livePlayerNote = matchdayLivePlayerNoteHtml(row.player, matchdayId);

  return `
    <article class="matchday-decision-card matchday-decision-card--${row.verdict.className}">
      <div class="matchday-decision-card__top">
        <div>
          <strong>${escapeHtml(row.player.name)}</strong>
          <small>Bench ${row.rank || "?"} · ${escapeHtml(playerCountryText(row.player))} · ${escapeHtml(row.player.position)} · vs ${escapeHtml(hasProjection ? row.projection.opponent : "projection needs check")}</small>
        </div>
        <span>${escapeHtml(row.verdict.label)}</span>
      </div>
      <p>${escapeHtml(row.verdict.detail)}</p>
      <div class="matchday-decision-metrics">
        ${matchdayDecisionMetric("Sub signal", row.score === -Infinity ? "N/A" : displayNumber(row.score), edgeText)}
        ${matchdayDecisionMetric("Strategy", mode.label, thresholdText)}
        ${matchdayDecisionMetric("Start", startProbability === null ? "N/A" : `${displayNumber(startProbability)}%`, expectedMinutes === null ? "minutes N/A" : `${displayNumber(expectedMinutes)} min`)}
      </div>
      ${livePlayerNote}
      ${matchdayDecisionWarningHtml(row.verdict.warnings)}
      <button class="matchday-decision-button" type="button" data-decision-center-action="sub-fill" data-player-id="${escapeHtml(row.player.id)}" ${starter ? "" : "disabled"}>${starterPoints.isValid ? "Fill Sub Check" : "Fill Sub Fields"}</button>
    </article>
  `;
}

function renderMatchdayDecisionCenter() {
  if (!matchdayDecisionCenterContent) {
    return;
  }

  const { starters, bench, squad, isFull } = savedDecisionSquad();
  const matchdayId = matchdayDecisionMatchdaySelect?.value || defaultSingleMatchdayId();
  const warningHtml = modelDataWarningHtml(activeDataWarningsForSection("matchday_desk", { matchdayId }), {
    title: "Matchday Desk"
  });
  renderMatchdayDecisionStarterOptions(starters);

  if (!isFull) {
    matchdayDecisionCenterContent.innerHTML = `${warningHtml}${matchdayDecisionEmptyHtml()}`;
    return;
  }

  const captainMode = matchdayDecisionCaptainMode();
  const substitutionMode = matchdayDecisionSubstitutionMode();
  const captainPoints = matchdayDecisionPoints(matchdayDecisionCaptainPointsInput);
  const starterPoints = matchdayDecisionPoints(matchdayDecisionStarterPointsInput);
  const currentCaptain = starters.find((player) => player.id === userCaptainId) || modelCaptainPlayer(starters);
  const currentViceCaptain = starters.find((player) => player.id === userViceCaptainId) || exportViceCaptainPlayer(starters, currentCaptain);
  const playedStarter = starters.find((player) => player.id === matchdayDecisionStarterSelect?.value) || null;
  const captainRows = matchdayDecisionCaptainRows(squad, currentCaptain, matchdayId, captainMode, captainPoints);
  const benchRows = matchdayDecisionBenchRows(bench, playedStarter, matchdayId, substitutionMode, starterPoints);
  const captainRowsToShow = captainRows.slice(0, 3);
  const benchRowsToShow = benchRows;
  const bestCaptain = captainRowsToShow[0];
  const firstActionableBench = benchRows.find((row) => ["switch", "close"].includes(row.verdict.className)) || benchRows[0];
  const benchOrderText = benchRows.map((row) => `B${row.rank}: ${row.player.name}`).join(" · ");

  matchdayDecisionCenterContent.innerHTML = `
    ${warningHtml}
    ${matchdayDeskActionPanelHtml({
      currentCaptain,
      currentViceCaptain,
      bench,
      captainPoints,
      playedStarter,
      starterPoints,
      captainRows,
      benchRows
    })}
    ${matchdayDecisionSquadStatusHtml({
      starters,
      bench,
      currentCaptain,
      currentViceCaptain,
      benchOrderText,
      matchdayId,
      strategyLabel: captainMode.label,
      captainPoints,
      playedStarter,
      starterPoints
    })}
    ${matchdayLiveSupportHtml(matchdayId, squad)}
    ${matchdayDecisionManualChecksHtml()}
    <section class="matchday-decision-block">
      <div class="matchday-decision-block__heading">
        <div>
          <h3>Captain switch</h3>
          <p>${bestCaptain ? escapeHtml(bestCaptain.verdict.detail) : "No captain candidates available."}</p>
        </div>
        <span>${captainPoints.isValid ? `${displayNumber(captainPoints.value)} captain points` : "points needed"}</span>
      </div>
      <div class="matchday-decision-grid">
        ${captainRowsToShow.map((row) => renderMatchdayDecisionCaptainCard(row, currentCaptain, captainPoints, captainMode, matchdayId)).join("")}
      </div>
    </section>
    <section class="matchday-decision-block">
      <div class="matchday-decision-block__heading">
        <div>
          <h3>Bench check</h3>
          <p>${firstActionableBench ? escapeHtml(firstActionableBench.verdict.detail) : "Bench order is available after a full squad build."}</p>
        </div>
        <span>${playedStarter ? escapeHtml(playedStarter.name) : "choose starter"}</span>
      </div>
      <div class="matchday-decision-grid matchday-decision-grid--bench">
        ${benchRowsToShow.map((row) => renderMatchdayDecisionBenchCard(row, playedStarter, starterPoints, substitutionMode, matchdayId)).join("")}
      </div>
    </section>
  `;
}

function renderSavedSquadDecisionPanels() {
  renderMatchdayDecisionCenter();
  renderSavedSquadAdvisorPanels();
  renderSavedSquadTimeline();
}

function setAdvisorRiskStyle(select, riskStyle) {
  if (!select) {
    return;
  }

  if (select.querySelector(`option[value="${riskStyle}"]`)) {
    select.value = riskStyle;
    return;
  }

  if (riskStyle === "safer" && select.querySelector('option[value="safe"]')) {
    select.value = "safe";
  }
}

function setDecisionPlayerInput(input, player) {
  if (!input || !player) {
    return;
  }

  const config = decisionSelectConfigFor(input);
  if (config) {
    if (config.countrySelect) {
      config.countrySelect.value = captainChangeCountryLabel(player);
    }

    if (config.positionSelect) {
      config.positionSelect.value = player.position;
    }

    renderDecisionPlayerSelect(input);
    input.value = player.id;
    return;
  }

  input.value = captainChangePlayerLabel(player);
}

function handleCaptainSavedSquadClick(event) {
  const button = event.target.closest("[data-captain-fill][data-player-id]");

  if (!button) {
    return;
  }

  const player = playerById(button.dataset.playerId);

  if (!player) {
    return;
  }

  if (button.dataset.captainFill === "current") {
    setDecisionPlayerInput(captainChangeCurrentPlayerInput, player);
  } else {
    setDecisionPlayerInput(captainChangeCandidateInput, player);
  }

  renderCaptainChangeAdvisor();
}

function handleSubstitutionSavedSquadClick(event) {
  const button = event.target.closest("[data-substitution-fill][data-player-id]");

  if (!button) {
    return;
  }

  const player = playerById(button.dataset.playerId);

  if (!player) {
    return;
  }

  if (button.dataset.substitutionFill === "starter") {
    setDecisionPlayerInput(substitutionAdvisorStarterInput, player);
  } else {
    setDecisionPlayerInput(substitutionAdvisorBenchInput, player);
  }

  renderSubstitutionAdvisor();
}

function renderSavedSquadTimelineOptions() {
  if (!savedSquadTimelineMatchdaySelect) {
    return;
  }

  const matchdayIds = captainChangeMatchdayIds();
  const previousValue = savedSquadTimelineMatchdaySelect.value;
  savedSquadTimelineMatchdaySelect.innerHTML = matchdayIds
    .map((matchdayId) => `<option value="${matchdayId}">${escapeHtml(matchdayLabelFromId(matchdayId))}</option>`)
    .join("");
  savedSquadTimelineMatchdaySelect.value = matchdayIds.includes(previousValue)
    ? previousValue
    : defaultSingleMatchdayId();
}

function savedSquadTimelineEmptyHtml() {
  return `
    <div class="timeline-empty">
      <strong>Build or load a squad to unlock your matchday timeline.</strong>
      <p>The timeline will then group your saved players by kickoff for MD1, MD2, and MD3. Manual advisor search still works without a saved squad.</p>
    </div>
  `;
}

function timelineProjectionSortKey(projection) {
  return [
    projection?.date || "9999-99-99",
    projection?.eastern_datetime_label || "",
    projection?.fixture_id || ""
  ].join("|");
}

function timelineGroupKey(projection, matchdayId) {
  if (!projectionIsAvailable(projection)) {
    return `${matchdayId}|timing-needs-check`;
  }

  return [
    projection.date || "date-needs-check",
    projection.eastern_datetime_label || projection.date || "Timing needs check",
    projection.fixture_id || "fixture-needs-check"
  ].join("|");
}

function timelineGroupHeading(row) {
  const projection = row.projection;

  if (!projectionIsAvailable(projection)) {
    return {
      title: "Timing needs check",
      detail: `${matchdayLabelFromId(row.matchdayId)} · no fixture projection`
    };
  }

  const venue = [projection.venue, projection.city].filter(Boolean).join(", ");

  return {
    title: projection.eastern_datetime_label || projection.date || "Timing needs check",
    detail: `${projection.matchday_label || matchdayLabelFromId(row.matchdayId)} · ${venue || "venue needs check"}`
  };
}

function timelinePlayerRow(player, area, matchdayId) {
  const projection = projectionForMatchday(player, matchdayId);
  const captainSignal = projectionIsAvailable(projection)
    ? captainChangeProjectionScore(projection, captainChangeRiskModes.balanced)
    : null;
  const substitutionSignal = projectionIsAvailable(projection)
    ? substitutionAdvisorProjectionScore(projection, substitutionAdvisorRiskModes.balanced)
    : null;

  return {
    player,
    area,
    matchdayId,
    projection,
    sortKey: timelineProjectionSortKey(projection),
    groupKey: timelineGroupKey(projection, matchdayId),
    captainSignal,
    substitutionSignal,
    contextLabel: userSelectionContextLabel(player),
    startProbability: projectionIsAvailable(projection)
      ? fieldNumber(projection, "start_probability_percent") ?? scoreValue(player, "start_probability_percent")
      : scoreValue(player, "start_probability_percent"),
    expectedMinutes: projectionIsAvailable(projection)
      ? fieldNumber(projection, "expected_minutes_v0") ?? scoreValue(player, "expected_minutes_v0")
      : scoreValue(player, "expected_minutes_v0")
  };
}

function savedSquadTimelineRows(matchdayId) {
  const { starters, bench, isFull } = savedDecisionSquad();

  if (!isFull) {
    return [];
  }

  return [
    ...starters.map((player) => timelinePlayerRow(player, "starter", matchdayId)),
    ...bench.map((player) => timelinePlayerRow(player, "bench", matchdayId))
  ].sort((a, b) =>
    a.sortKey.localeCompare(b.sortKey) ||
    (a.area === b.area ? 0 : a.area === "starter" ? -1 : 1) ||
    value(b.captainSignal) - value(a.captainSignal) ||
    a.player.name.localeCompare(b.player.name)
  );
}

function timelineActionButtons(row) {
  const playerId = escapeHtml(row.player.id);
  const matchdayId = escapeHtml(row.matchdayId);
  const substitutionAction = row.area === "starter"
    ? `<button class="timeline-player-button" type="button" data-timeline-fill="sub-starter" data-player-id="${playerId}" data-matchday-id="${matchdayId}">Played starter</button>`
    : `<button class="timeline-player-button" type="button" data-timeline-fill="sub-bench" data-player-id="${playerId}" data-matchday-id="${matchdayId}">Bench option</button>`;

  return `
    <div class="timeline-player-actions">
      <button class="timeline-player-button" type="button" data-timeline-fill="captain-current" data-player-id="${playerId}" data-matchday-id="${matchdayId}">Current cap</button>
      <button class="timeline-player-button" type="button" data-timeline-fill="captain-candidate" data-player-id="${playerId}" data-matchday-id="${matchdayId}">New cap</button>
      ${substitutionAction}
    </div>
  `;
}

function renderTimelinePlayerCard(row) {
  const projection = row.projection;
  const hasProjection = projectionIsAvailable(projection);
  const opponent = hasProjection ? projection.opponent : "Opponent needs check";
  const difficulty = hasProjection ? fixtureDifficultyLabel(projection.fixture_difficulty_band) : "Difficulty needs check";
  const kickoff = hasProjection ? projection.eastern_datetime_label || projection.date || "Timing needs check" : "Timing needs check";
  const captainSignal = row.captainSignal === null ? "N/A" : displayNumber(row.captainSignal);
  const substitutionSignal = row.substitutionSignal === null ? "N/A" : displayNumber(row.substitutionSignal);
  const livePlayerNote = matchdayLivePlayerNoteHtml(row.player, hasProjection ? projection.matchday_id || projection.matchday || row.matchdayId : row.matchdayId);

  return `
    <article class="timeline-player-card">
      <div class="timeline-player-card__top">
        <div>
          <strong>${escapeHtml(row.player.name)}</strong>
          <small>${escapeHtml(playerCountryText(row.player))} · ${escapeHtml(row.player.position)} · vs ${escapeHtml(opponent)}</small>
        </div>
        <span class="timeline-player-tag">${escapeHtml(row.contextLabel || (row.area === "starter" ? "Starter" : "Bench"))}</span>
      </div>
      <small>${escapeHtml(kickoff)} · ${escapeHtml(difficulty)}</small>
      <div class="timeline-player-stats">
        <span>Captain<strong>${captainSignal}</strong></span>
        <span>Sub signal<strong>${substitutionSignal}</strong></span>
        <span>Start<strong>${displayNumber(row.startProbability)}%</strong></span>
        <span>Minutes<strong>${displayNumber(row.expectedMinutes)}</strong></span>
      </div>
      ${livePlayerNote}
      ${timelineActionButtons(row)}
    </article>
  `;
}

function renderSavedSquadTimeline() {
  if (!savedSquadTimelineContent) {
    return;
  }

  const matchdayId = savedSquadTimelineMatchdaySelect?.value || defaultSingleMatchdayId();
  const rows = savedSquadTimelineRows(matchdayId);

  if (!rows.length) {
    savedSquadTimelineContent.innerHTML = savedSquadTimelineEmptyHtml();
    return;
  }

  const groups = rows.reduce((groupMap, row) => {
    const groupRows = groupMap.get(row.groupKey) || [];
    groupRows.push(row);
    groupMap.set(row.groupKey, groupRows);
    return groupMap;
  }, new Map());

  savedSquadTimelineContent.innerHTML = Array.from(groups.values()).map((groupRows) => {
    const heading = timelineGroupHeading(groupRows[0]);
    const starterCount = groupRows.filter((row) => row.area === "starter").length;
    const benchCount = groupRows.length - starterCount;

    return `
      <section class="timeline-group">
        <div class="timeline-group__heading">
          <div>
            <h3>${escapeHtml(heading.title)}</h3>
            <p>${escapeHtml(heading.detail)}</p>
          </div>
          <span class="timeline-count">${starterCount} starter${starterCount === 1 ? "" : "s"} · ${benchCount} bench</span>
        </div>
        <div class="timeline-player-grid">
          ${groupRows.map(renderTimelinePlayerCard).join("")}
        </div>
      </section>
    `;
  }).join("");
}

function setAdvisorMatchday(select, matchdayId) {
  if (select && captainChangeMatchdayIds().includes(matchdayId)) {
    select.value = matchdayId;
  }
}

function setMatchdayDecisionMatchday(matchdayId) {
  if (!matchdayDecisionMatchdaySelect) {
    return;
  }

  const matchdayIds = captainChangeMatchdayIds();
  matchdayDecisionMatchdaySelect.value = matchdayIds.includes(matchdayId)
    ? matchdayId
    : defaultSingleMatchdayId();
}

function handleSavedSquadTimelineClick(event) {
  const button = event.target.closest("[data-timeline-fill][data-player-id]");

  if (!button) {
    return;
  }

  const player = playerById(button.dataset.playerId);
  const matchdayId = button.dataset.matchdayId || savedSquadTimelineMatchdaySelect?.value || defaultSingleMatchdayId();

  if (!player) {
    return;
  }

  if (button.dataset.timelineFill === "captain-current") {
    setAdvisorMatchday(captainChangeMatchdaySelect, matchdayId);
    setDecisionPlayerInput(captainChangeCurrentPlayerInput, player);
    renderSavedSquadAdvisorPanels();
    renderCaptainChangeAdvisor();
    return;
  }

  if (button.dataset.timelineFill === "captain-candidate") {
    setAdvisorMatchday(captainChangeMatchdaySelect, matchdayId);
    setDecisionPlayerInput(captainChangeCandidateInput, player);
    renderSavedSquadAdvisorPanels();
    renderCaptainChangeAdvisor();
    return;
  }

  if (button.dataset.timelineFill === "sub-starter") {
    setAdvisorMatchday(substitutionAdvisorMatchdaySelect, matchdayId);
    setDecisionPlayerInput(substitutionAdvisorStarterInput, player);
    renderSavedSquadAdvisorPanels();
    renderSubstitutionAdvisor();
    return;
  }

  if (button.dataset.timelineFill === "sub-bench") {
    setAdvisorMatchday(substitutionAdvisorMatchdaySelect, matchdayId);
    setDecisionPlayerInput(substitutionAdvisorBenchInput, player);
    renderSavedSquadAdvisorPanels();
    renderSubstitutionAdvisor();
  }
}

function openCollapsiblePanel(panelId) {
  const panel = document.getElementById(panelId);

  if (!panel) {
    return;
  }

  if (panel.tagName.toLowerCase() === "details") {
    panel.open = true;
  }

  panel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function handleMatchdayDeskAction(action) {
  const matchdayId = matchdayDecisionMatchdaySelect?.value || defaultSingleMatchdayId();
  const riskStyle = matchdayDecisionRiskStyle();

  if (action === "load-saved-squad") {
    loadTeamFromBrowser();
    renderSavedSquadDecisionPanels();
    return;
  }

  if (action === "captain-check") {
    const { starters } = savedDecisionSquad();
    const currentCaptain = starters.find((starter) => starter.id === userCaptainId) || modelCaptainPlayer(starters);
    setAdvisorMatchday(captainChangeMatchdaySelect, matchdayId);
    setAdvisorRiskStyle(captainChangeRiskSelect, riskStyle);
    setDecisionPlayerInput(captainChangeCurrentPlayerInput, currentCaptain);
    if (captainChangeCurrentPointsInput && matchdayDecisionCaptainPointsInput) {
      captainChangeCurrentPointsInput.value = matchdayDecisionCaptainPointsInput.value;
    }
    renderSavedSquadAdvisorPanels();
    renderCaptainChangeAdvisor();
    openCollapsiblePanel("captain-change-advisor");
    return;
  }

  if (action === "bench-check") {
    const starter = playerById(matchdayDecisionStarterSelect?.value);
    setAdvisorMatchday(substitutionAdvisorMatchdaySelect, matchdayId);
    setAdvisorRiskStyle(substitutionAdvisorRiskSelect, riskStyle);
    setDecisionPlayerInput(substitutionAdvisorStarterInput, starter);
    if (substitutionAdvisorPointsInput && matchdayDecisionStarterPointsInput) {
      substitutionAdvisorPointsInput.value = matchdayDecisionStarterPointsInput.value;
    }
    renderSavedSquadAdvisorPanels();
    renderSubstitutionAdvisor();
    openCollapsiblePanel("substitution-advisor");
    return;
  }

  if (action === "timeline") {
    setAdvisorMatchday(savedSquadTimelineMatchdaySelect, matchdayId);
    renderSavedSquadTimeline();
    openCollapsiblePanel("saved-squad-timeline");
  }
}

function handleMatchdayDecisionCenterClick(event) {
  const deskActionButton = event.target.closest("[data-matchday-desk-action]");

  if (deskActionButton) {
    handleMatchdayDeskAction(deskActionButton.dataset.matchdayDeskAction);
    return;
  }

  const button = event.target.closest("[data-decision-center-action][data-player-id]");

  if (!button) {
    return;
  }

  const player = playerById(button.dataset.playerId);
  const matchdayId = matchdayDecisionMatchdaySelect?.value || defaultSingleMatchdayId();
  const riskStyle = matchdayDecisionRiskStyle();

  if (!player) {
    return;
  }

  if (button.dataset.decisionCenterAction === "captain-fill") {
    const { starters } = savedDecisionSquad();
    const currentCaptain = starters.find((starter) => starter.id === userCaptainId) || modelCaptainPlayer(starters);
    setAdvisorMatchday(captainChangeMatchdaySelect, matchdayId);
    setAdvisorRiskStyle(captainChangeRiskSelect, riskStyle);
    setDecisionPlayerInput(captainChangeCurrentPlayerInput, currentCaptain);
    setDecisionPlayerInput(captainChangeCandidateInput, player);
    if (captainChangeCurrentPointsInput && matchdayDecisionCaptainPointsInput) {
      captainChangeCurrentPointsInput.value = matchdayDecisionCaptainPointsInput.value;
    }
    renderSavedSquadAdvisorPanels();
    renderCaptainChangeAdvisor();
    return;
  }

  if (button.dataset.decisionCenterAction === "sub-fill") {
    const starter = playerById(matchdayDecisionStarterSelect?.value);
    setAdvisorMatchday(substitutionAdvisorMatchdaySelect, matchdayId);
    setAdvisorRiskStyle(substitutionAdvisorRiskSelect, riskStyle);
    setDecisionPlayerInput(substitutionAdvisorStarterInput, starter);
    setDecisionPlayerInput(substitutionAdvisorBenchInput, player);
    if (substitutionAdvisorPointsInput && matchdayDecisionStarterPointsInput) {
      substitutionAdvisorPointsInput.value = matchdayDecisionStarterPointsInput.value;
    }
    renderSavedSquadAdvisorPanels();
    renderSubstitutionAdvisor();
  }
}

function findCaptainChangePlayer(rawInput) {
  const input = String(rawInput || "").trim();

  if (!input) {
    return null;
  }

  const playerFromId = playerById(input);
  if (playerFromId) {
    return playerFromId;
  }

  const lowerInput = input.toLowerCase();
  const directMatch = captainChangePlayerLabelLookup.get(lowerInput);
  if (directMatch) {
    return directMatch;
  }

  const exactNameMatches = players.filter((player) => player.name.toLowerCase() === lowerInput);
  if (exactNameMatches.length === 1) {
    return exactNameMatches[0];
  }

  const startsWithMatches = players.filter((player) =>
    captainChangePlayerLabel(player).toLowerCase().startsWith(lowerInput)
  );
  if (startsWithMatches.length === 1) {
    return startsWithMatches[0];
  }

  return null;
}

function projectionForMatchday(player, matchdayId) {
  return projectionForPlayerMatchday(player, matchdayId);
}

function withTemporaryMatchday(matchdayId, callback) {
  const previousMatchdayId = activeMatchdayId;
  const previousCountryLimit = groupStageCountryLimit;
  activeMatchdayId = matchdayId;
  refreshActiveCountryLimit();
  try {
    return callback();
  } finally {
    activeMatchdayId = previousMatchdayId;
    groupStageCountryLimit = previousCountryLimit;
  }
}

function captainChangeMode() {
  return decisionComparisonMode(captainChangeRiskSelect, captainChangeRiskModes);
}

function captainChangeRawSignal(valueToCompress, ceiling = 9.5, multiplier = 1.3) {
  const value = Number(valueToCompress);
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  if (value <= 2) {
    return value;
  }

  return Math.min(ceiling, 2 + Math.sqrt(value - 2) * multiplier);
}

function captainChangeScoreParts(projection) {
  const expected = fieldNumber(projection, "finance_expected_return_points") ?? 0;
  const riskAdjusted = fieldNumber(projection, "finance_risk_adjusted_return_points") ?? expected;
  const upside = fieldNumber(projection, "finance_upside_p90_points") ?? expected;
  const floor = Math.max(fieldNumber(projection, "finance_var10_points") ?? riskAdjusted, 0);

  return {
    expected,
    riskAdjusted,
    upside,
    floor,
    rawExpected: captainChangeRawSignal(expected),
    rawRiskAdjusted: captainChangeRawSignal(riskAdjusted),
    rawUpside: captainChangeRawSignal(upside, 11, 1.65),
    rawFloor: Math.min(floor, 7)
  };
}

function captainChangeProjectionScore(projection, mode) {
  const parts = captainChangeScoreParts(projection);

  if (mode === captainChangeRiskModes.safer) {
    return parts.rawRiskAdjusted * 0.35 + parts.rawExpected * 0.2 + parts.rawFloor * 0.45;
  }

  if (mode === captainChangeRiskModes.upside) {
    return parts.rawExpected * 0.42 + parts.rawUpside * 0.3 + parts.rawRiskAdjusted * 0.14 + parts.rawFloor * 0.14;
  }

  if (mode === captainChangeRiskModes.differential) {
    return parts.rawExpected * 0.34 + parts.rawUpside * 0.42 + parts.rawRiskAdjusted * 0.1 + parts.rawFloor * 0.14;
  }

  return parts.rawExpected * 0.5 + parts.rawRiskAdjusted * 0.25 + parts.rawFloor * 0.25;
}

function captainChangeWarnings(player, projection, matchdayId, currentPlayer) {
  const warnings = [];
  const startProbability = fieldNumber(projection, "start_probability_percent") ?? scoreValue(player, "start_probability_percent");
  const expectedMinutes = fieldNumber(projection, "expected_minutes_v0") ?? scoreValue(player, "expected_minutes_v0");
  const fixtureDifficulty = fieldNumber(projection, "fixture_difficulty_score");
  const compositeRisk = fieldNumber(projection, "finance_composite_risk_score") ?? scoreValue(player, "finance_composite_risk_score", "risk_composite_score");
  const tailRisk = fieldNumber(projection, "finance_tail_risk_score") ?? scoreValue(player, "finance_tail_risk_score", "risk_tail_score");
  const qaStatus = withTemporaryMatchday(matchdayId, () => qaStatusFromFlags(qaFlagsForPlayer(player, "captain")));

  if (currentPlayer && currentPlayer.id === player.id) {
    warnings.push("Current and new captain are the same player.");
  }

  if (startProbability < 55) {
    warnings.push(`Start risk: ${displayNumber(startProbability)}% start probability.`);
  }

  if (expectedMinutes < 55) {
    warnings.push(`Minutes risk: ${displayNumber(expectedMinutes)} expected minutes.`);
  }

  if (fixtureDifficulty !== null && fixtureDifficulty >= 70) {
    warnings.push(`Hard fixture: ${displayNumber(fixtureDifficulty)} difficulty.`);
  }

  if (compositeRisk >= 70) {
    warnings.push(`High risk score: ${displayNumber(compositeRisk)}.`);
  }

  if (tailRisk >= 70) {
    warnings.push(`High tail risk: ${displayNumber(tailRisk)}.`);
  }

  if (qaStatus === "review") {
    warnings.push("Review this player carefully before acting.");
  }

  return warnings;
}

function captainChangeMetric(label, valueToDisplay, note = "") {
  return `
    <article>
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(valueToDisplay)}</strong>
      ${note ? `<small>${escapeHtml(note)}</small>` : ""}
    </article>
  `;
}

function decisionProjectionSnapshot(projection) {
  if (!projectionIsAvailable(projection)) {
    return null;
  }

  return {
    fixture_id: projection.fixture_id || null,
    match_number: projection.match_number || null,
    matchday_id: projection.matchday_id || null,
    matchday_label: projection.matchday_label || null,
    date: projection.date || null,
    eastern_datetime_label: projection.eastern_datetime_label || null,
    opponent: projection.opponent || null,
    fixture_difficulty_score: fieldNumber(projection, "fixture_difficulty_score"),
    fixture_difficulty_band: projection.fixture_difficulty_band || null,
    team_expected_goals: fieldNumber(projection, "team_expected_goals"),
    team_clean_sheet_probability: fieldNumber(projection, "team_clean_sheet_probability"),
    match_goal_environment: projection.match_goal_environment || null,
    match_upset_risk_probability: fieldNumber(projection, "match_upset_risk_probability")
  };
}

function decisionQaFlagSnapshot(player, measureKey, matchdayId) {
  return withTemporaryMatchday(matchdayId, () =>
    qaFlagsForPlayer(player, measureKey).map((flag) => ({
      id: flag.id,
      label: flag.label,
      severity: flag.severity,
      detail: flag.detail
    }))
  );
}

function savedDecisionBase(tool, matchdayId, riskStyle, mode, verdict, resultClass, warnings) {
  return {
    saved: true,
    saved_at: new Date().toISOString(),
    saved_decision_export_version: "saved_decision_export_v0",
    selected_matchday_id: matchdayId,
    selected_matchday_label: matchdayLabelFromId(matchdayId),
    risk_style: riskStyle,
    risk_style_label: mode.label,
    result: verdict,
    result_class: resultClass,
    warnings,
    source: "manual_user_inputs",
    note: `${tool} was saved from the latest manual advisor result. User-entered points are stored, but live played/unplayed status is not verified.`
  };
}

function renderDecisionToolStatus(container, decision, manualText, savedText) {
  if (!container) {
    return;
  }

  let stateClass = "decision-tool-status";
  let badge = "Manual";
  let text = manualText;

  if (decision?.imported_requires_rerun || decision?.imported) {
    stateClass += " decision-tool-status--imported";
    badge = "Imported - rerun needed";
    text = "Fields were restored from Team Import. Rerun the advisor before acting.";
  } else if (decision?.saved) {
    stateClass += " decision-tool-status--saved";
    badge = "Saved";
    text = savedText;
  }

  container.className = stateClass;
  container.innerHTML = `
    <span class="decision-tool-status__badge">${escapeHtml(badge)}</span>
    <span>${escapeHtml(text)}</span>
  `;
}

function renderDecisionToolStatuses() {
  renderDecisionToolStatus(
    captainChangeStatus,
    lastCaptainChangeDecision,
    "Enter current captain points and one possible new captain, then run the check.",
    "Latest captain check will be included in Team Export JSON."
  );
  renderDecisionToolStatus(
    substitutionAdvisorStatus,
    lastSubstitutionDecision,
    "Enter current starter points and one possible substitute, then run the check.",
    "Latest substitution check will be included in Team Export JSON."
  );
}

function clearSavedDecisionExports() {
  lastCaptainChangeDecision = null;
  lastSubstitutionDecision = null;
  renderDecisionToolStatuses();
}

function cloneDecisionForImport(decision, toolLabel) {
  return {
    ...decision,
    imported: true,
    imported_at: new Date().toISOString(),
    saved_decision_import_version: "saved_decision_import_v0",
    imported_requires_rerun: true,
    source: "imported_team_export",
    note: `Imported saved ${toolLabel} scenario. Review the restored fields and rerun the advisor before acting; played status, deadlines, and squad rules are not verified.`
  };
}

function importedDecisionNumber(valueToParse) {
  const parsed = Number(valueToParse);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function importedDecisionPlayer(decision, idKey, label, warnings) {
  const playerId = decision?.[idKey];

  if (!playerId) {
    return null;
  }

  const player = playerById(playerId);

  if (!player) {
    warnings.push(`Imported ${label} ID was not found: ${playerId}.`);
  }

  return player || null;
}

function setImportedRiskStyle(select, modes, riskStyle, label, warnings) {
  if (!select) {
    return;
  }

  if (riskStyle && modes[riskStyle]) {
    const selectValue = select.querySelector(`option[value="${riskStyle}"]`)
      ? riskStyle
      : riskStyle === "safer" && select.querySelector('option[value="safe"]')
        ? "safe"
        : riskStyle;
    select.value = selectValue;
  } else if (riskStyle) {
    warnings.push(`Imported ${label} strategy was not recognized: ${riskStyle}.`);
  }
}

function setImportedMatchday(select, matchdayId, label, warnings) {
  if (!select) {
    return;
  }

  if (matchdayId && captainChangeMatchdayIds().includes(matchdayId)) {
    select.value = matchdayId;
  } else if (matchdayId) {
    warnings.push(`Imported ${label} matchday was not recognized: ${matchdayId}.`);
  }
}

function importedDecisionMetric(label, valueToDisplay, note = "") {
  return captainChangeMetric(label, valueToDisplay === null || valueToDisplay === undefined ? "N/A" : String(valueToDisplay), note);
}

function renderImportedCaptainDecision(decision, currentPlayer, candidate, points) {
  if (!captainChangeResult) {
    return;
  }

  const matchdayId = captainChangeMatchdaySelect?.value || decision.selected_matchday_id || defaultSingleMatchdayId();
  captainChangeResult.className = "captain-change-result captain-change-result--review";
  captainChangeResult.innerHTML = `
    <div class="captain-change-verdict">
      <span class="captain-change-badge">Imported</span>
      <strong>Imported saved captain check</strong>
    </div>
    <div class="captain-change-import-warning">Rerun this advisor before acting. Imported checks do not verify played status, deadlines, or squad rules.</div>
    <p>Restored ${escapeHtml(candidate.name)} as the possible new captain with ${displayNumber(points)} points kept from ${escapeHtml(currentPlayer?.name || "the current captain")}. This is imported context, not a fresh recommendation. Click Check captain switch to recalculate before acting.</p>
    <div class="captain-change-metrics">
      ${importedDecisionMetric("Imported result", decision.result || "Needs rerun", decision.result_class || "review")}
      ${importedDecisionMetric("Matchday", matchdayLabelFromId(matchdayId), decision.risk_style_label || decision.risk_style || "strategy")}
      ${importedDecisionMetric("Old switch score", decision.switch_score, `threshold ${decision.switch_threshold ?? "N/A"}`)}
      ${importedDecisionMetric("Saved at", decision.saved_at ? new Date(decision.saved_at).toLocaleString() : "N/A", "from imported file")}
    </div>
    <p>Played status, deadlines, and squad rules are still manual checks.</p>
  `;
}

function renderImportedSubstitutionDecision(decision, starter, benchPlayer, points) {
  if (!substitutionAdvisorResult) {
    return;
  }

  const matchdayId = substitutionAdvisorMatchdaySelect?.value || decision.selected_matchday_id || defaultSingleMatchdayId();
  substitutionAdvisorResult.className = "captain-change-result substitution-advisor-result captain-change-result--review";
  substitutionAdvisorResult.innerHTML = `
    <div class="captain-change-verdict">
      <span class="captain-change-badge">Imported</span>
      <strong>Imported saved substitution check</strong>
    </div>
    <div class="captain-change-import-warning">Rerun this advisor before acting. Imported checks do not verify played status, deadlines, or formation rules.</div>
    <p>Restored ${escapeHtml(benchPlayer.name)} as the possible substitute against ${displayNumber(points)} points from ${escapeHtml(starter?.name || "the current starter")}. This is imported context, not a fresh recommendation. Click Check bench switch to recalculate before acting.</p>
    <div class="captain-change-metrics">
      ${importedDecisionMetric("Imported result", decision.result || "Needs rerun", decision.result_class || "review")}
      ${importedDecisionMetric("Matchday", matchdayLabelFromId(matchdayId), decision.risk_style_label || decision.risk_style || "strategy")}
      ${importedDecisionMetric("Old sub score", decision.substitution_score, `threshold ${decision.substitution_threshold ?? "N/A"}`)}
      ${importedDecisionMetric("Saved at", decision.saved_at ? new Date(decision.saved_at).toLocaleString() : "N/A", "from imported file")}
    </div>
    <p>Played status, deadlines, and formation rules are still manual checks.</p>
  `;
}

function restoreImportedCaptainDecision(decision) {
  const warnings = [];

  if (!decision?.saved) {
    return { imported: false, warnings };
  }

  const currentPlayer = importedDecisionPlayer(decision, "current_captain_id", "captain current player", warnings);
  const candidate = importedDecisionPlayer(decision, "replacement_candidate_id", "captain replacement player", warnings);
  const points = importedDecisionNumber(decision.current_captain_raw_points);

  if (!candidate) {
    warnings.push("Imported captain check was skipped because the possible new captain is missing from the current player data.");
    return { imported: false, warnings };
  }

  if (points === null) {
    warnings.push("Imported captain check was skipped because current captain points were missing or invalid.");
    return { imported: false, warnings };
  }

  setImportedMatchday(captainChangeMatchdaySelect, decision.selected_matchday_id, "captain check", warnings);
  setImportedRiskStyle(captainChangeRiskSelect, captainChangeRiskModes, decision.risk_style, "captain check", warnings);
  if (currentPlayer) {
    setDecisionPlayerInput(captainChangeCurrentPlayerInput, currentPlayer);
  } else if (captainChangeCurrentPlayerInput) {
    captainChangeCurrentPlayerInput.value = "";
  }
  if (captainChangeCurrentPointsInput) {
    captainChangeCurrentPointsInput.value = String(points);
  }
  setDecisionPlayerInput(captainChangeCandidateInput, candidate);
  lastCaptainChangeDecision = cloneDecisionForImport(decision, "captain-change");
  renderDecisionToolStatuses();
  renderImportedCaptainDecision(decision, currentPlayer, candidate, points);

  return { imported: true, warnings };
}

function restoreImportedSubstitutionDecision(decision) {
  const warnings = [];

  if (!decision?.saved) {
    return { imported: false, warnings };
  }

  const starter = importedDecisionPlayer(decision, "played_starter_id", "substitution starter", warnings);
  const benchPlayer = importedDecisionPlayer(decision, "bench_candidate_id", "substitution bench player", warnings);
  const points = importedDecisionNumber(decision.played_starter_raw_points);

  if (!benchPlayer) {
    warnings.push("Imported bench switch check was skipped because the possible substitute is missing from the current player data.");
    return { imported: false, warnings };
  }

  if (points === null) {
    warnings.push("Imported substitution check was skipped because starter points were missing or invalid.");
    return { imported: false, warnings };
  }

  setImportedMatchday(substitutionAdvisorMatchdaySelect, decision.selected_matchday_id, "substitution check", warnings);
  setImportedRiskStyle(substitutionAdvisorRiskSelect, substitutionAdvisorRiskModes, decision.risk_style, "substitution check", warnings);
  if (starter) {
    setDecisionPlayerInput(substitutionAdvisorStarterInput, starter);
  } else if (substitutionAdvisorStarterInput) {
    substitutionAdvisorStarterInput.value = "";
  }
  if (substitutionAdvisorPointsInput) {
    substitutionAdvisorPointsInput.value = String(points);
  }
  setDecisionPlayerInput(substitutionAdvisorBenchInput, benchPlayer);
  lastSubstitutionDecision = cloneDecisionForImport(decision, "substitution");
  renderDecisionToolStatuses();
  renderImportedSubstitutionDecision(decision, starter, benchPlayer, points);

  return { imported: true, warnings };
}

function restoreImportedDecisionTools(payload) {
  const decisionTools = payload?.decision_tools || {};
  const captainImport = restoreImportedCaptainDecision(decisionTools.captain_change_advisor);
  const substitutionImport = restoreImportedSubstitutionDecision(decisionTools.substitution_advisor);
  const importedCount = [captainImport, substitutionImport].filter((result) => result.imported).length;

  return {
    importedCount,
    warnings: [
      ...captainImport.warnings,
      ...substitutionImport.warnings
    ]
  };
}

function renderCaptainChangeAdvisor(event) {
  event?.preventDefault();

  if (!captainChangeResult) {
    return;
  }

  const matchdayId = captainChangeMatchdaySelect?.value || defaultSingleMatchdayId();
  const mode = captainChangeMode();
  const riskStyle = captainChangeRiskSelect?.value || "balanced";
  const currentPlayer = findCaptainChangePlayer(captainChangeCurrentPlayerInput?.value);
  const candidate = findCaptainChangePlayer(captainChangeCandidateInput?.value);
  const rawCurrentPoints = String(captainChangeCurrentPointsInput?.value ?? "").trim();
  const currentPoints = Number(rawCurrentPoints);

  if (!rawCurrentPoints || !Number.isFinite(currentPoints) || currentPoints < 0) {
    lastCaptainChangeDecision = null;
    renderDecisionToolStatuses();
    captainChangeResult.className = "captain-change-result captain-change-result--empty";
    captainChangeResult.innerHTML = `
      <strong>Enter the current captain's points.</strong>
      <p>Use the score before the captain double so the comparison is on the same basis.</p>
    `;
    return;
  }

  if (!candidate) {
    lastCaptainChangeDecision = null;
    renderDecisionToolStatuses();
    captainChangeResult.className = "captain-change-result captain-change-result--empty";
    captainChangeResult.innerHTML = `
      <strong>Choose a possible new captain from the player list.</strong>
      <p>The possible new captain should be a player in your squad who has not played yet in ${escapeHtml(matchdayLabelFromId(matchdayId))}.</p>
    `;
    return;
  }

  const projection = projectionForMatchday(candidate, matchdayId);

  if (!projectionIsAvailable(projection)) {
    lastCaptainChangeDecision = {
      model_version: "captain_change_advisor_v0",
      scope: "quick_manual_switch_check",
      ...savedDecisionBase("Captain Change Advisor", matchdayId, riskStyle, mode, "Needs check", "review", [
        projection?.reason || "No matchday projection is available for the possible new captain."
      ]),
      current_captain_id: currentPlayer?.id || null,
      current_captain: exportedPlayerReference(currentPlayer),
      current_captain_raw_points: Number(currentPoints.toFixed(1)),
      replacement_candidate_id: candidate.id,
      replacement_candidate: exportedPlayerReference(candidate),
      switch_score: null,
      switch_threshold: null,
      edge_vs_current: null,
      raw_signal: null,
      candidate_start_probability_percent: null,
      candidate_expected_minutes: null,
      projection: null,
      qa_flags: decisionQaFlagSnapshot(candidate, "captain", matchdayId)
    };
    renderDecisionToolStatuses();
    captainChangeResult.className = "captain-change-result captain-change-result--review";
    captainChangeResult.innerHTML = `
      <div class="captain-change-verdict">
        <span class="captain-change-badge">Review manually</span>
        <strong>No matchday projection for ${escapeHtml(candidate.name)}.</strong>
      </div>
      <p>Pick a player with a ${escapeHtml(matchdayLabelFromId(matchdayId))} fixture projection before using the switch check.</p>
    `;
    return;
  }

  const scoreParts = captainChangeScoreParts(projection);
  const comparisonScore = captainChangeProjectionScore(projection, mode);
  const startProbability = fieldNumber(projection, "start_probability_percent") ?? scoreValue(candidate, "start_probability_percent");
  const expectedMinutes = fieldNumber(projection, "expected_minutes_v0") ?? scoreValue(candidate, "expected_minutes_v0");
  const fixtureDifficulty = fieldNumber(projection, "fixture_difficulty_score");
  const breakEven = currentPoints + mode.switchBuffer;
  const edge = comparisonScore - currentPoints;
  const warnings = captainChangeWarnings(candidate, projection, matchdayId, currentPlayer);
  const isSamePlayer = currentPlayer && currentPlayer.id === candidate.id;
  let verdict = "Keep captain";
  let resultClass = "keep";
  let explanation = `${candidate.name}'s ${mode.projectionLabel.toLowerCase()} is below the switch threshold.`;

  if (isSamePlayer) {
    verdict = "Choose another player";
    resultClass = "review";
    explanation = "Choose a different possible new captain before making a switch decision.";
  } else if (comparisonScore >= breakEven) {
    verdict = "Switch captain";
    resultClass = "switch";
    explanation = `${candidate.name} clears the ${displayNumber(breakEven)} switch threshold.`;
  } else if (comparisonScore >= currentPoints - mode.closeMargin) {
    verdict = "Close call";
    resultClass = "close";
    explanation = `${candidate.name} is close to the current captain score, but does not clearly beat the ${mode.label.toLowerCase()} switch threshold.`;
  }

  const currentName = currentPlayer?.name || "Current captain";
  const currentScoreContext = currentPoints >= 12
    ? " A 12+ captain score before the double is already excellent, so this check is deliberately conservative from here."
    : currentPoints >= 8
      ? " An 8+ captain score before the double is strong, so switching needs a clear edge."
      : "";
  const warningHtml = warnings.length
    ? `<div class="captain-change-warning-list">${warnings.map((warning) => `<span>${escapeHtml(warning)}</span>`).join("")}</div>`
    : `<div class="captain-change-warning-list"><span>No major switch warnings for this comparison.</span></div>`;
  lastCaptainChangeDecision = {
    model_version: "captain_change_advisor_v0",
    scope: "quick_manual_switch_check",
    ...savedDecisionBase("Captain Change Advisor", matchdayId, riskStyle, mode, verdict, resultClass, warnings),
    current_captain_id: currentPlayer?.id || null,
    current_captain: exportedPlayerReference(currentPlayer),
    current_captain_raw_points: Number(currentPoints.toFixed(1)),
    replacement_candidate_id: candidate.id,
    replacement_candidate: exportedPlayerReference(candidate),
    switch_score: Number(comparisonScore.toFixed(2)),
    switch_threshold: Number(breakEven.toFixed(2)),
    edge_vs_current: Number(edge.toFixed(2)),
    raw_signal: {
      expected: Number(scoreParts.rawExpected.toFixed(2)),
      risk_adjusted: Number(scoreParts.rawRiskAdjusted.toFixed(2)),
      upside: Number(scoreParts.rawUpside.toFixed(2)),
      floor: Number(scoreParts.rawFloor.toFixed(2))
    },
    candidate_start_probability_percent: Number(startProbability.toFixed(1)),
    candidate_expected_minutes: Number(expectedMinutes.toFixed(1)),
    projection: decisionProjectionSnapshot(projection),
    qa_flags: decisionQaFlagSnapshot(candidate, "captain", matchdayId)
  };
  renderDecisionToolStatuses();

  captainChangeResult.className = `captain-change-result captain-change-result--${resultClass}`;
  captainChangeResult.innerHTML = `
    <div class="captain-change-verdict">
      <span class="captain-change-badge">${escapeHtml(mode.badge)}</span>
      <strong>${escapeHtml(verdict)}</strong>
    </div>
    <p>${escapeHtml(explanation)} Keeping ${escapeHtml(currentName)} keeps a ${displayNumber(currentPoints)} captain score before the double; switching needs the possible new captain to beat that by enough for your selected strategy.${escapeHtml(currentScoreContext)}</p>
    <div class="captain-change-metrics">
      ${captainChangeMetric("Current captain points", displayNumber(currentPoints), currentName)}
      ${captainChangeMetric(mode.projectionLabel, displayNumber(comparisonScore), `${displayNumber(edge)} vs current`)}
      ${captainChangeMetric("Projection / floor", `${displayNumber(scoreParts.rawExpected)} / ${displayNumber(scoreParts.rawFloor)}`, `${displayNumber(scoreParts.rawUpside)} upside signal`)}
      ${captainChangeMetric("Fixture", `${projection.opponent} · ${fixtureDifficulty === null ? "Review manually" : displayNumber(fixtureDifficulty)}`, `${displayNumber(startProbability)}% start · ${displayNumber(expectedMinutes)} min`)}
    </div>
    ${warningHtml}
    <p>${escapeHtml(matchdayLabelFromId(matchdayId))} model context: ${escapeHtml(singleFixtureModelReason(projection, "attack").trim())}</p>
    <p>This latest captain check will be included in Team Export JSON until it is reset or replaced.</p>
  `;
}

function resetCaptainChangeAdvisor() {
  lastCaptainChangeDecision = null;
  renderDecisionToolStatuses();
  [captainChangeCurrentCountrySelect, captainChangeCurrentPositionSelect, captainChangeCandidateCountrySelect, captainChangeCandidatePositionSelect]
    .filter(Boolean)
    .forEach((select) => {
      select.value = "All";
    });
  renderDecisionPlayerSelects();
  if (captainChangeCurrentPlayerInput) captainChangeCurrentPlayerInput.value = "";
  if (captainChangeCurrentPointsInput) captainChangeCurrentPointsInput.value = "";
  if (captainChangeCandidateInput) captainChangeCandidateInput.value = "";
  if (captainChangeRiskSelect) captainChangeRiskSelect.value = "balanced";
  if (captainChangeMatchdaySelect) captainChangeMatchdaySelect.value = defaultSingleMatchdayId();

  if (captainChangeResult) {
    captainChangeResult.className = "captain-change-result captain-change-result--empty";
    captainChangeResult.innerHTML = `
      <strong>Enter current captain points and a possible new captain.</strong>
      <p>The possible new captain should be in your squad and still unplayed in the selected matchday.</p>
    `;
  }
}

function substitutionAdvisorMode() {
  return decisionComparisonMode(substitutionAdvisorRiskSelect, substitutionAdvisorRiskModes);
}

function substitutionAdvisorProjectionScore(projection, mode) {
  const parts = captainChangeScoreParts(projection);

  if (mode === substitutionAdvisorRiskModes.safer) {
    return parts.rawRiskAdjusted * 0.3 + parts.rawExpected * 0.2 + parts.rawFloor * 0.5;
  }

  if (mode === substitutionAdvisorRiskModes.upside) {
    return parts.rawExpected * 0.38 + parts.rawUpside * 0.28 + parts.rawRiskAdjusted * 0.14 + parts.rawFloor * 0.2;
  }

  if (mode === substitutionAdvisorRiskModes.differential) {
    return parts.rawExpected * 0.32 + parts.rawUpside * 0.4 + parts.rawRiskAdjusted * 0.1 + parts.rawFloor * 0.18;
  }

  return parts.rawExpected * 0.45 + parts.rawRiskAdjusted * 0.25 + parts.rawFloor * 0.3;
}

function substitutionAdvisorWarnings(starter, benchPlayer, projection, matchdayId, currentPoints) {
  const warnings = [];
  const startProbability = fieldNumber(projection, "start_probability_percent") ?? scoreValue(benchPlayer, "start_probability_percent");
  const expectedMinutes = fieldNumber(projection, "expected_minutes_v0") ?? scoreValue(benchPlayer, "expected_minutes_v0");
  const fixtureDifficulty = fieldNumber(projection, "fixture_difficulty_score");
  const compositeRisk = fieldNumber(projection, "finance_composite_risk_score") ?? scoreValue(benchPlayer, "finance_composite_risk_score", "risk_composite_score");
  const tailRisk = fieldNumber(projection, "finance_tail_risk_score") ?? scoreValue(benchPlayer, "finance_tail_risk_score", "risk_tail_score");
  const qaStatus = withTemporaryMatchday(matchdayId, () => qaStatusFromFlags(qaFlagsForPlayer(benchPlayer, "risk_adjusted")));

  if (starter && starter.id === benchPlayer.id) {
    warnings.push("Starter and bench player are the same player.");
  }

  if (starter && starter.position !== benchPlayer.position) {
    warnings.push("Different position: confirm your formation remains legal before subbing.");
  }

  if (currentPoints >= 6) {
    warnings.push(`${displayNumber(currentPoints)} points is a useful return; subbing needs a clear edge.`);
  }

  if (startProbability < 55) {
    warnings.push(`Start risk: ${displayNumber(startProbability)}% start probability.`);
  }

  if (expectedMinutes < 55) {
    warnings.push(`Minutes risk: ${displayNumber(expectedMinutes)} expected minutes.`);
  }

  if (fixtureDifficulty !== null && fixtureDifficulty >= 70) {
    warnings.push(`Hard fixture: ${displayNumber(fixtureDifficulty)} difficulty.`);
  }

  if (compositeRisk >= 70) {
    warnings.push(`High risk score: ${displayNumber(compositeRisk)}.`);
  }

  if (tailRisk >= 70) {
    warnings.push(`High tail risk: ${displayNumber(tailRisk)}.`);
  }

  if (qaStatus === "review") {
    warnings.push("Review this player carefully before acting.");
  }

  return warnings;
}

function renderSubstitutionAdvisor(event) {
  event?.preventDefault();

  if (!substitutionAdvisorResult) {
    return;
  }

  const matchdayId = substitutionAdvisorMatchdaySelect?.value || defaultSingleMatchdayId();
  const mode = substitutionAdvisorMode();
  const riskStyle = substitutionAdvisorRiskSelect?.value || "balanced";
  const starter = findCaptainChangePlayer(substitutionAdvisorStarterInput?.value);
  const benchPlayer = findCaptainChangePlayer(substitutionAdvisorBenchInput?.value);
  const rawCurrentPoints = String(substitutionAdvisorPointsInput?.value ?? "").trim();
  const currentPoints = Number(rawCurrentPoints);

  if (!rawCurrentPoints || !Number.isFinite(currentPoints) || currentPoints < 0) {
    lastSubstitutionDecision = null;
    renderDecisionToolStatuses();
    substitutionAdvisorResult.className = "captain-change-result substitution-advisor-result captain-change-result--empty";
    substitutionAdvisorResult.innerHTML = `
      <strong>Enter the current starter's points.</strong>
      <p>Use the actual fantasy score before deciding whether a bench player is worth bringing in.</p>
    `;
    return;
  }

  if (!benchPlayer) {
    lastSubstitutionDecision = null;
    renderDecisionToolStatuses();
    substitutionAdvisorResult.className = "captain-change-result substitution-advisor-result captain-change-result--empty";
    substitutionAdvisorResult.innerHTML = `
      <strong>Choose a possible substitute from the player list.</strong>
      <p>The possible substitute should be in your squad and still unplayed in ${escapeHtml(matchdayLabelFromId(matchdayId))}.</p>
    `;
    return;
  }

  const projection = projectionForMatchday(benchPlayer, matchdayId);

  if (!projectionIsAvailable(projection)) {
    lastSubstitutionDecision = {
      model_version: "substitution_advisor_v0",
      scope: "quick_manual_substitution_check",
      ...savedDecisionBase("Substitution Advisor", matchdayId, riskStyle, mode, "Needs check", "review", [
        projection?.reason || "No matchday projection is available for the possible substitute."
      ]),
      played_starter_id: starter?.id || null,
      played_starter: exportedPlayerReference(starter),
      played_starter_raw_points: Number(currentPoints.toFixed(1)),
      bench_candidate_id: benchPlayer.id,
      bench_candidate: exportedPlayerReference(benchPlayer),
      substitution_score: null,
      substitution_threshold: null,
      edge_vs_starter: null,
      raw_signal: null,
      bench_start_probability_percent: null,
      bench_expected_minutes: null,
      formation_legality_checked: false,
      same_position_substitution: starter ? starter.position === benchPlayer.position : null,
      projection: null,
      qa_flags: decisionQaFlagSnapshot(benchPlayer, "risk_adjusted", matchdayId)
    };
    renderDecisionToolStatuses();
    substitutionAdvisorResult.className = "captain-change-result substitution-advisor-result captain-change-result--review";
    substitutionAdvisorResult.innerHTML = `
      <div class="captain-change-verdict">
        <span class="captain-change-badge">Review manually</span>
        <strong>No matchday projection for ${escapeHtml(benchPlayer.name)}.</strong>
      </div>
      <p>Pick a possible substitute with a ${escapeHtml(matchdayLabelFromId(matchdayId))} fixture projection before using the bench switch check.</p>
    `;
    return;
  }

  const scoreParts = captainChangeScoreParts(projection);
  const comparisonScore = substitutionAdvisorProjectionScore(projection, mode);
  const startProbability = fieldNumber(projection, "start_probability_percent") ?? scoreValue(benchPlayer, "start_probability_percent");
  const expectedMinutes = fieldNumber(projection, "expected_minutes_v0") ?? scoreValue(benchPlayer, "expected_minutes_v0");
  const fixtureDifficulty = fieldNumber(projection, "fixture_difficulty_score");
  const breakEven = currentPoints + mode.subBuffer;
  const edge = comparisonScore - currentPoints;
  const isSamePlayer = starter && starter.id === benchPlayer.id;
  const warnings = substitutionAdvisorWarnings(starter, benchPlayer, projection, matchdayId, currentPoints);
  let verdict = "Keep starter";
  let resultClass = "keep";
  let explanation = `${benchPlayer.name}'s ${mode.projectionLabel.toLowerCase()} is below the substitution threshold.`;

  if (isSamePlayer) {
    verdict = "Choose another player";
    resultClass = "review";
    explanation = "Choose a different possible substitute before making a bench switch decision.";
  } else if (comparisonScore >= breakEven) {
    verdict = "Sub in bench player";
    resultClass = "switch";
    explanation = `${benchPlayer.name} clears the ${displayNumber(breakEven)} substitution threshold.`;
  } else if (comparisonScore >= currentPoints - mode.closeMargin) {
    verdict = "Close call";
    resultClass = "close";
    explanation = `${benchPlayer.name} is close to the starter score, but does not clearly beat the ${mode.label.toLowerCase()} substitution threshold.`;
  }

  const starterName = starter?.name || "Current starter";
  const currentScoreContext = currentPoints >= 8
    ? " An 8+ starter score is strong, so this check is deliberately conservative."
    : currentPoints >= 6
      ? " A 6+ starter score is useful, so subbing needs a clear edge."
      : "";
  const warningHtml = warnings.length
    ? `<div class="captain-change-warning-list">${warnings.map((warning) => `<span>${escapeHtml(warning)}</span>`).join("")}</div>`
    : `<div class="captain-change-warning-list"><span>No major substitution warnings for this comparison.</span></div>`;
  lastSubstitutionDecision = {
    model_version: "substitution_advisor_v0",
    scope: "quick_manual_substitution_check",
    ...savedDecisionBase("Substitution Advisor", matchdayId, riskStyle, mode, verdict, resultClass, warnings),
    played_starter_id: starter?.id || null,
    played_starter: exportedPlayerReference(starter),
    played_starter_raw_points: Number(currentPoints.toFixed(1)),
    bench_candidate_id: benchPlayer.id,
    bench_candidate: exportedPlayerReference(benchPlayer),
    substitution_score: Number(comparisonScore.toFixed(2)),
    substitution_threshold: Number(breakEven.toFixed(2)),
    edge_vs_starter: Number(edge.toFixed(2)),
    raw_signal: {
      expected: Number(scoreParts.rawExpected.toFixed(2)),
      risk_adjusted: Number(scoreParts.rawRiskAdjusted.toFixed(2)),
      upside: Number(scoreParts.rawUpside.toFixed(2)),
      floor: Number(scoreParts.rawFloor.toFixed(2))
    },
    bench_start_probability_percent: Number(startProbability.toFixed(1)),
    bench_expected_minutes: Number(expectedMinutes.toFixed(1)),
    formation_legality_checked: false,
    same_position_substitution: starter ? starter.position === benchPlayer.position : null,
    projection: decisionProjectionSnapshot(projection),
    qa_flags: decisionQaFlagSnapshot(benchPlayer, "risk_adjusted", matchdayId)
  };
  renderDecisionToolStatuses();

  substitutionAdvisorResult.className = `captain-change-result substitution-advisor-result captain-change-result--${resultClass}`;
  substitutionAdvisorResult.innerHTML = `
    <div class="captain-change-verdict">
      <span class="captain-change-badge">${escapeHtml(mode.badge)}</span>
      <strong>${escapeHtml(verdict)}</strong>
    </div>
    <p>${escapeHtml(explanation)} Keeping ${escapeHtml(starterName)} keeps ${displayNumber(currentPoints)} points; switching needs the possible substitute to beat that by enough for your selected strategy.${escapeHtml(currentScoreContext)}</p>
    <div class="captain-change-metrics">
      ${captainChangeMetric("Current starter points", displayNumber(currentPoints), starterName)}
      ${captainChangeMetric(mode.projectionLabel, displayNumber(comparisonScore), `${displayNumber(edge)} vs starter`)}
      ${captainChangeMetric("Projection / floor", `${displayNumber(scoreParts.rawExpected)} / ${displayNumber(scoreParts.rawFloor)}`, `${displayNumber(scoreParts.rawUpside)} upside signal`)}
      ${captainChangeMetric("Fixture", `${projection.opponent} · ${fixtureDifficulty === null ? "Review manually" : displayNumber(fixtureDifficulty)}`, `${displayNumber(startProbability)}% start · ${displayNumber(expectedMinutes)} min`)}
    </div>
    ${warningHtml}
    <p>${escapeHtml(matchdayLabelFromId(matchdayId))} model context: ${escapeHtml(singleFixtureModelReason(projection, "balanced").trim())}</p>
    <p>This latest substitution check will be included in Team Export JSON until it is reset or replaced.</p>
  `;
}

function resetSubstitutionAdvisor() {
  lastSubstitutionDecision = null;
  renderDecisionToolStatuses();
  [substitutionAdvisorStarterCountrySelect, substitutionAdvisorStarterPositionSelect, substitutionAdvisorBenchCountrySelect, substitutionAdvisorBenchPositionSelect]
    .filter(Boolean)
    .forEach((select) => {
      select.value = "All";
    });
  renderDecisionPlayerSelects();
  if (substitutionAdvisorStarterInput) substitutionAdvisorStarterInput.value = "";
  if (substitutionAdvisorPointsInput) substitutionAdvisorPointsInput.value = "";
  if (substitutionAdvisorBenchInput) substitutionAdvisorBenchInput.value = "";
  if (substitutionAdvisorRiskSelect) substitutionAdvisorRiskSelect.value = "balanced";
  if (substitutionAdvisorMatchdaySelect) substitutionAdvisorMatchdaySelect.value = defaultSingleMatchdayId();

  if (substitutionAdvisorResult) {
    substitutionAdvisorResult.className = "captain-change-result substitution-advisor-result captain-change-result--empty";
    substitutionAdvisorResult.innerHTML = `
      <strong>Enter current starter points and one possible substitute.</strong>
      <p>The possible substitute should be in your squad and still unplayed in the selected matchday.</p>
    `;
  }
}

function captainScore(player) {
  const projectedCaptainScore = scoreValue(player, "finance_captain_score");

  if (activeProjection(player) && projectedCaptainScore) {
    return projectedCaptainScore;
  }

  const expectedPoints = scoreValue(player, "finance_expected_return_points", "risk_adjusted_expected_points_estimate");
  const riskAdjustedReturn = scoreValue(player, "finance_risk_adjusted_return_points", "risk_adjusted_expected_points_estimate");
  const reliability = scoreValue(player, "finance_minutes_security_score", "euro_style_reliability_score");
  const riskPenalty = scoreValue(player, "finance_composite_risk_score", "risk_composite_score") * 0.06;
  const tailRiskPenalty = scoreValue(player, "finance_tail_risk_score", "risk_tail_score") * 0.04;
  const startBoost = scoreValue(player, "start_probability_percent") * 0.08;
  const substitutionPenalty = scoreValue(player, "substitution_risk") * 0.04;

  return expectedPoints * 7 + riskAdjustedReturn * 4 + reliability * 0.2 + startBoost - riskPenalty - tailRiskPenalty - substitutionPenalty;
}

function styleReason(player, measureKey) {
  const expected = displayNumber(scoreValue(player, "finance_expected_return_points", "risk_adjusted_expected_points_estimate"));
  const riskAdjusted = displayNumber(scoreValue(player, "finance_risk_adjusted_return_points", "risk_adjusted_expected_points_estimate"));
  const per90 = displayNumber(scoreValue(player, "finance_upside_p90_points", "euro_style_points_per90_estimate"));
  const reliability = displayNumber(scoreValue(player, "finance_minutes_security_score", "euro_style_reliability_score"));
  const risk = displayNumber(scoreValue(player, "finance_composite_risk_score", "risk_composite_score"));
  const tailRisk = displayNumber(scoreValue(player, "finance_tail_risk_score", "risk_tail_score"));
  const var10 = displayNumber(scoreValue(player, "finance_var10_points"));
  const cvar20 = displayNumber(scoreValue(player, "finance_cvar20_points"));
  const context = projectionContextText(player);
  const roleText = playerRoleText(player);
  const roleSuffix = roleText ? ` Role: ${roleText}.` : "";
  const price = displayNumber(proxyPrice(player));
  const overpayRisk = displayNumber(scoreValue(player, "overpay_risk"));
  const overallFixtureText = fixtureModelReason(player);
  const attackFixtureText = fixtureModelReason(player, "attack");
  const defenseFixtureText = fixtureModelReason(player, "defense");
  const riskFixtureText = fixtureModelReason(player, "risk");

  if (measureKey === "expected") {
    return `${context}: strong projected return around ${expected} points, with ${riskAdjusted} after safety checks.${roleSuffix}${overallFixtureText}`;
  }

  if (measureKey === "safe") {
    return `${context}: reliable minutes profile with projected points around ${expected} and strong role security.${roleSuffix}${overallFixtureText}`;
  }

  if (measureKey === "upside") {
    return `${context}: high production when on the field, with ${per90} estimated points per 90.${attackFixtureText}`;
  }

  if (measureKey === "minutes") {
    return `${context}: ${roleText || `good reliability score of ${reliability}`}, useful when you want likely playing time.${overallFixtureText}`;
  }

  if (measureKey === "lowTailRisk") {
    return `${context}: safer bad-week profile with a steadier minutes and floor picture.${riskFixtureText}`;
  }

  if (measureKey === "sharpe") {
    return `${context}: balances useful reward against overall volatility.${overallFixtureText}`;
  }

  if (measureKey === "sortino") {
    return `${context}: focuses on downside protection while keeping enough projected return.${riskFixtureText}`;
  }

  if (measureKey === "bestValue") {
    return `${context}: useful projected return at ${price} budget units without too much budget pressure.${roleSuffix}${overallFixtureText}`;
  }

  if (measureKey === "cheapEnabler") {
    return `${context}: lower-price option at ${price} budget units with a playable role.${roleSuffix}${overallFixtureText}`;
  }

  if (measureKey === "premiumWorthIt") {
    return `${context}: premium spend is easier to justify because the projection and role are strong for ${price} budget units.${roleSuffix}${overallFixtureText}`;
  }

  if (measureKey === "var10") {
    return `${context}: better bad-outcome floor, with modeled 10th percentile at ${var10} points.${riskFixtureText}`;
  }

  if (measureKey === "cvar20") {
    return `${context}: stronger worst-case basket, with modeled average of the worst 20% at ${cvar20} points.${riskFixtureText}`;
  }

  if (measureKey === "omega") {
    return `${context}: good upside-to-downside balance for the selected match view.${overallFixtureText}`;
  }

  if (measureKey === "attackHeavy") {
    return `${context}: attack-first profile with projected return around ${expected} and strong per-90 upside.${attackFixtureText}`;
  }

  if (measureKey === "defensiveHeavy") {
    return `${context}: defense-first profile with useful clean-sheet or defensive-floor context.${defenseFixtureText}`;
  }

  if (measureKey === "veryRisky") {
    return `${context}: boom-or-bust profile with strong upside and a wider range of outcomes.${riskFixtureText}`;
  }

  return `${context}: good mix of projected points (${expected}), reliability, and downside protection.${roleSuffix}${overallFixtureText}`;
}

function renderTacticOptions() {
  const previousValue = tacticSelect.value;
  const formationNames = Object.keys(tactics);
  const preferredValue = tactics[previousValue]
    ? previousValue
    : tactics["4-3-3"]
      ? "4-3-3"
      : formationNames[0];

  tacticSelect.innerHTML = formationNames
    .map((formation) => `<option value="${formation}">${formation}</option>`)
    .join("");

  tacticSelect.value = preferredValue;
  summaryTactic.textContent = preferredValue;
}

function renderPositionFilterOptions() {
  const previousValue = positionFilter.value || "All";
  const positionOptions = positionOrder
    .map((position) => `<option value="${position}">${position}s</option>`)
    .join("");

  positionFilter.innerHTML = `
    <option value="All">All positions</option>
    ${positionOptions}
  `;

  selectedPositionFilter = previousValue === "All" || positionOrder.includes(previousValue)
    ? previousValue
    : "All";
  positionFilter.value = selectedPositionFilter;
}

function renderCountryFilterOptions() {
  if (!countryFilter) {
    return;
  }

  const previousValue = countryFilter.value || "All";
  const countryEligiblePlayers = players.filter((player) => playerAllowedForActiveMatchday(player));
  const countryOptions = Array.from(new Set(countryEligiblePlayers.map(playerCountryKey)))
    .sort((a, b) => countryCountLabel(a).localeCompare(countryCountLabel(b)))
    .map((countryKey) => `<option value="${escapeHtml(countryKey)}">${escapeHtml(countryCountLabel(countryKey))}</option>`)
    .join("");

  countryFilter.innerHTML = `
    <option value="All">All countries</option>
    ${countryOptions}
  `;

  const validCountryValues = new Set(["All", ...Array.from(new Set(countryEligiblePlayers.map(playerCountryKey)))]);
  selectedCountryFilter = validCountryValues.has(previousValue) ? previousValue : "All";
  countryFilter.value = selectedCountryFilter;
}

function updateRuleCopy() {
  if (heroSquadTotal) {
    heroSquadTotal.textContent = squadTotalPlayers;
  }

  if (heroSquadCopy) {
    heroSquadCopy.textContent = `squad builder with ${benchTotalPlayers}-player bench`;
  }

  if (squadRuleNote) {
    squadRuleNote.textContent = `Squad target: ${positionRequirementText()}. Rules loaded for planning.`;
  }

  if (benchDescription) {
    benchDescription.textContent = `${benchLabel()} sit outside the field. Click a starter and a bench player to try a swap.`;
  }

  benchCount.textContent = `0 / ${benchTotalPlayers}`;
  summaryLocked.textContent = `0 / ${squadTotalPlayers}`;
  summaryPrice.textContent = budgetText(0);
  summaryBudget.textContent = budgetText(initialBudget);
  renderRuleChecks();
  renderPortfolioAnalytics();
  renderSquadStrategyReport();
  teamExportOutput.value = "";
  teamExportPanel.classList.add("hidden");
  swapMessage.textContent = `Build a full ${squadLabel()} first, then click a starter and a bench player to swap them.`;
  teamMessage.textContent = `Lock a few players first, then click "${builderActionLabel()}" to optimize the ${squadLabel()}.`;
}

function updateTeamSummary(tacticName, totalPrice, averageRisk, squadCount) {
  summaryTactic.textContent = tacticName;
  summaryPrice.textContent = budgetText(totalPrice);
  summaryBudget.textContent = remainingBudgetText(totalPrice);
  summaryBudget.closest(".summary-chip")?.classList.toggle("summary-chip--warning", totalPrice > initialBudget);
  summaryRisk.textContent = averageRisk.toFixed(0);
  summaryLocked.textContent = `${squadCount} / ${squadTotalPlayers}`;
}

function countryCountsFromPlayers(playerList) {
  return playerList.reduce((counts, player) => {
    const countryKey = playerCountryKey(player);
    counts[countryKey] = (counts[countryKey] || 0) + 1;
    return counts;
  }, {});
}

function countryCountEntries(countryCounts) {
  return Object.entries(countryCounts).sort((a, b) => {
    const countDifference = b[1] - a[1];

    if (countDifference !== 0) {
      return countDifference;
    }

    return countryCountLabel(a[0]).localeCompare(countryCountLabel(b[0]));
  });
}

function countryLimitViolations(countryCounts) {
  return countryCountEntries(countryCounts).filter(([, count]) => count > groupStageCountryLimit);
}

function canAddCountry(player, countryCounts) {
  const countryKey = playerCountryKey(player);
  return (countryCounts[countryKey] || 0) < groupStageCountryLimit;
}

function incrementCountryCount(countryCounts, player) {
  const countryKey = playerCountryKey(player);
  countryCounts[countryKey] = (countryCounts[countryKey] || 0) + 1;
}

function positionsMatchRequirements(positionCounts, requirements) {
  return positionOrder.every((position) => positionCounts[position] === requirements[position]);
}

function validationItem(label, passed, detail) {
  return { label, passed, detail };
}

function buildRuleValidations(starters, bench, tacticName) {
  const squad = [...starters, ...bench];
  const totalPrice = squadCost(squad);
  const positionCounts = countsByPosition(squad);
  const countryCounts = countryCountsFromPlayers(squad);
  const countryViolations = countryLimitViolations(countryCounts);
  const startingCounts = countsByPosition(starters);
  const tacticRequirements = tactics[tacticName];
  const formationAllowed = Boolean(tacticRequirements) && positionsMatchRequirements(startingCounts, tacticRequirements);

  return [
    validationItem(
      "Squad size",
      squad.length === squadTotalPlayers,
      squad.length === squadTotalPlayers
        ? `Squad has exactly ${squadTotalPlayers} players.`
        : `Squad has ${squad.length} of ${squadTotalPlayers} players.`
    ),
    validationItem(
      "Positions",
      positionsMatchRequirements(positionCounts, squadRequirements),
      positionsMatchRequirements(positionCounts, squadRequirements)
        ? `Position counts match ${compactPositionRequirementText()}.`
        : `Current positions are ${compactPositionRequirementText(positionCounts)}; required is ${compactPositionRequirementText()}.`
    ),
    validationItem(
      "Budget",
      totalPrice <= initialBudget + 0.001,
      totalPrice <= initialBudget + 0.001
        ? `Total price is ${budgetText(totalPrice)} of ${budgetText(initialBudget)}.`
        : `Total price is ${budgetText(totalPrice)}, which is over the ${budgetText(initialBudget)} budget.`
    ),
    validationItem(
      "Country limit",
      countryViolations.length === 0,
      countryViolations.length === 0
        ? `No country has more than ${groupStageCountryLimit} players.`
        : `${countryViolations.map(([countryKey, count]) => `${countryCountLabel(countryKey)} has ${count}`).join(", ")}; max is ${groupStageCountryLimit}.`
    ),
    validationItem(
      "Starting 11",
      starters.length === startingLineupTotal,
      starters.length === startingLineupTotal
        ? `Starting lineup has exactly ${startingLineupTotal} players.`
        : `Starting lineup has ${starters.length} of ${startingLineupTotal} players.`
    ),
    validationItem(
      "Formation",
      formationAllowed,
      formationAllowed
        ? `${tacticName} is allowed and the starters match it.`
        : `${tacticName} is not valid for the current starters. Allowed formations: ${formationListText()}.`
    )
  ];
}

function renderValidationList(validations) {
  rulesValidationList.innerHTML = validations.map((rule) => `
    <li class="rule-validation-item ${rule.passed ? "rule-validation-item--pass" : "rule-validation-item--fail"}">
      <span class="rule-validation-status">${rule.passed ? "PASS" : "FAIL"}</span>
      <div>
        <strong>${rule.label}</strong>
        <p>${rule.detail}</p>
      </div>
    </li>
  `).join("");
}

function renderRuleChecks(starters = [], bench = [], tacticName = tacticSelect.value) {
  const squad = [...starters, ...bench];
  const countryCounts = countryCountsFromPlayers(squad);
  const entries = countryCountEntries(countryCounts);
  const violations = countryLimitViolations(countryCounts);
  const needsCheckCount = countryCounts.needs_check || 0;

  if (!squad.length) {
    ruleCheckSummary.textContent = `Build a squad to validate squad size, positions, budget, country limits, starting 11, and formation.`;
    rulesValidationList.innerHTML = "";
    countryCountsList.innerHTML = "";
    return;
  }

  renderValidationList(buildRuleValidations(starters, bench, tacticName));

  const summaryParts = violations.length
    ? [`Country limit issue: ${violations.map(([countryKey, count]) => `${countryCountLabel(countryKey)} has ${count}`).join(", ")}.`]
    : [`Validation complete. Country limit passed: no country has more than ${groupStageCountryLimit} players.`];

  if (needsCheckCount) {
    summaryParts.push("Players without a listed country are counted together for the country limit.");
  }

  ruleCheckSummary.textContent = summaryParts.join(" ");
  countryCountsList.innerHTML = entries.map(([countryKey, count]) => {
    const isOverLimit = count > groupStageCountryLimit;
    const needsCheck = countryKey === "needs_check";
    const classes = [
      "country-count-chip",
      isOverLimit ? "country-count-chip--warning" : "",
      needsCheck ? "country-count-chip--needs-check" : ""
    ].filter(Boolean).join(" ");

    return `
      <span class="${classes}">
        ${countryCountLabel(countryKey)}
        <strong>${count}/${groupStageCountryLimit}</strong>
      </span>
    `;
  }).join("");
}

function sumPlayerField(playerList, ...fieldNames) {
  return playerList.reduce((sum, player) => sum + scoreValue(player, ...fieldNames), 0);
}

function averagePlayerField(playerList, ...fieldNames) {
  return playerList.length ? sumPlayerField(playerList, ...fieldNames) / playerList.length : 0;
}

function portfolioNumber(number, suffix = "") {
  return `${displayNumber(number)}${suffix}`;
}

function portfolioMetric(label, valueToDisplay, note = "") {
  return `
    <article class="portfolio-metric">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(valueToDisplay)}</strong>
      ${note ? `<small>${escapeHtml(note)}</small>` : ""}
    </article>
  `;
}

function portfolioWarningItem(kind, label, detail) {
  return `
    <article class="portfolio-warning portfolio-warning--${kind}">
      <strong>${escapeHtml(label)}</strong>
      <p>${escapeHtml(detail)}</p>
    </article>
  `;
}

function matchdayFixturePortfolio(starters) {
  const matchdayIds = activeEnvironmentMatchdayIds();

  return matchdayIds.map((matchdayId) => {
    const projections = starters
      .map((player) => projectionForPlayerMatchday(player, matchdayId))
      .filter(Boolean);
    const contexts = projections.map(projectionMatchContext);
    const hardFixtures = projections.filter((projection) => fieldNumber(projection, "fixture_difficulty_score") >= 70).length;
    const favorableFixtures = projections.filter((projection) => fieldNumber(projection, "fixture_difficulty_score") <= 35).length;
    const avgXg = averageProjectionField(projections, "team_expected_goals");
    const avgCleanSheet = averageProjectionField(projections, "team_clean_sheet_probability");
    const highUncertaintyStarters = contexts.filter((context) => context.matchUncertainty === "High").length;
    const uncertainStarters = contexts.filter((context) => ["High", "Medium"].includes(context.matchUncertainty)).length;
    const strongProjectedXgStarters = contexts.filter((context) => Number.isFinite(context.teamProjectedXg) && context.teamProjectedXg >= 1.85).length;
    const goodCleanSheetContexts = contexts.filter((context) => ["Strong", "Good"].includes(context.cleanSheetContext)).length;

    return {
      matchdayId,
      label: matchdayLabelFromId(matchdayId),
      hardFixtures,
      favorableFixtures,
      avgXg,
      avgCleanSheet,
      highUncertaintyStarters,
      uncertainStarters,
      strongProjectedXgStarters,
      goodCleanSheetContexts
    };
  });
}

function strategyReportFixtureLabel(projection, matchdayId) {
  const matchNumber = projection?.match_number
    ? `Match ${projection.match_number}`
    : projection?.fixture_id || "fixture";

  return `${projection?.matchday_label || matchdayLabelFromId(matchdayId)} ${matchNumber}`;
}

function starterFixtureStackEntries(starters) {
  const matchdayIds = activeEnvironmentMatchdayIds();
  const fixtureCounts = new Map();

  starters.forEach((player) => {
    matchdayIds.forEach((matchdayId) => {
      const projection = projectionForPlayerMatchday(player, matchdayId);

      if (!projectionIsAvailable(projection)) {
        return;
      }

      const context = projectionMatchContext(projection);
      const key = projection.fixture_id || `${matchdayId}-${projection.opponent_team_id || projection.opponent || player.id}`;
      const current = fixtureCounts.get(key) || {
        key,
        label: strategyReportFixtureLabel(projection, matchdayId),
        count: 0,
        hardFixtures: 0,
        favorableFixtures: 0,
        teamXgSum: 0,
        attackEnvironmentSum: 0,
        uncertaintyScoreSum: 0,
        uncertainStarters: 0,
        highUncertaintyStarters: 0,
        goodCleanSheetContexts: 0
      };
      const difficulty = fieldNumber(projection, "fixture_difficulty_score");

      current.count += 1;
      current.teamXgSum += firstFiniteNumberOrNull(context.teamProjectedXg, fieldNumber(projection, "team_expected_goals")) || 0;
      current.attackEnvironmentSum += firstFiniteNumberOrNull(context.attackingEnvironmentScore, fieldNumber(projection, "team_attacking_environment_score")) || 0;
      current.uncertaintyScoreSum += context.matchUncertaintyScore;

      if (["High", "Medium"].includes(context.matchUncertainty)) {
        current.uncertainStarters += 1;
      }

      if (context.matchUncertainty === "High") {
        current.highUncertaintyStarters += 1;
      }

      if (["Strong", "Good"].includes(context.cleanSheetContext)) {
        current.goodCleanSheetContexts += 1;
      }

      if (difficulty >= 70) {
        current.hardFixtures += 1;
      }

      if (difficulty <= 35) {
        current.favorableFixtures += 1;
      }

      fixtureCounts.set(key, current);
    });
  });

  return Array.from(fixtureCounts.values())
    .map((entry) => ({
      ...entry,
      avgTeamXg: entry.count ? entry.teamXgSum / entry.count : 0,
      avgAttackEnvironment: entry.count ? entry.attackEnvironmentSum / entry.count : 0,
      avgUncertaintyScore: entry.count ? entry.uncertaintyScoreSum / entry.count : 0,
      uncertainStackLoad: Math.max(0, entry.count - 1) * (entry.count ? entry.uncertaintyScoreSum / entry.count : 0)
    }))
    .sort((a, b) =>
      b.count - a.count ||
      b.highUncertaintyStarters - a.highUncertaintyStarters ||
      b.hardFixtures - a.hardFixtures ||
      b.avgTeamXg - a.avgTeamXg ||
      a.label.localeCompare(b.label)
    );
}

function portfolioRiskLevel(analytics) {
  if (
    analytics.tailRiskAverage >= 70 ||
    analytics.benchWeakCount >= 3 ||
    analytics.hardestMatchdayHardFixtures >= 5 ||
    analytics.totalHighUncertaintyStarters >= 5 ||
    analytics.uncertainFixtureStackLoad >= 3.2
  ) {
    return { id: "high", label: "High Risk" };
  }

  if (
    analytics.tailRiskAverage >= 55 ||
    analytics.benchWeakCount >= 2 ||
    analytics.hardestMatchdayHardFixtures >= 3 ||
    analytics.totalHighUncertaintyStarters >= 3 ||
    analytics.uncertainFixtureStackLoad >= 1.8
  ) {
    return { id: "medium", label: "Medium Risk" };
  }

  return { id: "low", label: "Lower Risk" };
}

function squadPortfolioAnalytics(starters = [], bench = []) {
  const squad = [...starters, ...bench];
  const starterVolatility = Math.sqrt(starters.reduce((sum, player) => {
    const volatility = scoreValue(player, "finance_volatility_points");
    return sum + volatility * volatility;
  }, 0));
  const starterQaFlags = starters.map((player) => qaFlagsForPlayer(player, measureKeyForTrust(activeMeasure())));
  const squadQaFlags = squad.map((player) => qaFlagsForPlayer(player, measureKeyForTrust(activeMeasure())));
  const squadQaStatuses = squadQaFlags.map(qaStatusFromFlags);
  const qaReviewCount = squadQaStatuses.filter((status) => status === "review").length;
  const qaWatchCount = squadQaStatuses.filter((status) => status === "watch").length;
  const benchWeakCount = bench.filter((player) =>
    scoreValue(player, "start_probability_percent") < 35 ||
    scoreValue(player, "expected_minutes_v0") < 30
  ).length;
  const premiumPlayers = squad.filter((player) => proxyPrice(player) >= 9.5).length;
  const countryEntries = countryCountEntries(countryCountsFromPlayers(squad));
  const topCountry = countryEntries[0] || ["none", 0];
  const fixtureRows = matchdayFixturePortfolio(starters);
  const hardestMatchday = [...fixtureRows].sort((a, b) => b.hardFixtures - a.hardFixtures)[0] || null;
  const fixtureStackEntries = starterFixtureStackEntries(starters);
  const topFixture = fixtureStackEntries[0] || null;
  const topUncertainFixtureStack = [...fixtureStackEntries]
    .filter((entry) => entry.count >= 2 && entry.avgUncertaintyScore >= 0.5)
    .sort((a, b) => b.uncertainStackLoad - a.uncertainStackLoad || b.count - a.count)[0] || null;
  const starterEnvironmentRows = starters.map((player) => ({
    player,
    summary: playerMatchEnvironmentSummary(player)
  }));
  const starterContexts = starterEnvironmentRows.flatMap((entry) =>
    entry.summary.contexts.map((context) => ({ player: entry.player, context }))
  );
  const attackingStarterContexts = starterContexts.filter((entry) =>
    ["Forward", "Midfielder"].includes(entry.player.position)
  );
  const defensiveStarterContexts = starterContexts.filter((entry) =>
    ["Goalkeeper", "Defender"].includes(entry.player.position)
  );
  const finalRoundTimingRows = activeMatchdayId === "finalRound"
    ? squad.map((player) => ({ player, metrics: finalRoundPlayerStrategicMetrics(player) }))
    : [];
  const finalRoundStarterTimingRows = activeMatchdayId === "finalRound"
    ? starters.map((player) => ({ player, metrics: finalRoundPlayerStrategicMetrics(player) }))
    : [];
  const finalRoundEligibleCandidates = activeMatchdayId === "finalRound"
    ? players.filter((player) =>
      playerAllowedForActiveMatchday(player) &&
      !excludedPlayerIds.has(player.id) &&
      scoreValue(player, "start_probability_percent") >= 52 &&
      scoreValue(player, "finance_risk_adjusted_return_points", "risk_adjusted_expected_points_estimate") >= 2.6
    )
    : [];
  const viableEarlyFixtureCandidates = finalRoundEligibleCandidates.filter((player) =>
    finalRoundPlayerStrategicMetrics(player).fixtureTiming === "early"
  ).length;
  const finalRoundOptionalityScore = finalRoundTimingRows.reduce((sum, entry) =>
    sum + entry.metrics.replacementOptionValue,
  0);
  const finalRoundStarterOptionalityScore = finalRoundStarterTimingRows.reduce((sum, entry) =>
    sum + entry.metrics.replacementOptionValue,
  0);
  const earlyFixturePlayers = finalRoundTimingRows.filter((entry) => entry.metrics.fixtureTiming === "early").length;
  const lateFixturePlayers = finalRoundTimingRows.filter((entry) => entry.metrics.fixtureTiming === "late").length;
  const earlyFixtureStarters = finalRoundStarterTimingRows.filter((entry) => entry.metrics.fixtureTiming === "early").length;
  const lateFixtureStarters = finalRoundStarterTimingRows.filter((entry) => entry.metrics.fixtureTiming === "late").length;

  return {
    squad,
    starters,
    bench,
    starterExpected: sumPlayerField(starters, "finance_expected_return_points", "risk_adjusted_expected_points_estimate"),
    starterRiskAdjusted: sumPlayerField(starters, "finance_risk_adjusted_return_points", "risk_adjusted_expected_points_estimate"),
    squadExpected: sumPlayerField(squad, "finance_expected_return_points", "risk_adjusted_expected_points_estimate"),
    starterUpside: sumPlayerField(starters, "finance_upside_p90_points", "euro_style_points_per90_estimate"),
    startAverage: averagePlayerField(starters, "start_probability_percent"),
    expectedMinutesTotal: sumPlayerField(starters, "expected_minutes_v0"),
    starterVolatility,
    starterVar10: sumPlayerField(starters, "finance_var10_points"),
    starterCvar20: sumPlayerField(starters, "finance_cvar20_points"),
    tailRiskAverage: averagePlayerField(squad, "finance_tail_risk_score", "risk_tail_score"),
    compositeRiskAverage: averagePlayerField(squad, "finance_composite_risk_score", "risk_composite_score"),
    qaReviewCount,
    qaWatchCount,
    benchWeakCount,
    premiumPlayers,
    topCountry,
    countryEntries,
    fixtureRows,
    fixtureStackEntries,
    topFixture,
    topUncertainFixtureStack,
    hardestMatchdayHardFixtures: hardestMatchday?.hardFixtures || 0,
    totalHardFixtureStarters: fixtureRows.reduce((sum, row) => sum + row.hardFixtures, 0),
    totalFavorableFixtureStarters: fixtureRows.reduce((sum, row) => sum + row.favorableFixtures, 0),
    totalHighUncertaintyStarters: fixtureRows.reduce((sum, row) => sum + row.highUncertaintyStarters, 0),
    totalUncertainStarters: fixtureRows.reduce((sum, row) => sum + row.uncertainStarters, 0),
    strongProjectedXgStarters: attackingStarterContexts.filter((entry) =>
      Number.isFinite(entry.context.teamProjectedXg) && entry.context.teamProjectedXg >= 1.85
    ).length,
    lowProjectedXgAttackers: attackingStarterContexts.filter((entry) =>
      Number.isFinite(entry.context.teamProjectedXg) && entry.context.teamProjectedXg <= 0.9
    ).length,
    goodCleanSheetDefenders: defensiveStarterContexts.filter((entry) =>
      ["Strong", "Good"].includes(entry.context.cleanSheetContext)
    ).length,
    difficultCleanSheetDefenders: defensiveStarterContexts.filter((entry) =>
      entry.context.cleanSheetContext === "Difficult"
    ).length,
    averageMatchUncertaintyScore: averageFiniteValues(starterContexts.map((entry) => entry.context.matchUncertaintyScore)) ?? 0,
    uncertainFixtureStackLoad: fixtureStackEntries.reduce((sum, entry) => sum + entry.uncertainStackLoad, 0),
    finalRoundOptionalityScore,
    finalRoundStarterOptionalityScore,
    finalRoundEarlyFixturePlayers: earlyFixturePlayers,
    finalRoundLateFixturePlayers: lateFixturePlayers,
    finalRoundEarlyFixtureStarters: earlyFixtureStarters,
    finalRoundLateFixtureStarters: lateFixtureStarters,
    finalRoundViableEarlyFixtureCandidates: viableEarlyFixtureCandidates,
    finalRoundMissingEarlyFixture: activeMatchdayId === "finalRound" && viableEarlyFixtureCandidates > 0 && earlyFixturePlayers === 0,
    hardestMatchday
  };
}

function portfolioStrategyShape(analytics) {
  const starterExpectedScores = analytics.starters
    .map((player) => Math.max(0, scoreValue(player, "finance_expected_return_points", "risk_adjusted_expected_points_estimate")))
    .sort((a, b) => b - a);
  const topThreeExpected = starterExpectedScores.slice(0, 3).reduce((sum, score) => sum + score, 0);
  const topThreeShare = analytics.starterExpected > 0 ? topThreeExpected / analytics.starterExpected : 0;
  const benchExpected = sumPlayerField(analytics.bench, "finance_expected_return_points", "risk_adjusted_expected_points_estimate");
  const playableBenchCount = Math.max(0, analytics.bench.length - analytics.benchWeakCount);
  const benchPlayableShare = analytics.bench.length ? playableBenchCount / analytics.bench.length : 0;
  const benchAverageStart = averagePlayerField(analytics.bench, "start_probability_percent");
  const benchStrengthScore = analytics.bench.length
    ? benchPlayableShare * 70 + Math.min(30, benchAverageStart * 0.3)
    : 0;
  const totalPrice = squadCost(analytics.squad);
  const budgetRemaining = initialBudget - totalPrice;
  const valueEfficiency = analytics.squad.length
    ? analytics.squad.reduce((sum, player) => sum + measureScore(player, measures.bestValue), 0) / analytics.squad.length
    : 0;
  const premiumPlayers = analytics.squad.filter((player) => proxyPrice(player) >= 9.5);
  const justifiedPremiumCount = premiumPlayers.filter((player) =>
    measureScore(player, measures.premiumWorthIt) >= 70 ||
    scoreValue(player, "finance_expected_return_points", "risk_adjusted_expected_points_estimate") >= 5.5 ||
    captainRecommendationScore(player) >= 75
  ).length;
  const poorPremiumCount = premiumPlayers.filter((player) =>
    measureScore(player, measures.premiumWorthIt) < 55 &&
    scoreValue(player, "finance_expected_return_points", "risk_adjusted_expected_points_estimate") < 4.5
  ).length;
  const countryStackPressure = Math.max(0, analytics.topCountry[1] - 1);
  const topFixtureCount = analytics.topFixture?.count || 0;
  const fixtureStackPressure = Math.max(0, topFixtureCount - 1);
  const excessiveStackLoad = analytics.fixtureStackEntries
    .reduce((sum, entry) => sum + Math.max(0, entry.count - 3), 0);
  const controlledStackScore = analytics.fixtureStackEntries.reduce((sum, entry) => {
    if (entry.count < 2 || entry.count > 3) {
      return sum;
    }

    const attackLift = Math.max(0, entry.avgTeamXg - 1.25) * 8 +
      Math.max(0, entry.avgAttackEnvironment - 55) * 0.12 +
      entry.favorableFixtures * 0.45;

    return sum + attackLift * entry.count;
  }, 0);
  const attackingStackScore = analytics.fixtureStackEntries.reduce((sum, entry) =>
    sum + Math.max(0, entry.avgTeamXg - 1.35) * entry.count * 6 +
      Math.max(0, entry.avgAttackEnvironment - 60) * entry.count * 0.08,
  0);

  return {
    topThreeExpected,
    topThreeShare,
    starDependenceLoad: Math.max(0, topThreeShare - 0.36) * 100,
    benchExpected,
    playableBenchCount,
    benchPlayableShare,
    benchStrengthScore,
    totalPrice,
    budgetRemaining,
    budgetUse: Math.max(0, totalPrice - initialBudget * 0.92),
    valueEfficiency,
    justifiedPremiumCount,
    poorPremiumCount,
    countryStackPressure,
    fixtureStackPressure,
    excessiveStackLoad,
    controlledStackScore,
    attackingStackScore
  };
}

function portfolioWarningsForAnalytics(analytics) {
  const warnings = [];
  const topCountryLabel = countryCountLabel(analytics.topCountry[0]);
  const topCountryCount = analytics.topCountry[1];

  if (analytics.premiumPlayers >= 3 && analytics.benchWeakCount >= 2) {
    warnings.push({
      kind: "review",
      label: "Budget Pressure",
      detail: `${analytics.premiumPlayers} premium players are forcing ${analytics.benchWeakCount} weak bench or low-minutes picks.`
    });
  } else if (analytics.benchWeakCount >= 2) {
    warnings.push({
      kind: "watch",
      label: "Bench Fragility",
      detail: `${analytics.benchWeakCount} bench player${analytics.benchWeakCount === 1 ? "" : "s"} have low start probability or low expected minutes.`
    });
  }

  if (topCountryCount >= groupStageCountryLimit) {
    warnings.push({
      kind: "watch",
      label: "Country Stack Risk",
      detail: `${topCountryLabel} is at the ${activeCountryLimitLabel()} country limit with ${topCountryCount}/${groupStageCountryLimit} players.`
    });
  }

  if (analytics.topUncertainFixtureStack) {
    warnings.push({
      kind: analytics.topUncertainFixtureStack.avgUncertaintyScore >= 0.75 ? "review" : "watch",
      label: "Fixture Stack Risk",
      detail: `${analytics.topUncertainFixtureStack.label} combines ${analytics.topUncertainFixtureStack.count} starters with ${analytics.topUncertainFixtureStack.avgUncertaintyScore >= 0.75 ? "high" : "medium"} match uncertainty.`
    });
  } else if (analytics.hardestMatchdayHardFixtures >= 3) {
    warnings.push({
      kind: "watch",
      label: "Fixture Stack Risk",
      detail: `${analytics.hardestMatchday.label} has ${analytics.hardestMatchdayHardFixtures} starters in hard fixtures.`
    });
  }

  if (analytics.tailRiskAverage >= 65 || analytics.totalHighUncertaintyStarters >= 4) {
    warnings.push({
      kind: "review",
      label: "Bad-Week Floor",
      detail: `Average squad tail risk is ${displayNumber(analytics.tailRiskAverage)}, with ${analytics.totalHighUncertaintyStarters} high-uncertainty starter spot${analytics.totalHighUncertaintyStarters === 1 ? "" : "s"}.`
    });
  }

  if (activeMatchdayId === "finalRound") {
    if (analytics.finalRoundMissingEarlyFixture) {
      warnings.push({
        kind: "review",
        label: "Early Fixture Exposure",
        detail: "The squad has no earlier Third Place exposure despite viable early-fixture candidates. Earlier kickoff can add manual-substitution flexibility if FIFA rules and locks allow it."
      });
    } else if (analytics.finalRoundEarlyFixturePlayers > 0) {
      warnings.push({
        kind: "watch",
        label: "Early Fixture Optionality",
        detail: `${analytics.finalRoundEarlyFixturePlayers} squad player${analytics.finalRoundEarlyFixturePlayers === 1 ? "" : "s"} come from the earlier fixture. Treat this as strategic flexibility and verify FIFA substitution, captain, and lock rules.`
      });
    }
  }

  if (!warnings.length) {
    warnings.push({
      kind: "pass",
      label: "Portfolio Health",
      detail: "No major squad-level portfolio warning is triggered by the current model thresholds."
    });
  }

  return warnings;
}

function portfolioOptimizerWeights(mode = activeTrustMode(), measure = activeMeasure(), profile = teamBuilderStrategyScoringProfile()) {
  const weights = {
    ...teamBuilderStrategyScoringProfiles.balancedSquad.portfolioWeights,
    ...(profile.portfolioWeights || {})
  };
  const measureKey = measureKeyForTrust(measure);

  if (mode.id === "strict") {
    weights.riskAdjusted += 0.04;
    weights.var10 += 0.05;
    weights.cvar20 += 0.04;
    weights.start += 0.04;
    weights.minutes += 0.006;
    weights.tailPenalty += 0.03;
    weights.compositePenalty += 0.02;
    weights.weakBenchPenalty += 0.45;
    weights.qaReviewPenalty += 0.7;
  } else if (mode.id === "aggressive") {
    weights.expected += 0.03;
    weights.upside += 0.04;
    weights.attackingStackReward += 0.08;
    weights.var10 *= 0.75;
    weights.cvar20 *= 0.75;
    weights.tailPenalty *= 0.75;
    weights.weakBenchPenalty *= 0.75;
  } else if (mode.id === "chaos") {
    weights.expected += 0.02;
    weights.upside += 0.08;
    weights.attackingStackReward += 0.12;
    weights.controlledStackReward += 0.15;
    weights.var10 *= 0.45;
    weights.cvar20 *= 0.45;
    weights.volatilityPenalty *= 0.4;
    weights.tailPenalty *= 0.45;
    weights.weakBenchPenalty *= 0.45;
  }

  if (["safeFloor", "tailRiskAvoidance", "sharpe", "sortino", "var10", "cvar20"].includes(measureKey)) {
    weights.riskAdjusted += 0.05;
    weights.var10 += 0.06;
    weights.cvar20 += 0.05;
    weights.tailPenalty += 0.03;
    weights.weakBenchPenalty += 0.4;
  }

  if (["attackHeavy", "upside", "veryRisky", "premiumWorthIt"].includes(measureKey)) {
    weights.expected += 0.03;
    weights.upside += 0.05;
    weights.var10 *= 0.7;
    weights.cvar20 *= 0.7;
    weights.favorableFixtureReward += 0.08;
  }

  if (measureKey === "defensiveHeavy") {
    weights.hardFixturePenalty += 0.35;
    weights.favorableFixtureReward += 0.05;
    weights.tailPenalty += 0.02;
  }

  return weights;
}

function portfolioOptimizerAdjustment(starters, bench, measure = activeMeasure(), mode = activeTrustMode(), profile = teamBuilderStrategyScoringProfile()) {
  const analytics = squadPortfolioAnalytics(starters, bench);
  const weights = portfolioOptimizerWeights(mode, measure, profile);
  const shape = portfolioStrategyShape(analytics);
  const premiumSqueeze = analytics.premiumPlayers >= 3 && analytics.benchWeakCount >= 2
    ? analytics.premiumPlayers + analytics.benchWeakCount
    : 0;
  const countryLimitLoad = analytics.topCountry[1] >= groupStageCountryLimit
    ? analytics.topCountry[1] - 1
    : 0;
  const hardFixtureLoad = Math.max(0, analytics.hardestMatchdayHardFixtures - 2);
  const tailLoad = Math.max(0, analytics.tailRiskAverage - 50);
  const compositeLoad = Math.max(0, analytics.compositeRiskAverage - 45);
  const volatilityLoad = Math.max(0, analytics.starterVolatility - 12);
  const premiumConcentrationLoad = Math.max(0, analytics.premiumPlayers - 2);
  const startLift = analytics.startAverage - 55;
  const minutesLift = analytics.expectedMinutesTotal - 600;
  const finalRoundOptionalityReward = activeMatchdayId === "finalRound"
    ? analytics.finalRoundOptionalityScore * (weights.finalRoundOptionalityReward || 0) +
      analytics.finalRoundEarlyFixturePlayers * (weights.finalRoundEarlyFixtureReward || 0)
    : 0;
  const finalRoundMissingEarlyFixturePenalty = activeMatchdayId === "finalRound" && analytics.finalRoundMissingEarlyFixture
    ? weights.finalRoundMissingEarlyFixturePenalty || 0
    : 0;
  const score =
    analytics.starterExpected * weights.expected +
    analytics.starterRiskAdjusted * weights.riskAdjusted +
    analytics.starterUpside * weights.upside +
    analytics.starterVar10 * weights.var10 +
    analytics.starterCvar20 * weights.cvar20 +
    startLift * weights.start +
    minutesLift * weights.minutes +
    shape.benchExpected * weights.benchExpectedReward +
    shape.benchStrengthScore * weights.benchStrengthReward +
    shape.valueEfficiency * weights.valueEfficiencyReward +
    shape.budgetUse * weights.budgetUseReward +
    Math.max(0, shape.budgetRemaining) * weights.budgetRemainingReward +
    shape.topThreeExpected * weights.topProjectedReward +
    shape.justifiedPremiumCount * weights.premiumReward +
    analytics.premiumPlayers * (weights.premiumCountReward || 0) +
    shape.controlledStackScore * weights.controlledStackReward +
    shape.attackingStackScore * weights.attackingStackReward +
    analytics.totalFavorableFixtureStarters * weights.favorableFixtureReward -
    analytics.totalHighUncertaintyStarters * (weights.matchUncertaintyPenalty || 0) -
    analytics.uncertainFixtureStackLoad * (weights.uncertainFixtureStackPenalty || 0) +
    analytics.strongProjectedXgStarters * (weights.strongXgReward || 0) +
    analytics.goodCleanSheetDefenders * (weights.cleanSheetContextReward || 0) -
    analytics.lowProjectedXgAttackers * (weights.lowXgPenalty || 0) -
    analytics.difficultCleanSheetDefenders * (weights.difficultCleanSheetPenalty || 0) -
    finalRoundMissingEarlyFixturePenalty +
    finalRoundOptionalityReward -
    volatilityLoad * weights.volatilityPenalty -
    tailLoad * weights.tailPenalty -
    compositeLoad * weights.compositePenalty -
    analytics.qaReviewCount * weights.qaReviewPenalty -
    analytics.qaWatchCount * weights.qaWatchPenalty -
    analytics.benchWeakCount * weights.weakBenchPenalty -
    premiumSqueeze * weights.premiumSqueezePenalty -
    premiumConcentrationLoad * (weights.premiumConcentrationPenalty || 0) -
    countryLimitLoad * weights.countryLimitPenalty -
    hardFixtureLoad * weights.hardFixturePenalty -
    shape.countryStackPressure * weights.countryStackPenalty -
    shape.fixtureStackPressure * weights.fixtureStackPenalty -
    shape.starDependenceLoad * weights.starDependencePenalty -
    shape.poorPremiumCount * weights.poorPremiumPenalty -
    shape.excessiveStackLoad * weights.excessiveStackPenalty;

  return {
    version: profile.version || teamBuilderOptimizerVersion,
    mode: mode.id,
    mode_label: mode.label,
    strategy_id: profile.id,
    strategy_label: teamBuilderStrategyOption(profile.id).label,
    measure_key: measureKeyForTrust(measure),
    adjustment_score: Number(score.toFixed(2)),
    inputs: {
      starter_expected_points: Number(analytics.starterExpected.toFixed(1)),
      starter_risk_adjusted_points: Number(analytics.starterRiskAdjusted.toFixed(1)),
      starter_upside_points: Number(analytics.starterUpside.toFixed(1)),
      starter_var10_points: Number(analytics.starterVar10.toFixed(1)),
      starter_cvar20_points: Number(analytics.starterCvar20.toFixed(1)),
      average_start_probability_percent: Number(analytics.startAverage.toFixed(1)),
      expected_minutes_starting_xi: Number(analytics.expectedMinutesTotal.toFixed(1)),
      starter_volatility_points: Number(analytics.starterVolatility.toFixed(1)),
      average_tail_risk: Number(analytics.tailRiskAverage.toFixed(1)),
      average_composite_risk: Number(analytics.compositeRiskAverage.toFixed(1)),
      qa_review_players: analytics.qaReviewCount,
      qa_watch_players: analytics.qaWatchCount,
      weak_bench_players: analytics.benchWeakCount,
      premium_players: analytics.premiumPlayers,
      justified_premium_players: shape.justifiedPremiumCount,
      poor_premium_players: shape.poorPremiumCount,
      premium_count_weight: Number((weights.premiumCountReward || 0).toFixed(2)),
      premium_concentration_load: premiumConcentrationLoad,
      premium_concentration_weight: Number((weights.premiumConcentrationPenalty || 0).toFixed(2)),
      top_country_count: analytics.topCountry[1],
      top_fixture_count: analytics.topFixture?.count || 0,
      top_three_projected_share: Number(shape.topThreeShare.toFixed(3)),
      bench_strength_score: Number(shape.benchStrengthScore.toFixed(1)),
      bench_expected_points: Number(shape.benchExpected.toFixed(1)),
      value_efficiency_score: Number(shape.valueEfficiency.toFixed(1)),
      controlled_stack_score: Number(shape.controlledStackScore.toFixed(1)),
      attacking_stack_score: Number(shape.attackingStackScore.toFixed(1)),
      hardest_matchday_hard_fixtures: analytics.hardestMatchdayHardFixtures,
      total_favorable_fixture_starters: analytics.totalFavorableFixtureStarters,
      high_uncertainty_starter_spots: analytics.totalHighUncertaintyStarters,
      uncertain_fixture_stack_load: Number(analytics.uncertainFixtureStackLoad.toFixed(2)),
      strong_projected_xg_starter_spots: analytics.strongProjectedXgStarters,
      good_clean_sheet_defender_spots: analytics.goodCleanSheetDefenders,
      low_projected_xg_attacker_spots: analytics.lowProjectedXgAttackers,
      difficult_clean_sheet_defender_spots: analytics.difficultCleanSheetDefenders,
      final_round_optionality_score: Number(analytics.finalRoundOptionalityScore.toFixed(2)),
      final_round_starter_optionality_score: Number(analytics.finalRoundStarterOptionalityScore.toFixed(2)),
      final_round_early_fixture_players: analytics.finalRoundEarlyFixturePlayers,
      final_round_late_fixture_players: analytics.finalRoundLateFixturePlayers,
      final_round_early_fixture_starters: analytics.finalRoundEarlyFixtureStarters,
      final_round_late_fixture_starters: analytics.finalRoundLateFixtureStarters,
      final_round_viable_early_fixture_candidates: analytics.finalRoundViableEarlyFixtureCandidates,
      final_round_missing_early_fixture_penalty: Number(finalRoundMissingEarlyFixturePenalty.toFixed(2)),
      final_round_optionality_reward: Number(finalRoundOptionalityReward.toFixed(2))
    },
    note: "Strategy-aware optimizer adjustment that nudges completed legal squads toward the selected public Team Builder strategy, including fixture xG, clean-sheet context, match uncertainty, and Final Round early-fixture optionality. Earlier kickoff can support manual replacement decisions only if FIFA substitution and lock rules allow it; verify rules before acting. Budget, position, country-limit, lock, avoid, and risk-control constraints are unchanged."
  };
}

function renderPortfolioAnalytics(starters = [], bench = []) {
  if (!portfolioAnalytics || !portfolioSummary || !portfolioMetrics || !portfolioWarnings || !portfolioRiskLabel) {
    return;
  }

  const squad = [...starters, ...bench];

  if (!squad.length) {
    portfolioAnalytics.classList.remove("portfolio-analytics--low", "portfolio-analytics--medium", "portfolio-analytics--high");
    portfolioRiskLabel.textContent = "Waiting";
    portfolioSummary.textContent = "Build a squad to see portfolio health, bad-week floor, and fixture stack risk.";
    portfolioMetrics.innerHTML = "";
    portfolioWarnings.innerHTML = "";
    return;
  }

  const analytics = squadPortfolioAnalytics(starters, bench);
  const riskLevel = portfolioRiskLevel(analytics);
  const topCountryLabel = countryCountLabel(analytics.topCountry[0]);
  const fixtureSummary = analytics.fixtureRows
    .map((row) => `${row.label}: ${row.hardFixtures} hard, ${row.favorableFixtures} favorable, ${row.highUncertaintyStarters} high-uncertainty`)
    .join(" | ");
  const finalRoundTimingSummary = activeMatchdayId === "finalRound"
    ? ` Early fixture: ${analytics.finalRoundEarlyFixturePlayers} squad / ${analytics.finalRoundEarlyFixtureStarters} starters. Optionality ${displayNumber(analytics.finalRoundOptionalityScore)}.`
    : "";

  portfolioAnalytics.classList.remove("portfolio-analytics--low", "portfolio-analytics--medium", "portfolio-analytics--high");
  portfolioAnalytics.classList.add(`portfolio-analytics--${riskLevel.id}`);
  portfolioRiskLabel.textContent = riskLevel.label;
  portfolioSummary.textContent = `${activeBuilderStrategyLabel()}, ${trustModeLabel()}, ${activeMatchdayLabel()}. Top country: ${topCountryLabel} ${analytics.topCountry[1]}/${groupStageCountryLimit}. Fixture spread: ${fixtureSummary}.${finalRoundTimingSummary}`;
  portfolioMetrics.innerHTML = [
    portfolioMetric("Projected Points", portfolioNumber(analytics.starterExpected), "starting XI"),
    portfolioMetric("Risk-Aware Points", portfolioNumber(analytics.starterRiskAdjusted), "starting XI"),
    activeMatchdayId === "finalRound"
      ? portfolioMetric("Optionality Score", portfolioNumber(analytics.finalRoundOptionalityScore), "earlier kickoff flexibility; verify FIFA locks")
      : "",
    portfolioMetric("Avg Start", portfolioNumber(analytics.startAverage, "%"), "starting XI"),
    portfolioMetric("Expected Minutes", portfolioNumber(analytics.expectedMinutesTotal), "starting XI total"),
    portfolioMetric("Portfolio Health", portfolioNumber(Math.max(0, 100 - analytics.starterVolatility)), "higher is steadier"),
    portfolioMetric("Bad-Week Floor", portfolioNumber(analytics.starterVar10), "starting XI"),
    portfolioMetric("Worst-Case Floor", portfolioNumber(analytics.starterCvar20), "starting XI"),
    portfolioMetric("Squad Risk", portfolioNumber(analytics.tailRiskAverage), "average"),
    portfolioMetric("Budget Pressure", `${analytics.premiumPlayers} premium`, `${analytics.benchWeakCount} weak bench`)
  ].join("");
  portfolioWarnings.innerHTML = portfolioWarningsForAnalytics(analytics)
    .map((warning) => portfolioWarningItem(warning.kind, warning.label, warning.detail))
    .join("");
}

function strategyReportPercent(ratio) {
  return `${Math.round(Math.max(0, value(ratio)) * 100)}%`;
}

function strategyReportLevel(id) {
  const levels = {
    low: "Low",
    medium: "Medium",
    high: "High"
  };

  return {
    id,
    label: levels[id] || "Medium"
  };
}

function strategyReportRiskLevel(valueToCheck, mediumAt, highAt) {
  if (valueToCheck >= highAt) {
    return strategyReportLevel("high");
  }

  if (valueToCheck >= mediumAt) {
    return strategyReportLevel("medium");
  }

  return strategyReportLevel("low");
}

function strategyReportStrengthLevel(valueToCheck, highAt, mediumAt) {
  if (valueToCheck >= highAt) {
    return strategyReportLevel("high");
  }

  if (valueToCheck >= mediumAt) {
    return strategyReportLevel("medium");
  }

  return strategyReportLevel("low");
}

function strategyReportRiskTone(levelId) {
  if (levelId === "low") return "good";
  if (levelId === "high") return "review";
  return "watch";
}

function strategyReportStrengthTone(levelId) {
  if (levelId === "high") return "good";
  if (levelId === "low") return "review";
  return "watch";
}

function strategyReportMetric(label, valueToDisplay, detail, tone = "neutral") {
  return `
    <article class="strategy-report-metric strategy-report-metric--${tone}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(valueToDisplay)}</strong>
      <small>${escapeHtml(detail)}</small>
    </article>
  `;
}

function squadStrategyBudgetShape(analytics) {
  const squad = analytics.squad;
  const starterAveragePrice = startersAveragePrice(analytics.starters);
  const benchAveragePrice = startersAveragePrice(analytics.bench);
  const topHeavySpend = analytics.premiumPlayers >= 3 &&
    (analytics.benchWeakCount >= 2 || starterAveragePrice - benchAveragePrice >= 2.5);

  if (topHeavySpend) {
    return {
      id: "topHeavy",
      label: "Top-heavy",
      tone: "watch"
    };
  }

  if (
    squad.length &&
    analytics.benchWeakCount === 0 &&
    analytics.premiumPlayers <= 2 &&
    benchAveragePrice >= 5.2
  ) {
    return {
      id: "depthOriented",
      label: "Depth-oriented",
      tone: "good"
    };
  }

  return {
    id: "balanced",
    label: "Balanced",
    tone: "good"
  };
}

function startersAveragePrice(playerList = []) {
  return playerList.length
    ? playerList.reduce((sum, player) => sum + proxyPrice(player), 0) / playerList.length
    : 0;
}

function squadStrategyReportData(starters = [], bench = []) {
  const analytics = squadPortfolioAnalytics(starters, bench);
  const squad = analytics.squad;
  const topCountryCount = analytics.topCountry[1] || 0;
  const topCountryLabel = topCountryCount ? countryCountLabel(analytics.topCountry[0]) : "No country stack";
  const countryLevel = strategyReportRiskLevel(
    topCountryCount,
    Math.max(2, groupStageCountryLimit - 1),
    Math.max(3, groupStageCountryLimit)
  );
  const topFixture = analytics.topFixture;
  const topFixtureCount = topFixture?.count || 0;
  const topUncertainFixture = analytics.topUncertainFixtureStack;
  const hardFixtureDetail = analytics.hardestMatchday && analytics.hardestMatchdayHardFixtures
    ? `${analytics.hardestMatchday.label}: ${analytics.hardestMatchdayHardFixtures} hard-fixture starter${analytics.hardestMatchdayHardFixtures === 1 ? "" : "s"}.`
    : "";
  const uncertainFixtureDetail = topUncertainFixture
    ? `Uncertain stack: ${topUncertainFixture.label} (${topUncertainFixture.count} starter${topUncertainFixture.count === 1 ? "" : "s"}).`
    : "";
  const fixtureLevel = strategyReportRiskLevel(
    Math.max(topFixtureCount, analytics.hardestMatchdayHardFixtures, analytics.uncertainFixtureStackLoad),
    2,
    3
  );
  const starterProjectedScores = starters
    .map((player) => Math.max(0, scoreValue(player, "finance_expected_return_points", "risk_adjusted_expected_points_estimate")))
    .sort((a, b) => b - a);
  const topThreeProjected = starterProjectedScores.slice(0, 3).reduce((sum, score) => sum + score, 0);
  const topThreeShare = analytics.starterExpected > 0
    ? topThreeProjected / analytics.starterExpected
    : 0;
  const starLevel = strategyReportRiskLevel(topThreeShare, 0.36, 0.48);
  const benchExpected = sumPlayerField(bench, "finance_expected_return_points", "risk_adjusted_expected_points_estimate");
  const benchAverageStart = averagePlayerField(bench, "start_probability_percent");
  const playableBenchCount = Math.max(0, bench.length - analytics.benchWeakCount);
  const benchStrengthScore = bench.length
    ? (playableBenchCount / bench.length) * 0.65 + Math.min(1, benchAverageStart / 70) * 0.35
    : 0;
  const benchLevel = strategyReportStrengthLevel(benchStrengthScore, 0.78, 0.55);
  const floorRatio = analytics.starterExpected > 0
    ? analytics.starterVar10 / analytics.starterExpected
    : 0;
  const floorScore = Math.max(0, floorRatio) -
    (analytics.benchWeakCount >= 2 ? 0.15 : 0) -
    (analytics.tailRiskAverage >= 65 ? 0.1 : 0) -
    Math.min(0.18, analytics.averageMatchUncertaintyScore * 0.12 + analytics.uncertainFixtureStackLoad * 0.02);
  const floorLevel = strategyReportStrengthLevel(floorScore, 0.52, 0.36);
  const upsideRatio = analytics.starterExpected > 0
    ? analytics.starterUpside / analytics.starterExpected
    : 0;
  const upsideScore = upsideRatio + Math.min(
    0.42,
    analytics.totalFavorableFixtureStarters * 0.03 +
      analytics.strongProjectedXgStarters * 0.035 +
      analytics.goodCleanSheetDefenders * 0.018
  );
  const upsideLevel = strategyReportStrengthLevel(upsideScore, 1.45, 1.22);
  const budgetShape = squadStrategyBudgetShape(analytics);
  const totalPrice = squadCost(squad);
  const fixtureStackDetail = topFixture
    ? [
      `Biggest stack: ${topFixture.label} (${topFixtureCount} starter${topFixtureCount === 1 ? "" : "s"}).`,
      uncertainFixtureDetail || hardFixtureDetail || "No hard or uncertain fixture cluster."
    ].filter(Boolean).join(" ")
    : "No fixture stack is visible in the current matchday view.";
  const badWeekUncertaintyText = analytics.totalHighUncertaintyStarters
    ? `${analytics.totalHighUncertaintyStarters} high-uncertainty starter spot${analytics.totalHighUncertaintyStarters === 1 ? "" : "s"}.`
    : "No high-uncertainty starter cluster.";
  const upsideFixtureSupport = analytics.strongProjectedXgStarters + analytics.goodCleanSheetDefenders;
  const upsideFixtureText = upsideFixtureSupport
    ? `Fixture support: ${upsideFixtureSupport} strong attacking or defensive spot${upsideFixtureSupport === 1 ? "" : "s"}.`
    : "Fixture support is limited.";

  return {
    analytics,
    levels: {
      country: countryLevel.id,
      fixture: fixtureLevel.id,
      star: starLevel.id,
      bench: benchLevel.id,
      floor: floorLevel.id,
      upside: upsideLevel.id,
      budgetShape: budgetShape.id
    },
    summary: {
      topCountryLabel,
      topCountryCount,
      topFixture,
      topFixtureCount
    },
    metrics: [
      {
        label: "Country Stack Risk",
        value: countryLevel.label,
        detail: topCountryCount
          ? `Top country: ${topCountryLabel} ${topCountryCount}/${groupStageCountryLimit}.`
          : "No country is carrying a visible share of the squad.",
        tone: strategyReportRiskTone(countryLevel.id)
      },
      {
        label: "Fixture Stack Risk",
        value: fixtureLevel.label,
        detail: fixtureStackDetail,
        tone: strategyReportRiskTone(fixtureLevel.id)
      },
      {
        label: "Star Dependence",
        value: starLevel.label,
        detail: `Top three starters carry ${strategyReportPercent(topThreeShare)} of projected starter value.`,
        tone: strategyReportRiskTone(starLevel.id)
      },
      {
        label: "Bench Strength",
        value: benchLevel.label,
        detail: `${playableBenchCount}/${bench.length || 0} bench players look playable; bench projection ${portfolioNumber(benchExpected)}.`,
        tone: strategyReportStrengthTone(benchLevel.id)
      },
      {
        label: "Bad-Week Floor",
        value: floorLevel.label,
        detail: `Modeled poor-week floor: ${portfolioNumber(analytics.starterVar10)} (${strategyReportPercent(floorRatio)} of projection). ${badWeekUncertaintyText}`,
        tone: strategyReportStrengthTone(floorLevel.id)
      },
      {
        label: "Upside Ceiling",
        value: upsideLevel.label,
        detail: `Starting XI upside signal: ${portfolioNumber(analytics.starterUpside)}. ${upsideFixtureText}`,
        tone: strategyReportStrengthTone(upsideLevel.id)
      },
      {
        label: "Budget Shape",
        value: budgetShape.label,
        detail: `${analytics.premiumPlayers} premium player${analytics.premiumPlayers === 1 ? "" : "s"}, ${budgetText(totalPrice)} used, ${remainingBudgetText(totalPrice)} remaining.`,
        tone: budgetShape.tone
      }
    ]
  };
}

function squadStrategyFitText(reportData, strategyOption = activeBuilderStrategyOption()) {
  const levels = reportData.levels;
  const stackText = [
    levels.country === "high" ? "Country Stack Risk" : "",
    levels.fixture === "high" ? "Fixture Stack Risk" : ""
  ].filter(Boolean).join(" and ");

  if (strategyOption.id === "diversifiedSquad") {
    if (levels.country === "low" && levels.fixture === "low") {
      return "This fits Diversified Squad well: country and fixture stack risk are both Low. Check Bench Strength and Bad-Week Floor to make sure the spread-out build still has enough protection.";
    }

    return `Diversified Squad wants lower stack risk, and this build still has ${stackText || "some Medium stack pressure"}. Rebuild or adjust locks if that concentration is not intentional.`;
  }

  if (strategyOption.id === "concentratedUpside") {
    if (["high", "medium"].includes(levels.upside)) {
      return "This fits Concentrated Upside if you are comfortable with the stack tradeoff: the ceiling signal is strong enough to justify a sharper portfolio. Treat Country Stack Risk and Fixture Stack Risk as the main warning lights.";
    }

    return "Concentrated Upside can accept more stack risk, but this build is not showing a strong ceiling signal yet. Check whether filters or locks are limiting the upside lane.";
  }

  if (strategyOption.id === "starsAndScrubs") {
    if (levels.star === "high" || levels.budgetShape === "topHeavy") {
      return "This fits Stars and Scrubs: more value is concentrated in the top players, and the bench is the tradeoff. Make sure any weaker bench spots are deliberate before saving.";
    }

    return "This is less top-heavy than a typical Stars and Scrubs build. It may be steadier, but it is not leaning hard into the selected strategy.";
  }

  if (strategyOption.id === "valueSquad") {
    if (["high", "medium"].includes(levels.bench) && levels.budgetShape !== "topHeavy") {
      return "This fits Value Squad: the bench looks playable and the budget shape is efficient. The main check is whether the squad still has enough Upside Ceiling.";
    }

    return "Value Squad wants playable depth and an efficient budget shape. This build may need a stronger bench or less top-heavy spend to match the strategy.";
  }

  const balancedSignals = [
    levels.country !== "high",
    levels.fixture !== "high",
    levels.star !== "high",
    levels.bench !== "low",
    levels.floor !== "low"
  ].filter(Boolean).length;

  if (balancedSignals >= 4) {
    return "This looks aligned with Balanced Squad: most portfolio signals are moderate or better. Review any High risk item before saving.";
  }

  return "Balanced Squad wants moderate tradeoffs across the report. This build has a few sharper edges, so check the weakest metric before saving.";
}

function renderSquadStrategyReport(starters = [], bench = []) {
  if (!squadStrategyReport || !squadStrategyReportSummary || !squadStrategyReportLabel || !squadStrategyReportMetrics || !squadStrategyReportFit) {
    return;
  }

  const squad = [...starters, ...bench];

  if (!squad.length) {
    squadStrategyReport.classList.add("hidden");
    squadStrategyReportLabel.textContent = "Waiting";
    squadStrategyReportSummary.textContent = "Build a squad to see how the picks fit the selected strategy.";
    squadStrategyReportMetrics.innerHTML = "";
    squadStrategyReportFit.textContent = "";
    return;
  }

  const strategyOption = activeBuilderStrategyOption();
  const reportData = squadStrategyReportData(starters, bench);
  const topFixtureText = reportData.summary.topFixture
    ? `${reportData.summary.topFixture.label} (${reportData.summary.topFixtureCount})`
    : "no visible fixture stack";

  squadStrategyReport.classList.remove("hidden");
  squadStrategyReportLabel.textContent = strategyOption.label;
  squadStrategyReportSummary.textContent = `${squad.length}-player squad using ${strategyOption.label}. Top country: ${reportData.summary.topCountryLabel} ${reportData.summary.topCountryCount}/${groupStageCountryLimit}; biggest match stack: ${topFixtureText}.`;
  squadStrategyReportMetrics.innerHTML = reportData.metrics
    .map((metric) => strategyReportMetric(metric.label, metric.value, metric.detail, metric.tone))
    .join("");
  squadStrategyReportFit.textContent = squadStrategyFitText(reportData, strategyOption);
}

function strategyComparisonMetricMap(reportData) {
  return Object.fromEntries(reportData.metrics.map((metric) => [metric.label, metric]));
}

function strategyComparisonLevelRank(levelId, type = "risk") {
  const riskRanks = { low: 1, medium: 2, high: 3 };
  const strengthRanks = { low: 1, medium: 2, high: 3 };
  const budgetRanks = { topHeavy: 1, balanced: 2, depthOriented: 3 };

  if (type === "budget") {
    return budgetRanks[levelId] || 0;
  }

  if (type === "strength") {
    return strengthRanks[levelId] || 0;
  }

  return riskRanks[levelId] || 0;
}

function strategyComparisonPlayerList(playersToList = []) {
  if (!playersToList.length) {
    return "No squad players";
  }

  return playersToList
    .map((player) => `${player.name} (${player.position.slice(0, 3).toUpperCase()}, ${playerCountryText(player)})`)
    .join(", ");
}

function strategyComparisonSettingsSummary() {
  return [
    tacticSelect?.value ? `Tactic ${tacticSelect.value}` : "",
    activeMatchdayLabel(),
    trustModeLabel(),
    builderRiskControlsActive() ? `Risk controls: ${builderRiskSettingsSummary()}` : "Default risk controls",
    lockedPlayerIds.size ? `${lockedPlayerIds.size} locked` : "No locked players",
    excludedPlayerIds.size ? `${excludedPlayerIds.size} removed` : "No removed players"
  ].filter(Boolean).join(" · ");
}

function strategyComparisonResult(strategyKey) {
  const strategyOption = teamBuilderStrategyOption(strategyKey);
  const measure = teamBuilderStrategyMeasure(strategyOption);
  const profile = teamBuilderStrategyScoringProfile(strategyOption);
  const result = buildSuggestedSquad();
  const starters = result.starters || [];
  const bench = result.bench || [];
  const squad = [...starters, ...bench];
  const reportData = squadStrategyReportData(starters, bench);
  const metricsByLabel = strategyComparisonMetricMap(reportData);
  const shape = portfolioStrategyShape(reportData.analytics);
  const optimizer = portfolioOptimizerAdjustment(starters, bench, measure, activeTrustMode(), profile);
  const topFixtureText = reportData.summary.topFixture
    ? `${reportData.summary.topFixture.label} (${reportData.summary.topFixtureCount})`
    : "no visible fixture stack";
  const fullSquadReady = squad.length === squadTotalPlayers && starters.length === startingLineupTotal;

  return {
    strategyKey,
    strategyLabel: strategyOption.label,
    measureKey: measure.key,
    starters,
    bench,
    squad,
    ids: squad.map((player) => player.id),
    starterIds: starters.map((player) => player.id),
    benchIds: bench.map((player) => player.id),
    fullSquadReady,
    totalPrice: squadCost(squad),
    remainingBudget: initialBudget - squadCost(squad),
    reportData,
    metricsByLabel,
    shape,
    optimizer,
    optimizerEvaluatedPaths: result.optimizerEvaluatedPaths || 0,
    warnings: {
      budgetCouldNotFit: Boolean(result.budgetCouldNotFit),
      countryLimitCouldNotFit: Boolean(result.countryLimitCouldNotFit),
      riskConstraintsCouldNotFit: Boolean(result.riskConstraintsCouldNotFit),
      optimizerFoundValidSquad: Boolean(result.optimizerFoundValidSquad)
    },
    summaryText: `${squad.length}/${squadTotalPlayers} players, ${budgetText(squadCost(squad))} used, ${remainingBudgetText(squadCost(squad))} remaining. Top country: ${reportData.summary.topCountryLabel} ${reportData.summary.topCountryCount}/${groupStageCountryLimit}; biggest match stack: ${topFixtureText}.`
  };
}

function strategyComparisonOverlapRows(results) {
  const rows = [];

  results.forEach((left, leftIndex) => {
    results.slice(leftIndex + 1).forEach((right) => {
      const leftIds = new Set(left.ids);
      const overlapIds = right.ids.filter((id) => leftIds.has(id));
      const denominator = Math.max(left.ids.length, right.ids.length, squadTotalPlayers || 1);
      const overlapShare = denominator ? overlapIds.length / denominator : 0;

      rows.push({
        left,
        right,
        overlapIds,
        overlapCount: overlapIds.length,
        overlapShare,
        isNearlySame: overlapIds.length >= Math.min(12, squadTotalPlayers)
      });
    });
  });

  return rows.sort((a, b) => b.overlapCount - a.overlapCount || a.left.strategyLabel.localeCompare(b.left.strategyLabel));
}

function strategyComparisonSharedCore(results) {
  if (!results.length) {
    return [];
  }

  return results[0].ids.filter((playerId) =>
    results.every((result) => result.ids.includes(playerId))
  );
}

function strategyComparisonIdentityChecks(results) {
  const byKey = Object.fromEntries(results.map((result) => [result.strategyKey, result]));
  const balanced = byKey.balancedSquad;
  const diversified = byKey.diversifiedSquad;
  const concentrated = byKey.concentratedUpside;
  const stars = byKey.starsAndScrubs;
  const valueBuild = byKey.valueSquad;
  const checks = [];

  if (!balanced) {
    return checks;
  }

  if (diversified) {
    const countryImproved = strategyComparisonLevelRank(diversified.reportData.levels.country) <
      strategyComparisonLevelRank(balanced.reportData.levels.country) ||
      diversified.reportData.summary.topCountryCount < balanced.reportData.summary.topCountryCount;
    const fixtureImproved = strategyComparisonLevelRank(diversified.reportData.levels.fixture) <
      strategyComparisonLevelRank(balanced.reportData.levels.fixture) ||
      (diversified.reportData.summary.topFixtureCount || 0) < (balanced.reportData.summary.topFixtureCount || 0);
    checks.push({
      strategy: diversified.strategyLabel,
      passed: countryImproved || fixtureImproved,
      detail: countryImproved || fixtureImproved
        ? "Diversified lowered country or fixture concentration versus Balanced."
        : "Diversified did not lower country or fixture concentration versus Balanced under these settings."
    });
  }

  if (concentrated) {
    const upsideImproved = concentrated.reportData.analytics.starterUpside > balanced.reportData.analytics.starterUpside + 0.5;
    const stackImproved = concentrated.shape.controlledStackScore > balanced.shape.controlledStackScore + 1 ||
      (concentrated.reportData.summary.topFixtureCount || 0) > (balanced.reportData.summary.topFixtureCount || 0);
    const xgImproved = concentrated.reportData.analytics.strongProjectedXgStarters >
      balanced.reportData.analytics.strongProjectedXgStarters;
    checks.push({
      strategy: concentrated.strategyLabel,
      passed: upsideImproved || stackImproved || xgImproved,
      detail: upsideImproved || stackImproved || xgImproved
        ? "Concentrated Upside raised ceiling, controlled stack exposure, or strong team-xG spots versus Balanced."
        : "Concentrated Upside did not raise ceiling, stack exposure, or strong team-xG spots versus Balanced under these settings."
    });
  }

  if (stars) {
    const starDependenceIncreased = stars.shape.topThreeShare > balanced.shape.topThreeShare + 0.02;
    const budgetMoreTopHeavy = stars.reportData.levels.budgetShape === "topHeavy" &&
      balanced.reportData.levels.budgetShape !== "topHeavy";
    const premiumIncreased = stars.reportData.analytics.premiumPlayers > balanced.reportData.analytics.premiumPlayers;
    checks.push({
      strategy: stars.strategyLabel,
      passed: starDependenceIncreased || budgetMoreTopHeavy || premiumIncreased,
      detail: starDependenceIncreased || budgetMoreTopHeavy || premiumIncreased
        ? "Stars and Scrubs increased star dependence, premium pressure, or top-heavy budget shape."
        : "Stars and Scrubs did not look more star-dependent than Balanced under these settings."
    });
  }

  if (valueBuild && stars) {
    const benchImproved = valueBuild.shape.benchStrengthScore > stars.shape.benchStrengthScore + 1 ||
      valueBuild.reportData.analytics.benchWeakCount < stars.reportData.analytics.benchWeakCount;
    const budgetImproved = strategyComparisonLevelRank(valueBuild.reportData.levels.budgetShape, "budget") >
      strategyComparisonLevelRank(stars.reportData.levels.budgetShape, "budget");
    checks.push({
      strategy: valueBuild.strategyLabel,
      passed: benchImproved || budgetImproved,
      detail: benchImproved || budgetImproved
        ? "Value Squad improved bench strength or budget shape versus Stars and Scrubs."
        : "Value Squad did not improve bench strength or budget shape versus Stars and Scrubs under these settings."
    });
  }

  return checks;
}

function strategyComparisonAlertHtml(alert) {
  const className = alert.passed ? "strategy-comparison-alert--pass" : "strategy-comparison-alert--watch";
  const label = alert.passed ? "Pass" : "Check";

  return `
    <article class="strategy-comparison-alert ${className}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(alert.strategy)}</strong>
      <p>${escapeHtml(alert.detail)}</p>
    </article>
  `;
}

function strategyComparisonOverlapHtml(rows, sharedCoreIds) {
  if (!rows.length) {
    return "";
  }

  const sharedCoreWarning = sharedCoreIds.length >= 10
    ? "strategy-comparison-overlap__summary--watch"
    : "strategy-comparison-overlap__summary--pass";
  const topRows = rows.slice(0, 6).map((row) => `
    <li class="${row.isNearlySame ? "is-nearly-same" : ""}">
      <span>${escapeHtml(row.left.strategyLabel)} / ${escapeHtml(row.right.strategyLabel)}</span>
      <strong>${row.overlapCount}/${squadTotalPlayers}</strong>
      <small>${row.isNearlySame ? "High overlap" : "Distinct enough"}</small>
    </li>
  `).join("");

  return `
    <div class="strategy-comparison-overlap__summary ${sharedCoreWarning}">
      <span>Shared core across all strategies</span>
      <strong>${sharedCoreIds.length}/${squadTotalPlayers}</strong>
      <small>${sharedCoreIds.length >= 10 ? "Watch for strategy collapse" : "Strategies are separating"}</small>
    </div>
    <ul>${topRows}</ul>
  `;
}

function renderStrategyComparisonCard(result) {
  const metricHtml = result.reportData.metrics.map((metric) =>
    strategyReportMetric(metric.label, metric.value, metric.detail, metric.tone)
  ).join("");
  const statusText = result.fullSquadReady
    ? `${compactCount(result.optimizerEvaluatedPaths)} paths compared`
    : "Partial squad";
  const warningText = !result.fullSquadReady
    ? `<p class="strategy-comparison-card__warning">Current settings could not fill every squad slot for this strategy.</p>`
    : "";

  return `
    <article class="strategy-comparison-card">
      <div class="strategy-comparison-card__heading">
        <div>
          <h4>${escapeHtml(result.strategyLabel)}</h4>
          <p>${escapeHtml(result.summaryText)}</p>
        </div>
        <span>${escapeHtml(statusText)}</span>
      </div>
      <div class="strategy-comparison-card__metrics">
        ${metricHtml}
      </div>
      <div class="strategy-comparison-card__signals">
        <span>Star share <strong>${strategyReportPercent(result.shape.topThreeShare)}</strong></span>
        <span>Bench score <strong>${displayNumber(result.shape.benchStrengthScore)}</strong></span>
        <span>Controlled stack <strong>${displayNumber(result.shape.controlledStackScore)}</strong></span>
      </div>
      ${warningText}
      <details class="strategy-comparison-card__players">
        <summary>Squad players</summary>
        <p><strong>Starters:</strong> ${escapeHtml(strategyComparisonPlayerList(result.starters))}</p>
        <p><strong>Bench:</strong> ${escapeHtml(strategyComparisonPlayerList(result.bench))}</p>
      </details>
    </article>
  `;
}

function renderStrategyComparisonResults(results) {
  const overlapRows = strategyComparisonOverlapRows(results);
  const sharedCoreIds = strategyComparisonSharedCore(results);
  const identityChecks = strategyComparisonIdentityChecks(results);
  const overlapWarnings = overlapRows
    .filter((row) => row.isNearlySame)
    .map((row) => ({
      strategy: `${row.left.strategyLabel} / ${row.right.strategyLabel}`,
      passed: false,
      detail: `These two squads overlap by ${row.overlapCount}/${squadTotalPlayers} players. Tune weights if that is not intentional.`
    }));
  const sharedCoreAlert = sharedCoreIds.length >= 10
    ? [{
        strategy: "All strategies",
        passed: false,
        detail: `All five squads share ${sharedCoreIds.length}/${squadTotalPlayers} players. This may mean the strategies are collapsing under these settings.`
      }]
    : [{
        strategy: "All strategies",
        passed: true,
        detail: `The common core is ${sharedCoreIds.length}/${squadTotalPlayers} players, so the strategy outputs are separating.`
      }];
  const alerts = [...sharedCoreAlert, ...overlapWarnings, ...identityChecks];

  if (strategyComparisonAlerts) {
    strategyComparisonAlerts.innerHTML = alerts.map(strategyComparisonAlertHtml).join("");
  }

  if (strategyComparisonOverlap) {
    strategyComparisonOverlap.innerHTML = strategyComparisonOverlapHtml(overlapRows, sharedCoreIds);
  }

  if (strategyComparisonGrid) {
    strategyComparisonGrid.innerHTML = results.map(renderStrategyComparisonCard).join("");
  }
}

function runStrategyComparison() {
  if (!runStrategyComparisonButton || !strategyComparisonStatus || !strategyComparisonGrid) {
    return;
  }

  const originalStrategyKey = measureSelect.value;
  runStrategyComparisonButton.disabled = true;
  strategyComparisonStatus.textContent = "Running comparison with current builder settings...";

  window.setTimeout(() => {
    const startedAt = Date.now();

    try {
      const results = teamBuilderComparisonStrategyKeys.map((strategyKey) => {
        measureSelect.value = strategyKey;
        return strategyComparisonResult(strategyKey);
      });

      measureSelect.value = originalStrategyKey;
      resetOptimizerStateRankCache();
      resetTeamBuilderStrategyPlayerScoreCache();
      renderStrategyComparisonResults(results);
      const seconds = Math.max(0.1, (Date.now() - startedAt) / 1000);
      strategyComparisonStatus.textContent = `Compared ${results.length} strategies in ${seconds.toFixed(1)}s using ${strategyComparisonSettingsSummary()}.`;
    } catch (error) {
      measureSelect.value = originalStrategyKey;
      strategyComparisonStatus.textContent = "Strategy comparison could not finish. Check current locks, filters, and risk controls, then try again.";
      if (strategyComparisonAlerts) {
        strategyComparisonAlerts.innerHTML = strategyComparisonAlertHtml({
          strategy: "Comparison check",
          passed: false,
          detail: error.message || "The comparison failed before all strategies could build."
        });
      }
    } finally {
      measureSelect.value = originalStrategyKey;
      runStrategyComparisonButton.disabled = false;
    }
  }, 0);
}

function exportedPlayer(player) {
  const trustMode = activeTrustMode();
  const recommendationBreakdown = recommendationScoreBreakdown(player, activeMeasure(), trustMode);
  const captainBreakdown = recommendationScoreBreakdown(player, captainTrustMeasure, trustMode);
  const qaFlags = recommendationBreakdown.qa_flags;
  const exportProjection = activeProjection(player) || pickProjectionRow(player);
  const matchContext = exportProjection ? projectionMatchContext(exportProjection) : null;

  return {
    id: player.id,
    name: player.name,
    position: player.position,
    fantasy_position: player.fantasyPosition || player.position,
    official_fantasy_position: player.official_fantasy_position || player.officialFantasyPosition || positionLabelCodes[player.position] || null,
    position_source: player.position_source || player.positionSource || null,
    external_position: player.external_position || null,
    country: playerCountryText(player),
    club: player.club,
    price: value(player.price),
    official_price: player.official_price ?? null,
    price_status: player.price_is_proxy ? "proxy_price_v1_pending_official_prices" : "official_or_source_price",
    proxy_price_active_version: player.proxy_price_active_version || (player.proxy_price_v1 ? "proxy_price_v1" : "proxy_price_v0"),
    proxy_price_v0: player.proxy_price_v0 ?? null,
    proxy_price_v1: player.proxy_price_v1 ?? null,
    proxy_price_delta_v1: player.proxy_price_delta_v1 ?? null,
    matchday_view: activeMatchdayId,
    opponent: activeProjection(player)?.opponent || null,
    projected_points: scoreValue(player, "finance_risk_adjusted_return_points", "risk_adjusted_expected_points_estimate"),
    risk_score: scoreValue(player, "finance_composite_risk_score", "risk_composite_score"),
    start_probability_percent: scoreValue(player, "start_probability_percent"),
    expected_minutes: scoreValue(player, "expected_minutes_v0"),
    country_role: activeProjection(player)?.country_role || player.country_role || null,
    substitution_risk: scoreValue(player, "substitution_risk"),
    raw_captain_score: Number(captainScore(player).toFixed(1)),
    captain_score: Number(captainBreakdown.adjusted_score.toFixed(1)),
    recommendation_score: {
      measure_key: recommendationBreakdown.measure_key,
      measure_label: recommendationBreakdown.measure_label,
      raw_score: Number(recommendationBreakdown.raw_score.toFixed(1)),
      adjusted_score: Number(recommendationBreakdown.adjusted_score.toFixed(1)),
      qa_penalty: Number(recommendationBreakdown.qa_penalty.toFixed(1)),
      strict_failure_penalty: Number(recommendationBreakdown.strict_failure_penalty.toFixed(1)),
      trust_boost: Number(recommendationBreakdown.trust_boost.toFixed(1)),
      trust_failures: recommendationBreakdown.trust_failures
    },
    trust_mode: trustMode.id,
    qa_status: recommendationBreakdown.qa_status,
    qa_flags: qaFlags,
    match_context: matchContext ? {
      fixture_id: exportProjection.fixture_id || null,
      matchday_id: exportProjection.matchday_id || exportProjection.matchday || null,
      team_projected_xg: matchContext.teamProjectedXg,
      opponent_projected_xg: matchContext.opponentProjectedXg,
      win_draw_win: matchContext.winDrawWin,
      most_likely_score: matchContext.mostLikelyScore,
      clean_sheet_context: matchContext.cleanSheetContext,
      match_uncertainty: matchContext.matchUncertainty
    } : null
  };
}

function ruleChecksForExport(starters, bench, tacticName) {
  const checks = {};

  buildRuleValidations(starters, bench, tacticName).forEach((rule) => {
    const key = normalizeText(rule.label).replace(/\s+/g, "_");
    checks[key] = {
      status: rule.passed ? "PASS" : "FAIL",
      passed: rule.passed,
      explanation: rule.detail
    };
  });

  checks.country_counts = countryCountsFromPlayers([...starters, ...bench]);
  return checks;
}

function portfolioAnalyticsForExport(starters, bench) {
  const analytics = squadPortfolioAnalytics(starters, bench);
  const riskLevel = portfolioRiskLevel(analytics);

  return {
    risk_level: riskLevel.label,
    starter_expected_points: Number(analytics.starterExpected.toFixed(1)),
    starter_risk_adjusted_points: Number(analytics.starterRiskAdjusted.toFixed(1)),
    squad_expected_points: Number(analytics.squadExpected.toFixed(1)),
    average_start_probability_percent: Number(analytics.startAverage.toFixed(1)),
    expected_minutes_starting_xi: Number(analytics.expectedMinutesTotal.toFixed(1)),
    starter_volatility_points: Number(analytics.starterVolatility.toFixed(1)),
    starter_var10_points: Number(analytics.starterVar10.toFixed(1)),
    starter_cvar20_points: Number(analytics.starterCvar20.toFixed(1)),
    average_tail_risk: Number(analytics.tailRiskAverage.toFixed(1)),
    average_composite_risk: Number(analytics.compositeRiskAverage.toFixed(1)),
    qa_review_players: analytics.qaReviewCount,
    qa_watch_players: analytics.qaWatchCount,
    premium_players: analytics.premiumPlayers,
    weak_bench_players: analytics.benchWeakCount,
    final_round_optionality_score: Number(analytics.finalRoundOptionalityScore.toFixed(2)),
    final_round_starter_optionality_score: Number(analytics.finalRoundStarterOptionalityScore.toFixed(2)),
    final_round_early_fixture_players: analytics.finalRoundEarlyFixturePlayers,
    final_round_late_fixture_players: analytics.finalRoundLateFixturePlayers,
    final_round_early_fixture_starters: analytics.finalRoundEarlyFixtureStarters,
    final_round_late_fixture_starters: analytics.finalRoundLateFixtureStarters,
    final_round_viable_early_fixture_candidates: analytics.finalRoundViableEarlyFixtureCandidates,
    final_round_missing_early_fixture: analytics.finalRoundMissingEarlyFixture,
    top_country: {
      country: countryCountLabel(analytics.topCountry[0]),
      count: analytics.topCountry[1],
      limit: groupStageCountryLimit
    },
    fixture_concentration: analytics.fixtureRows.map((row) => ({
      matchday_id: row.matchdayId,
      label: row.label,
      hard_fixture_starters: row.hardFixtures,
      favorable_fixture_starters: row.favorableFixtures,
      high_uncertainty_starters: row.highUncertaintyStarters,
      uncertain_starters: row.uncertainStarters,
      strong_projected_xg_starters: row.strongProjectedXgStarters,
      good_clean_sheet_contexts: row.goodCleanSheetContexts,
      average_team_expected_goals: row.avgXg === null ? null : Number(row.avgXg.toFixed(2)),
      average_clean_sheet_probability: row.avgCleanSheet === null ? null : Number(row.avgCleanSheet.toFixed(4))
    })),
    warnings: portfolioWarningsForAnalytics(analytics).map((warning) => ({
      level: warning.kind,
      label: warning.label,
      detail: warning.detail
    }))
  };
}

function portfolioOptimizerForExport(starters, bench) {
  return {
    enabled: true,
    ...portfolioOptimizerAdjustment(starters, bench, activeMeasure(), activeTrustMode())
  };
}

function builderRiskConstraintsForExport(starters, bench) {
  const settings = builderRiskSettings();
  const squad = [...starters, ...bench];
  const measureKey = measureKeyForTrust(activeMeasure());
  const qaReviewCount = qaReviewCountForPlayers(squad, measureKey);
  const riskyCount = squad.filter((player) => builderRiskyPlayer(player, measureKey)).length;

  return {
    min_start_probability_percent: settings.minStartProbability,
    min_expected_minutes: settings.minExpectedMinutes,
    max_qa_review_players: settings.maxQaReviewPlayers,
    allow_risky_picks: settings.allowRiskyPicks,
    summary: builderRiskSettingsSummary(settings),
    squad_qa_review_players: qaReviewCount,
    squad_risky_players: riskyCount,
    violations: builderRiskViolationsForSquad(squad, settings, measureKey),
    note: "Locked players remain in the squad and are warned if they violate risk controls."
  };
}

function exportModelMetadata() {
  return {
    export_schema_version: "team-export-v1",
    generated_at: new Date().toISOString(),
    site_name: "The Fantasy Economist",
    site_status: "current_official_fantasy",
    data_mode: teamBuilderDataSourceSummary.source,
    team_builder_data_source: teamBuilderDataSourceSummary,
    active_data_path: {
      version: ACTIVE_DATA.version,
      browser_files: [
        "playersData.js",
        "fantasyRulesData.js",
        "fantasyPoolRecommendationsData.js",
        "fantasyPoolMatchdayProjectionsData.js",
        "fantasyPoolFinanceMetricsData.js",
        "fantasyPoolScorePredictionsData.js",
        "fantasyPoolOfficialDataStatusData.js",
        "liveMatchdayStatusData.js",
        "livePlayerStatusData.js"
      ],
      live_data_use: "display_support_only"
    },
    browser_models: {
      finance: {
        browser_file: "fantasyPoolFinanceMetricsData.js",
        metric_row_count: fantasyPoolFinanceRows.length
      },
      matchday_projections: {
        browser_file: "fantasyPoolMatchdayProjectionsData.js",
        projection_row_count: fantasyPoolProjectionRows.length
      },
      score_predictions: scorePredictionSummary ? {
        active_context: activeScorePredictionSource.label,
        has_static_backup: false,
        schema_version: scorePredictionSummary.schema_version,
        generated_at: scorePredictionSummary.generated_at,
        source_schema_version: scorePredictionSummary.source_schema_version,
        source_generated_at: scorePredictionSummary.source_generated_at,
        source_checked: scorePredictionSummary.source_checked,
        model_name: scorePredictionSummary.model_name,
        fixture_prediction_count: scorePredictionSummary.fixture_prediction_count,
        match_uncertainty_counts: scorePredictionSummary.match_uncertainty_counts || null
      } : null,
      fantasy_rules: {
        rules_version: fantasyRules?.rules_version || null,
        rules_status: fantasyRules?.rules_status || null,
        squad_total_players: squadTotalPlayers,
        starting_lineup_total_players: startingLineupTotal,
        initial_budget: initialBudget,
        budget_currency_label: budgetCurrencyLabel,
        active_country_limit: groupStageCountryLimit,
        active_country_limit_matchday: activeMatchdayId,
        group_stage_country_limit: Number(fantasyRules?.country_limits?.group_stage_max_per_country) || null,
        knockout_country_limits: fantasyRules?.country_limits?.knockout_limits || null,
        allowed_formations: Object.keys(tactics)
      }
    },
    source_labels: [
      "Official fantasy player pool and prices",
      "Active fantasyPool player matchday projections",
      activeScorePredictionSource.label,
      "Fantasy rules summary",
      "Team Builder strategy notes",
      "Manual matchday decision-tool notes"
    ]
  };
}

function builderSettingsForExport() {
  const measure = activeMeasure();
  const selectedStrategyOption = activeBuilderStrategyOption();
  const trustMode = activeTrustMode();
  const minPrice = priceFilterValue(minPriceFilter);
  const maxPrice = priceFilterValue(maxPriceFilter);

  return {
    formation: tacticSelect.value,
    render_mode: currentRenderMode,
    matchday: {
      id: activeMatchdayId,
      label: activeMatchdayLabel()
    },
    recommendation_style: {
      key: selectedStrategyOption.id,
      label: selectedStrategyOption.label,
      description: selectedStrategyOption.description,
      measure_key: measure.key,
      player_signal: selectedStrategyOption.playerSignal || measure.formula,
      what_it_tries_to_build: selectedStrategyOption.whatItBuilds || selectedStrategyOption.description,
      how_it_chooses_players: selectedStrategyOption.howItChooses || measure.formula,
      main_tradeoff: selectedStrategyOption.mainTradeoff || selectedStrategyOption.optimizationNote,
      best_for: selectedStrategyOption.bestFor || null,
      strategy_note: selectedStrategyOption.optimizationNote
    },
    trust_mode: {
      id: trustMode.id,
      label: trustMode.label,
      description: trustMode.description
    },
    advice_pool: {
      id: activeAdvicePoolModeId,
      label: activeAdvicePoolMode().label
    },
    filters: {
      position: selectedPositionFilter,
      country: selectedCountryFilter,
      min_price: minPrice,
      max_price: maxPrice,
      price_filter_invalid: priceFiltersAreInvalid(),
      risk_controls: builderRiskSettings()
    },
    budget: {
      initial_budget: initialBudget,
      currency_label: budgetCurrencyLabel
    }
  };
}

function selectedPlayerReferences(playerIds) {
  return Array.from(playerIds)
    .map(playerById)
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(exportedPlayerReference);
}

function squadStateForExport(starters, bench, ignoredLockedPlayers, captainPlayer, viceCaptainPlayer) {
  const squad = [...starters, ...bench];
  const benchOrderIds = effectiveBenchOrderIds(bench);

  return {
    user_squad_selection_version: "user_squad_selection_v0",
    squad_player_ids: squad.map((player) => player.id),
    starter_player_ids: starters.map((player) => player.id),
    bench_player_ids: bench.map((player) => player.id),
    user_captain_id: userCaptainId,
    user_vice_captain_id: userViceCaptainId,
    bench_order_player_ids: benchOrderIds,
    bench_order_source: userBenchOrderIds.length ? "user_selected" : "builder_default",
    bench_order: benchOrderIds
      .map(playerById)
      .filter(Boolean)
      .map((player, index) => ({
        order: index + 1,
        ...exportedPlayerReference(player)
      })),
    captain: exportedPlayerReference(captainPlayer),
    vice_captain: exportedPlayerReference(viceCaptainPlayer),
    captain_source: userCaptainId && captainPlayer?.id === userCaptainId
      ? "user_selected"
      : captainPlayer ? "model_highest_current_captain_score_non_goalkeeper" : "not_available",
    vice_captain_source: userViceCaptainId && viceCaptainPlayer?.id === userViceCaptainId
      ? "user_selected"
      : viceCaptainPlayer ? "model_second_highest_current_captain_score_non_goalkeeper" : "not_available",
    locked_players: selectedPlayerReferences(lockedPlayerIds),
    removed_players: selectedPlayerReferences(excludedPlayerIds),
    ignored_locked_players: ignoredLockedPlayers.map(exportedPlayerReference),
    starter_slots: starters.map((player, index) => ({
      slot: index + 1,
      ...exportedPlayerReference(player)
    })),
    bench_slots: bench.map((player, index) => ({
      slot: index + 1,
      ...exportedPlayerReference(player)
    }))
  };
}

function decisionToolPlaceholdersForExport() {
  return {
    captain_change_advisor: lastCaptainChangeDecision || {
      model_version: "captain_change_advisor_v0",
      scope: "quick_manual_switch_check",
      saved: false,
      saved_at: null,
      saved_decision_export_version: "saved_decision_export_v0",
      current_captain_id: null,
      current_captain: null,
      current_captain_raw_points: null,
      replacement_candidate_id: null,
      replacement_candidate: null,
      selected_matchday_id: captainChangeMatchdaySelect?.value || activeMatchdayId,
      selected_matchday_label: matchdayLabelFromId(captainChangeMatchdaySelect?.value || activeMatchdayId),
      risk_style: captainChangeRiskSelect?.value || "balanced",
      risk_style_label: captainChangeMode().label,
      result: null,
      result_class: null,
      switch_score: null,
      switch_threshold: null,
      edge_vs_current: null,
      raw_signal: null,
      candidate_start_probability_percent: null,
      candidate_expected_minutes: null,
      projection: null,
      qa_flags: [],
      source: null,
      note: "No captain-change check has been saved yet. Run the Quick Captain Switch Check to include one here."
    },
    substitution_advisor: lastSubstitutionDecision || {
      model_version: "substitution_advisor_v0",
      scope: "quick_manual_substitution_check",
      saved: false,
      saved_at: null,
      saved_decision_export_version: "saved_decision_export_v0",
      played_starter_id: null,
      played_starter: null,
      played_starter_raw_points: null,
      bench_candidate_id: null,
      bench_candidate: null,
      selected_matchday_id: substitutionAdvisorMatchdaySelect?.value || activeMatchdayId,
      selected_matchday_label: matchdayLabelFromId(substitutionAdvisorMatchdaySelect?.value || activeMatchdayId),
      risk_style: substitutionAdvisorRiskSelect?.value || "balanced",
      risk_style_label: substitutionAdvisorMode().label,
      result: null,
      result_class: null,
      substitution_score: null,
      substitution_threshold: null,
      edge_vs_starter: null,
      raw_signal: null,
      bench_start_probability_percent: null,
      bench_expected_minutes: null,
      formation_legality_checked: false,
      same_position_substitution: null,
      projection: null,
      qa_flags: [],
      source: null,
      note: "No substitution check has been saved yet. Run the Quick Substitution Check to include one here."
    }
  };
}

function savedDecisionTextForExport() {
  const decisions = [lastCaptainChangeDecision, lastSubstitutionDecision].filter(Boolean);
  const importedCount = decisions.filter((decision) => decision.imported_requires_rerun || decision.imported).length;

  if (!decisions.length) {
    return "";
  }

  if (importedCount === decisions.length) {
    return ` with ${decisions.length} imported saved decision scenario${decisions.length === 1 ? "" : "s"} needing advisor rerun`;
  }

  if (importedCount) {
    return ` with ${decisions.length} saved manual decision${decisions.length === 1 ? "" : "s"} (${importedCount} imported review)`;
  }

  return ` with ${decisions.length} saved manual decision${decisions.length === 1 ? "" : "s"}`;
}

function exportCaptain(starters) {
  const captain = exportCaptainPlayer(starters);

  return captain?.name || "";
}

function modelCaptainPlayer(starters) {
  return [...starters]
    .filter((player) => player.position !== "Goalkeeper")
    .sort((a, b) => captainRecommendationScore(b) - captainRecommendationScore(a))[0] || starters[0];
}

function exportCaptainPlayer(starters) {
  return starters.find((player) => player.id === userCaptainId) ||
    modelCaptainPlayer(starters) ||
    null;
}

function exportViceCaptainPlayer(starters, captain) {
  const userVice = starters.find((player) =>
    player.id === userViceCaptainId &&
    player.id !== captain?.id
  );

  if (userVice) {
    return userVice;
  }

  return [...starters]
    .filter((player) => player.id !== captain?.id && player.position !== "Goalkeeper")
    .sort((a, b) => captainRecommendationScore(b) - captainRecommendationScore(a))[0] ||
    starters.find((player) => player.id !== captain?.id) ||
    null;
}

function exportedPlayerReference(player) {
  if (!player) {
    return null;
  }

  return {
    id: player.id,
    name: player.name,
    position: player.position,
    fantasy_position: player.fantasyPosition || player.position,
    official_fantasy_position: player.official_fantasy_position || player.officialFantasyPosition || positionLabelCodes[player.position] || null,
    position_source: player.position_source || player.positionSource || null,
    external_position: player.external_position || null,
    country: playerCountryText(player),
    club: player.club || null,
    price: value(player.price)
  };
}

function scoreAverage(playerList, fieldName) {
  return playerList.length
    ? value(playerList.reduce((sum, player) => sum + scoreValue(player, fieldName), 0) / playerList.length).toFixed(1)
    : 0;
}

function roleScore(playerList, roles) {
  const rolePlayers = playerList.filter((player) => roles.includes(player.position));
  return Number(scoreAverage(rolePlayers, "risk_adjusted_expected_points_estimate"));
}

function exportExplanation(starters, bench) {
  const squad = [...starters, ...bench];
  const totalPrice = squadCost(squad);
  const countryCounts = countryCountEntries(countryCountsFromPlayers(squad))
    .map(([countryKey, count]) => `${countryCountLabel(countryKey)} ${count}/${groupStageCountryLimit}`)
    .join(", ");

  const priceNote = teamBuilderDataSourceSummary.source === "official_fantasy_pool_with_current_model_fields"
    ? "Team Builder uses the current official fantasy-pool player layer with official selectable-status filtering, prices, and positions."
    : "Current data is the local fallback dataset.";

  return `Generated by Team Builder using ${activeBuilderStrategyLabel()}, ${trustModeLabel()}, and ${activeMatchdayLabel()}. Squad risk scoring is enabled as a small squad-level adjustment. Risk controls: ${builderRiskSettingsSummary()}. The squad costs ${budgetText(totalPrice)} with ${remainingBudgetText(totalPrice)} remaining. Country counts: ${countryCounts || "none"}. ${priceNote}`;
}

function teamExportPayload() {
  const tacticName = tacticSelect.value;
  const starters = [...currentRenderedTeam];
  const bench = [...currentBenchPlayers];
  const squad = [...starters, ...bench];
  const totalPrice = squadCost(squad);
  const captainPlayer = exportCaptainPlayer(starters);
  const viceCaptainPlayer = exportViceCaptainPlayer(starters, captainPlayer);
  const captain = captainPlayer?.name || "";
  const metadata = exportModelMetadata();
  const builderSettings = builderSettingsForExport();
  const squadState = squadStateForExport(starters, bench, currentIgnoredLockedPlayers, captainPlayer, viceCaptainPlayer);
  const ruleChecks = ruleChecksForExport(starters, bench, tacticName);
  const builderRiskConstraints = builderRiskConstraintsForExport(starters, bench);
  const portfolioAnalytics = portfolioAnalyticsForExport(starters, bench);
  const portfolioOptimizer = portfolioOptimizerForExport(starters, bench);
  const explanation = exportExplanation(starters, bench);

  return {
    schema_version: "team-export-v1",
    export_version: 1,
    site_name: "The Fantasy Economist",
    exported_at: metadata.generated_at,
    user_prompt: "Build a fantasy squad using the current Team Builder settings.",
    team_name: `The Fantasy Economist ${tacticName} Draft`,
    formation: tacticName,
    matchday_view: activeMatchdayId,
    matchday_label: activeMatchdayLabel(),
    players: squad.map(exportedPlayer),
    starting_11: starters.map(exportedPlayer),
    bench: bench.map(exportedPlayer),
    captain,
    captain_player: exportedPlayerReference(captainPlayer),
    vice_captain: viceCaptainPlayer?.name || null,
    vice_captain_player: exportedPlayerReference(viceCaptainPlayer),
    total_price: Number(totalPrice.toFixed(1)),
    remaining_budget: Number((initialBudget - totalPrice).toFixed(1)),
    strategy: activeBuilderStrategyLabel(),
    strategy_key: activeBuilderStrategyOption().id,
    strategy_measure_key: activeMeasure().key,
    trust_mode: activeTrustMode().id,
    trust_mode_label: activeTrustMode().label,
    risk_score: Number(scoreAverage(squad, "risk_composite_score")),
    attack_score: roleScore(starters, ["Midfielder", "Forward"]),
    defense_score: roleScore(starters, ["Goalkeeper", "Defender"]),
    rule_checks: ruleChecks,
    builder_risk_constraints: builderRiskConstraints,
    portfolio_analytics: portfolioAnalytics,
    portfolio_optimizer: portfolioOptimizer,
    model_metadata: metadata,
    builder_settings: builderSettings,
    squad_state: squadState,
    decision_tools: decisionToolPlaceholdersForExport(),
    recommendation_notes: {
      explanation,
      generated_by: "Team Builder with squad risk adjustment",
      model_caveat: "World Cup fantasy recommendations using the current available model data. Confirm lineups, locks, deadlines, and game rules before acting.",
      next_use: "This export is structured so a future import flow can prefill saved squads and decision-tool context."
    },
    explanation,
    data_sources: [
      teamBuilderDataSourceSummary.source === "official_fantasy_pool_with_current_model_fields"
        ? "Current official fantasy-pool players, prices, positions, and selectable status"
        : "Local player list",
      "Current fantasy-pool player matchday projections",
      activeScorePredictionSource.label,
      "Fantasy rules summary",
      "Team Builder strategy notes",
      teamBuilderDataSourceSummary.source === "official_fantasy_pool_with_current_model_fields"
        ? "Current Team Builder view uses official fantasy-pool players."
        : "Current Team Builder view uses the local player list."
    ],
    rules_sources: [
      "Fantasy rules summary",
      "Rules source notes",
      fantasyRules?.rules_status || "Rules data unavailable; confirm inside the fantasy game."
    ]
  };
}

function downloadJsonFile(fileName, jsonText) {
  const blob = new Blob([jsonText], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportTeamJson() {
  const squad = [...currentRenderedTeam, ...currentBenchPlayers];

  if (
    currentRenderMode !== "built" ||
    squad.length !== squadTotalPlayers ||
    currentRenderedTeam.length !== startingLineupTotal
  ) {
    showBuilderWarning(`Build a full ${squadLabel()} before exporting Team JSON.`);
    return;
  }

  const payload = teamExportPayload();
  const jsonText = JSON.stringify(payload, null, 2);

  teamExportOutput.value = jsonText;
  teamExportPanel.classList.remove("hidden");
  const decisionText = savedDecisionTextForExport();
  teamMessage.textContent = `Team export ready${decisionText}. A download was created and the export preview is shown in the Team Builder controls.`;
  downloadJsonFile("world-cup-fantasy-team.json", jsonText);
}

function saveTeamToBrowser() {
  if (!fullBuiltSquadIsReady()) {
    showBuilderWarning(`Build a full ${squadLabel()} before saving to this browser.`);
    renderBrowserSquadSaveStatus();
    return;
  }

  const storage = browserSquadStorage();

  if (!storage) {
    showBuilderWarning("Browser saving is not available here. Use Export JSON instead.");
    renderBrowserSquadSaveStatus();
    return;
  }

  try {
    const payload = {
      ...teamExportPayload(),
      browser_saved_at: new Date().toISOString()
    };
    storage.setItem(browserSquadStorageKey, JSON.stringify(payload));
    teamMessage.textContent = "Squad saved in this browser. Decision Tools can now reload it without a JSON file.";
    renderBrowserSquadSaveStatus();
    renderSavedSquadDecisionPanels();
  } catch (error) {
    showBuilderWarning("Browser save failed. Use Export JSON as a fallback.");
    renderBrowserSquadSaveStatus();
  }
}

function loadTeamFromBrowser() {
  const { payload, error } = readBrowserSavedSquad();

  if (error || !payload) {
    showBuilderWarning(error || "No browser-saved squad is available yet.");
    renderBrowserSquadSaveStatus();
    return;
  }

  try {
    restoreTeamFromExportPayload(payload);
    teamMessage.textContent = "Loaded the browser-saved squad. Rebuild only if you want Team Builder to change it.";
    renderBrowserSquadSaveStatus();
  } catch (errorToShow) {
    showBuilderWarning(errorToShow.message || "Browser-saved squad could not be loaded.");
    teamMessage.textContent = "Saved squad load failed. The current squad was left unchanged.";
    renderBrowserSquadSaveStatus();
  }
}

function clearBrowserSavedSquad() {
  const storage = browserSquadStorage();

  if (!storage) {
    showBuilderWarning("Browser saving is not available here.");
    return;
  }

  storage.removeItem(browserSquadStorageKey);
  teamMessage.textContent = "Browser-saved squad cleared. The current squad on screen was left unchanged.";
  renderBrowserSquadSaveStatus();
}

function importedIdList(primaryValue, fallbackValue = []) {
  const rawList = Array.isArray(primaryValue) && primaryValue.length
    ? primaryValue
    : Array.isArray(fallbackValue)
      ? fallbackValue
      : [];
  const ids = [];
  const seenIds = new Set();

  rawList.forEach((item) => {
    const id = typeof item === "string" ? item : item?.id;

    if (id && !seenIds.has(id)) {
      ids.push(id);
      seenIds.add(id);
    }
  });

  return ids;
}

function importedPlayersFromIds(playerIds) {
  const foundPlayers = [];
  const missingIds = [];

  playerIds.forEach((playerId) => {
    const player = playerById(playerId);

    if (player) {
      foundPlayers.push(player);
    } else {
      missingIds.push(playerId);
    }
  });

  return { foundPlayers, missingIds };
}

function setImportedBuilderSettings(payload) {
  const settings = payload.builder_settings || {};
  const filters = settings.filters || {};
  const riskControls = filters.risk_controls || {};
  const formation = settings.formation || payload.formation;
  const matchdayId = settings.matchday?.id || payload.matchday_view;
  const styleKey = settings.recommendation_style?.key || payload.strategy_key;
  const trustModeId = settings.trust_mode?.id || payload.trust_mode;

  if (formation && tactics[formation]) {
    tacticSelect.value = formation;
    summaryTactic.textContent = formation;
  }

  if (matchdayId && matchdayOptions.some((option) => option.matchday_id === matchdayId)) {
    activeMatchdayId = matchdayId;
    refreshActiveCountryLimit();
    [adviceMatchdaySelect, builderMatchdaySelect].filter(Boolean).forEach((select) => {
      select.value = activeMatchdayId;
    });
    setMatchdayDecisionMatchday(activeMatchdayId);
  }

  if (styleKey || settings.recommendation_style?.measure_key || payload.strategy_measure_key) {
    measureSelect.value = teamBuilderStrategyKeyFromImport(
      styleKey,
      settings.recommendation_style?.measure_key || payload.strategy_measure_key
    );
  }

  if (trustModeId && trustModes[trustModeId]) {
    activeTrustModeId = trustModeId;
    syncTrustModeControls();
  }

  if (filters.position === "All" || positionOrder.includes(filters.position)) {
    selectedPositionFilter = filters.position;
    positionFilter.value = filters.position;
  } else {
    selectedPositionFilter = "All";
    positionFilter.value = "All";
  }

  const countryValues = new Set(["All", ...players.map(playerCountryKey)]);
  if (countryFilter && countryValues.has(filters.country)) {
    selectedCountryFilter = filters.country;
    countryFilter.value = filters.country;
  } else if (countryFilter) {
    selectedCountryFilter = "All";
    countryFilter.value = "All";
  }

  if (typeof filters.min_price === "number") {
    minPriceFilter.value = filters.min_price;
  } else {
    minPriceFilter.value = "";
  }

  if (typeof filters.max_price === "number") {
    maxPriceFilter.value = filters.max_price;
  } else {
    maxPriceFilter.value = "";
  }

  if (minStartFilter) {
    minStartFilter.value = riskControls.minStartProbability ?? "";
  }

  if (minMinutesFilter) {
    minMinutesFilter.value = riskControls.minExpectedMinutes ?? "";
  }

  if (maxQaReviewFilter) {
    maxQaReviewFilter.value = "";
  }

  if (allowRiskyPicksToggle) {
    allowRiskyPicksToggle.checked = true;
  }
}

function applyImportedPlayerSets(payload) {
  const squadState = payload.squad_state || {};
  const lockedIds = importedIdList(squadState.locked_players);
  const removedIds = importedIdList(squadState.removed_players);
  const missingSetIds = [];

  lockedPlayerIds.clear();
  excludedPlayerIds.clear();

  lockedIds.forEach((playerId) => {
    if (playerById(playerId)) {
      lockedPlayerIds.add(playerId);
    } else {
      missingSetIds.push(playerId);
    }
  });

  removedIds.forEach((playerId) => {
    if (playerById(playerId)) {
      excludedPlayerIds.add(playerId);
    } else {
      missingSetIds.push(playerId);
    }
  });

  return missingSetIds;
}

function validateImportedLineup(starters, bench) {
  const warnings = [];
  const expectedBenchPlayers = squadTotalPlayers - startingLineupTotal;
  const detectedTactic = tacticNameForCounts(countsByPosition(starters));

  if (starters.length !== startingLineupTotal) {
    warnings.push(`Imported starters restored ${starters.length}/${startingLineupTotal}.`);
  }

  if (bench.length !== expectedBenchPlayers) {
    warnings.push(`Imported bench restored ${bench.length}/${expectedBenchPlayers}.`);
  }

  if (!detectedTactic) {
    warnings.push("Imported starter positions do not match an allowed formation.");
  } else if (detectedTactic !== tacticSelect.value) {
    tacticSelect.value = detectedTactic;
    summaryTactic.textContent = detectedTactic;
    warnings.push(`Formation changed to ${detectedTactic} to match the imported starters.`);
  }

  return warnings;
}

function restoreImportedUserSquadSelections(squadState, starters, bench) {
  const warnings = [];
  const starterIds = new Set(starters.map((player) => player.id));
  const benchIds = bench.map((player) => player.id);
  const benchIdSet = new Set(benchIds);
  const captainId = squadState.user_captain_id;
  const viceCaptainId = squadState.user_vice_captain_id;
  const benchOrderIds = Array.isArray(squadState.bench_order_player_ids)
    ? squadState.bench_order_player_ids
    : [];
  const restoreUserBenchOrder = squadState.bench_order_source === "user_selected";

  clearUserSquadSelections();

  if (captainId) {
    if (starterIds.has(captainId)) {
      userCaptainId = captainId;
    } else {
      warnings.push(`Imported user captain ID was not found in restored starters: ${captainId}.`);
    }
  }

  if (viceCaptainId) {
    if (starterIds.has(viceCaptainId) && viceCaptainId !== userCaptainId) {
      userViceCaptainId = viceCaptainId;
    } else {
      warnings.push(`Imported user vice captain ID was not found in restored starters or matched captain: ${viceCaptainId}.`);
    }
  }

  if (benchOrderIds.length && restoreUserBenchOrder) {
    const restoredOrderIds = [];

    benchOrderIds.forEach((playerId) => {
      if (benchIdSet.has(playerId) && !restoredOrderIds.includes(playerId)) {
        restoredOrderIds.push(playerId);
      } else if (!benchIdSet.has(playerId)) {
        warnings.push(`Imported bench order ID was not found in restored bench: ${playerId}.`);
      }
    });

    benchIds.forEach((playerId) => {
      if (!restoredOrderIds.includes(playerId)) {
        restoredOrderIds.push(playerId);
      }
    });

    userBenchOrderIds = restoredOrderIds;
  }

  normalizeUserSquadSelections(starters, bench);

  return warnings;
}

function restoreTeamFromExportPayload(payload) {
  if (!payload || payload.schema_version !== "team-export-v1") {
    throw new Error("Import needs a team file exported from this Team Builder.");
  }

  clearSavedDecisionExports();
  clearMatchdayDecisionInputs();
  setImportedBuilderSettings(payload);

  const squadState = payload.squad_state || {};
  const starterIds = importedIdList(squadState.starter_player_ids, payload.starting_11);
  const benchIds = importedIdList(squadState.bench_player_ids, payload.bench);
  const starterImport = importedPlayersFromIds(starterIds);
  const benchImport = importedPlayersFromIds(benchIds);
  const missingSetIds = applyImportedPlayerSets(payload);
  const missingIds = [
    ...starterImport.missingIds,
    ...benchImport.missingIds,
    ...missingSetIds
  ];
  const lineupWarnings = validateImportedLineup(starterImport.foundPlayers, benchImport.foundPlayers);
  const restoreIsComplete = starterImport.foundPlayers.length === startingLineupTotal &&
    benchImport.foundPlayers.length === squadTotalPlayers - startingLineupTotal &&
    tacticNameForCounts(countsByPosition(starterImport.foundPlayers));
  const userSelectionWarnings = restoreImportedUserSquadSelections(
    squadState,
    starterImport.foundPlayers,
    benchImport.foundPlayers
  );

  selectedSwap = null;
  renderMeasureInfo();
  renderPlayerPicker();
  renderCaptainPicks();
  renderDashboardSections();
  renderAdviceTable();
  renderRemovedPlayers();
  updateControlStates();

  let importMessage = "";
  if (restoreIsComplete) {
    renderTeam(starterImport.foundPlayers, benchImport.foundPlayers, [], "built");
    importMessage = `Loaded ${payload.team_name || "saved Team export"} with ${startingLineupTotal} starters and ${benchLabel()}. Rebuild only if you want Team Builder to change it.`;
  } else {
    renderLockedPreview();
    importMessage = "Loaded the settings and available locked players, but the saved squad could not be fully restored.";
  }

  const decisionImport = restoreImportedDecisionTools(payload);
  renderSavedSquadDecisionPanels();
  teamMessage.textContent = decisionImport.importedCount
    ? `${importMessage} Restored ${decisionImport.importedCount} saved decision scenario${decisionImport.importedCount === 1 ? "" : "s"} as imported review context; rerun the advisor before acting.`
    : importMessage;

  const importWarnings = [
    ...lineupWarnings,
    ...userSelectionWarnings,
    ...decisionImport.warnings
  ];

  if (missingIds.length || importWarnings.length) {
    const uniqueMissingIds = Array.from(new Set(missingIds));
    const missingText = uniqueMissingIds.length
      ? ` Missing player IDs: ${uniqueMissingIds.join(", ")}.`
      : "";
    showBuilderWarning(`${importWarnings.join(" ")}${missingText}`.trim());
  }
}

async function importTeamJson(event) {
  const file = event.target.files?.[0];

  if (!file) {
    return;
  }

  try {
    const jsonText = await file.text();
    const payload = JSON.parse(jsonText);
    restoreTeamFromExportPayload(payload);
  } catch (error) {
    showBuilderWarning(error.message || "Team JSON import failed. Check that the file came from Export Team JSON.");
    teamMessage.textContent = "Team JSON import failed. The current squad was left unchanged.";
  } finally {
    event.target.value = "";
  }
}

function renderMeasureOptions() {
  const renderPickOptions = (keys) => keys
    .map((key) => {
      const option = pickModelOptions[key];
      if (option) {
        return `<option value="${key}">${option.label}</option>`;
      }
      return `<option value="${key}">${measures[key].optionLabel || measures[key].label}</option>`;
    })
    .join("");
  const renderBuilderOptions = (keys) => keys
    .map((key) => {
      const option = teamBuilderStrategyOption(key);
      return `<option value="${key}">${option.label}</option>`;
    })
    .join("");
  const builderOptionsHtml = renderBuilderOptions(teamBuilderStrategyOptionKeys);
  const publicPickOptionsHtml = renderPickOptions(publicPickModelOptionKeys);

  if (measureSelect) {
    const previousValue = measureSelect.value;
    measureSelect.innerHTML = builderOptionsHtml;
    measureSelect.value = normalizeTeamBuilderStrategyKey(previousValue);
  }

  [quickPickModelSelect, adviceMeasureSelect].filter(Boolean).forEach((select) => {
    const previousValue = select.value;
    select.innerHTML = publicPickOptionsHtml;
    select.value = publicPickModelOptionKeys.includes(previousValue) ? previousValue : "expected";
  });

  if (quickModelHelpList) {
    quickModelHelpList.innerHTML = publicPickModelOptionKeys
      .map((key) => {
        const option = pickModelOption(key);
        return `<li><strong>${option.label}:</strong> ${option.help}</li>`;
      })
      .join("");
  }
}

function renderFinanceLensOptions() {
  if (!adviceFinanceLensSelect) return;

  adviceFinanceLensSelect.innerHTML = Object.values(financeLenses)
    .map((lens) => `<option value="${lens.id}">${lens.label}</option>`)
    .join("");
  adviceFinanceLensSelect.value = "styleRanking";
}

function renderTrustModeOptions() {
  const optionsHtml = Object.values(trustModes)
    .map((mode) => `<option value="${mode.id}">${mode.optionLabel}</option>`)
    .join("");

  trustModeSelects.forEach((select) => {
    select.innerHTML = optionsHtml;
    select.value = activeTrustModeId;
  });
  renderTrustModeSummary();
}

function syncTrustModeControls() {
  trustModeSelects.forEach((select) => {
    select.value = activeTrustModeId;
  });
  renderTrustModeSummary();
}

function renderMatchdayOptions() {
  const optionsHtml = matchdayOptions
    .map((option) => `<option value="${option.matchday_id}">${option.label}</option>`)
    .join("");

  [adviceMatchdaySelect, builderMatchdaySelect].filter(Boolean).forEach((select) => {
    select.innerHTML = optionsHtml;
    select.value = activeMatchdayId;
  });
}

function renderCardStatOptions() {
  cardStatSelect.innerHTML = Object.entries(cardStats)
    .map(([key, stat]) => `<option value="${key}">${stat.label}</option>`)
    .join("");
}

function renderMeasureInfo() {
  const measure = activeMeasure();
  const selectedStrategyOption = activeBuilderStrategyOption();
  const trustMode = activeTrustMode();
  const matchdayCopy = activeMatchdayId === "group_stage_full"
    ? "Uses the full group-stage fixture view."
    : `Uses ${activeMatchdayLabel()} fixture opponents.`;

  measureInfo.innerHTML = `
    <strong>${selectedStrategyOption.label}</strong>
    <span class="measure-info__secondary">Squad-building strategy</span>
    <p><strong>What it tries to build:</strong> ${selectedStrategyOption.whatItBuilds || selectedStrategyOption.description}</p>
    <p><strong>How it chooses players:</strong> ${selectedStrategyOption.howItChooses || measure.formula}</p>
    <p><strong>Main tradeoff:</strong> ${selectedStrategyOption.mainTradeoff || selectedStrategyOption.optimizationNote}</p>
    <p><strong>Best for users who want:</strong> ${selectedStrategyOption.bestFor || "a clear squad-building style."}</p>
    <p><strong>Player signal:</strong> ${selectedStrategyOption.playerSignal || measure.formula}</p>
    <p><strong>Match view:</strong> ${matchdayCopy}</p>
    <p><strong>Safety setting:</strong> ${publicTrustModeDescription(trustMode)}</p>
  `;
}

function normalizeText(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function directChildElements(parent, selector) {
  return Array.from(parent.children).filter((child) => child.matches(selector));
}

function statNameFromParagraph(paragraph) {
  const strongText = paragraph.querySelector("strong")?.textContent || "";
  return normalizeText(strongText.replace(":", ""));
}

function exampleSummaryText(example) {
  return normalizeText(example.querySelector("summary")?.textContent || "");
}

function exampleMatchesStat(example, statName) {
  const summary = exampleSummaryText(example);
  const exactMatches = {
    "total estimate": ["example performance total"],
    "reliability score": ["example reliability"],
    "price": ["example price"],
    "reliability": ["example reliability on the page"],
    "per 90": ["example per 90 on the page"],
    "risk": ["example risk on the page"],
    "style score": [
      "example style score",
      "example best overall style",
      "example projected points style",
      "example reliable pick style",
      "example upside pick style",
      "example likely minutes style",
      "example avoid bad weeks low tail risk",
      "example risk adjusted pick sharpe style on the page",
      "example downside protection pick sortino style on the page",
      "example var and cvar",
      "example very risky upside"
    ],
    "projected": ["example projected"],
    "var and cvar": ["example var and cvar"],
    "very risky upside": ["example very risky upside"]
  };

  if (exactMatches[statName]?.includes(summary)) {
    return true;
  }

  const shortStatNames = new Set(["price", "risk", "expected", "projected", "per 90"]);

  return !shortStatNames.has(statName) && summary.includes(statName);
}

// The HTML stays easy to read, then this helper makes the Stats section nicer:
// each stat definition becomes a small card with its matching example beside it.
function organizeStatExamples() {
  document.querySelectorAll(".formula-section").forEach((section) => {
    const formulaList = directChildElements(section, ".formula-list")[0];

    if (!formulaList || formulaList.dataset.organized === "true") {
      return;
    }

    const statParagraphs = directChildElements(formulaList, "p");
    const examples = directChildElements(section, ".stat-example");

    if (!statParagraphs.length || !examples.length) {
      return;
    }

    const usedExamples = new Set();
    const organizedStats = document.createDocumentFragment();

    statParagraphs.forEach((paragraph) => {
      const statName = statNameFromParagraph(paragraph);
      const statCard = document.createElement("article");
      const exampleColumn = document.createElement("div");
      statCard.className = "formula-item";
      exampleColumn.className = "formula-examples";
      statCard.appendChild(paragraph);

      examples.forEach((example) => {
        if (!usedExamples.has(example) && exampleMatchesStat(example, statName)) {
          exampleColumn.appendChild(example);
          usedExamples.add(example);
        }
      });

      if (exampleColumn.children.length) {
        statCard.appendChild(exampleColumn);
      }

      organizedStats.appendChild(statCard);
    });

    const groupExamples = examples.filter((example) => !usedExamples.has(example));

    if (groupExamples.length) {
      const groupCard = document.createElement("article");
      const groupIntro = document.createElement("p");
      groupCard.className = "formula-item formula-item--wide";
      groupIntro.innerHTML = "<strong>Extra group example:</strong> broader examples that explain how this group of stats behaves.";
      groupCard.appendChild(groupIntro);
      groupExamples.forEach((example) => groupCard.appendChild(example));
      organizedStats.appendChild(groupCard);
    }

    formulaList.replaceChildren(organizedStats);
    formulaList.dataset.organized = "true";
  });
}

function priceFilterValue(input) {
  return input.value === "" ? null : Number(input.value);
}

function priceFiltersAreInvalid() {
  const minPrice = priceFilterValue(minPriceFilter);
  const maxPrice = priceFilterValue(maxPriceFilter);

  return minPrice !== null && maxPrice !== null && minPrice > maxPrice;
}

function priceMatchesFilters(player) {
  if (priceFiltersAreInvalid()) {
    return false;
  }

  const minPrice = priceFilterValue(minPriceFilter);
  const maxPrice = priceFilterValue(maxPriceFilter);
  const playerPrice = value(player.price);

  if (minPrice !== null && playerPrice < minPrice) {
    return false;
  }

  if (maxPrice !== null && playerPrice > maxPrice) {
    return false;
  }

  return true;
}

function boundedNumberFilterValue(input, minValue = 0, maxValue = Infinity) {
  if (!input || input.value === "") {
    return null;
  }

  const number = Number(input.value);

  if (!Number.isFinite(number)) {
    return null;
  }

  return Math.min(maxValue, Math.max(minValue, number));
}

function builderRiskSettings() {
  return {
    minStartProbability: boundedNumberFilterValue(minStartFilter, 0, 100),
    minExpectedMinutes: boundedNumberFilterValue(minMinutesFilter, 0, 120),
    maxQaReviewPlayers: null,
    allowRiskyPicks: true
  };
}

function builderRiskControlsActive(settings = builderRiskSettings()) {
  return settings.minStartProbability !== null ||
    settings.minExpectedMinutes !== null;
}

function builderRiskyPlayer(player, measureKey = measureKeyForTrust(activeMeasure())) {
  const recommendationUse = recommendationUseForPlayer(player);

  return ["use_as_filler_or_watchlist", "manual_review_before_ranking", "do_not_rank_yet"].includes(recommendationUse) ||
    scoreValue(player, "start_probability_percent") < 35 ||
    scoreValue(player, "expected_minutes_v0") < 30 ||
    scoreValue(player, "finance_composite_risk_score", "risk_composite_score") >= 80 ||
    scoreValue(player, "finance_tail_risk_score", "risk_tail_score") >= 80 ||
    player.finance_label === "avoid_for_now";
}

function playerMatchesBuilderRiskControls(player, settings = builderRiskSettings(), options = {}) {
  if (options.keepLocked && lockedPlayerIds.has(player.id)) {
    return true;
  }

  if (
    settings.minStartProbability !== null &&
    scoreValue(player, "start_probability_percent") < settings.minStartProbability
  ) {
    return false;
  }

  if (
    settings.minExpectedMinutes !== null &&
    scoreValue(player, "expected_minutes_v0") < settings.minExpectedMinutes
  ) {
    return false;
  }

  return true;
}

function qaReviewCountForPlayers(playerList, measureKey = measureKeyForTrust(activeMeasure())) {
  return playerList.filter((player) =>
    qaStatusFromFlags(qaFlagsForPlayer(player, measureKey)) === "review"
  ).length;
}

function builderRiskSettingsSummary(settings = builderRiskSettings()) {
  const parts = [];

  if (settings.minStartProbability !== null) {
    parts.push(`min start ${displayNumber(settings.minStartProbability)}%`);
  }

  if (settings.minExpectedMinutes !== null) {
    parts.push(`min minutes ${displayNumber(settings.minExpectedMinutes)}`);
  }

  return parts.join(", ") || "standard squad filters";
}

function builderRiskViolationsForSquad(squad, settings = builderRiskSettings(), measureKey = measureKeyForTrust(activeMeasure())) {
  const violations = [];
  const labelPlayers = (playerList) => playerList.slice(0, 4).map((player) => player.name).join(", ");

  if (settings.minStartProbability !== null) {
    const lowStartPlayers = squad.filter((player) =>
      scoreValue(player, "start_probability_percent") < settings.minStartProbability
    );

    if (lowStartPlayers.length) {
      violations.push(`${lowStartPlayers.length} squad player${lowStartPlayers.length === 1 ? "" : "s"} below the ${displayNumber(settings.minStartProbability)}% start floor: ${labelPlayers(lowStartPlayers)}.`);
    }
  }

  if (settings.minExpectedMinutes !== null) {
    const lowMinutesPlayers = squad.filter((player) =>
      scoreValue(player, "expected_minutes_v0") < settings.minExpectedMinutes
    );

    if (lowMinutesPlayers.length) {
      violations.push(`${lowMinutesPlayers.length} squad player${lowMinutesPlayers.length === 1 ? "" : "s"} below the ${displayNumber(settings.minExpectedMinutes)} expected-minutes floor: ${labelPlayers(lowMinutesPlayers)}.`);
    }
  }

  return violations;
}

function playerMatchesBuilderCountryFilter(player, options = {}) {
  if (selectedCountryFilter === "All") {
    return true;
  }

  if (options.keepLocked && lockedPlayerIds.has(player.id)) {
    return true;
  }

  return playerCountryKey(player) === selectedCountryFilter;
}

function lockedCountryFilterConflicts() {
  if (selectedCountryFilter === "All") {
    return [];
  }

  return Array.from(lockedPlayerIds)
    .map(playerById)
    .filter(Boolean)
    .filter((player) => playerCountryKey(player) !== selectedCountryFilter);
}

function availableFillCandidates(position, usedIds, countryCounts = null) {
  const measure = activeMeasure();
  const candidates = players.filter((player) =>
    player.position === position &&
    playerAllowedForActiveMatchday(player) &&
    !usedIds.has(player.id) &&
    !excludedPlayerIds.has(player.id) &&
    priceMatchesFilters(player) &&
    playerMatchesBuilderCountryFilter(player) &&
    playerMatchesBuilderRiskControls(player) &&
    (!countryCounts || canAddCountry(player, countryCounts))
  );

  return trustFilteredPlayers(candidates, measure, activeTrustMode());
}

function toggleScoreInfo() {
  if (!scoreInfo || !scoreInfoButton) return;

  const isHidden = scoreInfo.classList.toggle("hidden");
  scoreInfoButton.setAttribute("aria-expanded", String(!isHidden));
}

function renderPlayerPicker() {
  const measure = activeMeasure();
  const builderStrategyLabel = activeBuilderStrategyLabel();
  const searchValue = normalizeText(playerSearch.value);
  const filteredPlayers = players
    .filter((player) => playerAllowedForActiveMatchday(player))
    .filter((player) => !excludedPlayerIds.has(player.id))
    .filter((player) => selectedPositionFilter === "All" || player.position === selectedPositionFilter)
    .filter((player) => playerMatchesBuilderCountryFilter(player, { keepLocked: true }))
    .filter(priceMatchesFilters)
    .filter((player) => playerMatchesBuilderRiskControls(player, builderRiskSettings(), { keepLocked: true }))
    .filter((player) => playerSearchText(player).includes(searchValue));
  const rankedPlayers = rankedRecommendationPlayers(filteredPlayers, measure, activeTrustMode(), {
    allowFallback: true,
    keepLocked: true
  });
  const lockedVisiblePlayers = filteredPlayers.filter((player) => lockedPlayerIds.has(player.id));
  const seenVisiblePlayerIds = new Set();
  const visiblePlayers = [...lockedVisiblePlayers, ...rankedPlayers]
    .filter((player) => {
      if (seenVisiblePlayerIds.has(player.id)) {
        return false;
      }
      seenVisiblePlayerIds.add(player.id);
      return true;
    })
    .slice(0, 80);

  if (!visiblePlayers.length) {
    playerPicker.innerHTML = `
      <p class="empty-picker">No players match these filters yet. Try changing the position, price range, or search text.</p>
    `;
    return;
  }

  playerPicker.innerHTML = visiblePlayers.map((player) => {
    const isChecked = lockedPlayerIds.has(player.id) ? "checked" : "";
    const projection = activeProjection(player);
    const scoreModelText = projection && hasScoreValue(projection, "team_expected_goals")
      ? ` · xG ${displayNumber(projection.team_expected_goals)}`
      : "";
    const fixtureText = projection
      ? ` · vs ${projection.opponent} (${displayNumber(projection.fixture_difficulty_score)} diff.${scoreModelText})`
      : "";
    const roleText = playerRoleText(player);
    const roleDetail = roleText ? ` · ${roleText}` : "";

    return `
      <label class="player-option">
        <input type="checkbox" value="${player.id}" ${isChecked} />
        <span>
          <strong>${playerDetailButton(player, "player-name-button--picker", measure.key)}</strong>
          <small>Fantasy position: ${player.position} · ${player.club} · ${playerCountryText(player)}${fixtureText}${roleDetail}</small>
        </span>
        <span class="player-option__metrics">
          <em><span>Price</span>${playerPriceText(player)}</em>
          <em title="${escapeHtml(scoreSummaryText(player, measure))}"><span>${escapeHtml(builderStrategyLabel)}</span>${displayNumber(measureScore(player, measure))}</em>
        </span>
      </label>
    `;
  }).join("");
}

function updatePositionFilter(event) {
  selectedPositionFilter = event.target.value;
  renderPlayerPicker();
}

function updateCountryFilter(event) {
  selectedCountryFilter = event.target.value;
  updateBuilderFilters();
}

function updateBuilderFilters() {
  renderPlayerPicker();

  if (currentRenderMode === "built") {
    buildTeam();
  } else {
    renderLockedPreview();
  }
}

function updateMatchdayView(nextMatchdayId) {
  activeMatchdayId = matchdayOptions.some((option) => option.matchday_id === nextMatchdayId)
    ? nextMatchdayId
    : defaultActiveMatchdayId;
  refreshActiveCountryLimit();
  refreshActiveBudgetLimit();

  [adviceMatchdaySelect, builderMatchdaySelect].filter(Boolean).forEach((select) => {
    select.value = activeMatchdayId;
  });
  setMatchdayDecisionMatchday(activeMatchdayId);
  renderBuilderActionCopy();
  renderCountryFilterOptions();
  renderDecisionFilterOptions();

  renderMeasureInfo();
  renderPlayerPicker();
  renderCaptainPicks();
  renderDashboardSections();
  renderAdviceTable();

  if (currentRenderMode === "built") {
    buildTeam();
  } else {
    renderLockedPreview();
  }
}

function updateTrustMode(nextTrustModeId) {
  activeTrustModeId = trustModes[nextTrustModeId] ? nextTrustModeId : "balanced";
  syncTrustModeControls();
  renderMeasureInfo();
  renderPlayerPicker();
  renderCaptainPicks();
  renderDashboardSections();
  renderAdviceTable();

  if (currentRenderMode === "built") {
    buildTeam();
  } else {
    renderLockedPreview();
  }
}

function updateLockedPlayers(event) {
  if (event.target.type !== "checkbox") {
    return;
  }

  if (event.target.checked) {
    lockedPlayerIds.add(event.target.value);
  } else {
    lockedPlayerIds.delete(event.target.value);
  }

  updateControlStates();
  renderLockedPreview();
  renderDashboardSections();
  renderCaptainPicks();
  renderAdviceTable();
}

// Locked players are kept first, but only while they fit the loaded squad limits.
function getValidLockedSquadPlayers(measure, profile = teamBuilderStrategyScoringProfile()) {
  const lockedPlayers = sortPlayersForBuilderStrategy(
    players.filter((player) =>
      playerAllowedForActiveMatchday(player) &&
      lockedPlayerIds.has(player.id) &&
      !excludedPlayerIds.has(player.id)
    ),
    measure,
    "starter",
    profile
  );
  const usedByPosition = emptyPositionCounts();
  const usedByCountry = {};
  const validLockedPlayers = [];
  const ignoredLockedPlayers = [];

  lockedPlayers.forEach((player) => {
    if (
      usedByPosition[player.position] < squadRequirements[player.position] &&
      canAddCountry(player, usedByCountry)
    ) {
      usedByPosition[player.position] += 1;
      incrementCountryCount(usedByCountry, player);
      validLockedPlayers.push(player);
    } else {
      ignoredLockedPlayers.push(player);
    }
  });

  return { validLockedPlayers, ignoredLockedPlayers, usedByPosition, usedByCountry };
}

function chooseStartersFromSquad(squad, requirements, measure, profile = teamBuilderStrategyScoringProfile()) {
  const starters = [];
  const starterIds = new Set();

  positionOrder.forEach((position) => {
    const lockedOptions = sortPlayersForBuilderStrategy(
      squad.filter((player) => player.position === position && lockedPlayerIds.has(player.id)),
      measure,
      "starter",
      profile
    );
    const otherOptions = sortPlayersForBuilderStrategy(
      squad.filter((player) => player.position === position && !lockedPlayerIds.has(player.id)),
      measure,
      "starter",
      profile
    );

    [...lockedOptions, ...otherOptions].slice(0, requirements[position]).forEach((player) => {
      starters.push(player);
      starterIds.add(player.id);
    });
  });

  return { starters, starterIds };
}

function optimizerStateFromPlayers(playerList, measure) {
  return {
    squad: [...playerList],
    usedIds: new Set(playerList.map((player) => player.id)),
    countryCounts: countryCountsFromPlayers(playerList),
    positionCounts: countsByPosition(playerList),
    qaReviewCount: qaReviewCountForPlayers(playerList, measureKeyForTrust(measure)),
    totalPrice: squadCost(playerList),
    score: playerList.reduce((sum, player) => sum + measureScore(player, measure), 0)
  };
}

function optimizerStateWithPlayer(state, player, measure) {
  const nextUsedIds = new Set(state.usedIds);
  const nextCountryCounts = { ...state.countryCounts };
  const nextPositionCounts = { ...state.positionCounts };

  nextUsedIds.add(player.id);
  incrementCountryCount(nextCountryCounts, player);
  nextPositionCounts[player.position] = (nextPositionCounts[player.position] || 0) + 1;

  return {
    squad: [...state.squad, player],
    usedIds: nextUsedIds,
    countryCounts: nextCountryCounts,
    positionCounts: nextPositionCounts,
    qaReviewCount: state.qaReviewCount + (
      qaStatusFromFlags(qaFlagsForPlayer(player, measureKeyForTrust(measure))) === "review" ? 1 : 0
    ),
    totalPrice: state.totalPrice + value(player.price),
    score: state.score + measureScore(player, measure)
  };
}

function optimizerStateIsValidFullSquad(state) {
  return (
    state.squad.length === squadTotalPlayers &&
    state.totalPrice <= initialBudget + 0.001 &&
    positionsMatchRequirements(state.positionCounts, squadRequirements) &&
    countryLimitViolations(state.countryCounts).length === 0
  );
}

function optimizerRemainingNeeds(positionCounts) {
  return positionOrder.reduce((needs, position) => {
    needs[position] = Math.max(0, squadRequirements[position] - (positionCounts[position] || 0));
    return needs;
  }, {});
}

function resetOptimizerPriceFloorCache() {
  optimizerPriceFloorCache = null;
}

function resetOptimizerStateRankCache() {
  optimizerStateRankCache = new WeakMap();
}

function resetTeamBuilderStrategyPlayerScoreCache() {
  teamBuilderStrategyPlayerScoreCache.clear();
}

function optimizerPriceFloorsByPosition() {
  if (optimizerPriceFloorCache) {
    return optimizerPriceFloorCache;
  }

  optimizerPriceFloorCache = positionOrder.reduce((floors, position) => {
    floors[position] = players
      .filter((player) =>
        player.position === position &&
        playerAllowedForActiveMatchday(player) &&
        !excludedPlayerIds.has(player.id) &&
        priceMatchesFilters(player) &&
        playerMatchesBuilderCountryFilter(player) &&
        playerMatchesBuilderRiskControls(player)
      )
      .map((player) => value(player.price))
      .sort((a, b) => a - b);

    return floors;
  }, {});

  return optimizerPriceFloorCache;
}

function optimizerCheapestRemainingCost(state) {
  const needs = optimizerRemainingNeeds(state.positionCounts);
  const floors = optimizerPriceFloorsByPosition();
  let totalCost = 0;

  for (const position of positionOrder) {
    const needed = needs[position];

    if (!needed) {
      continue;
    }

    const affordablePrices = floors[position] || [];

    if (affordablePrices.length < needed) {
      return Infinity;
    }

    totalCost += affordablePrices
      .slice(0, needed)
      .reduce((sum, price) => sum + price, 0);
  }

  return totalCost;
}

function optimizerCanAffordCompletion(state) {
  const cheapestRemainingCost = optimizerCheapestRemainingCost(state);

  return Number.isFinite(cheapestRemainingCost) &&
    state.totalPrice + cheapestRemainingCost <= initialBudget + 0.001;
}

function optimizerStateRank(state, measure, tacticName) {
  const cachedRank = optimizerStateRankCache.get(state);

  if (cachedRank !== undefined) {
    return cachedRank;
  }

  const profile = teamBuilderStrategyScoringProfile();
  let rank;

  if (state.squad.length < squadTotalPlayers) {
    const cheapestRemainingCost = optimizerCheapestRemainingCost(state);

    if (!Number.isFinite(cheapestRemainingCost)) {
      return -Infinity;
    }

    const remainingAfterMinimum = initialBudget - state.totalPrice - cheapestRemainingCost;
    const budgetPressurePenalty = Math.max(0, -remainingAfterMinimum) * 25;

    const budgetReserveWeight = builderRiskControlsActive()
      ? Math.max(0.55, profile.partialReserveWeight)
      : profile.partialReserveWeight;
    const strategyStateScore = state.squad.reduce((sum, player) =>
      sum + teamBuilderStrategyPlayerScore(player, measure, "starter", profile),
    0);
    const topCountryLoad = Math.max(0, Math.max(0, ...Object.values(state.countryCounts)) - 1);
    const premiumCount = state.squad.filter((player) => proxyPrice(player) >= 9.5).length;
    const cheapPlayableCount = state.squad.filter((player) =>
      proxyPrice(player) <= 6 &&
      scoreValue(player, "start_probability_percent") >= 45 &&
      scoreValue(player, "expected_minutes_v0") >= 40
    ).length;

    rank =
      state.score * profile.partialBaseWeight +
      strategyStateScore * profile.partialStrategyWeight +
      Math.max(0, remainingAfterMinimum) * budgetReserveWeight -
      budgetPressurePenalty -
      topCountryLoad * profile.partialConcentrationPenalty +
      premiumCount * profile.partialPremiumReward +
      cheapPlayableCount * profile.partialCheapReward;
    optimizerStateRankCache.set(state, rank);
    return rank;
  }

  const requirements = tactics[tacticName] || {};
  const { starters, starterIds } = chooseStartersFromSquad(state.squad, requirements, measure, profile);
  const bench = state.squad.filter((player) => !starterIds.has(player.id));
  const starterScore = starters.reduce((sum, player) =>
    sum + teamBuilderStrategyPlayerScore(player, measure, "starter", profile),
  0);
  const benchScore = bench.reduce((sum, player) =>
    sum + teamBuilderStrategyPlayerScore(player, measure, "bench", profile),
  0);
  const captain = [...starters]
    .filter((player) => player.position !== "Goalkeeper")
    .sort((a, b) => captainRecommendationScore(b) - captainRecommendationScore(a))[0];
  const captainBonus = captain ? captainRecommendationScore(captain) * 0.04 * profile.captainBonusWeight : 0;
  const budgetBuffer = Math.max(0, initialBudget - state.totalPrice) * 0.02 * profile.budgetBufferWeight;
  const portfolioAdjustment = portfolioOptimizerAdjustment(starters, bench, measure, activeTrustMode(), profile).adjustment_score;

  rank =
    starterScore * profile.starterScoreWeight +
    benchScore * profile.benchScoreWeight +
    captainBonus +
    budgetBuffer +
    portfolioAdjustment;
  optimizerStateRankCache.set(state, rank);
  return rank;
}

function optimizerSlotOrder(positionCounts) {
  return [...positionOrder]
    .sort((a, b) => squadRequirements[a] - squadRequirements[b])
    .flatMap((position) =>
      Array.from({ length: Math.max(0, squadRequirements[position] - (positionCounts[position] || 0)) }, () => position)
    );
}

function uniqueOptimizerCandidates(candidateLists) {
  const seenIds = new Set();
  const uniquePlayers = [];

  candidateLists.flat().forEach((player) => {
    if (!seenIds.has(player.id)) {
      seenIds.add(player.id);
      uniquePlayers.push(player);
    }
  });

  return uniquePlayers;
}

function optimizerCandidatePools(measure) {
  const riskSettings = builderRiskSettings();
  const measureKey = measureKeyForTrust(measure);
  const profile = teamBuilderStrategyScoringProfile();

  return positionOrder.reduce((pools, position) => {
    const candidates = players.filter((player) =>
      player.position === position &&
      playerAllowedForActiveMatchday(player) &&
      !excludedPlayerIds.has(player.id) &&
      priceMatchesFilters(player) &&
      playerMatchesBuilderCountryFilter(player) &&
      playerMatchesBuilderRiskControls(player)
    );
    const trustCandidates = trustFilteredPlayers(candidates, measure, activeTrustMode());
    const trustScoredCandidates = trustCandidates.map((player) => ({
      player,
      score: measureScore(player, measure),
      price: proxyPrice(player),
      cheapEnablerScore: scoreValue(player, "cheap_enabler_score_v1", "cheap_enabler_score"),
      riskAdjustedReturn: scoreValue(player, "finance_risk_adjusted_return_points", "risk_adjusted_expected_points_estimate")
    }));
    const strategyScoredCandidates = trustCandidates.map((player) => ({
      player,
      starterScore: teamBuilderStrategyPlayerScore(player, measure, "starter", profile),
      benchScore: teamBuilderStrategyPlayerScore(player, measure, "bench", profile),
      expectedReturn: playerProjectedPoints(player),
      riskAdjustedReturn: playerRiskAdjustedPoints(player),
      upsideReturn: playerCeilingPoints(player),
      captainSignal: captainRecommendationScore(player),
      startProbability: scoreValue(player, "start_probability_percent"),
      expectedMinutes: scoreValue(player, "expected_minutes_v0"),
      reliabilityScore: playerReliabilityScore(player),
      floorScore: playerFloorScore(player),
      valueScore: measureScore(player, measures.bestValue),
      cheapEnablerScore: scoreValue(player, "cheap_enabler_score_v1", "cheap_enabler_score"),
      premiumScore: measureScore(player, measures.premiumWorthIt),
      price: proxyPrice(player),
      attackingContext: playerAttackingContextScore(player)
    }));
    const rawScoredCandidates = candidates.map((player) => ({
      player,
      rawScore: rawMeasureScore(player, measure),
      price: proxyPrice(player),
      riskAdjustedReturn: scoreValue(player, "finance_risk_adjusted_return_points", "risk_adjusted_expected_points_estimate")
    }));
    const byMeasure = [...trustScoredCandidates]
      .sort((a, b) => b.score - a.score || b.riskAdjustedReturn - a.riskAdjustedReturn)
      .map((entry) => entry.player);
    const byCheapPlayable = [...trustScoredCandidates]
      .sort((a, b) => a.price - b.price || b.score - a.score)
      .map((entry) => entry.player);
    const byCheapEnabler = [...trustScoredCandidates]
      .filter((entry) => entry.cheapEnablerScore >= 50 || entry.player.value_role === "cheap_enabler")
      .sort((a, b) => b.cheapEnablerScore - a.cheapEnablerScore || a.price - b.price)
      .map((entry) => entry.player);
    const byStrategyStarter = [...strategyScoredCandidates]
      .sort((a, b) => b.starterScore - a.starterScore || b.expectedReturn - a.expectedReturn)
      .map((entry) => entry.player);
    const byStrategyBench = [...strategyScoredCandidates]
      .sort((a, b) => b.benchScore - a.benchScore || a.price - b.price)
      .map((entry) => entry.player);
    const byTopProjected = [...strategyScoredCandidates]
      .sort((a, b) => b.expectedReturn - a.expectedReturn || b.captainSignal - a.captainSignal)
      .map((entry) => entry.player);
    const byCaptainPriority = [...strategyScoredCandidates]
      .filter((entry) => entry.player.position !== "Goalkeeper")
      .sort((a, b) => b.captainSignal - a.captainSignal || b.expectedReturn - a.expectedReturn)
      .map((entry) => entry.player);
    const byPlayableProjection = [...strategyScoredCandidates]
      .filter((entry) =>
        entry.startProbability >= 55 &&
        entry.expectedMinutes >= 45 &&
        entry.expectedReturn >= (["Forward", "Midfielder"].includes(position) ? 4.2 : 3.5)
      )
      .sort((a, b) => b.expectedReturn + b.riskAdjustedReturn * 0.6 - (a.expectedReturn + a.riskAdjustedReturn * 0.6))
      .map((entry) => entry.player);
    const byReliableFloor = [...strategyScoredCandidates]
      .sort((a, b) => b.reliabilityScore + b.floorScore * 0.35 - (a.reliabilityScore + a.floorScore * 0.35))
      .map((entry) => entry.player);
    const byUpsideContext = [...strategyScoredCandidates]
      .sort((a, b) => b.upsideReturn * 8 + b.attackingContext - (a.upsideReturn * 8 + a.attackingContext))
      .map((entry) => entry.player);
    const byPremiumStarter = [...strategyScoredCandidates]
      .filter((entry) => entry.price >= 8.5 || entry.premiumScore >= 65)
      .sort((a, b) => b.premiumScore + b.expectedReturn * 6 - (a.premiumScore + a.expectedReturn * 6))
      .map((entry) => entry.player);
    const byValueDepth = [...strategyScoredCandidates]
      .sort((a, b) => b.valueScore + b.benchScore * 0.35 - (a.valueScore + a.benchScore * 0.35) || a.price - b.price)
      .map((entry) => entry.player);
    const qaSafeCandidates = trustScoredCandidates.filter((entry) =>
      qaStatusFromFlags(qaFlagsForPlayer(entry.player, measureKey)) !== "review"
    );
    const byQaSafeMeasure = [...qaSafeCandidates]
      .sort((a, b) => b.score - a.score || b.riskAdjustedReturn - a.riskAdjustedReturn)
      .map((entry) => entry.player);
    const byQaSafeCheap = [...qaSafeCandidates]
      .sort((a, b) => a.price - b.price || b.score - a.score)
      .map((entry) => entry.player);
    const fallbackByMeasure = [...rawScoredCandidates]
      .sort((a, b) => b.rawScore - a.rawScore || b.riskAdjustedReturn - a.riskAdjustedReturn)
      .map((entry) => entry.player);
    const fallbackByCheapPlayable = [...rawScoredCandidates]
      .sort((a, b) => a.price - b.price || b.rawScore - a.rawScore)
      .map((entry) => entry.player);
    const strategyExtraLists = {
      balancedSquad: [
        byTopProjected.slice(0, 95),
        byCaptainPriority.slice(0, 55),
        byPlayableProjection.slice(0, 75),
        byStrategyStarter.slice(0, 110),
        byStrategyBench.slice(0, 65),
        byReliableFloor.slice(0, 45),
        byValueDepth.slice(0, 30)
      ],
      diversifiedSquad: [
        byTopProjected.slice(0, 75),
        byPlayableProjection.slice(0, 105),
        byStrategyStarter.slice(0, 115),
        byStrategyBench.slice(0, 100),
        byReliableFloor.slice(0, 115),
        byValueDepth.slice(0, 60)
      ],
      concentratedUpside: [
        byTopProjected.slice(0, 120),
        byCaptainPriority.slice(0, 90),
        byStrategyStarter.slice(0, 125),
        byUpsideContext.slice(0, 125),
        byPremiumStarter.slice(0, 55),
        byStrategyBench.slice(0, 55)
      ],
      starsAndScrubs: [
        byTopProjected.slice(0, 130),
        byCaptainPriority.slice(0, 115),
        byStrategyStarter.slice(0, 130),
        byPremiumStarter.slice(0, 125),
        byMeasure.slice(0, 90),
        byCheapPlayable.slice(0, 115),
        byCheapEnabler.slice(0, 80)
      ],
      valueSquad: [
        byTopProjected.slice(0, 70),
        byPlayableProjection.slice(0, 90),
        byStrategyStarter.slice(0, 115),
        byStrategyBench.slice(0, 120),
        byValueDepth.slice(0, 135),
        byCheapPlayable.slice(0, 120),
        byCheapEnabler.slice(0, 95)
      ]
    };

    pools[position] = uniqueOptimizerCandidates([
      ...(strategyExtraLists[profile.id] || strategyExtraLists.balancedSquad),
      byTopProjected.slice(0, 80),
      byCaptainPriority.slice(0, 45),
      byPlayableProjection.slice(0, 70),
      byMeasure.slice(0, 90),
      byCheapPlayable.slice(0, 90),
      byCheapEnabler.slice(0, 60),
      byQaSafeMeasure.slice(0, riskSettings.maxQaReviewPlayers !== null ? 120 : 0),
      byQaSafeCheap.slice(0, riskSettings.maxQaReviewPlayers !== null ? 120 : 0),
      fallbackByMeasure.slice(0, activeTrustMode().filtersRanking
        ? 70
        : Math.max(0, squadRequirements[position] - byMeasure.length)),
      fallbackByCheapPlayable.slice(0, activeTrustMode().filtersRanking ? 90 : 0)
    ]);

    return pools;
  }, {});
}

function pruneOptimizerStates(states, measure, tacticName) {
  const stateKeys = new Set();
  const uniqueStates = [];
  const profile = teamBuilderStrategyScoringProfile();

  states.forEach((state) => {
    const key = [...state.usedIds].sort().join("|");

    if (!stateKeys.has(key)) {
      stateKeys.add(key);
      uniqueStates.push(state);
    }
  });

  const stateLimit = builderRiskControlsActive()
    ? Math.max(420, profile.stateLimit + 40)
    : activeTrustMode().filtersRanking ? Math.max(320, profile.stateLimit) : profile.stateLimit;

  return uniqueStates
    .sort((a, b) => optimizerStateRank(b, measure, tacticName) - optimizerStateRank(a, measure, tacticName))
    .slice(0, stateLimit);
}

// Team Builder searches several legal squad paths instead of accepting the first fill.
function buildSuggestedSquad() {
  resetOptimizerPriceFloorCache();
  resetOptimizerStateRankCache();
  resetTeamBuilderStrategyPlayerScoreCache();
  const tacticName = tacticSelect.value;
  const requirements = tactics[tacticName];
  const measure = activeMeasure();
  const profile = teamBuilderStrategyScoringProfile();
  const riskSettings = builderRiskSettings();
  const { validLockedPlayers, ignoredLockedPlayers, usedByCountry } =
    getValidLockedSquadPlayers(measure, profile);
  const lockedState = optimizerStateFromPlayers(validLockedPlayers, measure);
  let states = [lockedState];
  let bestPartialState = lockedState;
  let evaluatedPaths = 0;
  const slotOrder = optimizerSlotOrder(lockedState.positionCounts);
  const candidatePools = optimizerCandidatePools(measure);
  let budgetCouldNotFit = lockedState.totalPrice > initialBudget;
  let countryLimitCouldNotFit = ignoredLockedPlayers.some((player) =>
    !canAddCountry(player, { ...usedByCountry })
  );
  let riskConstraintsCouldNotFit = false;

  for (const nextPosition of slotOrder) {
    const nextStates = [];

    states.forEach((state) => {
      const candidates = candidatePools[nextPosition].filter((player) =>
        !state.usedIds.has(player.id) &&
        (state.positionCounts[player.position] || 0) < squadRequirements[player.position] &&
        canAddCountry(player, state.countryCounts)
      );
      const unblockedCandidates = candidatePools[nextPosition].filter((player) =>
        !state.usedIds.has(player.id)
      );

      if (!candidates.length && unblockedCandidates.length) {
        countryLimitCouldNotFit = true;
      }

      candidates.forEach((player) => {
        const nextState = optimizerStateWithPlayer(state, player, measure);
        const candidateAddsQaReview = nextState.qaReviewCount > state.qaReviewCount;

        if (
          riskSettings.maxQaReviewPlayers !== null &&
          candidateAddsQaReview &&
          state.qaReviewCount >= riskSettings.maxQaReviewPlayers
        ) {
          riskConstraintsCouldNotFit = true;
          return;
        }

        if (nextState.totalPrice > initialBudget + 0.001) {
          budgetCouldNotFit = true;
          return;
        }

        if (!optimizerCanAffordCompletion(nextState)) {
          budgetCouldNotFit = true;
          return;
        }

        nextStates.push(nextState);
      });
    });

    if (!nextStates.length) {
      if (builderRiskControlsActive(riskSettings)) {
        riskConstraintsCouldNotFit = true;
      }
      break;
    }

    evaluatedPaths += nextStates.length;
    states = pruneOptimizerStates(nextStates, measure, tacticName);
    bestPartialState = states[0] || bestPartialState;
  }

  const validFullStates = states.filter(optimizerStateIsValidFullSquad);
  const selectedState = validFullStates.length
    ? pruneOptimizerStates(validFullStates, measure, tacticName)[0]
    : bestPartialState;
  const foundValidSquad = validFullStates.length > 0;
  const squad = selectedState.squad;
  const { starters, starterIds } = chooseStartersFromSquad(squad, requirements, measure, profile);
  const bench = squad.filter((player) => !starterIds.has(player.id));

  return {
    starters,
    bench,
    squad,
    ignoredLockedPlayers,
    budgetCouldNotFit: !foundValidSquad && budgetCouldNotFit,
    countryLimitCouldNotFit,
    riskConstraintsCouldNotFit: !foundValidSquad && riskConstraintsCouldNotFit,
    optimizerFoundValidSquad: foundValidSquad,
    optimizerEvaluatedPaths: evaluatedPaths,
    optimizerScore: optimizerStateRank(selectedState, measure, tacticName)
  };
}

function finalRoundTeamBuilderArtifact() {
  const artifact = ACTIVE_DATA.teamBuilderFinalRoundArtifact;
  return artifact?.schema_version === "team_builder_final_round_artifact_v1"
    ? artifact
    : null;
}

function defaultFinalRoundArtifactInputsActive() {
  const artifact = finalRoundTeamBuilderArtifact();
  return Boolean(
    artifact &&
    activeMatchdayId === "finalRound" &&
    normalizeTeamBuilderStrategyKey(measureSelect?.value) === "balancedSquad" &&
    (tacticSelect?.value || "") === (artifact.strategy?.formation || "4-3-3") &&
    activeTrustModeId === "balanced" &&
    selectedCountryFilter === "All" &&
    lockedPlayerIds.size === 0 &&
    excludedPlayerIds.size === 0 &&
    priceFilterValue(minPriceFilter) === null &&
    priceFilterValue(maxPriceFilter) === null &&
    !builderRiskControlsActive()
  );
}

function artifactRowsToPlayers(rows = []) {
  return rows
    .map((row) => playerByOfficialFantasyId(row.official_fantasy_player_id))
    .filter(Boolean);
}

function generatedFinalRoundBalancedSquad() {
  if (!defaultFinalRoundArtifactInputsActive()) {
    return null;
  }

  const artifact = finalRoundTeamBuilderArtifact();
  const starters = artifactRowsToPlayers(artifact.starters || []);
  const bench = artifactRowsToPlayers(artifact.bench || []);
  const squad = [...starters, ...bench];
  const artifactSelectedIds = new Set((artifact.selectedSquad || []).map((row) => String(row.official_fantasy_player_id)));
  const renderedIds = new Set(squad.map((player) => String(player.official_fantasy_player_id)));
  const selectedRowsResolved = artifactSelectedIds.size === renderedIds.size &&
    [...artifactSelectedIds].every((id) => renderedIds.has(id));
  const finalRoundEligible = squad.every((player) =>
    playerAllowedForActiveMatchday(player, "finalRound") &&
    recordMatchesActiveStageEligibleTeam(player, "finalRound")
  );
  const artifactHasValidShape =
    starters.length === startingLineupTotal &&
    squad.length === squadTotalPlayers &&
    positionsMatchRequirements(countsByPosition(squad), squadRequirements) &&
    positionsMatchRequirements(countsByPosition(starters), tactics[artifact.strategy?.formation || "4-3-3"] || {}) &&
    countryLimitViolations(countryCountsFromPlayers(squad)).length === 0;

  if (!selectedRowsResolved || !finalRoundEligible || !artifactHasValidShape) {
    return null;
  }

  return {
    starters,
    bench,
    squad,
    ignoredLockedPlayers: [],
    budgetCouldNotFit: false,
    countryLimitCouldNotFit: false,
    riskConstraintsCouldNotFit: false,
    optimizerFoundValidSquad: true,
    optimizerEvaluatedPaths: 1,
    optimizerScore: Number(artifact.summary?.composite_score || 0),
    generatedArtifact: artifact
  };
}

function evenlySpacedPositions(count, top) {
  const gap = 100 / (count + 1);

  return Array.from({ length: count }, (_, index) => ({
    top,
    left: `${Math.round(gap * (index + 1))}%`
  }));
}

// These coordinates place the selected tactic onto the soccer field.
function fieldLayoutForTactic(tacticName) {
  const requirements = tactics[tacticName];

  return {
    Goalkeeper: evenlySpacedPositions(1, "88%"),
    Defender: evenlySpacedPositions(requirements.Defender, "66%"),
    Midfielder: evenlySpacedPositions(requirements.Midfielder, "38%"),
    Forward: evenlySpacedPositions(requirements.Forward, "12%")
  };
}

function clearTeamPreview() {
  renderTeam([], [], [], "preview");
}

function currentBuilderSquadSize() {
  return currentRenderedTeam.length + currentBenchPlayers.length;
}

function updateBuilderFlowSteps(activeStep) {
  const stepOrder = ["strategy", "locks", "build", "review", "save"];
  const activeIndex = stepOrder.indexOf(activeStep);
  const hasLocksOrAvoids = lockedPlayerIds.size > 0 || excludedPlayerIds.size > 0;

  builderFlowSteps.forEach((step) => {
    const stepName = step.dataset.builderFlowStep;
    const stepIndex = stepOrder.indexOf(stepName);
    const isOptionalLockStep = stepName === "locks" && !hasLocksOrAvoids && activeStep === "build";

    step.classList.toggle("is-current", stepName === activeStep);
    step.classList.toggle("is-complete", stepIndex >= 0 && stepIndex < activeIndex && !isOptionalLockStep);
  });
}

function updateBuilderGuidance() {
  const squadSize = currentBuilderSquadSize();
  const fullSquadBuilt = currentRenderMode === "built" && squadSize === squadTotalPlayers;
  const partialSquadBuilt = currentRenderMode === "built" && squadSize > 0 && !fullSquadBuilt;
  const lockedCount = lockedPlayerIds.size;
  const avoidedCount = excludedPlayerIds.size;

  if (builderLockStatus) {
    builderLockStatus.textContent = lockedCount === 0
      ? "No players locked"
      : `${lockedCount} locked player${lockedCount === 1 ? "" : "s"}`;
  }

  if (builderRemovedStatus) {
    builderRemovedStatus.textContent = avoidedCount === 0
      ? "No avoided players"
      : `${avoidedCount} avoided player${avoidedCount === 1 ? "" : "s"}`;
  }

  if (builderBuildGuidance) {
    if (fullSquadBuilt) {
      builderBuildGuidance.textContent = "Full squad built. Review the checks, then save it for Decision Tools.";
    } else if (partialSquadBuilt) {
      builderBuildGuidance.textContent = `Only ${squadSize} of ${squadTotalPlayers} players fit. Loosen locks, avoids, budget, or advanced filters and rebuild.`;
    } else if (lockedCount > 0 || avoidedCount > 0) {
      builderBuildGuidance.textContent = `Ready to build around ${lockedCount} locked and ${avoidedCount} avoided player${lockedCount + avoidedCount === 1 ? "" : "s"}.`;
    } else {
      builderBuildGuidance.textContent = `Ready when you are: build a ${squadLabel()} from the selected strategy, budget, and rules.`;
    }
  }

  if (builderReviewStatus) {
    if (fullSquadBuilt) {
      builderReviewStatus.textContent = "Full squad ready. Check legality, country stacks, risk, captain, vice, and bench order before saving.";
    } else if (partialSquadBuilt) {
      builderReviewStatus.textContent = `Partial squad: ${squadSize} of ${squadTotalPlayers} players. Review the warning and relax constraints before exporting.`;
    } else if (squadSize > 0) {
      builderReviewStatus.textContent = `Previewing ${squadSize} locked player${squadSize === 1 ? "" : "s"}. Build the squad to check legality and risk.`;
    } else {
      builderReviewStatus.textContent = "Build a squad to check budget, country limits, lineup shape, and risk.";
    }
  }

  const activeStep = fullSquadBuilt
    ? "save"
    : partialSquadBuilt
      ? "review"
      : "build";

  updateBuilderFlowSteps(activeStep);
}

function updateControlStates() {
  clearLockedButton.classList.toggle("hidden", lockedPlayerIds.size === 0);
  clearLockedButton.disabled = lockedPlayerIds.size === 0;
  renderPicksBuilderTray();
  renderBrowserSquadSaveStatus();
  updateBuilderGuidance();
}

function renderRemovedPlayers() {
  const removedPlayers = Array.from(excludedPlayerIds)
    .map(playerById)
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));

  removedPlayersPanel.classList.toggle("hidden", removedPlayers.length === 0);

  if (!removedPlayers.length) {
    removedPlayersList.innerHTML = "";
    return;
  }

  removedPlayersList.innerHTML = removedPlayers.map((player) => `
    <span class="removed-player-chip">
      <span>${player.name}</span>
      <button type="button" data-add-back-player-id="${player.id}">Add Back</button>
    </span>
  `).join("");
}

function clearRenderedTeam(message, options = {}) {
  clearSavedDecisionExports();
  clearUserSquadSelections();
  clearMatchdayDecisionInputs();

  if (options.clearExclusions) {
    excludedPlayerIds.clear();
  }

  selectedSwap = null;
  renderTeam([], [], [], "preview");
  builderWarning.classList.add("hidden");
  builderWarning.textContent = "";
  updateTeamSummary(tacticSelect.value, 0, 0, 0);
  teamExportOutput.value = "";
  teamExportPanel.classList.add("hidden");
  teamMessage.textContent = message;
  updateControlStates();
  renderRemovedPlayers();
}

function renderWarning(tacticName, ignoredLockedPlayers, missingStarterSlots, missingSquadSlots = 0, budgetInfo = {}, countryInfo = {}, optimizerInfo = {}, riskInfo = {}) {
  const messages = activeDataWarningsForSection("team_builder");

  if (priceFiltersAreInvalid()) {
    messages.push("Minimum price is higher than maximum price, so no filtered players can be suggested.");
  }

  if (ignoredLockedPlayers.length) {
    messages.push(`Some locked players did not fit the ${squadLabel()} position or country limits: ${ignoredLockedPlayers.map((player) => player.name).join(", ")}.`);
  }

  const countryFilterConflicts = lockedCountryFilterConflicts();
  if (countryFilterConflicts.length) {
    messages.push(`Country filter is ${countryCountLabel(selectedCountryFilter)}, but locked players stay included: ${countryFilterConflicts.map((player) => player.name).join(", ")}.`);
  }

  if (missingStarterSlots > 0) {
    messages.push(`${missingStarterSlots} starting slot${missingStarterSlots === 1 ? "" : "s"} could not be filled for ${tacticName}. Try widening the price filters.`);
  }

  if (missingSquadSlots > 0) {
    messages.push(`${missingSquadSlots} squad spot${missingSquadSlots === 1 ? "" : "s"} could not be filled. Try widening the price filters.`);
  }

  if (budgetInfo.isOverBudget) {
    messages.push(`This squad costs ${budgetText(budgetInfo.totalPrice)}, which is over the ${budgetText(initialBudget)} budget. Try removing expensive locked players or relaxing price filters.`);
  } else if (budgetInfo.budgetCouldNotFit) {
    messages.push(`The builder could not fill every squad spot while staying under the ${budgetText(initialBudget)} budget with the current locks and filters.`);
  }

  if (countryInfo.countryLimitCouldNotFit) {
    messages.push(`The builder could not add more players from one country because the ${activeCountryLimitLabel()} fantasy rule allows only ${groupStageCountryLimit} per country.`);
  }

  if (optimizerInfo.ran && !optimizerInfo.foundValidSquad) {
    messages.push(`Team Builder could not find a full legal ${squadLabel()} with the current locks, filters, removals, budget, and country limit.`);
  }

  if (riskInfo.riskConstraintsCouldNotFit) {
    messages.push(`The risk controls may be too tight for a full ${squadLabel()}: ${builderRiskSettingsSummary()}.`);
  }

  if (Array.isArray(riskInfo.violations) && riskInfo.violations.length) {
    messages.push(`Risk-control warning: ${riskInfo.violations.join(" ")}`);
  }

  if (!messages.length) {
    builderWarning.classList.add("hidden");
    builderWarning.textContent = "";
    return;
  }

  builderWarning.classList.remove("hidden");
  builderWarning.textContent = messages.join(" ");
}

function playersByPosition(team) {
  return positionOrder.reduce((groupedPlayers, position) => {
    groupedPlayers[position] = team.filter((player) => player.position === position);
    return groupedPlayers;
  }, {});
}

function countsByPosition(team) {
  const counts = emptyPositionCounts();

  team.forEach((player) => {
    if (counts[player.position] !== undefined) {
      counts[player.position] += 1;
    }
  });

  return counts;
}

function tacticNameForCounts(counts) {
  return Object.entries(tactics).find(([, requirements]) =>
    requirements.Goalkeeper === counts.Goalkeeper &&
    requirements.Defender === counts.Defender &&
    requirements.Midfielder === counts.Midfielder &&
    requirements.Forward === counts.Forward
  )?.[0] || null;
}

function benchRequirementsForTactic(tacticName) {
  const starterRequirements = tactics[tacticName];

  return positionOrder.reduce((requirements, position) => {
    requirements[position] = Math.max(0, squadRequirements[position] - starterRequirements[position]);
    return requirements;
  }, {});
}

function compactSlotMap(slotMap) {
  return positionOrder.flatMap((position) =>
    (slotMap[position] || []).filter(Boolean)
  );
}

function starterSlotMapForTeam(starters, layout, mode) {
  const groupedPlayers = playersByPosition(starters);
  const slotMap = {};

  positionOrder.forEach((position) => {
    const slots = layout[position];
    const positionPlayers = groupedPlayers[position];
    const slotPlayers = new Array(slots.length).fill(null);
    const startIndex = mode === "preview"
      ? Math.max(0, Math.floor((slots.length - positionPlayers.length) / 2))
      : 0;

    positionPlayers.slice(0, slots.length).forEach((player, index) => {
      const slotIndex = Math.min(startIndex + index, slots.length - 1);
      slotPlayers[slotIndex] = player;
    });

    slotMap[position] = slotPlayers;
  });

  return slotMap;
}

function benchSlotMapForTeam(bench, requirements) {
  const groupedBench = playersByPosition(bench);
  const slotMap = {};

  positionOrder.forEach((position) => {
    const positionBench = groupedBench[position];
    slotMap[position] = new Array(requirements[position]).fill(null);

    positionBench.slice(0, requirements[position]).forEach((player, index) => {
      slotMap[position][index] = player;
    });
  });

  return slotMap;
}

function renderPlayerCard(player, slot, position, slotIndex) {
  const stat = activeCardStat();
  const statLabel = activeCardStatLabel(stat);
  const projection = activeProjection(player);
  const fixtureText = projectionIsAvailable(projection) ? ` · vs ${projection.opponent}` : "";
  const roleText = playerRoleText(player);
  const roleLine = roleText ? `<p class="player-card__detail">${roleText}</p>` : "";
  const metaText = `${playerCountryText(player)} · ${player.club}${fixtureText}`;
  const statText = `${compactCardStatLabel(statLabel)} ${displayNumber(stat.value(player))}`;

  return `
    <article class="player-card player-card--selectable" role="button" tabindex="0" data-area="starter" data-position="${position}" data-slot-index="${slotIndex}" data-player-id="${player.id}" style="top: ${slot.top}; left: ${slot.left};">
      <span class="player-card__role">${player.position}</span>
      ${squadSelectionBadgeHtml(player, "starter")}
      <strong>${playerDetailButton(player, "player-name-button--card", measureKeyForTrust(activeMeasure()))}</strong>
      <p class="player-card__meta" title="${escapeHtml(metaText)}">${escapeHtml(metaText)}</p>
      <div class="player-card__numbers">
        <span>Price ${escapeHtml(playerPriceText(player))}</span>
        <span>${escapeHtml(statText)}</span>
      </div>
      ${roleLine}
      ${starterSelectionControlsHtml(player)}
    </article>
  `;
}

function renderPlaceholderCard(position, slot, slotIndex) {
  return `
    <article class="player-card player-card--placeholder" data-position="${position}" data-slot-index="${slotIndex}" style="top: ${slot.top}; left: ${slot.left};">
      <span class="player-card__role">${position}</span>
      <div class="player-silhouette" aria-hidden="true"></div>
      <strong>Open Slot</strong>
      <p>Lock a ${position.toLowerCase()}</p>
    </article>
  `;
}

function renderBenchCard(player, position, slotIndex) {
  const stat = activeCardStat();
  const statLabel = activeCardStatLabel(stat);
  const projection = activeProjection(player);
  const fixtureText = projectionIsAvailable(projection) ? ` · vs ${projection.opponent}` : "";
  const roleText = playerRoleText(player);
  const roleDetail = roleText ? ` · ${roleText}` : "";

  return `
    <article class="bench-card bench-card--selectable" role="button" tabindex="0" data-area="bench" data-position="${position}" data-slot-index="${slotIndex}" data-player-id="${player.id}">
      <span>${player.position}</span>
      ${squadSelectionBadgeHtml(player, "bench")}
      <strong>${playerDetailButton(player, "player-name-button--bench", measureKeyForTrust(activeMeasure()))}</strong>
      <p>${playerCountryText(player)} · ${player.club}${fixtureText}</p>
      <small>Price ${playerPriceText(player)}${roleDetail} · ${statLabel}: ${displayNumber(stat.value(player))}</small>
      ${benchSelectionControlsHtml(player)}
    </article>
  `;
}

function renderBenchPlaceholder(position, slotIndex) {
  return `
    <article class="bench-card bench-card--placeholder" data-position="${position}" data-slot-index="${slotIndex}">
      <span>${position}</span>
      <strong>Bench Slot</strong>
      <p>Build the squad to fill this substitute spot.</p>
    </article>
  `;
}

function renderPositionRow(position, slots = [], slotPlayers = []) {
  return slots.map((slot, index) => {
    const player = slotPlayers[index];
    return player
      ? renderPlayerCard(player, slot, position, index)
      : renderPlaceholderCard(position, slot, index);
  }).join("");
}

function renderBenchSlots(slotMap) {
  const benchCards = [];

  positionOrder.forEach((position) => {
    const positionBench = slotMap[position] || [];

    for (let index = 0; index < positionBench.length; index += 1) {
      const player = positionBench[index];
      benchCards.push(player
        ? renderBenchCard(player, position, index)
        : renderBenchPlaceholder(position, index));
    }
  });

  benchPlayers.innerHTML = benchCards.join("");
  benchCount.textContent = `${compactSlotMap(slotMap).length} / ${benchTotalPlayers}`;
  benchPanel.classList.remove("hidden");
}

function renderBench(bench, requirements) {
  currentBenchSlotsByPosition = benchSlotMapForTeam(bench, requirements);
  renderBenchSlots(currentBenchSlotsByPosition);
}

function updateSwapPrompt() {
  document.querySelectorAll("[data-player-id]").forEach((card) => {
    const isSelected = selectedSwap &&
      card.dataset.playerId === selectedSwap.playerId &&
      card.dataset.area === selectedSwap.area;

    card.classList.toggle("is-selected-swap", Boolean(isSelected));
  });

  if (!selectedSwap) {
    swapMessage.textContent = currentRenderMode === "built"
      ? "Tip: click a starter, then click a bench player to try a legal swap."
      : `Build a full ${squadLabel()} first, then click a starter and a bench player to swap them.`;
    return;
  }

  const selectedPlayer = [...currentRenderedTeam, ...currentBenchPlayers]
    .find((player) => player.id === selectedSwap.playerId);
  const nextArea = selectedSwap.area === "starter" ? "bench player" : "starter";

  swapMessage.textContent = `Selected ${selectedPlayer?.name || "one player"}. Now click a ${nextArea} to try the swap.`;
}

function renderTeam(starters, bench, ignoredLockedPlayers, mode = "built", options = {}) {
  const tacticName = tacticSelect.value;
  const layout = fieldLayoutForTactic(tacticName);
  normalizeUserSquadSelections(starters, bench);
  currentStarterSlotsByPosition = starterSlotMapForTeam(starters, layout, mode);
  const squad = [...starters, ...bench];
  const totalSlots = Object.values(tactics[tacticName]).reduce((sum, count) => sum + count, 0);
  const missingStarterSlots = Math.max(0, totalSlots - starters.length);
  const missingSquadSlots = mode === "built" ? Math.max(0, squadTotalPlayers - squad.length) : 0;
  const totalPrice = squad.reduce((sum, player) => sum + value(player.price), 0);
  const isOverBudget = mode === "built" && totalPrice > initialBudget + 0.001;
  const averageRisk = squad.length
    ? squad.reduce((sum, player) => sum + scoreValue(player, "finance_composite_risk_score", "risk_composite_score"), 0) / squad.length
    : 0;
  const riskViolations = mode === "built"
    ? builderRiskViolationsForSquad(squad)
    : [];

  currentRenderedTeam = [...starters];
  currentBenchPlayers = [...bench];
  currentIgnoredLockedPlayers = [...ignoredLockedPlayers];
  currentRenderMode = mode;
  teamExportOutput.value = "";
  teamExportPanel.classList.add("hidden");

  teamPlayers.innerHTML = positionOrder.slice().reverse()
    .map((position) => renderPositionRow(position, layout[position], currentStarterSlotsByPosition[position]))
    .join("");

  updateTeamSummary(tacticName, totalPrice, averageRisk, squad.length);
  renderRuleChecks(starters, bench, tacticName);
  renderPortfolioAnalytics(starters, bench);
  renderSquadStrategyReport(starters, bench);

  teamField.classList.remove("hidden");
  renderBench(bench, benchRequirementsForTactic(tacticName));

  if (mode === "preview" && squad.length === 0) {
    teamMessage.textContent = `Transparent slots show the selected starting tactic. ${builderActionLabel()} will create a ${squadLabel()} with ${benchLabel()} below.`;
  } else if (mode === "preview") {
    teamMessage.textContent = `Showing ${squad.length} locked squad player${squad.length === 1 ? "" : "s"}. Click ${builderActionLabel()} to fill the full ${squadLabel()}.`;
  } else if (missingStarterSlots > 0 || missingSquadSlots > 0) {
    const riskText = builderRiskControlsActive() ? ` Risk controls: ${builderRiskSettingsSummary()}.` : "";
    teamMessage.textContent = `Team Builder found ${squad.length} squad player${squad.length === 1 ? "" : "s"} using ${activeBuilderStrategyLabel()}, ${trustModeLabel()}, and ${activeMatchdayLabel()}. Some spots are still open because the current locks, filters, removals, safety preference, budget, country limit, or risk controls are too tight.${riskText}`;
  } else if (isOverBudget) {
    teamMessage.textContent = `Team Builder built a ${squadLabel()} using ${activeBuilderStrategyLabel()}, ${trustModeLabel()}, and ${activeMatchdayLabel()}, but it is over the ${budgetText(initialBudget)} budget. Try removing expensive locked players or relaxing filters.`;
  } else {
    const riskText = builderRiskControlsActive() ? ` Risk controls: ${builderRiskSettingsSummary()}.` : "";
    if (options.generatedArtifact) {
      const artifact = options.generatedArtifact;
      const rawProjected = displayNumber(artifact.summary?.raw_projected_points);
      const optionality = displayNumber(artifact.summary?.optionality_score);
      const composite = displayNumber(artifact.summary?.composite_score);
      teamMessage.textContent = `Recommended Balanced Squad loaded from the validated Final Round Team Builder artifact: ${startingLineupTotal} starters on the field and ${benchLabel()} below. Raw projected points ${rawProjected}; optionality ${optionality}; composite ${composite}.${riskText}`;
    } else {
      teamMessage.textContent = `Team Builder built a ${squadLabel()} within the ${budgetText(initialBudget)} budget using ${activeBuilderStrategyLabel()}, ${trustModeLabel()}, and ${activeMatchdayLabel()}: ${startingLineupTotal} starters on the field and ${benchLabel()} below.${riskText}`;
    }
  }

  renderWarning(
    tacticName,
    ignoredLockedPlayers,
    mode === "built" ? missingStarterSlots : 0,
    missingSquadSlots,
    {
      budgetCouldNotFit: Boolean(options.budgetCouldNotFit),
      isOverBudget,
      totalPrice
    },
    {
      countryLimitCouldNotFit: Boolean(options.countryLimitCouldNotFit)
    },
    {
      ran: options.optimizerFoundValidSquad !== undefined,
      foundValidSquad: Boolean(options.optimizerFoundValidSquad)
    },
    {
      riskConstraintsCouldNotFit: Boolean(options.riskConstraintsCouldNotFit),
      violations: riskViolations
    }
  );
  updateSwapPrompt();
  renderSavedSquadDecisionPanels();
  updateControlStates();
}

function renderCurrentSlotState(message) {
  clearSavedDecisionExports();

  const tacticName = tacticSelect.value;
  const layout = fieldLayoutForTactic(tacticName);
  const starters = compactSlotMap(currentStarterSlotsByPosition);
  const bench = compactSlotMap(currentBenchSlotsByPosition);
  normalizeUserSquadSelections(starters, bench);
  const squad = [...starters, ...bench];
  const totalPrice = squad.reduce((sum, player) => sum + value(player.price), 0);
  const averageRisk = squad.length
    ? squad.reduce((sum, player) => sum + scoreValue(player, "finance_composite_risk_score", "risk_composite_score"), 0) / squad.length
    : 0;

  currentRenderedTeam = starters;
  currentBenchPlayers = bench;
  currentIgnoredLockedPlayers = [];
  currentRenderMode = "built";
  teamExportOutput.value = "";
  teamExportPanel.classList.add("hidden");

  teamPlayers.innerHTML = positionOrder.slice().reverse()
    .map((position) => renderPositionRow(position, layout[position], currentStarterSlotsByPosition[position]))
    .join("");

  updateTeamSummary(tacticName, totalPrice, averageRisk, squad.length);
  renderRuleChecks(starters, bench, tacticName);
  renderPortfolioAnalytics(starters, bench);
  renderSquadStrategyReport(starters, bench);

  teamField.classList.remove("hidden");
  renderBenchSlots(currentBenchSlotsByPosition);
  const riskViolations = builderRiskViolationsForSquad(squad);
  if (riskViolations.length) {
    builderWarning.classList.remove("hidden");
    builderWarning.textContent = `Risk-control warning: ${riskViolations.join(" ")}`;
  } else {
    builderWarning.classList.add("hidden");
    builderWarning.textContent = "";
  }
  teamMessage.textContent = message;
  updateSwapPrompt();
  updateControlStates();
  renderRemovedPlayers();
  renderSavedSquadDecisionPanels();
}

// This view appears as soon as someone locks players, before building the full team.
function renderLockedPreview() {
  clearSavedDecisionExports();
  clearUserSquadSelections();
  clearMatchdayDecisionInputs();

  const tacticName = tacticSelect.value;
  const requirements = tactics[tacticName];
  const measure = activeMeasure();
  const { validLockedPlayers, ignoredLockedPlayers } = getValidLockedSquadPlayers(measure);
  const { starters, starterIds } = chooseStartersFromSquad(validLockedPlayers, requirements, measure);
  const bench = validLockedPlayers.filter((player) => !starterIds.has(player.id));

  if (!validLockedPlayers.length && !ignoredLockedPlayers.length) {
    clearTeamPreview();
    return;
  }

  renderTeam(starters, bench, ignoredLockedPlayers, "preview");
}

function lockedBuilderPlayers() {
  return Array.from(lockedPlayerIds)
    .map(playerById)
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));
}

function lockedPlayersLabel(playersToLabel) {
  if (!playersToLabel.length) {
    return "";
  }

  if (playersToLabel.length <= 3) {
    return playersToLabel.map((player) => player.name).join(", ");
  }

  return `${playersToLabel.slice(0, 3).map((player) => player.name).join(", ")} and ${playersToLabel.length - 3} more`;
}

function renderPicksBuilderTray() {
  if (!picksBuilderTray) {
    return;
  }

  const lockedPlayers = lockedBuilderPlayers();

  if (!lockedPlayers.length) {
    picksBuilderTray.className = "picks-builder-tray picks-builder-tray--empty";
    picksBuilderTray.innerHTML = `
      <div>
        <span>Team Builder</span>
        <strong>No players locked yet</strong>
        <p>Add players from pick cards, then build a squad around them.</p>
      </div>
      <a class="picks-builder-tray__link" href="#team-builder">Open Team Builder</a>
    `;
    return;
  }

  const playerChips = lockedPlayers.slice(0, 5).map((player) => `
    <button class="locked-player-chip" type="button" data-remove-lock-player-id="${escapeHtml(player.id)}" title="Remove ${escapeHtml(player.name)} from locked players">
      <span>${escapeHtml(player.name)}</span>
      <span aria-hidden="true">Remove</span>
    </button>
  `).join("");
  const moreChip = lockedPlayers.length > 5
    ? `<span class="locked-player-chip locked-player-chip--more">+${lockedPlayers.length - 5} more</span>`
    : "";

  picksBuilderTray.className = "picks-builder-tray";
  picksBuilderTray.innerHTML = `
    <div class="picks-builder-tray__summary">
      <span>Team Builder</span>
      <strong>${lockedPlayers.length} locked player${lockedPlayers.length === 1 ? "" : "s"}</strong>
      <p>${escapeHtml(lockedPlayersLabel(lockedPlayers))} ${lockedPlayers.length === 1 ? "is" : "are"} ready for the builder.</p>
    </div>
    <div class="picks-builder-tray__chips" aria-label="Locked players">
      ${playerChips}
      ${moreChip}
    </div>
    <div class="picks-builder-tray__actions">
      <a class="picks-builder-tray__link picks-builder-tray__link--primary" href="#team-builder">${escapeHtml(builderActionLabel())}</a>
      <button class="picks-builder-tray__button" type="button" data-clear-pick-locks>Clear</button>
    </div>
  `;
}

function fantasyPoolCandidateStat(player, fieldName, suffix = "") {
  const candidate = player.preview_candidate || {};
  const number = Number(candidate[fieldName]);

  if (!Number.isFinite(number)) {
    return "Needs check";
  }

  return `${displayNumber(number)}${suffix}`;
}

function pickProjectionMatchdayId() {
  return activeMatchdayId === "group_stage_full"
    ? defaultPickProjectionMatchdayId
    : activeMatchdayId;
}

function pickProjectionRow(player) {
  const matchdayId = pickProjectionMatchdayId();

  if (!player || matchdayId === "group_stage_full") {
    return null;
  }

  return projectionForPlayerMatchday(player, matchdayId);
}

function projectedMatchdayPointValue(player) {
  const projection = pickProjectionRow(player);

  if (projectionIsMissing(projection)) {
    return null;
  }

  if (projectionIsAvailable(projection)) {
    const projectedField = [
      "finance_risk_adjusted_return_points",
      "risk_adjusted_expected_points_estimate"
    ]
      .map(projectionFieldName)
      .find((fieldName) => hasScoreValue(projection, fieldName));

    if (projectedField) {
      return Number(projection[projectedField]);
    }
  }

  if (player?.preview_candidate) {
    const candidate = player.preview_candidate;
    const modeledPoints = Number(candidate.risk_adjusted_points ?? candidate.raw_expected_points);
    const fixtureCount = Number(candidate.fixture_context?.fixture_count);
    if (Number.isFinite(modeledPoints)) {
      return candidate.matchday === "group_stage_full" && Number.isFinite(fixtureCount) && fixtureCount > 0
        ? modeledPoints / fixtureCount
        : modeledPoints;
    }
  }

  return optionalScoreValue(
    player,
    "finance_risk_adjusted_return_points",
    "risk_adjusted_expected_points_estimate"
  );
}

function projectedMatchdayPoints(player) {
  const projected = projectedMatchdayPointValue(player);

  return projected === null ? "Needs check" : displayNumber(projected);
}

function pickProjectionContextText(player) {
  const projection = pickProjectionRow(player);

  if (projectionIsAvailable(projection)) {
    return `${projection.matchday_label || matchdayLabelFromId(projection.matchday_id)} vs ${projection.opponent}`;
  }

  return activeMatchdayLabel();
}

function fantasyPoolCandidateReason(player) {
  const candidate = player.preview_candidate || {};
  const pickReason = publicFantasyPickReasonItems(player)[0] || `${publicPickModelLabelFromMode(candidate.mode, candidate.mode_label || "Pick")}: current model pick`;
  const cleanPickReason = String(pickReason).replace(/\s*[.!?]+$/g, "");

  return `${cleanPickReason}.`;
}

function fantasyPoolPreviewTableScore(player, label = "Pick score") {
  return `
    <span class="score-breakdown" title="${escapeHtml(fantasyPoolCandidateReason(player))}">
      <strong>${fantasyPoolCandidateStat(player, "recommendation_score")}</strong>
      <small>${escapeHtml(label)}</small>
    </span>
  `;
}

function projectedMatchdayPointScoreHtml(player) {
  return `
    <span class="score-breakdown" title="${escapeHtml(pickReasonText(player))}">
      <strong>${escapeHtml(projectedMatchdayPoints(player))}</strong>
      <small>Projected Pts / Matchday</small>
    </span>
  `;
}

function financeLensDisplayValue(player, lens = activeAdviceFinanceLens()) {
  const rawValue = lens.value(player);
  if (rawValue === null || rawValue === undefined || rawValue === "") return null;

  const numericValue = Number(rawValue);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function sortByFinanceLens(playerList, lens = activeAdviceFinanceLens()) {
  if (!lens || lens.defaultLens) return [...playerList];

  return [...playerList].sort((a, b) => {
    const aValue = financeLensDisplayValue(a, lens);
    const bValue = financeLensDisplayValue(b, lens);
    const aRank = Number.isFinite(aValue) ? aValue : -Infinity;
    const bRank = Number.isFinite(bValue) ? bValue : -Infinity;
    return bRank - aRank || Number(a.preview_candidate?.rank || 999) - Number(b.preview_candidate?.rank || 999);
  });
}

function financeLensChip(player, lens = activeAdviceFinanceLens()) {
  const value = financeLensDisplayValue(player, lens);
  if (!Number.isFinite(value)) return "";

  return `<span class="finance-chip finance-chip--primary">${escapeHtml(lens.shortLabel || lens.label)} ${displayNumber(value)}</span>`;
}

function defaultFinanceChips(player, activeLens = activeAdviceFinanceLens()) {
  const chips = [];
  const alpha = financeContextScore(player, "finance_alpha_score");
  const downside = financeContextScore(player, "downside_risk_score");
  const volatility = financeContextScore(player, "volatility_score");
  const premium = financeContextScore(player, "premium_squeeze_score");
  const varFloor = optionalScoreValue(player, "finance_var10_points");
  const compositeRisk = optionalScoreValue(player, "finance_composite_risk_score", "risk_composite_score");
  const premiumWorthIt = optionalScoreValue(player, "premium_worth_it_score_v1", "premium_worth_it_score");

  if (activeLens?.id !== "financeAlpha" && Number.isFinite(alpha)) chips.push(`<span class="finance-chip">Alpha ${displayNumber(alpha)}</span>`);
  if (activeLens?.id !== "downsideFloor" && Number.isFinite(downside)) chips.push(`<span class="finance-chip">Floor ${displayNumber(Math.max(0, 100 - downside))}</span>`);
  if (activeLens?.id !== "volatility" && Number.isFinite(volatility)) chips.push(`<span class="finance-chip">Steady ${displayNumber(Math.max(0, 100 - volatility))}</span>`);
  if (activeLens?.id !== "premiumCheck" && Number.isFinite(premium)) chips.push(`<span class="finance-chip">Premium ${displayNumber(Math.max(0, 100 - premium))}</span>`);

  if (!chips.length) {
    if (Number.isFinite(varFloor)) chips.push(`<span class="finance-chip">Floor ${displayNumber(varFloor)}</span>`);
    if (Number.isFinite(compositeRisk)) chips.push(`<span class="finance-chip">Safety ${displayNumber(Math.max(0, 100 - compositeRisk))}</span>`);
    if (Number.isFinite(premiumWorthIt)) chips.push(`<span class="finance-chip">Premium ${displayNumber(premiumWorthIt)}</span>`);
  }

  return chips.slice(0, 3).join(" ");
}

function financeLensCell(player, lens = activeAdviceFinanceLens()) {
  if (!fantasyPoolFinanceRows.length) {
    return `
      <span class="finance-chip-row" title="Active fantasyPool finance metrics unavailable">
        <span class="finance-chip finance-chip--muted">Finance data unavailable</span>
      </span>
    `;
  }

  const lensChip = financeLensChip(player, lens);
  const defaultChips = defaultFinanceChips(player, lens);
  const unavailableLensChip = !lens?.defaultLens && !lensChip
    ? `<span class="finance-chip finance-chip--muted">${escapeHtml(lens.shortLabel || lens.label)} n/a</span>`
    : "";
  const description = lens?.description ? `<small>${escapeHtml(lens.description)}</small>` : "";
  const primaryChips = lensChip || unavailableLensChip || defaultChips || "<span class=\"finance-chip finance-chip--muted\">Finance n/a</span>";
  const extraChips = (lensChip || unavailableLensChip) && defaultChips
    ? `<span class="finance-chip-row__extra">${defaultChips}</span>`
    : "";

  return `
    <span class="finance-chip-row" title="${escapeHtml(lens?.description || "Finance model lens")}">
      ${primaryChips}
      ${extraChips}
      ${description}
    </span>
  `;
}

function pickRiskLabel(player) {
  const risk = scoreValue(player, "finance_composite_risk_score", "risk_composite_score");

  if (risk <= 38) return "Safer floor";
  if (risk <= 62) return "Check role";
  return "Higher variance";
}

function pickRiskKind(player) {
  const risk = scoreValue(player, "finance_composite_risk_score", "risk_composite_score");
  if (risk <= 38) return "safe";
  if (risk <= 62) return "watch";
  return "review";
}

function publicRiskSentence(reasons) {
  const reasonText = reasons.length === 2
    ? `${reasons[0]} and ${reasons[1]}`
    : listText(reasons);

  return `${reasons.length === 1 ? "Main risk is" : "Main risks are"} ${reasonText}.`;
}

function publicFantasyRiskReasons(player, measureKey = "balanced", modelKey = "") {
  const reasons = [];
  const addReason = (reason) => {
    if (reason && !reasons.includes(reason)) {
      reasons.push(reason);
    }
  };
  const startProbability = optionalScoreValue(player, "start_probability_percent");
  const expectedMinutes = optionalScoreValue(player, "expected_minutes_v0");
  const substitutionRisk = optionalScoreValue(player, "substitution_risk");
  const tailRisk = optionalScoreValue(player, "finance_tail_risk_score", "risk_tail_score");
  const compositeRisk = optionalScoreValue(player, "finance_composite_risk_score", "risk_composite_score");
  const volatility = optionalScoreValue(player, "finance_volatility_points", "volatility_score");
  const floor = optionalScoreValue(player, "finance_var10_points");
  const fixtureContext = qaFixtureContext(player);
  const roleText = String(player.country_role || player.role_label || "").toLowerCase();
  const premiumSqueeze = financeContextScore(player, "premium_squeeze_score");
  const price = proxyPrice(player);

  if (Number.isFinite(startProbability) && startProbability < 55) {
    addReason("minutes risk");
  } else if (Number.isFinite(expectedMinutes) && expectedMinutes < 60) {
    addReason("minutes risk");
  }

  if (Number.isFinite(substitutionRisk) && substitutionRisk >= 45) {
    addReason("substitution risk");
  }

  if (roleText.includes("rotation")) {
    addReason("rotation risk");
  } else if (roleText.includes("unclear") || roleText.includes("bench")) {
    addReason("role uncertainty");
  }

  if (fixtureContext.difficulty !== null && fixtureContext.difficulty >= 65) {
    addReason("harder matchup");
  } else if (fixtureContext.difficulty !== null && fixtureContext.difficulty >= 55) {
    addReason("fixture difficulty");
  }

  if (["Goalkeeper", "Defender"].includes(player.position) && fixtureContext.cleanSheet !== null && fixtureContext.cleanSheet < 0.3) {
    addReason("low clean-sheet chance");
  }

  if ((Number.isFinite(premiumSqueeze) && premiumSqueeze >= 65) || price >= 8.5) {
    addReason("price pressure");
  }

  if (measureKey === "captain" || modelKey === "captain") {
    addReason("captain downside");
  }

  if (
    measureKey === "upside" ||
    modelKey === "upside" ||
    Number.isFinite(tailRisk) && tailRisk >= 65 ||
    Number.isFinite(volatility) && volatility >= 55
  ) {
    addReason("boom-or-bust scoring profile");
  }

  if (Number.isFinite(floor) && floor < 2) {
    addReason("lower floor");
  }

  if (["Forward", "Midfielder"].includes(player.position) && ["upside", "captain"].includes(measureKey)) {
    addReason("dependency on goals or assists");
  }

  if (!reasons.length && Number.isFinite(compositeRisk) && compositeRisk >= 55) {
    addReason("lower floor");
  }

  return reasons.slice(0, 2);
}

function pickFixtureLabel(player) {
  const candidate = player.preview_candidate || null;
  const projections = playerMatchdayProjections(player);
  const displayProjection = pickProjectionRow(player);
  const projection = projectionIsAvailable(displayProjection) ? displayProjection : projections[0];

  if (!projectionIsAvailable(displayProjection) && candidate?.matchday === "group_stage_full") {
    const opponents = Array.isArray(candidate.fixture_context?.opponents)
      ? candidate.fixture_context.opponents.filter(Boolean)
      : [];
    if (opponents.length) {
      return `Full group stage vs ${listText(opponents.slice(0, 3))}`;
    }
    return "Full group stage";
  }

  if (!projectionIsAvailable(projection)) {
    return player.preview_opponent ? `vs ${player.preview_opponent}` : "Fixture needs check";
  }

  const difficulty = fixtureDifficultyLabel(projection.fixture_difficulty_band);
  return `${projection.matchday_label || matchdayLabelFromId(projection.matchday_id)} vs ${projection.opponent} · ${difficulty}`;
}

function pickProjectedScore(player, measureKey = "balanced") {
  if (player.preview_candidate) {
    return projectedMatchdayPoints(player);
  }

  return displayNumber(scoreValue(player, "finance_risk_adjusted_return_points", "risk_adjusted_expected_points_estimate"));
}

function pickScoreLabel(player, measureKey = "balanced") {
  return "Projected Pts / Matchday";
}

function pickReasonText(player, measureKey = "balanced") {
  const reason = player.preview_candidate
    ? fantasyPoolCandidateReason(player)
    : styleReason(player, measureKey);

  return reason.length > 190 ? `${reason.slice(0, 187).trim()}...` : reason;
}

function pickCardMatchdayLabel(player) {
  const projection = pickProjectionRow(player);

  if (projectionIsAvailable(projection)) {
    return projection.matchday_label || matchdayLabelFromId(projection.matchday_id);
  }

  const previewMatchday = player?.preview_candidate?.matchday;
  if (previewMatchday && previewMatchday !== "group_stage_full") {
    return matchdayLabelFromId(previewMatchday);
  }

  return activeMatchdayId === "group_stage_full"
    ? matchdayLabelFromId(defaultPickProjectionMatchdayId)
    : activeMatchdayLabel();
}

function pickCardProjectionSummary(player) {
  const parts = [];
  const projected = projectedMatchdayPoints(player);
  const startChance = optionalScoreValue(player, "start_probability_percent");

  if (projected !== "Needs check") {
    parts.push(`${projected} projected points for ${pickCardMatchdayLabel(player)}`);
  }

  if (Number.isFinite(startChance)) {
    parts.push(`${displayNumber(startChance)}% start chance`);
  }

  return parts.join(" · ");
}

function pickCardModelDescription(modelKey, measureKey = "balanced") {
  const option = pickModelOptions[modelKey] || Object.values(pickModelOptions).find((candidate) => candidate.measureKey === measureKey);
  const description = option?.cardDescription || option?.help || measures[measureKey]?.description || "This model ranks useful fantasy picks.";

  return `Model view: ${description}`;
}

function isCaptainOption(player) {
  if (!player || player.position === "Goalkeeper") {
    return false;
  }

  if (player.preview_candidate?.mode === "captain") {
    return true;
  }

  return scoreValue(player, "finance_captain_score") >= 70 || captainRecommendationScore(player) >= 75;
}

function cardCautionPhrase(reason) {
  const normalizedReason = String(reason || "").toLowerCase();

  if (normalizedReason.includes("minutes") || normalizedReason.includes("substitution") || normalizedReason.includes("rotation") || normalizedReason.includes("role")) {
    return "Check role before deadline";
  }

  if (normalizedReason.includes("boom-or-bust") || normalizedReason.includes("variance")) {
    return "Higher variance";
  }

  if (normalizedReason.includes("floor")) {
    return "Lower floor";
  }

  if (normalizedReason.includes("clean-sheet") || normalizedReason.includes("fixture") || normalizedReason.includes("matchup")) {
    return "Tougher fixture";
  }

  if (normalizedReason.includes("captain")) {
    return "Higher armband downside";
  }

  if (normalizedReason.includes("price")) {
    return "Watch squad budget";
  }

  return reason;
}

function pickCardRiskDescription(player, measureKey = "balanced", modelKey = "") {
  let cautionPhrases = Array.from(new Set(
    publicFantasyRiskReasons(player, measureKey, modelKey)
      .map(cardCautionPhrase)
      .filter(Boolean)
  ));

  if (measureKey === "captain" || modelKey === "captain" || player?.preview_candidate?.mode === "captain") {
    cautionPhrases = cautionPhrases.filter((phrase) => !["Higher armband downside", "Watch squad budget"].includes(phrase));
  }

  return cautionPhrases.length ? `Caution: ${listText(cautionPhrases.slice(0, 2))}.` : "";
}

function pickCardMatchContextDescription(player, measureKey = "balanced", modelKey = "") {
  if (measureKey === "captain" || modelKey === "captain" || player?.preview_candidate?.mode === "captain") {
    return "";
  }

  const projection = pickProjectionRow(player) || activeProjection(player);
  const contextText = projectionMatchContextSummary(player, projection, {
    measureKey,
    modelKey,
    surface: "card"
  });

  if (!contextText) {
    return "";
  }

  return `Fixture note: ${contextText}`;
}

function builderLockPlayerId(player) {
  if (!player) return null;
  if (players.some((candidate) => candidate.id === player.id)) return player.id;
  if (player.source_player_id && players.some((candidate) => candidate.id === player.source_player_id)) {
    return player.source_player_id;
  }
  if (player.internal_player_id && players.some((candidate) => candidate.id === player.internal_player_id)) {
    return player.internal_player_id;
  }
  return null;
}

function pickCardActionHtml(player) {
  const lockId = builderLockPlayerId(player);
  const alreadyLocked = lockId && lockedPlayerIds.has(lockId);
  const lockLabel = alreadyLocked ? "Remove from Builder" : "Add to Builder";
  const lockButton = lockId
    ? `<button class="pick-card__action pick-card__action--lock${alreadyLocked ? " is-active" : ""}" type="button" data-lock-player-id="${escapeHtml(lockId)}" aria-pressed="${alreadyLocked}">${lockLabel}</button>`
    : `<button class="pick-card__action" type="button" disabled title="This player is not available in the current Team Builder path.">Unavailable</button>`;

  return `
    <div class="pick-card__actions">
      <button class="pick-card__action" type="button" data-player-detail-id="${escapeHtml(player.id)}">View Profile</button>
      ${lockButton}
    </div>
  `;
}

function renderPickCard(player, options = {}) {
  const measureKey = options.measureKey || "balanced";
  const modelKey = options.modelKey || "";
  const label = primaryPickTypeBadgeLabel({
    label: options.label || measures[measureKey]?.label || "Pick",
    measureKey,
    modelKey
  });

  if (!player) {
    const emptyTitle = options.emptyTitle || "Fantasy data unavailable";
    const emptyCopy = options.emptyCopy || "The site will use the local player list if the current fantasy data is unavailable.";

    return `
      <article class="pick-card pick-card--empty">
        <span class="pick-card__label">${escapeHtml(label)}</span>
        <strong>${escapeHtml(emptyTitle)}</strong>
        <p>${escapeHtml(emptyCopy)}</p>
      </article>
    `;
  }

  const projectionSummary = pickCardProjectionSummary(player);
  const modelDescription = options.modelDescription || pickCardModelDescription(modelKey, measureKey);
  const riskDescription = pickCardRiskDescription(player, measureKey, modelKey);
  const matchContextDescription = pickCardMatchContextDescription(player, measureKey, modelKey);
  const cardReason = [matchContextDescription, riskDescription].filter(Boolean).join(" ");

  return `
    <article class="pick-card pick-card--${pickRiskKind(player)}">
      <div class="pick-card__top">
        <span class="pick-card__label">${escapeHtml(label)}</span>
      </div>
      ${playerDetailButton(player, "player-name-button--dashboard", measureKey)}
      <p class="pick-card__meta">${escapeHtml(playerCountryText(player))} · Fantasy position: ${escapeHtml(player.position)}</p>
      ${projectionSummary ? `<p class="pick-card__summary">${escapeHtml(projectionSummary)}</p>` : ""}
      <p class="pick-card__fixture">${escapeHtml(pickFixtureLabel(player))}</p>
      <p class="pick-card__model">${escapeHtml(modelDescription)}</p>
      ${cardReason ? `<p class="pick-card__reason">${escapeHtml(cardReason)}</p>` : ""}
      ${pickCardActionHtml(player)}
    </article>
  `;
}

function lockPlayerFromPickCard(playerId) {
  const player = playerById(playerId);
  const lockId = player ? builderLockPlayerId(player) : playerId;
  const builderPlayer = playerById(lockId);

  if (!lockId || !builderPlayer || !players.some((candidate) => candidate.id === lockId)) {
    return false;
  }

  const wasLocked = lockedPlayerIds.has(lockId);
  if (wasLocked) {
    lockedPlayerIds.delete(lockId);
  } else {
    lockedPlayerIds.add(lockId);
  }

  renderPlayerPicker();
  renderLockedPreview();
  updateControlStates();
  renderDashboardSections();
  renderCaptainPicks();
  renderAdviceTable();
  teamMessage.textContent = wasLocked
    ? `${builderPlayer.name} was removed from locked players. Add another pick or build with the current locks.`
    : `${builderPlayer.name} was added to Team Builder. Add a few more picks or click ${builderActionLabel()}.`;

  return {
    locked: !wasLocked,
    player: builderPlayer
  };
}

function handlePickCardActions(event) {
  const lockButton = event.target.closest("[data-lock-player-id]");

  if (!lockButton) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  const lockResult = lockPlayerFromPickCard(lockButton.dataset.lockPlayerId);
  if (lockResult) {
    lockButton.textContent = lockResult.locked ? "Remove from Builder" : "Add to Builder";
    lockButton.classList.toggle("is-active", lockResult.locked);
    lockButton.setAttribute("aria-pressed", String(lockResult.locked));
  }
}

function handlePicksBuilderTrayClick(event) {
  const removeButton = event.target.closest("[data-remove-lock-player-id]");
  const clearButton = event.target.closest("[data-clear-pick-locks]");

  if (removeButton) {
    event.preventDefault();
    lockPlayerFromPickCard(removeButton.dataset.removeLockPlayerId);
    return;
  }

  if (clearButton) {
    event.preventDefault();
    clearLockedPlayers();
    renderDashboardSections();
    renderCaptainPicks();
    renderAdviceTable();
  }
}

function renderFantasyPoolPreviewCaptainPicks() {
  const captainCandidates = fantasyPoolPreviewCandidatesForMode("captain").slice(0, 8);
  const captainModelDescription = "Captain watchlist based on projected points, matchup, start chance, and downside.";
  const dataWarnings = activeDataWarningsForSection("captain", {
    matchdayId: activeMatchdayId,
    mode: "captain"
  });
  const warningHtml = modelDataWarningHtml(dataWarnings, { title: "Captain Watchlist" });

  if (captainCardGrid) {
    const cardsHtml = captainCandidates.length
      ? captainCandidates.map((player, index) => renderPickCard(player, {
        label: index === 0 ? "Top Captain Option" : `Captain Option ${index + 1}`,
        measureKey: "captain",
        modelDescription: captainModelDescription
      })).join("")
      : renderPickCard(null, { label: "Captain Watchlist", measureKey: "captain" });
    captainCardGrid.innerHTML = `${warningHtml}${cardsHtml}`;
  }

  if (!captainTableBody) {
    return;
  }

  const warningRow = dataWarnings.length ? `
    <tr class="fallback-table-row">
      <td colspan="8">${escapeHtml(dataWarnings.join(" "))}</td>
    </tr>
  ` : "";

  captainTableBody.innerHTML = warningRow + captainCandidates.map((player, index) => {
    const candidate = player.preview_candidate || {};
    return `
      <tr>
        <td>${index + 1}</td>
        <td>${playerDetailButton(player, "", "captain")}</td>
        <td>${playerCountryText(player)}</td>
        <td>${escapeHtml(player.club)}</td>
        <td>${projectedMatchdayPointScoreHtml(player)}</td>
        <td>${displayNumber(scoreValue(player, "start_probability_percent"))}%</td>
        <td>${fantasyPoolCandidateStat(player, "ceiling_points")}</td>
        <td>${displayNumber(scoreValue(player, "finance_composite_risk_score"))}</td>
      </tr>
    `;
  }).join("");

  if (!captainCandidates.length) {
    captainTableBody.innerHTML = warningRow + `
      <tr class="fallback-table-row">
        <td colspan="8">Active fantasyPool captain recommendations unavailable.</td>
      </tr>
    `;
  }
}

function renderCaptainPicks() {
  if (usingFantasyPoolPreview) {
    renderFantasyPoolPreviewCaptainPicks();
    return;
  }

  const warning = modelDataWarningHtml(activeDataWarningsForSection("captain"), { title: "Captain Watchlist" });

  if (captainCardGrid) {
    captainCardGrid.innerHTML = `${warning}${renderPickCard(null, {
      label: "Captain Watchlist",
      measureKey: "captain",
      emptyTitle: "Active captain data unavailable",
      emptyCopy: "Current fantasyPool captain recommendations are unavailable."
    })}`;
  }

  if (!captainTableBody) {
    return;
  }

  captainTableBody.innerHTML = `
    <tr class="fallback-table-row">
      <td colspan="8">Active fantasyPool captain recommendations unavailable.</td>
    </tr>
  `;
}

function activeQuickPickModelOption() {
  return pickModelOption(activeQuickPickModelKey);
}

function activeQuickPickPositionLabel() {
  return activeQuickPickPosition === "All" ? "all positions" : activeQuickPickPosition.toLowerCase();
}

const starterPackTargetCardCount = 8;
const starterPackLaneConfigs = [
  {
    id: "topProjection",
    modelKey: "expected",
    count: 1,
    label: "Top Projection",
    description: "Starter pack: highest projected return from the filtered pool."
  },
  {
    id: "core",
    modelKey: "balanced",
    count: 2,
    label: "Core Pick",
    description: "Starter pack: reliable core option balancing projected return, starts, and minutes."
  },
  {
    id: "highFloor",
    modelKey: "safe",
    count: 1,
    label: "High-Floor Pick",
    description: "Starter pack: safer-minutes option with lower downside."
  },
  {
    id: "upside",
    modelKey: "upside",
    count: 1,
    label: "Upside Pick",
    description: "Starter pack: ceiling-focused option in a stronger attacking spot."
  },
  {
    id: "budgetEnabler",
    modelKey: "cheapEnabler",
    count: 1,
    label: "Budget Enabler",
    description: "Starter pack: lower-price player with a playable role."
  },
  {
    id: "value",
    modelKey: "bestValue",
    count: 1,
    label: "Value Pick",
    description: "Starter pack: strong projected return for the price."
  },
  {
    id: "differential",
    modelKey: "differential",
    count: 1,
    label: "Differential Pick",
    description: "Starter pack: less obvious pick that still projects well."
  }
];
const starterPackFallbackLaneIds = ["value", "core", "topProjection", "highFloor", "upside", "differential", "budgetEnabler"];

function filterQuickPickPosition(playerList) {
  return activeQuickPickPosition === "All"
    ? playerList
    : playerList.filter((player) => player.position === activeQuickPickPosition);
}

function isBudgetEnablerPick(player) {
  const cheapEnablerScore = optionalScoreValue(player, "cheap_enabler_score_v1", "cheap_enabler_score");
  const startProbability = optionalScoreValue(player, "start_probability_percent");
  const price = proxyPrice(player);
  const valueRole = String(player?.value_role || player?.preview_finance_context?.value_role || "").toLowerCase();

  return valueRole === "cheap_enabler" ||
    Number.isFinite(cheapEnablerScore) && cheapEnablerScore >= 50 ||
    Number.isFinite(price) && price <= 6 && (!Number.isFinite(startProbability) || startProbability >= 45);
}

function pickPlayerStableKey(player) {
  return String(
    player?.preview_player_key ||
    player?.source_player_id ||
    player?.internal_player_id ||
    player?.official_fantasy_player_id ||
    player?.id ||
    [player?.name, player?.country, player?.position].filter(Boolean).join("|")
  ).trim();
}

function uniquePickPlayer(playerList, usedPlayerKeys) {
  const player = playerList.find((candidate) => {
    const key = pickPlayerStableKey(candidate);
    return key && !usedPlayerKeys.has(key);
  });

  if (player) {
    usedPlayerKeys.add(pickPlayerStableKey(player));
  }

  return player;
}

function starterPackOption(lane) {
  const option = pickModelOption(lane.modelKey);

  return {
    ...option,
    id: option.id || lane.modelKey,
    label: lane.label,
    cardLabel: lane.label,
    measureKey: option.measureKey || lane.modelKey
  };
}

function starterPackCandidatesForLane(lane, candidateCache) {
  if (!candidateCache.has(lane.id)) {
    const candidates = quickPickCandidatesForOption(starterPackOption(lane));
    candidateCache.set(
      lane.id,
      lane.id === "budgetEnabler" ? candidates.filter(isBudgetEnablerPick) : candidates
    );
  }

  return candidateCache.get(lane.id);
}

function renderStarterPackCard(player, lane) {
  const option = starterPackOption(lane);

  return renderPickCard(player, {
    label: lane.label,
    measureKey: option.measureKey,
    modelKey: option.id,
    modelDescription: lane.description
  });
}

function addStarterPackCardForLane(cards, usedPlayerKeys, lane, candidateCache) {
  if (cards.length >= starterPackTargetCardCount) {
    return false;
  }

  const player = uniquePickPlayer(starterPackCandidatesForLane(lane, candidateCache), usedPlayerKeys);
  if (!player) {
    return false;
  }

  cards.push(renderStarterPackCard(player, lane));
  return true;
}

function selectStarterPackCards() {
  const cards = [];
  const usedPlayerKeys = new Set();
  const candidateCache = new Map();

  starterPackLaneConfigs.forEach((lane) => {
    for (let index = 0; index < lane.count; index += 1) {
      addStarterPackCardForLane(cards, usedPlayerKeys, lane, candidateCache);
    }
  });

  let addedFallbackCard = true;
  while (cards.length < starterPackTargetCardCount && addedFallbackCard) {
    addedFallbackCard = false;
    starterPackFallbackLaneIds
      .map((laneId) => starterPackLaneConfigs.find((lane) => lane.id === laneId))
      .filter(Boolean)
      .forEach((lane) => {
        if (addStarterPackCardForLane(cards, usedPlayerKeys, lane, candidateCache)) {
          addedFallbackCard = true;
        }
      });
  }

  return cards;
}

function quickPickCandidatesForOption(option) {
  if (!usingFantasyPoolPreview) {
    return [];
  }

  const measure = pickModelMeasure(option);
  const trustMode = trustModes.balanced;
  const sourceMode = fantasyPoolPreviewModeForAdvice(option.id, trustMode);
  const sourcePool = fantasyPoolPreviewCandidatesForMode(sourceMode);
  let positionPool = filterQuickPickPosition(sourcePool);
  if (activeQuickPickPosition !== "All" && !positionPool.length) {
    positionPool = filterQuickPickPosition(fantasyPoolPreviewPlayers);
  }
  const trustPool = trustFilteredPlayers(positionPool, measure, trustMode, { allowFallback: true });
  const basePool = trustPool.length ? trustPool : positionPool;

  return sortByPickModel(basePool, option, trustMode);
}

function quickPickFallbackCard(option) {
  const positionText = activeQuickPickPosition === "All"
    ? "No players match this pick model yet."
    : `No ${activeQuickPickPosition.toLowerCase()} picks match this model yet.`;

  return renderPickCard(null, {
    label: option.label,
    measureKey: option.measureKey,
    emptyTitle: "No matching picks",
    emptyCopy: `${positionText} Try All positions.`
  });
}

function renderDashboardSections() {
  if (!dashboardGrid) {
    return;
  }

  const cards = selectStarterPackCards();
  const warningHtml = modelDataWarningHtml(activeDataWarningsForSection("home"), {
    title: "Home Picks"
  });

  dashboardGrid.innerHTML = warningHtml + (cards.length
    ? cards.join("")
    : quickPickFallbackCard(pickModelOption("balanced")));
}

function renderFantasyPoolPreviewAdviceTable() {
  const measureKey = adviceMeasureSelect.value || "balanced";
  const pickOption = pickModelOption(measureKey);
  const measure = pickModelMeasure(pickOption);
  const positionFilterValue = advicePositionSelect.value || "All";
  const trustMode = activeTrustMode();
  const poolMode = activeAdvicePoolMode();
  const financeLens = activeAdviceFinanceLens();
  const previewMode = fantasyPoolPreviewModeForAdvice(measureKey, trustMode);
  const previewPlayers = fantasyPoolPreviewCandidatesForMode(previewMode);
  const dataWarnings = activeDataWarningsForSection("picks", {
    matchdayId: activeMatchdayId,
    mode: previewMode
  });
  const positionPool = positionFilterValue === "All"
    ? previewPlayers
    : previewPlayers.filter((player) => player.position === positionFilterValue);
  const trustPool = trustFilteredPlayers(positionPool, measure, trustMode, { allowFallback: true });
  const basePool = trustPool.length ? trustPool : positionPool;
  const visiblePool = poolMode.id === "watchlist"
    ? basePool
    : basePool.filter((player) =>
      ["top_pick_candidate", "strong_candidate"].includes(player.preview_candidate?.recommendation_tier)
    );
  const positionLabel = positionFilterValue === "All" ? "all positions" : positionFilterValue.toLowerCase();
  const modelRankedPool = sortByPickModel(visiblePool, pickOption, trustMode);
  const rankedPool = financeLens.defaultLens ? modelRankedPool : sortByFinanceLens(modelRankedPool, financeLens);

  adviceStyleNote.innerHTML = `${escapeHtml(`Showing ${pickOption.label} candidates for ${positionLabel} in ${activeMatchdayLabel()}. Pick cards use projected points, role, matchup, and downside context.`)} ${activeDataBadgeHtml()} ${modelDataWarningInlineHtml(dataWarnings, { title: "Picks" })}`;

  if (adviceCardGrid) {
    const warningHtml = modelDataWarningHtml(dataWarnings, { title: "Picks" });
    adviceCardGrid.innerHTML = warningHtml + (visiblePool.length
      ? rankedPool.slice(0, 8).map((player, index) => renderPickCard(player, {
        label: pickListCardLabel(pickOption, index),
        measureKey: pickOption.measureKey,
        modelKey: pickOption.id
      })).join("")
      : renderPickCard(null, {
        label: "Pick Explorer",
        measureKey: pickOption.measureKey,
        emptyTitle: "No matching picks",
        emptyCopy: "No fantasy candidates match this Pick Explorer filter. Try another position or strategy."
      }));
  }

  const warningRow = dataWarnings.length ? `
    <tr class="fallback-table-row">
      <td colspan="9">${escapeHtml(dataWarnings.join(" "))}</td>
    </tr>
  ` : "";
  adviceTableBody.innerHTML = warningRow + rankedPool.slice(0, 8).map((player) => `
    <tr>
      <td>${playerDetailButton(player, "", measureKey)}</td>
      <td>${playerCountryText(player)}</td>
      <td>${player.position}</td>
      <td>${playerPriceText(player)}</td>
      <td>${fantasyPoolPreviewTableScore(player, pickOption.label)}</td>
      <td>${projectedMatchdayPoints(player)}</td>
      <td>${displayNumber(scoreValue(player, "finance_composite_risk_score"))}</td>
      <td>${financeLensCell(player, financeLens)}</td>
      <td>${escapeHtml(fantasyPoolCandidateReason(player))}</td>
    </tr>
  `).join("");

  if (!visiblePool.length) {
    adviceTableBody.innerHTML = warningRow + `
      <tr>
        <td colspan="9">No fantasy candidates match this Pick Explorer filter. Try Include watchlist differentials, another position, or a broader strategy.</td>
      </tr>
    `;
  }
}

function renderAdviceTable() {
  if (usingFantasyPoolPreview) {
    renderFantasyPoolPreviewAdviceTable();
    return;
  }

  const dataWarnings = activeDataWarningsForSection("picks");
  adviceStyleNote.innerHTML = `${activeDataBadgeHtml()} ${modelDataWarningInlineHtml(dataWarnings, { title: "Picks" })}`;

  if (adviceCardGrid) {
    adviceCardGrid.innerHTML = `${modelDataWarningHtml(dataWarnings, { title: "Picks" })}${renderPickCard(null, {
      label: "Pick Explorer",
      measureKey: "balanced",
      emptyTitle: "Active pick data unavailable",
      emptyCopy: "Current fantasyPool recommendations are unavailable."
    })}`;
  }

  if (adviceTableBody) {
    adviceTableBody.innerHTML = `
      <tr class="fallback-table-row">
        <td colspan="9">Active fantasyPool recommendations unavailable.</td>
      </tr>
    `;
  }
}

function buildTeam() {
  clearSavedDecisionExports();
  clearUserSquadSelections();
  clearMatchdayDecisionInputs();

  const buildResult = generatedFinalRoundBalancedSquad() || buildSuggestedSquad();
  const {
    starters,
    bench,
    ignoredLockedPlayers,
    budgetCouldNotFit,
    countryLimitCouldNotFit,
    optimizerFoundValidSquad,
    optimizerEvaluatedPaths,
    riskConstraintsCouldNotFit,
    generatedArtifact
  } = buildResult;
  selectedSwap = null;
  renderTeam(starters, bench, ignoredLockedPlayers, "built", {
    budgetCouldNotFit,
    countryLimitCouldNotFit,
    optimizerFoundValidSquad,
    optimizerEvaluatedPaths,
    riskConstraintsCouldNotFit,
    generatedArtifact
  });
  renderRemovedPlayers();
}

function resetTeam() {
  clearRenderedTeam(`Team reset. Locked players and filters are still available; click ${builderActionLabel()} when ready.`, {
    clearExclusions: true
  });
  renderPlayerPicker();
}

function addBackRemovedPlayer(playerId) {
  const player = playerById(playerId);

  if (!player) {
    return;
  }

  excludedPlayerIds.delete(playerId);
  renderPlayerPicker();
  renderRemovedPlayers();
  updateControlStates();
  teamMessage.textContent = `${player.name} is available again. Click ${builderActionLabel()} to include him if he fits.`;
}

function clearLockedPlayers() {
  lockedPlayerIds.clear();
  document.querySelectorAll("#player-picker input[type=\"checkbox\"]").forEach((checkbox) => {
    checkbox.checked = false;
  });
  selectedSwap = null;
  currentIgnoredLockedPlayers = [];
  builderWarning.classList.add("hidden");
  builderWarning.textContent = "";
  renderPlayerPicker();
  renderDashboardSections();
  renderCaptainPicks();
  renderAdviceTable();

  if (currentRenderMode === "built") {
    updateSwapPrompt();
    teamMessage.textContent = "Cleared locked players. Current squad stays on screen; rebuild anytime for unlocked suggestions.";
    updateControlStates();
    return;
  }

  clearRenderedTeam("Cleared locked players. Current squad stays on screen; rebuild anytime for unlocked suggestions.");
}

function removeSelectedPlayer() {
  if (currentRenderMode !== "built") {
    showBuilderWarning(`Build a full ${squadLabel()} before removing a player.`);
    return;
  }

  const selection = selectedVisibleSquadPlayer();

  if (!selection) {
    showBuilderWarning("Select a starter or bench player first, then click Remove Selected Player.");
    return;
  }

  const { player, area, position, slotIndex } = selection;
  const slotMap = area === "starter"
    ? currentStarterSlotsByPosition
    : currentBenchSlotsByPosition;

  excludedPlayerIds.add(player.id);
  lockedPlayerIds.delete(player.id);

  if (slotMap[position] && slotIndex >= 0) {
    slotMap[position][slotIndex] = null;
  }

  selectedSwap = null;
  renderPlayerPicker();
  renderRemovedPlayers();
  renderCurrentSlotState(`Removed ${player.name}. The slot is now open. Click ${builderActionLabel()} to refill it without that player. Reset Team clears removed-player exclusions.`);
}

function showBuilderWarning(message) {
  builderWarning.classList.remove("hidden");
  builderWarning.textContent = message;
}

function findCurrentPlayer(playerId) {
  return [...currentRenderedTeam, ...currentBenchPlayers]
    .find((player) => player.id === playerId);
}

function selectedVisibleSquadPlayer() {
  const selectedCard = document.querySelector(".is-selected-swap[data-player-id][data-area]");

  if (selectedCard) {
    const player = findCurrentPlayer(selectedCard.dataset.playerId);

    if (player) {
      return {
        player,
        area: selectedCard.dataset.area,
        position: selectedCard.dataset.position,
        slotIndex: Number(selectedCard.dataset.slotIndex)
      };
    }
  }

  if (!selectedSwap) {
    return null;
  }

  const player = findCurrentPlayer(selectedSwap.playerId);

  if (!player) {
    return null;
  }

  const slotMap = selectedSwap.area === "starter"
    ? currentStarterSlotsByPosition
    : currentBenchSlotsByPosition;
  const slotIndex = (slotMap[player.position] || [])
    .findIndex((slotPlayer) => slotPlayer?.id === player.id);

  return {
    player,
    area: selectedSwap.area,
    position: player.position,
    slotIndex
  };
}

function swapStarterWithBench(starterId, benchId) {
  if (currentRenderMode !== "built") {
    selectedSwap = null;
    updateSwapPrompt();
    showBuilderWarning(`Build the full ${squadLabel()} before trying substitutions.`);
    return;
  }

  const starter = findCurrentPlayer(starterId);
  const benchPlayer = findCurrentPlayer(benchId);

  if (!starter || !benchPlayer) {
    selectedSwap = null;
    updateSwapPrompt();
    return;
  }

  const nextCounts = countsByPosition(currentRenderedTeam);
  nextCounts[starter.position] -= 1;
  nextCounts[benchPlayer.position] += 1;

  const nextTactic = tacticNameForCounts(nextCounts);

  if (!nextTactic) {
    selectedSwap = null;
    updateSwapPrompt();
    showBuilderWarning(`That swap would create a formation this simple builder does not support yet. Try a same-position swap or a swap that creates ${formationListText()}.`);
    return;
  }

  const nextStarters = currentRenderedTeam.map((player) =>
    player.id === starterId ? benchPlayer : player
  );
  const nextBench = currentBenchPlayers.map((player) =>
    player.id === benchId ? starter : player
  );

  tacticSelect.value = nextTactic;
  selectedSwap = null;
  clearSavedDecisionExports();
  renderTeam(nextStarters, nextBench, currentIgnoredLockedPlayers, "built");
  swapMessage.textContent = `Swapped ${benchPlayer.name} into the starters and moved ${starter.name} to the bench.`;
}

function handleSquadCardClick(event) {
  const roleButton = event.target.closest("[data-squad-role-action][data-player-id]");

  if (roleButton) {
    handleSquadRoleAction(roleButton);
    return;
  }

  if (event.target.closest("[data-player-detail-id]")) {
    return;
  }

  const card = event.target.closest("[data-player-id][data-area]");

  if (!card) {
    return;
  }

  if (currentRenderMode !== "built") {
    selectedSwap = null;
    updateSwapPrompt();
    showBuilderWarning(`Build the full ${squadLabel()} before trying substitutions.`);
    return;
  }

  const nextSelection = {
    playerId: card.dataset.playerId,
    area: card.dataset.area
  };

  if (
    selectedSwap &&
    selectedSwap.playerId === nextSelection.playerId &&
    selectedSwap.area === nextSelection.area
  ) {
    selectedSwap = null;
    updateSwapPrompt();
    return;
  }

  if (!selectedSwap || selectedSwap.area === nextSelection.area) {
    selectedSwap = nextSelection;
    updateSwapPrompt();
    return;
  }

  const starterId = selectedSwap.area === "starter" ? selectedSwap.playerId : nextSelection.playerId;
  const benchId = selectedSwap.area === "bench" ? selectedSwap.playerId : nextSelection.playerId;
  swapStarterWithBench(starterId, benchId);
}

function handleSquadCardKeydown(event) {
  if (event.target.closest("[data-player-detail-id], [data-squad-role-action]")) {
    return;
  }

  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  event.preventDefault();
  handleSquadCardClick(event);
}

function handleRemovedPlayersClick(event) {
  const button = event.target.closest("[data-add-back-player-id]");

  if (!button) {
    return;
  }

  addBackRemovedPlayer(button.dataset.addBackPlayerId);
}

function handlePlayerDetailCloseClick(event) {
  if (!event.target.closest("[data-close-player-detail]")) {
    return;
  }

  closePlayerDetail();
}

function handlePlayerDetailBodyClick(event) {
  const tagHelpButton = event.target.closest("[data-profile-tag-help]");

  if (tagHelpButton) {
    const tagHelp = playerDetailBody?.querySelector("#profile-tag-help");
    const isHidden = tagHelp?.classList.toggle("hidden") ?? true;
    tagHelpButton.setAttribute("aria-expanded", String(!isHidden));
    return;
  }

  if (event.target.closest("[data-profile-model-notes-link]")) {
    closePlayerDetail();
  }
}

function handlePlayerDetailKeydown(event) {
  if (event.key === "Escape" && !playerDetailModal?.classList.contains("hidden")) {
    closePlayerDetail();
  }
}

function setupBuilder() {
  organizeStatExamples();

  if (!players.length) {
    teamMessage.textContent = "Player data could not be loaded.";
    if (buildTeamButtonTop) buildTeamButtonTop.disabled = true;
    buildTeamButtonBottom.disabled = true;
    if (saveBrowserSquadButton) saveBrowserSquadButton.disabled = true;
    if (loadBrowserSquadButton) loadBrowserSquadButton.disabled = true;
    if (clearBrowserSquadButton) clearBrowserSquadButton.disabled = true;
    exportTeamJsonButton.disabled = true;
    return;
  }

  renderTacticOptions();
  renderPositionFilterOptions();
  renderCountryFilterOptions();
  updateRuleCopy();
  renderMeasureOptions();
  renderFinanceLensOptions();
  renderTrustModeOptions();
  renderMatchdayOptions();
  renderBuilderActionCopy();
  renderCaptainChangeOptions();
  renderSavedSquadTimelineOptions();
  if (advicePoolSelect) {
    advicePoolSelect.value = activeAdvicePoolModeId;
  }
  renderCardStatOptions();
  renderMatchEnvironmentOptions();
  renderMatchEnvironmentTable();
  renderKnockoutPredictor();
  renderKnockoutBracketPrediction();
  renderMeasureInfo();
  renderDecisionToolStatuses();
  renderPlayerPicker();
  renderCaptainPicks();
  renderDashboardSections();
  renderAdviceTable();
  renderLockedPreview();
  updateControlStates();
  renderRemovedPlayers();

  [dashboardGrid, captainCardGrid, adviceCardGrid, captainTableBody, adviceTableBody, playerPicker, teamPlayers, benchPlayers]
    .filter(Boolean)
    .forEach((container) => container.addEventListener("click", handlePlayerDetailTrigger));
  [dashboardGrid, captainCardGrid, adviceCardGrid]
    .filter(Boolean)
    .forEach((container) => container.addEventListener("click", handlePickCardActions));
  playerDetailBody?.addEventListener("click", handlePickCardActions);
  playerDetailBody?.addEventListener("click", handlePlayerDetailBodyClick);
  picksBuilderTray?.addEventListener("click", handlePicksBuilderTrayClick);
  playerDetailClose?.addEventListener("click", closePlayerDetail);
  playerDetailModal?.addEventListener("click", handlePlayerDetailCloseClick);
  document.addEventListener("keydown", handlePlayerDetailKeydown);
  buildTeamButtonTop?.addEventListener("click", buildTeam);
  buildTeamButtonBottom.addEventListener("click", buildTeam);
  runStrategyComparisonButton?.addEventListener("click", runStrategyComparison);
  saveBrowserSquadButton?.addEventListener("click", saveTeamToBrowser);
  loadBrowserSquadButton?.addEventListener("click", loadTeamFromBrowser);
  clearBrowserSquadButton?.addEventListener("click", clearBrowserSavedSquad);
  builderReadyActions?.addEventListener("click", handleBuilderReadyActionClick);
  resetTeamButton.addEventListener("click", resetTeam);
  clearLockedButton.addEventListener("click", clearLockedPlayers);
  removeSelectedPlayerButton.addEventListener("click", removeSelectedPlayer);
  exportTeamJsonButton.addEventListener("click", exportTeamJson);
  importTeamJsonInput?.addEventListener("change", importTeamJson);
  removedPlayersList.addEventListener("click", handleRemovedPlayersClick);
  scoreInfoButton?.addEventListener("click", toggleScoreInfo);
  quickPickModelSelect?.addEventListener("change", (event) => updateQuickPickModel(event.target.value));
  quickPositionSelect?.addEventListener("change", (event) => updateQuickPickPosition(event.target.value));
  quickModelHelpButton?.addEventListener("click", toggleQuickModelHelp);
  measureSelect.addEventListener("change", () => {
    renderMeasureInfo();
    renderPlayerPicker();
    renderDashboardSections();
    if (currentRenderMode === "built") {
      buildTeam();
    } else {
      renderLockedPreview();
    }
  });
  adviceMeasureSelect.addEventListener("change", renderAdviceTable);
  adviceFinanceLensSelect?.addEventListener("change", renderAdviceTable);
  advicePositionSelect.addEventListener("change", renderAdviceTable);
  advicePoolSelect?.addEventListener("change", (event) => {
    activeAdvicePoolModeId = advicePoolModes[event.target.value] ? event.target.value : "playable";
    renderAdviceTable();
  });
  adviceMatchdaySelect?.addEventListener("change", (event) => updateMatchdayView(event.target.value));
  builderMatchdaySelect?.addEventListener("change", (event) => updateMatchdayView(event.target.value));
  trustModeSelects.forEach((select) => {
    select.addEventListener("change", (event) => updateTrustMode(event.target.value));
  });
  environmentMatchdaySelect?.addEventListener("change", (event) => {
    activeEnvironmentMatchdayId = event.target.value;
    renderMatchEnvironmentTable();
  });
  environmentGroupSelect?.addEventListener("change", renderMatchEnvironmentTable);
  environmentFilterSelect?.addEventListener("change", renderMatchEnvironmentTable);
  knockoutFixtureSelect?.addEventListener("change", renderKnockoutMatchup);
  [matchdayDecisionMatchdaySelect, matchdayDecisionRiskSelect, matchdayDecisionStarterSelect]
    .filter(Boolean)
    .forEach((select) => select.addEventListener("change", renderMatchdayDecisionCenter));
  [matchdayDecisionCaptainPointsInput, matchdayDecisionStarterPointsInput]
    .filter(Boolean)
    .forEach((input) => input.addEventListener("input", renderMatchdayDecisionCenter));
  matchdayDecisionCenterContent?.addEventListener("click", handleMatchdayDecisionCenterClick);
  captainChangeForm?.addEventListener("submit", renderCaptainChangeAdvisor);
  captainChangeCurrentPointsInput?.addEventListener("input", renderCaptainChangeAdvisor);
  [captainChangeCurrentPlayerInput, captainChangeCandidateInput]
    .filter(Boolean)
    .forEach((select) => select.addEventListener("change", renderCaptainChangeAdvisor));
  [captainChangeCurrentCountrySelect, captainChangeCurrentPositionSelect, captainChangeCandidateCountrySelect, captainChangeCandidatePositionSelect]
    .filter(Boolean)
    .forEach((select) => select.addEventListener("change", () => {
      renderDecisionPlayerSelects();
      renderCaptainChangeAdvisor();
    }));
  [captainChangeMatchdaySelect, captainChangeRiskSelect]
    .filter(Boolean)
    .forEach((select) => select.addEventListener("change", () => {
      renderSavedSquadDecisionPanels();
      renderCaptainChangeAdvisor();
    }));
  captainChangeSquadPanel?.addEventListener("click", handleCaptainSavedSquadClick);
  captainChangeResetButton?.addEventListener("click", resetCaptainChangeAdvisor);
  substitutionAdvisorForm?.addEventListener("submit", renderSubstitutionAdvisor);
  substitutionAdvisorPointsInput?.addEventListener("input", renderSubstitutionAdvisor);
  [substitutionAdvisorStarterInput, substitutionAdvisorBenchInput]
    .filter(Boolean)
    .forEach((select) => select.addEventListener("change", renderSubstitutionAdvisor));
  [substitutionAdvisorStarterCountrySelect, substitutionAdvisorStarterPositionSelect, substitutionAdvisorBenchCountrySelect, substitutionAdvisorBenchPositionSelect]
    .filter(Boolean)
    .forEach((select) => select.addEventListener("change", () => {
      renderDecisionPlayerSelects();
      renderSubstitutionAdvisor();
    }));
  [substitutionAdvisorMatchdaySelect, substitutionAdvisorRiskSelect]
    .filter(Boolean)
    .forEach((select) => select.addEventListener("change", () => {
      renderSavedSquadDecisionPanels();
      renderSubstitutionAdvisor();
    }));
  substitutionAdvisorSquadPanel?.addEventListener("click", handleSubstitutionSavedSquadClick);
  substitutionAdvisorResetButton?.addEventListener("click", resetSubstitutionAdvisor);
  savedSquadTimelineMatchdaySelect?.addEventListener("change", renderSavedSquadTimeline);
  savedSquadTimelineContent?.addEventListener("click", handleSavedSquadTimelineClick);
  cardStatSelect.addEventListener("change", () => {
    renderTeam(currentRenderedTeam, currentBenchPlayers, currentIgnoredLockedPlayers, currentRenderMode);
  });
  tacticSelect.addEventListener("change", () => {
    summaryTactic.textContent = tacticSelect.value;
    if (currentRenderMode === "built") {
      buildTeam();
    } else {
      renderLockedPreview();
    }
  });
  playerSearch.addEventListener("input", renderPlayerPicker);
  positionFilter.addEventListener("change", updatePositionFilter);
  countryFilter?.addEventListener("change", updateCountryFilter);
  minPriceFilter.addEventListener("input", updateBuilderFilters);
  maxPriceFilter.addEventListener("input", updateBuilderFilters);
  [minStartFilter, minMinutesFilter, maxQaReviewFilter].filter(Boolean).forEach((input) => {
    input.addEventListener("input", updateBuilderFilters);
  });
  allowRiskyPicksToggle?.addEventListener("change", updateBuilderFilters);
  playerPicker.addEventListener("change", updateLockedPlayers);
  teamPlayers.addEventListener("click", handleSquadCardClick);
  benchPlayers.addEventListener("click", handleSquadCardClick);
  teamPlayers.addEventListener("keydown", handleSquadCardKeydown);
  benchPlayers.addEventListener("keydown", handleSquadCardKeydown);
}

function showDataLoadError(error) {
  console.error("Website data could not be loaded.", error);
  if (buildTeamButtonTop) buildTeamButtonTop.disabled = true;
  buildTeamButtonBottom.disabled = true;
  resetTeamButton.disabled = true;
  clearLockedButton.disabled = true;
  removeSelectedPlayerButton.disabled = true;
  if (saveBrowserSquadButton) saveBrowserSquadButton.disabled = true;
  if (loadBrowserSquadButton) loadBrowserSquadButton.disabled = true;
  if (clearBrowserSquadButton) clearBrowserSquadButton.disabled = true;
  exportTeamJsonButton.disabled = true;
  if (importTeamJsonInput) {
    importTeamJsonInput.disabled = true;
  }
  builderWarning.classList.remove("hidden");
  builderWarning.textContent = "Website data could not load. Refresh after the static data files finish loading.";
  teamMessage.textContent = "Team Builder is waiting for the player and rules data.";
}

function initializeBuilder() {
  try {
    const rules = loadFantasyRules();
    applyFantasyRules(rules);
    setupBuilder();
  } catch (error) {
    showDataLoadError(error);
  }
}

function openDetailsForCurrentHash() {
  const hashId = window.location.hash ? window.location.hash.slice(1) : "";
  if (!hashId) return;
  const target = document.getElementById(hashId);
  if (target?.tagName?.toLowerCase() === "details") {
    target.open = true;
  }
}

window.addEventListener("hashchange", openDetailsForCurrentHash);
initializeBuilder();
openDetailsForCurrentHash();
