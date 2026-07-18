import { writeFile } from "node:fs/promises";
import { validateFinalRoundFixtureAuthority } from "./lib/finalRoundArtifacts.mjs";

function mdTable(headers, rows) {
  if (!rows.length) return "_None._";
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((value) => String(value ?? "")).join(" | ")} |`)
  ].join("\n");
}

const result = await validateFinalRoundFixtureAuthority();
const qa = {
  schema_version: "final_round_fixture_authority_qa_v1",
  generated_at: new Date().toISOString(),
  status: result.status,
  summary: result.authority.summary,
  errors: result.errors
};

await writeFile("data/finalRoundFixtureAuthorityQa_v1.json", `${JSON.stringify(qa, null, 2)}\n`, "utf8");
await writeFile("data/finalRoundFixtureAuthorityQaReport_v1.md", [
  "# Final Round Fixture Authority QA v1",
  "",
  `Status: ${qa.status}`,
  "",
  mdTable(["Metric", "Value"], Object.entries(qa.summary || {}).map(([key, value]) => [key, typeof value === "object" ? JSON.stringify(value) : value])),
  "",
  "## Errors",
  "",
  qa.errors.length ? qa.errors.map((error) => `- ${error}`).join("\n") : "None",
  ""
].join("\n"), "utf8");

console.log(JSON.stringify({ status: qa.status, errors: qa.errors }, null, 2));
if (qa.status !== "pass") {
  process.exitCode = 1;
}
