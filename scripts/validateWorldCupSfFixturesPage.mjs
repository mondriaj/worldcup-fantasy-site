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
  liveMatchdayJson: "data/liveMatchdayStatus_v1.json",
  sfAuthorityJson: "data/sfFixtureAuthority_v1.json",
  outputJson: "data/worldCupSfFixturesPageQa_v1.json",
  outputReport: "data/worldCupSfFixturesPageQaReport_v1.md"
};

const EXPECTED_SF_FIXTURES = new Map([
  ["M101", ["France", "Spain"]],
  ["M102", ["England", "Argentina"]]
]);
const QF_LOCAL_FIXTURE_IDS = ["fwc2026-m097", "fwc2026-m098", "fwc2026-m099", "fwc2026-m100"];

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

function expectedScoreText(fixture) {
  const home = fixture.home_abbr || fixture.home_team || "Home";
  const away = fixture.away_abbr || fixture.away_team || "Away";
  return `${home} ${fixture.home_score} - ${fixture.away_score} ${away}`;
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

const [html, authority, liveMatchday, rendered] = await Promise.all([
  readFile(PATHS.html, "utf8"),
  readJson(PATHS.sfAuthorityJson),
  readJson(PATHS.liveMatchdayJson),
  renderWorldCupPage()
]);

const errors = [];
const warnings = [];
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
  "worldCupPage.js"
];

for (let index = 0; index < requiredScriptOrder.length - 1; index += 1) {
  const current = html.indexOf(requiredScriptOrder[index]);
  const next = html.indexOf(requiredScriptOrder[index + 1]);
  if (current < 0 || next < 0 || current > next) {
    errors.push(`${requiredScriptOrder[index]} must load before ${requiredScriptOrder[index + 1]}.`);
  }
}

if (authority.status !== "pass") errors.push(`SF authority status is ${authority.status}.`);
if (fixtures.length !== 2) errors.push(`Expected 2 SF fixtures, found ${fixtures.length}.`);
if (!/completed R32, R16, QF, and SF results/i.test(html)) errors.push("world-cup.html does not state that SF results remain visible.");
if (!/SF Fixture Authority/i.test(rendered.bracketText)) errors.push("Rendered bracket does not mention SF Fixture Authority.");

const fixtureChecks = fixtures.map((fixture) => {
  const slot = fixture.bracket_slot_id;
  const expectedTeams = EXPECTED_SF_FIXTURES.get(slot) || [];
  const articleText = articleTextForSlot(rendered.bracketHtml, slot);
  const fixtureId = validLocalFixtureKey(fixture.fixture_id);
  const liveFixture = liveFixturesByLocalId.get(fixtureId);
  const teamsVisible = expectedTeams.every((team) => articleText.includes(team));
  const kickoffVisible = fixture.kickoff?.eastern_datetime_label ? articleText.includes(fixture.kickoff.eastern_datetime_label) : false;
  const actualScoreText = liveFixture ? expectedScoreText(liveFixture) : "";
  const actualFinalScoreVisible = Boolean(actualScoreText && articleText.includes(actualScoreText) && /Full time/i.test(articleText));
  const hasTbd = /\bTBD\b/i.test(articleText);
  const advancesVisible = fixture.winner_advances_to?.bracket_slot_id ? articleText.includes(fixture.winner_advances_to.bracket_slot_id) : false;
  const loserAdvancesVisible = fixture.loser_advances_to?.bracket_slot_id ? articleText.includes(fixture.loser_advances_to.bracket_slot_id) : false;
  const liveMappedFinal = Boolean(liveFixture && isFinalScoreFixture(liveFixture));

  if (!teamsVisible) errors.push(`${slot} expected teams are not visible on rendered world-cup bracket.`);
  if (!kickoffVisible) errors.push(`${slot} kickoff time is not visible on rendered world-cup bracket.`);
  if (!actualFinalScoreVisible) errors.push(`${slot} actual final score is not visible on rendered world-cup bracket.`);
  if (hasTbd) errors.push(`${slot} rendered SF fixture still contains TBD.`);
  if (!advancesVisible) errors.push(`${slot} winner-advances-to slot is not visible on rendered world-cup bracket.`);
  if (!loserAdvancesVisible) errors.push(`${slot} loser-advances-to slot is not visible on rendered world-cup bracket.`);
  if (!liveMappedFinal) errors.push(`${slot} live fixture is not mapped as a safe final SF fixture.`);

  return {
    slot,
    fixture: `${fixture.team_a?.team} vs ${fixture.team_b?.team}`,
    kickoff: fixture.kickoff?.eastern_datetime_label || null,
    live_fixture_status: liveFixture?.fixture_status || null,
    expected_score_text: actualScoreText,
    teams_visible: teamsVisible,
    kickoff_visible: kickoffVisible,
    actual_final_score_visible: actualFinalScoreVisible,
    no_tbd: !hasTbd,
    live_mapped_final: liveMappedFinal
  };
});

