import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

const root = process.cwd();
const CHECKED_AT = new Date().toISOString();

const SOURCES = {
  players: {
    source_id: "fifaFantasyPlayersJson",
    source_type: "official_fantasy_player_live_status",
    url: "https://play.fifa.com/json/fantasy/players.json"
  },
  squads: {
    source_id: "fifaFantasySquadsJson",
    source_type: "official_squads",
    url: "https://play.fifa.com/json/fantasy/squads.json"
  },
  rounds: {
    source_id: "fifaFantasyRoundsJson",
    source_type: "official_fantasy_rounds_and_fixtures",
    url: "https://play.fifa.com/json/fantasy/rounds.json"
  }
};

const OUTPUTS = {
  liveMatchdayJson: "data/liveMatchdayStatus_v1.json",
  livePlayerJson: "data/livePlayerStatus_v1.json",
  report: "data/liveMatchdayStatusReport_v1.md",
  liveMatchdayBrowser: "liveMatchdayStatusData.js",
  livePlayerBrowser: "livePlayerStatusData.js"
};

const LOCAL_FILES = {
  officialPlayers: "data/officialFantasyPlayers_v0.json",
  fixtures: "data/fixtures.json"
};

const EXPECTED_MATCH_STATUS_VALUES = new Set(["", "start", "sub", "not_in_squad"]);
const EXPECTED_FIXTURE_STATUS_VALUES = new Set(["scheduled", "playing", "complete", "played", "completed", "postponed", "suspended"]);
const MATERIAL_STATUS_THRESHOLD = 12;

function hasValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function normalizePosition(value) {
  const position = String(value || "").trim().toUpperCase();
  if (["GKP", "GK", "GOALKEEPER", "GOALKEEPERS"].includes(position)) return "GK";
  if (["DEF", "DEFENDER", "DEFENDERS"].includes(position)) return "DEF";
  if (["MID", "MIDFIELDER", "MIDFIELDERS"].includes(position)) return "MID";
  if (["FWD", "FOR", "FORWARD", "FORWARDS", "STRIKER", "STRIKERS"].includes(position)) return "FWD";
  return position || null;
}

function numericOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function integerOrNull(value) {
  const number = numericOrNull(value);
  return Number.isInteger(number) ? number : number === null ? null : Math.trunc(number);
}

function sha256(text) {
  return createHash("sha256").update(text).digest("hex");
}

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function countBy(rows, keyFn) {
  return rows.reduce((counts, row) => {
    const key = keyFn(row);
    const label = hasValue(key) ? String(key) : "none";
    counts[label] = (counts[label] || 0) + 1;
    return counts;
  }, {});
}

function rowsFromJson(data, keys) {
  if (Array.isArray(data)) return data;
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  if (data && typeof data === "object") {
    const values = Object.values(data);
    if (values.length && values.every((value) => value && typeof value === "object" && !Array.isArray(value))) {
      return values;
    }
  }
  return [];
}

async function readJson(relativePath, fallback = null) {
  try {
    return JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
  } catch (error) {
    if (fallback !== null) return fallback;
    throw error;
  }
}

