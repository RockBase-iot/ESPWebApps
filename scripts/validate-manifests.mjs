#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const args = process.argv.slice(2);

function parseArgs(argv) {
  const options = {
    indexPath: "apps.json",
    strictIdMatch: true,
    checkFiles: true
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith("--index=")) {
      options.indexPath = arg.slice("--index=".length).trim();
    } else if (arg === "--index") {
      options.indexPath = (argv[i + 1] || "").trim();
      i += 1;
    } else if (arg === "--no-strict-id-match") {
      options.strictIdMatch = false;
    } else if (arg === "--skip-file-check") {
      options.checkFiles = false;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  if (!options.indexPath) {
    options.indexPath = "apps.json";
  }

  return options;
}

function printHelp() {
  console.log(`Usage: node scripts/validate-manifests.mjs [options]\n\nOptions:\n  --index <path>           apps index path (default: apps.json)\n  --no-strict-id-match     Do not fail if app.id != manifest.id\n  --skip-file-check        Skip firmware file existence checks\n  -h, --help               Show this help\n`);
}

function exists(absPath) {
  return fs.existsSync(absPath);
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function readJson(absPath) {
  const text = fs.readFileSync(absPath, "utf8");
  return JSON.parse(text);
}

function normalize(relPath) {
  return relPath.split(path.sep).join("/");
}

function replaceTokens(template, tokenMap) {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (full, token) => {
    if (Object.prototype.hasOwnProperty.call(tokenMap, token)) {
      return tokenMap[token];
    }
    return full;
  });
}

function isHexOffset(value) {
  return typeof value === "string" && /^0x[0-9a-fA-F]+$/.test(value);
}

function validateManifest({ appEntry, manifest, manifestPath, strictIdMatch, checkFiles, errors }) {
  const requiredFields = [
    "schemaVersion",
    "id",
    "name",
    "homepage",
    "logo",
    "defaultDevice",
    "defaultVersion",
    "fileSets",
    "devices",
    "versions"
  ];

  for (const key of requiredFields) {
    if (!(key in manifest)) {
      errors.push(`[${appEntry.id}] ${manifestPath}: missing required field '${key}'`);
    }
  }

  if (strictIdMatch && manifest.id !== appEntry.id) {
    errors.push(`[${appEntry.id}] ${manifestPath}: manifest.id '${manifest.id}' does not match apps.json id '${appEntry.id}'`);
  }

  if (!isObject(manifest.fileSets)) {
    errors.push(`[${appEntry.id}] ${manifestPath}: fileSets must be an object`);
    return;
  }

  if (!isObject(manifest.devices)) {
    errors.push(`[${appEntry.id}] ${manifestPath}: devices must be an object`);
    return;
  }

  if (!Array.isArray(manifest.versions)) {
    errors.push(`[${appEntry.id}] ${manifestPath}: versions must be an array`);
    return;
  }

  const deviceIds = new Set(Object.keys(manifest.devices));
  const versionIds = new Set();

  for (const [deviceId, deviceValue] of Object.entries(manifest.devices)) {
    if (!isObject(deviceValue)) {
      errors.push(`[${appEntry.id}] ${manifestPath}: devices.${deviceId} must be an object`);
      continue;
    }

    const fileSet = deviceValue.fileSet;
    if (typeof fileSet !== "string" || !(fileSet in manifest.fileSets)) {
      errors.push(`[${appEntry.id}] ${manifestPath}: devices.${deviceId}.fileSet is missing or not defined in fileSets`);
    }
  }

  for (const version of manifest.versions) {
    if (!isObject(version) || typeof version.id !== "string" || !version.id.trim()) {
      errors.push(`[${appEntry.id}] ${manifestPath}: each version must include non-empty string id`);
      continue;
    }

    versionIds.add(version.id);

    if (!Array.isArray(version.devices)) {
      errors.push(`[${appEntry.id}] ${manifestPath}: versions.${version.id}.devices must be an array`);
      continue;
    }

    for (const deviceId of version.devices) {
      if (!deviceIds.has(deviceId)) {
        errors.push(`[${appEntry.id}] ${manifestPath}: versions.${version.id} references unknown device '${deviceId}'`);
      }
    }
  }

  if (!deviceIds.has(manifest.defaultDevice)) {
    errors.push(`[${appEntry.id}] ${manifestPath}: defaultDevice '${manifest.defaultDevice}' is not declared in devices`);
  }

  if (!versionIds.has(manifest.defaultVersion)) {
    errors.push(`[${appEntry.id}] ${manifestPath}: defaultVersion '${manifest.defaultVersion}' is not declared in versions`);
  }

  if (checkFiles) {
    validateFileSets({ appEntry, manifest, manifestPath, errors });
  }
}

function validateFileSets({ appEntry, manifest, manifestPath, errors }) {
  const manifestDirAbs = path.dirname(path.join(rootDir, manifestPath));
  const appDirRel = normalize(path.relative(rootDir, manifestDirAbs));

  for (const version of manifest.versions) {
    if (!isObject(version) || typeof version.id !== "string" || !Array.isArray(version.devices)) {
      continue;
    }

    for (const deviceId of version.devices) {
      const device = manifest.devices[deviceId];
      if (!isObject(device)) {
        continue;
      }

      const fileSetName = device.fileSet;
      const files = manifest.fileSets[fileSetName];
      if (!Array.isArray(files)) {
        continue;
      }

      for (const fileDef of files) {
        if (!isObject(fileDef)) {
          errors.push(`[${appEntry.id}] ${manifestPath}: fileSet '${fileSetName}' contains non-object entry`);
          continue;
        }

        if (typeof fileDef.path !== "string" || !fileDef.path.trim()) {
          errors.push(`[${appEntry.id}] ${manifestPath}: fileSet '${fileSetName}' has missing path`);
          continue;
        }

        if (!isHexOffset(fileDef.offset)) {
          errors.push(`[${appEntry.id}] ${manifestPath}: fileSet '${fileSetName}' path '${fileDef.path}' has invalid offset '${fileDef.offset}'`);
        }

        const tokenMap = {
          app: manifest.id,
          appDir: appDirRel,
          version: version.id,
          device: deviceId
        };

        const candidateA = normalize(replaceTokens(fileDef.path, tokenMap));
        const candidateB = normalize(replaceTokens(fileDef.path, { ...tokenMap, app: appDirRel }));

        const candidates = [...new Set([candidateA, candidateB])];
        const existsAny = candidates.some((candidate) => {
          const abs = path.join(rootDir, candidate);
          return exists(abs);
        });

        if (!existsAny) {
          errors.push(
            `[${appEntry.id}] ${manifestPath}: file does not exist for version='${version.id}', device='${deviceId}', file='${fileDef.label || "unknown"}'. Tried: ${candidates.join(" | ")}`
          );
        }
      }
    }
  }
}

function main() {
  const options = parseArgs(args);
  const indexAbs = path.join(rootDir, options.indexPath);

  if (!exists(indexAbs)) {
    console.error(`Index file not found: ${options.indexPath}`);
    process.exit(1);
  }

  let index;
  try {
    index = readJson(indexAbs);
  } catch (error) {
    console.error(`Failed to parse index JSON: ${options.indexPath}`);
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  if (!isObject(index) || !Array.isArray(index.apps)) {
    console.error(`Invalid index schema in ${options.indexPath}: missing apps array`);
    process.exit(1);
  }

  const errors = [];
  const seenAppIds = new Set();

  for (const appEntry of index.apps) {
    if (!isObject(appEntry) || typeof appEntry.id !== "string" || typeof appEntry.manifest !== "string") {
      errors.push(`Invalid app entry in ${options.indexPath}: ${JSON.stringify(appEntry)}`);
      continue;
    }

    if (seenAppIds.has(appEntry.id)) {
      errors.push(`Duplicate app id in ${options.indexPath}: '${appEntry.id}'`);
    }
    seenAppIds.add(appEntry.id);

    const manifestPath = normalize(appEntry.manifest);
    const manifestAbs = path.join(rootDir, manifestPath);

    if (!exists(manifestAbs)) {
      errors.push(`[${appEntry.id}] manifest not found: ${manifestPath}`);
      continue;
    }

    let manifest;
    try {
      manifest = readJson(manifestAbs);
    } catch (error) {
      errors.push(`[${appEntry.id}] invalid JSON in ${manifestPath}: ${error instanceof Error ? error.message : String(error)}`);
      continue;
    }

    validateManifest({
      appEntry,
      manifest,
      manifestPath,
      strictIdMatch: options.strictIdMatch,
      checkFiles: options.checkFiles,
      errors
    });
  }

  if (errors.length > 0) {
    console.error(`Manifest validation failed with ${errors.length} error(s):`);
    for (const message of errors) {
      console.error(`- ${message}`);
    }
    process.exit(1);
  }

  console.log(`Manifest validation passed for ${index.apps.length} app(s).`);
}

main();
