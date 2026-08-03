# Novel-native AI Writing Studio — design.md

> Version: 1.0  
> Target: Desktop Web App  
> Baseline canvas: 1920 × 1080 / 16:9  
> Core direction: white + mint green + premium designer-toy mascot + open-book story world  
> Implementation priority: visual fidelity first, functional completeness second

---

## 1. Product positioning

This product is a novel-native AI agent writing studio for fiction authors.

The experience should feel:

- premium
- playful but not childish
- intelligent
- collectible
- immersive
- creator-first
- consumer-grade rather than enterprise-grade

Avoid:

- generic SaaS dashboard aesthetics
- CRM / finance dashboard language
- cyberpunk or game HUD styling
- excessive gray backgrounds
- purple-blue AI gradients
- dense admin-table layouts

---

## 2. Core visual concept

The entire interface is based on a **Book-Origin Narrative System**:

```text
Open Book
  ↓
Story Energy / Flowers / Birds / World Fragments
  ↓
Floating AI Writing Mascot
  ↓
Functional UI Cards Embedded in the Story Space
```

The book is not a decorative banner. It is the visual origin of the whole interface.

The hero scene must communicate:

- the story world grows out of the book
- the mascot actively helps write the novel
- the UI controls are layered into the same world
- the book, mascot, and UI must feel native to one system

---

## 3. Canvas and layout

### 3.1 Desktop baseline

```text
Reference: 1920 × 1080
Aspect ratio: 16:9
Minimum width: 1280 px
```

```css
html,
body,
#app {
  width: 100%;
  min-width: 1280px;
  height: 100%;
  margin: 0;
  overflow: hidden;
}
```

### 3.2 Main structure

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Top Header                                                          │
├────────────┬────────────────────────────────────────────┬────────────┤
│ Sidebar    │ Hero / Open Book Story World              │ Right Rail │
│            │                                            │            │
│            ├────────────────────────────────────────────┤            │
│            │ Structure Map + Chapter Timeline           │            │
│            ├────────────────────────────────────────────┤            │
│            │ Inspiration + Character Graph + Clue Flow  │            │
└────────────┴────────────────────────────────────────────┴────────────┘
```

Recommended widths:

```text
Sidebar: 220–240 px
Right rail: 300–320 px
Top header: 72–80 px
Main content: remaining space
```

---

## 4. Design tokens

### 4.1 Colors

```css
:root {
  --bg-canvas: #FCFEFD;
  --bg-warm-white: #FAFCFB;
  --surface: rgba(255, 255, 255, 0.94);

  --mint-50: #F0FBF6;
  --mint-100: #E4F8EF;
  --mint-200: #CFF1E1;
  --mint-300: #A7E6C8;
  --mint-400: #5FD59D;
  --mint-500: #16B96E;
  --mint-600: #0AA55F;
  --mint-700: #07834D;

  --cyan-soft: #A9EAF2;
  --blue-soft: #9FC8FF;
  --aqua: #63DDE0;

  --ink-900: #111718;
  --ink-700: #36413E;
  --ink-500: #66716D;
  --ink-300: #AEB8B4;

  --line-soft: rgba(22, 95, 67, 0.10);
  --line-strong: rgba(22, 185, 110, 0.35);
}
```

Color ratio:

```text
White / warm white: 80–85%
Mint green: 8–12%
Cyan / blue: 4–6%
Ink / black: 3–5%
Gold detail: <1%
```

Do not tint the whole page green.

### 4.2 Typography

```css
font-family:
  Inter,
  "SF Pro Display",
  "SF Pro Text",
  "PingFang SC",
  "Noto Sans SC",
  "Microsoft YaHei",
  sans-serif;
```

Type scale:

```text
Hero headline: 40–48 px / 700
Page title: 28–32 px / 700
Section title: 18–20 px / 650
Card title: 14–16 px / 600
Body: 13–14 px / 400
Meta: 11–12 px / 400
```

---

## 5. Spatial layering system

This is the most important implementation rule.

### 5.1 Layer stack

```text
Layer 0  Canvas Background
Layer 1  Hero Story World
Layer 2  UI Outer Containers
Layer 3  Book Foreground Overlay
Layer 4  Inner Functional Cards
Layer 5  Mascot and interactive details
Layer 6  Popovers / dialogs / tooltips
```

Recommended z-index:

```css
:root {
  --z-canvas: 0;
  --z-hero-world: 10;
  --z-panel-shell: 20;
  --z-book-overlay: 30;
  --z-panel-content: 40;
  --z-mascot: 50;
  --z-overlay: 100;
}
```

---

## 6. Critical book-over-card behavior

The book’s right-lower edge must cover only the **outer shell** of the `Chapter Timeline` card.

The inner cards such as `Ch.1`, `Ch.2`, `Ch.3`, `Ch.4` must remain fully visible, unchanged, and clickable.

Correct structure:

```text
Chapter Timeline outer shell
        ↓ partially covered by
