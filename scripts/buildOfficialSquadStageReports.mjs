import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TODAY = "2026-06-02";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, "..");

const OFFICIAL_SQUADS = "data/officialSquads_v0.json";
const SQUADS_REPORT = "data/officialSquadsImportReport_v0.json";
const OFFICIAL_FANTASY_PLAYERS = "data/officialFantasyPlayers_v0.json";
const CURRENT_PLAYERS = "data/players.json";

function abs(relativePath) {
  return path.join(PROJECT_ROOT, relativePath);
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(abs(relativePath), "utf8"));
}

function countBy(rows, keyFn) {
  return rows.reduce((counts, row) => {
    const key = keyFn(row) || "missing";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function sortedEntries(counts) {
  return Object.entries(counts).sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])));
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

function duplicateNameGroups(rows) {
  const byNameCountry = new Map();
  rows.forEach((row) => {
    const key = `${row.country || ""}|${row.name || ""}`;
    const group = byNameCountry.get(key) || [];
    group.push(row);
    byNameCountry.set(key, group);
  });
  return [...byNameCountry.entries()].filter(([, group]) => group.length > 1);
}

function buildReviewReport({ officialRows, importReport }) {
  const statusCounts = importReport.summary.imported_status_counts || {};
  const reviewRows = officialRows.filter((row) =>
    row.validation_errors?.length ||
    row.current_player_match?.match_status !== "matched" ||
    ["review", "unknown"].includes(row.roster_status)
  );
  const byCountry = sortedEntries(countBy(reviewRows, (row) => row.country));
  const byPosition = sortedEntries(countBy(reviewRows, (row) => row.official_fantasy_position || row.position));
  const byReason = sortedEntries(importReport.summary.review_reason_counts || {});
  const duplicates = duplicateNameGroups(officialRows);

  const duplicateRows = duplicates.map(([key, group]) => [
    key.replace("|", " / "),
    group.map((row) => row.official_fantasy_player_id || "").join(", "),
    group.map((row) => row.official_fantasy_position || row.position || "").join(", "),
    group.map((row) => row.current_player_match?.player_id || "").join(", "),
    group.every((row) => row.official_fantasy_player_id)
      ? "distinct official fantasy IDs; keep separate"
      : "unresolved duplicate"
  ]);

  const reviewDecisionRows = reviewRows
    .slice()
    .sort((a, b) =>
      String(a.country).localeCompare(String(b.country)) ||
      String(a.name).localeCompare(String(b.name)) ||
      Number(a.official_fantasy_player_id || 0) - Number(b.official_fantasy_player_id || 0)
    )
    .map((row) => [
      row.official_fantasy_player_id,
      row.name,
      row.country,
      row.official_fantasy_position || row.position || "",
      row.official_price || "",
      row.fantasy_status || "",
      (row.review_reasons || []).join("; ") || "manual_review_required",
      "keep review",
      "Missing player-level final-squad, removal, or replacement source."
    ]);

  const lines = [
    "# Official Squad Review Resolution Report v1",
    "",
    `Generated: ${TODAY}`,
    "",
    "## Scope",
    "",
    "This pass resolves the squad staging layer only. It does not promote fantasy-selectable players to confirmed final squads and does not change model inputs, browser-ready files, recommendations, projections, Team Builder, captain logic, or substitution logic.",
    "",
    "## Before and After",
    "",
    mdTable(["Metric", "Before", "After", "Decision"], [
      ["Imported squad rows", "1,481", String(importReport.summary.imported_rows), "unchanged"],
      ["Review rows", "225", String(importReport.summary.review_rows), "unchanged; reasons clarified"],
      ["Confirmed final squad rows", "0", String(statusCounts.confirmed_final_squad || 0), "unchanged; no player-level final source imported"],
      ["Fantasy-selectable-only rows", "1,256", String(statusCounts.selectable_fantasy_player || 0), "unchanged"],
      ["Teams marked complete", "0", String(importReport.summary.teams_marked_complete), "unchanged"],
      ["Import validation errors", "0", String(importReport.summary.error_rows), "unchanged"],
      ["Current-player matches", "1,481", String((importReport.summary.imported_match_status_counts || {}).matched || 0), "unchanged; identity layer is not the blocker"]
    ]),
    "",
    "## Review Reasons",
    "",
    mdTable(["Reason", "Rows", "Resolution"], byReason.map(([reason, count]) => [
      reason,
      count,
      reason === "fantasy_status_transferred_no_final_squad_source"
        ? "Keep review. Fantasy transferred status is not proof of final-squad exclusion or removal."
        : "Document and keep separate unless a hard duplicate conflict appears."
    ])),
    "",
    "All 225 review rows have official fantasy status `transferred`; none are unresolved identity joins. The imported status stays `imported_needs_manual_review` because no final-squad source confirms whether those players are in, out, removed, or replacement players.",
    "",
    "## Countries With Most Review Rows",
    "",
    mdTable(["Country", "Review rows"], byCountry.map(([country, count]) => [country, count])),
    "",
    "## Review Rows by Official Fantasy Position",
    "",
    mdTable(["Official fantasy position", "Review rows"], byPosition.map(([position, count]) => [position, count])),
    "",
    "## Duplicate-Name Cases",
    "",
    duplicates.length
      ? mdTable(["Country / name", "Official fantasy IDs", "Fantasy positions", "Mapped internal player IDs", "Decision"], duplicateRows)
      : "No duplicate name-country groups found.",
    "",
    "The Mexico `Jesús Angulo` duplicate is not a merge problem. Official fantasy IDs `745` and `1475` map to separate internal identities and remain separate. Both still require squad-status review because the fantasy status is `transferred` and no final-squad source is imported for either row.",
    "",
    "## Fantasy Status vs Squad Status Conflicts",
    "",
    "No rows were promoted to `confirmed_final_squad`, `injured_removed`, `replacement_player`, or `not_in_final_squad` from fantasy status alone. The current classification is intentionally conservative:",
    "",
    mdTable(["Fantasy status", "Current roster_status", "Rows", "Interpretation"], [
      ["playing", "selectable_fantasy_player", statusCounts.selectable_fantasy_player || 0, "In official fantasy pool only; not final-squad proof."],
      ["transferred", "review", statusCounts.review || 0, "Needs player-level source before inclusion/exclusion can be decided."]
    ]),
    "",
    "## Evidence Missing Before a Row Can Be Final",
    "",
    "A row can only become `confirmed_final_squad` when an official FIFA tournament squad source, official FIFA team page, or national federation final squad source provides player-level squad membership. A team can only be marked complete when the full player-level final squad is source-backed. Removal and replacement statuses also need explicit source-backed evidence.",
    "",
    "## Review Row Decisions",
    "",
    "Every row below remains `review`; no row can safely become final, excluded, removed, or replacement from the current repo evidence.",
    "",
    mdTable(["Official ID", "Name", "Country", "Position", "Price", "Fantasy status", "Review reasons", "Safe decision", "Evidence still needed"], reviewDecisionRows),
    "",
    "## Blockers Before Readiness",
    "",
    "- Final squads are not imported as complete, source-backed `confirmed_final_squad` rows.",
    "- The 225 `transferred` fantasy-status rows need player-level source review before model-input promotion.",
    "- Teams cannot be marked complete from fantasy pool data or partial/candidate article references.",
    "- Official rules still have manual-review warnings outside this squad pass.",
    ""
  ];

  return lines.join("\n");
}

