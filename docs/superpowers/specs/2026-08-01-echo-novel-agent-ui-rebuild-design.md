# Echo Novel-native AI Agent UI Rebuild Design

**Date:** 2026-08-01  
**Status:** Ready for product review  
**Scope:** Desktop-first visual and interaction reconstruction of the existing mock-data cockpit

## 1. Decision Summary

The public product brand becomes **Echo**. The application will adopt the supplied Echo handoff as its visual source of truth while preserving the existing local project data, chapter selection logic, relationship data, clue data, drawer behavior, and accessibility contracts where they remain applicable.

This is a composition rebuild, not a CSS reskin and not a rewrite of the product domain. The page shell, hero, dashboard placement, surface construction, and Agent presentation will be rebuilt. Existing domain components will be reused at the data and interaction level, then given markup and styling appropriate to the new reference.

The current duplicated-background `multiply` technique will be removed. The supplied background is rendered exactly once at full opacity with no visual filter. The book occlusion is produced by omitting panel surfaces where the book passes, not by making panels transparent and not by overlaying a second copy of the artwork.

## 2. Sources of Truth

The implementation must use the following handoff files:

- `assets/echo-novel-agent-ui-handoff-v1/assets/hero-background-clean.png`
  - 1671 × 941 PNG
  - SHA-256: `abe1dd54dc4f5c587c406c8e567593f5b63fda0672568621e2320b9f2d3be9df`
  - The only full-page scenic artwork
- `assets/echo-novel-agent-ui-handoff-v1/reference/final-ui-reference.png`
  - 1672 × 941 PNG
  - SHA-256: `d9b405e37da6963ff5b5d60c34549381e99c7b2bf5054fd656c300a2bb0d6d24`
  - Visual comparison only; it must never be rendered as the application UI
- `assets/echo-novel-agent-ui-handoff-v1/CODEX_IMPLEMENTATION_PLAN.md`
  - Coordinate, layering, interaction, responsive, and acceptance guidance

The source PNG remains unchanged. It must not be regenerated, recolored, sharpened, blurred, darkened, desaturated, or converted into an opaque substitute.

## 3. Product Identity

All user-visible product identity becomes Echo:

- Brand wordmark: `echo`
- Brand subtitle: `AI Writing Studio`
- Assistant name: `Echo`
- Assistant card title: `AI Writing Partner`
- Browser and accessible names must no longer expose `Novelora`

The active project remains `Eclipse of Echoes`. Existing fictional project data may be normalized to match the reference copy during the UI rebuild.

Internal file and type names such as `novelora-cockpit` and `NoveloraProject` do not need a broad rename in this visual iteration. A repository-wide internal rename would add risk without changing the product experience. Newly introduced public components and assets should use Echo-neutral names, and a later cleanup may rename internal legacy identifiers independently.

## 4. Design Language Contract

- **Core phrase:** A living story world growing out of an open book
- **User emotion:** Creative possibility, companionship, clarity, and forward momentum
- **Motherform:** The open storybook and its emerging world
- **Material:** White ceramic, crisp paper, mint enamel, clear water, and restrained soft shadow
- **Primary style family:** Asset-led light product cockpit
- **Typography:** Modern sans-serif with compact functional hierarchy; no decorative serif
- **Color skeleton:** Pure white page, near-black text, mint primary, cyan/blue support, sparse red warning
- **Spatial structure:** Hero theater above a compact dashboard dock
- **Density:** Airy in the hero, information-dense only below the 512px dashboard line
- **Forbidden treatments:** Gray page wash, warm paper tint, heavy glass, broad blur, dark panels, duplicated artwork, cheap blue shadow, and unrelated accent colors

The first viewport must remain recognizable as Echo even if all text is removed: the book, robot, emerging island, water arc, white field, and mint functional dock carry the identity.

## 5. Desktop Layout at 1672 × 941

The 1672 × 941 viewport is the first fidelity target.

### 5.1 Major anchors

| Region | Reference anchor |
| --- | --- |
| Sidebar | x 50–230, y 0–941 |
| Topbar | x 230–1672, y 20–96 |
| Hero copy | x 308–600, y 166–375 |
| Scenic book and robot | Determined exclusively by the supplied background |
| Dashboard top edge | y approximately 512 |
| Novel Structure Map | x 260–782, y 512–713 |
| Chapter Timeline | x 783–1330, y 512–713 |
| AI Writing Partner | x 1355–1650, y 512–746 |
| Lower functional row | y 720 and below |

