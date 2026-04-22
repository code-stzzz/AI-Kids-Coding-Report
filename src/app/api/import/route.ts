import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 从请求中获取认证 token
function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return request.cookies.get('sb-access-token')?.value || null;
}

// 从 JWT token 中解析用户 ID
function getUserIdFromToken(token: string): string | null {
  try {
    // 处理 URL-safe base64 编码
    let payload = token.split('.')[1];
    payload = payload.replace(/-/g, '+').replace(/_/g, '/');
    while (payload.length % 4) {
      payload += '=';
    }
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
    return decoded.sub || null;
  } catch {
    return null;
  }
}

// 获取 Supabase Admin 客户端
function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.COZE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.COZE_SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase 配置缺失');
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// 批量导入数据
export async function POST(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const userId = getUserIdFromToken(token);
    if (!userId) {
      return NextResponse.json({ error: '无效的认证信息' }, { status: 401 });
    }

    const supabase = getSupabaseAdminClient();
    const body = await request.json();
    
    const results = {
      classes: { success: 0, failed: 0, errors: [] as string[] },
      students: { success: 0, failed: 0, errors: [] as string[] },
      reports: { success: 0, failed: 0, errors: [] as string[] },
    };

    // 1. 导入班级
    if (body.classes && Array.isArray(body.classes)) {
      for (const cls of body.classes) {
        const { error } = await supabase
          .from('classes')
          .upsert({
            id: cls.id,
            user_id: userId,
            language_id: cls.language_id,
            name: cls.name,
            description: cls.description || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        
        if (error) {
          results.classes.failed++;
          results.classes.errors.push(`${cls.name}: ${error.message}`);
        } else {
          results.classes.success++;
        }
      }
    }

    // 2. 导入学生
    if (body.students && Array.isArray(body.students)) {
      for (const student of body.students) {
        const { error } = await supabase
          .from('students')
          .upsert({
            id: student.id,
            user_id: userId,
            class_id: student.class_id,
            name: student.name,
            student_number: student.student_number,
            learning_cycle: student.learning_cycle || 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        
        if (error) {
          results.students.failed++;
          results.students.errors.push(`${student.name}: ${error.message}`);
        } else {
          results.students.success++;
        }
      }
    }

    // 3. 导入学习报告
    if (body.reports && Array.isArray(body.reports)) {
      for (const report of body.reports) {
        // 从课程单元获取 language_id
        const { data: courseUnit } = await supabase
          .from('course_units')
          .select('language_id')
          .eq('id', report.course_unit_id)
          .single();

        const { error } = await supabase
          .from('study_reports')
          .upsert({
            id: report.id,
            user_id: userId,
            student_id: report.student_id,
            course_unit_id: report.course_unit_id,
            language_id: courseUnit?.language_id,
            radar_dimensions: report.radar_dimensions,
            core_strengths: report.core_strengths,
            areas_to_improve: report.areas_to_improve,
            progress_description: report.progress_description,
            improvement_description: report.improvement_description,
            encouragement_message: report.encouragement_message,
            improvement_plan_1: report.improvement_plan_1,
            improvement_plan_2: report.improvement_plan_2,
            improvement_plan_3: report.improvement_plan_3,
            competition_plans: report.competition_plans,
            is_completed: true,
            generated_at: report.generated_at || new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        
        if (error) {
          results.reports.failed++;
          results.reports.errors.push(`报告: ${error.message}`);
        } else {
          results.reports.success++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      userId,
      results,
    });
  } catch (error) {
    console.error('批量导入异常:', error);
    return NextResponse.json(
      { error: '批量导入失败' },
      { status: 500 }
    );
  }
}
