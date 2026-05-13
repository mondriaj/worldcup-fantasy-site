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

// Each measure has a score function and a beginner explanation for the info panel.
const measures = {
  balanced: {
    label: "Balanced",
    description: "Best all-around option. It tries to balance expected points, confidence, and risk.",
    formula: "Uses risk-adjusted overall score: expected points after risk penalty, plus reliability, plus lower composite risk.",
    score: (player) => value(player.risk_adjusted_overall_score)
  },
  expected: {
    label: "Expected Points",
    description: "Ranks players by estimated points for one match after a risk penalty.",
    formula: "Starts with expected points per appearance, then reduces it when composite risk is high: expected points x (1 - risk / 150).",
    score: (player) => value(player.risk_adjusted_expected_points_estimate)
  },
  safe: {
    label: "Safe Picks",
    description: "Favors steady players with lower risk before chasing upside.",
    formula: "Score = (100 - composite risk) + expected points x 8. Composite risk includes availability, minutes, cards, volatility, and bad-week risk.",
    score: (player) => (100 - value(player.risk_composite_score)) + value(player.risk_adjusted_expected_points_estimate) * 8
  },
  upside: {
    label: "High Upside",
    description: "Looks for players who produce a lot when they are on the field.",
    formula: "Uses estimated fantasy points per 90 minutes. This can favor exciting players, but it may be less safe if they do not play often.",
    score: (player) => value(player.euro_style_points_per90_estimate)
  },
  minutes: {
    label: "Reliable Minutes",
    description: "Looks for players who are more likely to play regularly.",
    formula: "Uses reliability score, built from sample confidence, availability, and minutes risk. Higher means the player appears safer for playing time.",
    score: (player) => value(player.euro_style_reliability_score)
  },
  lowTailRisk: {
    label: "Low Tail Risk",
    description: "Tries to avoid players who have too many very bad weeks.",
    formula: "Score = (100 - tail risk) + expected points x 5. Tail risk uses bad-week rate, 10th percentile points, and the average of the worst 20% of weeks.",
    score: (player) => (100 - value(player.risk_tail_score)) + value(player.risk_adjusted_expected_points_estimate) * 5
  },
  sharpe: {
    label: "Sharpe Style",
    description: "Compares expected points with week-to-week volatility.",
    formula: "Formula: (expected points per appearance - 2) / standard deviation of weekly fantasy points. Higher means more expected reward for each unit of volatility.",
    score: (player) => value(player.risk_adjusted_sharpe_like)
  },
  sortino: {
    label: "Sortino Style",
    description: "Similar to Sharpe Style, but it focuses only on bad volatility.",
    formula: "Formula: (expected points per appearance - 2) / downside deviation. Downside deviation looks at weeks below a simple 2-point target.",
    score: (player) => value(player.risk_adjusted_sortino_like)
  }
};

// This menu controls the extra stat shown on each player card on the field.
const cardStats = {
  balanced: {
    label: "Balanced Score",
    value: (player) => value(player.risk_adjusted_overall_score)
  },
  expected: {
    label: "Expected Points",
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
    label: "Sharpe Style",
    value: (player) => value(player.risk_adjusted_sharpe_like)
  },
  sortino: {
    label: "Sortino Style",
    value: (player) => value(player.risk_adjusted_sortino_like)
  }
};

const lockedPlayerIds = new Set();

const buildTeamButtonBottom = document.getElementById("build-team-btn-bottom");
const tacticSelect = document.getElementById("tactic-select");
const measureSelect = document.getElementById("measure-select");
const adviceMeasureSelect = document.getElementById("advice-measure-select");
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
let currentIgnoredLockedPlayers = [];
let currentRenderMode = "preview";

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

function playerSearchText(player) {
  return `${player.name} ${player.club} ${player.country} ${player.position}`.toLowerCase();
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
    return `Strong estimated points after the risk adjustment: ${expected}.`;
  }

  if (measureKey === "safe") {
    return `Lower risk score of ${risk}, while still keeping useful expected points.`;
  }

  if (measureKey === "upside") {
    return `High production when on the field, with ${per90} estimated points per 90.`;
  }

  if (measureKey === "minutes") {
    return `Good reliability score of ${reliability}, useful when you want likely playing time.`;
  }

  if (measureKey === "lowTailRisk") {
    return `Lower bad-week risk score of ${tailRisk}, useful when avoiding painful downside.`;
  }

  if (measureKey === "sharpe") {
    return `Good reward for the weekly volatility, with a Sharpe-style score of ${displayNumber(player.risk_adjusted_sharpe_like)}.`;
  }

  if (measureKey === "sortino") {
    return `Good reward after focusing on bad volatility, with a Sortino-style score of ${displayNumber(player.risk_adjusted_sortino_like)}.`;
  }

  return `Good mix of expected points (${expected}), reliability (${reliability}), and risk (${risk}).`;
}

