import fs from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const VERSION = "team_builder_optimizer_md3_v5";
const MATCHDAY_ID = "md3";
const DATA_FILES = [
  "playersData.js",
  "fantasyRulesData.js",
  "fantasyPoolRecommendationsData.js",
  "fantasyPoolMatchdayProjectionsData.js",
  "fantasyPoolFinanceMetricsData.js",
  "fantasyPoolScorePredictionsData.js",
  "fantasyPoolOfficialDataStatusData.js",
  "liveMatchdayStatusData.js",
  "livePlayerStatusData.js"
];
const STRATEGIES = [
  { id: "balancedSquad", label: "Balanced Squad" },
  { id: "diversifiedSquad", label: "Diversified Squad" },
  { id: "concentratedUpside", label: "Concentrated Upside" },
  { id: "starsAndScrubs", label: "Stars and Scrubs" },
  { id: "valueSquad", label: "Value Squad" }
];
const POSITION_ORDER = ["GK", "DEF", "MID", "FWD"];
const FORMATION = "4-3-3";
const FORMATION_REQUIREMENTS = { GK: 1, DEF: 4, MID: 3, FWD: 3 };
const ROLE_CONFIDENCE = { high: 1, medium: 0.78, low: 0.52, thin_profile: 0.42, missing: 0.35 };
const ROLE_TIER_SCORE = {
  locked_starter: 1,
  likely_starter: 0.9,
  managed_minutes_star: 0.82,
  possible_starter: 0.66,
  rotation_risk: 0.5,
  impact_sub: 0.42,
  bench_depth: 0.25,
  no_md1_evidence: 0.35,
  unavailable_or_not_selectable: 0
};

function projectPath(relativePath) {
  return path.join(root, relativePath);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(projectPath(relativePath), "utf8"));
}

function loadGlobals() {
  const context = { window: {} };
  vm.createContext(context);
  DATA_FILES.forEach((file) => {
    vm.runInContext(fs.readFileSync(projectPath(file), "utf8"), context, { filename: file });
  });
  return context.window;
}

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function rounded(value, digits = 3) {
  return Number(number(value).toFixed(digits));
}

function sum(rows, getter) {
  return rows.reduce((total, row) => total + number(getter(row)), 0);
}

function average(rows, getter) {
  return rows.length ? sum(rows, getter) / rows.length : 0;
}

function display(value, digits = 1) {
  return rounded(value, digits).toFixed(digits);
}

function fantasyId(record) {
  return String(record?.official_fantasy_player_id || record?.officialFantasyPlayerId || "").trim();
}

function statusIsSelectable(status) {
  return String(status || "playing").trim().toLowerCase() === "playing";
}

function countryKey(player) {
  return String(player.country || "needs_check").trim() || "needs_check";
}

function byFantasyId(rows) {
  const lookup = new Map();
  rows.forEach((row) => {
    const id = fantasyId(row);
    if (id && !lookup.has(id)) {
      lookup.set(id, row);
    }
  });
  return lookup;
}

function activeRecommendationLookup(rows) {
  const lookup = new Map();
  rows
    .filter((row) => row.matchday === MATCHDAY_ID || row.matchday === "group_stage_full")
    .forEach((row) => {
      const id = fantasyId(row);
      if (!id) return;
      const list = lookup.get(id) || [];
      list.push(row);
      lookup.set(id, list);
    });
  return lookup;
}

function bestRecommendation(recommendations = [], preferredMode = "balanced") {
  const matchdayRank = { md3: 0, group_stage_full: 1 };
  const modeRank = {
    [preferredMode]: 0,
    balanced: 1,
    captain: 2,
    safe: 3,
    upside: 4,
    differential: 5
  };

  return [...recommendations].sort((a, b) =>
    (matchdayRank[a.matchday] ?? 9) - (matchdayRank[b.matchday] ?? 9) ||
    (modeRank[a.mode] ?? 8) - (modeRank[b.mode] ?? 8) ||
    number(a.rank, 999) - number(b.rank, 999)
  )[0] || null;
}

function roleStrength(role) {
  const tier = ROLE_TIER_SCORE[role?.roleTier] ?? 0.45;
  const confidence = ROLE_CONFIDENCE[role?.roleConfidence] ?? 0.6;
  return tier * confidence;
}

