'use client';

import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { createLanguage, type ProgrammingLanguage } from '@/lib/data-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function AddLanguage({ onCreated }: { onCreated: (language: ProgrammingLanguage) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  return (
    <div className="mb-5">
      <Button variant="outline" onClick={() => { setOpen(!open); setError(''); }} disabled={saving} aria-expanded={open} aria-controls="add-language-form">
        <Plus className="w-4 h-4 mr-2" />添加编程语言
      </Button>
      {open && (
        <form id="add-language-form" className="mt-3 rounded-xl border bg-gray-50 p-4 space-y-3" onSubmit={async event => {
          event.preventDefault();
          if (saving || !name.trim()) return;
          setSaving(true);
          setError('');
          try {
            const language = await createLanguage(name.trim());
            onCreated(language);
            setName('');
            setOpen(false);
          } catch (cause) {
            setError(cause instanceof Error ? cause.message : '添加失败，请稍后重试。');
          } finally { setSaving(false); }
        }}>
          <Label htmlFor="new-language-name">语言名称</Label>
          <Input id="new-language-name" autoFocus required maxLength={100} placeholder="例如：Java、JavaScript、机器人编程" value={name} onChange={event => setName(event.target.value)} disabled={saving} />
          <p className="text-sm text-gray-500">新增语言将出现在所有账号的语言列表中。添加后，请为它创建课程版本和课程单元。</p>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={saving || !name.trim()}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{saving ? '正在添加…' : '确认添加'}</Button>
            <Button type="button" variant="outline" disabled={saving} onClick={() => { setOpen(false); setError(''); }}>取消</Button>
          </div>
        </form>
      )}
    </div>
  );
}
