import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { execFileSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const DATA_DIR = path.join(ROOT, "data");
const CACHE_BUST_RE = /\?v=([^"']+)/;

export const phaseOutputs = {
  architecture: {
    json: "data/publicSiteArchitectureAudit_v1.json",
    md: "data/publicSiteArchitectureAuditReport_v1.md",
  },
  correctness: {
    json: "data/fantasyCorrectnessAudit_v1.json",
    md: "data/fantasyCorrectnessAuditReport_v1.md",
  },
  dataModel: {
    json: "data/dataModelEleganceAudit_v1.json",
    md: "data/dataModelEleganceAuditReport_v1.md",
  },
  model: {
    json: "data/modelEleganceAudit_v1.json",
    md: "data/modelEleganceAuditReport_v1.md",
  },
  teamBuilder: {
    json: "data/teamBuilderEleganceAudit_v1.json",
    md: "data/teamBuilderEleganceAuditReport_v1.md",
  },
  qaCoverage: {
    json: "data/qaCoverageAudit_v1.json",
    md: "data/qaCoverageAuditReport_v1.md",
  },
  publicDesign: {
    json: "data/publicDesignAudit_v1.json",
    md: "data/publicDesignAuditReport_v1.md",
  },
  codeElegance: {
    json: "data/codeEleganceAudit_v1.json",
    md: "data/codeEleganceAuditReport_v1.md",
  },
  performanceDeployment: {
    json: "data/performanceDeploymentAudit_v1.json",
    md: "data/performanceDeploymentAuditReport_v1.md",
  },
  reputationRisk: {
    json: "data/reputationRiskAudit_v1.json",
    md: "data/reputationRiskAuditReport_v1.md",
  },
  summary: {
    json: "data/fantasyEconomistFullAudit_v1.json",
    md: "data/fantasyEconomistFullAuditReport_v1.md",
  },
};

const publicWrapperFiles = [
  "playersData.js",
  "fantasyRulesData.js",
  "fantasyPoolRecommendationsData.js",
  "fantasyPoolMatchdayProjectionsData.js",
  "fantasyPoolFinanceMetricsData.js",
  "fantasyPoolScorePredictionsData.js",
  "knockoutBracketPredictionData.js",
  "fantasyPoolOfficialDataStatusData.js",
  "liveMatchdayStatusData.js",
  "livePlayerStatusData.js",
  "r16FixtureAuthorityData.js",
  "qfFixtureAuthorityData.js",
  "sfFixtureAuthorityData.js",
  "finalRoundFixtureAuthorityData.js",
  "teamBuilderFinalRoundArtifactData.js",
  "worldCupData.js",
  "r32FixtureAuthorityData.js",
];

const activeDataFiles = [
  "players.json",
  "fantasyRules.json",
  "data/finalRoundFixtureAuthority_v1.json",
  "data/teamBuilderFinalRoundArtifact_v1.json",
  "data/teamBuilderQa_finalRound_v1.json",
  "data/finalRoundBuilderBrowserEquivalenceQa_v1.json",
  "data/fantasyPoolRecommendations_finalRound_v1.json",
  "data/fantasyPoolMatchdayProjections_finalRound_v1.json",
  "data/scorePredictions_fantasyPool_finalRound_v1.json",
  "data/playerRoleModel_finalRound_v1.json",
  "data/finalRoundCorePickLineupEvidenceQa_v1.json",
  "data/finalRoundThinProfilePlayerAudit_v1.json",
  "data/finalRoundEligiblePlayersQa_v1.json",
  "data/finalRoundReleaseQa_v1.json",
  "data/knockoutBracketPrediction_v1.json",
  "data/knockoutScorePredictor_v1.json",
  "data/liveMatchdayStatus_v1.json",
  "data/worldCupFixturesPageLiveScoresQa_v1.json",
  "data/matchEnvironmentLiveScoresQa_v1.json",
];

const sourceTruth = {
  fixtureAuthority: "data/finalRoundFixtureAuthority_v1.json",
  playerIdentity: "official_fantasy_player_id for official fantasy data; local player id for legacy players.json.",
  activeStage: "script.js defaultPublicMatchdayId = finalRound plus Final Round wrapper load order.",
  teamBuilderSquad: "data/teamBuilderFinalRoundArtifact_v1.json via teamBuilderFinalRoundArtifactData.js.",
  budgetRules: "fantasyRules.json and fantasyRulesData.js.",
  eligibleTeams: "data/finalRoundFixtureAuthority_v1.json fixtures[].team_a/team_b.",
  lineupEvidence: "data/sfLineupEvidenceForFinalRound_v1.json and data/playerRoleModel_finalRound_v1.json.",
  projections: "data/fantasyPoolMatchdayProjections_finalRound_v1.json via fantasyPoolMatchdayProjectionsData.js.",
  recommendations: "data/fantasyPoolRecommendations_finalRound_v1.json via fantasyPoolRecommendationsData.js.",
  bracketSlots: "stage fixture-authority files and data/knockoutBracketPrediction_v1.json.",
  scorePredictions: "data/scorePredictions_fantasyPool_finalRound_v1.json via fantasyPoolScorePredictionsData.js.",
};

const featureInventory = [
  {
    feature: "Homepage shell",
    sourceDataFile: "index.html",
    publicWrapper: "none",
    buildScript: "manual HTML",
    validationScript: "scripts/runLaunchBrowserQa.mjs / scripts/runPublicPreviewBrowserQa.mjs",
    browserQaCoverage: "public preview and launch browser smoke coverage, plus phase-specific browser QA reports",
    sourceOfTruth: "index.html",
    knownFallbackBehavior: "noscript cards only",
  },
  {
    feature: "Picks / Squad Builder Starter",
    sourceDataFile: "data/fantasyPoolRecommendations_finalRound_v1.json",
    publicWrapper: "fantasyPoolRecommendationsData.js",
    buildScript: "scripts/buildFantasyPoolRecommendationsFinalRoundV1.mjs",
    validationScript: "scripts/validateFinalRoundCorePickLineupEvidence.mjs, scripts/validateFinalRoundEligiblePlayersV1.mjs",
    browserQaCoverage: "included in public preview browser QA, but content-specific coverage is thinner than Team Builder equivalence",
    sourceOfTruth: sourceTruth.recommendations,
    knownFallbackBehavior: "script.js has historical matchday fallback copy for unavailable modes",
  },
  {
    feature: "Captain Watchlist",
    sourceDataFile: "data/fantasyPoolRecommendations_finalRound_v1.json",
    publicWrapper: "fantasyPoolRecommendationsData.js",
    buildScript: "scripts/buildFantasyPoolRecommendationsFinalRoundV1.mjs",
    validationScript: "scripts/validateFinalRoundCorePickLineupEvidence.mjs",
    browserQaCoverage: "public page render coverage; no dedicated captain-card content diff found",
    sourceOfTruth: sourceTruth.recommendations,
    knownFallbackBehavior: "derived in browser from recommendation rows",
  },
  {
    feature: "Player Profile",
    sourceDataFile: "players.json plus active recommendation/projection/finance wrappers",
    publicWrapper: "playersData.js, fantasyPoolRecommendationsData.js, fantasyPoolMatchdayProjectionsData.js, fantasyPoolFinanceMetricsData.js",
    buildScript: "scripts/buildFinalRoundFantasyArtifactsV1.mjs and upstream player-role/projection builders",
    validationScript: "data/playerProjectionQa_finalRound_v1.json and data/playerRoleModelQa_finalRound_v1.json",
    browserQaCoverage: "public browser QA renders profile surface, but source-field assertions are limited",
    sourceOfTruth: "generated active wrappers joined in script.js",
    knownFallbackBehavior: "display helpers use 'Needs check' fallbacks for missing detail values",
  },
  {
    feature: "Team Builder",
    sourceDataFile: "data/teamBuilderFinalRoundArtifact_v1.json",
    publicWrapper: "teamBuilderFinalRoundArtifactData.js",
    buildScript: "scripts/buildFinalRoundFantasyArtifactsV1.mjs",
    validationScript: "scripts/validateTeamBuilderFinalRoundV1.mjs, scripts/validateFinalRoundBuilderBrowserEquivalenceV1.mjs",
    browserQaCoverage: "data/finalRoundBuilderBrowserEquivalenceQa_v1.json asserts artifact/browser player, captain, vice, and candidate-pool equivalence",
    sourceOfTruth: sourceTruth.teamBuilderSquad,
    knownFallbackBehavior: "browser optimizer remains available for user locks/filters and historical matchday views",
  },
  {
    feature: "Match Environment / Score Prediction",
    sourceDataFile: "data/scorePredictions_fantasyPool_finalRound_v1.json",
    publicWrapper: "fantasyPoolScorePredictionsData.js",
    buildScript: "scripts/buildScorePredictionsFantasyPoolFinalRoundV1.mjs",
    validationScript: "scripts/validateMatchEnvironmentLiveScores.mjs and score QA reports",
    browserQaCoverage: "match-environment live-score QA exists; browser content assertions appear less complete than Team Builder",
    sourceOfTruth: sourceTruth.scorePredictions,
    knownFallbackBehavior: "score context helper defaults missing labels to neutral/needs-check text",
  },
  {
    feature: "Knockout Bracket Prediction",
    sourceDataFile: "data/knockoutBracketPrediction_v1.json",
    publicWrapper: "knockoutBracketPredictionData.js",
    buildScript: "scripts/buildKnockoutBracketPredictionV1.mjs",
    validationScript: "scripts/validateKnockoutBracketPredictionV1.mjs, scripts/validateBracketPathIntegrityV1.mjs",
    browserQaCoverage: "bracket QA reports plus public browser render checks",
    sourceOfTruth: sourceTruth.bracketSlots,
    knownFallbackBehavior: "actual-result overlay coexists with modeled historical path rows",
  },
  {
    feature: "Knockout Predictor",
    sourceDataFile: "data/knockoutScorePredictor_v1.json and active score predictions",
    publicWrapper: "knockoutScorePredictorData.js, fantasyPoolScorePredictionsData.js",
    buildScript: "scripts/buildKnockoutScorePredictorV1.mjs / scripts/buildScorePredictionsFantasyPoolFinalRoundV1.mjs",
    validationScript: "scripts/validateKnockoutBracketPredictionV1.mjs",
    browserQaCoverage: "render-level QA; model-specific browser assertions should be expanded",
    sourceOfTruth: "score prediction and knockout predictor generated artifacts",
    knownFallbackBehavior: "historical knockout model data remains loaded for explanatory bracket contexts",
  },
  {
    feature: "World Cup fixtures page",
    sourceDataFile: "worldCupData.js and fixture-authority wrappers",
    publicWrapper: "worldCupData.js, liveMatchdayStatusData.js, r32/r16/qf/sf/finalRoundFixtureAuthorityData.js",
    buildScript: "fixture authority builders by stage",
    validationScript: "scripts/validateWorldCupFixturesPageLiveScores.mjs and stage page validators",
    browserQaCoverage: "world-cup fixture page QA validates live-score display and final-round fixture mapping",
    sourceOfTruth: "worldCupData.js for schedule, stage fixture-authority files for knockout resolutions",
    knownFallbackBehavior: "falls back to placeholder bracket matches when an authority fixture is missing",
  },
  {
    feature: "Official fantasy wrappers / live status",
    sourceDataFile: "data/officialFantasyReadiness_finalRound_v1.json, data/liveMatchdayStatus_v1.json, data/livePlayerStatus_v1.json",
    publicWrapper: "fantasyPoolOfficialDataStatusData.js, liveMatchdayStatusData.js, livePlayerStatusData.js",
    buildScript: "scripts/refreshOfficialFantasyRoundStatuses.mjs, scripts/importLiveMatchdayStatus.mjs",
    validationScript: "scripts/validateOfficialDataReadiness.mjs, scripts/validateLiveFixtureMapping.mjs",
    browserQaCoverage: "used by public render checks, no dedicated live-official browser trace report found",
    sourceOfTruth: "official import/status artifacts with manual confirmation caveats",
    knownFallbackBehavior: "manual confirmation caveats when live rules/status are uncertain",
  },
];

function rel(file) {
  return path.relative(ROOT, file).replace(/\\/g, "/");
}

function exists(file) {
  return fs.existsSync(path.join(ROOT, file));
}

function readText(file) {
  return fs.readFileSync(path.join(ROOT, file), "utf8");
}

function readJson(file) {
  return JSON.parse(readText(file));
}

function stat(file) {
  const absolute = path.join(ROOT, file);
  return fs.existsSync(absolute) ? fs.statSync(absolute) : null;
}

function writeJson(file, data) {
  fs.writeFileSync(path.join(ROOT, file), `${JSON.stringify(data, null, 2)}\n`);
}

function writeText(file, data) {
  fs.writeFileSync(path.join(ROOT, file), data);
}

function parseScripts(htmlFile) {
  const html = readText(htmlFile);
  const scripts = [...html.matchAll(/<script\b([^>]*)\bsrc="([^"]+)"([^>]*)><\/script>/g)];
  return scripts.map((match, index) => {
    const src = match[2];
    const [file] = src.split("?");
    const cacheBust = src.match(CACHE_BUST_RE)?.[1] || null;
    return {
      order: index + 1,
      page: htmlFile,
      src,
      file,
      cacheBust,
      exists: exists(file),
    };
  });
}

function readWrapper(file) {
  if (!exists(file)) return {};
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(readText(file), sandbox, { filename: file, timeout: 5000 });
  return sandbox.window;
}

function loadWrappers(files = publicWrapperFiles) {
  const data = {};
  for (const file of files) {
    if (!exists(file)) continue;
    try {
      data[file] = readWrapper(file);
    } catch (error) {
      data[file] = { __wrapperError: error.message };
    }
  }
  return data;
}

function globalNamesFromWrapper(wrapperData) {
  return Object.values(wrapperData)
    .flatMap((entry) => Object.keys(entry || {}))
    .filter((name) => name !== "__wrapperError")
    .sort();
}

function extractActiveDataGlobals() {
  const script = readText("script.js");
  const match = script.match(/const ACTIVE_DATA = \{([\s\S]*?)\n\};/);
  const body = match?.[1] || "";
  const globals = [...body.matchAll(/window\.([A-Z0-9_]+)/g)].map((m) => m[1]);
  return [...new Set(globals)].sort();
}

function extractWorldCupGlobals() {
  const script = readText("worldCupPage.js");
  return [...new Set([...script.matchAll(/window\.([A-Z0-9_]+)/g)].map((m) => m[1]))].sort();
}

function activeVersionFromScript() {
  const script = readText("script.js");
  return script.match(/const ACTIVE_DATA_VERSION = "([^"]+)"/)?.[1] || null;
}

function defaultStageFromScript() {
  const script = readText("script.js");
  return script.match(/const defaultPublicMatchdayId = "([^"]+)"/)?.[1] || null;
}

function arrayFromObject(data, preferredKeys = []) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];
  for (const key of preferredKeys) {
    if (Array.isArray(data[key])) return data[key];
  }
  const first = Object.values(data).find(Array.isArray);
  return first || [];
}

