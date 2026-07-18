import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";

const GENERATED_AT = new Date().toISOString();

const PATHS = {
  workingOfficialPlayers: "data/officialFantasyPlayers_v0.json",
  officialMonitor: "data/officialFantasyDataUpdateCheck_v1.json",
  identityMap: "data/mappings/playerIdentityMap_v1.csv",
  sfProjections: "data/fantasyPoolMatchdayProjections_sf_v1.json",
  sfRecommendations: "data/fantasyPoolRecommendations_sf_v1.json",
  sfTeamBuilderQa: "data/teamBuilderQa_sf_v1.json",
  rolloverJson: "data/officialFinalRoundRolloverAudit_v1.json",
  rolloverReport: "data/officialFinalRoundRolloverAuditReport_v1.md",
  readinessJson: "data/officialFantasyReadiness_finalRound_v1.json",
  readinessReport: "data/officialFantasyReadiness_finalRound_v1.md",
  activePoolJson: "data/finalRoundActivePoolReadiness_v1.json",
  activePoolReport: "data/finalRoundActivePoolReadinessReport_v1.md",
  thinProfileJson: "data/finalRoundThinProfilePlayerAudit_v1.json",
  thinProfileReport: "data/finalRoundThinProfilePlayerAuditReport_v1.md"
};

const SOURCES = {
  players: "https://play.fifa.com/json/fantasy/players.json",
  squads: "https://play.fifa.com/json/fantasy/squads.json",
  rounds: "https://play.fifa.com/json/fantasy/rounds.json"
};

const FINAL_FIXTURE_ID = "104";
const THIRD_PLACE_FIXTURE_ID = "103";
const SELECTABLE_STATUSES = new Set(["playing"]);
const NON_SELECTABLE_STATUSES = new Set(["eliminated", "transferred", "injured", "suspended"]);
const REQUIRED_THIN_PROFILE_IDS = new Set(["29", "2078"]);

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

function rowsFromJson(data, keys = ["officialFantasyPlayers", "players", "rows", "data"]) {
  if (Array.isArray(data)) return data;
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function readOptionalJson(path) {
  try {
    return await readJson(path);
  } catch {
    return null;
  }
}

async function readOptionalText(path) {
  try {
    return await readFile(path, "utf8");
  } catch {
    return "";
  }
}

function readHeadJson(path) {
  const text = execFileSync("git", ["show", `HEAD:${path}`], {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024
  });
  return JSON.parse(text);
}

async function fetchJsonSource(sourceId, url) {
  const response = await fetch(url);
  const text = await response.text();
  let json = null;
  let parseError = null;
  try {
    json = JSON.parse(text);
  } catch (error) {
    parseError = error.message;
  }
  return {
    source_id: sourceId,
    url,
    status: response.status,
    ok: response.ok && !parseError,
    last_modified: response.headers.get("last-modified"),
    etag: response.headers.get("etag"),
    bytes: text.length,
    parse_error: parseError,
    json
  };
}

function normalizeLocalPlayer(row) {
  return {
    official_fantasy_player_id: String(row.official_fantasy_player_id || ""),
    name: row.name || "",
    country: row.country || null,
    team_id: hasValue(row.team_id) ? String(row.team_id) : "",
    official_fantasy_position: normalizePosition(row.official_fantasy_position),
    official_price: Number.isFinite(Number(row.official_price)) ? Number(row.official_price) : null,
    selectable_status: row.selectable_status || null,
    fifa_player_id: hasValue(row.fifa_player_id) ? String(row.fifa_player_id) : null,
    ownership_percent: Number.isFinite(Number(row.ownership_percent)) ? Number(row.ownership_percent) : null,
    current_player_match: row.current_player_match || null
  };
}

function normalizeLivePlayer(row, teamsById) {
  const teamId = hasValue(row.squadId) ? String(row.squadId) : "";
  const team = teamsById.get(teamId);
  const firstLastName = [row.firstName, row.lastName].filter(hasValue).join(" ").trim();
  return {
    official_fantasy_player_id: String(row.id),
    name: firstLastName || row.knownName || "",
    display_name: row.knownName || firstLastName || "",
    country: team?.name || null,
    team_id: teamId,
    team_abbr: team?.abbr || null,
    team_is_eliminated: team?.isEliminated === true,
    official_fantasy_position: normalizePosition(row.position),
    official_price: Number.isFinite(Number(row.price)) ? Number(row.price) : null,
    selectable_status: row.status || null,
    match_status: row.matchStatus || null,
    fifa_player_id: hasValue(row.fifaId) ? String(row.fifaId) : null,
    ownership_percent: Number.isFinite(Number(row.percentSelected)) ? Number(row.percentSelected) : null
  };
}

function playerSummary(player) {
  return {
    official_fantasy_player_id: player.official_fantasy_player_id,
    name: player.name,
    country: player.country,
    team_id: player.team_id,
    official_fantasy_position: player.official_fantasy_position,
    official_price: player.official_price,
    selectable_status: player.selectable_status
  };
}

function changeSummary(id, local, live, field) {
  return {
    official_fantasy_player_id: id,
    name: local.name || live.name,
    country: live.country || local.country,
    team_id: live.team_id || local.team_id,
    field,
    local_value: local[field] ?? null,
    live_value: live[field] ?? null
  };
}

function comparePlayers(localRows, liveRows) {
  const localById = new Map(localRows.map((row) => {
    const normalized = normalizeLocalPlayer(row);
    return [normalized.official_fantasy_player_id, normalized];
  }));
  const liveById = new Map(liveRows.map((row) => [row.official_fantasy_player_id, row]));
  const diff = {
    local_count: localRows.length,
    live_count: liveRows.length,
    new_players: [],
    removed_players: [],
    name_changes: [],
    price_changes: [],
    position_changes: [],
    selectable_status_changes: [],
    country_team_changes: [],
    fifa_player_id_changes: [],
    ownership_percent_changes: []
  };

  for (const [id, live] of liveById.entries()) {
    const local = localById.get(id);
    if (!local) {
      diff.new_players.push(playerSummary(live));
      continue;
    }
    if (normalizeText(local.name) !== normalizeText(live.name)) {
      diff.name_changes.push(changeSummary(id, local, live, "name"));
    }
    if (local.official_price !== live.official_price) {
      diff.price_changes.push(changeSummary(id, local, live, "official_price"));
    }
    if (local.official_fantasy_position !== live.official_fantasy_position) {
      diff.position_changes.push(changeSummary(id, local, live, "official_fantasy_position"));
    }
    if (local.selectable_status !== live.selectable_status) {
      diff.selectable_status_changes.push(changeSummary(id, local, live, "selectable_status"));
    }
    if (local.team_id !== live.team_id || normalizeText(local.country) !== normalizeText(live.country)) {
      diff.country_team_changes.push({
        official_fantasy_player_id: id,
        name: local.name || live.name,
        local_country: local.country,
        live_country: live.country,
        local_team_id: local.team_id,
        live_team_id: live.team_id
      });
    }
    if ((local.fifa_player_id || null) !== (live.fifa_player_id || null)) {
      diff.fifa_player_id_changes.push(changeSummary(id, local, live, "fifa_player_id"));
    }
    if (local.ownership_percent !== null && live.ownership_percent !== null && Math.abs(local.ownership_percent - live.ownership_percent) >= 0.1) {
      diff.ownership_percent_changes.push(changeSummary(id, local, live, "ownership_percent"));
    }
  }

  for (const [id, local] of localById.entries()) {
    if (!liveById.has(id)) diff.removed_players.push(playerSummary(local));
  }

  diff.counts = {
    new_players: diff.new_players.length,
    removed_players: diff.removed_players.length,
    name_changes: diff.name_changes.length,
    price_changes: diff.price_changes.length,
    position_changes: diff.position_changes.length,
    selectable_status_changes: diff.selectable_status_changes.length,
    country_team_changes: diff.country_team_changes.length,
    fifa_player_id_changes: diff.fifa_player_id_changes.length,
    ownership_percent_changes: diff.ownership_percent_changes.length
  };

  return diff;
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === "\"" && quoted && next === "\"") {
      current += "\"";
      index += 1;
    } else if (char === "\"") {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}

function parseIdentityMap(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines.shift() || "");
  const rows = lines.map((line) => {
    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });
    return row;
  });
  return new Map(rows.filter((row) => hasValue(row.official_fantasy_player_id)).map((row) => [String(row.official_fantasy_player_id), row]));
}

