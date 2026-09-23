'use client';
import { authFetch } from '@/lib/data-api';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Save,
  Sparkles,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle,
  Eye,
  RefreshCw,
  BookOpen,
  GitBranch,
  GraduationCap
} from 'lucide-react';
import { 
  getLanguages,
  getVersions,
  getCourseUnits,
  getReports,
  createReport,
  updateReport,
  getClassById,
  getStudentById,
  ProgrammingLanguage,
  Class,
  Student,
  CourseUnit,
  StudyReport,
  RadarDimension,
  CurriculumVersion
} from '@/lib/data-api';
import { RadarChart } from '@/components/RadarChart';
import { PosterGenerator } from '@/components/PosterGenerator';

const RADAR_DIMENSION_NAMES = [
  "代码逻辑掌握",
  "语法规范运用",
  "问题排查解决",
  "课堂专注参与",
  "创意拓展实现",
  "知识点复用能力"
];

interface PageParams {
  studentId: string;
}

export default function ReportEditorPage({ params }: { params: Promise<PageParams> }) {
  const resolvedParams = use(params);
  const { studentId } = resolvedParams;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showPoster, setShowPoster] = useState(false);
  const [generatingError, setGeneratingError] = useState<string | null>(null);
  
  // Data
  const [student, setStudent] = useState<Student | null>(null);
  const [classInfo, setClassInfo] = useState<Class | null>(null);
  const [languages, setLanguages] = useState<ProgrammingLanguage[]>([]);
  const [versions, setVersions] = useState<CurriculumVersion[]>([]);
  const [courseUnits, setCourseUnits] = useState<CourseUnit[]>([]);
  const [currentReport, setCurrentReport] = useState<StudyReport | null>(null);
  
  // Selection State
  const [selectedLanguageId, setSelectedLanguageId] = useState<string>('');
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');
  const [selectedCourseUnitId, setSelectedCourseUnitId] = useState<string>('');
  
  // Form State
  const [radarDimensions, setRadarDimensions] = useState<RadarDimension[]>(
    RADAR_DIMENSION_NAMES.map(name => ({ name, score: 7 }))
  );
  const [coreStrengths, setCoreStrengths] = useState('');
  const [areasToImprove, setAreasToImprove] = useState('');
  const [progressDescription, setProgressDescription] = useState('');
  const [improvementDescription, setImprovementDescription] = useState('');
  const [encouragementMessage, setEncouragementMessage] = useState('');

  // Computed values
  const selectedLanguage = languages.find(l => l.id === selectedLanguageId);
  const selectedCourseUnit = courseUnits.find(c => c.id === selectedCourseUnitId);

  useEffect(() => {
    loadInitialData();
  }, [studentId]);

  // 加载版本列表（当语言变化时）
  useEffect(() => {
    if (selectedLanguageId) {
      loadVersions(selectedLanguageId);
    }
  }, [selectedLanguageId]);

  // 加载课程单元（当版本变化时）
  useEffect(() => {
    if (selectedVersionId) {
      loadCourseUnits(selectedVersionId);
    }
  }, [selectedVersionId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load student info
      let studentData: Student | null;
      try {
        studentData = await getStudentById(studentId);
        if (!studentData) {
          throw new Error('学生不存在');
        }
      } catch {
        console.error('学生不存在:', studentId);
        window.location.href = '/reports';
        return;
      }
      setStudent(studentData);
      
      // Load class info
      let classData: Class | null;
      try {
        classData = await getClassById(studentData.class_id);
        if (!classData) {
          throw new Error('班级不存在');
        }
      } catch {
        console.error('班级不存在:', studentData.class_id);
        setLoading(false);
        return;
      }
      setClassInfo(classData);
      
      // Load all languages
      const languageData = await getLanguages();
      setLanguages(languageData);
      
      // Set default language from class
      if (classData.language_id) {
        setSelectedLanguageId(classData.language_id);
      }
      
      // Load existing reports
      const existingReports = await getReports({ studentId });
      if (existingReports.length > 0) {
        const latest = existingReports[0];
        setCurrentReport(latest);
        setSelectedCourseUnitId(latest.course_unit_id);
        setRadarDimensions(latest.radar_dimensions);
        setCoreStrengths(latest.core_strengths);
        setAreasToImprove(latest.areas_to_improve);
        setProgressDescription(latest.progress_description || '');
        setImprovementDescription(latest.improvement_description || '');
        setEncouragementMessage(latest.encouragement_message || '');
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVersions = async (languageId: string) => {
    try {
      const versionData = await getVersions(languageId);
      setVersions(versionData);
      
      // 默认选择第一个版本
      if (versionData.length > 0) {
        // 如果班级有默认版本，优先使用
        if (classInfo?.default_version_id) {
          const classVersion = versionData.find(v => v.id === classInfo.default_version_id);
          if (classVersion) {
            setSelectedVersionId(classVersion.id);
          } else {
            setSelectedVersionId(versionData[0].id);
          }
        } else {
          setSelectedVersionId(versionData[0].id);
        }
      } else {
        setSelectedVersionId('');
        setCourseUnits([]);
      }
    } catch (error) {
      console.error('加载版本失败:', error);
    }
  };

  const loadCourseUnits = async (versionId: string) => {
    try {
      const courseData = await getCourseUnits({ versionId });
      setCourseUnits(courseData);
      
      // 如果没有已保存的课程单元，默认选择第一个
      if (!currentReport && courseData.length > 0) {
        setSelectedCourseUnitId(courseData[0].id);
      }
    } catch (error) {
      console.error('加载课程单元失败:', error);
    }
  };

  const handleDimensionChange = (index: number, score: number) => {
    const newDimensions = [...radarDimensions];
    newDimensions[index] = { ...newDimensions[index], score };
    setRadarDimensions(newDimensions);
  };

  const handleGenerateWithAI = async () => {
    if (!selectedCourseUnit || !selectedLanguage) {
      alert('请先选择课程单元');
      return;
    }

    setGenerating(true);
    setGeneratingError(null);
    
    try {
      const response = await authFetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          languageName: selectedLanguage.name,
          courseUnitName: selectedCourseUnit.name,
          currentStageContent: selectedCourseUnit.current_stage_content,
          nextStageContent: selectedCourseUnit.next_stage_content,
          radarDimensions,
          coreStrengths,
          areasToImprove,
          studentName: student?.name || ''
        })
      });

      if (!response.ok) {
        throw new Error('AI生成失败');
      }

      const result = await response.json();
      
      if (result.progressDescription) {
        setProgressDescription(result.progressDescription);
      }
      if (result.improvementDescription) {
        setImprovementDescription(result.improvementDescription);
      }
      if (result.encouragementMessage) {
        setEncouragementMessage(result.encouragementMessage);
      }
    } catch (error) {
      console.error('AI生成失败:', error);
      setGeneratingError('AI生成失败，请重试');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveReport = async () => {
    if (!selectedCourseUnit || !selectedLanguage) {
      alert('请先选择课程单元');
      return;
    }

    setSaving(true);
    try {
      const reportData = {
        student_id: studentId,
        course_unit_id: selectedCourseUnitId,
        radar_dimensions: radarDimensions,
        core_strengths: coreStrengths,
        areas_to_improve: areasToImprove,
        progress_description: progressDescription,
        improvement_description: improvementDescription,
        encouragement_message: encouragementMessage
      };

      if (currentReport) {
        await updateReport({
          id: currentReport.id,
          ...reportData
        });
      } else {
        await createReport(reportData);
      }
      
      alert('保存成功');
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!student || !classInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">数据加载失败</h2>
          <Link href="/" className="text-blue-600 hover:underline">
            返回首页
          </Link>
        </div>
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
                <h1 className="text-xl font-bold text-gray-900">
                  学习报告编辑 - {student.name}
                </h1>
                <p className="text-sm text-gray-500">
                  {classInfo.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowPoster(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                预览海报
              </button>
              <button
                onClick={handleSaveReport}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                <Save className="w-4 h-4" />
                保存报告
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Step 1: 选择班级和课程单元 */}
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  1
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  选择编程语言和课程单元
                </h2>
              </div>
              
              <div className="space-y-4">
                {/* 编程语言选择 */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <GraduationCap className="w-4 h-4 text-gray-400" />
                    编程语言
                  </label>
                  <select
                    value={selectedLanguageId}
                    onChange={(e) => setSelectedLanguageId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="">请选择编程语言...</option>
                    {languages.map((lang) => (
                      <option key={lang.id} value={lang.id}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 版本选择 */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <GitBranch className="w-4 h-4 text-gray-400" />
                    课程版本
                  </label>
                  <select
                    value={selectedVersionId}
                    onChange={(e) => setSelectedVersionId(e.target.value)}
                    disabled={!selectedLanguageId || versions.length === 0}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    <option value="">请选择课程版本...</option>
                    {versions.map((version) => (
                      <option key={version.id} value={version.id}>
                        {version.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 课程单元选择 */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <BookOpen className="w-4 h-4 text-gray-400" />
                    课程单元
                  </label>
                  <select
                    value={selectedCourseUnitId}
                    onChange={(e) => setSelectedCourseUnitId(e.target.value)}
                    disabled={!selectedVersionId || courseUnits.length === 0}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    <option value="">请选择课程单元...</option>
                    {courseUnits.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        第{unit.period_number}期 · {unit.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {selectedCourseUnit && (
                <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                  <div className="text-sm font-medium text-blue-800 mb-2">
                    本阶段学习内容
                  </div>
                  <p className="text-sm text-blue-700 whitespace-pre-wrap">
                    {selectedCourseUnit.current_stage_content}
                  </p>
                </div>
              )}
            </div>

            {/* Radar Chart */}
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  2
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  能力雷达图评分
                </h2>
              </div>
              
              <div className="flex flex-col items-center">
                <RadarChart
                  dimensions={radarDimensions}
                  onDimensionChange={handleDimensionChange}
                  size={320}
                />
              </div>

              {/* Manual Score Input */}
              <div className="grid grid-cols-2 gap-3 mt-6">
                {radarDimensions.map((dim, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 w-28 truncate">
                      {dim.name}
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={dim.score}
                      onChange={(e) => handleDimensionChange(i, parseInt(e.target.value))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={dim.score}
                      onChange={(e) => handleDimensionChange(i, Math.max(0, Math.min(10, parseInt(e.target.value) || 0)))}
                      className="w-14 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Core Info */}
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  3
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  核心信息
                </h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    核心进步点
                  </label>
                  <textarea
                    value={coreStrengths}
                    onChange={(e) => setCoreStrengths(e.target.value)}
                    placeholder="描述学生在本阶段的主要进步..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    待提升点
                  </label>
                  <textarea
                    value={areasToImprove}
                    onChange={(e) => setAreasToImprove(e.target.value)}
                    placeholder="描述需要改进的方面..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* AI Generation */}
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  4
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  AI 智能生成
                </h2>
                <button
                  onClick={handleGenerateWithAI}
                  disabled={generating || !selectedCourseUnit}
                  className="ml-auto px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      一键生成文案
                    </>
                  )}
                </button>
              </div>
              
              {generatingError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 inline mr-2" />
                  {generatingError}
                </div>
              )}
              
              <p className="text-sm text-gray-500 mb-4">
                AI将根据课程内容、雷达图评分和您的输入，自动生成专属文案
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    进步表现描述
                  </label>
                  <textarea
                    value={progressDescription}
                    onChange={(e) => setProgressDescription(e.target.value)}
                    placeholder="AI将自动生成..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-green-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-amber-500" />
                    待提升方向描述
                  </label>
                  <textarea
                    value={improvementDescription}
                    onChange={(e) => setImprovementDescription(e.target.value)}
                    placeholder="AI将自动生成..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-amber-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-500" />
                    鼓励寄语
                  </label>
                  <textarea
                    value={encouragementMessage}
                    onChange={(e) => setEncouragementMessage(e.target.value)}
                    placeholder="AI将自动生成..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-orange-50"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Poster Preview Modal */}
      {showPoster && selectedCourseUnit && selectedLanguage && (
        <PosterGenerator
          data={{
            studentName: student.name,
            languageName: selectedLanguage.name,
            courseUnitName: selectedCourseUnit.name,
            radarDimensions,
            currentStageContent: selectedCourseUnit.current_stage_content || '',
            nextStageContent: (() => {
              // 自动获取下一个单元的内容
              const nextUnit = courseUnits.find(
                c => c.period_number === selectedCourseUnit.period_number + 1
              );
              return nextUnit?.current_stage_content || '';
            })(),
            coreStrengths,
            areasToImprove,
            progressDescription,
            improvementDescription,
            encouragementMessage,
            generatedAt: new Date().toLocaleDateString('zh-CN')
          }}
          onClose={() => setShowPoster(false)}
        />
      )}
    </div>
  );
}
