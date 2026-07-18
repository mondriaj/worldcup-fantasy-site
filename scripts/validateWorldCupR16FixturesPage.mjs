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
  liveMatchdayJson: "data/liveMatchdayStatus_v1.json",
  r16AuthorityJson: "data/r16FixtureAuthority_v1.json",
  outputJson: "data/worldCupR16FixturesPageQa_v1.json",
  outputReport: "data/worldCupR16FixturesPageQaReport_v1.md"
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

function validLocalFixtureKey(value) {
  const key = String(value || "").trim();
  return /^fwc2026-m\d{3}$/i.test(key) ? key.toLowerCase() : "";
}

function liveFixtureKey(fixture) {
  return validLocalFixtureKey(fixture?.resolved_local_fixture_key || fixture?.local_fixture_id || fixture?.match_id);
}

function isMappedFixture(fixture) {
  return ["matched", "matched_reversed"].includes(String(fixture?.mapping_status || "").toLowerCase());
}

function isFinalScoreFixture(fixture) {
  return isMappedFixture(fixture) &&
    fixture?.safe_to_display_score === true &&
    fixture?.score_status === "final" &&
    ["complete", "completed", "played"].includes(String(fixture?.fixture_status || "").toLowerCase());
}

function expectedScoreText(fixture) {
  const home = fixture.home_abbr || fixture.home_team || "Home";
  const away = fixture.away_abbr || fixture.away_team || "Away";
  return `${home} ${fixture.home_score} - ${fixture.away_score} ${away}`;
}

function articleTextForSlot(renderedHtml, slot) {
  const pattern = new RegExp(`<article[^>]+data-bracket-slot="${slot}"[\\s\\S]*?<\\/article>`);
  return htmlToText((String(renderedHtml || "").match(pattern) || [])[0] || "");
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
    consoleMessages
  };
}

const [html, authority, liveMatchday, rendered] = await Promise.all([
  readFile(PATHS.html, "utf8"),
  readJson(PATHS.r16AuthorityJson),
  readJson(PATHS.liveMatchdayJson),
  renderWorldCupPage()
]);

const errors = [];
const fixtures = Array.isArray(authority.fixtures) ? authority.fixtures : [];
const liveFixtures = Array.isArray(liveMatchday.fixtures) ? liveMatchday.fixtures : [];
const liveFixturesByLocalId = new Map(liveFixtures.map((fixture) => [liveFixtureKey(fixture), fixture]).filter(([key]) => key));
const requiredScriptOrder = [
  "worldCupData.js",
  "liveMatchdayStatusData.js",
  "r32FixtureAuthorityData.js",
  "r16FixtureAuthorityData.js",
  "qfFixtureAuthorityData.js",
  "sfFixtureAuthorityData.js",
  "finalRoundFixtureAuthorityData.js",
  "worldCupPage.js"
];

for (let index = 0; index < requiredScriptOrder.length - 1; index += 1) {
  const current = html.indexOf(requiredScriptOrder[index]);
  const next = html.indexOf(requiredScriptOrder[index + 1]);
  if (current < 0 || next < 0 || current > next) {
    errors.push(`${requiredScriptOrder[index]} must load before ${requiredScriptOrder[index + 1]}.`);
  }
}

if (authority.status !== "pass") errors.push(`R16 authority status is ${authority.status}.`);
if (fixtures.length !== 8) errors.push(`Expected 8 R16 fixtures, found ${fixtures.length}.`);
if (!/completed R32, R16, QF, and SF results/i.test(html)) errors.push("world-cup.html does not state that R16 results remain visible.");
if (!/R16 Fixture Authority/i.test(rendered.bracketText)) errors.push("Rendered bracket does not mention R16 Fixture Authority.");

const fixtureChecks = fixtures.map((fixture) => {
  const slot = fixture.bracket_slot_id;
  const articleText = articleTextForSlot(rendered.bracketHtml, slot);
  const liveFixture = liveFixturesByLocalId.get(validLocalFixtureKey(fixture.fixture_id));
  const expectedScore = liveFixture ? expectedScoreText(liveFixture) : "";
  const advancesTo = typeof fixture.winner_advances_to === "string"
    ? fixture.winner_advances_to
    : fixture.winner_advances_to?.bracket_slot_id || "";
  const teamsVisible = [fixture.team_a?.team, fixture.team_b?.team].every((team) => team && articleText.includes(team));
  const kickoffVisible = fixture.kickoff?.eastern_datetime_label ? articleText.includes(fixture.kickoff.eastern_datetime_label) : false;
  const actualScoreVisible = Boolean(expectedScore && articleText.includes(expectedScore) && /Full time/i.test(articleText));
  const advancesVisible = advancesTo ? articleText.includes(advancesTo) : false;
  const noTbd = !/\bTBD\b/i.test(articleText);
  const liveFinal = Boolean(liveFixture && isFinalScoreFixture(liveFixture));

  if (!teamsVisible) errors.push(`${slot} teams are not visible on rendered world-cup bracket.`);
  if (!kickoffVisible) errors.push(`${slot} kickoff time is not visible on rendered world-cup bracket.`);
  if (!actualScoreVisible) errors.push(`${slot} actual final score is not visible on rendered world-cup bracket.`);
  if (!advancesVisible) errors.push(`${slot} winner-advances-to slot is not visible on rendered world-cup bracket.`);
  if (!noTbd) errors.push(`${slot} rendered R16 fixture still contains TBD.`);
  if (!liveFinal) errors.push(`${slot} live fixture is not mapped as a safe final R16 fixture.`);

  return {
    slot,
    fixture: `${fixture.team_a?.team} vs ${fixture.team_b?.team}`,
    expected_score: expectedScore,
    advances_to: advancesTo,
    teams_visible: teamsVisible,
    kickoff_visible: kickoffVisible,
    actual_score_visible: actualScoreVisible,
    advances_visible: advancesVisible,
    no_tbd: noTbd,
    live_final: liveFinal
  };
});

const consoleErrors = rendered.consoleMessages.filter((message) => message.type === "error");
if (consoleErrors.length) errors.push(`Rendered world-cup page produced ${consoleErrors.length} console errors.`);

const qa = {
  schema_version: "world_cup_r16_fixtures_page_qa_v1",
  generated_at: new Date().toISOString(),
  status: errors.length ? "fail" : "pass",
  summary: {
    r16_fixture_count: fixtures.length,
    r16_final_scores_visible: fixtureChecks.filter((row) => row.actual_score_visible).length,
    rendered_console_errors: consoleErrors.length
  },
  fixture_checks: fixtureChecks,
  errors
};

const report = [
  "# World Cup R16 Fixtures Page QA v1",
  "",
  `Generated: ${qa.generated_at}`,
  "",
  `Status: ${qa.status}`,
  "",
  mdTable(["Slot", "Fixture", "Score", "Advances", "Teams", "Kickoff", "Score", "No TBD", "Live final"], fixtureChecks.map((row) => [
    row.slot,
    row.fixture,
    row.expected_score,
    row.advances_to,
    row.teams_visible ? "yes" : "no",
    row.kickoff_visible ? "yes" : "no",
    row.actual_score_visible ? "yes" : "no",
    row.no_tbd ? "yes" : "no",
    row.live_final ? "yes" : "no"
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
  r16_fixture_count: qa.summary.r16_fixture_count,
  r16_final_scores_visible: qa.summary.r16_final_scores_visible,
  errors
}, null, 2));

if (errors.length) process.exitCode = 1;