function renderMeasureOptions() {
  const measureOptions = Object.entries(measures)
    .map(([key, measure]) => `<option value="${key}">${measure.label}</option>`)
    .join("");

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
  measureInfo.innerHTML = `
    <strong>${measure.label}</strong>
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
      "example balanced style",
      "example expected points style",
      "example safe picks style",
      "example high upside style",
      "example reliable minutes style",
      "example low tail risk style",
      "example sharpe style on the page",
      "example sortino style on the page"
    ],
    "expected": ["example expected"],
    "best value": ["example best value"],
    "risk watch": ["example risk watch"]
  };

  if (exactMatches[statName]?.includes(summary)) {
    return true;
  }

  const shortStatNames = new Set(["price", "risk", "expected", "per 90"]);

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
          <small>${player.position} · ${player.club} · ${player.country}</small>
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

  summaryLocked.textContent = String(lockedPlayerIds.size);
  renderLockedPreview();
}

// Locked players are kept first, but only while they fit the selected tactic.
function getValidLockedPlayers(requirements, measure) {
  const lockedPlayers = sortPlayers(
    players.filter((player) => lockedPlayerIds.has(player.id)),
    measure
  );
  const usedByPosition = { Goalkeeper: 0, Defender: 0, Midfielder: 0, Forward: 0 };
  const validLockedPlayers = [];
  const ignoredLockedPlayers = [];

  lockedPlayers.forEach((player) => {
    if (usedByPosition[player.position] < requirements[player.position]) {
      usedByPosition[player.position] += 1;
      validLockedPlayers.push(player);
    } else {
      ignoredLockedPlayers.push(player);
    }
  });

  return { validLockedPlayers, ignoredLockedPlayers, usedByPosition };
}

// Fill each position separately so every tactic keeps the correct shape.
function buildSuggestedTeam() {
  const tacticName = tacticSelect.value;
  const requirements = tactics[tacticName];
  const measure = activeMeasure();
  const { validLockedPlayers, ignoredLockedPlayers, usedByPosition } =
    getValidLockedPlayers(requirements, measure);
  const team = [...validLockedPlayers];
  const usedIds = new Set(team.map((player) => player.id));

  Object.entries(requirements).forEach(([position, neededCount]) => {
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
    team.push(...candidates);
  });

  return { team, ignoredLockedPlayers };
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
    Defender: evenlySpacedPositions(requirements.Defender, "68%"),
    Midfielder: evenlySpacedPositions(requirements.Midfielder, "46%"),
    Forward: evenlySpacedPositions(requirements.Forward, "22%")
  };
}

function clearTeamPreview() {
  renderTeam([], [], "preview");
}

function renderWarning(tacticName, ignoredLockedPlayers, missingSlots) {
  const messages = [];

  if (priceFiltersAreInvalid()) {
    messages.push("Minimum price is higher than maximum price, so no filtered players can be suggested.");
  }

  if (ignoredLockedPlayers.length) {
    messages.push(`Some locked players did not fit ${tacticName}: ${ignoredLockedPlayers.map((player) => player.name).join(", ")}.`);
  }

  if (missingSlots > 0) {
    messages.push(`${missingSlots} tactic slot${missingSlots === 1 ? "" : "s"} could not be filled. Try widening the price filters.`);
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

function renderPlayerCard(player, slot) {
  const stat = activeCardStat();

  return `
    <article class="player-card" style="top: ${slot.top}; left: ${slot.left};">
      <span class="player-card__role">${player.position}</span>
      <strong>${player.name}</strong>
      <p>${player.country} · ${player.club}</p>
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

function renderTeam(team, ignoredLockedPlayers, mode = "built") {
  const tacticName = tacticSelect.value;
  const layout = fieldLayoutForTactic(tacticName);
  const groupedPlayers = playersByPosition(team);
  const totalSlots = Object.values(tactics[tacticName]).reduce((sum, count) => sum + count, 0);
  const missingSlots = Math.max(0, totalSlots - team.length);
  const totalPrice = team.reduce((sum, player) => sum + value(player.price), 0);
  const averageRisk = team.length
    ? team.reduce((sum, player) => sum + value(player.risk_composite_score), 0) / team.length
    : 0;

  currentRenderedTeam = [...team];
  currentIgnoredLockedPlayers = [...ignoredLockedPlayers];
  currentRenderMode = mode;

  teamPlayers.innerHTML = ["Forward", "Midfielder", "Defender", "Goalkeeper"]
    .map((position) => renderPositionRow(position, layout[position], groupedPlayers[position], mode))
    .join("");

  summaryTactic.textContent = tacticName;
  summaryPrice.textContent = money(totalPrice);
  summaryRisk.textContent = averageRisk.toFixed(0);
  summaryLocked.textContent = String(lockedPlayerIds.size);

  teamField.classList.remove("hidden");
  if (mode === "preview" && team.length === 0) {
    teamMessage.textContent = "Transparent slots show the selected tactic. Lock players to fill them, then click Build My Team.";
  } else if (mode === "preview") {
    teamMessage.textContent = `Previewing ${team.length} locked player${team.length === 1 ? "" : "s"} on the field. Click Build My Team to fill the remaining positions.`;
  } else if (missingSlots > 0) {
    teamMessage.textContent = `Built ${team.length} players using ${activeMeasure().label}. Some slots are still open because the filters are too tight.`;
  } else {
    teamMessage.textContent = `Built ${team.length} players using ${activeMeasure().label}.`;
  }

  renderWarning(tacticName, ignoredLockedPlayers, mode === "built" ? missingSlots : 0);
}

// This preview appears as soon as someone locks players, before building the full team.
function renderLockedPreview() {
  const tacticName = tacticSelect.value;
  const requirements = tactics[tacticName];
  const measure = activeMeasure();
  const { validLockedPlayers, ignoredLockedPlayers } = getValidLockedPlayers(requirements, measure);

  if (!validLockedPlayers.length && !ignoredLockedPlayers.length) {
    clearTeamPreview();
    return;
  }

  renderTeam(validLockedPlayers, ignoredLockedPlayers, "preview");
}

function renderCaptainPicks() {
  const captainCandidates = [...players]
    .filter((player) => player.position !== "Goalkeeper")
    .sort((a, b) => captainScore(b) - captainScore(a));

  captainTableBody.innerHTML = captainCandidates.slice(0, 6).map((player, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${player.name}</td>
      <td>${player.country}</td>
      <td>${player.club}</td>
      <td>${displayNumber(captainScore(player))}</td>
      <td>${value(player.euro_style_reliability_score)}</td>
      <td>${value(player.euro_style_points_per90_estimate)}</td>
      <td>${value(player.risk_composite_score)}</td>
    </tr>
  `).join("");
}

function renderDashboardSections() {
  const measureKey = measureSelect.value || "balanced";
  const measure = activeMeasure();
  const ranked = sortPlayers(players, measure);
  const captainCandidates = sortPlayers(
    players.filter((player) => player.position !== "Goalkeeper"),
    measure
  );
  const defenderPick = topByPosition("Defender", measure);
  const valuePick = sortPlayers(players, {
    score: (player) => measureScore(player, measure) / Math.max(value(player.price), 1)
  })[0];
  const riskWatch = ranked.find((player) => value(player.risk_composite_score) >= 65)
    || [...players].sort((a, b) => value(b.risk_composite_score) - value(a.risk_composite_score))[0];

  dashboardGrid.innerHTML = [
    [`Top ${measure.label}`, ranked[0], styleReason(ranked[0], measureKey)],
    ["Captain Pick", captainCandidates[0], styleReason(captainCandidates[0], measureKey)],
    ["Defender Pick", defenderPick, styleReason(defenderPick, measureKey)],
    ["Best Value", valuePick, `Strong ${measure.label.toLowerCase()} score for the price.`],
    ["Risk Watch", riskWatch, `Higher risk score of ${displayNumber(riskWatch.risk_composite_score)}. Only choose if the upside is worth it.`]
  ].map(([label, player, reason]) => `
    <article class="info-card">
      <span class="info-card__label">${label}</span>
      <strong>${player.name}</strong>
      <p>${player.country} · ${player.club}</p>
      <p>${reason}</p>
    </article>
  `).join("");
}

function renderAdviceTable() {
  const measureKey = adviceMeasureSelect.value || "balanced";
  const measure = activeAdviceMeasure();
  const ranked = sortPlayers(players, measure);

  adviceStyleNote.textContent = `Showing team advice for ${measure.label}. This filter is independent from the Team Builder filter.`;

  adviceTableBody.innerHTML = ranked.slice(0, 8).map((player) => `
    <tr>
      <td>${player.name}</td>
      <td>${player.country}</td>
      <td>${player.position}</td>
      <td>${money(player.price)}</td>
      <td>${displayNumber(measureScore(player, measure))}</td>
      <td>${value(player.risk_adjusted_expected_points_estimate)}</td>
      <td>${value(player.risk_composite_score)}</td>
      <td>${styleReason(player, measureKey)}</td>
    </tr>
  `).join("");
}

function buildTeam() {
  const { team, ignoredLockedPlayers } = buildSuggestedTeam();
  renderTeam(team, ignoredLockedPlayers);
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
  cardStatSelect.addEventListener("change", () => {
    renderTeam(currentRenderedTeam, currentIgnoredLockedPlayers, currentRenderMode);
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
}

setupBuilder();
