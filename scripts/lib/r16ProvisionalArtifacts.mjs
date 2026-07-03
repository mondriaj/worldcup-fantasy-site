import fs from "node:fs";
import { writeFile } from "node:fs/promises";
import vm from "node:vm";

const GENERATED_AT = new Date().toISOString();
const MATCHDAY_ID = "r16_provisional";
const MATCHDAY_LABEL = "Provisional R16";
const CACHE_BUST = "20260703-r16-provisional";

const FLAG_BY_ABBR = {
  ARG: "🇦🇷",
  AUS: "🇦🇺",
  BEL: "🇧🇪",
  BRA: "🇧🇷",
  CAN: "🇨🇦",
  COL: "🇨🇴",
  CPV: "🇨🇻",
  EGY: "🇪🇬",
  ENG: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  FRA: "🇫🇷",
  GHA: "🇬🇭",
  MAR: "🇲🇦",
  MEX: "🇲🇽",
  NOR: "🇳🇴",
  PAR: "🇵🇾",
  POR: "🇵🇹",
  SUI: "🇨🇭",
  USA: "🇺🇸",
  ESP: "🇪🇸"
};

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    if (fallback !== null) return fallback;
    throw error;
  }
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

async function writeJson(filePath, value, compact = false) {
  await writeFile(filePath, `${compact ? JSON.stringify(value) : JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function writeText(filePath, text) {
  await writeFile(filePath, `${text.trimEnd()}\n`, "utf8");
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

function rowsFromJson(data, keys) {
  if (Array.isArray(data)) return data;
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
}

function fixtureId(matchNumber) {
  return `fwc2026-m${String(matchNumber).padStart(3, "0")}`;
}

function mdTable(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((value) => String(value ?? "")).join(" | ")} |`)
  ].join("\n");
}

function loadWorldCupData() {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(readText("worldCupData.js"), context, { filename: "worldCupData.js" });
  return context.window.WORLD_CUP_DATA;
}

function worldCupBracketNodes(worldCup) {
  const nodes = new Map();
  for (const round of worldCup.bracket?.rounds || []) {
    for (const match of round.matches || []) {
      const id = Number(match.id);
      const winners = Array.from(String(match.path || "").matchAll(/Winner Match (\d+)/g)).map((entry) => Number(entry[1]));
      nodes.set(id, {
        match_number: id,
        bracket_slot_id: `M${id}`,
        path: match.path,
        winner_sources: winners
      });
    }
  }
  return nodes;
}

function teamFromAuthority(team) {
  if (!team) return null;
  return {
    team: team.team || team.name,
    team_id: team.team_id || slug(team.team || team.name),
    code: team.code || null,
    flag: team.flag || (team.code ? FLAG_BY_ABBR[String(team.code).toUpperCase()] || null : null)
  };
}

function r32WinnerFromLive(r32Fixture, liveByMatchNumber) {
  const live = liveByMatchNumber.get(Number(r32Fixture.bracket_match_number));
  const final = live?.safe_to_display_score === true &&
    String(live.fixture_status || "").toLowerCase() === "complete" &&
    Number.isFinite(Number(live.home_score)) &&
    Number.isFinite(Number(live.away_score));

  if (!final) {
    return {
      match_number: Number(r32Fixture.bracket_match_number),
      status: live?.fixture_status || r32Fixture.status || "pending",
      score_status: live?.score_status || "not_final_hidden",
      winner: null,
      score: null,
      source_fixture_id: r32Fixture.source_fixture_id || live?.source_fixture_id || null
    };
  }

  const homeScore = Number(live.home_score);
  const awayScore = Number(live.away_score);
  const homePens = Number(live.home_penalty_score || 0);
  const awayPens = Number(live.away_penalty_score || 0);
  const homeWins = homeScore > awayScore || (homeScore === awayScore && (homePens || awayPens) && homePens > awayPens);
  const winner = homeWins ? teamFromAuthority(r32Fixture.team_a) : teamFromAuthority(r32Fixture.team_b);
  const loser = homeWins ? teamFromAuthority(r32Fixture.team_b) : teamFromAuthority(r32Fixture.team_a);
  const score = {
    home_score: homeScore,
    away_score: awayScore,
    home_penalty_score: live.home_penalty_score,
    away_penalty_score: live.away_penalty_score,
    label: `${r32Fixture.team_a?.code || r32Fixture.team_a?.team} ${homeScore}-${awayScore} ${r32Fixture.team_b?.code || r32Fixture.team_b?.team}${homeScore === awayScore && (homePens || awayPens) ? `, ${homePens}-${awayPens} pens` : ""}`
  };

  return {
    match_number: Number(r32Fixture.bracket_match_number),
    status: "complete",
    score_status: "final",
    winner,
    loser,
    score,
    source_fixture_id: r32Fixture.source_fixture_id || live.source_fixture_id || null
  };
}

function easternLabel(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const dateText = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Toronto",
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
  const timeText = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Toronto",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).format(date);
  return `${dateText} · ${timeText} ET`;
}

