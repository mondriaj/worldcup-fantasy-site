import { readFile, writeFile } from "node:fs/promises";

const TODAY = "2026-06-02";
const NOW = new Date().toISOString();

const PATHS = {
  playerMatchdayProjections: "data/playerMatchdayProjections_fantasyPool_v3.json",
  playerRecommendationInputs: "data/playerRecommendationInputs_v1.json",
  playerMinutesModel: "data/playerMinutesModel_fantasyPool_v0.json",
  recommendationFinanceDiagnostics: "data/recommendationFinanceDiagnostics_fantasyPool_v3.json",
  officialRules: "data/officialFantasyRules_v0.json",
  readiness: "data/officialDataReadiness_v0.json",
  activeValueModel: "data/playerValueModel_v1.json",
  activeFinanceMetrics: "data/playerFinanceMetrics_v0.json",
  valueOutput: "data/playerValueModel_fantasyPool_v2.json",
  financeOutput: "data/playerFinanceMetrics_fantasyPool_v1.json",
  qaOutput: "data/playerFinanceMetricsQa_fantasyPool_v1.json",
  reportOutput: "data/playerFinanceMetricsReport_fantasyPool_v1.md"
};

const MODEL_STAGE = "fantasy_pool_only";
const SOURCE_MODEL_VERSION = "fantasy_pool_finance_metrics_v1_preliminary_2026-06-02";
const DATA_STATUS = "staged_fantasy_pool_only_not_final_squad_backed";

const SAFETY_LABELS = [
  "fantasy_pool_only",
  "not final-squad-backed",
  "not final public recommendations",
  "not Team Builder-ready",
  "not browser-ready",
  "safe only for preliminary finance/value QA"
];

const REQUIRED_FLAGS = [
  "fantasy_pool_only",
  "not_final_squad_backed",
  "not_final_public_recommendations",
  "not_Team_Builder_ready",
  "not_browser_ready",
  "safe_only_for_preliminary_finance_value_QA"
];

const VALID_POSITIONS = ["GK", "DEF", "MID", "FWD"];

const PRICE_TIER_THRESHOLDS = {
  GK: [
    ["premium", 5.5],
    ["upper_mid", 5.0],
    ["mid_price", 4.5],
    ["budget", 4.0],
    ["ultra_budget", 0]
  ],
  DEF: [
    ["premium", 6.0],
    ["upper_mid", 5.0],
    ["mid_price", 4.5],
    ["budget", 4.0],
    ["ultra_budget", 0]
  ],
  MID: [
    ["premium", 8.5],
    ["upper_mid", 7.0],
    ["mid_price", 5.5],
    ["budget", 4.5],
    ["ultra_budget", 0]
  ],
  FWD: [
    ["premium", 9.0],
    ["upper_mid", 7.5],
    ["mid_price", 6.0],
    ["budget", 5.0],
    ["ultra_budget", 0]
  ]
};

const REPLACEMENT_RANK_BY_POSITION = {
  GK: 12,
  DEF: 20,
  MID: 20,
  FWD: 16
};

const STRONG_OPTION_TARGET_BY_POSITION = {
  GK: 8,
  DEF: 14,
  MID: 14,
  FWD: 10
};

const CONFIDENCE_WEIGHT = {
  high: 1,
  medium: 0.9,
  low: 0.75,
  missing: 0.65,
  thin_profile: 0.55,
  blocked: 0
};

const ROLE_RISK = {
  high: 8,
  medium: 25,
  low: 45,
  missing: 60,
  thin_profile: 75,
  blocked: 100
};

function round(value, digits = 3) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return null;
  const factor = 10 ** digits;
  return Math.round(Number(value) * factor) / factor;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function sum(values) {
  return values.reduce((total, value) => total + (Number(value) || 0), 0);
}

function mean(values) {
  const clean = values.filter((value) => Number.isFinite(Number(value)));
  return clean.length ? sum(clean) / clean.length : null;
}

function stddev(values) {
  const average = mean(values);
  if (average === null) return null;
  const clean = values.filter((value) => Number.isFinite(Number(value)));
  if (!clean.length) return null;
  const variance = clean.reduce((total, value) => total + (Number(value) - average) ** 2, 0) / clean.length;
  return Math.sqrt(variance);
}

function max(values) {
  const clean = values.filter((value) => Number.isFinite(Number(value)));
  return clean.length ? Math.max(...clean) : null;
}

