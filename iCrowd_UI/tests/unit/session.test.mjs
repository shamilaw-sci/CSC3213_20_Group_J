import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clearSession, sessionToken, setSessionToken } from '../../src/lib/session.js';

test('an old failed request cannot clear a newer login', () => {
  let token = 'new-token'; let cleared = false; let events = 0;
  globalThis.localStorage = { getItem: () => token, removeItem: () => { token = null; } };
  globalThis.sessionStorage = { clear: () => { cleared = true; } };
  globalThis.window = { dispatchEvent: () => { events++; } };
  setSessionToken('new-token'); clearSession('old-token');
  assert.equal(sessionToken(), 'new-token'); assert.equal(token, 'new-token');
  assert.equal(cleared, false); assert.equal(events, 0);
  clearSession('new-token');
  assert.equal(sessionToken(), null); assert.equal(token, null);
  assert.equal(cleared, true); assert.equal(events, 1);
});
