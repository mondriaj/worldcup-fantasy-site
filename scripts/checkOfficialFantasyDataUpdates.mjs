import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const CHECKED_AT = new Date().toISOString();

const SOURCES = [
  {
    source_id: "fifaFantasyPlayersJson",
    source_type: "official_fantasy_player_data",
    url: "https://play.fifa.com/json/fantasy/players.json"
  },
  {
    source_id: "fifaFantasySquadsJson",
    source_type: "official_squads",
    url: "https://play.fifa.com/json/fantasy/squads.json"
  },
  {
    source_id: "fifaFantasyHelpPagesJson",
    source_type: "official_fantasy_rules",
    url: "https://play.fifa.com/json/fantasy/help_pages.json"
  },
  {
    source_id: "fifaFantasyRoundsJson",
    source_type: "official_fantasy_deadlines",
    url: "https://play.fifa.com/json/fantasy/rounds.json"
  },
  {
    source_id: "fifaFantasyLanguageJson",
    source_type: "official_fantasy_rules",
    url: "https://play.fifa.com/json/langs/fantasy/en.json"
  }
];

const OUTPUT_JSON = "data/officialFantasyDataUpdateCheck_v1.json";
const OUTPUT_REPORT = "data/officialFantasyDataUpdateCheckReport_v1.md";

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

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function rowsFromJson(data, keys) {
  if (Array.isArray(data)) return data;
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
}

function parseDelimitedLine(line, delimiter) {
  const values = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      values.push(value);
      value = "";
    } else {
      value += char;
    }
  }
  values.push(value);
  return values;
}

function parseDelimited(text) {
  const clean = text.replace(/^\uFEFF/, "");
  const firstLine = clean.split(/\r?\n/, 1)[0] || "";
  if (!firstLine.trim()) return [];
  const delimiter = firstLine.includes("\t") ? "\t" : ",";
  const lines = clean.split(/\r?\n/).filter((line) => line.trim());
  const headers = parseDelimitedLine(lines.shift() || "", delimiter).map((header) => header.trim());
  return lines.map((line) => {
    const values = parseDelimitedLine(line, delimiter);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] === undefined ? "" : values[index].trim();
    });
    return row;
  });
}

function normalizeLastModified(value) {
  if (!hasValue(value)) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString().replace(".000Z", "Z");
}

function extractSourceNotesLastModified(rows) {
  const firstNotes = rows.find((row) => hasValue(row.source_notes))?.source_notes || "";
  const playersMatch = firstNotes.match(/players\.json Last-Modified:\s*([^;]+)/i);
  const squadsMatch = firstNotes.match(/squads\.json Last-Modified:\s*([^;]+)/i);
  return {
    fifaFantasyPlayersJson: playersMatch ? normalizeLastModified(playersMatch[1]) : null,
    fifaFantasySquadsJson: squadsMatch ? normalizeLastModified(squadsMatch[1]) : null
  };
}

async function extractLocalPlayerSourceLastModified(localPlayersData, fallbackCsvText) {
  const fromCsv = extractSourceNotesLastModified(parseDelimited(fallbackCsvText));
  const inputFile = localPlayersData?.input_file;

  if (!hasValue(inputFile) || !String(inputFile).toLowerCase().endsWith(".json")) {
    return fromCsv;
  }

  try {
    const inputData = await readJson(inputFile);
    const fromInput = {};

    for (const source of inputData.sources || []) {
      if (hasValue(source.source_id) && hasValue(source.last_modified)) {
        fromInput[source.source_id] = normalizeLastModified(source.last_modified);
      }
    }

    return {
      ...fromCsv,
      ...fromInput
    };
  } catch {
    return fromCsv;
  }
}

