import { access, readFile, writeFile } from "node:fs/promises";

const TODAY = "2026-06-02";

const INPUTS = {
  playerRecommendationInputs: "data/playerRecommendationInputs_v1.json",
  playerRecommendationInputsQa: "data/playerRecommendationInputsQa_v1.json",
  clubContext: "data/playerClubContext_v1.csv",
  qualifierUsage: "data/playerQualifierUsage_v1.csv",
  coverageReport: "data/playerDataCoverageReport_v1.json",
  officialFantasyPlayers: "data/officialFantasyPlayers_v0.json",
  officialFantasyRules: "data/officialFantasyRules_v0.json",
  officialSquads: "data/officialSquads_v0.json",
  readiness: "data/officialDataReadiness_v0.json"
};

const OUTPUT_MODEL = "data/playerMinutesModel_fantasyPool_v0.json";
const OUTPUT_QA = "data/playerMinutesModel_fantasyPoolQa_v0.json";
const OUTPUT_REPORT = "data/playerMinutesModel_fantasyPoolReport_v0.md";
const OUTPUT_REPAIR_LIST = "data/highRiskMinutesUsageRepairList_v1.csv";
const OUTPUT_REPAIR_REPORT = "data/highRiskMinutesUsageRepairReport_v1.md";

const HIGH_PRICE_AUDIT_THRESHOLD = 6;
const HIGH_PRICE_FALLBACK_THRESHOLD = 7;
const PREMIUM_PRICE_FALLBACK_THRESHOLD = 8;

const EARLIER_HIGH_RISK_PLAYER_IDS = new Set([
  "1600",
  "1327",
  "815",
  "1671",
  "1335",
  "1257"
]);

const BASELINE_REPAIR_SNAPSHOT = {
  "1600": {
    role_label: "unclear",
    role_confidence: "low",
    start_probability: 0.20,
    expected_minutes: 22.8
  }
};

const ROLE_LABELS = [
  "locked_starter",
  "likely_starter",
  "rotation_starter",
  "impact_sub",
  "backup",
  "third_choice",
  "squad_depth",
  "unclear",
  "unclear_high_price",
  "club_star_nt_usage_missing",
  "thin_profile_unclear",
  "blocked"
];

const ROLE_CONFIDENCE = [
  "high",
  "medium",
  "low",
  "missing",
  "thin_profile",
  "blocked"
];

const ROLE_BANDS = {
  locked_starter: [0.80, 0.95],
  likely_starter: [0.65, 0.80],
  rotation_starter: [0.45, 0.65],
  impact_sub: [0.20, 0.45],
  backup: [0.05, 0.25],
  third_choice: [0.00, 0.10],
  squad_depth: [0.05, 0.20],
  unclear: [0.08, 0.24],
  unclear_high_price: [0.20, 0.36],
  club_star_nt_usage_missing: [0.28, 0.42],
  thin_profile_unclear: [0.03, 0.12],
  blocked: [null, null]
};

const UNCLEAR_PRIOR_BY_POSITION = {
  GK: 0.08,
  DEF: 0.18,
  MID: 0.16,
  FWD: 0.14
};

const THIN_PRIOR_BY_POSITION = {
  GK: 0.03,
  DEF: 0.08,
  MID: 0.08,
  FWD: 0.07
};

const HIGH_PRICE_MISSING_USAGE_PRIOR_BY_POSITION = {
  GK: 0.18,
  DEF: 0.28,
  MID: 0.29,
  FWD: 0.27
};

const CLUB_STAR_MISSING_NT_PRIOR_BY_POSITION = {
  GK: 0.22,
  DEF: 0.33,
  MID: 0.32,
  FWD: 0.30
};

const REPAIR_LIST_HEADERS = [
  "official_fantasy_player_id",
  "internal_player_id",
  "name",
  "country",
  "official_fantasy_position",
  "official_price",
  "current_start_probability",
  "current_expected_minutes",
  "current_role_label",
  "current_role_confidence",
  "missing_fields",
  "reason_for_audit",
  "recommended_action",
  "source_gap_type",
  "notes"
];

function hasValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function nullIfBlank(value) {
  return hasValue(value) ? String(value).trim() : null;
}

function numberOrNull(value) {
  if (!hasValue(value)) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function round(value, digits = 3) {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function flagList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value || "")
    .split(/[|;,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function uniqueFlags(flags) {
  return [...new Set(flags.filter(Boolean))].sort();
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function readJsonIfExists(filePath) {
  if (!(await fileExists(filePath))) return null;
  return readJson(filePath);
}

function parseDelimitedLine(line, delimiter) {
  const values = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === "\"" && quoted && next === "\"") {
      value += "\"";
      index += 1;
    } else if (char === "\"") {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      values.push(value);
      value = "";
    } else {
      value += char;
    }
  }

  values.push(value);
  return values;
}

function parseDelimited(text) {
  const clean = text.replace(/^\uFEFF/, "").trim();
  if (!clean) return [];

  const firstLine = clean.split(/\r?\n/, 1)[0] || "";
  const delimiter = firstLine.includes("\t") ? "\t" : ",";
  const rows = clean.split(/\r?\n/).filter(Boolean).map((line) => parseDelimitedLine(line, delimiter));
  const headers = rows.shift()?.map((header) => header.trim()) || [];

  return rows.map((row) => {
    const item = {};
    headers.forEach((header, index) => {
      item[header] = row[index] === undefined ? "" : row[index].trim();
    });
    return item;
  });
}

async function readDelimitedIfExists(filePath) {
  if (!(await fileExists(filePath))) return [];
  return parseDelimited(await readFile(filePath, "utf8"));
}

function indexByOfficialId(rows) {
  const map = new Map();
  rows.forEach((row) => {
    if (hasValue(row.official_fantasy_player_id)) {
      map.set(String(row.official_fantasy_player_id), row);
    }
  });
  return map;
}

function countBy(rows, keyFn) {
  return rows.reduce((counts, row) => {
    const key = keyFn(row) || "missing";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function sortedEntries(object) {
  return Object.entries(object).sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])));
}

function average(values) {
  const clean = values.filter((value) => Number.isFinite(value));
  if (!clean.length) return null;
  return round(clean.reduce((sum, value) => sum + value, 0) / clean.length, 3);
}

function averagesByPosition(rows, field) {
  const grouped = new Map();
  rows.forEach((row) => {
    const position = row.official_fantasy_position || "missing";
    const list = grouped.get(position) || [];
    list.push(row[field]);
    grouped.set(position, list);
  });

  return Object.fromEntries(
    [...grouped.entries()]
      .sort(([a], [b]) => String(a).localeCompare(String(b)))
      .map(([position, values]) => [position, average(values)])
  );
}

function mdEscape(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function mdTable(headers, rows) {
  return [
    `| ${headers.map(mdEscape).join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(mdEscape).join(" | ")} |`)
  ].join("\n");
}

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const text = Array.isArray(value) ? value.filter(Boolean).join("|") : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(headers, rows) {
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(","))
  ].join("\n") + "\n";
}

function isBlockedInput(row) {
  return row.model_input_status?.startsWith("blocked_") ||
    row.model_input_status === "needs_review" ||
    row.selectable_status !== "playing" ||
    row.squad_status_source_level === "review" ||
    !hasValue(row.official_fantasy_position) ||
    row.official_price === null ||
    row.official_price === undefined;
}

function blockedReasons(row) {
  const reasons = [];
  if (row.model_input_status?.startsWith("blocked_")) reasons.push(row.model_input_status);
  if (row.model_input_status === "needs_review") reasons.push("model_input_needs_review");
  if (row.selectable_status !== "playing") reasons.push("not_selectable");
  if (row.squad_status_source_level === "review") reasons.push("squad_review_status");
  if (!hasValue(row.official_fantasy_position)) reasons.push("missing_official_position");
  if (row.official_price === null || row.official_price === undefined) reasons.push("missing_official_price");
  return uniqueFlags(reasons);
}

