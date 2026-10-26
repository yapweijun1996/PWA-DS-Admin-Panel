import test from 'node:test';
import assert from 'node:assert/strict';
import { snapshotKanbanCards, moveKanbanCard, beginKanbanMove, updateKanbanMove, finishKanbanMove, summarizeKanbanColumns } from '../js/logic/kanban.js';

const columns = [{ id: 'lead', label: 'Lead' }, { id: 'proposal', label: 'Proposal' }, { id: 'won', label: 'Won' }];
const cards = [{ id: 'a', column: 'lead', title: 'Acme', value: 1200 }, { id: 'b', column: 'lead', title: 'Beta', value: 800 }, { id: 'c', column: 'proposal', title: 'Cedar', value: 0 }, { id: 'd', column: 'proposal', title: 'Delta' }];
const ids = (items, column) => items.filter(card => card.column === column).map(card => card.id);

test('Kanban moves a card between columns at an explicit position without mutation', () => {
  const input = cards.map(card => Object.freeze({ ...card }));
  Object.freeze(input);
  const result = moveKanbanCard(input, columns, 'a', 'proposal', 1);
  assert.deepEqual(ids(result, 'lead'), ['b']);
  assert.deepEqual(ids(result, 'proposal'), ['c', 'a', 'd']);
  assert.equal(result.find(card => card.id === 'a').value, 1200);
  assert.equal(input[0].column, 'lead');
  assert.notEqual(result.find(card => card.id === 'b'), input[1]);
});

test('Kanban moves within a column use positions after removing the card', () => {
  const down = moveKanbanCard(cards, columns, 'a', 'lead', 1);
  assert.deepEqual(ids(down, 'lead'), ['b', 'a']);
  const up = moveKanbanCard(down, columns, 'a', 'lead', 0);
  assert.deepEqual(ids(up, 'lead'), ['a', 'b']);
  assert.deepEqual(ids(moveKanbanCard(cards, columns, 'a', 'lead', 0), 'lead'), ['a', 'b']);
});

test('Kanban clamps destination positions and appends by default', () => {
  assert.deepEqual(ids(moveKanbanCard(cards, columns, 'a', 'proposal', -40), 'proposal'), ['a', 'c', 'd']);
  assert.deepEqual(ids(moveKanbanCard(cards, columns, 'a', 'proposal', 999), 'proposal'), ['c', 'd', 'a']);
  assert.deepEqual(ids(moveKanbanCard(cards, columns, 'a', 'proposal'), 'proposal'), ['c', 'd', 'a']);
  assert.deepEqual(ids(moveKanbanCard(cards, columns, 'a', 'proposal', NaN), 'proposal'), ['c', 'd', 'a']);
  assert.deepEqual(ids(moveKanbanCard(cards, columns, 'a', 'proposal', 1.9), 'proposal'), ['c', 'a', 'd']);
});

test('Kanban can move into an empty column and retains every card exactly once', () => {
  const result = moveKanbanCard(cards, columns, 'b', 'won', 0);
  assert.deepEqual(ids(result, 'won'), ['b']);
  assert.deepEqual(ids(result, 'lead'), ['a']);
  assert.deepEqual(result.map(card => card.id).sort(), cards.map(card => card.id).sort());
});

test('Kanban invalid move targets are unchanged snapshots', () => {
  for (const result of [moveKanbanCard(cards, columns, 'missing', 'lead'), moveKanbanCard(cards, columns, 'a', 'missing')]) {
    assert.deepEqual(result, cards);
    assert.notEqual(result, cards);
    assert.notEqual(result[0], cards[0]);
  }
  assert.equal(beginKanbanMove(cards, columns, 'missing'), null);
});

test('Kanban keyboard model preserves the row where possible across columns', () => {
  let move = beginKanbanMove(cards, columns, 'b');
  move = updateKanbanMove(move, 'ArrowRight');
  assert.deepEqual(ids(move.cards, 'proposal'), ['c', 'b', 'd']);
  move = updateKanbanMove(move, 'ArrowUp');
  assert.deepEqual(ids(move.cards, 'proposal'), ['b', 'c', 'd']);
  move = updateKanbanMove(move, 'ArrowDown');
  assert.deepEqual(ids(move.cards, 'proposal'), ['c', 'b', 'd']);
  move = updateKanbanMove(move, 'ArrowRight');
  assert.deepEqual(ids(move.cards, 'won'), ['b']);
  assert.equal(move.original[1].column, 'lead');
  assert.deepEqual(cards[1], { id: 'b', column: 'lead', title: 'Beta', value: 800 });
});

