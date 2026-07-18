import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { INTERNAL_ONLY_PUBLIC_FIELDS } from "./lib/publicPayloadSlimming.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const GENERATED_AT = new Date().toISOString();

function filePath(relativePath) {
  return path.join(ROOT, relativePath);
}

function readText(relativePath) {
  return fs.readFileSync(filePath(relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function writeJson(relativePath, data) {
  fs.writeFileSync(filePath(relativePath), `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function mdTable(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((cell) => String(cell ?? "").replace(/\n/g, " ")).join(" | ")} |`)
  ].join("\n");
}

function loadWrapper(wrapperFile, globalName) {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(readText(wrapperFile), context, { filename: wrapperFile });
  return context.window[globalName] || null;
}

function hasField(object, field) {
  return object && Object.hasOwn(object, field);
}

function nestedFieldPresent(value, field) {
  const text = JSON.stringify(value || {});
  const key = field.split(".").at(-1);
  return new RegExp(`"${key}"\\s*:`).test(text);
}

function check(id, ok, details = {}) {
  return { id, status: ok ? "pass" : "fail", ...details };
}

const contract = readJson("data/publicPayloadContract_v1.json");
const specs = {
  recommendations: { global: "FANTASY_POOL_RECOMMENDATIONS_DATA", rowKey: "recommendationCandidates", activeField: "matchday" },
  projections: { global: "FANTASY_POOL_MATCHDAY_PROJECTIONS_DATA", rowKey: "playerMatchdayProjections", activeField: "matchday" },
  scorePredictions: { global: "FANTASY_POOL_SCORE_PREDICTIONS_DATA", rowKey: "fixtureScorePredictions", activeField: "fantasy_matchday_id" },
  teamBuilderArtifact: { global: "TEAM_BUILDER_FINAL_ROUND_ARTIFACT_DATA", rowKey: "selectedSquad", activeField: null }
};

const checks = [];
const payloads = {};

for (const [id, spec] of Object.entries(specs)) {
  const wrapperContract = contract.wrappers[id];
  const payload = loadWrapper(wrapperContract.wrapper, spec.global);
  payloads[id] = payload;
  const rows = Array.isArray(payload?.[spec.rowKey]) ? payload[spec.rowKey] : [];
  const activeRows = spec.activeField ? rows.filter((row) => row?.[spec.activeField] === "finalRound") : rows;
  const firstActiveRow = activeRows[0] || rows[0] || {};
  checks.push(check(`${id}_wrapper_parses`, Boolean(payload), { wrapper: wrapperContract.wrapper }));
  checks.push(check(`${id}_required_top_level_fields`, (wrapperContract.requiredFields || []).every((field) => hasField(payload, field)), {
    missing: (wrapperContract.requiredFields || []).filter((field) => !hasField(payload, field))
  }));
  checks.push(check(`${id}_required_row_fields`, (wrapperContract.requiredRowFields || []).every((field) => hasField(firstActiveRow, field)), {
    missing: (wrapperContract.requiredRowFields || []).filter((field) => !hasField(firstActiveRow, field))
  }));
  checks.push(check(`${id}_active_rows_available`, activeRows.length > 0, { activeRows: activeRows.length, totalRows: rows.length }));
  checks.push(check(`${id}_internal_only_fields_absent`, INTERNAL_ONLY_PUBLIC_FIELDS.every((field) => !nestedFieldPresent(payload, field)), {
    present: INTERNAL_ONLY_PUBLIC_FIELDS.filter((field) => nestedFieldPresent(payload, field))
  }));
}

checks.push(check("team_builder_artifact_fields_available", Boolean(
  payloads.teamBuilderArtifact?.strategy?.id &&
  payloads.teamBuilderArtifact?.selectedSquad?.length === 15 &&
  payloads.teamBuilderArtifact?.starters?.length === 11 &&
  payloads.teamBuilderArtifact?.bench?.length === 4 &&
  Math.round((payloads.teamBuilderArtifact?.selectedSquad || []).reduce((sum, row) => sum + Number(row.price || 0), 0) * 10) / 10 === 94.8 &&
  payloads.teamBuilderArtifact?.constraintsUsed?.initial_budget === 105 &&
  payloads.teamBuilderArtifact?.summary?.selected_count_by_team
), {
  selectedSquad: payloads.teamBuilderArtifact?.selectedSquad?.length || 0,
  starters: payloads.teamBuilderArtifact?.starters?.length || 0,
  bench: payloads.teamBuilderArtifact?.bench?.length || 0,
  selectedTotalPrice: Math.round((payloads.teamBuilderArtifact?.selectedSquad || []).reduce((sum, row) => sum + Number(row.price || 0), 0) * 10) / 10,
  budgetLimit: payloads.teamBuilderArtifact?.constraintsUsed?.initial_budget
}));

checks.push(check("active_final_round_leakage_absent", ![
  ...(payloads.recommendations?.recommendationCandidates || []),
  ...(payloads.projections?.playerMatchdayProjections || [])
].some((row) => row.matchday === "finalRound" && ["Brazil", "Colombia"].includes(row.country)), {}));

checks.push(check("browser_usage_contract_present", Boolean(
  readText("script.js").includes("FANTASY_POOL_RECOMMENDATION_CANDIDATES") &&
  readText("script.js").includes("FANTASY_POOL_PLAYER_MATCHDAY_PROJECTIONS") &&
  readText("script.js").includes("TEAM_BUILDER_FINAL_ROUND_ARTIFACT_DATA") &&
  readText("worldCupPage.js").includes("FINAL_ROUND_FIXTURE_AUTHORITY_DATA")
), {}));

const failed = checks.filter((entry) => entry.status !== "pass");
const result = {
  schema_version: "public_payload_contract_qa_v1",
  generated_at: GENERATED_AT,
  status: failed.length ? "fail" : "pass",
  activeStage: contract.activeStage,
  checks,
  failedChecks: failed.map((entry) => entry.id)
};

writeJson("data/publicPayloadContractQa_v1.json", result);
fs.writeFileSync(filePath("data/publicPayloadContractQaReport_v1.md"), [
  "# Public Payload Contract QA v1",
  "",
  `Generated: ${GENERATED_AT}`,
  "",
  `Status: **${result.status}**`,
  "",
  mdTable(["Check", "Status"], checks.map((entry) => [entry.id, entry.status]))
].join("\n") + "\n", "utf8");

console.log(JSON.stringify(result, null, 2));

if (result.status !== "pass") {
  process.exitCode = 1;
}
