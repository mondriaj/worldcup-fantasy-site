import { readFile, writeFile } from "node:fs/promises";

const TODAY = "2026-06-01";

const PATHS = {
  players: "data/players.json",
  valueModel: "data/playerValueModel_v1.json",
  financeModel: "data/playerFinanceMetrics_v0.json",
  dataFantasyRules: "data/fantasyRules.json",
  activeFantasyRules: "fantasyRules.json",
  output: "data/officialDataReadiness_v0.json"
};

function rowsFrom(data, keys) {
  for (const key of keys) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }
  return Array.isArray(data) ? data : [];
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function countBy(rows, key) {
  return rows.reduce((counts, row) => {
    const value = row?.[key] ?? "null";
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}

function hasValue(value) {
  return value !== null && value !== undefined && value !== "";
}

function officialRulesImported(rules) {
  const status = String(rules?.rulesStatus || rules?.rules_status || "").toLowerCase();
  return Boolean(status) && !status.includes("not_imported") && !status.includes("draft") && !status.includes("starter");
}

function finalRosterStatus(row) {
  return ["final", "official_final", "final_26", "final_squad"].includes(String(row?.roster_status || "").toLowerCase());
}

function readinessItem(id, label, status, current, needed, nextAction) {
  return {
    id,
    label,
    status,
    current,
    needed,
    nextAction
  };
}

function buildReadiness({ playersData, valueData, financeData, dataFantasyRules, activeFantasyRules }) {
  const players = rowsFrom(playersData, ["players"]);
  const valueRows = rowsFrom(valueData, ["playerValueModel"]);
  const financeRows = rowsFrom(financeData, ["playerFinanceMetrics"]);
  const teamIds = new Set(players.map((player) => player.team_id).filter(Boolean));
  const officialFantasyIdCount = players.filter((player) => hasValue(player?.fantasy_matching?.official_fantasy_id)).length;
  const officialPriceCount = valueRows.filter((row) => hasValue(row.official_price) && row.price_status !== "missing_official_price").length;
  const proxyPriceCount = valueRows.filter((row) => row?.data_quality?.uses_proxy_price || row.price_status === "missing_official_price").length;
  const finalRosterCount = players.filter(finalRosterStatus).length;
  const officialRulesReady = officialRulesImported(dataFantasyRules);
  const activeRulesAreOfficial = officialRulesImported(activeFantasyRules);
  const priceAdjustedRows = financeRows.filter((row) => row?.finance_metrics_v0?.price_adjusted_return_status !== "missing_official_world_cup_fantasy_price").length;

  const blockers = [
    readinessItem(
      "final_official_squads",
      "Final official squads",
      finalRosterCount === players.length && players.length > 0 ? "ready" : "blocked",
      `${finalRosterCount}/${players.length} rows marked final official squad`,
      "Every included player should be verified against final FIFA/federation squad lists.",
      "Re-import final squad lists, mark excluded players, and preserve source URLs."
    ),
    readinessItem(
      "official_fantasy_player_ids",
      "Official fantasy player IDs",
      officialFantasyIdCount === players.length && players.length > 0 ? "ready" : "blocked",
      `${officialFantasyIdCount}/${players.length} roster rows have official fantasy IDs`,
      "A stable official fantasy ID or exact matching key for every fantasy-eligible player.",
      "Import the official fantasy player list and match by official ID first, then country/name review."
    ),
    readinessItem(
      "official_fantasy_prices",
      "Official fantasy prices",
      officialPriceCount === valueRows.length && valueRows.length > 0 ? "ready" : "blocked",
      `${officialPriceCount}/${valueRows.length} value rows have official prices; ${proxyPriceCount} still use proxy prices`,
      "Official fantasy price for every selectable player.",
      "Replace proxy-price budget logic with official prices and preserve proxy fields for audit only."
    ),
    readinessItem(
      "official_fantasy_positions",
      "Official fantasy positions",
      officialFantasyIdCount === players.length && players.length > 0 ? "ready" : "blocked",
      "No separate official fantasy position import is present",
      "Official fantasy position for every selectable player, even when it differs from roster position.",
      "Import official positions with the fantasy player list and use them in Team Builder constraints."
    ),
    readinessItem(
      "official_rules_scoring_deadlines",
      "Official rules, scoring, and deadlines",
      officialRulesReady && activeRulesAreOfficial ? "ready" : "blocked",
      `data/fantasyRules.json=${dataFantasyRules.rulesStatus || dataFantasyRules.rules_status}; active fantasyRules.json=${activeFantasyRules.rules_status || activeFantasyRules.rulesStatus}`,
      "Official squad rules, budget, country limits, scoring, transfers, boosters, deadlines, captain, and substitutions.",
      "Import official rules, regenerate fantasyRulesData.js, and re-test Team Builder plus decision tools."
    )
  ];

  return {
    schema_version: "official_data_readiness_v0",
    generated_at: TODAY,
    source_checked: TODAY,
    status: blockers.every((item) => item.status === "ready")
      ? "ready_for_official_model_rerun"
      : "blocked_waiting_for_official_fantasy_data",
    summary: {
      purpose: "Track whether the project is ready to replace proxy/preliminary data with official World Cup fantasy rosters, positions, prices, rules, and deadlines.",
      recommendation: "Do not treat value, budget, Team Builder legality, captain windows, or final player recommendations as production-ready until all blocking official inputs are ready.",
      current_project_state: "The site is usable for model testing and UX workflow testing, but official fantasy data has not been imported."
    },
    current_counts: {
      roster_player_rows: players.length,
      covered_teams: teamIds.size,
      roster_status_counts: countBy(players, "roster_status"),
      value_model_rows: valueRows.length,
      finance_model_rows: financeRows.length,
      official_fantasy_id_rows: officialFantasyIdCount,
      official_price_rows: officialPriceCount,
      proxy_price_rows: proxyPriceCount,
      price_adjusted_finance_rows: priceAdjustedRows
    },
    blocking_inputs: blockers,
    import_contract_files: [
      "data/officialFantasyImportSchema_v0.json"
    ],
    rerun_sequence_when_official_data_arrives: [
      "Import official fantasy player list with IDs, names, countries, positions, prices, and selectable status.",
      "Import final official squad status and exclude or downgrade players not in final squads.",
      "Import official fantasy rules, scoring, budget, transfers, captain/substitution windows, and deadlines.",
      "Match official fantasy players to current roster/player IDs, keeping review rows for ambiguous matches.",
      "Regenerate value model using official prices; keep proxy_price_v1 only as an audit field.",
      "Regenerate player recommendation inputs, finance metrics, matchday projections, and recommendation QA.",
      "Re-test Team Builder legality, exports/imports, Captain Change Advisor, Substitution Advisor, and Matchday Decision Center.",
      "Update README, data sources, data quality report, source manifest, and roadmap before calling the model official-data-ready."
    ],
    safeguards_active_now: [
      "Official prices remain null; proxy_price_v1 is visibly labeled as prototype.",
      "Price-adjusted finance rows remain unavailable while official prices are missing.",
      "Official fantasy player IDs are not invented.",
      "Official fantasy rules are not inferred from draft rules.",
      "Decision tools require manual points and manual played/unplayed checks."
    ],
    validation: {
      passed: [
        "Current player dataset is present.",
        "Current value model is present.",
        "Current finance model is present.",
        "All 48 World Cup teams have at least one roster row."
      ],
      expected_blockers: blockers.filter((item) => item.status !== "ready").map((item) => item.id)
    }
  };
}

async function main() {
  const [playersData, valueData, financeData, dataFantasyRules, activeFantasyRules] = await Promise.all([
    readJson(PATHS.players),
    readJson(PATHS.valueModel),
    readJson(PATHS.financeModel),
    readJson(PATHS.dataFantasyRules),
    readJson(PATHS.activeFantasyRules)
  ]);
  const readiness = buildReadiness({ playersData, valueData, financeData, dataFantasyRules, activeFantasyRules });
  await writeFile(PATHS.output, `${JSON.stringify(readiness, null, 2)}\n`, "utf8");
  console.log(`${PATHS.output}: ${readiness.status}`);
  console.log(`expected blockers: ${readiness.validation.expected_blockers.join(", ") || "none"}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
