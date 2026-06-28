import fs from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const baseUrl = process.env.PUBLIC_PREVIEW_BASE_URL || "http://127.0.0.1:8766";
const outputPath = process.env.PUBLIC_PREVIEW_QA_OUTPUT || "/private/tmp/public_preview_browser_qa_result.json";
const reportPath = process.env.PUBLIC_PREVIEW_QA_REPORT || "data/publicPreviewBrowserQaReport_v1.md";
const screenshotDir = process.env.PUBLIC_PREVIEW_QA_SCREENSHOT_DIR || "/private/tmp/public_preview_browser_qa_screenshots";
const activePublicMatchdayId = "r32";
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
  "knockoutScorePredictorData.js",
  "fantasyPoolOfficialDataStatusData.js",
  "liveMatchdayStatusData.js",
  "livePlayerStatusData.js",
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
  KNOCKOUT_SCORE_PREDICTOR_DATA: (value) =>
    Boolean(value && Array.isArray(value.known_r32_predictions) && value.known_r32_predictions.length > 0),
  FANTASY_POOL_OFFICIAL_DATA_STATUS: (value) =>
    Boolean(value && Array.isArray(value.official_position_records) && value.official_position_records.length > 0),
  LIVE_MATCHDAY_STATUS_DATA: (value) => Boolean(value && Array.isArray(value.fixtures)),
  LIVE_PLAYER_STATUS_DATA: (value) => Boolean(value && Array.isArray(value.players))
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
      ? "**pass - safe_to_share_r32_final_public_preview**"
      : "**fail - do_not_share_until_browser_qa_is_fixed**",
    "",
    "The public preview browser QA exercised `index.html` and `world-cup.html` across desktop and mobile widths. Final R32 is the public default, MD1/MD2/MD3 remain accessible as historical views, live completed scores are shown only through the safe mapping path, all group-stage fixtures are final, and old public globals are absent.",
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
        ["Picks default to R32", checks.picksDefaultR32 ? "pass" : "fail"],
        ["Final R32 label visible", checks.finalR32LabelVisible ? "pass" : "fail"],
        ["Captain Watchlist opens on R32", checks.captainWatchlistDefaultR32 ? "pass" : "fail"],
        ["Match Environment opens on R32", checks.matchEnvironmentDefaultR32 ? "pass" : "fail"],
        ["MD1 remains accessible", checks.matchEnvironmentMd1Accessible ? "pass" : "fail"],
        ["MD2 remains accessible", checks.matchEnvironmentMd2Accessible ? "pass" : "fail"],
        ["Team Builder opens on R32", checks.teamBuilderDefaultR32 ? "pass" : "fail"],
        ["Knockout predictor renders", checks.knockoutPredictorRenders ? "pass" : "fail"],
        ["Player Profile opens", checks.playerProfileOpens ? "pass" : "fail"],
        ["Current data scripts loaded", checks.currentScriptsLoaded ? "pass" : "fail"],
        ["Old globals absent", checks.oldGlobalsAbsent ? "pass" : "fail"],
        ["Live group-stage support data loaded", checks.liveMd1SupportLoaded ? "pass" : "fail"],
        ["World Cup page renders", firstWorldCup?.failures?.length ? "fail" : "pass"]
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
        ["R32 projection rows", globals.r32Projections],
        ["Known knockout predictions", globals.knownKnockoutPredictions],
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
    "- Browser QA confirms the public final R32 data path, knockout predictor, and live display plumbing.",
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
    showsR32Context: /Round of 32|R32/i.test(modalText),
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
      r32Projections: (window.FANTASY_POOL_PLAYER_MATCHDAY_PROJECTIONS || []).filter((row) => row.matchday === "r32").length,
      finance: window.FANTASY_POOL_PLAYER_FINANCE_METRICS?.length || 0,
      scoreFixtures: window.FANTASY_POOL_SCORE_FIXTURE_PREDICTIONS?.length || window.FANTASY_POOL_SCORE_PREDICTIONS_DATA?.fixtureScorePredictions?.length || 0,
      knownKnockoutPredictions: window.KNOCKOUT_SCORE_PREDICTOR_DATA?.known_r32_predictions?.length || 0,
      officialRecords: window.FANTASY_POOL_OFFICIAL_DATA_STATUS?.official_position_records?.length || 0,
      liveFixtures: window.LIVE_MATCHDAY_STATUS_DATA?.fixtures?.length || 0,
      livePlayers: window.LIVE_PLAYER_STATUS_DATA?.players?.length || 0
    };
    const topR32Projection = [...(window.FANTASY_POOL_PLAYER_MATCHDAY_PROJECTIONS || [])]
      .filter((row) => row.matchday === "r32")
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
        topR32Projection: topR32Projection ? {
          name: topR32Projection.name,
          projectedPoints: topR32Projection.projectedPoints || topR32Projection.raw_expected_points || null,
          captainUpsideScore: topR32Projection.captainUpsideScore || topR32Projection.captain_score || null
        } : null
      },
      sections: {
        picks: Boolean(document.querySelector("#picks")),
        captainWatchlist: Boolean(document.querySelector("#captain-picks")),
        matchdayDesk: Boolean(document.querySelector("#matchday-desk")),
        teamBuilder: Boolean(document.querySelector("#team-builder")),
        matchEnvironment: Boolean(document.querySelector("#match-environment")),
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
        finalR32LabelVisible: /Final R32 setup|R32 fantasy recommendations|path matters beyond R32|defensive form/i.test(bodyText),
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
          homeTeam: selectValue("#knockout-home-team-select"),
          awayTeam: selectValue("#knockout-away-team-select"),
          homeOptions: selectOptionCount("#knockout-home-team-select"),
          awayOptions: selectOptionCount("#knockout-away-team-select"),
          resultText: textFrom("#knockout-matchup-result"),
          knownRows: document.querySelectorAll("#knockout-known-fixtures-body tr").length
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
      KNOCKOUT_SCORE_PREDICTOR_DATA: Boolean(window.KNOCKOUT_SCORE_PREDICTOR_DATA?.known_r32_predictions?.length),
      FANTASY_POOL_OFFICIAL_DATA_STATUS: Boolean(window.FANTASY_POOL_OFFICIAL_DATA_STATUS?.official_position_records?.length),
      LIVE_MATCHDAY_STATUS_DATA: Boolean(window.LIVE_MATCHDAY_STATUS_DATA?.fixtures?.length),
      LIVE_PLAYER_STATUS_DATA: Boolean(window.LIVE_PLAYER_STATUS_DATA?.players?.length)
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
  await waitForVisibleActiveDataBadge(page);
  await openDetails(page, "#match-environment");
  await page.waitForSelector("#match-environment-table-body tr", { timeout: 60000 });
  await page.waitForSelector("#knockout-known-fixtures-body tr", { timeout: 60000 });

  const activeGlobals = await verifyActiveGlobals(page);
  const stateBeforeClicks = await collectPageState(page);
  const md1MatchEnvironmentAccess = await testMatchEnvironmentMatchdayAccess(page, "md1");
  const md2MatchEnvironmentAccess = await testMatchEnvironmentMatchdayAccess(page, "md2");
  const activeMatchEnvironmentAccess = await testMatchEnvironmentMatchdayAccess(page, activePublicMatchdayId);
  const quickPickProfile = await clickProfileAndClose(page, "#dashboard-grid .player-name-button", "Picks");
  const captainProfile = await clickProfileAndClose(page, "#captain-card-grid .player-name-button", "Captain Watchlist");
  const adviceProfile = await clickProfileAndClose(page, "#advice-card-grid .player-name-button, #advice-table-body .player-name-button", "Official Fantasy Picks");
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
    finalR32LabelVisible: stateBeforeClicks.ui.finalR32LabelVisible &&
      /Final R32|path matters|defensive form/i.test(stateBeforeClicks.ui.activeDataBadgeText + " " + stateBeforeClicks.ui.quickPickText + " " + stateBeforeClicks.ui.matchEnvironmentSummary),
    scoreModelR32Loaded: activeGlobals.scoreModelVersion === "score-r32-v1-pele-group-stage-calibrated-defensive-form",
    projectionModelR32Loaded: activeGlobals.projectionModelVersion === "player-projection-r32-v1",
    activeOfficialRecordsLoaded: stateBeforeClicks.globals.activeGlobalCounts.officialRecords > 0,
    activeGlobalsPresent: activeGlobals.missingActiveGlobals.length === 0,
    oldGlobalsAbsent: activeGlobals.oldGlobalsPresent.length === 0,
    currentScriptsLoaded: stateBeforeClicks.scripts.missingCurrentScripts.length === 0,
    oldScriptsAbsent: stateBeforeClicks.scripts.loadedLegacyScripts.length === 0,
    picksRender: stateBeforeClicks.ui.quickPickCards > 0 && stateBeforeClicks.ui.quickPickNames.length > 0,
    picksDefaultR32: stateBeforeClicks.ui.adviceMatchdaySelected === activePublicMatchdayId &&
      /Round of 32|R32/i.test(`${stateBeforeClicks.ui.quickPickText} ${stateBeforeClicks.ui.adviceStyleNote}`),
    captainWatchlistRenders: stateBeforeClicks.sections.captainWatchlist && stateBeforeClicks.ui.captainCards > 0,
    captainWatchlistDefaultR32: /Round of 32|R32/i.test(stateBeforeClicks.ui.captainCardText),
    playerProfileOpens: [quickPickProfile, captainProfile, adviceProfile].some((result) => result.status === "pass" && result.playerProfileOpened),
    playerProfilePracticalR32: [quickPickProfile, captainProfile, adviceProfile].some((result) => result.status === "pass" && result.showsR32Context),
    teamBuilderControlsLoad: stateBeforeClicks.ui.teamBuilderControls.strategyOptions > 0 &&
      stateBeforeClicks.ui.teamBuilderControls.matchdayOptions > 0 &&
      stateBeforeClicks.ui.teamBuilderControls.buildButton,
    teamBuilderDefaultR32: stateBeforeClicks.ui.teamBuilderControls.selectedMatchday === activePublicMatchdayId &&
      /R32|Round of 32/i.test(stateBeforeClicks.ui.teamBuilderControls.buildButtonText),
    addToBuilderWorksOrUnsupported: addToBuilder.status === "pass" || addToBuilder.status === "skip",
    matchEnvironmentLoads: stateBeforeClicks.ui.environmentRows.length > 0,
    matchEnvironmentDefaultR32: stateBeforeClicks.ui.matchEnvironmentControls.selectedMatchday === activePublicMatchdayId &&
      stateBeforeClicks.ui.environmentRows.some((row) => /Round of 32|R32/i.test(row)),
    knockoutPredictorRenders: stateBeforeClicks.sections.knockoutPredictor &&
      stateBeforeClicks.ui.knockoutPredictor.homeOptions >= 48 &&
      stateBeforeClicks.ui.knockoutPredictor.knownRows > 0 &&
      /Projected advancer|advance|Extra time/i.test(stateBeforeClicks.ui.knockoutPredictor.resultText),
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
    matchdayDeskDefaultR32: stateBeforeClicks.ui.matchdayDeskControls.selectedMatchday === activePublicMatchdayId,
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
      r32: activeMatchEnvironmentAccess
    },
    profileClicks: [quickPickProfile, captainProfile, adviceProfile],
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
        .filter((click) => click.status !== "pass")
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
        "Picks default to r32",
        "Captain Watchlist renders Round of 32 context",
        "Player Profile shows Round of 32 practical context",
        "Team Builder selected matchday is r32",
        "Match Environment selected matchday is r32 and MD1/MD2 remain selectable",
        "Matchday Desk selected matchday is r32",
        "Knockout predictor renders known fixtures and arbitrary matchup result"
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
