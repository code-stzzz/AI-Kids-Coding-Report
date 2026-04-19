'use client';

import { SupabaseClient } from '@supabase/supabase-js';
import { getClientSupabase } from './supabase';

// Get client-side Supabase instance
function getSupabaseClient(): SupabaseClient {
  return getClientSupabase();
}

// Proxy for backward compatibility
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop: keyof SupabaseClient) {
    return (getSupabaseClient())[prop];
  }
});

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

// Helper to throw errors
function throwOnError(error: { message: string } | null) {
  if (error) throw new Error(`Database error: ${error.message}`);
}

// Programming Language Operations
export const languageApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('programming_languages')
      .select('*')
      .order('name');
    throwOnError(error);
    return data as ProgrammingLanguage[];
  },
  
  create: async (language: Omit<ProgrammingLanguage, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('programming_languages')
      .insert(language)
      .select()
      .single();
    throwOnError(error);
    return data as ProgrammingLanguage;
  },
  
  update: async (id: string, updates: Partial<ProgrammingLanguage>) => {
    const { data, error } = await supabase
      .from('programming_languages')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    throwOnError(error);
    return data as ProgrammingLanguage;
  },
  
  delete: async (id: string) => {
    const { error } = await supabase
      .from('programming_languages')
      .delete()
      .eq('id', id);
    throwOnError(error);
  },
};

// Course Unit Operations
export const courseApi = {
  getByLanguage: async (languageId: string) => {
    const { data, error } = await supabase
      .from('course_units')
      .select('*')
      .eq('language_id', languageId)
      .eq('is_active', true)
      .order('period_number');
    throwOnError(error);
    return data as CourseUnit[];
  },
  
  getAll: async () => {
    const { data, error } = await supabase
      .from('course_units')
      .select('*')
      .eq('is_active', true)
      .order('language_id')
      .order('period_number');
    throwOnError(error);
    return data as CourseUnit[];
  },
  
  create: async (course: Omit<CourseUnit, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('course_units')
      .insert(course)
      .select()
      .single();
    throwOnError(error);
    return data as CourseUnit;
  },
  
  update: async (id: string, updates: Partial<CourseUnit>) => {
    const { data, error } = await supabase
      .from('course_units')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    throwOnError(error);
    return data as CourseUnit;
  },
  
  delete: async (id: string) => {
    const { error } = await supabase
      .from('course_units')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);
    throwOnError(error);
  },
  
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('course_units')
      .select('*')
      .eq('id', id)
      .single();
    throwOnError(error);
    return data as CourseUnit;
  },
};

// Class Operations
export const classApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .order('name');
    throwOnError(error);
    return data as Class[];
  },
  
  getByLanguage: async (languageId: string) => {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('language_id', languageId)
      .order('name');
    throwOnError(error);
    return data as Class[];
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('id', id)
      .single();
    throwOnError(error);
    return data as Class;
  },
  
  create: async (cls: Omit<Class, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('classes')
      .insert(cls)
      .select()
      .single();
    throwOnError(error);
    return data as Class;
  },
  
  update: async (id: string, updates: Partial<Class>) => {
    const { data, error } = await supabase
      .from('classes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    throwOnError(error);
    return data as Class;
  },
  
  delete: async (id: string) => {
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', id);
    throwOnError(error);
  },
};

// Student Operations
export const studentApi = {
  getByClass: async (classId: string) => {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('class_id', classId)
      .eq('is_active', true)
      .order('name');
    throwOnError(error);
    return data as Student[];
  },
  
  getAll: async () => {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('is_active', true)
      .order('name');
    throwOnError(error);
    return data as Student[];
  },
  
  create: async (student: Omit<Student, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('students')
      .insert(student)
      .select()
      .single();
    throwOnError(error);
    return data as Student;
  },
  
  createBatch: async (students: Array<{
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
  }>) => {
    const { data, error } = await supabase
      .from('students')
      .insert(students)
      .select();
    throwOnError(error);
    return data as Student[];
  },
  
  update: async (id: string, updates: Partial<Student>) => {
    const { data, error } = await supabase
      .from('students')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    throwOnError(error);
    return data as Student;
  },
  
  delete: async (id: string) => {
    const { error } = await supabase
      .from('students')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);
    throwOnError(error);
  },
  
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single();
    throwOnError(error);
    return data as Student;
  },
};

// Study Report Operations
export const reportApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('study_reports')
      .select('*')
      .order('created_at', { ascending: false });
    throwOnError(error);
    return data as StudyReport[];
  },
  
  getByStudent: async (studentId: string) => {
    const { data, error } = await supabase
      .from('study_reports')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });
    throwOnError(error);
    return data as StudyReport[];
  },
  
  getLatest: async (studentId: string) => {
    const { data, error } = await supabase
      .from('study_reports')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    throwOnError(error);
    return data as StudyReport | null;
  },
  
  create: async (report: Omit<StudyReport, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('study_reports')
      .insert(report)
      .select()
      .single();
    throwOnError(error);
    return data as StudyReport;
  },
  
  update: async (id: string, updates: Partial<StudyReport>) => {
    const { data, error } = await supabase
      .from('study_reports')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    throwOnError(error);
    return data as StudyReport;
  },
  
  delete: async (id: string) => {
    const { error } = await supabase
      .from('study_reports')
      .delete()
      .eq('id', id);
    throwOnError(error);
  },
  
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('study_reports')
      .select('*')
      .eq('id', id)
      .single();
    throwOnError(error);
    return data as StudyReport;
  },
};
