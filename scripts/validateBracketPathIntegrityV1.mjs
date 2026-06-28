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
  bracketPoolStrategy: "data/bracketPoolStrategyModel_v1.json",
  bracketPoolStrategyQa: "data/bracketPoolStrategyQa_v1.json",
  knockoutScorePredictor: "data/knockoutScorePredictor_v1.json"
};

const roundLabels = {
  r32: "R32",
  r16: "R16",
  qf: "QF",
  sf: "SF",
  final: "Final"
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

function mdTable(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((value) => String(value ?? "")).join(" | ")} |`)
  ].join("\n");
}

function loadWorldCupData() {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(readText(sourceFiles.worldCupData), context, { filename: sourceFiles.worldCupData });
  return context.window.WORLD_CUP_DATA;
}

function roundIdForWorldCupRound(roundName, matchPath) {
  const normalized = String(roundName || "").toLowerCase();
  const pathText = String(matchPath || "").toLowerCase();
  if (normalized.includes("round of 32")) return "r32";
  if (normalized.includes("round of 16")) return "r16";
  if (normalized.includes("quarter")) return "qf";
  if (normalized.includes("semi")) return "sf";
  if (normalized.includes("final") && pathText.includes("winner match")) return "final";
  return null;
}

function winnerDependencies(matchPath) {
  return Array.from(String(matchPath || "").matchAll(/Winner Match (\d+)/g)).map((entry) => Number(entry[1]));
}

function teamRecord(team, fixture, side) {
  return {
    team,
    team_id: slug(team),
    r32_match_number: fixture.match_number,
    r32_side: side
  };
}

function buildOfficialTree(worldCupData, r32BracketPath) {
  const fixturesByMatch = new Map((r32BracketPath.known_r32_fixtures || []).map((fixture) => [Number(fixture.match_number), fixture]));
  const nodes = new Map();

  for (const round of worldCupData.bracket?.rounds || []) {
    for (const match of round.matches || []) {
      const matchNumber = Number(match.id);
      const roundId = roundIdForWorldCupRound(round.name, match.path);
      if (!roundId) continue;

      if (roundId === "r32") {
        const fixture = fixturesByMatch.get(matchNumber);
        nodes.set(matchNumber, {
          match_id: String(matchNumber),
          match_number: matchNumber,
          round_id: roundId,
          round_label: roundLabels[roundId],
          bracket_path: match.path,
          left: fixture ? { type: "team", team_id: slug(fixture.home_team), team: fixture.home_team } : null,
          right: fixture ? { type: "team", team_id: slug(fixture.away_team), team: fixture.away_team } : null,
          fixture: fixture || null,
          dependencies: []
        });
        continue;
      }

      const dependencies = winnerDependencies(match.path);
      nodes.set(matchNumber, {
        match_id: String(matchNumber),
        match_number: matchNumber,
        round_id: roundId,
        round_label: roundLabels[roundId],
        bracket_path: match.path,
        left: dependencies[0] ? { type: "match", match_number: dependencies[0] } : null,
        right: dependencies[1] ? { type: "match", match_number: dependencies[1] } : null,
        dependencies
      });
    }
  }

  return nodes;
}

function childMatchNumbers(node) {
  return [node?.left, node?.right]
    .filter((source) => source?.type === "match")
    .map((source) => source.match_number);
}

function leafTeams(nodes, matchNumber) {
  const node = nodes.get(Number(matchNumber));
  if (!node) return [];
  if (node.round_id === "r32") {
    return [node.left, node.right].filter(Boolean).map((source) => ({
      team: source.team,
      team_id: source.team_id,
      r32_match_number: node.match_number
    }));
  }
  return childMatchNumbers(node).flatMap((child) => leafTeams(nodes, child));
}

function sourceR32Matches(nodes, matchNumber) {
  return [...new Set(leafTeams(nodes, matchNumber).map((team) => team.r32_match_number))].sort((a, b) => a - b);
}

function buildParentIndex(nodes) {
  const parentByChild = new Map();
  for (const node of nodes.values()) {
    for (const child of childMatchNumbers(node)) {
      parentByChild.set(child, node);
    }
  }
  return parentByChild;
}

function siblingSource(node, childMatchNumber) {
  if (!node) return null;
  const left = node.left?.type === "match" ? node.left.match_number : null;
  const right = node.right?.type === "match" ? node.right.match_number : null;
  if (left === childMatchNumber) return right;
  if (right === childMatchNumber) return left;
  return null;
}

function teamNames(rows) {
  return rows.map((row) => row.team).sort((a, b) => a.localeCompare(b));
}

function teamIds(rows) {
  return rows.map((row) => row.team_id).sort();
}

function findTeamR32Node(nodes, teamId) {
  for (const node of nodes.values()) {
    if (node.round_id !== "r32") continue;
    if ([node.left?.team_id, node.right?.team_id].includes(teamId)) return node;
  }
  return null;
}

function buildTeamPathRows(nodes) {
  const parentByChild = buildParentIndex(nodes);
  const finalNode = [...nodes.values()].find((node) => node.round_id === "final") || null;
  const rows = [];
  for (const node of [...nodes.values()].filter((entry) => entry.round_id === "r32")) {
    const teams = [node.left, node.right].filter(Boolean);
    for (const source of teams) {
      const r16Node = parentByChild.get(node.match_number) || null;
      const qfNode = r16Node ? parentByChild.get(r16Node.match_number) : null;
      const sfNode = qfNode ? parentByChild.get(qfNode.match_number) : null;
      const finalParent = sfNode ? parentByChild.get(sfNode.match_number) : null;
      const r16Sibling = siblingSource(r16Node, node.match_number);
      const qfSibling = qfNode && r16Node ? siblingSource(qfNode, r16Node.match_number) : null;
      const sfSibling = sfNode && qfNode ? siblingSource(sfNode, qfNode.match_number) : null;
      const finalSibling = finalParent && sfNode ? siblingSource(finalParent, sfNode.match_number) : null;
      const opponent = teams.find((team) => team.team_id !== source.team_id);
      rows.push({
        team: source.team,
        team_id: source.team_id,
        bracket_half: sfNode ? `winner_m${sfNode.match_number}` : null,
        bracket_quarter: qfNode ? `winner_m${qfNode.match_number}` : null,
        r32_match_number: node.match_number,
        r32_slot_id: `M${node.match_number}`,
        r32_opponent: opponent?.team || null,
        possible_r16_opponents: r16Sibling ? teamNames(leafTeams(nodes, r16Sibling)) : [],
        possible_qf_opponents: qfSibling ? teamNames(leafTeams(nodes, qfSibling)) : [],
        possible_sf_opponents: sfSibling ? teamNames(leafTeams(nodes, sfSibling)) : [],
        possible_final_opponents: finalSibling ? teamNames(leafTeams(nodes, finalSibling)) : [],
        possible_r16_opponent_ids: r16Sibling ? teamIds(leafTeams(nodes, r16Sibling)) : [],
        possible_qf_opponent_ids: qfSibling ? teamIds(leafTeams(nodes, qfSibling)) : [],
        possible_sf_opponent_ids: sfSibling ? teamIds(leafTeams(nodes, sfSibling)) : [],
        possible_final_opponent_ids: finalSibling ? teamIds(leafTeams(nodes, finalSibling)) : [],
        r16_match_number: r16Node?.match_number || null,
        qf_match_number: qfNode?.match_number || null,
        sf_match_number: sfNode?.match_number || null,
        final_match_number: finalNode?.match_number || null
      });
    }
  }
  return rows.sort((a, b) => a.team.localeCompare(b.team));
}

function buildRoundSlotRows(nodes) {
  return [...nodes.values()]
    .filter((node) => node.round_id !== "r32")
    .map((node) => ({
      match_number: node.match_number,
      round_id: node.round_id,
      round_label: node.round_label,
      bracket_path: node.bracket_path,
      left_source: `W${node.left.match_number}`,
      right_source: `W${node.right.match_number}`,
      left_source_r32_matches: sourceR32Matches(nodes, node.left.match_number),
      right_source_r32_matches: sourceR32Matches(nodes, node.right.match_number),
      left_possible_teams: teamNames(leafTeams(nodes, node.left.match_number)),
      right_possible_teams: teamNames(leafTeams(nodes, node.right.match_number))
    }))
    .sort((a, b) => a.match_number - b.match_number);
}

function buildR32SlotRows(nodes) {
  const parentByChild = buildParentIndex(nodes);
  return [...nodes.values()]
    .filter((node) => node.round_id === "r32")
    .map((node) => {
      const parent = parentByChild.get(node.match_number);
      return {
        match_number: node.match_number,
        slot_id: `M${node.match_number}`,
        fixture: node.fixture ? `${node.fixture.home_team} vs ${node.fixture.away_team}` : null,
        home_team: node.fixture?.home_team || null,
        away_team: node.fixture?.away_team || null,
        bracket_path: node.bracket_path,
        winner_slot: `W${node.match_number}`,
        feeds_round: parent?.round_label || null,
        feeds_match_number: parent?.match_number || null,
        feeds_slot: parent
          ? parent.left?.match_number === node.match_number ? "left" : "right"
          : null
      };
    })
    .sort((a, b) => a.match_number - b.match_number);
}

function addCheck(checks, failures, id, passed, detail = null) {
  checks.push({ id, status: passed ? "pass" : "fail", detail });
  if (!passed) failures.push({ id, detail });
}

function validateOfficialTree(nodes, r32BracketPath, teamRows) {
  const checks = [];
  const failures = [];
  const knownFixtures = r32BracketPath.known_r32_fixtures || [];
  const fixtureMatchNumbers = knownFixtures.map((fixture) => Number(fixture.match_number));
  const duplicateFixtures = fixtureMatchNumbers.filter((matchNumber, index) => fixtureMatchNumbers.indexOf(matchNumber) !== index);
  const fixtureTeams = knownFixtures.flatMap((fixture) => [fixture.home_team, fixture.away_team].map(slug));
  const duplicateTeams = fixtureTeams.filter((teamId, index) => fixtureTeams.indexOf(teamId) !== index);
  const r32Nodes = [...nodes.values()].filter((node) => node.round_id === "r32");
  const finalNodes = [...nodes.values()].filter((node) => node.round_id === "final");
  const missingDependencies = [...nodes.values()].flatMap((node) =>
    childMatchNumbers(node)
      .filter((child) => !nodes.has(child))
      .map((child) => `M${node.match_number}->M${child}`)
  );
  const france = teamRows.find((row) => row.team_id === "france");
  const argentina = teamRows.find((row) => row.team_id === "argentina");
  const franceArgentinaR16Possible = Boolean(
    france?.possible_r16_opponent_ids.includes("argentina") &&
    argentina?.possible_r16_opponent_ids.includes("france")
  );
  const oppositeHalfBeforeFinal = [];
  for (const row of teamRows) {
    for (const field of ["possible_r16_opponent_ids", "possible_qf_opponent_ids", "possible_sf_opponent_ids"]) {
      for (const opponentId of row[field] || []) {
        const opponent = teamRows.find((entry) => entry.team_id === opponentId);
        if (opponent && opponent.bracket_half !== row.bracket_half) {
          oppositeHalfBeforeFinal.push(`${row.team} vs ${opponent.team} via ${field}`);
        }
      }
    }
  }
  const finalOpponentsFromSameHalf = [];
  for (const row of teamRows) {
    for (const opponentId of row.possible_final_opponent_ids || []) {
      const opponent = teamRows.find((entry) => entry.team_id === opponentId);
      if (opponent && opponent.bracket_half === row.bracket_half) {
        finalOpponentsFromSameHalf.push(`${row.team} vs ${opponent.team}`);
      }
    }
  }

  addCheck(checks, failures, "known_r32_fixture_count", knownFixtures.length === 16, knownFixtures.length);
  addCheck(checks, failures, "official_r32_nodes_available", r32Nodes.length === 16, r32Nodes.length);
  addCheck(checks, failures, "no_duplicate_r32_fixtures", duplicateFixtures.length === 0, duplicateFixtures);
  addCheck(checks, failures, "no_team_in_two_r32_fixtures", duplicateTeams.length === 0, duplicateTeams);
  addCheck(checks, failures, "all_dependencies_resolve", missingDependencies.length === 0, missingDependencies);
  addCheck(checks, failures, "single_winner_final_match", finalNodes.length === 1 && finalNodes[0].match_number === 104, finalNodes.map((node) => node.match_number));
  addCheck(checks, failures, "opposite_halves_do_not_meet_before_final", oppositeHalfBeforeFinal.length === 0, oppositeHalfBeforeFinal.slice(0, 20));
  addCheck(checks, failures, "final_opponents_are_opposite_half_only", finalOpponentsFromSameHalf.length === 0, finalOpponentsFromSameHalf.slice(0, 20));
  addCheck(checks, failures, "france_argentina_r16_matches_source_truth", franceArgentinaR16Possible === true, {
    france_possible_r16_opponents: france?.possible_r16_opponents || [],
    argentina_possible_r16_opponents: argentina?.possible_r16_opponents || []
  });

  return { checks, failures, franceArgentinaR16Possible };
}

function validateBracketPoolTree(nodes, bracketPool) {
  const checks = [];
  const failures = [];
  if (!bracketPool) {
    addCheck(checks, failures, "bracket_pool_model_present", false, "Missing bracket pool strategy model.");
    return { checks, failures };
  }

  const poolTreeByMatch = new Map((bracketPool.bracket_tree || []).map((node) => [Number(node.match_number), node]));
  const finalNode = [...nodes.values()].find((node) => node.round_id === "final");
  const treeFailures = [];
  for (const node of nodes.values()) {
    const poolNode = poolTreeByMatch.get(node.match_number);
    if (!poolNode) {
      treeFailures.push(`missing M${node.match_number}`);
      continue;
    }
    if (poolNode.round_id !== node.round_id) {
      treeFailures.push(`round mismatch M${node.match_number}`);
    }
    if (node.round_id === "r32") {
      if (poolNode.left?.team_id !== node.left?.team_id || poolNode.right?.team_id !== node.right?.team_id) {
        treeFailures.push(`team source mismatch M${node.match_number}`);
      }
    } else if (
      Number(poolNode.left?.match_number) !== node.left?.match_number ||
      Number(poolNode.right?.match_number) !== node.right?.match_number
    ) {
      treeFailures.push(`dependency mismatch M${node.match_number}`);
    }
  }
  const extraPoolNodes = [...poolTreeByMatch.keys()].filter((matchNumber) => !nodes.has(matchNumber));
  if (extraPoolNodes.length) treeFailures.push(`extra nodes ${extraPoolNodes.join(", ")}`);

  const strategyFailures = [];
  for (const strategy of bracketPool.strategies || []) {
    const matchByNumber = new Map((strategy.matches || []).map((match) => [Number(match.match_number), match]));
    const winners = new Map();
    for (const node of nodes.values()) {
      const match = matchByNumber.get(node.match_number);
      if (!match) {
        strategyFailures.push(`${strategy.strategy_id}: missing M${node.match_number}`);
        continue;
      }
      const expectedLeft = node.left.type === "team" ? node.left.team_id : winners.get(node.left.match_number);
      const expectedRight = node.right.type === "team" ? node.right.team_id : winners.get(node.right.match_number);
      if (match.left_team_id !== expectedLeft || match.right_team_id !== expectedRight) {
        strategyFailures.push(`${strategy.strategy_id}: invalid inputs M${node.match_number}`);
      }
      if (![match.left_team_id, match.right_team_id].includes(match.model_pick_team_id)) {
        strategyFailures.push(`${strategy.strategy_id}: pick not in M${node.match_number}`);
      }
      winners.set(node.match_number, match.model_pick_team_id);
    }
    if (finalNode && strategy.champion?.team_id !== winners.get(finalNode.match_number)) {
      strategyFailures.push(`${strategy.strategy_id}: champion does not match M${finalNode.match_number}`);
    }
  }

  addCheck(checks, failures, "bracket_pool_tree_matches_official_slots", treeFailures.length === 0, treeFailures);
  addCheck(checks, failures, "bracket_pool_strategies_use_valid_path_propagation", strategyFailures.length === 0, strategyFailures);
  return { checks, failures };
}

function buildSanitySection(teamRows) {
  const ids = ["france", "argentina", "germany", "spain", "portugal", "england", "colombia"];
  return ids.map((teamId) => {
    const row = teamRows.find((entry) => entry.team_id === teamId);
    return {
      team: row?.team || teamId,
      possible_r16_opponents: row?.possible_r16_opponents || [],
      possible_qf_opponents: row?.possible_qf_opponents || [],
      bracket_half: row?.bracket_half || null
    };
  });
}

function buildReport(audit) {
  const r32Rows = audit.r32_slots.map((row) => [
    row.match_number,
    row.fixture,
    row.winner_slot,
    row.feeds_match_number,
    row.feeds_slot,
    row.bracket_path
  ]);
  const pathRows = audit.team_paths.map((row) => [
    row.team,
    row.r32_opponent,
    row.possible_r16_opponents.join(", "),
    row.possible_qf_opponents.join(", "),
    row.possible_sf_opponents.join(", "),
    row.possible_final_opponents.join(", ")
  ]);
  const sanityRows = audit.sanity.map((row) => [
    row.team,
    row.possible_r16_opponents.join(", "),
    row.possible_qf_opponents.join(", "),
    row.bracket_half
  ]);
  return `# Bracket Path Integrity Audit v1

Generated: ${audit.generated_at}

Status: **${audit.status.toUpperCase()}**

## Source Of Truth

- Final R32 fixtures: \`${sourceFiles.r32BracketPath}\`
- Bracket slot/winner mapping: \`${sourceFiles.worldCupData}\`
- Bracket-pool strategy model checked: \`${sourceFiles.bracketPoolStrategy}\`

## R32 Winner Slots

${mdTable(["Match", "Fixture", "Winner slot", "Feeds match", "Feeds side", "Path"], r32Rows)}

## Later-Round Winner Slots

${mdTable(["Match", "Round", "Left source", "Right source", "Left possible teams", "Right possible teams"], audit.round_slots.map((row) => [
  row.match_number,
  row.round_label,
  row.left_source,
  row.right_source,
  row.left_possible_teams.join(", "),
  row.right_possible_teams.join(", ")
]))}

## Team Path Table

${mdTable(["Team", "R32 opponent", "Possible R16", "Possible QF", "Possible SF", "Opposite-side finalists only"], pathRows)}

## Sanity Section

${mdTable(["Team", "Possible R16", "Possible QF", "Bracket half"], sanityRows)}

## Checks

${mdTable(["Check", "Status", "Detail"], audit.checks.map((check) => [
  check.id,
  check.status,
  Array.isArray(check.detail) ? check.detail.join("; ") : JSON.stringify(check.detail)
]))}

## Failures

${audit.failures.length ? audit.failures.map((failure) => `- \`${failure.id}\`: ${JSON.stringify(failure.detail)}`).join("\n") : "- None"}
`;
}

async function main() {
  const worldCupData = loadWorldCupData();
  const r32BracketPath = readJson(sourceFiles.r32BracketPath);
  const bracketPool = fs.existsSync(projectPath(sourceFiles.bracketPoolStrategy))
    ? readJson(sourceFiles.bracketPoolStrategy)
    : null;
  const nodes = buildOfficialTree(worldCupData, r32BracketPath);
  const teamPaths = buildTeamPathRows(nodes);
  const r32Slots = buildR32SlotRows(nodes);
  const roundSlots = buildRoundSlotRows(nodes);
  const officialChecks = validateOfficialTree(nodes, r32BracketPath, teamPaths);
  const bracketPoolChecks = validateBracketPoolTree(nodes, bracketPool);
  const checks = [...officialChecks.checks, ...bracketPoolChecks.checks];
  const failures = [...officialChecks.failures, ...bracketPoolChecks.failures];
  const audit = {
    schema_version: "bracket_path_integrity_audit_v1",
    generated_at: generatedAt,
    status: failures.length ? "fail" : "pass",
    source_files: sourceFiles,
    bracket_source_truth: {
      propagation_based_on_official_bracket_slots: true,
      bracket_slot_source: sourceFiles.worldCupData,
      final_match_number: [...nodes.values()].find((node) => node.round_id === "final")?.match_number || null,
      third_place_match_excluded_from_champion_tree: true,
      france_argentina_r16_possible_under_source: officialChecks.franceArgentinaR16Possible
    },
    r32_slots: r32Slots,
    round_slots: roundSlots,
    team_paths: teamPaths,
    sanity: buildSanitySection(teamPaths),
    checks,
    failures
  };

  await writeJson("data/bracketPathIntegrityAudit_v1.json", audit);
  await writeText("data/bracketPathIntegrityAuditReport_v1.md", buildReport(audit));
  console.log(`data/bracketPathIntegrityAudit_v1.json: ${audit.status}`);
  if (failures.length) {
    console.error(JSON.stringify(failures, null, 2));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
