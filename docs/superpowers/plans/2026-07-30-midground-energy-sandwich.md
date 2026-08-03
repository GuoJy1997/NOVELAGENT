# Novelora Midground Energy Sandwich Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use test-driven-development and execute this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Composite the book energy between structural frames and functional content so the plume masks large containers without washing out interactive cards.

**Architecture:** Render the approved book background twice with the same asset URL: a base pass at z0 and a multiply-blended midground pass at z2. Remove column-level stacking contexts, keep structural frames below the midground, and elevate only functional content wrappers to z3; keep Nova at z4.

**Tech Stack:** React 19, TypeScript, CSS, Vitest, Testing Library, Playwright.

---

### Task 1: Lock the three-pass visual-stage contract

**Files:**
- Modify: `apps/web/src/features/novelora-cockpit/components/CockpitVisualStage.test.tsx`
- Modify: `apps/web/src/styles/global.test.ts`

- [x] Require Background, Midground Energy, and Foreground containers in that DOM order.
- [x] Require both background passes to reuse the same `book_background.png` URL.
- [x] Require the midground to use z2, multiply blend mode, pointer-events none, and matching artwork geometry.
- [x] Require Nova to remain z4.
- [x] Run focused tests and verify they fail against the current two-layer stage.

### Task 2: Render the midground artwork pass

**Files:**
- Modify: `apps/web/src/features/novelora-cockpit/components/CockpitVisualStage.tsx`
- Modify: `apps/web/src/styles/tokens.css`
- Modify: `apps/web/src/styles/cockpit.css`

- [x] Add `.cockpit-visual-stage__midground` with a second image using `bookOriginBackground`.
- [x] Add `--book-origin-midground-opacity` for restrained duplicate rendering.
- [x] Align the midground image with the base background.
- [x] Disable midground rendering at 900px and below.

### Task 3: Split structural frames from functional content

**Files:**
- Modify: `apps/web/src/styles/cockpit.css`
- Modify: `apps/web/src/styles/global.test.ts`

- [x] Remove z3 from Sidebar, Workspace, and Right Panel.
- [x] Restore a faint non-blurred structural frame background below the midground.
- [x] Elevate navigation content, topbar content, section headings, functional scroll regions, chapter actions, and Agent content to z3.
- [x] Preserve 96% white content islands and local selected states.
- [x] Re-run focused tests and verify they pass.

### Task 4: Browser QA and final verification

**Files:**
- Produce: `qa-screenshots/midground-energy-sandwich/`

- [x] Build and restart preview on port 4177.
- [x] Capture 1672×941, 1440×900, 1180×900, and 390×844.
- [x] Confirm the plume masks structural frames while functional content remains clean white.
- [x] Confirm no console errors, page errors, failed requests, or page-level horizontal overflow.
- [x] Run `npm run test:web`, `npm run lint:web`, `npm run build:web`, and `git diff --check`.