function priceAdjustment(price, hasSupportingEvidence) {
  if (!hasSupportingEvidence || price === null) return 0;
  if (price >= 8) return 0.02;
  if (price >= 6.5) return 0.015;
  if (price >= 5.5) return 0.01;
  if (price <= 3.6) return -0.01;
  return 0;
}

function clubAdjustment(club) {
  const minutes = numberOrNull(club?.club_minutes_recent) || 0;
  const starts = numberOrNull(club?.club_starts_recent) || 0;
  const status = club?.club_data_status || "missing";
  const confidence = club?.club_role_confidence || "missing";
  if (!["source_verified", "official_verified", "existing_project_data"].includes(status)) return 0;
  if (!["high", "medium"].includes(confidence)) return 0;
  if (starts >= 20 || minutes >= 1800) return 0.03;
  if (starts >= 10 || minutes >= 900) return 0.02;
  if (starts > 0 || minutes > 0) return 0.01;
  return 0;
}

function positionStartMinutes(position, roleLabel) {
  if (position === "GK") return 88;
  if (position === "DEF") {
    if (roleLabel === "impact_sub") return 62;
    if (roleLabel === "rotation_starter") return 78;
    return 82;
  }
  if (position === "MID") {
    if (roleLabel === "impact_sub") return 58;
    if (roleLabel === "rotation_starter") return 68;
    return 74;
  }
  if (position === "FWD") {
    if (roleLabel === "impact_sub") return 54;
    if (roleLabel === "rotation_starter") return 62;
    return 68;
  }
  return 70;
}

function benchMinutes(position, roleLabel) {
  if (position === "GK") return 0;
  if (roleLabel === "impact_sub") return position === "FWD" ? 28 : 24;
  if (roleLabel === "rotation_starter") return position === "FWD" ? 18 : 16;
  if (roleLabel === "squad_depth") return position === "FWD" ? 8 : 6;
  if (roleLabel === "backup") return position === "FWD" ? 8 : 5;
  if (roleLabel === "third_choice") return 0;
  if (roleLabel === "thin_profile_unclear") return position === "FWD" ? 8 : 6;
  if (roleLabel === "unclear_high_price") return position === "FWD" ? 16 : 12;
  if (roleLabel === "club_star_nt_usage_missing") return position === "FWD" ? 16 : 12;
  if (roleLabel === "unclear") return position === "FWD" ? 14 : 10;
  return position === "FWD" ? 14 : 10;
}

function startsAndMinutes(inputRow, usage) {
  const starts = Math.max(
    numberOrNull(inputRow.recent_nt_starts) || 0,
    numberOrNull(inputRow.qualifier_starts) || 0,
    numberOrNull(usage?.recent_nt_starts) || 0,
    numberOrNull(usage?.qualifier_starts) || 0
  );
  const minutes = Math.max(
    numberOrNull(inputRow.recent_nt_minutes) || 0,
    numberOrNull(inputRow.qualifier_minutes) || 0,
    numberOrNull(usage?.recent_nt_minutes) || 0,
    numberOrNull(usage?.qualifier_minutes) || 0
  );
  const matchesAvailable = Math.max(
    numberOrNull(usage?.qualifier_matches_available) || 0,
    starts
  );
  return {
    starts,
    minutes,
    matchesAvailable,
    startRate: matchesAvailable ? starts / matchesAvailable : null
  };
}

function preferredUsageConfidence(inputRow, usage) {
  const fromUsage = usage?.usage_confidence;
  if (hasValue(fromUsage) && !["missing", "thin_profile_missing"].includes(fromUsage)) return fromUsage;
  const fromInput = inputRow.usage_confidence;
  if (hasValue(fromInput)) return fromInput;
  return fromUsage || "missing";
}

