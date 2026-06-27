import { readFile, writeFile, stat } from "node:fs/promises";
import fs from "node:fs";
import path from "node:path";
import { compactProjectionOutput, writeProjectionBrowserData } from "./lib/publicProjectionCompact.mjs";

const GENERATED_AT = new Date().toISOString();

const PUBLIC_DATA_FILES = [
  "playersData.js",
  "fantasyRulesData.js",
  "fantasyPoolRecommendationsData.js",
  "fantasyPoolMatchdayProjectionsData.js",
  "fantasyPoolFinanceMetricsData.js",
  "fantasyPoolScorePredictionsData.js",
  "fantasyPoolOfficialDataStatusData.js",
  "liveMatchdayStatusData.js",
  "livePlayerStatusData.js",
  "knockoutScorePredictorData.js"
];

function bytesToMb(bytes) {
  return Number((bytes / 1024 / 1024).toFixed(3));
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function writeJson(filePath, value, compact = false) {
  await writeFile(filePath, `${compact ? JSON.stringify(value) : JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function fileSize(filePath) {
  try {
    const info = await stat(filePath);
    return info.size;
  } catch {
    return 0;
  }
}

function countBy(rows, keyFn) {
  return rows.reduce((counts, row) => {
    const key = keyFn(row) || "unknown";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function summarizeNumeric(rows, field) {
  const values = rows.map((row) => Number(row[field])).filter(Number.isFinite);
  if (!values.length) return null;
  return {
    count: values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    average: Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(3))
  };
}

async function compactMd2ProjectionArchive() {
  const filePath = "data/fantasyPoolMatchdayProjections_md2_v4.json";
  const beforeBytes = await fileSize(filePath);
  if (!beforeBytes) return null;
  const data = await readJson(filePath);
  const compact = compactProjectionOutput(data, data.playerMatchdayProjections || []);
  compact.compaction = {
    compacted_at: GENERATED_AT,
    reason: "R32 performance/repo-health gate: preserve MD1/MD2/MD3 projection rows needed by downstream MD3/R32 scripts while removing verbose per-row diagnostics.",
    original_size_mb: bytesToMb(beforeBytes),
    retained_projection_rows: compact.playerMatchdayProjections.length,
    retained_blocked_players: compact.blockedPlayers.length,
    removed_verbose_fields: [
      "rate_context",
      "scoring_context",
      "source_note",
      "duplicated full dataQualityFlags",
      "verbose fixture calibration objects",
      "large projection component diagnostics"
    ]
  };
  await writeJson(filePath, compact, true);
  const afterBytes = await fileSize(filePath);
  return {
    file: filePath,
    before_mb: bytesToMb(beforeBytes),
    after_mb: bytesToMb(afterBytes),
    changed: afterBytes < beforeBytes,
    public_browser_data: false,
    loaded_by_homepage: false,
    needed_by_deployed_site: false,
    needed_by_repo_scripts: true,
    action: "compacted_rows_in_place"
  };
}

async function summarizeEspnDetailedArtifact() {
  const filePath = "data/espnDetailedMatchPlayerStats.json";
  const beforeBytes = await fileSize(filePath);
  if (!beforeBytes) return null;
  const data = await readJson(filePath);
  const rows = Array.isArray(data.rows) ? data.rows : [];
  const byLeague = countBy(rows, (row) => row.league_code);
  const byTeam = countBy(rows, (row) => row.team_name);
  const byPosition = countBy(rows, (row) => row.position_display || row.position);
  const topTeamsByRows = Object.entries(byTeam)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 30)
    .map(([team, count]) => ({ team, row_count: count }));
  const topPlayersByRows = Object.entries(countBy(rows, (row) => row.player_name))
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 50)
    .map(([player, count]) => ({ player, row_count: count }));
  const compact = {
    schemaVersion: data.schemaVersion || "espn_detailed_match_player_stats_summary_v1",
    generated_at: data.generated_at,
    compacted_at: GENERATED_AT,
    source_checked: data.source_checked,
    status: "compacted_summary_only",
    source_id: data.source_id,
    original_status: data.status,
    original_row_count: rows.length,
    original_size_mb: bytesToMb(beforeBytes),
    public_browser_data: false,
    loaded_by_homepage: false,
    needed_by_deployed_site: false,
    compaction_reason: "Large raw ESPN debug/source rows are not loaded by the deployed site and exceeded the 50 MB repo-health gate.",
    data_notes: data.data_notes || [],
    summary: data.summary || {},
    leagues_imported: data.leagues_imported || [],
    compact_summary: {
      row_count_by_league: byLeague,
      row_count_by_position: byPosition,
      top_teams_by_row_count: topTeamsByRows,
      top_players_by_row_count: topPlayersByRows,
      numeric_summaries: {
        team_score: summarizeNumeric(rows, "team_score"),
        opponent_score: summarizeNumeric(rows, "opponent_score")
      },
      sample_rows: rows.slice(0, 25).map((row) => ({
        league_code: row.league_code,
        event_id: row.event_id,
        event_date: row.event_date,
        team_name: row.team_name,
        opponent_team_name: row.opponent_team_name,
        player_name: row.player_name,
        position: row.position_display || row.position,
        starter: row.starter,
        team_score: row.team_score,
        opponent_score: row.opponent_score,
        source_summary_stats: row.source_summary_stats || null
      }))
    },
    rows: []
  };
  await writeJson(filePath, compact);
  const afterBytes = await fileSize(filePath);
  return {
    file: filePath,
    before_mb: bytesToMb(beforeBytes),
    after_mb: bytesToMb(afterBytes),
    changed: afterBytes < beforeBytes,
    public_browser_data: false,
    loaded_by_homepage: false,
    needed_by_deployed_site: false,
    action: "replaced_raw_rows_with_compact_summary"
  };
}

async function compactPublicProjectionBrowser() {
  const r32Source = "data/fantasyPoolMatchdayProjections_r32_v1.json";
  const md3Source = "data/fantasyPoolMatchdayProjections_md3_v5.json";
  const source = fs.existsSync(r32Source) ? r32Source : md3Source;
  if (!fs.existsSync(source)) return null;
  const beforeBytes = await fileSize("fantasyPoolMatchdayProjectionsData.js");
  const data = await readJson(source);
  let output = data;
  if (source === r32Source && fs.existsSync(md3Source)) {
    const md3Data = await readJson(md3Source);
    const md3HistoryRows = compactProjectionOutput(md3Data, md3Data.playerMatchdayProjections || [])
      .playerMatchdayProjections
      .filter((row) => row.matchday === "md3");
    output = {
      ...data,
      summary: {
        ...(data.summary || {}),
        historyMd3RowsRetained: md3HistoryRows.length
      },
      playerMatchdayProjections: [
        ...(data.playerMatchdayProjections || []),
        ...md3HistoryRows
      ]
    };
  }
  const compact = await writeProjectionBrowserData("fantasyPoolMatchdayProjectionsData.js", output, {
    generator: "scripts/compactGeneratedArtifactsForR32.mjs",
    label: source === r32Source
      ? "Compacted active R32 player projection browser data plus compact MD3 history"
      : "Compacted active MD3 player projection browser data"
  });
  const afterBytes = await fileSize("fantasyPoolMatchdayProjectionsData.js");
  return {
    file: "fantasyPoolMatchdayProjectionsData.js",
    before_mb: bytesToMb(beforeBytes),
    after_mb: bytesToMb(afterBytes),
    changed: afterBytes < beforeBytes,
    public_browser_data: true,
    loaded_by_homepage: true,
    needed_by_deployed_site: true,
    retained_projection_rows: compact.playerMatchdayProjections.length,
    action: "compacted_browser_payload"
  };
}

function compactFinanceRow(row = {}) {
  const pickFlags = (value) => Array.isArray(value) ? value.filter(Boolean).slice(0, 8) : [];
  const rounded = (value, digits = 3) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return null;
    const factor = 10 ** digits;
    return Math.round(number * factor) / factor;
  };
  const clean = (object) => Object.fromEntries(
    Object.entries(object).filter(([, value]) => value !== null && value !== undefined && value !== "")
  );
  return clean({
    internal_player_id: row.internal_player_id,
    official_fantasy_player_id: row.official_fantasy_player_id,
    name: row.name,
    display_name: row.display_name || row.name,
    country: row.country,
    team_id: row.team_id,
    official_fantasy_position: row.official_fantasy_position,
    official_price: rounded(row.official_price, 1),
    price_tier: row.price_tier,
    group_stage_expected_points: rounded(row.group_stage_expected_points),
    group_stage_risk_adjusted_points: rounded(row.group_stage_risk_adjusted_points),
    group_stage_ceiling_points: rounded(row.group_stage_ceiling_points),
    group_stage_floor_points: rounded(row.group_stage_floor_points),
    captain_score: rounded(row.captain_score),
    points_per_price: rounded(row.points_per_price, 4),
    risk_adjusted_points_per_price: rounded(row.risk_adjusted_points_per_price, 4),
    value_over_replacement: rounded(row.value_over_replacement),
    scarcity_adjusted_value: rounded(row.scarcity_adjusted_value),
    efficient_frontier: row.efficient_frontier === true || undefined,
    dominated_player: row.dominated_player === true || undefined,
    price_tier_opportunity_cost: rounded(row.price_tier_opportunity_cost),
    position_scarcity_score: rounded(row.position_scarcity_score, 1),
    matchday_scarcity_score: rounded(row.matchday_scarcity_score, 1),
    confidence_adjusted_value: rounded(row.confidence_adjusted_value, 4),
    differential_defensibility_score: rounded(row.differential_defensibility_score),
    risk_adjusted_return: rounded(row.risk_adjusted_return),
    volatility_proxy: rounded(row.volatility_proxy),
    downside_risk_proxy: rounded(row.downside_risk_proxy),
    bad_week_floor: rounded(row.bad_week_floor),
    stress_case_floor: rounded(row.stress_case_floor),
    minutes_risk: rounded(row.minutes_risk),
    role_risk: rounded(row.role_risk),
    data_risk: rounded(row.data_risk),
    final_squad_uncertainty_risk: rounded(row.final_squad_uncertainty_risk),
    uncertainty_penalty: rounded(row.uncertainty_penalty),
    thin_profile_penalty: rounded(row.thin_profile_penalty),
    missing_usage_penalty: rounded(row.missing_usage_penalty),
    average_start_probability: rounded(row.average_start_probability),
    average_expected_minutes: rounded(row.average_expected_minutes, 1),
    projection_confidence: row.projection_confidence,
    role_label: row.role_label,
    role_confidence: row.role_confidence,
    selectable_status: row.selectable_status,
    roster_status: row.roster_status,
    final_squad_confirmed: row.final_squad_confirmed === true || undefined,
    fantasy_pool_only: row.fantasy_pool_only === true || undefined,
    data_quality_flags: pickFlags(row.data_quality_flags),
    finance_flags: pickFlags(row.finance_flags),
    value_over_replacement_rank: row.value_over_replacement_rank,
    scarcity_adjusted_value_rank: row.scarcity_adjusted_value_rank,
    risk_adjusted_return_rank: row.risk_adjusted_return_rank,
    confidence_adjusted_value_rank: row.confidence_adjusted_value_rank,
    risk_adjusted_points_per_price_rank: row.risk_adjusted_points_per_price_rank,
    position_value_over_replacement_rank: row.position_value_over_replacement_rank
  });
}

async function compactPublicFinanceBrowser() {
  const filePath = "fantasyPoolFinanceMetricsData.js";
  const beforeBytes = await fileSize(filePath);
  if (!beforeBytes) return null;
  const text = await readFile(filePath, "utf8");
  const context = { window: {} };
  const vm = await import("node:vm");
  vm.createContext(context);
  vm.runInContext(text, context, { filename: filePath });
  const data = context.window.FANTASY_POOL_FINANCE_METRICS_DATA || {};
  const rows = context.window.FANTASY_POOL_PLAYER_FINANCE_METRICS || data.playerFinanceMetrics || [];
  const compact = {
    ...data,
    playerFinanceMetrics: rows.map(compactFinanceRow),
    compaction: {
      compacted_at: GENERATED_AT,
      reason: "R32 public performance gate: remove verbose matchday finance diagnostics from homepage browser bundle.",
      original_size_mb: bytesToMb(beforeBytes),
      retained_rows: rows.length
    }
  };
  const output = [
    "// Generated by scripts/compactGeneratedArtifactsForR32.mjs.",
    "// Compacted active fantasy-pool finance browser data.",
    `window.FANTASY_POOL_FINANCE_METRICS_DATA = ${JSON.stringify(compact)};`,
    "window.FANTASY_POOL_PLAYER_FINANCE_METRICS = window.FANTASY_POOL_FINANCE_METRICS_DATA.playerFinanceMetrics;",
    "window.FANTASY_POOL_FINANCE_METRICS_SUMMARY = window.FANTASY_POOL_FINANCE_METRICS_DATA.summary;",
    ""
  ].join("\n");
  await writeFile(filePath, output, "utf8");
  const afterBytes = await fileSize(filePath);
  return {
    file: filePath,
    before_mb: bytesToMb(beforeBytes),
    after_mb: bytesToMb(afterBytes),
    changed: afterBytes < beforeBytes,
    public_browser_data: true,
    loaded_by_homepage: true,
    needed_by_deployed_site: true,
    retained_rows: rows.length,
    action: "compacted_finance_browser_payload"
  };
}

async function generatedLargeFiles() {
  const results = [];
  function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === ".git") continue;
        walk(entryPath);
      } else {
        const ext = path.extname(entry.name).toLowerCase();
        if ([".json", ".js", ".md"].includes(ext)) {
          const size = fs.statSync(entryPath).size;
          if (size > 25 * 1024 * 1024) results.push({ file: entryPath.replace(/^\.\//, ""), size_bytes: size, size_mb: bytesToMb(size) });
        }
      }
    }
  }
  walk(".");
  return results.sort((a, b) => b.size_bytes - a.size_bytes);
}

async function publicPayloadSizes() {
  const files = [];
  for (const file of PUBLIC_DATA_FILES) {
    if (!fs.existsSync(file)) continue;
    const size = await fileSize(file);
    files.push({
      file,
      size_bytes: size,
      size_mb: bytesToMb(size),
      loaded_by_homepage: file !== "knockoutScorePredictorData.js" || fs.readFileSync("index.html", "utf8").includes(file),
      public_browser_data: true
    });
  }
  return files.sort((a, b) => b.size_bytes - a.size_bytes);
}

function mdTable(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((value) => String(value ?? "")).join(" | ")} |`)
  ].join("\n");
}