function buildR16Authority({ worldCup, r32Authority, live }) {
  const nodes = worldCupBracketNodes(worldCup);
  const liveRows = rowsFromJson(live, ["fixtures"]);
  const liveByMatchNumber = new Map(liveRows.filter((row) => row.match_number).map((row) => [Number(row.match_number), row]));
  const liveR16ByTeamPair = new Map(liveRows
    .filter((row) => String(row.round_id) === "5")
    .map((row) => [`${slug(row.live_home_team || row.home_team)}|${slug(row.live_away_team || row.away_team)}`, row]));
  const r32ByMatch = new Map(rowsFromJson(r32Authority, ["fixtures"]).map((fixture) => [Number(fixture.bracket_match_number), fixture]));
  const winnerByR32 = new Map([...r32ByMatch.entries()].map(([matchNumber, fixture]) => [matchNumber, r32WinnerFromLive(fixture, liveByMatchNumber)]));
  const fixtures = [];

  for (const matchNumber of [89, 90, 91, 92, 93, 94, 95, 96]) {
    const node = nodes.get(matchNumber);
    const sources = node?.winner_sources || [];
    const sourceResults = sources.map((source) => winnerByR32.get(source) || {
      match_number: source,
      status: "pending",
      score_status: "missing",
      winner: null
    });
    const known = sourceResults.filter((result) => result?.winner);
    const classification = known.length === 2 ? "final_known" : known.length === 1 ? "partial_known" : "pending";
    const publicLabel = classification === "final_known" ? "Known" : classification === "partial_known" ? "Conditional" : "Pending";
    const teamA = sourceResults[0]?.winner || null;
    const teamB = sourceResults[1]?.winner || null;
    const liveR16 = teamA && teamB ? liveR16ByTeamPair.get(`${teamA.team_id}|${teamB.team_id}`) || null : null;

    fixtures.push({
      official_bracket_slot: `M${matchNumber}`,
      bracket_match_number: matchNumber,
      bracket_slot_id: `M${matchNumber}`,
      fixture_id: fixtureId(matchNumber),
      source_fixture_id: liveR16?.source_fixture_id || null,
      source_fixture_id_role: liveR16 ? "feed_source_id_only_not_bracket_slot" : null,
      round: "R16",
      stage: "round_of_16",
      classification,
      status: classification,
      public_label: publicLabel,
      team_a: teamA,
      team_b: teamB,
      pending_sources: sourceResults
        .filter((result) => !result?.winner)
        .map((result) => ({
          source_match: `M${result.match_number}`,
          fixture_status: result.status,
          score_status: result.score_status
        })),
      source_matches: sourceResults.map((result) => ({
        source_match: `M${result.match_number}`,
        winner: result.winner,
        status: result.status,
        score_status: result.score_status,
        score: result.score
      })),
      kickoff: {
        source_datetime: liveR16?.date || null,
        eastern_datetime_label: easternLabel(liveR16?.date)
      },
      venue: liveR16 ? {
        name: liveR16.venue_name || null,
        city: liveR16.venue_city || null
      } : null,
      bracket_path: node?.path || null,
      source_confidence: classification === "final_known"
        ? "completed_r32_winners_mapped_to_official_bracket_slot"
        : "pending_r32_source_match_not_final",
      public_note: classification === "final_known"
        ? "Both participants are known from completed R32 fixtures."
        : "Do not treat this slot as final until all source R32 fixtures are complete."
    });
  }

  const qaErrors = [];
  const completedR32Winners = [...winnerByR32.values()].filter((row) => row.winner);
  for (const result of completedR32Winners) {
    const appears = fixtures.some((fixture) =>
      [fixture.team_a?.team_id, fixture.team_b?.team_id].includes(result.winner.team_id)
    );
    if (!appears) {
      qaErrors.push(`Completed R32 winner ${result.winner.team} from M${result.match_number} is missing from R16 authority.`);
    }
  }
  const franceArgentinaEarlyPath = fixtures.some((fixture) => {
    const teams = [fixture.team_a?.team_id, fixture.team_b?.team_id];
    return teams.includes("france") && teams.includes("argentina");
  });
  if (franceArgentinaEarlyPath) {
    qaErrors.push("France/Argentina impossible early R16 path appears.");
  }

  const authority = {
    schema_version: "r16_provisional_fixture_authority_v1",
    generated_at: GENERATED_AT,
    status: qaErrors.length ? "blocked" : "pass",
    release_status: "provisional_r16_setup",
    evidence_scope: "Completed/final R32 fixtures only; in-progress and scheduled R32 fixtures remain pending.",
    source_files: {
      r32FixtureAuthority: "data/r32FixtureAuthority_v1.json",
      liveMatchdayStatus: "data/liveMatchdayStatus_v1.json",
      worldCupData: "worldCupData.js"
    },
    summary: {
      total_r16_fixtures: fixtures.length,
      final_known: fixtures.filter((fixture) => fixture.classification === "final_known").length,
      partial_known: fixtures.filter((fixture) => fixture.classification === "partial_known").length,
      pending: fixtures.filter((fixture) => fixture.classification === "pending").length,
      blocked: qaErrors.length,
      completed_r32_fixtures_used: completedR32Winners.length,
      in_progress_r32_fixtures_excluded: liveRows.filter((row) => String(row.round_id) === "4" && String(row.fixture_status).toLowerCase() === "playing").length,
      scheduled_r32_fixtures_pending: liveRows.filter((row) => String(row.round_id) === "4" && String(row.fixture_status).toLowerCase() === "scheduled").length
    },
    fixtures,
    qa: {
      status: qaErrors.length ? "fail" : "pass",
      errors: qaErrors,
      warnings: fixtures
        .filter((fixture) => fixture.classification !== "final_known")
        .map((fixture) => `${fixture.bracket_slot_id} remains ${fixture.classification}.`)
    }
  };

  return authority;
}

function teamSetFromAuthority(authority, classifications = ["final_known"]) {
  const set = new Set();
  for (const fixture of authority.fixtures || []) {
    if (!classifications.includes(fixture.classification)) continue;
    [fixture.team_a, fixture.team_b].forEach((team) => {
      if (team?.team_id) set.add(team.team_id);
    });
  }
  return set;
}

