export const attendanceStatuses = ['present', 'absent', 'late'];

/** Unmarked entries are counted, never silently treated as absent. Late counts as attended. */
export function attendanceSummary(entries = []) {
  if (!Array.isArray(entries)) throw new TypeError('Attendance entries must be an array.');
  const result = { present: 0, absent: 0, late: 0, unmarked: 0, total: entries.length, attendanceRate: 0 };
  for (const entry of entries) {
    const status = typeof entry === 'object' && entry !== null ? entry.status : entry;
    if (status === null || status === undefined || status === '') result.unmarked += 1;
    else if (attendanceStatuses.includes(status)) result[status] += 1;
    else throw new TypeError(`Unknown attendance status: ${String(status)}`);
  }
  if (result.total) result.attendanceRate = (result.present + result.late) / result.total * 100;
  return result;
}

export function validateGrade(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;
}

/** Missing grades do not become zero. Invalid entered scores must be corrected. */
export function gradeAverage(grades = []) {
  if (!Array.isArray(grades)) throw new TypeError('Grades must be an array.');
  const marked = grades.filter(value => value !== null && value !== undefined && value !== '');
  if (!marked.every(validateGrade)) throw new RangeError('Grades must be finite numbers from 0 to 100.');
  return marked.length ? marked.reduce((sum, value) => sum + value, 0) / marked.length : null;
}

/** Competition ranking: tied averages share rank, then the next position is skipped (1, 1, 3). */
export function rankGrades(rows = []) {
  if (!Array.isArray(rows)) throw new TypeError('Grade rows must be an array.');
  const averages = rows.map(row => ({ ...row, average: gradeAverage(row.grades) }));
  const ordered = averages.filter(row => row.average !== null).map(row => row.average).sort((a, b) => b - a);
  return averages.map(row => ({ ...row, rank: row.average === null ? null : ordered.indexOf(row.average) + 1 }));
}

export function gradeDistribution(rows = []) {
  const bands = [
    { label: '0–49', count: 0 }, { label: '50–64', count: 0 },
    { label: '65–79', count: 0 }, { label: '80–100', count: 0 }, { label: 'Ungraded', count: 0 }
  ];
  for (const row of rankGrades(rows)) {
    const value = row.average;
    const index = value === null ? 4 : value < 50 ? 0 : value < 65 ? 1 : value < 80 ? 2 : 3;
    bands[index].count += 1;
  }
  return bands;
}
