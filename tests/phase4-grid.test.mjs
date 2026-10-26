import test from 'node:test';
import assert from 'node:assert/strict';
import { coerceGridValue, normalizeGridRows, validateGridCell, validateGridRows, editGridCell, gridDirtyCells, aggregateGridColumns, moveGridFocus } from '../js/logic/data-grid.js';

const columns = [
  { key: 'name', label: 'Name', type: 'text', required: true },
  { key: 'score', label: 'Score', type: 'number', min: 0, max: 100, required: true, aggregate: 'average' },
  { key: 'amount', label: 'Amount', type: 'currency', min: 0, aggregate: 'sum' },
  { key: 'status', label: 'Status', type: 'select', options: [{ value: 'draft', label: 'Draft' }, { value: 'ready', label: 'Ready' }] },
  { key: 'date', label: 'Date', type: 'date', min: '2026-01-01', max: '2026-12-31' }
];

function sample() {
  return [{ id: 'a', name: 'Avery', score: 80, amount: 12.5, status: 'draft', date: '2026-10-26' }, { id: 'b', name: 'Blair', score: 90, amount: 4.25, status: 'ready', date: null }];
}

test('grid normalization copies rows and preserves consumer identity without mutating input', () => {
  const input = [{ id: 'a', name: 'Avery', score: ' 0 ', amount: '$12.50', status: 'draft', date: '' }];
  const result = normalizeGridRows(input, columns);
  assert.notEqual(result, input);
  assert.notEqual(result[0], input[0]);
  assert.deepEqual(result[0], { id: 'a', name: 'Avery', score: 0, amount: 12.5, status: 'draft', date: null });
  assert.equal(input[0].score, ' 0 ');
  result[0].name = 'Updated';
  assert.equal(input[0].name, 'Avery');
});

test('cell editing is immutable and canonicalizes valid numeric values', () => {
  const before = sample();
  const after = editGridCell(before, columns, 0, 'score', '95.5');
  assert.equal(before[0].score, 80);
  assert.equal(after[0].score, 95.5);
  assert.equal(after[0].id, 'a');
  assert.notEqual(after[0], before[0]);
  assert.notEqual(after[1], before[1]);
  assert.equal(validateGridCell(columns[1], after[0].score), '');
});

test('invalid numeric edits remain available for correction without becoming zero or NaN', () => {
  for (const draft of ['not a number', '12px', 'Infinity', '1,23', '0x20']) {
    const after = editGridCell(sample(), columns, 0, 'score', draft);
    assert.equal(after[0].score, draft);
    assert.equal(validateGridRows(after, columns)[0].score, 'Enter a valid number.');
    assert.equal(aggregateGridColumns(after, columns).score.value, 90);
  }
});

test('numeric bounds are inclusive and never silently clamp retained edits', () => {
  assert.equal(validateGridCell(columns[1], 0), '');
  assert.equal(validateGridCell(columns[1], 100), '');
  const below = editGridCell(sample(), columns, 0, 'score', '-1');
  assert.equal(below[0].score, -1);
  assert.equal(validateGridRows(below, columns)[0].score, 'Minimum is 0.');
  assert.equal(aggregateGridColumns(below, columns).score.value, 90);
  const above = editGridCell(sample(), columns, 0, 'score', '101');
  assert.equal(above[0].score, 101);
  assert.equal(validateGridRows(above, columns)[0].score, 'Maximum is 100.');
});

test('required whitespace and optional empty values are distinct from numeric zero', () => {
  assert.equal(validateGridCell(columns[0], '  '), 'Name is required.');
  assert.equal(validateGridCell(columns[1], ''), 'Score is required.');
  assert.equal(validateGridCell(columns[1], 0), '');
  assert.equal(validateGridCell(columns[2], ''), '');
  assert.equal(coerceGridValue(columns[2], ''), null);
  assert.equal(coerceGridValue(columns[0], null), '');
  assert.equal(coerceGridValue({ key: 'name' }, undefined), '');
  assert.equal(coerceGridValue(columns[1], false), false);
  assert.equal(validateGridCell(columns[1], false), 'Enter a valid number.');
});

