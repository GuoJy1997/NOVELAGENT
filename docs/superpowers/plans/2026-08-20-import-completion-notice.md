# Import Completion Notice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When an import job saves or fails, stop the stream, show the destination page, and announce it on the existing live-region toast.

**Architecture:** `App` watches import jobs for the current project. On a new `saved` or `error` phase it sets the existing `actionMessage` live region. Clicking that notice navigates to the matching workbench page. Destination pages already swap from the stream preview to the editor/list when the job is saved.

**Tech Stack:** React 19, Vitest, Testing Library, existing `echo-action-feedback` live region, `importSession`.

## Global Constraints

- Live UI is Codex 笔心 only; workbench pages stay inside `.bixin-home`.
- No modal, no notification-center, no Tailwind, no Echo mint restyle.
- Tests assert user-visible Chinese copy via roles and accessible names.
- Do not commit unless the user asks.

---

### Task 1: Announce import completion on the existing toast

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/App.test.tsx`
- Modify: `apps/web/src/features/novelora-cockpit/lib/importSession.ts` (optional small helper for copy/nav)

- [ ] **Step 1: Write the failing App test**

A stubbed `startDocumentImport` for `default-project` must make the live region read `大纲已整理完成`. Clicking it opens the outline page. A failed character import must read `人物提取失败，请重试`.

- [ ] **Step 2: Run the test to confirm it fails**

- [ ] **Step 3: Subscribe in App and set the existing `actionMessage`**

Watch outline/world/characters jobs. Announce each `saved`/`error` once. Clickable notice calls `setActiveNavigation`. Keep other `onShowMessage` callers as plain strings.

- [ ] **Step 4: Run App tests and import page tests**

Verify outline import still lands in the editor (existing MarkdownDocumentPage test) and the new toast tests pass.
