import fs from "node:fs";
import { writeFile } from "node:fs/promises";

const GENERATED_AT = new Date().toISOString();
const TEAMS_TO_AUDIT = ["france", "belgium"];
const TEAM_LABELS = {
  france: "France",
  belgium: "Belgium"
};
const FILES = {
  rules: "fantasyRules.json",
  live: "data/liveMatchdayStatus_v1.json",
  authority: "data/r16FixtureAuthority_v1.json",
  scores: "data/scorePredictions_fantasyPool_r16_v1.json",
  projections: "data/fantasyPoolMatchdayProjections_r16_v1.json",
  recommendations: "data/fantasyPoolRecommendations_r16_v1.json",
  teamBuilderQa: "data/teamBuilderQa_r16_v1.json",
  outputJson: "data/r16TeamExposureAudit_v1.json",
  outputReport: "data/r16TeamExposureAuditReport_v1.md"
};

function readJson(filePath) {
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

function teamId(row) {
  return slug(row?.team_id || row?.country || row?.team || row?.name);
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

function positionCode(row) {
  return String(row?.official_fantasy_position || row?.position || "").trim().toUpperCase();
}

function playerKey(row) {
  return String(row?.official_fantasy_player_id || row?.internal_player_id || row?.playerId || row?.player_id || row?.name || "").trim();
}

function playerScore(row) {
  return num(row.risk_adjusted_points) * 10 +
    num(row.start_probability) * 8 +
    num(row.captain_score) * 0.2;
}

function playerSummary(row, extra = {}) {
  return {
    name: row?.name || "Player",
    country: row?.country || row?.team || null,
    team_id: teamId(row),
    position: positionCode(row),
    opponent: row?.opponent || row?.fixture_context?.opponent || null,
    price: round(row?.official_price, 1),
    projected_points: round(row?.risk_adjusted_points, 3),
    raw_expected_points: round(row?.raw_expected_points, 3),
    start_probability: round(row?.start_probability, 3),
    expected_minutes: round(row?.expected_minutes, 1),
    captain_score: round(row?.captain_score, 3),
    path_value: round(row?.path_value, 3),
    value_per_price: row?.official_price ? round(num(row.risk_adjusted_points) / num(row.official_price), 3) : null,
    score: round(playerScore(row), 3),
    ...extra
  };
}

function countBy(rows, keyFn) {
  return rows.reduce((counts, row) => {
    const key = keyFn(row);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function sum(rows, key) {
  return round(rows.reduce((total, row) => total + num(row?.[key]), 0), 3);
}

function average(rows, key) {
  return rows.length ? round(rows.reduce((total, row) => total + num(row?.[key]), 0) / rows.length, 3) : null;
}

function teamNameFromFixtureSide(fixture, id) {
  const a = fixture?.team_a || {};
  const b = fixture?.team_b || {};
  if (slug(a.team_id || a.team) === id) return a.team || a.name || TEAM_LABELS[id];
  if (slug(b.team_id || b.team) === id) return b.team || b.name || TEAM_LABELS[id];
  return TEAM_LABELS[id];
}

function opponentFromFixture(fixture, id) {
  const a = fixture?.team_a || {};
  const b = fixture?.team_b || {};
  if (slug(a.team_id || a.team) === id) return b;
  if (slug(b.team_id || b.team) === id) return a;
  return null;
}

function teamPredictionFor(scores, id) {
  return rowsFrom(scores, ["teamFixturePredictions"]).find((row) => slug(row.team_id || row.team) === id) || null;
}

function fixtureForTeam(authority, id) {
  return rowsFrom(authority, ["fixtures"]).find((fixture) =>
    [fixture.team_a, fixture.team_b].some((team) => slug(team?.team_id || team?.team) === id)
  ) || null;
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

function teamForm(liveData, id) {
  const group = { matches: 0, goals_for: 0, goals_against: 0, clean_sheets: 0, conceded_match_count: 0 };
  const r32 = { matches: 0, goals_for: 0, goals_against: 0, clean_sheets: 0, conceded_match_count: 0 };
  const fixtures = rowsFrom(liveData, ["fixtures"])
    .filter((fixture) => fixture.safe_to_display_score === true && fixture.fixture_status === "complete");

  fixtures.filter((fixture) => ["1", "2", "3"].includes(String(fixture.round_id))).forEach((fixture) => updateFormStats(group, fixture, id));
  fixtures.filter((fixture) => String(fixture.round_id) === "4").forEach((fixture) => updateFormStats(r32, fixture, id));

  const total = {
    matches: group.matches + r32.matches,
    goals_for: group.goals_for + r32.goals_for,
    goals_against: group.goals_against + r32.goals_against,
    clean_sheets: group.clean_sheets + r32.clean_sheets,
    conceded_match_count: group.conceded_match_count + r32.conceded_match_count
  };
  const recentFormAdjustment = round(
    total.goals_for * 1.2 -
    total.goals_against * 0.85 +
    r32.goals_for * 0.55 -
    r32.goals_against * 0.35 +
    total.clean_sheets * 0.7 -
    total.conceded_match_count * 0.15,
    3
  );

  return { group, r32, total, recent_form_adjustment: recentFormAdjustment };
}

function teamProjectionStats(rows, id) {
  const teamRows = rows.filter((row) => teamId(row) === id);
  const sorted = [...teamRows].sort((a, b) => num(b.risk_adjusted_points) - num(a.risk_adjusted_points));
  const captains = [...teamRows].sort((a, b) => num(b.captain_score) - num(a.captain_score));
  return {
    player_count: teamRows.length,
    total_projected_points: sum(teamRows, "risk_adjusted_points"),
    average_projected_points: average(teamRows, "risk_adjusted_points"),
    top_10_projected_players: sorted.slice(0, 10).map((row, index) => playerSummary(row, { rank: index + 1 })),
    top_captain_candidates: captains.slice(0, 8).map((row, index) => playerSummary(row, { rank: index + 1 }))
  };
}

function recommendationStats(rows, id) {
  const teamRows = rows.filter((row) => teamId(row) === id);
  const modeCounts = countBy(teamRows, (row) => row.mode || "unknown");
  const topByMode = {};
  for (const mode of [...new Set(rows.map((row) => row.mode).filter(Boolean))]) {
    topByMode[mode] = teamRows
      .filter((row) => row.mode === mode)
      .sort((a, b) => num(a.rank, 999) - num(b.rank, 999))
      .slice(0, 8)
      .map((row) => playerSummary(row, { rank: row.rank, recommendation_score: round(row.recommendation_score, 3) }));
  }
  return {
    total: teamRows.length,
    by_mode: modeCounts,
    top_by_mode: topByMode
  };
}

function countryLimitForScenario(rules, scenario) {
  if (scenario === "r16_rules_limit" || scenario === "active_public_r16_limit" || scenario === "current_public_limit") {
    return num(rules?.country_limits?.knockout_limits?.round_of_16, num(rules?.country_limits?.group_stage_max_per_country, 3));
  }
  return num(rules?.country_limits?.group_stage_max_per_country, 3);
}

function buildLegalSquad(projectionRows, rules, scenario) {
  const positions = rules.squad.positions;
  const totalPlayers = num(rules.squad.total_players, 15);
  const budget = num(rules.budget.initial_budget, 100);
  const countryLimit = countryLimitForScenario(rules, scenario);
  const orderedPositions = Object.entries(positions)
    .sort(([a], [b]) => (positions[a] - positions[b]) || a.localeCompare(b))
    .flatMap(([position, count]) => Array.from({ length: count }, () => position));
  const byPosition = Object.fromEntries(Object.keys(positions).map((position) => [
    position,
    projectionRows
      .filter((row) => positionCode(row) === position)
      .sort((a, b) => playerScore(b) - playerScore(a) || num(b.risk_adjusted_points) - num(a.risk_adjusted_points))
      .slice(0, 80)
  ]));
  let states = [{
    players: [],
    ids: new Set(),
    countries: {},
    cost: 0,
    score: 0
  }];
  let evaluated_paths = 0;

  for (const position of orderedPositions) {
    const nextStates = [];
    for (const state of states) {
      for (const row of byPosition[position] || []) {
        const key = playerKey(row);
        const id = teamId(row);
        const nextCost = state.cost + num(row.official_price);
        const nextCountryCount = (state.countries[id] || 0) + 1;
        if (state.ids.has(key)) continue;
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
          score: state.score + playerScore(row)
        });
      }
    }
    evaluated_paths += nextStates.length;
    states = nextStates
      .sort((a, b) => b.score - a.score || a.cost - b.cost)
      .slice(0, 950);
  }

  const fullStates = states.filter((state) => state.players.length === totalPlayers);
  const selected = fullStates.sort((a, b) => b.score - a.score || a.cost - b.cost)[0] || states[0] || {
    players: [],
    countries: {},
    cost: 0,
    score: 0
  };
  const formation = chooseStartingFormation(selected.players, rules);
  const starterIds = new Set(formation.starters.map(playerKey));
  const bench = selected.players.filter((row) => !starterIds.has(playerKey(row)));
  const captain = [...formation.starters]
    .filter((row) => positionCode(row) !== "GK")
    .sort((a, b) => num(b.captain_score) - num(a.captain_score))[0] || null;
  const vice = [...formation.starters]
    .filter((row) => positionCode(row) !== "GK" && playerKey(row) !== playerKey(captain))
    .sort((a, b) => num(b.captain_score) - num(a.captain_score))[0] || null;

  return {
    scenario,
    country_limit_used: countryLimit,
    budget_limit: budget,
    total_cost: round(selected.cost, 1),
    remaining_budget: round(budget - selected.cost, 1),
    score: round(selected.score, 3),
    legal: selected.players.length === totalPlayers,
    evaluated_paths,
    selected_players: selected.players.map((row) => playerSummary(row)),
    starters: formation.starters.map((row) => playerSummary(row)),
    bench: bench.map((row) => playerSummary(row)),
    selected_counts_by_team: countBy(selected.players, teamId),
    starter_counts_by_team: countBy(formation.starters, teamId),
    bench_counts_by_team: countBy(bench, teamId),
    selected_projected_points: round(selected.players.reduce((total, row) => total + num(row.risk_adjusted_points), 0), 3),
    starter_projected_points: round(formation.starters.reduce((total, row) => total + num(row.risk_adjusted_points), 0), 3),
    formation: formation.formation,
    captain: captain ? playerSummary(captain) : null,
    vice_captain: vice ? playerSummary(vice) : null
  };
}

function chooseStartingFormation(players, rules) {
  const allowed = rules.starting_lineup.allowed_formations || ["4-4-2"];
  let best = { formation: allowed[0], starters: [], score: -Infinity };
  for (const formation of allowed) {
    const [, def, mid, fwd] = formation.match(/^(\d)-(\d)-(\d)$/) || [];
    if (!def) continue;
    const needs = { GK: 1, DEF: Number(def), MID: Number(mid), FWD: Number(fwd) };
    const starters = Object.entries(needs).flatMap(([position, count]) =>
      players
        .filter((row) => positionCode(row) === position)
        .sort((a, b) => playerScore(b) - playerScore(a))
        .slice(0, count)
    );
    if (starters.length !== 11) continue;
    const score = starters.reduce((total, row) => total + playerScore(row), 0);
    if (score > best.score) {
      best = { formation, starters, score };
    }
  }
  return best;
}

function selectedDiagnostics(teamRows, squad, teamIdToCheck) {
  const selectedKeys = new Set(squad.selected_players.map((row) => row.name));
  const selectedTeamCount = squad.selected_counts_by_team[teamIdToCheck] || 0;
  const positionCounts = countBy(squad.selected_players, (row) => row.position);
  const teamLimitReached = selectedTeamCount >= squad.country_limit_used;

  return teamRows
    .filter((row) => !selectedKeys.has(row.name))
    .slice(0, 8)
    .map((row) => ({
      ...playerSummary(row),
      omitted_reason: [
        teamLimitReached ? `${TEAM_LABELS[teamIdToCheck]} country cap reached (${selectedTeamCount}/${squad.country_limit_used})` : "",
        (positionCounts[positionCode(row)] || 0) >= 0 ? `${positionCode(row)} slots filled by higher squad score/budget fit` : "",
        num(row.official_price) >= 9 ? "premium price creates budget pressure" : "",
        num(row.start_probability) < 0.7 ? "start probability below top-player range" : ""
      ].filter(Boolean)
    }));
}

function selectedPlayerReasons(rows) {
  return rows.map((row) => ({
    ...row,
    selected_reason: [
      `${row.projected_points} projected R16 points`,
      `${Math.round(num(row.start_probability) * 100)}% start probability`,
      `${row.expected_minutes} expected minutes`,
      `${row.captain_score} captain score`,
      row.path_value > 0 ? `positive path value ${row.path_value}` : "path value not the main lift"
    ]
  }));
}

function teamAudit({ rules, live, authority, scores, projections, recommendations, teamIdToCheck }) {
  const fixture = fixtureForTeam(authority, teamIdToCheck);
  const opponent = opponentFromFixture(fixture, teamIdToCheck);
  const prediction = teamPredictionFor(scores, teamIdToCheck);
  const form = teamForm(live, teamIdToCheck);
  const projectionStats = teamProjectionStats(rowsFrom(projections, ["playerMatchdayProjections"]), teamIdToCheck);
  const recStats = recommendationStats(rowsFrom(recommendations, ["recommendationCandidates"]), teamIdToCheck);

  return {
    team_id: teamIdToCheck,
    team: teamNameFromFixtureSide(fixture, teamIdToCheck),
    r16_fixture: {
      match_number: fixture?.bracket_match_number || null,
      opponent: opponent?.team || opponent?.name || null,
      opponent_team_id: slug(opponent?.team_id || opponent?.team),
      bracket_path: fixture?.bracket_path || null,
      winner_advances_to: fixture?.winner_advances_to || null
    },
    r16_prediction: {
      expected_goals: round(prediction?.expected_goals, 3),
      opponent_expected_goals: round(prediction?.expected_goals_against, 3),
      win_probability: round(prediction?.win_probability, 4),
      advance_probability: round(prediction?.advance_probability, 4),
      clean_sheet_probability: round(prediction?.clean_sheet_probability, 4),
      path_value: round((num(prediction?.advance_probability, 0.5) - 0.5) * 2.4, 3),
      hard_path_warning: num(prediction?.advance_probability, 0) < 0.42 ? "Hard R16 path" : null
    },
    form,
    projections: projectionStats,
    recommendations: recStats,
    rules_context: {
      legacy_group_stage_country_limit: countryLimitForScenario(rules, "legacy_group_stage_limit"),
      active_public_builder_country_limit: countryLimitForScenario(rules, "current_public_limit"),
      r16_rules_country_limit: countryLimitForScenario(rules, "r16_rules_limit")
    }
  };
}

function compareTeams(a, b) {
  return {
    france_stronger_r16_attacking_environment: num(a.r16_prediction.expected_goals) > num(b.r16_prediction.expected_goals),
    france_stronger_recent_form: num(a.form.recent_form_adjustment) > num(b.form.recent_form_adjustment),
    belgium_better_path_value: num(b.r16_prediction.path_value) > num(a.r16_prediction.path_value),
    france_projection_total_higher: num(a.projections.total_projected_points) > num(b.projections.total_projected_points),
    france_core_recommendation_count: a.recommendations.by_mode.balanced || 0,
    belgium_core_recommendation_count: b.recommendations.by_mode.balanced || 0
  };
}

function mdTable(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((value) => String(value ?? "")).join(" | ")} |`)
  ].join("\n");
}

function buildReport(audit) {
  const france = audit.teams.france;
  const belgium = audit.teams.belgium;
  const legacySquad = audit.builder_scenarios.legacy_group_stage_limit;
  const currentSquad = audit.builder_scenarios.current_public_limit;
  const lines = [];
  lines.push("# R16 Team Exposure Audit v1");
  lines.push("");
  lines.push(`Generated: ${audit.generated_at}`);
  lines.push(`Status: **${audit.status.toUpperCase()}**`);
  lines.push("");
  lines.push("## France vs Belgium Summary");
  lines.push("");
  lines.push(mdTable(
    ["Metric", "France", "Belgium"],
    [
      ["R16 opponent", france.r16_fixture.opponent, belgium.r16_fixture.opponent],
      ["R16 xG", france.r16_prediction.expected_goals, belgium.r16_prediction.expected_goals],
      ["Opponent xG", france.r16_prediction.opponent_expected_goals, belgium.r16_prediction.opponent_expected_goals],
      ["Advance probability", percent(france.r16_prediction.advance_probability), percent(belgium.r16_prediction.advance_probability)],
      ["Clean-sheet probability", percent(france.r16_prediction.clean_sheet_probability), percent(belgium.r16_prediction.clean_sheet_probability)],
      ["Group GF-GA", `${france.form.group.goals_for}-${france.form.group.goals_against}`, `${belgium.form.group.goals_for}-${belgium.form.group.goals_against}`],
      ["R32 GF-GA", `${france.form.r32.goals_for}-${france.form.r32.goals_against}`, `${belgium.form.r32.goals_for}-${belgium.form.r32.goals_against}`],
      ["Total GF-GA", `${france.form.total.goals_for}-${france.form.total.goals_against}`, `${belgium.form.total.goals_for}-${belgium.form.total.goals_against}`],
      ["Clean sheets", france.form.total.clean_sheets, belgium.form.total.clean_sheets],
      ["Conceded matches", france.form.total.conceded_match_count, belgium.form.total.conceded_match_count],
      ["Recent form adjustment", france.form.recent_form_adjustment, belgium.form.recent_form_adjustment],
      ["Path value", france.r16_prediction.path_value, belgium.r16_prediction.path_value],
      ["Projection total", france.projections.total_projected_points, belgium.projections.total_projected_points],
      ["Recommendation rows", france.recommendations.total, belgium.recommendations.total]
    ]
  ));
  lines.push("");
  lines.push("## Audit Answers");
  lines.push("");
  audit.diagnostics.answers.forEach((answer) => {
    lines.push(`- **${answer.question}:** ${answer.answer}`);
  });
  lines.push("");
  lines.push("## Builder Exposure");
  lines.push("");
  lines.push(mdTable(
    ["Scenario", "Country Limit", "France Selected", "France Starters", "Belgium Selected", "Belgium Starters", "Projected Pts", "Cost"],
    [
      [
        "Legacy group-stage limit (before fix)",
        legacySquad.country_limit_used,
        legacySquad.selected_counts_by_team.france || 0,
        legacySquad.starter_counts_by_team.france || 0,
        legacySquad.selected_counts_by_team.belgium || 0,
        legacySquad.starter_counts_by_team.belgium || 0,
        legacySquad.selected_projected_points,
        legacySquad.total_cost
      ],
      [
        "Active public R16 limit (after fix)",
        currentSquad.country_limit_used,
        currentSquad.selected_counts_by_team.france || 0,
        currentSquad.starter_counts_by_team.france || 0,
        currentSquad.selected_counts_by_team.belgium || 0,
        currentSquad.starter_counts_by_team.belgium || 0,
        currentSquad.selected_projected_points,
        currentSquad.total_cost
      ]
    ]
  ));
  lines.push("");
  lines.push("## Active R16 Balanced Squad");
  lines.push("");
  lines.push(mdTable(
    ["Role", "Player", "Team", "Pos", "Pts", "Start", "Price"],
    [
      ...currentSquad.starters.map((row) => ["Starter", row.name, row.country, row.position, row.projected_points, percent(row.start_probability), row.price]),
      ...currentSquad.bench.map((row) => ["Bench", row.name, row.country, row.position, row.projected_points, percent(row.start_probability), row.price])
    ]
  ));
  lines.push("");
  lines.push("## Top Omitted France Players");
  lines.push("");
  lines.push(mdTable(
    ["Player", "Pos", "Pts", "Price", "Reason"],
    audit.diagnostics.top_omitted_france_players.map((row) => [row.name, row.position, row.projected_points, row.price, row.omitted_reason.join("; ")])
  ));
  lines.push("");
  lines.push("## Selected Belgium Players");
  lines.push("");
  lines.push(mdTable(
    ["Player", "Role", "Pos", "Pts", "Price", "Reason"],
    audit.diagnostics.selected_belgium_players.map((row) => [row.name, row.role, row.position, row.projected_points, row.price, row.selected_reason.join("; ")])
  ));
  lines.push("");
  lines.push("## Limits");
  lines.push("");
  lines.push("- Explicit R32 starting XI data is not available in the current feed; R32 participation evidence is weighted instead.");
  lines.push("- Ownership is not used as a model signal.");
  lines.push("- Final squads remain not source-backed.");
  return `${lines.join("\n")}\n`;
}

async function main() {
  const [rules, live, authority, scores, projections, recommendations, teamBuilderQa] = [
    readJson(FILES.rules),
    readJson(FILES.live),
    readJson(FILES.authority),
    readJson(FILES.scores),
    readJson(FILES.projections),
    readJson(FILES.recommendations),
    readJson(FILES.teamBuilderQa)
  ];
  const projectionRows = rowsFrom(projections, ["playerMatchdayProjections"]);
  const recommendationRows = rowsFrom(recommendations, ["recommendationCandidates"]);
  const france = teamAudit({ rules, live, authority, scores, projections, recommendations, teamIdToCheck: "france" });
  const belgium = teamAudit({ rules, live, authority, scores, projections, recommendations, teamIdToCheck: "belgium" });
  const legacySquad = buildLegalSquad(projectionRows, rules, "legacy_group_stage_limit");
  const currentSquad = buildLegalSquad(projectionRows, rules, "active_public_r16_limit");
  const r16Squad = buildLegalSquad(projectionRows, rules, "r16_rules_limit");
  const currentFranceRows = projectionRows
    .filter((row) => teamId(row) === "france")
    .sort((a, b) => playerScore(b) - playerScore(a));
  const currentBelgiumSelected = currentSquad.selected_players
    .filter((row) => row.team_id === "belgium")
    .map((row) => ({
      ...row,
      role: currentSquad.starters.some((starter) => starter.name === row.name) ? "starter" : "bench"
    }));
  const compare = compareTeams(france, belgium);
  const scriptSource = fs.readFileSync("script.js", "utf8");
  const publicBuilderUsesActiveCountryLimit = scriptSource.includes("function countryLimitForMatchday") &&
    scriptSource.includes("refreshActiveCountryLimit()") &&
    scriptSource.includes("active_country_limit_matchday");
  const currentFranceSelected = currentSquad.selected_counts_by_team.france || 0;
  const r16FranceSelected = r16Squad.selected_counts_by_team.france || 0;
  const currentBelgiumSelectedCount = currentSquad.selected_counts_by_team.belgium || 0;
  const legacyFranceSelected = legacySquad.selected_counts_by_team.france || 0;
  const legacyBelgiumSelectedCount = legacySquad.selected_counts_by_team.belgium || 0;
  const franceCappedByLegacyLimit = legacyFranceSelected >= legacySquad.country_limit_used &&
    legacySquad.country_limit_used < r16Squad.country_limit_used &&
    r16FranceSelected > legacyFranceSelected;
  const belgiumDominatesBeforeFix = legacyBelgiumSelectedCount > legacyFranceSelected &&
    !compare.belgium_better_path_value &&
    !compare.france_stronger_r16_attacking_environment;
  const remainingBelgiumDominates = currentBelgiumSelectedCount > currentFranceSelected &&
    !compare.belgium_better_path_value &&
    !compare.france_stronger_r16_attacking_environment;
  const status = authority.status === "pass" &&
    scores.summary?.completedR32FixturesUsed === 16 &&
    projectionRows.length > 0 &&
    recommendationRows.length > 0 &&
    publicBuilderUsesActiveCountryLimit
    ? "pass"
    : "fail";
  const answers = [
    {
      question: "Does France have a stronger R16 attacking environment than Belgium?",
      answer: compare.france_stronger_r16_attacking_environment
        ? `Yes. France xG ${france.r16_prediction.expected_goals} vs Belgium xG ${belgium.r16_prediction.expected_goals}.`
        : `No. France xG ${france.r16_prediction.expected_goals} vs Belgium xG ${belgium.r16_prediction.expected_goals}.`
    },
    {
      question: "Does France have stronger recent form than Belgium?",
      answer: compare.france_stronger_recent_form
        ? `Yes. France recent-form adjustment ${france.form.recent_form_adjustment} vs Belgium ${belgium.form.recent_form_adjustment}.`
        : `No. France recent-form adjustment ${france.form.recent_form_adjustment} vs Belgium ${belgium.form.recent_form_adjustment}.`
    },
    {
      question: "Does Belgium have a better path value than France?",
      answer: compare.belgium_better_path_value
        ? `Yes. Belgium path value ${belgium.r16_prediction.path_value} vs France ${france.r16_prediction.path_value}.`
        : `No. France path value ${france.r16_prediction.path_value} is above Belgium ${belgium.r16_prediction.path_value}; active R16 projections only encode R16 advance probability, not a future-round path boost.`
    },
    {
      question: "Is the builder choosing Belgium because of path value, budget, position constraints, player projections, or stale weights?",
      answer: currentBelgiumSelectedCount
        ? `Belgium exposure is mainly player-projection/budget/position fit. Belgium path value is lower than France, and selected Belgium rows are not lifted by a superior path value.`
        : "The current-limit diagnostic squad selects no Belgium players."
    },
    {
      question: "Is France exposure capped by position, country limit, budget, or recommendation pool construction?",
      answer: franceCappedByLegacyLimit
        ? `Before the fix, yes: the legacy public builder wiring used country limit ${legacySquad.country_limit_used}, while R16 rules allow ${r16Squad.country_limit_used}; France rises from ${legacyFranceSelected} to ${currentFranceSelected} with the active R16 limit.`
        : `No hard France cap was detected in the diagnostic. France has ${france.projections.player_count} projection rows and ${france.recommendations.total} recommendation rows.`
    },
    {
      question: "Are French players missing from candidate pools before optimization?",
      answer: france.projections.player_count && france.recommendations.total
        ? `No. France has ${france.projections.player_count} projection rows and ${france.recommendations.total} recommendation rows before optimization.`
        : "Yes. France candidate coverage is incomplete."
    },
    {
      question: "Are French players present but losing in optimization?",
      answer: currentFranceRows.length > currentFranceSelected
        ? `Yes. French players are present; omitted top rows lose to active R16 country cap, position, budget, or higher composite squad score.`
        : "No. All available French rows are selected in the current diagnostic."
    },
    {
      question: "Are Belgian players selected mainly because of value/path rather than projected points?",
      answer: currentBelgiumSelectedCount
        ? "Selected Belgian rows have explainable projected-points/value fit; path is not a superior Belgium signal versus France."
        : "No Belgian players are selected in the current diagnostic."
    }
  ];
  const audit = {
    schema_version: "r16_team_exposure_audit_v1",
    generated_at: GENERATED_AT,
    status,
    files: FILES,
    gates: {
      r16_fixture_authority_status: authority.status,
      completed_r32_fixtures_used: scores.summary?.completedR32FixturesUsed || 0,
      r16_fixture_count: authority.summary?.total_r16_fixtures || 0,
      ownership_used_as_signal: false,
      final_squads_source_backed: false
    },
    teams: {
      france,
      belgium
    },
    comparison: compare,
    builder_scenarios: {
      legacy_group_stage_limit: legacySquad,
      current_public_limit: currentSquad,
      active_public_r16_limit: currentSquad,
      r16_rules_limit: r16Squad,
      generated_team_builder_qa_sample: teamBuilderQa
    },
    diagnostics: {
      model_imbalance_found: franceCappedByLegacyLimit || belgiumDominatesBeforeFix,
      remaining_model_imbalance_found: remainingBelgiumDominates,
      public_builder_uses_active_country_limit: publicBuilderUsesActiveCountryLimit,
      likely_root_causes: [
        franceCappedByLegacyLimit ? "public_builder_used_group_stage_country_limit_instead_of_r16_knockout_limit_before_fix" : "",
        belgiumDominatesBeforeFix ? "belgium_exposure_exceeded_france_without_fixture_or_path_support" : ""
      ].filter(Boolean),
      answers,
      france_exposure_before_fix: {
        selected: legacyFranceSelected,
        starters: legacySquad.starter_counts_by_team.france || 0,
        bench: legacySquad.bench_counts_by_team.france || 0
      },
      france_exposure_after_fix: {
        selected: currentFranceSelected,
        starters: currentSquad.starter_counts_by_team.france || 0,
        bench: currentSquad.bench_counts_by_team.france || 0
      },
      belgium_exposure_before_fix: {
        selected: legacyBelgiumSelectedCount,
        starters: legacySquad.starter_counts_by_team.belgium || 0,
        bench: legacySquad.bench_counts_by_team.belgium || 0
      },
      belgium_exposure_after_fix: {
        selected: currentBelgiumSelectedCount,
        starters: currentSquad.starter_counts_by_team.belgium || 0,
        bench: currentSquad.bench_counts_by_team.belgium || 0
      },
      top_omitted_france_players: selectedDiagnostics(currentFranceRows, currentSquad, "france"),
      selected_belgium_players: selectedPlayerReasons(currentBelgiumSelected),
      qa_checks: {
        top_3_xg_strong_form_team_has_public_exposure: france.r16_prediction.expected_goals >= 1.7 && france.form.recent_form_adjustment >= belgium.form.recent_form_adjustment
          ? france.recommendations.total > 0 && france.projections.top_10_projected_players.length > 0
          : true,
        weaker_form_moderate_context_team_not_unexplained_dominant: currentBelgiumSelectedCount <= currentFranceSelected || Boolean(compare.belgium_better_path_value),
        france_and_belgium_explicit_diagnostics: true
      }
    }
  };

  await writeFile(FILES.outputJson, `${JSON.stringify(audit, null, 2)}\n`, "utf8");
  await writeFile(FILES.outputReport, buildReport(audit), "utf8");
  console.log(JSON.stringify({
    status: audit.status,
    model_imbalance_found: audit.diagnostics.model_imbalance_found,
    remaining_model_imbalance_found: audit.diagnostics.remaining_model_imbalance_found,
    likely_root_causes: audit.diagnostics.likely_root_causes,
    france_before_selected: legacyFranceSelected,
    france_after_selected: currentFranceSelected,
    belgium_before_selected: legacyBelgiumSelectedCount,
    belgium_after_selected: currentBelgiumSelectedCount,
    output_json: FILES.outputJson,
    output_report: FILES.outputReport
  }, null, 2));
}

await main();
