import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const TODAY = "2026-06-02";

const PATHS = {
  officialOutput: "data/officialFantasyPlayers_v0.json",
  officialInput: "data/imports/officialFantasyPlayers.csv",
  players: "data/players.json",
  playerRecommendationInputs: "data/playerRecommendationInputs_v0.json",
  playerNationalTeamPerformance: "data/playerNationalTeamPerformance.json",
  playerPerformance: "data/playerPerformance.json",
  playerMinutesModel: "data/playerMinutesModel_v0.json",
  aliasCsv: "data/mappings/playerAliases_v1.csv",
  aliasJson: "data/playerAliases_v1.json",
  manualOverridesCsv: "data/mappings/playerIdentityManualOverrides_v1.csv",
  identityMap: "data/mappings/playerIdentityMap_v1.csv",
  reviewQueue: "data/review/playerIdentityReviewQueue_v1.csv",
  report: "data/playerIdentityMatchReport_v1.md"
};

const VALID_POSITIONS = new Set(["GK", "DEF", "MID", "FWD"]);
const VALID_MANUAL_OVERRIDE_ACTIONS = new Set([
  "map_to_internal",
  "create_thin_profile",
  "keep_in_review",
  "reject_candidate"
]);
const POSITION_MAP = new Map([
  ["gk", "GK"],
  ["gkp", "GK"],
  ["goalkeeper", "GK"],
  ["goalkeepers", "GK"],
  ["def", "DEF"],
  ["defender", "DEF"],
  ["defenders", "DEF"],
  ["mid", "MID"],
  ["midfielder", "MID"],
  ["midfielders", "MID"],
  ["fwd", "FWD"],
  ["for", "FWD"],
  ["forward", "FWD"],
  ["forwards", "FWD"],
  ["striker", "FWD"],
  ["strikers", "FWD"]
]);

const COUNTRY_ALIASES = new Map([
  ["america", "usa"],
  ["united states", "usa"],
  ["united states of america", "usa"],
  ["us", "usa"],
  ["usa", "usa"],
  ["iran", "ir-iran"],
  ["ir iran", "ir-iran"],
  ["islamic republic of iran", "ir-iran"],
  ["south korea", "korea-republic"],
  ["korea republic", "korea-republic"],
  ["republic of korea", "korea-republic"],
  ["korea", "korea-republic"],
  ["dr congo", "congo-dr"],
  ["congo dr", "congo-dr"],
  ["congo democratic republic", "congo-dr"],
  ["democratic republic of the congo", "congo-dr"],
  ["ivory coast", "cote-d-ivoire"],
  ["cote d ivoire", "cote-d-ivoire"],
  ["côte d ivoire", "cote-d-ivoire"],
  ["cape verde", "cabo-verde"],
  ["cabo verde", "cabo-verde"],
  ["turkey", "turkiye"],
  ["türkiye", "turkiye"],
  ["curacao", "curacao"],
  ["curaçao", "curacao"],
  ["bosnia herzegovina", "bosnia-and-herzegovina"],
  ["bosnia and herzegovina", "bosnia-and-herzegovina"],
  ["new zealand", "new-zealand"],
  ["saudi arabia", "saudi-arabia"],
  ["south africa", "south-africa"],
  ["czech republic", "czechia"]
]);

const NAME_SUFFIXES = new Set(["jr", "junior", "sr", "senior", "ii", "iii", "iv"]);
const CLUB_WORDS_TO_DROP = new Set(["fc", "cf", "sc", "ac", "cd", "club", "football", "soccer"]);
const SPECIAL_LATIN_CHARS = new Map([
  ["ß", "ss"],
  ["ẞ", "SS"],
  ["ø", "o"],
  ["Ø", "O"],
  ["đ", "d"],
  ["Đ", "D"],
  ["ð", "d"],
  ["Ð", "D"],
  ["þ", "th"],
  ["Þ", "Th"],
  ["ł", "l"],
  ["Ł", "L"],
  ["æ", "ae"],
  ["Æ", "AE"],
  ["œ", "oe"],
  ["Œ", "OE"],
  ["ı", "i"]
]);
const GIVEN_NAME_EQUIVALENTS = [
  ["alex", "alexander", "alexandre", "alejandro"],
  ["eli", "elijah"],
  ["gio", "giovanni"],
  ["leo", "leonardo"],
  ["matt", "matthew"],
  ["mohamed", "mohammed", "muhammad", "mohammad"],
  ["nico", "nicolas", "nicola", "nicholas", "nicolo"]
];
const GIVEN_NAME_LOOKUP = new Map(
  GIVEN_NAME_EQUIVALENTS.flatMap((group) => group.map((name) => [name, group]))
);
const REVIEWED_NAME_VARIANT_PAIRS = [
  ["alexis saelemaekers", "alexis saelemekars"],
  ["axel tuanzebe", "alex tuanzebe"],
  ["pablo paez gavira", "pablo paez gavi"],
  ["rustam ashurmatov", "rustamjon ashurmatov"],
  ["sabri ben hessen", "sabri ben hassan"]
];
const REVIEWED_NAME_VARIANTS = new Set(
  REVIEWED_NAME_VARIANT_PAIRS.flatMap(([a, b]) => [`${a}|||${b}`, `${b}|||${a}`])
);

const IDENTITY_HEADERS = [
  "internal_player_id",
  "official_fantasy_player_id",
  "official_name",
  "normalized_official_name",
  "country",
  "team_id",
  "matched_existing_player_id",
  "match_status",
  "match_confidence",
  "match_method",
  "matched_name",
  "matched_country",
  "matched_club",
  "matched_dob",
  "official_fantasy_position",
  "existing_model_position",
  "source_url",
  "source_checked",
  "profile_status",
  "data_quality_flags",
  "review_notes"
];

const REVIEW_HEADERS = [
  "review_id",
  "official_fantasy_player_id",
  "official_name",
  "country",
  "team_id",
  "official_position",
  "official_price",
  "candidate_internal_player_ids",
  "candidate_names",
  "candidate_clubs",
  "candidate_positions",
  "candidate_scores",
  "reason_for_review",
  "recommended_action",
  "review_status",
  "reviewed_by",
  "reviewed_at",
  "final_internal_player_id",
  "notes"
];

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

async function readOptionalJson(filePath) {
  try {
    return await readJson(filePath);
  } catch {
    return null;
  }
}

