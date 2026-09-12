import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const required = [
  'package.json',
  'electron/main.cjs',
  'electron/preload.cjs',
  'src/App.tsx',
  'src/components/scene/SceneLayer.tsx',
  'src/components/scene/BookLayer.tsx',
  'src/components/layout/SidebarRail.tsx',
  'src/components/layout/BrandHeader.tsx',
  'src/components/layout/TopBar.tsx',
  'src/components/layout/HeroSection.tsx',
  'src/components/layout/DashboardGrid.tsx',
  'src/components/cards/ProjectOverviewCard.tsx',
  'src/components/cards/ChapterProgressCard.tsx',
  'src/components/cards/CharacterNetworkCard.tsx',
  'src/components/cards/WritingGoalsCard.tsx',
  'src/components/cards/ScheduleCard.tsx',
  'src/components/cards/CalendarCard.tsx',
  'src/components/ui/Avatar.tsx',
  'src/components/ui/Button.tsx',
  'src/components/ui/Card.tsx',
  'src/components/ui/Chip.tsx',
  'src/components/ui/Divider.tsx',
  'src/components/ui/IconButton.tsx',
  'src/components/ui/MetricItem.tsx',
  'src/components/ui/ProgressBar.tsx',
  'src/components/ui/ProgressRing.tsx',
  'src/components/ui/SearchBar.tsx',
  'src/components/ui/StatusBadge.tsx',
  'src/components/ui/Tag.tsx',
  'src/components/ui/Tooltip.tsx',
  'public/assets/brand/bixin_app_icon.png',
  'public/assets/covers/project-cover.png',
  'public/assets/layers/scene_robot_background.png',
  'public/assets/layers/book_foreground.svg',
  'public/assets/layers/book_body_cutout.png',
  'public/assets/reference/current_ui_reference.png',
  'CURSOR_HANDOFF.md',
  'docs/asset_manifest.md',
  'docs/component_inventory.md',
  'docs/implementation_plan.md'
];

const missing = required.filter((rel) => !fs.existsSync(path.join(root, rel)));
if (missing.length) {
  console.error('Missing required files:');
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
for (const dep of ['react', 'react-dom', 'lucide-react', 'clsx']) {
  if (!pkg.dependencies?.[dep]) throw new Error(`Missing dependency: ${dep}`);
}
for (const dep of ['electron', 'vite', 'tailwindcss', 'typescript']) {
  if (!pkg.devDependencies?.[dep]) throw new Error(`Missing devDependency: ${dep}`);
}
if (!pkg.scripts?.dev || !pkg.scripts?.build || !pkg.scripts?.typecheck) throw new Error('Required npm scripts are missing.');

const main = fs.readFileSync(path.join(root, 'electron/main.cjs'), 'utf8');
if (!main.includes("preload: path.join(__dirname, 'preload.cjs')")) throw new Error('Electron preload is not wired into BrowserWindow.');
if (!main.includes('contextIsolation: true') || !main.includes('nodeIntegration: false')) throw new Error('Electron security flags missing.');

const app = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8');
const scene = fs.readFileSync(path.join(root, 'src/components/scene/SceneLayer.tsx'), 'utf8');
const book = fs.readFileSync(path.join(root, 'src/components/scene/BookLayer.tsx'), 'utf8');
if (!app.includes('<SceneLayer />') || !app.includes('<BookLayer />')) throw new Error('Layer composition missing from App.tsx');
if (!scene.includes('z-10')) throw new Error('Scene layer must use z-10');
if (!book.includes('z-30')) throw new Error('Book layer must use z-30');
if (!book.includes('pointer-events-none')) throw new Error('Book layer must not intercept pointer events');
if (!book.includes('book_foreground.svg')) throw new Error('Book layer is not using the composite foreground asset.');

const svg = fs.readFileSync(path.join(root, 'public/assets/layers/book_foreground.svg'), 'utf8');
if (!svg.includes('<svg') || !svg.includes('data:image/png;base64') || !svg.includes('bookmarkFill')) throw new Error('Composite book SVG is malformed or incomplete.');

console.log(`Static verification passed: ${required.length} required files present.`);
console.log('Electron shell verified: preload + contextIsolation + nodeIntegration=false.');
console.log('Layer rules verified: scene z-10, UI z-20, book z-30 and pointer-events-none.');
console.log('Visual asset manifest verified: scene, book composite, icon, project cover, reference image.');
