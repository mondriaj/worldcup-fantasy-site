// Source data lives in JSON files:
// players.json stores players, and fantasyRules.json stores draft rules.
// The browser loads script-friendly copies first:
// playersData.js defines window.PLAYERS_DATA, and fantasyRulesData.js defines window.FANTASY_RULES_DATA.
// script.js then uses both datasets together without fetching JSON at runtime.
const players = window.PLAYERS_DATA || [];

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
    label: "Best Overall",
    description: "Best all-around option. It balances projected points, reliability, and risk.",
    formula: "Uses risk-adjusted overall score: projected points after risk penalty, plus reliability, plus lower composite risk.",
    score: (player) => value(player.risk_adjusted_overall_score)
  },
  expected: {
    label: "Projected Points",
    description: "Ranks players by projected points for one match after a risk penalty.",
    formula: "Starts with projected points per appearance, then reduces it when composite risk is high: projected points x (1 - risk / 150).",
    score: (player) => value(player.risk_adjusted_expected_points_estimate)
  },
  safe: {
    label: "Reliable Pick",
    description: "Favors steady players with lower risk before chasing upside.",
    formula: "Score = (100 - composite risk) + projected points x 8. Composite risk includes availability, minutes, cards, volatility, and clearly weighted bad-week risk.",
    score: (player) => (100 - value(player.risk_composite_score)) + value(player.risk_adjusted_expected_points_estimate) * 8
  },
  upside: {
    label: "Upside Pick",
    description: "Looks for players who produce a lot when they are on the field.",
    formula: "Uses estimated fantasy points per 90 minutes. This can favor exciting players, but it may be less safe if they do not play often.",
    score: (player) => value(player.euro_style_points_per90_estimate)
  },
  minutes: {
    label: "Likely Minutes",
    description: "Looks for players who are more likely to play regularly.",
    formula: "Uses reliability score, built from sample confidence, availability risk, and minutes risk. Sample confidence is confidence weight x 100, so players with more 90s get trusted more.",
    score: (player) => value(player.euro_style_reliability_score)
  },
  lowTailRisk: {
    label: "Avoid Bad Weeks",
    optionLabel: "Avoid Bad Weeks (low tail-risk)",
    secondaryLabel: "Advanced: low tail-risk score",
    description: "Looks for players less likely to produce a very poor score.",
    formula: "Score = (100 - tail risk) + projected points x 5. Tail risk uses bad-week rate, 10th percentile points, and the average of the worst 20% of weeks.",
    score: (player) => (100 - value(player.risk_tail_score)) + value(player.risk_adjusted_expected_points_estimate) * 5
  },
  sharpe: {
    label: "Risk-Adjusted Pick",
    optionLabel: "Risk-Adjusted Pick (Sharpe-style)",
    secondaryLabel: "Advanced: Sharpe-style score",
    description: "Balances projected points against overall risk.",
    formula: "Raw formula: (projected points per appearance - 2) / standard deviation of weekly fantasy points. The site then converts the raw ratio into a 0-100 percentile index across the player database.",
    score: (player) => value(player.risk_adjusted_sharpe_like)
  },
  sortino: {
    label: "Downside Protection Pick",
    optionLabel: "Downside Protection Pick (Sortino-style)",
    secondaryLabel: "Advanced: Sortino-style score",
    description: "Focuses more on avoiding bad outcomes.",
    formula: "Raw formula: (projected points per appearance - 2) / downside deviation. Downside deviation only counts weeks below a 2-point target, so it is not directly comparable with total volatility. The site converts the raw ratio into a 0-100 percentile index.",
    score: (player) => value(player.risk_adjusted_sortino_like)
  }
};

// This menu controls the extra stat shown on each player card on the field.
const cardStats = {
  balanced: {
    label: "Best Overall Score",
    value: (player) => value(player.risk_adjusted_overall_score)
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
    label: "Tail Risk",
    value: (player) => value(player.risk_tail_score)
  },
  sharpe: {
    label: "Sharpe-Style Score",
    value: (player) => value(player.risk_adjusted_sharpe_like)
  },
  sortino: {
    label: "Sortino-Style Score",
    value: (player) => value(player.risk_adjusted_sortino_like)
  }
};

const lockedPlayerIds = new Set();
const excludedPlayerIds = new Set();

