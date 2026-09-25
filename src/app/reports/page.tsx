'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  FileText,
  Loader2,
  Calendar,
  ChevronRight,
  Eye,
  Plus
} from 'lucide-react';
import { type ProgrammingLanguage, type Class } from '@/lib/data-api';
import { loadReportHistory, historyEditUrl, type HistoryReport } from '@/lib/report-history';
import { useUser } from '@/components/providers/UserProvider';
import { PosterGenerator } from '@/components/PosterGenerator';

export default function ReportsPage() {
  const [reports, setReports] = useState<HistoryReport[]>([]);
  const [languages, setLanguages] = useState<ProgrammingLanguage[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const { user, loading: userLoading } = useUser();
  const userId = user?.id;
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [previewReport, setPreviewReport] = useState<HistoryReport | null>(null);
  useEffect(() => {
    let cancelled = false;
    setReports([]);
    setPreviewReport(null);
    setError(null);
    setLoading(true);
    if (userLoading) return;
    if (!userId) {
      setLoading(false);
      return;
    }
    loadReportHistory().then(data => {
      if (cancelled) return;
      setReports(data.reports);
      setClasses(data.classes);
      setLanguages(data.languages);
      setSelectedLanguage('');
      setSelectedClass('');
    }).catch((cause: unknown) => {
      if (!cancelled) setError(cause instanceof Error && !(cause instanceof TypeError)
        ? cause.message
        : '无法连接报告服务，请检查网络后重试。');
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [userLoading, userId, retry]);

  const filteredReports = reports.filter(r => {
    if (selectedLanguage && r.language?.id !== selectedLanguage) return false;
    if (selectedClass && r.class?.id !== selectedClass) return false;
    return true;
  });

  const filteredClasses = classes.filter(c => !selectedLanguage || c.language_id === selectedLanguage);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '未知日期';
    return new Date(dateStr).toLocaleDateString('zh-CN');
  };

  if (loading || userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/" 
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">历史报告</h1>
                <p className="text-sm text-gray-500">
                  共 {filteredReports.length} 份学习报告
                </p>
              </div>
            </div>
            
            <Link
              href="/reports/generate"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              批量生成报告
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                编程语言
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => {
                  setSelectedLanguage(e.target.value);
                  setSelectedClass('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">全部</option>
                {languages.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                班级
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">全部</option>
                {filteredClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Report List */}
        {!user ? (
          <div className="bg-white rounded-2xl border p-12 text-center">
            <p className="mb-4">请先登录后查看你的历史报告。</p>
            <Link href="/auth" className="text-blue-600">前往登录</Link>
          </div>
        ) : error ? (
          <div role="alert" className="bg-white rounded-2xl border p-12 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button onClick={() => setRetry(value => value + 1)} className="text-blue-600">重新加载</button>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无学习报告</h3>
            <p className="text-gray-500 mb-4">
              {reports.length ? '当前筛选条件下没有报告，请切换语言或班级。' : '保存学习报告后，会在这里显示。'}
            </p>
            <Link
              href="/"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              返回首页
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                className="bg-white rounded-2xl shadow-sm border hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                        {report.student?.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {report.student?.name || '未知学生'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {report.language?.name} · {report.class?.name} · {report.course.name}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <Calendar className="w-4 h-4" />
                        {formatDate(report.created_at)}
                      </div>
                      <button
                        onClick={() => setPreviewReport(report)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        预览
                      </button>
                      <Link
                        href={historyEditUrl(report)}
                        className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <ChevronRight className="w-4 h-4" />
                        编辑
                      </Link>
                    </div>
                  </div>

                  {/* Preview of key content */}
                  <div className="mt-4 grid md:grid-cols-3 gap-4">
                    {report.progress_description && (
                      <div className="bg-green-50 rounded-xl p-3">
                        <div className="text-xs font-medium text-green-700 mb-1">进步表现</div>
                        <p className="text-sm text-green-800 line-clamp-2">
                          {report.progress_description}
                        </p>
                      </div>
                    )}
                    {report.improvement_description && (
                      <div className="bg-amber-50 rounded-xl p-3">
                        <div className="text-xs font-medium text-amber-700 mb-1">待提升</div>
                        <p className="text-sm text-amber-800 line-clamp-2">
                          {report.improvement_description}
                        </p>
                      </div>
                    )}
                    {report.encouragement_message && (
                      <div className="bg-orange-50 rounded-xl p-3">
                        <div className="text-xs font-medium text-orange-700 mb-1">鼓励寄语</div>
                        <p className="text-sm text-orange-800 line-clamp-2">
                          {report.encouragement_message}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Radar Scores */}
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-xs text-gray-500">能力评分：</span>
                    {report.radar_dimensions.slice(0, 4).map((dim, i) => (
                      <span key={i} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        {dim.name}: {dim.score}
                      </span>
                    ))}
                    {report.radar_dimensions.length > 4 && (
                      <span className="text-xs text-gray-500">
                        +{report.radar_dimensions.length - 4}项
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Preview Modal */}
      {previewReport && (
        <PosterGenerator
          data={{
            studentName: previewReport.student?.name || '',
            languageName: previewReport.language?.name || '',
            courseUnitName: previewReport.course.name,
            radarDimensions: previewReport.radar_dimensions,
            currentStageContent: previewReport.course.current_stage_content,
            nextStageContent: previewReport.course.next_stage_content,
            coreStrengths: previewReport.core_strengths,
            areasToImprove: previewReport.areas_to_improve,
            progressDescription: previewReport.progress_description || '',
            improvementDescription: previewReport.improvement_description || '',
            encouragementMessage: previewReport.encouragement_message || '',
            improvementPlan1: previewReport.improvement_plan_1 || '',
            improvementPlan2: previewReport.improvement_plan_2 || '',
            improvementPlan3: previewReport.improvement_plan_3 || '',
            competitionPlans: previewReport.competition_plans || '',
            generatedAt: formatDate(previewReport.created_at)
          }}
          onClose={() => setPreviewReport(null)}
        />
      )}
    </div>
  );
}
