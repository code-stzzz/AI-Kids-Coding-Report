import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { PATCH } from '../src/app/api/students/status/route';

test('status updates verify authentication, restrict ownership, preserve students and report missing migration', async () => {
  const savedFetch = globalThis.fetch;
  const keys = ['COZE_SUPABASE_URL', 'COZE_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'] as const;
  const saved = keys.map(key => process.env[key]);
  process.env.COZE_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://fixture.supabase.co';
  process.env.COZE_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'fixture-anon';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'fixture-service';
  let validUser = true;
  let missingColumn = false;
  let writes = 0;
  globalThis.fetch = async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (url.pathname === '/auth/v1/user') return Response.json(validUser ? { id: 'owner' } : { message: 'invalid' }, { status: validUser ? 200 : 401 });
    assert.equal(url.pathname, '/rest/v1/students');
    assert.equal(init?.method, 'PATCH');
    assert.equal(url.searchParams.get('user_id'), 'eq.owner');
    writes++;
    if (missingColumn) return Response.json({ code: 'PGRST204', message: 'missing column' }, { status: 400 });
    if (url.searchParams.get('id') === 'eq.foreign') return Response.json({ code: 'PGRST116', details: 'The result contains 0 rows', message: 'Cannot coerce the result to a single JSON object' }, { status: 406 });
    const body = JSON.parse(String(init?.body));
    assert.deepEqual(Object.keys(body).sort(), ['completed_at', 'enrollment_status', 'updated_at']);
    if (body.enrollment_status === 'active') assert.equal(body.completed_at, null);
    else assert.ok(Number.isFinite(Date.parse(body.completed_at)));
    return Response.json({ id: 'student', ...body });
  };
  const request = (status: string, id = 'student', token = 'token') => new NextRequest('https://fixture.test/api/students/status', {
    method: 'PATCH', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: JSON.stringify({ id, status }),
  });
  try {
    assert.equal((await PATCH(request('completed', 'student', ''))).status, 401);
    assert.equal((await PATCH(request('deleted'))).status, 400);
    validUser = false;
    assert.equal((await PATCH(request('completed'))).status, 401);
    assert.equal(writes, 0);
    validUser = true;
    assert.equal((await PATCH(request('completed', 'foreign'))).status, 404);
    assert.equal((await PATCH(request('completed'))).status, 200);
    assert.equal((await PATCH(request('active'))).status, 200);
    missingColumn = true;
    assert.equal((await PATCH(request('completed'))).status, 503);
  } finally {
    globalThis.fetch = savedFetch;
    keys.forEach((key, i) => { if (saved[i] === undefined) delete process.env[key]; else process.env[key] = saved[i]; });
  }
});
