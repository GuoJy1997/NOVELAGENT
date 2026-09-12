# 笔心首页高保真实现 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个可直接在 Cursor 中继续开发的 Electron + React + TypeScript + Vite + Tailwind CSS 首页工程，在 1728×972 桌面基准下高保真还原“笔心 AI写作工作室”确认版首页。

**Architecture:** 页面使用三层 Z 轴结构：`SceneLayer`（背景+机器人，z-10）、React UI（z-20）、`BookLayer`（立体地图书+书签，z-30）。所有卡片、导航、进度、关系线与控件均由 React/Tailwind 实现，视觉图只承担场景、品牌和内容资产。

**Tech Stack:** Electron 31, React 18, TypeScript 5, Vite 5, Tailwind CSS 3, Lucide React.

## Global Constraints

- 对外品牌固定为“笔心”，辅助名称为“AI写作工作室”。
- Electron 默认窗口 1728×972，最小 1440×810。
- 首页只实现当前确认版，不扩展其他真实业务页面。
- 书本不得合并进背景图；书本必须在 UI 外层且 `pointer-events: none`。
- 左侧导航不使用整块厚重矩形 Sidebar 容器。
- Dashboard 卡片数量保持参考图的信息密度，不新增额外模块。
- 绿色为主色，背景为云白/雾白，避免蓝色 SaaS 主视觉。

---

### Task 1: Electron 桌面壳与安全边界

**Files:**
- Create: `electron/preload.cjs`
- Modify: `electron/main.cjs`
- Modify: `package.json`
- Create: `src/types/desktop.d.ts`

**Interfaces:**
- Consumes: Vite renderer at `http://localhost:5173` during development.
- Produces: `window.bixinDesktop` read-only runtime metadata and a 1728×972 secure BrowserWindow.

- [x] **Step 1: Add a static assertion that Electron uses a preload and safe flags**

`node scripts/verify-static.mjs` verifies that `main.cjs` contains `preload`, `contextIsolation: true`, and `nodeIntegration: false`.

- [x] **Step 2: Run the static verifier and confirm it detects the shell contract**

Run: `npm test`

Expected: `Electron shell verified: preload + contextIsolation + nodeIntegration=false.`

- [x] **Step 3: Implement BrowserWindow + preload**

`electron/preload.cjs` exposes only platform/version metadata through `contextBridge`; no filesystem or Node APIs are exposed to the renderer.

- [x] **Step 4: Verify CommonJS syntax**

Run:

```bash
node --check electron/main.cjs
node --check electron/preload.cjs
```

Expected: exit code 0.

---

### Task 2: 三层视觉资产与前景遮挡

**Files:**
- Create: `public/assets/layers/scene_robot_background.png`
- Create: `public/assets/layers/book_body_cutout.png`
- Create: `public/assets/layers/book_foreground.svg`
- Create: `public/assets/brand/bixin_app_icon.png`
- Create: `public/assets/covers/project-cover.png`
- Create: `public/assets/reference/current_ui_reference.png`
- Modify: `src/components/scene/SceneLayer.tsx`
- Modify: `src/components/scene/BookLayer.tsx`

**Interfaces:**
- Consumes: public asset URLs under `/assets/...`.
- Produces: Scene z-10 and book z-30; both are non-interactive.

- [x] **Step 1: Verify required asset files are present**

Run: `npm test`

Expected: static verifier reports the scene, book composite, icon, cover and reference image.

- [x] **Step 2: Implement SceneLayer**

`SceneLayer` renders the wide cloud/floating-island/robot composition under all UI.

- [x] **Step 3: Build the book foreground composite**

`book_foreground.svg` embeds the extracted 3D map-book body and adds a coordinated cream/gold/green bookmark + tassel in the same foreground group.

- [x] **Step 4: Implement BookLayer**

`BookLayer` renders `book_foreground.svg` at z-30 and uses `pointer-events-none` so the overlap never blocks controls.

- [x] **Step 5: Validate assets**

Use Pillow to open/verify PNG assets and `xml.etree.ElementTree` to parse the book SVG.

Expected: every asset opens successfully and the SVG is valid XML.

---

