import { element, button, statusMessage, onDetach, openModal } from '../../../components/playground.js';
import { createListingLayout } from '../../../components/listing-layout.js';
import { createDetailLayout } from '../../../components/detail-layout.js';
import { createCard } from '../../../components/card.js';
import { createPill } from '../../../components/pill.js';
import { createCombobox } from '../../../components/combobox.js';
import { createFormField } from '../../../components/form-field.js';
import { createTable } from '../../../components/table.js';
import { createPagination } from '../../../components/pagination.js';
import { createDescriptionList } from '../../../components/description-list.js';
import { createTabs } from '../../../components/tabs.js';
import { createChart } from '../../../components/chart.js';
import { createRadioGroup } from '../../../components/radio-group.js';
import { createDatePicker } from '../../../components/date-picker.js';
import { createDataGrid } from '../../../components/data-grid.js';
import { createCalendar } from '../../../components/calendar.js';
import { createUnsavedChangesGuard } from '../../../components/unsaved-changes-guard.js';
import { openConfirmDialog } from '../../../components/confirm-dialog.js';
import { openExportDialog } from '../../../components/export-dialog.js';
import { createEmptyState } from '../../../components/empty-state.js';
import { createErrorState } from '../../../components/error-state.js';
import { createSpinner } from '../../../components/spinner.js';
import { attendanceStatuses, attendanceSummary, validateGrade, gradeAverage, rankGrades, gradeDistribution } from '../../logic/school.js';

const classes = ['7A', '7B', '8A'];
const assignments = ['assignment1', 'assignment2', 'assignment3'];
const assignmentLabels = ['Algebra quiz', 'Geometry task', 'Term project'];
const studentData = [
  ['STU-001', 'Ava Chen', '7A', 'Active', 'Mira Chen', [88, 92, 90]],
  ['STU-002', 'Noah Tan', '7A', 'Active', 'Daniel Tan', [80, 84, 82]],
  ['STU-003', 'Mia Patel', '7A', 'Active', 'Riya Patel', [95, 90, 85]],
  ['STU-004', 'Ethan Lim', '7A', 'On leave', 'Grace Lim', [64, 72, 68]],
  ['STU-005', 'Sofia Wong', '7B', 'Active', 'Leon Wong', [78, 80, 82]],
  ['STU-006', 'Lucas Lee', '7B', 'Active', 'Jia Lee', [92, 94, 90]],
  ['STU-007', 'Isla Rahman', '7B', 'On leave', 'Amir Rahman', [58, 62, 60]],
  ['STU-008', 'Oliver Koh', '8A', 'Active', 'Mei Koh', [85, 87, 89]],
  ['STU-009', 'Amelia Goh', '8A', 'Active', 'Kai Goh', [72, 76, 74]]
];
const students = studentData.map(([id, name, className, status, guardian, grades], index) => ({ id, name, className, status, guardian, grades, email: `${name.toLowerCase().replaceAll(' ', '.')}@school.example`, guardianEmail: `${guardian.toLowerCase().replaceAll(' ', '.')}@example.com`, phone: `+65 6000 ${String(index + 1).padStart(4, '0')}` }));
let savedGrades = initialGrades();
let savedAttendance = {};
function initialGrades() { return Object.fromEntries(students.map(student => [student.id, [...student.grades]])); }
const lessonData = [
  ['mon-math', 'Mathematics', '2026-10-26', '09:00', '7A', 'Ms Rivera', 'Room 201'],
  ['mon-science', 'Science', '2026-10-26', '11:00', '7B', 'Mr Hassan', 'Science lab'],
  ['tue-english', 'English', '2026-10-27', '10:00', '7A', 'Ms Chen', 'Room 104'],
  ['tue-math', 'Mathematics', '2026-10-27', '13:00', '8A', 'Ms Rivera', 'Room 201'],
  ['wed-science', 'Science', '2026-10-28', '09:00', '7A', 'Mr Hassan', 'Science lab'],
  ['wed-english', 'English', '2026-10-28', '11:00', '7B', 'Ms Chen', 'Room 104'],
  ['thu-math', 'Mathematics', '2026-10-29', '10:00', '7B', 'Ms Rivera', 'Room 201'],
  ['thu-english', 'English', '2026-10-29', '13:00', '8A', 'Ms Chen', 'Room 104'],
  ['fri-science', 'Science', '2026-10-30', '09:00', '8A', 'Mr Hassan', 'Science lab'],
  ['fri-advisory', 'Class advisory', '2026-10-30', '11:00', '7A', 'Ms Rivera', 'Room 201']
].map(([id, subject, date, time, className, teacher, room]) => ({ id, title: `${className} · ${subject} · ${teacher}`, subject, date, time, className, teacher, room, status: subject === 'Science' ? 'info' : subject === 'Class advisory' ? 'warning' : 'success' }));

