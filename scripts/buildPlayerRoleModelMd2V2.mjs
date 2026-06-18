import { readFile, writeFile } from "node:fs/promises";
import vm from "node:vm";

const PATHS = {
  officialStatusJs: "fantasyPoolOfficialDataStatusData.js",
  projectionsJs: "fantasyPoolMatchdayProjectionsData.js",
  recommendationsJs: "fantasyPoolRecommendationsData.js",
  financeJs: "fantasyPoolFinanceMetricsData.js",
  scoreJs: "fantasyPoolScorePredictionsData.js",
  scoreJson: "data/scorePredictions_fantasyPool_v4_md2.json",
  fantasyRulesJson: "fantasyRules.json",
  fantasyRulesJs: "fantasyRulesData.js",
  livePlayersJson: "data/livePlayerStatus_v1.json",
  liveMatchdayJson: "data/liveMatchdayStatus_v1.json",
  md1CalibrationDataset: "data/md1CalibrationDataset_v1.json",
  md1Postmortem: "data/md1ModelPostmortem_v1.json",
  activeDataFlowQa: "data/activeMd2DataFlowQa.json",
  projectionQa: "data/playerMatchdayProjectionQa_fantasyPool_v3.json",
  recommendationQa: "data/recommendationQa_fantasyPool_v3.json",
  financeQa: "data/playerFinanceMetricsQa_fantasyPool_v1.json",
  outputJson: "data/playerRoleModel_md2_v2.json",
  outputQa: "data/playerRoleModelQa_md2_v2.json",
  outputQaReport: "data/playerRoleModelQaReport_md2_v2.md",
  outputModelReport: "data/playerRoleModel_md2_v2.md"
};

const MODEL_VERSION = "player-role-md2-v2-md1-evidence";
const GENERATED_AT = new Date().toISOString();
const START_CAP = 0.98;
const MINUTES_CAP = 95;

const ROLE_TIERS = [
  "locked_starter",
  "likely_starter",
  "possible_starter",
  "managed_minutes_star",
  "rotation_risk",
  "impact_sub",
  "bench_depth",
  "not_in_squad_risk",
  "unavailable_or_not_selectable",
  "no_md1_evidence"
];

const TIER_MINUTES = {
  locked_starter: [72, 90],
  likely_starter: [65, 84],
  possible_starter: [45, 70],
  managed_minutes_star: [50, 72],
  rotation_risk: [35, 65],
  impact_sub: [20, 45],
  bench_depth: [0, 25],
  not_in_squad_risk: [0, 25],
  unavailable_or_not_selectable: [0, 0],
  no_md1_evidence: [0, 55]
};

const DEFAULT_START_PRIOR = {
  GK: 0.05,
  DEF: 0.12,
  MID: 0.12,
  FWD: 0.10
};

function hasValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function num(value, fallback = null) {
  if (!hasValue(value)) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function round(value, digits = 3) {
  if (!Number.isFinite(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function avg(values, fallback = null) {
  const clean = values.filter(Number.isFinite);
  return clean.length ? clean.reduce((sum, value) => sum + value, 0) / clean.length : fallback;
}

function countBy(rows, keyFn) {
  const output = {};
  for (const row of rows) {
    const key = keyFn(row) ?? "missing";
    output[key] = (output[key] || 0) + 1;
  }
  return output;
}

function groupBy(rows, keyFn) {
  const output = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    if (!hasValue(key)) continue;
    const list = output.get(String(key)) || [];
    list.push(row);
    output.set(String(key), list);
  }
  return output;
}

function indexBy(rows, keyFn) {
  const output = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    if (hasValue(key)) output.set(String(key), row);
  }
  return output;
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function sortedEntries(object) {
  return Object.entries(object || {}).sort((left, right) => right[1] - left[1] || String(left[0]).localeCompare(String(right[0])));
}

function slug(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, "-");
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function loadWindowGlobals(files) {
  const context = { window: {} };
  vm.createContext(context);
  for (const file of files) {
    vm.runInContext(await readFile(file, "utf8"), context, { filename: file });
  }
  return context.window;
}

function percentile(values, p) {
  const clean = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!clean.length) return null;
  const index = (clean.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return clean[lower];
  return clean[lower] + (clean[upper] - clean[lower]) * (index - lower);
}

function percentileThresholdsByPosition(rows, field, p) {
  const grouped = groupBy(rows, (row) => row.official_fantasy_position || row.position);
  const thresholds = {};
  for (const [position, positionRows] of grouped.entries()) {
    thresholds[position] = percentile(positionRows.map((row) => num(row[field], null)), p);
  }
  return thresholds;
}

function projectionRowsById(rows) {
  const byId = new Map();
  for (const row of rows) {
    const id = String(row.official_fantasy_player_id || "");
    if (!id) continue;
    const existing = byId.get(id) || {};
    existing[row.matchday] = row;
    byId.set(id, existing);
  }
  return byId;
}

function bestRecommendationRows(rows) {
  const byId = new Map();
  for (const row of rows) {
    const id = String(row.official_fantasy_player_id || "");
    if (!id) continue;
    const score = num(row.recommendation_score, 0);
    const rankScore = row.recommendation_tier === "top_pick_candidate" ? 30 : row.recommendation_tier === "strong_candidate" ? 15 : 0;
    const modeScore = ["captain", "upside"].includes(row.mode) ? 12 : 0;
    const totalScore = score + rankScore + modeScore - num(row.rank, 999) * 0.02;
    const existing = byId.get(id);
    if (!existing || totalScore > existing._score) {
      byId.set(id, { ...row, _score: totalScore });
    }
  }
  return byId;
}

function makeRecommendationContext(rows) {
  const md2Rows = rows.filter((row) => row.matchday === "md2");
  const md2ById = bestRecommendationRows(md2Rows);
  const anyById = bestRecommendationRows(rows);
  return {
    md2Rows,
    md2ById,
    anyById,
    md2Ids: new Set(md2Rows.map((row) => String(row.official_fantasy_player_id || "")).filter(Boolean))
  };
}

function teamScoreRowsByMd2(scoreData) {
  const rows = (scoreData.teamFixturePredictions || []).filter((row) => row.fantasy_matchday_id === "md2");
  const byKey = new Map();
  for (const row of rows) {
    byKey.set(String(row.team_id), row);
    byKey.set(slug(row.team), row);
  }
  return byKey;
}

function md1EvidenceObject(md1Row) {
  return md1Row?.role_evidence && typeof md1Row.role_evidence === "object" ? md1Row.role_evidence : {};
}

function statusText(value) {
  if (!hasValue(value)) return "";
  if (typeof value === "string") return value.toLowerCase();
  if (typeof value === "object") return JSON.stringify(value).toLowerCase();
  return String(value).toLowerCase();
}

function explicitRoleEvidence(md1Row, liveRow) {
  const evidence = md1EvidenceObject(md1Row);
  const text = statusText(liveRow?.matchStatus || md1Row?.actual_md1_match_status || "");
  const started = evidence.started === true ||
    liveRow?.matchStatus?.started === true ||
    liveRow?.matchStatus?.isStarter === true ||
    /\b(started|starter|starting xi|lineup_start)\b/.test(text);
  const sub = evidence.sub_appearance === true ||
    liveRow?.matchStatus?.sub_appearance === true ||
    /\b(substitute appearance|came on|sub_appearance|bench appearance)\b/.test(text);
  const notInSquad = evidence.not_in_squad === true ||
    liveRow?.matchStatus?.not_in_squad === true ||
    /\b(not in squad|not_in_squad|out of squad)\b/.test(text);
  const minutes = num(liveRow?.matchStatus?.minutes ?? liveRow?.matchStatus?.playedMinutes ?? md1Row?.actual_md1_minutes, null);
  return { started, sub, notInSquad, minutes };
}

function actualMd1Points(md1Row, liveRow) {
  const md1Available = md1Row?.actual_md1_points_available === true;
  if (md1Available) {
    return {
      available: true,
      points: num(md1Row.actual_md1_fantasy_points, 0),
      source: PATHS.md1CalibrationDataset
    };
  }
  const roundPoints = liveRow?.stats?.roundPoints || {};
  if (Object.prototype.hasOwnProperty.call(roundPoints, "1")) {
    return {
      available: true,
      points: num(roundPoints["1"], 0),
      source: PATHS.livePlayersJson
    };
  }
  return { available: false, points: null, source: null };
}

function roleEvidenceType({ md1Row, liveRow, priorMd1, priorMd2, actual }) {
  const explicit = explicitRoleEvidence(md1Row, liveRow);
  if (explicit.started) return "confirmed_started";
  if (explicit.sub) return "confirmed_sub";
  if (explicit.notInSquad) return "confirmed_not_in_squad";
  if (actual.available && num(actual.points, 0) > 0) return "played_points_evidence";
  if (!actual.available && !priorMd1 && !priorMd2) return "no_md1_fixture_or_no_evidence";
  return "zero_or_missing_points_evidence";
}

function sourcePlayerIds(record, liveRow) {
  return {
    official_fantasy_player_id: record.official_fantasy_player_id || null,
    internal_player_id: record.internal_player_id || null,
    matched_existing_player_id: record.matched_existing_player_id || null,
    fifa_player_id: liveRow?.fifa_player_id || null,
    official_team_id: record.team_id || liveRow?.team_id || null,
    live_squad_id: liveRow?.squad_id || null
  };
}

function liveStatusFields(liveRow) {
  if (!liveRow) {
    return {
      live_row_available: false,
      status: null,
      matchStatus: null,
      round1_points_available: false,
      round1_points: null,
      totalPoints: null,
      lastRoundPoints: null,
      pointScope: null,
      suppressed_unfinalized_point_rounds: []
    };
  }
  const roundPoints = liveRow.stats?.roundPoints || {};
  const hasRound1 = Object.prototype.hasOwnProperty.call(roundPoints, "1");
  return {
    live_row_available: true,
    status: liveRow.status || null,
    matchStatus: liveRow.matchStatus || null,
    round1_points_available: hasRound1,
    round1_points: hasRound1 ? num(roundPoints["1"], 0) : null,
    totalPoints: liveRow.stats?.totalPoints ?? null,
    lastRoundPoints: liveRow.stats?.lastRoundPoints ?? null,
    pointScope: liveRow.stats?.pointScope || null,
    nextFixtureFromScheduledRound: liveRow.stats?.nextFixtureFromScheduledRound || null,
    suppressed_unfinalized_point_rounds: liveRow.suppressed_unfinalized_point_rounds || []
  };
}

function thresholdsForElite(officialRecords, md2ProjectionRows) {
  return {
    price: percentileThresholdsByPosition(officialRecords, "official_price", 0.9),
    projectedPoints: percentileThresholdsByPosition(md2ProjectionRows, "raw_expected_points", 0.9),
    expectedMinutes: percentileThresholdsByPosition(md2ProjectionRows, "expected_minutes", 0.9),
    captainScore: percentileThresholdsByPosition(md2ProjectionRows, "captain_score", 0.9)
  };
}

function eliteFlags({ record, priorMd2, recommendation, thresholds }) {
  const position = record.official_fantasy_position || priorMd2?.official_fantasy_position || "missing";
  const flags = [];
  if (num(record.official_price, -1) >= num(thresholds.price[position], Infinity)) flags.push("top_price_tier_within_position");
  if (priorMd2 && num(priorMd2.raw_expected_points, -1) >= num(thresholds.projectedPoints[position], Infinity)) flags.push("top_10pct_prior_md2_projected_points_within_position");
  if (priorMd2 && num(priorMd2.expected_minutes, -1) >= num(thresholds.expectedMinutes[position], Infinity)) flags.push("top_10pct_prior_md2_expected_minutes_within_position");
  if (priorMd2 && num(priorMd2.captain_score, -1) >= num(thresholds.captainScore[position], Infinity)) flags.push("top_10pct_prior_md2_captain_score_within_position");
  if (recommendation && ["top_pick_candidate", "strong_candidate"].includes(recommendation.recommendation_tier)) flags.push("top_recommendation_tier_before_rebuild");
  if (recommendation && ["captain", "upside"].includes(recommendation.mode) && num(recommendation.rank, 999) <= 25) flags.push(`top_${recommendation.mode}_tier_before_rebuild`);
  return flags;
}

function teamRoleContext({ record, priorMd2, scoreRowsByTeam }) {
  const teamKey = priorMd2?.team_id || slug(record.country);
  const teamScore = scoreRowsByTeam.get(String(teamKey)) || scoreRowsByTeam.get(slug(record.country)) || null;
  const expectedGoals = num(teamScore?.expected_goals, null);
  const winProbability = num(teamScore?.win_probability, null);
  const highUncertainty = teamScore?.matchUncertainty === "High" || teamScore?.match_uncertainty === "High";
  const adjustmentRows = [
    teamScore?.v4_calibration?.home_md1_adjustment,
    teamScore?.v4_calibration?.away_md1_adjustment
  ].filter(Boolean);
  const ownAdjustment = adjustmentRows.find((row) => row.team_id === teamScore?.team_id || slug(row.team) === slug(teamScore?.team));
  const extremeResidual = ownAdjustment?.uncertainty_flag === "extreme_md1_residual";
  const strongMd2Environment = (expectedGoals !== null && expectedGoals >= 2.2) ||
    (winProbability !== null && winProbability >= 0.7) ||
    num(teamScore?.captain_environment_score, 0) >= 80;
  const roleContinuitySupport = strongMd2Environment ? 0.015 : 0;
  const uncertaintyRiskAdd = (highUncertainty ? 0.025 : 0) + (extremeResidual ? 0.025 : 0);
  const notes = [];
  if (strongMd2Environment) notes.push("strong_md2_match_environment_supports_high_prior_continuity");
  if (highUncertainty) notes.push("score_v4_high_match_uncertainty_lowers_role_confidence");
  if (extremeResidual) notes.push("extreme_md1_team_residual_keeps_role_uncertainty_elevated");
  return {
    fixture_id: teamScore?.fixture_id || priorMd2?.fixture_id || null,
    match_number: teamScore?.match_number || priorMd2?.match_number || null,
    opponent: teamScore?.opponent || priorMd2?.opponent || null,
    expected_goals: expectedGoals,
    win_probability: winProbability,
    match_uncertainty: teamScore?.matchUncertainty || teamScore?.match_uncertainty || null,
    strong_md2_environment: strongMd2Environment,
    extreme_md1_team_residual: extremeResidual,
    role_continuity_support: roleContinuitySupport,
    uncertainty_risk_add: round(uncertaintyRiskAdd, 3),
    adjustment_notes: notes
  };
}

function roleReasonFor({ evidenceType, priorStart, elite, notSelectable, protectedElite, tier }) {
  if (notSelectable) return "Not selectable in official fantasy pool";
  if (evidenceType === "confirmed_started") return "Confirmed MD1 starter evidence supports role";
  if (evidenceType === "confirmed_sub" && elite) return "Elite/high-prior role protected after confirmed MD1 substitute evidence";
  if (evidenceType === "confirmed_sub") return "Confirmed MD1 substitute evidence caps starter confidence";
  if (evidenceType === "confirmed_not_in_squad") return "Confirmed MD1 not-in-squad evidence caps MD2 role";
  if (evidenceType === "played_points_evidence" && num(priorStart, 0) >= 0.7) return "MD1 participation supports strong prior role, but starter field unavailable";
  if (evidenceType === "played_points_evidence") return "MD1 participation supports role, but starter field unavailable";
  if (protectedElite) return "Elite prior preserved despite weak MD1 evidence";
  if (evidenceType === "zero_or_missing_points_evidence" && num(priorStart, 0) < 0.35) return "Downgraded after no MD1 point evidence";
  if (evidenceType === "zero_or_missing_points_evidence") return "Weak MD1 point evidence lowers role confidence";
  if (tier === "no_md1_evidence") return "No MD1 evidence; prior retained with uncertainty";
  return "Prior retained with MD1 evidence uncertainty";
}

function evidenceStrength(evidenceType, actualPoints) {
  if (["confirmed_started", "confirmed_sub", "confirmed_not_in_squad"].includes(evidenceType)) return "strong";
  if (evidenceType === "played_points_evidence" && num(actualPoints, 0) >= 4) return "medium";
  if (evidenceType === "played_points_evidence") return "medium";
  return "weak";
}

function startProbabilityUpdate({ record, priorMd2, evidenceType, actual, elite, strongPrior, teamContext }) {
  const selectable = record.selectable_status === "playing";
  const priorStart = num(priorMd2?.start_probability, DEFAULT_START_PRIOR[record.official_fantasy_position] ?? 0.1);
  let start = priorStart;
  const reasons = [];
  const positivePoints = actual.available && num(actual.points, 0) > 0;
  const strongPositivePoints = positivePoints && num(actual.points, 0) >= 5;

  if (!selectable) {
    return { start: 0, reasons: ["official_not_selectable"], protectedElite: false };
  }

  if (evidenceType === "confirmed_started") {
    const floor = strongPrior ? 0.84 : 0.80;
    const cap = priorStart > 0.95 ? priorStart : 0.95;
    start = clamp(Math.max(priorStart, floor), floor, cap);
    reasons.push(strongPrior ? "confirmed_started_strong_prior_floor" : "confirmed_started_normal_prior_floor");
  } else if (evidenceType === "confirmed_sub") {
    if (elite || strongPrior) {
      start = clamp(Math.max(priorStart * 0.82, 0.66), 0.66, Math.max(0.76, Math.min(priorStart, 0.82)));
      reasons.push("elite_confirmed_sub_managed_not_hard_capped");
    } else if (priorStart < 0.45) {
      start = clamp(Math.min(priorStart * 0.85 + 0.08, 0.58), 0.18, 0.62);
      reasons.push("confirmed_sub_low_prior_cap");
    } else {
      start = clamp(priorStart * 0.78, 0.24, 0.62);
      reasons.push("confirmed_sub_rotation_cap");
    }
  } else if (evidenceType === "confirmed_not_in_squad") {
    start = clamp(elite || strongPrior ? 0.22 : 0.14, 0, elite ? 0.25 : 0.15);
    reasons.push("confirmed_not_in_squad_cap");
  } else if (evidenceType === "played_points_evidence") {
    if ((elite || strongPrior) && strongPositivePoints) {
      const cap = priorStart >= 0.80 ? 0.92 : 0.80;
      start = clamp(Math.max(priorStart + 0.035, 0.72), 0.35, cap);
      reasons.push("strong_positive_points_high_prior_likely_confirmation");
    } else if (priorStart >= 0.65) {
      const cap = priorStart >= 0.78 ? 0.88 : 0.80;
      start = clamp(Math.max(priorStart + 0.035, 0.68), 0.35, cap);
      reasons.push("positive_points_good_prior_moderate_boost");
    } else if (priorStart >= 0.35) {
      start = clamp(priorStart + 0.075, 0.35, 0.72);
      reasons.push("positive_points_rotation_prior_boost");
    } else {
      start = clamp(Math.max(priorStart + 0.10, 0.22), 0.12, 0.62);
      reasons.push("positive_points_low_prior_participation_boost");
    }
  } else if (evidenceType === "zero_or_missing_points_evidence") {
    if (elite || strongPrior) {
      if (strongPrior || priorStart >= 0.45) {
        const floor = strongPrior ? 0.64 : 0.55;
        const downgrade = actual.available ? 0.055 : 0.09;
        start = clamp(priorStart - downgrade, floor, Math.max(floor, priorStart));
        reasons.push(actual.available ? "elite_zero_points_moderate_downgrade" : "elite_missing_points_moderate_downgrade");
      } else {
        const softFloor = elite ? 0.16 : 0.08;
        const softCap = priorStart >= 0.35 ? 0.45 : 0.35;
        start = clamp(Math.max(priorStart * (actual.available ? 0.85 : 0.75), softFloor), 0, softCap);
        reasons.push(actual.available ? "price_or_upside_elite_low_prior_zero_points_flagged_not_upgraded" : "price_or_upside_elite_low_prior_missing_points_flagged_not_upgraded");
      }
    } else if (priorStart < 0.35) {
      start = clamp(Math.min(priorStart * 0.62, 0.26), 0, 0.30);
      reasons.push(actual.available ? "low_prior_zero_points_downgrade" : "low_prior_missing_points_downgrade");
    } else {
      start = clamp(priorStart * (actual.available ? 0.82 : 0.74), 0.12, 0.72);
      reasons.push(actual.available ? "zero_points_standard_downgrade" : "missing_points_standard_downgrade");
    }
  } else {
    start = clamp(priorStart, 0, START_CAP);
    reasons.push("no_md1_evidence_prior_retained");
  }

  if ((elite || strongPrior) && !["confirmed_sub", "confirmed_not_in_squad"].includes(evidenceType) && teamContext.role_continuity_support > 0) {
    start = Math.min(START_CAP, start + teamContext.role_continuity_support);
    reasons.push("score_v4_strong_md2_context_small_continuity_support");
  }

  const protectedElite = Boolean((elite || strongPrior) &&
    ["zero_or_missing_points_evidence", "confirmed_sub"].includes(evidenceType) &&
    priorStart >= 0.45 &&
    start >= Math.max(0.55, priorStart - 0.14));

  return {
    start: round(clamp(start, 0, START_CAP), 3),
    reasons,
    protectedElite
  };
}

function roleTierFor({ record, evidenceType, start, priorMd2, elite, strongPrior, protectedElite }) {
  if (record.selectable_status !== "playing") return "unavailable_or_not_selectable";
  if (evidenceType === "confirmed_not_in_squad") return "not_in_squad_risk";
  if (evidenceType === "confirmed_sub" && (elite || strongPrior)) return "managed_minutes_star";
  if (evidenceType === "confirmed_sub" && start < 0.35) return "impact_sub";
  if (protectedElite && start >= 0.64) return "managed_minutes_star";
  if (evidenceType === "no_md1_fixture_or_no_evidence" && !priorMd2) return "no_md1_evidence";
  if (start >= 0.86 && (evidenceType === "confirmed_started" || evidenceType === "played_points_evidence" || strongPrior)) return "locked_starter";
  if (start >= 0.74) return "likely_starter";
  if (start >= 0.55) return "possible_starter";
  if (start >= 0.38) return "rotation_risk";
  if (start >= 0.20) return "impact_sub";
  return "bench_depth";
}

function expectedMinutesFor({ roleTier, start, priorMd2, position, evidenceType }) {
  if (roleTier === "unavailable_or_not_selectable") return 0;
  const [min, max] = TIER_MINUTES[roleTier] || [0, MINUTES_CAP];
  const priorMinutes = num(priorMd2?.expected_minutes, null);
  let target;
  if (roleTier === "locked_starter") target = position === "GK" ? 89 : 78 + start * 8;
  else if (roleTier === "likely_starter") target = 62 + start * 18;
  else if (roleTier === "possible_starter") target = 36 + start * 45;
  else if (roleTier === "managed_minutes_star") target = 48 + start * 25;
  else if (roleTier === "rotation_risk") target = 26 + start * 55;
  else if (roleTier === "impact_sub") target = 13 + start * 70;
  else if (roleTier === "bench_depth") target = 5 + start * 55;
  else if (roleTier === "not_in_squad_risk") target = 4 + start * 45;
  else target = priorMinutes ?? 18;

  if (evidenceType === "played_points_evidence" && priorMinutes !== null) {
    target = target * 0.45 + priorMinutes * 0.55;
  } else if (priorMinutes !== null) {
    target = target * 0.65 + priorMinutes * 0.35;
  }

  return round(clamp(target, min, Math.min(max, MINUTES_CAP)), 1);
}

function roleConfidenceFor({ evidenceType, evidenceStrengthValue, start, elite, teamContext, dataFlags }) {
  let score = 0.46;
  if (evidenceStrengthValue === "strong") score += 0.28;
  if (evidenceStrengthValue === "medium") score += 0.12;
  if (start >= 0.75) score += 0.10;
  if (elite) score += 0.04;
  if (teamContext.strong_md2_environment) score += 0.02;
  if (teamContext.match_uncertainty === "High") score -= 0.07;
  if (teamContext.extreme_md1_team_residual) score -= 0.06;
  if (dataFlags.includes("missing_prior_md2_projection")) score -= 0.12;
  if (dataFlags.includes("missing_md1_points_row")) score -= 0.06;
  if (dataFlags.includes("not_final_squad_backed")) score -= 0.03;
  if (evidenceType === "zero_or_missing_points_evidence") score -= 0.07;
  if (evidenceType === "no_md1_fixture_or_no_evidence") score -= 0.12;
  if (score >= 0.72) return "high";
  if (score >= 0.48) return "medium";
  return "low";
}

function roleRiskScoreFor({ start, evidenceStrengthValue, roleConfidence, teamContext, dataFlags, notSelectable }) {
  if (notSelectable) return 1;
  let risk = 1 - start;
  if (evidenceStrengthValue === "weak") risk += 0.12;
  if (evidenceStrengthValue === "medium") risk += 0.04;
  if (roleConfidence === "low") risk += 0.12;
  if (roleConfidence === "medium") risk += 0.04;
  risk += teamContext.uncertainty_risk_add || 0;
  if (dataFlags.includes("missing_prior_md2_projection")) risk += 0.10;
  if (dataFlags.includes("missing_md1_points_row")) risk += 0.06;
  if (dataFlags.includes("not_final_squad_backed")) risk += 0.03;
  return round(clamp(risk, 0, 1), 3);
}

function dataQualityFlags({ record, priorMd2, priorMd1, actual, evidenceType, eliteFlagsList, protectedElite, liveRow }) {
  const flags = [
    "fantasy_pool_only",
    "not_final_squad_backed",
    "score_v4_context_only_not_points_rebuild",
    "ownership_not_used_as_signal"
  ];
  if (record.selectable_status !== "playing") flags.push("not_selectable_forced_zero");
  if (!priorMd2) flags.push("missing_prior_md2_projection");
  if (!priorMd1) flags.push("missing_prior_md1_projection");
  if (!actual.available) flags.push("missing_md1_points_row");
  if (actual.available && num(actual.points, 0) === 0) flags.push("md1_zero_point_row");
  if (actual.available && num(actual.points, 0) > 0) flags.push("md1_positive_points_row");
  if (["played_points_evidence", "zero_or_missing_points_evidence"].includes(evidenceType)) flags.push("points_only_role_evidence_no_starter_field");
  if (evidenceType === "no_md1_fixture_or_no_evidence") flags.push("no_md1_role_evidence");
  if (eliteFlagsList.length) flags.push("elite_high_prior");
  if (protectedElite) flags.push("elite_protected_from_weak_md1_over_downgrade");
  if (record.position_conflict) flags.push("official_existing_position_conflict");
  if (liveRow && hasValue(liveRow.percentSelected)) flags.push("ownership_field_present_not_used");
  return unique(flags);
}

function cautionFor({ notSelectable, protectedElite, elite, evidenceType, priorStart, start, dataFlags }) {
  if (notSelectable) return "Official fantasy status is not selectable; start probability forced to zero.";
  if (protectedElite) return "Elite/high-prior player kept alive, but weak MD1 role evidence requires manual review.";
  if (elite && evidenceType === "zero_or_missing_points_evidence") return "Elite/high-prior player has weak MD1 role evidence; verify role before using in projections.";
  if (elite && start < num(priorStart, 0) - 0.001) return "Elite/high-prior player downgraded; verify role before using in projections.";
  if (evidenceType === "zero_or_missing_points_evidence" && num(priorStart, 0) >= 0.7) return "Strong prior has weak MD1 point evidence; role kept but confidence reduced.";
  if (dataFlags.includes("missing_prior_md2_projection")) return "No active MD2 projection row; role model uses conservative fallback.";
  return null;
}

function buildRoleRows({ officialRecords, projectionById, md1RowsById, liveRowsById, recommendationContext, financeById, scoreRowsByTeam, thresholds }) {
  const rows = [];
  for (const record of officialRecords) {
    const id = String(record.official_fantasy_player_id || "");
    const projections = projectionById.get(id) || {};
    const priorMd2 = projections.md2 || null;
    const priorMd1 = projections.md1 || null;
    const md1Row = md1RowsById.get(id) || null;
    const liveRow = liveRowsById.get(id) || null;
    const finance = financeById.get(id) || null;
    const bestRec = recommendationContext.md2ById.get(id) || recommendationContext.anyById.get(id) || null;
    const actual = actualMd1Points(md1Row, liveRow);
    const evidenceType = roleEvidenceType({ md1Row, liveRow, priorMd1, priorMd2, actual });
    const teamContext = teamRoleContext({ record, priorMd2, scoreRowsByTeam });
    const eliteFlagsList = eliteFlags({ record, priorMd2, recommendation: bestRec, thresholds });
    const elite = eliteFlagsList.length > 0;
    const priorStart = num(priorMd2?.start_probability, null);
    const strongPrior = num(priorStart, 0) >= 0.78 || num(priorMd2?.expected_minutes, 0) >= 70;
    const notSelectable = record.selectable_status !== "playing";
    const update = startProbabilityUpdate({ record, priorMd2, evidenceType, actual, elite, strongPrior, teamContext });
    const roleTier = roleTierFor({ record, evidenceType, start: update.start, priorMd2, elite, strongPrior, protectedElite: update.protectedElite });
    const md2ExpectedMinutes = expectedMinutesFor({
      roleTier,
      start: update.start,
      priorMd2,
      position: record.official_fantasy_position,
      evidenceType
    });
    const evidenceStrengthValue = evidenceStrength(evidenceType, actual.points);
    const flags = dataQualityFlags({ record, priorMd2, priorMd1, actual, evidenceType, eliteFlagsList, protectedElite: update.protectedElite, liveRow });
    const roleConfidence = notSelectable
      ? "low"
      : roleConfidenceFor({ evidenceType, evidenceStrengthValue, start: update.start, elite, teamContext, dataFlags: flags });
    const roleRiskScore = roleRiskScoreFor({
      start: update.start,
      evidenceStrengthValue,
      roleConfidence,
      teamContext,
      dataFlags: flags,
      notSelectable
    });
    const roleReason = roleReasonFor({
      evidenceType,
      priorStart,
      elite,
      notSelectable,
      protectedElite: update.protectedElite,
      tier: roleTier
    });
    const caution = cautionFor({
      notSelectable,
      protectedElite: update.protectedElite,
      elite,
      evidenceType,
      priorStart,
      start: update.start,
      dataFlags: flags
    });

    rows.push({
      official_fantasy_player_id: id,
      source_player_ids: sourcePlayerIds(record, liveRow),
      internal_player_id: record.internal_player_id || null,
      matched_existing_player_id: record.matched_existing_player_id || null,
      fifa_player_id: liveRow?.fifa_player_id || null,
      name: record.name || priorMd2?.name || liveRow?.name || null,
      display_name: priorMd2?.display_name || liveRow?.display_name || record.name || null,
      team: record.country || priorMd2?.country || liveRow?.team_name || null,
      country: record.country || priorMd2?.country || liveRow?.team_name || null,
      team_id: priorMd2?.team_id || slug(record.country),
      official_team_id: record.team_id || liveRow?.team_id || null,
      position: record.official_fantasy_position || priorMd2?.official_fantasy_position || null,
      official_fantasy_position: record.official_fantasy_position || priorMd2?.official_fantasy_position || null,
      price: num(record.official_price, num(priorMd2?.official_price, null)),
      official_price: num(record.official_price, num(priorMd2?.official_price, null)),
      selectable_status: record.selectable_status || liveRow?.status || null,
      live_selectable_status: liveRow?.status || null,
      md2_fixture: {
        fixture_id: teamContext.fixture_id,
        match_number: teamContext.match_number,
        opponent: teamContext.opponent,
        match_uncertainty: teamContext.match_uncertainty
      },
      prior_md2_start_probability: priorStart,
      prior_md2_expected_minutes: num(priorMd2?.expected_minutes, null),
      prior_md2_projected_points: num(priorMd2?.raw_expected_points, null),
      prior_md2_risk_adjusted_points: num(priorMd2?.risk_adjusted_points, null),
      prior_md2_captain_score: num(priorMd2?.captain_score, null),
      prior_md1_start_probability: num(priorMd1?.start_probability, null),
      prior_md1_expected_minutes: num(priorMd1?.expected_minutes, null),
      prior_md1_projected_points: num(priorMd1?.raw_expected_points, null),
      prior_md1_risk_adjusted_points: num(priorMd1?.risk_adjusted_points, null),
      md1_actual_fantasy_points: actual.points,
      md1_actual_points_available: actual.available,
      md1_actual_points_source: actual.source,
      md1_live_status_fields: liveStatusFields(liveRow),
      md1_role_evidence_type: evidenceType,
      md1_explicit_role_fields: explicitRoleEvidence(md1Row, liveRow),
      roleTier,
      md2StartProb: update.start,
      md2ExpectedMinutes,
      roleConfidence,
      roleRiskScore,
      roleReason,
      caution,
      evidenceStrength: evidenceStrengthValue,
      dataQualityFlags: flags,
      prior_role_label: priorMd2?.role_label || finance?.role_label || md1Row?.role_label_prior || null,
      prior_role_confidence: priorMd2?.role_confidence || finance?.role_confidence || md1Row?.role_confidence_prior || null,
      elite_high_prior: elite,
      elite_high_prior_flags: eliteFlagsList,
      protected_from_weak_md1_over_downgrade: update.protectedElite,
      start_probability_delta: priorStart === null ? null : round(update.start - priorStart, 3),
      expected_minutes_delta: num(priorMd2?.expected_minutes, null) === null ? null : round(md2ExpectedMinutes - num(priorMd2.expected_minutes, 0), 1),
      role_update_reasons: update.reasons,
      team_role_context: teamContext,
      recommendation_context: bestRec ? {
        matchday: bestRec.matchday || null,
        mode: bestRec.mode || null,
        rank: bestRec.rank ?? null,
        recommendation_tier: bestRec.recommendation_tier || null,
        recommendation_score: num(bestRec.recommendation_score, null)
      } : null,
      finance_context: finance ? {
        price_tier: finance.price_tier || null,
        value_over_replacement: num(finance.value_over_replacement, null),
        scarcity_adjusted_value: num(finance.scarcity_adjusted_value, null),
        confidence_adjusted_value: num(finance.confidence_adjusted_value, null),
        role_risk: num(finance.role_risk, null),
        minutes_risk: num(finance.minutes_risk, null)
      } : null,
      model_stage: "md2_role_sidecar_only",
      modelVersion: MODEL_VERSION,
      source_note: "MD2 role/start/minutes sidecar using official fantasy pool identity, active projection priors, final MD1 point/status evidence, and Score Model v4 context. Does not rebuild projections, recommendations, finance, score, PELE, or Team Builder weights."
    });
  }
  return rows;
}

function hasInvalidNumber(value, path = "$", output = []) {
  if (typeof value === "number" && !Number.isFinite(value)) {
    output.push(path);
    return output;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => hasInvalidNumber(item, `${path}[${index}]`, output));
    return output;
  }
  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) hasInvalidNumber(item, `${path}.${key}`, output);
  }
  return output;
}