function roleFromUsage({ inputRow, usage, club }) {
  const position = inputRow.official_fantasy_position;
  const inputFlags = flagList(inputRow.data_quality_flags);
  const usageFlags = flagList(usage?.data_quality_flags);
  const usageConfidence = preferredUsageConfidence(inputRow, usage);
  const usageRole = usage?.recent_nt_role || inputRow.recent_nt_role || "unclear";
  const { starts, minutes, matchesAvailable, startRate } = startsAndMinutes(inputRow, usage);
  const thinProfile = inputFlags.includes("thin_profile");
  const clubAdj = clubAdjustment(club);
  const clubConfidence = club?.club_role_confidence || inputRow.club_role_confidence || "missing";
  const clubStatus = club?.club_data_status || inputRow.club_data_status || "missing";
  const strongClubSignal = ["source_verified", "official_verified"].includes(clubStatus) &&
    ["high", "medium"].includes(clubConfidence);
  const supportingEvidence = usageConfidence !== "missing" && usageConfidence !== "thin_profile_missing" ||
    strongClubSignal;
  const priceAdj = priceAdjustment(inputRow.official_price, supportingEvidence);
  const missingUsage = ["missing", "thin_profile_missing"].includes(usageConfidence);
  const targetedRoleEvidence = usageFlags.includes("targeted_usage_role_evidence");
  const highPriceClubContextMissingUsage = missingUsage &&
    strongClubSignal &&
    inputRow.official_price >= HIGH_PRICE_FALLBACK_THRESHOLD &&
    inputRow.selectable_status === "playing" &&
    inputRow.fantasy_pool_only === true;

  if (thinProfile) {
    const base = THIN_PRIOR_BY_POSITION[position] ?? 0.07;
    return {
      role_label: "thin_profile_unclear",
      role_confidence: "thin_profile",
      start_probability: clamp(base + Math.max(0, clubAdj * 0.5), ROLE_BANDS.thin_profile_unclear[0], ROLE_BANDS.thin_profile_unclear[1]),
      evidence_level: "thin_profile_no_source_backed_usage",
      evidence_notes: "Thin profile; missing national-team usage is not treated as average."
    };
  }

  let roleLabel = "unclear";
  let roleConfidence = "missing";
  let baseProbability = UNCLEAR_PRIOR_BY_POSITION[position] ?? 0.15;
  let evidenceLevel = "missing_usage";
  let evidenceNotes = "No source-backed national-team usage; conservative position prior only.";

  if (usageConfidence === "high") {
    roleConfidence = "high";
    evidenceLevel = "high_national_team_usage";
    evidenceNotes = "High-confidence national-team usage is the primary role signal.";
    if (usageRole === "locked_starter" || starts >= 6 || minutes >= 450 || (startRate !== null && startRate >= 0.75 && starts >= 4)) {
      roleLabel = "locked_starter";
      baseProbability = 0.83 + Math.min(0.08, (starts / 10) * 0.08);
    } else if (usageRole === "likely_starter" || starts >= 4 || minutes >= 300 || (startRate !== null && startRate >= 0.55 && starts >= 3)) {
      roleLabel = "likely_starter";
      baseProbability = 0.68 + Math.min(0.08, (starts / 8) * 0.08);
    } else if (usageRole === "rotation_starter" || starts >= 2 || minutes >= 120) {
      roleLabel = "rotation_starter";
      baseProbability = 0.48 + Math.min(0.12, (starts / 6) * 0.12);
    } else if (minutes > 0) {
      roleLabel = position === "GK" ? "backup" : "impact_sub";
      baseProbability = position === "GK" ? 0.08 : 0.26;
    } else {
      roleLabel = position === "GK" ? "third_choice" : "squad_depth";
      baseProbability = position === "GK" ? 0.03 : 0.08;
    }
  } else if (usageConfidence === "medium") {
    roleConfidence = "medium";
    evidenceLevel = "medium_national_team_usage";
    evidenceNotes = "Medium-confidence national-team usage is the primary role signal; role is capped conservatively.";
    if (usageRole === "locked_starter" || starts >= 5 || minutes >= 420) {
      roleLabel = "likely_starter";
      baseProbability = 0.67 + Math.min(0.07, (starts / 8) * 0.07);
    } else if (usageRole === "likely_starter" || starts >= 3 || minutes >= 240) {
      roleLabel = "likely_starter";
      baseProbability = 0.65 + Math.min(0.06, (starts / 6) * 0.06);
    } else if (usageRole === "rotation_starter" || starts >= 1 || minutes >= 90) {
      roleLabel = "rotation_starter";
      baseProbability = 0.45 + Math.min(0.12, (starts / 5) * 0.12);
    } else if (minutes > 0) {
      roleLabel = position === "GK" ? "backup" : "impact_sub";
      baseProbability = position === "GK" ? 0.07 : 0.24;
    } else {
      roleLabel = position === "GK" ? "third_choice" : "squad_depth";
      baseProbability = position === "GK" ? 0.03 : 0.07;
    }
  } else if (usageConfidence === "low") {
    roleConfidence = "low";
    evidenceLevel = "low_national_team_usage";
    evidenceNotes = "Low-confidence national-team usage gives only a conservative role signal.";
    if (starts >= 3 || minutes >= 240) {
      roleLabel = "rotation_starter";
      baseProbability = 0.45 + Math.min(0.08, (starts / 6) * 0.08);
    } else if (targetedRoleEvidence && ["locked_starter", "likely_starter"].includes(usageRole) && starts === 0 && minutes === 0) {
      roleLabel = "rotation_starter";
      baseProbability = 0.43;
      evidenceNotes = "Low-confidence targeted national-team role evidence is treated as a conservative rotation signal; no starts or minutes are invented.";
    } else if (targetedRoleEvidence && usageRole === "rotation_starter" && starts === 0 && minutes === 0) {
      roleLabel = position === "GK" ? "backup" : "impact_sub";
      baseProbability = position === "GK" ? 0.10 : 0.28;
      evidenceNotes = "Low-confidence targeted national-team role evidence is present, but without sourced starts or minutes the role remains conservative.";
    } else if (targetedRoleEvidence && usageRole === "impact_sub") {
      roleLabel = position === "GK" ? "backup" : "impact_sub";
      baseProbability = position === "GK" ? 0.09 : 0.24;
      evidenceNotes = "Low-confidence targeted national-team role evidence indicates an impact-sub role; no starts are invented.";
    } else if (starts >= 1 || minutes >= 45) {
      roleLabel = position === "GK" ? "backup" : "impact_sub";
      baseProbability = position === "GK" ? 0.10 : 0.24;
    } else {
      roleLabel = position === "GK" ? "third_choice" : "squad_depth";
      baseProbability = position === "GK" ? 0.03 : 0.07;
    }
  } else if (highPriceClubContextMissingUsage) {
    roleLabel = inputRow.official_price >= PREMIUM_PRICE_FALLBACK_THRESHOLD
      ? "club_star_nt_usage_missing"
      : "unclear_high_price";
    roleConfidence = "low";
    evidenceLevel = "high_price_club_context_missing_nt_usage";
    evidenceNotes = "High official price and source-verified club context exist, but national-team usage is missing; low-confidence uncertainty fallback only, not starter proof.";
    const priors = roleLabel === "club_star_nt_usage_missing"
      ? CLUB_STAR_MISSING_NT_PRIOR_BY_POSITION
      : HIGH_PRICE_MISSING_USAGE_PRIOR_BY_POSITION;
    baseProbability = (priors[position] ?? 0.28) + Math.min(0.015, clubAdj * 0.5);
  } else if (strongClubSignal) {
    roleLabel = "unclear";
    roleConfidence = "low";
    evidenceLevel = "club_context_only";
    evidenceNotes = "Club context exists, but national-team usage is missing; role remains unclear.";
    baseProbability = (UNCLEAR_PRIOR_BY_POSITION[position] ?? 0.15) + clubAdj;
  }

  const [minBand, maxBand] = ROLE_BANDS[roleLabel];
  const adjustedProbability = clamp(baseProbability + clubAdj + priceAdj, minBand, maxBand);

  return {
    role_label: roleLabel,
    role_confidence: roleConfidence,
    start_probability: adjustedProbability,
    evidence_level: evidenceLevel,
    evidence_notes: `${evidenceNotes} NT starts=${starts}; NT minutes=${minutes}; matches_available=${matchesAvailable || null}.`
  };
}

function expectedMinutes({ position, roleLabel, startProbability }) {
  if (startProbability === null) return null;
  const startMinutes = positionStartMinutes(position, roleLabel);
  const bench = benchMinutes(position, roleLabel);
  return round((startProbability * startMinutes) + ((1 - startProbability) * bench), 1);
}

function rowFlags({ inputRow, usage, roleLabel, roleConfidence, blocked, blockedReasonsList }) {
  const existingFlags = flagList(inputRow.data_quality_flags);
  const usageFlags = flagList(usage?.data_quality_flags);
  const combinedFlags = existingFlags.concat(usageFlags);
  const usageConfidence = preferredUsageConfidence(inputRow, usage);
  const currentMissingUsage = ["missing", "thin_profile_missing"].includes(usageConfidence);
  const flags = [
    "fantasy_pool_only_not_final_squad_confirmed",
    "final_squad_source_missing"
  ];

  if (combinedFlags.includes("thin_profile")) flags.push("thin_profile");
  if (combinedFlags.includes("missing_club_context")) flags.push("missing_club_context");
  if (currentMissingUsage && (combinedFlags.includes("missing_national_team_usage") || combinedFlags.includes("missing_usage"))) {
    flags.push("missing_national_team_usage");
  }
  if (usageConfidence === "low" || combinedFlags.includes("low_usage_confidence")) flags.push("low_usage_confidence");
  if (currentMissingUsage && combinedFlags.includes("high_price_missing_usage")) flags.push("high_price_missing_usage");
  if (currentMissingUsage && combinedFlags.includes("club_star_missing_nt_usage")) flags.push("club_star_missing_nt_usage");
  if (combinedFlags.includes("position_conflict_audit") || combinedFlags.includes("position_conflict")) flags.push("position_conflict_audit");
  if (["unclear", "unclear_high_price", "club_star_nt_usage_missing", "thin_profile_unclear"].includes(roleLabel)) flags.push("role_unclear");
  if (["unclear_high_price", "club_star_nt_usage_missing"].includes(roleLabel)) flags.push("needs_final_squad_confirmation");
  if (["low", "missing", "thin_profile"].includes(roleConfidence) ||
    ["unclear", "unclear_high_price", "club_star_nt_usage_missing", "thin_profile_unclear"].includes(roleLabel)) {
    flags.push("minutes_uncertain");
  }
  if (combinedFlags.includes("rules_manual_review")) flags.push("rules_manual_review");
  if (blocked) flags.push("blocked_not_selectable");
  if (inputRow.squad_status_source_level === "review" || combinedFlags.includes("squad_review_status")) flags.push("squad_review_status");
  if (blockedReasonsList.includes("missing_official_price")) flags.push("blocked_missing_official_price");
  if (blockedReasonsList.includes("missing_official_position")) flags.push("blocked_missing_official_position");
  if (blockedReasonsList.includes("model_input_needs_review")) flags.push("blocked_identity_or_model_review");

  return uniqueFlags(flags);
}

