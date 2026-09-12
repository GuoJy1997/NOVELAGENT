# 笔心 uizip 资产生产与 QA（GPT Image 2）

本指南只覆盖 `2026-08-28-uizip-route-pages-retrofit-plan.md` 中的位图资产生产。所有成品（不含不入库的角色设定板）写入：

```text
D:/NOVELAGENT/apps/web/src/assets/bixin/uizip-generated/
```

这是一个显式 CLI/API 工作流：仅在操作者明确选择该路径时使用 bundled `image_gen.py`。不要写自定义 SDK runner，也不要修改技能脚本。常规图片请求仍优先走内建 image-generation 工具。

## 前置条件与安全边界

- `OPENAI_API_KEY` 必须已在本机环境中配置；不要将其写进 JSONL、日志、文档或聊天。
- Python 环境必须具备 `openai`；chroma-key QA/去背还需要 `Pillow`。ImageMagick 可作为额外人工检查工具，但不是本流程的替代品。
- CLI 调用需要允许出站网络并可能需要审批。先用 `--dry-run` 检查 payload 与目标文件名；它不会调用 API。
- 所有示例都显式使用 `--model gpt-image-2`、PNG 和 `--quality high`。不要传 `--input-fidelity`。
- CLI 的 `gpt-image-2` 不支持 `--background transparent`。透明主体必须生成在纯色 chroma-key 底上，再进行本地 alpha 提取；不要未经明确批准改用 `gpt-image-1.5`。
- 永远不要使用 `--force`。CLI 在目标文件已存在时应失败；保留原文件并改用新的语义化版本号（如 `hero-robot-v2.png`）。

## 尺寸与交付矩阵

遵循设计方案的命名及使用位置。所有尺寸必须满足 GPT Image 2 的限制：边长不超过 3840、两边均为 16 的倍数、比例不超过 3:1、总像素为 655,360–8,294,400。

| 类别 | 文件名模式 | 生成尺寸 | 背景 / alpha 要求 |
| --- | --- | ---: | --- |
| 首页主角与吉祥物 | `hero-robot[-vN].png`、`mascot-*.png` | 1600×1600 或 1024×1024 | 主体用每 job 指定的纯色 chroma-key 底后去背；不得带投影残底 |
| 头像、势力徽章 | `avatar-writer.png`、`emblem-*.png` | 1024×1024（交付可缩放使用） | 同上；圆形裁切由 CSS 完成 |
| 项目封面 | `cover-*.png` | 1024×1536 | 不透明竖版画面；无需去背 |
| 首页背景 | `home-sky-backdrop.png` | 2560×1440 | 不透明；底部向白色自然过渡 |
| 工作台云海横幅 | `scene-sky-band.png` | 2560×1024 | 不透明；由 CSS 裁切为横幅，底部向白渐隐 |
| 人物头像 | `portrait-<id>.png` | 1024×1024 | 透明主体；与横幅使用同一角色设定 |
| 人物横幅 | `portrait-<id>-banner.png` | 1600×640 | 不透明或透明均可，但人物固定左侧、右侧留白给 UI 文案 |
| 占位人物 | `portrait-placeholder[-banner].png` | 同对应人物格式 | 透明剪影与问号，不使用任何真实角色特征 |
| 工作台 Pro 插画 | `promo-rocket.png` | 1024×1024 | 透明主体，用 chroma-key 去背 |

不生成小图标、图表、关系线、工作流节点或玻璃卡片：这些必须由 `lucide-react`、SVG 或 CSS 实现。

## 一次性角色一致性锁定

在任何角色资产之前，先生成并人工批准一张**不入库**的角色设定板，记录每位角色的发型、发色、眼睛、年龄感、服装轮廓、主辅色、道具与姿态禁区。该非最终设定板只生成在 `D:/NOVELAGENT/tmp/imagegen/uizip-character-anchor/character-style-anchor.png`，不得写入或复制到成品目录。随后将已批准的设定板作为每次角色生成/编辑的第一个输入参考，并在 prompt 中明确：

```text
Keep the supplied character design exactly consistent: face, hair, eye color,
costume silhouette, palette, age impression, and signature props. Do not add text,
logos, watermarks, or a second character.
```

