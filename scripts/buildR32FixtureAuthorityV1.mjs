import fs from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const generatedAt = new Date().toISOString();

const sourceFiles = {
  worldCupData: "worldCupData.js",
  r32BracketPath: "data/r32BracketPathModel_v1.json",
  liveMatchdayStatus: "data/liveMatchdayStatus_v1.json"
};

const flagByAbbr = {
  ALG: "🇩🇿",
  ARG: "🇦🇷",
  AUS: "🇦🇺",
  AUT: "🇦🇹",
  BEL: "🇧🇪",
  BIH: "🇧🇦",
  BRA: "🇧🇷",
  CAN: "🇨🇦",
  CIV: "🇨🇮",
  COD: "🇨🇩",
  COL: "🇨🇴",
  CPV: "🇨🇻",
  CRO: "🇭🇷",
  ECU: "🇪🇨",
  EGY: "🇪🇬",
  ENG: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  ESP: "🇪🇸",
  FRA: "🇫🇷",
  GER: "🇩🇪",
  GHA: "🇬🇭",
  JPN: "🇯🇵",
  MAR: "🇲🇦",
  MEX: "🇲🇽",
  NED: "🇳🇱",
  NOR: "🇳🇴",
  PAR: "🇵🇾",
  POR: "🇵🇹",
  RSA: "🇿🇦",
  SEN: "🇸🇳",
  SUI: "🇨🇭",
  SWE: "🇸🇪",
  USA: "🇺🇸"
};

function projectPath(...parts) {
  return path.join(root, ...parts);
}

