export interface ChatMessage { role: 'system' | 'user' | 'assistant'; content: string; reasoning?: string }

export interface ChatDelta { content?: string; reasoning?: string }

const HERMES_URL = '/hermes/v1/chat/completions';
export const DEFAULT_LLM_MODEL = 'hermes-agent';
const DEV_KEY = 'novelora-dev-key';
const SESSION_KEY = 'novelora.hermes.session';

export function hermesSessionId(): string {
  const storage = window.localStorage as Storage | undefined;
  let id = storage?.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    storage?.setItem(SESSION_KEY, id);
  }
  return id;
}

export async function* streamChat(
  messages: ChatMessage[],
  signal: AbortSignal,
  options?: { model?: string; cwd?: string },
): AsyncGenerator<ChatDelta> {
  const response = await fetch(HERMES_URL, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DEV_KEY}`,
      'X-Hermes-Session-Id': hermesSessionId(),
    },
    body: JSON.stringify({
      model: options?.model ?? DEFAULT_LLM_MODEL,
      stream: true,
      messages,
      ...(options?.cwd ? { cwd: options.cwd } : {}),
    }),
  });
  if (!response.ok || !response.body) throw new Error(`Hermes ${response.status}`);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) return;
    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split('\n\n');
    buffer = frames.pop() ?? '';
    for (const frame of frames) {
      const data = frame.replace(/^data: /m, '').trim();
      if (!data || data === '[DONE]') continue;
      const payload = JSON.parse(data) as {
        choices?: Array<{ delta?: { content?: string; reasoning_content?: string } }>;
      };
      const delta = payload.choices?.[0]?.delta;
      const content = delta?.content;
      const reasoning = delta?.reasoning_content;
      if (content || reasoning) yield { content, reasoning };
    }
  }
}