function compactPlayer(row) {
  return {
    official_fantasy_player_id: row.official_fantasy_player_id,
    name: row.name,
    country: row.country,
    position: row.position,
    price: row.price,
    opponent: row.md2_fixture?.opponent || null,
    prior_start: row.prior_md2_start_probability,
    md2StartProb: row.md2StartProb,
    start_delta: row.start_probability_delta,
    prior_minutes: row.prior_md2_expected_minutes,
    md2ExpectedMinutes: row.md2ExpectedMinutes,
    minutes_delta: row.expected_minutes_delta,
    roleTier: row.roleTier,
    evidence: row.md1_role_evidence_type,
    actual_points: row.md1_actual_fantasy_points,
    roleRiskScore: row.roleRiskScore,
    roleReason: row.roleReason,
    caution: row.caution
  };
}

function buildWatchlists(rows) {
  const selectable = rows.filter((row) => row.selectable_status === "playing");
  return {
    top_40_safest_md2_starters: selectable
      .filter((row) => ["locked_starter", "likely_starter", "managed_minutes_star"].includes(row.roleTier))
      .sort((a, b) => b.md2StartProb - a.md2StartProb || b.md2ExpectedMinutes - a.md2ExpectedMinutes || (b.prior_md2_projected_points || 0) - (a.prior_md2_projected_points || 0))
      .slice(0, 40)
      .map(compactPlayer),
    top_40_likely_starters_by_projected_role: selectable
      .filter((row) => row.md2StartProb >= 0.7)
      .sort((a, b) => b.md2ExpectedMinutes - a.md2ExpectedMinutes || b.md2StartProb - a.md2StartProb)
      .slice(0, 40)
      .map(compactPlayer),
    top_40_risky_high_upside_players: selectable
      .filter((row) => row.elite_high_prior && (row.roleRiskScore >= 0.28 || row.caution))
      .sort((a, b) => b.roleRiskScore - a.roleRiskScore || (b.prior_md2_projected_points || 0) - (a.prior_md2_projected_points || 0))
      .slice(0, 40)
      .map(compactPlayer),
    elite_high_prior_players_downgraded: selectable
      .filter((row) => row.elite_high_prior && num(row.start_probability_delta, 0) < -0.001)
      .sort((a, b) => a.start_probability_delta - b.start_probability_delta)
      .slice(0, 80)
      .map(compactPlayer),
    start_probability_moves_over_0_20: selectable
      .filter((row) => Math.abs(num(row.start_probability_delta, 0)) > 0.20)
      .sort((a, b) => Math.abs(b.start_probability_delta) - Math.abs(a.start_probability_delta))
      .map(compactPlayer),
    expected_minutes_moves_over_20: selectable
      .filter((row) => Math.abs(num(row.expected_minutes_delta, 0)) > 20)
      .sort((a, b) => Math.abs(b.expected_minutes_delta) - Math.abs(a.expected_minutes_delta))
      .map(compactPlayer),
    positive_md1_points_low_md2_start_probability: selectable
      .filter((row) => row.md1_role_evidence_type === "played_points_evidence" && row.md2StartProb < 0.45)
      .sort((a, b) => a.md2StartProb - b.md2StartProb || b.md1_actual_fantasy_points - a.md1_actual_fantasy_points)
      .slice(0, 80)
      .map(compactPlayer),
    zero_or_missing_md1_points_high_md2_start_probability: selectable
      .filter((row) => row.md1_role_evidence_type === "zero_or_missing_points_evidence" && row.md2StartProb >= 0.72)
      .sort((a, b) => b.md2StartProb - a.md2StartProb)
      .slice(0, 80)
      .map(compactPlayer),
    not_selectable_players_with_nonzero_prior_projection: rows
      .filter((row) => row.selectable_status !== "playing" && (num(row.prior_md2_projected_points, 0) > 0 || num(row.prior_md2_start_probability, 0) > 0))
      .map(compactPlayer)
  };
}

