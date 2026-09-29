'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { filterReportStudents, type StudentStatusFilter } from '@/lib/student-selection';
import { StudentStatusButton } from '@/components/StudentStatusButton';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Users,
  Loader2,
  CheckCircle,
  Circle,
  ChevronRight,
  BookOpen,
  Layers,
  Hash
} from 'lucide-react';
import { 
  getLanguages,
  getClasses,
  getStudents,
  getReports,
  getCourseUnits,
  ProgrammingLanguage,
  Class,
  Student,
  CourseUnit
} from '@/lib/data-api';

interface StudentWithStatus extends Student {
  hasReport: boolean;
  reportId?: string;
}

interface CurriculumVersion {
  id: string;
  name: string;
}

export default function GenerateReportsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<StudentStatusFilter>('active');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loadError, setLoadError] = useState('');
  const requestId = useRef(0);
  const [languages, setLanguages] = useState<ProgrammingLanguage[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [versions, setVersions] = useState<CurriculumVersion[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedCourseUnit, setSelectedCourseUnit] = useState<string>('');
  const [students, setStudents] = useState<StudentWithStatus[]>([]);
  const [courseUnits, setCourseUnits] = useState<CourseUnit[]>([]);
  const [allReports, setAllReports] = useState<{student_id: string; course_unit_id: string; id: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [versionsLoading, setVersionsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // 当选择编程语言时，加载版本列表
  useEffect(() => {
    if (selectedLanguage) {
      loadVersions(selectedLanguage);
    } else {
      setVersions([]);
      setSelectedVersion('');
    }
  }, [selectedLanguage]);

  // 当选择版本时，重置班级和课程单元选择
  useEffect(() => {
    if (selectedVersion) {
      setSelectedClass('');
      setCourseUnits([]);
      setSelectedCourseUnit('');
    }
  }, [selectedVersion]);

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
          if (newLangData.length > 0) {
            setSelectedLanguage(newLangData[0].id);
          }
        } else {
          console.error('初始化失败:', await initResponse.text());
        }
        setInitializing(false);
      } else {
        setLanguages(langData);
        setClasses(classData);
        if (langData.length > 0) {
          setSelectedLanguage(langData[0].id);
        }
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载指定语言的版本列表
  const loadVersions = async (languageId: string) => {
    setVersionsLoading(true);
    try {
      const response = await fetch(`/api/versions?language_id=${languageId}`);
      const data = await response.json();
      if (data.data) {
        setVersions(data.data);
        // 默认选择第一个版本
        if (data.data.length > 0) {
          setSelectedVersion(data.data[0].id);
        } else {
          setSelectedVersion('');
        }
      }
    } catch (error) {
      console.error('加载版本列表失败:', error);
      setVersions([]);
    } finally {
      setVersionsLoading(false);
    }
  };

  // 加载课程单元（基于选中的版本）
  const loadCourseUnits = async () => {
    if (!selectedVersion) return;
    
    try {
      const response = await fetch(`/api/courses?version_id=${selectedVersion}`);
      const data = await response.json();
      if (data.data) {
        setCourseUnits(data.data);
        if (data.data.length > 0) {
          setSelectedCourseUnit(data.data[0].id);
        }
      }
    } catch (error) {
      console.error('加载课程单元失败:', error);
    }
  };

  // 当选择班级后，加载学生数据
  useEffect(() => {
    requestId.current++;
    setStudents([]);
    setAllReports([]);
    setSelectedIds([]);
    setLoadError('');
    if (selectedClass && selectedVersion) {
      loadStudentsAndReports();
      loadCourseUnits();
    } else {
      setStudents([]);
      setSelectedCourseUnit('');
    }
  }, [selectedClass, selectedVersion]);

  // 当版本变化后，也要重新加载课程单元
  useEffect(() => {
    if (selectedVersion && selectedClass) {
      loadCourseUnits();
    }
  }, [selectedVersion]);

  const loadStudentsAndReports = async () => {
    if (!selectedClass) return;
    const currentRequest = ++requestId.current;
    
    setStudentsLoading(true);
    try {
      // 加载学生和报告数据
      const [studentData, reportData] = await Promise.all([
        getStudents(selectedClass),
        getReports()
      ]);
      if (currentRequest !== requestId.current) return;

      // 保存所有报告数据
      setAllReports(reportData.map(r => ({
        student_id: r.student_id,
        course_unit_id: r.course_unit_id,
        id: r.id
      })));

      // 按学号排序学生
      const sortedStudents = [...studentData].sort((a, b) => 
        (a.student_number || '').localeCompare(b.student_number || '', 'zh-CN', { numeric: true })
      );

      // 初始化学生状态（稍后根据选中的课程单元更新）
      setStudents(sortedStudents.map(student => ({
        ...student,
        hasReport: false,
        reportId: undefined
      })));
    } catch (error) {
      if (currentRequest !== requestId.current) return;
      setLoadError(error instanceof Error ? error.message : '加载学生失败，请重试');
      console.error('加载学生数据失败:', error);
    } finally {
      if (currentRequest === requestId.current) setStudentsLoading(false);
    }
  };

  // 当选中的课程单元变化时，更新学生的完成状态
  useEffect(() => {
    if (!selectedCourseUnit || students.length === 0) return;
    
    setStudents(prev => prev.map(student => {
      const report = allReports.find(
        r => r.student_id === student.id && r.course_unit_id === selectedCourseUnit
      );
      return {
        ...student,
        hasReport: !!report,
        reportId: report?.id
      };
    }));
  }, [selectedCourseUnit, allReports]);

  const filteredClasses = classes.filter(c => c.language_id === selectedLanguage);

  // 统计完成情况
  const visibleStudents = filterReportStudents(students, statusFilter, search);
  const selectedStudents = visibleStudents.filter(s => selectedIds.includes(s.id));
  const completedCount = visibleStudents.filter(s => s.hasReport).length;
  const totalCount = visibleStudents.length;
  const reportUrl = (id: string, ids: string[]) => `/reports/generate/${encodeURIComponent(id)}?${new URLSearchParams({
    classId: selectedClass, courseUnitId: selectedCourseUnit, versionId: selectedVersion, studentIds: ids.join(','),
  })}`;
  
  // 获取选中的课程单元信息
  const selectedUnit = courseUnits.find(c => c.id === selectedCourseUnit);

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
                href="/reports" 
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">批量生成报告</h1>
                <p className="text-sm text-gray-500">
                  选择班级和课程单元后，逐个为学生生成学习报告
                </p>
              </div>
            </div>
            
            {totalCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-xl">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">
                  已完成 {completedCount}/{totalCount} 人
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Step 1: 选择语言、版本、班级和课程单元 */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
            <h2 className="text-lg font-semibold text-gray-900">选择班级和课程单元</h2>
          </div>
          
          <div className="grid md:grid-cols-4 gap-4">
            {/* 编程语言 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <BookOpen className="w-4 h-4 inline mr-1" />
                编程语言
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => {
                  setSelectedLanguage(e.target.value);
                  setSelectedClass('');
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">请选择编程语言</option>
                {languages.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 课程版本 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Hash className="w-4 h-4 inline mr-1" />
                课程版本
              </label>
              <select
                value={selectedVersion}
                onChange={(e) => setSelectedVersion(e.target.value)}
                disabled={!selectedLanguage || versionsLoading}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">请选择版本</option>
                {versionsLoading ? (
                  <option value="">加载中...</option>
                ) : (
                  versions.map((version) => (
                    <option key={version.id} value={version.id}>
                      {version.name}
                    </option>
                  ))
                )}
              </select>
            </div>
            
            {/* 班级 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="w-4 h-4 inline mr-1" />
                班级
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                disabled={!selectedVersion}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">请选择班级</option>
                {filteredClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* 课程单元 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Layers className="w-4 h-4 inline mr-1" />
                课程单元
              </label>
              <select
                value={selectedCourseUnit}
                onChange={(e) => setSelectedCourseUnit(e.target.value)}
                disabled={!selectedClass || courseUnits.length === 0}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">请选择课程单元</option>
                {courseUnits.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    第{unit.period_number}期 · {unit.name} {unit.version_name ? `(${unit.version_name})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* 显示选中的课程单元内容预览 */}
          {selectedUnit && (
            <div className="mt-4 p-4 bg-blue-50 rounded-xl">
              <h4 className="text-sm font-medium text-blue-800 mb-2">
                当前课程：{selectedUnit.name}（第{selectedUnit.period_number}期）
                {selectedUnit.version_name && <span className="ml-2 text-blue-600">版本：{selectedUnit.version_name}</span>}
              </h4>
              <p className="text-sm text-blue-700 whitespace-pre-line line-clamp-3">
                {selectedUnit.current_stage_content}
              </p>
            </div>
          )}
        </div>

        {/* Step 2: 学生列表 */}
        {selectedClass && (
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <h2 className="text-lg font-semibold text-gray-900">学生列表</h2>
              </div>
              {!selectedCourseUnit && (
                <p className="text-sm text-amber-600">请先选择课程单元</p>
              )}
            </div>

            <div className="flex flex-wrap items-end gap-3 mb-4">
              <label className="text-sm">学生状态
                <select className="block border rounded-lg px-3 py-2 mt-1" value={statusFilter} onChange={e => { setStatusFilter(e.target.value as StudentStatusFilter); setSelectedIds([]); }}>
                  <option value="active">在读</option><option value="completed">已结课</option><option value="all">全部</option>
                </select>
              </label>
              <label className="text-sm">搜索学生
                <input className="block border rounded-lg px-3 py-2 mt-1" placeholder="姓名或学号" value={search} onChange={e => { setSearch(e.target.value); setSelectedIds([]); }} />
              </label>
              <label className="flex gap-2 items-center py-2 text-sm">
                <input type="checkbox" disabled={studentsLoading || !visibleStudents.length} checked={visibleStudents.length > 0 && selectedStudents.length === visibleStudents.length} onChange={e => setSelectedIds(e.target.checked ? visibleStudents.map(s => s.id) : [])} />全选当前结果
              </label>
              <button disabled={!selectedCourseUnit || !selectedStudents.length || studentsLoading} className="bg-blue-600 text-white rounded-lg px-4 py-2 disabled:opacity-40" onClick={() => router.push(reportUrl(selectedStudents[0].id, selectedStudents.map(s => s.id)))}>为勾选学生制作报告（{selectedStudents.length}）</button>
            </div>
            <p className="text-sm text-gray-500 mb-4">找到 {visibleStudents.length} 人。标记结课不会删除学生或历史报告；选择“已结课”可补做报告。</p>
            {loadError ? <p role="alert" className="text-red-600">{loadError} <button className="underline" onClick={() => { setLoadError(''); loadStudentsAndReports(); }}>重新加载</button></p> : studentsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : visibleStudents.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>{students.length ? '没有符合筛选条件的学生，请调整状态或搜索内容。' : '该班级暂无学生'}</p>
                <Link 
                  href="/classes" 
                  className="text-blue-600 hover:underline text-sm mt-2 inline-block"
                >
                  前往添加学生
                </Link>
              </div>
            ) : (
              <div className="grid gap-3">
                {visibleStudents.map((student, index) => (
                  <div
                    key={student.id}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                      student.hasReport 
                        ? 'bg-green-50 border-green-200 hover:border-green-300' 
                        : 'bg-gray-50 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <input type="checkbox" aria-label={`选择${student.name}`} checked={selectedIds.includes(student.id)} onChange={e => setSelectedIds(current => e.target.checked ? [...current, student.id] : current.filter(id => id !== student.id))} />
                      {/* 完成状态图标 */}
                      {student.hasReport ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <Circle className="w-6 h-6 text-gray-400" />
                      )}
                      
                      {/* 学号和姓名 */}
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500 w-16">
                          {student.student_number || `#${index + 1}`}
                        </span>
                        <span className={`font-medium ${student.hasReport ? 'text-green-700' : 'text-gray-900'}`}>
                          {student.name}
                        </span>
                        {student.hasReport && (
                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                            已完成
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <StudentStatusButton student={student} onChanged={updated => {
                      setStudents(current => current.map(s => s.id === updated.id ? { ...s, ...updated } : s));
                      setSelectedIds(current => current.filter(id => id !== updated.id));
                    }} />
                    {selectedCourseUnit ? (
                      <Link
                        href={reportUrl(student.id, [student.id])}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                          student.hasReport
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        <span>{student.hasReport ? '查看/编辑' : '生成报告'}</span>
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    ) : (
                      <span className="text-sm text-gray-400 px-4 py-2">
                        请先选择课程单元
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 未选择班级时的提示 */}
        {!selectedClass && (
          <div className="bg-white rounded-2xl shadow-sm border p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">请先选择班级和课程单元</h3>
            <p className="text-gray-500">
              选择编程语言、版本、班级和课程单元后，将显示该班级的学生列表
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
