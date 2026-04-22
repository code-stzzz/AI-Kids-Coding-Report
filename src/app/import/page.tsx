'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export default function ImportPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError('请先登录');
        setLoading(false);
        return;
      }

      const token = session.access_token;

      // 读取数据文件
      const response = await fetch('/migration_data.json');
      if (!response.ok) {
        throw new Error('无法读取迁移数据文件');
      }
      const data = await response.json();

      // 调用导入 API
      const importResponse = await fetch('/api/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      const importResult = await importResponse.json();
      setResult(importResult);
    } catch (err: any) {
      setError(err.message || '导入失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">数据导入</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">导入内容</h2>
          <ul className="text-gray-600 space-y-2">
            <li>• 班级数据：<strong>6 个</strong></li>
            <li>• 学生数据：<strong>33 个</strong></li>
            <li>• 学习报告：<strong>24 条</strong></li>
          </ul>
        </div>

        <button
          onClick={handleImport}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? '导入中...' : '开始导入'}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="font-semibold mb-2">导入结果</h3>
            <pre className="text-sm text-gray-700 whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        {result?.success && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-700 mb-2">统计</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {result.results.classes.success}
                </p>
                <p className="text-sm text-gray-600">班级</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {result.results.students.success}
                </p>
                <p className="text-sm text-gray-600">学生</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {result.results.reports.success}
                </p>
                <p className="text-sm text-gray-600">报告</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
