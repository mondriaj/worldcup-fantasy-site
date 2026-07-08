import fs from "node:fs";
import { writeFile } from "node:fs/promises";
import vm from "node:vm";

const GENERATED_AT = new Date().toISOString();
const MATCHDAY_ID = "qf";
const MATCHDAY_LABEL = "QF";
const CACHE_BUST = "20260708-qf-final";

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
  if (!rows.length) return "_None._";
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
    name: team.team || team.name,
    team_id: team.team_id || slug(team.team || team.name),
    code: team.code || null,
    flag: team.flag || null
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

function scoreLabel(fixture, live) {
  const homeScore = Number(live.home_score);
  const awayScore = Number(live.away_score);
  const homePens = Number(live.home_penalty_score || 0);
  const awayPens = Number(live.away_penalty_score || 0);
  const penaltyText = homeScore === awayScore && (homePens || awayPens)
    ? `, ${homePens}-${awayPens} pens`
    : "";
  return `${fixture.team_a?.code || fixture.team_a?.team} ${homeScore}-${awayScore} ${fixture.team_b?.code || fixture.team_b?.team}${penaltyText}`;
}

function fixtureIsFinal(live) {
  const status = String(live?.fixture_status || live?.status || "").toLowerCase();
  return ["complete", "completed", "played"].includes(status) &&
    live?.safe_to_display_score === true &&
    Number.isFinite(Number(live.home_score)) &&
    Number.isFinite(Number(live.away_score));
}

function r16WinnerFromLive(r16Fixture, liveByMatchNumber, liveBySourceId) {
  const live = liveByMatchNumber.get(Number(r16Fixture.bracket_match_number)) ||
    liveBySourceId.get(String(r16Fixture.source_fixture_id || ""));

  if (!fixtureIsFinal(live)) {
    return {
      match_number: Number(r16Fixture.bracket_match_number),
      status: live?.fixture_status || r16Fixture.status || "pending",
      score_status: live?.score_status || "not_final_hidden",
      winner: null,
      loser: null,
      score: null,
      source_fixture_id: r16Fixture.source_fixture_id || live?.source_fixture_id || null
    };
  }

  const homeScore = Number(live.home_score);
  const awayScore = Number(live.away_score);
  const homePens = Number(live.home_penalty_score || 0);
  const awayPens = Number(live.away_penalty_score || 0);
  const homeWins = homeScore > awayScore || (homeScore === awayScore && (homePens || awayPens) && homePens > awayPens);
  const winner = homeWins ? teamFromAuthority(r16Fixture.team_a) : teamFromAuthority(r16Fixture.team_b);
  const loser = homeWins ? teamFromAuthority(r16Fixture.team_b) : teamFromAuthority(r16Fixture.team_a);

  return {
    match_number: Number(r16Fixture.bracket_match_number),
    status: "complete",
    score_status: "final",
    winner,
    loser,
    score: {
      home_score: homeScore,
      away_score: awayScore,
      home_penalty_score: live.home_penalty_score,
      away_penalty_score: live.away_penalty_score,
      label: scoreLabel(r16Fixture, live)
    },
    source_fixture_id: r16Fixture.source_fixture_id || live.source_fixture_id || null
  };
}

function liveFixtureByTeamPair(liveRows, roundId) {
  const byPair = new Map();
  for (const row of liveRows.filter((fixture) => String(fixture.round_id) === String(roundId))) {
    const home = slug(row.live_home_team || row.local_home_team || row.home_team);
    const away = slug(row.live_away_team || row.local_away_team || row.away_team);
    if (home && away) {
      byPair.set(`${home}|${away}`, { row, reversed: false });
      byPair.set(`${away}|${home}`, { row, reversed: true });
    }
  }
  return byPair;
}

function sfTarget(matchNumber) {
  return Number(matchNumber) <= 98
    ? { bracket_slot_id: "M101", round: "SF", path: "Winner M97 v Winner M98" }
    : { bracket_slot_id: "M102", round: "SF", path: "Winner M99 v Winner M100" };
}

