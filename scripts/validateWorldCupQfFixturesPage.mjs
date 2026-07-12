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
  pageScript: "worldCupPage.js",
  qfAuthorityJson: "data/qfFixtureAuthority_v1.json",
  outputJson: "data/worldCupQfFixturesPageQa_v1.json",
  outputReport: "data/worldCupQfFixturesPageQaReport_v1.md"
};

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

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function renderWorldCupPage() {
  const elements = new Map();
  ["groups-grid", "fixtures-by-group", "bracket-rounds", "bracket-note", "world-cup-sources", "source-checked-date"].forEach((id) => {
    elements.set(id, { id, innerHTML: "", textContent: "" });
  });
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

  for (const filePath of [PATHS.worldCupData, PATHS.liveMatchdayData, PATHS.r32AuthorityData, PATHS.r16AuthorityData, PATHS.qfAuthorityData, PATHS.sfAuthorityData, PATHS.pageScript]) {
    vm.runInNewContext(await readFile(filePath, "utf8"), sandbox, { filename: filePath });
  }

  return {
    bracketHtml: elements.get("bracket-rounds")?.innerHTML || "",
    bracketText: htmlToText(elements.get("bracket-rounds")?.innerHTML || ""),
    consoleMessages
  };
}

function mdTable(headers, rows) {
  if (!rows.length) return "_None._";
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((value) => String(value ?? "")).join(" | ")} |`)
  ].join("\n");
}

const [html, authority, rendered] = await Promise.all([
  readFile(PATHS.html, "utf8"),
  readJson(PATHS.qfAuthorityJson),
  renderWorldCupPage()
]);

const errors = [];
const warnings = [];
const fixtures = authority.fixtures || [];
const requiredScriptOrder = [
  "worldCupData.js",
  "liveMatchdayStatusData.js",
  "r32FixtureAuthorityData.js",
  "r16FixtureAuthorityData.js",
  "qfFixtureAuthorityData.js",
  "sfFixtureAuthorityData.js",
  "worldCupPage.js"
];

for (let index = 0; index < requiredScriptOrder.length - 1; index += 1) {
  const current = html.indexOf(requiredScriptOrder[index]);
  const next = html.indexOf(requiredScriptOrder[index + 1]);
  if (current < 0 || next < 0 || current > next) {
    errors.push(`${requiredScriptOrder[index]} must load before ${requiredScriptOrder[index + 1]}.`);
  }
}

if (authority.status !== "pass") errors.push(`QF authority status is ${authority.status}.`);
if (fixtures.length !== 4) errors.push(`Expected 4 QF fixtures, found ${fixtures.length}.`);
if (!/completed R32, R16, and QF results/i.test(html)) errors.push("world-cup.html does not state that QF results remain visible.");
if (!/QF Fixture Authority/i.test(rendered.bracketText)) errors.push("Rendered bracket does not mention QF Fixture Authority.");

const fixtureChecks = fixtures.map((fixture) => {
  const teamsVisible = rendered.bracketText.includes(fixture.team_a?.team || "") && rendered.bracketText.includes(fixture.team_b?.team || "");
  const kickoffVisible = fixture.kickoff?.eastern_datetime_label ? rendered.bracketText.includes(fixture.kickoff.eastern_datetime_label) : false;
  const advancesVisible = fixture.winner_advances_to?.bracket_slot_id ? rendered.bracketText.includes(fixture.winner_advances_to.bracket_slot_id) : false;
  if (!teamsVisible) errors.push(`${fixture.bracket_slot_id} teams are not visible on rendered world-cup bracket.`);
  if (!kickoffVisible) errors.push(`${fixture.bracket_slot_id} kickoff time is not visible on rendered world-cup bracket.`);
  if (!advancesVisible) errors.push(`${fixture.bracket_slot_id} winner-advances-to slot is not visible on rendered world-cup bracket.`);
  return {
    slot: fixture.bracket_slot_id,
    fixture: `${fixture.team_a?.team} vs ${fixture.team_b?.team}`,
    kickoff: fixture.kickoff?.eastern_datetime_label || null,
    advances_to: fixture.winner_advances_to?.bracket_slot_id || null,
    teams_visible: teamsVisible,
    kickoff_visible: kickoffVisible,
    advances_visible: advancesVisible
  };
});

const consoleErrors = rendered.consoleMessages.filter((message) => message.type === "error");
if (consoleErrors.length) errors.push(`Rendered world-cup page produced ${consoleErrors.length} console errors.`);

const qa = {
  schema_version: "world_cup_qf_fixtures_page_qa_v1",
  generated_at: new Date().toISOString(),
  status: errors.length ? "fail" : "pass",
  summary: {
    qf_fixture_count: fixtures.length,
    rendered_console_errors: consoleErrors.length
  },
  fixture_checks: fixtureChecks,
  errors,
  warnings
};

const report = [
  "# World Cup QF Fixtures Page QA v1",
  "",
  `Generated: ${qa.generated_at}`,
  "",
  `Status: ${qa.status}`,
  "",
  mdTable(["Slot", "Fixture", "Kickoff", "Advances", "Teams", "Kickoff", "Advances"], fixtureChecks.map((row) => [
    row.slot,
    row.fixture,
    row.kickoff,
    row.advances_to,
    row.teams_visible ? "yes" : "no",
    row.kickoff_visible ? "yes" : "no",
    row.advances_visible ? "yes" : "no"
  ])),
  "",
  "## Errors",
  "",
  errors.length ? errors.map((error) => `- ${error}`).join("\n") : "None",
  ""
].join("\n");

await writeFile(PATHS.outputJson, `${JSON.stringify(qa, null, 2)}\n`, "utf8");
await writeFile(PATHS.outputReport, report, "utf8");

console.log(JSON.stringify({
  status: qa.status,
  qf_fixture_count: qa.summary.qf_fixture_count,
  errors
}, null, 2));

if (errors.length) process.exitCode = 1;