function performanceMarkdown(report) {
  return [
    "# Public Performance QA R32 v1",
    "",
    `Generated: ${report.generated_at}`,
    "",
    "## Verdict",
    "",
    report.status === "pass" ? "**pass**" : report.status === "warn" ? "**warn**" : "**fail**",
    "",
    "## Public Payload",
    "",
    mdTable(
      ["File", "MB", "Loaded By Homepage", "Public"],
      report.public_payload_files.map((row) => [row.file, row.size_mb, row.loaded_by_homepage ? "yes" : "no", row.public_browser_data ? "yes" : "no"])
    ),
    "",
    `Total homepage public data payload: ${report.total_homepage_public_payload_mb} MB`,
    "",
    "## Large Generated Files",
    "",
    report.large_generated_files.length
      ? mdTable(["File", "MB", "Public Browser Data", "Needed By Site", "Action"], report.large_generated_files.map((row) => [
          row.file,
          row.size_mb,
          row.public_browser_data ? "yes" : "no",
          row.needed_by_deployed_site ? "yes" : "no",
          row.action || "reported"
        ]))
      : "No JSON/JS/MD files over 25 MB remain.",
    "",
    "## Compaction Actions",
    "",
    report.compaction_actions.map((action) => `- ${action.file}: ${action.before_mb} MB -> ${action.after_mb} MB (${action.action})`).join("\n") || "- none",
    "",
    "## Follow-Up",
    "",
    report.recommended_follow_up.map((item) => `- ${item}`).join("\n"),
    ""
  ].join("\n");
}

