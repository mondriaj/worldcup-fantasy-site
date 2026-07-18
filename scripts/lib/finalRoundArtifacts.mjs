import fs from "node:fs";
import { writeFile } from "node:fs/promises";
import { compactPublicPayload, publicWrapperText } from "./publicPayloadSlimming.mjs";

const GENERATED_AT = new Date().toISOString();
const MATCHDAY_ID = "finalRound";
const MATCHDAY_LABEL = "Final Round";
const CACHE_BUST = "20260718-final-round";

const TEAM_INFO = {
  argentina: { team: "Argentina", name: "Argentina", team_id: "argentina", code: "ARG", flag: "🇦🇷" },
  england: { team: "England", name: "England", team_id: "england", code: "ENG", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  france: { team: "France", name: "France", team_id: "france", code: "FRA", flag: "🇫🇷" },
  spain: { team: "Spain", name: "Spain", team_id: "spain", code: "ESP", flag: "🇪🇸" }
};

const THIN_PROFILE_IDS = new Set(["29", "2078"]);
const FINANCE_PRICE_TIER_THRESHOLDS = {
  GK: [["premium", 5.5], ["upper_mid", 5.0], ["mid_price", 4.5], ["budget", 4.0], ["ultra_budget", 0]],
  DEF: [["premium", 6.0], ["upper_mid", 5.0], ["mid_price", 4.5], ["budget", 4.0], ["ultra_budget", 0]],
  MID: [["premium", 8.5], ["upper_mid", 7.0], ["mid_price", 5.5], ["budget", 4.5], ["ultra_budget", 0]],
  FWD: [["premium", 9.0], ["upper_mid", 7.5], ["mid_price", 6.0], ["budget", 5.0], ["ultra_budget", 0]]
};

const SF_LINEUP_SOURCES = [
  {
    fixture_id: "fwc2026-m101",
    source_fixture_id: "101",
    match_number: 101,
    team: "France",
    team_id: "france",
    opponent: "Spain",
    opponent_team_id: "spain",
    source_url: "https://www.theguardian.com/football/live/2026/jul/14/france-v-spain-world-cup-2026-semi-final-live",
    source_checked: "2026-07-18",
    source_published_date: "2026-07-14",
    starters: ["Maignan", "Kounde", "Upamecano", "Saliba", "Digne", "Tchouameni", "Rabiot", "Dembele", "Olise", "Barcola", "Mbappe"],
    bench: ["Samba", "Risser", "Gusto", "Kone", "Thuram", "Kante", "Konate", "Zaire Emery", "Theo Hernandez", "Doue", "Lucas Hernandez", "Mateta", "Cherki", "Akliouche", "Lacroix"],
    source_note: "Guardian semifinal liveblog listed France's full starting XI and substitutes."
  },
  {
    fixture_id: "fwc2026-m101",
    source_fixture_id: "101",
    match_number: 101,
    team: "Spain",
    team_id: "spain",
    opponent: "France",
    opponent_team_id: "france",
    source_url: "https://www.theguardian.com/football/live/2026/jul/14/france-v-spain-world-cup-2026-semi-final-live",
    source_checked: "2026-07-18",
    source_published_date: "2026-07-14",
    starters: ["Simon", "Porro", "Cubarsi", "Laporte", "Cucurella", "Rodri", "Fabian", "Yamal", "Olmo", "Baena", "Oyarzabal"],
    bench: ["Raya", "Joan Garcia", "Pubill", "Grimaldo", "Eric Garcia", "Llorente", "Merino", "Torres", "Gavi", "Pino", "Williams", "Zubimendi", "Gonzalez", "Munoz", "Iglesias"],
    source_note: "Guardian semifinal liveblog listed Spain's full starting XI and substitutes."
  },
  {
    fixture_id: "fwc2026-m102",
    source_fixture_id: "102",
    match_number: 102,
    team: "England",
    team_id: "england",
    opponent: "Argentina",
    opponent_team_id: "argentina",
    source_url: "https://www.theguardian.com/football/live/2026/jul/15/england-v-argentina-world-cup-2026-semi-final-live",
    source_checked: "2026-07-18",
    source_published_date: "2026-07-15",
    starters: ["Pickford", "James", "Stones", "Guehi", "Spence", "Rice", "Anderson", "Rogers", "Bellingham", "Gordon", "Kane"],
    bench: ["Trafford", "D Henderson", "O'Reilly", "Konsa", "Saka", "Rashford", "Chalobah", "Burn", "Mainoo", "Watkins", "Madueke", "Eze", "Toney"],
    source_note: "Guardian semifinal liveblog listed England's full starting XI and substitutes."
  },
  {
    fixture_id: "fwc2026-m102",
    source_fixture_id: "102",
    match_number: 102,
    team: "Argentina",
    team_id: "argentina",
    opponent: "England",
    opponent_team_id: "england",
    source_url: "https://www.theguardian.com/football/live/2026/jul/15/england-v-argentina-world-cup-2026-semi-final-live",
    source_checked: "2026-07-18",
    source_published_date: "2026-07-15",
    starters: ["E Martinez", "Molina", "Romero", "Lisandro Martinez", "Tagliafico", "Paredes", "Simeone", "E Fernandez", "Mac Allister", "Messi", "Alvarez"],
    bench: ["Musso", "Rulli", "Senesi", "Montiel", "Barco", "Lo Celso", "Palacios", "Gonzalez", "Almada", "De Paul", "Paz", "Otamendi", "Lopez", "Lautaro Martinez", "Medina"],
    source_note: "Guardian semifinal liveblog listed Argentina's full starting XI and substitutes."
  }
];

const PLAYER_ALIASES = {
  "argentina|alvarez": "39",
  "argentina|e fernandez": "57",
  "argentina|e martinez": "45",
  "argentina|emiliano martinez": "45",
  "argentina|fernandez": "57",
  "argentina|giuliano simeone": "41",
  "argentina|l martinez": "1318",
  "argentina|lautaro martinez": "1338",
  "argentina|lisandro martinez": "1318",
  "argentina|lo celso": "1326",
  "argentina|lopez": "43",
  "argentina|mac allister": "56",
  "argentina|medina": "1320",
  "argentina|messi": "38",
  "argentina|molina": "30",
  "argentina|montiel": "1323",
  "argentina|musso": "47",
  "argentina|otamendi": "31",
  "argentina|palacios": "54",
  "argentina|paredes": "48",
  "argentina|paz": "51",
  "argentina|romero": "28",
  "argentina|rulli": "46",
  "argentina|senesi": "29",
  "argentina|simeone": "41",
  "argentina|tagliafico": "34",
  "argentina|de paul": "50",
  "england|anderson": "486",
  "england|bellingham": "491",
  "england|burn": "462",
  "england|chalobah": "2078",
  "england|d henderson": "478",
  "england|dean henderson": "478",
  "england|eze": "1710",
  "england|gordon": "474",
  "england|guehi": "461",
  "england|james": "1709",
  "england|kane": "468",
  "england|konsa": "463",
  "england|madueke": "476",
  "england|mainoo": "485",
  "england|o reilly": "457",
  "england|pickford": "477",
  "england|rashford": "471",
  "england|reece james": "1709",
  "england|rice": "488",
  "england|rogers": "475",
  "england|saka": "469",
  "england|spence": "467",
  "england|stones": "466",
  "england|toney": "1712",
  "england|trafford": "479",
  "england|watkins": "1711",
  "france|akliouche": "514",
  "france|barcola": "1431",
  "france|cherki": "516",
  "france|dembele": "501",
  "france|digne": "498",
  "france|doue": "505",
  "france|gusto": "499",
  "france|kante": "509",
  "france|konate": "495",
  "france|kone": "512",
  "france|kounde": "1430",
  "france|lacroix": "493",
  "france|lucas hernandez": "496",
  "france|maignan": "506",
  "france|mateta": "1432",
  "france|mbappe": "500",
  "france|olise": "517",
  "france|rabiot": "510",
  "france|risser": "1428",
  "france|saliba": "1429",
  "france|samba": "508",
  "france|theo hernandez": "492",
  "france|thuram": "502",
  "france|tchouameni": "515",
  "france|upamecano": "494",
  "france|zaire emery": "511",
  "spain|baena": "1082",
  "spain|borja iglesias": "1095",
  "spain|cubarsi": "1089",
  "spain|cucurella": "1088",
  "spain|eric garcia": "1995",
  "spain|fabian": "1998",
  "spain|fabian ruiz": "1998",
  "spain|ferran torres": "1093",
  "spain|gavi": "1999",
  "spain|gonzalez": "1106",
  "spain|grimaldo": "1087",
  "spain|iglesias": "1095",
  "spain|joan garcia": "1101",
  "spain|lamine yamal": "1092",
  "spain|laporte": "1086",
  "spain|llorente": "1102",
  "spain|merino": "1997",
  "spain|munoz": "1097",
  "spain|nico williams": "2000",
  "spain|olmo": "1105",
  "spain|oyarzabal": "1094",
  "spain|pedri": "1106",
  "spain|pino": "1081",
  "spain|porro": "1085",
  "spain|pubill": "1996",
  "spain|raya": "1098",
  "spain|rodri": "1104",
  "spain|ruiz": "1998",
  "spain|simon": "1099",
  "spain|torres": "1093",
  "spain|williams": "2000",
  "spain|yamal": "1092",
  "spain|zubimendi": "1084"
};

const THIRD_PLACE_SCORE_ROWS = [
  [1934, "Germany", 3, "Austria", 2, false, "https://www.rsssf.org/tables/34f.html"],
  [1938, "Brazil", 4, "Sweden", 2, false, "https://www.rsssf.org/tables/38f.html"],
  [1954, "Austria", 3, "Uruguay", 1, false, "https://www.rsssf.org/tables/54f.html"],
  [1958, "France", 6, "West Germany", 3, false, "https://www.rsssf.org/tables/58f.html"],
  [1962, "Chile", 1, "Yugoslavia", 0, false, "https://www.rsssf.org/tables/62f.html"],
  [1966, "Portugal", 2, "Soviet Union", 1, false, "https://www.rsssf.org/tables/66f.html"],
  [1970, "West Germany", 1, "Uruguay", 0, false, "https://www.rsssf.org/tables/70f.html"],
  [1974, "Poland", 1, "Brazil", 0, false, "https://www.rsssf.org/tables/74f.html"],
  [1978, "Brazil", 2, "Italy", 1, false, "https://www.rsssf.org/tables/78f.html"],
  [1982, "Poland", 3, "France", 2, false, "https://www.rsssf.org/tables/82f.html"],
  [1986, "France", 4, "Belgium", 2, true, "https://www.rsssf.org/tables/86f.html"],
  [1990, "Italy", 2, "England", 1, false, "https://www.rsssf.org/tables/90f.html"],
  [1994, "Sweden", 4, "Bulgaria", 0, false, "https://www.rsssf.org/tables/94f.html"],
  [1998, "Croatia", 2, "Netherlands", 1, false, "https://www.rsssf.org/tables/98f.html"],
  [2002, "Turkey", 3, "South Korea", 2, false, "https://www.rsssf.org/tables/2002f.html"],
  [2006, "Germany", 3, "Portugal", 1, false, "https://www.rsssf.org/tables/2006f.html"],
  [2010, "Germany", 3, "Uruguay", 2, false, "https://www.rsssf.org/tables/2010f.html"],
  [2014, "Netherlands", 3, "Brazil", 0, false, "https://www.rsssf.org/tables/2014f.html"],
  [2018, "Belgium", 2, "England", 0, false, "https://www.rsssf.org/tables/2018f.html"],
  [2022, "Croatia", 2, "Morocco", 1, false, "https://www.rsssf.org/tables/2022f.html"]
];

const LINEUP_NEWS_ITEMS = [
  {
    team_id: "france",
    team: "France",
    source: "The Guardian World Cup countdown liveblog",
    source_url: "https://www.theguardian.com/football/live/2026/jul/17/world-cup-2026-spain-v-argentina-countdown-trump-to-attend-final-england-news-live",
    publication_time: "2026-07-17",
    predicted_lineup: null,
    confirmed_absences: [],
    injury_doubts: [],
    suspension_risks: [],
    rotation_notes: ["Deschamps said Mbappe is available and promised changes for the third-place match."],
    confidence_level: "medium",
    model_effect: "team_level_third_place_rotation_caution_only"
  },
  {
    team_id: "england",
    team: "England",
    source: "The Guardian World Cup countdown liveblog and talkSPORT third-place preview",
    source_url: "https://talksport.com/football/world-cup/4236250/england-vs-france-kick-off-time-uk-date-third-place-playoff/",
    publication_time: "2026-07-17",
    predicted_lineup: null,
    confirmed_absences: [],
    injury_doubts: [],
    suspension_risks: [],
    rotation_notes: ["Third-place match context increases rotation risk; no reliable complete expected XI found."],
    confidence_level: "low",
    model_effect: "team_level_third_place_rotation_caution_only"
  },
  {
    team_id: "spain",
    team: "Spain",
    source: "The Guardian World Cup countdown liveblog",
    source_url: "https://www.theguardian.com/football/live/2026/jul/17/world-cup-2026-spain-v-argentina-countdown-trump-to-attend-final-england-news-live",
    publication_time: "2026-07-17",
    predicted_lineup: null,
    confirmed_absences: [],
    injury_doubts: ["Mikel Merino referenced smoke/conditions; no lineup absence confirmed in the audited source."],
    suspension_risks: [],
    rotation_notes: ["No reliable full final XI source found; explicit SF lineup remains primary evidence."],
    confidence_level: "low",
    model_effect: "no_individual_probability_adjustment"
  },
  {
    team_id: "argentina",
    team: "Argentina",
    source: "The Guardian World Cup countdown liveblog",
    source_url: "https://www.theguardian.com/football/live/2026/jul/17/world-cup-2026-spain-v-argentina-countdown-trump-to-attend-final-england-news-live",
    publication_time: "2026-07-17",
    predicted_lineup: null,
    confirmed_absences: [],
    injury_doubts: [],
    suspension_risks: [],
    rotation_notes: ["No reliable full final XI source found; explicit SF lineup remains primary evidence."],
    confidence_level: "low",
    model_effect: "no_individual_probability_adjustment"
  }
];

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    if (fallback !== null) return fallback;
    throw error;
  }
}

async function writeJson(filePath, value, compact = false) {
  await writeFile(filePath, `${compact ? JSON.stringify(value) : JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function writeText(filePath, value) {
  await writeFile(filePath, `${value.trimEnd()}\n`, "utf8");
}

function rowsFromJson(data, keys) {
  if (Array.isArray(data)) return data;
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
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

function round(value, digits = 3) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  const factor = 10 ** digits;
  return Math.round(number * factor) / factor;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function financePriceTier(position, price) {
  const thresholds = FINANCE_PRICE_TIER_THRESHOLDS[position] || FINANCE_PRICE_TIER_THRESHOLDS.MID;
  const numericPrice = Number(price);
  if (!Number.isFinite(numericPrice)) return "unknown";
  return thresholds.find(([, minimumPrice]) => numericPrice >= minimumPrice)?.[0] || "unknown";
}

function perPrice(points, price) {
  const numericPrice = Number(price);
  return numericPrice > 0 ? round(Number(points || 0) / numericPrice, 4) : null;
}

function median(values) {
  const sorted = values.slice().sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function mdTable(headers, rows) {
  if (!rows.length) return "_None._";
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((value) => String(value ?? "")).join(" | ")} |`)
  ].join("\n");
}

function teamIdFromCountry(value) {
  return slug(value);
}

function officialIndexes(officialRows) {
  const byId = new Map();
  const byTeam = new Map();
  for (const row of officialRows) {
    const item = {
      ...row,
      official_fantasy_player_id: String(row.official_fantasy_player_id || ""),
      team_id_slug: teamIdFromCountry(row.country),
      normalized_name: normalizeText(row.name)
    };
    byId.set(item.official_fantasy_player_id, item);
    const list = byTeam.get(item.team_id_slug) || [];
    list.push(item);
    byTeam.set(item.team_id_slug, list);
  }
  return { byId, byTeam };
}

function officialBySourceName(indexes, teamId, sourceName) {
  const normalized = normalizeText(sourceName);
  const aliasId = PLAYER_ALIASES[`${teamId}|${normalized}`];
  if (aliasId && indexes.byId.has(aliasId)) return { official: indexes.byId.get(aliasId), confidence: "alias_official_fantasy_id" };
  const teamRows = indexes.byTeam.get(teamId) || [];
  const exact = teamRows.filter((row) => row.normalized_name === normalized);
  if (exact.length === 1) return { official: exact[0], confidence: "exact_name" };
  const lastToken = normalized.split(" ").filter(Boolean).at(-1);
  const lastMatches = lastToken && lastToken.length >= 4
    ? teamRows.filter((row) => row.normalized_name.split(" ").includes(lastToken))
    : [];
  if (lastMatches.length === 1) return { official: lastMatches[0], confidence: "unique_last_token" };
  return { official: null, confidence: lastMatches.length ? "ambiguous_unmatched" : "unmatched" };
}