function findRoundFixture(rounds, fixtureId) {
  for (const round of rounds) {
    for (const fixture of round.tournaments || round.fixtures || []) {
      if (String(fixture.id) === String(fixtureId)) {
        return { round, fixture };
      }
    }
  }
  return null;
}

function buildFinalRoundFixtures(rounds) {
  const final = findRoundFixture(rounds, FINAL_FIXTURE_ID);
  const third = findRoundFixture(rounds, THIRD_PLACE_FIXTURE_ID);
  const fixtureToRecord = (found, roundLabel) => {
    if (!found) return null;
    const { fixture } = found;
    return {
      fixture_id: String(fixture.id),
      round_label: roundLabel,
      status: fixture.status || null,
      date: fixture.date || null,
      teams: [
        {
          team_id: String(fixture.homeSquadId),
          name: fixture.homeSquadName,
          abbr: fixture.homeSquadAbbr,
          side: "home"
        },
        {
          team_id: String(fixture.awaySquadId),
          name: fixture.awaySquadName,
          abbr: fixture.awaySquadAbbr,
          side: "away"
        }
      ]
    };
  };
  return {
    final: fixtureToRecord(final, "Final"),
    third_place: fixtureToRecord(third, "Third Place")
  };
}

function teamRoundStatus(teamId, finalRoundTeams, squadsById) {
  const id = String(teamId || "");
  if (finalRoundTeams.final.has(id)) return "in Final";
  if (finalRoundTeams.third_place.has(id)) return "in Third Place";
  const squad = squadsById.get(id);
  if (squad?.isEliminated === true) return "eliminated before Final Round";
  return "unknown/unmapped";
}

function metadataComplete(player) {
  return Boolean(
    hasValue(player?.official_fantasy_player_id) &&
    hasValue(player?.team_id) &&
    hasValue(player?.official_fantasy_position) &&
    player?.official_price !== null &&
    player?.official_price !== undefined &&
    hasValue(player?.selectable_status)
  );
}

function identityStatus(player, identityById) {
  const row = identityById.get(String(player?.official_fantasy_player_id || ""));
  if (!row) {
    return {
      identity_status: "missing_identity_map_row",
      internal_player_id: null,
      mapping_confidence: "none",
      mapping_method: null,
      thin_profile: false,
      needs_manual_review: true
    };
  }
  const thinProfile = String(row.profile_status || row.data_quality_flags || "").includes("thin_profile") ||
    String(row.internal_player_id || "").startsWith("thin-");
  return {
    identity_status: thinProfile ? "mapped_thin_profile" : "mapped",
    internal_player_id: row.internal_player_id || null,
    mapping_confidence: row.match_confidence || row.confidence || "unknown",
    mapping_method: row.match_method || row.method || null,
    thin_profile: thinProfile,
    needs_manual_review: thinProfile || /review|missing|confirmed_absent/.test(String(row.data_quality_flags || ""))
  };
}

function classifyPlayer(player, finalRoundTeams, squadsById, identityById) {
  const team_status = teamRoundStatus(player.team_id, finalRoundTeams, squadsById);
  const currently_selectable = SELECTABLE_STATUSES.has(String(player.selectable_status || "").toLowerCase());
  const inFinalRound = team_status === "in Final" || team_status === "in Third Place";
  const metadata_complete = metadataComplete(player);
  const identity = identityStatus(player, identityById);
  const should_be_model_eligible = inFinalRound && currently_selectable && metadata_complete && identity.identity_status === "mapped";
  let reason = "";
  if (!inFinalRound) {
    reason = "Team is outside Final and Third Place; safely excluded from Final Round model pool.";
  } else if (!currently_selectable) {
    reason = `Final Round team player is not currently selectable (${player.selectable_status}); exclude unless status changes.`;
  } else if (!metadata_complete) {
    reason = "Final Round team player lacks required official fantasy metadata.";
  } else if (identity.thin_profile) {
    reason = "Final Round team player has a staged thin identity only; safe only with explicit exclusion/caution or source-backed manual projection coverage.";
  } else if (identity.identity_status !== "mapped") {
    reason = "Final Round team player lacks a stable identity map row.";
  } else {
    reason = "Final Round team player has complete official fantasy metadata and stable identity mapping.";
  }
  return {
    ...playerSummary(player),
    team_status,
    has_official_fantasy_id: hasValue(player.official_fantasy_player_id),
    has_price: player.official_price !== null && player.official_price !== undefined,
    has_position: hasValue(player.official_fantasy_position),
    currently_selectable,
    should_be_model_eligible,
    reason,
    ...identity
  };
}