test('select validation retains option value types and rejects unknown options', () => {
  const column = { key: 'taxBps', label: 'Tax', type: 'select', required: true, options: [{ value: 0, label: 'No tax' }, { value: 900, label: '9%' }] };
  assert.equal(validateGridCell(column, 0), '');
  assert.equal(validateGridCell(column, 900), '');
  assert.equal(validateGridCell(column, '900'), 'Choose an available option.');
  assert.equal(validateGridCell(column, null), 'Tax is required.');
  assert.equal(validateGridCell(columns[3], null), '');
  assert.equal(validateGridCell(columns[3], 'deleted'), 'Choose an available option.');
});

test('date validation reuses strict ISO date math and inclusive bounds', () => {
  assert.equal(validateGridCell(columns[4], '2026-01-01'), '');
  assert.equal(validateGridCell(columns[4], '2026-12-31'), '');
  assert.equal(validateGridCell(columns[4], '2026-02-29'), 'Choose a valid date.');
  assert.equal(validateGridCell(columns[4], '2026-2-01'), 'Choose a valid date.');
  assert.equal(validateGridCell(columns[4], '2025-12-31'), 'Earliest date is 2026-01-01.');
  assert.equal(validateGridCell(columns[4], '2027-01-01'), 'Latest date is 2026-12-31.');
});

test('custom validation receives normalized value, updated row and row index', () => {
  const seen = [];
  const column = { key: 'score', label: 'Score', type: 'number', aggregate: 'sum', validate(value, row, index) { seen.push({ value, row, index }); return value > row.limit ? 'Score exceeds row limit.' : ''; } };
  const rows = [{ id: 'a', score: '10', limit: 20 }, { id: 'b', score: '40', limit: 30 }];
  assert.deepEqual(validateGridRows(rows, [column]), [{ score: '' }, { score: 'Score exceeds row limit.' }]);
  assert.equal(seen[0].value, 10);
  assert.equal(seen[0].row.score, 10);
  assert.equal(seen[1].row.id, 'b');
  assert.equal(seen[1].index, 1);
  assert.deepEqual(aggregateGridColumns(rows, [column]).score, { value: 10, count: 1, excluded: 1, aggregate: 'sum' });
  assert.equal(rows[0].score, '10');
});

test('custom validation supports false and null without swallowing actual error strings', () => {
  const column = { key: 'name', label: 'Name', type: 'text' };
  assert.equal(validateGridCell({ ...column, validate: () => false }, 'Avery'), 'Enter a valid Name.');
  assert.equal(validateGridCell({ ...column, validate: () => true }, 'Avery'), '');
  assert.equal(validateGridCell({ ...column, validate: () => null }, 'Avery'), '');
  assert.equal(validateGridCell({ ...column, validate: () => 'Use the saved student name.' }, 'Avery'), 'Use the saved student name.');
});

test('totals include only valid nonempty numbers, including zero', () => {
  const rows = sample().concat([
    { name: 'Casey', score: 0, amount: '$0.25' },
    { name: 'Drew', score: 'bad', amount: -2 },
    { name: 'Evan', score: 200, amount: 'bad' },
    { name: 'Flynn', score: null, amount: null }
  ]);
  const totals = aggregateGridColumns(rows, columns);
  assert.deepEqual(totals.score, { value: 170 / 3, count: 3, excluded: 3, aggregate: 'average' });
  assert.deepEqual(totals.amount, { value: 17, count: 3, excluded: 3, aggregate: 'sum' });
  assert.equal('name' in totals, false);
});

test('decimal sums avoid binary display artifacts and empty average remains absent', () => {
  const column = { key: 'amount', label: 'Amount', type: 'number', aggregate: 'sum' };
  assert.equal(aggregateGridColumns([{ amount: 0.1 }, { amount: 0.2 }], [column]).amount.value, 0.3);
  assert.deepEqual(aggregateGridColumns([], [column]).amount, { value: 0, count: 0, excluded: 0, aggregate: 'sum' });
  assert.equal(aggregateGridColumns([], [{ ...column, aggregate: 'average' }]).amount.value, null);
  assert.equal(aggregateGridColumns([{ amount: NaN }, { amount: Infinity }, { amount: 'bad' }], [column]).amount.value, 0);
});

