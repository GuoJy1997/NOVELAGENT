# Echo Reference Fidelity Pass — Design

Date: 2026-08-04
Target reference: `assets/extracted-handoff/echo-novel-agent-ui-handoff-v1/reference/final-ui-reference.png`
Supporting spec: `design.md` (repo root)
Scope: visual fidelity only; mock-data driven demo stays backend-free.

## Goal

Maximize visual fidelity of the echo cockpit to the reference image while keeping the existing component tree, mock data source, interactions, and accessibility semantics. Final approval is performed by a dedicated subagent (`ui-approval`) running on `alibaba-token-plan-cn/kimi-k3-256K`.

## Approach

Per-module visual alignment inside existing components (JSX restructure + CSS in `cockpit.css`/`tokens.css` variables). Rejected: full tree rebuild (breaks tests), CSS-only pass (cannot reach card-internal layouts).

## Module targets

1. First-screen fit: 1920×1080 and 1440×900 show hero + middle row + bottom row + right rail with no native scrollbar (design.md §18). Fixed 100vh app grid; compressed paddings/gaps.
2. StructureMap: title with chevron; "Core Conflict" pill centered in header; act cards show ACT label + range, name, chapter meta, and a bottom row with small mint icon + word-share percent.
3. ChapterSwimlane restyled to reference "Chapter Timeline": compact cards for all six chapters (Ch. N / title / meta), selected card mint border + percent + chevron, Add tile, dotted progress rail under cards; remove blue "Open chapter details" and "Reorder" header buttons; drawer opens from selected-card chevron.
4. AIWritingPartner: greeting card ("Hello, I'm Echo." / "Your writing partner and story architect." / Active), then "Active Tasks" header with "View All", four task rows with thin mint progress bars and right-aligned percent.
5. MemoryLayer: "Manage" green text link; pill row with Core Memory solid mint; crystal visual at bottom.
6. InspirationVault: "View All" link; three rows with rounded-square thumbnail + title + "Type • tag • tag" meta; remove visible filter pills (update tests).
7. CharacterGraph: central protagonist node + four surrounding portrait nodes; name + role under each; thin colored edges (ally mint, neutral gray, rival coral, unknown dotted); bottom legend; "⋯" menu; tension text via tooltip.
8. ClueAttributionFlow: two columns "Clues" / "Revealed To"; compact rows with chapter label + chevron on left, person icon + receiver on right; curved SVG connectors; active clue mint; "View Full Flow" link; extend fixture to four clue flows.
9. Topbar/sidebar/hero: already close; keep as-is except minor spacing.

## Constraints

- Colors/shadows/radii/motion only via `tokens.css` variables; keep `global.test.ts` CSS contracts green.
- Preserve ARIA roles/labels where visible; update component tests only where the reference removes a visible control.
- No comments in code. UI copy stays English.

## Reviewer workflow

`.opencode/agents/ui-approval.md` (mode subagent, model alibaba-token-plan-cn/kimi-k3-256K, edit denied) reviews: reference png vs current screenshots vs code; returns verdict APPROVE or REQUEST CHANGES with prioritized gap list. Iterate until APPROVE.

## Verification

`npm run test:web`, `npm run lint:web`, `npm run build:web`; Playwright screenshots at 1920×1080 and 1440×900 when available.