function modelRow(inputRow, club, usage) {
  const blocked = isBlockedInput(inputRow);
  const blockedReasonsList = blockedReasons(inputRow);
  const position = inputRow.official_fantasy_position;
  const startsMinutes = startsAndMinutes(inputRow, usage);

  if (blocked) {
    const flags = rowFlags({
      inputRow,
      usage,
      roleLabel: "blocked",
      roleConfidence: "blocked",
      blocked,
      blockedReasonsList
    });
    return {
      internal_player_id: inputRow.internal_player_id || null,
      official_fantasy_player_id: inputRow.official_fantasy_player_id || null,
      name: inputRow.name || null,
      display_name: inputRow.display_name || inputRow.name || null,
      country: inputRow.country || null,
      team_id: inputRow.team_id || null,
      official_fantasy_position: position || null,
      official_price: inputRow.official_price ?? null,
      selectable_status: inputRow.selectable_status || null,
      roster_status: inputRow.roster_status || null,
      squad_status_source_level: inputRow.squad_status_source_level || null,
      fantasy_pool_only: inputRow.fantasy_pool_only === true,
      final_squad_confirmed: false,
      minutes_model_status: "blocked",
      blocked_reasons: blockedReasonsList,
      role_label: "blocked",
      role_confidence: "blocked",
      start_probability: null,
      start_probability_band: ROLE_BANDS.blocked,
      expected_minutes: null,
      expected_minutes_basis: "blocked row; no minutes assigned",
      evidence_level: "blocked",
      evidence_notes: "Rows that are not selectable, missing official fields, or blocked by model input status do not receive preliminary minutes.",
      source_usage: {
        usage_confidence: preferredUsageConfidence(inputRow, usage),
        qualifier_matches_available: numberOrNull(usage?.qualifier_matches_available),
        qualifier_minutes: numberOrNull(inputRow.qualifier_minutes ?? usage?.qualifier_minutes),
        qualifier_starts: numberOrNull(inputRow.qualifier_starts ?? usage?.qualifier_starts),
        recent_nt_minutes: numberOrNull(inputRow.recent_nt_minutes ?? usage?.recent_nt_minutes),
        recent_nt_starts: numberOrNull(inputRow.recent_nt_starts ?? usage?.recent_nt_starts),
        recent_nt_role: usage?.recent_nt_role || inputRow.recent_nt_role || "unclear"
      },
      source_club_context: {
        current_club: inputRow.current_club || club?.current_club || null,
        current_league: inputRow.current_league || club?.current_league || null,
        club_data_status: inputRow.club_data_status || club?.club_data_status || "missing",
        club_role_confidence: inputRow.club_role_confidence || club?.club_role_confidence || "missing",
        club_minutes_recent: numberOrNull(club?.club_minutes_recent),
        club_starts_recent: numberOrNull(club?.club_starts_recent)
      },
      data_quality_flags: flags,
      minutes_risk_flags: flags,
      source_summary: inputRow.source_summary || {}
    };
  }

  const role = roleFromUsage({ inputRow, usage, club });
  const minutes = expectedMinutes({
    position,
    roleLabel: role.role_label,
    startProbability: role.start_probability
  });
  const flags = rowFlags({
    inputRow,
    usage,
    roleLabel: role.role_label,
    roleConfidence: role.role_confidence,
    blocked,
    blockedReasonsList
  });

  return {
    internal_player_id: inputRow.internal_player_id || null,
    official_fantasy_player_id: inputRow.official_fantasy_player_id || null,
    name: inputRow.name || null,
    display_name: inputRow.display_name || inputRow.name || null,
    country: inputRow.country || null,
    team_id: inputRow.team_id || null,
    official_fantasy_position: position || null,
    official_price: inputRow.official_price ?? null,
    selectable_status: inputRow.selectable_status || null,
    roster_status: inputRow.roster_status || null,
    squad_status_source_level: inputRow.squad_status_source_level || null,
    fantasy_pool_only: inputRow.fantasy_pool_only === true,
    final_squad_confirmed: false,
    minutes_model_status: "modeled_fantasy_pool_only",
    blocked_reasons: [],
    role_label: role.role_label,
    role_confidence: role.role_confidence,
    start_probability: round(role.start_probability, 3),
    start_probability_band: ROLE_BANDS[role.role_label],
    expected_minutes: minutes,
    expected_minutes_basis: "start_probability multiplied by conservative position/role start-minutes plus low bench-minute assumption",
    evidence_level: role.evidence_level,
    evidence_notes: role.evidence_notes,
    source_usage: {
      usage_confidence: preferredUsageConfidence(inputRow, usage),
      qualifier_matches_available: numberOrNull(usage?.qualifier_matches_available),
      qualifier_minutes: numberOrNull(inputRow.qualifier_minutes ?? usage?.qualifier_minutes),
      qualifier_starts: numberOrNull(inputRow.qualifier_starts ?? usage?.qualifier_starts),
      recent_nt_minutes: numberOrNull(inputRow.recent_nt_minutes ?? usage?.recent_nt_minutes),
      recent_nt_starts: numberOrNull(inputRow.recent_nt_starts ?? usage?.recent_nt_starts),
      recent_nt_role: usage?.recent_nt_role || inputRow.recent_nt_role || "unclear",
      start_rate: startsMinutes.startRate === null ? null : round(startsMinutes.startRate, 3)
    },
    source_club_context: {
      current_club: inputRow.current_club || club?.current_club || null,
      current_league: inputRow.current_league || club?.current_league || null,
      club_data_status: inputRow.club_data_status || club?.club_data_status || "missing",
      club_role_confidence: inputRow.club_role_confidence || club?.club_role_confidence || "missing",
      club_minutes_recent: numberOrNull(club?.club_minutes_recent),
      club_starts_recent: numberOrNull(club?.club_starts_recent)
    },
    data_quality_flags: flags,
    minutes_risk_flags: flags,
    source_summary: inputRow.source_summary || {}
  };
}

function topRows(rows, field, count = 25) {
  return rows
    .filter((row) => Number.isFinite(row[field]))
    .slice()
    .sort((a, b) => b[field] - a[field] || String(a.name).localeCompare(String(b.name)))
    .slice(0, count)
    .map((row) => ({
      official_fantasy_player_id: row.official_fantasy_player_id,
      name: row.name,
      country: row.country,
      position: row.official_fantasy_position,
      official_price: row.official_price,
      role_label: row.role_label,
      role_confidence: row.role_confidence,
      start_probability: row.start_probability,
      expected_minutes: row.expected_minutes,
      data_quality_flags: row.data_quality_flags
    }));
}

function highPriceLowConfidenceRows(rows) {
  return rows
    .filter((row) =>
      row.official_price >= 6 &&
      ["low", "missing", "thin_profile", "blocked"].includes(row.role_confidence)
    )
    .slice()
    .sort((a, b) =>
      b.official_price - a.official_price ||
      (b.start_probability || 0) - (a.start_probability || 0) ||
      String(a.name).localeCompare(String(b.name))
    )
    .slice(0, 25)
    .map((row) => ({
      official_fantasy_player_id: row.official_fantasy_player_id,
      name: row.name,
      country: row.country,
      position: row.official_fantasy_position,
      official_price: row.official_price,
      role_label: row.role_label,
      role_confidence: row.role_confidence,
      start_probability: row.start_probability,
      expected_minutes: row.expected_minutes,
      minutes_risk_flags: row.minutes_risk_flags
    }));
}

function highPriceUncertaintyFallbackRows(rows) {
  return rows
    .filter((row) => ["unclear_high_price", "club_star_nt_usage_missing"].includes(row.role_label))
    .slice()
    .sort((a, b) =>
      b.official_price - a.official_price ||
      String(a.country).localeCompare(String(b.country)) ||
      String(a.name).localeCompare(String(b.name))
    );
}

function missingNationalTeamUsage(row) {
  return row.data_quality_flags.includes("missing_national_team_usage") ||
    ["missing", "thin_profile_missing"].includes(row.source_usage?.usage_confidence);
}

function missingClubContext(row) {
  return row.data_quality_flags.includes("missing_club_context") ||
    ["missing", "thin_profile_missing"].includes(row.source_club_context?.club_data_status);
}

function strongClubContext(row) {
  return ["source_verified", "official_verified"].includes(row.source_club_context?.club_data_status) &&
    ["high", "medium"].includes(row.source_club_context?.club_role_confidence) &&
    hasValue(row.source_club_context?.current_club);
}

function previousRowById(previousOutput) {
  return indexByOfficialId(previousOutput?.playerMinutesModel || []);
}

