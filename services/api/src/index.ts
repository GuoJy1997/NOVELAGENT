import Fastify from 'fastify';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CharacterFile, DocumentName, RecipeId } from './projectTypes.ts';
import {
  readChapter, readCharacters, readDocument, readProject, writeChapter, writeCharacters, writeDocument,
} from './projectStore.ts';
import {
  generateProjectCover, listEntries, listWorkspaces, registerWorkspace, resolveInside,
  resolveProjectRoot, scanChapters, setProjectCover,
} from './workspaceStore.ts';
import { runTaskStep } from './recipeRunner.ts';
import {
  acceptDraft, createTask, discardDraft, listTasks, readDraft, readTask, writeTask,
} from './taskStore.ts';
import {
  acceptCandidate,
  discardCandidate,
  isValidCandidateId,
  listPendingCandidates,
  readCandidateContent,
  writeCandidate,
} from './candidateStore.ts';
import type { CandidateSource } from './candidateStore.ts';
import { pickNativeFile, pickNativeFolder, type FolderPicker } from './folderPicker.ts';
import { toProjectRelative } from './projectPath.ts';
import { createChatUpstream, listLlmModels, type LlmConfig } from './deepseek.ts';
import { loadEnv } from './loadEnv.ts';
import { Readable } from 'node:stream';
import {
  isValidGraphName,
  listGraphs,
  listRuns as listWorkflowRuns,
  readGraph as readWorkflowGraph,
  readRun as readWorkflowRun,
  writeGraph,
} from './workflowStore.ts';
import { validateGraph } from './workflowGraph.ts';
import { forceRerun, resolveManual, runNextNode, startRun } from './workflowRunner.ts';
import type { WorkflowGraph } from './workflowTypes.ts';

export interface BuildServerOptions {
  pickFolder?: FolderPicker;
  pickFile?: FolderPicker;
  llm?: Partial<LlmConfig>;
  hermesFetch?: typeof fetch;
}

const PORT = Number(process.env.NOVELORA_API_PORT ?? 8787);
const HOST = process.env.NOVELORA_API_HOST ?? '127.0.0.1';

const COVER_CONTENT_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

const DOCUMENT_NAMES = new Set<DocumentName>(['outline', 'world', 'canon', 'relations']);
const RECIPE_IDS = new Set<RecipeId>(['chapter', 'act', 'volume']);
const CANDIDATE_SOURCES = new Set<CandidateSource>(['dialog', 'workflow']);

function asDocumentName(name: string): DocumentName | undefined {
  return DOCUMENT_NAMES.has(name as DocumentName) ? name as DocumentName : undefined;
}

function asRecipeId(recipe: unknown): RecipeId | undefined {
  return typeof recipe === 'string' && RECIPE_IDS.has(recipe as RecipeId) ? recipe as RecipeId : undefined;
}

function asCandidateSource(source: unknown): CandidateSource | undefined {
  return typeof source === 'string' && CANDIDATE_SOURCES.has(source as CandidateSource)
    ? source as CandidateSource
    : undefined;
}

function isCharacterFile(body: unknown): body is CharacterFile {
  if (!body || typeof body !== 'object') return false;
  const file = body as CharacterFile;
  return Array.isArray(file.characters) && Array.isArray(file.relationships);
}

