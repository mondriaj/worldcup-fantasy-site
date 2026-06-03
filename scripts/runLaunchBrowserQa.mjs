import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const baseUrl = process.argv[2] || "http://127.0.0.1:8770";
const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const viewports = [
  { label: "desktop", width: 1440, height: 1000 },
  { label: "mobile", width: 390, height: 844 }
];

const stalePublicCopyPattern = /Official Fantasy Pool Preview|data is provisional|learning-project estimates|Draft rules based|not official FIFA World Cup 2026 fantasy rules/i;

async function pageText(page, selector) {
  return page.locator(selector).innerText({ timeout: 15000 });
}

async function qaPage(browser, path, viewport) {
  const page = await browser.newPage({ viewport });
  const messages = [];
  const pageErrors = [];
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) {
      messages.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  const url = `${baseUrl.replace(/\/$/, "")}/${path}`;
  const response = await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  const bodyText = await pageText(page, "body");
  const result = {
    path,
    viewport: viewport.label,
    status: response?.status() || null,
    title: await page.title(),
    stale_public_copy: stalePublicCopyPattern.test(bodyText),
    console_messages: messages,
    page_errors: pageErrors
  };

  if (path === "index.html") {
    await page.locator("#team-builder").scrollIntoViewIfNeeded();
    result.builder_before = {
      rule_note: await pageText(page, "#squad-rule-note"),
      summary_price: await pageText(page, "#summary-price"),
      summary_budget: await pageText(page, "#summary-budget")
    };
    await page.locator("#build-team-btn-bottom").click({ timeout: 15000 });
    await page.waitForTimeout(2500);
    result.builder_after = {
      message: await pageText(page, "#team-message"),
      squad_size: await pageText(page, "#summary-locked"),
      starter_cards: await page.locator(".player-card:not(.player-card--placeholder)").count(),
      warning: await page.locator("#builder-warning").isVisible()
        ? await pageText(page, "#builder-warning")
        : ""
    };
    result.field_overlap_pairs = await page.locator("#team-field .player-card:not(.player-card--placeholder)").evaluateAll((cards) => {
      const boxes = cards.map((card, index) => {
        const rect = card.getBoundingClientRect();
        return {
          index,
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom
        };
      });
      const overlaps = [];
      for (let i = 0; i < boxes.length; i += 1) {
        for (let j = i + 1; j < boxes.length; j += 1) {
          const a = boxes[i];
          const b = boxes[j];
          const overlapX = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
          const overlapY = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
          if (overlapX > 2 && overlapY > 2) {
            overlaps.push([a.index, b.index]);
          }
        }
      }
      return overlaps;
    });
  }

  result.screenshot = `/private/tmp/worldcup-launch-${path.replace(/\W+/g, "-")}-${viewport.label}.png`;
  await page.screenshot({ path: result.screenshot, fullPage: false });
  if (path === "index.html") {
    await page.locator("#team-field").scrollIntoViewIfNeeded().catch(() => {});
    result.field_screenshot = `/private/tmp/worldcup-launch-field-${viewport.label}.png`;
    await page.screenshot({ path: result.field_screenshot, fullPage: false });
  }
  await page.close();
  return result;
}

const browser = await chromium.launch({
  headless: true,
  executablePath: chromePath
});

try {
  const results = [];
  for (const viewport of viewports) {
    results.push(await qaPage(browser, "index.html", viewport));
  }
  results.push(await qaPage(browser, "world-cup.html", viewports[0]));
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