function normalizedTeam(value) {
  return String(value || "").trim();
}

function normalizedSearchText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function playerName(row) {
  return row?.name || row?.player_name || row?.display_name || row?.web_name || "";
}

function playerTeam(row) {
  return normalizedTeam(row?.country || row?.team || row?.national_team || row?.team_name || row?.country_name);
}

function playerStage(row) {
  return String(
    row?.matchday_id ||
      row?.fantasy_matchday_id ||
      row?.active_matchday_id ||
      row?.stage ||
      row?.fixture_stage ||
      row?.matchday ||
      ""
  );
}

function playerId(row) {
  return String(row?.official_fantasy_player_id || row?.player_id || row?.id || "");
}

function recommendationRows(data) {
  return arrayFromObject(data, [
    "recommendationCandidates",
    "recommendations",
    "candidates",
    "players",
    "rows",
    "FANTASY_POOL_RECOMMENDATION_CANDIDATES",
  ]);
}

function projectionRows(data) {
  return arrayFromObject(data, ["playerMatchdayProjections", "projections", "players", "rows", "matchdayProjections"]);
}

function scoreFixtureRows(data) {
  return arrayFromObject(data, ["fixtureScorePredictions", "fixture_predictions", "fixtures", "rows"]);
}

function rowsWithTeamOutside(rows, eligible) {
  return rows
    .filter((row) => {
      const team = playerTeam(row) || normalizedTeam(row?.team_a?.team || row?.home_team || row?.team_a);
      const away = normalizedTeam(row?.team_b?.team || row?.away_team || row?.team_b);
      if (!team && !away) return false;
      return (team && !eligible.has(team)) || (away && !eligible.has(away));
    })
    .map((row) => ({
      name: playerName(row) || row?.fixture || row?.public_label || row?.round || row?.fixture_id || "row",
      team: playerTeam(row) || row?.team_a?.team || row?.home_team || row?.team_a || "",
      opponent: row?.opponent || row?.team_b?.team || row?.away_team || row?.team_b || "",
      stage: playerStage(row),
    }));
}

function findRowsByName(rows, names) {
  const needles = names.map(normalizedSearchText);
  return rows
    .filter((row) => needles.some((needle) => normalizedSearchText(playerName(row)).includes(needle)))
    .map((row) => ({ name: playerName(row), team: playerTeam(row), stage: playerStage(row), id: playerId(row) }));
}

function compact(value, max = 8) {
  return value.slice(0, max);
}

function issue(severity, area, message, evidence = {}) {
  return { severity, area, message, evidence };
}

function passFail(errors) {
  return errors.some((entry) => entry.severity === "fail" || entry.severity === "critical") ? "fail" : "pass";
}

function markdownList(items, fallback = "None found.") {
  if (!items?.length) return `- ${fallback}`;
  return items.map((item) => `- ${item}`).join("\n");
}

function issueList(issues) {
  if (!issues.length) return "- None found.";
  return issues
    .map((entry) => {
      const evidence = Object.keys(entry.evidence || {}).length
        ? ` Evidence: \`${JSON.stringify(entry.evidence).slice(0, 260)}\`.`
        : "";
      return `- **${entry.severity.toUpperCase()} / ${entry.area}:** ${entry.message}${evidence}`;
    })
    .join("\n");
}

