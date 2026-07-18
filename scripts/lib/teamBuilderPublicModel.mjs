export const TEAM_BUILDER_PUBLIC_ARTIFACT_SCHEMA = "team_builder_final_round_artifact_v1";

export const TEAM_BUILDER_PUBLIC_STAGE_LABELS = {
  finalRound: "Final Round",
  third_place: "Third Place",
  final: "Final"
};

export const TEAM_BUILDER_PUBLIC_OBJECTIVE_COMPONENT_LABELS = {
  raw_projected_points: "Raw projected points",
  optionality_score: "Optionality",
  composite_score: "Composite",
  third_place_players: "Third Place players",
  final_players: "Final players"
};

export const TEAM_BUILDER_PUBLIC_SOURCE_OF_TRUTH_NOTE =
  "The generated Final Round Team Builder artifact is the public source of truth.";

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function displayNumber(value) {
  const number = Number(value) || 0;
  return number.toFixed(1).replace(".0", "");
}

export function budgetDisplay(used, limit) {
  return `${displayNumber(used)} / ${displayNumber(limit)}`;
}

export function teamEligibilityKeys(record) {
  return [
    record?.team_id,
    record?.teamId,
    record?.country,
    record?.team,
    record?.name,
    record?.code,
    record?.official_team_code,
    record?.preview_candidate?.team_id,
    record?.preview_candidate?.country,
    record?.preview_candidate?.team,
    record?.preview_candidate?.code
  ]
    .map(normalizeText)
    .filter(Boolean);
}

export function eligibleTeamKeysFromFixtureAuthority(fixtureAuthority) {
  const fixtures = Array.isArray(fixtureAuthority?.fixtures)
    ? fixtureAuthority.fixtures
    : [];
  const keys = new Set();

  // Eligible teams come from fixture authority, not hardcoded Final Round teams.
  fixtures.forEach((fixture) => {
    [fixture.team_a, fixture.team_b].filter(Boolean).forEach((team) => {
      teamEligibilityKeys(team).forEach((key) => keys.add(key));
    });
  });

  return keys;
}

export function recordMatchesEligibleTeam(record, eligibleTeamKeys) {
  if (!eligibleTeamKeys || !eligibleTeamKeys.size) {
    return true;
  }

  return teamEligibilityKeys(record).some((key) => eligibleTeamKeys.has(key));
}

export function isFinalRoundTeamBuilderArtifact(artifact) {
  return Boolean(
    artifact &&
    artifact.schema_version === TEAM_BUILDER_PUBLIC_ARTIFACT_SCHEMA &&
    Array.isArray(artifact.selectedSquad) &&
    Array.isArray(artifact.starters) &&
    Array.isArray(artifact.bench) &&
    artifact.selectedSquad.length === artifact.starters.length + artifact.bench.length
  );
}

export function countByField(rows = [], field, fallback = "unknown") {
  return rows.reduce((counts, row) => {
    const key = row?.[field] || fallback;
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

export function countByTeam(rows = []) {
  return countByField(rows, "country");
}

export function countByFixture(rows = []) {
  return countByField(rows, "fixture_stage");
}

export function selectedSquadSummary(artifact) {
  const selectedSquad = Array.isArray(artifact?.selectedSquad) ? artifact.selectedSquad : [];
  const totalPrice = selectedSquad.reduce((sum, row) => sum + (Number(row?.price) || 0), 0);

  return {
    selectedPlayers: selectedSquad.map((row) => row.name).filter(Boolean),
    selectedCountByTeam: countByTeam(selectedSquad),
    selectedCountByFixture: countByFixture(selectedSquad),
    totalPrice: Number(totalPrice.toFixed(1)),
    captain: artifact?.captain?.name || artifact?.summary?.captain || null,
    viceCaptain: artifact?.viceCaptain?.name || artifact?.summary?.viceCaptain || null,
    rawProjectedPoints: Number(artifact?.summary?.raw_projected_points || 0),
    optionalityScore: Number(artifact?.summary?.optionality_score || 0),
    compositeScore: Number(artifact?.summary?.composite_score || 0)
  };
}

export function optionalityLabel(score) {
  const number = Number(score) || 0;
  if (number >= 5) return "strong earlier-kickoff optionality";
  if (number >= 2) return "moderate earlier-kickoff optionality";
  return "limited earlier-kickoff optionality";
}

export function riskLabel({ thirdPlaceRisk = false, roleVolatility = 0 } = {}) {
  if (thirdPlaceRisk || Number(roleVolatility) >= 0.2) {
    return "rotation-risk watch";
  }
  return "standard role-risk watch";
}

export function artifactLoadedMessage({
  startingLineupTotal,
  benchLabel,
  rawProjected,
  optionality,
  composite,
  riskText = ""
}) {
  // Browser renders the generated artifact by default. This copy must not
  // become an alternate optimizer explanation or use historical fallback rows.
  return `Recommended Balanced Squad loaded from the validated Final Round Team Builder artifact: ${startingLineupTotal} starters on the field and ${benchLabel} below. Raw projected points ${rawProjected}; optionality ${optionality}; composite ${composite}.${riskText}`;
}
