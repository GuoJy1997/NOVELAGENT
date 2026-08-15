export interface ChatMessage { role: 'user' | 'assistant'; content: string }

const HERMES_URL = '/hermes/v1/chat/completions';
const DEV_KEY = 'novelora-dev-key';
const SESSION_KEY = 'novelora.hermes.session';

function sessionId(): string {
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
  options?: { model?: string },
): AsyncGenerator<string> {
  const response = await fetch(HERMES_URL, {
    method: 'POST',
    signal,
    headers: {
      Authorization: `Bearer ${DEV_KEY}`,
      'Content-Type': 'application/json',
      'X-Hermes-Session-Id': sessionId(),
    },
    body: JSON.stringify({ model: options?.model ?? 'hermes-agent', stream: true, messages }),
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
      const payload = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string } }> };
      const delta = payload.choices?.[0]?.delta?.content;
      if (delta) yield delta;
    }
  }
}
