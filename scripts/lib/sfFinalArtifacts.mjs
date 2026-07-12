import fs from "node:fs";
import { writeFile } from "node:fs/promises";

const GENERATED_AT = new Date().toISOString();
const MATCHDAY_ID = "sf";
const MATCHDAY_LABEL = "SF";
const CACHE_BUST = "20260712-sf-final";

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

async function writeText(filePath, text) {
  await writeFile(filePath, `${text.trimEnd()}\n`, "utf8");
}

function rowsFromJson(data, keys) {
  if (Array.isArray(data)) return data;
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
}

function hasValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== "";
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

function mdTable(headers, rows) {
  if (!rows.length) return "_None._";
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((value) => String(value ?? "")).join(" | ")} |`)
  ].join("\n");
}

const QF_LINEUP_SOURCES = [
  {
    fixture_id: "fwc2026-m097",
    source_fixture_id: "97",
    match_number: 97,
    team: "France",
    team_id: "france",
    opponent: "Morocco",
    opponent_team_id: "morocco",
    source_url: "https://www.theguardian.com/football/live/2026/jul/09/france-v-morocco-world-cup-2026-quarter-final-live",
    source_checked: "2026-07-12",
    source_published_date: "2026-07-09",
    starters: ["Maignan", "Kounde", "Upamecano", "Saliba", "Digne", "Kone", "Rabiot", "Dembele", "Olise", "Doue", "Mbappe"],
    bench: ["Samba", "Gusto", "Tchouameni", "Thuram", "Kante", "Konate", "Zaire Emery", "Theo Hernandez", "Lucas Hernandez", "Mateta", "Risser", "Cherki", "Akliouche", "Lacroix", "Barcola"],
    source_note: "Guardian QF liveblog listed France's full starting XI and substitutes for France v Morocco."
  },
  {
    fixture_id: "fwc2026-m098",
    source_fixture_id: "99",
    match_number: 98,
    team: "Spain",
    team_id: "spain",
    opponent: "Belgium",
    opponent_team_id: "belgium",
    source_url: "https://www.theguardian.com/football/live/2026/jul/10/spain-v-belgium-world-cup-2026-quarter-final-live",
    source_checked: "2026-07-12",
    source_published_date: "2026-07-10",
    starters: ["Simon", "Porro", "Cubarsi", "Laporte", "Cucurella", "Rodri", "Ruiz", "Lamine Yamal", "Olmo", "Baena", "Oyarzabal"],
    bench: ["Raya", "J Garcia", "Pubill", "Grimaldo", "E Garcia", "Llorente", "Merino", "Torres", "Gavi", "Pino", "Williams", "Zubimendi", "Munoz", "Iglesias", "Pedri"],
    source_note: "Guardian QF liveblog listed Spain's full starting XI and substitutes; Fabián Ruiz replaced Pedri in the XI."
  },
  {
    fixture_id: "fwc2026-m099",
    source_fixture_id: "98",
    match_number: 99,
    team: "England",
    team_id: "england",
    opponent: "Norway",
    opponent_team_id: "norway",
    source_url: "https://www.theguardian.com/football/live/2026/jul/11/norway-v-england-world-cup-2026-quarter-final-live",
    source_checked: "2026-07-12",
    source_published_date: "2026-07-11",
    starters: ["Pickford", "Konsa", "Stones", "Guehi", "O'Reilly", "Anderson", "Rice", "Madueke", "Bellingham", "Gordon", "Kane"],
    bench: ["Dean Henderson", "Trafford", "Rashford", "Chalobah", "Burn", "Mainoo", "Rogers", "Watkins", "Eze", "Toney", "James", "Jordan Henderson", "Saka", "Spence"],
    source_note: "Guardian QF liveblog listed England's full starting XI and substitutes for Norway v England."
  },
  {
    fixture_id: "fwc2026-m100",
    source_fixture_id: "100",
    match_number: 100,
    team: "Argentina",
    team_id: "argentina",
    opponent: "Switzerland",
    opponent_team_id: "switzerland",
    source_url: "https://www.theguardian.com/football/live/2026/jul/11/argentina-v-switzerland-world-cup-2026-quarter-final-live",
    source_checked: "2026-07-12",
    source_published_date: "2026-07-11",
    starters: ["E Martinez", "Tagliafico", "L Martinez", "Romero", "Molina", "Paredes", "Fernandez", "Mac Allister", "De Paul", "Alvarez", "Messi"],
    bench: [],
    source_note: "Guardian QF liveblog listed Argentina's full starting XI for Argentina v Switzerland; substitute bench was not listed in the lineup block."
  }
];

const PLAYER_ALIASES = {
  "argentina|alvarez": "39",
  "argentina|e martinez": "45",
  "argentina|emiliano martinez": "45",
  "argentina|fernandez": "57",
  "argentina|l martinez": "1318",
  "argentina|lisandro martinez": "1318",
  "argentina|lautaro martinez": "1338",
  "argentina|mac allister": "56",
  "argentina|messi": "38",
  "argentina|molina": "30",
  "argentina|paredes": "48",
  "argentina|romero": "28",
  "argentina|tagliafico": "34",
  "argentina|de paul": "50",
  "england|anderson": "486",
  "england|bellingham": "491",
  "england|gordon": "474",
  "england|guehi": "461",
  "england|kane": "468",
  "england|konsa": "463",
  "england|madueke": "476",
  "england|o reilly": "457",
  "england|pickford": "477",
  "england|rice": "488",
  "england|saka": "469",
  "england|stones": "466",
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
  "spain|baena": "1082",
  "spain|cubarsi": "1089",
  "spain|cucurella": "1088",
  "spain|fabian": "1998",
  "spain|fabian ruiz": "1998",
  "spain|lamine yamal": "1092",
  "spain|laporte": "1086",
  "spain|olmo": "1105",
  "spain|oyarzabal": "1094",
  "spain|pedri": "1106",
  "spain|porro": "1085",
  "spain|rodri": "1104",
  "spain|ruiz": "1998",
  "spain|simon": "1099",
  "spain|yamal": "1092"
};

function officialIndexes(officialRows) {
  const byId = new Map();
  const byTeam = new Map();
  for (const row of officialRows) {
    const teamId = slug(row.country || "");
    const item = { ...row, team_id_slug: teamId, normalized_name: normalizeText(row.name) };
    byId.set(String(row.official_fantasy_player_id || ""), item);
    const list = byTeam.get(teamId) || [];
    list.push(item);
    byTeam.set(teamId, list);
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

function buildQfLineupEvidence(officialPlayers) {
  const officialRows = rowsFromJson(officialPlayers, ["officialFantasyPlayers", "players"]);
  const indexes = officialIndexes(officialRows);
  const evidence = [];
  const warnings = [];

  for (const source of QF_LINEUP_SOURCES) {
    const starterIds = new Set();
    const benchKeys = new Set(source.bench.map((name) => normalizeText(name)));
    for (const sourceName of source.starters) {
      const sourceKey = normalizeText(sourceName);
      const { official, confidence } = officialBySourceName(indexes, source.team_id, sourceName);
      if (official?.official_fantasy_player_id) starterIds.add(String(official.official_fantasy_player_id));
      evidence.push(lineupEvidenceRow({ source, sourceName, official, confidence, started: true, sourceKey, benchKeys }));
    }
    for (const sourceName of source.bench) {
      const sourceKey = normalizeText(sourceName);
      const { official, confidence } = officialBySourceName(indexes, source.team_id, sourceName);
      evidence.push(lineupEvidenceRow({ source, sourceName, official, confidence, started: false, sourceKey, benchKeys, explicitBench: true }));
    }
    const teamOfficialRows = officialRows.filter((row) => slug(row.country) === source.team_id);
    for (const official of teamOfficialRows) {
      const id = String(official.official_fantasy_player_id || "");
      if (!id || starterIds.has(id)) continue;
      const sourceKey = normalizeText(official.name);
      if (evidence.some((row) => row.round === "QF" && row.team_id === source.team_id && row.official_fantasy_player_id === id)) continue;
      evidence.push(lineupEvidenceRow({
        source,
        sourceName: official.name,
        official,
        confidence: "full_starting_xi_exclusion",
        started: false,
        sourceKey,
        benchKeys,
        explicitBench: false,
        fullLineupExclusion: true
      }));
    }
  }

  const startersByTeam = new Map();
  for (const row of evidence.filter((item) => item.started === true)) {
    const key = `${row.fixture_id}|${row.team_id}`;
    startersByTeam.set(key, (startersByTeam.get(key) || 0) + 1);
  }
  for (const [key, count] of startersByTeam.entries()) {
    if (count !== 11) warnings.push(`${key} has ${count} matched/retained QF starter rows; expected 11.`);
  }

  return {
    schema_version: "qf_lineup_evidence_for_sf_v1",
    generated_at: GENERATED_AT,
    status: warnings.length ? "pass_with_warnings" : "pass",
    source_policy: {
      fantasy_points_can_set_started_true: false,
      ownership_used_as_signal: false,
      qf_full_starting_xi_is_primary_sf_lineup_signal: true
    },
    summary: {
      qf_lineup_teams: QF_LINEUP_SOURCES.length,
      qf_explicit_starter_rows: evidence.filter((row) => row.started === true).length,
      qf_non_starter_rows: evidence.filter((row) => row.started === false).length,
      teams_with_11_qf_starters: [...startersByTeam.values()].filter((count) => count === 11).length,
      source_urls: QF_LINEUP_SOURCES.map((source) => source.source_url)
    },
    warnings,
    lineupEvidenceRows: evidence
  };
}

function lineupEvidenceRow({ source, sourceName, official, confidence, started, sourceKey, benchKeys, explicitBench = false, fullLineupExclusion = false }) {
  return {
    evidence_id: `guardian-qf-${source.match_number}-${source.team_id}-${sourceKey.replace(/\s+/g, "-")}`,
    fixture_id: source.fixture_id,
    source_fixture_id: source.source_fixture_id,
    round: "QF",
    round_id: 6,
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
    substitute_appearance: started ? false : "unknown",
    unused_substitute: started ? false : "unknown",
    minutes_played: null,
    position: official?.official_fantasy_position || null,
    source: "guardian_liveblog",
    source_file: null,
    source_url: source.source_url,
    source_checked: source.source_checked,
    source_published_date: source.source_published_date,
    source_confidence: started
      ? "explicit_qf_starting_xi_guardian_liveblog"
      : explicitBench
        ? "explicit_qf_bench_list_guardian_liveblog"
        : fullLineupExclusion
          ? "qf_full_starting_xi_exclusion_guardian_liveblog"
          : "qf_non_starter_guardian_liveblog",
    source_claims_full_lineup: started,
    lineupEvidenceType: started
      ? "external_explicit_qf_starting_xi"
      : explicitBench
        ? "external_explicit_qf_bench_list"
        : "external_qf_full_lineup_non_starter",
    matched_to_official_fantasy_player: Boolean(official),
    match_confidence: confidence,
    notes: [
      source.source_note,
      fullLineupExclusion ? "Player is not in the listed QF starting XI; this is non-start evidence, not an unused-substitute claim." : "",
      !started && benchKeys.has(sourceKey) ? "Listed as a substitute; no start is inferred." : ""
    ].filter(Boolean)
  };
}

function teamSetFromAuthority(authority) {
  const out = new Set();
  for (const fixture of authority.fixtures || []) {
    [fixture.team_a, fixture.team_b].forEach((team) => {
      if (team?.team_id) out.add(team.team_id);
    });
  }
  return out;
}

function fixtureForTeam(authority, teamId) {
  return (authority.fixtures || []).find((fixture) =>
    [fixture.team_a?.team_id, fixture.team_b?.team_id].includes(teamId)
  ) || null;
}

function opponentForTeam(fixture, teamId) {
  if (!fixture) return null;
  if (fixture.team_a?.team_id === teamId) return fixture.team_b || null;
  if (fixture.team_b?.team_id === teamId) return fixture.team_a || null;
  return null;
}

function sideForTeam(fixture, teamId) {
  if (fixture?.team_a?.team_id === teamId) return "home_listed";
  if (fixture?.team_b?.team_id === teamId) return "away_listed";
  return null;
}

function evidenceIndex(lineupEvidence, qfLineupEvidence) {
  const byPlayerRound = new Map();
  for (const row of [
    ...rowsFromJson(lineupEvidence, ["lineupEvidenceRows", "rows"]),
    ...rowsFromJson(qfLineupEvidence, ["lineupEvidenceRows", "rows"])
  ]) {
    const id = String(row.official_fantasy_player_id || row.fantasy_id || "");
    const round = String(row.round || "").toUpperCase();
    if (!id || !round || row.matched_to_official_fantasy_player === false) continue;
    const key = `${id}|${round}`;
    const list = byPlayerRound.get(key) || [];
    list.push(row);
    byPlayerRound.set(key, list);
  }
  return byPlayerRound;
}

function evidencePriority(row) {
  let score = 0;
  if (row.round === "QF") score += 80;
  if (row.started === true) score += 40;
  if (row.started === false) score += 25;
  if (String(row.source_confidence || "").includes("starting_xi")) score += 20;
  if (String(row.source_confidence || "").includes("bench_list")) score += 16;
  if (String(row.source_confidence || "").includes("full_starting_xi_exclusion")) score += 14;
  if (String(row.source_confidence || "").includes("matchStatus")) score += 10;
  return score;
}

function bestEvidence(index, playerId, round) {
  const rows = index.get(`${String(playerId)}|${String(round).toUpperCase()}`) || [];
  return rows.slice().sort((a, b) => evidencePriority(b) - evidencePriority(a))[0] || null;
}

function roundPoints(live, roundId) {
  const value = live?.stats?.roundPoints?.[String(roundId)];
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function liveRowsById(livePlayers) {
  return new Map(rowsFromJson(livePlayers, ["players"]).map((row) => [String(row.official_fantasy_player_id), row]));
}

function roleTierFromStart(startProb) {
  if (startProb >= 0.86) return "locked_starter";
  if (startProb >= 0.74) return "likely_starter";
  if (startProb >= 0.45) return "rotation_or_sub_risk";
  if (startProb > 0) return "bench_depth";
  return "unavailable_or_not_selectable";
}

function isUnavailableStatus(status) {
  return ["injured", "suspended", "transferred", "eliminated"].includes(String(status || "").toLowerCase());
}

function projectionByPlayer(projections) {
  return new Map(rowsFromJson(projections, ["playerMatchdayProjections"]).map((row) => [String(row.official_fantasy_player_id), row]));
}

function roleByPlayer(role) {
  return new Map(rowsFromJson(role, ["playerRoleRows"]).map((row) => [String(row.official_fantasy_player_id), row]));
}

function sourceAbsences(lineupNews) {
  const out = new Map();
  for (const team of lineupNews.teams || []) {
    for (const absence of team.confirmed_absences || []) {
      if (absence.official_fantasy_player_id) out.set(String(absence.official_fantasy_player_id), absence);
    }
  }
  return out;
}

function teamVolatility(rows) {
  const byTeam = new Map();
  for (const row of rows.filter((entry) => entry.public_pool === "main")) {
    const list = byTeam.get(row.team_id) || [];
    list.push(row);
    byTeam.set(row.team_id, list);
  }
  const out = new Map();
  for (const [teamId, list] of byTeam.entries()) {
    const qfStarters = list.filter((row) => row.qfStarted === true);
    const qfNewStarters = qfStarters.filter((row) => row.r16Started !== true).length;
    const r16LostStarters = list.filter((row) => row.r16Started === true && row.qfStarted !== true).length;
    const continuity = qfStarters.filter((row) => row.r16Started === true && row.r32Started === true).length;
    const score = clamp((qfNewStarters + r16LostStarters) / 22, 0, 0.5);
    out.set(teamId, {
      team_id: teamId,
      team: list[0]?.country || teamId,
      volatility_score: round(score, 3),
      volatility_level: score >= 0.28 ? "high" : score >= 0.12 ? "medium" : "low",
      qf_new_starters: qfNewStarters,
      r16_starters_lost_qf_start: r16LostStarters,
      r32_r16_qf_start_continuity: continuity
    });
  }
  return out;
}

function buildRoleModel({ authority, officialPlayers, livePlayers, qfProjections, qfRole, lineupEvidence, qfLineupEvidence, lineupNews }) {
  const mainTeams = teamSetFromAuthority(authority);
  const liveById = liveRowsById(livePlayers);
  const priorProjectionById = projectionByPlayer(qfProjections);
  const priorRoleById = roleByPlayer(qfRole);
  const evidenceByPlayerRound = evidenceIndex(lineupEvidence, qfLineupEvidence);
  const absenceById = sourceAbsences(lineupNews);
  const rows = rowsFromJson(officialPlayers, ["officialFantasyPlayers", "players"]).map((official) => {
    const id = String(official.official_fantasy_player_id || "");
    const live = liveById.get(id);
    const priorProjection = priorProjectionById.get(id);
    const priorRole = priorRoleById.get(id);
    const teamId = slug(official.country || live?.team_name || priorProjection?.country || "");
    const status = live?.status || official.selectable_status || official.availability_status || null;
    const sourceAbsence = absenceById.get(id);
    const qfEligible = mainTeams.has(teamId);
    const qfEvidence = bestEvidence(evidenceByPlayerRound, id, "QF");
    const r16Evidence = bestEvidence(evidenceByPlayerRound, id, "R16");
    const r32Evidence = bestEvidence(evidenceByPlayerRound, id, "R32");
    const qfStarted = qfEvidence ? qfEvidence.started === true : null;
    const r16Started = r16Evidence ? r16Evidence.started === true : null;
    const r32Started = r32Evidence ? r32Evidence.started === true : null;
    const qfPoints = roundPoints(live, 6);
    const r16Points = roundPoints(live, 5);
    const r32Points = roundPoints(live, 4);
    const dataQualityFlags = ["player_role_sf_v1", "ownership_not_used_as_signal", "final_squads_not_source_backed", "lineup_evidence_separated_from_points"];
    let startProb = Number(priorRole?.start_probability ?? priorProjection?.start_probability ?? 0.3);
    let expectedMinutes = Number(priorRole?.expected_minutes ?? priorProjection?.expected_minutes ?? 38);
    if (!Number.isFinite(startProb)) startProb = 0.3;
    if (!Number.isFinite(expectedMinutes)) expectedMinutes = 38;
    const priorStartProb = startProb;
    const strongPrior = priorStartProb >= 0.82 || ["locked_starter", "likely_starter"].includes(priorRole?.roleTier || priorProjection?.roleTier);
    const unavailable = isUnavailableStatus(status) || Boolean(sourceAbsence);
    let evidenceStrength = "prior_only";
    let lineupEvidenceType = "no_explicit_lineup_evidence";
    let roleCaution = "";
    let roleInterpretation = "SF role starts from QF lineup evidence, with R16 and R32 as supporting continuity signals.";
    let majorRoleCaution = false;

    if (qfEvidence) dataQualityFlags.push(qfStarted ? "explicit_qf_starter_evidence" : "explicit_qf_non_starter_evidence");
    if (r16Evidence) dataQualityFlags.push(r16Started ? "explicit_r16_starter_evidence" : "explicit_r16_non_starter_evidence");
    if (r32Evidence) dataQualityFlags.push(r32Started ? "explicit_r32_starter_evidence" : "explicit_r32_non_starter_evidence");
    if (Number.isFinite(qfPoints)) dataQualityFlags.push("qf_points_not_used_for_lineup_inference");

    if (unavailable) {
      startProb = 0;
      expectedMinutes = 0;
      evidenceStrength = sourceAbsence ? "source_backed_absence" : "official_unavailable_status";
      lineupEvidenceType = "unavailable";
      roleInterpretation = sourceAbsence
        ? `Source-backed absence: ${sourceAbsence.reason}.`
        : `Official fantasy status is ${status}; SF projection zeroed.`;
      roleCaution = roleInterpretation;
      majorRoleCaution = true;
      dataQualityFlags.push("unavailable_zeroed");
    } else if (!qfEligible) {
      startProb = 0;
      expectedMinutes = 0;
      evidenceStrength = "team_not_qualified_for_sf";
      lineupEvidenceType = "team_not_in_sf";
      roleInterpretation = "Team is not in a final SF slot; player excluded from public SF picks.";
      majorRoleCaution = true;
      dataQualityFlags.push("team_not_in_sf");
    } else if (qfStarted === true && r16Started === true && strongPrior) {
      startProb = Math.max(startProb, 0.88);
      expectedMinutes = Math.max(expectedMinutes, 76);
      evidenceStrength = "explicit_qf_r16_starter_plus_strong_prior";
      lineupEvidenceType = "explicit_qf_starter";
      roleInterpretation = "QF starter plus R16 starter and strong prior; QF is the primary SF start signal.";
      dataQualityFlags.push("explicit_qf_r16_starter_continuity");
    } else if (qfStarted === true) {
      startProb = Math.max(startProb, strongPrior ? 0.86 : 0.82);
      expectedMinutes = Math.max(expectedMinutes, strongPrior ? 74 : 68);
      evidenceStrength = r16Started === false ? "explicit_qf_starter_after_r16_non_start" : "explicit_qf_starter";
      lineupEvidenceType = "explicit_qf_starter";
      roleInterpretation = r16Started === false
        ? "QF starter after R16 non-start; upgraded for SF but flagged for role volatility."
        : "QF starter evidence is the strongest SF start signal.";
      roleCaution = r16Started === false ? "Started QF after not starting R16; role is upgraded but volatile." : "";
      dataQualityFlags.push("explicit_qf_starter_weighted");
    } else if (qfStarted === false) {
      const hadPriorStart = r16Started === true || r32Started === true || priorStartProb >= 0.74;
      startProb = Math.min(Math.max(startProb * (hadPriorStart ? 0.55 : 0.45), hadPriorStart ? 0.24 : 0.12), hadPriorStart ? 0.48 : 0.36);
      expectedMinutes = Math.min(Math.max(expectedMinutes * 0.55, hadPriorStart ? 20 : 10), hadPriorStart ? 42 : 30);
      evidenceStrength = hadPriorStart ? "qf_non_starter_after_prior_start_role" : "explicit_qf_non_starter";
      lineupEvidenceType = qfEvidence?.lineupEvidenceType || "explicit_qf_non_starter";
      roleInterpretation = "QF non-start evidence caps SF starting confidence; points are not used as starter evidence.";
      roleCaution = hadPriorStart ? "Lost QF start after prior starter evidence; verify lineup before using." : "Did not start QF.";
      majorRoleCaution = true;
      dataQualityFlags.push("explicit_qf_non_starter_capped");
    } else if (Number.isFinite(qfPoints) && qfPoints > 0) {
      startProb = Math.min(Math.max(startProb * 0.48, 0.16), 0.4);
      expectedMinutes = Math.min(Math.max(expectedMinutes * 0.48, 12), 36);
      evidenceStrength = "qf_points_only_appearance_not_start";
      lineupEvidenceType = "points_only_appearance";
      roleInterpretation = "QF fantasy points show appearance only; no SF start is inferred from points.";
      roleCaution = "QF points are appearance-only evidence, not a source-backed start.";
      majorRoleCaution = true;
      dataQualityFlags.push("points_only_appearance_not_start", "no_start_inferred_from_points");
    } else {
      startProb = Math.min(startProb * 0.65, 0.36);
      expectedMinutes = Math.min(expectedMinutes * 0.65, 32);
      evidenceStrength = "no_qf_lineup_or_points";
      lineupEvidenceType = "no_explicit_qf_lineup_evidence";
      roleInterpretation = "No QF starter evidence for an SF team; role is downgraded.";
      roleCaution = "No source-backed QF starter evidence.";
      majorRoleCaution = true;
      dataQualityFlags.push("no_qf_lineup_evidence_downgraded");
    }

    return {
      official_fantasy_player_id: id,
      internal_player_id: official.current_player_match?.player_id || priorProjection?.internal_player_id || `${teamId}-${slug(official.name)}`,
      name: official.name || live?.name || priorProjection?.name || "",
      display_name: official.name || live?.display_name || priorProjection?.display_name || "",
      country: official.country || live?.team_name || priorProjection?.country || "",
      team_id: teamId,
      official_team_id: official.team_id || live?.team_id || null,
      official_fantasy_position: official.official_fantasy_position || live?.position || priorProjection?.official_fantasy_position || null,
      official_price: Number(official.official_price ?? live?.price ?? priorProjection?.official_price ?? 0),
      selectable_status: status,
      source_absence: sourceAbsence || null,
      sf_fixture_status: qfEligible ? "known_fixture" : "not_in_sf",
      public_pool: qfEligible && !unavailable ? "main" : "excluded",
      prior_start_probability: round(priorStartProb, 3),
      start_probability: round(startProb, 3),
      startProb: round(startProb, 3),
      expected_minutes: round(expectedMinutes, 1),
      expectedMinutes: round(expectedMinutes, 1),
      roleTier: roleTierFromStart(startProb),
      role_label: roleTierFromStart(startProb),
      roleConfidence: qfStarted === true ? "high" : qfStarted === false ? "medium" : "low",
      role_confidence: qfStarted === true ? "high" : qfStarted === false ? "medium" : "low",
      evidenceStrength,
      lineupEvidenceType,
      role_interpretation: roleInterpretation,
      roleCaution,
      role_caution: roleCaution,
      majorRoleCaution,
      qf_round_points: qfPoints,
      r16_round_points: r16Points,
      r32_round_points: r32Points,
      qfStarted,
      qfSubstitute: qfEvidence?.started === false && String(qfEvidence?.source_confidence || "").includes("bench_list") ? true : null,
      qfLineupSource: qfEvidence?.source_url || null,
      qfLineupEvidenceId: qfEvidence?.evidence_id || null,
      r16Started,
      r16Substitute: r16Evidence?.substitute_appearance ?? null,
      r16LineupSource: r16Evidence?.source_url || r16Evidence?.source_file || null,
      r16LineupEvidenceId: r16Evidence?.evidence_id || null,
      r32Started,
      r32Substitute: r32Evidence?.substitute_appearance ?? null,
      r32LineupSource: r32Evidence?.source_url || r32Evidence?.source_file || null,
      r32LineupEvidenceId: r32Evidence?.evidence_id || null,
      data_quality_flags: dataQualityFlags,
      dataQualityFlags: [...dataQualityFlags]
    };
  });

  const volatilityByTeam = teamVolatility(rows);
  for (const row of rows) {
    const volatility = volatilityByTeam.get(row.team_id) || { volatility_score: 0, volatility_level: "none" };
    row.team_role_volatility = volatility;
    row.role_volatility_score = volatility.volatility_score;
    row.role_volatility_level = volatility.volatility_level;
    if (row.public_pool === "main" && Number(row.start_probability) > 0) {
      const penalty = volatility.volatility_score * (row.qfStarted === true ? 0.025 : 0.12);
      const floor = row.qfStarted === true ? 0.82 : 0.02;
      row.start_probability = round(clamp(Number(row.start_probability) - penalty, floor, 0.95), 3);
      row.startProb = row.start_probability;
      row.expected_minutes = round(clamp(Number(row.expected_minutes) - penalty * 35, 0, 90), 1);
      row.expectedMinutes = row.expected_minutes;
      row.roleTier = roleTierFromStart(Number(row.start_probability));
      row.role_label = row.roleTier;
      if (volatility.volatility_level !== "low") {
        row.data_quality_flags.push("role_volatility_penalty_applied");
        row.dataQualityFlags.push("role_volatility_penalty_applied");
      }
    }
    const core = coreEligibilityForRoleRow(row);
    row.allowedCorePick = core.allowed;
    row.coreEligibilityReason = core.reason;
    row.coreEligibilityWarning = core.warning;
  }

  const audits = targetedRoleAudits(rows);
  return {
    schema_version: "player_role_model_sf_v1",
    generated_at: GENERATED_AT,
    model_version: "player-role-sf-v1",
    source_files: [
      "data/officialFantasyPlayers_v0.json",
      "data/livePlayerStatus_v1.json",
      "data/qfLineupEvidenceForSf_v1.json",
      "data/worldCupLineupEvidence_v1.json",
      "data/sfFixtureAuthority_v1.json",
      "data/sfLineupNewsAudit_v1.json"
    ],
    summary: {
      role_rows: rows.length,
      main_pool_players: rows.filter((row) => row.public_pool === "main").length,
      excluded_players: rows.filter((row) => row.public_pool === "excluded").length,
      sf_team_count: mainTeams.size,
      qf_explicit_starter_rows: rows.filter((row) => row.public_pool === "main" && row.qfStarted === true).length,
      qf_explicit_non_starter_rows: rows.filter((row) => mainTeams.has(row.team_id) && row.qfStarted === false).length,
      qf_points_only_appearance_rows: rows.filter((row) => row.public_pool === "main" && row.lineupEvidenceType === "points_only_appearance").length,
      points_only_start_inference_rows: 0,
      points_can_imply_starter: false,
      core_pick_eligible_players: rows.filter((row) => row.allowedCorePick).length,
      unavailable_zeroed: rows.filter((row) => row.data_quality_flags.includes("unavailable_zeroed")).length,
      eliminated_team_players_excluded: rows.filter((row) => row.sf_fixture_status === "not_in_sf").length,
      explicit_qf_starting_xi_available: rows.filter((row) => row.public_pool === "main" && row.qfStarted === true).length >= 44,
      sf_teams_with_explicit_qf_starters: [...mainTeams].filter((teamId) => rows.filter((row) => row.team_id === teamId && row.qfStarted === true).length === 11).length,
      role_volatility_teams: [...volatilityByTeam.values()].sort((a, b) => b.volatility_score - a.volatility_score)
    },
    audits,
    playerRoleRows: rows
  };
}

function coreEligibilityForRoleRow(row) {
  if (row.public_pool !== "main") return { allowed: false, reason: "not_in_main_sf_pool", warning: "Player is not in the active SF public pool." };
  if (row.qfStarted !== true || row.lineupEvidenceType !== "explicit_qf_starter") {
    return { allowed: false, reason: "missing_explicit_qf_start", warning: "Core Pick blocked: no source-backed QF start." };
  }
  if (Number(row.start_probability || 0) < 0.78) {
    return { allowed: false, reason: "start_probability_below_core_threshold", warning: "Core Pick blocked: start probability below 78%." };
  }
  if (row.majorRoleCaution) return { allowed: false, reason: "major_role_caution", warning: row.roleCaution || "Core Pick blocked by major role caution." };
  if ((row.data_quality_flags || []).includes("points_only_appearance_not_start")) {
    return { allowed: false, reason: "points_only_appearance", warning: "Core Pick blocked: fantasy points show appearance only, not a start." };
  }
  return { allowed: true, reason: "explicit_qf_starter_with_sf_role_confidence", warning: null };
}

function targetedRoleAudits(rows) {
  const match = (terms) => rows.filter((row) => terms.some((term) => normalizeText(`${row.name} ${row.display_name}`).includes(normalizeText(term))));
  return {
    france_doue_barcola_digne: match(["doué", "doue", "barcola", "digne"]),
    argentina_martinez_alvarez: match(["lautaro martinez", "lautaro martínez", "julian alvarez", "julián alvarez", "emiliano martinez", "emiliano martínez"]),
    spain_pedri_fabian_ruiz: match(["pedri", "fabian ruiz", "fabián ruiz"]),
    qf_starters_preserved_examples: rows.filter((row) => row.public_pool === "main" && row.qfStarted === true).slice(0, 20),
    qf_non_starters_downgraded_examples: rows.filter((row) => row.team_id && row.qfStarted === false && Number(row.start_probability) < 0.5).slice(0, 20)
  };
}

function predictionIndex(knockout) {
  const rows = rowsFromJson(knockout, ["arbitrary_matchup_predictions", "known_r32_predictions"]);
  const byPair = new Map();
  for (const row of rows) {
    byPair.set(`${row.home_team_id}|${row.away_team_id}`, { row, reversed: false });
    byPair.set(`${row.away_team_id}|${row.home_team_id}`, { row, reversed: true });
  }
  return byPair;
}

function orientPrediction(info, fixture) {
  if (!info?.row) return null;
  const row = info.row;
  const home = fixture.team_a;
  const away = fixture.team_b;
  if (!info.reversed) {
    return { ...row, home_team_id: home.team_id, home_team: home.team, away_team_id: away.team_id, away_team: away.team };
  }
  return {
    ...row,
    home_team_id: home.team_id,
    home_team: home.team,
    away_team_id: away.team_id,
    away_team: away.team,
    home_expected_goals: row.away_expected_goals,
    away_expected_goals: row.home_expected_goals,
    home_win_probability: row.away_win_probability,
    away_win_probability: row.home_win_probability,
    home_clean_sheet_probability: row.away_clean_sheet_probability,
    away_clean_sheet_probability: row.home_clean_sheet_probability,
    home_advance_probability: row.away_advance_probability,
    away_advance_probability: row.home_advance_probability,
    home_advance_in_90_probability: row.away_advance_in_90_probability,
    away_advance_in_90_probability: row.home_advance_in_90_probability,
    home_advance_after_extra_time_probability: row.away_advance_after_extra_time_probability,
    away_advance_after_extra_time_probability: row.home_advance_after_extra_time_probability,
    home_advance_on_penalties_probability: row.away_advance_on_penalties_probability,
    away_advance_on_penalties_probability: row.home_advance_on_penalties_probability,
    top_scorelines: (row.top_scorelines || []).map((scoreline) => ({
      ...scoreline,
      home_goals: scoreline.away_goals,
      away_goals: scoreline.home_goals,
      scoreline: `${scoreline.away_goals}-${scoreline.home_goals}`
    }))
  };
}

function buildScorePredictions({ authority, knockout }) {
  const index = predictionIndex(knockout);
  const fixtureScorePredictions = (authority.fixtures || []).map((fixture) => {
    const oriented = orientPrediction(index.get(`${fixture.team_a?.team_id}|${fixture.team_b?.team_id}`), fixture);
    if (!oriented) return null;
    const favoriteIsHome = Number(oriented.home_advance_probability) >= Number(oriented.away_advance_probability);
    return {
      prediction_id: `${fixture.fixture_id}-score-sf-v1`,
      match_id: fixture.fixture_id,
      fixture_id: fixture.fixture_id,
      match_number: fixture.bracket_match_number,
      matchday: MATCHDAY_LABEL,
      fantasy_matchday_id: MATCHDAY_ID,
      stage: "semifinal",
      group: "SF",
      date: fixture.kickoff?.source_datetime || null,
      eastern_datetime_label: fixture.kickoff?.eastern_datetime_label || null,
      fixture_authority_status: fixture.classification,
      public_label: fixture.public_label,
      home_team_id: oriented.home_team_id,
      home_team: oriented.home_team,
      away_team_id: oriented.away_team_id,
      away_team: oriented.away_team,
      home_expected_goals: round(oriented.home_expected_goals),
      away_expected_goals: round(oriented.away_expected_goals),
      home_projected_xg: round(oriented.home_expected_goals),
      away_projected_xg: round(oriented.away_expected_goals),
      total_expected_goals: round(Number(oriented.home_expected_goals) + Number(oriented.away_expected_goals)),
      home_win_probability: round(oriented.home_win_probability, 4),
      draw_probability: round(oriented.draw_probability, 4),
      away_win_probability: round(oriented.away_win_probability, 4),
      home_clean_sheet_probability: round(oriented.home_clean_sheet_probability, 4),
      away_clean_sheet_probability: round(oriented.away_clean_sheet_probability, 4),
      both_teams_to_score_probability: round(oriented.both_teams_to_score_probability, 4),
      upset_risk_probability: round(Math.min(Number(oriented.home_advance_probability), Number(oriented.away_advance_probability)), 4),
      probability_extra_time: round(oriented.probability_extra_time, 4),
      home_advance_probability: round(oriented.home_advance_probability, 4),
      away_advance_probability: round(oriented.away_advance_probability, 4),
      home_advance_in_90_probability: round(oriented.home_advance_in_90_probability, 4),
      away_advance_in_90_probability: round(oriented.away_advance_in_90_probability, 4),
      home_advance_after_extra_time_probability: round(oriented.home_advance_after_extra_time_probability, 4),
      away_advance_after_extra_time_probability: round(oriented.away_advance_after_extra_time_probability, 4),
      home_advance_on_penalties_probability: round(oriented.home_advance_on_penalties_probability, 4),
      away_advance_on_penalties_probability: round(oriented.away_advance_on_penalties_probability, 4),
      favorite_team_id: favoriteIsHome ? oriented.home_team_id : oriented.away_team_id,
      favorite_team: favoriteIsHome ? oriented.home_team : oriented.away_team,
      favorite_win_probability: round(Math.max(Number(oriented.home_advance_probability), Number(oriented.away_advance_probability)), 4),
      projected_advancing_team: favoriteIsHome ? oriented.home_team : oriented.away_team,
      matchUncertainty: oriented.uncertainty_label || oriented.matchUncertainty || "High",
      uncertainty_label: oriented.uncertainty_label || oriented.matchUncertainty || "High",
      top_scorelines: oriented.top_scorelines || [],
      top_scoreline: oriented.top_scorelines?.[0]?.scoreline || null,
      winner_advances_to: fixture.winner_advances_to,
      loser_advances_to: fixture.loser_advances_to,
      data_quality_flags: ["score_prediction_sf_v1", "completed_qf_only", "ownership_not_used_as_signal", "final_squads_not_source_backed"]
    };
  }).filter(Boolean);

  const teamFixturePredictions = fixtureScorePredictions.flatMap((row) => [
    teamPredictionRow(row, "home"),
    teamPredictionRow(row, "away")
  ]);
  const projectedFinalists = fixtureScorePredictions.map((row) => row.favorite_team);
  const projectedThirdPlace = fixtureScorePredictions.map((row) => row.favorite_team === row.home_team ? row.away_team : row.home_team);

  return {
    schema_version: "fantasy_pool_score_predictions_sf_v1",
    generated_at: GENERATED_AT,
    source_checked: GENERATED_AT.slice(0, 10),
    model_stage: "sf_score_prediction",
    data_status: "sf_score_prediction_pass",
    modelVersion: "score-sf-v1",
    model_version: "score-sf-v1",
    safety_labels: ["Semifinal fantasy setup", "all 4 QF fixtures final", "final SF fixtures only", "ownership not used as signal", "final squads not source-backed"],
    input_files: ["data/sfFixtureAuthority_v1.json", "data/knockoutScorePredictor_v1.json", "data/teamQuality.json"],
    summary: {
      fixture_prediction_count: fixtureScorePredictions.length,
      final_known_fixture_predictions: fixtureScorePredictions.filter((row) => row.fixture_authority_status === "final_known").length,
      partial_or_pending_fixture_rows: fixtureScorePredictions.filter((row) => row.fixture_authority_status !== "final_known").length,
      defaultMatchday: MATCHDAY_ID,
      ownershipUsedAsSignal: false,
      finalSquadsSourceBacked: false,
      completedQfFixturesUsed: 4,
      incompleteQfFixtures: 0,
      projected_final_match: projectedFinalists.join(" vs "),
      projected_third_place_match: projectedThirdPlace.join(" vs ")
    },
    fixtureScorePredictions,
    teamFixturePredictions,
    projectedKnockoutPath: {
      final: projectedFinalists,
      third_place: projectedThirdPlace
    },
    defaultMatchday: MATCHDAY_ID
  };
}

function teamPredictionRow(row, side) {
  const home = side === "home";
  return {
    fixture_id: row.fixture_id,
    match_number: row.match_number,
    team_id: home ? row.home_team_id : row.away_team_id,
    team: home ? row.home_team : row.away_team,
    opponent_team_id: home ? row.away_team_id : row.home_team_id,
    opponent: home ? row.away_team : row.home_team,
    side: home ? "home_listed" : "away_listed",
    expected_goals: home ? row.home_expected_goals : row.away_expected_goals,
    expected_goals_against: home ? row.away_expected_goals : row.home_expected_goals,
    win_probability: home ? row.home_win_probability : row.away_win_probability,
    draw_probability: row.draw_probability,
    loss_probability: home ? row.away_win_probability : row.home_win_probability,
    clean_sheet_probability: home ? row.home_clean_sheet_probability : row.away_clean_sheet_probability,
    advance_probability: home ? row.home_advance_probability : row.away_advance_probability
  };
}

function teamPredictionFor(score, teamId) {
  return (score.teamFixturePredictions || []).find((row) => row.team_id === teamId) || null;
}

function projectionMultiplier(position, prior, teamPrediction) {
  const oldContext = prior.fixture_context || {};
  const oldXg = Math.max(0.35, Number(oldContext.expected_goals || 1.1));
  const oldCs = Math.max(0.05, Number(oldContext.clean_sheet_probability || 0.25));
  const newXg = Math.max(0.35, Number(teamPrediction?.expected_goals || oldXg));
  const newCs = Math.max(0.05, Number(teamPrediction?.clean_sheet_probability || oldCs));
  const xgRatio = clamp(newXg / oldXg, 0.65, 1.45);
  const csRatio = clamp(newCs / oldCs, 0.65, 1.45);
  if (["GK", "DEF"].includes(position)) return round(0.34 + csRatio * 0.5 + xgRatio * 0.16, 3);
  if (position === "MID") return round(0.34 + xgRatio * 0.46 + csRatio * 0.2, 3);
  return round(0.34 + xgRatio * 0.66, 3);
}

function buildProjections({ authority, role, score, qfProjections }) {
  const roleById = new Map(role.playerRoleRows.map((row) => [String(row.official_fantasy_player_id), row]));
  const mainTeams = teamSetFromAuthority(authority);
  const priorRows = rowsFromJson(qfProjections, ["playerMatchdayProjections"]);
  const rows = priorRows
    .filter((row) => mainTeams.has(row.team_id))
    .map((prior) => {
      const roleRow = roleById.get(String(prior.official_fantasy_player_id));
      if (!roleRow || roleRow.public_pool !== "main") return null;
      const fixture = fixtureForTeam(authority, prior.team_id);
      const opponent = opponentForTeam(fixture, prior.team_id);
      const teamPrediction = teamPredictionFor(score, prior.team_id);
      if (!fixture || !opponent || !teamPrediction) return null;
      const position = prior.official_fantasy_position || roleRow.official_fantasy_position;
      const unavailable = Number(roleRow.start_probability) <= 0 || Number(roleRow.expected_minutes) <= 0;
      const multiplier = projectionMultiplier(position, prior, teamPrediction);
      const minuteRatio = prior.expected_minutes ? clamp(Number(roleRow.expected_minutes) / Number(prior.expected_minutes), 0.4, 1.18) : 1;
      const volatilityPenalty = clamp(1 - Number(roleRow.role_volatility_score || 0) * 0.18, 0.86, 1);
      const raw = unavailable ? 0 : round(Number(prior.raw_expected_points || 0) * multiplier * minuteRatio * volatilityPenalty, 3);
      const riskAdjusted = unavailable ? 0 : round(raw * (0.77 + Number(roleRow.start_probability || 0) * 0.18), 3);
      const floor = unavailable ? 0 : round(Math.max(0.1, riskAdjusted * 0.27), 3);
      const ceiling = unavailable ? 0 : round(raw * (position === "FWD" ? 2.24 : position === "MID" ? 2.02 : 1.78) + Number(teamPrediction.expected_goals || 1), 3);
      const captainScore = unavailable ? 0 : round((riskAdjusted * 2.95 + ceiling * 1.12 + Number(teamPrediction.advance_probability || 0.5) * 9) * Number(roleRow.start_probability || 0), 3);
      return {
        ...prior,
        player_matchday_projection_id: `${prior.official_fantasy_player_id}-${MATCHDAY_ID}-fantasy-pool-v1`,
        matchday: MATCHDAY_ID,
        matchday_label: MATCHDAY_LABEL,
        opponent: opponent.team,
        opponent_team_id: opponent.team_id,
        fixture_id: fixture.fixture_id,
        match_id: fixture.fixture_id,
        match_number: fixture.bracket_match_number,
        side: sideForTeam(fixture, prior.team_id),
        expected_minutes: roleRow.expected_minutes,
        expectedMinutes: roleRow.expected_minutes,
        start_probability: roleRow.start_probability,
        startProb: roleRow.start_probability,
        raw_expected_points: raw,
        risk_adjusted_points: riskAdjusted,
        floor_points: floor,
        ceiling_points: ceiling,
        captain_score: captainScore,
        captainUpsideScore: captainScore,
        projection_confidence: roleRow.role_confidence,
        role_label: roleRow.role_label,
        role_confidence: roleRow.role_confidence,
        roleTier: roleRow.roleTier,
        evidenceStrength: roleRow.evidenceStrength,
        lineupEvidenceType: roleRow.lineupEvidenceType,
        qfStarted: roleRow.qfStarted,
        qfSubstitute: roleRow.qfSubstitute,
        qfLineupSource: roleRow.qfLineupSource,
        qfLineupEvidenceId: roleRow.qfLineupEvidenceId,
        r16Started: roleRow.r16Started,
        r32Started: roleRow.r32Started,
        roleCaution: roleRow.roleCaution,
        role_caution: roleRow.role_caution,
        majorRoleCaution: roleRow.majorRoleCaution,
        allowedCorePick: roleRow.allowedCorePick,
        coreEligibilityReason: roleRow.coreEligibilityReason,
        coreEligibilityWarning: roleRow.coreEligibilityWarning,
        role_volatility_score: roleRow.role_volatility_score,
        role_volatility_level: roleRow.role_volatility_level,
        fixture_context: {
          fixture_id: fixture.fixture_id,
          match_number: fixture.bracket_match_number,
          opponent_team_id: opponent.team_id,
          opponent: opponent.team,
          side: sideForTeam(fixture, prior.team_id),
          expected_goals: teamPrediction.expected_goals,
          expected_goals_against: teamPrediction.expected_goals_against,
          win_probability: teamPrediction.win_probability,
          draw_probability: teamPrediction.draw_probability,
          loss_probability: teamPrediction.loss_probability,
          clean_sheet_probability: teamPrediction.clean_sheet_probability,
          advance_probability: teamPrediction.advance_probability,
          fixture_difficulty_score: round((1 - Number(teamPrediction.advance_probability || 0.5)) * 100, 2),
          fixture_difficulty_band: Number(teamPrediction.advance_probability || 0) >= 0.58 ? "favorable" : Number(teamPrediction.advance_probability || 0) >= 0.42 ? "neutral" : "difficult",
          matchUncertainty: teamPrediction.matchUncertainty || "High",
          known_or_projected_path_status: "known_sf_fixture"
        },
        path_context: {
          sf_match_id: String(fixture.bracket_match_number),
          sf_opponent: opponent.team,
          sf_advance_probability: teamPrediction.advance_probability,
          winner_advances_to: fixture.winner_advances_to?.bracket_slot_id || null,
          loser_advances_to: fixture.loser_advances_to?.bracket_slot_id || null,
          known_path_status: "known_sf_fixture",
          hard_path_warning: Number(teamPrediction.advance_probability || 0) < 0.42 ? "Hard SF path; balance with safer picks." : null
        },
        path_value: round((Number(teamPrediction.advance_probability || 0.5) - 0.5) * 4 + 0.75, 3),
        projectionReason: roleRow.qfStarted === true
          ? "SF projection uses final SF fixture, explicit QF starter evidence as the primary role signal, R16/R32 continuity, and path value to Final/Third Place."
          : roleRow.lineupEvidenceType === "points_only_appearance"
            ? "SF projection treats QF fantasy points as appearance-only evidence; no start is inferred from points."
            : "SF projection downgrades role because explicit QF starter evidence is missing or negative.",
        caution: [
          roleRow.roleCaution || "",
          roleRow.role_volatility_level === "high" ? "Role volatility is elevated for this team." : "",
          Number(teamPrediction.advance_probability || 0) < 0.42 ? "Hard SF path." : ""
        ].filter(Boolean).join(" "),
        data_quality_flags: [
          "player_projection_sf_v1",
          "completed_qf_only",
          "qf_lineup_evidence_applied",
          "points_do_not_imply_start",
          "known_sf_fixture",
          "path_to_final_and_third_place_included",
          "ownership_not_used_as_signal",
          "final_squads_not_source_backed",
          ...(roleRow.data_quality_flags || [])
        ],
        model_stage: "active_sf_player_projection_support",
        modelVersion: "player-projection-sf-v1",
        defaultMatchday: MATCHDAY_ID
      };
    })
    .filter(Boolean);

  return {
    schema_version: "fantasy_pool_matchday_projections_sf_v1",
    generated_at: GENERATED_AT,
    source_checked: GENERATED_AT.slice(0, 10),
    modelVersion: "player-projection-sf-v1",
    model_version: "player-projection-sf-v1",
    model_stage: "active_sf_player_projection_support",
    data_status: "active_sf_projection_v1_pass",
    safety_labels: ["Semifinal fantasy setup", "explicit QF lineup evidence heavily weighted", "role volatility included", "ownership not used as signal", "final squads not source-backed"],
    input_files: ["data/playerRoleModel_sf_v1.json", "data/qfLineupEvidenceForSf_v1.json", "data/scorePredictions_fantasyPool_sf_v1.json", "data/fantasyPoolMatchdayProjections_qf_v1.json"],
    model: {
      defaultMatchday: MATCHDAY_ID,
      qf_points_used_as_start_evidence: false,
      points_can_imply_starter: false,
      explicit_qf_starter_required_for_core_pick: true,
      explicit_qf_starting_xi_available: role.summary.explicit_qf_starting_xi_available,
      eliminated_teams_excluded_from_main_public_rows: true
    },
    summary: {
      projection_rows: rows.length,
      sf_projection_rows: rows.length,
      known_fixture_teams: mainTeams.size,
      defaultMatchday: MATCHDAY_ID,
      ownershipUsedAsSignal: false,
      finalSquadsSourceBacked: false,
      topProjectedSfPlayers: rows.slice().sort((a, b) => b.risk_adjusted_points - a.risk_adjusted_points).slice(0, 25).map((row) => ({
        name: row.name,
        country: row.country,
        position: row.official_fantasy_position,
        opponent: row.opponent,
        projectedPoints: row.risk_adjusted_points,
        captainScore: row.captain_score,
        lineupEvidenceType: row.lineupEvidenceType,
        qfStarted: row.qfStarted
      }))
    },
    qa_status: "pass",
    playerMatchdayProjections: rows
  };
}

function isCorePickEligible(row) {
  return row.allowedCorePick === true &&
    row.qfStarted === true &&
    row.lineupEvidenceType === "explicit_qf_starter" &&
    Number(row.start_probability || 0) >= 0.78 &&
    Number(row.risk_adjusted_points || 0) >= 3.2 &&
    !row.majorRoleCaution &&
    !(row.data_quality_flags || []).includes("points_only_appearance_not_start");
}

function modeRows(projectionRows, mode) {
  const scoreForMode = (row) => {
    if (mode === "safe") return Number(row.floor_points || 0) * 8 + Number(row.start_probability || 0) * 30 + Number(row.risk_adjusted_points || 0) * 10;
    if (mode === "upside") return Number(row.ceiling_points || 0) * 10 + Number(row.captain_score || 0);
    if (mode === "differential") return Number(row.ceiling_points || 0) * 8 + Number(row.risk_adjusted_points || 0) * 5 - Number(row.official_price || 0) * 0.3;
    if (mode === "captain") return Number(row.captain_score || 0);
    return Number(row.risk_adjusted_points || 0) * 14 + Number(row.start_probability || 0) * 22 + Number(row.path_value || 0) * 8 - Number(row.role_volatility_score || 0) * 3;
  };
  const candidates = mode === "balanced" ? projectionRows.filter(isCorePickEligible) : projectionRows.filter((row) => row.public_pool !== "excluded");
  return candidates.slice().sort((a, b) => scoreForMode(b) - scoreForMode(a)).slice(0, 25).map((row, index) => ({ row, score: round(scoreForMode(row), 3), rank: index + 1 }));
}

function buildRecommendations({ projections }) {
  const modes = [["balanced", "Core Picks"], ["safe", "High-Floor Picks"], ["upside", "Upside Picks"], ["differential", "Differential Picks"], ["captain", "Captain Watchlist"]];
  const recommendationCandidates = modes.flatMap(([mode, label]) =>
    modeRows(projections.playerMatchdayProjections, mode).map(({ row, score, rank }) => ({
      ...row,
      internal_player_id: row.internal_player_id,
      playerId: row.internal_player_id,
      position: row.official_fantasy_position,
      price: row.official_price,
      mode,
      mode_label: label,
      pickType: label,
      recommendation_surface: mode,
      rank,
      projectedPoints: row.raw_expected_points,
      captainUpsideScore: row.captain_score,
      recommendation_score: score,
      recommendation_tier: rank <= 5 ? "top_pick_candidate" : rank <= 15 ? "strong_candidate" : "watchlist_candidate",
      hard_path_warning: row.path_context?.hard_path_warning || null,
      role_caution: row.caution || row.roleCaution || null,
      allowedCorePick: row.allowedCorePick,
      coreEligibilityReason: row.coreEligibilityReason,
      coreEligibilityWarning: row.coreEligibilityWarning,
      why_pick: [
        `${row.risk_adjusted_points} projected SF points`,
        `${Math.round(Number(row.start_probability || 0) * 100)}% start chance`,
        row.qfStarted === true ? "source-backed QF starter" : "",
        row.path_value > 0 ? "path value to Final/Third Place" : "known SF fixture"
      ].filter(Boolean),
      why_careful: [
        row.caution || "",
        mode === "balanced" ? "" : row.coreEligibilityWarning || "",
        "Verify official locks/deadlines/lineups in FIFA."
      ].filter(Boolean),
      model_stage: "active_sf_recommendations",
      source_model_version: "recommendation-sf-v1"
    }))
  );
  const captainRows = recommendationCandidates.filter((row) => row.mode === "captain");
  return {
    schema_version: "fantasy_pool_matchday_recommendations_sf_v1",
    generated_at: GENERATED_AT,
    source_checked: GENERATED_AT.slice(0, 10),
    modelVersion: "recommendation-sf-v1",
    model_version: "recommendation-sf-v1",
    model_stage: "active_sf_recommendations",
    data_status: "active_sf_recommendations_v1_pass",
    safety_labels: ["Semifinal fantasy setup", "Core Picks require explicit QF starter evidence", "role volatility matters more now", "ownership not used as signal", "final squads not source-backed"],
    input_files: ["data/fantasyPoolMatchdayProjections_sf_v1.json", "data/qfLineupEvidenceForSf_v1.json", "data/sfFixtureAuthority_v1.json"],
    model: {
      defaultMatchday: MATCHDAY_ID,
      path_value_included: true,
      finance_secondary_only: true,
      explicit_qf_starter_required_for_core_pick: true,
      points_can_imply_starter: false,
      eliminated_teams_excluded_from_main_public_picks: true
    },
    summary: {
      recommendationCandidates: recommendationCandidates.length,
      sfCandidates: recommendationCandidates.length,
      corePickRows: recommendationCandidates.filter((row) => row.mode === "balanced").length,
      corePickRowsWithoutExplicitQfStart: recommendationCandidates.filter((row) => row.mode === "balanced" && !isCorePickEligible(row)).length,
      modes: modes.map(([mode]) => mode),
      knownSfFixturesUsed: 2,
      defaultMatchday: MATCHDAY_ID,
      ownershipUsedAsSignal: false,
      finalSquadsSourceBacked: false,
      topCaptainWatchlist: captainRows.slice(0, 20).map((row) => ({ name: row.name, country: row.country, opponent: row.opponent, captainScore: row.captain_score, rank: row.rank }))
    },
    qa_status: "pass",
    recommendationCandidates
  };
}

function buildTeamBuilder({ projections, recommendations }) {
  const rows = projections.playerMatchdayProjections || [];
  const eligible = rows.filter(isCorePickEligible);
  const pickPosition = (position, count, used) => eligible
    .filter((row) => row.official_fantasy_position === position && !used.has(row.official_fantasy_player_id))
    .sort((a, b) =>
      (Number(b.risk_adjusted_points || 0) * 10 + Number(b.start_probability || 0) * 8 + Number(b.captain_score || 0) * 0.18 + Number(b.path_value || 0) * 2) -
      (Number(a.risk_adjusted_points || 0) * 10 + Number(a.start_probability || 0) * 8 + Number(a.captain_score || 0) * 0.18 + Number(a.path_value || 0) * 2)
    )
    .slice(0, count);
  const used = new Set();
  const balanced = [];
  for (const [position, count] of [["GK", 2], ["DEF", 5], ["MID", 5], ["FWD", 3]]) {
    const picks = pickPosition(position, count, used);
    picks.forEach((row) => used.add(row.official_fantasy_player_id));
    balanced.push(...picks);
  }
  const greedy = eligible.slice().sort((a, b) => Number(b.risk_adjusted_points || 0) - Number(a.risk_adjusted_points || 0)).slice(0, 15);
  const byPosition = eligible.reduce((counts, row) => {
    const key = row.official_fantasy_position || "unknown";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
  const balancedByPosition = balanced.reduce((counts, row) => {
    const key = row.official_fantasy_position || "unknown";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
  const unsafe = balanced.filter((row) => !isCorePickEligible(row));
  const status = balanced.length === 15 && unsafe.length === 0 ? "pass" : "fail";
  return {
    schema_version: "team_builder_qa_sf_v1",
    generated_at: GENERATED_AT,
    model_version: "team-builder-sf-v1",
    status,
    summary: {
      projection_rows: rows.length,
      builder_eligible_rows: eligible.length,
      recommendation_rows: recommendations.recommendationCandidates.length,
      by_position: byPosition,
      balanced_by_position: balancedByPosition,
      defaultMatchday: MATCHDAY_ID,
      balanced_projected_points: round(balanced.reduce((sum, row) => sum + Number(row.risk_adjusted_points || 0), 0), 2),
      greedy_projected_points: round(greedy.reduce((sum, row) => sum + Number(row.risk_adjusted_points || 0), 0), 2),
      balanced_vs_greedy_delta: round(balanced.reduce((sum, row) => sum + Number(row.risk_adjusted_points || 0), 0) - greedy.reduce((sum, row) => sum + Number(row.risk_adjusted_points || 0), 0), 2),
      path_value_to_final_third_place_included: true,
      role_volatility_included: true,
      explicit_qf_starters_only_for_builder_samples: unsafe.length === 0,
      points_only_rows_used_as_starters: unsafe.filter((row) => row.lineupEvidenceType === "points_only_appearance").length,
      eliminated_and_unavailable_excluded: true
    },
    balanced_squad: balanced.map(builderRow),
    greedy_baseline: greedy.map(builderRow),
    omitted_star_diagnostics: rows
      .filter((row) => !balanced.some((pick) => pick.official_fantasy_player_id === row.official_fantasy_player_id))
      .sort((a, b) => Number(b.captain_score || 0) - Number(a.captain_score || 0))
      .slice(0, 15)
      .map((row) => ({ name: row.name, country: row.country, position: row.official_fantasy_position, reason: row.coreEligibilityWarning || row.roleCaution || "Squad balance/position limit.", qfStarted: row.qfStarted, lineupEvidenceType: row.lineupEvidenceType })),
    role_volatility_diagnostics: rows
      .filter((row) => row.role_volatility_level !== "low")
      .slice(0, 25)
      .map((row) => ({ name: row.name, country: row.country, role_volatility_level: row.role_volatility_level, qfStarted: row.qfStarted, r16Started: row.r16Started, caution: row.roleCaution })),
    unsafe_sample_rows: unsafe.map(builderRow)
  };
}

function builderRow(row) {
  return {
    name: row.name,
    country: row.country,
    position: row.official_fantasy_position,
    points: row.risk_adjusted_points,
    opponent: row.opponent,
    start_probability: row.start_probability,
    lineupEvidenceType: row.lineupEvidenceType,
    qfStarted: row.qfStarted,
    role_caution: row.roleCaution || null,
    coreEligibilityReason: row.coreEligibilityReason
  };
}

function buildPeleAudit({ authority }) {
  const teamQuality = readJson("data/teamQuality.json", { teams: [] });
  const byTeam = new Map((teamQuality.teams || []).map((row) => [row.team_id || slug(row.country), row]));
  const sfTeams = [...teamSetFromAuthority(authority)].sort();
  const missing = sfTeams.filter((teamId) => !byTeam.has(teamId));
  const duplicates = (teamQuality.teams || []).map((row) => row.team_id || slug(row.country)).filter((teamId, index, list) => teamId && list.indexOf(teamId) !== index);
  const invalidNumeric = (teamQuality.teams || []).filter((row) => {
    const values = [row.team_quality_v2?.overall_score, row.team_quality_v1?.overall_score, row.goals_clean_sheet_inputs_v2?.attack_proxy_score, row.goals_clean_sheet_inputs_v2?.defense_proxy_score].filter(hasValue);
    return values.some((value) => !Number.isFinite(Number(value)));
  });
  return {
    schema_version: "pele_refresh_audit_sf_v1",
    generated_at: GENERATED_AT,
    status: missing.length || duplicates.length || invalidNumeric.length ? "fail" : "pass",
    refresh_result: "no_source_change_documented_current_team_quality_used",
    summary: {
      sf_team_count: sfTeams.length,
      missing_teams: missing.length,
      duplicate_team_keys: [...new Set(duplicates)].length,
      invalid_numeric_values: invalidNumeric.length,
      fixture_team_mappings_safe: missing.length === 0
    },
    sf_teams: sfTeams,
    missing_teams: missing,
    duplicate_team_keys: [...new Set(duplicates)],
    invalid_numeric_rows: invalidNumeric.slice(0, 20)
  };
}

function buildPostmortem({ qfScore, live, role }) {
  const liveRows = rowsFromJson(live, ["fixtures"]);
  const predictions = rowsFromJson(qfScore, ["fixtureScorePredictions"]);
  const residuals = predictions.map((prediction) => {
    const liveFixture = liveRows.find((row) => row.local_fixture_id === prediction.fixture_id || Number(row.match_number) === Number(prediction.match_number));
    return {
      match_number: prediction.match_number,
      fixture: `${prediction.home_team} vs ${prediction.away_team}`,
      predicted_xg: `${prediction.home_expected_goals}-${prediction.away_expected_goals}`,
      actual_score: liveFixture?.home_score !== null ? `${liveFixture.home_score}-${liveFixture.away_score}` : "missing",
      home_goal_residual: liveFixture?.home_score !== null ? round(Number(liveFixture.home_score) - Number(prediction.home_expected_goals), 3) : null,
      away_goal_residual: liveFixture?.away_score !== null ? round(Number(liveFixture.away_score) - Number(prediction.away_expected_goals), 3) : null,
      predicted_winner: prediction.favorite_team,
      actual_winner: liveFixture?.home_score > liveFixture?.away_score ? prediction.home_team : prediction.away_team
    };
  });
  const roleRows = rowsFromJson(role, ["playerRoleRows"]);
  const dataset = {
    schema_version: "knockout_calibration_dataset_for_sf_v1",
    generated_at: GENERATED_AT,
    evidence_scope: ["group_stage", "R32", "R16", "QF"],
    qf_residuals: residuals,
    qf_actual_player_points_sample: roleRows.filter((row) => row.public_pool === "main").slice(0, 50).map((row) => ({ name: row.name, team: row.country, qf_round_points: row.qf_round_points, qfStarted: row.qfStarted })),
    qf_participation_evidence: {
      qf_starters: roleRows.filter((row) => row.public_pool === "main" && row.qfStarted === true).length,
      qf_non_starters: roleRows.filter((row) => row.team_id && row.qfStarted === false).length,
      points_only_rows: roleRows.filter((row) => row.lineupEvidenceType === "points_only_appearance").length
    }
  };
  const postmortem = {
    schema_version: "knockout_model_postmortem_for_sf_v1",
    generated_at: GENERATED_AT,
    status: residuals.every((row) => row.actual_score !== "missing") ? "pass" : "fail",
    residuals,
    role_changes: {
      players_started_r32_r16_qf: roleRows.filter((row) => row.qfStarted === true && row.r16Started === true && row.r32Started === true).map((row) => row.name),
      qf_starters_not_r16_starters: roleRows.filter((row) => row.qfStarted === true && row.r16Started !== true).map((row) => row.name),
      r16_starters_not_qf_starters: roleRows.filter((row) => row.r16Started === true && row.qfStarted !== true).map((row) => row.name),
      high_projection_weak_role: roleRows.filter((row) => row.public_pool === "main" && Number(row.start_probability) < 0.55 && Number(row.qf_round_points || 0) >= 4).map((row) => row.name)
    },
    interpretation: "QF starting XI evidence is the primary SF role signal. Fantasy points are appearance/performance evidence only."
  };
  return { dataset, postmortem };
}

function qaReports({ authority, role, score, projections, recommendations, teamBuilder }) {
  const projectionRows = projections.playerMatchdayProjections || [];
  const recRows = recommendations.recommendationCandidates || [];
  const coreRows = recRows.filter((row) => row.mode === "balanced");
  const unsafeCore = coreRows.filter((row) => !isCorePickEligible(row));
  const roleQa = {
    schema_version: "player_role_model_qa_sf_v1",
    generated_at: GENERATED_AT,
    status: role.summary.explicit_qf_starting_xi_available && role.summary.points_only_start_inference_rows === 0 ? "pass" : "fail",
    summary: role.summary,
    top_sf_starters_by_confidence: role.playerRoleRows.filter((row) => row.public_pool === "main").sort((a, b) => Number(b.start_probability) - Number(a.start_probability)).slice(0, 25),
    qf_bench_players_downgraded: role.playerRoleRows.filter((row) => row.team_id && row.qfStarted === false && Number(row.start_probability) < 0.5).slice(0, 30),
    targeted_audits: role.audits,
    warnings: ["Fantasy points are treated as appearance/performance evidence only.", "No semifinal predicted XI is treated as confirmed unless source-backed."]
  };
  const scoreQa = {
    schema_version: "score_prediction_qa_sf_v1",
    generated_at: GENERATED_AT,
    status: score.summary.fixture_prediction_count === 2 && score.summary.final_known_fixture_predictions === 2 ? "pass" : "fail",
    summary: score.summary,
    fixture_predictions: score.fixtureScorePredictions
  };
  const projectionQa = {
    schema_version: "player_projection_qa_sf_v1",
    generated_at: GENERATED_AT,
    status: projectionRows.length &&
      projectionRows.every((row) => row.matchday === MATCHDAY_ID) &&
      projectionRows.every((row) => row.team_id && ["france", "spain", "england", "argentina"].includes(row.team_id)) &&
      projectionRows.filter((row) => row.lineupEvidenceType === "points_only_appearance" && !row.roleCaution).length === 0
      ? "pass"
      : "fail",
    summary: projections.summary,
    top_25_final_sf_projected_players: projectionRows.slice().sort((a, b) => b.risk_adjusted_points - a.risk_adjusted_points).slice(0, 25),
    points_only_rows: projectionRows.filter((row) => row.lineupEvidenceType === "points_only_appearance")
  };
  const recommendationQa = {
    schema_version: "recommendation_qa_sf_v1",
    generated_at: GENERATED_AT,
    status: unsafeCore.length === 0 && recRows.every((row) => row.matchday === MATCHDAY_ID) ? "pass" : "fail",
    summary: recommendations.summary,
    unsafe_core_pick_rows: unsafeCore,
    top_25_final_sf_projected_players: projectionQa.top_25_final_sf_projected_players,
    top_20_captain_watchlist: recRows.filter((row) => row.mode === "captain").slice(0, 20),
    targeted_audits: role.audits
  };
  const releaseQa = {
    schema_version: "sf_release_qa_v1",
    generated_at: GENERATED_AT,
    status: [roleQa, scoreQa, projectionQa, recommendationQa].every((qa) => qa.status === "pass") && teamBuilder.status === "pass" ? "pass" : "fail",
    checks: [
      { id: "sf_fixture_authority", status: authority.status },
      { id: "sf_role_model", status: roleQa.status },
      { id: "sf_score_model", status: scoreQa.status },
      { id: "sf_projection_model", status: projectionQa.status },
      { id: "sf_recommendations", status: recommendationQa.status },
      { id: "sf_team_builder", status: teamBuilder.status }
    ]
  };
  return { roleQa, scoreQa, projectionQa, recommendationQa, releaseQa };
}

async function writeBrowserWrappers({ score, projections, recommendations }) {
  const qfScore = readJson("data/scorePredictions_fantasyPool_qf_v1.json", {});
  const r16Score = readJson("data/scorePredictions_fantasyPool_r16_v1.json", {});
  const r32Score = readJson("data/scorePredictions_fantasyPool_r32_v1.json", {});
  const qfProjection = readJson("data/fantasyPoolMatchdayProjections_qf_v1.json", {});
  const r16Projection = readJson("data/fantasyPoolMatchdayProjections_r16_v1.json", {});
  const r32Projection = readJson("data/fantasyPoolMatchdayProjections_r32_v1.json", {});
  const qfRecommendation = readJson("data/fantasyPoolRecommendations_qf_v1.json", {});
  const r16Recommendation = readJson("data/fantasyPoolRecommendations_r16_v1.json", {});
  const r32Recommendation = readJson("data/fantasyPoolRecommendations_r32_v1.json", {});
  const scoreBrowser = {
    ...score,
    fixtureScorePredictions: [...score.fixtureScorePredictions, ...(qfScore.fixtureScorePredictions || []), ...(r16Score.fixtureScorePredictions || []), ...(r32Score.fixtureScorePredictions || [])],
    teamFixturePredictions: [...score.teamFixturePredictions, ...(qfScore.teamFixturePredictions || []), ...(r16Score.teamFixturePredictions || []), ...(r32Score.teamFixturePredictions || [])]
  };
  const projectionBrowser = {
    ...projections,
    playerMatchdayProjections: [...projections.playerMatchdayProjections, ...(qfProjection.playerMatchdayProjections || []), ...(r16Projection.playerMatchdayProjections || []), ...(r32Projection.playerMatchdayProjections || [])]
  };
  const recommendationBrowser = {
    ...recommendations,
    recommendationCandidates: [...recommendations.recommendationCandidates, ...(qfRecommendation.recommendationCandidates || []), ...(r16Recommendation.recommendationCandidates || []), ...(r32Recommendation.recommendationCandidates || [])]
  };
  await writeFile("fantasyPoolScorePredictionsData.js", [
    "// Generated by scripts/buildScorePredictionsFantasyPoolSfV1.mjs.",
    "// Active final SF score prediction browser data plus QF/R16/R32 history.",
    `window.FANTASY_POOL_SCORE_PREDICTIONS_DATA = ${JSON.stringify(scoreBrowser)};`,
    "window.FANTASY_POOL_SCORE_FIXTURE_PREDICTIONS = window.FANTASY_POOL_SCORE_PREDICTIONS_DATA.fixtureScorePredictions;",
    "window.FANTASY_POOL_TEAM_FIXTURE_PREDICTIONS = window.FANTASY_POOL_SCORE_PREDICTIONS_DATA.teamFixturePredictions;",
    "window.FANTASY_POOL_SCORE_PREDICTIONS_SUMMARY = window.FANTASY_POOL_SCORE_PREDICTIONS_DATA.summary;",
    ""
  ].join("\n"), "utf8");
  await writeFile("fantasyPoolMatchdayProjectionsData.js", [
    "// Generated by scripts/buildFantasyPoolMatchdayProjectionsSfV1.mjs.",
    "// Active final SF projection browser data plus QF/R16/R32 history.",
    `window.FANTASY_POOL_MATCHDAY_PROJECTIONS_DATA = ${JSON.stringify(projectionBrowser)};`,
    "window.FANTASY_POOL_PLAYER_MATCHDAY_PROJECTIONS = window.FANTASY_POOL_MATCHDAY_PROJECTIONS_DATA.playerMatchdayProjections;",
    "window.FANTASY_POOL_MATCHDAY_PROJECTIONS_SUMMARY = window.FANTASY_POOL_MATCHDAY_PROJECTIONS_DATA.summary;",
    ""
  ].join("\n"), "utf8");
  await writeFile("fantasyPoolRecommendationsData.js", [
    "// Generated by scripts/buildFantasyPoolRecommendationsSfV1.mjs.",
    "// Active final SF recommendations plus QF/R16/R32 history rows.",
    `window.FANTASY_POOL_RECOMMENDATIONS_DATA = ${JSON.stringify(recommendationBrowser)};`,
    "window.FANTASY_POOL_RECOMMENDATION_CANDIDATES = window.FANTASY_POOL_RECOMMENDATIONS_DATA.recommendationCandidates;",
    "window.FANTASY_POOL_RECOMMENDATIONS_SUMMARY = window.FANTASY_POOL_RECOMMENDATIONS_DATA.summary;",
    ""
  ].join("\n"), "utf8");
}

async function writeReports({ authority, role, score, projections, recommendations, teamBuilder, qas, postmortem, peleAudit, lineupEvidence }) {
  await writeText("data/playerRoleModel_sf_v1.md", "# Player Role Model SF v1\n\n" + mdTable(["Metric", "Value"], Object.entries(role.summary).filter(([, value]) => typeof value !== "object").map(([key, value]) => [key, value])));
  await writeText("data/playerRoleModelQaReport_sf_v1.md", "# Player Role Model QA SF v1\n\nStatus: " + qas.roleQa.status + "\n\n" + qas.roleQa.warnings.map((warning) => `- ${warning}`).join("\n"));
  await writeText("data/scorePredictionModel_sf_v1.md", "# Score Prediction Model SF v1\n\n" + mdTable(["Metric", "Value"], Object.entries(score.summary).map(([key, value]) => [key, value])));
  await writeText("data/scorePredictionQaReport_sf_v1.md", "# Score Prediction QA SF v1\n\nStatus: " + qas.scoreQa.status + "\n");
  await writeText("data/playerProjectionModel_sf_v1.md", "# Player Projection Model SF v1\n\n" + mdTable(["Metric", "Value"], Object.entries(projections.summary).filter(([, value]) => typeof value !== "object").map(([key, value]) => [key, value])));
  await writeText("data/playerProjectionQaReport_sf_v1.md", "# Player Projection QA SF v1\n\nStatus: " + qas.projectionQa.status + "\n");
  await writeText("data/recommendationModel_sf_v1.md", "# Recommendation Model SF v1\n\n" + mdTable(["Metric", "Value"], Object.entries(recommendations.summary).filter(([, value]) => typeof value !== "object").map(([key, value]) => [key, value])));
  await writeText("data/recommendationQaReport_sf_v1.md", "# Recommendation QA SF v1\n\nStatus: " + qas.recommendationQa.status + "\n");
  await writeText("data/teamBuilderModel_sf_v1.md", "# Team Builder Model SF v1\n\n" + mdTable(["Metric", "Value"], Object.entries(teamBuilder.summary).map(([key, value]) => [key, typeof value === "object" ? JSON.stringify(value) : value])));
  await writeText("data/teamBuilderQaReport_sf_v1.md", "# Team Builder QA SF v1\n\nStatus: " + teamBuilder.status + "\n");
  await writeText("data/sfReleaseQaReport_v1.md", [
    "# SF Release QA v1",
    "",
    `Generated: ${qas.releaseQa.generated_at}`,
    "",
    `Status: ${qas.releaseQa.status}`,
    "",
    mdTable(["Check", "Status"], qas.releaseQa.checks.map((row) => [row.id, row.status]))
  ].join("\n"));
  await writeText("data/knockoutModelPostmortemReport_for_sf_v1.md", [
    "# Knockout Model Postmortem For SF v1",
    "",
    `Generated: ${postmortem.generated_at}`,
    "",
    `Status: ${postmortem.status}`,
    "",
    mdTable(["Match", "Fixture", "Pred xG", "Actual", "Home residual", "Away residual"], postmortem.residuals.map((row) => [row.match_number, row.fixture, row.predicted_xg, row.actual_score, row.home_goal_residual, row.away_goal_residual]))
  ].join("\n"));
  await writeText("data/peleRefreshAudit_sf_v1.md", [
    "# PELE Refresh Audit SF v1",
    "",
    `Generated: ${peleAudit.generated_at}`,
    "",
    `Status: ${peleAudit.status}`,
    "",
    mdTable(["Metric", "Value"], Object.entries(peleAudit.summary).map(([key, value]) => [key, value]))
  ].join("\n"));
  await writeText("data/qfLineupEvidenceForSfReport_v1.md", [
    "# QF Lineup Evidence For SF v1",
    "",
    `Generated: ${lineupEvidence.generated_at}`,
    "",
    `Status: ${lineupEvidence.status}`,
    "",
    mdTable(["Metric", "Value"], Object.entries(lineupEvidence.summary).filter(([, value]) => typeof value !== "object").map(([key, value]) => [key, value]))
  ].join("\n"));
}

export async function buildSfArtifacts() {
  const authority = readJson("data/sfFixtureAuthority_v1.json");
  const officialPlayers = readJson("data/officialFantasyPlayers_v0.json");
  const live = readJson("data/liveMatchdayStatus_v1.json");
  const livePlayers = readJson("data/livePlayerStatus_v1.json");
  const qfProjections = readJson("data/fantasyPoolMatchdayProjections_qf_v1.json");
  const qfRole = readJson("data/playerRoleModel_qf_v1.json");
  const qfScore = readJson("data/scorePredictions_fantasyPool_qf_v1.json");
  const knockout = readJson("data/knockoutScorePredictor_v1.json");
  const lineupEvidence = readJson("data/worldCupLineupEvidence_v1.json");
  const lineupNews = readJson("data/sfLineupNewsAudit_v1.json", { teams: [] });

  const qfLineupEvidence = buildQfLineupEvidence(officialPlayers);
  const role = buildRoleModel({ authority, officialPlayers, livePlayers, qfProjections, qfRole, lineupEvidence, qfLineupEvidence, lineupNews });
  const score = buildScorePredictions({ authority, knockout });
  const projections = buildProjections({ authority, role, score, qfProjections });
  const recommendations = buildRecommendations({ projections });
  const teamBuilder = buildTeamBuilder({ projections, recommendations });
  const peleAudit = buildPeleAudit({ authority });
  const { dataset, postmortem } = buildPostmortem({ qfScore, live, role });
  const qas = qaReports({ authority, role, score, projections, recommendations, teamBuilder });

  await writeJson("data/qfLineupEvidenceForSf_v1.json", qfLineupEvidence);
  await writeJson("data/playerRoleModel_sf_v1.json", role);
  await writeJson("data/playerRoleModelQa_sf_v1.json", qas.roleQa);
  await writeJson("data/scorePredictions_fantasyPool_sf_v1.json", score, true);
  await writeJson("data/scorePredictionQa_sf_v1.json", qas.scoreQa);
  await writeJson("data/fantasyPoolMatchdayProjections_sf_v1.json", projections, true);
  await writeJson("data/playerProjectionQa_sf_v1.json", qas.projectionQa);
  await writeJson("data/fantasyPoolRecommendations_sf_v1.json", recommendations, true);
  await writeJson("data/recommendationQa_sf_v1.json", qas.recommendationQa);
  await writeJson("data/teamBuilderQa_sf_v1.json", teamBuilder);
  await writeJson("data/sfReleaseQa_v1.json", qas.releaseQa);
  await writeJson("data/knockoutCalibrationDataset_for_sf_v1.json", dataset);
  await writeJson("data/knockoutModelPostmortem_for_sf_v1.json", postmortem);
  await writeJson("data/peleRefreshAudit_sf_v1.json", peleAudit);
  await writeReports({ authority, role, score, projections, recommendations, teamBuilder, qas, postmortem, peleAudit, lineupEvidence: qfLineupEvidence });
  await writeBrowserWrappers({ score, projections, recommendations });

  return { authority, qfLineupEvidence, role, score, projections, recommendations, teamBuilder, releaseQa: qas.releaseQa, peleAudit, postmortem, cacheBust: CACHE_BUST };
}

export { MATCHDAY_ID, MATCHDAY_LABEL, CACHE_BUST };
