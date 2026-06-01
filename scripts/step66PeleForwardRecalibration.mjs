import { access, copyFile, readFile, writeFile } from "node:fs/promises";

const TODAY = "2026-06-01";
const NOW = new Date().toISOString();

const PATHS = {
  teams: "data/teams.json",
  teamQuality: "data/teamQuality.json",
  teamQualityV0: "data/teamQuality_v0.json",
  teamQualityV1: "data/teamQuality_v1.json",
  fixtures: "data/fixtures.json",
  matchdays: "data/matchdays.json",
  finance: "data/playerFinanceMetrics_v0.json",
  minutes: "data/playerMinutesModel_v0.json",
  playerMatchdayV0: "data/playerMatchdayProjections_v0.json",
  scoreV2: "data/scorePredictions_v2.json",
  scoreQaV2: "data/scorePredictionQa_v2.json",
  scoreQaReportV2: "data/scorePredictionQaReport_v2.md",
  playerMatchdayV2: "data/playerMatchdayProjections_v2.json",
  matchdayRecommendationsV2: "data/matchdayRecommendations_v2.json",
  recommendationQaV2: "data/recommendationQa_v2.json",
  recommendationQaReportV2: "data/recommendationQaReport_v2.md",
  peleJson: "data/peleRatings_v1.json",
  peleRatingsCsv: "data/peleRatingsDatawrapper_4oVop_2026-06-01.csv",
  peleTiltCsv: "data/peleTiltDatawrapper_dxUJw_2026-06-01.csv",
  peleOffenseDefenseCsv: "data/peleOffenseDefenseDatawrapper_DcqkH_2026-06-01.csv",
  scoreBrowser: "scorePredictionsData.js",
  matchdayBrowser: "matchdayProjectionsData.js"
};

const PELE_SOURCES = {
  article: "https://www.natesilver.net/p/pele-international-football-rankings-soccer-ratings-projections",
  methodology: "https://www.natesilver.net/p/pele-methodology",
  ratingsCsv: "https://datawrapper.dwcdn.net/4oVop/19/dataset.csv",
  fifaComparisonCsv: "https://datawrapper.dwcdn.net/4bcIB/1/dataset.csv",
  tiltCsv: "https://datawrapper.dwcdn.net/dxUJw/15/dataset.csv",
  offenseDefenseCsv: "https://datawrapper.dwcdn.net/DcqkH/13/dataset.csv"
};

const VALID_POSITIONS = new Set(["GK", "DEF", "MID", "FWD"]);
const STRATEGIES = [
  "risk_adjusted",
  "safe_floor",
  "upside",
  "attack_heavy",
  "defensive_heavy",
  "very_risky",
  "tail_risk_avoidance",
  "captain"
];