function schemaStats(file) {
  if (!exists(file)) return null;
  let data;
  try {
    data = readJson(file);
  } catch (error) {
    return { file, parseError: error.message };
  }
  const rows = arrayFromObject(data, [
    "players",
    "recommendationCandidates",
    "playerMatchdayProjections",
    "recommendations",
    "projections",
    "fixtures",
    "selectedSquad",
    "fixtureScorePredictions",
  ]);
  const keyCounts = new Map();
  const nullCounts = new Map();
  const stageValues = new Set();
  const teamValues = new Set();
  for (const row of rows.slice(0, 1000)) {
    if (!row || typeof row !== "object") continue;
    for (const [key, value] of Object.entries(row)) {
      keyCounts.set(key, (keyCounts.get(key) || 0) + 1);
      if (value === null || value === undefined || value === "") nullCounts.set(key, (nullCounts.get(key) || 0) + 1);
    }
    if (playerStage(row)) stageValues.add(playerStage(row));
    if (playerTeam(row)) teamValues.add(playerTeam(row));
  }
  const s = stat(file);
  return {
    file,
    bytes: s?.size || 0,
    topLevelType: Array.isArray(data) ? "array" : "object",
    topLevelKeys: Array.isArray(data) ? [] : Object.keys(data),
    rowCount: rows.length,
    sampleKeys: [...keyCounts.keys()].slice(0, 45),
    missingOrNullFields: [...nullCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([key, count]) => ({ key, count })),
    stageValues: [...stageValues].slice(0, 20),
    teamValuesSample: [...teamValues].slice(0, 20),
    hasModelVersion: JSON.stringify(data).includes("modelVersion") || JSON.stringify(data).includes("model_version"),
    hasGeneratedAt: JSON.stringify(data).includes("generatedAt") || JSON.stringify(data).includes("generated_at"),
  };
}

function lineCount(file) {
  return exists(file) ? readText(file).split(/\r?\n/).length : 0;
}

function functionLengths(file) {
  const text = readText(file);
  const lines = text.split(/\r?\n/);
  const starts = [];
  lines.forEach((line, index) => {
    const match = line.match(/^\s*(?:async\s+)?function\s+([A-Za-z0-9_]+)\s*\(/);
    if (match) starts.push({ name: match[1], start: index + 1 });
  });
  return starts.map((start, index) => {
    const end = (starts[index + 1]?.start || lines.length + 1) - 1;
    return { file, name: start.name, start: start.start, lines: end - start.start + 1 };
  });
}

function listFiles(dir, predicate = () => true) {
  const base = path.join(ROOT, dir);
  if (!fs.existsSync(base)) return [];
  const out = [];
  for (const name of fs.readdirSync(base)) {
    const absolute = path.join(base, name);
    const relative = rel(absolute);
    if (fs.statSync(absolute).isDirectory()) continue;
    if (predicate(relative)) out.push(relative);
  }
  return out.sort();
}

function gitOutput(args) {
  try {
    return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trimEnd();
  } catch (error) {
    return String(error.stdout || error.message || "").trimEnd();
  }
}

function classifyWorktreePath(file) {
  if (file === ".gitignore") return "unrelated .gitignore";
  if (file.startsWith("analysis/")) return "unrelated refereeing/conspiracy analysis";
  if (/refereeingOutcomes|RefereeingOutcomes/.test(file)) return "unrelated research/referee files";
  if (/^scripts\/audit(PublicSiteArchitecture|FantasyCorrectness|DataModelElegance|ModelElegance|TeamBuilderElegance|QaCoverage|PublicDesign|CodeElegance|PerformanceDeployment|ReputationRisk)V1\.mjs$/.test(file)) return "audit-related";
  if (file === "scripts/lib/publicAuditV1.mjs" || file === "scripts/runFantasyEconomistFullAuditV1.mjs") return "audit-related";
  if (/^data\/(publicSiteArchitecture|fantasyCorrectness|dataModelElegance|modelElegance|teamBuilderElegance|qaCoverage|publicDesign|codeElegance|performanceDeployment|reputationRisk|fantasyEconomistFull)Audit.*_v1\.(json|md)$/.test(file)) return "audit-related";
  if (/Data\.js$/.test(file)) return "public wrappers";
  if (file.startsWith("data/") && /\.(json|md|csv)$/.test(file)) return "generated data";
  if (["index.html", "world-cup.html", "script.js", "worldCupPage.js", "style.css"].includes(file)) return "fantasy-site-related";
  return "unknown";
}

function worktreeScopeGate() {
  const statusShort = gitOutput(["status", "--short"]);
  const diffStat = gitOutput(["diff", "--stat"]);
  const diffNameOnly = gitOutput(["diff", "--name-only"]);
  const entries = statusShort
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const status = line.slice(0, 2).trim();
      const file = line.slice(3).trim();
      return { status, file, classification: classifyWorktreePath(file) };
    });
  const byClassification = entries.reduce((acc, entry) => {
    acc[entry.classification] = acc[entry.classification] || [];
    acc[entry.classification].push(entry.file);
    return acc;
  }, {});
  const unrelated = entries.filter((entry) => entry.classification.startsWith("unrelated"));
  return {
    git_status_short: statusShort,
    git_diff_stat: diffStat,
    git_diff_name_only: diffNameOnly,
    entries,
    by_classification: byClassification,
    unrelated_files_present: unrelated.length > 0,
    scoped_commit_possible: entries.every((entry) => entry.classification !== "unknown"),
    commit_scope_instruction: "Stage only audit-related scripts/reports for this audit. Do not stage refereeing, analysis, .gitignore, public wrapper, or pre-existing generated-data changes.",
  };
}

function activeContext() {
  const indexScripts = parseScripts("index.html");
  const worldCupScripts = parseScripts("world-cup.html");
  const wrapperFiles = [...new Set(
    [...indexScripts, ...worldCupScripts]
      .map((s) => s.file)
      .filter((f) => f.endsWith(".js") && f !== "script.js" && f !== "worldCupPage.js")
  )];
  const wrappers = loadWrappers(wrapperFiles);
  const finalAuthority = readJson("data/finalRoundFixtureAuthority_v1.json");
  const eligibleTeams = new Set(
    (finalAuthority.fixtures || []).flatMap((fixture) => [fixture.team_a?.team, fixture.team_b?.team].filter(Boolean))
  );
  const rules = readJson("fantasyRules.json");
  const artifact = readJson("data/teamBuilderFinalRoundArtifact_v1.json");
  const recommendations = readJson("data/fantasyPoolRecommendations_finalRound_v1.json");
  const projections = readJson("data/fantasyPoolMatchdayProjections_finalRound_v1.json");
  const scores = readJson("data/scorePredictions_fantasyPool_finalRound_v1.json");
  return {
    indexScripts,
    worldCupScripts,
    wrappers,
    globals: globalNamesFromWrapper(wrappers),
    activeDataGlobals: extractActiveDataGlobals(),
    worldCupGlobals: extractWorldCupGlobals(),
    activeVersion: activeVersionFromScript(),
    defaultStage: defaultStageFromScript(),
    finalAuthority,
    eligibleTeams,
    rules,
    artifact,
    recommendations,
    projections,
    scores,
  };
}

export function buildArchitectureAudit() {
  const ctx = activeContext();
  const scriptLoadOrder = [...ctx.indexScripts, ...ctx.worldCupScripts];
  const cacheVersions = scriptLoadOrder.map(({ page, file, cacheBust }) => ({ page, file, cacheBust }));
  const conceptSources = Object.entries(sourceTruth).map(([concept, source]) => ({ concept, source }));
  const duplicates = [
    issue("warn", "Team Builder", "Generated Final Round artifact is the public default, but a full browser optimizer remains in script.js for user locks and historical views.", {
      artifact: "data/teamBuilderFinalRoundArtifact_v1.json",
      browserLogic: "script.js",
    }),
    issue("warn", "Active stage", "Historical matchday options and fallback wording remain in the active Team Builder controls; acceptable if intentionally historical, but not elegant for a stage-scoped public default.", {
      defaultStage: ctx.defaultStage,
    }),
    issue("warn", "Budget/rules", "Budget source is rules-driven in code, but Stats Notes still contain legacy $100m copy that can confuse the Final Round 105 rule.", {
      file: "index.html",
    }),
  ];
  const audit = {
    schema_version: "public_site_architecture_audit_v1",
    generated_at: new Date().toISOString(),
    status: "pass",
    pages: ["index.html", "world-cup.html"],
    active_data_version: ctx.activeVersion,
    active_default_stage: ctx.defaultStage,
    script_load_order: scriptLoadOrder,
    cache_bust_versions: cacheVersions,
    exposed_globals: ctx.globals,
    script_active_data_globals: ctx.activeDataGlobals,
    world_cup_page_globals: ctx.worldCupGlobals,
    public_features: featureInventory,
    source_of_truth_by_concept: conceptSources,
    competing_source_findings: duplicates,
  };
  return audit;
}

