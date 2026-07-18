export const TEAM_BUILDER_PUBLIC_ARTIFACT_SCHEMA = "team_builder_final_round_artifact_v1";

export const TEAM_BUILDER_PUBLIC_STAGE_LABELS = {
  finalRound: "Final Round",
  third_place: "Third Place",
  final: "Final"
};

export const TEAM_BUILDER_PUBLIC_OBJECTIVE_COMPONENT_LABELS = {
  raw_projected_points: "Raw projected points",
  optionality_score: "Optionality",
  composite_score: "Composite",
  third_place_players: "Third Place players",
  final_players: "Final players"
};

export const TEAM_BUILDER_STRATEGY_OPTION_KEYS = [
  "balancedSquad",
  "diversifiedSquad",
  "concentratedUpside",
  "starsAndScrubs",
  "valueSquad"
];

export const TEAM_BUILDER_STRATEGY_OPTIONS = {
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

export const TEAM_BUILDER_STRATEGY_ALIASES = {
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

export const TEAM_BUILDER_COMPARISON_STRATEGY_KEYS = [
  "balancedSquad",
  "diversifiedSquad",
  "concentratedUpside",
  "starsAndScrubs",
  "valueSquad"
];

export const TEAM_BUILDER_PUBLIC_SOURCE_OF_TRUTH_NOTE =
  "The saved Final Round Team Builder output is the public source of truth.";

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function displayNumber(value) {
  const number = Number(value) || 0;
  return number.toFixed(1).replace(".0", "");
}

export function formatTeamBuilderScoreNumber(value) {
  return displayNumber(value);
}

export function budgetDisplay(used, limit) {
  return `${displayNumber(used)} / ${displayNumber(limit)}`;
}

export function normalizeTeamBuilderTeamName(value) {
  return normalizeText(value);
}

export function normalizeTeamBuilderFixtureKey(value) {
  return normalizeText(value || "unknown").replace(/\s+/g, "_");
}

export function normalizeTeamBuilderEligibleTeam(value) {
  return normalizeText(value);
}

export function countSummaryText(counts = {}, labelForKey = (key) => key) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || labelForKey(a[0]).localeCompare(labelForKey(b[0])))
    .map(([key, count]) => `${labelForKey(key)} ${count}`)
    .join(", ");
}

export function objectiveSummaryText({
  rawProjected,
  optionality,
  composite
}) {
  return `Projection ${rawProjected}; optionality ${optionality}; squad score ${composite}.`;
}

