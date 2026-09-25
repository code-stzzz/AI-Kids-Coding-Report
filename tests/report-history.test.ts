import test from 'node:test';
import assert from 'node:assert/strict';
import { setSupabaseClient } from '../src/lib/data-api';
import { loadReportHistory, historyEditUrl } from '../src/lib/report-history';

test('history loads saved cloud reports with authentication, course details and precise edit links', async () => {
  const originalFetch = globalThis.fetch;
  const requests: string[] = [];
  setSupabaseClient({ getSession: async () => ({ data: { session: { access_token: 'fixture-token' } } }) });
  const fixtures: Record<string, unknown[]> = {
    '/api/reports': [
      { id: 'older', student_id: 'student-1', course_unit_id: 'unit-1', language_id: 'python', created_at: '2026-08-01', student: { name: '测试学生', class_id: 'class-1' }, course_unit: { name: 'U1', period_number: 1, version_id: 'v1', current_stage_content: '基础语法' }, improvement_plan_1: '练习循环' },
      { id: 'newer', student_id: 'student-2', course_unit_id: 'retired-unit', language_id: 'scratch', created_at: '2026-09-01', student: null, course_unit: { name: '已归档单元', period_number: 2, version_id: 'v2', current_stage_content: '动画' } },
    ],
    '/api/classes': [{ id: 'class-1', name: '测试班级', language_id: 'scratch' }],
    '/api/languages': [{ id: 'python', name: 'Python' }, { id: 'scratch', name: 'Scratch' }],
    '/api/courses': [
      { id: 'other', language_id: 'python', version_id: 'other-version', period_number: 2, current_stage_content: '错误版本' },
      { id: 'unit-2', language_id: 'python', version_id: 'v1', period_number: 2, current_stage_content: '下一阶段循环' },
    ],
  };
  globalThis.fetch = async (input, options) => {
    const url = String(input);
    requests.push(url);
    assert.equal(new Headers(options?.headers).get('Authorization'), 'Bearer fixture-token');
    assert.ok(url in fixtures, 'history must use cloud data endpoints');
    return Response.json({ data: fixtures[url] });
  };
  try {
    const result = await loadReportHistory();
    assert.deepEqual(result.reports.map(r => r.id), ['newer', 'older']);
    assert.equal(result.reports[0].course.current_stage_content, '动画');
    const report = result.reports[1];
    assert.equal(report.language?.name, 'Python', 'use saved course language even after a class changes');
    assert.equal(report.class?.name, '测试班级');
    assert.equal(report.course.next_stage_content, '下一阶段循环');
    assert.equal(report.improvement_plan_1, '练习循环');
    assert.equal(historyEditUrl(report), '/reports/generate/student-1?courseUnitId=unit-1&classId=class-1&versionId=v1');
    assert.equal(requests.length, 4);
    globalThis.fetch = async input => String(input) === '/api/reports'
      ? Response.json({ error: '报告读取失败' }, { status: 500 })
      : Response.json({ data: [] });
    await assert.rejects(loadReportHistory(), /报告读取失败/, 'API errors must not look like an empty history');
  } finally {
    globalThis.fetch = originalFetch;
    setSupabaseClient(null);
  }
});
