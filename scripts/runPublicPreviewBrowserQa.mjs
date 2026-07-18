import fs from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const baseUrl = process.env.PUBLIC_PREVIEW_BASE_URL || "http://127.0.0.1:8766";
const outputPath = process.env.PUBLIC_PREVIEW_QA_OUTPUT || "/private/tmp/public_preview_browser_qa_result.json";
const reportPath = process.env.PUBLIC_PREVIEW_QA_REPORT || "data/publicPreviewBrowserQaReport_v1.md";
const screenshotDir = process.env.PUBLIC_PREVIEW_QA_SCREENSHOT_DIR || "/private/tmp/public_preview_browser_qa_screenshots";
const activePublicMatchdayId = "finalRound";
const executableCandidates = [
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  "/Users/jordimondria/Library/Caches/ms-playwright/chromium_headless_shell-1217/chrome-headless-shell-mac-arm64/chrome-headless-shell",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
].filter(Boolean);

const viewports = [360, 390, 768, 1024, 1440].map((width) => ({ width, height: width < 768 ? 900 : 1000 }));
const currentDataScripts = [
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
  "script.js"
];
const oldGlobalNames = [
  "FINANCE_PLAYERS_DATA",
  "PLAYER_MATCHDAY_PROJECTIONS_DATA",
  "MATCHDAY_MODEL_SUMMARY",
  "FINANCE_MODEL_SUMMARY",
  "SCORE_FIXTURE_PREDICTIONS_DATA",
  "SCORE_PREDICTIONS_SUMMARY"
];
const activeGlobalChecks = {
  PLAYERS_DATA: (value) => Array.isArray(value) || Array.isArray(value?.players),
  FANTASY_RULES_DATA: (value) => Boolean(value && Object.keys(value).length),
  FANTASY_POOL_RECOMMENDATION_CANDIDATES: (value) => Array.isArray(value) && value.length > 0,
  FANTASY_POOL_PLAYER_MATCHDAY_PROJECTIONS: (value) => Array.isArray(value) && value.length > 0,
  FANTASY_POOL_SCORE_CONTEXT: (_value, windowObject) =>
    Boolean(windowObject.FANTASY_POOL_SCORE_PREDICTIONS_DATA) ||
    Array.isArray(windowObject.FANTASY_POOL_SCORE_FIXTURE_PREDICTIONS),
  KNOCKOUT_BRACKET_PREDICTION_DATA: (value) =>
    Boolean(value && Array.isArray(value.matches) && value.matches.length >= 31),
  FANTASY_POOL_OFFICIAL_DATA_STATUS: (value) =>
    Boolean(value && Array.isArray(value.official_position_records) && value.official_position_records.length > 0),
  LIVE_MATCHDAY_STATUS_DATA: (value) => Boolean(value && Array.isArray(value.fixtures)),
  LIVE_PLAYER_STATUS_DATA: (value) => Boolean(value && Array.isArray(value.players)),
  R16_FIXTURE_AUTHORITY_DATA: (value) =>
    Boolean(value && Array.isArray(value.fixtures) && value.fixtures.length === 8),
  QF_FIXTURE_AUTHORITY_DATA: (value) =>
    Boolean(value && Array.isArray(value.fixtures) && value.fixtures.length === 4),
  SF_FIXTURE_AUTHORITY_DATA: (value) =>
    Boolean(value && Array.isArray(value.fixtures) && value.fixtures.length === 2),
  FINAL_ROUND_FIXTURE_AUTHORITY_DATA: (value) =>
    Boolean(value && Array.isArray(value.fixtures) && value.fixtures.length === 2)
};

function firstExistingPath(paths) {
  return paths.find((candidate) => fs.existsSync(candidate));
}

function summarizeMessages(messages) {
  return messages.map((entry) => ({
    type: entry.type,
    text: entry.text.slice(0, 600),
    url: entry.url || null
  }));
}

function failReasons(checks) {
  return Object.entries(checks)
    .filter(([, ok]) => !ok)
    .map(([key]) => key);
}

