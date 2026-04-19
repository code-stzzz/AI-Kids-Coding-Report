/**
 * 数据访问层 - 统一封装所有 API 调用
 */

// 缓存的 Supabase 客户端
let supabaseClient: {
  getSession: () => Promise<{ data: { session: { access_token: string } | null } }>;
} | null = null;

// 设置 Supabase 客户端引用（由 UserProvider 调用）
export function setSupabaseClient(client: typeof supabaseClient) {
  supabaseClient = client;
}

// 获取当前 access token
async function getAccessToken(): Promise<string | null> {
  try {
    // 优先从 Supabase 客户端获取
    if (supabaseClient) {
      const { data: { session } } = await supabaseClient.getSession();
      console.log('[data-api] 从 Supabase 客户端获取 session:', session ? '有 session' : '无 session');
      if (session?.access_token) {
        console.log('[data-api] Token 前50字符:', session.access_token.substring(0, 50));
        return session.access_token;
      }
    }
    
    // 备用：从 localStorage 获取（Supabase 默认存储格式）
    // 尝试多种可能的 key 格式（支持新旧项目 ID）
    const possibleKeys = [
      'sb-dkxidckofamqwwocvpvw-auth-token',  // 新项目 ID（一个 o）
      'sb-dkxidckofamqwwoocvpvw-auth-token', // 旧项目 ID（两个 o）
      'supabase.auth.token',
    ];
    
    for (const key of possibleKeys) {
      const sessionStr = localStorage.getItem(key);
      console.log(`[data-api] 检查 localStorage key: ${key}, 存在: ${!!sessionStr}`);
      if (sessionStr) {
        try {
          const session = JSON.parse(sessionStr);
          if (session?.access_token) {
            console.log('[data-api] 从 localStorage 获取到 token，前50字符:', session.access_token.substring(0, 50));
            return session.access_token;
          }
        } catch (e) {
          console.log(`[data-api] 解析 localStorage key ${key} 失败:`, e);
        }
      }
    }
    
    console.log('[data-api] 未找到 access token');
    return null;
  } catch (error) {
    console.error('[data-api] 获取 access token 失败:', error);
    return null;
  }
}

// 带认证的 fetch
async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  const headers: HeadersInit = {
    ...options.headers,
  };
  
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });
}

// ==================== 编程语言 ====================

export interface ProgrammingLanguage {
  id: string;
  name: string;
  display_name: string;
  icon: string;
  color: string;
}

export async function getLanguages(): Promise<ProgrammingLanguage[]> {
  const res = await authFetch('/api/languages');
  const json = await res.json();
  return json.data || [];
}

// ==================== 课程单元 ====================

export interface CourseUnit {
  id: string;
  language_id: string;
  name: string;
  period_number: number;
  current_stage_content: string;
  next_stage_content: string | null;
  description: string;
  is_active: boolean;
}

export async function getCourseUnits(languageId?: string): Promise<CourseUnit[]> {
  const url = languageId 
    ? `/api/courses?language_id=${languageId}` 
    : '/api/courses';
  const res = await authFetch(url);
  const json = await res.json();
  return json.data || [];
}

// ==================== 班级 ====================