同一角色的头像和横幅应在同一批次连续生产。`liora`、`kael`、`arden`、`selene`、`vex` 与 `the-order` 使用 fixture ID 作为文件名；不可仅按中文显示名命名。

## Prompt 基线

每个 job 至少包含：使用场景、主体、风格、构图、调色、尺寸、约束。首页资产使用高饱和贴纸感卡通插画；工作台资产使用白绿清透、轻盈云海插画。品牌文字只允许精确的“笔心”；除非该资产确实需要文字，优先写 `no text`。

对 chroma-key 主体追加以下约束（背景图和封面不适用）。`<KEY_COLOR>` 必须由每个资产的 JSONL job 与对应 prompt 明确指定；按主体主色选择低冲突、远离主体颜色的纯色键色。绿色机器人、火箭等含绿色主体不可默认使用绿色键色。将选定的 `key_color` 记录在 job 与生成证据中，去背时必须读取该记录。

```text
Isolated single subject centered with full silhouette visible. Flat <KEY_COLOR> chroma-key
background only: no gradient, texture, floor, cast shadow, glow halo, atmospheric fog,
or key-color light spill. No text, logo, trademark, watermark, border, or frame.
```

不要以“妙笔”作为品牌文字。prompt 中若出现文字，必须逐字指定“笔心”，并在 QA 中逐字核对。

## 运行方式（显式锁定 gpt-image-2）

在 PowerShell 中定义固定路径。下面的命令只显示变量名，不会读取或输出密钥：

```powershell
$skill = 'C:/Users/Administrator/.codex/skills/.system/imagegen'
$cli = "$skill/scripts/image_gen.py"
$outDir = 'D:/NOVELAGENT/apps/web/src/assets/bixin/uizip-generated'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
```

单件 chroma-key 源图示例（最终透明图的目标名留给下一节）。这里的洋红键色只适用于不含相近洋红主体的 `mascot-copilot`；每个其它资产必须另行选择并记录键色：

```powershell
python $cli generate `
  --model gpt-image-2 `
  --quality high `
  --size 1024x1024 `
  --output-format png `
  --out "$outDir/mascot-copilot-chroma.png" `
  --prompt '<approved structured prompt; flat #ff00ff chroma-key background; no text, logo, or watermark>'
```

先将同一命令增加 `--dry-run` 做路径与 payload 检查；实际生成时移除它。若 `mascot-copilot-chroma.png` 已存在，停止并选择新文件名，不加 `--force`。

### Batch 命令

将每行一个 job 的 JSONL 存在仓库临时目录 `D:/NOVELAGENT/tmp/imagegen/uizip-assets.jsonl`。每行显式锁定 model，且把 `out` 写成位于 `$outDir` 下的**文件名**（而非绝对路径）。所有透明主体先输出 `-chroma.png`：

```json
{"model":"gpt-image-2","out":"hero-robot-chroma.png","size":"1600x1600","quality":"high","output_format":"png","use_case":"stylized-concept","key_color":"#ff00ff","prompt":"<approved hero robot prompt; flat #ff00ff chroma-key background>","constraints":"flat #ff00ff chroma-key background only; no text, logo, trademark, watermark, floor, shadow, or key-color spill"}
{"model":"gpt-image-2","out":"home-sky-backdrop.png","size":"2560x1440","quality":"high","output_format":"png","use_case":"illustration-story","prompt":"<approved cloud-island backdrop prompt>","constraints":"opaque full background; no characters, text, logo, trademark, or watermark; lower edge fades naturally to white"}
```

执行命令（不要附加 `--force`，也不要传 `--background transparent`）：

```powershell
python $cli generate-batch `
  --model gpt-image-2 `
  --input 'D:/NOVELAGENT/tmp/imagegen/uizip-assets.jsonl' `
  --out-dir $outDir `
  --concurrency 2 `
  --quality high `
  --output-format png
```

先用相同参数加 `--dry-run`，确认每个输出名都不冲突后再执行。小批量（建议 2 个并发）可使角色一致性审阅和失败重试可控；不要把不同视觉家族混在一个批准批次中。

## Chroma-key 去背

仅对 `*-chroma.png` 源图执行。源图必须完整保留，用作可审计输入；透明成品去掉 `-chroma` 后缀。**`--key-color` 必须逐项复制自对应 JSONL job 的 `key_color` 记录，不能从本节示例推断或复用。** 以下命令中的洋红键色仅对应上文的 `mascot-copilot` 示例，不覆盖现有成品：