Book foreground edge
        ↓ below
Chapter Timeline inner content
```

Recommended DOM:

```tsx
<section className="timeline-stage">
  <div className="timeline-shell" />

  <div className="book-foreground-overlay" />

  <div className="timeline-content">
    <TimelineHeader />
    <ChapterCards />
  </div>
</section>
```

Recommended CSS:

```css
.timeline-stage {
  position: relative;
  isolation: isolate;
}

.timeline-shell {
  position: absolute;
  inset: 0;
  z-index: 1;
  border-radius: 24px;
  background: rgba(255,255,255,.94);
  border: 1px solid rgba(19,88,61,.08);
  box-shadow: 0 18px 42px rgba(27,74,57,.06);
}

.book-foreground-overlay {
  position: absolute;
  z-index: 2;
  top: -92px;
  left: -22px;
  right: -18px;
  height: 136px;
  pointer-events: none;
  background-image: url("/assets/hero/book-foreground.png");
  background-size: 100% auto;
  background-repeat: no-repeat;
  background-position: center bottom;
}

.timeline-content {
  position: relative;
  z-index: 3;
  padding: 24px;
}
```

Mandatory:

- `book-foreground.png` must have a real alpha channel
- only the visible lower fore-edge of the book belongs in this overlay
- do not place the full hero image above the panel
- do not cover or blur chapter cards
- do not clip the book at the panel boundary
- set `pointer-events: none`

---

## 7. Hero section

The hero contains:

- left-side headline and CTA
- central floating AI mascot
- large open book
- flowers, birds, tree, energy flow, and story fragments
- mostly white negative space

The book must:

- be opened horizontally
- tilt slightly toward the viewer
- remain clearly recognizable as a book
- have thick premium pages
- use mint and restrained gold edge details
- avoid old fantasy-book styling
- avoid a bulky crystal base

The mascot must:

- float above the book
- hold a fountain pen
- appear to be actively writing
- have a cute premium designer-toy proportion
- feel like a companion, not a game hero
- occupy about 22–26% of hero height

Hero title example:

```text
Bring your story
to life with AI
```

---

## 8. Hero assets

Use:

```text
/assets/hero/
├── hero-world-background.webp
├── book-foreground.png
├── mascot-writing.png
├── mascot-avatar.png
└── hero-particles.webp
```

Hero background:

```text
Resolution: 3840 × 2160
Format: WebP / AVIF
Color profile: sRGB
```

Book foreground overlay:

```text
Resolution: at least 2400 px wide
Format: transparent PNG / WebP
Alpha: real transparency
```

Mascot:

```text
Resolution: 1600 × 1600 or higher
Format: transparent PNG / WebP
No background
No baked-in shadow
```

---

## 9. Sidebar

Structure:

```text
Logo
New Project CTA
Navigation
Utility Icons
Daily Progress
```

Navigation:

- Home
- Structure
- Characters
- Worldbuilding
- Inspiration
- AI Review
- Projects

Active item:

```css
background: rgba(22,185,110,.10);
color: #0B7F4C;
border-radius: 14px;
```

Sidebar remains white.

---

## 10. Top header

Contains:

- product logo
- current project
- status
- target word count
- search
- notifications
- profile

Recommended height:

```text
72 px
```

Controls are light, rounded, and capsule-shaped.

---

## 11. Main modules

### 11.1 Novel Structure Map

Show:

- Act I
- Act II
- Act III
- Epilogue
- progress
- one small icon per card
- a core-conflict indicator

Keep it compact and visual.

### 11.2 Chapter Timeline

Show 5–6 chapter cards horizontally.

States:

```text
Default
Hover
Selected
Completed
Locked
```

Selected:

```css
border: 1.5px solid var(--mint-500);
box-shadow:
  0 8px 22px rgba(22,185,110,.12),
  0 0 0 3px rgba(22,185,110,.05);
