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

const lockedPlayerIds = new Set();

const buildTeamButton = document.getElementById("build-team-btn");
const buildTeamButtonBottom = document.getElementById("build-team-btn-bottom");
const tacticSelect = document.getElementById("tactic-select");
const measureSelect = document.getElementById("measure-select");
const measureInfo = document.getElementById("measure-info");
const scoreInfoButton = document.getElementById("score-info-btn");
const scoreInfo = document.getElementById("score-info");
const playerSearch = document.getElementById("player-search");
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

function value(number) {
  return Number(number) || 0;
}

function money(number) {
  return `$${value(number).toFixed(1)}`;
}

function activeMeasure() {
  return measures[measureSelect.value] || measures.balanced;
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

function renderMeasureOptions() {
  measureSelect.innerHTML = Object.entries(measures)
    .map(([key, measure]) => `<option value="${key}">${measure.label}</option>`)
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

function toggleScoreInfo() {
  const isHidden = scoreInfo.classList.toggle("hidden");
  scoreInfoButton.setAttribute("aria-expanded", String(!isHidden));
}

function renderPlayerPicker() {
  const measure = activeMeasure();
  const searchValue = playerSearch.value.trim().toLowerCase();
  const visiblePlayers = sortPlayers(players, measure)
    .filter((player) => playerSearchText(player).includes(searchValue))
    .slice(0, 80);

  playerPicker.innerHTML = visiblePlayers.map((player) => {
    const isChecked = lockedPlayerIds.has(player.id) ? "checked" : "";

    return `
      <label class="player-option">
        <input type="checkbox" value="${player.id}" ${isChecked} />
        <span>
          <strong>${player.name}</strong>
          <small>${player.position} · ${player.club} · ${player.country}</small>
        </span>
        <em>${Math.round(measureScore(player, measure))}</em>
      </label>
    `;
  }).join("");
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
      players.filter((player) => player.position === position && !usedIds.has(player.id)),
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

// The locked-player preview may have fewer than 11 players, so each row centers only the locked players.
function fieldLayoutForPreview(team) {
  const counts = { Goalkeeper: 0, Defender: 0, Midfielder: 0, Forward: 0 };

  team.forEach((player) => {
    counts[player.position] += 1;
  });

  return {
    Goalkeeper: evenlySpacedPositions(counts.Goalkeeper, "88%"),
    Defender: evenlySpacedPositions(counts.Defender, "68%"),
    Midfielder: evenlySpacedPositions(counts.Midfielder, "46%"),
    Forward: evenlySpacedPositions(counts.Forward, "22%")
  };
}

function clearTeamPreview() {
  teamPlayers.innerHTML = "";
  teamField.classList.add("hidden");
  teamMessage.textContent = "Lock players to preview them on the field, or click Build My Team to generate a full 11-player team.";
  summaryPrice.textContent = money(0);
  summaryRisk.textContent = "0";
  summaryLocked.textContent = String(lockedPlayerIds.size);
  builderWarning.classList.add("hidden");
  builderWarning.textContent = "";
}

function renderWarning(tacticName, ignoredLockedPlayers) {
  if (ignoredLockedPlayers.length) {
    builderWarning.classList.remove("hidden");
    builderWarning.textContent = `Some locked players did not fit ${tacticName}: ${ignoredLockedPlayers.map((player) => player.name).join(", ")}.`;
  } else {
    builderWarning.classList.add("hidden");
    builderWarning.textContent = "";
  }
}

function renderTeam(team, ignoredLockedPlayers, mode = "built") {
  const tacticName = tacticSelect.value;
  const layout = mode === "preview" ? fieldLayoutForPreview(team) : fieldLayoutForTactic(tacticName);
  const positionIndexes = { Goalkeeper: 0, Defender: 0, Midfielder: 0, Forward: 0 };
  const totalPrice = team.reduce((sum, player) => sum + value(player.price), 0);
  const averageRisk = team.length
    ? team.reduce((sum, player) => sum + value(player.risk_composite_score), 0) / team.length
    : 0;

  teamPlayers.innerHTML = team.map((player) => {
    const slot = layout[player.position][positionIndexes[player.position]];
    positionIndexes[player.position] += 1;

    return `
      <article class="player-card" style="top: ${slot.top}; left: ${slot.left};">
        <span class="player-card__role">${player.position}</span>
        <strong>${player.name}</strong>
        <p>${player.country} · ${player.club}</p>
        <p>Score ${value(player.risk_adjusted_overall_score)} · Risk ${value(player.risk_composite_score)}</p>
      </article>
    `;
  }).join("");

  summaryTactic.textContent = tacticName;
  summaryPrice.textContent = money(totalPrice);
  summaryRisk.textContent = averageRisk.toFixed(0);
  summaryLocked.textContent = String(lockedPlayerIds.size);

  teamField.classList.remove("hidden");
  if (mode === "preview") {
    teamMessage.textContent = `Previewing ${team.length} locked player${team.length === 1 ? "" : "s"} on the field. Click Build My Team to fill the remaining positions.`;
  } else {
    teamMessage.textContent = `Built ${team.length} players using ${activeMeasure().label}.`;
  }

  renderWarning(tacticName, ignoredLockedPlayers);
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

function renderDashboardSections() {
  const balanced = sortPlayers(players, measures.balanced);
  const safe = sortPlayers(players, measures.safe)[0];
  const upside = sortPlayers(players, measures.upside)[0];
  const valuePick = sortPlayers(players, {
    score: (player) => value(player.risk_adjusted_expected_points_estimate) / Math.max(value(player.price), 1)
  })[0];
  const avoid = [...players].sort((a, b) => value(b.risk_composite_score) - value(a.risk_composite_score))[0];

  dashboardGrid.innerHTML = [
    ["Best Captain", balanced[0], "Top balanced score"],
    ["Safe Captain", safe, "Low risk with solid expected points"],
    ["Risky Captain", upside, "Highest points-per-90 upside"],
    ["Best Value", valuePick, "Strong expected points for the price"],
    ["Avoid", avoid, "Highest composite risk in the sample"]
  ].map(([label, player, reason]) => `
    <article class="info-card">
      <span class="info-card__label">${label}</span>
      <strong>${player.name}</strong>
      <p>${player.country} · ${player.club}</p>
      <p>${reason}</p>
    </article>
  `).join("");

  captainTableBody.innerHTML = balanced.slice(0, 5).map((player, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${player.name}</td>
      <td>${player.country}</td>
      <td>${player.club}</td>
      <td>${value(player.euro_style_reliability_score)}</td>
      <td>${value(player.euro_style_points_per90_estimate)}</td>
      <td>${value(player.risk_composite_score)}</td>
    </tr>
  `).join("");

  adviceTableBody.innerHTML = balanced.slice(0, 8).map((player) => `
    <tr>
      <td>${player.name}</td>
      <td>${player.country}</td>
      <td>${player.position}</td>
      <td>${money(player.price)}</td>
      <td>${value(player.risk_adjusted_expected_points_estimate)}</td>
      <td>${value(player.risk_composite_score)}</td>
      <td>${player.euro_style_short_reason}</td>
    </tr>
  `).join("");
}

function buildTeam() {
  const { team, ignoredLockedPlayers } = buildSuggestedTeam();
  renderTeam(team, ignoredLockedPlayers);
}

function setupBuilder() {
  if (!players.length) {
    teamMessage.textContent = "Player data could not be loaded.";
    buildTeamButton.disabled = true;
    buildTeamButtonBottom.disabled = true;
    return;
  }

  renderMeasureOptions();
  renderMeasureInfo();
  renderPlayerPicker();
  renderDashboardSections();

  buildTeamButton.addEventListener("click", buildTeam);
  buildTeamButtonBottom.addEventListener("click", buildTeam);
  scoreInfoButton.addEventListener("click", toggleScoreInfo);
  measureSelect.addEventListener("change", () => {
    renderMeasureInfo();
    renderPlayerPicker();
    renderLockedPreview();
  });
  tacticSelect.addEventListener("change", () => {
    summaryTactic.textContent = tacticSelect.value;
    renderLockedPreview();
  });
  playerSearch.addEventListener("input", renderPlayerPicker);
  playerPicker.addEventListener("change", updateLockedPlayers);
}

setupBuilder();
