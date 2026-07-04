import { readFile, writeFile } from "node:fs/promises";
import vm from "node:vm";

const PATHS = {
  html: "world-cup.html",
  worldCupData: "worldCupData.js",
  liveMatchdayData: "liveMatchdayStatusData.js",
  pageScript: "worldCupPage.js",
  liveMatchdayJson: "data/liveMatchdayStatus_v1.json",
  liveFixtureQa: "data/liveFixtureMappingQa_v1.json",
  outputJson: "data/worldCupFixturesPageLiveScoresQa_v1.json",
  outputReport: "data/worldCupFixturesPageLiveScoresQaReport_v1.md"
};

const GENERATED_AT = new Date().toISOString();
const GROUP_STAGE_ROUND_IDS = new Set(["1", "2", "3"]);

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

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

function localFixtureIdFromMatchNumber(matchNumber) {
  const number = Number(matchNumber);
  return Number.isFinite(number) && number > 0 ? `fwc2026-m${String(number).padStart(3, "0")}` : "";
}

function validLocalFixtureKey(value) {
  const key = String(value || "").trim();
  return /^fwc2026-m\d{3}$/i.test(key) ? key.toLowerCase() : "";
}

function liveFixtureKey(fixture) {
  return validLocalFixtureKey(
    fixture?.resolved_local_fixture_key ||
    fixture?.local_fixture_id ||
    fixture?.match_id ||
    localFixtureIdFromMatchNumber(fixture?.match_number)
  );
}