function min(values) {
  const clean = values.filter((value) => Number.isFinite(Number(value)));
  return clean.length ? Math.min(...clean) : null;
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function writeJson(path, data) {
  await writeFile(path, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`Wrote ${path}`);
}

function playerKey(row) {
  return String(row.official_fantasy_player_id || row.internal_player_id || row.player_id || row.name);
}

function diagKey(row, scopeId) {
  return `${playerKey(row)}::${scopeId}`;
}

function uniqueFlags(...flagArrays) {
  return [...new Set(flagArrays.flat().filter(Boolean))].sort();
}

function hasAnyFlag(flags, fragments) {
  return fragments.some((fragment) => flags.some((flag) => String(flag).includes(fragment)));
}

function priceTier(position, price) {
  const thresholds = PRICE_TIER_THRESHOLDS[position] || PRICE_TIER_THRESHOLDS.MID;
  const numericPrice = Number(price);
  if (!Number.isFinite(numericPrice)) return "unknown";
  const tier = thresholds.find(([, minPrice]) => numericPrice >= minPrice);
  return tier ? tier[0] : "unknown";
}

function countBy(rows, keyFn) {
  return rows.reduce((counts, row) => {
    const key = keyFn(row) ?? "unknown";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function nestedCountBy(rows, outerFn, innerFn) {
  return rows.reduce((counts, row) => {
    const outer = outerFn(row) ?? "unknown";
    const inner = innerFn(row) ?? "unknown";
    counts[outer] ||= {};
    counts[outer][inner] = (counts[outer][inner] || 0) + 1;
    return counts;
  }, {});
}

function topRows(rows, sortFn, limit = 25) {
  return [...rows].sort(sortFn).slice(0, limit).map((row, index) => ({ rank: index + 1, ...row }));
}

function compactPlayer(row) {
  return {
    rank: row.rank,
    internal_player_id: row.internal_player_id,
    official_fantasy_player_id: row.official_fantasy_player_id,
    name: row.name,
    country: row.country,
    official_fantasy_position: row.official_fantasy_position,
    official_price: row.official_price,
    price_tier: row.price_tier,
    group_stage_risk_adjusted_points: row.group_stage_risk_adjusted_points,
    group_stage_expected_points: row.group_stage_expected_points,
    risk_adjusted_return: row.risk_adjusted_return,
    risk_adjusted_points_per_price: row.risk_adjusted_points_per_price,
    value_over_replacement: row.value_over_replacement,
    scarcity_adjusted_value: row.scarcity_adjusted_value,
    confidence_adjusted_value: row.confidence_adjusted_value,
    efficient_frontier: row.efficient_frontier,
    dominated_player: row.dominated_player,
    price_tier_opportunity_cost: row.price_tier_opportunity_cost,
    differential_defensibility_score: row.differential_defensibility_score,
    obviousness_proxy: row.obviousness_proxy,
    finance_flags: row.finance_flags
  };
}

function confidenceValue(confidence) {
  return CONFIDENCE_WEIGHT[confidence] ?? CONFIDENCE_WEIGHT.missing;
}

function roleRiskValue(confidence) {
  return ROLE_RISK[confidence] ?? ROLE_RISK.missing;
}

function positionScarcityScore(position, positionStrongOptions) {
  const target = STRONG_OPTION_TARGET_BY_POSITION[position] || 10;
  const strongOptions = Number(positionStrongOptions);
  if (!Number.isFinite(strongOptions)) return 0;
  return round(clamp(((target - Math.min(strongOptions, target)) / target) * 100, 0, 100), 1);
}

function majorRiskFlagCount(flags) {
  const majorFragments = [
    "not_final_squad_backed",
    "final_squad_source_missing",
    "squad_review_rows_present",
    "thin_profile",
    "missing_national_team_usage",
    "low_usage_confidence",
    "missing_club",
    "rules_manual_review",
    "mystery_booster_unknown",
    "deadline_semantics_review",
    "high_team_context_uncertainty",
    "position_conflict"
  ];
  return majorFragments.filter((fragment) => flags.some((flag) => String(flag).includes(fragment))).length;
}

function financeFlagsFor(row, groupDiag, risks) {
  const flags = new Set(REQUIRED_FLAGS);
  for (const flag of row.data_quality_flags || []) flags.add(flag);
  for (const flag of groupDiag?.finance_quality_flags || []) flags.add(flag);

  if (groupDiag?.efficient_frontier) flags.add("efficient_frontier");
  if (groupDiag?.dominated_player) flags.add("dominated_player");
  if (!row.final_squad_confirmed) {
    flags.add("fantasy_pool_only_not_final_squad_confirmed");
    flags.add("final_squad_source_missing");
  }
  if ((groupDiag?.value_over_replacement ?? 0) > 0) flags.add("above_replacement");
  if ((groupDiag?.value_over_replacement ?? 0) < 0) flags.add("below_replacement");
  if (risks.thin_profile_penalty > 0) flags.add("thin_profile_penalty");
  if (risks.missing_usage_penalty > 0) flags.add("missing_usage_penalty");
  if (risks.minutes_risk >= 45) flags.add("minutes_risk_elevated");
  if (risks.role_risk >= 45) flags.add("role_risk_elevated");
  if (risks.data_risk >= 60) flags.add("data_risk_elevated");
  if (risks.final_squad_uncertainty_risk > 0) flags.add("final_squad_uncertainty_risk");
  if (row.price_tier === "premium" && (groupDiag?.value_over_replacement ?? 0) < 0) flags.add("high_price_low_value");
  if (["budget", "ultra_budget"].includes(row.price_tier) && (groupDiag?.value_over_replacement ?? 0) > 0) flags.add("budget_high_value");
  if (row.country === "Brazil" && hasAnyFlag(row.data_quality_flags || [], ["high_team_context_uncertainty"])) flags.add("brazil_uncertainty");
  if (String(row.name || "").toLowerCase().includes("neymar")) flags.add("neymar_uncertainty_review");

  return [...flags].sort();
}

function buildMatchdayMetric(row, diag) {
  return {
    matchday: row.matchday,
    opponent: row.opponent,
    fixture_id: row.fixture_id,
    expected_points: round(row.raw_expected_points),
    risk_adjusted_points: round(row.risk_adjusted_points),
    ceiling_points: round(row.ceiling_points),
    floor_points: round(row.floor_points),
    captain_score: round(row.captain_score),
    official_price: row.official_price,
    points_per_price: round(diag?.points_per_price ?? (row.raw_expected_points / row.official_price), 4),
    risk_adjusted_points_per_price: round(diag?.risk_adjusted_points_per_price ?? (row.risk_adjusted_points / row.official_price), 4),
    value_over_replacement: round(diag?.value_over_replacement),
    scarcity_adjusted_value: round(diag?.scarcity_adjusted_value),
    efficient_frontier: Boolean(diag?.efficient_frontier),
    dominated_player: Boolean(diag?.dominated_player),
    price_tier_opportunity_cost: round(diag?.price_tier_opportunity_cost),
    position_scarcity_score: positionScarcityScore(row.official_fantasy_position, diag?.position_strong_options),
    matchday_scarcity_score: positionScarcityScore(row.official_fantasy_position, diag?.position_strong_options),
    differential_defensibility_score: round(diag?.differential_defensibility_score),
    obviousness_proxy: diag?.obviousness_proxy ?? null,
    projection_confidence: row.projection_confidence,
    start_probability: round(row.start_probability),
    expected_minutes: round(row.expected_minutes),
    finance_quality_flags: diag?.finance_quality_flags || []
  };
}

function buildRiskMetrics(rows, inputRow, minutesRow, flags) {
  const rawValues = rows.map((row) => Number(row.raw_expected_points));
  const riskAdjustedValues = rows.map((row) => Number(row.risk_adjusted_points));
  const ceilingValues = rows.map((row) => Number(row.ceiling_points));
  const floorValues = rows.map((row) => Number(row.floor_points));
  const startProbabilities = rows.map((row) => Number(row.start_probability));
  const expectedMinutes = rows.map((row) => Number(row.expected_minutes));
  const spreads = rows.map((row) => Number(row.ceiling_points) - Number(row.floor_points));

  const averageStart = mean(startProbabilities) ?? 0;
  const averageMinutes = mean(expectedMinutes) ?? 0;
  const roleConfidence = minutesRow?.role_confidence || inputRow?.role_confidence || rows[0]?.minutes_context?.role_confidence || "missing";
  const projectionConfidence = rows[0]?.projection_confidence || "missing";

  const volatilityProxy = (stddev(rawValues) || 0) + (mean(spreads) || 0) * 0.08;
  const rawMinusRisk = Math.max(0, sum(rawValues) - sum(riskAdjustedValues));
  const downsideRiskProxy = rawMinusRisk + Math.max(0, (mean(rawValues) || 0) - (min(floorValues) || 0)) * 0.25;

  const thinProfilePenalty = hasAnyFlag(flags, ["thin_profile"]) || roleConfidence === "thin_profile" ? 1.5 : 0;
  const missingUsagePenalty = hasAnyFlag(flags, ["missing_national_team_usage", "missing_usage"]) ? 1 : 0;
  const minutesRisk = clamp(
    (1 - averageStart) * 55 +
      Math.max(0, 65 - averageMinutes) * 0.5 +
      (hasAnyFlag(flags, ["minutes_uncertain"]) ? 15 : 0),
    0,
    100
  );
  const roleRisk = clamp(
    roleRiskValue(roleConfidence) +
      (hasAnyFlag(flags, ["role_unclear", "position_conflict"]) ? 10 : 0),
    0,
    100
  );
  const dataRisk = clamp(
    majorRiskFlagCount(flags) * 9 +
      (projectionConfidence === "low" ? 12 : 0) +
      (projectionConfidence === "thin_profile" ? 25 : 0),
    0,
    100
  );
  const finalSquadUncertaintyRisk = inputRow?.final_squad_confirmed ? 0 : 100;
  const uncertaintyPenalty =
    rawMinusRisk +
    (volatilityProxy || 0) * 0.18 +
    (minutesRisk / 100) * 1.2 +
    (roleRisk / 100) * 0.8 +
    (dataRisk / 100) * 1 +
    (finalSquadUncertaintyRisk / 100) * 0.75 +
    thinProfilePenalty +
    missingUsagePenalty;

  return {
    volatility_proxy: round(volatilityProxy),
    downside_risk_proxy: round(downsideRiskProxy),
    bad_week_floor: round(min(floorValues)),
    stress_case_floor: round(sum(floorValues) - volatilityProxy),
    minutes_risk: round(minutesRisk, 1),
    role_risk: round(roleRisk, 1),
    data_risk: round(dataRisk, 1),
    final_squad_uncertainty_risk: round(finalSquadUncertaintyRisk, 1),
    uncertainty_penalty: round(uncertaintyPenalty),
    thin_profile_penalty: round(thinProfilePenalty),
    missing_usage_penalty: round(missingUsagePenalty),
    average_start_probability: round(averageStart),
    average_expected_minutes: round(averageMinutes, 1)
  };
}

function addRanks(rows) {
  const rankSpecs = [
    ["value_over_replacement_rank", (row) => row.value_over_replacement],
    ["scarcity_adjusted_value_rank", (row) => row.scarcity_adjusted_value],
    ["risk_adjusted_return_rank", (row) => row.risk_adjusted_return],
    ["confidence_adjusted_value_rank", (row) => row.confidence_adjusted_value],
    ["risk_adjusted_points_per_price_rank", (row) => row.risk_adjusted_points_per_price]
  ];

  for (const [field, accessor] of rankSpecs) {
    [...rows]
      .sort((a, b) => (accessor(b) ?? -Infinity) - (accessor(a) ?? -Infinity))
      .forEach((row, index) => {
        row[field] = index + 1;
      });
  }

  for (const position of VALID_POSITIONS) {
    [...rows]
      .filter((row) => row.official_fantasy_position === position)
      .sort((a, b) => (b.value_over_replacement ?? -Infinity) - (a.value_over_replacement ?? -Infinity))
      .forEach((row, index) => {
        row.position_value_over_replacement_rank = index + 1;
      });
  }
}

function buildRows({ projections, recommendationInputs, minutesRows, financeDiagnostics }) {
  const inputsByPlayer = new Map(recommendationInputs.map((row) => [playerKey(row), row]));
  const minutesByPlayer = new Map(minutesRows.map((row) => [playerKey(row), row]));
  const diagnosticsByPlayerScope = new Map(financeDiagnostics.map((row) => [diagKey(row, row.scope_id), row]));

  const rowsByPlayer = projections.reduce((groups, row) => {
    const key = playerKey(row);
    groups.set(key, [...(groups.get(key) || []), row]);
    return groups;
  }, new Map());

  const financeRows = [];
  const valueRows = [];

  for (const [key, playerRows] of rowsByPlayer.entries()) {
    const rows = [...playerRows].sort((a, b) => String(a.matchday).localeCompare(String(b.matchday)));
    const first = rows[0];
    const inputRow = inputsByPlayer.get(key) || {};
    const minutesRow = minutesByPlayer.get(key) || {};
    const position = first.official_fantasy_position;
    const price = Number(first.official_price);
    const tier = priceTier(position, price);
    const groupDiag = diagnosticsByPlayerScope.get(`${key}::group_stage_full`);
    const allFlags = uniqueFlags(
      first.data_quality_flags || [],
      inputRow.data_quality_flags || [],
      minutesRow.data_quality_flags || [],
      minutesRow.minutes_risk_flags || [],
      groupDiag?.finance_quality_flags || []
    );
    const riskMetrics = buildRiskMetrics(rows, inputRow, minutesRow, allFlags);
    const groupRaw = sum(rows.map((row) => row.raw_expected_points));
    const groupRiskAdjusted = sum(rows.map((row) => row.risk_adjusted_points));
    const groupCeiling = sum(rows.map((row) => row.ceiling_points));
    const groupFloor = sum(rows.map((row) => row.floor_points));
    const groupCaptain = sum(rows.map((row) => row.captain_score));
    const confidenceMultiplier = confidenceValue(first.projection_confidence);
    const riskAdjustedReturn = Math.max(0, groupRiskAdjusted - riskMetrics.uncertainty_penalty);
    const matchdayMetrics = rows.map((row) =>
      buildMatchdayMetric(row, diagnosticsByPlayerScope.get(`${key}::${row.matchday}`))
    );
    const matchdayScarcity = mean(matchdayMetrics.map((row) => row.matchday_scarcity_score)) || 0;

    const base = {
      internal_player_id: first.internal_player_id,
      official_fantasy_player_id: first.official_fantasy_player_id,
      name: first.name,
      display_name: first.display_name,
      country: first.country,
      team_id: first.team_id,
      official_fantasy_position: position,
      official_price: round(price, 1),
      price_tier: tier,
      group_stage_expected_points: round(groupRaw),
      group_stage_risk_adjusted_points: round(groupRiskAdjusted),
      group_stage_ceiling_points: round(groupCeiling),
      group_stage_floor_points: round(groupFloor),
      captain_score: round(groupCaptain),
      points_per_price: round(groupDiag?.points_per_price ?? (groupRaw / price), 4),
      risk_adjusted_points_per_price: round(groupDiag?.risk_adjusted_points_per_price ?? (groupRiskAdjusted / price), 4),
      value_over_replacement: round(groupDiag?.value_over_replacement),
      scarcity_adjusted_value: round(groupDiag?.scarcity_adjusted_value),
      efficient_frontier: Boolean(groupDiag?.efficient_frontier),
      dominated_player: Boolean(groupDiag?.dominated_player),
      dominated_by: groupDiag?.dominated_by || null,
      price_tier_opportunity_cost: round(groupDiag?.price_tier_opportunity_cost),
      position_scarcity_score: positionScarcityScore(position, groupDiag?.position_strong_options),
      matchday_scarcity_score: round(matchdayScarcity, 1),
      confidence_adjusted_value: round((riskAdjustedReturn / price) * confidenceMultiplier, 4),
      differential_defensibility_score: round(groupDiag?.differential_defensibility_score),
      obviousness_proxy: groupDiag?.obviousness_proxy ?? null,
      risk_adjusted_return: round(riskAdjustedReturn),
      volatility_proxy: riskMetrics.volatility_proxy,
      downside_risk_proxy: riskMetrics.downside_risk_proxy,
      bad_week_floor: riskMetrics.bad_week_floor,
      stress_case_floor: riskMetrics.stress_case_floor,
      minutes_risk: riskMetrics.minutes_risk,
      role_risk: riskMetrics.role_risk,
      data_risk: riskMetrics.data_risk,
      final_squad_uncertainty_risk: riskMetrics.final_squad_uncertainty_risk,
      uncertainty_penalty: riskMetrics.uncertainty_penalty,
      thin_profile_penalty: riskMetrics.thin_profile_penalty,
      missing_usage_penalty: riskMetrics.missing_usage_penalty,
      average_start_probability: riskMetrics.average_start_probability,
      average_expected_minutes: riskMetrics.average_expected_minutes,
      projection_confidence: first.projection_confidence,
      role_label: minutesRow.role_label || first.minutes_context?.role_label || null,
      role_confidence: minutesRow.role_confidence || first.minutes_context?.role_confidence || null,
      selectable_status: first.selectable_status,
      roster_status: first.roster_status,
      final_squad_confirmed: Boolean(inputRow.final_squad_confirmed),
      fantasy_pool_only: true,
      data_quality_flags: allFlags,
      finance_flags: [],
      matchday_finance_metrics: matchdayMetrics,
      source_summary: {
        projection_source_model_version: first.source_model_version,
        recommendation_finance_diagnostics_source: PATHS.recommendationFinanceDiagnostics,
        official_rules_status: first.scoring_context?.official_rules_status || null,
        source_note: "Staged finance/value metrics derived from official fantasy prices, v3 fantasy-pool projections, preliminary minutes model, and recommendation finance diagnostics."
      },
      model_stage: MODEL_STAGE,
      source_model_version: SOURCE_MODEL_VERSION
    };

    base.finance_flags = financeFlagsFor(base, groupDiag, riskMetrics);

    financeRows.push(base);
    valueRows.push({
      internal_player_id: base.internal_player_id,
      official_fantasy_player_id: base.official_fantasy_player_id,
      name: base.name,
      display_name: base.display_name,
      country: base.country,
      team_id: base.team_id,
      official_fantasy_position: base.official_fantasy_position,
      official_price: base.official_price,
      price_tier: base.price_tier,
      group_stage_expected_points: base.group_stage_expected_points,
      group_stage_risk_adjusted_points: base.group_stage_risk_adjusted_points,
      group_stage_ceiling_points: base.group_stage_ceiling_points,
      group_stage_floor_points: base.group_stage_floor_points,
      points_per_price: base.points_per_price,
      risk_adjusted_points_per_price: base.risk_adjusted_points_per_price,
      value_over_replacement: base.value_over_replacement,
      scarcity_adjusted_value: base.scarcity_adjusted_value,
      confidence_adjusted_value: base.confidence_adjusted_value,
      efficient_frontier: base.efficient_frontier,
      dominated_player: base.dominated_player,
      price_tier_opportunity_cost: base.price_tier_opportunity_cost,
      position_scarcity_score: base.position_scarcity_score,
      matchday_scarcity_score: base.matchday_scarcity_score,
      risk_adjusted_return: base.risk_adjusted_return,
      differential_defensibility_score: base.differential_defensibility_score,
      obviousness_proxy: base.obviousness_proxy,
      value_label: null,
      finance_flags: base.finance_flags,
      matchday_values: matchdayMetrics,
      model_stage: MODEL_STAGE,
      source_model_version: SOURCE_MODEL_VERSION
    });
  }

  addRanks(financeRows);
  addRanks(valueRows);

  for (const row of valueRows) {
    if (row.efficient_frontier && row.value_over_replacement > 0) row.value_label = "frontier_value";
    else if (row.value_over_replacement > 0) row.value_label = "above_replacement_value";
    else if (row.dominated_player) row.value_label = "dominated_value";
    else row.value_label = "watchlist_value";
  }

  return { financeRows, valueRows };
}

function buildDifferentialAudit(financeDiagnostics) {
  const hasMode = (row, mode) => (row.candidate_modes || []).some((candidate) => candidate.mode === mode);
  const differentialRows = financeDiagnostics.filter((row) => hasMode(row, "differential"));
  const dominated = differentialRows.filter((row) => row.dominated_player);
  const frontier = differentialRows.filter((row) => row.efficient_frontier);
  const defensibleDominated = dominated.filter(
    (row) =>
      (Number(row.value_over_replacement) > 0 || Number(row.differential_defensibility_score) >= 60) &&
      Number(row.obviousness_proxy || 0) <= 5
  );

  return {
    differential_candidate_rows: differentialRows.length,
    efficient_frontier_rows: frontier.length,
    dominated_rows: dominated.length,
    dominated_but_defensible_rows: defensibleDominated.length,
    dominated_by_position: countBy(dominated, (row) => row.official_fantasy_position),
    dominated_by_scope: countBy(dominated, (row) => row.scope_id),
    discussion:
      "Dominated Differential rows are not automatically bugs because dominance is tested against same-position or same-price-band alternatives, while Differential also values low obviousness and matchday context. The count is still high enough that future Differential scoring should prefer efficient-frontier rows more strongly.",
    top_dominated_differential_candidates: topRows(
      dominated,
      (a, b) => (b.differential_defensibility_score || 0) - (a.differential_defensibility_score || 0),
      25
    ).map((row) => ({
      rank: row.rank,
      name: row.name,
      country: row.country,
      official_fantasy_position: row.official_fantasy_position,
      matchday: row.matchday,
      official_price: row.official_price,
      risk_adjusted_points: row.risk_adjusted_points,
      value_over_replacement: row.value_over_replacement,
      scarcity_adjusted_value: row.scarcity_adjusted_value,
      differential_defensibility_score: row.differential_defensibility_score,
      obviousness_proxy: row.obviousness_proxy,
      dominated_by: row.dominated_by,
      candidate_modes: row.candidate_modes
    }))
  };
}

function buildQa({ financeRows, valueRows, projectionData, financeDiagnostics, readiness }) {
  const modeledPlayerCount = projectionData.summary?.players_projected || new Set(projectionData.playerMatchdayProjections.map(playerKey)).size;
  const blockedPlayers = projectionData.blockedPlayers || [];
  const missingPrices = financeRows.filter((row) => !Number.isFinite(Number(row.official_price)));
  const missingPositions = financeRows.filter((row) => !VALID_POSITIONS.includes(row.official_fantasy_position));
  const impossibleTiers = financeRows.filter((row) => row.price_tier === "unknown");
  const negativePointsPerPrice = financeRows.filter((row) => Number(row.points_per_price) < 0);
  const missingFlags = financeRows.filter((row) => !row.finance_flags.includes("fantasy_pool_only"));
  const differentialAudit = buildDifferentialAudit(financeDiagnostics);
  const highPriceLowValue = financeRows.filter((row) => row.price_tier === "premium" && row.value_over_replacement < 0);
  const budgetHighValue = financeRows.filter(
    (row) => ["budget", "ultra_budget"].includes(row.price_tier) && row.value_over_replacement > 0
  );
  const neymarRows = financeRows.filter((row) => String(row.name || "").toLowerCase().includes("neymar"));
  const brazilUncertaintyRows = financeRows.filter((row) => row.finance_flags.includes("brazil_uncertainty"));
  const dominatedCandidateRows = financeRows.filter(
    (row) => row.dominated_player && financeDiagnostics.some((diag) => diagKey(row, "group_stage_full") === diagKey(diag, diag.scope_id) && (diag.candidate_modes || []).length)
  );

  const checks = [
    {
      id: "all_modeled_players_have_finance_metrics",
      status: financeRows.length === modeledPlayerCount ? "pass" : "fail",
      expected: modeledPlayerCount,
      actual: financeRows.length
    },
    {
      id: "blocked_players_excluded_or_flagged",
      status: blockedPlayers.length > 0 ? "warning" : "pass",
      count: blockedPlayers.length,
      details: "Blocked players are excluded from active finance metrics and retained in QA only."
    },
    { id: "no_missing_official_prices", status: missingPrices.length ? "fail" : "pass", count: missingPrices.length },
    { id: "no_missing_official_positions", status: missingPositions.length ? "fail" : "pass", count: missingPositions.length },
    { id: "valid_position_specific_price_tiers", status: impossibleTiers.length ? "fail" : "pass", count: impossibleTiers.length },
    {
      id: "no_negative_points_per_price_without_justification",
      status: negativePointsPerPrice.length ? "warning" : "pass",
      count: negativePointsPerPrice.length,
      details: negativePointsPerPrice.length
        ? "Negative values can be produced only by official scoring and difficult defensive fixtures; inspect before Team Builder use."
        : "No negative player-level group-stage points-per-price rows."
    },
    { id: "staged_labels_present", status: missingFlags.length ? "fail" : "pass", count: missingFlags.length },
    {
      id: "readiness_gate_still_blocked",
      status: readiness.status === "blocked_waiting_for_official_fantasy_data" ? "warning" : "fail",
      readiness_status: readiness.status
    }
  ];

  const failedChecks = checks.filter((check) => check.status === "fail");
  const warningChecks = checks.filter((check) => check.status === "warning");

  return {
    schema_version: "player_finance_metrics_qa_fantasy_pool_v1",
    generated_at: NOW,
    source_checked: TODAY,
    model_stage: MODEL_STAGE,
    data_status: DATA_STATUS,
    overall_status: failedChecks.length ? "fail" : "pass_with_staging_stop_conditions",
    safety_labels: SAFETY_LABELS,
    source_files: {
      playerMatchdayProjections: PATHS.playerMatchdayProjections,
      playerRecommendationInputs: PATHS.playerRecommendationInputs,
      playerMinutesModel: PATHS.playerMinutesModel,
      recommendationFinanceDiagnostics: PATHS.recommendationFinanceDiagnostics,
      officialRules: PATHS.officialRules,
      readiness: PATHS.readiness,
      preserved_active_value_model: PATHS.activeValueModel,
      preserved_active_finance_metrics: PATHS.activeFinanceMetrics
    },
    summary: {
      players_with_finance_metrics: financeRows.length,
      value_model_rows: valueRows.length,
      modeled_players_expected: modeledPlayerCount,
      blocked_players_excluded: blockedPlayers.length,
      efficient_frontier_players: financeRows.filter((row) => row.efficient_frontier).length,
      dominated_players: financeRows.filter((row) => row.dominated_player).length,
      above_replacement_players: financeRows.filter((row) => row.value_over_replacement > 0).length,
      final_squad_uncertainty_rows: financeRows.filter((row) => row.final_squad_uncertainty_risk > 0).length,
      neymar_rows: neymarRows.length,
      brazil_uncertainty_rows: brazilUncertaintyRows.length,
      safe_for_preliminary_finance_value_qa: true,
      safe_for_preliminary_team_builder_staging: true,
      safe_for_final_team_builder_promotion: false,
      safe_for_public_promotion: false
    },
    price_tier_counts_by_position: nestedCountBy(financeRows, (row) => row.official_fantasy_position, (row) => row.price_tier),
    efficient_frontier_counts_by_position: countBy(financeRows.filter((row) => row.efficient_frontier), (row) => row.official_fantasy_position),
    dominated_counts_by_position: countBy(financeRows.filter((row) => row.dominated_player), (row) => row.official_fantasy_position),
    finance_flag_counts: financeRows.reduce((counts, row) => {
      for (const flag of row.finance_flags || []) counts[flag] = (counts[flag] || 0) + 1;
      return counts;
    }, {}),
    top_25_value_over_replacement: topRows(financeRows, (a, b) => b.value_over_replacement - a.value_over_replacement).map(compactPlayer),
    top_25_scarcity_adjusted_value: topRows(financeRows, (a, b) => b.scarcity_adjusted_value - a.scarcity_adjusted_value).map(compactPlayer),
    top_25_risk_adjusted_return: topRows(financeRows, (a, b) => b.risk_adjusted_return - a.risk_adjusted_return).map(compactPlayer),
    top_25_efficient_frontier_candidates: topRows(
      financeRows.filter((row) => row.efficient_frontier),
      (a, b) => b.confidence_adjusted_value - a.confidence_adjusted_value
    ).map(compactPlayer),
    top_25_dominated_recommendation_candidates: topRows(
      dominatedCandidateRows,
      (a, b) => b.differential_defensibility_score - a.differential_defensibility_score
    ).map(compactPlayer),
    high_price_low_value_players: topRows(highPriceLowValue, (a, b) => a.value_over_replacement - b.value_over_replacement).map(compactPlayer),
    budget_high_value_players: topRows(budgetHighValue, (a, b) => b.value_over_replacement - a.value_over_replacement).map(compactPlayer),
    differential_dominated_candidate_audit: differentialAudit,
    checks,
    stop_conditions: [
      {
        id: "final_squads_not_source_backed",
        status: "active",
        count: financeRows.filter((row) => row.final_squad_uncertainty_risk > 0).length,
        details: "Finance metrics are not final-squad-backed."
      },
      {
        id: "rules_manual_review",
        status: "active",
        count: financeRows.filter((row) => row.finance_flags.includes("rules_manual_review")).length,
        details: "Official fantasy rules still include manual-review warnings."
      },
      {
        id: "browser_ready_files_not_updated",
        status: "active",
        count: 1,
        details: "No browser-ready finance, Team Builder, recommendation, captain, or substitution files were updated."
      },
      {
        id: "readiness_blocked",
        status: readiness.status,
        count: 1,
        details: "Official-data readiness remains blocked."
      }
    ],
    warnings: warningChecks,
    failures: failedChecks,
    recommended_next_step:
      "Use this staged finance layer for preliminary Team Builder and Fantasy Finance QA only; resolve final squad and official rules blockers before public promotion."
  };
}

function markdownTable(rows, columns) {
  if (!rows.length) return "_None._";
  const header = `| ${columns.map((column) => column.label).join(" | ")} |`;
  const divider = `| ${columns.map(() => "---").join(" | ")} |`;
  const body = rows
    .map((row) => `| ${columns.map((column) => String(column.value(row) ?? "")).join(" | ")} |`)
    .join("\n");
  return `${header}\n${divider}\n${body}`;
}

function buildReport({ qa, financeRows }) {
  const tierRows = Object.entries(PRICE_TIER_THRESHOLDS).flatMap(([position, tiers]) =>
    tiers.map(([tier, minPrice]) => ({ position, tier, minPrice }))
  );
  const replacementRows = Object.entries(REPLACEMENT_RANK_BY_POSITION).map(([position, rank]) => ({ position, rank }));
  const topValueByPosition = VALID_POSITIONS.flatMap((position) =>
    topRows(
      financeRows.filter((row) => row.official_fantasy_position === position),
      (a, b) => b.value_over_replacement - a.value_over_replacement,
      5
    )
  );

  return `# Player Finance Metrics Fantasy Pool v1

Generated: ${NOW}

Model stage: ${MODEL_STAGE}. This file is fantasy_pool_only, not final-squad-backed, not final public recommendations, not Team Builder-ready, not browser-ready, and safe only for preliminary finance/value QA.

## Purpose

This staged layer turns official fantasy prices, v3 fantasy-pool projections, preliminary minutes, and recommendation finance diagnostics into player-level value and risk metrics. It is intended to prepare future Team Builder and Fantasy Finance work without promoting any active product files.

## Inputs Used

- ${PATHS.playerMatchdayProjections}
- ${PATHS.playerRecommendationInputs}
- ${PATHS.playerMinutesModel}
- ${PATHS.recommendationFinanceDiagnostics}
- ${PATHS.officialRules}

Preserved active files:

- ${PATHS.activeValueModel}
- ${PATHS.activeFinanceMetrics}

## Why Fantasy Pool Only

Final squads are not source-backed and official rules still carry manual-review warnings. All rows carry final-squad uncertainty and staged-only flags. These metrics are not suitable for public recommendations or final Team Builder promotion.

## Formulas

- Expected points: sum of v3 raw expected points across group-stage matchdays.
- Risk-adjusted points: sum of v3 risk-adjusted points across group-stage matchdays.
- Points per price: expected points divided by official fantasy price.
- Risk-adjusted points per price: risk-adjusted points divided by official fantasy price.
- Value over replacement: imported from recommendation finance diagnostics using position-specific replacement levels.
- Scarcity-adjusted value: value over replacement plus small scarcity bonuses for position, price tier, matchday, and diversification.
- Confidence-adjusted value: risk-adjusted return divided by price and dampened by projection confidence.
- Volatility proxy: matchday expected-point standard deviation plus a small projection-spread term.
- Downside risk proxy: projection risk gap plus bad-floor exposure.
- Stress-case floor: group-stage floor minus volatility proxy.
- Uncertainty penalty: projection risk gap plus minutes, role, data, final-squad, thin-profile, and missing-usage penalties.

## Price Tier Thresholds

Thresholds are position-specific; no global price tier is used.

${markdownTable(tierRows, [
  { label: "Position", value: (row) => row.position },
  { label: "Tier", value: (row) => row.tier },
  { label: "Minimum price", value: (row) => row.minPrice }
])}

## Replacement-Level Rules

Replacement level is position-specific within the group-stage scope.

${markdownTable(replacementRows, [
  { label: "Position", value: (row) => row.position },
  { label: "Replacement rank", value: (row) => row.rank }
])}

## Efficient Frontier Definition

A player is dominated if another player in the same position or same price band has higher or similar risk-adjusted points, lower or similar official price, equal or better confidence, and equal or fewer major risk flags. Efficient-frontier rows are not clearly dominated under that rule.

## Coverage Summary

- Players with finance metrics: ${qa.summary.players_with_finance_metrics}
- Blocked players excluded: ${qa.summary.blocked_players_excluded}
- Efficient-frontier players: ${qa.summary.efficient_frontier_players}
- Dominated players: ${qa.summary.dominated_players}
- Above-replacement players: ${qa.summary.above_replacement_players}
- Final-squad uncertainty rows: ${qa.summary.final_squad_uncertainty_rows}
- Neymar rows: ${qa.summary.neymar_rows}
- Brazil uncertainty rows: ${qa.summary.brazil_uncertainty_rows}
- QA status: ${qa.overall_status}

## Price Tier Counts By Position

${markdownTable(
  Object.entries(qa.price_tier_counts_by_position).flatMap(([position, tiers]) =>
    Object.entries(tiers).map(([tier, count]) => ({ position, tier, count }))
  ),
  [
    { label: "Position", value: (row) => row.position },
    { label: "Tier", value: (row) => row.tier },
    { label: "Players", value: (row) => row.count }
  ]
)}

## Frontier And Dominated Counts

${markdownTable(
  VALID_POSITIONS.map((position) => ({
    position,
    frontier: qa.efficient_frontier_counts_by_position[position] || 0,
    dominated: qa.dominated_counts_by_position[position] || 0
  })),
  [
    { label: "Position", value: (row) => row.position },
    { label: "Efficient frontier", value: (row) => row.frontier },
    { label: "Dominated", value: (row) => row.dominated }
  ]
)}

## Top Value Over Replacement Players

${markdownTable(qa.top_25_value_over_replacement.slice(0, 15), [
  { label: "Rank", value: (row) => row.rank },
  { label: "Player", value: (row) => row.name },
  { label: "Country", value: (row) => row.country },
  { label: "Pos", value: (row) => row.official_fantasy_position },
  { label: "Price", value: (row) => row.official_price },
  { label: "VOR", value: (row) => row.value_over_replacement },
  { label: "Scarcity value", value: (row) => row.scarcity_adjusted_value },
  { label: "Frontier", value: (row) => row.efficient_frontier }
])}

## Top Value Players By Position

${markdownTable(topValueByPosition, [
  { label: "Rank", value: (row) => row.rank },
  { label: "Player", value: (row) => row.name },
  { label: "Country", value: (row) => row.country },
  { label: "Pos", value: (row) => row.official_fantasy_position },
  { label: "Price", value: (row) => row.official_price },
  { label: "VOR", value: (row) => row.value_over_replacement },
  { label: "Risk adj / price", value: (row) => row.risk_adjusted_points_per_price }
])}

## Top Risk-Adjusted Return Players

${markdownTable(qa.top_25_risk_adjusted_return.slice(0, 15), [
  { label: "Rank", value: (row) => row.rank },
  { label: "Player", value: (row) => row.name },
  { label: "Country", value: (row) => row.country },
  { label: "Pos", value: (row) => row.official_fantasy_position },
  { label: "Risk adj return", value: (row) => row.risk_adjusted_return },
  { label: "Conf adj value", value: (row) => row.confidence_adjusted_value }
])}

## Top Frontier Players

${markdownTable(qa.top_25_efficient_frontier_candidates.slice(0, 15), [
  { label: "Rank", value: (row) => row.rank },
  { label: "Player", value: (row) => row.name },
  { label: "Country", value: (row) => row.country },
  { label: "Pos", value: (row) => row.official_fantasy_position },
  { label: "Price", value: (row) => row.official_price },
  { label: "Conf adj value", value: (row) => row.confidence_adjusted_value },
  { label: "VOR", value: (row) => row.value_over_replacement }
])}

## Differential Dominated-Candidate Discussion

- Differential candidate rows audited: ${qa.differential_dominated_candidate_audit.differential_candidate_rows}
- Differential efficient-frontier rows: ${qa.differential_dominated_candidate_audit.efficient_frontier_rows}
- Differential dominated rows: ${qa.differential_dominated_candidate_audit.dominated_rows}
- Dominated but still defensible rows: ${qa.differential_dominated_candidate_audit.dominated_but_defensible_rows}

${qa.differential_dominated_candidate_audit.discussion}

## High-Price Low-Value Players

${markdownTable(qa.high_price_low_value_players.slice(0, 15), [
  { label: "Rank", value: (row) => row.rank },
  { label: "Player", value: (row) => row.name },
  { label: "Country", value: (row) => row.country },
  { label: "Pos", value: (row) => row.official_fantasy_position },
  { label: "Price", value: (row) => row.official_price },
  { label: "VOR", value: (row) => row.value_over_replacement },
  { label: "Opportunity cost", value: (row) => row.price_tier_opportunity_cost }
])}

## Budget High-Value Players

${markdownTable(qa.budget_high_value_players.slice(0, 15), [
  { label: "Rank", value: (row) => row.rank },
  { label: "Player", value: (row) => row.name },
  { label: "Country", value: (row) => row.country },
  { label: "Pos", value: (row) => row.official_fantasy_position },
  { label: "Price", value: (row) => row.official_price },
  { label: "VOR", value: (row) => row.value_over_replacement },
  { label: "Scarcity value", value: (row) => row.scarcity_adjusted_value }
])}

## QA Checks

${markdownTable(qa.checks, [
  { label: "Check", value: (row) => row.id },
  { label: "Status", value: (row) => row.status },
  { label: "Count", value: (row) => row.count ?? row.actual ?? "" }
])}

## How This Can Feed Team Builder Later

This layer can support preliminary portfolio-style Team Builder staging by supplying price-tier, frontier, dominated, value-over-replacement, opportunity-cost, volatility, downside, minutes-risk, role-risk, and final-squad-risk fields. It should remain an input candidate only until final squads and official rule warnings are resolved.

## Stop Conditions Before Team Builder

- Final squads are not source-backed.
- Official rules still require manual review.
- Browser-ready files were not regenerated.
- Active v2 recommendation, Team Builder, captain, and substitution files were not updated.

## Stop Conditions Before Public Promotion

- Official-data readiness remains blocked.
- These outputs are fantasy_pool_only and not final-squad-backed.
- The finance metrics are not backtested against official fantasy outcomes.
- The Differential dominated-candidate count should be reviewed before any public value mode.
`;
}

async function main() {
  const [
    projectionsData,
    recommendationInputsData,
    minutesData,
    financeDiagnosticsData,
    officialRulesData,
    readinessData
  ] = await Promise.all([
    readJson(PATHS.playerMatchdayProjections),
    readJson(PATHS.playerRecommendationInputs),
    readJson(PATHS.playerMinutesModel),
    readJson(PATHS.recommendationFinanceDiagnostics),
    readJson(PATHS.officialRules),
    readJson(PATHS.readiness)
  ]);

  const projections = projectionsData.playerMatchdayProjections || [];
  const recommendationInputs = recommendationInputsData.players || [];
  const minutesRows = minutesData.playerMinutesModel || [];
  const financeDiagnostics = financeDiagnosticsData.player_finance_diagnostics || [];

  const { financeRows, valueRows } = buildRows({
    projections,
    recommendationInputs,
    minutesRows,
    financeDiagnostics
  });

  const qa = buildQa({
    financeRows,
    valueRows,
    projectionData: projectionsData,
    financeDiagnostics,
    readiness: readinessData
  });

  const sharedMetadata = {
    generated_at: NOW,
    source_checked: TODAY,
    model_stage: MODEL_STAGE,
    data_status: DATA_STATUS,
    safety_labels: SAFETY_LABELS,
    browser_ready_files_updated: false,
    active_files_preserved: [PATHS.activeValueModel, PATHS.activeFinanceMetrics],
    source_files: {
      playerMatchdayProjections: PATHS.playerMatchdayProjections,
      playerRecommendationInputs: PATHS.playerRecommendationInputs,
      playerMinutesModel: PATHS.playerMinutesModel,
      recommendationFinanceDiagnostics: PATHS.recommendationFinanceDiagnostics,
      officialRules: PATHS.officialRules,
      readiness: PATHS.readiness
    },
    rules_context: {
      official_rules_status: officialRulesData.officialFantasyRules?.rulesStatus || officialRulesData.data_status,
      rules_version: officialRulesData.officialFantasyRules?.rulesVersion || null
    }
  };

  const valueOutput = {
    schema_version: "player_value_model_fantasy_pool_v2",
    ...sharedMetadata,
    model_notes: [
      "Staged fantasy_pool_only value model using official fantasy prices and v3 projections.",
      "Does not overwrite active proxy-price playerValueModel_v1.json.",
      "Not final-squad-backed and not safe for public recommendations or Team Builder promotion."
    ],
    methodology: {
      price_tiers: PRICE_TIER_THRESHOLDS,
      replacement_ranks: REPLACEMENT_RANK_BY_POSITION,
      value_over_replacement:
        "Position-specific replacement level by group-stage risk-adjusted points: GK 12th, DEF 20th, MID 20th, FWD 16th.",
      efficient_frontier:
        "A player is frontier if no same-position or same-price-band alternative clearly dominates on risk-adjusted points, price, confidence, and major risk flags."
    },
    summary: {
      player_count: valueRows.length,
      rows_with_official_prices: valueRows.filter((row) => Number.isFinite(Number(row.official_price))).length,
      efficient_frontier_players: valueRows.filter((row) => row.efficient_frontier).length,
      dominated_players: valueRows.filter((row) => row.dominated_player).length,
      above_replacement_players: valueRows.filter((row) => row.value_over_replacement > 0).length,
      price_tier_counts_by_position: qa.price_tier_counts_by_position
    },
    playerValueModel: valueRows
  };

  const financeOutput = {
    schema_version: "player_finance_metrics_fantasy_pool_v1",
    ...sharedMetadata,
    model_notes: {
      purpose:
        "Treat staged fantasy-pool players as portfolio assets using official price, projected return, volatility proxy, downside proxy, replacement value, scarcity, and final-squad uncertainty.",
      model_status:
        "Preliminary fantasy_pool_only finance/value QA. Not final-squad-backed, not browser-ready, and not safe for public promotion.",
      risk_definition:
        "Risk is derived from v3 projection spread, raw-vs-risk-adjusted gap, minutes risk, role risk, data risk, final-squad uncertainty, thin-profile penalty, and missing-usage penalty.",
      caveats:
        "No ownership data, no final squads, no invented event rates, and no public recommendation promotion."
    },
    methodology: {
      price_tiers: PRICE_TIER_THRESHOLDS,
      replacement_ranks: REPLACEMENT_RANK_BY_POSITION,
      efficient_frontier_definition:
        "Dominated if another same-position or same-price-band player has similar or better risk-adjusted points, lower or similar price, equal/better confidence, and no worse major risk flags.",
      volatility_proxy: "Standard deviation of matchday raw expected points plus 8 percent of average ceiling-to-floor spread.",
      stress_case_floor: "Group-stage floor minus volatility proxy.",
      confidence_adjusted_value: "Risk-adjusted return per official price, multiplied by projection confidence weight."
    },
    summary: qa.summary,
    playerFinanceMetrics: financeRows
  };

  const report = buildReport({ qa, financeRows });

  await writeJson(PATHS.valueOutput, valueOutput);
  await writeJson(PATHS.financeOutput, financeOutput);
  await writeJson(PATHS.qaOutput, qa);
  await writeFile(PATHS.reportOutput, report);
  console.log(`Wrote ${PATHS.reportOutput}`);
  console.log(`Finance metric players: ${financeRows.length}`);
  console.log(`QA status: ${qa.overall_status}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
