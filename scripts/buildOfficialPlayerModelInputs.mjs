import { access, readFile, writeFile } from "node:fs/promises";

const TODAY = "2026-06-02";

const INPUTS = {
  officialFantasyPlayers: "data/officialFantasyPlayers_v0.json",
  officialFantasyImportReport: "data/officialFantasyImportReport_v0.json",
  officialFantasyRules: "data/officialFantasyRules_v0.json",
  officialFantasyRulesImportReport: "data/officialFantasyRulesImportReport_v0.json",
  officialSquads: "data/officialSquads_v0.json",
  officialSquadsImportReport: "data/officialSquadsImportReport_v0.json",
  identityMap: "data/mappings/playerIdentityMap_v1.csv",
  identityManualOverrides: "data/mappings/playerIdentityManualOverrides_v1.csv",
  identityReviewQueue: "data/review/playerIdentityReviewQueue_v1.csv",
  clubContext: "data/playerClubContext_v1.csv",
  qualifierUsage: "data/playerQualifierUsage_v1.csv",
  coverageReport: "data/playerDataCoverageReport_v1.json",
  readiness: "data/officialDataReadiness_v0.json"
};

const OUTPUT_INPUTS = "data/playerRecommendationInputs_v1.json";
const OUTPUT_QA = "data/playerRecommendationInputsQa_v1.json";
const OUTPUT_REPORT = "data/playerRecommendationInputsReport_v1.md";

const ACCEPTED_IDENTITY_STATUSES = new Set([
  "exact_match",
  "strong_match",
  "manual_confirmed",
  "new_player_created"
]);

const UNRESOLVED_IDENTITY_STATUSES = new Set([
  "needs_review",
  "rejected_match",
  "duplicate_candidate",
  "insufficient_data"
]);

function hasValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function nullIfBlank(value) {
  return hasValue(value) ? String(value).trim() : null;
}

