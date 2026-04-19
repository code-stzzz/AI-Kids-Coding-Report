'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Plus, 
  Edit2, 
  Trash2, 
  BookOpen,
  ChevronRight,
  Loader2,
  X
} from 'lucide-react';
import { 
  languageApi, 
  courseApi, 
  ProgrammingLanguage, 
  CourseUnit,
  initializeDefaultCourses
} from '@/lib/local-storage';

export default function CoursesPage() {
  const [languages, setLanguages] = useState<ProgrammingLanguage[]>([]);
  const [courses, setCourses] = useState<CourseUnit[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseUnit | null>(null);
  const [courseForm, setCourseForm] = useState({
    name: '',
    periodNumber: 1,
    currentStageContent: '',
    description: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // 先初始化默认课程单元模板
      await initializeDefaultCourses();
      
      const [langData, courseData] = await Promise.all([
        languageApi.getAll(),
        courseApi.getAll()
      ]);
      setLanguages(langData);
      setCourses(courseData);
      if (langData.length > 0 && !selectedLanguage) {
        setSelectedLanguage(langData[0].id);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(c => c.language_id === selectedLanguage);

  const openAddCourse = () => {
    setEditingCourse(null);
    setCourseForm({
      name: '',
      periodNumber: filteredCourses.length + 1 || 1,
      currentStageContent: '',
      description: ''
    });
    setShowCourseModal(true);
  };

  const openEditCourse = (course: CourseUnit) => {
    setEditingCourse(course);
    setCourseForm({
      name: course.name,
      periodNumber: course.period_number,
      currentStageContent: course.current_stage_content,
      description: course.description || ''
    });
    setShowCourseModal(true);
  };

  const handleSaveCourse = async () => {
    if (!selectedLanguage) return;
    if (!courseForm.name || !courseForm.currentStageContent) {
      alert('请填写单元名称和本阶段学习内容');
      return;
    }

    setSaving(true);
    try {
      if (editingCourse) {
        await courseApi.update(editingCourse.id, {
          name: courseForm.name,
          period_number: courseForm.periodNumber,
          current_stage_content: courseForm.currentStageContent,
          description: courseForm.description || null
        });
      } else {
        await courseApi.create({
          language_id: selectedLanguage,
          name: courseForm.name,
          period_number: courseForm.periodNumber,
          current_stage_content: courseForm.currentStageContent,
          next_stage_content: '', // 暂时为空，会在显示时自动获取
          description: courseForm.description || null,
          is_active: true
        });
      }
      await loadData();
      setShowCourseModal(false);
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('确定要删除该课程单元吗？')) return;
    try {
      await courseApi.delete(courseId);
      await loadData();
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败，请重试');
    }
  };

  if (loading) {
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
                <h1 className="text-xl font-bold text-gray-900">课程管理</h1>
                <p className="text-sm text-gray-500">管理编程语言和课程单元</p>
              </div>
            </div>
            <button
              onClick={openAddCourse}
              disabled={!selectedLanguage}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              添加课程单元
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Language Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border mb-6 overflow-hidden">
          <div className="flex overflow-x-auto">
            {languages.map((lang) => (
              <button
                key={lang.id}
                onClick={() => setSelectedLanguage(lang.id)}
                className={`px-6 py-4 font-medium whitespace-nowrap transition-colors ${
                  selectedLanguage === lang.id
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  {lang.name}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Course List */}
        <div className="space-y-4">
          {filteredCourses.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border p-12 text-center">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无课程单元</h3>
              <p className="text-gray-500 mb-4">点击上方按钮添加第一个课程单元</p>
              <button
                onClick={openAddCourse}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                添加课程单元
              </button>
            </div>
          ) : (
            filteredCourses.map((course) => {
              // 动态获取下一单元内容
              const nextUnit = courses.find(
                c => c.language_id === course.language_id && c.period_number === course.period_number + 1
              );
              const nextStageContent = nextUnit?.current_stage_content || '';
              
              return (
              <div
                key={course.id}
                className="bg-white rounded-2xl shadow-sm border hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600 font-bold">第{course.period_number}期</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {course.name}
                        </h3>
                        {course.description && (
                          <p className="text-sm text-gray-500">{course.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditCourse(course)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteCourse(course.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-green-50 rounded-xl p-4">
                      <h4 className="text-sm font-medium text-green-800 mb-2 flex items-center gap-2">
                        <ChevronRight className="w-4 h-4" />
                        本阶段学习内容
                      </h4>
                      <p className="text-sm text-green-700 whitespace-pre-wrap">
                        {course.current_stage_content}
                      </p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4">
                      <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
                        <ChevronRight className="w-4 h-4" />
                        下阶段学习内容
                      </h4>
                      <p className="text-sm text-blue-700 whitespace-pre-wrap">
                        {nextStageContent || '暂无下一阶段内容'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )})
          )}
        </div>
      </main>

      {/* Course Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCourse ? '编辑课程单元' : '添加课程单元'}
              </h2>
              <button
                onClick={() => setShowCourseModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  课程单元名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={courseForm.name}
                  onChange={(e) => setCourseForm({...courseForm, name: e.target.value})}
                  placeholder="如：Python基础入门"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  期数（第几期） <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={courseForm.periodNumber}
                  onChange={(e) => setCourseForm({...courseForm, periodNumber: parseInt(e.target.value) || 1})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">12次课为一个学习周期</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  课程描述（可选）
                </label>
                <input
                  type="text"
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({...courseForm, description: e.target.value})}
                  placeholder="简要描述本课程单元"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  本阶段学习内容 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={courseForm.currentStageContent}
                  onChange={(e) => setCourseForm({...courseForm, currentStageContent: e.target.value})}
                  placeholder="详细描述本阶段（12次课）将学习的内容..."
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">这些内容将用于AI生成学习报告，下阶段内容会自动从下一单元获取</p>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCourseModal(false)}
                className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveCourse}
                disabled={saving}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