function buildQa({ rows, officialRecords, projectionRows, recommendationContext, financeRows }) {
  const checks = [];
  const push = (id, pass, detail, severity = "error") => checks.push({ id, status: pass ? "pass" : "fail", severity, detail });
  const ids = rows.map((row) => String(row.official_fantasy_player_id || ""));
  const idSet = new Set(ids);
  const invalidNumbers = hasInvalidNumber(rows);
  const md2ProjectionIds = new Set(projectionRows.filter((row) => row.matchday === "md2").map((row) => String(row.official_fantasy_player_id || "")).filter(Boolean));
  const financeIds = new Set(financeRows.map((row) => String(row.official_fantasy_player_id || "")).filter(Boolean));
  const notSelectableRows = rows.filter((row) => row.selectable_status !== "playing");
  const eliteDowngraded = rows.filter((row) => row.elite_high_prior && num(row.start_probability_delta, 0) < -0.001);
  const top30Prior = rows
    .filter((row) => row.selectable_status === "playing" && Number.isFinite(row.prior_md2_projected_points))
    .sort((a, b) => b.prior_md2_projected_points - a.prior_md2_projected_points)
    .slice(0, 30);
  const top30Downgraded = top30Prior.filter((row) => num(row.start_probability_delta, 0) < -0.001);
  const weakEliteDestroyed = rows.filter((row) =>
    row.selectable_status === "playing" &&
    row.elite_high_prior &&
    row.md1_role_evidence_type === "zero_or_missing_points_evidence" &&
    num(row.prior_md2_start_probability, 0) >= 0.55 &&
    row.md2StartProb < 0.50
  );
  const lowPriorZeroMissing = rows.filter((row) =>
    row.selectable_status === "playing" &&
    row.md1_role_evidence_type === "zero_or_missing_points_evidence" &&
    num(row.prior_md2_start_probability, 0) > 0 &&
    num(row.prior_md2_start_probability, 0) < 0.35
  );
  const lowPriorZeroMissingDowngraded = lowPriorZeroMissing.filter((row) => row.md2StartProb <= num(row.prior_md2_start_probability, 0));
  const positiveBenchDepth = rows.filter((row) =>
    row.selectable_status === "playing" &&
    row.md1_role_evidence_type === "played_points_evidence" &&
    row.roleTier === "bench_depth"
  );
  const notSelectableStarter = notSelectableRows.filter((row) => ["likely_starter", "locked_starter", "managed_minutes_star"].includes(row.roleTier));

  push("official_player_coverage", rows.length === officialRecords.length, `${rows.length}/${officialRecords.length} official fantasy rows have role rows.`);
  push("no_duplicate_official_fantasy_player_ids", idSet.size === ids.length, `${idSet.size}/${ids.length} unique official fantasy player IDs.`);
  push("md2_recommendation_players_have_role_rows", [...recommendationContext.md2Ids].every((id) => idSet.has(id)), `${[...recommendationContext.md2Ids].filter((id) => idSet.has(id)).length}/${recommendationContext.md2Ids.size} MD2 recommendation players covered.`);
  push("md2_projection_players_have_role_rows", [...md2ProjectionIds].every((id) => idSet.has(id)), `${[...md2ProjectionIds].filter((id) => idSet.has(id)).length}/${md2ProjectionIds.size} MD2 projection players covered.`);
  push("finance_players_have_role_rows_where_active", [...financeIds].every((id) => idSet.has(id)), `${[...financeIds].filter((id) => idSet.has(id)).length}/${financeIds.size} finance players covered.`);
  push("start_probability_bounds", rows.every((row) => row.md2StartProb >= 0 && row.md2StartProb <= 1), "All md2StartProb values are between 0 and 1.");
  push("expected_minutes_bounds", rows.every((row) => row.md2ExpectedMinutes >= 0 && row.md2ExpectedMinutes <= MINUTES_CAP), `All md2ExpectedMinutes values are between 0 and ${MINUTES_CAP}.`);
  push("role_risk_bounds", rows.every((row) => row.roleRiskScore >= 0 && row.roleRiskScore <= 1), "All roleRiskScore values are between 0 and 1.");
  push("no_nan_or_infinity", invalidNumbers.length === 0, invalidNumbers.length ? invalidNumbers.slice(0, 12).join(", ") : "No NaN or Infinity values.");
  push("not_selectable_forced_zero", notSelectableRows.every((row) => row.md2StartProb === 0 && row.md2ExpectedMinutes === 0), `${notSelectableRows.length} not-selectable rows forced to zero.`);
  push("role_tier_present", rows.every((row) => ROLE_TIERS.includes(row.roleTier)), "Every role row has a valid roleTier.");
  push("role_reason_present", rows.every((row) => hasValue(row.roleReason)), "Every role row has a roleReason.");
  push("evidence_strength_present", rows.every((row) => ["strong", "medium", "weak"].includes(row.evidenceStrength)), "Every role row has evidenceStrength.");
  push("downgraded_elite_has_caution", eliteDowngraded.every((row) => hasValue(row.caution)), `${eliteDowngraded.length} downgraded elite/high-prior rows have cautions.`);
  push("top_30_prior_not_all_downgraded", top30Downgraded.length < top30Prior.length, `${top30Downgraded.length}/${top30Prior.length} top-30 prior MD2 projected players were downgraded.`);
  push("elite_weak_evidence_not_destroyed", weakEliteDestroyed.length === 0, `${weakEliteDestroyed.length} elite/high-prior weak-evidence rows fell below 0.50 start probability.`);
  push("low_prior_zero_evidence_downgraded", lowPriorZeroMissing.length === 0 || lowPriorZeroMissingDowngraded.length / lowPriorZeroMissing.length >= 0.85, `${lowPriorZeroMissingDowngraded.length}/${lowPriorZeroMissing.length} low-prior zero/missing-evidence rows downgraded.`);
  push("positive_points_not_bench_depth", positiveBenchDepth.length === 0, `${positiveBenchDepth.length} positive MD1 point players marked bench_depth.`);
  push("not_selectable_not_starter_tiers", notSelectableStarter.length === 0, `${notSelectableStarter.length} not-selectable players have starter-like role tiers.`);
  push("role_tier_counts_plausible_by_position", Object.keys(countBy(rows, (row) => row.position)).length >= 4 && rows.some((row) => row.roleTier === "locked_starter") && rows.some((row) => row.roleTier === "bench_depth"), "Role tiers include starter and depth rows across positions.");

  return {
    schema_version: "player_role_model_qa_md2_v2",
    generated_at: GENERATED_AT,
    modelVersion: MODEL_VERSION,
    status: checks.every((check) => check.status === "pass") ? "pass" : "fail",
    summary: {
      active_official_player_count: officialRecords.length,
      role_rows: rows.length,
      role_tier_counts: countBy(rows, (row) => row.roleTier),
      role_tier_counts_by_position: Object.fromEntries([...groupBy(rows, (row) => row.position).entries()].map(([position, positionRows]) => [position, countBy(positionRows, (row) => row.roleTier)])),
      evidence_strength_counts: countBy(rows, (row) => row.evidenceStrength),
      md1_role_evidence_type_counts: countBy(rows, (row) => row.md1_role_evidence_type),
      explicit_starter_sub_not_in_squad_evidence_rows: rows.filter((row) => ["confirmed_started", "confirmed_sub", "confirmed_not_in_squad"].includes(row.md1_role_evidence_type)).length,
      points_only_evidence_rows: rows.filter((row) => ["played_points_evidence", "zero_or_missing_points_evidence"].includes(row.md1_role_evidence_type)).length,
      positive_points_only_evidence_rows: rows.filter((row) => row.md1_role_evidence_type === "played_points_evidence").length,
      zero_or_missing_points_evidence_rows: rows.filter((row) => row.md1_role_evidence_type === "zero_or_missing_points_evidence").length,
      elite_high_prior_players: rows.filter((row) => row.elite_high_prior).length,
      elite_high_prior_protected_from_over_downgrade: rows.filter((row) => row.protected_from_weak_md1_over_downgrade).length,
      not_selectable_forced_zero: notSelectableRows.length,
      average_start_probability: round(avg(rows.filter((row) => row.selectable_status === "playing").map((row) => row.md2StartProb)), 3),
      average_expected_minutes: round(avg(rows.filter((row) => row.selectable_status === "playing").map((row) => row.md2ExpectedMinutes)), 1)
    },
    checks,
    failures: checks.filter((check) => check.status === "fail")
  };
}

