import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const TODAY = "2026-06-02";

const PATHS = {
  minutesModel: "data/playerMinutesModel_fantasyPool_v0.json",
  minutesQa: "data/playerMinutesModel_fantasyPoolQa_v0.json",
  repairList: "data/highRiskMinutesUsageRepairList_v1.csv",
  recommendationInputs: "data/playerRecommendationInputs_v1.json",
  clubContext: "data/playerClubContext_v1.csv",
  qualifierUsage: "data/playerQualifierUsage_v1.csv",
  nationalPerformance: "data/playerNationalTeamPerformance.json",
  players: "data/players.json",
  targetList: "data/targetedNationalTeamUsageSourcingList_v1.csv",
  targetListV2: "data/targetedNationalTeamUsageSourcingList_v2.csv",
  targetedImport: "data/imports/targetedNationalTeamUsage.csv",
  report: "data/targetedNationalTeamUsageSourcingReport_v1.md",
  reportV2: "data/targetedNationalTeamUsageSourcingReport_v2.md"
};

const TARGET_HEADERS = [
  "official_fantasy_player_id",
  "internal_player_id",
  "name",
  "country",
  "official_fantasy_position",
  "official_price",
  "priority",
  "current_start_probability",
  "current_expected_minutes",
  "current_role_label",
  "current_role_confidence",
  "missing_fields",
  "reason_for_targeting",
  "recommended_action",
  "source_gap_type",
  "repo_evidence_status",
  "planned_import_source_type",
  "notes"
];

const IMPORT_HEADERS = [
  "official_fantasy_player_id",
  "internal_player_id",
  "name",
  "country",
  "source_type",
  "source_url",
  "source_checked",
  "evidence_window",
  "recent_nt_starts",
  "recent_nt_minutes",
  "qualifier_starts",
  "qualifier_minutes",
  "last_nt_start_date",
  "role_evidence",
  "usage_confidence",
  "notes",
  "senior_caps",
  "source_gap_type",
  "target_priority"
];

const TARGET_V2_HEADERS = [
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
  "priority",
  "reason_for_priority",
  "usage_status_before",
  "recommended_source_type",
  "notes"
];

const FINAL_PASS_PRIORITY_IDS = new Set([
  "1712",
  "1369",
  "531",
  "270",
  "1493",
  "1683"
]);

const FINAL_PASS_SOURCE_BACKED_IDS = new Set([
  "1712",
  "531",
  "270",
  "1493",
  "1683"
]);

const HIGH_IMPACT_IDS = new Set([
  "1600",
  "528",
  "1712",
  "226",
  "748",
  "1274",
  "1369",
  "1485",
  "531",
  "270",
  "1493",
  "1683",
  "1999",
  "1961",
  "2033",
  "1258",
  "1267",
  "1474"
]);

const HOST_COUNTRY_IMPORTANT_IDS = new Set([
  "226",
  "748",
  "1274",
  "1485",
  "1961",
  "2033",
  "1258",
  "1267",
  "1474"
]);

