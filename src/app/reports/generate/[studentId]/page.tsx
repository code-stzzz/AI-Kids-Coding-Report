'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Loader2,
  Save,
  Sparkles,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { 
  getLanguages,
  getVersions,
  getClasses,
  getClassById,
  getStudents,
  getStudentById,
  getReports,
  createReport,
  updateReport,
  getCourseUnits,
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

// 雷达图维度配置
const RADAR_DIMENSIONS = [
  { name: '代码逻辑掌握', description: '理解程序执行流程，能够设计合理的算法逻辑' },
  { name: '语法规范运用', description: '正确使用编程语言的语法规则，代码风格规范' },
  { name: '问题排查解决', description: '能够独立发现和解决代码中的错误和问题' },
  { name: '课堂专注参与', description: '课堂学习专注度高，积极参与互动讨论' },
  { name: '创意拓展实现', description: '能够举一反三，创造性地扩展项目功能' },
  { name: '知识点复用能力', description: '能够将已学知识灵活应用到新场景中' },
];

function StudentReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const studentId = params.studentId as string;
  const classId = searchParams.get('classId');
  const courseUnitIdParam = searchParams.get('courseUnitId');
  const versionIdParam = searchParams.get('versionId'); // 从 URL 获取版本 ID
  
  const [student, setStudent] = useState<Student | null>(null);
  const [cls, setCls] = useState<Class | null>(null);
  const [language, setLanguage] = useState<ProgrammingLanguage | null>(null);
  const [languages, setLanguages] = useState<ProgrammingLanguage[]>([]); // 所有语言
  const [versions, setVersions] = useState<CurriculumVersion[]>([]); // 当前语言的版本
  const [selectedVersionId, setSelectedVersionId] = useState<string>(''); // 选择的版本
  const [courseUnits, setCourseUnits] = useState<CourseUnit[]>([]);
  const [allCourseUnits, setAllCourseUnits] = useState<CourseUnit[]>([]); // 所有语言的课程单元
  const [selectedCourseUnit, setSelectedCourseUnit] = useState<CourseUnit | null>(null);
  const [selectedNextCourseUnit, setSelectedNextCourseUnit] = useState<CourseUnit | null>(null); // 选择的下阶段课程单元
  const [existingReport, setExistingReport] = useState<StudyReport | null>(null);
  const [previousReport, setPreviousReport] = useState<StudyReport | null>(null); // 上次报告（用于对比）
  
  // 下阶段三级选择的状态
  const [nextLanguageId, setNextLanguageId] = useState<string>(''); // 下阶段选择 - 语言
  const [nextVersionId, setNextVersionId] = useState<string>(''); // 下阶段选择 - 版本
  const [nextVersions, setNextVersions] = useState<CurriculumVersion[]>([]); // 下阶段选择的版本列表
  const [nextCourseUnits, setNextCourseUnits] = useState<CourseUnit[]>([]); // 下阶段选择的课程单元列表
  const [allLanguagesVersions, setAllLanguagesVersions] = useState<{languageId: string; languageName: string; versions: CurriculumVersion[]}[]>([]); // 所有语言的版本数据
  
  // 班级学生列表（用于导航）
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [currentStudentIndex, setCurrentStudentIndex] = useState(-1);
  
  // 表单数据
  const [radarDimensions, setRadarDimensions] = useState<RadarDimension[]>(
    RADAR_DIMENSIONS.map(d => ({ name: d.name, score: 8 }))
  );
  const [coreStrengths, setCoreStrengths] = useState('');
  const [areasToImprove, setAreasToImprove] = useState('');
  const [progressDescription, setProgressDescription] = useState('');
  const [improvementDescription, setImprovementDescription] = useState('');
  const [encouragementMessage, setEncouragementMessage] = useState('');
  // 学习建议和赛考规划
  const [improvementPlan1, setImprovementPlan1] = useState('');
  const [improvementPlan2, setImprovementPlan2] = useState('');
  const [improvementPlan3, setImprovementPlan3] = useState('');
  const [competitionPlans, setCompetitionPlans] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showPoster, setShowPoster] = useState(false);

  useEffect(() => {
    if (studentId) {
      loadData();
    }
  }, [studentId]);

  // 加载课程单元（当版本变化时）
  useEffect(() => {
    if (selectedVersionId) {
      loadCourseUnitsByVersion(selectedVersionId);
    }
  }, [selectedVersionId]);

  // 下阶段：加载版本列表（当语言变化时，用户手动切换）
  useEffect(() => {
    if (!nextLanguageId) {
      setNextVersions([]);
      setNextVersionId('');
      setNextCourseUnits([]);
      return;
    }
    
    // 如果版本列表已经有数据且语言匹配，跳过（说明是 setDefaultNextStage 设置的）
    // 这里通过检查版本列表是否已包含当前语言来避免重复加载
    // 注意：用户手动切换语言时，会先清空版本列表，所以这里会触发加载
  }, [nextLanguageId]);

  // 下阶段：加载课程单元（当版本变化时）
  useEffect(() => {
    if (nextVersionId) {
      loadNextCourseUnits(nextVersionId);
    } else {
      setNextCourseUnits([]);
    }
  }, [nextVersionId]);

  const loadVersions = async (languageId: string) => {
    try {
      const versionData = await getVersions(languageId);
      setVersions(versionData);
      
      // 优先使用 URL 参数中的版本 ID
      if (versionIdParam && versionData.some(v => v.id === versionIdParam)) {
        setSelectedVersionId(versionIdParam);
      } else if (versionData.length > 0) {
        // 如果班级有默认版本，优先使用
        if (cls?.default_version_id) {
          const classVersion = versionData.find(v => v.id === cls.default_version_id);
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

  const loadNextVersions = async (languageId: string, targetVersionId?: string) => {
    try {
      const versionData = await getVersions(languageId);
      setNextVersions(versionData);
      if (versionData.length > 0) {
        // 如果指定了目标版本且存在于列表中，则使用目标版本
        if (targetVersionId && versionData.some(v => v.id === targetVersionId)) {
          setNextVersionId(targetVersionId);
        } else {
          setNextVersionId(versionData[0].id);
        }
      } else {
        setNextVersionId('');
        setNextCourseUnits([]);
      }
    } catch (error) {
      console.error('加载下阶段版本失败:', error);
    }
  };

  const loadNextCourseUnits = async (versionId: string) => {
    try {
      const courseData = await getCourseUnits({ versionId });
      setNextCourseUnits(courseData);
    } catch (error) {
      console.error('加载下阶段课程单元失败:', error);
    }
  };

  const loadCourseUnitsByVersion = async (versionId: string) => {
    try {
      const courseData = await getCourseUnits({ versionId });
      setCourseUnits(courseData);
      
      // 优先使用 URL 参数中的课程单元 ID
      if (courseUnitIdParam && courseData.some(c => c.id === courseUnitIdParam)) {
        const unit = courseData.find(c => c.id === courseUnitIdParam);
        if (unit) {
          setSelectedCourseUnit(unit);
          return;
        }
      }
      
      // 根据学习周期自动选择课程单元
      if (student) {
        const defaultUnit = courseData.find(c => c.period_number === student.learning_cycle);
        if (defaultUnit) {
          setSelectedCourseUnit(defaultUnit);
        } else if (courseData.length > 0) {
          setSelectedCourseUnit(courseData[0]);
        }
      }
    } catch (error) {
      console.error('加载课程单元失败:', error);
    }
  };

  // 设置下阶段默认值的函数
  const setDefaultNextStage = async (languageId: string, versionId: string) => {
    try {
      // 加载版本列表
      const versionData = await getVersions(languageId);
      setNextVersions(versionData);
      
      // 如果目标版本存在于列表中，使用它
      if (versionData.some(v => v.id === versionId)) {
        setNextVersionId(versionId);
      } else if (versionData.length > 0) {
        setNextVersionId(versionData[0].id);
      }
      
      // 设置语言ID
      setNextLanguageId(languageId);
    } catch (error) {
      console.error('设置默认下阶段失败:', error);
    }
  };
  
  // 当课程单元变化时，加载上次报告用于对比，并设置默认下阶段课程单元
  useEffect(() => {
    if (studentId && selectedCourseUnit) {
      loadPreviousReport();
      // 设置默认的下阶段选择器（同语言同版本）
      if (language?.id && selectedVersionId) {
        setDefaultNextStage(language.id, selectedVersionId);
      }
    }
  }, [studentId, selectedCourseUnit?.id]);
  
  // 当下阶段课程单元列表加载完成且 selectedNextCourseUnit 未设置时，自动选择下一个单元
  useEffect(() => {
    if (nextCourseUnits.length > 0 && selectedCourseUnit && !selectedNextCourseUnit) {
      const defaultNextUnit = nextCourseUnits.find(
        c => c.period_number === selectedCourseUnit.period_number + 1
      );
      if (defaultNextUnit) {
        setSelectedNextCourseUnit(defaultNextUnit);
      }
    }
  }, [nextCourseUnits, selectedCourseUnit?.id]);

  // 当下阶段语言或版本变化时，加载对应的课程单元列表
  useEffect(() => {
    const loadNextCourseUnits = async () => {
      if (!nextVersionId) {
        setNextCourseUnits([]);
        return;
      }
      try {
        const units = await getCourseUnits({ versionId: nextVersionId });
        setNextCourseUnits(units);
        
        // 如果当前选择的下阶段课程不在新列表中，尝试找到对应的课程
        if (selectedNextCourseUnit && !units.some(u => u.id === selectedNextCourseUnit.id)) {
          // 尝试找到同 period_number 的课程
          const matchingUnit = units.find(u => u.period_number === selectedNextCourseUnit.period_number);
          if (matchingUnit) {
            setSelectedNextCourseUnit(matchingUnit);
          }
        }
      } catch (error) {
        console.error('加载下阶段课程单元失败:', error);
        setNextCourseUnits([]);
      }
    };
    loadNextCourseUnits();
  }, [nextVersionId]);

  // 当下阶段语言变化时，更新版本列表并默认选择第一个版本
  useEffect(() => {
    if (!nextLanguageId) {
      setNextVersions([]);
      setNextVersionId('');
      return;
    }
    const langData = allLanguagesVersions.find(lv => lv.languageId === nextLanguageId);
    if (langData && langData.versions.length > 0) {
      setNextVersions(langData.versions);
      // 只有当当前版本不属于该语言时才重置
      if (!langData.versions.some(v => v.id === nextVersionId)) {
        setNextVersionId(langData.versions[0].id);
      }
    }
  }, [nextLanguageId, allLanguagesVersions]);

  const loadPreviousReport = async () => {
    if (!studentId || !selectedCourseUnit) return;
    
    try {
      // 获取该学生所有报告
      const reports = await getReports({ studentId });
      // 找到上一个周期的报告（用于对比）
      const prevReport = reports.find(r => 
        r.course_unit?.period_number === selectedCourseUnit.period_number - 1
      );
      setPreviousReport(prevReport || null);
    } catch (error) {
      console.error('加载上次报告失败:', error);
      setPreviousReport(null);
    }
  };

  const loadData = async () => {
    if (!studentId) return;
    
    try {
      // 加载学生信息
      const studentData = await getStudentById(studentId);
      if (!studentData) {
        setLoading(false);
        return;
      }
      setStudent(studentData);
      
      // 加载班级信息
      const classData = await getClassById(studentData.class_id);
      if (!classData) {
        setLoading(false);
        return;
      }
      setCls(classData);
      
      // 加载语言信息
      const languages = await getLanguages();
      setLanguages(languages);
      const langData = languages.find(l => l.id === classData.language_id);
      if (!langData) {
        setLoading(false);
        return;
      }
      setLanguage(langData);
      
      // 加载该语言的版本列表（用于本阶段课程选择）
      const versionsForLang = await getVersions(classData.language_id);
      setVersions(versionsForLang);
      
      // 如果 URL 有版本参数，设置为初始版本；否则使用班级默认版本
      let initialVersionId = '';
      if (versionIdParam) {
        initialVersionId = versionIdParam;
      } else if (classData.default_version_id) {
        initialVersionId = classData.default_version_id;
      } else if (versionsForLang.length > 0) {
        initialVersionId = versionsForLang[0].id;
      }
      
      // 立即加载课程单元
      if (initialVersionId) {
        const courseData = await getCourseUnits({ versionId: initialVersionId });
        setCourseUnits(courseData);
        setSelectedVersionId(initialVersionId);
        
        // 优先使用 URL 参数中的课程单元 ID
        if (courseUnitIdParam && courseData.some(c => c.id === courseUnitIdParam)) {
          const unit = courseData.find(c => c.id === courseUnitIdParam);
          if (unit) {
            setSelectedCourseUnit(unit);
          }
        }
      }
      
      // 加载所有语言及其版本数据（用于下阶段三级选择）
      const langVersions: {languageId: string; languageName: string; versions: CurriculumVersion[]}[] = [];
      for (const lang of languages) {
        const versionsForLang2 = await getVersions(lang.id);
        if (versionsForLang2.length > 0) {
          langVersions.push({
            languageId: lang.id,
            languageName: lang.name,
            versions: versionsForLang2
          });
        }
      }
      setAllLanguagesVersions(langVersions);
      
      // 初始化下阶段选择：默认选择语言（如果有版本参数则使用对应语言，否则用第一个）
      if (versionIdParam) {
        // 找到版本对应的语言
        const targetLang = langVersions.find(lv => 
          lv.versions.some(v => v.id === versionIdParam)
        );
        if (targetLang) {
          setNextLanguageId(targetLang.languageId);
        }
      } else if (langVersions.length > 0) {
        setNextLanguageId(langVersions[0].languageId);
      }
      
      // 加载该班级所有学生（用于导航）
      if (classId) {
        const students = await getStudents(classId);
        students.sort((a, b) => 
          (a.student_number || '').localeCompare(b.student_number || '', 'zh-CN', { numeric: true })
        );
        setAllStudents(students);
        setCurrentStudentIndex(students.findIndex(s => s.id === studentId));
      }
      
      // 加载现有报告
      const reports = await getReports({ studentId });
      const report = reports.find(r => r.student_id === studentId && r.course_unit_id === courseUnitIdParam);
      if (report) {
        setExistingReport(report);
        setRadarDimensions(report.radar_dimensions);
        setCoreStrengths(report.core_strengths || '');
        setAreasToImprove(report.areas_to_improve || '');
        setProgressDescription(report.progress_description || '');
        setImprovementDescription(report.improvement_description || '');
        setEncouragementMessage(report.encouragement_message || '');
        // 回显学习建议和赛考规划
        setImprovementPlan1(report.improvement_plan_1 || '');
        setImprovementPlan2(report.improvement_plan_2 || '');
        setImprovementPlan3(report.improvement_plan_3 || '');
        setCompetitionPlans(report.competition_plans || '');
      }
      // 课程单元会在版本加载后自动设置
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 切换到上一个/下一个学生（保留课程单元和版本参数）
  const navigateStudent = (direction: 'prev' | 'next') => {
    const courseUnitId = selectedCourseUnit?.id || courseUnitIdParam;
    const params = new URLSearchParams();
    if (classId) params.set('classId', classId);
    if (courseUnitId) params.set('courseUnitId', courseUnitId);
    if (selectedVersionId) params.set('versionId', selectedVersionId);
    const queryString = params.toString();
    
    if (direction === 'prev' && currentStudentIndex > 0) {
      const prevStudent = allStudents[currentStudentIndex - 1];
      router.push(`/reports/generate/${prevStudent.id}?${queryString}`);
    } else if (direction === 'next' && currentStudentIndex < allStudents.length - 1) {
      const nextStudent = allStudents[currentStudentIndex + 1];
      router.push(`/reports/generate/${nextStudent.id}?${queryString}`);
    }
  };

  // AI生成报告内容
  const generateAIContent = async () => {
    if (!selectedCourseUnit || !student) return;
    
    setGenerating(true);
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          languageName: language?.name || '',
          courseUnitName: selectedCourseUnit.name,
          currentStageContent: selectedCourseUnit.current_stage_content,
          nextStageContent: selectedNextCourseUnit?.current_stage_content || '',
          radarDimensions,
          coreStrengths,
          areasToImprove,
          competitionPlans,
          studentName: student.name
        })
      });
      
      const data = await response.json();
      
      if (data.progressDescription) setProgressDescription(data.progressDescription);
      if (data.improvementDescription) setImprovementDescription(data.improvementDescription);
      if (data.encouragementMessage) setEncouragementMessage(data.encouragementMessage);
      // 自动填充AI生成的学习建议
      if (data.improvementPlan1) setImprovementPlan1(data.improvementPlan1);
      if (data.improvementPlan2) setImprovementPlan2(data.improvementPlan2);
      if (data.improvementPlan3) setImprovementPlan3(data.improvementPlan3);
    } catch (error) {
      console.error('AI生成失败:', error);
      alert('AI生成失败，请稍后重试');
    } finally {
      setGenerating(false);
    }
  };

  // 保存报告
  const saveReport = async (showAlert: boolean = true): Promise<boolean> => {
    if (!student || !selectedCourseUnit) return false;
    
    setSaving(true);
    try {
      const reportData = {
        student_id: student.id,
        course_unit_id: selectedCourseUnit.id,
        radar_dimensions: radarDimensions,
        core_strengths: coreStrengths,
        areas_to_improve: areasToImprove,
        progress_description: progressDescription,
        improvement_description: improvementDescription,
        encouragement_message: encouragementMessage,
        improvement_plan_1: improvementPlan1,
        improvement_plan_2: improvementPlan2,
        improvement_plan_3: improvementPlan3,
        competition_plans: competitionPlans,
      };
      
      if (existingReport) {
        await updateReport({
          id: existingReport.id,
          ...reportData
        });
      } else {
        await createReport(reportData);
      }
      
      if (showAlert) {
        alert('保存成功！');
      }
      // 重新加载数据以更新状态
      loadData();
      return true;
    } catch (error) {
      console.error('保存失败:', error);
      if (showAlert) {
        alert('保存失败，请稍后重试');
      }
      return false;
    } finally {
      setSaving(false);
    }
  };

  // 生成海报（自动保存报告）
  const handleGeneratePoster = async () => {
    if (!progressDescription) return;
    
    // 先保存报告
    const saved = await saveReport(false);
    if (!saved) {
      alert('保存报告失败，无法生成海报');
      return;
    }
    
    // 保存成功后显示海报
    setShowPoster(true);
  };

  // 更新雷达图分数
  const updateRadarScore = (index: number, score: number) => {
    setRadarDimensions(prev => prev.map((d, i) => 
      i === index ? { ...d, score: Math.max(1, Math.min(10, score)) } : d
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!student || !cls || !language) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">未找到学生信息</p>
          <Link href="/reports/generate" className="text-blue-600 hover:underline">
            返回选择学生
          </Link>
        </div>
      </div>
    );
  }

  const prevStudent = currentStudentIndex > 0 ? allStudents[currentStudentIndex - 1] : null;
  const nextStudent = currentStudentIndex < allStudents.length - 1 ? allStudents[currentStudentIndex + 1] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/reports/generate" 
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {student.name} 的学习报告
                </h1>
                <p className="text-sm text-gray-500">
                  {language.name} · {cls.name} · {existingReport ? '已编辑' : '新建'}
                </p>
              </div>
            </div>
            
            {/* 学生导航 */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateStudent('prev')}
                disabled={!prevStudent}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-500 px-2">
                {currentStudentIndex + 1} / {allStudents.length}
              </span>
              <button
                onClick={() => navigateStudent('next')}
                disabled={!nextStudent}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* 左侧：表单 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 课程选择 */}
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">课程单元</h2>
              <div className="space-y-4">
                {/* 版本选择 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">课程版本</label>
                  <select
                    value={selectedVersionId}
                    onChange={(e) => setSelectedVersionId(e.target.value)}
                    disabled={versions.length === 0}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    <option value="">请选择课程版本</option>
                    {versions.map((version) => (
                      <option key={version.id} value={version.id}>
                        {version.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">本阶段课程</label>
                  <select
                    value={selectedCourseUnit?.id || ''}
                    onChange={(e) => {
                      const unit = courseUnits.find(c => c.id === e.target.value);
                      setSelectedCourseUnit(unit || null);
                    }}
                    disabled={!selectedVersionId}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    <option value="">请选择课程单元</option>
                    {courseUnits.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.name} - 第{unit.period_number}期 {unit.version_name ? `(${unit.version_name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    下阶段学习内容
                    <span className="text-gray-400 font-normal ml-1">（可跨语言选择）</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {/* 选择语言 */}
                    <select
                      value={nextLanguageId}
                      onChange={(e) => {
                        const newLangId = e.target.value;
                        setNextLanguageId(newLangId);
                        // 清空版本和课程，触发重新加载
                        setNextVersions([]);
                        setNextVersionId('');
                        setNextCourseUnits([]);
                        setSelectedNextCourseUnit(null);
                        // 手动加载新语言的版本
                        if (newLangId) {
                          loadNextVersions(newLangId);
                        }
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">选择语言</option>
                      {allLanguagesVersions.map(lv => (
                        <option key={lv.languageId} value={lv.languageId}>
                          {lv.languageName}
                        </option>
                      ))}
                    </select>
                    
                    {/* 选择版本 */}
                    <select
                      value={nextVersionId}
                      onChange={(e) => {
                        setNextVersionId(e.target.value);
                        setSelectedNextCourseUnit(null);
                      }}
                      disabled={!nextLanguageId}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100"
                    >
                      <option value="">选择版本</option>
                      {nextVersions.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                    
                    {/* 选择课程 */}
                    <select
                      value={selectedNextCourseUnit?.id || ''}
                      onChange={(e) => {
                        const unit = nextCourseUnits.find(c => c.id === e.target.value);
                        setSelectedNextCourseUnit(unit || null);
                      }}
                      disabled={!nextVersionId}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100"
                    >
                      <option value="">选择课程</option>
                      {nextCourseUnits.map(unit => (
                        <option key={unit.id} value={unit.id}>
                          {unit.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {selectedNextCourseUnit && (
                    <p className="mt-2 text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
                      {selectedNextCourseUnit.current_stage_content}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 雷达图评分 */}
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">六维能力评分</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {radarDimensions.map((dim, index) => (
                  <div key={dim.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">{dim.name}</label>
                      <span className="text-sm font-bold text-blue-600">{dim.score} 分</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={dim.score}
                      onChange={(e) => updateRadarScore(index, parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 核心进步点 & 待提升点 */}
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">学习评价</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    核心进步点
                  </label>
                  <textarea
                    value={coreStrengths}
                    onChange={(e) => setCoreStrengths(e.target.value)}
                    placeholder="描述学生本阶段的突出进步和优秀表现..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    待提升点
                  </label>
                  <textarea
                    value={areasToImprove}
                    onChange={(e) => setAreasToImprove(e.target.value)}
                    placeholder="描述学生需要加强的方面..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* 学习建议 */}
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">学习建议（可选）</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">建议1</label>
                  <input
                    type="text"
                    value={improvementPlan1}
                    onChange={(e) => setImprovementPlan1(e.target.value)}
                    placeholder="例如：加强变量命名规范的练习"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">建议2</label>
                  <input
                    type="text"
                    value={improvementPlan2}
                    onChange={(e) => setImprovementPlan2(e.target.value)}
                    placeholder="例如：多做调试练习，培养问题排查能力"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">建议3</label>
                  <input
                    type="text"
                    value={improvementPlan3}
                    onChange={(e) => setImprovementPlan3(e.target.value)}
                    placeholder="例如：尝试参加编程挑战赛，提升实战能力"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 赛考规划 */}
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">赛考规划（可选）</h2>
              <textarea
                value={competitionPlans}
                onChange={(e) => setCompetitionPlans(e.target.value)}
                placeholder="描述后续的竞赛或考级规划，如：参加蓝桥杯、CSP-J/S等..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* AI生成按钮 */}
            <button
              onClick={generateAIContent}
              disabled={generating || !selectedCourseUnit || !coreStrengths || !areasToImprove}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  AI正在生成...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  AI生成报告文案
                </>
              )}
            </button>

            {/* AI生成的内容 */}
            {(progressDescription || improvementDescription || encouragementMessage) && (
              <div className="bg-white rounded-2xl shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">AI生成内容</h2>
                <div className="space-y-4">
                  <div className="bg-green-50 rounded-xl p-4">
                    <label className="block text-sm font-medium text-green-800 mb-2">进步表现</label>
                    <textarea
                      value={progressDescription}
                      onChange={(e) => setProgressDescription(e.target.value)}
                      rows={4}
                      className="w-full bg-transparent text-green-900 resize-none focus:outline-none"
                    />
                  </div>
                  <div className="bg-amber-50 rounded-xl p-4">
                    <label className="block text-sm font-medium text-amber-800 mb-2">待提升方向</label>
                    <textarea
                      value={improvementDescription}
                      onChange={(e) => setImprovementDescription(e.target.value)}
                      rows={4}
                      className="w-full bg-transparent text-amber-900 resize-none focus:outline-none"
                    />
                  </div>
                  <div className="bg-orange-50 rounded-xl p-4">
                    <label className="block text-sm font-medium text-orange-800 mb-2">鼓励寄语</label>
                    <textarea
                      value={encouragementMessage}
                      onChange={(e) => setEncouragementMessage(e.target.value)}
                      rows={4}
                      className="w-full bg-transparent text-orange-900 resize-none focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-4">
              <button
                onClick={() => saveReport(true)}
                disabled={saving}
                className="flex-1 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    保存报告
                  </>
                )}
              </button>
              <button
                onClick={handleGeneratePoster}
                disabled={!progressDescription || saving}
                className="flex-1 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    生成海报
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 右侧：雷达图预览 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border p-6 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">能力雷达图</h2>
                {previousReport && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    对比上期
                  </span>
                )}
              </div>
              <RadarChart 
                dimensions={radarDimensions} 
                previousDimensions={previousReport?.radar_dimensions}
                editable={false} 
              />
              
              {/* 上次报告信息 */}
              {previousReport && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
                  <p className="font-medium text-gray-700 mb-1">上次报告参考</p>
                  <p>创建时间：{new Date(previousReport.created_at).toLocaleDateString('zh-CN')}</p>
                </div>
              )}
              
              {/* 快速导航学生 */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-sm font-medium text-gray-700 mb-3">快速导航</h3>
                <div className="space-y-2">
                  {prevStudent && (
                    <button
                      onClick={() => navigateStudent('prev')}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-left"
                    >
                      <ChevronLeft className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{prevStudent.name}</p>
                        <p className="text-xs text-gray-500">{prevStudent.student_number}</p>
                      </div>
                    </button>
                  )}
                  {nextStudent && (
                    <button
                      onClick={() => navigateStudent('next')}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-left"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{nextStudent.name}</p>
                        <p className="text-xs text-gray-500">{nextStudent.student_number}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Poster Preview Modal */}
      {showPoster && selectedCourseUnit && (
        <PosterGenerator
          data={{
            studentName: student.name,
            languageName: language.name,
            courseUnitName: selectedCourseUnit.name,
            radarDimensions,
            previousRadarDimensions: previousReport?.radar_dimensions,
            currentStageContent: selectedCourseUnit.current_stage_content,
            nextStageContent: selectedNextCourseUnit?.current_stage_content || '',
            coreStrengths,
            areasToImprove,
            progressDescription,
            improvementDescription,
            encouragementMessage,
            improvementPlan1,
            improvementPlan2,
            improvementPlan3,
            competitionPlans,
            generatedAt: new Date().toLocaleDateString('zh-CN')
          }}
          onClose={() => setShowPoster(false)}
        />
      )}
    </div>
  );
}

export default function GenerateStudentReportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    }>
      <StudentReportContent />
    </Suspense>
  );
}
