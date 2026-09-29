import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterReportStudents, reportStudentQueue } from '../src/lib/student-selection';
import type { Student } from '../src/lib/data-api';

test('legacy students remain active; status and search combine without selecting hidden students', () => {
  const students = [
    { id: 'a', name: '张同学', student_number: '01' },
    { id: 'b', name: '李同学', student_number: '02', enrollment_status: 'completed' },
    { id: 'c', name: 'Alice', student_number: '03', enrollment_status: 'active' },
  ] as Student[];
  assert.deepEqual(filterReportStudents(students, 'active', '').map(s => s.id), ['a', 'c']);
  assert.deepEqual(filterReportStudents(students, 'active', '李'), []);
  assert.deepEqual(filterReportStudents(students, 'completed', '02').map(s => s.id), ['b']);
  assert.equal(filterReportStudents(students, 'all', '').length, 3);
  assert.equal(filterReportStudents(students, 'active', ' ALICE ')[0].id, 'c');
  assert.deepEqual(reportStudentQueue(students, 'a,c,not-owned', 'a').map(s => s.id), ['a', 'c']);
  assert.deepEqual(reportStudentQueue(students, 'b', 'b').map(s => s.id), ['b']);
  assert.deepEqual(reportStudentQueue(students, '', 'b').map(s => s.id), ['b']);
  assert.deepEqual(reportStudentQueue(students, null, 'a').map(s => s.id), ['a', 'c']);
  assert.equal(reportStudentQueue(students, null, 'b').length, 3);
});
