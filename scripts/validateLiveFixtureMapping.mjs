import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const CHECKED_AT = new Date().toISOString();

const FILES = {
  localFixtures: "data/fixtures.json",
  liveMatchday: "data/liveMatchdayStatus_v1.json",
  livePlayers: "data/livePlayerStatus_v1.json",
  scorePredictions: "data/scorePredictions_fantasyPool_v3.json",
  script: "script.js",
  worldCupPage: "worldCupPage.js",
  qaJson: "data/liveFixtureMappingQa_v1.json",
  qaReport: "data/liveFixtureMappingQaReport_v1.md"
};

const FINAL_FIXTURE_STATUS_VALUES = new Set(["complete", "played", "completed"]);
const SAFE_MAPPING_STATUS_VALUES = new Set(["matched", "matched_reversed"]);
const TEAM_NAME_ALIASES = new Map([
  ["south korea", "korea republic"],
  ["republic of korea", "korea republic"],
  ["czech republic", "czechia"],
  ["turkey", "turkiye"],
  ["turkiye", "turkiye"],
  ["ivory coast", "cote d ivoire"],
  ["cote divoire", "cote d ivoire"],
  ["cote d ivoire", "cote d ivoire"],
  ["iran", "ir iran"],
  ["iran islamic republic of", "ir iran"],
  ["cape verde", "cabo verde"],
  ["dr congo", "congo dr"],
  ["democratic republic of the congo", "congo dr"],
  ["congo democratic republic", "congo dr"],
  ["us", "usa"],
  ["united states", "usa"],
  ["united states of america", "usa"]
]);

function hasValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function canonicalTeamKey(value) {
  const normalized = normalizeText(value);
  return TEAM_NAME_ALIASES.get(normalized) || normalized;
}

function rowsFromJson(data, keys) {
  if (Array.isArray(data)) return data;
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
}

async function readText(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

function fixtureIsFinal(status) {
  return FINAL_FIXTURE_STATUS_VALUES.has(String(status || "").toLowerCase());
}

function scoreIsShown(fixture) {
  return fixture?.home_score !== null &&
    fixture?.home_score !== undefined &&
    fixture?.away_score !== null &&
    fixture?.away_score !== undefined;
}

function scorerDataIsShown(fixture) {
  return Boolean(fixture?.home_goal_scorers_assists?.length || fixture?.away_goal_scorers_assists?.length);
}

function safeFinalScoreIsShown(fixture) {
  return scoreIsShown(fixture) &&
    fixture.safe_to_display_score === true &&
    fixture.score_status === "final" &&
    SAFE_MAPPING_STATUS_VALUES.has(String(fixture.mapping_status || "").toLowerCase()) &&
    fixtureIsFinal(fixture.fixture_status);
}

function localFixtureIdFromMatchNumber(matchNumber) {
  const number = Number(matchNumber);
  return Number.isFinite(number) && number > 0 ? `fwc2026-m${String(number).padStart(3, "0")}` : "";
}

function countBy(rows, keyFn) {
  return rows.reduce((counts, row) => {
    const key = keyFn(row);
    const label = hasValue(key) ? String(key) : "none";
    counts[label] = (counts[label] || 0) + 1;
    return counts;
  }, {});
}

function scoreText(fixture) {
  return scoreIsShown(fixture) ? `${fixture.home_score}-${fixture.away_score}` : "none";
}

function sameLocalTeamPair(fixture, localFixture) {
  const liveHome = canonicalTeamKey(fixture.local_home_team || fixture.home_team);
  const liveAway = canonicalTeamKey(fixture.local_away_team || fixture.away_team);
  const localHome = canonicalTeamKey(localFixture.home_team || localFixture.team_1);
  const localAway = canonicalTeamKey(localFixture.away_team || localFixture.team_2);
  return Boolean(liveHome && liveAway && localHome && localAway && liveHome === localHome && liveAway === localAway);
}

function samePredictionTeamPair(fixture, prediction) {
  const liveHome = canonicalTeamKey(fixture.local_home_team || fixture.home_team);
  const liveAway = canonicalTeamKey(fixture.local_away_team || fixture.away_team);
  const predictionHome = canonicalTeamKey(prediction.home_team);
  const predictionAway = canonicalTeamKey(prediction.away_team);
  return Boolean(liveHome && liveAway && predictionHome && predictionAway && liveHome === predictionHome && liveAway === predictionAway);
}

function functionBlock(source, name) {
  const start = source.indexOf(`function ${name}`);
  if (start < 0) return "";

  const open = source.indexOf("{", start);
  if (open < 0) return "";

  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(start, index + 1);
      }
    }
  }

  return "";
}

