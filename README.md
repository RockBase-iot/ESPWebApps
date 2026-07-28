# ESPWebApps Open-Source Firmware Hub for ESP32

English | [简体中文](README_zh.md)

ESPWebApps is the firmware aggregation repository for RockBase IoT Web Flasher.

- Web flasher: https://flash.rockbaseiot.com
- Runtime model: root [apps.json](apps.json) + per-app [manifest.json](bruce/manifest.json) dynamic loading
- Collaboration model: fork this repository, add/update app folders, submit PR

## Overview

Each app is maintained as a folder in this repository (not as a separate submodule).
The frontend is path-driven, so new app folders can be added without changing loader code.

Each app should include:

- `<app-id>/manifest.json`
- `<app-id>/assets/` (logo, product image)
- `<app-id>/<version>/<device>/...` firmware files

## Repository Layout

```text
apps.json
bruce/
  manifest.json
  assets/
  <version>/<device>/...
deskbuddy/
espclaw/
marauder/
```

Recommended per-app structure:

```text
manifest.json
assets/
  logo.svg|png|jpg
  product.png|jpg
<version>/<device>/
  firmware.bin
  bootloader.bin    # optional
  partitions.bin    # optional
  boot_app0.bin     # optional
README.md           # optional
```

## apps.json Rules

`apps.json` is the single index consumed by the frontend.

```json
{
  "schemaVersion": 1,
  "defaultApp": "bruce",
  "apps": [
    { "id": "bruce", "manifest": "bruce/manifest.json" }
  ]
}
```

Rules:

- Generate `apps.json` via script instead of manual editing
- Keep `defaultApp` explicit
- Keep app ordering stable (sorted by `id`)

## Manifest Minimum Spec

Required fields:

- `schemaVersion`
- `id`
- `name`
- `homepage`
- `logo`
- `defaultDevice`
- `defaultVersion`
- `fileSets`
- `devices`
- `versions`

Path placeholders:

- `{app}`, `{version}`, `{device}`
- Example: `{app}/{version}/{device}/firmware.bin`

## Contribution Workflow (Fork + PR)

1. Fork this repository.
2. Add or update app folder content.
3. Regenerate index and run validation locally.
4. Commit and open a pull request.
5. After merge, sync repository on flasher server.

Example:

```bash
node scripts/generate-apps-index.mjs --write --include-legacy
node scripts/validate-manifests.mjs --skip-file-check
git add .
git commit -m "feat(apps): add myapp"
```

## Automation Scripts

Available scripts:

- `scripts/generate-apps-index.mjs`
- `scripts/validate-manifests.mjs`
- `scripts/create-app-template.mjs`

`package.json` shortcuts:

```bash
npm run apps:index
npm run apps:validate
npm run apps:template -- <app-id>
```

Direct usage:

```bash
# Regenerate apps index
node scripts/generate-apps-index.mjs --write --include-legacy

# Validate manifest schema and index references
node scripts/validate-manifests.mjs --skip-file-check

# Strict validation including firmware file existence
node scripts/validate-manifests.mjs

# Create a new app template in repository root
node scripts/create-app-template.mjs myapp --version v0.1.0 --device nm-cyd-c5 --chip esp32c5

# Preview template only
node scripts/create-app-template.mjs myapp --dry-run
```

## GitHub Actions CI Gate

Implemented workflow: [.github/workflows/ci.yml](.github/workflows/ci.yml)

Trigger:

- Pull requests to `main`
- Manual run (`workflow_dispatch`)

Gate checks:

1. Regenerate `apps.json`
2. Fail if PR did not include regenerated `apps.json`
3. Validate manifests with `--skip-file-check`

## Server Sync

After PR merge to `main`, sync this repository on the Web Serial Flasher server.
Once synced, new firmware entries are available online:

- https://flash.rockbaseiot.com