function previousSnapshot(row, previousRowsById) {
  return previousRowsById.get(String(row.official_fantasy_player_id || "")) ||
    BASELINE_REPAIR_SNAPSHOT[String(row.official_fantasy_player_id || "")] ||
    null;
}

function repairAuditReasons(row) {
  const reasons = [];
  const highPrice = row.official_price >= HIGH_PRICE_AUDIT_THRESHOLD;
  const lowConfidence = ["low", "missing", "thin_profile", "blocked"].includes(row.role_confidence);
  if (highPrice && missingNationalTeamUsage(row)) reasons.push("high_price_missing_national_team_usage");
  if (highPrice && lowConfidence) reasons.push("high_price_low_role_confidence");
  if (highPrice && row.minutes_model_status === "modeled_fantasy_pool_only" && row.start_probability !== null && row.start_probability < 0.35) {
    reasons.push("high_price_start_probability_below_0.35");
  }
  if (strongClubContext(row) && missingNationalTeamUsage(row)) reasons.push("strong_club_context_missing_national_team_usage");
  if (EARLIER_HIGH_RISK_PLAYER_IDS.has(String(row.official_fantasy_player_id || ""))) reasons.push("earlier_high_risk_example");
  if (["unclear_high_price", "club_star_nt_usage_missing"].includes(row.role_label)) reasons.push("high_price_uncertainty_fallback_applied");
  return uniqueFlags(reasons);
}

function repairMissingFields(row) {
  const fields = [];
  if (missingClubContext(row)) {
    fields.push("club_context", "club_minutes", "club_starts");
  }
  if (missingNationalTeamUsage(row)) {
    fields.push("national_team_usage", "qualifier_minutes", "qualifier_starts");
  }
  if (!row.final_squad_confirmed) fields.push("final_squad_confirmation");
  return uniqueFlags(fields);
}

function repairSourceGapType(row, beforeRow) {
  if (row.data_quality_flags.includes("thin_profile")) return "thin_profile";
  if (row.minutes_model_status === "blocked") return "manual_review_needed";
  if (beforeRow?.role_label === "unclear" && ["unclear_high_price", "club_star_nt_usage_missing"].includes(row.role_label)) {
    return "model_too_conservative";
  }
  if (row.data_quality_flags.includes("position_conflict_audit") && missingNationalTeamUsage(row)) return "position_or_role_conflict";
  if (strongClubContext(row) && missingNationalTeamUsage(row)) return "club_context_available_usage_missing";
  if (missingNationalTeamUsage(row) || missingClubContext(row)) return "true_source_gap";
  return "manual_review_needed";
}

function repairRecommendedAction(row) {
  if (["unclear_high_price", "club_star_nt_usage_missing"].includes(row.role_label)) {
    return "keep_low_confidence_high_price_club_context_fallback_and_source_nt_usage";
  }
  if (row.minutes_model_status === "blocked") {
    return "keep_blocked_until_selectable_status_and_squad_review_are_resolved";
  }
  if (row.data_quality_flags.includes("thin_profile")) {
    return "keep_thin_profile_conservative_until_source_backed_profile_enrichment";
  }
  if (strongClubContext(row) && missingNationalTeamUsage(row)) {
    return "source_national_team_usage_before_final_minutes_promotion";
  }
  return "keep_existing_conservative_low_confidence_treatment";
}

function repairNotes(row, beforeRow) {
  const notes = [];
  if (beforeRow) {
    notes.push(`before_role=${beforeRow.role_label}`);
    notes.push(`before_start_probability=${beforeRow.start_probability ?? ""}`);
    notes.push(`before_expected_minutes=${beforeRow.expected_minutes ?? ""}`);
  }
  if (strongClubContext(row)) {
    notes.push(`club=${row.source_club_context.current_club}`);
    notes.push(`club_status=${row.source_club_context.club_data_status}`);
    notes.push(`club_role_confidence=${row.source_club_context.club_role_confidence}`);
    if (row.source_club_context.club_minutes_recent !== null) notes.push(`club_minutes=${row.source_club_context.club_minutes_recent}`);
    if (row.source_club_context.club_starts_recent !== null) notes.push(`club_starts=${row.source_club_context.club_starts_recent}`);
  }
  if (missingNationalTeamUsage(row)) notes.push("no_source_backed_nt_starts_or_minutes_in_current_repo");
  if (["unclear_high_price", "club_star_nt_usage_missing"].includes(row.role_label)) {
    notes.push("fallback_changes_uncertainty_bucket_only_no_usage_invented");
  }
  if (row.data_quality_flags.includes("thin_profile")) notes.push("thin_profile_no_historical_context_invented");
  if (row.minutes_model_status === "blocked") notes.push(`blocked_reasons=${row.blocked_reasons.join("|")}`);
  return notes.join("; ");
}

function buildRepairRows({ modelRows, previousOutput }) {
  const previousRowsById = previousRowById(previousOutput);
  return modelRows
    .map((row) => {
      const beforeRow = previousSnapshot(row, previousRowsById);
      const reasons = repairAuditReasons(row);
      if (!reasons.length) return null;
      return {
        official_fantasy_player_id: row.official_fantasy_player_id,
        internal_player_id: row.internal_player_id,
        name: row.name,
        country: row.country,
        official_fantasy_position: row.official_fantasy_position,
        official_price: row.official_price,
        current_start_probability: row.start_probability,
        current_expected_minutes: row.expected_minutes,
        current_role_label: row.role_label,
        current_role_confidence: row.role_confidence,
        missing_fields: repairMissingFields(row).join("|"),
        reason_for_audit: reasons.join("|"),
        recommended_action: repairRecommendedAction(row),
        source_gap_type: repairSourceGapType(row, beforeRow),
        notes: repairNotes(row, beforeRow)
      };
    })
    .filter(Boolean)
    .sort((a, b) =>
      b.official_price - a.official_price ||
      String(a.country).localeCompare(String(b.country)) ||
      String(a.name).localeCompare(String(b.name))
    );
}

function lowConfidenceRows(rows) {
  return rows.filter((row) =>
    row.minutes_model_status === "modeled_fantasy_pool_only" &&
    ["low", "missing", "thin_profile"].includes(row.role_confidence)
  );
}

function stopConditions({ modelRows, inputQa, officialSquads, officialRules, readiness }) {
  const finalSquadRows = (officialSquads.officialSquads || []).filter((row) => row.roster_status === "confirmed_final_squad").length;
  const rules = officialRules.officialFantasyRules || {};
  const blockedRows = modelRows.filter((row) => row.minutes_model_status === "blocked").length;
  const missingUsageRows = modelRows.filter((row) => row.data_quality_flags.includes("missing_national_team_usage")).length;
  const thinRows = modelRows.filter((row) => row.data_quality_flags.includes("thin_profile")).length;
  const inheritedStops = (inputQa.stop_conditions || [])
    .filter((condition) => condition.status === "stop")
    .map((condition) => ({
      id: `input_${condition.id}`,
      status: "stop",
      count: condition.count,
      details: condition.details
    }));

  return [
    ...inheritedStops,
    {
      id: "fantasy_pool_only_not_final_squad_ready",
      status: "stop",
      count: finalSquadRows,
      details: "This model has 0 confirmed final-squad rows and must not be treated as final."
    },
    {
      id: "readiness_not_ready_for_model_rerun",
      status: "stop",
      count: readiness.status === "ready_for_official_model_rerun" ? 0 : 1,
      details: `Official data readiness is ${readiness.status}.`
    },
    {
      id: "official_rules_manual_review",
      status: rules.rulesStatus === "official_imported_needs_manual_review" ? "stop" : "pass",
      count: rules.rulesStatus === "official_imported_needs_manual_review" ? 1 : 0,
      details: "Official rules still have manual-review warnings, including Mystery Booster/deadline semantics."
    },
    {
      id: "blocked_player_rows_present",
      status: blockedRows ? "stop" : "pass",
      count: blockedRows,
      details: "Blocked rows do not receive preliminary minutes."
    },
    {
      id: "missing_national_team_usage_present",
      status: missingUsageRows ? "warning" : "pass",
      count: missingUsageRows,
      details: "Missing national-team usage is kept missing and not treated as average."
    },
    {
      id: "thin_profiles_present",
      status: thinRows ? "warning" : "pass",
      count: thinRows,
      details: "Thin profiles use conservative low-confidence priors only."
    },
    {
      id: "not_safe_for_browser_ready_promotion",
      status: "stop",
      count: 1,
      details: "Browser-ready files were intentionally not regenerated in this staging pass."
    }
  ];
}