function readText(relativePath) {
  return fs.readFileSync(projectPath(relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

async function writeJson(relativePath, value) {
  await writeFile(projectPath(relativePath), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function writeText(relativePath, value) {
  await writeFile(projectPath(relativePath), `${value.trimEnd()}\n`, "utf8");
}

function loadWorldCupData() {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(readText(sourceFiles.worldCupData), context, { filename: sourceFiles.worldCupData });
  return context.window.WORLD_CUP_DATA;
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function slug(value) {
  return normalizeText(value).replace(/\s+/g, "-");
}

function winnerDependencies(matchPath) {
  return Array.from(String(matchPath || "").matchAll(/Winner Match (\d+)/g)).map((entry) => Number(entry[1]));
}

function roundIdForWorldCupRound(roundName, matchPath) {
  const normalized = String(roundName || "").toLowerCase();
  const pathText = String(matchPath || "").toLowerCase();
  if (normalized.includes("round of 32")) return "r32";
  if (normalized.includes("round of 16")) return "r16";
  if (normalized.includes("quarter")) return "qf";
  if (normalized.includes("semi")) return "sf";
  if (normalized.includes("final") && pathText.includes("winner match")) return "final";
  if (normalized.includes("final") && pathText.includes("loser match")) return "third_place";
  return null;
}

function mdTable(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((value) => String(value ?? "")).join(" | ")} |`)
  ].join("\n");
}

function buildBracketNodes(worldCupData) {
  const nodes = new Map();
  for (const round of worldCupData.bracket?.rounds || []) {
    for (const match of round.matches || []) {
      const matchNumber = Number(match.id);
      const roundId = roundIdForWorldCupRound(round.name, match.path);
      if (!roundId) continue;
      nodes.set(matchNumber, {
        match_number: matchNumber,
        round_id: roundId,
        round_label: roundId === "third_place" ? "Third place" : round.name,
        bracket_path: match.path,
        dependencies: winnerDependencies(match.path)
      });
    }
  }
  return nodes;
}

function buildParentIndex(nodes) {
  const parentByChild = new Map();
  for (const node of nodes.values()) {
    for (const child of node.dependencies || []) parentByChild.set(child, node);
  }
  return parentByChild;
}

function teamRow(team, code) {
  return {
    team,
    team_id: slug(team),
    code: code || null,
    flag: code ? flagByAbbr[String(code).toUpperCase()] || null : null
  };
}

function easternDateTimeLabel(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const dateText = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Toronto",
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
  const timeText = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Toronto",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).format(date);
  return `${dateText} · ${timeText} ET`;
}

function teamPlacementById(r32BracketPath) {
  const rows = new Map();
  for (const group of r32BracketPath.current_group_standings || []) {
    for (const standing of group.standings || []) {
      rows.set(slug(standing.team), {
        group: standing.group,
        rank: standing.rank,
        points: standing.points,
        goal_difference: standing.goal_difference
      });
    }
  }
  return rows;
}

function sourceLiveFixtureById(liveMatchdayStatus) {
  const rows = new Map();
  for (const fixture of liveMatchdayStatus.fixtures || []) {
    const sourceId = String(fixture.source_fixture_id || fixture.source_fixture_order || "");
    if (String(fixture.round_id) === "4" && sourceId) rows.set(sourceId, fixture);
  }
  return rows;
}

function buildAuthority() {
  const worldCupData = loadWorldCupData();
  const r32BracketPath = readJson(sourceFiles.r32BracketPath);
  const liveMatchdayStatus = readJson(sourceFiles.liveMatchdayStatus);
  const nodes = buildBracketNodes(worldCupData);
  const parentByChild = buildParentIndex(nodes);
  const placementByTeam = teamPlacementById(r32BracketPath);
  const liveBySourceId = sourceLiveFixtureById(liveMatchdayStatus);

  const fixtures = (r32BracketPath.known_r32_fixtures || []).map((fixture) => {
    const live = liveBySourceId.get(String(fixture.source_fixture_id)) || null;
    const r16Node = parentByChild.get(Number(fixture.match_number));
    const qfNode = r16Node ? parentByChild.get(r16Node.match_number) : null;
    const sfNode = qfNode ? parentByChild.get(qfNode.match_number) : null;
    const finalNode = sfNode ? parentByChild.get(sfNode.match_number) : null;
    const homePlacement = placementByTeam.get(slug(fixture.home_team));
    const awayPlacement = placementByTeam.get(slug(fixture.away_team));
    return {
      bracket_match_number: Number(fixture.match_number),
      bracket_slot_id: `M${fixture.match_number}`,
      source_fixture_id: fixture.source_fixture_id || null,
      source_fixture_order: fixture.source_fixture_order ?? null,
      source_fixture_id_is_bracket_match_number: fixture.source_fixture_id_matches_official_match_number === true,
      source_fixture_id_role: "feed_source_id_only_not_bracket_slot",
      round: "R32",
      stage: fixture.stage,
      fixture_id: fixture.fixture_id,
      status: fixture.fixture_status || live?.fixture_status || null,
      kickoff: {
        source_datetime: fixture.date || live?.date || null,
        eastern_datetime_label: easternDateTimeLabel(fixture.date || live?.date)
      },
      venue: live ? {
        name: live.venue_name || null,
        city: live.venue_city || null
      } : null,
      team_a: teamRow(fixture.home_team, live?.home_abbr),
      team_b: teamRow(fixture.away_team, live?.away_abbr),
      winner_advances_to: r16Node ? {
        round: "R16",
        bracket_match_number: r16Node.match_number,
        bracket_slot_id: `M${r16Node.match_number}`,
        path: r16Node.bracket_path
      } : null,
      bracket_quarter: qfNode ? `winner_m${qfNode.match_number}` : null,
      bracket_half: sfNode ? `winner_m${sfNode.match_number}` : null,
      final_path: finalNode ? `winner_m${finalNode.match_number}` : null,
      bracket_path: fixture.bracket_path,
      derived_from: {
        mapping_basis: fixture.r32_slot_mapping_basis,
        mapping_status: fixture.r32_slot_mapping_status,
        group_rank_path: fixture.bracket_path,
        team_a_group_rank: homePlacement || null,
        team_b_group_rank: awayPlacement || null,
        candidate_match_ids: fixture.r32_slot_mapping_candidate_match_ids || []
      },
      source_confidence: fixture.r32_slot_mapping_status === "mapped_by_group_rank_path" && fixture.slot_certainty === "locked"
        ? "locked_group_rank_bracket_slot"
        : "review_required"
    };
  }).sort((a, b) => a.bracket_match_number - b.bracket_match_number);

  return {
    schema_version: "r32_fixture_authority_v1",
    generated_at: generatedAt,
    status: fixtures.length === 16 && fixtures.every((fixture) => fixture.derived_from.mapping_status === "mapped_by_group_rank_path") ? "pass" : "fail",
    source_files: sourceFiles,
    source_of_truth: {
      final_r32_fixtures: sourceFiles.r32BracketPath,
      bracket_slots: sourceFiles.worldCupData,
      kickoff_and_feed_source_ids: sourceFiles.liveMatchdayStatus,
      rule: "R32 bracket match numbers are resolved from completed group rank plus official bracket path. Raw FIFA fantasy source_fixture_id is retained only as feed metadata."
    },
    fixture_count: fixtures.length,
    fixtures
  };
}

function buildReport(authority) {
  return `# R32 Fixture Authority v1

Generated: ${authority.generated_at}

Status: **${authority.status.toUpperCase()}**

## Source Of Truth

- Final R32 teams: \`${sourceFiles.r32BracketPath}\`
- Bracket slots and advancement: \`${sourceFiles.worldCupData}\`
- Kickoffs/source fixture IDs: \`${sourceFiles.liveMatchdayStatus}\`

Raw \`source_fixture_id\` values are feed/source IDs only. Official bracket slots are the \`bracket_match_number\` / \`bracket_slot_id\` fields.

## Fixtures

${mdTable([
  "Slot",
  "Source ID",
  "Fixture",
  "Kickoff",
  "Advances To",
  "Quarter",
  "Half",
  "Mapping"
], authority.fixtures.map((fixture) => [
  fixture.bracket_slot_id,
  fixture.source_fixture_id,
  `${fixture.team_a.flag || ""} ${fixture.team_a.team} (${fixture.team_a.code || ""}) vs ${fixture.team_b.flag || ""} ${fixture.team_b.team} (${fixture.team_b.code || ""})`,
  fixture.kickoff.eastern_datetime_label || fixture.kickoff.source_datetime,
  fixture.winner_advances_to?.bracket_slot_id || "",
  fixture.bracket_quarter,
  fixture.bracket_half,
  fixture.derived_from.mapping_status
]))}
`;
}

async function main() {
  const authority = buildAuthority();
  await writeJson("data/r32FixtureAuthority_v1.json", authority);
  await writeText("data/r32FixtureAuthorityReport_v1.md", buildReport(authority));
  await writeText(
    "r32FixtureAuthorityData.js",
    `window.R32_FIXTURE_AUTHORITY_DATA = ${JSON.stringify(authority)};`
  );
  console.log(`data/r32FixtureAuthority_v1.json: ${authority.status}`);
  if (authority.status !== "pass") process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