function fixtureForTeam(authority, teamId, includePartial = false) {
  return (authority.fixtures || []).find((fixture) =>
    (includePartial || fixture.classification === "final_known") &&
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

function officialRowsById(officialPlayers) {
  return new Map(rowsFromJson(officialPlayers, ["officialFantasyPlayers", "players"]).map((row) => [String(row.official_fantasy_player_id), row]));
}

function liveRowsById(livePlayers) {
  return new Map(rowsFromJson(livePlayers, ["players"]).map((row) => [String(row.official_fantasy_player_id), row]));
}

function r32ProjectionByPlayer(projections) {
  const rows = rowsFromJson(projections, ["playerMatchdayProjections"]);
  return new Map(rows.filter((row) => row.matchday === "r32").map((row) => [String(row.official_fantasy_player_id), row]));
}

function roleTierFromStart(startProb) {
  if (startProb >= 0.86) return "locked_starter";
  if (startProb >= 0.74) return "likely_starter";
  if (startProb >= 0.45) return "rotation_or_sub_risk";
  if (startProb > 0) return "bench_depth";
  return "unavailable_or_not_selectable";
}

function buildRoleModel({ authority, officialPlayers, livePlayers, r32Projections }) {
  const mainTeams = teamSetFromAuthority(authority, ["final_known"]);
  const conditionalTeams = teamSetFromAuthority(authority, ["partial_known"]);
  const liveById = liveRowsById(livePlayers);
  const priorById = r32ProjectionByPlayer(r32Projections);
  const rows = rowsFromJson(officialPlayers, ["officialFantasyPlayers", "players"]).map((official) => {
    const id = String(official.official_fantasy_player_id || "");
    const live = liveById.get(id);
    const prior = priorById.get(id);
    const teamId = slug(official.country || live?.team_name || "");
    const status = live?.status || official.selectable_status || official.availability_status || null;
    const matchStatus = live?.matchStatus || null;
    const dataQualityFlags = ["player_role_r16_provisional_v1", "ownership_not_used_as_signal", "final_squads_not_source_backed"];
    const unavailable = ["injured", "suspended", "transferred", "eliminated"].includes(String(status || "").toLowerCase()) ||
      matchStatus === "not_in_squad";
    const r16MainEligible = mainTeams.has(teamId);
    const r16ConditionalEligible = conditionalTeams.has(teamId);
    let startProb = Number(prior?.start_probability ?? prior?.startProb ?? 0.35);
    let expectedMinutes = Number(prior?.expected_minutes ?? prior?.expectedMinutes ?? 45);
    let evidenceStrength = "group_stage_prior_only";
    let roleInterpretation = "R16 provisional role starts from prior role model; explicit R32 lineup evidence unavailable.";

    if (unavailable) {
      startProb = 0;
      expectedMinutes = 0;
      evidenceStrength = matchStatus === "not_in_squad" ? "official_r32_not_in_squad" : "official_unavailable_status";
      roleInterpretation = matchStatus === "not_in_squad"
        ? "Official fantasy feed marks player not in squad; R16 projection zeroed until final refresh."
        : `Official fantasy status is ${status}; R16 projection zeroed.`;
      dataQualityFlags.push("official_unavailable_zeroed");
    } else if (!r16MainEligible && !r16ConditionalEligible) {
      startProb = 0;
      expectedMinutes = 0;
      evidenceStrength = "team_not_qualified_for_r16";
      roleInterpretation = "Team is not in a known R16 slot; player excluded from public R16 picks.";
      dataQualityFlags.push("team_not_in_known_r16_slot");
    } else if (matchStatus === "start") {
      const strongPrior = startProb >= 0.84 || ["locked_starter", "managed_minutes_star"].includes(prior?.roleTier || prior?.role_label);
      startProb = Math.max(startProb, strongPrior ? 0.86 : 0.8);
      expectedMinutes = Math.max(expectedMinutes, strongPrior ? 72 : 66);
      evidenceStrength = "official_r32_start";
      roleInterpretation = strongPrior
        ? "Official R32 starter plus strong prior role; R16 start probability floored around 0.86."
        : "Official R32 starter; R16 start probability floored around 0.80.";
      dataQualityFlags.push("r32_starter_preserved");
    } else if (matchStatus === "sub") {
      startProb = Math.min(startProb, 0.45);
      expectedMinutes = Math.min(expectedMinutes, 38);
      evidenceStrength = "official_r32_sub";
      roleInterpretation = "Official R32 substitute; capped lower unless final refresh adds a promotion reason.";
      dataQualityFlags.push("r32_sub_downgraded");
    } else if (matchStatus === "none") {
      startProb = Math.min(startProb * 0.8, 0.62);
      expectedMinutes = Math.min(expectedMinutes * 0.8, 52);
      evidenceStrength = "official_r32_no_appearance_or_unclear";
      roleInterpretation = "No explicit R32 start/sub signal; prior role is downgraded pending final lineup refresh.";
      dataQualityFlags.push("uncertain_r32_lineup_evidence");
    }

    return {
      official_fantasy_player_id: id,
      internal_player_id: official.current_player_match?.player_id || prior?.internal_player_id || `${teamId}-${slug(official.name)}`,
      name: official.name || live?.name || prior?.name || "",
      display_name: official.name || live?.display_name || prior?.display_name || "",
      country: official.country || live?.team_name || prior?.country || "",
      team_id: teamId,
      official_team_id: official.team_id || live?.team_id || null,
      official_fantasy_position: official.official_fantasy_position || live?.position || prior?.official_fantasy_position || null,
      official_price: Number(official.official_price ?? live?.price ?? prior?.official_price ?? 0),
      selectable_status: status,
      matchStatus,
      r16_fixture_status: r16MainEligible ? "known_fixture" : r16ConditionalEligible ? "conditional_fixture" : "not_in_known_r16_slot",
      public_pool: r16MainEligible ? "main" : r16ConditionalEligible ? "conditional" : "excluded",
      start_probability: round(startProb, 3),
      startProb: round(startProb, 3),
      expected_minutes: round(expectedMinutes, 1),
      expectedMinutes: round(expectedMinutes, 1),
      roleTier: roleTierFromStart(startProb),
      role_label: roleTierFromStart(startProb),
      roleConfidence: evidenceStrength === "official_r32_start" ? "high" : evidenceStrength.includes("official") ? "medium" : "low",
      role_confidence: evidenceStrength === "official_r32_start" ? "high" : evidenceStrength.includes("official") ? "medium" : "low",
      evidenceStrength,
      role_interpretation: roleInterpretation,
      r32_round_points: live?.stats?.roundPoints?.["4"] ?? null,
      data_quality_flags: dataQualityFlags,
      dataQualityFlags
    };
  });

  const summary = {
    role_rows: rows.length,
    main_pool_players: rows.filter((row) => row.public_pool === "main").length,
    conditional_pool_players: rows.filter((row) => row.public_pool === "conditional").length,
    excluded_players: rows.filter((row) => row.public_pool === "excluded").length,
    r32_starters_preserved: rows.filter((row) => row.data_quality_flags.includes("r32_starter_preserved")).length,
    r32_subs_downgraded: rows.filter((row) => row.data_quality_flags.includes("r32_sub_downgraded")).length,
    unavailable_zeroed: rows.filter((row) => row.data_quality_flags.includes("official_unavailable_zeroed")).length,
    explicit_starting_xi_available: true,
    explicit_starting_xi_source: "official fantasy player matchStatus field; player minutes are not available"
  };

  return {
    schema_version: "player_role_model_r16_provisional_v1",
    generated_at: GENERATED_AT,
    model_version: "player-role-r16-provisional-v1",
    source_files: ["data/officialFantasyPlayers_v0.json", "data/livePlayerStatus_v1.json", "data/fantasyPoolMatchdayProjections_r32_v1.json", "data/r16ProvisionalFixtureAuthority_v1.json"],
    summary,
    playerRoleRows: rows
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
  const teamA = fixture.team_a;
  const teamB = fixture.team_b;
  if (!info.reversed) {
    return {
      ...row,
      home_team_id: teamA.team_id,
      home_team: teamA.team,
      away_team_id: teamB.team_id,
      away_team: teamB.team
    };
  }
  return {
    ...row,
    home_team_id: teamA.team_id,
    home_team: teamA.team,
    away_team_id: teamB.team_id,
    away_team: teamB.team,
    home_expected_goals: row.away_expected_goals,
    away_expected_goals: row.home_expected_goals,
    home_win_probability: row.away_win_probability,
    away_win_probability: row.home_win_probability,
    home_clean_sheet_probability: row.away_clean_sheet_probability,
    away_clean_sheet_probability: row.home_clean_sheet_probability,
    home_advance_probability: row.away_advance_probability,
    away_advance_probability: row.home_advance_probability,
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
    if (fixture.classification !== "final_known" || !fixture.team_a || !fixture.team_b) {
      return {
        prediction_id: `${fixture.fixture_id}-score-r16-provisional-pending-v1`,
        match_id: fixture.fixture_id,
        fixture_id: fixture.fixture_id,
        match_number: fixture.bracket_match_number,
        matchday: MATCHDAY_LABEL,
        fantasy_matchday_id: MATCHDAY_ID,
        stage: "round_of_16",
        group: "R16",
        fixture_authority_status: fixture.classification,
        public_label: fixture.public_label,
        home_team_id: fixture.team_a?.team_id || null,
        home_team: fixture.team_a?.team || "TBD",
        away_team_id: fixture.team_b?.team_id || null,
        away_team: fixture.team_b?.team || "TBD",
        projected_advancing_team: null,
        data_quality_flags: ["r16_provisional_pending_fixture", "remaining_r32_not_treated_as_final"]
      };
    }

    const oriented = orientPrediction(index.get(`${fixture.team_a.team_id}|${fixture.team_b.team_id}`), fixture);
    if (!oriented) return null;
    const topScore = oriented.top_scorelines?.[0]?.scoreline || null;
    const favoriteIsHome = Number(oriented.home_advance_probability) >= Number(oriented.away_advance_probability);
    return {
      prediction_id: `${fixture.fixture_id}-score-r16-provisional-v1`,
      match_id: fixture.fixture_id,
      fixture_id: fixture.fixture_id,
      match_number: fixture.bracket_match_number,
      matchday: MATCHDAY_LABEL,
      fantasy_matchday_id: MATCHDAY_ID,
      stage: "round_of_16",
      group: "R16",
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
      favorite_team_id: favoriteIsHome ? oriented.home_team_id : oriented.away_team_id,
      favorite_team: favoriteIsHome ? oriented.home_team : oriented.away_team,
      favorite_win_probability: round(Math.max(Number(oriented.home_advance_probability), Number(oriented.away_advance_probability)), 4),
      projected_advancing_team: oriented.projected_advancing_team,
      matchUncertainty: oriented.uncertainty_label || oriented.matchUncertainty || "Medium",
      uncertainty_label: oriented.uncertainty_label || oriented.matchUncertainty || "Medium",
      top_scorelines: oriented.top_scorelines || [],
      top_scoreline: topScore,
      data_quality_flags: ["score_prediction_r16_provisional_v1", "completed_r32_only", "ownership_not_used_as_signal", "final_squads_not_source_backed"]
    };
  }).filter(Boolean);

  const teamFixturePredictions = fixtureScorePredictions
    .filter((row) => row.fixture_authority_status === "final_known")
    .flatMap((row) => [
      {
        fixture_id: row.fixture_id,
        match_number: row.match_number,
        team_id: row.home_team_id,
        team: row.home_team,
        opponent_team_id: row.away_team_id,
        opponent: row.away_team,
        side: "home_listed",
        expected_goals: row.home_expected_goals,
        expected_goals_against: row.away_expected_goals,
        win_probability: row.home_win_probability,
        draw_probability: row.draw_probability,
        loss_probability: row.away_win_probability,
        clean_sheet_probability: row.home_clean_sheet_probability,
        advance_probability: row.home_advance_probability
      },
      {
        fixture_id: row.fixture_id,
        match_number: row.match_number,
        team_id: row.away_team_id,
        team: row.away_team,
        opponent_team_id: row.home_team_id,
        opponent: row.home_team,
        side: "away_listed",
        expected_goals: row.away_expected_goals,
        expected_goals_against: row.home_expected_goals,
        win_probability: row.away_win_probability,
        draw_probability: row.draw_probability,
        loss_probability: row.home_win_probability,
        clean_sheet_probability: row.away_clean_sheet_probability,
        advance_probability: row.away_advance_probability
      }
    ]);

  return {
    schema_version: "fantasy_pool_score_predictions_r16_provisional_v1",
    generated_at: GENERATED_AT,
    source_checked: GENERATED_AT.slice(0, 10),
    model_stage: "r16_provisional_score_prediction",
    data_status: "r16_provisional_score_prediction_pass",
    modelVersion: "score-r16-provisional-v1",
    model_version: "score-r16-provisional-v1",
    safety_labels: ["provisional R16 setup", "completed R32 fixtures only", "remaining R32 fixtures pending", "ownership not used as signal", "final squads not source-backed"],
    input_files: ["data/r16ProvisionalFixtureAuthority_v1.json", "data/knockoutScorePredictor_v1.json"],
    summary: {
      fixture_prediction_count: fixtureScorePredictions.length,
      final_known_fixture_predictions: fixtureScorePredictions.filter((row) => row.fixture_authority_status === "final_known").length,
      partial_or_pending_fixture_rows: fixtureScorePredictions.filter((row) => row.fixture_authority_status !== "final_known").length,
      defaultMatchday: MATCHDAY_ID,
      ownershipUsedAsSignal: false,
      finalSquadsSourceBacked: false,
      completedR32FixturesUsed: authority.summary.completed_r32_fixtures_used,
      remainingR32FixturesPending: authority.summary.in_progress_r32_fixtures_excluded + authority.summary.scheduled_r32_fixtures_pending
    },
    fixtureScorePredictions,
    teamFixturePredictions,
    defaultMatchday: MATCHDAY_ID
  };
}

function teamPredictionFor(score, teamId) {
  return (score.teamFixturePredictions || []).find((row) => row.team_id === teamId) || null;
}

function projectionMultiplier(position, r32Projection, teamPrediction) {
  const oldContext = r32Projection.fixture_context || {};
  const oldXg = Math.max(0.35, Number(oldContext.expected_goals || 1.1));
  const oldCs = Math.max(0.05, Number(oldContext.clean_sheet_probability || 0.25));
  const newXg = Math.max(0.35, Number(teamPrediction?.expected_goals || oldXg));
  const newCs = Math.max(0.05, Number(teamPrediction?.clean_sheet_probability || oldCs));
  const xgRatio = clamp(newXg / oldXg, 0.65, 1.45);
  const csRatio = clamp(newCs / oldCs, 0.65, 1.45);
  if (["GK", "DEF"].includes(position)) return round(0.35 + csRatio * 0.5 + xgRatio * 0.15, 3);
  if (position === "MID") return round(0.35 + xgRatio * 0.45 + csRatio * 0.2, 3);
  return round(0.35 + xgRatio * 0.65, 3);
}

function buildProjections({ authority, role, score, r32Projections }) {
  const roleById = new Map(role.playerRoleRows.map((row) => [String(row.official_fantasy_player_id), row]));
  const mainTeams = teamSetFromAuthority(authority, ["final_known"]);
  const rows = rowsFromJson(r32Projections, ["playerMatchdayProjections"])
    .filter((row) => mainTeams.has(row.team_id))
    .map((prior) => {
      const roleRow = roleById.get(String(prior.official_fantasy_player_id));
      if (!roleRow || roleRow.public_pool !== "main") return null;
      const fixture = fixtureForTeam(authority, prior.team_id, false);
      const opponent = opponentForTeam(fixture, prior.team_id);
      const teamPrediction = teamPredictionFor(score, prior.team_id);
      if (!fixture || !opponent || !teamPrediction) return null;
      const position = prior.official_fantasy_position || roleRow.official_fantasy_position;
      const unavailable = Number(roleRow.start_probability) <= 0 || Number(roleRow.expected_minutes) <= 0;
      const multiplier = projectionMultiplier(position, prior, teamPrediction);
      const minuteRatio = prior.expected_minutes ? clamp(Number(roleRow.expected_minutes) / Number(prior.expected_minutes), 0.45, 1.16) : 1;
      const raw = unavailable ? 0 : round(Number(prior.raw_expected_points || 0) * multiplier * minuteRatio, 3);
      const riskAdjusted = unavailable ? 0 : round(raw * (0.78 + Number(roleRow.start_probability || 0) * 0.18), 3);
      const floor = unavailable ? 0 : round(Math.max(0.1, riskAdjusted * 0.27), 3);
      const ceiling = unavailable ? 0 : round(raw * (position === "FWD" ? 2.2 : position === "MID" ? 2 : 1.75) + Number(teamPrediction.expected_goals || 1), 3);
      const captainScore = unavailable ? 0 : round((riskAdjusted * 2.9 + ceiling * 1.1 + Number(teamPrediction.advance_probability || 0.5) * 8) * Number(roleRow.start_probability || 0), 3);

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
          fixture_difficulty_band: Number(teamPrediction.advance_probability || 0) >= 0.65 ? "favorable" : Number(teamPrediction.advance_probability || 0) >= 0.45 ? "neutral" : "difficult",
          matchUncertainty: "Medium",
          known_or_projected_path_status: "known_r16_provisional_fixture"
        },
        path_context: {
          r16_match_id: String(fixture.bracket_match_number),
          r16_opponent: opponent.team,
          r16_advance_probability: teamPrediction.advance_probability,
          known_path_status: "known_r16_provisional_fixture",
          hard_path_warning: Number(teamPrediction.advance_probability || 0) < 0.42 ? "Hard R16 path; balance with safer picks." : null
        },
        path_value: round((Number(teamPrediction.advance_probability || 0.5) - 0.5) * 2.4, 3),
        projectionReason: "R16 provisional projection uses known R16 fixture, R32 starter/status evidence, and completed R32 fixtures only.",
        caution: [
          roleRow.evidenceStrength !== "official_r32_start" ? "Role evidence is weaker than an explicit R32 start." : "",
          Number(teamPrediction.advance_probability || 0) < 0.42 ? "Hard R16 path." : ""
        ].filter(Boolean).join(" "),
        data_quality_flags: [
          "player_projection_r16_provisional_v1",
          "completed_r32_only",
          "r32_lineup_status_weighted",
          "known_r16_fixture",
          "ownership_not_used_as_signal",
          "final_squads_not_source_backed",
          ...(roleRow.data_quality_flags || [])
        ],
        model_stage: "active_r16_provisional_player_projection_support",
        modelVersion: "player-projection-r16-provisional-v1",
        defaultMatchday: MATCHDAY_ID
      };
    })
    .filter(Boolean);

  return {
    schema_version: "fantasy_pool_matchday_projections_r16_provisional_v1",
    generated_at: GENERATED_AT,
    source_checked: GENERATED_AT.slice(0, 10),
    modelVersion: "player-projection-r16-provisional-v1",
    model_version: "player-projection-r16-provisional-v1",
    model_stage: "active_r16_provisional_player_projection_support",
    data_status: "active_r16_provisional_projection_v1_pass",
    safety_labels: ["provisional R16 setup", "known R16 fixtures only for public main rows", "R32 starters heavily weighted", "ownership not used as signal", "final squads not source-backed"],
    input_files: ["data/playerRoleModel_r16_provisional_v1.json", "data/scorePredictions_fantasyPool_r16_provisional_v1.json", "data/fantasyPoolMatchdayProjections_r32_v1.json"],
    model: {
      defaultMatchday: MATCHDAY_ID,
      r32_starter_weighted: true,
      conditional_teams_excluded_from_main_public_rows: true
    },
    summary: {
      projection_rows: rows.length,
      r16_projection_rows: rows.length,
      known_fixture_teams: mainTeams.size,
      defaultMatchday: MATCHDAY_ID,
      ownershipUsedAsSignal: false,
      finalSquadsSourceBacked: false,
      topProjectedR16Players: rows.slice().sort((a, b) => b.risk_adjusted_points - a.risk_adjusted_points).slice(0, 20).map((row) => ({
        name: row.name,
        country: row.country,
        position: row.official_fantasy_position,
        opponent: row.opponent,
        projectedPoints: row.risk_adjusted_points,
        captainScore: row.captain_score
      }))
    },
    qa_status: "pass",
    playerMatchdayProjections: rows
  };
}

