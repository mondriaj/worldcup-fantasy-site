import { writeFile } from "node:fs/promises";

const GENERATED_AT = new Date().toISOString();
const SOURCE_CHECKED = GENERATED_AT.slice(0, 10);
const PLAYERS_URL = "https://play.fifa.com/json/fantasy/players.json";
const SQUADS_URL = "https://play.fifa.com/json/fantasy/squads.json";
const OUTPUT_JSON = "data/imports/officialFantasyPlayers_live_v1.json";
const OUTPUT_REPORT = "data/officialFantasyPlayersCollectionReport_v1.md";

function hasValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function normalizePosition(value) {
  const position = String(value || "").trim().toUpperCase();
  if (["GKP", "GK", "GOALKEEPER", "GOALKEEPERS"].includes(position)) return "GK";
  if (["DEF", "DEFENDER", "DEFENDERS"].includes(position)) return "DEF";
  if (["MID", "MIDFIELDER", "MIDFIELDERS"].includes(position)) return "MID";
  if (["FWD", "FOR", "FORWARD", "FORWARDS", "STRIKER", "STRIKERS"].includes(position)) return "FWD";
  return position || null;
}

async function fetchJson(url) {
  const response = await fetch(url);
  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (error) {
    throw new Error(`${url} returned non-JSON content: ${error.message}`);
  }
  if (!response.ok) {
    throw new Error(`${url} returned HTTP ${response.status}`);
  }
  return {
    url,
    status: response.status,
    last_modified: response.headers.get("last-modified"),
    etag: response.headers.get("etag"),
    bytes: text.length,
    json
  };
}

function rowsFromJson(data, keys) {
  if (Array.isArray(data)) return data;
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
}

function fullName(row) {
  return [row.firstName, row.lastName].filter(hasValue).join(" ").trim() || row.knownName || "";
}

const [playersSource, squadsSource] = await Promise.all([
  fetchJson(PLAYERS_URL),
  fetchJson(SQUADS_URL)
]);

const squadRows = rowsFromJson(squadsSource.json, ["squads", "teams", "data"]);
const squadById = new Map(squadRows.map((squad) => [String(squad.id), squad]));
const sourceNotes = [
  `players.json Last-Modified: ${playersSource.last_modified || "missing"}`,
  `squads.json Last-Modified: ${squadsSource.last_modified || "missing"}`
].join("; ");

const players = rowsFromJson(playersSource.json, ["players", "data"]).map((row) => {
  const squadId = hasValue(row.squadId) ? String(row.squadId) : "";
  const squad = squadById.get(squadId);
  const name = fullName(row);
  const price = Number(row.price);
  const percentSelected = Number(row.percentSelected);

  return {
    official_fantasy_player_id: String(row.id),
    name,
    country: squad?.name || null,
    team_id: squadId || null,
    official_fantasy_position: normalizePosition(row.position),
    official_price: Number.isFinite(price) ? price : null,
    selectable_status: row.status || null,
    source_url: PLAYERS_URL,
    source_checked: SOURCE_CHECKED,
    display_name: row.knownName || name,
    first_name: row.firstName || null,
    last_name: row.lastName || null,
    shirt_name: row.shirtName || null,
    shirt_number: row.shirtNumber || null,
    club: row.clubName || null,
    date_of_birth: row.dateOfBirth || null,
    fifa_player_profile_url: hasValue(row.fifaId) ? `https://www.fifa.com/en/player/${row.fifaId}` : null,
    fantasy_player_url: null,
    position_raw: row.position || null,
    price_raw: row.price ?? null,
    country_raw: squad?.name || null,
    team_name_raw: squad?.name || null,
    is_selectable: row.status === "playing",
    source_notes: sourceNotes,
    fifa_player_id: hasValue(row.fifaId) ? String(row.fifaId) : null,
    availability_status: row.status || null,
    injury_status: null,
    ownership_percent: Number.isFinite(percentSelected) ? percentSelected : null,
    selected_by_percent: Number.isFinite(percentSelected) ? percentSelected : null
  };
});

const output = {
  schema_version: "official_fantasy_players_live_import_v1",
  generated_at: GENERATED_AT,
  source_checked: SOURCE_CHECKED,
  sources: [
    {
      source_id: "fifaFantasyPlayersJson",
      url: PLAYERS_URL,
      status: playersSource.status,
      last_modified: playersSource.last_modified,
      etag: playersSource.etag,
      bytes: playersSource.bytes
    },
    {
      source_id: "fifaFantasySquadsJson",
      url: SQUADS_URL,
      status: squadsSource.status,
      last_modified: squadsSource.last_modified,
      etag: squadsSource.etag,
      bytes: squadsSource.bytes
    }
  ],
  players
};

const statusCounts = players.reduce((counts, player) => {
  const key = player.selectable_status || "missing";
  counts[key] = (counts[key] || 0) + 1;
  return counts;
}, {});

const positionCounts = players.reduce((counts, player) => {
  const key = player.official_fantasy_position || "missing";
  counts[key] = (counts[key] || 0) + 1;
  return counts;
}, {});

const report = [
  "# Official Fantasy Players Live Collection v1",
  "",
  `Generated: ${GENERATED_AT}`,
  "",
  "## Sources",
  "",
  `- Players: ${PLAYERS_URL} (${playersSource.status}, Last-Modified ${playersSource.last_modified || "missing"})`,
  `- Squads: ${SQUADS_URL} (${squadsSource.status}, Last-Modified ${squadsSource.last_modified || "missing"})`,
  "",
  "## Output",
  "",
  `- Import file: ${OUTPUT_JSON}`,
  `- Player rows: ${players.length}`,
  `- Selectable-status counts: ${JSON.stringify(statusCounts)}`,
  `- Position counts: ${JSON.stringify(positionCounts)}`,
  "",
  "## Safeguards",
  "",
  "- This script snapshots the official FIFA fantasy feed into the existing local import schema.",
  "- It does not claim final-squad confirmation; selectable status remains the official fantasy status only.",
  "- Runtime site code is not changed and no browser fetch is introduced.",
  ""
].join("\n");

await writeFile(OUTPUT_JSON, `${JSON.stringify(output, null, 2)}\n`, "utf8");
await writeFile(OUTPUT_REPORT, report, "utf8");

console.log(`${OUTPUT_JSON}: ${players.length} rows`);
console.log(`${OUTPUT_REPORT}: wrote collection report`);