### 5.2 Page shell

The shell uses a fixed approximately 230px sidebar and a main stage. The scenic background is positioned against the viewport rather than inside the main content column, because the artwork crosses the sidebar boundary and the dashboard. The main page background is `#fff`.

The topbar belongs to the main stage but has no enclosing heavy component frame. The hero copy occupies the negative white space to the left of the robot. Dashboard content starts at the book's lower edge and uses a three-column grid followed by a nested lower grid.

No parent-level `transform: scale()` may be used to fit the design canvas. Text and controls remain native-resolution DOM.

## 6. Layer and Occlusion Architecture

The required global stack is:

```text
z0   pure white page
z1   one hero-background-clean.png instance
z10  dashboard panel surfaces and local shadows
z20  navigation, topbar, hero copy, panel content, cards, nodes, and controls
z30  menus, tooltips, drawers, and transient feedback
```

### 6.1 Single scenic image

The scenic image is decorative, pointer-inert, and rendered once. At the 1672px reference width it is displayed at approximately its source pixel size. Runtime styles must resolve to:

- `opacity: 1`
- `filter: none`
- no `backdrop-filter` parent overlay
- no second copy for foreground or multiply blending

The background receives high fetch priority and asynchronous decoding without base64 embedding.

### 6.2 Occluded panel construction

`NovelStructureMap` and `ChapterTimeline` must not use one monolithic background-bearing section. Each is composed from:

1. `panelSurface`: the solid white body beginning below the book-occlusion band;
2. `visibleTopCap`: panel-top fragments drawn only where the book does not pass;
3. `panelContent`: headings, controls, cards, connectors, and progress, always above the art;
4. an undrawn gap where the native book remains visible.

The panel section itself has no background, border, shadow, or backdrop filter. Occlusion never applies to `panelContent`.

At the 1672px reference viewport, the initial occlusion band is approximately 58px high from the dashboard top. Structure Map receives only its visibly unobstructed top cap. Chapter Timeline may have no continuous top cap where the book covers its full upper span. Exact cap widths are panel-specific CSS custom properties refined by screenshot comparison.

If straight cap fragments are insufficient, a CSS mask or inline SVG mask may shape only `panelSurface`. It must not clip chapter cards, headings, focus rings, menus, or progress controls.

### 6.3 Solid functional islands

Act cards, chapter cards, task rows, inspiration entries, relationship nodes, clue nodes, buttons, inputs, and tags remain opaque white or tokenized solid fills. Their opacity remains `1`. They may sit over the book because they are functional foreground objects.

The AI Writing Partner card is a complete solid card and is not book-occluded.

## 7. Component Architecture

```text
EchoCockpit
├── EchoHeroBackground
├── EchoSidebar
│   ├── EchoBrand
│   ├── NewProjectButton
│   ├── PrimaryNavigation
│   ├── UtilityActions
│   └── TodayProgress
├── EchoMainStage
│   ├── EchoTopbar
│   │   ├── ProjectSwitcher
│   │   ├── ProjectStatus
│   │   ├── WordTarget
│   │   ├── GlobalSearch
│   │   └── UserMenu
│   ├── EchoHeroCopy
│   │   ├── HeroHeadline
│   │   ├── ContinueWritingButton
│   │   └── AIAssistButton
│   └── EchoDashboard
│       ├── NovelStructureMap
│       ├── ChapterTimeline
│       ├── AIWritingPartner
│       ├── InspirationVault
│       ├── CharacterRelationshipGraph
│       ├── ClueAttributionFlow
│       └── MemoryLayer
└── EchoOverlayLayer
    ├── ProjectMenu
    ├── AgentDetailsDrawer
    ├── ChapterDetailDrawer
    └── ActionFeedback
```

Existing component responsibilities are reused as follows:

