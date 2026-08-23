export class HermesFailure extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HermesFailure';
  }
}

const HERMES_URL = process.env.HERMES_URL ?? 'http://127.0.0.1:8642';
const HERMES_KEY = 'novelora-dev-key';

export async function callHermes(
  hermesFetch: typeof fetch,
  model: string,
  messages: Array<{ role: string; content: string }>,
): Promise<string> {
  try {
    const res = await hermesFetch(`${HERMES_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HERMES_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, stream: false, messages }),
    });
    if (!res.ok) throw new Error(`hermes ${res.status}`);
    const data = await res.json() as { choices?: Array<{ message?: { content?: unknown } }> };
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== 'string') throw new Error('hermes empty');
    return content;
  } catch (err) {
    if (err instanceof HermesFailure) throw err;
    throw new HermesFailure(err instanceof Error ? err.message : 'hermes failed');
  }
}