const buildTeamButtonBottom = document.getElementById("build-team-btn-bottom");
const resetTeamButton = document.getElementById("reset-team-btn");
const clearLockedButton = document.getElementById("clear-locked-btn");
const removeSelectedPlayerButton = document.getElementById("remove-selected-player-btn");
const exportTeamJsonButton = document.getElementById("export-team-json-btn");
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
const advicePositionSelect = document.getElementById("advice-position-select");
const cardStatSelect = document.getElementById("card-stat-select");
const measureInfo = document.getElementById("measure-info");
const scoreInfoButton = document.getElementById("score-info-btn");
const scoreInfo = document.getElementById("score-info");
const playerSearch = document.getElementById("player-search");
const positionFilter = document.getElementById("position-filter");
const minPriceFilter = document.getElementById("min-price-filter");
const maxPriceFilter = document.getElementById("max-price-filter");
const playerPicker = document.getElementById("player-picker");
const builderWarning = document.getElementById("builder-warning");
const ruleCheckSummary = document.getElementById("rule-check-summary");
const rulesValidationList = document.getElementById("rules-validation-list");
const countryCountsList = document.getElementById("country-counts-list");
const teamField = document.getElementById("team-field");
const teamPlayers = document.getElementById("team-players");
const benchPanel = document.getElementById("bench-panel");
const benchPlayers = document.getElementById("bench-players");
const benchDescription = document.getElementById("bench-description");
const benchCount = document.getElementById("bench-count");
const swapMessage = document.getElementById("swap-message");
const teamMessage = document.getElementById("team-message");
const summaryTactic = document.getElementById("summary-tactic");
const summaryPrice = document.getElementById("summary-price");
const summaryBudget = document.getElementById("summary-budget");
const summaryRisk = document.getElementById("summary-risk");
const summaryLocked = document.getElementById("summary-locked");
const dashboardGrid = document.getElementById("dashboard-grid");
const captainTableBody = document.getElementById("captain-table-body");
const adviceTableBody = document.getElementById("advice-table-body");
const adviceStyleNote = document.getElementById("advice-style-note");

let selectedPositionFilter = "All";
let currentRenderedTeam = [];
let currentBenchPlayers = [];
let currentIgnoredLockedPlayers = [];
let currentRenderMode = "preview";
let selectedSwap = null;
let currentStarterSlotsByPosition = {};
let currentBenchSlotsByPosition = {};

function value(number) {
  return Number(number) || 0;
}

function money(number) {
  return budgetText(number);
}

function displayNumber(number) {
  return value(number).toFixed(1).replace(".0", "");
}

