import { characterPortraits } from '../assetRegistry';
import { bixinHomeData } from './bixinHome';
import type { CharacterFile, ChapterMeta, ProjectMeta } from '../lib/noveloraApi';

type PortraitAssetKey = keyof typeof characterPortraits;

export type HomeRelation = 'ally' | 'conflict' | 'mentor' | 'love' | 'unknown';

export interface HomeDashboardView {
  project: {
    title: string;
    status: string;
    description: string;
    metrics: Array<{ label: string; value: string }>;
  };
  chapterStages: Array<{ label: string; value: number; active?: boolean }>;
  chapterProgress: number;
  writingGoals: {
    progress: number;
    items: Array<{ label: string; current: string; total: string; percent: number }>;
  };
  characters: {
    empty: boolean;
    emptyHint: string;
    center: { name: string; role: string; portraitAssetKey: PortraitAssetKey };
    nodes: Array<{
      name: string;
      role: string;
      portraitAssetKey: PortraitAssetKey;
      relation: HomeRelation;
      x: number;
      y: number;
    }>;
  };
  schedule: Array<{ title: string; subtitle: string; badge: string }>;
  calendar: {
    label: string;
    weekdays: readonly string[];
    days: readonly number[];
    active: number;
  };
}

const PORTRAIT_KEYS = Object.keys(characterPortraits) as PortraitAssetKey[];
const NODE_SLOTS = [
  { x: 18, y: 24 },
  { x: 18, y: 68 },
  { x: 48, y: 84 },
  { x: 82, y: 24 },
  { x: 82, y: 68 },
] as const;

const STAGE_DEFS = [
  { label: '计划', statuses: ['planned'] },
  { label: '草稿', statuses: ['draft', 'drafting'] },
  { label: '修订', statuses: ['revised', 'revision'] },
  { label: '已完成', statuses: ['complete'] },
  { label: '已发布', statuses: ['published'] },
] as const;

export function fixtureHomeDashboardView(): HomeDashboardView {
  return {
    project: {
      title: bixinHomeData.project.title,
      status: bixinHomeData.project.status,
      description: bixinHomeData.project.description,
      metrics: bixinHomeData.project.metrics.map((metric) => ({ ...metric })),
    },
    chapterStages: bixinHomeData.chapterStages.map((stage) => ({ ...stage })),
    chapterProgress: 35,
    writingGoals: {
      progress: bixinHomeData.writingGoals.progress,
      items: bixinHomeData.writingGoals.items.map((item) => ({ ...item })),
    },
    characters: {
      empty: false,
      emptyHint: '',
      center: { ...bixinHomeData.characters.center },
      nodes: bixinHomeData.characters.nodes.map((node) => ({ ...node })),
    },
    schedule: bixinHomeData.schedule.map((item) => ({ ...item })),
    calendar: {
      label: bixinHomeData.calendar.label,
      weekdays: bixinHomeData.calendar.weekdays,
      days: bixinHomeData.calendar.days,
      active: bixinHomeData.calendar.active,
    },
  };
}

export function buildHomeDashboardView(input: {
  project: ProjectMeta;
  characters?: CharacterFile | null;
  outline?: string;
  world?: string;
  now?: Date;
}): HomeDashboardView {
  const chapters = input.project.chapters;
  const total = chapters.length;
  const words = chapters.reduce((sum, chapter) => sum + chapter.words, 0);
  const written = chapters.filter((chapter) => chapter.words > 0 || isComplete(chapter)).length;
  const complete = chapters.filter(isComplete).length;
  const progress = total === 0 ? 0 : Math.round((written / total) * 100);
  const currentStatus = chapters.find((chapter) => chapter.num === input.project.currentChapter)?.status;
  const people = input.characters?.characters ?? [];
  const relationships = input.characters?.relationships ?? [];

  return {
    project: {
      title: input.project.title,
      status: total === 0 ? '未开始' : complete === total ? '已完结' : '进行中',
      description: firstSentence(input.outline) || `已导入 ${total} 章。`,
      metrics: [
        { label: '字数', value: formatCount(words) },
        { label: '章节', value: String(total) },
        { label: '已写', value: String(written) },
        { label: '完成度', value: `${progress}%` },
      ],
    },
    chapterStages: STAGE_DEFS.map((stage) => {
      const value = chapters.filter((chapter) => (stage.statuses as readonly string[]).includes(chapter.status)).length;
      const isActive = currentStatus !== undefined && (stage.statuses as readonly string[]).includes(currentStatus);
      return isActive ? { label: stage.label, value, active: true } : { label: stage.label, value };
    }),
    chapterProgress: progress,
    writingGoals: {
      progress,
      items: [
        {
          label: '已写章节',
          current: String(written),
          total: String(total),
          percent: progress,
        },
        {
          label: '全书字数',
          current: formatCount(words),
          total: `${total}章`,
          percent: progress,
        },
        {
          label: '当前章节',
          current: `第${input.project.currentChapter}章`,
          total: `共${total}章`,
          percent: total === 0 ? 0 : Math.round((input.project.currentChapter / total) * 100),
        },
      ],
    },
    characters: buildCharacters(people, relationships),
    schedule: buildSchedule(input.world),
    calendar: buildCalendar(input.now ?? new Date()),
  };
}

function isComplete(chapter: ChapterMeta): boolean {
  return chapter.status === 'complete' || chapter.status === 'published';
}

function formatCount(value: number): string {
  if (value >= 10000) {
    const wan = value / 10000;
    return `${wan >= 10 ? wan.toFixed(0) : wan.toFixed(1).replace(/\.0$/, '')}万`;
  }
  return String(value);
}

