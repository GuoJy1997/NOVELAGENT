# Echo Novel-native AI Agent UI 交接包

这是一套供 Codex 直接实现的桌面端 UI 交接资料。目标不是把参考图当作整页截图展示，而是用真实代码重建所有导航、卡片、进度、关系图和交互，仅把干净背景图作为视觉资产。

## 包内文件

```text
echo-novel-agent-ui-handoff-v1/
├── README.md
├── CODEX_IMPLEMENTATION_PLAN.md
├── ASSET_MANIFEST.md
├── assets/
│   └── hero-background-clean.png
└── reference/
    └── final-ui-reference.png
```

- `assets/hero-background-clean.png`：最终高清纯净背景，包含书、机器人、鸢尾花书页图案、岛屿、树、亭子、水流和飞鸟；不含任何 UI。
- `reference/final-ui-reference.png`：最终 UI 视觉基准，只用于对照，不允许直接作为页面背景或整页图片。
- `CODEX_IMPLEMENTATION_PLAN.md`：Codex 的完整实现指令、图层规则和验收条件。
- `ASSET_MANIFEST.md`：素材规格、用途与校验值。

## 交给 Codex 的一句话

> 请完整阅读 `CODEX_IMPLEMENTATION_PLAN.md`，使用 `reference/final-ui-reference.png` 做视觉对照，用 `assets/hero-background-clean.png` 作为唯一主视觉背景，以真实代码重建全部 UI。重点遵守“书本不透明地压住 Chapter Timeline 外层卡片，但不遮挡章节小卡片；被书遮挡处不能出现外层卡片轮廓；章节进度条位于小卡片下方”的图层规则。

## 实现原则

1. 参考图负责定义布局和质感，不能作为整页实现。
2. 背景图保持原始清晰度，不再压缩、重绘、虚化或降低饱和度。
3. 功能模块必须是可交互的 DOM/组件，不允许烘焙在图片里。
4. 页面主背景为纯白；禁止灰底、泛黄、深色玻璃或重度毛玻璃。
5. 第一版先完成 1672 × 941 的桌面像素级复刻，再处理宽屏和窄屏适配。

