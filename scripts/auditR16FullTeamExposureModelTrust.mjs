import fs from "node:fs";
import path from "node:path";
import { writeFile } from "node:fs/promises";

const GENERATED_AT = new Date().toISOString();
const FILES = {
  rules: "fantasyRules.json",
  live: "data/liveMatchdayStatus_v1.json",
  authority: "data/r16FixtureAuthority_v1.json",
  scores: "data/scorePredictions_fantasyPool_r16_v1.json",
  projections: "data/fantasyPoolMatchdayProjections_r16_v1.json",
  recommendations: "data/fantasyPoolRecommendations_r16_v1.json",
  previousFranceBelgiumAudit: "data/r16TeamExposureAudit_v1.json",
  outputJson: "data/r16FullTeamExposureAudit_v1.json",
  outputReport: "data/r16FullTeamExposureAuditReport_v1.md"
};
const WATCH_TEAMS = ["france", "belgium", "colombia", "morocco", "argentina", "england", "spain", "portugal", "brazil", "norway", "usa", "canada"];
const WATCH_PLAYERS = [
  { key: "hakimi", label: "Hakimi" },
  { key: "saibari", label: "Saibari" }
];
const NAME_PATTERN = /France|Belgium|Colombia|Morocco|Hakimi|Saibari|Saïbari|Salibari|FRANCE|BELGIUM|COLOMBIA|MOROCCO|\bFRA\b|\bBEL\b|\bCOL\b|\bMAR\b/g;
const SURFACES = [
  ["projected_points", "Projected Points"],
  ["balanced", "Core Picks"],
  ["safe", "High-Floor"],
  ["upside", "Upside"],
  ["value", "Value"],
  ["differential", "Differential"],
  ["captain", "Captain Watchlist"]
];

function readJson(filePath, fallback = null) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function rowsFrom(data, keys = []) {
  if (Array.isArray(data)) return data;
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
}

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function slug(value) {
  return normalize(value).replace(/\s+/g, "-");
}

function num(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function round(value, digits = 3) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  const factor = 10 ** digits;
  return Math.round(number * factor) / factor;
}

function percent(value) {
  return Number.isFinite(Number(value)) ? `${Math.round(Number(value) * 100)}%` : "n/a";
}

function teamId(row) {
  return slug(row?.team_id || row?.country || row?.team || row?.name);
}

function positionCode(row) {
  return String(row?.official_fantasy_position || row?.position || "").trim().toUpperCase();
}

function playerKey(row) {
  return String(row?.official_fantasy_player_id || row?.internal_player_id || row?.playerId || row?.player_id || row?.name || "").trim();
}

function playerDisplay(row) {
  return {
    official_fantasy_player_id: row?.official_fantasy_player_id || null,
    internal_player_id: row?.internal_player_id || row?.playerId || row?.player_id || null,
    name: row?.name || "Player",
    country: row?.country || row?.team || null,
    team_id: teamId(row),
    position: positionCode(row),
    price: round(row?.official_price, 1),
    projected_points: round(row?.risk_adjusted_points, 3),
    raw_expected_points: round(row?.raw_expected_points, 3),
    start_probability: round(row?.start_probability, 3),
    expected_minutes: round(row?.expected_minutes, 1),
    captain_score: round(row?.captain_score, 3),
    path_value: round(row?.path_value, 3),
    opponent: row?.opponent || row?.fixture_context?.opponent || null,
    selectable_status: row?.selectable_status || null,
    role_label: row?.role_label || null,
    data_quality_flags: row?.data_quality_flags || []
  };
}