function removeDiacritics(value) {
  const expanded = String(value || "")
    .split("")
    .map((char) => SPECIAL_LATIN_CHARS.get(char) || char)
    .join("");

  return expanded
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizeName(value) {
  const tokens = removeDiacritics(value)
    .replace(/&/g, " and ")
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  while (tokens.length && NAME_SUFFIXES.has(tokens[tokens.length - 1])) {
    tokens.pop();
  }

  return tokens.join(" ");
}

function normalizeCountry(value) {
  const normalized = normalizeName(value);
  return COUNTRY_ALIASES.get(normalized) || normalized.replace(/\s+/g, "-");
}

function normalizeTeamId(value, country = "") {
  const raw = normalizeName(value);
  if (raw) {
    return COUNTRY_ALIASES.get(raw) || raw.replace(/\s+/g, "-");
  }
  return normalizeCountry(country);
}

function normalizePosition(value) {
  const normalized = normalizeName(value);
  const compact = normalized.replace(/\s+/g, "");
  const mapped = POSITION_MAP.get(normalized) || POSITION_MAP.get(compact);
  return mapped || String(value || "").trim().toUpperCase() || null;
}

function normalizeClub(value) {
  return normalizeName(value)
    .split(/\s+/)
    .filter((token) => token && !CLUB_WORDS_TO_DROP.has(token))
    .join(" ");
}

function slug(value) {
  return normalizeName(value).replace(/\s+/g, "-").replace(/^-+|-+$/g, "");
}

function hasValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function parseNumber(value) {
  if (!hasValue(value)) return null;
  const parsed = Number(String(value).replace(/,/g, "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const text = Array.isArray(value) ? value.join("|") : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(headers, rows) {
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(","))
  ].join("\n") + "\n";
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

async function readOfficialRows() {
  if (await fileExists(PATHS.officialOutput)) {
    const data = await readJson(PATHS.officialOutput);
    return {
      inputSource: PATHS.officialOutput,
      inputStatus: data.data_status || "official_output_found",
      rows: data.officialFantasyPlayers || data.players || data.rows || []
    };
  }

  if (await fileExists(PATHS.officialInput)) {
    const raw = await readFile(PATHS.officialInput, "utf8");
    const extension = path.extname(PATHS.officialInput).toLowerCase();
    const rows = extension === ".json"
      ? rowsFromOfficialJson(JSON.parse(raw))
      : parseDelimited(raw);
    return {
      inputSource: PATHS.officialInput,
      inputStatus: "raw_official_input_found_without_import_output",
      rows
    };
  }

  return {
    inputSource: PATHS.officialOutput,
    inputStatus: "missing_official_fantasy_players_output",
    rows: []
  };
}

function rowsFromOfficialJson(data) {
  if (Array.isArray(data)) return data;
  for (const key of ["officialFantasyPlayers", "players", "rows", "data"]) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
}

function pick(row, names) {
  for (const name of names) {
    if (hasValue(row?.[name])) return row[name];
  }
  const lookup = Object.fromEntries(Object.keys(row || {}).map((key) => [key.toLowerCase(), key]));
  for (const name of names) {
    const found = lookup[name.toLowerCase()];
    if (found && hasValue(row[found])) return row[found];
  }
  return null;
}

function normalizeOfficialRow(row, index) {
  const country = String(pick(row, ["country", "nation", "team", "team_name"]) || "").trim();
  const teamId = String(pick(row, ["team_id", "country_id", "national_team_id"]) || "").trim();
  const officialPosition = normalizePosition(pick(row, ["official_fantasy_position", "fantasy_position", "position", "pos"]));
  const priceRaw = pick(row, ["official_price", "price", "cost", "value"]);
  return {
    raw_row_index: row.raw_row_index || index + 1,
    official_fantasy_player_id: String(pick(row, ["official_fantasy_player_id", "fantasy_player_id", "official_player_id", "player_id", "id"]) || "").trim() || null,
    name: String(pick(row, ["name", "player_name", "full_name", "display_name"]) || "").trim() || null,
    normalized_name: normalizeName(pick(row, ["name", "player_name", "full_name", "display_name"])),
    country: country || null,
    normalized_country: normalizeCountry(country),
    team_id: teamId || normalizeTeamId(teamId, country) || null,
    normalized_team_id: normalizeTeamId(teamId, country),
    official_fantasy_position: VALID_POSITIONS.has(officialPosition) ? officialPosition : officialPosition,
    official_price: parseNumber(priceRaw),
    selectable_status: String(pick(row, ["selectable_status", "status", "available", "is_selectable"]) || "").trim() || null,
    source_url: String(pick(row, ["source_url", "url", "source"]) || "").trim() || null,
    source_checked: String(pick(row, ["source_checked", "checked_at", "last_checked", "date_checked"]) || "").trim() || null,
    fifa_player_id: String(pick(row, ["fifa_player_id", "fifa_id"]) || "").trim() || null,
    club: String(pick(row, ["club", "current_club", "team_club"]) || "").trim() || null,
    normalized_club: normalizeClub(pick(row, ["club", "current_club", "team_club"])),
    date_of_birth: String(pick(row, ["date_of_birth", "dob", "birth_date"]) || "").trim() || null
  };
}

function addToMap(map, key, value) {
  if (!key) return;
  const list = map.get(key) || [];
  list.push(value);
  map.set(key, list);
}

function buildInternalIndexes(players) {
  const indexes = {
    byOfficialId: new Map(),
    byCountryName: new Map(),
    byTeamName: new Map(),
    byName: new Map(),
    byClubName: new Map(),
    duplicateInternalNameCountryKeys: new Set()
  };

  for (const player of players) {
    const officialId = player?.fantasy_matching?.official_fantasy_id;
    if (officialId) indexes.byOfficialId.set(String(officialId), player);

    addToMap(indexes.byCountryName, `${player.normalized_country}:${player.normalized_name}`, player);
    addToMap(indexes.byTeamName, `${player.normalized_team_id}:${player.normalized_name}`, player);
    addToMap(indexes.byName, player.normalized_name, player);
    addToMap(indexes.byClubName, `${player.normalized_club}:${player.normalized_name}`, player);
  }

  for (const [key, candidates] of indexes.byCountryName.entries()) {
    if (candidates.length > 1) {
      indexes.duplicateInternalNameCountryKeys.add(key);
    }
  }

  return indexes;
}

function enrichInternalPlayers(players, { nationalRows, performanceRows, recommendationRows, minutesRows }) {
  const nationalById = new Map(nationalRows.map((row) => [row.player_id, row]));
  const performanceById = new Map(performanceRows.map((row) => [row.player_id, row]));
  const recommendationById = new Map(recommendationRows.map((row) => [row.player_id, row]));
  const minutesById = new Map(minutesRows.map((row) => [row.player_id, row]));

  return players.map((player) => {
    const recommendation = recommendationById.get(player.player_id) || {};
    const national = nationalById.get(player.player_id) || player.national_team_profile || {};
    const performance = performanceById.get(player.player_id) || {};
    const minutes = minutesById.get(player.player_id) || {};
    const club = player.club || recommendation.club || performance.club || null;
    const position = normalizePosition(player.position || recommendation.position || performance.position);
    return {
      ...player,
      club,
      league: player.league || recommendation.league || performance.league || null,
      position,
      date_of_birth: player.date_of_birth || player.dob || null,
      normalized_name: normalizeName(player.name),
      normalized_country: normalizeCountry(player.country),
      normalized_team_id: normalizeTeamId(player.team_id, player.country),
      normalized_club: normalizeClub(club),
      usage_summary: {
        has_national_usage: Boolean(
          national?.national_team_profile?.best_available_qualifier_stats_v0?.has_qualifier_stats ||
          national?.best_available_qualifier_stats_v0?.has_qualifier_stats ||
          minutes?.data_quality?.has_national_qualifier_usage
        ),
        country_role: minutes.country_role || national?.country_role_signal || null,
        role_confidence: minutes.role_confidence || null
      },
      performance_summary: {
        has_club_performance: Boolean(performance.player_id || minutes?.data_quality?.has_club_performance),
        club_minutes: performance.minutes ?? minutes?.model_inputs_v0?.club_minutes ?? null,
        club_starts: performance.starts ?? minutes?.model_inputs_v0?.club_starts ?? null
      }
    };
  });
}

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a) return b.length;
  if (!b) return a.length;
  const prev = Array.from({ length: b.length + 1 }, (_, index) => index);
  const curr = new Array(b.length + 1);
  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    prev.splice(0, prev.length, ...curr);
  }
  return prev[b.length];
}

