import fs from "node:fs";
import vm from "node:vm";
import {
  assertNoEliminatedActiveCandidates,
  eligibleTeamKeysFromFixtureAuthority,
  explainTeamBuilderEligibilityDecision,
  filterFinalRoundTeamBuilderCandidates,
  getFixtureAuthorityEligibleTeams,
  getFixtureAuthorityFixtureTeams,
  hasActiveTeamBuilderProjection,
  isActiveStageProjection,
  isFinalRoundEligibleTeam,
  normalizeTeamBuilderEligibleTeam
} from "./lib/teamBuilderPublicModel.mjs";
import {
  manifestFile,
  manifestWrapper,
  projectPath,
  readActiveStageManifest
} from "./lib/readActiveStageManifest.mjs";

const generatedAt = new Date().toISOString();
const outputPath = "data/teamBuilderEligibilityHelpersQa_v1.json";
const reportPath = "data/teamBuilderEligibilityHelpersQaReport_v1.md";
const blockedPlayers = [
  { id: "lerma", label: "Lerma", pattern: /\blerma\b/i },
  { id: "raphinha", label: "Raphinha", pattern: /\braphinha\b|\braphael dias belloli\b/i },
  { id: "vinicius", label: "Vinicius", pattern: /\bvinicius\b|\bvini\b/i },
  { id: "vinicius_accented", label: "Vinícius", pattern: /\bvinicius\b|\bvini\b/i }
];

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(projectPath(relativePath), "utf8"));
}

function writeJson(relativePath, value) {
  fs.writeFileSync(projectPath(relativePath), `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(relativePath, value) {
  fs.writeFileSync(projectPath(relativePath), value);
}

function parseWrapper(relativePath, globalName) {
  const source = fs.readFileSync(projectPath(relativePath), "utf8");
  const sandbox = { window: {} };
  vm.runInNewContext(source, sandbox, { filename: relativePath, timeout: 1000 });
  return sandbox.window[globalName];
}

function parseHelpers(relativePath) {
  return parseWrapper(relativePath, "TEAM_BUILDER_PUBLIC_HELPERS") || {};
}

function mdTable(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((value) => String(value ?? "").replace(/\|/g, "\\|")).join(" | ")} |`)
  ].join("\n");
}

function stableObject(value) {
  if (Array.isArray(value)) return value.map(stableObject);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableObject(value[key])]));
}

