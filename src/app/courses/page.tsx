'use client';

import { useEffect, useState, useCallback } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Edit2, 
  Trash2, 
  BookOpen,
  Sparkles,
  Loader2,
  Star,
  StarOff,
  Copy,
  ChevronDown,
  Layers
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
  initDefaultVersion,
  checkMigration,
  ProgrammingLanguage,
  CurriculumVersion,
  CourseUnit
} from '@/lib/data-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function CoursesPage() {
  const [languages, setLanguages] = useState<ProgrammingLanguage[]>([]);
  const [versions, setVersions] = useState<CurriculumVersion[]>([]);
  const [courses, setCourses] = useState<CourseUnit[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  // 迁移状态
  const [needMigration, setNeedMigration] = useState(false);
  
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

  // 获取当前选中的语言和版本信息
  const currentLanguage = languages.find(l => l.id === selectedLanguage);
  const currentVersion = versions.find(v => v.id === selectedVersion);

  // 加载语言列表
  const loadLanguages = useCallback(async () => {
    try {
      const langData = await getLanguages();
      setLanguages(langData);
      if (langData.length > 0 && !selectedLanguage) {
        setSelectedLanguage(langData[0].id);
      }
    } catch (error) {
      console.error('加载语言失败:', error);
    }
  }, []);

  // 加载版本列表
  const loadVersions = useCallback(async (forceSelect = false) => {
    if (!selectedLanguage) {
      setVersions([]);
      setSelectedVersion('');
      return;
    }
    try {
      const versionData = await getVersions(selectedLanguage);
      setVersions(versionData);
      // 仅在强制选择或当前没有选中版本时，自动选择默认版本
      if (forceSelect || !selectedVersion || !versionData.find(v => v.id === selectedVersion)) {
        const defaultVersion = versionData.find(v => v.is_default) || versionData[0];
        setSelectedVersion(defaultVersion?.id || '');
      }
    } catch (error) {
      console.error('加载版本失败:', error);
    }
  }, [selectedLanguage, selectedVersion]);

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

  // 初始化加载
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const migrationStatus = await checkMigration();
      if (migrationStatus.needsMigration) {
        setNeedMigration(true);
        setLoading(false);
        return;
      }
      setNeedMigration(false);
      await loadLanguages();
      setLoading(false);
    };
    init();
  }, []);

  // 语言切换时重新加载版本（强制选择默认版本）
  useEffect(() => {
    if (selectedLanguage) {
      loadVersions(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLanguage]);

  // 版本切换时重新加载课程
  useEffect(() => {
    if (selectedVersion) {
      loadCourses();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVersion]);

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
      await loadVersions();
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
      for (const v of versions) {
        if (v.is_default && v.id !== versionId) {
          await updateVersion({ id: v.id, is_default: false });
        }
      }
      await updateVersion({ id: versionId, is_default: true });
      await loadVersions();
    } catch (error) {
      console.error('设置默认版本失败:', error);
      alert('设置失败，请重试');
    }
  };

  const handleDeleteVersion = async (versionId: string) => {
    if (!confirm('确定要删除该版本吗？该版本下的所有课程单元也会被删除。')) return;
    try {
      await deleteVersion(versionId);
      await loadVersions();
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
      console.error('删除课程失败:', error);
      alert('删除失败，请重试');
    }
  };

  const handleCopyVersion = async (version: CurriculumVersion) => {
    if (!selectedLanguage) return;
    try {
      // 创建新版本
      const newVersion = await createVersion({
        language_id: selectedLanguage,
        name: `${version.name} (副本)`,
        description: version.description || ''
      });
      // 复制课程单元
      const oldCourses = await getCourseUnits({ versionId: version.id });
      for (const course of oldCourses) {
        await createCourseUnit({
          language_id: selectedLanguage,
          version_id: newVersion.id,
          name: course.name,
          period_number: course.period_number,
          current_stage_content: course.current_stage_content,
          description: course.description || ''
        });
      }
      alert('版本复制成功！');
      await loadVersions();
    } catch (error) {
      console.error('复制版本失败:', error);
      alert('复制失败，请重试');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <a href="/" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </a>
            <div>
              <h1 className="text-xl font-bold text-gray-900">课程管理</h1>
              <p className="text-sm text-gray-500">管理编程课程和版本</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* 选择器区域 */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* 编程语言选择 */}
            <div className="flex-1 min-w-[200px]">
              <Label className="text-sm font-medium text-gray-700 mb-2 block">编程语言</Label>
              <div className="relative">
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">请选择编程语言</option>
                  {languages.map((lang) => (
                    <option key={lang.id} value={lang.id}>
                      {lang.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* 课程版本选择 */}
            <div className="flex-1 min-w-[200px]">
              <Label className="text-sm font-medium text-gray-700 mb-2 block">课程版本</Label>
              <div className="relative">
                <select
                  value={selectedVersion}
                  onChange={(e) => setSelectedVersion(e.target.value)}
                  disabled={!selectedLanguage || versions.length === 0}
                  className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {selectedLanguage ? (versions.length === 0 ? '暂无版本' : '请选择版本') : '请先选择语言'}
                  </option>
                  {versions.map((version) => (
                    <option key={version.id} value={version.id}>
                      {version.name} {version.is_default ? '(默认)' : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none disabled:opacity-50" />
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2 self-end">
              <Button
                variant="outline"
                size="sm"
                onClick={openAddVersion}
                disabled={!selectedLanguage}
                className="flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                添加版本
              </Button>
              {selectedLanguage && versions.length === 0 && (
                <Button
                  size="sm"
                  onClick={async () => {
                    if (!confirm(`确定要初始化 ${currentLanguage?.name} 4.0 版本的课程模板吗？`)) return;
                    try {
                      const result = await initDefaultVersion(selectedLanguage, '4.0');
                      alert(`初始化成功！已创建 ${result.courseUnitsCount} 个课程单元`);
                      await loadVersions();
                    } catch (error: any) {
                      console.error('初始化失败:', error);
                      alert('初始化失败: ' + (error instanceof Error ? error.message : '请重试'));
                    }
                  }}
                  className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700"
                >
                  <Sparkles className="w-4 h-4" />
                  初始化 4.0
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* 版本管理区域 */}
        {selectedLanguage && versions.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-gray-500" />
                版本管理
              </h2>
              <span className="text-sm text-gray-500">{versions.length} 个版本</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className={`border-2 rounded-xl p-3 transition-all ${
                    selectedVersion === version.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900 text-sm">{version.name}</h3>
                    {version.is_default && (
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <button
                      onClick={() => openEditVersion(version)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                      title="编辑"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-gray-500" />
                    </button>
                    <button
                      onClick={() => handleCopyVersion(version)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                      title="复制"
                    >
                      <Copy className="w-3.5 h-3.5 text-gray-500" />
                    </button>
                    {!version.is_default && (
                      <button
                        onClick={() => handleSetDefaultVersion(version.id)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        title="设为默认"
                      >
                        <StarOff className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteVersion(version.id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 课程列表 */}
        {selectedVersion && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {currentLanguage?.name} {currentVersion?.name} 课程列表
              </h2>
              <Button size="sm" onClick={openAddCourse} className="flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                添加课程
              </Button>
            </div>
            
            {courses.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border p-12 text-center">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">暂无课程单元</h3>
                <p className="text-gray-500 mb-4">点击上方按钮添加第一个课程单元</p>
              </div>
            ) : (
              courses.map((course) => (
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
                          <p className="text-sm text-blue-600">
                            {currentLanguage?.name} {currentVersion?.name}
                          </p>
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
                    {course.current_stage_content && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">本阶段学习内容：</p>
                        <p className="text-sm text-gray-600 whitespace-pre-line">{course.current_stage_content}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 空状态 */}
        {!selectedLanguage && (
          <div className="bg-white rounded-2xl shadow-sm border p-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">请选择编程语言</h3>
            <p className="text-gray-500">在上方选择编程语言后，即可查看和管理课程版本</p>
          </div>
        )}
      </div>

      {/* 版本弹窗 */}
      {showVersionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {editingVersion ? '编辑版本' : '添加版本'}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">版本名称</Label>
                <Input
                  value={versionForm.name}
                  onChange={(e) => setVersionForm({ ...versionForm, name: e.target.value })}
                  placeholder="例如：4.0、4.2、高级版"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">版本描述（可选）</Label>
                <textarea
                  value={versionForm.description}
                  onChange={(e) => setVersionForm({ ...versionForm, description: e.target.value })}
                  placeholder="简要描述这个版本的特点"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowVersionModal(false)}>
                取消
              </Button>
              <Button onClick={handleSaveVersion} disabled={savingVersion}>
                {savingVersion ? '保存中...' : '保存'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 课程弹窗 */}
      {showCourseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCourse ? '编辑课程单元' : '添加课程单元'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {currentLanguage?.name} {currentVersion?.name}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">单元名称</Label>
                  <Input
                    value={courseForm.name}
                    onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                    placeholder="例如：U1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">期数</Label>
                  <Input
                    type="number"
                    min={1}
                    value={courseForm.periodNumber}
                    onChange={(e) => setCourseForm({ ...courseForm, periodNumber: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">本阶段学习内容</Label>
                <textarea
                  value={courseForm.currentStageContent}
                  onChange={(e) => setCourseForm({ ...courseForm, currentStageContent: e.target.value })}
                  placeholder="描述本阶段学生学习的内容（每项一行）"
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">课程描述（可选）</Label>
                <textarea
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  placeholder="简要描述这个课程单元"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowCourseModal(false)}>
                取消
              </Button>
              <Button onClick={handleSaveCourse} disabled={savingCourse}>
                {savingCourse ? '保存中...' : '保存'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
