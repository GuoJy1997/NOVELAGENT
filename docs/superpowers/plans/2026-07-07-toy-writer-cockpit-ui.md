# Toy Writer Cockpit UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first working desktop web prototype of the Toy Writer Cockpit: a novel project dashboard with sidebar navigation, novel structure map, clue attribution chain, inspiration/character panels, Agent orchestration panel, and a static mascot/background visual layer.

**Architecture:** Create a Vite + React + TypeScript app under `apps/web` while keeping root-level `docs/` independent for specs and plans. The first implementation is mock-data-driven and componentized by product area, so visual layout and interaction contracts can be validated before backend, real model orchestration, or complex graph editing exists.

**Tech Stack:** Vite, React, TypeScript, Vitest, Testing Library, CSS Modules/plain CSS, SVG for first-pass structure/relationship lines.

---

## Source Spec

- `docs/superpowers/specs/2026-07-07-toy-writer-cockpit-ui-design.md`

## Scope Check

This plan implements only the first desktop web UI prototype described in the spec:

- App shell and brand-mode cockpit layout.
- Left project sidebar.
- Central novel structure map with chapter selection.
- Bottom clue attribution chain linked to selected chapter.
- Inspiration vault and character graph preview.
- Right Agent orchestration panel.
- Static mascot/background visual layer.
- Tests for data shape, selection behavior, risk markers, and core rendering.

This plan does not implement backend persistence, real LLM calls, real subagent execution, complete drag-and-drop editing, real publishing platform connectors, full long-term memory infrastructure, or a desktop wrapper.

## File Structure

```text
.
├─ package.json
├─ .gitignore
├─ docs/
│  └─ superpowers/
│     ├─ specs/
│     │  └─ 2026-07-07-toy-writer-cockpit-ui-design.md
│     └─ plans/
│        └─ 2026-07-07-toy-writer-cockpit-ui.md
└─ apps/
   └─ web/
      ├─ package.json
      ├─ index.html
      ├─ vite.config.ts
      ├─ vitest.setup.ts
      ├─ tsconfig.json
      ├─ tsconfig.app.json
      ├─ tsconfig.node.json
      ├─ public/
      │  └─ assets/
      │     ├─ backgrounds/.gitkeep
      │     ├─ mascot/.gitkeep
      │     └─ textures/.gitkeep
      └─ src/
         ├─ main.tsx
         ├─ App.tsx
         ├─ styles/
         │  ├─ tokens.css
         │  └─ global.css
         └─ features/
            └─ toy-writer-cockpit/
               ├─ types.ts
               ├─ data/
               │  ├─ mockNovelProject.ts
               │  └─ mockNovelProject.test.ts
               ├─ components/
               │  ├─ AgentOrchestrationPanel.tsx
               │  ├─ AppShell.tsx
               │  ├─ CharacterGraphPreview.tsx
               │  ├─ ClueAttributionPanel.tsx
               │  ├─ InspirationVault.tsx
               │  ├─ MascotCompanion.tsx
               │  ├─ NovelStructureMap.tsx
               │  ├─ ProjectSidebar.tsx
               │  └─ WorkspaceHeader.tsx
               └─ components/
                  ├─ AgentOrchestrationPanel.test.tsx
                  ├─ ClueAttributionPanel.test.tsx
                  ├─ NovelStructureMap.test.tsx
                  └─ ProjectSidebar.test.tsx
```

## Implementation Tasks

### Task 1: Initialize Repository and Web App Scaffold

**Files:**
- Create: `.gitignore`
- Create: `package.json`
- Track existing: `docs/superpowers/specs/2026-07-07-toy-writer-cockpit-ui-design.md`
- Track existing: `docs/superpowers/plans/2026-07-07-toy-writer-cockpit-ui.md`
- Create: `apps/web/` via Vite scaffold
- Modify: `apps/web/package.json`
- Modify: `apps/web/vite.config.ts`
- Create: `apps/web/vitest.setup.ts`
- Create: `apps/web/public/assets/backgrounds/.gitkeep`
- Create: `apps/web/public/assets/mascot/.gitkeep`
- Create: `apps/web/public/assets/textures/.gitkeep`

- [ ] **Step 1: Initialize git if the directory is not already a repository**

Run:

```powershell
git rev-parse --is-inside-work-tree
```

Expected if not initialized:

```text
fatal: not a git repository (or any of the parent directories): .git
```

Then run:

```powershell
git init
git checkout -b feature/toy-writer-cockpit-ui
```

Expected:

```text
Initialized empty Git repository
Switched to a new branch 'feature/toy-writer-cockpit-ui'
```

- [ ] **Step 2: Create root ignore rules before the first commit**

Create `.gitignore`:

```gitignore
node_modules/
dist/
.DS_Store
*.local
.env
.env.*
!.env.example
.superpowers/
apps/web/node_modules/
apps/web/dist/
coverage/
```

- [ ] **Step 3: Commit the reviewed spec and implementation plan**

Run:

```powershell
git add .gitignore docs/superpowers/specs/2026-07-07-toy-writer-cockpit-ui-design.md docs/superpowers/plans/2026-07-07-toy-writer-cockpit-ui.md
git commit -m "docs: add cockpit ui spec and plan"
```

Expected:

```text
[feature/toy-writer-cockpit-ui ...] docs: add cockpit ui spec and plan
```

- [ ] **Step 4: Create the Vite React TypeScript app**

Run:

```powershell
npm create vite@latest apps/web -- --template react-ts
```

Expected:

```text
Done. Now run:
  cd apps/web
  npm install
  npm run dev
```

- [ ] **Step 5: Install app dependencies**

Run:

```powershell
Set-Location apps/web
npm install
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
Set-Location ..\..
```

Expected:

```text
added
found 0 vulnerabilities
```

- [ ] **Step 6: Create root workspace package file**

Create `package.json`:

```json
{
  "name": "novel-agent",
  "private": true,
  "version": "0.1.0",
  "scripts": {
    "dev:web": "npm --prefix apps/web run dev",
    "build:web": "npm --prefix apps/web run build",
    "test:web": "npm --prefix apps/web run test -- --run",
    "lint:web": "npm --prefix apps/web run lint"
  }
}
```

- [ ] **Step 7: Update app package scripts**

Modify `apps/web/package.json` so the scripts section contains:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "vitest"
  }
}
```

Keep the dependencies generated by Vite and the testing dependencies installed in Step 3.
Keep the dependencies generated by Vite and the testing dependencies installed in Step 5.

- [ ] **Step 8: Configure Vitest**

Replace `apps/web/vite.config.ts` with:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    globals: true,
  },
});
```

Create `apps/web/vitest.setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 9: Create asset directories**

Run:

```powershell
New-Item -ItemType Directory -Force -Path apps/web/public/assets/backgrounds,apps/web/public/assets/mascot,apps/web/public/assets/textures | Out-Null
New-Item -ItemType File -Force -Path apps/web/public/assets/backgrounds/.gitkeep,apps/web/public/assets/mascot/.gitkeep,apps/web/public/assets/textures/.gitkeep | Out-Null
```

Expected: no output.

- [ ] **Step 10: Verify scaffold**

Run:

```powershell
npm run build:web
npm run test:web
```

Expected:

```text
built in
No test files found
```

The exact no-test message may differ by Vitest version. The build must pass.

- [ ] **Step 11: Commit scaffold**

Run:

```powershell
git add .gitignore package.json apps/web/package.json apps/web/vite.config.ts apps/web/vitest.setup.ts apps/web/public
git commit -m "chore: scaffold web cockpit app"
```

Expected:

```text
[main ...] chore: scaffold web cockpit app
```

### Task 2: Add Domain Types and Mock Novel Project Data

**Files:**
- Create: `apps/web/src/features/toy-writer-cockpit/types.ts`
- Create: `apps/web/src/features/toy-writer-cockpit/data/mockNovelProject.ts`
- Create: `apps/web/src/features/toy-writer-cockpit/data/mockNovelProject.test.ts`

- [ ] **Step 1: Create failing data tests**

Create `apps/web/src/features/toy-writer-cockpit/data/mockNovelProject.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { mockNovelProject } from './mockNovelProject';

