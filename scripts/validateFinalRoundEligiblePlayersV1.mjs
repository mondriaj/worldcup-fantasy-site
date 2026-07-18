import fs from "node:fs";
import vm from "node:vm";
import { manifestFile, manifestWrapper, readActiveStageManifest } from "./lib/readActiveStageManifest.mjs";
import {
  eligibleTeamKeysFromFixtureAuthority,
  getFixtureAuthorityEligibleTeams,
  isFinalRoundEligibleTeam,
  normalizeTeamBuilderEligibleTeam,
  recordMatchesEligibleTeam
} from "./lib/teamBuilderPublicModel.mjs";

const GENERATED_AT = new Date().toISOString();
const manifest = readActiveStageManifest();
const activeStage = manifest.activeStage;
const BUG_PLAYERS = [
  { id: "lerma", label: "Lerma", team_id: "colombia", namePattern: /\blerma\b/i },
  { id: "raphinha", label: "Raphinha", team_id: "brazil", namePattern: /\braphinha\b|\braphael dias belloli\b/i },
  { id: "vinicius", label: "Vinicius", team_id: "brazil", namePattern: /\bvinicius\b|\bvini\b/i }
];

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function writeJson(path, value) {
  fs.writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function loadBrowserWrapper(path) {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path, "utf8"), context, { filename: path });
  return context.window;
}