test('Kanban keyboard movement is bounded at outer columns and positions', () => {
  const start = beginKanbanMove(cards, columns, 'a');
  assert.deepEqual(updateKanbanMove(start, 'ArrowLeft').cards, start.cards);
  assert.deepEqual(updateKanbanMove(start, 'ArrowUp').cards, start.cards);
  let end = updateKanbanMove(start, 'ArrowRight');
  end = updateKanbanMove(end, 'ArrowRight');
  assert.deepEqual(updateKanbanMove(end, 'ArrowRight').cards, end.cards);
  assert.deepEqual(updateKanbanMove(end, 'ArrowDown').cards, end.cards);
  assert.equal(updateKanbanMove(start, 'Enter'), start);
  assert.equal(updateKanbanMove(null, 'ArrowUp'), null);
});

test('Kanban Escape cancellation restores original columns and order after several previews', () => {
  let move = beginKanbanMove(cards, columns, 'a');
  move = updateKanbanMove(move, 'right');
  move = updateKanbanMove(move, 'down');
  move = updateKanbanMove(move, 'right');
  const restored = finishKanbanMove(move, { cancel: true });
  assert.deepEqual(restored, cards);
  assert.notEqual(restored, cards);
  restored[0].title = 'External mutation';
  assert.equal(move.original[0].title, 'Acme');
  assert.equal(cards[0].title, 'Acme');
});

test('Kanban drop commits preview and returns an independent snapshot', () => {
  const initial = beginKanbanMove(cards, columns, 'a');
  const moved = updateKanbanMove(initial, 'ArrowRight');
  const committed = finishKanbanMove(moved);
  assert.deepEqual(committed, moved.cards);
  assert.notEqual(committed, moved.cards);
  committed.find(card => card.id === 'a').column = 'won';
  assert.equal(moved.cards.find(card => card.id === 'a').column, 'proposal');
  assert.deepEqual(initial.cards, cards);
});

test('Kanban pickup snapshots caller cards and columns', () => {
  const source = cards.map(card => ({ ...card }));
  const stages = columns.map(column => ({ ...column }));
  const move = beginKanbanMove(source, stages, 'a');
  source[0].title = 'Changed';
  stages[0].label = 'Changed';
  assert.equal(move.cards[0].title, 'Acme');
  assert.equal(move.original[0].title, 'Acme');
  assert.equal(move.columns[0].label, 'Lead');
});

test('Kanban WIP counts and optional totals track moves, zero values, and empty columns', () => {
  const before = summarizeKanbanColumns(cards, columns);
  assert.deepEqual(before.map(({ count, total, hasValues }) => ({ count, total, hasValues })), [{ count: 2, total: 2000, hasValues: true }, { count: 2, total: 0, hasValues: true }, { count: 0, total: 0, hasValues: false }]);
  const after = summarizeKanbanColumns(moveKanbanCard(cards, columns, 'a', 'won'), columns);
  assert.equal(after[0].count, 1);
  assert.equal(after[0].total, 800);
  assert.equal(after[2].count, 1);
  assert.equal(after[2].total, 1200);
  assert.equal(after[2].hasValues, true);
  assert.equal(summarizeKanbanColumns([{ id: 'x', column: 'lead', title: 'No value' }], columns)[0].hasValues, false);
});

test('Kanban snapshots reject missing destinations, duplicate ids, and non-finite values', () => {
  assert.throws(() => snapshotKanbanCards([{ id: 'x', column: 'missing', title: 'Orphan' }], columns), TypeError);
  assert.throws(() => snapshotKanbanCards([cards[0], cards[0]], columns), TypeError);
  assert.throws(() => snapshotKanbanCards(cards, [columns[0], columns[0]]), TypeError);
  assert.throws(() => snapshotKanbanCards([{ ...cards[0], value: Infinity }], columns), TypeError);
  assert.throws(() => snapshotKanbanCards([{ ...cards[0], value: '1200' }], columns), TypeError);
  assert.deepEqual(snapshotKanbanCards([], []), []);
});
