# ESPWebApps ESP32 开源固件聚合仓库

[English](README.md) | 简体中文

ESPWebApps 是 RockBase IoT Web Flasher 的固件聚合仓库。

- Web 下载页面：https://flash.rockbaseiot.com
- 运行模式：根目录 [apps.json](apps.json) + 各应用 [manifest.json](bruce/manifest.json) 动态加载
- 协作模式：Fork 本仓库，新增或更新应用目录后提交 PR

## 概览

每个应用都以目录形式维护在本仓库中。
前端是路径驱动加载，因此新增应用目录无需修改加载逻辑。

每个应用建议包含：

- `<app-id>/manifest.json`
- `<app-id>/assets/`（logo、产品图）
- `<app-id>/<version>/<device>/...` 固件文件

## 仓库结构

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

推荐应用目录规范：

```text
manifest.json
assets/
  logo.svg|png|jpg  # 推荐svg格式，推荐尺寸：512*512
  product.png|jpg   # 推荐png格式，推荐尺寸：1200*400
<version>/<device>/
  firmware.bin
  bootloader.bin    # 可选
  partitions.bin    # 可选
  boot_app0.bin     # 可选
README.md           # 可选
```

## apps.json 规则

`apps.json` 是前端唯一应用索引。

```json
{
  "schemaVersion": 1,
  "defaultApp": "bruce",
  "apps": [
    { "id": "bruce", "manifest": "bruce/manifest.json" }
  ]
}
```

规则建议：

- 使用脚本自动生成 `apps.json`，避免手工维护
- 明确设置 `defaultApp`
- 应用列表按 `id` 稳定排序

## Manifest 最小规范

必填字段：

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

路径占位符：

- `{app}`、`{version}`、`{device}`
- 示例：`{app}/{version}/{device}/firmware.bin`

## 贡献流程（Fork + PR）

1. Fork 本仓库。
2. 新增或更新应用目录内容。
3. 本地执行索引生成与校验。
4. 提交代码并发起 PR。
5. 合并后在服务器同步仓库。

示例命令：

```bash
node scripts/generate-apps-index.mjs --write --include-legacy
node scripts/validate-manifests.mjs --skip-file-check
git add .
git commit -m "feat(apps): add myapp"
```

## 自动化脚本

已提供脚本：

- `scripts/generate-apps-index.mjs`
- `scripts/validate-manifests.mjs`
- `scripts/create-app-template.mjs`

`package.json` 快捷命令：

```bash
npm run apps:index
npm run apps:validate
npm run apps:template -- <app-id>
```

直接使用示例：

```bash
# 生成 apps 索引
node scripts/generate-apps-index.mjs --write --include-legacy

# 校验索引引用与 manifest 结构
node scripts/validate-manifests.mjs --skip-file-check

# 严格校验（包含固件文件存在性检查）
node scripts/validate-manifests.mjs

# 在仓库根目录创建新应用模板
node scripts/create-app-template.mjs myapp --version v0.1.0 --device nm-cyd-c5 --chip esp32c5

# 仅预览模板输出，不写文件
node scripts/create-app-template.mjs myapp --dry-run
```

## GitHub Actions CI 门禁

已实现工作流：[.github/workflows/ci.yml](.github/workflows/ci.yml)

触发方式：

- PR 到 `main`
- 手动触发（`workflow_dispatch`）

门禁检查：

1. 重新生成 `apps.json`
2. 若 PR 未提交最新 `apps.json` 则失败
3. 使用 `--skip-file-check` 校验 manifest

## 服务器同步

PR 合并到 `main` 后，在 Web Serial Flasher 服务器同步本仓库。
同步完成后，新的固件条目即可在线下载：

- https://flash.rockbaseiot.com