function playerFromOfficialRecord(record, lookups) {
  const id = fantasyId(record);
  const projection = lookups.projectionById.get(id);
  const role = lookups.roleById.get(id) || null;
  const finance = lookups.financeById.get(id) || null;
  const recommendations = lookups.recommendationById.get(id) || [];

  if (!id || !projection) {
    return null;
  }

  const position = record.official_fantasy_position || projection.official_fantasy_position;
  const startProbability = number(role?.md3StartProb, number(projection.start_probability));
  const expectedMinutes = number(role?.md3ExpectedMinutes, number(projection.expected_minutes));
  const projectedPoints = number(projection.raw_expected_points);
  const riskAdjustedPoints = number(projection.risk_adjusted_points, projectedPoints);
  const ceilingPoints = number(projection.ceiling_points, projectedPoints);
  const floorPoints = number(projection.floor_points);
  const captainScore = number(projection.captain_score);
  const price = number(record.official_price, number(projection.official_price));
  const priceEfficiency = price > 0 ? riskAdjustedPoints / price : 0;

  return {
    id,
    officialFantasyPlayerId: id,
    internalPlayerId: record.internal_player_id || projection.internal_player_id || null,
    name: record.name || projection.name || "Player needs check",
    country: record.country || projection.country || "needs_check",
    teamId: record.team_id || projection.official_team_id || null,
    position,
    price,
    selectableStatus: record.selectable_status || projection.selectable_status || "playing",
    projectedPoints,
    riskAdjustedPoints,
    ceilingPoints,
    floorPoints,
    captainScore,
    startProbability,
    expectedMinutes,
    roleTier: role?.roleTier || projection.minutes_context?.role_label || projection.role_label || "missing",
    roleConfidence: role?.roleConfidence || projection.minutes_context?.role_confidence || projection.role_confidence || "missing",
    roleStrength: roleStrength(role),
    opponent: projection.opponent || projection.fixture_context?.opponent || "Opponent needs check",
    fixtureId: projection.fixture_id || projection.fixture_context?.fixture_id || null,
    fixtureDifficulty: number(projection.fixture_context?.fixture_difficulty_score, number(projection.fixture_difficulty_score)),
    teamExpectedGoals: number(projection.fixture_context?.expected_goals, number(projection.team_expected_goals)),
    cleanSheetProbability: number(projection.fixture_context?.clean_sheet_probability, number(projection.team_clean_sheet_probability)),
    recommendation: bestRecommendation(recommendations),
    recommendationModes: recommendations.map((entry) => `${entry.matchday}:${entry.mode}`),
    financeValue: number(finance?.risk_adjusted_points_per_price, priceEfficiency),
    valueOverReplacement: number(finance?.value_over_replacement),
    dataQualityFlags: [
      ...(Array.isArray(projection.data_quality_flags) ? projection.data_quality_flags : []),
      ...(Array.isArray(role?.dataQualityFlags) ? role.dataQualityFlags : []),
      ...(Array.isArray(finance?.data_quality_flags) ? finance.data_quality_flags : [])
    ]
  };
}