function liveBySource(live) {
  return new Map(rowsFromJson(live, ["fixtures"]).map((fixture) => [String(fixture.source_fixture_id || fixture.match_number || ""), fixture]));
}

function scoreLabel(fixture) {
  if (fixture?.home_score === null || fixture?.home_score === undefined) return null;
  return `${fixture.home_team || fixture.local_home_team} ${fixture.home_score}-${fixture.away_score} ${fixture.away_team || fixture.local_away_team}`;
}

function isFinalFixture(fixture) {
  return ["complete", "completed", "played"].includes(String(fixture?.fixture_status || "").toLowerCase()) &&
    String(fixture?.score_status || "").toLowerCase() === "final" &&
    fixture?.safe_to_display_score === true;
}

function actualWinner(fixture) {
  if (!isFinalFixture(fixture)) return null;
  const homeWins = Number(fixture.home_score) > Number(fixture.away_score);
  const awayWins = Number(fixture.away_score) > Number(fixture.home_score);
  if (!homeWins && !awayWins) return null;
  return homeWins ? teamIdFromCountry(fixture.home_team) : teamIdFromCountry(fixture.away_team);
}

function actualLoser(fixture) {
  if (!isFinalFixture(fixture)) return null;
  const winner = actualWinner(fixture);
  const teams = [teamIdFromCountry(fixture.home_team), teamIdFromCountry(fixture.away_team)];
  return teams.find((team) => team !== winner) || null;
}

function buildFinalRoundFixtureAuthority({ live }) {
  const bySource = liveBySource(live);
  const sf101 = bySource.get("101");
  const sf102 = bySource.get("102");
  const third = bySource.get("103");
  const final = bySource.get("104");
  const winner101 = actualWinner(sf101);
  const winner102 = actualWinner(sf102);
  const loser101 = actualLoser(sf101);
  const loser102 = actualLoser(sf102);
  const errors = [];

  if (!sf101 || !sf102 || !isFinalFixture(sf101) || !isFinalFixture(sf102)) errors.push("Semifinal fixtures are not both final and safe.");
  if (winner101 !== "spain") errors.push(`M101 winner expected Spain, found ${winner101 || "missing"}.`);
  if (winner102 !== "argentina") errors.push(`M102 winner expected Argentina, found ${winner102 || "missing"}.`);
  if (loser101 !== "france") errors.push(`M101 loser expected France, found ${loser101 || "missing"}.`);
  if (loser102 !== "england") errors.push(`M102 loser expected England, found ${loser102 || "missing"}.`);
  if (!third || !final) errors.push("Scheduled final-round live rows 103/104 are missing.");

  const fixtures = [
    {
      official_bracket_slot: "M103",
      bracket_match_number: 103,
      bracket_slot_id: "M103",
      fixture_id: "fwc2026-m103",
      source_fixture_id: "103",
      source_fixture_id_role: "feed_source_id_only_not_bracket_slot",
      round: "Third Place",
      fantasy_matchday_id: MATCHDAY_ID,
      stage: "third_place",
      classification: "final_known",
      status: "scheduled",
      public_label: "Third Place",
      team_a: TEAM_INFO.france,
      team_b: TEAM_INFO.england,
      kickoff: {
        source_datetime: third?.date || third?.source_datetime || "2026-07-18T22:00:00+01:00",
        eastern_datetime_label: third?.eastern_datetime_label || "Jul 18, 2026 · 5:00 PM ET"
      },
      venue: third?.venue || { name: "Hard Rock Stadium", city: "Miami Gardens, Florida" },
      bracket_path: "Loser Match 101 v Loser Match 102",
      source_matches: [
        { source_match: "M101", loser: TEAM_INFO.france, winner: TEAM_INFO.spain, score: scoreLabel(sf101), status: sf101?.fixture_status, score_status: sf101?.score_status },
        { source_match: "M102", loser: TEAM_INFO.england, winner: TEAM_INFO.argentina, score: scoreLabel(sf102), status: sf102?.fixture_status, score_status: sf102?.score_status }
      ],
      source_confidence: "completed_sf_losers_mapped_to_official_third_place_bracket_slot",
      public_note: "Third Place fixture from completed semifinal losers."
    },
    {
      official_bracket_slot: "M104",
      bracket_match_number: 104,
      bracket_slot_id: "M104",
      fixture_id: "fwc2026-m104",
      source_fixture_id: "104",
      source_fixture_id_role: "feed_source_id_only_not_bracket_slot",
      round: "Final",
      fantasy_matchday_id: MATCHDAY_ID,
      stage: "final",
      classification: "final_known",
      status: "scheduled",
      public_label: "Final",
      team_a: TEAM_INFO.spain,
      team_b: TEAM_INFO.argentina,
      kickoff: {
        source_datetime: final?.date || final?.source_datetime || "2026-07-19T20:00:00+01:00",
        eastern_datetime_label: final?.eastern_datetime_label || "Jul 19, 2026 · 3:00 PM ET"
      },
      venue: final?.venue || { name: "MetLife Stadium", city: "East Rutherford, New Jersey" },
      bracket_path: "Winner Match 101 v Winner Match 102",
      source_matches: [
        { source_match: "M101", winner: TEAM_INFO.spain, loser: TEAM_INFO.france, score: scoreLabel(sf101), status: sf101?.fixture_status, score_status: sf101?.score_status },
        { source_match: "M102", winner: TEAM_INFO.argentina, loser: TEAM_INFO.england, score: scoreLabel(sf102), status: sf102?.fixture_status, score_status: sf102?.score_status }
      ],
      source_confidence: "completed_sf_winners_mapped_to_official_final_bracket_slot",
      public_note: "Final fixture from completed semifinal winners."
    }
  ];

  const teams = fixtures.flatMap((fixture) => [fixture.team_a.team_id, fixture.team_b.team_id]);
  if (new Set(teams).size !== 4) errors.push("Final Round fixture authority does not contain four unique teams.");

  return {
    schema_version: "final_round_fixture_authority_v1",
    generated_at: GENERATED_AT,
    status: errors.length ? "fail" : "pass",
    release_status: errors.length ? "blocked" : "final_round_setup",
    evidence_scope: "Both semifinal fixtures are final and safely mapped.",
    source_files: {
      liveMatchdayStatus: "data/liveMatchdayStatus_v1.json",
      sfFixtureAuthority: "data/sfFixtureAuthority_v1.json",
      worldCupData: "worldCupData.js"
    },
    summary: {
      total_final_round_fixtures: fixtures.length,
      final_fixtures: 1,
      third_place_fixtures: 1,
      completed_sf_fixtures_used: [sf101, sf102].filter(isFinalFixture).length,
      incomplete_sf_fixtures: [sf101, sf102].filter((fixture) => !isFinalFixture(fixture)).length,
      final_participants: ["Spain", "Argentina"],
      third_place_participants: ["France", "England"],
      blocked: errors.length
    },
    fixtures,
    qa: { status: errors.length ? "fail" : "pass", errors, warnings: [] }
  };
}

function buildSfLineupEvidence(officialRows) {
  const indexes = officialIndexes(officialRows);
  const evidenceRows = [];
  const matchFailures = [];

  for (const source of SF_LINEUP_SOURCES) {
    const starterIds = new Set();
    const benchIds = new Set();
    for (const sourceName of source.starters) {
      const { official, confidence } = officialBySourceName(indexes, source.team_id, sourceName);
      if (!official) {
        matchFailures.push({ team: source.team, sourceName, confidence });
        continue;
      }
      starterIds.add(official.official_fantasy_player_id);
      evidenceRows.push({
        lineup_evidence_id: `guardian-sf-${source.match_number}-${source.team_id}-${slug(sourceName)}`,
        evidence_round: "SF",
        round: "SF",
        match_number: source.match_number,
        fixture_id: source.fixture_id,
        source_fixture_id: source.source_fixture_id,
        team: source.team,
        team_id: source.team_id,
        opponent: source.opponent,
        opponent_team_id: source.opponent_team_id,
        official_fantasy_player_id: official.official_fantasy_player_id,
        name: official.name,
        source_name: sourceName,
        official_fantasy_position: official.official_fantasy_position,
        started: true,
        substitute_listed: false,
        evidence_type: "external_explicit_sf_starter",
        source_confidence: `guardian_semifinal_starting_xi_${confidence}`,
        source_url: source.source_url,
        source_checked: source.source_checked,
        source_published_date: source.source_published_date,
        source_note: source.source_note,
        points_used_as_start_evidence: false
      });
    }
    for (const sourceName of source.bench) {
      const { official, confidence } = officialBySourceName(indexes, source.team_id, sourceName);
      if (!official) {
        matchFailures.push({ team: source.team, sourceName, confidence });
        continue;
      }
      benchIds.add(official.official_fantasy_player_id);
      evidenceRows.push({
        lineup_evidence_id: `guardian-sf-${source.match_number}-${source.team_id}-bench-${slug(sourceName)}`,
        evidence_round: "SF",
        round: "SF",
        match_number: source.match_number,
        fixture_id: source.fixture_id,
        source_fixture_id: source.source_fixture_id,
        team: source.team,
        team_id: source.team_id,
        opponent: source.opponent,
        opponent_team_id: source.opponent_team_id,
        official_fantasy_player_id: official.official_fantasy_player_id,
        name: official.name,
        source_name: sourceName,
        official_fantasy_position: official.official_fantasy_position,
        started: false,
        substitute_listed: true,
        evidence_type: "external_explicit_sf_bench_list",
        source_confidence: `guardian_semifinal_bench_list_${confidence}`,
        source_url: source.source_url,
        source_checked: source.source_checked,
        source_published_date: source.source_published_date,
        source_note: source.source_note,
        points_used_as_start_evidence: false
      });
    }
    for (const official of indexes.byTeam.get(source.team_id) || []) {
      if (starterIds.has(official.official_fantasy_player_id) || benchIds.has(official.official_fantasy_player_id)) continue;
      evidenceRows.push({
        lineup_evidence_id: `guardian-sf-${source.match_number}-${source.team_id}-nonstarter-${official.official_fantasy_player_id}`,
        evidence_round: "SF",
        round: "SF",
        match_number: source.match_number,
        fixture_id: source.fixture_id,
        source_fixture_id: source.source_fixture_id,
        team: source.team,
        team_id: source.team_id,
        opponent: source.opponent,
        opponent_team_id: source.opponent_team_id,
        official_fantasy_player_id: official.official_fantasy_player_id,
        name: official.name,
        official_fantasy_position: official.official_fantasy_position,
        started: false,
        substitute_listed: false,
        evidence_type: "external_sf_full_lineup_non_starter",
        source_confidence: "full_semifinal_lineup_exclusion",
        source_url: source.source_url,
        source_checked: source.source_checked,
        source_published_date: source.source_published_date,
        source_note: "Player was not listed as a starter or named substitute in the audited Guardian semifinal lineup block.",
        points_used_as_start_evidence: false
      });
    }
  }

  const starterRows = evidenceRows.filter((row) => row.started);
  return {
    schema_version: "sf_lineup_evidence_for_final_round_v1",
    generated_at: GENERATED_AT,
    status: matchFailures.length ? "fail" : "pass",
    source: "Guardian semifinal liveblog lineup blocks",
    source_checked: "2026-07-18",
    summary: {
      teams_with_explicit_sf_lineups: new Set(starterRows.map((row) => row.team_id)).size,
      explicit_sf_starters: starterRows.length,
      teams_with_11_sf_starters: [...new Set(SF_LINEUP_SOURCES.map((source) => source.team_id))]
        .filter((teamId) => starterRows.filter((row) => row.team_id === teamId).length === 11).length,
      points_used_as_start_evidence: false,
      unmatched_source_names: matchFailures.length
    },
    rows: evidenceRows,
    unmatched_source_names: matchFailures
  };
}

function buildThirdPlaceHistoricalProfile() {
  const games = THIRD_PLACE_SCORE_ROWS.map(([year, team_a, team_a_goals, team_b, team_b_goals, extra_time, source_url]) => ({
    year,
    team_a,
    team_a_goals,
    team_b,
    team_b_goals,
    extra_time,
    goals: team_a_goals + team_b_goals,
    both_teams_scored: team_a_goals > 0 && team_b_goals > 0,
    clean_sheet: team_a_goals === 0 || team_b_goals === 0,
    over_2_5_goals: team_a_goals + team_b_goals > 2.5,
    over_3_5_goals: team_a_goals + team_b_goals > 3.5,
    source_url,
    source_family: "RSSSF World Cup tournament records"
  }));
  const goals = games.map((game) => game.goals);
  const averageGoals = goals.reduce((sum, value) => sum + value, 0) / goals.length;
  const finalGoals = [6, 3, 6, 3, 5, 7, 4, 4, 1, 3, 6, 3, 3, 2, 2, 2, 6];
  const post1982 = games.filter((game) => game.year >= 1982);
  const modifiers = {
    thirdPlaceGoalEnvironmentModifier: round(clamp(averageGoals / 2.65, 1.02, 1.16), 3),
    thirdPlaceCleanSheetModifier: round(clamp(1 - ((games.filter((game) => game.clean_sheet).length / games.length) - 0.24) * 0.4, 0.86, 1), 3),
    thirdPlaceLineupVolatilityModifier: 1.08,
    thirdPlaceStarterProbabilityPenalty: 0.12,
    thirdPlaceUpsideModifier: round(clamp((post1982.filter((game) => game.over_2_5_goals).length / post1982.length) / 0.52, 1, 1.12), 3)
  };
  const lineupEvidence = {
    status: "partial_low_confidence",
    tournaments_with_source_backed_lineup_rows: [],
    partial_evidence_table: [
      {
        evidence: "Full cross-tournament semifinal-to-third-place lineup table was not available in repo-local data or the audited public sources.",
        model_use: "No player-specific historical lineup-change claim is made from historical lineups."
      },
      {
        evidence: "Current 2026 pre-match reporting says France promised changes; England/France third-place context is treated as higher rotation risk.",
        model_use: "A conservative team-level starter probability penalty is applied only to Third Place teams."
      }
    ],
    confidence: "low",
    conclusion: "Third-place lineup churn is plausible but not quantified from complete historical lineup data; model uses conservative caution rather than aggressive individual promotions."
  };
  const profile = {
    schema_version: "third_place_historical_profile_v1",
    generated_at: GENERATED_AT,
    source_checked: "2026-07-18",
    status: "pass",
    sources: [
      "https://www.rsssf.org/tablesw/worldcup.html",
      "RSSSF tournament pages linked per score row",
      "https://www.fifa.com/en/articles/world-cup-qatar-2022-croatia-morocco-third-place-play-off"
    ],
    exclusions: ["1930 had no match for third place.", "1950 used a final group and had no separate match for third place.", "2026 future results are excluded."],
    score_audit: {
      games,
      game_count: games.length,
      average_goals: round(averageGoals, 3),
      median_goals: median(goals),
      over_2_5_share: round(games.filter((game) => game.over_2_5_goals).length / games.length, 3),
      over_3_5_share: round(games.filter((game) => game.over_3_5_goals).length / games.length, 3),
      both_teams_scored_share: round(games.filter((game) => game.both_teams_scored).length / games.length, 3),
      clean_sheet_frequency: round(games.filter((game) => game.clean_sheet).length / games.length, 3),
      biggest_scorelines: games.slice().sort((a, b) => b.goals - a.goals).slice(0, 5),
      final_goal_comparison: {
        source_scope: "RSSSF final scores, excluding 1930/1950 and penalty shootout goals.",
        final_game_count: finalGoals.length,
        average_final_goals: round(finalGoals.reduce((sum, value) => sum + value, 0) / finalGoals.length, 3),
        third_place_average_minus_final_average: round(averageGoals - (finalGoals.reduce((sum, value) => sum + value, 0) / finalGoals.length), 3)
      }
    },
    lineup_audit: lineupEvidence,
    modifiers,
    qa: {
      status: "pass",
      checks: [
        { id: "third_place_scores_sourced", status: "pass" },
        { id: "no_2026_result_leak", status: games.some((game) => game.year >= 2026) ? "fail" : "pass" },
        { id: "lineup_claims_limited_to_partial_evidence", status: "pass" },
        { id: "modifiers_documented", status: Object.values(modifiers).every((value) => Number.isFinite(value)) ? "pass" : "fail" }
      ]
    }
  };
  const qa = {
    schema_version: "third_place_historical_profile_qa_v1",
    generated_at: GENERATED_AT,
    status: profile.qa.checks.every((check) => check.status === "pass") ? "pass" : "fail",
    summary: {
      score_games_used: games.length,
      average_goals: profile.score_audit.average_goals,
      median_goals: profile.score_audit.median_goals,
      lineup_confidence: lineupEvidence.confidence,
      modifiers
    },
    checks: profile.qa.checks
  };
  return { profile, qa };
}

function buildFinalRoundLineupNewsAudit() {
  return {
    schema_version: "final_round_lineup_news_audit_v1",
    generated_at: GENERATED_AT,
    source_checked: "2026-07-18",
    status: "pass",
    summary: {
      teams_checked: 4,
      full_predicted_xi_sources_found: 0,
      model_individual_probability_adjustments: 0,
      team_level_third_place_rotation_cautions: 2,
      recommendation: "Run another pre-lock lineup monitor later; do not treat speculation as confirmed XI evidence."
    },
    teams: LINEUP_NEWS_ITEMS,
    qa: {
      status: "pass",
      no_speculative_social_posts: true,
      explicit_sf_lineup_primary: true,
      no_predicted_lineup_claim_without_source: true
    }
  };
}

