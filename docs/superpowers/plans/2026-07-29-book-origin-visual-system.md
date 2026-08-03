# Novelora Book-Origin Visual System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use test-driven-development and execute this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current multi-layer simulated visual stage with the approved two-asset book background and independent mascot system.

**Architecture:** Keep the existing React workspace and fixture data. Simplify `CockpitVisualStage` to one background layer and one mascot layer, share the new mascot with `AgentPanel`, and recalibrate glass CSS so the new artwork remains visible without sacrificing readability.

**Tech Stack:** React 19, TypeScript, Vite, CSS, Vitest, Testing Library, Playwright browser QA.

---

### Task 1: Lock the two-asset runtime contract

**Files:**
- Modify: `apps/web/src/features/novelora-cockpit/components/CockpitVisualStage.test.tsx`
- Modify: `apps/web/src/features/novelora-cockpit/components/AgentPanel.test.tsx`
- Modify: `apps/web/src/styles/global.test.ts`

- [x] Require one Book Background image and one Mascot Companion image.
- [x] Reject the old flow, book-layer, wash and filament runtime structure.
- [x] Require AgentPanel to use the new shared mascot.
- [x] Run focused tests and confirm they fail against the current implementation.

### Task 2: Migrate assets and simplify the React stage

**Files:**
- Create: `apps/web/src/assets/novelora/book-origin/book_background.png`
- Create: `apps/web/src/assets/novelora/book-origin/writing_companion.png`
- Modify: `apps/web/src/features/novelora-cockpit/components/CockpitVisualStage.tsx`
- Modify: `apps/web/src/features/novelora-cockpit/components/AgentPanel.tsx`

- [x] Copy the approved source images into the build asset directory.
- [x] Render only the background and independent mascot in `CockpitVisualStage`.
- [x] Use the new mascot in AgentPanel.
- [x] Run focused component tests until they pass.

### Task 3: Rebuild layering, glass and motion

**Files:**
- Modify: `apps/web/src/styles/tokens.css`
- Modify: `apps/web/src/styles/cockpit.css`
- Modify: `apps/web/src/styles/global.test.ts`

- [x] Remove obsolete book/flow/wash/filament CSS.
- [x] Implement background cover/position rules and independent mascot geometry.
- [x] Recalibrate sidebar, workspace and Agent glass opacity around the new background.
- [x] Add slow background drift, mascot idle movement and reduced-motion fallbacks.
- [x] Preserve desktop, medium and mobile overflow contracts.

### Task 4: Browser QA and verification

**Files:**
- Produce: `qa-screenshots/book-origin-visual-system/`

- [x] Capture 1440×900, 1180×900 and 390×844.
- [x] Compare desktop composition with `assets/参考图/image.png`.
- [x] Run test, lint, build and `git diff --check`.
