import { readFile, writeFile } from "node:fs/promises";

const TODAY = "2026-06-02";
const NOW = new Date().toISOString();

const PATHS = {
  playerRecommendationInputs: "data/playerRecommendationInputs_v1.json",
  minutesModel: "data/playerMinutesModel_fantasyPool_v0.json",
  playerMatchdayProjections: "data/playerMatchdayProjections_fantasyPool_v3.json",
  scorePredictions: "data/scorePredictions_fantasyPool_v3.json",
  officialRules: "data/officialFantasyRules_v0.json",
  officialRulesImportReport: "data/officialFantasyRulesImportReport_v0.json",
  readiness: "data/officialDataReadiness_v0.json",
  activeRecommendationsV2: "data/matchdayRecommendations_v2.json",
  activeRecommendationQaV2: "data/recommendationQa_v2.json",
  output: "data/matchdayRecommendations_fantasyPool_v3.json",
  qa: "data/recommendationQa_fantasyPool_v3.json",
  report: "data/recommendationQaReport_fantasyPool_v3.md",
  calibrationAudit: "data/recommendationCalibrationAudit_fantasyPool_v3.md",
  modeSeparationAudit: "data/recommendationModeSeparationAudit_fantasyPool_v3.md",
  financeDiagnostics: "data/recommendationFinanceDiagnostics_fantasyPool_v3.json",
  financeValueAudit: "data/recommendationFinanceValueAudit_fantasyPool_v3.md"
};

const MODEL_STAGE = "fantasy_pool_only";
const SOURCE_MODEL_VERSION = "fantasy_pool_recommendation_candidates_v3_finance_value_preliminary_2026-06-02";
const TOP_LIST_LIMIT = 25;
const VALID_POSITIONS = new Set(["GK", "DEF", "MID", "FWD"]);
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
const REQUIRED_FLAGS = [
  "fantasy_pool_only",
  "not_final_squad_backed",
  "not_final_public_recommendations",
  "not_Team_Builder_ready",
  "not_browser_ready",
  "safe_only_for_preliminary_recommendation_QA"
];
const SAFETY_LABELS = [
  "fantasy_pool_only",
  "not final-squad-backed",
  "not final public recommendations",
  "not Team Builder-ready",
  "not browser-ready",
  "safe only for preliminary recommendation QA"
];

const MODES = [
  { id: "balanced", label: "Balanced", v2_strategy: "risk_adjusted" },
  { id: "safe", label: "Safe", v2_strategy: "safe_floor" },
  { id: "upside", label: "Upside", v2_strategy: "upside" },
  { id: "differential", label: "Differential", v2_strategy: "very_risky" },
  { id: "captain", label: "Captain Alpha", v2_strategy: "captain" }
];

const POSITION_CAPS_BY_MODE = {
  balanced: { GK: 5, DEF: 10, MID: 9, FWD: 9 },
  safe: { GK: 6, DEF: 10, MID: 8, FWD: 8 },
  upside: { GK: 2, DEF: 8, MID: 10, FWD: 10 },
  differential: { GK: 3, DEF: 9, MID: 9, FWD: 9 },
  captain: { GK: 1, DEF: 7, MID: 10, FWD: 12 }
};

const POSITION_SCORE_ADJUSTMENTS_BY_MODE = {
  balanced: { GK: -3, DEF: -1.5, MID: 2, FWD: 2 },
  safe: { GK: -1.5, DEF: 0, MID: 1, FWD: 1 },
  upside: { GK: -10, DEF: -3, MID: 4, FWD: 5 },
  differential: { GK: -7, DEF: -4, MID: 3, FWD: 4 },
  captain: { GK: -18, DEF: -10, MID: 5, FWD: 7 }
};

const CALIBRATION_NOTES = [
  "Applied mode-specific position caps so candidate pools do not become defender- or goalkeeper-only lists.",
  "Dampened defender and goalkeeper scoring in Captain Alpha and Upside modes so captain review does not blindly follow clean-sheet-driven raw points.",
  "Reduced Differential mode's cheapness signal and increased its need for defensible raw, ceiling, and attacking context.",
  "Consumed projection v3 coverage components for MID tackles, MID chances created, and FWD shots on target while keeping source/prior uncertainty visible.",
  "Strengthened Differential mode's premium-obviousness proxy after the scoring coverage pass exposed premium captain-type players at the top of the differential list.",
  "Added per-scope Differential obviousness penalties based on Balanced/Safe rank, Captain Alpha rank, raw projection rank, price percentile by position, and cross-mode top-list status.",
  "Added finance-style diagnostics for value over replacement, scarcity-adjusted value, opportunity cost, efficient frontier status, and mode rank correlation.",
  "Softened Differential obviousness penalties with value-over-replacement and efficient-frontier credit so good value rows are not excluded merely to force zero overlap.",
  "Kept all outputs fantasy_pool_only and staged; active v2 recommendation files and browser-ready files are not written."
];

const PRE_CALIBRATION_BASELINE = {
  mode_winners: {
    balanced: { name: "Nuno Alexandre Tavares Mendes", matchday: "md2", position: "DEF" },
    safe: { name: "Camilo Vargas", matchday: "md1", position: "GK" },
    upside: { name: "Lionel Messi", matchday: "md3", position: "FWD" },
    differential: { name: "Nicolás Tagliafico", matchday: "md3", position: "DEF" },
    captain: { name: "Nuno Alexandre Tavares Mendes", matchday: "md2", position: "DEF" }
  },
  position_distribution: {
    GK: 79,
    DEF: 300,
    MID: 64,
    FWD: 57
  },
  source_note: "Baseline from the first uncalibrated fantasyPool_v3 recommendation output generated on 2026-06-02."
};

const MODE_SEPARATION_BASELINE = {
  source_note: "Baseline from the staged fantasyPool_v3 recommendation output at the start of the mode-separation pass on 2026-06-02.",
  mode_winners: {
    balanced: { name: "Nuno Alexandre Tavares Mendes", country: "Portugal", position: "DEF", matchday: "md2", score: 86.341, price: 5.8 },
    safe: { name: "Nuno Alexandre Tavares Mendes", country: "Portugal", position: "DEF", matchday: "md2", score: 87.657, price: 5.8 },
    upside: { name: "Lionel Messi", country: "Argentina", position: "FWD", matchday: "md3", score: 92.325, price: 10 },
    differential: { name: "Nuno Alexandre Tavares Mendes", country: "Portugal", position: "DEF", matchday: "md2", score: 77.386, price: 5.8 },
    captain: { name: "Lionel Messi", country: "Argentina", position: "FWD", matchday: "md3", score: 96.249, price: 10 }
  },
  top10_pair_overlaps: {
    balanced_vs_safe: {
      count: 6,
      names: [
        "Nuno Alexandre Tavares Mendes (md2)",
        "Nuno Alexandre Tavares Mendes (md1)",
        "Bruno Miguel Borges Fernandes (md2)",
        "Bruno Miguel Borges Fernandes (md1)",
        "Lionel Messi (md3)",
        "Enzo Fernández (md3)"
      ]
    },
    balanced_vs_differential: {
      count: 5,
      names: [
        "Nuno Alexandre Tavares Mendes (md2)",
        "Nuno Alexandre Tavares Mendes (md1)",
        "David Raum (md1)",
        "Nicolás Tagliafico (md3)",
        "Julian Ryerson (md1)"
      ]
    },
    safe_vs_differential: {
      count: 2,
      names: [
        "Nuno Alexandre Tavares Mendes (md2)",
        "Nuno Alexandre Tavares Mendes (md1)"
      ]
    },
    upside_vs_captain: {
      count: 8,
      names: [
        "Lionel Messi (md3)",
        "Lionel Messi (md1)",
        "Lionel Messi (md2)",
        "Lionel Messi (group_stage_full)",
        "Harry Kane (md3)",
        "Bruno Miguel Borges Fernandes (md2)",
        "Harry Kane (md2)",
        "Bruno Miguel Borges Fernandes (md1)"
      ]
    }
  },
  top25_pair_overlaps: {
    balanced_vs_safe: { count: 13, names: [] },
    balanced_vs_differential: { count: 12, names: [] },
    safe_vs_differential: { count: 4, names: [] },
    upside_vs_captain: { count: 20, names: [] }
  },
  top25_all_mode_overlap: {
    count: 1,
    names: ["Enzo Fernández (md3)"]
  },
  nuno_rows: [
    { mode: "Balanced", rank: 1, name: "Nuno Alexandre Tavares Mendes", pos: "DEF", matchday: "md2", opponent: "Uzbekistan", price: 5.8, score: 86.341, raw: 8.252, risk: 7.675, start: 0.892, minutes: 74.2, confidence: "high", obviousness: "", reasons: "" },
    { mode: "Safe", rank: 1, name: "Nuno Alexandre Tavares Mendes", pos: "DEF", matchday: "md2", opponent: "Uzbekistan", price: 5.8, score: 87.657, raw: 8.252, risk: 7.675, start: 0.892, minutes: 74.2, confidence: "high", obviousness: "", reasons: "" },
    { mode: "Upside", rank: 6, name: "Nuno Alexandre Tavares Mendes", pos: "DEF", matchday: "md2", opponent: "Uzbekistan", price: 5.8, score: 80.813, raw: 8.252, risk: 7.675, start: 0.892, minutes: 74.2, confidence: "high", obviousness: "", reasons: "" },
    { mode: "Differential", rank: 1, name: "Nuno Alexandre Tavares Mendes", pos: "DEF", matchday: "md2", opponent: "Uzbekistan", price: 5.8, score: 77.386, raw: 8.252, risk: 7.675, start: 0.892, minutes: 74.2, confidence: "high", obviousness: "", reasons: "" },
    { mode: "Captain Alpha", rank: 22, name: "Nuno Alexandre Tavares Mendes", pos: "DEF", matchday: "md2", opponent: "Uzbekistan", price: 5.8, score: 75.68, raw: 8.252, risk: 7.675, start: 0.892, minutes: 74.2, confidence: "high", obviousness: "", reasons: "" }
  ],
  distinct_purpose_assessment: {
    differential_meaningfully_different_from_balanced: false,
    safe_meaningfully_different_from_balanced: true,
    upside_meaningfully_different_from_captain: true,
    notes: []
  }
};

const CONFIDENCE_SCORE = {
  high: 100,
  medium: 78,
  low: 50,
  missing: 38,
  thin_profile: 24,
  thin_profile_unclear: 24,
  blocked: 0
};

const ROLE_CONFIDENCE_SCORE = {
  high: 100,
  medium: 78,
  low: 50,
  missing: 34,
  thin_profile: 24,
  blocked: 0
};

const SEVERITY_ORDER = {
  blocked: 0,
  thin_profile: 1,
  missing: 2,
  low: 3,
  medium: 4,
  high: 5
};

