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
  renderBracket();
  renderSources();
}());