function buildQa({ modelRows, inputQa, coverageReport, officialSquads, officialRules, readiness }) {
  const modeledRows = modelRows.filter((row) => row.minutes_model_status === "modeled_fantasy_pool_only");
  const blockedRows = modelRows.filter((row) => row.minutes_model_status === "blocked");
  const lowRows = lowConfidenceRows(modelRows);
  const highPriceMissingUsage = modelRows.filter((row) => row.data_quality_flags.includes("high_price_missing_usage"));
  const highPriceUncertaintyFallback = highPriceUncertaintyFallbackRows(modelRows);
  const conditions = stopConditions({ modelRows, inputQa, officialSquads, officialRules, readiness });

  return {
    schema_version: "player_minutes_model_fantasy_pool_qa_v0",
    generated_at: TODAY,
    stage: "fantasy_pool_only",
    data_status: "not_final_squad_ready_not_safe_for_final_public_recommendations",
    total_rows: modelRows.length,
    rows_modeled: modeledRows.length,
    rows_blocked: blockedRows.length,
    average_start_probability_by_position: averagesByPosition(modeledRows, "start_probability"),
    average_expected_minutes_by_position: averagesByPosition(modeledRows, "expected_minutes"),
    role_label_counts: countBy(modelRows, (row) => row.role_label),
    role_confidence_counts: countBy(modelRows, (row) => row.role_confidence),
    minutes_model_status_counts: countBy(modelRows, (row) => row.minutes_model_status),
    thin_profile_counts: {
      total: modelRows.filter((row) => row.data_quality_flags.includes("thin_profile")).length,
      modeled: modeledRows.filter((row) => row.data_quality_flags.includes("thin_profile")).length,
      blocked: blockedRows.filter((row) => row.data_quality_flags.includes("thin_profile")).length
    },
    missing_usage_counts: {
      total: modelRows.filter((row) => row.data_quality_flags.includes("missing_national_team_usage")).length,
      modeled: modeledRows.filter((row) => row.data_quality_flags.includes("missing_national_team_usage")).length,
      blocked: blockedRows.filter((row) => row.data_quality_flags.includes("missing_national_team_usage")).length
    },
    high_price_missing_usage_players: highPriceMissingUsage.map((row) => ({
      official_fantasy_player_id: row.official_fantasy_player_id,
      name: row.name,
      country: row.country,
      position: row.official_fantasy_position,
      official_price: row.official_price,
      role_label: row.role_label,
      role_confidence: row.role_confidence,
      start_probability: row.start_probability,
      expected_minutes: row.expected_minutes
    })),
    high_price_uncertainty_fallback_players: highPriceUncertaintyFallback.map((row) => ({
      official_fantasy_player_id: row.official_fantasy_player_id,
      name: row.name,
      country: row.country,
      position: row.official_fantasy_position,
      official_price: row.official_price,
      role_label: row.role_label,
      role_confidence: row.role_confidence,
      start_probability: row.start_probability,
      expected_minutes: row.expected_minutes
    })),
    top_25_highest_start_probabilities: topRows(modeledRows, "start_probability"),
    top_25_highest_expected_minutes: topRows(modeledRows, "expected_minutes"),
    top_25_high_price_low_confidence_players: highPriceLowConfidenceRows(modelRows),
    countries_with_most_low_confidence_players: sortedEntries(countBy(lowRows, (row) => row.country)).slice(0, 15)
      .map(([country, count]) => ({ country, count })),
    positions_with_most_low_confidence_players: sortedEntries(countBy(lowRows, (row) => row.official_fantasy_position))
      .map(([position, count]) => ({ position, count })),
    warnings: [
      {
        id: "fantasy_pool_only",
        count: modeledRows.length,
        details: "Modeled rows are from the official fantasy pool only, not source-backed final squads."
      },
      {
        id: "missing_usage_not_averaged",
        count: modelRows.filter((row) => row.data_quality_flags.includes("missing_national_team_usage")).length,
        details: "Missing national-team usage rows use conservative unclear/thin-profile assumptions, not average usage."
      },
      {
        id: "coverage_report_final_sufficiency",
        count: coverageReport.totals?.players_with_missing_enrichment || 0,
        details: coverageReport.qa?.minutes_model_sufficiency || "not sufficient for final model"
      },
      {
        id: "high_price_uncertainty_fallback",
        count: highPriceUncertaintyFallback.length,
        details: "High-price players with strong club context but missing national-team usage receive low-confidence uncertainty labels, not starter labels."
      }
    ],
    stop_conditions: conditions,
    blockers: conditions.filter((condition) => condition.status === "stop"),
    safe_for_preliminary_score_projection_staging: true,
    safe_for_final_public_recommendations: false,
    safe_for_final_team_builder_promotion: false,
    recommended_next_step: "Use only for preliminary fantasy_pool_only staging. Resolve final squads, missing usage/club gaps, and rules warnings before final minutes model promotion."
  };
}

function buildSummary(modelRows, qa) {
  return {
    total_rows: modelRows.length,
    rows_modeled: qa.rows_modeled,
    rows_blocked: qa.rows_blocked,
    fantasy_pool_only_rows: modelRows.filter((row) => row.fantasy_pool_only).length,
    final_squad_confirmed_rows: modelRows.filter((row) => row.final_squad_confirmed).length,
    not_final_squad_ready: true,
    safe_only_for_preliminary_model_staging: true,
    safe_for_final_public_recommendations: false,
    safe_for_final_team_builder_promotion: false,
    role_label_counts: qa.role_label_counts,
    role_confidence_counts: qa.role_confidence_counts,
    high_price_missing_usage_players: qa.high_price_missing_usage_players.length,
    high_price_uncertainty_fallback_players: qa.high_price_uncertainty_fallback_players.length,
    low_confidence_modeled_rows: lowConfidenceRows(modelRows).length
  };
}