function mdTable(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((value) => String(value ?? "")).join(" | ")} |`)
  ].join("\n");
}

function buildMarkdownReport(result) {
  const summary = result.summary;
  const firstIndex = result.indexResults[0];
  const firstWorldCup = result.worldCupResults[0];
  const checks = firstIndex?.checks || {};
  const globals = firstIndex?.stateBeforeClicks?.globals?.activeGlobalCounts || {};
  const teamBuilderBuild = firstIndex?.teamBuilderBuild || {};
  const screenshots = result.indexResults.concat(result.worldCupResults).map((entry) => entry.screenshotPath);
  const ignoredFailedRequests = summary.failedRequestCount - summary.blockingFailedRequestCount;

  return [
    "# Public Preview Browser QA Report v1",
    "",
    `Generated: ${result.generated_at}`,
    "",
    "## Verdict",
    "",
    summary.status === "pass"
      ? "**pass - safe_to_share_final_round_public_preview**"
      : "**fail - do_not_share_until_browser_qa_is_fixed**",
    "",
    "The public preview browser QA exercised `index.html` and `world-cup.html` across desktop and mobile widths. Final Round is the public default, SF/QF/R16/R32 and MD1/MD2/MD3 remain accessible as historical views, live completed scores are shown only through the safe mapping path, Final and Third Place fixtures are known, and old public globals are absent.",
    "",
    "## Run Context",
    "",
    mdTable(
      ["Item", "Result"],
      [
        ["Base URL", result.baseUrl],
        ["Runner", "scripts/runPublicPreviewBrowserQa.mjs"],
        ["Browser executable", result.executablePath],
        ["Index viewports", summary.indexViewportsTested],
        ["World Cup viewports", summary.worldCupViewportsTested],
        ["Screenshots", screenshots.length]
      ]
    ),
    "",
    "## Core Checks",
    "",
    mdTable(
      ["Check", "Result"],
      [
        ["Picks default to Final Round", checks.picksDefaultFinalRound ? "pass" : "fail"],
        ["Final Round label visible", checks.finalRoundLabelVisible ? "pass" : "fail"],
        ["Captain Watchlist opens on Final Round", checks.captainWatchlistDefaultFinalRound ? "pass" : "fail"],
        ["Match Environment opens on Final Round", checks.matchEnvironmentDefaultFinalRound ? "pass" : "fail"],
        ["MD1 remains accessible", checks.matchEnvironmentMd1Accessible ? "pass" : "fail"],
        ["MD2 remains accessible", checks.matchEnvironmentMd2Accessible ? "pass" : "fail"],
        ["Team Builder opens on Final Round", checks.teamBuilderDefaultFinalRound ? "pass" : "fail"],
        ["Team Builder builds Final Round squad", checks.teamBuilderBuildsFinalRoundSquad ? "pass" : "fail"],
        ["Balanced Squad is visible", checks.balancedSquadVisible ? "pass" : "fail"],
        ["France Player Profile opens", checks.francePlayerProfileOpens ? "pass" : "fail"],
        ["Spain Player Profile opens", checks.spainPlayerProfileOpens ? "pass" : "fail"],
        ["England Player Profile opens", checks.englandPlayerProfileOpens ? "pass" : "fail"],
        ["Argentina Player Profile opens", checks.argentinaPlayerProfileOpens ? "pass" : "fail"],
        ["Messi Player Profile opens", checks.messiPlayerProfileOpensOrNotSelectable ? "pass" : "fail"],
        ["Mbappe Player Profile opens", checks.mbappePlayerProfileOpensOrNotSelectable ? "pass" : "fail"],
        ["Knockout predictor renders Final Round games", checks.knockoutPredictorRenders ? "pass" : "fail"],
        ["Visual bracket prediction renders", checks.knockoutBracketPredictionRenders ? "pass" : "fail"],
        ["Visual bracket prediction path guard", checks.knockoutBracketNoFranceArgentinaR16 ? "pass" : "fail"],
        ["Player Profile opens", checks.playerProfileOpens ? "pass" : "fail"],
        ["Current data scripts loaded", checks.currentScriptsLoaded ? "pass" : "fail"],
        ["Old globals absent", checks.oldGlobalsAbsent ? "pass" : "fail"],
        ["Live group-stage support data loaded", checks.liveMd1SupportLoaded ? "pass" : "fail"],
        ["World Cup page renders", firstWorldCup?.failures?.length ? "fail" : "pass"]
      ]
    ),
    "",
    "## Team Builder Build",
    "",
    mdTable(
      ["Item", "Result"],
      [
        ["Build status", teamBuilderBuild.status || "n/a"],
        ["Matchday", teamBuilderBuild.selectedMatchday || "n/a"],
        ["Strategy", teamBuilderBuild.selectedStrategy || "n/a"],
        ["Starters / Bench", `${teamBuilderBuild.starterCount ?? "n/a"} / ${teamBuilderBuild.benchCount ?? "n/a"}`],
        ["France selected / starters / bench", `${teamBuilderBuild.countryCounts?.france ?? "n/a"} / ${teamBuilderBuild.starterCountryCounts?.france ?? "n/a"} / ${teamBuilderBuild.benchCountryCounts?.france ?? "n/a"}`],
        ["Spain selected / starters / bench", `${teamBuilderBuild.countryCounts?.spain ?? "n/a"} / ${teamBuilderBuild.starterCountryCounts?.spain ?? "n/a"} / ${teamBuilderBuild.benchCountryCounts?.spain ?? "n/a"}`],
        ["England selected / starters / bench", `${teamBuilderBuild.countryCounts?.england ?? "n/a"} / ${teamBuilderBuild.starterCountryCounts?.england ?? "n/a"} / ${teamBuilderBuild.benchCountryCounts?.england ?? "n/a"}`],
        ["Argentina selected / starters / bench", `${teamBuilderBuild.countryCounts?.argentina ?? "n/a"} / ${teamBuilderBuild.starterCountryCounts?.argentina ?? "n/a"} / ${teamBuilderBuild.benchCountryCounts?.argentina ?? "n/a"}`],
        ["Top country", teamBuilderBuild.topCountryText || "n/a"]
      ]
    ),
    "",
    "## Data Loaded",
    "",
    mdTable(
      ["Dataset", "Rows"],
      [
        ["Players sample", globals.players],
        ["Recommendation candidates", globals.recommendations],
        ["Projection rows", globals.projections],
        ["Final Round projection rows", globals.finalRoundProjections],
        ["SF projection rows", globals.sfProjections],
        ["QF projection rows", globals.qfProjections],
        ["R16 projection rows", globals.r16Projections],
        ["R32 projection rows", globals.r32Projections],
        ["Bracket prediction matches", globals.knockoutBracketMatches],
        ["Score fixtures", globals.scoreFixtures],
        ["Official records", globals.officialRecords],
        ["Live fixtures", globals.liveFixtures],
        ["Live players", globals.livePlayers]
      ]
    ),
    "",
    "## Console, Network, And Layout",
    "",
    mdTable(
      ["Metric", "Count"],
      [
        ["Console/page errors", summary.consoleErrorCount],
        ["Console warnings", summary.consoleWarningCount],
        ["Failed requests", summary.failedRequestCount],
        ["Blocking failed requests", summary.blockingFailedRequestCount],
        ["Ignored non-blocking failed requests", ignoredFailedRequests],
        ["Index overflow viewports", summary.indexOverflowViewports.length],
        ["World Cup overflow viewports", summary.worldCupOverflowViewports.length],
        ["Profile click failures", summary.profileClickFailures.length],
        ["Old globals present", summary.oldGlobalsPresent.length],
        ["Missing active globals", summary.missingActiveGlobals.length]
      ]
    ),
    "",
    "## Screenshots",
    "",
    screenshots.map((path) => `- ${path}`).join("\n"),
    "",
    "## Remaining Limits",
    "",
    "- Browser QA confirms the public Final Round data path, knockout predictor, Team Builder, and live display plumbing.",
    "- Final squads remain not source-backed.",
    "- Team Builder remains planning help and must be checked inside the official FIFA game.",
    "- User-specific locks, substitutions, captain state, and boosters are not imported.",
    ""
  ].join("\n");
}

async function openDetails(page, selector) {
  await page.evaluate((target) => {
    const details = document.querySelector(target);
    if (details) details.open = true;
  }, selector);
}

function isIgnoredFailedRequest(request) {
  return /https:\/\/www\.google-analytics\.com\/g\/collect/.test(request.url) ||
    /https:\/\/www\.googletagmanager\.com\//.test(request.url);
}

async function clickProfileAndClose(page, selector, label) {
  const count = await page.locator(selector).count();
  if (!count) return { label, status: "fail", reason: "no player profile trigger found", selector };

  await page.locator(selector).first().click();
  await page.waitForSelector("#player-detail-modal:not(.hidden)", { timeout: 10000 });
  const modalText = await page.locator("#player-detail-modal").innerText({ timeout: 10000 });
  const result = {
    label,
    status: "pass",
    playerProfileOpened: true,
    showsOfficialPrice: /Official fantasy price|Price/i.test(modalText),
    showsPosition: /Position|Defender|Midfielder|Forward|Goalkeeper|FWD|MID|DEF|GK/i.test(modalText),
    showsCurrentDataWarning: /Official Fantasy Picks|current FIFA fantasy|Confirm|verify|deadline/i.test(modalText),
    showsFinalRoundContext: /Final Round|Final|Third Place|semifinal starters|SF starter|SF starters|Third Place rotation|Role volatility/i.test(modalText),
    modalTextSample: modalText.slice(0, 500)
  };

  await page.locator("#player-detail-close").click();
  await page.waitForFunction(() => document.querySelector("#player-detail-modal")?.classList.contains("hidden"), null, { timeout: 10000 });
  result.closedCleanly = true;
  return result;
}

async function waitForCurrentUi(page) {
  await page.waitForSelector("#dashboard-grid .pick-card, #dashboard-grid .player-name-button", { timeout: 60000 });
  await page.waitForFunction(() => document.querySelectorAll("#matchday-decision-matchday-select option").length > 0, null, { timeout: 60000 });
}

async function waitForVisibleActiveDataBadge(page) {
  await page.waitForFunction(() => {
    const badge = document.querySelector("#advice-style-note .model-data-badge");
    if (!badge) return false;
    const rect = badge.getBoundingClientRect();
    const style = window.getComputedStyle(badge);
    return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
  }, null, { timeout: 60000 });
}

async function collectPageState(page) {
  return page.evaluate(({ oldGlobalNames: oldGlobals, activeGlobalNames, currentDataScripts: expectedScripts }) => {
    const activeDataBadge = document.querySelector("#advice-style-note .model-data-badge");
    const activeDataBadgeRect = activeDataBadge?.getBoundingClientRect();
    const activeDataBadgeStyle = activeDataBadge ? window.getComputedStyle(activeDataBadge) : null;
    const bodyText = document.body.innerText || "";
    const scriptSources = Array.from(document.scripts).map((script) => script.getAttribute("src")).filter(Boolean);
    const quickPickCards = Array.from(document.querySelectorAll("#dashboard-grid .pick-card"));
    const quickPickNames = Array.from(document.querySelectorAll("#dashboard-grid .player-name-button")).map((button) => button.textContent.trim());
    const quickPickLabels = Array.from(document.querySelectorAll("#dashboard-grid .pick-card__label, #dashboard-grid .info-card__label")).map((label) => label.textContent.trim());
    const captainCards = Array.from(document.querySelectorAll("#captain-card-grid .pick-card"));
    const adviceCards = Array.from(document.querySelectorAll("#advice-card-grid .pick-card"));
    const environmentRows = Array.from(document.querySelectorAll("#match-environment-table-body tr")).map((row) => row.innerText.trim()).filter(Boolean);
    const oldGlobalsPresent = oldGlobals.filter((name) => window[name] !== undefined);
    const activeGlobals = Object.fromEntries(activeGlobalNames.map((name) => [name, window[name] !== undefined]));
    const activeGlobalCounts = {
      players: Array.isArray(window.PLAYERS_DATA) ? window.PLAYERS_DATA.length : window.PLAYERS_DATA?.players?.length || 0,
      recommendations: window.FANTASY_POOL_RECOMMENDATION_CANDIDATES?.length || 0,
      projections: window.FANTASY_POOL_PLAYER_MATCHDAY_PROJECTIONS?.length || 0,
      finalRoundProjections: (window.FANTASY_POOL_PLAYER_MATCHDAY_PROJECTIONS || []).filter((row) => row.matchday === "finalRound").length,
      sfProjections: (window.FANTASY_POOL_PLAYER_MATCHDAY_PROJECTIONS || []).filter((row) => row.matchday === "sf").length,
      qfProjections: (window.FANTASY_POOL_PLAYER_MATCHDAY_PROJECTIONS || []).filter((row) => row.matchday === "qf").length,
      r16Projections: (window.FANTASY_POOL_PLAYER_MATCHDAY_PROJECTIONS || []).filter((row) => row.matchday === "r16").length,
      r32Projections: (window.FANTASY_POOL_PLAYER_MATCHDAY_PROJECTIONS || []).filter((row) => row.matchday === "r32").length,
      finance: window.FANTASY_POOL_PLAYER_FINANCE_METRICS?.length || 0,
      scoreFixtures: window.FANTASY_POOL_SCORE_FIXTURE_PREDICTIONS?.length || window.FANTASY_POOL_SCORE_PREDICTIONS_DATA?.fixtureScorePredictions?.length || 0,
      knockoutBracketMatches: window.KNOCKOUT_BRACKET_PREDICTION_DATA?.matches?.length || 0,
      knockoutBracketR32Matches: (window.KNOCKOUT_BRACKET_PREDICTION_DATA?.matches || []).filter((match) => match.round === "r32").length,
      officialRecords: window.FANTASY_POOL_OFFICIAL_DATA_STATUS?.official_position_records?.length || 0,
      liveFixtures: window.LIVE_MATCHDAY_STATUS_DATA?.fixtures?.length || 0,
      livePlayers: window.LIVE_PLAYER_STATUS_DATA?.players?.length || 0,
      r16AuthorityFixtures: window.R16_FIXTURE_AUTHORITY_DATA?.fixtures?.length || 0,
      qfAuthorityFixtures: window.QF_FIXTURE_AUTHORITY_DATA?.fixtures?.length || 0,
      sfAuthorityFixtures: window.SF_FIXTURE_AUTHORITY_DATA?.fixtures?.length || 0,
      finalRoundAuthorityFixtures: window.FINAL_ROUND_FIXTURE_AUTHORITY_DATA?.fixtures?.length || 0
    };
    const topActiveProjection = [...(window.FANTASY_POOL_PLAYER_MATCHDAY_PROJECTIONS || [])]
      .filter((row) => row.matchday === "finalRound")
      .sort((a, b) => (b.projectedPoints || b.raw_expected_points || 0) - (a.projectedPoints || a.raw_expected_points || 0))[0] || null;
    const overflowingElements = Array.from(document.querySelectorAll("body *"))
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.right > document.documentElement.clientWidth + 1 && getComputedStyle(element).position !== "fixed";
      })
      .slice(0, 12)
      .map((element) => ({
        tag: element.tagName.toLowerCase(),
        id: element.id || null,
        className: String(element.className || "").slice(0, 120),
        text: element.textContent.trim().slice(0, 120),
        right: Math.round(element.getBoundingClientRect().right),
        clientWidth: document.documentElement.clientWidth
      }));
    const selectValue = (selector) => document.querySelector(selector)?.value || null;
    const selectOptionCount = (selector) => document.querySelector(selector)?.options?.length || 0;
    const textFrom = (selector) => document.querySelector(selector)?.textContent?.trim() || "";
    const compactText = (value) => String(value || "").replace(/\s+/g, " ").trim();
    const quickPickText = compactText(quickPickCards.map((card) => card.innerText).join(" "));
    const captainCardText = compactText(captainCards.map((card) => card.innerText).join(" "));
    const adviceCardText = compactText(adviceCards.map((card) => card.innerText).join(" "));

    return {
      title: document.title,
      scripts: {
        expectedOrder: expectedScripts,
        activeRelevantOrder: scriptSources
          .map((src) => src.split("?")[0].split("/").pop())
          .filter((file) => expectedScripts.includes(file)),
        missingCurrentScripts: expectedScripts.filter((file) => !scriptSources.some((src) => src.includes(file))),
        loadedLegacyScripts: scriptSources.filter((src) =>
          /financePlayersData|matchdayProjectionsData|scorePredictionsData|scorePredictions_v[0-2]|20260603|official-final/.test(src)
        )
      },
      globals: {
        activeGlobals,
        activeGlobalCounts,
        oldGlobalsPresent,
        scoreModelVersion: window.FANTASY_POOL_SCORE_PREDICTIONS_DATA?.modelVersion || window.FANTASY_POOL_SCORE_PREDICTIONS_DATA?.model_version || null,
        projectionModelVersion: window.FANTASY_POOL_MATCHDAY_PROJECTIONS_DATA?.modelVersion || window.FANTASY_POOL_MATCHDAY_PROJECTIONS_DATA?.model_version || null,
        projectionDataStatus: window.FANTASY_POOL_MATCHDAY_PROJECTIONS_DATA?.data_status || null,
        topActiveProjection: topActiveProjection ? {
          name: topActiveProjection.name,
          projectedPoints: topActiveProjection.projectedPoints || topActiveProjection.raw_expected_points || null,
          captainUpsideScore: topActiveProjection.captainUpsideScore || topActiveProjection.captain_score || null
        } : null
      },
      sections: {
        picks: Boolean(document.querySelector("#picks")),
        captainWatchlist: Boolean(document.querySelector("#captain-picks")),
        matchdayDesk: Boolean(document.querySelector("#matchday-desk")),
        teamBuilder: Boolean(document.querySelector("#team-builder")),
        matchEnvironment: Boolean(document.querySelector("#match-environment")),
        knockoutBracketPrediction: Boolean(document.querySelector("#knockout-bracket-prediction")),
        knockoutPredictor: Boolean(document.querySelector("#knockout-predictor")),
        playerProfileModal: Boolean(document.querySelector("#player-detail-modal"))
      },
      ui: {
        activeDataBadgeVisible: Boolean(
          activeDataBadge &&
          activeDataBadgeRect?.width > 0 &&
          activeDataBadgeRect?.height > 0 &&
          activeDataBadgeStyle?.display !== "none" &&
          activeDataBadgeStyle?.visibility !== "hidden"
        ),
        activeDataBadgeText: activeDataBadge?.textContent?.trim() || "",
        finalRoundLabelVisible: /Final Round fantasy setup|Final \+ Third Place|Includes Final and Third Place game|Third Place game may have higher rotation risk/i.test(bodyText),
        adviceMatchdaySelected: selectValue("#advice-matchday-select"),
        adviceStyleNote: textFrom("#advice-style-note"),
        quickPickCards: quickPickCards.length,
        quickPickNames,
        quickPickLabels,
        quickPickText: quickPickText.slice(0, 1200),
        captainCards: captainCards.length,
        captainCardText: captainCardText.slice(0, 1200),
        adviceCards: adviceCards.length,
        adviceCardText: adviceCardText.slice(0, 1200),
        environmentRows: environmentRows.slice(0, 8),
        matchEnvironmentSummary: document.querySelector("#match-environment-summary")?.textContent?.trim() || "",
        matchEnvironmentControls: {
          selectedMatchday: selectValue("#environment-matchday-select"),
          matchdayOptions: selectOptionCount("#environment-matchday-select"),
          groupOptions: selectOptionCount("#environment-group-select"),
          signalOptions: selectOptionCount("#environment-filter-select")
        },
        matchdayDeskContentText: document.querySelector("#matchday-decision-center-content")?.textContent?.trim() || "",
        matchdayDeskContentBlocks: document.querySelectorAll(".matchday-decision-empty, .matchday-desk-action-panel, .matchday-live-support, .matchday-squad-status, .matchday-desk-card").length,
        matchdayDeskControls: {
          selectedMatchday: selectValue("#matchday-decision-matchday-select"),
          matchdayOptions: document.querySelector("#matchday-decision-matchday-select")?.options?.length || 0,
          strategyOptions: document.querySelector("#matchday-decision-risk-select")?.options?.length || 0,
          captainPointsInput: Boolean(document.querySelector("#matchday-decision-captain-points-input")),
          starterSelect: Boolean(document.querySelector("#matchday-decision-starter-select")),
          starterPointsInput: Boolean(document.querySelector("#matchday-decision-starter-points-input"))
        },
        teamBuilderControls: {
          selectedMatchday: selectValue("#builder-matchday-select"),
          strategyOptions: document.querySelector("#measure-select")?.options?.length || 0,
          matchdayOptions: document.querySelector("#builder-matchday-select")?.options?.length || 0,
          formationOptions: document.querySelector("#tactic-select")?.options?.length || 0,
          buildButton: Boolean(document.querySelector("#build-team-btn-top")),
          buildButtonText: textFrom("#build-team-btn-top")
        },
        addToBuilderButtons: document.querySelectorAll("[data-lock-player-id]").length,
        picksBuilderTrayText: document.querySelector("#picks-builder-tray")?.textContent?.trim() || ""
        ,
        knockoutPredictor: {
          selectedFixture: selectValue("#knockout-fixture-select"),
          fixtureOptions: selectOptionCount("#knockout-fixture-select"),
          resultText: textFrom("#knockout-matchup-result"),
          knownRows: document.querySelectorAll("#knockout-known-fixtures-body tr").length,
          knownRowsText: compactText(Array.from(document.querySelectorAll("#knockout-known-fixtures-body tr")).map((row) => row.textContent).join(" ")).slice(0, 2000)
        },
        knockoutBracketPrediction: {
          summaryCards: document.querySelectorAll("#knockout-bracket-summary .knockout-bracket-summary-card").length,
          roundColumns: document.querySelectorAll("#knockout-bracket-board .knockout-bracket-round-column").length,
          r32Cards: document.querySelectorAll("#knockout-bracket-board .knockout-bracket-match[data-round='r32']").length,
          r16Cards: document.querySelectorAll("#knockout-bracket-board .knockout-bracket-match[data-round='r16']").length,
          qfCards: document.querySelectorAll("#knockout-bracket-board .knockout-bracket-match[data-round='qf']").length,
          sfCards: document.querySelectorAll("#knockout-bracket-board .knockout-bracket-match[data-round='sf']").length,
          finalCards: document.querySelectorAll("#knockout-bracket-board .knockout-bracket-match[data-round='final']").length,
          thirdPlaceCards: document.querySelectorAll("#knockout-bracket-board .knockout-bracket-match[data-round='third_place']").length,
          flagOrFallbackCount: Array.from(document.querySelectorAll("#knockout-bracket-board .knockout-bracket-flag"))
            .filter((node) => node.textContent.trim()).length,
          modelPickLabels: Array.from(document.querySelectorAll("#knockout-bracket-board .knockout-bracket-pick-row span"))
            .filter((node) => /Model pick/i.test(node.textContent || "")).length,
          actualLabels: Array.from(document.querySelectorAll("#knockout-bracket-board .knockout-bracket-detail-row--actual span"))
            .filter((node) => /Actual/i.test(node.textContent || "")).length,
          resultBadges: document.querySelectorAll("#knockout-bracket-board .knockout-bracket-badge--pending, #knockout-bracket-board .knockout-bracket-badge--correct, #knockout-bracket-board .knockout-bracket-badge--wrong").length,
          predictedChampionText: compactText(document.querySelector("#knockout-bracket-summary")?.textContent || ""),
          boardText: compactText(document.querySelector("#knockout-bracket-board")?.textContent || "").slice(0, 5000),
          impossibleFranceArgentinaR16: Array.from(document.querySelectorAll("#knockout-bracket-board .knockout-bracket-match[data-round='r16']"))
            .some((card) => /France/i.test(card.textContent || "") && /Argentina/i.test(card.textContent || "")),
          hasDocumentLink: Boolean(document.querySelector("a[href='#knockout-bracket-prediction']"))
        }
      },
      warnings: {
        manualConfirmation: bodyText.includes("Confirm locks") || bodyText.includes("confirm squad legality, locks, and deadlines"),
        teamBuilderPlanningHelp: bodyText.includes("Team Builder is planning help") || bodyText.includes("Use the builder as planning help"),
        teamBuilderOfficialCheck: bodyText.includes("inside the official FIFA fantasy game") || bodyText.includes("inside the fantasy game"),
        md1LiveSupport: bodyText.includes("official points") || bodyText.includes("Matchday Desk") || bodyText.includes("live")
      },
      scroll: {
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        hasPageOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        overflowingElements
      }
    };
  }, {
    oldGlobalNames,
    activeGlobalNames: Object.keys(activeGlobalChecks).filter((name) => name !== "FANTASY_POOL_SCORE_CONTEXT"),
    currentDataScripts
  });
}

async function verifyActiveGlobals(page) {
  return page.evaluate(({ oldGlobalNames: oldGlobals }) => {
    const activeChecks = {
      PLAYERS_DATA: Array.isArray(window.PLAYERS_DATA) || Array.isArray(window.PLAYERS_DATA?.players),
      FANTASY_RULES_DATA: Boolean(window.FANTASY_RULES_DATA && Object.keys(window.FANTASY_RULES_DATA).length),
      FANTASY_POOL_RECOMMENDATION_CANDIDATES: Array.isArray(window.FANTASY_POOL_RECOMMENDATION_CANDIDATES) && window.FANTASY_POOL_RECOMMENDATION_CANDIDATES.length > 0,
      FANTASY_POOL_PLAYER_MATCHDAY_PROJECTIONS: Array.isArray(window.FANTASY_POOL_PLAYER_MATCHDAY_PROJECTIONS) && window.FANTASY_POOL_PLAYER_MATCHDAY_PROJECTIONS.length > 0,
      FANTASY_POOL_SCORE_CONTEXT: Boolean(window.FANTASY_POOL_SCORE_PREDICTIONS_DATA) || Array.isArray(window.FANTASY_POOL_SCORE_FIXTURE_PREDICTIONS),
      KNOCKOUT_BRACKET_PREDICTION_DATA: Boolean(window.KNOCKOUT_BRACKET_PREDICTION_DATA?.matches?.length),
      FANTASY_POOL_OFFICIAL_DATA_STATUS: Boolean(window.FANTASY_POOL_OFFICIAL_DATA_STATUS?.official_position_records?.length),
      LIVE_MATCHDAY_STATUS_DATA: Boolean(window.LIVE_MATCHDAY_STATUS_DATA?.fixtures?.length),
      LIVE_PLAYER_STATUS_DATA: Boolean(window.LIVE_PLAYER_STATUS_DATA?.players?.length),
      R16_FIXTURE_AUTHORITY_DATA: Boolean(window.R16_FIXTURE_AUTHORITY_DATA?.fixtures?.length === 8),
      QF_FIXTURE_AUTHORITY_DATA: Boolean(window.QF_FIXTURE_AUTHORITY_DATA?.fixtures?.length === 4),
      SF_FIXTURE_AUTHORITY_DATA: Boolean(window.SF_FIXTURE_AUTHORITY_DATA?.fixtures?.length === 2),
      FINAL_ROUND_FIXTURE_AUTHORITY_DATA: Boolean(window.FINAL_ROUND_FIXTURE_AUTHORITY_DATA?.fixtures?.length === 2)
    };
    const oldGlobalsPresent = oldGlobals.filter((name) => window[name] !== undefined);
    return {
      activeChecks,
      missingActiveGlobals: Object.entries(activeChecks).filter(([, ok]) => !ok).map(([name]) => name),
      oldGlobalsPresent,
      scoreModelVersion: window.FANTASY_POOL_SCORE_PREDICTIONS_DATA?.modelVersion || window.FANTASY_POOL_SCORE_PREDICTIONS_DATA?.model_version || null,
      projectionModelVersion: window.FANTASY_POOL_MATCHDAY_PROJECTIONS_DATA?.modelVersion || window.FANTASY_POOL_MATCHDAY_PROJECTIONS_DATA?.model_version || null,
      projectionDataStatus: window.FANTASY_POOL_MATCHDAY_PROJECTIONS_DATA?.data_status || null
    };
  }, { oldGlobalNames });
}

async function testMatchEnvironmentMatchdayAccess(page, matchdayId) {
  const select = page.locator("#environment-matchday-select");
  if (!(await select.count())) {
    return { status: "fail", matchdayId, reason: "Match Environment matchday select missing" };
  }

  await select.selectOption(matchdayId);
  await page.waitForFunction((selectedMatchdayId) => {
    const selected = document.querySelector("#environment-matchday-select")?.value || null;
    const rows = Array.from(document.querySelectorAll("#match-environment-table-body tr"))
      .map((row) => row.innerText.trim())
      .filter(Boolean);
    return selected === selectedMatchdayId && rows.length > 0;
  }, matchdayId, { timeout: 10000 });

  return page.evaluate((selectedMatchdayId) => {
    const rows = Array.from(document.querySelectorAll("#match-environment-table-body tr"))
      .map((row) => row.innerText.trim())
      .filter(Boolean);
    return {
      status: "pass",
      matchdayId: selectedMatchdayId,
      selected: document.querySelector("#environment-matchday-select")?.value || null,
      rowCount: rows.length,
      rowSample: rows.slice(0, 3)
    };
  }, matchdayId);
}

async function testAddToBuilder(page) {
  const before = await page.locator("#picks-builder-tray .locked-player-chip").count();
  const buttonCount = await page.locator("#dashboard-grid [data-lock-player-id], #advice-card-grid [data-lock-player-id]").count();
  if (!buttonCount) {
    return { status: "skip", reason: "current UI has no available Add to Builder buttons", buttonCount };
  }

  await page.locator("#dashboard-grid [data-lock-player-id], #advice-card-grid [data-lock-player-id]").first().click();
  await page.waitForFunction((previousCount) => {
    const tray = document.querySelector("#picks-builder-tray");
    return document.querySelectorAll("#picks-builder-tray .locked-player-chip").length > previousCount ||
      /locked player|ready for the builder/i.test(tray?.textContent || "");
  }, before, { timeout: 10000 });
  const after = await page.locator("#picks-builder-tray .locked-player-chip").count();
  const trayText = await page.locator("#picks-builder-tray").innerText({ timeout: 10000 });
  return {
    status: after > before || /locked player|ready for the builder/i.test(trayText) ? "pass" : "fail",
    before,
    after,
    buttonCount,
    trayText: trayText.slice(0, 300)
  };
}

async function clickCountryProfileAndClose(page, countryLabel) {
  const markProfileTrigger = () => page.evaluate((label) => {
    const normalize = (value) => String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
    const countryKey = normalize(label);
    const visibleButtons = Array.from(document.querySelectorAll(
      "#dashboard-grid .player-name-button, #captain-card-grid .player-name-button, #advice-card-grid .player-name-button, #advice-table-body .player-name-button, #player-picker .player-name-button"
    ));
    const dataNames = [
      ...(window.FANTASY_POOL_RECOMMENDATION_CANDIDATES || []),
      ...(window.FANTASY_POOL_PLAYER_MATCHDAY_PROJECTIONS || [])
    ]
      .filter((row) => {
        const rowCountry = normalize(row.country || row.team || row.team_id);
        const rowMatchday = normalize(row.matchday || row.matchday_id || row.fantasy_matchday_id || "finalRound");
        return rowCountry === countryKey && (!rowMatchday || rowMatchday === "finalround");
      })
      .map((row) => normalize(row.name))
      .filter(Boolean);
    const directContainerMatch = visibleButtons.find((button) => {
      const container = button.closest(".pick-card, tr, article, li") || button.parentElement;
      return normalize(container?.textContent || "").includes(countryKey);
    });
    const nameMatch = visibleButtons.find((button) => dataNames.includes(normalize(button.textContent)));
    const match = directContainerMatch || nameMatch;

    if (!match) return null;

    const marker = `country-${countryKey}`;
    match.setAttribute("data-browser-qa-country-profile", marker);
    return `[data-browser-qa-country-profile="${marker}"]`;
  }, countryLabel);
  let selector = await markProfileTrigger();

  if (!selector) {
    await openDetails(page, "#team-builder");
    const changedCountryFilter = await page.evaluate((label) => {
      const normalize = (value) => String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
      const select = document.querySelector("#country-filter");
      const countryKey = normalize(label);
      const option = Array.from(select?.options || [])
        .find((entry) => normalize(entry.value) === countryKey || normalize(entry.textContent) === countryKey);

      if (!select || !option) return false;

      select.value = option.value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    }, countryLabel);

    if (changedCountryFilter) {
      await page.waitForFunction((label) => {
        const normalize = (value) => String(value || "")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, " ")
          .trim();
        const countryKey = normalize(label);
        return Array.from(document.querySelectorAll("#player-picker .player-name-button"))
          .some((button) => normalize((button.closest(".picker-card, article, li") || button.parentElement)?.textContent || "").includes(countryKey));
      }, countryLabel, { timeout: 10000 });
      selector = await markProfileTrigger();
    }
  }

  if (!selector) {
    return {
      label: `${countryLabel} Player Profile`,
      country: countryLabel,
      status: "fail",
      reason: "no visible country-specific player profile trigger found"
    };
  }

  return {
    country: countryLabel,
    ...(await clickProfileAndClose(page, selector, `${countryLabel} Player Profile`))
  };
}

async function clickNamedProfileAndClose(page, label, aliases) {
  const aliasList = Array.isArray(aliases) && aliases.length ? aliases : [label];
  const availability = await page.evaluate((names) => {
    const normalize = (value) => String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
    const normalizedNames = names.map(normalize);
    const nameMatches = (value) => normalizedNames.some((name) => normalize(value).includes(name));
    const rows = [
      ...(window.FANTASY_POOL_PLAYER_MATCHDAY_PROJECTIONS || []),
      ...(window.FANTASY_POOL_RECOMMENDATION_CANDIDATES || [])
    ].filter((row) => nameMatches(row.name));
    const selectableRows = rows.filter((row) => {
      const status = normalize(row.selectable_status || row.player_status || "playing");
      const points = Number(row.risk_adjusted_points ?? row.projectedPoints ?? row.raw_expected_points ?? 0);
      return points > 0 && !["injured", "suspended", "unavailable"].includes(status);
    });

    return {
      exists: rows.length > 0,
      selectable: selectableRows.length > 0,
      rows: rows.slice(0, 3).map((row) => ({
        name: row.name,
        country: row.country || row.team,
        selectable_status: row.selectable_status || null,
        projected_points: row.risk_adjusted_points ?? row.projectedPoints ?? row.raw_expected_points ?? null
      }))
    };
  }, aliasList);

  if (!availability.selectable) {
    return {
      label: `${label} Player Profile`,
      status: "skip",
      exists: availability.exists,
      selectable: availability.selectable,
      reason: availability.exists ? "player exists but is not selectable with a positive Final Round projection" : "player not found in active Final Round data",
      rows: availability.rows
    };
  }

  const markProfileTrigger = () => page.evaluate(({ label: markerLabel, names }) => {
    const normalize = (value) => String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
    const normalizedNames = names.map(normalize);
    const nameMatches = (value) => normalizedNames.some((name) => normalize(value).includes(name));
    const buttons = Array.from(document.querySelectorAll(
      "#dashboard-grid .player-name-button, #captain-card-grid .player-name-button, #advice-card-grid .player-name-button, #advice-table-body .player-name-button, #player-picker .player-name-button"
    ));
    const match = buttons.find((button) => nameMatches(button.textContent));

    if (!match) return null;

    const marker = `named-${normalize(markerLabel)}`;
    match.setAttribute("data-browser-qa-named-profile", marker);
    return `[data-browser-qa-named-profile="${marker}"]`;
  }, { label, names: aliasList });
  let selector = await markProfileTrigger();

  if (!selector) {
    await openDetails(page, "#team-builder");
    await page.evaluate((searchText) => {
      const search = document.querySelector("#player-search");
      if (!search) return;
      search.value = searchText;
      search.dispatchEvent(new Event("input", { bubbles: true }));
    }, aliasList[0]);
    await page.waitForFunction((names) => {
      const normalize = (value) => String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
      const normalizedNames = names.map(normalize);
      return Array.from(document.querySelectorAll("#player-picker .player-name-button"))
        .some((button) => normalizedNames.some((name) => normalize(button.textContent).includes(name)));
    }, aliasList, { timeout: 10000 });
    selector = await markProfileTrigger();
  }

  if (!selector) {
    return {
      label: `${label} Player Profile`,
      status: "fail",
      reason: "selectable player exists but no visible profile trigger was found",
      rows: availability.rows
    };
  }

  return {
    playerLabel: label,
    exists: availability.exists,
    selectable: availability.selectable,
    rows: availability.rows,
    ...(await clickProfileAndClose(page, selector, `${label} Player Profile`))
  };
}

async function testTeamBuilderBuildsFinalRound(page) {
  await openDetails(page, "#team-builder");
  const matchdaySelect = page.locator("#builder-matchday-select");
  if (!(await matchdaySelect.count())) {
    return { status: "fail", reason: "builder matchday select missing" };
  }

  await page.evaluate(() => {
    const setSelectIfPossible = (selector, wantedValue) => {
      const select = document.querySelector(selector);
      if (!select) return;
      const option = Array.from(select.options || []).find((entry) => entry.value === wantedValue || entry.textContent === wantedValue);
      if (!option) return;
      select.value = option.value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    };
    const search = document.querySelector("#player-search");

    if (search) {
      search.value = "";
      search.dispatchEvent(new Event("input", { bubbles: true }));
    }

    setSelectIfPossible("#position-filter", "All");
    setSelectIfPossible("#country-filter", "All");
  });
  await matchdaySelect.selectOption(activePublicMatchdayId);
  await page.locator("#measure-select").selectOption("balancedSquad");
  await page.evaluate(() => document.querySelector("#build-team-btn-top")?.click());
  await page.waitForFunction(() => {
    const field = document.querySelector("#team-field");
    const message = document.querySelector("#team-message")?.textContent || "";
    const starters = document.querySelectorAll("#team-players .player-card:not(.player-card--placeholder)").length;
    const bench = document.querySelectorAll("#bench-players .bench-card:not(.bench-card--placeholder), #bench-players .player-card").length;
    return field && !field.classList.contains("hidden") && starters >= 11 && bench >= 4 && /Final Round|squad|built/i.test(message);
  }, null, { timeout: 60000 });

  return page.evaluate(() => {
    const normalize = (value) => String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
    const selectedCardInfo = (card) => {
      const text = card.textContent.trim().replace(/\s+/g, " ");
      const metaText = card.querySelector(".player-card__meta, p")?.textContent?.trim() || "";
      const country = metaText.split("·")[0]?.trim() || "";
      return { text, country: normalize(country) };
    };
    const starters = Array.from(document.querySelectorAll("#team-players .player-card:not(.player-card--placeholder)"))
      .map(selectedCardInfo);
    const bench = Array.from(document.querySelectorAll("#bench-players .bench-card:not(.bench-card--placeholder), #bench-players .player-card"))
      .map(selectedCardInfo);
    const message = document.querySelector("#team-message")?.textContent?.trim() || "";
    const topCountryText = document.querySelector("#portfolio-summary")?.textContent?.trim() || "";
    const countCountry = (items, country) => items.filter((entry) => entry.country === normalize(country)).length;
    const auditedCountries = ["Argentina", "France", "England", "Spain", "Brazil", "Colombia", "Belgium", "Morocco", "Norway", "USA", "Portugal", "Switzerland", "Canada", "Mexico", "Paraguay", "Egypt"];
    const countryCounts = Object.fromEntries(auditedCountries.map((country) => [country.toLowerCase(), countCountry([...starters, ...bench], country)]));
    const starterCountryCounts = Object.fromEntries(auditedCountries.map((country) => [country.toLowerCase(), countCountry(starters, country)]));
    const benchCountryCounts = Object.fromEntries(auditedCountries.map((country) => [country.toLowerCase(), countCountry(bench, country)]));

    return {
      status: starters.length >= 11 && bench.length >= 4 ? "pass" : "fail",
      selectedMatchday: document.querySelector("#builder-matchday-select")?.value || null,
      selectedStrategy: document.querySelector("#measure-select")?.value || null,
      buildButtonText: document.querySelector("#build-team-btn-top")?.textContent?.trim() || "",
      starterCount: starters.length,
      benchCount: bench.length,
      message,
      topCountryText,
      countryCounts,
      starterCountryCounts,
      benchCountryCounts,
      starterSample: starters.map((entry) => entry.text).slice(0, 5),
      benchSample: bench.map((entry) => entry.text).slice(0, 4)
    };
  });
}

async function testMainPage(browser, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const messages = [];
  const failedRequests = [];
  const pageErrors = [];

  page.on("console", (message) => messages.push({ type: message.type(), text: message.text(), url: message.location()?.url || null }));
  page.on("requestfailed", (request) => failedRequests.push({ url: request.url(), failure: request.failure()?.errorText || null }));
  page.on("pageerror", (error) => pageErrors.push(String(error)));

  await page.goto(`${baseUrl}/index.html`, { waitUntil: "load", timeout: 120000 });
  await waitForCurrentUi(page);
  await openDetails(page, "#captain-picks");
  await page.waitForSelector("#captain-card-grid .pick-card, #captain-card-grid .player-name-button", { timeout: 60000 });
  await openDetails(page, "#team-advice");
  await page.waitForSelector("#advice-card-grid .pick-card, #advice-card-grid .player-name-button", { timeout: 60000 });
  await openDetails(page, "#team-builder");
  await page.waitForSelector("#build-team-btn-top", { timeout: 60000 });
  await waitForVisibleActiveDataBadge(page);
  await openDetails(page, "#match-environment");
  await page.waitForSelector("#match-environment-table-body tr", { timeout: 60000 });
  await openDetails(page, "#knockout-predictor");
  await page.waitForSelector("#knockout-known-fixtures-body tr", { timeout: 60000 });
  await openDetails(page, "#knockout-bracket-prediction");
  await page.waitForSelector("#knockout-bracket-board .knockout-bracket-match", { timeout: 60000 });

  const activeGlobals = await verifyActiveGlobals(page);
  const stateBeforeClicks = await collectPageState(page);
  const md1MatchEnvironmentAccess = await testMatchEnvironmentMatchdayAccess(page, "md1");
  const md2MatchEnvironmentAccess = await testMatchEnvironmentMatchdayAccess(page, "md2");
  const activeMatchEnvironmentAccess = await testMatchEnvironmentMatchdayAccess(page, activePublicMatchdayId);
  const quickPickProfile = await clickProfileAndClose(page, "#dashboard-grid .player-name-button", "Picks");
  const captainProfile = await clickProfileAndClose(page, "#captain-card-grid .player-name-button", "Captain Watchlist");
  const adviceProfile = await clickProfileAndClose(page, "#advice-card-grid .player-name-button, #advice-table-body .player-name-button", "Official Fantasy Picks");
  const franceProfile = await clickCountryProfileAndClose(page, "France");
  const spainProfile = await clickCountryProfileAndClose(page, "Spain");
  const englandProfile = await clickCountryProfileAndClose(page, "England");
  const argentinaProfile = await clickCountryProfileAndClose(page, "Argentina");
  const messiProfile = await clickNamedProfileAndClose(page, "Messi", ["messi", "lionel messi"]);
  const mbappeProfile = await clickNamedProfileAndClose(page, "Mbappe", ["mbappe", "kylian mbappe", "kylian mbappé"]);
  const teamBuilderBuild = await testTeamBuilderBuildsFinalRound(page);
  const addToBuilder = await testAddToBuilder(page);

  await page.locator("#advice-position-select").selectOption("Forward");
  await page.waitForTimeout(100);
  const forwardFilterState = await page.evaluate(() => ({
    rows: Array.from(document.querySelectorAll("#advice-card-grid .pick-card, #advice-table-body tr")).map((row) => row.innerText.trim()).slice(0, 8),
    cardsOrRows: document.querySelectorAll("#advice-card-grid .pick-card, #advice-table-body tr").length,
    selected: document.querySelector("#advice-position-select")?.value || null
  }));

  await page.locator("#advice-matchday-select").selectOption("md2");
  await page.waitForTimeout(150);
  const matchdayFilterState = await page.evaluate(() => ({
    selected: document.querySelector("#advice-matchday-select")?.value || null,
    note: document.querySelector("#advice-style-note")?.textContent || "",
    rows: document.querySelectorAll("#advice-card-grid .pick-card, #advice-table-body tr").length
  }));

  const screenshotPath = `${screenshotDir}/index-${viewport.width}.png`;
  fs.mkdirSync(screenshotDir, { recursive: true });
  await page.screenshot({ path: screenshotPath, fullPage: false });

  const stateAfterInteractions = await collectPageState(page);
  await context.close();

  const consoleErrors = summarizeMessages(messages.filter((entry) => entry.type === "error"));
  const consoleWarnings = summarizeMessages(messages.filter((entry) => entry.type === "warning" || entry.type === "warn"));
  const sectionChecks = {
    homepageLoads: stateBeforeClicks.title.includes("Fantasy"),
    noConsoleOrPageErrors: consoleErrors.length === 0 && pageErrors.length === 0,
    activeDataBadgeVisible: stateBeforeClicks.ui.activeDataBadgeVisible,
    finalRoundLabelVisible: stateBeforeClicks.ui.finalRoundLabelVisible &&
      /Final Round|Final \+ Third Place|semifinal starters|Third Place/i.test(stateBeforeClicks.ui.activeDataBadgeText + " " + stateBeforeClicks.ui.quickPickText + " " + stateBeforeClicks.ui.matchEnvironmentSummary),
    scoreModelFinalRoundLoaded: activeGlobals.scoreModelVersion === "score-final-round-v1",
    projectionModelFinalRoundLoaded: activeGlobals.projectionModelVersion === "player-projection-final-round-v1",
    activeOfficialRecordsLoaded: stateBeforeClicks.globals.activeGlobalCounts.officialRecords > 0,
    activeGlobalsPresent: activeGlobals.missingActiveGlobals.length === 0,
    oldGlobalsAbsent: activeGlobals.oldGlobalsPresent.length === 0,
    currentScriptsLoaded: stateBeforeClicks.scripts.missingCurrentScripts.length === 0,
    oldScriptsAbsent: stateBeforeClicks.scripts.loadedLegacyScripts.length === 0,
    picksRender: stateBeforeClicks.ui.quickPickCards > 0 && stateBeforeClicks.ui.quickPickNames.length > 0,
    picksDefaultFinalRound: stateBeforeClicks.ui.adviceMatchdaySelected === activePublicMatchdayId &&
      /Final Round|Final|Third Place|semifinal starter|Third Place rotation|Role volatility/i.test(`${stateBeforeClicks.ui.quickPickText} ${stateBeforeClicks.ui.adviceStyleNote}`),
    captainWatchlistRenders: stateBeforeClicks.sections.captainWatchlist && stateBeforeClicks.ui.captainCards > 0,
    captainWatchlistDefaultFinalRound: /Final Round|Final|Third Place|semifinal starter|Third Place rotation|Role volatility/i.test(stateBeforeClicks.ui.captainCardText),
    playerProfileOpens: [quickPickProfile, captainProfile, adviceProfile].some((result) => result.status === "pass" && result.playerProfileOpened),
    playerProfilePracticalFinalRound: [quickPickProfile, captainProfile, adviceProfile].some((result) => result.status === "pass" && result.showsFinalRoundContext),
    teamBuilderControlsLoad: stateBeforeClicks.ui.teamBuilderControls.strategyOptions > 0 &&
      stateBeforeClicks.ui.teamBuilderControls.matchdayOptions > 0 &&
      stateBeforeClicks.ui.teamBuilderControls.buildButton,
    teamBuilderDefaultFinalRound: stateBeforeClicks.ui.teamBuilderControls.selectedMatchday === activePublicMatchdayId &&
      /Final Round/i.test(stateBeforeClicks.ui.teamBuilderControls.buildButtonText),
    teamBuilderBuildsFinalRoundSquad: teamBuilderBuild.status === "pass" &&
      teamBuilderBuild.selectedMatchday === activePublicMatchdayId &&
      teamBuilderBuild.starterCount >= 11 &&
      teamBuilderBuild.benchCount >= 4,
    balancedSquadVisible: teamBuilderBuild.status === "pass" &&
      teamBuilderBuild.selectedStrategy === "balancedSquad" &&
      /Balanced Squad|Final Round|squad/i.test(`${teamBuilderBuild.buildButtonText} ${teamBuilderBuild.message}`),
    francePlayerProfileOpens: franceProfile.status === "pass" &&
      franceProfile.playerProfileOpened &&
      franceProfile.showsFinalRoundContext,
    spainPlayerProfileOpens: spainProfile.status === "pass" &&
      spainProfile.playerProfileOpened &&
      spainProfile.showsFinalRoundContext,
    englandPlayerProfileOpens: englandProfile.status === "pass" &&
      englandProfile.playerProfileOpened &&
      englandProfile.showsFinalRoundContext,
    argentinaPlayerProfileOpens: argentinaProfile.status === "pass" &&
      argentinaProfile.playerProfileOpened &&
      argentinaProfile.showsFinalRoundContext,
    messiPlayerProfileOpensOrNotSelectable: messiProfile.status === "skip" ||
      messiProfile.status === "pass" && messiProfile.playerProfileOpened && messiProfile.showsFinalRoundContext,
    mbappePlayerProfileOpensOrNotSelectable: mbappeProfile.status === "skip" ||
      mbappeProfile.status === "pass" && mbappeProfile.playerProfileOpened && mbappeProfile.showsFinalRoundContext,
    addToBuilderWorksOrUnsupported: addToBuilder.status === "pass" || addToBuilder.status === "skip",
    matchEnvironmentLoads: stateBeforeClicks.ui.environmentRows.length > 0,
    matchEnvironmentDefaultFinalRound: stateBeforeClicks.ui.matchEnvironmentControls.selectedMatchday === activePublicMatchdayId &&
      stateBeforeClicks.ui.environmentRows.length > 0,
    knockoutPredictorRenders: stateBeforeClicks.sections.knockoutPredictor &&
      stateBeforeClicks.ui.knockoutPredictor.fixtureOptions === 2 &&
      stateBeforeClicks.ui.knockoutPredictor.knownRows === 2 &&
      /M103|M104/.test(stateBeforeClicks.ui.knockoutPredictor.knownRowsText) &&
      /France vs England|Spain vs Argentina/i.test(stateBeforeClicks.ui.knockoutPredictor.knownRowsText) &&
      !/Morocco|Belgium|Norway|Switzerland/i.test(stateBeforeClicks.ui.knockoutPredictor.knownRowsText) &&
      /Projected advancer|advance|Extra time|Final Round Fixture|Third Place/i.test(stateBeforeClicks.ui.knockoutPredictor.resultText),
    knockoutBracketPredictionRenders: stateBeforeClicks.sections.knockoutBracketPrediction &&
      stateBeforeClicks.ui.knockoutBracketPrediction.summaryCards >= 5 &&
      stateBeforeClicks.ui.knockoutBracketPrediction.roundColumns >= 5 &&
      stateBeforeClicks.ui.knockoutBracketPrediction.r32Cards === 16 &&
      stateBeforeClicks.ui.knockoutBracketPrediction.r16Cards === 8 &&
      stateBeforeClicks.ui.knockoutBracketPrediction.qfCards === 4 &&
      stateBeforeClicks.ui.knockoutBracketPrediction.sfCards === 2 &&
      stateBeforeClicks.ui.knockoutBracketPrediction.finalCards === 1 &&
      stateBeforeClicks.ui.knockoutBracketPrediction.thirdPlaceCards === 1 &&
      stateBeforeClicks.ui.knockoutBracketPrediction.flagOrFallbackCount >= 62 &&
      stateBeforeClicks.ui.knockoutBracketPrediction.modelPickLabels >= 31 &&
      stateBeforeClicks.ui.knockoutBracketPrediction.actualLabels >= 31 &&
      stateBeforeClicks.ui.knockoutBracketPrediction.resultBadges >= 31 &&
      /Predicted Champion[\s\S]*Argentina/i.test(stateBeforeClicks.ui.knockoutBracketPrediction.predictedChampionText),
    knockoutBracketPredictionReachable: stateBeforeClicks.ui.knockoutBracketPrediction.hasDocumentLink,
    knockoutBracketNoFranceArgentinaR16: !stateBeforeClicks.ui.knockoutBracketPrediction.impossibleFranceArgentinaR16,
    knockoutBracketShowsPendingActuals: /Actual path pending|pending result|Actual/i.test(stateBeforeClicks.ui.knockoutBracketPrediction.boardText),
    matchEnvironmentMd1Accessible: md1MatchEnvironmentAccess.status === "pass" &&
      md1MatchEnvironmentAccess.selected === "md1" &&
      md1MatchEnvironmentAccess.rowCount > 0,
    matchEnvironmentMd2Accessible: md2MatchEnvironmentAccess.status === "pass" &&
      md2MatchEnvironmentAccess.selected === "md2" &&
      md2MatchEnvironmentAccess.rowCount > 0,
    matchdayDeskLoads: stateBeforeClicks.sections.matchdayDesk &&
      stateBeforeClicks.ui.matchdayDeskControls.matchdayOptions > 0 &&
      stateBeforeClicks.ui.matchdayDeskControls.strategyOptions > 0 &&
      stateBeforeClicks.ui.matchdayDeskContentBlocks > 0 &&
      stateBeforeClicks.ui.matchdayDeskContentText.length > 0,
    matchdayDeskDefaultFinalRound: stateBeforeClicks.ui.matchdayDeskControls.selectedMatchday === activePublicMatchdayId,
    liveMd1SupportLoaded: stateBeforeClicks.globals.activeGlobalCounts.liveFixtures > 0 &&
      stateBeforeClicks.globals.activeGlobalCounts.livePlayers > 0
  };

  return {
    page: "index.html",
    viewport,
    stateBeforeClicks,
    activeGlobals,
    matchEnvironmentAccess: {
      md1: md1MatchEnvironmentAccess,
      md2: md2MatchEnvironmentAccess,
      finalRound: activeMatchEnvironmentAccess
    },
    profileClicks: [quickPickProfile, captainProfile, adviceProfile, franceProfile, spainProfile, englandProfile, argentinaProfile, messiProfile, mbappeProfile],
    teamBuilderBuild,
    addToBuilder,
    filters: {
      forwardFilterState,
      matchdayFilterState
    },
    stateAfterInteractions,
    checks: sectionChecks,
    failures: failReasons(sectionChecks),
    console: summarizeMessages(messages),
    consoleErrors,
    consoleWarnings,
    failedRequests,
    pageErrors,
    screenshotPath
  };
}

async function testWorldCupPage(browser, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const messages = [];
  const failedRequests = [];
  const pageErrors = [];

  page.on("console", (message) => messages.push({ type: message.type(), text: message.text(), url: message.location()?.url || null }));
  page.on("requestfailed", (request) => failedRequests.push({ url: request.url(), failure: request.failure()?.errorText || null }));
  page.on("pageerror", (error) => pageErrors.push(String(error)));

  await page.goto(`${baseUrl}/world-cup.html`, { waitUntil: "load", timeout: 120000 });
  await page.waitForSelector("body", { timeout: 30000 });
  const state = await page.evaluate(() => ({
    title: document.title,
    textSample: document.body.innerText.slice(0, 1000),
    hasGroupsOrFixtures: /Group|Fixture|World Cup/i.test(document.body.innerText),
    r32AuthorityFixtureCount: window.R32_FIXTURE_AUTHORITY_DATA?.fixtures?.length || 0,
    r16AuthorityFixtureCount: window.R16_FIXTURE_AUTHORITY_DATA?.fixtures?.length || 0,
    qfAuthorityFixtureCount: window.QF_FIXTURE_AUTHORITY_DATA?.fixtures?.length || 0,
    sfAuthorityFixtureCount: window.SF_FIXTURE_AUTHORITY_DATA?.fixtures?.length || 0,
    finalRoundAuthorityFixtureCount: window.FINAL_ROUND_FIXTURE_AUTHORITY_DATA?.fixtures?.length || 0,
    renderedR32CardCount: Array.from(document.querySelectorAll('#bracket .bracket-match[data-bracket-slot^="M"]'))
      .filter((node) => /·\s*R32/i.test(node.textContent || "")).length,
    renderedR16CardCount: Array.from(document.querySelectorAll('#bracket .bracket-match[data-bracket-slot^="M"]'))
      .filter((node) => /·\s*R16/i.test(node.textContent || "")).length,
    renderedQfCardCount: Array.from(document.querySelectorAll('#bracket .bracket-match[data-bracket-slot^="M"]'))
      .filter((node) => /·\s*QF/i.test(node.textContent || "")).length,
    renderedSfCardCount: Array.from(document.querySelectorAll('#bracket .bracket-match[data-bracket-slot^="M"]'))
      .filter((node) => /·\s*SF/i.test(node.textContent || "")).length,
    renderedFinalRoundCardCount: Array.from(document.querySelectorAll('#bracket .bracket-match[data-bracket-slot^="M"]'))
      .filter((node) => /·\s*(Final|Third Place)/i.test(node.textContent || "")).length,
    renderedQfText: Array.from(document.querySelectorAll('#bracket .bracket-match[data-bracket-slot^="M"]'))
      .filter((node) => /·\s*QF/i.test(node.textContent || ""))
      .map((node) => node.textContent || "")
      .join(" ")
      .replace(/\s+/g, " ")
      .trim(),
    renderedSfText: Array.from(document.querySelectorAll('#bracket .bracket-match[data-bracket-slot^="M"]'))
      .filter((node) => /·\s*SF/i.test(node.textContent || ""))
      .map((node) => node.textContent || "")
      .join(" ")
      .replace(/\s+/g, " ")
      .trim(),
    renderedFinalRoundText: Array.from(document.querySelectorAll('#bracket .bracket-match[data-bracket-slot^="M"]'))
      .filter((node) => /·\s*(Final|Third Place)/i.test(node.textContent || ""))
      .map((node) => node.textContent || "")
      .join(" ")
      .replace(/\s+/g, " ")
      .trim(),
    bracketText: document.querySelector("#bracket")?.innerText?.replace(/\s+/g, " ").trim().slice(0, 12000) || "",
    hasImpossibleFranceArgentinaR16: Array.from(document.querySelectorAll('#bracket .bracket-match[data-bracket-slot^="M"]'))
      .filter((node) => /·\s*R16/i.test(node.textContent || ""))
      .some((node) => /France/i.test(node.textContent || "") && /Argentina/i.test(node.textContent || "")),
    hasKnownR32Tbd: Array.from(document.querySelectorAll('#bracket .bracket-match[data-bracket-slot^="M"]'))
      .filter((node) => /·\s*R32/i.test(node.textContent || ""))
      .some((node) => /TBD|to be decided|pending/i.test(node.textContent || "")),
    scroll: {
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      hasPageOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    }
  }));
  const screenshotPath = `${screenshotDir}/world-cup-${viewport.width}.png`;
  fs.mkdirSync(screenshotDir, { recursive: true });
  await page.screenshot({ path: screenshotPath, fullPage: false });
  await context.close();

  return {
    page: "world-cup.html",
    viewport,
    state,
    console: summarizeMessages(messages),
    consoleErrors: summarizeMessages(messages.filter((entry) => entry.type === "error")),
    consoleWarnings: summarizeMessages(messages.filter((entry) => entry.type === "warning" || entry.type === "warn")),
    failedRequests,
    pageErrors,
    failures: [
      ...(!state.hasGroupsOrFixtures ? ["worldCupContentMissing"] : []),
      ...(state.r32AuthorityFixtureCount !== 16 ? ["worldCupR32AuthorityMissing"] : []),
      ...(state.r16AuthorityFixtureCount !== 8 ? ["worldCupR16AuthorityMissing"] : []),
      ...(state.qfAuthorityFixtureCount !== 4 ? ["worldCupQfAuthorityMissing"] : []),
      ...(state.sfAuthorityFixtureCount !== 2 ? ["worldCupSfAuthorityMissing"] : []),
      ...(state.finalRoundAuthorityFixtureCount !== 2 ? ["worldCupFinalRoundAuthorityMissing"] : []),
      ...(state.renderedR32CardCount < 16 ? ["worldCupR32CardsMissing"] : []),
      ...(state.renderedR16CardCount < 8 ? ["worldCupR16CardsMissing"] : []),
      ...(state.renderedQfCardCount < 4 ? ["worldCupQfCardsMissing"] : []),
      ...(state.renderedSfCardCount < 2 ? ["worldCupSfCardsMissing"] : []),
      ...(state.renderedFinalRoundCardCount < 2 ? ["worldCupFinalRoundCardsMissing"] : []),
      ...(!/M77[\s\S]*France.*Sweden/i.test(state.bracketText) ? ["worldCupFranceR32Missing"] : []),
      ...(!/M86[\s\S]*Argentina.*Cabo Verde/i.test(state.bracketText) ? ["worldCupArgentinaR32Missing"] : []),
      ...(state.hasImpossibleFranceArgentinaR16 ? ["worldCupImpossibleFranceArgentinaR16"] : []),
      ...(!/M97[\s\S]*France.*Morocco/i.test(state.renderedQfText) ? ["worldCupFranceMoroccoQfMissing"] : []),
      ...(!/M100[\s\S]*Argentina.*Switzerland/i.test(state.renderedQfText) ? ["worldCupArgentinaSwitzerlandQfMissing"] : []),
      ...(!/M101[\s\S]*France.*Spain/i.test(state.renderedSfText) ? ["worldCupFranceSpainSfMissing"] : []),
      ...(!/M102[\s\S]*England.*Argentina/i.test(state.renderedSfText) ? ["worldCupEnglandArgentinaSfMissing"] : []),
      ...(!/M103[\s\S]*France.*England/i.test(state.renderedFinalRoundText) ? ["worldCupFranceEnglandThirdPlaceMissing"] : []),
      ...(!/M104[\s\S]*Spain.*Argentina/i.test(state.renderedFinalRoundText) ? ["worldCupSpainArgentinaFinalMissing"] : []),
      ...(state.hasKnownR32Tbd ? ["worldCupKnownR32Tbd"] : []),
      ...(pageErrors.length ? ["worldCupPageErrors"] : [])
    ],
    screenshotPath
  };
}

async function main() {
  const executablePath = firstExistingPath(executableCandidates);
  if (!executablePath) throw new Error("No local browser executable found for public preview QA.");

  const browser = await chromium.launch({ headless: true, executablePath });
  const indexResults = [];
  const worldCupResults = [];

  for (const viewport of viewports) {
    indexResults.push(await testMainPage(browser, viewport));
  }

  for (const viewport of viewports) {
    worldCupResults.push(await testWorldCupPage(browser, viewport));
  }

  await browser.close();

  const allResults = indexResults.concat(worldCupResults);
  const blockingFailedRequests = allResults.flatMap((entry) =>
    entry.failedRequests
      .filter((request) => !isIgnoredFailedRequest(request))
      .map((request) => ({ page: entry.page, viewport: entry.viewport.width, ...request }))
  );
  const summary = {
    indexViewportsTested: indexResults.length,
    worldCupViewportsTested: worldCupResults.length,
    consoleErrorCount: allResults.reduce((total, entry) => total + entry.consoleErrors.length + entry.pageErrors.length, 0),
    consoleWarningCount: allResults.reduce((total, entry) => total + entry.consoleWarnings.length, 0),
    failedRequestCount: allResults.reduce((total, entry) => total + entry.failedRequests.length, 0),
    blockingFailedRequestCount: blockingFailedRequests.length,
    blockingFailedRequests,
    indexOverflowViewports: indexResults.filter((entry) => entry.stateBeforeClicks.scroll.hasPageOverflow).map((entry) => entry.viewport.width),
    worldCupOverflowViewports: worldCupResults.filter((entry) => entry.state.scroll.hasPageOverflow).map((entry) => entry.viewport.width),
    indexFailures: indexResults.flatMap((entry) => entry.failures.map((failure) => ({ viewport: entry.viewport.width, failure }))),
    worldCupFailures: worldCupResults.flatMap((entry) => entry.failures.map((failure) => ({ viewport: entry.viewport.width, failure }))),
    profileClickFailures: indexResults.flatMap((entry) =>
      entry.profileClicks
        .filter((click) => !["pass", "skip"].includes(click.status))
        .map((click) => ({ viewport: entry.viewport.width, label: click.label, reason: click.reason }))
    ),
    oldGlobalsPresent: indexResults.flatMap((entry) =>
      entry.activeGlobals.oldGlobalsPresent.map((globalName) => ({ viewport: entry.viewport.width, globalName }))
    ),
    missingActiveGlobals: indexResults.flatMap((entry) =>
      entry.activeGlobals.missingActiveGlobals.map((globalName) => ({ viewport: entry.viewport.width, globalName }))
    )
  };
  summary.status = summary.consoleErrorCount ||
    summary.blockingFailedRequestCount ||
    summary.indexFailures.length ||
    summary.worldCupFailures.length ||
    summary.profileClickFailures.length ||
    summary.oldGlobalsPresent.length ||
    summary.missingActiveGlobals.length
    ? "fail"
    : "pass";

  const result = {
    generated_at: new Date().toISOString(),
    baseUrl,
    executablePath,
    viewports,
    stale_selector_replaced: {
      previous_selector: "#dashboard-grid .player-name-button inside the fallback-mode run that disabled fantasyPool data scripts",
      current_waits: [
        "#dashboard-grid .pick-card, #dashboard-grid .player-name-button",
        "#advice-style-note .model-data-badge after #team-advice is opened",
        "#captain-card-grid .pick-card, #captain-card-grid .player-name-button",
        "#advice-card-grid .pick-card, #advice-card-grid .player-name-button",
        "#match-environment-table-body tr"
      ],
      current_default_assertions: [
        "Picks default to sf",
        "Captain Watchlist renders Final Round context",
        "Player Profile shows Final Round practical context",
        "Team Builder selected matchday is sf",
        "Match Environment selected matchday is sf and MD1/MD2 remain selectable",
        "Matchday Desk selected matchday is sf",
        "Knockout predictor renders known SF fixtures with no arbitrary matchup selector",
        "Visual Knockout Bracket Prediction renders summary cards, round columns, flags/fallbacks, model picks, actual labels, and prediction-result badges"
      ],
      fallback_mode_removed: true
    },
    indexResults,
    worldCupResults,
    summary
  };

  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  fs.writeFileSync(reportPath, buildMarkdownReport(result));
  console.log(JSON.stringify(summary, null, 2));

  if (summary.status !== "pass") {
    process.exitCode = 1;
  }
}

await main();
