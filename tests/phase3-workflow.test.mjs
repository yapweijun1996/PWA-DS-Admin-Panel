import test from 'node:test';
import assert from 'node:assert/strict';
import { FILTER_OPERATORS, createFilterPredicate, summarizeFilters } from '../js/logic/filter.js';
import { CSVParseError, parseCSV, exportCSV } from '../js/logic/csv.js';
import { rankCommands, rememberCommand, loadRecentCommands, saveRecentCommands } from '../js/logic/command.js';
import { visibleTree, treeKeyboard } from '../js/logic/tree.js';
import { clampPaneWidths, resizePaneWidths, loadPaneWidths, savePaneWidths } from '../js/logic/layout.js';

function storage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}
const unavailableStorage = { getItem() { throw new Error('Denied'); }, setItem() { throw new Error('Quota'); } };

test('filter predicates combine conditions without changing source rows', () => {
  const rows = [{ name: 'Alpine', count: 10 }, { name: 'Beta', count: 4 }, { name: 'Alpha', count: 2 }];
  const conditions = [{ field: 'name', operator: 'startsWith', value: 'AL' }, { field: 'count', operator: 'gte', value: 5 }];
  assert.deepEqual(rows.filter(createFilterPredicate(conditions)), [rows[0]]);
  assert.deepEqual(rows.filter(createFilterPredicate(conditions, { match: 'any' })), [rows[0], rows[2]]);
  assert.equal(rows[0].name, 'Alpine');
  assert.equal(createFilterPredicate([])({}), true);
  assert.equal(createFilterPredicate([], { match: 'any' })({}), true);
});

test('filter string operators are case-insensitive and empty values are defined', () => {
  const check = (operator, actual, value) => createFilterPredicate([{ field: 'value', operator, value }])({ value: actual });
  for (const [operator, actual, value, expected] of [
    ['equals', 'Open', 'OPEN', true], ['notEquals', 'Open', 'closed', true],
    ['contains', 'North America', 'AMER', true], ['notContains', 'North', 'South', true],
    ['startsWith', 'North', 'no', true], ['endsWith', 'North', 'TH', true],
    ['contains', null, 'x', false], ['isEmpty', null, undefined, true],
    ['isEmpty', '   ', undefined, true], ['isNotEmpty', 0, undefined, true],
    ['isNotEmpty', false, undefined, true],
  ]) assert.equal(check(operator, actual, value), expected, operator);
  assert.equal(createFilterPredicate([{ field: 'missing', operator: 'isEmpty' }])({}), true);
});

test('filter numeric comparisons do not treat blanks or invalid numbers as zero', () => {
  for (const [operator, actual, value, expected] of [
    ['gt', 11, 10, true], ['gte', '10', 10, true], ['lt', 9, 10, true], ['lte', 10, 10, true],
    ['gt', 10, 10, false], ['gte', '', 0, false], ['lt', null, 3, false],
    ['gte', 'invalid', 0, false], ['lte', 1, Infinity, false],
  ]) assert.equal(createFilterPredicate([{ field: 'count', operator, value }])({ count: actual }), expected, `${operator}: ${actual}`);
});

test('filter summaries use labels and explicit conjunctions without phantom empty values', () => {
  assert.equal(summarizeFilters([]), 'All records');
  const filters = [{ field: 'status', operator: 'equals', value: 'Open' }, { field: 'owner', operator: 'isEmpty' }];
  assert.equal(summarizeFilters(filters, { fields: [{ key: 'status', label: 'Status' }] }), 'Status is "Open" AND owner is empty');
  assert.equal(summarizeFilters(filters, { match: 'any' }), 'status is "Open" OR owner is empty');
  for (const operator of Object.keys(FILTER_OPERATORS)) assert.ok(summarizeFilters([{ field: 'Value', operator, value: 3 }]).startsWith('Value '));
});

test('filter compilation rejects unsupported operators and snapshots conditions', () => {
  assert.throws(() => createFilterPredicate([{ field: 'name', operator: 'toString' }]), TypeError);
  assert.throws(() => summarizeFilters([{ field: '', operator: 'equals' }]), TypeError);
  assert.throws(() => createFilterPredicate([], { match: 'none' }), TypeError);
  const conditions = [{ field: 'name', operator: 'equals', value: 'Alpha' }];
  const predicate = createFilterPredicate(conditions);
  conditions[0].value = 'Beta';
  assert.equal(predicate({ name: 'Alpha' }), true);
});