export async function buildServer(options: BuildServerOptions = {}) {
  const app = Fastify({ logger: true });
  const projectRoot = (id: string) => resolveProjectRoot(id);
  const pickFolder = options.pickFolder ?? pickNativeFolder;
  const pickFile = options.pickFile ?? pickNativeFile;
  const hermesFetch = options.hermesFetch ?? fetch;
  const llmConfig = (): LlmConfig => ({
    apiKey: options.llm?.apiKey ?? process.env.DEEPSEEK_API_KEY ?? '',
    baseUrl: options.llm?.baseUrl ?? process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com',
    fetchImpl: options.llm?.fetchImpl,
  });

  app.get('/health', async () => ({ ok: true, service: 'novelora-api' }));

  app.get('/llm/models', async (_request, reply) => {
    const config = llmConfig();
    if (!config.apiKey) return reply.code(503).send({ error: 'DeepSeek API key is not configured' });
    try {
      return await listLlmModels(config);
    } catch {
      return reply.code(502).send({ error: 'DeepSeek models request failed' });
    }
  });

  app.post('/llm/chat', async (request, reply) => {
    const config = llmConfig();
    if (!config.apiKey) return reply.code(503).send({ error: 'DeepSeek API key is not configured' });
    const body = request.body as { model?: unknown; messages?: unknown } | undefined;
    const messages = body?.messages;
    if (!Array.isArray(messages)) {
      return reply.code(400).send({ error: 'messages must be an array' });
    }
    try {
      const upstream = await createChatUpstream(config, {
        model: typeof body?.model === 'string' ? body.model : undefined,
        messages,
      });
      if (!upstream.ok || !upstream.body) {
        return reply.code(upstream.status === 200 ? 502 : upstream.status).send({
          error: `DeepSeek ${upstream.status}`,
        });
      }
      reply.header('Content-Type', upstream.headers.get('content-type') ?? 'text/event-stream');
      return reply.send(Readable.fromWeb(upstream.body as import('node:stream/web').ReadableStream));
    } catch {
      return reply.code(502).send({ error: 'DeepSeek chat request failed' });
    }
  });

  app.get('/workspaces', async () => listWorkspaces());

  app.post('/workspaces/browse', async (request) => {
    const body = request.body as { title?: unknown } | undefined;
    const title = typeof body?.title === 'string' && body.title.trim() !== '' ? body.title : '选择文件夹';
    return { path: await pickFolder(title) };
  });

  app.post('/workspaces/browse-file', async (request) => {
    const body = request.body as { title?: unknown } | undefined;
    const title = typeof body?.title === 'string' && body.title.trim() !== '' ? body.title : '选择文件';
    return { path: await pickFile(title) };
  });

  app.get('/local-text', async (request, reply) => {
    const { path: filePath } = request.query as { path?: unknown };
    if (typeof filePath !== 'string' || !/\.(md|txt)$/i.test(filePath)) {
      return reply.code(400).send({ error: 'path must be a .md or .txt file' });
    }
    const resolved = resolve(filePath);
    try {
      const info = await stat(resolved);
      if (!info.isFile()) {
        return reply.code(400).send({ error: 'path must be a file' });
      }
      return { content: await readFile(resolved, 'utf8') };
    } catch {
      return reply.code(404).send({ error: `Unknown file ${filePath}` });
    }
  });

  app.post('/workspaces', async (request, reply) => {
    const body = request.body as { path?: unknown };
    if (typeof body?.path !== 'string') {
      return reply.code(400).send({ error: 'path must be a string' });
    }
    try {
      const { project } = await registerWorkspace(body.path);
      return reply.code(201).send(project);
    } catch (err) {
      return reply.code(400).send({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.put('/projects/:id/chapters-dir', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { dir?: unknown };
    if (typeof body?.dir !== 'string') {
      return reply.code(400).send({ error: 'dir must be a string' });
    }
    const root = await projectRoot(id);
    try {
      await readProject(root);
    } catch {
      return reply.code(404).send({ error: `Unknown project ${id}` });
    }
    try {
      return await scanChapters(root, toProjectRelative(root, body.dir));
    } catch (err) {
      return reply.code(400).send({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get('/projects/:id/files', async (request, reply) => {
    const { id } = request.params as { id: string };
    const root = await projectRoot(id);
    try {
      await readProject(root);
    } catch {
      return reply.code(404).send({ error: `Unknown project ${id}` });
    }
    return listEntries(root);
  });

  app.get('/projects/:id/file-content', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { path: rel } = request.query as { path?: unknown };
    if (typeof rel !== 'string' || !/\.(md|txt)$/i.test(rel)) {
      return reply.code(400).send({ error: 'path must be a .md or .txt file' });
    }
    const root = await projectRoot(id);
    let resolved: string;
    try {
      resolved = resolveInside(root, rel);
    } catch (err) {
      return reply.code(400).send({ error: err instanceof Error ? err.message : String(err) });
    }
    try {
      return { content: await readFile(resolved, 'utf8') };
    } catch {
      return reply.code(404).send({ error: `Unknown file ${rel}` });
    }
  });

  app.put('/projects/:id/cover', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { file?: unknown };
    if (typeof body?.file !== 'string') {
      return reply.code(400).send({ error: 'file must be a string' });
    }
    const root = await projectRoot(id);
    try {
      await readProject(root);
    } catch {
      return reply.code(404).send({ error: `Unknown project ${id}` });
    }
    try {
      return await setProjectCover(root, body.file);
    } catch (err) {
      return reply.code(400).send({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/projects/:id/cover/generate', async (request, reply) => {
    const { id } = request.params as { id: string };
    const root = await projectRoot(id);
    try {
      await readProject(root);
    } catch {
      return reply.code(404).send({ error: `Unknown project ${id}` });
    }
    return generateProjectCover(root);
  });

  app.get('/projects/:id/cover', async (request, reply) => {
    const { id } = request.params as { id: string };
    const root = await projectRoot(id);
    let meta;
    try {
      meta = await readProject(root);
    } catch {
      return reply.code(404).send({ error: `Unknown project ${id}` });
    }
    if (!meta.cover) return reply.code(404).send({ error: `Project ${id} has no cover` });
    let resolved: string;
    try {
      resolved = resolveInside(root, meta.cover);
    } catch {
      return reply.code(404).send({ error: `Unknown cover ${meta.cover}` });
    }
    const contentType = COVER_CONTENT_TYPES[extname(resolved).toLowerCase()];
    if (!contentType) return reply.code(404).send({ error: `Unknown cover ${meta.cover}` });
    try {
      return reply.type(contentType).send(await readFile(resolved));
    } catch {
      return reply.code(404).send({ error: `Unknown cover ${meta.cover}` });
    }
  });

  app.get('/projects/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const root = await projectRoot(id);
      return { ...await readProject(root), rootPath: root };
    } catch {
      return reply.code(404).send({ error: `Unknown project ${id}` });
    }
  });

  app.get('/projects/:id/chapters/:num', async (request, reply) => {
    const { id, num } = request.params as { id: string; num: string };
    try {
      return await readChapter(await projectRoot(id), Number(num));
    } catch {
      return reply.code(404).send({ error: `Unknown chapter ${num}` });
    }
  });

  app.put('/projects/:id/chapters/:num', async (request, reply) => {
    const { id, num } = request.params as { id: string; num: string };
    const body = request.body as { content?: unknown };
    if (typeof body?.content !== 'string') {
      return reply.code(400).send({ error: 'content must be a string' });
    }
    try {
      return await writeChapter(await projectRoot(id), Number(num), body.content);
    } catch {
      return reply.code(404).send({ error: `Unknown chapter ${num}` });
    }
  });

  app.get('/projects/:id/documents/:name', async (request, reply) => {
    const { id, name } = request.params as { id: string; name: string };
    const doc = asDocumentName(name);
    if (!doc) return reply.code(400).send({ error: `Unknown document ${name}` });
    const root = await projectRoot(id);
    try {
      await readProject(root);
      return { content: await readDocument(root, doc) };
    } catch {
      return reply.code(404).send({ error: `Unknown document ${name}` });
    }
  });

  app.put('/projects/:id/documents/:name', async (request, reply) => {
    const { id, name } = request.params as { id: string; name: string };
    const doc = asDocumentName(name);
    if (!doc) return reply.code(400).send({ error: `Unknown document ${name}` });
    if (doc === 'relations') {
      return reply.code(400).send({ error: 'relations document is projected from characters.json' });
    }
    const body = request.body as { content?: unknown };
    if (typeof body?.content !== 'string') {
      return reply.code(400).send({ error: 'content must be a string' });
    }
    const root = await projectRoot(id);
    try {
      await readProject(root);
      await writeDocument(root, doc, body.content);
      return { content: body.content };
    } catch (err) {
      if (err instanceof Error && /relations/i.test(err.message)) {
        return reply.code(400).send({ error: err.message });
      }
      return reply.code(404).send({ error: `Unknown project ${id}` });
    }
  });

  app.get('/projects/:id/characters', async (request, reply) => {
    const { id } = request.params as { id: string };
    const root = await projectRoot(id);
    try {
      await readProject(root);
      return await readCharacters(root);
    } catch {
      return reply.code(404).send({ error: `Unknown project ${id}` });
    }
  });

  app.put('/projects/:id/characters', async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!isCharacterFile(request.body)) {
      return reply.code(400).send({ error: 'body must be a CharacterFile' });
    }
    const root = await projectRoot(id);
    try {
      await readProject(root);
      await writeCharacters(root, request.body);
      return request.body;
    } catch {
      return reply.code(404).send({ error: `Unknown project ${id}` });
    }
  });

  app.get('/projects/:id/tasks', async (request, reply) => {
    const { id } = request.params as { id: string };
    const root = await projectRoot(id);
    try {
      await readProject(root);
      return await listTasks(root);
    } catch {
      return reply.code(404).send({ error: `Unknown project ${id}` });
    }
  });

  app.post('/projects/:id/tasks', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { recipe?: unknown; chapterNums?: unknown; model?: unknown };
    const recipe = asRecipeId(body?.recipe);
    if (!recipe || !Array.isArray(body?.chapterNums) || !body.chapterNums.every((n) => Number.isInteger(n))) {
      return reply.code(400).send({ error: 'recipe and chapterNums are required' });
    }
    if (body.chapterNums.length === 0) {
      return reply.code(400).send({ error: 'chapterNums must not be empty' });
    }
    const model = typeof body.model === 'string' ? body.model : undefined;
    const root = await projectRoot(id);
    try {
      const project = await readProject(root);
      const known = new Set(project.chapters.map((chapter) => chapter.num));
      if (body.chapterNums.some((num) => !known.has(num))) {
        return reply.code(400).send({ error: 'chapterNums must match project chapters' });
      }
      return await createTask(root, { recipe, chapterNums: body.chapterNums, model });
    } catch {
      return reply.code(404).send({ error: `Unknown project ${id}` });
    }
  });

  app.get('/projects/:id/tasks/:taskId', async (request, reply) => {
    const { id, taskId } = request.params as { id: string; taskId: string };
    const root = await projectRoot(id);
    try {
      await readProject(root);
      return await readTask(root, taskId);
    } catch {
      return reply.code(404).send({ error: `Unknown task ${taskId}` });
    }
  });

  app.post('/projects/:id/tasks/:taskId/run', async (request, reply) => {
    const { id, taskId } = request.params as { id: string; taskId: string };
    const root = await projectRoot(id);
    try {
      await readProject(root);
    } catch {
      return reply.code(404).send({ error: `Unknown project ${id}` });
    }
    try {
      await readTask(root, taskId);
    } catch {
      return reply.code(404).send({ error: `Unknown task ${taskId}` });
    }
    return await runTaskStep(root, taskId);
  });

  app.post('/projects/:id/tasks/:taskId/stop', async (request, reply) => {
    const { id, taskId } = request.params as { id: string; taskId: string };
    const root = await projectRoot(id);
    try {
      await readProject(root);
    } catch {
      return reply.code(404).send({ error: `Unknown project ${id}` });
    }
    try {
      const task = await readTask(root, taskId);
      const next = { ...task, status: 'queued' as const };
      await writeTask(root, next);
      return next;
    } catch {
      return reply.code(404).send({ error: `Unknown task ${taskId}` });
    }
  });

  app.get('/projects/:id/drafts/:taskId/:num', async (request, reply) => {
    const { id, taskId, num } = request.params as { id: string; taskId: string; num: string };
    const root = await projectRoot(id);
    try {
      await readProject(root);
      return { content: await readDraft(root, taskId, Number(num)) };
    } catch {
      return reply.code(404).send({ error: `Unknown draft ${taskId}` });
    }
  });

  app.post('/projects/:id/tasks/:taskId/accept', async (request, reply) => {
    const { id, taskId } = request.params as { id: string; taskId: string };
    const body = request.body as { chapterNum?: unknown };
    if (typeof body?.chapterNum !== 'number') {
      return reply.code(400).send({ error: 'chapterNum must be a number' });
    }
    const root = await projectRoot(id);
    try {
      await readProject(root);
    } catch {
      return reply.code(404).send({ error: `Unknown project ${id}` });
    }
    try {
      await readTask(root, taskId);
    } catch {
      return reply.code(404).send({ error: `Unknown task ${taskId}` });
    }
    try {
      await acceptDraft(root, taskId, body.chapterNum);
      return { ok: true };
    } catch {
      return reply.code(404).send({ error: `Unknown draft ${taskId}` });
    }
  });

  app.post('/projects/:id/tasks/:taskId/discard', async (request, reply) => {
    const { id, taskId } = request.params as { id: string; taskId: string };
    const body = request.body as { chapterNum?: unknown };
    if (typeof body?.chapterNum !== 'number') {
      return reply.code(400).send({ error: 'chapterNum must be a number' });
    }
    const root = await projectRoot(id);
    try {
      await readProject(root);
    } catch {
      return reply.code(404).send({ error: `Unknown project ${id}` });
    }
    try {
      await readTask(root, taskId);
    } catch {
      return reply.code(404).send({ error: `Unknown task ${taskId}` });
    }
    try {
      await discardDraft(root, taskId, body.chapterNum);
      return { ok: true };
    } catch {
      return reply.code(404).send({ error: `Unknown draft ${taskId}` });
    }
  });

  app.get('/projects/:id/candidates', async (request, reply) => {
    const { id } = request.params as { id: string };
    const root = await projectRoot(id);
    try {
      await readProject(root);
      return await listPendingCandidates(root);
    } catch {
      return reply.code(404).send({ error: `Unknown project ${id}` });
    }
  });

  app.get('/projects/:id/candidates/:candidateId', async (request, reply) => {
    const { id, candidateId } = request.params as { id: string; candidateId: string };
    if (!isValidCandidateId(candidateId)) {
      return reply.code(400).send({ error: `Invalid candidate id ${candidateId}` });
    }
    const root = await projectRoot(id);
    try {
      await readProject(root);
    } catch {
      return reply.code(404).send({ error: `Unknown project ${id}` });
    }
    const meta = (await listPendingCandidates(root)).find((candidate) => candidate.id === candidateId);
    if (!meta) {
      return reply.code(404).send({ error: `Unknown candidate ${candidateId}` });
    }
    try {
      const content = await readCandidateContent(root, candidateId);
      return { ...meta, content };
    } catch (err) {
      if (err instanceof Error && err.message.startsWith('Unknown candidate')) {
        return reply.code(404).send({ error: err.message });
      }
      throw err;
    }
  });

  app.post('/projects/:id/candidates', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      runId?: unknown;
      targetPath?: unknown;
      source?: unknown;
      content?: unknown;
    };
    if (typeof body?.runId !== 'string' || typeof body?.targetPath !== 'string' || typeof body?.content !== 'string') {
      return reply.code(400).send({ error: 'runId, targetPath, and content must be strings' });
    }
    const source = asCandidateSource(body.source);
    if (!source) {
      return reply.code(400).send({ error: 'source must be dialog or workflow' });
    }
    const root = await projectRoot(id);
    try {
      await readProject(root);
    } catch {
      return reply.code(404).send({ error: `Unknown project ${id}` });
    }
    try {
      const candidate = await writeCandidate(root, {
        runId: body.runId,
        targetPath: body.targetPath,
        source,
        content: body.content,
      });
      return reply.code(201).send(candidate);
    } catch (err) {
      if (err instanceof Error && err.message.startsWith('Disallowed target path')) {
        return reply.code(400).send({ error: err.message });
      }
      throw err;
    }
  });

  app.post('/projects/:id/candidates/:candidateId/accept', async (request, reply) => {
    const { id, candidateId } = request.params as { id: string; candidateId: string };
    if (!isValidCandidateId(candidateId)) {
      return reply.code(400).send({ error: `Invalid candidate id ${candidateId}` });
    }
    const root = await projectRoot(id);
    try {
      await readProject(root);
    } catch {
      return reply.code(404).send({ error: `Unknown project ${id}` });
    }
    try {
      await acceptCandidate(root, candidateId);
      return { ok: true };
    } catch (err) {
      if (err instanceof Error && err.message.startsWith('Unknown candidate')) {
        return reply.code(404).send({ error: err.message });
      }
      if (err instanceof Error && err.message.startsWith('Disallowed target path')) {
        return reply.code(400).send({ error: err.message });
      }
      throw err;
    }
  });

  app.post('/projects/:id/candidates/:candidateId/discard', async (request, reply) => {
    const { id, candidateId } = request.params as { id: string; candidateId: string };
    if (!isValidCandidateId(candidateId)) {
      return reply.code(400).send({ error: `Invalid candidate id ${candidateId}` });
    }
    const root = await projectRoot(id);
    try {
      await readProject(root);
    } catch {
      return reply.code(404).send({ error: `Unknown project ${id}` });
    }
    try {
      await discardCandidate(root, candidateId);
      return { ok: true };
    } catch (err) {
      if (err instanceof Error && err.message.startsWith('Unknown candidate')) {
        return reply.code(404).send({ error: err.message });
      }
      throw err;
    }
  });

  app.get('/projects/:id/workflow/graphs', async (request, reply) => {
    const { id } = request.params as { id: string };
    const root = await projectRoot(id);
    try {
      await readProject(root);
      return await listGraphs(root);
    } catch {
      return reply.code(404).send({ error: `Unknown project ${id}` });
    }
  });

  app.get('/projects/:id/workflow/graphs/:name', async (request, reply) => {
    const { id, name } = request.params as { id: string; name: string };
    if (!isValidGraphName(name)) return reply.code(400).send({ error: `Invalid graph name ${name}` });
    const root = await projectRoot(id);
    try {
      await readProject(root);
    } catch {
      return reply.code(404).send({ error: `Unknown project ${id}` });
    }
    try {
      return await readWorkflowGraph(root, name);
    } catch {
      return reply.code(404).send({ error: `Unknown graph ${name}` });
    }
  });

  app.put('/projects/:id/workflow/graphs/:name', async (request, reply) => {
    const { id, name } = request.params as { id: string; name: string };
    if (!isValidGraphName(name)) return reply.code(400).send({ error: `Invalid graph name ${name}` });
    const body = request.body as Partial<WorkflowGraph> | undefined;
    if (!body || !Array.isArray(body.nodes) || !Array.isArray(body.edges) || typeof body.model !== 'string') {
      return reply.code(400).send({ error: 'graph must have model, nodes, and edges' });
    }
    const root = await projectRoot(id);
    try {
      await readProject(root);
    } catch {
      return reply.code(404).send({ error: `Unknown project ${id}` });
    }
    const graph: WorkflowGraph = { name, model: body.model, nodes: body.nodes, edges: body.edges };
    const errors = validateGraph(graph);
    if (errors.length > 0) return reply.code(400).send({ error: 'invalid graph', details: errors });
    await writeGraph(root, graph);
    return { ok: true, name };
  });

  app.post('/projects/:id/workflow/runs', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { graphName?: unknown };
    if (typeof body?.graphName !== 'string') return reply.code(400).send({ error: 'graphName must be a string' });
    const root = await projectRoot(id);
    try {
      await readProject(root);
    } catch {
      return reply.code(404).send({ error: `Unknown project ${id}` });
    }
    try {
      return reply.code(201).send(await startRun(root, body.graphName));
    } catch (err) {
      if (err instanceof Error && err.message.startsWith('Unknown graph')) return reply.code(404).send({ error: err.message });
      if (err instanceof Error && (err.message.startsWith('Invalid graph') || err.message.startsWith('Invalid run'))) {
        return reply.code(400).send({ error: err.message });
      }
      throw err;
    }
  });

  app.get('/projects/:id/workflow/runs', async (request, reply) => {
    const { id } = request.params as { id: string };
    const root = await projectRoot(id);
    try {
      await readProject(root);
      return await listWorkflowRuns(root);
    } catch {
      return reply.code(404).send({ error: `Unknown project ${id}` });
    }
  });

  app.get('/projects/:id/workflow/runs/:runId', async (request, reply) => {
    const { id, runId } = request.params as { id: string; runId: string };
    const root = await projectRoot(id);
    try {
      await readProject(root);
      return await readWorkflowRun(root, runId);
    } catch {
      return reply.code(404).send({ error: `Unknown run ${runId}` });
    }
  });

  app.post('/projects/:id/workflow/runs/:runId/step', async (request, reply) => {
    const { id, runId } = request.params as { id: string; runId: string };
    const root = await projectRoot(id);
    try {
      await readProject(root);
    } catch {
      return reply.code(404).send({ error: `Unknown project ${id}` });
    }
    try {
      return await runNextNode(root, runId, hermesFetch);
    } catch (err) {
      if (err instanceof Error && (err.message.startsWith('Unknown run') || err.message.startsWith('Invalid run') || err.message.startsWith('Unknown graph'))) {
        return reply.code(404).send({ error: err.message });
      }
      throw err;
    }
  });

  app.post('/projects/:id/workflow/runs/:runId/manual', async (request, reply) => {
    const { id, runId } = request.params as { id: string; runId: string };
    const body = request.body as { nodeId?: unknown; note?: unknown };
    if (typeof body?.nodeId !== 'string') return reply.code(400).send({ error: 'nodeId must be a string' });
    const root = await projectRoot(id);
    try {
      await readProject(root);
    } catch {
      return reply.code(404).send({ error: `Unknown project ${id}` });
    }
    try {
      return await resolveManual(root, runId, body.nodeId, {
        note: typeof body.note === 'string' ? body.note : undefined,
      });
    } catch (err) {
      if (err instanceof Error && (err.message.startsWith('Unknown run') || err.message.startsWith('Invalid run'))) {
        return reply.code(404).send({ error: err.message });
      }
      if (err instanceof Error && err.message.includes('not waiting')) {
        return reply.code(400).send({ error: err.message });
      }
      throw err;
    }
  });

  app.post('/projects/:id/workflow/runs/:runId/rerun', async (request, reply) => {
    const { id, runId } = request.params as { id: string; runId: string };
    const body = request.body as { nodeId?: unknown };
    if (typeof body?.nodeId !== 'string') return reply.code(400).send({ error: 'nodeId must be a string' });
    const root = await projectRoot(id);
    try {
      await readProject(root);
    } catch {
      return reply.code(404).send({ error: `Unknown project ${id}` });
    }
    try {
      return await forceRerun(root, runId, body.nodeId);
    } catch (err) {
      if (err instanceof Error && (err.message.startsWith('Unknown run') || err.message.startsWith('Invalid run'))) {
        return reply.code(404).send({ error: err.message });
      }
      if (err instanceof Error && err.message.startsWith('Unknown node')) {
        return reply.code(400).send({ error: err.message });
      }
      throw err;
    }
  });

  return app;
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  loadEnv();
  buildServer()
    .then((app) => app.listen({ port: PORT, host: HOST }))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
