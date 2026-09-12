import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_LLM_MODEL, createChatUpstream, listLlmModels } from './deepseek.ts';

describe('DeepSeek proxy helpers', () => {
  it('lists models from DeepSeek with the configured key', async () => {
    const fetchImpl = (async (url: string | URL, init?: RequestInit) => {
      assert.equal(String(url), 'https://api.deepseek.com/models');
      const headers = new Headers(init?.headers);
      assert.equal(headers.get('Authorization'), 'Bearer test-key');
      return new Response(JSON.stringify({
        object: 'list',
        data: [
          { id: 'deepseek-v4-flash', object: 'model', owned_by: 'deepseek' },
          { id: 'deepseek-v4-pro', object: 'model', owned_by: 'deepseek' },
        ],
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }) as typeof fetch;

    const listed = await listLlmModels({
      apiKey: 'test-key',
      baseUrl: 'https://api.deepseek.com',
      fetchImpl,
    });
    assert.equal(DEFAULT_LLM_MODEL, 'deepseek-v4-flash');
    assert.deepEqual(listed.data.map((row) => row.id), ['deepseek-v4-flash', 'deepseek-v4-pro']);
  });

  it('posts a streaming chat request with the default model when none is given', async () => {
    const fetchImpl = (async (url: string | URL, init?: RequestInit) => {
      assert.equal(String(url), 'https://api.deepseek.com/chat/completions');
      const body = JSON.parse(String(init?.body));
      assert.equal(body.model, 'deepseek-v4-flash');
      assert.equal(body.stream, true);
      assert.deepEqual(body.messages, [{ role: 'user', content: 'hi' }]);
      return new Response('data: {"choices":[{"delta":{"content":"ok"}}]}\n\n', {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      });
    }) as typeof fetch;

    const upstream = await createChatUpstream(
      { apiKey: 'test-key', baseUrl: 'https://api.deepseek.com', fetchImpl },
      { messages: [{ role: 'user', content: 'hi' }] },
    );
    assert.equal(upstream.status, 200);
    assert.equal(await upstream.text(), 'data: {"choices":[{"delta":{"content":"ok"}}]}\n\n');
  });
});