function argValue(name) {
  const prefix = `${name}=`;
  const direct = process.argv.find((arg) => arg.startsWith(prefix));
  if (direct) return direct.slice(prefix.length);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

function normalizeLastModified(value) {
  if (!hasValue(value)) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString().replace(".000Z", "Z");
}

async function fetchJsonSource(source, inputPath = null) {
  const started = Date.now();

  if (inputPath) {
    try {
      const text = await readFile(path.resolve(root, inputPath), "utf8");
      return {
        ...source,
        source_mode: "local_file",
        input_file: inputPath,
        status: null,
        ok: true,
        content_type: "application/json",
        last_modified: null,
        etag: null,
        bytes: text.length,
        sha256: sha256(text),
        elapsed_ms: Date.now() - started,
        parse_error: null,
        json: JSON.parse(text)
      };
    } catch (error) {
      return {
        ...source,
        source_mode: "local_file",
        input_file: inputPath,
        status: null,
        ok: false,
        content_type: null,
        last_modified: null,
        etag: null,
        bytes: 0,
        sha256: null,
        elapsed_ms: Date.now() - started,
        parse_error: error.message,
        json: null
      };
    }
  }

  try {
    const response = await fetch(source.url);
    const text = await response.text();
    let json = null;
    let parse_error = null;

    try {
      json = JSON.parse(text);
    } catch (error) {
      parse_error = error.message;
    }

    return {
      ...source,
      source_mode: "remote_fetch",
      input_file: null,
      status: response.status,
      ok: response.ok && !parse_error,
      content_type: response.headers.get("content-type"),
      last_modified: normalizeLastModified(response.headers.get("last-modified")),
      etag: response.headers.get("etag"),
      bytes: text.length,
      sha256: sha256(text),
      elapsed_ms: Date.now() - started,
      parse_error,
      json
    };
  } catch (error) {
    return {
      ...source,
      source_mode: "remote_fetch",
      input_file: null,
      status: null,
      ok: false,
      content_type: null,
      last_modified: null,
      etag: null,
      bytes: 0,
      sha256: null,
      elapsed_ms: Date.now() - started,
      parse_error: error.message,
      json: null
    };
  }
}

function squadMap(squads) {
  return new Map(squads.map((squad) => [String(squad.id), squad]));
}

function normalizeRoundMap(value, warnings, context) {
  if (!value || typeof value !== "object") {
    return {};
  }

  if (Array.isArray(value)) {
    return value.reduce((roundMap, entry, index) => {
      if (entry && typeof entry === "object" && hasValue(entry.roundId)) {
        roundMap[String(entry.roundId)] = numericOrNull(entry.value ?? entry.selected ?? entry.percentSelected);
      } else if (Number.isFinite(Number(entry))) {
        roundMap[String(index + 1)] = Number(entry);
      } else {
        warnings.push(`${context}: round map array entry ${index} could not be parsed`);
      }
      return roundMap;
    }, {});
  }

  return Object.fromEntries(Object.entries(value).map(([key, rawValue]) => [String(key), numericOrNull(rawValue)]));
}

function normalizeScorerAssistRows(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => ({
    player_id: hasValue(row.playerId) ? String(row.playerId) : hasValue(row.player_id) ? String(row.player_id) : null,
    scorer_id: hasValue(row.scorerId) ? String(row.scorerId) : hasValue(row.scorer_id) ? String(row.scorer_id) : null,
    assist_id: hasValue(row.assistId) ? String(row.assistId) : hasValue(row.assist_id) ? String(row.assist_id) : null,
    minute: numericOrNull(row.minute ?? row.minutes),
    own_goal: Boolean(row.ownGoal ?? row.own_goal),
    penalty: Boolean(row.penalty),
    raw_event_type: row.type || row.eventType || null
  })).filter((row) => Object.values(row).some((value) => value !== null && value !== false));
}

function normalizeLivePlayer(row, teamsById, warnings) {
  const teamId = hasValue(row.squadId) ? String(row.squadId) : "";
  const team = teamsById.get(teamId);
  const firstLastName = [row.firstName, row.lastName].filter(hasValue).join(" ").trim();
  const knownName = row.knownName || "";
  const officialId = hasValue(row.id) ? String(row.id) : "";
  const stats = row.stats && typeof row.stats === "object" ? row.stats : {};
  const roundPoints = normalizeRoundMap(stats.roundPoints, warnings, `player ${officialId || "unknown"} stats.roundPoints`);
  const roundsSelected = normalizeRoundMap(row.roundsSelected, warnings, `player ${officialId || "unknown"} roundsSelected`);

  return {
    official_fantasy_player_id: officialId,
    fifa_player_id: hasValue(row.fifaId) ? String(row.fifaId) : null,
    name: firstLastName || knownName || "",
    display_name: knownName || firstLastName || "",
    first_name: row.firstName || null,
    last_name: row.lastName || null,
    squad_id: teamId || null,
    team_id: teamId || null,
    team_name: team?.name || null,
    team_abbr: team?.abbr || null,
    position: normalizePosition(row.position),
    price: numericOrNull(row.price),
    status: row.status || null,
    matchStatus: row.matchStatus || null,
    percentSelected: numericOrNull(row.percentSelected),
    roundsSelected,
    stats: {
      totalPoints: numericOrNull(stats.totalPoints),
      lastRoundPoints: numericOrNull(stats.lastRoundPoints),
      avgPoints: numericOrNull(stats.avgPoints),
      form: numericOrNull(stats.form),
      roundPoints,
      nextFixtureFromActiveRound: hasValue(stats.nextFixtureFromActiveRound) ? String(stats.nextFixtureFromActiveRound) : null,
      nextFixtureFromScheduledRound: hasValue(stats.nextFixtureFromScheduledRound) ? String(stats.nextFixtureFromScheduledRound) : null
    }
  };
}