function markdownTable(headers, rows) {
  const clean = (value) => String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
  return [
    `| ${headers.map(clean).join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${headers.map((header) => clean(row[header])).join(" | ")} |`)
  ].join("\n");
}

function compactRowsForTable(rows, count = 20) {
  return rows.slice(0, count).map((row) => ({
    Player: row.name,
    Team: row.country,
    Pos: row.position,
    Opp: row.md2_fixture?.opponent || row.opponent || "",
    Tier: row.roleTier,
    Start: row.md2StartProb,
    Min: row.md2ExpectedMinutes,
    Prior: row.prior_md2_start_probability ?? row.prior_start ?? "",
    Delta: row.start_probability_delta ?? row.start_delta ?? "",
    Evidence: row.md1_role_evidence_type || row.evidence || "",
    Reason: row.roleReason
  }));
}

function buildQaReport(qa, watchlists) {
  return `# Player Role Model QA MD2 v2

Generated: ${qa.generated_at}

Status: **${qa.status}**

| Metric | Value |
| --- | --- |
| Active official players | ${qa.summary.active_official_player_count} |
| Role rows | ${qa.summary.role_rows} |
| Explicit starter/sub/not-in-squad evidence rows | ${qa.summary.explicit_starter_sub_not_in_squad_evidence_rows} |
| Points-only evidence rows | ${qa.summary.points_only_evidence_rows} |
| Elite/high-prior players protected from over-downgrade | ${qa.summary.elite_high_prior_protected_from_over_downgrade} |
| Not-selectable players forced to zero | ${qa.summary.not_selectable_forced_zero} |
| Average selectable start probability | ${qa.summary.average_start_probability} |
| Average selectable expected minutes | ${qa.summary.average_expected_minutes} |

## Role Tier Counts

${markdownTable(["Tier", "Rows"], sortedEntries(qa.summary.role_tier_counts).map(([Tier, Rows]) => ({ Tier, Rows })))}

## Evidence Strength Counts

${markdownTable(["Evidence", "Rows"], sortedEntries(qa.summary.evidence_strength_counts).map(([Evidence, Rows]) => ({ Evidence, Rows })))}

## MD1 Role Evidence Counts

${markdownTable(["Evidence", "Rows"], sortedEntries(qa.summary.md1_role_evidence_type_counts).map(([Evidence, Rows]) => ({ Evidence, Rows })))}

## Top 20 Safest MD2 Starters

${markdownTable(["Player", "Team", "Pos", "Opp", "Tier", "Start", "Min", "Prior", "Delta", "Evidence", "Reason"], compactRowsForTable(watchlists.top_40_safest_md2_starters, 20))}

## Top 20 Risky High-Upside Players

${markdownTable(["Player", "Team", "Pos", "Opp", "Tier", "Start", "Min", "Prior", "Delta", "Evidence", "Reason"], compactRowsForTable(watchlists.top_40_risky_high_upside_players, 20))}

## Checks

| Check | Status | Detail |
| --- | --- | --- |
${qa.checks.map((check) => `| ${check.id} | ${check.status} | ${String(check.detail).replace(/\|/g, "\\|")} |`).join("\n")}
`;
}