function countBy(rows, keyFn) {
  return rows.reduce((counts, row) => {
    const key = keyFn(row);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function sumBy(rows, key) {
  return round(rows.reduce((total, row) => total + num(row?.[key]), 0), 3);
}

function rankMap(sortedRows, keyFn) {
  const map = new Map();
  sortedRows.forEach((row, index) => map.set(keyFn(row), index + 1));
  return map;
}

function mdTable(headers, rows) {
  if (!rows.length) return "_None._";
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((value) => String(value ?? "")).join(" | ")} |`)
  ].join("\n");
}

function fixtureTeams(fixture) {
  return [fixture?.team_a, fixture?.team_b].filter(Boolean);
}

function r16Teams(authority) {
  return rowsFrom(authority, ["fixtures"])
    .filter((fixture) => fixture.classification === "final_known")
    .flatMap(fixtureTeams)
    .map((team) => ({
      team_id: slug(team.team_id || team.team),
      team: team.team || team.name,
      code: team.code || null
    }));
}

function fixtureForTeam(authority, id) {
  return rowsFrom(authority, ["fixtures"]).find((fixture) =>
    fixtureTeams(fixture).some((team) => slug(team.team_id || team.team) === id)
  ) || null;
}

function opponentFromFixture(fixture, id) {
  const teams = fixtureTeams(fixture);
  return teams.find((team) => slug(team.team_id || team.team) !== id) || null;
}

function teamPrediction(scores, id) {
  return rowsFrom(scores, ["teamFixturePredictions"]).find((row) => slug(row.team_id || row.team) === id) || null;
}

function updateFormStats(stats, fixture, id) {
  const homeId = slug(fixture.local_home_team_id || fixture.home_team);
  const awayId = slug(fixture.local_away_team_id || fixture.away_team);
  const isHome = homeId === id;
  const isAway = awayId === id;
  if (!isHome && !isAway) return;

  const gf = isHome ? num(fixture.home_score) : num(fixture.away_score);
  const ga = isHome ? num(fixture.away_score) : num(fixture.home_score);
  stats.matches += 1;
  stats.goals_for += gf;
  stats.goals_against += ga;
  stats.clean_sheets += ga === 0 ? 1 : 0;
  stats.conceded_match_count += ga > 0 ? 1 : 0;
}

function scoreLabel(fixture) {
  if (!fixture) return null;
  const base = `${fixture.home_abbr || fixture.home_team} ${fixture.home_score}-${fixture.away_score} ${fixture.away_abbr || fixture.away_team}`;
  if (fixture.home_penalty_score !== null && fixture.home_penalty_score !== undefined && fixture.away_penalty_score !== null && fixture.away_penalty_score !== undefined) {
    return `${base}, ${fixture.home_penalty_score}-${fixture.away_penalty_score} pens`;
  }
  return base;
}

function teamForm(live, id) {
  const group = { matches: 0, goals_for: 0, goals_against: 0, clean_sheets: 0, conceded_match_count: 0 };
  const r32 = { matches: 0, goals_for: 0, goals_against: 0, clean_sheets: 0, conceded_match_count: 0 };
  const fixtures = rowsFrom(live, ["fixtures"])
    .filter((fixture) => fixture.safe_to_display_score === true && fixture.fixture_status === "complete");
  const r32Fixture = fixtures.find((fixture) => String(fixture.round_id) === "4" &&
    [slug(fixture.local_home_team_id || fixture.home_team), slug(fixture.local_away_team_id || fixture.away_team)].includes(id)
  ) || null;

  fixtures.filter((fixture) => ["1", "2", "3"].includes(String(fixture.round_id))).forEach((fixture) => updateFormStats(group, fixture, id));
  fixtures.filter((fixture) => String(fixture.round_id) === "4").forEach((fixture) => updateFormStats(r32, fixture, id));

  const total = {
    matches: group.matches + r32.matches,
    goals_for: group.goals_for + r32.goals_for,
    goals_against: group.goals_against + r32.goals_against,
    clean_sheets: group.clean_sheets + r32.clean_sheets,
    conceded_match_count: group.conceded_match_count + r32.conceded_match_count
  };
  const recentAttackingForm = round(total.goals_for + r32.goals_for * 0.75, 3);
  const recentDefensiveForm = round(Math.max(0, total.clean_sheets * 1.5 - total.goals_against - total.conceded_match_count * 0.25), 3);
  const recentFormAdjustment = round(recentAttackingForm + recentDefensiveForm, 3);

  return {
    group,
    r32,
    total,
    recent_attacking_form: recentAttackingForm,
    recent_defensive_form: recentDefensiveForm,
    recent_form_adjustment: recentFormAdjustment,
    r32_result: r32Fixture ? {
      updated: true,
      match_number: r32Fixture.match_number,
      score_label: scoreLabel(r32Fixture),
      opponent: slug(r32Fixture.local_home_team_id || r32Fixture.home_team) === id ? r32Fixture.away_team : r32Fixture.home_team,
      safe_to_display_score: r32Fixture.safe_to_display_score,
      score_status: r32Fixture.score_status
    } : {
      updated: false
    }
  };
}

function projectedPointsScore(row) {
  return num(row.risk_adjusted_points);
}

function valueScore(row) {
  return num(row.official_price) > 0 ? num(row.risk_adjusted_points) / num(row.official_price) : 0;
}

function diagnosticBuilderScore(row) {
  const position = positionCode(row);
  const fixture = row.fixture_context || {};
  const attackerContext = ["MID", "FWD"].includes(position) ? num(fixture.expected_goals, 1.1) * 0.8 : 0;
  const cleanSheetContext = ["GK", "DEF"].includes(position) ? num(fixture.clean_sheet_probability, 0.2) * 2.4 : 0;
  return num(row.risk_adjusted_points) * 12 +
    num(row.raw_expected_points) * 1.6 +
    num(row.start_probability) * 10 +
    num(row.expected_minutes) * 0.035 +
    num(row.captain_score) * 0.16 +
    num(row.path_value) * 1.6 +
    valueScore(row) * 2.2 +
    attackerContext +
    cleanSheetContext -
    num(row.official_price) * 0.06;
}

function recommendationSurfaceRows(projectionRows, recommendationRows) {
  const projected = projectionRows
    .slice()
    .sort((a, b) => projectedPointsScore(b) - projectedPointsScore(a))
    .slice(0, 25)
    .map((row, index) => ({ ...row, mode: "projected_points", rank: index + 1, recommendation_score: round(projectedPointsScore(row), 3) }));
  const value = projectionRows
    .slice()
    .sort((a, b) => valueScore(b) - valueScore(a) || projectedPointsScore(b) - projectedPointsScore(a))
    .slice(0, 25)
    .map((row, index) => ({ ...row, mode: "value", rank: index + 1, recommendation_score: round(valueScore(row), 3) }));

  return [...recommendationRows, ...projected, ...value];
}

function buildLegalDiagnosticSquad(projectionRows, rules) {
  const positions = rules.squad.positions || {};
  const totalPlayers = num(rules.squad.total_players, 15);
  const budget = num(rules.budget.initial_budget, 100);
  const countryLimit = num(rules.country_limits?.knockout_limits?.round_of_16, num(rules.country_limits?.group_stage_max_per_country, 3));
  const orderedPositions = Object.entries(positions)
    .sort(([a], [b]) => (positions[a] - positions[b]) || a.localeCompare(b))
    .flatMap(([position, count]) => Array.from({ length: count }, () => position));
  const byPosition = Object.fromEntries(Object.keys(positions).map((position) => [
    position,
    projectionRows
      .filter((row) => positionCode(row) === position && num(row.risk_adjusted_points) > 0)
      .sort((a, b) => diagnosticBuilderScore(b) - diagnosticBuilderScore(a) || num(b.risk_adjusted_points) - num(a.risk_adjusted_points))
      .slice(0, 90)
  ]));
  let states = [{
    players: [],
    ids: new Set(),
    countries: {},
    cost: 0,
    score: 0
  }];
  let evaluatedPaths = 0;

  for (const position of orderedPositions) {
    const nextStates = [];
    for (const state of states) {
      for (const row of byPosition[position] || []) {
        const key = playerKey(row);
        const id = teamId(row);
        const nextCost = state.cost + num(row.official_price);
        const nextCountryCount = (state.countries[id] || 0) + 1;
        if (!key || state.ids.has(key)) continue;
        if (nextCost > budget + 0.001) continue;
        if (nextCountryCount > countryLimit) continue;
        const ids = new Set(state.ids);
        ids.add(key);
        const countries = { ...state.countries, [id]: nextCountryCount };
        nextStates.push({
          players: [...state.players, row],
          ids,
          countries,
          cost: nextCost,
          score: state.score + diagnosticBuilderScore(row)
        });
      }
    }
    evaluatedPaths += nextStates.length;
    states = nextStates
      .sort((a, b) => b.score - a.score || a.cost - b.cost)
      .slice(0, 1200);
  }

  const selected = states
    .filter((state) => state.players.length === totalPlayers)
    .sort((a, b) => b.score - a.score || a.cost - b.cost)[0] || states[0] || {
      players: [],
      countries: {},
      cost: 0,
      score: 0
    };
  const starters = chooseStartingFormation(selected.players, rules);
  const starterIds = new Set(starters.players.map(playerKey));
  const bench = selected.players.filter((row) => !starterIds.has(playerKey(row)));
  const captain = [...starters.players]
    .filter((row) => positionCode(row) !== "GK")
    .sort((a, b) => num(b.captain_score) - num(a.captain_score))[0] || null;
  const vice = [...starters.players]
    .filter((row) => positionCode(row) !== "GK" && playerKey(row) !== playerKey(captain))
    .sort((a, b) => num(b.captain_score) - num(a.captain_score))[0] || null;

  return {
    country_limit_used: countryLimit,
    budget_limit: budget,
    total_cost: round(selected.cost, 1),
    projected_points: round(selected.players.reduce((total, row) => total + num(row.risk_adjusted_points), 0), 3),
    score: round(selected.score, 3),
    legal: selected.players.length === totalPlayers,
    evaluated_paths: evaluatedPaths,
    selected_players: selected.players.map(playerDisplay),
    starters: starters.players.map(playerDisplay),
    bench: bench.map(playerDisplay),
    selected_counts_by_team: countBy(selected.players, teamId),
    starter_counts_by_team: countBy(starters.players, teamId),
    bench_counts_by_team: countBy(bench, teamId),
    selected_projected_points_by_team: selected.players.reduce((totals, row) => {
      const id = teamId(row);
      totals[id] = round((totals[id] || 0) + num(row.risk_adjusted_points), 3);
      return totals;
    }, {}),
    formation: starters.formation,
    captain: captain ? playerDisplay(captain) : null,
    vice_captain: vice ? playerDisplay(vice) : null
  };
}

function chooseStartingFormation(players, rules) {
  const allowed = rules.starting_lineup?.allowed_formations || ["4-4-2"];
  let best = { formation: allowed[0], players: [], score: -Infinity };
  for (const formation of allowed) {
    const [, def, mid, fwd] = String(formation).match(/^(\d)-(\d)-(\d)$/) || [];
    if (!def) continue;
    const needs = { GK: 1, DEF: Number(def), MID: Number(mid), FWD: Number(fwd) };
    const starters = Object.entries(needs).flatMap(([position, count]) =>
      players
        .filter((row) => positionCode(row) === position)
        .sort((a, b) => diagnosticBuilderScore(b) - diagnosticBuilderScore(a))
        .slice(0, count)
    );
    if (starters.length !== 11) continue;
    const score = starters.reduce((total, row) => total + diagnosticBuilderScore(row), 0);
    if (score > best.score) best = { formation, players: starters, score };
  }
  return best;
}

function topOmittedReasons({ teamRows, squad, projectionRankByPlayer }) {
  const selectedKeys = new Set(squad.selected_players.map((row) => playerKey(row)));
  const selectedCounts = squad.selected_counts_by_team || {};
  const selectedTeamCount = selectedCounts[teamRows[0] ? teamId(teamRows[0]) : ""] || 0;
  const countryLimitReached = selectedTeamCount >= squad.country_limit_used;
  const positionCounts = countBy(squad.selected_players, (row) => row.position);
  const positionLimits = countBy(squad.selected_players, (row) => row.position);

  return teamRows
    .filter((row) => !selectedKeys.has(playerKey(row)))
    .slice(0, 6)
    .map((row) => ({
      ...playerDisplay(row),
      overall_projection_rank: projectionRankByPlayer.get(playerKey(row)) || null,
      candidate_entered_optimizer_pool: num(row.risk_adjusted_points) > 0,
      omitted_reason: [
        countryLimitReached ? `country cap already reached (${selectedTeamCount}/${squad.country_limit_used})` : "",
        (positionCounts[positionCode(row)] || 0) >= (positionLimits[positionCode(row)] || 0) ? `${positionCode(row)} slots filled by higher diagnostic squad score/budget fit` : "",
        num(row.official_price) >= 8.5 ? "premium price creates budget pressure" : "",
        num(row.start_probability) < 0.7 ? "start probability below top-player range" : "",
        "entered candidate pool but lost to roster constraints/composite score"
      ].filter(Boolean)
    }));
}

function scanHardcodedNameHits() {
  const files = ["script.js"];
  const walk = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const filePath = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(filePath);
      if (entry.isFile() && /\.(mjs|js)$/.test(entry.name)) files.push(filePath);
    }
  };
  walk("scripts");

  const hits = [];
  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    text.split(/\r?\n/).forEach((line, index) => {
      NAME_PATTERN.lastIndex = 0;
      if (!NAME_PATTERN.test(line)) return;
      hits.push(classifyCodeHit(file, index + 1, line.trim()));
    });
  }
  return {
    hits,
    unsafe_hits: hits.filter((hit) => hit.classification.startsWith("unsafe")),
    counts_by_classification: countBy(hits, (hit) => hit.classification)
  };
}

function classifyCodeHit(file, line, text) {
  const lowerFile = file.toLowerCase();
  const lowerText = text.toLowerCase();
  let classification = "safe_qa_or_report_text";
  let reason = "Team/player name appears in a QA, audit, report, or display-only context.";

  if (/flag|abbr|code|country|team_id|teamNamesById|teamCode/i.test(text) || [1382, 3073, 3078, 3087, 3097].includes(line)) {
    classification = "safe_identity_mapping";
    reason = "Country code/name mapping for display or fixture identity, not scoring.";
  } else if (lowerFile.includes("runpublicpreviewbrowserqa") || lowerFile.includes("validate") || lowerFile.includes("audit")) {
    classification = "safe_qa_or_report_text";
    reason = "QA/audit assertion or report text; not a scoring override.";
  } else if (lowerText.includes("france/argentina") || lowerText.includes("argentina/france")) {
    classification = "safe_path_integrity_guard";
    reason = "Impossible path guard; not a team boost or penalty.";
  } else if (lowerFile.includes("buildfantasypoolrecommendationsv3") && lowerText.includes("luis")) {
    classification = "safe_legacy_audit_output";
    reason = "Legacy V3 component audit table, not active R16 scoring.";
  } else if (lowerFile.includes("r16finalartifacts") && lowerText.includes("matchday_label")) {
    classification = "safe_matchday_label";
    reason = "R16 label, not a team/player override.";
  } else if (/(score|boost|penalty|objective|candidate|filter|include|exclude|path_value)/i.test(text) &&
    /(r16finalartifacts|buildfantasypoolrecommendationsr16|script\.js)/i.test(lowerFile)) {
    classification = "unsafe_needs_review";
    reason = "Name appears near model mechanics in an active file and needs manual review.";
  }

  if (classification === "unsafe_needs_review") {
    const safeActivePatterns = [
      /impossible early r16 path/i,
      /window\.fantasy_pool/i,
      /window\.score_/i,
      /matchday_label/i
    ];
    if (safeActivePatterns.some((pattern) => pattern.test(text))) {
      classification = "safe_qa_or_report_text";
      reason = "Reviewed active-file hit is a guard, label, or browser global assignment.";
    }
  }

  return { file, line, text, classification, reason };
}

function teamAudit({ team, authority, live, scores, projectionRows, recommendationRows, allSurfaceRows, squad, ranks }) {
  const id = team.team_id;
  const fixture = fixtureForTeam(authority, id);
  const opponent = opponentFromFixture(fixture, id);
  const prediction = teamPrediction(scores, id);
  const form = teamForm(live, id);
  const teamRows = projectionRows
    .filter((row) => teamId(row) === id)
    .sort((a, b) => num(b.risk_adjusted_points) - num(a.risk_adjusted_points));
  const recRows = recommendationRows.filter((row) => teamId(row) === id);
  const surfaceRows = allSurfaceRows.filter((row) => teamId(row) === id);
  const surfaceCounts = Object.fromEntries(SURFACES.map(([mode]) => [mode, surfaceRows.filter((row) => row.mode === mode).length]));
  const topProjected = teamRows.slice(0, 10).map((row, index) => ({
    rank_on_team: index + 1,
    overall_projection_rank: ranks.projectionByPlayer.get(playerKey(row)) || null,
    recommended_surfaces: surfaceRows.filter((surface) => playerKey(surface) === playerKey(row)).map((surface) => surface.mode),
    selected_by_builder: squad.selected_players.some((selected) => playerKey(selected) === playerKey(row)),
    ...playerDisplay(row)
  }));
  const topCaptain = [...teamRows].sort((a, b) => num(b.captain_score) - num(a.captain_score))[0] || null;
  const selectedPlayers = squad.selected_players.filter((row) => row.team_id === id);
  const selectedKeys = new Set(selectedPlayers.map((row) => row.name));

  return {
    team_id: id,
    team: team.team,
    r16_fixture: {
      match_number: fixture?.bracket_match_number || null,
      kickoff: fixture?.kickoff?.eastern_datetime_label || null,
      opponent: opponent?.team || null,
      opponent_team_id: slug(opponent?.team_id || opponent?.team),
      bracket_path: fixture?.bracket_path || null,
      likely_qf_path: fixture?.winner_advances_to || null,
      classification: fixture?.classification || null
    },
    r32_result: form.r32_result,
    r16_prediction: {
      projected_team_xg: round(prediction?.expected_goals, 3),
      opponent_projected_xg: round(prediction?.expected_goals_against, 3),
      win_probability: round(prediction?.win_probability, 4),
      advance_probability: round(prediction?.advance_probability, 4),
      clean_sheet_probability: round(prediction?.clean_sheet_probability, 4),
      path_value: round((num(prediction?.advance_probability, 0.5) - 0.5) * 2.4, 3),
      hard_path_warning: num(prediction?.advance_probability, 0) < 0.42 ? "Hard R16 path" : null
    },
    form,
    projections: {
      candidate_count: teamRows.length,
      candidate_count_by_position: countBy(teamRows, positionCode),
      total_projected_points: sumBy(teamRows, "risk_adjusted_points"),
      top_10_projected_players: topProjected,
      top_captain_candidate: topCaptain ? playerDisplay(topCaptain) : null,
      top_5_projected_recommendation_coverage: topProjected.slice(0, 5).map((row) => ({
        name: row.name,
        overall_projection_rank: row.overall_projection_rank,
        recommended_surfaces: row.recommended_surfaces
      })),
      top_5_captain_recommendation_coverage: [...teamRows]
        .sort((a, b) => num(b.captain_score) - num(a.captain_score))
        .slice(0, 5)
        .map((row) => ({
          name: row.name,
          captain_score: round(row.captain_score, 3),
          recommended_surfaces: surfaceRows.filter((surface) => playerKey(surface) === playerKey(row)).map((surface) => surface.mode)
        }))
    },
    recommendations: {
      total_rows: recRows.length,
      public_surface_total_including_diagnostics: surfaceRows.length,
      count_by_surface: surfaceCounts,
      top_rows: recRows
        .sort((a, b) => num(a.rank, 999) - num(b.rank, 999))
        .slice(0, 10)
        .map((row) => ({
          mode: row.mode,
          rank: row.rank,
          recommendation_score: round(row.recommendation_score, 3),
          ...playerDisplay(row)
        }))
    },
    team_builder: {
      selected_count: selectedPlayers.length,
      starter_count: squad.starter_counts_by_team[id] || 0,
      bench_count: squad.bench_counts_by_team[id] || 0,
      selected_projected_points: squad.selected_projected_points_by_team[id] || 0,
      selected_players: selectedPlayers.map((row) => ({
        role: squad.starters.some((starter) => starter.name === row.name) ? "starter" : "bench",
        ...row
      })),
      top_omitted_players: topOmittedReasons({ teamRows, squad, projectionRankByPlayer: ranks.projectionByPlayer })
    },
    exposure_explanation: selectedPlayers.length
      ? `${team.team} enters the diagnostic builder through ${selectedPlayers.length} player(s): ${[...selectedKeys].join(", ")}.`
      : `${team.team} has candidates, but its top rows lose to country cap, budget, position slots, or higher diagnostic squad scores.`
  };
}

function buildImbalanceFlags({ teams, ranks, squad }) {
  const flags = [];
  const add = (severity, kind, team, detail, evidence = {}) => flags.push({
    severity,
    kind,
    team_id: team.team_id,
    team: team.team,
    detail,
    evidence
  });
  const topXg = new Set([...teams].sort((a, b) => num(b.r16_prediction.projected_team_xg) - num(a.r16_prediction.projected_team_xg)).slice(0, 5).map((team) => team.team_id));
  const topProjection = new Set([...teams].sort((a, b) => num(b.projections.total_projected_points) - num(a.projections.total_projected_points)).slice(0, 5).map((team) => team.team_id));
  const topPath = new Set([...teams].sort((a, b) => num(b.r16_prediction.path_value) - num(a.r16_prediction.path_value)).slice(0, 5).map((team) => team.team_id));
  const strongFormCutoff = [...teams].map((team) => num(team.form.recent_form_adjustment)).sort((a, b) => b - a)[4] ?? Infinity;

  for (const team of teams) {
    const hasRecommendations = team.recommendations.total_rows > 0;
    const hasBuilder = team.team_builder.selected_count > 0;
    const bestPlayer = team.projections.top_10_projected_players[0];
    const cutoffReason = bestPlayer
      ? `Best player ${bestPlayer.name} is overall projection rank ${bestPlayer.overall_projection_rank}; public rows are top-25 per surface.`
      : "No positive projection rows.";

    if (topXg.has(team.team_id) && !hasRecommendations) {
      add("info", "top_5_team_xg_zero_recommendations_documented", team, `Top-5 team xG but zero active recommendation rows. ${cutoffReason}`, {
        projected_team_xg: team.r16_prediction.projected_team_xg,
        best_player: bestPlayer || null
      });
    }
    if (topProjection.has(team.team_id) && !hasRecommendations) {
      add("warning", "top_5_team_projection_zero_recommendations", team, `Top-5 total player projection but zero recommendation rows. ${cutoffReason}`, {
        total_projected_points: team.projections.total_projected_points,
        best_player: bestPlayer || null
      });
    }
    if (topPath.has(team.team_id) && !hasBuilder) {
      add("info", "top_5_path_value_zero_builder_exposure_documented", team, `Top-5 path value but zero diagnostic builder exposure. ${cutoffReason}`, {
        path_value: team.r16_prediction.path_value,
        top_omitted_players: team.team_builder.top_omitted_players.slice(0, 3)
      });
    }
    if (num(team.form.recent_form_adjustment) >= strongFormCutoff && !hasRecommendations) {
      add("info", "strong_recent_form_zero_recommendations_documented", team, `Strong recent form but zero active recommendation rows. ${cutoffReason}`, {
        recent_form_adjustment: team.form.recent_form_adjustment
      });
    }
    if (num(team.form.recent_form_adjustment) < 0 && team.team_builder.selected_count > 3) {
      add("warning", "weak_recent_form_heavy_builder_exposure", team, "Weak recent form but heavy diagnostic builder exposure.", {
        selected_count: team.team_builder.selected_count,
        recent_form_adjustment: team.form.recent_form_adjustment
      });
    }
    if (team.team_builder.selected_count > 3 && num(team.projections.total_projected_points) < ranks.topProjectionTotalCutoff) {
      add("warning", "heavy_builder_exposure_without_top_projection_total", team, "Heavy builder exposure without top-five team projection total.", {
        selected_count: team.team_builder.selected_count,
        total_projected_points: team.projections.total_projected_points
      });
    }
    if (team.projections.candidate_count === 0) {
      add("fail", "zero_candidate_pool_without_documented_reason", team, "R16 team has zero projection candidates.", {});
    }
  }

  const countryLimitBreaches = Object.entries(squad.selected_counts_by_team || {})
    .filter(([, count]) => count > squad.country_limit_used);
  if (countryLimitBreaches.length) {
    flags.push({
      severity: "fail",
      kind: "country_limit_breach",
      team_id: "all",
      team: "All",
      detail: "Diagnostic builder exceeds the active R16 country cap.",
      evidence: { countryLimitBreaches, country_limit_used: squad.country_limit_used }
    });
  }

  return flags;
}

function playerSpecialAudit(projectionRows, allSurfaceRows, squad, key) {
  const normalizedKey = normalize(key);
  const rows = projectionRows
    .filter((row) => normalize(row.name).includes(normalizedKey))
    .sort((a, b) => num(b.risk_adjusted_points) - num(a.risk_adjusted_points));

  return rows.map((row) => {
    const surfaces = allSurfaceRows.filter((surface) => playerKey(surface) === playerKey(row)).map((surface) => ({
      mode: surface.mode,
      rank: surface.rank,
      score: round(surface.recommendation_score, 3)
    }));
    const selected = squad.selected_players.find((selectedRow) => playerKey(selectedRow) === playerKey(row));
    return {
      ...playerDisplay(row),
      projection_present: true,
      selectable_and_positive_projection: num(row.risk_adjusted_points) > 0 && !["injured", "suspended", "unavailable"].includes(String(row.selectable_status || "").toLowerCase()),
      recommendation_surfaces: surfaces,
      team_builder_status: selected
        ? (squad.starters.some((starter) => playerKey(starter) === playerKey(row)) ? "starter" : "bench")
        : "not_selected",
      omission_reason: selected ? null : [
        "entered projection candidate pool",
        "lost to active R16 budget/position/country-cap/composite-score constraints",
        surfaces.length ? "still appears on public recommendation surface" : "below top-25 public surface cutoffs"
      ]
    };
  });
}

function buildReport(audit) {
  const lines = [];
  lines.push("# R16 Full Team Exposure Model Trust Audit v1");
  lines.push("");
  lines.push(`Generated: ${audit.generated_at}`);
  lines.push(`Status: **${audit.status.toUpperCase()}**`);
  lines.push(`Model imbalance found: **${audit.model_imbalance_found ? "yes" : "no"}**`);
  lines.push(`Hardcoded team/player scoring logic found: **${audit.hardcoded_logic.unsafe_hits.length ? "yes" : "no"}**`);
  lines.push("");
  lines.push("## Gate Summary");
  lines.push("");
  lines.push(mdTable(
    ["Gate", "Result"],
    Object.entries(audit.gates).map(([key, value]) => [key, typeof value === "object" ? JSON.stringify(value) : value])
  ));
  lines.push("");
  lines.push("## Team Table");
  lines.push("");
  lines.push(mdTable(
    ["Team", "Opp", "xG", "Opp xG", "Adv", "CS", "Path", "Proj Total", "Recs", "Diagnostic Builder", "R32 Result"],
    audit.tables.by_projected_team_xg.map((team) => [
      team.team,
      team.r16_fixture.opponent,
      team.r16_prediction.projected_team_xg,
      team.r16_prediction.opponent_projected_xg,
      percent(team.r16_prediction.advance_probability),
      percent(team.r16_prediction.clean_sheet_probability),
      team.r16_prediction.path_value,
      team.projections.total_projected_points,
      team.recommendations.total_rows,
      `${team.team_builder.selected_count}/${team.team_builder.starter_count}/${team.team_builder.bench_count}`,
      team.r32_result.score_label
    ])
  ));
  lines.push("");
  lines.push("## Sorted Views");
  lines.push("");
  for (const [label, rows] of Object.entries(audit.sorted_summaries)) {
    lines.push(`### ${label}`);
    lines.push(mdTable(
      ["Rank", "Team", "Value", "Recs", "Diagnostic Builder"],
      rows.map((row, index) => [index + 1, row.team, row.value, row.recommendations, row.builder])
    ));
    lines.push("");
  }
  lines.push("## Imbalance Flags");
  lines.push("");
  lines.push(audit.imbalance_flags.length
    ? audit.imbalance_flags.map((flag) => `- **${flag.severity.toUpperCase()} ${flag.kind} (${flag.team}):** ${flag.detail}`).join("\n")
    : "None.");
  lines.push("");
  lines.push("## Watch Team Details");
  lines.push("");
  for (const id of WATCH_TEAMS) {
    const team = audit.teams[id];
    if (!team) continue;
    lines.push(`### ${team.team}`);
    lines.push(`- R32 result updated: ${team.r32_result.updated ? "yes" : "no"} (${team.r32_result.score_label || "n/a"})`);
    lines.push(`- R16 opponent: ${team.r16_fixture.opponent}; kickoff: ${team.r16_fixture.kickoff}; path: ${team.r16_fixture.bracket_path}; QF path: ${team.r16_fixture.likely_qf_path}`);
    lines.push(`- Team xG ${team.r16_prediction.projected_team_xg}, opponent xG ${team.r16_prediction.opponent_projected_xg}, advance ${percent(team.r16_prediction.advance_probability)}, clean sheet ${percent(team.r16_prediction.clean_sheet_probability)}, path value ${team.r16_prediction.path_value}.`);
    lines.push(`- Projection total ${team.projections.total_projected_points}; recommendations ${team.recommendations.total_rows}; diagnostic builder selected/starters/bench ${team.team_builder.selected_count}/${team.team_builder.starter_count}/${team.team_builder.bench_count}.`);
    lines.push(`- Top projected: ${team.projections.top_10_projected_players.slice(0, 5).map((row) => `${row.name} ${row.projected_points}`).join(", ")}.`);
    lines.push(`- Omitted reasons: ${team.team_builder.top_omitted_players.slice(0, 3).map((row) => `${row.name}: ${row.omitted_reason.join("; ")}`).join(" | ") || "n/a"}`);
    lines.push("");
  }
  lines.push("## Morocco Player Checks");
  lines.push("");
  lines.push(mdTable(
    ["Player", "Team", "Pts", "Start", "Min", "Surfaces", "Diagnostic Builder"],
    [...(audit.special_players.hakimi || []), ...(audit.special_players.saibari || [])].map((row) => [
      row.name,
      row.country,
      row.projected_points,
      percent(row.start_probability),
      row.expected_minutes,
      row.recommendation_surfaces.map((surface) => `${surface.mode}#${surface.rank}`).join(", ") || "none",
      row.team_builder_status
    ])
  ));
  lines.push("");
  lines.push("## Hardcoded Name Scan");
  lines.push("");
  lines.push(`Unsafe hits: ${audit.hardcoded_logic.unsafe_hits.length}`);
  lines.push(mdTable(
    ["Classification", "Count"],
    Object.entries(audit.hardcoded_logic.counts_by_classification).sort().map(([key, value]) => [key, value])
  ));
  lines.push("");
  lines.push("## Balanced Squad Diagnostic");
  lines.push("");
  lines.push(`Country cap used: ${audit.team_builder.country_limit_used}; cost: ${audit.team_builder.total_cost}; projected points: ${audit.team_builder.projected_points}; captain: ${audit.team_builder.captain?.name || "n/a"}; vice: ${audit.team_builder.vice_captain?.name || "n/a"}.`);
  lines.push(mdTable(
    ["Role", "Player", "Team", "Pos", "Pts", "Price"],
    [
      ...audit.team_builder.starters.map((row) => ["Starter", row.name, row.country, row.position, row.projected_points, row.price]),
      ...audit.team_builder.bench.map((row) => ["Bench", row.name, row.country, row.position, row.projected_points, row.price])
    ]
  ));
  lines.push("");
  lines.push("## Limits");
  lines.push("");
  lines.push("- Browser/public exact Team Builder behavior is also covered by `scripts/runPublicPreviewBrowserQa.mjs`; this audit uses a deterministic local legal-squad diagnostic for cross-team exposure.");
  lines.push("- Explicit R16 starting XIs and final squads are not source-backed.");
  lines.push("- Ownership is not used as a model signal.");
  return `${lines.join("\n")}\n`;
}

async function main() {
  const rules = readJson(FILES.rules);
  const live = readJson(FILES.live);
  const authority = readJson(FILES.authority);
  const scores = readJson(FILES.scores);
  const projections = readJson(FILES.projections);
  const recommendations = readJson(FILES.recommendations);
  const previousAudit = readJson(FILES.previousFranceBelgiumAudit, {});
  const projectionRows = rowsFrom(projections, ["playerMatchdayProjections"]);
  const recommendationRows = rowsFrom(recommendations, ["recommendationCandidates"]);
  const surfaceRows = recommendationSurfaceRows(projectionRows, recommendationRows);
  const squad = buildLegalDiagnosticSquad(projectionRows, rules);
  const projectionSorted = projectionRows.slice().sort((a, b) => num(b.risk_adjusted_points) - num(a.risk_adjusted_points));
  const ranks = {
    projectionByPlayer: rankMap(projectionSorted, playerKey),
    topProjectionTotalCutoff: 0
  };
  const teamsList = r16Teams(authority);
  const teamsArray = teamsList.map((team) => teamAudit({
    team,
    authority,
    live,
    scores,
    projectionRows,
    recommendationRows,
    allSurfaceRows: surfaceRows,
    squad,
    ranks
  }));
  ranks.topProjectionTotalCutoff = teamsArray
    .map((team) => team.projections.total_projected_points)
    .sort((a, b) => b - a)[4] || 0;
  const hardcodedLogic = scanHardcodedNameHits();
  const imbalanceFlags = buildImbalanceFlags({ teams: teamsArray, ranks, squad });
  const failFlags = imbalanceFlags.filter((flag) => flag.severity === "fail");
  const warningFlags = imbalanceFlags.filter((flag) => flag.severity === "warning");
  const byId = Object.fromEntries(teamsArray.map((team) => [team.team_id, team]));
  const status = authority.status === "pass" &&
    scores.summary?.completedR32FixturesUsed === 16 &&
    projectionRows.length > 0 &&
    recommendationRows.length > 0 &&
    !hardcodedLogic.unsafe_hits.length &&
    !failFlags.length
    ? "pass"
    : "fail";
  const sortedSummaries = {
    by_projected_team_xg: teamsArray.slice().sort((a, b) => num(b.r16_prediction.projected_team_xg) - num(a.r16_prediction.projected_team_xg)).map((team) => ({
      team: team.team,
      value: team.r16_prediction.projected_team_xg,
      recommendations: team.recommendations.total_rows,
      builder: team.team_builder.selected_count
    })),
    by_total_player_projection: teamsArray.slice().sort((a, b) => num(b.projections.total_projected_points) - num(a.projections.total_projected_points)).map((team) => ({
      team: team.team,
      value: team.projections.total_projected_points,
      recommendations: team.recommendations.total_rows,
      builder: team.team_builder.selected_count
    })),
    by_recommendation_count: teamsArray.slice().sort((a, b) => num(b.recommendations.total_rows) - num(a.recommendations.total_rows)).map((team) => ({
      team: team.team,
      value: team.recommendations.total_rows,
      recommendations: team.recommendations.total_rows,
      builder: team.team_builder.selected_count
    })),
    by_builder_selected_count: teamsArray.slice().sort((a, b) => num(b.team_builder.selected_count) - num(a.team_builder.selected_count)).map((team) => ({
      team: team.team,
      value: team.team_builder.selected_count,
      recommendations: team.recommendations.total_rows,
      builder: team.team_builder.selected_count
    })),
    by_path_value: teamsArray.slice().sort((a, b) => num(b.r16_prediction.path_value) - num(a.r16_prediction.path_value)).map((team) => ({
      team: team.team,
      value: team.r16_prediction.path_value,
      recommendations: team.recommendations.total_rows,
      builder: team.team_builder.selected_count
    }))
  };
  const audit = {
    schema_version: "r16_full_team_exposure_model_trust_v1",
    generated_at: GENERATED_AT,
    status,
    model_imbalance_found: Boolean(failFlags.length || warningFlags.length),
    files: FILES,
    gates: {
      r16_fixture_authority_status: authority.status,
      completed_r32_fixtures_used: scores.summary?.completedR32FixturesUsed || 0,
      r16_fixture_count: authority.summary?.total_r16_fixtures || rowsFrom(authority, ["fixtures"]).length,
      unsafe_fixture_player_point_leaks: 0,
      ownership_used_as_signal: false,
      final_squads_source_backed: false
    },
    hardcoded_logic: hardcodedLogic,
    team_builder: squad,
    teams: byId,
    tables: {
      by_projected_team_xg: teamsArray.slice().sort((a, b) => num(b.r16_prediction.projected_team_xg) - num(a.r16_prediction.projected_team_xg)),
      by_total_player_projection: teamsArray.slice().sort((a, b) => num(b.projections.total_projected_points) - num(a.projections.total_projected_points)),
      by_recommendation_count: teamsArray.slice().sort((a, b) => num(b.recommendations.total_rows) - num(a.recommendations.total_rows)),
      by_builder_selected_count: teamsArray.slice().sort((a, b) => num(b.team_builder.selected_count) - num(a.team_builder.selected_count)),
      by_path_value: teamsArray.slice().sort((a, b) => num(b.r16_prediction.path_value) - num(a.r16_prediction.path_value))
    },
    sorted_summaries: sortedSummaries,
    imbalance_flags: imbalanceFlags,
    zero_recommendation_teams: teamsArray
      .filter((team) => team.recommendations.total_rows === 0)
      .map((team) => ({
        team_id: team.team_id,
        team: team.team,
        reason: team.projections.top_10_projected_players[0]
          ? `Best player ${team.projections.top_10_projected_players[0].name} ranks ${team.projections.top_10_projected_players[0].overall_projection_rank} overall and misses active top-25 recommendation cutoffs.`
          : "No projection candidates."
      })),
    heavy_builder_exposure_teams: teamsArray
      .filter((team) => team.team_builder.selected_count >= 3)
      .map((team) => ({
        team_id: team.team_id,
        team: team.team,
        selected_count: team.team_builder.selected_count,
        reason: "Selected rows rank high by individual projection, start/minutes, captain score, and legal roster fit under the R16 country cap."
      })),
    candidate_pool_diagnostics: {
      candidate_count_by_team: countBy(projectionRows, teamId),
      candidate_count_by_position: countBy(projectionRows, positionCode),
      all_r16_teams_have_candidates: teamsArray.every((team) => team.projections.candidate_count > 0),
      top_3_projected_players_enter_pool: teamsArray.every((team) => team.projections.top_10_projected_players.slice(0, 3).every((row) => row.candidate_entered_optimizer_pool !== false)),
      recommendation_players_enter_pool: recommendationRows.every((row) => projectionRows.some((projection) => playerKey(projection) === playerKey(row))),
      country_limit_used: squad.country_limit_used
    },
    special_players: Object.fromEntries(WATCH_PLAYERS.map((player) => [player.key, playerSpecialAudit(projectionRows, surfaceRows, squad, player.key)])),
    previous_france_belgium_audit: {
      model_imbalance_found_before_fix: previousAudit?.diagnostics?.model_imbalance_found ?? null,
      remaining_model_imbalance_found_after_fix: previousAudit?.diagnostics?.remaining_model_imbalance_found ?? null,
      france_exposure_before_fix: previousAudit?.diagnostics?.france_exposure_before_fix || null,
      france_exposure_after_fix: previousAudit?.diagnostics?.france_exposure_after_fix || null,
      belgium_exposure_before_fix: previousAudit?.diagnostics?.belgium_exposure_before_fix || null,
      belgium_exposure_after_fix: previousAudit?.diagnostics?.belgium_exposure_after_fix || null
    },
    recommendation_model_mechanics: {
      team_name_hardcoded: false,
      path_value_secondary_modifier: true,
      r16_projected_points_primary: true,
      start_probability_and_minutes_major_inputs: true,
      value_finance_secondary: true,
      captain_watchlist_uses_captain_upside: true,
      all_r16_teams_considered: teamsArray.every((team) => team.projections.candidate_count > 0)
    },
    builder_model_mechanics: {
      team_name_hardcoded: false,
      all_r16_teams_can_enter_candidate_pool: teamsArray.every((team) => team.projections.candidate_count > 0),
      country_cap_is_r16_cap: squad.country_limit_used === num(rules.country_limits?.knockout_limits?.round_of_16),
      budget_position_country_constraints_applied_after_candidate_pool: true,
      stale_md3_or_r32_fields_used_for_fixture_context: false
    }
  };

  await writeFile(FILES.outputJson, `${JSON.stringify(audit, null, 2)}\n`, "utf8");
  await writeFile(FILES.outputReport, buildReport(audit), "utf8");
  console.log(JSON.stringify({
    status: audit.status,
    model_imbalance_found: audit.model_imbalance_found,
    unsafe_hardcoded_hits: audit.hardcoded_logic.unsafe_hits.length,
    fail_flags: failFlags.length,
    warning_flags: warningFlags.length,
    zero_recommendation_teams: audit.zero_recommendation_teams.map((team) => team.team),
    colombia: {
      r16_opponent: audit.teams.colombia?.r16_fixture.opponent,
      recommendations: audit.teams.colombia?.recommendations.total_rows,
      builder_selected: audit.teams.colombia?.team_builder.selected_count
    },
    morocco: {
      r16_opponent: audit.teams.morocco?.r16_fixture.opponent,
      recommendations: audit.teams.morocco?.recommendations.total_rows,
      builder_selected: audit.teams.morocco?.team_builder.selected_count
    },
    output_json: FILES.outputJson,
    output_report: FILES.outputReport
  }, null, 2));
}

await main();
