'use client';
import { useState } from 'react';
import { setStudentStatus, type Student } from '@/lib/data-api';

export function StudentStatusButton({ student, onChanged }: { student: Student; onChanged: (student: Student) => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const completed = student.enrollment_status === 'completed';
  return <div className="text-sm">
    <span className={completed ? 'text-gray-500' : 'text-green-700'}>{completed ? '已结课' : '在读'}</span>
    <button type="button" disabled={saving} className="ml-2 text-blue-600 disabled:opacity-50" onClick={async () => {
      setSaving(true); setError('');
      try { onChanged(await setStudentStatus(student.id, completed ? 'active' : 'completed')); }
      catch (cause) { setError(cause instanceof Error ? cause.message : '更新失败'); }
      finally { setSaving(false); }
    }}>{saving ? '保存中…' : completed ? '恢复在读' : '标记结课'}</button>
    {error && <p role="alert" className="text-red-600 max-w-xs">{error}</p>}
  </div>;
}
