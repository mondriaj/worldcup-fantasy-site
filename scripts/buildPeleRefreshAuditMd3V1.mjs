import { runStep } from "./lib/md3ReleaseStack.mjs";

const audit = await runStep("pele-audit");
console.log(JSON.stringify({
  status: audit.status,
  pele_source_refreshed: audit.pele_source_refreshed,
  pele_rows_total: audit.pele_rows_total,
  worldCupTeamsWithPele: audit.teamQualityCoverage.worldCupTeamsWithPele,
  missingTeams: audit.teamQualityCoverage.missingTeams.length,
  output_json: "data/peleRefreshAudit_md3_v1.json"
}, null, 2));
if (audit.status !== "GREEN") process.exitCode = 1;