```powershell
python "$skill/scripts/remove_chroma_key.py" `
  --input "$outDir/mascot-copilot-chroma.png" `
  --out "$outDir/mascot-copilot.png" `
  --key-color '#ff00ff' `
  --tolerance 28 `
  --soft-matte `
  --transparent-threshold 16 `
  --opaque-threshold 72 `
  --edge-feather 1 `
  --edge-contract 1 `
  --spill-cleanup
```

不要使用该脚本的 `--force`。如果边缘仍有所选键色溢色、镂空或锯齿，保留当前成品和源图，改以新版本 `-v2-chroma.png` / `-v2.png` 重新生产，而非破坏性重跑。

## 交付前 QA 清单

每个文件均需人工在浅色、深色和品牌绿色背景上查看，按下列项目逐项记录 pass/fail 与原因。

- [ ] 最终文件名为小写连字符英文，写在 `uizip-generated/`；没有覆盖既有文件；非最终 `character-style-anchor.png` 只保留在临时目录。
- [ ] 尺寸符合交付矩阵和 GPT Image 2 约束；PNG 可打开；文件没有多余画布或意外裁切。
- [ ] `key_color` 已在对应 JSONL job、prompt 与证据记录中一致保存；键色与主体的主色、边缘高光及半透明细节具有足够可见色距，特别复核绿色机器人/火箭不得使用相近绿色键色。
- [ ] 需要透明的文件实际含 alpha；透明区为真透明而非棋盘/白底/键色底；不需要透明的背景和封面保持不透明。
- [ ] 轮廓完整，头发、钢笔、手指、徽章等细节无锯齿、洞、暗边或所选键色溢色；没有残留投影/地面。
- [ ] 不含未请求文本；如有必要文字，品牌仅为“笔心”，逐字正确，没有“妙笔”。
- [ ] 无水印、模型签名、真实公司 logo、商标或意外边框。
- [ ] 色调匹配：首页为鲜明高饱和、贴纸感卡通；工作台为白绿清透云海；不可引入 Echo/mint 驾驶舱的第二视觉壳。
- [ ] 角色复核：与批准的设定板及同角色其它资产在脸型、发眼色、服装轮廓、主辅色、年龄感、道具上完全一致；人物横幅左侧主体和右侧留白正确。
- [ ] 参考风格复核：与相应 uizip 页面稿的构图、氛围、用途匹配；背景图没有机器人/书本，横幅没有不该出现的主体。
- [ ] 在笔心 1416×786 缩放画布内预览，确认 CSS 裁切后仍保留关键主体；登记资产前再由 `assetRegistry.ts` 引用。

## 生成证据记录

每次实际 API 运行均在 `D:/NOVELAGENT/docs/redesign/image2-assets/production-evidence.md` 新增一条记录，不记录密钥、base64 响应、任何本机用户名或绝对临时路径。每条至少包含：

1. UTC 时间、操作者、批次 ID 和设计方案版本；
2. 资产文件名、`*-chroma` 源文件（如有）、尺寸、PNG/alpha 状态与 SHA-256；
3. 完整的结构化 prompt（不含凭据）、JSONL 行号（如适用）和参考设定板/视觉稿名称；
4. 执行证据：`scripts/image_gen.py` 的路径与 SHA-256、命令中的 `--model gpt-image-2`、quality、size、输出格式、并发数、每项 `key_color`，以及 CLI 退出码；
5. 去背参数（必须包含与 job 一致的 `--key-color`）和 CLI 退出码（如适用）；
6. 上述 QA 每项的结果、审阅人、失败项与重生版本链。

PowerShell 可用以下只读元数据收集命令（不会显示环境变量值）：

```powershell
Get-FileHash "$outDir/mascot-copilot.png" -Algorithm SHA256
Get-Item "$outDir/mascot-copilot.png" | Select-Object Name, Length, LastWriteTimeUtc
Get-FileHash "$skill/scripts/image_gen.py" -Algorithm SHA256
```

若 CLI 输出未能提供可验证的模型回显，仍以保存的、明确含 `--model gpt-image-2` 的命令、JSONL `model` 字段、脚本 hash、输出 hash 和人工 QA 记录作为可复核证据；不要臆造 API 响应字段。