function normalizeFixture(round, fixture, localByMatchNumber, localByTeamPair) {
  const fixtureId = hasValue(fixture.id) ? String(fixture.id) : "";
  const matchNumber = integerOrNull(fixture.id);
  const localByNumber = matchNumber ? localByMatchNumber.get(String(matchNumber)) : null;
  const teamPairKey = `${normalizeText(fixture.homeSquadName)}|${normalizeText(fixture.awaySquadName)}`;
  const localByPair = localByTeamPair.get(teamPairKey) || null;
  const localFixture = localByNumber || localByPair || null;

  return {
    round_id: hasValue(round.id) ? String(round.id) : null,
    round_status: round.status || null,
    round_stage: round.stage || null,
    fixture_id: fixtureId || null,
    local_fixture_id: localFixture?.match_id || (matchNumber && matchNumber <= 72 ? `fwc2026-m${String(matchNumber).padStart(3, "0")}` : null),
    match_number: matchNumber,
    local_fixture_match_status: localFixture ? "mapped_to_group_stage_fixture" : matchNumber && matchNumber > 72 ? "outside_group_stage_local_file" : "not_mapped",
    fixture_status: fixture.status || null,
    period: fixture.period || null,
    minutes: numericOrNull(fixture.minutes),
    extra_minutes: numericOrNull(fixture.extraMinutes),
    date: fixture.date || null,
    is_suspended: Boolean(fixture.isSuspended),
    home_squad_id: hasValue(fixture.homeSquadId) ? String(fixture.homeSquadId) : null,
    home_team: fixture.homeSquadName || null,
    home_abbr: fixture.homeSquadAbbr || null,
    away_squad_id: hasValue(fixture.awaySquadId) ? String(fixture.awaySquadId) : null,
    away_team: fixture.awaySquadName || null,
    away_abbr: fixture.awaySquadAbbr || null,
    home_score: numericOrNull(fixture.homeScore),
    away_score: numericOrNull(fixture.awayScore),
    home_penalty_score: numericOrNull(fixture.homePenaltyScore),
    away_penalty_score: numericOrNull(fixture.awayPenaltyScore),
    home_goal_scorers_assists: normalizeScorerAssistRows(fixture.homeGoalScorersAssists),
    away_goal_scorers_assists: normalizeScorerAssistRows(fixture.awayGoalScorersAssists),
    venue_id: hasValue(fixture.venueId) ? String(fixture.venueId) : null,
    venue_name: fixture.venueName || null,
    venue_city: fixture.venueCity || null,
    source_note: "minutes and extra_minutes are fixture match-clock fields, not player minutes"
  };
}

function localFixtureMaps(fixtures) {
  const localByMatchNumber = new Map();
  const localByTeamPair = new Map();

  fixtures.forEach((fixture) => {
    if (hasValue(fixture.match_number)) {
      localByMatchNumber.set(String(fixture.match_number), fixture);
    }
    const teamPairKey = `${normalizeText(fixture.home_team || fixture.team_1)}|${normalizeText(fixture.away_team || fixture.team_2)}`;
    if (teamPairKey !== "|") {
      localByTeamPair.set(teamPairKey, fixture);
    }
  });

  return { localByMatchNumber, localByTeamPair };
}

function normalizeLocalPlayer(row) {
  return {
    official_fantasy_player_id: String(row.official_fantasy_player_id || ""),
    name: row.name || "",
    team_id: hasValue(row.team_id) ? String(row.team_id) : "",
    team_name: row.country || null,
    position: normalizePosition(row.official_fantasy_position),
    price: numericOrNull(row.official_price),
    status: row.selectable_status || row.availability_status || null,
    fifa_player_id: hasValue(row.fifa_player_id) ? String(row.fifa_player_id) : null,
    percentSelected: numericOrNull(row.ownership_percent ?? row.selected_by_percent)
  };
}

function playerSummary(player) {
  return {
    official_fantasy_player_id: player.official_fantasy_player_id,
    name: player.name,
    team_name: player.team_name,
    team_id: player.team_id,
    position: player.position,
    price: player.price,
    status: player.status
  };
}

function changeSummary(id, local, live, field) {
  return {
    official_fantasy_player_id: id,
    name: live.name || local.name,
    team_name: live.team_name || local.team_name,
    field,
    local: local[field] ?? null,
    live: live[field] ?? null
  };
}

