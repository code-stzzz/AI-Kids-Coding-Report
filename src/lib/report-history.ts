import { getReports, getClasses, getLanguages, getCourseUnits, type StudyReport, type Class, type ProgrammingLanguage } from './data-api';

export interface HistoryReport extends StudyReport {
  class?: Class;
  language?: ProgrammingLanguage;
  course: { name: string; current_stage_content: string; next_stage_content: string };
}

export async function loadReportHistory() {
  const [reports, classes, languages, courses] = await Promise.all([
    getReports(), getClasses(), getLanguages(), getCourseUnits(),
  ]);
  const enriched: HistoryReport[] = reports.map(report => {
    const cls = classes.find(c => c.id === report.student?.class_id);
    const unit = report.course_unit;
    const course = courses.find(c => c.id === report.course_unit_id);
    const languageId = report.language_id || unit?.language_id || course?.language_id || cls?.language_id;
    const versionId = unit?.version_id ?? course?.version_id;
    const period = unit?.period_number ?? course?.period_number;
    const next = courses.find(c => c.language_id === languageId && c.version_id === versionId && c.period_number === (period ?? 0) + 1);
    return {
      ...report,
      class: cls,
      language: languages.find(l => l.id === languageId),
      course: {
        name: unit?.name || course?.name || '未知课程',
        current_stage_content: unit?.current_stage_content || course?.current_stage_content || '',
        next_stage_content: unit?.next_stage_content || course?.next_stage_content || next?.current_stage_content || '',
      },
    };
  });
  enriched.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return { reports: enriched, classes, languages };
}

export function historyEditUrl(report: HistoryReport) {
  const query = new URLSearchParams({ courseUnitId: report.course_unit_id });
  if (report.student?.class_id) query.set('classId', report.student.class_id);
  if (report.course_unit?.version_id) query.set('versionId', report.course_unit.version_id);
  return `/reports/generate/${encodeURIComponent(report.student_id)}?${query}`;
}
