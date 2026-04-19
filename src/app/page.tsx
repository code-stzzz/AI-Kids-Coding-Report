'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  Users, 
  FileText, 
  Sparkles, 
  ChevronRight,
  Brain,
  Download,
  Layers
} from 'lucide-react';
import { getLanguages, getClasses, ProgrammingLanguage, Class } from '@/lib/data-api';
import { useUser } from '@/components/providers/UserProvider';

export default function HomePage() {
  const { user, loading: userLoading } = useUser();
  const [languages, setLanguages] = useState<ProgrammingLanguage[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);

  useEffect(() => {
    if (!userLoading) {
      initData();
    }
  }, [userLoading]);

  const initData = async () => {
    try {
      const [langData, classData] = await Promise.all([
        getLanguages(),
        getClasses()
      ]);
      
      // 如果编程语言列表为空，尝试初始化数据
      if (langData.length === 0) {
        setInitializing(true);
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
      console.error('初始化数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClasses = classes.filter(c => c.language_id === selectedLanguage);

  const handleLanguageChange = (langId: string) => {
    setSelectedLanguage(langId);
    setSelectedClass('');
  };

  // 加载中状态
  if (userLoading || loading || initializing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        {initializing && (
          <p className="text-gray-600">正在初始化数据库...</p>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          欢迎回来，{user?.name || '老师'}
        </h2>
        <p className="text-gray-600 mt-1">
          准备好为学生生成专属学习报告了吗？
        </p>
      </section>

      {/* Quick Start Section */}
      <section className="mb-12">
        {/* Quick Select Panel */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            快速生成报告
          </h3>
          
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            {/* Language Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择编程语言
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">请选择...</option>
                {languages.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Class Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择班级
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                disabled={!selectedLanguage}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">请选择班级...</option>
                {filteredClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Button */}
            <div className="flex items-end">
              <Link
                href={selectedClass ? `/reports/generate?classId=${selectedClass}` : '/reports/generate'}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 text-center"
              >
                <Sparkles className="w-5 h-5" />
                生成报告
              </Link>
            </div>
          </div>

          <p className="text-sm text-gray-500 text-center">
            选择语言和班级后，点击&ldquo;生成报告&rdquo;进入批量编辑模式
          </p>
        </div>
      </section>

      {/* Management Links */}
      <section className="grid md:grid-cols-3 gap-6">
        <Link
          href="/courses"
          className="bg-white rounded-2xl p-6 shadow-sm border hover:shadow-md hover:border-blue-200 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <Layers className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                课程管理
              </h3>
              <p className="text-sm text-gray-500">
                管理编程语言和课程单元
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
          </div>
        </Link>

        <Link
          href="/classes"
          className="bg-white rounded-2xl p-6 shadow-sm border hover:shadow-md hover:border-indigo-200 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                班级管理
              </h3>
              <p className="text-sm text-gray-500">
                管理班级和学生信息
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
          </div>
        </Link>

        <Link
          href="/reports"
          className="bg-white rounded-2xl p-6 shadow-sm border hover:shadow-md hover:border-green-200 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center group-hover:bg-green-100 transition-colors">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                历史报告
              </h3>
              <p className="text-sm text-gray-500">
                查看已生成的学习报告
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
          </div>
        </Link>
      </section>

      {/* Feature Highlights */}
      <section className="mt-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold mb-1">为什么选择我们</h2>
          <p className="text-blue-100 text-sm">专为少儿编程教育设计的报告生成工具</p>
        </div>
        
        <div className="grid md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Brain className="w-5 h-5" />
            </div>
            <h4 className="font-medium text-sm mb-1">AI智能生成</h4>
            <p className="text-xs text-blue-100">自动生成专属文案</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-2">
              <FileText className="w-5 h-5" />
            </div>
            <h4 className="font-medium text-sm mb-1">雷达图可视化</h4>
            <p className="text-xs text-blue-100">六维度能力分析</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Download className="w-5 h-5" />
            </div>
            <h4 className="font-medium text-sm mb-1">高清海报导出</h4>
            <p className="text-xs text-blue-100">手机适配格式</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-2">
              <BookOpen className="w-5 h-5" />
            </div>
            <h4 className="font-medium text-sm mb-1">课程体系完整</h4>
            <p className="text-xs text-blue-100">12次课为一周期</p>
          </div>
        </div>
      </section>
    </div>
  );
}