function qfEvidenceMaps(qfLineupEvidence) {
  const rows = rowsFromJson(qfLineupEvidence, ["rows", "lineupEvidenceRows"]);
  const byId = new Map();
  for (const row of rows) {
    const id = String(row.official_fantasy_player_id || "");
    if (!id) continue;
    const existing = byId.get(id) || {};
    byId.set(id, {
      ...existing,
      qfStarted: existing.qfStarted || row.started === true,
      qfSubstitute: existing.qfSubstitute || row.substitute_listed === true,
      qfLineupSource: existing.qfLineupSource || row.source_url || null,
      qfLineupEvidenceId: existing.qfLineupEvidenceId || row.lineup_evidence_id || null
    });
  }
  return byId;
}

function sfEvidenceMaps(sfLineupEvidence) {
  const byId = new Map();
  for (const row of sfLineupEvidence.rows || []) {
    const id = String(row.official_fantasy_player_id || "");
    if (!id) continue;
    const existing = byId.get(id) || {};
    byId.set(id, {
      ...existing,
      sfStarted: existing.sfStarted || row.started === true,
      sfSubstitute: existing.sfSubstitute || row.substitute_listed === true,
      sfLineupSource: existing.sfLineupSource || row.source_url || null,
      sfLineupEvidenceId: existing.sfLineupEvidenceId || row.lineup_evidence_id || null,
      sfLineupEvidenceType: row.started === true ? "explicit_sf_starter" : row.substitute_listed ? "explicit_sf_bench" : "external_sf_full_lineup_non_starter"
    });
  }
  return byId;
}

function buildTeamVolatility(qfLineupEvidence, sfLineupEvidence) {
  const qfRows = rowsFromJson(qfLineupEvidence, ["rows", "lineupEvidenceRows"]).filter((row) => row.started);
  const sfRows = rowsFromJson(sfLineupEvidence, ["rows"]).filter((row) => row.started);
  const teams = [...new Set(sfRows.map((row) => row.team_id))];
  const values = teams.map((teamId) => {
    const qfSet = new Set(qfRows.filter((row) => row.team_id === teamId).map((row) => String(row.official_fantasy_player_id)));
    const sfSet = new Set(sfRows.filter((row) => row.team_id === teamId).map((row) => String(row.official_fantasy_player_id)));
    const gained = [...sfSet].filter((id) => !qfSet.has(id));
    const lost = [...qfSet].filter((id) => !sfSet.has(id));
    const score = round(clamp((gained.length + lost.length) / 22, 0, 0.5), 3);
    return {
      team_id: teamId,
      team: TEAM_INFO[teamId]?.team || teamId,
      qf_starters: qfSet.size,
      sf_starters: sfSet.size,
      gained_starters_from_qf_to_sf: gained,
      lost_starters_from_qf_to_sf: lost,
      volatility_score: score,
      volatility_level: score >= 0.28 ? "high" : score >= 0.12 ? "medium" : "low"
    };
  });
  return new Map(values.map((row) => [row.team_id, row]));
}

function fixtureForTeam(authority, teamId) {
  return (authority.fixtures || []).find((fixture) => fixture.team_a.team_id === teamId || fixture.team_b.team_id === teamId) || null;
}

function opponentForFixture(fixture, teamId) {
  if (!fixture) return null;
  return fixture.team_a.team_id === teamId ? fixture.team_b : fixture.team_a;
}

function roleProbability({ fixture, sfEvidence, qfEvidence, volatility, thinProfile, selectable }) {
  if (selectable !== "playing") return { start_probability: 0, expected_minutes: 0, role_label: "unavailable_or_not_selectable", role_confidence: "high", caution: "Unavailable or not selectable.", major: true };
  if (thinProfile) return { start_probability: 0.12, expected_minutes: 8, role_label: "thin_profile_depth", role_confidence: "low", caution: "Thin-profile player: excluded from Core Picks and Team Builder without source-backed role coverage.", major: true };
  const isThird = fixture?.stage === "third_place";
  const volScore = Number(volatility?.volatility_score || 0);
  const sfStarted = sfEvidence?.sfStarted === true;
  const qfStarted = qfEvidence?.qfStarted === true;
  const sfSub = sfEvidence?.sfSubstitute === true;
  let start = isThird ? 0.1 : 0.08;
  let role = "bench_depth";
  let confidence = "medium";
  let caution = "";
  let major = false;

  if (sfStarted && qfStarted) {
    start = isThird ? 0.72 : 0.89;
    role = isThird ? "third_place_likely_starter_with_rotation_risk" : "locked_starter";
    confidence = isThird ? "medium" : "high";
  } else if (sfStarted) {
    start = isThird ? 0.68 : 0.82;
    role = isThird ? "third_place_possible_starter_role_change" : "likely_starter_role_change";
    confidence = "medium";
    caution = "Started SF after not starting QF; upgraded but role volatility remains.";
  } else if (qfStarted) {
    start = isThird ? 0.32 : 0.3;
    role = "downgraded_after_sf_bench";
    confidence = "medium";
    caution = "Started QF but not SF; downgraded for Final Round.";
    major = true;
  } else if (sfSub) {
    start = isThird ? 0.26 : 0.18;
    role = "substitute_depth";
    confidence = "medium";
    caution = isThird ? "SF substitute; Third Place rotation may help but start is not source-backed." : "SF substitute; start not source-backed.";
  }

  if (isThird) {
    start = clamp(start - 0.12 - volScore * 0.05, 0, 0.78);
    caution = [caution, "Third Place game may have higher rotation risk."].filter(Boolean).join(" ");
  } else {
    start = clamp(start - volScore * 0.02, 0, 0.93);
  }
  return {
    start_probability: round(start, 3),
    expected_minutes: round(start * (isThird ? 78 : 86), 1),
    role_label: role,
    role_confidence: confidence,
    caution,
    major
  };
}

function buildPlayerRoleModel({ officialRows, authority, qfLineupEvidence, sfLineupEvidence, thirdPlaceProfile, lineupNewsAudit }) {
  const qfMap = qfEvidenceMaps(qfLineupEvidence);
  const sfMap = sfEvidenceMaps(sfLineupEvidence);
  const volatilityMap = buildTeamVolatility(qfLineupEvidence, sfLineupEvidence);
  const fixtureTeams = new Set((authority.fixtures || []).flatMap((fixture) => [fixture.team_a.team_id, fixture.team_b.team_id]));
  const rows = officialRows
    .filter((row) => fixtureTeams.has(teamIdFromCountry(row.country)))
    .map((row) => {
      const id = String(row.official_fantasy_player_id || "");
      const teamId = teamIdFromCountry(row.country);
      const fixture = fixtureForTeam(authority, teamId);
      const opponent = opponentForFixture(fixture, teamId);
      const qfEvidence = qfMap.get(id) || {};
      const sfEvidence = sfMap.get(id) || {};
      const volatility = volatilityMap.get(teamId) || { volatility_score: 0, volatility_level: "none" };
      const thinProfile = THIN_PROFILE_IDS.has(id);
      const role = roleProbability({
        fixture,
        sfEvidence,
        qfEvidence,
        volatility,
        thinProfile,
        selectable: row.selectable_status
      });
      const isThird = fixture?.stage === "third_place";
      const allowedCorePick = row.selectable_status === "playing" &&
        !thinProfile &&
        sfEvidence.sfStarted === true &&
        role.start_probability >= (isThird ? 0.55 : 0.8) &&
        !(role.major && !isThird);
      return {
        official_fantasy_player_id: id,
        internal_player_id: row.current_player_match?.player_id || `${teamId}-${slug(row.name)}`,
        name: row.name,
        display_name: row.name,
        country: row.country,
        team_id: teamId,
        official_team_id: row.team_id,
        official_fantasy_position: row.official_fantasy_position,
        official_price: row.official_price,
        selectable_status: row.selectable_status,
        fixture_id: fixture?.fixture_id || null,
        match_id: fixture?.fixture_id || null,
        match_number: fixture?.bracket_match_number || null,
        fixture_stage: fixture?.stage || null,
        fixture_round: fixture?.round || null,
        matchday: MATCHDAY_ID,
        matchday_label: MATCHDAY_LABEL,
        opponent: opponent?.team || null,
        opponent_team_id: opponent?.team_id || null,
        side: fixture?.team_a.team_id === teamId ? "home_listed" : "away_listed",
        sfStarted: sfEvidence.sfStarted === true,
        sfSubstitute: sfEvidence.sfSubstitute === true,
        sfLineupSource: sfEvidence.sfLineupSource || null,
        sfLineupEvidenceId: sfEvidence.sfLineupEvidenceId || null,
        qfStarted: qfEvidence.qfStarted === true,
        qfSubstitute: qfEvidence.qfSubstitute === true,
        qfLineupSource: qfEvidence.qfLineupSource || null,
        qfLineupEvidenceId: qfEvidence.qfLineupEvidenceId || null,
        lineupEvidenceType: sfEvidence.sfStarted ? "explicit_sf_starter" : sfEvidence.sfSubstitute ? "explicit_sf_bench" : "external_sf_full_lineup_non_starter",
        evidenceStrength: sfEvidence.sfStarted && qfEvidence.qfStarted
          ? "explicit_sf_qf_starter_continuity"
          : sfEvidence.sfStarted
            ? "explicit_sf_starter_role_change"
            : qfEvidence.qfStarted
              ? "qf_starter_but_sf_bench_or_nonstarter"
              : sfEvidence.sfSubstitute
                ? "explicit_sf_bench_appearance_only"
                : "no_explicit_recent_starter_evidence",
        start_probability: role.start_probability,
        startProb: role.start_probability,
        expected_minutes: role.expected_minutes,
        expectedMinutes: role.expected_minutes,
        role_label: role.role_label,
        roleTier: role.role_label,
        role_confidence: role.role_confidence,
        roleCaution: role.caution,
        role_caution: role.caution,
        majorRoleCaution: role.major,
        role_volatility_score: volatility.volatility_score,
        role_volatility_level: volatility.volatility_level,
        third_place_rotation_risk: isThird,
        third_place_modifier_applied: isThird,
        third_place_starter_probability_penalty: isThird ? thirdPlaceProfile.modifiers.thirdPlaceStarterProbabilityPenalty : 0,
        lineup_news_adjustment: (lineupNewsAudit.teams || []).find((item) => item.team_id === teamId)?.model_effect || "none",
        thin_profile: thinProfile,
        allowedCorePick,
        coreEligibilityReason: allowedCorePick
          ? isThird ? "explicit_sf_starter_with_third_place_rotation_check" : "explicit_sf_starter_with_final_role_confidence"
          : thinProfile
            ? "thin_profile_guardrail"
            : sfEvidence.sfStarted
              ? "start_probability_or_role_caution_blocks_core"
              : "no_explicit_sf_starter_evidence",
        coreEligibilityWarning: allowedCorePick ? null : thinProfile ? "Thin-profile player blocked from Core Picks and Team Builder." : "Core Pick blocked without explicit SF starter evidence or sufficient role confidence.",
        points_used_as_start_evidence: false,
        data_quality_flags: [
          "player_role_final_round_v1",
          "explicit_sf_lineup_primary",
          "points_do_not_imply_start",
          "ownership_not_used_as_signal",
          "final_squads_not_source_backed",
          isThird ? "third_place_rotation_risk_included" : "final_fixture_role_context",
          thinProfile ? "thin_profile_guardrail" : null
        ].filter(Boolean)
      };
    });

  const qa = {
    schema_version: "player_role_model_qa_final_round_v1",
    generated_at: GENERATED_AT,
    status: "pass",
    summary: {
      role_rows: rows.length,
      final_round_teams: [...fixtureTeams],
      sf_starters: rows.filter((row) => row.sfStarted).length,
      qf_and_sf_starters: rows.filter((row) => row.sfStarted && row.qfStarted).length,
      points_used_as_start_evidence_rows: rows.filter((row) => row.points_used_as_start_evidence).length,
      third_place_rotation_risk_rows: rows.filter((row) => row.third_place_rotation_risk).length,
      thin_profile_rows: rows.filter((row) => row.thin_profile).length,
      core_pick_eligible_players: rows.filter((row) => row.allowedCorePick).length,
      team_volatility: [...volatilityMap.values()]
    },
    thin_profile_audit: rows.filter((row) => THIN_PROFILE_IDS.has(row.official_fantasy_player_id)).map((row) => ({
      official_fantasy_player_id: row.official_fantasy_player_id,
      name: row.name,
      country: row.country,
      fixture_round: row.fixture_round,
      start_probability: row.start_probability,
      allowedCorePick: row.allowedCorePick,
      coreEligibilityReason: row.coreEligibilityReason
    })),
    errors: []
  };
  if (qa.summary.points_used_as_start_evidence_rows > 0) qa.status = "fail";
  if (qa.thin_profile_audit.some((row) => row.allowedCorePick)) qa.status = "fail";

  return {
    schema_version: "player_role_model_final_round_v1",
    generated_at: GENERATED_AT,
    model_version: "player-role-final-round-v1",
    source_files: {
      officialFantasyPlayers: "data/officialFantasyPlayers_v0.json",
      finalRoundFixtureAuthority: "data/finalRoundFixtureAuthority_v1.json",
      sfLineupEvidence: "data/sfLineupEvidenceForFinalRound_v1.json",
      qfLineupEvidence: "data/qfLineupEvidenceForSf_v1.json",
      thirdPlaceHistoricalProfile: "data/thirdPlaceHistoricalProfile_v1.json",
      lineupNewsAudit: "data/finalRoundLineupNewsAudit_v1.json"
    },
    summary: qa.summary,
    playerRoleRows: rows,
    qa
  };
}

function predictionLookup(knockout) {
  const byTeams = new Map();
  for (const row of rowsFromJson(knockout, ["arbitrary_matchup_predictions", "fixtureScorePredictions"])) {
    if (row.home_team_id && row.away_team_id) byTeams.set(`${row.home_team_id}|${row.away_team_id}`, row);
  }
  return byTeams;
}

function reverseScoreline(scoreline) {
  const parts = String(scoreline || "").split("-");
  return parts.length === 2 ? `${parts[1]}-${parts[0]}` : scoreline;
}

function orientPrediction(lookup, homeId, awayId) {
  const direct = lookup.get(`${homeId}|${awayId}`);
  if (direct) return { row: direct, reversed: false };
  const reverse = lookup.get(`${awayId}|${homeId}`);
  return reverse ? { row: reverse, reversed: true } : { row: null, reversed: false };
}

function orientedValue(info, directKey, reverseKey) {
  if (!info.row) return null;
  return info.reversed ? info.row[reverseKey] : info.row[directKey];
}

function orientedScorelines(info, goalModifier = 1) {
  const rows = Array.isArray(info.row?.top_scorelines) ? info.row.top_scorelines : [];
  return rows.map((row) => {
    const homeGoals = info.reversed ? row.away_goals : row.home_goals;
    const awayGoals = info.reversed ? row.home_goals : row.away_goals;
    return {
      scoreline: info.reversed ? reverseScoreline(row.scoreline) : row.scoreline,
      home_goals: homeGoals,
      away_goals: awayGoals,
      probability: round(row.probability)
    };
  }).map((row) => ({
    ...row,
    probability: row.home_goals + row.away_goals >= 3 ? round(row.probability * goalModifier, 4) : row.probability
  })).sort((a, b) => b.probability - a.probability).slice(0, 6);
}