describe('mockNovelProject', () => {
  it('keeps all project data scoped to one novel project', () => {
    expect(mockNovelProject.id).toBe('tides-of-embers');
    expect(mockNovelProject.title).toBe('Tides of Embers');
    expect(mockNovelProject.chapters.length).toBeGreaterThanOrEqual(5);
    expect(mockNovelProject.clueChains.length).toBeGreaterThanOrEqual(1);
  });

  it('has complete clue attribution fields for every clue chain', () => {
    for (const chain of mockNovelProject.clueChains) {
      expect(chain.provider.label).toBeTruthy();
      expect(chain.trigger.label).toBeTruthy();
      expect(chain.receiver.label).toBeTruthy();
      expect(chain.payoff.label).toBeTruthy();
      expect(chain.credibility).toMatch(/true|false|partial|misread|bait/);
    }
  });

  it('links the selected chapter seed to a clue chain', () => {
    const selectedChapter = mockNovelProject.chapters.find((chapter) => chapter.selected);
    expect(selectedChapter?.id).toBe('chapter-3');
    expect(mockNovelProject.clueChains.some((chain) => chain.relatedChapterIds.includes('chapter-3'))).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm --prefix apps/web run test -- src/features/toy-writer-cockpit/data/mockNovelProject.test.ts --run
```

Expected:

```text
FAIL
Cannot find module './mockNovelProject'
```

- [ ] **Step 3: Create domain types**

Create `apps/web/src/features/toy-writer-cockpit/types.ts`:

```ts
export type ChapterStatus = 'Draft' | 'Planned' | 'Writing' | 'Reviewing' | 'Done' | 'Locked';
export type RiskLevel = 'low' | 'medium' | 'high';
export type TaskStatus = 'Queued' | 'Running' | 'WaitingApproval' | 'Done' | 'Failed' | 'Cancelled';
export type InspirationStatus = 'Inbox' | 'Organized' | 'Incubating' | 'Adopted' | 'Used' | 'Archived';
export type ClueCredibility = 'true' | 'false' | 'partial' | 'misread' | 'bait';

export interface ProjectNavigationItem {
  id: string;
  label: string;
  icon: string;
  selected?: boolean;
  notification?: boolean;
}

export interface StoryMilestone {
  id: string;
  label: string;
  chapterId: string;
  tone: 'teal' | 'amber' | 'ember';
}

export interface ChapterCard {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  actId: string;
  status: ChapterStatus;
  clueCount: number;
  foreshadowingCount: number;
  riskLevel: RiskLevel;
  selected?: boolean;
  locked?: boolean;
}

export interface InspirationCard {
  id: string;
  title: string;
  summary: string;
  status: InspirationStatus;
  tags: string[];
  relatedChapterIds: string[];
}

export interface CharacterNode {
  id: string;
  name: string;
  role: string;
  relationship: string;
}

export interface CharacterEdge {
  id: string;
  sourceCharacterId: string;
  targetCharacterId: string;
  relationshipType: string;
}

export interface ClueChainNode {
  label: string;
  detail: string;
}

export interface ClueChain {
  id: string;
  title: string;
  provider: ClueChainNode;
  trigger: ClueChainNode;
  receiver: ClueChainNode;
  payoff: ClueChainNode;
  credibility: ClueCredibility;
  relatedChapterIds: string[];
  missingFields: Array<'provider' | 'trigger' | 'receiver' | 'payoff'>;
}

export interface AgentTask {
  id: string;
  title: string;
  status: TaskStatus;
  assignedSubagent: string;
  skills: string[];
  requiresApproval: boolean;
}

export interface SubagentProfile {
  id: string;
  name: string;
  role: string;
  active: boolean;
}

export interface SkillBadge {
  id: string;
  label: string;
  category: 'writing' | 'review' | 'planning' | 'memory';
}

export interface ReviewChecklistItem {
  id: string;
  label: string;
  passed: boolean;
}

export interface NovelProject {
  id: string;
  title: string;
  genre: string;
  currentView: 'Map' | 'Timeline' | 'List';
  navigation: ProjectNavigationItem[];
  chapters: ChapterCard[];
  milestones: StoryMilestone[];
  inspirations: InspirationCard[];
  characters: CharacterNode[];
  characterEdges: CharacterEdge[];
  clueChains: ClueChain[];
  agentTasks: AgentTask[];
  subagents: SubagentProfile[];
  skills: SkillBadge[];
  memorySyncPercent: number;
  reviewChecklist: ReviewChecklistItem[];
}
```

- [ ] **Step 4: Create mock project data**

Create `apps/web/src/features/toy-writer-cockpit/data/mockNovelProject.ts`:

```ts
import type { NovelProject } from '../types';

export const mockNovelProject: NovelProject = {
  id: 'tides-of-embers',
  title: 'Tides of Embers',
  genre: 'Epic Fantasy',
  currentView: 'Map',
  navigation: [
    { id: 'projects', label: 'Projects', icon: '⌂', selected: true, notification: true },
    { id: 'inspiration', label: 'Inspiration', icon: '✦' },
    { id: 'characters', label: 'Characters', icon: '♙' },
    { id: 'worldbuilding', label: 'Worldbuilding', icon: '◎' },
    { id: 'outline', label: 'Outline', icon: '✧' },
    { id: 'review', label: 'Review', icon: '✓' },
  ],
  chapters: [
    {
      id: 'chapter-1',
      order: 1,
      title: 'Wake of Salt',
      subtitle: 'Inciting Incident',
      actId: 'ACT I',
      status: 'Done',
      clueCount: 2,
      foreshadowingCount: 1,
      riskLevel: 'low',
    },
    {
      id: 'chapter-2',
      order: 2,
      title: 'Ashes of Promise',
      subtitle: 'First Turning Point',
      actId: 'ACT I',
      status: 'Reviewing',
      clueCount: 3,
      foreshadowingCount: 2,
      riskLevel: 'medium',
    },
    {
      id: 'chapter-3',
      order: 3,
      title: 'Echoes in the Deep',
      subtitle: 'Midpoint',
      actId: 'ACT II',
      status: 'Writing',
      clueCount: 5,
      foreshadowingCount: 3,
      riskLevel: 'medium',
      selected: true,
    },
    {
      id: 'chapter-4',
      order: 4,
      title: 'The Old Current',
      subtitle: 'Second Turning Point',
      actId: 'ACT II',
      status: 'Planned',
      clueCount: 2,
      foreshadowingCount: 2,
      riskLevel: 'low',
    },
    {
      id: 'chapter-5',
      order: 5,
      title: 'Fractured Oaths',
      subtitle: 'Crisis',
      actId: 'ACT III',
      status: 'Planned',
      clueCount: 4,
      foreshadowingCount: 4,
      riskLevel: 'high',
    },
    {
      id: 'chapter-6',
      order: 6,
      title: 'Storm Unbound',
      subtitle: 'Climax',
      actId: 'ACT III',
      status: 'Locked',
      clueCount: 0,
      foreshadowingCount: 0,
      riskLevel: 'medium',
      locked: true,
    },
  ],
  milestones: [
    { id: 'milestone-1', label: 'Inciting Incident', chapterId: 'chapter-1', tone: 'teal' },
    { id: 'milestone-2', label: 'First Turning Point', chapterId: 'chapter-2', tone: 'teal' },
    { id: 'milestone-3', label: 'Midpoint', chapterId: 'chapter-3', tone: 'amber' },
    { id: 'milestone-4', label: 'Second Turning Point', chapterId: 'chapter-4', tone: 'teal' },
    { id: 'milestone-5', label: 'Crisis', chapterId: 'chapter-5', tone: 'teal' },
    { id: 'milestone-6', label: 'Climax', chapterId: 'chapter-6', tone: 'ember' },
  ],
  inspirations: [
    {
      id: 'idea-1',
      title: 'Lighthouse in the fog',
      summary: 'A beacon that only appears when a character lies.',
      status: 'Incubating',
      tags: ['setting', 'clue'],
      relatedChapterIds: ['chapter-3'],
    },
    {
      id: 'idea-2',
      title: 'Old tide maps fragment',
      summary: 'A torn map shows vanished tunnels below the harbor.',
      status: 'Adopted',
      tags: ['map', 'payoff'],
      relatedChapterIds: ['chapter-3', 'chapter-7'],
    },
    {
      id: 'idea-3',
      title: 'The price of keeping a vow',
      summary: 'A mentor hides the truth to preserve a family oath.',
      status: 'Organized',
      tags: ['character', 'theme'],
      relatedChapterIds: ['chapter-5'],
    },
  ],
  characters: [
    { id: 'kael', name: 'Kael', role: 'Ally', relationship: 'protects Liora' },
    { id: 'liora', name: 'Liora', role: 'POV', relationship: 'sees the pattern' },
    { id: 'voren', name: 'Voren', role: 'Antagonist', relationship: 'hides the old pact' },
    { id: 'edda', name: 'Edda', role: 'Mentor', relationship: 'withholds context' },
    { id: 'marek', name: 'Marek', role: 'Sibling', relationship: 'misreads evidence' },
  ],
  characterEdges: [
    { id: 'edge-1', sourceCharacterId: 'kael', targetCharacterId: 'liora', relationshipType: 'trust' },
    { id: 'edge-2', sourceCharacterId: 'liora', targetCharacterId: 'voren', relationshipType: 'conflict' },
    { id: 'edge-3', sourceCharacterId: 'edda', targetCharacterId: 'liora', relationshipType: 'secret' },
    { id: 'edge-4', sourceCharacterId: 'marek', targetCharacterId: 'liora', relationshipType: 'family' },
  ],
  clueChains: [
    {
      id: 'clue-old-tide-map',
      title: 'Old Tide Map',
      provider: { label: 'Chapter 1', detail: 'Old Tide Map' },
      trigger: { label: 'Chapter 3', detail: 'Faded coordinates discovered' },
      receiver: { label: 'Liora', detail: 'Sees the hidden pattern' },
      payoff: { label: 'Chapter 7', detail: 'Reveals the path to the deep tunnels' },
      credibility: 'true',
      relatedChapterIds: ['chapter-1', 'chapter-3'],
      missingFields: [],
    },
    {
      id: 'clue-false-sigil',
      title: 'False Harbor Sigil',
      provider: { label: 'Voren', detail: 'Plants a copied sigil' },
      trigger: { label: 'Chapter 3', detail: 'Marek notices the wrong seal' },
      receiver: { label: 'Marek', detail: 'Believes Kael is compromised' },
      payoff: { label: 'Chapter 5', detail: 'The sigil is revealed as bait' },
      credibility: 'bait',
      relatedChapterIds: ['chapter-3', 'chapter-5'],
      missingFields: [],
    },
  ],
  agentTasks: [
    {
      id: 'task-1',
      title: 'Analyze Chapter 3',
      status: 'Done',
      assignedSubagent: 'Story Architect',
      skills: ['Structure Analysis'],
      requiresApproval: false,
    },
    {
      id: 'task-2',
      title: 'Check Continuity',
      status: 'Running',
      assignedSubagent: 'Critic Sage',
      skills: ['Continuity Review'],
      requiresApproval: false,
    },
    {
      id: 'task-3',
      title: 'Deepen Character Arc',
      status: 'Queued',
      assignedSubagent: 'Story Architect',
      skills: ['Character Arc'],
      requiresApproval: true,
    },
    {
      id: 'task-4',
      title: 'Plant Foreshadowing',
      status: 'Queued',
      assignedSubagent: 'Clue Weaver',
      skills: ['Clue Planting'],
      requiresApproval: true,
    },
  ],
  subagents: [
    { id: 'story-architect', name: 'Story Architect', role: 'Structure', active: true },
    { id: 'clue-weaver', name: 'Clue Weaver', role: 'Foreshadowing', active: true },
    { id: 'lore-keeper', name: 'Lore Keeper', role: 'Worldbuilding', active: false },
    { id: 'critic-sage', name: 'Critic Sage', role: 'Review', active: true },
  ],
  skills: [
    { id: 'structure-analysis', label: 'Structure Analysis', category: 'planning' },
    { id: 'clue-planting', label: 'Clue Planting', category: 'planning' },
    { id: 'pacing-tuner', label: 'Pacing Tuner', category: 'review' },
    { id: 'dialogue-craft', label: 'Dialogue Craft', category: 'writing' },
    { id: 'theme-weaving', label: 'Theme Weaving', category: 'writing' },
    { id: 'tone-shaping', label: 'Tone Shaping', category: 'writing' },
  ],
  memorySyncPercent: 78,
  reviewChecklist: [
    { id: 'goal-stakes', label: 'Goal & Stakes Clear', passed: true },
    { id: 'scene-purpose', label: 'Scene Purpose Strong', passed: true },
    { id: 'tension', label: 'Tension Progression', passed: false },
    { id: 'character', label: 'Character Consistency', passed: false },
    { id: 'foreshadowing', label: 'Foreshadowing Planted', passed: false },
  ],
};
```

- [ ] **Step 5: Run data tests**

Run:

```powershell
npm --prefix apps/web run test -- src/features/toy-writer-cockpit/data/mockNovelProject.test.ts --run
```

Expected:

```text
PASS src/features/toy-writer-cockpit/data/mockNovelProject.test.ts
```

- [ ] **Step 6: Commit domain data**

Run:

```powershell
git add apps/web/src/features/toy-writer-cockpit
git commit -m "feat: add cockpit domain mock data"
```

Expected:

```text
[main ...] feat: add cockpit domain mock data
```

### Task 3: Add Design Tokens, Global Styles, and App Entry

**Files:**
- Create: `apps/web/src/styles/tokens.css`
- Create: `apps/web/src/styles/global.css`
- Modify: `apps/web/src/main.tsx`
- Modify: `apps/web/src/App.tsx`

- [ ] **Step 1: Create design tokens**

Create `apps/web/src/styles/tokens.css`:

```css
:root {
  color-scheme: dark;
  --color-bg-base: #0f0c09;
  --color-bg-panel: #211a13;
  --color-bg-card: #3a2c20;
  --color-paper: #d8c3a0;
  --color-accent-primary: #f28a2e;
  --color-accent-brass: #b88a4a;
  --color-accent-support: #4c9a8a;
  --color-text-primary: #f3e4c6;
  --color-text-secondary: #a9987a;
  --color-state-done: #6fae7d;
  --color-state-warning: #d49a3a;
  --color-state-danger: #b65a3c;
  --color-border-soft: rgba(216, 195, 160, 0.22);
  --shadow-deep: 0 24px 80px rgba(0, 0, 0, 0.45);
  --shadow-card: 0 12px 34px rgba(0, 0, 0, 0.26);
  --radius-shell: 28px;
  --radius-panel: 22px;
  --radius-card: 16px;
  --font-ui: Inter, "Microsoft YaHei", "PingFang SC", system-ui, sans-serif;
  --font-display: Georgia, "Times New Roman", "Songti SC", serif;
  --motion-fast: 160ms ease-out;
  --motion-medium: 280ms ease;
}
```

- [ ] **Step 2: Create global CSS**

Create `apps/web/src/styles/global.css`:

```css
@import './tokens.css';

* {
  box-sizing: border-box;
}

html,
body,
#root {
  min-width: 100%;
  min-height: 100%;
  margin: 0;
}

body {
  background:
    radial-gradient(circle at 12% 15%, rgba(242, 138, 46, 0.12), transparent 32%),
    radial-gradient(circle at 84% 18%, rgba(76, 154, 138, 0.12), transparent 28%),
    var(--color-bg-base);
  color: var(--color-text-primary);
  font-family: var(--font-ui);
}

button {
  font: inherit;
}

button,
a {
  -webkit-tap-highlight-color: transparent;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

- [ ] **Step 3: Update app entry imports**

Replace `apps/web/src/main.tsx` with:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 4: Update App component**

Replace `apps/web/src/App.tsx` with:

```tsx
export default function App() {
  return (
    <main aria-label="Toy Writer Cockpit">
      <h1>Toy Writer Cockpit</h1>
      <p>Novel-native Agent dashboard prototype.</p>
    </main>
  );
}
```

- [ ] **Step 5: Verify build**

Run:

```powershell
npm run build:web
```

Expected:

```text
built in
```

- [ ] **Step 6: Commit base styling**

Run:

```powershell
git add apps/web/src
git commit -m "feat: add cockpit design tokens"
```

Expected:

```text
[main ...] feat: add cockpit design tokens
```

### Task 4: Build AppShell, Workspace Header, and Mascot Visual Layer

**Files:**
- Create: `apps/web/src/features/toy-writer-cockpit/components/AppShell.tsx`
- Create: `apps/web/src/features/toy-writer-cockpit/components/WorkspaceHeader.tsx`
- Create: `apps/web/src/features/toy-writer-cockpit/components/MascotCompanion.tsx`
- Modify: `apps/web/src/App.tsx`

- [ ] **Step 1: Create AppShell component**

Create `apps/web/src/features/toy-writer-cockpit/components/AppShell.tsx`:

```tsx
import type { ReactNode } from 'react';

interface AppShellProps {
  sidebar: ReactNode;
  header: ReactNode;
  structureMap: ReactNode;
  lowerPanels: ReactNode;
  clueAttribution: ReactNode;
  orchestration: ReactNode;
  mascot: ReactNode;
}

export function AppShell({
  sidebar,
  header,
  structureMap,
  lowerPanels,
  clueAttribution,
  orchestration,
  mascot,
}: AppShellProps) {
  return (
    <main className="cockpitScene" aria-label="Toy Writer Cockpit">
      <div className="sceneDecor sceneDecorLeft" aria-hidden="true" />
      <div className="sceneDecor sceneDecorRight" aria-hidden="true" />
      {mascot}
      <section className="mainConsole" aria-label="Novel Agent workspace">
        <aside className="projectRail">{sidebar}</aside>
        <section className="workspaceColumn">
          {header}
          {structureMap}
          {lowerPanels}
          {clueAttribution}
        </section>
        <aside className="agentRail">{orchestration}</aside>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Create WorkspaceHeader component**

Create `apps/web/src/features/toy-writer-cockpit/components/WorkspaceHeader.tsx`:

```tsx
interface WorkspaceHeaderProps {
  title: string;
  currentView: 'Map' | 'Timeline' | 'List';
}

const views: Array<'Map' | 'Timeline' | 'List'> = ['Map', 'Timeline', 'List'];

export function WorkspaceHeader({ title, currentView }: WorkspaceHeaderProps) {
  return (
    <header className="workspaceHeader">
      <div>
        <p className="eyebrow">Novel Structure</p>
        <h1>{title}</h1>
      </div>
      <nav className="viewTabs" aria-label="Structure view tabs">
        {views.map((view) => (
          <button
            className={view === currentView ? 'viewTab isActive' : 'viewTab'}
            type="button"
            aria-pressed={view === currentView}
            key={view}
          >
            {view}
          </button>
        ))}
      </nav>
    </header>
  );
}
```

- [ ] **Step 3: Create MascotCompanion component**

Create `apps/web/src/features/toy-writer-cockpit/components/MascotCompanion.tsx`:

```tsx
export function MascotCompanion() {
  return (
    <aside className="mascotCompanion" aria-label="AI writing companion">
      <div className="mascotHead">
        <span className="mascotEye" />
        <span className="mascotEye" />
      </div>
      <div className="mascotBody">
        <span className="mascotNib" />
      </div>
      <p>Story Buddy</p>
    </aside>
  );
}
```

- [ ] **Step 4: Add AppShell styles to global CSS**

Append to `apps/web/src/styles/global.css`:

```css
.cockpitScene {
  position: relative;
  min-height: 100vh;
  padding: 32px;
  overflow: hidden;
}

.sceneDecor {
  position: absolute;
  border-radius: 999px;
  filter: blur(2px);
  opacity: 0.5;
}

.sceneDecorLeft {
  width: 260px;
  height: 520px;
  left: -90px;
  top: 80px;
  background: linear-gradient(180deg, rgba(216, 195, 160, 0.12), transparent);
}

.sceneDecorRight {
  width: 220px;
  height: 460px;
  right: -80px;
  top: 120px;
  background: linear-gradient(180deg, rgba(242, 138, 46, 0.12), transparent);
}

.mainConsole {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: minmax(170px, 0.75fr) minmax(720px, 3.2fr) minmax(280px, 1fr);
  gap: 16px;
  width: min(1500px, calc(100vw - 64px));
  min-height: calc(100vh - 64px);
  margin: 0 auto;
  padding: 16px;
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-shell);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.04), transparent 38%),
    rgba(22, 17, 12, 0.92);
  box-shadow: var(--shadow-deep);
}

.projectRail,
.agentRail,
.workspaceColumn {
  min-width: 0;
}

.workspaceColumn {
  display: grid;
  grid-template-rows: auto minmax(260px, 1.1fr) minmax(170px, 0.55fr) minmax(120px, 0.4fr);
  gap: 14px;
}

.workspaceHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 8px 10px;
}

