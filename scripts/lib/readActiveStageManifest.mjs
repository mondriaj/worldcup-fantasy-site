import fs from "node:fs";
import path from "node:path";

const PROJECT_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const DEFAULT_MANIFEST_PATH = "data/activeStageManifest_v1.json";

export function projectPath(relativePath) {
  return path.join(PROJECT_ROOT, relativePath);
}

export function readJsonFile(relativePath) {
  return JSON.parse(fs.readFileSync(projectPath(relativePath), "utf8"));
}

export function readActiveStageManifest(relativePath = DEFAULT_MANIFEST_PATH) {
  const manifest = readJsonFile(relativePath);
  const requiredFields = ["activeStage", "publicVersion", "pages", "files", "wrappers", "validators", "blockedGlobals"];
  const missing = requiredFields.filter((field) => manifest[field] === undefined);
  if (missing.length) {
    throw new Error(`Active stage manifest is missing required fields: ${missing.join(", ")}`);
  }
  return manifest;
}

export function manifestFile(manifest, key) {
  const value = manifest.files?.[key];
  if (!value) throw new Error(`Active stage manifest missing files.${key}`);
  return value;
}

export function manifestWrapper(manifest, key) {
  const value = manifest.wrappers?.[key];
  if (!value) throw new Error(`Active stage manifest missing wrappers.${key}`);
  return value;
}

export function manifestValidator(manifest, key) {
  const value = manifest.validators?.[key];
  if (!value) throw new Error(`Active stage manifest missing validators.${key}`);
  return value;
}

export function manifestPageScripts(manifest, page) {
  const entry = manifest.publicWiring?.pages?.[page];
  return Array.isArray(entry?.scripts) ? entry.scripts : [];
}

export function manifestBlockedGlobals(manifest) {
  return Array.isArray(manifest.blockedGlobals) ? manifest.blockedGlobals : [];
}