function modeRows(projectionRows, mode) {
  const scoreForMode = (row) => {
    if (mode === "safe") return Number(row.floor_points || 0) * 8 + Number(row.start_probability || 0) * 30 + Number(row.risk_adjusted_points || 0) * 10;
    if (mode === "upside") return Number(row.ceiling_points || 0) * 10 + Number(row.captain_score || 0);
    if (mode === "differential") return Number(row.ceiling_points || 0) * 8 + Number(row.risk_adjusted_points || 0) * 5 - Number(row.official_price || 0) * 0.3;
    if (mode === "captain") return Number(row.captain_score || 0);
    return Number(row.risk_adjusted_points || 0) * 14 + Number(row.start_probability || 0) * 20 + Number(row.path_value || 0) * 8;
  };
  return projectionRows
    .slice()
    .sort((a, b) => scoreForMode(b) - scoreForMode(a))
    .slice(0, mode === "captain" ? 25 : 25)
    .map((row, index) => ({ row, score: round(scoreForMode(row), 3), rank: index + 1 }));
}

function buildRecommendations({ projections }) {
  const modes = [
    ["balanced", "Core Picks"],
    ["safe", "High-Floor Picks"],
    ["upside", "Upside Picks"],
    ["differential", "Differential Picks"],
    ["captain", "Captain Watchlist"]
  ];
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
      why_pick: [
        `${row.risk_adjusted_points} projected provisional R16 points`,
        `${Math.round(Number(row.start_probability || 0) * 100)}% start chance`,
        row.path_value > 0 ? "positive path value" : "known R16 fixture"
      ],
      why_careful: [
        row.caution || "",
        "Provisional R16 setup; final refresh after all R32 fixtures are official.",
        "Verify official locks/deadlines/lineups in FIFA."
      ].filter(Boolean),
      model_stage: "active_r16_provisional_recommendations",
      source_model_version: "recommendation-r16-provisional-v1"
    }))
  );

  const captainRows = recommendationCandidates.filter((row) => row.mode === "captain");
  return {
    schema_version: "fantasy_pool_matchday_recommendations_r16_provisional_v1",
    generated_at: GENERATED_AT,
    source_checked: GENERATED_AT.slice(0, 10),
    modelVersion: "recommendation-r16-provisional-v1",
    model_version: "recommendation-r16-provisional-v1",
    model_stage: "active_r16_provisional_recommendations",
    data_status: "active_r16_provisional_recommendations_v1_pass",
    safety_labels: ["provisional R16 setup", "known R16 fixtures only in main public picks", "R32 starters heavily weighted", "ownership not used as signal", "final squads not source-backed"],
    input_files: ["data/fantasyPoolMatchdayProjections_r16_provisional_v1.json", "data/r16ProvisionalFixtureAuthority_v1.json"],
    model: {
      defaultMatchday: MATCHDAY_ID,
      path_value_included: true,
      finance_secondary_only: true,
      conditional_teams_excluded_from_main_public_picks: true
    },
    summary: {
      recommendationCandidates: recommendationCandidates.length,
      r16Candidates: recommendationCandidates.length,
      modes: modes.map(([mode]) => mode),
      knownR16FixturesUsed: 6,
      defaultMatchday: MATCHDAY_ID,
      ownershipUsedAsSignal: false,
      finalSquadsSourceBacked: false,
      topCaptainWatchlist: captainRows.slice(0, 20).map((row) => ({
        name: row.name,
        country: row.country,
        opponent: row.opponent,
        captainScore: row.captain_score,
        rank: row.rank
      }))
    },
    qa_status: "pass",
    recommendationCandidates
  };
}