const qfScoreChecks = QF_LOCAL_FIXTURE_IDS.map((fixtureId) => {
  const fixture = liveFixturesByLocalId.get(fixtureId);
  const expected = fixture ? expectedScoreText(fixture) : "";
  const visible = Boolean(fixture && expected && rendered.bracketText.includes(expected));
  const safeFinal = isFinalScoreFixture(fixture);
  if (!fixture) errors.push(`QF live fixture ${fixtureId} is missing.`);
  if (fixture && !safeFinal) errors.push(`QF live fixture ${fixtureId} is not a safe final score fixture.`);
  if (fixture && !visible) errors.push(`QF live fixture ${fixtureId} final score is not visible in the rendered bracket.`);
  return {
    fixture_id: fixtureId,
    fixture: fixture ? `${fixture.local_home_team || fixture.home_team} vs ${fixture.local_away_team || fixture.away_team}` : null,
    expected_score_text: expected,
    visible,
    safe_final: safeFinal
  };
});

const consoleErrors = rendered.consoleMessages.filter((message) => message.type === "error");
if (consoleErrors.length) errors.push(`Rendered world-cup page produced ${consoleErrors.length} console errors.`);

const qa = {
  schema_version: "world_cup_sf_fixtures_page_qa_v1",
  generated_at: new Date().toISOString(),
  status: errors.length ? "fail" : "pass",
  summary: {
    sf_fixture_count: fixtures.length,
    qf_score_checks: qfScoreChecks.length,
    qf_scores_visible: qfScoreChecks.filter((row) => row.visible).length,
    rendered_console_errors: consoleErrors.length
  },
  fixture_checks: fixtureChecks,
  qf_score_checks: qfScoreChecks,
  bracket_note: rendered.bracketNote,
  errors,
  warnings
};

const report = [
  "# World Cup SF Fixtures Page QA v1",
  "",
  `Generated: ${qa.generated_at}`,
  "",
  `Status: ${qa.status}`,
  "",
  "## SF Fixtures",
  "",
  mdTable(["Slot", "Fixture", "Kickoff", "Status", "Score", "Teams", "Kickoff", "Final score", "No TBD", "Live final"], fixtureChecks.map((row) => [
    row.slot,
    row.fixture,
    row.kickoff,
    row.live_fixture_status,
    row.expected_score_text,
    row.teams_visible ? "yes" : "no",
    row.kickoff_visible ? "yes" : "no",
    row.actual_final_score_visible ? "yes" : "no",
    row.no_tbd ? "yes" : "no",
    row.live_mapped_final ? "yes" : "no"
  ])),
  "",
  "## QF Final Scores",
  "",
  mdTable(["Fixture", "Matchup", "Expected score", "Visible", "Safe final"], qfScoreChecks.map((row) => [
    row.fixture_id,
    row.fixture,
    row.expected_score_text,
    row.visible ? "yes" : "no",
    row.safe_final ? "yes" : "no"
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
  sf_fixture_count: qa.summary.sf_fixture_count,
  qf_scores_visible: qa.summary.qf_scores_visible,
  errors
}, null, 2));

if (errors.length) process.exitCode = 1;