```

### 11.3 Inspiration Vault

Show no more than 3 items in the first screen.

Each item:

- thumbnail
- title
- type / mood / source

No visible native scrollbar.

### 11.4 Character Relationship Graph

Use:

- circular portrait nodes
- thin relationship lines
- one central protagonist
- 4–6 surrounding characters

Relation colors:

```text
Ally: mint
Neutral: gray
Rival: coral
Unknown: dotted gray
```

### 11.5 Clue Attribution Flow

Use:

```text
Clue → Trigger → Receiver → Payoff
```

Avoid dense tables.

### 11.6 AI Writing Partner

Show:

- mascot avatar
- greeting
- active state
- up to 4 tasks
- progress bars

### 11.7 Memory Layer

Use pill tabs:

- Core Memory
- World Lore
- Timeline
- Locations
- Clues

---

## 12. Card system

Base card:

```css
.card {
  background: rgba(255,255,255,.94);
  border: 1px solid rgba(26,93,67,.08);
  border-radius: 22px;
  box-shadow:
    0 16px 42px rgba(21,61,47,.055),
    inset 0 1px 0 rgba(255,255,255,.94);
}
```

Hierarchy:

```text
Outer shell: 22–24 px radius
Inner mini-card: 14–16 px radius
Pill / tag: 999 px radius
```

Avoid:

- gray page background
- thick borders
- strong blur everywhere
- heavy black shadows
- purple-blue gradients
- random neon

---

## 13. Icons

Use:

- outline icons
- 1.5 px stroke
- rounded joins
- black / gray default
- mint active state

Recommended:

- Lucide
- Phosphor Icons
- custom SVG for brand assets

No emoji.

---

## 14. Motion design

Hero world:

```text
page energy: 14–20 s slow drift
birds: subtle parallax
flowers: 1–2 px breathing motion
particles: sparse and low-opacity
```

Mascot:

```text
idle: translateY 4–6 px
duration: 4–5 s
```

Card hover:

```text
translateY: -2 px
slightly stronger shadow
slightly greener border
```

Avoid game-like bounce.

---

## 15. Responsive rules

### Large desktop ≥ 1600 px

Use full three-column layout.

### Standard desktop 1366–1599 px

- reduce sidebar width
- reduce gaps
- reduce mascot scale
- preserve full hero and all modules

### Narrow desktop / tablet 1024–1365 px

- move right rail into drawer
- retain hero visual
- stack lower modules into two columns
- preserve book-over-timeline effect

### Mobile

Do not shrink this desktop page directly.

Design a separate mobile information architecture.

---

## 16. Suggested component tree

```tsx
<AppShell>
  <TopHeader />
  <Sidebar />

  <MainViewport>
    <HeroStage>
      <HeroCopy />
      <HeroWorld />
      <Mascot />
    </HeroStage>

    <WorkspaceGrid>
      <StructureMap />

      <TimelineStage>
        <TimelineShell />
        <BookForegroundOverlay />

        <TimelineContent>
          <TimelineHeader />
          <ChapterCards />
        </TimelineContent>
      </TimelineStage>

      <InspirationVault />
      <CharacterGraph />
      <ClueAttributionFlow />
    </WorkspaceGrid>
  </MainViewport>

  <RightRail>
    <AIWritingPartner />
    <MemoryLayer />
  </RightRail>
</AppShell>
```

---

## 17. Folder structure

```text
src/
├── app/
├── components/
│   ├── layout/
│   ├── hero/
│   ├── structure/
│   ├── timeline/
│   ├── inspiration/
│   ├── characters/
│   ├── clues/
│   ├── agent/
│   └── memory/
├── styles/
│   ├── tokens.css
│   ├── globals.css
│   └── components.css
├── assets/
│   ├── hero/
│   ├── mascot/
│   ├── thumbnails/
│   └── icons/
└── data/
```

---

## 18. Acceptance criteria

### Visual

- canvas is white / warm white, not gray
- the book is clearly recognizable
- the book overlaps only the Chapter Timeline outer shell
- chapter mini-cards remain visible and clickable
- hero visuals do not reduce text readability
- mascot feels like a premium designer toy
- interface does not look like enterprise SaaS

### Layout

- no visible native scrollbar in the first screen
- all major modules fit the 16:9 baseline
- no uncontrolled scaling
- no large empty gaps caused by missing demo data

### Interaction

- selected chapter has a clear mint-green state
- cards have subtle hover elevation
- mascot movement is calm
- book overlay has `pointer-events: none`

### Performance

- optimize first-screen imagery
- prefer WebP / AVIF where possible
- lazy-load lower thumbnails
- maintain 60 fps for idle animations

---

## 19. Final principle

The author should not feel like they are opening a dashboard.

They should feel like they are entering a living story world generated from an open book, with an AI companion actively helping shape the novel.

The book is the origin.

The mascot is the companion.

The UI is the author’s control layer.
