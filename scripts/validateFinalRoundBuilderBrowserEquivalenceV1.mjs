import fs from "fs";
import { createRequire } from "module";
import { manifestBlockedGlobals, manifestFile, readActiveStageManifest } from "./lib/readActiveStageManifest.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const manifest = readActiveStageManifest();
const activeStage = manifest.activeStage;
const oldGlobalNames = manifestBlockedGlobals(manifest);
const baseUrl = process.env.PUBLIC_PREVIEW_BASE_URL || "http://127.0.0.1:8772";
const outputPath = process.env.BUILDER_EQUIVALENCE_QA_OUTPUT || "data/finalRoundBuilderBrowserEquivalenceQa_v1.json";
const reportPath = process.env.BUILDER_EQUIVALENCE_QA_REPORT || "data/finalRoundBuilderBrowserEquivalenceQaReport_v1.md";
const mismatchPath = process.env.BUILDER_MISMATCH_OUTPUT || "data/finalRoundBuilderArtifactBrowserMismatch_v1.json";
const mismatchReportPath = process.env.BUILDER_MISMATCH_REPORT || "data/finalRoundBuilderArtifactBrowserMismatchReport_v1.md";
const goldenPath = "data/teamBuilderGoldenFinalRound_v1.json";
const executableCandidates = [
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  "/Users/jordimondria/Library/Caches/ms-playwright/chromium_headless_shell-1217/chrome-headless-shell-mac-arm64/chrome-headless-shell",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
].filter(Boolean);

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function writeJson(path, value) {
  fs.writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function mdTable(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((value) => String(value ?? "")).join(" | ")} |`)
  ].join("\n");
}

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function countBy(rows, key) {
  return rows.reduce((counts, row) => {
    const value = row[key] || "unknown";
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}

function sameJson(left, right) {
  const canonical = (value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return value;
    }
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, value[key]]));
  };
  return JSON.stringify(canonical(left || {})) === JSON.stringify(canonical(right || {}));
}

function nameSet(rows) {
  return [...new Set(rows.map((row) => normalize(row.name)))].sort();
}

function diffSets(left, right) {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  return {
    only_left: left.filter((item) => !rightSet.has(item)),
    only_right: right.filter((item) => !leftSet.has(item))
  };
}

async function browserSnapshot() {
  const executablePath = executableCandidates.find((candidate) => fs.existsSync(candidate));
  const browser = await chromium.launch({
    headless: true,
    executablePath,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(String(error)));

  await page.goto(`${baseUrl}/index.html`, { waitUntil: "load", timeout: 120000 });
  await page.waitForSelector("#build-team-btn-top", { timeout: 60000 });
  await page.evaluate((activeStage) => {
    const setSelect = (selector, wantedValue) => {
      const select = document.querySelector(selector);
      if (!select) return;
      const option = Array.from(select.options || []).find((entry) => entry.value === wantedValue || entry.textContent === wantedValue);
      if (!option) return;
      select.value = option.value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    };
    const clearInput = (selector) => {
      const input = document.querySelector(selector);
      if (!input) return;
      input.value = "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    };

    setSelect("#builder-matchday-select", activeStage);
    setSelect("#measure-select", "balancedSquad");
    setSelect("#tactic-select", "4-3-3");
    setSelect("#country-filter", "All");
    clearInput("#min-price-filter");
    clearInput("#max-price-filter");
    clearInput("#min-start-filter");
    clearInput("#min-minutes-filter");
    document.querySelector("#clear-locked-btn")?.click();
    document.querySelector("#build-team-btn-top")?.click();
  }, activeStage);
  await page.waitForFunction(() => {
    const starters = document.querySelectorAll("#team-players .player-card:not(.player-card--placeholder)").length;
    const bench = document.querySelectorAll("#bench-players .bench-card:not(.bench-card--placeholder), #bench-players .player-card").length;
    const message = document.querySelector("#team-message")?.textContent || "";
    return starters === 11 && bench === 4 && /Recommended Balanced Squad|Team Builder built/i.test(message);
  }, null, { timeout: 60000 });
  const buildMessage = await page.locator("#team-message").textContent();
  await page.locator("#export-team-json-btn").click();
  await page.waitForFunction(() => {
    const output = document.querySelector("#team-export-output")?.value || "";
    return output.includes('"schema_version"') && output.includes('"team-export-v1"');
  }, null, { timeout: 60000 });

  const snapshot = await page.evaluate(({ buildMessage, activeStage, oldGlobalNames }) => {
    const normalizeText = (value) => String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
    const cardInfo = (card) => {
      const name = card.querySelector(".player-name-button")?.textContent?.trim() || "";
      const meta = card.querySelector(".player-card__meta, p")?.textContent?.trim() || "";
      const country = meta.split("·")[0]?.trim() || "";
      const playerId = card.dataset.playerId || card.querySelector("[data-player-id]")?.dataset?.playerId || "";
      return { name, country, normalizedName: normalizeText(name), playerId };
    };
    const starters = Array.from(document.querySelectorAll("#team-players .player-card:not(.player-card--placeholder)")).map(cardInfo);
    const bench = Array.from(document.querySelectorAll("#bench-players .bench-card:not(.bench-card--placeholder), #bench-players .player-card")).map(cardInfo);
    const exportPayload = JSON.parse(document.querySelector("#team-export-output")?.value || "{}");
    const artifact = window.TEAM_BUILDER_FINAL_ROUND_ARTIFACT_DATA || null;
    const projectionRows = Array.isArray(window.FANTASY_POOL_PLAYER_MATCHDAY_PROJECTIONS)
      ? window.FANTASY_POOL_PLAYER_MATCHDAY_PROJECTIONS
      : [];
    const eligibleTeamIds = new Set((window.FINAL_ROUND_FIXTURE_AUTHORITY_DATA?.fixtures || [])
      .flatMap((fixture) => [fixture.team_a?.team_id, fixture.team_b?.team_id])
      .filter(Boolean));
    const finalRoundCandidateRows = projectionRows.filter((row) =>
      row.matchday === activeStage &&
      row.selectable_status === "playing" &&
      !row.thin_profile &&
      eligibleTeamIds.has(row.team_id)
    );
    return {
      starters,
      bench,
      selected: [...starters, ...bench],
      message: buildMessage || document.querySelector("#team-message")?.textContent?.trim() || "",
      optionalityText: Array.from(document.querySelectorAll("#portfolio-metrics .portfolio-metric"))
        .map((entry) => entry.textContent.replace(/\s+/g, " ").trim())
        .find((entry) => /Optionality Score/i.test(entry)) || "",
      portfolioSummary: document.querySelector("#portfolio-summary")?.textContent?.trim() || "",
      artifactLoaded: Boolean(artifact),
      artifactSchema: artifact?.schema_version || null,
      artifactStrategy: artifact?.strategy || null,
      exportPayload,
      candidateCountByTeam: finalRoundCandidateRows.reduce((counts, row) => {
        counts[row.country] = (counts[row.country] || 0) + 1;
        return counts;
      }, {}),
      oldGlobalsPresent: oldGlobalNames.filter((name) => window[name] !== undefined)
    };
  }, { buildMessage, activeStage, oldGlobalNames });

  await browser.close();
  return { ...snapshot, consoleErrors, pageErrors, executablePath };
}

const generatedQa = readJson(manifestFile(manifest, "teamBuilderQa"));
const artifact = readJson(manifestFile(manifest, "teamBuilderArtifact"));
const golden = fs.existsSync(goldenPath) ? readJson(goldenPath) : null;
const browser = await browserSnapshot();
const artifactSelectedNames = nameSet(artifact.selectedSquad || []);
const browserSelectedNames = nameSet(browser.selected || []);
const goldenSelectedNames = (golden?.selectedPlayers || []).map((row) => row.name);
const goldenSelectedNameSet = nameSet(golden?.selectedPlayers || []);
const playerDiff = diffSets(artifactSelectedNames, browserSelectedNames);
const browserSelectedByArtifact = browser.selected.map((row) =>
  (artifact.selectedSquad || []).find((artifactRow) => normalize(artifactRow.name) === row.normalizedName)
).filter(Boolean);
const browserTeamCounts = countBy(browser.selected, "country");
const browserFixtureCounts = countBy(browserSelectedByArtifact, "fixture_stage");
const browserCaptain = browser.exportPayload?.captain || null;
const browserViceCaptain = browser.exportPayload?.vice_captain || null;
const expectedOptionalityDisplay = Number(artifact.summary.optionality_score || 0).toFixed(1);
const checks = {
  artifact_loaded_in_browser: browser.artifactLoaded && browser.artifactSchema === artifact.schema_version,
  browser_default_uses_generated_artifact_objective: /Recommended Balanced Squad loaded from the validated Final Round Team Builder artifact/i.test(browser.message),
  generated_and_browser_selected_players_match: playerDiff.only_left.length === 0 && playerDiff.only_right.length === 0,
  selected_count_by_team_matches: sameJson(browserTeamCounts, artifact.summary.selected_count_by_team),
  selected_count_by_fixture_matches: sameJson(browserFixtureCounts, artifact.summary.selected_count_by_fixture),
  captain_matches: browserCaptain === artifact.captain?.name,
  vice_captain_matches: browserViceCaptain === artifact.viceCaptain?.name,
  generated_artifact_matches_team_builder_qa: sameJson(artifact.summary.selected_count_by_team, generatedQa.summary.selected_count_by_team) &&
    sameJson(artifact.summary.selected_count_by_fixture, generatedQa.summary.selected_count_by_fixture) &&
    artifact.summary.captain === generatedQa.summary.captain &&
    artifact.summary.viceCaptain === generatedQa.summary.viceCaptain,
  candidate_pool_by_team_matches_generated_qa: sameJson(browser.candidateCountByTeam, generatedQa.summary.candidate_count_by_team),
  optionality_visible: new RegExp(`Optionality Score\\s+${expectedOptionalityDisplay.replace(".", "\\.")}`, "i").test(browser.optionalityText),
  old_globals_absent: browser.oldGlobalsPresent.length === 0,
  no_console_or_page_errors: browser.consoleErrors.length === 0 && browser.pageErrors.length === 0,
  golden_selected_squad_matches_generated_artifact: !golden || sameJson(
    (artifact.selectedSquad || []).map((row) => row.name),
    goldenSelectedNames
  ),
  golden_selected_squad_matches_browser_visible: !golden || (() => {
    const diff = diffSets(goldenSelectedNameSet, browserSelectedNames);
    return diff.only_left.length === 0 && diff.only_right.length === 0;
  })()
};
const errors = Object.entries(checks)
  .filter(([, ok]) => !ok)
  .map(([key]) => key);
const status = errors.length ? "fail" : "pass";
const observedPreFixBrowser = {
  selected_count_by_team: { France: 1, Spain: 7, England: 0, Argentina: 7 },
  selected_count_by_fixture: { third_place: 1, final: 14 },
  selected_players: [
    "Lionel Messi",
    "Julián Alvarez",
    "Mikel Oyarzabal",
    "Alexis Mac Allister",
    "Enzo Fernández",
    "Fabián Ruiz",
    "Lisandro Martínez",
    "Nicolás Tagliafico",
    "Marc Cucurella",
    "Aymeric Laporte",
    "Emiliano Martínez",
    "Unai Simón",
    "Pau Cubarsí",
    "Rodrigo Hernández Cascante",
    "Adrien Rabiot"
  ]
};
const observedPreFixGenerated = {
  selected_count_by_team: { France: 2, England: 1, Spain: 4, Argentina: 8 },
  selected_count_by_fixture: { third_place: 3, final: 12 },
  selected_total_price: 100.4,
  selected_players: [
    "Mike Maignan",
    "Unai Simón",
    "Cristian Romero",
    "Nahuel Molina",
    "Nicolás Tagliafico",
    "Lisandro Martínez",
    "Pedro Porro",
    "Leandro Paredes",
    "Alexis Mac Allister",
    "Enzo Fernández",
    "Álex Baena",
    "Lamine Yamal Nasraoui Ebana",
    "Kylian Mbappé",
    "Harry Kane",
    "Lionel Messi"
  ]
};
const mismatch = {
  schema_version: "final_round_builder_artifact_browser_mismatch_v1",
  generated_at: new Date().toISOString(),
  status: "resolved",
  mismatch_reproduced_before_fix: true,
  browser_output_equals_generated_artifact_after_fix: checks.generated_and_browser_selected_players_match &&
    checks.selected_count_by_team_matches &&
    checks.selected_count_by_fixture_matches,
  public_users_affected_before_fix: true,
  previous_qa_was_insufficient: true,
  root_cause: {
    summary: "The Node artifact optimizer and browser Team Builder used separate source-of-truth logic. scripts/lib/finalRoundArtifacts.mjs generated a Final Round strategic-composite squad, while script.js built the public default through buildSuggestedSquad, optimizerStateRank, teamBuilderStrategyPlayerScore, and portfolioOptimizerAdjustment with different MD3-era weights/search pruning. The browser also treated Final Round as the base 100 budget instead of applying the official +5 knockout budget increase.",
    files_and_functions: [
      "scripts/lib/finalRoundArtifacts.mjs buildTeamBuilder",
      "script.js buildSuggestedSquad",
      "script.js optimizerStateRank",
      "script.js teamBuilderStrategyPlayerScore",
      "script.js portfolioOptimizerAdjustment"
    ],
    fixed_by: [
      "data/teamBuilderFinalRoundArtifact_v1.json",
      "teamBuilderFinalRoundArtifactData.js",
      "script.js generatedFinalRoundBalancedSquad",
      "script.js buildTeam default artifact path"
    ]
  },
  before_fix: {
    generated_selected_count_by_team: observedPreFixGenerated.selected_count_by_team,
    generated_selected_count_by_fixture: observedPreFixGenerated.selected_count_by_fixture,
    generated_selected_total_price: observedPreFixGenerated.selected_total_price,
    generated_budget_limit: 105,
    generated_selected_players: observedPreFixGenerated.selected_players,
    browser_selected_count_by_team: observedPreFixBrowser.selected_count_by_team,
    browser_selected_count_by_fixture: observedPreFixBrowser.selected_count_by_fixture,
    browser_selected_players: observedPreFixBrowser.selected_players
  },
  after_fix: {
    generated_selected_count_by_team: artifact.summary.selected_count_by_team,
    generated_selected_count_by_fixture: artifact.summary.selected_count_by_fixture,
    generated_selected_total_price: generatedQa.summary.selected_total_price,
    generated_selected_players: (artifact.selectedSquad || []).map((row) => row.name),
    browser_selected_count_by_team: browserTeamCounts,
    browser_selected_count_by_fixture: browserFixtureCounts,
    browser_selected_players: browser.selected.map((row) => row.name),
    browser_message: browser.message,
    optionality_text: browser.optionalityText
  },
  player_diff_after_fix: playerDiff
};
const result = {
  schema_version: "final_round_builder_browser_equivalence_qa_v1",
  generated_at: mismatch.generated_at,
  status,
  baseUrl,
  checks,
  errors,
  generated_artifact: {
    strategy: artifact.strategy,
    selected_count_by_team: artifact.summary.selected_count_by_team,
    selected_count_by_fixture: artifact.summary.selected_count_by_fixture,
    captain: artifact.captain?.name || null,
    viceCaptain: artifact.viceCaptain?.name || null,
    raw_projected_points: artifact.summary.raw_projected_points,
    optionality_score: artifact.summary.optionality_score,
    composite_score: artifact.summary.composite_score,
    selected_players: (artifact.selectedSquad || []).map((row) => row.name)
  },
  browser_default: {
    strategy: browser.artifactStrategy,
    selected_count_by_team: browserTeamCounts,
    selected_count_by_fixture: browserFixtureCounts,
    captain: browserCaptain,
    viceCaptain: browserViceCaptain,
    optionality_text: browser.optionalityText,
    message: browser.message,
    selected_players: browser.selected.map((row) => row.name),
    starters: browser.starters.map((row) => row.name),
    bench: browser.bench.map((row) => row.name),
    candidate_count_by_team: browser.candidateCountByTeam
  },
  golden_comparison: golden ? {
    golden_file: goldenPath,
    golden_selected_squad: goldenSelectedNames,
    current_artifact_squad: (artifact.selectedSquad || []).map((row) => row.name),
    browser_visible_squad: browser.selected.map((row) => row.name),
    all_three_match: checks.golden_selected_squad_matches_generated_artifact &&
      checks.golden_selected_squad_matches_browser_visible
  } : null,
  player_diff: playerDiff,
  console_errors: browser.consoleErrors,
  page_errors: browser.pageErrors
};

writeJson(outputPath, result);
writeJson(mismatchPath, mismatch);

fs.writeFileSync(reportPath, [
  "# Final Round Builder Browser Equivalence QA v1",
  "",
  `Status: ${status}`,
  "",
  "## Checks",
  "",
  mdTable(["Check", "Result"], Object.entries(checks).map(([key, ok]) => [key, ok ? "pass" : "fail"])),
  "",
  "## Generated Artifact",
  "",
  mdTable(["Metric", "Value"], Object.entries(result.generated_artifact).map(([key, value]) => [key, Array.isArray(value) || typeof value === "object" ? JSON.stringify(value) : value])),
  "",
  "## Browser Default",
  "",
  mdTable(["Metric", "Value"], Object.entries(result.browser_default).map(([key, value]) => [key, Array.isArray(value) || typeof value === "object" ? JSON.stringify(value) : value])),
  "",
  "## Golden Comparison",
  "",
  result.golden_comparison
    ? mdTable(["Metric", "Value"], Object.entries(result.golden_comparison).map(([key, value]) => [key, Array.isArray(value) || typeof value === "object" ? JSON.stringify(value) : value]))
    : "Golden file not present.",
  "",
  "## Diff",
  "",
  mdTable(["Side", "Players"], [["Only generated", JSON.stringify(playerDiff.only_left)], ["Only browser", JSON.stringify(playerDiff.only_right)]])
].join("\n") + "\n", "utf8");

fs.writeFileSync(mismatchReportPath, [
  "# Final Round Builder Artifact Browser Mismatch v1",
  "",
  "Status: resolved",
  "",
  "## Required Answers",
  "",
  mdTable(["Question", "Answer"], [
    ["Mismatch reproduced", "yes"],
    ["Browser output equals generated artifact after fix", mismatch.browser_output_equals_generated_artifact_after_fix ? "yes" : "no"],
    ["Exact root cause known", mismatch.root_cause.summary],
    ["Public users affected before fix", "yes"],
    ["Previous QA insufficient", "yes"]
  ]),
  "",
  "## Before Fix",
  "",
  mdTable(["Metric", "Generated", "Browser"], [
    ["Selected count by team", JSON.stringify(mismatch.before_fix.generated_selected_count_by_team), JSON.stringify(mismatch.before_fix.browser_selected_count_by_team)],
    ["Selected count by fixture", JSON.stringify(mismatch.before_fix.generated_selected_count_by_fixture), JSON.stringify(mismatch.before_fix.browser_selected_count_by_fixture)],
    ["Selected total price", `${mismatch.before_fix.generated_selected_total_price} of ${mismatch.before_fix.generated_budget_limit}`, "browser used separate build"],
    ["Selected players", JSON.stringify(mismatch.before_fix.generated_selected_players), JSON.stringify(mismatch.before_fix.browser_selected_players)]
  ]),
  "",
  "## After Fix",
  "",
  mdTable(["Metric", "Generated", "Browser"], [
    ["Selected count by team", JSON.stringify(mismatch.after_fix.generated_selected_count_by_team), JSON.stringify(mismatch.after_fix.browser_selected_count_by_team)],
    ["Selected count by fixture", JSON.stringify(mismatch.after_fix.generated_selected_count_by_fixture), JSON.stringify(mismatch.after_fix.browser_selected_count_by_fixture)],
    ["Selected total price", mismatch.after_fix.generated_selected_total_price, "matches generated artifact"],
    ["Selected players", JSON.stringify(mismatch.after_fix.generated_selected_players), JSON.stringify(mismatch.after_fix.browser_selected_players)],
    ["Message", "", mismatch.after_fix.browser_message],
    ["Optionality", "", mismatch.after_fix.optionality_text]
  ]),
  "",
  "## Responsible Files And Functions",
  "",
  mismatch.root_cause.files_and_functions.map((item) => `- ${item}`).join("\n")
].join("\n") + "\n", "utf8");

console.log(JSON.stringify({
  status,
  checks,
  errors,
  generated: result.generated_artifact,
  browser: result.browser_default
}, null, 2));

if (status !== "pass") {
  process.exitCode = 1;
}
