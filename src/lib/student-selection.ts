import type { Student } from './data-api';

export type StudentStatusFilter = 'active' | 'completed' | 'all';
export function filterReportStudents<T extends Student>(students: T[], status: StudentStatusFilter, search: string): T[] {
  const query = search.trim().toLocaleLowerCase();
  return students.filter(student => (status === 'all' || (student.enrollment_status || 'active') === status)
    && `${student.name} ${student.student_number || ''}`.toLocaleLowerCase().includes(query));
}

export function reportStudentQueue<T extends Student>(students: T[], selectedIds: string | null, currentId: string): T[] {
  if (selectedIds !== null) {
    const ids = new Set(selectedIds.split(','));
    return students.filter(student => ids.has(student.id) || student.id === currentId);
  }
  return students.filter(student => student.enrollment_status !== 'completed' || student.id === currentId);
}
