(function () {
  "use strict";

  const ARTIFACT_SCHEMA = "team_builder_final_round_artifact_v1";

  const STAGE_LABELS = {
    finalRound: "Final Round",
    third_place: "Third Place",
    final: "Final"
  };

  const OBJECTIVE_COMPONENT_LABELS = {
    raw_projected_points: "Raw projected points",
    optionality_score: "Optionality",
    composite_score: "Composite",
    third_place_players: "Third Place players",
    final_players: "Final players"
  };

  const STRATEGY_OPTION_KEYS = [
    "balancedSquad",
    "diversifiedSquad",
    "concentratedUpside",
    "starsAndScrubs",
    "valueSquad"
  ];

  const STRATEGY_OPTIONS = {
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

  const STRATEGY_ALIASES = {
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

  const COMPARISON_STRATEGY_KEYS = [
    "balancedSquad",
    "diversifiedSquad",
    "concentratedUpside",
    "starsAndScrubs",
    "valueSquad"
  ];

  const RULE_POSITION_CODE_LABELS = {
    GK: "Goalkeeper",
    DEF: "Defender",
    MID: "Midfielder",
    FWD: "Forward"
  };

  const RULE_POSITION_ORDER = Object.values(RULE_POSITION_CODE_LABELS);

  const RULE_KNOCKOUT_LIMIT_KEYS = {
    r32: "round_of_32",
    round_of_32: "round_of_32",
    r16: "round_of_16",
    round_of_16: "round_of_16",
    qf: "quarter_final",
    quarter_final: "quarter_final",
    sf: "semi_final",
    semi_final: "semi_final",
    finalround: "final",
    final_round: "final",
    final: "final"
  };

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

  function formatTeamBuilderScoreNumber(value) {
    return displayNumber(value);
  }

  function budgetDisplay(used, limit) {
    return `${displayNumber(used)} / ${displayNumber(limit)}`;
  }

  function clonePlain(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function finiteNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function normalizedRulesStageKey(activeStage = "group_stage_full") {
    return String(activeStage || "group_stage_full").toLowerCase().replace(/[^a-z0-9]+/g, "_");
  }

  function rulesMatchdayKey(activeStage = "group_stage_full") {
    return normalizedRulesStageKey(activeStage).replace(/_/g, "");
  }

  function requirementsTotal(requirements = {}) {
    return Object.values(requirements).reduce((sum, count) => sum + Number(count || 0), 0);
  }

  function positionRequirementsByCodeFromRules(positionRules = {}) {
    return Object.keys(RULE_POSITION_CODE_LABELS).reduce((requirements, code) => {
      const count = finiteNumber(positionRules?.[code]);

      if (count === null) {
        throw new Error(`Missing Team Builder squad position rule for ${code}.`);
      }

      requirements[code] = count;
      return requirements;
    }, {});
  }

  function positionRequirementsByLabel(positionRequirementsByCode = {}) {
    return Object.entries(RULE_POSITION_CODE_LABELS).reduce((requirements, [code, label]) => {
      requirements[label] = Number(positionRequirementsByCode?.[code] || 0);
      return requirements;
    }, {});
  }

  function formationToRequirementsByCode(formation) {
    const match = String(formation || "").match(/^(\d)-(\d)-(\d)$/);

    if (!match) {
      throw new Error(`Unsupported Team Builder formation rule: ${formation}.`);
    }

    return {
      GK: 1,
      DEF: Number(match[1]),
      MID: Number(match[2]),
      FWD: Number(match[3])
    };
  }

  function formationRulesFromAllowedFormations(allowedFormations = [], starterTotal) {
    if (!Array.isArray(allowedFormations) || !allowedFormations.length) {
      throw new Error("Team Builder rules are missing starting_lineup.allowed_formations.");
    }

    return allowedFormations.reduce((formations, formation) => {
      const byCode = formationToRequirementsByCode(formation);

      if (finiteNumber(starterTotal) !== null && requirementsTotal(byCode) !== Number(starterTotal)) {
        throw new Error(`Team Builder formation ${formation} does not match starting_lineup.total_players.`);
      }

      formations.requirementsByCode[formation] = byCode;
      formations.requirementsByFormation[formation] = positionRequirementsByLabel(byCode);
      return formations;
    }, {
      allowedFormations: [...allowedFormations],
      requirementsByCode: {},
      requirementsByFormation: {}
    });
  }

  function budgetLimitFromRules(rules, activeStage) {
    const baseBudget = finiteNumber(rules?.budget?.initial_budget);
    const knockoutIncrease = finiteNumber(rules?.budget?.knockout_increase) || 0;
    const knockoutMatchday = RULE_KNOCKOUT_LIMIT_KEYS[rulesMatchdayKey(activeStage)];

    if (baseBudget === null) {
      throw new Error("Team Builder rules are missing budget.initial_budget.");
    }

    return knockoutMatchday ? baseBudget + knockoutIncrease : baseBudget;
  }

  function countryLimitFromRules(rules, activeStage) {
    const groupLimit = finiteNumber(rules?.country_limits?.group_stage_max_per_country);
    const knockoutKey = RULE_KNOCKOUT_LIMIT_KEYS[rulesMatchdayKey(activeStage)];
    const knockoutLimit = knockoutKey ? finiteNumber(rules?.country_limits?.knockout_limits?.[knockoutKey]) : null;

    if (knockoutLimit !== null) {
      return knockoutLimit;
    }

    if (groupLimit === null) {
      throw new Error("Team Builder rules are missing country_limits.group_stage_max_per_country.");
    }

    return groupLimit;
  }

  function artifactConstraints(artifact) {
    return artifact?.constraintsUsed && typeof artifact.constraintsUsed === "object"
      ? artifact.constraintsUsed
      : {};
  }

  function rulesConfigSourceDetail(rules, artifact, activeStage, field, rulesValue, artifactValue = null) {
    const artifactBacked = activeStage === "finalRound" && artifactValue !== null && artifactValue !== undefined;
    const source = artifactBacked ? "artifact_constraints" : "official_rules_data";

    return {
      field,
      source,
      officialSourceBacked: Boolean(rules),
      currentImplementationBacked: true,
      artifactBacked,
      rulesValue,
      artifactValue,
      value: artifactBacked ? artifactValue : rulesValue,
      matchesOfficialRules: artifactValue === null || artifactValue === undefined || Number(artifactValue) === Number(rulesValue) ||
        JSON.stringify(artifactValue) === JSON.stringify(rulesValue)
    };
  }

  function buildRulesConfigFromInput(input = {}) {
    const rules = input.rules || input.fantasyRules || input;
    const activeStage = input.activeStage || input.matchday || input.matchdayId || artifactConstraints(input.artifact).matchday || "group_stage_full";
    const constraints = artifactConstraints(input.artifact);
    const rulesSquadSize = finiteNumber(rules?.squad?.total_players);
    const rulesStarterSize = finiteNumber(rules?.starting_lineup?.total_players);
    const rulesPositionRequirementsByCode = positionRequirementsByCodeFromRules(rules?.squad?.positions);
    const artifactPositionRequirementsByCode = constraints.position_requirements || null;
    const positionRequirementsByCode = artifactPositionRequirementsByCode && activeStage === "finalRound"
      ? clonePlain(artifactPositionRequirementsByCode)
      : rulesPositionRequirementsByCode;
    const formation = formationRulesFromAllowedFormations(rules?.starting_lineup?.allowed_formations, rulesStarterSize);
    const artifactStarterRequirementsByCode = constraints.starter_requirements || null;
    const activeFormation = input.formation || input.artifact?.strategy?.formation || "4-3-3";
    const activeStarterRequirementsByCode = artifactStarterRequirementsByCode && activeStage === "finalRound"
      ? clonePlain(artifactStarterRequirementsByCode)
      : formation.requirementsByCode[activeFormation] || formation.requirementsByCode[formation.allowedFormations[0]];
    const budgetFromRules = budgetLimitFromRules(rules, activeStage);
    const countryLimitFromRuleData = countryLimitFromRules(rules, activeStage);
    const budgetDetail = rulesConfigSourceDetail(rules, input.artifact, activeStage, "budget_limit", budgetFromRules, constraints.initial_budget ?? null);
    const countryDetail = rulesConfigSourceDetail(rules, input.artifact, activeStage, "country_limit", countryLimitFromRuleData, constraints.country_limit ?? null);

    if (rulesSquadSize === null || rulesStarterSize === null) {
      throw new Error("Team Builder rules are missing squad or starting-lineup totals.");
    }

    if (requirementsTotal(positionRequirementsByCode) !== rulesSquadSize) {
      throw new Error("Team Builder squad position counts do not match total_players.");
    }

    if (requirementsTotal(activeStarterRequirementsByCode) !== rulesStarterSize) {
      throw new Error("Team Builder starter requirements do not match starting_lineup.total_players.");
    }

    return {
      schema_version: "team_builder_rules_config_v1",
      activeStage,
      sourceClassification: "current-implementation-backed",
      rulesStatus: rules?.rules_status || rules?.rulesStatus || null,
      sourceChecked: rules?.source_checked || rules?.sourceChecked || null,
      budget: {
        limit: budgetDetail.value,
        currencyLabel: rules?.budget?.currency_label || "fantasy units",
        detail: budgetDetail
      },
      squad: {
        totalPlayers: rulesSquadSize,
        positionOrder: [...RULE_POSITION_ORDER],
        positionRequirements: positionRequirementsByLabel(positionRequirementsByCode),
        positionRequirementsByCode,
        detail: rulesConfigSourceDetail(rules, input.artifact, activeStage, "position_requirements", rulesPositionRequirementsByCode, artifactPositionRequirementsByCode)
      },
      starterBench: {
        starterSize: rulesStarterSize,
        benchSize: Math.max(0, rulesSquadSize - rulesStarterSize),
        activeFormation,
        starterRequirements: positionRequirementsByLabel(activeStarterRequirementsByCode),
        starterRequirementsByCode: activeStarterRequirementsByCode,
        detail: rulesConfigSourceDetail(rules, input.artifact, activeStage, "starter_requirements", formation.requirementsByCode[activeFormation] || null, artifactStarterRequirementsByCode)
      },
      formation: {
        ...formation,
        activeFormation
      },
      countryLimit: {
        limit: countryDetail.value,
        label: activeStage === "finalRound" ? "Final Round" : activeStage,
        detail: countryDetail
      },
      captain: {
        captainRequired: rules?.captain?.captain_required !== false,
        viceCaptainRequired: rules?.captain?.vice_captain_required !== false,
        captainPointsMultiplier: finiteNumber(rules?.captain?.captain_points_multiplier) || 2,
        captainMustBeInSelectedSquad: true,
        viceCaptainMustBeInSelectedSquad: true,
        captainMustBeStarter: true,
        viceCaptainMustBeStarter: true,
        captainMustDifferFromVice: true,
        goalkeeperAllowed: false,
        source: "official_rules_data_and_current_validator_contract"
      },
      lockRemoval: {
        lockedPlayersMustRemainPresent: true,
        excludedPlayersMustRemainAbsent: true,
        liveLockStateManualCheckRequired: true,
        source: "current_browser_state_and_official_manual_check_caveat"
      },
      warnings: [
        "Rules config is current-implementation-backed for Team Builder behavior.",
        "Live deadlines, locks, substitutions, boosters, and played/unplayed state remain manual FIFA checks."
      ]
    };
  }

  function normalizeTeamBuilderRulesConfig(input = {}) {
    if (input?.schema_version === "team_builder_rules_config_v1") {
      return clonePlain(input);
    }

    return buildRulesConfigFromInput(input);
  }

  function validateTeamBuilderRulesConfig(input = {}) {
    const errors = [];
    let config = null;

    try {
      config = normalizeTeamBuilderRulesConfig(input);
    } catch (error) {
      errors.push(String(error?.message || error));
    }

    if (config) {
      if (finiteNumber(config.budget?.limit) === null || config.budget.limit <= 0) {
        errors.push("Team Builder rules config budget.limit must be a positive number.");
      }

      if (finiteNumber(config.squad?.totalPlayers) === null || config.squad.totalPlayers <= 0) {
        errors.push("Team Builder rules config squad.totalPlayers must be a positive number.");
      }

      if (finiteNumber(config.starterBench?.starterSize) === null || config.starterBench.starterSize <= 0) {
        errors.push("Team Builder rules config starterBench.starterSize must be a positive number.");
      }

      if (requirementsTotal(config.squad?.positionRequirements) !== config.squad?.totalPlayers) {
        errors.push("Team Builder rules config position requirements do not sum to squad.totalPlayers.");
      }

      if (requirementsTotal(config.starterBench?.starterRequirements) !== config.starterBench?.starterSize) {
        errors.push("Team Builder rules config starter requirements do not sum to starterBench.starterSize.");
      }

      if (finiteNumber(config.countryLimit?.limit) === null || config.countryLimit.limit <= 0) {
        errors.push("Team Builder rules config countryLimit.limit must be a positive number.");
      }

      if (!config.sourceClassification) {
        errors.push("Team Builder rules config must include sourceClassification.");
      }
    }

    return {
      status: errors.length ? "fail" : "pass",
      config,
      errors,
      warnings: config?.warnings || []
    };
  }

  function getTeamBuilderRulesConfig(input = {}) {
    const validation = validateTeamBuilderRulesConfig(input);

    if (validation.status !== "pass") {
      throw new Error(`Invalid Team Builder rules config: ${validation.errors.join(" ")}`);
    }

    return validation.config;
  }

  function getTeamBuilderBudgetLimit(input = {}, activeStage = "group_stage_full") {
    const source = input?.schema_version || input?.rules || input?.fantasyRules || input?.artifact || input?.activeStage
      ? input
      : { rules: input, activeStage };
    return getTeamBuilderRulesConfig(source).budget.limit;
  }

  function getTeamBuilderSquadSizeRules(input = {}) {
    const config = getTeamBuilderRulesConfig(input);

    return {
      totalPlayers: config.squad.totalPlayers,
      starterSize: config.starterBench.starterSize,
      benchSize: config.starterBench.benchSize,
      source: config.sourceClassification
    };
  }

  function getTeamBuilderPositionRules(input = {}) {
    const config = getTeamBuilderRulesConfig(input);

    return {
      positionOrder: [...config.squad.positionOrder],
      positionRequirements: clonePlain(config.squad.positionRequirements),
      positionRequirementsByCode: clonePlain(config.squad.positionRequirementsByCode),
      source: config.squad.detail.source
    };
  }

  function getTeamBuilderFormationRules(input = {}) {
    const config = getTeamBuilderRulesConfig(input);

    return {
      activeFormation: config.formation.activeFormation,
      allowedFormations: [...config.formation.allowedFormations],
      requirementsByFormation: clonePlain(config.formation.requirementsByFormation),
      requirementsByCode: clonePlain(config.formation.requirementsByCode),
      source: "official_rules_data"
    };
  }

  function getTeamBuilderCountryLimit(input = {}, activeStage = "group_stage_full") {
    if (input?.schema_version === "team_builder_rules_config_v1") {
      return input.countryLimit.limit;
    }

    const source = input?.rules || input?.fantasyRules || input?.artifact || input?.activeStage
      ? input
      : { rules: input, activeStage };
    return getTeamBuilderRulesConfig(source).countryLimit.limit;
  }

  function getTeamBuilderCaptainRules(input = {}) {
    return clonePlain(getTeamBuilderRulesConfig(input).captain);
  }

  function getTeamBuilderStarterBenchRules(input = {}) {
    return clonePlain(getTeamBuilderRulesConfig(input).starterBench);
  }

  function getTeamBuilderLockRemovalRules(input = {}) {
    return clonePlain(getTeamBuilderRulesConfig(input).lockRemoval);
  }

  function normalizeTeamBuilderTeamName(value) {
    return normalizeText(value);
  }

  function normalizeTeamBuilderFixtureKey(value) {
    return normalizeText(value || "unknown").replace(/\s+/g, "_");
  }

  function normalizeTeamBuilderEligibleTeam(value) {
    return normalizeText(value);
  }

  function countSummaryText(counts = {}, labelForKey = (key) => key) {
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1] || labelForKey(a[0]).localeCompare(labelForKey(b[0])))
      .map(([key, count]) => `${labelForKey(key)} ${count}`)
      .join(", ");
  }

  function objectiveSummaryText({
    rawProjected,
    optionality,
    composite
  }) {
    return `Projection ${rawProjected}; optionality ${optionality}; squad score ${composite}.`;
  }

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

  function assertFixtureAuthority(fixtureAuthority) {
    if (!fixtureAuthority || !Array.isArray(fixtureAuthority.fixtures)) {
      throw new Error("Invalid fixture authority: expected a fixtures array.");
    }
  }

  function getTeamBuilderEligibleFixtureKey(fixture) {
    return normalizeTeamBuilderFixtureKey(fixture?.stage || fixture?.round || fixture?.public_label || "unknown");
  }

  function getFixtureAuthorityFixtureTeams(fixtureAuthority) {
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

  function getFixtureAuthorityEligibleTeams(fixtureAuthority) {
    return [...new Set(getFixtureAuthorityFixtureTeams(fixtureAuthority)
      .flatMap((fixture) => fixture.teams.map((team) => team.team))
      .filter(Boolean))];
  }

  function eligibleTeamKeysFromFixtureAuthority(fixtureAuthority) {
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

  function isFinalRoundEligibleTeam(record, fixtureAuthorityOrEligibleTeamKeys) {
    const eligibleTeamKeys = fixtureAuthorityOrEligibleTeamKeys instanceof Set
      ? fixtureAuthorityOrEligibleTeamKeys
      : eligibleTeamKeysFromFixtureAuthority(fixtureAuthorityOrEligibleTeamKeys);

    return recordMatchesEligibleTeam(record, eligibleTeamKeys);
  }

  function recordMatchesEligibleTeam(record, eligibleTeamKeys) {
    if (!eligibleTeamKeys || !eligibleTeamKeys.size) {
      return true;
    }

    return teamEligibilityKeys(record).some((key) => eligibleTeamKeys.has(key));
  }

  function isActiveStageProjection(projection, activeStage = "finalRound") {
    if (!projection || projection.available === false) {
      return false;
    }

    const matchday = projection.matchday || projection.matchday_id;
    return matchday === activeStage;
  }

  function hasActiveTeamBuilderProjection(player, activeStage = "finalRound", projectionResolver = null) {
    if (!player || activeStage === "group_stage_full") {
      return true;
    }

    const projection = typeof projectionResolver === "function"
      ? projectionResolver(player, activeStage)
      : player?.preview_matchday_projections_by_matchday?.[activeStage];

    return isActiveStageProjection(projection, activeStage);
  }

  function explainTeamBuilderEligibilityDecision(player, {
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

  function isFinalRoundTeamBuilderCandidate(player, options = {}) {
    return explainTeamBuilderEligibilityDecision(player, options).eligible;
  }

  function filterFinalRoundTeamBuilderCandidates(players = [], options = {}) {
    return (Array.isArray(players) ? players : [])
      .filter((player) => isFinalRoundTeamBuilderCandidate(player, options));
  }

  function assertNoEliminatedActiveCandidates(players = [], options = {}) {
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

  function isFinalRoundTeamBuilderArtifact(artifact) {
    return Boolean(
      artifact &&
      artifact.schema_version === ARTIFACT_SCHEMA &&
      Array.isArray(artifact.selectedSquad) &&
      Array.isArray(artifact.starters) &&
      Array.isArray(artifact.bench) &&
      artifact.selectedSquad.length === artifact.starters.length + artifact.bench.length
    );
  }

  function countByField(rows, field, fallback = "unknown") {
    return (Array.isArray(rows) ? rows : []).reduce((counts, row) => {
      const key = row?.[field] || fallback;
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, {});
  }

  function countByTeam(rows) {
    return countByField(rows, "country");
  }

  function countByFixture(rows) {
    return countByField(rows, "fixture_stage");
  }

  function getTeamBuilderSelectedPlayerNames(artifact) {
    return (Array.isArray(artifact?.selectedSquad) ? artifact.selectedSquad : [])
      .map((row) => row?.name)
      .filter(Boolean);
  }

  function getTeamBuilderStarterNames(artifact) {
    return (Array.isArray(artifact?.starters) ? artifact.starters : [])
      .map((row) => row?.name)
      .filter(Boolean);
  }

  function getTeamBuilderBenchNames(artifact) {
    return (Array.isArray(artifact?.bench) ? artifact.bench : [])
      .map((row) => row?.name)
      .filter(Boolean);
  }

  function getTeamBuilderBudgetSummary(artifact) {
    const selectedSquad = Array.isArray(artifact?.selectedSquad) ? artifact.selectedSquad : [];
    const used = Number((selectedSquad.reduce((sum, row) => sum + (Number(row?.price) || 0), 0)).toFixed(1));
    const limit = Number(artifact?.constraintsUsed?.initial_budget || artifact?.summary?.budget_limit || 0);

    return {
      used,
      limit,
      display: budgetDisplay(used, limit)
    };
  }

  function getTeamBuilderTeamCounts(artifact) {
    return countByTeam(artifact?.selectedSquad || []);
  }

  function getTeamBuilderFixtureCounts(artifact) {
    return countByFixture(artifact?.selectedSquad || []);
  }

  function getTeamBuilderCaptainSummary(artifact) {
    return {
      captain: artifact?.captain?.name || artifact?.summary?.captain || null,
      viceCaptain: artifact?.viceCaptain?.name || artifact?.summary?.viceCaptain || null
    };
  }

  function getTeamBuilderObjectiveSummary(artifact) {
    return {
      rawProjectedPoints: Number(artifact?.summary?.raw_projected_points || 0),
      optionalityScore: Number(artifact?.summary?.optionality_score || 0),
      compositeScore: Number(artifact?.summary?.composite_score || 0),
      rawProjectedDisplay: displayNumber(artifact?.summary?.raw_projected_points),
      optionalityDisplay: displayNumber(artifact?.summary?.optionality_score),
      compositeDisplay: displayNumber(artifact?.summary?.composite_score)
    };
  }

  function getTeamBuilderSquadRows(squadOrArtifact, label = "Team Builder squad") {
    if (Array.isArray(squadOrArtifact)) {
      return squadOrArtifact;
    }

    if (Array.isArray(squadOrArtifact?.selectedSquad)) {
      return squadOrArtifact.selectedSquad;
    }

    throw new Error(`Invalid ${label}: expected a selectedSquad array or squad row array.`);
  }

  function normalizeTeamBuilderPositionCode(value) {
    const normalized = normalizeText(value);
    if (normalized === "gk" || normalized === "goalkeeper") return "GK";
    if (normalized === "def" || normalized === "defender") return "DEF";
    if (normalized === "mid" || normalized === "midfielder") return "MID";
    if (normalized === "fwd" || normalized === "forward") return "FWD";
    return String(value || "").trim().toUpperCase() || "UNKNOWN";
  }

  function getTeamBuilderPositionCounts(squadOrArtifact) {
    return getTeamBuilderSquadRows(squadOrArtifact).reduce((counts, row) => {
      const key = normalizeTeamBuilderPositionCode(row?.position || row?.official_fantasy_position);
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, { GK: 0, DEF: 0, MID: 0, FWD: 0 });
  }

  function getTeamBuilderBudgetFeasibility(squadOrArtifact, options = {}) {
    const rows = getTeamBuilderSquadRows(squadOrArtifact);
    const used = Number(rows.reduce((sum, row) => sum + (Number(row?.price) || 0), 0).toFixed(1));
    const limit = Number(
      options.budgetLimit ??
      squadOrArtifact?.constraintsUsed?.initial_budget ??
      squadOrArtifact?.summary?.budget_limit
    );
    const tolerance = Number(options.tolerance ?? 0.001);

    if (!Number.isFinite(limit)) {
      throw new Error("Invalid Team Builder budget: expected a finite budget limit.");
    }

    return {
      used,
      limit,
      remaining: Number((limit - used).toFixed(1)),
      isWithinBudget: used <= limit + tolerance,
      display: budgetDisplay(used, limit)
    };
  }

  function getTeamBuilderRowId(row) {
    return String(row?.id || row?.player_id || row?.official_fantasy_player_id || row?.name || "").trim();
  }

  function normalizeTeamBuilderCountMap(counts = {}) {
    return Object.entries(counts || {}).reduce((normalized, [key, count]) => {
      normalized[normalizeTeamBuilderPositionCode(key)] = Number(count || 0);
      return normalized;
    }, {});
  }

  function sameCountMap(left = {}, right = {}) {
    const keys = new Set([...Object.keys(left || {}), ...Object.keys(right || {})]);
    return [...keys].every((key) => Number(left?.[key] || 0) === Number(right?.[key] || 0));
  }

  function validateTeamBuilderSquadSize(squadOrArtifact, options = {}) {
    const rows = getTeamBuilderSquadRows(squadOrArtifact);
    const expected = Number(options.squadSize ?? options.expectedSize ?? 15);
    const passed = !Number.isFinite(expected) || rows.length === expected;

    return {
      status: passed ? "pass" : "fail",
      actual: rows.length,
      expected,
      errors: passed ? [] : [`Expected ${expected} Team Builder squad players, found ${rows.length}.`],
      warnings: []
    };
  }

  function validateTeamBuilderDuplicatePlayers(squadOrArtifact) {
    const rows = getTeamBuilderSquadRows(squadOrArtifact);
    const seen = new Set();
    const duplicates = [];

    rows.forEach((row) => {
      const id = getTeamBuilderRowId(row);
      if (!id) return;
      if (seen.has(id)) {
        duplicates.push(id);
      }
      seen.add(id);
    });

    return {
      status: duplicates.length ? "fail" : "pass",
      duplicates,
      errors: duplicates.length ? [`Duplicate Team Builder players found: ${duplicates.join(", ")}.`] : [],
      warnings: []
    };
  }

  function validateTeamBuilderBudgetConstraint(squadOrArtifact, options = {}) {
    const budget = getTeamBuilderBudgetFeasibility(squadOrArtifact, options);

    return {
      status: budget.isWithinBudget ? "pass" : "fail",
      ...budget,
      errors: budget.isWithinBudget ? [] : [`Team Builder squad costs ${budget.display}, over the budget limit.`],
      warnings: []
    };
  }

  function validateTeamBuilderPositionConstraints(squadOrArtifact, options = {}) {
    const counts = options.positionCounts
      ? normalizeTeamBuilderCountMap(options.positionCounts)
      : getTeamBuilderPositionCounts(squadOrArtifact);
    const requirements = normalizeTeamBuilderCountMap(options.positionRequirements || {});
    const exact = options.exact !== false;
    const checkedPositions = Object.keys(requirements);
    const missingRequirements = checkedPositions.length === 0;
    const mismatches = checkedPositions.filter((position) => {
      const actual = Number(counts[position] || 0);
      const expected = Number(requirements[position] || 0);
      return exact ? actual !== expected : actual > expected;
    });
    const passed = !missingRequirements && mismatches.length === 0;

    return {
      status: passed ? "pass" : "fail",
      counts,
      requirements,
      exact,
      mismatches,
      errors: passed ? [] : [
        missingRequirements
          ? "Missing Team Builder position requirements."
          : `Team Builder position constraints failed for ${mismatches.join(", ")}.`
      ],
      warnings: []
    };
  }

  function validateTeamBuilderTeamConstraint(squadOrArtifact, options = {}) {
    const rows = getTeamBuilderSquadRows(squadOrArtifact);
    const counts = options.teamCounts || getTeamBuilderTeamCounts({ selectedSquad: rows });
    const countryLimit = Number(options.countryLimit ?? Infinity);
    const expectedTeamCounts = options.expectedTeamCounts || null;
    const limitViolations = Object.entries(counts)
      .filter(([, count]) => Number(count || 0) > countryLimit)
      .map(([team, count]) => ({ team, count: Number(count || 0), limit: countryLimit }));
    const expectedCountsMatch = expectedTeamCounts ? sameCountMap(counts, expectedTeamCounts) : true;
    const passed = limitViolations.length === 0 && expectedCountsMatch;

    return {
      status: passed ? "pass" : "fail",
      counts,
      countryLimit,
      expectedTeamCounts,
      limitViolations,
      expectedCountsMatch,
      errors: [
        ...limitViolations.map((entry) => `${entry.team} has ${entry.count}; max is ${entry.limit}.`),
        expectedCountsMatch ? "" : "Team Builder team counts do not match expected counts."
      ].filter(Boolean),
      warnings: []
    };
  }

  function validateTeamBuilderFixtureConstraint(squadOrArtifact, options = {}) {
    const rows = getTeamBuilderSquadRows(squadOrArtifact);
    const counts = options.fixtureCounts || getTeamBuilderFixtureCounts({ selectedSquad: rows });
    const expectedFixtureCounts = options.expectedFixtureCounts || null;
    const expectedCountsMatch = expectedFixtureCounts ? sameCountMap(counts, expectedFixtureCounts) : true;

    return {
      status: expectedCountsMatch ? "pass" : "fail",
      counts,
      expectedFixtureCounts,
      errors: expectedCountsMatch ? [] : ["Team Builder fixture counts do not match expected counts."],
      warnings: []
    };
  }

  function validateTeamBuilderEligibleTeamsConstraint(squadOrArtifact, options = {}) {
    const rows = getTeamBuilderSquadRows(squadOrArtifact);
    const eligibleTeamKeys = options.eligibleTeamKeys || (
      options.fixtureAuthority ? eligibleTeamKeysFromFixtureAuthority(options.fixtureAuthority) : null
    );
    const activeStage = options.activeStage || "finalRound";
    const rejected = rows
      .map((row) => ({ row, decision: explainTeamBuilderEligibilityDecision(row, {
        eligibleTeamKeys,
        activeStage,
        projectionResolver: options.projectionResolver
      }) }))
      .filter(({ decision }) => !decision.eligible);

    return {
      status: rejected.length ? "fail" : "pass",
      rejected: rejected.map(({ row, decision }) => ({
        id: getTeamBuilderRowId(row),
        name: row?.name || row?.display_name || null,
        team: row?.country || row?.team || row?.team_id || null,
        reason: decision.reason
      })),
      errors: rejected.length
        ? [`Ineligible Team Builder players found: ${rejected.slice(0, 5).map(({ row }) => row?.name || getTeamBuilderRowId(row) || "unknown").join(", ")}.`]
        : [],
      warnings: []
    };
  }

  function getTeamBuilderCaptainViceValidation(artifact) {
    const selectedRows = getTeamBuilderSquadRows(artifact);
    const starterRows = Array.isArray(artifact?.starters) ? artifact.starters : [];
    const captain = artifact?.captain || {};
    const viceCaptain = artifact?.viceCaptain || {};
    const captainName = captain.name || artifact?.summary?.captain || null;
    const viceCaptainName = viceCaptain.name || artifact?.summary?.viceCaptain || null;
    const selectedNames = new Set(selectedRows.map((row) => row?.name).filter(Boolean));
    const starterNames = new Set(starterRows.map((row) => row?.name).filter(Boolean));
    const selectedByName = new Map(selectedRows.map((row) => [row?.name, row]).filter(([name]) => Boolean(name)));
    const captainRow = selectedByName.get(captainName);
    const viceCaptainRow = selectedByName.get(viceCaptainName);

    return {
      captain: captainName,
      viceCaptain: viceCaptainName,
      captainInSelectedSquad: Boolean(captainName && selectedNames.has(captainName)),
      viceCaptainInSelectedSquad: Boolean(viceCaptainName && selectedNames.has(viceCaptainName)),
      captainInStarters: Boolean(captainName && starterNames.has(captainName)),
      viceCaptainInStarters: Boolean(viceCaptainName && starterNames.has(viceCaptainName)),
      captainDifferentFromVice: Boolean(captainName && viceCaptainName && captainName !== viceCaptainName),
      captainIsNotGoalkeeper: normalizeTeamBuilderPositionCode(captainRow?.position || captainRow?.official_fantasy_position) !== "GK",
      viceCaptainIsNotGoalkeeper: normalizeTeamBuilderPositionCode(viceCaptainRow?.position || viceCaptainRow?.official_fantasy_position) !== "GK"
    };
  }

  function validateTeamBuilderCaptainVice(artifact, options = {}) {
    const candidateArtifact = {
      selectedSquad: getTeamBuilderSquadRows(artifact),
      starters: Array.isArray(options.starters) ? options.starters : artifact?.starters,
      captain: options.captain ? { name: options.captain } : artifact?.captain,
      viceCaptain: options.viceCaptain ? { name: options.viceCaptain } : artifact?.viceCaptain,
      summary: {
        ...(artifact?.summary || {}),
        captain: options.captain ?? artifact?.summary?.captain,
        viceCaptain: options.viceCaptain ?? artifact?.summary?.viceCaptain
      }
    };
    const validation = getTeamBuilderCaptainViceValidation(candidateArtifact);
    const checks = {
      captain_present: Boolean(validation.captain),
      vice_captain_present: Boolean(validation.viceCaptain),
      captain_in_selected_squad: validation.captainInSelectedSquad,
      vice_captain_in_selected_squad: validation.viceCaptainInSelectedSquad,
      captain_in_starters: validation.captainInStarters,
      vice_captain_in_starters: validation.viceCaptainInStarters,
      captain_different_from_vice: validation.captainDifferentFromVice,
      captain_is_not_goalkeeper: validation.captainIsNotGoalkeeper,
      vice_captain_is_not_goalkeeper: validation.viceCaptainIsNotGoalkeeper
    };
    const failed = Object.entries(checks).filter(([, passed]) => !passed).map(([id]) => id);

    return {
      status: failed.length ? "fail" : "pass",
      ...validation,
      checks,
      errors: failed.map((id) => `Captain/vice constraint failed: ${id}.`),
      warnings: []
    };
  }

  function validateTeamBuilderLockedPlayersPresent(squadOrArtifact, options = {}) {
    const rows = getTeamBuilderSquadRows(squadOrArtifact);
    const rowIds = new Set(rows.map(getTeamBuilderRowId).filter(Boolean));
    const lockedIds = [...(options.lockedPlayerIds || [])].map(String);
    const missing = lockedIds.filter((id) => !rowIds.has(id));

    return {
      status: missing.length ? "fail" : "pass",
      lockedIds,
      missing,
      errors: missing.length ? [`Locked Team Builder players missing: ${missing.join(", ")}.`] : [],
      warnings: []
    };
  }

  function validateTeamBuilderExcludedPlayersAbsent(squadOrArtifact, options = {}) {
    const rows = getTeamBuilderSquadRows(squadOrArtifact);
    const excludedIds = new Set([...(options.excludedPlayerIds || [])].map(String));
    const present = rows
      .map((row) => ({ id: getTeamBuilderRowId(row), name: row?.name || row?.display_name || null }))
      .filter((row) => row.id && excludedIds.has(row.id));

    return {
      status: present.length ? "fail" : "pass",
      excludedIds: [...excludedIds],
      present,
      errors: present.length ? [`Excluded Team Builder players present: ${present.map((row) => row.name || row.id).join(", ")}.`] : [],
      warnings: []
    };
  }

  function validateTeamBuilderStarterBenchStructure({ starters = [], bench = [] } = {}, options = {}) {
    const starterSize = Number(options.starterSize ?? 11);
    const benchSize = Number(options.benchSize ?? 4);
    const starterRequirements = options.starterRequirements || null;
    const benchRequirements = options.benchRequirements || null;
    const starterSizePass = starters.length === starterSize;
    const benchSizePass = bench.length === benchSize;
    const starterPositions = starterRequirements
      ? validateTeamBuilderPositionConstraints(starters, { positionRequirements: starterRequirements })
      : { status: "pass", errors: [], warnings: [] };
    const benchPositions = benchRequirements
      ? validateTeamBuilderPositionConstraints(bench, { positionRequirements: benchRequirements })
      : { status: "pass", errors: [], warnings: [] };
    const passed = starterSizePass && benchSizePass && starterPositions.status === "pass" && benchPositions.status === "pass";

    return {
      status: passed ? "pass" : "fail",
      starterSize: { actual: starters.length, expected: starterSize, passed: starterSizePass },
      benchSize: { actual: bench.length, expected: benchSize, passed: benchSizePass },
      starterPositions,
      benchPositions,
      errors: [
        starterSizePass ? "" : `Expected ${starterSize} starters, found ${starters.length}.`,
        benchSizePass ? "" : `Expected ${benchSize} bench players, found ${bench.length}.`,
        ...starterPositions.errors,
        ...benchPositions.errors
      ].filter(Boolean),
      warnings: []
    };
  }

  function getTeamBuilderSquadConstraintSummary(artifact, options = {}) {
    const rows = getTeamBuilderSquadRows(artifact);
    const budget = getTeamBuilderBudgetFeasibility(artifact, options);

    return {
      selectedCount: rows.length,
      budget,
      positionCounts: getTeamBuilderPositionCounts(rows),
      teamCounts: getTeamBuilderTeamCounts({ selectedSquad: rows }),
      fixtureCounts: getTeamBuilderFixtureCounts({ selectedSquad: rows }),
      captain: getTeamBuilderCaptainViceValidation(artifact)
    };
  }

  function getTeamBuilderConstraintSummary(squadOrArtifact, options = {}) {
    const rows = getTeamBuilderSquadRows(squadOrArtifact);
    const budget = getTeamBuilderBudgetFeasibility(squadOrArtifact, options);

    return {
      selectedCount: rows.length,
      budget,
      positionCounts: getTeamBuilderPositionCounts(rows),
      teamCounts: getTeamBuilderTeamCounts({ selectedSquad: rows }),
      fixtureCounts: getTeamBuilderFixtureCounts({ selectedSquad: rows }),
      duplicatePlayers: validateTeamBuilderDuplicatePlayers(rows).duplicates,
      lockedPlayers: validateTeamBuilderLockedPlayersPresent(rows, options),
      excludedPlayers: validateTeamBuilderExcludedPlayersAbsent(rows, options)
    };
  }

  function buildTeamBuilderConstraintReport(checks = {}) {
    const entries = Object.entries(checks).map(([id, result]) => ({
      id,
      status: result?.status === "pass" ? "pass" : "fail",
      errors: result?.errors || [],
      warnings: result?.warnings || []
    }));

    return {
      status: entries.every((entry) => entry.status === "pass") ? "pass" : "fail",
      entries,
      errors: entries.flatMap((entry) => entry.errors.map((error) => ({ id: entry.id, error }))),
      warnings: entries.flatMap((entry) => entry.warnings.map((warning) => ({ id: entry.id, warning })))
    };
  }

  function validateTeamBuilderSquadConstraints(squadOrArtifact, options = {}) {
    const rows = getTeamBuilderSquadRows(squadOrArtifact);
    const checks = {
      squad_size: validateTeamBuilderSquadSize(rows, options),
      duplicate_players: validateTeamBuilderDuplicatePlayers(rows),
      budget: validateTeamBuilderBudgetConstraint(rows, options),
      positions: validateTeamBuilderPositionConstraints(rows, options),
      team_limit: validateTeamBuilderTeamConstraint(rows, options),
      fixtures: validateTeamBuilderFixtureConstraint(rows, options),
      eligible_teams: validateTeamBuilderEligibleTeamsConstraint(rows, options),
      locked_players: validateTeamBuilderLockedPlayersPresent(rows, options),
      excluded_players: validateTeamBuilderExcludedPlayersAbsent(rows, options)
    };

    if (options.captain || options.viceCaptain || squadOrArtifact?.captain || squadOrArtifact?.summary?.captain) {
      checks.captain_vice = validateTeamBuilderCaptainVice(squadOrArtifact, options);
    }

    if (Array.isArray(options.starters) || Array.isArray(options.bench) || Array.isArray(squadOrArtifact?.starters) || Array.isArray(squadOrArtifact?.bench)) {
      checks.starter_bench_structure = validateTeamBuilderStarterBenchStructure({
        starters: options.starters || squadOrArtifact?.starters || [],
        bench: options.bench || squadOrArtifact?.bench || []
      }, options);
    }

    const report = buildTeamBuilderConstraintReport(checks);

    return {
      ...report,
      checks,
      summary: getTeamBuilderConstraintSummary(rows, options)
    };
  }

  function validateTeamBuilderSelectedSquadConstraints(artifact, options = {}) {
    const summary = getTeamBuilderSquadConstraintSummary(artifact, options);
    const positionRequirements = options.positionRequirements || artifact?.constraintsUsed?.position_requirements || null;
    const expectedTeamCounts = options.expectedTeamCounts || artifact?.summary?.selected_count_by_team || null;
    const expectedFixtureCounts = options.expectedFixtureCounts || artifact?.summary?.selected_count_by_fixture || null;
    const squadSize = Number(options.squadSize ?? 15);
    const countryLimit = Number(options.countryLimit ?? artifact?.constraintsUsed?.country_limit ?? Infinity);
    const captain = summary.captain;
    const checks = {
      selected_count_matches: !Number.isFinite(squadSize) || summary.selectedCount === squadSize,
      budget_within_limit: summary.budget.isWithinBudget,
      position_counts_match: positionRequirements ? sameCountMap(summary.positionCounts, positionRequirements) : true,
      team_counts_match: expectedTeamCounts ? sameCountMap(summary.teamCounts, expectedTeamCounts) : true,
      fixture_counts_match: expectedFixtureCounts ? sameCountMap(summary.fixtureCounts, expectedFixtureCounts) : true,
      country_limit_satisfied: Object.values(summary.teamCounts).every((count) => Number(count || 0) <= countryLimit),
      captain_vice_valid: captain.captainInSelectedSquad &&
        captain.viceCaptainInSelectedSquad &&
        captain.captainInStarters &&
        captain.viceCaptainInStarters &&
        captain.captainDifferentFromVice &&
        captain.captainIsNotGoalkeeper &&
        captain.viceCaptainIsNotGoalkeeper
    };

    return {
      status: Object.values(checks).every(Boolean) ? "pass" : "fail",
      checks,
      summary
    };
  }

  function selectedSquadSummary(artifact) {
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

  function summarizeTeamBuilderArtifact(artifact) {
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

  function compareTeamBuilderSummaryToGolden(summary, golden, tolerance = {}) {
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

  function optionalityLabel(score) {
    const number = Number(score) || 0;
    if (number >= 5) return "strong earlier-kickoff optionality";
    if (number >= 2) return "moderate earlier-kickoff optionality";
    return "limited earlier-kickoff optionality";
  }

  function riskLabel({ thirdPlaceRisk = false, roleVolatility = 0 } = {}) {
    if (thirdPlaceRisk || Number(roleVolatility) >= 0.2) {
      return "lineup-risk watch";
    }
    return "standard role watch";
  }

  function artifactLoadedMessage({
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

  function teamBuilderStatusMessage(kind, details = {}) {
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

  function squadStrategyFitText(reportData = {}, strategyOption = STRATEGY_OPTIONS.balancedSquad) {
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

  window.TEAM_BUILDER_PUBLIC_HELPERS = {
    ARTIFACT_SCHEMA,
    STAGE_LABELS,
    OBJECTIVE_COMPONENT_LABELS,
    STRATEGY_OPTION_KEYS,
    STRATEGY_OPTIONS,
    STRATEGY_ALIASES,
    COMPARISON_STRATEGY_KEYS,
    SOURCE_OF_TRUTH_NOTE: "The saved Final Round Team Builder output is the public source of truth.",
    RULE_POSITION_CODE_LABELS,
    RULE_POSITION_ORDER,
    formatTeamBuilderScoreNumber,
    budgetDisplay,
    getTeamBuilderRulesConfig,
    getTeamBuilderBudgetLimit,
    getTeamBuilderSquadSizeRules,
    getTeamBuilderPositionRules,
    getTeamBuilderFormationRules,
    getTeamBuilderCountryLimit,
    getTeamBuilderCaptainRules,
    getTeamBuilderStarterBenchRules,
    getTeamBuilderLockRemovalRules,
    normalizeTeamBuilderRulesConfig,
    validateTeamBuilderRulesConfig,
    normalizeTeamBuilderTeamName,
    normalizeTeamBuilderFixtureKey,
    normalizeTeamBuilderEligibleTeam,
    countSummaryText,
    objectiveSummaryText,
    teamEligibilityKeys,
    getTeamBuilderEligibleFixtureKey,
    getFixtureAuthorityFixtureTeams,
    getFixtureAuthorityEligibleTeams,
    eligibleTeamKeysFromFixtureAuthority,
    isFinalRoundEligibleTeam,
    recordMatchesEligibleTeam,
    isActiveStageProjection,
    hasActiveTeamBuilderProjection,
    isFinalRoundTeamBuilderCandidate,
    filterFinalRoundTeamBuilderCandidates,
    explainTeamBuilderEligibilityDecision,
    assertNoEliminatedActiveCandidates,
    isFinalRoundTeamBuilderArtifact,
    countByTeam,
    countByFixture,
    getTeamBuilderBudgetSummary,
    getTeamBuilderTeamCounts,
    getTeamBuilderFixtureCounts,
    getTeamBuilderCaptainSummary,
    getTeamBuilderObjectiveSummary,
    getTeamBuilderSquadRows,
    normalizeTeamBuilderPositionCode,
    getTeamBuilderPositionCounts,
    getTeamBuilderBudgetFeasibility,
    getTeamBuilderCaptainViceValidation,
    getTeamBuilderRowId,
    validateTeamBuilderSquadSize,
    validateTeamBuilderDuplicatePlayers,
    validateTeamBuilderBudgetConstraint,
    validateTeamBuilderPositionConstraints,
    validateTeamBuilderTeamConstraint,
    validateTeamBuilderFixtureConstraint,
    validateTeamBuilderEligibleTeamsConstraint,
    validateTeamBuilderCaptainVice,
    validateTeamBuilderLockedPlayersPresent,
    validateTeamBuilderExcludedPlayersAbsent,
    validateTeamBuilderStarterBenchStructure,
    getTeamBuilderSquadConstraintSummary,
    getTeamBuilderConstraintSummary,
    buildTeamBuilderConstraintReport,
    validateTeamBuilderSquadConstraints,
    validateTeamBuilderSelectedSquadConstraints,
    getTeamBuilderSelectedPlayerNames,
    getTeamBuilderStarterNames,
    getTeamBuilderBenchNames,
    selectedSquadSummary,
    summarizeTeamBuilderArtifact,
    compareTeamBuilderSummaryToGolden,
    optionalityLabel,
    riskLabel,
    artifactLoadedMessage,
    teamBuilderStatusMessage,
    squadStrategyFitText
  };
}());