function tokenSimilarity(a, b) {
  const aTokens = new Set(String(a || "").split(/\s+/).filter(Boolean));
  const bTokens = new Set(String(b || "").split(/\s+/).filter(Boolean));
  if (!aTokens.size || !bTokens.size) return 0;
  const shared = [...aTokens].filter((token) => bTokens.has(token)).length;
  const union = new Set([...aTokens, ...bTokens]).size;
  return shared / union;
}

function nameSimilarity(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const maxLength = Math.max(a.length, b.length);
  const editScore = maxLength ? 1 - (levenshtein(a, b) / maxLength) : 0;
  return Math.max(editScore, tokenSimilarity(a, b));
}

function nameTokens(value) {
  return String(value || "").split(/\s+/).filter(Boolean);
}

function tokensEquivalent(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;

  const aGroup = GIVEN_NAME_LOOKUP.get(a);
  if (aGroup && aGroup.includes(b)) return true;

  const maxLength = Math.max(a.length, b.length);
  const minLength = Math.min(a.length, b.length);
  if (minLength >= 4 && (a.startsWith(b) || b.startsWith(a))) return true;
  return maxLength >= 5 && levenshtein(a, b) <= 1;
}

function reviewedNameVariant(a, b) {
  return REVIEWED_NAME_VARIANTS.has(`${a}|||${b}`);
}

function orderedSubsequence(shortTokens, longTokens) {
  let cursor = 0;
  for (const token of shortTokens) {
    while (cursor < longTokens.length && !tokensEquivalent(token, longTokens[cursor])) {
      cursor += 1;
    }
    if (cursor >= longTokens.length) return false;
    cursor += 1;
  }
  return true;
}

function nameVariantSignals(a, b) {
  const aTokens = nameTokens(a);
  const bTokens = nameTokens(b);
  const similarity = nameSimilarity(a, b);
  const exactName = Boolean(a && b && a === b);
  const firstEquivalent = tokensEquivalent(aTokens[0], bTokens[0]);
  const lastEquivalent = tokensEquivalent(aTokens.at(-1), bTokens.at(-1));
  const shorter = aTokens.length <= bTokens.length ? aTokens : bTokens;
  const longer = aTokens.length <= bTokens.length ? bTokens : aTokens;
  const subsetMatch = shorter.length >= 2 && orderedSubsequence(shorter, longer);
  const firstLastMatch = aTokens.length >= 2 && bTokens.length >= 2 && firstEquivalent && lastEquivalent;
  const highSimilarityTypo = similarity >= 0.9 && firstLastMatch;
  const reviewedVariant = reviewedNameVariant(a, b);
  const safeVariant = exactName || subsetMatch || firstLastMatch || highSimilarityTypo || reviewedVariant;

  return {
    exactName,
    firstEquivalent,
    lastEquivalent,
    subsetMatch,
    firstLastMatch,
    highSimilarityTypo,
    reviewedVariant,
    safeVariant,
    nameSimilarity: Number(similarity.toFixed(3))
  };
}

function clubsMatch(officialClub, internalClub) {
  if (!officialClub || !internalClub) return false;
  if (officialClub === internalClub) return true;
  const similarity = nameSimilarity(officialClub, internalClub);
  return similarity >= 0.88 || officialClub.includes(internalClub) || internalClub.includes(officialClub);
}

async function readAliases() {
  if (await fileExists(PATHS.aliasJson)) {
    const data = await readJson(PATHS.aliasJson);
    const rows = Array.isArray(data) ? data : data.aliases || [];
    return rows.map((row) => ({
      alias: normalizeName(row.alias || row.name_alias || row.name),
      player_id: row.player_id || row.internal_player_id,
      country: normalizeCountry(row.country || "")
    })).filter((row) => row.alias && row.player_id);
  }

  if (await fileExists(PATHS.aliasCsv)) {
    const rows = parseDelimited(await readFile(PATHS.aliasCsv, "utf8"));
    return rows.map((row) => ({
      alias: normalizeName(row.alias || row.name_alias || row.name),
      player_id: row.player_id || row.internal_player_id,
      country: normalizeCountry(row.country || "")
    })).filter((row) => row.alias && row.player_id);
  }

  return [];
}

function normalizeManualOverride(row) {
  const action = normalizeName(row.action || "").replace(/\s+/g, "_");
  return {
    official_fantasy_player_id: String(row.official_fantasy_player_id || "").trim(),
    official_name: String(row.official_name || "").trim(),
    country: normalizeCountry(row.country || ""),
    action,
    internal_player_id: String(row.internal_player_id || "").trim(),
    match_status: String(row.match_status || "").trim(),
    reason: String(row.reason || "").trim(),
    source_url: String(row.source_url || "").trim(),
    source_checked: String(row.source_checked || "").trim(),
    notes: String(row.notes || "").trim()
  };
}

async function readManualOverrides() {
  if (!(await fileExists(PATHS.manualOverridesCsv))) return [];
  const rows = parseDelimited(await readFile(PATHS.manualOverridesCsv, "utf8"));
  return rows
    .map(normalizeManualOverride)
    .filter((row) =>
      row.official_fantasy_player_id &&
      VALID_MANUAL_OVERRIDE_ACTIONS.has(row.action)
    );
}

function manualOverrideMap(overrides) {
  const byOfficialId = new Map();
  for (const override of overrides) {
    const rows = byOfficialId.get(override.official_fantasy_player_id) || [];
    rows.push(override);
    byOfficialId.set(override.official_fantasy_player_id, rows);
  }
  return byOfficialId;
}

function manualOverrideForRow(row, overridesById) {
  const rows = overridesById.get(String(row.official_fantasy_player_id || "")) || [];
  if (!rows.length) return null;
  return rows.find((override) => !override.country || override.country === row.normalized_country) || rows[0];
}

function thinProfileId(row, override = {}) {
  if (override.internal_player_id) return override.internal_player_id;
  return row.team_id && row.name ? `thin-${normalizeTeamId(row.team_id, row.country)}-${slug(row.name)}` : "";
}

function manualOverrideNotes(override) {
  return [override.reason, override.notes].filter(Boolean).join(" ");
}

