import fs from "node:fs";
import http from "node:http";
import { spawn } from "node:child_process";
import { performance } from "node:perf_hooks";
import {
  projectPath,
  readActiveStageManifest
} from "./lib/readActiveStageManifest.mjs";

const generatedAt = new Date().toISOString();
const manifest = readActiveStageManifest();
const runner = manifest.qaRunner || {};
const outputJson = runner.outputJson || "data/activeStageQaRun_v1.json";
const outputReport = runner.outputReport || "data/activeStageQaRunReport_v1.md";
const excerptLimit = 1600;

function writeJson(relativePath, data) {
  fs.writeFileSync(projectPath(relativePath), `${JSON.stringify(data, null, 2)}\n`);
}

function writeText(relativePath, text) {
  fs.writeFileSync(projectPath(relativePath), text);
}

function fileExists(relativePath) {
  return fs.existsSync(projectPath(relativePath));
}

function excerpt(text, limit = excerptLimit) {
  const clean = String(text || "").replace(/\s+$/g, "");
  return clean.length > limit ? `${clean.slice(0, limit)}\n...<truncated>` : clean;
}

function mdTable(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((value) => String(value ?? "").replace(/\|/g, "\\|")).join(" | ")} |`)
  ].join("\n");
}

function splitCommand(command) {
  return String(command || "").match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g)?.map((part) =>
    part.replace(/^["']|["']$/g, "")
  ) || [];
}

function normalizeCommand(command, env = {}) {
  const parts = splitCommand(command);
  if (!parts.length) throw new Error("Empty command");
  if (parts[0] === "node") return { command: process.execPath, args: parts.slice(1), env };
  if (parts[0] === "git" && parts[1] === "diff" && parts[2] === "--check" && parts.length === 3) {
    return { command: "git", args: ["diff", "--check"], env };
  }
  throw new Error(`Unsupported active QA command: ${command}`);
}

function runProcess(command, args, env = {}) {
  const started = performance.now();
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: projectPath("."),
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", (error) => {
      resolve({
        exitCode: null,
        signal: null,
        stdout,
        stderr: `${stderr}\n${error.message}`.trim(),
        durationMs: Math.round(performance.now() - started)
      });
    });
    child.on("close", (exitCode, signal) => {
      resolve({
        exitCode,
        signal,
        stdout,
        stderr,
        durationMs: Math.round(performance.now() - started)
      });
    });
  });
}

async function httpOk(url) {
  return new Promise((resolve) => {
    const request = http.get(url, (response) => {
      response.resume();
      resolve(response.statusCode >= 200 && response.statusCode < 500);
    });
    request.setTimeout(800, () => {
      request.destroy();
      resolve(false);
    });
    request.on("error", () => resolve(false));
  });
}

async function ensureLocalServer() {
  const config = runner.localServer || {};
  const port = Number(config.port || 8772);
  const baseUrl = config.baseUrl || `http://127.0.0.1:${port}`;
  if (await httpOk(`${baseUrl}/index.html`)) {
    return { baseUrl, started: false, process: null, status: "pass", detail: "Existing local server responded." };
  }

  const child = spawn("python3", ["-m", "http.server", String(port)], {
    cwd: projectPath("."),
    stdio: ["ignore", "pipe", "pipe"]
  });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => { stdout += chunk; });
  child.stderr.on("data", (chunk) => { stderr += chunk; });

  for (let i = 0; i < 30; i += 1) {
    if (await httpOk(`${baseUrl}/index.html`)) {
      return { baseUrl, started: true, process: child, status: "pass", detail: "Started local static server." };
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  child.kill("SIGTERM");
  return {
    baseUrl,
    started: true,
    process: null,
    status: "fail",
    detail: `Unable to start local static server. stdout=${excerpt(stdout, 400)} stderr=${excerpt(stderr, 400)}`
  };
}

async function runCommandCheck(check, required = true, localServer = null) {
  const env = {};
  if (check.requiresLocalServer && localServer?.baseUrl) {
    env.PUBLIC_PREVIEW_BASE_URL = localServer.baseUrl;
  }
  const attempts = [];
  for (const commandText of [check.command, check.fallbackCommand].filter(Boolean)) {
    let normalized;
    try {
      normalized = normalizeCommand(commandText, env);
    } catch (error) {
      attempts.push({
        command: commandText,
        status: "fail",
        durationMs: 0,
        exitCode: null,
        outputExcerpt: error.message
      });
      continue;
    }
    const result = await runProcess(normalized.command, normalized.args, normalized.env);
    const status = result.exitCode === 0 ? "pass" : "fail";
    attempts.push({
      command: commandText,
      status,
      durationMs: result.durationMs,
      exitCode: result.exitCode,
      signal: result.signal,
      outputExcerpt: excerpt([result.stdout, result.stderr].filter(Boolean).join("\n"))
    });
    if (status === "pass") break;
  }
  const passed = attempts.some((attempt) => attempt.status === "pass");
  return {
    id: check.id,
    type: "commandCheck",
    required,
    status: passed ? "pass" : required ? "fail" : "skip",
    command: check.command,
    fallbackCommand: check.fallbackCommand || null,
    durationMs: attempts.reduce((sum, attempt) => sum + (attempt.durationMs || 0), 0),
    attempts
  };
}

async function runSyntaxCheck(file) {
  if (!fileExists(file)) {
    return {
      id: `syntax:${file}`,
      type: "syntaxCheck",
      required: true,
      status: "fail",
      command: `node --check ${file}`,
      durationMs: 0,
      outputExcerpt: "File missing."
    };
  }
  const result = await runProcess(process.execPath, ["--check", file]);
  return {
    id: `syntax:${file}`,
    type: "syntaxCheck",
    required: true,
    status: result.exitCode === 0 ? "pass" : "fail",
    command: `node --check ${file}`,
    durationMs: result.durationMs,
    exitCode: result.exitCode,
    outputExcerpt: excerpt([result.stdout, result.stderr].filter(Boolean).join("\n"))
  };
}

function regexFromPattern(pattern) {
  return new RegExp(pattern, "gu");
}

function rowName(row) {
  return String(row?.name || row?.display_name || "");
}

function rowTeam(row) {
  return String(row?.country || row?.team || row?.team_id || "");
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function activeEliminatedLeaks() {
  const leaks = [];
  const badName = /(lerma|raphinha|vinicius|vini)/i;
  const badTeam = /^(brazil|colombia|bra|col)$/i;
  const readJson = (file) => JSON.parse(fs.readFileSync(projectPath(file), "utf8"));
  const recommendations = readJson(manifest.files.recommendations).recommendationCandidates || [];
  const projections = readJson(manifest.files.matchdayProjections).playerMatchdayProjections || [];
  const artifact = readJson(manifest.files.teamBuilderArtifact).selectedSquad || [];
  for (const [surface, rows] of [
    ["recommendations", recommendations],
    ["projections", projections],
    ["teamBuilderArtifact", artifact]
  ]) {
    for (const row of rows) {
      const rowStage = row.matchday || row.matchday_id || manifest.activeStage;
      if (rowStage !== manifest.activeStage) continue;
      if (badName.test(normalizeText(rowName(row))) || badTeam.test(normalizeText(rowTeam(row)))) {
        leaks.push({ surface, name: rowName(row), team: rowTeam(row), matchday: rowStage });
      }
    }
  }
  return leaks;
}

function runSearchCheck(check) {
  const started = performance.now();
  const regex = regexFromPattern(check.pattern);
  const hits = [];
  for (const file of check.files || []) {
    if (!fileExists(file)) {
      hits.push({ file, line: null, text: "File missing." });
      continue;
    }
    const lines = fs.readFileSync(projectPath(file), "utf8").split(/\r?\n/);
    lines.forEach((line, index) => {
      regex.lastIndex = 0;
      if (regex.test(line)) {
        hits.push({ file, line: index + 1, text: excerpt(line.trim(), 240) });
      }
    });
  }
  let status = "pass";
  let activeLeakHits = [];
  if (check.policy === "zero_hits_required") {
    status = hits.length === 0 ? "pass" : "fail";
  } else if (check.policy === "historical_hits_allowed_with_explanation") {
    activeLeakHits = activeEliminatedLeaks();
    status = activeLeakHits.length === 0 ? "pass" : "fail";
  } else {
    status = "fail";
  }
  return {
    id: check.id,
    type: "searchCheck",
    required: true,
    status,
    policy: check.policy,
    pattern: check.pattern,
    files: check.files || [],
    durationMs: Math.round(performance.now() - started),
    hitCount: hits.length,
    activeLeakHits,
    explanation: check.explanation || "",
    hitsExcerpt: hits.slice(0, 20)
  };
}

async function main() {
  const needsServer = [
    ...(runner.requiredCommandChecks || []),
    ...(runner.optionalCommandChecks || [])
  ].some((check) => check.requiresLocalServer);
  const localServer = needsServer ? await ensureLocalServer() : null;
  const results = [];

  try {
    if (localServer?.status === "fail") {
      results.push({
        id: "local_static_server",
        type: "commandCheck",
        required: true,
        status: "fail",
        command: `python3 -m http.server ${runner.localServer?.port || 8772}`,
        durationMs: 0,
        outputExcerpt: localServer.detail
      });
    } else if (localServer) {
      results.push({
        id: "local_static_server",
        type: "commandCheck",
        required: true,
        status: "pass",
        command: `python3 -m http.server ${runner.localServer?.port || 8772}`,
        durationMs: 0,
        outputExcerpt: localServer.detail
      });
    }

    if (!localServer || localServer.status === "pass") {
      for (const check of runner.requiredCommandChecks || []) {
        results.push(await runCommandCheck(check, true, localServer));
      }
      for (const file of runner.syntaxChecks || []) {
        results.push(await runSyntaxCheck(file));
      }
      for (const check of runner.searchChecks || []) {
        results.push(runSearchCheck(check));
      }
      for (const check of runner.optionalCommandChecks || []) {
        results.push(await runCommandCheck(check, false, localServer));
      }
    }
  } finally {
    if (localServer?.started && localServer.process) {
      localServer.process.kill("SIGTERM");
    }
  }

  const requiredFailures = results.filter((result) => result.required && result.status === "fail");
  const summary = {
    total: results.length,
    passed: results.filter((result) => result.status === "pass").length,
    failed: results.filter((result) => result.status === "fail").length,
    skipped: results.filter((result) => result.status === "skip").length,
    requiredFailed: requiredFailures.length,
    optionalSkipped: results.filter((result) => !result.required && result.status === "skip").map((result) => result.id)
  };
  const report = {
    schema_version: "active_stage_qa_run_v1",
    generated_at: generatedAt,
    status: requiredFailures.length ? "fail" : "pass",
    activeStage: manifest.activeStage,
    runnerScript: runner.script,
    manifest: "data/activeStageManifest_v1.json",
    localServer: localServer ? {
      baseUrl: localServer.baseUrl,
      startedByRunner: localServer.started,
      status: localServer.status,
      detail: localServer.detail
    } : null,
    summary,
    results
  };
  writeJson(outputJson, report);
  writeText(outputReport, renderMarkdown(report));
  console.log(JSON.stringify({
    status: report.status,
    activeStage: report.activeStage,
    checksRun: summary.total,
    passed: summary.passed,
    failed: summary.failed,
    skipped: summary.skipped,
    requiredFailed: summary.requiredFailed,
    outputJson,
    outputReport
  }, null, 2));
  if (report.status !== "pass") {
    process.exitCode = 1;
  }
}

function renderMarkdown(report) {
  return [
    "# Active Stage QA Run Report v1",
    "",
    `Generated: ${report.generated_at}`,
    "",
    `Status: **${report.status}**`,
    "",
    "## Summary",
    "",
    mdTable(
      ["Item", "Value"],
      [
        ["Active stage", report.activeStage],
        ["Checks run", report.summary.total],
        ["Passed", report.summary.passed],
        ["Failed", report.summary.failed],
        ["Skipped", report.summary.skipped],
        ["Required failed", report.summary.requiredFailed],
        ["Optional skipped", report.summary.optionalSkipped.join(", ") || "none"],
        ["Local server", report.localServer ? `${report.localServer.status} (${report.localServer.baseUrl})` : "not needed"]
      ]
    ),
    "",
    "## Checks",
    "",
    mdTable(
      ["ID", "Type", "Required", "Status", "Duration ms", "Command"],
      report.results.map((result) => [
        result.id,
        result.type,
        result.required ? "yes" : "no",
        result.status,
        result.durationMs ?? 0,
        result.command || result.policy || ""
      ])
    ),
    "",
    "## Output Excerpts",
    "",
    report.results.map((result) => [
      `### ${result.id}`,
      "",
      `Status: ${result.status}`,
      "",
      result.outputExcerpt
        ? `\`\`\`\n${result.outputExcerpt}\n\`\`\``
        : result.hitsExcerpt
          ? `Hits: ${result.hitCount}. Active leaks: ${result.activeLeakHits?.length || 0}.${result.explanation ? ` ${result.explanation}` : ""}`
          : "No output.",
      ""
    ].join("\n")).join("\n")
  ].join("\n");
}

await main();