function mdList(items, fallback = "None") {
  if (!items?.length) return fallback;
  return items.map((item) => String(item).startsWith("- ") ? item : `- ${item}`).join("\n");
}

function sourceLookupChecks(scriptText, worldCupPageText) {
  const rawFixtureIdPattern = /source_fixture_id|source_fixture_order|(^|[^a-zA-Z0-9_])fixture_id([^a-zA-Z0-9_]|$)/;
  const checks = {
    script_uses_live_data_global: scriptText.includes("LIVE_MATCHDAY_STATUS_DATA"),
    world_cup_uses_live_data_global: worldCupPageText.includes("LIVE_MATCHDAY_STATUS_DATA"),
    script_has_safe_mapping_guard: scriptText.includes("isSafeMappedFinalFixture") && scriptText.includes("liveFixtureMatchesScorePrediction"),
    world_cup_has_safe_mapping_guard: worldCupPageText.includes("isSafeMappedFinalFixture") && worldCupPageText.includes("liveFixtureMatchesLocalFixture"),
    script_lookup_block_uses_raw_source_id: rawFixtureIdPattern.test(functionBlock(scriptText, "liveFixtureLookupKeys")),
    world_cup_lookup_block_uses_raw_source_id: rawFixtureIdPattern.test(functionBlock(worldCupPageText, "liveFixtureLookupKeys")),
    script_uses_source_fixture_metadata: /source_fixture_id|source_fixture_order/.test(scriptText),
    world_cup_uses_source_fixture_metadata: /source_fixture_id|source_fixture_order/.test(worldCupPageText)
  };
  checks.passed = checks.script_uses_live_data_global &&
    checks.world_cup_uses_live_data_global &&
    checks.script_has_safe_mapping_guard &&
    checks.world_cup_has_safe_mapping_guard &&
    !checks.script_lookup_block_uses_raw_source_id &&
    !checks.world_cup_lookup_block_uses_raw_source_id &&
    !checks.script_uses_source_fixture_metadata &&
    !checks.world_cup_uses_source_fixture_metadata;
  return checks;
}

function manualExampleStatus({ fixturesByLocalId, scorePredictionsByFixtureId }) {
  const examples = [];
  const spain = fixturesByLocalId.get("fwc2026-m014");
  const saudiUruguay = fixturesByLocalId.get("fwc2026-m013");
  const iranNz = fixturesByLocalId.get("fwc2026-m015");

  examples.push({
    case_id: "spain_cabo_verde",
    expected_local_fixture_id: "fwc2026-m014",
    expected_match_number: 14,
    passed: Boolean(spain &&
      Number(spain.match_number) === 14 &&
      canonicalTeamKey(spain.local_home_team || spain.home_team) === "spain" &&
      canonicalTeamKey(spain.local_away_team || spain.away_team) === "cabo verde" &&
      samePredictionTeamPair(spain, scorePredictionsByFixtureId.get("fwc2026-m014"))),
    observed: spain ? {
      source_fixture_id: spain.source_fixture_id,
      mapping_status: spain.mapping_status,
      mapping_orientation: spain.mapping_orientation,
      fixture_status: spain.fixture_status,
      score_status: spain.score_status,
      score: scoreText(spain),
      teams: `${spain.local_home_team || spain.home_team} vs ${spain.local_away_team || spain.away_team}`
    } : null
  });

  examples.push({
    case_id: "saudi_arabia_uruguay",
    expected_local_fixture_id: "fwc2026-m013",
    expected_match_number: 13,
    passed: Boolean(saudiUruguay &&
      Number(saudiUruguay.match_number) === 13 &&
      canonicalTeamKey(saudiUruguay.local_home_team || saudiUruguay.home_team) === "saudi arabia" &&
      canonicalTeamKey(saudiUruguay.local_away_team || saudiUruguay.away_team) === "uruguay" &&
      (fixtureIsFinal(saudiUruguay.fixture_status) || !scoreIsShown(saudiUruguay))),
    observed: saudiUruguay ? {
      source_fixture_id: saudiUruguay.source_fixture_id,
      mapping_status: saudiUruguay.mapping_status,
      mapping_orientation: saudiUruguay.mapping_orientation,
      fixture_status: saudiUruguay.fixture_status,
      score_status: saudiUruguay.score_status,
      score: scoreText(saudiUruguay),
      teams: `${saudiUruguay.local_home_team || saudiUruguay.home_team} vs ${saudiUruguay.local_away_team || saudiUruguay.away_team}`
    } : null
  });

  examples.push({
    case_id: "ir_iran_new_zealand",
    expected_local_fixture_id: "fwc2026-m015",
    expected_match_number: 15,
    passed: Boolean(iranNz &&
      Number(iranNz.match_number) === 15 &&
      canonicalTeamKey(iranNz.local_home_team || iranNz.home_team) === "ir iran" &&
      canonicalTeamKey(iranNz.local_away_team || iranNz.away_team) === "new zealand" &&
      !(scoreIsShown(iranNz) && canonicalTeamKey(iranNz.local_home_team || iranNz.home_team) === "spain")),
    observed: iranNz ? {
      source_fixture_id: iranNz.source_fixture_id,
      mapping_status: iranNz.mapping_status,
      mapping_orientation: iranNz.mapping_orientation,
      fixture_status: iranNz.fixture_status,
      score_status: iranNz.score_status,
      score: scoreText(iranNz),
      teams: `${iranNz.local_home_team || iranNz.home_team} vs ${iranNz.local_away_team || iranNz.away_team}`
    } : null
  });

  return examples;
}

