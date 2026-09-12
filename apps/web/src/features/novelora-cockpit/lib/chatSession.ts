import { extractChapterCandidate } from './chapterCandidate';
import { hermesSessionId, streamChat, type ChatMessage } from './hermesChat';
import { createCandidate } from './noveloraApi';

export interface ChatSessionSnapshot {
  messages: ChatMessage[];
  streaming: boolean;
  error: string;
  offline: boolean;
}

const HERMES_INSTRUCTIONS = [
  '你是本机 Hermes。规划、todo、工具按你自己的方式进行。',
  '改这本书的文件时，不要直接覆盖真文件。把正文候选交给文件核。',
  '不要把 characters.json 写进回复。',
].join('\n');

interface Runtime {
  snapshot: ChatSessionSnapshot;
  abort: AbortController | null;
  listeners: Set<() => void>;
}

const runtimes = new Map<string, Runtime>();

const EMPTY: ChatSessionSnapshot = {
  messages: [],
  streaming: false,
  error: '',
  offline: false,
};

function emptySnapshot(): ChatSessionSnapshot {
  return { messages: [], streaming: false, error: '', offline: false };
}

function ensure(projectId: string): Runtime {
  let runtime = runtimes.get(projectId);
  if (!runtime) {
    runtime = {
      snapshot: emptySnapshot(),
      abort: null,
      listeners: new Set(),
    };
    runtimes.set(projectId, runtime);
  }
  return runtime;
}

function emit(runtime: Runtime) {
  runtime.snapshot = { ...runtime.snapshot };
  for (const listener of runtime.listeners) listener();
}

function toWireMessages(display: ChatMessage[], context: string, cwd?: string): ChatMessage[] {
  const firstUser = display.findIndex((message) => message.role === 'user');
  const workspace = cwd
    ? `当前小说工作区是 ${cwd}。终端和文件工具只在这个目录工作。不要改到 Hermes 自己的配置目录。`
    : '';
  return display.map((message, index) => {
    if (message.role !== 'user' || index !== firstUser) return message;
    return {
      role: 'user',
      content: [HERMES_INSTRUCTIONS, workspace, context, message.content].filter(Boolean).join('\n\n'),
    };
  });
}

export function getChatSession(projectId: string): ChatSessionSnapshot {
  return runtimes.get(projectId)?.snapshot ?? EMPTY;
}

export function subscribeChatSession(projectId: string, listener: () => void): () => void {
  const runtime = ensure(projectId);
  runtime.listeners.add(listener);
  return () => {
    runtime.listeners.delete(listener);
  };
}

export function stopChatSession(projectId: string) {
  runtimes.get(projectId)?.abort?.abort();
}

export function markChatOnline(projectId: string) {
  const runtime = runtimes.get(projectId);
  if (!runtime) return;
  runtime.snapshot = { ...runtime.snapshot, error: '', offline: false };
  emit(runtime);
}

export function resetChatSessions() {
  for (const runtime of runtimes.values()) runtime.abort?.abort();
  runtimes.clear();
}

export async function sendChatTurn(input: {
  projectId: string;
  chapterNum: number;
  context: string;
  text: string;
  model: string;
  attachments: File[];
  cwd?: string;
  onCandidatesChanged?: () => void;
}): Promise<void> {
  const runtime = ensure(input.projectId);
  if (runtime.snapshot.streaming) return;

  const attached = input.attachments.map((file) => file.name).join(', ');
  const body = attached ? `Attached: ${attached}\n\n${input.text}` : input.text;
  const messages: ChatMessage[] = [
    ...runtime.snapshot.messages,
    { role: 'user', content: body },
    { role: 'assistant', content: '' },
  ];
  runtime.abort = new AbortController();
  runtime.snapshot = {
    messages,
    streaming: true,
    error: '',
    offline: runtime.snapshot.offline,
  };
  emit(runtime);

  let reply = '';
  let failed = false;
  try {
    const wireMessages = toWireMessages(messages.slice(0, -1), input.context, input.cwd);
    for await (const delta of streamChat(wireMessages, runtime.abort.signal, {
      model: input.model,
      ...(input.cwd ? { cwd: input.cwd } : {}),
    })) {
      const current = runtime.snapshot.messages;
      const last = current[current.length - 1];
      if (!last) break;
      const nextLast: ChatMessage = {
        ...last,
        reasoning: delta.reasoning ? `${last.reasoning ?? ''}${delta.reasoning}` : last.reasoning,
        content: delta.content ? last.content + delta.content : last.content,
      };
      if (delta.content) reply += delta.content;
      runtime.snapshot = {
        ...runtime.snapshot,
        messages: [...current.slice(0, -1), nextLast],
      };
      emit(runtime);
    }
  } catch (err) {
    failed = true;
    if ((err as Error).name !== 'AbortError') {
      runtime.snapshot = {
        ...runtime.snapshot,
        error: 'Hermes 离线。请确认本机网关已启动。',
        offline: true,
      };
    }
  } finally {
    runtime.abort = null;
    runtime.snapshot = { ...runtime.snapshot, streaming: false };
    emit(runtime);
  }

  if (!failed) {
    const candidate = extractChapterCandidate(reply, input.chapterNum);
    if (candidate) {
      try {
        await createCandidate(
          {
            runId: hermesSessionId(),
            targetPath: `chapters/ch_${String(input.chapterNum).padStart(2, '0')}.md`,
            source: 'dialog',
            content: candidate,
          },
          input.projectId,
        );
        input.onCandidatesChanged?.();
      } catch {
        runtime.snapshot = { ...runtime.snapshot, error: '候选未能保存。请稍后重试。' };
        emit(runtime);
      }
    }
  }
}
