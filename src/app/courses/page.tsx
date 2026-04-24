'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Plus, 
  Edit2, 
  Trash2, 
  BookOpen,
  ChevronRight,
  Loader2,
  X,
  Star,
  StarOff,
  Copy
} from 'lucide-react';
import { 
  getLanguages, 
  getVersions, 
  getCourseUnits, 
  createVersion, 
  updateVersion, 
  deleteVersion,
  createCourseUnit,
  updateCourseUnit,
  deleteCourseUnit,
  ProgrammingLanguage,
  CurriculumVersion,
  CourseUnit
} from '@/lib/data-api';

export default function CoursesPage() {
  const [languages, setLanguages] = useState<ProgrammingLanguage[]>([]);
  const [versions, setVersions] = useState<CurriculumVersion[]>([]);
  const [courses, setCourses] = useState<CourseUnit[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  // 版本弹窗状态
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [editingVersion, setEditingVersion] = useState<CurriculumVersion | null>(null);
  const [versionForm, setVersionForm] = useState({
    name: '',
    description: ''
  });
  const [savingVersion, setSavingVersion] = useState(false);
  
  // 课程弹窗状态
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseUnit | null>(null);
  const [courseForm, setCourseForm] = useState({
    name: '',
    periodNumber: 1,
    currentStageContent: '',
    description: ''
  });
  const [savingCourse, setSavingCourse] = useState(false);

  // 加载数据
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const langData = await getLanguages();
      setLanguages(langData);
      
      if (langData.length > 0 && !selectedLanguage) {
        setSelectedLanguage(langData[0].id);
      }
      
      if (selectedLanguage) {
        const versionData = await getVersions(selectedLanguage);
        setVersions(versionData);
        
        // 找到默认版本或第一个版本
        const defaultVersion = versionData.find(v => v.is_default) || versionData[0];
        if (defaultVersion) {
          setSelectedVersion(defaultVersion.id);
        } else {
          setSelectedVersion('');
          setCourses([]);
        }
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedLanguage]);

  // 加载课程单元
  const loadCourses = useCallback(async () => {
    if (!selectedVersion) {
      setCourses([]);
      return;
    }
    try {
      const courseData = await getCourseUnits({ versionId: selectedVersion });
      setCourses(courseData);
    } catch (error) {
      console.error('加载课程单元失败:', error);
      setCourses([]);
    }
  }, [selectedVersion]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadCourses();
  }, [selectedVersion, loadCourses]);

  // 切换语言时重置版本选择
  useEffect(() => {
    if (selectedLanguage) {
      getVersions(selectedLanguage).then(versionData => {
        setVersions(versionData);
        const defaultVersion = versionData.find(v => v.is_default) || versionData[0];
        if (defaultVersion) {
          setSelectedVersion(defaultVersion.id);
        } else {
          setSelectedVersion('');
        }
      });
    }
  }, [selectedLanguage]);

  // 版本操作
  const openAddVersion = () => {
    setEditingVersion(null);
    setVersionForm({ name: '', description: '' });
    setShowVersionModal(true);
  };

  const openEditVersion = (version: CurriculumVersion) => {
    setEditingVersion(version);
    setVersionForm({
      name: version.name,
      description: version.description || ''
    });
    setShowVersionModal(true);
  };

  const handleSaveVersion = async () => {
    if (!selectedLanguage) return;
    if (!versionForm.name) {
      alert('请填写版本名称');
      return;
    }

    setSavingVersion(true);
    try {
      if (editingVersion) {
        await updateVersion({
          id: editingVersion.id,
          name: versionForm.name,
          description: versionForm.description
        });
      } else {
        await createVersion({
          language_id: selectedLanguage,
          name: versionForm.name,
          description: versionForm.description
        });
      }
      await loadData();
      setShowVersionModal(false);
    } catch (error) {
      console.error('保存版本失败:', error);
      alert('保存失败，请重试');
    } finally {
      setSavingVersion(false);
    }
  };

  const handleSetDefaultVersion = async (versionId: string) => {
    try {
      // 先取消其他默认版本
      for (const v of versions) {
        if (v.is_default && v.id !== versionId) {
          await updateVersion({ id: v.id, is_default: false });
        }
      }
      // 设置新默认版本
      await updateVersion({ id: versionId, is_default: true });
      await loadData();
    } catch (error) {
      console.error('设置默认版本失败:', error);
      alert('设置失败，请重试');
    }
  };

  const handleDeleteVersion = async (versionId: string) => {
    if (!confirm('确定要删除该版本吗？该版本下的所有课程单元也会被删除。')) return;
    try {
      await deleteVersion(versionId);
      await loadData();
    } catch (error) {
      console.error('删除版本失败:', error);
      alert('删除失败，请重试');
    }
  };

  // 课程操作
  const openAddCourse = () => {
    if (!selectedVersion) {
      alert('请先选择或创建课程版本');
      return;
    }
    setEditingCourse(null);
    setCourseForm({
      name: '',
      periodNumber: courses.length + 1 || 1,
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
    if (!selectedLanguage || !selectedVersion) return;
    if (!courseForm.name || !courseForm.currentStageContent) {
      alert('请填写单元名称和本阶段学习内容');
      return;
    }

    setSavingCourse(true);
    try {
      if (editingCourse) {
        await updateCourseUnit({
          id: editingCourse.id,
          name: courseForm.name,
          period_number: courseForm.periodNumber,
          current_stage_content: courseForm.currentStageContent,
          description: courseForm.description
        });
      } else {
        await createCourseUnit({
          language_id: selectedLanguage,
          version_id: selectedVersion,
          name: courseForm.name,
          period_number: courseForm.periodNumber,
          current_stage_content: courseForm.currentStageContent,
          description: courseForm.description
        });
      }
      await loadCourses();
      setShowCourseModal(false);
    } catch (error) {
      console.error('保存课程失败:', error);
      alert('保存失败，请重试');
    } finally {
      setSavingCourse(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('确定要删除该课程单元吗？')) return;
    try {
      await deleteCourseUnit(courseId);
      await loadCourses();
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败，请重试');
    }
  };

  // 复制版本
  const handleCopyVersion = async (version: CurriculumVersion) => {
    const newName = prompt('请输入新版本名称', `${version.name} (副本)`);
    if (!newName) return;
    
    try {
      // 创建新版本
      const newVersion = await createVersion({
        language_id: version.language_id,
        name: newName,
        description: version.description || undefined
      });
      
      // 复制课程单元
      const versionCourses = await getCourseUnits({ versionId: version.id });
      for (const course of versionCourses) {
        await createCourseUnit({
          language_id: course.language_id,
          version_id: newVersion.id,
          name: course.name,
          period_number: course.period_number,
          current_stage_content: course.current_stage_content,
          description: course.description || undefined
        });
      }
      
      await loadData();
      alert('复制成功！');
    } catch (error) {
      console.error('复制版本失败:', error);
      alert('复制失败，请重试');
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
                <p className="text-sm text-gray-500">管理课程版本和课程单元</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={openAddVersion}
                disabled={!selectedLanguage}
                className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                新建版本
              </button>
              <button
                onClick={openAddCourse}
                disabled={!selectedVersion}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                添加课程单元
              </button>
            </div>
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

        {/* Version Selector */}
        <div className="bg-white rounded-2xl shadow-sm border mb-6 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">课程版本</h2>
            <span className="text-sm text-gray-500">
              {versions.length} 个版本
            </span>
          </div>
          
          {versions.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无课程版本</h3>
              <p className="text-gray-500 mb-4">点击上方"新建版本"创建第一个课程版本</p>
              <button
                onClick={openAddVersion}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                新建版本
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                    selectedVersion === version.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedVersion(version.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{version.name}</h3>
                      {version.is_default && (
                        <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                          默认
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {!version.is_default && (
                        <button
                          onClick={() => handleSetDefaultVersion(version.id)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                          title="设为默认"
                        >
                          <StarOff className="w-4 h-4 text-gray-400" />
                        </button>
                      )}
                      {version.is_default && (
                        <button
                          className="p-1.5"
                          title="当前默认版本"
                        >
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        </button>
                      )}
                      <button
                        onClick={() => openEditVersion(version)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        title="编辑"
                      >
                        <Edit2 className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleCopyVersion(version)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        title="复制"
                      >
                        <Copy className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteVersion(version.id)}
                        className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                  {version.description && (
                    <p className="text-sm text-gray-500 line-clamp-2">{version.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Course List */}
        {selectedVersion && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">课程单元</h2>
              <span className="text-sm text-gray-500">
                {courses.length} 个单元
              </span>
            </div>
            
            {courses.length === 0 ? (
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
              courses.map((course) => {
                // 动态获取下一单元内容
                const nextUnit = courses.find(
                  c => c.period_number === course.period_number + 1
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
                          <span className="text-blue-600 font-bold text-sm">第{course.period_number}期</span>
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
        )}
      </main>

      {/* Version Modal */}
      {showVersionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingVersion ? '编辑版本' : '新建版本'}
              </h2>
              <button
                onClick={() => setShowVersionModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  版本名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={versionForm.name}
                  onChange={(e) => setVersionForm({...versionForm, name: e.target.value})}
                  placeholder="如：4.0、4.2、小码王V4.0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  版本描述（可选）
                </label>
                <textarea
                  value={versionForm.description}
                  onChange={(e) => setVersionForm({...versionForm, description: e.target.value})}
                  placeholder="简要描述该版本的特点..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowVersionModal(false)}
                className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveVersion}
                disabled={savingVersion}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {savingVersion && <Loader2 className="w-4 h-4 animate-spin" />}
                保存
              </button>
            </div>
          </div>
        </div>
      )}

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
                disabled={savingCourse}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {savingCourse && <Loader2 className="w-4 h-4 animate-spin" />}
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