const titleCase = value => value.charAt(0).toUpperCase() + value.slice(1);
const formatScore = value => value === null ? 'Ungraded' : new Intl.NumberFormat('en', { maximumFractionDigits: 2 }).format(value);
const stack = (...nodes) => element('div', { className: 'school-stack' }, ...nodes);
const toolbar = (...nodes) => element('div', { className: 'school-toolbar' }, ...nodes);
function table(caption, labels, rows, onRowActivate) {
  return createTable({ caption, header: element('tr', {}, ...labels.map(label => element('th', { scope: 'col' }, label))), body: element('tbody', {}, ...rows.map(cells => element('tr', {}, ...cells.map(cell => element('td', {}, cell))))), onRowActivate });
}
function classChoice(label, value, onChange, all = false) {
  return createCombobox({ label, value, clearable: false, options: [...(all ? [{ value: 'all', label: 'All classes' }] : []), ...classes.map(item => ({ value: item, label: `Class ${item}` }))], onChange });
}
function pageHeader(title, description, actions) {
  return element('header', { className: 'school-page-heading' }, element('div', {}, element('h1', { className: 'page-title' }, title), element('p', { className: 'page-subtitle' }, description)), toolbar(createPill({ label: 'Mock data', tone: 'info', dot: true }), actions));
}
/** Each dataset has deliberately selectable local loading/empty/error states. */
function stateDemo(label, onChange) {
  const choice = createCombobox({ label: `${label} demo state`, value: 'normal', clearable: false, options: ['normal', 'loading', 'empty', 'error'].map(value => ({ value, label: value === 'normal' ? 'Normal mock data' : `${titleCase(value)} (demo)` })), onChange });
  return choice;
}
function datasetState(mode, label, restore) {
  if (mode === 'loading') return createCard({ content: stack(createSpinner({ label: `Loading mock ${label}…` }), element('p', {}, 'Deliberate demo state. No network request is running.'), button('Finish mock loading', restore)) });
  if (mode === 'error') return createErrorState({ title: `Mock ${label} could not load`, description: 'Simulated failure. Retry restores the local dataset without changing saved data.', onRetry: restore });
  return createEmptyState({ title: `No ${label}`, description: 'No mock records match this view. Restore the dataset or adjust the filters.', actionLabel: 'Restore mock view', onAction: restore });
}

function renderStudents() {
  let query = '', selectedClass = 'all', mode = 'normal', page = 1;
  const results = element('div');
  const summary = statusMessage();
  const search = element('input', { type: 'search', className: 'ds-input', placeholder: 'Search name, student ID, or guardian', oninput: event => { query = event.target.value; page = 1; update(); } });
  const classFilter = classChoice('Student class', selectedClass, value => { selectedClass = value; page = 1; update(); }, true);
  const demo = stateDemo('Students', value => { mode = value; page = 1; update(); });
  const pager = createPagination({ total: students.length, pageSize: 5, onPageChange: value => { page = value; update(); } });
  function restore() { query = ''; search.value = ''; selectedClass = 'all'; classFilter.setValue('all'); mode = 'normal'; demo.setValue('normal'); page = 1; update(); }
  function update() {
    const matching = students.filter(student => (selectedClass === 'all' || student.className === selectedClass) && `${student.id} ${student.name} ${student.guardian}`.toLowerCase().includes(query.trim().toLowerCase()));
    const visible = matching.slice((page - 1) * 5, page * 5);
    summary.textContent = `${mode === 'normal' ? matching.length : 0} mock students · activate a row to view the student profile.`;
    pager.setState({ total: mode === 'normal' ? matching.length : 0, page, disabled: mode !== 'normal' });
    results.replaceChildren(mode !== 'normal' || !matching.length ? datasetState(mode, 'students', restore) : table('Mock student directory. Activate a student row for their profile.', ['Student', 'Student ID', 'Class', 'Status', 'Guardian'], visible.map(student => [element('a', { href: `#/examples/school/student/${student.id}` }, student.name), student.id, student.className, createPill({ label: student.status, tone: student.status === 'Active' ? 'success' : 'warning', dot: true }), student.guardian]), index => { location.hash = `/examples/school/student/${visible[index].id}`; }));
  }
  const layout = createListingLayout({ header: pageHeader('Students', 'A searchable, local student directory. No real student records or server writes.'), summary, toolbar: toolbar(createFormField({ label: 'Search students', control: search }).element, classFilter.element, demo.element, button('Clear filters', restore)), table: results, pagination: pager.element });
  update(); return layout;
}