export function renderArchitectureMarkdown(audit) {
  return `# Public Site Architecture Audit v1

Generated: ${audit.generated_at}

Status: **${audit.status}**

## Active Public Load

- Active data version in \`script.js\`: \`${audit.active_data_version}\`
- Active default stage: \`${audit.active_default_stage}\`
- Pages audited: ${audit.pages.join(", ")}

## Script Load Order

${audit.script_load_order.map((script) => `- ${script.page}: ${script.order}. \`${script.src}\``).join("\n")}

## Public Globals Used

${markdownList(audit.exposed_globals.map((name) => `\`${name}\``))}

## Feature Inventory

${audit.public_features
  .map((feature) => `- **${feature.feature}:** source \`${feature.sourceDataFile}\`, wrapper \`${feature.publicWrapper}\`, build \`${feature.buildScript}\`, validation \`${feature.validationScript}\`. Fallback: ${feature.knownFallbackBehavior}`)
  .join("\n")}

## Source-Of-Truth Map

${audit.source_of_truth_by_concept.map((entry) => `- **${entry.concept}:** ${entry.source}`).join("\n")}

## Competing Source Findings

${issueList(audit.competing_source_findings)}
`;
}

export function buildCorrectnessAudit() {
  const ctx = activeContext();
  const issues = [];
  const eligible = ctx.eligibleTeams;
  const targetNames = ["Lerma", "Raphinha", "Vinicius"];
  const forbiddenTeams = ["Brazil", "Colombia"];
  const recRows = recommendationRows(ctx.recommendations);
  const projRows = projectionRows(ctx.projections);
  const scoreRows = scoreFixtureRows(ctx.scores);
  const artifactRows = ctx.artifact.selectedSquad || [];
  const allPlayerRows = [
    ...recRows.map((row) => ({ ...row, __surface: "recommendations" })),
    ...projRows.map((row) => ({ ...row, __surface: "projections" })),
    ...artifactRows.map((row) => ({ ...row, __surface: "teamBuilderArtifact" })),
  ];

  const budget = Number(ctx.artifact?.constraintsUsed?.initial_budget ?? ctx.rules?.budget?.initial_budget);
  if (budget !== 105) {
    issues.push(issue("fail", "Team Builder budget", "Final Round Team Builder budget is not 105.", { budget }));
  }

  const surfacesOutside = {
    recommendations: rowsWithTeamOutside(recRows, eligible),
    projections: rowsWithTeamOutside(projRows, eligible),
    artifact: rowsWithTeamOutside(artifactRows, eligible),
  };
  for (const [surface, rows] of Object.entries(surfacesOutside)) {
    if (rows.length) {
      issues.push(issue("fail", "Eligible teams", `${surface} contains teams outside Final/Third Place eligibility.`, { sample: compact(rows) }));
    }
  }

  const forbiddenNameRows = findRowsByName(allPlayerRows, targetNames);
  if (forbiddenNameRows.length) {
    issues.push(issue("fail", "Eliminated players", "Target eliminated players appear in an active Final Round player surface.", { rows: forbiddenNameRows }));
  }

  const forbiddenTeamRows = allPlayerRows.filter((row) => forbiddenTeams.includes(playerTeam(row)));
  if (forbiddenTeamRows.length) {
    issues.push(issue("fail", "Eliminated teams", "Brazil or Colombia players appear in active Final Round player surfaces.", { sample: compact(forbiddenTeamRows.map((row) => ({ name: playerName(row), team: playerTeam(row), surface: row.__surface }))) }));
  }

  const artifactNames = new Set(artifactRows.map(playerName));
  const equivalence = exists("data/finalRoundBuilderBrowserEquivalenceQa_v1.json")
    ? readJson("data/finalRoundBuilderBrowserEquivalenceQa_v1.json")
    : null;
  if (equivalence?.status !== "pass" || equivalence?.checks?.generated_and_browser_selected_players_match !== true) {
    issues.push(issue("fail", "Team Builder browser equivalence", "Final Round browser Team Builder does not have passing artifact equivalence QA.", { status: equivalence?.status, checks: equivalence?.checks }));
  }

  const scoreOutside = scoreRows.filter((row) => {
    const teams = [row.team_a?.team, row.team_b?.team, row.home_team, row.away_team, row.team_a, row.team_b, row.home, row.away]
      .map(normalizedTeam)
      .filter(Boolean);
    return teams.length && teams.some((team) => !eligible.has(team));
  });
  if (scoreOutside.length) {
    issues.push(issue("fail", "Score predictions", "Score prediction rows include non-Final Round teams.", { sample: compact(scoreOutside) }));
  }

  const sourceFixtureAsSlot = (ctx.finalAuthority.fixtures || []).filter((fixture) =>
    fixture.source_fixture_id_role !== "feed_source_id_only_not_bracket_slot"
  );
  if (sourceFixtureAsSlot.length) {
    issues.push(issue("fail", "Fixture identifiers", "Final Round fixture authority does not clearly mark source fixture IDs as metadata.", { sample: sourceFixtureAsSlot }));
  }

  const corePickQa = exists("data/finalRoundCorePickLineupEvidenceQa_v1.json")
    ? readJson("data/finalRoundCorePickLineupEvidenceQa_v1.json")
    : null;
  if (corePickQa?.status !== "pass") {
    issues.push(issue("fail", "Core Pick evidence", "Core Pick lineup-evidence QA is not passing.", { status: corePickQa?.status, errors: corePickQa?.errors }));
  }

  const thinQa = exists("data/finalRoundThinProfilePlayerAudit_v1.json")
    ? readJson("data/finalRoundThinProfilePlayerAudit_v1.json")
    : null;
  const thinText = exists("data/finalRoundThinProfilePlayerAudit_v1.json")
    ? readText("data/finalRoundThinProfilePlayerAudit_v1.json")
    : "";
  for (const name of ["Trevoh Chalobah", "Marcos Senesi"]) {
    if (!thinText.includes(name)) {
      issues.push(issue("warn", "Thin-profile guard", `${name} is not named in the thin-profile audit artifact.`, { file: "data/finalRoundThinProfilePlayerAudit_v1.json" }));
    }
    if (artifactNames.has(name)) {
      issues.push(issue("fail", "Thin-profile guard", `${name} is selected in the Team Builder artifact.`, { name }));
    }
  }

  const activeFallbackMatches = [...readText("script.js").matchAll(/fallback/gi)].length;
  if (activeFallbackMatches > 40) {
    issues.push(issue("warn", "Fallback discipline", "script.js contains many fallback paths; Final Round is currently safe, but hidden fallbacks reduce auditability.", { fallbackMentions: activeFallbackMatches }));
  }

  const statsNotesBudgetLegacy = readText("index.html").includes("$100m starting budget");
  if (statsNotesBudgetLegacy) {
    issues.push(issue("warn", "Public copy", "Stats Notes still say $100m starting budget while Final Round budget is 105.", { file: "index.html" }));
  }

  const finalRoundEligibleTeams = [...eligible].sort();
  const audit = {
    schema_version: "fantasy_correctness_audit_v1",
    generated_at: new Date().toISOString(),
    status: passFail(issues),
    eligible_teams_from_fixture_authority: finalRoundEligibleTeams,
    final_round_fixtures: (ctx.finalAuthority.fixtures || []).map((fixture) => ({
      bracket_slot_id: fixture.bracket_slot_id,
      round: fixture.round,
      teams: [fixture.team_a?.team, fixture.team_b?.team],
      status: fixture.status,
      source_fixture_id_role: fixture.source_fixture_id_role,
    })),
    checks: {
      team_builder_budget: budget,
      team_builder_selected_count: artifactRows.length,
      browser_equivalence_status: equivalence?.status || "missing",
      core_pick_lineup_evidence_status: corePickQa?.status || "missing",
      thin_profile_status: thinQa?.status || "missing",
      targeted_eliminated_player_hits: forbiddenNameRows,
      targeted_eliminated_team_hits: compact(forbiddenTeamRows.map((row) => ({ name: playerName(row), team: playerTeam(row), surface: row.__surface })), 20),
      score_prediction_fixture_count: scoreRows.length,
    },
    issues,
  };
  return audit;
}

export function renderCorrectnessMarkdown(audit) {
  return `# Fantasy Correctness Audit v1

Generated: ${audit.generated_at}

Status: **${audit.status}**

## Final Round Boundary

- Eligible teams from fixture authority: ${audit.eligible_teams_from_fixture_authority.join(", ")}
- Fixtures: ${audit.final_round_fixtures.map((fixture) => `${fixture.bracket_slot_id} ${fixture.round} (${fixture.teams.join(" v ")})`).join("; ")}
- Team Builder budget checked: ${audit.checks.team_builder_budget}
- Browser/artifact equivalence: ${audit.checks.browser_equivalence_status}
- Core Pick lineup evidence QA: ${audit.checks.core_pick_lineup_evidence_status}

## Targeted Leakage Checks

- Lerma / Raphinha / Vinicius hits: ${audit.checks.targeted_eliminated_player_hits.length}
- Brazil / Colombia active player hits: ${audit.checks.targeted_eliminated_team_hits.length}
- Score prediction fixture rows checked: ${audit.checks.score_prediction_fixture_count}

## Issues