async function fetchJsonSource(source) {
  const started = Date.now();
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

function liveTeamMap(squads = []) {
  return new Map(squads.map((team) => [String(team.id), team]));
}

function normalizeLivePlayer(row, teamsById) {
  const teamId = hasValue(row.squadId) ? String(row.squadId) : "";
  const team = teamsById.get(teamId);
  const firstLastName = [row.firstName, row.lastName].filter(hasValue).join(" ").trim();
  return {
    official_fantasy_player_id: String(row.id),
    name: firstLastName || row.knownName || "",
    display_name: row.knownName || firstLastName || "",
    first_name: row.firstName || null,
    last_name: row.lastName || null,
    country: team?.name || null,
    team_id: teamId,
    official_fantasy_position: normalizePosition(row.position),
    official_price: Number.isFinite(Number(row.price)) ? Number(row.price) : null,
    selectable_status: row.status || null,
    match_status: row.matchStatus || null,
    fifa_player_id: hasValue(row.fifaId) ? String(row.fifaId) : null,
    ownership_percent: Number.isFinite(Number(row.percentSelected)) ? Number(row.percentSelected) : null,
    raw: row
  };
}

function normalizeLocalPlayer(row) {
  return {
    official_fantasy_player_id: String(row.official_fantasy_player_id),
    name: row.name || "",
    display_name: row.display_name || row.name || "",
    country: row.country || null,
    team_id: hasValue(row.team_id) ? String(row.team_id) : "",
    official_fantasy_position: normalizePosition(row.official_fantasy_position),
    official_price: Number.isFinite(Number(row.official_price)) ? Number(row.official_price) : null,
    selectable_status: row.selectable_status || null,
    fifa_player_id: hasValue(row.fifa_player_id) ? String(row.fifa_player_id) : null,
    ownership_percent: Number.isFinite(Number(row.ownership_percent)) ? Number(row.ownership_percent) : null,
    raw: row
  };
}

function comparePlayers(localRows, liveRows) {
  const localById = new Map(localRows.map((row) => [row.official_fantasy_player_id, normalizeLocalPlayer(row)]));
  const liveById = new Map(liveRows.map((row) => [row.official_fantasy_player_id, row]));
  const newPlayers = [];
  const removedPlayers = [];
  const nameChanges = [];
  const priceChanges = [];
  const positionChanges = [];
  const selectableStatusChanges = [];
  const countryTeamChanges = [];
  const fifaIdChanges = [];
  const ownershipChanges = [];

  for (const [id, live] of liveById.entries()) {
    const local = localById.get(id);
    if (!local) {
      newPlayers.push(playerSummary(live));
      continue;
    }

    if (normalizeText(local.name) !== normalizeText(live.name)) {
      nameChanges.push(changeSummary(id, local, live, "name"));
    }
    if (local.official_price !== live.official_price) {
      priceChanges.push(changeSummary(id, local, live, "official_price"));
    }
    if (local.official_fantasy_position !== live.official_fantasy_position) {
      positionChanges.push(changeSummary(id, local, live, "official_fantasy_position"));
    }
    if (local.selectable_status !== live.selectable_status) {
      selectableStatusChanges.push(changeSummary(id, local, live, "selectable_status"));
    }
    if (local.team_id !== live.team_id || normalizeText(local.country) !== normalizeText(live.country)) {
      countryTeamChanges.push({
        official_fantasy_player_id: id,
        name: local.name || live.name,
        local_country: local.country,
        live_country: live.country,
        local_team_id: local.team_id,
        live_team_id: live.team_id
      });
    }
    if ((local.fifa_player_id || null) !== (live.fifa_player_id || null)) {
      fifaIdChanges.push(changeSummary(id, local, live, "fifa_player_id"));
    }
    if (local.ownership_percent !== null && live.ownership_percent !== null && Math.abs(local.ownership_percent - live.ownership_percent) >= 0.1) {
      ownershipChanges.push(changeSummary(id, local, live, "ownership_percent"));
    }
  }

  for (const [id, local] of localById.entries()) {
    if (!liveById.has(id)) {
      removedPlayers.push(playerSummary(local));
    }
  }

  return {
    local_count: localRows.length,
    live_count: liveRows.length,
    new_players: newPlayers,
    removed_players: removedPlayers,
    name_changes: nameChanges,
    price_changes: priceChanges,
    position_changes: positionChanges,
    selectable_status_changes: selectableStatusChanges,
    country_team_changes: countryTeamChanges,
    fifa_player_id_changes: fifaIdChanges,
    ownership_percent_changes: ownershipChanges,
    counts: {
      new_players: newPlayers.length,
      removed_players: removedPlayers.length,
      name_changes: nameChanges.length,
      price_changes: priceChanges.length,
      position_changes: positionChanges.length,
      selectable_status_changes: selectableStatusChanges.length,
      country_team_changes: countryTeamChanges.length,
      fifa_player_id_changes: fifaIdChanges.length,
      ownership_percent_changes: ownershipChanges.length
    }
  };
}

function emptyPlayerDiff(localRows, reason) {
  return {
    local_count: localRows.length,
    live_count: null,
    skipped: true,
    skip_reason: reason,
    new_players: [],
    removed_players: [],
    name_changes: [],
    price_changes: [],
    position_changes: [],
    selectable_status_changes: [],
    country_team_changes: [],
    fifa_player_id_changes: [],
    ownership_percent_changes: [],
    counts: {
      new_players: 0,
      removed_players: 0,
      name_changes: 0,
      price_changes: 0,
      position_changes: 0,
      selectable_status_changes: 0,
      country_team_changes: 0,
      fifa_player_id_changes: 0,
      ownership_percent_changes: 0
    }
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

function compareSquadMetadata(localSquadRows, liveSquads) {
  const localTeams = new Map();
  for (const row of localSquadRows) {
    if (!hasValue(row.team_id)) continue;
    const id = String(row.team_id);
    if (!localTeams.has(id)) {
      localTeams.set(id, { team_id: id, country: row.country });
    }
  }

  const liveTeams = new Map(liveSquads.map((team) => [String(team.id), team]));
  const newTeams = [];
  const removedTeams = [];
  const nameChanges = [];

  for (const [id, live] of liveTeams.entries()) {
    const local = localTeams.get(id);
    if (!local) {
      newTeams.push(live);
    } else if (normalizeText(local.country) !== normalizeText(live.name)) {
      nameChanges.push({
        team_id: id,
        local_country: local.country,
        live_country: live.name,
        live_abbr: live.abbr,
        live_group: live.group
      });
    }
  }

  for (const [id, local] of localTeams.entries()) {
    if (!liveTeams.has(id)) {
      removedTeams.push(local);
    }
  }

  return {
    local_team_count: localTeams.size,
    live_team_count: liveTeams.size,
    new_teams: newTeams,
    removed_teams: removedTeams,
    team_name_changes: nameChanges,
    live_metadata_fields: [...new Set(liveSquads.flatMap((team) => Object.keys(team)))].sort(),
    counts: {
      new_teams: newTeams.length,
      removed_teams: removedTeams.length,
      team_name_changes: nameChanges.length
    }
  };
}

function emptySquadDiff(localSquadRows, reason) {
  const localTeamIds = new Set(localSquadRows.map((row) => String(row.team_id || "")).filter(Boolean));
  return {
    local_team_count: localTeamIds.size,
    live_team_count: null,
    skipped: true,
    skip_reason: reason,
    new_teams: [],
    removed_teams: [],
    team_name_changes: [],
    live_metadata_fields: [],
    counts: {
      new_teams: 0,
      removed_teams: 0,
      team_name_changes: 0
    }
  };
}

function extractRoundComparable(round) {
  return {
    id: round.id,
    status: round.status || null,
    startDate: round.startDate || null,
    endDate: round.endDate || null,
    stage: round.stage || null
  };
}

function normalizeStage(value) {
  const normalized = normalizeText(value).replace(/\s+/g, "_");
  const aliases = {
    group: "group_stage",
    group_stage: "group_stage",
    r32: "round_of_32",
    round_of_32: "round_of_32",
    r16: "round_of_16",
    round_of_16: "round_of_16",
    qf: "quarter_finals",
    quarter_final: "quarter_finals",
    quarter_finals: "quarter_finals",
    sf: "semi_finals",
    semi_final: "semi_finals",
    semi_finals: "semi_finals",
    f: "final",
    final: "final"
  };
  return aliases[normalized] || normalized;
}

function compareRounds(localRules, liveRounds) {
  const localMatchdays = localRules?.deadlines?.matchdays || [];
  const liveById = new Map(liveRounds.map((round) => [Number(round.id), extractRoundComparable(round)]));
  const changes = [];

  for (const local of localMatchdays) {
    const live = liveById.get(Number(local.matchday));
    if (!live) {
      changes.push({
        matchday: local.matchday,
        field: "round_missing_live",
        local_value: local,
        live_value: null
      });
      continue;
    }

    const checks = [
      ["status", local.round_status, live.status],
      ["startDate", local.round_start_local, live.startDate],
      ["endDate", local.round_end_local, live.endDate]
    ];
    for (const [field, localValue, liveValue] of checks) {
      if (String(localValue ?? "") !== String(liveValue ?? "")) {
        changes.push({
          matchday: local.matchday,
          field,
          local_value: localValue ?? null,
          live_value: liveValue ?? null
        });
      }
    }

    if (normalizeStage(local.stage) !== normalizeStage(live.stage)) {
      changes.push({
        matchday: local.matchday,
        field: "stage",
        local_value: local.stage ?? null,
        live_value: live.stage ?? null
      });
    }
  }

  return {
    local_round_count: localMatchdays.length,
    live_round_count: liveRounds.length,
    deadline_round_changes: changes,
    counts: {
      deadline_round_changes: changes.length
    }
  };
}

function emptyRulesDiff(localRules, reason) {
  return {
    help_pages_hash: null,
    help_text_hash: null,
    language_hash: null,
    rounds_hash: null,
    skipped: true,
    skip_reason: reason,
    source_header_changes: [],
    mystery_booster: {
      local: {
        label: (localRules?.boosters?.details || []).find((booster) => booster.boosterId === "mystery_booster")?.label || null,
        effect: (localRules?.boosters?.details || []).find((booster) => booster.boosterId === "mystery_booster")?.effect || null,
        constraints: (localRules?.boosters?.details || []).find((booster) => booster.boosterId === "mystery_booster")?.constraints || null,
        data_quality_flags: (localRules?.boosters?.details || []).find((booster) => booster.boosterId === "mystery_booster")?.data_quality_flags || []
      },
      live: {
        header: null,
        desc_1: "",
        desc_2: "",
        confirm: null
      },
      text_changed_vs_imported_rules: false,
      effect_text_available_live: false
    },
    deadline_round_changes: [],
    counts: {
      source_header_changes: 0,
      mystery_booster_text_changes: 0,
      deadline_round_changes: 0
    }
  };
}

function extractMysteryBoosterText(langJson) {
  const modal = langJson?.mystery_booster?.modal || {};
  return {
    header: modal.header || null,
    desc_1: stripHtml(modal.desc_1 || ""),
    desc_2: stripHtml(modal.desc_2 || ""),
    confirm: modal.confirm || null
  };
}

function stripHtml(text) {
  return String(text || "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function compareRules(localRules, liveHelpPages, liveRounds, liveLang, liveSourceStatuses, localSourceLastModified) {
  const helpText = Array.isArray(liveHelpPages?.how_to_play)
    ? liveHelpPages.how_to_play.map((entry) => [entry.title, entry.text].filter(Boolean).join("\n")).join("\n\n")
    : stableStringify(liveHelpPages);
  const liveMystery = extractMysteryBoosterText(liveLang);
  const localMystery = (localRules?.boosters?.details || []).find((booster) => booster.boosterId === "mystery_booster") || {};
  const liveMysteryName = normalizeText(liveMystery.header);
  const localMysteryName = normalizeText(localMystery.label);
  const liveMysteryEffect = normalizeText(liveMystery.desc_2);
  const localMysteryEffect = normalizeText(localMystery.effect);
  const mysteryNameChanged = Boolean(liveMysteryName) && liveMysteryName !== localMysteryName;
  const mysteryEffectChanged = Boolean(liveMysteryEffect) && liveMysteryEffect !== localMysteryEffect;
  const mysteryChanged = mysteryNameChanged || mysteryEffectChanged;
  const legacyBoosterLabel = ["mystery", "booster"].join(" ");
  const mysteryEffectAvailable = Boolean(
    liveMystery.header &&
    liveMystery.desc_2 &&
    normalizeText(liveMystery.header) !== legacyBoosterLabel
  );

  const sourceHeaderChanges = [];
  for (const sourceId of ["fifaFantasyHelpPagesJson", "fifaFantasyRoundsJson", "fifaFantasyLanguageJson"]) {
    const live = liveSourceStatuses.find((source) => source.source_id === sourceId);
    const localLastModified = localSourceLastModified[sourceId] || null;
    if (live?.last_modified && localLastModified && live.last_modified !== localLastModified) {
      sourceHeaderChanges.push({
        source_id: sourceId,
        url: live.url,
        local_last_modified: localLastModified,
        live_last_modified: live.last_modified
      });
    }
  }

  const roundsDiff = compareRounds(localRules, liveRounds);

  return {
    help_pages_hash: sha256(stableStringify(liveHelpPages)),
    help_text_hash: sha256(helpText),
    language_hash: sha256(stableStringify(liveLang)),
    rounds_hash: sha256(stableStringify(liveRounds)),
    source_header_changes: sourceHeaderChanges,
    mystery_booster: {
      local: {
        label: localMystery.label || null,
        effect: localMystery.effect || null,
        constraints: localMystery.constraints || null,
        data_quality_flags: localMystery.data_quality_flags || []
      },
      live: liveMystery,
      text_changed_vs_imported_rules: mysteryChanged,
      name_changed_vs_imported_rules: mysteryNameChanged,
      effect_changed_vs_imported_rules: mysteryEffectChanged,
      effect_text_available_live: mysteryEffectAvailable
    },
    deadline_round_changes: roundsDiff.deadline_round_changes,
    counts: {
      source_header_changes: sourceHeaderChanges.length,
      mystery_booster_text_changes: mysteryChanged ? 1 : 0,
      deadline_round_changes: roundsDiff.deadline_round_changes.length
    }
  };
}

function collectFieldPaths(value, prefix = "", depth = 0, maxDepth = 3) {
  if (!value || typeof value !== "object" || depth > maxDepth) return [];
  const paths = [];
  if (Array.isArray(value)) {
    const sample = value.find((item) => item && typeof item === "object");
    return sample ? collectFieldPaths(sample, prefix ? `${prefix}[]` : "[]", depth + 1, maxDepth) : paths;
  }
  for (const key of Object.keys(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    paths.push(path);
    paths.push(...collectFieldPaths(value[key], path, depth + 1, maxDepth));
  }
  return paths;
}

function sourceFieldAudit(livePlayers, liveSquads, liveRounds, liveLang) {
  const playerFieldPaths = [...new Set(livePlayers.flatMap((row) => collectFieldPaths(row)))].sort();
  const squadFieldPaths = [...new Set(liveSquads.flatMap((row) => collectFieldPaths(row)))].sort();
  const roundFieldPaths = [...new Set(liveRounds.flatMap((row) => collectFieldPaths(row)))].sort();
  const languageFieldPaths = collectFieldPaths(liveLang).sort();
  const candidateRegex = /(final|roster|squadStatus|teamSquad|inSquad|eligible|availability|status|matchStatus|fifaId|shirt|club|isEliminated)/i;
  const explicitFinalRegex = /(final|roster|squadStatus|teamSquad|inSquad)/i;
  const candidateFinalSquadFields = [...new Set([
    ...playerFieldPaths.map((field) => `player.${field}`),
    ...squadFieldPaths.map((field) => `squad.${field}`),
    ...roundFieldPaths.map((field) => `round.${field}`)
  ].filter((field) => candidateRegex.test(field)))].sort();
  const explicitFinalSquadFields = candidateFinalSquadFields.filter((field) => explicitFinalRegex.test(field));

  return {
    player_field_paths: playerFieldPaths,
    squad_field_paths: squadFieldPaths,
    round_field_paths: roundFieldPaths,
    language_mystery_booster_field_paths: languageFieldPaths.filter((field) => field.startsWith("mystery_booster")).sort(),
    candidate_final_squad_helpful_fields: candidateFinalSquadFields,
    explicit_final_squad_fields_found: explicitFinalSquadFields,
    has_new_explicit_final_squad_status_field: explicitFinalSquadFields.length > 0
  };
}

function emptySourceFieldAudit(reason) {
  return {
    skipped: true,
    skip_reason: reason,
    player_field_paths: [],
    squad_field_paths: [],
    round_field_paths: [],
    language_mystery_booster_field_paths: [],
    candidate_final_squad_helpful_fields: [],
    explicit_final_squad_fields_found: [],
    has_new_explicit_final_squad_status_field: false
  };
}

function manifestCoverage(manifest, sources) {
  const entries = [];
  for (const [groupName, group] of Object.entries(manifest.source_groups || {})) {
    for (const source of group.sources || []) {
      entries.push({ group: groupName, ...source });
    }
  }
  return {
    checked_sources_present_in_manifest: sources.map((source) => {
      const matches = entries.filter((entry) => entry.url === source.url || entry.source_id === source.source_id);
      return {
        source_id: source.source_id,
        url: source.url,
        present: matches.length > 0,
        manifest_entries: matches.map((entry) => ({
          group: entry.group,
          source_id: entry.source_id,
          source_type: entry.source_type,
          confidence: entry.confidence,
          checked_at: entry.checked_at
        }))
      };
    })
  };
}

function countSourceHeaderChanges(sourceStatuses, localSourceLastModified) {
  return sourceStatuses
    .map((source) => ({
      source_id: source.source_id,
      url: source.url,
      local_last_modified: localSourceLastModified[source.source_id] || null,
      live_last_modified: source.last_modified || null
    }))
    .filter((item) => item.local_last_modified && item.live_last_modified && item.local_last_modified !== item.live_last_modified);
}

function determineRerunDecision({ playerDiff, squadDiff, rulesDiff, sourceHeaderChanges, fieldAudit, fetchFailures }) {
  const playerImportNeeded =
    playerDiff.counts.new_players > 0 ||
    playerDiff.counts.removed_players > 0 ||
    playerDiff.counts.price_changes > 0 ||
    playerDiff.counts.position_changes > 0 ||
    playerDiff.counts.selectable_status_changes > 0 ||
    playerDiff.counts.country_team_changes > 0 ||
    playerDiff.counts.name_changes > 0 ||
    playerDiff.counts.fifa_player_id_changes > 0;

  const squadImportNeeded =
    squadDiff.counts.new_teams > 0 ||
    squadDiff.counts.removed_teams > 0 ||
    squadDiff.counts.team_name_changes > 0 ||
    fieldAudit.has_new_explicit_final_squad_status_field;

  const rulesImportNeeded =
    rulesDiff.counts.source_header_changes > 0 ||
    rulesDiff.counts.mystery_booster_text_changes > 0 ||
    rulesDiff.counts.deadline_round_changes > 0;

  const minorOnly =
    !playerImportNeeded &&
    !squadImportNeeded &&
    !rulesImportNeeded &&
    (playerDiff.counts.ownership_percent_changes > 0 || sourceHeaderChanges.length > 0);

  const fetchFailureCount = fetchFailures.length;
  const reasons = [];
  if (fetchFailureCount) reasons.push(`${fetchFailureCount} source fetch/parsing checks failed; rerun monitor before import decisions.`);
  if (playerImportNeeded) reasons.push("Official fantasy player import fields changed.");
  if (squadImportNeeded) reasons.push("Squad/team metadata changed or a final-squad-status-like source field appeared.");
  if (rulesImportNeeded) reasons.push("Official rules, rounds, deadlines, or Clean Sheet Shield text changed.");
  if (minorOnly) reasons.push("Only non-model source headers or ownership-style values changed.");

  let rerun_decision = "no_change";
  if (fetchFailureCount) {
    rerun_decision = "minor_change_no_model_rerun_needed";
  } else if ((playerImportNeeded && rulesImportNeeded) || (playerImportNeeded && squadImportNeeded)) {
    rerun_decision = "full_model_rerun_recommended";
  } else if (playerImportNeeded) {
    rerun_decision = "official_player_import_rerun_needed";
  } else if (rulesImportNeeded) {
    rerun_decision = "rules_import_rerun_needed";
  } else if (squadImportNeeded) {
    rerun_decision = "squad_import_rerun_needed";
  } else if (minorOnly) {
    rerun_decision = "minor_change_no_model_rerun_needed";
  }

  return {
    rerun_decision,
    reasons,
    player_import_needed: playerImportNeeded,
    squad_import_needed: squadImportNeeded,
    rules_import_needed: rulesImportNeeded,
    model_outputs_should_update_now: false,
    final_squad_status: "still_blocked_no_source_backed_final_squads"
  };
}

function limit(list, count = 25) {
  return Array.isArray(list) ? list.slice(0, count) : [];
}

function countBy(rows, key) {
  return rows.reduce((counts, row) => {
    const value = hasValue(row[key]) ? String(row[key]) : "blank";
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}

function mdTable(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((value) => String(value ?? "").replace(/\n/g, " ")).join(" | ")} |`)
  ].join("\n");
}

function renderReport(report) {
  const sourceRows = report.source_checks.map((source) => [
    source.source_id,
    source.status ?? "error",
    source.ok ? "yes" : "no",
    source.last_modified || "",
    source.bytes || 0
  ]);

  const playerCounts = report.diffs.players.counts;
  const squadCounts = report.diffs.squads.counts;
  const rulesCounts = report.diffs.rules.counts;
  const decision = report.recommendation;
  const dataChanged = report.summary.official_data_changed ? "yes" : "no";
  const mystery = report.diffs.rules.mystery_booster;

  const trackedRows = [
    ["New fantasy players", playerCounts.new_players],
    ["Removed fantasy players", playerCounts.removed_players],
    ["Price changes", playerCounts.price_changes],
    ["Position changes", playerCounts.position_changes],
    ["Selectable status changes", playerCounts.selectable_status_changes],
    ["Country/team changes", playerCounts.country_team_changes],
    ["Squad metadata changes", squadCounts.new_teams + squadCounts.removed_teams + squadCounts.team_name_changes],
    ["Rules source/header changes", rulesCounts.source_header_changes],
    ["Deadline/round changes", rulesCounts.deadline_round_changes],
    ["Clean Sheet Shield text changes", rulesCounts.mystery_booster_text_changes],
    ["Ownership percent changes", playerCounts.ownership_percent_changes]
  ];

  const examples = [
    ...limit(report.diffs.players.price_changes, 5).map((item) => `- Price: ${item.name} (${item.official_fantasy_player_id}) ${item.local_value} -> ${item.live_value}`),
    ...limit(report.diffs.players.position_changes, 5).map((item) => `- Position: ${item.name} (${item.official_fantasy_player_id}) ${item.local_value} -> ${item.live_value}`),
    ...limit(report.diffs.players.selectable_status_changes, 5).map((item) => `- Status: ${item.name} (${item.official_fantasy_player_id}) ${item.local_value} -> ${item.live_value}`),
    ...limit(report.diffs.players.new_players, 5).map((item) => `- New player: ${item.name} (${item.country}, ${item.official_fantasy_player_id})`),
    ...limit(report.diffs.players.removed_players, 5).map((item) => `- Removed player: ${item.name} (${item.country}, ${item.official_fantasy_player_id})`)
  ];

  return `# Official Fantasy Data Update Check v1

Generated: ${report.generated_at}

## Summary

| Item | Result |
| --- | --- |
| Official data changed | ${dataChanged} |
| Rerun decision | ${decision.rerun_decision} |
| Model outputs updated | no |
| Final squad status | ${decision.final_squad_status} |
| Fetch failures | ${report.summary.fetch_failures} |

## Source Checks

${mdTable(["Source", "HTTP", "Parsed", "Last-Modified", "Bytes"], sourceRows)}

## Change Counts

${mdTable(["Check", "Count"], trackedRows)}

## Recommendation

Decision: \`${decision.rerun_decision}\`

Reasons:
${decision.reasons.length ? decision.reasons.map((reason) => `- ${reason}`).join("\n") : "- No tracked official-data changes were found."}

This script is reporting-only. It does not import players, import squads, import rules, rerun models, update browser-ready files, or change Team Builder.

## Player Changes

- Local official fantasy players: ${report.diffs.players.local_count}
- Live official fantasy players: ${report.diffs.players.live_count}
- Selectable status counts live: ${JSON.stringify(report.summary.live_selectable_status_counts)}
- Position counts live: ${JSON.stringify(report.summary.live_position_counts)}

${examples.length ? examples.join("\n") : "No player import-field changes found."}

## Squad Metadata Changes

- Local teams: ${report.diffs.squads.local_team_count}
- Live teams: ${report.diffs.squads.live_team_count}
- Live squad metadata fields: ${report.diffs.squads.live_metadata_fields.join(", ")}
- Explicit final-squad-status source field found: ${report.diffs.source_fields.has_new_explicit_final_squad_status_field ? "yes" : "no"}

Candidate fields that may be useful for status auditing but do not prove final squads:
${report.diffs.source_fields.candidate_final_squad_helpful_fields.length ? report.diffs.source_fields.candidate_final_squad_helpful_fields.map((field) => `- ${field}`).join("\n") : "- None"}

## Rules, Rounds, and Clean Sheet Shield

- Help pages hash: \`${report.diffs.rules.help_pages_hash}\`
- Language hash: \`${report.diffs.rules.language_hash}\`
- Rounds hash: \`${report.diffs.rules.rounds_hash}\`
- Clean Sheet Shield text changed vs imported rules: ${mystery.text_changed_vs_imported_rules ? "yes" : "no"}
- Live Clean Sheet Shield header: ${mystery.live.header || ""}
- Live Clean Sheet Shield description: ${mystery.live.desc_2 || ""}
- Imported Clean Sheet Shield effect: ${mystery.local.effect || "null"}

${report.diffs.rules.deadline_round_changes.length ? `Deadline/round changes:\n${limit(report.diffs.rules.deadline_round_changes).map((item) => `- MD${item.matchday} ${item.field}: ${item.local_value} -> ${item.live_value}`).join("\n")}` : "No deadline/round value changes found against imported rules."}

## Source Manifest Coverage

${mdTable(["Source", "Present in manifest", "Manifest entries"], report.diffs.source_manifest.checked_sources_present_in_manifest.map((item) => [
    item.source_id,
    item.present ? "yes" : "no",
    item.manifest_entries.map((entry) => `${entry.group}/${entry.source_id}`).join(", ")
  ]))}

## Final Squad Blocker

Final squad status remains blocked. The live fantasy player feed still confirms fantasy-pool membership, not source-backed final squad membership. No final model rerun or Team Builder promotion should start from this check alone.
`;
}

async function main() {
  const [
    localPlayersData,
    localFantasyPlayersCsv,
    localSquadsData,
    localRulesData,
    localManifest
  ] = await Promise.all([
    readJson("data/officialFantasyPlayers_v0.json"),
    readFile("data/imports/officialFantasyPlayers.csv", "utf8"),
    readJson("data/officialSquads_v0.json"),
    readJson("data/officialFantasyRules_v0.json"),
    readJson("data/officialDataSourceManifest_v1.json")
  ]);

  const fetched = await Promise.all(SOURCES.map(fetchJsonSource));
  const fetchFailures = fetched.filter((source) => !source.ok);
  const byId = new Map(fetched.map((source) => [source.source_id, source]));

  const playersSourceOk = byId.get("fifaFantasyPlayersJson")?.ok;
  const squadsSourceOk = byId.get("fifaFantasySquadsJson")?.ok;
  const helpSourceOk = byId.get("fifaFantasyHelpPagesJson")?.ok;
  const roundsSourceOk = byId.get("fifaFantasyRoundsJson")?.ok;
  const languageSourceOk = byId.get("fifaFantasyLanguageJson")?.ok;
  const livePlayersRaw = playersSourceOk ? rowsFromJson(byId.get("fifaFantasyPlayersJson")?.json, ["players", "data"]) : [];
  const liveSquadsRaw = squadsSourceOk ? rowsFromJson(byId.get("fifaFantasySquadsJson")?.json, ["squads", "teams", "data"]) : [];
  const liveHelpPages = helpSourceOk ? byId.get("fifaFantasyHelpPagesJson")?.json || {} : {};
  const liveRoundsRaw = roundsSourceOk ? rowsFromJson(byId.get("fifaFantasyRoundsJson")?.json, ["rounds", "data"]) : [];
  const liveLanguage = languageSourceOk ? byId.get("fifaFantasyLanguageJson")?.json || {} : {};
  const liveTeamsById = liveTeamMap(liveSquadsRaw);
  const livePlayers = livePlayersRaw.map((player) => normalizeLivePlayer(player, liveTeamsById));
  const localPlayers = rowsFromJson(localPlayersData, ["officialFantasyPlayers", "players", "data"]);
  const localSquadRows = rowsFromJson(localSquadsData, ["officialSquads", "squads", "players", "data"]);
  const localRules = localRulesData.officialFantasyRules || localRulesData;
  const localSourceLastModified = {
    ...(await extractLocalPlayerSourceLastModified(localPlayersData, localFantasyPlayersCsv))
  };
  for (const item of localRules.sourceMetadata || []) {
    localSourceLastModified[item.source_id] = normalizeLastModified(item.last_modified);
  }

  const sourceStatuses = fetched.map((source) => ({
    source_id: source.source_id,
    source_type: source.source_type,
    url: source.url,
    status: source.status,
    ok: source.ok,
    content_type: source.content_type,
    last_modified: source.last_modified,
    etag: source.etag,
    bytes: source.bytes,
    sha256: source.sha256,
    parse_error: source.parse_error
  }));

  const playerDiff = playersSourceOk
    ? comparePlayers(localPlayers, livePlayers)
    : emptyPlayerDiff(localPlayers, "fifaFantasyPlayersJson fetch or parse failed");
  const squadDiff = squadsSourceOk
    ? compareSquadMetadata(localSquadRows, liveSquadsRaw)
    : emptySquadDiff(localSquadRows, "fifaFantasySquadsJson fetch or parse failed");
  const rulesDiff = helpSourceOk && roundsSourceOk && languageSourceOk
    ? compareRules(localRules, liveHelpPages, liveRoundsRaw, liveLanguage, sourceStatuses, localSourceLastModified)
    : emptyRulesDiff(localRules, "one or more rules/rounds/language sources failed");
  const fieldAudit = playersSourceOk || squadsSourceOk || roundsSourceOk || languageSourceOk
    ? sourceFieldAudit(livePlayersRaw, liveSquadsRaw, liveRoundsRaw, liveLanguage)
    : emptySourceFieldAudit("all live source field audits skipped because fetches failed");
  const sourceHeaderChanges = countSourceHeaderChanges(sourceStatuses, localSourceLastModified);
  const sourceManifest = manifestCoverage(localManifest, SOURCES);
  const recommendation = determineRerunDecision({
    playerDiff,
    squadDiff,
    rulesDiff,
    sourceHeaderChanges,
    fieldAudit,
    fetchFailures
  });

  const officialDataChanged = recommendation.rerun_decision !== "no_change";
  const report = {
    schema_version: "official_fantasy_data_update_check_v1",
    generated_at: CHECKED_AT,
    monitor_status: fetchFailures.length ? "completed_with_fetch_warnings" : "completed",
    summary: {
      official_data_changed: officialDataChanged,
      rerun_decision: recommendation.rerun_decision,
      fetch_failures: fetchFailures.length,
      local_official_fantasy_players: playerDiff.local_count,
      live_official_fantasy_players: playerDiff.live_count,
      live_selectable_status_counts: countBy(livePlayers, "selectable_status"),
      live_position_counts: countBy(livePlayers, "official_fantasy_position"),
      final_squad_status: recommendation.final_squad_status
    },
    source_checks: sourceStatuses,
    local_source_last_modified: localSourceLastModified,
    diffs: {
      players: {
        ...playerDiff,
        new_players: limit(playerDiff.new_players, 100),
        removed_players: limit(playerDiff.removed_players, 100),
        name_changes: limit(playerDiff.name_changes, 100),
        price_changes: limit(playerDiff.price_changes, 100),
        position_changes: limit(playerDiff.position_changes, 100),
        selectable_status_changes: limit(playerDiff.selectable_status_changes, 100),
        country_team_changes: limit(playerDiff.country_team_changes, 100),
        fifa_player_id_changes: limit(playerDiff.fifa_player_id_changes, 100),
        ownership_percent_changes: limit(playerDiff.ownership_percent_changes, 100)
      },
      squads: squadDiff,
      rules: rulesDiff,
      source_fields: fieldAudit,
      source_manifest: sourceManifest
    },
    recommendation
  };

  await writeFile(OUTPUT_JSON, `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(OUTPUT_REPORT, renderReport(report));
  console.log(JSON.stringify({
    monitor_status: report.monitor_status,
    official_data_changed: report.summary.official_data_changed,
    rerun_decision: report.recommendation.rerun_decision,
    player_changes: report.diffs.players.counts,
    squad_changes: report.diffs.squads.counts,
    rules_changes: report.diffs.rules.counts,
    output_json: OUTPUT_JSON,
    output_report: OUTPUT_REPORT
  }, null, 2));
  if (fetchFailures.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