test('CSV parses quoted commas, escaped quotes, CRLF and embedded line breaks', () => {
  assert.deepEqual(parseCSV('name,notes\r\n"A, Inc.","Said ""hello""\r\nNext line"\r\n'), [
    ['name', 'notes'], ['A, Inc.', 'Said "hello"\r\nNext line'],
  ]);
  assert.deepEqual(parseCSV('"one\ntwo",three\nfour,five'), [['one\ntwo', 'three'], ['four', 'five']]);
  assert.deepEqual(parseCSV('a,b\rc,d\r'), [['a', 'b'], ['c', 'd']]);
});

test('CSV preserves empty cells and handles BOM and terminal delimiters', () => {
  assert.deepEqual(parseCSV(''), []);
  assert.deepEqual(parseCSV('\uFEFFa,b\n'), [['a', 'b']]);
  assert.deepEqual(parseCSV(','), [['', '']]);
  assert.deepEqual(parseCSV('"",'), [['', '']]);
  assert.deepEqual(parseCSV('a,b\n\n'), [['a', 'b'], ['']]);
  assert.deepEqual(parseCSV('  value  ,x'), [['  value  ', 'x']]);
});

test('CSV malformed quote errors include actionable line and column', () => {
  for (const text of ['a,b\n"unclosed', 'a"b,c', '"a"tail,b']) {
    assert.throws(() => parseCSV(text), error => error instanceof CSVParseError && error.line >= 1 && error.column >= 1 && /line .*column/u.test(error.message));
  }
  assert.throws(() => parseCSV(123), TypeError);
  assert.throws(() => parseCSV('a,b\r\nx,"open'), error => error.line === 2 && error.column === 8);
});

test('CSV export round-trips quotes, newlines, commas and empty cells', () => {
  const rows = [['name', 'notes'], ['A, Inc.', 'A "quoted" note\nwith a new line'], ['', null]];
  const encoded = exportCSV(rows);
  assert.ok(encoded.includes('\r\n'));
  assert.deepEqual(parseCSV(encoded), [['name', 'notes'], ['A, Inc.', 'A "quoted" note\nwith a new line'], ['', '']]);
  assert.equal(exportCSV([]), '');
  assert.deepEqual(parseCSV(exportCSV([['']])), [['']]);
  assert.throws(() => exportCSV('rows'), TypeError);
});

test('CSV exports object columns in explicit order with readable headers', () => {
  assert.deepEqual(parseCSV(exportCSV([{ name: 'Ada', age: 30 }], { columns: [{ key: 'age', label: 'Age' }, { key: 'name', label: 'Full name' }] })), [['Age', 'Full name'], ['30', 'Ada']]);
  assert.deepEqual(parseCSV(exportCSV([{ name: 'Ada', active: false }])), [['name', 'active'], ['Ada', 'false']]);
  assert.deepEqual(parseCSV(exportCSV([], { columns: ['Name'] })), [['Name']]);
});

test('CSV export neutralizes spreadsheet formulas including whitespace prefixes', () => {
  const unsafe = ['=SUM(A1:A2)', '+1+1', '-1+1', '@SUM(A1)', '  =CMD()', '\t=CMD()', '\r=CMD()', '\n=CMD()'];
  const result = parseCSV(exportCSV([unsafe, [-12, 'ordinary', 'x=y', '123'] ]));
  assert.deepEqual(result[0], unsafe.map(value => `'${value}`));
  assert.deepEqual(result[1], ['-12', 'ordinary', 'x=y', '123']);
  assert.deepEqual(parseCSV(exportCSV([], { columns: ['=unsafe'] })), [["'=unsafe"]]);
});

const commands = [
  { id: 'substring', label: 'Go to Customer' },
  { id: 'keywords', label: 'Accounts', keywords: ['customer', 'billing'] },
  { id: 'prefix', label: 'Customer records' },
  { id: 'exact', label: 'Customer' },
  { id: 'disabled', label: 'Customer', disabled: true },
  { id: 'other', label: 'Settings', keywords: 'preferences appearance' },
];

test('commands rank exact, prefix, substring and keyword matches in that order', () => {
  assert.deepEqual(rankCommands(commands, ' CUSTOMER ').map(item => item.id), ['exact', 'prefix', 'substring', 'keywords']);
  assert.deepEqual(rankCommands(commands, 'billing').map(item => item.id), ['keywords']);
  assert.deepEqual(rankCommands(commands, 'appearance').map(item => item.id), ['other']);
  assert.deepEqual(rankCommands(commands, 'missing'), []);
  assert.deepEqual(rankCommands(commands, 'accounts billing').map(item => item.id), ['keywords']);
});