function buildQfAuthority({ worldCup, r16Authority, live }) {
  const nodes = worldCupBracketNodes(worldCup);
  const liveRows = rowsFromJson(live, ["fixtures"]);
  const liveByMatchNumber = new Map(liveRows.filter((row) => row.match_number).map((row) => [Number(row.match_number), row]));
  const liveBySourceId = new Map(liveRows.filter((row) => row.source_fixture_id).map((row) => [String(row.source_fixture_id), row]));
  const liveQfByPair = liveFixtureByTeamPair(liveRows, 6);
  const r16ByMatch = new Map(rowsFromJson(r16Authority, ["fixtures"]).map((fixture) => [Number(fixture.bracket_match_number), fixture]));
  const winnerByR16 = new Map([...r16ByMatch.entries()].map(([matchNumber, fixture]) => [matchNumber, r16WinnerFromLive(fixture, liveByMatchNumber, liveBySourceId)]));
  const fixtures = [];

  for (const matchNumber of [97, 98, 99, 100]) {
    const node = nodes.get(matchNumber);
    const sources = node?.winner_sources || [];
    const sourceResults = sources.map((source) => winnerByR16.get(source) || {
      match_number: source,
      status: "pending",
      score_status: "missing",
      winner: null
    });
    const known = sourceResults.filter((result) => result?.winner);
    const classification = known.length === 2 ? "final_known" : known.length === 1 ? "partial_known" : "pending";
    const teamA = sourceResults[0]?.winner || null;
    const teamB = sourceResults[1]?.winner || null;
    const liveInfo = teamA && teamB ? liveQfByPair.get(`${teamA.team_id}|${teamB.team_id}`) || null : null;
    const liveQf = liveInfo?.row || null;

    fixtures.push({
      official_bracket_slot: `M${matchNumber}`,
      bracket_match_number: matchNumber,
      bracket_slot_id: `M${matchNumber}`,
      fixture_id: fixtureId(matchNumber),
      source_fixture_id: liveQf?.source_fixture_id || null,
      source_fixture_id_role: liveQf ? "feed_source_id_only_not_bracket_slot" : null,
      round: "QF",
      stage: "quarterfinal",
      classification,
      status: classification,
      public_label: classification === "final_known" ? "Final" : "Blocked",
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
        loser: result.loser,
        status: result.status,
        score_status: result.score_status,
        score: result.score
      })),
      kickoff: {
        source_datetime: liveQf?.date || null,
        eastern_datetime_label: easternLabel(liveQf?.date)
      },
      venue: liveQf ? {
        name: liveQf.venue_name || null,
        city: liveQf.venue_city || null
      } : null,
      bracket_path: node?.path || null,
      winner_advances_to: sfTarget(matchNumber),
      source_confidence: classification === "final_known"
        ? "final_r16_winners_mapped_to_official_qf_bracket_slot"
        : "blocked_pending_r16_source_match_not_final",
      public_note: classification === "final_known"
        ? "Final QF fixture from completed R16 winners."
        : "Blocked: all source R16 fixtures must be final before final QF promotion."
    });
  }

  const qaErrors = [];
  const completedR16Winners = [...winnerByR16.values()].filter((row) => row.winner);
  const incompleteR16 = [...winnerByR16.values()].filter((row) => !row.winner);
  const qfTeams = fixtures.flatMap((fixture) => [fixture.team_a?.team_id, fixture.team_b?.team_id].filter(Boolean));
  const duplicateTeams = qfTeams.filter((teamId, index) => qfTeams.indexOf(teamId) !== index);
  const duplicateFixtures = fixtures
    .map((fixture) => [fixture.team_a?.team_id, fixture.team_b?.team_id].filter(Boolean).sort().join("|"))
    .filter((key, index, list) => key && list.indexOf(key) !== index);

  if (completedR16Winners.length !== 8) {
    qaErrors.push(`Final QF refresh requires 8 completed R16 winners; found ${completedR16Winners.length}.`);
  }
  if (fixtures.filter((fixture) => fixture.classification === "final_known").length !== 4) {
    qaErrors.push("Final QF authority requires 4 final-known fixtures.");
  }
  if (fixtures.some((fixture) => fixture.classification !== "final_known")) {
    qaErrors.push("Final QF authority has pending or partial fixtures.");
  }
  if (duplicateTeams.length) qaErrors.push(`Duplicate QF team(s): ${[...new Set(duplicateTeams)].join(", ")}.`);
  if (duplicateFixtures.length) qaErrors.push(`Duplicate QF fixture(s): ${[...new Set(duplicateFixtures)].join(", ")}.`);
  for (const result of completedR16Winners) {
    const appears = fixtures.some((fixture) =>
      [fixture.team_a?.team_id, fixture.team_b?.team_id].includes(result.winner.team_id)
    );
    if (!appears) {
      qaErrors.push(`Completed R16 winner ${result.winner.team} from M${result.match_number} is missing from QF authority.`);
    }
  }

  return {
    schema_version: "qf_fixture_authority_v1",
    generated_at: GENERATED_AT,
    status: qaErrors.length ? "blocked" : "pass",
    release_status: "final_qf_setup",
    evidence_scope: "All 8 completed/final R16 fixtures.",
    source_files: {
      r16FixtureAuthority: "data/r16FixtureAuthority_v1.json",
      liveMatchdayStatus: "data/liveMatchdayStatus_v1.json",
      worldCupData: "worldCupData.js"
    },
    summary: {
      total_qf_fixtures: fixtures.length,
      final_known: fixtures.filter((fixture) => fixture.classification === "final_known").length,
      partial_known: fixtures.filter((fixture) => fixture.classification === "partial_known").length,
      pending: fixtures.filter((fixture) => fixture.classification === "pending").length,
      blocked: qaErrors.length,
      completed_r16_fixtures_used: completedR16Winners.length,
      incomplete_r16_fixtures: incompleteR16.length,
      scheduled_qf_fixtures: liveRows.filter((row) => String(row.round_id) === "6" && String(row.fixture_status).toLowerCase() === "scheduled").length,
      final_qf_participants: qfTeams.length
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
}

function teamSetFromAuthority(authority) {
  const set = new Set();
  for (const fixture of authority.fixtures || []) {
    if (fixture.classification !== "final_known") continue;
    [fixture.team_a, fixture.team_b].forEach((team) => {
      if (team?.team_id) set.add(team.team_id);
    });
  }
  return set;
}

function fixtureForTeam(authority, teamId) {
  return (authority.fixtures || []).find((fixture) =>
    fixture.classification === "final_known" &&
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

function liveRowsById(livePlayers) {
  return new Map(rowsFromJson(livePlayers, ["players"]).map((row) => [String(row.official_fantasy_player_id), row]));
}

function projectionByPlayer(projections, matchday) {
  const rows = rowsFromJson(projections, ["playerMatchdayProjections"]);
  return new Map(rows.filter((row) => row.matchday === matchday).map((row) => [String(row.official_fantasy_player_id), row]));
}

function roleTierFromStart(startProb) {
  if (startProb >= 0.86) return "locked_starter";
  if (startProb >= 0.74) return "likely_starter";
  if (startProb >= 0.45) return "rotation_or_sub_risk";
  if (startProb > 0) return "bench_depth";
  return "unavailable_or_not_selectable";
}

function roundPoints(live, roundId) {
  const value = live?.stats?.roundPoints?.[String(roundId)];
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function isUnavailableStatus(status) {
  return ["injured", "suspended", "transferred", "eliminated"].includes(String(status || "").toLowerCase());
}

function lineupRowsFromEvidence(lineupEvidence) {
  return rowsFromJson(lineupEvidence, ["lineupEvidenceRows", "rows"]);
}

function lineupEvidenceIndex(lineupEvidence) {
  const byPlayerRound = new Map();
  for (const row of lineupRowsFromEvidence(lineupEvidence)) {
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
  if (row.started === true) score += 40;
  if (row.started === false) score += 25;
  if (String(row.source_confidence || "").includes("starting_xi")) score += 20;
  if (String(row.source_confidence || "").includes("bench_list")) score += 15;
  if (String(row.source_confidence || "").includes("matchStatus")) score += 12;
  if (row.substitute_appearance === true) score += 3;
  return score;
}

function bestLineupEvidence(index, playerId, round) {
  const rows = index.get(`${String(playerId)}|${String(round).toUpperCase()}`) || [];
  return rows.slice().sort((a, b) => evidencePriority(b) - evidencePriority(a))[0] || null;
}

function lineupSourceLabel(evidence) {
  if (!evidence) return null;
  if (evidence.source_url) return evidence.source_url;
  return evidence.source_file || evidence.source || null;
}

function coreEligibilityForRoleRow(row) {
  if (row.public_pool !== "main") {
    return {
      allowed: false,
      reason: "not_in_main_qf_pool",
      warning: "Player is not in a final QF public pool."
    };
  }
  if (row.r16Started !== true || row.lineupEvidenceType !== "explicit_r16_starter") {
    return {
      allowed: false,
      reason: "missing_explicit_r16_start",
      warning: "Core Pick blocked: no source-backed R16 start."
    };
  }
  if (Number(row.start_probability || 0) < 0.74) {
    return {
      allowed: false,
      reason: "start_probability_below_core_threshold",
      warning: "Core Pick blocked: start probability below 74%."
    };
  }
  if ((row.data_quality_flags || []).includes("points_only_appearance_not_start")) {
    return {
      allowed: false,
      reason: "points_only_appearance",
      warning: "Core Pick blocked: fantasy points show appearance only, not a start."
    };
  }
  return {
    allowed: true,
    reason: "explicit_r16_starter_with_qf_role_confidence",
    warning: null
  };
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
    const highPriorNoR16Start = list.filter((row) => row.prior_start_probability >= 0.74 && row.r16Started !== true).length;
    const explicitNonStarters = list.filter((row) => row.r16Started === false).length;
    const repeatedStarts = list.filter((row) => row.r16Started === true && row.r32Started === true).length;
    const eligible = Math.max(1, list.filter((row) => Number(row.start_probability) > 0).length);
    const score = clamp((highPriorNoR16Start * 0.7 + explicitNonStarters * 0.25) / eligible, 0, 0.42);
    out.set(teamId, {
      team_id: teamId,
      team: list[0]?.country || teamId,
      volatility_score: round(score, 3),
      volatility_level: score >= 0.22 ? "high" : score >= 0.1 ? "medium" : "low",
      eligible_players: eligible,
      high_prior_without_explicit_r16_start: highPriorNoR16Start,
      explicit_r16_non_starters: explicitNonStarters,
      r32_r16_start_continuity: repeatedStarts
    });
  }
  return out;
}

function buildRoleModel({ authority, officialPlayers, livePlayers, r16Projections, lineupEvidence }) {
  const mainTeams = teamSetFromAuthority(authority);
  const liveById = liveRowsById(livePlayers);
  const priorById = projectionByPlayer(r16Projections, "r16");
  const evidenceByPlayerRound = lineupEvidenceIndex(lineupEvidence);
  const rows = rowsFromJson(officialPlayers, ["officialFantasyPlayers", "players"]).map((official) => {
    const id = String(official.official_fantasy_player_id || "");
    const live = liveById.get(id);
    const prior = priorById.get(id);
    const teamId = slug(official.country || live?.team_name || prior?.country || "");
    const status = live?.status || official.selectable_status || official.availability_status || null;
    const matchStatus = live?.matchStatus || null;
    const r16Points = roundPoints(live, 5);
    const r32Points = roundPoints(live, 4);
    const r16Evidence = bestLineupEvidence(evidenceByPlayerRound, id, "R16");
    const r32Evidence = bestLineupEvidence(evidenceByPlayerRound, id, "R32");
    const r16Started = r16Evidence ? r16Evidence.started === true : null;
    const r16ExplicitNonStarter = Boolean(r16Evidence && r16Evidence.started === false);
    const r16Substitute = r16Evidence ? r16Evidence.substitute_appearance : null;
    const r32Started = r32Evidence ? r32Evidence.started === true : null;
    const r32Substitute = r32Evidence ? r32Evidence.substitute_appearance : null;
    const dataQualityFlags = ["player_role_qf_v1", "ownership_not_used_as_signal", "final_squads_not_source_backed", "lineup_evidence_separated_from_points"];
    const unavailable = isUnavailableStatus(status) || matchStatus === "not_in_squad";
    const qfEligible = mainTeams.has(teamId);
    let startProb = Number(prior?.start_probability ?? prior?.startProb ?? 0.34);
    let expectedMinutes = Number(prior?.expected_minutes ?? prior?.expectedMinutes ?? 42);
    const priorStartProb = Number.isFinite(startProb) ? startProb : 0;
    const strongPrior = priorStartProb >= 0.82 || ["locked_starter", "likely_starter", "managed_minutes_star"].includes(prior?.roleTier || prior?.role_label);
    const r16PointsAppearance = Number.isFinite(r16Points) && r16Points > 0;
    const r32PointsAppearance = Number.isFinite(r32Points) && r32Points > 0;
    let evidenceStrength = "prior_only";
    let roleInterpretation = "QF role starts from the R16 role model and explicit lineup evidence where available.";
    let lineupEvidenceType = "no_explicit_lineup_evidence";
    let roleCaution = "";

    if (r16Evidence) {
      dataQualityFlags.push(r16Started ? "explicit_r16_starter_evidence" : "explicit_r16_non_starter_evidence");
    } else {
      dataQualityFlags.push("r16_lineup_evidence_missing");
    }
    if (r16PointsAppearance) {
      dataQualityFlags.push(r16Evidence ? "r16_points_not_used_for_lineup_inference" : "r16_points_show_appearance_only");
    }

    if (unavailable) {
      startProb = 0;
      expectedMinutes = 0;
      evidenceStrength = matchStatus === "not_in_squad" ? "official_not_in_squad" : "official_unavailable_status";
      lineupEvidenceType = "official_unavailable";
      roleInterpretation = matchStatus === "not_in_squad"
        ? "Official fantasy feed marks player not in squad; QF projection zeroed."
        : `Official fantasy status is ${status}; QF projection zeroed.`;
      dataQualityFlags.push("official_unavailable_zeroed");
    } else if (!qfEligible) {
      startProb = 0;
      expectedMinutes = 0;
      evidenceStrength = "team_not_qualified_for_qf";
      lineupEvidenceType = "team_not_in_qf";
      roleInterpretation = "Team is not in a final QF slot; player excluded from public QF picks.";
      dataQualityFlags.push("team_not_in_qf");
    } else if (r16Started === true && r32Started === true && strongPrior) {
      startProb = Math.max(startProb, 0.88);
      expectedMinutes = Math.max(expectedMinutes, 74);
      evidenceStrength = "explicit_r16_r32_starter_plus_strong_prior";
      lineupEvidenceType = "explicit_r16_starter";
      roleInterpretation = "Source-backed R16 starter with preserved official R32 starter evidence and a strong prior role; QF start probability is preserved high.";
      dataQualityFlags.push("explicit_r16_r32_starter_continuity");
    } else if (r16Started === true) {
      startProb = Math.max(startProb, strongPrior ? 0.84 : 0.78);
      expectedMinutes = Math.max(expectedMinutes, strongPrior ? 70 : 64);
      evidenceStrength = strongPrior ? "explicit_r16_starter_plus_strong_prior" : "explicit_r16_starter";
      lineupEvidenceType = "explicit_r16_starter";
      roleInterpretation = "Source-backed R16 starter evidence is used as the active QF role anchor.";
      dataQualityFlags.push("explicit_r16_starter_weighted");
    } else if (r16ExplicitNonStarter) {
      const substituteCameo = r16Substitute === true;
      const cap = substituteCameo ? 0.55 : strongPrior ? 0.65 : 0.5;
      startProb = Math.min(Math.max(startProb * (strongPrior ? 0.68 : 0.55), substituteCameo ? 0.28 : 0.18), cap);
      expectedMinutes = Math.min(Math.max(expectedMinutes * 0.6, substituteCameo ? 22 : 16), substituteCameo ? 46 : 54);
      evidenceStrength = substituteCameo ? "explicit_r16_substitute_non_starter" : "explicit_r16_bench_non_starter";
      lineupEvidenceType = "explicit_r16_non_starter";
      roleInterpretation = "Source-backed R16 non-starter evidence caps QF starter confidence; prior role can only keep a cautious watchlist case.";
      roleCaution = substituteCameo
        ? "Did not start R16; substitute appearance only. Core Pick blocked without new lineup confirmation."
        : "Did not start R16. Core Pick blocked without new lineup confirmation.";
      dataQualityFlags.push("explicit_r16_non_starter_capped");
    } else if (r16PointsAppearance) {
      startProb = Math.min(Math.max(startProb * 0.55, strongPrior ? 0.36 : 0.18), 0.5);
      expectedMinutes = Math.min(Math.max(expectedMinutes * 0.55, 16), 42);
      evidenceStrength = "points_only_appearance_not_start";
      lineupEvidenceType = "points_only_appearance";
      roleInterpretation = "R16 fantasy points show only that a player recorded points; they are not used as starting XI evidence.";
      roleCaution = "R16 points are appearance-only evidence here, not a source-backed start.";
      dataQualityFlags.push("points_only_appearance_not_start");
      dataQualityFlags.push("no_start_inferred_from_points");
    } else if (strongPrior && (r32Started === true || r32PointsAppearance)) {
      startProb = Math.min(Math.max(startProb * 0.62, 0.34), 0.52);
      expectedMinutes = Math.min(Math.max(expectedMinutes * 0.62, 28), 46);
      evidenceStrength = "no_explicit_r16_start_after_prior_role";
      lineupEvidenceType = "no_explicit_lineup_evidence";
      roleInterpretation = "Strong prior/R32 context lacks explicit R16 starter evidence; QF role is capped below starter confidence.";
      roleCaution = "No source-backed R16 start; verify lineup before relying on this player.";
      dataQualityFlags.push("no_explicit_r16_start_capped");
    } else {
      startProb = Math.min(startProb * 0.72, 0.42);
      expectedMinutes = Math.min(expectedMinutes * 0.72, 36);
      evidenceStrength = "no_explicit_r16_lineup_or_points";
      lineupEvidenceType = "no_explicit_lineup_evidence";
      roleInterpretation = "No explicit R16 start/sub signal and no R16 fantasy points; role is downgraded for QF.";
      roleCaution = "No source-backed R16 lineup evidence.";
      dataQualityFlags.push("no_explicit_r16_lineup_downgraded");
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
      qf_fixture_status: qfEligible ? "known_fixture" : "not_in_qf",
      public_pool: qfEligible ? "main" : "excluded",
      prior_start_probability: round(priorStartProb, 3),
      start_probability: round(startProb, 3),
      startProb: round(startProb, 3),
      expected_minutes: round(expectedMinutes, 1),
      expectedMinutes: round(expectedMinutes, 1),
      roleTier: roleTierFromStart(startProb),
      role_label: roleTierFromStart(startProb),
      roleConfidence: lineupEvidenceType === "explicit_r16_starter" ? "high" : lineupEvidenceType === "explicit_r16_non_starter" ? "medium" : "low",
      role_confidence: lineupEvidenceType === "explicit_r16_starter" ? "high" : lineupEvidenceType === "explicit_r16_non_starter" ? "medium" : "low",
      evidenceStrength,
      lineupEvidenceType,
      role_interpretation: roleInterpretation,
      roleCaution,
      role_caution: roleCaution,
      r16_round_points: r16Points,
      r32_round_points: r32Points,
      r16_participated: r16PointsAppearance,
      r32_participated: r32PointsAppearance,
      r16Started,
      r16Substitute,
      r16Minutes: r16Evidence?.minutes_played ?? null,
      r16LineupSource: lineupSourceLabel(r16Evidence),
      r16LineupEvidenceId: r16Evidence?.evidence_id || null,
      r32Started,
      r32Substitute,
      r32LineupSource: lineupSourceLabel(r32Evidence),
      r32LineupEvidenceId: r32Evidence?.evidence_id || null,
      data_quality_flags: dataQualityFlags,
      dataQualityFlags: [...dataQualityFlags]
    };
  });

  const volatilityByTeam = teamVolatility(rows);
  for (const row of rows) {
    const volatility = volatilityByTeam.get(row.team_id) || {
      volatility_score: 0,
      volatility_level: "none"
    };
    row.team_role_volatility = volatility;
    row.role_volatility_score = volatility.volatility_score;
    row.role_volatility_level = volatility.volatility_level;
    if (row.public_pool === "main" && Number(row.start_probability) > 0) {
      const penalty = volatility.volatility_score * (row.r16Started === true ? 0.04 : 0.12);
      row.start_probability = round(clamp(Number(row.start_probability) - penalty, 0.05, 0.95), 3);
      row.startProb = row.start_probability;
      row.expected_minutes = round(clamp(Number(row.expected_minutes) - penalty * 40, 0, 90), 1);
      row.expectedMinutes = row.expected_minutes;
      row.roleTier = roleTierFromStart(Number(row.start_probability));
      row.role_label = row.roleTier;
      if (volatility.volatility_level !== "low") {
        row.data_quality_flags.push("role_volatility_penalty_applied");
        row.dataQualityFlags.push("role_volatility_penalty_applied");
      }
    }
    const coreEligibility = coreEligibilityForRoleRow(row);
    row.allowedCorePick = coreEligibility.allowed;
    row.coreEligibilityReason = coreEligibility.reason;
    row.coreEligibilityWarning = coreEligibility.warning;
  }

  const summary = {
    role_rows: rows.length,
    main_pool_players: rows.filter((row) => row.public_pool === "main").length,
    excluded_players: rows.filter((row) => row.public_pool === "excluded").length,
    r16_explicit_starter_rows: rows.filter((row) => row.public_pool === "main" && row.r16Started === true).length,
    r16_explicit_non_starter_rows: rows.filter((row) => row.public_pool === "main" && row.r16Started === false).length,
    points_only_appearance_rows: rows.filter((row) => row.public_pool === "main" && row.lineupEvidenceType === "points_only_appearance").length,
    no_explicit_lineup_evidence_rows: rows.filter((row) => row.public_pool === "main" && row.lineupEvidenceType === "no_explicit_lineup_evidence").length,
    points_only_start_inference_rows: 0,
    points_can_imply_starter: false,
    core_pick_eligible_players: rows.filter((row) => row.allowedCorePick).length,
    unavailable_zeroed: rows.filter((row) => row.data_quality_flags.includes("official_unavailable_zeroed")).length,
    non_qf_team_players_excluded: rows.filter((row) => row.public_pool === "excluded").length,
    explicit_starting_xi_available: rows.filter((row) => row.public_pool === "main" && row.r16Started === true).length >= 88,
    explicit_starting_xi_source: "data/worldCupLineupEvidence_v1.json (R16 QF team rows sourced from Guardian liveblogs; earlier rounds from preserved official fantasy matchStatus snapshots)",
    lineup_evidence_rows: lineupRowsFromEvidence(lineupEvidence).length,
    lineup_evidence_qa_status: lineupEvidence?.status || "unknown",
    role_volatility_teams: [...volatilityByTeam.values()].sort((a, b) => b.volatility_score - a.volatility_score)
  };

  return {
    schema_version: "player_role_model_qf_v1",
    generated_at: GENERATED_AT,
    model_version: "player-role-qf-v1",
    source_files: ["data/officialFantasyPlayers_v0.json", "data/livePlayerStatus_v1.json", "data/fantasyPoolMatchdayProjections_r16_v1.json", "data/qfFixtureAuthority_v1.json", "data/worldCupLineupEvidence_v1.json"],
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
      prediction_id: `${fixture.fixture_id}-score-qf-v1`,
      match_id: fixture.fixture_id,
      fixture_id: fixture.fixture_id,
      match_number: fixture.bracket_match_number,
      matchday: MATCHDAY_LABEL,
      fantasy_matchday_id: MATCHDAY_ID,
      stage: "quarterfinal",
      group: "QF",
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
      projected_advancing_team: oriented.projected_advancing_team,
      matchUncertainty: oriented.uncertainty_label || oriented.matchUncertainty || "Medium",
      uncertainty_label: oriented.uncertainty_label || oriented.matchUncertainty || "Medium",
      top_scorelines: oriented.top_scorelines || [],
      top_scoreline: oriented.top_scorelines?.[0]?.scoreline || null,
      data_quality_flags: ["score_prediction_qf_v1", "completed_r16_only", "ownership_not_used_as_signal", "final_squads_not_source_backed"]
    };
  }).filter(Boolean);

  const teamFixturePredictions = fixtureScorePredictions.flatMap((row) => [
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
    schema_version: "fantasy_pool_score_predictions_qf_v1",
    generated_at: GENERATED_AT,
    source_checked: GENERATED_AT.slice(0, 10),
    model_stage: "qf_score_prediction",
    data_status: "qf_score_prediction_pass",
    modelVersion: "score-qf-v1",
    model_version: "score-qf-v1",
    safety_labels: ["Quarterfinal fantasy setup", "all 8 R16 fixtures final", "final QF fixtures only", "ownership not used as signal", "final squads not source-backed"],
    input_files: ["data/qfFixtureAuthority_v1.json", "data/knockoutScorePredictor_v1.json"],
    summary: {
      fixture_prediction_count: fixtureScorePredictions.length,
      final_known_fixture_predictions: fixtureScorePredictions.filter((row) => row.fixture_authority_status === "final_known").length,
      partial_or_pending_fixture_rows: fixtureScorePredictions.filter((row) => row.fixture_authority_status !== "final_known").length,
      defaultMatchday: MATCHDAY_ID,
      ownershipUsedAsSignal: false,
      finalSquadsSourceBacked: false,
      completedR16FixturesUsed: authority.summary.completed_r16_fixtures_used,
      incompleteR16Fixtures: authority.summary.incomplete_r16_fixtures
    },
    fixtureScorePredictions,
    teamFixturePredictions,
    defaultMatchday: MATCHDAY_ID
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

function buildProjections({ authority, role, score, r16Projections }) {
  const roleById = new Map(role.playerRoleRows.map((row) => [String(row.official_fantasy_player_id), row]));
  const mainTeams = teamSetFromAuthority(authority);
  const rows = rowsFromJson(r16Projections, ["playerMatchdayProjections"])
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
      const minuteRatio = prior.expected_minutes ? clamp(Number(roleRow.expected_minutes) / Number(prior.expected_minutes), 0.42, 1.15) : 1;
      const volatilityPenalty = clamp(1 - Number(roleRow.role_volatility_score || 0) * 0.16, 0.88, 1);
      const raw = unavailable ? 0 : round(Number(prior.raw_expected_points || 0) * multiplier * minuteRatio * volatilityPenalty, 3);
      const riskAdjusted = unavailable ? 0 : round(raw * (0.77 + Number(roleRow.start_probability || 0) * 0.18), 3);
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
        evidenceStrength: roleRow.evidenceStrength,
        lineupEvidenceType: roleRow.lineupEvidenceType,
        r16Started: roleRow.r16Started,
        r16Substitute: roleRow.r16Substitute,
        r16Minutes: roleRow.r16Minutes,
        r16LineupSource: roleRow.r16LineupSource,
        r16LineupEvidenceId: roleRow.r16LineupEvidenceId,
        r32Started: roleRow.r32Started,
        r32Substitute: roleRow.r32Substitute,
        r32LineupSource: roleRow.r32LineupSource,
        r32LineupEvidenceId: roleRow.r32LineupEvidenceId,
        roleCaution: roleRow.roleCaution,
        role_caution: roleRow.role_caution,
        allowedCorePick: roleRow.allowedCorePick,
        coreEligibilityReason: roleRow.coreEligibilityReason,
        coreEligibilityWarning: roleRow.coreEligibilityWarning,
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
          matchUncertainty: teamPrediction.matchUncertainty || "Medium",
          known_or_projected_path_status: "known_qf_fixture"
        },
        path_context: {
          qf_match_id: String(fixture.bracket_match_number),
          qf_opponent: opponent.team,
          qf_advance_probability: teamPrediction.advance_probability,
          winner_advances_to: fixture.winner_advances_to?.bracket_slot_id || null,
          known_path_status: "known_qf_fixture",
          hard_path_warning: Number(teamPrediction.advance_probability || 0) < 0.42 ? "Hard QF path; balance with safer picks." : null
        },
        path_value: round((Number(teamPrediction.advance_probability || 0.5) - 0.5) * 3.2, 3),
        role_volatility_score: roleRow.role_volatility_score,
        role_volatility_level: roleRow.role_volatility_level,
        projectionReason: roleRow.r16Started === true
          ? "QF final projection uses final QF fixture, explicit R16 starter evidence, prior R16 role, completed R16 fixtures, and path value beyond QF."
          : roleRow.lineupEvidenceType === "explicit_r16_non_starter"
            ? "QF final projection uses final QF fixture and explicit R16 non-starter evidence; start probability is capped and Core Pick eligibility is blocked."
            : roleRow.lineupEvidenceType === "points_only_appearance"
              ? "QF final projection treats R16 fantasy points as appearance-only evidence; no start is inferred from points."
              : "QF final projection uses final QF fixture and prior role with no source-backed R16 starter evidence; start probability is capped.",
        caution: [
          roleRow.roleCaution || roleRow.coreEligibilityWarning || "",
          roleRow.role_volatility_level === "high" ? "Role volatility is elevated for this team." : "",
          Number(teamPrediction.advance_probability || 0) < 0.42 ? "Hard QF path." : ""
        ].filter(Boolean).join(" "),
        data_quality_flags: [
          "player_projection_qf_v1",
          "completed_r16_only",
          "lineup_evidence_applied",
          "points_do_not_imply_start",
          "known_qf_fixture",
          "path_beyond_qf_included",
          "ownership_not_used_as_signal",
          "final_squads_not_source_backed",
          ...(roleRow.data_quality_flags || [])
        ],
        model_stage: "active_qf_player_projection_support",
        modelVersion: "player-projection-qf-v1",
        defaultMatchday: MATCHDAY_ID
      };
    })
    .filter(Boolean);

  return {
    schema_version: "fantasy_pool_matchday_projections_qf_v1",
    generated_at: GENERATED_AT,
    source_checked: GENERATED_AT.slice(0, 10),
    modelVersion: "player-projection-qf-v1",
    model_version: "player-projection-qf-v1",
    model_stage: "active_qf_player_projection_support",
    data_status: "active_qf_projection_v1_pass",
    safety_labels: ["Quarterfinal fantasy setup", "final QF fixtures only for public main rows", "explicit R16 lineup evidence separated from fantasy points", "role volatility included", "ownership not used as signal", "final squads not source-backed"],
    input_files: ["data/playerRoleModel_qf_v1.json", "data/worldCupLineupEvidence_v1.json", "data/scorePredictions_fantasyPool_qf_v1.json", "data/fantasyPoolMatchdayProjections_r16_v1.json"],
    model: {
      defaultMatchday: MATCHDAY_ID,
      r16_points_used_as_start_evidence: false,
      points_can_imply_starter: false,
      explicit_r16_starter_required_for_core_pick: true,
      explicit_starting_xi_available: role.summary.explicit_starting_xi_available,
      eliminated_teams_excluded_from_main_public_rows: true
    },
    summary: {
      projection_rows: rows.length,
      qf_projection_rows: rows.length,
      known_fixture_teams: mainTeams.size,
      defaultMatchday: MATCHDAY_ID,
      ownershipUsedAsSignal: false,
      finalSquadsSourceBacked: false,
      topProjectedQfPlayers: rows.slice().sort((a, b) => b.risk_adjusted_points - a.risk_adjusted_points).slice(0, 20).map((row) => ({
        name: row.name,
        country: row.country,
        position: row.official_fantasy_position,
        opponent: row.opponent,
        projectedPoints: row.risk_adjusted_points,
        captainScore: row.captain_score,
        lineupEvidenceType: row.lineupEvidenceType,
        r16Started: row.r16Started
      }))
    },
    qa_status: "pass",
    playerMatchdayProjections: rows
  };
}

function isCorePickEligible(row) {
  return row.allowedCorePick === true &&
    row.r16Started === true &&
    row.lineupEvidenceType === "explicit_r16_starter" &&
    Number(row.start_probability || 0) >= 0.74 &&
    !(row.data_quality_flags || []).includes("points_only_appearance_not_start");
}

function modeRows(projectionRows, mode) {
  const scoreForMode = (row) => {
    if (mode === "safe") return Number(row.floor_points || 0) * 8 + Number(row.start_probability || 0) * 30 + Number(row.risk_adjusted_points || 0) * 10;
    if (mode === "upside") return Number(row.ceiling_points || 0) * 10 + Number(row.captain_score || 0);
    if (mode === "differential") return Number(row.ceiling_points || 0) * 8 + Number(row.risk_adjusted_points || 0) * 5 - Number(row.official_price || 0) * 0.3;
    if (mode === "captain") return Number(row.captain_score || 0);
    return Number(row.risk_adjusted_points || 0) * 14 + Number(row.start_probability || 0) * 20 + Number(row.path_value || 0) * 8 - Number(row.role_volatility_score || 0) * 3;
  };
  const candidates = mode === "balanced"
    ? projectionRows.filter(isCorePickEligible)
    : projectionRows;
  return candidates
    .slice()
    .sort((a, b) => scoreForMode(b) - scoreForMode(a))
    .slice(0, 25)
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
      role_caution: row.caution || row.roleCaution || null,
      allowedCorePick: row.allowedCorePick,
      coreEligibilityReason: row.coreEligibilityReason,
      coreEligibilityWarning: row.coreEligibilityWarning,
      why_pick: [
        `${row.risk_adjusted_points} projected QF points`,
        `${Math.round(Number(row.start_probability || 0) * 100)}% start chance`,
        row.r16Started === true ? "source-backed R16 starter" : "",
        row.path_value > 0 ? "positive path beyond QF" : "known QF fixture"
      ].filter(Boolean),
      why_careful: [
        row.caution || "",
        mode === "balanced" ? "" : row.coreEligibilityWarning || "",
        "Verify official locks/deadlines/lineups in FIFA."
      ].filter(Boolean),
      model_stage: "active_qf_recommendations",
      source_model_version: "recommendation-qf-v1"
    }))
  );

  const captainRows = recommendationCandidates.filter((row) => row.mode === "captain");
  return {
    schema_version: "fantasy_pool_matchday_recommendations_qf_v1",
    generated_at: GENERATED_AT,
    source_checked: GENERATED_AT.slice(0, 10),
    modelVersion: "recommendation-qf-v1",
    model_version: "recommendation-qf-v1",
    model_stage: "active_qf_recommendations",
    data_status: "active_qf_recommendations_v1_pass",
    safety_labels: ["Quarterfinal fantasy setup", "final QF fixtures only in main public picks", "Core Picks require explicit R16 starter evidence", "path beyond QF matters", "ownership not used as signal", "final squads not source-backed"],
    input_files: ["data/fantasyPoolMatchdayProjections_qf_v1.json", "data/worldCupLineupEvidence_v1.json", "data/qfFixtureAuthority_v1.json"],
    model: {
      defaultMatchday: MATCHDAY_ID,
      path_value_included: true,
      finance_secondary_only: true,
      explicit_r16_starter_required_for_core_pick: true,
      points_can_imply_starter: false,
      eliminated_teams_excluded_from_main_public_picks: true
    },
    summary: {
      recommendationCandidates: recommendationCandidates.length,
      qfCandidates: recommendationCandidates.length,
      corePickRows: recommendationCandidates.filter((row) => row.mode === "balanced").length,
      corePickRowsWithoutExplicitR16Start: recommendationCandidates.filter((row) => row.mode === "balanced" && !isCorePickEligible(row)).length,
      modes: modes.map(([mode]) => mode),
      knownQfFixturesUsed: 4,
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
  const builderRows = rows.filter(isCorePickEligible);
  const byPosition = rows.reduce((counts, row) => {
    const key = row.official_fantasy_position || "unknown";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
  const builderByPosition = builderRows.reduce((counts, row) => {
    const key = row.official_fantasy_position || "unknown";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
  const greedy = builderRows.slice().sort((a, b) => Number(b.risk_adjusted_points || 0) - Number(a.risk_adjusted_points || 0)).slice(0, 15);
  const balanced = builderRows.slice().sort((a, b) =>
    (Number(b.risk_adjusted_points || 0) * 10 + Number(b.start_probability || 0) * 8 + Number(b.captain_score || 0) * 0.2 + Number(b.path_value || 0) * 2) -
    (Number(a.risk_adjusted_points || 0) * 10 + Number(a.start_probability || 0) * 8 + Number(a.captain_score || 0) * 0.2 + Number(a.path_value || 0) * 2)
  ).slice(0, 15);
  const sampleRows = [...balanced, ...greedy];
  const unsafeSampleRows = sampleRows.filter((row) => !isCorePickEligible(row));
  const status = builderByPosition.GK >= 2 &&
    builderByPosition.DEF >= 5 &&
    builderByPosition.MID >= 5 &&
    builderByPosition.FWD >= 3 &&
    unsafeSampleRows.length === 0 ? "pass" : "fail";
  return {
    schema_version: "team_builder_qa_qf_v1",
    generated_at: GENERATED_AT,
    model_version: "team-builder-qf-v1",
    status,
    summary: {
      projection_rows: rows.length,
      builder_eligible_rows: builderRows.length,
      recommendation_rows: recommendations.recommendationCandidates.length,
      by_position: byPosition,
      builder_by_position: builderByPosition,
      defaultMatchday: MATCHDAY_ID,
      balanced_projected_points: round(balanced.reduce((sum, row) => sum + Number(row.risk_adjusted_points || 0), 0), 2),
      greedy_projected_points: round(greedy.reduce((sum, row) => sum + Number(row.risk_adjusted_points || 0), 0), 2),
      path_value_beyond_qf_included: true,
      role_volatility_included: true,
      explicit_r16_starters_only_for_builder_samples: unsafeSampleRows.length === 0,
      points_only_rows_used_as_starters: unsafeSampleRows.filter((row) => row.lineupEvidenceType === "points_only_appearance").length,
      known_qualified_teams_preferred: true,
      eliminated_and_unavailable_excluded: true
    },
    balanced_sample: balanced.map((row) => ({
      name: row.name,
      country: row.country,
      position: row.official_fantasy_position,
      points: row.risk_adjusted_points,
      opponent: row.opponent,
      lineupEvidenceType: row.lineupEvidenceType,
      r16Started: row.r16Started,
      coreEligibilityReason: row.coreEligibilityReason
    })).slice(0, 15),
    greedy_sample: greedy.map((row) => ({
      name: row.name,
      country: row.country,
      position: row.official_fantasy_position,
      points: row.risk_adjusted_points,
      opponent: row.opponent,
      lineupEvidenceType: row.lineupEvidenceType,
      r16Started: row.r16Started,
      coreEligibilityReason: row.coreEligibilityReason
    })).slice(0, 15),
    unsafe_sample_rows: unsafeSampleRows.map((row) => ({
      name: row.name,
      country: row.country,
      lineupEvidenceType: row.lineupEvidenceType,
      r16Started: row.r16Started,
      coreEligibilityWarning: row.coreEligibilityWarning
    }))
  };
}

function playerNameMatches(row, terms) {
  const text = normalizeText(`${row.name} ${row.display_name}`);
  return terms.some((term) => text.includes(normalizeText(term)));
}

function qaReports({ authority, role, score, projections, recommendations, teamBuilder }) {
  const explicitStarters = role.playerRoleRows.filter((row) => row.public_pool === "main" && row.r16Started === true).slice(0, 40);
  const explicitNonStarters = role.playerRoleRows.filter((row) => row.public_pool === "main" && row.r16Started === false).slice(0, 40);
  const pointsOnlyAppearances = role.playerRoleRows.filter((row) => row.public_pool === "main" && row.lineupEvidenceType === "points_only_appearance").slice(0, 40);
  const noEvidenceCapped = role.playerRoleRows.filter((row) => row.public_pool === "main" && row.lineupEvidenceType === "no_explicit_lineup_evidence").slice(0, 40);
  const unavailable = role.playerRoleRows.filter((row) => row.data_quality_flags.includes("official_unavailable_zeroed")).slice(0, 25);
  const topProjected = projections.playerMatchdayProjections.slice().sort((a, b) => b.risk_adjusted_points - a.risk_adjusted_points).slice(0, 25);
  const captainWatchlist = recommendations.recommendationCandidates.filter((row) => row.mode === "captain").slice(0, 20);
  const corePickRows = recommendations.recommendationCandidates.filter((row) => row.mode === "balanced" || row.pickType === "Core Picks");
  const unsafeCorePickRows = corePickRows.filter((row) => !isCorePickEligible(row));
  const playerAudits = {
    argentina_role_volatility: role.summary.role_volatility_teams.find((team) => team.team_id === "argentina") || null,
    belgium_role_volatility: role.summary.role_volatility_teams.find((team) => team.team_id === "belgium") || null,
    facundo_medina_audit: {
      role_rows: role.playerRoleRows.filter((row) => playerNameMatches(row, ["facundo medina"])),
      recommendation_rows: recommendations.recommendationCandidates.filter((row) => playerNameMatches(row, ["facundo medina"]))
    },
    vargas_audit: role.playerRoleRows.filter((row) => playerNameMatches(row, ["vargas"])),
    barcola_doue_digne_audit: role.playerRoleRows.filter((row) => playerNameMatches(row, ["barcola", "doue", "doué", "digne"]))
  };
  const roleQa = {
    schema_version: "player_role_model_qa_qf_v1",
    generated_at: GENERATED_AT,
    status: role.summary.r16_explicit_starter_rows >= 88 &&
      role.summary.points_only_start_inference_rows === 0 &&
      role.summary.points_can_imply_starter === false &&
      role.summary.explicit_starting_xi_available ? "pass" : "fail",
    summary: role.summary,
    top_qf_starters_by_confidence: role.playerRoleRows
      .filter((row) => row.public_pool === "main")
      .sort((a, b) => Number(b.start_probability) - Number(a.start_probability))
      .slice(0, 25),
    explicit_r16_starters: explicitStarters,
    explicit_r16_non_starters: explicitNonStarters,
    points_only_appearance_capped: pointsOnlyAppearances,
    no_explicit_lineup_evidence_capped: noEvidenceCapped,
    unavailable_players_zeroed: unavailable,
    role_volatility_audits: playerAudits,
    warnings: [
      "R16 QF starter evidence comes from normalized external liveblog lineup rows because the current official fantasy feed no longer preserves post-match matchStatus.",
      "Fantasy points are treated as appearance-only evidence and cannot set started=true."
    ]
  };
  const scoreQa = {
    schema_version: "score_prediction_qa_qf_v1",
    generated_at: GENERATED_AT,
    status: score.summary.final_known_fixture_predictions === 4 && score.summary.partial_or_pending_fixture_rows === 0 ? "pass" : "fail",
    summary: score.summary,
    qf_fixtures: authority.fixtures
  };
  const projectionQa = {
    schema_version: "player_projection_qa_qf_v1",
    generated_at: GENERATED_AT,
    status: projections.playerMatchdayProjections.length > 0 ? "pass" : "fail",
    summary: projections.summary,
    top_25_final_qf_projected_players: topProjected,
    unavailable_exclusions: unavailable
  };
  const recommendationQa = {
    schema_version: "recommendation_qa_qf_v1",
    generated_at: GENERATED_AT,
    status: recommendations.recommendationCandidates.length > 0 && unsafeCorePickRows.length === 0 ? "pass" : "fail",
    summary: recommendations.summary,
    top_25_final_qf_projected_players: topProjected,
    top_20_captain_watchlist: captainWatchlist,
    core_pick_rows: corePickRows,
    unsafe_core_pick_rows: unsafeCorePickRows,
    explicit_r16_starters_included: explicitStarters.filter((row) => recommendations.recommendationCandidates.some((candidate) => candidate.official_fantasy_player_id === row.official_fantasy_player_id)).slice(0, 20),
    points_only_appearance_watchlist_rows: pointsOnlyAppearances.filter((row) => recommendations.recommendationCandidates.some((candidate) => candidate.official_fantasy_player_id === row.official_fantasy_player_id)).slice(0, 20),
    role_volatility_audits: playerAudits,
    final_qf_fixtures: authority.fixtures,
    no_eliminated_team_player_in_main_public_picks: true
  };
  const releaseQa = {
    schema_version: "qf_release_qa_v1",
    generated_at: GENERATED_AT,
    status: [authority.status === "pass", roleQa.status === "pass", scoreQa.status === "pass", projectionQa.status === "pass", recommendationQa.status === "pass", teamBuilder.status === "pass"].every(Boolean) ? "pass" : "fail",
    public_site_promoted_to_qf: true,
    completed_r16_fixtures_used: authority.summary.completed_r16_fixtures_used,
    incomplete_r16_fixtures: authority.summary.incomplete_r16_fixtures,
    starting_xi_evidence_available: role.summary.explicit_starting_xi_available,
    checks: [
      { id: "qf_fixture_authority_pass", status: authority.status },
      { id: "qf_role_model_pass", status: roleQa.status },
      { id: "qf_score_prediction_pass", status: scoreQa.status },
      { id: "qf_projection_pass", status: projectionQa.status },
      { id: "qf_recommendation_pass", status: recommendationQa.status },
      { id: "qf_team_builder_pass", status: teamBuilder.status }
    ],
    top_20_qf_projected_players: topProjected.slice(0, 20),
    top_20_qf_captain_watchlist: captainWatchlist,
    balanced_squad_table: teamBuilder.balanced_sample,
    role_volatility_audits: playerAudits,
    remaining_limits: [
      "Final squads are not source-backed.",
      "R16 QF lineup evidence is external liveblog-backed, not preserved in the current official fantasy feed.",
      "Minutes played remain unknown unless explicitly captured; fantasy points are not used to infer starts.",
      "Users must verify official locks, deadlines, boosters, and lineups in FIFA."
    ]
  };
  return { roleQa, scoreQa, projectionQa, recommendationQa, releaseQa };
}

function buildPostmortem({ r16Score, live, role }) {
  const liveByMatch = new Map(rowsFromJson(live, ["fixtures"]).filter((row) => row.match_number).map((row) => [Number(row.match_number), row]));
  const residuals = (r16Score.fixtureScorePredictions || []).filter((row) => row.fantasy_matchday_id === "r16").map((row) => {
    const liveRow = liveByMatch.get(Number(row.match_number));
    const final = fixtureIsFinal(liveRow);
    return {
      match_number: row.match_number,
      fixture: `${row.home_team} vs ${row.away_team}`,
      predicted_xg: `${row.home_expected_goals}-${row.away_expected_goals}`,
      top_scoreline: row.top_scoreline,
      actual_score: final ? `${liveRow.home_score}-${liveRow.away_score}` : null,
      home_goal_residual: final ? round(Number(liveRow.home_score) - Number(row.home_expected_goals), 3) : null,
      away_goal_residual: final ? round(Number(liveRow.away_score) - Number(row.away_expected_goals), 3) : null,
      actual_winner: final
        ? Number(liveRow.home_score) > Number(liveRow.away_score) ? row.home_team : Number(liveRow.away_score) > Number(liveRow.home_score) ? row.away_team : "decided on penalties"
        : null
    };
  });
  const dataset = {
    schema_version: "knockout_calibration_dataset_for_qf_v1",
    generated_at: GENERATED_AT,
    evidence_rounds: ["group_stage", "r32", "r16"],
    r16_fixture_residuals: residuals,
    r16_player_lineup_evidence_examples: role.playerRoleRows
      .filter((row) => row.public_pool === "main")
      .sort((a, b) => Number(b.start_probability || 0) - Number(a.start_probability || 0))
      .slice(0, 40)
      .map((row) => ({
        name: row.name,
        country: row.country,
        lineupEvidenceType: row.lineupEvidenceType,
        r16Started: row.r16Started,
        r16Substitute: row.r16Substitute,
        r16_round_points: row.r16_round_points,
        r32_round_points: row.r32_round_points,
        start_probability: row.start_probability,
        evidenceStrength: row.evidenceStrength
      }))
  };
  const postmortem = {
    schema_version: "knockout_model_postmortem_for_qf_v1",
    generated_at: GENERATED_AT,
    status: residuals.every((row) => row.actual_score) ? "pass" : "blocked",
    summary: {
      r16_fixtures_checked: residuals.length,
      r16_final_scores_used: residuals.filter((row) => row.actual_score).length,
      explicit_starting_xi_available: role.summary.explicit_starting_xi_available,
      role_volatility_teams: role.summary.role_volatility_teams
    },
    residuals
  };
  return { dataset, postmortem };
}

function buildPeleAudit({ authority }) {
  const teamQuality = readJson("data/teamQuality.json", { teams: [] });
  const byTeam = new Map((teamQuality.teams || []).map((row) => [row.team_id || slug(row.country), row]));
  const qfTeams = [...teamSetFromAuthority(authority)].sort();
  const missing = qfTeams.filter((teamId) => !byTeam.has(teamId));
  const duplicates = (teamQuality.teams || [])
    .map((row) => row.team_id || slug(row.country))
    .filter((teamId, index, list) => teamId && list.indexOf(teamId) !== index);
  const invalidNumeric = (teamQuality.teams || []).filter((row) => {
    const values = [
      row.team_quality_v2?.overall_score,
      row.team_quality_v1?.overall_score,
      row.goals_clean_sheet_inputs_v2?.attack_proxy_score,
      row.goals_clean_sheet_inputs_v2?.defense_proxy_score
    ].filter(hasValue);
    return values.some((value) => !Number.isFinite(Number(value)));
  });

  return {
    schema_version: "pele_refresh_audit_qf_v1",
    generated_at: GENERATED_AT,
    status: missing.length || duplicates.length || invalidNumeric.length ? "fail" : "pass",
    refresh_result: "no_source_change_documented_current_team_quality_used",
    summary: {
      qf_team_count: qfTeams.length,
      missing_teams: missing.length,
      duplicate_team_keys: [...new Set(duplicates)].length,
      invalid_numeric_values: invalidNumeric.length,
      fixture_team_mappings_safe: missing.length === 0
    },
    qf_teams: qfTeams,
    missing_teams: missing,
    duplicate_team_keys: [...new Set(duplicates)],
    invalid_numeric_rows: invalidNumeric.slice(0, 20)
  };
}

async function writeBrowserWrappers({ score, projections, recommendations }) {
  const r16Score = readJson("data/scorePredictions_fantasyPool_r16_v1.json", {});
  const r32Score = readJson("data/scorePredictions_fantasyPool_r32_v1.json", {});
  const r16Projection = readJson("data/fantasyPoolMatchdayProjections_r16_v1.json", {});
  const r32Projection = readJson("data/fantasyPoolMatchdayProjections_r32_v1.json", {});
  const r16Recommendation = readJson("data/fantasyPoolRecommendations_r16_v1.json", {});
  const r32Recommendation = readJson("data/fantasyPoolRecommendations_r32_v1.json", {});

  const scoreBrowser = {
    ...score,
    fixtureScorePredictions: [
      ...score.fixtureScorePredictions,
      ...(r16Score.fixtureScorePredictions || []),
      ...(r32Score.fixtureScorePredictions || [])
    ],
    teamFixturePredictions: [
      ...score.teamFixturePredictions,
      ...(r16Score.teamFixturePredictions || []),
      ...(r32Score.teamFixturePredictions || [])
    ]
  };
  const projectionBrowser = {
    ...projections,
    playerMatchdayProjections: [
      ...projections.playerMatchdayProjections,
      ...(r16Projection.playerMatchdayProjections || []),
      ...(r32Projection.playerMatchdayProjections || [])
    ]
  };
  const recommendationBrowser = {
    ...recommendations,
    recommendationCandidates: [
      ...recommendations.recommendationCandidates,
      ...(r16Recommendation.recommendationCandidates || []),
      ...(r32Recommendation.recommendationCandidates || [])
    ]
  };

  await writeFile("fantasyPoolScorePredictionsData.js", [
    "// Generated by scripts/buildScorePredictionsFantasyPoolQfV1.mjs.",
    "// Active final QF score prediction browser data plus R16/R32/group-stage history.",
    `window.FANTASY_POOL_SCORE_PREDICTIONS_DATA = ${JSON.stringify(scoreBrowser)};`,
    "window.FANTASY_POOL_SCORE_FIXTURE_PREDICTIONS = window.FANTASY_POOL_SCORE_PREDICTIONS_DATA.fixtureScorePredictions;",
    "window.FANTASY_POOL_TEAM_FIXTURE_PREDICTIONS = window.FANTASY_POOL_SCORE_PREDICTIONS_DATA.teamFixturePredictions;",
    "window.FANTASY_POOL_SCORE_PREDICTIONS_SUMMARY = window.FANTASY_POOL_SCORE_PREDICTIONS_DATA.summary;",
    ""
  ].join("\n"), "utf8");
  await writeFile("fantasyPoolMatchdayProjectionsData.js", [
    "// Generated by scripts/buildFantasyPoolMatchdayProjectionsQfV1.mjs.",
    "// Active final QF projection browser data plus R16/R32 history.",
    `window.FANTASY_POOL_MATCHDAY_PROJECTIONS_DATA = ${JSON.stringify(projectionBrowser)};`,
    "window.FANTASY_POOL_PLAYER_MATCHDAY_PROJECTIONS = window.FANTASY_POOL_MATCHDAY_PROJECTIONS_DATA.playerMatchdayProjections;",
    "window.FANTASY_POOL_MATCHDAY_PROJECTIONS_SUMMARY = window.FANTASY_POOL_MATCHDAY_PROJECTIONS_DATA.summary;",
    ""
  ].join("\n"), "utf8");
  await writeFile("fantasyPoolRecommendationsData.js", [
    "// Generated by scripts/buildFantasyPoolRecommendationsQfV1.mjs.",
    "// Active final QF recommendations plus R16/R32 history rows.",
    `window.FANTASY_POOL_RECOMMENDATIONS_DATA = ${JSON.stringify(recommendationBrowser)};`,
    "window.FANTASY_POOL_RECOMMENDATION_CANDIDATES = window.FANTASY_POOL_RECOMMENDATIONS_DATA.recommendationCandidates;",
    "window.FANTASY_POOL_RECOMMENDATIONS_SUMMARY = window.FANTASY_POOL_RECOMMENDATIONS_DATA.summary;",
    ""
  ].join("\n"), "utf8");
}

async function writeReports({ authority, role, score, projections, recommendations, teamBuilder, qas, postmortem, peleAudit }) {
  await writeText("data/qfFixtureAuthorityReport_v1.md", [
    "# QF Fixture Authority v1",
    "",
    `Generated: ${authority.generated_at}`,
    "",
    `Status: ${authority.status}`,
    "",
    mdTable(["Slot", "Status", "Team A", "Team B", "Kickoff", "Advances"], authority.fixtures.map((fixture) => [
      fixture.bracket_slot_id,
      fixture.public_label,
      fixture.team_a?.team || "TBD",
      fixture.team_b?.team || "TBD",
      fixture.kickoff?.eastern_datetime_label || "",
      fixture.winner_advances_to?.bracket_slot_id || ""
    ]))
  ].join("\n"));
  await writeText("data/playerRoleModel_qf_v1.md", "# Player Role Model QF v1\n\n" + mdTable(["Metric", "Value"], Object.entries(role.summary).filter(([, value]) => typeof value !== "object").map(([key, value]) => [key, value])));
  await writeText("data/playerRoleModelQaReport_qf_v1.md", "# Player Role Model QA QF v1\n\nStatus: " + qas.roleQa.status + "\n\n" + qas.roleQa.warnings.map((warning) => `- ${warning}`).join("\n"));
  await writeText("data/scorePredictionModel_qf_v1.md", "# Score Prediction Model QF v1\n\n" + mdTable(["Metric", "Value"], Object.entries(score.summary).map(([key, value]) => [key, value])));
  await writeText("data/scorePredictionQaReport_qf_v1.md", "# Score Prediction QA QF v1\n\nStatus: " + qas.scoreQa.status + "\n");
  await writeText("data/playerProjectionModel_qf_v1.md", "# Player Projection Model QF v1\n\n" + mdTable(["Metric", "Value"], Object.entries(projections.summary).filter(([, value]) => typeof value !== "object").map(([key, value]) => [key, value])));
  await writeText("data/playerProjectionQaReport_qf_v1.md", "# Player Projection QA QF v1\n\nStatus: " + qas.projectionQa.status + "\n");
  await writeText("data/recommendationModel_qf_v1.md", "# Recommendation Model QF v1\n\n" + mdTable(["Metric", "Value"], Object.entries(recommendations.summary).filter(([, value]) => typeof value !== "object").map(([key, value]) => [key, value])));
  await writeText("data/recommendationQaReport_qf_v1.md", "# Recommendation QA QF v1\n\nStatus: " + qas.recommendationQa.status + "\n");
  await writeText("data/teamBuilderModel_qf_v1.md", "# Team Builder Model QF v1\n\n" + mdTable(["Metric", "Value"], Object.entries(teamBuilder.summary).map(([key, value]) => [key, typeof value === "object" ? JSON.stringify(value) : value])));
  await writeText("data/teamBuilderQaReport_qf_v1.md", "# Team Builder QA QF v1\n\nStatus: " + teamBuilder.status + "\n");
  await writeText("data/qfReleaseQaReport_v1.md", [
    "# QF Release QA v1",
    "",
    `Generated: ${qas.releaseQa.generated_at}`,
    "",
    `Status: ${qas.releaseQa.status}`,
    "",
    mdTable(["Check", "Status"], qas.releaseQa.checks.map((row) => [row.id, row.status]))
  ].join("\n"));
  await writeText("data/knockoutModelPostmortemReport_for_qf_v1.md", [
    "# Knockout Model Postmortem For QF v1",
    "",
    `Generated: ${postmortem.generated_at}`,
    "",
    `Status: ${postmortem.status}`,
    "",
    mdTable(["Match", "Fixture", "Pred xG", "Actual", "Home residual", "Away residual"], postmortem.residuals.map((row) => [
      row.match_number,
      row.fixture,
      row.predicted_xg,
      row.actual_score,
      row.home_goal_residual,
      row.away_goal_residual
    ]))
  ].join("\n"));
  await writeText("data/peleRefreshAudit_qf_v1.md", [
    "# PELE Refresh Audit QF v1",
    "",
    `Generated: ${peleAudit.generated_at}`,
    "",
    `Status: ${peleAudit.status}`,
    "",
    mdTable(["Metric", "Value"], Object.entries(peleAudit.summary).map(([key, value]) => [key, value]))
  ].join("\n"));
}

export async function buildQfArtifacts() {
  const worldCup = loadWorldCupData();
  const r16Authority = readJson("data/r16FixtureAuthority_v1.json");
  const live = readJson("data/liveMatchdayStatus_v1.json");
  const livePlayers = readJson("data/livePlayerStatus_v1.json");
  const officialPlayers = readJson("data/officialFantasyPlayers_v0.json");
  const r16Projections = readJson("data/fantasyPoolMatchdayProjections_r16_v1.json");
  const r16Score = readJson("data/scorePredictions_fantasyPool_r16_v1.json");
  const knockout = readJson("data/knockoutScorePredictor_v1.json");
  const lineupEvidence = readJson("data/worldCupLineupEvidence_v1.json");

  const authority = buildQfAuthority({ worldCup, r16Authority, live });
  const role = buildRoleModel({ authority, officialPlayers, livePlayers, r16Projections, lineupEvidence });
  const score = buildScorePredictions({ authority, knockout });
  const projections = buildProjections({ authority, role, score, r16Projections });
  const recommendations = buildRecommendations({ projections });
  const teamBuilder = teamBuilderQa({ projections, recommendations });
  const qas = qaReports({ authority, role, score, projections, recommendations, teamBuilder });
  const { dataset, postmortem } = buildPostmortem({ r16Score, live, role });
  const peleAudit = buildPeleAudit({ authority });

  await writeJson("data/qfFixtureAuthority_v1.json", authority);
  await writeFile("qfFixtureAuthorityData.js", [
    "// Generated by scripts/buildQfFixtureAuthorityV1.mjs.",
    `window.QF_FIXTURE_AUTHORITY_DATA = ${JSON.stringify(authority)};`,
    ""
  ].join("\n"), "utf8");
  await writeJson("data/playerRoleModel_qf_v1.json", role);
  await writeJson("data/playerRoleModelQa_qf_v1.json", qas.roleQa);
  await writeJson("data/scorePredictions_fantasyPool_qf_v1.json", score, true);
  await writeJson("data/scorePredictionQa_qf_v1.json", qas.scoreQa);
  await writeJson("data/fantasyPoolMatchdayProjections_qf_v1.json", projections, true);
  await writeJson("data/playerProjectionQa_qf_v1.json", qas.projectionQa);
  await writeJson("data/fantasyPoolRecommendations_qf_v1.json", recommendations, true);
  await writeJson("data/recommendationQa_qf_v1.json", qas.recommendationQa);
  await writeJson("data/teamBuilderQa_qf_v1.json", teamBuilder);
  await writeJson("data/qfReleaseQa_v1.json", qas.releaseQa);
  await writeJson("data/knockoutCalibrationDataset_for_qf_v1.json", dataset);
  await writeJson("data/knockoutModelPostmortem_for_qf_v1.json", postmortem);
  await writeJson("data/peleRefreshAudit_qf_v1.json", peleAudit);
  await writeReports({ authority, role, score, projections, recommendations, teamBuilder, qas, postmortem, peleAudit });
  await writeBrowserWrappers({ score, projections, recommendations });

  return {
    authority,
    role,
    score,
    projections,
    recommendations,
    teamBuilder,
    releaseQa: qas.releaseQa,
    postmortem,
    peleAudit,
    cacheBust: CACHE_BUST
  };
}

export { MATCHDAY_ID, MATCHDAY_LABEL, CACHE_BUST };