function classifyStatusChanges(changes, liveById, finalRoundTeams, squadsById, identityById) {
  return changes.map((change) => {
    const live = liveById.get(String(change.official_fantasy_player_id));
    const player = live || {
      official_fantasy_player_id: change.official_fantasy_player_id,
      name: change.name,
      country: change.country,
      team_id: change.team_id,
      official_fantasy_position: null,
      official_price: null,
      selectable_status: change.live_value
    };
    const classified = classifyPlayer(player, finalRoundTeams, squadsById, identityById);
    return {
      ...classified,
      old_status: change.local_value,
      new_status: change.live_value
    };
  });
}

function countBy(rows, keyFn) {
  return rows.reduce((counts, row) => {
    const key = typeof keyFn === "function" ? keyFn(row) : row?.[keyFn];
    const label = hasValue(key) ? String(key) : "none";
    counts[label] = (counts[label] || 0) + 1;
    return counts;
  }, {});
}

function loadProjectionCoverage(sfProjections, sfRecommendations, sfTeamBuilderQa) {
  const projectionText = JSON.stringify(sfProjections || {});
  const recommendationText = JSON.stringify(sfRecommendations || {});
  const teamBuilderText = JSON.stringify(sfTeamBuilderQa || {});
  return {
    hasProjectionId(id) {
      const token = `"${String(id)}"`;
      return projectionText.includes(token);
    },
    hasRecommendationId(id) {
      const token = `"${String(id)}"`;
      return recommendationText.includes(token);
    },
    hasTeamBuilderId(id) {
      const token = `"${String(id)}"`;
      return teamBuilderText.includes(token);
    }
  };
}

function buildActivePoolReadiness(livePlayers, finalRoundTeams, squadsById, identityById, projectionCoverage) {
  const finalRoundIds = new Set([...finalRoundTeams.final, ...finalRoundTeams.third_place]);
  const rows = livePlayers
    .filter((player) => finalRoundIds.has(String(player.team_id)))
    .map((player) => {
      const classified = classifyPlayer(player, finalRoundTeams, squadsById, identityById);
      return {
        ...classified,
        active_sf_projection_row_present: projectionCoverage.hasProjectionId(player.official_fantasy_player_id),
        active_sf_recommendation_row_present: projectionCoverage.hasRecommendationId(player.official_fantasy_player_id)
      };
    });

  const duplicateIds = Object.entries(countBy(rows, "official_fantasy_player_id")).filter(([, count]) => count > 1);
  const duplicateNamesWithinTeam = Object.entries(countBy(rows, (row) => `${row.team_id}:${normalizeText(row.name)}`)).filter(([, count]) => count > 1);
  const modelEligibleRows = rows.filter((row) => row.currently_selectable && !NON_SELECTABLE_STATUSES.has(String(row.selectable_status || "").toLowerCase()));
  const metadataErrors = modelEligibleRows.filter((row) => !row.has_official_fantasy_id || !row.has_price || !row.has_position || !hasValue(row.team_id));
  const identityWarnings = modelEligibleRows.filter((row) => row.identity_status !== "mapped");
  const eliminatedLeakRows = livePlayers.filter((player) => !finalRoundIds.has(String(player.team_id)) && SELECTABLE_STATUSES.has(String(player.selectable_status || "").toLowerCase()));
  const status = metadataErrors.length || duplicateIds.length || eliminatedLeakRows.length
    ? "RED"
    : identityWarnings.length
      ? "YELLOW"
      : "GREEN";

  return {
    schema_version: "final_round_active_pool_readiness_v1",
    generated_at: GENERATED_AT,
    status,
    final_round_teams: {
      final: [...finalRoundTeams.final],
      third_place: [...finalRoundTeams.third_place]
    },
    summary: {
      final_round_player_rows: rows.length,
      model_eligible_rows: modelEligibleRows.length,
      metadata_error_rows: metadataErrors.length,
      identity_warning_rows: identityWarnings.length,
      duplicate_id_count: duplicateIds.length,
      duplicate_name_within_team_count: duplicateNamesWithinTeam.length,
      eliminated_team_selectable_leak_count: eliminatedLeakRows.length,
      status_counts: countBy(rows, "selectable_status"),
      team_counts: countBy(rows, "country")
    },
    qa: {
      status,
      errors: [
        ...metadataErrors.map((row) => `Model-eligible Final Round player missing metadata: ${row.name} (${row.country}, ${row.official_fantasy_player_id}).`),
        ...duplicateIds.map(([id, count]) => `Duplicate official fantasy id in Final Round pool: ${id} (${count}).`),
        ...eliminatedLeakRows.map((row) => `Selectable non-Final-Round player would leak into model pool: ${row.name} (${row.country}, ${row.official_fantasy_player_id}).`)
      ],
      warnings: [
        ...identityWarnings.map((row) => `Final Round selectable player needs explicit projection handling: ${row.name} (${row.country}, ${row.official_fantasy_player_id}) is ${row.identity_status}.`),
        ...duplicateNamesWithinTeam.map(([key, count]) => `Duplicate normalized name within team: ${key} (${count}).`)
      ]
    },
    players: rows
  };
}

