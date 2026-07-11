# Novelora Bright Cockpit UI Design Contract

## Intent

The final direction is a **明亮收藏级创作驾驶舱**: a calm, high-craft writing surface that feels like a **map desk + collectible companion**, rather than a generic SaaS dashboard. It helps a writer read the story as a living map while keeping supporting systems useful but visually quiet.

The experience should feel collectible and editorial, not theatrical. The central story map has priority; Nova adds warmth and orientation without becoming the main event.

## Visual language

### Materials and palette

Use warm paper, enamel, and soft glass as material cues:

- Paper: `--color-canvas` `#fffdf8`, `--color-surface` `#ffffff`, and `--color-bg-card` `#fff9f0` establish the bright reading field.
- Enamel accents: coral `#ff6b57`, mint `#36c7b4`, sky `#3a86ff`, amber `#ffb547`, and lilac `#8f67ff` identify states, paths, and small signals.
- Soft glass: restrained translucent surfaces and very low-contrast warm shadows can separate layers, but must remain light and paper-led.
- Ink and rules: `--color-ink` `#141414`, muted text `#69645d`, and `--color-line` `#e8e1d8` keep long reading sessions legible.

This is a strict bright palette. Dark ink is for type, a small avatar, or the smallest structural contrast only; it is not a panel or page background.

### Type and iconography

Editorial display type (`--font-display`) is reserved for project, section, card, and companion names. Clean sans (`--font-ui`) carries labels, controls, metadata, and dense operational information. Keep small uppercase eyebrows as navigation cues, not decoration.

Use the supplied SVG mark, icons, node illustrations, cover art, thumbnails, portraits, and Nova assets. Do not substitute emoji for interface icons. Crops are deliberate: covers and inspiration images use `object-fit: cover`, while logo and mascot artwork retain their authored silhouette.

### Explicit prohibitions

- No large dark panels or dark dashboard backgrounds.
- No generic, floating glass-card look disconnected from the paper/enamel material system.
- No emoji icons in product UI.
- No unmotivated glow; shadows and color washes only clarify selection, layering, or a real state.

## Layout and responsive behavior

The desktop motherform is a three-rail map desk:

1. Left rail: product navigation, current-project context, and the full Nova companion illustration.
2. Center workspace: project header, structure map, chapter swimlane, then knowledge modules (inspiration, character constellation, and clue flow).
3. Right rail: compact Nova summary, task orchestration, memory health, and focus mode.

At the wide desktop contract, the grid is `296px / minmax(520px, 1fr) / 360px`. At `1440px` and below it becomes `256px / minmax(520px, 1fr) / 320px`. Above the mobile breakpoint, preserve the rails so the map reads as a desk rather than collapsing into unrelated cards.

At `1180px` and below, the cockpit preserves its `1176px` working surface with outer horizontal scrolling. At `900px` and below, it becomes a single-column layout, restores natural panel height, and hides the decorative large Nova illustration. Dense map-like modules retain their own horizontal scroll regions instead of shrinking their content into illegible cards.

## Content hierarchy

- The selected act and chapter carry the strongest coral boundary and the clearest progress signal.
- Dotted connectors, graph edges, and clue nodes explain relationships; they are supporting structure, not decoration.
- Nova is subordinate to story data: a modest avatar and lead-card label in the right rail, with the larger collectible figure anchored low in the left rail.
- Operational details use small chips, meters, and compact rows. They must not compete with the structure map or chapter swimlane.

## Motion

Use only short, purposeful feedback: a small lift or border change on selectable cards, and state transitions on controls. Do not add ambient motion or decorative looping effects. `prefers-reduced-motion: reduce` reduces animation and transition duration to a near-instant value and disables smooth scrolling behavior.

## Accessibility contract

- Preserve semantic controls, dialog labeling, keyboard focus trapping, Escape close, and invoker-focus restoration for the chapter drawer.
- Global and custom focus-visible rings use a `3px` opaque `var(--color-sky)` outline with a `3px` offset. Sky (`#3a86ff`) is approximately 3.48:1 against white, meeting the 3:1 non-text focus-indicator threshold.
- Keep contrast through ink, muted text, and light rules; color is supplementary to labels and statuses.
- Do not make keyboard-inaccessible content a visual control, and exclude hidden/disabled elements from dialog focus cycling.

## MVP bounds

This UI is intentionally a local-fixture dashboard. It does not implement project persistence, real agent or model execution, collaboration, search, data syncing, mutation APIs, authentication, or durable task/memory state. The Agent rail, Nova status, progress, and focus mode are presentation/demo state only.

## Visual QA — 2026-07-12

Local Vite was inspected in Chromium at two first-viewport sizes. Screenshots are deliberately outside the Git worktree and are not project assets:

| Viewport | Screenshot | Findings |
| --- | --- | --- |
| 1920 × 1080 | `D:\novelAgent\qa-screenshots\novelora-bright-cockpit-1920x1080.png` | Poster composition is intact: the left navigation, story-map center, and contextual right rail read as one desk. Major regions neither overlap nor clip; Nova remains visually subordinate. Asset crops are clean and the main map is fully legible. |
| 1280 × 900 | `D:\novelAgent\qa-screenshots\novelora-bright-cockpit-1280x900.png` | Three rails remain aligned with no rail overlap or page-level horizontal overflow. The structure map and chapter swimlane intentionally need **inner horizontal scrolling** at this width because their map/card rails retain readable minimum widths. This is expected behavior, not a clipping defect. Nova remains subordinate and its crop stays authored. |

Keyboard focus was also checked on the focus-mode control in both viewports: computed focus styling was `3px solid rgb(58, 134, 255)`, the opaque sky token. No visual defect requiring product-code changes was found during this QA pass.
