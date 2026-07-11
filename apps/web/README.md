# Novelora Bright Cockpit

This Vite + React workspace renders the current Novelora writing cockpit: a bright, fixture-backed dashboard for navigating a novel's structure, chapters, inspiration, character relationships, clue flow, and supporting context.

## Run from the repository root

```bash
npm install
npm run dev:web
npm run test:web
npm run lint:web
npm run build:web
```

`npm run dev:web` starts the Vite development server. The root test command runs Vitest once through the app script.

## Run from `apps/web`

```bash
npm install
npm run dev
npm run test -- --run
npm run lint
npm run build
```

## Current scope and limits

The cockpit is a mock-data dashboard. Its visible project, chapter, inspiration, character, clue, memory, and task rows are driven by local fixtures so the information architecture and interaction patterns can be evaluated.

The Agent rail and Nova are presentational only: status chips, task progress, focus mode, and context-health values do **not** invoke real agents, models, persistence, collaboration, search, or background work. The chapter drawer and local filters demonstrate client-side interaction only; they do not save changes.
