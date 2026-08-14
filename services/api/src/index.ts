import Fastify from 'fastify';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import type { CharacterFile, DocumentName, RecipeId } from './projectTypes.ts';
import {
  readChapter, readCharacters, readDocument, readProject, writeChapter, writeCharacters, writeDocument,
} from './projectStore.ts';
import {
  acceptDraft, createTask, discardDraft, listTasks, readDraft, readTask,
} from './taskStore.ts';

const REPO_ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const DATA_ROOT = process.env.NOVELORA_DATA_DIR ?? join(REPO_ROOT, '.novelora-data');
const PORT = Number(process.env.NOVELORA_API_PORT ?? 8787);
const HOST = process.env.NOVELORA_API_HOST ?? '127.0.0.1';

const DOCUMENT_NAMES = new Set<DocumentName>(['outline', 'world', 'canon', 'relations']);
const RECIPE_IDS = new Set<RecipeId>(['chapter', 'act', 'volume']);

function asDocumentName(name: string): DocumentName | undefined {
  return DOCUMENT_NAMES.has(name as DocumentName) ? name as DocumentName : undefined;
}

function asRecipeId(recipe: unknown): RecipeId | undefined {
  return typeof recipe === 'string' && RECIPE_IDS.has(recipe as RecipeId) ? recipe as RecipeId : undefined;
}

function isCharacterFile(body: unknown): body is CharacterFile {
  if (!body || typeof body !== 'object') return false;
  const file = body as CharacterFile;
  return Array.isArray(file.characters) && Array.isArray(file.relationships);
}

function isNotFound(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  if ('code' in err && err.code === 'ENOENT') return true;
  return /unknown|draft/i.test(err.message);
}

export async function buildServer() {
  const app = Fastify({ logger: true });
  const projectRoot = (id: string) => join(DATA_ROOT, id);

  app.get('/health', async () => ({ ok: true, service: 'novelora-api' }));

  app.get('/projects/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      return await readProject(projectRoot(id));
    } catch {
      return reply.code(404).send({ error: `Unknown project ${id}` });
    }
  });

  app.get('/projects/:id/chapters/:num', async (request, reply) => {
    const { id, num } = request.params as { id: string; num: string };
    try {
      return await readChapter(projectRoot(id), Number(num));
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
      return await writeChapter(projectRoot(id), Number(num), body.content);
    } catch {
      return reply.code(404).send({ error: `Unknown chapter ${num}` });
    }
  });

  app.get('/projects/:id/documents/:name', async (request, reply) => {
    const { id, name } = request.params as { id: string; name: string };
    const doc = asDocumentName(name);
    if (!doc) return reply.code(400).send({ error: `Unknown document ${name}` });
    const root = projectRoot(id);
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
    const root = projectRoot(id);
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
    const root = projectRoot(id);
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
    const root = projectRoot(id);
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
    const root = projectRoot(id);
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
    if (!recipe || !Array.isArray(body?.chapterNums) || !body.chapterNums.every((n) => typeof n === 'number')) {
      return reply.code(400).send({ error: 'recipe and chapterNums are required' });
    }
    const model = typeof body.model === 'string' ? body.model : undefined;
    const root = projectRoot(id);
    try {
      await readProject(root);
      return await createTask(root, { recipe, chapterNums: body.chapterNums, model });
    } catch {
      return reply.code(404).send({ error: `Unknown project ${id}` });
    }
  });

  app.get('/projects/:id/tasks/:taskId', async (request, reply) => {
    const { id, taskId } = request.params as { id: string; taskId: string };
    const root = projectRoot(id);
    try {
      await readProject(root);
      return await readTask(root, taskId);
    } catch {
      return reply.code(404).send({ error: `Unknown task ${taskId}` });
    }
  });

  app.get('/projects/:id/drafts/:taskId/:num', async (request, reply) => {
    const { id, taskId, num } = request.params as { id: string; taskId: string; num: string };
    const root = projectRoot(id);
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
    const root = projectRoot(id);
    try {
      await readProject(root);
      await readTask(root, taskId);
      await acceptDraft(root, taskId, body.chapterNum);
      return { ok: true };
    } catch (err) {
      if (isNotFound(err)) return reply.code(404).send({ error: `Unknown draft ${taskId}` });
      return reply.code(404).send({ error: `Unknown task ${taskId}` });
    }
  });

  app.post('/projects/:id/tasks/:taskId/discard', async (request, reply) => {
    const { id, taskId } = request.params as { id: string; taskId: string };
    const body = request.body as { chapterNum?: unknown };
    if (typeof body?.chapterNum !== 'number') {
      return reply.code(400).send({ error: 'chapterNum must be a number' });
    }
    const root = projectRoot(id);
    try {
      await readProject(root);
      await readTask(root, taskId);
      await discardDraft(root, taskId, body.chapterNum);
      return { ok: true };
    } catch (err) {
      if (isNotFound(err)) return reply.code(404).send({ error: `Unknown draft ${taskId}` });
      return reply.code(404).send({ error: `Unknown task ${taskId}` });
    }
  });

  return app;
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  buildServer()
    .then((app) => app.listen({ port: PORT, host: HOST }))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