function applyManualOverride(row, override, playerById) {
  const notes = manualOverrideNotes(override) || `Manual override action: ${override.action}.`;

  if (override.action === "map_to_internal") {
    const matched = playerById.get(override.internal_player_id);
    if (!matched) {
      return {
        status: "needs_review",
        confidence: 0,
        method: "manual",
        matched: null,
        reason: "manual_override_missing_internal",
        reviewRequired: true,
        thinProfileId: "",
        reviewNotes: `Manual override could not find internal_player_id ${override.internal_player_id}. ${notes}`
      };
    }

    return {
      status: override.match_status || "manual_confirmed",
      confidence: 1,
      method: "manual",
      matched,
      reason: "",
      reviewRequired: false,
      thinProfileId: "",
      reviewNotes: notes
    };
  }

  if (override.action === "create_thin_profile") {
    const generatedThinId = thinProfileId(row, override);
    return {
      status: override.match_status || "new_player_created",
      confidence: generatedThinId ? 1 : 0,
      method: "new_profile",
      matched: null,
      reason: generatedThinId ? "" : "manual_override_missing_thin_profile_id",
      reviewRequired: !generatedThinId,
      thinProfileId: generatedThinId,
      reviewNotes: notes
    };
  }

  if (override.action === "keep_in_review" || override.action === "reject_candidate") {
    return {
      status: override.match_status || (override.action === "reject_candidate" ? "rejected_match" : "needs_review"),
      confidence: 0,
      method: "manual",
      matched: null,
      reason: override.reason || override.action,
      reviewRequired: true,
      thinProfileId: "",
      reviewNotes: notes
    };
  }

  return {
    status: "needs_review",
    confidence: 0,
    method: "manual",
    matched: null,
    reason: "invalid_manual_override_action",
    reviewRequired: true,
    thinProfileId: "",
    reviewNotes: notes
  };
}

function aliasCandidates(row, aliases, playerById) {
  return aliases
    .filter((alias) => alias.alias === row.normalized_name && (!alias.country || alias.country === row.normalized_country))
    .map((alias) => playerById.get(alias.player_id))
    .filter(Boolean);
}

function uniqueRows(rows) {
  const seen = new Set();
  const output = [];
  for (const row of rows) {
    if (!row?.player_id || seen.has(row.player_id)) continue;
    seen.add(row.player_id);
    output.push(row);
  }
  return output;
}

function candidatePool(row, indexes, aliases, playerById) {
  const candidates = [];
  const exactOfficial = row.official_fantasy_player_id ? indexes.byOfficialId.get(String(row.official_fantasy_player_id)) : null;
  if (exactOfficial) candidates.push(exactOfficial);
  candidates.push(...(indexes.byCountryName.get(`${row.normalized_country}:${row.normalized_name}`) || []));
  candidates.push(...(indexes.byTeamName.get(`${row.normalized_team_id}:${row.normalized_name}`) || []));
  candidates.push(...(indexes.byClubName.get(`${row.normalized_club}:${row.normalized_name}`) || []));
  candidates.push(...aliasCandidates(row, aliases, playerById));

  const broadNameMatches = indexes.byName.get(row.normalized_name) || [];
  candidates.push(...broadNameMatches);

  if (row.normalized_name && row.normalized_country) {
    const countryPlayers = [...indexes.byCountryName.values()].flat()
      .filter((player) => player.normalized_country === row.normalized_country);
    for (const player of countryPlayers) {
      const signals = nameVariantSignals(row.normalized_name, player.normalized_name);
      if (signals.safeVariant || signals.nameSimilarity >= 0.82) {
        candidates.push(player);
      }
    }
  }

  return uniqueRows(candidates);
}

function scoreCandidate(row, candidate, aliases) {
  const officialId = row.official_fantasy_player_id ? String(row.official_fantasy_player_id) : null;
  const candidateOfficialId = candidate?.fantasy_matching?.official_fantasy_id
    ? String(candidate.fantasy_matching.official_fantasy_id)
    : null;
  const exactOfficialId = Boolean(officialId && candidateOfficialId && officialId === candidateOfficialId);
  const nameSignals = nameVariantSignals(row.normalized_name, candidate.normalized_name);
  const exactName = nameSignals.exactName;
  const sameCountry = row.normalized_country === candidate.normalized_country;
  const sameTeam = row.normalized_team_id === candidate.normalized_team_id;
  const samePosition = normalizePosition(row.official_fantasy_position) === normalizePosition(candidate.position);
  const positionConflict = Boolean(row.official_fantasy_position && candidate.position && !samePosition);
  const sameDob = Boolean(row.date_of_birth && candidate.date_of_birth && row.date_of_birth === candidate.date_of_birth);
  const dobConflict = Boolean(row.date_of_birth && candidate.date_of_birth && row.date_of_birth !== candidate.date_of_birth);
  const sameClub = clubsMatch(row.normalized_club, candidate.normalized_club);
  const clubConflict = Boolean(row.normalized_club && candidate.normalized_club && !sameClub);
  const aliasMatch = aliases.some((alias) =>
    alias.player_id === candidate.player_id &&
    alias.alias === row.normalized_name &&
    (!alias.country || alias.country === row.normalized_country)
  );
  const similarity = nameSignals.nameSimilarity;

  let score = 0;
  if (exactOfficialId) {
    score = 1;
  } else {
    score += exactName ? 0.45 : 0.45 * similarity;
    if (sameCountry || sameTeam) score += 0.25;
    if (sameDob) score += 0.15;
    if (dobConflict) score -= 0.15;
    if (sameClub) score += 0.1;
    if (clubConflict) score -= 0.1;
    if (samePosition) score += 0.05;
    if (positionConflict && !exactName && !nameSignals.safeVariant) score -= 0.1;
    if (aliasMatch) score += 0.05;

    if (exactName && sameCountry && sameTeam) score = Math.max(score, 0.97);
    if (exactName && (sameCountry || sameTeam) && sameClub) score = Math.max(score, 0.98);
    if (exactName && (sameCountry || sameTeam) && samePosition) score = Math.max(score, 0.96);
    if (exactName && (sameCountry || sameTeam)) score = Math.max(score, 0.95);
    if (nameSignals.safeVariant && (sameCountry || sameTeam) && samePosition) score = Math.max(score, 0.96);
    if (nameSignals.safeVariant && (sameCountry || sameTeam)) score = Math.max(score, 0.95);
    if (exactName && sameDob) score = Math.max(score, 0.98);
    if (aliasMatch && (sameCountry || sameTeam)) score = Math.max(score, 0.95);
  }

  let method = "fuzzy_name_country";
  if (exactOfficialId) method = "official_id";
  else if (exactName && sameCountry && sameDob) method = "name_country_dob";
  else if (exactName && sameCountry && sameClub) method = "name_country_club";
  else if (exactName && sameCountry) method = "exact_name_country";
  else if (exactName && sameTeam) method = "exact_name_team";
  else if (aliasMatch) method = "alias_match";
  else if (nameSignals.reviewedVariant && (sameCountry || sameTeam)) method = "reviewed_name_variant";
  else if (nameSignals.safeVariant && (sameCountry || sameTeam)) method = "name_variant_country";
  else if (exactName && sameClub) method = "name_club";
  else if (similarity >= 0.82 && (sameCountry || sameTeam) && samePosition) method = "fuzzy_name_country";

  return {
    player: candidate,
    score: Math.max(0, Math.min(1, Number(score.toFixed(3)))),
    method,
    signals: {
      exactOfficialId,
      exactName,
      sameCountry,
      sameTeam,
      sameDob,
      dobConflict,
      sameClub,
      clubConflict,
      samePosition,
      positionConflict,
      aliasMatch,
      nameSimilarity: Number(similarity.toFixed(3)),
      safeNameVariant: nameSignals.safeVariant,
      nameSubsetMatch: nameSignals.subsetMatch,
      nameFirstLastMatch: nameSignals.firstLastMatch,
      nameHighSimilarityTypo: nameSignals.highSimilarityTypo
    }
  };
}