export function teamEligibilityKeys(record) {
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

function assertFixtureAuthority(fixtureAuthority) {
  if (!fixtureAuthority || !Array.isArray(fixtureAuthority.fixtures)) {
    throw new Error("Invalid fixture authority: expected a fixtures array.");
  }
}

export function getTeamBuilderEligibleFixtureKey(fixture) {
  return normalizeTeamBuilderFixtureKey(fixture?.stage || fixture?.round || fixture?.public_label || "unknown");
}

export function getFixtureAuthorityFixtureTeams(fixtureAuthority) {
  assertFixtureAuthority(fixtureAuthority);

  return fixtureAuthority.fixtures.map((fixture) => ({
    stage: getTeamBuilderEligibleFixtureKey(fixture),
    label: fixture.public_label || fixture.round || fixture.stage || "Fixture",
    teams: [fixture.team_a, fixture.team_b]
      .filter(Boolean)
      .map((team) => ({
        team: team.team || team.name || null,
        team_id: team.team_id || null,
        code: team.code || team.official_team_code || null,
        keys: teamEligibilityKeys(team)
      }))
  }));
}

export function getFixtureAuthorityEligibleTeams(fixtureAuthority) {
  return [...new Set(getFixtureAuthorityFixtureTeams(fixtureAuthority)
    .flatMap((fixture) => fixture.teams.map((team) => team.team))
    .filter(Boolean))];
}

export function eligibleTeamKeysFromFixtureAuthority(fixtureAuthority) {
  const fixtureTeams = getFixtureAuthorityFixtureTeams(fixtureAuthority);
  const keys = new Set();

  // Eligible teams come from fixture authority, not hardcoded Final Round teams.
  fixtureTeams.forEach((fixture) => {
    fixture.teams.forEach((team) => {
      team.keys.forEach((key) => keys.add(key));
    });
  });

  return keys;
}

export function isFinalRoundEligibleTeam(record, fixtureAuthorityOrEligibleTeamKeys) {
  const eligibleTeamKeys = fixtureAuthorityOrEligibleTeamKeys instanceof Set
    ? fixtureAuthorityOrEligibleTeamKeys
    : eligibleTeamKeysFromFixtureAuthority(fixtureAuthorityOrEligibleTeamKeys);

  return recordMatchesEligibleTeam(record, eligibleTeamKeys);
}

export function recordMatchesEligibleTeam(record, eligibleTeamKeys) {
  if (!eligibleTeamKeys || !eligibleTeamKeys.size) {
    return true;
  }

  return teamEligibilityKeys(record).some((key) => eligibleTeamKeys.has(key));
}

export function isActiveStageProjection(projection, activeStage = "finalRound") {
  if (!projection || projection.available === false) {
    return false;
  }

  const matchday = projection.matchday || projection.matchday_id;
  return matchday === activeStage;
}

export function hasActiveTeamBuilderProjection(player, activeStage = "finalRound", projectionResolver = null) {
  if (!player || activeStage === "group_stage_full") {
    return true;
  }

  const projection = typeof projectionResolver === "function"
    ? projectionResolver(player, activeStage)
    : player?.preview_matchday_projections_by_matchday?.[activeStage];

  return isActiveStageProjection(projection, activeStage);
}

export function explainTeamBuilderEligibilityDecision(player, {
  fixtureAuthority,
  eligibleTeamKeys = fixtureAuthority ? eligibleTeamKeysFromFixtureAuthority(fixtureAuthority) : null,
  activeStage = "finalRound",
  projectionResolver = null
} = {}) {
  if (!player) {
    return {
      eligible: false,
      reason: "missing_player",
      teamEligible: false,
      hasActiveProjection: false
    };
  }

  if (activeStage !== "finalRound") {
    return {
      eligible: true,
      reason: "non_final_round_stage",
      teamEligible: true,
      hasActiveProjection: true
    };
  }

  const teamEligible = eligibleTeamKeys
    ? recordMatchesEligibleTeam(player, eligibleTeamKeys)
    : true;
  const hasActiveProjection = hasActiveTeamBuilderProjection(player, activeStage, projectionResolver);
  const eligible = teamEligible && hasActiveProjection;
  let reason = "eligible";

  if (!teamEligible && !hasActiveProjection) {
    reason = "non_eligible_team_and_missing_active_projection";
  } else if (!teamEligible) {
    reason = "non_eligible_team";
  } else if (!hasActiveProjection) {
    reason = "missing_active_projection";
  }

  return {
    eligible,
    reason,
    teamEligible,
    hasActiveProjection
  };
}

export function isFinalRoundTeamBuilderCandidate(player, options = {}) {
  return explainTeamBuilderEligibilityDecision(player, options).eligible;
}

export function filterFinalRoundTeamBuilderCandidates(players = [], options = {}) {
  return (Array.isArray(players) ? players : [])
    .filter((player) => isFinalRoundTeamBuilderCandidate(player, options));
}

export function assertNoEliminatedActiveCandidates(players = [], options = {}) {
  const rejected = (Array.isArray(players) ? players : [])
    .map((player) => ({ player, decision: explainTeamBuilderEligibilityDecision(player, options) }))
    .filter(({ decision }) => !decision.eligible);

  if (rejected.length) {
    const names = rejected.slice(0, 10).map(({ player, decision }) =>
      `${player?.name || player?.display_name || player?.id || "unknown"} (${decision.reason})`
    );
    throw new Error(`Eliminated or inactive Team Builder candidates found: ${names.join(", ")}`);
  }

  return true;
}

export function isFinalRoundTeamBuilderArtifact(artifact) {
  return Boolean(
    artifact &&
    artifact.schema_version === TEAM_BUILDER_PUBLIC_ARTIFACT_SCHEMA &&
    Array.isArray(artifact.selectedSquad) &&
    Array.isArray(artifact.starters) &&
    Array.isArray(artifact.bench) &&
    artifact.selectedSquad.length === artifact.starters.length + artifact.bench.length
  );
}

export function countByField(rows = [], field, fallback = "unknown") {
  return rows.reduce((counts, row) => {
    const key = row?.[field] || fallback;
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

export function countByTeam(rows = []) {
  return countByField(rows, "country");
}

export function countByFixture(rows = []) {
  return countByField(rows, "fixture_stage");
}

export function getTeamBuilderSelectedPlayerNames(artifact) {
  return (Array.isArray(artifact?.selectedSquad) ? artifact.selectedSquad : [])
    .map((row) => row?.name)
    .filter(Boolean);
}

export function getTeamBuilderStarterNames(artifact) {
  return (Array.isArray(artifact?.starters) ? artifact.starters : [])
    .map((row) => row?.name)
    .filter(Boolean);
}

export function getTeamBuilderBenchNames(artifact) {
  return (Array.isArray(artifact?.bench) ? artifact.bench : [])
    .map((row) => row?.name)
    .filter(Boolean);
}

export function getTeamBuilderBudgetSummary(artifact) {
  const selectedSquad = Array.isArray(artifact?.selectedSquad) ? artifact.selectedSquad : [];
  const used = Number((selectedSquad.reduce((sum, row) => sum + (Number(row?.price) || 0), 0)).toFixed(1));
  const limit = Number(artifact?.constraintsUsed?.initial_budget || artifact?.summary?.budget_limit || 0);

  return {
    used,
    limit,
    display: budgetDisplay(used, limit)
  };
}

export function getTeamBuilderTeamCounts(artifact) {
  return countByTeam(artifact?.selectedSquad || []);
}

export function getTeamBuilderFixtureCounts(artifact) {
  return countByFixture(artifact?.selectedSquad || []);
}

export function getTeamBuilderCaptainSummary(artifact) {
  return {
    captain: artifact?.captain?.name || artifact?.summary?.captain || null,
    viceCaptain: artifact?.viceCaptain?.name || artifact?.summary?.viceCaptain || null
  };
}

export function getTeamBuilderObjectiveSummary(artifact) {
  return {
    rawProjectedPoints: Number(artifact?.summary?.raw_projected_points || 0),
    optionalityScore: Number(artifact?.summary?.optionality_score || 0),
    compositeScore: Number(artifact?.summary?.composite_score || 0),
    rawProjectedDisplay: displayNumber(artifact?.summary?.raw_projected_points),
    optionalityDisplay: displayNumber(artifact?.summary?.optionality_score),
    compositeDisplay: displayNumber(artifact?.summary?.composite_score)
  };
}

export function selectedSquadSummary(artifact) {
  const budget = getTeamBuilderBudgetSummary(artifact);
  const captain = getTeamBuilderCaptainSummary(artifact);
  const objective = getTeamBuilderObjectiveSummary(artifact);

  return {
    selectedPlayers: getTeamBuilderSelectedPlayerNames(artifact),
    selectedCountByTeam: getTeamBuilderTeamCounts(artifact),
    selectedCountByFixture: getTeamBuilderFixtureCounts(artifact),
    totalPrice: budget.used,
    captain: captain.captain,
    viceCaptain: captain.viceCaptain,
    rawProjectedPoints: objective.rawProjectedPoints,
    optionalityScore: objective.optionalityScore,
    compositeScore: objective.compositeScore
  };
}

export function summarizeTeamBuilderArtifact(artifact) {
  if (!isFinalRoundTeamBuilderArtifact(artifact)) {
    throw new Error("Invalid Team Builder artifact: expected Final Round artifact with selectedSquad, starters, and bench arrays.");
  }

  return {
    schemaVersion: artifact.schema_version,
    modelVersion: artifact.modelVersion || artifact.model_version || null,
    strategy: artifact.strategy || null,
    budget: getTeamBuilderBudgetSummary(artifact),
    teamCounts: getTeamBuilderTeamCounts(artifact),
    fixtureCounts: getTeamBuilderFixtureCounts(artifact),
    captain: getTeamBuilderCaptainSummary(artifact),
    objective: getTeamBuilderObjectiveSummary(artifact),
    selectedPlayerNames: getTeamBuilderSelectedPlayerNames(artifact),
    starterNames: getTeamBuilderStarterNames(artifact),
    benchNames: getTeamBuilderBenchNames(artifact)
  };
}

export function compareTeamBuilderSummaryToGolden(summary, golden, tolerance = {}) {
  const tolerances = {
    rawProjectedPoints: 0.001,
    optionalityScore: 0.001,
    compositeScore: 0.01,
    ...tolerance
  };
  const sameJson = (left, right) => JSON.stringify(left || {}) === JSON.stringify(right || {});
  const sameArray = (left, right) => JSON.stringify(left || []) === JSON.stringify(right || []);
  const numericMatch = (left, right, allowed) => Math.abs(Number(left) - Number(right)) <= allowed;
  const checks = {
    budget_used_matches: numericMatch(summary?.budget?.used, golden?.budgetUsed, 0.001),
    budget_limit_matches: Number(summary?.budget?.limit) === Number(golden?.budgetLimit),
    team_counts_match: sameJson(summary?.teamCounts, golden?.teamCounts),
    fixture_counts_match: sameJson(summary?.fixtureCounts, golden?.fixtureCounts),
    captain_matches: summary?.captain?.captain === golden?.captain,
    vice_captain_matches: summary?.captain?.viceCaptain === golden?.viceCaptain,
    raw_projected_points_match: numericMatch(summary?.objective?.rawProjectedPoints, golden?.rawProjectedPoints, tolerances.rawProjectedPoints),
    optionality_score_matches: numericMatch(summary?.objective?.optionalityScore, golden?.optionalityScore, tolerances.optionalityScore),
    composite_score_matches: numericMatch(summary?.objective?.compositeScore, golden?.compositeScore, tolerances.compositeScore),
    selected_player_names_match: sameArray(summary?.selectedPlayerNames, (golden?.selectedPlayers || []).map((row) => row.name)),
    starter_names_match: sameArray(summary?.starterNames, (golden?.starters || []).map((row) => row.name)),
    bench_names_match: sameArray(summary?.benchNames, (golden?.bench || []).map((row) => row.name))
  };

  return {
    status: Object.values(checks).every(Boolean) ? "pass" : "fail",
    checks
  };
}

export function optionalityLabel(score) {
  const number = Number(score) || 0;
  if (number >= 5) return "strong earlier-kickoff optionality";
  if (number >= 2) return "moderate earlier-kickoff optionality";
  return "limited earlier-kickoff optionality";
}

export function riskLabel({ thirdPlaceRisk = false, roleVolatility = 0 } = {}) {
  if (thirdPlaceRisk || Number(roleVolatility) >= 0.2) {
    return "lineup-risk watch";
  }
  return "standard role watch";
}

export function artifactLoadedMessage({
  startingLineupTotal,
  benchLabel,
  rawProjected,
  optionality,
  composite,
  riskText = ""
}) {
  // Browser renders the generated artifact by default. This copy must not
  // become an alternate optimizer explanation or use historical fallback rows.
  return `Balanced Squad loaded for the Final Round: ${startingLineupTotal} starters on the field and ${benchLabel} below. ${objectiveSummaryText({ rawProjected, optionality, composite })}${riskText}`;
}

export function teamBuilderStatusMessage(kind, details = {}) {
  if (kind === "preview_empty") {
    return `Transparent slots show the selected starting tactic. ${details.builderActionLabel} will create a ${details.squadLabel} with ${details.benchLabel} below.`;
  }

  if (kind === "preview_locked") {
    return `Showing ${details.squadLength} locked squad player${details.squadLength === 1 ? "" : "s"}. Click ${details.builderActionLabel} to fill the full ${details.squadLabel}.`;
  }

  if (kind === "partial") {
    return `Team Builder found ${details.squadLength} squad player${details.squadLength === 1 ? "" : "s"} using ${details.strategyLabel}, ${details.trustLabel}, and ${details.matchdayLabel}. Some spots are still open because the current settings are too tight.${details.riskText || ""}`;
  }

  if (kind === "over_budget") {
    return `Team Builder built a ${details.squadLabel} using ${details.strategyLabel}, ${details.trustLabel}, and ${details.matchdayLabel}, but it is over the ${details.budgetLimit} budget. Try removing expensive locked players or relaxing filters.`;
  }

  if (kind === "built") {
    return `Team Builder built a ${details.squadLabel} within the ${details.budgetLimit} budget: ${details.startingLineupTotal} starters on the field and ${details.benchLabel} below.${details.riskText || ""}`;
  }

  if (kind === "artifact_loaded") {
    return artifactLoadedMessage(details);
  }

  return "";
}

export function squadStrategyFitText(reportData = {}, strategyOption = TEAM_BUILDER_STRATEGY_OPTIONS.balancedSquad) {
  const levels = reportData.levels || {};
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
