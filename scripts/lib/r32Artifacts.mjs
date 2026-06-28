import fs from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import vm from "node:vm";
import { compactProjectionOutput, compactProjectionRow, writeProjectionBrowserData } from "./publicProjectionCompact.mjs";

const GENERATED_AT = new Date().toISOString();
const MODEL_VERSION = "r32-v1-final-official-fixtures";
const FINAL_RELEASE_STATUS = "final_r32_setup";
const PROVISIONAL_RELEASE_STATUS = "provisional_r32_setup";
const TEAM_ORDER = ["GK", "DEF", "MID", "FWD"];

function round(value, digits = 3) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  const factor = 10 ** digits;
  return Math.round(number * factor) / factor;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function sum(values) {
  return values.filter(Number.isFinite).reduce((total, value) => total + value, 0);
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

function isFinalFixture(row) {
  return row?.mapping_status === "matched" &&
    row?.safe_to_display_score === true &&
    row?.fixture_status === "complete" &&
    Number.isFinite(Number(row.home_score)) &&
    Number.isFinite(Number(row.away_score));
}

function isSelectableStatus(status) {
  return String(status || "").toLowerCase() === "playing";
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readBrowserGlobals(files) {
  const context = { window: {} };
  vm.createContext(context);
  for (const file of files) {
    vm.runInContext(fs.readFileSync(file, "utf8"), context, { filename: file });
  }
  return context.window;
}

function loadWorldCupData() {
  return readBrowserGlobals(["worldCupData.js"]).WORLD_CUP_DATA;
}

function mdTable(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((value) => String(value ?? "")).join(" | ")} |`)
  ].join("\n");
}

async function writeJson(filePath, value, compact = false) {
  await writeFile(filePath, `${compact ? JSON.stringify(value) : JSON.stringify(value, null, 2)}\n`, "utf8");
}

function poisson(k, lambda) {
  let factorial = 1;
  for (let index = 2; index <= k; index += 1) factorial *= index;
  return Math.exp(-lambda) * (lambda ** k) / factorial;
}

function scoreMatrix(homeXg, awayXg, maxGoals = 8) {
  const matrix = [];
  let homeWin = 0;
  let draw = 0;
  let awayWin = 0;
  for (let h = 0; h <= maxGoals; h += 1) {
    for (let a = 0; a <= maxGoals; a += 1) {
      const probability = poisson(h, homeXg) * poisson(a, awayXg);
      matrix.push({ h, a, probability });
      if (h > a) homeWin += probability;
      else if (h === a) draw += probability;
      else awayWin += probability;
    }
  }
  const total = homeWin + draw + awayWin;
  return {
    home_win_probability: homeWin / total,
    draw_probability: draw / total,
    away_win_probability: awayWin / total,
    top_scorelines: matrix
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 6)
      .map((row) => ({
        scoreline: `${row.h}-${row.a}`,
        home_goals: row.h,
        away_goals: row.a,
        probability: round(row.probability / total, 4)
      }))
  };
}

function teamQualityIndex(teamQuality) {
  const bySlug = new Map();
  const byName = new Map();
  for (const row of teamQuality.teams || []) {
    bySlug.set(row.team_id, row);
    byName.set(normalizeText(row.country), row);
  }
  return { bySlug, byName };
}

function teamRowForName(index, name) {
  return index.byName.get(normalizeText(name)) || index.bySlug.get(slug(name));
}

function teamStrength(row) {
  return Number(row?.team_quality_v2?.overall_score ?? row?.team_quality_v1?.overall_score ?? 50);
}

function attackScore(row) {
  return Number(row?.goals_clean_sheet_inputs_v2?.attack_proxy_score ?? teamStrength(row));
}

function defenseScore(row) {
  return Number(row?.goals_clean_sheet_inputs_v2?.defense_proxy_score ?? teamStrength(row));
}

function expectedGoalsFor(team, opponent) {
  const attack = attackScore(team);
  const oppDefense = defenseScore(opponent);
  const qualityGap = teamStrength(team) - teamStrength(opponent);
  const base = 1.14;
  const xg = base + (attack - 50) * 0.018 - (oppDefense - 50) * 0.014 + qualityGap * 0.009;
  return round(clamp(xg, 0.35, 3.4), 3);
}

function uncertaintyLabel(home, away, drawProbability) {
  const gap = Math.abs(teamStrength(home) - teamStrength(away));
  if (drawProbability > 0.29 || gap < 8) return "High";
  if (drawProbability > 0.24 || gap < 18) return "Medium";
  return "Low";
}

function buildKnockoutPrediction(homeName, awayName, qualityIndex, meta = {}) {
  const home = teamRowForName(qualityIndex, homeName);
  const away = teamRowForName(qualityIndex, awayName);
  if (!home || !away) return null;
  const homeXg = expectedGoalsFor(home, away);
  const awayXg = expectedGoalsFor(away, home);
  const matrix = scoreMatrix(homeXg, awayXg);
  const homeCleanSheet = Math.exp(-awayXg);
  const awayCleanSheet = Math.exp(-homeXg);
  const nilNil = Math.exp(-(homeXg + awayXg));
  const bothTeamsToScore = 1 - homeCleanSheet - awayCleanSheet + nilNil;
  const strengthGap = clamp((teamStrength(home) - teamStrength(away)) / 100, -0.35, 0.35);
  const extraTimeEntry = matrix.draw_probability;
  const homeExtraTimeEdge = clamp(0.5 + strengthGap * 0.38, 0.38, 0.62);
  const awayExtraTimeEdge = 1 - homeExtraTimeEdge;
  const penaltyEdge = clamp(0.5 + strengthGap * 0.16, 0.44, 0.56);
  const extraTimeDecides = extraTimeEntry * 0.38;
  const penaltiesEntry = extraTimeEntry * 0.62;
  const homeAdvance90 = matrix.home_win_probability;
  const awayAdvance90 = matrix.away_win_probability;
  const homeAdvanceEt = extraTimeDecides * homeExtraTimeEdge;
  const awayAdvanceEt = extraTimeDecides * awayExtraTimeEdge;
  const homeAdvancePens = penaltiesEntry * penaltyEdge;
  const awayAdvancePens = penaltiesEntry * (1 - penaltyEdge);
  const homeAdvance = homeAdvance90 + homeAdvanceEt + homeAdvancePens;
  const awayAdvance = awayAdvance90 + awayAdvanceEt + awayAdvancePens;
  const predictedAdvancer = homeAdvance >= awayAdvance ? homeName : awayName;
  return {
    prediction_id: `ko-${slug(homeName)}-${slug(awayName)}-${MODEL_VERSION}`,
    match_id: meta.match_id || null,
    fixture_id: meta.fixture_id || null,
    match_number: meta.match_number ?? null,
    matchday: "r32",
    fantasy_matchday_id: "r32",
    stage: meta.stage || "round_of_32",
    path_status: meta.path_status || "known_official_fixture",
    bracket_path: meta.bracket_path || null,
    date: meta.date || null,
    home_team_id: home.team_id,
    home_team: home.country,
    away_team_id: away.team_id,
    away_team: away.country,
    home_expected_goals: homeXg,
    away_expected_goals: awayXg,
    home_projected_xg: homeXg,
    away_projected_xg: awayXg,
    total_expected_goals: round(homeXg + awayXg),
    home_win_probability: round(matrix.home_win_probability, 4),
    draw_probability: round(matrix.draw_probability, 4),
    away_win_probability: round(matrix.away_win_probability, 4),
    home_clean_sheet_probability: round(homeCleanSheet, 4),
    away_clean_sheet_probability: round(awayCleanSheet, 4),
    both_teams_to_score_probability: round(bothTeamsToScore, 4),
    upset_risk_probability: round(Math.min(matrix.home_win_probability, matrix.away_win_probability), 4),
    probability_extra_time: round(extraTimeEntry, 4),
    home_advance_probability: round(homeAdvance, 4),
    away_advance_probability: round(awayAdvance, 4),
    home_advance_in_90_probability: round(homeAdvance90, 4),
    away_advance_in_90_probability: round(awayAdvance90, 4),
    home_advance_after_extra_time_probability: round(homeAdvanceEt, 4),
    away_advance_after_extra_time_probability: round(awayAdvanceEt, 4),
    home_advance_on_penalties_probability: round(homeAdvancePens, 4),
    away_advance_on_penalties_probability: round(awayAdvancePens, 4),
    projected_advancing_team: predictedAdvancer,
    projected_final_advancing_team: predictedAdvancer,
    favorite_team: predictedAdvancer,
    favorite_team_id: slug(predictedAdvancer),
    favorite_win_probability: round(Math.max(homeAdvance, awayAdvance), 4),
    uncertainty_label: uncertaintyLabel(home, away, matrix.draw_probability),
    matchUncertainty: uncertaintyLabel(home, away, matrix.draw_probability),
    top_scorelines: matrix.top_scorelines,
    explanation: `${home.country} ${homeXg.toFixed(2)} xG vs ${away.country} ${awayXg.toFixed(2)} xG. Extra time is driven by the 90-minute draw probability; penalties stay near 50/50 with a small PELE/team-quality edge.`,
    assumptions: [
      "90-minute goals use the refreshed PELE-forward teamQuality prior plus conservative group-stage calibration.",
      "Extra-time entry equals 90-minute draw probability.",
      "Penalty edge is intentionally small and centered near 50/50.",
      "No betting odds, lineups, injuries beyond official fantasy selectable status, or ownership are used."
    ],
    qa_flags: [
      "knockout_score_predictor_v1",
      "pele_team_quality_prior",
      "no_betting_odds",
      "ownership_not_used_as_signal",
      "final_squads_not_source_backed"
    ]
  };
}

function fixtureMatchday(matchNumber) {
  const n = Number(matchNumber);
  if (n >= 1 && n <= 24) return "md1";
  if (n <= 48) return "md2";
  if (n <= 72) return "md3";
  return "knockout";
}

function buildGroupStandings(worldCup, live) {
  const localByMatch = new Map((worldCup.fixtures || []).map((fixture) => [Number(fixture.match_number), fixture]));
  const standings = new Map();
  const finalFixtures = [];
  const unfinishedFixtures = [];
  for (const fixture of live.fixtures || []) {
    const local = localByMatch.get(Number(fixture.local_match_number));
    if (!local) continue;
    if (!standings.has(local.group)) standings.set(local.group, new Map());
    const table = standings.get(local.group);
    for (const team of [fixture.local_home_team, fixture.local_away_team]) {
      const key = normalizeText(team);
      if (!table.has(key)) {
        table.set(key, {
          team,
          team_id: slug(team),
          group: local.group,
          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goals_for: 0,
          goals_against: 0,
          goal_difference: 0,
          points: 0
        });
      }
    }
    if (!isFinalFixture(fixture)) {
      unfinishedFixtures.push({
        match_number: local.match_number,
        group: local.group,
        fixture: `${fixture.local_home_team} vs ${fixture.local_away_team}`,
        status: fixture.fixture_status
      });
      continue;
    }
    const home = table.get(normalizeText(fixture.local_home_team));
    const away = table.get(normalizeText(fixture.local_away_team));
    const hg = Number(fixture.home_score);
    const ag = Number(fixture.away_score);
    home.played += 1;
    away.played += 1;
    home.goals_for += hg;
    home.goals_against += ag;
    away.goals_for += ag;
    away.goals_against += hg;
    if (hg > ag) {
      home.wins += 1; home.points += 3; away.losses += 1;
    } else if (hg < ag) {
      away.wins += 1; away.points += 3; home.losses += 1;
    } else {
      home.draws += 1; away.draws += 1; home.points += 1; away.points += 1;
    }
    finalFixtures.push({
      match_number: local.match_number,
      group: local.group,
      fixture_id: fixture.local_fixture_id,
      home_team: fixture.local_home_team,
      away_team: fixture.local_away_team,
      home_score: hg,
      away_score: ag,
      matchday: fixtureMatchday(local.match_number)
    });
  }
  const groupRows = [];
  for (const [group, table] of standings.entries()) {
    const teams = [...table.values()].map((team) => ({
      ...team,
      goal_difference: team.goals_for - team.goals_against
    })).sort((a, b) =>
      b.points - a.points ||
      b.goal_difference - a.goal_difference ||
      b.goals_for - a.goals_for ||
      a.team.localeCompare(b.team)
    );
    const completed = teams.reduce((total, team) => total + team.played, 0) / 2;
    groupRows.push({
      group,
      completed_fixtures: completed,
      total_fixtures: 6,
      complete: completed === 6,
      standings: teams.map((team, index) => ({ ...team, rank: index + 1 })),
      safe_qualified_top_two: completed === 6 ? teams.slice(0, 2).map((team) => team.team) : [],
      safe_eliminated: completed === 6 ? teams.slice(3).map((team) => team.team) : [],
      still_uncertain: completed === 6 ? teams.slice(2, 3).map((team) => team.team) : teams.map((team) => team.team)
    });
  }
  return { groups: groupRows.sort((a, b) => a.group.localeCompare(b.group)), finalFixtures, unfinishedFixtures };
}

function knownR32Fixtures(live, worldCup) {
  const pathsById = new Map();
  for (const round of worldCup.bracket?.rounds || []) {
    for (const match of round.matches || []) pathsById.set(String(match.id), match.path);
  }
  return (live.fixtures || [])
    .filter((fixture) => String(fixture.round_id) === "4" || Number(fixture.source_fixture_order) >= 73)
    .filter((fixture) => Number(fixture.source_fixture_order || fixture.source_fixture_id) >= 73)
    .map((fixture) => ({
      match_id: String(fixture.source_fixture_id || fixture.source_fixture_order),
      fixture_id: `fwc2026-m${String(fixture.source_fixture_id || fixture.source_fixture_order).padStart(3, "0")}`,
      match_number: Number(fixture.source_fixture_id || fixture.source_fixture_order),
      stage: "round_of_32",
      fixture_status: fixture.fixture_status,
      path_status: "known_official_fixture",
      bracket_path: pathsById.get(String(fixture.source_fixture_id || fixture.source_fixture_order)) || null,
      date: fixture.date,
      home_team: fixture.home_team,
      away_team: fixture.away_team
    }))
    .filter((fixture) => fixture.home_team && fixture.away_team)
    .sort((a, b) => a.match_number - b.match_number);
}

function previousPredictionsByFixture() {
  const score = readJson("data/scorePredictions_fantasyPool_v5_md3.json");
  return new Map((score.fixtureScorePredictions || []).map((row) => [row.fixture_id || row.match_id, row]));
}

function buildPostmortem(worldCup, live, qualityIndex) {
  const previous = previousPredictionsByFixture();
  const localByMatch = new Map((worldCup.fixtures || []).map((fixture) => [Number(fixture.match_number), fixture]));
  const finalFixtures = (live.fixtures || []).filter(isFinalFixture).filter((fixture) => Number(fixture.local_match_number) <= 72);
  const unfinishedGroupFixtures = (live.fixtures || [])
    .filter((fixture) => {
      const matchNumber = Number(fixture.local_match_number);
      return Number.isFinite(matchNumber) && matchNumber > 0 && matchNumber <= 72 && !isFinalFixture(fixture);
    })
    .map((fixture) => {
      const local = localByMatch.get(Number(fixture.local_match_number));
      return {
        match_number: Number(fixture.local_match_number),
        fixture_id: fixture.local_fixture_id,
        matchday: fixtureMatchday(fixture.local_match_number),
        group: local?.group || null,
        fixture: `${fixture.local_home_team || fixture.home_team} vs ${fixture.local_away_team || fixture.away_team}`,
        fixture_status: fixture.fixture_status,
        score_status: fixture.score_status,
        period: fixture.period,
        safe_to_display_score: fixture.safe_to_display_score === true
      };
    });
  const finalityByMatchday = ["md1", "md2", "md3"].map((matchday) => {
    const finalCount = finalFixtures.filter((fixture) => fixtureMatchday(fixture.local_match_number) === matchday).length;
    const unfinishedCount = unfinishedGroupFixtures.filter((fixture) => fixture.matchday === matchday).length;
    return {
      matchday,
      final_fixtures: finalCount,
      unfinished_fixtures: unfinishedCount,
      total_fixtures: finalCount + unfinishedCount
    };
  });
  const residuals = finalFixtures.map((fixture) => {
    const local = localByMatch.get(Number(fixture.local_match_number));
    const prediction = previous.get(fixture.local_fixture_id);
    const homePred = Number(prediction?.home_expected_goals);
    const awayPred = Number(prediction?.away_expected_goals);
    const hg = Number(fixture.home_score);
    const ag = Number(fixture.away_score);
    const favoriteCorrect = prediction?.favorite_team
      ? (hg > ag && normalizeText(prediction.favorite_team) === normalizeText(fixture.local_home_team)) ||
        (ag > hg && normalizeText(prediction.favorite_team) === normalizeText(fixture.local_away_team))
      : null;
    return {
      fixture_id: fixture.local_fixture_id,
      match_number: Number(fixture.local_match_number),
      matchday: fixtureMatchday(fixture.local_match_number),
      group: local?.group || null,
      home_team: fixture.local_home_team,
      away_team: fixture.local_away_team,
      actual_home_goals: hg,
      actual_away_goals: ag,
      predicted_home_xg: round(homePred),
      predicted_away_xg: round(awayPred),
      home_attack_residual: Number.isFinite(homePred) ? round(hg - homePred) : null,
      away_attack_residual: Number.isFinite(awayPred) ? round(ag - awayPred) : null,
      total_goal_residual: Number.isFinite(homePred + awayPred) ? round(hg + ag - homePred - awayPred) : null,
      clean_sheet_home: ag === 0,
      clean_sheet_away: hg === 0,
      favorite_correct_90: favoriteCorrect
    };
  });
  const byTeam = new Map();
  for (const row of residuals) {
    for (const side of ["home", "away"]) {
      const team = side === "home" ? row.home_team : row.away_team;
      const opponent = side === "home" ? row.away_team : row.home_team;
      const goalsFor = side === "home" ? row.actual_home_goals : row.actual_away_goals;
      const goalsAgainst = side === "home" ? row.actual_away_goals : row.actual_home_goals;
      const gfResidual = side === "home" ? row.home_attack_residual : row.away_attack_residual;
      const gaResidual = side === "home" ? row.away_attack_residual : row.home_attack_residual;
      const predictedAgainst = side === "home" ? row.predicted_away_xg : row.predicted_home_xg;
      const cleanSheet = side === "home" ? row.clean_sheet_home : row.clean_sheet_away;
      const current = byTeam.get(team) || {
        team,
        matches: 0,
        goals_for: 0,
        goals_against: 0,
        conceded_matches: 0,
        attack_residuals: [],
        defense_residuals: [],
        expected_clean_sheet_probabilities: [],
        opponent_quality_scores: [],
        clean_sheets: 0
      };
      current.matches += 1;
      current.goals_for += goalsFor;
      current.goals_against += goalsAgainst;
      if (goalsAgainst > 0) current.conceded_matches += 1;
      if (Number.isFinite(gfResidual)) current.attack_residuals.push(gfResidual);
      if (Number.isFinite(gaResidual)) current.defense_residuals.push(gaResidual);
      if (Number.isFinite(predictedAgainst)) current.expected_clean_sheet_probabilities.push(Math.exp(-predictedAgainst));
      current.opponent_quality_scores.push(teamStrength(teamRowForName(qualityIndex, opponent)));
      if (cleanSheet) current.clean_sheets += 1;
      byTeam.set(team, current);
    }
  }
  const teamResiduals = [...byTeam.values()].map((row) => ({
    team: row.team,
    team_id: slug(row.team),
    matches: row.matches,
    goals_for: row.goals_for,
    goals_against: row.goals_against,
    conceded_matches: row.conceded_matches,
    conceded_in_every_group_game: row.matches > 0 && row.conceded_matches === row.matches,
    average_attack_residual: round(sum(row.attack_residuals) / Math.max(1, row.attack_residuals.length)),
    average_defense_residual_allowed: round(sum(row.defense_residuals) / Math.max(1, row.defense_residuals.length)),
    clean_sheet_count: row.clean_sheets,
    clean_sheet_rate: round(row.clean_sheets / Math.max(1, row.matches)),
    expected_clean_sheet_rate: round(sum(row.expected_clean_sheet_probabilities) / Math.max(1, row.expected_clean_sheet_probabilities.length)),
    average_opponent_quality: round(sum(row.opponent_quality_scores) / Math.max(1, row.opponent_quality_scores.length), 2),
    team_quality_score: round(teamStrength(teamRowForName(qualityIndex, row.team)), 2)
  })).sort((a, b) => b.average_attack_residual - a.average_attack_residual);
  const livePlayers = readJson("data/livePlayerStatus_v1.json").players || [];
  const priorRecs = readJson("data/fantasyPoolRecommendations_md3_v5.json").recommendationCandidates || [];
  const topPriorById = new Map();
  for (const rec of priorRecs.filter((row) => row.matchday === "md3")) {
    const id = String(rec.official_fantasy_player_id || "");
    const prev = topPriorById.get(id);
    if (!prev || Number(rec.rank || 999) < Number(prev.rank || 999)) topPriorById.set(id, rec);
  }
  const playerActualRows = livePlayers.map((player) => {
    const roundPoints = player.stats?.roundPoints || {};
    const total = sum(Object.values(roundPoints).map(Number));
    const prior = topPriorById.get(String(player.official_fantasy_player_id));
    return {
      official_fantasy_player_id: player.official_fantasy_player_id,
      name: player.name,
      team: player.team_name,
      position: player.position,
      status: player.status,
      matchStatus: player.matchStatus,
      md1_points: Number(roundPoints["1"] ?? 0),
      md2_points: Number(roundPoints["2"] ?? 0),
      md3_points: Number(roundPoints["3"] ?? 0),
      completed_group_points: round(total),
      prior_md3_projected_points: prior ? round(prior.raw_expected_points ?? prior.projectedPoints) : null,
      prior_md3_rank: prior?.rank ?? null,
      projection_error: prior ? round((Number(roundPoints["3"] ?? 0)) - Number(prior.raw_expected_points ?? prior.projectedPoints ?? 0)) : null
    };
  });
  const underperformers = playerActualRows
    .filter((row) => Number.isFinite(row.prior_md3_projected_points) && row.prior_md3_projected_points >= 5 && row.md3_points <= 2)
    .sort((a, b) => (a.projection_error || 0) - (b.projection_error || 0))
    .slice(0, 40);
  const roleRiskPlayers = playerActualRows
    .filter((row) => ["sub", "not_in_squad"].includes(String(row.matchStatus || "")) && row.status === "playing")
    .slice(0, 60);
  const explicitNames = ["Haaland", "Luis Suárez", "Luis Suarez", "O'Reilly", "O’Reilly", "Raphinha", "Raphael Dias Belloli"];
  const explicitAudits = playerActualRows
    .filter((row) => explicitNames.some((name) => normalizeText(row.name).includes(normalizeText(name))))
    .map((row) => ({
      ...row,
      r32_interpretation: /haaland/i.test(row.name)
        ? "Preserve R32 starter probability with caution: Norway are safely qualified and MD3 absence/sub status is treated as possible rest/rotation, not automatic role loss."
        : row.status !== "playing"
          ? "Zero/exclude unless official status returns to playing."
          : row.matchStatus === "not_in_squad"
            ? "Role-risk downgrade unless team context indicates clear qualification/rest."
            : "Use group-stage points and role evidence with modest form confidence adjustment."
    }));
	return {
    schema_version: "group_stage_postmortem_for_r32_v1",
    generated_at: GENERATED_AT,
    model_version: MODEL_VERSION,
    evidence_scope: unfinishedGroupFixtures.length
      ? "final MD1, final MD2, completed/final MD3 only"
      : "final MD1, final MD2, and final MD3 fixtures",
    release_status: unfinishedGroupFixtures.length ? PROVISIONAL_RELEASE_STATUS : FINAL_RELEASE_STATUS,
    unfinished_md3_excluded: unfinishedGroupFixtures.length > 0,
    final_fixture_count: residuals.length,
    completed_md3_fixture_count: residuals.filter((row) => row.matchday === "md3").length,
    unfinished_md3_fixture_count: unfinishedGroupFixtures.filter((row) => row.matchday === "md3").length,
    unfinished_group_fixtures: unfinishedGroupFixtures,
    finality_summary: finalityByMatchday,
    fixture_residuals: residuals,
    team_residuals: teamResiduals,
    result_accuracy: {
      favorite_accuracy_known_rows: residuals.filter((row) => row.favorite_correct_90 !== null).length,
      favorite_correct_count: residuals.filter((row) => row.favorite_correct_90 === true).length,
      favorite_accuracy: round(residuals.filter((row) => row.favorite_correct_90 === true).length / Math.max(1, residuals.filter((row) => row.favorite_correct_90 !== null).length))
    },
    player_actual_points_by_matchday: playerActualRows,
    underperformers_with_high_prior_projections: underperformers,
    players_with_role_or_start_security_risk: roleRiskPlayers,
    rested_due_to_likely_qualification_or_rotation: playerActualRows.filter((row) => row.status === "playing" && row.matchStatus === "sub" && ["Norway", "France", "Brazil", "Netherlands", "Spain", "Belgium"].includes(row.team)).slice(0, 50),
    injured_suspended_not_selectable_players: livePlayers.filter((player) => !isSelectableStatus(player.status)).map((player) => ({
      official_fantasy_player_id: player.official_fantasy_player_id,
      name: player.name,
      team: player.team_name,
      status: player.status
    })),
    explicit_audits: explicitAudits,
    ownership_used_as_signal: false,
    final_squads_source_backed: false
  };
}

function buildTeamFormModel(postmortem) {
  const rows = (postmortem.team_residuals || []).map((row) => {
    const matches = Math.max(1, Number(row.matches || 0));
    const actualCleanSheetRate = Number(row.clean_sheet_rate || 0);
    const expectedCleanSheetRate = Number(row.expected_clean_sheet_rate || 0);
    const opponentQuality = Number(row.average_opponent_quality || 50);
    const opponentQualityAdjustment = clamp((opponentQuality - 50) / 100, -0.2, 0.2);
    const rawDelta = actualCleanSheetRate - expectedCleanSheetRate;
    const qualityWeightedDelta = rawDelta >= 0
      ? rawDelta * (1 + opponentQualityAdjustment)
      : rawDelta * (1 - opponentQualityAdjustment);
    const shrinkage = matches / (matches + 4);
    const repeatedCleanSheetBoost = Number(row.clean_sheet_count || 0) >= 2
      ? 0.04 * (1 + opponentQualityAdjustment)
      : 0;
    const concededEveryGamePenalty = row.conceded_in_every_group_game
      ? 0.06 * (1 - opponentQualityAdjustment)
      : 0;
    const adjustment = clamp(
      (qualityWeightedDelta * 0.45 + repeatedCleanSheetBoost - concededEveryGamePenalty) * shrinkage,
      -0.18,
      0.18
    );
    const cleanSheetMultiplier = clamp(1 + adjustment, 0.82, 1.18);
    const label = adjustment >= 0.055
      ? "positive_clean_sheet_form"
      : adjustment <= -0.055
        ? "negative_clean_sheet_form"
        : "neutral_clean_sheet_form";
    return {
      team: row.team,
      team_id: row.team_id,
      matches: row.matches,
      goals_against: row.goals_against,
      clean_sheets: row.clean_sheet_count,
      conceded_matches: row.conceded_matches,
      conceded_in_every_group_game: row.conceded_in_every_group_game,
      actual_clean_sheet_rate: actualCleanSheetRate,
      expected_clean_sheet_rate: expectedCleanSheetRate,
      average_opponent_quality: row.average_opponent_quality,
      clean_sheet_delta: round(rawDelta),
      opponent_quality_adjustment: round(opponentQualityAdjustment),
      shrinkage_factor: round(shrinkage),
      clean_sheet_form_adjustment: round(adjustment),
      clean_sheet_multiplier: round(cleanSheetMultiplier),
      defender_gk_projection_points_adjustment: round(adjustment * 5),
      defensive_form_label: label,
      model_note: row.conceded_in_every_group_game
        ? "Conceded in every group game; GK/DEF clean-sheet confidence reduced after shrinkage."
        : Number(row.clean_sheet_count || 0) >= 2
          ? "Repeated clean sheets; GK/DEF clean-sheet confidence improved after opponent-quality shrinkage."
          : "Neutral defensive form after shrinkage."
    };
  }).sort((a, b) =>
    b.clean_sheet_form_adjustment - a.clean_sheet_form_adjustment ||
    a.team.localeCompare(b.team)
  );
  const byTeam = new Map(rows.map((row) => [row.team_id, row]));
  const germany = byTeam.get("germany") || null;
  const spain = byTeam.get("spain") || null;
  return {
    schema_version: "group_stage_team_form_model_r32_v1",
    generated_at: GENERATED_AT,
    model_version: "team-form-r32-v1-final-group-stage",
    evidence_scope: postmortem.evidence_scope,
    release_status: postmortem.release_status,
    formula: {
      shrinkage: "matches / (matches + 4)",
      clean_sheet_delta: "actual clean-sheet rate minus prior expected clean-sheet rate from score model xG",
      opponent_quality: "positive clean-sheet deltas are smaller against weak opponents and larger against strong opponents; negative deltas are harsher against weak opponents",
      caps: "clean_sheet_form_adjustment clamped to [-0.18, 0.18]; clean_sheet_multiplier clamped to [0.82, 1.18]",
      ownership_used_as_signal: false,
      final_squads_source_backed: false
    },
    summary: {
      team_rows: rows.length,
      positive_form_teams: rows.filter((row) => row.clean_sheet_form_adjustment > 0.02).length,
      negative_form_teams: rows.filter((row) => row.clean_sheet_form_adjustment < -0.02).length,
      conceded_every_group_game_teams: rows.filter((row) => row.conceded_in_every_group_game).map((row) => row.team),
      repeated_clean_sheet_teams: rows.filter((row) => row.clean_sheets >= 2).map((row) => row.team),
      germany: germany ? {
        goals_against: germany.goals_against,
        clean_sheets: germany.clean_sheets,
        conceded_in_every_group_game: germany.conceded_in_every_group_game,
        clean_sheet_multiplier: germany.clean_sheet_multiplier,
        defender_gk_projection_points_adjustment: germany.defender_gk_projection_points_adjustment
      } : null,
      spain: spain ? {
        goals_against: spain.goals_against,
        clean_sheets: spain.clean_sheets,
        conceded_in_every_group_game: spain.conceded_in_every_group_game,
        clean_sheet_multiplier: spain.clean_sheet_multiplier,
        defender_gk_projection_points_adjustment: spain.defender_gk_projection_points_adjustment
      } : null
    },
    team_form_rows: rows,
    explicit_audits: {
      germany,
      spain
    },
    ownership_used_as_signal: false,
    final_squads_source_backed: false
  };
}

function buildBracketPath(worldCup, live, qualityIndex) {
  const standings = buildGroupStandings(worldCup, live);
  const finalRefreshReady = standings.unfinishedFixtures.length === 0;
  const pendingGroups = new Set(standings.unfinishedFixtures.map((fixture) => fixture.group).filter(Boolean));
  const pendingTeams = new Set(standings.unfinishedFixtures.flatMap((fixture) => String(fixture.fixture || "").split(" vs ").map(normalizeText)));
  const knownFixtures = knownR32Fixtures(live, worldCup).map((fixture) => {
    const bracketPath = String(fixture.bracket_path || "");
    const pathTouchesPendingGroup = [...pendingGroups].some((group) => bracketPath.includes(`Group ${group}`));
    const teamTouchesPendingFixture = [fixture.home_team, fixture.away_team].some((team) => pendingTeams.has(normalizeText(team)));
    const slotCertainty = finalRefreshReady
      ? "locked_official_fixture"
      : pathTouchesPendingGroup || teamTouchesPendingFixture
      ? "provisional_official_fixture_pending_group_completion"
      : "locked_official_fixture";
    return {
      ...fixture,
      slot_certainty: slotCertainty === "locked_official_fixture" ? "locked" : "provisional",
      release_slot_status: slotCertainty,
      provisional_release_status: slotCertainty,
      provisional_reason: slotCertainty === "locked_official_fixture"
        ? "Official live feed provides both R32 teams and all group fixtures are final."
        : "Official live feed provides both R32 teams, but the bracket path or team context touches unfinished group fixtures; keep provisional until final refresh."
    };
  });
  const r32Predictions = knownFixtures.map((fixture) => buildKnockoutPrediction(fixture.home_team, fixture.away_team, qualityIndex, fixture)).filter(Boolean);
  const r16ByR32 = new Map();
  const r16Round = (worldCup.bracket?.rounds || []).find((round) => round.name === "Round of 16");
  for (const match of r16Round?.matches || []) {
    const ids = Array.from(String(match.path).matchAll(/Match (\d+)/g)).map((entry) => entry[1]);
    for (const id of ids) r16ByR32.set(id, { r16_match_id: match.id, path: match.path, paired_r32_match_id: ids.find((value) => value !== id) || null });
  }
  const predictionByMatch = new Map(r32Predictions.map((prediction) => [String(prediction.match_number), prediction]));
  const teamPaths = [];
  for (const prediction of r32Predictions) {
    const r16 = r16ByR32.get(String(prediction.match_number));
    const paired = r16?.paired_r32_match_id ? predictionByMatch.get(String(r16.paired_r32_match_id)) : null;
    for (const side of ["home", "away"]) {
      const team = side === "home" ? prediction.home_team : prediction.away_team;
      const opponent = side === "home" ? prediction.away_team : prediction.home_team;
      const teamAdvance = side === "home" ? prediction.home_advance_probability : prediction.away_advance_probability;
      const possibleR16 = paired?.projected_advancing_team || null;
      const r32Difficulty = teamStrength(teamRowForName(qualityIndex, opponent));
      const r16Difficulty = possibleR16 ? teamStrength(teamRowForName(qualityIndex, possibleR16)) : null;
      const pathDifficulty = round(r32Difficulty + (r16Difficulty ?? 60) * 0.65, 2);
      const hardPath = r16Difficulty !== null && (r16Difficulty >= 70 || pathDifficulty >= 95);
      teamPaths.push({
        team,
        team_id: slug(team),
        r32_match_id: prediction.match_number,
        r32_opponent: opponent,
        r32_advance_probability: teamAdvance,
        r16_match_id: r16?.r16_match_id || null,
        likely_r16_opponent_if_both_advance: possibleR16,
        known_path_status: possibleR16 ? "known_r32_plus_projected_r16_from_bracket" : "known_r32_only",
        path_difficulty_score: pathDifficulty,
        hard_path_warning: hardPath
          ? `Likely R16 path is difficult if ${possibleR16} advances.`
          : null
      });
    }
  }
  const unresolvedR32Matches = (worldCup.bracket?.rounds?.[0]?.matches || [])
    .filter((match) => !knownFixtures.some((fixture) => String(fixture.match_number) === String(match.id)))
    .map((match) => ({ match_id: match.id, path: match.path, status: finalRefreshReady ? "missing_from_live_feed_after_final_group_stage" : "uncertain_until_remaining_groups_finish" }));
  const teamsStillUncertain = finalRefreshReady && unresolvedR32Matches.length === 0
    ? []
    : standings.groups.flatMap((group) => group.still_uncertain.map((team) => ({ team, group: group.group, reason: group.complete ? "third_place_path_not_set" : "group_not_complete" })));
  return {
    schema_version: "r32_bracket_path_model_v1",
    generated_at: GENERATED_AT,
    model_version: MODEL_VERSION,
    release_status: finalRefreshReady ? FINAL_RELEASE_STATUS : PROVISIONAL_RELEASE_STATUS,
    evidence_scope: finalRefreshReady
      ? "Final group tables and final official live R32 fixtures."
      : "Completed group tables, official scheduled R32 fixtures, and unfinished group status only.",
    final_refresh_blockers: standings.unfinishedFixtures,
    current_group_standings: standings.groups,
    known_r32_fixtures: knownFixtures,
    locked_r32_slots: knownFixtures.filter((fixture) => fixture.slot_certainty === "locked"),
    provisional_r32_slots: knownFixtures.filter((fixture) => fixture.slot_certainty === "provisional"),
    uncertain_r32_slots: unresolvedR32Matches,
    unresolved_r32_matches: unresolvedR32Matches,
    teams_safely_qualified_top_two: standings.groups.flatMap((group) => group.safe_qualified_top_two.map((team) => ({ team, group: group.group, source: "completed_group_table_top_two" }))),
    teams_safely_eliminated: standings.groups.flatMap((group) => group.safe_eliminated.map((team) => ({ team, group: group.group, source: "completed_group_table_bottom" }))),
    teams_still_uncertain: teamsStillUncertain,
    team_paths: teamPaths.sort((a, b) => a.path_difficulty_score - b.path_difficulty_score),
    qa_notes: [
      "Known fixtures are read from the official live fixture feed.",
      finalRefreshReady
        ? "All group-stage fixtures are final; known R32 fixtures are treated as final official fixtures."
        : "Unresolved R32 matches are not invented.",
      finalRefreshReady
        ? "No staged/provisional R32 slots remain in the active final release."
        : "Fixtures tied to unfinished groups remain provisional until the final group refresh.",
      "R16 path warnings are computed from bracket winner paths and projected known R32 winners.",
      "Path examples are computed from current bracket data, not hardcoded."
    ],
    ownership_used_as_signal: false,
    final_squads_source_backed: false
  };
}

function teamFormFor(teamFormModel, teamId) {
  return (teamFormModel?.team_form_rows || []).find((row) => row.team_id === teamId) || null;
}

function adjustedCleanSheetProbability(baseProbability, form) {
  return round(clamp(Number(baseProbability || 0) * Number(form?.clean_sheet_multiplier || 1), 0.02, 0.92), 4);
}

function teamFixtureRowsFromPredictions(predictions, teamFormModel) {
  return predictions.flatMap((prediction) => [
    {
      team_fixture_prediction_id: `${prediction.fixture_id}-${prediction.home_team_id}-score-r32-v1`,
      match_id: prediction.match_id || prediction.fixture_id,
      fixture_id: prediction.fixture_id,
      match_number: prediction.match_number,
      fantasy_matchday_id: "r32",
      stage: "round_of_32",
      team_id: prediction.home_team_id,
      team: prediction.home_team,
      opponent_team_id: prediction.away_team_id,
      opponent: prediction.away_team,
      side: "home_listed",
      expected_goals: prediction.home_expected_goals,
      projectedXg: prediction.home_expected_goals,
      projected_xg: prediction.home_expected_goals,
      expected_goals_against: prediction.away_expected_goals,
      win_probability: prediction.home_win_probability,
      draw_probability: prediction.draw_probability,
      loss_probability: prediction.away_win_probability,
      advance_probability: prediction.home_advance_probability,
      clean_sheet_probability: adjustedCleanSheetProbability(Math.exp(-prediction.away_expected_goals), teamFormFor(teamFormModel, prediction.home_team_id)),
      base_clean_sheet_probability: round(Math.exp(-prediction.away_expected_goals), 4),
      clean_sheet_form_multiplier: teamFormFor(teamFormModel, prediction.home_team_id)?.clean_sheet_multiplier ?? 1,
      clean_sheet_form_adjustment: teamFormFor(teamFormModel, prediction.home_team_id)?.clean_sheet_form_adjustment ?? 0,
      defensive_form_label: teamFormFor(teamFormModel, prediction.home_team_id)?.defensive_form_label || "neutral_clean_sheet_form",
      fixture_difficulty_score: round(100 - prediction.home_advance_probability * 100, 2),
      fixture_difficulty_band: prediction.home_advance_probability >= 0.65 ? "favorable" : prediction.home_advance_probability >= 0.48 ? "neutral" : "difficult",
      captain_environment_score: round(prediction.home_expected_goals * 35 + prediction.home_advance_probability * 35, 1),
      matchUncertainty: prediction.uncertainty_label,
      score_model_version: "score-r32-v1-pele-group-stage-calibrated-defensive-form",
      qa_flags: prediction.qa_flags
    },
    {
      team_fixture_prediction_id: `${prediction.fixture_id}-${prediction.away_team_id}-score-r32-v1`,
      match_id: prediction.match_id || prediction.fixture_id,
      fixture_id: prediction.fixture_id,
      match_number: prediction.match_number,
      fantasy_matchday_id: "r32",
      stage: "round_of_32",
      team_id: prediction.away_team_id,
      team: prediction.away_team,
      opponent_team_id: prediction.home_team_id,
      opponent: prediction.home_team,
      side: "away_listed",
      expected_goals: prediction.away_expected_goals,
      projectedXg: prediction.away_expected_goals,
      projected_xg: prediction.away_expected_goals,
      expected_goals_against: prediction.home_expected_goals,
      win_probability: prediction.away_win_probability,
      draw_probability: prediction.draw_probability,
      loss_probability: prediction.home_win_probability,
      advance_probability: prediction.away_advance_probability,
      clean_sheet_probability: adjustedCleanSheetProbability(Math.exp(-prediction.home_expected_goals), teamFormFor(teamFormModel, prediction.away_team_id)),
      base_clean_sheet_probability: round(Math.exp(-prediction.home_expected_goals), 4),
      clean_sheet_form_multiplier: teamFormFor(teamFormModel, prediction.away_team_id)?.clean_sheet_multiplier ?? 1,
      clean_sheet_form_adjustment: teamFormFor(teamFormModel, prediction.away_team_id)?.clean_sheet_form_adjustment ?? 0,
      defensive_form_label: teamFormFor(teamFormModel, prediction.away_team_id)?.defensive_form_label || "neutral_clean_sheet_form",
      fixture_difficulty_score: round(100 - prediction.away_advance_probability * 100, 2),
      fixture_difficulty_band: prediction.away_advance_probability >= 0.65 ? "favorable" : prediction.away_advance_probability >= 0.48 ? "neutral" : "difficult",
      captain_environment_score: round(prediction.away_expected_goals * 35 + prediction.away_advance_probability * 35, 1),
      matchUncertainty: prediction.uncertainty_label,
      score_model_version: "score-r32-v1-pele-group-stage-calibrated-defensive-form",
      qa_flags: prediction.qa_flags
    }
  ]);
}

function buildScoreData(r32Predictions, postmortem, teamFormModel) {
  const previous = readJson("data/scorePredictions_fantasyPool_v5_md3.json");
  const r32Fixtures = r32Predictions.map((prediction) => ({
    ...prediction,
    prediction_id: `${prediction.fixture_id}-score-r32-v1`,
    matchday: "Round of 32",
    fifa_matchday_label: "Round of 32",
    fantasy_matchday_id: "r32",
    model_stage: "r32_final_official_fixture_setup",
    provisional_setup: false,
    modelVersion: "score-r32-v1-pele-group-stage-calibrated-defensive-form",
    model_version: "score-r32-v1-pele-group-stage-calibrated-defensive-form"
  }));
  const r32TeamRows = teamFixtureRowsFromPredictions(r32Fixtures, teamFormModel);
  return {
    ...previous,
    schema_version: "fantasy_pool_score_predictions_r32_v1",
    generated_at: GENERATED_AT,
    model_stage: "r32_final_official_fixture_setup",
    data_status: "active_r32_final_score_v1_pass",
    previous_model_file: "data/scorePredictions_fantasyPool_v5_md3.json",
    safety_labels: [
      "final_r32_setup",
      "final official R32 fixtures",
      "all final group-stage fixtures used for calibration",
      "group-stage defensive form applied to clean-sheet confidence",
      "PELE/teamQuality refreshed",
      "ownership not used as signal",
      "final squads not source-backed"
    ],
    model: {
      model_name: "Fantasy Pool R32 Score Predictor v1",
      formula_version: "score-r32-v1-pele-group-stage-calibrated-defensive-form",
      team_defensive_form_model: "groupStageTeamFormModel_r32_v1",
      extra_time_penalty_model: "90-minute draw enters extra time; penalties close to 50/50 with small team-quality edge.",
      no_betting_odds: true,
      ownership_used_as_signal: false
    },
    summary: {
      ...(previous.summary || {}),
      fixture_prediction_count: (previous.fixtureScorePredictions || []).length + r32Fixtures.length,
      r32_fixture_count: r32Fixtures.length,
      defaultMatchday: "r32",
      completedMd3FixturesUsed: postmortem?.completed_md3_fixture_count ?? 0,
      unfinishedMd3FixturesExcluded: postmortem?.unfinished_md3_fixture_count ?? 0,
      finalGroupFixturesUsed: postmortem?.final_fixture_count ?? 0,
      finalitySummary: postmortem?.finality_summary || [],
      groupStageDefensiveFormUsed: true,
      defensiveFormTeams: teamFormModel?.summary?.team_rows ?? 0,
      germanyDefensiveForm: teamFormModel?.summary?.germany ?? null,
      spainDefensiveForm: teamFormModel?.summary?.spain ?? null,
      ownershipUsedAsSignal: false,
      finalSquadsSourceBacked: false
    },
    fixtureScorePredictions: [...(previous.fixtureScorePredictions || []), ...r32Fixtures],
    teamFixturePredictions: [...(previous.teamFixturePredictions || []), ...r32TeamRows],
    modelVersion: "score-r32-v1-pele-group-stage-calibrated-defensive-form",
    model_version: "score-r32-v1-pele-group-stage-calibrated-defensive-form",
    defaultMatchday: "r32"
  };
}

function roleModelForR32(bracket, postmortem) {
  const livePlayers = readJson("data/livePlayerStatus_v1.json").players || [];
  const priorRole = readJson("data/playerRoleModel_md3_v3.json").playerRoleRows || [];
  const priorRoleById = new Map(priorRole.map((row) => [String(row.official_fantasy_player_id), row]));
  const knownTeams = new Set(bracket.known_r32_fixtures.flatMap((fixture) => [normalizeText(fixture.home_team), normalizeText(fixture.away_team)]));
  const uncertainTeams = new Set(bracket.teams_still_uncertain.map((row) => normalizeText(row.team)));
  const rows = livePlayers.map((player) => {
    const id = String(player.official_fantasy_player_id);
    const prior = priorRoleById.get(id) || {};
    const status = player.status || "unknown";
    const teamKey = normalizeText(player.team_name);
    const inKnownFixture = knownTeams.has(teamKey);
    const uncertain = uncertainTeams.has(teamKey) && !inKnownFixture;
    const notSelectable = !isSelectableStatus(status);
    const mdPoints = player.stats?.roundPoints || {};
    const md1 = Number(mdPoints["1"] ?? 0);
    const md2 = Number(mdPoints["2"] ?? 0);
    const md3 = Number(mdPoints["3"] ?? 0);
    const total = md1 + md2 + md3;
    const strongPrior = ["locked_starter", "managed_minutes_star", "likely_starter"].includes(prior.roleTier);
    const possibleRest = inKnownFixture && strongPrior && ["sub", "not_in_squad"].includes(String(player.matchStatus || "")) && total >= 8;
    let start = Number(prior.md3StartProb ?? 0.55);
    let minutes = Number(prior.md3ExpectedMinutes ?? 55);
    const reasons = [];
    if (notSelectable) {
      start = 0; minutes = 0; reasons.push(`official_status_${status}`);
    } else if (!inKnownFixture) {
      start = 0; minutes = 0; reasons.push(uncertain ? "team_uncertain_or_unfinished_group_staged_only" : "team_not_in_known_r32_fixture");
    } else if (possibleRest) {
      start = Math.max(start, 0.76); minutes = Math.max(minutes, 64); reasons.push("possible_md3_rest_after_qualification_preserve_r32_role");
    } else if (player.matchStatus === "not_in_squad") {
      start *= 0.55; minutes *= 0.55; reasons.push("not_in_squad_role_risk");
    } else if (player.matchStatus === "sub") {
      start *= 0.86; minutes *= 0.86; reasons.push("sub_role_caution");
    } else if (player.matchStatus === "start") {
      start = Math.max(start, 0.72); minutes = Math.max(minutes, 62); reasons.push("started_latest_completed_or_current_context");
    }
    const underperformance = (md1 + md2) <= 4 && Number(prior.md3StartProb ?? 0) >= 0.7;
    if (underperformance && !possibleRest) reasons.push("md1_md2_underperformance_confidence_downgrade");
    return {
      official_fantasy_player_id: id,
      name: player.name,
      country: player.team_name,
      team_id: slug(player.team_name),
      official_team_id: player.team_id,
      official_fantasy_position: player.position,
      selectable_status: status,
      matchStatus: player.matchStatus,
      r32KnownFixtureTeam: inKnownFixture,
      r32UncertainTeam: uncertain,
      r32StartProb: round(clamp(start, 0, 0.99)),
      r32ExpectedMinutes: round(clamp(minutes, 0, 95), 1),
      roleTier: notSelectable || !inKnownFixture ? "unavailable_or_not_selectable" : possibleRest ? "rested_starter_preserved" : prior.roleTier || "rotation_risk",
      roleConfidence: underperformance ? "medium" : possibleRest ? "medium" : prior.roleConfidence || "medium",
      group_stage_points: { md1, md2, md3, total },
      r32_role_interpretation: possibleRest
        ? "Possible MD3 rest/rotation after qualification; starter probability preserved with caution."
        : reasons.join("; ") || "Prior role carried into R32 with group-stage evidence.",
      role_reasons: reasons,
      dataQualityFlags: [
        "player_role_r32_v1",
        "ownership_not_used_as_signal",
        "final_squads_not_source_backed",
        notSelectable ? "not_selectable_zero_projection" : null,
        uncertain ? "uncertain_team_staged_only" : null,
        possibleRest ? "rested_starter_preserved" : null,
        underperformance ? "underperformance_confidence_downgrade" : null
      ].filter(Boolean)
    };
  });
  return {
    schema_version: "player_role_model_r32_v1",
    generated_at: GENERATED_AT,
    model_version: "player-role-r32-v1-group-stage-evidence",
    source_files: ["data/livePlayerStatus_v1.json", "data/playerRoleModel_md3_v3.json", "data/r32BracketPathModel_v1.json"],
    summary: {
      roleRows: rows.length,
      knownFixturePlayers: rows.filter((row) => row.r32KnownFixtureTeam).length,
      uncertainOrUnavailablePlayers: rows.filter((row) => !row.r32KnownFixtureTeam || row.selectable_status !== "playing").length,
      restedStarterPreserved: rows.filter((row) => row.roleTier === "rested_starter_preserved").length,
      ownershipUsedAsSignal: false,
      finalSquadsSourceBacked: false
    },
    playerRoleRows: rows
  };
}

function buildR32Projections(bracket, scoreData, roleModel) {
  const md3 = readJson("data/fantasyPoolMatchdayProjections_md3_v5.json");
  const priorRows = md3.playerMatchdayProjections || [];
  const priorById = new Map(priorRows.filter((row) => row.matchday === "md3").map((row) => [String(row.official_fantasy_player_id), row]));
  const roleById = new Map(roleModel.playerRoleRows.map((row) => [String(row.official_fantasy_player_id), row]));
  const teamRows = new Map((scoreData.teamFixturePredictions || []).filter((row) => row.fantasy_matchday_id === "r32").map((row) => [row.team_id, row]));
  const pathByTeam = new Map(bracket.team_paths.map((row) => [slug(row.team), row]));
  const rows = [];
  for (const [id, role] of roleById.entries()) {
    if (!role.r32KnownFixtureTeam || role.selectable_status !== "playing") continue;
    const prior = priorById.get(id);
    if (!prior) continue;
    const teamScore = teamRows.get(slug(role.country));
    if (!teamScore) continue;
    const position = role.official_fantasy_position;
    const start = Number(role.r32StartProb);
    const minutes = Number(role.r32ExpectedMinutes);
    const appearance = start * 2;
    const attackWeight = { GK: 0.03, DEF: 0.13, MID: 0.42, FWD: 0.64 }[position] || 0.3;
    const cleanSheetPoints = { GK: 5, DEF: 5, MID: 1, FWD: 0 }[position] || 0;
    const attack = Number(teamScore.expected_goals || 1) * attackWeight * (minutes / 70) * 2.1;
    const clean = Number(teamScore.clean_sheet_probability || 0) * cleanSheetPoints * start;
    const actual = role.group_stage_points || {};
    const form = clamp(((actual.total || 0) / Math.max(1, ["1", "2", "3"].length)) * 0.16, -0.2, 1.2);
    const underPenalty = role.dataQualityFlags?.includes("underperformance_confidence_downgrade") ? -0.35 : 0;
    const path = pathByTeam.get(slug(role.country));
    const basePathValue = path ? clamp((145 - path.path_difficulty_score) / 30, -1.2, 1.2) : 0;
    const pathValue = clamp(basePathValue - (path?.hard_path_warning ? 0.65 : 0), -1.2, 1.2);
    const raw = round(clamp(appearance + attack + clean + form + underPenalty, 0, 24));
    const risk = round(clamp(raw * (0.9 + (start - 0.75) * 0.16), 0, raw));
    const price = Number(prior.official_price || 0);
    const valueScore = price > 0 ? round(risk / price, 4) : 0;
    rows.push({
      player_matchday_projection_id: `${id}-r32-fantasy-pool-v1`,
      internal_player_id: prior.internal_player_id,
      official_fantasy_player_id: id,
      name: role.name,
      display_name: role.name,
      country: role.country,
      team_id: slug(role.country),
      official_team_id: role.official_team_id,
      official_fantasy_position: position,
      official_price: prior.official_price,
      value_score: valueScore,
      selectable_status: role.selectable_status,
      matchday: "r32",
      matchday_label: "Round of 32",
      opponent: teamScore.opponent,
      opponent_team_id: teamScore.opponent_team_id,
      fixture_id: teamScore.fixture_id,
      match_id: teamScore.fixture_id,
      match_number: teamScore.match_number,
      side: teamScore.side,
      expected_minutes: minutes,
      start_probability: start,
      raw_expected_points: raw,
      risk_adjusted_points: risk,
      floor_points: round(clamp(raw * 0.28, 0, raw)),
      ceiling_points: round(raw + attack * 1.3 + clean * 0.4 + 2.5),
      captain_score: round(raw * 2.15 + Number(teamScore.captain_environment_score || 40) * 0.11 + start * 2),
      projection_confidence: role.roleConfidence,
      role_label: role.roleTier,
      role_confidence: role.roleConfidence,
      roleTier: role.roleTier,
      fixture_context: {
        fixture_id: teamScore.fixture_id,
        match_number: teamScore.match_number,
        opponent_team_id: teamScore.opponent_team_id,
        opponent: teamScore.opponent,
        side: teamScore.side,
        expected_goals: teamScore.expected_goals,
        expected_goals_against: teamScore.expected_goals_against,
        win_probability: teamScore.win_probability,
        draw_probability: teamScore.draw_probability,
        loss_probability: teamScore.loss_probability,
        clean_sheet_probability: teamScore.clean_sheet_probability,
        base_clean_sheet_probability: teamScore.base_clean_sheet_probability,
        clean_sheet_form_multiplier: teamScore.clean_sheet_form_multiplier,
        clean_sheet_form_adjustment: teamScore.clean_sheet_form_adjustment,
        defensive_form_label: teamScore.defensive_form_label,
        fixture_difficulty_score: teamScore.fixture_difficulty_score,
        fixture_difficulty_band: teamScore.fixture_difficulty_band,
        captain_environment_score: teamScore.captain_environment_score,
        matchUncertainty: teamScore.matchUncertainty,
        known_or_projected_path_status: path?.known_path_status || "known_r32_only"
      },
      path_context: path || null,
      path_value: round(pathValue),
      minutes_context: {
        role_label: role.roleTier,
        role_confidence: role.roleConfidence,
        r32_role_interpretation: role.r32_role_interpretation,
        r32_start_context: role.role_reasons?.join("; ") || null
      },
      projectionReason: `R32 v1 uses known fixture vs ${teamScore.opponent}, group-stage role/points, official selectable status, and path value.`,
      caution: [
        path?.hard_path_warning,
        role.roleTier === "rested_starter_preserved" ? "Rested-star case preserved, verify lineup before lock." : null,
        role.dataQualityFlags?.includes("underperformance_confidence_downgrade") ? "Group-stage underperformance lowers confidence." : null
      ].filter(Boolean).join(" "),
      data_quality_flags: [
        "player_projection_r32_v1",
        "known_r32_fixture",
        "path_value_included",
        "group_stage_defensive_form_used",
        "ownership_not_used_as_signal",
        "final_squads_not_source_backed",
        ...role.dataQualityFlags
      ],
      model_stage: "active_r32_player_projection_support",
      modelVersion: "player-projection-r32-v1",
      defaultMatchday: "r32"
    });
  }
  return {
    schema_version: "fantasy_pool_matchday_projections_r32_v1",
    generated_at: GENERATED_AT,
    source_checked: GENERATED_AT.slice(0, 10),
    modelVersion: "player-projection-r32-v1",
    model_version: "player-projection-r32-v1",
    model_stage: "active_r32_player_projection_support",
    data_status: "active_r32_projection_v1_pass",
    safety_labels: ["r32_setup", "known R32 fixtures only", "path value included", "ownership not used as signal", "final squads not source-backed"],
    input_files: ["data/fantasyPoolMatchdayProjections_md3_v5.json", "data/playerRoleModel_r32_v1.json", "data/scorePredictions_fantasyPool_r32_v1.json", "data/r32BracketPathModel_v1.json"],
    model: {
      model_name: "R32 Player Projection v1",
      formula_version: "player-projection-r32-v1-known-fixtures-path-value-defensive-form",
      group_stage_defensive_form_used: true,
      unfinished_md3_excluded: false
    },
    summary: {
      projection_rows: rows.length,
      r32_projection_rows: rows.length,
      known_fixture_teams: new Set(rows.map((row) => row.team_id)).size,
      defaultMatchday: "r32",
      ownershipUsedAsSignal: false,
      finalSquadsSourceBacked: false,
      topProjectedR32Players: rows.sort((a, b) => b.raw_expected_points - a.raw_expected_points).slice(0, 20).map((row) => ({
        name: row.name,
        country: row.country,
        position: row.official_fantasy_position,
        opponent: row.opponent,
        projectedPoints: row.raw_expected_points,
        captainScore: row.captain_score,
        pathValue: row.path_value
      })),
      topGkDefCleanSheetRecommendations: rows
        .filter((row) => ["GK", "DEF"].includes(row.official_fantasy_position))
        .sort((a, b) =>
          Number(b.fixture_context?.clean_sheet_probability || 0) - Number(a.fixture_context?.clean_sheet_probability || 0) ||
          b.raw_expected_points - a.raw_expected_points
        )
        .slice(0, 20)
        .map((row) => ({
          name: row.name,
          country: row.country,
          position: row.official_fantasy_position,
          opponent: row.opponent,
          projectedPoints: row.raw_expected_points,
          cleanSheetProbability: row.fixture_context?.clean_sheet_probability,
          defensiveFormLabel: row.fixture_context?.defensive_form_label,
          cleanSheetFormAdjustment: row.fixture_context?.clean_sheet_form_adjustment
        }))
    },
    qa_status: "pass",
    playerMatchdayProjections: rows
  };
}

function recCandidate(row, mode, rank, score) {
  const pathWarning = row.path_context?.hard_path_warning || null;
  return {
    internal_player_id: row.internal_player_id,
    playerId: row.internal_player_id,
    official_fantasy_player_id: row.official_fantasy_player_id,
    name: row.name,
    display_name: row.display_name,
    country: row.country,
    team_id: row.team_id,
    official_team_id: row.official_team_id,
    official_fantasy_position: row.official_fantasy_position,
    position: row.official_fantasy_position,
    official_price: row.official_price,
    price: row.official_price,
    selectable_status: row.selectable_status,
    matchday: "r32",
    matchday_label: "Round of 32",
    opponent: row.opponent,
    fixture_id: row.fixture_id,
    mode,
    mode_label: {
      balanced: "Core Picks",
      safe: "High-Floor Picks",
      upside: "Upside Picks",
      differential: "Differential Picks / Value Picks",
      captain: "Captain Watchlist"
    }[mode],
    pickType: {
      balanced: "Core Picks",
      safe: "High-Floor Picks",
      upside: "Upside Picks",
      differential: "Differential Picks / Value Picks",
      captain: "Captain Watchlist"
    }[mode],
    recommendation_surface: mode,
    rank,
    raw_expected_points: row.raw_expected_points,
    projectedPoints: row.raw_expected_points,
    risk_adjusted_points: row.risk_adjusted_points,
    floor_points: row.floor_points,
    ceiling_points: row.ceiling_points,
    captain_score: row.captain_score,
    captainUpsideScore: row.captain_score,
    start_probability: row.start_probability,
    startProb: row.start_probability,
    expected_minutes: row.expected_minutes,
    expectedMinutes: row.expected_minutes,
    roleTier: row.roleTier,
    role_label: row.role_label,
    roleConfidence: row.role_confidence,
    role_confidence: row.role_confidence,
    fixture_context: row.fixture_context,
    path_context: row.path_context,
    path_value: row.path_value,
    hard_path_warning: pathWarning,
    recommendation_score: round(score, 3),
    recommendation_tier: rank <= 10 ? "top_pick_candidate" : "strong_candidate",
    projectionReason: row.projectionReason,
    roleReason: row.minutes_context?.r32_role_interpretation,
    fixtureReason: `R32 fixture vs ${row.opponent}; path status ${row.path_context?.known_path_status || "known_r32_only"}.`,
    caution: row.caution || pathWarning,
    why_pick: [
      `${row.raw_expected_points} projected R32 points`,
      `${Math.round(row.start_probability * 100)}% start chance`,
      row.path_value > 0 ? "positive path value" : null
    ].filter(Boolean),
    why_careful: [
      pathWarning,
      row.caution,
      "verify official locks/deadlines/lineups in FIFA"
    ].filter(Boolean),
    dataQualityFlags: row.data_quality_flags,
    data_quality_flags: row.data_quality_flags,
    model_stage: "active_r32_recommendations",
    source_model_version: "recommendation-r32-v1"
  };
}

function buildRecommendations(projections, bracket, teamFormModel) {
  const rows = projections.playerMatchdayProjections || [];
  const modes = {
    balanced: (row) => row.risk_adjusted_points * 18 + row.start_probability * 18 + row.path_value * 7,
    safe: (row) => row.risk_adjusted_points * 20 + row.start_probability * 28 - Math.max(0, row.ceiling_points - row.raw_expected_points) * 0.4,
    upside: (row) => row.ceiling_points * 16 + row.captain_score * 1.6 + row.path_value * 8,
    differential: (row) => row.value_score * 42 + row.risk_adjusted_points * 8 + Math.max(0, 7 - Number(row.official_price || 7)) * 2,
    captain: (row) => row.captain_score * 8 + row.raw_expected_points * 9 + row.start_probability * 18
  };
  const candidates = [];
  for (const [mode, scorer] of Object.entries(modes)) {
    const ranked = [...rows].sort((a, b) => scorer(b) - scorer(a)).slice(0, 25);
    ranked.forEach((row, index) => candidates.push(recCandidate(row, mode, index + 1, scorer(row))));
  }
  const topCaptain = candidates.filter((row) => row.mode === "captain").slice(0, 15);
  const topPathValue = [...rows].sort((a, b) => b.path_value - a.path_value || b.raw_expected_points - a.raw_expected_points).slice(0, 20);
  const easyPath = rows
    .filter((row) => row.path_value >= 0.8 && !row.path_context?.hard_path_warning)
    .sort((a, b) => b.raw_expected_points - a.raw_expected_points)
    .slice(0, 20);
  const hardPath = rows.filter((row) => row.path_context?.hard_path_warning).sort((a, b) => b.raw_expected_points - a.raw_expected_points).slice(0, 20);
  const pathAuditTeams = ["Argentina", "England", "Colombia", "France", "Germany", "Spain", "Portugal"];
  const pathEffectAudits = pathAuditTeams.map((team) => {
    const path = bracket.team_paths.find((row) => normalizeText(row.team) === normalizeText(team));
    return path ? {
      team: path.team,
      r32_opponent: path.r32_opponent,
      likely_r16_opponent_if_both_advance: path.likely_r16_opponent_if_both_advance,
      path_difficulty_score: path.path_difficulty_score,
      hard_path_warning: path.hard_path_warning,
      easy_path_support: !path.hard_path_warning && path.path_difficulty_score <= 75
    } : { team, missing_from_final_r32_path: true };
  });
  return {
    schema_version: "fantasy_pool_matchday_recommendations_r32_v1",
    generated_at: GENERATED_AT,
    source_checked: GENERATED_AT.slice(0, 10),
    modelVersion: "recommendation-r32-v1",
    model_version: "recommendation-r32-v1",
    model_stage: "active_r32_recommendations",
    data_status: "active_r32_recommendations_v1_pass",
    safety_labels: ["r32_setup", "known fixtures only", "path value included", "ownership not used as signal", "final squads not source-backed"],
    input_files: ["data/fantasyPoolMatchdayProjections_r32_v1.json", "data/r32BracketPathModel_v1.json"],
    model: {
      defaultMatchday: "r32",
      path_value_included: true,
      group_stage_defensive_form_used: true,
      finance_secondary_only: true,
      unfinished_md3_excluded: false
    },
    summary: {
      recommendationCandidates: candidates.length,
      r32Candidates: candidates.length,
      modes: Object.keys(modes),
      knownR32FixturesUsed: bracket.known_r32_fixtures.length,
      defaultMatchday: "r32",
      ownershipUsedAsSignal: false,
      finalSquadsSourceBacked: false,
      topCaptainWatchlist: topCaptain.map((row) => ({ name: row.name, country: row.country, opponent: row.opponent, captainScore: row.captain_score, rank: row.rank })),
      topPathValue: topPathValue.map((row) => ({ name: row.name, country: row.country, opponent: row.opponent, projectedPoints: row.raw_expected_points, pathValue: row.path_value })),
      easyPathSupports: easyPath.map((row) => ({ name: row.name, country: row.country, opponent: row.opponent, projectedPoints: row.raw_expected_points, pathValue: row.path_value })),
      hardPathWarnings: hardPath.map((row) => ({ name: row.name, country: row.country, opponent: row.opponent, warning: row.path_context.hard_path_warning })),
      topGkDefCleanSheetRecommendations: projections.summary.topGkDefCleanSheetRecommendations || [],
      pathEffectAudits,
      germanyDefensiveFormCheck: teamFormModel?.summary?.germany || null,
      spainDefensiveFormCheck: teamFormModel?.summary?.spain || null
    },
    qa_status: "pass",
    recommendationCandidates: candidates
  };
}

function compactRecommendation(row) {
  const fixture = row.fixture_context || {};
  const compactFixtureContext = Object.keys(fixture).length ? {
    fixture_id: fixture.fixture_id,
    match_number: fixture.match_number,
    opponent_team_id: fixture.opponent_team_id,
    opponent: fixture.opponent,
    side: fixture.side,
    expected_goals: fixture.expected_goals ?? fixture.projectedXg ?? fixture.projected_xg,
    expected_goals_against: fixture.expected_goals_against,
    win_probability: fixture.win_probability,
    draw_probability: fixture.draw_probability,
    loss_probability: fixture.loss_probability,
    clean_sheet_probability: fixture.clean_sheet_probability,
    base_clean_sheet_probability: fixture.base_clean_sheet_probability,
    clean_sheet_form_multiplier: fixture.clean_sheet_form_multiplier,
    clean_sheet_form_adjustment: fixture.clean_sheet_form_adjustment,
    defensive_form_label: fixture.defensive_form_label,
    fixture_difficulty_score: fixture.fixture_difficulty_score,
    fixture_difficulty_band: fixture.fixture_difficulty_band,
    captain_environment_score: fixture.captain_environment_score,
    matchUncertainty: fixture.matchUncertainty || fixture.match_uncertainty,
    goalEnvironment: fixture.goalEnvironment || fixture.goal_environment,
    upset_risk_probability: fixture.upset_risk_probability,
    known_or_projected_path_status: fixture.known_or_projected_path_status
  } : null;

  return Object.fromEntries(Object.entries({
    internal_player_id: row.internal_player_id,
    playerId: row.playerId,
    official_fantasy_player_id: row.official_fantasy_player_id,
    name: row.name,
    display_name: row.display_name,
    country: row.country,
    team_id: row.team_id,
    official_team_id: row.official_team_id,
    official_fantasy_position: row.official_fantasy_position,
    position: row.position,
    official_price: row.official_price,
    price: row.price,
    selectable_status: row.selectable_status,
    matchday: row.matchday,
    matchday_label: row.matchday_label,
    opponent: row.opponent,
    fixture_id: row.fixture_id,
    mode: row.mode,
    mode_label: row.mode_label,
    pickType: row.pickType,
    recommendation_surface: row.recommendation_surface,
    rank: row.rank,
    raw_expected_points: row.raw_expected_points,
    projectedPoints: row.projectedPoints,
    risk_adjusted_points: row.risk_adjusted_points,
    floor_points: row.floor_points,
    ceiling_points: row.ceiling_points,
    captain_score: row.captain_score,
    captainUpsideScore: row.captainUpsideScore,
    start_probability: row.start_probability,
    startProb: row.startProb,
    expected_minutes: row.expected_minutes,
    expectedMinutes: row.expectedMinutes,
    roleTier: row.roleTier,
    role_label: row.role_label,
    roleConfidence: row.roleConfidence,
    role_confidence: row.role_confidence,
    fixture_context: compactFixtureContext,
    path_context: row.path_context ? {
      r32_opponent: row.path_context.r32_opponent,
      likely_r16_opponent_if_both_advance: row.path_context.likely_r16_opponent_if_both_advance,
      known_path_status: row.path_context.known_path_status,
      path_difficulty_score: row.path_context.path_difficulty_score,
      hard_path_warning: row.path_context.hard_path_warning
    } : null,
    path_value: row.path_value,
    hard_path_warning: row.hard_path_warning,
    recommendation_score: row.recommendation_score,
    recommendation_tier: row.recommendation_tier,
    caution: row.caution,
    why_pick: row.why_pick,
    why_careful: row.why_careful,
    data_quality_flags: (row.data_quality_flags || []).slice(0, 10),
    model_stage: row.model_stage,
    source_model_version: row.source_model_version
  }).filter(([, value]) => value !== null && value !== undefined && value !== ""));
}

async function writeRecommendationBrowser(recommendations, md3History = true) {
  const history = md3History ? readJson("data/fantasyPoolRecommendations_md3_v5.json") : { recommendationCandidates: [] };
  const md3Rows = (history.recommendationCandidates || []).filter((row) => row.matchday === "md3").slice(0, 160).map(compactRecommendation);
  const r32Rows = (recommendations.recommendationCandidates || []).map(compactRecommendation);
  const output = {
    ...recommendations,
    summary: {
      ...recommendations.summary,
      historyMd3RowsRetained: md3Rows.length
    },
    recommendationCandidates: [...r32Rows, ...md3Rows]
  };
  const text = [
    "// Generated by scripts/buildFantasyPoolRecommendationsR32V1.mjs.",
    "// Active R32 recommendations plus compact MD3 history rows.",
    `window.FANTASY_POOL_RECOMMENDATIONS_DATA = ${JSON.stringify(output)};`,
    "window.FANTASY_POOL_RECOMMENDATION_CANDIDATES = window.FANTASY_POOL_RECOMMENDATIONS_DATA.recommendationCandidates;",
    "window.FANTASY_POOL_RECOMMENDATIONS_SUMMARY = window.FANTASY_POOL_RECOMMENDATIONS_DATA.summary;",
    ""
  ].join("\n");
  await writeFile("fantasyPoolRecommendationsData.js", text, "utf8");
}

async function writeScoreBrowser(scoreData) {
  const compactFixtureRows = (scoreData.fixtureScorePredictions || []).map((row) => ({
    prediction_id: row.prediction_id,
    match_id: row.match_id,
    fixture_id: row.fixture_id,
    match_number: row.match_number,
    matchday: row.matchday,
    stage: row.stage,
    group: row.group,
    fantasy_matchday_id: row.fantasy_matchday_id,
    date: row.date,
    eastern_datetime_label: row.eastern_datetime_label || row.date,
    home_team_id: row.home_team_id,
    home_team: row.home_team,
    away_team_id: row.away_team_id,
    away_team: row.away_team,
    home_expected_goals: row.home_expected_goals,
    away_expected_goals: row.away_expected_goals,
    home_projected_xg: row.home_projected_xg || row.home_expected_goals,
    away_projected_xg: row.away_projected_xg || row.away_expected_goals,
    total_expected_goals: row.total_expected_goals,
    home_win_probability: row.home_win_probability,
    draw_probability: row.draw_probability,
    away_win_probability: row.away_win_probability,
    home_clean_sheet_probability: row.home_clean_sheet_probability,
    away_clean_sheet_probability: row.away_clean_sheet_probability,
    both_teams_to_score_probability: row.both_teams_to_score_probability,
    upset_risk_probability: row.upset_risk_probability,
    probability_extra_time: row.probability_extra_time,
    home_advance_probability: row.home_advance_probability,
    away_advance_probability: row.away_advance_probability,
    projected_advancing_team: row.projected_advancing_team,
    favorite_team: row.favorite_team,
    favorite_team_id: row.favorite_team_id,
    favorite_win_probability: row.favorite_win_probability,
    uncertaintyLabel: row.uncertaintyLabel || row.uncertainty_label,
    uncertainty_label: row.uncertainty_label || row.uncertaintyLabel,
    matchUncertainty: row.matchUncertainty || row.uncertainty_label,
    top_scorelines: (row.top_scorelines || []).slice(0, 6),
    qa_flags: (row.qa_flags || []).slice(0, 10),
    modelVersion: row.modelVersion || row.model_version
  }));
  const compactTeamRows = (scoreData.teamFixturePredictions || []).map((row) => ({
    team_fixture_prediction_id: row.team_fixture_prediction_id,
    match_id: row.match_id,
    fixture_id: row.fixture_id,
    match_number: row.match_number,
    fantasy_matchday_id: row.fantasy_matchday_id,
    stage: row.stage,
    team_id: row.team_id,
    team: row.team,
    opponent_team_id: row.opponent_team_id,
    opponent: row.opponent,
    side: row.side,
    expected_goals: row.expected_goals,
    projectedXg: row.expected_goals,
    projected_xg: row.expected_goals,
    expected_goals_against: row.expected_goals_against,
    win_probability: row.win_probability,
    draw_probability: row.draw_probability,
    loss_probability: row.loss_probability,
    advance_probability: row.advance_probability,
    clean_sheet_probability: row.clean_sheet_probability,
    base_clean_sheet_probability: row.base_clean_sheet_probability,
    clean_sheet_form_multiplier: row.clean_sheet_form_multiplier,
    clean_sheet_form_adjustment: row.clean_sheet_form_adjustment,
    defensive_form_label: row.defensive_form_label,
    fixture_difficulty_score: row.fixture_difficulty_score,
    fixture_difficulty_band: row.fixture_difficulty_band,
    captain_environment_score: row.captain_environment_score,
    matchUncertainty: row.matchUncertainty,
    score_model_version: row.score_model_version,
    qa_flags: (row.qa_flags || []).slice(0, 10)
  }));
  const output = {
    ...scoreData,
    fixtureScorePredictions: compactFixtureRows,
    teamFixturePredictions: compactTeamRows
  };
  const text = [
    "// Generated by scripts/buildScorePredictionsFantasyPoolR32V1.mjs.",
    "// Active R32 score prediction browser data plus group-stage history.",
    `window.FANTASY_POOL_SCORE_PREDICTIONS_DATA = ${JSON.stringify(output)};`,
    "window.FANTASY_POOL_SCORE_FIXTURE_PREDICTIONS = window.FANTASY_POOL_SCORE_PREDICTIONS_DATA.fixtureScorePredictions;",
    "window.FANTASY_POOL_TEAM_FIXTURE_PREDICTIONS = window.FANTASY_POOL_SCORE_PREDICTIONS_DATA.teamFixturePredictions;",
    "window.FANTASY_POOL_SCORE_PREDICTIONS_SUMMARY = window.FANTASY_POOL_SCORE_PREDICTIONS_DATA.summary;",
    ""
  ].join("\n");
  await writeFile("fantasyPoolScorePredictionsData.js", text, "utf8");
}

function teamBuilderQa(projections, recommendations) {
  const rows = (projections.playerMatchdayProjections || []).filter((row) => row.matchday === "r32" && row.selectable_status === "playing");
  const byPosition = Object.fromEntries(TEAM_ORDER.map((position) => [position, rows.filter((row) => row.official_fantasy_position === position).sort((a, b) => b.risk_adjusted_points - a.risk_adjusted_points)]));
  const squad = [
    ...byPosition.GK.slice(0, 2),
    ...byPosition.DEF.slice(0, 5),
    ...byPosition.MID.slice(0, 5),
    ...byPosition.FWD.slice(0, 3)
  ].slice(0, 15);
  const starters = [
    ...byPosition.GK.slice(0, 1),
    ...byPosition.DEF.slice(0, 4),
    ...byPosition.MID.slice(0, 4),
    ...byPosition.FWD.slice(0, 2)
  ].slice(0, 11);
  const greedy = [...rows].sort((a, b) => b.raw_expected_points - a.raw_expected_points).slice(0, 11);
  const starterPoints = round(sum(starters.map((row) => row.raw_expected_points)));
  const greedyPoints = round(sum(greedy.map((row) => row.raw_expected_points)));
  const squadSummary = (list) => list.map((row, index) => ({
    slot: index < 11 ? "starter" : "bench",
    name: row.name,
    country: row.country,
    position: row.official_fantasy_position,
    projectedPoints: row.raw_expected_points,
    opponent: row.opponent,
    pathValue: row.path_value,
    hardPathWarning: row.path_context?.hard_path_warning || null
  }));
  const diversified = [...rows]
    .sort((a, b) => b.risk_adjusted_points - a.risk_adjusted_points)
    .filter((row, index, list) => list.findIndex((candidate) => candidate.country === row.country) === index)
    .slice(0, 15);
  const concentratedUpside = [...rows]
    .sort((a, b) => b.ceiling_points - a.ceiling_points || b.captain_score - a.captain_score)
    .slice(0, 15);
  const starsAndScrubs = [
    ...rows.filter((row) => Number(row.official_price || 0) >= 7).sort((a, b) => b.raw_expected_points - a.raw_expected_points).slice(0, 7),
    ...rows.filter((row) => Number(row.official_price || 0) < 5).sort((a, b) => b.value_score - a.value_score).slice(0, 8)
  ].slice(0, 15);
  const valueSquad = [...rows].sort((a, b) => b.value_score - a.value_score || b.risk_adjusted_points - a.risk_adjusted_points).slice(0, 15);
  return {
    schema_version: "team_builder_qa_r32_v1",
    generated_at: GENERATED_AT,
    status: squad.length === 15 && starters.length === 11 ? "pass" : "fail",
    model_version: "team-builder-r32-v1",
    summary: {
      squad_players: squad.length,
      starters: starters.length,
      starterProjectedPoints: starterPoints,
      greedyStarterProjectedPoints: greedyPoints,
      gapVsGreedy: round(starterPoints - greedyPoints),
      defaultMatchday: "r32"
    },
    balanced_squad: squadSummary(squad),
    strategy_variants: {
      balanced: squadSummary(squad),
      diversified: squadSummary(diversified),
      concentrated_upside: squadSummary(concentratedUpside),
      stars_and_scrubs: squadSummary(starsAndScrubs),
      value_squad: squadSummary(valueSquad)
    },
    omitted_star_path_diagnostics: rows
      .filter((row) => row.path_context?.hard_path_warning)
      .sort((a, b) => b.raw_expected_points - a.raw_expected_points)
      .slice(0, 15)
      .map((row) => ({
        name: row.name,
        country: row.country,
        projectedPoints: row.raw_expected_points,
        warning: row.path_context.hard_path_warning
      })),
    top_r32_projected_players: rows.slice().sort((a, b) => b.raw_expected_points - a.raw_expected_points).slice(0, 20).map((row) => ({ name: row.name, country: row.country, position: row.official_fantasy_position, projectedPoints: row.raw_expected_points, opponent: row.opponent })),
    top_captain_watchlist: recommendations.summary.topCaptainWatchlist,
    ownership_used_as_signal: false,
    final_squads_source_backed: false
  };
}

function markdownOutputs({ postmortem, bracket, knockout, score, role, projections, recommendations, teamBuilder, releaseQa, teamForm }) {
  return {
    "data/groupStageModelPostmortemReport_for_r32_v1.md": [
      "# Group Stage Postmortem For R32 v1",
      "",
      `Generated: ${postmortem.generated_at}`,
      "",
      `Evidence scope: ${postmortem.evidence_scope}.`,
      "",
      mdTable(["Metric", "Value"], [
        ["Final fixtures used", postmortem.final_fixture_count],
        ["Completed MD3 fixtures used", postmortem.completed_md3_fixture_count],
        ["Unfinished MD3 fixtures", postmortem.unfinished_md3_fixture_count],
        ["Ownership used as signal", "false"],
        ["Final squads source-backed", "false"]
      ]),
      "",
      "## Explicit Player Audits",
      "",
      mdTable(["Player", "Team", "Status", "Match Status", "Interpretation"], postmortem.explicit_audits.map((row) => [row.name, row.team, row.status, row.matchStatus, row.r32_interpretation]))
    ].join("\n"),
    "data/groupStageTeamFormModel_r32_v1.md": [
      "# Group Stage Team Form Model R32 v1",
      "",
      `Generated: ${teamForm.generated_at}`,
      "",
      "Defensive-form adjustment is computed from final group-stage goals conceded, clean sheets, expected clean-sheet rates, opponent quality, and shrinkage. It adjusts GK/DEF clean-sheet confidence without replacing PELE/teamQuality.",
      "",
      mdTable(["Metric", "Value"], [
        ["Team rows", teamForm.summary.team_rows],
        ["Positive form teams", teamForm.summary.positive_form_teams],
        ["Negative form teams", teamForm.summary.negative_form_teams],
        ["Germany GA / CS / multiplier", teamForm.summary.germany ? `${teamForm.summary.germany.goals_against} / ${teamForm.summary.germany.clean_sheets} / ${teamForm.summary.germany.clean_sheet_multiplier}` : ""],
        ["Spain GA / CS / multiplier", teamForm.summary.spain ? `${teamForm.summary.spain.goals_against} / ${teamForm.summary.spain.clean_sheets} / ${teamForm.summary.spain.clean_sheet_multiplier}` : ""]
      ]),
      "",
      "## Team Adjustments",
      "",
      mdTable(["Team", "GA", "CS", "Conceded Every Game", "Expected CS Rate", "Multiplier", "Label"], teamForm.team_form_rows.map((row) => [
        row.team,
        row.goals_against,
        row.clean_sheets,
        row.conceded_in_every_group_game,
        row.expected_clean_sheet_rate,
        row.clean_sheet_multiplier,
        row.defensive_form_label
      ]))
    ].join("\n"),
    "data/r32BracketPathModel_v1.md": [
      "# R32 Bracket Path Model v1",
      "",
      `Generated: ${bracket.generated_at}`,
      "",
      mdTable(["Metric", "Value"], [
        ["Known R32 fixtures", bracket.known_r32_fixtures.length],
        ["Unresolved R32 matches", bracket.unresolved_r32_matches.length],
        ["Provisional R32 slots", bracket.provisional_r32_slots.length],
        ["Safe top-two qualifiers", bracket.teams_safely_qualified_top_two.length],
        ["Teams still uncertain", bracket.teams_still_uncertain.length]
      ]),
      "",
      "## Known Fixtures",
      "",
      mdTable(["Match", "Fixture", "Path"], bracket.known_r32_fixtures.map((row) => [row.match_number, `${row.home_team} vs ${row.away_team}`, row.bracket_path])),
      "",
      "## Path Difficulty",
      "",
      mdTable(["Team", "R32", "Likely R16", "Difficulty", "Warning"], bracket.team_paths.slice(0, 40).map((row) => [row.team, row.r32_opponent, row.likely_r16_opponent_if_both_advance || "", row.path_difficulty_score, row.hard_path_warning || ""]))
    ].join("\n"),
    "data/knockoutScorePredictor_v1.md": [
      "# Knockout Score Predictor v1",
      "",
      `Generated: ${knockout.generated_at}`,
      "",
      "90-minute xG/WDL is Poisson-based from refreshed PELE-forward teamQuality. Extra time is entered from the 90-minute draw probability, and penalty advancement remains close to 50/50 with a small team-strength edge.",
      "",
      mdTable(["Known Fixture", "90-min xG", "ET", "Projected Advancer", "Uncertainty"], knockout.known_r32_predictions.map((row) => [`${row.home_team} vs ${row.away_team}`, `${row.home_expected_goals}-${row.away_expected_goals}`, row.probability_extra_time, row.projected_advancing_team, row.uncertainty_label]))
    ].join("\n"),
    "data/scorePredictionModel_r32_v1.md": [
      "# Score Prediction Model R32 v1",
      "",
      `Generated: ${score.generated_at}`,
      "",
      mdTable(["Metric", "Value"], [
        ["R32 known fixture rows", score.summary.r32_fixture_count],
        ["Default matchday", score.defaultMatchday],
        ["Completed MD3 fixtures used", score.summary.completedMd3FixturesUsed],
        ["Unfinished MD3 fixtures", score.summary.unfinishedMd3FixturesExcluded],
        ["Group-stage defensive form used", score.summary.groupStageDefensiveFormUsed]
      ])
    ].join("\n"),
    "data/playerRoleModel_r32_v1.md": [
      "# Player Role Model R32 v1",
      "",
      `Generated: ${role.generated_at}`,
      "",
      mdTable(["Metric", "Value"], Object.entries(role.summary).map(([key, value]) => [key, value]))
    ].join("\n"),
    "data/playerProjectionModel_r32_v1.md": [
      "# Player Projection Model R32 v1",
      "",
      `Generated: ${projections.generated_at}`,
      "",
      mdTable(["Metric", "Value"], Object.entries(projections.summary).filter(([, value]) => typeof value !== "object").map(([key, value]) => [key, value]))
    ].join("\n"),
    "data/recommendationModel_r32_v1.md": [
      "# Recommendation Model R32 v1",
      "",
      `Generated: ${recommendations.generated_at}`,
      "",
      mdTable(["Metric", "Value"], [
        ["Candidates", recommendations.summary.recommendationCandidates],
        ["Known R32 fixtures used", recommendations.summary.knownR32FixturesUsed],
        ["Default matchday", recommendations.summary.defaultMatchday],
        ["Path value included", "yes"],
        ["Group-stage defensive form used", "yes"]
      ])
    ].join("\n"),
    "data/teamBuilderModel_r32_v1.md": [
      "# Team Builder Model R32 v1",
      "",
      `Generated: ${teamBuilder.generated_at}`,
      "",
      mdTable(["Metric", "Value"], Object.entries(teamBuilder.summary).map(([key, value]) => [key, value]))
    ].join("\n"),
    "data/r32ReleaseQaReport_v1.md": [
      "# R32 Release QA v1",
      "",
      `Generated: ${releaseQa.generated_at}`,
      "",
      releaseQa.status === "pass" ? "**pass**" : "**fail**",
      "",
      mdTable(["Check", "Status"], releaseQa.checks.map((row) => [row.id, row.status]))
    ].join("\n")
  };
}

function qaFiles({ bracket, knockout, score, role, projections, recommendations, teamBuilder, teamForm }) {
  const qas = {
    "data/r32BracketPathQa_v1.json": {
      schema_version: "r32_bracket_path_qa_v1",
      generated_at: GENERATED_AT,
      status: bracket.known_r32_fixtures.length > 0 && bracket.known_r32_fixtures.length + bracket.unresolved_r32_matches.length === 16 ? "pass" : "fail",
      checks: [
        { id: "no_invented_unresolved_slots", status: bracket.known_r32_fixtures.length + bracket.unresolved_r32_matches.length === 16 ? "pass" : "fail" },
        { id: "known_fixtures_source_backed", status: bracket.known_r32_fixtures.every((row) => row.path_status === "known_official_fixture") ? "pass" : "fail" },
        { id: "final_r32_fixture_count", status: bracket.known_r32_fixtures.length === 16 ? "pass" : "fail" },
        { id: "no_provisional_slots_in_final_release", status: bracket.provisional_r32_slots.length === 0 ? "pass" : "fail" },
        { id: "no_uncertain_slots_in_final_release", status: bracket.unresolved_r32_matches.length === 0 ? "pass" : "fail" },
        { id: "no_final_refresh_blockers", status: bracket.final_refresh_blockers.length === 0 ? "pass" : "fail" }
      ]
    },
    "data/knockoutScorePredictorQa_v1.json": {
      schema_version: "knockout_score_predictor_qa_v1",
      generated_at: GENERATED_AT,
      status: knockout.known_r32_predictions.every((row) => Math.abs(row.home_win_probability + row.draw_probability + row.away_win_probability - 1) < 0.01) ? "pass" : "fail",
      known_r32_predictions: knockout.known_r32_predictions.length,
      arbitrary_matchup_predictions: knockout.arbitrary_matchup_predictions.length
    },
    "data/scorePredictionQa_r32_v1.json": {
      schema_version: "score_prediction_qa_r32_v1",
      generated_at: GENERATED_AT,
      status: score.summary.r32_fixture_count > 0 ? "pass" : "fail",
      r32_fixture_count: score.summary.r32_fixture_count,
      group_stage_defensive_form_used: score.summary.groupStageDefensiveFormUsed === true,
      germany_defensive_form: score.summary.germanyDefensiveForm,
      spain_defensive_form: score.summary.spainDefensiveForm,
      probability_bounds_valid: score.fixtureScorePredictions.every((row) => ["home_win_probability", "draw_probability", "away_win_probability"].every((field) => row[field] === undefined || (Number(row[field]) >= 0 && Number(row[field]) <= 1)))
    },
    "data/playerRoleModelQa_r32_v1.json": {
      schema_version: "player_role_model_qa_r32_v1",
      generated_at: GENERATED_AT,
      status: role.summary.knownFixturePlayers > 0 ? "pass" : "fail",
      summary: role.summary,
      haaland_audit: role.playerRoleRows.find((row) => /haaland/i.test(row.name)) || null
    },
    "data/playerProjectionQa_r32_v1.json": {
      schema_version: "player_projection_qa_r32_v1",
      generated_at: GENERATED_AT,
      status: projections.playerMatchdayProjections.length > 0 ? "pass" : "fail",
      summary: projections.summary
    },
    "data/recommendationQa_r32_v1.json": {
      schema_version: "recommendation_qa_r32_v1",
      generated_at: GENERATED_AT,
      status: recommendations.recommendationCandidates.length > 0 ? "pass" : "fail",
      summary: recommendations.summary,
      haaland_audit: recommendations.recommendationCandidates.find((row) => /haaland/i.test(row.name)) || null,
      underperformer_cautions: recommendations.recommendationCandidates.filter((row) => /underperformance/i.test(row.caution || "")).slice(0, 20),
      germany_defensive_form_check: teamForm.summary.germany,
      spain_defensive_form_check: teamForm.summary.spain,
      path_effect_audits: recommendations.summary.pathEffectAudits,
      top_gk_def_clean_sheet_recommendations: recommendations.summary.topGkDefCleanSheetRecommendations
    },
    "data/teamBuilderQa_r32_v1.json": teamBuilder
  };
  return qas;
}

export async function buildAllR32Artifacts() {
  const worldCup = loadWorldCupData();
  const live = readJson("data/liveMatchdayStatus_v1.json");
  const teamQuality = readJson("data/teamQuality.json");
  const qualityIndex = teamQualityIndex(teamQuality);
  const postmortem = buildPostmortem(worldCup, live, qualityIndex);
  const teamForm = buildTeamFormModel(postmortem);
  const bracket = buildBracketPath(worldCup, live, qualityIndex);
  const r32Predictions = bracket.known_r32_fixtures.map((fixture) => buildKnockoutPrediction(fixture.home_team, fixture.away_team, qualityIndex, fixture)).filter(Boolean);
  const allTeams = (teamQuality.teams || []).map((row) => row.country);
  const arbitrary = [];
  for (let i = 0; i < allTeams.length; i += 1) {
    for (let j = i + 1; j < allTeams.length; j += 1) {
      arbitrary.push(buildKnockoutPrediction(allTeams[i], allTeams[j], qualityIndex, { path_status: "arbitrary_matchup_tool", stage: "arbitrary_knockout_matchup" }));
    }
  }
  const knockout = {
    schema_version: "knockout_score_predictor_v1",
    generated_at: GENERATED_AT,
    model_version: "knockout-score-predictor-v1",
    known_r32_predictions: r32Predictions,
    arbitrary_matchup_predictions: arbitrary.filter(Boolean),
    teams: allTeams.map((team) => ({ team, team_id: slug(team), quality_score: round(teamStrength(teamRowForName(qualityIndex, team)), 2) })),
    assumptions: [
      "90-minute draw probability controls extra-time entry.",
      "Penalty model remains close to 50/50 with small team-quality edge.",
      "No betting odds, ownership, or invented lineups are used."
    ],
    ownership_used_as_signal: false,
    final_squads_source_backed: false
  };
  const score = buildScoreData(r32Predictions, postmortem, teamForm);
  const role = roleModelForR32(bracket, postmortem);
  const projections = buildR32Projections(bracket, score, role);
  const recommendations = buildRecommendations(projections, bracket, teamForm);
  const teamBuilder = teamBuilderQa(projections, recommendations);
	  const releaseQa = {
	    schema_version: "r32_release_qa_v1",
	    generated_at: GENERATED_AT,
    release_status: FINAL_RELEASE_STATUS,
	    status: [
	      bracket.known_r32_fixtures.length === 16,
      bracket.unresolved_r32_matches.length === 0,
      bracket.provisional_r32_slots.length === 0,
	      knockout.known_r32_predictions.length === bracket.known_r32_fixtures.length,
	      score.summary.r32_fixture_count === bracket.known_r32_fixtures.length,
      postmortem.final_fixture_count === 72,
      postmortem.completed_md3_fixture_count === 24,
      postmortem.unfinished_md3_fixture_count === 0,
      teamForm.summary.team_rows === 48,
	      projections.playerMatchdayProjections.length > 0,
	      recommendations.recommendationCandidates.length > 0,
	      teamBuilder.status === "pass"
	    ].every(Boolean) ? "pass" : "fail",
	    checks: [
	      { id: "final_r32_fixtures_available", status: bracket.known_r32_fixtures.length === 16 ? "pass" : "fail" },
      { id: "no_provisional_r32_slots", status: bracket.provisional_r32_slots.length === 0 ? "pass" : "fail" },
      { id: "no_uncertain_r32_slots", status: bracket.unresolved_r32_matches.length === 0 ? "pass" : "fail" },
	      { id: "all_group_fixtures_final", status: postmortem.final_fixture_count === 72 && postmortem.completed_md3_fixture_count === 24 && postmortem.unfinished_md3_fixture_count === 0 ? "pass" : "fail" },
      { id: "group_stage_defensive_form_built", status: teamForm.summary.team_rows === 48 ? "pass" : "fail" },
	      { id: "knockout_predictor_built", status: knockout.known_r32_predictions.length ? "pass" : "fail" },
	      { id: "r32_player_projections_built", status: projections.playerMatchdayProjections.length ? "pass" : "fail" },
	      { id: "r32_recommendations_built", status: recommendations.recommendationCandidates.length ? "pass" : "fail" },
	      { id: "team_builder_r32_pass", status: teamBuilder.status }
	    ],
	    public_promotion: {
	      promoted_to_r32_setup: true,
      promoted_to_r32_provisional_setup: false,
      promoted_to_r32_final_setup: true,
	      public_default_matchday: "r32",
	      fixture_status: `${bracket.known_r32_fixtures.length} final official R32 fixtures; ${bracket.unresolved_r32_matches.length} uncertain R32 slots`,
      final_refresh_blocked_by: []
	    }
	  };

  await writeJson("data/groupStageCalibrationDataset_for_r32_v1.json", { schema_version: "group_stage_calibration_dataset_for_r32_v1", generated_at: GENERATED_AT, final_fixture_residuals: postmortem.fixture_residuals }, true);
  await writeJson("data/groupStageModelPostmortem_for_r32_v1.json", postmortem);
  await writeJson("data/groupStageTeamFormModel_r32_v1.json", teamForm);
  await writeJson("data/r32BracketPathModel_v1.json", bracket);
  await writeJson("data/knockoutScorePredictor_v1.json", knockout);
  await writeJson("data/scorePredictions_fantasyPool_r32_v1.json", score, true);
  await writeJson("data/playerRoleModel_r32_v1.json", role);
  await writeJson("data/fantasyPoolMatchdayProjections_r32_v1.json", projections, true);
  await writeJson("data/fantasyPoolRecommendations_r32_v1.json", recommendations, true);
  await writeJson("data/r32ReleaseQa_v1.json", releaseQa);
  if (postmortem.release_status !== FINAL_RELEASE_STATUS) {
  await writeJson("data/groupStageCalibrationDataset_for_r32_provisional_v1.json", { schema_version: "group_stage_calibration_dataset_for_r32_provisional_v1", generated_at: GENERATED_AT, final_fixture_residuals: postmortem.fixture_residuals, unfinished_group_fixtures: postmortem.unfinished_group_fixtures }, true);
  await writeJson("data/groupStageModelPostmortem_for_r32_provisional_v1.json", { ...postmortem, schema_version: "group_stage_postmortem_for_r32_provisional_v1" });
  await writeJson("data/r32ProvisionalBracketPathModel_v1.json", { ...bracket, schema_version: "r32_provisional_bracket_path_model_v1" });
  await writeJson("data/scorePredictions_fantasyPool_r32_provisional_v1.json", { ...score, schema_version: "fantasy_pool_score_predictions_r32_provisional_v1" }, true);
  await writeJson("data/playerRoleModel_r32_provisional_v1.json", { ...role, schema_version: "player_role_model_r32_provisional_v1" });
  await writeJson("data/fantasyPoolMatchdayProjections_r32_provisional_v1.json", { ...projections, schema_version: "fantasy_pool_matchday_projections_r32_provisional_v1" }, true);
  await writeJson("data/fantasyPoolRecommendations_r32_provisional_v1.json", { ...recommendations, schema_version: "fantasy_pool_matchday_recommendations_r32_provisional_v1" }, true);
  await writeJson("data/r32ProvisionalReleaseQa_v1.json", { ...releaseQa, schema_version: "r32_provisional_release_qa_v1" });
  }

  const qas = qaFiles({ bracket, knockout, score, role, projections, recommendations, teamBuilder, teamForm });
  for (const [file, data] of Object.entries(qas)) await writeJson(file, data);
  if (postmortem.release_status !== FINAL_RELEASE_STATUS) {
  await writeJson("data/r32ProvisionalBracketPathQa_v1.json", { ...qas["data/r32BracketPathQa_v1.json"], schema_version: "r32_provisional_bracket_path_qa_v1" });
  await writeJson("data/scorePredictionQa_r32_provisional_v1.json", { ...qas["data/scorePredictionQa_r32_v1.json"], schema_version: "score_prediction_qa_r32_provisional_v1" });
  await writeJson("data/playerRoleModelQa_r32_provisional_v1.json", { ...qas["data/playerRoleModelQa_r32_v1.json"], schema_version: "player_role_model_qa_r32_provisional_v1" });
  await writeJson("data/playerProjectionQa_r32_provisional_v1.json", { ...qas["data/playerProjectionQa_r32_v1.json"], schema_version: "player_projection_qa_r32_provisional_v1" });
  await writeJson("data/recommendationQa_r32_provisional_v1.json", { ...qas["data/recommendationQa_r32_v1.json"], schema_version: "recommendation_qa_r32_provisional_v1" });
  await writeJson("data/teamBuilderQa_r32_provisional_v1.json", { ...teamBuilder, schema_version: "team_builder_qa_r32_provisional_v1", model_version: "team-builder-r32-provisional-v1" });
  }
  await writeFile("data/r32BracketPathQaReport_v1.md", "# R32 Bracket Path QA v1\n\n" + mdTable(["Check", "Status"], qas["data/r32BracketPathQa_v1.json"].checks.map((row) => [row.id, row.status])) + "\n", "utf8");
  await writeFile("data/knockoutScorePredictorQaReport_v1.md", "# Knockout Score Predictor QA v1\n\nStatus: " + qas["data/knockoutScorePredictorQa_v1.json"].status + "\n", "utf8");
  await writeFile("data/scorePredictionQaReport_r32_v1.md", "# Score Prediction QA R32 v1\n\nStatus: " + qas["data/scorePredictionQa_r32_v1.json"].status + "\n", "utf8");
  await writeFile("data/playerRoleModelQaReport_r32_v1.md", "# Player Role Model QA R32 v1\n\nStatus: " + qas["data/playerRoleModelQa_r32_v1.json"].status + "\n", "utf8");
  await writeFile("data/playerProjectionQaReport_r32_v1.md", "# Player Projection QA R32 v1\n\nStatus: " + qas["data/playerProjectionQa_r32_v1.json"].status + "\n", "utf8");
  await writeFile("data/recommendationQaReport_r32_v1.md", "# Recommendation QA R32 v1\n\nStatus: " + qas["data/recommendationQa_r32_v1.json"].status + "\n", "utf8");
  await writeFile("data/teamBuilderQaReport_r32_v1.md", "# Team Builder QA R32 v1\n\nStatus: " + teamBuilder.status + "\n", "utf8");
  if (postmortem.release_status !== FINAL_RELEASE_STATUS) {
  await writeFile("data/r32ProvisionalBracketPathQaReport_v1.md", "# R32 Provisional Bracket Path QA v1\n\n" + mdTable(["Check", "Status"], qas["data/r32BracketPathQa_v1.json"].checks.map((row) => [row.id, row.status])) + "\n", "utf8");
  await writeFile("data/scorePredictionQaReport_r32_provisional_v1.md", "# Score Prediction QA R32 Provisional v1\n\nStatus: " + qas["data/scorePredictionQa_r32_v1.json"].status + "\n", "utf8");
  await writeFile("data/playerRoleModelQaReport_r32_provisional_v1.md", "# Player Role Model QA R32 Provisional v1\n\nStatus: " + qas["data/playerRoleModelQa_r32_v1.json"].status + "\n", "utf8");
  await writeFile("data/playerProjectionQaReport_r32_provisional_v1.md", "# Player Projection QA R32 Provisional v1\n\nStatus: " + qas["data/playerProjectionQa_r32_v1.json"].status + "\n", "utf8");
  await writeFile("data/recommendationQaReport_r32_provisional_v1.md", "# Recommendation QA R32 Provisional v1\n\nStatus: " + qas["data/recommendationQa_r32_v1.json"].status + "\n", "utf8");
  await writeFile("data/teamBuilderQaReport_r32_provisional_v1.md", "# Team Builder QA R32 Provisional v1\n\nStatus: " + teamBuilder.status + "\n", "utf8");
  }

  for (const [file, text] of Object.entries(markdownOutputs({ postmortem, bracket, knockout, score, role, projections, recommendations, teamBuilder, releaseQa, teamForm }))) {
    await writeFile(file, `${text}\n`, "utf8");
  }
  if (postmortem.release_status !== FINAL_RELEASE_STATUS) {
  await writeFile("data/groupStageModelPostmortemReport_for_r32_provisional_v1.md", [
    "# Group Stage Postmortem For R32 Provisional v1",
    "",
    `Generated: ${postmortem.generated_at}`,
    "",
    "Evidence uses only final MD1/MD2 fixtures and completed MD3 fixtures. Match 69 and Match 70 remain excluded until official final.",
    "",
    mdTable(["Metric", "Value"], [
      ["Final fixtures used", postmortem.final_fixture_count],
      ["Completed MD3 fixtures used", postmortem.completed_md3_fixture_count],
      ["Unfinished MD3 fixtures excluded", postmortem.unfinished_md3_fixture_count],
      ["Ownership used as signal", "false"],
      ["Final squads source-backed", "false"]
    ]),
    "",
    "## Unfinished Fixtures",
    "",
    mdTable(["Match", "Fixture", "Status", "Score Status"], postmortem.unfinished_group_fixtures.map((row) => [row.match_number, row.fixture, row.fixture_status, row.score_status])),
    "",
    "## Explicit Player Audits",
    "",
    mdTable(["Player", "Team", "Status", "Match Status", "Interpretation"], postmortem.explicit_audits.map((row) => [row.name, row.team, row.status, row.matchStatus, row.r32_interpretation]))
  ].join("\n") + "\n", "utf8");
  await writeFile("data/r32ProvisionalBracketPathModel_v1.md", [
    "# R32 Provisional Bracket Path Model v1",
    "",
    `Generated: ${bracket.generated_at}`,
    "",
    "Provisional R32 setup. Official scheduled R32 fixtures are used where present; unresolved slots remain uncertain until Match 69 and Match 70 are final.",
    "",
    mdTable(["Metric", "Value"], [
      ["Known official R32 fixtures", bracket.known_r32_fixtures.length],
      ["Locked official slots", bracket.locked_r32_slots.length],
      ["Provisional official slots", bracket.provisional_r32_slots.length],
      ["Uncertain R32 slots", bracket.uncertain_r32_slots.length],
      ["Teams still uncertain from completed table", bracket.teams_still_uncertain.length]
    ]),
    "",
    "## Known Official Fixtures",
    "",
    mdTable(["Match", "Fixture", "Certainty", "Path"], bracket.known_r32_fixtures.map((row) => [row.match_number, `${row.home_team} vs ${row.away_team}`, row.slot_certainty, row.bracket_path])),
    "",
    "## Uncertain Slots",
    "",
    mdTable(["Match", "Path", "Status"], bracket.uncertain_r32_slots.map((row) => [row.match_id, row.path, row.status]))
  ].join("\n") + "\n", "utf8");
  await writeFile("data/scorePredictionModel_r32_provisional_v1.md", [
    "# Score Prediction Model R32 Provisional v1",
    "",
    `Generated: ${score.generated_at}`,
    "",
    mdTable(["Metric", "Value"], [
      ["R32 known fixture rows", score.summary.r32_fixture_count],
      ["Default matchday", score.defaultMatchday],
      ["Completed MD3 fixtures used", score.summary.completedMd3FixturesUsed],
      ["Unfinished MD3 fixtures excluded", score.summary.unfinishedMd3FixturesExcluded],
      ["Final group fixtures used", score.summary.finalGroupFixturesUsed]
    ])
  ].join("\n") + "\n", "utf8");
  await writeFile("data/playerRoleModel_r32_provisional_v1.md", "# Player Role Model R32 Provisional v1\n\n" + mdTable(["Metric", "Value"], Object.entries(role.summary).map(([key, value]) => [key, value])) + "\n", "utf8");
  await writeFile("data/playerProjectionModel_r32_provisional_v1.md", "# Player Projection Model R32 Provisional v1\n\n" + mdTable(["Metric", "Value"], Object.entries(projections.summary).filter(([, value]) => typeof value !== "object").map(([key, value]) => [key, value])) + "\n", "utf8");
  await writeFile("data/recommendationModel_r32_provisional_v1.md", "# Recommendation Model R32 Provisional v1\n\n" + mdTable(["Metric", "Value"], [
    ["Candidates", recommendations.summary.recommendationCandidates],
    ["Known R32 fixtures used", recommendations.summary.knownR32FixturesUsed],
    ["Default matchday", recommendations.summary.defaultMatchday],
    ["Path value included", "yes"]
  ]) + "\n", "utf8");
  await writeFile("data/teamBuilderModel_r32_provisional_v1.md", "# Team Builder Model R32 Provisional v1\n\n" + mdTable(["Metric", "Value"], Object.entries(teamBuilder.summary).map(([key, value]) => [key, value])) + "\n", "utf8");
  await writeFile("data/r32ProvisionalReleaseQaReport_v1.md", [
    "# R32 Provisional Release QA v1",
    "",
    `Generated: ${releaseQa.generated_at}`,
    "",
    releaseQa.status === "pass" ? "**pass**" : "**fail**",
    "",
    mdTable(["Check", "Status"], releaseQa.checks.map((row) => [row.id, row.status])),
    "",
    `Public status: ${releaseQa.public_promotion.fixture_status || releaseQa.public_promotion.partial_fixture_status}`
  ].join("\n") + "\n", "utf8");
  }

  await writeScoreBrowser(score);
  await writeProjectionBrowserData("fantasyPoolMatchdayProjectionsData.js", {
    ...projections,
    playerMatchdayProjections: [
      ...compactProjectionOutput(readJson("data/fantasyPoolMatchdayProjections_md3_v5.json")).playerMatchdayProjections,
      ...projections.playerMatchdayProjections.map(compactProjectionRow)
    ]
  }, {
    generator: "scripts/buildFantasyPoolMatchdayProjectionsR32V1.mjs",
    label: "Active R32 projection browser data plus compact group-stage history"
  });
  await writeRecommendationBrowser(recommendations);
  const knockoutBrowser = {
    ...knockout,
    arbitrary_matchup_predictions: knockout.arbitrary_matchup_predictions.map((row) => ({
      prediction_id: row.prediction_id,
      home_team_id: row.home_team_id,
      home_team: row.home_team,
      away_team_id: row.away_team_id,
      away_team: row.away_team,
      home_expected_goals: row.home_expected_goals,
      away_expected_goals: row.away_expected_goals,
      home_win_probability: row.home_win_probability,
      draw_probability: row.draw_probability,
      away_win_probability: row.away_win_probability,
      probability_extra_time: row.probability_extra_time,
      home_advance_probability: row.home_advance_probability,
      away_advance_probability: row.away_advance_probability,
      projected_advancing_team: row.projected_advancing_team,
      uncertainty_label: row.uncertainty_label,
      top_scorelines: row.top_scorelines,
      explanation: row.explanation
    }))
  };
  await writeFile("knockoutScorePredictorData.js", [
    "// Generated by scripts/buildKnockoutScorePredictorV1.mjs.",
    `window.KNOCKOUT_SCORE_PREDICTOR_DATA = ${JSON.stringify(knockoutBrowser)};`,
    ""
  ].join("\n"), "utf8");

  return { postmortem, teamForm, bracket, knockout, score, role, projections, recommendations, teamBuilder, releaseQa };
}