test('command recents break ranking ties but cannot displace stronger matches', () => {
  assert.deepEqual(rankCommands(commands, '', { recents: ['other', 'prefix'] }).map(item => item.id), ['other', 'prefix', 'substring', 'keywords', 'exact']);
  assert.equal(rankCommands(commands, 'Customer', { recents: ['keywords'] })[0].id, 'exact');
  const tied = [{ id: 'a', label: 'Alpha' }, { id: 'b', label: 'Another' }, { id: 'c', label: 'Again' }];
  assert.deepEqual(rankCommands(tied, 'a', { recents: ['c'] }).map(item => item.id), ['c', 'a', 'b']);
  assert.deepEqual(tied.map(item => item.id), ['a', 'b', 'c']);
});

test('command recent history deduplicates, caps and survives invalid storage', () => {
  assert.deepEqual(rememberCommand(['a', 'b', 'a'], 'b'), ['b', 'a']);
  assert.equal(rememberCommand(Array.from({ length: 12 }, (_, index) => String(index)), 'new').length, 8);
  assert.deepEqual(rememberCommand(['a'], 'b', 0), []);
  assert.deepEqual(loadRecentCommands(storage({ recent: '{broken' }), 'recent'), []);
  assert.deepEqual(loadRecentCommands(storage({ recent: '{"id":"a"}' }), 'recent'), []);
  assert.deepEqual(loadRecentCommands(unavailableStorage), []);
  const target = storage();
  assert.equal(saveRecentCommands(target, ['a', null, 'a', 'b'], 'recent'), true);
  assert.deepEqual(loadRecentCommands(target, 'recent'), ['a', 'b']);
  assert.equal(saveRecentCommands(unavailableStorage, ['a']), false);
});

const nodes = [
  { id: 'projects', label: 'Projects', children: [
    { id: 'alpha', label: 'Alpha', children: [{ id: 'file', label: 'File' }] },
    { id: 'beta', label: 'Beta', disabled: true },
  ] },
  { id: 'archive', label: 'Archive', children: [{ id: 'old', label: 'Old' }] },
  { id: 'settings', label: 'Settings' },
];
const treeState = (activeId = 'projects', expandedIds = []) => ({ activeId, expandedIds, selectedId: null });

test('tree visible rows expose hierarchy, sibling positions and expansion', () => {
  assert.deepEqual(visibleTree(nodes).map(item => item.id), ['projects', 'archive', 'settings']);
  const visible = visibleTree(nodes, ['projects', 'alpha']);
  assert.deepEqual(visible.map(item => item.id), ['projects', 'alpha', 'file', 'beta', 'archive', 'settings']);
  assert.deepEqual(visible[2], { node: nodes[0].children[0].children[0], id: 'file', parentId: 'alpha', level: 3, posInSet: 1, setSize: 1, hasChildren: false, expanded: false });
  assert.equal(visible[3].posInSet, 2);
  assert.equal(visible[3].setSize, 2);
  assert.equal(visible[0].expanded, true);
});

test('tree right expands then enters a child; left collapses then enters a parent', () => {
  const expanded = treeKeyboard(nodes, treeState(), 'ArrowRight');
  assert.deepEqual(expanded.expandedIds, ['projects']);
  assert.equal(expanded.activeId, 'projects');
  const child = treeKeyboard(nodes, expanded, 'ArrowRight');
  assert.equal(child.activeId, 'alpha');
  assert.equal(treeKeyboard(nodes, child, 'ArrowLeft').activeId, 'projects');
  const collapsed = treeKeyboard(nodes, expanded, 'ArrowLeft');
  assert.deepEqual(collapsed.expandedIds, []);
  assert.equal(treeKeyboard(nodes, collapsed, 'ArrowLeft').activeId, 'projects');
});

test('tree up/down and Home/End operate on visible nodes without boundary wrapping', () => {
  const state = treeState('projects', ['projects']);
  assert.equal(treeKeyboard(nodes, state, 'ArrowDown').activeId, 'alpha');
  assert.equal(treeKeyboard(nodes, state, 'ArrowUp').activeId, 'projects');
  assert.equal(treeKeyboard(nodes, state, 'End').activeId, 'settings');
  assert.equal(treeKeyboard(nodes, treeState('settings'), 'ArrowDown').activeId, 'settings');
  assert.equal(treeKeyboard(nodes, treeState('settings'), 'Home').activeId, 'projects');
  assert.equal(treeKeyboard([], treeState(), 'Home').handled, false);
  assert.equal(treeKeyboard(nodes, treeState('missing'), 'ArrowRight').activeId, 'projects');
});

