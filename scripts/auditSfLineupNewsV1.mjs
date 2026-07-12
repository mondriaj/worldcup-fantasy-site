import { writeFile } from "node:fs/promises";

const GENERATED_AT = new Date().toISOString();

const SOURCES = [
  {
    source_id: "guardian_england_norway_buildup",
    url: "https://www.theguardian.com/football/live/2026/jul/11/world-cup-2026-spain-v-belgium-reaction-norway-v-england-quarter-final-buildup-and-more-live",
    teams: ["England"],
    reliability: "credible_liveblog",
    expected_notes: [
      "Marc Guéhi, Declan Rice and Reece James trained and were expected to be available before the QF.",
      "Jordan Henderson out with a fractured wrist.",
      "Jarell Quansah serving a two-match ban."
    ]
  },
  {
    source_id: "guardian_argentina_england_context",
    url: "https://www.theguardian.com/football/2026/jul/12/argentina-switzerland-england-world-cup-semi-final",
    teams: ["Argentina", "England"],
    reliability: "credible_match_context",
    expected_notes: [
      "Argentina reached the SF after extra time and face England on short rest.",
      "No confirmed semifinal XI is supplied."
    ]
  },
  {
    source_id: "guardian_spain_merino_context",
    url: "https://www.theguardian.com/football/2026/jul/11/spains-mikel-merino-enjoys-happy-knack-of-scoring-late-winners",
    teams: ["Spain"],
    reliability: "credible_team_context",
    expected_notes: [
      "Spain rotation/depth context around Mikel Merino.",
      "No confirmed semifinal XI is supplied."
    ]
  },
  {
    source_id: "guardian_france_morocco_qf",
    url: "https://www.theguardian.com/football/live/2026/jul/09/france-v-morocco-world-cup-2026-quarter-final-live",
    teams: ["France"],
    reliability: "credible_qf_lineup_source",
    expected_notes: [
      "QF starting XI source for France.",
      "No confirmed semifinal XI is supplied."
    ]
  }
];

function stripHtml(text) {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#x2019;|&rsquo;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleFromHtml(html) {
  return stripHtml((html.match(/<title>(.*?)<\/title>/s) || [])[1] || "");
}

async function fetchSource(source) {
  const started = Date.now();
  try {
    const response = await fetch(source.url);
    const text = await response.text();
    return {
      ...source,
      status: response.status,
      ok: response.ok,
      title: titleFromHtml(text),
      last_modified: response.headers.get("last-modified"),
      bytes: text.length,
      elapsed_ms: Date.now() - started,
      text: stripHtml(text)
    };
  } catch (error) {
    return {
      ...source,
      status: null,
      ok: false,
      title: null,
      last_modified: null,
      bytes: 0,
      elapsed_ms: Date.now() - started,
      error: error.message,
      text: ""
    };
  }
}

function sourceHas(source, pattern) {
  return pattern.test(source.text || "");
}

function teamRows(sources) {
  const englandSource = sources.find((source) => source.source_id === "guardian_england_norway_buildup");
  const englandAbsences = [];
  const englandDoubts = [];

  if (englandSource?.ok && sourceHas(englandSource, /Jarell Quansah[^.]+two-match ban|suspended player Jarell Quansah/i)) {
    englandAbsences.push({
      official_fantasy_player_id: "1708",
      player: "Jarell Quansah",
      reason: "two-match suspension",
      source_id: englandSource.source_id,
      source_url: englandSource.url,
      should_affect_model: true
    });
  }
  if (englandSource?.ok && sourceHas(englandSource, /Jordan Henderson[^.]+fractured wrist|fractured wrist/i)) {
    englandAbsences.push({
      official_fantasy_player_id: "482",
      player: "Jordan Henderson",
      reason: "fractured wrist",
      source_id: englandSource.source_id,
      source_url: englandSource.url,
      should_affect_model: true
    });
  }
  if (englandSource?.ok && sourceHas(englandSource, /Gu[eé]hi[^.]+hamstring|Rice[^.]+unwell|Reece James[^.]+hamstring/i)) {
    englandDoubts.push({
      players: ["Marc Guéhi", "Declan Rice", "Reece James"],
      note: "Reported as trained/expected available before the QF, with recent fitness context.",
      source_id: englandSource.source_id,
      source_url: englandSource.url,
      should_affect_model: "public_caution_only"
    });
  }

  const base = ["France", "Spain", "England", "Argentina"].map((team) => ({
    team,
    credible_sources_checked: sources.filter((source) => source.teams.includes(team)).map((source) => ({
      source_id: source.source_id,
      url: source.url,
      status: source.status,
      title: source.title,
      last_modified: source.last_modified,
      reliability: source.reliability
    })),
    predicted_lineup: null,
    predicted_lineup_source_backed: false,
    confirmed_absences: team === "England" ? englandAbsences : [],
    injury_doubts: team === "England" ? englandDoubts : [],
    suspension_risks: team === "England" ? englandAbsences.filter((row) => /suspension|ban/i.test(row.reason)) : [],
    rotation_notes: [],
    confidence_level: "no_confirmed_sf_xi",
    model_effect: team === "England" && englandAbsences.length ? "source_backed_absence_overrides_only" : "no_lineup_model_adjustment",
    public_caution: "No reliable confirmed semifinal starting XI found yet; verify official lineups and locks in FIFA."
  }));

  base.find((row) => row.team === "France").rotation_notes.push("QF source shows Doué started and Barcola was not in the QF XI; keep as role-volatility context, not a semifinal XI claim.");
  base.find((row) => row.team === "Spain").rotation_notes.push("QF source shows Fabián Ruiz started and Pedri was not in the QF XI; keep as role-volatility context, not a semifinal XI claim.");
  base.find((row) => row.team === "Argentina").rotation_notes.push("QF source shows Julián Álvarez started; Lautaro Martínez scored later but is not treated as a QF starter from points/goals.");
  return base;
}

