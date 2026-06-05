import fs from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const baseUrl = process.env.PUBLIC_PREVIEW_BASE_URL || "http://127.0.0.1:8766";
const outputPath = process.env.PUBLIC_PREVIEW_QA_OUTPUT || "/private/tmp/public_preview_browser_qa_result.json";
const screenshotDir = process.env.PUBLIC_PREVIEW_QA_SCREENSHOT_DIR || "/private/tmp/public_preview_browser_qa_screenshots";
const executableCandidates = [
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  "/Users/jordimondria/Library/Caches/ms-playwright/chromium_headless_shell-1217/chrome-headless-shell-mac-arm64/chrome-headless-shell",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
].filter(Boolean);

const viewports = [360, 390, 768, 1024, 1440].map((width) => ({ width, height: width < 768 ? 900 : 1000 }));

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

async function collectPageState(page) {
  return page.evaluate(() => {
    const bodyText = document.body.innerText;
    const quickPickNames = [...document.querySelectorAll("#dashboard-grid .player-name-button")].map((button) => button.textContent.trim());
    const quickPickLabels = [...document.querySelectorAll("#dashboard-grid .info-card__label")].map((label) => label.textContent.trim());
    const captainRows = [
      ...document.querySelectorAll("#captain-card-grid .pick-card, #captain-table-body tr")
    ].map((row) => row.innerText.trim()).filter(Boolean);
    const adviceRows = [
      ...document.querySelectorAll("#advice-card-grid .pick-card, #advice-table-body tr")
    ].map((row) => row.innerText.trim()).filter(Boolean);
    const environmentRows = [...document.querySelectorAll("#match-environment-table-body tr")].map((row) => row.innerText.trim()).filter(Boolean);
    const overflowingElements = [...document.querySelectorAll("body *")]
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

    return {
      title: document.title,
      globals: {
        fantasyPoolRecommendations: Boolean(window.FANTASY_POOL_RECOMMENDATIONS_DATA),
        fantasyPoolRecommendationCandidates: window.FANTASY_POOL_RECOMMENDATION_CANDIDATES?.length || 0,
        fantasyPoolProjections: window.FANTASY_POOL_PLAYER_MATCHDAY_PROJECTIONS?.length || 0,
        fantasyPoolFinanceMetrics: window.FANTASY_POOL_PLAYER_FINANCE_METRICS?.length || 0,
        fantasyPoolScorePredictions: window.FANTASY_POOL_SCORE_FIXTURE_PREDICTIONS?.length || 0,
        fantasyPoolOfficialStatus: Boolean(window.FANTASY_POOL_OFFICIAL_DATA_STATUS),
        legacyFinancePlayers: window.FINANCE_PLAYERS_DATA?.length || 0,
        legacyMatchdayProjections: window.PLAYER_MATCHDAY_PROJECTIONS_DATA?.length || 0,
        legacyScorePredictions: window.SCORE_FIXTURE_PREDICTIONS_DATA?.length || 0
      },
      quickPickNames,
      quickPickLabels,
      captainRows: captainRows.slice(0, 6),
      adviceRows: adviceRows.slice(0, 8),
      environmentRows: environmentRows.slice(0, 8),
      warnings: {
        manualConfirmation: bodyText.includes("Confirm locks") || bodyText.includes("confirm squad legality, locks, and deadlines"),
        teamBuilderPlanningHelp: bodyText.includes("Team Builder is planning help") || bodyText.includes("Use the builder as planning help"),
        teamBuilderOfficialCheck: bodyText.includes("inside the official FIFA fantasy game") || bodyText.includes("inside the fantasy game")
      },
      modalOpen: !document.querySelector("#player-detail-modal")?.classList.contains("hidden"),
      scroll: {
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        hasPageOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        overflowingElements
      },
      buttons: {
        previewPlayerButtons: document.querySelectorAll("#dashboard-grid .player-name-button, #captain-card-grid .player-name-button, #captain-table-body .player-name-button, #advice-card-grid .player-name-button, #advice-table-body .player-name-button").length,
        closeProfileButtons: document.querySelectorAll("[data-close-player-detail]").length
      }
    };
  });
}