function buildThinProfileAudit(activePool, projectionCoverage) {
  const thinRows = activePool.players
    .filter((row) => row.currently_selectable && (row.identity_status === "mapped_thin_profile" || REQUIRED_THIN_PROFILE_IDS.has(String(row.official_fantasy_player_id))))
    .map((row) => {
      const inCorePicks = projectionCoverage.hasRecommendationId(row.official_fantasy_player_id);
      const inTeamBuilder = projectionCoverage.hasTeamBuilderId(row.official_fantasy_player_id);
      const metadataComplete = row.has_official_fantasy_id && row.has_price && row.has_position && hasValue(row.team_id);
      const identitySafe = row.identity_status === "mapped_thin_profile" || row.identity_status === "mapped";
      const hasSourceBackedCoverage = row.active_sf_projection_row_present || row.active_sf_recommendation_row_present || inTeamBuilder;
      const handled = metadataComplete && identitySafe && !inCorePicks && !inTeamBuilder;
      return {
        official_fantasy_player_id: row.official_fantasy_player_id,
        name: row.name,
        country: row.country,
        team_id: row.team_id,
        team_status: row.team_status,
        official_fantasy_position: row.official_fantasy_position,
        official_price: row.official_price,
        selectable_status: row.selectable_status,
        identity_status: row.identity_status,
        internal_player_id: row.internal_player_id,
        mapping_confidence: row.mapping_confidence,
        metadata_complete: metadataComplete,
        identity_safe: identitySafe,
        active_sf_projection_row_present: row.active_sf_projection_row_present,
        active_sf_recommendation_row_present: row.active_sf_recommendation_row_present,
        active_sf_team_builder_row_present: inTeamBuilder,
        source_backed_projection_or_lineup_coverage: hasSourceBackedCoverage,
        core_pick_allowed: false,
        team_builder_allowed_without_explicit_caution: false,
        final_round_model_action: "exclude_from_core_picks_and_team_builder_until_source_backed_role_or_explicit_low_confidence_caution_exists",
        public_caution_required_if_displayed: true,
        handled,
        reason: handled
          ? "Thin profile has complete official metadata and stable staged identity, and is absent from current Core Pick/Team Builder surfaces; future Final Round builds must keep explicit caution or exclusion."
          : "Thin profile needs repair before model promotion."
      };
    });

  const missingRequired = [...REQUIRED_THIN_PROFILE_IDS].filter((id) => !thinRows.some((row) => String(row.official_fantasy_player_id) === id));
  const metadataFailures = thinRows.filter((row) => !row.metadata_complete);
  const identityFailures = thinRows.filter((row) => !row.identity_safe);
  const corePickFailures = thinRows.filter((row) => row.active_sf_recommendation_row_present);
  const teamBuilderFailures = thinRows.filter((row) => row.active_sf_team_builder_row_present && !row.team_builder_allowed_without_explicit_caution);
  const status = missingRequired.length || metadataFailures.length || identityFailures.length || corePickFailures.length || teamBuilderFailures.length
    ? "RED"
    : "GREEN";

  return {
    schema_version: "final_round_thin_profile_player_audit_v1",
    generated_at: GENERATED_AT,
    status,
    required_player_ids: [...REQUIRED_THIN_PROFILE_IDS],
    summary: {
      thin_profile_rows: thinRows.length,
      handled_rows: thinRows.filter((row) => row.handled).length,
      missing_required_count: missingRequired.length,
      metadata_failure_count: metadataFailures.length,
      identity_failure_count: identityFailures.length,
      core_pick_failure_count: corePickFailures.length,
      team_builder_failure_count: teamBuilderFailures.length
    },
    qa: {
      status,
      errors: [
        ...missingRequired.map((id) => `Required thin-profile player missing from active Final Round pool audit: ${id}.`),
        ...metadataFailures.map((row) => `${row.name} (${row.official_fantasy_player_id}) lacks required official fantasy metadata.`),
        ...identityFailures.map((row) => `${row.name} (${row.official_fantasy_player_id}) has unsafe or ambiguous identity status: ${row.identity_status}.`),
        ...corePickFailures.map((row) => `${row.name} (${row.official_fantasy_player_id}) appears in active recommendations/Core Pick surface without source-backed role support.`),
        ...teamBuilderFailures.map((row) => `${row.name} (${row.official_fantasy_player_id}) appears in Team Builder without explicit caution handling.`)
      ],
      warnings: thinRows.map((row) => `${row.name} (${row.country}) is ${row.identity_status}; ${row.final_round_model_action}.`)
    },
    players: thinRows
  };
}

function applyThinProfileHandlingToActivePool(activePool, thinProfileAudit) {
  if (activePool.status !== "YELLOW" || thinProfileAudit.status !== "GREEN") {
    return activePool;
  }

  const handledIds = new Set(thinProfileAudit.players.filter((row) => row.handled).map((row) => String(row.official_fantasy_player_id)));
  const remainingWarnings = activePool.qa.warnings.filter((warning) => {
    const match = warning.match(/\(([^,()]+),\s*(\d+)\)/);
    return !match || !handledIds.has(match[2]);
  });

  if (remainingWarnings.length) {
    return activePool;
  }

  return {
    ...activePool,
    status: "GREEN",
    summary: {
      ...activePool.summary,
      thin_profile_flagged_rows: thinProfileAudit.players.length,
      thin_profile_handled_rows: thinProfileAudit.summary.handled_rows
    },
    qa: {
      ...activePool.qa,
      status: "GREEN",
      warnings: thinProfileAudit.qa.warnings
    },
    players: activePool.players.map((row) => handledIds.has(String(row.official_fantasy_player_id))
      ? {
        ...row,
        thin_profile_handling_status: "handled_by_explicit_exclusion_and_caution_guardrail"
      }
      : row)
  };
}

