// Source data lives in JSON files:
// data/playerFinanceMetrics_v0.json stores the Week 6 finance model, players.json
// stores the older fallback, and fantasyRules.json stores draft rules.
// The browser loads script-friendly copies first:
// financePlayersData.js defines window.FINANCE_PLAYERS_DATA, playersData.js defines
// window.PLAYERS_DATA, matchdayProjectionsData.js defines matchday projection globals,
// scorePredictionsData.js defines fixture prediction globals, and fantasyRulesData.js
// defines window.FANTASY_RULES_DATA. The official fantasy-pool files define
// separate FANTASY_POOL_* globals for current official fantasy recommendations.
// script.js then uses those datasets together without fetching JSON at runtime.
const fantasyPoolPreviewStatus = window.FANTASY_POOL_OFFICIAL_DATA_STATUS || null;
const rawPlayers = window.FINANCE_PLAYERS_DATA || window.PLAYERS_DATA || [];
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
const players = officialUnavailablePlayerRecords.length
  ? rawPlayers.filter((player) => !isUnavailableInOfficialFantasy(player))
  : rawPlayers;
const financeModelSummary = window.FINANCE_MODEL_SUMMARY || null;
const usingFinanceModel = Boolean(window.FINANCE_PLAYERS_DATA);
const matchdayProjectionRows = window.PLAYER_MATCHDAY_PROJECTIONS_DATA || [];
const matchdayModelSummary = window.MATCHDAY_MODEL_SUMMARY || null;
const scorePredictionRows = window.SCORE_FIXTURE_PREDICTIONS_DATA || [];
const scorePredictionSummary = window.SCORE_PREDICTIONS_SUMMARY || null;
const fantasyPoolRecommendationRows = window.FANTASY_POOL_RECOMMENDATION_CANDIDATES || [];
const fantasyPoolProjectionRows = window.FANTASY_POOL_PLAYER_MATCHDAY_PROJECTIONS || [];
const fantasyPoolFinanceRows = window.FANTASY_POOL_PLAYER_FINANCE_METRICS || [];
const usingFantasyPoolPreview = Boolean(fantasyPoolPreviewStatus && fantasyPoolRecommendationRows.length);
const defaultMatchdayOptions = [
  { matchday_id: "group_stage_full", label: "Full Group Stage" },
  { matchday_id: "md1", label: "Matchday 1" },
  { matchday_id: "md2", label: "Matchday 2" },
  { matchday_id: "md3", label: "Matchday 3" }
];
const matchdayOptions = matchdayModelSummary?.matchday_options || defaultMatchdayOptions;
const defaultActiveMatchdayId = matchdayOptions.some((option) => option.matchday_id === "md1")
  ? "md1"
  : matchdayOptions[0]?.matchday_id || "group_stage_full";
let activeMatchdayId = defaultActiveMatchdayId;
let activeEnvironmentMatchdayId = defaultActiveMatchdayId;
let activeTrustModeId = "balanced";
let activeAdvicePoolModeId = "playable";
const browserSquadStorageKey = "worldCupFantasyHelper.teamExport.v1";

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

const matchdayProjectionLookup = matchdayProjectionRows.reduce((lookup, projection) => {
  const playerProjections = lookup.get(projection.player_id) || {};
  playerProjections[projection.matchday_id] = projection;
  lookup.set(projection.player_id, playerProjections);
  return lookup;
}, new Map());

const scorePredictionLookup = new Map(scorePredictionRows.map((row) => [row.fixture_id, row]));
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
const fantasyPoolPreviewPlayers = usingFantasyPoolPreview
  ? fantasyPoolRecommendationRows.map(fantasyPoolCandidateToPlayer)
  : [];
const fantasyPoolPreviewPlayerById = new Map(fantasyPoolPreviewPlayers.map((player) => [player.id, player]));
const primaryStrategyKeys = ["balanced", "safe", "upside", "differential"];

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
    fixture_use: "official_fantasy_pool_preview",
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
  const financeMetric = fantasyPoolFinanceLookup.get(key) || {};
  const projectionMap = fantasyPoolPreviewProjectionLookup.get(key) || {};
  const positionCode = candidate.official_fantasy_position || financeMetric.official_fantasy_position || "UNK";
  const confidence = candidate.projection_confidence || financeMetric.projection_confidence || "low";
  const dataConfidence = confidenceScore(confidence);
  const startProbability = Number(candidate.start_probability || financeMetric.average_start_probability || 0);
  const expectedMinutes = Number(candidate.expected_minutes || financeMetric.average_expected_minutes || 0);
  const riskScore = fantasyPoolRiskScore(candidate, financeMetric);
  const price = Number(candidate.official_price || financeMetric.official_price || 0);
  const flags = importantPreviewFlags(candidate.data_quality_flags || financeMetric.data_quality_flags || []);
  const valueScore = Number(candidate.value_score || financeMetric.risk_adjusted_points_per_price || 0);
  const recommendationScore = Number(candidate.recommendation_score || candidate.risk_adjusted_points || 0);

  return {
    id: fantasyPoolPreviewPlayerId(candidate),
    preview_player_key: key,
    is_fantasy_pool_preview: true,
    preview_candidate: candidate,
    preview_matchday_projections_by_matchday: projectionMap,
    source_player_id: candidate.internal_player_id || null,
    internal_player_id: candidate.internal_player_id || null,
    official_fantasy_player_id: candidate.official_fantasy_player_id || null,
    name: candidate.name || financeMetric.name || "Player needs check",
    country: candidate.country || financeMetric.country || "needs_check",
    team_id: candidate.team_id || financeMetric.team_id || "",
    position: positionCodeLabels[positionCode] || positionCode,
    position_code: positionCode,
    official_fantasy_position: positionCode,
    club: candidate.matchday === "group_stage_full"
      ? "Official fantasy pool"
      : `Official pick vs ${candidate.opponent || "opponent"}`,
    league: "Official fantasy pool",
    price,
    official_price: price,
    price_is_proxy: false,
    price_note: "Official fantasy price imported from the staged official fantasy pool.",
    roster_status: "fantasy_pool_only",
    selectable_status: "playing",
    recommendation_use: "safe_to_rank",
    finance_label: "official_fantasy_pool_preview",
    portfolio_use: "preview_only",
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
    data_note: fantasyPoolPreviewStatus?.public_warning_html || "Official fantasy picks using the current FIFA fantasy feed.",
    source_note: "Refresh with the monitor when FIFA changes player, price, position, status, rule, or deadline data.",
    minutes_model_source_note: `Role label: ${titleFromSnake(candidate.role_label || "unclear")}; confidence: ${titleFromSnake(candidate.role_confidence || confidence)}.`,
    preview_why_pick: candidate.why_pick || [],
    preview_why_careful: candidate.why_careful || [],
    preview_finance_context: candidate.finance_context || {},
    preview_mode_label: candidate.mode_label || titleFromSnake(candidate.mode),
    preview_matchday: candidate.matchday,
    preview_opponent: candidate.opponent,
    recommendation_tier_label: titleFromSnake(candidate.recommendation_tier),
    model_stage: "official_fantasy_pool_preview"
  };
}

function fantasyPoolPreviewCandidatesForMode(mode, matchdayId = activeMatchdayId) {
  if (!usingFantasyPoolPreview) {
    return [];
  }

  const preferredMatchday = matchdayId || "group_stage_full";
  const candidates = fantasyPoolRecommendationRows.filter((candidate) =>
    candidate.mode === mode && candidate.matchday === preferredMatchday
  );
  const fallbackCandidates = preferredMatchday === "group_stage_full"
    ? []
    : fantasyPoolRecommendationRows.filter((candidate) =>
      candidate.mode === mode && candidate.matchday === "group_stage_full"
    );

  return (candidates.length ? candidates : fallbackCandidates)
    .slice()
    .sort((a, b) => Number(a.rank || 999) - Number(b.rank || 999))
    .map((candidate) => fantasyPoolPreviewPlayerById.get(fantasyPoolPreviewPlayerId(candidate)))
    .filter(Boolean);
}

function fantasyPoolPreviewModeForAdvice(measureKey, trustMode) {
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
  if (!window.FANTASY_RULES_DATA) {
    throw new Error("Fantasy rules data is missing. Load fantasyRulesData.js before script.js.");
  }

  return window.FANTASY_RULES_DATA;
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
  initialBudget = budgetLimit;
  budgetCurrencyLabel = rules?.budget?.currency_label || "fantasy units";
  groupStageCountryLimit = countryLimit;
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
    label: "Balanced",
    optionLabel: "Balanced",
    description: "Best all-around option. It balances expected return, reliability, source confidence, and risk.",
    formula: "Uses the Week 6 risk-adjusted strategy score when available. It blends expected fantasy return, reliability, lower composite risk, and lower tail risk.",
    score: (player) => scoreValue(player, "finance_strategy_risk_adjusted", "risk_adjusted_overall_score")
  },
  expected: {
    label: "Projected Points",
    description: "Ranks players by modeled expected fantasy points for one group-stage match.",
    formula: "Uses expected return points from the Week 6 finance model. The older fallback is risk-adjusted projected points.",
    score: (player) => scoreValue(player, "finance_expected_return_points", "risk_adjusted_expected_points_estimate")
  },
  safe: {
    label: "Safe",
    optionLabel: "Safe",
    description: "Favors steady players with lower risk before chasing upside.",
    formula: "Uses the Week 6 safe-floor strategy score when available. It rewards expected return, minutes security, lower source risk, and lower downside risk.",
    score: (player) => hasScoreValue(player, "finance_strategy_safe_floor")
      ? scoreValue(player, "finance_strategy_safe_floor")
      : (100 - value(player.risk_composite_score)) + value(player.risk_adjusted_expected_points_estimate) * 8
  },
  upside: {
    label: "Upside",
    optionLabel: "Upside",
    description: "Looks for players who produce a lot when they are on the field.",
    formula: "Uses the Week 6 upside strategy score when available. It leans toward high expected return, high per-90 upside, and positive event involvement.",
    score: (player) => scoreValue(player, "finance_strategy_upside", "euro_style_points_per90_estimate")
  },
  minutes: {
    label: "Likely Minutes",
    description: "Looks for players who are more likely to play regularly.",
    formula: "Uses the Week 6 minutes-floor strategy score when available. It favors club minutes, national-team usage, data confidence, and minutes security.",
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
    label: "Best Value",
    optionLabel: "Best Value",
    secondaryLabel: "Budget-aware value score",
    description: "Ranks players by projected return for their budget, with role and budget pressure included.",
    formula: "Uses the active player price field. Score blends projected points per budget unit, value score, cheap-enabler score, start probability, and lower budget pressure.",
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
    formula: "Uses cheap_enabler_score_v1 from the value model, then adds a small matchday lift for projected points per budget unit.",
    score: (player) => scoreValue(player, "cheap_enabler_score_v1", "cheap_enabler_score") + (scoreValue(player, "finance_risk_adjusted_return_points") / proxyPrice(player)) * 14
  },
  premiumWorthIt: {
    label: "Premium Worth It",
    optionLabel: "Premium Worth It",
    secondaryLabel: "Budget-aware value score",
    description: "Checks whether expensive players still justify the spend.",
    formula: "Uses premium_worth_it_score_v1 from the value model, plus matchday expected return and start probability.",
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
    formula: "Uses an Omega-style ratio from the Week 6 finance model, converted into a 0-100 percentile.",
    score: (player) => scoreValue(player, "finance_omega_like_percentile")
  },
  attackHeavy: {
    label: "Attack Heavy",
    optionLabel: "Attack Heavy",
    description: "Chases attackers and attacking defenders with stronger goal, assist, shot, and upside signals.",
    formula: "Uses the Week 6 attack-heavy strategy score. It rewards expected return, upside, attacking position, and attacking event proxies.",
    score: (player) => scoreValue(player, "finance_strategy_attack_heavy", "attack_score")
  },
  defensiveHeavy: {
    label: "Defensive Heavy",
    optionLabel: "Defensive Heavy",
    description: "Looks for goalkeepers and defenders with clean-sheet or defensive floor potential.",
    formula: "Uses the Week 6 defensive-heavy strategy score. It rewards defensive positions, team defensive proxies, clean-sheet signals, and lower downside risk.",
    score: (player) => scoreValue(player, "finance_strategy_defensive_heavy", "defense_score")
  },
  veryRisky: {
    label: "Very Risky Upside",
    optionLabel: "Very Risky Upside",
    description: "A deliberately aggressive style for boom-or-bust recommendations.",
    formula: "Uses the Week 6 very-risky strategy score. It rewards upside, volatility, event dependency, and high-risk profiles, so it should be used as an aggressive watchlist.",
    score: (player) => scoreValue(player, "finance_strategy_very_risky")
  },
  differential: {
    label: "Differential",
    optionLabel: "Differential",
    description: "Looks for lower-obviousness or mispriced players with a defensible projection.",
    formula: "Uses the staged Differential candidate score when available. Legacy fallback uses the very-risky finance strategy with data-check penalties.",
    score: (player) => player.preview_candidate?.mode === "differential"
      ? scoreValue(player, "finance_strategy_risk_adjusted")
      : scoreValue(player, "finance_strategy_very_risky")
  },
  captain: {
    label: "Captain Alpha",
    optionLabel: "Captain Alpha",
    description: "Ranks armband candidates by captain ceiling, starts, raw points, and fixture context.",
    formula: "Uses the staged Captain Alpha score when available. Legacy fallback uses the captain score.",
    score: (player) => player.preview_candidate?.mode === "captain"
      ? scoreValue(player, "finance_strategy_risk_adjusted")
      : scoreValue(player, "finance_captain_score")
  }
};

Object.entries(measures).forEach(([key, measure]) => {
  measure.key = key;
});

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
    formula: "Conservative strongly penalizes uncertain roster status, non-safe recommendation use, data confidence below 65, start probability below 55%, expected minutes below 45, composite risk 65+, and tail risk 70+. It keeps players available so the builder can still complete squads.",
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
  label: "Safe",
  badge: "Safe check",
  switchBuffer: 1.5,
  closeMargin: 0.8,
  projectionLabel: "Safe switch score"
};

const captainChangeRiskModes = {
  safe: safeCaptainChangeRiskMode,
  safer: safeCaptainChangeRiskMode,
  balanced: {
    label: "Balanced",
    badge: "Balanced check",
    switchBuffer: 0.8,
    closeMargin: 0.8,
    projectionLabel: "Balanced switch score"
  },
  upside: {
    label: "Upside",
    badge: "Upside check",
    switchBuffer: 0.2,
    closeMargin: 0.6,
    projectionLabel: "Upside switch score"
  },
  differential: {
    label: "Differential",
    badge: "Differential check",
    switchBuffer: 0,
    closeMargin: 0.5,
    projectionLabel: "Differential switch score"
  }
};

const safeSubstitutionAdvisorRiskMode = {
  label: "Safe",
  badge: "Safe check",
  subBuffer: 1.3,
  closeMargin: 0.8,
  projectionLabel: "Safe sub score"
};