async function openDetails(page, selector) {
  await page.evaluate((target) => {
    const details = document.querySelector(target);
    if (details) {
      details.open = true;
    }
  }, selector);
}

async function clickProfileAndClose(page, selector, label) {
  const count = await page.locator(selector).count();
  if (!count) {
    return { label, status: "fail", reason: "no player button found" };
  }

  await page.locator(selector).first().click();
  await page.waitForSelector("#player-detail-modal:not(.hidden)", { timeout: 10000 });
  const modalText = await page.locator("#player-detail-modal").innerText({ timeout: 10000 });
  const result = {
    label,
    status: "pass",
    playerProfileOpened: true,
    showsOfficialPrice: /Official fantasy price|Price/i.test(modalText),
    showsPosition: /Position|Defender|Midfielder|Forward|Goalkeeper|FWD|MID|DEF|GK/i.test(modalText),
    showsPreviewWarning: /Official Fantasy Pool Preview|Final squad status|not final-squad-backed/i.test(modalText),
    modalTextSample: modalText.slice(0, 500)
  };

  await page.locator("#player-detail-close").click();
  await page.waitForFunction(() => document.querySelector("#player-detail-modal")?.classList.contains("hidden"), null, { timeout: 10000 });
  result.closedCleanly = true;
  return result;
}

async function testMainPage(browser, viewport, options = {}) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const messages = [];
  const failedRequests = [];
  const pageErrors = [];

  page.on("console", (message) => messages.push({ type: message.type(), text: message.text(), url: message.location()?.url || null }));
  page.on("requestfailed", (request) => failedRequests.push({ url: request.url(), failure: request.failure()?.errorText || null }));
  page.on("pageerror", (error) => pageErrors.push(String(error)));

  if (options.disablePreviewGlobals) {
    await page.route(/fantasyPool.*Data\.js(\?.*)?$/, (route) => route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: "// preview globals intentionally disabled for fallback QA\n"
    }));
  }

  await page.goto(`${baseUrl}/index.html`, { waitUntil: "load", timeout: 120000 });
  await page.waitForSelector("#dashboard-grid .player-name-button", { timeout: 60000 });
  await openDetails(page, "#captain-picks");
  await page.waitForSelector("#captain-card-grid .player-name-button, #captain-table-body .player-name-button", { timeout: 60000 });
  await openDetails(page, "#team-advice");
  await page.waitForSelector("#advice-card-grid .player-name-button, #advice-table-body .player-name-button", { timeout: 60000 });

  const stateBeforeClicks = await collectPageState(page);
  const quickPickProfile = await clickProfileAndClose(page, "#dashboard-grid .player-name-button", "Quick Picks");
  const captainProfile = await clickProfileAndClose(page, "#captain-card-grid .player-name-button, #captain-table-body .player-name-button", "Captain Watchlist");
  const adviceProfile = await clickProfileAndClose(page, "#advice-card-grid .player-name-button, #advice-table-body .player-name-button", "Pick Explorer");

  await page.locator("#advice-position-select").selectOption("Forward");
  await page.waitForTimeout(100);
  const forwardFilterState = await page.evaluate(() => ({
    rows: [...document.querySelectorAll("#advice-card-grid .pick-card, #advice-table-body tr")].map((row) => row.innerText.trim()).slice(0, 8),
    allRowsAreForwards: [...document.querySelectorAll("#advice-card-grid .pick-card, #advice-table-body tr")].every((row) =>
      row.innerText.includes("Forward") ||
      row.innerText.includes("No Official Fantasy Pool Preview") ||
      row.innerText.includes("No fantasy candidates match")
    )
  }));

  await page.locator("#advice-matchday-select").selectOption("md1");
  await page.waitForTimeout(150);
  const matchdayFilterState = await page.evaluate(() => ({
    selected: document.querySelector("#advice-matchday-select")?.value || null,
    note: document.querySelector("#advice-style-note")?.textContent || "",
    rows: document.querySelectorAll("#advice-card-grid .pick-card, #advice-table-body tr").length
  }));

  const screenshotPath = `${screenshotDir}/index-${viewport.width}${options.disablePreviewGlobals ? "-fallback" : ""}.png`;
  fs.mkdirSync(screenshotDir, { recursive: true });
  await page.screenshot({ path: screenshotPath, fullPage: false });

  const stateAfterInteractions = await collectPageState(page);
  await context.close();

  return {
    page: "index.html",
    viewport,
    fallbackMode: Boolean(options.disablePreviewGlobals),
    stateBeforeClicks,
    profileClicks: [quickPickProfile, captainProfile, adviceProfile],
    filters: {
      forwardFilterState,
      matchdayFilterState
    },
    stateAfterInteractions,
    console: summarizeMessages(messages),
    consoleErrors: summarizeMessages(messages.filter((entry) => entry.type === "error")),
    consoleWarnings: summarizeMessages(messages.filter((entry) => entry.type === "warning" || entry.type === "warn")),
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
    screenshotPath
  };
}