function buildSourcePlan({ officialRows, importReport, currentPlayers }) {
  const statusCounts = importReport.summary.imported_status_counts || {};
  const fifaUrlByCountry = new Map();
  const currentStatusByCountry = new Map();

  currentPlayers.forEach((player) => {
    const urls = Array.isArray(player.source_urls) ? player.source_urls : [];
    const fifaUrl = urls.find((url) => typeof url === "string" && url.startsWith("https://www.fifa.com/"));
    if (fifaUrl && !fifaUrlByCountry.has(player.country)) {
      fifaUrlByCountry.set(player.country, fifaUrl);
    }
    const status = player.roster_status || player.data_quality?.roster_status;
    if (status) {
      const counts = currentStatusByCountry.get(player.country) || {};
      counts[status] = (counts[status] || 0) + 1;
      currentStatusByCountry.set(player.country, counts);
    }
  });

  const teams = [...officialRows.reduce((map, row) => {
    const team = map.get(row.country) || {
      country: row.country,
      team_id: row.team_id,
      rows: 0,
      selectable: 0,
      review: 0
    };
    team.rows += 1;
    if (row.roster_status === "selectable_fantasy_player") team.selectable += 1;
    if (row.roster_status === "review") team.review += 1;
    map.set(row.country, team);
    return map;
  }, new Map()).values()].sort((a, b) => Number(a.team_id) - Number(b.team_id));

  const countryRows = teams.map((team) => {
    const candidateUrl = fifaUrlByCountry.get(team.country) || "";
    const currentStatuses = Object.entries(currentStatusByCountry.get(team.country) || {})
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([status, count]) => `${status}:${count}`)
      .join("; ") || "none in current players.json";
    return [
      team.country,
      team.team_id,
      `${team.rows} rows (${team.selectable} fantasy-selectable, ${team.review} review)`,
      currentStatuses,
      candidateUrl ? "candidate stored reference only" : "no",
      candidateUrl,
      candidateUrl ? "FIFA hub" : "fantasy pool only",
      candidateUrl ? "not imported; requires player-level source check" : "no player-level final rows in fantasy pool",
      candidateUrl
        ? "Manually/API-check the candidate FIFA article for player-level final squad rows before import."
        : "Find official FIFA team page, FIFA tournament squad source, or federation final squad announcement.",
      team.selectable > 0
        ? "yes, for a limited fantasy_pool_only stage with warnings"
        : "no; row set is review-only or missing playable status"
    ];
  });

  const lines = [
    "# Final Squad Source Plan v1",
    "",
    `Generated: ${TODAY}`,
    "",
    "## Summary",
    "",
    "The official squad staging layer currently covers all 48 countries through the official FIFA fantasy player pool, but it has 0 source-backed final squad rows and 0 teams marked complete. The FIFA squad announcements hub and FIFA fantasy JSON sources were checked during this pass; they did not provide complete parseable player-level final squad rows in the current import path.",
    "",
    mdTable(["Metric", "Value"], [
      ["Countries covered by staged official squad rows", teams.length],
      ["Official fantasy pool rows", officialRows.length],
      ["Confirmed final squad rows", statusCounts.confirmed_final_squad || 0],
      ["Fantasy-selectable-only rows", statusCounts.selectable_fantasy_player || 0],
      ["Review rows", statusCounts.review || 0],
      ["Teams marked complete", importReport.summary.teams_marked_complete],
      ["Countries with stored FIFA candidate article references", [...fifaUrlByCountry.keys()].filter((country) => teams.some((team) => team.country === country)).length]
    ]),
    "",
    "## Source Plan by Country",
    "",
    mdTable(["Country", "Team ID", "Current squad status", "Existing players.json roster statuses", "Final-squad source exists", "Source URL if known", "Source type", "Player-level final rows parseable", "Recommended next action", "Fantasy-selectable-only acceptable for now"], countryRows),
    "",
    "## Hub Check Result",
    "",
    "The FIFA squad announcements hub URL is tracked in the source manifest. In this pass it did not expose complete player-level rows that could be imported safely from the checked page/search surfaces. Existing FIFA article URLs in `data/players.json` are useful candidate references, but they are not treated as final-squad proof until each country source is checked for complete player-level final data.",
    "",
    "## Next Action",
    "",
    "The next squad-focused pass should verify candidate FIFA article links and/or federation final-squad pages country by country, import only player-level final rows, and mark `team_squad_complete=true` only when the full final squad is source-backed.",
    ""
  ];

  return lines.join("\n");
}

async function main() {
  const squads = await readJson(OFFICIAL_SQUADS);
  const importReport = await readJson(SQUADS_REPORT);
  const fantasy = await readJson(OFFICIAL_FANTASY_PLAYERS);
  const currentPlayersData = await readJson(CURRENT_PLAYERS);
  const officialRows = squads.officialSquads || [];
  const currentPlayers = currentPlayersData.players || currentPlayersData || [];

  await writeFile(
    abs("data/officialSquadReviewResolutionReport_v1.md"),
    buildReviewReport({ officialRows, importReport, fantasyRows: fantasy.officialFantasyPlayers || [] }),
    "utf8"
  );
  await writeFile(
    abs("data/finalSquadSourcePlan_v1.md"),
    buildSourcePlan({ officialRows, importReport, currentPlayers }),
    "utf8"
  );

  console.log("data/officialSquadReviewResolutionReport_v1.md");
  console.log("data/finalSquadSourcePlan_v1.md");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
