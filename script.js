// The player database comes from playersData.js, which is generated from players.json.
const players = window.PLAYERS_DATA || [];

// These are the tactical shapes the builder can fill.
const tactics = {
  "5-3-2": { Goalkeeper: 1, Defender: 5, Midfielder: 3, Forward: 2 },
  "4-3-3": { Goalkeeper: 1, Defender: 4, Midfielder: 3, Forward: 3 },
  "4-4-2": { Goalkeeper: 1, Defender: 4, Midfielder: 4, Forward: 2 },
  "3-4-3": { Goalkeeper: 1, Defender: 3, Midfielder: 4, Forward: 3 },
  "3-5-2": { Goalkeeper: 1, Defender: 3, Midfielder: 5, Forward: 2 }
};

// A classic fantasy squad has 15 players: 11 starters plus 4 substitutes.
const squadRequirements = {
  Goalkeeper: 2,
  Defender: 5,
  Midfielder: 5,
  Forward: 3
};

const positionOrder = ["Goalkeeper", "Defender", "Midfielder", "Forward"];

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

const buildTeamButtonBottom = document.getElementById("build-team-btn-bottom");
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
const teamField = document.getElementById("team-field");
const teamPlayers = document.getElementById("team-players");
const benchPanel = document.getElementById("bench-panel");
const benchPlayers = document.getElementById("bench-players");
const benchCount = document.getElementById("bench-count");
const swapMessage = document.getElementById("swap-message");
const teamMessage = document.getElementById("team-message");
const summaryTactic = document.getElementById("summary-tactic");
const summaryPrice = document.getElementById("summary-price");
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

function value(number) {
  return Number(number) || 0;
}

function money(number) {
  return `$${value(number).toFixed(1)}`;
}