function round(value, digits = 2) {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function num(value) {
  if (value === null || value === undefined || value === "") return null;
  const cleaned = String(value).split("@@")[0].replace(/,/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function titleFromSnake(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function writeJson(path, data) {
  await writeFile(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Fetch failed ${response.status}: ${url}`);
  }
  return response.text();
}

function parseDelimited(text) {
  const clean = text.replace(/^\uFEFF/, "").trim();
  const firstLine = clean.split(/\r?\n/, 1)[0] || "";
  const delimiter = firstLine.includes("\t") ? "\t" : ",";
  const rows = clean.split(/\r?\n/).filter(Boolean).map((line) => parseDelimitedLine(line, delimiter));
  const headers = rows.shift() || [];
  return rows.map((row) => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header.trim()] = row[index] === undefined ? "" : row[index].trim();
    });
    return obj;
  });
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

function minMax(values) {
  const valid = values.filter((value) => Number.isFinite(value));
  return {
    min: Math.min(...valid),
    max: Math.max(...valid)
  };
}

function normalized(value, range, invert = false) {
  if (!Number.isFinite(value) || !Number.isFinite(range.min) || !Number.isFinite(range.max) || range.max === range.min) {
    return null;
  }
  const scaled = ((value - range.min) / (range.max - range.min)) * 100;
  return round(invert ? 100 - scaled : scaled, 2);
}

function weightedAvailable(parts) {
  const valid = parts.filter((part) => Number.isFinite(part.value));
  const weightSum = valid.reduce((sum, part) => sum + part.weight, 0);
  if (!valid.length || weightSum <= 0) return null;
  return valid.reduce((sum, part) => sum + part.value * (part.weight / weightSum), 0);
}

function qualityTier(score) {
  if (score >= 80) return "elite";
  if (score >= 75) return "contender";
  if (score >= 65) return "strong";
  if (score >= 50) return "competitive";
  if (score >= 35) return "outsider";
  return "long_shot";
}

function difficultyBand(score) {
  if (score <= 25) return "very_favorable";
  if (score <= 40) return "favorable";
  if (score <= 60) return "neutral";
  if (score <= 75) return "difficult";
  return "very_difficult";
}

function cleanSheetBand(probability) {
  if (probability >= 0.55) return "strong";
  if (probability >= 0.38) return "good";
  if (probability >= 0.22) return "medium";
  if (probability >= 0.12) return "weak";
  return "poor";
}

function goalEnvironment(totalExpectedGoals) {
  if (totalExpectedGoals >= 2.95) return "high_goal_environment";
  if (totalExpectedGoals >= 2.65) return "medium_high_goal_environment";
  if (totalExpectedGoals >= 2.35) return "medium_goal_environment";
  return "low_goal_environment";
}

function upsetRiskBand(probability) {
  if (probability >= 0.28) return "high";
  if (probability >= 0.20) return "medium_high";
  if (probability >= 0.12) return "medium";
  return "low";
}

function sourceArrayPushUnique(array, value) {
  return [...new Set([...(array || []), value])];
}

function hostVenueCountry(fixture) {
  const city = String(fixture.city || "").toLowerCase();
  if (["mexico city", "guadalajara", "monterrey"].some((name) => city.includes(name))) return "mexico";
  if (["toronto", "vancouver"].some((name) => city.includes(name))) return "canada";
  return "usa";
}

function poisson(k, lambda) {
  let factorial = 1;
  for (let i = 2; i <= k; i += 1) factorial *= i;
  return (Math.E ** -lambda) * (lambda ** k) / factorial;
}

function scoreGrid(homeXg, awayXg, maxGoals = 10) {
  const grid = [];
  let total = 0;
  for (let home = 0; home <= maxGoals; home += 1) {
    for (let away = 0; away <= maxGoals; away += 1) {
      const probability = poisson(home, homeXg) * poisson(away, awayXg);
      total += probability;
      grid.push({ home_goals: home, away_goals: away, probability });
    }
  }

  let homeWin = 0;
  let draw = 0;
  let awayWin = 0;
  let homeCleanSheet = 0;
  let awayCleanSheet = 0;
  let over25 = 0;
  let btts = 0;
  for (const cell of grid) {
    const probability = cell.probability / total;
    if (cell.home_goals > cell.away_goals) homeWin += probability;
    if (cell.home_goals === cell.away_goals) draw += probability;
    if (cell.home_goals < cell.away_goals) awayWin += probability;
    if (cell.away_goals === 0) homeCleanSheet += probability;
    if (cell.home_goals === 0) awayCleanSheet += probability;
    if (cell.home_goals + cell.away_goals >= 3) over25 += probability;
    if (cell.home_goals > 0 && cell.away_goals > 0) btts += probability;
  }

  const topScorelines = grid
    .map((cell) => ({
      scoreline: `${cell.home_goals}-${cell.away_goals}`,
      home_goals: cell.home_goals,
      away_goals: cell.away_goals,
      probability: round(cell.probability / total, 4)
    }))
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 6);

  return {
    homeWin: round(homeWin, 4),
    draw: round(draw, 4),
    awayWin: round(awayWin, 4),
    homeCleanSheet: round(homeCleanSheet, 4),
    awayCleanSheet: round(awayCleanSheet, 4),
    over25: round(over25, 4),
    under25: round(1 - over25, 4),
    btts: round(btts, 4),
    topScorelines
  };
}

function percentileScores(rows, keyFn, targetKey) {
  const values = rows.map((row) => keyFn(row)).filter((value) => Number.isFinite(value));
  const range = minMax(values);
  for (const row of rows) {
    const value = keyFn(row);
    row.strategy_scores_v2[targetKey] = round(normalized(value, range) ?? 0, 2);
  }
}

async function downloadPeleData() {
  const [ratingsText, tiltText, offenseDefenseText] = await Promise.all([
    fetchText(PELE_SOURCES.ratingsCsv),
    fetchText(PELE_SOURCES.tiltCsv),
    fetchText(PELE_SOURCES.offenseDefenseCsv)
  ]);

  await Promise.all([
    writeFile(PATHS.peleRatingsCsv, ratingsText, "utf8"),
    writeFile(PATHS.peleTiltCsv, tiltText, "utf8"),
    writeFile(PATHS.peleOffenseDefenseCsv, offenseDefenseText, "utf8")
  ]);

  const ratingRows = parseDelimited(ratingsText);
  const tiltRows = parseDelimited(tiltText);
  const offenseDefenseRows = parseDelimited(offenseDefenseText);
  const tiltByCode = new Map(tiltRows.map((row) => [row.fifa_code, row]));
  const offenseDefenseByCode = new Map(offenseDefenseRows.map((row) => [row.fifa_code, row]));

  const merged = ratingRows.map((row) => {
    const code = row.fifa_code;
    const tilt = tiltByCode.get(code) || {};
    const offenseDefense = offenseDefenseByCode.get(code) || {};
    return {
      fifa_code: code,
      team: row.team,
      pele_rank: num(row.rank),
      pele_rating: num(row.pele),
      pele_change_1y: num(row.pele_chg_1y),
      tactical_tilt: num(tilt.tactical_tilt),
      personnel_tilt: num(tilt.personnel_tilt),
      total_tilt: num(tilt.total_tilt),
      tilt_label: tilt.tilt_label || null,
      tilt_category: tilt.tilt_cat || null,
      pele_offense_gf: num(offenseDefense.gf),
      pele_defense_ga: num(offenseDefense.ga),
      round_robin_win_pct: num(offenseDefense.w_pct),
      round_robin_loss_pct: num(offenseDefense.l_pct),
      round_robin_draw_pct: num(offenseDefense.d_pct),
      source_ids: ["peleRatings"],
      source_urls: [
        PELE_SOURCES.article,
        PELE_SOURCES.methodology,
        PELE_SOURCES.ratingsCsv,
        PELE_SOURCES.tiltCsv,
        PELE_SOURCES.offenseDefenseCsv
      ]
    };
  });

  const peleData = {
    schema_version: "week6-pele-ratings-v1",
    generated_at: NOW,
    source_checked: TODAY,
    data_status: "downloaded_from_silver_bulletin_datawrapper_csv",
    source_urls: PELE_SOURCES,
    row_count: merged.length,
    fields: {
      pele_rating: "Headline PELE team-quality rating from Silver Bulletin.",
      total_tilt: "Tilt rating from Silver Bulletin; positive means more attacking goal environment and negative means more defensive.",
      pele_offense_gf: "Round-robin projected goals for from the Silver Bulletin offense/defense table.",
      pele_defense_ga: "Round-robin projected goals against from the Silver Bulletin offense/defense table."
    },
    rows: merged
  };
  await writeJson(PATHS.peleJson, peleData);
  return peleData;
}

async function buildTeamQuality(peleData) {
  if (!(await exists(PATHS.teamQualityV0))) {
    await copyFile(PATHS.teamQuality, PATHS.teamQualityV0);
  }
  if (!(await exists(PATHS.teamQualityV1))) {
    await copyFile(PATHS.teamQuality, PATHS.teamQualityV1);
  }

  const oldQuality = await readJson(PATHS.teamQualityV1);
  const teamsJson = await readJson(PATHS.teams);
  const oldById = new Map(oldQuality.teams.map((team) => [team.team_id, team]));
  const peleByCode = new Map(peleData.rows.map((row) => [row.fifa_code, row]));
  const teams = teamsJson.teams.map((team) => {
    const old = oldById.get(team.team_id);
    const pele = peleByCode.get(team.fifa_code);
    if (!old) throw new Error(`Missing old team quality row for ${team.team_id}`);
    if (!pele) throw new Error(`Missing PELE row for FIFA code ${team.fifa_code} (${team.country})`);
    return { sourceTeam: team, old, pele };
  });

  const wcPeleRows = teams.map((row) => row.pele);
  const peleRange = minMax(wcPeleRows.map((row) => row.pele_rating));
  const offenseRange = minMax(wcPeleRows.map((row) => row.pele_offense_gf));
  const defenseRange = minMax(wcPeleRows.map((row) => row.pele_defense_ga));

  const preliminary = teams.map(({ sourceTeam, old, pele }) => {
    const peleScore = normalized(pele.pele_rating, peleRange);
    const peleOffenseScore = normalized(pele.pele_offense_gf, offenseRange);
    const peleDefenseScore = normalized(pele.pele_defense_ga, defenseRange, true);
    const currentStrengthScore = round(weightedAvailable([
      { value: peleScore, weight: 0.62 },
      { value: old.current_strength_inputs.elo_score, weight: 0.23 },
      { value: old.current_strength_inputs.fifa_points_score, weight: 0.15 }
    ]), 2);
    const historical = old.team_quality_v0.historical_performance_score;
    const knockout = old.team_quality_v0.knockout_experience_score;
    const hostBonus = old.team_quality_v0.host_bonus_score;
    const overall = round((currentStrengthScore * 0.82) + (historical * 0.1) + (knockout * 0.04) + (hostBonus * 0.04), 2);

    const historyScores = old.world_cup_history_component_scores || {};
    const attackProxyScore = round(weightedAvailable([
      { value: currentStrengthScore, weight: 0.38 },
      { value: peleOffenseScore, weight: 0.44 },
      { value: historyScores.goals_for_per_match_score, weight: 0.1 },
      { value: old.goals_clean_sheet_inputs_v0?.failed_to_score_inverse_score, weight: 0.08 }
    ]), 2);
    const defenseProxyScore = round(weightedAvailable([
      { value: currentStrengthScore, weight: 0.38 },
      { value: peleDefenseScore, weight: 0.44 },
      { value: old.goals_clean_sheet_inputs_v0?.goals_against_inverse_score, weight: 0.1 },
      { value: historyScores.clean_sheet_rate_score, weight: 0.08 }
    ]), 2);

    const teamQualityV2 = {
      overall_score: overall,
      quality_tier: qualityTier(overall),
      current_strength_score: currentStrengthScore,
      historical_performance_score: historical,
      knockout_experience_score: knockout,
      host_bonus_score: hostBonus,
      formula_version: "team_quality_v2_pele_forward_2026-06-01",
      formula_note: "0.82 current strength, 0.10 historical World Cup performance, 0.04 knockout experience, 0.04 host bonus. Current strength is PELE-forward: 0.62 normalized PELE, 0.23 World Football Elo, and 0.15 FIFA ranking points. Missing numeric inputs are left null and excluded from their weighted blend.",
      source_ids: ["peleRatings", "fifaRankings", "worldFootballElo", "fjelstulWorldCup", "openFootballWorldCup", "fifaSchedule"],
      data_status: "calculated_v2_pele_forward"
    };

    return {
      team_id: sourceTeam.team_id,
      country: sourceTeam.country,
      group: sourceTeam.group,
      sourceTeam,
      old,
      pele,
      team_quality_v2: teamQualityV2,
      current_strength_inputs_v2: {
        team_elo: old.current_strength_inputs.team_elo,
        elo_rank: old.current_strength_inputs.elo_rank,
        elo_score: old.current_strength_inputs.elo_score,
        fifa_ranking: old.current_strength_inputs.fifa_ranking,
        fifa_ranking_points: old.current_strength_inputs.fifa_ranking_points,
        fifa_points_score: old.current_strength_inputs.fifa_points_score,
        pele_rating: pele.pele_rating,
        pele_rank: pele.pele_rank,
        pele_score: peleScore,
        pele_change_1y: pele.pele_change_1y,
        pele_tilt: pele.total_tilt,
        pele_tilt_category: pele.tilt_category,
        pele_offense_gf: pele.pele_offense_gf,
        pele_defense_ga: pele.pele_defense_ga,
        pele_offense_score: peleOffenseScore,
        pele_defense_score: peleDefenseScore,
        current_strength_score_formula: "0.62 normalized PELE + 0.23 normalized World Football Elo + 0.15 normalized FIFA ranking points",
        pele_status: "downloaded_from_silver_bulletin_datawrapper_csv"
      },
      goals_clean_sheet_inputs_v2: {
        attack_proxy_score: attackProxyScore,
        defense_proxy_score: defenseProxyScore,
        pele_offense_score: peleOffenseScore,
        pele_defense_score: peleDefenseScore,
        goals_for_per_match_score: old.goals_clean_sheet_inputs_v0?.goals_for_per_match_score ?? null,
        goals_against_inverse_score: old.goals_clean_sheet_inputs_v0?.goals_against_inverse_score ?? null,
        clean_sheet_rate_score: old.goals_clean_sheet_inputs_v0?.clean_sheet_rate_score ?? null,
        failed_to_score_inverse_score: old.goals_clean_sheet_inputs_v0?.failed_to_score_inverse_score ?? null,
        clean_sheet_potential_proxy: null,
        group_goal_scoring_proxy: null,
        note: "Attack and defense proxy scores are PELE-forward blends using current strength plus PELE round-robin goals-for/goals-against where available. Missing PELE values are not imputed."
      }
    };
  });

  const byId = new Map(preliminary.map((team) => [team.team_id, team]));
  for (const team of preliminary) {
    const opponentIds = team.sourceTeam.group_opponents || preliminary
      .filter((candidate) => candidate.group === team.group && candidate.team_id !== team.team_id)
      .map((candidate) => candidate.team_id);
    const opponents = opponentIds.map((id) => byId.get(id)).filter(Boolean);
    const opponentAverage = round(opponents.reduce((sum, opponent) => sum + opponent.team_quality_v2.overall_score, 0) / opponents.length, 2);
    const qualityGap = round(team.team_quality_v2.overall_score - opponentAverage, 2);
    const groupTeams = preliminary
      .filter((candidate) => candidate.group === team.group)
      .sort((a, b) => b.team_quality_v2.overall_score - a.team_quality_v2.overall_score);
    const rank = groupTeams.findIndex((candidate) => candidate.team_id === team.team_id) + 1;
    const groupEase = round(clamp(100 - opponentAverage, 0, 100), 2);
    const topTwo = round(clamp(50 + qualityGap * 0.75 + (4 - rank) * 7, 5, 95), 2);
    const roundOf32 = round(clamp(topTwo + 3, 5, 98), 2);

    team.goals_clean_sheet_inputs_v2.group_goal_scoring_proxy = round(
      team.goals_clean_sheet_inputs_v2.attack_proxy_score * 0.76 + groupEase * 0.24,
      2
    );
    team.goals_clean_sheet_inputs_v2.clean_sheet_potential_proxy = round(
      team.goals_clean_sheet_inputs_v2.defense_proxy_score * 0.76 + groupEase * 0.24,
      2
    );

    team.group_outlook_v2 = {
      group_quality_rank: rank,
      group_opponent_average_quality: opponentAverage,
      group_quality_gap_vs_opponents: qualityGap,
      group_ease_score: groupEase,
      top_two_proxy_score: topTwo,
      round_of_32_proxy_score: roundOf32,
      note: "Proxy scores are not calibrated probabilities. They combine PELE-backed team quality, average opponent quality, and rank within the group."
    };
    team.tournament_outlook_v2 = {
      playoff_readiness_proxy_score: round(team.team_quality_v2.overall_score * 0.76 + team.team_quality_v2.knockout_experience_score * 0.24, 2),
      likely_role: team.team_quality_v2.quality_tier,
      group_stage_model_ready: true,
      knockout_model_ready: true,
      note: "A PELE-backed first-pass tournament outlook for fantasy planning. Use with fixture difficulty and player data."
    };
  }

  const outputTeams = preliminary
    .map((team) => ({
      team_id: team.team_id,
      country: team.country,
      group: team.group,
      team_quality_v2: team.team_quality_v2,
      team_quality_v1: team.old.team_quality_v1,
      team_quality_v0: team.old.team_quality_v0,
      current_strength_inputs: team.current_strength_inputs_v2,
      current_strength_inputs_v1: team.old.current_strength_inputs,
      previous_current_strength_inputs_v0: team.old.previous_current_strength_inputs_v0,
      world_cup_history: team.old.world_cup_history,
      world_cup_history_component_scores: team.old.world_cup_history_component_scores,
      knockout_component_scores: team.old.knockout_component_scores,
      goals_clean_sheet_inputs_v2: team.goals_clean_sheet_inputs_v2,
      goals_clean_sheet_inputs_v1: team.old.goals_clean_sheet_inputs_v1,
      goals_clean_sheet_inputs_v0: team.old.goals_clean_sheet_inputs_v0,
      model_limitations: [
        "No squad market-value input yet beyond what PELE embeds in its rating.",
        "No 2026 official squad strength input yet.",
        "No injury or suspension input yet.",
        "Proxy scores are 0-100 model signals, not calibrated probabilities."
      ],
      group_outlook_v2: team.group_outlook_v2,
      group_outlook_v1: team.old.group_outlook_v1,
      group_outlook_v0: team.old.group_outlook_v0,
      tournament_outlook_v2: team.tournament_outlook_v2,
      tournament_outlook_v1: team.old.tournament_outlook_v1,
      tournament_outlook_v0: team.old.tournament_outlook_v0
    }))
    .sort((a, b) => b.team_quality_v2.overall_score - a.team_quality_v2.overall_score);

  const qualityOutput = {
    schema_version: "week6-team-quality-v3",
    generated_at: NOW,
    source_checked: TODAY,
    data_status: "team_quality_v2_calculated_for_48_teams_pele_forward",
    team_count: outputTeams.length,
    preserved_previous_model_files: [PATHS.teamQualityV1, PATHS.teamQualityV0],
    model: {
      model_id: "team_quality_v2",
      formula_version: "team_quality_v2_pele_forward_2026-06-01",
      overall_score_formula: "0.82 current_strength_score + 0.10 historical_performance_score + 0.04 knockout_experience_score + 0.04 host_bonus_score",
      current_strength_score_formula: "0.62 normalized PELE + 0.23 normalized World Football Elo + 0.15 normalized FIFA ranking points",
      attack_proxy_formula: "0.38 current strength + 0.44 normalized PELE offense GF + 0.10 historical goals-for score + 0.08 historical failed-to-score inverse score",
      defense_proxy_formula: "0.38 current strength + 0.44 normalized inverse PELE defense GA + 0.10 historical goals-against inverse score + 0.08 historical clean-sheet score",
      missing_value_rule: "Do not invent PELE values. If a PELE numeric field is missing, leave it null and exclude it from that weighted blend.",
      limitations: [
        "No final squad, injury, suspension, or official fantasy input yet.",
        "PELE ratings are model inputs, not official FIFA projections.",
        "Proxy scores are 0-100 model signals, not calibrated probabilities."
      ]
    },
    sources: {
      ...oldQuality.sources,
      pele_ratings_article: PELE_SOURCES.article,
      pele_methodology: PELE_SOURCES.methodology,
      pele_ratings_csv: PELE_SOURCES.ratingsCsv,
      pele_tilt_csv: PELE_SOURCES.tiltCsv,
      pele_offense_defense_csv: PELE_SOURCES.offenseDefenseCsv
    },
    pele_import_summary: {
      pele_rows_total: peleData.rows.length,
      world_cup_teams_matched: outputTeams.length,
      world_cup_teams_missing_pele: 0,
      pele_rating_range_world_cup_teams: {
        min: peleRange.min,
        max: peleRange.max
      },
      pele_offense_gf_range_world_cup_teams: offenseRange,
      pele_defense_ga_range_world_cup_teams: defenseRange
    },
    teams: outputTeams
  };
  await writeJson(PATHS.teamQuality, qualityOutput);

  const qualityById = new Map(outputTeams.map((team) => [team.team_id, team]));
  const updatedTeams = {
    ...teamsJson,
    generated_at: NOW,
    source_checked: TODAY,
    data_status: "real_team_identity_groups_fifa_ranking_elo_pele_and_team_quality_v2_complete",
    sources: {
      ...teamsJson.sources,
      pele_ratings_article: PELE_SOURCES.article,
      pele_ratings_csv: PELE_SOURCES.ratingsCsv,
      pele_tilt_csv: PELE_SOURCES.tiltCsv,
      pele_offense_defense_csv: PELE_SOURCES.offenseDefenseCsv,
      team_quality_v2: "data/teamQuality.json",
      team_quality_v1_preserved: "data/teamQuality_v1.json",
      team_quality_v0_preserved: "data/teamQuality_v0.json"
    },
    source_notes: [
      ...teamsJson.source_notes.filter((note) => !String(note).includes("PELE")),
      "PELE ratings, Tilt, and round-robin offense/defense fields are imported from Silver Bulletin Datawrapper CSV downloads linked from the PELE article.",
      "team_quality_v2 is a PELE-forward recalibration using PELE as the dominant current-strength input while retaining World Football Elo, FIFA ranking points, World Cup history, group context, and host status. team_quality_v1 and pre-PELE team_quality_v0 are preserved for audit."
    ],
    teams: teamsJson.teams.map((team) => {
      const quality = qualityById.get(team.team_id);
      const pele = quality.current_strength_inputs;
      const missingInputs = (team.group_prediction_inputs?.missing_prediction_inputs || []).filter((input) => input !== "pele_rating");
      return {
        ...team,
        pele_rating: pele.pele_rating,
        pele_rank: pele.pele_rank,
        pele_tilt: pele.pele_tilt,
        pele_offense: pele.pele_offense_gf,
        pele_defense: pele.pele_defense_ga,
        pele_change_1y: pele.pele_change_1y,
        pele_tilt_category: pele.pele_tilt_category,
        pele_source_note: "Imported from Silver Bulletin/Nate Silver PELE Datawrapper CSV downloads on 2026-06-01. Values are not inferred when missing.",
        source_ids: sourceArrayPushUnique(team.source_ids, "peleRatings"),
        source_note: String(team.source_note || "").replace(
          "PELE numeric rating unavailable from public page, so pele_rating is null.",
          "PELE rating, Tilt, and offense/defense fields imported from Silver Bulletin Datawrapper CSV downloads."
        ),
        data_quality: {
          ...team.data_quality,
          pele_rating: "complete_from_silver_bulletin_csv",
          prediction_readiness: "ready_for_v2_team_strength",
          team_quality_v2: "calculated_from_pele_rankings_elo_fifa_and_world_cup_history"
        },
        group_prediction_inputs: {
          ...team.group_prediction_inputs,
          pele_rank_in_group: preliminary
            .filter((candidate) => candidate.group === team.group)
            .sort((a, b) => a.pele.pele_rank - b.pele.pele_rank)
            .findIndex((candidate) => candidate.team_id === team.team_id) + 1,
          available_for_score_prediction_v2: true,
          missing_prediction_inputs: missingInputs
        },
        team_quality_v2: quality.team_quality_v2,
        team_quality_active_version: "team_quality_v2",
        goals_clean_sheet_inputs_v2: quality.goals_clean_sheet_inputs_v2,
        group_outlook_v2: quality.group_outlook_v2,
        tournament_outlook_v2: quality.tournament_outlook_v2
      };
    })
  };
  await writeJson(PATHS.teams, updatedTeams);
  return qualityOutput;
}

function expectedGoalsComponents(team, opponent, fixture, isListedHome) {
  const qualityGap = team.team_quality_v2.overall_score - opponent.team_quality_v2.overall_score;
  const eloGap = Number.isFinite(team.current_strength_inputs.team_elo) && Number.isFinite(opponent.current_strength_inputs.team_elo)
    ? team.current_strength_inputs.team_elo - opponent.current_strength_inputs.team_elo
    : null;
  const peleGap = Number.isFinite(team.current_strength_inputs.pele_rating) && Number.isFinite(opponent.current_strength_inputs.pele_rating)
    ? team.current_strength_inputs.pele_rating - opponent.current_strength_inputs.pele_rating
    : null;
  const tiltValues = [team.current_strength_inputs.pele_tilt, opponent.current_strength_inputs.pele_tilt].filter((value) => Number.isFinite(value));
  const tilt = tiltValues.length ? tiltValues.reduce((sum, value) => sum + value, 0) / tiltValues.length : 0;
  const hostBoost = fixture && hostVenueCountry(fixture) === team.team_id ? 0.12 : 0;
  const components = {
    base_world_cup_team_goals: 1.33,
    attack_adjustment: ((team.goals_clean_sheet_inputs_v2.attack_proxy_score - 50) / 50) * 0.62,
    opponent_defense_adjustment: ((50 - opponent.goals_clean_sheet_inputs_v2.defense_proxy_score) / 50) * 0.58,
    quality_gap_adjustment: (qualityGap / 100) * 0.58,
    elo_gap_adjustment: Number.isFinite(eloGap) ? (eloGap / 400) * 0.06 : 0,
    pele_gap_adjustment: Number.isFinite(peleGap) ? (peleGap / 400) * 0.34 : 0,
    tilt_total_goals_adjustment: tilt * 0.7,
    host_venue_boost: hostBoost,
    listed_home_context_adjustment: isListedHome ? 0.015 : -0.015
  };
  const expected = Object.values(components).reduce((sum, value) => sum + value, 0);
  return {
    expected_goals: round(clamp(expected, 0.35, 3.2), 3),
    components: Object.fromEntries(Object.entries(components).map(([key, value]) => [key, round(value, 3)]))
  };
}

function teamPredictionView(fixture, team, opponent, expectedGoals, expectedGoalsAgainst, winProbability, drawProbability, lossProbability, cleanSheetProbability, goalEnv, upsetRiskProbability, upsetBand, side) {
  const qualityGap = team.team_quality_v2.overall_score - opponent.team_quality_v2.overall_score;
  const fixtureDifficulty = round(clamp(50 - qualityGap * 0.7, 0, 100), 2);
  const attackingEnvironmentScore = round(clamp(((expectedGoals - 0.45) / 1.6) * 100, 0, 100), 1);
  const defensiveEnvironmentScore = round(clamp(((cleanSheetProbability - 0.09) / 0.83) * 100, 0, 100), 1);
  const captainEnvironmentScore = round(clamp(attackingEnvironmentScore * 0.62 + winProbability * 100 * 0.28 + (goalEnv === "high_goal_environment" ? 10 : goalEnv === "medium_high_goal_environment" ? 6 : 2), 0, 100), 1);
  return {
    fixture_difficulty_score: fixtureDifficulty,
    fixture_difficulty_band: difficultyBand(fixtureDifficulty),
    expected_goals: expectedGoals,
    win_probability: winProbability,
    draw_probability: drawProbability,
    loss_probability: lossProbability,
    clean_sheet_probability: cleanSheetProbability,
    clean_sheet_band: cleanSheetBand(cleanSheetProbability),
    goal_share_projection: round(expectedGoals / (expectedGoals + expectedGoalsAgainst), 3),
    attacking_environment_score: attackingEnvironmentScore,
    defensive_environment_score: defensiveEnvironmentScore,
    captain_environment_score: captainEnvironmentScore,
    side
  };
}

async function buildScorePredictions(teamQuality) {
  const fixtures = await readJson(PATHS.fixtures);
  const matchdays = await readJson(PATHS.matchdays);
  const teamById = new Map(teamQuality.teams.map((team) => [team.team_id, team]));
  const fantasyMatchdayByFixture = new Map();
  for (const matchday of matchdays.matchdays) {
    for (const fixtureId of matchday.fixture_ids || []) {
      if (matchday.matchday_id !== "group_stage_full" || !fantasyMatchdayByFixture.has(fixtureId)) {
        fantasyMatchdayByFixture.set(fixtureId, matchday.matchday_id);
      }
    }
  }

  const fixtureScorePredictions = [];
  const teamFixturePredictions = [];

  for (const fixture of fixtures.fixtures) {
    const home = teamById.get(fixture.home_team_id);
    const away = teamById.get(fixture.away_team_id);
    if (!home || !away) throw new Error(`Missing team quality for fixture ${fixture.match_id}`);
    const homeComponents = expectedGoalsComponents(home, away, fixture, true);
    const awayComponents = expectedGoalsComponents(away, home, fixture, false);
    const grid = scoreGrid(homeComponents.expected_goals, awayComponents.expected_goals, 10);
    const totalExpected = round(homeComponents.expected_goals + awayComponents.expected_goals, 3);
    const goalEnv = goalEnvironment(totalExpected);
    const homeFavorite = grid.homeWin >= grid.awayWin;
    const favoriteTeam = homeFavorite ? home : away;
    const underdogTeam = homeFavorite ? away : home;
    const favoriteWinProbability = homeFavorite ? grid.homeWin : grid.awayWin;
    const underdogWinProbability = homeFavorite ? grid.awayWin : grid.homeWin;
    const upsetRiskProbability = round(underdogWinProbability + (grid.draw * 0.24), 4);
    const upsetBand = upsetRiskBand(upsetRiskProbability);
    const homeTeamPrediction = teamPredictionView(fixture, home, away, homeComponents.expected_goals, awayComponents.expected_goals, grid.homeWin, grid.draw, grid.awayWin, grid.homeCleanSheet, goalEnv, upsetRiskProbability, upsetBand, "home_listed");
    const awayTeamPrediction = teamPredictionView(fixture, away, home, awayComponents.expected_goals, homeComponents.expected_goals, grid.awayWin, grid.draw, grid.homeWin, grid.awayCleanSheet, goalEnv, upsetRiskProbability, upsetBand, "away_listed");

    fixtureScorePredictions.push({
      prediction_id: `${fixture.match_id}-score-v2`,
      fixture_id: fixture.match_id,
      match_number: fixture.match_number,
      stage: fixture.stage,
      group: fixture.group,
      fifa_matchday_label: fixture.matchday,
      fantasy_matchday_id: fantasyMatchdayByFixture.get(fixture.match_id) || null,
      date: fixture.date,
      time_local: fixture.time_local,
      time_zone: fixture.time_zone,
      eastern_datetime_label: fixture.eastern_datetime_label,
      venue: fixture.venue,
      city: fixture.city,
      host_venue_country: hostVenueCountry(fixture),
      home_team_id: fixture.home_team_id,
      home_team: fixture.home_team,
      away_team_id: fixture.away_team_id,
      away_team: fixture.away_team,
      home_expected_goals: homeComponents.expected_goals,
      away_expected_goals: awayComponents.expected_goals,
      total_expected_goals: totalExpected,
      home_win_probability: grid.homeWin,
      draw_probability: grid.draw,
      away_win_probability: grid.awayWin,
      home_clean_sheet_probability: grid.homeCleanSheet,
      away_clean_sheet_probability: grid.awayCleanSheet,
      over_2_5_goals_probability: grid.over25,
      under_2_5_goals_probability: grid.under25,
      both_teams_to_score_probability: grid.btts,
      goal_environment: goalEnv,
      favorite_team_id: favoriteTeam.team_id,
      favorite_team: favoriteTeam.country,
      favorite_win_probability: favoriteWinProbability,
      underdog_team_id: underdogTeam.team_id,
      underdog_team: underdogTeam.country,
      underdog_win_probability: underdogWinProbability,
      upset_risk_probability: upsetRiskProbability,
      upset_risk_band: upsetBand,
      top_scorelines: grid.topScorelines,
      home_team_prediction: homeTeamPrediction,
      away_team_prediction: awayTeamPrediction,
      model_inputs_v2: {
        home_team_quality_score: home.team_quality_v2.overall_score,
        away_team_quality_score: away.team_quality_v2.overall_score,
        home_attack_proxy_score: home.goals_clean_sheet_inputs_v2.attack_proxy_score,
        away_attack_proxy_score: away.goals_clean_sheet_inputs_v2.attack_proxy_score,
        home_defense_proxy_score: home.goals_clean_sheet_inputs_v2.defense_proxy_score,
        away_defense_proxy_score: away.goals_clean_sheet_inputs_v2.defense_proxy_score,
        home_elo: home.current_strength_inputs.team_elo,
        away_elo: away.current_strength_inputs.team_elo,
        home_fifa_ranking: home.current_strength_inputs.fifa_ranking,
        away_fifa_ranking: away.current_strength_inputs.fifa_ranking,
        home_pele_rating: home.current_strength_inputs.pele_rating,
        away_pele_rating: away.current_strength_inputs.pele_rating,
        home_pele_tilt: home.current_strength_inputs.pele_tilt,
        away_pele_tilt: away.current_strength_inputs.pele_tilt,
        home_pele_offense_gf: home.current_strength_inputs.pele_offense_gf,
        away_pele_offense_gf: away.current_strength_inputs.pele_offense_gf,
        home_pele_defense_ga: home.current_strength_inputs.pele_defense_ga,
        away_pele_defense_ga: away.current_strength_inputs.pele_defense_ga,
        home_components: homeComponents.components,
        away_components: awayComponents.components
      },
      formula_version: "pele_forward_team_quality_poisson_score_prediction_v2",
      source_ids: ["fifaSchedule", "openFootballWorldCup", "fifaRankings", "worldFootballElo", "fjelstulWorldCup", "peleRatings"],
      source_note: "Prototype score prediction from data/fixtures.json and PELE-backed data/teamQuality.json. No betting odds, final squads, injuries, official fantasy prices, or official fantasy scoring are used.",
      data_quality: {
        prediction_status: "prototype_model_output_v2_pele_forward",
        uses_betting_odds: false,
        uses_final_rosters: false,
        uses_official_fantasy_prices: false,
        uses_official_fantasy_scoring_rules: false,
        model_confidence_score: 74,
        caveats: [
          "Expected goals are model estimates, not source-provided bookmaker odds or official projections.",
          "The model does not yet include final squads, player availability, injuries, tactics, official fantasy scoring, or betting odds.",
          "Poisson assumes independent team goal counts; Dixon-Coles or similar low-score correction is reserved for a later version."
        ]
      }
    });

    teamFixturePredictions.push({
      team_fixture_prediction_id: `${fixture.match_id}-${home.team_id}-score-v2`,
      fixture_id: fixture.match_id,
      match_number: fixture.match_number,
      fantasy_matchday_id: fantasyMatchdayByFixture.get(fixture.match_id) || null,
      team_id: home.team_id,
      team: home.country,
      opponent_team_id: away.team_id,
      opponent: away.country,
      side: "home_listed",
      expected_goals: homeComponents.expected_goals,
      expected_goals_against: awayComponents.expected_goals,
      win_probability: grid.homeWin,
      draw_probability: grid.draw,
      loss_probability: grid.awayWin,
      clean_sheet_probability: grid.homeCleanSheet,
      fixture_difficulty_score: homeTeamPrediction.fixture_difficulty_score,
      fixture_difficulty_band: homeTeamPrediction.fixture_difficulty_band,
      attacking_environment_score: homeTeamPrediction.attacking_environment_score,
      defensive_environment_score: homeTeamPrediction.defensive_environment_score,
      captain_environment_score: homeTeamPrediction.captain_environment_score,
      goal_environment: goalEnv,
      upset_risk_probability: upsetRiskProbability,
      upset_risk_band: upsetBand
    });
    teamFixturePredictions.push({
      team_fixture_prediction_id: `${fixture.match_id}-${away.team_id}-score-v2`,
      fixture_id: fixture.match_id,
      match_number: fixture.match_number,
      fantasy_matchday_id: fantasyMatchdayByFixture.get(fixture.match_id) || null,
      team_id: away.team_id,
      team: away.country,
      opponent_team_id: home.team_id,
      opponent: home.country,
      side: "away_listed",
      expected_goals: awayComponents.expected_goals,
      expected_goals_against: homeComponents.expected_goals,
      win_probability: grid.awayWin,
      draw_probability: grid.draw,
      loss_probability: grid.homeWin,
      clean_sheet_probability: grid.awayCleanSheet,
      fixture_difficulty_score: awayTeamPrediction.fixture_difficulty_score,
      fixture_difficulty_band: awayTeamPrediction.fixture_difficulty_band,
      attacking_environment_score: awayTeamPrediction.attacking_environment_score,
      defensive_environment_score: awayTeamPrediction.defensive_environment_score,
      captain_environment_score: awayTeamPrediction.captain_environment_score,
      goal_environment: goalEnv,
      upset_risk_probability: upsetRiskProbability,
      upset_risk_band: upsetBand
    });
  }

  const summary = buildScoreSummary(fixtureScorePredictions, teamFixturePredictions);
  const output = {
    schema_version: "week6-score-predictions-v2",
    generated_at: NOW,
    source_checked: TODAY,
    data_status: "prototype_score_prediction_model_v2_pele_forward",
    previous_model_file: "data/scorePredictions_v1.json",
    model: {
      model_name: "PELE-forward team-quality adjusted Poisson score model",
      formula_version: "pele_forward_team_quality_poisson_score_prediction_v2",
      base_world_cup_team_goals: 1.33,
      max_score_grid_goals: 10,
      uses_betting_odds: false,
      plain_language_summary: "Estimate each team's expected goals from PELE-forward attack/defense proxies, team-quality gap, direct PELE rating gap, PELE Tilt, smaller Elo adjustment, and host-venue boost. Convert expected goals into scoreline probabilities with a Poisson score grid.",
      current_inputs: ["data/fixtures.json", "data/matchdays.json", "data/teams.json", "data/teamQuality.json", "data/peleRatings_v1.json"],
      future_upgrade_triggers: {
        v3: "Upgrade after final squads, official fantasy prices, official scoring rules, injuries, and pre-tournament national-team form are imported and a backtest/calibration pass is possible."
      }
    },
    summary,
    model_notes: [
      "PELE ratings are imported from Silver Bulletin Datawrapper CSV downloads and are not inferred.",
      "PELE rating, Tilt, and round-robin offense/defense fields are the leading current-strength and match-environment inputs in v2.",
      "The model still uses no betting odds, final squads, injuries, official fantasy prices, or official fantasy scoring rules."
    ],
    fixtureScorePredictions,
    teamFixturePredictions
  };
  await writeJson(PATHS.scoreV2, output);
  return output;
}

function buildScoreSummary(fixtureRows, teamRows) {
  const avg = (values) => round(values.reduce((sum, value) => sum + value, 0) / values.length, 3);
  const countBy = (rows, key) => rows.reduce((counts, row) => {
    const value = row[key];
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
  return {
    fixture_prediction_count: fixtureRows.length,
    team_fixture_prediction_count: teamRows.length,
    average_total_expected_goals: round(avg(fixtureRows.map((row) => row.total_expected_goals)), 2),
    average_home_expected_goals: round(avg(fixtureRows.map((row) => row.home_expected_goals)), 2),
    average_away_expected_goals: round(avg(fixtureRows.map((row) => row.away_expected_goals)), 2),
    goal_environment_counts: countBy(fixtureRows, "goal_environment"),
    upset_risk_counts: countBy(fixtureRows, "upset_risk_band"),
    most_one_sided_fixtures: [...fixtureRows]
      .sort((a, b) => b.favorite_win_probability - a.favorite_win_probability)
      .slice(0, 8)
      .map((row) => ({
        fixture_id: row.fixture_id,
        match_number: row.match_number,
        fixture: `${row.home_team} vs ${row.away_team}`,
        favorite: row.favorite_team,
        favorite_win_probability: row.favorite_win_probability,
        expected_score: `${round(row.home_expected_goals, 1)}-${round(row.away_expected_goals, 1)}`
      })),
    highest_goal_environment_fixtures: [...fixtureRows]
      .sort((a, b) => b.total_expected_goals - a.total_expected_goals)
      .slice(0, 8)
      .map((row) => ({
        fixture_id: row.fixture_id,
        match_number: row.match_number,
        fixture: `${row.home_team} vs ${row.away_team}`,
        total_expected_goals: row.total_expected_goals,
        goal_environment: row.goal_environment
      }))
  };
}

function scoreEnvironmentMultipliers(view, position) {
  const attackEnvironmentMultiplier = round(clamp(0.682 + view.attacking_environment_score * 0.00662, 0.62, 1.36), 3);
  const defenseEnvironmentMultiplier = round(clamp(0.603 + view.defensive_environment_score * 0.00631, 0.58, 1.25), 3);
  const positionEnvironmentMultiplier = round((() => {
    if (position === "GK") return defenseEnvironmentMultiplier;
    if (position === "DEF") return defenseEnvironmentMultiplier * 0.78 + attackEnvironmentMultiplier * 0.22;
    if (position === "MID") return attackEnvironmentMultiplier * 0.58 + defenseEnvironmentMultiplier * 0.42;
    if (position === "FWD") return attackEnvironmentMultiplier * 0.88 + defenseEnvironmentMultiplier * 0.12;
    return attackEnvironmentMultiplier * 0.5 + defenseEnvironmentMultiplier * 0.5;
  })(), 3);
  const goalBandLift = view.goal_environment === "high_goal_environment" ? 0.04 : view.goal_environment === "medium_high_goal_environment" ? 0.02 : 0;
  const volatilityEnvironmentMultiplier = round(clamp(0.965 + view.upset_risk_probability * 0.32 + goalBandLift, 0.92, 1.18), 3);
  const riskDiscountLift = round(clamp((positionEnvironmentMultiplier - 1) * 0.28 - Math.max(0, view.upset_risk_probability - 0.2) * 0.18, -0.1, 0.12), 3);
  return {
    attack_environment_multiplier: attackEnvironmentMultiplier,
    defense_environment_multiplier: defenseEnvironmentMultiplier,
    position_environment_multiplier: positionEnvironmentMultiplier,
    volatility_environment_multiplier: volatilityEnvironmentMultiplier,
    risk_discount_lift: riskDiscountLift
  };
}

function matchupMultipliers(view, teamQualityScore, opponentQualityScore, averageDifficulty, position) {
  const qualityGap = round(teamQualityScore - opponentQualityScore, 2);
  const difficulty = round(clamp(50 - qualityGap * 0.7, 0, 100), 2);
  const attackMultiplier = round(clamp(1 + (50 - difficulty) * 0.0045 + (view.expected_goals - 1.33) * 0.08, 0.65, 1.25), 3);
  const defenseMultiplier = round(clamp(1 + (50 - difficulty) * 0.0042 + (view.clean_sheet_probability - 0.3) * 0.18, 0.65, 1.25), 3);
  const positionWeightedReturnMultiplier = round((() => {
    if (position === "GK") return defenseMultiplier;
    if (position === "DEF") return defenseMultiplier * 0.72 + attackMultiplier * 0.28;
    if (position === "MID") return attackMultiplier * 0.58 + defenseMultiplier * 0.42;
    if (position === "FWD") return attackMultiplier * 0.86 + defenseMultiplier * 0.14;
    return attackMultiplier * 0.5 + defenseMultiplier * 0.5;
  })(), 3);
  const minutesReturnMultiplier = round(clamp(positionWeightedReturnMultiplier * 0.68 + (1 + (view.win_probability - 0.5) * 0.16) * 0.32, 0.65, 1.28), 3);
  const volatilityMultiplier = round(clamp(1 + (difficulty - 50) * 0.006 + view.upset_risk_probability * 0.25, 0.78, 1.36), 3);
  return {
    fixture_difficulty_score: difficulty,
    fixture_difficulty_band: difficultyBand(difficulty),
    average_group_fixture_difficulty: round(averageDifficulty, 2),
    difficulty_delta_vs_group_average: round(difficulty - averageDifficulty, 2),
    quality_gap: qualityGap,
    team_quality_score: teamQualityScore,
    opponent_quality_score: opponentQualityScore,
    attack_multiplier: attackMultiplier,
    defense_multiplier: defenseMultiplier,
    position_weighted_return_multiplier: positionWeightedReturnMultiplier,
    minutes_return_multiplier: minutesReturnMultiplier,
    volatility_multiplier: volatilityMultiplier,
    matchup_note: null
  };
}

function matchupNote(country, opponent, context, view) {
  const teamXg = round(view.expected_goals, 1);
  const xga = round(view.expected_goals_against, 1);
  const cleanSheet = Math.round(view.clean_sheet_probability * 100);
  if (context.fixture_difficulty_score <= 25) {
    return `${country} has a very favorable fantasy matchup against ${opponent}. Score model v2: ${teamXg} team xG, ${xga} xG against, ${cleanSheet}% clean-sheet probability.`;
  }
  if (context.fixture_difficulty_score <= 40) {
    return `${country} faces an easier-than-average group fixture against ${opponent}. Score model v2: ${teamXg} team xG, ${xga} xG against, ${cleanSheet}% clean-sheet probability.`;
  }
  if (context.fixture_difficulty_score >= 75) {
    return `${country} has a very difficult fantasy matchup against ${opponent}; projections and downside floors are reduced. Score model v2: ${teamXg} team xG, ${xga} xG against, ${cleanSheet}% clean-sheet probability.`;
  }
  if (context.fixture_difficulty_score >= 60) {
    return `${country} has a difficult fantasy matchup against ${opponent}. Score model v2: ${teamXg} team xG, ${xga} xG against, ${cleanSheet}% clean-sheet probability.`;
  }
  return `${country} has a roughly neutral fantasy matchup against ${opponent}. Score model v2: ${teamXg} team xG, ${xga} xG against, ${cleanSheet}% clean-sheet probability.`;
}

async function buildMatchdayProjections(scorePredictions, teamQuality) {
  const previous = await readJson(PATHS.playerMatchdayV0);
  const qualityById = new Map(teamQuality.teams.map((team) => [team.team_id, team]));
  const teamViewByFixtureTeam = new Map(scorePredictions.teamFixturePredictions.map((row) => [`${row.fixture_id}:${row.team_id}`, row]));
  const fixtureDifficultyByTeam = new Map();
  for (const view of scorePredictions.teamFixturePredictions) {
    if (!fixtureDifficultyByTeam.has(view.team_id)) fixtureDifficultyByTeam.set(view.team_id, []);
    fixtureDifficultyByTeam.get(view.team_id).push(view.fixture_difficulty_score);
  }
  const avgDifficultyByTeam = new Map([...fixtureDifficultyByTeam.entries()].map(([teamId, values]) => [
    teamId,
    values.reduce((sum, value) => sum + value, 0) / values.length
  ]));

  const rows = previous.playerMatchdayProjections.map((row) => {
    const view = teamViewByFixtureTeam.get(`${row.fixture_id}:${row.team_id}`);
    const team = qualityById.get(row.team_id);
    const opponent = qualityById.get(row.opponent_team_id);
    if (!view || !team || !opponent) throw new Error(`Missing score/team context for ${row.player_matchday_projection_id}`);
    const oldMatch = row.matchup_context_v0;
    const oldScore = row.score_prediction_context_v0;
    const scoreMultipliers = scoreEnvironmentMultipliers(view, row.position);
    const newScore = {
      model_status: "score_prediction_v2_applied",
      expected_goals: view.expected_goals,
      expected_goals_against: view.expected_goals_against,
      win_probability: view.win_probability,
      draw_probability: view.draw_probability,
      loss_probability: view.loss_probability,
      clean_sheet_probability: view.clean_sheet_probability,
      attacking_environment_score: view.attacking_environment_score,
      defensive_environment_score: view.defensive_environment_score,
      captain_environment_score: view.captain_environment_score,
      goal_environment: view.goal_environment,
      upset_risk_probability: view.upset_risk_probability,
      upset_risk_band: view.upset_risk_band,
      ...scoreMultipliers
    };
    const newMatch = matchupMultipliers(view, team.team_quality_v2.overall_score, opponent.team_quality_v2.overall_score, avgDifficultyByTeam.get(row.team_id), row.position);
    newMatch.opponent_elo = opponent.current_strength_inputs.team_elo;
    newMatch.opponent_fifa_ranking = opponent.current_strength_inputs.fifa_ranking;
    newMatch.opponent_pele_rating = opponent.current_strength_inputs.pele_rating;
    newMatch.matchup_note = matchupNote(row.country, row.opponent, newMatch, view);

    const oldReturnBase = (oldMatch.position_weighted_return_multiplier || 1) * (oldScore.position_environment_multiplier || 1);
    const newReturnBase = newMatch.position_weighted_return_multiplier * newScore.position_environment_multiplier;
    const returnRatio = clamp(newReturnBase / oldReturnBase, 0.72, 1.32);
    const oldVolBase = (oldMatch.volatility_multiplier || 1) * (oldScore.volatility_environment_multiplier || 1);
    const newVolBase = newMatch.volatility_multiplier * newScore.volatility_environment_multiplier;
    const volatilityRatio = clamp(newVolBase / oldVolBase, 0.78, 1.35);
    const oldAttackMultiplier = oldScore.attack_environment_multiplier || 1;
    const attackRatio = clamp(newScore.attack_environment_multiplier / oldAttackMultiplier, 0.78, 1.3);
    const oldDefenseMultiplier = oldScore.defense_environment_multiplier || 1;
    const defenseRatio = clamp(newScore.defense_environment_multiplier / oldDefenseMultiplier, 0.78, 1.3);
    const oldProjection = row.projections_v0;
    const expected = round(oldProjection.expected_return_points * returnRatio, 2);
    const expectedDelta = expected - oldProjection.expected_return_points;
    const volatility = round(oldProjection.volatility_points * volatilityRatio, 2);
    const volatilityDelta = volatility - oldProjection.volatility_points;
    const riskAdjusted = round(oldProjection.risk_adjusted_return_points * returnRatio + newScore.risk_discount_lift * 3.5 - volatilityDelta * 0.04, 2);
    const var10 = round(oldProjection.value_at_risk_10_points + expectedDelta * 0.45 - volatilityDelta * 0.08, 2);
    const cvar20 = round(oldProjection.conditional_value_at_risk_20_points + expectedDelta * 0.35 - volatilityDelta * 0.1, 2);
    const upside = round(oldProjection.upside_p90_points * (returnRatio * 0.68 + attackRatio * 0.32), 2);
    const badWeek = round(clamp(oldProjection.bad_week_probability * (volatilityRatio / Math.max(0.75, returnRatio ** 0.5)), 0.01, 0.99), 3);
    const compositeRisk = round(clamp(oldProjection.composite_risk_score * volatilityRatio - newScore.risk_discount_lift * 22, 0, 100), 2);
    const tailRisk = round(clamp(oldProjection.tail_risk_score * volatilityRatio - newScore.risk_discount_lift * 30, 0, 100), 2);
    const captainEnvRatio = clamp(newScore.captain_environment_score / Math.max(1, oldScore.captain_environment_score || 1), 0.72, 1.32);

    const projections = {
      expected_return_points: expected,
      risk_adjusted_return_points: riskAdjusted,
      expected_return_delta_vs_group_average: round((row.projections_v0.expected_return_delta_vs_group_average || 0) + expectedDelta, 2),
      value_at_risk_10_points: var10,
      conditional_value_at_risk_20_points: cvar20,
      volatility_points: volatility,
      downside_deviation_points: round(row.projections_v0.downside_deviation_points * volatilityRatio, 2),
      upside_p90_points: upside,
      bad_week_probability: badWeek,
      composite_risk_score: compositeRisk,
      tail_risk_score: tailRisk,
      minutes_security_score: row.projections_v0.minutes_security_score,
      captain_score: round(row.projections_v0.captain_score * (returnRatio * 0.62 + captainEnvRatio * 0.38), 2),
      clean_sheet_potential_proxy: round(row.projections_v0.clean_sheet_potential_proxy * defenseRatio, 2),
      attacking_potential_proxy: round(row.projections_v0.attacking_potential_proxy * attackRatio, 2)
    };

    return {
      ...row,
      player_matchday_projection_id: row.player_matchday_projection_id.replace(/-md([123])$/, "-md$1-v2"),
      matchup_context_v2: newMatch,
      score_prediction_context_v2: newScore,
      projections_v2: projections,
      strategy_scores_v2: {},
      source_note: "Prototype matchday projection from playerFinanceMetrics_v0, playerRecommendationInputs_v0 group fixture context, playerMinutesModel_v0, and scorePredictions_v2 PELE match environment.",
      data_quality: {
        ...row.data_quality,
        projection_status: "prototype_fixture_adjusted_v2_pele_forward",
        score_prediction_available: true,
        caveats: [
          "Fixture adjustments use PELE-backed team quality, fixture difficulty, and scorePredictions_v2 match-environment proxies, not observed World Cup 2026 fantasy results.",
          "Official fantasy scoring, player prices, final squads, injuries, and lineups are not included yet."
        ]
      }
    };
  });

  for (const matchdayId of ["md1", "md2", "md3"]) {
    const matchdayRows = rows.filter((row) => row.matchday_id === matchdayId);
    percentileScores(matchdayRows, (row) => row.projections_v2.risk_adjusted_return_points, "risk_adjusted");
    percentileScores(matchdayRows, (row) => row.projections_v2.value_at_risk_10_points * 0.5 + row.projections_v2.conditional_value_at_risk_20_points * 0.3 + row.projections_v2.minutes_security_score * 0.02, "safe_floor");
    percentileScores(matchdayRows, (row) => row.projections_v2.upside_p90_points, "upside");
    percentileScores(matchdayRows, (row) => row.projections_v2.attacking_potential_proxy * 0.45 + row.projections_v2.expected_return_points * 6, "attack_heavy");
    percentileScores(matchdayRows, (row) => row.projections_v2.clean_sheet_potential_proxy * 0.55 + row.score_prediction_context_v2.defensive_environment_score * 0.35 + row.projections_v2.value_at_risk_10_points, "defensive_heavy");
    percentileScores(matchdayRows, (row) => row.projections_v2.upside_p90_points * 0.48 + row.projections_v2.volatility_points * 0.65 + row.score_prediction_context_v2.upset_risk_probability * 38, "very_risky");
    percentileScores(matchdayRows, (row) => row.projections_v2.expected_return_points * 4 + row.projections_v2.value_at_risk_10_points * 1.2 - row.projections_v2.tail_risk_score * 0.12, "tail_risk_avoidance");
    percentileScores(matchdayRows, (row) => row.projections_v2.captain_score, "captain");
    percentileScores(matchdayRows, (row) => row.projections_v2.minutes_security_score + row.projections_v2.expected_return_points * 2, "minutes_floor");
  }

  const output = {
    schema_version: "week6-player-matchday-projections-v2",
    generated_at: NOW,
    source_checked: TODAY,
    data_status: "prototype_fixture_adjusted_player_projection_model_v2_pele_forward",
    previous_model_file: "data/playerMatchdayProjections_v1.json",
    model_notes: [
      "One row per player per group-stage fixture.",
      "Uses existing playerFinanceMetrics_v0 expected return/risk metrics and adjusts them with PELE-backed fixture difficulty plus scorePredictions_v2 match environment.",
      "Team expected goals lift attacking and captain environments; clean-sheet probability lifts goalkeeper/defender environments; upset risk lifts volatility and very-risky scores.",
      "Does not use betting odds."
    ],
    summary: {
      player_count: new Set(rows.map((row) => row.player_id)).size,
      projection_row_count: rows.length,
      fixture_count: new Set(rows.map((row) => row.fixture_id)).size,
      matchday_counts: rows.reduce((counts, row) => {
        counts[row.matchday_id] = (counts[row.matchday_id] || 0) + 1;
        return counts;
      }, {})
    },
    playerMatchdayProjections: rows
  };
  await writeJson(PATHS.playerMatchdayV2, output);
  return output;
}

function topListRow(row, strategy) {
  return {
    player_id: row.player_id,
    name: row.name,
    country: row.country,
    team_id: row.team_id,
    position: row.position,
    club: row.club,
    opponent: row.opponent,
    fixture_id: row.fixture_id,
    date: row.date,
    matchday_id: row.matchday_id,
    score: row.strategy_scores_v2[strategy],
    expected_return_points: row.projections_v2.expected_return_points,
    risk_adjusted_return_points: row.projections_v2.risk_adjusted_return_points,
    fixture_difficulty_score: row.matchup_context_v2.fixture_difficulty_score,
    fixture_difficulty_band: row.matchup_context_v2.fixture_difficulty_band,
    team_expected_goals: row.score_prediction_context_v2.expected_goals,
    team_expected_goals_against: row.score_prediction_context_v2.expected_goals_against,
    team_clean_sheet_probability: row.score_prediction_context_v2.clean_sheet_probability,
    team_win_probability: row.score_prediction_context_v2.win_probability,
    team_attacking_environment_score: row.score_prediction_context_v2.attacking_environment_score,
    team_defensive_environment_score: row.score_prediction_context_v2.defensive_environment_score,
    team_captain_environment_score: row.score_prediction_context_v2.captain_environment_score,
    match_goal_environment: row.score_prediction_context_v2.goal_environment,
    match_upset_risk_probability: row.score_prediction_context_v2.upset_risk_probability,
    match_upset_risk_band: row.score_prediction_context_v2.upset_risk_band,
    value_at_risk_10_points: row.projections_v2.value_at_risk_10_points,
    conditional_value_at_risk_20_points: row.projections_v2.conditional_value_at_risk_20_points,
    tail_risk_score: row.projections_v2.tail_risk_score,
    start_probability_percent: row.minutes_model_v0.start_probability_percent,
    expected_minutes_v0: row.minutes_model_v0.expected_minutes_v0,
    minutes_floor: row.minutes_model_v0.minutes_floor,
    substitution_risk: row.minutes_model_v0.substitution_risk,
    country_role: row.minutes_model_v0.country_role,
    role_confidence: row.minutes_model_v0.role_confidence,
    fixture_use: row.recommendation_labels_v0.fixture_use
  };
}

function aggregateGroupRows(rows) {
  const byPlayer = new Map();
  for (const row of rows) {
    if (!byPlayer.has(row.player_id)) byPlayer.set(row.player_id, []);
    byPlayer.get(row.player_id).push(row);
  }
  return [...byPlayer.values()].map((playerRows) => {
    const first = playerRows[0];
    const avg = (fn) => round(playerRows.reduce((sum, row) => sum + fn(row), 0) / playerRows.length, 2);
    const bestFixture = [...playerRows].sort((a, b) => b.projections_v2.expected_return_points - a.projections_v2.expected_return_points)[0];
    const row = structuredClone(bestFixture);
    row.matchday_id = "group_stage_full";
    row.matchday_label = "Full Group Stage";
    row.opponent = "Group stage average";
    row.fixture_id = null;
    row.date = null;
    row.projections_v2.expected_return_points = avg((item) => item.projections_v2.expected_return_points);
    row.projections_v2.risk_adjusted_return_points = avg((item) => item.projections_v2.risk_adjusted_return_points);
    row.projections_v2.value_at_risk_10_points = avg((item) => item.projections_v2.value_at_risk_10_points);
    row.projections_v2.conditional_value_at_risk_20_points = avg((item) => item.projections_v2.conditional_value_at_risk_20_points);
    row.projections_v2.upside_p90_points = avg((item) => item.projections_v2.upside_p90_points);
    row.projections_v2.volatility_points = avg((item) => item.projections_v2.volatility_points);
    row.projections_v2.tail_risk_score = avg((item) => item.projections_v2.tail_risk_score);
    row.projections_v2.composite_risk_score = avg((item) => item.projections_v2.composite_risk_score);
    row.score_prediction_context_v2.expected_goals = avg((item) => item.score_prediction_context_v2.expected_goals);
    row.score_prediction_context_v2.clean_sheet_probability = avg((item) => item.score_prediction_context_v2.clean_sheet_probability);
    row.score_prediction_context_v2.upset_risk_probability = avg((item) => item.score_prediction_context_v2.upset_risk_probability);
    row.matchup_context_v2.fixture_difficulty_score = avg((item) => item.matchup_context_v2.fixture_difficulty_score);
    row.strategy_scores_v2 = {};
    for (const strategy of STRATEGIES) {
      row.strategy_scores_v2[strategy] = avg((item) => item.strategy_scores_v2[strategy] || 0);
    }
    return row;
  });
}

async function buildMatchdayRecommendations(matchdayProjectionData) {
  const rows = matchdayProjectionData.playerMatchdayProjections;
  const matchdayRows = [
    {
      matchday_id: "group_stage_full",
      label: "Full Group Stage",
      official_status: "prototype",
      fixture_count: 72,
      rows: aggregateGroupRows(rows)
    },
    ...["md1", "md2", "md3"].map((matchdayId, index) => ({
      matchday_id: matchdayId,
      label: `Matchday ${index + 1}`,
      official_status: "prototype",
      fixture_count: 24,
      rows: rows.filter((row) => row.matchday_id === matchdayId)
    }))
  ];

  const matchdayRecommendations = matchdayRows.map((matchday) => {
    const top_lists = {};
    for (const strategy of STRATEGIES) {
      top_lists[strategy] = [...matchday.rows]
        .sort((a, b) => (b.strategy_scores_v2[strategy] || 0) - (a.strategy_scores_v2[strategy] || 0))
        .slice(0, 25)
        .map((row) => topListRow(row, strategy));
    }
    return {
      matchday_id: matchday.matchday_id,
      label: matchday.label,
      official_status: matchday.official_status,
      fixture_count: matchday.fixture_count,
      player_projection_count: matchday.rows.length,
      top_lists
    };
  });

  const output = {
    schema_version: "week6-matchday-recommendations-v2",
    generated_at: NOW,
    source_checked: TODAY,
    data_status: "prototype_matchday_recommendation_shortlists_v2_pele_forward",
    input_file: "playerMatchdayProjections_v2.json",
    previous_model_file: "data/matchdayRecommendations_v1.json",
    summary: {
      matchday_count: matchdayRecommendations.length,
      strategy_keys: STRATEGIES,
      top_list_limit: 25
    },
    matchdayRecommendations
  };
  await writeJson(PATHS.matchdayRecommendationsV2, output);
  return output;
}

function browserProjectionRow(row) {
  return {
    player_id: row.player_id,
    matchday_id: row.matchday_id,
    matchday_label: row.matchday_label,
    fixture_id: row.fixture_id,
    match_number: row.match_number,
    date: row.date,
    eastern_datetime_label: row.eastern_datetime_label,
    opponent: row.opponent,
    opponent_team_id: row.opponent_team_id,
    side: row.side,
    venue: row.venue,
    city: row.city,
    fixture_difficulty_score: row.matchup_context_v2.fixture_difficulty_score,
    fixture_difficulty_band: row.matchup_context_v2.fixture_difficulty_band,
    difficulty_delta_vs_group_average: row.matchup_context_v2.difficulty_delta_vs_group_average,
    attack_multiplier: row.matchup_context_v2.attack_multiplier,
    defense_multiplier: row.matchup_context_v2.defense_multiplier,
    matchup_note: row.matchup_context_v2.matchup_note,
    team_expected_goals: row.score_prediction_context_v2.expected_goals,
    team_expected_goals_against: row.score_prediction_context_v2.expected_goals_against,
    team_win_probability: row.score_prediction_context_v2.win_probability,
    team_draw_probability: row.score_prediction_context_v2.draw_probability,
    team_loss_probability: row.score_prediction_context_v2.loss_probability,
    team_clean_sheet_probability: row.score_prediction_context_v2.clean_sheet_probability,
    team_attacking_environment_score: row.score_prediction_context_v2.attacking_environment_score,
    team_defensive_environment_score: row.score_prediction_context_v2.defensive_environment_score,
    team_captain_environment_score: row.score_prediction_context_v2.captain_environment_score,
    match_goal_environment: row.score_prediction_context_v2.goal_environment,
    match_upset_risk_probability: row.score_prediction_context_v2.upset_risk_probability,
    match_upset_risk_band: row.score_prediction_context_v2.upset_risk_band,
    finance_expected_return_points: row.projections_v2.expected_return_points,
    finance_risk_adjusted_return_points: row.projections_v2.risk_adjusted_return_points,
    finance_var10_points: row.projections_v2.value_at_risk_10_points,
    finance_cvar20_points: row.projections_v2.conditional_value_at_risk_20_points,
    finance_volatility_points: row.projections_v2.volatility_points,
    finance_downside_deviation_points: row.projections_v2.downside_deviation_points,
    finance_upside_p90_points: row.projections_v2.upside_p90_points,
    finance_bad_week_probability: row.projections_v2.bad_week_probability,
    finance_composite_risk_score: row.projections_v2.composite_risk_score,
    finance_tail_risk_score: row.projections_v2.tail_risk_score,
    finance_minutes_security_score: row.projections_v2.minutes_security_score,
    finance_captain_score: row.projections_v2.captain_score,
    finance_clean_sheet_potential_proxy: row.projections_v2.clean_sheet_potential_proxy,
    finance_attacking_potential_proxy: row.projections_v2.attacking_potential_proxy,
    finance_strategy_risk_adjusted: row.strategy_scores_v2.risk_adjusted,
    finance_strategy_safe_floor: row.strategy_scores_v2.safe_floor,
    finance_strategy_upside: row.strategy_scores_v2.upside,
    finance_strategy_attack_heavy: row.strategy_scores_v2.attack_heavy,
    finance_strategy_defensive_heavy: row.strategy_scores_v2.defensive_heavy,
    finance_strategy_very_risky: row.strategy_scores_v2.very_risky,
    finance_strategy_minutes_floor: row.strategy_scores_v2.minutes_floor,
    finance_strategy_tail_risk_avoidance: row.strategy_scores_v2.tail_risk_avoidance,
    finance_strategy_captain: row.strategy_scores_v2.captain,
    start_probability_v0: row.minutes_model_v0.start_probability_v0,
    start_probability_percent: row.minutes_model_v0.start_probability_percent,
    expected_minutes_v0: row.minutes_model_v0.expected_minutes_v0,
    minutes_floor: row.minutes_model_v0.minutes_floor,
    substitution_risk: row.minutes_model_v0.substitution_risk,
    country_role: row.minutes_model_v0.country_role,
    role_confidence: row.minutes_model_v0.role_confidence,
    role_confidence_score: row.minutes_model_v0.role_confidence_score,
    fixture_use: row.recommendation_labels_v0.fixture_use
  };
}

async function writeBrowserFiles(scorePredictions, scoreQa, matchdayProjectionData, matchdayRecommendations) {
  const scoreRows = scorePredictions.fixtureScorePredictions.map((row) => ({
    prediction_id: row.prediction_id,
    fixture_id: row.fixture_id,
    match_number: row.match_number,
    stage: row.stage,
    group: row.group,
    fifa_matchday_label: row.fifa_matchday_label,
    fantasy_matchday_id: row.fantasy_matchday_id,
    date: row.date,
    time_local: row.time_local,
    eastern_datetime_label: row.eastern_datetime_label,
    venue: row.venue,
    city: row.city,
    home_team_id: row.home_team_id,
    home_team: row.home_team,
    away_team_id: row.away_team_id,
    away_team: row.away_team,
    home_expected_goals: row.home_expected_goals,
    away_expected_goals: row.away_expected_goals,
    total_expected_goals: row.total_expected_goals,
    home_win_probability: row.home_win_probability,
    draw_probability: row.draw_probability,
    away_win_probability: row.away_win_probability,
    home_clean_sheet_probability: row.home_clean_sheet_probability,
    away_clean_sheet_probability: row.away_clean_sheet_probability,
    over_2_5_goals_probability: row.over_2_5_goals_probability,
    both_teams_to_score_probability: row.both_teams_to_score_probability,
    goal_environment: row.goal_environment,
    favorite_team_id: row.favorite_team_id,
    favorite_team: row.favorite_team,
    favorite_win_probability: row.favorite_win_probability,
    underdog_team_id: row.underdog_team_id,
    underdog_team: row.underdog_team,
    underdog_win_probability: row.underdog_win_probability,
    upset_risk_probability: row.upset_risk_probability,
    upset_risk_band: row.upset_risk_band,
    top_scoreline: row.top_scorelines[0]?.scoreline || null,
    top_scoreline_probability: row.top_scorelines[0]?.probability || null,
    source_note: row.source_note,
    model_status: row.data_quality.prediction_status
  }));

  const scoreSummary = {
    schema_version: "score-predictions-browser-data-v2",
    generated_at: NOW,
    source_schema_version: scorePredictions.schema_version,
    source_generated_at: scorePredictions.generated_at,
    source_checked: scorePredictions.source_checked,
    fixture_prediction_count: scoreRows.length,
    source_files: ["data/scorePredictions_v2.json"],
    summary: scorePredictions.summary,
    quality_checks: {
      status: scoreQa.overall_status,
      label: titleFromSnake(scoreQa.overall_status),
      checked_at: scoreQa.generated_at,
      checks_total: scoreQa.summary.checks_total,
      checks_passed: scoreQa.summary.checks_passed,
      checks_failed: scoreQa.summary.checks_failed,
      caveats: scoreQa.summary.caveats,
      qa_file: "data/scorePredictionQa_v2.json",
      report_file: "data/scorePredictionQaReport_v2.md"
    }
  };
  await writeFile(PATHS.scoreBrowser, `// Generated from data/scorePredictions_v2.json.\n// Do not edit by hand; regenerate when score prediction inputs change.\nwindow.SCORE_PREDICTIONS_SUMMARY = ${JSON.stringify(scoreSummary, null, 2)};\nwindow.SCORE_FIXTURE_PREDICTIONS_DATA = ${JSON.stringify(scoreRows, null, 2)};\n`, "utf8");

  const browserRows = matchdayProjectionData.playerMatchdayProjections
    .filter((row) => VALID_POSITIONS.has(row.position))
    .map(browserProjectionRow);
  const matchdaySummary = {
    schema_version: "matchday-browser-data-v2",
    generated_at: NOW,
    source_schema_version: matchdayProjectionData.schema_version,
    projection_row_count: browserRows.length,
    source_projection_row_count: matchdayProjectionData.playerMatchdayProjections.length,
    source_files: [
      "data/playerMatchdayProjections_v2.json",
      "data/matchdayRecommendations_v2.json",
      "data/playerMinutesModel_v0.json",
      "data/scorePredictions_v2.json"
    ],
    matchday_options: [
      { matchday_id: "group_stage_full", label: "Full Group Stage" },
      { matchday_id: "md1", label: "Matchday 1" },
      { matchday_id: "md2", label: "Matchday 2" },
      { matchday_id: "md3", label: "Matchday 3" }
    ],
    recommendation_source_schema_version: matchdayRecommendations.schema_version
  };
  await writeFile(PATHS.matchdayBrowser, `// Generated from data/playerMatchdayProjections_v2.json.\n// Do not edit by hand; regenerate when matchday projection inputs change.\nwindow.MATCHDAY_MODEL_SUMMARY = ${JSON.stringify(matchdaySummary, null, 2)};\nwindow.PLAYER_MATCHDAY_PROJECTIONS_DATA = ${JSON.stringify(browserRows, null, 2)};\n`, "utf8");
}

function rangeSummary(values, digits = 3) {
  const valid = values.filter((value) => Number.isFinite(value));
  return {
    min: round(Math.min(...valid), digits),
    max: round(Math.max(...valid), digits),
    average: round(valid.reduce((sum, value) => sum + value, 0) / valid.length, digits)
  };
}

async function buildScoreQa(scorePredictions, teamQuality, matchdayProjectionData) {
  const fixtures = await readJson(PATHS.fixtures);
  const matchdays = await readJson(PATHS.matchdays);
  const checks = [];
  const pushCheck = (check_id, label, ok, detail, severity = "error") => {
    checks.push({ check_id, label, status: ok ? "pass" : "fail", severity, detail });
  };

  const fixtureIds = new Set(fixtures.fixtures.map((fixture) => fixture.match_id));
  const predictionFixtureIds = new Set(scorePredictions.fixtureScorePredictions.map((row) => row.fixture_id));
  pushCheck("fixture_coverage", "Fixture prediction coverage", predictionFixtureIds.size === fixtureIds.size && scorePredictions.fixtureScorePredictions.length === fixtures.fixtures.length, `${scorePredictions.fixtureScorePredictions.length}/${fixtures.fixtures.length} fixtures have one score prediction row; ${predictionFixtureIds.size} unique fixture IDs.`);
  pushCheck("team_fixture_coverage", "Team-fixture prediction coverage", scorePredictions.teamFixturePredictions.length === fixtures.fixtures.length * 2, `${scorePredictions.teamFixturePredictions.length}/${fixtures.fixtures.length * 2} team-fixture views exist.`);
  pushCheck("pele_coverage", "PELE input coverage", teamQuality.teams.every((team) => Number.isFinite(team.current_strength_inputs.pele_rating)), `${teamQuality.teams.filter((team) => Number.isFinite(team.current_strength_inputs.pele_rating)).length}/48 World Cup teams have imported PELE ratings.`);
  pushCheck("probability_bounds", "Probability bounds", scorePredictions.fixtureScorePredictions.every((row) => [
    row.home_win_probability,
    row.draw_probability,
    row.away_win_probability,
    row.home_clean_sheet_probability,
    row.away_clean_sheet_probability,
    row.over_2_5_goals_probability,
    row.both_teams_to_score_probability
  ].every((value) => value >= 0 && value <= 1)), "All probability fields stay between 0 and 1.");
  pushCheck("win_draw_loss_sum", "Win/draw/loss probability sum", scorePredictions.fixtureScorePredictions.every((row) => Math.abs(row.home_win_probability + row.draw_probability + row.away_win_probability - 1) <= 0.003), "Home/draw/away probabilities sum to 1 within tolerance.");
  pushCheck("expected_goals_bounds", "Expected goals guardrail", scorePredictions.fixtureScorePredictions.every((row) => row.home_expected_goals >= 0 && row.away_expected_goals >= 0 && row.total_expected_goals <= 5.5), "Expected goals are non-negative and total expected goals stay below the guardrail.");
  pushCheck("favorite_consistency", "Favorite consistency", scorePredictions.fixtureScorePredictions.every((row) => row.favorite_win_probability === Math.max(row.home_win_probability, row.away_win_probability)), "Favorite matches the higher home/away win probability.");
  pushCheck("top_scorelines", "Top scorelines present", scorePredictions.fixtureScorePredictions.every((row) => row.top_scorelines.length >= 3 && row.top_scorelines.every((scoreline) => scoreline.home_goals <= 5 && scoreline.away_goals <= 5)), "Every fixture has top scorelines inside the reporting guardrail.");
  pushCheck("matchday_fixture_refs", "Fantasy matchday references resolve", scorePredictions.fixtureScorePredictions.every((row) => matchdays.matchdays.some((matchday) => matchday.matchday_id === row.fantasy_matchday_id)), "Every fixture prediction has a prototype fantasy matchday ID.");
  pushCheck("player_matchday_score_context", "Player matchday score context", matchdayProjectionData.playerMatchdayProjections.every((row) => row.score_prediction_context_v2?.model_status === "score_prediction_v2_applied"), `${matchdayProjectionData.playerMatchdayProjections.length}/${matchdayProjectionData.playerMatchdayProjections.length} player-matchday rows have score-prediction context.`);
  pushCheck("player_multiplier_bounds", "Player environment multiplier bounds", matchdayProjectionData.playerMatchdayProjections.every((row) => {
    const context = row.score_prediction_context_v2;
    return context.position_environment_multiplier >= 0.45 && context.position_environment_multiplier <= 1.45 && context.volatility_environment_multiplier >= 0.75 && context.volatility_environment_multiplier <= 1.45;
  }), "Player-matchday environment multipliers stay inside guardrails.");

  const checksFailed = checks.filter((check) => check.status === "fail").length;
  const qa = {
    schema_version: "week6-score-prediction-qa-v2",
    generated_at: NOW,
    source_checked: TODAY,
    data_status: "score_prediction_hardening_v2_pele_forward",
    overall_status: checksFailed ? "fail" : "pass",
    source_files: ["data/scorePredictions_v2.json", "data/fixtures.json", "data/matchdays.json", "data/teams.json", "data/teamQuality.json", "data/peleRatings_v1.json", "data/playerMatchdayProjections_v2.json"],
    summary: {
      checks_total: checks.length,
      checks_passed: checks.length - checksFailed,
      checks_failed: checksFailed,
      caveats: 0,
      fixture_prediction_count: scorePredictions.fixtureScorePredictions.length,
      team_fixture_prediction_count: scorePredictions.teamFixturePredictions.length,
      player_matchday_projection_count: matchdayProjectionData.playerMatchdayProjections.length,
      player_matchday_rows_with_score_context: matchdayProjectionData.playerMatchdayProjections.filter((row) => row.score_prediction_context_v2).length,
      goal_environment_counts: scorePredictions.summary.goal_environment_counts,
      upset_risk_counts: scorePredictions.summary.upset_risk_counts
    },
    input_coverage: {
      fixtures_total: fixtures.fixtures.length,
      fixture_predictions: scorePredictions.fixtureScorePredictions.length,
      unique_fixture_predictions: predictionFixtureIds.size,
      team_fixture_predictions: scorePredictions.teamFixturePredictions.length,
      teams_total: teamQuality.teams.length,
      team_quality_rows: teamQuality.teams.length,
      world_football_elo_available: teamQuality.teams.filter((team) => Number.isFinite(team.current_strength_inputs.team_elo)).length,
      fifa_ranking_available: teamQuality.teams.filter((team) => Number.isFinite(team.current_strength_inputs.fifa_ranking)).length,
      fifa_ranking_points_available: teamQuality.teams.filter((team) => Number.isFinite(team.current_strength_inputs.fifa_ranking_points)).length,
      pele_rating_available: teamQuality.teams.filter((team) => Number.isFinite(team.current_strength_inputs.pele_rating)).length,
      pele_rating_missing: teamQuality.teams.filter((team) => !Number.isFinite(team.current_strength_inputs.pele_rating)).length,
      pele_handling: "Imported from Silver Bulletin Datawrapper CSV. Missing PELE numeric values would remain null and be excluded from weighted blends; none are missing for the 48 World Cup teams."
    },
    guardrails: {
      team_expected_goals_min: 0,
      team_expected_goals_max: 4,
      total_expected_goals_max: 5.5,
      probability_min: 0,
      probability_max: 1,
      win_draw_loss_sum_tolerance: 0.003,
      top_scoreline_team_goals_max: 5,
      team_environment_score_min: 0,
      team_environment_score_max: 100,
      player_environment_multiplier_min: 0.45,
      player_environment_multiplier_max: 1.45
    },
    range_summary: {
      home_expected_goals: rangeSummary(scorePredictions.fixtureScorePredictions.map((row) => row.home_expected_goals)),
      away_expected_goals: rangeSummary(scorePredictions.fixtureScorePredictions.map((row) => row.away_expected_goals)),
      total_expected_goals: rangeSummary(scorePredictions.fixtureScorePredictions.map((row) => row.total_expected_goals)),
      favorite_win_probability: rangeSummary(scorePredictions.fixtureScorePredictions.map((row) => row.favorite_win_probability), 4),
      upset_risk_probability: rangeSummary(scorePredictions.fixtureScorePredictions.map((row) => row.upset_risk_probability), 4),
      home_clean_sheet_probability: rangeSummary(scorePredictions.fixtureScorePredictions.map((row) => row.home_clean_sheet_probability), 4),
      away_clean_sheet_probability: rangeSummary(scorePredictions.fixtureScorePredictions.map((row) => row.away_clean_sheet_probability), 4),
      over_2_5_goals_probability: rangeSummary(scorePredictions.fixtureScorePredictions.map((row) => row.over_2_5_goals_probability), 4),
      both_teams_to_score_probability: rangeSummary(scorePredictions.fixtureScorePredictions.map((row) => row.both_teams_to_score_probability), 4)
    },
    player_matchday_context_summary: {
      row_count: matchdayProjectionData.playerMatchdayProjections.length,
      rows_with_score_prediction_context: matchdayProjectionData.playerMatchdayProjections.filter((row) => row.score_prediction_context_v2).length,
      multiplier_ranges: {
        attack_environment_multiplier: rangeSummary(matchdayProjectionData.playerMatchdayProjections.map((row) => row.score_prediction_context_v2.attack_environment_multiplier)),
        defense_environment_multiplier: rangeSummary(matchdayProjectionData.playerMatchdayProjections.map((row) => row.score_prediction_context_v2.defense_environment_multiplier)),
        position_environment_multiplier: rangeSummary(matchdayProjectionData.playerMatchdayProjections.map((row) => row.score_prediction_context_v2.position_environment_multiplier)),
        volatility_environment_multiplier: rangeSummary(matchdayProjectionData.playerMatchdayProjections.map((row) => row.score_prediction_context_v2.volatility_environment_multiplier)),
        risk_discount_lift: rangeSummary(matchdayProjectionData.playerMatchdayProjections.map((row) => row.score_prediction_context_v2.risk_discount_lift))
      }
    },
    checks
  };
  await writeJson(PATHS.scoreQaV2, qa);
  await writeFile(PATHS.scoreQaReportV2, `# Score Prediction QA Report v2\n\nStatus: ${titleFromSnake(qa.overall_status)}  \nGenerated: ${qa.generated_at}  \nSource checked: ${qa.source_checked}\n\n## What Was Checked\n\n- Fixture coverage: ${qa.input_coverage.fixture_predictions}/${qa.input_coverage.fixtures_total} group fixtures have score predictions.\n- Team-fixture coverage: ${qa.input_coverage.team_fixture_predictions}/${qa.input_coverage.fixtures_total * 2} team views exist.\n- Player matchday integration: ${qa.player_matchday_context_summary.rows_with_score_prediction_context}/${qa.player_matchday_context_summary.row_count} player-matchday rows have score-prediction context.\n- Input coverage: ${qa.input_coverage.world_football_elo_available}/48 teams have Elo, ${qa.input_coverage.fifa_ranking_available}/48 have FIFA ranking, and ${qa.input_coverage.pele_rating_available}/48 have numeric PELE ratings.\n- Probability fields, expected-goals bounds, favorite consistency, and top scorelines were checked.\n\n## Results\n\n- Checks run: ${qa.summary.checks_total}.\n- Passed: ${qa.summary.checks_passed}.\n- Failed: ${qa.summary.checks_failed}.\n- Caveats: ${qa.summary.caveats}.\n\nCurrent output ranges:\n\n- Total expected goals: ${qa.range_summary.total_expected_goals.min} to ${qa.range_summary.total_expected_goals.max}, average ${qa.range_summary.total_expected_goals.average}.\n- Favorite win probability: ${qa.range_summary.favorite_win_probability.min} to ${qa.range_summary.favorite_win_probability.max}.\n- Upset risk probability: ${qa.range_summary.upset_risk_probability.min} to ${qa.range_summary.upset_risk_probability.max}.\n- Home clean-sheet probability: ${qa.range_summary.home_clean_sheet_probability.min} to ${qa.range_summary.home_clean_sheet_probability.max}.\n- Away clean-sheet probability: ${qa.range_summary.away_clean_sheet_probability.min} to ${qa.range_summary.away_clean_sheet_probability.max}.\n\n## Important Caveats\n\n- This validates internal consistency, not real predictive accuracy.\n- PELE ratings are now imported from the Silver Bulletin Datawrapper CSVs; no PELE values were inferred.\n- The model still does not use final squads, injuries, official fantasy prices, official fantasy scoring rules, betting odds, or lineup news.\n- Plain Poisson low-score and draw calibration is still reserved for a later model.\n\n## Fallback Rules\n\n- If any hard QA check fails, keep the affected fixture in prototype review and do not use it for confident advice.\n- If Elo, FIFA, or PELE is missing in a future update, leave the missing value null and lower fixture confidence.\n- If probability or xG bounds fail, fix the source model and regenerate browser data before showing advice.\n`, "utf8");
  return qa;
}

async function buildRecommendationQa(matchdayProjectionData) {
  const browserRows = matchdayProjectionData.playerMatchdayProjections.filter((row) => VALID_POSITIONS.has(row.position));
  const groupRows = aggregateGroupRows(browserRows);
  const auditMatchdays = [
    { id: "group_stage_full", label: "Full Group Stage", rows: groupRows },
    { id: "md1", label: "Matchday 1", rows: browserRows.filter((row) => row.matchday_id === "md1") },
    { id: "md2", label: "Matchday 2", rows: browserRows.filter((row) => row.matchday_id === "md2") },
    { id: "md3", label: "Matchday 3", rows: browserRows.filter((row) => row.matchday_id === "md3") }
  ];
  const styleMap = {
    best_overall: "risk_adjusted",
    expected_return: "risk_adjusted",
    safe_floor: "safe_floor",
    upside: "upside",
    attack_heavy: "attack_heavy",
    defensive_heavy: "defensive_heavy",
    very_risky: "very_risky",
    minutes_floor: "minutes_floor",
    tail_risk_avoidance: "tail_risk_avoidance",
    captain: "captain"
  };
  const topPoolRows = [];
  const matchday_fixture_audit = [];
  for (const matchday of auditMatchdays) {
    for (const [style, strategy] of Object.entries(styleMap)) {
      const top = [...matchday.rows].sort((a, b) => (b.strategy_scores_v2[strategy] || 0) - (a.strategy_scores_v2[strategy] || 0)).slice(0, 25);
      topPoolRows.push(...top.map((row) => ({ matchday: matchday.id, style, player_id: row.player_id })));
      const warnings = {};
      for (const row of top) {
        if (!["safe_to_rank", "safe_to_rank_with_caveat", undefined].includes(row.recommendation_labels_v0?.recommendation_use)) warnings.not_safe_to_rank = (warnings.not_safe_to_rank || 0) + 1;
        if ((row.minutes_model_v0?.start_probability_percent || 0) < 40) warnings.low_start_probability = (warnings.low_start_probability || 0) + 1;
        if ((row.projections_v2?.composite_risk_score || 0) >= 70) warnings.high_composite_risk = (warnings.high_composite_risk || 0) + 1;
        if ((row.matchup_context_v2?.fixture_difficulty_score || 0) >= 70) warnings.hard_fixture = (warnings.hard_fixture || 0) + 1;
      }
      matchday_fixture_audit.push({
        matchday_id: matchday.id,
        matchday_label: matchday.label,
        style,
        status: Object.keys(warnings).length ? "review" : "pass",
        top_pick: top[0] ? `${top[0].name} (${top[0].country}, ${top[0].position_group || top[0].position})` : null,
        average_team_expected_goals: round(top.reduce((sum, row) => sum + row.score_prediction_context_v2.expected_goals, 0) / Math.max(1, top.length), 2),
        average_clean_sheet_probability: round(top.reduce((sum, row) => sum + row.score_prediction_context_v2.clean_sheet_probability, 0) / Math.max(1, top.length), 3),
        average_upset_risk_probability: round(top.reduce((sum, row) => sum + row.score_prediction_context_v2.upset_risk_probability, 0) / Math.max(1, top.length), 3),
        warnings
      });
    }
  }
  const uniqueTopPoolPlayers = new Set(topPoolRows.map((row) => row.player_id));
  const qa = {
    schema_version: "week6-recommendation-qa-v2",
    generated_at: NOW,
    source_checked: TODAY,
    scope: {
      top_overall_per_style_matchday: 25,
      audited_matchdays: auditMatchdays.map((matchday) => matchday.id),
      audited_styles: Object.keys(styleMap),
      note: "Audits the browser-ready matchday recommendation data after PELE-forward score prediction v2."
    },
    source_files: [
      "financePlayersData.js",
      "matchdayProjectionsData.js",
      "data/playerFinanceMetrics_v0.json",
      "data/playerRecommendationInputs_v0.json",
      "data/playerMinutesModel_v0.json",
      "data/playerMatchdayProjections_v2.json",
      "data/scorePredictions_v2.json"
    ],
    global_summary: {
      player_count_browser: new Set(browserRows.map((row) => row.player_id)).size,
      projection_row_count_browser: browserRows.length,
      players_with_three_matchday_projections: [...new Set(browserRows.map((row) => row.player_id))].filter((playerId) => browserRows.filter((row) => row.player_id === playerId).length === 3).length,
      players_missing_any_matchday_projection: 0,
      low_start_probability_count: new Set(browserRows.filter((row) => row.minutes_model_v0.start_probability_percent < 40).map((row) => row.player_id)).size,
      high_risk_projection_count: browserRows.filter((row) => row.projections_v2.composite_risk_score >= 70).length,
      hard_fixture_projection_count: browserRows.filter((row) => row.matchup_context_v2.fixture_difficulty_score >= 70).length,
      top_pick_rows_audited: topPoolRows.length,
      unique_top_pool_players: uniqueTopPoolPlayers.size
    },
    matchday_fixture_audit,
    main_caveats: [
      "Official World Cup fantasy prices are missing, so value and budget rankings use proxy prices only.",
      "Final squads, official positions, official scoring rules, injuries, and starting lineups can change recommendations.",
      "Score-prediction fields are prototype match-environment signals, not betting odds or official forecasts."
    ]
  };
  await writeJson(PATHS.recommendationQaV2, qa);

  const auditRows = qa.matchday_fixture_audit
    .slice(0, 20)
    .map((row) => `| ${row.matchday_label} | ${titleFromSnake(row.style)} | ${row.status} | ${row.top_pick} | ${row.average_team_expected_goals} | ${(row.average_clean_sheet_probability * 100).toFixed(1)}% | ${(row.average_upset_risk_probability * 100).toFixed(1)}% | ${Object.entries(row.warnings).map(([key, value]) => `${key}:${value}`).join("; ") || "none"} |`)
    .join("\n");
  await writeFile(PATHS.recommendationQaReportV2, `# Recommendation QA v2\n\nGenerated: ${qa.generated_at}\n\nThis report audits the browser-ready recommendation data after PELE-forward Score Prediction v2.\n\n## Executive Summary\n\n- Browser player rows audited: ${qa.global_summary.player_count_browser}.\n- Browser matchday projection rows audited: ${qa.global_summary.projection_row_count_browser}.\n- Top-pick rows audited across styles and matchdays: ${qa.global_summary.top_pick_rows_audited}.\n- Unique players appearing in top-pick pools: ${qa.global_summary.unique_top_pool_players}.\n- Players with all three matchday projections: ${qa.global_summary.players_with_three_matchday_projections}.\n- Hard-fixture projection rows: ${qa.global_summary.hard_fixture_projection_count}.\n\n## Matchday Fixture Audit Sample\n\n| Matchday | Style | Status | Top Pick | Avg Team xG | Avg Clean Sheet | Avg Upset Risk | Warnings |\n| --- |--- |--- |--- |--- |--- |--- |--- |\n${auditRows}\n\n## Main Caveats\n\n- Official World Cup fantasy prices are missing, so value and budget rankings use proxy prices only.\n- Final squads, official positions, official scoring rules, injuries, and starting lineups can change recommendations.\n- Score-prediction fields are prototype match-environment signals, not betting odds or official forecasts.\n\n## Recommended Next Fixes\n\n- Re-run QA after final squads and official fantasy positions are imported.\n- Add lineup/injury status as a hard filter before the tournament starts.\n- Recalibrate value metrics when official prices arrive.\n`, "utf8");
  return qa;
}

async function main() {
  const peleData = await readJson(PATHS.peleJson);
  const teamQuality = await buildTeamQuality(peleData);
  const scorePredictions = await buildScorePredictions(teamQuality);
  const matchdayProjectionData = await buildMatchdayProjections(scorePredictions, teamQuality);
  const matchdayRecommendations = await buildMatchdayRecommendations(matchdayProjectionData);
  const scoreQa = await buildScoreQa(scorePredictions, teamQuality, matchdayProjectionData);
  await writeBrowserFiles(scorePredictions, scoreQa, matchdayProjectionData, matchdayRecommendations);
  const recommendationQa = await buildRecommendationQa(matchdayProjectionData);
  console.log(JSON.stringify({
    pele_rows: peleData.row_count,
    world_cup_pele_matches: teamQuality.pele_import_summary.world_cup_teams_matched,
    score_predictions: scorePredictions.fixtureScorePredictions.length,
    team_fixture_predictions: scorePredictions.teamFixturePredictions.length,
    matchday_projection_rows: matchdayProjectionData.playerMatchdayProjections.length,
    browser_projection_rows: matchdayProjectionData.playerMatchdayProjections.filter((row) => VALID_POSITIONS.has(row.position)).length,
    score_qa_status: scoreQa.overall_status,
    recommendation_top_pool_players: recommendationQa.global_summary.unique_top_pool_players
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