const substitutionAdvisorRiskModes = {
  safe: safeSubstitutionAdvisorRiskMode,
  safer: safeSubstitutionAdvisorRiskMode,
  balanced: {
    label: "Balanced",
    badge: "Balanced check",
    subBuffer: 0.7,
    closeMargin: 0.7,
    projectionLabel: "Balanced sub score"
  },
  upside: {
    label: "Upside",
    badge: "Upside check",
    subBuffer: 0.2,
    closeMargin: 0.6,
    projectionLabel: "Upside sub score"
  },
  differential: {
    label: "Differential",
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
    value: (player) => measureScore(player, activeMeasure())
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
    label: "Best Value",
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
const captainChangeCurrentPlayerInput = document.getElementById("captain-change-current-player-input");
const captainChangeCurrentPointsInput = document.getElementById("captain-change-current-points-input");
const captainChangeCandidateInput = document.getElementById("captain-change-candidate-input");
const captainChangeRiskSelect = document.getElementById("captain-change-risk-select");
const captainChangeResetButton = document.getElementById("captain-change-reset-btn");
const captainChangeSquadPanel = document.getElementById("captain-change-squad-panel");
const captainChangePlayerList = document.getElementById("captain-change-player-list");
const captainChangeStatus = document.getElementById("captain-change-status");
const captainChangeResult = document.getElementById("captain-change-result");
const substitutionAdvisorForm = document.getElementById("substitution-advisor-form");
const substitutionAdvisorMatchdaySelect = document.getElementById("substitution-advisor-matchday-select");
const substitutionAdvisorStarterInput = document.getElementById("substitution-advisor-starter-input");
const substitutionAdvisorPointsInput = document.getElementById("substitution-advisor-points-input");
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
const trustModeSelects = [
  quickTrustModeSelect,
  captainTrustModeSelect,
  adviceTrustModeSelect,
  builderTrustModeSelect
].filter(Boolean);

let selectedPositionFilter = "All";
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

function matchdayLabelFromId(matchdayId) {
  return matchdayOptions.find((option) => option.matchday_id === matchdayId)?.label || matchdayId || "Matchday";
}

function activeProjection(player) {
  if (activeMatchdayId === "group_stage_full") {
    return null;
  }

  if (player?.is_fantasy_pool_preview) {
    return player.preview_matchday_projections_by_matchday?.[activeMatchdayId] || null;
  }

  return matchdayProjectionLookup.get(player.id)?.[activeMatchdayId] || null;
}

function projectionFieldName(fieldName) {
  return projectionFieldMap[fieldName] || fieldName;
}

function scoreValue(player, ...fieldNames) {
  const projection = activeProjection(player);

  if (projection) {
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

  if (projection) {
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

  if (!projection) {
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

  return usingFinanceModel ? "manual_review_before_ranking" : "safe_to_rank";
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

function scorePredictionQualityLabel() {
  const quality = scorePredictionSummary?.quality_checks;

  if (!quality?.status) {
    return "";
  }

  if (quality.status === "pass") {
    return "Data check clear";
  }

  if (quality.status === "pass_with_prototype_caveats") {
    return "Data check caveats";
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
  if (player?.is_fantasy_pool_preview) {
    const projectionMap = player.preview_matchday_projections_by_matchday || {};
    return ["md1", "md2", "md3"]
      .map((matchdayId) => projectionMap[matchdayId])
      .filter(Boolean);
  }

  const projectionMap = matchdayProjectionLookup.get(player.id) || {};

  return ["md1", "md2", "md3"]
    .map((matchdayId) => projectionMap[matchdayId])
    .filter(Boolean);
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
  return projection?.fixture_id ? scorePredictionLookup.get(projection.fixture_id) || null : null;
}

function singleFixtureModelReason(projection, focus = "overall") {
  if (!projection) {
    return "";
  }

  const fixturePrediction = scorePredictionForProjection(projection);
  const teamXg = fieldDisplay(projection, "team_expected_goals");
  const xga = fieldDisplay(projection, "team_expected_goals_against");
  const cleanSheet = fieldPercent(projection, "team_clean_sheet_probability");
  const winChance = fieldPercent(projection, "team_win_probability");
  const upsetRisk = fieldPercent(projection, "match_upset_risk_probability");
  const goalEnvironment = goalEnvironmentLabel(projection.match_goal_environment || fixturePrediction?.goal_environment);
  const difficulty = fixtureDifficultyLabel(projection.fixture_difficulty_band);
  const fixturePrefix = `Fixture model vs ${projection.opponent}:`;
  const compactDifficulty = difficulty ? `${difficulty} fixture` : null;

  if (focus === "attack") {
    return ` ${fixturePrefix} Team xG: ${teamXg || "needs check"}; ${goalEnvironment} goal environment; ${compactDifficulty || "difficulty needs check"}.`;
  }

  if (focus === "defense") {
    return ` ${fixturePrefix} Clean-sheet model: ${cleanSheet || "needs check"}; ${xga || "needs check"} xGA; ${compactDifficulty || "difficulty needs check"}.`;
  }

  if (focus === "risk") {
    return ` ${fixturePrefix} Match upset risk: ${upsetRisk || "needs check"}; win chance ${winChance || "needs check"}; ${goalEnvironment} goal environment.`;
  }

  return ` ${fixturePrefix} Team xG ${teamXg || "needs check"}; clean sheet ${cleanSheet || "needs check"}; match upset risk ${upsetRisk || "needs check"}.`;
}

function groupFixtureModelReason(player, focus = "overall") {
  const projections = playerMatchdayProjections(player);

  if (!projections.length) {
    return "";
  }

  const avgXg = averageProjectionField(projections, "team_expected_goals");
  const avgCleanSheet = averageProjectionField(projections, "team_clean_sheet_probability");
  const bestAttack = bestProjectionByField(projections, "team_expected_goals");
  const bestDefense = bestProjectionByField(projections, "team_clean_sheet_probability");
  const highestUpset = bestProjectionByField(projections, "match_upset_risk_probability");

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
    const highestUpsetText = highestUpset
      ? ` highest Match upset risk vs ${highestUpset.opponent} (${percentText(highestUpset.match_upset_risk_probability)})`
      : "";
    return ` Group model:${highestUpsetText || " Match upset risk needs check"}.`;
  }

  return ` Group model: avg Team xG ${avgXg === null ? "needs check" : displayNumber(avgXg)}; avg clean sheet ${avgCleanSheet === null ? "needs check" : percentText(avgCleanSheet)}.`;
}

function fixtureModelReason(player, focus = "overall") {
  const projection = activeProjection(player);

  if (projection) {
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

const qaFlagDefinitions = {
  not_safe_to_rank: {
    label: "Rank review",
    kind: "review",
    detail: "This player is not marked safe_to_rank in the source model."
  },
  rank_caveat: {
    label: "Caveat",
    kind: "watch",
    detail: "This player is marked safe_to_rank_with_caveat, so the model can rank him but still needs caution."
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
    detail: "This player is marked do_not_rank_yet in the source model."
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

  if (projection) {
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

  if (player.roster_status && player.roster_status !== "confirmed") {
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
    ? "Captain Score"
    : measures[measureKey]?.label || titleFromSnake(measureKey);

  return `
    <div class="qa-panel qa-panel--${status}">
      <div class="qa-panel__header">
        <div>
          <strong>${escapeHtml(qaStatusLabel(status))}</strong>
          <span>${escapeHtml(`${fixtureNote} · ${measureLabel} · ${trustMode.label} confidence mode`)}</span>
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
  return `${mode.label} confidence`;
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
    failures.push(`data confidence below ${mode.minDataConfidence}`);
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
    parts.push(`Data check ${sign}${displayNumber(Math.abs(breakdown.qa_penalty))}`);
  }

  if (breakdown.strict_failure_penalty >= 0.05) {
    parts.push(`Safety -${displayNumber(breakdown.strict_failure_penalty)}`);
  }

  if (breakdown.trust_boost >= 0.05) {
    parts.push(`Boost +${displayNumber(breakdown.trust_boost)}`);
  }

  if (parts.length === 1) {
    parts.push("No data-check adjustment");
  }

  return parts.join(" · ");
}

function scoreBreakdownHtml(player, measure = activeMeasure(), mode = activeTrustMode()) {
  const breakdown = recommendationScoreBreakdown(player, measure, mode);
  const title = [
    `${breakdown.measure_label} after ${mode.label} confidence mode`,
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
  return `${trustModeLabel(mode)}: ${mode.description}`;
}

function renderTrustModeSummary() {
  if (trustModeSummary) {
    trustModeSummary.textContent = trustModeSummaryText();
  }
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

function playerRecommendationLabels(player, measureKey = measureKeyForTrust(activeMeasure())) {
  const labels = [];
  const startProbability = scoreValue(player, "start_probability_percent");
  const risk = scoreValue(player, "finance_composite_risk_score", "risk_composite_score");
  const tailRisk = scoreValue(player, "finance_tail_risk_score", "risk_tail_score");
  const qaStatus = qaStatusFromFlags(qaFlagsForPlayer(player, measureKey));

  if (player.recommendation_tier_label) {
    labels.push({ text: player.recommendation_tier_label, kind: "neutral" });
  }

  if (scoreValue(player, "finance_strategy_safe_floor") >= 75 && risk <= 45 && startProbability >= 65) {
    labels.push({ text: "Safe pick", kind: "safe" });
  }

  if (scoreValue(player, "finance_strategy_upside") >= 75 || scoreValue(player, "finance_upside_p90_percentile") >= 75) {
    labels.push({ text: "Upside pick", kind: "upside" });
  }

  if (scoreValue(player, "finance_strategy_attack_heavy", "attack_score") >= 75) {
    labels.push({ text: "Attack-heavy pick", kind: "attack" });
  }

  if (scoreValue(player, "finance_strategy_defensive_heavy", "defense_score") >= 75) {
    labels.push({ text: "Defensive-heavy pick", kind: "defense" });
  }

  if (scoreValue(player, "finance_strategy_very_risky") >= 70 || tailRisk >= 70) {
    labels.push({ text: "Very risky", kind: "risk" });
  }

  if (startProbability < 35 || player.finance_label === "avoid_for_now") {
    labels.push({ text: "Avoid/watchlist", kind: "watch" });
  }

  if (value(player.data_confidence_score) < 50 || recommendationUseForPlayer(player) !== "safe_to_rank") {
    labels.push({ text: "Data review", kind: "watch" });
  }

  if (player.roster_status && player.roster_status !== "confirmed") {
    labels.push({ text: "Roster watch", kind: "watch" });
  }

  if (qaStatus !== "pass") {
    labels.push({ text: qaStatusLabel(qaStatus), kind: qaStatus });
  }

  const seen = new Set();
  return labels.filter((label) => {
    const key = `${label.kind}:${label.text}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function profileIdentityGrid(player) {
  return `
    <div class="profile-grid">
      ${profileMetric("Country", playerCountryText(player), `Group ${displayDetailValue(player.group, "?")}`)}
      ${profileMetric("Position", player.position, player.position_code || "")}
      ${profileMetric("Club", player.club, player.league || "")}
      ${profileMetric("Roster", titleFromSnake(player.roster_status), recommendationUseForPlayer(player))}
      ${profileMetric("Budget Price", playerPriceDetailText(player), player.price_note || "Official price pending")}
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
  const context = previewFinanceContext(player);
  const premiumSqueeze = financeContextScore(player, "premium_squeeze_score");
  const previewFinanceMetrics = Object.keys(context).length ? `
      ${profileMetric("Undervalued Assets", profileScore(financeContextScore(player, "finance_alpha_score")), "price/risk edge")}
      ${profileMetric("Portfolio Fit", profileScore(financeContextScore(player, "portfolio_fit_score")), "squad fit")}
      ${profileMetric("Bad-Week Floor", profileScore(Number.isFinite(financeContextScore(player, "downside_risk_score")) ? 100 - financeContextScore(player, "downside_risk_score") : null), "higher is safer")}
      ${profileMetric("Portfolio Health", profileScore(Number.isFinite(financeContextScore(player, "volatility_score")) ? 100 - financeContextScore(player, "volatility_score") : null), "steadiness")}
      ${profileMetric("Role Stability", profileScore(financeContextScore(player, "role_stability_score")), "0 low, 100 high")}
      ${profileMetric("Budget Pressure", profileScore(Number.isFinite(premiumSqueeze) ? 100 - premiumSqueeze : null), "higher is easier to justify")}
  ` : "";

  return `
    <div class="profile-grid profile-grid--finance">
      ${previewFinanceMetrics}
      ${profileMetric("Expected Return", profileScore(scoreValue(player, "finance_expected_return_points")), "points")}
      ${profileMetric("Points After Risk", profileScore(scoreValue(player, "finance_risk_adjusted_return_points")), "points")}
      ${profileMetric("Bad-Week Floor", profileScore(scoreValue(player, "finance_var10_points")), "bad-outcome floor")}
      ${profileMetric("Worst-Case Floor", profileScore(scoreValue(player, "finance_cvar20_points")), "worst-case basket")}
      ${profileMetric("Risk Efficiency", profileScore(scoreValue(player, "finance_sharpe_like_percentile", "risk_adjusted_sharpe_like")), "percentile")}
      ${profileMetric("Downside Protection", profileScore(scoreValue(player, "finance_sortino_like_percentile", "risk_adjusted_sortino_like")), "percentile")}
      ${profileMetric("Upside Balance", profileScore(scoreValue(player, "finance_omega_like_percentile")), "percentile")}
      ${profileMetric("Bad-Week Probability", profilePercent(player.finance_bad_week_probability), "prototype")}
      ${profileMetric("Tail Risk", profileScore(scoreValue(player, "finance_tail_risk_score", "risk_tail_score")), "0 low, 100 high")}
      ${profileMetric("Composite Risk", profileScore(scoreValue(player, "finance_composite_risk_score", "risk_composite_score")), "0 low, 100 high")}
      ${profileMetric("Upside Per 90", profileScore(scoreValue(player, "finance_upside_p90_points", "euro_style_points_per90_estimate")), "points")}
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
    return "Confirm player availability in the official FIFA game before locking.";
  }

  if (normalized.includes("not final public")) {
    return "Refresh with the official data monitor before major recommendation changes.";
  }

  if (normalized.includes("not team builder")) {
    return "Use Team Builder as planning help and verify squad legality in the official FIFA game.";
  }

  if (
    (normalized.includes("official rules") && normalized.includes("manual")) ||
    normalized.includes("rules manual review")
  ) {
    return "Confirm boosters, deadlines, and scoring details in the official FIFA game.";
  }

  if (normalized.includes("squad staging") || normalized.includes("squad review rows")) {
    return "Confirm squad status in the official FIFA game before the deadline.";
  }

  if (normalized.includes("mystery booster")) {
    return "Confirm Mystery Booster details in the official FIFA game.";
  }

  if (normalized.includes("deadline semantics")) {
    return "Confirm deadline timing in the official FIFA game.";
  }

  if (normalized.includes("high team context uncertainty")) {
    return "Team context still needs matchday confirmation.";
  }

  if (normalized.includes("missing national team usage review")) {
    return "National-team usage should be checked before relying heavily on this pick.";
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
  const modeLabel = candidate.mode_label || player.preview_mode_label || titleFromSnake(mode);
  const projected = projectedMatchdayPoints(player);
  const captain = fantasyPoolCandidateStat(player, "captain_score");
  const ceiling = fantasyPoolCandidateStat(player, "ceiling_points");
  const floor = fantasyPoolCandidateStat(player, "floor_points");
  const startProbability = Number(candidate.start_probability);
  const confidence = candidate.projection_confidence || player.data_confidence_band;
  const startText = Number.isFinite(startProbability)
    ? ` with ${Math.round(startProbability * 100)}% start chance`
    : "";
  const projection = activeProjection(player);
  const scopeMatchdayId = projection?.matchday_id || candidate.matchday || activeMatchdayId;
  const isGroupStageScope = !projection && scopeMatchdayId === "group_stage_full";
  const fixtureCount = Number(candidate.fixture_context?.fixture_count);
  const scopeText = isGroupStageScope
    ? `projected points across the group stage (${Number.isFinite(fixtureCount) && fixtureCount > 0 ? fixtureCount : 3} matches)`
    : `projected points for ${matchdayLabelFromId(scopeMatchdayId)}`;
  const fixture = pickFixtureLabel(player);
  const fixtureText = fixture && !fixture.toLowerCase().includes("needs check")
    ? `Score predictions: ${fixture}.`
    : "";
  const reasons = [];

  if (mode === "captain") {
    reasons.push(`${modeLabel}: ${captain} captain signal and ${projected} ${scopeText}${startText}.`);
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

  if (confidence) {
    reasons.push(`${titleFromSnake(confidence)} projection confidence in the current data.`);
  }

  return reasons;
}

function profileWhyPickPanel(player) {
  const previewPickReasons = player.preview_candidate
    ? publicFantasyPickReasonItems(player)
    : player.preview_why_pick;
  const previewCarefulReasons = player.preview_why_careful || player.preview_candidate?.why_careful;
  const defaultPick = player.short_reason || styleReason(player, measureKeyForTrust(activeMeasure()));
  const risk = scoreValue(player, "finance_composite_risk_score", "risk_composite_score");
  const start = scoreValue(player, "start_probability_percent");
  const defaultCareful = risk >= 65
    ? `Risk is elevated at ${displayNumber(risk)}, so check role and matchup before relying on him.`
    : start < 45
      ? `Start probability is only ${displayNumber(start)}%, so confirm role news before locking him in.`
      : "Final squad status and matchday role still need manual confirmation.";

  return `
    <div class="profile-reason-grid">
      <article class="profile-reason-card profile-reason-card--pick">
        <h4>Why Pick Him</h4>
        <ul>${previewListItems(previewPickReasons, defaultPick)}</ul>
      </article>
      <article class="profile-reason-card profile-reason-card--careful">
        <h4>Why Be Careful</h4>
        <ul>${previewListItems(previewCarefulReasons, defaultCareful)}</ul>
      </article>
    </div>
  `;
}

function profileBestUseGrid(player, measureKey = measureKeyForTrust(activeMeasure())) {
  const risk = scoreValue(player, "finance_composite_risk_score", "risk_composite_score");
  const start = scoreValue(player, "start_probability_percent");
  const expected = scoreValue(player, "finance_risk_adjusted_return_points", "risk_adjusted_expected_points_estimate");
  const captain = scoreValue(player, "finance_captain_score");
  const strategy = measures[measureKey]?.label || titleFromSnake(measureKey);
  const bestUse = measureKey === "captain" || captain >= 70
    ? "Captain shortlist"
    : measureKey === "safe" || (risk <= 45 && start >= 65)
      ? "Safe starter"
      : measureKey === "upside"
        ? "Upside swing"
        : measureKey === "differential"
          ? "Differential watch"
          : "Balanced pick";

  return `
    <div class="profile-grid profile-grid--compact">
      ${profileMetric("Best Use", bestUse, strategy)}
      ${profileMetric("Projected Pts / Matchday", profileScore(expected), projectionContextText(player))}
      ${profileMetric("Risk Label", pickRiskLabel(player), `${displayNumber(risk)} risk score`)}
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

function profileFixtureRows(player) {
  const projections = playerMatchdayProjections(player);

  if (!projections.length) {
    return `
      <tr class="fallback-table-row">
        <td colspan="8">No matchday fixture projections are available for this player yet.</td>
      </tr>
    `;
  }

  return projections.map((projection) => `
    <tr class="${projection.matchday_id === activeMatchdayId ? "is-active-fixture" : ""}">
      <td>
        <strong>${escapeHtml(projection.matchday_label)}</strong>
        <small>${escapeHtml(projection.eastern_datetime_label || projection.date || "")}</small>
      </td>
      <td>
        <strong>${escapeHtml(projection.opponent)}</strong>
        <small>${escapeHtml(projection.city || "")}</small>
      </td>
      <td>
        <strong>${escapeHtml(fixtureDifficultyLabel(projection.fixture_difficulty_band))}</strong>
        <small>${profileScore(projection.fixture_difficulty_score)}</small>
      </td>
      <td>${profileScore(projection.team_expected_goals)}</td>
      <td>${profileScore(projection.team_expected_goals_against)}</td>
      <td>${profilePercent(projection.team_clean_sheet_probability)}</td>
      <td>${profilePercent(projection.match_upset_risk_probability)}</td>
      <td>${escapeHtml(titleFromSnake(projection.fixture_use))}</td>
    </tr>
  `).join("");
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
    return "<li>No extra data quality notes are available yet.</li>";
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
  const strategyTags = [
    profileTag(titleFromSnake(player.finance_label), "neutral"),
    profileTag(titleFromSnake(player.portfolio_use), "neutral"),
    profileTag(titleFromSnake(player.risk_profile), "neutral"),
    profileTag(titleFromSnake(player.value_role), "neutral")
  ].join("");

  playerDetailTitle.textContent = player.name;
  playerDetailSubtitle.textContent = `${playerCountryText(player)} · ${player.position} · ${player.club || "club needs check"} · ${player.league || "league needs check"}`;
  playerDetailBody.innerHTML = `
    <div class="profile-tags">
      ${recommendationTags}
    </div>

    ${profileBuilderActionHtml(player)}

    <section class="profile-section">
      <h3>Why Pick Him</h3>
      ${profileWhyPickPanel(player)}
    </section>

    <section class="profile-section">
      <h3>Best Use</h3>
      ${profileBestUseGrid(player, measureKey)}
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
                <th>Difficulty</th>
                <th>Team xG</th>
                <th>xGA</th>
                <th>Clean Sheet</th>
                <th>Upset Risk</th>
                <th>Use</th>
              </tr>
            </thead>
            <tbody>${profileFixtureRows(player)}</tbody>
          </table>
        </div>
      </div>
    </details>

    <section class="profile-section">
      <h3>Fantasy Finance</h3>
      ${profileFinanceGrid(player)}
    </section>

    <section class="profile-section">
      <h3>Data Checks</h3>
      ${profileQaPanel(player, measureKey)}
    </section>

    <details class="profile-section profile-section--advanced">
      <summary>Advanced player details</summary>
      <div class="profile-advanced-body">
        <div class="profile-tags">
          ${strategyTags}
        </div>
        <section class="profile-section">
          <h3>Identity</h3>
          ${profileIdentityGrid(player)}
        </section>
        <section class="profile-section">
          <h3>Role Model</h3>
          ${profileRoleGrid(player)}
        </section>
        <section class="profile-section">
          <h3>Performance Signals</h3>
          ${profilePerformanceGrid(player)}
        </section>
      </div>
    </details>

    <section class="profile-section">
      <h3>Data Quality Notes</h3>
      <ul class="profile-notes">
        ${profileNotesList(player)}
      </ul>
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
    { value: "upset_risk", label: "Upset Risk" },
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
    matchEnvironmentSummary.textContent = "Score prediction data is not loaded.";
    matchEnvironmentTableBody.innerHTML = `
      <tr>
        <td colspan="6">Score prediction data is not loaded yet.</td>
      </tr>
    `;
    return;
  }

  const rows = scorePredictionRowsForFilters();
  const visibleRows = rows.slice(0, 12);
  const totalGoals = rows.reduce((sum, row) => sum + value(row.total_expected_goals), 0);
  const averageGoals = rows.length ? totalGoals / rows.length : 0;
  const cleanSheetRows = rows.filter((row) => strongestCleanSheetTeam(row).probability >= 0.48).length;
  const upsetRows = rows.filter((row) => value(row.upset_risk_probability) >= 0.18).length;
  const qualityLabel = scorePredictionQualityLabel();
  const qualityDetail = scorePredictionQualityDetail();

  matchEnvironmentSummary.innerHTML = `
    <span><strong>${visibleRows.length}</strong> shown of ${rows.length} fixtures</span>
    <span><strong>${displayNumber(averageGoals)}</strong> avg total xG</span>
    <span><strong>${cleanSheetRows}</strong> clean-sheet watches</span>
    <span><strong>${upsetRows}</strong> upset-risk watches</span>
    ${qualityLabel ? `<span title="${escapeHtml(qualityDetail)}"><strong>${escapeHtml(qualityLabel)}</strong> model check</span>` : ""}
  `;

  if (!visibleRows.length) {
    matchEnvironmentTableBody.innerHTML = `
      <tr>
        <td colspan="6">No fixtures match this environment filter.</td>
      </tr>
    `;
    return;
  }

  matchEnvironmentTableBody.innerHTML = visibleRows.map((row) => {
    const cleanSheet = strongestCleanSheetTeam(row);
    const topScoreline = row.top_scoreline
      ? `${row.top_scoreline} (${percentText(row.top_scoreline_probability)})`
      : "needs check";

    return `
      <tr>
        <td>
          <strong>${row.home_team} vs ${row.away_team}</strong>
          <small>Group ${row.group} · ${matchdayLabelFromId(row.fantasy_matchday_id)} · ${row.eastern_datetime_label || row.date}</small>
        </td>
        <td>
          <strong>${displayNumber(row.home_expected_goals)} - ${displayNumber(row.away_expected_goals)}</strong>
          <small>Top score: ${topScoreline}</small>
        </td>
        <td>
          <strong>${row.favorite_team}</strong>
          <small>${percentText(row.favorite_win_probability)} win</small>
        </td>
        <td>
          <strong>${cleanSheet.team}</strong>
          <small>${percentText(cleanSheet.probability)}</small>
        </td>
        <td>
          <strong>${goalEnvironmentLabel(row.goal_environment)}</strong>
          <small>Over 2.5: ${percentText(row.over_2_5_goals_probability)}</small>
        </td>
        <td>
          <strong>${titleFromSnake(row.upset_risk_band)}</strong>
          <small>${percentText(row.upset_risk_probability)}</small>
        </td>
      </tr>
    `;
  }).join("");
}

function measureFromSelect(selectElement) {
  return measures[selectElement.value] || measures.balanced;
}

function activeMeasure() {
  return measureFromSelect(measureSelect);
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
    ? `${activeMeasure().label} Score`
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
  return countryKey === "needs_check" ? "Needs check" : countryKey;
}

function playerCountryText(player) {
  return countryCountLabel(playerCountryKey(player));
}

function playerSearchText(player) {
  return `${player.name} ${player.club} ${player.country} ${playerCountryText(player)} ${player.position}`.toLowerCase();
}

function topByPosition(position, measure) {
  return sortPlayers(players.filter((player) => player.position === position), measure)[0];
}

function playerById(playerId) {
  return fantasyPoolPreviewPlayerById.get(playerId) || players.find((player) => player.id === playerId);
}

function captainChangeMatchdayIds() {
  return matchdayOptions
    .map((option) => option.matchday_id)
    .filter((matchdayId) => ["md1", "md2", "md3"].includes(matchdayId));
}

function captainChangePlayerLabel(player) {
  return `${player.name} | ${playerCountryText(player)} | ${player.position} | ${player.club || "Club needs check"}`;
}

function renderCaptainChangeOptions() {
  const matchdaySelects = [matchdayDecisionMatchdaySelect, captainChangeMatchdaySelect, substitutionAdvisorMatchdaySelect].filter(Boolean);
  const playerLists = [captainChangePlayerList, substitutionAdvisorPlayerList].filter(Boolean);

  if (!matchdaySelects.length || !playerLists.length) {
    return;
  }

  const matchdayIds = captainChangeMatchdayIds();
  const matchdayHtml = matchdayIds
    .map((matchdayId) => `<option value="${matchdayId}">${escapeHtml(matchdayLabelFromId(matchdayId))}</option>`)
    .join("");

  matchdaySelects.forEach((select) => {
    const previousValue = select.value;
    select.innerHTML = matchdayHtml;
    select.value = matchdayIds.includes(previousValue) ? previousValue : matchdayIds[0] || "md1";
  });

  captainChangePlayerLabelLookup.clear();
  const optionHtml = [...players]
    .sort((a, b) => a.name.localeCompare(b.name) || playerCountryText(a).localeCompare(playerCountryText(b)))
    .map((player) => {
      const label = captainChangePlayerLabel(player);
      captainChangePlayerLabelLookup.set(label.toLowerCase(), player);
      return `<option value="${escapeHtml(label)}"></option>`;
    })
    .join("");
  playerLists.forEach((list) => {
    list.innerHTML = optionHtml;
  });
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
    ? "No browser-saved squad yet. Save this squad here for quick Matchday Desk access."
    : "Browser save is empty. Build a full squad, then save it here for quick Matchday Desk access.";
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
  if (matchdayDecisionMatchdaySelect) matchdayDecisionMatchdaySelect.value = captainChangeMatchdayIds()[0] || "md1";
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

  if (!projection) {
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

  const matchdayId = captainChangeMatchdaySelect?.value || "md1";
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

  const matchdayId = substitutionAdvisorMatchdaySelect?.value || "md1";
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
        <a class="matchday-desk-button matchday-desk-button--primary" href="#team-builder">Build My Squad</a>
        <button class="matchday-desk-button" type="button" data-matchday-desk-action="load-saved-squad" ${hasSavedSquad ? "" : "disabled"}>Load Saved Squad</button>
      </div>
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
  if (!projection) {
    return {
      label: "Needs projection",
      className: "review",
      detail: "No matchday projection is available for this captain option.",
      edge: null,
      threshold: null,
      warnings: ["No matchday projection is available for this captain option."]
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
  if (!projection) {
    return {
      label: "Needs projection",
      className: "review",
      detail: "No matchday projection is available for this bench option.",
      edge: null,
      threshold: null,
      warnings: ["No matchday projection is available for this bench option."]
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
      const score = projection ? captainChangeProjectionScore(projection, mode) : -Infinity;
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
      const score = projection ? substitutionAdvisorProjectionScore(projection, mode) : -Infinity;
      const verdict = matchdayDecisionSubstitutionVerdict(starter, player, projection, score, starterPoints, mode, matchdayId);
      return { player, projection, score, verdict, rank: benchOrderRank(player.id, bench) };
    });
}

function renderMatchdayDecisionCaptainCard(row, currentCaptain, captainPoints, mode) {
  const startProbability = row.projection
    ? fieldNumber(row.projection, "start_probability_percent") ?? scoreValue(row.player, "start_probability_percent")
    : null;
  const expectedMinutes = row.projection
    ? fieldNumber(row.projection, "expected_minutes_v0") ?? scoreValue(row.player, "expected_minutes_v0")
    : null;
  const edgeText = row.verdict.edge === null ? "Needs points" : `${displayNumber(row.verdict.edge)} edge`;
  const thresholdText = row.verdict.threshold === null ? mode.label : `threshold ${displayNumber(row.verdict.threshold)}`;

  return `
    <article class="matchday-decision-card matchday-decision-card--${row.verdict.className}">
      <div class="matchday-decision-card__top">
        <div>
          <strong>${escapeHtml(row.player.name)}</strong>
          <small>${escapeHtml(userSelectionContextLabel(row.player))} · ${escapeHtml(playerCountryText(row.player))} · vs ${escapeHtml(row.projection?.opponent || "projection needs check")}</small>
        </div>
        <span>${escapeHtml(row.verdict.label)}</span>
      </div>
      <p>${escapeHtml(row.verdict.detail)}</p>
      <div class="matchday-decision-metrics">
        ${matchdayDecisionMetric("Captain signal", row.score === -Infinity ? "N/A" : displayNumber(row.score), edgeText)}
        ${matchdayDecisionMetric("Strategy", mode.label, thresholdText)}
        ${matchdayDecisionMetric("Start", startProbability === null ? "N/A" : `${displayNumber(startProbability)}%`, expectedMinutes === null ? "minutes N/A" : `${displayNumber(expectedMinutes)} min`)}
      </div>
      ${matchdayDecisionWarningHtml(row.verdict.warnings)}
      <button class="matchday-decision-button" type="button" data-decision-center-action="captain-fill" data-player-id="${escapeHtml(row.player.id)}" ${currentCaptain ? "" : "disabled"}>${captainPoints.isValid ? "Fill Captain Check" : "Fill Captain Fields"}</button>
    </article>
  `;
}

function renderMatchdayDecisionBenchCard(row, starter, starterPoints, mode) {
  const startProbability = row.projection
    ? fieldNumber(row.projection, "start_probability_percent") ?? scoreValue(row.player, "start_probability_percent")
    : null;
  const expectedMinutes = row.projection
    ? fieldNumber(row.projection, "expected_minutes_v0") ?? scoreValue(row.player, "expected_minutes_v0")
    : null;
  const edgeText = row.verdict.edge === null ? "Needs points" : `${displayNumber(row.verdict.edge)} edge`;
  const thresholdText = row.verdict.threshold === null ? mode.label : `threshold ${displayNumber(row.verdict.threshold)}`;

  return `
    <article class="matchday-decision-card matchday-decision-card--${row.verdict.className}">
      <div class="matchday-decision-card__top">
        <div>
          <strong>${escapeHtml(row.player.name)}</strong>
          <small>Bench ${row.rank || "?"} · ${escapeHtml(playerCountryText(row.player))} · ${escapeHtml(row.player.position)} · vs ${escapeHtml(row.projection?.opponent || "projection needs check")}</small>
        </div>
        <span>${escapeHtml(row.verdict.label)}</span>
      </div>
      <p>${escapeHtml(row.verdict.detail)}</p>
      <div class="matchday-decision-metrics">
        ${matchdayDecisionMetric("Sub signal", row.score === -Infinity ? "N/A" : displayNumber(row.score), edgeText)}
        ${matchdayDecisionMetric("Strategy", mode.label, thresholdText)}
        ${matchdayDecisionMetric("Start", startProbability === null ? "N/A" : `${displayNumber(startProbability)}%`, expectedMinutes === null ? "minutes N/A" : `${displayNumber(expectedMinutes)} min`)}
      </div>
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
  renderMatchdayDecisionStarterOptions(starters);

  if (!isFull) {
    matchdayDecisionCenterContent.innerHTML = matchdayDecisionEmptyHtml();
    return;
  }

  const matchdayId = matchdayDecisionMatchdaySelect?.value || captainChangeMatchdayIds()[0] || "md1";
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
        ${captainRowsToShow.map((row) => renderMatchdayDecisionCaptainCard(row, currentCaptain, captainPoints, captainMode)).join("")}
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
        ${benchRowsToShow.map((row) => renderMatchdayDecisionBenchCard(row, playedStarter, starterPoints, substitutionMode)).join("")}
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
    : matchdayIds[0] || "md1";
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
  if (!projection) {
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

  if (!projection) {
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
  const captainSignal = projection
    ? captainChangeProjectionScore(projection, captainChangeRiskModes.balanced)
    : null;
  const substitutionSignal = projection
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
    startProbability: projection
      ? fieldNumber(projection, "start_probability_percent") ?? scoreValue(player, "start_probability_percent")
      : scoreValue(player, "start_probability_percent"),
    expectedMinutes: projection
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
  const opponent = projection?.opponent || "Opponent needs check";
  const difficulty = projection ? fixtureDifficultyLabel(projection.fixture_difficulty_band) : "Difficulty needs check";
  const kickoff = projection?.eastern_datetime_label || projection?.date || "Timing needs check";
  const captainSignal = row.captainSignal === null ? "N/A" : displayNumber(row.captainSignal);
  const substitutionSignal = row.substitutionSignal === null ? "N/A" : displayNumber(row.substitutionSignal);

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
      ${timelineActionButtons(row)}
    </article>
  `;
}

function renderSavedSquadTimeline() {
  if (!savedSquadTimelineContent) {
    return;
  }

  const matchdayId = savedSquadTimelineMatchdaySelect?.value || captainChangeMatchdayIds()[0] || "md1";
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
    : matchdayIds[0] || "md1";
}

function handleSavedSquadTimelineClick(event) {
  const button = event.target.closest("[data-timeline-fill][data-player-id]");

  if (!button) {
    return;
  }

  const player = playerById(button.dataset.playerId);
  const matchdayId = button.dataset.matchdayId || savedSquadTimelineMatchdaySelect?.value || "md1";

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
  const matchdayId = matchdayDecisionMatchdaySelect?.value || "md1";
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
  const matchdayId = matchdayDecisionMatchdaySelect?.value || "md1";
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
  return matchdayProjectionLookup.get(player?.id)?.[matchdayId] || null;
}

function withTemporaryMatchday(matchdayId, callback) {
  const previousMatchdayId = activeMatchdayId;
  activeMatchdayId = matchdayId;
  try {
    return callback();
  } finally {
    activeMatchdayId = previousMatchdayId;
  }
}

function captainChangeMode() {
  return captainChangeRiskModes[captainChangeRiskSelect?.value] || captainChangeRiskModes.balanced;
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
    warnings.push("Data-check review flags are active for this matchday.");
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
  if (!projection) {
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
    "Enter captain points and one unplayed replacement, then run the check.",
    "Latest captain check will be included in Team Export JSON."
  );
  renderDecisionToolStatus(
    substitutionAdvisorStatus,
    lastSubstitutionDecision,
    "Enter the starter score and one unplayed bench option, then run the check.",
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
    note: `Imported saved ${toolLabel} scenario. Review the restored fields and rerun the advisor before acting; live points, played/unplayed status, and official-game legality are not verified.`
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

  const matchdayId = captainChangeMatchdaySelect?.value || decision.selected_matchday_id || "md1";
  captainChangeResult.className = "captain-change-result captain-change-result--review";
  captainChangeResult.innerHTML = `
    <div class="captain-change-verdict">
      <span class="captain-change-badge">Imported</span>
      <strong>Imported saved captain check</strong>
    </div>
    <div class="captain-change-import-warning">Rerun this advisor before acting. Imported checks do not verify live points, played/unplayed status, deadlines, or official-game legality.</div>
    <p>Restored ${escapeHtml(candidate.name)} as the replacement captain with ${displayNumber(points)} points kept from ${escapeHtml(currentPlayer?.name || "the current captain")}. This is imported context, not a fresh live recommendation. Click Check Switch to recalculate before acting.</p>
    <div class="captain-change-metrics">
      ${importedDecisionMetric("Imported result", decision.result || "Needs rerun", decision.result_class || "review")}
      ${importedDecisionMetric("Matchday", matchdayLabelFromId(matchdayId), decision.risk_style_label || decision.risk_style || "strategy needs check")}
      ${importedDecisionMetric("Old switch score", decision.switch_score, `threshold ${decision.switch_threshold ?? "N/A"}`)}
      ${importedDecisionMetric("Saved at", decision.saved_at ? new Date(decision.saved_at).toLocaleString() : "N/A", "from imported file")}
    </div>
    <p>Played/unplayed state, official deadlines, and squad legality are still manual checks.</p>
  `;
}

function renderImportedSubstitutionDecision(decision, starter, benchPlayer, points) {
  if (!substitutionAdvisorResult) {
    return;
  }

  const matchdayId = substitutionAdvisorMatchdaySelect?.value || decision.selected_matchday_id || "md1";
  substitutionAdvisorResult.className = "captain-change-result substitution-advisor-result captain-change-result--review";
  substitutionAdvisorResult.innerHTML = `
    <div class="captain-change-verdict">
      <span class="captain-change-badge">Imported</span>
      <strong>Imported saved substitution check</strong>
    </div>
    <div class="captain-change-import-warning">Rerun this advisor before acting. Imported checks do not verify live points, played/unplayed status, deadlines, or formation legality.</div>
    <p>Restored ${escapeHtml(benchPlayer.name)} as the bench candidate against ${displayNumber(points)} points from ${escapeHtml(starter?.name || "the played starter")}. This is imported context, not a fresh live recommendation. Click Check Sub to recalculate before acting.</p>
    <div class="captain-change-metrics">
      ${importedDecisionMetric("Imported result", decision.result || "Needs rerun", decision.result_class || "review")}
      ${importedDecisionMetric("Matchday", matchdayLabelFromId(matchdayId), decision.risk_style_label || decision.risk_style || "strategy needs check")}
      ${importedDecisionMetric("Old sub score", decision.substitution_score, `threshold ${decision.substitution_threshold ?? "N/A"}`)}
      ${importedDecisionMetric("Saved at", decision.saved_at ? new Date(decision.saved_at).toLocaleString() : "N/A", "from imported file")}
    </div>
    <p>Played/unplayed state, official deadlines, and formation legality are still manual checks.</p>
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
    warnings.push("Imported captain check was skipped because the replacement captain is missing from the current player data.");
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
    warnings.push("Imported substitution check was skipped because the bench candidate is missing from the current player data.");
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

  const matchdayId = captainChangeMatchdaySelect?.value || "md1";
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
      <strong>Choose a replacement captain from the player list.</strong>
      <p>The replacement should be a player in your squad who has not played yet in ${escapeHtml(matchdayLabelFromId(matchdayId))}.</p>
    `;
    return;
  }

  const projection = projectionForMatchday(candidate, matchdayId);

  if (!projection) {
    lastCaptainChangeDecision = {
      model_version: "captain_change_advisor_v0",
      scope: "quick_manual_switch_check",
      ...savedDecisionBase("Captain Change Advisor", matchdayId, riskStyle, mode, "Needs check", "review", [
        "No matchday projection is available for the replacement candidate."
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
        <span class="captain-change-badge">Needs check</span>
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
    verdict = "Needs check";
    resultClass = "review";
    explanation = "Choose a different replacement before making a switch decision.";
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
  const qaHtml = withTemporaryMatchday(matchdayId, () => qaChipRow(qaFlagsForPlayer(candidate, "captain"), { compact: true, maxVisible: 4 }));
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
    <p>${escapeHtml(explanation)} Keeping ${escapeHtml(currentName)} keeps a ${displayNumber(currentPoints)} captain score before the double; switching needs the new captain to beat that by enough for your selected strategy.${escapeHtml(currentScoreContext)}</p>
    <div class="captain-change-metrics">
      ${captainChangeMetric("Current points", displayNumber(currentPoints), currentName)}
      ${captainChangeMetric(mode.projectionLabel, displayNumber(comparisonScore), `${displayNumber(edge)} vs current`)}
      ${captainChangeMetric("Projection / floor", `${displayNumber(scoreParts.rawExpected)} / ${displayNumber(scoreParts.rawFloor)}`, `${displayNumber(scoreParts.rawUpside)} upside signal`)}
      ${captainChangeMetric("Fixture", `${projection.opponent} · ${fixtureDifficulty === null ? "Needs check" : displayNumber(fixtureDifficulty)}`, `${displayNumber(startProbability)}% start · ${displayNumber(expectedMinutes)} min`)}
    </div>
    ${warningHtml}
    ${qaHtml}
    <p>${escapeHtml(matchdayLabelFromId(matchdayId))} model context: ${escapeHtml(singleFixtureModelReason(projection, "attack").trim())}</p>
    <p>This latest captain check will be included in Team Export JSON until it is reset or replaced.</p>
  `;
}

function resetCaptainChangeAdvisor() {
  lastCaptainChangeDecision = null;
  renderDecisionToolStatuses();
  if (captainChangeCurrentPlayerInput) captainChangeCurrentPlayerInput.value = "";
  if (captainChangeCurrentPointsInput) captainChangeCurrentPointsInput.value = "";
  if (captainChangeCandidateInput) captainChangeCandidateInput.value = "";
  if (captainChangeRiskSelect) captainChangeRiskSelect.value = "balanced";
  if (captainChangeMatchdaySelect) captainChangeMatchdaySelect.value = captainChangeMatchdayIds()[0] || "md1";

  if (captainChangeResult) {
    captainChangeResult.className = "captain-change-result captain-change-result--empty";
    captainChangeResult.innerHTML = `
      <strong>Enter a current captain score and a replacement captain.</strong>
      <p>The replacement should be in your squad and still unplayed in the selected matchday.</p>
    `;
  }
}

function substitutionAdvisorMode() {
  return substitutionAdvisorRiskModes[substitutionAdvisorRiskSelect?.value] || substitutionAdvisorRiskModes.balanced;
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
    warnings.push("Data-check review flags are active for this matchday.");
  }

  return warnings;
}

function renderSubstitutionAdvisor(event) {
  event?.preventDefault();

  if (!substitutionAdvisorResult) {
    return;
  }

  const matchdayId = substitutionAdvisorMatchdaySelect?.value || "md1";
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
      <strong>Enter the played starter's points.</strong>
      <p>Use the actual fantasy score before deciding whether a bench player is worth bringing in.</p>
    `;
    return;
  }

  if (!benchPlayer) {
    lastSubstitutionDecision = null;
    renderDecisionToolStatuses();
    substitutionAdvisorResult.className = "captain-change-result substitution-advisor-result captain-change-result--empty";
    substitutionAdvisorResult.innerHTML = `
      <strong>Choose a bench player from the player list.</strong>
      <p>The bench player should be in your squad and still unplayed in ${escapeHtml(matchdayLabelFromId(matchdayId))}.</p>
    `;
    return;
  }

  const projection = projectionForMatchday(benchPlayer, matchdayId);

  if (!projection) {
    lastSubstitutionDecision = {
      model_version: "substitution_advisor_v0",
      scope: "quick_manual_substitution_check",
      ...savedDecisionBase("Substitution Advisor", matchdayId, riskStyle, mode, "Needs check", "review", [
        "No matchday projection is available for the bench candidate."
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
        <span class="captain-change-badge">Needs check</span>
        <strong>No matchday projection for ${escapeHtml(benchPlayer.name)}.</strong>
      </div>
      <p>Pick a bench player with a ${escapeHtml(matchdayLabelFromId(matchdayId))} fixture projection before using the sub check.</p>
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
    verdict = "Needs check";
    resultClass = "review";
    explanation = "Choose a different bench player before making a substitution decision.";
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
  const qaHtml = withTemporaryMatchday(matchdayId, () => qaChipRow(qaFlagsForPlayer(benchPlayer, "risk_adjusted"), { compact: true, maxVisible: 4 }));
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
    <p>${escapeHtml(explanation)} Keeping ${escapeHtml(starterName)} keeps ${displayNumber(currentPoints)} points; subbing needs the bench player to beat that by enough for your selected strategy.${escapeHtml(currentScoreContext)}</p>
    <div class="captain-change-metrics">
      ${captainChangeMetric("Starter points", displayNumber(currentPoints), starterName)}
      ${captainChangeMetric(mode.projectionLabel, displayNumber(comparisonScore), `${displayNumber(edge)} vs starter`)}
      ${captainChangeMetric("Projection / floor", `${displayNumber(scoreParts.rawExpected)} / ${displayNumber(scoreParts.rawFloor)}`, `${displayNumber(scoreParts.rawUpside)} upside signal`)}
      ${captainChangeMetric("Fixture", `${projection.opponent} · ${fixtureDifficulty === null ? "Needs check" : displayNumber(fixtureDifficulty)}`, `${displayNumber(startProbability)}% start · ${displayNumber(expectedMinutes)} min`)}
    </div>
    ${warningHtml}
    ${qaHtml}
    <p>${escapeHtml(matchdayLabelFromId(matchdayId))} model context: ${escapeHtml(singleFixtureModelReason(projection, "balanced").trim())}</p>
    <p>This latest substitution check will be included in Team Export JSON until it is reset or replaced.</p>
  `;
}

function resetSubstitutionAdvisor() {
  lastSubstitutionDecision = null;
  renderDecisionToolStatuses();
  if (substitutionAdvisorStarterInput) substitutionAdvisorStarterInput.value = "";
  if (substitutionAdvisorPointsInput) substitutionAdvisorPointsInput.value = "";
  if (substitutionAdvisorBenchInput) substitutionAdvisorBenchInput.value = "";
  if (substitutionAdvisorRiskSelect) substitutionAdvisorRiskSelect.value = "balanced";
  if (substitutionAdvisorMatchdaySelect) substitutionAdvisorMatchdaySelect.value = captainChangeMatchdayIds()[0] || "md1";

  if (substitutionAdvisorResult) {
    substitutionAdvisorResult.className = "captain-change-result substitution-advisor-result captain-change-result--empty";
    substitutionAdvisorResult.innerHTML = `
      <strong>Enter a played starter score and one bench candidate.</strong>
      <p>The bench player should be in your squad and still unplayed in the selected matchday.</p>
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
    return `${context}: strong expected return at ${expected} points, with ${riskAdjusted} after the risk adjustment.${roleSuffix}${overallFixtureText}`;
  }

  if (measureKey === "safe") {
    return `${context}: reliable profile with risk score ${risk}, reliability ${reliability}, and projected points ${expected}.${roleSuffix}${overallFixtureText}`;
  }

  if (measureKey === "upside") {
    return `${context}: high production when on the field, with ${per90} estimated points per 90.${attackFixtureText}`;
  }

  if (measureKey === "minutes") {
    return `${context}: ${roleText || `good reliability score of ${reliability}`}, useful when you want likely playing time.${overallFixtureText}`;
  }

  if (measureKey === "lowTailRisk") {
    return `${context}: looks for lower bad-week risk, with a tail-risk score of ${tailRisk}.${riskFixtureText}`;
  }

  if (measureKey === "sharpe") {
    return `${context}: balances reward against overall volatility, with a Sharpe-style score of ${displayNumber(player.risk_adjusted_sharpe_like)}.${overallFixtureText}`;
  }

  if (measureKey === "sortino") {
    return `${context}: focuses on downside volatility, with a Sortino-style score of ${displayNumber(player.risk_adjusted_sortino_like)}.${riskFixtureText}`;
  }

  if (measureKey === "bestValue") {
    return `${context}: value score ${displayNumber(scoreValue(player, "value_score_v1", "value_score_v0"))} at ${price} budget units, with overpay risk ${overpayRisk}.${roleSuffix}${overallFixtureText}`;
  }

  if (measureKey === "cheapEnabler") {
    return `${context}: cheap-enabler score ${displayNumber(scoreValue(player, "cheap_enabler_score_v1", "cheap_enabler_score"))} at ${price} budget units.${roleSuffix}${overallFixtureText}`;
  }

  if (measureKey === "premiumWorthIt") {
    return `${context}: premium-worth-it score ${displayNumber(scoreValue(player, "premium_worth_it_score_v1", "premium_worth_it_score"))} at ${price} budget units, with overpay risk ${overpayRisk}.${roleSuffix}${overallFixtureText}`;
  }

  if (measureKey === "var10") {
    return `${context}: better bad-outcome floor, with modeled 10th percentile at ${var10} points.${riskFixtureText}`;
  }

  if (measureKey === "cvar20") {
    return `${context}: stronger worst-case basket, with modeled average of the worst 20% at ${cvar20} points.${riskFixtureText}`;
  }

  if (measureKey === "omega") {
    return `${context}: good upside-to-downside balance, with an Omega-style score of ${displayNumber(player.finance_omega_like_percentile)}.${overallFixtureText}`;
  }

  if (measureKey === "attackHeavy") {
    return `${context}: attack-heavy profile with expected return ${expected}, upside per 90 ${per90}, and attack score ${displayNumber(scoreValue(player, "finance_strategy_attack_heavy"))}.${attackFixtureText}`;
  }

  if (measureKey === "defensiveHeavy") {
    return `${context}: defensive-heavy profile with clean-sheet/team defense inputs and a defensive score of ${displayNumber(scoreValue(player, "finance_strategy_defensive_heavy"))}.${defenseFixtureText}`;
  }

  if (measureKey === "veryRisky") {
    return `${context}: boom-or-bust profile with upside per 90 ${per90}, volatility ${displayNumber(scoreValue(player, "finance_volatility_points"))}, and tail risk ${tailRisk}.${riskFixtureText}`;
  }

  return `${context}: good mix of projected points (${expected}), reliability (${reliability}), and risk (${risk}).${roleSuffix}${overallFixtureText}`;
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

function updateRuleCopy() {
  if (heroSquadTotal) {
    heroSquadTotal.textContent = squadTotalPlayers;
  }

  if (heroSquadCopy) {
    heroSquadCopy.textContent = `squad builder with ${benchTotalPlayers}-player bench`;
  }

  if (squadRuleNote) {
    squadRuleNote.textContent = `Full fantasy squad target: ${positionRequirementText()}. Rules loaded from fantasyRules.json.`;
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
  teamExportOutput.value = "";
  teamExportPanel.classList.add("hidden");
  swapMessage.textContent = `Build a full ${squadLabel()} first, then click a starter and a bench player to swap them.`;
  teamMessage.textContent = `Lock a few players first, then click "Build My Squad" to optimize the ${squadLabel()}.`;
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
    summaryParts.push("Needs check players have unverified country data, so they are counted together until the country is confirmed.");
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
  const matchdayIds = activeMatchdayId === "group_stage_full"
    ? ["md1", "md2", "md3"]
    : [activeMatchdayId];

  return matchdayIds.map((matchdayId) => {
    const projections = starters
      .map((player) => matchdayProjectionLookup.get(player.id)?.[matchdayId])
      .filter(Boolean);
    const hardFixtures = projections.filter((projection) => fieldNumber(projection, "fixture_difficulty_score") >= 70).length;
    const favorableFixtures = projections.filter((projection) => fieldNumber(projection, "fixture_difficulty_score") <= 35).length;
    const avgXg = averageProjectionField(projections, "team_expected_goals");
    const avgCleanSheet = averageProjectionField(projections, "team_clean_sheet_probability");

    return {
      matchdayId,
      label: matchdayLabelFromId(matchdayId),
      hardFixtures,
      favorableFixtures,
      avgXg,
      avgCleanSheet
    };
  });
}

function portfolioRiskLevel(analytics) {
  if (
    analytics.qaReviewCount >= 4 ||
    analytics.tailRiskAverage >= 70 ||
    analytics.benchWeakCount >= 3 ||
    analytics.hardestMatchdayHardFixtures >= 5
  ) {
    return { id: "high", label: "High Risk" };
  }

  if (
    analytics.qaReviewCount >= 2 ||
    analytics.tailRiskAverage >= 55 ||
    analytics.benchWeakCount >= 2 ||
    analytics.hardestMatchdayHardFixtures >= 3
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
    scoreValue(player, "expected_minutes_v0") < 30 ||
    qaStatusFromFlags(qaFlagsForPlayer(player, measureKeyForTrust(activeMeasure()))) === "review"
  ).length;
  const premiumPlayers = squad.filter((player) => proxyPrice(player) >= 9.5).length;
  const countryEntries = countryCountEntries(countryCountsFromPlayers(squad));
  const topCountry = countryEntries[0] || ["none", 0];
  const fixtureRows = matchdayFixturePortfolio(starters);
  const hardestMatchday = [...fixtureRows].sort((a, b) => b.hardFixtures - a.hardFixtures)[0] || null;

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
    hardestMatchdayHardFixtures: hardestMatchday?.hardFixtures || 0,
    totalHardFixtureStarters: fixtureRows.reduce((sum, row) => sum + row.hardFixtures, 0),
    totalFavorableFixtureStarters: fixtureRows.reduce((sum, row) => sum + row.favorableFixtures, 0),
    hardestMatchday
  };
}

function portfolioWarningsForAnalytics(analytics) {
  const warnings = [];
  const topCountryLabel = countryCountLabel(analytics.topCountry[0]);
  const topCountryCount = analytics.topCountry[1];

  if (analytics.qaReviewCount > 0) {
    warnings.push({
      kind: analytics.qaReviewCount >= 3 ? "review" : "watch",
      label: "Data Checks",
      detail: `${analytics.qaReviewCount} squad player${analytics.qaReviewCount === 1 ? "" : "s"} need data review and ${analytics.qaWatchCount} carry watch status.`
    });
  }

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
      detail: `${analytics.benchWeakCount} bench player${analytics.benchWeakCount === 1 ? "" : "s"} have low start probability, low expected minutes, or data-check review flags.`
    });
  }

  if (topCountryCount >= groupStageCountryLimit) {
    warnings.push({
      kind: "watch",
      label: "Country Stack Risk",
      detail: `${topCountryLabel} is at the group-stage country limit with ${topCountryCount}/${groupStageCountryLimit} players.`
    });
  }

  if (analytics.hardestMatchdayHardFixtures >= 3) {
    warnings.push({
      kind: "watch",
      label: "Fixture Stack Risk",
      detail: `${analytics.hardestMatchday.label} has ${analytics.hardestMatchdayHardFixtures} starters in hard fixtures.`
    });
  }

  if (analytics.tailRiskAverage >= 65) {
    warnings.push({
      kind: "review",
      label: "Bad-Week Floor",
      detail: `Average squad tail risk is ${displayNumber(analytics.tailRiskAverage)}, so bad-outcome exposure is high.`
    });
  }

  if (!warnings.length) {
    warnings.push({
      kind: "pass",
      label: "Portfolio Health",
      detail: "No major squad-level portfolio warning is triggered by the current prototype thresholds."
    });
  }

  return warnings;
}

function portfolioOptimizerWeights(mode = activeTrustMode(), measure = activeMeasure()) {
  const weightsByMode = {
    strict: {
      expected: 0.08,
      riskAdjusted: 0.18,
      upside: 0.01,
      var10: 0.22,
      cvar20: 0.18,
      start: 0.12,
      minutes: 0.018,
      volatilityPenalty: 0.16,
      tailPenalty: 0.12,
      compositePenalty: 0.08,
      qaReviewPenalty: 2.8,
      qaWatchPenalty: 0.6,
      weakBenchPenalty: 2.1,
      premiumSqueezePenalty: 2.2,
      countryLimitPenalty: 1.4,
      hardFixturePenalty: 1.5,
      favorableFixtureReward: 0.22
    },
    balanced: {
      expected: 0.13,
      riskAdjusted: 0.14,
      upside: 0.03,
      var10: 0.12,
      cvar20: 0.1,
      start: 0.06,
      minutes: 0.01,
      volatilityPenalty: 0.08,
      tailPenalty: 0.08,
      compositePenalty: 0.05,
      qaReviewPenalty: 1.8,
      qaWatchPenalty: 0.35,
      weakBenchPenalty: 1.4,
      premiumSqueezePenalty: 1.7,
      countryLimitPenalty: 1.1,
      hardFixturePenalty: 1.1,
      favorableFixtureReward: 0.18
    },
    aggressive: {
      expected: 0.18,
      riskAdjusted: 0.08,
      upside: 0.1,
      var10: 0.03,
      cvar20: 0.02,
      start: 0.03,
      minutes: 0.004,
      volatilityPenalty: 0.015,
      tailPenalty: 0.035,
      compositePenalty: 0.025,
      qaReviewPenalty: 0.8,
      qaWatchPenalty: 0.15,
      weakBenchPenalty: 0.8,
      premiumSqueezePenalty: 0.7,
      countryLimitPenalty: 0.7,
      hardFixturePenalty: 0.6,
      favorableFixtureReward: 0.2
    },
    chaos: {
      expected: 0.14,
      riskAdjusted: 0.02,
      upside: 0.2,
      var10: 0,
      cvar20: 0,
      start: 0,
      minutes: 0,
      volatilityPenalty: -0.03,
      tailPenalty: 0.005,
      compositePenalty: 0,
      qaReviewPenalty: 0.2,
      qaWatchPenalty: 0,
      weakBenchPenalty: 0.15,
      premiumSqueezePenalty: 0.15,
      countryLimitPenalty: 0.35,
      hardFixturePenalty: 0.15,
      favorableFixtureReward: 0.12
    }
  };
  const weights = { ...(weightsByMode[mode.id] || weightsByMode.balanced) };
  const measureKey = measureKeyForTrust(measure);

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

function portfolioOptimizerAdjustment(starters, bench, measure = activeMeasure(), mode = activeTrustMode()) {
  const analytics = squadPortfolioAnalytics(starters, bench);
  const weights = portfolioOptimizerWeights(mode, measure);
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
  const startLift = analytics.startAverage - 55;
  const minutesLift = analytics.expectedMinutesTotal - 600;
  const score =
    analytics.starterExpected * weights.expected +
    analytics.starterRiskAdjusted * weights.riskAdjusted +
    analytics.starterUpside * weights.upside +
    analytics.starterVar10 * weights.var10 +
    analytics.starterCvar20 * weights.cvar20 +
    startLift * weights.start +
    minutesLift * weights.minutes +
    analytics.totalFavorableFixtureStarters * weights.favorableFixtureReward -
    volatilityLoad * weights.volatilityPenalty -
    tailLoad * weights.tailPenalty -
    compositeLoad * weights.compositePenalty -
    analytics.qaReviewCount * weights.qaReviewPenalty -
    analytics.qaWatchCount * weights.qaWatchPenalty -
    analytics.benchWeakCount * weights.weakBenchPenalty -
    premiumSqueeze * weights.premiumSqueezePenalty -
    countryLimitLoad * weights.countryLimitPenalty -
    hardFixtureLoad * weights.hardFixturePenalty;

  return {
    version: "portfolio_optimizer_v0",
    mode: mode.id,
    mode_label: mode.label,
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
      top_country_count: analytics.topCountry[1],
      hardest_matchday_hard_fixtures: analytics.hardestMatchdayHardFixtures,
      total_favorable_fixture_starters: analytics.totalFavorableFixtureStarters
    },
    note: "Small optimizer adjustment that nudges completed squads toward the selected recommendation mode's portfolio profile."
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
    portfolioSummary.textContent = "Build a squad to see portfolio health, bad-week floor, data checks, and fixture stack risk.";
    portfolioMetrics.innerHTML = "";
    portfolioWarnings.innerHTML = "";
    return;
  }

  const analytics = squadPortfolioAnalytics(starters, bench);
  const riskLevel = portfolioRiskLevel(analytics);
  const topCountryLabel = countryCountLabel(analytics.topCountry[0]);
  const fixtureSummary = analytics.fixtureRows
    .map((row) => `${row.label}: ${row.hardFixtures} hard, ${row.favorableFixtures} favorable`)
    .join(" | ");

  portfolioAnalytics.classList.remove("portfolio-analytics--low", "portfolio-analytics--medium", "portfolio-analytics--high");
  portfolioAnalytics.classList.add(`portfolio-analytics--${riskLevel.id}`);
  portfolioRiskLabel.textContent = riskLevel.label;
  portfolioSummary.textContent = `${activeMeasure().label}, ${trustModeLabel()}, ${activeMatchdayLabel()}. Top country: ${topCountryLabel} ${analytics.topCountry[1]}/${groupStageCountryLimit}. Fixture spread: ${fixtureSummary}.`;
  portfolioMetrics.innerHTML = [
    portfolioMetric("Projected Points", portfolioNumber(analytics.starterExpected), "starting XI"),
    portfolioMetric("Risk-Aware Points", portfolioNumber(analytics.starterRiskAdjusted), "starting XI"),
    portfolioMetric("Avg Start", portfolioNumber(analytics.startAverage, "%"), "starting XI"),
    portfolioMetric("Expected Minutes", portfolioNumber(analytics.expectedMinutesTotal), "starting XI total"),
    portfolioMetric("Portfolio Health", portfolioNumber(Math.max(0, 100 - analytics.starterVolatility)), "higher is steadier"),
    portfolioMetric("Bad-Week Floor", portfolioNumber(analytics.starterVar10), "starting XI"),
    portfolioMetric("Worst-Case Floor", portfolioNumber(analytics.starterCvar20), "starting XI"),
    portfolioMetric("Squad Risk", portfolioNumber(analytics.tailRiskAverage), "average"),
    portfolioMetric("Data Checks", String(analytics.qaReviewCount), `${analytics.qaWatchCount} watch`),
    portfolioMetric("Budget Pressure", `${analytics.premiumPlayers} premium`, `${analytics.benchWeakCount} weak bench`)
  ].join("");
  portfolioWarnings.innerHTML = portfolioWarningsForAnalytics(analytics)
    .map((warning) => portfolioWarningItem(warning.kind, warning.label, warning.detail))
    .join("");
}

function exportedPlayer(player) {
  const trustMode = activeTrustMode();
  const recommendationBreakdown = recommendationScoreBreakdown(player, activeMeasure(), trustMode);
  const captainBreakdown = recommendationScoreBreakdown(player, captainTrustMeasure, trustMode);
  const qaFlags = recommendationBreakdown.qa_flags;

  return {
    id: player.id,
    name: player.name,
    position: player.position,
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
    qa_flags: qaFlags
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
    site_name: "World Cup Fantasy Helper",
    site_status: "current_official_fantasy",
    data_mode: usingFinanceModel ? "week6_world_cup_finance_model" : "fallback_players",
    browser_models: {
      finance: financeModelSummary ? {
        schema_version: financeModelSummary.schema_version,
        generated_at: financeModelSummary.generated_at,
        source_schema_version: financeModelSummary.source_schema_version,
        source_generated_at: financeModelSummary.source_generated_at,
        source_checked: financeModelSummary.source_checked,
        player_count_browser: financeModelSummary.player_count_browser,
        active_proxy_price_version: financeModelSummary.active_proxy_price_version,
        player_value_model_schema_version: financeModelSummary.player_value_model_schema_version,
        price_status: financeModelSummary.price_status
      } : null,
      matchday_projections: matchdayModelSummary ? {
        schema_version: matchdayModelSummary.schema_version,
        generated_at: matchdayModelSummary.generated_at,
        source_schema_version: matchdayModelSummary.source_schema_version,
        projection_row_count: matchdayModelSummary.projection_row_count,
        source_projection_row_count: matchdayModelSummary.source_projection_row_count,
        recommendation_source_schema_version: matchdayModelSummary.recommendation_source_schema_version
      } : null,
      score_predictions: scorePredictionSummary ? {
        schema_version: scorePredictionSummary.schema_version,
        generated_at: scorePredictionSummary.generated_at,
        source_schema_version: scorePredictionSummary.source_schema_version,
        source_generated_at: scorePredictionSummary.source_generated_at,
        source_checked: scorePredictionSummary.source_checked,
        fixture_prediction_count: scorePredictionSummary.fixture_prediction_count
      } : null,
      fantasy_rules: {
        rules_version: fantasyRules?.rules_version || null,
        rules_status: fantasyRules?.rules_status || null,
        squad_total_players: squadTotalPlayers,
        starting_lineup_total_players: startingLineupTotal,
        initial_budget: initialBudget,
        budget_currency_label: budgetCurrencyLabel,
        group_stage_country_limit: groupStageCountryLimit,
        allowed_formations: Object.keys(tactics)
      }
    },
    source_files: [
      usingFinanceModel ? "financePlayersData.js" : "playersData.js",
      "matchdayProjectionsData.js",
      "scorePredictionsData.js",
      "fantasyRulesData.js",
      usingFinanceModel ? "data/playerFinanceMetrics_v0.json" : "players.json",
      "data/playerMatchdayProjections_v2.json",
      "data/scorePredictions_v2.json",
      "data/playerValueModel_v1.json",
      "data/recommendationTrustModel_v0.md",
      "data/captainChangeAdvisorModel_v0.md",
      "data/substitutionAdvisorModel_v0.md",
      "data/savedDecisionExport_v0.md"
    ]
  };
}

function builderSettingsForExport() {
  const measure = activeMeasure();
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
      key: measure.key,
      label: measure.label
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

  const priceNote = usingFinanceModel
    ? "Fallback builder prices are estimated where needed; official fantasy prices remain the public pick source."
    : "Current data is the local fallback dataset.";

  return `Generated by Team Builder using ${activeMeasure().label}, ${trustModeLabel()}, and ${activeMatchdayLabel()}. Squad risk scoring is enabled as a small squad-level adjustment. Risk controls: ${builderRiskSettingsSummary()}. The squad costs ${budgetText(totalPrice)} with ${remainingBudgetText(totalPrice)} remaining. Country counts: ${countryCounts || "none"}. ${priceNote}`;
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
    site_name: "World Cup Fantasy Helper",
    exported_at: metadata.generated_at,
    user_prompt: "Build a fantasy squad using the current Team Builder settings.",
    team_name: `World Cup Fantasy Helper ${tacticName} Draft`,
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
    strategy: activeMeasure().label,
    strategy_key: activeMeasure().key,
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
      model_caveat: "World Cup fantasy recommendations using the current available model data. Confirm live lineups, locks, deadlines, and official-game legality before acting.",
      next_use: "This export is structured so a future import flow can prefill saved squads and decision-tool context."
    },
    explanation,
    data_sources: [
      usingFinanceModel ? "data/playerFinanceMetrics_v0.json" : "players.json",
      usingFinanceModel ? "data/playerRecommendationInputs_v0.json" : "playersData.js",
      usingFinanceModel ? "financePlayersData.js" : "playersData.js",
      "matchdayProjectionsData.js",
      "scorePredictionsData.js",
      "data/playerMatchdayProjections_v2.json",
      "data/scorePredictions_v2.json",
      "dataSources.md",
      usingFinanceModel
        ? "Current official fantasy view uses the Week 6 World Cup finance model."
        : "Current fallback view uses the older local player data."
    ],
    rules_sources: [
      "fantasyRules.json",
      "fantasyRulesData.js",
      "rulesSources.md",
      fantasyRules?.rules_status || "Draft rules, not official FIFA World Cup 2026 fantasy rules."
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
  teamMessage.textContent = `Team JSON v1 export ready${decisionText}. A download was created and the export preview is shown in the Team Builder controls.`;
  downloadJsonFile("world-cup-fantasy-team-v1.json", jsonText);
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
    teamMessage.textContent = "Squad saved in this browser. Matchday Desk can now reload it without a JSON file.";
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
    [adviceMatchdaySelect, builderMatchdaySelect].filter(Boolean).forEach((select) => {
      select.value = activeMatchdayId;
    });
    setMatchdayDecisionMatchday(activeMatchdayId);
  }

  if (styleKey && measures[styleKey]) {
    measureSelect.value = primaryStrategyKeys.includes(styleKey) ? styleKey : "balanced";
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
    maxQaReviewFilter.value = riskControls.maxQaReviewPlayers ?? "";
  }

  if (allowRiskyPicksToggle) {
    allowRiskyPicksToggle.checked = riskControls.allowRiskyPicks !== false;
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
    throw new Error("Import needs a Team JSON v1 file exported from this Team Builder.");
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
    importMessage = `Loaded ${payload.team_name || "saved Team JSON v1"} with ${startingLineupTotal} starters and ${benchLabel()}. Rebuild only if you want Team Builder to change it.`;
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
  const renderOptions = (keys) => keys
    .map((key) => `<option value="${key}">${measures[key].optionLabel || measures[key].label}</option>`)
    .join("");
  const measureOptions = renderOptions(primaryStrategyKeys);

  [measureSelect, adviceMeasureSelect].filter(Boolean).forEach((select) => {
    const previousValue = select.value;
    select.innerHTML = measureOptions;
    select.value = primaryStrategyKeys.includes(previousValue) ? previousValue : "balanced";
  });
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
  const trustMode = activeTrustMode();
  const secondaryLabel = measure.secondaryLabel
    ? `<span class="measure-info__secondary">${measure.secondaryLabel}</span>`
    : "";
  const matchdayCopy = activeMatchdayId === "group_stage_full"
    ? "Scores use the full group-stage view."
    : `Scores are adjusted for ${activeMatchdayLabel()} fixture opponents.`;

  measureInfo.innerHTML = `
    <strong>${measure.label}</strong>
    ${secondaryLabel}
    <p>${measure.description}</p>
    <p><strong>How it is calculated:</strong> ${measure.formula}</p>
    <p><strong>Matchday view:</strong> ${matchdayCopy}</p>
    <p><strong>Confidence mode:</strong> ${trustMode.formula}</p>
  `;
}

function normalizeText(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
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
  const maxQaReviewPlayers = boundedNumberFilterValue(maxQaReviewFilter, 0, squadTotalPlayers);

  return {
    minStartProbability: boundedNumberFilterValue(minStartFilter, 0, 100),
    minExpectedMinutes: boundedNumberFilterValue(minMinutesFilter, 0, 120),
    maxQaReviewPlayers: maxQaReviewPlayers === null ? null : Math.floor(maxQaReviewPlayers),
    allowRiskyPicks: allowRiskyPicksToggle?.checked !== false
  };
}

function builderRiskControlsActive(settings = builderRiskSettings()) {
  return settings.minStartProbability !== null ||
    settings.minExpectedMinutes !== null ||
    settings.maxQaReviewPlayers !== null ||
    !settings.allowRiskyPicks;
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

  if (!settings.allowRiskyPicks && builderRiskyPlayer(player, measureKeyForTrust(activeMeasure()))) {
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

  if (settings.maxQaReviewPlayers !== null) {
    parts.push(`max data-review ${displayNumber(settings.maxQaReviewPlayers)}`);
  }

  parts.push(settings.allowRiskyPicks ? "risky fill-ins allowed" : "risky fill-ins blocked");

  return parts.join(", ");
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

  if (!settings.allowRiskyPicks) {
    const riskyPlayers = squad.filter((player) => builderRiskyPlayer(player, measureKey));

    if (riskyPlayers.length) {
      violations.push(`${riskyPlayers.length} current squad player${riskyPlayers.length === 1 ? "" : "s"} break the risky-picks control: ${labelPlayers(riskyPlayers)}.`);
    }
  }

  if (settings.maxQaReviewPlayers !== null) {
    const qaReviewPlayers = squad.filter((player) =>
      qaStatusFromFlags(qaFlagsForPlayer(player, measureKey)) === "review"
    );

    if (qaReviewPlayers.length > settings.maxQaReviewPlayers) {
      violations.push(`${qaReviewPlayers.length} data-review squad player${qaReviewPlayers.length === 1 ? "" : "s"} exceed the max of ${displayNumber(settings.maxQaReviewPlayers)}: ${labelPlayers(qaReviewPlayers)}.`);
    }
  }

  return violations;
}

function availableFillCandidates(position, usedIds, countryCounts = null) {
  const measure = activeMeasure();
  const candidates = players.filter((player) =>
    player.position === position &&
    !usedIds.has(player.id) &&
    !excludedPlayerIds.has(player.id) &&
    priceMatchesFilters(player) &&
    playerMatchesBuilderRiskControls(player) &&
    (!countryCounts || canAddCountry(player, countryCounts))
  );

  return trustFilteredPlayers(candidates, measure, activeTrustMode());
}

function toggleScoreInfo() {
  const isHidden = scoreInfo.classList.toggle("hidden");
  scoreInfoButton.setAttribute("aria-expanded", String(!isHidden));
}

function renderPlayerPicker() {
  const measure = activeMeasure();
  const searchValue = playerSearch.value.trim().toLowerCase();
  const filteredPlayers = players
    .filter((player) => !excludedPlayerIds.has(player.id))
    .filter((player) => selectedPositionFilter === "All" || player.position === selectedPositionFilter)
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
          <small>${player.position} · ${player.club} · ${playerCountryText(player)}${fixtureText}${roleDetail}</small>
        </span>
        <span class="player-option__metrics">
          <em><span>Price</span>${playerPriceText(player)}</em>
          <em title="${escapeHtml(scoreSummaryText(player, measure))}"><span>${measure.label}</span>${displayNumber(measureScore(player, measure))}</em>
        </span>
      </label>
    `;
  }).join("");
}

function updatePositionFilter(event) {
  selectedPositionFilter = event.target.value;
  renderPlayerPicker();
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

  [adviceMatchdaySelect, builderMatchdaySelect].filter(Boolean).forEach((select) => {
    select.value = activeMatchdayId;
  });
  setMatchdayDecisionMatchday(activeMatchdayId);

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
function getValidLockedSquadPlayers(measure) {
  const lockedPlayers = sortPlayers(
    players.filter((player) => lockedPlayerIds.has(player.id) && !excludedPlayerIds.has(player.id)),
    measure
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

function chooseStartersFromSquad(squad, requirements, measure) {
  const starters = [];
  const starterIds = new Set();

  positionOrder.forEach((position) => {
    const lockedOptions = sortPlayers(
      squad.filter((player) => player.position === position && lockedPlayerIds.has(player.id)),
      measure
    );
    const otherOptions = sortPlayers(
      squad.filter((player) => player.position === position && !lockedPlayerIds.has(player.id)),
      measure
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

function optimizerPriceFloorsByPosition() {
  if (optimizerPriceFloorCache) {
    return optimizerPriceFloorCache;
  }

  optimizerPriceFloorCache = positionOrder.reduce((floors, position) => {
    floors[position] = players
      .filter((player) =>
        player.position === position &&
        !excludedPlayerIds.has(player.id) &&
        priceMatchesFilters(player) &&
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

  let rank;

  if (state.squad.length < squadTotalPlayers) {
    const cheapestRemainingCost = optimizerCheapestRemainingCost(state);

    if (!Number.isFinite(cheapestRemainingCost)) {
      return -Infinity;
    }

    const remainingAfterMinimum = initialBudget - state.totalPrice - cheapestRemainingCost;
    const budgetPressurePenalty = Math.max(0, -remainingAfterMinimum) * 25;

    const budgetReserveWeight = builderRiskControlsActive() ? 0.55 : 0.18;

    rank = state.score + Math.max(0, remainingAfterMinimum) * budgetReserveWeight - budgetPressurePenalty;
    optimizerStateRankCache.set(state, rank);
    return rank;
  }

  const requirements = tactics[tacticName] || {};
  const { starters, starterIds } = chooseStartersFromSquad(state.squad, requirements, measure);
  const bench = state.squad.filter((player) => !starterIds.has(player.id));
  const starterScore = starters.reduce((sum, player) => sum + measureScore(player, measure), 0);
  const benchScore = bench.reduce((sum, player) => sum + measureScore(player, measure), 0);
  const captain = [...starters]
    .filter((player) => player.position !== "Goalkeeper")
    .sort((a, b) => captainRecommendationScore(b) - captainRecommendationScore(a))[0];
  const captainBonus = captain ? captainRecommendationScore(captain) * 0.04 : 0;
  const budgetBuffer = Math.max(0, initialBudget - state.totalPrice) * 0.02;
  const portfolioAdjustment = portfolioOptimizerAdjustment(starters, bench, measure).adjustment_score;

  rank = starterScore + benchScore * 0.35 + captainBonus + budgetBuffer + portfolioAdjustment;
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

  return positionOrder.reduce((pools, position) => {
    const candidates = players.filter((player) =>
      player.position === position &&
      !excludedPlayerIds.has(player.id) &&
      priceMatchesFilters(player) &&
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

    pools[position] = uniqueOptimizerCandidates([
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

  states.forEach((state) => {
    const key = [...state.usedIds].sort().join("|");

    if (!stateKeys.has(key)) {
      stateKeys.add(key);
      uniqueStates.push(state);
    }
  });

  const stateLimit = builderRiskControlsActive()
    ? 420
    : activeTrustMode().filtersRanking ? 320 : 300;

  return uniqueStates
    .sort((a, b) => optimizerStateRank(b, measure, tacticName) - optimizerStateRank(a, measure, tacticName))
    .slice(0, stateLimit);
}

// Team Builder searches several legal squad paths instead of accepting the first fill.
function buildSuggestedSquad() {
  resetOptimizerPriceFloorCache();
  resetOptimizerStateRankCache();
  const tacticName = tacticSelect.value;
  const requirements = tactics[tacticName];
  const measure = activeMeasure();
  const riskSettings = builderRiskSettings();
  const { validLockedPlayers, ignoredLockedPlayers, usedByCountry } =
    getValidLockedSquadPlayers(measure);
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
  const { starters, starterIds } = chooseStartersFromSquad(squad, requirements, measure);
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
    Goalkeeper: evenlySpacedPositions(1, "85%"),
    Defender: evenlySpacedPositions(requirements.Defender, "62%"),
    Midfielder: evenlySpacedPositions(requirements.Midfielder, "39%"),
    Forward: evenlySpacedPositions(requirements.Forward, "16%")
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
      builderBuildGuidance.textContent = "Full squad built. Review the checks, then save it for Matchday Desk.";
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
  const messages = [];

  if (priceFiltersAreInvalid()) {
    messages.push("Minimum price is higher than maximum price, so no filtered players can be suggested.");
  }

  if (ignoredLockedPlayers.length) {
    messages.push(`Some locked players did not fit the ${squadLabel()} position or country limits: ${ignoredLockedPlayers.map((player) => player.name).join(", ")}.`);
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
    messages.push(`The builder could not add more players from one country because the Week 5 rule allows only ${groupStageCountryLimit} per country.`);
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
  const fixtureText = projection ? ` · vs ${projection.opponent}` : "";
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
  const fixtureText = projection ? ` · vs ${projection.opponent}` : "";
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

  teamField.classList.remove("hidden");
  renderBench(bench, benchRequirementsForTactic(tacticName));

  if (mode === "preview" && squad.length === 0) {
    teamMessage.textContent = `Transparent slots show the selected starting tactic. Build My Squad will create a ${squadLabel()} with ${benchLabel()} below.`;
  } else if (mode === "preview") {
    teamMessage.textContent = `Showing ${squad.length} locked squad player${squad.length === 1 ? "" : "s"}. Click Build My Squad to fill the full ${squadLabel()}.`;
  } else if (missingStarterSlots > 0 || missingSquadSlots > 0) {
    const riskText = builderRiskControlsActive() ? ` Risk controls: ${builderRiskSettingsSummary()}.` : "";
    teamMessage.textContent = `Team Builder found ${squad.length} squad player${squad.length === 1 ? "" : "s"} using ${activeMeasure().label}, ${trustModeLabel()}, and ${activeMatchdayLabel()}. Some spots are still open because the current locks, filters, removals, confidence mode, budget, country limit, or risk controls are too tight.${riskText}`;
  } else if (isOverBudget) {
    teamMessage.textContent = `Team Builder built a ${squadLabel()} using ${activeMeasure().label}, ${trustModeLabel()}, and ${activeMatchdayLabel()}, but it is over the ${budgetText(initialBudget)} budget. Try removing expensive locked players or relaxing filters.`;
  } else {
    const pathText = options.optimizerEvaluatedPaths
      ? ` after comparing ${compactCount(options.optimizerEvaluatedPaths)} candidate squad path${options.optimizerEvaluatedPaths === 1 ? "" : "s"}`
      : "";
    const riskText = builderRiskControlsActive() ? ` Risk controls: ${builderRiskSettingsSummary()}.` : "";
    teamMessage.textContent = `Team Builder built a ${squadLabel()} within the ${budgetText(initialBudget)} budget using ${activeMeasure().label}, ${trustModeLabel()}, and ${activeMatchdayLabel()}${pathText}: ${startingLineupTotal} starters on the field and ${benchLabel()} below.${riskText}`;
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
      <a class="picks-builder-tray__link picks-builder-tray__link--primary" href="#team-builder">Build My Squad</a>
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

function projectedMatchdayPoints(player) {
  const projected = optionalScoreValue(
    player,
    "finance_risk_adjusted_return_points",
    "risk_adjusted_expected_points_estimate"
  );

  return projected === null ? "Needs check" : displayNumber(projected);
}

function fantasyPoolCandidateReason(player) {
  const candidate = player.preview_candidate || {};
  const pickReason = publicFantasyPickReasonItems(player)[0] || `${candidate.mode_label || "Pick"}: current official score`;
  const carefulReason = Array.isArray(candidate.why_careful) && candidate.why_careful.length
    ? publicFantasyNoteText(candidate.why_careful[0])
    : "check the latest official status before deadline";
  const cleanPickReason = String(pickReason).replace(/\s*[.!?]+$/g, "");
  const cleanCarefulReason = String(carefulReason).replace(/\s*[.!?]+$/g, "");

  return `${cleanPickReason}. Careful: ${cleanCarefulReason}.`;
}

function fantasyPoolPreviewTableScore(player, label = "Pick score") {
  return `
    <span class="score-breakdown" title="${escapeHtml(fantasyPoolCandidateReason(player))}">
      <strong>${fantasyPoolCandidateStat(player, "recommendation_score")}</strong>
      <small>${escapeHtml(label)}</small>
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
    if (Number.isFinite(compositeRisk)) chips.push(`<span class="finance-chip">Low Risk ${displayNumber(Math.max(0, 100 - compositeRisk))}</span>`);
    if (Number.isFinite(premiumWorthIt)) chips.push(`<span class="finance-chip">Premium ${displayNumber(premiumWorthIt)}</span>`);
  }

  return chips.slice(0, 3).join(" ");
}

function financeLensCell(player, lens = activeAdviceFinanceLens()) {
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
  const qaStatus = qaStatusFromFlags(qaFlagsForPlayer(player, measureKeyForTrust(activeMeasure())));

  if (qaStatus === "review") return "Review";
  if (risk <= 38) return "Low Risk";
  if (risk <= 62) return "Medium Risk";
  return "High Risk";
}

function pickRiskHelpText(player, riskLabel) {
  const risk = scoreValue(player, "finance_composite_risk_score", "risk_composite_score");
  const scoreText = Number.isFinite(risk)
    ? `${displayNumber(risk)}/100`
    : "not available";
  const basis = player?.is_fantasy_pool_preview
    ? "start chance, expected minutes, projection confidence, role stability, downside floor, volatility, and ceiling/floor spread"
    : "availability, minutes, discipline, volatility, and bad-week floor";

  if (riskLabel === "Review") {
    return `Review: this pick has data warnings to check before trusting it. Practical risk score: ${scoreText}.`;
  }

  return `${riskLabel}: practical pick risk ${scoreText}. Low is 0-38, Medium is 39-62, High is 63+. Based on ${basis}. Data-readiness caveats are shown separately.`;
}

function pickRiskKind(player) {
  const label = pickRiskLabel(player);
  if (label === "Low Risk") return "safe";
  if (label === "Medium Risk") return "watch";
  return "review";
}

function pickFixtureLabel(player) {
  const candidate = player.preview_candidate || null;
  const projections = playerMatchdayProjections(player);
  const activeProjectionRow = activeMatchdayId === "group_stage_full"
    ? null
    : projections.find((projection) => projection.matchday_id === activeMatchdayId);
  const projection = activeProjectionRow || projections[0];

  if (!activeProjectionRow && candidate?.matchday === "group_stage_full") {
    const opponents = Array.isArray(candidate.fixture_context?.opponents)
      ? candidate.fixture_context.opponents.filter(Boolean)
      : [];
    if (opponents.length) {
      return `Full group stage vs ${listText(opponents.slice(0, 3))}`;
    }
    return "Full group stage";
  }

  if (!projection) {
    return player.preview_opponent ? `vs ${player.preview_opponent}` : "Fixture needs check";
  }

  const difficulty = fixtureDifficultyLabel(projection.fixture_difficulty_band);
  return `${projection.matchday_label || matchdayLabelFromId(projection.matchday_id)} vs ${projection.opponent} · ${difficulty}`;
}

function pickProjectedScore(player, measureKey = "balanced") {
  if (player.preview_candidate) {
    if (measureKey === "captain") {
      return fantasyPoolCandidateStat(player, "captain_score");
    }
    return projectedMatchdayPoints(player);
  }

  if (measureKey === "captain") {
    return displayNumber(captainRecommendationScore(player));
  }

  return displayNumber(scoreValue(player, "finance_risk_adjusted_return_points", "risk_adjusted_expected_points_estimate"));
}

function pickScoreLabel(player, measureKey = "balanced") {
  if (measureKey === "captain") {
    return "Captain Alpha";
  }
  const hasMatchdayProjection = Boolean(activeProjection(player));
  return !hasMatchdayProjection && player?.preview_candidate?.matchday === "group_stage_full"
    ? "Group Stage Pts"
    : "Projected Pts / Matchday";
}

function pickReasonText(player, measureKey = "balanced") {
  const reason = player.preview_candidate
    ? fantasyPoolCandidateReason(player)
    : styleReason(player, measureKey);

  return reason.length > 190 ? `${reason.slice(0, 187).trim()}...` : reason;
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
  const label = options.label || measures[measureKey]?.label || "Pick";
  const scoreLabel = pickScoreLabel(player, measureKey);
  const riskLabel = pickRiskLabel(player);
  const riskHelpText = pickRiskHelpText(player, riskLabel);

  if (!player) {
    return `
      <article class="pick-card pick-card--empty">
        <span class="pick-card__label">${escapeHtml(label)}</span>
        <strong>Official fantasy data unavailable</strong>
        <p>The site will fall back to the older local dataset if the official fantasy source file is missing.</p>
      </article>
    `;
  }

  return `
    <article class="pick-card pick-card--${pickRiskKind(player)}">
      <div class="pick-card__top">
        <span class="pick-card__label">${escapeHtml(label)}</span>
        <span class="pick-card__risk" title="${escapeHtml(riskHelpText)}" aria-label="${escapeHtml(riskHelpText)}">${escapeHtml(riskLabel)}</span>
      </div>
      ${playerDetailButton(player, "player-name-button--dashboard", measureKey)}
      <p class="pick-card__meta">${escapeHtml(playerCountryText(player))} · ${escapeHtml(player.position)} · ${escapeHtml(playerPriceText(player))}</p>
      <div class="pick-card__metrics">
        <span><strong>${escapeHtml(pickProjectedScore(player, measureKey))}</strong> <small>${escapeHtml(scoreLabel)}</small></span>
        <span><strong>${displayNumber(scoreValue(player, "start_probability_percent"))}%</strong> <small>Start</small></span>
      </div>
      <p class="pick-card__fixture">${escapeHtml(pickFixtureLabel(player))}</p>
      <p class="pick-card__reason">${escapeHtml(pickReasonText(player, measureKey))}</p>
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
    : `${builderPlayer.name} was added to Team Builder. Add a few more picks or click Build My Squad.`;

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
  const captainCandidates = fantasyPoolPreviewCandidatesForMode("captain").slice(0, 6);

  if (captainCardGrid) {
    captainCardGrid.innerHTML = captainCandidates.length
      ? captainCandidates.map((player, index) => renderPickCard(player, {
        label: index === 0 ? "Best Captain" : `Captain ${index + 1}`,
        measureKey: "captain"
      })).join("")
      : renderPickCard(null, { label: "Captain Alpha", measureKey: "captain" });
  }

  captainTableBody.innerHTML = captainCandidates.map((player, index) => {
    const candidate = player.preview_candidate || {};
    return `
      <tr>
        <td>${index + 1}</td>
        <td>${playerDetailButton(player, "", "captain")}</td>
        <td>${playerCountryText(player)}</td>
        <td>${escapeHtml(player.club)}</td>
        <td>${fantasyPoolPreviewTableScore(player, "Captain Alpha")}</td>
        <td>${displayNumber(scoreValue(player, "start_probability_percent"))}%</td>
        <td>${fantasyPoolCandidateStat(player, "ceiling_points")}</td>
        <td>${displayNumber(scoreValue(player, "finance_composite_risk_score"))}</td>
        <td>${qaChipRow(qaFlagsForPlayer(player, "captain"), { compact: true, maxVisible: 2 })}</td>
      </tr>
    `;
  }).join("");

  if (!captainCandidates.length) {
    captainTableBody.innerHTML = `
      <tr class="fallback-table-row">
        <td colspan="9">Official fantasy captain candidates did not load. The site will fall back to the older captain table when official fantasy data is unavailable.</td>
      </tr>
    `;
  }
}

function renderCaptainPicks() {
  if (usingFantasyPoolPreview) {
    renderFantasyPoolPreviewCaptainPicks();
    return;
  }

  const captainPool = trustFilteredPlayers(
    players.filter((player) => player.position !== "Goalkeeper"),
    captainTrustMeasure,
    activeTrustMode(),
    { allowFallback: true }
  );
  const captainCandidates = [...captainPool]
    .sort((a, b) => captainRecommendationScore(b) - captainRecommendationScore(a));

  if (captainCardGrid) {
    captainCardGrid.innerHTML = captainCandidates.slice(0, 6).map((player, index) => renderPickCard(player, {
      label: index === 0 ? "Best Captain" : `Captain ${index + 1}`,
      measureKey: "captain"
    })).join("");
  }

  captainTableBody.innerHTML = captainCandidates.slice(0, 6).map((player, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${playerDetailButton(player, "", "captain")}</td>
      <td>${playerCountryText(player)}</td>
      <td>${player.club}</td>
      <td>${scoreBreakdownHtml(player, captainTrustMeasure)}</td>
      <td>${displayNumber(scoreValue(player, "finance_minutes_security_score", "euro_style_reliability_score"))}</td>
      <td>${displayNumber(scoreValue(player, "finance_upside_p90_points", "euro_style_points_per90_estimate"))}</td>
      <td>${displayNumber(scoreValue(player, "finance_composite_risk_score", "risk_composite_score"))}</td>
      <td>${qaChipRow(qaFlagsForPlayer(player, "captain"), { compact: true, maxVisible: 2 })}</td>
    </tr>
  `).join("");
}

function renderFantasyPoolPreviewDashboardSections() {
  const usedPlayerKeys = new Set();
  const pickUniquePlayer = (mode) => {
    const playerList = fantasyPoolPreviewCandidatesForMode(mode);
    const player = playerList.find((candidate) => !usedPlayerKeys.has(candidate.preview_player_key)) || playerList[0];
    if (player) {
      usedPlayerKeys.add(player.preview_player_key);
    }
    return player;
  };

  const cards = [
    {
      label: "Balanced Pick",
      mode: "balanced",
      stat: (player) => `Projected ${fantasyPoolCandidateStat(player, "risk_adjusted_points")} · Price ${playerPriceText(player)}`,
      qaStyle: "balanced"
    },
    {
      label: "Captain Alpha",
      mode: "captain",
      stat: (player) => `Captain score ${fantasyPoolCandidateStat(player, "captain_score")} · Start ${displayNumber(scoreValue(player, "start_probability_percent"))}%`,
      qaStyle: "captain"
    },
    {
      label: "Safe Pick",
      mode: "safe",
      stat: (player) => `Floor ${fantasyPoolCandidateStat(player, "floor_points")} · Minutes ${displayNumber(scoreValue(player, "expected_minutes_v0"))}`,
      qaStyle: "safe"
    },
    {
      label: "Differential Pick",
      mode: "differential",
      stat: (player) => `Value ${fantasyPoolCandidateStat(player, "value_score")} · Projected ${fantasyPoolCandidateStat(player, "risk_adjusted_points")}`,
      qaStyle: "bestValue"
    },
    {
      label: "Upside Pick",
      mode: "upside",
      stat: (player) => `Ceiling ${fantasyPoolCandidateStat(player, "ceiling_points")} · Projection ${fantasyPoolCandidateStat(player, "raw_expected_points")}`,
      qaStyle: "upside"
    }
  ].map((card) => ({ ...card, player: pickUniquePlayer(card.mode) }));

  dashboardGrid.innerHTML = cards.map(({ label, player, qaStyle }) =>
    renderPickCard(player, { label, measureKey: qaStyle })
  ).join("");
}

function renderDashboardSections() {
  if (usingFantasyPoolPreview) {
    renderFantasyPoolPreviewDashboardSections();
    return;
  }

  const usedPlayerIds = new Set();
  const pickUniquePlayer = (playerList) => {
    const player = playerList.find((candidate) => !usedPlayerIds.has(candidate.id)) || playerList[0];
    if (player) {
      usedPlayerIds.add(player.id);
    }
    return player;
  };
  const bestOverallPick = pickUniquePlayer(rankedRecommendationPlayers(players, measures.balanced, activeTrustMode(), { allowFallback: true }));
  const captainPick = pickUniquePlayer(
    trustFilteredPlayers(
      players.filter((player) => player.position !== "Goalkeeper"),
      captainTrustMeasure,
      activeTrustMode(),
      { allowFallback: true }
    ).sort((a, b) => captainRecommendationScore(b) - captainRecommendationScore(a))
  );
  const reliablePick = pickUniquePlayer(rankedRecommendationPlayers(players, measures.safe, activeTrustMode(), { allowFallback: true }));
  const valuePick = pickUniquePlayer(rankedRecommendationPlayers(players, measures.bestValue, activeTrustMode(), { allowFallback: true }));
  const attackPick = pickUniquePlayer(rankedRecommendationPlayers(players, measures.attackHeavy, activeTrustMode(), { allowFallback: true }));
  const veryRiskyCandidates = players.filter((player) =>
    ["high_risk_high_upside", "high_upside_option"].includes(player.finance_label)
  );
  const veryRiskyPick = pickUniquePlayer(rankedRecommendationPlayers(
    veryRiskyCandidates.length ? veryRiskyCandidates : players,
    measures.veryRisky,
    activeTrustMode(),
    { allowFallback: true }
  ));

  dashboardGrid.innerHTML = [
    {
      label: "Balanced Pick",
      player: bestOverallPick,
      stat: scoreSummaryText(bestOverallPick, measures.balanced),
      qaStyle: "balanced",
      reason: `Top blend of projected points, reliability, data confidence, and risk in the current model.${fixtureModelReason(bestOverallPick)}`
    },
    {
      label: "Captain Candidate",
      player: captainPick,
      stat: scoreSummaryText(captainPick, captainTrustMeasure),
      qaStyle: "captain",
      reason: `Strong captain-style option with useful projected points and manageable risk.${fixtureModelReason(captainPick, "attack")}`
    },
    {
      label: "Safe Pick",
      player: reliablePick,
      stat: `Risk: ${displayNumber(scoreValue(reliablePick, "finance_composite_risk_score", "risk_composite_score"))} · Reliability: ${displayNumber(scoreValue(reliablePick, "finance_minutes_security_score", "euro_style_reliability_score"))}`,
      qaStyle: "safe",
      reason: `Lower-risk profile with useful minutes and downside protection.${fixtureModelReason(reliablePick)}`
    },
    {
      label: "Undervalued Asset",
      player: valuePick,
      stat: `${scoreSummaryText(valuePick, measures.bestValue)} · Budget ${displayNumber(proxyPrice(valuePick))}`,
      qaStyle: "bestValue",
      reason: `Value pick using budget, role confidence, projected points, and budget pressure.${fixtureModelReason(valuePick)}`
    },
    {
      label: "Upside Pick",
      player: attackPick,
      stat: scoreSummaryText(attackPick, measures.attackHeavy),
      qaStyle: "attackHeavy",
      reason: `Attack-first profile for users who want goals, assists, shots, and upside.${fixtureModelReason(attackPick, "attack")}`
    },
    {
      label: "Differential Watch",
      player: veryRiskyPick,
      stat: `${scoreSummaryText(veryRiskyPick, measures.veryRisky)} · Tail risk ${displayNumber(scoreValue(veryRiskyPick, "finance_tail_risk_score", "risk_tail_score"))}`,
      qaStyle: "veryRisky",
      reason: `Boom-or-bust portfolio pick. Useful for aggressive watchlists, not a safe default.${fixtureModelReason(veryRiskyPick, "risk")}`
    }
  ].map(({ label, player, qaStyle }) => renderPickCard(player, { label, measureKey: qaStyle })).join("");
}

function renderFantasyPoolPreviewAdviceTable() {
  const measureKey = adviceMeasureSelect.value || "balanced";
  const positionFilterValue = advicePositionSelect.value || "All";
  const trustMode = activeTrustMode();
  const poolMode = activeAdvicePoolMode();
  const financeLens = activeAdviceFinanceLens();
  const previewMode = fantasyPoolPreviewModeForAdvice(measureKey, trustMode);
  const previewPlayers = fantasyPoolPreviewCandidatesForMode(previewMode);
  const positionPool = positionFilterValue === "All"
    ? previewPlayers
    : previewPlayers.filter((player) => player.position === positionFilterValue);
  const visiblePool = poolMode.id === "watchlist"
    ? positionPool
    : positionPool.filter((player) =>
      ["top_pick_candidate", "strong_candidate"].includes(player.preview_candidate?.recommendation_tier)
    );
  const positionLabel = positionFilterValue === "All" ? "all positions" : positionFilterValue.toLowerCase();
  const hiddenCount = Math.max(0, positionPool.length - visiblePool.length);
  const rankedPool = financeLens.defaultLens ? visiblePool : sortByFinanceLens(visiblePool, financeLens);
  const financeNote = financeLens.defaultLens
    ? "Finance badges show the staged finance model context."
    : `Advanced Finance Lens: sorted by ${financeLens.label}.`;

  adviceStyleNote.textContent = `Official Fantasy Picks: showing ${titleFromSnake(previewMode)} candidates for ${positionLabel} in ${activeMatchdayLabel()} with ${trustModeLabel()}. ${visiblePool.length} ranked from ${positionPool.length} official candidate${positionPool.length === 1 ? "" : "s"}${hiddenCount ? `; ${hiddenCount} watchlist candidate${hiddenCount === 1 ? "" : "s"} hidden` : ""}. ${financeNote} Refresh with the monitor when FIFA changes the fantasy feed.`;

  if (adviceCardGrid) {
    adviceCardGrid.innerHTML = visiblePool.length
      ? rankedPool.slice(0, 8).map((player, index) => renderPickCard(player, {
        label: index === 0 ? `${titleFromSnake(previewMode)} pick` : `${titleFromSnake(previewMode)} ${index + 1}`,
        measureKey
      })).join("")
      : renderPickCard(null, { label: "Pick Explorer", measureKey });
  }

  adviceTableBody.innerHTML = rankedPool.slice(0, 8).map((player) => `
    <tr>
      <td>${playerDetailButton(player, "", measureKey)}</td>
      <td>${playerCountryText(player)}</td>
      <td>${player.position}</td>
      <td>${playerPriceText(player)}</td>
      <td>${fantasyPoolPreviewTableScore(player, player.preview_mode_label || titleFromSnake(previewMode))}</td>
      <td>${projectedMatchdayPoints(player)}</td>
      <td>${displayNumber(scoreValue(player, "finance_composite_risk_score"))}</td>
      <td>${financeLensCell(player, financeLens)}</td>
      <td>${qaChipRow(qaFlagsForPlayer(player, measureKey), { compact: true, maxVisible: 2 })}</td>
      <td>${escapeHtml(fantasyPoolCandidateReason(player))}</td>
    </tr>
  `).join("");

  if (!visiblePool.length) {
    adviceTableBody.innerHTML = `
      <tr>
        <td colspan="10">No official fantasy candidates match this Pick Explorer filter. Try Include watchlist differentials, another position, or a broader strategy.</td>
      </tr>
    `;
  }
}

function renderAdviceTable() {
  if (usingFantasyPoolPreview) {
    renderFantasyPoolPreviewAdviceTable();
    return;
  }

  const measureKey = adviceMeasureSelect.value || "balanced";
  const positionFilterValue = advicePositionSelect.value || "All";
  const measure = activeAdviceMeasure();
  const trustMode = activeTrustMode();
  const poolMode = activeAdvicePoolMode();
  const financeLens = activeAdviceFinanceLens();
  const advicePlayers = positionFilterValue === "All"
    ? players
    : players.filter((player) => player.position === positionFilterValue);
  const trustPool = trustFilteredPlayers(advicePlayers, measure, trustMode);
  const trustFallbackUsed = trustMode.filtersRanking && !trustPool.length && advicePlayers.length > 0;
  const basePool = trustFallbackUsed ? [...advicePlayers] : trustPool;
  const visiblePool = basePool.filter((player) =>
    playerAllowedByAdvicePool(player, measureKey, poolMode)
  );
  const ranked = financeLens.defaultLens ? sortPlayers(visiblePool, measure, trustMode) : sortByFinanceLens(visiblePool, financeLens);
  const counts = advicePoolCounts(advicePlayers, basePool, visiblePool, measureKey, trustMode, poolMode);
  const positionLabel = positionFilterValue === "All" ? "all positions" : positionFilterValue.toLowerCase();

  const financeNote = financeLens.defaultLens ? "" : ` Advanced Finance Lens: sorted by ${financeLens.label}.`;
  adviceStyleNote.textContent = `Showing ${positionLabel} advice for ${measure.label} in ${activeMatchdayLabel()} with ${trustModeLabel()}. ${advicePoolNote(counts, poolMode, trustFallbackUsed)} Scores include data-check penalties or filters for source quality, role confidence, risk, and fixture context.${financeNote}`;

  if (adviceCardGrid) {
    adviceCardGrid.innerHTML = ranked.length
      ? ranked.slice(0, 8).map((player, index) => renderPickCard(player, {
        label: index === 0 ? `${measure.label} pick` : `${measure.label} ${index + 1}`,
        measureKey
      })).join("")
      : renderPickCard(null, { label: "Pick Explorer", measureKey });
  }

  adviceTableBody.innerHTML = ranked.slice(0, 8).map((player) => `
    <tr>
      <td>${playerDetailButton(player, "", measureKey)}</td>
      <td>${playerCountryText(player)}</td>
      <td>${player.position}</td>
      <td>${playerPriceText(player)}</td>
      <td>${scoreBreakdownHtml(player, measure)}</td>
      <td>${displayNumber(scoreValue(player, "finance_risk_adjusted_return_points", "risk_adjusted_expected_points_estimate"))}</td>
      <td>${displayNumber(scoreValue(player, "finance_composite_risk_score", "risk_composite_score"))}</td>
      <td>${financeLensCell(player, financeLens)}</td>
      <td>${qaChipRow(qaFlagsForPlayer(player, measureKey), { compact: true, maxVisible: 2 })}</td>
      <td>${styleReason(player, measureKey)}</td>
    </tr>
  `).join("");

  if (!ranked.length) {
    adviceTableBody.innerHTML = `
      <tr>
        <td colspan="10">No players match this Pick Explorer filter yet. Try Include watchlist differentials, another position, or a broader strategy.</td>
      </tr>
    `;
  }
}

function buildTeam() {
  clearSavedDecisionExports();
  clearUserSquadSelections();
  clearMatchdayDecisionInputs();

  const {
    starters,
    bench,
    ignoredLockedPlayers,
    budgetCouldNotFit,
    countryLimitCouldNotFit,
    optimizerFoundValidSquad,
    optimizerEvaluatedPaths,
    riskConstraintsCouldNotFit
  } = buildSuggestedSquad();
  selectedSwap = null;
  renderTeam(starters, bench, ignoredLockedPlayers, "built", {
    budgetCouldNotFit,
    countryLimitCouldNotFit,
    optimizerFoundValidSquad,
    optimizerEvaluatedPaths,
    riskConstraintsCouldNotFit
  });
  renderRemovedPlayers();
}

function resetTeam() {
  clearRenderedTeam("Team reset. Locked players and filters are still available; click Build My Squad when ready.", {
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
  teamMessage.textContent = `${player.name} is available again. Click Build My Squad to include him if he fits.`;
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
  renderCurrentSlotState(`Removed ${player.name}. The slot is now open. Click Build My Squad to refill it without that player. Reset Team clears removed-player exclusions.`);
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

function handlePlayerDetailKeydown(event) {
  if (event.key === "Escape" && !playerDetailModal?.classList.contains("hidden")) {
    closePlayerDetail();
  }
}

function setupBuilder() {
  organizeStatExamples();

  if (!players.length) {
    teamMessage.textContent = "Player data could not be loaded.";
    buildTeamButtonBottom.disabled = true;
    if (saveBrowserSquadButton) saveBrowserSquadButton.disabled = true;
    if (loadBrowserSquadButton) loadBrowserSquadButton.disabled = true;
    if (clearBrowserSquadButton) clearBrowserSquadButton.disabled = true;
    exportTeamJsonButton.disabled = true;
    return;
  }

  renderTacticOptions();
  renderPositionFilterOptions();
  updateRuleCopy();
  renderMeasureOptions();
  renderFinanceLensOptions();
  renderTrustModeOptions();
  renderMatchdayOptions();
  renderCaptainChangeOptions();
  renderSavedSquadTimelineOptions();
  if (advicePoolSelect) {
    advicePoolSelect.value = activeAdvicePoolModeId;
  }
  renderCardStatOptions();
  renderMatchEnvironmentOptions();
  renderMatchEnvironmentTable();
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
  picksBuilderTray?.addEventListener("click", handlePicksBuilderTrayClick);
  playerDetailClose?.addEventListener("click", closePlayerDetail);
  playerDetailModal?.addEventListener("click", handlePlayerDetailCloseClick);
  document.addEventListener("keydown", handlePlayerDetailKeydown);
  buildTeamButtonBottom.addEventListener("click", buildTeam);
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
  scoreInfoButton.addEventListener("click", toggleScoreInfo);
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
  [matchdayDecisionMatchdaySelect, matchdayDecisionRiskSelect, matchdayDecisionStarterSelect]
    .filter(Boolean)
    .forEach((select) => select.addEventListener("change", renderMatchdayDecisionCenter));
  [matchdayDecisionCaptainPointsInput, matchdayDecisionStarterPointsInput]
    .filter(Boolean)
    .forEach((input) => input.addEventListener("input", renderMatchdayDecisionCenter));
  matchdayDecisionCenterContent?.addEventListener("click", handleMatchdayDecisionCenterClick);
  captainChangeForm?.addEventListener("submit", renderCaptainChangeAdvisor);
  [captainChangeCurrentPlayerInput, captainChangeCurrentPointsInput, captainChangeCandidateInput]
    .filter(Boolean)
    .forEach((input) => input.addEventListener("input", renderCaptainChangeAdvisor));
  [captainChangeMatchdaySelect, captainChangeRiskSelect]
    .filter(Boolean)
    .forEach((select) => select.addEventListener("change", () => {
      renderSavedSquadDecisionPanels();
      renderCaptainChangeAdvisor();
    }));
  captainChangeSquadPanel?.addEventListener("click", handleCaptainSavedSquadClick);
  captainChangeResetButton?.addEventListener("click", resetCaptainChangeAdvisor);
  substitutionAdvisorForm?.addEventListener("submit", renderSubstitutionAdvisor);
  [substitutionAdvisorStarterInput, substitutionAdvisorPointsInput, substitutionAdvisorBenchInput]
    .filter(Boolean)
    .forEach((input) => input.addEventListener("input", renderSubstitutionAdvisor));
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
  console.error("Website data could not be loaded from playersData.js and fantasyRulesData.js.", error);
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
  builderWarning.textContent = "Website data could not load. Make sure playersData.js and fantasyRulesData.js are included before script.js, then refresh.";
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

initializeBuilder();