async function main() {
  const actions = [];
  for (const action of [
    await compactPublicProjectionBrowser(),
    await compactPublicFinanceBrowser(),
    await compactMd2ProjectionArchive(),
    await summarizeEspnDetailedArtifact()
  ]) {
    if (action) actions.push(action);
  }

  const publicFiles = await publicPayloadSizes();
  const largeFiles = await generatedLargeFiles();
  const actionByFile = new Map(actions.map((action) => [action.file, action]));
  const largeAnnotated = largeFiles.map((row) => {
    const action = actionByFile.get(row.file);
    const publicInfo = publicFiles.find((file) => file.file === row.file);
    return {
      ...row,
      public_browser_data: Boolean(publicInfo?.public_browser_data),
      loaded_by_homepage: Boolean(publicInfo?.loaded_by_homepage),
      needed_by_deployed_site: Boolean(publicInfo?.loaded_by_homepage),
      changed_recently: true,
      can_be_compacted_split_summarized_or_archived_safely: row.file !== "fantasyPoolMatchdayProjectionsData.js",
      action: action?.action || "reported_after_compaction"
    };
  });
  const totalHomepageBytes = publicFiles
    .filter((row) => row.loaded_by_homepage)
    .reduce((sum, row) => sum + row.size_bytes, 0);
  const anyPublicOver10Mb = publicFiles.some((row) => row.loaded_by_homepage && row.size_bytes > 10 * 1024 * 1024);
  const anyGeneratedOver50Mb = largeAnnotated.some((row) => row.size_bytes > 50 * 1024 * 1024);
  const report = {
    schema_version: "public_performance_qa_r32_v1",
    generated_at: GENERATED_AT,
    status: anyGeneratedOver50Mb ? "fail" : anyPublicOver10Mb ? "warn" : "pass",
    public_payload_files: publicFiles,
    total_homepage_public_payload_bytes: totalHomepageBytes,
    total_homepage_public_payload_mb: bytesToMb(totalHomepageBytes),
    largest_public_files: publicFiles.slice(0, 8),
    any_public_file_exceeds_10_mb: anyPublicOver10Mb,
    any_committed_generated_file_exceeds_50_mb: anyGeneratedOver50Mb,
    large_generated_files: largeAnnotated,
    compaction_actions: actions,
    recommended_follow_up: [
      anyPublicOver10Mb
        ? "Continue splitting public browser data by stage if future R32/R16 projections push any single loaded file over 10 MB."
        : "Public browser payload is below the 10 MB per-file warning threshold after compaction.",
      anyGeneratedOver50Mb
        ? "No GREEN release until remaining committed generated files over 50 MB are compacted or removed."
        : "No committed JSON/JS/MD generated artifact exceeds 50 MB after compaction."
    ]
  };
  await writeJson("data/publicPerformanceQa_r32_v1.json", report);
  await writeFile("data/publicPerformanceQaReport_r32_v1.md", performanceMarkdown(report), "utf8");
  console.log(JSON.stringify({
    status: report.status,
    total_homepage_public_payload_mb: report.total_homepage_public_payload_mb,
    any_public_file_exceeds_10_mb: report.any_public_file_exceeds_10_mb,
    any_committed_generated_file_exceeds_50_mb: report.any_committed_generated_file_exceeds_50_mb,
    compaction_actions: actions.map((action) => `${action.file}: ${action.before_mb} -> ${action.after_mb} MB`)
  }, null, 2));
}

await main();