function sameJson(left, right) {
  return JSON.stringify(stableObject(left)) === JSON.stringify(stableObject(right));
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function check(id, passed, details = {}) {
  return { id, status: passed ? "pass" : "fail", details };
}

function identityValues(row) {
  return [
    row?.official_fantasy_player_id,
    row?.officialFantasyPlayerId,
    row?.internal_player_id,
    row?.matched_existing_player_id,
    row?.source_player_id,
    row?.player_id,
    row?.playerId,
    row?.id,
    row?.preview_player_key
  ].filter((value) => value !== null && value !== undefined && String(value).trim())
    .map((value) => String(value).trim());
}

function playerSlug(row) {
  const name = normalizeText(row?.name || row?.display_name || "");
  const team = normalizeText(row?.country || row?.team || row?.team_id || "");
  return name && team ? `${name}|${team}` : "";
}

function selectableOfficialRows(rows = []) {
  return rows.filter((row) => String(row?.selectable_status || "playing").trim().toLowerCase() === "playing");
}

function buildProjectionLookup(rows = []) {
  const lookup = new Map();
  rows.forEach((row) => {
    const projection = {
      ...row,
      matchday_id: row.matchday_id || row.matchday
    };
    [...identityValues(row), playerSlug(row)].filter(Boolean).forEach((key) => {
      if (!lookup.has(key)) {
        lookup.set(key, {});
      }
      lookup.get(key)[projection.matchday_id] = projection;
    });
  });
  return lookup;
}

function buildRowLookup(rows = []) {
  const lookup = new Map();
  rows.forEach((row) => {
    [...identityValues(row), playerSlug(row)].filter(Boolean).forEach((key) => {
      if (!lookup.has(key)) {
        lookup.set(key, row);
      }
    });
  });
  return lookup;
}

function projectionResolverFromLookup(lookup) {
  return (player, activeStage) => {
    for (const key of [...identityValues(player), playerSlug(player)].filter(Boolean)) {
      const projection = lookup.get(key)?.[activeStage];
      if (projection) return projection;
    }
    return null;
  };
}

function rowFromLookup(lookup, row) {
  for (const key of [...identityValues(row), playerSlug(row)].filter(Boolean)) {
    const match = lookup.get(key);
    if (match) return match;
  }
  return null;
}

function browserTeamBuilderSeedRows(rows, financeLookup) {
  return selectableOfficialRows(rows)
    .filter((row) => identityValues(row).length)
    .filter((row) => row.official_fantasy_player_id)
    .filter((row) => row.official_fantasy_position)
    .filter((row) => Number.isFinite(Number(row.official_price)))
    .filter((row) => Boolean(rowFromLookup(financeLookup, row)));
}

function countByCountry(rows = []) {
  return rows.reduce((counts, row) => {
    const key = row.country || "missing";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function sumCounts(counts = {}) {
  return Object.values(counts).reduce((sum, count) => sum + Number(count || 0), 0);
}

function countCoverage(candidatesByTeam = {}, qaByTeam = {}) {
  return Object.entries(qaByTeam).every(([team, count]) =>
    Number(candidatesByTeam[team] || 0) >= Number(count || 0)
  );
}

function names(rows = []) {
  return rows.map((row) => row.name || row.display_name || "").filter(Boolean);
}

function blockedPlayerHits(rows = []) {
  return rows.filter((row) => {
    const text = normalizeText(`${row.name || ""} ${row.display_name || ""}`);
    return blockedPlayers.some((player) => player.pattern.test(text));
  });
}

const manifest = readActiveStageManifest();
const activeStage = manifest.activeStage;
const fixtureAuthority = readJson(manifestFile(manifest, "finalRoundFixtureAuthority"));
const projections = readJson(manifestFile(manifest, "matchdayProjections"));
const golden = readJson("data/teamBuilderGoldenFinalRound_v1.json");
const teamBuilderQa = readJson(manifestFile(manifest, "teamBuilderQa"));
const officialStatus = parseWrapper(manifestWrapper(manifest, "officialFantasyStatus"), "FANTASY_POOL_OFFICIAL_DATA_STATUS");
const financeRows = parseWrapper("fantasyPoolFinanceMetricsData.js", "FANTASY_POOL_PLAYER_FINANCE_METRICS") || [];
const browserHelpers = parseHelpers(manifestWrapper(manifest, "teamBuilderPublicHelpers"));
const fixtureAuthorityBefore = JSON.stringify(fixtureAuthority);
const officialRowsBefore = JSON.stringify(officialStatus?.official_position_records || []);
const fixtureTeams = getFixtureAuthorityFixtureTeams(fixtureAuthority);
const eligibleTeams = getFixtureAuthorityEligibleTeams(fixtureAuthority);
const eligibleTeamKeys = eligibleTeamKeysFromFixtureAuthority(fixtureAuthority);
const finalFixtureTeams = fixtureTeams.find((fixture) => fixture.stage === "final")?.teams.map((team) => team.team) || [];
const thirdPlaceFixtureTeams = fixtureTeams.find((fixture) => fixture.stage === "third_place")?.teams.map((team) => team.team) || [];
const projectionRows = projections.playerMatchdayProjections || [];
const activeProjectionRows = projectionRows.filter((row) => isActiveStageProjection(row, activeStage));
const projectionLookup = buildProjectionLookup(projectionRows);
const financeLookup = buildRowLookup(financeRows);
const projectionResolver = projectionResolverFromLookup(projectionLookup);
const officialPlayingRows = selectableOfficialRows(officialStatus?.official_position_records || []);
const candidateSeedRows = browserTeamBuilderSeedRows(officialStatus?.official_position_records || [], financeLookup);
const eligibilityOptions = { activeStage, eligibleTeamKeys, projectionResolver };
const candidates = filterFinalRoundTeamBuilderCandidates(candidateSeedRows, eligibilityOptions);
const candidateDecisions = candidateSeedRows.map((player) => ({
  player,
  decision: explainTeamBuilderEligibilityDecision(player, eligibilityOptions)
}));
const missingActiveProjectionRows = candidateDecisions.filter(({ decision }) =>
  decision.teamEligible && !decision.hasActiveProjection
);
const nonEligibleTeamRows = candidateDecisions.filter(({ decision }) =>
  !decision.teamEligible
);
const candidateCountByTeam = countByCountry(candidates);
const existingQaCandidateCountByTeam = teamBuilderQa.summary?.candidate_count_by_team || {};
const historicalFallbackCandidates = candidates.filter((player) =>
  !hasActiveTeamBuilderProjection(player, activeStage, projectionResolver)
);
const goldenRows = golden.selectedPlayers || [];
const goldenDecisions = goldenRows.map((player) => ({
  player: player.name,
  decision: explainTeamBuilderEligibilityDecision(player, eligibilityOptions)
}));
const eliminatedTeams = ["Brazil", "Colombia"].map((team) => ({
  team,
  eligible: isFinalRoundEligibleTeam({ country: team, team_id: normalizeTeamBuilderEligibleTeam(team) }, eligibleTeamKeys)
}));
let malformedError = "";
let assertError = "";

try {
  getFixtureAuthorityEligibleTeams({ status: "bad" });
} catch (error) {
  malformedError = String(error?.message || error);
}

try {
  assertNoEliminatedActiveCandidates([
    { name: "Blocked Brazil Player", country: "Brazil", preview_matchday_projections_by_matchday: { [activeStage]: activeProjectionRows[0] } }
  ], { activeStage, eligibleTeamKeys });
} catch (error) {
  assertError = String(error?.message || error);
}

const helperOutputAgain = {
  eligibleTeams: getFixtureAuthorityEligibleTeams(fixtureAuthority),
  fixtureTeams: getFixtureAuthorityFixtureTeams(fixtureAuthority),
  candidates: names(filterFinalRoundTeamBuilderCandidates(candidateSeedRows, eligibilityOptions))
};
const helperOutput = {
  eligibleTeams,
  fixtureTeams,
  candidates: names(candidates)
};
const fixtureAuthorityAfter = JSON.stringify(fixtureAuthority);
const officialRowsAfter = JSON.stringify(officialStatus?.official_position_records || []);
const browserEligibleTeams = browserHelpers.getFixtureAuthorityEligibleTeams(fixtureAuthority);
const browserCandidates = browserHelpers.filterFinalRoundTeamBuilderCandidates(candidateSeedRows, eligibilityOptions);

const checks = [
  check("eligible_teams_equal_fixture_authority_teams", sameJson(eligibleTeams, ["France", "England", "Spain", "Argentina"]), {
    eligibleTeams
  }),
  check("final_fixture_teams_are_spain_argentina", sameJson(finalFixtureTeams, ["Spain", "Argentina"]), {
    finalFixtureTeams
  }),
  check("third_place_fixture_teams_are_france_england", sameJson(thirdPlaceFixtureTeams, ["France", "England"]), {
    thirdPlaceFixtureTeams
  }),
  check("brazil_colombia_not_eligible", eliminatedTeams.every((row) => row.eligible === false), {
    eliminatedTeams
  }),
  check("blocked_eliminated_player_names_not_active_candidates", blockedPlayerHits(candidates).length === 0, {
    hits: names(blockedPlayerHits(candidates))
  }),
  check("golden_squad_players_all_pass_eligibility", goldenDecisions.every((row) => row.decision.eligible), {
    goldenDecisions
  }),
  check("every_team_builder_candidate_has_active_final_round_projection", candidates.every((player) =>
    hasActiveTeamBuilderProjection(player, activeStage, projectionResolver)
  ), {
    candidateCount: candidates.length,
    missingActiveProjectionCount: missingActiveProjectionRows.length
  }),
  check("no_candidate_admitted_only_through_historical_projection_fallback", historicalFallbackCandidates.length === 0, {
    historicalFallbackCandidates: names(historicalFallbackCandidates)
  }),
  check("eligible_candidate_pool_covers_existing_team_builder_qa", countCoverage(candidateCountByTeam, existingQaCandidateCountByTeam), {
    helper: candidateCountByTeam,
    teamBuilderQa: existingQaCandidateCountByTeam,
    note: "Eligibility helpers own fixture-authority and active-projection admission; existing Team Builder QA count is after downstream risk/filter controls."
  }),
  check("assert_no_eliminated_active_candidates_passes_for_candidates", assertNoEliminatedActiveCandidates(candidates, eligibilityOptions) === true, {
    candidateCount: candidates.length
  }),
  check("assert_no_eliminated_active_candidates_rejects_blocked_candidate", /eliminated or inactive team builder candidates/i.test(assertError), {
    assertError
  }),
  check("helper_output_is_deterministic", sameJson(helperOutput, helperOutputAgain), {
    helperOutput,
    helperOutputAgain
  }),
  check("helpers_do_not_mutate_inputs", fixtureAuthorityBefore === fixtureAuthorityAfter && officialRowsBefore === officialRowsAfter, {}),
  check("malformed_fixture_authority_fails_with_useful_error", /invalid fixture authority/i.test(malformedError), {
    malformedError
  }),
  check("browser_wrapper_matches_module_eligibility", sameJson(browserEligibleTeams, eligibleTeams) &&
    sameJson(names(browserCandidates), names(candidates)), {
    browserEligibleTeams,
    eligibleTeams,
    browserCandidateCount: browserCandidates.length,
    candidateCount: candidates.length
  })
];

const failed = checks.filter((entry) => entry.status !== "pass");
const report = {
  schema_version: "team_builder_eligibility_helpers_qa_v1",
  generated_at: generatedAt,
  status: failed.length ? "fail" : "pass",
  activeStage,
  fixtureAuthorityPath: manifestFile(manifest, "finalRoundFixtureAuthority"),
  officialStatusWrapperPath: manifestWrapper(manifest, "officialFantasyStatus"),
  projectionPath: manifestFile(manifest, "matchdayProjections"),
  summary: {
    eligible_teams: eligibleTeams,
    final_fixture_teams: finalFixtureTeams,
    third_place_fixture_teams: thirdPlaceFixtureTeams,
    active_projection_rows: activeProjectionRows.length,
    official_playing_rows: officialPlayingRows.length,
    browser_seed_rows: candidateSeedRows.length,
    active_team_builder_candidates: candidates.length,
    candidate_count_by_team: candidateCountByTeam,
    existing_team_builder_qa_candidates: sumCounts(existingQaCandidateCountByTeam),
    existing_team_builder_qa_candidate_count_by_team: existingQaCandidateCountByTeam,
    downstream_filter_delta: candidates.length - sumCounts(existingQaCandidateCountByTeam),
    eliminated_candidate_count: blockedPlayerHits(candidates).length,
    candidates_missing_active_projections: missingActiveProjectionRows.length,
    candidates_excluded_due_to_non_eligible_team: nonEligibleTeamRows.length,
    historical_fallback_candidates: historicalFallbackCandidates.length
  },
  checks
};

writeJson(outputPath, report);
writeText(reportPath, `# Team Builder Eligibility Helpers QA v1

Generated: ${generatedAt}

Status: **${report.status}**

## Summary

${mdTable(["Metric", "Value"], Object.entries(report.summary).map(([key, value]) => [
  key,
  typeof value === "object" ? JSON.stringify(value) : value
]))}

## Checks

${mdTable(["Check", "Status"], checks.map((entry) => [entry.id, entry.status]))}
`);

if (failed.length) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  status: report.status,
  checksRun: checks.length,
  activeTeamBuilderCandidates: candidates.length,
  candidateCountByTeam,
  outputJson: outputPath,
  outputReport: reportPath
}, null, 2));
