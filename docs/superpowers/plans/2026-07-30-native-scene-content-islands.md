# Novelora Native Scene Content Islands Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use test-driven-development and execute this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the book and page-energy artwork remain visually continuous through layout space while limiting opaque white surfaces to real content and interaction islands.

**Architecture:** Preserve the existing React tree, two-asset visual stage, responsive setbacks, and interactions. Replace the current outer glass hierarchy with transparent structural containers, retain only whisper borders, and increase the existing inner-card token to a near-white content-island surface.

**Tech Stack:** React 19, TypeScript, CSS, Vitest, Playwright browser QA.

---

### Task 1: Lock the transparent-space contract

**Files:**
- Modify: `apps/web/src/styles/global.test.ts`

- [x] Require Sidebar, Topbar, Right Panel, and the five workspace sections to use `background: transparent`.
- [x] Reject all backdrop-filter declarations on those structural containers.
- [x] Require workspace-section shadows to be `none`.
- [x] Reject the full-height Sidebar boundary pseudo-element.
- [x] Require wide desktop knowledge sections to remain transparent without gradient overrides.
- [x] Run the focused CSS test and verify it fails against the current glass implementation.

### Task 2: Remove structural glass layers

**Files:**
- Modify: `apps/web/src/styles/cockpit.css`
- Modify: `apps/web/src/styles/tokens.css`

- [x] Remove the Sidebar fallback fill and supported backdrop-filter block.
- [x] Remove the Sidebar boundary pseudo-element.
- [x] Make Topbar and Right Panel transparent without backdrop filters.
- [x] Make all five workspace sections transparent with no backdrop filter or panel shadow.
- [x] Remove wide-desktop gradient backgrounds from Inspiration, Character, and Clue sections.
- [x] Remove the obsolete `--surface-glass-soft` token after its last runtime reference is gone.

### Task 3: Restore solid white content islands

**Files:**
- Modify: `apps/web/src/styles/tokens.css`
- Modify: `apps/web/src/styles/cockpit.css`
- Modify: `apps/web/src/styles/global.test.ts`

- [x] Set `--surface-inner-card` to `rgba(255, 255, 255, 0.96)`.
- [x] Keep Act, Chapter, Inspiration, Character, Clue, Project, and Writing Streak surfaces bound to the inner-card token.
- [x] Move Nova Lead Card and Focus Mode from the obsolete outer-glass token to the inner-card token.
- [x] Preserve selected-state mint borders and local shadows.
- [x] Re-run the focused CSS tests and verify they pass.

### Task 4: Browser QA and final verification

**Files:**
- Produce: `qa-screenshots/native-scene-content-islands/`

- [x] Build and restart preview on port 4177.
- [x] Capture 1672×941, 1440×900, 1180×900, and 390×844.
- [x] Confirm the background remains sharp through structural whitespace and disappears only beneath content islands.
- [x] Confirm there are no console errors, page errors, failed requests, or page-level horizontal overflow.
- [x] Run `npm run test:web`, `npm run lint:web`, `npm run build:web`, and `git diff --check`.