function displayNumber(number) {
  return value(number).toFixed(1).replace(".0", "");
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

function playerCountryText(player) {
  return displayCountry(player.country);
}

function playerSearchText(player) {
  return `${player.name} ${player.club} ${player.country} ${playerCountryText(player)} ${player.position}`.toLowerCase();
}

function topByPosition(position, measure) {
  return sortPlayers(players.filter((player) => player.position === position), measure)[0];
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

function toggleScoreInfo() {
  const isHidden = scoreInfo.classList.toggle("hidden");
  scoreInfoButton.setAttribute("aria-expanded", String(!isHidden));
}

function renderPlayerPicker() {
  const measure = activeMeasure();
  const searchValue = playerSearch.value.trim().toLowerCase();
  const visiblePlayers = sortPlayers(players, measure)
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

  renderLockedPreview();
}

// Locked players are kept first, but only while they fit the 15-player squad limits.
function getValidLockedSquadPlayers(measure) {
  const lockedPlayers = sortPlayers(
    players.filter((player) => lockedPlayerIds.has(player.id)),
    measure
  );
  const usedByPosition = { Goalkeeper: 0, Defender: 0, Midfielder: 0, Forward: 0 };
  const validLockedPlayers = [];
  const ignoredLockedPlayers = [];

  lockedPlayers.forEach((player) => {
    if (usedByPosition[player.position] < squadRequirements[player.position]) {
      usedByPosition[player.position] += 1;
      validLockedPlayers.push(player);
    } else {
      ignoredLockedPlayers.push(player);
    }
  });

  return { validLockedPlayers, ignoredLockedPlayers, usedByPosition };
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

// Fill each position separately so the final squad always aims for 2-5-5-3.
function buildSuggestedSquad() {
  const tacticName = tacticSelect.value;
  const requirements = tactics[tacticName];
  const measure = activeMeasure();
  const { validLockedPlayers, ignoredLockedPlayers, usedByPosition } =
    getValidLockedSquadPlayers(measure);
  const squad = [...validLockedPlayers];
  const usedIds = new Set(squad.map((player) => player.id));

  Object.entries(squadRequirements).forEach(([position, neededCount]) => {
    const remainingCount = neededCount - usedByPosition[position];
    const candidates = sortPlayers(
      players.filter((player) =>
        player.position === position &&
        !usedIds.has(player.id) &&
        priceMatchesFilters(player)
      ),
      measure
    ).slice(0, remainingCount);

    candidates.forEach((player) => usedIds.add(player.id));
    squad.push(...candidates);
  });

  const { starters, starterIds } = chooseStartersFromSquad(squad, requirements, measure);
  const bench = squad.filter((player) => !starterIds.has(player.id));

  return { starters, bench, squad, ignoredLockedPlayers };
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

function renderWarning(tacticName, ignoredLockedPlayers, missingStarterSlots, missingSquadSlots = 0) {
  const messages = [];

  if (priceFiltersAreInvalid()) {
    messages.push("Minimum price is higher than maximum price, so no filtered players can be suggested.");
  }

  if (ignoredLockedPlayers.length) {
    messages.push(`Some locked players did not fit the 15-player squad limits: ${ignoredLockedPlayers.map((player) => player.name).join(", ")}.`);
  }

  if (missingStarterSlots > 0) {
    messages.push(`${missingStarterSlots} starting slot${missingStarterSlots === 1 ? "" : "s"} could not be filled for ${tacticName}. Try widening the price filters.`);
  }

  if (missingSquadSlots > 0) {
    messages.push(`${missingSquadSlots} squad spot${missingSquadSlots === 1 ? "" : "s"} could not be filled. Try widening the price filters.`);
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
  return {
    Goalkeeper: team.filter((player) => player.position === "Goalkeeper"),
    Defender: team.filter((player) => player.position === "Defender"),
    Midfielder: team.filter((player) => player.position === "Midfielder"),
    Forward: team.filter((player) => player.position === "Forward")
  };
}

function countsByPosition(team) {
  const counts = { Goalkeeper: 0, Defender: 0, Midfielder: 0, Forward: 0 };

  team.forEach((player) => {
    counts[player.position] += 1;
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

  return {
    Goalkeeper: Math.max(0, squadRequirements.Goalkeeper - starterRequirements.Goalkeeper),
    Defender: Math.max(0, squadRequirements.Defender - starterRequirements.Defender),
    Midfielder: Math.max(0, squadRequirements.Midfielder - starterRequirements.Midfielder),
    Forward: Math.max(0, squadRequirements.Forward - starterRequirements.Forward)
  };
}

function renderPlayerCard(player, slot) {
  const stat = activeCardStat();

  return `
    <article class="player-card player-card--selectable" role="button" tabindex="0" data-area="starter" data-player-id="${player.id}" style="top: ${slot.top}; left: ${slot.left};">
      <span class="player-card__role">${player.position}</span>
      <strong>${player.name}</strong>
      <p>${playerCountryText(player)} · ${player.club}</p>
      <p class="player-card__price">Price ${money(player.price)}</p>
      <p>${stat.label}: ${displayNumber(stat.value(player))}</p>
    </article>
  `;
}

function renderPlaceholderCard(position, slot) {
  return `
    <article class="player-card player-card--placeholder" style="top: ${slot.top}; left: ${slot.left};">
      <span class="player-card__role">${position}</span>
      <div class="player-silhouette" aria-hidden="true"></div>
      <strong>Open Slot</strong>
      <p>Lock a ${position.toLowerCase()}</p>
    </article>
  `;
}

function renderBenchCard(player) {
  const stat = activeCardStat();

  return `
    <article class="bench-card bench-card--selectable" role="button" tabindex="0" data-area="bench" data-player-id="${player.id}">
      <span>${player.position}</span>
      <strong>${player.name}</strong>
      <p>${playerCountryText(player)} · ${player.club}</p>
      <small>Price ${money(player.price)} · ${stat.label}: ${displayNumber(stat.value(player))}</small>
    </article>
  `;
}

function renderBenchPlaceholder(position) {
  return `
    <article class="bench-card bench-card--placeholder">
      <span>${position}</span>
      <strong>Bench Slot</strong>
      <p>Build the squad to fill this substitute spot.</p>
    </article>
  `;
}

function renderPositionRow(position, slots, positionPlayers, mode) {
  const slotPlayers = new Array(slots.length).fill(null);
  const startIndex = mode === "preview"
    ? Math.max(0, Math.floor((slots.length - positionPlayers.length) / 2))
    : 0;

  positionPlayers.slice(0, slots.length).forEach((player, index) => {
    const slotIndex = Math.min(startIndex + index, slots.length - 1);
    slotPlayers[slotIndex] = player;
  });

  return slots.map((slot, index) => {
    const player = slotPlayers[index];
    return player ? renderPlayerCard(player, slot) : renderPlaceholderCard(position, slot);
  }).join("");
}

function renderBench(bench, requirements) {
  const groupedBench = playersByPosition(bench);
  const benchCards = [];

  positionOrder.forEach((position) => {
    const positionBench = groupedBench[position];

    for (let index = 0; index < requirements[position]; index += 1) {
      const player = positionBench[index];
      benchCards.push(player ? renderBenchCard(player) : renderBenchPlaceholder(position));
    }
  });

  benchPlayers.innerHTML = benchCards.join("");
  benchCount.textContent = `${bench.length} / 4`;
  benchPanel.classList.remove("hidden");
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
      : "Build a full 15-player squad first, then click a starter and a bench player to swap them.";
    return;
  }

  const selectedPlayer = [...currentRenderedTeam, ...currentBenchPlayers]
    .find((player) => player.id === selectedSwap.playerId);
  const nextArea = selectedSwap.area === "starter" ? "bench player" : "starter";

  swapMessage.textContent = `Selected ${selectedPlayer?.name || "one player"}. Now click a ${nextArea} to try the swap.`;
}

function renderTeam(starters, bench, ignoredLockedPlayers, mode = "built") {
  const tacticName = tacticSelect.value;
  const layout = fieldLayoutForTactic(tacticName);
  const groupedPlayers = playersByPosition(starters);
  const squad = [...starters, ...bench];
  const totalSlots = Object.values(tactics[tacticName]).reduce((sum, count) => sum + count, 0);
  const missingStarterSlots = Math.max(0, totalSlots - starters.length);
  const missingSquadSlots = mode === "built" ? Math.max(0, 15 - squad.length) : 0;
  const totalPrice = squad.reduce((sum, player) => sum + value(player.price), 0);
  const averageRisk = squad.length
    ? squad.reduce((sum, player) => sum + value(player.risk_composite_score), 0) / squad.length
    : 0;

  currentRenderedTeam = [...starters];
  currentBenchPlayers = [...bench];
  currentIgnoredLockedPlayers = [...ignoredLockedPlayers];
  currentRenderMode = mode;

  teamPlayers.innerHTML = ["Forward", "Midfielder", "Defender", "Goalkeeper"]
    .map((position) => renderPositionRow(position, layout[position], groupedPlayers[position], mode))
    .join("");

  summaryTactic.textContent = tacticName;
  summaryPrice.textContent = money(totalPrice);
  summaryRisk.textContent = averageRisk.toFixed(0);
  summaryLocked.textContent = `${squad.length} / 15`;

  teamField.classList.remove("hidden");
  renderBench(bench, benchRequirementsForTactic(tacticName));

  if (mode === "preview" && squad.length === 0) {
    teamMessage.textContent = "Transparent slots show the selected starting tactic. Build My Team will create a 15-player squad with four bench players below.";
  } else if (mode === "preview") {
    teamMessage.textContent = `Previewing ${squad.length} locked squad player${squad.length === 1 ? "" : "s"}. Click Build My Team to fill the full 15-player squad.`;
  } else if (missingStarterSlots > 0 || missingSquadSlots > 0) {
    teamMessage.textContent = `Built ${squad.length} squad player${squad.length === 1 ? "" : "s"} using ${activeMeasure().label}. Some spots are still open because the filters are too tight.`;
  } else {
    teamMessage.textContent = `Built a 15-player squad using ${activeMeasure().label}: 11 starters on the field and 4 substitutes below.`;
  }

  renderWarning(
    tacticName,
    ignoredLockedPlayers,
    mode === "built" ? missingStarterSlots : 0,
    missingSquadSlots
  );
  updateSwapPrompt();
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
  const { starters, bench, ignoredLockedPlayers } = buildSuggestedSquad();
  selectedSwap = null;
  renderTeam(starters, bench, ignoredLockedPlayers);
}

function showBuilderWarning(message) {
  builderWarning.classList.remove("hidden");
  builderWarning.textContent = message;
}

function findCurrentPlayer(playerId) {
  return [...currentRenderedTeam, ...currentBenchPlayers]
    .find((player) => player.id === playerId);
}

function swapStarterWithBench(starterId, benchId) {
  if (currentRenderMode !== "built") {
    selectedSwap = null;
    updateSwapPrompt();
    showBuilderWarning("Build the full 15-player squad before trying substitutions.");
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
    showBuilderWarning("That swap would create a formation this simple builder does not support yet. Try a same-position swap or a swap that creates 5-3-2, 4-3-3, 4-4-2, 3-4-3, or 3-5-2.");
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
    showBuilderWarning("Build the full 15-player squad before trying substitutions.");
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

function setupBuilder() {
  organizeStatExamples();

  if (!players.length) {
    teamMessage.textContent = "Player data could not be loaded.";
    buildTeamButtonBottom.disabled = true;
    return;
  }

  renderMeasureOptions();
  renderCardStatOptions();
  renderMeasureInfo();
  renderPlayerPicker();
  renderCaptainPicks();
  renderDashboardSections();
  renderAdviceTable();
  renderLockedPreview();

  buildTeamButtonBottom.addEventListener("click", buildTeam);
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

setupBuilder();
