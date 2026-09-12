import { useEffect, useRef, useSyncExternalStore } from 'react';
import { DEFAULT_LLM_MODEL, streamChat } from './hermesChat';
import {
  fetchProject,
  fetchTextFile,
  saveCharacters,
  saveDocument,
  type CharacterFile,
} from './noveloraApi';

export type ImportKind = 'outline' | 'world' | 'characters';

export interface ImportJobSnapshot {
  kind: ImportKind;
  filePath: string;
  phase: 'generating' | 'error' | 'saved';
  output: string;
  reasoning: string;
  error: string;
  result?: CharacterFile;
}

interface Runtime {
  job: ImportJobSnapshot | null;
  abort: AbortController | null;
  running: Promise<void> | null;
  listeners: Set<() => void>;
}

const DOCUMENT_PROMPTS: Record<'outline' | 'world', string> = {
  outline: [
    '你是小说编辑助手。请把用户给的原文整理成可用的小说大纲 Markdown。',
    '理清卷、章、节和因果，保留原文事实，不要编造未出现的情节。',
    '只输出整理后的 Markdown，不要解释。',
  ].join('\n'),
  world: [
    '你是小说设定助手。请把用户给的原文整理成可用的世界观设定 Markdown。',
    '按规则、地理、势力、物产等条目归类，保留原文事实，不要编造。',
    '只输出整理后的 Markdown，不要解释。',
  ].join('\n'),
};

const CHARACTER_PROMPT = [
  '你是小说资料整理助手。请从用户给定的小说资料中提取人物与关系。',
  '只输出一个 ```json 代码块，不要输出任何其他文字。JSON 形状：',
  '{ "characters": [{ "id": "char-1", "name": "姓名", "role": "角色定位", "goal?": "目标", "knows?": "知情" }],',
  '  "relationships": [{ "id": "rel-1", "fromCharacterId": "char-1", "toCharacterId": "char-2", "label": "关系", "tension": "张力", "kind": "ally|neutral|rival|unknown" }] }',
  '人物 id 使用 char-1、char-2 递增，关系 id 使用 rel-1、rel-2 递增。',
  '如果资料里没有关系，relationships 用空数组。',
].join('\n');

const JSON_FENCE = /```json\s*\n([\s\S]*?)```/;
const JSON_FENCE_LOOSE = /```json\s*\n?([\s\S]*?)(?:```|$)/;

const runtimes = new Map<string, Runtime>();

function keyOf(projectId: string, kind: ImportKind) {
  return `${projectId}:${kind}`;
}

function ensure(projectId: string, kind: ImportKind): Runtime {
  const key = keyOf(projectId, kind);
  let runtime = runtimes.get(key);
  if (!runtime) {
    runtime = { job: null, abort: null, running: null, listeners: new Set() };
    runtimes.set(key, runtime);
  }
  return runtime;
}

function emit(runtime: Runtime) {
  if (runtime.job) runtime.job = { ...runtime.job };
  for (const listener of runtime.listeners) listener();
}

function emptyJob(kind: ImportKind, filePath: string): ImportJobSnapshot {
  return {
    kind,
    filePath,
    phase: 'generating',
    output: '',
    reasoning: '',
    error: '',
  };
}

export function parseCharacterFile(text: string): CharacterFile | null {
  const match = text.match(JSON_FENCE) ?? text.match(JSON_FENCE_LOOSE);
  const candidates = [match?.[1], text.trim()];
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) candidates.push(text.slice(start, end + 1));
  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      const parsed = JSON.parse(candidate) as Partial<CharacterFile>;
      if (!Array.isArray(parsed.characters)) continue;
      return {
        characters: parsed.characters,
        relationships: Array.isArray(parsed.relationships) ? parsed.relationships : [],
      };
    } catch {
      /* try the next candidate */
    }
  }
  return null;
}

export function getImportJob(projectId: string, kind: ImportKind): ImportJobSnapshot | null {
  return runtimes.get(keyOf(projectId, kind))?.job ?? null;
}

export function subscribeImportJob(
  projectId: string,
  kind: ImportKind,
  listener: () => void,
): () => void {
  const runtime = ensure(projectId, kind);
  runtime.listeners.add(listener);
  return () => {
    runtime.listeners.delete(listener);
  };
}