function reportLines({ summary, qa }) {
  return [
    "# Player Minutes Model Fantasy Pool v0 Report",
    "",
    `Generated: ${TODAY}`,
    "",
    "## Purpose",
    "",
    "This is a preliminary `fantasy_pool_only` minutes and role model for staging only. It is not final-squad-ready, not safe for final public recommendations, and not safe for final Team Builder promotion.",
    "",
    "## Input Files",
    "",
    "- `data/playerRecommendationInputs_v1.json`",
    "- `data/playerClubContext_v1.csv`",
    "- `data/playerQualifierUsage_v1.csv`",
    "- `data/playerDataCoverageReport_v1.json`",
    "- `data/officialFantasyPlayers_v0.json`",
    "- `data/officialFantasyRules_v0.json`",
    "- `data/officialSquads_v0.json`",
    "- `data/officialDataReadiness_v0.json`",
    "",
    "## Methodology",
    "",
    "National-team usage is the strongest role signal. High recent starts, high qualifier starts, and high national-team minutes can place a player in `locked_starter`, `likely_starter`, or `rotation_starter` bands. Club context is supporting evidence only and can make a small confidence/probability adjustment. Official fantasy price is a weak signal only and cannot by itself create a starter label. Missing usage is never treated as average.",
    "",
    "## Conservative Assumptions",
    "",
    "- Blocked/not-selectable rows receive no start probability or expected minutes.",
    "- Thin profiles use `thin_profile_unclear` with conservative low-confidence priors.",
    "- Missing national-team usage usually uses `unclear` and a conservative position prior.",
    "- High-price players with source-verified club context but missing national-team usage can use `unclear_high_price` or `club_star_nt_usage_missing`; these remain low-confidence uncertainty labels, not starter proof.",
    "- Starting goalkeepers are assumed near 90 minutes when role evidence is strong.",
    "- Defenders generally receive higher expected minutes than forwards when starting.",
    "- Forwards and attacking midfielders carry more substitution risk.",
    "- Rules and final-squad warnings are carried into every row as promotion blockers.",
    "",
    "## Coverage Summary",
    "",
    mdTable(["Metric", "Value"], [
      ["Total rows", summary.total_rows],
      ["Rows modeled", summary.rows_modeled],
      ["Rows blocked", summary.rows_blocked],
      ["Fantasy-pool-only rows", summary.fantasy_pool_only_rows],
      ["Final-squad-confirmed rows", summary.final_squad_confirmed_rows],
      ["High-price missing-usage players", summary.high_price_missing_usage_players],
      ["High-price uncertainty fallback players", summary.high_price_uncertainty_fallback_players],
      ["Low-confidence modeled rows", summary.low_confidence_modeled_rows],
      ["Safe for preliminary staging", "yes"],
      ["Safe for final public recommendations", "no"],
      ["Safe for final Team Builder promotion", "no"]
    ]),
    "",
    "## Role Label Counts",
    "",
    mdTable(["Role label", "Rows"], sortedEntries(summary.role_label_counts)),
    "",
    "## Role Confidence Counts",
    "",
    mdTable(["Role confidence", "Rows"], sortedEntries(summary.role_confidence_counts)),
    "",
    "## Average Start Probability by Position",
    "",
    mdTable(["Position", "Average start probability"], Object.entries(qa.average_start_probability_by_position)),
    "",
    "## Average Expected Minutes by Position",
    "",
    mdTable(["Position", "Average expected minutes"], Object.entries(qa.average_expected_minutes_by_position)),
    "",
    "## High-Risk Cases",
    "",
    qa.high_price_missing_usage_players.length
      ? mdTable(
        ["Official ID", "Name", "Country", "Position", "Price", "Role", "Confidence", "Start probability", "Expected minutes"],
        qa.high_price_missing_usage_players.map((row) => [
          row.official_fantasy_player_id,
          row.name,
          row.country,
          row.position,
          row.official_price,
          row.role_label,
          row.role_confidence,
          row.start_probability,
          row.expected_minutes
        ])
      )
      : "No high-price missing-usage players were flagged.",
    "",
    "## High-Price Low-Confidence Watchlist",
    "",
    mdTable(
      ["Official ID", "Name", "Country", "Position", "Price", "Role", "Confidence", "Start probability", "Expected minutes"],
      qa.top_25_high_price_low_confidence_players.map((row) => [
        row.official_fantasy_player_id,
        row.name,
        row.country,
        row.position,
        row.official_price,
        row.role_label,
        row.role_confidence,
        row.start_probability,
        row.expected_minutes
      ])
    ),
    "",
    "## Blockers Before Final Minutes Model",
    "",
    mdTable(
      ["Stop condition", "Status", "Count", "Details"],
      qa.stop_conditions.map((condition) => [
        condition.id,
        condition.status,
        condition.count,
        condition.details
      ])
    ),
    "",
    "## Safety Decision",
    "",
    "- Safe for preliminary score/projection staging: yes, only as `fantasy_pool_only` and only with visible warnings.",
    "- Safe for final public recommendations: no.",
    "- Safe for final Team Builder promotion: no.",
    "",
    "## Why This Is Not Final",
    "",
    "Final squads are not source-backed, no `confirmed_final_squad` rows exist, official rules still have manual-review warnings, and browser-ready active site files were intentionally not regenerated.",
    ""
  ].join("\n");
}

function countByField(rows, field) {
  return sortedEntries(countBy(rows, (row) => row[field]));
}

function compactSnapshot(row) {
  if (!row) {
    return {
      role_label: "",
      role_confidence: "",
      start_probability: "",
      expected_minutes: ""
    };
  }
  return {
    role_label: row.role_label ?? "",
    role_confidence: row.role_confidence ?? "",
    start_probability: row.start_probability ?? "",
    expected_minutes: row.expected_minutes ?? ""
  };
}

function beforeAfterRows({ ids, modelRows, previousOutput }) {
  const modelById = indexByOfficialId(modelRows);
  const previousRowsById = previousRowById(previousOutput);
  return ids
    .map((id) => {
      const after = modelById.get(id);
      if (!after) return null;
      const before = compactSnapshot(previousSnapshot(after, previousRowsById));
      return [
        id,
        after.name,
        after.country,
        after.official_fantasy_position,
        after.official_price,
        before.role_label,
        before.start_probability,
        before.expected_minutes,
        after.role_label,
        after.start_probability,
        after.expected_minutes
      ];
    })
    .filter(Boolean);
}

function previousSummaryCount(previousOutput, key, fallback = "") {
  if (previousOutput?.summary && previousOutput.summary[key] !== undefined) return previousOutput.summary[key];
  return fallback;
}