${issueList(audit.issues)}
`;
}

export function buildDataModelAudit() {
  const schemas = activeDataFiles.filter(exists).map(schemaStats).filter(Boolean);
  const wrapperStats = publicWrapperFiles.filter(exists).map((file) => ({
    file,
    bytes: stat(file)?.size || 0,
    globals: Object.keys(readWrapper(file)),
  }));
  const issues = [];
  const largeFiles = schemas.filter((entry) => entry.bytes > 1_000_000).map((entry) => entry.file);
  if (largeFiles.length) {
    issues.push(issue("warn", "Public data size", "Some active or adjacent public data files are large enough to deserve compaction or internal/public splitting.", { largeFiles }));
  }
  const missingMetadata = schemas.filter((entry) => !entry.hasGeneratedAt || !entry.hasModelVersion).map((entry) => entry.file);
  if (missingMetadata.length) {
    issues.push(issue("warn", "Schema metadata", "Several active files lack generatedAt/modelVersion style metadata.", { files: missingMetadata }));
  }
  issues.push(issue("warn", "Identifier naming", "The codebase uses id, player_id, official_fantasy_player_id, fixture_id, source_fixture_id, and bracket_slot_id. The Final Round artifacts are mostly explicit, but the mixed historical vocabulary slows review.", {}));
  issues.push(issue("warn", "Public/internal fields", "Generated player rows carry model internals such as strategicCompositeScore, penalties, and diagnostics into public wrappers. That is useful for QA but should be intentionally split for client-facing artifacts.", {}));

  return {
    schema_version: "data_model_elegance_audit_v1",
    generated_at: new Date().toISOString(),
    status: "pass",
    active_data_files: schemas,
    public_wrapper_files: wrapperStats,
    issues,
    recommended_target_schema: {
      stage_id: "finalRound",
      player_identity: {
        official_fantasy_player_id: "string, required for official fantasy pool rows",
        model_player_key: "stable internal key when official id is missing",
      },
      fixture_identity: {
        bracket_slot_id: "M103/M104-style tournament slot",
        source_fixture_id: "feed metadata only",
        fixture_stage: "final | third_place",
      },
      role_evidence: {
        role_evidence_type: "explicit_sf_starter | explicit_sf_substitute | points_only | inferred_prior",
        starter_claim_allowed: "boolean tied only to lineup evidence",
      },
      public_row: "compact display fields only",
      internal_diagnostics: "separate artifact keyed by player id and model version",
    },
  };
}

export function renderDataModelMarkdown(audit) {
  return `# Data Model Elegance Audit v1

Generated: ${audit.generated_at}

Status: **${audit.status}**

## Active File Schema Summary

${audit.active_data_files.map((entry) => `- \`${entry.file}\`: ${entry.rowCount} rows, ${entry.bytes} bytes, keys ${entry.sampleKeys.slice(0, 12).join(", ") || "top-level only"}`).join("\n")}

## Public Wrapper Summary

${audit.public_wrapper_files.map((entry) => `- \`${entry.file}\`: ${entry.bytes} bytes, globals ${entry.globals.join(", ")}`).join("\n")}

## Issues

${issueList(audit.issues)}

## Recommended Target Schema

\`\`\`json
${JSON.stringify(audit.recommended_target_schema, null, 2)}
\`\`\`
`;
}

export function buildModelAudit() {
  const script = readText("script.js");
  const modelDocs = [
    "data/scorePredictionModel_finalRound_v1.md",
    "data/playerRoleModel_finalRound_v1.md",
    "data/playerProjectionModel_finalRound_v1.md",
    "data/recommendationModel_finalRound_v1.md",
    "data/teamBuilderModel_finalRound_v1.md",
    "data/knockoutBracketPredictionModel_v1.md",
    "data/knockoutScorePredictor_v1.json",
    "data/thirdPlaceHistoricalProfileReport_v1.md",
  ].filter(exists);
  const modelAreas = [
    ["score prediction model", "data/scorePredictionModel_finalRound_v1.md", "data/scorePredictions_fantasyPool_finalRound_v1.json"],
    ["PELE/team-quality layer", "data/peleRefreshAudit_finalRound_v1.json", "data/teamQuality_fantasyPool_v3.json"],
    ["player role/start probability model", "data/playerRoleModel_finalRound_v1.md", "data/playerRoleModel_finalRound_v1.json"],
    ["lineup evidence model", "data/sfLineupEvidenceForFinalRound_v1.json", "data/finalRoundCorePickLineupEvidenceQa_v1.json"],
    ["player projection model", "data/playerProjectionModel_finalRound_v1.md", "data/fantasyPoolMatchdayProjections_finalRound_v1.json"],
    ["recommendation model", "data/recommendationModel_finalRound_v1.md", "data/fantasyPoolRecommendations_finalRound_v1.json"],
    ["Team Builder objective", "data/teamBuilderModel_finalRound_v1.md", "data/teamBuilderFinalRoundArtifact_v1.json"],
    ["Final Round fixture optionality layer", "scripts/buildFinalRoundFantasyArtifactsV1.mjs", "data/teamBuilderFinalRoundArtifact_v1.json"],
    ["Third Place historical modifier", "data/thirdPlaceHistoricalProfileReport_v1.md", "data/thirdPlaceHistoricalProfile_v1.json"],
    ["knockout prediction model", "data/knockoutScorePredictor_v1.json", "knockoutScorePredictorData.js"],
    ["bracket prediction model", "data/knockoutBracketPredictionModel_v1.md", "data/knockoutBracketPrediction_v1.json"],
  ].map(([purpose, source, output]) => ({
    purpose,
    source_of_truth: exists(source) ? source : "not found",
    primary_output: exists(output) ? output : "not found",
    assumptions: exists(source) ? "Documented in source artifact/model note; verify any weights against implementation before client handoff." : "Missing explicit model note.",
    qa_coverage: "Covered by phase-specific QA where available; browser QA strongest for Team Builder equivalence.",
    public_explanation: "Explained in Stats Notes and public section copy, but model internals are verbose.",
    risks: [
      source.includes("script") ? "model logic sits in browser/runtime code" : "artifact/doc split can drift",
      "magic numbers need central rationale table",
    ],
  }));
  const numericLiterals = [...script.matchAll(/(?<![A-Za-z0-9_])(\d+\.\d+|\d{2,})(?![A-Za-z0-9_])/g)].length;
  const issues = [
    issue("warn", "Magic numbers", "script.js contains many numeric weights/thresholds. Several are likely legitimate strategy weights, but they are not centralized in a single model contract.", { numericLiteralMentions: numericLiterals }),
    issue("warn", "Browser model logic", "Team Builder ranking, portfolio adjustment, and fallback scoring still live in script.js alongside UI rendering.", { file: "script.js" }),
    issue("warn", "Duplicated logic risk", "Generated artifact and browser optimizer are kept equivalent by QA, but two executable paths remain for the same concept.", { artifact: "data/teamBuilderFinalRoundArtifact_v1.json", browser: "script.js" }),
    issue("warn", "Public precision", "Public copy generally uses caveats, but detailed numeric indices can read more precise than the evidence supports unless the caveat remains nearby.", {}),
  ];
  return {
    schema_version: "model_elegance_audit_v1",
    generated_at: new Date().toISOString(),
    status: "pass",
    model_docs_found: modelDocs,
    models: modelAreas,
    implementation_observations: {
      script_js_numeric_literal_mentions: numericLiterals,
      fallback_mentions: [...script.matchAll(/fallback/gi)].length,
      ownership_mentions: [...script.matchAll(/ownership/gi)].length,
    },
    issues,
  };
}

export function renderModelMarkdown(audit) {
  return `# Model Elegance Audit v1

Generated: ${audit.generated_at}

Status: **${audit.status}**

## Models

${audit.models.map((model) => `- **${model.purpose}:** source \`${model.source_of_truth}\`, output \`${model.primary_output}\`. QA: ${model.qa_coverage}`).join("\n")}

## Implementation Observations

- Numeric literal mentions in \`script.js\`: ${audit.implementation_observations.script_js_numeric_literal_mentions}
- Fallback mentions in \`script.js\`: ${audit.implementation_observations.fallback_mentions}
- Ownership mentions in \`script.js\`: ${audit.implementation_observations.ownership_mentions}

## Issues

${issueList(audit.issues)}
`;
}