.workspaceHeader h1 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.35rem;
  letter-spacing: 0.01em;
}

.eyebrow {
  margin: 0 0 4px;
  color: var(--color-text-secondary);
  font-size: 0.72rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.viewTabs {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  border: 1px solid var(--color-border-soft);
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.24);
}

.viewTab {
  min-width: 74px;
  padding: 9px 14px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.viewTab.isActive {
  background: rgba(242, 138, 46, 0.18);
  color: var(--color-text-primary);
  box-shadow: inset 0 0 0 1px rgba(242, 138, 46, 0.32);
}

.mascotCompanion {
  position: absolute;
  z-index: 3;
  left: clamp(8px, 2vw, 36px);
  bottom: clamp(8px, 3vh, 38px);
  width: 160px;
  text-align: center;
  color: var(--color-text-primary);
}

.mascotHead {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 22px;
  width: 128px;
  height: 112px;
  margin: 0 auto;
  border-radius: 48% 48% 44% 44%;
  background: linear-gradient(145deg, #f6dfbd, #8e7761 64%, #2a2119);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.36);
}

.mascotEye {
  width: 22px;
  height: 30px;
  border-radius: 999px;
  background: #0f0c09;
  box-shadow: inset 0 6px 5px rgba(255, 255, 255, 0.35);
}

.mascotBody {
  width: 96px;
  height: 82px;
  margin: -10px auto 0;
  border-radius: 28px 28px 36px 36px;
  background: linear-gradient(145deg, #ece0cc, #3a3028);
}

.mascotNib {
  display: inline-block;
  width: 24px;
  height: 42px;
  margin-top: 18px;
  clip-path: polygon(50% 0, 100% 62%, 50% 100%, 0 62%);
  background: var(--color-accent-primary);
}

.mascotCompanion p {
  margin: 8px 0 0;
  color: var(--color-text-secondary);
  font-size: 0.8rem;
}
```

- [ ] **Step 5: Wire AppShell into App**

Replace `apps/web/src/App.tsx` with:

```tsx
import { AppShell } from './features/toy-writer-cockpit/components/AppShell';
import { MascotCompanion } from './features/toy-writer-cockpit/components/MascotCompanion';
import { WorkspaceHeader } from './features/toy-writer-cockpit/components/WorkspaceHeader';
import { mockNovelProject } from './features/toy-writer-cockpit/data/mockNovelProject';

export default function App() {
  return (
    <AppShell
      sidebar={<div>Project Sidebar</div>}
      header={<WorkspaceHeader title="Novel Structure Map" currentView={mockNovelProject.currentView} />}
      structureMap={<section>Structure Map</section>}
      lowerPanels={<section>Lower Panels</section>}
      clueAttribution={<section>Clue Attribution</section>}
      orchestration={<section>AI Orchestration</section>}
      mascot={<MascotCompanion />}
    />
  );
}
```

- [ ] **Step 6: Verify build**

Run:

```powershell
npm run build:web
```

Expected:

```text
built in
```

- [ ] **Step 7: Commit shell**

Run:

```powershell
git add apps/web/src
git commit -m "feat: add toy writer cockpit shell"
```

Expected:

```text
[main ...] feat: add toy writer cockpit shell
```

### Task 5: Implement Project Sidebar

**Files:**
- Create: `apps/web/src/features/toy-writer-cockpit/components/ProjectSidebar.tsx`
- Create: `apps/web/src/features/toy-writer-cockpit/components/ProjectSidebar.test.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles/global.css`

- [ ] **Step 1: Write sidebar tests**

Create `apps/web/src/features/toy-writer-cockpit/components/ProjectSidebar.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockNovelProject } from '../data/mockNovelProject';
import { ProjectSidebar } from './ProjectSidebar';

describe('ProjectSidebar', () => {
  it('renders the current project and navigation entries', () => {
    render(<ProjectSidebar project={mockNovelProject} />);

    expect(screen.getByText('Tides of Embers')).toBeInTheDocument();
    expect(screen.getByText('Epic Fantasy')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Projects/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Inspiration/i })).toBeInTheDocument();
  });

  it('shows notification status for nav items with pending signals', () => {
    render(<ProjectSidebar project={mockNovelProject} />);

    expect(screen.getByLabelText('Projects has updates')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run sidebar test to verify it fails**

Run:

```powershell
npm --prefix apps/web run test -- src/features/toy-writer-cockpit/components/ProjectSidebar.test.tsx --run
```

Expected:

```text
FAIL
Cannot find module './ProjectSidebar'
```

- [ ] **Step 3: Implement ProjectSidebar**

Create `apps/web/src/features/toy-writer-cockpit/components/ProjectSidebar.tsx`:

```tsx
import type { NovelProject } from '../types';

interface ProjectSidebarProps {
  project: NovelProject;
}

export function ProjectSidebar({ project }: ProjectSidebarProps) {
  return (
    <section className="projectSidebar" aria-label="Project navigation">
      <article className="currentProjectCard">
        <div className="projectCover" aria-hidden="true" />
        <p>Current Project</p>
        <h2>{project.title}</h2>
        <span>{project.genre}</span>
      </article>

      <nav className="projectNav">
        {project.navigation.map((item) => (
          <button
            type="button"
            className={item.selected ? 'projectNavItem isSelected' : 'projectNavItem'}
            aria-pressed={item.selected ? 'true' : 'false'}
            key={item.id}
          >
            <span className="navIcon" aria-hidden="true">
              {item.icon}
            </span>
            <span>{item.label}</span>
            {item.notification ? (
              <span className="notificationDot" aria-label={`${item.label} has updates`} />
            ) : null}
          </button>
        ))}
      </nav>
    </section>
  );
}
```

- [ ] **Step 4: Add sidebar styles**

Append to `apps/web/src/styles/global.css`:

```css
.projectSidebar {
  height: 100%;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 14px;
}

.currentProjectCard {
  padding: 12px;
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-panel);
  background: linear-gradient(180deg, rgba(216, 195, 160, 0.1), rgba(0, 0, 0, 0.2));
}

.projectCover {
  min-height: 120px;
  border-radius: 14px;
  background:
    linear-gradient(180deg, rgba(242, 138, 46, 0.18), rgba(15, 12, 9, 0.55)),
    radial-gradient(circle at 50% 15%, rgba(216, 195, 160, 0.28), transparent 34%),
    #2a2118;
  margin-bottom: 10px;
}

.currentProjectCard p,
.currentProjectCard span {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.75rem;
}

.currentProjectCard h2 {
  margin: 4px 0;
  font-family: var(--font-display);
  font-size: 1rem;
}

.projectNav {
  display: grid;
  gap: 8px;
}

.projectNavItem {
  display: grid;
  grid-template-columns: 24px 1fr auto;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px;
  border: 1px solid transparent;
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.18);
  color: var(--color-text-secondary);
  text-align: left;
  cursor: pointer;
}

.projectNavItem.isSelected {
  border-color: rgba(242, 138, 46, 0.42);
  background: rgba(242, 138, 46, 0.12);
  color: var(--color-text-primary);
}

.navIcon {
  color: var(--color-accent-brass);
}

.notificationDot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-accent-primary);
  box-shadow: 0 0 12px rgba(242, 138, 46, 0.8);
}
```

- [ ] **Step 5: Wire sidebar into App**

Modify `apps/web/src/App.tsx` to pass the real sidebar:

```tsx
import { AppShell } from './features/toy-writer-cockpit/components/AppShell';
import { MascotCompanion } from './features/toy-writer-cockpit/components/MascotCompanion';
import { ProjectSidebar } from './features/toy-writer-cockpit/components/ProjectSidebar';
import { WorkspaceHeader } from './features/toy-writer-cockpit/components/WorkspaceHeader';
import { mockNovelProject } from './features/toy-writer-cockpit/data/mockNovelProject';

export default function App() {
  return (
    <AppShell
      sidebar={<ProjectSidebar project={mockNovelProject} />}
      header={<WorkspaceHeader title="Novel Structure Map" currentView={mockNovelProject.currentView} />}
      structureMap={<section>Structure Map</section>}
      lowerPanels={<section>Lower Panels</section>}
      clueAttribution={<section>Clue Attribution</section>}
      orchestration={<section>AI Orchestration</section>}
      mascot={<MascotCompanion />}
    />
  );
}
```

- [ ] **Step 6: Run sidebar tests**

Run:

```powershell
npm --prefix apps/web run test -- src/features/toy-writer-cockpit/components/ProjectSidebar.test.tsx --run
```

Expected:

```text
PASS src/features/toy-writer-cockpit/components/ProjectSidebar.test.tsx
```

- [ ] **Step 7: Commit sidebar**

Run:

```powershell
git add apps/web/src
git commit -m "feat: add project sidebar"
```

Expected:

```text
[main ...] feat: add project sidebar
```

### Task 6: Implement Novel Structure Map with Chapter Selection

**Files:**
- Create: `apps/web/src/features/toy-writer-cockpit/components/NovelStructureMap.tsx`
- Create: `apps/web/src/features/toy-writer-cockpit/components/NovelStructureMap.test.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles/global.css`

- [ ] **Step 1: Write structure map tests**

Create `apps/web/src/features/toy-writer-cockpit/components/NovelStructureMap.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { mockNovelProject } from '../data/mockNovelProject';
import { NovelStructureMap } from './NovelStructureMap';

describe('NovelStructureMap', () => {
  it('renders chapters and story milestones', () => {
    render(
      <NovelStructureMap
        chapters={mockNovelProject.chapters}
        milestones={mockNovelProject.milestones}
        selectedChapterId="chapter-3"
        onSelectChapter={() => undefined}
      />,
    );

    expect(screen.getByText('Echoes in the Deep')).toBeInTheDocument();
    expect(screen.getByText('Midpoint')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Chapter 3 Echoes in the Deep/i })).toHaveAttribute('aria-pressed', 'true');
  });

  it('notifies parent when a chapter is selected', async () => {
    const user = userEvent.setup();
    const onSelectChapter = vi.fn();

    render(
      <NovelStructureMap
        chapters={mockNovelProject.chapters}
        milestones={mockNovelProject.milestones}
        selectedChapterId="chapter-3"
        onSelectChapter={onSelectChapter}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Chapter 4 The Old Current/i }));
    expect(onSelectChapter).toHaveBeenCalledWith('chapter-4');
  });
});
```

- [ ] **Step 2: Run structure test to verify it fails**

Run:

```powershell
npm --prefix apps/web run test -- src/features/toy-writer-cockpit/components/NovelStructureMap.test.tsx --run
```

Expected:

```text
FAIL
Cannot find module './NovelStructureMap'
```

- [ ] **Step 3: Implement NovelStructureMap**

Create `apps/web/src/features/toy-writer-cockpit/components/NovelStructureMap.tsx`:

```tsx
import type { ChapterCard, StoryMilestone } from '../types';

interface NovelStructureMapProps {
  chapters: ChapterCard[];
  milestones: StoryMilestone[];
  selectedChapterId: string;
  onSelectChapter: (chapterId: string) => void;
}

export function NovelStructureMap({
  chapters,
  milestones,
  selectedChapterId,
  onSelectChapter,
}: NovelStructureMapProps) {
  return (
    <section className="structureMap panelSurface" aria-label="Novel Structure Map">
      <div className="actRow" aria-hidden="true">
        <span>ACT I<br />Setup</span>
        <span>ACT II<br />Confrontation</span>
        <span>ACT III<br />Resolution</span>
      </div>

      <div className="chapterRail">
        {chapters.map((chapter) => {
          const selected = chapter.id === selectedChapterId;
          return (
            <button
              type="button"
              className={[
                'chapterCard',
                selected ? 'isSelected' : '',
                chapter.locked ? 'isLocked' : '',
                `risk-${chapter.riskLevel}`,
              ].join(' ')}
              aria-pressed={selected}
              aria-label={`Chapter ${chapter.order} ${chapter.title}`}
              onClick={() => onSelectChapter(chapter.id)}
              key={chapter.id}
            >
              <span className="chapterOrder">{chapter.order}</span>
              <strong>{chapter.title}</strong>
              <small>{chapter.subtitle}</small>
              <span className="chapterMeta">
                <span>{chapter.status}</span>
                <span>{chapter.clueCount} clues</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="milestoneRail">
        {milestones.map((milestone) => (
          <div className={`milestone tone-${milestone.tone}`} key={milestone.id}>
            <span className="milestoneDot" />
            <span>{milestone.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Add structure map styles**

Append to `apps/web/src/styles/global.css`:

```css
.panelSurface {
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-panel);
  background:
    linear-gradient(135deg, rgba(216, 195, 160, 0.06), transparent 42%),
    rgba(24, 19, 14, 0.88);
  box-shadow: var(--shadow-card);
}

.structureMap {
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 18px;
  padding: 18px;
  overflow: hidden;
}

.actRow {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  color: var(--color-text-secondary);
  font-family: var(--font-display);
  font-size: 0.82rem;
  text-align: center;
}

.chapterRail {
  display: grid;
  grid-template-columns: repeat(6, minmax(110px, 1fr));
  gap: 14px;
  align-items: stretch;
}

.chapterCard {
  position: relative;
  min-height: 150px;
  padding: 14px;
  border: 1px solid rgba(216, 195, 160, 0.26);
  border-radius: 16px;
  background:
    linear-gradient(180deg, rgba(216, 195, 160, 0.92), rgba(161, 132, 91, 0.88)),
    var(--color-paper);
  color: #2a2118;
  text-align: left;
  cursor: pointer;
  transition: transform var(--motion-fast), box-shadow var(--motion-fast), border-color var(--motion-fast);
}

.chapterCard:hover {
  transform: translateY(-2px);
}

.chapterCard.isSelected {
  border-color: var(--color-accent-primary);
  box-shadow: 0 0 0 2px rgba(242, 138, 46, 0.22), 0 16px 42px rgba(242, 138, 46, 0.25);
}

.chapterCard.isLocked {
  filter: grayscale(0.75) brightness(0.6);
}

.chapterOrder {
  display: block;
  margin-bottom: 8px;
  font-family: var(--font-display);
  font-size: 1.1rem;
}

.chapterCard strong {
  display: block;
  font-family: var(--font-display);
  font-size: 1rem;
  line-height: 1.15;
}

.chapterCard small {
  display: block;
  margin-top: 6px;
  color: rgba(42, 33, 24, 0.72);
}

.chapterMeta {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 10px;
  display: flex;
  justify-content: space-between;
  gap: 8px;
  color: rgba(42, 33, 24, 0.72);
  font-size: 0.68rem;
}

.milestoneRail {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
  color: var(--color-text-secondary);
  font-size: 0.72rem;
}

.milestone {
  display: grid;
  justify-items: center;
  gap: 6px;
  text-align: center;
}

.milestoneDot {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: var(--color-accent-support);
  box-shadow: 0 0 16px rgba(76, 154, 138, 0.5);
}

.tone-amber .milestoneDot {
  background: var(--color-accent-primary);
  box-shadow: 0 0 18px rgba(242, 138, 46, 0.75);
}

.tone-ember .milestoneDot {
  background: var(--color-state-danger);
}
```

- [ ] **Step 5: Wire map into App with selection state**

Replace `apps/web/src/App.tsx` with:

```tsx
import { useMemo, useState } from 'react';
import { AppShell } from './features/toy-writer-cockpit/components/AppShell';
import { MascotCompanion } from './features/toy-writer-cockpit/components/MascotCompanion';
import { NovelStructureMap } from './features/toy-writer-cockpit/components/NovelStructureMap';
import { ProjectSidebar } from './features/toy-writer-cockpit/components/ProjectSidebar';
import { WorkspaceHeader } from './features/toy-writer-cockpit/components/WorkspaceHeader';
import { mockNovelProject } from './features/toy-writer-cockpit/data/mockNovelProject';

export default function App() {
  const initialSelectedChapter = useMemo(
    () => mockNovelProject.chapters.find((chapter) => chapter.selected)?.id ?? mockNovelProject.chapters[0].id,
    [],
  );
  const [selectedChapterId, setSelectedChapterId] = useState(initialSelectedChapter);

  return (
    <AppShell
      sidebar={<ProjectSidebar project={mockNovelProject} />}
      header={<WorkspaceHeader title="Novel Structure Map" currentView={mockNovelProject.currentView} />}
      structureMap={
        <NovelStructureMap
          chapters={mockNovelProject.chapters}
          milestones={mockNovelProject.milestones}
          selectedChapterId={selectedChapterId}
          onSelectChapter={setSelectedChapterId}
        />
      }
      lowerPanels={<section>Lower Panels</section>}
      clueAttribution={<section>Clue Attribution</section>}
      orchestration={<section>AI Orchestration</section>}
      mascot={<MascotCompanion />}
    />
  );
}
```

- [ ] **Step 6: Run structure tests**

Run:

```powershell
npm --prefix apps/web run test -- src/features/toy-writer-cockpit/components/NovelStructureMap.test.tsx --run
```

Expected:

```text
PASS src/features/toy-writer-cockpit/components/NovelStructureMap.test.tsx
```

- [ ] **Step 7: Commit structure map**

Run:

```powershell
git add apps/web/src
git commit -m "feat: add novel structure map"
```

Expected:

```text
[main ...] feat: add novel structure map
```

### Task 7: Implement Clue Attribution Panel Linked to Selected Chapter

**Files:**
- Create: `apps/web/src/features/toy-writer-cockpit/components/ClueAttributionPanel.tsx`
- Create: `apps/web/src/features/toy-writer-cockpit/components/ClueAttributionPanel.test.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles/global.css`

- [ ] **Step 1: Write clue panel tests**

Create `apps/web/src/features/toy-writer-cockpit/components/ClueAttributionPanel.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockNovelProject } from '../data/mockNovelProject';
import { ClueAttributionPanel } from './ClueAttributionPanel';

describe('ClueAttributionPanel', () => {
  it('renders clue chain stages for the selected chapter', () => {
    render(<ClueAttributionPanel clueChains={mockNovelProject.clueChains} selectedChapterId="chapter-3" />);

    expect(screen.getByText('Provider')).toBeInTheDocument();
    expect(screen.getByText('Trigger')).toBeInTheDocument();
    expect(screen.getByText('Receiver')).toBeInTheDocument();
    expect(screen.getByText('Payoff')).toBeInTheDocument();
    expect(screen.getByText('Old Tide Map')).toBeInTheDocument();
  });

  it('shows an empty state when no clue chain relates to the selected chapter', () => {
    render(<ClueAttributionPanel clueChains={mockNovelProject.clueChains} selectedChapterId="chapter-6" />);

    expect(screen.getByText('No clue attribution chain is linked to this chapter yet.')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run clue test to verify it fails**

Run:

```powershell
npm --prefix apps/web run test -- src/features/toy-writer-cockpit/components/ClueAttributionPanel.test.tsx --run
```

Expected:

```text
FAIL
Cannot find module './ClueAttributionPanel'
```

- [ ] **Step 3: Implement clue panel**

Create `apps/web/src/features/toy-writer-cockpit/components/ClueAttributionPanel.tsx`:

```tsx
import type { ClueChain, ClueChainNode } from '../types';

interface ClueAttributionPanelProps {
  clueChains: ClueChain[];
  selectedChapterId: string;
}

function StageCard({ title, node }: { title: string; node: ClueChainNode }) {
  return (
    <article className="clueStage">
      <p>{title}</p>
      <strong>{node.label}</strong>
      <span>{node.detail}</span>
    </article>
  );
}

export function ClueAttributionPanel({ clueChains, selectedChapterId }: ClueAttributionPanelProps) {
  const activeChains = clueChains.filter((chain) => chain.relatedChapterIds.includes(selectedChapterId));
  const activeChain = activeChains[0];

  return (
    <section className="cluePanel panelSurface" aria-label="Clue Attribution">
      <div className="panelTitleRow">
        <h2>Clue Attribution</h2>
        <span>{activeChains.length} linked</span>
      </div>

      {activeChain ? (
        <div className="clueChain" aria-label={activeChain.title}>
          <StageCard title="Provider" node={activeChain.provider} />
          <StageCard title="Trigger" node={activeChain.trigger} />
          <StageCard title="Receiver" node={activeChain.receiver} />
          <StageCard title="Payoff" node={activeChain.payoff} />
        </div>
      ) : (
        <p className="emptyState">No clue attribution chain is linked to this chapter yet.</p>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Add clue panel styles**

Append to `apps/web/src/styles/global.css`:

```css
.cluePanel {
  padding: 16px;
}

.panelTitleRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.panelTitleRow h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1rem;
}

.panelTitleRow span {
  color: var(--color-text-secondary);
  font-size: 0.78rem;
}

.clueChain {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.clueStage {
  position: relative;
  min-height: 82px;
  padding: 12px;
  border: 1px solid rgba(216, 195, 160, 0.24);
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.2);
}

.clueStage:not(:last-child)::after {
  content: '→';
  position: absolute;
  right: -13px;
  top: 32px;
  color: var(--color-accent-primary);
}

.clueStage p {
  margin: 0 0 6px;
  color: var(--color-text-secondary);
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.clueStage strong {
  display: block;
  margin-bottom: 4px;
  color: var(--color-text-primary);
  font-size: 0.86rem;
}

.clueStage span {
  color: var(--color-text-secondary);
  font-size: 0.72rem;
}

.emptyState {
  margin: 0;
  color: var(--color-text-secondary);
}
```

- [ ] **Step 5: Wire clue panel into App**

Modify `apps/web/src/App.tsx` so `clueAttribution` uses the real panel:

```tsx
import { useMemo, useState } from 'react';
import { AppShell } from './features/toy-writer-cockpit/components/AppShell';
import { ClueAttributionPanel } from './features/toy-writer-cockpit/components/ClueAttributionPanel';
import { MascotCompanion } from './features/toy-writer-cockpit/components/MascotCompanion';
import { NovelStructureMap } from './features/toy-writer-cockpit/components/NovelStructureMap';
import { ProjectSidebar } from './features/toy-writer-cockpit/components/ProjectSidebar';
import { WorkspaceHeader } from './features/toy-writer-cockpit/components/WorkspaceHeader';
import { mockNovelProject } from './features/toy-writer-cockpit/data/mockNovelProject';

export default function App() {
  const initialSelectedChapter = useMemo(
    () => mockNovelProject.chapters.find((chapter) => chapter.selected)?.id ?? mockNovelProject.chapters[0].id,
    [],
  );
  const [selectedChapterId, setSelectedChapterId] = useState(initialSelectedChapter);

  return (
    <AppShell
      sidebar={<ProjectSidebar project={mockNovelProject} />}
      header={<WorkspaceHeader title="Novel Structure Map" currentView={mockNovelProject.currentView} />}
      structureMap={
        <NovelStructureMap
          chapters={mockNovelProject.chapters}
          milestones={mockNovelProject.milestones}
          selectedChapterId={selectedChapterId}
          onSelectChapter={setSelectedChapterId}
        />
      }
      lowerPanels={<section>Lower Panels</section>}
      clueAttribution={
        <ClueAttributionPanel clueChains={mockNovelProject.clueChains} selectedChapterId={selectedChapterId} />
      }
      orchestration={<section>AI Orchestration</section>}
      mascot={<MascotCompanion />}
    />
  );
}
```

- [ ] **Step 6: Run clue tests**

Run:

```powershell
npm --prefix apps/web run test -- src/features/toy-writer-cockpit/components/ClueAttributionPanel.test.tsx --run
```

Expected:

```text
PASS src/features/toy-writer-cockpit/components/ClueAttributionPanel.test.tsx
```

- [ ] **Step 7: Commit clue chain**

Run:

```powershell
git add apps/web/src
git commit -m "feat: add clue attribution panel"
```

Expected:

```text
[main ...] feat: add clue attribution panel
```

### Task 8: Implement Agent Orchestration Panel

**Files:**
- Create: `apps/web/src/features/toy-writer-cockpit/components/AgentOrchestrationPanel.tsx`
- Create: `apps/web/src/features/toy-writer-cockpit/components/AgentOrchestrationPanel.test.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles/global.css`

- [ ] **Step 1: Write orchestration tests**

Create `apps/web/src/features/toy-writer-cockpit/components/AgentOrchestrationPanel.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockNovelProject } from '../data/mockNovelProject';
import { AgentOrchestrationPanel } from './AgentOrchestrationPanel';

describe('AgentOrchestrationPanel', () => {
  it('renders task queue, subagents, skills, memory and review checklist', () => {
    render(<AgentOrchestrationPanel project={mockNovelProject} />);

    expect(screen.getByText('AI Orchestration')).toBeInTheDocument();
    expect(screen.getByText('Check Continuity')).toBeInTheDocument();
    expect(screen.getByText('Story Architect')).toBeInTheDocument();
    expect(screen.getByText('Structure Analysis')).toBeInTheDocument();
    expect(screen.getByText('Memory Layer')).toBeInTheDocument();
    expect(screen.getByText('78%')).toBeInTheDocument();
    expect(screen.getByText('Goal & Stakes Clear')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run orchestration test to verify it fails**

Run:

```powershell
npm --prefix apps/web run test -- src/features/toy-writer-cockpit/components/AgentOrchestrationPanel.test.tsx --run
```

Expected:

```text
FAIL
Cannot find module './AgentOrchestrationPanel'
```

- [ ] **Step 3: Implement orchestration panel**

Create `apps/web/src/features/toy-writer-cockpit/components/AgentOrchestrationPanel.tsx`:

```tsx
import type { NovelProject, TaskStatus } from '../types';

interface AgentOrchestrationPanelProps {
  project: NovelProject;
}

function statusClass(status: TaskStatus) {
  return `taskStatus status-${status.toLowerCase()}`;
}

export function AgentOrchestrationPanel({ project }: AgentOrchestrationPanelProps) {
  const completed = project.agentTasks.filter((task) => task.status === 'Done').length;

  return (
    <section className="agentPanel panelSurface" aria-label="AI Orchestration">
      <div className="agentHeader">
        <h2>AI Orchestration</h2>
        <span>Active</span>
      </div>

      <section className="agentSection">
        <div className="sectionHeader">
          <h3>Agent Tasks</h3>
          <span>{completed} / {project.agentTasks.length}</span>
        </div>
        <div className="taskList">
          {project.agentTasks.map((task) => (
            <article className="taskItem" key={task.id}>
              <span>{task.title}</span>
              <strong className={statusClass(task.status)}>{task.status}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="agentSection">
        <div className="sectionHeader">
          <h3>Subagents</h3>
          <span>Manage</span>
        </div>
        <div className="subagentGrid">
          {project.subagents.map((agent) => (
            <article className={agent.active ? 'subagentCard isActive' : 'subagentCard'} key={agent.id}>
              <span className="subagentAvatar" aria-hidden="true">◎</span>
              <strong>{agent.name}</strong>
              <small>{agent.role}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="agentSection">
        <h3>Skills</h3>
        <div className="skillList">
          {project.skills.map((skill) => (
            <span className={`skillBadge skill-${skill.category}`} key={skill.id}>
              {skill.label}
            </span>
          ))}
        </div>
      </section>

      <section className="agentSection">
        <div className="sectionHeader">
          <h3>Memory Layer</h3>
          <span>{project.memorySyncPercent}%</span>
        </div>
        <div className="memoryTrack">
          <span style={{ width: `${project.memorySyncPercent}%` }} />
        </div>
      </section>

      <section className="agentSection">
        <div className="sectionHeader">
          <h3>Review Checklist</h3>
          <span>{project.reviewChecklist.filter((item) => item.passed).length} / {project.reviewChecklist.length}</span>
        </div>
        <div className="reviewList">
          {project.reviewChecklist.map((item) => (
            <div className="reviewItem" key={item.id}>
              <span>{item.label}</span>
              <strong>{item.passed ? '✓' : '○'}</strong>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
```

- [ ] **Step 4: Add orchestration styles**

Append to `apps/web/src/styles/global.css`:

```css
.agentPanel {
  height: 100%;
  padding: 14px;
  overflow: auto;
}

.agentHeader,
.sectionHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.agentHeader h2,
.agentSection h3 {
  margin: 0;
  font-family: var(--font-display);
}

.agentHeader h2 {
  font-size: 1rem;
}

.agentHeader span,
.sectionHeader span {
  color: var(--color-accent-support);
  font-size: 0.75rem;
}

.agentSection {
  padding: 12px 0;
  border-top: 1px solid var(--color-border-soft);
}

.taskList,
.reviewList {
  display: grid;
  gap: 8px;
  margin-top: 10px;
}

.taskItem,
.reviewItem {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 9px 10px;
  border: 1px solid rgba(216, 195, 160, 0.16);
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.2);
  color: var(--color-text-secondary);
  font-size: 0.78rem;
}

.taskStatus {
  border-radius: 999px;
  padding: 3px 7px;
  font-size: 0.68rem;
}

.status-done {
  color: var(--color-state-done);
  background: rgba(111, 174, 125, 0.14);
}

.status-running {
  color: var(--color-state-warning);
  background: rgba(212, 154, 58, 0.14);
}

.status-queued,
.status-waitingapproval {
  color: var(--color-text-secondary);
  background: rgba(216, 195, 160, 0.1);
}

.subagentGrid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-top: 10px;
}

.subagentCard {
  display: grid;
  justify-items: center;
  gap: 4px;
  padding: 10px 6px;
  border: 1px solid rgba(216, 195, 160, 0.16);
  border-radius: 14px;
  color: var(--color-text-secondary);
  text-align: center;
}

.subagentCard.isActive {
  border-color: rgba(242, 138, 46, 0.35);
}

.subagentAvatar {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(216, 195, 160, 0.12);
  color: var(--color-accent-brass);
}

.subagentCard strong {
  color: var(--color-text-primary);
  font-size: 0.72rem;
}

.subagentCard small {
  color: var(--color-text-secondary);
}

.skillList {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.skillBadge {
  border: 1px solid rgba(216, 195, 160, 0.18);
  border-radius: 999px;
  padding: 7px 9px;
  color: var(--color-text-secondary);
  background: rgba(0, 0, 0, 0.18);
  font-size: 0.72rem;
}

.memoryTrack {
  height: 8px;
  margin-top: 10px;
  border-radius: 999px;
  background: rgba(216, 195, 160, 0.12);
  overflow: hidden;
}

.memoryTrack span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--color-accent-support), var(--color-accent-primary));
}

.reviewItem strong {
  color: var(--color-state-done);
}
```

- [ ] **Step 5: Wire orchestration panel into App**

Modify `apps/web/src/App.tsx` imports and prop:

```tsx
import { useMemo, useState } from 'react';
import { AgentOrchestrationPanel } from './features/toy-writer-cockpit/components/AgentOrchestrationPanel';
import { AppShell } from './features/toy-writer-cockpit/components/AppShell';
import { ClueAttributionPanel } from './features/toy-writer-cockpit/components/ClueAttributionPanel';
import { MascotCompanion } from './features/toy-writer-cockpit/components/MascotCompanion';
import { NovelStructureMap } from './features/toy-writer-cockpit/components/NovelStructureMap';
import { ProjectSidebar } from './features/toy-writer-cockpit/components/ProjectSidebar';
import { WorkspaceHeader } from './features/toy-writer-cockpit/components/WorkspaceHeader';
import { mockNovelProject } from './features/toy-writer-cockpit/data/mockNovelProject';

export default function App() {
  const initialSelectedChapter = useMemo(
    () => mockNovelProject.chapters.find((chapter) => chapter.selected)?.id ?? mockNovelProject.chapters[0].id,
    [],
  );
  const [selectedChapterId, setSelectedChapterId] = useState(initialSelectedChapter);

  return (
    <AppShell
      sidebar={<ProjectSidebar project={mockNovelProject} />}
      header={<WorkspaceHeader title="Novel Structure Map" currentView={mockNovelProject.currentView} />}
      structureMap={
        <NovelStructureMap
          chapters={mockNovelProject.chapters}
          milestones={mockNovelProject.milestones}
          selectedChapterId={selectedChapterId}
          onSelectChapter={setSelectedChapterId}
        />
      }
      lowerPanels={<section>Lower Panels</section>}
      clueAttribution={
        <ClueAttributionPanel clueChains={mockNovelProject.clueChains} selectedChapterId={selectedChapterId} />
      }
      orchestration={<AgentOrchestrationPanel project={mockNovelProject} />}
      mascot={<MascotCompanion />}
    />
  );
}
```

- [ ] **Step 6: Run orchestration tests**

Run:

```powershell
npm --prefix apps/web run test -- src/features/toy-writer-cockpit/components/AgentOrchestrationPanel.test.tsx --run
```

Expected:

```text
PASS src/features/toy-writer-cockpit/components/AgentOrchestrationPanel.test.tsx
```

- [ ] **Step 7: Commit orchestration panel**

Run:

```powershell
git add apps/web/src
git commit -m "feat: add agent orchestration panel"
```

Expected:

```text
[main ...] feat: add agent orchestration panel
```

### Task 9: Implement Inspiration Vault and Character Graph Preview

**Files:**
- Create: `apps/web/src/features/toy-writer-cockpit/components/InspirationVault.tsx`
- Create: `apps/web/src/features/toy-writer-cockpit/components/CharacterGraphPreview.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles/global.css`

- [ ] **Step 1: Implement InspirationVault**

Create `apps/web/src/features/toy-writer-cockpit/components/InspirationVault.tsx`:

```tsx
import type { InspirationCard } from '../types';

interface InspirationVaultProps {
  inspirations: InspirationCard[];
}

export function InspirationVault({ inspirations }: InspirationVaultProps) {
  return (
    <section className="inspirationVault panelSurface" aria-label="Inspiration Vault">
      <div className="panelTitleRow">
        <h2>Inspiration Vault</h2>
        <span>{inspirations.length} cards</span>
      </div>
      <div className="inspirationGrid">
        {inspirations.map((idea) => (
          <article className="inspirationCard" key={idea.id}>
            <div className="ideaThumb" aria-hidden="true" />
            <strong>{idea.title}</strong>
            <p>{idea.summary}</p>
            <span>{idea.status}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Implement CharacterGraphPreview**

Create `apps/web/src/features/toy-writer-cockpit/components/CharacterGraphPreview.tsx`:

```tsx
import type { CharacterEdge, CharacterNode } from '../types';

interface CharacterGraphPreviewProps {
  characters: CharacterNode[];
  edges: CharacterEdge[];
}

export function CharacterGraphPreview({ characters, edges }: CharacterGraphPreviewProps) {
  return (
    <section className="characterGraph panelSurface" aria-label="Character Graph">
      <div className="panelTitleRow">
        <h2>Character Graph</h2>
        <span>{edges.length} links</span>
      </div>
      <div className="graphCanvas">
        {characters.map((character, index) => (
          <article className={`characterNode node-${index + 1}`} key={character.id}>
            <strong>{character.name}</strong>
            <span>{character.role}</span>
          </article>
        ))}
        <svg className="graphLines" viewBox="0 0 500 220" aria-hidden="true">
          <path d="M88 72 C160 30 220 44 286 78" />
          <path d="M286 78 C350 96 394 62 440 92" />
          <path d="M120 170 C205 116 246 136 332 168" />
        </svg>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Add lower panel styles**

Append to `apps/web/src/styles/global.css`:

```css
.lowerPanels {
  display: grid;
  grid-template-columns: 0.85fr 1.15fr;
  gap: 14px;
}

.inspirationVault,
.characterGraph {
  padding: 14px;
  min-height: 0;
}

.inspirationGrid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.inspirationCard {
  min-width: 0;
  padding: 10px;
  border: 1px solid rgba(216, 195, 160, 0.2);
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.18);
}

.ideaThumb {
  height: 56px;
  margin-bottom: 8px;
  border-radius: 10px;
  background:
    radial-gradient(circle at 52% 20%, rgba(242, 138, 46, 0.28), transparent 34%),
    linear-gradient(180deg, rgba(216, 195, 160, 0.3), rgba(0, 0, 0, 0.22));
}

.inspirationCard strong {
  display: block;
  color: var(--color-text-primary);
  font-size: 0.78rem;
}

.inspirationCard p {
  margin: 5px 0;
  color: var(--color-text-secondary);
  font-size: 0.68rem;
  line-height: 1.35;
}

.inspirationCard span {
  color: var(--color-accent-support);
  font-size: 0.66rem;
}

.graphCanvas {
  position: relative;
  min-height: 150px;
}

.characterNode {
  position: absolute;
  z-index: 2;
  min-width: 82px;
  padding: 8px;
  border: 1px solid rgba(216, 195, 160, 0.26);
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.32);
  text-align: center;
}

.characterNode strong,
.characterNode span {
  display: block;
}

.characterNode strong {
  color: var(--color-text-primary);
  font-size: 0.78rem;
}

.characterNode span {
  color: var(--color-text-secondary);
  font-size: 0.66rem;
}

.node-1 { left: 6%; top: 18%; }
.node-2 { left: 42%; top: 8%; }
.node-3 { right: 6%; top: 25%; }
.node-4 { left: 18%; bottom: 8%; }
.node-5 { right: 26%; bottom: 5%; }

.graphLines {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.graphLines path {
  fill: none;
  stroke: rgba(76, 154, 138, 0.58);
  stroke-width: 2;
  stroke-dasharray: 6 6;
}
```

- [ ] **Step 4: Wire lower panels into App**

Modify `apps/web/src/App.tsx` imports and `lowerPanels` prop:

```tsx
import { useMemo, useState } from 'react';
import { AgentOrchestrationPanel } from './features/toy-writer-cockpit/components/AgentOrchestrationPanel';
import { AppShell } from './features/toy-writer-cockpit/components/AppShell';
import { CharacterGraphPreview } from './features/toy-writer-cockpit/components/CharacterGraphPreview';
import { ClueAttributionPanel } from './features/toy-writer-cockpit/components/ClueAttributionPanel';
import { InspirationVault } from './features/toy-writer-cockpit/components/InspirationVault';
import { MascotCompanion } from './features/toy-writer-cockpit/components/MascotCompanion';
import { NovelStructureMap } from './features/toy-writer-cockpit/components/NovelStructureMap';
import { ProjectSidebar } from './features/toy-writer-cockpit/components/ProjectSidebar';
import { WorkspaceHeader } from './features/toy-writer-cockpit/components/WorkspaceHeader';
import { mockNovelProject } from './features/toy-writer-cockpit/data/mockNovelProject';

export default function App() {
  const initialSelectedChapter = useMemo(
    () => mockNovelProject.chapters.find((chapter) => chapter.selected)?.id ?? mockNovelProject.chapters[0].id,
    [],
  );
  const [selectedChapterId, setSelectedChapterId] = useState(initialSelectedChapter);

  return (
    <AppShell
      sidebar={<ProjectSidebar project={mockNovelProject} />}
      header={<WorkspaceHeader title="Novel Structure Map" currentView={mockNovelProject.currentView} />}
      structureMap={
        <NovelStructureMap
          chapters={mockNovelProject.chapters}
          milestones={mockNovelProject.milestones}
          selectedChapterId={selectedChapterId}
          onSelectChapter={setSelectedChapterId}
        />
      }
      lowerPanels={
        <div className="lowerPanels">
          <InspirationVault inspirations={mockNovelProject.inspirations} />
          <CharacterGraphPreview characters={mockNovelProject.characters} edges={mockNovelProject.characterEdges} />
        </div>
      }
      clueAttribution={
        <ClueAttributionPanel clueChains={mockNovelProject.clueChains} selectedChapterId={selectedChapterId} />
      }
      orchestration={<AgentOrchestrationPanel project={mockNovelProject} />}
      mascot={<MascotCompanion />}
    />
  );
}
```

- [ ] **Step 5: Verify build**

Run:

```powershell
npm run build:web
```

Expected:

```text
built in
```

- [ ] **Step 6: Commit lower panels**

Run:

```powershell
git add apps/web/src
git commit -m "feat: add inspiration and character panels"
```

Expected:

```text
[main ...] feat: add inspiration and character panels
```

### Task 10: Add App-Level Integration Test and Responsive Guardrails

**Files:**
- Create: `apps/web/src/App.test.tsx`
- Modify: `apps/web/src/styles/global.css`

- [ ] **Step 1: Write app integration test**

Create `apps/web/src/App.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('Toy Writer Cockpit App', () => {
  it('renders the complete cockpit dashboard', () => {
    render(<App />);

    expect(screen.getByLabelText('Toy Writer Cockpit')).toBeInTheDocument();
    expect(screen.getByText('Tides of Embers')).toBeInTheDocument();
    expect(screen.getByText('Novel Structure Map')).toBeInTheDocument();
    expect(screen.getByText('Clue Attribution')).toBeInTheDocument();
    expect(screen.getByText('AI Orchestration')).toBeInTheDocument();
  });

  it('updates clue attribution when selecting a chapter without linked clues', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /Chapter 6 Storm Unbound/i }));
    expect(screen.getByText('No clue attribution chain is linked to this chapter yet.')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run app integration test**

Run:

```powershell
npm --prefix apps/web run test -- src/App.test.tsx --run
```

Expected:

```text
PASS src/App.test.tsx
```

- [ ] **Step 3: Add responsive CSS guardrails**

Append to `apps/web/src/styles/global.css`:

```css
@media (max-width: 1280px) {
  .cockpitScene {
    padding: 18px;
  }

  .mainConsole {
    width: calc(100vw - 36px);
    grid-template-columns: 150px minmax(620px, 1fr) 260px;
  }

  .chapterRail {
    grid-template-columns: repeat(3, minmax(120px, 1fr));
  }

  .milestoneRail {
    grid-template-columns: repeat(3, 1fr);
  }

  .mascotCompanion {
    transform: scale(0.78);
    transform-origin: left bottom;
  }
}

@media (max-width: 980px) {
  .mainConsole {
    grid-template-columns: 1fr;
    height: auto;
  }

  .workspaceColumn {
    grid-template-rows: auto;
  }

  .lowerPanels,
  .clueChain {
    grid-template-columns: 1fr;
  }

  .agentRail {
    min-height: 480px;
  }

  .mascotCompanion {
    display: none;
  }
}
```

- [ ] **Step 4: Run full test suite and build**

Run:

```powershell
npm run test:web
npm run build:web
```

Expected:

```text
PASS
built in
```

- [ ] **Step 5: Commit integration**

Run:

```powershell
git add apps/web/src
git commit -m "test: add cockpit integration coverage"
```

Expected:

```text
[main ...] test: add cockpit integration coverage
```

### Task 11: Final QA and Documentation Note

**Files:**
- Create: `apps/web/README.md`
- Modify: none

- [ ] **Step 1: Create app README**

Create `apps/web/README.md`:

```md
# Toy Writer Cockpit Web Prototype

This is the first desktop web prototype for the novel-native Agent UI.

## Run

```bash
npm install
npm run dev
```

From the repository root:

```bash
npm run dev:web
```

## Test

```bash
npm run test -- --run
```

From the repository root:

```bash
npm run test:web
```

## Build

```bash
npm run build
```

From the repository root:

```bash
npm run build:web
```

## Current Scope

- Mock-data-driven brand-mode dashboard.
- Project sidebar.
- Novel structure map with chapter selection.
- Clue attribution chain linked to selected chapter.
- Inspiration and character preview panels.
- Agent orchestration panel.
- Static mascot drawn in CSS until final image assets are produced.

## Not Included

- Backend persistence.
- Real LLM or subagent execution.
- Complete graph editing.
- Desktop wrapper.
- Production mascot/background image assets.
```

- [ ] **Step 2: Run final verification**

Run:

```powershell
npm run test:web
npm run build:web
```

Expected:

```text
PASS
built in
```

- [ ] **Step 3: Check git status**

Run:

```powershell
git status --short
```

Expected:

```text
?? apps/web/README.md
```

- [ ] **Step 4: Commit README**

Run:

```powershell
git add apps/web/README.md
git commit -m "docs: document cockpit web prototype"
```

Expected:

```text
[main ...] docs: document cockpit web prototype
```

- [ ] **Step 5: Produce final status**

Run:

```powershell
git status --short
```

Expected:

```text

```

The empty output means the working tree is clean.

## Self-Review

### Spec Coverage

- Design language and visual mode: covered by Tasks 3, 4, and 11.
- App shell and desktop layout: covered by Task 4.
- Left project navigation: covered by Task 5.
- Central novel structure map: covered by Task 6.
- Chapter selection linked to clue chain: covered by Tasks 6, 7, and 10.
- Bottom clue attribution chain: covered by Task 7.
- Inspiration vault and character graph preview: covered by Task 9.
- Right Agent orchestration panel: covered by Task 8.
- Mock-data-driven MVP boundary: covered by Task 2 and README in Task 11.
- Responsive guardrails: covered by Task 10.
- Tests and verification: covered by every component task and final QA.

### Known Product Gaps After This Plan

These are outside this plan by design:

- Real image asset production for the mascot and book-desk background.
- Real drag-and-drop editing.
- Real graph engine integration.
- Real long-term memory layer.
- Real model routing and Agent task execution.
- Focus writing mode.

### Type Consistency

The plan uses `NovelProject`, `ChapterCard`, `ClueChain`, `AgentTask`, `SubagentProfile`, `SkillBadge`, and `ReviewChecklistItem` consistently from `types.ts`. Component props reference these exported types directly.

### Verification Commands

Run these before considering implementation complete:

```powershell
npm run test:web
npm run build:web
git status --short
```

Expected:

```text
PASS
built in
```

`git status --short` should be empty after final commit.