function safePositionConflict(row, top, closeCandidates, internalDuplicateNameCountryKeys) {
  if (!top?.signals.positionConflict) return false;
  if (closeCandidates.length > 1) return false;
  if (internalDuplicateNameCountryKeys.has(`${row.normalized_country}:${row.normalized_name}`)) return false;
  if (top.signals.clubConflict || top.signals.dobConflict) return false;
  if (!top.signals.sameCountry && !top.signals.sameTeam) return false;
  return top.signals.exactOfficialId || top.signals.exactName || top.signals.safeNameVariant;
}

function reasonForReview(row, scoredCandidates, duplicateOfficialIds, internalDuplicateNameCountryKeys) {
  if (row.official_fantasy_player_id && duplicateOfficialIds.has(row.official_fantasy_player_id)) return "duplicate_official_id";
  if (!row.official_fantasy_position || !VALID_POSITIONS.has(row.official_fantasy_position)) return "missing_official_position";
  if (row.official_price === null) return "missing_official_price";
  if (!scoredCandidates.length) return "no_candidate_found";

  const top = scoredCandidates[0];
  const closeCandidates = scoredCandidates.filter((candidate) => candidate.score >= top.score - 0.05);
  if (closeCandidates.length > 1) return "multiple_candidate_matches";
  if (internalDuplicateNameCountryKeys.has(`${row.normalized_country}:${row.normalized_name}`)) return "multiple_candidate_matches";
  if (!top.signals.sameCountry && !top.signals.sameTeam) return "country_conflict";
  if (top.signals.clubConflict) return "club_conflict";
  if (top.signals.dobConflict) return "date_of_birth_conflict";
  if (top.score < 0.85) return "low_confidence_candidate";
  if (top.signals.positionConflict && !safePositionConflict(row, top, closeCandidates, internalDuplicateNameCountryKeys)) return "position_conflict";
  if (top.score < 0.95) return "name_conflict";
  return "";
}

function recommendedAction(reason, hasThinProfile) {
  if (hasThinProfile) return "Confirm whether this official player is truly new, then enrich thin profile with club and national-team usage.";
  switch (reason) {
    case "duplicate_official_id":
      return "Resolve duplicate official fantasy ID before accepting any mapping.";
    case "multiple_candidate_matches":
      return "Choose one internal player manually or reject all duplicate candidates.";
    case "missing_official_price":
      return "Keep official_price missing and block model rerun until source-backed price is added.";
    case "missing_official_position":
      return "Keep official position missing and block model rerun until source-backed position is added.";
    case "position_conflict":
      return "Review unresolved position conflict only if identity evidence is not otherwise clean.";
    case "duplicate_internal_mapping":
      return "Resolve duplicate accepted internal mapping before treating either official row as clean.";
    case "low_confidence_candidate":
      return "Keep in identity review; candidate exists but score is below the safe acceptance threshold.";
    case "club_conflict":
      return "Check current club/source date before accepting the identity match.";
    case "country_conflict":
      return "Do not accept until country/team identity is manually confirmed.";
    case "date_of_birth_conflict":
      return "Use DOB/source-backed identity evidence before accepting the match.";
    case "no_candidate_found":
      return "Create or confirm a thin profile only if this official player is absent from current internal data.";
    default:
      return "Review candidate identity before treating as a clean match.";
  }
}

function dataQualityFlags(row, matchStatus, matched) {
  const flags = [];
  if (matchStatus === "new_player_created") flags.push("thin_profile", "confirmed_absent_from_current_internal_data");
  if (!row.club) flags.push("missing_club_data");
  flags.push("missing_national_team_usage_review");
  if (row.official_price === null) flags.push("missing_official_price");
  if (!row.official_fantasy_position || !VALID_POSITIONS.has(row.official_fantasy_position)) flags.push("missing_official_position");
  if (
    matched?.position &&
    row.official_fantasy_position &&
    normalizePosition(matched.position) !== normalizePosition(row.official_fantasy_position)
  ) {
    flags.push("position_conflict");
  }
  return [...new Set(flags)];
}

function matchRow(row, scoredCandidates, duplicateOfficialIds, internalDuplicateNameCountryKeys) {
  const top = scoredCandidates[0] || null;
  const closeCandidates = top ? scoredCandidates.filter((candidate) => candidate.score >= top.score - 0.05) : [];
  const reason = reasonForReview(row, scoredCandidates, duplicateOfficialIds, internalDuplicateNameCountryKeys);
  const hasBlockingOfficialFieldGap = ["missing_official_price", "missing_official_position", "duplicate_official_id"].includes(reason);

  if (!top) {
    const thinId = row.team_id && row.name ? `thin-${normalizeTeamId(row.team_id, row.country)}-${slug(row.name)}` : "";
    return {
      status: thinId && !hasBlockingOfficialFieldGap ? "new_player_created" : "insufficient_data",
      confidence: thinId ? 1 : 0,
      method: thinId ? "new_profile" : "manual",
      matched: null,
      reason,
      reviewRequired: !thinId || hasBlockingOfficialFieldGap,
      thinProfileId: thinId,
      reviewNotes: thinId
        ? "Confirmed absent from current internal data after normalized and fuzzy identity matching; staged as thin_profile only, not added to active player model."
        : "Official row is too incomplete to create a thin profile."
    };
  }

  const duplicateCandidate = closeCandidates.length > 1 || internalDuplicateNameCountryKeys.has(`${row.normalized_country}:${row.normalized_name}`);
  const conflictReview = Boolean(reason && reason !== "no_candidate_found");
  const reviewRequired = duplicateCandidate || conflictReview || top.score < 0.95 || hasBlockingOfficialFieldGap;

  if (reviewRequired) {
    return {
      status: duplicateCandidate ? "duplicate_candidate" : "needs_review",
      confidence: top.score,
      method: top.method,
      matched: top.player,
      reason: duplicateCandidate ? "multiple_candidate_matches" : reason,
      reviewRequired: true,
      thinProfileId: "",
      reviewNotes: "Candidate was not accepted as a clean match because review criteria were triggered."
    };
  }

  return {
    status: top.method === "official_id" || top.method === "exact_name_country" || top.method === "exact_name_team"
      ? "exact_match"
      : "strong_match",
    confidence: top.score,
    method: top.method,
    matched: top.player,
    reason: "",
    reviewRequired: false,
    thinProfileId: "",
    reviewNotes: ""
  };
}

function duplicateOfficialIds(rows) {
  const counts = new Map();
  rows.forEach((row) => {
    if (row.official_fantasy_player_id) {
      counts.set(row.official_fantasy_player_id, (counts.get(row.official_fantasy_player_id) || 0) + 1);
    }
  });
  return new Set([...counts.entries()].filter(([, count]) => count > 1).map(([id]) => id));
}