| Existing component | Rebuild decision |
| --- | --- |
| `CockpitVisualStage` | Replace double artwork and separate mascot with the single Echo background |
| `AppShell` | Recompose into sidebar plus main hero/dashboard stage; remove the full-height right rail |
| `ProjectSidebar` | Reuse navigation semantics; rebuild brand, new-project action, active state, and progress card |
| `WorkspaceTopbar` | Rebuild into project switcher, status, target, search, notification, and user menu |
| `StructureMap` | Keep Act selection and data; replace large cards with reference-scale stage cards and connectors |
| `ChapterSwimlane` | Keep chapter selection; convert to Chapter Timeline with reorder state and a progress rail below cards |
| `AgentPanel` | Split into `AIWritingPartner` and `MemoryLayer`; extended sections move out of the first viewport |
| `InspirationVault` | Preserve data/filter behavior; present a compact three-row reference layout |
| `CharacterGraph` | Preserve SVG relationship semantics; recompose nodes and legend to the reference |
| `ClueAttributionFlow` | Preserve clue data; use restrained SVG Bézier connections |
| `ChapterDetailDrawer` | Preserve behavior and focus restoration, then restyle to Echo tokens |

Current Subagents, Skills, Review Checklist, and Focus Mode data must not be deleted. They move behind the AI Partner `View All` action, a drawer, or below the reference first viewport so they do not distort the approved composition.

## 8. Data and Interaction Contract

The first implementation remains local-fixture driven. Components must continue accepting typed data rather than embedding reference text directly in CSS or images.

Required interactions:

- current sidebar item selection;
- project switcher open/close and keyboard navigation;
- global search focus and visible focus state;
- chapter selection with `aria-pressed`;
- Reorder mode with explicit on/off state;
- Continue Writing and AI Assist action feedback;
- View All and Manage hover, focus, and activation;
- chapter details drawer with focus restoration;
- overlays above all occlusion and overflow contexts.

No interaction in this visual iteration performs server writes. Feedback must accurately communicate that the interface is a client-side demonstration.

## 9. Responsive Rules

### 9.1 1440px and above

- Retain the complete three-column dashboard.
- Scale the background proportionally by viewport width without cropping the book.
- Scale the occlusion depth with the artwork geometry.
- Preserve the AI card as a complete right column.

### 9.2 1280–1439px

- Reduce gaps, sidebar width, and right-column width.
- Preserve three columns where readable.
- Allow internal Chapter Timeline horizontal scrolling.
- Never crop the book to save dashboard width.

### 9.3 Below 1280px

- Collapse the sidebar to an icon rail or explicit drawer.
- Move AI Writing Partner and Memory Layer into the following row.
- Keep the scenic image complete at the top.
- Simplify the occlusion by beginning panel surfaces below the book edge.
- Do not simulate overlap using panel transparency.

### 9.4 Small screens

- Change to a stacked document flow.
- Treat the scenic artwork as a hero image rather than a fixed cockpit layer.
- Disable decorative movement under reduced-motion preferences.
- Prevent page-level horizontal overflow; graph and timeline regions may scroll internally with labels.

## 10. Tokens and Component Material

The implementation will consolidate the current design tokens around:

```css
--echo-page: #ffffff;
--echo-surface: #ffffff;
--echo-surface-soft: #f8fffc;
--echo-mint-50: #effdf8;
--echo-mint-100: #dff8ef;
--echo-mint-300: #7ee5c0;
--echo-mint-500: #09c779;
--echo-mint-600: #05ae68;
--echo-cyan-500: #18cbe8;
--echo-blue-600: #3458b9;
--echo-ink: #101613;
--echo-muted: #61706a;
--echo-line: #edf2f0;
--echo-danger: #ff4a4a;
--echo-radius-panel: 18px;
--echo-radius-card: 13px;
--echo-shadow-card: 0 12px 32px rgb(30 100 75 / 7%);
--echo-shadow-action: 0 10px 24px rgb(0 190 110 / 20%);
```

Buttons use pills, functional cards use the 13px card radius, and containing panels use the 18px panel radius. Shadows are green-tinted and faint. Large panels are solid, not glass.

The font stack is `Inter, SF Pro Display, system-ui, sans-serif` for compatibility with the handoff and current application. Hero display text is approximately 38–42px at the reference size; panel titles are 14–16px and supporting text is 11–13px.

## 11. Visual Asset Plan and Gaps

The provided scenic background is sufficient for the primary composition. Existing project assets can supply navigation icons, inspiration thumbnails, character portraits, and a small assistant representation.

The handoff does not include separate production files for the Echo logo symbol, top-right user portrait, or AI Partner mini-robot. The first implementation will therefore:

