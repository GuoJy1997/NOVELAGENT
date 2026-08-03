# Novelora Book-Origin Scenic Clearance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use test-driven-development and execute this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve a clear lower-left book scene by progressively insetting the chapter and knowledge workspaces while lightening stacked glass surfaces.

**Architecture:** Keep the existing React component tree and interaction contracts. Express the approved geometry and material behavior as CSS tokens and desktop-only layout rules, with contract tests covering the exact inset, transparency, blur, and responsive reset behavior.

**Tech Stack:** React 19, TypeScript, CSS, Vitest, Playwright browser QA.

---

### Task 1: Lock the scenic-clearance CSS contract

**Files:**
- Modify: `apps/web/src/styles/global.test.ts`

- [x] Add assertions for `--book-origin-chapter-inset` and `--book-origin-knowledge-inset`.
- [x] Require the chapter stage and knowledge grid to use different left margins at `min-width: 1280px`.
- [x] Require both margins to reset below 1280px.
- [x] Require the outer glass surface and inner card surface to use the approved lighter alpha values.
- [x] Require workspace panel blur to be 8px.
- [x] Run `npm --prefix apps/web run test -- --run src/styles/global.test.ts` and verify the new assertions fail for the missing geometry/material rules.

### Task 2: Implement progressive desktop setbacks

**Files:**
- Modify: `apps/web/src/styles/tokens.css`
- Modify: `apps/web/src/styles/cockpit.css`

- [x] Add `--book-origin-chapter-inset: clamp(48px, 4vw, 64px)`.
- [x] Add `--book-origin-knowledge-inset: clamp(96px, 7vw, 112px)`.
- [x] At `min-width: 1280px`, apply the chapter inset to `.chapter-workspace-stage`.
- [x] At `min-width: 1280px`, apply the knowledge inset to `.knowledge-workspace-grid`.
- [x] Keep the right edge aligned by relying on grid-item stretch with an inline-start margin rather than a fixed width.
- [x] At `max-width: 1279px`, reset both inline-start margins to zero.
- [x] At `min-width: 1441px`, expand the scenic sidebar to 272px.
- [x] Compact the wide chapter panel to 140px and its cards to 82px so the knowledge deck begins near y=553.

### Task 3: Lighten the stacked glass hierarchy

**Files:**
- Modify: `apps/web/src/styles/tokens.css`
- Modify: `apps/web/src/styles/cockpit.css`

- [x] Set `--surface-glass-soft` to `rgba(255, 255, 255, 0.12)`.
- [x] Set `--surface-inner-card` to `rgba(255, 255, 255, 0.54)`.
- [x] Reduce `.structure-map` and `.chapter-swimlane` backdrop blur to 8px.
- [x] Give the knowledge workspace panels the same 8px backdrop blur.
- [x] Re-run the focused CSS tests and confirm they pass.

### Task 4: Browser comparison and regression verification

**Files:**
- Produce: `qa-screenshots/book-origin-scenic-clearance/`

- [x] Build and restart the preview on port 4177.
- [x] Capture 1672×941, 1440×900, 1180×900, and 390×844 screenshots.
- [x] Confirm the book remains visually clear at desktop sizes and the medium/mobile layouts have no page-level horizontal overflow.
- [x] Confirm there are no console errors, page errors, or failed asset requests.
- [x] Run `npm run test:web`, `npm run lint:web`, `npm run build:web`, and `git diff --check`.