function countValues(rows, key) {
  return rows.reduce((counts, row) => {
    const value = row?.[key] || "none";
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}

function hasFlag(row, flag) {
  const flags = Array.isArray(row.data_quality_flags)
    ? row.data_quality_flags
    : String(row.data_quality_flags || "").split("|");
  return flags.includes(flag);
}

function acceptedRows(rows) {
  return rows.filter((item) => ["exact_match", "strong_match", "manual_confirmed"].includes(item.match_status));
}

function acceptedInternalDuplicates(mapRows) {
  const acceptedInternalIds = new Map();
  const conflicts = [];

  for (const row of acceptedRows(mapRows)) {
    if (!row.matched_existing_player_id) continue;
    const prior = acceptedInternalIds.get(row.matched_existing_player_id) || [];
    prior.push(row.official_fantasy_player_id);
    acceptedInternalIds.set(row.matched_existing_player_id, prior);
  }

  for (const [internalId, officialIds] of acceptedInternalIds.entries()) {
    if (officialIds.length > 1) {
      conflicts.push({ internalId, officialIds });
    }
  }

  return conflicts;
}

function buildOutputs({ officialRows, players, aliases, manualOverrides, inputSource, inputStatus }) {
  const playerById = new Map(players.map((player) => [player.player_id, player]));
  const indexes = buildInternalIndexes(players);
  const duplicateOfficialIdSet = duplicateOfficialIds(officialRows);
  const manualOverridesById = manualOverrideMap(manualOverrides);
  const mapRows = [];
  const reviewRows = [];

  officialRows.forEach((row, index) => {
    const manualOverride = manualOverrideForRow(row, manualOverridesById);
    if (manualOverride) {
      const result = applyManualOverride(row, manualOverride, playerById);
      const internalId = result.matched?.player_id || result.thinProfileId || "";
      const flags = dataQualityFlags(row, result.status, result.matched);

      mapRows.push({
        internal_player_id: internalId,
        official_fantasy_player_id: row.official_fantasy_player_id,
        official_name: row.name,
        normalized_official_name: row.normalized_name,
        country: row.country,
        team_id: row.team_id,
        matched_existing_player_id: result.matched?.player_id || "",
        match_status: result.status,
        match_confidence: result.confidence.toFixed(3),
        match_method: result.method,
        matched_name: result.matched?.name || "",
        matched_country: result.matched?.country || "",
        matched_club: result.matched?.club || "",
        matched_dob: result.matched?.date_of_birth || "",
        official_fantasy_position: row.official_fantasy_position,
        existing_model_position: result.matched?.position || "",
        source_url: row.source_url,
        source_checked: row.source_checked,
        profile_status: result.status === "new_player_created" ? "thin_profile" : "",
        data_quality_flags: flags,
        review_notes: result.reviewNotes
      });

      if (result.reviewRequired) {
        const topCandidates = result.matched ? [{
          player: result.matched,
          score: result.confidence
        }] : [];

        reviewRows.push({
          review_id: `identity-review-manual-${row.official_fantasy_player_id || String(index + 1).padStart(4, "0")}`,
          official_fantasy_player_id: row.official_fantasy_player_id,
          official_name: row.name,
          country: row.country,
          team_id: row.team_id,
          official_position: row.official_fantasy_position,
          official_price: row.official_price,
          candidate_internal_player_ids: topCandidates.map((candidate) => candidate.player.player_id),
          candidate_names: topCandidates.map((candidate) => candidate.player.name),
          candidate_clubs: topCandidates.map((candidate) => candidate.player.club || ""),
          candidate_positions: topCandidates.map((candidate) => candidate.player.position || ""),
          candidate_scores: topCandidates.map((candidate) => `${candidate.player.player_id}:${candidate.score.toFixed(3)}`),
          reason_for_review: result.reason || "manual_override_review",
          recommended_action: recommendedAction(result.reason, false),
          review_status: "open",
          reviewed_by: "",
          reviewed_at: "",
          final_internal_player_id: "",
          notes: result.reviewNotes
        });
      }

      return;
    }

    const candidates = candidatePool(row, indexes, aliases, playerById);
    const scoredCandidates = candidates
      .map((candidate) => scoreCandidate(row, candidate, aliases))
      .sort((a, b) => b.score - a.score || a.player.player_id.localeCompare(b.player.player_id));
    const result = matchRow(row, scoredCandidates, duplicateOfficialIdSet, indexes.duplicateInternalNameCountryKeys);
    const internalId = result.matched?.player_id || result.thinProfileId || "";
    const flags = dataQualityFlags(row, result.status, result.matched);

    mapRows.push({
      internal_player_id: internalId,
      official_fantasy_player_id: row.official_fantasy_player_id,
      official_name: row.name,
      normalized_official_name: row.normalized_name,
      country: row.country,
      team_id: row.team_id,
      matched_existing_player_id: result.matched?.player_id || "",
      match_status: result.status,
      match_confidence: result.confidence.toFixed(3),
      match_method: result.method,
      matched_name: result.matched?.name || "",
      matched_country: result.matched?.country || "",
      matched_club: result.matched?.club || "",
      matched_dob: result.matched?.date_of_birth || "",
      official_fantasy_position: row.official_fantasy_position,
      existing_model_position: result.matched?.position || "",
      source_url: row.source_url,
      source_checked: row.source_checked,
      profile_status: result.status === "new_player_created" ? "thin_profile" : "",
      data_quality_flags: flags,
      review_notes: result.reviewNotes
    });

    if (result.reviewRequired) {
      const topCandidates = scoredCandidates.slice(0, 5);
      const hasThinProfile = result.status === "new_player_created";
      reviewRows.push({
        review_id: `identity-review-${String(index + 1).padStart(4, "0")}`,
        official_fantasy_player_id: row.official_fantasy_player_id,
        official_name: row.name,
        country: row.country,
        team_id: row.team_id,
        official_position: row.official_fantasy_position,
        official_price: row.official_price,
        candidate_internal_player_ids: topCandidates.map((candidate) => candidate.player.player_id),
        candidate_names: topCandidates.map((candidate) => candidate.player.name),
        candidate_clubs: topCandidates.map((candidate) => candidate.player.club || ""),
        candidate_positions: topCandidates.map((candidate) => candidate.player.position || ""),
        candidate_scores: topCandidates.map((candidate) => `${candidate.player.player_id}:${candidate.score.toFixed(3)}`),
        reason_for_review: result.reason || "name_conflict",
        recommended_action: recommendedAction(result.reason, hasThinProfile),
        review_status: "open",
        reviewed_by: "",
        reviewed_at: "",
        final_internal_player_id: "",
        notes: result.reviewNotes
      });
    }
  });

  const officialRowById = new Map(officialRows.map((row) => [row.official_fantasy_player_id, row]));
  const initialInternalDuplicateConflicts = acceptedInternalDuplicates(mapRows);
  const duplicateInternalIds = new Set(initialInternalDuplicateConflicts.map((conflict) => conflict.internalId));

  if (duplicateInternalIds.size) {
    for (const row of mapRows) {
      if (!duplicateInternalIds.has(row.matched_existing_player_id) || !["exact_match", "strong_match", "manual_confirmed"].includes(row.match_status)) {
        continue;
      }

      const officialRow = officialRowById.get(row.official_fantasy_player_id) || {};
      row.match_status = "duplicate_candidate";
      row.data_quality_flags = [...new Set([...(Array.isArray(row.data_quality_flags) ? row.data_quality_flags : []), "duplicate_internal_mapping"])];
      row.review_notes = "Internal player is accepted for multiple official fantasy IDs; manual identity review required.";

      reviewRows.push({
        review_id: `identity-review-duplicate-internal-${row.official_fantasy_player_id}`,
        official_fantasy_player_id: row.official_fantasy_player_id,
        official_name: row.official_name,
        country: row.country,
        team_id: row.team_id,
        official_position: row.official_fantasy_position,
        official_price: officialRow.official_price,
        candidate_internal_player_ids: [row.matched_existing_player_id],
        candidate_names: [row.matched_name],
        candidate_clubs: [row.matched_club || ""],
        candidate_positions: [row.existing_model_position || ""],
        candidate_scores: [`${row.matched_existing_player_id}:${Number(row.match_confidence).toFixed(3)}`],
        reason_for_review: "duplicate_internal_mapping",
        recommended_action: recommendedAction("duplicate_internal_mapping", false),
        review_status: "open",
        reviewed_by: "",
        reviewed_at: "",
        final_internal_player_id: "",
        notes: row.review_notes
      });
    }
  }

  const internalDuplicateConflicts = acceptedInternalDuplicates(mapRows);

  const summary = {
    inputSource,
    inputStatus,
    totalOfficialPlayers: officialRows.length,
    exactMatches: mapRows.filter((row) => row.match_status === "exact_match").length,
    strongMatches: mapRows.filter((row) => row.match_status === "strong_match").length,
    manualConfirmedMatches: mapRows.filter((row) => row.match_status === "manual_confirmed").length,
    newThinProfiles: mapRows.filter((row) => row.match_status === "new_player_created").length,
    reviewCases: reviewRows.length,
    reviewReasonCounts: countValues(reviewRows, "reason_for_review"),
    topReviewCountryCounts: countValues(reviewRows, "country"),
    topReviewPositionCounts: countValues(reviewRows, "official_position"),
    acceptedPositionConflicts: mapRows.filter((row) =>
      ["exact_match", "strong_match", "manual_confirmed"].includes(row.match_status) &&
      hasFlag(row, "position_conflict")
    ).length,
    unresolvedPositionConflicts: reviewRows.filter((row) => row.reason_for_review === "position_conflict").length,
    confirmedThinProfiles: mapRows.filter((row) =>
      row.match_status === "new_player_created" &&
      hasFlag(row, "confirmed_absent_from_current_internal_data")
    ).length,
    missingOfficialPriceRows: officialRows.filter((row) => row.official_price === null).length,
    missingOfficialPositionRows: officialRows.filter((row) =>
      !row.official_fantasy_position || !VALID_POSITIONS.has(row.official_fantasy_position)
    ).length,
    duplicateCandidateReviewCases: reviewRows.filter((row) => row.reason_for_review === "multiple_candidate_matches").length,
    duplicateInternalMappingReviewCases: reviewRows.filter((row) => row.reason_for_review === "duplicate_internal_mapping").length,
    unresolvedHighRiskIdentityConflicts: reviewRows.length,
    duplicateOfficialIdConflicts: duplicateOfficialIdSet.size,
    duplicateInternalMappingConflicts: internalDuplicateConflicts.length,
    duplicateInternalNameCountryKeys: indexes.duplicateInternalNameCountryKeys.size,
    aliasesLoaded: aliases.length,
    manualOverridesLoaded: manualOverrides.length
  };

  return { mapRows, reviewRows, summary, internalDuplicateConflicts };
}

function formatTopCounts(counts, limit = 10) {
  const entries = Object.entries(counts || {})
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit);
  return entries.length ? entries.map(([key, value]) => `- ${key}: ${value}`).join("\n") : "- None";
}

function gateLine(label, blocked, detail) {
  return `- ${blocked ? "BLOCKED" : "PASS"}: ${label}${detail ? ` (${detail})` : ""}`;
}

function buildReport({ summary, internalDataSummary, internalDuplicateConflicts }) {
  const blocked =
    summary.totalOfficialPlayers === 0 ||
    summary.reviewCases > 0 ||
    summary.duplicateOfficialIdConflicts > 0 ||
    summary.duplicateCandidateReviewCases > 0 ||
    summary.duplicateInternalMappingConflicts > 0 ||
    summary.missingOfficialPriceRows > 0 ||
    summary.missingOfficialPositionRows > 0;
  return `# Player Identity Match Report v1

Generated: ${TODAY}

## Scope

This MATCH-1 pass prepares official fantasy player identity matching only. It does not rerun score predictions, player projections, recommendations, Team Builder logic, captain logic, substitution logic, browser-ready files, or any active model output.

## Input Status

- Official player source checked: \`${summary.inputSource}\`
- Input status: \`${summary.inputStatus}\`
- Official fantasy players processed: ${summary.totalOfficialPlayers}
- Active internal player source: \`data/players.json\`
- Supporting identity context inspected: \`data/playerRecommendationInputs_v0.json\`, \`data/playerNationalTeamPerformance.json\`, \`data/playerPerformance.json\`, \`data/playerMinutesModel_v0.json\`

## Internal Player Inventory

- Internal player rows: ${internalDataSummary.playerRows}
- Unique internal player IDs: ${internalDataSummary.uniquePlayerIds}
- Current team IDs: ${internalDataSummary.teamIds.join(", ")}
- Rows with club: ${internalDataSummary.rowsWithClub}
- Rows with league: ${internalDataSummary.rowsWithLeague}
- Rows with national-team usage signal: ${internalDataSummary.rowsWithNationalUsage}
- Rows with club-performance signal: ${internalDataSummary.rowsWithClubPerformance}
- Alias rows loaded: ${summary.aliasesLoaded}
- Manual override rows loaded: ${summary.manualOverridesLoaded}

## Match Summary

- Exact matches: ${summary.exactMatches}
- Strong matches: ${summary.strongMatches}
- Manual-confirmed matches: ${summary.manualConfirmedMatches}
- New thin profiles staged: ${summary.newThinProfiles}
- Confirmed thin profiles absent from current internal data: ${summary.confirmedThinProfiles}
- Review cases: ${summary.reviewCases}
- Position conflicts accepted as identity matches with audit flag: ${summary.acceptedPositionConflicts}
- Position conflicts still unresolved: ${summary.unresolvedPositionConflicts}
- Duplicate official fantasy ID conflicts: ${summary.duplicateOfficialIdConflicts}
- One-official-to-multiple-internal review cases: ${summary.duplicateCandidateReviewCases}
- One-internal-to-multiple-official review cases: ${summary.duplicateInternalMappingReviewCases}
- Duplicate accepted internal-player mapping conflicts: ${summary.duplicateInternalMappingConflicts}
- Duplicate internal name-country keys available for review detection: ${summary.duplicateInternalNameCountryKeys}
- Missing official prices: ${summary.missingOfficialPriceRows}
- Missing official positions: ${summary.missingOfficialPositionRows}

## Review Queue Breakdown

Top review reasons:

${formatTopCounts(summary.reviewReasonCounts)}

Top review countries:

${formatTopCounts(summary.topReviewCountryCounts)}

Review positions:

${formatTopCounts(summary.topReviewPositionCounts)}

## Outputs

- \`data/mappings/playerIdentityMap_v1.csv\`
- \`data/review/playerIdentityReviewQueue_v1.csv\`
- \`data/playerIdentityMatchReport_v1.md\`
- \`scripts/matchOfficialFantasyPlayers.mjs\`

## Matching Rules Implemented

The helper normalizes names, removes diacritics, normalizes country/team IDs, positions, and clubs, and supports optional alias rows from \`data/playerAliases_v1.json\` or \`data/mappings/playerAliases_v1.csv\` if either file exists.

Manual override rows from \`data/mappings/playerIdentityManualOverrides_v1.csv\`, when present, are applied before automated candidate scoring.

Candidate order:

1. Existing official fantasy ID.
2. Exact normalized name plus country.
3. Exact normalized name plus team ID.
4. Normalized name plus date of birth, when available.
5. Normalized name plus current club, when available.
6. Fuzzy name plus country/team plus broad position.
7. Alias table, if available.
8. Manual review or thin-profile staging.

Acceptance thresholds:

- \`>= 0.95\`: accepted only if no duplicate, official-field, country, date-of-birth, or club conflict is triggered.
- Clean official-position conflicts are accepted as identity matches only when official name/country evidence is otherwise safe; the official fantasy position remains the future active fantasy position and the internal position remains audit context.
- \`0.85\` to \`< 0.95\`: review.
- \`< 0.85\`: review or no reliable match.
- Candidate scores within 0.05 of the top candidate trigger review.

## Quality Gates

${gateLine("Duplicate official fantasy IDs", summary.duplicateOfficialIdConflicts > 0, String(summary.duplicateOfficialIdConflicts))}
${gateLine("One official player mapped to multiple internal candidates", summary.duplicateCandidateReviewCases > 0, String(summary.duplicateCandidateReviewCases))}
${gateLine("One internal player accepted for multiple official players", summary.duplicateInternalMappingConflicts > 0, String(summary.duplicateInternalMappingConflicts))}
${gateLine("Missing official prices", summary.missingOfficialPriceRows > 0, String(summary.missingOfficialPriceRows))}
${gateLine("Missing official positions", summary.missingOfficialPositionRows > 0, String(summary.missingOfficialPositionRows))}
${gateLine("Unresolved high-risk identity conflicts", summary.unresolvedHighRiskIdentityConflicts > 0, String(summary.unresolvedHighRiskIdentityConflicts))}

## Blockers Before Model Rerun

${blocked ? "- Project remains blocked for model rerun." : "- Identity matching has no open blocker in this report, but full official-data readiness must still pass before model reruns."}
${summary.totalOfficialPlayers === 0 ? "- No official fantasy player import output exists yet, so no player identity matching could be performed." : ""}
${summary.reviewCases > 0 ? "- Open identity review cases must be resolved before downstream models treat those rows as clean matches." : ""}
${summary.duplicateOfficialIdConflicts > 0 ? "- Duplicate official fantasy IDs must be resolved." : ""}
${summary.duplicateCandidateReviewCases > 0 ? "- Official rows with multiple internal candidates must stay in review." : ""}
${summary.duplicateInternalMappingReviewCases > 0 ? "- Internal-player mappings shared by multiple official rows must stay in review." : ""}
${summary.duplicateInternalMappingConflicts > 0 ? "- Duplicate accepted internal mappings must be resolved." : ""}
${summary.missingOfficialPriceRows > 0 ? "- Missing official prices block model rerun." : ""}
${summary.missingOfficialPositionRows > 0 ? "- Missing official fantasy positions block model rerun." : ""}
- Official-data readiness must still pass \`node scripts/validateOfficialDataReadiness.mjs\`.
- Official final squads, official fantasy prices, official fantasy positions, official rules, scoring, and deadlines remain required before any model rerun.

## Duplicate Internal Mapping Details

${internalDuplicateConflicts.length ? internalDuplicateConflicts.map((conflict) => `- ${conflict.internalId}: ${conflict.officialIds.join(", ")}`).join("\n") : "- None among accepted clean matches."}

## Recommended Next Codex Session

${summary.totalOfficialPlayers === 0
    ? "Import official fantasy players first by filling `data/imports/officialFantasyPlayers.csv` and running `node scripts/importOfficialFantasyPlayers.mjs`, then rerun `node scripts/matchOfficialFantasyPlayers.mjs`."
    : summary.reviewCases > 0
      ? "Resolve `data/review/playerIdentityReviewQueue_v1.csv`, then rerun this matcher before club-context and national-team usage enrichment."
      : "Identity matching is clean enough to proceed to the club-context and national-team usage enrichment stage. Do not rerun models until readiness passes."}
`;
}

function internalDataSummary(players) {
  const teamIds = [...new Set(players.map((player) => player.team_id).filter(Boolean))].sort();
  return {
    playerRows: players.length,
    uniquePlayerIds: new Set(players.map((player) => player.player_id)).size,
    teamIds,
    rowsWithClub: players.filter((player) => player.club).length,
    rowsWithLeague: players.filter((player) => player.league).length,
    rowsWithNationalUsage: players.filter((player) => player.usage_summary?.has_national_usage).length,
    rowsWithClubPerformance: players.filter((player) => player.performance_summary?.has_club_performance).length
  };
}

async function main() {
  await mkdir(path.dirname(PATHS.identityMap), { recursive: true });
  await mkdir(path.dirname(PATHS.reviewQueue), { recursive: true });

  const [
    officialInput,
    playersData,
    recommendationData,
    nationalData,
    performanceData,
    minutesData,
    aliases,
    manualOverrides
  ] = await Promise.all([
    readOfficialRows(),
    readJson(PATHS.players),
    readOptionalJson(PATHS.playerRecommendationInputs),
    readOptionalJson(PATHS.playerNationalTeamPerformance),
    readOptionalJson(PATHS.playerPerformance),
    readOptionalJson(PATHS.playerMinutesModel),
    readAliases(),
    readManualOverrides()
  ]);

  const rawPlayers = playersData.players || [];
  const players = enrichInternalPlayers(rawPlayers, {
    nationalRows: nationalData?.nationalTeamPerformance || [],
    performanceRows: performanceData?.playerPerformance || [],
    recommendationRows: recommendationData?.recommendationInputs || [],
    minutesRows: minutesData?.playerMinutesModel || []
  });
  const officialRows = officialInput.rows.map(normalizeOfficialRow);
  const { mapRows, reviewRows, summary, internalDuplicateConflicts } = buildOutputs({
    officialRows,
    players,
    aliases,
    manualOverrides,
    inputSource: officialInput.inputSource,
    inputStatus: officialInput.inputStatus
  });
  const inventory = internalDataSummary(players);

  await writeFile(PATHS.identityMap, toCsv(IDENTITY_HEADERS, mapRows), "utf8");
  await writeFile(PATHS.reviewQueue, toCsv(REVIEW_HEADERS, reviewRows), "utf8");
  await writeFile(PATHS.report, buildReport({ summary, internalDataSummary: inventory, internalDuplicateConflicts }), "utf8");

  console.log(`${PATHS.identityMap}: ${mapRows.length} rows`);
  console.log(`${PATHS.reviewQueue}: ${reviewRows.length} rows`);
  console.log(`${PATHS.report}: ${summary.totalOfficialPlayers} official players processed`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
