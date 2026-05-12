const fs = require("fs");
const path = require("path");

const projectDir = __dirname;
const playersPath = path.join(projectDir, "players.json");
const mappingsPath = path.join(projectDir, "countryMappings.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

const players = readJson(playersPath);
const mappingFile = readJson(mappingsPath);
const mappings = mappingFile.mappings || {};

let updatedCount = 0;
let remainingCount = 0;

// Keep country mapping separate from the raw player data source.
const updatedPlayers = players.map((player) => {
  const mapping = mappings[player.id];

  if (!mapping || !mapping.country) {
    remainingCount += 1;
    return player;
  }

  updatedCount += 1;

  return {
    ...player,
    country: mapping.country,
    source_note: `${player.source_note} Country mapped from countryMappings.json. ${mapping.source_note || ""}`.trim()
  };
});

writeJson(playersPath, updatedPlayers);

console.log(`Updated countries for ${updatedCount} players.`);
console.log(`Still marked as needs_check: ${remainingCount} players.`);