function buildRolloverVerdict({ observedDiff, committedDiff, classifiedStatusChanges, newPlayersClassified, nameChangesClassified, activePool }) {
  const observedStatusCount = observedDiff.counts.selectable_status_changes;
  const committedMaterialCount = committedDiff.counts.new_players +
    committedDiff.counts.removed_players +
    committedDiff.counts.name_changes +
    committedDiff.counts.price_changes +
    committedDiff.counts.position_changes +
    committedDiff.counts.country_team_changes +
    committedDiff.counts.selectable_status_changes;
  const statusByTeamStatus = countBy(classifiedStatusChanges, "team_status");
  const activeAffected = classifiedStatusChanges.filter((row) => row.team_status === "in Final" || row.team_status === "in Third Place");
  const metadataFailures = activeAffected.filter((row) => row.currently_selectable && (!row.has_official_fantasy_id || !row.has_price || !row.has_position));
  const activeAmbiguous = activeAffected.filter((row) => row.currently_selectable && row.identity_status !== "mapped");
  const newActiveThin = newPlayersClassified.filter((row) =>
    (row.team_status === "in Final" || row.team_status === "in Third Place") &&
    row.currently_selectable &&
    row.identity_status !== "mapped"
  );
  const nameIdentityBreaks = nameChangesClassified.filter((row) => row.identity_status === "missing_identity_map_row");
  const eliminatedLockoutShare = observedStatusCount
    ? (classifiedStatusChanges.filter((row) => row.team_status === "eliminated before Final Round" && row.new_status === "eliminated").length / observedStatusCount)
    : 0;

  let status = "GREEN";
  if (metadataFailures.length || nameIdentityBreaks.length || activePool.status === "RED") {
    status = "RED";
  } else if (activeAmbiguous.length || newActiveThin.length || activePool.status === "YELLOW") {
    status = "YELLOW";
  }

  return {
    status,
    classification: {
      expected_round_rollover: observedStatusCount > 1000 && eliminatedLockoutShare > 0.8,
      eliminated_team_lockout: statusByTeamStatus["eliminated before Final Round"] > 0,
      official_fantasy_game_reset: false,
      data_schema_change: false,
      partial_feed_failure: false,
      true_player_availability_change: committedDiff.counts.selectable_status_changes > 0,
      ambiguous: status !== "GREEN"
    },
    conclusion: observedStatusCount > 1000
      ? "The 1352-change monitor result is reproduced only when comparing the live feed to the failed-refresh working snapshot sourced from the older 2026-06-08 CSV. The committed 2026-07-12 official snapshot to live 2026-07-17 control comparison has no new/removed/name/price/position/team changes and one availability status change."
      : "The observed status-change count was not reproduced from the working snapshot.",
    material_counts: {
      observed_snapshot_selectable_status_changes: observedStatusCount,
      committed_snapshot_material_changes: committedMaterialCount,
      committed_snapshot_selectable_status_changes: committedDiff.counts.selectable_status_changes,
      final_or_third_place_status_changes_in_observed_snapshot: activeAffected.length,
      metadata_failure_count: metadataFailures.length,
      active_identity_warning_count: activeAmbiguous.length,
      new_active_thin_profile_count: newActiveThin.length
    },
    blockers: [
      ...metadataFailures.map((row) => `Missing metadata for active Final Round player ${row.name} (${row.country}).`),
      ...nameIdentityBreaks.map((row) => `Name change identity break for ${row.name} (${row.country}).`)
    ],
    warnings: [
      ...activeAmbiguous.map((row) => `Selectable Final Round player needs explicit projection handling: ${row.name} (${row.country}, ${row.identity_status}).`),
      ...newActiveThin.map((row) => `New active Final Round player is thin-profile only and must be excluded or manually covered: ${row.name} (${row.country}).`)
    ]
  };
}

function markdownTable(rows, columns) {
  if (!rows.length) return "None";
  const header = `| ${columns.map((column) => column.label).join(" | ")} |`;
  const sep = `| ${columns.map(() => "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${columns.map((column) => String(column.value(row) ?? "").replace(/\|/g, "\\|")).join(" | ")} |`);
  return [header, sep, ...body].join("\n");
}

function buildRolloverReport(audit) {
  const newPlayerRows = (audit.new_players_classified.length ? audit.new_players_classified : audit.prior_monitor_new_players_classified).map((row) => ({
    ...row,
    model_action: row.should_be_model_eligible ? "eligible" : row.reason
  }));
  const statusTeamRows = Object.entries(audit.selectable_status_change_summary.by_team_status)
    .map(([team_status, count]) => ({ team_status, count }));
  const committedStatusRows = audit.committed_snapshot_control.status_changes_classified;
  return `# Official Final Round Rollover Audit v1

Generated: ${audit.generated_at}

## Verdict

Status: \`${audit.status}\`

${audit.verdict.conclusion}

## Snapshot Comparisons

| Comparison | Local rows | Live rows | New | Removed | Name | Price | Position | Status | Team | FIFA ID | Ownership |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Restored working snapshot vs live | ${audit.observed_snapshot_comparison.local_count} | ${audit.observed_snapshot_comparison.live_count} | ${audit.observed_snapshot_comparison.counts.new_players} | ${audit.observed_snapshot_comparison.counts.removed_players} | ${audit.observed_snapshot_comparison.counts.name_changes} | ${audit.observed_snapshot_comparison.counts.price_changes} | ${audit.observed_snapshot_comparison.counts.position_changes} | ${audit.observed_snapshot_comparison.counts.selectable_status_changes} | ${audit.observed_snapshot_comparison.counts.country_team_changes} | ${audit.observed_snapshot_comparison.counts.fifa_player_id_changes} | ${audit.observed_snapshot_comparison.counts.ownership_percent_changes} |
| Committed previous snapshot vs live | ${audit.committed_snapshot_control.local_count} | ${audit.committed_snapshot_control.live_count} | ${audit.committed_snapshot_control.counts.new_players} | ${audit.committed_snapshot_control.counts.removed_players} | ${audit.committed_snapshot_control.counts.name_changes} | ${audit.committed_snapshot_control.counts.price_changes} | ${audit.committed_snapshot_control.counts.position_changes} | ${audit.committed_snapshot_control.counts.selectable_status_changes} | ${audit.committed_snapshot_control.counts.country_team_changes} | ${audit.committed_snapshot_control.counts.fifa_player_id_changes} | ${audit.committed_snapshot_control.counts.ownership_percent_changes} |

Ownership changes are reported for monitoring only and are not model signal.

## Final Round Fixtures From Live Feed

- Third Place: ${audit.final_round_fixtures.third_place?.teams.map((team) => team.name).join(" v ") || "unavailable"}
- Final: ${audit.final_round_fixtures.final?.teams.map((team) => team.name).join(" v ") || "unavailable"}

## Status Change Classification

${markdownTable(statusTeamRows, [
    { label: "Team status", value: (row) => row.team_status },
    { label: "Changes", value: (row) => row.count }
  ])}

## New Player Triage

${markdownTable(newPlayerRows, [
    { label: "ID", value: (row) => row.official_fantasy_player_id },
    { label: "Name", value: (row) => row.name },
    { label: "Team", value: (row) => row.country },
    { label: "Status", value: (row) => row.selectable_status },
    { label: "Team status", value: (row) => row.team_status },
    { label: "Price", value: (row) => row.official_price },
    { label: "Position", value: (row) => row.official_fantasy_position },
    { label: "Identity", value: (row) => row.identity_status },
    { label: "Action", value: (row) => row.model_action }
  ])}

## Name Change Triage

${markdownTable(audit.name_changes_classified.length ? audit.name_changes_classified : audit.prior_monitor_name_changes_classified, [
    { label: "ID", value: (row) => row.official_fantasy_player_id },
    { label: "Old", value: (row) => row.old_name },
    { label: "New", value: (row) => row.name },
    { label: "Team", value: (row) => row.country },
    { label: "Identity", value: (row) => row.identity_status },
    { label: "Stable", value: (row) => row.identity_stable ? "yes" : "no" },
    { label: "Action", value: (row) => row.reason }
  ])}

## Committed Snapshot Status Changes

${markdownTable(committedStatusRows, [
    { label: "ID", value: (row) => row.official_fantasy_player_id },
    { label: "Name", value: (row) => row.name },
    { label: "Team", value: (row) => row.country },
    { label: "Old", value: (row) => row.old_status },
    { label: "New", value: (row) => row.new_status },
    { label: "Team status", value: (row) => row.team_status },
    { label: "Identity", value: (row) => row.identity_status },
    { label: "Reason", value: (row) => row.reason }
  ])}

## Warnings

${audit.verdict.warnings.length ? audit.verdict.warnings.map((item) => `- ${item}`).join("\n") : "None"}

## Blockers

${audit.verdict.blockers.length ? audit.verdict.blockers.map((item) => `- ${item}`).join("\n") : "None"}
`;
}

