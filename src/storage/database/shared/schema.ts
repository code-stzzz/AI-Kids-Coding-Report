import { sql } from "drizzle-orm";
import { pgTable, varchar, timestamp, boolean, integer, text, jsonb, index, serial, uuid } from "drizzle-orm/pg-core";

// 系统健康检查表（必须保留）
export const healthCheck = pgTable("health_check", {
  id: serial().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// 编程语言表（系统预设，所有用户共享）
export const programmingLanguages = pgTable(
  "programming_languages",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 50 }).notNull().unique(),
    description: varchar("description", { length: 255 }),
    icon: varchar("icon", { length: 10 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  }
);

// 课程单元表（系统预设，所有用户共享）
export const courseUnits = pgTable(
  "course_units",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    language_id: varchar("language_id", { length: 36 }).notNull().references(() => programmingLanguages.id),
    name: varchar("name", { length: 50 }).notNull(), // 如 U1, U2
    period_number: integer("period_number").notNull(), // 期数 1-12
    current_stage_content: text("current_stage_content").notNull(), // 本阶段学习内容
    description: varchar("description", { length: 500 }),
    is_active: boolean("is_active").default(true).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("course_units_language_id_idx").on(table.language_id),
    index("course_units_period_number_idx").on(table.period_number),
  ]
);

// 班级表（用户私有）
export const classes = pgTable(
  "classes",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    user_id: uuid("user_id").notNull().default(sql`auth.uid()`),
    name: varchar("name", { length: 100 }).notNull(),
    language_id: varchar("language_id", { length: 36 }).notNull().references(() => programmingLanguages.id),
    description: varchar("description", { length: 255 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("classes_user_id_idx").on(table.user_id),
    index("classes_language_id_idx").on(table.language_id),
  ]
);

// 学生表（用户私有）
export const students = pgTable(
  "students",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    user_id: uuid("user_id").notNull().default(sql`auth.uid()`),
    class_id: varchar("class_id", { length: 36 }).notNull().references(() => classes.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 50 }).notNull(),
    student_number: varchar("student_number", { length: 20 }),
    learning_cycle: integer("learning_cycle").default(1).notNull(), // 学习周期 1-12
    gender: varchar("gender", { length: 10 }),
    age: integer("age"),
    contact_phone: varchar("contact_phone", { length: 20 }),
    contact_email: varchar("contact_email", { length: 100 }),
    notes: text("notes"),
    is_active: boolean("is_active").default(true).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("students_user_id_idx").on(table.user_id),
    index("students_class_id_idx").on(table.class_id),
  ]
);

// 学习报告表（用户私有）
export const studyReports = pgTable(
  "study_reports",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    user_id: uuid("user_id").notNull().default(sql`auth.uid()`),
    student_id: varchar("student_id", { length: 36 }).notNull().references(() => students.id, { onDelete: "cascade" }),
    course_unit_id: varchar("course_unit_id", { length: 36 }).notNull().references(() => courseUnits.id),
    language_id: varchar("language_id", { length: 36 }).notNull().references(() => programmingLanguages.id),
    radar_dimensions: jsonb("radar_dimensions").notNull().$type<Array<{ name: string; score: number }>>(),
    core_strengths: text("core_strengths"),
    areas_to_improve: text("areas_to_improve"),
    improvement_plan_1: varchar("improvement_plan_1", { length: 255 }),
    improvement_plan_2: varchar("improvement_plan_2", { length: 255 }),
    improvement_plan_3: varchar("improvement_plan_3", { length: 255 }),
    competition_plans: text("competition_plans"),
    progress_description: text("progress_description"),
    improvement_description: text("improvement_description"),
    encouragement_message: text("encouragement_message"),
    is_completed: boolean("is_completed").default(false).notNull(),
    generated_at: timestamp("generated_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("study_reports_user_id_idx").on(table.user_id),
    index("study_reports_student_id_idx").on(table.student_id),
    index("study_reports_course_unit_id_idx").on(table.course_unit_id),
    index("study_reports_language_id_idx").on(table.language_id),
  ]
);

// 类型导出
export type ProgrammingLanguage = typeof programmingLanguages.$inferSelect;
export type CourseUnit = typeof courseUnits.$inferSelect;
export type Class = typeof classes.$inferSelect;
export type Student = typeof students.$inferSelect;
export type StudyReport = typeof studyReports.$inferSelect;

export type InsertClass = typeof classes.$inferInsert;
export type InsertStudent = typeof students.$inferInsert;
export type InsertStudyReport = typeof studyReports.$inferInsert;