export function buildTeamBuilderAudit() {
  const ctx = activeContext();
  const artifact = ctx.artifact;
  const qa = exists("data/finalRoundBuilderBrowserEquivalenceQa_v1.json")
    ? readJson("data/finalRoundBuilderBrowserEquivalenceQa_v1.json")
    : {};
  const teamQa = exists("data/teamBuilderQa_finalRound_v1.json") ? readJson("data/teamBuilderQa_finalRound_v1.json") : {};
  const selected = artifact.selectedSquad || [];
  const totalPrice = selected.reduce((sum, row) => sum + Number(row.price || 0), 0);
  const byTeam = selected.reduce((acc, row) => {
    acc[playerTeam(row)] = (acc[playerTeam(row)] || 0) + 1;
    return acc;
  }, {});
  const issues = [];
  if (qa.status !== "pass") {
    issues.push(issue("fail", "Browser equivalence", "Browser Team Builder equivalence QA is not passing.", { status: qa.status }));
  }
  if (artifact?.constraintsUsed?.initial_budget !== 105) {
    issues.push(issue("fail", "Budget", "Generated Final Round artifact budget is not 105.", { budget: artifact?.constraintsUsed?.initial_budget }));
  }
  if ((artifact?.constraintsUsed?.eligible_teams || []).some((team) => !ctx.eligibleTeams.has(team))) {
    issues.push(issue("fail", "Eligible teams", "Artifact eligible teams differ from fixture authority.", { artifactTeams: artifact?.constraintsUsed?.eligible_teams, authorityTeams: [...ctx.eligibleTeams] }));
  }
  if (readText("script.js").includes("function buildTeamFromLockedPlayers")) {
    issues.push(issue("warn", "Duplicate optimizer", "Browser optimizer remains in script.js for interactive locks/substitutions; public default is artifact-backed, but the duplicate path should be further isolated or generated.", { function: "buildTeamFromLockedPlayers" }));
  }
  return {
    schema_version: "team_builder_elegance_audit_v1",
    generated_at: new Date().toISOString(),
    status: passFail(issues),
    objective_plain_english: artifact.objectiveExplanation,
    constraints_plain_english: {
      squad_size: selected.length,
      formation: artifact.strategy?.formation,
      budget: artifact.constraintsUsed?.initial_budget,
      country_limit: artifact.constraintsUsed?.country_limit,
      eligible_teams: artifact.constraintsUsed?.eligible_teams,
      active_stage: artifact.constraintsUsed?.matchday,
      ownership_used_as_signal: artifact.constraintsUsed?.ownership_used_as_signal,
      final_squads_source_backed: artifact.constraintsUsed?.final_squads_source_backed,
    },
    selected_squad_summary: {
      count: selected.length,
      total_price: Number(totalPrice.toFixed(1)),
      by_team: byTeam,
      captain: artifact.captain?.name || artifact.captain || qa.generated_artifact?.captain,
      vice_captain: artifact.viceCaptain?.name || artifact.vice_captain?.name || qa.generated_artifact?.viceCaptain,
    },
    browser_equivalence: {
      status: qa.status || "missing",
      checks: qa.checks || {},
      browser_message: qa.browser_default?.message || "",
    },
    team_builder_qa_status: teamQa.status || "missing",
    artifact_traceability: "Public default loads teamBuilderFinalRoundArtifactData.js before script.js; script.js checks finalRoundTeamBuilderArtifact() for active Final Round default.",
    remaining_duplicate_optimizer_logic: true,
    issues,
  };
}

export function renderTeamBuilderMarkdown(audit) {
  return `# Team Builder Elegance Audit v1

Generated: ${audit.generated_at}

Status: **${audit.status}**

## Objective

${audit.objective_plain_english}

## Constraints

- Stage: ${audit.constraints_plain_english.active_stage}
- Formation: ${audit.constraints_plain_english.formation}
- Squad size: ${audit.constraints_plain_english.squad_size}
- Budget: ${audit.constraints_plain_english.budget}
- Country limit: ${audit.constraints_plain_english.country_limit}
- Eligible teams: ${audit.constraints_plain_english.eligible_teams.join(", ")}
- Ownership used as signal: ${audit.constraints_plain_english.ownership_used_as_signal}
- Final squads source-backed: ${audit.constraints_plain_english.final_squads_source_backed}

## Browser Equivalence

- Status: ${audit.browser_equivalence.status}
- Message: ${audit.browser_equivalence.browser_message}

## Remaining Duplicate Optimizer Logic

${audit.remaining_duplicate_optimizer_logic ? "- Browser optimizer remains for interactive workflows; artifact is the public default." : "- None found."}

## Issues

${issueList(audit.issues)}
`;
}

export function buildQaCoverageAudit() {
  const scripts = listFiles("scripts", (file) => /\.(mjs|py|sh)$/.test(file));
  const qaScripts = scripts.filter((file) => /validate|Qa|QA|audit|runPublic|runLaunch/.test(file));
  const qaReports = listFiles("data", (file) => /(Qa|QA|Audit|audit).*(_v\d+)?\.(json|md)$/.test(path.basename(file))).filter((file) => !file.includes("refereeingOutcomes"));
  const pastBugs = [
    ["stale MD2/MD3 data path", ["validateActiveFantasyDataFlow.mjs", "activeFantasyDataFlowQa"]],
    ["wrong source fixture ID as bracket slot", ["validateBracketPathIntegrityV1.mjs", "bracketPathIntegrityAudit"]],
    ["France/Argentina impossible bracket path", ["validateBracketPathIntegrityV1.mjs", "knockoutBracketPredictionQa"]],
    ["Medina Core Pick despite non-start", ["validateFinalRoundCorePickLineupEvidence.mjs", "finalRoundCorePickLineupEvidenceQa"]],
    ["eliminated players in Final Round Builder", ["validateFinalRoundEligiblePlayersV1.mjs", "finalRoundEliminatedPlayerBugAudit"]],
    ["generated/browser Team Builder mismatch", ["validateFinalRoundBuilderBrowserEquivalenceV1.mjs", "finalRoundBuilderBrowserEquivalenceQa"]],
    ["Final Round budget 100 instead of 105", ["validateTeamBuilderFinalRoundV1.mjs", "teamBuilderQa_finalRound"]],
    ["browser fallback to historical projection rows", ["validateFinalRoundBuilderBrowserEquivalenceV1.mjs", "activeFantasyDataFlowQa"]],
    ["no Third Place exposure without explanation", ["validateFinalRoundFixtureExposureStrategyV1.mjs", "finalRoundFixtureExposureStrategyQa"]],
  ].map(([bug, needles]) => ({
    bug,
    evidence: qaScripts.concat(qaReports).filter((file) => needles.some((needle) => file.includes(needle))),
    covered: qaScripts.concat(qaReports).some((file) => needles.some((needle) => file.includes(needle))),
  }));
  const issues = [
    issue("warn", "Browser assertions", "Team Builder equivalence has strong content assertions; other surfaces rely more on render/status QA and should assert actual player/fixture text.", {}),
    issue("warn", "QA sprawl", "There are many stage-specific QA scripts with similar responsibilities. A top-client codebase would benefit from a single manifest-driven active-stage QA runner.", { qaScriptCount: qaScripts.length }),
    issue("warn", "Deployment assertions", "GitHub Pages smoke coverage is present historically, but the active audit found no single current deployment gate that replays all public Final Round content assertions.", {}),
  ];
  return {
    schema_version: "qa_coverage_audit_v1",
    generated_at: new Date().toISOString(),
    status: "pass",
    qa_scripts: qaScripts.map((file) => ({
      file,
      validates_generated_data: /validate|audit/.test(path.basename(file)),
      validates_public_wrappers: /Active|WorldCup|BuilderBrowser|PublicPreview|Launch/.test(path.basename(file)),
      validates_browser_rendered_content: /Browser|Launch|PublicPreview/.test(path.basename(file)),
      validates_deployed_site: /Launch|Deployment|PublicPreview/.test(path.basename(file)),
    })),
    qa_reports: qaReports,
    past_bug_coverage: pastBugs,
    top_five_improvements: [
      "Add one active-stage QA manifest that declares every public surface, source artifact, wrapper, and browser assertion.",
      "Extend browser assertions for Picks, Captain Watchlist, Match Environment, and World Cup Guide to verify exact expected names/fixtures, not just rendered content.",
      "Add deployed-site parity checks against local validated artifacts after every cache-bust promotion.",
      "Centralize eliminated-team/player leakage checks across recommendations, projections, score predictions, Team Builder artifact, and rendered DOM.",
      "Retire or archive historical stage QA from the default active-stage command so reviewers see one current gate first.",
    ],
    issues,
  };
}

export function renderQaCoverageMarkdown(audit) {
  return `# QA Coverage Audit v1

Generated: ${audit.generated_at}

Status: **${audit.status}**

## QA Inventory

- QA scripts inventoried: ${audit.qa_scripts.length}
- QA reports inventoried: ${audit.qa_reports.length}

## Past Bug Coverage

${audit.past_bug_coverage.map((row) => `- ${row.covered ? "Covered" : "Gap"}: ${row.bug} (${row.evidence.join(", ") || "no evidence found"})`).join("\n")}

## Top Five Improvements

${markdownList(audit.top_five_improvements)}

## Issues

${issueList(audit.issues)}
`;
}

