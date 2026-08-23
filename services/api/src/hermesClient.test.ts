import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { callHermes, HermesFailure } from './hermesClient.ts';

const okFetch = (content: string) =>
  (async () =>
    new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })) as typeof fetch;

describe('hermesClient', () => {
  it('returns the first choice content on success', async () => {
    const reply = await callHermes(okFetch('正文'), 'hermes-agent', [{ role: 'user', content: 'hi' }]);
    assert.equal(reply, '正文');
  });

  it('sends model, bearer key, and stream:false to /v1/chat/completions', async () => {
    let capturedUrl = '';
    let capturedInit: RequestInit | undefined;
    const spyFetch = (async (url: unknown, init?: RequestInit) => {
      capturedUrl = String(url);
      capturedInit = init;
      return new Response(JSON.stringify({ choices: [{ message: { content: 'x' } }] }), { status: 200 });
    }) as typeof fetch;
    await callHermes(spyFetch, 'strong-model', [{ role: 'user', content: 'hi' }]);
    assert.match(capturedUrl, /\/v1\/chat\/completions$/);
    const headers = capturedInit?.headers as Record<string, string>;
    assert.equal(headers.Authorization, 'Bearer novelora-dev-key');
    const body = JSON.parse(String(capturedInit?.body)) as { model: string; stream: boolean };
    assert.equal(body.model, 'strong-model');
    assert.equal(body.stream, false);
  });

  it('throws HermesFailure on non-200', async () => {
    const badFetch = (async () => new Response('nope', { status: 502 })) as typeof fetch;
    await assert.rejects(
      callHermes(badFetch, 'hermes-agent', []),
      (err: unknown) => err instanceof HermesFailure,
    );
  });

  it('throws HermesFailure when fetch rejects', async () => {
    const deadFetch = (async () => { throw new Error('ECONNREFUSED'); }) as typeof fetch;
    await assert.rejects(
      callHermes(deadFetch, 'hermes-agent', []),
      (err: unknown) => err instanceof HermesFailure,
    );
  });
});