function reportMarkdown(qa) {
  const statusLines = Object.entries(qa.summary.mapping_status_counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([status, count]) => `- ${status}: ${count}`);
  const orientationLines = Object.entries(qa.summary.mapping_orientation_counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([status, count]) => `- ${status}: ${count}`);
  const examples = qa.manual_examples.map((example) => {
    const observed = example.observed
      ? `${example.observed.teams}, source ${example.observed.source_fixture_id}, ${example.observed.fixture_status}, ${example.observed.score_status}, score ${example.observed.score}`
      : "not found";
    return `- ${example.case_id}: ${example.passed ? "passed" : "failed"} (${observed})`;
  });

  return `# Live Fixture Mapping QA v1

Generated: ${qa.generated_at}

Status: ${qa.status}

## Summary

- Total local fixtures: ${qa.summary.total_local_fixtures}
- Total live fixtures: ${qa.summary.total_live_fixtures}
- Total score-prediction fixtures: ${qa.summary.total_score_prediction_fixtures}
- Matched fixtures: ${qa.summary.matched_fixtures}
- Final fixtures shown: ${qa.summary.final_fixtures_shown}
- In-progress fixtures suppressed: ${qa.summary.in_progress_fixtures_suppressed}
- Scheduled fixtures: ${qa.summary.scheduled_fixtures}
- Unmatched fixtures: ${qa.summary.unmatched_fixtures}
- Ambiguous fixtures: ${qa.summary.ambiguous_fixtures}
- Reversed mappings: ${qa.summary.reversed_mappings}

Mapping status counts:

${mdList(statusLines)}

Mapping orientation counts:

${mdList(orientationLines)}

## Regression Examples

${mdList(examples)}

## Browser Lookup Checks

- script.js uses live data global: ${qa.browser_lookup_checks.script_uses_live_data_global ? "yes" : "no"}
- worldCupPage.js uses live data global: ${qa.browser_lookup_checks.world_cup_uses_live_data_global ? "yes" : "no"}
- script.js has safe mapping guard: ${qa.browser_lookup_checks.script_has_safe_mapping_guard ? "yes" : "no"}
- worldCupPage.js has safe mapping guard: ${qa.browser_lookup_checks.world_cup_has_safe_mapping_guard ? "yes" : "no"}
- script.js live lookup avoids raw source ids: ${qa.browser_lookup_checks.script_lookup_block_uses_raw_source_id ? "no" : "yes"}
- worldCupPage.js live lookup avoids raw source ids: ${qa.browser_lookup_checks.world_cup_lookup_block_uses_raw_source_id ? "no" : "yes"}

## Errors

${mdList(qa.errors)}

## Warnings

${mdList(qa.warnings)}

## Manual Spot Checks

${mdList(qa.manual_spot_checks)}
`;
}