function buildModelReport(output, qa, watchlists) {
  return `# Player Role / Start / Minutes Model MD2 v2

Generated: ${output.generated_at}

## Purpose

This is an MD2 role/start/minutes sidecar model. It uses the active official fantasy player pool as the identity universe, preserves the current MD2 projection row as the prior when available, and applies completed MD1 player point/status evidence plus Score Model v4 context.

It does **not** rebuild player projections, recommendations, finance metrics, Team Builder weights, score predictions, PELE, teamQuality, or public browser outputs.

## Inputs

- \`${PATHS.officialStatusJs}\` for \`FANTASY_POOL_OFFICIAL_DATA_STATUS.official_position_records\`
- \`${PATHS.projectionsJs}\` for active fantasy-pool MD1/MD2 projection priors
- \`${PATHS.recommendationsJs}\` for high-prior recommendation tiers only
- \`${PATHS.financeJs}\` for preserved finance context only
- \`${PATHS.md1CalibrationDataset}\` and \`${PATHS.livePlayersJson}\` for completed MD1 point/status evidence
- \`${PATHS.scoreJson}\` and \`${PATHS.scoreJs}\` for Score Model v4 light team/fixture context

## Evidence Limits

- Direct MD1 start/sub/not-in-squad evidence rows: ${qa.summary.explicit_starter_sub_not_in_squad_evidence_rows}
- Positive MD1 point rows are participation evidence, not exact minutes or confirmed starts.
- Zero/missing MD1 points are weak role evidence and are not allowed to destroy elite/high-prior players by themselves.
- Ownership fields exist in the live feed but are not used as model signal.
- Final squads are not source-backed.

## Summary

| Metric | Value |
| --- | --- |
| Model version | ${MODEL_VERSION} |
| Active official players | ${qa.summary.active_official_player_count} |
| Role rows | ${qa.summary.role_rows} |
| QA status | ${qa.status} |
| Elite/high-prior protected from over-downgrade | ${qa.summary.elite_high_prior_protected_from_over_downgrade} |
| Not-selectable forced to zero | ${qa.summary.not_selectable_forced_zero} |

## Role Tiers

${markdownTable(["Tier", "Rows"], sortedEntries(qa.summary.role_tier_counts).map(([Tier, Rows]) => ({ Tier, Rows })))}

## Safest Starters

${markdownTable(["Player", "Team", "Pos", "Opp", "Tier", "Start", "Min", "Prior", "Delta", "Evidence", "Reason"], compactRowsForTable(watchlists.top_40_safest_md2_starters, 20))}

## Risky High-Upside Players

${markdownTable(["Player", "Team", "Pos", "Opp", "Tier", "Start", "Min", "Prior", "Delta", "Evidence", "Reason"], compactRowsForTable(watchlists.top_40_risky_high_upside_players, 20))}

## Safe-To-Proceed Note

This model is safe to feed the next component player projection model v4 step if QA passes. It should remain a sidecar until the next prompt explicitly rebuilds projections.
`;
}

