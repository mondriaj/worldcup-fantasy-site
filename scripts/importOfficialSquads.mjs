import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const TODAY = "2026-06-01";

const DEFAULT_INPUT = "data/imports/officialSquads.csv";
const OUTPUT_SQUADS = "data/officialSquads_v0.json";
const OUTPUT_REPORT = "data/officialSquadsImportReport_v0.json";
const CURRENT_PLAYERS = "data/players.json";

const REQUIRED_FIELDS = [
  "name",
  "country",
  "team_id",
  "roster_status",
  "source_url",
  "source_checked"
];

const FIELD_ALIASES = {
  name: ["name", "player_name", "full_name", "display_name"],
  country: ["country", "nation", "national_team", "team", "team_name"],
  team_id: ["team_id", "country_id", "national_team_id"],
  roster_status: ["roster_status", "final_squad_status", "squad_status", "status"],
  source_url: ["source_url", "url", "source"],
  source_checked: ["source_checked", "checked_at", "last_checked", "date_checked"],
  official_fantasy_player_id: ["official_fantasy_player_id", "fantasy_player_id"],
  fifa_player_id: ["fifa_player_id", "fifa_id"],
  shirt_number: ["shirt_number", "number"],
  club: ["club"],
  position: ["position", "pos"],
  replacement_status: ["replacement_status", "replacement_note"],
  team_squad_complete: ["team_squad_complete", "squad_complete", "complete_team_import"],
  source_note: ["source_note", "note", "notes"]
};

const FINAL_STATUSES = new Set(["final", "official_final", "final_26", "selected", "included", "in_squad"]);
const REPLACEMENT_STATUSES = new Set(["replacement", "late_replacement", "injury_replacement"]);
const EXCLUDED_STATUSES = new Set(["excluded", "cut", "not_selected", "removed", "withdrawn", "not_in_final_squad"]);

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
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

function teamIdFromCountry(value) {
  return normalizeText(value).replace(/\s+/g, "-");
}

function hasValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function parseBoolean(value) {
  const normalized = normalizeText(value);
  if (["true", "yes", "y", "1", "complete"].includes(normalized)) return true;
  if (["false", "no", "n", "0", "partial"].includes(normalized)) return false;
  return null;
}

function pickField(row, canonical) {
  const aliases = FIELD_ALIASES[canonical] || [canonical];
  for (const alias of aliases) {
    if (Object.prototype.hasOwnProperty.call(row, alias) && hasValue(row[alias])) {
      return row[alias];
    }
  }

  const lowerLookup = Object.fromEntries(
    Object.keys(row).map((key) => [key.toLowerCase().trim(), key])
  );

  for (const alias of aliases) {
    const found = lowerLookup[alias.toLowerCase()];
    if (found && hasValue(row[found])) {
      return row[found];
    }
  }

  return null;
}

function normalizePosition(value) {
  const position = String(value || "").trim().toUpperCase();
  if (["GKP", "GK", "GOALKEEPER", "GOALKEEPERS"].includes(position)) return "GK";
  if (["DEF", "DEFENDER", "DEFENDERS"].includes(position)) return "DEF";
  if (["MID", "MIDFIELDER", "MIDFIELDERS"].includes(position)) return "MID";
  if (["FWD", "FOR", "FORWARD", "FORWARDS", "STRIKER", "STRIKERS"].includes(position)) return "FWD";
  return position || null;
}

function normalizeRosterStatus(value, replacementStatus = "") {
  const status = normalizeText(value).replace(/\s+/g, "_");
  const replacement = normalizeText(replacementStatus).replace(/\s+/g, "_");

  if (REPLACEMENT_STATUSES.has(status) || REPLACEMENT_STATUSES.has(replacement)) return "replacement";
  if (FINAL_STATUSES.has(status)) return "final";
  if (EXCLUDED_STATUSES.has(status)) return "excluded";
  return "review";
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
  const clean = text.replace(/^\uFEFF/, "").trim();
  if (!clean) return [];

  const firstLine = clean.split(/\r?\n/, 1)[0] || "";
  const delimiter = firstLine.includes("\t") ? "\t" : ",";
  const rows = clean.split(/\r?\n/).filter(Boolean).map((line) => parseDelimitedLine(line, delimiter));
  const headers = rows.shift()?.map((header) => header.trim()) || [];

  return rows.map((row) => {
    const item = {};
    headers.forEach((header, index) => {
      item[header] = row[index] === undefined ? "" : row[index].trim();
    });
    return item;
  });
}