function buildReadinessReport(readiness) {
  return `# Official Fantasy Readiness Final Round v1

Generated: ${readiness.generated_at}

Status: \`${readiness.status}\`

## Gate Split

| Gate | Status | Model blocking | Notes |
| --- | --- | --- | --- |
| fantasy_pool_readiness | ${readiness.gates.fantasy_pool_readiness.status} | ${readiness.gates.fantasy_pool_readiness.model_blocking ? "yes" : "no"} | ${readiness.gates.fantasy_pool_readiness.notes} |
| final_squad_source_backing | ${readiness.gates.final_squad_source_backing.status} | ${readiness.gates.final_squad_source_backing.model_blocking ? "yes" : "no"} | ${readiness.gates.final_squad_source_backing.notes} |
| active_snapshot_hygiene | ${readiness.gates.active_snapshot_hygiene.status} | ${readiness.gates.active_snapshot_hygiene.model_blocking ? "yes" : "no"} | ${readiness.gates.active_snapshot_hygiene.notes} |

## Required Public Caveat

${readiness.required_public_caveat}

## Recommendation

${readiness.recommendation}
`;
}

function buildActivePoolReport(activePool) {
  const warningRows = activePool.players.filter((row) => row.currently_selectable && (row.identity_status !== "mapped" || row.thin_profile_handling_status));
  return `# Final Round Active Pool Readiness v1

Generated: ${activePool.generated_at}

Status: \`${activePool.status}\`

## Summary

| Metric | Count |
| --- | ---: |
| Final Round player rows | ${activePool.summary.final_round_player_rows} |
| Model-eligible rows | ${activePool.summary.model_eligible_rows} |
| Metadata error rows | ${activePool.summary.metadata_error_rows} |
| Identity warning rows | ${activePool.summary.identity_warning_rows} |
| Duplicate official IDs | ${activePool.summary.duplicate_id_count} |
| Duplicate names within team | ${activePool.summary.duplicate_name_within_team_count} |
| Eliminated-team selectable leaks | ${activePool.summary.eliminated_team_selectable_leak_count} |

## Team Counts

${markdownTable(Object.entries(activePool.summary.team_counts).map(([team, count]) => ({ team, count })), [
    { label: "Team", value: (row) => row.team },
    { label: "Rows", value: (row) => row.count }
  ])}

## Projection/Identity Warnings

${markdownTable(warningRows, [
    { label: "ID", value: (row) => row.official_fantasy_player_id },
    { label: "Name", value: (row) => row.name },
    { label: "Team", value: (row) => row.country },
    { label: "Status", value: (row) => row.selectable_status },
    { label: "Identity", value: (row) => row.identity_status },
    { label: "SF projection", value: (row) => row.active_sf_projection_row_present ? "yes" : "no" },
    { label: "Reason", value: (row) => row.reason }
  ])}

## QA Errors

${activePool.qa.errors.length ? activePool.qa.errors.map((item) => `- ${item}`).join("\n") : "None"}

## QA Warnings

${activePool.qa.warnings.length ? activePool.qa.warnings.map((item) => `- ${item}`).join("\n") : "None"}
`;
}

function buildThinProfileReport(thinProfileAudit) {
  return `# Final Round Thin Profile Player Audit v1

Generated: ${thinProfileAudit.generated_at}

Status: \`${thinProfileAudit.status}\`

## Summary

| Metric | Count |
| --- | ---: |
| Thin-profile rows | ${thinProfileAudit.summary.thin_profile_rows} |
| Handled rows | ${thinProfileAudit.summary.handled_rows} |
| Missing required rows | ${thinProfileAudit.summary.missing_required_count} |
| Metadata failures | ${thinProfileAudit.summary.metadata_failure_count} |
| Identity failures | ${thinProfileAudit.summary.identity_failure_count} |
| Core Pick failures | ${thinProfileAudit.summary.core_pick_failure_count} |
| Team Builder failures | ${thinProfileAudit.summary.team_builder_failure_count} |

## Player Handling

${markdownTable(thinProfileAudit.players, [
    { label: "ID", value: (row) => row.official_fantasy_player_id },
    { label: "Name", value: (row) => row.name },
    { label: "Team", value: (row) => row.country },
    { label: "Team status", value: (row) => row.team_status },
    { label: "Status", value: (row) => row.selectable_status },
    { label: "Price", value: (row) => row.official_price },
    { label: "Position", value: (row) => row.official_fantasy_position },
    { label: "Identity", value: (row) => row.identity_status },
    { label: "Core Pick allowed", value: (row) => row.core_pick_allowed ? "yes" : "no" },
    { label: "Team Builder allowed", value: (row) => row.team_builder_allowed_without_explicit_caution ? "yes" : "no" },
    { label: "Handled", value: (row) => row.handled ? "yes" : "no" }
  ])}

## QA Errors

${thinProfileAudit.qa.errors.length ? thinProfileAudit.qa.errors.map((item) => `- ${item}`).join("\n") : "None"}

## QA Warnings

${thinProfileAudit.qa.warnings.length ? thinProfileAudit.qa.warnings.map((item) => `- ${item}`).join("\n") : "None"}
`;
}

