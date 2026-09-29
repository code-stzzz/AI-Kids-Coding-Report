'use client';
import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/data-api';
import { DEFAULT_REPORT_PROMPT } from '@/lib/ai/prompt';
import type { PromptSettings } from '@/lib/ai/prompt-settings';
import { Button } from '@/components/ui/button';

export function ReportPromptSettings() {
  const [settings, setSettings] = useState<PromptSettings | null>(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  async function load() {
    setBusy(true); setError(''); setNotice('');
    try {
      const res = await authFetch('/api/ai/prompt');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '读取失败');
      setSettings(data); setDraft(data.prompt);
    } catch (cause) { setError(cause instanceof Error ? cause.message : '读取失败'); }
    finally { setBusy(false); }
  }
  useEffect(() => { void load(); }, []);
  async function save(prompt: string | null) {
    if (!settings || busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const res = await authFetch('/api/ai/prompt', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, revision: settings.revision }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '保存失败');
      setSettings(data); setDraft(data.prompt);
      setNotice(prompt === null ? '已恢复默认提示词，后续生成将使用默认规则。' : '提示词已保存，后续生成将使用新规则。');
    } catch (cause) { setError(cause instanceof Error ? cause.message : '保存失败'); }
    finally { setBusy(false); }
  }
  const dirty = settings && draft !== settings.prompt;
  return <section className="mb-6 rounded-2xl border bg-white p-6 space-y-4">
    <div><h2 className="text-lg font-semibold">报告生成提示词</h2>
      <p className="text-sm text-slate-500 mt-1">设置语气、篇幅、各段要求和学习建议。仅作用于当前账号，对扣子和自定义 AI 接口都生效，已保存的报告不变。</p></div>
    <p className="text-sm text-slate-500">学生姓名、课程内容、六维能力评价和教师填写的进步点等会自动带入，无需在这里填写学生资料。报告结构由系统保留。</p>
    {settings && <p className="text-sm">{settings.isDefault ? '当前使用默认提示词' : '当前使用自定义提示词'}{dirty ? ' · 有未保存修改' : ''}</p>}
    {settings && !settings.storageReady && <p role="alert" className="text-amber-700">当前使用默认提示词。保存自定义配置前，需要管理员执行提示词数据库初始化脚本。</p>}
    <label className="block text-sm font-medium" htmlFor="report-prompt">写作要求</label>
    <textarea id="report-prompt" rows={15} maxLength={12000} disabled={busy || !settings} value={draft} onChange={e => { setDraft(e.target.value); setNotice(''); }} className="w-full border rounded-xl p-3 text-sm leading-6 disabled:bg-slate-50" />
    <p className="text-xs text-slate-500">{draft.length} / 12000 字符</p>
    {error && <p role="alert" className="text-red-600 text-sm">{error}</p>}
    {notice && <p role="status" className="text-green-700 text-sm">{notice}</p>}
    <div className="flex flex-wrap gap-3">
      <Button disabled={busy || !settings?.storageReady || !draft.trim() || !dirty} onClick={() => save(draft.trim())}>{busy ? '处理中…' : '保存提示词'}</Button>
      <Button variant="outline" disabled={busy || !settings?.storageReady} onClick={() => { if (confirm('恢复系统默认提示词？当前自定义内容和未保存修改将被替换。')) void save(null); }}>恢复默认</Button>
      <Button variant="outline" disabled={busy} onClick={() => { if (!dirty || confirm('重新加载会放弃未保存的修改，是否继续？')) void load(); }}>重新加载</Button>
    </div>
    <details className="text-sm text-slate-600"><summary className="cursor-pointer">查看默认提示词</summary><pre className="mt-3 whitespace-pre-wrap font-sans leading-6">{DEFAULT_REPORT_PROMPT}</pre></details>
  </section>;
}