async function main() {
  const executablePath = firstExistingPath(executableCandidates);
  if (!executablePath) {
    throw new Error("No local browser executable found for public preview QA.");
  }

  const browser = await chromium.launch({ headless: true, executablePath });
  const indexResults = [];
  const worldCupResults = [];

  for (const viewport of viewports) {
    indexResults.push(await testMainPage(browser, viewport));
  }

  indexResults.push(await testMainPage(browser, { width: 390, height: 900 }, { disablePreviewGlobals: true }));

  for (const viewport of viewports) {
    worldCupResults.push(await testWorldCupPage(browser, viewport));
  }

  await browser.close();

  const result = {
    generated_at: new Date().toISOString(),
    baseUrl,
    executablePath,
    viewports,
    indexResults,
    worldCupResults,
    summary: {
      indexViewportsTested: indexResults.filter((entry) => !entry.fallbackMode).length,
      fallbackTests: indexResults.filter((entry) => entry.fallbackMode).length,
      worldCupViewportsTested: worldCupResults.length,
      consoleErrorCount: indexResults.concat(worldCupResults).reduce((sum, entry) => sum + entry.consoleErrors.length + entry.pageErrors.length, 0),
      consoleWarningCount: indexResults.concat(worldCupResults).reduce((sum, entry) => sum + entry.consoleWarnings.length, 0),
      failedRequestCount: indexResults.concat(worldCupResults).reduce((sum, entry) => sum + entry.failedRequests.length, 0),
      indexOverflowViewports: indexResults.filter((entry) => !entry.fallbackMode && entry.stateBeforeClicks.scroll.hasPageOverflow).map((entry) => entry.viewport.width),
      worldCupOverflowViewports: worldCupResults.filter((entry) => entry.state.scroll.hasPageOverflow).map((entry) => entry.viewport.width),
      profileClickFailures: indexResults.flatMap((entry) => entry.profileClicks.filter((click) => click.status !== "pass").map((click) => ({ viewport: entry.viewport.width, label: click.label, reason: click.reason }))),
      warningFailures: indexResults.filter((entry) => !entry.fallbackMode).flatMap((entry) => Object.entries(entry.stateBeforeClicks.warnings).filter(([, ok]) => !ok).map(([key]) => ({ viewport: entry.viewport.width, warning: key }))),
      fallbackRenderedLegacy: indexResults.filter((entry) => entry.fallbackMode).every((entry) =>
        entry.stateBeforeClicks.globals.fantasyPoolRecommendationCandidates === 0 &&
        entry.stateBeforeClicks.quickPickNames.length > 0 &&
        !entry.stateBeforeClicks.quickPickLabels.some((label) => label.includes("Preview"))
      )
    }
  };

  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result.summary, null, 2));
}

await main();