test('overflow never leaks non-finite totals and large finite averages remain meaningful', () => {
  const sum = { key: 'amount', label: 'Amount', type: 'number', aggregate: 'sum' };
  const rows = [{ amount: 1e308 }, { amount: 1e308 }];
  assert.equal(aggregateGridColumns(rows, [sum]).amount.value, null);
  assert.equal(aggregateGridColumns(rows, [{ ...sum, aggregate: 'average' }]).amount.value, 1e308);
});

test('currency column parsing supports configured locale and major-unit currency', () => {
  const euro = { key: 'amount', label: 'Amount', type: 'currency', currency: 'EUR', locale: 'de-DE', aggregate: 'sum' };
  const sgd = { ...euro, currency: 'SGD', locale: 'en-SG' };
  assert.equal(coerceGridValue(euro, '1.234,50 €'), 1234.5);
  assert.equal(coerceGridValue(sgd, '$125.50'), 125.5);
  assert.equal(coerceGridValue(sgd, 'SGD 125.50'), 125.5);
  assert.equal(aggregateGridColumns([{ amount: '1.234,50 €' }, { amount: '0,50 €' }], [euro]).amount.value, 1235);
});

test('dirty-cell comparison handles canonical numeric strings and restoring saved values', () => {
  const saved = sample();
  const same = normalizeGridRows([{ ...saved[0], score: '80' }, saved[1]], columns);
  assert.equal(Object.values(gridDirtyCells(same, saved, columns)[0]).some(Boolean), false);
  let edited = editGridCell(saved, columns, 0, 'score', 'bad');
  assert.equal(gridDirtyCells(edited, saved, columns)[0].score, true);
  assert.equal(gridDirtyCells(edited, saved, columns)[0].name, false);
  edited = editGridCell(edited, columns, 0, 'score', saved[0].score);
  assert.equal(gridDirtyCells(edited, saved, columns)[0].score, false);
  assert.equal(gridDirtyCells(saved.concat([{ name: 'New' }]), saved, columns)[2].name, true);
});

test('grid navigation clamps edges and supports row boundary keys', () => {
  assert.deepEqual(moveGridFocus({ row: 1, column: 1 }, 'ArrowRight', 3, 3), { row: 1, column: 2 });
  assert.deepEqual(moveGridFocus({ row: 1, column: 1 }, 'ArrowLeft', 3, 3), { row: 1, column: 0 });
  assert.deepEqual(moveGridFocus({ row: 1, column: 1 }, 'ArrowDown', 3, 3), { row: 2, column: 1 });
  assert.deepEqual(moveGridFocus({ row: 1, column: 1 }, 'ArrowUp', 3, 3), { row: 0, column: 1 });
  assert.deepEqual(moveGridFocus({ row: 0, column: 0 }, 'ArrowLeft', 3, 3), { row: 0, column: 0 });
  assert.deepEqual(moveGridFocus({ row: 2, column: 2 }, 'ArrowDown', 3, 3), { row: 2, column: 2 });
  assert.deepEqual(moveGridFocus({ row: 1, column: 1 }, 'Home', 3, 3), { row: 1, column: 0 });
  assert.deepEqual(moveGridFocus({ row: 1, column: 1 }, 'End', 3, 3), { row: 1, column: 2 });
  assert.deepEqual(moveGridFocus({ row: 1, column: 1 }, '', 0, 0), { row: 0, column: 0 });
});

test('unknown edit targets fail without changing the original rows', () => {
  const rows = sample();
  assert.throws(() => editGridCell(rows, columns, -1, 'score', 20), RangeError);
  assert.throws(() => editGridCell(rows, columns, 2, 'score', 20), RangeError);
  assert.throws(() => editGridCell(rows, columns, 0.5, 'score', 20), RangeError);
  assert.throws(() => editGridCell(rows, columns, 0, 'missing', 20), RangeError);
  assert.equal(rows[0].score, 80);
});