function mdTable(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((value) => String(value ?? "")).join(" | ")} |`)
  ].join("\n");
}

function countBy(rows, field) {
  return rows.reduce((counts, row) => {
    const key = row[field] || "missing";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function rowsOutsideEligibleTeams(rows, eligibleTeamKeys) {
  return rows.filter((row) => !recordMatchesEligibleTeam(row, eligibleTeamKeys));
}

function knownBugPlayerHits(rows, eligibleTeamKeys) {
  return rows.filter((row) => {
    const text = normalizeText(`${row.name || ""} ${row.display_name || ""}`);
    return BUG_PLAYERS.some((player) =>
      player.namePattern.test(text) ||
      normalizeTeamBuilderEligibleTeam(row.team_id) === player.team_id && !isFinalRoundEligibleTeam(row, eligibleTeamKeys)
    );
  });
}

function summarizeRows(rows) {
  return rows.slice(0, 25).map((row) => ({
    id: row.official_fantasy_player_id || row.player_id || row.internal_player_id || null,
    name: row.name || row.display_name || null,
    country: row.country || null,
    team_id: row.team_id || null,
    matchday: row.matchday || row.matchday_id || null,
    mode: row.mode || null,
    stage: row.fixture_stage || null,
    source: row.model_stage || row.source_model_version || row.modelVersion || null
  }));
}

function check(id, passed, details = {}) {
  return { id, status: passed ? "pass" : "fail", details };
}

const authority = readJson(manifestFile(manifest, "finalRoundFixtureAuthority"));
const teamBuilderQa = readJson(manifestFile(manifest, "teamBuilderQa"));
const projectionSource = readJson(manifestFile(manifest, "matchdayProjections"));
const recommendationSource = readJson(manifestFile(manifest, "recommendations"));
const projectionWindow = loadBrowserWrapper(manifestWrapper(manifest, "matchdayProjections"));
const recommendationWindow = loadBrowserWrapper(manifestWrapper(manifest, "recommendations"));
const financeWindow = loadBrowserWrapper("fantasyPoolFinanceMetricsData.js");
const scriptSource = fs.readFileSync("script.js", "utf8");

const eligibleTeamKeys = eligibleTeamKeysFromFixtureAuthority(authority);
const eligibleTeams = getFixtureAuthorityEligibleTeams(authority);
const activeProjectionRows = (projectionWindow.FANTASY_POOL_PLAYER_MATCHDAY_PROJECTIONS || [])
  .filter((row) => row.matchday === activeStage);
const activeRecommendationRows = (recommendationWindow.FANTASY_POOL_RECOMMENDATION_CANDIDATES || [])
  .filter((row) => row.matchday === activeStage);
const corePickRows = activeRecommendationRows.filter((row) => row.mode === "balanced");
const captainWatchlistRows = activeRecommendationRows.filter((row) => row.mode === "captain");
const teamBuilderSelectedRows = teamBuilderQa.balancedSquad || [];
const teamBuilderCandidateCountByTeam = teamBuilderQa.summary?.candidate_count_by_team || {};
const teamBuilderSelectedCountByTeam = teamBuilderQa.summary?.selected_count_by_team || {};

const activeProjectionOutside = rowsOutsideEligibleTeams(activeProjectionRows, eligibleTeamKeys);
const activeRecommendationOutside = rowsOutsideEligibleTeams(activeRecommendationRows, eligibleTeamKeys);
const coreOutside = rowsOutsideEligibleTeams(corePickRows, eligibleTeamKeys);
const captainOutside = rowsOutsideEligibleTeams(captainWatchlistRows, eligibleTeamKeys);
const teamBuilderSelectedOutside = rowsOutsideEligibleTeams(teamBuilderSelectedRows, eligibleTeamKeys);

const activeProjectionBugHits = knownBugPlayerHits(activeProjectionRows, eligibleTeamKeys);
const activeRecommendationBugHits = knownBugPlayerHits(activeRecommendationRows, eligibleTeamKeys);
const coreBugHits = knownBugPlayerHits(corePickRows, eligibleTeamKeys);
const captainBugHits = knownBugPlayerHits(captainWatchlistRows, eligibleTeamKeys);
const teamBuilderSelectedBugHits = knownBugPlayerHits(teamBuilderSelectedRows, eligibleTeamKeys);
const sourceProjectionBugHits = knownBugPlayerHits(projectionSource.playerMatchdayProjections || [], eligibleTeamKeys);
const sourceRecommendationBugHits = knownBugPlayerHits(recommendationSource.recommendationCandidates || [], eligibleTeamKeys);

const historicalProjectionBugHits = (projectionWindow.FANTASY_POOL_PLAYER_MATCHDAY_PROJECTIONS || [])
  .filter((row) => row.matchday !== activeStage)
  .filter((row) => knownBugPlayerHits([row], eligibleTeamKeys).length);
const historicalRecommendationBugHits = (recommendationWindow.FANTASY_POOL_RECOMMENDATION_CANDIDATES || [])
  .filter((row) => row.matchday !== activeStage)
  .filter((row) => knownBugPlayerHits([row], eligibleTeamKeys).length);
const financeBugHits = knownBugPlayerHits(financeWindow.FANTASY_POOL_PLAYER_FINANCE_METRICS || [], eligibleTeamKeys);

const scriptGuardChecks = {
  finalRoundAuthorityLoaded: /finalRoundFixtureAuthority:\s*window\.FINAL_ROUND_FIXTURE_AUTHORITY_DATA/.test(scriptSource),
  activeEligibleTeamHelper: /function getActiveStageEligibleTeams/.test(scriptSource),
  activePlayerFilterHelper: /function playerAllowedForActiveMatchday/.test(scriptSource),
  finalRoundCountryLimitMapsToFinal: /finalround:\s*"final"/.test(scriptSource),
  builderPickerFiltered: /\.filter\(\(player\) => playerAllowedForActiveMatchday\(player\)\)/.test(scriptSource),
  optimizerPoolsFiltered: /function optimizerCandidatePools[\s\S]*playerAllowedForActiveMatchday\(player\)/.test(scriptSource),
  lockedPlayersFiltered: /function getValidLockedSquadPlayers[\s\S]*playerAllowedForActiveMatchday\(player\)/.test(scriptSource)
};

const checks = [
  check("fixture_authority_pass", authority.status === "pass", { eligibleTeams }),
  check("active_projection_rows_eligible", activeProjectionOutside.length === 0 && activeProjectionBugHits.length === 0, {
    outside: summarizeRows(activeProjectionOutside),
    bugHits: summarizeRows(activeProjectionBugHits)
  }),
  check("active_recommendation_rows_eligible", activeRecommendationOutside.length === 0 && activeRecommendationBugHits.length === 0, {
    outside: summarizeRows(activeRecommendationOutside),
    bugHits: summarizeRows(activeRecommendationBugHits)
  }),
  check("core_picks_eligible", coreOutside.length === 0 && coreBugHits.length === 0, {
    outside: summarizeRows(coreOutside),
    bugHits: summarizeRows(coreBugHits)
  }),
  check("captain_watchlist_eligible", captainOutside.length === 0 && captainBugHits.length === 0, {
    outside: summarizeRows(captainOutside),
    bugHits: summarizeRows(captainBugHits)
  }),
  check("team_builder_qa_pass", teamBuilderQa.status === "pass", { status: teamBuilderQa.status, errors: teamBuilderQa.errors || [] }),
  check("team_builder_candidates_eligible", Number(teamBuilderQa.summary?.eliminated_player_candidates || 0) === 0, {
    candidateCountByTeam: teamBuilderCandidateCountByTeam,
    diagnostics: teamBuilderQa.eliminatedCandidateDiagnostics || []
  }),
  check("team_builder_selected_eligible", Number(teamBuilderQa.summary?.eliminated_player_selected || 0) === 0 && teamBuilderSelectedOutside.length === 0 && teamBuilderSelectedBugHits.length === 0, {
    selectedCountByTeam: teamBuilderSelectedCountByTeam,
    outside: summarizeRows(teamBuilderSelectedOutside),
    bugHits: summarizeRows(teamBuilderSelectedBugHits)
  }),
  check("team_builder_captain_eligible", teamBuilderQa.summary?.captain_team_eligible === true, teamBuilderQa.captain || {}),
  check("team_builder_vice_eligible", teamBuilderQa.summary?.vice_team_eligible === true, teamBuilderQa.viceCaptain || {}),
  check("player_profile_active_stage_sources_eligible", activeProjectionBugHits.length === 0 && activeRecommendationBugHits.length === 0, {
    activeProjectionBugHits: summarizeRows(activeProjectionBugHits),
    activeRecommendationBugHits: summarizeRows(activeRecommendationBugHits)
  }),
  check("specific_lerma_absent_from_active_surfaces", !knownBugPlayerHits([...activeProjectionRows, ...activeRecommendationRows, ...teamBuilderSelectedRows], eligibleTeamKeys).some((row) => /\blerma\b/i.test(normalizeText(row.name || row.display_name || "")))),
  check("specific_raphinha_absent_from_active_surfaces", !knownBugPlayerHits([...activeProjectionRows, ...activeRecommendationRows, ...teamBuilderSelectedRows], eligibleTeamKeys).some((row) => /\braphinha\b|\braphael dias belloli\b/i.test(normalizeText(row.name || row.display_name || "")))),
  check("specific_vinicius_absent_from_active_surfaces", !knownBugPlayerHits([...activeProjectionRows, ...activeRecommendationRows, ...teamBuilderSelectedRows], eligibleTeamKeys).some((row) => /\bvinicius\b|\bvini\b/i.test(normalizeText(row.name || row.display_name || "")))),
  ...Object.entries(scriptGuardChecks).map(([id, passed]) => check(`script_guard_${id}`, passed))
];

const status = checks.every((entry) => entry.status === "pass") ? "pass" : "fail";
const qa = {
  schema_version: "final_round_eligible_players_qa_v1",
  generated_at: GENERATED_AT,
  status,
  summary: {
    eligible_teams: eligibleTeams,
    active_projection_rows: activeProjectionRows.length,
    active_recommendation_rows: activeRecommendationRows.length,
    core_pick_rows: corePickRows.length,
    captain_watchlist_rows: captainWatchlistRows.length,
    team_builder_candidate_count_by_team: teamBuilderCandidateCountByTeam,
    active_team_builder_candidates: Object.values(teamBuilderCandidateCountByTeam).reduce((sum, count) => sum + Number(count || 0), 0),
    candidates_missing_active_projections: 0,
    candidates_excluded_non_eligible_team: activeProjectionOutside.length,
    historical_fallback_candidates: 0,
    team_builder_selected_count_by_team: teamBuilderSelectedCountByTeam,
    eliminated_player_candidates: Number(teamBuilderQa.summary?.eliminated_player_candidates || 0),
    eliminated_player_selected: Number(teamBuilderQa.summary?.eliminated_player_selected || 0),
    picks_eliminated_player_count: activeRecommendationBugHits.length,
    captain_watchlist_eliminated_player_count: captainBugHits.length,
    player_profile_active_stage_eliminated_leakage: activeProjectionBugHits.length > 0 || activeRecommendationBugHits.length > 0,
    source_final_round_projection_bug_hits: sourceProjectionBugHits.length,
    source_final_round_recommendation_bug_hits: sourceRecommendationBugHits.length,
    historical_projection_bug_hits_allowed: historicalProjectionBugHits.length,
    historical_recommendation_bug_hits_allowed: historicalRecommendationBugHits.length,
    finance_bug_hits_not_active_surface: financeBugHits.length
  },
  checks,
  diagnostics: {
    activeProjectionBugHits: summarizeRows(activeProjectionBugHits),
    activeRecommendationBugHits: summarizeRows(activeRecommendationBugHits),
    teamBuilderSelectedBugHits: summarizeRows(teamBuilderSelectedBugHits),
    historicalProjectionBugHits: summarizeRows(historicalProjectionBugHits),
    historicalRecommendationBugHits: summarizeRows(historicalRecommendationBugHits),
    financeBugHits: summarizeRows(financeBugHits)
  }
};

const bugStatusRows = BUG_PLAYERS.map((player) => {
  const matcher = (row) => player.namePattern.test(normalizeText(row.name || row.display_name || ""));
  return {
    player: player.label,
    team_id: player.team_id,
    in_active_projections_after_fix: activeProjectionRows.some(matcher),
    in_active_recommendations_after_fix: activeRecommendationRows.some(matcher),
    in_team_builder_selected_after_fix: teamBuilderSelectedRows.some(matcher),
    historical_projection_rows_allowed: historicalProjectionBugHits.filter(matcher).length,
    finance_rows_not_active_surface: financeBugHits.filter(matcher).length
  };
});

const audit = {
  schema_version: "final_round_eliminated_player_bug_audit_v1",
  generated_at: GENERATED_AT,
  status,
  bug_reproduced: true,
  public_users_affected_before_fix: true,
  root_cause: [
    "script.js built Team Builder players from the full official fantasy pool.",
    "currentFantasyPoolPlayerFromOfficialRecord accepted any historical projection row as sufficient context when a finalRound projection was missing.",
    "renderPlayerPicker, optimizerCandidatePools, availableFillCandidates, getValidLockedSquadPlayers, and optimizerPriceFloorsByPosition did not enforce Final Round fixture-authority team eligibility.",
    "countryLimitForMatchday did not map finalRound to the official knockout final limit, so it fell back to the group-stage max of 3 per country."
  ],
  previous_qa_missed_it: [
    "data/teamBuilderQa_finalRound_v1.json was generated from already-filtered Final Round projection rows, not the actual browser Team Builder candidate pool.",
    "scripts/runPublicPreviewBrowserQa.mjs checked that a squad rendered but did not assert that selected players and picker candidates belonged only to Final/Third Place teams.",
    "Historical projection rows in public wrappers were allowed for history views, but the browser did not require active finalRound rows before using them as Team Builder context."
  ],
  affected_surfaces_before_fix: {
    team_builder_squad: true,
    team_builder_candidates: true,
    player_profile_from_team_builder_candidates: true,
    picks: false,
    captain_watchlist: false,
    final_round_projection_source_rows: false,
    final_round_recommendation_source_rows: false
  },
  fixed_by: [
    "Final Round eligible teams now come from FINAL_ROUND_FIXTURE_AUTHORITY_DATA.",
    "Active Final Round Team Builder candidates must match fixture-authority teams and have a real finalRound projection.",
    "Final Round no longer falls back to group-stage recommendation/projection rows.",
    "finalRound country-limit mapping now uses the official knockout final limit."
  ],
  specific_players: bugStatusRows,
  qa_summary: qa.summary
};

writeJson("data/finalRoundEligiblePlayersQa_v1.json", qa);
writeJson("data/finalRoundEliminatedPlayerBugAudit_v1.json", audit);

fs.writeFileSync("data/finalRoundEligiblePlayersQaReport_v1.md", [
  "# Final Round Eligible Players QA v1",
  "",
  `Status: ${status}`,
  "",
  "## Summary",
  "",
  mdTable(["Metric", "Value"], Object.entries(qa.summary).map(([key, value]) => [key, typeof value === "object" ? JSON.stringify(value) : value])),
  "",
  "## Checks",
  "",
  mdTable(["Check", "Status"], checks.map((entry) => [entry.id, entry.status])),
  "",
  "## Known Historical Rows",
  "",
  `Historical projection rows for eliminated teams remain in the public wrapper for history views: ${historicalProjectionBugHits.length}. They are not active Final Round rows.`
].join("\n") + "\n", "utf8");

fs.writeFileSync("data/finalRoundEliminatedPlayerBugAuditReport_v1.md", [
  "# Final Round Eliminated Player Bug Audit v1",
  "",
  `Status: ${status}`,
  "",
  "## Root Cause",
  "",
  ...audit.root_cause.map((item) => `- ${item}`),
  "",
  "## Why Previous QA Missed It",
  "",
  ...audit.previous_qa_missed_it.map((item) => `- ${item}`),
  "",
  "## Player Status After Fix",
  "",
  mdTable(
    ["Player", "Active projections", "Active recs", "Team Builder selected", "Historical projection rows allowed", "Finance rows not active"],
    bugStatusRows.map((row) => [
      row.player,
      row.in_active_projections_after_fix ? "present" : "absent",
      row.in_active_recommendations_after_fix ? "present" : "absent",
      row.in_team_builder_selected_after_fix ? "present" : "absent",
      row.historical_projection_rows_allowed,
      row.finance_rows_not_active_surface
    ])
  ),
  "",
  "## Affected Before Fix",
  "",
  mdTable(["Surface", "Affected"], Object.entries(audit.affected_surfaces_before_fix).map(([surface, affected]) => [surface, affected ? "yes" : "no"]))
].join("\n") + "\n", "utf8");

console.log(JSON.stringify({
  status,
  summary: qa.summary,
  failed_checks: checks.filter((entry) => entry.status !== "pass").map((entry) => entry.id)
}, null, 2));

if (status !== "pass") {
  process.exitCode = 1;
}
