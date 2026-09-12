import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { isAbsolute, dirname, join } from 'node:path';
import { atomicWrite } from './projectStore.ts';

export type CandidateSource = 'dialog' | 'workflow';
export type CandidateStatus = 'pending';

export interface FileCandidate {
  id: string;
  runId: string;
  targetPath: string;
  source: CandidateSource;
  status: CandidateStatus;
  createdAt: string;
}

const ALLOWED_CHAPTER = /^chapters\/ch_\d{2}\.md$/;
const ALLOWED_DOCS = new Set(['outline.md', 'world.md', 'canon.md']);
const ALLOWED_STATE = /^state\/(facts|foreshadow|timeline)\.md$/;
const ALLOWED_GENE = /^genes\/[a-z0-9][a-z0-9_-]{0,63}\.md$/;
const UUID_SHAPE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidCandidateId(id: string): boolean {
  return UUID_SHAPE.test(id);
}

export function isAllowedTargetPath(path: string): boolean {
  if (!path || path.includes('..')) return false;
  if (isAbsolute(path)) return false;
  if (path === 'characters.json' || path === 'relations.md') return false;
  if (ALLOWED_CHAPTER.test(path)) return true;
  if (ALLOWED_STATE.test(path) || ALLOWED_GENE.test(path)) return true;
  return ALLOWED_DOCS.has(path);
}

function candidateDir(root: string, id: string): string {
  if (!isValidCandidateId(id)) {
    throw new Error(`Invalid candidate id ${id}`);
  }
  return join(root, 'drafts', 'candidates', id);
}
const metaFile = (root: string, id: string) => join(candidateDir(root, id), 'meta.json');
const contentFile = (root: string, id: string) => join(candidateDir(root, id), 'content.md');

function notFound(err: unknown): boolean {
  return err instanceof Error && 'code' in err && err.code === 'ENOENT';
}

async function readCandidateMeta(root: string, id: string): Promise<FileCandidate> {
  try {
    return JSON.parse(await readFile(metaFile(root, id), 'utf8')) as FileCandidate;
  } catch (err) {
    if (notFound(err)) throw new Error(`Unknown candidate ${id}`);
    throw err;
  }
}

export async function writeCandidate(
  root: string,
  input: { runId: string; targetPath: string; source: CandidateSource; content: string },
): Promise<FileCandidate> {
  if (!isAllowedTargetPath(input.targetPath)) {
    throw new Error(`Disallowed target path ${input.targetPath}`);
  }

  const candidate: FileCandidate = {
    id: crypto.randomUUID(),
    runId: input.runId,
    targetPath: input.targetPath,
    source: input.source,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  const dir = candidateDir(root, candidate.id);
  await mkdir(dir, { recursive: true });
  await writeFile(metaFile(root, candidate.id), JSON.stringify(candidate, null, 2), 'utf8');
  await writeFile(contentFile(root, candidate.id), input.content, 'utf8');
  return candidate;
}

export async function readCandidateContent(root: string, id: string): Promise<string> {
  try {
    return await readFile(contentFile(root, id), 'utf8');
  } catch (err) {
    if (notFound(err)) throw new Error(`Unknown candidate ${id}`);
    throw err;
  }
}

export async function listPendingCandidates(root: string): Promise<FileCandidate[]> {
  try {
    const names = await readdir(join(root, 'drafts', 'candidates'));
    const candidates: FileCandidate[] = [];
    for (const name of names) {
      try {
        const meta = JSON.parse(await readFile(metaFile(root, name), 'utf8')) as FileCandidate;
        if (meta.status === 'pending') candidates.push(meta);
      } catch (err) {
        if (!notFound(err)) throw err;
      }
    }
    return candidates;
  } catch (err) {
    if (notFound(err)) return [];
    throw err;
  }
}

export async function acceptCandidate(root: string, id: string): Promise<void> {
  const meta = await readCandidateMeta(root, id);
  if (!isAllowedTargetPath(meta.targetPath)) {
    throw new Error(`Disallowed target path ${meta.targetPath}`);
  }
  const content = await readCandidateContent(root, id);
  await mkdir(dirname(join(root, meta.targetPath)), { recursive: true });
  await atomicWrite(join(root, meta.targetPath), content);
  await rm(candidateDir(root, id), { recursive: true, force: true });
}

export async function discardCandidate(root: string, id: string): Promise<void> {
  await readCandidateMeta(root, id);
  await rm(candidateDir(root, id), { recursive: true, force: false });
}