function comparePlayers(localPlayers, livePlayers) {
  const localById = new Map(localPlayers
    .map(normalizeLocalPlayer)
    .filter((player) => player.official_fantasy_player_id)
    .map((player) => [player.official_fantasy_player_id, player]));
  const liveById = new Map(livePlayers
    .filter((player) => player.official_fantasy_player_id)
    .map((player) => [player.official_fantasy_player_id, player]));
  const changes = {
    new_players: [],
    removed_players: [],
    name_changes: [],
    price_changes: [],
    position_changes: [],
    selectable_status_changes: [],
    team_changes: [],
    fifa_id_changes: [],
    ownership_changes: []
  };

  for (const [id, live] of liveById.entries()) {
    const local = localById.get(id);
    if (!local) {
      changes.new_players.push(playerSummary(live));
      continue;
    }

    if (normalizeText(local.name) !== normalizeText(live.name)) {
      changes.name_changes.push(changeSummary(id, local, live, "name"));
    }
    if (local.price !== live.price) {
      changes.price_changes.push(changeSummary(id, local, live, "price"));
    }
    if (local.position !== live.position) {
      changes.position_changes.push(changeSummary(id, local, live, "position"));
    }
    if (local.status !== live.status) {
      changes.selectable_status_changes.push(changeSummary(id, local, live, "status"));
    }
    if (local.team_id !== live.team_id || normalizeText(local.team_name) !== normalizeText(live.team_name)) {
      changes.team_changes.push({
        official_fantasy_player_id: id,
        name: live.name || local.name,
        local_team_id: local.team_id,
        live_team_id: live.team_id,
        local_team_name: local.team_name,
        live_team_name: live.team_name
      });
    }
    if ((local.fifa_player_id || null) !== (live.fifa_player_id || null)) {
      changes.fifa_id_changes.push(changeSummary(id, local, live, "fifa_player_id"));
    }
    const ownershipDelta = live.percentSelected === null || local.percentSelected === null
      ? null
      : Number((live.percentSelected - local.percentSelected).toFixed(2));
    if (ownershipDelta !== null && Math.abs(ownershipDelta) >= 0.1) {
      changes.ownership_changes.push({
        official_fantasy_player_id: id,
        name: live.name || local.name,
        local: local.percentSelected,
        live: live.percentSelected,
        delta: ownershipDelta
      });
    }
  }

  for (const [id, local] of localById.entries()) {
    if (!liveById.has(id)) {
      changes.removed_players.push(playerSummary(local));
    }
  }

  return changes;
}

function validateLiveData({ livePlayers, fixtures, localPlayers, parseWarnings }) {
  const localIds = new Set(localPlayers.map((player) => String(player.official_fantasy_player_id || "")).filter(Boolean));
  const warnings = [...parseWarnings];
  const errors = [];
  const unexpectedMatchStatuses = [];
  const unexpectedFixtureStatuses = [];
  const unmappedGroupFixtures = [];
  const unmappedPlayers = [];

  livePlayers.forEach((player) => {
    const status = String(player.matchStatus || "");
    if (!EXPECTED_MATCH_STATUS_VALUES.has(status)) {
      unexpectedMatchStatuses.push({
        official_fantasy_player_id: player.official_fantasy_player_id,
        name: player.name,
        matchStatus: player.matchStatus
      });
    }
    if (player.official_fantasy_player_id && !localIds.has(player.official_fantasy_player_id)) {
      unmappedPlayers.push(playerSummary(player));
    }
  });

  fixtures.forEach((fixture) => {
    const status = String(fixture.fixture_status || "").toLowerCase();
    if (status && !EXPECTED_FIXTURE_STATUS_VALUES.has(status)) {
      unexpectedFixtureStatuses.push({
        fixture_id: fixture.fixture_id,
        match_number: fixture.match_number,
        fixture_status: fixture.fixture_status
      });
    }
    ["home_score", "away_score", "home_penalty_score", "away_penalty_score"].forEach((field) => {
      const value = fixture[field];
      if (value !== null && !Number.isFinite(Number(value))) {
        errors.push(`Fixture ${fixture.fixture_id || "unknown"} has non-numeric ${field}`);
      }
    });
    if (fixture.match_number && fixture.match_number <= 72 && fixture.local_fixture_match_status !== "mapped_to_group_stage_fixture") {
      unmappedGroupFixtures.push({
        fixture_id: fixture.fixture_id,
        match_number: fixture.match_number,
        home_team: fixture.home_team,
        away_team: fixture.away_team
      });
    }
  });

  if (unexpectedMatchStatuses.length) {
    warnings.push(`${unexpectedMatchStatuses.length} players have unexpected matchStatus values`);
  }
  if (unexpectedFixtureStatuses.length) {
    warnings.push(`${unexpectedFixtureStatuses.length} fixtures have unexpected status values`);
  }
  if (unmappedGroupFixtures.length) {
    warnings.push(`${unmappedGroupFixtures.length} group-stage live fixtures did not map to local fixtures`);
  }

  return {
    status: errors.length ? "failed" : warnings.length ? "passed_with_warnings" : "passed",
    errors,
    warnings,
    expected_match_status_values: Array.from(EXPECTED_MATCH_STATUS_VALUES).filter(Boolean),
    unexpected_match_statuses: unexpectedMatchStatuses.slice(0, 20),
    unexpected_match_status_count: unexpectedMatchStatuses.length,
    unexpected_fixture_statuses: unexpectedFixtureStatuses.slice(0, 20),
    unexpected_fixture_status_count: unexpectedFixtureStatuses.length,
    unmapped_live_player_count: unmappedPlayers.length,
    unmapped_live_players_sample: unmappedPlayers.slice(0, 20),
    unmapped_group_fixture_count: unmappedGroupFixtures.length,
    unmapped_group_fixtures_sample: unmappedGroupFixtures.slice(0, 20)
  };
}

