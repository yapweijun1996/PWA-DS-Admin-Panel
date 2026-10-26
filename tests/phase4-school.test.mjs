import test from 'node:test';
import assert from 'node:assert/strict';
import { attendanceSummary, validateGrade, gradeAverage, rankGrades, gradeDistribution } from '../js/logic/school.js';

test('attendance summary counts every status and late contributes to attendance rate', () => {
  const entries = [{ status: 'present' }, { status: 'absent' }, { status: 'late' }, { status: 'present' }];
  assert.deepEqual(attendanceSummary(entries), { present: 2, absent: 1, late: 1, unmarked: 0, total: 4, attendanceRate: 75 });
  assert.equal(entries[0].status, 'present');
});

test('attendance handles empty and unmarked rosters without NaN or invented absences', () => {
  assert.deepEqual(attendanceSummary(), { present: 0, absent: 0, late: 0, unmarked: 0, total: 0, attendanceRate: 0 });
  assert.deepEqual(attendanceSummary([null, undefined, '', { status: null }, 'present']), { present: 1, absent: 0, late: 0, unmarked: 4, total: 5, attendanceRate: 20 });
  assert.throws(() => attendanceSummary(['Present']), TypeError);
  assert.throws(() => attendanceSummary(['excused']), TypeError);
  assert.throws(() => attendanceSummary({}), TypeError);
});

test('grade validation includes exact bounds and rejects nonfinite, strings and out-of-range values', () => {
  for (const score of [0, 0.5, 50, 99.99, 100]) assert.equal(validateGrade(score), true);
  for (const score of [-0.1, 100.01, NaN, Infinity, -Infinity, '90', '', null, undefined, true]) assert.equal(validateGrade(score), false);
});

test('averages exclude missing scores but retain genuine zero and decimal scores', () => {
  assert.equal(gradeAverage([0, 100]), 50);
  assert.equal(gradeAverage([null, 80, undefined, '', 90]), 85);
  assert.equal(gradeAverage([90.5, 91.5]), 91);
  assert.equal(gradeAverage([]), null);
  assert.equal(gradeAverage([null, undefined, '']), null);
  for (const score of [-1, 101, NaN, Infinity, '85']) assert.throws(() => gradeAverage([score]), RangeError);
  assert.throws(() => gradeAverage({}), TypeError);
});

test('competition ranks preserve input order and share ties without rounding scores', () => {
  const rows = [{ id: 'a', grades: [80, 100] }, { id: 'b', grades: [70, 80] }, { id: 'c', grades: [90, 90] }, { id: 'd', grades: [] }, { id: 'e', grades: [89.999] }];
  const ranked = rankGrades(rows);
  assert.deepEqual(ranked.map(({ id, average, rank }) => ({ id, average, rank })), [
    { id: 'a', average: 90, rank: 1 }, { id: 'b', average: 75, rank: 4 },
    { id: 'c', average: 90, rank: 1 }, { id: 'd', average: null, rank: null }, { id: 'e', average: 89.999, rank: 3 }
  ]);
  assert.equal('average' in rows[0], false);
  assert.deepEqual(rankGrades([]), []);
  assert.deepEqual(rankGrades([{ id: 'none', grades: [] }]).map(row => row.rank), [null]);
  assert.throws(() => rankGrades([{ grades: [101] }]), RangeError);
});

test('class distribution applies unrounded boundary ranges and includes ungraded students', () => {
  const rows = [0, 49.99, 50, 64.99, 65, 79.99, 80, 100, null].map((score, index) => ({ id: index, grades: score === null ? [] : [score] }));
  assert.deepEqual(gradeDistribution(rows).map(band => band.count), [2, 2, 2, 2, 1]);
  assert.deepEqual(gradeDistribution([]).map(band => band.count), [0, 0, 0, 0, 0]);
});