function numberOrNull(value) {
  if (!hasValue(value)) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function flagList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value || "")
    .split(/[|;,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function uniqueFlags(flags) {
  return [...new Set(flags.filter(Boolean))].sort();
}

function normalizeKey(value) {
  return String(value || "").trim();
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function parseDelimitedLine(line, delimiter) {
  const values = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === "\"" && quoted && next === "\"") {
      value += "\"";
      index += 1;
    } else if (char === "\"") {
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

function parseDelimited(text) {
  const clean = text.replace(/^\uFEFF/, "").trim();
  if (!clean) return [];

  const firstLine = clean.split(/\r?\n/, 1)[0] || "";
  const delimiter = firstLine.includes("\t") ? "\t" : ",";
  const rows = clean.split(/\r?\n/).filter(Boolean).map((line) => parseDelimitedLine(line, delimiter));
  const headers = rows.shift()?.map((header) => header.trim()) || [];

  return rows.map((row) => {
    const item = {};
    headers.forEach((header, index) => {
      item[header] = row[index] === undefined ? "" : row[index].trim();
    });
    return item;
  });
}

async function readDelimitedIfExists(filePath) {
  if (!(await fileExists(filePath))) return [];
  return parseDelimited(await readFile(filePath, "utf8"));
}

function indexBy(rows, key) {
  const map = new Map();
  rows.forEach((row) => {
    const value = normalizeKey(row?.[key]);
    if (value) map.set(value, row);
  });
  return map;
}

function duplicateValues(rows, key) {
  const counts = new Map();
  rows.forEach((row) => {
    const value = normalizeKey(row?.[key]);
    if (!value) return;
    counts.set(value, (counts.get(value) || 0) + 1);
  });
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([value, count]) => ({ value, count }));
}

function countBy(rows, keyFn) {
  return rows.reduce((counts, row) => {
    const key = keyFn(row) || "missing";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function sortedEntries(object) {
  return Object.entries(object).sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])));
}

function mdEscape(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function mdTable(headers, rows) {
  return [
    `| ${headers.map(mdEscape).join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(mdEscape).join(" | ")} |`)
  ].join("\n");
}

function squadStatusSourceLevel(squadRow) {
  if (!squadRow) return "unknown";
  if (squadRow.roster_status === "confirmed_final_squad") return "confirmed_final_squad";
  if (squadRow.roster_status === "selectable_fantasy_player") return "fantasy_pool_only";
  if (squadRow.roster_status === "review") return "review";
  return "unknown";
}

function rulesFlags(rulesData, rulesReport) {
  const rules = rulesData.officialFantasyRules || {};
  const boosterNeedsReview = (rules.boosters?.rulesStatus || "").includes("mystery") ||
    (rules.boosters?.details || []).some((booster) => booster.boosterId === "mystery_booster" && !hasValue(booster.effect));
  const deadlineNeedsReview = (rules.deadlines?.rulesStatus || "").includes("deadline_review");
  return {
    rules_version: rules.rulesVersion || null,
    rules_status: rules.rulesStatus || rulesData.data_status || null,
    rules_import_status: rulesReport.status || rulesData.data_status || null,
    rules_manual_review: rulesReport.status !== "imported_ready_for_readiness_check" ||
      rules.rulesStatus === "official_imported_needs_manual_review",
    mystery_booster_unknown: boosterNeedsReview,
    deadline_semantics_review: deadlineNeedsReview
  };
}

function roleConfidenceFromUsage(usageRow) {
  const confidence = usageRow?.usage_confidence || "missing";
  if (["high", "medium", "low"].includes(confidence)) return confidence;
  return "missing";
}

function modelInputStatus({ price, position, identityConflict, selectableStatus, sourceLevel, rowWarningFlags }) {
  if (price === null) return "blocked_missing_official_price";
  if (!position) return "blocked_missing_official_position";
  if (identityConflict) return "blocked_identity_conflict";
  if (sourceLevel === "unknown") return "needs_review";
  if (selectableStatus !== "playing" || sourceLevel === "review") return "blocked_not_selectable";
  return rowWarningFlags.length ? "usable_with_warning" : "usable_fantasy_pool_only";
}

function stopCondition(id, status, count, details) {
  return { id, status, count, details };
}

function buildStopConditions({
  missingPriceCount,
  missingPositionCount,
  identityReviewRows,
  duplicateOfficialIds,
  unresolvedIdentityRows,
  duplicateInternalMappings,
  officialSquadsReport,
  officialSquadsRows,
  rulesMeta
}) {
  const finalSquadRows = officialSquadsRows.filter((row) => row.roster_status === "confirmed_final_squad").length;
  const teamsMarkedComplete = officialSquadsReport.summary?.teams_marked_complete || 0;
  const squadStatusReady = officialSquadsReport.status === "imported_ready_for_readiness_check";

  return [
    stopCondition(
      "official_price_missing",
      missingPriceCount ? "stop" : "pass",
      missingPriceCount,
      missingPriceCount ? "Official fantasy prices are missing for at least one row." : "Official fantasy prices are present for all staged rows."
    ),
    stopCondition(
      "official_position_missing",
      missingPositionCount ? "stop" : "pass",
      missingPositionCount,
      missingPositionCount ? "Official fantasy positions are missing for at least one row." : "Official fantasy positions are present for all staged rows."
    ),
    stopCondition(
      "identity_review_queue_not_empty",
      identityReviewRows.length ? "stop" : "pass",
      identityReviewRows.length,
      identityReviewRows.length ? "Player identity review rows remain unresolved." : "Player identity review queue is empty."
    ),
    stopCondition(
      "duplicate_official_fantasy_ids",
      duplicateOfficialIds.length ? "stop" : "pass",
      duplicateOfficialIds.length,
      duplicateOfficialIds.length ? "Duplicate official fantasy IDs exist." : "No duplicate official fantasy IDs detected."
    ),
    stopCondition(
      "unresolved_identity_conflicts",
      unresolvedIdentityRows.length || duplicateInternalMappings.length ? "stop" : "pass",
      unresolvedIdentityRows.length + duplicateInternalMappings.length,
      unresolvedIdentityRows.length || duplicateInternalMappings.length
        ? "Unresolved identity rows or duplicate accepted internal-player mappings exist."
        : "No unresolved identity conflicts detected."
    ),
    stopCondition(
      "final_squads_not_source_backed",
      !squadStatusReady || teamsMarkedComplete === 0 ? "stop" : "pass",
      officialSquadsReport.summary?.review_rows || 0,
      "Final squad import is not source-backed complete; fantasy pool rows must not be treated as final squads."
    ),
    stopCondition(
      "official_rules_manual_review",
      rulesMeta.rules_manual_review ? "stop" : "pass",
      rulesMeta.rules_manual_review ? 1 : 0,
      rulesMeta.rules_manual_review
        ? "Official rules import still has manual-review status."
        : "Official rules import is ready for readiness check."
    ),
    stopCondition(
      "no_final_squad_rows_exist",
      finalSquadRows === 0 ? "stop" : "pass",
      finalSquadRows,
      finalSquadRows === 0
        ? "There are 0 confirmed_final_squad rows in the staged official squad file."
        : "At least one confirmed_final_squad row exists."
    ),
    stopCondition(
      "browser_ready_files_not_regenerated",
      "stop",
      1,
      "This staging pass intentionally did not regenerate browser-ready files or active recommendation data."
    )
  ];
}

function buildPlayerRows({
  officialFantasyRows,
  identityByOfficialId,
  overrideByOfficialId,
  squadByOfficialId,
  clubByOfficialId,
  usageByOfficialId,
  highPriceMissingUsageIds,
  rulesMeta
}) {
  return officialFantasyRows.map((officialRow) => {
    const officialId = normalizeKey(officialRow.official_fantasy_player_id);
    const identity = identityByOfficialId.get(officialId) || null;
    const manualOverride = overrideByOfficialId.get(officialId) || null;
    const squad = squadByOfficialId.get(officialId) || null;
    const club = clubByOfficialId.get(officialId) || null;
    const usage = usageByOfficialId.get(officialId) || null;
    const price = numberOrNull(officialRow.official_price);
    const sourceLevel = squadStatusSourceLevel(squad);
    const finalSquadConfirmed = sourceLevel === "confirmed_final_squad";
    const identityStatus = identity?.match_status || "needs_review";
    const identityFlags = flagList(identity?.data_quality_flags);
    const clubFlags = flagList(club?.data_quality_flags);
    const usageFlags = flagList(usage?.data_quality_flags);
    const usageConfidence = usage?.usage_confidence || "missing";
    const clubDataStatus = club?.club_data_status || "missing";
    const currentClub = nullIfBlank(club?.current_club);
    const qualifierMinutes = numberOrNull(usage?.qualifier_minutes);
    const recentNtMinutes = numberOrNull(usage?.recent_nt_minutes);
    const roleConfidence = roleConfidenceFromUsage(usage);
    const recentNtRole = roleConfidence === "missing" ? "unclear" : (usage?.recent_nt_role || "unclear");
    const identityConflict = !ACCEPTED_IDENTITY_STATUSES.has(identityStatus) ||
      UNRESOLVED_IDENTITY_STATUSES.has(identityStatus) ||
      !identity?.internal_player_id;

    const rowSpecificFlags = [];
    if (identityFlags.includes("thin_profile") || clubFlags.includes("thin_profile") || usageFlags.includes("thin_profile") || identity?.profile_status === "thin_profile") {
      rowSpecificFlags.push("thin_profile");
    }
    if (!currentClub || ["missing", "thin_profile_missing"].includes(clubDataStatus)) {
      rowSpecificFlags.push("missing_club_context");
    }
    if (["missing", "thin_profile_missing"].includes(usageConfidence) || (qualifierMinutes === null && recentNtMinutes === null)) {
      rowSpecificFlags.push("missing_national_team_usage");
    }
    if (usageConfidence === "low") {
      rowSpecificFlags.push("low_usage_confidence");
    }
    if (identityFlags.includes("position_conflict")) {
      rowSpecificFlags.push("position_conflict_audit");
    }
    if (highPriceMissingUsageIds.has(officialId)) {
      rowSpecificFlags.push("high_price_missing_usage");
    }
    if (sourceLevel === "review") {
      rowSpecificFlags.push("squad_review_status");
    }
    if (roleConfidence === "missing") {
      rowSpecificFlags.push("missing_role_confidence");
    }

    const globalFlags = [];
    if (!finalSquadConfirmed) {
      globalFlags.push("fantasy_pool_only_not_final_squad_confirmed", "final_squad_source_missing");
    }
    if (rulesMeta.rules_manual_review) globalFlags.push("rules_manual_review");
    if (rulesMeta.mystery_booster_unknown) globalFlags.push("mystery_booster_unknown");
    if (rulesMeta.deadline_semantics_review) globalFlags.push("deadline_semantics_review");

    const outputFlags = uniqueFlags([...globalFlags, ...rowSpecificFlags]);
    const rowStatus = modelInputStatus({
      price,
      position: officialRow.official_fantasy_position,
      identityConflict,
      selectableStatus: officialRow.selectable_status,
      sourceLevel,
      rowWarningFlags: rowSpecificFlags
    });

    return {
      internal_player_id: identity?.internal_player_id || null,
      official_fantasy_player_id: officialId || null,
      name: officialRow.name || null,
      display_name: officialRow.display_name || officialRow.name || null,
      country: officialRow.country || null,
      team_id: officialRow.team_id || null,
      official_fantasy_position: officialRow.official_fantasy_position || null,
      official_price: price,
      selectable_status: officialRow.selectable_status || null,
      roster_status: squad?.roster_status || "unknown",
      squad_status_source_level: sourceLevel,
      final_squad_confirmed: finalSquadConfirmed,
      fantasy_pool_only: sourceLevel === "fantasy_pool_only",
      identity_match_status: identityStatus,
      identity_match_confidence: numberOrNull(identity?.match_confidence),
      identity_data_quality_flags: identityFlags,
      current_club: currentClub,
      current_league: nullIfBlank(club?.current_league),
      club_data_status: clubDataStatus,
      club_role_confidence: club?.club_role_confidence || "missing",
      qualifier_minutes: qualifierMinutes,
      qualifier_starts: numberOrNull(usage?.qualifier_starts),
      recent_nt_minutes: recentNtMinutes,
      recent_nt_starts: numberOrNull(usage?.recent_nt_starts),
      recent_nt_role: recentNtRole,
      usage_confidence: usageConfidence,
      role_label: recentNtRole,
      role_confidence: roleConfidence,
      set_piece_role: nullIfBlank(usage?.set_piece_role),
      penalty_role: nullIfBlank(usage?.penalty_role),
      data_quality_flags: outputFlags,
      source_summary: {
        official_fantasy_player_data: {
          source_url: officialRow.source_url || null,
          source_checked: officialRow.source_checked || null,
          selectable_status: officialRow.selectable_status || null
        },
        squad_staging: {
          source_url: squad?.source_url || null,
          source_checked: squad?.source_checked || null,
          roster_status: squad?.roster_status || "unknown",
          source_level: sourceLevel,
          review_reasons: squad?.review_reasons || []
        },
        identity: {
          source_url: identity?.source_url || null,
          source_checked: identity?.source_checked || null,
          match_method: identity?.match_method || null,
          profile_status: identity?.profile_status || null,
          manual_override_action: manualOverride?.action || null,
          manual_override_reason: manualOverride?.reason || null
        },
        club_context: {
          source: club?.club_source || null,
          source_url: club?.club_source_url || null,
          source_checked: club?.club_source_checked || null,
          data_status: clubDataStatus
        },
        national_team_usage: {
          source: usage?.usage_source || null,
          source_url: usage?.usage_source_url || null,
          source_checked: usage?.usage_source_checked || null,
          confidence: usageConfidence
        },
        official_rules: {
          rules_version: rulesMeta.rules_version,
          rules_status: rulesMeta.rules_status,
          rules_import_status: rulesMeta.rules_import_status
        }
      },
      model_input_status: rowStatus
    };
  });
}

function buildSummary(players, officialFantasyRows, officialSquadsReport, rulesMeta) {
  const statusCounts = countBy(players, (row) => row.model_input_status);
  const flagCounts = countBy(
    players.flatMap((row) => row.data_quality_flags.map((flag) => ({ flag }))),
    (row) => row.flag
  );
  return {
    total_official_fantasy_players: officialFantasyRows.length,
    total_model_input_rows: players.length,
    selectable_players: players.filter((row) => row.selectable_status === "playing").length,
    not_selectable_players: players.filter((row) => row.selectable_status !== "playing").length,
    final_squad_confirmed_players: players.filter((row) => row.final_squad_confirmed).length,
    fantasy_pool_only_players: players.filter((row) => row.squad_status_source_level === "fantasy_pool_only").length,
    review_players: players.filter((row) => row.squad_status_source_level === "review").length,
    blocked_rows: players.filter((row) => row.model_input_status.startsWith("blocked_")).length,
    usable_with_warning_rows: statusCounts.usable_with_warning || 0,
    usable_fantasy_pool_only_rows: statusCounts.usable_fantasy_pool_only || 0,
    needs_review_rows: statusCounts.needs_review || 0,
    thin_profile_rows: flagCounts.thin_profile || 0,
    missing_club_context_rows: flagCounts.missing_club_context || 0,
    missing_national_team_usage_rows: flagCounts.missing_national_team_usage || 0,
    high_price_missing_usage_rows: flagCounts.high_price_missing_usage || 0,
    position_conflict_audit_rows: flagCounts.position_conflict_audit || 0,
    rules_manual_review_flagged_rows: flagCounts.rules_manual_review || 0,
    squad_status_manual_review_rows: flagCounts.squad_review_status || 0,
    official_squads_import_status: officialSquadsReport.status,
    official_rules_import_status: rulesMeta.rules_import_status,
    safe_for_preliminary_minutes_model_staging: true,
    safe_for_final_public_recommendations: false,
    safe_for_final_team_builder_promotion: false
  };
}

function buildQa({ players, stopConditions, coverageReport }) {
  const countsByStatus = countBy(players, (row) => row.model_input_status);
  const countsByCountry = countBy(players, (row) => row.country);
  const countsByPosition = countBy(players, (row) => row.official_fantasy_position);
  const countsByFlag = countBy(
    players.flatMap((row) => row.data_quality_flags.map((flag) => ({ flag }))),
    (row) => row.flag
  );
  const blocked = stopConditions.filter((condition) => condition.status === "stop");
  const warnings = [
    {
      id: "fantasy_pool_only_stage",
      count: players.filter((row) => row.squad_status_source_level === "fantasy_pool_only").length,
      details: "Rows are staged from the official fantasy pool only, not source-backed final squads."
    },
    {
      id: "missing_enrichment",
      count: coverageReport.totals?.players_with_missing_enrichment || 0,
      details: "Some players are missing club context or national-team usage."
    },
    {
      id: "squad_review_status",
      count: countsByFlag.squad_review_status || 0,
      details: "Squad review rows remain blocked from preliminary selectable-player modeling."
    }
  ];

  return {
    schema_version: "player_recommendation_inputs_qa_v1",
    generated_at: TODAY,
    stage: "fantasy_pool_only",
    counts_by_status: countsByStatus,
    counts_by_country: countsByCountry,
    counts_by_position: countsByPosition,
    counts_by_data_quality_flag: countsByFlag,
    blockers: blocked,
    warnings,
    stop_conditions: stopConditions,
    recommended_next_step: "Use this file only for preliminary fantasy_pool_only model staging. Resolve source-backed final squads and official rules manual-review warnings before final public recommendations or Team Builder promotion."
  };
}

function buildReport({ summary, qa, stopConditions }) {
  const topFlags = sortedEntries(qa.counts_by_data_quality_flag).slice(0, 12);
  const topCountries = sortedEntries(qa.counts_by_country).slice(0, 12);
  const topBlockers = stopConditions.filter((condition) => condition.status === "stop");

  return [
    "# Player Recommendation Inputs Report v1",
    "",
    `Generated: ${TODAY}`,
    "",
    "## Scope",
    "",
    "This is a limited `fantasy_pool_only` staging layer. It combines official fantasy player IDs, prices, positions, identity mappings, squad staging, club context, and national-team usage enrichment. It does not treat fantasy-selectable players as final-squad-confirmed players and does not update active recommendations, projections, Team Builder, browser-ready files, captain logic, substitution logic, or UX.",
    "",
    "## Summary",
    "",
    mdTable(["Metric", "Count / status"], [
      ["Total official fantasy players", summary.total_official_fantasy_players],
      ["Rows in playerRecommendationInputs_v1.json", summary.total_model_input_rows],
      ["Selectable players", summary.selectable_players],
      ["Not selectable players", summary.not_selectable_players],
      ["Final-squad-confirmed players", summary.final_squad_confirmed_players],
      ["Fantasy-pool-only players", summary.fantasy_pool_only_players],
      ["Squad review players", summary.review_players],
      ["Rows blocked from future modeling", summary.blocked_rows],
      ["Rows usable with warnings", summary.usable_with_warning_rows],
      ["Rows usable as fantasy-pool-only", summary.usable_fantasy_pool_only_rows],
      ["Rows needing review", summary.needs_review_rows],
      ["Thin profiles", summary.thin_profile_rows],
      ["Missing club context", summary.missing_club_context_rows],
      ["Missing national-team usage", summary.missing_national_team_usage_rows],
      ["High-price players missing usage", summary.high_price_missing_usage_rows],
      ["Position-conflict audit rows", summary.position_conflict_audit_rows],
      ["Rules manual-review flagged rows", summary.rules_manual_review_flagged_rows],
      ["Squad-status manual-review flagged rows", summary.squad_status_manual_review_rows],
      ["Official squad import status", summary.official_squads_import_status],
      ["Official rules import status", summary.official_rules_import_status]
    ]),
    "",
    "## Model Input Status Counts",
    "",
    mdTable(["Status", "Rows"], sortedEntries(qa.counts_by_status)),
    "",
    "## Top Data-Quality Flags",
    "",
    mdTable(["Flag", "Rows"], topFlags),
    "",
    "## Largest Country Pools",
    "",
    mdTable(["Country", "Rows"], topCountries),
    "",
    "## Stop Conditions",
    "",
    mdTable(["Stop condition", "Status", "Count", "Details"], stopConditions.map((condition) => [
      condition.id,
      condition.status,
      condition.count,
      condition.details
    ])),
    "",
    "## Top Blockers",
    "",
    topBlockers.length
      ? mdTable(["Blocker", "Count", "Details"], topBlockers.map((condition) => [
        condition.id,
        condition.count,
        condition.details
      ]))
      : "No stop-condition blockers were detected.",
    "",
    "## Safety Decision",
    "",
    "- Safe for a preliminary minutes/model staging pass: yes, only as `fantasy_pool_only` and only with conservative handling of missing usage, missing club context, thin profiles, and squad-review rows.",
    "- Safe for final public recommendations: no.",
    "- Safe for final Team Builder promotion: no.",
    "",
    "## Required Next Step",
    "",
    "Resolve source-backed final squads and remaining official-rules manual-review warnings before final model promotion. Browser-ready files must be regenerated only after the active official model inputs are intentionally promoted.",
    ""
  ].join("\n");
}

async function main() {
  const [
    officialFantasyPlayers,
    officialFantasyImportReport,
    officialFantasyRules,
    officialFantasyRulesImportReport,
    officialSquads,
    officialSquadsImportReport,
    identityRows,
    manualOverrideRows,
    identityReviewRows,
    clubRows,
    usageRows,
    coverageReport,
    readiness
  ] = await Promise.all([
    readJson(INPUTS.officialFantasyPlayers),
    readJson(INPUTS.officialFantasyImportReport),
    readJson(INPUTS.officialFantasyRules),
    readJson(INPUTS.officialFantasyRulesImportReport),
    readJson(INPUTS.officialSquads),
    readJson(INPUTS.officialSquadsImportReport),
    readDelimitedIfExists(INPUTS.identityMap),
    readDelimitedIfExists(INPUTS.identityManualOverrides),
    readDelimitedIfExists(INPUTS.identityReviewQueue),
    readDelimitedIfExists(INPUTS.clubContext),
    readDelimitedIfExists(INPUTS.qualifierUsage),
    readJson(INPUTS.coverageReport),
    readJson(INPUTS.readiness)
  ]);

  const officialFantasyRows = officialFantasyPlayers.officialFantasyPlayers || [];
  const officialSquadsRows = officialSquads.officialSquads || [];
  const rulesMeta = rulesFlags(officialFantasyRules, officialFantasyRulesImportReport);
  const identityByOfficialId = indexBy(identityRows, "official_fantasy_player_id");
  const overrideByOfficialId = indexBy(manualOverrideRows, "official_fantasy_player_id");
  const squadByOfficialId = indexBy(officialSquadsRows, "official_fantasy_player_id");
  const clubByOfficialId = indexBy(clubRows, "official_fantasy_player_id");
  const usageByOfficialId = indexBy(usageRows, "official_fantasy_player_id");
  const highPriceMissingUsageIds = new Set(
    (coverageReport.qa?.high_price_players_with_missing_usage || [])
      .map((row) => normalizeKey(row.official_fantasy_player_id))
      .filter(Boolean)
  );

  const duplicateOfficialIds = duplicateValues(officialFantasyRows, "official_fantasy_player_id");
  const missingPriceCount = officialFantasyRows.filter((row) => numberOrNull(row.official_price) === null).length;
  const missingPositionCount = officialFantasyRows.filter((row) => !hasValue(row.official_fantasy_position)).length;
  const unresolvedIdentityRows = identityRows.filter((row) =>
    UNRESOLVED_IDENTITY_STATUSES.has(row.match_status) ||
    !ACCEPTED_IDENTITY_STATUSES.has(row.match_status) ||
    !hasValue(row.internal_player_id)
  );
  const acceptedInternalMappings = identityRows.filter((row) =>
    ACCEPTED_IDENTITY_STATUSES.has(row.match_status) &&
    hasValue(row.internal_player_id) &&
    !String(row.internal_player_id).startsWith("thin-")
  );
  const duplicateInternalMappings = duplicateValues(acceptedInternalMappings, "internal_player_id");

  const players = buildPlayerRows({
    officialFantasyRows,
    identityByOfficialId,
    overrideByOfficialId,
    squadByOfficialId,
    clubByOfficialId,
    usageByOfficialId,
    highPriceMissingUsageIds,
    rulesMeta
  });

  const stopConditions = buildStopConditions({
    missingPriceCount,
    missingPositionCount,
    identityReviewRows,
    duplicateOfficialIds,
    unresolvedIdentityRows,
    duplicateInternalMappings,
    officialSquadsReport: officialSquadsImportReport,
    officialSquadsRows,
    rulesMeta
  });
  const summary = buildSummary(players, officialFantasyRows, officialSquadsImportReport, rulesMeta);
  const qa = buildQa({ players, stopConditions, coverageReport });
  const report = buildReport({ summary, qa, stopConditions });

  const output = {
    schema_version: "player_recommendation_inputs_v1",
    generated_at: TODAY,
    stage: "fantasy_pool_only",
    data_status: "staged_fantasy_pool_only_not_final_squad_ready",
    input_files: INPUTS,
    output_files: {
      player_recommendation_inputs: OUTPUT_INPUTS,
      qa: OUTPUT_QA,
      report: OUTPUT_REPORT
    },
    source_status: {
      official_fantasy_import_status: officialFantasyImportReport.status,
      official_rules_import_status: officialFantasyRulesImportReport.status,
      official_squads_import_status: officialSquadsImportReport.status,
      official_readiness_status: readiness.status
    },
    safety: {
      safe_for_preliminary_minutes_model_staging: true,
      safe_for_final_public_recommendations: false,
      safe_for_final_team_builder_promotion: false,
      final_squad_ready: false,
      notes: [
        "Fantasy-selectable players are not treated as confirmed final-squad players.",
        "Rows with missing club context or national-team usage keep null values and data-quality flags.",
        "This file is not browser-ready and is not loaded by the active site."
      ]
    },
    summary,
    stop_conditions: stopConditions,
    players
  };

  await writeFile(OUTPUT_INPUTS, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  await writeFile(OUTPUT_QA, `${JSON.stringify(qa, null, 2)}\n`, "utf8");
  await writeFile(OUTPUT_REPORT, report, "utf8");

  console.log(`${OUTPUT_INPUTS}: ${players.length} rows`);
  console.log(`${OUTPUT_QA}: ${summary.blocked_rows} blocked, ${summary.usable_with_warning_rows} usable_with_warning`);
  console.log(`${OUTPUT_REPORT}: fantasy_pool_only stage, final promotion blocked`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