export function buildPublicDesignAudit() {
  const index = readText("index.html");
  const world = readText("world-cup.html");
  const style = readText("style.css");
  const issues = [];
  if (index.includes("$100m starting budget")) {
    issues.push(issue("warn", "Copy accuracy", "Stats Notes still explain the base $100m squad rule without nearby Final Round +5 context.", { text: "$100m starting budget" }));
  }
  if ([...index.matchAll(/fallback|Needs check|confirm|verify|manual/gi)].length > 80) {
    issues.push(issue("warn", "Copy density", "The page is responsibly caveated, but the cumulative warning/manual language can make it feel closer to a debug dashboard than a finished product.", {}));
  }
  if (style.length > 120_000) {
    issues.push(issue("warn", "CSS size", "Single large stylesheet makes visual QA and future cleanup harder.", { bytes: style.length }));
  }
  return {
    schema_version: "public_design_audit_v1",
    generated_at: new Date().toISOString(),
    status: "pass",
    surfaces_audited: [
      "homepage",
      "Picks",
      "Captain Watchlist",
      "Player Profile",
      "Team Builder",
      "Match Environment",
      "Knockout Bracket",
      "Knockout Prediction",
      "World Cup fixtures page",
      "Sources/caveats",
      "mobile layout via CSS structure",
    ],
    strengths: [
      "Final Round framing is prominent in hero, Team Builder, Match Environment, and World Cup status copy.",
      "Risk/caveat language is visible and avoids official/FIFA overclaiming.",
      "World Cup facts are separated from fantasy recommendations.",
      "Team Builder workflow is ordered and user-action oriented.",
    ],
    weaknesses: [
      "Stats Notes are long and contain legacy group-stage budget copy that can confuse Final Round users.",
      "Many badges, caveats, and explanatory panels compete for attention.",
      "Several sections expose model vocabulary that casual fantasy users may not immediately understand.",
      "The site has a credible tool feel, but could be cleaner with a shorter current-stage summary and archived methodology details.",
    ],
    recommended_cleanup: [
      "Move historical/group-stage method notes behind an archive/details layer for Final Round.",
      "Update budget copy to explicitly say base 100 plus Final Round increase to 105.",
      "Make each active surface show one concise source/caveat line and link to deeper notes.",
      "Add content-specific mobile QA screenshots for Team Builder, Picks, and Match Environment.",
    ],
    issues,
  };
}

export function renderPublicDesignMarkdown(audit) {
  return `# Public Design And Copy Audit v1

Generated: ${audit.generated_at}

Status: **${audit.status}**

## Strengths

${markdownList(audit.strengths)}

## Weaknesses

${markdownList(audit.weaknesses)}

## Recommended Cleanup

${markdownList(audit.recommended_cleanup)}

## Issues

${issueList(audit.issues)}
`;
}

export function buildCodeEleganceAudit() {
  const codeFiles = ["script.js", "worldCupPage.js", "style.css", ...listFiles("scripts", (file) => file.endsWith(".mjs") && !file.includes("Refereeing"))];
  const fileMetrics = codeFiles.filter(exists).map((file) => ({ file, lines: lineCount(file), bytes: stat(file)?.size || 0 }));
  const functions = ["script.js", "worldCupPage.js"].filter(exists).flatMap(functionLengths).sort((a, b) => b.lines - a.lines);
  const script = readText("script.js");
  const scores = {
    correctness: 4,
    elegance: 3,
    maintainability: 3,
    testability: 3,
    data_architecture: 3,
    model_transparency: 3,
    ui_polish: 4,
    performance: 3,
    client_readiness: 3,
  };
  const issues = [
    issue("warn", "Large files", "script.js and style.css are large, combining UI rendering, model joins, optimizer logic, and copy in files that are hard to review end to end.", fileMetrics.filter((m) => ["script.js", "style.css"].includes(m.file))),
    issue("warn", "Function length", "Several browser functions are long enough to hide stage-specific behavior and fallback decisions.", { longestFunctions: functions.slice(0, 10) }),
    issue("warn", "Hidden fallback logic", "Fallback behavior exists across data loading, score labels, pick modes, and optimizer candidate pools. Most is defensive, but it is scattered.", { fallbackMentions: [...script.matchAll(/fallback/gi)].length }),
    issue("warn", "Generated/UI boundary", "Generated model data is cleanly wrapped, but browser code still computes many strategic scores and squad adjustments.", {}),
  ];
  return {
    schema_version: "code_elegance_audit_v1",
    generated_at: new Date().toISOString(),
    status: "pass",
    scores,
    file_metrics: fileMetrics.sort((a, b) => b.lines - a.lines).slice(0, 40),
    longest_functions: functions.slice(0, 20),
    top_10_elegance_problems: [
      "Large monolithic script.js mixes public UI, model logic, Team Builder optimization, export/import, and caveat rendering.",
      "Team Builder has both generated artifact default and browser optimizer path.",
      "Fallback logic is scattered and hard to audit globally.",
      "Stage-specific concepts are represented by strings across code and data rather than a single stage manifest.",
      "Budget/rules copy and budget/rules execution can drift.",
      "Generated data contains internal diagnostics in public wrappers.",
      "Historical stage artifacts remain close to active artifacts in naming and load logic.",
      "QA scripts are numerous and phase-specific, with no single active public contract.",
      "CSS is a single large file with many feature-specific selectors.",
      "Model weights live across docs, generated artifacts, and browser constants.",
    ],
    easiest_cleanup_wins: [
      "Update Stats Notes budget copy for Final Round.",
      "Add an activePublicStageManifest_v1.json consumed by build and QA scripts.",
      "Centralize fallback declarations in one reportable object.",
      "Split Team Builder browser optimizer from DOM rendering.",
      "Move current-stage source/caveat copy into generated public metadata.",
      "Add wrapper/source parity checks to one command.",
      "Create compact public projections and keep diagnostics internal.",
      "Archive old stage scripts from default QA docs.",
      "Add file headers to active wrapper builders naming source and validator.",
      "Create a short client-readable model weights appendix.",
    ],
    structural_refactors: [
      "Introduce scripts/lib/stageManifest.mjs as the only active-stage source.",
      "Move Team Builder scoring profiles and optimizer into scripts/lib/teamBuilderModel.mjs.",
      "Generate public Team Builder artifacts for every strategy instead of recomputing defaults in the browser.",
      "Split script.js into data-access, renderers, decision tools, and Team Builder modules.",
      "Split public wrapper data into display and diagnostics payloads.",
      "Create a manifest-driven QA runner that executes source, wrapper, browser, and deployment gates.",
      "Normalize player identity fields across official and legacy rows.",
      "Normalize fixture identity into bracket_slot_id plus source_fixture_id metadata.",
      "Move long Stats Notes into versioned docs with short in-page summaries.",
      "Retire old stage paths from public controls when active stage is Final Round.",
    ],
    issues,
  };
}

export function renderCodeEleganceMarkdown(audit) {
  return `# Code Elegance Audit v1

Generated: ${audit.generated_at}

Status: **${audit.status}**

## Scores

${Object.entries(audit.scores).map(([key, value]) => `- ${key}: ${value}/5`).join("\n")}

## Largest Files

${audit.file_metrics.slice(0, 12).map((entry) => `- \`${entry.file}\`: ${entry.lines} lines, ${entry.bytes} bytes`).join("\n")}

## Longest Functions

${audit.longest_functions.slice(0, 10).map((fn) => `- \`${fn.file}:${fn.start}\` ${fn.name}: ${fn.lines} lines`).join("\n")}

## Top Elegance Problems

${markdownList(audit.top_10_elegance_problems)}

## Easiest Cleanup Wins

${markdownList(audit.easiest_cleanup_wins)}

## Structural Refactors

${markdownList(audit.structural_refactors)}

## Issues

${issueList(audit.issues)}
`;
}

export function buildPerformanceDeploymentAudit() {
  const publicFiles = [
    "index.html",
    "world-cup.html",
    "style.css",
    ...publicWrapperFiles,
    "script.js",
    "worldCupPage.js",
  ].filter(exists);
  const sizes = publicFiles.map((file) => ({ file, bytes: stat(file)?.size || 0 })).sort((a, b) => b.bytes - a.bytes);
  const indexScripts = parseScripts("index.html");
  const worldScripts = parseScripts("world-cup.html");
  const cacheIssues = [...indexScripts, ...worldScripts].filter((script) => !script.cacheBust);
  const issues = [];
  if (sizes[0]?.bytes > 1_500_000) {
    issues.push(issue("warn", "Large public payload", "Largest public files exceed 1.5 MB and should be compacted or split before a top-client handoff.", { largest: sizes.slice(0, 5) }));
  }
  if (cacheIssues.length) {
    issues.push(issue("warn", "Cache busting", "Some loaded scripts/styles do not have explicit cache-bust versions.", { cacheIssues }));
  }
  const browserQa = exists("data/finalRoundBuilderBrowserEquivalenceQa_v1.json") ? readJson("data/finalRoundBuilderBrowserEquivalenceQa_v1.json") : {};
  if (browserQa?.checks?.no_console_or_page_errors !== true) {
    issues.push(issue("warn", "Browser console", "Latest Team Builder browser equivalence QA does not assert a clean browser console.", { checks: browserQa?.checks }));
  }
  return {
    schema_version: "performance_deployment_audit_v1",
    generated_at: new Date().toISOString(),
    status: "pass",
    public_file_sizes: sizes,
    index_load_order: indexScripts,
    world_cup_load_order: worldScripts,
    largest_public_files: sizes.slice(0, 10),
    files_safe_to_compact: sizes.filter((row) => /Data\.js$|\.json$/.test(row.file) && row.bytes > 250_000).map((row) => row.file),
    internal_only_candidates: [
      "model diagnostics embedded inside generated public player rows",
      "historical stage artifacts not needed for active Final Round default",
      "QA detail payloads not used by browser rendering",
    ],
    deployment_smoke_test_gaps: [
      "No single current deployed-site command found that asserts every active Final Round player/fixture name against artifacts.",
      "Cache-bust versions are present, but index.html and world-cup.html use different final cache-bust labels for script.js/teamBuilder artifact.",
    ],
    issues,
  };
}

export function renderPerformanceDeploymentMarkdown(audit) {
  return `# Performance And Deployment Audit v1