test('tree selection, type-ahead and sibling expansion preserve caller state', () => {
  const state = treeState('projects');
  assert.equal(treeKeyboard(nodes, state, 'Enter').selectedId, 'projects');
  assert.equal(treeKeyboard(nodes, state, ' ').selectedId, 'projects');
  assert.equal(treeKeyboard(nodes, treeState('beta', ['projects']), 'Enter').selectedId, null);
  assert.equal(treeKeyboard(nodes, state, 'a').activeId, 'archive');
  assert.equal(treeKeyboard(nodes, treeState('archive'), 'a').activeId, 'archive');
  assert.equal(treeKeyboard(nodes, state, 'r', { typeahead: 'ar' }).activeId, 'archive');
  assert.deepEqual(treeKeyboard(nodes, state, '*').expandedIds, ['projects', 'archive']);
  assert.equal(treeKeyboard(nodes, state, 'Tab').handled, false);
  assert.deepEqual(state, treeState('projects'));
});

test('pane normalization clamps finite widths and fills available space within bounds', () => {
  assert.deepEqual(clampPaneWidths([20, 900], { minWidths: [100, 200], maxWidths: [300, 500] }), [100, 500]);
  assert.deepEqual(clampPaneWidths([NaN, Infinity], { minWidths: [100, 200] }), [100, 200]);
  assert.deepEqual(clampPaneWidths([100, 100, 100], { minWidths: [100, 100, 100], totalWidth: 900 }), [300, 300, 300]);
  assert.deepEqual(clampPaneWidths([500, 400], { minWidths: [100, 200], totalWidth: 500 }), [300, 200]);
  assert.deepEqual(clampPaneWidths([200, 200], { minWidths: [100, 100], maxWidths: [250, 300], totalWidth: 800 }), [250, 300]);
  assert.deepEqual(clampPaneWidths([], { totalWidth: 500 }), []);
});

test('pane constraints handle containers narrower than combined minima without overflow', () => {
  const widths = clampPaneWidths([400, 400, 400], { minWidths: [200, 300, 100], totalWidth: 300 });
  assert.deepEqual(widths, [100, 150, 50]);
  assert.equal(widths.reduce((sum, value) => sum + value, 0), 300);
  assert.deepEqual(clampPaneWidths([100, 100], { totalWidth: 0 }), [0, 0]);
});

test('pane divider resizing changes only its adjacent pair and respects both limits', () => {
  const options = { minWidths: [100, 150, 100], maxWidths: [400, 400, 400] };
  const widths = [250, 250, 200];
  assert.deepEqual(resizePaneWidths(widths, 0, 1000, options), [350, 150, 200]);
  assert.deepEqual(resizePaneWidths(widths, 0, -1000, options), [100, 400, 200]);
  assert.deepEqual(resizePaneWidths(widths, 1, 40, options), [250, 290, 160]);
  assert.deepEqual(resizePaneWidths(widths, -1, 20, options), widths);
  assert.deepEqual(resizePaneWidths(widths, 2, 20, options), widths);
  assert.deepEqual(widths, [250, 250, 200]);
});

test('pane width storage validates shape, clamps values and handles invalid JSON', () => {
  const defaults = [240, 600];
  const options = { minWidths: [180, 300], maxWidths: [400, 900] };
  for (const saved of ['{broken', 'null', '{}', '[200]', '["200",600]', '[null,600]']) {
    assert.deepEqual(loadPaneWidths(storage({ layout: saved }), 'layout', defaults, options), defaults);
  }
  assert.deepEqual(loadPaneWidths(storage({ layout: '[10,2000]' }), 'layout', defaults, options), [180, 900]);
  assert.deepEqual(loadPaneWidths(unavailableStorage, 'layout', defaults, options), defaults);
  const target = storage();
  assert.equal(savePaneWidths(target, 'layout', [10, 2000], options), true);
  assert.deepEqual(loadPaneWidths(target, 'layout', defaults, options), [180, 900]);
  assert.equal(savePaneWidths(unavailableStorage, 'layout', defaults, options), false);
});