- construct the Echo wordmark as accessible DOM text with a restrained existing brand mark or CSS-safe geometric mark;
- use an existing local character portrait or initials for the user menu;
- use the existing local assistant asset in a cropped dedicated frame, or a simple existing SVG icon if that asset conflicts with the reference.

The scenic robot must never be cropped out of the full background to manufacture another asset.

These substitutions are allowed differences and will be called out in the final visual QA report.

## 12. Accessibility, Performance, and Engineering

- All icon-only controls require accessible names.
- Keyboard focus uses a visible mint ring and is never clipped by a mask.
- Text contrast must meet WCAG AA on solid white surfaces.
- The scenic background has empty alternative text or is a CSS decoration.
- `prefers-reduced-motion` disables decorative motion.
- The full-scene PNG is loaded once, decoded asynchronously, and given high priority.
- No base64 embedding, canvas-rendered interface, or full-page screenshot implementation is permitted.
- Large graphs use SVG for crispness and semantic DOM remains available.
- Existing unrelated user changes in the dirty worktree must be preserved.

## 13. Test and Visual QA Strategy

Implementation follows test-driven development.

### 13.1 Contract tests

- exactly one Echo scenic image is rendered;
- the scenic image source matches the registered handoff asset;
- computed style uses full opacity and no filters;
- no duplicated midground or independent full-stage mascot remains;
- occluded panels have separate surface and content elements;
- panel content is not inside the masked/cut surface;
- chapter cards remain solid and selectable;
- chapter progress is structurally after the chapter card row;
- overlays use the highest layer and are not clipped.

### 13.2 Interaction tests

- sidebar selection;
- project menu keyboard behavior;
- search focus;
- chapter selection;
- reorder toggle;
- hero action feedback;
- View All/Manage activation;
- drawer focus restoration.

### 13.3 Browser QA

Capture and inspect at minimum:

- 1672 × 941 primary reference viewport;
- 1440 × 900 full desktop;
- 1280 × 900 compressed desktop;
- one narrow/mobile viewport.

The 1672 × 941 screenshot is checked against the reference using anchor positions and a visual overlay. It is not expected to be a raw pixel match for data text and substitute icons, but the scenic image, dashboard line, panel bounds, occlusion gaps, hero placement, and major spacing must closely align.

Each viewport must report no page-level horizontal overflow, console errors, page errors, or failed asset requests. Full test, lint, typecheck/build, and `git diff --check` must pass before completion is claimed.

## 14. Implementation Sequence

1. Register and test the new Echo background without changing its bytes.
2. Replace the current visual stage with a single-image Echo background.
3. Recompose AppShell, Echo sidebar, topbar, and hero at the 1672 × 941 anchors.
4. Build the first-row dashboard grid and split panel surfaces from content.
5. Implement the book occlusion gap and panel-specific top caps.
6. Convert Structure Map and Chapter Timeline to the compact reference forms.
7. Split Agent Panel into AI Writing Partner and Memory Layer.
8. Restyle the lower three functional modules while preserving their data behavior.
9. Implement required controls, keyboard states, drawers, and feedback.
10. Add desktop compression and stacked responsive modes.
11. Run screenshot comparison and tune geometry without altering the background.
12. Run all automated and browser verification.

## 15. Acceptance Criteria

The rebuild is accepted when all of the following are true:

- the public interface is branded Echo;
- the source background is visually unchanged and loaded once;
- the page background is pure white;
- the top half reads as the supplied Hero composition;
- the book appears to grow through the dashboard rather than show through transparent cards;
- no panel border, radius, or shadow survives in the book-occluded gap;
- chapter cards remain solid, clickable, and unmasked;
- chapter progress is fully visible below the cards;
- the AI Writing Partner card is complete;
- the lower modules use real DOM and SVG content;
- the primary 1672 × 941 composition closely follows the reference anchors;
- required interactions are keyboard accessible;
- no page-level horizontal overflow or browser errors occur;
- tests, lint, typecheck/build, and diff checks pass.

## 16. Explicit Non-goals

- No backend, persistence, model call, RAG request, or real Agent execution is added.
- No full repository namespace rename is required for the public Echo rebrand.
- No new scenic artwork is generated.
- No large UI framework is introduced solely for this page.
- No reference screenshot is used as a functional page background.
