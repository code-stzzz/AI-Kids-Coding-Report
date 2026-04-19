'use client';

// Types
export interface ProgrammingLanguage {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface CourseUnit {
  id: string;
  language_id: string;
  name: string;
  period_number: number;
  current_stage_content: string;
  next_stage_content: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface Class {
  id: string;
  name: string;
  language_id: string;
  description: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface Student {
  id: string;
  class_id: string;
  name: string;
  student_number: string | null;
  learning_cycle: number;
  gender: string | null;
  age: number | null;
  contact_phone: string | null;
  contact_email: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface RadarDimension {
  name: string;
  score: number;
}

export interface StudyReport {
  id: string;
  student_id: string;
  course_unit_id: string;
  language_id: string;
  radar_dimensions: RadarDimension[];
  core_strengths: string;
  areas_to_improve: string;
  competition_plans: string;
  improvement_plan_1: string;
  improvement_plan_2: string;
  improvement_plan_3: string;
  progress_description: string;
  improvement_description: string;
  encouragement_message: string;
  is_completed: boolean;
  generated_at: string | null;
  created_at: string;
  updated_at: string | null;
}

// 固定的三个编程语言
const FIXED_LANGUAGES: ProgrammingLanguage[] = [
  {
    id: 'lang-python',
    name: 'Python',
    description: 'Python编程语言课程',
    icon: '🐍',
    created_at: new Date().toISOString(),
    updated_at: null
  },
  {
    id: 'lang-cpp',
    name: 'C++',
    description: 'C++编程语言课程',
    icon: '⚡',
    created_at: new Date().toISOString(),
    updated_at: null
  },
  {
    id: 'lang-scratch',
    name: 'Scratch',
    description: 'Scratch图形化编程课程',
    icon: '🎨',
    created_at: new Date().toISOString(),
    updated_at: null
  }
];

// LocalStorage Keys
const STORAGE_KEYS = {
  courses: 'coding_report_courses',
  classes: 'coding_report_classes',
  students: 'coding_report_students',
  reports: 'coding_report_reports',
};

// Helper functions
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

// Programming Language Operations (固定三个，不支持增删改)
export const languageApi = {
  getAll: async (): Promise<ProgrammingLanguage[]> => {
    return FIXED_LANGUAGES;
  },
  
  getById: async (id: string): Promise<ProgrammingLanguage | null> => {
    return FIXED_LANGUAGES.find(lang => lang.id === id) || null;
  },
};

// Course Unit Operations
export const courseApi = {
  getByLanguage: async (languageId: string): Promise<CourseUnit[]> => {
    const courses = getFromStorage<CourseUnit[]>(STORAGE_KEYS.courses, []);
    return courses
      .filter(c => c.language_id === languageId && c.is_active)
      .sort((a, b) => a.period_number - b.period_number);
  },
  
  getAll: async (): Promise<CourseUnit[]> => {
    const courses = getFromStorage<CourseUnit[]>(STORAGE_KEYS.courses, []);
    return courses
      .filter(c => c.is_active)
      .sort((a, b) => a.language_id.localeCompare(b.language_id) || a.period_number - b.period_number);
  },
  
  create: async (course: Omit<CourseUnit, 'id' | 'created_at' | 'updated_at'>): Promise<CourseUnit> => {
    const courses = getFromStorage<CourseUnit[]>(STORAGE_KEYS.courses, []);
    const newCourse: CourseUnit = {
      ...course,
      id: generateId(),
      created_at: new Date().toISOString(),
      updated_at: null
    };
    courses.push(newCourse);
    saveToStorage(STORAGE_KEYS.courses, courses);
    return newCourse;
  },
  
  update: async (id: string, updates: Partial<CourseUnit>): Promise<CourseUnit> => {
    const courses = getFromStorage<CourseUnit[]>(STORAGE_KEYS.courses, []);
    const index = courses.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Course not found');
    
    courses[index] = {
      ...courses[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    saveToStorage(STORAGE_KEYS.courses, courses);
    return courses[index];
  },
  
  delete: async (id: string): Promise<void> => {
    const courses = getFromStorage<CourseUnit[]>(STORAGE_KEYS.courses, []);
    const index = courses.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Course not found');
    
    courses[index].is_active = false;
    courses[index].updated_at = new Date().toISOString();
    saveToStorage(STORAGE_KEYS.courses, courses);
  },
  
  getById: async (id: string): Promise<CourseUnit> => {
    const courses = getFromStorage<CourseUnit[]>(STORAGE_KEYS.courses, []);
    const course = courses.find(c => c.id === id);
    if (!course) throw new Error('Course not found');
    return course;
  },
};

// Class Operations
export const classApi = {
  getAll: async (): Promise<Class[]> => {
    const classes = getFromStorage<Class[]>(STORAGE_KEYS.classes, []);
    return classes.sort((a, b) => a.name.localeCompare(b.name));
  },
  
  getByLanguage: async (languageId: string): Promise<Class[]> => {
    const classes = getFromStorage<Class[]>(STORAGE_KEYS.classes, []);
    return classes
      .filter(c => c.language_id === languageId)
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  getById: async (id: string): Promise<Class> => {
    const classes = getFromStorage<Class[]>(STORAGE_KEYS.classes, []);
    const cls = classes.find(c => c.id === id);
    if (!cls) throw new Error('Class not found');
    return cls;
  },
  
  create: async (cls: Omit<Class, 'id' | 'created_at' | 'updated_at'>): Promise<Class> => {
    const classes = getFromStorage<Class[]>(STORAGE_KEYS.classes, []);
    const newClass: Class = {
      ...cls,
      id: generateId(),
      created_at: new Date().toISOString(),
      updated_at: null
    };
    classes.push(newClass);
    saveToStorage(STORAGE_KEYS.classes, classes);
    return newClass;
  },
  
  update: async (id: string, updates: Partial<Class>): Promise<Class> => {
    const classes = getFromStorage<Class[]>(STORAGE_KEYS.classes, []);
    const index = classes.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Class not found');
    
    classes[index] = {
      ...classes[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    saveToStorage(STORAGE_KEYS.classes, classes);
    return classes[index];
  },
  
  delete: async (id: string): Promise<void> => {
    const classes = getFromStorage<Class[]>(STORAGE_KEYS.classes, []);
    const index = classes.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Class not found');
    
    classes.splice(index, 1);
    saveToStorage(STORAGE_KEYS.classes, classes);
  },
};

// Student Operations
export const studentApi = {
  getByClass: async (classId: string): Promise<Student[]> => {
    const students = getFromStorage<Student[]>(STORAGE_KEYS.students, []);
    return students
      .filter(s => s.class_id === classId && s.is_active)
      .sort((a, b) => a.name.localeCompare(b.name));
  },
  
  getAll: async (): Promise<Student[]> => {
    const students = getFromStorage<Student[]>(STORAGE_KEYS.students, []);
    return students
      .filter(s => s.is_active)
      .sort((a, b) => a.name.localeCompare(b.name));
  },
  
  create: async (student: Omit<Student, 'id' | 'created_at' | 'updated_at'>): Promise<Student> => {
    const students = getFromStorage<Student[]>(STORAGE_KEYS.students, []);
    const newStudent: Student = {
      ...student,
      id: generateId(),
      created_at: new Date().toISOString(),
      updated_at: null
    };
    students.push(newStudent);
    saveToStorage(STORAGE_KEYS.students, students);
    return newStudent;
  },
  
  createBatch: async (studentsData: Array<{
    class_id: string;
    name: string;
    learning_cycle?: number;
    is_active?: boolean;
    student_number?: string | null;
    gender?: string | null;
    age?: number | null;
    contact_phone?: string | null;
    contact_email?: string | null;
    notes?: string | null;
  }>): Promise<Student[]> => {
    const students = getFromStorage<Student[]>(STORAGE_KEYS.students, []);
    const newStudents: Student[] = studentsData.map(data => ({
      id: generateId(),
      class_id: data.class_id,
      name: data.name,
      learning_cycle: data.learning_cycle || 1,
      is_active: data.is_active ?? true,
      student_number: data.student_number ?? null,
      gender: data.gender ?? null,
      age: data.age ?? null,
      contact_phone: data.contact_phone ?? null,
      contact_email: data.contact_email ?? null,
      notes: data.notes ?? null,
      created_at: new Date().toISOString(),
      updated_at: null
    }));
    students.push(...newStudents);
    saveToStorage(STORAGE_KEYS.students, students);
    return newStudents;
  },
  
  update: async (id: string, updates: Partial<Student>): Promise<Student> => {
    const students = getFromStorage<Student[]>(STORAGE_KEYS.students, []);
    const index = students.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Student not found');
    
    students[index] = {
      ...students[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    saveToStorage(STORAGE_KEYS.students, students);
    return students[index];
  },
  
  delete: async (id: string): Promise<void> => {
    const students = getFromStorage<Student[]>(STORAGE_KEYS.students, []);
    const index = students.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Student not found');
    
    students[index].is_active = false;
    students[index].updated_at = new Date().toISOString();
    saveToStorage(STORAGE_KEYS.students, students);
  },
  
  getById: async (id: string): Promise<Student> => {
    const students = getFromStorage<Student[]>(STORAGE_KEYS.students, []);
    const student = students.find(s => s.id === id);
    if (!student) throw new Error('Student not found');
    return student;
  },
};

// Study Report Operations
export const reportApi = {
  getAll: async (): Promise<StudyReport[]> => {
    const reports = getFromStorage<StudyReport[]>(STORAGE_KEYS.reports, []);
    return reports.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },
  
  getByStudent: async (studentId: string): Promise<StudyReport[]> => {
    const reports = getFromStorage<StudyReport[]>(STORAGE_KEYS.reports, []);
    return reports
      .filter(r => r.student_id === studentId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },
  
  getLatest: async (studentId: string): Promise<StudyReport | null> => {
    const reports = await reportApi.getByStudent(studentId);
    return reports[0] || null;
  },
  
  getByStudentAndCourseUnit: async (studentId: string, courseUnitId: string): Promise<StudyReport | null> => {
    const reports = getFromStorage<StudyReport[]>(STORAGE_KEYS.reports, []);
    return reports.find(r => r.student_id === studentId && r.course_unit_id === courseUnitId) || null;
  },
  
  getPreviousReport: async (studentId: string, currentPeriodNumber: number, languageId: string): Promise<StudyReport | null> => {
    const reports = getFromStorage<StudyReport[]>(STORAGE_KEYS.reports, []);
    const courses = getFromStorage<CourseUnit[]>(STORAGE_KEYS.courses, []);
    
    // 找到上一期的课程单元
    const previousCourse = courses.find(c => 
      c.language_id === languageId && c.period_number === currentPeriodNumber - 1
    );
    
    if (!previousCourse) return null;
    
    // 找到该学生上一期的报告
    return reports.find(r => r.student_id === studentId && r.course_unit_id === previousCourse.id) || null;
  },
  
  create: async (report: Omit<StudyReport, 'id' | 'created_at' | 'updated_at'>): Promise<StudyReport> => {
    const reports = getFromStorage<StudyReport[]>(STORAGE_KEYS.reports, []);
    const newReport: StudyReport = {
      ...report,
      id: generateId(),
      created_at: new Date().toISOString(),
      updated_at: null
    };
    reports.push(newReport);
    saveToStorage(STORAGE_KEYS.reports, reports);
    return newReport;
  },
  
  update: async (id: string, updates: Partial<StudyReport>): Promise<StudyReport> => {
    const reports = getFromStorage<StudyReport[]>(STORAGE_KEYS.reports, []);
    const index = reports.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Report not found');
    
    reports[index] = {
      ...reports[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    saveToStorage(STORAGE_KEYS.reports, reports);
    return reports[index];
  },
  
  delete: async (id: string): Promise<void> => {
    const reports = getFromStorage<StudyReport[]>(STORAGE_KEYS.reports, []);
    const index = reports.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Report not found');
    
    reports.splice(index, 1);
    saveToStorage(STORAGE_KEYS.reports, reports);
  },
  
  getById: async (id: string): Promise<StudyReport> => {
    const reports = getFromStorage<StudyReport[]>(STORAGE_KEYS.reports, []);
    const report = reports.find(r => r.id === id);
    if (!report) throw new Error('Report not found');
    return report;
  },
};

// 导出固定的语言列表供直接使用
export { FIXED_LANGUAGES };

// 课程模板版本号（更新课程内容时需要递增此版本号）
const COURSE_TEMPLATE_VERSION = 'v4.2.2025';

// 初始化默认课程单元模板
export async function initializeDefaultCourses(): Promise<void> {
  const storedVersion = localStorage.getItem('course_template_version');
  const existingCourses = getFromStorage<CourseUnit[]>(STORAGE_KEYS.courses, []);
  
  // 如果版本号不匹配或没有课程数据，重新初始化
  if (storedVersion !== COURSE_TEMPLATE_VERSION || existingCourses.length === 0) {
    // 动态导入课程模板
    const { getDefaultCourseUnits } = await import('./course-templates');
    const defaultUnits = getDefaultCourseUnits();
    
    // 创建课程单元
    const courses: CourseUnit[] = defaultUnits.map(unit => ({
      ...unit,
      id: generateId(),
      created_at: new Date().toISOString(),
      updated_at: null
    }));
    
    saveToStorage(STORAGE_KEYS.courses, courses);
    localStorage.setItem('course_template_version', COURSE_TEMPLATE_VERSION);
    console.log(`已初始化默认课程单元模板 (${COURSE_TEMPLATE_VERSION})`);
  }
}