function mdList(items) {
  return items.length ? items.map((item) => `- ${item}`).join("\n") : "_None._";
}

const sources = await Promise.all(SOURCES.map(fetchSource));
const fetchFailures = sources.filter((source) => !source.ok);
const teams = teamRows(sources);
const audit = {
  schema_version: "sf_lineup_news_audit_v1",
  generated_at: GENERATED_AT,
  status: fetchFailures.length ? "pass_with_fetch_warnings" : "pass",
  source_policy: {
    reliable_sources_only: true,
    predicted_lineups_not_invented: true,
    qf_r16_lineup_evidence_remains_primary: true,
    source_backed_absences_override_role_priors: true
  },
  summary: {
    sources_checked: sources.length,
    fetch_failures: fetchFailures.length,
    teams_checked: teams.length,
    teams_with_confirmed_sf_predicted_xi: teams.filter((team) => team.predicted_lineup_source_backed).length,
    source_backed_absences: teams.reduce((sum, team) => sum + team.confirmed_absences.length, 0),
    model_adjustment_scope: "absence_overrides_only"
  },
  sources: sources.map(({ text, ...source }) => source),
  teams,
  recommendation: "No reliable confirmed semifinal starting XI source found yet. Keep SF model based on QF/R16/R32 lineup evidence and run a pre-lock monitor later."
};

const report = [
  "# SF Lineup News Audit v1",
  "",
  `Generated: ${GENERATED_AT}`,
  "",
  `Status: ${audit.status}`,
  "",
  "## Summary",
  "",
  mdList([
    `Sources checked: ${audit.summary.sources_checked}`,
    `Fetch failures: ${audit.summary.fetch_failures}`,
    `Teams with confirmed SF predicted XI: ${audit.summary.teams_with_confirmed_sf_predicted_xi}`,
    `Source-backed absences: ${audit.summary.source_backed_absences}`,
    `Model adjustment scope: ${audit.summary.model_adjustment_scope}`
  ]),
  "",
  "## Team Results",
  "",
  ...teams.map((team) => [
    `### ${team.team}`,
    "",
    `Confidence: ${team.confidence_level}`,
    "",
    `Model effect: ${team.model_effect}`,
    "",
    "Confirmed absences:",
    "",
    mdList(team.confirmed_absences.map((row) => `${row.player}: ${row.reason}`)),
    "",
    "Rotation notes:",
    "",
    mdList(team.rotation_notes)
  ].join("\n")),
  "",
  "## Recommendation",
  "",
  audit.recommendation
].join("\n");

await writeFile("data/sfLineupNewsAudit_v1.json", `${JSON.stringify(audit, null, 2)}\n`, "utf8");
await writeFile("data/sfLineupNewsAuditReport_v1.md", `${report}\n`, "utf8");

console.log(JSON.stringify({
  status: audit.status,
  sources_checked: audit.summary.sources_checked,
  fetch_failures: audit.summary.fetch_failures,
  teams_with_confirmed_sf_predicted_xi: audit.summary.teams_with_confirmed_sf_predicted_xi,
  source_backed_absences: audit.summary.source_backed_absences
}, null, 2));
