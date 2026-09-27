import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { POST } from '../src/app/api/languages/route';

test('adding languages validates login, names, duplicates and persists new languages', async () => {
  const originalFetch = globalThis.fetch;
  const keys = ['COZE_SUPABASE_URL', 'COZE_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'] as const;
  const saved = keys.map(key => process.env[key]);
  process.env.COZE_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://fixture.supabase.co';
  process.env.COZE_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'fixture-anon';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'fixture-service';
  const languages = [{ id: 'python', name: 'Python' }];
  let authenticated = true;
  let writes = 0;
  globalThis.fetch = async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (url.pathname === '/auth/v1/user') return Response.json(authenticated ? { id: 'fixture-user' } : { message: 'Invalid token' }, { status: authenticated ? 200 : 401 });
    assert.equal(url.pathname, '/rest/v1/programming_languages');
    if (init?.method === 'POST') {
      writes++;
      const row = JSON.parse(String(init.body));
      assert.deepEqual(Object.keys(row).sort(), ['id', 'name']);
      languages.push(row);
      return Response.json(row, { status: 201 });
    }
    return Response.json(languages);
  };
  const request = (name: unknown, token = 'fixture-token') => new NextRequest('https://fixture.test/api/languages', {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ name }),
  });
  try {
    assert.equal((await POST(request('Java', ''))).status, 401);
    for (const name of ['', '   ', 'x'.repeat(101), {}, 'Java\nScript']) assert.equal((await POST(request(name))).status, 400);
    authenticated = false;
    assert.equal((await POST(request('Java'))).status, 401);
    assert.equal(writes, 0);
    authenticated = true;
    assert.equal((await POST(request(' python '))).status, 409);
    const response = await POST(request(' JavaScript '));
    assert.equal(response.status, 201);
    const { data } = await response.json();
    assert.equal(data.name, 'JavaScript');
    assert.match(data.id, /^[0-9a-f-]{36}$/);
    assert.equal((await POST(request('javascript'))).status, 409);
    assert.equal(writes, 1);
  } finally {
    globalThis.fetch = originalFetch;
    keys.forEach((key, index) => { if (saved[index] === undefined) delete process.env[key]; else process.env[key] = saved[index]; });
  }
});
