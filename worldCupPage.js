(function () {
  const data = window.WORLD_CUP_DATA || {};

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function renderGroups() {
    const groupsGrid = document.getElementById("groups-grid");

    if (!groupsGrid) {
      return;
    }

    groupsGrid.innerHTML = (data.groups || []).map((group) => `
      <article class="group-card">
        <h3>Group ${escapeHtml(group.id)}</h3>
        <ol>
          ${(group.teams || []).map((team) => `<li>${escapeHtml(team)}</li>`).join("")}
        </ol>
      </article>
    `).join("");
  }

  function formatDate(dateString) {
    if (!dateString) {
      return "";
    }

    const date = new Date(`${dateString}T12:00:00Z`);

    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(date);
  }

  function fixtureDateTimeLabel(fixture) {
    if (fixture.eastern_datetime_label) {
      return fixture.eastern_datetime_label;
    }

    if (fixture.utc_datetime) {
      const date = new Date(fixture.utc_datetime);
      const readableDate = new Intl.DateTimeFormat("en", {
        timeZone: "America/Toronto",
        month: "short",
        day: "numeric",
        year: "numeric"
      }).format(date);
      const readableTime = new Intl.DateTimeFormat("en", {
        timeZone: "America/Toronto",
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      }).format(date);

      return `${readableDate} · ${readableTime} ET`;
    }

    return `${formatDate(fixture.date)} · ${fixture.local_time} local`;
  }

  function renderFixtures() {
    const fixturesContainer = document.getElementById("fixtures-by-group");

    if (!fixturesContainer) {
      return;
    }

    const fixtures = (data.fixtures || [])
      .filter((fixture) => fixture.stage === "group")
      .slice()
      .sort((a, b) => Number(a.match_number) - Number(b.match_number));

    if (!fixtures.length) {
      fixturesContainer.innerHTML = `
        <div class="method-note">
          <strong>Next data step:</strong>
          Add all group-stage fixtures by group after the full list is reviewed against FIFA's schedule.
        </div>
      `;
      return;
    }

    const groups = data.groups || [];

    fixturesContainer.innerHTML = groups.map((group) => {
      const groupFixtures = fixtures.filter((fixture) => fixture.group === group.id);

      return `
        <details class="fixture-group" ${group.id === "A" ? "open" : ""}>
          <summary>
            <span>Group ${escapeHtml(group.id)}</span>
            <span>${groupFixtures.length} fixtures</span>
          </summary>
          <div class="fixture-list">
            ${groupFixtures.map((fixture) => `
              <article class="fixture-row">
                <div class="fixture-row__meta">
                  <span>Match ${escapeHtml(fixture.match_number)}</span>
                  <time datetime="${escapeHtml(fixture.utc_datetime || `${fixture.date}T${fixture.local_time}`)}">${escapeHtml(fixtureDateTimeLabel(fixture))}</time>
                </div>
                <strong class="fixture-row__teams">${escapeHtml(fixture.team_1)} v ${escapeHtml(fixture.team_2)}</strong>
                <span class="fixture-row__venue">${escapeHtml(fixture.stadium)} · ${escapeHtml(fixture.city)}</span>
              </article>
            `).join("")}
          </div>
        </details>
      `;
    }).join("");
  }

  function renderBracket() {
    const bracketRounds = document.getElementById("bracket-rounds");
    const bracketNote = document.getElementById("bracket-note");

    if (!bracketRounds) {
      return;
    }

    if (bracketNote && data.bracket?.note) {
      bracketNote.textContent = data.bracket.note;
    }

    bracketRounds.innerHTML = (data.bracket?.rounds || []).map((round, index) => `
      <details class="bracket-round" ${index === 0 ? "open" : ""}>
        <summary>${escapeHtml(round.name)}</summary>
        <div class="bracket-match-grid">
          ${(round.matches || []).map((match) => `
            <article class="bracket-match">
              <span>Match ${escapeHtml(match.id)}</span>
              <strong>${escapeHtml(match.path)}</strong>
            </article>
          `).join("")}
        </div>
      </details>
    `).join("");
  }

  function renderSources() {
    const sourceList = document.getElementById("world-cup-sources");
    const checkedDate = document.getElementById("source-checked-date");

    if (checkedDate && data.lastChecked) {
      checkedDate.textContent = data.lastChecked;
    }

    if (!sourceList) {
      return;
    }

    sourceList.innerHTML = (data.sources || []).map((source) => `
      <li>
        <a href="${escapeHtml(source.url)}">${escapeHtml(source.label)}</a>
        <span>${escapeHtml(source.note)}</span>
      </li>
    `).join("");
  }

  renderGroups();
  renderFixtures();
  renderBracket();
  renderSources();
}());
