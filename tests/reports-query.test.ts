import assert from 'node:assert/strict';
import { test } from 'node:test';
import { NextRequest } from 'next/server';
import { GET } from '../src/app/api/reports/route';

test('report query works without the optional next_stage_content column', async () => {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://fixture.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'fixture-service-key';
  let requested = false;
  globalThis.fetch = async input => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    requested = true;
    assert.equal(url.searchParams.get('user_id'), 'eq.fixture-user');
    const select = url.searchParams.get('select') || '';
    if (select.includes('next_stage_content')) {
      return Response.json({ code: '42703', message: 'column does not exist' }, { status: 400 });
    }
    return Response.json([{ id: 'saved-report', course_unit: { name: 'U1' } }]);
  };
  try {
    const token = `fixture.${Buffer.from(JSON.stringify({ sub: 'fixture-user' })).toString('base64url')}.fixture`;
    const response = await GET(new NextRequest('https://fixture.test/api/reports', {
      headers: { Authorization: `Bearer ${token}` },
    }));
    assert.equal(requested, true);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).data[0].id, 'saved-report');
  } finally {
    globalThis.fetch = originalFetch;
    if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    if (originalKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey;
  }
});