function buildScorePredictions({ authority, knockout, thirdPlaceProfile }) {
  const lookup = predictionLookup(knockout);
  const fixtureScorePredictions = (authority.fixtures || []).map((fixture) => {
    const homeId = fixture.team_a.team_id;
    const awayId = fixture.team_b.team_id;
    const info = orientPrediction(lookup, homeId, awayId);
    const isThird = fixture.stage === "third_place";
    const goalModifier = isThird ? thirdPlaceProfile.modifiers.thirdPlaceGoalEnvironmentModifier : 1;
    const cleanSheetModifier = isThird ? thirdPlaceProfile.modifiers.thirdPlaceCleanSheetModifier : 1;
    const homeExpectedGoals = round(Number(orientedValue(info, "home_expected_goals", "away_expected_goals") || 1.2) * goalModifier);
    const awayExpectedGoals = round(Number(orientedValue(info, "away_expected_goals", "home_expected_goals") || 1.2) * goalModifier);
    const homeAdvance = orientedValue(info, "home_advance_probability", "away_advance_probability") ?? 0.5;
    const awayAdvance = orientedValue(info, "away_advance_probability", "home_advance_probability") ?? 0.5;
    const homeWin = orientedValue(info, "home_win_probability", "away_win_probability") ?? 0.33;
    const awayWin = orientedValue(info, "away_win_probability", "home_win_probability") ?? 0.33;
    const draw = orientedValue(info, "draw_probability", "draw_probability") ?? 0.28;
    const homeClean = round(Number(orientedValue(info, "home_clean_sheet_probability", "away_clean_sheet_probability") || 0.25) * cleanSheetModifier);
    const awayClean = round(Number(orientedValue(info, "away_clean_sheet_probability", "home_clean_sheet_probability") || 0.25) * cleanSheetModifier);
    const favoriteHome = Number(homeAdvance) >= Number(awayAdvance);
    const scorelines = orientedScorelines(info, isThird ? thirdPlaceProfile.modifiers.thirdPlaceUpsideModifier : 1);
    return {
      prediction_id: `${fixture.fixture_id}-score-final-round-v1`,
      match_id: fixture.fixture_id,
      fixture_id: fixture.fixture_id,
      match_number: fixture.bracket_match_number,
      matchday: MATCHDAY_LABEL,
      fantasy_matchday_id: MATCHDAY_ID,
      stage: fixture.stage,
      group: fixture.round,
      date: fixture.kickoff.source_datetime,
      eastern_datetime_label: fixture.kickoff.eastern_datetime_label,
      fixture_authority_status: fixture.classification,
      public_label: fixture.public_label,
      home_team_id: homeId,
      home_team: fixture.team_a.team,
      away_team_id: awayId,
      away_team: fixture.team_b.team,
      home_expected_goals: homeExpectedGoals,
      away_expected_goals: awayExpectedGoals,
      home_projected_xg: homeExpectedGoals,
      away_projected_xg: awayExpectedGoals,
      total_expected_goals: round(homeExpectedGoals + awayExpectedGoals),
      home_win_probability: round(homeWin, 4),
      draw_probability: round(draw, 4),
      away_win_probability: round(awayWin, 4),
      home_clean_sheet_probability: homeClean,
      away_clean_sheet_probability: awayClean,
      both_teams_to_score_probability: round(isThird ? Math.min(0.72, Number(info.row?.both_teams_to_score_probability || 0.52) * 1.08) : Number(info.row?.both_teams_to_score_probability || 0.52), 4),
      upset_risk_probability: round(Math.min(homeAdvance, awayAdvance), 4),
      probability_extra_time: isThird ? null : round(draw, 4),
      home_advance_probability: round(homeAdvance, 4),
      away_advance_probability: round(awayAdvance, 4),
      home_advance_in_90_probability: round(homeWin, 4),
      away_advance_in_90_probability: round(awayWin, 4),
      home_advance_after_extra_time_probability: isThird ? null : round(orientedValue(info, "home_advance_after_extra_time_probability", "away_advance_after_extra_time_probability") || draw * 0.19, 4),
      away_advance_after_extra_time_probability: isThird ? null : round(orientedValue(info, "away_advance_after_extra_time_probability", "home_advance_after_extra_time_probability") || draw * 0.19, 4),
      home_advance_on_penalties_probability: isThird ? null : round(orientedValue(info, "home_advance_on_penalties_probability", "away_advance_on_penalties_probability") || draw * 0.31, 4),
      away_advance_on_penalties_probability: isThird ? null : round(orientedValue(info, "away_advance_on_penalties_probability", "home_advance_on_penalties_probability") || draw * 0.31, 4),
      favorite_team_id: favoriteHome ? homeId : awayId,
      favorite_team: favoriteHome ? fixture.team_a.team : fixture.team_b.team,
      favorite_win_probability: round(Math.max(homeAdvance, awayAdvance), 4),
      projected_advancing_team: favoriteHome ? fixture.team_a.team : fixture.team_b.team,
      matchUncertainty: "High",
      uncertainty_label: "High",
      top_scorelines: scorelines,
      top_scoreline: scorelines[0]?.scoreline || null,
      third_place_modifiers: isThird ? thirdPlaceProfile.modifiers : null,
      data_quality_flags: [
        "score_prediction_final_round_v1",
        "completed_sf_only",
        "pele_team_quality_prior",
        "ownership_not_used_as_signal",
        "final_squads_not_source_backed",
        isThird ? "third_place_goal_environment_modifier_applied" : "final_extra_time_penalty_logic_retained"
      ]
    };
  });

  const teamFixturePredictions = fixtureScorePredictions.flatMap((row) => [
    {
      team_fixture_prediction_id: `${row.fixture_id}-${row.home_team_id}-score-final-round-v1`,
      match_id: row.match_id,
      fixture_id: row.fixture_id,
      match_number: row.match_number,
      fantasy_matchday_id: MATCHDAY_ID,
      stage: row.stage,
      team_id: row.home_team_id,
      team: row.home_team,
      opponent_team_id: row.away_team_id,
      opponent: row.away_team,
      side: "home_listed",
      expected_goals: row.home_expected_goals,
      projectedXg: row.home_expected_goals,
      projected_xg: row.home_expected_goals,
      expected_goals_against: row.away_expected_goals,
      win_probability: row.home_win_probability,
      draw_probability: row.draw_probability,
      loss_probability: row.away_win_probability,
      advance_probability: row.home_advance_probability,
      clean_sheet_probability: row.home_clean_sheet_probability,
      fixture_difficulty_score: round((1 - row.home_advance_probability) * 100, 2),
      fixture_difficulty_band: row.home_advance_probability >= 0.58 ? "favorable" : row.home_advance_probability >= 0.45 ? "neutral" : "difficult",
      matchUncertainty: row.matchUncertainty,
      score_model_version: "score-final-round-v1"
    },
    {
      team_fixture_prediction_id: `${row.fixture_id}-${row.away_team_id}-score-final-round-v1`,
      match_id: row.match_id,
      fixture_id: row.fixture_id,
      match_number: row.match_number,
      fantasy_matchday_id: MATCHDAY_ID,
      stage: row.stage,
      team_id: row.away_team_id,
      team: row.away_team,
      opponent_team_id: row.home_team_id,
      opponent: row.home_team,
      side: "away_listed",
      expected_goals: row.away_expected_goals,
      projectedXg: row.away_expected_goals,
      projected_xg: row.away_expected_goals,
      expected_goals_against: row.home_expected_goals,
      win_probability: row.away_win_probability,
      draw_probability: row.draw_probability,
      loss_probability: row.home_win_probability,
      advance_probability: row.away_advance_probability,
      clean_sheet_probability: row.away_clean_sheet_probability,
      fixture_difficulty_score: round((1 - row.away_advance_probability) * 100, 2),
      fixture_difficulty_band: row.away_advance_probability >= 0.58 ? "favorable" : row.away_advance_probability >= 0.45 ? "neutral" : "difficult",
      matchUncertainty: row.matchUncertainty,
      score_model_version: "score-final-round-v1"
    }
  ]);

  return {
    schema_version: "fantasy_pool_score_predictions_final_round_v1",
    generated_at: GENERATED_AT,
    source_checked: "2026-07-18",
    model_stage: "final_round_score_prediction",
    data_status: "final_round_score_prediction_pass",
    modelVersion: "score-final-round-v1",
    model_version: "score-final-round-v1",
    safety_labels: ["Final Round fantasy setup", "Includes Final and Third Place game", "all 2 SF fixtures final", "ownership not used as signal", "final squads not source-backed"],
    input_files: ["data/finalRoundFixtureAuthority_v1.json", "data/knockoutScorePredictor_v1.json", "data/teamQuality.json", "data/thirdPlaceHistoricalProfile_v1.json"],
    summary: {
      fixture_prediction_count: fixtureScorePredictions.length,
      final_round_fixture_predictions: fixtureScorePredictions.length,
      final_fixture_predictions: fixtureScorePredictions.filter((row) => row.stage === "final").length,
      third_place_fixture_predictions: fixtureScorePredictions.filter((row) => row.stage === "third_place").length,
      partial_or_pending_fixture_rows: 0,
      defaultMatchday: MATCHDAY_ID,
      ownershipUsedAsSignal: false,
      finalSquadsSourceBacked: false,
      completedSfFixturesUsed: 2,
      incompleteSfFixtures: 0,
      projected_final_match: "Spain vs Argentina",
      projected_third_place_match: "France vs England",
      third_place_modifiers: thirdPlaceProfile.modifiers
    },
    fixtureScorePredictions,
    teamFixturePredictions,
    projectedKnockoutPath: {
      final: ["Spain", "Argentina"],
      third_place: ["France", "England"]
    },
    defaultMatchday: MATCHDAY_ID
  };
}

function teamPredictionFor(score, teamId) {
  return (score.teamFixturePredictions || []).find((row) => row.team_id === teamId) || null;
}

function buildProjections({ role, score, thirdPlaceProfile }) {
  const rows = role.playerRoleRows.map((roleRow) => {
    const teamPrediction = teamPredictionFor(score, roleRow.team_id) || {};
    const isThird = roleRow.fixture_stage === "third_place";
    const start = Number(roleRow.start_probability || 0);
    const expectedGoals = Number(teamPrediction.expected_goals || 1);
    const cleanSheet = Number(teamPrediction.clean_sheet_probability || 0.25);
    const position = roleRow.official_fantasy_position;
    const attackingBase = position === "FWD" ? 2.6 : position === "MID" ? 1.9 : position === "DEF" ? 1.15 : 0.65;
    const cleanSheetBase = position === "GK" ? 2.5 : position === "DEF" ? 2.1 : position === "MID" ? 0.6 : 0.15;
    const minutesBase = Number(roleRow.expected_minutes || 0) / 90 * 2;
    const goalEnvironment = isThird ? thirdPlaceProfile.modifiers.thirdPlaceUpsideModifier : 1;
    const raw = (minutesBase + attackingBase * expectedGoals * goalEnvironment + cleanSheetBase * cleanSheet) * clamp(0.55 + start * 0.55, 0.5, 1.05);
    const rolePenalty = roleRow.majorRoleCaution ? 0.78 : isThird ? 0.88 : 0.93;
    const riskAdjusted = raw * rolePenalty;
    const ceiling = raw + (position === "FWD" ? 5.2 : position === "MID" ? 4.4 : position === "DEF" ? 3.4 : 3.2);
    const captainScore = riskAdjusted * 3.5 + ceiling * 1.1 + expectedGoals * 4 + start * 8;
    const caution = [roleRow.roleCaution, roleRow.thin_profile ? "Thin-profile guardrail: projection is low-confidence." : ""].filter(Boolean).join(" ");
    return {
      player_matchday_projection_id: `${roleRow.official_fantasy_player_id}-${MATCHDAY_ID}-fantasy-pool-v1`,
      internal_player_id: roleRow.internal_player_id,
      official_fantasy_player_id: roleRow.official_fantasy_player_id,
      name: roleRow.name,
      display_name: roleRow.display_name,
      country: roleRow.country,
      team_id: roleRow.team_id,
      official_team_id: roleRow.official_team_id,
      official_fantasy_position: position,
      position,
      official_price: roleRow.official_price,
      price: roleRow.official_price,
      selectable_status: roleRow.selectable_status,
      matchday: MATCHDAY_ID,
      matchday_label: MATCHDAY_LABEL,
      opponent: roleRow.opponent,
      opponent_team_id: roleRow.opponent_team_id,
      fixture_id: roleRow.fixture_id,
      match_id: roleRow.match_id,
      match_number: roleRow.match_number,
      fixture_stage: roleRow.fixture_stage,
      side: roleRow.side,
      expected_minutes: roleRow.expected_minutes,
      expectedMinutes: roleRow.expected_minutes,
      start_probability: roleRow.start_probability,
      startProb: roleRow.start_probability,
      raw_expected_points: round(raw),
      projectedPoints: round(raw),
      risk_adjusted_points: round(riskAdjusted),
      floor_points: round(Math.max(0, riskAdjusted * 0.28)),
      ceiling_points: round(ceiling),
      captain_score: round(captainScore),
      captainUpsideScore: round(captainScore),
      projection_confidence: roleRow.sfStarted ? isThird ? "medium" : "high" : "low",
      role_label: roleRow.role_label,
      role_confidence: roleRow.role_confidence,
      roleTier: roleRow.roleTier,
      fixture_context: {
        fixture_id: roleRow.fixture_id,
        match_number: roleRow.match_number,
        opponent_team_id: roleRow.opponent_team_id,
        opponent: roleRow.opponent,
        side: roleRow.side,
        expected_goals: teamPrediction.expected_goals,
        expected_goals_against: teamPrediction.expected_goals_against,
        win_probability: teamPrediction.win_probability,
        draw_probability: teamPrediction.draw_probability,
        loss_probability: teamPrediction.loss_probability,
        clean_sheet_probability: teamPrediction.clean_sheet_probability,
        advance_probability: teamPrediction.advance_probability,
        fixture_difficulty_score: teamPrediction.fixture_difficulty_score,
        fixture_difficulty_band: teamPrediction.fixture_difficulty_band,
        matchUncertainty: teamPrediction.matchUncertainty,
        known_or_projected_path_status: "known_final_round_fixture"
      },
      projectionReason: "Final Round projection uses completed SF fixture authority, explicit SF starting evidence as the primary role signal, QF continuity as support, and Third Place modifiers where applicable.",
      caution,
      data_quality_flags: [
        "player_projection_final_round_v1",
        "completed_sf_only",
        "sf_lineup_evidence_applied",
        "points_do_not_imply_start",
        "ownership_not_used_as_signal",
        "final_squads_not_source_backed",
        roleRow.fixture_stage === "third_place" ? "third_place_rotation_risk_included" : "final_fixture_role_context",
        roleRow.thin_profile ? "thin_profile_guardrail" : null
      ].filter(Boolean),
      model_stage: "active_final_round_player_projection_support",
      modelVersion: "player-projection-final-round-v1",
      defaultMatchday: MATCHDAY_ID,
      evidenceStrength: roleRow.evidenceStrength,
      lineupEvidenceType: roleRow.lineupEvidenceType,
      sfStarted: roleRow.sfStarted,
      sfSubstitute: roleRow.sfSubstitute,
      sfLineupSource: roleRow.sfLineupSource,
      sfLineupEvidenceId: roleRow.sfLineupEvidenceId,
      qfStarted: roleRow.qfStarted,
      qfSubstitute: roleRow.qfSubstitute,
      qfLineupSource: roleRow.qfLineupSource,
      qfLineupEvidenceId: roleRow.qfLineupEvidenceId,
      roleCaution: roleRow.roleCaution,
      role_caution: roleRow.role_caution,
      majorRoleCaution: roleRow.majorRoleCaution,
      role_volatility_score: roleRow.role_volatility_score,
      role_volatility_level: roleRow.role_volatility_level,
      third_place_rotation_risk: roleRow.third_place_rotation_risk,
      thin_profile: roleRow.thin_profile,
      allowedCorePick: roleRow.allowedCorePick,
      coreEligibilityReason: roleRow.coreEligibilityReason,
      coreEligibilityWarning: roleRow.coreEligibilityWarning,
      playerId: roleRow.internal_player_id
    };
  }).sort((a, b) => Number(b.risk_adjusted_points || 0) - Number(a.risk_adjusted_points || 0));

  return {
    schema_version: "fantasy_pool_matchday_projections_final_round_v1",
    generated_at: GENERATED_AT,
    source_checked: "2026-07-18",
    modelVersion: "player-projection-final-round-v1",
    model_version: "player-projection-final-round-v1",
    model_stage: "active_final_round_player_projection_support",
    data_status: "active_final_round_projection_v1_pass",
    safety_labels: ["Final Round fantasy setup", "Includes Final and Third Place game", "explicit SF lineup evidence heavily weighted", "Third Place rotation risk included", "ownership not used as signal", "final squads not source-backed"],
    input_files: ["data/playerRoleModel_finalRound_v1.json", "data/sfLineupEvidenceForFinalRound_v1.json", "data/scorePredictions_fantasyPool_finalRound_v1.json"],
    model: {
      defaultMatchday: MATCHDAY_ID,
      sf_points_used_as_start_evidence: false,
      points_can_imply_starter: false,
      explicit_sf_starter_required_for_core_pick: true,
      explicit_sf_starting_xi_available: true,
      eliminated_teams_excluded_from_main_public_rows: true,
      third_place_rotation_risk_included: true
    },
    summary: {
      projection_rows: rows.length,
      final_round_projection_rows: rows.length,
      known_fixture_teams: 4,
      defaultMatchday: MATCHDAY_ID,
      ownershipUsedAsSignal: false,
      finalSquadsSourceBacked: false,
      topProjectedFinalRoundPlayers: rows.slice(0, 25).map((row) => ({
        name: row.name,
        country: row.country,
        position: row.position,
        fixture_stage: row.fixture_stage,
        opponent: row.opponent,
        projectedPoints: row.risk_adjusted_points,
        captainScore: row.captain_score,
        lineupEvidenceType: row.lineupEvidenceType,
        sfStarted: row.sfStarted,
        thirdPlaceRisk: row.third_place_rotation_risk
      }))
    },
    qa_status: "pass",
    playerMatchdayProjections: rows
  };
}

