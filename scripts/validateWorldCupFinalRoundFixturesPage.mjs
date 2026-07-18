import { readFile, writeFile } from "node:fs/promises";
import vm from "node:vm";

const PATHS = {
  html: "world-cup.html",
  worldCupData: "worldCupData.js",
  liveMatchdayData: "liveMatchdayStatusData.js",
  r32AuthorityData: "r32FixtureAuthorityData.js",
  r16AuthorityData: "r16FixtureAuthorityData.js",
  qfAuthorityData: "qfFixtureAuthorityData.js",
  sfAuthorityData: "sfFixtureAuthorityData.js",
  finalRoundAuthorityData: "finalRoundFixtureAuthorityData.js",
  pageScript: "worldCupPage.js",
  finalRoundAuthorityJson: "data/finalRoundFixtureAuthority_v1.json",
  liveMatchdayJson: "data/liveMatchdayStatus_v1.json",
  outputJson: "data/worldCupFinalRoundFixturesPageQa_v1.json",
  outputReport: "data/worldCupFinalRoundFixturesPageQaReport_v1.md"
};

const GENERATED_AT = new Date().toISOString();

function htmlToText(html) {
  return String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function mdTable(headers, rows) {
  if (!rows.length) return "_None._";
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((value) => String(value ?? "")).join(" | ")} |`)
  ].join("\n");
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function renderWorldCupPage() {
  const elements = new Map();
  for (const id of ["groups-grid", "fixtures-by-group", "bracket-rounds", "bracket-note", "world-cup-sources", "source-checked-date"]) {
    elements.set(id, { id, innerHTML: "", textContent: "" });
  }

  const consoleMessages = [];
  const sandbox = {
    window: {},
    document: {
      getElementById(id) {
        return elements.get(id) || null;
      }
    },
    console: {
      log: (...args) => consoleMessages.push({ type: "log", text: args.join(" ") }),
      warn: (...args) => consoleMessages.push({ type: "warning", text: args.join(" ") }),
      error: (...args) => consoleMessages.push({ type: "error", text: args.join(" ") })
    },
    Intl,
    Date,
    Number,
    String,
    Boolean,
    Array,
    Map,
    Set,
    Math,
    RegExp
  };
  sandbox.window.window = sandbox.window;
  sandbox.window.document = sandbox.document;
  sandbox.window.console = sandbox.console;
  sandbox.globalThis = sandbox;

  for (const filePath of [
    PATHS.worldCupData,
    PATHS.liveMatchdayData,
    PATHS.r32AuthorityData,
    PATHS.r16AuthorityData,
    PATHS.qfAuthorityData,
    PATHS.sfAuthorityData,
    PATHS.finalRoundAuthorityData,
    PATHS.pageScript
  ]) {
    vm.runInNewContext(await readFile(filePath, "utf8"), sandbox, { filename: filePath });
  }

  return {
    bracketHtml: elements.get("bracket-rounds")?.innerHTML || "",
    bracketText: htmlToText(elements.get("bracket-rounds")?.innerHTML || ""),
    bracketNote: elements.get("bracket-note")?.textContent || "",
    consoleMessages
  };
}

function bracketArticleForSlot(html, slot) {
  const pattern = new RegExp(`<article class="bracket-match"[^>]*data-bracket-slot="${slot}"[\\s\\S]*?<\\/article>`, "i");
  const match = String(html || "").match(pattern);
  return match ? { html: match[0], text: htmlToText(match[0]) } : null;
}

function buildReport(qa) {
  return [
    "# World Cup Final Round Fixtures Page QA v1",
    "",
    `Generated: ${qa.generated_at}`,
    "",
    `Status: ${qa.status}`,
    "",
    "## Summary",
    "",
    mdTable(["Metric", "Value"], Object.entries(qa.summary).map(([key, value]) => [key, typeof value === "object" ? JSON.stringify(value) : value])),
    "",
    "## Checks",
    "",
    mdTable(["Check", "Status", "Detail"], qa.checks.map((check) => [check.id, check.status, check.detail || ""])),
    "",
    "## Errors",
    "",
    qa.errors.length ? qa.errors.map((error) => `- ${error}`).join("\n") : "None",
    ""
  ].join("\n");
}

const [html, authority, live, rendered] = await Promise.all([
  readFile(PATHS.html, "utf8"),
  readJson(PATHS.finalRoundAuthorityJson),
  readJson(PATHS.liveMatchdayJson),
  renderWorldCupPage()
]);

const errors = [];
const checks = [];
const addCheck = (id, passed, detail = "") => {
  checks.push({ id, status: passed ? "pass" : "fail", detail });
  if (!passed) errors.push(`${id}: ${detail}`);
};

const thirdArticle = bracketArticleForSlot(rendered.bracketHtml, "M103");
const finalArticle = bracketArticleForSlot(rendered.bracketHtml, "M104");
const sf101Article = bracketArticleForSlot(rendered.bracketHtml, "M101");
const sf102Article = bracketArticleForSlot(rendered.bracketHtml, "M102");
const finalRoundLoadOrder = html.indexOf("finalRoundFixtureAuthorityData.js") >= 0 &&
  html.indexOf("worldCupPage.js") >= 0 &&
  html.indexOf("finalRoundFixtureAuthorityData.js") < html.indexOf("worldCupPage.js");
const source103 = (live.fixtures || []).find((fixture) => String(fixture.source_fixture_id) === "103");
const source104 = (live.fixtures || []).find((fixture) => String(fixture.source_fixture_id) === "104");

addCheck("final_round_authority_pass", authority.status === "pass", authority.status);
addCheck("world_cup_loads_final_round_authority_before_page_script", finalRoundLoadOrder, "");
addCheck("third_place_slot_renders", Boolean(thirdArticle), thirdArticle?.text || "missing");
addCheck("final_slot_renders", Boolean(finalArticle), finalArticle?.text || "missing");
addCheck("third_place_teams_correct", Boolean(thirdArticle?.text.includes("France") && thirdArticle.text.includes("England")), thirdArticle?.text || "");
addCheck("final_teams_correct", Boolean(finalArticle?.text.includes("Spain") && finalArticle.text.includes("Argentina")), finalArticle?.text || "");
addCheck("third_place_kickoff_visible", Boolean(thirdArticle?.text.includes("Jul 18, 2026") || thirdArticle?.text.includes(source103?.date || "")), thirdArticle?.text || "");
addCheck("final_kickoff_visible", Boolean(finalArticle?.text.includes("Jul 19, 2026") || finalArticle?.text.includes(source104?.date || "")), finalArticle?.text || "");
addCheck("final_round_no_tbd", !/M10[34][\s\S]{0,250}TBD/i.test(rendered.bracketText), "");
addCheck("sf101_actual_score_visible", Boolean(sf101Article?.text.includes("Actual:") && sf101Article.text.includes("0 - 2") && sf101Article.text.includes("Full time")), sf101Article?.text || "missing");
addCheck("sf102_actual_score_visible", Boolean(sf102Article?.text.includes("Actual:") && sf102Article.text.includes("1 - 2") && sf102Article.text.includes("Full time")), sf102Article?.text || "missing");
addCheck("no_console_errors", !rendered.consoleMessages.some((message) => message.type === "error"), JSON.stringify(rendered.consoleMessages));

const qa = {
  schema_version: "world_cup_final_round_fixtures_page_qa_v1",
  generated_at: GENERATED_AT,
  status: errors.length ? "failed" : "passed",
  files: PATHS,
  summary: {
    final_round_authority_status: authority.status,
    final_fixture_visible: Boolean(finalArticle),
    third_place_fixture_visible: Boolean(thirdArticle),
    final_teams: finalArticle?.text || null,
    third_place_teams: thirdArticle?.text || null,
    sf101_text: sf101Article?.text || null,
    sf102_text: sf102Article?.text || null,
    console_error_count: rendered.consoleMessages.filter((message) => message.type === "error").length
  },
  checks,
  errors,
  console_messages: rendered.consoleMessages
};

await writeFile(PATHS.outputJson, `${JSON.stringify(qa, null, 2)}\n`, "utf8");
await writeFile(PATHS.outputReport, buildReport(qa), "utf8");

console.log(JSON.stringify({
  status: qa.status,
  output_json: PATHS.outputJson,
  final_fixture_visible: qa.summary.final_fixture_visible,
  third_place_fixture_visible: qa.summary.third_place_fixture_visible,
  errors
}, null, 2));

if (qa.status !== "passed") {
  process.exitCode = 1;
}