function renderStudent(id) {
  const student = students.find(item => item.id === id);
  if (!student) return createEmptyState({ title: 'Mock student not found', description: 'Choose an existing student from the directory.', actionLabel: 'View students', onAction: () => { location.hash = '/examples/school/students'; } });
  const gradeValues = savedGrades[student.id];
  const history = [
    { date: '2026-10-19', status: 'present' }, { date: '2026-10-20', status: 'present' },
    { date: '2026-10-21', status: 'late' }, { date: '2026-10-22', status: 'absent' }, { date: '2026-10-23', status: 'present' }
  ];
  const records = element('div');
  let mode = 'normal';
  const demo = stateDemo('Student profile records', value => { mode = value; update(); });
  function update() {
    records.replaceChildren(mode !== 'normal' ? datasetState(mode, 'student records', () => { mode = 'normal'; demo.setValue('normal'); update(); }) : createTabs({ label: `${student.name} profile sections`, items: [
      { label: 'Profile', content: stack(createDescriptionList({ items: [{ term: 'Student ID', value: student.id }, { term: 'Class', value: student.className }, { term: 'School email (mock)', value: student.email }, { term: 'Enrollment', value: '2026 academic year' }] }), createCard({ title: 'Guardian contacts', content: table('Mock guardian contacts', ['Name', 'Relationship', 'Email', 'Telephone'], [[student.guardian, 'Guardian', element('a', { href: `mailto:${student.guardianEmail}` }, student.guardianEmail), student.phone]]) })) },
      { label: 'Attendance', content: stack(createChart({ type: 'sparkline', title: 'Mock daily attendance · 100 = present/late, 0 = absent', labels: history.map(item => item.date), series: [{ name: 'Attended (%)', values: history.map(item => item.status === 'absent' ? 0 : 100) }], formatValue: value => `${value}%` }), table('Mock attendance history', ['Date', 'Status'], history.map(item => [item.date, createPill({ label: titleCase(item.status), tone: item.status === 'present' ? 'success' : item.status === 'late' ? 'warning' : 'danger' })]))) },
      { label: 'Grades', content: stack(createChart({ type: 'line', title: 'Mock Mathematics grades', labels: assignmentLabels, series: [{ name: 'Score / 100', values: gradeValues }] }), table('Mock assignment results', ['Assignment', 'Score / 100'], assignmentLabels.map((label, index) => [label, formatScore(gradeValues[index])])), element('p', {}, `Average: ${formatScore(gradeAverage(gradeValues))} / 100`)) }
    ] }));
  }
  update();
  return createDetailLayout({ header: pageHeader(student.name, `${student.id} · Class ${student.className} · Mock student profile`, createPill({ label: student.status, tone: student.status === 'Active' ? 'success' : 'warning' })), summary: demo.element, tabs: records, sidePanel: createCard({ title: 'School context', content: createDescriptionList({ items: [{ term: 'Academic year', value: '2026' }, { term: 'Class tutor', value: 'Ms Rivera (mock)' }, { term: 'Privacy', value: 'Fictional records. Changes remain in this browser session.' }] }) }) });
}

