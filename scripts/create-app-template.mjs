#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const args = process.argv.slice(2);

function parseArgs(argv) {
  const options = {
    appId: "",
    target: ".",
    version: "v0.1.0",
    device: "nm-cyd-c5",
    chip: "esp32c5",
    dryRun: false,
    force: false
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("-") && !options.appId) {
      options.appId = arg.trim();
    } else if (arg.startsWith("--target=")) {
      options.target = arg.slice("--target=".length).trim();
    } else if (arg === "--target") {
      options.target = (argv[i + 1] || "").trim();
      i += 1;
    } else if (arg.startsWith("--version=")) {
      options.version = arg.slice("--version=".length).trim();
    } else if (arg === "--version") {
      options.version = (argv[i + 1] || "").trim();
      i += 1;
    } else if (arg.startsWith("--device=")) {
      options.device = arg.slice("--device=".length).trim();
    } else if (arg === "--device") {
      options.device = (argv[i + 1] || "").trim();
      i += 1;
    } else if (arg.startsWith("--chip=")) {
      options.chip = arg.slice("--chip=".length).trim();
    } else if (arg === "--chip") {
      options.chip = (argv[i + 1] || "").trim();
      i += 1;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--force") {
      options.force = true;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  return options;
}

function printHelp() {
  console.log(`Usage: node scripts/create-app-template.mjs <app-id> [options]\n\nOptions:\n  --target <dir>      Target parent dir (default: repository root)\n  --version <id>      Initial version (default: v0.1.0)\n  --device <id>       Initial device id (default: nm-cyd-c5)\n  --chip <chip>       Chip name (default: esp32c5)\n  --dry-run           Print planned files without writing\n  --force             Allow writing into existing folder\n  -h, --help          Show this help\n`);
}

function validateAppId(appId) {
  return /^[a-z0-9][a-z0-9-]*$/.test(appId);
}

function writeFile(absPath, content, dryRun) {
  if (dryRun) {
    return;
  }
  fs.mkdirSync(path.dirname(absPath), { recursive: true });
  fs.writeFileSync(absPath, content, "utf8");
}

function buildManifest({ appId, version, device, chip }) {
  return {
    schemaVersion: 1,
    id: appId,
    name: appId,
    homepage: "https://github.com/<your-org>/<your-app-repo>",
    logo: "assets/logo.svg",
    defaultDevice: device,
    defaultVersion: version,
    behavior: "console",
    product: {
      link: "https://example.com/product-page",
      image: "assets/product.png"
    },
    fileSets: {
      "single-app": [
        {
          label: "firmware.bin",
          path: "{app}/{version}/{device}/firmware.bin",
          offset: "0x0"
        }
      ]
    },
    devices: {
      [device]: {
        displayName: device.toUpperCase(),
        chip,
        fileSet: "single-app"
      }
    },
    versions: [
      {
        id: version,
        devices: [device]
      }
    ]
  };
}

function buildReadme({ appId, version, device }) {
  return `# ${appId}\n\nFirmware package for ESP web flashing.\n\n## Layout\n\n- manifest.json\n- assets/logo.svg\n- assets/product.png\n- ${version}/${device}/firmware.bin\n\n## Notes\n\n- Update homepage, product link, and assets before publishing.\n- Replace placeholder firmware.bin with real build output.\n`;
}

function buildSvgLogo(label) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">\n  <rect width="256" height="256" fill="#0f172a"/>\n  <circle cx="128" cy="128" r="88" fill="#22c55e"/>\n  <text x="128" y="140" text-anchor="middle" fill="#0f172a" font-size="34" font-family="Arial, sans-serif">${label}</text>\n</svg>\n`;
}

function main() {
  const options = parseArgs(args);

  if (!options.appId) {
    printHelp();
    process.exit(1);
  }

  if (!validateAppId(options.appId)) {
    console.error("Invalid app id. Use lowercase letters, digits, and '-' only.");
    process.exit(1);
  }

  const appRoot = path.join(rootDir, options.target, options.appId);
  const exists = fs.existsSync(appRoot);

  if (exists && !options.force) {
    console.error(`Target already exists: ${path.relative(rootDir, appRoot)} (use --force to overwrite files)`);
    process.exit(1);
  }

  const manifest = buildManifest(options);
  const manifestText = `${JSON.stringify(manifest, null, 2)}\n`;

  const files = [
    { rel: path.join(options.target, options.appId, "manifest.json"), content: manifestText },
    { rel: path.join(options.target, options.appId, "README.md"), content: buildReadme(options) },
    { rel: path.join(options.target, options.appId, "assets", "logo.svg"), content: buildSvgLogo(options.appId.slice(0, 3).toUpperCase()) },
    { rel: path.join(options.target, options.appId, "assets", "product.png"), content: "placeholder\n" },
    { rel: path.join(options.target, options.appId, options.version, options.device, "firmware.bin"), content: "" }
  ];

  for (const file of files) {
    const abs = path.join(rootDir, file.rel);
    writeFile(abs, file.content, options.dryRun);
  }

  const fileList = files.map((file) => file.rel.split(path.sep).join("/")).join("\n- ");
  if (options.dryRun) {
    console.log(`Dry run: would create\n- ${fileList}`);
  } else {
    console.log(`Template created for '${options.appId}' in '${options.appId}' under the repository root.`);
    console.log(`Files created:\n- ${fileList}`);
  }
}

main();