function livePointsCoverage(livePlayers) {
  const playersWithTotal = livePlayers.filter((player) => player.stats.totalPoints !== null).length;
  const playersWithLastRound = livePlayers.filter((player) => player.stats.lastRoundPoints !== null).length;
  const playersWithRoundPoints = livePlayers.filter((player) => Object.values(player.stats.roundPoints || {}).some((value) => value !== null)).length;

  return {
    players_with_total_points: playersWithTotal,
    players_with_last_round_points: playersWithLastRound,
    players_with_round_points: playersWithRoundPoints
  };
}

function decideUpdateRecommendation({ changes, livePlayers, fixtures, fetchFailures, validation }) {
  const materialPlayerChangeCounts = {
    new_players: changes.new_players.length,
    removed_players: changes.removed_players.length,
    price_changes: changes.price_changes.length,
    position_changes: changes.position_changes.length,
    selectable_status_changes: changes.selectable_status_changes.length,
    team_changes: changes.team_changes.length,
    fifa_id_changes: changes.fifa_id_changes.length
  };
  const materialPlayerChangeCount = Object.values(materialPlayerChangeCounts).reduce((sum, count) => sum + count, 0);
  const liveNotInSquadCount = livePlayers.filter((player) => player.matchStatus === "not_in_squad").length;
  const fixturesWithScores = fixtures.filter((fixture) => fixture.home_score !== null || fixture.away_score !== null).length;
  const activeFixtures = fixtures.filter((fixture) => ["playing", "played", "completed"].includes(String(fixture.fixture_status || "").toLowerCase())).length;
  const pointsCoverage = livePointsCoverage(livePlayers);
  const reasons = [];

  if (fetchFailures.length || validation.status === "failed") {
    reasons.push("live feed fetch or validation errors need review");
    return {
      primary_recommendation: "manual_review_needed",
      reasons,
      material_player_change_counts: materialPlayerChangeCounts,
      model_rerun_needed_now: false,
      score_prediction_rerun_needed_now: false
    };
  }

  if (materialPlayerChangeCount > 0) {
    reasons.push("player pool/status/price/position/team fields changed compared with local official import");
    return {
      primary_recommendation: "official_player_import_needed",
      secondary_recommendations: ["projection_rebuild_needed", "recommendation_rerun_needed"],
      reasons,
      material_player_change_counts: materialPlayerChangeCounts,
      model_rerun_needed_now: false,
      score_prediction_rerun_needed_now: false
    };
  }

  if (liveNotInSquadCount >= MATERIAL_STATUS_THRESHOLD) {
    reasons.push(`${liveNotInSquadCount} players are marked not_in_squad; review before changing projections`);
    return {
      primary_recommendation: "manual_review_needed",
      reasons,
      material_player_change_counts: materialPlayerChangeCounts,
      model_rerun_needed_now: false,
      score_prediction_rerun_needed_now: false
    };
  }

  if (fixturesWithScores || activeFixtures) {
    reasons.push("fixture score/status changes are display/support data only");
  }
  if (pointsCoverage.players_with_round_points || pointsCoverage.players_with_last_round_points) {
    reasons.push("actual fantasy points are display/support data only");
  }
  if (changes.ownership_changes.length) {
    reasons.push("ownership changes do not trigger model reruns");
  }

  return {
    primary_recommendation: "display_only_refresh",
    reasons: reasons.length ? reasons : ["no material player/model fields changed"],
    material_player_change_counts: materialPlayerChangeCounts,
    model_rerun_needed_now: false,
    score_prediction_rerun_needed_now: false
  };
}