function rowsFromJson(data) {
  if (Array.isArray(data)) return data;
  for (const key of ["officialSquads", "squads", "players", "rows", "data"]) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function readImportRows(inputPath) {
  const raw = await readFile(inputPath, "utf8");
  const extension = path.extname(inputPath).toLowerCase();
  if (extension === ".json") {
    return rowsFromJson(JSON.parse(raw));
  }
  return parseDelimited(raw);
}

function countBy(rows, key) {
  return rows.reduce((counts, row) => {
    const value = row?.[key] ?? "null";
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}

function addToMap(map, key, value) {
  if (!key) return;
  const list = map.get(key) || [];
  list.push(value);
  map.set(key, list);
}

function currentPlayerIndexes(players) {
  const byOfficialFantasyId = new Map();
  const byFifaPlayerId = new Map();
  const byTeamName = new Map();
  const byCountryName = new Map();
  const byName = new Map();
  const countryToTeamId = new Map();

  players.forEach((player) => {
    const normalizedName = normalizeText(player.name);
    const normalizedCountry = normalizeText(player.country);
    const normalizedTeamId = normalizeText(player.team_id);
    const officialFantasyId = player?.fantasy_matching?.official_fantasy_id;
    const fifaPlayerId = player?.fantasy_matching?.fifa_player_id;

    if (officialFantasyId) byOfficialFantasyId.set(String(officialFantasyId), player);
    if (fifaPlayerId) byFifaPlayerId.set(String(fifaPlayerId), player);
    addToMap(byTeamName, `${normalizedTeamId}:${normalizedName}`, player);
    addToMap(byCountryName, `${normalizedCountry}:${normalizedName}`, player);
    addToMap(byName, normalizedName, player);

    if (normalizedCountry && player.team_id) {
      countryToTeamId.set(normalizedCountry, player.team_id);
    }
  });

  return { byOfficialFantasyId, byFifaPlayerId, byTeamName, byCountryName, byName, countryToTeamId };
}

function uniqueMatch(candidates) {
  return candidates?.length === 1 ? candidates[0] : null;
}

function matchOfficialSquadRow(row, indexes) {
  const warnings = [];
  const officialFantasyId = String(row.official_fantasy_player_id || "");
  const fifaPlayerId = String(row.fifa_player_id || "");
  const normalizedName = normalizeText(row.name);
  const normalizedCountry = normalizeText(row.country);
  const normalizedTeamId = normalizeText(row.team_id);

  const fantasyIdMatch = officialFantasyId ? indexes.byOfficialFantasyId.get(officialFantasyId) : null;
  if (fantasyIdMatch) {
    return {
      player_id: fantasyIdMatch.player_id,
      match_status: "matched",
      confidence: "exact",
      method: "existing_official_fantasy_id",
      candidate_player_ids: [],
      warnings
    };
  }

  const fifaIdMatch = fifaPlayerId ? indexes.byFifaPlayerId.get(fifaPlayerId) : null;
  if (fifaIdMatch) {
    return {
      player_id: fifaIdMatch.player_id,
      match_status: "matched",
      confidence: "exact",
      method: "existing_fifa_player_id",
      candidate_player_ids: [],
      warnings
    };
  }

  const teamNameMatches = indexes.byTeamName.get(`${normalizedTeamId}:${normalizedName}`) || [];
  const teamNameMatch = uniqueMatch(teamNameMatches);
  if (teamNameMatch) {
    return {
      player_id: teamNameMatch.player_id,
      match_status: "matched",
      confidence: "high",
      method: "team_id_and_normalized_name",
      candidate_player_ids: [],
      warnings
    };
  }

  const countryNameMatches = indexes.byCountryName.get(`${normalizedCountry}:${normalizedName}`) || [];
  const countryNameMatch = uniqueMatch(countryNameMatches);
  if (countryNameMatch) {
    return {
      player_id: countryNameMatch.player_id,
      match_status: "matched",
      confidence: "high",
      method: "country_and_normalized_name",
      candidate_player_ids: [],
      warnings
    };
  }

  const nameMatches = indexes.byName.get(normalizedName) || [];
  const nameMatch = uniqueMatch(nameMatches);
  if (nameMatch) {
    warnings.push("Matched by name only; verify country/team before merging.");
    return {
      player_id: nameMatch.player_id,
      match_status: "review",
      confidence: "medium",
      method: "normalized_name_only",
      candidate_player_ids: [],
      warnings
    };
  }

  const candidates = [...teamNameMatches, ...countryNameMatches, ...nameMatches]
    .map((player) => player.player_id);

  return {
    player_id: null,
    match_status: candidates.length ? "review" : "unmatched",
    confidence: "none",
    method: candidates.length ? "ambiguous_candidates" : "no_current_player_match",
    candidate_player_ids: [...new Set(candidates)],
    warnings: candidates.length
      ? ["Multiple possible current-player matches; manual review required."]
      : ["No current-player match found."]
  };
}

function normalizeOfficialSquadRows(rawRows, indexes) {
  const keyCounts = new Map();
  const idCounts = new Map();

  const rows = rawRows.map((rawRow, index) => {
    const country = String(pickField(rawRow, "country") || "").trim();
    const teamId = String(pickField(rawRow, "team_id") || indexes.countryToTeamId.get(normalizeText(country)) || teamIdFromCountry(country)).trim();
    const replacementStatus = String(pickField(rawRow, "replacement_status") || "").trim();
    const officialFantasyId = String(pickField(rawRow, "official_fantasy_player_id") || "").trim();
    const fifaPlayerId = String(pickField(rawRow, "fifa_player_id") || "").trim();
    const row = {
      official_squad_row_id: `official-squad-row-${index + 1}`,
      name: String(pickField(rawRow, "name") || "").trim() || null,
      country: country || null,
      team_id: teamId || null,
      roster_status: normalizeRosterStatus(pickField(rawRow, "roster_status"), replacementStatus),
      source_url: String(pickField(rawRow, "source_url") || "").trim() || null,
      source_checked: String(pickField(rawRow, "source_checked") || "").trim() || null,
      official_fantasy_player_id: officialFantasyId || null,
      fifa_player_id: fifaPlayerId || null,
      shirt_number: String(pickField(rawRow, "shirt_number") || "").trim() || null,
      club: String(pickField(rawRow, "club") || "").trim() || null,
      position: normalizePosition(pickField(rawRow, "position")),
      replacement_status: replacementStatus || null,
      team_squad_complete: parseBoolean(pickField(rawRow, "team_squad_complete")),
      source_note: String(pickField(rawRow, "source_note") || "").trim() || null,
      raw_row_index: index + 2,
      validation_errors: [],
      validation_warnings: []
    };

    REQUIRED_FIELDS.forEach((field) => {
      if (!hasValue(row[field])) {
        row.validation_errors.push(`Missing required field: ${field}.`);
      }
    });

    if (row.roster_status === "review") {
      row.validation_warnings.push("Roster status is not final, replacement, or excluded; manual review required.");
    }

    if (row.team_squad_complete === null) {
      row.validation_warnings.push("team_squad_complete is missing; unmatched current players for this team will stay review, not excluded.");
    }

    const rowKey = `${normalizeText(row.team_id)}:${normalizeText(row.name)}`;
    keyCounts.set(rowKey, (keyCounts.get(rowKey) || 0) + 1);
    if (officialFantasyId) idCounts.set(`fantasy:${officialFantasyId}`, (idCounts.get(`fantasy:${officialFantasyId}`) || 0) + 1);
    if (fifaPlayerId) idCounts.set(`fifa:${fifaPlayerId}`, (idCounts.get(`fifa:${fifaPlayerId}`) || 0) + 1);

    row.current_player_match = matchOfficialSquadRow(row, indexes);
    row.current_player_match.warnings.forEach((warning) => row.validation_warnings.push(warning));

    return row;
  });

  rows.forEach((row) => {
    const rowKey = `${normalizeText(row.team_id)}:${normalizeText(row.name)}`;
    if (row.name && row.team_id && keyCounts.get(rowKey) > 1) {
      row.validation_errors.push(`Duplicate official squad row for team/name: ${row.team_id}/${row.name}.`);
    }
    if (row.official_fantasy_player_id && idCounts.get(`fantasy:${row.official_fantasy_player_id}`) > 1) {
      row.validation_errors.push(`Duplicate official_fantasy_player_id: ${row.official_fantasy_player_id}.`);
    }
    if (row.fifa_player_id && idCounts.get(`fifa:${row.fifa_player_id}`) > 1) {
      row.validation_errors.push(`Duplicate fifa_player_id: ${row.fifa_player_id}.`);
    }
  });

  return rows;
}

function teamCompleteness(rows) {
  const byTeam = new Map();

  rows.forEach((row) => {
    const entry = byTeam.get(row.team_id) || {
      team_id: row.team_id,
      country: row.country,
      imported_rows: 0,
      final_or_replacement_rows: 0,
      explicit_complete_rows: 0,
      is_complete: false
    };
    entry.imported_rows += 1;
    if (["final", "replacement"].includes(row.roster_status)) entry.final_or_replacement_rows += 1;
    if (row.team_squad_complete === true) entry.explicit_complete_rows += 1;
    entry.is_complete = entry.is_complete || row.team_squad_complete === true;
    byTeam.set(row.team_id, entry);
  });

  return [...byTeam.values()].sort((a, b) => String(a.team_id).localeCompare(String(b.team_id)));
}

function currentPlayerReconciliation(currentPlayers, officialRows, completeTeams) {
  const officialByCurrentPlayerId = new Map();
  const completeTeamIds = new Set(completeTeams.filter((team) => team.is_complete).map((team) => team.team_id));

  officialRows.forEach((row) => {
    const playerId = row.current_player_match.player_id;
    if (playerId && row.current_player_match.match_status === "matched") {
      officialByCurrentPlayerId.set(playerId, row);
    }
  });

  return currentPlayers.map((player) => {
    const row = officialByCurrentPlayerId.get(player.player_id);
    const warnings = [];
    let reconciliationStatus = "review";
    let recommendationAction = "manual_review_before_promotion";

    if (row?.roster_status === "final") {
      reconciliationStatus = "final";
      recommendationAction = "keep_selectable_after_other_official_gates_pass";
    } else if (row?.roster_status === "replacement") {
      reconciliationStatus = "replacement";
      recommendationAction = "keep_selectable_after_replacement_review";
    } else if (row?.roster_status === "excluded") {
      reconciliationStatus = "excluded";
      recommendationAction = "remove_from_recommendations_after_promotion";
    } else if (completeTeamIds.has(player.team_id)) {
      reconciliationStatus = "excluded";
      recommendationAction = "remove_from_recommendations_after_promotion";
      warnings.push("Player was not found in a team marked complete by the official squad import.");
    } else {
      warnings.push("Team is not marked complete in the official squad import; keep this player under manual review.");
    }

    return {
      player_id: player.player_id,
      name: player.name,
      country: player.country,
      team_id: player.team_id,
      current_roster_status: player.roster_status,
      reconciliation_status: reconciliationStatus,
      recommendation_action: recommendationAction,
      matched_official_squad_row_id: row?.official_squad_row_id || null,
      warnings
    };
  });
}

function buildSummary(officialRows, reconciliation, completeTeams) {
  const errorRows = officialRows.filter((row) => row.validation_errors.length);
  const reviewRows = officialRows.filter((row) =>
    row.validation_errors.length ||
    row.current_player_match.match_status !== "matched" ||
    row.roster_status === "review"
  );

  return {
    imported_rows: officialRows.length,
    imported_status_counts: countBy(officialRows, "roster_status"),
    imported_match_status_counts: countBy(officialRows.map((row) => row.current_player_match), "match_status"),
    current_player_reconciliation_counts: countBy(reconciliation, "reconciliation_status"),
    teams_with_import_rows: completeTeams.length,
    teams_marked_complete: completeTeams.filter((team) => team.is_complete).length,
    error_rows: errorRows.length,
    review_rows: reviewRows.length
  };
}

function importStatus(summary) {
  if (summary.imported_rows === 0) return "no_rows_imported";
  if (summary.error_rows > 0) return "imported_with_errors";
  if (summary.review_rows > 0) return "imported_needs_manual_review";
  if (summary.teams_marked_complete === 0) return "imported_needs_team_completion_review";
  return "imported_ready_for_readiness_check";
}

function reportFromRows(inputPath, officialRows, reconciliation, completeTeams, currentPlayerCount) {
  const summary = buildSummary(officialRows, reconciliation, completeTeams);
  const status = importStatus(summary);
  const manualReviewRows = officialRows
    .filter((row) =>
      row.validation_errors.length ||
      row.current_player_match.match_status !== "matched" ||
      row.roster_status === "review"
    )
    .map((row) => ({
      official_squad_row_id: row.official_squad_row_id,
      name: row.name,
      country: row.country,
      team_id: row.team_id,
      roster_status: row.roster_status,
      match_status: row.current_player_match.match_status,
      match_method: row.current_player_match.method,
      matched_player_id: row.current_player_match.player_id,
      candidate_player_ids: row.current_player_match.candidate_player_ids,
      validation_errors: row.validation_errors,
      validation_warnings: row.validation_warnings
    }));
  const recommendationFlags = reconciliation
    .filter((row) => ["excluded", "review"].includes(row.reconciliation_status))
    .map((row) => ({
      player_id: row.player_id,
      name: row.name,
      country: row.country,
      team_id: row.team_id,
      reconciliation_status: row.reconciliation_status,
      recommendation_action: row.recommendation_action,
      warnings: row.warnings
    }));

  return {
    schema_version: "official_squads_import_report_v0",
    generated_at: TODAY,
    source_checked: TODAY,
    status,
    input_file: inputPath,
    current_player_rows_checked: currentPlayerCount,
    summary,
    team_completeness: completeTeams,
    blocking_issues: officialRows.flatMap((row) =>
      row.validation_errors.map((error) => ({
        official_squad_row_id: row.official_squad_row_id,
        name: row.name,
        row: row.raw_row_index,
        error
      }))
    ),
    manual_review_rows: manualReviewRows,
    recommendation_flags: recommendationFlags,
    next_actions: status === "imported_ready_for_readiness_check"
      ? [
        "Review excluded/replacement player flags before promotion.",
        "Run node scripts/validateOfficialDataReadiness.mjs.",
        "Regenerate recommendations only after official fantasy players/prices/positions and rules are also imported."
      ]
      : [
        "Fix validation errors first.",
        "Resolve unmatched and review rows manually.",
        "Mark team_squad_complete only when the official source covers that team's final squad.",
        "Do not remove or downgrade players in active recommendation files until promotion is explicit."
      ]
  };
}

function waitingReport(inputPath, currentPlayerCount) {
  return {
    schema_version: "official_squads_import_report_v0",
    generated_at: TODAY,
    source_checked: TODAY,
    status: "awaiting_official_squads_input",
    input_file: inputPath,
    current_player_rows_checked: currentPlayerCount,
    required_fields: REQUIRED_FIELDS,
    accepted_input_formats: ["csv", "tsv", "json"],
    template_file: "data/imports/officialSquads_TEMPLATE.csv",
    output_files_when_input_exists: [
      OUTPUT_SQUADS,
      OUTPUT_REPORT
    ],
    next_actions: [
      "Download or transcribe final official squad data when available.",
      "Save it as data/imports/officialSquads.csv or pass --input path/to/file.csv.",
      "Run node scripts/importOfficialSquads.mjs.",
      "Review data/officialSquadsImportReport_v0.json before any player-pool promotion."
    ],
    safeguards: [
      "No player is deleted automatically.",
      "Current players are marked excluded only when their team is explicitly marked complete and they are absent from that official import.",
      "Unmatched official squad rows go to manual review.",
      "Excluded or review players are reported as recommendation flags, not removed from active model files."
    ]
  };
}

async function main() {
  const inputPath = argValue("--input") || DEFAULT_INPUT;
  const currentPlayersData = await readJson(CURRENT_PLAYERS);
  const currentPlayers = currentPlayersData.players || [];
  const indexes = currentPlayerIndexes(currentPlayers);

  if (!(await fileExists(inputPath))) {
    const report = waitingReport(inputPath, currentPlayers.length);
    await writeFile(OUTPUT_REPORT, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    console.log(`${OUTPUT_REPORT}: ${report.status}`);
    console.log(`waiting for input: ${inputPath}`);
    return;
  }

  const rawRows = await readImportRows(inputPath);
  const officialRows = normalizeOfficialSquadRows(rawRows, indexes);
  const completeTeams = teamCompleteness(officialRows);
  const reconciliation = currentPlayerReconciliation(currentPlayers, officialRows, completeTeams);
  const report = reportFromRows(inputPath, officialRows, reconciliation, completeTeams, currentPlayers.length);
  const output = {
    schema_version: "official_squads_v0",
    generated_at: TODAY,
    source_checked: TODAY,
    data_status: report.status,
    input_file: inputPath,
    summary: report.summary,
    officialSquads: officialRows,
    currentPlayerReconciliation: reconciliation
  };

  await writeFile(OUTPUT_SQUADS, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  await writeFile(OUTPUT_REPORT, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`${OUTPUT_SQUADS}: ${report.status}`);
  console.log(`${OUTPUT_REPORT}: ${report.summary.imported_rows} rows, ${report.summary.review_rows} review, ${report.summary.error_rows} errors`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
