(function () {
  const data = window.WORLD_CUP_DATA || {};
  const liveData = window.LIVE_MATCHDAY_STATUS_DATA || {};
  const liveFixtures = Array.isArray(liveData.fixtures) ? liveData.fixtures : [];

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function titleFromSnake(value) {
    return String(value || "")
      .replace(/[_-]+/g, " ")
      .replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
  }

  function displayNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? String(number) : "";
  }

  function liveFixtureLookupKeys(fixture) {
    const keys = [
      fixture?.local_fixture_id,
      fixture?.match_id,
      fixture?.match_number,
      fixture?.match_number ? `fwc2026-m${String(fixture.match_number).padStart(3, "0")}` : null
    ]
      .filter((valueToCheck) => valueToCheck !== null && valueToCheck !== undefined && String(valueToCheck).trim())
      .map((valueToCheck) => String(valueToCheck).trim());

    return Array.from(new Set(keys));
  }

  function buildLiveFixtureLookup(fixtures) {
    return fixtures.reduce((lookup, fixture) => {
      liveFixtureLookupKeys(fixture).forEach((key) => {
        if (!lookup.has(key)) {
          lookup.set(key, fixture);
        }
      });
      return lookup;
    }, new Map());
  }

  const liveFixtureLookup = buildLiveFixtureLookup(liveFixtures);

  function liveFixtureForFixture(fixture) {
    const keys = [
      fixture?.match_number,
      fixture?.match_number ? `fwc2026-m${String(fixture.match_number).padStart(3, "0")}` : null
    ].filter(Boolean).map(String);

    for (const key of keys) {
      const liveFixture = liveFixtureLookup.get(key);
      if (liveFixtureMatchesLocalFixture(liveFixture, fixture)) {
        return liveFixture;
      }
    }

    return null;
  }

  function localFixtureIdFromMatchNumber(matchNumber) {
    const number = Number(matchNumber);
    return Number.isFinite(number) && number > 0 ? `fwc2026-m${String(number).padStart(3, "0")}` : "";
  }

  function isSafeMappedFinalFixture(fixture) {
    if (!fixture) {
      return false;
    }

    const mappingStatus = String(fixture.mapping_status || "").toLowerCase();
    const fixtureStatus = String(fixture.fixture_status || "").toLowerCase();

    return ["matched", "matched_reversed"].includes(mappingStatus) &&
      fixture.safe_to_display_score === true &&
      ["complete", "completed", "played"].includes(fixtureStatus) &&
      Boolean(fixture.local_fixture_id || fixture.match_id || fixture.match_number);
  }

  function liveFixtureMatchesLocalFixture(liveFixture, fixture) {
    if (!isSafeMappedFinalFixture(liveFixture) || !fixture) {
      return false;
    }

    const liveLocalId = String(liveFixture.local_fixture_id || liveFixture.match_id || localFixtureIdFromMatchNumber(liveFixture.match_number) || "");
    const fixtureLocalId = localFixtureIdFromMatchNumber(fixture.match_number);
    const liveMatchNumber = Number(liveFixture.match_number);
    const fixtureMatchNumber = Number(fixture.match_number);
    const localIdMatches = liveLocalId && fixtureLocalId && liveLocalId === fixtureLocalId;
    const matchNumberMatches = Number.isFinite(liveMatchNumber) && Number.isFinite(fixtureMatchNumber) && liveMatchNumber === fixtureMatchNumber;

    if (!localIdMatches && !matchNumberMatches) {
      return false;
    }

    const liveHome = normalizeText(liveFixture.local_home_team || liveFixture.home_team || "");
    const liveAway = normalizeText(liveFixture.local_away_team || liveFixture.away_team || "");
    const localHome = normalizeText(fixture.team_1 || "");
    const localAway = normalizeText(fixture.team_2 || "");

    return Boolean(liveHome && liveAway && localHome && localAway && liveHome === localHome && liveAway === localAway);
  }

  function liveFixtureStatusLabel(fixture) {
    const status = String(fixture?.fixture_status || "").toLowerCase();
    const period = String(fixture?.period || "").toLowerCase();
    const minute = Number(fixture?.minutes);
    const extraMinute = Number(fixture?.extra_minutes);

    if (["complete", "completed", "played"].includes(status)) {
      return "Full time";
    }

    if (status === "playing") {
      const clock = Number.isFinite(minute) && minute > 0
        ? `${displayNumber(minute)}${Number.isFinite(extraMinute) && extraMinute > 0 ? `+${displayNumber(extraMinute)}` : ""}'`
        : "";
      return [period ? titleFromSnake(period) : "Live", clock].filter(Boolean).join(" ");
    }

    if (status === "scheduled") {
      return "Scheduled";
    }

    return status ? titleFromSnake(status) : "Status pending";
  }

  function liveFixtureScoreText(fixture) {
    if (!isSafeMappedFinalFixture(fixture)) {
      return "";
    }

    if (fixture?.home_score === null || fixture?.home_score === undefined || fixture?.away_score === null || fixture?.away_score === undefined) {
      return "";
    }

    const home = fixture.home_abbr || fixture.home_team || "Home";
    const away = fixture.away_abbr || fixture.away_team || "Away";
    return `${home} ${displayNumber(fixture.home_score)} - ${displayNumber(fixture.away_score)} ${away}`;
  }

  function liveFixtureContextHtml(fixture) {
    if (!isSafeMappedFinalFixture(fixture)) {
      return "";
    }

    const status = liveFixtureStatusLabel(fixture);
    const score = liveFixtureScoreText(fixture);

    if (!score) {
      return "";
    }

    const label = ["complete", "completed", "played"].includes(String(fixture.fixture_status || "").toLowerCase())
      ? "Actual"
      : String(fixture.fixture_status || "").toLowerCase() === "playing"
        ? "Live"
        : "Status";

    return `<span class="fixture-row__live">${escapeHtml(label)}: ${escapeHtml([score, status].filter(Boolean).join(" · "))}</span>`;
  }

  function liveFixtureNoteHtml() {
    if (!liveFixtures.length) {
      return "";
    }

    const summary = liveData.summary || {};
    return `
      <div class="method-note fixture-live-note">
        <strong>Static live status:</strong>
        ${escapeHtml(summary.fixtures_with_scores || 0)} scores loaded ·
        ${escapeHtml(summary.completed_fixture_count || 0)} complete ·
        ${escapeHtml(summary.playing_fixture_count || 0)} live.
        Group tables are not recalculated here.
      </div>
    `;
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

    fixturesContainer.innerHTML = `${liveFixtureNoteHtml()}${groups.map((group) => {
      const groupFixtures = fixtures.filter((fixture) => fixture.group === group.id);

      return `
        <details class="fixture-group" ${group.id === "A" ? "open" : ""}>
          <summary>
            <span>Group ${escapeHtml(group.id)}</span>
            <span>${groupFixtures.length} fixtures</span>
          </summary>
          <div class="fixture-list">
            ${groupFixtures.map((fixture) => {
              const liveFixture = liveFixtureForFixture(fixture);
              const liveContext = liveFixtureContextHtml(liveFixture);

              return `
              <article class="fixture-row">
                <div class="fixture-row__meta">
                  <span>Match ${escapeHtml(fixture.match_number)}</span>
                  <time datetime="${escapeHtml(fixture.utc_datetime || `${fixture.date}T${fixture.local_time}`)}">${escapeHtml(fixtureDateTimeLabel(fixture))}</time>
                </div>
                <strong class="fixture-row__teams">${escapeHtml(fixture.team_1)} v ${escapeHtml(fixture.team_2)}</strong>
                <div class="fixture-row__details">
                  <span class="fixture-row__venue">${escapeHtml(fixture.stadium)} · ${escapeHtml(fixture.city)}</span>
                  ${liveContext}
                </div>
              </article>
            `;
            }).join("")}
          </div>
        </details>
      `;
    }).join("")}`;
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