### Task 3: 页面框架、导航、Hero 与顶部工具

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/layout/SidebarRail.tsx`
- Modify: `src/components/layout/BrandHeader.tsx`
- Modify: `src/components/layout/TopBar.tsx`
- Modify: `src/components/layout/HeroSection.tsx`
- Modify: `src/data/nav.ts`
- Modify: `src/data/home.ts`

**Interfaces:**
- Consumes: `SceneLayer`, `BookLayer`, shared UI controls and local mock data.
- Produces: the z-20 interactive shell between scene and book layers.

- [x] **Step 1: Implement an open sidebar rail**

Navigation items are individually surfaced on the scene background; no full-height white sidebar container is introduced.

- [x] **Step 2: Implement the brand and hero copy**

Brand text is `笔心 / AI写作工作室`; headline is `写出让世界铭记的故事` with `故事` in brand green.

- [x] **Step 3: Implement top search and icon controls**

Use the reusable `SearchBar`, `IconButton` and `Tooltip` controls.

- [x] **Step 4: Verify JSX/TS syntax**

Run the TypeScript `transpileModule` verification across implementation files.

Expected: zero syntax diagnostics.

---

### Task 4: 通用组件与控件库

**Files:**
- Create/Modify: `src/components/ui/*.tsx`
- Create: `src/components/ui/index.ts`
- Modify: `src/styles/globals.css`

**Interfaces:**
- Produces: `Button`, `IconButton`, `Card`, `Chip`, `StatusBadge`, `Tag`, `Avatar`, `SearchBar`, `ProgressRing`, `ProgressBar`, `MetricItem`, `Divider`, `Tooltip`.

- [x] **Step 1: Implement base controls**

All components accept focused props and avoid embedding business-specific data.

- [x] **Step 2: Implement card and navigation visual tokens**

Cards use semi-opaque cloud-white backgrounds, subtle border, blur and lightweight shadow.

- [x] **Step 3: Remove invalid Tailwind opacity shorthand**

Nonstandard opacity classes such as `bg-white/88` are written as arbitrary opacity values such as `bg-white/[0.88]` so Tailwind 3 JIT emits them correctly.

- [x] **Step 4: Verify all control files are included in the delivery manifest**

Run: `npm test`

Expected: all shared controls are reported present.

---

### Task 5: Dashboard information architecture

**Files:**
- Modify: `src/components/layout/DashboardGrid.tsx`
- Modify: `src/components/cards/ProjectOverviewCard.tsx`
- Modify: `src/components/cards/ChapterProgressCard.tsx`
- Modify: `src/components/cards/CharacterNetworkCard.tsx`
- Modify: `src/components/cards/WritingGoalsCard.tsx`
- Modify: `src/components/cards/ScheduleCard.tsx`
- Modify: `src/components/cards/CalendarCard.tsx`
- Modify: `src/data/home.ts`

**Interfaces:**
- Consumes: reusable UI controls and local mock data.
- Produces: project card spanning two rows, chapter progress, character network, writing goals, schedule and calendar blocks.

- [x] **Step 1: Implement project overview as the dominant two-row card**

Includes cover, title, status, description, four metrics and primary action.

- [x] **Step 2: Implement chapter progress + circular total**

Stages are rendered as code controls, with `已发布` using the green active state.

- [x] **Step 3: Implement character relationship network**

SVG dashed relationship edges are code-rendered and nodes remain interactive-layer content.

- [x] **Step 4: Implement writing goals and right-bottom schedule/calendar group**

No additional dashboard modules are introduced beyond the approved information density.

---

### Task 6: Verification, documentation and ZIP handoff

**Files:**
- Create: `scripts/verify-static.mjs`
- Create: `CURSOR_HANDOFF.md`
- Create: `docs/asset_manifest.md`
- Modify: `README.md`
- Modify: `docs/component_inventory.md`
- Modify: `docs/frontend_file_structure.md`
- Modify: `docs/implementation_plan.md`
- Create: `docs/verification_report.md`

**Interfaces:**
- Produces: a self-contained handoff package and deterministic no-dependency static verification.

- [x] **Step 1: Run static project tests**

Run: `npm test`

Expected: all required files and layer/security rules pass.

- [x] **Step 2: Run syntax checks**

Run Electron `node --check` and TypeScript/TSX syntax transpilation.

Expected: zero syntax errors.

- [x] **Step 3: Validate visual asset files**

Expected: PNG assets open successfully and `book_foreground.svg` parses as XML.

- [x] **Step 4: Scan for delivery placeholders**

Run a `TBD|TODO|FIXME` scan across delivery-critical files.

Expected: zero matches.

- [ ] **Step 5: Install dependencies and execute Vite/Electron build in a network-enabled environment**

Run:

```bash
npm install
npm run typecheck
npm run build:web
```

Expected: dependency install succeeds, TypeScript typecheck returns 0, and Vite writes `dist/`.

Current sandbox note: npm registry resolution returns `EAI_AGAIN`, so dependency-backed build verification must be rerun in Cursor or another network-enabled Node environment.

- [x] **Step 6: Package the handoff**

Create `笔心_Electron首页高保真实现包.zip` from the project root after all local static verification files and reports are written.