function repairReportLines({ repairRows, modelRows, previousOutput, summary, qa }) {
  const fallbackRows = highPriceUncertaintyFallbackRows(modelRows);
  const previousRows = previousOutput?.playerMinutesModel || [];
  const previousHighPriceMissingUsage = previousSummaryCount(
    previousOutput,
    "high_price_missing_usage_players",
    previousRows.filter((row) => row.data_quality_flags?.includes("high_price_missing_usage")).length
  );
  const previousLowConfidence = previousSummaryCount(
    previousOutput,
    "low_confidence_modeled_rows",
    previousRows.length ? lowConfidenceRows(previousRows).length : ""
  );
  const sourceBackedUsageStillMissing = repairRows.filter((row) => row.missing_fields.includes("national_team_usage")).length;
  const joinGapsFixed = repairRows.filter((row) => row.source_gap_type === "join_gap").length;
  const majorIds = uniqueFlags([
    "1600",
    ...fallbackRows.slice(0, 12).map((row) => row.official_fantasy_player_id),
    "528",
    "1274",
    "226",
    "1369",
    "1327",
    "815",
    "1671",
    "1335",
    "1257"
  ]);
  const musialaRow = beforeAfterRows({ ids: ["1600"], modelRows, previousOutput });

  return [
    "# High-Risk Minutes Usage Repair Report v1",
    "",
    `Generated: ${TODAY}`,
    "",
    "## Scope",
    "",
    "This is a targeted `fantasy_pool_only` repair pass for high-risk minutes and national-team usage staging. It does not rerun score predictions, matchday projections, recommendations, Team Builder, captain/substitution tools, browser-ready files, or UX.",
    "",
    "## Summary",
    "",
    mdTable(["Metric", "Before", "After / current"], [
      ["High-risk players audited", "", repairRows.length],
      ["Join gaps fixed in this pass", "", joinGapsFixed],
      ["Players still missing source-backed usage in audit", "", sourceBackedUsageStillMissing],
      ["High-price uncertainty fallback players", "", fallbackRows.length],
      ["High-price missing-usage players", previousHighPriceMissingUsage, summary.high_price_missing_usage_players],
      ["Low-confidence modeled rows", previousLowConfidence, summary.low_confidence_modeled_rows],
      ["Rows modeled", previousSummaryCount(previousOutput, "rows_modeled", ""), summary.rows_modeled],
      ["Rows blocked", previousSummaryCount(previousOutput, "rows_blocked", ""), summary.rows_blocked]
    ]),
    "",
    "## Repair Logic",
    "",
    "- No national-team starts, minutes, set pieces, penalties, or final-squad status were invented.",
    "- No enrichment join repair was found for this pass; `data/playerQualifierUsage_v1.csv` remains source-backed and missing where source-backed usage is absent.",
    "- High-price players with clean identity, fantasy-pool selectable status, source-verified club context, and missing national-team usage now receive `unclear_high_price` or `club_star_nt_usage_missing` instead of the generic `unclear` bucket.",
    "- The new labels are low-confidence uncertainty labels. They do not prove starts and do not make the model final.",
    "",
    "## Source Gap Types",
    "",
    mdTable(["Source gap type", "Rows"], countByField(repairRows, "source_gap_type")),
    "",
    "## Jamal Musiala Before And After",
    "",
    mdTable(
      ["Official ID", "Name", "Country", "Position", "Price", "Before role", "Before start", "Before minutes", "After role", "After start", "After minutes"],
      musialaRow
    ),
    "",
    "Musiala remains missing source-backed Germany qualifier/national-team starts and minutes in the current repo. The repair uses only his clean identity, official fantasy price, selectable fantasy-pool status, and source-verified Bayern Munich club context to move him into a low-confidence high-price uncertainty bucket.",
    "",
    "## Major Player Before And After",
    "",
    mdTable(
      ["Official ID", "Name", "Country", "Position", "Price", "Before role", "Before start", "Before minutes", "After role", "After start", "After minutes"],
      beforeAfterRows({ ids: majorIds, modelRows, previousOutput })
    ),
    "",
    "## High-Risk Audit List Preview",
    "",
    mdTable(
      ["Official ID", "Name", "Country", "Position", "Price", "Current role", "Confidence", "Source gap type", "Recommended action"],
      repairRows.slice(0, 25).map((row) => [
        row.official_fantasy_player_id,
        row.name,
        row.country,
        row.official_fantasy_position,
        row.official_price,
        row.current_role_label,
        row.current_role_confidence,
        row.source_gap_type,
        row.recommended_action
      ])
    ),
    "",
    "## Remaining High-Risk Issues",
    "",
    `- Source-backed national-team usage remains missing for ${sourceBackedUsageStillMissing} audited rows.`,
    `- High-price missing-usage count is ${summary.high_price_missing_usage_players}; this count only falls when source-backed usage is imported or joined.`,
    `- Low-confidence modeled rows are ${summary.low_confidence_modeled_rows}; this pass improves labels for the most material club-context cases but does not make low confidence disappear.`,
    "- Thin-profile and blocked players remain conservative or blocked. Famous names such as Xavi Simons, Emiliano Buendía, Matías Soulé, Johnny Cardoso, and Sofiane Boufal still need source-backed identity/enrichment before they can be treated as clean model inputs.",
    "",
    "## Safety Decision",
    "",
    "- Safer for preliminary minutes staging: yes, because high-price club-context source gaps are now explicit low-confidence uncertainty cases rather than generic unclear rows.",
    "- Safe for final public recommendations: no.",
    "- Safe for final Team Builder promotion: no.",
    "- Official readiness remains blocked until final squads, official-rule warnings, and active model promotion gates are resolved.",
    "",
    "## Recommended Next Session",
    "",
    "Source national-team usage for the highest-price low-confidence players and host-team stars, with final squads still treated as a separate blocking gate.",
    ""
  ].join("\n");
}

async function main() {
  const [
    playerRecommendationInputs,
    playerRecommendationInputsQa,
    clubRows,
    usageRows,
    coverageReport,
    officialFantasyPlayers,
    officialFantasyRules,
    officialSquads,
    readiness,
    previousMinutesModel
  ] = await Promise.all([
    readJson(INPUTS.playerRecommendationInputs),
    readJson(INPUTS.playerRecommendationInputsQa),
    readDelimitedIfExists(INPUTS.clubContext),
    readDelimitedIfExists(INPUTS.qualifierUsage),
    readJson(INPUTS.coverageReport),
    readJson(INPUTS.officialFantasyPlayers),
    readJson(INPUTS.officialFantasyRules),
    readJson(INPUTS.officialSquads),
    readJson(INPUTS.readiness),
    readJsonIfExists(OUTPUT_MODEL)
  ]);

  const inputRows = playerRecommendationInputs.players || [];
  const clubByOfficialId = indexByOfficialId(clubRows);
  const usageByOfficialId = indexByOfficialId(usageRows);
  const modelRows = inputRows.map((inputRow) => {
    const officialId = String(inputRow.official_fantasy_player_id || "");
    return modelRow(inputRow, clubByOfficialId.get(officialId), usageByOfficialId.get(officialId));
  });
  const qa = buildQa({
    modelRows,
    inputQa: playerRecommendationInputsQa,
    coverageReport,
    officialSquads,
    officialRules: officialFantasyRules,
    readiness
  });
  const summary = buildSummary(modelRows, qa);
  const repairRows = buildRepairRows({ modelRows, previousOutput: previousMinutesModel });

  const modelOutput = {
    schema_version: "player_minutes_model_fantasy_pool_v0",
    generated_at: TODAY,
    stage: "fantasy_pool_only",
    data_status: "not_final_squad_ready_not_safe_for_final_public_recommendations",
    labels: {
      stage: "fantasy_pool_only",
      final_squad_ready: false,
      safe_only_for_preliminary_model_staging: true,
      safe_for_final_public_recommendations: false,
      safe_for_final_team_builder_promotion: false
    },
    input_files: INPUTS,
    output_files: {
      model: OUTPUT_MODEL,
      qa: OUTPUT_QA,
      report: OUTPUT_REPORT,
      highRiskRepairList: OUTPUT_REPAIR_LIST,
      highRiskRepairReport: OUTPUT_REPAIR_REPORT
    },
    source_status: {
      player_recommendation_inputs_status: playerRecommendationInputs.data_status,
      official_fantasy_players_status: officialFantasyPlayers.data_status,
      official_fantasy_rules_status: officialFantasyRules.data_status,
      official_squads_status: officialSquads.data_status,
      readiness_status: readiness.status
    },
    controlled_values: {
      role_labels: ROLE_LABELS,
      role_confidence: ROLE_CONFIDENCE,
      start_probability_bands: ROLE_BANDS
    },
    model_notes: [
      "National-team usage is the strongest role signal.",
      "Club context is supporting evidence only.",
      "Official fantasy price is a weak signal only and cannot create a starter label by itself.",
      "Missing national-team usage is not treated as average.",
      "High-price club-context missing-usage rows can receive explicit low-confidence uncertainty labels, never starter labels.",
      "Blocked rows receive null start_probability and null expected_minutes."
    ],
    summary,
    stop_conditions: qa.stop_conditions,
    playerMinutesModel: modelRows
  };

  await writeFile(OUTPUT_MODEL, `${JSON.stringify(modelOutput, null, 2)}\n`, "utf8");
  await writeFile(OUTPUT_QA, `${JSON.stringify(qa, null, 2)}\n`, "utf8");
  await writeFile(OUTPUT_REPORT, reportLines({ summary, qa }), "utf8");
  await writeFile(OUTPUT_REPAIR_LIST, toCsv(REPAIR_LIST_HEADERS, repairRows), "utf8");
  await writeFile(OUTPUT_REPAIR_REPORT, repairReportLines({
    repairRows,
    modelRows,
    previousOutput: previousMinutesModel,
    summary,
    qa
  }), "utf8");

  console.log(`${OUTPUT_MODEL}: ${summary.rows_modeled} modeled, ${summary.rows_blocked} blocked`);
  console.log(`${OUTPUT_QA}: ${Object.keys(summary.role_label_counts).length} role labels, ${summary.high_price_missing_usage_players} high-price missing usage`);
  console.log(`${OUTPUT_REPORT}: fantasy_pool_only, not final-squad-ready`);
  console.log(`${OUTPUT_REPAIR_LIST}: ${repairRows.length} high-risk rows audited`);
  console.log(`${OUTPUT_REPAIR_REPORT}: high-risk minutes usage repair summary`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