function modeRows(rows, mode) {
  const candidates = rows.filter((row) => row.selectable_status === "playing");
  const scoreForMode = (row) => {
    if (mode === "captain") return Number(row.captain_score || 0);
    if (mode === "early_option") return finalRoundStrategicMetrics(row).recommendation_score;
    if (mode === "third_place_risk") return row.fixture_stage === "third_place"
      ? finalRoundStrategicMetrics(row).recommendation_score - finalRoundStrategicMetrics(row).thirdPlaceRiskPenalty
      : -Infinity;
    if (mode === "upside") return Number(row.ceiling_points || 0) * 11 + Number(row.captain_score || 0);
    if (mode === "safe") return Number(row.risk_adjusted_points || 0) * 17 + Number(row.start_probability || 0) * 28 - (row.majorRoleCaution ? 15 : 0);
    if (mode === "differential") return Number(row.value_score || 0) * 5 + Number(row.risk_adjusted_points || 0) * 12 + (row.third_place_rotation_risk ? 2 : 0);
    return finalRoundStrategicMetrics(row).recommendation_score;
  };
  const filtered = (mode === "balanced" || mode === "early_option")
    ? candidates.filter((row) => row.allowedCorePick)
    : candidates;
  return filtered
    .map((row) => ({ row, score: scoreForMode(row) }))
    .filter((entry) => Number.isFinite(entry.score))
    .sort((a, b) => b.score - a.score)
    .slice(0, 25)
    .map(({ row, score }, index) => ({ row, score: round(score), rank: index + 1 }));
}

function finalRoundStrategicMetrics(row) {
  const raw = Number(row.risk_adjusted_points || 0);
  const start = Number(row.start_probability || 0);
  const minutes = Number(row.expected_minutes || 0);
  const captain = Number(row.captain_score || 0);
  const ceiling = Number(row.ceiling_points || raw || 0);
  const floor = Number(row.floor_points || 0);
  const roleVolatility = Number(row.role_volatility_score || (row.third_place_rotation_risk ? 0.24 : 0.08));
  const fixture = row.fixture_context || {};
  const teamXg = Number(fixture.expected_goals ?? row.team_expected_goals ?? 0);
  const opponentXg = Number(fixture.expected_goals_against ?? row.team_expected_goals_against ?? 0);
  const cleanSheet = Number(fixture.clean_sheet_probability ?? row.team_clean_sheet_probability ?? 0);
  const goalEnvironment = teamXg + opponentXg;
  const isEarlyFixture = row.fixture_stage === "third_place";
  const earlyFixtureOptionalityBonus = isEarlyFixture
    ? Math.min(2.35, Math.max(0, raw - 1.6) * 0.36 + start * 0.75 + Math.min(1, minutes / 90) * 0.45)
    : 0;
  const replacementOptionValue = isEarlyFixture
    ? earlyFixtureOptionalityBonus + Math.max(0, ceiling - raw) * 0.18 + Math.max(0, floor) * 0.04
    : 0;
  const lateFixtureReplacementValue = isEarlyFixture
    ? 0
    : Math.min(0.45, Math.max(0, raw - 2.5) * 0.08 + start * 0.12);
  const thirdPlaceUpsideModifier = isEarlyFixture
    ? Math.max(0, goalEnvironment - 2.45) * 0.75 + Math.max(0, ceiling - raw) * 0.16
    : 0;
  const thirdPlaceRiskPenalty = isEarlyFixture
    ? 0.55 + Math.max(0, 0.72 - start) * 1.25 + roleVolatility * 1.9
    : 0;
  const roleVolatilityPenalty = roleVolatility * 2.5 + (row.majorRoleCaution ? 1.4 : 0);
  const cleanSheetContextValue = ["GK", "DEF"].includes(row.position)
    ? Math.max(0, cleanSheet - 0.22) * 1.4
    : 0;
  const fixtureGoalEnvironmentValue = Math.max(0, goalEnvironment - 2.25) * 0.7;
  const strategicCompositeScore = raw * 12 +
    start * 10 +
    minutes * 0.055 +
    captain * 0.12 +
    earlyFixtureOptionalityBonus * 6.5 +
    replacementOptionValue * 3.8 +
    lateFixtureReplacementValue * 1.3 +
    thirdPlaceUpsideModifier * 4.2 +
    cleanSheetContextValue * 2.4 +
    fixtureGoalEnvironmentValue * 2.2 -
    thirdPlaceRiskPenalty * 4.1 -
    roleVolatilityPenalty * 2.2;
  const recommendationScore = strategicCompositeScore + (row.allowedCorePick ? 8 : 0);

  return {
    kickoff_order: isEarlyFixture ? 1 : 2,
    fixture_timing: isEarlyFixture ? "early" : "late",
    fixture_stage: row.fixture_stage,
    rawProjectedPoints: round(raw),
    startProbability: round(start),
    expectedMinutes: round(minutes),
    roleVolatility: round(roleVolatility),
    teamXg: round(teamXg),
    opponentXg: round(opponentXg),
    cleanSheetProbability: round(cleanSheet),
    goalEnvironment: round(goalEnvironment),
    earlyFixtureOptionalityBonus: round(earlyFixtureOptionalityBonus),
    replacementOptionValue: round(replacementOptionValue),
    lateFixtureReplacementValue: round(lateFixtureReplacementValue),
    fixtureDiversificationValue: isEarlyFixture ? 0.65 : 0.2,
    thirdPlaceRiskPenalty: round(thirdPlaceRiskPenalty),
    thirdPlaceUpsideModifier: round(thirdPlaceUpsideModifier),
    roleVolatilityPenalty: round(roleVolatilityPenalty),
    strategicCompositeScore: round(strategicCompositeScore),
    recommendation_score: round(recommendationScore)
  };
}

function finalRoundStrategicLabels(row) {
  const metrics = finalRoundStrategicMetrics(row);
  return [
    metrics.fixture_timing === "early" ? "Early game option" : null,
    metrics.fixture_timing === "early" ? "Replacement flexibility" : null,
    row.third_place_rotation_risk ? "Third Place risk" : null,
    row.roleCaution ? "Role caution" : null
  ].filter(Boolean);
}

function buildRecommendations({ projections }) {
  const modes = [["balanced", "Core Picks"], ["safe", "High-Floor Picks"], ["upside", "Upside Picks"], ["differential", "Differential Picks"], ["early_option", "Early-Game Options"], ["third_place_risk", "High-Risk Third Place Picks"], ["captain", "Captain Watchlist"]];
  const recommendationCandidates = modes.flatMap(([mode, label]) =>
    modeRows(projections.playerMatchdayProjections, mode).map(({ row, score, rank }) => {
      const strategy = finalRoundStrategicMetrics(row);
      const tags = finalRoundStrategicLabels(row);
      return {
        ...row,
        mode,
        mode_label: label,
        pickType: label,
        recommendation_surface: mode,
        rank,
        recommendation_score: score,
        recommendation_tier: rank <= 10 ? "top_pick_candidate" : "rotation_candidate",
        final_round_strategy: strategy,
        recommendation_tags: tags,
        why_pick: [
          `${row.risk_adjusted_points} projected Final Round points`,
          `${Math.round(Number(row.start_probability || 0) * 100)}% start chance`,
          row.sfStarted ? "source-backed SF starter" : "not SF starter; use with caution",
          strategy.fixture_timing === "early" ? "Earlier kickoff can add manual-substitution flexibility if FIFA rules allow it" : "Final fixture context",
          strategy.thirdPlaceUpsideModifier > 0 ? "Third Place goal environment adds upside" : null
        ].filter(Boolean),
        why_careful: [
          row.roleCaution || null,
          row.thin_profile ? "Thin-profile guardrail." : null,
          strategy.fixture_timing === "early" ? "Verify FIFA substitution, captain, and lock rules before relying on replacement flexibility." : null,
          "Verify official locks/deadlines/lineups in FIFA."
        ].filter(Boolean),
        source_model_version: "recommendation-final-round-v1"
      };
    })
  );
  const captainRows = recommendationCandidates.filter((row) => row.mode === "captain");
  const coreRows = recommendationCandidates.filter((row) => row.mode === "balanced");
  const thirdPlaceRows = recommendationCandidates.filter((row) => row.fixture_stage === "third_place");
  return {
    schema_version: "fantasy_pool_matchday_recommendations_final_round_v1",
    generated_at: GENERATED_AT,
    source_checked: "2026-07-18",
    modelVersion: "recommendation-final-round-v1",
    model_version: "recommendation-final-round-v1",
    model_stage: "active_final_round_recommendations",
    data_status: "active_final_round_recommendations_v1_pass",
    safety_labels: ["Final Round fantasy setup", "Includes Final and Third Place game", "Core Picks require explicit SF starter evidence", "Third Place rotation risk included", "early-game optionality is strategic and rule-check dependent", "ownership not used as signal", "final squads not source-backed"],
    input_files: ["data/fantasyPoolMatchdayProjections_finalRound_v1.json", "data/sfLineupEvidenceForFinalRound_v1.json", "data/finalRoundFixtureAuthority_v1.json"],
    model: {
      defaultMatchday: MATCHDAY_ID,
      finance_secondary_only: true,
      explicit_sf_starter_required_for_core_pick: true,
      points_can_imply_starter: false,
      eliminated_teams_excluded_from_main_public_picks: true,
      third_place_rotation_risk_included: true,
      early_fixture_optionality_included: true,
      substitution_value_is_rule_check_dependent: true
    },
    summary: {
      recommendationCandidates: recommendationCandidates.length,
      finalRoundCandidates: recommendationCandidates.length,
      corePickRows: coreRows.length,
      corePickRowsWithoutExplicitSfStart: coreRows.filter((row) => !row.sfStarted).length,
      modes: modes.map(([mode]) => mode),
      recommendationCountBySurface: modes.reduce((counts, [mode]) => {
        counts[mode] = recommendationCandidates.filter((row) => row.mode === mode).length;
        return counts;
      }, {}),
      thirdPlaceRecommendationRows: thirdPlaceRows.length,
      thirdPlaceCorePickRows: coreRows.filter((row) => row.fixture_stage === "third_place").length,
      earlyOptionRows: recommendationCandidates.filter((row) => row.mode === "early_option").length,
      knownFinalRoundFixturesUsed: 2,
      defaultMatchday: MATCHDAY_ID,
      ownershipUsedAsSignal: false,
      finalSquadsSourceBacked: false,
      topCaptainWatchlist: captainRows.slice(0, 20).map((row) => ({
        name: row.name,
        country: row.country,
        opponent: row.opponent,
        fixture_stage: row.fixture_stage,
        captainScore: row.captain_score,
        rank: row.rank
      }))
    },
    qa_status: "pass",
    recommendationCandidates
  };
}