export function useImportJob(projectId: string, kind: ImportKind): ImportJobSnapshot | null {
  return useSyncExternalStore(
    (listener) => subscribeImportJob(projectId, kind, listener),
    () => getImportJob(projectId, kind),
    () => getImportJob(projectId, kind),
  );
}

export const IMPORT_NOTICE: Record<
  ImportKind,
  { saved: string; error: string; nav: 'outline' | 'world' | 'characters' }
> = {
  outline: { saved: '大纲已整理完成', error: '大纲整理失败，请重试', nav: 'outline' },
  world: { saved: '世界观已整理完成', error: '世界观整理失败，请重试', nav: 'world' },
  characters: { saved: '人物已提取完成', error: '人物提取失败，请重试', nav: 'characters' },
};

export function useImportCompletionNotice(
  projectId: string,
  onNotice: (notice: { text: string; nav: 'outline' | 'world' | 'characters' }) => void,
) {
  const outline = useImportJob(projectId, 'outline');
  const world = useImportJob(projectId, 'world');
  const characters = useImportJob(projectId, 'characters');
  const seen = useRef(new Set<string>());

  useEffect(() => {
    const jobs = { outline, world, characters };
    for (const kind of ['outline', 'world', 'characters'] as const) {
      const job = jobs[kind];
      if (!job) continue;
      if (job.phase === 'generating') {
        for (const key of [...seen.current]) {
          if (key.startsWith(`${projectId}:${kind}:`)) seen.current.delete(key);
        }
        continue;
      }
      if (job.phase !== 'saved' && job.phase !== 'error') continue;
      const token = `${projectId}:${kind}:${job.filePath}:${job.phase}`;
      if (seen.current.has(token)) continue;
      seen.current.add(token);
      const copy = IMPORT_NOTICE[kind];
      onNotice({
        text: job.phase === 'saved' ? copy.saved : copy.error,
        nav: copy.nav,
      });
    }
  }, [projectId, outline, world, characters, onNotice]);
}

export function resetImportSessions() {
  for (const runtime of runtimes.values()) runtime.abort?.abort();
  runtimes.clear();
}

export function cancelImportJob(projectId: string, kind: ImportKind) {
  const runtime = runtimes.get(keyOf(projectId, kind));
  if (!runtime) return;
  runtime.abort?.abort();
  runtime.abort = null;
  runtime.running = null;
  runtime.job = null;
  emit(runtime);
}

function beginJob(
  projectId: string,
  kind: ImportKind,
  filePath: string,
  force: boolean,
): Runtime | null {
  const runtime = ensure(projectId, kind);
  if (runtime.job?.phase === 'generating' && runtime.job.filePath === filePath && runtime.running) {
    return null;
  }
  if (!force && runtime.job?.phase === 'saved' && runtime.job.filePath === filePath) {
    return null;
  }
  runtime.abort?.abort();
  runtime.abort = new AbortController();
  runtime.job = emptyJob(kind, filePath);
  emit(runtime);
  return runtime;
}

async function workspaceCwd(projectId: string): Promise<string | undefined> {
  try {
    const project = await fetchProject(projectId);
    return project.rootPath || undefined;
  } catch {
    return undefined;
  }
}

async function streamOrganize(
  runtime: Runtime,
  system: string,
  source: string,
  signal: AbortSignal,
  cwd?: string,
) {
  let content = '';
  let reasoning = '';
  for await (const delta of streamChat(
    [
      { role: 'system', content: system },
      { role: 'user', content: source },
    ],
    signal,
    { model: DEFAULT_LLM_MODEL, ...(cwd ? { cwd } : {}) },
  )) {
    if (delta.content) content += delta.content;
    if (delta.reasoning) reasoning += delta.reasoning;
    if (!runtime.job) break;
    runtime.job = {
      ...runtime.job,
      output: content,
      reasoning,
    };
    emit(runtime);
  }
  return { content, reasoning };
}

function parsedCharacterResult(content: string, reasoning: string): CharacterFile | null {
  const parsed =
    parseCharacterFile(content)
    ?? parseCharacterFile(reasoning)
    ?? parseCharacterFile(`${content}\n${reasoning}`);
  if (!parsed || parsed.characters.length === 0) return null;
  return parsed;
}

