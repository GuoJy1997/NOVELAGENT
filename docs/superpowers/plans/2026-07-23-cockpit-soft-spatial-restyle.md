# Novelora Cockpit Soft Spatial Restyle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the cockpit's boxed dashboard appearance with a soft, border-light spatial composition matching the approved reference direction.

**Architecture:** Preserve the React tree and fixture data. Implement the correction through token-first CSS changes and CSS contract tests, then validate the live page at desktop, medium, and mobile widths.

**Tech Stack:** React 19, TypeScript, CSS, Vitest, Testing Library, Vite.

---

### Task 1: Lock the soft-surface contracts

**Files:**
- Modify: `apps/web/src/styles/global.test.ts`

- [x] Add failing assertions requiring a borderless topbar, no hard desktop sidebar divider, softer workspace surfaces, and reduced stage saturation.
- [x] Run `npm run test:web -- --run src/styles/global.test.ts` and confirm the new assertions fail for the current boxed styling.

### Task 2: Recalibrate tokens and spatial layers

**Files:**
- Modify: `apps/web/src/styles/tokens.css`
- Modify: `apps/web/src/styles/cockpit.css`

- [x] Reduce mint saturation, border opacity, and green-tinted shadow weight through named tokens.
- [x] Remove the topbar frame and replace the sidebar's hard divider with a curved, fading pseudo-element.
- [x] Widen and soften the book/flow atmosphere so the lower sidebar edge visually dissolves without blocking input.
- [x] Run the focused CSS tests until they pass.

### Task 3: Rebuild the surface hierarchy

**Files:**
- Modify: `apps/web/src/styles/cockpit.css`
- Modify: `apps/web/src/styles/global.test.ts`

- [x] Make Structure, Chapter, Inspiration, Character, and Clue surfaces lower contrast than their inner cards.
- [x] Give navigation, project, Agent, and utility surfaces a consistent soft-radius system with restrained selected states.
- [x] Preserve focus visibility, semantic state colors, responsive geometry, and reduced-motion rules.
- [x] Run `npm run test:web`.

### Task 4: Browser QA and final verification

**Files:**
- Produce: `qa-screenshots/soft-spatial-restyle/`

- [x] Capture 1440×900, 1180×900, and 390×844 screenshots from the local preview.
- [x] Compare the desktop screenshot against `assets/参考图/image.png`, checking border hierarchy, sidebar fade, color weight, book/Nova placement, and first-viewport density.
- [x] Run `npm run test:web`, `npm run lint:web`, `npm run build:web`, and `git diff --check`.
