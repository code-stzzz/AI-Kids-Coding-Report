'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Plus, 
  Edit2, 
  Trash2, 
  Users,
  ChevronRight,
  Loader2,
  X,
  GraduationCap,
  UserPlus,
  Search
} from 'lucide-react';
import { 
  getLanguages,
  getClasses,
  getStudents,
  getVersions,
  createClass,
  updateClass,
  deleteClass,
  createStudent,
  batchCreateStudents,
  updateStudent,
  deleteStudent,
  ProgrammingLanguage,
  Class,
  Student,
  CurriculumVersion
} from '@/lib/data-api';

export default function ClassesPage() {
  const [languages, setLanguages] = useState<ProgrammingLanguage[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [versions, setVersions] = useState<CurriculumVersion[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  
  // Class Modal State
  const [showClassModal, setShowClassModal] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [classForm, setClassForm] = useState({ name: '', description: '', default_version_id: '' });
  
  // Student Modal State
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentForm, setStudentForm] = useState({
    name: '',
    studentNumber: '',
    learningCycle: '1'
  });
  const [bulkStudentNames, setBulkStudentNames] = useState('');
  const [addMode, setAddMode] = useState<'single' | 'bulk'>('single');
  
  const [saving, setSaving] = useState(false);
  const [filteredVersions, setFilteredVersions] = useState<CurriculumVersion[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [langData, classData] = await Promise.all([
        getLanguages(),
        getClasses()
      ]);
      
      // 如果编程语言列表为空，尝试初始化数据库
      if (langData.length === 0) {
        setInitializing(true);
        console.log('检测到数据库为空，正在初始化...');
        const initResponse = await fetch('/api/init', { method: 'POST' });
        if (initResponse.ok) {
          const initResult = await initResponse.json();
          console.log('初始化结果:', initResult);
          // 重新获取数据
          const [newLangData, newClassData] = await Promise.all([
            getLanguages(),
            getClasses()
          ]);
          setLanguages(newLangData);
          setClasses(newClassData);
          if (newLangData.length > 0 && !selectedLanguage) {
            setSelectedLanguage(newLangData[0].id);
          }
        } else {
          console.error('初始化失败:', await initResponse.text());
        }
        setInitializing(false);
      } else {
        setLanguages(langData);
        setClasses(classData);
        if (langData.length > 0 && !selectedLanguage) {
          setSelectedLanguage(langData[0].id);
        }
        // 加载所有版本的名称映射（用于班级卡片显示）
        const allVersions: CurriculumVersion[] = [];
        for (const lang of langData) {
          const langVersions = await getVersions(lang.id);
          allVersions.push(...langVersions);
        }
        setVersions(allVersions);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async (classId: string, forceRefresh: boolean = false) => {
    // 如果不是强制刷新，且该班级学生已加载，则跳过
    if (!forceRefresh && students.some(s => s.class_id === classId)) {
      return;
    }
    try {
      const data = await getStudents(classId);
      setStudents(prev => {
        // 移除该班级的旧数据，添加新数据
        const otherStudents = prev.filter(s => s.class_id !== classId);
        return [...otherStudents, ...data];
      });
    } catch (error) {
      console.error('加载学生失败:', error);
    }
  };

  // 加载所有班级的学生数据
  const loadAllStudents = async () => {
    try {
      const allStudents: Student[] = [];
      for (const cls of classes) {
        const data = await getStudents(cls.id);
        allStudents.push(...data);
      }
      setStudents(allStudents);
    } catch (error) {
      console.error('加载学生数据失败:', error);
    }
  };

  // 当班级数据加载完成后，加载所有学生
  useEffect(() => {
    if (classes.length > 0 && students.length === 0) {
      loadAllStudents();
    }
  }, [classes.length]);

  const filteredClasses = classes.filter(c => c.language_id === selectedLanguage);
  
  const getClassStudents = (classId: string) => {
    return students.filter(s => s.class_id === classId);
  };

  const getLanguageName = (langId: string) => {
    return languages.find(l => l.id === langId)?.name || '';
  };

  // Class Operations
  const openAddClass = async () => {
    setEditingClass(null);
    setClassForm({ name: '', description: '', default_version_id: '' });
    // 过滤当前语言的版本列表
    const filtered = versions.filter(v => v.language_id === selectedLanguage);
    setFilteredVersions(filtered);
    // 如果有默认版本，自动选中
    const defaultVersion = filtered.find(v => v.is_default);
    if (defaultVersion) {
      setClassForm(prev => ({ ...prev, default_version_id: defaultVersion.id }));
    }
    setShowClassModal(true);
  };

  const openEditClass = async (cls: Class) => {
    setEditingClass(cls);
    setClassForm({ 
      name: cls.name, 
      description: cls.description || '', 
      default_version_id: cls.default_version_id || '' 
    });
    // 过滤该班级语言的版本列表
    const filtered = versions.filter(v => v.language_id === cls.language_id);
    setFilteredVersions(filtered);
    setShowClassModal(true);
  };

  const handleSaveClass = async () => {
    if (!selectedLanguage) return;
    if (!classForm.name.trim()) {
      alert('请填写班级名称');
      return;
    }

    setSaving(true);
    try {
      if (editingClass) {
        await updateClass({
          id: editingClass.id,
          name: classForm.name,
          language_id: editingClass.language_id,
          description: classForm.description || undefined,
          default_version_id: classForm.default_version_id || undefined
        });
      } else {
        await createClass({
          name: classForm.name,
          language_id: selectedLanguage,
          description: classForm.description || undefined,
          default_version_id: classForm.default_version_id || undefined
        });
      }
      await loadData();
      setShowClassModal(false);
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (!confirm('确定要删除该班级吗？班级内的学生也会一并删除。')) return;
    try {
      await deleteClass(classId);
      await loadData();
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败，请重试');
    }
  };

  // Student Operations
  const openStudentModal = (classId: string, student?: Student) => {
    setSelectedClassId(classId);
    setEditingStudent(student || null);
    if (student) {
      setStudentForm({
        name: student.name,
        studentNumber: student.student_number || '',
        learningCycle: student.learning_cycle?.toString() || '1'
      });
    } else {
      setStudentForm({
        name: '',
        studentNumber: '',
        learningCycle: '1'
      });
    }
    setBulkStudentNames('');
    setAddMode('single');
    setShowStudentModal(true);
  };

  const handleSaveStudent = async () => {
    if (addMode === 'single') {
      if (!studentForm.name.trim()) {
        alert('请填写学生姓名');
        return;
      }

      setSaving(true);
      try {
        if (editingStudent) {
          await updateStudent({
            id: editingStudent.id,
            name: studentForm.name,
            student_number: studentForm.studentNumber || '',
            learning_cycle: parseInt(studentForm.learningCycle) || 1
          });
        } else {
          await createStudent({
            class_id: selectedClassId,
            name: studentForm.name,
            student_number: studentForm.studentNumber || '',
            learning_cycle: parseInt(studentForm.learningCycle) || 1
          });
        }
        await loadStudents(selectedClassId, true); // 强制刷新该班级学生数据
        setShowStudentModal(false);
      } catch (error) {
        console.error('保存失败:', error);
        alert('保存失败，请重试');
      } finally {
        setSaving(false);
      }
    } else {
      // Bulk add
      const names = bulkStudentNames.split('\n').map(n => n.trim()).filter(n => n);
      if (names.length === 0) {
        alert('请输入学生姓名');
        return;
      }

      setSaving(true);
      try {
        const newStudents = names.map((name, index) => ({
          class_id: selectedClassId,
          name,
          student_number: `${index + 1}`,
          learning_cycle: 1
        }));
        await batchCreateStudents(newStudents);
        await loadStudents(selectedClassId, true); // 强制刷新该班级学生数据
        setShowStudentModal(false);
      } catch (error) {
        console.error('批量添加失败:', error);
        alert('批量添加失败，请重试');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('确定要删除该学生吗？')) return;
    try {
      await deleteStudent(studentId);
      await loadData();
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败，请重试');
    }
  };

  if (loading || initializing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        {initializing && (
          <p className="text-gray-600">正在初始化数据库，请稍候...</p>
        )}
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
                <h1 className="text-xl font-bold text-gray-900">班级管理</h1>
                <p className="text-sm text-gray-500">管理班级和学生信息</p>
              </div>
            </div>
            <button
              onClick={openAddClass}
              disabled={!selectedLanguage}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              添加班级
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
                    ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  {lang.name}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Class List */}
        <div className="space-y-4">
          {filteredClasses.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border p-12 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无班级</h3>
              <p className="text-gray-500 mb-4">点击上方按钮添加第一个班级</p>
              <button
                onClick={openAddClass}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                添加班级
              </button>
            </div>
          ) : (
            filteredClasses.map((cls) => {
              const classStudents = getClassStudents(cls.id);
              return (
                <div
                  key={cls.id}
                  className="bg-white rounded-2xl shadow-sm border hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                          <Users className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {cls.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {classStudents.length} 名学生
                            {cls.description && ` · ${cls.description}`}
                          </p>
                          {cls.default_version_id && (
                            <p className="text-xs text-blue-600 mt-1">
                              默认版本: {versions.find(v => v.id === cls.default_version_id)?.name || '未设置'}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openStudentModal(cls.id)}
                          className="p-2 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="添加学生"
                        >
                          <UserPlus className="w-4 h-4 text-indigo-600" />
                        </button>
                        <button
                          onClick={() => openEditClass(cls)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteClass(cls.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>

                    {/* Student List */}
                    {classStudents.length > 0 ? (
                      <div className="space-y-2">
                        {classStudents.map((student) => (
                          <div
                            key={student.id}
                            className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-600">
                                  {student.name.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-900">
                                  {student.name}
                                </span>
                                {student.student_number && (
                                  <span className="text-sm text-gray-500 ml-2">
                                    学号: {student.student_number}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                第{student.learning_cycle}周期
                              </span>
                              <button
                                onClick={() => openStudentModal(cls.id, student)}
                                className="p-1.5 hover:bg-white rounded-lg transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-gray-500" />
                              </button>
                              <button
                                onClick={() => handleDeleteStudent(student.id)}
                                className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-gray-50 rounded-xl">
                        <p className="text-gray-500 text-sm mb-2">暂无学生</p>
                        <button
                          onClick={() => openStudentModal(cls.id)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium inline-flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          添加学生
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Class Modal */}
      {showClassModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingClass ? '编辑班级' : '添加班级'}
              </h2>
              <button
                onClick={() => setShowClassModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  班级名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={classForm.name}
                  onChange={(e) => setClassForm({...classForm, name: e.target.value})}
                  placeholder="如：Python基础班-A"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  班级描述（可选）
                </label>
                <input
                  type="text"
                  value={classForm.description}
                  onChange={(e) => setClassForm({...classForm, description: e.target.value})}
                  placeholder="简要描述班级情况"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {filteredVersions.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    默认课程版本
                  </label>
                  <select
                    value={classForm.default_version_id}
                    onChange={(e) => setClassForm({...classForm, default_version_id: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">请选择版本</option>
                    {filteredVersions.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name} {v.is_default ? '(默认)' : ''}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    学生生成学习报告时将使用此版本的课程内容
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-gray-50 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowClassModal(false)}
                className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveClass}
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

      {/* Student Modal */}
      {showStudentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingStudent ? '编辑学生' : '添加学生'}
              </h2>
              <button
                onClick={() => setShowStudentModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Add Mode Toggle */}
            {!editingStudent && (
              <div className="px-6 pt-4">
                <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                  <button
                    onClick={() => setAddMode('single')}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                      addMode === 'single' ? 'bg-white shadow text-blue-600' : 'text-gray-600'
                    }`}
                  >
                    单个添加
                  </button>
                  <button
                    onClick={() => setAddMode('bulk')}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                      addMode === 'bulk' ? 'bg-white shadow text-blue-600' : 'text-gray-600'
                    }`}
                  >
                    批量添加
                  </button>
                </div>
              </div>
            )}
            
            <div className="p-6 space-y-4">
              {addMode === 'single' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      学生姓名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={studentForm.name}
                      onChange={(e) => setStudentForm({...studentForm, name: e.target.value})}
                      placeholder="输入学生姓名"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        学号
                      </label>
                      <input
                        type="text"
                        value={studentForm.studentNumber}
                        onChange={(e) => setStudentForm({...studentForm, studentNumber: e.target.value})}
                        placeholder="可选"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        学习周期
                      </label>
                      <input
                        type="number"
                        value={studentForm.learningCycle}
                        onChange={(e) => setStudentForm({...studentForm, learningCycle: e.target.value})}
                        placeholder="默认为1"
                        min="1"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      学生姓名列表 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={bulkStudentNames}
                      onChange={(e) => setBulkStudentNames(e.target.value)}
                      placeholder="每行一个姓名，例如：&#10;张三&#10;李四&#10;王五"
                      rows={10}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">每行一个姓名，将批量添加到班级中</p>
                  </div>
                </>
              )}
            </div>

            <div className="p-6 border-t bg-gray-50 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowStudentModal(false)}
                className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveStudent}
                disabled={saving}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {addMode === 'bulk' ? '批量添加' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