export function startDocumentImport(input: {
  projectId: string;
  kind: 'outline' | 'world';
  filePath: string;
  force?: boolean;
}): Promise<void> {
  const existing = ensure(input.projectId, input.kind);
  if (
    existing.job?.phase === 'generating'
    && existing.job.filePath === input.filePath
    && existing.running
  ) {
    return existing.running;
  }
  if (!input.force && existing.job?.phase === 'saved' && existing.job.filePath === input.filePath) {
    return Promise.resolve();
  }
  const runtime = beginJob(input.projectId, input.kind, input.filePath, Boolean(input.force));
  if (!runtime) return existing.running ?? Promise.resolve();
  const signal = runtime.abort?.signal;
  if (!signal) return Promise.resolve();

  const running = (async () => {
    try {
      const [source, cwd] = await Promise.all([
        fetchTextFile(input.filePath, input.projectId),
        workspaceCwd(input.projectId),
      ]);
      if (signal.aborted) return;
      const streamed = await streamOrganize(
        runtime,
        DOCUMENT_PROMPTS[input.kind],
        source.content,
        signal,
        cwd,
      );
      if (signal.aborted) return;
      const organized = streamed.content.trim() || streamed.reasoning.trim();
      if (!organized) {
        runtime.job = {
          ...(runtime.job ?? emptyJob(input.kind, input.filePath)),
          phase: 'error',
          error: '整理失败',
        };
        emit(runtime);
        return;
      }
      await saveDocument(input.kind, organized, input.projectId);
      if (signal.aborted) return;
      runtime.job = {
        ...(runtime.job ?? emptyJob(input.kind, input.filePath)),
        phase: 'saved',
        output: organized,
        reasoning: streamed.reasoning,
        error: '',
      };
      emit(runtime);
    } catch {
      if (signal.aborted) return;
      runtime.job = {
        ...(runtime.job ?? emptyJob(input.kind, input.filePath)),
        phase: 'error',
        error: '整理失败',
      };
      emit(runtime);
    } finally {
      runtime.abort = null;
      runtime.running = null;
    }
  })();
  runtime.running = running;
  return running;
}

export function startCharacterImport(input: {
  projectId: string;
  filePath: string;
  force?: boolean;
}): Promise<void> {
  const existing = ensure(input.projectId, 'characters');
  if (
    existing.job?.phase === 'generating'
    && existing.job.filePath === input.filePath
    && existing.running
  ) {
    return existing.running;
  }
  if (!input.force && existing.job?.phase === 'saved' && existing.job.filePath === input.filePath) {
    return Promise.resolve();
  }
  const runtime = beginJob(input.projectId, 'characters', input.filePath, Boolean(input.force));
  if (!runtime) return existing.running ?? Promise.resolve();
  const signal = runtime.abort?.signal;
  if (!signal) return Promise.resolve();

  const running = (async () => {
    try {
      const [source, cwd] = await Promise.all([
        fetchTextFile(input.filePath, input.projectId),
        workspaceCwd(input.projectId),
      ]);
      if (signal.aborted) return;
      const streamed = await streamOrganize(runtime, CHARACTER_PROMPT, source.content, signal, cwd);
      if (signal.aborted) return;
      const parsed = parsedCharacterResult(streamed.content, streamed.reasoning);
      if (!parsed) {
        runtime.job = {
          ...(runtime.job ?? emptyJob('characters', input.filePath)),
          phase: 'error',
          error: '提取失败',
        };
        emit(runtime);
        return;
      }
      const saved = await saveCharacters(parsed, input.projectId);
      if (signal.aborted) return;
      runtime.job = {
        ...(runtime.job ?? emptyJob('characters', input.filePath)),
        phase: 'saved',
        output: streamed.content,
        reasoning: streamed.reasoning,
        result: saved,
        error: '',
      };
      emit(runtime);
    } catch {
      if (signal.aborted) return;
      const salvage = parsedCharacterResult(
        runtime.job?.output ?? '',
        runtime.job?.reasoning ?? '',
      );
      if (salvage) {
        try {
          const saved = await saveCharacters(salvage, input.projectId);
          if (signal.aborted) return;
          runtime.job = {
            ...(runtime.job ?? emptyJob('characters', input.filePath)),
            phase: 'saved',
            result: saved,
            error: '',
          };
          emit(runtime);
          return;
        } catch {
          /* fall through to the error state */
        }
      }
      runtime.job = {
        ...(runtime.job ?? emptyJob('characters', input.filePath)),
        phase: 'error',
        error: '提取失败',
      };
      emit(runtime);
    } finally {
      runtime.abort = null;
      runtime.running = null;
    }
  })();
  runtime.running = running;
  return running;
}