function renderAttendance() {
  let selectedClass = '7A', date = '2026-10-26', mode = 'normal', dirty = false;
  let roster = [], draft = {}, saved = {};
  const content = element('div');
  const notice = statusMessage('Choose statuses, then save the mock attendance sheet.');
  const chart = createChart({ type: 'donut', title: 'Mock attendance summary', labels: ['Present', 'Absent', 'Late', 'Unmarked'], series: [{ name: 'Students', values: [] }] });
  let radios = [];
  function key() { return `${selectedClass}:${date}`; }
  function load() {
    roster = students.filter(student => student.className === selectedClass);
    saved = { ...Object.fromEntries(roster.map((student, index) => [student.id, index === 1 ? 'late' : index === 3 ? 'absent' : 'present'])), ...savedAttendance[key()] };
    draft = { ...saved }; dirty = false; drawRoster(); sync();
  }
  function sync() {
    dirty = roster.some(student => draft[student.id] !== saved[student.id]);
    const summary = attendanceSummary(roster.map(student => draft[student.id]));
    chart.update({ series: [{ name: 'Students', values: [summary.present, summary.absent, summary.late, summary.unmarked] }] });
    save.disabled = !dirty || mode !== 'normal';
    markAll.disabled = mode !== 'normal';
    notice.textContent = `${selectedClass} · ${date} · ${summary.present} present, ${summary.absent} absent, ${summary.late} late. ${dirty ? 'Unsaved mock changes.' : 'No unsaved changes.'}`;
  }
  function persist() {
    const summary = attendanceSummary(roster.map(student => draft[student.id]));
    if (summary.unmarked) throw new Error('Mark every student before saving.');
    saved = { ...draft }; savedAttendance[key()] = { ...draft }; dirty = false; sync();
    notice.textContent = `Mock attendance saved for ${selectedClass} on ${date}. Stored for this session only.`;
  }
  function confirmSave() {
    return new Promise(resolve => {
      let confirmed = false;
      openConfirmDialog({ title: 'Save mock attendance?', description: `Save ${roster.length} student attendance marks for class ${selectedClass} on ${date}? This only changes session data.`, confirmLabel: 'Save attendance', onConfirm: () => { persist(); confirmed = true; }, onClose: () => resolve(confirmed) });
    });
  }
  const guard = createUnsavedChangesGuard({ isDirty: () => dirty, onSave: persist, onDiscard: () => { draft = { ...saved }; radios.forEach(({ student, control }) => control.setValue(draft[student.id])); sync(); }, description: 'Save this mock attendance sheet, discard its changes, or keep editing before changing the class, date or page.' });
  const classFilter = classChoice('Attendance class', selectedClass, async value => { if (await guard.resolve()) { selectedClass = value; load(); } else classFilter.setValue(selectedClass); });
  const datePicker = createDatePicker({ label: 'Attendance date', value: date, required: true, clearable: false, onChange: async value => { if (await guard.resolve()) { date = value; load(); } else datePicker.setValue(date); } });
  const demo = stateDemo('Attendance roster', value => { mode = value; drawRoster(); sync(); });
  const markAll = button('Mark all present', () => { roster.forEach(student => { draft[student.id] = 'present'; }); radios.forEach(({ control }) => control.setValue('present')); sync(); });
  const save = button('Save attendance', confirmSave, 'primary');
  function drawRoster() {
    if (mode !== 'normal') { content.replaceChildren(datasetState(mode, 'attendance records', () => { mode = 'normal'; demo.setValue('normal'); drawRoster(); sync(); })); return; }
    radios = roster.map(student => ({ student, control: createRadioGroup({ label: `${student.name} · ${student.id}`, value: draft[student.id], required: true, options: attendanceStatuses.map(value => ({ value, label: titleCase(value) })), onChange: value => { draft[student.id] = value; sync(); } }) }));
    content.replaceChildren(table(`Mock attendance roster · Class ${selectedClass} · ${date}`, ['Student', 'Attendance status'], radios.map(({ student, control }) => [element('a', { href: `#/examples/school/student/${student.id}` }, student.name), control.element])));
  }
  const layout = createListingLayout({ header: pageHeader('Attendance sheet', 'Mark the class roster for a chosen date. Present and Late both count as attended.', save), summary: notice, toolbar: toolbar(classFilter.element, datePicker.element, demo.element, markAll), table: content, detail: chart });
  load(); onDetach(layout, guard.destroy); return layout;
}