Generated: ${audit.generated_at}

Status: **${audit.status}**

## Largest Public Files

${audit.largest_public_files.map((entry) => `- \`${entry.file}\`: ${entry.bytes} bytes`).join("\n")}

## Cache Busting

${[...audit.index_load_order, ...audit.world_cup_load_order].map((entry) => `- \`${entry.page}\` loads \`${entry.file}\` with cache bust \`${entry.cacheBust || "none"}\``).join("\n")}

## Safe Compaction Candidates

${markdownList(audit.files_safe_to_compact.map((file) => `\`${file}\``))}

## Deployment Smoke-Test Gaps

${markdownList(audit.deployment_smoke_test_gaps)}

## Issues

${issueList(audit.issues)}
`;
}

export function buildReputationRiskAudit() {
  const publicText = ["index.html", "world-cup.html", "script.js", "worldCupPage.js"].map(readText).join("\n");
  const issues = [];
  const overclaimPatterns = [
    /confirmed XI/gi,
    /final squad/gi,
    /guarantee/gi,
    /betting/gi,
    /gambling/gi,
    /conspiracy/gi,
    /referee/gi,
  ];
  const patternHits = Object.fromEntries(overclaimPatterns.map((re) => [re.source, [...publicText.matchAll(re)].length]));
  if (patternHits["conspiracy"] > 0 || patternHits["referee"] > 0) {
    issues.push(issue("fail", "Refereeing/conspiracy leak", "Public files contain refereeing or conspiracy language.", patternHits));
  }
  if (patternHits["final squad"] > 8) {
    issues.push(issue("warn", "Final squad claims", "Public files mention final squads often; current copy mostly caveats this, but source-backed wording must remain strict.", { hits: patternHits["final squad"] }));
  }
  const normalizedPublicText = normalizedSearchText(publicText);
  const hasBettingDisclaimer =
    normalizedPublicText.includes("not betting") ||
    normalizedPublicText.includes("not betting or gambling") ||
    normalizedPublicText.includes("not for betting");
  const hasGamblingDisclaimer =
    normalizedPublicText.includes("not gambling") ||
    normalizedPublicText.includes("not betting or gambling") ||
    normalizedPublicText.includes("not for gambling");
  if (!hasBettingDisclaimer || !hasGamblingDisclaimer) {
    issues.push(issue("warn", "Safety disclaimer", "Public text should clearly state not betting/gambling advice.", {}));
  }
  const dirtyRefereeing = listFiles("data", (file) => file.includes("refereeingOutcomes")).concat(listFiles("analysis"));
  return {
    schema_version: "reputation_risk_audit_v1",
    generated_at: new Date().toISOString(),
    status: passFail(issues),
    public_claim_scan: patternHits,
    source_discipline: [
      "Public footer says not official FIFA fantasy advice and not betting/gambling advice.",
      "World Cup Guide separates tournament facts from fantasy recommendations.",
      "Final squads are caveated as not source-backed in Team Builder artifact constraints.",
      "Ownership is explicitly marked as not used as model signal in active artifact constraints.",
    ],
    unpublished_refereeing_or_research_files_detected: dirtyRefereeing,
    reputation_risks: [
      "Over-precise model scores can be misread as certainty.",
      "Long caveat stacks can reduce polish even when they improve safety.",
      "Legacy historical rows and old stage controls can confuse the current public scope.",
      "Any accidental publication of refereeing/conspiracy artifacts would be reputationally off-scope for this site.",
    ],
    issues,
  };
}

export function renderReputationRiskMarkdown(audit) {
  return `# Security, Safety, And Reputation Audit v1

Generated: ${audit.generated_at}

Status: **${audit.status}**

## Source Discipline

${markdownList(audit.source_discipline)}

## Public Claim Scan

${Object.entries(audit.public_claim_scan).map(([pattern, count]) => `- \`${pattern}\`: ${count}`).join("\n")}

## Reputation Risks

${markdownList(audit.reputation_risks)}

## Unpublished Refereeing/Research Files Detected

${markdownList(audit.unpublished_refereeing_or_research_files_detected.map((file) => `\`${file}\``), "None detected.")}

## Issues

${issueList(audit.issues)}
`;
}

const builders = {
  architecture: [buildArchitectureAudit, renderArchitectureMarkdown],
  correctness: [buildCorrectnessAudit, renderCorrectnessMarkdown],
  dataModel: [buildDataModelAudit, renderDataModelMarkdown],
  model: [buildModelAudit, renderModelMarkdown],
  teamBuilder: [buildTeamBuilderAudit, renderTeamBuilderMarkdown],
  qaCoverage: [buildQaCoverageAudit, renderQaCoverageMarkdown],
  publicDesign: [buildPublicDesignAudit, renderPublicDesignMarkdown],
  codeElegance: [buildCodeEleganceAudit, renderCodeEleganceMarkdown],
  performanceDeployment: [buildPerformanceDeploymentAudit, renderPerformanceDeploymentMarkdown],
  reputationRisk: [buildReputationRiskAudit, renderReputationRiskMarkdown],
};

export function runPhase(phase) {
  const pair = builders[phase];
  if (!pair) throw new Error(`Unknown audit phase: ${phase}`);
  const [build, render] = pair;
  const audit = build();
  writeJson(phaseOutputs[phase].json, audit);
  writeText(phaseOutputs[phase].md, render(audit));
  return audit;
}

export function runAllPhases() {
  const results = Object.fromEntries(Object.keys(builders).map((phase) => [phase, runPhase(phase)]));
  const scopeGate = worktreeScopeGate();
  const statuses = Object.fromEntries(Object.entries(results).map(([phase, result]) => [phase, result.status]));
  const allIssues = Object.entries(results).flatMap(([phase, result]) =>
    (result.issues || result.competing_source_findings || []).map((entry) => ({ phase, ...entry }))
  );
  const summary = {
    schema_version: "fantasy_economist_full_audit_v1",
    generated_at: new Date().toISOString(),
    status: Object.values(statuses).includes("fail") ? "fail" : "pass",
    worktree_scope_gate: scopeGate,
    phase_statuses: statuses,
    critical_correctness_bugs_found: allIssues.filter((entry) => entry.severity === "critical" || entry.severity === "fail"),
    top_recommendations: [
      "Keep the Final Round public default artifact-backed; do not return to browser-only default optimization.",
      "Introduce one active-stage manifest for source files, wrappers, validators, cache-bust versions, and browser assertions.",
      "Separate public display payloads from internal model diagnostics.",
      "Move Team Builder optimizer/model weights out of script.js and into a shared generated/model module.",
      "Update legacy budget copy and shorten current-stage caveats for a more polished client-facing experience.",
    ],
    generated_reports: Object.values(phaseOutputs).map((output) => output.md),
  };
  writeJson(phaseOutputs.summary.json, summary);
  writeText(phaseOutputs.summary.md, renderSummaryMarkdown(summary, results, scopeGate));
  return summary;
}

function renderSummaryMarkdown(summary, results, scopeGate) {
  return `# Fantasy Economist Full Audit v1

Generated: ${summary.generated_at}

Overall status: **${summary.status}**

## Phase 0 Worktree Scope Gate

- Unrelated files present: ${scopeGate.unrelated_files_present ? "yes" : "no"}
- Scoped audit-only commit possible: ${scopeGate.scoped_commit_possible ? "yes, by staging only audit-related files" : "no, unknown files require review"}
- Commit instruction: ${scopeGate.commit_scope_instruction}

${Object.entries(scopeGate.by_classification).map(([classification, files]) => `- **${classification}:** ${files.length} file${files.length === 1 ? "" : "s"}`).join("\n")}

## Phase Statuses

${Object.entries(summary.phase_statuses).map(([phase, status]) => `- ${phase}: ${status}`).join("\n")}

## Critical Correctness Bugs

${issueList(summary.critical_correctness_bugs_found)}

## Top Recommendations

${markdownList(summary.top_recommendations)}

## Reports Generated

${markdownList(summary.generated_reports.map((file) => `\`${file}\``))}

## Highest-Signal Notes

- Architecture: ${(results.architecture.competing_source_findings || []).length} source-of-truth or fallback findings.
- Correctness: ${results.correctness.issues.length} issues; targeted eliminated-player hits ${results.correctness.checks.targeted_eliminated_player_hits.length}.
- Team Builder: browser equivalence ${results.teamBuilder.browser_equivalence.status}; remaining duplicate optimizer logic ${results.teamBuilder.remaining_duplicate_optimizer_logic}.
- Code elegance: client-readiness ${results.codeElegance.scores.client_readiness}/5.
- Reputation: public refereeing/conspiracy leak status ${results.reputationRisk.status}.
`;
}