function sourceSummary(source) {
  return {
    source_id: source.source_id,
    source_type: source.source_type,
    source_mode: source.source_mode,
    url: source.url,
    input_file: source.input_file,
    status: source.status,
    ok: source.ok,
    content_type: source.content_type,
    last_modified: source.last_modified,
    etag: source.etag,
    bytes: source.bytes,
    sha256: source.sha256,
    elapsed_ms: source.elapsed_ms,
    parse_error: source.parse_error
  };
}

function writeBrowserData(relativePath, assignments, sourcePaths) {
  const header = [
    "// Generated by scripts/importLiveMatchdayStatus.mjs.",
    `// Source files: ${sourcePaths.join(", ")}`,
    "// Static live/post-match support data for the public site.",
    ""
  ].join("\n");
  const body = Object.entries(assignments)
    .map(([globalName, value]) => `window.${globalName} = ${JSON.stringify(value)};`)
    .join("\n\n");

  return writeFile(path.join(root, relativePath), `${header}${body}\n`);
}

function mdList(items, fallback = "None") {
  if (!items?.length) return fallback;
  return items.map((item) => String(item).startsWith("- ") ? item : `- ${item}`).join("\n");
}

function sampleChangeList(changes) {
  const samples = [];
  [
    ["New players", changes.new_players],
    ["Removed players", changes.removed_players],
    ["Selectable status changes", changes.selectable_status_changes],
    ["Price changes", changes.price_changes],
    ["Position changes", changes.position_changes],
    ["Team changes", changes.team_changes]
  ].forEach(([label, rows]) => {
    if (rows.length) {
      samples.push(`${label}: ${rows.length}${rows[0]?.name ? `, first sample ${rows[0].name}` : ""}`);
    }
  });
  return samples;
}

function reportMarkdown({ matchdayData, playerData, changes, updateDecision, fetchFailures }) {
  const fixtureStatusLines = Object.entries(matchdayData.summary.fixture_status_counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([status, count]) => `- ${status}: ${count}`);
  const roundStatusLines = Object.entries(matchdayData.summary.round_status_counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([status, count]) => `- ${status}: ${count}`);
  const matchStatusLines = Object.entries(playerData.summary.match_status_counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([status, count]) => `- ${status}: ${count}`);
  const statusLines = Object.entries(playerData.summary.player_status_counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([status, count]) => `- ${status}: ${count}`);
  const changeLines = sampleChangeList(changes);

  return `# Live Matchday Status Report v1

Generated: ${CHECKED_AT}

Status: static live/post-match support import. Model predictions, PELE data, recommendations, projections, finance metrics, Team Builder weights, and website formulas were not rerun by this script.

## Sources

${Object.values(matchdayData.sources).map((source) => `- ${source.source_id}: ${source.ok ? "ok" : "failed"}${source.last_modified ? `, last modified ${source.last_modified}` : ""}`).join("\n")}

Fetch failures: ${fetchFailures.length}

## Round And Fixture Status

Rounds imported: ${matchdayData.summary.round_count}
Fixtures imported: ${matchdayData.summary.fixture_count}
Group-stage fixtures mapped locally: ${matchdayData.summary.group_stage_mapped_fixture_count}
Fixtures with score fields populated: ${matchdayData.summary.fixtures_with_scores}
Completed/played fixtures: ${matchdayData.summary.completed_fixture_count}
Playing fixtures: ${matchdayData.summary.playing_fixture_count}
Scheduled fixtures: ${matchdayData.summary.scheduled_fixture_count}

Round status counts:

${mdList(roundStatusLines)}

Fixture status counts:

${mdList(fixtureStatusLines)}

## Player Live Fields

Players imported: ${playerData.summary.player_count}
Players with total points: ${playerData.summary.players_with_total_points}
Players with last-round points: ${playerData.summary.players_with_last_round_points}
Players with round-points maps: ${playerData.summary.players_with_round_points}
Ownership changes >= 0.1 percentage points: ${playerData.summary.ownership_change_count}

Player status counts:

${mdList(statusLines)}

matchStatus counts:

${mdList(matchStatusLines)}

## Material Change Check

Update recommendation: \`${updateDecision.primary_recommendation}\`
Secondary recommendations: ${(updateDecision.secondary_recommendations || []).length ? updateDecision.secondary_recommendations.map((item) => `\`${item}\``).join(", ") : "none"}
Model rerun needed now: ${updateDecision.model_rerun_needed_now ? "yes" : "no"}
Score prediction rerun needed now: ${updateDecision.score_prediction_rerun_needed_now ? "yes" : "no"}

Reasons:

${mdList(updateDecision.reasons)}

Material change summary:

${mdList(changeLines)}

## Validation

Validation status: ${matchdayData.validation.status}

Warnings:

