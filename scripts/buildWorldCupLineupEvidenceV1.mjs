import fs from "node:fs";
import { writeFile } from "node:fs/promises";

const GENERATED_AT = new Date().toISOString();

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    if (fallback !== null) return fallback;
    throw error;
  }
}

function readText(filePath, fallback = "") {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return fallback;
  }
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function writeText(filePath, text) {
  await writeFile(filePath, `${text.trimEnd()}\n`, "utf8");
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function slug(value) {
  return normalizeText(value).replace(/\s+/g, "-");
}

function rowsFromJson(data, keys) {
  if (Array.isArray(data)) return data;
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
}

function mdTable(headers, rows) {
  if (!rows.length) return "_None._";
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((value) => String(value ?? "")).join(" | ")} |`)
  ].join("\n");
}

const SOURCE_URLS = {
  argentina: "https://www.theguardian.com/football/live/2026/jul/07/argentina-v-egypt-world-cup-2026-last-16-live",
  belgium: "https://www.theguardian.com/football/live/2026/jul/06/usa-v-belgium-world-cup-2026-last-16-live",
  england: "https://www.theguardian.com/football/live/2026/jul/05/mexico-v-england-world-cup-2026-last-16-live",
  france: "https://www.theguardian.com/football/live/2026/jul/04/france-v-paraguay-world-cup-last-32-live",
  morocco: "https://www.theguardian.com/football/live/2026/jul/04/canada-v-morocco-world-cup-2026-last-16-live",
  norway: "https://www.theguardian.com/football/live/2026/jul/05/brazil-v-norway-world-cup-2026-last-16-live",
  spain: "https://www.theguardian.com/football/live/2026/jul/06/portugal-v-spain-world-cup-2026-last-16-live",
  switzerland: "https://www.theguardian.com/football/live/2026/jul/07/switzerland-v-colombia-world-cup-2026-last-16-live"
};

const R16_QF_TEAM_LINEUPS = [
  {
    fixture_id: "fwc2026-m089",
    match_number: 89,
    team: "France",
    team_id: "france",
    opponent: "Paraguay",
    opponent_team_id: "paraguay",
    source_url: SOURCE_URLS.france,
    source_checked: "2026-07-08",
    source_published_date: "2026-07-04",
    starters: ["Maignan", "Digne", "Saliba", "Upamecano", "Koundé", "Koné", "Rabiot", "Barcola", "Olise", "Dembélé", "Mbappé"],
    bench: ["Risser", "Samba", "Gusto", "L. Hernández", "T. Hernández", "Konaté", "Lacroix", "Kanté", "Tchouaméni", "Zaïre-Emery", "Akliouche", "Cherki", "Doué", "Mateta", "Thuram"],
    substitute_appearances: ["Doué"],
    source_note: "Guardian liveblog listed the France starting XI and substitutes for France v Paraguay."
  },
  {
    fixture_id: "fwc2026-m090",
    match_number: 90,
    team: "Morocco",
    team_id: "morocco",
    opponent: "Canada",
    opponent_team_id: "canada",
    source_url: SOURCE_URLS.morocco,
    source_checked: "2026-07-08",
    source_published_date: "2026-07-04",
    starters: ["Bounou", "Hakimi", "Diop", "Halhal", "Mazraoui", "Bouaddi", "El Aynaoui", "Diaz", "Ounahi", "El Khannous", "Saibari"],
    bench: ["Mohamedi", "Tagnaouti", "Amrabat", "Saadane", "Talbi", "Rahimi", "El Ouahdi", "El Mourabet", "Yassine", "Sbai", "Riad", "Belammari", "El Kaabi", "Amaimouni-Echghouyab", "Saleh-Eddine"],
    substitute_appearances: [],
    source_note: "Guardian liveblog listed the Morocco starting XI and substitutes for Canada v Morocco."
  },
  {
    fixture_id: "fwc2026-m091",
    match_number: 91,
    team: "Norway",
    team_id: "norway",
    opponent: "Brazil",
    opponent_team_id: "brazil",
    source_url: SOURCE_URLS.norway,
    source_checked: "2026-07-08",
    source_published_date: "2026-07-05",
    starters: ["Nyland", "Ryerson", "Ajer", "Heggem", "Wolfe", "Odegaard", "Berge", "Berg", "Sorloth", "Haaland", "Nusa"],
    bench: ["Tangvik", "Selvik", "Thorsby", "Ostigard", "Larsen", "Aursnes", "Bjorkan", "Thorstvedt", "Aasgaard", "Schjelderup", "Bobb", "Hauge", "Langas", "Falchener"],
    substitute_appearances: [],
    source_note: "Guardian liveblog listed the Norway starting XI and substitutes for Brazil v Norway."
  },
  {
    fixture_id: "fwc2026-m092",
    match_number: 92,
    team: "England",
    team_id: "england",
    opponent: "Mexico",
    opponent_team_id: "mexico",
    source_url: SOURCE_URLS.england,
    source_checked: "2026-07-08",
    source_published_date: "2026-07-05",
    starters: ["Pickford", "O'Reilly", "Guéhi", "Konsa", "Quansah", "Rice", "Anderson", "Gordon", "Bellingham", "Saka", "Kane"],
    bench: ["D. Henderson", "Trafford", "Stones", "Spence", "James", "Burn", "Chalobah", "Madueke", "Rashford", "Rogers", "J. Henderson", "Mainoo", "Eze", "Watkins", "Toney"],
    substitute_appearances: [],
    source_note: "Guardian liveblog listed the England starting XI and substitutes for Mexico v England."
  },
  {
    fixture_id: "fwc2026-m093",
    match_number: 93,
    team: "Spain",
    team_id: "spain",
    opponent: "Portugal",
    opponent_team_id: "portugal",
    source_url: SOURCE_URLS.spain,
    source_checked: "2026-07-08",
    source_published_date: "2026-07-06",
    starters: ["Simon", "Porro", "Cubarsi", "Laporte", "Cucurella", "Pedri", "Rodri", "Yamal", "Olmo", "Baena", "Oyarzabal"],
    bench: ["Raya", "Joan Garcia", "Pubill", "Grimaldo", "Eric Garcia", "Llorente", "Merino", "Torres", "Fabian", "Gavi", "Pino", "Williams", "Zubimendi", "Munoz", "Iglesias"],
    substitute_appearances: [],
    source_note: "Guardian liveblog listed the Spain starting XI and substitutes for Portugal v Spain."
  },
  {
    fixture_id: "fwc2026-m094",
    match_number: 94,
    team: "Belgium",
    team_id: "belgium",
    opponent: "USA",
    opponent_team_id: "usa",
    source_url: SOURCE_URLS.belgium,
    source_checked: "2026-07-08",
    source_published_date: "2026-07-06",
    starters: ["Courtois", "De Cuyper", "Ngoy", "Mechele", "Castagne", "Raskin", "Onana", "Trossard", "Tielemans", "Lukebakio", "De Ketelaere"],
    bench: ["De Bruyne", "Doku"],
    substitute_appearances: [],
    source_note: "Guardian liveblog listed Belgium's starting XI and explicitly referenced De Bruyne and Doku as bench options."
  },
  {
    fixture_id: "fwc2026-m095",
    match_number: 95,
    team: "Argentina",
    team_id: "argentina",
    opponent: "Egypt",
    opponent_team_id: "egypt",
    source_url: SOURCE_URLS.argentina,
    source_checked: "2026-07-08",
    source_published_date: "2026-07-07",
    starters: ["Emiliano Martinez", "Molina", "Romero", "Lisandro Martinez", "Tagliafico", "De Paul", "Paredes", "Mac Allister", "Fernandez", "Messi", "Alvarez"],
    bench: ["Musso", "Rulli", "Senesi", "Montiel", "Barco", "Lo Celso", "Palacios", "Gonzalez", "Almada", "Simeone", "Paz", "Otamendi", "Lopez", "Lautaro Martinez", "Medina"],
    substitute_appearances: ["Otamendi", "Medina"],
    source_note: "Guardian liveblog listed Argentina's starting XI and substitutes; it also reported Otamendi and Medina entering late."
  },
  {
    fixture_id: "fwc2026-m096",
    match_number: 96,
    team: "Switzerland",
    team_id: "switzerland",
    opponent: "Colombia",
    opponent_team_id: "colombia",
    source_url: SOURCE_URLS.switzerland,
    source_checked: "2026-07-08",
    source_published_date: "2026-07-07",
    starters: ["Kobel", "Zakaria", "Elvedi", "Akanji", "Rodriguez", "Freuler", "Xhaka", "Rieder", "Jashari", "Ndoye", "Embolo"],
    bench: ["Mvogo", "Keller", "Muheim", "Widmer", "Sow", "Fassnacht", "Vargas", "Comert", "Okafor", "Amdouni", "Amenda", "Itten"],
    substitute_appearances: ["Vargas"],
    source_note: "Guardian liveblog listed Switzerland's starting XI and substitutes."
  }
];

const PLAYER_ALIASES = {
  "argentina|alvarez": "39",
  "argentina|emiliano martinez": "45",
  "argentina|fernandez": "57",
  "argentina|lisandro martinez": "1318",
  "argentina|lautaro martinez": "1338",
  "argentina|mac allister": "56",
  "argentina|medina": "1320",
  "argentina|molina": "30",
  "argentina|otamendi": "31",
  "argentina|paredes": "48",
  "argentina|romero": "28",
  "argentina|tagliafico": "34",
  "belgium|castagne": "115",
  "belgium|courtois": "1522",
  "belgium|de bruyne": "138",
  "belgium|de cuyper": "114",
  "belgium|de ketelaere": "129",
  "belgium|doku": "125",
  "belgium|lukebakio": "127",
  "belgium|mechele": "121",
  "belgium|ngoy": "123",
  "belgium|onana": "136",
  "belgium|raskin": "135",
  "belgium|tielemans": "137",
  "belgium|trossard": "1526",
  "england|anderson": "486",
  "england|bellingham": "491",
  "england|gordon": "474",
  "england|guehi": "461",
  "england|guhi": "461",
  "england|kane": "468",
  "england|konsa": "463",
  "england|o reilly": "457",
  "england|pickford": "477",
  "england|quansah": "1708",
  "england|rice": "488",
  "england|saka": "469",
  "france|barcola": "1431",
  "france|dembele": "501",
  "france|digne": "498",
  "france|doue": "505",
  "france|kone": "512",
  "france|kounde": "1430",
  "france|maignan": "506",
  "france|mbappe": "500",
  "france|olise": "517",
  "france|rabiot": "510",
  "france|saliba": "1429",
  "france|upamecano": "494",
  "morocco|bouaddi": "1674",
  "morocco|bounou": "2010",
  "morocco|diaz": "2020",
  "morocco|diop": "2016",
  "morocco|el aynaoui": "2019",
  "morocco|el khannous": "2022",
  "morocco|el khannouss": "2022",
  "morocco|hakimi": "2012",
  "morocco|halhal": "2015",
  "morocco|mazraoui": "2014",
  "morocco|ounahi": "2021",
  "morocco|saibari": "792",
  "norway|ajer": "846",
  "norway|berg": "845",
  "norway|berge": "841",
  "norway|haaland": "855",
  "norway|heggem": "852",
  "norway|nusa": "863",
  "norway|nyland": "859",
  "norway|odegaard": "1684",
  "norway|ryerson": "847",
  "norway|sorloth": "856",
  "norway|wolfe": "850",
  "spain|baena": "1082",
  "spain|cubarsi": "1089",
  "spain|cucurella": "1088",
  "spain|laporte": "1086",
  "spain|olmo": "1105",
  "spain|oyarzabal": "1094",
  "spain|pedri": "1106",
  "spain|porro": "1085",
  "spain|rodri": "1104",
  "spain|simon": "1099",
  "spain|yamal": "1092",
  "switzerland|akanji": "1141",
  "switzerland|elvedi": "1143",
  "switzerland|embolo": "1149",
  "switzerland|freuler": "1138",
  "switzerland|jashari": "1139",
  "switzerland|kobel": "1153",
  "switzerland|ndoye": "1151",
  "switzerland|rieder": "1140",
  "switzerland|rodriguez": "1142",
  "switzerland|vargas": "1158",
  "switzerland|xhaka": "1135",
  "switzerland|zakaria": "1157"
};

function officialIndexes(officialRows) {
  const byId = new Map();
  const byTeam = new Map();
  for (const row of officialRows) {
    const id = String(row.official_fantasy_player_id || "");
    const teamId = slug(row.country || "");
    const item = { ...row, team_id_slug: teamId, normalized_name: normalizeText(row.name) };
    byId.set(id, item);
    const list = byTeam.get(teamId) || [];
    list.push(item);
    byTeam.set(teamId, list);
  }
  return { byId, byTeam };
}

function officialBySourceName(indexes, teamId, sourceName) {
  const normalized = normalizeText(sourceName);
  const aliasId = PLAYER_ALIASES[`${teamId}|${normalized}`];
  if (aliasId && indexes.byId.has(aliasId)) {
    return { official: indexes.byId.get(aliasId), confidence: "alias_official_fantasy_id" };
  }

  const teamRows = indexes.byTeam.get(teamId) || [];
  const exact = teamRows.filter((row) => row.normalized_name === normalized);
  if (exact.length === 1) return { official: exact[0], confidence: "exact_name" };

  const contains = teamRows.filter((row) => {
    const full = ` ${row.normalized_name} `;
    const short = ` ${normalized} `;
    return normalized.length >= 4 && (full.includes(short) || short.includes(full));
  });
  if (contains.length === 1) return { official: contains[0], confidence: "unique_name_contains" };

  const lastToken = normalized.split(" ").filter(Boolean).at(-1);
  const lastMatches = lastToken && lastToken.length >= 4
    ? teamRows.filter((row) => row.normalized_name.split(" ").includes(lastToken))
    : [];
  if (lastMatches.length === 1) return { official: lastMatches[0], confidence: "unique_last_token" };

  return {
    official: null,
    confidence: contains.length || lastMatches.length ? "ambiguous_unmatched" : "unmatched"
  };
}

function fixtureForTeamRound(liveFixtures, teamId, roundId) {
  return liveFixtures.find((fixture) => {
    if (String(fixture.round_id) !== String(roundId)) return false;
    const home = slug(fixture.live_home_team || fixture.local_home_team || fixture.home_team);
    const away = slug(fixture.live_away_team || fixture.local_away_team || fixture.away_team);
    return home === teamId || away === teamId;
  }) || null;
}

function opponentFromFixture(fixture, teamId) {
  if (!fixture) return { opponent: null, opponent_team_id: null };
  const home = slug(fixture.live_home_team || fixture.local_home_team || fixture.home_team);
  const away = slug(fixture.live_away_team || fixture.local_away_team || fixture.away_team);
  if (home === teamId) {
    return {
      opponent: fixture.live_away_team || fixture.local_away_team || fixture.away_team || null,
      opponent_team_id: away || null
    };
  }
  if (away === teamId) {
    return {
      opponent: fixture.live_home_team || fixture.local_home_team || fixture.home_team || null,
      opponent_team_id: home || null
    };
  }
  return { opponent: null, opponent_team_id: null };
}

function statusToBooleans(status) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "start") {
    return { started: true, substitute_appearance: false, unused_substitute: false };
  }
  if (normalized === "sub") {
    return { started: false, substitute_appearance: "unknown", unused_substitute: "unknown" };
  }
  if (normalized === "not_in_squad") {
    return { started: false, substitute_appearance: false, unused_substitute: false };
  }
  return { started: "unknown", substitute_appearance: "unknown", unused_substitute: "unknown" };
}

function officialSnapshotRows({ rows, sourceFile, sourceName, round, roundId, matchStatusAccessor, officialById, liveFixtures }) {
  const evidence = [];
  for (const sourceRow of rows) {
    const status = matchStatusAccessor(sourceRow);
    if (!["start", "sub", "not_in_squad"].includes(String(status || "").toLowerCase())) continue;
    const officialId = String(sourceRow.official_fantasy_player_id || "");
    const official = officialById.get(officialId) || sourceRow;
    const teamId = slug(sourceRow.team_id || sourceRow.country || official.country || "");
    const fixture = fixtureForTeamRound(liveFixtures, teamId, roundId);
    const opponent = opponentFromFixture(fixture, teamId);
    const flags = statusToBooleans(status);
    evidence.push({
      evidence_id: `${sourceName}-${round}-${officialId}`,
      fixture_id: fixture?.local_fixture_id || (fixture?.match_number ? `fwc2026-m${String(fixture.match_number).padStart(3, "0")}` : null),
      source_fixture_id: fixture?.source_fixture_id || null,
      round,
      round_id: roundId,
      match_number: fixture?.match_number || null,
      team: sourceRow.country || official.country || null,
      team_id: teamId,
      opponent: opponent.opponent,
      opponent_team_id: opponent.opponent_team_id,
      player_id: official.current_player_match?.player_id || sourceRow.internal_player_id || `${teamId}-${slug(sourceRow.name || official.name)}`,
      player_name: sourceRow.name || official.name || "",
      fantasy_id: officialId || null,
      official_fantasy_player_id: officialId || null,
      source_player_id: officialId || null,
      source_player_name: sourceRow.name || official.name || "",
      started: flags.started,
      substitute_appearance: flags.substitute_appearance,
      unused_substitute: flags.unused_substitute,
      minutes_played: null,
      position: sourceRow.official_fantasy_position || official.official_fantasy_position || null,
      source: sourceName,
      source_file: sourceFile,
      source_url: null,
      source_checked: null,
      source_confidence: "preserved_official_fantasy_matchStatus",
      source_claims_full_lineup: false,
      lineupEvidenceType: `official_match_status_${status}`,
      matched_to_official_fantasy_player: Boolean(officialId && officialById.has(officialId)),
      match_confidence: officialById.has(officialId) ? "official_fantasy_id" : "unmatched_official_id",
      notes: [
        "Preserved official fantasy matchStatus snapshot.",
        "Substitute appearance and unused-substitute status are unknown unless explicitly sourced elsewhere."
      ]
    });
  }
  return evidence;
}

function r16ExternalRows(indexes) {
  const out = [];
  for (const source of R16_QF_TEAM_LINEUPS) {
    const substituteAppearances = new Set(source.substitute_appearances.map((name) => normalizeText(name)));
    const seen = new Set();
    for (const [kind, names] of [["starter", source.starters], ["bench", source.bench]]) {
      for (const sourceName of names) {
        const sourceKey = normalizeText(sourceName);
        if (seen.has(sourceKey)) continue;
        seen.add(sourceKey);
        const { official, confidence } = officialBySourceName(indexes, source.team_id, sourceName);
        const started = kind === "starter";
        const substituteAppearance = started ? false : substituteAppearances.has(sourceKey) ? true : "unknown";
        out.push({
          evidence_id: `guardian-r16-${source.match_number}-${source.team_id}-${sourceKey.replace(/\s+/g, "-")}`,
          fixture_id: source.fixture_id,
          source_fixture_id: String(source.match_number),
          round: "R16",
          round_id: 5,
          match_number: source.match_number,
          team: source.team,
          team_id: source.team_id,
          opponent: source.opponent,
          opponent_team_id: source.opponent_team_id,
          player_id: official?.current_player_match?.player_id || `${source.team_id}-${slug(official?.name || sourceName)}`,
          player_name: official?.name || sourceName,
          fantasy_id: official?.official_fantasy_player_id ? String(official.official_fantasy_player_id) : null,
          official_fantasy_player_id: official?.official_fantasy_player_id ? String(official.official_fantasy_player_id) : null,
          source_player_id: sourceName,
          source_player_name: sourceName,
          started,
          substitute_appearance: substituteAppearance,
          unused_substitute: started || substituteAppearance === true ? false : "unknown",
          minutes_played: null,
          position: official?.official_fantasy_position || null,
          source: "guardian_liveblog",
          source_file: null,
          source_url: source.source_url,
          source_checked: source.source_checked,
          source_published_date: source.source_published_date,
          source_confidence: started ? "explicit_starting_xi_guardian_liveblog" : "explicit_bench_list_guardian_liveblog",
          source_claims_full_lineup: started,
          lineupEvidenceType: started ? "external_explicit_starting_xi" : "external_explicit_bench_list",
          matched_to_official_fantasy_player: Boolean(official),
          match_confidence: confidence,
          notes: [
            source.source_note,
            substituteAppearance === true ? "Source/liveblog event text indicates a substitute appearance; no scoring override is applied." : "",
            !started ? "Bench row does not imply an unused substitute unless explicitly sourced." : ""
          ].filter(Boolean)
        });
      }
    }
  }
  return out;
}

function buildQa(evidenceRows) {
  const errors = [];
  const warnings = [];
  const starters = evidenceRows.filter((row) => row.started === true);
  const byFixtureTeam = new Map();
  for (const row of starters) {
    const key = `${row.round}|${row.fixture_id}|${row.team_id}`;
    const list = byFixtureTeam.get(key) || [];
    list.push(row);
    byFixtureTeam.set(key, list);
  }

  for (const [key, rows] of byFixtureTeam.entries()) {
    if (rows.length > 11) errors.push(`${key} has ${rows.length} starters.`);
    if (rows.some((row) => row.source_claims_full_lineup) && rows.length !== 11) {
      errors.push(`${key} is marked as a full lineup source but has ${rows.length} starters.`);
    }
  }

  const unmatchedExplicitStarters = starters.filter((row) =>
    row.source_claims_full_lineup && !row.matched_to_official_fantasy_player
  );
  if (unmatchedExplicitStarters.length) {
    errors.push(`${unmatchedExplicitStarters.length} explicit R16 starter row(s) could not be matched to official fantasy players.`);
  }

  const playerTeams = new Map();
  for (const row of evidenceRows.filter((entry) => entry.fantasy_id)) {
    const teams = playerTeams.get(row.fantasy_id) || new Set();
    teams.add(row.team_id);
    playerTeams.set(row.fantasy_id, teams);
  }
  const multiTeam = [...playerTeams.entries()].filter(([, teams]) => teams.size > 1);
  if (multiTeam.length) errors.push(`${multiTeam.length} fantasy player id(s) appear on multiple teams in lineup evidence.`);

  const impossibleStarterRows = starters.filter((row) => !String(row.source_confidence || "").includes("starting_xi") && !String(row.source_confidence || "").includes("matchStatus"));
  if (impossibleStarterRows.length) {
    errors.push(`${impossibleStarterRows.length} starter row(s) lack explicit starter/matchStatus source confidence.`);
  }

  const unmatchedBench = evidenceRows.filter((row) =>
    row.round === "R16" &&
    row.started === false &&
    row.source === "guardian_liveblog" &&
    !row.matched_to_official_fantasy_player
  );
  if (unmatchedBench.length) {
    warnings.push(`${unmatchedBench.length} R16 bench row(s) were not matched to official fantasy players; they are retained as source-only evidence.`);
  }

  const qfTeams = new Set(R16_QF_TEAM_LINEUPS.map((row) => row.team_id));
  const missingR16QfTeams = [...qfTeams].filter((teamId) =>
    !evidenceRows.some((row) => row.round === "R16" && row.team_id === teamId && row.started === true)
  );
  if (missingR16QfTeams.length) errors.push(`Missing explicit R16 starter rows for QF team(s): ${missingR16QfTeams.join(", ")}.`);

  const r16QfStarterTeams = [...qfTeams].map((teamId) => {
    const count = evidenceRows.filter((row) => row.round === "R16" && row.team_id === teamId && row.started === true).length;
    return { team_id: teamId, starter_count: count };
  });

  return {
    schema_version: "world_cup_lineup_evidence_qa_v1",
    generated_at: GENERATED_AT,
    status: errors.length ? "fail" : "pass",
    summary: {
      evidence_rows: evidenceRows.length,
      explicit_starter_rows: starters.length,
      r16_qf_team_explicit_starter_rows: r16QfStarterTeams.reduce((sum, row) => sum + row.starter_count, 0),
      r16_qf_teams_with_11_starters: r16QfStarterTeams.filter((row) => row.starter_count === 11).length,
      unmatched_explicit_starters: unmatchedExplicitStarters.length,
      unmatched_r16_bench_rows: unmatchedBench.length,
      impossible_starter_team_rows: [...byFixtureTeam.values()].filter((rows) => rows.length > 11).length,
      fantasy_points_used_as_start_evidence: false
    },
    r16_qf_starter_counts: r16QfStarterTeams,
    errors,
    warnings
  };
}

function buildLegacyAuditSnapshot() {
  const role = readJson("data/playerRoleModel_qf_v1.json", { playerRoleRows: [], summary: {} });
  const recommendations = readJson("data/fantasyPoolRecommendations_qf_v1.json", { recommendationCandidates: [] });
  const projections = readJson("data/fantasyPoolMatchdayProjections_qf_v1.json", { playerMatchdayProjections: [] });
  const qfSource = readText("scripts/lib/qfFinalArtifacts.mjs");
  const roleRows = rowsFromJson(role, ["playerRoleRows"]);
  const recRows = rowsFromJson(recommendations, ["recommendationCandidates"]);
  const projectionRows = rowsFromJson(projections, ["playerMatchdayProjections"]);
  const pointsOnlyFlags = new Set([
    "r16_participation_points_weighted",
    "r16_participation_evidence_weighted",
    "points_only_appearance_not_start"
  ]);
  const hasPointsOnlyFlag = (row) => {
    const flags = [...(row.data_quality_flags || []), ...(row.dataQualityFlags || [])];
    return flags.some((flag) => pointsOnlyFlags.has(flag)) ||
      String(row.evidenceStrength || "").includes("participation_points") ||
      row.lineupEvidenceType === "points_only_appearance";
  };
  const coreRows = recRows.filter((row) => row.mode === "balanced" || row.pickType === "Core Picks");
  const medinaRows = recRows.filter((row) =>
    normalizeText(`${row.name} ${row.display_name}` || "").includes("facundo medina")
  );

  return {
    captured_at: GENERATED_AT,
    role_rows: roleRows.length,
    projection_rows: projectionRows.length,
    recommendation_rows: recRows.length,
    role_points_only_or_participation_rows: roleRows.filter(hasPointsOnlyFlag).length,
    projections_points_only_or_participation_rows: projectionRows.filter(hasPointsOnlyFlag).length,
    core_pick_points_only_or_participation_rows: coreRows.filter(hasPointsOnlyFlag).length,
    core_pick_rows: coreRows.length,
    facundo_medina_recommendation_rows: medinaRows.map((row) => ({
      mode: row.mode,
      pickType: row.pickType,
      rank: row.rank,
      start_probability: row.start_probability,
      evidenceStrength: row.evidenceStrength,
      lineupEvidenceType: row.lineupEvidenceType,
      data_quality_flags: row.data_quality_flags || row.dataQualityFlags || []
    })),
    unsafe_code_signals: {
      has_r16_participated_boolean: qfSource.includes("r16Participated"),
      has_round_points_start_lift: qfSource.includes("r16Participated && r32Participated && strongPrior"),
      has_participation_points_weighted_flag: qfSource.includes("r16_participation_points_weighted")
    }
  };
}

function buildAudit(qa) {
  const previousAudit = readJson("data/lineupEvidenceAudit_qf_v1.json", {});
  const preRepairSnapshot = previousAudit.pre_repair_snapshot || buildLegacyAuditSnapshot();
  const currentSnapshot = buildLegacyAuditSnapshot();
  const currentCoreRowsUnsafe = currentSnapshot.core_pick_points_only_or_participation_rows;
  return {
    schema_version: "lineup_evidence_audit_qf_v1",
    generated_at: GENERATED_AT,
    status: qa.status === "pass" && currentCoreRowsUnsafe === 0 ? "pass" : "fail",
    audit_scope: [
      "QF role model",
      "QF projections",
      "QF recommendations",
      "QF Team Builder QA",
      "starting XI lineage evidence"
    ],
    findings: [
      {
        id: "legacy_points_only_start_inference",
        severity: preRepairSnapshot.role_points_only_or_participation_rows > 0 ? "high" : "none",
        summary: "Legacy QF role logic used R16 fantasy round points as participation evidence and lifted start probability from that signal.",
        affected_outputs_before_repair: {
          role_rows: preRepairSnapshot.role_points_only_or_participation_rows,
          projections: preRepairSnapshot.projections_points_only_or_participation_rows,
          core_picks: preRepairSnapshot.core_pick_points_only_or_participation_rows
        }
      },
      {
        id: "facundo_medina_core_pick",
        severity: preRepairSnapshot.facundo_medina_recommendation_rows.length ? "high" : "none",
        summary: "Facundo Medina appeared in the legacy QF recommendation surface despite being source-backed as an R16 non-starter.",
        affected_rows_before_repair: preRepairSnapshot.facundo_medina_recommendation_rows
      },
      {
        id: "current_core_pick_gate",
        severity: currentCoreRowsUnsafe > 0 ? "high" : "none",
        summary: "Current Core Picks must have explicit R16 starter evidence and must not rely on points-only appearance evidence.",
        affected_rows_current: currentCoreRowsUnsafe
      }
    ],
    pre_repair_snapshot: preRepairSnapshot,
    current_snapshot: currentSnapshot,
    lineup_evidence_qa_status: qa.status,
    controls_added: [
      "Normalized worldCupLineupEvidence_v1 lineage file.",
      "QF model consumes explicit R16 starter/non-starter rows separately from fantasy points.",
      "Core Pick eligibility requires source-backed R16 starter evidence.",
      "Points-only R16 appearances are capped and flagged as non-starter evidence."
    ]
  };
}

function buildReport({ evidence, qa, audit }) {
  const sourceCounts = Object.entries(evidence.reduce((counts, row) => {
    const key = `${row.round} ${row.source || row.source_file}`;
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {})).sort((a, b) => a[0].localeCompare(b[0]));
  const r16Counts = qa.r16_qf_starter_counts.map((row) => [row.team_id, row.starter_count]);

  return {
    evidenceReport: [
      "# World Cup Lineup Evidence v1",
      "",
      `Generated: ${GENERATED_AT}`,
      "",
      "This artifact normalizes preserved official fantasy matchStatus snapshots and source-backed R16 starting XI rows. Fantasy points are not used to set `started: true`.",
      "",
      "## Source Counts",
      "",
      mdTable(["Source", "Rows"], sourceCounts),
      "",
      "## R16 QF Team Starter Counts",
      "",
      mdTable(["Team", "Explicit starters"], r16Counts)
    ].join("\n"),
    qaReport: [
      "# World Cup Lineup Evidence QA v1",
      "",
      `Generated: ${GENERATED_AT}`,
      "",
      `Status: ${qa.status}`,
      "",
      mdTable(["Metric", "Value"], Object.entries(qa.summary)),
      "",
      "## Errors",
      "",
      qa.errors.length ? qa.errors.map((error) => `- ${error}`).join("\n") : "_None._",
      "",
      "## Warnings",
      "",
      qa.warnings.length ? qa.warnings.map((warning) => `- ${warning}`).join("\n") : "_None._"
    ].join("\n"),
    auditReport: [
      "# QF Lineup Evidence Audit v1",
      "",
      `Generated: ${GENERATED_AT}`,
      "",
      `Status: ${audit.status}`,
      "",
      "## Findings",
      "",
      mdTable(["Finding", "Severity", "Summary"], audit.findings.map((finding) => [finding.id, finding.severity, finding.summary])),
      "",
      "## Before Repair Snapshot",
      "",
      mdTable(["Metric", "Value"], Object.entries(audit.pre_repair_snapshot).filter(([, value]) => typeof value !== "object")),
      "",
      "## Current Snapshot",
      "",
      mdTable(["Metric", "Value"], Object.entries(audit.current_snapshot).filter(([, value]) => typeof value !== "object"))
    ].join("\n")
  };
}

async function main() {
  const officialRows = rowsFromJson(readJson("data/officialFantasyPlayers_v0.json"), ["officialFantasyPlayers", "players"]);
  const indexes = officialIndexes(officialRows);
  const liveFixtures = rowsFromJson(readJson("data/liveMatchdayStatus_v1.json"), ["fixtures"]);
  const md1Rows = rowsFromJson(readJson("data/md2LineupEvidenceRefresh_v1.json", {}), ["adjustments"]);
  const md2Rows = rowsFromJson(readJson("data/playerRoleModel_md3_v3.json", {}), ["playerRoleRows"]);
  const md3Rows = rowsFromJson(readJson("data/playerRoleModel_r32_provisional_v1.json", {}), ["playerRoleRows"]);
  const r32Rows = rowsFromJson(readJson("data/playerRoleModel_r16_provisional_v1.json", {}), ["playerRoleRows"]);

  const evidenceRows = [
    ...officialSnapshotRows({
      rows: md1Rows,
      sourceFile: "data/md2LineupEvidenceRefresh_v1.json",
      sourceName: "md1_preserved_official_fantasy_matchStatus",
      round: "MD1",
      roundId: 1,
      matchStatusAccessor: (row) => row.md1_match_status,
      officialById: indexes.byId,
      liveFixtures
    }),
    ...officialSnapshotRows({
      rows: md2Rows,
      sourceFile: "data/playerRoleModel_md3_v3.json",
      sourceName: "md2_preserved_official_fantasy_matchStatus",
      round: "MD2",
      roundId: 2,
      matchStatusAccessor: (row) => row.md2_live_status_fields?.matchStatus,
      officialById: indexes.byId,
      liveFixtures
    }),
    ...officialSnapshotRows({
      rows: md3Rows,
      sourceFile: "data/playerRoleModel_r32_provisional_v1.json",
      sourceName: "md3_preserved_official_fantasy_matchStatus",
      round: "MD3",
      roundId: 3,
      matchStatusAccessor: (row) => row.matchStatus,
      officialById: indexes.byId,
      liveFixtures
    }),
    ...officialSnapshotRows({
      rows: r32Rows,
      sourceFile: "data/playerRoleModel_r16_provisional_v1.json",
      sourceName: "r32_preserved_official_fantasy_matchStatus",
      round: "R32",
      roundId: 4,
      matchStatusAccessor: (row) => row.matchStatus,
      officialById: indexes.byId,
      liveFixtures
    }),
    ...r16ExternalRows(indexes)
  ];

  const qa = buildQa(evidenceRows);
  const audit = buildAudit(qa);
  const artifact = {
    schema_version: "world_cup_lineup_evidence_v1",
    generated_at: GENERATED_AT,
    status: qa.status,
    source_policy: {
      fantasy_points_can_set_started_true: false,
      ownership_used_as_signal: false,
      official_fantasy_snapshots_preserved_where_available: true,
      r16_qf_team_lineups_external_source: "guardian_liveblog"
    },
    summary: {
      evidence_rows: evidenceRows.length,
      explicit_starter_rows: evidenceRows.filter((row) => row.started === true).length,
      explicit_non_starter_rows: evidenceRows.filter((row) => row.started === false).length,
      r16_qf_team_explicit_starter_rows: qa.summary.r16_qf_team_explicit_starter_rows,
      r16_qf_teams_with_11_starters: qa.summary.r16_qf_teams_with_11_starters,
      source_files: [
        "data/md2LineupEvidenceRefresh_v1.json",
        "data/playerRoleModel_md3_v3.json",
        "data/playerRoleModel_r32_provisional_v1.json",
        "data/playerRoleModel_r16_provisional_v1.json"
      ],
      external_sources: Object.values(SOURCE_URLS)
    },
    lineupEvidenceRows: evidenceRows
  };
  const reports = buildReport({ evidence: evidenceRows, qa, audit });

  await writeJson("data/worldCupLineupEvidence_v1.json", artifact);
  await writeJson("data/worldCupLineupEvidenceQa_v1.json", qa);
  await writeJson("data/lineupEvidenceAudit_qf_v1.json", audit);
  await writeText("data/worldCupLineupEvidenceReport_v1.md", reports.evidenceReport);
  await writeText("data/worldCupLineupEvidenceQaReport_v1.md", reports.qaReport);
  await writeText("data/lineupEvidenceAudit_qf_v1.md", reports.auditReport);

  console.log(JSON.stringify({
    status: qa.status,
    evidence_rows: evidenceRows.length,
    r16_qf_team_explicit_starter_rows: qa.summary.r16_qf_team_explicit_starter_rows,
    r16_qf_teams_with_11_starters: qa.summary.r16_qf_teams_with_11_starters,
    audit_status: audit.status,
    errors: qa.errors,
    warnings: qa.warnings
  }, null, 2));

  if (qa.status !== "pass") process.exitCode = 1;
}

await main();