async function main() {
  const [
    windowGlobals,
    scoreData,
    livePlayers,
    liveMatchday,
    md1Dataset,
    md1Postmortem,
    fantasyRules,
    activeDataFlowQa,
    projectionQa,
    recommendationQa,
    financeQa
  ] = await Promise.all([
    loadWindowGlobals([
      PATHS.officialStatusJs,
      PATHS.projectionsJs,
      PATHS.recommendationsJs,
      PATHS.financeJs,
      PATHS.scoreJs,
      PATHS.fantasyRulesJs
    ]),
    readJson(PATHS.scoreJson),
    readJson(PATHS.livePlayersJson),
    readJson(PATHS.liveMatchdayJson),
    readJson(PATHS.md1CalibrationDataset),
    readJson(PATHS.md1Postmortem),
    readJson(PATHS.fantasyRulesJson),
    readJson(PATHS.activeDataFlowQa),
    readJson(PATHS.projectionQa),
    readJson(PATHS.recommendationQa),
    readJson(PATHS.financeQa)
  ]);

  if (activeDataFlowQa.status !== "pass") throw new Error("Active MD2 data-flow QA must be pass before role model rebuild.");
  if (md1Dataset.qa?.status !== "pass" || md1Postmortem.status !== "pass") throw new Error("MD1 calibration/postmortem must pass before role model rebuild.");
  if (scoreData.modelVersion !== "score-v4-md2-pele-md1-calibrated") throw new Error("Score Model v4 is required for this role model.");

  const officialRecords = windowGlobals.FANTASY_POOL_OFFICIAL_DATA_STATUS?.official_position_records || [];
  const projectionRows = windowGlobals.FANTASY_POOL_PLAYER_MATCHDAY_PROJECTIONS || [];
  const recommendationRows = windowGlobals.FANTASY_POOL_RECOMMENDATION_CANDIDATES || [];
  const financeRows = windowGlobals.FANTASY_POOL_PLAYER_FINANCE_METRICS || [];
  const projectionById = projectionRowsById(projectionRows);
  const md1RowsById = indexBy(md1Dataset.player_rows || [], (row) => row.official_fantasy_player_id);
  const liveRowsById = indexBy(livePlayers.players || [], (row) => row.official_fantasy_player_id);
  const financeById = indexBy(financeRows, (row) => row.official_fantasy_player_id);
  const recommendationContext = makeRecommendationContext(recommendationRows);
  const scoreRowsByTeam = teamScoreRowsByMd2(scoreData);
  const thresholds = thresholdsForElite(
    officialRecords,
    projectionRows.filter((row) => row.matchday === "md2")
  );

  const roleRows = buildRoleRows({
    officialRecords,
    projectionById,
    md1RowsById,
    liveRowsById,
    recommendationContext,
    financeById,
    scoreRowsByTeam,
    thresholds
  });
  const watchlists = buildWatchlists(roleRows);
  const qa = buildQa({
    rows: roleRows,
    officialRecords,
    projectionRows,
    recommendationContext,
    financeRows
  });

  const output = {
    schema_version: "player_role_model_md2_v2",
    generated_at: GENERATED_AT,
    modelVersion: MODEL_VERSION,
    model_stage: "md2_role_sidecar_only",
    source_files: [
      PATHS.officialStatusJs,
      PATHS.projectionsJs,
      PATHS.recommendationsJs,
      PATHS.financeJs,
      PATHS.scoreJson,
      PATHS.scoreJs,
      PATHS.md1CalibrationDataset,
      PATHS.md1Postmortem,
      PATHS.livePlayersJson,
      PATHS.liveMatchdayJson,
      PATHS.activeDataFlowQa,
      PATHS.fantasyRulesJson,
      PATHS.fantasyRulesJs,
      PATHS.projectionQa,
      PATHS.recommendationQa,
      PATHS.financeQa
    ],
    input_status: {
      active_data_flow_status: activeDataFlowQa.status,
      md1_dataset_status: md1Dataset.qa?.status,
      md1_postmortem_status: md1Postmortem.status,
      live_player_status_generated_at: livePlayers.generated_at,
      live_matchday_completed_fixtures: liveMatchday.summary?.completed_fixture_count,
      score_model_version: scoreData.modelVersion,
      fantasy_rules_version: fantasyRules.rules_version,
      projection_qa_status: projectionQa.status || projectionQa.overall_status || null,
      recommendation_qa_status: recommendationQa.status || recommendationQa.overall_status || null,
      finance_qa_status: financeQa.status || financeQa.overall_status || null
    },
    model_rules: {
      identity_universe: "FANTASY_POOL_OFFICIAL_DATA_STATUS.official_position_records",
      primary_join_key: "official_fantasy_player_id",
      playersData_role: "supplemental_enrichment_only_not_used_as_identity",
      md1_actuals_scope: "completed_final_md1_fixtures_only",
      direct_start_sub_evidence_available: qa.summary.explicit_starter_sub_not_in_squad_evidence_rows,
      ownership_used_as_signal: false,
      final_squads_source_backed: false,
      public_browser_outputs_updated: false,
      score_predictions_rebuilt: false,
      player_projections_rebuilt: false,
      recommendations_rebuilt: false,
      finance_metrics_rebuilt: false,
      team_builder_weights_rebuilt: false
    },
    thresholds,
    summary: {
      ...qa.summary,
      selectable_rows: roleRows.filter((row) => row.selectable_status === "playing").length,
      non_selectable_rows: roleRows.filter((row) => row.selectable_status !== "playing").length,
      watchlist_counts: Object.fromEntries(Object.entries(watchlists).map(([key, rows]) => [key, rows.length]))
    },
    watchlists,
    playerRoleRows: roleRows
  };

  await writeJson(PATHS.outputJson, output);
  await writeJson(PATHS.outputQa, qa);
  await writeFile(PATHS.outputQaReport, buildQaReport(qa, watchlists), "utf8");
  await writeFile(PATHS.outputModelReport, buildModelReport(output, qa, watchlists), "utf8");

  console.log(JSON.stringify({
    status: qa.status,
    modelVersion: MODEL_VERSION,
    output: PATHS.outputJson,
    qa: PATHS.outputQa,
    activeOfficialPlayerCount: qa.summary.active_official_player_count,
    roleRows: qa.summary.role_rows,
    roleTierCounts: qa.summary.role_tier_counts,
    evidenceStrengthCounts: qa.summary.evidence_strength_counts,
    explicitStarterSubNotInSquadEvidenceRows: qa.summary.explicit_starter_sub_not_in_squad_evidence_rows,
    pointsOnlyEvidenceRows: qa.summary.points_only_evidence_rows,
    eliteHighPriorProtectedFromOverDowngrade: qa.summary.elite_high_prior_protected_from_over_downgrade,
    notSelectableForcedZero: qa.summary.not_selectable_forced_zero,
    failures: qa.failures
  }, null, 2));

  if (qa.status !== "pass") process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