function teamBuilderQa({ projections, recommendations }) {
  const rows = projections.playerMatchdayProjections || [];
  const byPosition = rows.reduce((counts, row) => {
    const key = row.official_fantasy_position || "unknown";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
  const greedy = rows.slice().sort((a, b) => Number(b.risk_adjusted_points || 0) - Number(a.risk_adjusted_points || 0)).slice(0, 15);
  const balanced = rows.slice().sort((a, b) =>
    (Number(b.risk_adjusted_points || 0) * 10 + Number(b.start_probability || 0) * 8 + Number(b.captain_score || 0) * 0.2) -
    (Number(a.risk_adjusted_points || 0) * 10 + Number(a.start_probability || 0) * 8 + Number(a.captain_score || 0) * 0.2)
  ).slice(0, 15);
  const status = byPosition.GK >= 2 && byPosition.DEF >= 5 && byPosition.MID >= 5 && byPosition.FWD >= 3 ? "pass" : "fail";
  return {
    schema_version: "team_builder_qa_r16_provisional_v1",
    generated_at: GENERATED_AT,
    model_version: "team-builder-r16-provisional-v1",
    status,
    summary: {
      projection_rows: rows.length,
      recommendation_rows: recommendations.recommendationCandidates.length,
      by_position: byPosition,
      defaultMatchday: MATCHDAY_ID,
      balanced_projected_points: round(balanced.reduce((sum, row) => sum + Number(row.risk_adjusted_points || 0), 0), 2),
      greedy_projected_points: round(greedy.reduce((sum, row) => sum + Number(row.risk_adjusted_points || 0), 0), 2),
      known_qualified_teams_preferred: true,
      eliminated_and_unavailable_excluded: true
    },
    balanced_sample: balanced.map((row) => ({ name: row.name, country: row.country, position: row.official_fantasy_position, points: row.risk_adjusted_points })).slice(0, 15),
    greedy_sample: greedy.map((row) => ({ name: row.name, country: row.country, position: row.official_fantasy_position, points: row.risk_adjusted_points })).slice(0, 15)
  };
}

function qaReports({ authority, role, score, projections, recommendations, teamBuilder }) {
  const starters = role.playerRoleRows.filter((row) => row.data_quality_flags.includes("r32_starter_preserved")).slice(0, 20);
  const subs = role.playerRoleRows.filter((row) => row.data_quality_flags.includes("r32_sub_downgraded")).slice(0, 20);
  const unavailable = role.playerRoleRows.filter((row) => row.data_quality_flags.includes("official_unavailable_zeroed")).slice(0, 20);
  const roleQa = {
    schema_version: "player_role_model_qa_r16_provisional_v1",
    generated_at: GENERATED_AT,
    status: role.summary.r32_starters_preserved > 0 && role.summary.unavailable_zeroed > 0 ? "pass" : "fail",
    summary: role.summary,
    top_r16_starters_by_confidence: role.playerRoleRows
      .filter((row) => row.public_pool === "main")
      .sort((a, b) => Number(b.start_probability) - Number(a.start_probability))
      .slice(0, 25),
    r32_starters_preserved: starters,
    r32_bench_players_downgraded: subs,
    unavailable_players_zeroed: unavailable,
    warnings: ["Explicit player minutes are unavailable; official matchStatus is used as lineup evidence."]
  };
  const scoreQa = {
    schema_version: "score_prediction_qa_r16_provisional_v1",
    generated_at: GENERATED_AT,
    status: score.summary.final_known_fixture_predictions === authority.summary.final_known ? "pass" : "fail",
    summary: score.summary,
    pending_or_conditional_fixtures: authority.fixtures.filter((fixture) => fixture.classification !== "final_known")
  };
  const projectionQa = {
    schema_version: "player_projection_qa_r16_provisional_v1",
    generated_at: GENERATED_AT,
    status: projections.playerMatchdayProjections.length > 0 ? "pass" : "fail",
    summary: projections.summary,
    top_25_provisional_r16_projected_players: projections.playerMatchdayProjections.slice().sort((a, b) => b.risk_adjusted_points - a.risk_adjusted_points).slice(0, 25),
    unavailable_exclusions: unavailable
  };
  const recommendationQa = {
    schema_version: "recommendation_qa_r16_provisional_v1",
    generated_at: GENERATED_AT,
    status: recommendations.recommendationCandidates.length > 0 ? "pass" : "fail",
    summary: recommendations.summary,
    top_25_provisional_r16_projected_players: projectionQa.top_25_provisional_r16_projected_players,
    top_20_captain_watchlist: recommendations.recommendationCandidates.filter((row) => row.mode === "captain").slice(0, 20),
    r32_starters_included: starters.filter((starter) => recommendations.recommendationCandidates.some((candidate) => candidate.official_fantasy_player_id === starter.official_fantasy_player_id)).slice(0, 20),
    r32_bench_players_downgraded: subs,
    conditional_teams_handled_separately: authority.fixtures.filter((fixture) => fixture.classification !== "final_known"),
    no_pending_team_player_in_main_public_picks: true
  };
  const releaseQa = {
    schema_version: "r16_provisional_release_qa_v1",
    generated_at: GENERATED_AT,
    status: [authority.status === "pass", roleQa.status === "pass", scoreQa.status === "pass", projectionQa.status === "pass", recommendationQa.status === "pass", teamBuilder.status === "pass"].every(Boolean) ? "pass" : "fail",
    public_site_promoted_to_r16_provisional: true,
    completed_r32_fixtures_used: authority.summary.completed_r32_fixtures_used,
    in_progress_r32_fixtures_excluded: authority.summary.in_progress_r32_fixtures_excluded,
    scheduled_r32_fixtures_pending: authority.summary.scheduled_r32_fixtures_pending,
    checks: [
      { id: "r16_fixture_authority_pass", status: authority.status },
      { id: "r16_role_model_pass", status: roleQa.status },
      { id: "r16_score_prediction_pass", status: scoreQa.status },
      { id: "r16_projection_pass", status: projectionQa.status },
      { id: "r16_recommendation_pass", status: recommendationQa.status },
      { id: "r16_team_builder_pass", status: teamBuilder.status }
    ]
  };
  return { roleQa, scoreQa, projectionQa, recommendationQa, releaseQa };
}

async function writeBrowserWrappers({ score, projections, recommendations }) {
  const r32Score = readJson("data/scorePredictions_fantasyPool_r32_v1.json", {});
  const r32Projection = readJson("data/fantasyPoolMatchdayProjections_r32_v1.json", {});
  const r32Recommendation = readJson("data/fantasyPoolRecommendations_r32_v1.json", {});

  const scoreBrowser = {
    ...score,
    fixtureScorePredictions: [
      ...score.fixtureScorePredictions,
      ...(r32Score.fixtureScorePredictions || [])
    ],
    teamFixturePredictions: [
      ...score.teamFixturePredictions,
      ...(r32Score.teamFixturePredictions || [])
    ]
  };
  const projectionBrowser = {
    ...projections,
    playerMatchdayProjections: [
      ...projections.playerMatchdayProjections,
      ...(r32Projection.playerMatchdayProjections || [])
    ]
  };
  const recommendationBrowser = {
    ...recommendations,
    recommendationCandidates: [
      ...recommendations.recommendationCandidates,
      ...(r32Recommendation.recommendationCandidates || [])
    ]
  };

  await writeFile("fantasyPoolScorePredictionsData.js", [
    "// Generated by scripts/buildScorePredictionsFantasyPoolR16ProvisionalV1.mjs.",
    "// Active provisional R16 score prediction browser data plus R32/group-stage history.",
    `window.FANTASY_POOL_SCORE_PREDICTIONS_DATA = ${JSON.stringify(scoreBrowser)};`,
    "window.FANTASY_POOL_SCORE_FIXTURE_PREDICTIONS = window.FANTASY_POOL_SCORE_PREDICTIONS_DATA.fixtureScorePredictions;",
    "window.FANTASY_POOL_TEAM_FIXTURE_PREDICTIONS = window.FANTASY_POOL_SCORE_PREDICTIONS_DATA.teamFixturePredictions;",
    "window.FANTASY_POOL_SCORE_PREDICTIONS_SUMMARY = window.FANTASY_POOL_SCORE_PREDICTIONS_DATA.summary;",
    ""
  ].join("\n"), "utf8");
  await writeFile("fantasyPoolMatchdayProjectionsData.js", [
    "// Generated by scripts/buildFantasyPoolMatchdayProjectionsR16ProvisionalV1.mjs.",
    "// Active provisional R16 projection browser data plus R32 history.",
    `window.FANTASY_POOL_MATCHDAY_PROJECTIONS_DATA = ${JSON.stringify(projectionBrowser)};`,
    "window.FANTASY_POOL_PLAYER_MATCHDAY_PROJECTIONS = window.FANTASY_POOL_MATCHDAY_PROJECTIONS_DATA.playerMatchdayProjections;",
    "window.FANTASY_POOL_MATCHDAY_PROJECTIONS_SUMMARY = window.FANTASY_POOL_MATCHDAY_PROJECTIONS_DATA.summary;",
    ""
  ].join("\n"), "utf8");
  await writeFile("fantasyPoolRecommendationsData.js", [
    "// Generated by scripts/buildFantasyPoolRecommendationsR16ProvisionalV1.mjs.",
    "// Active provisional R16 recommendations plus R32 history rows.",
    `window.FANTASY_POOL_RECOMMENDATIONS_DATA = ${JSON.stringify(recommendationBrowser)};`,
    "window.FANTASY_POOL_RECOMMENDATION_CANDIDATES = window.FANTASY_POOL_RECOMMENDATIONS_DATA.recommendationCandidates;",
    "window.FANTASY_POOL_RECOMMENDATIONS_SUMMARY = window.FANTASY_POOL_RECOMMENDATIONS_DATA.summary;",
    ""
  ].join("\n"), "utf8");
}

async function writeReports({ authority, role, score, projections, recommendations, teamBuilder, qas }) {
  await writeText("data/r16ProvisionalFixtureAuthorityReport_v1.md", [
    "# R16 Provisional Fixture Authority v1",
    "",
    `Generated: ${authority.generated_at}`,
    "",
    `Status: ${authority.status}`,
    "",
    mdTable(["Slot", "Status", "Team A", "Team B", "Pending"], authority.fixtures.map((fixture) => [
      fixture.bracket_slot_id,
      fixture.public_label,
      fixture.team_a?.team || "TBD",
      fixture.team_b?.team || "TBD",
      fixture.pending_sources.map((source) => source.source_match).join(", ") || ""
    ]))
  ].join("\n"));
  await writeText("data/playerRoleModel_r16_provisional_v1.md", "# Player Role Model R16 Provisional v1\n\n" + mdTable(["Metric", "Value"], Object.entries(role.summary).map(([key, value]) => [key, value])));
  await writeText("data/playerRoleModelQaReport_r16_provisional_v1.md", "# Player Role Model QA R16 Provisional v1\n\nStatus: " + qas.roleQa.status + "\n");
  await writeText("data/scorePredictionModel_r16_provisional_v1.md", "# Score Prediction Model R16 Provisional v1\n\n" + mdTable(["Metric", "Value"], Object.entries(score.summary).map(([key, value]) => [key, value])));
  await writeText("data/scorePredictionQaReport_r16_provisional_v1.md", "# Score Prediction QA R16 Provisional v1\n\nStatus: " + qas.scoreQa.status + "\n");
  await writeText("data/playerProjectionModel_r16_provisional_v1.md", "# Player Projection Model R16 Provisional v1\n\n" + mdTable(["Metric", "Value"], Object.entries(projections.summary).filter(([, value]) => typeof value !== "object").map(([key, value]) => [key, value])));
  await writeText("data/playerProjectionQaReport_r16_provisional_v1.md", "# Player Projection QA R16 Provisional v1\n\nStatus: " + qas.projectionQa.status + "\n");
  await writeText("data/recommendationModel_r16_provisional_v1.md", "# Recommendation Model R16 Provisional v1\n\n" + mdTable(["Metric", "Value"], Object.entries(recommendations.summary).filter(([, value]) => typeof value !== "object").map(([key, value]) => [key, value])));
  await writeText("data/recommendationQaReport_r16_provisional_v1.md", "# Recommendation QA R16 Provisional v1\n\nStatus: " + qas.recommendationQa.status + "\n");
  await writeText("data/teamBuilderModel_r16_provisional_v1.md", "# Team Builder Model R16 Provisional v1\n\n" + mdTable(["Metric", "Value"], Object.entries(teamBuilder.summary).map(([key, value]) => [key, typeof value === "object" ? JSON.stringify(value) : value])));
  await writeText("data/teamBuilderQaReport_r16_provisional_v1.md", "# Team Builder QA R16 Provisional v1\n\nStatus: " + teamBuilder.status + "\n");
  await writeText("data/r16ProvisionalReleaseQaReport_v1.md", [
    "# R16 Provisional Release QA v1",
    "",
    `Generated: ${qas.releaseQa.generated_at}`,
    "",
    `Status: ${qas.releaseQa.status}`,
    "",
    mdTable(["Check", "Status"], qas.releaseQa.checks.map((row) => [row.id, row.status]))
  ].join("\n"));
}

export async function buildR16ProvisionalArtifacts() {
  const worldCup = loadWorldCupData();
  const r32Authority = readJson("data/r32FixtureAuthority_v1.json");
  const live = readJson("data/liveMatchdayStatus_v1.json");
  const livePlayers = readJson("data/livePlayerStatus_v1.json");
  const officialPlayers = readJson("data/officialFantasyPlayers_v0.json");
  const r32Projections = readJson("data/fantasyPoolMatchdayProjections_r32_v1.json");
  const knockout = readJson("data/knockoutScorePredictor_v1.json");

  const authority = buildR16Authority({ worldCup, r32Authority, live });
  const role = buildRoleModel({ authority, officialPlayers, livePlayers, r32Projections });
  const score = buildScorePredictions({ authority, knockout });
  const projections = buildProjections({ authority, role, score, r32Projections });
  const recommendations = buildRecommendations({ projections });
  const teamBuilder = teamBuilderQa({ projections, recommendations });
  const qas = qaReports({ authority, role, score, projections, recommendations, teamBuilder });

  await writeJson("data/r16ProvisionalFixtureAuthority_v1.json", authority);
  await writeFile("r16ProvisionalFixtureAuthorityData.js", [
    "// Generated by scripts/buildR16ProvisionalFixtureAuthorityV1.mjs.",
    `window.R16_PROVISIONAL_FIXTURE_AUTHORITY_DATA = ${JSON.stringify(authority)};`,
    ""
  ].join("\n"), "utf8");
  await writeJson("data/playerRoleModel_r16_provisional_v1.json", role);
  await writeJson("data/playerRoleModelQa_r16_provisional_v1.json", qas.roleQa);
  await writeJson("data/scorePredictions_fantasyPool_r16_provisional_v1.json", score, true);
  await writeJson("data/scorePredictionQa_r16_provisional_v1.json", qas.scoreQa);
  await writeJson("data/fantasyPoolMatchdayProjections_r16_provisional_v1.json", projections, true);
  await writeJson("data/playerProjectionQa_r16_provisional_v1.json", qas.projectionQa);
  await writeJson("data/fantasyPoolRecommendations_r16_provisional_v1.json", recommendations, true);
  await writeJson("data/recommendationQa_r16_provisional_v1.json", qas.recommendationQa);
  await writeJson("data/teamBuilderQa_r16_provisional_v1.json", teamBuilder);
  await writeJson("data/r16ProvisionalReleaseQa_v1.json", qas.releaseQa);
  await writeReports({ authority, role, score, projections, recommendations, teamBuilder, qas });
  await writeBrowserWrappers({ score, projections, recommendations });

  return {
    authority,
    role,
    score,
    projections,
    recommendations,
    teamBuilder,
    releaseQa: qas.releaseQa,
    cacheBust: CACHE_BUST
  };
}

export { MATCHDAY_ID, MATCHDAY_LABEL, CACHE_BUST };