${mdList(matchdayData.validation.warnings)}

Errors:

${mdList(matchdayData.validation.errors)}

## Unavailable Fields

The current live import does not provide source-backed injury, doubtful, risk, unavailable-reason, chance-of-playing, actual player minutes, official user locks, official substitutions, captain changes, booster state, or user-specific legality. The player \`status\` field is preserved as selectable-status context when FIFA supplies values such as playing, transferred, or suspended, but the feed does not provide separate suspension reason or return-date detail.

\`matchStatus\` is lineup/status context from the official fantasy player feed. Fixture \`minutes\` and \`extra_minutes\` are match-clock fields and are not player minutes.

## Daily Update Decision Rules

- Fixture score/status only: \`display_only_refresh\`.
- Actual fantasy points only: \`display_only_refresh\`.
- Ownership only: \`display_only_refresh\`.
- matchStatus only: \`display_only_refresh\`, unless many important players need manual review.
- Player pool, selectable status, price, position, or team changes: \`official_player_import_needed\` with projection/recommendation review.
- Rules or scoring changes: run the official monitor and treat as \`manual_review_needed\`.
`;
}

async function main() {
  const inputPlayers = argValue("--players");
  const inputSquads = argValue("--squads");
  const inputRounds = argValue("--rounds");
  const [playersSource, squadsSource, roundsSource, localOfficialPlayersData, localFixturesData] = await Promise.all([
    fetchJsonSource(SOURCES.players, inputPlayers),
    fetchJsonSource(SOURCES.squads, inputSquads),
    fetchJsonSource(SOURCES.rounds, inputRounds),
    readJson(LOCAL_FILES.officialPlayers, {}),
    readJson(LOCAL_FILES.fixtures, {})
  ]);
  const sourceResults = { players: playersSource, squads: squadsSource, rounds: roundsSource };
  const fetchFailures = Object.values(sourceResults).filter((source) => !source.ok);

  if (fetchFailures.length) {
    const failureText = fetchFailures.map((source) => `${source.source_id}: ${source.parse_error || source.status || "unknown failure"}`).join("; ");
    throw new Error(`Live matchday import failed: ${failureText}`);
  }

  const rawPlayers = rowsFromJson(playersSource.json, ["players", "officialFantasyPlayers", "data"]);
  const rawSquads = rowsFromJson(squadsSource.json, ["squads", "teams", "data"]);
  const rawRounds = rowsFromJson(roundsSource.json, ["rounds", "data"]);
  const localOfficialPlayers = rowsFromJson(localOfficialPlayersData, ["officialFantasyPlayers", "players", "official_fantasy_players"]);
  const localFixtures = rowsFromJson(localFixturesData, ["fixtures"]);
  const teamsById = squadMap(rawSquads);
  const parseWarnings = [];
  const livePlayers = rawPlayers
    .map((row) => normalizeLivePlayer(row, teamsById, parseWarnings))
    .filter((player) => player.official_fantasy_player_id);
  const { localByMatchNumber, localByTeamPair } = localFixtureMaps(localFixtures);
  const rounds = rawRounds.map((round) => ({
    round_id: hasValue(round.id) ? String(round.id) : null,
    status: round.status || null,
    startDate: round.startDate || null,
    endDate: round.endDate || null,
    stage: round.stage || null,
    fixture_count: Array.isArray(round.tournaments) ? round.tournaments.length : 0
  }));
  const fixtures = rawRounds.flatMap((round) => rowsFromJson(round.tournaments || [], ["tournaments"])
    .map((fixture) => normalizeFixture(round, fixture, localByMatchNumber, localByTeamPair)));
  const playerChanges = comparePlayers(localOfficialPlayers, livePlayers);
  const validation = validateLiveData({ livePlayers, fixtures, localPlayers: localOfficialPlayers, parseWarnings });
  const pointsCoverage = livePointsCoverage(livePlayers);
  const fixtureStatusCounts = countBy(fixtures, (fixture) => fixture.fixture_status);
  const roundStatusCounts = countBy(rounds, (round) => round.status);
  const completedStatuses = new Set(["complete", "played", "completed"]);
  const playingStatuses = new Set(["playing"]);
  const scheduledStatuses = new Set(["scheduled"]);
  const matchdaySources = Object.fromEntries(Object.entries(sourceResults).map(([key, source]) => [key, sourceSummary(source)]));
  const updateDecision = decideUpdateRecommendation({
    changes: playerChanges,
    livePlayers,
    fixtures,
    fetchFailures,
    validation
  });
  const matchdayData = {
    schema_version: "live_matchday_status_v1",
    generated_at: CHECKED_AT,
    source_checked: CHECKED_AT,
    data_status: "static_live_post_match_support",
    sources: matchdaySources,
    summary: {
      round_count: rounds.length,
      fixture_count: fixtures.length,
      group_stage_mapped_fixture_count: fixtures.filter((fixture) => fixture.local_fixture_match_status === "mapped_to_group_stage_fixture").length,
      fixtures_with_scores: fixtures.filter((fixture) => fixture.home_score !== null || fixture.away_score !== null).length,
      completed_fixture_count: fixtures.filter((fixture) => completedStatuses.has(String(fixture.fixture_status || "").toLowerCase())).length,
      playing_fixture_count: fixtures.filter((fixture) => playingStatuses.has(String(fixture.fixture_status || "").toLowerCase())).length,
      scheduled_fixture_count: fixtures.filter((fixture) => scheduledStatuses.has(String(fixture.fixture_status || "").toLowerCase())).length,
      round_status_counts: roundStatusCounts,
      fixture_status_counts: fixtureStatusCounts,
      has_fixture_match_clock: fixtures.some((fixture) => fixture.minutes !== null || fixture.extra_minutes !== null),
      has_penalty_scores: fixtures.some((fixture) => fixture.home_penalty_score !== null || fixture.away_penalty_score !== null)
    },
    update_decision: updateDecision,
    validation,
    rounds,
    fixtures
  };
  const playerData = {
    schema_version: "live_player_status_v1",
    generated_at: CHECKED_AT,
    source_checked: CHECKED_AT,
    data_status: "static_live_player_points_and_match_status",
    sources: matchdaySources,
    summary: {
      player_count: livePlayers.length,
      player_status_counts: countBy(livePlayers, (player) => player.status),
      match_status_counts: countBy(livePlayers, (player) => player.matchStatus),
      players_with_total_points: pointsCoverage.players_with_total_points,
      players_with_last_round_points: pointsCoverage.players_with_last_round_points,
      players_with_round_points: pointsCoverage.players_with_round_points,
      ownership_change_count: playerChanges.ownership_changes.length,
      new_player_count: playerChanges.new_players.length,
      removed_player_count: playerChanges.removed_players.length,
      selectable_status_change_count: playerChanges.selectable_status_changes.length,
      price_change_count: playerChanges.price_changes.length,
      position_change_count: playerChanges.position_changes.length,
      team_change_count: playerChanges.team_changes.length
    },
    update_decision: updateDecision,
    validation,
    comparison_to_local_official_import: {
      source_file: LOCAL_FILES.officialPlayers,
      local_player_count: localOfficialPlayers.length,
      changes: {
        ...playerChanges,
        ownership_changes: playerChanges.ownership_changes.slice(0, 100)
      },
      ownership_change_count: playerChanges.ownership_changes.length
    },
    players: livePlayers
  };

  await writeFile(path.join(root, OUTPUTS.liveMatchdayJson), `${JSON.stringify(matchdayData)}\n`);
  await writeFile(path.join(root, OUTPUTS.livePlayerJson), `${JSON.stringify(playerData)}\n`);
  await writeBrowserData(OUTPUTS.liveMatchdayBrowser, {
    LIVE_MATCHDAY_STATUS_DATA: matchdayData
  }, [OUTPUTS.liveMatchdayJson]);
  await writeBrowserData(OUTPUTS.livePlayerBrowser, {
    LIVE_PLAYER_STATUS_DATA: playerData
  }, [OUTPUTS.livePlayerJson]);
  await writeFile(path.join(root, OUTPUTS.report), reportMarkdown({
    matchdayData,
    playerData,
    changes: playerChanges,
    updateDecision,
    fetchFailures
  }));

  const consoleSummary = {
    generated_at: CHECKED_AT,
    outputs: OUTPUTS,
    fixture_count: matchdayData.summary.fixture_count,
    group_stage_mapped_fixture_count: matchdayData.summary.group_stage_mapped_fixture_count,
    fixtures_with_scores: matchdayData.summary.fixtures_with_scores,
    player_count: playerData.summary.player_count,
    match_status_counts: playerData.summary.match_status_counts,
    players_with_round_points: playerData.summary.players_with_round_points,
    update_recommendation: updateDecision.primary_recommendation,
    secondary_recommendations: updateDecision.secondary_recommendations || [],
    validation_status: validation.status,
    content_hash: sha256(stableStringify({
      fixture_count: matchdayData.summary.fixture_count,
      player_count: playerData.summary.player_count,
      updateDecision
    }))
  };

  console.log(JSON.stringify(consoleSummary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
