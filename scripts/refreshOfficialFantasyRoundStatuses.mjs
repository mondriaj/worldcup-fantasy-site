import { readFile, writeFile } from "node:fs/promises";

const GENERATED_AT = new Date().toISOString();
const TODAY = GENERATED_AT.slice(0, 10);
const ROUNDS_URL = "https://play.fifa.com/json/fantasy/rounds.json";
const INPUT_RULES = "data/imports/officialFantasyRules.json";
const OFFICIAL_RULES = "data/officialFantasyRules_v0.json";
const REPORT = "data/officialFantasyRoundStatusRefresh_v1.md";

function rowsFromJson(data) {
  if (Array.isArray(data)) return data;
  for (const key of ["rounds", "data"]) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
}

function normalizeStage(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "group") return "group_stage";
  return raw || null;
}

async function fetchRounds() {
  const response = await fetch(ROUNDS_URL);
  const text = await response.text();
  if (!response.ok) throw new Error(`${ROUNDS_URL} returned HTTP ${response.status}`);
  return {
    status: response.status,
    last_modified: response.headers.get("last-modified"),
    etag: response.headers.get("etag"),
    bytes: text.length,
    rounds: rowsFromJson(JSON.parse(text))
  };
}

function refreshRulesRecord(record, roundsSource) {
  const roundsById = new Map(roundsSource.rounds.map((round) => [Number(round.id), round]));
  const matchdays = record.deadlines?.matchdays || [];
  const changes = [];
  const nextMatchdays = matchdays.map((matchday) => {
    const live = roundsById.get(Number(matchday.matchday));
    if (!live) return matchday;
    const next = {
      ...matchday,
      stage: normalizeStage(live.stage) || matchday.stage,
      round_status: live.status || matchday.round_status,
      round_start_local: live.startDate || matchday.round_start_local,
      round_end_local: live.endDate || matchday.round_end_local,
      source_url: ROUNDS_URL,
      source_checked: TODAY
    };
    for (const field of ["stage", "round_status", "round_start_local", "round_end_local"]) {
      if (String(matchday[field] ?? "") !== String(next[field] ?? "")) {
        changes.push({
          matchday: matchday.matchday,
          field,
          before: matchday[field] ?? null,
          after: next[field] ?? null
        });
      }
    }
    return next;
  });

  return {
    record: {
      ...record,
      sourceChecked: TODAY,
      deadlines: {
        ...(record.deadlines || {}),
        matchdays: nextMatchdays
      },
      sourceMetadata: [
        ...(record.sourceMetadata || []).filter((item) => item.source_id !== "fifaFantasyRoundsJson"),
        {
          source_id: "fifaFantasyRoundsJson",
          url: ROUNDS_URL,
          last_modified: roundsSource.last_modified,
          etag: roundsSource.etag,
          source_checked: TODAY
        }
      ]
    },
    changes
  };
}

const roundsSource = await fetchRounds();
const inputRules = JSON.parse(await readFile(INPUT_RULES, "utf8"));
const officialRulesFile = JSON.parse(await readFile(OFFICIAL_RULES, "utf8"));
const officialRules = officialRulesFile.officialFantasyRules || officialRulesFile;

const inputRefresh = refreshRulesRecord(inputRules, roundsSource);
const officialRefresh = refreshRulesRecord(officialRules, roundsSource);

await writeFile(INPUT_RULES, `${JSON.stringify(inputRefresh.record, null, 2)}\n`, "utf8");
await writeFile(
  OFFICIAL_RULES,
  `${JSON.stringify({
    ...officialRulesFile,
    generated_at: TODAY,
    source_checked: TODAY,
    officialFantasyRules: officialRefresh.record
  }, null, 2)}\n`,
  "utf8"
);

const report = [
  "# Official Fantasy Round Status Refresh v1",
  "",
  `Generated: ${GENERATED_AT}`,
  "",
  "## Source",
  "",
  `- ${ROUNDS_URL} (${roundsSource.status}, Last-Modified ${roundsSource.last_modified || "missing"})`,
  "",
  "## Changes",
  "",
  inputRefresh.changes.length
    ? [
      "| Matchday | Field | Before | After |",
      "| --- | --- | --- | --- |",
      ...inputRefresh.changes.map((change) => `| ${change.matchday} | ${change.field} | ${change.before ?? ""} | ${change.after ?? ""} |`)
    ].join("\n")
    : "No round/deadline fields changed.",
  "",
  "## Safeguards",
  "",
  "- Only deadline/round status fields already present in the staged rules file were refreshed.",
  "- This script does not infer lock semantics, booster rules, transfers, scoring, or final-squad status.",
  ""
].join("\n");

await writeFile(REPORT, report, "utf8");

console.log(`${INPUT_RULES}: ${inputRefresh.changes.length} round-status changes`);
console.log(`${OFFICIAL_RULES}: refreshed from rounds.json`);