async function main() {
  const [
    localFixturesData,
    liveMatchdayData,
    livePlayerData,
    scorePredictionData,
    scriptText,
    worldCupPageText
  ] = await Promise.all([
    readJson(FILES.localFixtures),
    readJson(FILES.liveMatchday),
    readJson(FILES.livePlayers),
    readJson(FILES.scorePredictions),
    readText(FILES.script),
    readText(FILES.worldCupPage)
  ]);

  const localFixtures = rowsFromJson(localFixturesData, ["fixtures"]);
  const liveFixtures = rowsFromJson(liveMatchdayData, ["fixtures"]);
  const livePlayers = rowsFromJson(livePlayerData, ["players"]);
  const scorePredictions = rowsFromJson(scorePredictionData, ["fixtureScorePredictions"]);
  const localFixturesById = new Map(localFixtures.map((fixture) => [fixture.match_id || localFixtureIdFromMatchNumber(fixture.match_number), fixture]));
  const liveFixturesByLocalId = new Map(liveFixtures.filter((fixture) => fixture.local_fixture_id).map((fixture) => [fixture.local_fixture_id, fixture]));
  const scorePredictionsByFixtureId = new Map(scorePredictions.map((row) => [row.fixture_id || row.match_id, row]));
  const errors = [];
  const warnings = [];
  const finalScoreLocalIds = new Map();
  const inProgressSuppressed = [];
  const unsafeFixturePointLeaks = [];
  const browserChecks = sourceLookupChecks(scriptText, worldCupPageText);

  if (localFixtures.length !== 72) {
    errors.push(`Expected 72 local fixtures, found ${localFixtures.length}`);
  }

  if (liveFixtures.length !== 72) {
    errors.push(`Expected 72 live fixtures, found ${liveFixtures.length}`);
  }

  if (scorePredictions.length !== 72) {
    errors.push(`Expected 72 score prediction fixtures, found ${scorePredictions.length}`);
  }

  if (liveFixtures.some((fixture) => Object.prototype.hasOwnProperty.call(fixture, "fixture_id"))) {
    errors.push("Live fixture rows still expose raw fixture_id; use source_fixture_id for audit-only metadata");
  }

  if (!browserChecks.passed) {
    errors.push("Browser live fixture lookup checks failed; see browser_lookup_checks");
  }

  liveFixtures.forEach((fixture) => {
    const localFixture = fixture.local_fixture_id ? localFixturesById.get(fixture.local_fixture_id) : null;
    const prediction = fixture.local_fixture_id ? scorePredictionsByFixtureId.get(fixture.local_fixture_id) : null;
    const mappingStatus = String(fixture.mapping_status || "").toLowerCase();
    const nonFinal = !fixtureIsFinal(fixture.fixture_status);

    if (SAFE_MAPPING_STATUS_VALUES.has(mappingStatus)) {
      if (!localFixture) {
        errors.push(`Mapped live fixture ${fixture.source_fixture_id || "unknown"} has no matching local fixture ${fixture.local_fixture_id || "none"}`);
      } else if (!sameLocalTeamPair(fixture, localFixture)) {
        errors.push(`Mapped live fixture ${fixture.source_fixture_id || "unknown"} team pair does not match local fixture ${fixture.local_fixture_id}`);
      }

      if (!prediction) {
        errors.push(`Mapped live fixture ${fixture.local_fixture_id || fixture.source_fixture_id || "unknown"} has no score-prediction row`);
      } else if (!samePredictionTeamPair(fixture, prediction)) {
        errors.push(`Mapped live fixture ${fixture.local_fixture_id || fixture.source_fixture_id || "unknown"} team pair does not match score prediction`);
      }
    }

    if (scoreIsShown(fixture)) {
      if (!safeFinalScoreIsShown(fixture)) {
        errors.push(`Fixture ${fixture.local_fixture_id || fixture.source_fixture_id || "unknown"} exposes a score without safe final mapping`);
      }

      const localId = fixture.local_fixture_id || "none";
      finalScoreLocalIds.set(localId, (finalScoreLocalIds.get(localId) || 0) + 1);
    }

    if (nonFinal && (scoreIsShown(fixture) || scorerDataIsShown(fixture))) {
      errors.push(`Non-final fixture ${fixture.local_fixture_id || fixture.source_fixture_id || "unknown"} exposes score or scorer data`);
    }

    if (String(fixture.fixture_status || "").toLowerCase() === "playing" && !scoreIsShown(fixture) && !scorerDataIsShown(fixture)) {
      inProgressSuppressed.push(fixture.local_fixture_id || fixture.source_fixture_id || "unknown");
    }
  });

  finalScoreLocalIds.forEach((count, localId) => {
    if (count !== 1) {
      errors.push(`Final score local fixture ${localId} appears ${count} times`);
    }
  });

  liveFixtures
    .filter((fixture) => !safeFinalScoreIsShown(fixture))
    .forEach((fixture) => {
      const roundId = String(fixture.round_id || "");
      const teamIds = new Set([fixture.live_home_squad_id, fixture.live_away_squad_id, fixture.home_squad_id, fixture.away_squad_id]
        .filter(hasValue)
        .map(String));
      livePlayers
        .filter((player) => teamIds.has(String(player.team_id || player.squad_id || "")))
        .forEach((player) => {
          if (roundId && Object.prototype.hasOwnProperty.call(player.stats?.roundPoints || {}, roundId)) {
            unsafeFixturePointLeaks.push({
              fixture: fixture.local_fixture_id || fixture.source_fixture_id,
              fixture_status: fixture.fixture_status,
              mapping_status: fixture.mapping_status,
              round_id: roundId,
              player_id: player.official_fantasy_player_id,
              player: player.name
            });
          }
        });
    });

  if (unsafeFixturePointLeaks.length) {
    errors.push(`${unsafeFixturePointLeaks.length} player round-point rows are exposed for fixtures without safe final mapping`);
  }

  const manualExamples = manualExampleStatus({
    fixturesByLocalId: liveFixturesByLocalId,
    scorePredictionsByFixtureId
  });
  manualExamples.forEach((example) => {
    if (!example.passed) {
      errors.push(`Regression example failed: ${example.case_id}`);
    }
  });

  const manualSpotChecks = [
    "Early sample: Match 1 Mexico vs South Africa maps to fwc2026-m001 and score-prediction team pair.",
    "Middle sample: Match 14 Spain vs Cabo Verde maps to fwc2026-m014 and does not attach to Match 13 or Match 15.",
    "Late sample: Match 72 Congo DR vs Uzbekistan maps by round/team pair rather than source fixture order."
  ];

  const qa = {
    schema_version: "live_fixture_mapping_qa_v1",
    generated_at: CHECKED_AT,
    status: errors.length ? "failed" : warnings.length ? "passed_with_warnings" : "passed",
    files: FILES,
    summary: {
      total_local_fixtures: localFixtures.length,
      total_live_fixtures: liveFixtures.length,
      total_score_prediction_fixtures: scorePredictions.length,
      matched_fixtures: liveFixtures.filter((fixture) => SAFE_MAPPING_STATUS_VALUES.has(String(fixture.mapping_status || "").toLowerCase())).length,
      final_fixtures_shown: liveFixtures.filter(safeFinalScoreIsShown).length,
      in_progress_fixtures_suppressed: inProgressSuppressed.length,
      scheduled_fixtures: liveFixtures.filter((fixture) => String(fixture.fixture_status || "").toLowerCase() === "scheduled").length,
      unmatched_fixtures: liveFixtures.filter((fixture) => fixture.mapping_status === "unmatched").length,
      ambiguous_fixtures: liveFixtures.filter((fixture) => fixture.mapping_status === "ambiguous").length,
      reversed_mappings: liveFixtures.filter((fixture) => fixture.mapping_status === "matched_reversed").length,
      mapping_status_counts: countBy(liveFixtures, (fixture) => fixture.mapping_status),
      mapping_orientation_counts: countBy(liveFixtures, (fixture) => fixture.mapping_orientation),
      unsafe_fixture_player_point_leak_count: unsafeFixturePointLeaks.length
    },
    browser_lookup_checks: browserChecks,
    manual_examples: manualExamples,
    manual_spot_checks: manualSpotChecks,
    unsafe_fixture_player_point_leaks_sample: unsafeFixturePointLeaks.slice(0, 20),
    errors,
    warnings
  };

  await writeFile(path.join(root, FILES.qaJson), `${JSON.stringify(qa, null, 2)}\n`);
  await writeFile(path.join(root, FILES.qaReport), reportMarkdown(qa));
  console.log(JSON.stringify({
    status: qa.status,
    outputs: [FILES.qaJson, FILES.qaReport],
    summary: qa.summary,
    errors: qa.errors
  }, null, 2));

  if (errors.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