function firstSentence(markdown: string | undefined): string {
  if (!markdown) return '';
  const line = markdown
    .split('\n')
    .map((entry) => entry.replace(/^#+\s*/, '').trim())
    .find((entry) => entry.length > 0);
  return line ?? '';
}

function isWorldDocTitle(title: string): boolean {
  return /^(世界观|世界设定|世界观设定)$/.test(title.replace(/\s+/g, ''));
}

function firstCaption(body: string): string {
  const line = body
    .split(/\r?\n/)
    .map((entry) => entry.replace(/^[-*>]\s+/, '').replace(/\*\*/g, '').trim())
    .find((entry) =>
      entry.length > 0
      && !/^#{1,6}\s/.test(entry)
      && !/^```/.test(entry)
      && !/^\|/.test(entry),
    );
  if (!line) return '来自世界观';
  return line.length > 42 ? `${line.slice(0, 41)}…` : line;
}

function parseWorldSections(markdown: string): Array<{ level: number; title: string; body: string }> {
  const sections: Array<{ level: number; title: string; body: string[] }> = [];
  let current: { level: number; title: string; body: string[] } | null = null;
  for (const line of markdown.split(/\r?\n/)) {
    const heading = line.match(/^(#{1,6})\s+(.+?)\s*$/);
    if (heading) {
      if (current) sections.push(current);
      current = { level: heading[1].length, title: heading[2].trim(), body: [] };
      continue;
    }
    if (current) current.body.push(line);
  }
  if (current) sections.push(current);
  return sections.map((section) => ({
    level: section.level,
    title: section.title,
    body: section.body.join('\n'),
  }));
}

function worldPlaces(markdown: string | undefined): Array<{ title: string; caption: string }> {
  if (!markdown?.trim()) return [];
  const sections = parseWorldSections(markdown).filter((section) => !isWorldDocTitle(section.title));
  const h2 = sections.filter((section) => section.level === 2);
  const chosen = (h2.length > 0 ? h2 : sections.filter((section) => section.level === 3)).slice(0, 3);
  if (chosen.length > 0) {
    return chosen.map((section) => ({
      title: section.title,
      caption: firstCaption(section.body),
    }));
  }
  const lines = markdown
    .split(/\r?\n/)
    .map((line) => line.replace(/^#+\s*/, '').trim())
    .filter((line) => line.length > 0 && !isWorldDocTitle(line));
  return lines.slice(0, 3).map((line, index) => ({
    title: line.length > 18 ? `${line.slice(0, 17)}…` : line,
    caption: lines[index + 1] ?? '来自世界观',
  }));
}

function buildSchedule(world: string | undefined): HomeDashboardView['schedule'] {
  const places = worldPlaces(world);
  if (places.length === 0) {
    return [{ title: '世界观', subtitle: '还没有场景日程', badge: '待编辑' }];
  }
  return places.map((place, index) => ({
    title: place.title,
    subtitle: place.caption,
    badge: index === 0 ? '设定中' : '待展开',
  }));
}

function mapRelation(kind: string | undefined): HomeRelation {
  if (kind === 'ally' || kind === 'conflict' || kind === 'mentor' || kind === 'love' || kind === 'unknown') {
    return kind;
  }
  if (kind === 'rival') return 'conflict';
  return 'unknown';
}

function buildCharacters(
  people: CharacterFile['characters'],
  relationships: CharacterFile['relationships'],
): HomeDashboardView['characters'] {
  if (people.length === 0) {
    return {
      empty: true,
      emptyHint: '还没有人物。到人物页导入或创建。',
      center: { name: '', role: '', portraitAssetKey: 'liora' },
      nodes: [],
    };
  }

  const counts = new Map<string, number>();
  for (const relation of relationships) {
    counts.set(relation.fromCharacterId, (counts.get(relation.fromCharacterId) ?? 0) + 1);
    counts.set(relation.toCharacterId, (counts.get(relation.toCharacterId) ?? 0) + 1);
  }
  const center =
    people.slice().sort((left, right) => (counts.get(right.id) ?? 0) - (counts.get(left.id) ?? 0))[0] ?? people[0];
  const others = people.filter((person) => person.id !== center.id).slice(0, NODE_SLOTS.length);

  return {
    empty: false,
    emptyHint: '',
    center: {
      name: center.name,
      role: center.role || '角色',
      portraitAssetKey: portraitFor(people.indexOf(center)),
    },
    nodes: others.map((person, index) => {
      const link = relationships.find(
        (relation) =>
          (relation.fromCharacterId === center.id && relation.toCharacterId === person.id) ||
          (relation.toCharacterId === center.id && relation.fromCharacterId === person.id),
      );
      const slot = NODE_SLOTS[index] ?? NODE_SLOTS[0];
      return {
        name: person.name,
        role: person.role || '角色',
        portraitAssetKey: portraitFor(people.indexOf(person)),
        relation: mapRelation(link?.kind),
        x: person.x ?? slot.x,
        y: person.y ?? slot.y,
      };
    }),
  };
}

function portraitFor(index: number): PortraitAssetKey {
  return PORTRAIT_KEYS[index % PORTRAIT_KEYS.length] ?? 'liora';
}

function buildCalendar(now: Date): HomeDashboardView['calendar'] {
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const mondayOffset = (firstWeekday + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();
  const days: number[] = [];
  for (let index = 0; index < 42; index += 1) {
    const dateNumber = index - mondayOffset + 1;
    if (dateNumber < 1) days.push(prevDays + dateNumber);
    else if (dateNumber > daysInMonth) days.push(dateNumber - daysInMonth);
    else days.push(dateNumber);
  }
  return {
    label: `${year}年${month + 1}月`,
    weekdays: ['一', '二', '三', '四', '五', '六', '日'],
    days,
    active: now.getDate(),
  };
}