function isGroupStageLiveFixture(fixture) {
  return GROUP_STAGE_ROUND_IDS.has(String(fixture?.round_id || "")) &&
    Boolean(liveFixtureKey(fixture));
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
  const elementIds = [
    "groups-grid",
    "fixtures-by-group",
    "bracket-rounds",
    "bracket-note",
    "world-cup-sources",
    "source-checked-date"
  ];

  for (const id of elementIds) {
    elements.set(id, {
      id,
      innerHTML: "",
      textContent: ""
    });
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

  for (const filePath of [PATHS.worldCupData, PATHS.liveMatchdayData, PATHS.pageScript]) {
    const source = await readFile(filePath, "utf8");
    vm.runInNewContext(source, sandbox, { filename: filePath });
  }

  return {
    worldCupData: sandbox.window.WORLD_CUP_DATA,
    liveData: sandbox.window.LIVE_MATCHDAY_STATUS_DATA,
    fixturesHtml: elements.get("fixtures-by-group")?.innerHTML || "",
    fixturesText: htmlToText(elements.get("fixtures-by-group")?.innerHTML || ""),
    consoleMessages
  };
}

function fixtureRowsFromHtml(fixturesHtml) {
  return Array.from(String(fixturesHtml || "").matchAll(/<article class="fixture-row">([\s\S]*?)<\/article>/g))
    .map((match) => ({
      html: match[0],
      text: htmlToText(match[0]),
      match_number: Number((match[0].match(/Match\s+(\d+)/) || [])[1])
    }))
    .filter((row) => Number.isFinite(row.match_number));
}

function expectedScoreText(fixture) {
  const home = fixture.home_abbr || fixture.home_team || "Home";
  const away = fixture.away_abbr || fixture.away_team || "Away";
  return `${home} ${fixture.home_score} - ${fixture.away_score} ${away}`;
}

function isFinalFixture(fixture) {
  return ["complete", "completed", "played"].includes(String(fixture?.fixture_status || "").toLowerCase()) &&
    fixture.safe_to_display_score === true;
}

function isPlayingFixture(fixture) {
  return String(fixture?.fixture_status || "").toLowerCase() === "playing";
}

function isScheduledFixture(fixture) {
  return String(fixture?.fixture_status || "").toLowerCase() === "scheduled";
}

function buildReport(qa) {
  return [
    "# World Cup Fixtures Page Live Scores QA v1",
    "",
    `Generated: ${qa.generated_at}`,
    "",
    `Status: ${qa.status}`,
    "",
    "## Summary",
    "",
    mdTable(
      ["Metric", "Value"],
      [
        ["World Cup fixtures", qa.summary.world_cup_fixture_count],
        ["Rendered fixture rows", qa.summary.rendered_fixture_rows],
        ["Live fixtures", qa.summary.live_fixture_count],
        ["Group-stage live fixtures", qa.summary.group_stage_live_fixture_count],
        ["Extra non-group live fixtures", qa.summary.extra_live_fixture_count],
        ["Completed MD1 fixtures visible", `${qa.summary.completed_md1_final_scores_visible} / ${qa.summary.completed_md1_fixture_count}`],
        ["Completed MD2 fixtures visible", `${qa.summary.completed_md2_final_scores_visible} / ${qa.summary.completed_md2_fixture_count}`],
        ["Completed MD3 fixtures visible", `${qa.summary.completed_md3_final_scores_visible} / ${qa.summary.completed_md3_fixture_count}`],
        ["Playing MD3 fixtures marked live", `${qa.summary.playing_md3_fixtures_marked_live} / ${qa.summary.playing_md3_fixture_count}`],
        ["Scheduled fixtures marked scheduled", `${qa.summary.scheduled_fixtures_marked_scheduled} / ${qa.summary.scheduled_fixture_count}`],
        ["Unsafe final score leaks", qa.summary.unsafe_score_leak_count],
        ["Duplicate fixture rows", qa.summary.duplicate_rendered_fixture_count],
        ["Reversed score/team errors", qa.summary.reversed_score_error_count],
        ["Console/page errors", qa.summary.console_error_count]
      ]
    ),
    "",
    "## Completed MD3 Scores Checked",
    "",
    mdTable(
      ["Match", "Fixture", "Score", "Visible"],
      qa.completed_md3_score_checks.map((row) => [
        row.match_number,
        row.fixture,
        row.expected_score_text,
        row.visible ? "yes" : "no"
      ])
    ),
    "",
    "## Playing Fixture Checks",
    "",
    mdTable(
      ["Match", "Fixture", "Status", "Marked Live", "Shown As Final"],
      qa.playing_fixture_checks.map((row) => [
        row.match_number,
        row.fixture,
        row.status_label,
        row.marked_live ? "yes" : "no",
        row.shown_as_final ? "yes" : "no"
      ])
    ),
    "",
    "## Errors",
    "",
    qa.errors.length ? qa.errors.map((error) => `- ${error}`).join("\n") : "None",
    "",
    "## Warnings",
    "",
    qa.warnings.length ? qa.warnings.map((warning) => `- ${warning}`).join("\n") : "None",
    ""
  ].join("\n");
}

const [html, liveMatchday, liveFixtureQa, rendered] = await Promise.all([
  readFile(PATHS.html, "utf8"),
  readJson(PATHS.liveMatchdayJson),
  readJson(PATHS.liveFixtureQa),
  renderWorldCupPage()
]);

const worldCupFixtures = (rendered.worldCupData?.fixtures || []).filter((fixture) => fixture.stage === "group");
const liveFixtures = liveMatchday.fixtures || [];
const groupStageLiveFixtures = liveFixtures.filter(isGroupStageLiveFixture);
const extraLiveFixtures = liveFixtures.filter((fixture) => !isGroupStageLiveFixture(fixture));
const renderedRows = fixtureRowsFromHtml(rendered.fixturesHtml);
const renderedRowsByMatch = new Map(renderedRows.map((row) => [Number(row.match_number), row]));
const worldCupByMatch = new Map(worldCupFixtures.map((fixture) => [Number(fixture.match_number), fixture]));
const renderedMatchNumbers = renderedRows.map((row) => row.match_number);
const duplicateRenderedMatches = [...new Set(renderedMatchNumbers.filter((matchNumber, index) => renderedMatchNumbers.indexOf(matchNumber) !== index))];
const liveBeforePageScript = html.indexOf("liveMatchdayStatusData.js") >= 0 &&
  html.indexOf("worldCupPage.js") >= 0 &&
  html.indexOf("liveMatchdayStatusData.js") < html.indexOf("worldCupPage.js");

const errors = [];
const warnings = [];

if (!liveBeforePageScript) errors.push("world-cup.html must load liveMatchdayStatusData.js before worldCupPage.js.");
if (worldCupFixtures.length !== 72) errors.push(`Expected 72 worldCupData group fixtures, found ${worldCupFixtures.length}.`);
if (renderedRows.length !== 72) errors.push(`Expected 72 rendered fixture rows, found ${renderedRows.length}.`);
if (duplicateRenderedMatches.length) errors.push(`Duplicate rendered match rows: ${duplicateRenderedMatches.join(", ")}.`);
if (liveFixtureQa.status !== "passed") errors.push(`Live fixture mapping QA status is ${liveFixtureQa.status}.`);
if (liveFixtureQa.summary?.matched_fixtures !== 96) errors.push(`Expected 96 matched live fixtures, found ${liveFixtureQa.summary?.matched_fixtures}.`);
if ((liveFixtureQa.summary?.unsafe_fixture_player_point_leak_count || 0) !== 0) {
  errors.push(`Live fixture QA reports ${liveFixtureQa.summary.unsafe_fixture_player_point_leak_count} unsafe fixture/player point leaks.`);
}

const mappingErrors = [];
for (const liveFixture of groupStageLiveFixtures) {
  const matchNumber = Number(liveFixture.match_number);
  const staticFixture = worldCupByMatch.get(matchNumber);
  if (!staticFixture) {
    mappingErrors.push(`Live match ${matchNumber} missing from worldCupData.`);
    continue;
  }

  const expectedLocalId = localFixtureIdFromMatchNumber(matchNumber);
  if (liveFixture.local_fixture_id !== expectedLocalId) {
    mappingErrors.push(`Live match ${matchNumber} local fixture id ${liveFixture.local_fixture_id} does not match ${expectedLocalId}.`);
  }

  const liveHome = normalizeText(liveFixture.local_home_team || liveFixture.home_team);
  const liveAway = normalizeText(liveFixture.local_away_team || liveFixture.away_team);
  const staticHome = normalizeText(staticFixture.team_1);
  const staticAway = normalizeText(staticFixture.team_2);
  if (liveHome !== staticHome || liveAway !== staticAway) {
    mappingErrors.push(`Live match ${matchNumber} team mapping mismatch: ${liveFixture.local_home_team} vs ${liveFixture.local_away_team} / ${staticFixture.team_1} vs ${staticFixture.team_2}.`);
  }
}
if (mappingErrors.length) errors.push(...mappingErrors.slice(0, 20));
if (mappingErrors.length > 20) warnings.push(`${mappingErrors.length - 20} additional mapping errors omitted from report.`);

const finalFixtures = groupStageLiveFixtures.filter(isFinalFixture);
const completedMd1Fixtures = finalFixtures.filter((fixture) => fixture.round_id === "1");
const completedMd2Fixtures = finalFixtures.filter((fixture) => fixture.round_id === "2");
const completedMd3Fixtures = finalFixtures.filter((fixture) => fixture.round_id === "3");
const playingMd3Fixtures = groupStageLiveFixtures.filter((fixture) => fixture.round_id === "3" && isPlayingFixture(fixture));
const scheduledFixtures = groupStageLiveFixtures.filter(isScheduledFixture);
const finalScoreChecks = finalFixtures.map((fixture) => {
  const row = renderedRowsByMatch.get(Number(fixture.match_number));
  const expected = expectedScoreText(fixture);
  const visible = Boolean(row?.text.includes("Actual:") && row.text.includes(expected) && row.text.includes("Full time"));
  const reversed = Boolean(row?.text.includes(`${fixture.away_abbr || fixture.away_team} ${fixture.away_score} - ${fixture.home_score} ${fixture.home_abbr || fixture.home_team}`));
  return {
    match_number: Number(fixture.match_number),
    fixture: `${fixture.local_home_team} vs ${fixture.local_away_team}`,
    round_id: fixture.round_id,
    expected_score_text: expected,
    visible,
    reversed
  };
});

const playingFixtureChecks = playingMd3Fixtures.map((fixture) => {
  const row = renderedRowsByMatch.get(Number(fixture.match_number));
  return {
    match_number: Number(fixture.match_number),
    fixture: `${fixture.local_home_team} vs ${fixture.local_away_team}`,
    status_label: "Live",
    marked_live: Boolean(row?.text.includes("Live:") && row.text.includes("score hidden until final")),
    shown_as_final: Boolean(row?.text.includes("Actual:"))
  };
});

const scheduledChecks = scheduledFixtures.map((fixture) => {
  const row = renderedRowsByMatch.get(Number(fixture.match_number));
  return {
    match_number: Number(fixture.match_number),
    fixture: `${fixture.local_home_team} vs ${fixture.local_away_team}`,
    marked_scheduled: Boolean(row?.text.includes("Status: Scheduled")),
    shown_as_final: Boolean(row?.text.includes("Actual:"))
  };
});

const unsafeScoreLeaks = groupStageLiveFixtures
  .filter((fixture) => !isFinalFixture(fixture))
  .flatMap((fixture) => {
    const row = renderedRowsByMatch.get(Number(fixture.match_number));
    if (!row) return [`Match ${fixture.match_number} did not render.`];
    const leaks = [];
    if (row.text.includes("Actual:")) leaks.push(`Match ${fixture.match_number} is non-final but rendered Actual.`);
    if (fixture.home_score !== null && fixture.home_score !== undefined && fixture.away_score !== null && fixture.away_score !== undefined) {
      const hiddenScore = expectedScoreText(fixture);
      if (row.text.includes(hiddenScore)) leaks.push(`Match ${fixture.match_number} is non-final but rendered score ${hiddenScore}.`);
    }
    return leaks;
  });

const missingFinalScores = finalScoreChecks.filter((row) => !row.visible);
const reversedScoreErrors = finalScoreChecks.filter((row) => row.reversed);
const unmarkedPlaying = playingFixtureChecks.filter((row) => !row.marked_live);
const playingShownFinal = playingFixtureChecks.filter((row) => row.shown_as_final);
const unmarkedScheduled = scheduledChecks.filter((row) => !row.marked_scheduled);
const scheduledShownFinal = scheduledChecks.filter((row) => row.shown_as_final);
const consoleErrors = rendered.consoleMessages.filter((message) => message.type === "error");

if (missingFinalScores.length) errors.push(`Missing visible final scores for matches: ${missingFinalScores.map((row) => row.match_number).join(", ")}.`);
if (reversedScoreErrors.length) errors.push(`Possible reversed score text for matches: ${reversedScoreErrors.map((row) => row.match_number).join(", ")}.`);
if (unmarkedPlaying.length) errors.push(`Playing fixtures not marked live: ${unmarkedPlaying.map((row) => row.match_number).join(", ")}.`);
if (playingShownFinal.length) errors.push(`Playing fixtures shown as final: ${playingShownFinal.map((row) => row.match_number).join(", ")}.`);
if (unmarkedScheduled.length) errors.push(`Scheduled fixtures not marked scheduled: ${unmarkedScheduled.slice(0, 20).map((row) => row.match_number).join(", ")}${unmarkedScheduled.length > 20 ? "..." : ""}.`);
if (scheduledShownFinal.length) errors.push(`Scheduled fixtures shown as final: ${scheduledShownFinal.map((row) => row.match_number).join(", ")}.`);
if (unsafeScoreLeaks.length) errors.push(...unsafeScoreLeaks.slice(0, 20));
if (unsafeScoreLeaks.length > 20) warnings.push(`${unsafeScoreLeaks.length - 20} additional unsafe score leak examples omitted from report.`);
if (consoleErrors.length) errors.push(`Rendered page emitted ${consoleErrors.length} console errors.`);

const qa = {
  schema_version: "world_cup_fixtures_page_live_scores_qa_v1",
  generated_at: GENERATED_AT,
  status: errors.length ? "failed" : "passed",
  files: PATHS,
  summary: {
    world_cup_fixture_count: worldCupFixtures.length,
    rendered_fixture_rows: renderedRows.length,
    live_fixture_count: liveFixtures.length,
    group_stage_live_fixture_count: groupStageLiveFixtures.length,
    extra_live_fixture_count: extraLiveFixtures.length,
    completed_md1_fixture_count: completedMd1Fixtures.length,
    completed_md1_final_scores_visible: finalScoreChecks.filter((row) => row.round_id === "1" && row.visible).length,
    completed_md2_fixture_count: completedMd2Fixtures.length,
    completed_md2_final_scores_visible: finalScoreChecks.filter((row) => row.round_id === "2" && row.visible).length,
    completed_md3_fixture_count: completedMd3Fixtures.length,
    completed_md3_final_scores_visible: finalScoreChecks.filter((row) => row.round_id === "3" && row.visible).length,
    playing_md3_fixture_count: playingMd3Fixtures.length,
    playing_md3_fixtures_marked_live: playingFixtureChecks.filter((row) => row.marked_live).length,
    scheduled_fixture_count: scheduledFixtures.length,
    scheduled_fixtures_marked_scheduled: scheduledChecks.filter((row) => row.marked_scheduled).length,
    unsafe_score_leak_count: unsafeScoreLeaks.length + playingShownFinal.length + scheduledShownFinal.length,
    duplicate_rendered_fixture_count: duplicateRenderedMatches.length,
    reversed_score_error_count: reversedScoreErrors.length,
    console_error_count: consoleErrors.length,
    live_script_loaded_before_page_script: liveBeforePageScript
  },
  completed_md2_score_checks: finalScoreChecks.filter((row) => row.round_id === "2"),
  completed_md3_score_checks: finalScoreChecks.filter((row) => row.round_id === "3"),
  playing_fixture_checks: playingFixtureChecks,
  scheduled_fixture_sample: scheduledChecks.slice(0, 20),
  extra_live_fixtures_sample: extraLiveFixtures.slice(0, 10).map((fixture) => ({
    source_fixture_id: fixture.source_fixture_id,
    round_id: fixture.round_id,
    round_stage: fixture.round_stage,
    fixture_status: fixture.fixture_status,
    score_status: fixture.score_status,
    teams: `${fixture.live_home_team || fixture.home_team} vs ${fixture.live_away_team || fixture.away_team}`,
    safe_to_display_score: fixture.safe_to_display_score
  })),
  errors,
  warnings,
  console_messages: rendered.consoleMessages
};

await writeFile(PATHS.outputJson, `${JSON.stringify(qa, null, 2)}\n`, "utf8");
await writeFile(PATHS.outputReport, buildReport(qa), "utf8");

console.log(JSON.stringify({
  status: qa.status,
  output_json: PATHS.outputJson,
  output_report: PATHS.outputReport,
  completed_md1_final_scores_visible: `${qa.summary.completed_md1_final_scores_visible}/${qa.summary.completed_md1_fixture_count}`,
  completed_md2_final_scores_visible: `${qa.summary.completed_md2_final_scores_visible}/${qa.summary.completed_md2_fixture_count}`,
  completed_md3_final_scores_visible: `${qa.summary.completed_md3_final_scores_visible}/${qa.summary.completed_md3_fixture_count}`,
  playing_md3_fixtures_marked_live: `${qa.summary.playing_md3_fixtures_marked_live}/${qa.summary.playing_md3_fixture_count}`,
  scheduled_fixtures_marked_scheduled: `${qa.summary.scheduled_fixtures_marked_scheduled}/${qa.summary.scheduled_fixture_count}`,
  unsafe_score_leak_count: qa.summary.unsafe_score_leak_count
}, null, 2));

if (qa.status !== "passed") {
  process.exitCode = 1;
}