function renderGradebook() {
  let selectedClass = '7A', mode = 'normal', grid, dirty = false;
  const gridHost = element('div');
  const summaryHost = element('div');
  const notice = statusMessage();
  const distribution = createChart({ type: 'bar', title: 'Mock class grade distribution', labels: [], series: [] });
  const exportButton = button('Export CSV', () => {
    if (!grid.isValid()) { notice.textContent = 'Correct invalid scores before exporting.'; return; }
    const rows = compute().map(row => ({ student: row.name, id: row.id, className: selectedClass, ...Object.fromEntries(assignments.map((key, index) => [key, row.grades[index]])), average: row.average, rank: row.rank }));
    openExportDialog({ rows, filename: `mock-gradebook-${selectedClass}`, title: 'Export mock class gradebook', columns: [{ key: 'student', label: 'Student' }, { key: 'id', label: 'Student ID' }, { key: 'className', label: 'Class' }, ...assignments.map((key, index) => ({ key, label: assignmentLabels[index] })), { key: 'average', label: 'Average' }, { key: 'rank', label: 'Rank' }] });
  });
  const save = button('Save grades', () => openConfirmDialog({ title: 'Save mock grades?', description: `Save assignment scores for class ${selectedClass} in this session?`, confirmLabel: 'Save grades', onConfirm: persist }), 'primary');
  function persist() {
    if (!grid.isValid()) throw new Error('Correct invalid scores before saving.');
    for (const row of grid.getRows()) savedGrades[row.id] = assignments.map(key => row[key]);
    grid.markSaved(); dirty = false; sync(); notice.textContent = `Mock grades saved for ${selectedClass}. Session data only.`;
  }
  const guard = createUnsavedChangesGuard({ isDirty: () => dirty, onSave: persist, onDiscard: () => { load(); }, description: 'Save the mock gradebook, discard edits, or keep editing before changing classes or leaving.' });
  const classFilter = classChoice('Gradebook class', selectedClass, async value => { if (await guard.resolve()) { selectedClass = value; load(); } else classFilter.setValue(selectedClass); });
  const demo = stateDemo('Gradebook', value => { mode = value; show(); });
  function compute() { return rankGrades(grid.getRows().map(row => ({ id: row.id, name: row.student, grades: assignments.map(key => row[key]) }))); }
  function sync() {
    const valid = grid.isValid();
    save.disabled = !dirty || !valid || mode !== 'normal'; exportButton.disabled = !valid || mode !== 'normal';
    notice.textContent = `${selectedClass} · ${dirty ? 'Unsaved mock grade changes.' : 'No unsaved grade changes.'} ${valid ? 'Scores are 0–100. Equal unrounded averages share competition rank (1, 1, 3).' : 'Correct highlighted invalid scores. Average, rank, distribution and export are unavailable until valid.'}`;
    if (!valid) { summaryHost.replaceChildren(element('p', { role: 'status' }, 'Calculated results paused until all scores are valid.')); distribution.update({ labels: [], series: [] }); return; }
    const ranked = compute();
    summaryHost.replaceChildren(table('Computed mock class averages and competition ranks', ['Student', 'Average / 100', 'Class rank'], ranked.map(row => [row.name, formatScore(row.average), row.rank ?? 'Unranked'])));
    const bands = gradeDistribution(ranked);
    distribution.update({ labels: bands.map(band => band.label), series: [{ name: 'Students', values: bands.map(band => band.count) }] });
  }
  function show() {
    gridHost.hidden = mode !== 'normal'; summaryHost.hidden = mode !== 'normal'; distribution.hidden = mode !== 'normal';
    stateHost.replaceChildren(...(mode === 'normal' ? [] : [datasetState(mode, 'gradebook records', () => { mode = 'normal'; demo.setValue('normal'); show(); })])); sync();
  }
  const stateHost = element('div');
  function load() {
    dirty = false;
    grid = undefined;
    grid = createDataGrid({ label: `Mock Mathematics gradebook · Class ${selectedClass}`, columns: [
      { key: 'student', label: 'Student', type: 'text', required: true, validate: (value, row) => students.find(student => student.id === row?.id)?.name === value ? '' : 'Student names are fixed mock roster identities.' },
      ...assignments.map((key, index) => ({ key, label: `${assignmentLabels[index]} / 100`, type: 'number', min: 0, max: 100, required: true, aggregate: 'average', validate: value => validateGrade(value) ? '' : 'Enter a score from 0 to 100.' }))
    ], rows: students.filter(student => student.className === selectedClass).map(student => ({ id: student.id, student: student.name, ...Object.fromEntries(assignments.map((key, index) => [key, savedGrades[student.id][index]])) })), onChange: () => { if (grid) sync(); }, onDirtyChange: value => { dirty = value; if (grid) sync(); } });
    gridHost.replaceChildren(grid.element); show();
  }
  const layout = createListingLayout({ header: pageHeader('Gradebook', 'Mathematics · Three equally weighted assignments. Edit cells with Enter; Escape cancels an edit.', toolbar(exportButton, save)), summary: notice, toolbar: toolbar(classFilter.element, demo.element), table: stack(gridHost, stateHost, createCard({ title: 'Computed averages and ranks', content: summaryHost }), distribution) });
  load(); onDetach(layout, guard.destroy); return layout;
}