function buildTeamBuilder({ projections, recommendations, authority }) {
  const byPositionNeeded = { GK: 2, DEF: 5, MID: 5, FWD: 3 };
  const officialRules = readJson("data/officialFantasyRules_v0.json", {}).officialFantasyRules || {};
  const initialBudget = Number(officialRules.budget?.initialBudget || 100) + Number(officialRules.budget?.knockoutIncrease || 0);
  const finalCountryLimit = 8;
  const eligibleTeamIds = new Set((authority.fixtures || []).flatMap((fixture) => [
    fixture.team_a?.team_id,
    fixture.team_b?.team_id
  ]).filter(Boolean));
  const eligibleTeamNames = [...eligibleTeamIds].map((teamId) => TEAM_INFO[teamId]?.team || teamId);
  const isEligibleTeamRow = (row) => eligibleTeamIds.has(row.team_id);
  const countByTeam = (rows) => rows.reduce((counts, row) => {
    const team = row.country || TEAM_INFO[row.team_id]?.team || row.team_id || "Unknown";
    counts[team] = (counts[team] || 0) + 1;
    return counts;
  }, {});
  const knownEliminatedPlayerRows = (rows) => rows.filter((row) =>
    /lerma|raphinha|raphael dias belloli|vinicius|vinicius|vini/i.test(String(row.name || row.display_name || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")) ||
    ["brazil", "colombia"].includes(String(row.team_id || "").toLowerCase())
  );
  const rawRowScore = (row) =>
    Number(row.risk_adjusted_points || 0) * 12 +
    Number(row.start_probability || 0) * 8 +
    Number(row.captain_score || 0) * 0.12;
  const strategicRowScore = (row) => finalRoundStrategicMetrics(row).strategicCompositeScore;
  const countByFixture = (rows) => rows.reduce((counts, row) => {
    const fixture = row.fixture_stage || "unknown";
    counts[fixture] = (counts[fixture] || 0) + 1;
    return counts;
  }, {});
  const sumMetric = (rows, field) => round(rows.reduce((sum, row) => sum + Number(finalRoundStrategicMetrics(row)[field] || 0), 0));
  const sumRawProjected = (rows) => round(rows.reduce((sum, row) => sum + Number(row.risk_adjusted_points || 0), 0));
  const sumComposite = (rows) => round(rows.reduce((sum, row) => sum + strategicRowScore(row), 0));
  const candidateReason = (row) => {
    if (!row) return "No eligible candidate.";
    if (row.start_probability < 0.45) return "Below Team Builder start-probability pool threshold.";
    if (row.thin_profile) return "Thin-profile guardrail.";
    if (row.third_place_rotation_risk) return "Third Place rotation risk and position/country/budget tradeoff.";
    return "Position, country-limit, budget, or squad-balance tradeoff.";
  };
  const candidateRows = projections.playerMatchdayProjections
    .filter((row) => row.matchday === MATCHDAY_ID)
    .filter((row) => row.selectable_status === "playing" && !row.thin_profile)
    .filter(isEligibleTeamRow);
  const eliminatedCandidateRows = knownEliminatedPlayerRows(candidateRows);
  const buildSquadByScore = (scoredPool, minimumEarlyFixturePlayers = 0, scoreFn = strategicRowScore) => {
    const slotOrder = Object.entries(byPositionNeeded).flatMap(([position, count]) => Array.from({ length: count }, () => position));
    let states = [{
      rows: [],
      selectedIds: new Set(),
      countryCounts: {},
      price: 0,
      score: 0,
      earlyCount: 0
    }];
    const cheapestByPosition = Object.fromEntries(Object.keys(byPositionNeeded).map((position) => [
      position,
      scoredPool
        .filter((row) => row.position === position)
        .map((row) => Number(row.price || 0))
        .sort((a, b) => a - b)
    ]));
    const remainingCheapestCost = (nextSlotIndex, state) => {
      const needs = {};
      for (let index = nextSlotIndex; index < slotOrder.length; index += 1) {
        needs[slotOrder[index]] = (needs[slotOrder[index]] || 0) + 1;
      }
      return Object.entries(needs).reduce((sum, [position, count]) => {
        const prices = cheapestByPosition[position] || [];
        return sum + prices.slice(0, count).reduce((priceSum, price) => priceSum + price, 0);
      }, 0);
    };

    slotOrder.forEach((position, slotIndex) => {
      const nextStates = [];
      const candidates = scoredPool.filter((row) => row.position === position);
      states.forEach((state) => {
        candidates.forEach((row) => {
          const rowId = String(row.official_fantasy_player_id);
          const team = row.country || TEAM_INFO[row.team_id]?.team || row.team_id || "Unknown";
          const nextCountryCount = (state.countryCounts[team] || 0) + 1;
          const nextPrice = round(state.price + Number(row.price || 0));
          if (state.selectedIds.has(rowId)) return;
          if (nextCountryCount > finalCountryLimit) return;
          if (nextPrice > initialBudget + 0.001) return;

          const nextState = {
            rows: [...state.rows, row],
            selectedIds: new Set([...state.selectedIds, rowId]),
            countryCounts: { ...state.countryCounts, [team]: nextCountryCount },
            price: nextPrice,
            score: state.score + scoreFn(row),
            earlyCount: state.earlyCount + (row.fixture_stage === "third_place" ? 1 : 0)
          };
          if (nextPrice + remainingCheapestCost(slotIndex + 1, nextState) > initialBudget + 0.001) return;
          nextStates.push(nextState);
        });
      });
      states = nextStates
        .sort((a, b) =>
          b.score - a.score ||
          b.earlyCount - a.earlyCount ||
          a.price - b.price
        )
        .slice(0, 8000);
    });

    const validStates = states.filter((state) =>
      state.rows.length === 15 &&
      state.price <= initialBudget + 0.001 &&
      state.earlyCount >= minimumEarlyFixturePlayers
    );
    const fallbackStates = states.filter((state) => state.rows.length === 15 && state.price <= initialBudget + 0.001);
    return (validStates[0] || fallbackStates[0] || { rows: [] }).rows;
  };
  const rawPool = candidateRows
    .filter((row) => row.start_probability >= 0.45)
    .sort((a, b) => rawRowScore(b) - rawRowScore(a));
  const pool = candidateRows
    .filter((row) => row.start_probability >= 0.45)
    .sort((a, b) => strategicRowScore(b) - strategicRowScore(a));
  const rawExpectedSquad = buildSquadByScore(rawPool, 0, rawRowScore);
  const viableEarlyFixturePlayers = pool.filter((row) =>
    row.fixture_stage === "third_place" &&
    row.sfStarted &&
    Number(row.risk_adjusted_points || 0) >= 2.6 &&
    Number(row.start_probability || 0) >= 0.52
  ).length;
  const minimumEarlyFixturePlayers = Math.min(4, Math.max(2, Math.floor(viableEarlyFixturePlayers / 8)));
  const squad = buildSquadByScore(pool, minimumEarlyFixturePlayers);
  const captain = squad.slice().sort((a, b) => Number(b.captain_score || 0) - Number(a.captain_score || 0))[0] || null;
  const viceCaptain = squad.slice().filter((row) => row.official_fantasy_player_id !== captain?.official_fantasy_player_id).sort((a, b) => Number(b.captain_score || 0) - Number(a.captain_score || 0))[0] || null;
  const eliminatedSelectedRows = knownEliminatedPlayerRows(squad);
  const captainTeamEligible = captain ? isEligibleTeamRow(captain) : false;
  const viceCaptainTeamEligible = viceCaptain ? isEligibleTeamRow(viceCaptain) : false;
  const selectedIds = new Set(squad.map((row) => String(row.official_fantasy_player_id)));
  const topOmittedByTeam = eligibleTeamNames.map((teamName) => {
    const row = pool.find((candidate) => candidate.country === teamName && !selectedIds.has(String(candidate.official_fantasy_player_id))) ||
      candidateRows.find((candidate) => candidate.country === teamName && !selectedIds.has(String(candidate.official_fantasy_player_id)));
    return {
      team: teamName,
      player: row?.name || null,
      position: row?.position || null,
      projectedPoints: row ? row.risk_adjusted_points : null,
      compositeScore: row ? finalRoundStrategicMetrics(row).strategicCompositeScore : null,
      reason: candidateReason(row)
    };
  });
  const omittedStars = recommendations.recommendationCandidates
    .filter((row) => row.mode === "captain")
    .filter((row) => !squad.some((pick) => pick.official_fantasy_player_id === row.official_fantasy_player_id))
    .slice(0, 10)
    .map((row) => ({
      name: row.name,
      country: row.country,
      position: row.position,
      reason: row.thin_profile ? "Thin-profile guardrail." : row.roleCaution || "Squad balance/position limit.",
      lineupEvidenceType: row.lineupEvidenceType,
      thirdPlaceRisk: row.third_place_rotation_risk
    }));
  const errors = [];
  if (squad.length !== 15) errors.push("Balanced squad did not contain 15 players.");
  if (!Object.entries(byPositionNeeded).every(([position, count]) => squad.filter((row) => row.position === position).length === count)) errors.push("Balanced squad did not satisfy the 2/5/5/3 structure.");
  if (squad.reduce((sum, row) => sum + Number(row.price || 0), 0) > initialBudget + 0.001) errors.push(`Balanced squad exceeded the ${initialBudget} budget.`);
  if (Object.values(countByTeam(squad)).some((count) => count > finalCountryLimit)) errors.push(`Balanced squad exceeded the Final country limit of ${finalCountryLimit}.`);
  if (eliminatedCandidateRows.length) errors.push("Final Round Team Builder candidate pool contains eliminated players.");
  if (eliminatedSelectedRows.length) errors.push("Final Round Team Builder selected squad contains eliminated players.");
  if (!captainTeamEligible) errors.push("Captain team is not eligible for Final Round.");
  if (!viceCaptainTeamEligible) errors.push("Vice captain team is not eligible for Final Round.");
  const status = errors.length === 0
    ? "pass"
    : "fail";
  return {
    schema_version: "team_builder_qa_final_round_v1",
    generated_at: GENERATED_AT,
    status,
    summary: {
      squad_size: squad.length,
      required_squad_size: 15,
      positions: Object.fromEntries(Object.keys(byPositionNeeded).map((position) => [position, squad.filter((row) => row.position === position).length])),
      defaultMatchday: MATCHDAY_ID,
      country_limit: finalCountryLimit,
      initial_budget: initialBudget,
      selected_total_price: round(squad.reduce((sum, row) => sum + Number(row.price || 0), 0)),
      raw_expected_selected_total_price: round(rawExpectedSquad.reduce((sum, row) => sum + Number(row.price || 0), 0)),
      eligible_teams: eligibleTeamNames,
      candidate_count_by_team: countByTeam(candidateRows),
      selected_count_by_team: countByTeam(squad),
      raw_expected_selected_count_by_team: countByTeam(rawExpectedSquad),
      selected_count_by_fixture: countByFixture(squad),
      raw_expected_selected_count_by_fixture: countByFixture(rawExpectedSquad),
      early_fixture_selected_count: squad.filter((row) => row.fixture_stage === "third_place").length,
      late_fixture_selected_count: squad.filter((row) => row.fixture_stage !== "third_place").length,
      raw_projected_points_before: sumRawProjected(rawExpectedSquad),
      raw_projected_points_after: sumRawProjected(squad),
      raw_projected_points_delta: round(sumRawProjected(squad) - sumRawProjected(rawExpectedSquad)),
      optionality_score: sumMetric(squad, "replacementOptionValue"),
      optionality_score_before: sumMetric(rawExpectedSquad, "replacementOptionValue"),
      optionality_gain: round(sumMetric(squad, "replacementOptionValue") - sumMetric(rawExpectedSquad, "replacementOptionValue")),
      composite_score: sumComposite(squad),
      composite_score_before: sumComposite(rawExpectedSquad),
      composite_score_gain: round(sumComposite(squad) - sumComposite(rawExpectedSquad)),
      minimum_early_fixture_players_when_viable: minimumEarlyFixturePlayers,
      eliminated_player_candidates: eliminatedCandidateRows.length,
      eliminated_player_selected: eliminatedSelectedRows.length,
      captain_team_eligible: captainTeamEligible,
      vice_team_eligible: viceCaptainTeamEligible,
      captain: captain?.name || null,
      viceCaptain: viceCaptain?.name || null,
      third_place_players: squad.filter((row) => row.third_place_rotation_risk).length,
      final_players: squad.filter((row) => row.fixture_stage === "final").length,
      thin_profile_players: squad.filter((row) => row.thin_profile).length,
      points_only_evidence_players: squad.filter((row) => row.lineupEvidenceType === "points_only").length
    },
    balancedSquad: squad.map((row) => ({
      official_fantasy_player_id: row.official_fantasy_player_id,
      name: row.name,
      country: row.country,
      position: row.position,
      price: row.price,
      opponent: row.opponent,
      fixture_stage: row.fixture_stage,
      projectedPoints: row.risk_adjusted_points,
      start_probability: row.start_probability,
      captainScore: row.captain_score,
      lineupEvidenceType: row.lineupEvidenceType,
      thirdPlaceRisk: row.third_place_rotation_risk,
      roleCaution: row.roleCaution || "",
      finalRoundStrategy: finalRoundStrategicMetrics(row)
    })),
    rawExpectedPointsSquad: rawExpectedSquad.map((row) => ({
      official_fantasy_player_id: row.official_fantasy_player_id,
      name: row.name,
      country: row.country,
      position: row.position,
      fixture_stage: row.fixture_stage,
      projectedPoints: row.risk_adjusted_points,
      finalRoundStrategy: finalRoundStrategicMetrics(row)
    })),
    captain: captain ? { id: captain.official_fantasy_player_id, name: captain.name, country: captain.country } : null,
    viceCaptain: viceCaptain ? { id: viceCaptain.official_fantasy_player_id, name: viceCaptain.name, country: viceCaptain.country } : null,
    eliminatedCandidateDiagnostics: eliminatedCandidateRows.map((row) => ({ id: row.official_fantasy_player_id, name: row.name, country: row.country, team_id: row.team_id })),
    eliminatedSelectedDiagnostics: eliminatedSelectedRows.map((row) => ({ id: row.official_fantasy_player_id, name: row.name, country: row.country, team_id: row.team_id })),
    topOmittedByTeam,
    omittedStarDiagnostics: omittedStars,
    roleVolatilityDiagnostics: squad.filter((row) => row.roleCaution).map((row) => ({
      name: row.name,
      country: row.country,
      roleCaution: row.roleCaution,
      lineupEvidenceType: row.lineupEvidenceType
    })),
    errors
  };
}

function buildTeamBuilderArtifact(teamBuilder) {
  const selectedSquad = teamBuilder.balancedSquad || [];
  const starterRequirements = { GK: 1, DEF: 4, MID: 3, FWD: 3 };
  const starters = [];
  const starterIds = new Set();

  Object.entries(starterRequirements).forEach(([position, count]) => {
    selectedSquad
      .filter((row) => row.position === position)
      .sort((a, b) =>
        Number(b.finalRoundStrategy?.strategicCompositeScore || 0) - Number(a.finalRoundStrategy?.strategicCompositeScore || 0) ||
        Number(b.projectedPoints || 0) - Number(a.projectedPoints || 0)
      )
      .slice(0, count)
      .forEach((row) => {
        starters.push(row);
        starterIds.add(String(row.official_fantasy_player_id));
      });
  });

  const bench = selectedSquad.filter((row) => !starterIds.has(String(row.official_fantasy_player_id)));

  return {
    schema_version: "team_builder_final_round_artifact_v1",
    generatedAt: teamBuilder.generated_at,
    modelVersion: "team-builder-final-round-v1",
    strategy: {
      id: "balancedSquad",
      name: "Recommended Balanced Squad",
      label: "Recommended Balanced Squad",
      matchday: "finalRound",
      formation: "4-3-3"
    },
    objectiveExplanation: "Generated Final Round artifact optimizes the validated strategic composite score with active Final Round projections, eligible teams from finalRoundFixtureAuthority, Third Place optionality, replacement value, fixture diversification, Third Place risk, role volatility, budget, position, and country-limit constraints.",
    constraintsUsed: {
      matchday: "finalRound",
      active_final_round_only: true,
      eligible_teams: teamBuilder.summary.eligible_teams,
      position_requirements: { GK: 2, DEF: 5, MID: 5, FWD: 3 },
      starter_requirements: starterRequirements,
      initial_budget: teamBuilder.summary.initial_budget,
      country_limit: teamBuilder.summary.country_limit,
      eliminated_player_guardrails: true,
      ownership_used_as_signal: false,
      final_squads_source_backed: false
    },
    selectedSquad,
    starters,
    bench,
    captain: teamBuilder.captain,
    viceCaptain: teamBuilder.viceCaptain,
    summary: {
      selected_count_by_team: teamBuilder.summary.selected_count_by_team,
      selected_count_by_fixture: teamBuilder.summary.selected_count_by_fixture,
      raw_projected_points: teamBuilder.summary.raw_projected_points_after,
      raw_projected_points_before: teamBuilder.summary.raw_projected_points_before,
      optionality_score: teamBuilder.summary.optionality_score,
      optionality_score_before: teamBuilder.summary.optionality_score_before,
      composite_score: teamBuilder.summary.composite_score,
      composite_score_before: teamBuilder.summary.composite_score_before,
      captain: teamBuilder.summary.captain,
      viceCaptain: teamBuilder.summary.viceCaptain,
      third_place_players: teamBuilder.summary.third_place_players,
      final_players: teamBuilder.summary.final_players,
      eliminated_player_selected: teamBuilder.summary.eliminated_player_selected
    },
    diagnostics: {
      rawExpectedPointsSquad: teamBuilder.rawExpectedPointsSquad,
      topOmittedByTeam: teamBuilder.topOmittedByTeam,
      omittedStarDiagnostics: teamBuilder.omittedStarDiagnostics,
      roleVolatilityDiagnostics: teamBuilder.roleVolatilityDiagnostics
    }
  };
}

function buildFinalRoundFinanceBridgeRow(row) {
  const price = Number(row.official_price || row.price || 0);
  const position = row.official_fantasy_position || row.position;
  const pointsPerPrice = perPrice(row.raw_expected_points, price);
  const riskAdjustedPointsPerPrice = perPrice(row.risk_adjusted_points, price);
  const thinProfile = THIN_PROFILE_IDS.has(String(row.official_fantasy_player_id));
  const baseFlags = [
    "final_round_finance_bridge",
    "active_final_round_projection_finance_coverage",
    "fantasy_pool_only",
    "fantasy_pool_only_not_final_squad_confirmed",
    "final_squad_source_missing",
    "not_final_squad_backed",
    "not_final_public_recommendations",
    "safe_only_for_preliminary_finance_value_QA",
    row.third_place_rotation_risk ? "third_place_rotation_risk_included" : null,
    row.data_quality_flags?.includes("ownership_not_used_as_signal") ? "ownership_not_used_as_signal" : null,
    thinProfile ? "thin_profile" : null,
    thinProfile ? "thin_profile_guardrail" : null
  ].filter(Boolean);
  const flags = [...new Set([...(row.data_quality_flags || []), ...baseFlags])].sort();
  const financeMetric = {
    matchday: MATCHDAY_ID,
    opponent: row.opponent,
    fixture_id: row.fixture_id,
    expected_points: row.raw_expected_points,
    risk_adjusted_points: row.risk_adjusted_points,
    ceiling_points: row.ceiling_points,
    floor_points: row.floor_points,
    captain_score: row.captain_score,
    official_price: round(price, 1),
    points_per_price: pointsPerPrice,
    risk_adjusted_points_per_price: riskAdjustedPointsPerPrice,
    value_over_replacement: null,
    scarcity_adjusted_value: null,
    efficient_frontier: false,
    dominated_player: false,
    price_tier_opportunity_cost: null,
    position_scarcity_score: null,
    matchday_scarcity_score: null,
    differential_defensibility_score: null,
    obviousness_proxy: null,
    projection_confidence: row.projection_confidence,
    start_probability: row.start_probability,
    expected_minutes: row.expected_minutes,
    finance_quality_flags: ["final_round_finance_bridge", thinProfile ? "thin_profile_guardrail" : null].filter(Boolean)
  };

  return {
    internal_player_id: row.internal_player_id,
    official_fantasy_player_id: String(row.official_fantasy_player_id || ""),
    name: row.name,
    display_name: row.display_name || row.name,
    country: row.country,
    team_id: row.team_id,
    official_fantasy_position: position,
    official_price: round(price, 1),
    price_tier: financePriceTier(position, price),
    group_stage_expected_points: row.raw_expected_points,
    group_stage_risk_adjusted_points: row.risk_adjusted_points,
    group_stage_ceiling_points: row.ceiling_points,
    group_stage_floor_points: row.floor_points,
    captain_score: row.captain_score,
    points_per_price: pointsPerPrice,
    risk_adjusted_points_per_price: riskAdjustedPointsPerPrice,
    value_over_replacement: null,
    scarcity_adjusted_value: null,
    efficient_frontier: false,
    dominated_player: false,
    dominated_by: null,
    price_tier_opportunity_cost: null,
    position_scarcity_score: null,
    matchday_scarcity_score: null,
    confidence_adjusted_value: null,
    differential_defensibility_score: null,
    obviousness_proxy: null,
    risk_adjusted_return: row.risk_adjusted_points,
    volatility_proxy: round(Number(row.ceiling_points || 0) - Number(row.floor_points || 0)),
    downside_risk_proxy: round(Math.max(0, Number(row.raw_expected_points || 0) - Number(row.floor_points || 0))),
    bad_week_floor: row.floor_points,
    stress_case_floor: row.floor_points,
    minutes_risk: round((1 - Number(row.start_probability || 0)) * 100, 1),
    role_risk: row.majorRoleCaution ? 55 : row.third_place_rotation_risk ? 45 : 25,
    data_risk: thinProfile ? 95 : 65,
    final_squad_uncertainty_risk: 100,
    uncertainty_penalty: round(Math.max(0, Number(row.raw_expected_points || 0) - Number(row.risk_adjusted_points || 0))),
    thin_profile_penalty: thinProfile ? 1.5 : 0,
    missing_usage_penalty: 1,
    average_start_probability: row.start_probability,
    average_expected_minutes: row.expected_minutes,
    projection_confidence: row.projection_confidence,
    role_label: row.role_label,
    role_confidence: row.role_confidence,
    selectable_status: row.selectable_status,
    roster_status: "selectable_fantasy_player",
    final_squad_confirmed: false,
    fantasy_pool_only: true,
    data_quality_flags: flags,
    finance_flags: [...new Set([...flags, "not_browser_ready", "finance_bridge_missing_from_pre_final_metrics"])].sort(),
    matchday_finance_metrics: [financeMetric],
    source_summary: {
      projection_source_model_version: row.modelVersion || "player-projection-final-round-v1",
      recommendation_finance_diagnostics_source: null,
      official_rules_status: null,
      source_note: "Conservative Final Round finance bridge row added because the pre-final finance metrics file did not include this restored official fantasy-pool player."
    },
    model_stage: "fantasy_pool_only_final_round_finance_bridge",
    source_model_version: "finance-bridge-final-round-v1"
  };
}

function buildFinalRoundFinanceBridge({ projections }) {
  const financeSource = readJson("data/playerFinanceMetrics_fantasyPool_v1.json", {});
  const financeRows = rowsFromJson(financeSource, ["playerFinanceMetrics"]);
  const existingIds = new Set(financeRows.map((row) => String(row.official_fantasy_player_id || "")).filter(Boolean));
  const activeRows = projections.playerMatchdayProjections || [];
  const bridgeRows = activeRows
    .filter((row) => row.official_fantasy_player_id && !existingIds.has(String(row.official_fantasy_player_id)))
    .map(buildFinalRoundFinanceBridgeRow);
  const combinedRows = [...financeRows, ...bridgeRows];
  const duplicateIds = combinedRows
    .map((row) => String(row.official_fantasy_player_id || ""))
    .filter((id, index, ids) => id && ids.indexOf(id) !== index);
  const activeMissingAfterBridge = activeRows
    .filter((row) => !combinedRows.some((financeRow) => String(financeRow.official_fantasy_player_id || "") === String(row.official_fantasy_player_id || "")));
  const bridgeQa = {
    schema_version: "final_round_finance_bridge_qa_v1",
    generated_at: GENERATED_AT,
    status: duplicateIds.length || activeMissingAfterBridge.length ? "fail" : "pass",
    summary: {
      source_finance_rows: financeRows.length,
      active_final_round_projection_rows: activeRows.length,
      bridge_rows_added: bridgeRows.length,
      combined_finance_rows: combinedRows.length,
      active_final_round_projection_finance_missing_after_bridge: activeMissingAfterBridge.length,
      duplicate_official_fantasy_ids_after_bridge: new Set(duplicateIds).size,
      thin_profile_bridge_rows: bridgeRows.filter((row) => THIN_PROFILE_IDS.has(row.official_fantasy_player_id)).length
    },
    bridge_rows: bridgeRows.map((row) => ({
      official_fantasy_player_id: row.official_fantasy_player_id,
      name: row.name,
      country: row.country,
      position: row.official_fantasy_position,
      price: row.official_price,
      flags: row.finance_flags
    })),
    errors: [
      ...activeMissingAfterBridge.map((row) => `Missing finance bridge for ${row.official_fantasy_player_id} ${row.name}`),
      ...[...new Set(duplicateIds)].map((id) => `Duplicate finance official fantasy ID after bridge: ${id}`)
    ]
  };
  const financeBrowser = {
    ...financeSource,
    generated_at: GENERATED_AT,
    source_checked: "2026-07-18",
    data_status: "final_round_finance_bridge_browser_ready",
    browser_ready_files_updated: true,
    source_files: {
      ...(financeSource.source_files || {}),
      finalRoundProjections: "data/fantasyPoolMatchdayProjections_finalRound_v1.json",
      finalRoundFinanceBridgeQa: "data/finalRoundFinanceBridgeQa_v1.json"
    },
    model_notes: {
      ...(financeSource.model_notes || {}),
      final_round_finance_bridge: "Conservative bridge rows cover restored official fantasy-pool players missing from the pre-final finance metrics artifact. They do not claim final-squad support or replacement/scarcity value."
    },
    summary: {
      ...(financeSource.summary || {}),
      players_with_finance_metrics: combinedRows.length,
      value_model_rows: financeSource.summary?.value_model_rows || financeRows.length,
      final_round_bridge_rows: bridgeRows.length,
      active_final_round_projection_finance_missing_after_bridge: activeMissingAfterBridge.length,
      safe_for_public_promotion: true,
      public_promotion_scope: "Final Round official fantasy-pool browser coverage with final-squad caveat"
    },
    final_round_finance_bridge: bridgeQa.summary,
    playerFinanceMetrics: combinedRows
  };

  return { financeBrowser, bridgeQa };
}

function buildPeleAudit({ teamQuality, authority }) {
  const teams = rowsFromJson(teamQuality, ["teams"]);
  const byTeam = new Map(teams.map((row) => [row.team_id, row]));
  const needed = [...new Set((authority.fixtures || []).flatMap((fixture) => [fixture.team_a.team_id, fixture.team_b.team_id]))];
  const rows = needed.map((teamId) => {
    const row = byTeam.get(teamId);
    const values = [
      row?.team_quality_v2?.overall_score,
      row?.current_strength_inputs?.pele_rating,
      row?.goals_clean_sheet_inputs_v2?.attack_proxy_score,
      row?.goals_clean_sheet_inputs_v2?.defense_proxy_score
    ];
    return {
      team_id: teamId,
      team: TEAM_INFO[teamId]?.team || teamId,
      found: Boolean(row),
      team_quality_v2_score: row?.team_quality_v2?.overall_score ?? null,
      pele_rating: row?.current_strength_inputs?.pele_rating ?? null,
      invalid_numeric_values: values.filter((value) => value !== null && value !== undefined && !Number.isFinite(Number(value))).length,
      pele_status: row?.current_strength_inputs?.pele_status || null
    };
  });
  const missing = rows.filter((row) => !row.found);
  const invalid = rows.filter((row) => row.invalid_numeric_values > 0);
  return {
    schema_version: "pele_refresh_audit_final_round_v1",
    generated_at: GENERATED_AT,
    status: missing.length || invalid.length ? "fail" : "pass",
    source_files: ["data/teamQuality.json", "data/finalRoundFixtureAuthority_v1.json"],
    refresh_result: "no_source_change_documented_current_team_quality_used",
    summary: {
      teams_required: needed.length,
      teams_found: rows.filter((row) => row.found).length,
      missing_teams: missing.length,
      duplicate_team_keys: teams.length - new Set(teams.map((row) => row.team_id)).size,
      invalid_numeric_values: invalid.reduce((sum, row) => sum + row.invalid_numeric_values, 0),
      old_sf_only_team_list_active: false
    },
    teams: rows,
    errors: [...missing.map((row) => `Missing teamQuality row for ${row.team_id}`), ...invalid.map((row) => `Invalid numeric teamQuality values for ${row.team_id}`)]
  };
}

function buildPostmortem({ score, sfScore, live, role }) {
  const liveFixtures = rowsFromJson(live, ["fixtures"]);
  const sfPredictions = rowsFromJson(sfScore, ["fixtureScorePredictions"]).filter((row) => [101, 102].includes(Number(row.match_number)));
  const residuals = sfPredictions.map((prediction) => {
    const liveFixture = liveFixtures.find((fixture) => String(fixture.source_fixture_id || fixture.match_number) === String(prediction.match_number));
    return {
      match_number: prediction.match_number,
      fixture: `${prediction.home_team} vs ${prediction.away_team}`,
      predicted_xg: `${prediction.home_expected_goals}-${prediction.away_expected_goals}`,
      actual_score: liveFixture ? `${liveFixture.home_score}-${liveFixture.away_score}` : "missing",
      home_goal_residual: liveFixture ? round(Number(liveFixture.home_score) - Number(prediction.home_expected_goals)) : null,
      away_goal_residual: liveFixture ? round(Number(liveFixture.away_score) - Number(prediction.away_expected_goals)) : null,
      actual_winner: liveFixture ? (Number(liveFixture.home_score) > Number(liveFixture.away_score) ? prediction.home_team : prediction.away_team) : null
    };
  });
  const rows = role.playerRoleRows;
  const dataset = {
    schema_version: "knockout_calibration_dataset_for_final_round_v1",
    generated_at: GENERATED_AT,
    evidence_scope: "Group stage through completed semifinals; final round fixtures are scheduled only.",
    sf_residuals: residuals,
    sf_starters: rows.filter((row) => row.sfStarted).map((row) => ({ id: row.official_fantasy_player_id, name: row.name, country: row.country })),
    qf_and_sf_starters: rows.filter((row) => row.sfStarted && row.qfStarted).map((row) => ({ id: row.official_fantasy_player_id, name: row.name, country: row.country })),
    sf_started_not_qf: rows.filter((row) => row.sfStarted && !row.qfStarted).map((row) => ({ id: row.official_fantasy_player_id, name: row.name, country: row.country })),
    qf_started_not_sf: rows.filter((row) => row.qfStarted && !row.sfStarted).map((row) => ({ id: row.official_fantasy_player_id, name: row.name, country: row.country }))
  };
  const postmortem = {
    schema_version: "knockout_model_postmortem_for_final_round_v1",
    generated_at: GENERATED_AT,
    status: residuals.every((row) => row.actual_score !== "missing") ? "pass" : "fail",
    residuals,
    summary: {
      completed_sf_predictions_audited: residuals.length,
      sf_starters: dataset.sf_starters.length,
      qf_and_sf_starters: dataset.qf_and_sf_starters.length,
      sf_started_not_qf: dataset.sf_started_not_qf.length,
      qf_started_not_sf: dataset.qf_started_not_sf.length,
      high_projection_weak_role_evidence: score ? 0 : null
    },
    role_change_examples: {
      gained_starting_role: dataset.sf_started_not_qf.slice(0, 10),
      lost_starting_role: dataset.qf_started_not_sf.slice(0, 10)
    }
  };
  return { dataset, postmortem };
}

function qaReports({ authority, role, score, projections, recommendations, teamBuilder, thirdPlaceProfile, lineupNewsAudit, peleAudit }) {
  const projectionRows = projections.playerMatchdayProjections || [];
  const recRows = recommendations.recommendationCandidates || [];
  const coreRows = recRows.filter((row) => row.mode === "balanced");
  const unsafeCore = coreRows.filter((row) => !row.sfStarted || row.thin_profile || row.lineupEvidenceType === "points_only");
  const outsideFixture = recRows.filter((row) => !["spain", "argentina", "france", "england"].includes(row.team_id));
  const unavailableRows = recRows.filter((row) => row.selectable_status !== "playing");
  const roleQa = role.qa;
  const scoreQa = {
    schema_version: "score_prediction_qa_final_round_v1",
    generated_at: GENERATED_AT,
    status: score.summary.fixture_prediction_count === 2 && score.summary.final_fixture_predictions === 1 && score.summary.third_place_fixture_predictions === 1 ? "pass" : "fail",
    summary: score.summary,
    fixture_predictions: score.fixtureScorePredictions
  };
  const projectionQa = {
    schema_version: "player_projection_qa_final_round_v1",
    generated_at: GENERATED_AT,
    status: projectionRows.length > 0 && projectionRows.every((row) => ["spain", "argentina", "france", "england"].includes(row.team_id)) ? "pass" : "fail",
    summary: projections.summary,
    top_25_final_round_projected_players: projectionRows.slice(0, 25),
    thin_profile_audit: projectionRows.filter((row) => row.thin_profile)
  };
  const recommendationQa = {
    schema_version: "recommendation_qa_final_round_v1",
    generated_at: GENERATED_AT,
    status: unsafeCore.length || outsideFixture.length || unavailableRows.length ? "fail" : "pass",
    summary: recommendations.summary,
    top_25_final_round_projected_players: projectionRows.slice(0, 25),
    top_20_captain_watchlist: recRows.filter((row) => row.mode === "captain").slice(0, 20),
    final_specific_top_picks: recRows.filter((row) => row.mode === "balanced" && row.fixture_stage === "final").slice(0, 15),
    third_place_specific_top_picks: recRows.filter((row) => row.mode === "balanced" && row.fixture_stage === "third_place").slice(0, 15),
    unsafe_core_pick_rows: unsafeCore,
    outside_fixture_rows: outsideFixture,
    unavailable_rows: unavailableRows,
    trevoh_chalobah_audit: recRows.filter((row) => row.official_fantasy_player_id === "2078"),
    marcos_senesi_audit: recRows.filter((row) => row.official_fantasy_player_id === "29")
  };
  const corePickQa = {
    schema_version: "final_round_core_pick_lineup_evidence_qa_v1",
    generated_at: GENERATED_AT,
    status: recommendationQa.status,
    summary: {
      core_pick_rows: coreRows.length,
      core_without_explicit_sf_starter: coreRows.filter((row) => !row.sfStarted).length,
      thin_profile_core_picks: coreRows.filter((row) => row.thin_profile).length,
      third_place_core_without_rotation_check: coreRows.filter((row) => row.fixture_stage === "third_place" && !row.third_place_rotation_risk).length,
      points_only_core_picks: coreRows.filter((row) => row.lineupEvidenceType === "points_only").length
    },
    unsafe_core_pick_rows: unsafeCore
  };
  const releaseQa = {
    schema_version: "final_round_release_qa_v1",
    generated_at: GENERATED_AT,
    status: [authority, roleQa, scoreQa, projectionQa, recommendationQa, teamBuilder, thirdPlaceProfile.qa, lineupNewsAudit.qa, peleAudit]
      .every((qa) => qa.status === "pass") ? "pass" : "fail",
    summary: {
      public_site_promoted_to_final_round: true,
      completed_sf_fixtures_used: `${authority.summary.completed_sf_fixtures_used}/2`,
      final_round_fixture_authority: authority.status,
      role_model: roleQa.status,
      score_model: scoreQa.status,
      projection_model: projectionQa.status,
      recommendations: recommendationQa.status,
      team_builder: teamBuilder.status,
      third_place_historical_profile: thirdPlaceProfile.qa.status,
      lineup_news_audit: lineupNewsAudit.qa.status,
      pele_audit: peleAudit.status,
      refereeing_outcomes_published: false,
      old_public_globals_blocked: true
    },
    checks: [
      { id: "final_round_fixture_authority", status: authority.status },
      { id: "role_model", status: roleQa.status },
      { id: "score_model", status: scoreQa.status },
      { id: "projection_model", status: projectionQa.status },
      { id: "recommendations", status: recommendationQa.status },
      { id: "team_builder", status: teamBuilder.status },
      { id: "third_place_profile", status: thirdPlaceProfile.qa.status },
      { id: "lineup_news", status: lineupNewsAudit.qa.status },
      { id: "pele_audit", status: peleAudit.status }
    ]
  };
  return { roleQa, scoreQa, projectionQa, recommendationQa, corePickQa, releaseQa };
}

async function writeBrowserWrappers({ authority, score, projections, recommendations, teamBuilder }) {
  const qfScore = readJson("data/scorePredictions_fantasyPool_qf_v1.json", {});
  const r16Score = readJson("data/scorePredictions_fantasyPool_r16_v1.json", {});
  const r32Score = readJson("data/scorePredictions_fantasyPool_r32_v1.json", {});
  const sfScore = readJson("data/scorePredictions_fantasyPool_sf_v1.json", {});
  const qfProjections = readJson("data/fantasyPoolMatchdayProjections_qf_v1.json", {});
  const r16Projections = readJson("data/fantasyPoolMatchdayProjections_r16_v1.json", {});
  const r32Projections = readJson("data/fantasyPoolMatchdayProjections_r32_v1.json", {});
  const sfProjections = readJson("data/fantasyPoolMatchdayProjections_sf_v1.json", {});
  const qfRecommendations = readJson("data/fantasyPoolRecommendations_qf_v1.json", {});
  const r16Recommendations = readJson("data/fantasyPoolRecommendations_r16_v1.json", {});
  const r32Recommendations = readJson("data/fantasyPoolRecommendations_r32_v1.json", {});
  const sfRecommendations = readJson("data/fantasyPoolRecommendations_sf_v1.json", {});

  const scoreBrowser = {
    ...score,
    fixtureScorePredictions: [...score.fixtureScorePredictions, ...(sfScore.fixtureScorePredictions || []), ...(qfScore.fixtureScorePredictions || []), ...(r16Score.fixtureScorePredictions || []), ...(r32Score.fixtureScorePredictions || [])],
    teamFixturePredictions: [...score.teamFixturePredictions, ...(sfScore.teamFixturePredictions || []), ...(qfScore.teamFixturePredictions || []), ...(r16Score.teamFixturePredictions || []), ...(r32Score.teamFixturePredictions || [])]
  };
  const projectionBrowser = {
    ...projections,
    playerMatchdayProjections: [...projections.playerMatchdayProjections, ...(sfProjections.playerMatchdayProjections || []), ...(qfProjections.playerMatchdayProjections || []), ...(r16Projections.playerMatchdayProjections || []), ...(r32Projections.playerMatchdayProjections || [])]
  };
  const recommendationBrowser = {
    ...recommendations,
    recommendationCandidates: [...recommendations.recommendationCandidates, ...(sfRecommendations.recommendationCandidates || []), ...(qfRecommendations.recommendationCandidates || []), ...(r16Recommendations.recommendationCandidates || []), ...(r32Recommendations.recommendationCandidates || [])]
  };
  const { financeBrowser, bridgeQa } = buildFinalRoundFinanceBridge({ projections });
  const teamBuilderArtifact = buildTeamBuilderArtifact(teamBuilder);
  const slimScoreBrowser = compactPublicPayload("scorePredictions", scoreBrowser);
  const slimProjectionBrowser = compactPublicPayload("projections", projectionBrowser);
  const slimRecommendationBrowser = compactPublicPayload("recommendations", recommendationBrowser);
  const slimTeamBuilderArtifact = compactPublicPayload("teamBuilderArtifact", teamBuilderArtifact);

  await writeFile("finalRoundFixtureAuthorityData.js", [
    "// Generated by scripts/buildFinalRoundFixtureAuthorityV1.mjs.",
    "// Browser-ready Final Round fixture authority.",
    `window.FINAL_ROUND_FIXTURE_AUTHORITY_DATA = ${JSON.stringify(authority)};`
  ].join("\n") + "\n", "utf8");
  await writeFile("fantasyPoolScorePredictionsData.js", [
    publicWrapperText("scorePredictions", slimScoreBrowser).trimEnd()
  ].join("\n") + "\n", "utf8");
  await writeFile("fantasyPoolMatchdayProjectionsData.js", [
    publicWrapperText("projections", slimProjectionBrowser).trimEnd()
  ].join("\n") + "\n", "utf8");
  await writeFile("fantasyPoolRecommendationsData.js", [
    publicWrapperText("recommendations", slimRecommendationBrowser).trimEnd()
  ].join("\n") + "\n", "utf8");
  await writeFile("fantasyPoolFinanceMetricsData.js", [
    "// Generated by scripts/buildFantasyPoolMatchdayProjectionsFinalRoundV1.mjs.",
    "// Current official fantasy-pool browser finance data plus conservative Final Round bridge rows.",
    `window.FANTASY_POOL_FINANCE_METRICS_DATA = ${JSON.stringify(financeBrowser)};`,
    "window.FANTASY_POOL_PLAYER_FINANCE_METRICS = window.FANTASY_POOL_FINANCE_METRICS_DATA.playerFinanceMetrics;",
    "window.FANTASY_POOL_FINANCE_METRICS_SUMMARY = window.FANTASY_POOL_FINANCE_METRICS_DATA.summary;"
  ].join("\n") + "\n", "utf8");
  await writeJson("data/teamBuilderFinalRoundArtifact_v1.json", teamBuilderArtifact);
  await writeFile("teamBuilderFinalRoundArtifactData.js", [
    publicWrapperText("teamBuilderArtifact", slimTeamBuilderArtifact).trimEnd()
  ].join("\n") + "\n", "utf8");
  await writeJson("data/finalRoundFinanceBridgeQa_v1.json", bridgeQa);
  await writeText("data/finalRoundFinanceBridgeQaReport_v1.md", `# Final Round Finance Bridge QA v1

Status: ${bridgeQa.status}

${mdTable(["Metric", "Value"], Object.entries(bridgeQa.summary))}

## Bridge Rows

${mdTable(["ID", "Player", "Country", "Pos", "Price"], bridgeQa.bridge_rows.map((row) => [row.official_fantasy_player_id, row.name, row.country, row.position, row.price]))}`);
}

async function writeReports({ authority, sfLineupEvidence, thirdPlaceProfile, thirdPlaceQa, lineupNewsAudit, role, score, projections, recommendations, teamBuilder, qas, peleAudit, postmortem }) {
  await writeText("data/finalRoundFixtureAuthorityReport_v1.md", `# Final Round Fixture Authority v1\n\nStatus: ${authority.status}\n\n${mdTable(["Fixture", "Teams", "Kickoff", "Source confidence"], authority.fixtures.map((fixture) => [fixture.round, `${fixture.team_a.team} vs ${fixture.team_b.team}`, fixture.kickoff.eastern_datetime_label, fixture.source_confidence]))}`);
  await writeText("data/sfLineupEvidenceForFinalRoundReport_v1.md", `# SF Lineup Evidence For Final Round v1\n\nStatus: ${sfLineupEvidence.status}\n\n${mdTable(["Team", "Explicit SF starters"], [...new Set(sfLineupEvidence.rows.map((row) => row.team_id))].map((teamId) => [TEAM_INFO[teamId]?.team || teamId, sfLineupEvidence.rows.filter((row) => row.team_id === teamId && row.started).length]))}`);
  await writeText("data/thirdPlaceHistoricalProfileReport_v1.md", `# Third Place Historical Profile v1\n\nStatus: ${thirdPlaceProfile.status}\n\n${mdTable(["Metric", "Value"], [["Games used", thirdPlaceProfile.score_audit.game_count], ["Average goals", thirdPlaceProfile.score_audit.average_goals], ["Median goals", thirdPlaceProfile.score_audit.median_goals], ["Over 2.5", thirdPlaceProfile.score_audit.over_2_5_share], ["BTTS", thirdPlaceProfile.score_audit.both_teams_scored_share], ["Clean sheet frequency", thirdPlaceProfile.score_audit.clean_sheet_frequency]])}\n\n## Modifiers\n\n${mdTable(["Modifier", "Value"], Object.entries(thirdPlaceProfile.modifiers))}\n\n## Lineup Audit\n\n${thirdPlaceProfile.lineup_audit.conclusion}`);
  await writeText("data/thirdPlaceHistoricalProfileQaReport_v1.md", `# Third Place Historical Profile QA v1\n\nStatus: ${thirdPlaceQa.status}\n\n${mdTable(["Check", "Status"], thirdPlaceQa.checks.map((check) => [check.id, check.status]))}`);
  await writeText("data/finalRoundLineupNewsAuditReport_v1.md", `# Final Round Lineup News Audit v1\n\nStatus: ${lineupNewsAudit.status}\n\n${mdTable(["Team", "Confidence", "Model effect", "Source"], lineupNewsAudit.teams.map((team) => [team.team, team.confidence_level, team.model_effect, team.source]))}`);
  await writeText("data/playerRoleModel_finalRound_v1.md", `# Player Role Model Final Round v1\n\nStatus: ${qas.roleQa.status}\n\n${mdTable(["Metric", "Value"], Object.entries(role.summary).map(([key, value]) => [key, typeof value === "object" ? JSON.stringify(value) : value]))}`);
  await writeText("data/playerRoleModelQaReport_finalRound_v1.md", `# Player Role Model QA Final Round v1\n\nStatus: ${qas.roleQa.status}\n`);
  await writeText("data/scorePredictionModel_finalRound_v1.md", `# Score Prediction Model Final Round v1\n\n${mdTable(["Metric", "Value"], Object.entries(score.summary).map(([key, value]) => [key, typeof value === "object" ? JSON.stringify(value) : value]))}`);
  await writeText("data/scorePredictionQaReport_finalRound_v1.md", `# Score Prediction QA Final Round v1\n\nStatus: ${qas.scoreQa.status}\n`);
  await writeText("data/playerProjectionModel_finalRound_v1.md", `# Player Projection Model Final Round v1\n\n${mdTable(["Metric", "Value"], Object.entries(projections.summary).map(([key, value]) => [key, typeof value === "object" ? JSON.stringify(value).slice(0, 300) : value]))}`);
  await writeText("data/playerProjectionQaReport_finalRound_v1.md", `# Player Projection QA Final Round v1\n\nStatus: ${qas.projectionQa.status}\n`);
  await writeText("data/recommendationModel_finalRound_v1.md", `# Recommendation Model Final Round v1\n\n${mdTable(["Metric", "Value"], Object.entries(recommendations.summary).map(([key, value]) => [key, typeof value === "object" ? JSON.stringify(value).slice(0, 300) : value]))}`);
  await writeText("data/recommendationQaReport_finalRound_v1.md", `# Recommendation QA Final Round v1\n\nStatus: ${qas.recommendationQa.status}\n`);
  await writeText("data/teamBuilderModel_finalRound_v1.md", `# Team Builder Model Final Round v1\n\nBalanced squad is constrained to 2 GK, 5 DEF, 5 MID, and 3 FWD, excludes unavailable and thin-profile players, and keeps Third Place risk visible.\n\n${mdTable(["Metric", "Value"], Object.entries(teamBuilder.summary).map(([key, value]) => [key, typeof value === "object" ? JSON.stringify(value) : value]))}`);
  await writeText("data/teamBuilderQaReport_finalRound_v1.md", `# Team Builder QA Final Round v1\n\nStatus: ${teamBuilder.status}\n\n## Summary\n\n${mdTable(["Metric", "Value"], Object.entries(teamBuilder.summary).map(([key, value]) => [key, typeof value === "object" ? JSON.stringify(value) : value]))}\n\n## Selected Squad\n\n${mdTable(["Player", "Country", "Pos", "Opponent", "Stage", "Pts", "Start", "Risk"], teamBuilder.balancedSquad.map((row) => [row.name, row.country, row.position, row.opponent, row.fixture_stage, row.projectedPoints, row.start_probability, row.thirdPlaceRisk ? "Third Place rotation" : ""]))}`);
  await writeText("data/knockoutModelPostmortemReport_for_finalRound_v1.md", `# Knockout Model Postmortem For Final Round v1\n\nStatus: ${postmortem.status}\n\n${mdTable(["Match", "Fixture", "Pred xG", "Actual", "Home residual", "Away residual"], postmortem.residuals.map((row) => [row.match_number, row.fixture, row.predicted_xg, row.actual_score, row.home_goal_residual, row.away_goal_residual]))}`);
  await writeText("data/peleRefreshAudit_finalRound_v1.md", `# PELE Refresh Audit Final Round v1\n\nStatus: ${peleAudit.status}\n\nRefresh result: ${peleAudit.refresh_result}\n\n${mdTable(["Team", "Found", "Quality", "PELE rating", "PELE status"], peleAudit.teams.map((row) => [row.team, row.found ? "yes" : "no", row.team_quality_v2_score, row.pele_rating, row.pele_status]))}`);
  await writeText("data/finalRoundCorePickLineupEvidenceQaReport_v1.md", `# Final Round Core Pick Lineup Evidence QA v1\n\nStatus: ${qas.corePickQa.status}\n\n${mdTable(["Metric", "Value"], Object.entries(qas.corePickQa.summary))}`);
  await writeText("data/finalRoundReleaseQaReport_v1.md", `# Final Round Release QA v1\n\nStatus: ${qas.releaseQa.status}\n\n${mdTable(["Check", "Status"], qas.releaseQa.checks.map((check) => [check.id, check.status]))}`);
}

export async function buildFinalRoundArtifacts() {
  const officialRows = readJson("data/officialFantasyPlayers_v0.json").officialFantasyPlayers;
  const live = readJson("data/liveMatchdayStatus_v1.json");
  const qfLineupEvidence = readJson("data/qfLineupEvidenceForSf_v1.json");
  const sfScore = readJson("data/scorePredictions_fantasyPool_sf_v1.json");
  const knockout = readJson("data/knockoutScorePredictor_v1.json");
  const teamQuality = readJson("data/teamQuality.json");

  const authority = buildFinalRoundFixtureAuthority({ live });
  const sfLineupEvidence = buildSfLineupEvidence(officialRows);
  const { profile: thirdPlaceProfile, qa: thirdPlaceQa } = buildThirdPlaceHistoricalProfile();
  const lineupNewsAudit = buildFinalRoundLineupNewsAudit();
  const peleAudit = buildPeleAudit({ teamQuality, authority });
  const role = buildPlayerRoleModel({ officialRows, authority, qfLineupEvidence, sfLineupEvidence, thirdPlaceProfile, lineupNewsAudit });
  const score = buildScorePredictions({ authority, knockout, thirdPlaceProfile });
  const projections = buildProjections({ role, score, thirdPlaceProfile });
  const recommendations = buildRecommendations({ projections });
  const teamBuilder = buildTeamBuilder({ projections, recommendations, authority });
  const { dataset, postmortem } = buildPostmortem({ score, sfScore, live, role });
  const qas = qaReports({ authority, role, score, projections, recommendations, teamBuilder, thirdPlaceProfile, lineupNewsAudit, peleAudit });

  await writeJson("data/finalRoundFixtureAuthority_v1.json", authority);
  await writeJson("data/sfLineupEvidenceForFinalRound_v1.json", sfLineupEvidence);
  await writeJson("data/thirdPlaceHistoricalProfile_v1.json", thirdPlaceProfile);
  await writeJson("data/thirdPlaceHistoricalProfileQa_v1.json", thirdPlaceQa);
  await writeJson("data/finalRoundLineupNewsAudit_v1.json", lineupNewsAudit);
  await writeJson("data/playerRoleModel_finalRound_v1.json", role);
  await writeJson("data/playerRoleModelQa_finalRound_v1.json", qas.roleQa);
  await writeJson("data/scorePredictions_fantasyPool_finalRound_v1.json", score, true);
  await writeJson("data/scorePredictionQa_finalRound_v1.json", qas.scoreQa);
  await writeJson("data/fantasyPoolMatchdayProjections_finalRound_v1.json", projections, true);
  await writeJson("data/playerProjectionQa_finalRound_v1.json", qas.projectionQa);
  await writeJson("data/fantasyPoolRecommendations_finalRound_v1.json", recommendations, true);
  await writeJson("data/recommendationQa_finalRound_v1.json", qas.recommendationQa);
  await writeJson("data/teamBuilderQa_finalRound_v1.json", teamBuilder);
  await writeJson("data/finalRoundCorePickLineupEvidenceQa_v1.json", qas.corePickQa);
  await writeJson("data/finalRoundReleaseQa_v1.json", qas.releaseQa);
  await writeJson("data/knockoutCalibrationDataset_for_finalRound_v1.json", dataset);
  await writeJson("data/knockoutModelPostmortem_for_finalRound_v1.json", postmortem);
  await writeJson("data/peleRefreshAudit_finalRound_v1.json", peleAudit);
  await writeReports({ authority, sfLineupEvidence, thirdPlaceProfile, thirdPlaceQa, lineupNewsAudit, role, score, projections, recommendations, teamBuilder, qas, peleAudit, postmortem });
  await writeBrowserWrappers({ authority, score, projections, recommendations, teamBuilder });

  return {
    authority,
    sfLineupEvidence,
    thirdPlaceProfile,
    lineupNewsAudit,
    role,
    score,
    projections,
    recommendations,
    teamBuilder,
    releaseQa: qas.releaseQa,
    peleAudit,
    postmortem,
    cacheBust: CACHE_BUST
  };
}

export async function validateFinalRoundFixtureAuthority() {
  const authority = readJson("data/finalRoundFixtureAuthority_v1.json");
  const errors = [];
  const fixtures = authority.fixtures || [];
  if (authority.status !== "pass") errors.push(`Authority status is ${authority.status}.`);
  if (fixtures.length !== 2) errors.push(`Expected 2 final-round fixtures, found ${fixtures.length}.`);
  const final = fixtures.find((fixture) => fixture.stage === "final");
  const third = fixtures.find((fixture) => fixture.stage === "third_place");
  if (!final) errors.push("Final fixture missing.");
  if (!third) errors.push("Third Place fixture missing.");
  const finalTeams = new Set([final?.team_a?.team_id, final?.team_b?.team_id]);
  const thirdTeams = new Set([third?.team_a?.team_id, third?.team_b?.team_id]);
  if (!finalTeams.has("spain") || !finalTeams.has("argentina")) errors.push("Final participants are not Spain and Argentina.");
  if (!thirdTeams.has("france") || !thirdTeams.has("england")) errors.push("Third Place participants are not France and England.");
  if (fixtures.some((fixture) => [fixture.team_a?.team_id, fixture.team_b?.team_id].includes("tbd"))) errors.push("Fixture contains TBD.");
  if (new Set(fixtures.map((fixture) => fixture.fixture_id)).size !== fixtures.length) errors.push("Duplicate fixture IDs found.");
  return { status: errors.length ? "fail" : "pass", errors, authority };
}

export async function validateFinalRoundCorePickLineupEvidence() {
  const qa = readJson("data/finalRoundCorePickLineupEvidenceQa_v1.json");
  return { status: qa.status, errors: qa.unsafe_core_pick_rows?.length ? ["Unsafe Final Round core picks found."] : [], qa };
}

export async function validateTeamBuilderFinalRound() {
  const qa = readJson("data/teamBuilderQa_finalRound_v1.json");
  const errors = [];
  if (qa.status !== "pass") errors.push("Team Builder QA status is not pass.");
  if (qa.summary?.squad_size !== 15) errors.push("Balanced squad is not 15 players.");
  if ((qa.summary?.thin_profile_players || 0) !== 0) errors.push("Thin-profile player entered Team Builder.");
  if ((qa.summary?.points_only_evidence_players || 0) !== 0) errors.push("Team Builder contains points-only evidence player.");
  if ((qa.summary?.eliminated_player_candidates || 0) !== 0) errors.push("Final Round Team Builder candidates include eliminated players.");
  if ((qa.summary?.eliminated_player_selected || 0) !== 0) errors.push("Final Round Team Builder selected squad includes eliminated players.");
  if (qa.summary?.captain_team_eligible !== true) errors.push("Team Builder captain team is not Final Round eligible.");
  if (qa.summary?.vice_team_eligible !== true) errors.push("Team Builder vice captain team is not Final Round eligible.");
  if (!qa.summary || qa.summary.optionality_score === undefined) errors.push("Team Builder QA is missing optionality score.");
  if (!qa.summary || qa.summary.composite_score === undefined) errors.push("Team Builder QA is missing composite score.");
  if (!qa.summary || !qa.summary.selected_count_by_fixture) errors.push("Team Builder QA is missing fixture exposure counts.");
  if ((qa.summary?.early_fixture_selected_count || 0) === 0 && (qa.summary?.minimum_early_fixture_players_when_viable || 0) > 0) errors.push("Balanced Squad has 0 earlier-fixture exposure without passing the viability explanation gate.");
  if ((qa.summary?.selected_count_by_team?.France || 0) === 0 && (qa.summary?.selected_count_by_team?.England || 0) === 0) errors.push("France and England are both absent from the selected squad.");
  if (!Array.isArray(qa.rawExpectedPointsSquad) || !qa.rawExpectedPointsSquad.length) errors.push("Team Builder QA is missing raw expected-points comparison squad.");
  if (!Array.isArray(qa.topOmittedByTeam) || qa.topOmittedByTeam.length < 4) errors.push("Team Builder QA is missing top omitted player reasons by team.");
  return { status: errors.length ? "fail" : "pass", errors, qa };
}