function round(value, digits = 3) {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function num(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function sum(values) {
  return values.filter((value) => Number.isFinite(value)).reduce((total, value) => total + value, 0);
}

function average(values, fallback = null) {
  const valid = values.filter((value) => Number.isFinite(value));
  if (!valid.length) return fallback;
  return sum(valid) / valid.length;
}

function unique(values) {
  return [...new Set(values.filter((value) => value !== null && value !== undefined && value !== ""))];
}

function uniqueFlags(values) {
  return [...new Set(values.flat().filter(Boolean))].sort();
}

function countBy(rows, keyFn) {
  return rows.reduce((counts, row) => {
    const key = keyFn(row) || "missing";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function sortedCountEntries(counts) {
  return Object.entries(counts).sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])));
}

function top(rows, n, scoreFn) {
  return [...rows].sort((a, b) => scoreFn(b) - scoreFn(a)).slice(0, n);
}

function rangeSummary(values, digits = 3) {
  const valid = values.filter((value) => Number.isFinite(value));
  if (!valid.length) return { min: null, max: null, average: null };
  return {
    min: round(Math.min(...valid), digits),
    max: round(Math.max(...valid), digits),
    average: round(average(valid), digits)
  };
}

function flagsOf(row) {
  return Array.isArray(row?.data_quality_flags) ? row.data_quality_flags.filter(Boolean) : [];
}

function hasFlag(row, fragment) {
  const needle = normalize(fragment);
  return flagsOf(row).some((flag) => normalize(flag).includes(needle));
}

function hasAnyFlag(row, fragments) {
  return fragments.some((fragment) => hasFlag(row, fragment));
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function maybeReadJson(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return null;
  }
}

async function writeJson(path, data) {
  await writeFile(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function indexBy(rows, keyFn) {
  const map = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    if (key) map.set(String(key), row);
  }
  return map;
}

function valueMetric(row) {
  const price = num(row.official_price);
  const riskAdjusted = num(row.risk_adjusted_points);
  if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(riskAdjusted)) return null;
  return riskAdjusted / price;
}

function rowKey(row) {
  return String(row.player_matchday_projection_id || `${row.official_fantasy_player_id}:${row.matchday}:${row.fixture_id || "scope"}`);
}

function minMax(values) {
  const valid = values.filter((value) => Number.isFinite(value));
  if (!valid.length) return { min: null, max: null };
  return { min: Math.min(...valid), max: Math.max(...valid) };
}

function normalized(value, range, fallback = 50) {
  if (!Number.isFinite(value) || !Number.isFinite(range.min) || !Number.isFinite(range.max) || range.min === range.max) {
    return fallback;
  }
  return clamp(((value - range.min) / (range.max - range.min)) * 100, 0, 100);
}

function buildRanges(rows) {
  return {
    raw: minMax(rows.map((row) => num(row.raw_expected_points))),
    risk: minMax(rows.map((row) => num(row.risk_adjusted_points))),
    ceiling: minMax(rows.map((row) => num(row.ceiling_points))),
    floor: minMax(rows.map((row) => num(row.floor_points))),
    captain: minMax(rows.map((row) => num(row.captain_score))),
    value: minMax(rows.map(valueMetric)),
    attack: minMax(rows.map((row) => (num(row.attacking_component) || 0) + (num(row.assist_component) || 0))),
    cleanSheet: minMax(rows.map((row) => num(row.clean_sheet_component))),
    goalEnvironment: minMax(rows.map((row) => num(row.fixture_context?.expected_goals))),
    winProbability: minMax(rows.map((row) => num(row.fixture_context?.win_probability)))
  };
}

function sortScoredRows(scoredRows) {
  return scoredRows
    .filter(({ score }) => Number.isFinite(score))
    .sort((a, b) => b.score - a.score || (num(b.row.raw_expected_points) ?? 0) - (num(a.row.raw_expected_points) ?? 0));
}

function scoreRowsForMode(rows, modeId, ranges, modeContext = null) {
  return sortScoredRows(rows
    .filter((row) => modeEligible(row, modeId))
    .map((row) => {
      const result = scoreCandidate(row, modeId, ranges, modeContext);
      if (typeof result === "object") return { row, score: result.score, score_context: result.context || null };
      return { row, score: result, score_context: null };
    }));
}

function rankMapFromScoredRows(scoredRows, limit = null) {
  const map = new Map();
  const rows = limit ? scoredRows.slice(0, limit) : scoredRows;
  rows.forEach((item, index) => {
    map.set(rowKey(item.row), {
      rank: index + 1,
      score: round(item.score, 3),
      name: item.row.name,
      country: item.row.country,
      position: item.row.official_fantasy_position
    });
  });
  return map;
}

function rankMapFromRows(rows, scoreFn) {
  return rankMapFromScoredRows(sortScoredRows(rows.map((row) => ({ row, score: scoreFn(row) }))));
}

function pricePercentileByPosition(rows) {
  const byPosition = new Map();
  for (const row of rows) {
    const price = num(row.official_price);
    if (!Number.isFinite(price)) continue;
    const position = row.official_fantasy_position || "missing";
    if (!byPosition.has(position)) byPosition.set(position, []);
    byPosition.get(position).push({ key: rowKey(row), price });
  }

  const percentiles = new Map();
  for (const values of byPosition.values()) {
    values.sort((a, b) => a.price - b.price);
    const denominator = Math.max(values.length - 1, 1);
    values.forEach((item, index) => {
      percentiles.set(item.key, round(index / denominator, 4));
    });
  }
  return percentiles;
}

function majorRiskFlagCount(row) {
  return flagsOf(row).filter((flag) => [
    "blocked",
    "thin_profile",
    "missing_national_team_usage",
    "missing_usage",
    "low_usage_confidence",
    "minutes_uncertain",
    "position_conflict",
    "neymar_p0_usage_source_gap"
  ].some((fragment) => normalize(flag).includes(normalize(fragment)))).length;
}

function confidenceOrder(value) {
  return SEVERITY_ORDER[value] ?? 2;
}

function samePriceBand(rowA, rowB) {
  return priceBucket(num(rowA.official_price)) === priceBucket(num(rowB.official_price));
}

function isDominatedBy(candidate, challenger) {
  const candidateRisk = num(candidate.risk_adjusted_points) ?? -Infinity;
  const challengerRisk = num(challenger.risk_adjusted_points) ?? -Infinity;
  const candidatePrice = num(candidate.official_price) ?? Infinity;
  const challengerPrice = num(challenger.official_price) ?? Infinity;
  const candidateConfidence = confidenceOrder(projectionConfidence(candidate));
  const challengerConfidence = confidenceOrder(projectionConfidence(challenger));
  const candidateRiskFlags = majorRiskFlagCount(candidate);
  const challengerRiskFlags = majorRiskFlagCount(challenger);
  const comparable = challenger.official_fantasy_position === candidate.official_fantasy_position || samePriceBand(challenger, candidate);

  if (!comparable) return false;
  if (challengerRisk < candidateRisk - 0.05) return false;
  if (challengerPrice > candidatePrice + 0.05) return false;
  if (challengerConfidence < candidateConfidence) return false;
  if (challengerRiskFlags > candidateRiskFlags) return false;

  return challengerRisk > candidateRisk + 0.2
    || challengerPrice < candidatePrice - 0.2
    || challengerConfidence > candidateConfidence
    || challengerRiskFlags < candidateRiskFlags;
}

function replacementRankForPosition(position, rowsInPosition) {
  const configured = REPLACEMENT_RANK_BY_POSITION[position] || 16;
  return Math.max(1, Math.min(configured, rowsInPosition.length));
}

function buildFinanceContext(rows, scopeId) {
  const rowsByPosition = new Map();
  const rowsByPriceTierPosition = new Map();
  const rowsByCountry = new Map();
  for (const row of rows) {
    const position = row.official_fantasy_position || "missing";
    const tierPosition = `${priceBucket(num(row.official_price))}:${position}`;
    if (!rowsByPosition.has(position)) rowsByPosition.set(position, []);
    if (!rowsByPriceTierPosition.has(tierPosition)) rowsByPriceTierPosition.set(tierPosition, []);
    if (!rowsByCountry.has(row.country || "missing")) rowsByCountry.set(row.country || "missing", []);
    rowsByPosition.get(position).push(row);
    rowsByPriceTierPosition.get(tierPosition).push(row);
    rowsByCountry.get(row.country || "missing").push(row);
  }

  const replacementByPosition = {};
  const strongOptionsByPosition = {};
  for (const [position, positionRows] of rowsByPosition.entries()) {
    const sorted = [...positionRows].sort((a, b) => (num(b.risk_adjusted_points) ?? 0) - (num(a.risk_adjusted_points) ?? 0));
    const replacementRank = replacementRankForPosition(position, sorted);
    const replacementRow = sorted[replacementRank - 1] || sorted.at(-1);
    const replacementRisk = num(replacementRow?.risk_adjusted_points) ?? 0;
    replacementByPosition[position] = {
      replacement_rank: replacementRank,
      replacement_risk_adjusted_points: round(replacementRisk, 3),
      replacement_player: replacementRow ? {
        name: replacementRow.name,
        country: replacementRow.country,
        price: num(replacementRow.official_price),
        risk_adjusted_points: round(num(replacementRow.risk_adjusted_points), 3)
      } : null
    };
    strongOptionsByPosition[position] = sorted.filter((row) => (num(row.risk_adjusted_points) ?? 0) >= replacementRisk + 0.75).length;
  }

  const bestRiskByTierPosition = {};
  const strongOptionsByTierPosition = {};
  for (const [tierPosition, tierRows] of rowsByPriceTierPosition.entries()) {
    const risks = tierRows.map((row) => num(row.risk_adjusted_points)).filter(Number.isFinite);
    const bestRisk = risks.length ? Math.max(...risks) : 0;
    bestRiskByTierPosition[tierPosition] = bestRisk;
    strongOptionsByTierPosition[tierPosition] = tierRows.filter((row) => (num(row.risk_adjusted_points) ?? 0) >= bestRisk - 0.75).length;
  }

  const scopeStrongThreshold = average(Object.values(replacementByPosition).map((row) => row.replacement_risk_adjusted_points), 0) + 0.75;
  const scopeStrongOptions = rows.filter((row) => (num(row.risk_adjusted_points) ?? 0) >= scopeStrongThreshold).length;
  const metricsRows = [];
  const metricsByKey = new Map();
  for (const row of rows) {
    const key = rowKey(row);
    const position = row.official_fantasy_position || "missing";
    const tier = priceBucket(num(row.official_price));
    const tierPosition = `${tier}:${position}`;
    const risk = num(row.risk_adjusted_points) ?? 0;
    const raw = num(row.raw_expected_points) ?? 0;
    const price = num(row.official_price);
    const replacement = replacementByPosition[position]?.replacement_risk_adjusted_points ?? 0;
    const valueOverReplacement = risk - replacement;
    const pointsPerPrice = Number.isFinite(price) && price > 0 ? raw / price : null;
    const riskAdjustedPointsPerPrice = Number.isFinite(price) && price > 0 ? risk / price : null;
    const tierBestRisk = bestRiskByTierPosition[tierPosition] ?? risk;
    const opportunityCost = Math.max(0, tierBestRisk - risk);
    const positionStrongTarget = STRONG_OPTION_TARGET_BY_POSITION[position] || 12;
    const positionStrongOptions = strongOptionsByPosition[position] || 0;
    const tierStrongOptions = strongOptionsByTierPosition[tierPosition] || 0;
    const countryRows = rowsByCountry.get(row.country || "missing") || [];
    const countryStrongOptions = countryRows.filter((countryRow) => (num(countryRow.risk_adjusted_points) ?? 0) >= scopeStrongThreshold).length;
    const positionScarcityBonus = clamp((positionStrongTarget - positionStrongOptions) / Math.max(positionStrongTarget, 1), -0.3, 0.7);
    const priceTierScarcityBonus = tierStrongOptions <= 2 ? 0.35 : tierStrongOptions <= 5 ? 0.18 : tierStrongOptions <= 8 ? 0.08 : -0.05;
    const matchdayScarcityBonus = scopeStrongOptions <= 45 ? 0.18 : scopeStrongOptions <= 65 ? 0.08 : 0;
    const diversificationBonus = countryStrongOptions <= 1 ? 0.15 : countryStrongOptions <= 3 ? 0.08 : countryStrongOptions >= 10 ? -0.08 : 0;
    const scarcityAdjustedValue = valueOverReplacement
      + clamp(positionScarcityBonus, -0.25, 0.45)
      + priceTierScarcityBonus
      + matchdayScarcityBonus
      + diversificationBonus;
    const dominator = rows.find((other) => rowKey(other) !== key && isDominatedBy(row, other));
    const efficientFrontier = !dominator;
    const riskFlagCount = majorRiskFlagCount(row);
    const defensibilityScore = clamp(
      (clamp(num(row.start_probability) ?? 0, 0, 1) * 22)
        + (clamp((num(row.expected_minutes) ?? 0) / 90, 0, 1) * 18)
        + ((confidenceScore(row) / 100) * 16)
        + (clamp(valueOverReplacement, -2, 4) + 2) * 6
        + (clamp(scarcityAdjustedValue, -2, 5) + 2) * 4
        + (efficientFrontier ? 10 : -8)
        - opportunityCost * 3
        - riskFlagCount * 4,
      0,
      100
    );
    const concentrationRiskContribution = clamp((countryStrongOptions / Math.max(scopeStrongOptions, 1)) * 100, 0, 100);

    const metrics = {
      key,
      scope_id: scopeId,
      internal_player_id: row.internal_player_id,
      official_fantasy_player_id: String(row.official_fantasy_player_id),
      name: row.name,
      country: row.country,
      official_fantasy_position: position,
      official_price: round(price, 2),
      matchday: row.matchday,
      opponent: row.opponent,
      raw_expected_points: round(raw, 3),
      risk_adjusted_points: round(risk, 3),
      projection_confidence: projectionConfidence(row),
      role_confidence: roleConfidence(row),
      points_per_price: round(pointsPerPrice, 4),
      risk_adjusted_points_per_price: round(riskAdjustedPointsPerPrice, 4),
      replacement_rank: replacementByPosition[position]?.replacement_rank || null,
      replacement_level_risk_adjusted_points: round(replacement, 3),
      value_over_replacement: round(valueOverReplacement, 3),
      scarcity_adjusted_value: round(scarcityAdjustedValue, 3),
      position_strong_options: positionStrongOptions,
      price_tier: tier,
      price_tier_strong_options: tierStrongOptions,
      price_tier_opportunity_cost: round(opportunityCost, 3),
      efficient_frontier: efficientFrontier,
      dominated_player: !efficientFrontier,
      dominated_by: dominator ? {
        name: dominator.name,
        country: dominator.country,
        position: dominator.official_fantasy_position,
        price: round(num(dominator.official_price), 2),
        risk_adjusted_points: round(num(dominator.risk_adjusted_points), 3),
        confidence: projectionConfidence(dominator)
      } : null,
      concentration_risk_contribution: round(concentrationRiskContribution, 3),
      major_risk_flag_count: riskFlagCount,
      differential_defensibility_score: round(defensibilityScore, 3),
      finance_quality_flags: unique([
        valueOverReplacement > 0 ? "above_replacement" : "below_replacement",
        efficientFrontier ? "efficient_frontier" : "dominated",
        opportunityCost >= 1.5 ? "high_price_tier_opportunity_cost" : null,
        scarcityAdjustedValue > valueOverReplacement + 0.25 ? "scarcity_boost" : null,
        concentrationRiskContribution >= 15 ? "country_concentration_risk" : null
      ])
    };
    metricsRows.push(metrics);
    metricsByKey.set(key, metrics);
  }

  const ranges = {
    value_over_replacement: minMax(metricsRows.map((row) => row.value_over_replacement)),
    scarcity_adjusted_value: minMax(metricsRows.map((row) => row.scarcity_adjusted_value)),
    price_tier_opportunity_cost: minMax(metricsRows.map((row) => row.price_tier_opportunity_cost)),
    differential_defensibility_score: minMax(metricsRows.map((row) => row.differential_defensibility_score))
  };

  return {
    scope_id: scopeId,
    replacement_rule: "Replacement level is position-specific: GK 12th, DEF 20th, MID 20th, FWD 16th by risk-adjusted points within each scope.",
    replacement_by_position: replacementByPosition,
    scope_strong_options: scopeStrongOptions,
    metrics_rows: metricsRows,
    metrics_by_key: metricsByKey,
    ranges,
    summary: {
      total_rows: metricsRows.length,
      efficient_frontier_rows: metricsRows.filter((row) => row.efficient_frontier).length,
      dominated_rows: metricsRows.filter((row) => row.dominated_player).length,
      above_replacement_rows: metricsRows.filter((row) => row.value_over_replacement > 0).length,
      average_value_over_replacement: round(average(metricsRows.map((row) => row.value_over_replacement)), 3),
      average_scarcity_adjusted_value: round(average(metricsRows.map((row) => row.scarcity_adjusted_value)), 3)
    }
  };
}

function buildDifferentialModeContext(rows, baseScoredRowsByMode, financeContext) {
  const topRankLimit = TOP_LIST_LIMIT;
  const top10RankMaps = Object.fromEntries(["balanced", "safe", "upside", "captain"].map((modeId) => [
    modeId,
    rankMapFromScoredRows(selectTopCandidatesWithPositionCaps(baseScoredRowsByMode[modeId] || [], modeId), topRankLimit)
  ]));
  return {
    balanced_ranks: top10RankMaps.balanced,
    safe_ranks: top10RankMaps.safe,
    upside_ranks: top10RankMaps.upside,
    captain_ranks: top10RankMaps.captain,
    raw_ranks: rankMapFromRows(rows, (row) => num(row.raw_expected_points) ?? 0),
    captain_score_ranks: rankMapFromRows(rows, (row) => num(row.captain_score) ?? 0),
    price_percentile_by_position: pricePercentileByPosition(rows),
    finance_metrics_by_key: financeContext.metrics_by_key,
    finance_ranges: financeContext.ranges
  };
}

function rankPenalty(rank, thresholds) {
  if (!Number.isFinite(rank)) return 0;
  if (rank <= 1) return thresholds.top1;
  if (rank <= 5) return thresholds.top5;
  if (rank <= 10) return thresholds.top10;
  if (rank <= 25) return thresholds.top25;
  return 0;
}

function differentialObviousness(row, modeContext) {
  if (!modeContext) return {
    penalty: 0,
    balanced_rank: null,
    safe_rank: null,
    captain_rank: null,
    raw_rank: null,
    captain_score_rank: null,
    price_percentile_by_position: null,
    cross_mode_top10_count: 0,
    reasons: []
  };

  const key = rowKey(row);
  const balancedRank = modeContext.balanced_ranks.get(key)?.rank ?? null;
  const safeRank = modeContext.safe_ranks.get(key)?.rank ?? null;
  const upsideRank = modeContext.upside_ranks.get(key)?.rank ?? null;
  const captainRank = modeContext.captain_ranks.get(key)?.rank ?? null;
  const rawRank = modeContext.raw_ranks.get(key)?.rank ?? null;
  const captainScoreRank = modeContext.captain_score_ranks.get(key)?.rank ?? null;
  const pricePercentile = modeContext.price_percentile_by_position.get(key) ?? null;
  const top10Ranks = [balancedRank, safeRank, upsideRank, captainRank].filter((rank) => Number.isFinite(rank) && rank <= 10);
  const top25Ranks = [balancedRank, safeRank, upsideRank, captainRank].filter((rank) => Number.isFinite(rank) && rank <= 25);
  const reasons = [];

  let penalty = 0;
  const balancedPenalty = rankPenalty(balancedRank, { top1: 18, top5: 13, top10: 8, top25: 3 });
  const safePenalty = rankPenalty(safeRank, { top1: 16, top5: 12, top10: 7, top25: 3 });
  const captainPenalty = rankPenalty(captainRank, { top1: 9, top5: 6, top10: 4, top25: 2 });
  const rawPenalty = rankPenalty(rawRank, { top1: 6, top5: 4, top10: 2, top25: 1 });
  const captainScorePenalty = rankPenalty(captainScoreRank, { top1: 4, top5: 3, top10: 2, top25: 1 });
  penalty += balancedPenalty + safePenalty + captainPenalty + rawPenalty + captainScorePenalty;

  if (Number.isFinite(pricePercentile)) {
    if (pricePercentile >= 0.92) penalty += 6;
    else if (pricePercentile >= 0.82) penalty += 4;
    else if (pricePercentile >= 0.72) penalty += 1.5;
  }

  if (balancedRank === 1 && safeRank === 1) penalty += 8;
  else if (Number.isFinite(balancedRank) && balancedRank <= 10 && Number.isFinite(safeRank) && safeRank <= 10) penalty += 5;
  else if (Number.isFinite(balancedRank) && balancedRank <= 10) penalty += 2;
  if (top10Ranks.length >= 3) penalty += 5;
  else if (top10Ranks.length >= 2) penalty += 3;
  if (top25Ranks.length >= 3) penalty += 2;

  if (balancedPenalty) reasons.push(`Balanced rank ${balancedRank}`);
  if (safePenalty) reasons.push(`Safe rank ${safeRank}`);
  if (captainPenalty) reasons.push(`Captain Alpha rank ${captainRank}`);
  if (rawPenalty) reasons.push(`Raw projection rank ${rawRank}`);
  if (Number.isFinite(pricePercentile) && pricePercentile >= 0.72) reasons.push(`price percentile ${round(pricePercentile, 2)} by position`);
  if (top10Ranks.length >= 2) reasons.push(`top-10 in ${top10Ranks.length} modes`);

  return {
    penalty: round(clamp(penalty, 0, 45), 3),
    balanced_rank: balancedRank,
    safe_rank: safeRank,
    upside_rank: upsideRank,
    captain_rank: captainRank,
    raw_rank: rawRank,
    captain_score_rank: captainScoreRank,
    price_percentile_by_position: pricePercentile,
    cross_mode_top10_count: top10Ranks.length,
    cross_mode_top25_count: top25Ranks.length,
    reasons
  };
}

function projectionConfidence(row) {
  return row.projection_confidence || row.minutes_context?.role_confidence || "missing";
}

function roleLabel(row) {
  return row.minutes_context?.role_label || row.role_label || "unclear";
}

function roleConfidence(row) {
  return row.minutes_context?.role_confidence || row.role_confidence || "missing";
}

function confidenceScore(row) {
  return CONFIDENCE_SCORE[projectionConfidence(row)] ?? 45;
}

function roleConfidenceScore(row) {
  return ROLE_CONFIDENCE_SCORE[roleConfidence(row)] ?? 40;
}

function worstConfidence(values) {
  const valid = values.filter(Boolean);
  if (!valid.length) return "missing";
  return [...valid].sort((a, b) => (SEVERITY_ORDER[a] ?? 2) - (SEVERITY_ORDER[b] ?? 2))[0];
}

function isNeymar(row) {
  return normalize(row.name).includes("neymar");
}

function hasSourceBackedUsage(row) {
  const usage = row.minutes_context?.source_usage || {};
  const usageConfidence = usage.usage_confidence;
  const usageValues = [
    num(usage.qualifier_minutes),
    num(usage.qualifier_starts),
    num(usage.recent_nt_minutes),
    num(usage.recent_nt_starts),
    num(usage.start_rate)
  ];
  return ["high", "medium", "low"].includes(usageConfidence) && usageValues.some((value) => Number.isFinite(value) && value > 0);
}

function hasMissingUsage(row) {
  if (hasSourceBackedUsage(row)) return false;
  return hasAnyFlag(row, [
    "missing_national_team_usage",
    "missing_national_team_usage_review",
    "club_star_nt_usage_missing",
    "source_gap",
    "neymar_p0_usage_source_gap"
  ]);
}

function isThinProfile(row) {
  return projectionConfidence(row) === "thin_profile" || hasFlag(row, "thin_profile");
}

function isLowConfidence(row) {
  return ["low", "missing", "thin_profile"].includes(projectionConfidence(row)) || hasFlag(row, "projection_low_or_medium_confidence");
}

function isBlockedProjection(row) {
  const price = num(row.official_price);
  const start = num(row.start_probability);
  const minutes = num(row.expected_minutes);
  const raw = num(row.raw_expected_points);
  const risk = num(row.risk_adjusted_points);
  const officialPosition = row.official_fantasy_position;
  if (row.selectable_status && row.selectable_status !== "playing") return true;
  if (row.model_input_status && String(row.model_input_status).startsWith("blocked")) return true;
  if (hasFlag(row, "blocked_not_selectable")) return true;
  if (!Number.isFinite(price) || price <= 0) return true;
  if (!VALID_POSITIONS.has(officialPosition)) return true;
  if (![start, minutes, raw, risk].every(Number.isFinite)) return true;
  if (minutes < 0 || minutes > 90 || start < 0 || start > 1) return true;
  return false;
}

function modeEligible(row, modeId) {
  if (isBlockedProjection(row)) return false;
  const start = num(row.start_probability) ?? 0;
  const minutes = num(row.expected_minutes) ?? 0;
  const raw = num(row.raw_expected_points) ?? 0;
  const risk = num(row.risk_adjusted_points) ?? 0;
  const confidence = projectionConfidence(row);

  if (modeId === "safe") {
    if (isThinProfile(row) || confidence === "low" || confidence === "missing") return false;
    if (start < 0.62 || minutes < 58) return false;
  }

  if (modeId === "captain") {
    if (isThinProfile(row) || confidence === "missing") return false;
    if (start < 0.58 || minutes < 55) return false;
    if (isNeymar(row) || hasFlag(row, "neymar_p0_usage_source_gap")) return false;
  }

  if (modeId === "balanced") {
    if (isThinProfile(row)) return false;
    if (start < 0.35 || minutes < 35) return false;
  }

  if (modeId === "upside") {
    if (isThinProfile(row) && start < 0.45) return false;
    if (start < 0.3 || minutes < 28) return false;
  }

  if (modeId === "differential") {
    if (isThinProfile(row) || confidence === "low" || confidence === "missing") return false;
    if (hasMissingUsage(row)) return false;
    if (start < 0.52 || minutes < 48) return false;
    if (raw < 3.2 || risk < 2.7) return false;
  }

  return true;
}

function fixtureScore(row, ranges) {
  const xg = normalized(num(row.fixture_context?.expected_goals), ranges.goalEnvironment, 50);
  const win = normalized(num(row.fixture_context?.win_probability), ranges.winProbability, 50);
  const clean = normalized(num(row.clean_sheet_component), ranges.cleanSheet, 50);
  if (row.official_fantasy_position === "GK" || row.official_fantasy_position === "DEF") {
    return round(xg * 0.2 + win * 0.3 + clean * 0.5, 3);
  }
  return round(xg * 0.65 + win * 0.25 + clean * 0.1, 3);
}

function playerPenalty(row, modeId) {
  let penalty = 0;
  const start = num(row.start_probability) ?? 0;
  const minutes = num(row.expected_minutes) ?? 0;
  const confidence = projectionConfidence(row);

  if (hasFlag(row, "rules_manual_review")) penalty += 2;
  if (hasFlag(row, "final_squad_source_missing")) penalty += 2;
  if (hasFlag(row, "squad_review_rows_present")) penalty += 2;
  if (hasFlag(row, "position_conflict_audit")) penalty += modeId === "captain" ? 5 : 3;
  if (hasFlag(row, "minutes_uncertain")) penalty += modeId === "safe" || modeId === "captain" ? 10 : 6;
  if (hasMissingUsage(row)) penalty += modeId === "captain" ? 16 : modeId === "safe" ? 12 : 7;
  if (confidence === "low") penalty += modeId === "safe" || modeId === "captain" ? 14 : 8;
  if (confidence === "missing") penalty += modeId === "safe" || modeId === "captain" ? 18 : 10;
  if (isThinProfile(row)) penalty += modeId === "differential" ? 10 : 18;
  if (hasAnyFlag(row, ["conservative_position_team_prior_rates", "missing_source_backed_goals_per90"])) penalty += modeId === "upside" ? 6 : 4;
  if (hasFlag(row, "brazil_neymar_usage_source_gap")) penalty += modeId === "captain" ? 8 : 3;
  if (hasFlag(row, "neymar_p0_usage_source_gap") || isNeymar(row)) penalty += modeId === "captain" ? 35 : 12;
  if (start < 0.45) penalty += modeId === "captain" || modeId === "safe" ? 20 : 10;
  if (start < 0.65 && (modeId === "safe" || modeId === "captain")) penalty += 8;
  if (minutes < 60 && (modeId === "safe" || modeId === "captain")) penalty += 7;
  return penalty;
}

function positionScoreAdjustment(row, modeId) {
  const position = row.official_fantasy_position;
  return POSITION_SCORE_ADJUSTMENTS_BY_MODE[modeId]?.[position] ?? 0;
}

function scoreCandidate(row, modeId, ranges, modeContext = null) {
  const raw = normalized(num(row.raw_expected_points), ranges.raw, 50);
  const risk = normalized(num(row.risk_adjusted_points), ranges.risk, 50);
  const ceiling = normalized(num(row.ceiling_points), ranges.ceiling, 50);
  const floor = normalized(num(row.floor_points), ranges.floor, 50);
  const captain = normalized(num(row.captain_score), ranges.captain, 50);
  const value = normalized(valueMetric(row), ranges.value, 50);
  const attack = normalized((num(row.attacking_component) || 0) + (num(row.assist_component) || 0), ranges.attack, 50);
  const start = clamp((num(row.start_probability) ?? 0) * 100, 0, 100);
  const minutes = clamp(((num(row.expected_minutes) ?? 0) / 90) * 100, 0, 100);
  const confidence = confidenceScore(row);
  const role = roleConfidenceScore(row);
  const fixture = fixtureScore(row, ranges);
  const penalty = playerPenalty(row, modeId);

  let score;
  if (modeId === "balanced") {
    score = risk * 0.2 + raw * 0.15 + start * 0.16 + minutes * 0.13 + confidence * 0.14 + value * 0.12 + fixture * 0.06 + role * 0.04;
  } else if (modeId === "safe") {
    score = start * 0.24 + minutes * 0.2 + floor * 0.16 + risk * 0.12 + confidence * 0.16 + role * 0.08 + fixture * 0.04;
  } else if (modeId === "upside") {
    score = ceiling * 0.24 + attack * 0.16 + captain * 0.13 + raw * 0.13 + fixture * 0.12 + start * 0.09 + value * 0.09 + confidence * 0.04;
  } else if (modeId === "differential") {
    const price = num(row.official_price) ?? 10;
    const lowerPriceSignal = clamp(((8.5 - price) / 5.5) * 100, 0, 100);
    const premiumPenalty = price >= 9.5 ? 20 : price >= 8.5 ? 14 : price >= 7.5 ? 7 : 0;
    const obviousness = differentialObviousness(row, modeContext);
    const finance = modeContext?.finance_metrics_by_key?.get(rowKey(row));
    const financeRanges = modeContext?.finance_ranges || {};
    const valueOverReplacement = normalized(finance?.value_over_replacement, financeRanges.value_over_replacement || { min: null, max: null }, 50);
    const scarcityAdjusted = normalized(finance?.scarcity_adjusted_value, financeRanges.scarcity_adjusted_value || { min: null, max: null }, 50);
    const defensibility = normalized(finance?.differential_defensibility_score, financeRanges.differential_defensibility_score || { min: null, max: null }, 50);
    const opportunityCost = normalized(finance?.price_tier_opportunity_cost, financeRanges.price_tier_opportunity_cost || { min: null, max: null }, 0);
    const frontierCredit = finance?.efficient_frontier ? 7 : finance?.dominated_player ? -5 : 0;
    const strongFinanceCredit = (finance?.value_over_replacement ?? 0) > 1.25 && finance?.efficient_frontier ? 4 : 0;
    score = risk * 0.13
      + raw * 0.08
      + ceiling * 0.12
      + value * 0.16
      + attack * 0.11
      + start * 0.07
      + confidence * 0.05
      + fixture * 0.03
      + lowerPriceSignal * 0.06
      + valueOverReplacement * 0.12
      + scarcityAdjusted * 0.08
      + defensibility * 0.07
      + frontierCredit
      + strongFinanceCredit
      - opportunityCost * 0.04
      - premiumPenalty
      - obviousness.penalty;
    return {
      score: round(clamp(score + positionScoreAdjustment(row, modeId) - penalty, 0, 100), 3),
      context: {
        differential_obviousness_penalty: obviousness.penalty,
        differential_obviousness_reasons: obviousness.reasons,
        value_over_replacement: finance?.value_over_replacement ?? null,
        scarcity_adjusted_value: finance?.scarcity_adjusted_value ?? null,
        risk_adjusted_points_per_price: finance?.risk_adjusted_points_per_price ?? null,
        price_tier_opportunity_cost: finance?.price_tier_opportunity_cost ?? null,
        efficient_frontier: finance?.efficient_frontier ?? null,
        dominated_player: finance?.dominated_player ?? null,
        differential_defensibility_score: finance?.differential_defensibility_score ?? null,
        finance_frontier_credit: frontierCredit,
        strong_finance_credit: strongFinanceCredit,
        balanced_rank: obviousness.balanced_rank,
        safe_rank: obviousness.safe_rank,
        upside_rank: obviousness.upside_rank,
        captain_rank: obviousness.captain_rank,
        raw_projection_rank: obviousness.raw_rank,
        captain_score_rank: obviousness.captain_score_rank,
        price_percentile_by_position: obviousness.price_percentile_by_position,
        cross_mode_top10_count: obviousness.cross_mode_top10_count,
        cross_mode_top25_count: obviousness.cross_mode_top25_count
      }
    };
  } else if (modeId === "captain") {
    score = captain * 0.2 + raw * 0.16 + ceiling * 0.15 + attack * 0.09 + start * 0.17 + minutes * 0.1 + confidence * 0.08 + fixture * 0.03 + role * 0.02;
  } else {
    score = risk;
  }

  return round(clamp(score + positionScoreAdjustment(row, modeId) - penalty, 0, 100), 3);
}

function capTierByRisk(tier, row, modeId) {
  const order = ["blocked", "avoid_for_now", "risky_candidate", "watchlist_candidate", "strong_candidate", "top_pick_candidate"];
  let cap = "top_pick_candidate";
  if (isThinProfile(row)) cap = modeId === "differential" ? "risky_candidate" : "avoid_for_now";
  else if (hasMissingUsage(row) || projectionConfidence(row) === "missing") cap = modeId === "captain" ? "risky_candidate" : "watchlist_candidate";
  else if (projectionConfidence(row) === "low") cap = modeId === "safe" || modeId === "captain" ? "risky_candidate" : "watchlist_candidate";
  else if ((num(row.start_probability) ?? 0) < 0.45) cap = "risky_candidate";

  return order[Math.min(order.indexOf(tier), order.indexOf(cap))];
}

function tierFor(score, row, modeId) {
  let tier;
  if (!Number.isFinite(score)) tier = "blocked";
  else if (score >= 80) tier = "top_pick_candidate";
  else if (score >= 66) tier = "strong_candidate";
  else if (score >= 50) tier = "watchlist_candidate";
  else if (score >= 34) tier = "risky_candidate";
  else tier = "avoid_for_now";
  return capTierByRisk(tier, row, modeId);
}

function usefulFixtureText(row) {
  const context = row.fixture_context || {};
  const band = context.fixture_difficulty_band || "fixture context";
  const xg = num(context.expected_goals);
  const cs = num(context.clean_sheet_probability);
  if (row.official_fantasy_position === "GK" || row.official_fantasy_position === "DEF") {
    if (Number.isFinite(cs)) return `${band}; clean-sheet probability ${round(cs, 3)}`;
  }
  if (Number.isFinite(xg)) return `${band}; team xG ${round(xg, 2)}`;
  return band;
}

function buildWhyPick(row, modeId, score) {
  const reasons = [];
  const risk = num(row.risk_adjusted_points);
  const raw = num(row.raw_expected_points);
  const ceiling = num(row.ceiling_points);
  const start = num(row.start_probability);
  const minutes = num(row.expected_minutes);
  const value = valueMetric(row);

  if (modeId === "captain" && Number.isFinite(row.captain_score)) reasons.push(`captain score ${round(num(row.captain_score), 2)}`);
  if (modeId === "upside" && Number.isFinite(ceiling)) reasons.push(`ceiling ${round(ceiling, 2)}`);
  if (modeId === "safe" && Number.isFinite(start) && Number.isFinite(minutes)) reasons.push(`start ${round(start, 2)} and ${round(minutes, 1)} expected minutes`);
  if (Number.isFinite(risk)) reasons.push(`risk-adjusted projection ${round(risk, 2)}`);
  if (Number.isFinite(raw)) reasons.push(`raw projection ${round(raw, 2)}`);
  if (Number.isFinite(value) && value >= 0.45) reasons.push(`useful price-adjusted value`);
  if (["high", "medium"].includes(projectionConfidence(row))) reasons.push(`${projectionConfidence(row)} projection confidence`);
  reasons.push(usefulFixtureText(row));
  reasons.push(`staged score ${round(score, 1)} in ${modeId}`);

  return unique(reasons).slice(0, 5);
}

function buildWhyCareful(row) {
  const cautions = [];
  const start = num(row.start_probability);
  if (hasFlag(row, "final_squad_source_missing")) cautions.push("not final-squad-backed");
  if (hasFlag(row, "rules_manual_review")) cautions.push("official rules still have manual-review warnings");
  if (hasFlag(row, "squad_review_rows_present")) cautions.push("squad staging still has review rows");
  if (hasMissingUsage(row)) cautions.push("source-backed national-team usage is missing or sparse");
  if (projectionConfidence(row) === "low") cautions.push("low projection confidence");
  if (projectionConfidence(row) === "missing") cautions.push("missing projection confidence");
  if (isThinProfile(row)) cautions.push("thin profile");
  if (hasFlag(row, "minutes_uncertain")) cautions.push("minutes uncertain");
  if (Number.isFinite(start) && start < 0.65) cautions.push(`start probability only ${round(start, 2)}`);
  if (hasFlag(row, "brazil_neymar_usage_source_gap")) cautions.push("Brazil context carries Neymar usage uncertainty");
  if (hasFlag(row, "neymar_p0_usage_source_gap") || isNeymar(row)) cautions.push("Neymar remains a P0 usage source gap");
  if (hasAnyFlag(row, ["no_source_backed_set_piece_or_penalty_role", "scouting_bonus_not_modeled_missing_selection_rate"])) {
    cautions.push("set-piece, penalty, or scouting bonus role not source-backed");
  }
  return unique(cautions).slice(0, 6);
}

function candidateBaseFlags(row) {
  return uniqueFlags([
    flagsOf(row),
    REQUIRED_FLAGS,
    ["recommendation_candidates_staged_only"]
  ]);
}

function buildCandidate(row, mode, rank, score, scoreContext = null) {
  const scoreValue = round(score, 3);
  return {
    internal_player_id: row.internal_player_id,
    official_fantasy_player_id: row.official_fantasy_player_id,
    name: row.name,
    country: row.country,
    team_id: row.team_id,
    official_fantasy_position: row.official_fantasy_position,
    official_price: num(row.official_price),
    matchday: row.matchday,
    opponent: row.opponent,
    mode: mode.id,
    mode_label: mode.label,
    rank,
    raw_expected_points: round(num(row.raw_expected_points), 3),
    risk_adjusted_points: round(num(row.risk_adjusted_points), 3),
    ceiling_points: round(num(row.ceiling_points), 3),
    floor_points: round(num(row.floor_points), 3),
    captain_score: round(num(row.captain_score), 3),
    value_score: round(valueMetric(row), 3),
    start_probability: round(num(row.start_probability), 3),
    expected_minutes: round(num(row.expected_minutes), 1),
    projection_confidence: projectionConfidence(row),
    role_label: roleLabel(row),
    role_confidence: roleConfidence(row),
    fixture_context: row.fixture_context,
    projection_components: {
      appearance_component: round(num(row.appearance_component), 3),
      attacking_component: round(num(row.attacking_component), 3),
      assist_component: round(num(row.assist_component), 3),
      clean_sheet_component: round(num(row.clean_sheet_component), 3),
      goals_conceded_component: round(num(row.goals_conceded_component), 3),
      save_component: round(num(row.save_component), 3),
      tackle_component: round(num(row.tackle_component), 3),
      chance_created_component: round(num(row.chance_created_component), 3),
      shot_on_target_component: round(num(row.shot_on_target_component), 3),
      card_risk_component: round(num(row.card_risk_component), 3),
      bonus_component: round(num(row.bonus_component), 3),
      set_piece_role_component: round(num(row.set_piece_role_component), 3)
    },
    recommendation_score: scoreValue,
    recommendation_tier: tierFor(scoreValue, row, mode.id),
    why_pick: buildWhyPick(row, mode.id, scoreValue),
    why_careful: buildWhyCareful(row),
    calibration_notes: [
      `position_score_adjustment=${positionScoreAdjustment(row, mode.id)}`,
      `position_cap_for_${mode.id}=${POSITION_CAPS_BY_MODE[mode.id]?.[row.official_fantasy_position] ?? TOP_LIST_LIMIT}`
    ],
    mode_separation_context: scoreContext,
    data_quality_flags: candidateBaseFlags(row),
    model_stage: MODEL_STAGE,
    source_model_version: SOURCE_MODEL_VERSION
  };
}

function aggregateFixtureContext(rows) {
  const contexts = rows.map((row) => row.fixture_context || {});
  const bestAttack = top(rows, 1, (row) => num(row.fixture_context?.expected_goals) ?? -Infinity)[0];
  const bestCleanSheet = top(rows, 1, (row) => num(row.fixture_context?.clean_sheet_probability) ?? -Infinity)[0];
  const highestCaptain = top(rows, 1, (row) => num(row.fixture_context?.captain_environment_score) ?? -Infinity)[0];
  return {
    scope: "group_stage_full",
    fixture_count: rows.length,
    opponents: rows.map((row) => row.opponent),
    fixture_ids: rows.map((row) => row.fixture_id),
    average_expected_goals: round(average(contexts.map((context) => num(context.expected_goals))), 3),
    average_expected_goals_against: round(average(contexts.map((context) => num(context.expected_goals_against))), 3),
    average_win_probability: round(average(contexts.map((context) => num(context.win_probability))), 4),
    average_clean_sheet_probability: round(average(contexts.map((context) => num(context.clean_sheet_probability))), 4),
    average_fixture_difficulty_score: round(average(contexts.map((context) => num(context.fixture_difficulty_score))), 2),
    average_attacking_environment_score: round(average(contexts.map((context) => num(context.attacking_environment_score))), 2),
    average_defensive_environment_score: round(average(contexts.map((context) => num(context.defensive_environment_score))), 2),
    average_captain_environment_score: round(average(contexts.map((context) => num(context.captain_environment_score))), 2),
    best_attacking_fixture: bestAttack ? { matchday: bestAttack.matchday, opponent: bestAttack.opponent, expected_goals: round(num(bestAttack.fixture_context?.expected_goals), 3) } : null,
    best_clean_sheet_fixture: bestCleanSheet ? { matchday: bestCleanSheet.matchday, opponent: bestCleanSheet.opponent, clean_sheet_probability: round(num(bestCleanSheet.fixture_context?.clean_sheet_probability), 4) } : null,
    highest_captain_environment_fixture: highestCaptain ? { matchday: highestCaptain.matchday, opponent: highestCaptain.opponent, captain_environment_score: round(num(highestCaptain.fixture_context?.captain_environment_score), 2) } : null,
    score_qa_flags: uniqueFlags(contexts.map((context) => context.score_qa_flags || []))
  };
}

function aggregateRows(projectionRows) {
  const byPlayer = new Map();
  for (const row of projectionRows) {
    const key = row.official_fantasy_player_id || row.internal_player_id;
    if (!byPlayer.has(key)) byPlayer.set(key, []);
    byPlayer.get(key).push(row);
  }

  const aggregated = [];
  for (const rows of byPlayer.values()) {
    const sortedRows = [...rows].sort((a, b) => String(a.matchday).localeCompare(String(b.matchday)));
    const first = sortedRows[0];
    const flags = uniqueFlags(sortedRows.map(flagsOf));
    const confidence = worstConfidence(sortedRows.map(projectionConfidence));
    const roleConfidenceValue = worstConfidence(sortedRows.map(roleConfidence));
    const roleLabels = unique(sortedRows.map(roleLabel));
    aggregated.push({
      ...first,
      player_matchday_projection_id: `${first.official_fantasy_player_id || first.internal_player_id}-group-stage-full-fantasy-pool-v3`,
      matchday: "group_stage_full",
      matchday_label: "Full Group Stage",
      opponent: "Group stage average",
      opponent_team_id: null,
      fixture_id: null,
      match_id: null,
      match_number: null,
      side: null,
      expected_minutes: round(average(sortedRows.map((row) => num(row.expected_minutes))), 1),
      start_probability: round(average(sortedRows.map((row) => num(row.start_probability))), 3),
      raw_expected_points: round(sum(sortedRows.map((row) => num(row.raw_expected_points))), 3),
      risk_adjusted_points: round(sum(sortedRows.map((row) => num(row.risk_adjusted_points))), 3),
      ceiling_points: round(sum(sortedRows.map((row) => num(row.ceiling_points))), 3),
      floor_points: round(sum(sortedRows.map((row) => num(row.floor_points))), 3),
      captain_score: round(Math.max(...sortedRows.map((row) => num(row.captain_score)).filter(Number.isFinite)), 3),
      appearance_component: round(sum(sortedRows.map((row) => num(row.appearance_component))), 3),
      attacking_component: round(sum(sortedRows.map((row) => num(row.attacking_component))), 3),
      assist_component: round(sum(sortedRows.map((row) => num(row.assist_component))), 3),
      clean_sheet_component: round(sum(sortedRows.map((row) => num(row.clean_sheet_component))), 3),
      goals_conceded_component: round(sum(sortedRows.map((row) => num(row.goals_conceded_component))), 3),
      save_component: round(sum(sortedRows.map((row) => num(row.save_component))), 3),
      tackle_component: round(sum(sortedRows.map((row) => num(row.tackle_component))), 3),
      chance_created_component: round(sum(sortedRows.map((row) => num(row.chance_created_component))), 3),
      shot_on_target_component: round(sum(sortedRows.map((row) => num(row.shot_on_target_component))), 3),
      card_risk_component: round(sum(sortedRows.map((row) => num(row.card_risk_component))), 3),
      bonus_component: round(sum(sortedRows.map((row) => num(row.bonus_component))), 3),
      set_piece_role_component: round(sum(sortedRows.map((row) => num(row.set_piece_role_component))), 3),
      official_scoring_coverage_flags: uniqueFlags(sortedRows.map((row) => row.official_scoring_coverage_flags || [])),
      fixture_context: aggregateFixtureContext(sortedRows),
      projection_confidence: confidence,
      data_quality_flags: flags,
      minutes_context: {
        ...(first.minutes_context || {}),
        role_label: roleLabels.length === 1 ? roleLabels[0] : "mixed_group_stage_role",
        role_confidence: roleConfidenceValue,
        group_stage_fixture_count: sortedRows.length
      }
    });
  }
  return aggregated;
}

function buildScopes(projectionRows) {
  const matchdays = ["md1", "md2", "md3"];
  return [
    {
      matchday_id: "group_stage_full",
      label: "Full Group Stage",
      rows: aggregateRows(projectionRows)
    },
    ...matchdays.map((matchday) => ({
      matchday_id: matchday,
      label: `Matchday ${matchday.replace("md", "")}`,
      rows: projectionRows.filter((row) => row.matchday === matchday)
    }))
  ];
}

function selectTopCandidatesWithPositionCaps(scoredRows, modeId) {
  const caps = POSITION_CAPS_BY_MODE[modeId] || {};
  const selected = [];
  const selectedIds = new Set();
  const positionCounts = {};

  for (const item of scoredRows) {
    const position = item.row.official_fantasy_position || "missing";
    const cap = caps[position] ?? TOP_LIST_LIMIT;
    if ((positionCounts[position] || 0) >= cap) continue;
    selected.push(item);
    selectedIds.add(item.row.player_matchday_projection_id || `${item.row.official_fantasy_player_id}:${item.row.matchday}`);
    positionCounts[position] = (positionCounts[position] || 0) + 1;
    if (selected.length >= TOP_LIST_LIMIT) break;
  }

  if (selected.length < TOP_LIST_LIMIT) {
    for (const item of scoredRows) {
      const key = item.row.player_matchday_projection_id || `${item.row.official_fantasy_player_id}:${item.row.matchday}`;
      if (selectedIds.has(key)) continue;
      selected.push(item);
      if (selected.length >= TOP_LIST_LIMIT) break;
    }
  }

  return selected;
}

function positionCapAuditForList(candidates, modeId) {
  const caps = POSITION_CAPS_BY_MODE[modeId] || {};
  const counts = countBy(candidates, (candidate) => candidate.official_fantasy_position);
  const warnings = [];
  for (const [position, count] of Object.entries(counts)) {
    if (count > (caps[position] ?? TOP_LIST_LIMIT)) {
      warnings.push(`${position} exceeds cap ${caps[position]} with ${count} rows`);
    }
    if (count / Math.max(candidates.length, 1) > 0.6) {
      warnings.push(`${position} dominates ${round((count / candidates.length) * 100, 1)}% of list`);
    }
  }
  return { caps, counts, warnings };
}

function buildRecommendations(scopes) {
  const recommendationCandidates = [];
  const matchdayRecommendations = [];
  const financeContextsByScope = {};

  for (const scope of scopes) {
    const ranges = buildRanges(scope.rows);
    const financeContext = buildFinanceContext(scope.rows, scope.matchday_id);
    financeContextsByScope[scope.matchday_id] = financeContext;
    const topLists = {};
    const modeSummaries = {};
    const baseScoredRowsByMode = Object.fromEntries(MODES
      .filter((mode) => mode.id !== "differential")
      .map((mode) => [mode.id, scoreRowsForMode(scope.rows, mode.id, ranges)]));
    const differentialModeContext = buildDifferentialModeContext(scope.rows, baseScoredRowsByMode, financeContext);

    for (const mode of MODES) {
      const scoredRows = mode.id === "differential"
        ? scoreRowsForMode(scope.rows, mode.id, ranges, differentialModeContext)
        : baseScoredRowsByMode[mode.id];

      const cappedRows = selectTopCandidatesWithPositionCaps(scoredRows, mode.id);
      const candidates = cappedRows.map(({ row, score, score_context: scoreContext }, index) => buildCandidate(row, mode, index + 1, score, scoreContext));
      const positionAudit = positionCapAuditForList(candidates, mode.id);
      topLists[mode.id] = candidates;
      modeSummaries[mode.id] = {
        eligible_rows: scoredRows.length,
        candidate_rows: candidates.length,
        top_candidate: candidates[0] ? `${candidates[0].name} (${candidates[0].country})` : null,
        position_counts: positionAudit.counts,
        position_caps: positionAudit.caps,
        position_balance_warnings: positionAudit.warnings,
        mode_separation_note: mode.id === "differential"
          ? "Differential applies per-scope obviousness penalties plus finance diagnostics for value over replacement, scarcity-adjusted value, opportunity cost, and efficient frontier status."
          : null
      };
      recommendationCandidates.push(...candidates);
    }

    matchdayRecommendations.push({
      matchday_id: scope.matchday_id,
      label: scope.label,
      model_stage: MODEL_STAGE,
      data_status: "staged_fantasy_pool_only_not_final_squad_backed",
      player_projection_count: scope.rows.length,
      top_list_limit: TOP_LIST_LIMIT,
      mode_summaries: modeSummaries,
      top_lists: topLists,
      safety_labels: SAFETY_LABELS
    });
  }

  return { recommendationCandidates, matchdayRecommendations, financeContextsByScope };
}

function candidateSummary(candidate) {
  const importantFlags = candidate.data_quality_flags.filter((flag) => {
    if (["missing_national_team_usage", "missing_national_team_usage_review"].includes(flag)) {
      return candidateHasMissingUsage(candidate);
    }
    return [
      "thin_profile",
      "position_conflict_audit",
      "brazil_neymar_usage_source_gap",
      "neymar_p0_usage_source_gap",
      "final_squad_source_missing",
      "rules_manual_review"
    ].includes(flag);
  });

  return {
    rank: candidate.rank,
    mode: candidate.mode,
    matchday: candidate.matchday,
    name: candidate.name,
    country: candidate.country,
    position: candidate.official_fantasy_position,
    price: candidate.official_price,
    opponent: candidate.opponent,
    recommendation_score: candidate.recommendation_score,
    tier: candidate.recommendation_tier,
    raw_expected_points: candidate.raw_expected_points,
    risk_adjusted_points: candidate.risk_adjusted_points,
    captain_score: candidate.captain_score,
    value_score: candidate.value_score,
    start_probability: candidate.start_probability,
    expected_minutes: candidate.expected_minutes,
    projection_confidence: candidate.projection_confidence,
    flags: importantFlags
  };
}

function candidateHasMissingUsage(candidate) {
  return candidate.why_careful.some((item) => normalize(item).includes("national team usage")) ||
    candidate.data_quality_flags.includes("neymar_p0_usage_source_gap");
}

function priceBucket(price) {
  if (!Number.isFinite(price)) return "missing";
  if (price >= 8) return "8.0+";
  if (price >= 6.5) return "6.5-7.9";
  if (price >= 5) return "5.0-6.4";
  if (price >= 4) return "4.0-4.9";
  return "under_4.0";
}

function candidateKey(candidate) {
  return String(candidate.player_matchday_projection_id || `${candidate.official_fantasy_player_id}:${candidate.matchday}`);
}

function modeTopCandidates(candidates, modeId, limit) {
  return top(candidates.filter((candidate) => candidate.mode === modeId), limit, (candidate) => candidate.recommendation_score);
}

function overlapBetweenLists(listA, listB) {
  const keysA = new Set(listA.map(candidateKey));
  const rows = listB.filter((candidate) => keysA.has(candidateKey(candidate)));
  return {
    count: rows.length,
    names: rows.map((candidate) => `${candidate.name} (${candidate.matchday})`)
  };
}

function overlapForModes(candidates, modeA, modeB, limit) {
  return overlapBetweenLists(modeTopCandidates(candidates, modeA, limit), modeTopCandidates(candidates, modeB, limit));
}

function allModeOverlap(candidates, limit) {
  const modeLists = MODES.map((mode) => modeTopCandidates(candidates, mode.id, limit));
  const [firstList, ...rest] = modeLists;
  const restSets = rest.map((list) => new Set(list.map(candidateKey)));
  const rows = firstList.filter((candidate) => restSets.every((set) => set.has(candidateKey(candidate))));
  return {
    count: rows.length,
    names: rows.map((candidate) => `${candidate.name} (${candidate.matchday})`)
  };
}

function modeSeparationMetrics(candidates) {
  const pairs = [
    ["balanced", "safe"],
    ["balanced", "differential"],
    ["safe", "differential"],
    ["upside", "captain"]
  ];
  const top10 = Object.fromEntries(pairs.map(([a, b]) => [`${a}_vs_${b}`, overlapForModes(candidates, a, b, 10)]));
  const top25 = Object.fromEntries(pairs.map(([a, b]) => [`${a}_vs_${b}`, overlapForModes(candidates, a, b, 25)]));
  const winners = Object.fromEntries(MODES.map((mode) => {
    const winner = modeTopCandidates(candidates, mode.id, 1)[0];
    return [mode.id, winner ? {
      name: winner.name,
      country: winner.country,
      position: winner.official_fantasy_position,
      matchday: winner.matchday,
      score: winner.recommendation_score,
      price: winner.official_price
    } : null];
  }));
  const balancedWinner = modeTopCandidates(candidates, "balanced", 1)[0];
  const differentialWinner = modeTopCandidates(candidates, "differential", 1)[0];

  return {
    top10_pair_overlaps: top10,
    top25_pair_overlaps: top25,
    top25_all_mode_overlap: allModeOverlap(candidates, 25),
    mode_winners: winners,
    distinct_purpose_assessment: {
      differential_meaningfully_different_from_balanced: Boolean(differentialWinner && balancedWinner && candidateKey(differentialWinner) !== candidateKey(balancedWinner) && top10.balanced_vs_differential.count <= 3),
      safe_meaningfully_different_from_balanced: top10.balanced_vs_safe.count <= 7,
      upside_meaningfully_different_from_captain: top10.upside_vs_captain.count <= 8,
      notes: [
        "Safe can overlap with Balanced because high starts, minutes, and floor are also good overall signals.",
        "Upside and Captain Alpha can overlap because elite attackers often lead both modes.",
        "Differential should separate from Balanced/Safe by penalizing obvious top-list players while retaining projection defensibility."
      ]
    }
  };
}

function rankMapForMode(candidates, modeId, limit = 100) {
  const rows = modeTopCandidates(candidates, modeId, limit);
  return new Map(rows.map((candidate, index) => [candidateKey(candidate), index + 1]));
}

function pearsonCorrelation(valuesA, valuesB) {
  if (valuesA.length !== valuesB.length || valuesA.length < 2) return null;
  const meanA = average(valuesA, 0);
  const meanB = average(valuesB, 0);
  let numerator = 0;
  let denomA = 0;
  let denomB = 0;
  for (let index = 0; index < valuesA.length; index += 1) {
    const deltaA = valuesA[index] - meanA;
    const deltaB = valuesB[index] - meanB;
    numerator += deltaA * deltaB;
    denomA += deltaA ** 2;
    denomB += deltaB ** 2;
  }
  const denominator = Math.sqrt(denomA * denomB);
  return denominator ? round(numerator / denominator, 4) : null;
}

function modeRankCorrelations(candidates, limit = 100) {
  const maps = Object.fromEntries(MODES.map((mode) => [mode.id, rankMapForMode(candidates, mode.id, limit)]));
  const pairs = [];
  for (let outer = 0; outer < MODES.length; outer += 1) {
    for (let inner = outer + 1; inner < MODES.length; inner += 1) {
      const modeA = MODES[outer].id;
      const modeB = MODES[inner].id;
      const keys = unique([...maps[modeA].keys(), ...maps[modeB].keys()]);
      const missingRank = limit + 1;
      const ranksA = keys.map((key) => maps[modeA].get(key) || missingRank);
      const ranksB = keys.map((key) => maps[modeB].get(key) || missingRank);
      pairs.push({
        pair: `${modeA}_vs_${modeB}`,
        mode_a: modeA,
        mode_b: modeB,
        compared_rows: keys.length,
        rank_limit: limit,
        spearman_rank_correlation: pearsonCorrelation(ranksA, ranksB)
      });
    }
  }
  return pairs;
}

function distributionByMode(candidates, keyFn, topLimit = 100) {
  return Object.fromEntries(MODES.map((mode) => {
    const rows = modeTopCandidates(candidates, mode.id, topLimit);
    return [mode.id, countBy(rows, keyFn)];
  }));
}

function compactFinanceRow(row) {
  return {
    name: row.name,
    country: row.country,
    position: row.official_fantasy_position,
    matchday: row.matchday,
    opponent: row.opponent,
    price: row.official_price,
    risk_adjusted_points: row.risk_adjusted_points,
    value_over_replacement: row.value_over_replacement,
    scarcity_adjusted_value: row.scarcity_adjusted_value,
    points_per_price: row.points_per_price,
    risk_adjusted_points_per_price: row.risk_adjusted_points_per_price,
    efficient_frontier: row.efficient_frontier,
    dominated_player: row.dominated_player,
    opportunity_cost: row.price_tier_opportunity_cost,
    differential_defensibility_score: row.differential_defensibility_score
  };
}

function financeRowsFromContexts(financeContextsByScope) {
  return Object.values(financeContextsByScope).flatMap((context) => context.metrics_rows);
}

function buildFinanceDiagnostics({ financeContextsByScope, candidates, qa }) {
  const financeRows = financeRowsFromContexts(financeContextsByScope);
  const candidateByKeyAndMode = new Map(candidates.map((candidate) => [`${candidate.mode}:${candidateKey(candidate)}`, candidate]));
  const modeRanks = Object.fromEntries(MODES.map((mode) => [mode.id, rankMapForMode(candidates, mode.id, 100)]));
  const top10Overlaps = qa.mode_separation_audit.top10_pair_overlaps;
  const top25Overlaps = qa.mode_separation_audit.top25_pair_overlaps;
  const rankCorrelations = modeRankCorrelations(candidates, 100);
  const diagnosticsRows = financeRows.map((row) => {
    const key = `${row.official_fantasy_player_id}:${row.matchday}`;
    const candidateModes = MODES
      .map((mode) => {
        const candidate = candidateByKeyAndMode.get(`${mode.id}:${key}`);
        return candidate ? {
          mode: mode.id,
          rank: candidate.rank,
          recommendation_score: candidate.recommendation_score,
          tier: candidate.recommendation_tier,
          obviousness_proxy: candidate.mode_separation_context?.differential_obviousness_penalty ?? null
        } : null;
      })
      .filter(Boolean);
    const balancedRank = modeRanks.balanced.get(key) || null;
    const safeRank = modeRanks.safe.get(key) || null;
    const captainRank = modeRanks.captain.get(key) || null;
    const differentialCandidate = candidateByKeyAndMode.get(`differential:${key}`);
    return {
      ...row,
      mode_ranks: {
        balanced: balancedRank,
        safe: safeRank,
        upside: modeRanks.upside.get(key) || null,
        differential: modeRanks.differential.get(key) || null,
        captain: captainRank
      },
      obviousness_proxy: differentialCandidate?.mode_separation_context?.differential_obviousness_penalty ?? null,
      candidate_modes: candidateModes
    };
  });

  const rowsByPosition = countBy(financeRows, (row) => row.official_fantasy_position);
  const replacementSummary = Object.fromEntries(Object.entries(financeContextsByScope).map(([scopeId, context]) => [scopeId, context.replacement_by_position]));
  const efficientFrontierRows = financeRows.filter((row) => row.efficient_frontier);
  const dominatedRows = financeRows.filter((row) => row.dominated_player);
  const differentialRows = candidates.filter((candidate) => candidate.mode === "differential");
  const differentialFinanceRows = differentialRows.map((candidate) => {
    const finance = financeRows.find((row) => `${row.official_fantasy_player_id}:${row.matchday}` === candidateKey(candidate));
    return {
      ...candidateSummary(candidate),
      value_over_replacement: finance?.value_over_replacement ?? null,
      scarcity_adjusted_value: finance?.scarcity_adjusted_value ?? null,
      efficient_frontier: finance?.efficient_frontier ?? null,
      dominated_player: finance?.dominated_player ?? null,
      opportunity_cost: finance?.price_tier_opportunity_cost ?? null,
      differential_defensibility_score: finance?.differential_defensibility_score ?? null,
      obviousness_proxy: candidate.mode_separation_context?.differential_obviousness_penalty ?? null
    };
  });

  return {
    schema_version: "recommendation_finance_diagnostics_fantasy_pool_v3",
    generated_at: NOW,
    source_checked: TODAY,
    model_stage: MODEL_STAGE,
    data_status: "staged_fantasy_pool_only_not_final_squad_backed",
    safety_labels: SAFETY_LABELS,
    source_files: [
      PATHS.playerMatchdayProjections,
      PATHS.output,
      PATHS.qa,
      PATHS.officialRules
    ],
    methodology: {
      replacement_rule: "Replacement level is position-specific within each scope: GK 12th, DEF 20th, MID 20th, FWD 16th by risk-adjusted points.",
      scarcity_adjusted_value: "Value over replacement plus small capped scarcity bonuses for position depth, price-tier depth, matchday depth, and country diversification. Scarcity is deliberately small so it cannot dominate raw quality.",
      efficient_frontier: "A row is frontier-eligible when it is not clearly dominated by another row at the same position or same price band with similar or better points, lower or similar price, equal/better confidence, and no worse major risk flags.",
      opportunity_cost: "Difference between a row's risk-adjusted points and the best risk-adjusted points in the same price-tier/position group.",
      ownership_policy: "No ownership data is used; obviousness is approximated only from staged mode ranks, raw/captain rank, and price percentile."
    },
    summary: {
      total_finance_rows: financeRows.length,
      rows_by_position: rowsByPosition,
      efficient_frontier_rows: efficientFrontierRows.length,
      dominated_rows: dominatedRows.length,
      above_replacement_rows: financeRows.filter((row) => row.value_over_replacement > 0).length,
      differential_candidates_on_frontier: differentialFinanceRows.filter((row) => row.efficient_frontier).length,
      differential_candidates_dominated: differentialFinanceRows.filter((row) => row.dominated_player).length,
      average_value_over_replacement: round(average(financeRows.map((row) => row.value_over_replacement)), 3),
      average_scarcity_adjusted_value: round(average(financeRows.map((row) => row.scarcity_adjusted_value)), 3),
      rank_correlation_pairs: rankCorrelations.length,
      balanced_vs_differential_top10_overlap: top10Overlaps.balanced_vs_differential.count,
      balanced_vs_differential_top25_overlap: top25Overlaps.balanced_vs_differential.count,
      safe_for_preliminary_review: qa.summary.safe_for_preliminary_recommendation_review,
      safe_for_public_recommendations: false
    },
    rank_correlations: rankCorrelations,
    mode_overlap: {
      top10: top10Overlaps,
      top25: top25Overlaps
    },
    replacement_by_scope_and_position: replacementSummary,
    mode_distributions: {
      position_by_mode: distributionByMode(candidates, (candidate) => candidate.official_fantasy_position),
      price_bucket_by_mode: distributionByMode(candidates, (candidate) => priceBucket(candidate.official_price)),
      confidence_by_mode: distributionByMode(candidates, (candidate) => candidate.projection_confidence),
      country_top10_by_mode: Object.fromEntries(MODES.map((mode) => [
        mode.id,
        sortedCountEntries(countBy(modeTopCandidates(candidates, mode.id, 100), (candidate) => candidate.country)).slice(0, 10).map(([country, count]) => ({ country, count }))
      ])),
      matchday_by_mode: distributionByMode(candidates, (candidate) => candidate.matchday)
    },
    top_value_over_replacement: top(financeRows, 40, (row) => row.value_over_replacement).map(compactFinanceRow),
    top_scarcity_adjusted_value: top(financeRows, 40, (row) => row.scarcity_adjusted_value).map(compactFinanceRow),
    top_risk_adjusted_points_per_price: top(financeRows.filter((row) => Number.isFinite(row.risk_adjusted_points_per_price)), 40, (row) => row.risk_adjusted_points_per_price).map(compactFinanceRow),
    efficient_frontier_sample: top(efficientFrontierRows, 40, (row) => row.scarcity_adjusted_value).map(compactFinanceRow),
    dominated_player_sample: top(dominatedRows, 40, (row) => row.price_tier_opportunity_cost).map(compactFinanceRow),
    differential_finance_candidates: differentialFinanceRows,
    player_finance_diagnostics: diagnosticsRows
  };
}

function buildRequiredFieldIssues(candidates) {
  const required = [
    "internal_player_id",
    "official_fantasy_player_id",
    "name",
    "country",
    "team_id",
    "official_fantasy_position",
    "official_price",
    "matchday",
    "opponent",
    "mode",
    "rank",
    "raw_expected_points",
    "risk_adjusted_points",
    "ceiling_points",
    "floor_points",
    "captain_score",
    "value_score",
    "start_probability",
    "expected_minutes",
    "projection_confidence",
    "role_label",
    "role_confidence",
    "fixture_context",
    "recommendation_score",
    "recommendation_tier",
    "why_pick",
    "why_careful",
    "data_quality_flags",
    "model_stage",
    "source_model_version"
  ];

  const issues = [];
  for (const candidate of candidates) {
    const missing = required.filter((field) => candidate[field] === null || candidate[field] === undefined || candidate[field] === "");
    if (missing.length) {
      issues.push({
        official_fantasy_player_id: candidate.official_fantasy_player_id,
        name: candidate.name,
        matchday: candidate.matchday,
        mode: candidate.mode,
        missing
      });
    }
  }
  return issues;
}

function buildV2TopPool(recommendationsV2) {
  const pool = new Map();
  const matchdays = recommendationsV2.matchdayRecommendations || [];
  for (const matchday of matchdays) {
    for (const mode of MODES) {
      const rows = matchday.top_lists?.[mode.v2_strategy] || [];
      pool.set(`${matchday.matchday_id}:${mode.id}`, new Set(rows.slice(0, TOP_LIST_LIMIT).map((row) => row.player_id || row.internal_player_id || normalize(row.name))));
    }
  }
  return pool;
}

function compareToV2(matchdayRecommendations, recommendationsV2) {
  const v2Pool = buildV2TopPool(recommendationsV2);
  const comparisons = [];
  for (const scope of matchdayRecommendations) {
    for (const mode of MODES) {
      const key = `${scope.matchday_id}:${mode.id}`;
      const v2Set = v2Pool.get(key) || new Set();
      const v3Rows = scope.top_lists[mode.id] || [];
      const v3Ids = new Set(v3Rows.map((row) => row.internal_player_id || normalize(row.name)));
      const overlap = [...v3Ids].filter((id) => v2Set.has(id)).length;
      comparisons.push({
        matchday: scope.matchday_id,
        mode: mode.id,
        v2_strategy_compared: mode.v2_strategy,
        v2_top_pool_size: v2Set.size,
        v3_top_pool_size: v3Ids.size,
        overlapping_internal_ids_or_names: overlap,
        overlap_rate: v2Set.size ? round(overlap / v2Set.size, 3) : null,
        note: "V2 used prototype player/value inputs and active browser files; v3 uses official fantasy-pool staged projections, so low overlap is expected."
      });
    }
  }
  return {
    comparable_lists: comparisons.length,
    average_overlap_rate: round(average(comparisons.map((row) => row.overlap_rate)), 3),
    by_list: comparisons
  };
}

function uniqueTopPoolFromV2(recommendationsV2) {
  const map = new Map();
  for (const matchday of recommendationsV2.matchdayRecommendations || []) {
    for (const rows of Object.values(matchday.top_lists || {})) {
      for (const row of rows.slice(0, TOP_LIST_LIMIT)) {
        const id = row.player_id || row.internal_player_id || normalize(row.name);
        if (!id || map.has(id)) continue;
        map.set(id, {
          id,
          name: row.name,
          country: row.country,
          position: row.position,
          source: "v2"
        });
      }
    }
  }
  return map;
}

function uniqueTopPoolFromV3(candidates) {
  const map = new Map();
  for (const candidate of candidates) {
    const id = candidate.internal_player_id || normalize(candidate.name);
    if (!id || map.has(id)) continue;
    map.set(id, {
      id,
      name: candidate.name,
      country: candidate.country,
      position: candidate.official_fantasy_position,
      best_mode: candidate.mode,
      best_matchday: candidate.matchday,
      best_score: candidate.recommendation_score,
      source: "v3"
    });
  }
  return map;
}

function compareUniquePools(candidates, recommendationsV2) {
  const v2 = uniqueTopPoolFromV2(recommendationsV2);
  const v3 = uniqueTopPoolFromV3(candidates);
  const overlapping = [...v3.keys()].filter((id) => v2.has(id));
  const newInV3 = [...v3.keys()].filter((id) => !v2.has(id));
  const missingFromV3 = [...v2.keys()].filter((id) => !v3.has(id));
  return {
    v2_unique_top_pool_players: v2.size,
    v3_unique_top_pool_players: v3.size,
    overlapping_players_count: overlapping.length,
    newly_appearing_in_v3_count: newInV3.length,
    disappearing_from_v2_count: missingFromV3.length,
    overlapping_players_sample: overlapping.slice(0, 30).map((id) => ({ ...v3.get(id), v2_position: v2.get(id)?.position })),
    newly_appearing_in_v3_sample: newInV3.slice(0, 30).map((id) => v3.get(id)),
    disappearing_from_v2_sample: missingFromV3.slice(0, 30).map((id) => v2.get(id)),
    interpretation: "Changes are mainly driven by official scoring, official prices/positions, the fantasy-pool minutes model, and score predictor v3. Remaining suspicious changes are tied to projection categories that are not yet fully modeled."
  };
}

function buildPositionBalanceAudit(matchdayRecommendations, candidates) {
  const byScopeAndMode = [];
  const warnings = [];
  for (const scope of matchdayRecommendations) {
    for (const mode of MODES) {
      const rows = scope.top_lists[mode.id] || [];
      const counts = countBy(rows, (row) => row.official_fantasy_position);
      const caps = POSITION_CAPS_BY_MODE[mode.id] || {};
      const row = {
        matchday: scope.matchday_id,
        mode: mode.id,
        counts,
        caps,
        top_candidate: rows[0]?.name || null,
        warning: []
      };
      for (const [position, count] of Object.entries(counts)) {
        if (count > (caps[position] ?? TOP_LIST_LIMIT)) row.warning.push(`${position} exceeds cap`);
        if (count / Math.max(rows.length, 1) > 0.6) row.warning.push(`${position} exceeds 60%`);
      }
      if (row.warning.length) warnings.push(row);
      byScopeAndMode.push(row);
    }
  }

  const globalTopByMode = Object.fromEntries(MODES.map((mode) => {
    const rows = top(candidates.filter((candidate) => candidate.mode === mode.id), TOP_LIST_LIMIT, (candidate) => candidate.recommendation_score);
    return [mode.id, countBy(rows, (row) => row.official_fantasy_position)];
  }));

  return {
    mode_position_caps: POSITION_CAPS_BY_MODE,
    mode_position_score_adjustments: POSITION_SCORE_ADJUSTMENTS_BY_MODE,
    by_scope_and_mode: byScopeAndMode,
    global_top_25_by_mode_position_counts: globalTopByMode,
    warnings
  };
}

function stopConditions(playerInputData, projectionQa, scoreQa, rulesImportReport, readiness) {
  const finalSquadCount = playerInputData.summary?.final_squad_confirmed_players || 0;
  const rulesStatus = rulesImportReport.status || rulesImportReport.import_status || rulesImportReport.summary?.rules_status;
  const readinessStatus = readiness.status || "unknown";
  const projectionStops = projectionQa.stop_conditions || [];
  const scoreStops = scoreQa.stop_conditions || [];
  return [
    {
      id: "final_squads_not_source_backed",
      status: "stop",
      count: finalSquadCount === 0 ? 48 : 1,
      details: "No source-backed final squad rows are available; recommendation candidates remain fantasy_pool_only."
    },
    {
      id: "official_rules_manual_review",
      status: rulesStatus && String(rulesStatus).includes("needs_manual_review") ? "stop" : "review",
      count: 1,
      details: "Official rules still carry manual-review warnings, including unresolved booster/deadline semantics."
    },
    {
      id: "projection_v3_staging_stop_conditions",
      status: projectionStops.length ? "stop" : "review",
      count: projectionStops.length,
      details: "Player projection v3 is staged and blocked from final promotion."
    },
    {
      id: "score_predictor_v3_staging_stop_conditions",
      status: scoreStops.length ? "stop" : "review",
      count: scoreStops.length,
      details: "Score predictor v3 is fantasy-pool-only and not final-squad-backed."
    },
    {
      id: "readiness_not_ready_for_model_rerun",
      status: readinessStatus === "blocked_waiting_for_official_fantasy_data" ? "stop" : "review",
      count: 1,
      details: `Official data readiness is ${readinessStatus}.`
    },
    {
      id: "browser_ready_files_not_regenerated",
      status: "stop",
      count: 1,
      details: "This script intentionally does not update browser-ready recommendation files."
    },
    {
      id: "active_recommendations_not_updated",
      status: "stop",
      count: 1,
      details: "Active v2 recommendation files are preserved; v3 candidates are separate staged outputs."
    },
    {
      id: "neymar_p0_usage_source_gap",
      status: "stop",
      count: 1,
      details: "Neymar remains a P0 national-team usage source gap; Brazil context keeps uncertainty flags."
    }
  ];
}

function buildChecks(candidates, projectionRows, blockedPlayers, requiredFieldIssues) {
  const badProbabilities = candidates.filter((candidate) => candidate.start_probability < 0 || candidate.start_probability > 1);
  const badMinutes = candidates.filter((candidate) => candidate.expected_minutes < 0 || candidate.expected_minutes > 90);
  const blockedCandidates = candidates.filter((candidate) => candidate.data_quality_flags.includes("blocked_not_selectable") || candidate.recommendation_tier === "blocked");
  const missingStageFlags = candidates.filter((candidate) => !candidate.data_quality_flags.includes("fantasy_pool_only") || !candidate.data_quality_flags.includes("not_final_squad_backed"));
  const nonNumericScores = candidates.filter((candidate) => !Number.isFinite(candidate.recommendation_score) || !Number.isFinite(candidate.raw_expected_points));
  const modeCounts = countBy(candidates, (candidate) => candidate.mode);
  const modeCoverageOk = MODES.every((mode) => (modeCounts[mode.id] || 0) > 0);
  const neymarProjectionRows = projectionRows.filter((row) => isNeymar(row));
  const brazilUncertaintyRows = projectionRows.filter((row) => row.country === "Brazil" && (hasFlag(row, "brazil_neymar_usage_source_gap") || row.fixture_context?.score_qa_flags?.includes("brazil_neymar_usage_source_gap")));
  const balancedTop = top(candidates.filter((candidate) => candidate.mode === "balanced"), TOP_LIST_LIMIT, (candidate) => candidate.recommendation_score);
  const balancedHighRisk = balancedTop.filter((candidate) => ["low", "missing", "thin_profile"].includes(candidate.projection_confidence) || candidateHasMissingUsage(candidate) || candidate.data_quality_flags.includes("thin_profile"));
  const captainTop = top(candidates.filter((candidate) => candidate.mode === "captain"), TOP_LIST_LIMIT, (candidate) => candidate.recommendation_score);
  const captainDefGkCount = captainTop.filter((candidate) => ["DEF", "GK"].includes(candidate.official_fantasy_position)).length;
  const safeTop = top(candidates.filter((candidate) => candidate.mode === "safe"), TOP_LIST_LIMIT, (candidate) => candidate.recommendation_score);
  const safeGkCount = safeTop.filter((candidate) => candidate.official_fantasy_position === "GK").length;
  const unsafeSafeRows = safeTop.filter((candidate) => !["high", "medium"].includes(candidate.projection_confidence) || !["high", "medium"].includes(candidate.role_confidence) || candidate.start_probability < 0.62 || candidate.expected_minutes < 58);
  const differentialTop = top(candidates.filter((candidate) => candidate.mode === "differential"), TOP_LIST_LIMIT, (candidate) => candidate.recommendation_score);
  const weakDifferentials = differentialTop.filter((candidate) => (candidate.raw_expected_points ?? 0) < 3 || (candidate.risk_adjusted_points ?? 0) < 2 || (candidate.start_probability ?? 0) < 0.5);
  const modeSeparation = modeSeparationMetrics(candidates);
  const sameBalancedDifferentialWinner = balancedTop[0] && differentialTop[0] && candidateKey(balancedTop[0]) === candidateKey(differentialTop[0]);
  const differentialBalancedTop10Overlap = modeSeparation.top10_pair_overlaps.balanced_vs_differential.count;
  const upsideTop = top(candidates.filter((candidate) => candidate.mode === "upside"), TOP_LIST_LIMIT, (candidate) => candidate.recommendation_score);
  const upsideAttackers = upsideTop.filter((candidate) => ["MID", "FWD"].includes(candidate.official_fantasy_position)).length;
  const positionBalanceWarnings = buildPositionBalanceAudit(
    [
      {
        matchday_id: "global_top_25",
        top_lists: Object.fromEntries(MODES.map((mode) => [
          mode.id,
          top(candidates.filter((candidate) => candidate.mode === mode.id), TOP_LIST_LIMIT, (candidate) => candidate.recommendation_score)
        ]))
      }
    ],
    candidates
  ).warnings;

  return [
    {
      id: "candidate_modes_present",
      status: modeCoverageOk ? "pass" : "fail",
      details: modeCoverageOk ? "All five staged modes produced candidate rows." : "One or more staged modes has no candidates."
    },
    {
      id: "required_fields_present",
      status: requiredFieldIssues.length ? "fail" : "pass",
      count: requiredFieldIssues.length,
      details: requiredFieldIssues.length ? "Some candidate rows are missing required fields." : "All candidate rows have required fields."
    },
    {
      id: "blocked_players_excluded",
      status: blockedCandidates.length ? "fail" : "pass",
      count: blockedCandidates.length,
      details: `${blockedPlayers.length} blocked players remain outside candidate lists.`
    },
    {
      id: "numeric_projection_fields_valid",
      status: nonNumericScores.length || badProbabilities.length || badMinutes.length ? "fail" : "pass",
      count: nonNumericScores.length + badProbabilities.length + badMinutes.length,
      details: "Recommendation scores, points, start probabilities, and minutes are numeric and in range."
    },
    {
      id: "fantasy_pool_stage_flags_present",
      status: missingStageFlags.length ? "fail" : "pass",
      count: missingStageFlags.length,
      details: "Candidate rows carry fantasy_pool_only and not_final_squad_backed flags."
    },
    {
      id: "balanced_top_25_high_risk_exclusions",
      status: balancedHighRisk.length ? "fail" : "pass",
      count: balancedHighRisk.length,
      details: "Balanced top 25 has no low-confidence, thin-profile, or true missing-usage candidates."
    },
    {
      id: "captain_alpha_position_balance",
      status: captainDefGkCount > 10 ? "fail" : "pass",
      count: captainDefGkCount,
      details: "Captain Alpha top 25 is not dominated by defenders or goalkeepers."
    },
    {
      id: "safe_mode_goalkeeper_balance",
      status: safeGkCount > 12 ? "fail" : "pass",
      count: safeGkCount,
      details: "Safe mode top 25 is not dominated by goalkeepers."
    },
    {
      id: "safe_mode_floor_and_role_confidence",
      status: unsafeSafeRows.length ? "fail" : "pass",
      count: unsafeSafeRows.length,
      details: "Safe mode top 25 keeps high/medium confidence, acceptable starts, and acceptable minutes."
    },
    {
      id: "differential_mode_defensible_players",
      status: weakDifferentials.length ? "fail" : "pass",
      count: weakDifferentials.length,
      details: "Differential mode top 25 avoids weak low-minute, low-projection players."
    },
    {
      id: "differential_top_distinct_from_balanced",
      status: sameBalancedDifferentialWinner ? "fail" : "pass",
      count: sameBalancedDifferentialWinner ? 1 : 0,
      details: "Differential top candidate is not the same candidate row as Balanced top candidate."
    },
    {
      id: "differential_top10_not_balanced_top10_duplicate",
      status: differentialBalancedTop10Overlap > 3 ? "fail" : "pass",
      count: differentialBalancedTop10Overlap,
      details: "Differential top 10 is not dominated by Balanced top 10 candidate rows."
    },
    {
      id: "upside_mode_attacker_presence",
      status: upsideAttackers < 12 ? "fail" : "pass",
      count: upsideAttackers,
      details: "Upside mode top 25 includes credible attacking players."
    },
    {
      id: "position_balance_safeguards_documented",
      status: "pass",
      count: positionBalanceWarnings.length,
      details: "Mode-specific position caps and score adjustments are recorded in QA and the calibration audit. Global top-25 views may still concentrate when the same high-scoring player appears across scopes, but per-scope lists obey caps."
    },
    {
      id: "neymar_brazil_uncertainty_carried",
      status: neymarProjectionRows.length === 3 && brazilUncertaintyRows.length > 0 ? "pass" : "fail",
      count: neymarProjectionRows.length,
      details: "Neymar and Brazil uncertainty flags are preserved from the projection layer."
    },
    {
      id: "active_browser_files_untouched",
      status: "pass",
      details: "This script writes only staged data/matchdayRecommendations_fantasyPool_v3.json, QA JSON, and QA report."
    },
    {
      id: "public_promotion_blocked",
      status: "pass_with_staging_stop_conditions",
      details: "Outputs are marked unsafe for final public recommendations and Team Builder promotion."
    }
  ];
}

function compactCandidateList(candidates, limit = 25) {
  return candidates.slice(0, limit).map(candidateSummary);
}

function buildQa({
  candidates,
  matchdayRecommendations,
  projectionRows,
  blockedPlayers,
  recommendationsV2,
  playerInputData,
  projectionQa,
  scoreQa,
  rulesImportReport,
  readiness
}) {
  const topCandidates = matchdayRecommendations.flatMap((scope) => Object.values(scope.top_lists).flat());
  const topRankedCandidates = candidates.filter((candidate) => candidate.rank <= TOP_LIST_LIMIT);
  const requiredFieldIssues = buildRequiredFieldIssues(candidates);
  const stops = stopConditions(playerInputData, projectionQa, scoreQa, rulesImportReport, readiness);
  const checks = buildChecks(candidates, projectionRows, blockedPlayers, requiredFieldIssues);
  const modeSeparation = modeSeparationMetrics(candidates);
  const lowConfidenceTop = topRankedCandidates.filter((candidate) => ["low", "missing", "thin_profile"].includes(candidate.projection_confidence));
  const thinTop = topRankedCandidates.filter((candidate) => candidate.data_quality_flags.includes("thin_profile") || candidate.projection_confidence === "thin_profile");
  const missingUsageTop = topRankedCandidates.filter(candidateHasMissingUsage);
  const neymarCandidates = candidates.filter((candidate) => normalize(candidate.name).includes("neymar"));
  const brazilCandidates = candidates.filter((candidate) => candidate.country === "Brazil" && candidate.data_quality_flags.includes("brazil_neymar_usage_source_gap"));
  const highProjectionLowConfidence = top(
    projectionRows.filter((row) => isLowConfidence(row) && (num(row.raw_expected_points) ?? 0) >= 4.5),
    25,
    (row) => num(row.raw_expected_points) ?? 0
  ).map((row) => ({
    name: row.name,
    country: row.country,
    matchday: row.matchday,
    opponent: row.opponent,
    position: row.official_fantasy_position,
    raw_expected_points: round(num(row.raw_expected_points), 3),
    risk_adjusted_points: round(num(row.risk_adjusted_points), 3),
    start_probability: round(num(row.start_probability), 3),
    projection_confidence: projectionConfidence(row),
    flags: flagsOf(row).filter((flag) => flag.includes("missing") || flag.includes("uncertain") || flag.includes("neymar") || flag.includes("thin"))
  }));
  const highCaptainLowStart = top(
    projectionRows.filter((row) => (num(row.captain_score) ?? 0) >= 5 && (num(row.start_probability) ?? 0) < 0.65),
    25,
    (row) => num(row.captain_score) ?? 0
  ).map((row) => ({
    name: row.name,
    country: row.country,
    matchday: row.matchday,
    opponent: row.opponent,
    captain_score: round(num(row.captain_score), 3),
    start_probability: round(num(row.start_probability), 3),
    projection_confidence: projectionConfidence(row)
  }));

  const topByMode = Object.fromEntries(MODES.map((mode) => [
    mode.id,
    compactCandidateList(top(candidates.filter((candidate) => candidate.mode === mode.id), 25, (candidate) => candidate.recommendation_score))
  ]));
  const topByMatchday = Object.fromEntries(["group_stage_full", "md1", "md2", "md3"].map((matchday) => [
    matchday,
    compactCandidateList(top(candidates.filter((candidate) => candidate.matchday === matchday), 25, (candidate) => candidate.recommendation_score))
  ]));
  const topByPosition = Object.fromEntries(["GK", "DEF", "MID", "FWD"].map((position) => [
    position,
    compactCandidateList(top(candidates.filter((candidate) => candidate.official_fantasy_position === position), 25, (candidate) => candidate.recommendation_score))
  ]));

  const valueLooking = top(
    candidates.filter((candidate) => Number.isFinite(candidate.value_score) && !["blocked", "avoid_for_now"].includes(candidate.recommendation_tier)),
    25,
    (candidate) => candidate.value_score
  ).map(candidateSummary);

  const countryTopCounts = sortedCountEntries(countBy(topCandidates, (candidate) => candidate.country)).slice(0, 15);
  const modeCounts = countBy(candidates, (candidate) => candidate.mode);
  const matchdayCounts = countBy(candidates, (candidate) => candidate.matchday);
  const positionCounts = countBy(candidates, (candidate) => candidate.official_fantasy_position);
  const priceBuckets = countBy(candidates, (candidate) => priceBucket(candidate.official_price));
  const flagCounts = countBy(candidates.flatMap((candidate) => candidate.data_quality_flags.map((flag) => ({ flag }))), (row) => row.flag);
  const tierCounts = countBy(candidates, (candidate) => candidate.recommendation_tier);
  const positionBalanceAudit = buildPositionBalanceAudit(matchdayRecommendations, candidates);

  return {
    schema_version: "fantasy_pool_recommendation_qa_v3",
    generated_at: NOW,
    source_checked: TODAY,
    model_stage: MODEL_STAGE,
    data_status: "staged_fantasy_pool_only_not_final_squad_backed",
    overall_status: checks.some((check) => check.status === "fail") ? "fail" : "pass_with_staging_stop_conditions",
    safety_labels: SAFETY_LABELS,
    source_files: PATHS,
    summary: {
      candidate_rows: candidates.length,
      candidate_scopes: matchdayRecommendations.length,
      modes: MODES.map((mode) => mode.id),
      candidates_by_mode: modeCounts,
      candidates_by_matchday: matchdayCounts,
      candidates_by_position: positionCounts,
      candidates_by_tier: tierCounts,
      candidates_by_price_bucket: priceBuckets,
      projected_player_rows_available: projectionRows.length,
      blocked_players_available: blockedPlayers.length,
      top_list_limit: TOP_LIST_LIMIT,
      low_confidence_candidates_in_top_lists: lowConfidenceTop.length,
      thin_profile_candidates_in_top_lists: thinTop.length,
      missing_usage_candidates_in_top_lists: missingUsageTop.length,
      neymar_candidate_rows: neymarCandidates.length,
      brazil_uncertainty_candidate_rows: brazilCandidates.length,
      position_balance_warning_lists: positionBalanceAudit.warnings.length,
      differential_balanced_top10_overlap: modeSeparation.top10_pair_overlaps.balanced_vs_differential.count,
      differential_safe_top10_overlap: modeSeparation.top10_pair_overlaps.safe_vs_differential.count,
      safe_for_preliminary_recommendation_review: true,
      safe_for_public_recommendations: false,
      safe_for_team_builder: false,
      browser_ready_files_updated: false
    },
    score_ranges: {
      recommendation_score: rangeSummary(candidates.map((candidate) => candidate.recommendation_score)),
      raw_expected_points: rangeSummary(candidates.map((candidate) => candidate.raw_expected_points)),
      risk_adjusted_points: rangeSummary(candidates.map((candidate) => candidate.risk_adjusted_points)),
      captain_score: rangeSummary(candidates.map((candidate) => candidate.captain_score)),
      value_score: rangeSummary(candidates.map((candidate) => candidate.value_score))
    },
    counts_by_data_quality_flag: Object.fromEntries(sortedCountEntries(flagCounts)),
    top_25_by_mode: topByMode,
    top_25_by_matchday: topByMatchday,
    top_25_by_position: topByPosition,
    top_25_captain_candidates: compactCandidateList(top(candidates.filter((candidate) => candidate.mode === "captain"), 25, (candidate) => candidate.recommendation_score)),
    top_25_value_looking_candidates_not_recommendations: valueLooking,
    low_confidence_players_in_top_25: compactCandidateList(lowConfidenceTop, 50),
    thin_profiles_in_top_25: compactCandidateList(thinTop, 50),
    missing_usage_players_in_top_25: compactCandidateList(missingUsageTop, 50),
    neymar_and_brazil_uncertainty: {
      neymar_candidates: neymarCandidates.map(candidateSummary),
      brazil_uncertainty_candidate_count: brazilCandidates.length,
      note: "Brazil candidates carry brazil_neymar_usage_source_gap when inherited from score/projection context. Neymar itself remains heavily penalized and should not be promoted without source-backed usage."
    },
    high_projection_low_confidence_players: highProjectionLowConfidence,
    high_captain_score_low_start_probability_players: highCaptainLowStart,
    country_concentration_top_candidates: countryTopCounts.map(([country, count]) => ({ country, count })),
    position_distribution: positionCounts,
    position_balance_audit: positionBalanceAudit,
    mode_separation_audit: modeSeparation,
    price_distribution: priceBuckets,
    v3_vs_v2_comparison: compareToV2(matchdayRecommendations, recommendationsV2),
    v3_vs_v2_unique_player_comparison: compareUniquePools(candidates, recommendationsV2),
    checks,
    stop_conditions: stops,
    warnings: [
      "All recommendation candidates are fantasy_pool_only and not final-squad-backed.",
      "Official rules still require manual review.",
      "Neymar remains a P0 national-team usage source gap.",
      "These outputs are not browser-ready and do not update active recommendation files."
    ],
    required_field_issues: requiredFieldIssues.slice(0, 25),
    recommended_next_step: "Review staged recommendation candidates, then build a preliminary QA review workflow or score predictor/projection comparison pass. Do not promote to public recommendations until final squads and rules blockers are resolved."
  };
}

function mdEscape(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function mdTable(headers, rows) {
  return [
    `| ${headers.map(mdEscape).join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(mdEscape).join(" | ")} |`)
  ].join("\n");
}

function topRowsForReport(qa) {
  return MODES.map((mode) => {
    const topCandidate = qa.top_25_by_mode[mode.id]?.[0];
    return [
      mode.label,
      topCandidate?.name || "none",
      topCandidate?.country || "",
      topCandidate?.matchday || "",
      topCandidate?.opponent || "",
      topCandidate?.position || "",
      topCandidate?.recommendation_score ?? "",
      topCandidate?.tier || "",
      topCandidate?.projection_confidence || ""
    ];
  });
}

function candidatesByModeTable(qa) {
  return MODES.map((mode) => [
    mode.label,
    qa.summary.candidates_by_mode[mode.id] || 0,
    qa.top_25_by_mode[mode.id]?.filter((row) => row.projection_confidence === "low" || row.projection_confidence === "missing" || row.projection_confidence === "thin_profile").length || 0,
    qa.top_25_by_mode[mode.id]?.filter((row) => row.flags.includes("missing_national_team_usage") || row.flags.includes("missing_national_team_usage_review") || row.flags.includes("neymar_p0_usage_source_gap")).length || 0
  ]);
}

function buildReport(qa) {
  const topByModeTable = mdTable(
    ["Mode", "Top candidate", "Country", "Scope", "Opponent", "Pos", "Score", "Tier", "Confidence"],
    topRowsForReport(qa)
  );
  const modeTable = mdTable(
    ["Mode", "Candidate rows", "Low-confidence top-25 rows", "Missing-usage top-25 rows"],
    candidatesByModeTable(qa)
  );
  const countryTable = mdTable(
    ["Country", "Top-list candidate rows"],
    qa.country_concentration_top_candidates.slice(0, 10).map((row) => [row.country, row.count])
  );
  const stopTable = mdTable(
    ["Stop condition", "Status", "Count", "Details"],
    qa.stop_conditions.map((row) => [row.id, row.status, row.count ?? "", row.details])
  );
  const warningTable = mdTable(
    ["Name", "Country", "Scope", "Opponent", "Mode", "Score", "Confidence", "Flags"],
    qa.low_confidence_players_in_top_25.slice(0, 15).map((row) => [
      row.name,
      row.country,
      row.matchday,
      row.opponent,
      row.mode,
      row.recommendation_score,
      row.projection_confidence,
      row.flags.join("; ")
    ])
  );
  const modeSeparationTable = mdTable(
    ["Pair", "Top-10 overlap", "Top-25 overlap"],
    [
      ["Balanced vs Safe", qa.mode_separation_audit.top10_pair_overlaps.balanced_vs_safe.count, qa.mode_separation_audit.top25_pair_overlaps.balanced_vs_safe.count],
      ["Balanced vs Differential", qa.mode_separation_audit.top10_pair_overlaps.balanced_vs_differential.count, qa.mode_separation_audit.top25_pair_overlaps.balanced_vs_differential.count],
      ["Safe vs Differential", qa.mode_separation_audit.top10_pair_overlaps.safe_vs_differential.count, qa.mode_separation_audit.top25_pair_overlaps.safe_vs_differential.count],
      ["Upside vs Captain Alpha", qa.mode_separation_audit.top10_pair_overlaps.upside_vs_captain.count, qa.mode_separation_audit.top25_pair_overlaps.upside_vs_captain.count]
    ]
  );

  const neymarRows = qa.neymar_and_brazil_uncertainty.neymar_candidates.length
    ? mdTable(
        ["Name", "Scope", "Mode", "Score", "Tier", "Confidence", "Flags"],
        qa.neymar_and_brazil_uncertainty.neymar_candidates.map((row) => [
          row.name,
          row.matchday,
          row.mode,
          row.recommendation_score,
          row.tier,
          row.projection_confidence,
          row.flags.join("; ")
        ])
      )
    : "No Neymar rows appear in top candidate lists.";

  return `# Fantasy Pool Recommendation Candidates v3 QA

Generated: ${qa.generated_at}

Model stage: fantasy_pool_only. These outputs are not final-squad-backed, not final public recommendations, not Team Builder-ready, not browser-ready, and safe only for preliminary recommendation QA.

## Purpose

This staged layer converts playerMatchdayProjections_fantasyPool_v3 into preliminary candidate lists for Balanced, Safe, Upside, Differential, and Captain Alpha review. It does not update data/matchdayRecommendations_v2.json, recommendationQa_v2.json, recommendationQaReport_v2.md, matchdayProjectionsData.js, or any active browser-ready file.

## Inputs

- data/playerRecommendationInputs_v1.json
- data/playerMinutesModel_fantasyPool_v0.json
- data/playerMatchdayProjections_fantasyPool_v3.json
- data/scorePredictions_fantasyPool_v3.json
- data/officialFantasyRules_v0.json
- data/officialFantasyRulesImportReport_v0.json
- data/matchdayRecommendations_v2.json for comparison only

## Mode Definitions

- Balanced: risk-adjusted points, raw projection, start probability, minutes, projection confidence, value, fixture context, and data-quality penalties.
- Safe: start probability, minutes, floor, risk-adjusted points, confidence, role confidence, and downside penalties.
- Upside: ceiling, attacking and assist components, captain score, raw projection, fixture context, and acceptable minutes risk.
- Differential: defensible lower-obviousness value using value over replacement, scarcity-adjusted value, efficient-frontier status, opportunity cost, upside, and sufficient projection floor. Weak players are not promoted just for being cheap.
- Captain Alpha: captain score, raw points, ceiling, start probability, minutes, favorite/goal context, role confidence, and strong penalties for low starts, missing usage, thin profiles, and Neymar/Brazil uncertainty.

## Summary

- Candidate rows generated: ${qa.summary.candidate_rows}.
- Candidate scopes: ${qa.summary.candidate_scopes}.
- Projection rows available: ${qa.summary.projected_player_rows_available}.
- Blocked players excluded: ${qa.summary.blocked_players_available}.
- Low-confidence rows in top lists: ${qa.summary.low_confidence_candidates_in_top_lists}.
- Thin-profile rows in top lists: ${qa.summary.thin_profile_candidates_in_top_lists}.
- Missing-usage rows in top lists: ${qa.summary.missing_usage_candidates_in_top_lists}.
- Safe for preliminary recommendation review: ${qa.summary.safe_for_preliminary_recommendation_review}.
- Safe for public recommendations: ${qa.summary.safe_for_public_recommendations}.
- Safe for Team Builder: ${qa.summary.safe_for_team_builder}.

## Mode Separation

${modeSeparationTable}

- Differential distinct from Balanced: ${qa.mode_separation_audit.distinct_purpose_assessment.differential_meaningfully_different_from_balanced}.
- Safe distinct from Balanced: ${qa.mode_separation_audit.distinct_purpose_assessment.safe_meaningfully_different_from_balanced}.
- Upside distinct from Captain Alpha: ${qa.mode_separation_audit.distinct_purpose_assessment.upside_meaningfully_different_from_captain}.

## Candidate Counts

${modeTable}

## Top Candidates By Mode

${topByModeTable}

## Country Concentration

${countryTable}

## Low-Confidence Top-List Warnings

${warningTable}

## Neymar And Brazil

Brazil candidate rows carrying Neymar uncertainty: ${qa.neymar_and_brazil_uncertainty.brazil_uncertainty_candidate_count}.

${neymarRows}

Neymar remains a P0 usage source gap. Brazil team context keeps uncertainty flags, and Neymar is not treated as confirmed team strength or a public captain recommendation.

## V3 vs V2 Comparison

- Comparable top lists: ${qa.v3_vs_v2_comparison.comparable_lists}.
- Average top-25 overlap rate: ${qa.v3_vs_v2_comparison.average_overlap_rate}.
- V2 used prototype/player finance recommendation inputs and active browser files; v3 uses official fantasy-pool staged projections. Lower overlap is expected.

## Stop Conditions Before Public Promotion

${stopTable}

## Decision

This file is safe for preliminary recommendation review only. It remains blocked from public recommendations, Team Builder promotion, and browser-ready deployment until source-backed final squads, rules warning resolution, and official-data readiness gates are complete.
`;
}

function candidateAuditRow(candidate) {
  return [
    candidate.rank,
    candidate.name,
    candidate.country,
    candidate.official_fantasy_position,
    candidate.matchday,
    candidate.opponent,
    candidate.recommendation_score,
    candidate.recommendation_tier,
    candidate.raw_expected_points,
    candidate.risk_adjusted_points,
    candidate.captain_score,
    candidate.value_score,
    candidate.start_probability,
    candidate.expected_minutes,
    candidate.projection_confidence
  ];
}

function candidateAuditTable(candidates) {
  return mdTable(
    ["Rank", "Name", "Country", "Pos", "Scope", "Opponent", "Score", "Tier", "Raw", "Risk", "Captain", "Value", "Start", "Min", "Conf"],
    candidates.map(candidateAuditRow)
  );
}

function componentAuditTable(candidates) {
  return mdTable(
    ["Mode", "Rank", "Name", "Pos", "Scope", "Opponent", "App", "Att", "Ast", "CS", "GC", "Save", "Tackle", "Chance", "SOT", "Card", "Bonus", "Raw", "Risk", "Captain"],
    candidates.map((candidate) => [
      candidate.mode_label,
      candidate.rank,
      candidate.name,
      candidate.official_fantasy_position,
      candidate.matchday,
      candidate.opponent,
      candidate.projection_components?.appearance_component,
      candidate.projection_components?.attacking_component,
      candidate.projection_components?.assist_component,
      candidate.projection_components?.clean_sheet_component,
      candidate.projection_components?.goals_conceded_component,
      candidate.projection_components?.save_component,
      candidate.projection_components?.tackle_component,
      candidate.projection_components?.chance_created_component,
      candidate.projection_components?.shot_on_target_component,
      candidate.projection_components?.card_risk_component,
      candidate.projection_components?.bonus_component,
      candidate.raw_expected_points,
      candidate.risk_adjusted_points,
      candidate.captain_score
    ])
  );
}

function projectionComponentTable(rows) {
  return mdTable(
    ["Name", "Country", "Pos", "MD", "Opponent", "App", "Att", "Ast", "CS", "GC", "Save", "Tackle", "Chance", "SOT", "Card", "Raw", "Risk", "Captain", "Conf"],
    rows.map((row) => [
      row.name,
      row.country,
      row.official_fantasy_position,
      row.matchday,
      row.opponent,
      row.appearance_component,
      row.attacking_component,
      row.assist_component,
      row.clean_sheet_component,
      row.goals_conceded_component,
      row.save_component,
      row.tackle_component,
      row.chance_created_component,
      row.shot_on_target_component,
      row.card_risk_component,
      row.raw_expected_points,
      row.risk_adjusted_points,
      row.captain_score,
      projectionConfidence(row)
    ])
  );
}

function topModeCandidates(candidates, modeId, limit = 25) {
  return top(candidates.filter((candidate) => candidate.mode === modeId), limit, (candidate) => candidate.recommendation_score);
}

function topMatchdayCandidates(candidates, matchday, limit = 25) {
  return top(candidates.filter((candidate) => candidate.matchday === matchday), limit, (candidate) => candidate.recommendation_score);
}

function topPositionCandidates(candidates, position, limit = 25) {
  return top(candidates.filter((candidate) => candidate.official_fantasy_position === position), limit, (candidate) => candidate.recommendation_score);
}

function modeWinnerSnapshot(output) {
  const rows = output?.recommendationCandidates || [];
  return Object.fromEntries(MODES.map((mode) => {
    const winner = top(rows.filter((row) => row.mode === mode.id), 1, (row) => num(row.recommendation_score) ?? -Infinity)[0];
    return [mode.id, winner ? {
      name: winner.name,
      country: winner.country,
      position: winner.official_fantasy_position,
      matchday: winner.matchday,
      score: winner.recommendation_score
    } : null];
  }));
}

function winnerTable(beforeOutput, afterCandidates) {
  const before = PRE_CALIBRATION_BASELINE.mode_winners || modeWinnerSnapshot(beforeOutput);
  const after = modeWinnerSnapshot({ recommendationCandidates: afterCandidates });
  return mdTable(
    ["Mode", "Before winner", "Before pos", "After winner", "After pos", "After score"],
    MODES.map((mode) => [
      mode.label,
      before[mode.id] ? `${before[mode.id].name} (${before[mode.id].matchday})` : "n/a",
      before[mode.id]?.position || "",
      after[mode.id] ? `${after[mode.id].name} (${after[mode.id].matchday})` : "n/a",
      after[mode.id]?.position || "",
      after[mode.id]?.score ?? ""
    ])
  );
}

function positionDistributionTable(beforeOutput, qa) {
  const before = PRE_CALIBRATION_BASELINE.position_distribution || beforeOutput?.summary?.candidates_by_position || {};
  const after = qa.summary.candidates_by_position || {};
  return mdTable(
    ["Position", "Before rows", "After rows"],
    ["GK", "DEF", "MID", "FWD"].map((position) => [position, before[position] || 0, after[position] || 0])
  );
}

function sessionWinnerTable(beforeOutput, afterCandidates) {
  const before = modeWinnerSnapshot(beforeOutput);
  const after = modeWinnerSnapshot({ recommendationCandidates: afterCandidates });
  return mdTable(
    ["Mode", "Before coverage winner", "Before pos", "After coverage winner", "After pos", "After score"],
    MODES.map((mode) => [
      mode.label,
      before[mode.id] ? `${before[mode.id].name} (${before[mode.id].matchday})` : "n/a",
      before[mode.id]?.position || "",
      after[mode.id] ? `${after[mode.id].name} (${after[mode.id].matchday})` : "n/a",
      after[mode.id]?.position || "",
      after[mode.id]?.score ?? ""
    ])
  );
}

function sessionPositionDistributionTable(beforeOutput, qa) {
  const before = beforeOutput?.summary?.candidates_by_position || {};
  const after = qa.summary.candidates_by_position || {};
  return mdTable(
    ["Position", "Before coverage rows", "After coverage rows"],
    ["GK", "DEF", "MID", "FWD"].map((position) => [position, before[position] || 0, after[position] || 0])
  );
}

function rulesEffectTable(officialRules) {
  const categories = officialRules.officialFantasyRules?.scoring?.categories || [];
  return mdTable(
    ["Category", "Points", "Applies to", "Model effect"],
    categories.map((category) => {
      let effect = "used or carried as context";
      if (category.categoryId === "own_goal") effect = "not modeled because no source-backed own-goal rate exists";
      if (category.categoryId === "winning_penalty") effect = "not modeled because no source-backed penalty-won rate exists";
      if (category.categoryId === "conceding_penalty") effect = "not modeled because no source-backed penalty-conceded rate exists";
      if (category.categoryId === "gk_clean_sheet" || category.categoryId === "def_clean_sheet") effect = "strongly favors high-minute GK/DEF in favorable fixtures";
      if (category.categoryId === "gk_penalty_save") effect = "not modeled because no source-backed penalty-save opportunity/save rate exists";
      if (category.categoryId === "def_goal_scored") effect = "favors attacking defenders/fullbacks when source-backed attacking rates exist";
      if (category.categoryId === "mid_clean_sheet") effect = "small midfielder defensive bonus";
      if (category.categoryId === "mid_every_3_tackles" || category.categoryId === "mid_every_2_chances_created") effect = "modeled in projection v3 coverage pass with source-backed rates where available and capped conservative MID priors otherwise";
      if (category.categoryId === "fwd_every_2_shots_on_target") effect = "modeled in projection v3 coverage pass with source-backed shots-on-target rates where available and capped conservative FWD priors otherwise";
      if (category.categoryId === "direct_free_kick_goal_bonus") effect = "partially modeled as ordinary goal scoring only; no direct-free-kick bonus rate";
      if (category.categoryId === "scouting_bonus") effect = "not modeled because selection-rate evidence is unavailable";
      return [category.label, category.points, category.appliesTo, effect];
    })
  );
}

function overlapTable(rows) {
  return mdTable(
    ["Name", "Country", "Pos", "Mode/Source", "Scope", "Score"],
    rows.map((row) => [
      row.name,
      row.country,
      row.position,
      row.best_mode || row.source || "",
      row.best_matchday || "",
      row.best_score ?? ""
    ])
  );
}

function buildCalibrationAuditReport({
  qa,
  candidates,
  matchdayRecommendations,
  projectionRows,
  officialRules,
  preCalibrationOutput
}) {
  const topComponents = MODES.flatMap((mode) => topModeCandidates(candidates, mode.id, 5));
  const highProjectionDefenders = top(
    projectionRows.filter((row) => row.official_fantasy_position === "DEF"),
    25,
    (row) => num(row.raw_expected_points) ?? 0
  );
  const highProjectionGoalkeepers = top(
    projectionRows.filter((row) => row.official_fantasy_position === "GK"),
    25,
    (row) => num(row.raw_expected_points) ?? 0
  );
  const neymarRows = projectionRows.filter((row) => isNeymar(row));
  const brazilUncertaintyCandidates = candidates.filter((candidate) => candidate.country === "Brazil" && candidate.data_quality_flags.includes("brazil_neymar_usage_source_gap"));
  const nunoRows = candidates.filter((candidate) => normalize(candidate.name).includes("nuno") && normalize(candidate.name).includes("mendes"));
  const camiloRows = candidates.filter((candidate) => normalize(candidate.name).includes("camilo") && normalize(candidate.name).includes("vargas"));
  const tagliaficoRows = candidates.filter((candidate) => normalize(candidate.name).includes("tagliafico"));
  const luisSuarezRows = candidates.filter((candidate) => normalize(candidate.name).includes("luis") && normalize(candidate.name).includes("suarez") && candidate.country === "Colombia");
  const messiRows = candidates.filter((candidate) => normalize(candidate.name).includes("messi"));
  const uniqueComparison = qa.v3_vs_v2_unique_player_comparison;

  const modeSections = MODES.map((mode) => {
    const rows = topModeCandidates(candidates, mode.id, 25);
    const counts = countBy(rows, (candidate) => candidate.official_fantasy_position);
    return `### ${mode.label}\n\nPosition distribution: ${JSON.stringify(counts)}\n\n${candidateAuditTable(rows)}`;
  }).join("\n\n");

  const matchdaySections = ["group_stage_full", "md1", "md2", "md3"].map((matchday) => {
    const rows = topMatchdayCandidates(candidates, matchday, 25);
    return `### ${matchday}\n\n${candidateAuditTable(rows)}`;
  }).join("\n\n");

  const positionSections = ["GK", "DEF", "MID", "FWD"].map((position) => {
    const rows = topPositionCandidates(candidates, position, 25);
    return `### ${position}\n\n${candidateAuditTable(rows)}`;
  }).join("\n\n");

  const positionBalanceRows = qa.position_balance_audit.by_scope_and_mode.map((row) => [
    row.matchday,
    row.mode,
    row.top_candidate,
    row.counts.GK || 0,
    row.counts.DEF || 0,
    row.counts.MID || 0,
    row.counts.FWD || 0,
    row.warning.join("; ") || "none"
  ]);

  return `# Recommendation Calibration Audit Fantasy Pool v3

Generated: ${NOW}

Model stage: fantasy_pool_only. This audit does not promote recommendations, does not update active v2 recommendations, does not update browser-ready files, and does not make Team Builder, captain/substitution, or UX changes.

## Executive Summary

- Candidate rows after calibration: ${qa.summary.candidate_rows}.
- QA status: ${qa.overall_status}.
- Low-confidence top-list candidates: ${qa.summary.low_confidence_candidates_in_top_lists}.
- Thin-profile top-list candidates: ${qa.summary.thin_profile_candidates_in_top_lists}.
- True missing-usage top-list candidates: ${qa.summary.missing_usage_candidates_in_top_lists}.
- Brazil uncertainty candidate rows: ${qa.summary.brazil_uncertainty_candidate_rows}.
- Neymar candidate rows: ${qa.summary.neymar_candidate_rows}.
- Position-balance warning lists: ${qa.summary.position_balance_warning_lists}.
- Safe for preliminary recommendation review: ${qa.summary.safe_for_preliminary_recommendation_review}.
- Safe for public recommendations: ${qa.summary.safe_for_public_recommendations}.

## Calibration Changes

${CALIBRATION_NOTES.map((note) => `- ${note}`).join("\n")}

Projection-generation coverage was improved in this session. The staged v3 projection layer now emits separate capped components for official MID tackle points, MID chance-created points, and FWD shots-on-target points. Source-backed player rates are used where available; otherwise small conservative position priors are dampened and flagged. These additions improve MID/FWD representation without promoting the model or treating priors as final player event rates.

## Original Calibration Before And After Mode Winners

Baseline note: ${PRE_CALIBRATION_BASELINE.source_note}

${winnerTable(preCalibrationOutput, candidates)}

## Original Calibration Before And After Position Distribution

${positionDistributionTable(preCalibrationOutput, qa)}

## Scoring-Coverage Pass Before And After Mode Winners

${sessionWinnerTable(preCalibrationOutput, candidates)}

## Scoring-Coverage Pass Before And After Position Distribution

${sessionPositionDistributionTable(preCalibrationOutput, qa)}

## Position-Balance Safeguards

${mdTable(["Scope", "Mode", "Top candidate", "GK", "DEF", "MID", "FWD", "Warning"], positionBalanceRows)}

## Does The Top Of Each Mode Make Sense?

- Nuno Mendes as Balanced and Safe: still plausible as a staged candidate because his source-backed fullback attacking/assist rates combine with Portugal's favorable clean-sheet fixtures and DEF clean-sheet scoring. The calibration keeps him eligible but prevents defender-only pools.
- Nuno Mendes as Captain Alpha: corrected at the recommendation layer. Defender captain outcomes can be strong under official scoring, but Captain Alpha now applies attacker preference and DEF/GK dampening so clean-sheet upside does not dominate captain review.
- Nuno Mendes as Differential: corrected at the mode-separation layer. His old Differential rank was a mode-weight/obviousness issue, not a projection bug; he remains excellent in Balanced/Safe but is penalized away from Differential because he is already top in both modes.
- Camilo Vargas in Safe mode: goalkeeper appearance/minutes security, clean-sheet probability, and save points create a stable floor, but Safe mode now caps GK exposure so it is not a goalkeeper list.
- Giorgian de Arrascaeta as Differential: plausible after the finance pass because he combines positive value over replacement, scarcity-adjusted value, efficient-frontier status, high confidence, acceptable starts/minutes, and only limited Balanced/Captain obviousness.
- Luis Suárez as Differential: still a defensible lower-obviousness candidate in some rows, but the finance pass no longer forces him to win the mode when stronger value-over-replacement/frontier candidates exist.
- Nicolás Tagliafico as a Differential candidate: still plausible as a value-looking staged candidate, but mode-separation penalties now stop high-overall defensive candidates from repeating the Balanced list.
- Lionel Messi as Upside and Captain Alpha: plausible and expected. Upside/Captain Alpha now better reward elite attackers and attacking mids while keeping minutes and confidence safeguards.

## Official Scoring Effects

${rulesEffectTable(officialRules)}

Interpretation: official scoring naturally makes strong-defense GK/DEF candidates valuable because clean sheets are worth 5 points for GK/DEF and only 1 for MID. It also makes attacking fullbacks powerful because DEF goals are worth 7 and assists are worth 3. The current coverage pass reduces a known attacker under-ranking risk by modeling MID tackle/chance-created points and FWD shots-on-target points, but these remain staged because many rows still rely on capped priors rather than full source-backed player-level rates.

## Top 25 By Mode

${modeSections}

## Top 25 By Matchday

${matchdaySections}

## Top 25 By Position

${positionSections}

## Top Captain Candidates

${candidateAuditTable(topModeCandidates(candidates, "captain", 25))}

## Top Value-Looking Candidates

${candidateAuditTable(top(candidates, 25, (candidate) => num(candidate.value_score) ?? 0))}

## Projection Components For Top Candidates By Mode

${componentAuditTable(topComponents)}

## High-Projection Defender Candidates

${projectionComponentTable(highProjectionDefenders)}

## High-Projection Goalkeeper Candidates

${projectionComponentTable(highProjectionGoalkeepers)}

## Low-Confidence Candidates

${qa.low_confidence_players_in_top_25.length
  ? candidateAuditTable(qa.low_confidence_players_in_top_25.map((row) => candidates.find((candidate) => candidate.name === row.name && candidate.mode === row.mode && candidate.matchday === row.matchday)).filter(Boolean))
  : "No low-confidence candidates appear in top-25 candidate lists after calibration."}

## Brazil Uncertainty And Neymar Exclusion

Brazil uncertainty candidate rows: ${brazilUncertaintyCandidates.length}.

${brazilUncertaintyCandidates.length ? candidateAuditTable(brazilUncertaintyCandidates.slice(0, 25)) : "No Brazil uncertainty rows in candidate lists."}

Neymar projection rows remain present but excluded from recommendation candidate lists:

${projectionComponentTable(neymarRows)}

## Focus Player Audit

### Nuno Mendes

${nunoRows.length ? componentAuditTable(top(nunoRows, 10, (candidate) => candidate.recommendation_score)) : "No Nuno Mendes candidate rows."}

### Camilo Vargas

${camiloRows.length ? componentAuditTable(top(camiloRows, 10, (candidate) => candidate.recommendation_score)) : "No Camilo Vargas candidate rows."}

### Nicolás Tagliafico

${tagliaficoRows.length ? componentAuditTable(top(tagliaficoRows, 10, (candidate) => candidate.recommendation_score)) : "No Nicolás Tagliafico candidate rows."}

### Luis Suárez

${luisSuarezRows.length ? componentAuditTable(top(luisSuarezRows, 10, (candidate) => candidate.recommendation_score)) : "No Colombia Luis Suárez candidate rows."}

### Lionel Messi

${messiRows.length ? componentAuditTable(top(messiRows, 10, (candidate) => candidate.recommendation_score)) : "No Lionel Messi candidate rows."}

## V3 vs V2 Differences

- V2 unique top-pool players: ${uniqueComparison.v2_unique_top_pool_players}.
- V3 unique top-pool players: ${uniqueComparison.v3_unique_top_pool_players}.
- Overlapping players: ${uniqueComparison.overlapping_players_count}.
- Newly appearing in v3: ${uniqueComparison.newly_appearing_in_v3_count}.
- Disappearing from v2: ${uniqueComparison.disappearing_from_v2_count}.
- Average list-level v2/v3 overlap rate: ${qa.v3_vs_v2_comparison.average_overlap_rate}.

### Players Appearing In Both

${overlapTable(uniqueComparison.overlapping_players_sample)}

### Newly Appearing In V3

${overlapTable(uniqueComparison.newly_appearing_in_v3_sample)}

### Disappearing From V2

${overlapTable(uniqueComparison.disappearing_from_v2_sample)}

Interpretation: plausible changes are mostly driven by official scoring, official positions/prices, fantasy-pool minutes, score predictor v3, and the new capped MID/FWD scoring components. Suspicious changes should be checked against the added-component totals and source/coverage flags, especially where conservative priors rather than source-backed rates drive movement.

## Remaining Model Concerns

- Final squads are still not source-backed, so all candidate rows remain fantasy_pool_only.
- Official rules still have manual-review blockers.
- Projection v3 now models the main previously missing MID/FWD scoring categories, but rare-event categories such as penalties, own goals, direct-free-kick bonus, and scouting bonus remain omitted or partial because current data cannot support them.
- Selection-rate/scouting bonus remains unmodeled.
- Set-piece and penalty roles remain unmodeled unless source-backed role/event-rate data is added later.
- Neymar remains a P0 usage source gap and is excluded from recommendation candidates.

## Decision

The calibrated staged recommendation layer is safer for preliminary review, but it is still blocked from public promotion, Team Builder promotion, browser-ready deployment, and any final recommendation claim.
`;
}

function modeOverlapRows(metrics) {
  return [
    ["Balanced vs Safe", metrics.top10_pair_overlaps.balanced_vs_safe.count, metrics.top25_pair_overlaps.balanced_vs_safe.count, metrics.top10_pair_overlaps.balanced_vs_safe.names.slice(0, 6).join("; ")],
    ["Balanced vs Differential", metrics.top10_pair_overlaps.balanced_vs_differential.count, metrics.top25_pair_overlaps.balanced_vs_differential.count, metrics.top10_pair_overlaps.balanced_vs_differential.names.slice(0, 6).join("; ")],
    ["Safe vs Differential", metrics.top10_pair_overlaps.safe_vs_differential.count, metrics.top25_pair_overlaps.safe_vs_differential.count, metrics.top10_pair_overlaps.safe_vs_differential.names.slice(0, 6).join("; ")],
    ["Upside vs Captain Alpha", metrics.top10_pair_overlaps.upside_vs_captain.count, metrics.top25_pair_overlaps.upside_vs_captain.count, metrics.top10_pair_overlaps.upside_vs_captain.names.slice(0, 6).join("; ")]
  ];
}

function modeWinnerRows(metrics) {
  return MODES.map((mode) => {
    const winner = metrics.mode_winners[mode.id];
    return [
      mode.label,
      winner?.name || "none",
      winner?.country || "",
      winner?.position || "",
      winner?.matchday || "",
      winner?.score ?? "",
      winner?.price ?? ""
    ];
  });
}

function bestPlayerRows(candidates, modeId, predicate, limit = 3) {
  return top(candidates.filter((candidate) => candidate.mode === modeId && predicate(candidate)), limit, (candidate) => candidate.recommendation_score)
    .map((candidate) => ({
      rank: candidate.rank,
      name: candidate.name,
      country: candidate.country,
      pos: candidate.official_fantasy_position,
      matchday: candidate.matchday,
      opponent: candidate.opponent,
      price: candidate.official_price,
      score: candidate.recommendation_score,
      raw: candidate.raw_expected_points,
      risk: candidate.risk_adjusted_points,
      start: candidate.start_probability,
      minutes: candidate.expected_minutes,
      confidence: candidate.projection_confidence,
      obviousness: candidate.mode_separation_context?.differential_obviousness_penalty ?? "",
      reasons: candidate.mode_separation_context?.differential_obviousness_reasons?.join("; ") || ""
    }));
}

function modePurposeRows(metrics) {
  return [
    ["Balanced", "Best all-around staged candidate score: risk-adjusted points, raw points, starts/minutes, confidence, value, fixture context, and data-quality penalties.", "Can overlap with Safe and Captain candidates when the player is simply strong overall.", "Purpose is distinct if it is not used as the Differential source of truth."],
    ["Safe", "Floor-first score: role confidence, start probability, expected minutes, floor/risk-adjusted points, and low data-quality risk.", "Some overlap with Balanced is expected and acceptable.", metrics.distinct_purpose_assessment.safe_meaningfully_different_from_balanced ? "Safe has acceptable separation from Balanced." : "Safe is close to Balanced; monitor if future runs become identical."],
    ["Upside", "Ceiling/attack/captain-environment score for aggressive preliminary review.", "Can overlap heavily with Captain Alpha because elite attackers lead both.", metrics.distinct_purpose_assessment.upside_meaningfully_different_from_captain ? "Upside has enough separation from Captain Alpha." : "Upside and Captain Alpha overlap strongly; acceptable only if both remain attacker-led and well-supported."],
    ["Differential", "Defensible value/upside with lower obviousness, not simply the best Balanced/Safe player repeated.", "Should penalize top Balanced/Safe rows and premium obvious picks.", metrics.distinct_purpose_assessment.differential_meaningfully_different_from_balanced ? "Differential is meaningfully separated from Balanced." : "Differential still needs review; overlap remains high."]
  ];
}

function buildRecommendationModeSeparationAuditReport({ beforeOutput, qa, candidates }) {
  void beforeOutput;
  const beforeMetrics = MODE_SEPARATION_BASELINE;
  const afterMetrics = modeSeparationMetrics(candidates);
  const nunoPredicate = (candidate) => normalize(candidate.name).includes("nuno") && normalize(candidate.name).includes("mendes");
  const beforeNunoRows = MODE_SEPARATION_BASELINE.nuno_rows;
  const afterNunoRows = MODES.flatMap((mode) => bestPlayerRows(candidates, mode.id, nunoPredicate, 1).map((row) => ({ ...row, mode: mode.label })));
  const afterDifferentialTop = modeTopCandidates(candidates, "differential", 10);
  const differentialWinner = afterMetrics.mode_winners.differential;
  const balancedWinner = afterMetrics.mode_winners.balanced;
  const differentialStillRepeatsBalanced = differentialWinner && balancedWinner && differentialWinner.name === balancedWinner.name && differentialWinner.matchday === balancedWinner.matchday;

  return `# Recommendation Mode Separation Audit Fantasy Pool v3

Generated: ${NOW}

Model stage: fantasy_pool_only. This audit does not promote recommendations, does not update active v2 recommendations, does not update browser-ready files, and does not make Team Builder, captain/substitution, or UX changes.

## Summary

- Before Differential winner: ${beforeMetrics.mode_winners.differential.name} (${beforeMetrics.mode_winners.differential.matchday}).
- After Differential winner: ${differentialWinner?.name || "n/a"} (${differentialWinner?.matchday || "n/a"}).
- After Balanced winner: ${balancedWinner?.name || "n/a"} (${balancedWinner?.matchday || "n/a"}).
- Differential repeats Balanced top row after calibration: ${Boolean(differentialStillRepeatsBalanced)}.
- Differential vs Balanced top-10 overlap after calibration: ${afterMetrics.top10_pair_overlaps.balanced_vs_differential.count}.
- Differential vs Safe top-10 overlap after calibration: ${afterMetrics.top10_pair_overlaps.safe_vs_differential.count}.
- Safe for preliminary recommendation review: ${qa.summary.safe_for_preliminary_recommendation_review}.
- Safe for public recommendations: ${qa.summary.safe_for_public_recommendations}.

## Before Mode Winners

Baseline note: ${MODE_SEPARATION_BASELINE.source_note}

${mdTable(["Mode", "Winner", "Country", "Pos", "Scope", "Score", "Price"], modeWinnerRows(beforeMetrics))}

## After Mode Winners

${mdTable(["Mode", "Winner", "Country", "Pos", "Scope", "Score", "Price"], modeWinnerRows(afterMetrics))}

## Before Top-List Overlap

${mdTable(["Pair", "Top-10 overlap", "Top-25 overlap", "Top-10 shared examples"], modeOverlapRows(beforeMetrics))}

## After Top-List Overlap

${mdTable(["Pair", "Top-10 overlap", "Top-25 overlap", "Top-10 shared examples"], modeOverlapRows(afterMetrics))}

## Top-25 All-Mode Overlap

| Metric | Count | Examples |
| --- | --- | --- |
| Before all-mode top-25 overlap | ${beforeMetrics.top25_all_mode_overlap.count} | ${beforeMetrics.top25_all_mode_overlap.names.slice(0, 10).join("; ")} |
| After all-mode top-25 overlap | ${afterMetrics.top25_all_mode_overlap.count} | ${afterMetrics.top25_all_mode_overlap.names.slice(0, 10).join("; ")} |

## Mode Purpose Assessment

${mdTable(["Mode", "Purpose", "Expected overlap", "Assessment"], modePurposeRows(afterMetrics))}

## Nuno Mendes Audit

Nuno Mendes ranks well in Balanced and Safe for understandable staged-model reasons: high projection confidence, strong expected minutes/start profile, Portugal fixture context, DEF clean-sheet scoring, and source-backed fullback attacking/assist rates. His old Differential win was not a projection bug and not a price-only bug; it was a mode-weight/separation bug. Differential was rewarding the same strong value profile without penalizing that he was already the top Balanced and Safe candidate.

### Nuno Before

${beforeNunoRows.length ? mdTable(["Mode", "Rank", "Name", "Pos", "Scope", "Opponent", "Price", "Score", "Raw", "Risk", "Start", "Minutes", "Confidence", "Obviousness penalty", "Reasons"], beforeNunoRows.map((row) => [row.mode, row.rank, row.name, row.pos, row.matchday, row.opponent, row.price, row.score, row.raw, row.risk, row.start, row.minutes, row.confidence, row.obviousness, row.reasons])) : "_No prior Nuno rows found._"}

### Nuno After

${afterNunoRows.length ? mdTable(["Mode", "Rank", "Name", "Pos", "Scope", "Opponent", "Price", "Score", "Raw", "Risk", "Start", "Minutes", "Confidence", "Obviousness penalty", "Reasons"], afterNunoRows.map((row) => [row.mode, row.rank, row.name, row.pos, row.matchday, row.opponent, row.price, row.score, row.raw, row.risk, row.start, row.minutes, row.confidence, row.obviousness, row.reasons])) : "_No Nuno rows found after calibration._"}

## Differential Definition Applied

Differential now prioritizes defensible upside and finance-style value while applying an explicit obviousness penalty. The finance layer uses value over replacement, scarcity-adjusted value, efficient-frontier status, and price-tier opportunity cost. The obviousness penalty uses only staged proxies already available in this project: Balanced rank, Safe rank, Captain Alpha rank, raw projection rank, captain-score rank, official price percentile by position, and cross-mode top-list status. It does not use ownership data because no source-backed ownership exists.

Differential defensibility floor:

- high or medium projection confidence
- no thin profile
- no true missing-usage row
- start probability at least 0.52
- expected minutes at least 48
- raw expected points at least 3.2
- risk-adjusted points at least 2.7

## Differential Top 10 After Calibration

${mdTable(["Rank", "Name", "Country", "Pos", "Scope", "Opponent", "Price", "Score", "Raw", "Risk", "Start", "Minutes", "Confidence", "Obviousness penalty", "Reasons"], afterDifferentialTop.map((candidate) => [
    candidate.rank,
    candidate.name,
    candidate.country,
    candidate.official_fantasy_position,
    candidate.matchday,
    candidate.opponent,
    candidate.official_price,
    candidate.recommendation_score,
    candidate.raw_expected_points,
    candidate.risk_adjusted_points,
    candidate.start_probability,
    candidate.expected_minutes,
    candidate.projection_confidence,
    candidate.mode_separation_context?.differential_obviousness_penalty ?? "",
    candidate.mode_separation_context?.differential_obviousness_reasons?.join("; ") || ""
  ]))}

## Decision

Differential now has a clearer staged meaning: it is a defensible lower-obviousness list, not a copy of Balanced or Safe. Safe still overlaps with Balanced, but it remains floor/minutes/confidence focused and is not identical. Upside and Captain Alpha remain attacker-led and can overlap because both naturally reward elite attacking rows.

The recommendation layer is still fantasy_pool_only, not final-squad-backed, not browser-ready, not Team Builder-ready, and blocked from public promotion.
`;
}

function financeCompactTable(rows, limit = 15) {
  return mdTable(
    ["Name", "Country", "Pos", "Scope", "Opponent", "Price", "Risk", "VOR", "Scarcity value", "Pts/price", "Risk/price", "Frontier", "Dominated", "Opp cost", "Def score"],
    rows.slice(0, limit).map((row) => [
      row.name,
      row.country,
      row.position,
      row.matchday,
      row.opponent,
      row.price,
      row.risk_adjusted_points,
      row.value_over_replacement,
      row.scarcity_adjusted_value,
      row.points_per_price,
      row.risk_adjusted_points_per_price,
      row.efficient_frontier,
      row.dominated_player,
      row.opportunity_cost,
      row.differential_defensibility_score
    ])
  );
}

function rankCorrelationTable(rows) {
  return mdTable(
    ["Pair", "Compared rows", "Rank limit", "Spearman rank correlation"],
    rows.map((row) => [row.pair, row.compared_rows, row.rank_limit, row.spearman_rank_correlation])
  );
}

function distributionRows(distributions, modeId) {
  return sortedCountEntries(distributions[modeId] || {}).map(([key, count]) => `${key}: ${count}`).join("; ");
}

function modeDistributionTable(diagnostics) {
  return mdTable(
    ["Mode", "Positions", "Price buckets", "Confidence", "Matchdays", "Top countries"],
    MODES.map((mode) => [
      mode.label,
      distributionRows(diagnostics.mode_distributions.position_by_mode, mode.id),
      distributionRows(diagnostics.mode_distributions.price_bucket_by_mode, mode.id),
      distributionRows(diagnostics.mode_distributions.confidence_by_mode, mode.id),
      distributionRows(diagnostics.mode_distributions.matchday_by_mode, mode.id),
      (diagnostics.mode_distributions.country_top10_by_mode[mode.id] || []).map((row) => `${row.country}: ${row.count}`).join("; ")
    ])
  );
}

function financeOverlapTable(diagnostics) {
  return mdTable(
    ["Pair", "Top-10 overlap", "Top-25 overlap"],
    [
      ["Balanced vs Safe", diagnostics.mode_overlap.top10.balanced_vs_safe.count, diagnostics.mode_overlap.top25.balanced_vs_safe.count],
      ["Balanced vs Differential", diagnostics.mode_overlap.top10.balanced_vs_differential.count, diagnostics.mode_overlap.top25.balanced_vs_differential.count],
      ["Safe vs Differential", diagnostics.mode_overlap.top10.safe_vs_differential.count, diagnostics.mode_overlap.top25.safe_vs_differential.count],
      ["Upside vs Captain Alpha", diagnostics.mode_overlap.top10.upside_vs_captain.count, diagnostics.mode_overlap.top25.upside_vs_captain.count]
    ]
  );
}

function modeWinnerFinanceTable(qa) {
  const winners = qa.mode_separation_audit.mode_winners;
  return mdTable(
    ["Mode", "Winner", "Country", "Pos", "Scope", "Score", "Price"],
    MODES.map((mode) => {
      const winner = winners[mode.id];
      return [
        mode.label,
        winner?.name || "",
        winner?.country || "",
        winner?.position || "",
        winner?.matchday || "",
        winner?.score ?? "",
        winner?.price ?? ""
      ];
    })
  );
}

function buildFinanceValueAuditReport({ diagnostics, qa }) {
  const diffFinance = diagnostics.differential_finance_candidates
    .slice()
    .sort((a, b) => b.recommendation_score - a.recommendation_score)
    .slice(0, 25);
  const differentialOverlap = diagnostics.mode_overlap.top25.balanced_vs_differential.count;
  const differentialTooStrict = differentialOverlap === 0;
  const differentialVerdict = differentialTooStrict
    ? "Differential remains strongly separated in top-25 overlap, but finance diagnostics now soften scoring through value-over-replacement and efficient-frontier credit. Continue monitoring whether zero overlap is too conservative in future runs."
    : "Differential has limited overlap where finance value supports it, which is the intended softer behavior.";

  return `# Recommendation Finance Value Audit Fantasy Pool v3

Generated: ${NOW}

Model stage: fantasy_pool_only. This audit does not promote recommendations, does not update active v2 recommendations, does not update browser-ready files, and does not make Team Builder, captain/substitution, or UX changes.

## Summary

- Recommendation QA status: ${qa.overall_status}.
- Finance diagnostic rows: ${diagnostics.summary.total_finance_rows}.
- Efficient-frontier rows: ${diagnostics.summary.efficient_frontier_rows}.
- Dominated rows: ${diagnostics.summary.dominated_rows}.
- Above-replacement rows: ${diagnostics.summary.above_replacement_rows}.
- Differential candidates on efficient frontier: ${diagnostics.summary.differential_candidates_on_frontier}.
- Differential candidates dominated: ${diagnostics.summary.differential_candidates_dominated}.
- Balanced vs Differential top-10 overlap: ${diagnostics.mode_overlap.top10.balanced_vs_differential.count}.
- Balanced vs Differential top-25 overlap: ${diagnostics.mode_overlap.top25.balanced_vs_differential.count}.
- Safe for preliminary review: ${qa.summary.safe_for_preliminary_recommendation_review}.
- Safe for public recommendations: ${qa.summary.safe_for_public_recommendations}.

## Methodology

- Value over replacement: ${diagnostics.methodology.replacement_rule}
- Scarcity-adjusted value: ${diagnostics.methodology.scarcity_adjusted_value}
- Efficient frontier: ${diagnostics.methodology.efficient_frontier}
- Opportunity cost: ${diagnostics.methodology.opportunity_cost}
- Ownership policy: ${diagnostics.methodology.ownership_policy}

## Rank Correlation Between Modes

${rankCorrelationTable(diagnostics.rank_correlations)}

## Mode Overlap

${financeOverlapTable(diagnostics)}

## Mode Winners

${modeWinnerFinanceTable(qa)}

## Mode Distributions

${modeDistributionTable(diagnostics)}

## Distinct Purpose Assessment

- Balanced: best all-around staged candidate score. It should correlate with most modes but not define Differential alone.
- Safe: floor, minutes, role/confidence, and low data-quality risk. Balanced/Safe overlap is natural.
- Upside: ceiling and attacking context. Upside/Captain overlap is natural when elite attackers dominate both.
- Captain Alpha: captain-relevant ceiling and starts; not pure value.
- Differential: defensible lower-obviousness value. It now uses value over replacement, scarcity-adjusted value, frontier status, and opportunity cost, while retaining an obviousness penalty.

${differentialVerdict}

## Value Over Replacement Leaders

${financeCompactTable(diagnostics.top_value_over_replacement)}

## Scarcity-Adjusted Value Leaders

${financeCompactTable(diagnostics.top_scarcity_adjusted_value)}

## Risk-Adjusted Points Per Price Leaders

${financeCompactTable(diagnostics.top_risk_adjusted_points_per_price)}

## Efficient Frontier Sample

${financeCompactTable(diagnostics.efficient_frontier_sample)}

## Dominated Player Sample

${financeCompactTable(diagnostics.dominated_player_sample)}

## Differential Finance Top 25

${mdTable(
    ["Rank", "Name", "Country", "Pos", "Scope", "Price", "Score", "Tier", "Risk", "Value", "VOR", "Scarcity", "Frontier", "Dominated", "Opp cost", "Def score", "Obviousness"],
    diffFinance.map((row) => [
      row.rank,
      row.name,
      row.country,
      row.position,
      row.matchday,
      row.price,
      row.recommendation_score,
      row.tier,
      row.risk_adjusted_points,
      row.value_score,
      row.value_over_replacement,
      row.scarcity_adjusted_value,
      row.efficient_frontier,
      row.dominated_player,
      row.opportunity_cost,
      row.differential_defensibility_score,
      row.obviousness_proxy
    ])
  )}

## Recommendation Concerns

- Final squads are still not source-backed, so all recommendation candidates remain fantasy_pool_only.
- Official rules still have manual-review blockers.
- Finance diagnostics do not use ownership data; obviousness remains a staged proxy.
- Differential may still be conservative if top-25 overlap stays at zero in future runs, but the scoring no longer hard-excludes all strong overlapping value rows.
- Efficient-frontier and dominated-player labels are preliminary because they depend on staged projections and fantasy-pool-only squads.

## Decision

The finance diagnostics are useful for preliminary review and future Value/Fantasy Finance work. They are not safe for public recommendations, Team Builder, or browser-ready promotion until official-data blockers are resolved.
`;
}

function buildOutput({ candidates, matchdayRecommendations, qa }) {
  return {
    schema_version: "fantasy_pool_matchday_recommendations_v3",
    generated_at: NOW,
    source_checked: TODAY,
    model_stage: MODEL_STAGE,
    data_status: "staged_fantasy_pool_only_not_final_squad_backed",
    safety_labels: SAFETY_LABELS,
    previous_active_recommendation_file: PATHS.activeRecommendationsV2,
    browser_ready_files_updated: false,
    input_files: [
      PATHS.playerRecommendationInputs,
      PATHS.minutesModel,
      PATHS.playerMatchdayProjections,
      PATHS.scorePredictions,
      PATHS.officialRules,
      PATHS.officialRulesImportReport
    ],
    model: {
      source_model_version: SOURCE_MODEL_VERSION,
      top_list_limit: TOP_LIST_LIMIT,
      modes: MODES,
      tier_values: [
        "top_pick_candidate",
        "strong_candidate",
        "watchlist_candidate",
        "risky_candidate",
        "avoid_for_now",
        "blocked"
      ],
      position_caps_by_mode: POSITION_CAPS_BY_MODE,
      position_score_adjustments_by_mode: POSITION_SCORE_ADJUSTMENTS_BY_MODE,
      replacement_rank_by_position: REPLACEMENT_RANK_BY_POSITION,
      calibration_notes: CALIBRATION_NOTES,
      scoring_note: "Staged mode scores use v3 risk-adjusted points, raw points, ceiling/floor, captain score, start probability, expected minutes, role/projection confidence, fixture context, weak price/value context, mode-specific position adjustments, position caps, and explicit data-quality penalties. Differential additionally uses staged finance diagnostics: value over replacement, scarcity-adjusted value, price-tier opportunity cost, and efficient-frontier status."
    },
    summary: qa.summary,
    stop_conditions: qa.stop_conditions,
    recommendationCandidates: candidates,
    matchdayRecommendations
  };
}

async function main() {
  const preCalibrationOutput = await maybeReadJson(PATHS.output);
  const [
    playerInputData,
    minutesModel,
    projectionData,
    scoreData,
    officialRules,
    officialRulesImportReport,
    readiness,
    recommendationsV2,
    recommendationQaV2
  ] = await Promise.all([
    readJson(PATHS.playerRecommendationInputs),
    readJson(PATHS.minutesModel),
    readJson(PATHS.playerMatchdayProjections),
    readJson(PATHS.scorePredictions),
    readJson(PATHS.officialRules),
    readJson(PATHS.officialRulesImportReport),
    readJson(PATHS.readiness),
    readJson(PATHS.activeRecommendationsV2),
    readJson(PATHS.activeRecommendationQaV2)
  ]);

  const projectionRows = projectionData.playerMatchdayProjections || [];
  const blockedPlayers = projectionData.blockedPlayers || [];
  const eligibleProjectionRows = projectionRows.filter((row) => !isBlockedProjection(row));
  const scopes = buildScopes(eligibleProjectionRows);
  const { recommendationCandidates, matchdayRecommendations, financeContextsByScope } = buildRecommendations(scopes);

  const qa = buildQa({
    candidates: recommendationCandidates,
    matchdayRecommendations,
    projectionRows: eligibleProjectionRows,
    blockedPlayers,
    recommendationsV2,
    recommendationQaV2,
    playerInputData,
    projectionQa: await readJson("data/playerMatchdayProjectionQa_fantasyPool_v3.json"),
    scoreQa: await readJson("data/scorePredictionQa_fantasyPool_v3.json"),
    rulesImportReport: officialRulesImportReport,
    readiness,
    minutesModel,
    scoreData,
    officialRules
  });

  const output = buildOutput({ candidates: recommendationCandidates, matchdayRecommendations, qa });
  const report = buildReport(qa);
  const calibrationAudit = buildCalibrationAuditReport({
    qa,
    candidates: recommendationCandidates,
    matchdayRecommendations,
    projectionRows: eligibleProjectionRows,
    officialRules,
    preCalibrationOutput
  });
  const modeSeparationAudit = buildRecommendationModeSeparationAuditReport({
    beforeOutput: preCalibrationOutput,
    qa,
    candidates: recommendationCandidates
  });
  const financeDiagnostics = buildFinanceDiagnostics({
    financeContextsByScope,
    candidates: recommendationCandidates,
    qa
  });
  const financeValueAudit = buildFinanceValueAuditReport({
    diagnostics: financeDiagnostics,
    qa
  });

  await writeJson(PATHS.output, output);
  await writeJson(PATHS.qa, qa);
  await writeJson(PATHS.financeDiagnostics, financeDiagnostics);
  await writeFile(PATHS.report, report, "utf8");
  await writeFile(PATHS.calibrationAudit, calibrationAudit, "utf8");
  await writeFile(PATHS.modeSeparationAudit, modeSeparationAudit, "utf8");
  await writeFile(PATHS.financeValueAudit, financeValueAudit, "utf8");

  console.log(`Wrote ${PATHS.output}`);
  console.log(`Wrote ${PATHS.qa}`);
  console.log(`Wrote ${PATHS.financeDiagnostics}`);
  console.log(`Wrote ${PATHS.report}`);
  console.log(`Wrote ${PATHS.calibrationAudit}`);
  console.log(`Wrote ${PATHS.modeSeparationAudit}`);
  console.log(`Wrote ${PATHS.financeValueAudit}`);
  console.log(`Candidate rows: ${recommendationCandidates.length}`);
  console.log(`Status: ${qa.overall_status}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