function renderTimetable() {
  let selectedClass = 'all', teacher = 'all', mode = 'normal';
  const notice = statusMessage('Mock lessons for the week beginning 26 October 2026.');
  const content = element('div');
  const calendar = createCalendar({ date: '2026-10-26', view: 'week', locale: 'en-GB', events: lessonData, onSelectDate: value => { notice.textContent = `Selected ${value}. Lessons are mock and read-only.`; }, onSelectEvent: event => { const lesson = lessonData.find(item => item.id === event.id); if (!lesson) return; openModal({ title: `${lesson.subject} · Class ${lesson.className} (mock)`, content: createDescriptionList({ items: [{ term: 'Date', value: lesson.date }, { term: 'Time', value: lesson.time }, { term: 'Teacher', value: lesson.teacher }, { term: 'Room', value: lesson.room }] }), actions: [{ label: 'Close lesson', onClick: close => close() }] }); } });
  const classFilter = classChoice('Timetable class', selectedClass, value => { selectedClass = value; update(); }, true);
  const teacherFilter = createCombobox({ label: 'Teacher', value: teacher, clearable: false, options: [{ value: 'all', label: 'All teachers' }, ...[...new Set(lessonData.map(item => item.teacher))].map(value => ({ value, label: value }))], onChange: value => { teacher = value; update(); } });
  const demo = stateDemo('Timetable lessons', value => { mode = value; update(); });
  function restore() { selectedClass = 'all'; teacher = 'all'; mode = 'normal'; classFilter.setValue('all'); teacherFilter.setValue('all'); demo.setValue('normal'); update(); }
  function update() {
    const events = lessonData.filter(lesson => (selectedClass === 'all' || lesson.className === selectedClass) && (teacher === 'all' || lesson.teacher === teacher));
    calendar.setEvents(events);
    calendar.element.hidden = mode !== 'normal' || !events.length;
    const state = content.querySelector('[data-school-timetable-state]');
    state.replaceChildren(...(mode !== 'normal' || !events.length ? [datasetState(mode, 'matching lessons', restore)] : []));
    notice.textContent = `${mode === 'normal' ? events.length : 0} matching mock lessons · Class: ${selectedClass === 'all' ? 'All' : selectedClass} · Teacher: ${teacher === 'all' ? 'All' : teacher}. Calendar navigation changes the displayed week.`;
  }
  content.append(calendar.element, element('div', { 'data-school-timetable-state': '' }));
  update(); return createListingLayout({ header: pageHeader('Timetable', 'Weekly mock lessons. Filter by class and teacher; activate a lesson for its room and details.'), summary: notice, toolbar: toolbar(classFilter.element, teacherFilter.element, demo.element, button('Clear filters', restore)), table: content });
}

export function render(container, { screen = 'students', id } = {}) {
  const root = element('section', { className: 'school-example', 'aria-label': 'School product example' });
  const current = screen || 'students';
  const nav = element('nav', { className: 'school-navigation', 'aria-label': 'School examples' }, ...[
    ['students', 'Students', '/examples/school/students'], ['student', 'Student profile', '/examples/school/student/STU-001'], ['attendance', 'Attendance', '/examples/school/attendance'], ['gradebook', 'Gradebook', '/examples/school/gradebook'], ['timetable', 'Timetable', '/examples/school/timetable']
  ].map(([key, label, path]) => element('a', { href: `#${path}`, 'aria-current': key === current ? 'page' : undefined }, label)));
  const notice = element('p', { className: 'school-mock-notice' }, 'Mock data · Fictional students and lessons. All saved changes are session-only; reload restores defaults.');
  const body = element('div');
  const reset = button('Reset demo data', () => openConfirmDialog({ title: 'Reset all School demo data?', description: 'Discard unsaved edits and restore every mock attendance sheet and grade to the original values. This affects only the School example in this browser session.', destructive: true, confirmLabel: 'Reset School data', onConfirm: () => { savedGrades = initialGrades(); savedAttendance = {}; render(container, { screen: current, id }); } }));
  root.append(toolbar(nav, reset), notice, body);
  container.replaceChildren(root);
  const screens = { students: renderStudents, student: () => renderStudent(id || 'STU-001'), attendance: renderAttendance, gradebook: renderGradebook, timetable: renderTimetable };
  body.append((screens[current] || renderStudents)());
  return root;
}