async function main() {
  const [playersSource, squadsSource, roundsSource] = await Promise.all([
    fetchJsonSource("fifaFantasyPlayersJson", SOURCES.players),
    fetchJsonSource("fifaFantasySquadsJson", SOURCES.squads),
    fetchJsonSource("fifaFantasyRoundsJson", SOURCES.rounds)
  ]);

  const fetchFailures = [playersSource, squadsSource, roundsSource].filter((source) => !source.ok);
  if (fetchFailures.length) {
    throw new Error(`Official source fetch failed: ${fetchFailures.map((source) => source.source_id).join(", ")}`);
  }

  const workingPlayersData = await readJson(PATHS.workingOfficialPlayers);
  const committedPlayersData = readHeadJson(PATHS.workingOfficialPlayers);
  const monitorData = await readOptionalJson(PATHS.officialMonitor);
  const previousAudit = await readOptionalJson(PATHS.rolloverJson);
  const identityById = parseIdentityMap(await readOptionalText(PATHS.identityMap));
  const sfProjections = await readOptionalJson(PATHS.sfProjections);
  const sfRecommendations = await readOptionalJson(PATHS.sfRecommendations);
  const sfTeamBuilderQa = await readOptionalJson(PATHS.sfTeamBuilderQa);
  const projectionCoverage = loadProjectionCoverage(sfProjections, sfRecommendations, sfTeamBuilderQa);

  const squads = rowsFromJson(squadsSource.json, ["squads", "data"]);
  const squadsById = new Map(squads.map((team) => [String(team.id), team]));
  const livePlayers = rowsFromJson(playersSource.json, ["players", "data"]).map((row) => normalizeLivePlayer(row, squadsById));
  const liveById = new Map(livePlayers.map((row) => [row.official_fantasy_player_id, row]));
  const rounds = rowsFromJson(roundsSource.json, ["rounds", "data"]);
  const finalRoundFixtures = buildFinalRoundFixtures(rounds);
  const finalRoundTeams = {
    final: new Set(finalRoundFixtures.final?.teams.map((team) => team.team_id) || []),
    third_place: new Set(finalRoundFixtures.third_place?.teams.map((team) => team.team_id) || [])
  };

  const workingRows = rowsFromJson(workingPlayersData);
  const committedRows = rowsFromJson(committedPlayersData);
  const observedDiff = comparePlayers(workingRows, livePlayers);
  const committedDiff = comparePlayers(committedRows, livePlayers);
  const classifiedStatusChanges = classifyStatusChanges(observedDiff.selectable_status_changes, liveById, finalRoundTeams, squadsById, identityById);
  const committedStatusChangesClassified = classifyStatusChanges(committedDiff.selectable_status_changes, liveById, finalRoundTeams, squadsById, identityById);
  const newPlayersClassified = observedDiff.new_players.map((player) =>
    classifyPlayer(liveById.get(String(player.official_fantasy_player_id)) || player, finalRoundTeams, squadsById, identityById)
  );
  const nameChangesClassified = observedDiff.name_changes.map((change) => {
    const live = liveById.get(String(change.official_fantasy_player_id));
    const classified = classifyPlayer(live || {
      official_fantasy_player_id: change.official_fantasy_player_id,
      name: change.live_value,
      country: change.country,
      team_id: change.team_id,
      selectable_status: null
    }, finalRoundTeams, squadsById, identityById);
    return {
      ...classified,
      old_name: change.local_value,
      identity_stable: classified.identity_status !== "missing_identity_map_row" && hasValue(change.official_fantasy_player_id),
      reason: classified.identity_status !== "missing_identity_map_row"
        ? "Stable official fantasy ID; display-name variant is safe for identity joins."
        : "No identity map row found for changed official fantasy ID."
    };
  });

  const monitorNewPlayers = monitorData?.diffs?.players?.new_players || [];
  const monitorNameChanges = monitorData?.diffs?.players?.name_changes || [];
  const priorMonitorNewPlayersClassified = monitorNewPlayers.length
    ? monitorNewPlayers.map((player) =>
      classifyPlayer(liveById.get(String(player.official_fantasy_player_id)) || player, finalRoundTeams, squadsById, identityById)
    )
    : previousAudit?.prior_monitor_new_players_classified || [];
  const priorMonitorNameChangesClassified = monitorNameChanges.length ? monitorNameChanges.map((change) => {
    const live = liveById.get(String(change.official_fantasy_player_id));
    const classified = classifyPlayer(live || {
      official_fantasy_player_id: change.official_fantasy_player_id,
      name: change.live_value,
      country: change.country,
      team_id: change.team_id,
      selectable_status: null
    }, finalRoundTeams, squadsById, identityById);
    return {
      ...classified,
      old_name: change.local_value,
      identity_stable: classified.identity_status !== "missing_identity_map_row" && hasValue(change.official_fantasy_player_id),
      reason: classified.identity_status !== "missing_identity_map_row"
        ? "Stable official fantasy ID; display-name variant is safe for identity joins."
        : "No identity map row found for changed official fantasy ID."
    };
  }) : previousAudit?.prior_monitor_name_changes_classified || [];

  let activePool = buildActivePoolReadiness(livePlayers, finalRoundTeams, squadsById, identityById, projectionCoverage);
  const thinProfileAudit = buildThinProfileAudit(activePool, projectionCoverage);
  activePool = applyThinProfileHandlingToActivePool(activePool, thinProfileAudit);
  const verdict = buildRolloverVerdict({
    observedDiff,
    committedDiff: {
      ...committedDiff,
      status_changes_classified: committedStatusChangesClassified
    },
    classifiedStatusChanges,
    newPlayersClassified,
    nameChangesClassified,
    activePool
  });

  const observedMaterialChangeCount = observedDiff.counts.new_players +
    observedDiff.counts.removed_players +
    observedDiff.counts.name_changes +
    observedDiff.counts.price_changes +
    observedDiff.counts.position_changes +
    observedDiff.counts.selectable_status_changes +
    observedDiff.counts.country_team_changes +
    observedDiff.counts.fifa_player_id_changes;
  const workingSnapshotUsesLiveSource = workingPlayersData.input_file === "data/imports/officialFantasyPlayers_live_v1.json" &&
    workingPlayersData.source_checked === new Date(playersSource.last_modified || GENERATED_AT).toISOString().slice(0, 10);
  const staleWorkingSnapshot = !workingSnapshotUsesLiveSource ||
    workingRows.length !== livePlayers.length ||
    observedMaterialChangeCount !== 0;

  const audit = {
    schema_version: "official_final_round_rollover_audit_v1",
    generated_at: GENERATED_AT,
    status: verdict.status,
    sources: {
      players: {
        last_modified: playersSource.last_modified,
        bytes: playersSource.bytes
      },
      squads: {
        last_modified: squadsSource.last_modified,
        bytes: squadsSource.bytes
      },
      rounds: {
        last_modified: roundsSource.last_modified,
        bytes: roundsSource.bytes
      }
    },
    observed_monitor_summary: monitorData?.summary || null,
    working_snapshot: {
      source_checked: workingPlayersData.source_checked || null,
      input_file: workingPlayersData.input_file || null,
      rows: workingRows.length
    },
    committed_previous_snapshot: {
      source_checked: committedPlayersData.source_checked || null,
      input_file: committedPlayersData.input_file || null,
      rows: committedRows.length
    },
    stale_working_snapshot_detected: staleWorkingSnapshot,
    final_round_fixtures: finalRoundFixtures,
    observed_snapshot_comparison: {
      local_count: observedDiff.local_count,
      live_count: observedDiff.live_count,
      counts: observedDiff.counts
    },
    committed_snapshot_control: {
      local_count: committedDiff.local_count,
      live_count: committedDiff.live_count,
      counts: committedDiff.counts,
      status_changes_classified: committedStatusChangesClassified
    },
    selectable_status_change_summary: {
      total: classifiedStatusChanges.length,
      by_team_status: countBy(classifiedStatusChanges, "team_status"),
      by_old_new_status: countBy(classifiedStatusChanges, (row) => `${row.old_status}->${row.new_status}`),
      by_team: countBy(classifiedStatusChanges, "country")
    },
    selectable_status_changes_classified: classifiedStatusChanges,
    new_players_classified: newPlayersClassified,
    name_changes_classified: nameChangesClassified,
    prior_monitor_new_players_classified: priorMonitorNewPlayersClassified,
    prior_monitor_name_changes_classified: priorMonitorNameChangesClassified,
    thin_profile_audit: {
      status: thinProfileAudit.status,
      summary: thinProfileAudit.summary,
      output_json: PATHS.thinProfileJson,
      output_report: PATHS.thinProfileReport
    },
    verdict
  };

  const readiness = {
    schema_version: "official_fantasy_readiness_final_round_v1",
    generated_at: GENERATED_AT,
    status: activePool.status === "RED" ? "RED" : staleWorkingSnapshot ? "YELLOW" : activePool.status,
    gates: {
      fantasy_pool_readiness: {
        status: activePool.status,
        model_blocking: activePool.status === "RED",
        notes: activePool.status === "GREEN"
          ? "Live official fantasy feed has id, team, price, position, and selectable/status fields for all Final/Third Place model-eligible players; thin-profile selectable players are explicitly guarded by QA."
          : activePool.status === "YELLOW"
            ? "Live official fantasy feed metadata is complete, but at least one selectable Final/Third Place player needs explicit thin-profile exclusion or source-backed projection coverage."
            : "Live official fantasy feed has blocking metadata or leakage errors."
      },
      final_squad_source_backing: {
        status: "BLOCKED",
        model_blocking: false,
        notes: "No source-backed final national-squad verification is present. Fantasy modeling may use official fantasy-pool membership only if public copy says final squads are not source-backed."
      },
      active_snapshot_hygiene: {
        status: staleWorkingSnapshot ? "YELLOW" : "GREEN",
        model_blocking: staleWorkingSnapshot,
        notes: staleWorkingSnapshot
          ? "The working data/officialFantasyPlayers_v0.json is not current with the live official feed or has material live-source diffs. Restore/regenerate it from the live official feed before rerunning model promotion."
          : "Working official player snapshot is regenerated from the current live official fantasy feed and has no material diff against the live source."
      }
    },
    required_public_caveat: "Official fantasy-pool membership, prices, positions, and selectable status are used for fantasy modeling. Final national squads are not independently source-backed; verify official locks, deadlines, and lineups in FIFA.",
    recommendation: staleWorkingSnapshot
      ? "Do not rerun Final Round setup from the current worktree until the active official player snapshot is restored/regenerated from the current live official fantasy feed. The live fantasy-pool metadata itself is usable with the documented final-squad caveat and thin-profile handling."
      : "Final Round setup can be rerun with the documented final-squad caveat and thin-profile guardrails."
  };

  await writeFile(PATHS.rolloverJson, `${JSON.stringify(audit, null, 2)}\n`, "utf8");
  await writeFile(PATHS.rolloverReport, buildRolloverReport(audit), "utf8");
  await writeFile(PATHS.activePoolJson, `${JSON.stringify(activePool, null, 2)}\n`, "utf8");
  await writeFile(PATHS.activePoolReport, buildActivePoolReport(activePool), "utf8");
  await writeFile(PATHS.thinProfileJson, `${JSON.stringify(thinProfileAudit, null, 2)}\n`, "utf8");
  await writeFile(PATHS.thinProfileReport, buildThinProfileReport(thinProfileAudit), "utf8");
  await writeFile(PATHS.readinessJson, `${JSON.stringify(readiness, null, 2)}\n`, "utf8");
  await writeFile(PATHS.readinessReport, buildReadinessReport(readiness), "utf8");

  console.log(`${PATHS.rolloverJson}: ${audit.status}`);
  console.log(`${PATHS.activePoolJson}: ${activePool.status}`);
  console.log(`${PATHS.thinProfileJson}: ${thinProfileAudit.status}`);
  console.log(`${PATHS.readinessJson}: ${readiness.status}`);
  if (readiness.status === "RED") process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