export interface Class {
  id: string;
  user_id: string;
  language_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export async function getClasses(languageId?: string): Promise<Class[]> {
  const url = languageId 
    ? `/api/classes?language_id=${languageId}` 
    : '/api/classes';
  const res = await authFetch(url);
  const json = await res.json();
  return json.data || [];
}

export async function getClassById(id: string): Promise<Class | null> {
  const classes = await getClasses();
  return classes.find(c => c.id === id) || null;
}

export async function createClass(data: {
  name: string;
  language_id: string;
  description?: string;
}): Promise<Class> {
  const res = await authFetch('/api/classes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error);
  return json.data;
}

export async function updateClass(data: {
  id: string;
  name: string;
  language_id: string;
  description?: string;
}): Promise<Class> {
  const res = await authFetch('/api/classes', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error);
  return json.data;
}

export async function deleteClass(id: string): Promise<void> {
  const res = await authFetch(`/api/classes?id=${id}`, { method: 'DELETE' });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error);
}

// ==================== 学生 ====================

export interface Student {
  id: string;
  user_id: string;
  class_id: string;
  name: string;
  student_number: string;
  learning_cycle: number;
  created_at: string;
  updated_at: string;
}

export async function getStudents(classId: string): Promise<Student[]> {
  const res = await authFetch(`/api/students?class_id=${classId}`);
  const json = await res.json();
  return json.data || [];
}

export async function getStudentById(id: string): Promise<Student | null> {
  const res = await authFetch(`/api/students/${id}`);
  const json = await res.json();
  return json.data || null;
}

export async function createStudent(data: {
  class_id: string;
  name: string;
  student_number: string;
  learning_cycle?: number;
}): Promise<Student> {
  const res = await authFetch('/api/students', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error);
  return json.data;
}

export async function batchCreateStudents(students: Array<{
  class_id: string;
  name: string;
  student_number: string;
  learning_cycle: number;
}>): Promise<Student[]> {
  const res = await authFetch('/api/students', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'batch_create', students }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error);
  return json.data;
}

export async function updateStudent(data: {
  id: string;
  name: string;
  student_number: string;
  learning_cycle: number;
}): Promise<Student> {
  const res = await authFetch('/api/students', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error);
  return json.data;
}

export async function deleteStudent(id: string): Promise<void> {
  const res = await authFetch(`/api/students?id=${id}`, { method: 'DELETE' });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error);
}

// ==================== 学习报告 ====================

export interface RadarDimension {
  name: string;
  score: number;
}

export interface StudyReport {
  id: string;
  user_id: string;
  student_id: string;
  course_unit_id: string;
  radar_dimensions: RadarDimension[];
  core_strengths: string;
  areas_to_improve: string;
  progress_description: string | null;
  improvement_description: string | null;
  encouragement_message: string | null;
  improvement_plan_1: string | null;
  improvement_plan_2: string | null;
  improvement_plan_3: string | null;
  competition_plans: string | null;
  created_at: string;
  updated_at: string;
  student?: { name: string; student_number: string };
  course_unit?: { name: string; period_number: number };
}

export async function getReports(params?: {
  studentId?: string;
  courseUnitId?: string;
}): Promise<StudyReport[]> {
  const searchParams = new URLSearchParams();
  if (params?.studentId) searchParams.set('student_id', params.studentId);
  if (params?.courseUnitId) searchParams.set('course_unit_id', params.courseUnitId);
  
  const url = `/api/reports${searchParams.toString() ? `?${searchParams}` : ''}`;
  const res = await authFetch(url);
  const json = await res.json();
  return json.data || [];
}

export async function createReport(data: {
  student_id: string;
  course_unit_id: string;
  radar_dimensions: RadarDimension[];
  core_strengths: string;
  areas_to_improve: string;
  progress_description?: string;
  improvement_description?: string;
  encouragement_message?: string;
  improvement_plan_1?: string;
  improvement_plan_2?: string;
  improvement_plan_3?: string;
  competition_plans?: string;
}): Promise<StudyReport> {
  const res = await authFetch('/api/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error);
  return json.data;
}

export async function updateReport(data: {
  id: string;
  radar_dimensions: RadarDimension[];
  core_strengths: string;
  areas_to_improve: string;
  progress_description?: string;
  improvement_description?: string;
  encouragement_message?: string;
  improvement_plan_1?: string;
  improvement_plan_2?: string;
  improvement_plan_3?: string;
  competition_plans?: string;
}): Promise<StudyReport> {
  const res = await authFetch('/api/reports', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error);
  return json.data;
}

export async function deleteReport(id: string): Promise<void> {
  const res = await authFetch(`/api/reports?id=${id}`, { method: 'DELETE' });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error);
}
