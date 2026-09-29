import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { GET, POST } from '../src/app/api/ai/prompt/route';
import { buildReportMessages, DEFAULT_REPORT_PROMPT } from '../src/lib/ai/prompt';
import { generateInput } from '../src/lib/ai/validation';

test('prompt settings isolate accounts, reject stale saves, restore defaults and tolerate missing table', async () => {
  const originalFetch = globalThis.fetch;
  const keys = ['COZE_SUPABASE_URL', 'COZE_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'] as const;
  const saved = keys.map(key => process.env[key]);
  process.env.COZE_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://fixture.supabase.co';
  process.env.COZE_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'fixture-anon';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'fixture-service';
  const rows = new Map<string, { user_id: string; prompt: string | null; revision: number }>();
  let missing = false;
  let conflict = false;
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    const headers = new Headers(init?.headers);
    if (url.pathname === '/auth/v1/user') {
      const token = headers.get('authorization');
      return token === 'Bearer a' || token === 'Bearer b' ? Response.json({ id: token.slice(-1) }) : Response.json({ message: 'invalid' }, { status: 401 });
    }
    assert.equal(url.pathname, '/rest/v1/ai_report_prompts');
    assert.equal(headers.get('authorization'), 'Bearer fixture-service');
    if (missing) return Response.json({ code: 'PGRST205' }, { status: 404 });
    const user = url.searchParams.get('user_id')?.slice(3);
    if (!init?.method || init.method === 'GET') return Response.json(user && rows.has(user) ? [rows.get(user)] : []);
    const row = JSON.parse(String(init?.body));
    if (init.method === 'POST') {
      if (rows.has(row.user_id) || conflict) return Response.json({ code: '23505' }, { status: 409 });
      rows.set(row.user_id, row);
      return Response.json([{ user_id: row.user_id }]);
    }
    assert.equal(init.method, 'PATCH');
    if (conflict || !user || url.searchParams.get('revision') !== `eq.${rows.get(user)?.revision}`) return Response.json([]);
    rows.set(user, { ...row, user_id: user });
    return Response.json([{ user_id: user }]);
  };
  const request = (body?: unknown, user = 'a') => new NextRequest('https://fixture.test/api/ai/prompt', { method: body ? 'POST' : 'GET', headers: { Authorization: `Bearer ${user}` }, ...(body ? { body: JSON.stringify(body) } : {}) });
  try {
    assert.equal((await GET(request(undefined, 'forged'))).status, 401);
    assert.equal((await POST(request({ revision: 0, prompt: ' ' }))).status, 400);
    assert.equal((await POST(request({ revision: 0, prompt: 'x'.repeat(12001) }))).status, 400);
    const initial = await (await GET(request())).json();
    assert.equal(initial.prompt, DEFAULT_REPORT_PROMPT);
    assert.equal(initial.revision, 0);
    assert.equal((await POST(request({ revision: 0, prompt: '语气简洁，每段50字。' }))).status, 200);
    assert.equal((await (await GET(request())).json()).prompt, '语气简洁，每段50字。');
    assert.equal((await (await GET(request(undefined, 'b'))).json()).isDefault, true);
    assert.equal((await POST(request({ revision: 0, prompt: '覆盖' }))).status, 409);
    conflict = true;
    assert.equal((await POST(request({ revision: 1, prompt: '并发修改' }))).status, 409);
    conflict = false;
    const restored = await (await POST(request({ revision: 1, prompt: null }))).json();
    assert.equal(restored.isDefault, true);
    assert.equal(restored.prompt, DEFAULT_REPORT_PROMPT);
    missing = true;
    assert.equal((await (await GET(request())).json()).storageReady, false);
    assert.equal((await POST(request({ revision: 0, prompt: '新增' }))).status, 503);
  } finally {
    globalThis.fetch = originalFetch;
    keys.forEach((key, i) => { if (saved[i] === undefined) delete process.env[key]; else process.env[key] = saved[i]; });
  }
});

test('custom writing instructions replace defaults while keeping student context and report output fields', () => {
  const input = generateInput.parse({ studentName: '测试学生', languageName: 'Java', courseUnitName: 'U1', currentStageContent: '变量', radarDimensions: Array.from({ length: 6 }, () => ({ name: '能力', score: 8 })) });
  const messages = buildReportMessages(input, '只用简短句子，不推荐练习平台。');
  assert.ok(messages[0].content.startsWith('只用简短句子'));
  assert.ok(!messages[0].content.includes('ACGO'));
  assert.ok(messages[0].content.includes('improvementPlan3'));
  assert.ok(messages[1].content.includes('测试学生'));
  assert.ok(messages[1].content.includes('Java'));
  assert.ok(messages[1].content.includes('表现优秀'));
});