function countryCounts(players) {
  return players.reduce((counts, player) => {
    const key = countryKey(player);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function positionCounts(players) {
  return players.reduce((counts, player) => {
    counts[player.position] = (counts[player.position] || 0) + 1;
    return counts;
  }, {});
}

function strategyScore(player, strategyId, role = "starter") {
  const start = player.startProbability * 100;
  const minutes = player.expectedMinutes;
  const roleLift = player.roleStrength * 12;
  const reliability = start * 0.16 + minutes * 0.08 + roleLift;
  const value = player.financeValue * 18 + Math.max(0, player.valueOverReplacement) * 0.7;
  const attackingContext = ["MID", "FWD"].includes(player.position)
    ? Math.max(0, player.teamExpectedGoals - 1.25) * 8
    : Math.max(0, player.cleanSheetProbability - 0.32) * 16;
  const weakStarterPenalty = role === "starter"
    ? Math.max(0, 0.68 - player.startProbability) * 32 + Math.max(0, 62 - minutes) * 0.22
    : Math.max(0, 0.45 - player.startProbability) * 14 + Math.max(0, 35 - minutes) * 0.1;
  const cheapLowProjectionPenalty = player.price <= 6.5 && player.projectedPoints < (role === "starter" ? 4.8 : 3.4)
    ? role === "starter" ? 9 : 3.5
    : 0;

  const base = {
    balancedSquad:
      player.projectedPoints * 13 +
      player.riskAdjustedPoints * 5.5 +
      player.ceilingPoints * 0.9 +
      player.captainScore * (role === "starter" ? 0.7 : 0.1) +
      reliability +
      value * 0.2 +
      attackingContext * 0.4 +
      Math.max(0, player.projectedPoints - 5.8) * (player.price >= 9 ? 2.5 : 0.6) -
      player.price * (role === "starter" ? 0.25 : 1.15),
    diversifiedSquad:
      player.projectedPoints * 9 +
      player.riskAdjustedPoints * 7 +
      player.floorPoints * 2 +
      player.captainScore * (role === "starter" ? 0.35 : 0.05) +
      reliability * 1.4 +
      value * 0.25 -
      player.price * 0.65,
    concentratedUpside:
      player.projectedPoints * 10.5 +
      player.riskAdjustedPoints * 2.2 +
      player.ceilingPoints * 4.2 +
      player.captainScore * (role === "starter" ? 0.9 : 0.12) +
      reliability * 0.6 +
      attackingContext * 1.2 +
      Math.max(0, player.projectedPoints - 5.5) * (player.price >= 8.5 ? 2.2 : 0.6) -
      player.price * 0.12,
    starsAndScrubs:
      player.projectedPoints * 14 +
      player.riskAdjustedPoints * 2 +
      player.ceilingPoints * 2 +
      player.captainScore * (role === "starter" ? 1.05 : 0.08) +
      reliability * 0.45 +
      Math.max(0, player.price - 8.5) * 6 +
      Math.max(0, player.projectedPoints - 5.8) * 5 -
      (role === "bench" ? player.price * 3.5 : 0),
    valueSquad:
      player.projectedPoints * 7 +
      player.riskAdjustedPoints * 5 +
      player.floorPoints * 1.2 +
      player.captainScore * (role === "starter" ? 0.25 : 0.04) +
      reliability +
      value * 1.8 -
      player.price * 1.8
  }[strategyId] ?? 0;

  return base - weakStarterPenalty - cheapLowProjectionPenalty;
}

function canAddPlayer(player, state, rules) {
  if (state.ids.has(player.id)) return false;
  if ((state.positionCounts[player.position] || 0) >= rules.squad.positions[player.position]) return false;
  if ((state.countryCounts[countryKey(player)] || 0) >= rules.countryLimit) return false;
  if (state.cost + player.price > rules.budget + 0.001) return false;
  return statusIsSelectable(player.selectableStatus);
}

function addPlayer(player, state, strategyId) {
  const next = {
    players: [...state.players, player],
    ids: new Set(state.ids),
    positionCounts: { ...state.positionCounts },
    countryCounts: { ...state.countryCounts },
    cost: state.cost + player.price,
    partialScore: state.partialScore + strategyScore(player, strategyId, "starter")
  };

  next.ids.add(player.id);
  next.positionCounts[player.position] = (next.positionCounts[player.position] || 0) + 1;
  next.countryCounts[countryKey(player)] = (next.countryCounts[countryKey(player)] || 0) + 1;
  return next;
}

function slotOrder(rules) {
  return POSITION_ORDER
    .sort((a, b) => rules.squad.positions[a] - rules.squad.positions[b])
    .flatMap((position) => Array.from({ length: rules.squad.positions[position] }, () => position));
}

function cheapestRemainingCost(state, rules, priceFloors) {
  let total = 0;
  POSITION_ORDER.forEach((position) => {
    const needed = Math.max(0, rules.squad.positions[position] - (state.positionCounts[position] || 0));
    const floors = priceFloors[position] || [];
    if (floors.length < needed) {
      total = Infinity;
      return;
    }
    total += floors.slice(0, needed).reduce((subtotal, price) => subtotal + price, 0);
  });
  return total;
}

function candidatePools(players, strategyId) {
  return POSITION_ORDER.reduce((pools, position) => {
    const positional = players.filter((player) => player.position === position);
    const byStrategy = [...positional].sort((a, b) =>
      strategyScore(b, strategyId, "starter") - strategyScore(a, strategyId, "starter")
    );
    const byProjected = [...positional].sort((a, b) =>
      b.projectedPoints - a.projectedPoints || b.captainScore - a.captainScore
    );
    const byCaptain = [...positional].sort((a, b) =>
      b.captainScore - a.captainScore || b.projectedPoints - a.projectedPoints
    );
    const byValue = [...positional].sort((a, b) =>
      b.financeValue - a.financeValue || b.projectedPoints - a.projectedPoints
    );
    const byRole = [...positional].sort((a, b) =>
      b.startProbability - a.startProbability || b.expectedMinutes - a.expectedMinutes
    );
    const byBench = [...positional].sort((a, b) =>
      strategyScore(b, strategyId, "bench") - strategyScore(a, strategyId, "bench")
    );
    const seen = new Set();
    pools[position] = [byStrategy, byProjected, byCaptain, byValue, byRole, byBench]
      .flatMap((list) => list.slice(0, 95))
      .filter((player) => {
        if (seen.has(player.id)) return false;
        seen.add(player.id);
        return true;
      });
    return pools;
  }, {});
}

function chooseStarters(squad, strategyId, formationRequirements = FORMATION_REQUIREMENTS) {
  const starters = [];
  const starterIds = new Set();
  POSITION_ORDER.forEach((position) => {
    const positionStarters = squad
      .filter((player) => player.position === position)
      .sort((a, b) => strategyScore(b, strategyId, "starter") - strategyScore(a, strategyId, "starter"))
      .slice(0, formationRequirements[position]);
    positionStarters.forEach((player) => {
      starters.push(player);
      starterIds.add(player.id);
    });
  });
  return {
    starters,
    bench: squad.filter((player) => !starterIds.has(player.id))
  };
}

function squadScore(squad, strategyId) {
  const { starters, bench } = chooseStarters(squad, strategyId);
  const captain = captainChoice(starters);
  const viceCaptain = viceCaptainChoice(starters, captain);
  const starterScore = sum(starters, (player) => strategyScore(player, strategyId, "starter"));
  const benchScore = sum(bench, (player) => strategyScore(player, strategyId, "bench"));
  const budgetUsed = sum(squad, (player) => player.price);
  const topThreeProjected = [...starters]
    .sort((a, b) => b.projectedPoints - a.projectedPoints)
    .slice(0, 3);
  const topThreeProjectedTotal = sum(topThreeProjected, (player) => player.projectedPoints);
  const startAverage = average(starters, (player) => player.startProbability * 100);
  const benchWeakCount = bench.filter((player) => player.startProbability < 0.45 || player.expectedMinutes < 35).length;
  const premiumCount = squad.filter((player) => player.price >= 9).length;
  const budgetUseReward = Math.max(0, budgetUsed - 92) * (strategyId === "starsAndScrubs" ? 1.2 : 0.5);
  const projectionReward = sum(starters, (player) => player.projectedPoints) * 6;
  const captainReward = (captain?.captainScore || 0) * (strategyId === "starsAndScrubs" ? 2.3 : 1.5);
  const premiumReward = premiumCount * (strategyId === "starsAndScrubs" ? 7 : strategyId === "balancedSquad" ? 2 : -1);
  const benchPenalty = benchWeakCount * (strategyId === "starsAndScrubs" ? 1.2 : 4.5);
  const starDependencePenalty = strategyId === "diversifiedSquad"
    ? Math.max(0, topThreeProjectedTotal / Math.max(1, sum(starters, (player) => player.projectedPoints)) - 0.38) * 80
    : 0;
  return {
    score: starterScore + benchScore * 0.35 + projectionReward + captainReward + premiumReward + budgetUseReward - benchPenalty - starDependencePenalty + startAverage * 0.4,
    starters,
    bench,
    captain,
    viceCaptain
  };
}

function buildSquad(players, rules, strategyId, options = {}) {
  const pools = candidatePools(players, strategyId);
  const floors = POSITION_ORDER.reduce((acc, position) => {
    acc[position] = players
      .filter((player) => player.position === position)
      .map((player) => player.price)
      .sort((a, b) => a - b);
    return acc;
  }, {});
  const limit = options.limit || (strategyId === "balancedSquad" ? 900 : 720);
  let states = [{
    players: [],
    ids: new Set(),
    positionCounts: {},
    countryCounts: {},
    cost: 0,
    partialScore: 0
  }];

  for (const position of slotOrder(rules)) {
    const nextStates = [];
    states.forEach((state) => {
      pools[position].forEach((player) => {
        if (!canAddPlayer(player, state, rules)) return;
        const next = addPlayer(player, state, strategyId);
        const cheapest = cheapestRemainingCost(next, rules, floors);
        if (!Number.isFinite(cheapest) || next.cost + cheapest > rules.budget + 0.001) return;
        nextStates.push(next);
      });
    });

    const seen = new Set();
    states = nextStates
      .sort((a, b) => b.partialScore - a.partialScore || b.cost - a.cost)
      .filter((state) => {
        const key = [...state.ids].sort().join("|");
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, limit);

    if (!states.length) {
      break;
    }
  }

  const fullStates = states.filter((state) =>
    state.players.length === rules.totalPlayers &&
    state.cost <= rules.budget + 0.001 &&
    POSITION_ORDER.every((position) => state.positionCounts[position] === rules.squad.positions[position]) &&
    Object.values(state.countryCounts).every((count) => count <= rules.countryLimit)
  );
  const ranked = fullStates
    .map((state) => ({ ...state, final: squadScore(state.players, strategyId) }))
    .sort((a, b) => b.final.score - a.final.score);

  if (!ranked.length) {
    throw new Error(`No legal squad found for ${strategyId}.`);
  }

  return ranked[0];
}

function buildGreedyBaseline(players, rules) {
  const strategyId = "balancedSquad";
  const greedyPool = POSITION_ORDER.reduce((pools, position) => {
    pools[position] = players
      .filter((player) => player.position === position)
      .sort((a, b) => b.projectedPoints - a.projectedPoints || b.startProbability - a.startProbability)
      .slice(0, 220);
    return pools;
  }, {});
  const floors = POSITION_ORDER.reduce((acc, position) => {
    acc[position] = players
      .filter((player) => player.position === position)
      .map((player) => player.price)
      .sort((a, b) => a - b);
    return acc;
  }, {});
  let states = [{
    players: [],
    ids: new Set(),
    positionCounts: {},
    countryCounts: {},
    cost: 0,
    partialScore: 0
  }];

  for (const position of slotOrder(rules)) {
    const nextStates = [];
    states.forEach((state) => {
      greedyPool[position].forEach((player) => {
        if (!canAddPlayer(player, state, rules)) return;
        const next = addPlayer(player, state, strategyId);
        const cheapest = cheapestRemainingCost(next, rules, floors);
        if (!Number.isFinite(cheapest) || next.cost + cheapest > rules.budget + 0.001) return;
        next.partialScore = sum(next.players, (entry) => entry.projectedPoints * 100 - entry.price * 3 + entry.startProbability * 10);
        nextStates.push(next);
      });
    });
    states = nextStates
      .sort((a, b) => b.partialScore - a.partialScore || a.cost - b.cost)
      .slice(0, 900);
  }

  const fullStates = states
    .filter((state) =>
      state.players.length === rules.totalPlayers &&
      state.cost <= rules.budget + 0.001 &&
      POSITION_ORDER.every((position) => state.positionCounts[position] === rules.squad.positions[position]) &&
      Object.values(state.countryCounts).every((count) => count <= rules.countryLimit)
    )
    .map((state) => ({ ...state, final: squadScore(state.players, strategyId) }))
    .sort((a, b) =>
      sum(b.final.starters, (player) => player.projectedPoints) - sum(a.final.starters, (player) => player.projectedPoints)
    );

  if (!fullStates.length) {
    throw new Error("No legal greedy baseline found.");
  }

  return fullStates[0];
}

function captainChoice(starters) {
  return [...starters]
    .filter((player) => player.position !== "GK")
    .sort((a, b) => b.captainScore - a.captainScore || b.projectedPoints - a.projectedPoints)[0] || null;
}

function viceCaptainChoice(starters, captain) {
  return [...starters]
    .filter((player) => player.position !== "GK" && player.id !== captain?.id)
    .sort((a, b) => b.captainScore - a.captainScore || b.projectedPoints - a.projectedPoints)[0] || null;
}

function topPlayerUniverse(players) {
  return [...players]
    .filter((player) => player.startProbability >= 0.5 && player.expectedMinutes >= 40)
    .sort((a, b) =>
      b.captainScore + b.projectedPoints * 1.8 + b.riskAdjustedPoints - (a.captainScore + a.projectedPoints * 1.8 + a.riskAdjustedPoints)
    )
    .slice(0, 24);
}

function omittedStarReasons(stars, squad) {
  const squadIds = new Set(squad.map((player) => player.id));
  const counts = positionCounts(squad);
  const countries = countryCounts(squad);
  return stars
    .filter((player) => !squadIds.has(player.id))
    .slice(0, 10)
    .map((player) => {
      const reasons = [];
      if ((counts[player.position] || 0) >= { GK: 2, DEF: 5, MID: 5, FWD: 3 }[player.position]) {
        reasons.push("position quota");
      }
      if ((countries[countryKey(player)] || 0) >= 3) {
        reasons.push("country limit");
      }
      if (sum(squad, (entry) => entry.price) + player.price > 100) {
        reasons.push("budget");
      }
      if (player.startProbability < 0.65 || player.expectedMinutes < 55) {
        reasons.push("role/minutes risk");
      }
      if (!reasons.length) {
        reasons.push("strategy tradeoff after constraints");
      }
      return {
        id: player.id,
        name: player.name,
        country: player.country,
        position: player.position,
        price: player.price,
        projectedPoints: rounded(player.projectedPoints),
        captainScore: rounded(player.captainScore),
        reason: reasons.join(", ")
      };
    });
}

function squadDiagnostics(state, strategy, stars, rules) {
  const squad = state.players;
  const { starters, bench, captain, viceCaptain } = state.final;
  const squadIds = new Set(squad.map((player) => player.id));
  const starterIds = new Set(starters.map((player) => player.id));
  const riskyPlayers = squad.filter((player) =>
    player.startProbability < 0.55 ||
    player.expectedMinutes < 45 ||
    ["rotation_risk", "impact_sub", "bench_depth", "no_md1_evidence"].includes(player.roleTier)
  );
  const weakStarters = starters.filter((player) =>
    player.projectedPoints < 4 ||
    player.startProbability < 0.6 ||
    player.expectedMinutes < 50
  );
  const cheapLowProjectionStarters = starters.filter((player) =>
    player.price <= 5 && player.projectedPoints < 4.5
  );
  const topStarOverlap = stars.filter((player) => squadIds.has(player.id)).length;
  const legal = {
    squadSize: squad.length === rules.totalPlayers,
    starterSize: starters.length === rules.starterTotal,
    budget: sum(squad, (player) => player.price) <= rules.budget + 0.001,
    positions: POSITION_ORDER.every((position) => positionCounts(squad)[position] === rules.squad.positions[position]),
    formation: POSITION_ORDER.every((position) => positionCounts(starters)[position] === FORMATION_REQUIREMENTS[position]),
    countryLimit: Object.values(countryCounts(squad)).every((count) => count <= rules.countryLimit),
    selectable: squad.every((player) => statusIsSelectable(player.selectableStatus)),
    activeOfficialIds: squad.every((player) => player.officialFantasyPlayerId),
    projectionRows: squad.every((player) => number(player.projectedPoints, null) !== null),
    roleRows: squad.every((player) => player.roleTier && player.roleTier !== "missing")
  };

  return {
    strategyId: strategy.id,
    strategyLabel: strategy.label,
    formation: FORMATION,
    legal,
    status: Object.values(legal).every(Boolean) ? "pass" : "fail",
    budgetUsed: rounded(sum(squad, (player) => player.price), 1),
    budgetLeft: rounded(rules.budget - sum(squad, (player) => player.price), 1),
    starterProjectedPoints: rounded(sum(starters, (player) => player.projectedPoints), 3),
    squadProjectedPoints: rounded(sum(squad, (player) => player.projectedPoints), 3),
    starterRiskAdjustedPoints: rounded(sum(starters, (player) => player.riskAdjustedPoints), 3),
    startAveragePercent: rounded(average(starters, (player) => player.startProbability * 100), 1),
    expectedMinutesAverage: rounded(average(starters, (player) => player.expectedMinutes), 1),
    captain: captain ? playerSummary(captain) : null,
    viceCaptain: viceCaptain ? playerSummary(viceCaptain) : null,
    riskyCount: riskyPlayers.length,
    weakStarterCount: weakStarters.length,
    cheapLowProjectionStarterCount: cheapLowProjectionStarters.length,
    topStarOverlap,
    starters: starters.map((player) => playerSummary(player, starterIds)),
    bench: bench.map((player) => playerSummary(player, starterIds)),
    omittedStars: omittedStarReasons(stars, squad)
  };
}

function playerSummary(player, starterIds = null) {
  return {
    id: player.id,
    name: player.name,
    country: player.country,
    position: player.position,
    price: rounded(player.price, 1),
    projectedPoints: rounded(player.projectedPoints, 3),
    riskAdjustedPoints: rounded(player.riskAdjustedPoints, 3),
    captainScore: rounded(player.captainScore, 3),
    startProbability: rounded(player.startProbability, 3),
    expectedMinutes: rounded(player.expectedMinutes, 1),
    roleTier: player.roleTier,
    roleConfidence: player.roleConfidence,
    opponent: player.opponent,
    selectedRole: starterIds ? (starterIds.has(player.id) ? "starter" : "bench") : undefined
  };
}

function strategyOverlap(strategyReports) {
  const overlaps = [];
  for (let i = 0; i < strategyReports.length; i += 1) {
    for (let j = i + 1; j < strategyReports.length; j += 1) {
      const a = strategyReports[i];
      const b = strategyReports[j];
      const aIds = new Set([...a.starters, ...a.bench].map((player) => player.id));
      const bIds = new Set([...b.starters, ...b.bench].map((player) => player.id));
      const shared = [...aIds].filter((id) => bIds.has(id));
      overlaps.push({
        strategyA: a.strategyLabel,
        strategyB: b.strategyLabel,
        sharedPlayers: shared.length,
        overlapShare: rounded(shared.length / 15, 3)
      });
    }
  }
  return overlaps;
}

function addCheck(report, id, status, detail = {}) {
  report.checks.push({ id, status, detail });
  if (status === "fail") {
    report.failures.push({ id, detail });
  } else if (status === "warn") {
    report.warnings.push({ id, detail });
  }
}

function validateReports(report, strategyReports, baseline, players) {
  const balanced = strategyReports.find((entry) => entry.strategyId === "balancedSquad");
  const baselineStarterProjected = sum(baseline.final.starters, (player) => player.projectedPoints);
  const gap = balanced.starterProjectedPoints - baselineStarterProjected;

  addCheck(report, "active-official-universe", players.length > 0 ? "pass" : "fail", {
    source: "FANTASY_POOL_OFFICIAL_DATA_STATUS.official_position_records",
    activePlayerRows: players.length
  });
  addCheck(report, "all-strategies-legal", strategyReports.every((entry) => entry.status === "pass") ? "pass" : "fail", {
    statuses: strategyReports.map((entry) => ({ strategy: entry.strategyLabel, status: entry.status, legal: entry.legal }))
  });
  addCheck(report, "balanced-projection-gap", gap >= -4.5 ? "pass" : "fail", {
    balancedStarterProjected: balanced.starterProjectedPoints,
    greedyBaselineStarterProjected: rounded(baselineStarterProjected, 3),
    gap: rounded(gap, 3)
  });
  addCheck(report, "balanced-captain-quality", balanced.captain?.captainScore >= 21 && balanced.captain?.projectedPoints >= 7.2 ? "pass" : "fail", {
    captain: balanced.captain
  });
  addCheck(report, "balanced-start-security", balanced.startAveragePercent >= 70 && balanced.riskyCount <= 5 ? "pass" : "warn", {
    startAveragePercent: balanced.startAveragePercent,
    riskyCount: balanced.riskyCount
  });
  addCheck(report, "balanced-not-cheap-value-dominated", balanced.cheapLowProjectionStarterCount <= 1 && balanced.budgetUsed >= 88 ? "pass" : "fail", {
    cheapLowProjectionStarterCount: balanced.cheapLowProjectionStarterCount,
    budgetUsed: balanced.budgetUsed
  });
  addCheck(report, "elite-player-access", balanced.topStarOverlap >= 5 ? "pass" : "warn", {
    topStarOverlap: balanced.topStarOverlap,
    omittedStars: balanced.omittedStars.slice(0, 5)
  });
}

function markdownReport(report) {
  const balanced = report.strategies.find((entry) => entry.strategyId === "balancedSquad");
  const strategyRows = report.strategies
    .map((entry) => `| ${entry.strategyLabel} | ${display(entry.starterProjectedPoints)} | ${display(entry.squadProjectedPoints)} | ${display(entry.budgetUsed)} | ${display(entry.budgetLeft)} | ${entry.captain?.name || "N/A"} | ${entry.riskyCount} | ${entry.topStarOverlap} |`)
    .join("\n");
  const balancedRows = [...balanced.starters, ...balanced.bench]
    .map((player) => `| ${player.selectedRole} | ${player.position} | ${player.name} | ${player.country} | ${display(player.price)} | ${display(player.projectedPoints)} | ${display(player.startProbability * 100)}% | ${display(player.expectedMinutes)} | ${player.roleTier} | ${player.opponent} |`)
    .join("\n");
  const omittedRows = balanced.omittedStars
    .map((player) => `| ${player.name} | ${player.country} | ${player.position} | ${display(player.price)} | ${display(player.projectedPoints)} | ${display(player.captainScore)} | ${player.reason} |`)
    .join("\n");
  const checkRows = report.checks
    .map((check) => `| ${check.id} | ${check.status} | ${JSON.stringify(check.detail)} |`)
    .join("\n");

  return `# Team Builder Optimizer MD3 v5 QA

Generated: ${report.generatedAt}

Final status: **${report.status.toUpperCase()}**

## Strategy Comparison

| Strategy | Starter MD3 pts | Squad MD3 pts | Budget used | Budget left | Captain | Risky count | Top-star overlap |
|---|---:|---:|---:|---:|---|---:|---:|
${strategyRows}

Greedy baseline starter MD3 points: **${display(report.greedyBaseline.starterProjectedPoints)}**.
Balanced gap vs greedy baseline: **${display(report.greedyBaseline.balancedGap)}**.

## Balanced Squad

Captain: **${balanced.captain?.name || "N/A"}**. Vice-captain: **${balanced.viceCaptain?.name || "N/A"}**.

| Role | Pos | Player | Country | Price | MD3 pts | Start | Minutes | Role tier | Opponent |
|---|---|---|---|---:|---:|---:|---:|---|---|
${balancedRows}

## Omitted Stars

| Player | Country | Pos | Price | MD3 pts | Captain score | Reason |
|---|---|---|---:|---:|---:|---|
${omittedRows}

## Checks

| Check | Status | Detail |
|---|---|---|
${checkRows}
`;
}

function modelReport(report) {
  const balanced = report.strategies.find((entry) => entry.strategyId === "balancedSquad");
  return `# Team Builder Model MD3 v5

Generated: ${report.generatedAt}

Version: \`${report.version}\`

Default matchday: **MD3**

The MD3 Team Builder keeps the MD2 v4 optimizer philosophy and rebuilds legal squads from the active official fantasy pool, Projection Model v5, Role Model v3, Score Model v5, official rules, and finance metrics as secondary context.

| Field | Value |
| --- | --- |
| Optimizer candidates | ${report.summary.optimizerCandidateRows} |
| Budget | ${report.summary.budget} |
| Country limit | ${report.summary.countryLimit} |
| Formation | ${report.summary.formation} |
| Balanced captain | ${balanced?.captain?.name || "N/A"} |
| Balanced starter MD3 points | ${balanced?.starterProjectedPoints || "N/A"} |
`;
}

async function main() {
  const globals = loadGlobals();
  const roleModel = readJson("data/playerRoleModel_md3_v3.json");
  const rulesData = globals.FANTASY_RULES_DATA;
  const rules = {
    totalPlayers: number(rulesData?.squad?.total_players),
    starterTotal: number(rulesData?.starting_lineup?.total_players),
    budget: number(rulesData?.budget?.initial_budget),
    countryLimit: number(rulesData?.country_limits?.group_stage_max_per_country),
    squad: {
      positions: rulesData?.squad?.positions || {}
    }
  };
  const officialRows = globals.FANTASY_POOL_OFFICIAL_DATA_STATUS?.official_position_records || [];
  const projections = (globals.FANTASY_POOL_PLAYER_MATCHDAY_PROJECTIONS || [])
    .filter((row) => row.matchday === MATCHDAY_ID);
  const financeRows = globals.FANTASY_POOL_PLAYER_FINANCE_METRICS || [];
  const recommendationRows = globals.FANTASY_POOL_RECOMMENDATION_CANDIDATES || [];
  const lookups = {
    projectionById: byFantasyId(projections),
    roleById: byFantasyId(roleModel.playerRoleRows || []),
    financeById: byFantasyId(financeRows),
    recommendationById: activeRecommendationLookup(recommendationRows)
  };
  const players = officialRows
    .filter((row) => statusIsSelectable(row.selectable_status))
    .map((row) => playerFromOfficialRecord(row, lookups))
    .filter(Boolean)
    .filter((player, index, list) => list.findIndex((candidate) => candidate.id === player.id) === index);

  const report = {
    schemaVersion: "team_builder_qa_md3_v5",
    generatedAt: new Date().toISOString(),
    version: VERSION,
    matchday: MATCHDAY_ID,
    activeIdentitySource: "FANTASY_POOL_OFFICIAL_DATA_STATUS.official_position_records",
    primaryJoinKey: "official_fantasy_player_id",
    modelInputs: {
      projections: "fantasyPoolMatchdayProjectionsData.js / data/fantasyPoolMatchdayProjections_md3_v5.json",
      roleModel: "data/playerRoleModel_md3_v3.json",
      recommendations: "fantasyPoolRecommendationsData.js",
      scorePredictions: "fantasyPoolScorePredictionsData.js",
      rules: "fantasyRulesData.js",
      finance: "fantasyPoolFinanceMetricsData.js"
    },
    summary: {
      officialRows: officialRows.length,
      selectableOfficialRows: officialRows.filter((row) => statusIsSelectable(row.selectable_status)).length,
      md3ProjectionRows: projections.length,
      roleRows: (roleModel.playerRoleRows || []).length,
      optimizerCandidateRows: players.length,
      budget: rules.budget,
      countryLimit: rules.countryLimit,
      squadRequirements: rules.squad.positions,
      formation: FORMATION,
      formationRequirements: FORMATION_REQUIREMENTS
    },
    checks: [],
    warnings: [],
    failures: [],
    strategies: [],
    greedyBaseline: {},
    strategyOverlap: [],
    status: "pending"
  };

  const stars = topPlayerUniverse(players);
  const builtStrategies = STRATEGIES.map((strategy) => {
    const state = buildSquad(players, rules, strategy.id);
    return squadDiagnostics(state, strategy, stars, rules);
  });
  const baseline = buildGreedyBaseline(players, rules);
  const baselineStarterProjected = sum(baseline.final.starters, (player) => player.projectedPoints);
  const balancedStarterProjected = builtStrategies.find((entry) => entry.strategyId === "balancedSquad")?.starterProjectedPoints || 0;

  report.strategies = builtStrategies;
  report.greedyBaseline = {
    starterProjectedPoints: rounded(baselineStarterProjected, 3),
    squadProjectedPoints: rounded(sum(baseline.players, (player) => player.projectedPoints), 3),
    budgetUsed: rounded(sum(baseline.players, (player) => player.price), 1),
    captain: baseline.final.captain ? playerSummary(baseline.final.captain) : null,
    balancedGap: rounded(balancedStarterProjected - baselineStarterProjected, 3)
  };
  report.strategyOverlap = strategyOverlap(builtStrategies);
  validateReports(report, builtStrategies, baseline, players);
  report.status = report.failures.length ? "fail" : report.warnings.length ? "pass_with_warnings" : "pass";

  await writeFile(projectPath("data/teamBuilderQa_md3_v5.json"), `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(projectPath("data/teamBuilderQaReport_md3_v5.md"), markdownReport(report));
  await writeFile(projectPath("data/teamBuilderModel_md3_v5.md"), modelReport(report));

  if (report.failures.length) {
    console.error(`Team Builder MD3 v5 QA failed: ${report.failures.map((failure) => failure.id).join(", ")}`);
    process.exitCode = 1;
    return;
  }

  console.log(`Team Builder MD3 v5 QA ${report.status}. Balanced starter MD3 points ${display(balancedStarterProjected)}; gap vs greedy ${display(report.greedyBaseline.balancedGap)}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