const MANUAL_SOURCE_BACKED_EVIDENCE = {
  "1600": {
    source_type: "manual_source_backed",
    source_url: "https://www.uefa.com/newsfiles/UNL/2025/2043059_LU.pdf|https://www.uefa.com/newsfiles/UNL/2025/2043063_LU.pdf",
    source_checked: TODAY,
    evidence_window: "UEFA Nations League quarter-finals: Italy v Germany 2025-03-20 and Germany v Italy 2025-03-23",
    recent_nt_starts: "2",
    recent_nt_minutes: "",
    qualifier_starts: "",
    qualifier_minutes: "",
    last_nt_start_date: "2025-03-23",
    role_evidence: "rotation_starter",
    usage_confidence: "medium",
    notes: "UEFA tactical line-ups list Jamal Musiala in Germany's starting XI for both March 2025 Nations League quarter-final legs. Minutes are not imported from these line-up PDFs."
  },
  "528": {
    source_type: "manual_source_backed",
    source_url: "https://es.uefa.com/uefanationsleague/teams/players/250087938--kai-havertz/|https://ru.uefa.com/uefanationsleague/teams/players/250087938--kai-havertz/statistics/",
    source_checked: TODAY,
    evidence_window: "UEFA Nations League 2025 player statistics",
    recent_nt_starts: "",
    recent_nt_minutes: "300",
    qualifier_starts: "",
    qualifier_minutes: "",
    last_nt_start_date: "",
    role_evidence: "likely_starter",
    usage_confidence: "medium",
    notes: "Official UEFA Nations League player page lists Kai Havertz with 4 matches and 300 minutes. Starts are not exposed by the checked page."
  },
  "226": {
    source_type: "official_federation",
    source_url: "https://canadasoccer.com/national-team-match-past/?matchId=6040",
    source_checked: TODAY,
    evidence_window: "Canada v USA, Concacaf Nations League third-place match, 2025-03-23",
    recent_nt_starts: "1",
    recent_nt_minutes: "",
    qualifier_starts: "",
    qualifier_minutes: "",
    last_nt_start_date: "2025-03-23",
    role_evidence: "regular_national_team_player",
    usage_confidence: "medium",
    notes: "Canada Soccer match page lists Jonathan David in the starting XI and shows his 59th-minute goal. Minutes are not inferred beyond the sourced start."
  },
  "748": {
    source_type: "manual_source_backed",
    source_url: "https://www.concacaf.com/nations-league/news/jimenez-waterman-david-headline-cnl-finals-best-xi/",
    source_checked: TODAY,
    evidence_window: "2025 Concacaf Nations League Finals",
    recent_nt_starts: "",
    recent_nt_minutes: "",
    qualifier_starts: "",
    qualifier_minutes: "",
    last_nt_start_date: "2025-03-23",
    role_evidence: "likely_starter",
    usage_confidence: "medium",
    notes: "Concacaf reports Raúl Jiménez scored four goals from consecutive braces in the semifinal and final, and names him Best Player. This is imported as role evidence only because the checked source is not a lineup sheet."
  },
  "1274": {
    source_type: "official_federation",
    source_url: "https://www.ussoccer.com/stories/2025/03/us-mens-national-team-vs-panama-score-stats-goals-highlights-match-recap-concacaf-nations-league|https://www.ussoccer.com/stories/2025/03/us-mens-national-team-vs-canada-usa-lineup-today-starting-11-lineup-notes",
    source_checked: TODAY,
    evidence_window: "2025 Concacaf Nations League: USA v Panama 2025-03-20 and USA v Canada 2025-03-23",
    recent_nt_starts: "2",
    recent_nt_minutes: "",
    qualifier_starts: "",
    qualifier_minutes: "",
    last_nt_start_date: "2025-03-23",
    role_evidence: "established_national_team_player",
    usage_confidence: "medium",
    notes: "U.S. Soccer match report and lineup notes list Christian Pulisic in the starting XI for both March 2025 CNL matches, including captain status versus Canada. Minutes are not inferred."
  },
  "1961": {
    source_type: "official_federation",
    source_url: "https://canadasoccer.com/national-team-match-past/?matchId=6040",
    source_checked: TODAY,
    evidence_window: "Canada v USA, Concacaf Nations League third-place match, 2025-03-23",
    recent_nt_starts: "1",
    recent_nt_minutes: "12",
    qualifier_starts: "",
    qualifier_minutes: "",
    last_nt_start_date: "2025-03-23",
    role_evidence: "rotation_starter",
    usage_confidence: "low",
    notes: "Canada Soccer timeline shows Alphonso Davies was replaced by Niko Sigur in the 12th minute. This supports one start and 12 minutes only; no broader role is inferred."
  },
  "2033": {
    source_type: "official_federation",
    source_url: "https://www.ussoccer.com/stories/2025/03/us-mens-national-team-vs-panama-score-stats-goals-highlights-match-recap-concacaf-nations-league|https://www.ussoccer.com/stories/2025/03/us-mens-national-team-vs-canada-usa-lineup-today-starting-11-lineup-notes",
    source_checked: TODAY,
    evidence_window: "2025 Concacaf Nations League: USA v Panama 2025-03-20 and USA v Canada 2025-03-23",
    recent_nt_starts: "2",
    recent_nt_minutes: "",
    qualifier_starts: "",
    qualifier_minutes: "",
    last_nt_start_date: "2025-03-23",
    role_evidence: "established_national_team_player",
    usage_confidence: "medium",
    notes: "U.S. Soccer match report and lineup notes list Tyler Adams in the starting XI for both March 2025 CNL matches. Minutes are not inferred."
  },
  "1712": {
    source_type: "manual_source_backed",
    source_url: "https://editorial.uefa.com/resources/028f-1b6f7f14a391-e1beafb781cc-1000/euro2024_mini-tech-report_v7.pdf",
    source_checked: TODAY,
    evidence_window: "UEFA EURO 2024 technical report player statistics",
    recent_nt_starts: "",
    recent_nt_minutes: "43",
    qualifier_starts: "",
    qualifier_minutes: "",
    last_nt_start_date: "2024-07-14",
    role_evidence: "impact_sub",
    usage_confidence: "low",
    notes: "Official UEFA EURO 2024 technical report lists Ivan Toney with 3 appearances and 43 minutes. This is imported as low-confidence recent tournament usage because it is not 2026 qualifying usage and starts are not exposed."
  },
  "1369": {
    source_type: "missing_source_gap",
    source_url: "https://www1.folha.uol.com.br/internacional/en/sports/2025/03/after-506-days-neymar-returns-to-the-national-team-with-the-mission-of-easing-the-crisis-on-the-field.shtml|https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/neymar-brazil-return",
    source_checked: TODAY,
    evidence_window: "Neymar injury-return and Brazil squad-context articles checked; no recent source-backed starts or minutes imported.",
    recent_nt_starts: "",
    recent_nt_minutes: "",
    qualifier_starts: "",
    qualifier_minutes: "",
    last_nt_start_date: "",
    role_evidence: "",
    usage_confidence: "missing",
    notes: "Checked source-backed injury/return context, including reporting that Neymar's previous Brazil appearance before the 2025 return call-up was 2023-10-17. No source-backed recent starts, minutes, or usable role label was found for this staging pass."
  },
  "531": {
    source_type: "manual_source_backed",
    source_url: "https://fr.uefa.com/uefanationsleague/teams/players/250194673--deniz-undav/",
    source_checked: TODAY,
    evidence_window: "UEFA Nations League 2025 player statistics",
    recent_nt_starts: "",
    recent_nt_minutes: "175",
    qualifier_starts: "",
    qualifier_minutes: "",
    last_nt_start_date: "",
    role_evidence: "rotation_starter",
    usage_confidence: "medium",
    notes: "Official UEFA Nations League player page lists Deniz Undav with 3 matches, 175 minutes, 3 goals, and 1 assist. Starts are not exposed by the checked page."
  },
  "270": {
    source_type: "manual_source_backed",
    source_url: "https://copaamerica.com/en/news/james-rodriguez-colombia-best-player-copa-america-2024-award",
    source_checked: TODAY,
    evidence_window: "CONMEBOL Copa América 2024 tournament role evidence",
    recent_nt_starts: "",
    recent_nt_minutes: "",
    qualifier_starts: "",
    qualifier_minutes: "",
    last_nt_start_date: "2024-07-14",
    role_evidence: "likely_starter",
    usage_confidence: "medium",
    notes: "Official Copa América report says James Rodríguez was on the field in Colombia's six matches, captained the side, recorded 1 goal and 6 assists, and won tournament Best Player. Starts and minutes are not imported because the checked source does not expose them."
  },
  "1493": {
    source_type: "fifa_match_report",
    source_url: "https://inside.fifa.com/organisation/news/new-zealand-caledonia-world-cup-2026-chris-wood-interview|https://www.oceaniafootball.com/fifa-world-cup-26-oceania-qualifiers-round-three/",
    source_checked: TODAY,
    evidence_window: "FIFA/OFC World Cup 2026 Oceania qualifying final stage, March 2025",
    recent_nt_starts: "",
    recent_nt_minutes: "",
    qualifier_starts: "",
    qualifier_minutes: "",
    last_nt_start_date: "2025-03-24",
    role_evidence: "likely_starter",
    usage_confidence: "medium",
    notes: "FIFA describes Chris Wood as New Zealand captain and says he was forced off during the 2025-03-24 OFC qualifying final; OFC lists his hat-trick in the 2025-03-21 semi-final. This is imported as role evidence only because full lineups/minutes were not exposed."
  },
  "1683": {
    source_type: "official_federation",
    source_url: "https://www.fotball.no/landslag/norge-a-herrer/2026/her-er-norges-vm-tropp/|https://www.fotball.no/landslag/norge-a-herrer/2026/norges-tropp-mot-nederland-og-sveits/",
    source_checked: TODAY,
    evidence_window: "Norway federation 2026 squad context",
    recent_nt_starts: "",
    recent_nt_minutes: "",
    qualifier_starts: "",
    qualifier_minutes: "",
    last_nt_start_date: "",
    role_evidence: "rotation_or_recent_squad_player",
    usage_confidence: "low",
    senior_caps: "21",
    notes: "Norway federation squad page lists Fredrik Aursnes in the 2026 World Cup squad with 21 caps; the March squad article says Solbakken considered Aursnes certain for the World Cup squad if nothing changed. Starts and minutes are not imported."
  }
};

function hasValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function num(value) {
  if (!hasValue(value)) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function splitFlags(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value || "").split(/[|;,]/).map((flag) => flag.trim()).filter(Boolean);
}

function unique(values) {
  return [...new Set(values.filter(hasValue).map((value) => String(value)))];
}

function flagsList(values) {
  return unique(values.flatMap((value) => String(value || "").split("|").map((item) => item.trim()))).join("|");
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

async function readCsv(filePath) {
  return parseDelimited(await readFile(filePath, "utf8"));
}

async function readCsvIfExists(filePath) {
  if (!(await fileExists(filePath))) return [];
  return readCsv(filePath);
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

function indexBy(rows, key) {
  return new Map((rows || []).filter((row) => hasValue(row?.[key])).map((row) => [String(row[key]), row]));
}

function countBy(rows, key) {
  return rows.reduce((acc, row) => {
    const value = row[key] || "missing";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function sortedEntries(object) {
  return Object.entries(object).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function markdownTable(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((value) => String(value ?? "").replace(/\|/g, "\\|")).join(" | ")} |`)
  ].join("\n");
}

function modelById(minutesModel) {
  return indexBy(minutesModel.playerMinutesModel || [], "official_fantasy_player_id");
}

function missingUsage(modelRow) {
  return splitFlags(modelRow?.data_quality_flags).includes("missing_national_team_usage") ||
    ["missing", "thin_profile_missing"].includes(modelRow?.source_usage?.usage_confidence);
}

function modelReasons(row, repairRow) {
  const reasons = splitFlags(repairRow?.reason_for_audit);
  if (HOST_COUNTRY_IMPORTANT_IDS.has(String(row.official_fantasy_player_id))) reasons.push("host_country_important_player");
  if (HIGH_IMPACT_IDS.has(String(row.official_fantasy_player_id))) reasons.push("high_impact_watchlist_player");
  if (row.official_price >= 7 && row.start_probability !== null && row.start_probability < 0.45) {
    reasons.push("high_price_start_probability_below_0.45");
  }
  if (splitFlags(row.data_quality_flags).includes("high_price_missing_usage")) reasons.push("flagged_high_price_missing_usage");
  if (splitFlags(row.data_quality_flags).includes("club_star_missing_nt_usage")) reasons.push("flagged_club_star_nt_usage_missing");
  if (["unclear_high_price", "club_star_nt_usage_missing"].includes(row.role_label)) {
    reasons.push("high_price_uncertainty_fallback_player");
  }
  return flagsList(reasons);
}

function priorityFor(row, repairRow) {
  const officialId = String(row.official_fantasy_player_id || "");
  const reasons = modelReasons(row, repairRow);
  const price = num(row.official_price) || 0;
  if (["1600", "528", "226", "748", "1274", "1712"].includes(officialId)) return "P0";
  if (splitFlags(row.data_quality_flags).includes("high_price_missing_usage")) return "P0";
  if (["unclear_high_price", "club_star_nt_usage_missing"].includes(row.role_label)) return "P0";
  if (price >= 7 && missingUsage(row)) return "P0";
  if (HOST_COUNTRY_IMPORTANT_IDS.has(officialId) && missingUsage(row)) return "P1";
  if (price >= 6 && ["low", "missing", "thin_profile", "blocked"].includes(row.role_confidence)) return "P1";
  if (reasons.includes("strong_club_context_missing_national_team_usage")) return "P2";
  return "P3";
}

function nationalEvidenceForPlayer(playerId, nationalById, playerById) {
  const national = nationalById.get(playerId) || {};
  const profile = national.national_team_profile || {};
  const player = playerById.get(playerId) || {};
  const caps = num(profile.senior_caps);
  const role = profile.country_role_signal;
  if (!caps || !hasValue(role) || role === "unknown") return null;
  return {
    source_type: "existing_repo_data",
    source_url: Array.isArray(player.source_urls) && player.source_urls.length
      ? player.source_urls.join("|")
      : `${PATHS.nationalPerformance}#${playerId}`,
    source_checked: "2026-05-31",
    evidence_window: "Existing repo national-team profile senior caps/role signal",
    recent_nt_starts: "",
    recent_nt_minutes: "",
    qualifier_starts: "",
    qualifier_minutes: "",
    last_nt_start_date: "",
    role_evidence: role,
    usage_confidence: "low",
    senior_caps: String(caps),
    notes: `Existing national profile carries senior_caps=${caps} and country_role_signal=${role}; no starts or minutes are added.`
  };
}

function importEvidenceForTarget(target, nationalById, playerById) {
  const officialId = String(target.official_fantasy_player_id || "");
  const manual = MANUAL_SOURCE_BACKED_EVIDENCE[officialId];
  if (manual) return { ...manual, senior_caps: "" };

  if (["P0", "P1"].includes(target.priority)) {
    const existing = nationalEvidenceForPlayer(target.internal_player_id, nationalById, playerById);
    if (existing) return existing;
  }

  return {
    source_type: "missing_source_gap",
    source_url: PATHS.repairList,
    source_checked: TODAY,
    evidence_window: "Targeted audit found no source-backed starts, minutes, or role evidence in loaded repo sources.",
    recent_nt_starts: "",
    recent_nt_minutes: "",
    qualifier_starts: "",
    qualifier_minutes: "",
    last_nt_start_date: "",
    role_evidence: "",
    usage_confidence: "missing",
    senior_caps: "",
    notes: "No source-backed national-team usage evidence added for this targeted row."
  };
}

function repoEvidenceStatus(importEvidence) {
  if (importEvidence.source_type === "missing_source_gap") return "missing_source_gap";
  if (hasValue(importEvidence.recent_nt_starts) || hasValue(importEvidence.recent_nt_minutes)) return "source_backed_recent_usage_found";
  if (hasValue(importEvidence.role_evidence)) return "source_backed_role_evidence_only";
  return "manual_review_needed";
}

function buildTargetRows({ repairRows, minutesModel, existingTargets }) {
  if (existingTargets.length) return existingTargets;

  const rowsById = modelById(minutesModel);
  const repairById = indexBy(repairRows, "official_fantasy_player_id");
  const ids = new Set(repairRows.map((row) => String(row.official_fantasy_player_id)));
  HIGH_IMPACT_IDS.forEach((id) => ids.add(id));
  HOST_COUNTRY_IMPORTANT_IDS.forEach((id) => ids.add(id));

  return [...ids]
    .map((id) => {
      const row = rowsById.get(id);
      if (!row) return null;
      const repair = repairById.get(id) || {};
      const priority = priorityFor(row, repair);
      return {
        official_fantasy_player_id: row.official_fantasy_player_id,
        internal_player_id: row.internal_player_id,
        name: row.name,
        country: row.country,
        official_fantasy_position: row.official_fantasy_position,
        official_price: row.official_price,
        priority,
        current_start_probability: row.start_probability ?? "",
        current_expected_minutes: row.expected_minutes ?? "",
        current_role_label: row.role_label,
        current_role_confidence: row.role_confidence,
        missing_fields: repair.missing_fields || (missingUsage(row) ? "national_team_usage|qualifier_minutes|qualifier_starts" : ""),
        reason_for_targeting: modelReasons(row, repair),
        recommended_action: repair.recommended_action || "source_national_team_usage_before_final_minutes_promotion",
        source_gap_type: repair.source_gap_type || (missingUsage(row) ? "true_source_gap" : "manual_review_needed"),
        repo_evidence_status: "",
        planned_import_source_type: "",
        notes: repair.notes || "Added to targeted national-team usage sourcing list."
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };
      return (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9) ||
        (num(b.official_price) || 0) - (num(a.official_price) || 0) ||
        a.country.localeCompare(b.country) ||
        a.name.localeCompare(b.name);
    });
}

function buildImportRows({ targetRows, nationalById, playerById }) {
  return targetRows.map((target) => {
    const evidence = importEvidenceForTarget(target, nationalById, playerById);
    return {
      official_fantasy_player_id: target.official_fantasy_player_id,
      internal_player_id: target.internal_player_id,
      name: target.name,
      country: target.country,
      source_type: evidence.source_type,
      source_url: evidence.source_url,
      source_checked: evidence.source_checked,
      evidence_window: evidence.evidence_window,
      recent_nt_starts: evidence.recent_nt_starts,
      recent_nt_minutes: evidence.recent_nt_minutes,
      qualifier_starts: evidence.qualifier_starts,
      qualifier_minutes: evidence.qualifier_minutes,
      last_nt_start_date: evidence.last_nt_start_date,
      role_evidence: evidence.role_evidence,
      usage_confidence: evidence.usage_confidence,
      notes: evidence.notes,
      senior_caps: evidence.senior_caps || "",
      source_gap_type: target.source_gap_type,
      target_priority: target.priority
    };
  });
}

function usageStatusBefore(target, evidence) {
  if (!evidence || !hasValue(evidence.source_type)) return "missing_source_gap";
  if (evidence.source_type === "missing_source_gap") return "missing_source_gap";
  if (evidence.source_type === "existing_repo_data") return "existing_repo_evidence_used";
  if (hasValue(evidence.recent_nt_starts) || hasValue(evidence.recent_nt_minutes) ||
      hasValue(evidence.qualifier_starts) || hasValue(evidence.qualifier_minutes)) {
    return "source_backed_usage_found";
  }
  if (hasValue(evidence.role_evidence)) return "source_backed_role_evidence_only";
  return target.source_gap_type || "manual_review_needed";
}

function buildV2TargetRows({ targetRows, importRows, existingTargetsV2 }) {
  if (existingTargetsV2.length) return existingTargetsV2;

  const importById = indexBy(importRows, "official_fantasy_player_id");
  return targetRows
    .filter((target) => ["P0", "P1"].includes(target.priority) || FINAL_PASS_PRIORITY_IDS.has(String(target.official_fantasy_player_id)))
    .map((target) => {
      const evidence = importById.get(String(target.official_fantasy_player_id)) || {};
      const recommendedSourceType = evidence.source_type === "missing_source_gap"
        ? "official_federation_or_confederation_match_report_needed"
        : evidence.source_type;
      return {
        official_fantasy_player_id: target.official_fantasy_player_id,
        internal_player_id: target.internal_player_id,
        name: target.name,
        country: target.country,
        official_fantasy_position: target.official_fantasy_position,
        official_price: target.official_price,
        current_start_probability: target.current_start_probability,
        current_expected_minutes: target.current_expected_minutes,
        current_role_label: target.current_role_label,
        current_role_confidence: target.current_role_confidence,
        priority: target.priority,
        reason_for_priority: target.reason_for_targeting,
        usage_status_before: usageStatusBefore(target, evidence),
        recommended_source_type: recommendedSourceType,
        notes: FINAL_PASS_PRIORITY_IDS.has(String(target.official_fantasy_player_id))
          ? "Named final-pass priority player reviewed in v2."
          : "P0/P1 carry-forward from v1 targeted sourcing list."
      };
    })
    .sort((a, b) => {
      const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };
      return (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9) ||
        (num(b.official_price) || 0) - (num(a.official_price) || 0) ||
        a.country.localeCompare(b.country) ||
        a.name.localeCompare(b.name);
    });
}

function enrichTargetRows(targetRows, importRows) {
  const importById = indexBy(importRows, "official_fantasy_player_id");
  return targetRows.map((target) => {
    const evidence = importById.get(String(target.official_fantasy_player_id)) || {};
    return {
      ...target,
      repo_evidence_status: repoEvidenceStatus(evidence),
      planned_import_source_type: evidence.source_type || "missing_source_gap"
    };
  });
}

function snapshotRows(ids, baselineById, currentById, importById = new Map()) {
  return ids.map((id) => {
    const before = baselineById.get(id) || {};
    const after = currentById.get(id) || {};
    const evidence = importById.get(id) || {};
    return [
      id,
      after.name || before.name || "",
      after.country || before.country || "",
      before.current_role_label || "",
      before.current_role_confidence || "",
      before.current_start_probability || "",
      before.current_expected_minutes || "",
      after.role_label || "",
      after.role_confidence || "",
      after.start_probability ?? "",
      after.expected_minutes ?? "",
      evidence.source_type || "",
      evidence.usage_confidence || ""
    ];
  });
}

function buildReport({ targetRows, importRows, minutesModel, minutesQa }) {
  const currentById = modelById(minutesModel);
  const targetById = indexBy(targetRows, "official_fantasy_player_id");
  const importById = indexBy(importRows, "official_fantasy_player_id");
  const sourceBacked = importRows.filter((row) => row.source_type !== "missing_source_gap" && row.usage_confidence !== "missing");
  const manualSourceBacked = sourceBacked.filter((row) => row.source_type !== "existing_repo_data");
  const existingRepo = sourceBacked.filter((row) => row.source_type === "existing_repo_data");
  const missingRows = importRows.filter((row) => row.source_type === "missing_source_gap");
  const missingP0Rows = missingRows.filter((row) => targetById.get(String(row.official_fantasy_player_id))?.priority === "P0");
  const highPriceMissing = minutesQa.high_price_missing_usage_players || [];
  const lowConfidenceAfter = minutesQa.summary?.low_confidence_modeled_rows ||
    (minutesModel.summary?.low_confidence_modeled_rows ?? "");
  const priorityCounts = sortedEntries(countBy(targetRows, "priority"));
  const sourceCounts = sortedEntries(countBy(importRows, "source_type"));
  const importPreview = sourceBacked.slice(0, 25).map((row) => [
    row.official_fantasy_player_id,
    row.name,
    row.country,
    row.source_type,
    row.recent_nt_starts,
    row.recent_nt_minutes,
    row.role_evidence,
    row.usage_confidence
  ]);

  return [
    "# Targeted National-Team Usage Sourcing Report v1",
    "",
    `Generated: ${TODAY}`,
    "",
    "## Scope",
    "",
    "This is a targeted `fantasy_pool_only` national-team usage sourcing layer for high-impact low-confidence players. It does not rerun score predictions, matchday projections, recommendations, Team Builder, captain/substitution logic, browser-ready files, or UX.",
    "",
    "## Summary",
    "",
    markdownTable(["Metric", "Count"], [
      ["Targeted players", targetRows.length],
      ["P0 targets", countBy(targetRows, "priority").P0 || 0],
      ["P1 targets", countBy(targetRows, "priority").P1 || 0],
      ["P2 targets", countBy(targetRows, "priority").P2 || 0],
      ["P3 targets", countBy(targetRows, "priority").P3 || 0],
      ["Players sourced from existing repo data", existingRepo.length],
      ["Players sourced from new manual source-backed data", manualSourceBacked.length],
      ["Players still missing source-backed usage", missingRows.length],
      ["Source-backed usage rows added", sourceBacked.length],
      ["Low-confidence modeled rows after", lowConfidenceAfter],
      ["High-price missing-usage count after", highPriceMissing.length]
    ]),
    "",
    "## Priority Counts",
    "",
    markdownTable(["Priority", "Rows"], priorityCounts),
    "",
    "## Import Source Counts",
    "",
    markdownTable(["Source type", "Rows"], sourceCounts),
    "",
    "## Source-Backed Rows Added",
    "",
    markdownTable(
      ["Official ID", "Name", "Country", "Source type", "Recent starts", "Recent minutes", "Role evidence", "Confidence"],
      importPreview
    ),
    "",
    "## Required Before/After Checks",
    "",
    markdownTable(
      ["Official ID", "Name", "Country", "Before role", "Before confidence", "Before start", "Before minutes", "After role", "After confidence", "After start", "After minutes", "Source type", "Usage confidence"],
      snapshotRows(["1600", "528", "1712", "226", "748", "1274"], targetById, currentById, importById)
    ),
    "",
    "## Still Missing Source-Backed Usage",
    "",
    markdownTable(
      ["Official ID", "Name", "Country", "Priority", "Reason", "Recommended action"],
      missingRows.slice(0, 30).map((row) => {
        const target = targetById.get(String(row.official_fantasy_player_id)) || {};
        return [
          row.official_fantasy_player_id,
          row.name,
          row.country,
          target.priority || "",
          target.reason_for_targeting || "",
          target.recommended_action || ""
        ];
      })
    ),
    "",
    "## Safety Notes",
    "",
    "- Added starts/minutes/role fields are present only where a source URL and checked date are recorded.",
    "- Rows with `missing_source_gap` do not add usage values and should not change the enrichment output.",
    "- Existing repo caps/role evidence is imported as low-confidence role evidence only unless a separate official line-up or stats source was checked.",
    "- Missing national-team usage remains missing; it is not treated as average.",
    "- This remains `fantasy_pool_only`, not final-squad-ready, not safe for final public recommendations, and not safe for final Team Builder promotion.",
    "",
    "## Remaining Warnings And Promotion Blockers",
    "",
    "- Preliminary `fantasy_pool_only` score/projection staging is safer after this pass, but it should keep explicit warnings for remaining missing-source rows.",
    missingP0Rows.length
      ? `- Remaining P0 missing-source cases: ${missingP0Rows.map((row) => row.name).join(", ")}.`
      : "- No P0 rows remain in `missing_source_gap` after this pass.",
    "- Final squads are still not source-backed and remain a final-promotion blocker.",
    "- Official rules still have manual-review warnings and remain a final-promotion blocker.",
    "- Browser-ready files were intentionally not regenerated and must not be promoted from this staging pass.",
    ""
  ].join("\n");
}

function buildReportV2({ targetRowsV2, importRows, minutesModel, minutesQa }) {
  const currentById = modelById(minutesModel);
  const targetById = indexBy(targetRowsV2, "official_fantasy_player_id");
  const importById = indexBy(importRows, "official_fantasy_player_id");
  const targetIds = new Set(targetRowsV2.map((row) => String(row.official_fantasy_player_id)));
  const importRowsV2 = importRows.filter((row) => targetIds.has(String(row.official_fantasy_player_id)));
  const sourceBackedV2 = importRowsV2.filter((row) => row.source_type !== "missing_source_gap" && row.usage_confidence !== "missing");
  const newSourceBacked = sourceBackedV2.filter((row) => FINAL_PASS_SOURCE_BACKED_IDS.has(String(row.official_fantasy_player_id)));
  const missingRowsV2 = importRowsV2.filter((row) => row.source_type === "missing_source_gap");
  const p0Missing = missingRowsV2.filter((row) => targetById.get(String(row.official_fantasy_player_id))?.priority === "P0");
  const sourceUrlsUsed = newSourceBacked.map((row) => [
    row.official_fantasy_player_id,
    row.name,
    row.country,
    row.source_type,
    row.source_url
  ]);
  const sixIds = ["1712", "1369", "531", "270", "1493", "1683"];
  const lowConfidenceAfter = minutesQa.summary?.low_confidence_modeled_rows ||
    (minutesModel.summary?.low_confidence_modeled_rows ?? "");
  const highPriceFallbackAfter = minutesModel.summary?.high_price_uncertainty_fallback_players ??
    ((minutesQa.high_price_uncertainty_fallback_players || []).length);

  return [
    "# Targeted National-Team Usage Sourcing Report v2",
    "",
    `Generated: ${TODAY}`,
    "",
    "## Scope",
    "",
    "This final targeted pass reviews the remaining high-impact `P0`/`P1` national-team usage gaps for the `fantasy_pool_only` minutes model. It does not rerun score predictions, matchday projections, recommendations, Team Builder, captain/substitution logic, browser-ready files, or UX.",
    "",
    "Every output remains `fantasy_pool_only`, not final-squad-ready, not safe for final public recommendations, and not safe for final Team Builder promotion.",
    "",
    "## Summary",
    "",
    markdownTable(["Metric", "Count"], [
      ["P0/P1 players reviewed", targetRowsV2.length],
      ["P0 reviewed", countBy(targetRowsV2, "priority").P0 || 0],
      ["P1 reviewed", countBy(targetRowsV2, "priority").P1 || 0],
      ["Source-backed v2 import rows", sourceBackedV2.length],
      ["Source-backed rows added in this final pass", newSourceBacked.length],
      ["Players still source gaps in v2", missingRowsV2.length],
      ["Remaining P0 source gaps", p0Missing.length],
      ["Low-confidence modeled rows after", lowConfidenceAfter],
      ["High-price uncertainty fallback count after", highPriceFallbackAfter]
    ]),
    "",
    "## Six Priority Players Before And After",
    "",
    markdownTable(
      ["Official ID", "Name", "Country", "Before role", "Before confidence", "Before start", "Before minutes", "After role", "After confidence", "After start", "After minutes", "Source type", "Usage confidence"],
      snapshotRows(sixIds, targetById, currentById, importById)
    ),
    "",
    "## Players Improved",
    "",
    markdownTable(
      ["Official ID", "Name", "Country", "Source type", "Recent starts", "Recent minutes", "Role evidence", "Confidence"],
      newSourceBacked.map((row) => [
        row.official_fantasy_player_id,
        row.name,
        row.country,
        row.source_type,
        row.recent_nt_starts,
        row.recent_nt_minutes,
        row.role_evidence,
        row.usage_confidence
      ])
    ),
    "",
    "## Players Still Source Gaps",
    "",
    markdownTable(
      ["Official ID", "Name", "Country", "Priority", "Reason", "Needed source"],
      missingRowsV2.slice(0, 40).map((row) => {
        const target = targetById.get(String(row.official_fantasy_player_id)) || {};
        return [
          row.official_fantasy_player_id,
          row.name,
          row.country,
          target.priority || "",
          target.reason_for_priority || "",
          "Official federation/confederation lineup or stats source with starts, minutes, or explicit role."
        ];
      })
    ),
    "",
    "## Source URLs Used",
    "",
    markdownTable(["Official ID", "Name", "Country", "Source type", "Source URL"], sourceUrlsUsed),
    "",
    "## Remaining P0 Blockers",
    "",
    p0Missing.length
      ? markdownTable(
        ["Official ID", "Name", "Country", "Reason"],
        p0Missing.map((row) => {
          const target = targetById.get(String(row.official_fantasy_player_id)) || {};
          return [row.official_fantasy_player_id, row.name, row.country, target.reason_for_priority || ""];
        })
      )
      : "No P0 row remains in `missing_source_gap`.",
    "",
    "## Score Predictor Staging Decision",
    "",
    "- It is now reasonable to proceed to score predictor v3 staging only if that stage keeps the `fantasy_pool_only` label, carries the missing-usage warnings, and blocks final promotion.",
    "- It is not safe for final public recommendations or final Team Builder promotion because source-backed final squads, final browser-ready regeneration, and official-rules manual-review warnings remain unresolved.",
    "- Neymar remains a P0 source gap: current checked sources provide injury/return/squad context, but not clean starts, minutes, or a source-backed role label.",
    "- Rows with `missing_source_gap` do not add starts, minutes, or role values.",
    ""
  ].join("\n");
}

async function main() {
  await mkdir(path.dirname(PATHS.targetedImport), { recursive: true });

  const [
    minutesModel,
    minutesQa,
    repairRows,
    existingTargets,
    existingTargetsV2,
    nationalData,
    playersData
  ] = await Promise.all([
    readJson(PATHS.minutesModel),
    readJson(PATHS.minutesQa),
    readCsv(PATHS.repairList),
    readCsvIfExists(PATHS.targetList),
    readCsvIfExists(PATHS.targetListV2),
    readJson(PATHS.nationalPerformance),
    readJson(PATHS.players)
  ]);

  const nationalById = indexBy(nationalData.nationalTeamPerformance || [], "player_id");
  const playerById = indexBy(playersData.players || [], "player_id");
  const targetRows = buildTargetRows({ repairRows, minutesModel, existingTargets });
  const importRows = buildImportRows({ targetRows, nationalById, playerById });
  const enrichedTargets = enrichTargetRows(targetRows, importRows);
  const targetRowsV2 = buildV2TargetRows({
    targetRows: enrichedTargets,
    importRows,
    existingTargetsV2
  });

  await writeFile(PATHS.targetList, toCsv(TARGET_HEADERS, enrichedTargets), "utf8");
  await writeFile(PATHS.targetListV2, toCsv(TARGET_V2_HEADERS, targetRowsV2), "utf8");
  await writeFile(PATHS.targetedImport, toCsv(IMPORT_HEADERS, importRows), "utf8");
  await writeFile(PATHS.report, buildReport({
    targetRows: enrichedTargets,
    importRows,
    minutesModel,
    minutesQa
  }), "utf8");
  await writeFile(PATHS.reportV2, buildReportV2({
    targetRowsV2,
    importRows,
    minutesModel,
    minutesQa
  }), "utf8");

  console.log(`${PATHS.targetList}: ${enrichedTargets.length} targeted players`);
  console.log(`${PATHS.targetListV2}: ${targetRowsV2.length} targeted players`);
  console.log(`${PATHS.targetedImport}: ${importRows.length} import rows`);
  console.log(`${PATHS.report}: written`);
  console.log(`${PATHS.reportV2}: written`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
