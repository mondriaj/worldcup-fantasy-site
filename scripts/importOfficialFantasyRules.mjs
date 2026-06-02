import { access, readFile, writeFile } from "node:fs/promises";

const TODAY = "2026-06-02";

const DEFAULT_INPUT = "data/imports/officialFantasyRules.json";
const OUTPUT_RULES = "data/officialFantasyRules_v0.json";
const OUTPUT_REPORT = "data/officialFantasyRulesImportReport_v0.json";

const REQUIRED_TOP_LEVEL = [
  "rulesVersion",
  "rulesStatus",
  "squad",
  "budget",
  "countryLimits",
  "captain",
  "substitutions",
  "transfers",
  "boosters",
  "scoring",
  "deadlines",
  "sourceIds",
  "sourceChecked"
];

const REQUIRED_POSITIONS = ["GK", "DEF", "MID", "FWD"];

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function hasValue(value) {
  return value !== null && value !== undefined && value !== "";
}

function numberOrNull(value) {
  if (!hasValue(value)) return null;
  const parsed = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function arrayOrEmpty(value) {
  return Array.isArray(value) ? value : [];
}

function objectOrEmpty(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function firstValue(...values) {
  return values.find((value) => hasValue(value)) ?? null;
}

function statusLooksOfficial(value) {
  const status = String(value || "").toLowerCase();
  return Boolean(status) &&
    !status.includes("draft") &&
    !status.includes("starter") &&
    !status.includes("not_imported") &&
    !status.includes("placeholder");
}

function statusNeedsReview(value) {
  const status = String(value || "").toLowerCase();
  return status.includes("needs") || status.includes("review") || status.includes("partial");
}

function normalizePositionCounts(positions = {}) {
  const source = objectOrEmpty(positions);
  return {
    GK: numberOrNull(firstValue(source.GK, source.gk, source.GKP, source.gkp, source.goalkeepers)),
    DEF: numberOrNull(firstValue(source.DEF, source.def, source.defenders)),
    MID: numberOrNull(firstValue(source.MID, source.mid, source.midfielders)),
    FWD: numberOrNull(firstValue(source.FWD, source.fwd, source.FOR, source.for, source.forwards, source.strikers))
  };
}

function normalizeRules(raw) {
  const squad = objectOrEmpty(raw.squad);
  const startingLineup = objectOrEmpty(firstValue(raw.startingLineup, raw.starting_lineup));
  const budget = objectOrEmpty(raw.budget);
  const countryLimits = objectOrEmpty(firstValue(raw.countryLimits, raw.country_limits));
  const captain = objectOrEmpty(raw.captain);
  const substitutions = objectOrEmpty(firstValue(raw.substitutions, raw.manualSubstitutions, raw.manual_substitutions));
  const transfers = objectOrEmpty(raw.transfers);
  const boosters = objectOrEmpty(firstValue(raw.boosters, raw.chips));
  const scoring = objectOrEmpty(raw.scoring);
  const deadlines = objectOrEmpty(raw.deadlines);

  return {
    rulesVersion: firstValue(raw.rulesVersion, raw.rules_version),
    rulesStatus: firstValue(raw.rulesStatus, raw.rules_status),
    sourceIds: arrayOrEmpty(firstValue(raw.sourceIds, raw.source_ids)),
    sourceChecked: firstValue(raw.sourceChecked, raw.source_checked),
    squad: {
      totalPlayers: numberOrNull(firstValue(squad.totalPlayers, squad.total_players)),
      positions: normalizePositionCounts(squad.positions)
    },
    startingLineup: {
      totalPlayers: numberOrNull(firstValue(startingLineup.totalPlayers, startingLineup.total_players)),
      allowedFormations: arrayOrEmpty(firstValue(startingLineup.allowedFormations, startingLineup.allowed_formations))
    },
    budget: {
      initialBudget: numberOrNull(firstValue(budget.initialBudget, budget.initial_budget)),
      knockoutIncrease: numberOrNull(firstValue(budget.knockoutIncrease, budget.knockout_increase)),
      currencyLabel: firstValue(budget.currencyLabel, budget.currency_label)
    },
    countryLimits: {
      groupStageMaxPerCountry: numberOrNull(firstValue(countryLimits.groupStageMaxPerCountry, countryLimits.group_stage_max_per_country)),
      knockoutLimits: objectOrEmpty(firstValue(countryLimits.knockoutLimits, countryLimits.knockout_limits, countryLimits.knockoutLimitsPrototype, countryLimits.knockout_limits_prototype))
    },
    captain: {
      captainRequired: firstValue(captain.captainRequired, captain.captain_required),
      captainPointsMultiplier: numberOrNull(firstValue(captain.captainPointsMultiplier, captain.captain_points_multiplier)),
      changeRules: firstValue(captain.changeRules, captain.change_rules, captain.captainChangeRules, captain.captain_change_rules),
      lockRules: firstValue(captain.lockRules, captain.lock_rules)
    },
    substitutions: {
      rulesStatus: firstValue(substitutions.rulesStatus, substitutions.rules_status, substitutions.status),
      details: arrayOrEmpty(substitutions.details),
      manualSubstitutionRules: firstValue(substitutions.manualSubstitutionRules, substitutions.manual_substitution_rules, substitutions.rules),
      lockRules: firstValue(substitutions.lockRules, substitutions.lock_rules)
    },
    transfers: {
      rulesStatus: firstValue(transfers.rulesStatus, transfers.rules_status, transfers.status),
      details: arrayOrEmpty(transfers.details),
      freeTransfers: objectOrEmpty(firstValue(transfers.freeTransfers, transfers.free_transfers))
    },
    boosters: {
      rulesStatus: firstValue(boosters.rulesStatus, boosters.rules_status, boosters.status),
      details: arrayOrEmpty(boosters.details)
    },
    scoring: {
      rulesStatus: firstValue(scoring.rulesStatus, scoring.rules_status, scoring.status),
      categories: arrayOrEmpty(scoring.categories)
    },
    deadlines: {
      rulesStatus: firstValue(deadlines.rulesStatus, deadlines.rules_status, deadlines.status),
      matchdays: arrayOrEmpty(deadlines.matchdays),
      deadlineRules: firstValue(deadlines.deadlineRules, deadlines.deadline_rules, deadlines.rules),
      lockWindows: firstValue(deadlines.lockWindows, deadlines.lock_windows)
    },
    notes: raw.notes || ""
  };
}

function validateScoringCategories(categories) {
  return categories.flatMap((category, index) => {
    const errors = [];
    const label = `scoring.categories[${index}]`;
    const id = firstValue(category.categoryId, category.category_id, category.id, category.key);
    const name = firstValue(category.label, category.name);
    const points = firstValue(category.points, category.value, category.pointsByPosition, category.points_by_position, category.detail, category.details);
    if (!hasValue(id)) errors.push(`${label} is missing category ID.`);
    if (!hasValue(name)) errors.push(`${label} is missing label/name.`);
    if (!hasValue(points)) errors.push(`${label} is missing points or detail.`);
    return errors;
  });
}

function validateRules(rules) {
  const errors = [];
  const warnings = [];

  REQUIRED_TOP_LEVEL.forEach((field) => {
    if (!hasValue(rules[field]) && (typeof rules[field] !== "object" || rules[field] === null)) {
      errors.push(`Missing required top-level field: ${field}.`);
    }
  });

  if (!statusLooksOfficial(rules.rulesStatus)) {
    errors.push("rulesStatus does not look official/imported. Do not promote draft or placeholder rules.");
  }

  if (!Array.isArray(rules.sourceIds) || !rules.sourceIds.length) {
    errors.push("sourceIds must include at least one official source ID.");
  }

  if (!hasValue(rules.sourceChecked)) {
    errors.push("sourceChecked is required.");
  }

  const squadTotal = rules.squad.totalPlayers;
  if (!Number.isFinite(squadTotal) || squadTotal <= 0) {
    errors.push("squad.totalPlayers must be a positive number.");
  }

  const positionCounts = rules.squad.positions;
  REQUIRED_POSITIONS.forEach((position) => {
    if (!Number.isFinite(positionCounts[position]) || positionCounts[position] <= 0) {
      errors.push(`squad.positions.${position} must be a positive number.`);
    }
  });

  const positionTotal = REQUIRED_POSITIONS.reduce((sum, position) => sum + (positionCounts[position] || 0), 0);
  if (Number.isFinite(squadTotal) && positionTotal !== squadTotal) {
    errors.push(`Squad position counts sum to ${positionTotal}, but squad.totalPlayers is ${squadTotal}.`);
  }

  if (!Number.isFinite(rules.startingLineup.totalPlayers) || rules.startingLineup.totalPlayers <= 0) {
    errors.push("startingLineup.totalPlayers must be a positive number.");
  }

  if (!rules.startingLineup.allowedFormations.length) {
    warnings.push("startingLineup.allowedFormations is empty; Team Builder formation validation cannot be finalized.");
  }

  if (!Number.isFinite(rules.budget.initialBudget) || rules.budget.initialBudget <= 0) {
    errors.push("budget.initialBudget must be a positive number.");
  }

  if (!hasValue(rules.budget.currencyLabel)) {
    warnings.push("budget.currencyLabel is missing.");
  }

  if (!Number.isFinite(rules.countryLimits.groupStageMaxPerCountry) || rules.countryLimits.groupStageMaxPerCountry <= 0) {
    errors.push("countryLimits.groupStageMaxPerCountry must be a positive number.");
  }

  if (rules.captain.captainRequired === null) {
    errors.push("captain.captainRequired is required.");
  }

  if (!Number.isFinite(rules.captain.captainPointsMultiplier) || rules.captain.captainPointsMultiplier <= 0) {
    errors.push("captain.captainPointsMultiplier must be a positive number.");
  }

  if (!hasValue(rules.captain.changeRules)) {
    errors.push("captain.changeRules is required for Captain Change Advisor validation.");
  }

  if (!hasValue(rules.substitutions.rulesStatus) && !rules.substitutions.details.length && !hasValue(rules.substitutions.manualSubstitutionRules)) {
    errors.push("substitutions rules are required for Substitution Advisor and Matchday Decision Center validation.");
  }

  if (!hasValue(rules.substitutions.lockRules)) {
    warnings.push("substitutions.lockRules is missing; same-day/manual substitution legality still needs manual checking.");
  }

  if (!hasValue(rules.transfers.rulesStatus) && !rules.transfers.details.length) {
    errors.push("transfers rules are required.");
  }

  if (!hasValue(rules.boosters.rulesStatus) && !rules.boosters.details.length) {
    errors.push("boosters rules are required, even if the official game says there are none.");
  }

  if (statusNeedsReview(rules.rulesStatus)) {
    warnings.push(`rulesStatus is ${rules.rulesStatus}; keep staged rules under review before active promotion.`);
  }

  if (statusNeedsReview(rules.boosters.rulesStatus)) {
    warnings.push(`boosters.rulesStatus is ${rules.boosters.rulesStatus}; booster rules still need review before active promotion.`);
  }

  rules.boosters.details.forEach((booster, index) => {
    if (booster && typeof booster === "object" && !Array.isArray(booster)) {
      const id = firstValue(booster.boosterId, booster.booster_id, booster.id, booster.label);
      if (!hasValue(booster.effect) && !hasValue(booster.detail) && !hasValue(booster.details)) {
        warnings.push(`boosters.details[${index}] (${id || "unknown booster"}) is missing an effect/detail; keep as a manual-review blocker.`);
      }
    }
  });

  if (!hasValue(rules.scoring.rulesStatus) && !rules.scoring.categories.length) {
    errors.push("scoring rules are required.");
  }

  if (rules.scoring.categories.length) {
    errors.push(...validateScoringCategories(rules.scoring.categories));
  }

  if (!hasValue(rules.deadlines.rulesStatus) && !rules.deadlines.matchdays.length && !hasValue(rules.deadlines.deadlineRules)) {
    errors.push("deadlines are required for matchday lock/captain/substitution validation.");
  }

  if (!hasValue(rules.deadlines.lockWindows)) {
    warnings.push("deadlines.lockWindows is missing; captain/substitution tools must keep manual deadline warnings.");
  }

  if (statusNeedsReview(rules.deadlines.rulesStatus)) {
    warnings.push(`deadlines.rulesStatus is ${rules.deadlines.rulesStatus}; confirm final fantasy deadline semantics before active promotion.`);
  }

  return { errors, warnings };
}

function waitingReport(inputPath) {
  return {
    schema_version: "official_fantasy_rules_import_report_v0",
    generated_at: TODAY,
    source_checked: TODAY,
    status: "awaiting_official_rules_input",
    input_file: inputPath,
    required_top_level_fields: REQUIRED_TOP_LEVEL,
    template_file: "data/imports/officialFantasyRules_TEMPLATE.json",
    output_files_when_input_exists: [
      OUTPUT_RULES,
      OUTPUT_REPORT
    ],
    next_actions: [
      "Download or transcribe official fantasy rules when FIFA publishes them.",
      "Save them as data/imports/officialFantasyRules.json or pass --input path/to/file.json.",
      "Run node scripts/importOfficialFantasyRules.mjs.",
      "Review data/officialFantasyRulesImportReport_v0.json before promoting rules into active fantasyRules.json."
    ],
    safeguards: [
      "Draft or placeholder rules are rejected.",
      "Missing official values remain missing and are reported as errors.",
      "The importer writes officialFantasyRules_v0.json and does not overwrite active fantasyRules.json.",
      "Captain/substitution/deadline gaps keep manual warnings active."
    ]
  };
}

function reportFromRules(inputPath, rules, validation) {
  const status = validation.errors.length
    ? "imported_with_errors"
    : validation.warnings.length
      ? "imported_needs_manual_review"
      : "imported_ready_for_readiness_check";

  return {
    schema_version: "official_fantasy_rules_import_report_v0",
    generated_at: TODAY,
    source_checked: TODAY,
    status,
    input_file: inputPath,
    summary: {
      rules_version: rules.rulesVersion,
      rules_status: rules.rulesStatus,
      squad_total_players: rules.squad.totalPlayers,
      position_counts: rules.squad.positions,
      starting_lineup_total_players: rules.startingLineup.totalPlayers,
      formation_count: rules.startingLineup.allowedFormations.length,
      initial_budget: rules.budget.initialBudget,
      group_stage_country_limit: rules.countryLimits.groupStageMaxPerCountry,
      scoring_category_count: rules.scoring.categories.length,
      deadline_matchday_count: rules.deadlines.matchdays.length,
      source_ids: rules.sourceIds
    },
    validation_errors: validation.errors,
    validation_warnings: validation.warnings,
    promotion_notes: status === "imported_ready_for_readiness_check"
      ? [
        "Rules can be reviewed for promotion into active fantasyRules.json.",
        "Regenerate fantasyRulesData.js after promotion.",
        "Re-test Team Builder, Captain Change Advisor, Substitution Advisor, and Matchday Decision Center."
      ]
      : [
        "Do not promote these rules yet.",
        "Fix validation errors and resolve warnings before replacing active draft rules."
      ]
  };
}

async function main() {
  const inputPath = argValue("--input") || DEFAULT_INPUT;

  if (!(await fileExists(inputPath))) {
    const report = waitingReport(inputPath);
    await writeFile(OUTPUT_REPORT, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    console.log(`${OUTPUT_REPORT}: ${report.status}`);
    console.log(`waiting for input: ${inputPath}`);
    return;
  }

  const rawRules = JSON.parse(await readFile(inputPath, "utf8"));
  const rules = normalizeRules(rawRules);
  const validation = validateRules(rules);
  const report = reportFromRules(inputPath, rules, validation);
  const output = {
    schema_version: "official_fantasy_rules_v0",
    generated_at: TODAY,
    source_checked: TODAY,
    data_status: report.status,
    input_file: inputPath,
    officialFantasyRules: rules
  };

  await writeFile(OUTPUT_RULES, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  await writeFile(OUTPUT_REPORT, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`${OUTPUT_RULES}: ${report.status}`);
  console.log(`${OUTPUT_REPORT}: ${validation.errors.length} errors, ${validation.warnings.length} warnings`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
