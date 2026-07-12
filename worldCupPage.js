(function () {
  const data = window.WORLD_CUP_DATA || {};
  const liveData = window.LIVE_MATCHDAY_STATUS_DATA || {};
  const r32Authority = window.R32_FIXTURE_AUTHORITY_DATA || {};
  const r16Authority = window.R16_FIXTURE_AUTHORITY_DATA || {};
  const qfAuthority = window.QF_FIXTURE_AUTHORITY_DATA || {};
  const sfAuthority = window.SF_FIXTURE_AUTHORITY_DATA || {};
  const liveFixtures = Array.isArray(liveData.fixtures) ? liveData.fixtures : [];
  const r32AuthorityFixtures = Array.isArray(r32Authority.fixtures) ? r32Authority.fixtures : [];
  const r16AuthorityFixtures = Array.isArray(r16Authority.fixtures) ? r16Authority.fixtures : [];
  const qfAuthorityFixtures = Array.isArray(qfAuthority.fixtures) ? qfAuthority.fixtures : [];
  const sfAuthorityFixtures = Array.isArray(sfAuthority.fixtures) ? sfAuthority.fixtures : [];

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

  function validLocalFixtureKey(value) {
    const key = String(value || "").trim();
    return /^fwc2026-m\d{3}$/i.test(key) ? key.toLowerCase() : "";
  }

  function liveFixtureLookupKey(fixture) {
    return validLocalFixtureKey(
      fixture?.resolved_local_fixture_key ||
      fixture?.local_fixture_id ||
      fixture?.match_id ||
      localFixtureIdFromMatchNumber(fixture?.match_number)
    );
  }

  function worldCupFixtureKey(fixture) {
    return validLocalFixtureKey(localFixtureIdFromMatchNumber(fixture?.match_number));
  }

  function buildLiveFixtureLookup(fixtures) {
    return fixtures.reduce((lookup, fixture) => {
      const key = liveFixtureLookupKey(fixture);
      if (key && !lookup.has(key)) {
        lookup.set(key, fixture);
      }
      return lookup;
    }, new Map());
  }

  const liveFixtureLookup = buildLiveFixtureLookup(liveFixtures);

  function liveFixtureForFixture(fixture) {
    const key = worldCupFixtureKey(fixture);
    const liveFixture = key ? liveFixtureLookup.get(key) : null;
    if (liveFixtureMatchesLocalFixture(liveFixture, fixture)) {
      return liveFixture;
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

  function isMappedLiveFixture(fixture) {
    if (!fixture) {
      return false;
    }

    const mappingStatus = String(fixture.mapping_status || "").toLowerCase();

    return ["matched", "matched_reversed"].includes(mappingStatus) &&
      Boolean(fixture.local_fixture_id || fixture.match_id || fixture.match_number);
  }

  function liveFixtureMatchesLocalFixture(liveFixture, fixture) {
    if (!isMappedLiveFixture(liveFixture) || !fixture) {
      return false;
    }

    const liveLocalId = liveFixtureLookupKey(liveFixture);
    const fixtureLocalId = worldCupFixtureKey(fixture);

    if (!liveLocalId || !fixtureLocalId || liveLocalId !== fixtureLocalId) {
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
    if (!isMappedLiveFixture(fixture)) {
      return "";
    }

    const fixtureStatus = String(fixture.fixture_status || "").toLowerCase();
    const status = liveFixtureStatusLabel(fixture);

    if (["complete", "completed", "played"].includes(fixtureStatus)) {
      const score = liveFixtureScoreText(fixture);
      return score
        ? `<span class="fixture-row__live fixture-row__live--final">Actual: ${escapeHtml([score, status].filter(Boolean).join(" · "))}</span>`
        : "";
    }

    if (fixtureStatus === "playing") {
      return `<span class="fixture-row__live fixture-row__live--playing">Live: ${escapeHtml([status, "score hidden until final"].filter(Boolean).join(" · "))}</span>`;
    }

    if (fixtureStatus === "scheduled") {
      return `<span class="fixture-row__live fixture-row__live--scheduled">Status: Scheduled</span>`;
    }

    return status
      ? `<span class="fixture-row__live fixture-row__live--status">Status: ${escapeHtml(status)}</span>`
      : "";
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

  function authorityFixtureForMatch(match, fixtures) {
    const matchNumber = Number(match?.id || match?.match_number);
    if (!Number.isFinite(matchNumber)) {
      return null;
    }

    return fixtures.find((fixture) => Number(fixture.bracket_match_number) === matchNumber) || null;
  }

  function r32AuthorityFixtureForMatch(match) {
    return authorityFixtureForMatch(match, r32AuthorityFixtures);
  }

  function r16AuthorityFixtureForMatch(match) {
    return authorityFixtureForMatch(match, r16AuthorityFixtures);
  }

  function qfAuthorityFixtureForMatch(match) {
    return authorityFixtureForMatch(match, qfAuthorityFixtures);
  }

  function sfAuthorityFixtureForMatch(match) {
    return authorityFixtureForMatch(match, sfAuthorityFixtures);
  }

  function authorityTeamLabel(team) {
    return [
      team?.flag || "",
      team?.team || "",
      team?.code ? `(${team.code})` : ""
    ].filter(Boolean).join(" ");
  }

  function renderR32AuthorityMatch(match) {
    const fixture = r32AuthorityFixtureForMatch(match);
    if (!fixture) {
      return `
        <article class="bracket-match">
          <span>Match ${escapeHtml(match.id)}</span>
          <strong>${escapeHtml(match.path)}</strong>
        </article>
      `;
    }

    const localFixture = authorityFixtureLocalFixture(fixture);
    const liveFixture = localFixture ? liveFixtureForFixture(localFixture) : null;
    const liveContext = liveFixtureContextHtml(liveFixture);

    return `
      <article class="bracket-match" data-bracket-slot="${escapeHtml(fixture.bracket_slot_id)}" data-source-fixture-id="${escapeHtml(fixture.source_fixture_id)}">
        <span>${escapeHtml(fixture.bracket_slot_id)} · R32</span>
        <strong>${escapeHtml(authorityTeamLabel(fixture.team_a))} vs ${escapeHtml(authorityTeamLabel(fixture.team_b))}</strong>
        ${liveContext}
        <small>${escapeHtml(fixture.kickoff?.eastern_datetime_label || fixture.kickoff?.source_datetime || "")}</small>
        <small>Winner advances to ${escapeHtml(fixture.winner_advances_to?.bracket_slot_id || "R16")} · ${escapeHtml(fixture.winner_advances_to?.path || "")}</small>
        <small>Feed source ID: ${escapeHtml(fixture.source_fixture_id || "n/a")} · Slot mapped by ${escapeHtml(fixture.derived_from?.mapping_basis || "group rank bracket path")}</small>
      </article>
    `;
  }

  function authorityFixtureLocalFixture(fixture) {
    if (!fixture?.team_a?.team || !fixture?.team_b?.team) {
      return null;
    }

    return {
      match_number: fixture.bracket_match_number,
      team_1: fixture.team_a.team,
      team_2: fixture.team_b.team
    };
  }

  function r16StatusLabel(fixture) {
    const status = String(fixture?.classification || fixture?.status || "pending").replace(/_/g, " ");
    return status.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
  }

  function r16PendingSourcesText(fixture) {
    const pendingSources = Array.isArray(fixture?.pending_sources) ? fixture.pending_sources : [];
    if (pendingSources.length) {
      return `Pending: ${pendingSources.map((source) => source.source_match || source.slot || source).filter(Boolean).join(", ")}`;
    }

    const sourceMatches = Array.isArray(fixture?.source_matches) ? fixture.source_matches : [];
    if (sourceMatches.length) {
      return sourceMatches
        .map((source) => `${source.source_match || "source"} ${source.status || "pending"}`)
        .join(" · ");
    }

    return "Pending remaining R32 results";
  }

  function renderR16AuthorityMatch(match) {
    const fixture = r16AuthorityFixtureForMatch(match);
    if (!fixture) {
      return `
        <article class="bracket-match">
          <span>Match ${escapeHtml(match.id)}</span>
          <strong>${escapeHtml(match.path)}</strong>
        </article>
      `;
    }

    const localFixture = authorityFixtureLocalFixture(fixture);
    const liveFixture = localFixture ? liveFixtureForFixture(localFixture) : null;
    const liveContext = liveFixtureContextHtml(liveFixture);
    const teamAText = fixture.team_a?.team ? authorityTeamLabel(fixture.team_a) : "TBD";
    const teamBText = fixture.team_b?.team ? authorityTeamLabel(fixture.team_b) : "TBD";

    return `
      <article class="bracket-match" data-bracket-slot="${escapeHtml(fixture.bracket_slot_id)}" data-source-fixture-id="${escapeHtml(fixture.source_fixture_id)}">
        <span>${escapeHtml(fixture.bracket_slot_id)} · R16 · ${escapeHtml(r16StatusLabel(fixture))}</span>
        <strong>${escapeHtml(teamAText)} vs ${escapeHtml(teamBText)}</strong>
        ${liveContext || `<small>${escapeHtml(r16PendingSourcesText(fixture))}</small>`}
        <small>Feed source ID: ${escapeHtml(fixture.source_fixture_id || "pending")} · Source IDs are metadata, not bracket match numbers.</small>
      </article>
    `;
  }

  function qfStatusLabel(fixture) {
    const status = String(fixture?.classification || fixture?.status || "pending").replace(/_/g, " ");
    return status.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
  }

  function renderQfAuthorityMatch(match) {
    const fixture = qfAuthorityFixtureForMatch(match);
    if (!fixture) {
      return `
        <article class="bracket-match">
          <span>Match ${escapeHtml(match.id)}</span>
          <strong>${escapeHtml(match.path)}</strong>
        </article>
      `;
    }

    const teamAText = fixture.team_a?.team ? authorityTeamLabel(fixture.team_a) : "TBD";
    const teamBText = fixture.team_b?.team ? authorityTeamLabel(fixture.team_b) : "TBD";
    const kickoffText = fixture.kickoff?.eastern_datetime_label || fixture.kickoff?.source_datetime || "";
    const advancesTo = fixture.winner_advances_to?.bracket_slot_id || "SF";
    const advancesPath = fixture.winner_advances_to?.path || "";
    const localFixture = authorityFixtureLocalFixture(fixture);
    const liveFixture = localFixture ? liveFixtureForFixture(localFixture) : null;
    const liveContext = liveFixtureContextHtml(liveFixture);

    return `
      <article class="bracket-match" data-bracket-slot="${escapeHtml(fixture.bracket_slot_id)}" data-source-fixture-id="${escapeHtml(fixture.source_fixture_id)}">
        <span>${escapeHtml(fixture.bracket_slot_id)} · QF · ${escapeHtml(qfStatusLabel(fixture))}</span>
        <strong>${escapeHtml(teamAText)} vs ${escapeHtml(teamBText)}</strong>
        ${liveContext}
        <small>${escapeHtml(kickoffText)}</small>
        <small>Winner advances to ${escapeHtml(advancesTo)} · ${escapeHtml(advancesPath)}</small>
        <small>Feed source ID: ${escapeHtml(fixture.source_fixture_id || "pending")} · QF Fixture Authority · source IDs are metadata, not bracket match numbers.</small>
      </article>
    `;
  }

  function renderSfAuthorityMatch(match) {
    const fixture = sfAuthorityFixtureForMatch(match);
    if (!fixture) {
      return `
        <article class="bracket-match">
          <span>Match ${escapeHtml(match.id)}</span>
          <strong>${escapeHtml(match.path)}</strong>
        </article>
      `;
    }

    const teamAText = fixture.team_a?.team ? authorityTeamLabel(fixture.team_a) : "TBD";
    const teamBText = fixture.team_b?.team ? authorityTeamLabel(fixture.team_b) : "TBD";
    const kickoffText = fixture.kickoff?.eastern_datetime_label || fixture.kickoff?.source_datetime || "";
    const advancesTo = fixture.winner_advances_to?.bracket_slot_id || "Final";
    const advancesPath = fixture.winner_advances_to?.path || "";
    const localFixture = authorityFixtureLocalFixture(fixture);
    const liveFixture = localFixture ? liveFixtureForFixture(localFixture) : null;
    const liveContext = liveFixtureContextHtml(liveFixture);

    return `
      <article class="bracket-match" data-bracket-slot="${escapeHtml(fixture.bracket_slot_id)}" data-source-fixture-id="${escapeHtml(fixture.source_fixture_id)}">
        <span>${escapeHtml(fixture.bracket_slot_id)} · SF · ${escapeHtml(qfStatusLabel(fixture))}</span>
        <strong>${escapeHtml(teamAText)} vs ${escapeHtml(teamBText)}</strong>
        ${liveContext}
        <small>${escapeHtml(kickoffText)}</small>
        <small>Winner advances to ${escapeHtml(advancesTo)} · ${escapeHtml(advancesPath)}</small>
        <small>Loser advances to ${escapeHtml(fixture.loser_advances_to?.bracket_slot_id || "Third Place")} · ${escapeHtml(fixture.loser_advances_to?.path || "")}</small>
        <small>Feed source ID: ${escapeHtml(fixture.source_fixture_id || "pending")} · SF Fixture Authority · source IDs are metadata, not bracket match numbers.</small>
      </article>
    `;
  }

  function renderBracket() {
    const bracketRounds = document.getElementById("bracket-rounds");
    const bracketNote = document.getElementById("bracket-note");

    if (!bracketRounds) {
      return;
    }

    if (bracketNote) {
      bracketNote.textContent = r32AuthorityFixtures.length
        ? "Round of 32 teams are shown from the locked R32 fixture authority; Round of 16 and Quarterfinal actual scores remain visible; Semifinal slots use the final SF fixture authority. Feed source IDs are metadata, not bracket match numbers."
        : data.bracket?.note || "";
    }

    bracketRounds.innerHTML = (data.bracket?.rounds || []).map((round, index) => `
      <details class="bracket-round" ${index === 0 ? "open" : ""}>
        <summary>${escapeHtml(round.name)}</summary>
        <div class="bracket-match-grid">
          ${(round.matches || []).map((match) => round.name === "Round of 32"
            ? renderR32AuthorityMatch(match)
            : round.name === "Round of 16"
              ? renderR16AuthorityMatch(match)
              : round.name === "Quarter-finals"
                ? renderQfAuthorityMatch(match)
                : round.name === "Semi-finals"
                  ? renderSfAuthorityMatch(match)
            : `
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