function compactCount(number) {
  const count = Number(number) || 0;

  if (count >= 1000) {
    return `${Math.round(count / 1000)}k`;
  }

  return String(count);
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

function activeCardStat() {
  return cardStats[cardStatSelect.value] || cardStats.balanced;
}

function measureScore(player, measure = activeMeasure()) {
  return measure.score(player);
}

function sortPlayers(playerList, measure = activeMeasure()) {
  return [...playerList].sort((a, b) => {
    const scoreDifference = measureScore(b, measure) - measureScore(a, measure);

    if (scoreDifference !== 0) {
      return scoreDifference;
    }

    return value(b.risk_adjusted_expected_points_estimate) - value(a.risk_adjusted_expected_points_estimate);
  });
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
  return players.find((player) => player.id === playerId);
}

function captainScore(player) {
  const expectedPoints = value(player.risk_adjusted_expected_points_estimate);
  const reliability = value(player.euro_style_reliability_score);
  const riskPenalty = value(player.risk_composite_score) * 0.08;

  return expectedPoints * 10 + reliability * 0.35 - riskPenalty;
}

function styleReason(player, measureKey) {
  const expected = displayNumber(player.risk_adjusted_expected_points_estimate);
  const per90 = displayNumber(player.euro_style_points_per90_estimate);
  const reliability = displayNumber(player.euro_style_reliability_score);
  const risk = displayNumber(player.risk_composite_score);
  const tailRisk = displayNumber(player.risk_tail_score);

  if (measureKey === "expected") {
    return `Strong projected points after the risk adjustment: ${expected}.`;
  }

  if (measureKey === "safe") {
    return `Reliable profile: risk score ${risk}, reliability ${reliability}, and projected points ${expected}.`;
  }

  if (measureKey === "upside") {
    return `High production when on the field, with ${per90} estimated points per 90.`;
  }

  if (measureKey === "minutes") {
    return `Good reliability score of ${reliability}, useful when you want likely playing time.`;
  }

  if (measureKey === "lowTailRisk") {
    return `Looks for lower bad-week risk, with a tail-risk score of ${tailRisk}.`;
  }

  if (measureKey === "sharpe") {
    return `Balances reward against overall volatility, with a Sharpe-style score of ${displayNumber(player.risk_adjusted_sharpe_like)}.`;
  }

  if (measureKey === "sortino") {
    return `Focuses on downside volatility, with a Sortino-style score of ${displayNumber(player.risk_adjusted_sortino_like)}.`;
  }

  return `Good mix of projected points (${expected}), reliability (${reliability}), and risk (${risk}).`;
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

function exportedPlayer(player) {
  return {
    id: player.id,
    name: player.name,
    position: player.position,
    country: playerCountryText(player),
    club: player.club,
    price: value(player.price),
    projected_points: value(player.risk_adjusted_expected_points_estimate),
    risk_score: value(player.risk_composite_score),
    captain_score: Number(captainScore(player).toFixed(1))
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

function exportCaptain(starters) {
  const captain = [...starters]
    .filter((player) => player.position !== "Goalkeeper")
    .sort((a, b) => captainScore(b) - captainScore(a))[0] || starters[0];

  return captain?.name || "";
}

function scoreAverage(playerList, fieldName) {
  return playerList.length
    ? value(playerList.reduce((sum, player) => sum + value(player[fieldName]), 0) / playerList.length).toFixed(1)
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

  return `Generated by Optimizer v0 using ${activeMeasure().label}. The squad costs ${budgetText(totalPrice)} with ${remainingBudgetText(totalPrice)} remaining. Country counts: ${countryCounts || "none"}. Current data is a public preview test dataset, not final World Cup squad data.`;
}

function teamExportPayload() {
  const tacticName = tacticSelect.value;
  const starters = [...currentRenderedTeam];
  const bench = [...currentBenchPlayers];
  const squad = [...starters, ...bench];
  const totalPrice = squadCost(squad);
  const captain = exportCaptain(starters);

  return {
    site_name: "World Cup Fantasy Helper",
    user_prompt: "Build a fantasy squad using the current Team Builder settings.",
    team_name: `World Cup Fantasy Helper ${tacticName} Draft`,
    formation: tacticName,
    players: squad.map(exportedPlayer),
    starting_11: starters.map(exportedPlayer),
    bench: bench.map(exportedPlayer),
    captain,
    total_price: Number(totalPrice.toFixed(1)),
    remaining_budget: Number((initialBudget - totalPrice).toFixed(1)),
    strategy: activeMeasure().label,
    risk_score: Number(scoreAverage(squad, "risk_composite_score")),
    attack_score: roleScore(starters, ["Midfielder", "Forward"]),
    defense_score: roleScore(starters, ["Goalkeeper", "Defender"]),
    rule_checks: ruleChecksForExport(starters, bench, tacticName),
    explanation: exportExplanation(starters, bench),
    data_sources: [
      "players.json",
      "playersData.js",
      "dataSources.md",
      "Current public preview uses EPL/FPL-style test player data."
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

  if (currentRenderMode !== "built" || !squad.length) {
    showBuilderWarning("Build a squad before exporting Team JSON.");
    return;
  }

  const payload = teamExportPayload();
  const jsonText = JSON.stringify(payload, null, 2);

  teamExportOutput.value = jsonText;
  teamExportPanel.classList.remove("hidden");
  teamMessage.textContent = "Team JSON export ready. A download was created and the export preview is shown in the Team Builder controls.";
  downloadJsonFile("world-cup-fantasy-team.json", jsonText);
}

function renderMeasureOptions() {
  const simpleMeasureKeys = ["balanced", "expected", "safe", "upside", "minutes"];
  const advancedMeasureKeys = ["sharpe", "sortino", "lowTailRisk"];
  const renderOptions = (keys) => keys
    .map((key) => `<option value="${key}">${measures[key].optionLabel || measures[key].label}</option>`)
    .join("");
  const measureOptions = `
    <optgroup label="Simple fantasy styles">
      ${renderOptions(simpleMeasureKeys)}
    </optgroup>
    <optgroup label="Advanced model styles">
      ${renderOptions(advancedMeasureKeys)}
    </optgroup>
  `;

  measureSelect.innerHTML = measureOptions;
  adviceMeasureSelect.innerHTML = measureOptions;
}

function renderCardStatOptions() {
  cardStatSelect.innerHTML = Object.entries(cardStats)
    .map(([key, stat]) => `<option value="${key}">${stat.label}</option>`)
    .join("");
}

function renderMeasureInfo() {
  const measure = activeMeasure();
  const secondaryLabel = measure.secondaryLabel
    ? `<span class="measure-info__secondary">${measure.secondaryLabel}</span>`
    : "";

  measureInfo.innerHTML = `
    <strong>${measure.label}</strong>
    ${secondaryLabel}
    <p>${measure.description}</p>
    <p><strong>How it is calculated:</strong> ${measure.formula}</p>
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
      "example downside protection pick sortino style on the page"
    ],
    "projected": ["example projected"],
    "best value": ["example best value"],
    "highest risk in test data": ["example highest risk in test data"]
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

function availableFillCandidates(position, usedIds, countryCounts = null) {
  return players.filter((player) =>
    player.position === position &&
    !usedIds.has(player.id) &&
    !excludedPlayerIds.has(player.id) &&
    priceMatchesFilters(player) &&
    (!countryCounts || canAddCountry(player, countryCounts))
  );
}

function toggleScoreInfo() {
  const isHidden = scoreInfo.classList.toggle("hidden");
  scoreInfoButton.setAttribute("aria-expanded", String(!isHidden));
}

function renderPlayerPicker() {
  const measure = activeMeasure();
  const searchValue = playerSearch.value.trim().toLowerCase();
  const visiblePlayers = sortPlayers(players, measure)
    .filter((player) => !excludedPlayerIds.has(player.id))
    .filter((player) => selectedPositionFilter === "All" || player.position === selectedPositionFilter)
    .filter(priceMatchesFilters)
    .filter((player) => playerSearchText(player).includes(searchValue))
    .slice(0, 80);

  if (!visiblePlayers.length) {
    playerPicker.innerHTML = `
      <p class="empty-picker">No players match these filters yet. Try changing the position, price range, or search text.</p>
    `;
    return;
  }

  playerPicker.innerHTML = visiblePlayers.map((player) => {
    const isChecked = lockedPlayerIds.has(player.id) ? "checked" : "";

    return `
      <label class="player-option">
        <input type="checkbox" value="${player.id}" ${isChecked} />
        <span>
          <strong>${player.name}</strong>
          <small>${player.position} · ${player.club} · ${playerCountryText(player)}</small>
        </span>
        <span class="player-option__metrics">
          <em><span>Price</span>${money(player.price)}</em>
          <em><span>${measure.label}</span>${Math.round(measureScore(player, measure))}</em>
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

function optimizerStateRank(state, measure, tacticName) {
  if (state.squad.length < squadTotalPlayers) {
    const targetCostSoFar = initialBudget * (state.squad.length / squadTotalPlayers);
    const overBudgetPacePenalty = Math.max(0, state.totalPrice - targetCostSoFar) * 8;
    return state.score + Math.max(0, initialBudget - state.totalPrice) * 0.1 - overBudgetPacePenalty;
  }

  const requirements = tactics[tacticName] || {};
  const { starters, starterIds } = chooseStartersFromSquad(state.squad, requirements, measure);
  const bench = state.squad.filter((player) => !starterIds.has(player.id));
  const starterScore = starters.reduce((sum, player) => sum + measureScore(player, measure), 0);
  const benchScore = bench.reduce((sum, player) => sum + measureScore(player, measure), 0);
  const captain = [...starters]
    .filter((player) => player.position !== "Goalkeeper")
    .sort((a, b) => captainScore(b) - captainScore(a))[0];
  const captainBonus = captain ? captainScore(captain) * 0.04 : 0;
  const budgetBuffer = Math.max(0, initialBudget - state.totalPrice) * 0.02;

  return starterScore + benchScore * 0.35 + captainBonus + budgetBuffer;
}

function optimizerSlotOrder(positionCounts) {
  return [...positionOrder]
    .sort((a, b) => squadRequirements[a] - squadRequirements[b])
    .flatMap((position) =>
      Array.from({ length: Math.max(0, squadRequirements[position] - (positionCounts[position] || 0)) }, () => position)
    );
}

function optimizerCandidatePools(measure) {
  return positionOrder.reduce((pools, position) => {
    pools[position] = sortPlayers(
      players.filter((player) =>
        player.position === position &&
        !excludedPlayerIds.has(player.id) &&
        priceMatchesFilters(player)
      ),
      measure
    );
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

  return uniqueStates
    .sort((a, b) => optimizerStateRank(b, measure, tacticName) - optimizerStateRank(a, measure, tacticName))
    .slice(0, 750);
}

// Optimizer v0 searches several legal squad paths instead of accepting the first fill.
function buildSuggestedSquad() {
  const tacticName = tacticSelect.value;
  const requirements = tactics[tacticName];
  const measure = activeMeasure();
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

        if (nextState.totalPrice > initialBudget + 0.001) {
          budgetCouldNotFit = true;
          return;
        }

        nextStates.push(nextState);
      });
    });

    if (!nextStates.length) {
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

function updateControlStates() {
  clearLockedButton.classList.toggle("hidden", lockedPlayerIds.size === 0);
  clearLockedButton.disabled = lockedPlayerIds.size === 0;
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

function renderWarning(tacticName, ignoredLockedPlayers, missingStarterSlots, missingSquadSlots = 0, budgetInfo = {}, countryInfo = {}, optimizerInfo = {}) {
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
    messages.push(`Optimizer v0 could not find a full legal ${squadLabel()} with the current locks, filters, removals, budget, and country limit.`);
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

  return `
    <article class="player-card player-card--selectable" role="button" tabindex="0" data-area="starter" data-position="${position}" data-slot-index="${slotIndex}" data-player-id="${player.id}" style="top: ${slot.top}; left: ${slot.left};">
      <span class="player-card__role">${player.position}</span>
      <strong>${player.name}</strong>
      <p>${playerCountryText(player)} · ${player.club}</p>
      <p class="player-card__price">Price ${money(player.price)}</p>
      <p>${stat.label}: ${displayNumber(stat.value(player))}</p>
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

  return `
    <article class="bench-card bench-card--selectable" role="button" tabindex="0" data-area="bench" data-position="${position}" data-slot-index="${slotIndex}" data-player-id="${player.id}">
      <span>${player.position}</span>
      <strong>${player.name}</strong>
      <p>${playerCountryText(player)} · ${player.club}</p>
      <small>Price ${money(player.price)} · ${stat.label}: ${displayNumber(stat.value(player))}</small>
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
  currentStarterSlotsByPosition = starterSlotMapForTeam(starters, layout, mode);
  const squad = [...starters, ...bench];
  const totalSlots = Object.values(tactics[tacticName]).reduce((sum, count) => sum + count, 0);
  const missingStarterSlots = Math.max(0, totalSlots - starters.length);
  const missingSquadSlots = mode === "built" ? Math.max(0, squadTotalPlayers - squad.length) : 0;
  const totalPrice = squad.reduce((sum, player) => sum + value(player.price), 0);
  const isOverBudget = mode === "built" && totalPrice > initialBudget + 0.001;
  const averageRisk = squad.length
    ? squad.reduce((sum, player) => sum + value(player.risk_composite_score), 0) / squad.length
    : 0;

  currentRenderedTeam = [...starters];
  currentBenchPlayers = [...bench];
  currentIgnoredLockedPlayers = [...ignoredLockedPlayers];
  currentRenderMode = mode;

  teamPlayers.innerHTML = positionOrder.slice().reverse()
    .map((position) => renderPositionRow(position, layout[position], currentStarterSlotsByPosition[position]))
    .join("");

  updateTeamSummary(tacticName, totalPrice, averageRisk, squad.length);
  renderRuleChecks(starters, bench, tacticName);

  teamField.classList.remove("hidden");
  renderBench(bench, benchRequirementsForTactic(tacticName));

  if (mode === "preview" && squad.length === 0) {
    teamMessage.textContent = `Transparent slots show the selected starting tactic. Build My Squad will create a ${squadLabel()} with ${benchLabel()} below.`;
  } else if (mode === "preview") {
    teamMessage.textContent = `Previewing ${squad.length} locked squad player${squad.length === 1 ? "" : "s"}. Click Build My Squad to fill the full ${squadLabel()}.`;
  } else if (missingStarterSlots > 0 || missingSquadSlots > 0) {
    teamMessage.textContent = `Optimizer v0 found ${squad.length} squad player${squad.length === 1 ? "" : "s"} using ${activeMeasure().label}. Some spots are still open because the current locks, filters, removals, budget, or country limit are too tight.`;
  } else if (isOverBudget) {
    teamMessage.textContent = `Optimizer v0 built a ${squadLabel()} using ${activeMeasure().label}, but it is over the ${budgetText(initialBudget)} budget. Try removing expensive locked players or relaxing filters.`;
  } else {
    const pathText = options.optimizerEvaluatedPaths
      ? ` after comparing ${compactCount(options.optimizerEvaluatedPaths)} candidate squad path${options.optimizerEvaluatedPaths === 1 ? "" : "s"}`
      : "";
    teamMessage.textContent = `Optimizer v0 built a ${squadLabel()} within the ${budgetText(initialBudget)} budget using ${activeMeasure().label}${pathText}: ${startingLineupTotal} starters on the field and ${benchLabel()} below.`;
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
    }
  );
  updateSwapPrompt();
}

function renderCurrentSlotState(message) {
  const tacticName = tacticSelect.value;
  const layout = fieldLayoutForTactic(tacticName);
  const starters = compactSlotMap(currentStarterSlotsByPosition);
  const bench = compactSlotMap(currentBenchSlotsByPosition);
  const squad = [...starters, ...bench];
  const totalPrice = squad.reduce((sum, player) => sum + value(player.price), 0);
  const averageRisk = squad.length
    ? squad.reduce((sum, player) => sum + value(player.risk_composite_score), 0) / squad.length
    : 0;

  currentRenderedTeam = starters;
  currentBenchPlayers = bench;
  currentIgnoredLockedPlayers = [];
  currentRenderMode = "built";

  teamPlayers.innerHTML = positionOrder.slice().reverse()
    .map((position) => renderPositionRow(position, layout[position], currentStarterSlotsByPosition[position]))
    .join("");

  updateTeamSummary(tacticName, totalPrice, averageRisk, squad.length);
  renderRuleChecks(starters, bench, tacticName);

  teamField.classList.remove("hidden");
  renderBenchSlots(currentBenchSlotsByPosition);
  builderWarning.classList.add("hidden");
  builderWarning.textContent = "";
  teamMessage.textContent = message;
  updateSwapPrompt();
  updateControlStates();
  renderRemovedPlayers();
}

// This preview appears as soon as someone locks players, before building the full team.
function renderLockedPreview() {
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

function renderCaptainPicks() {
  const captainCandidates = [...players]
    .filter((player) => player.position !== "Goalkeeper")
    .sort((a, b) => captainScore(b) - captainScore(a));

  captainTableBody.innerHTML = captainCandidates.slice(0, 6).map((player, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${player.name}</td>
      <td>${playerCountryText(player)}</td>
      <td>${player.club}</td>
      <td>${displayNumber(captainScore(player))}</td>
      <td>${value(player.euro_style_reliability_score)}</td>
      <td>${value(player.euro_style_points_per90_estimate)}</td>
      <td>${value(player.risk_composite_score)}</td>
    </tr>
  `).join("");
}

function renderDashboardSections() {
  const usedPlayerIds = new Set();
  const pickUniquePlayer = (playerList) => {
    const player = playerList.find((candidate) => !usedPlayerIds.has(candidate.id)) || playerList[0];
    if (player) {
      usedPlayerIds.add(player.id);
    }
    return player;
  };
  const bestOverallPick = pickUniquePlayer(sortPlayers(players, measures.balanced));
  const captainPick = pickUniquePlayer(
    [...players]
      .filter((player) => player.position !== "Goalkeeper")
      .sort((a, b) => captainScore(b) - captainScore(a))
  );
  const reliablePick = pickUniquePlayer(sortPlayers(players, measures.safe));
  const valuePick = sortPlayers(players, {
    score: (player) => measureScore(player, measures.balanced) / Math.max(value(player.price), 1)
  }).find((player) => !usedPlayerIds.has(player.id)) || players[0];
  const highestRiskPick = [...players].sort((a, b) =>
    value(b.risk_composite_score) - value(a.risk_composite_score)
  )[0];

  dashboardGrid.innerHTML = [
    {
      label: "Best Overall",
      player: bestOverallPick,
      stat: `Best overall score: ${displayNumber(bestOverallPick.risk_adjusted_overall_score)}`,
      reason: "Top blend of projected points, reliability, and risk in the current dataset."
    },
    {
      label: "Captain Candidate",
      player: captainPick,
      stat: `Captain score: ${displayNumber(captainScore(captainPick))}`,
      reason: "Strong captain-style option with useful projected points and manageable risk."
    },
    {
      label: "Reliable Pick",
      player: reliablePick,
      stat: `Risk: ${displayNumber(reliablePick.risk_composite_score)} · Reliability: ${displayNumber(reliablePick.euro_style_reliability_score)}`,
      reason: "Lower-risk profile with strong reliability."
    },
    {
      label: "Best Value",
      player: valuePick,
      stat: `Value index: ${displayNumber(measureScore(valuePick, measures.balanced) / Math.max(value(valuePick.price), 1))}`,
      reason: "Strong overall score for the price."
    },
    {
      label: "Highest Risk In Test Data",
      player: highestRiskPick,
      stat: `Highest current risk score: ${displayNumber(highestRiskPick.risk_composite_score)}`,
      reason: "Highest relative risk in this test dataset. Check minutes, role, and availability before relying on this pick."
    }
  ].map(({ label, player, stat, reason }) => `
    <article class="info-card">
      <span class="info-card__label">${label}</span>
      <strong>${player.name}</strong>
      <p>${playerCountryText(player)} · ${player.club}</p>
      <p class="info-card__stat">${stat}</p>
      <p>${reason}</p>
    </article>
  `).join("");
}

function renderAdviceTable() {
  const measureKey = adviceMeasureSelect.value || "balanced";
  const positionFilterValue = advicePositionSelect.value || "All";
  const measure = activeAdviceMeasure();
  const advicePlayers = positionFilterValue === "All"
    ? players
    : players.filter((player) => player.position === positionFilterValue);
  const ranked = sortPlayers(advicePlayers, measure);
  const positionLabel = positionFilterValue === "All" ? "all positions" : positionFilterValue.toLowerCase();

  adviceStyleNote.textContent = `Showing ${positionLabel} advice for ${measure.label}. These filters are independent from the Team Builder filters.`;

  adviceTableBody.innerHTML = ranked.slice(0, 8).map((player) => `
    <tr>
      <td>${player.name}</td>
      <td>${playerCountryText(player)}</td>
      <td>${player.position}</td>
      <td>${money(player.price)}</td>
      <td>${displayNumber(measureScore(player, measure))}</td>
      <td>${value(player.risk_adjusted_expected_points_estimate)}</td>
      <td>${value(player.risk_composite_score)}</td>
      <td>${styleReason(player, measureKey)}</td>
    </tr>
  `).join("");

  if (!ranked.length) {
    adviceTableBody.innerHTML = `
      <tr>
        <td colspan="8">No players match this Team Advice filter yet.</td>
      </tr>
    `;
  }
}

function buildTeam() {
  const {
    starters,
    bench,
    ignoredLockedPlayers,
    budgetCouldNotFit,
    countryLimitCouldNotFit,
    optimizerFoundValidSquad,
    optimizerEvaluatedPaths
  } = buildSuggestedSquad();
  selectedSwap = null;
  renderTeam(starters, bench, ignoredLockedPlayers, "built", {
    budgetCouldNotFit,
    countryLimitCouldNotFit,
    optimizerFoundValidSquad,
    optimizerEvaluatedPaths
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
  renderTeam(nextStarters, nextBench, currentIgnoredLockedPlayers, "built");
  swapMessage.textContent = `Swapped ${benchPlayer.name} into the starters and moved ${starter.name} to the bench.`;
}

function handleSquadCardClick(event) {
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

function setupBuilder() {
  organizeStatExamples();

  if (!players.length) {
    teamMessage.textContent = "Player data could not be loaded.";
    buildTeamButtonBottom.disabled = true;
    exportTeamJsonButton.disabled = true;
    return;
  }

  renderTacticOptions();
  renderPositionFilterOptions();
  updateRuleCopy();
  renderMeasureOptions();
  renderCardStatOptions();
  renderMeasureInfo();
  renderPlayerPicker();
  renderCaptainPicks();
  renderDashboardSections();
  renderAdviceTable();
  renderLockedPreview();
  updateControlStates();
  renderRemovedPlayers();

  buildTeamButtonBottom.addEventListener("click", buildTeam);
  resetTeamButton.addEventListener("click", resetTeam);
  clearLockedButton.addEventListener("click", clearLockedPlayers);
  removeSelectedPlayerButton.addEventListener("click", removeSelectedPlayer);
  exportTeamJsonButton.addEventListener("click", exportTeamJson);
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
  advicePositionSelect.addEventListener("change", renderAdviceTable);
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
  exportTeamJsonButton.disabled = true;
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
