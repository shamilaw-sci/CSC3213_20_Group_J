import { test } from 'node:test';
import assert from 'node:assert/strict';
import { callGeminiChat, GEMINI_MODEL } from '../../src/features/assistant/api/geminiApi.js';

test('Gemini uses a configurable model, key header, and current catalog facts', async t => {
  let request;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    request = { url, ...options, body: JSON.parse(options.body) };
    return { ok: true, json: async () => ({ candidates: [{ content: { parts: [
      { thought: true, text: 'Internal reasoning' }, { text: 'Available ' }, { text: 'headphones.' },
    ] } }] }) };
  });
  const reply = await callGeminiChat('Headphones?', ' test-key ', [
    { id: 'welcome_123', sender: 'bot', text: 'Welcome' },
    { id: 'usr_1', sender: 'user', text: 'Hello' },
    { id: 'bot_err_2', sender: 'bot', text: 'Temporary failure' },
  ], {
    reply: 'Current catalog result',
    products: [{ id: 9, name: 'Test headphones', price: 2500, availableStock: 4,
      category: { name: 'Audio' }, costPrice: 1000 }],
  }, 'gemini-evaluation-model');
  assert.equal(reply, 'Available headphones.');
  assert.equal(request.url, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-evaluation-model:generateContent');
  assert.equal(request.headers['x-goog-api-key'], 'test-key');
  assert.equal(request.url.includes('test-key'), false);
  assert.deepEqual(request.body.contents.map(turn => turn.parts[0].text), ['Hello', 'Headphones?']);
  assert.match(request.body.systemInstruction.parts[0].text, /Test headphones/);
  assert.match(request.body.systemInstruction.parts[0].text, /2500/);
  assert.doesNotMatch(request.body.systemInstruction.parts[0].text, /costPrice/);
  assert.notEqual(GEMINI_MODEL, 'gemini-1.5-flash');
});

test('missing keys and invalid model paths fail without sending a request', async t => {
  const request = t.mock.method(globalThis, 'fetch', async () => { throw new Error('Unexpected request'); });
  await assert.rejects(callGeminiChat('Hello', ''), /Add a Gemini API key/);
  await assert.rejects(callGeminiChat('Hello', 'key', [], null, '../other?key=secret'), /model name is invalid/);
  assert.equal(request.mock.callCount(), 0);
});

test('provider failures give useful messages without reflecting a key or raw response', async t => {
  let status = 403;
  t.mock.method(globalThis, 'fetch', async () => ({
    ok: false, status, json: async () => ({ error: { message: 'private-key-in-provider-response' } }),
  }));
  for (const [code, message] of [[403, /rejected/], [404, /model is unavailable/], [429, /usage limit/], [500, /temporarily unavailable/]]) {
    status = code;
    await assert.rejects(callGeminiChat('Hello', 'private-key'), error => {
      assert.match(error.message, message);
      assert.doesNotMatch(error.message, /private-key/);
      return true;
    });
  }
});

test('a blocked or empty response cannot be mistaken for a successful answer', async t => {
  t.mock.method(globalThis, 'fetch', async () => ({ ok: true, json: async () => ({ promptFeedback: { blockReason: 'SAFETY' } }) }));
  await assert.rejects(callGeminiChat('Hello', 'key'), /returned no answer/);
});

test('a stalled request times out so the built-in assistant can take over', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  t.mock.method(globalThis, 'fetch', async (_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
  }));
  const pending = callGeminiChat('Hello', 'key');
  const rejection = assert.rejects(pending, /took too long/);
  t.mock.timers.tick(25_000);
  await rejection;
});
