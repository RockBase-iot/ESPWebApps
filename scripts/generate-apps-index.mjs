#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const args = process.argv.slice(2);

function parseArgs(argv) {
  const options = {
    write: false,
    includeLegacy: false,
    appsDir: "APPS",
    output: "apps.json",
    defaultApp: ""
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--write") {
      options.write = true;
    } else if (arg === "--include-legacy") {
      options.includeLegacy = true;
    } else if (arg.startsWith("--apps-dir=")) {
      options.appsDir = arg.slice("--apps-dir=".length).trim();
    } else if (arg === "--apps-dir") {
      options.appsDir = (argv[i + 1] || "").trim();
      i += 1;
    } else if (arg.startsWith("--output=")) {
      options.output = arg.slice("--output=".length).trim();
    } else if (arg === "--output") {
      options.output = (argv[i + 1] || "").trim();
      i += 1;
    } else if (arg.startsWith("--default-app=")) {
      options.defaultApp = arg.slice("--default-app=".length).trim();
    } else if (arg === "--default-app") {
      options.defaultApp = (argv[i + 1] || "").trim();
      i += 1;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  if (!options.appsDir) {
    options.appsDir = "APPS";
  }
  if (!options.output) {
    options.output = "apps.json";
  }

  return options;
}

function printHelp() {
  console.log(`Usage: node scripts/generate-apps-index.mjs [options]\n\nOptions:\n  --write                 Write to output file (default: print JSON only)\n  --apps-dir <dir>        Submodule directory (default: APPS)\n  --include-legacy        Also scan root-level app folders\n  --output <file>         Output index file (default: apps.json)\n  --default-app <id>      Force defaultApp if id exists\n  -h, --help              Show this help\n`);
}

function exists(absPath) {
  return fs.existsSync(absPath);
}

function normalizeRel(relPath) {
  return relPath.split(path.sep).join("/");
}

function readJson(absPath) {
  return JSON.parse(fs.readFileSync(absPath, "utf8"));
}

function getAppEntryFromManifest(manifestAbsPath) {
  const manifest = readJson(manifestAbsPath);
  if (!manifest || typeof manifest.id !== "string" || !manifest.id.trim()) {
    throw new Error(`Missing manifest.id in ${manifestAbsPath}`);
  }

  const manifestRel = normalizeRel(path.relative(rootDir, manifestAbsPath));
  return {
    id: manifest.id.trim(),
    manifest: manifestRel
  };
}

function scanSubmoduleApps(submoduleDirName) {
  const results = [];
  const submoduleAbs = path.join(rootDir, submoduleDirName);
  if (!exists(submoduleAbs) || !fs.statSync(submoduleAbs).isDirectory()) {
    return results;
  }

  const children = fs.readdirSync(submoduleAbs, { withFileTypes: true });
  for (const child of children) {
    if (!child.isDirectory()) {
      continue;
    }
    const manifestAbs = path.join(submoduleAbs, child.name, "manifest.json");
    if (!exists(manifestAbs)) {
      continue;
    }
    results.push(getAppEntryFromManifest(manifestAbs));
  }

  return results;
}

function scanLegacyRootApps() {
  const results = [];
  const ignored = new Set([".git", ".vscode", "node_modules", "scripts", "APPS"]);

  const children = fs.readdirSync(rootDir, { withFileTypes: true });
  for (const child of children) {
    if (!child.isDirectory()) {
      continue;
    }
    if (ignored.has(child.name)) {
      continue;
    }

    const manifestAbs = path.join(rootDir, child.name, "manifest.json");
    if (!exists(manifestAbs)) {
      continue;
    }

    results.push(getAppEntryFromManifest(manifestAbs));
  }

  return results;
}

function buildIndex(options) {
  const submoduleApps = scanSubmoduleApps(options.appsDir);
  const useLegacyFallback = submoduleApps.length === 0;

  let entries = [...submoduleApps];
  if (options.includeLegacy || useLegacyFallback) {
    entries = entries.concat(scanLegacyRootApps());
  }

  const idToEntry = new Map();
  for (const entry of entries) {
    if (!idToEntry.has(entry.id)) {
      idToEntry.set(entry.id, entry);
    }
  }

  const apps = [...idToEntry.values()].sort((a, b) => a.id.localeCompare(b.id));

  let existingDefault = "";
  const outputAbs = path.join(rootDir, options.output);
  if (exists(outputAbs)) {
    try {
      const existing = readJson(outputAbs);
      if (existing && typeof existing.defaultApp === "string") {
        existingDefault = existing.defaultApp;
      }
    } catch {
      existingDefault = "";
    }
  }

  const appIds = new Set(apps.map((item) => item.id));
  let defaultApp = "";

  if (options.defaultApp && appIds.has(options.defaultApp)) {
    defaultApp = options.defaultApp;
  } else if (existingDefault && appIds.has(existingDefault)) {
    defaultApp = existingDefault;
  } else if (apps.length > 0) {
    defaultApp = apps[0].id;
  }

  return {
    schemaVersion: 1,
    defaultApp,
    apps
  };
}

function main() {
  const options = parseArgs(args);
  const indexJson = buildIndex(options);
  const serialized = `${JSON.stringify(indexJson, null, 2)}\n`;

  if (!options.write) {
    process.stdout.write(serialized);
    return;
  }

  const outputAbs = path.join(rootDir, options.output);
  fs.writeFileSync(outputAbs, serialized, "utf8");
  console.log(`Wrote ${options.output} with ${indexJson.apps.length} app(s).`);
}

main();
