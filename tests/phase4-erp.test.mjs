import test from 'node:test';
import assert from 'node:assert/strict';
import { createFilterPredicate } from '../js/logic/filter.js';
import { toCents, lineTotals, orderTotals, invoiceLines, createOrders, normalizeOrderView, filterOrders, changeOrderStatus } from '../js/logic/erp.js';

test('ERP decimal inputs convert exactly to integer cents', () => {
  assert.equal(toCents('0.29'), 29);
  assert.equal(toCents(' 125.5 '), 12550);
  assert.equal(toCents(19.99), 1999);
  assert.equal(toCents('0001.01'), 101);
  assert.equal(toCents('0'), 0);
});

test('ERP rejects negative, invalid, overprecision and unsafe currency', () => {
  for (const value of ['', '-1', '1.001', '1e3', 'Infinity', 'NaN', '9,000', '90071992547409.92']) assert.throws(() => toCents(value), RangeError);
});

test('ERP line tax rounds half-up with integer basis points', () => {
  assert.deepEqual(lineTotals({ quantity: 1, unitCents: 5, taxBps: 1000 }), { subtotal: 5, tax: 1, total: 6 });
  assert.deepEqual(lineTotals({ quantity: 1, unitCents: 4, taxBps: 1000 }), { subtotal: 4, tax: 0, total: 4 });
  assert.deepEqual(lineTotals({ quantity: 3, unitCents: 1999, taxBps: 900 }), { subtotal: 5997, tax: 540, total: 6537 });
});

test('ERP subtotal and taxes are accumulated after per-line rounding', () => {
  const lines = [{ quantity: 1, unitCents: 5, taxBps: 1000 }, { quantity: 1, unitCents: 5, taxBps: 1000 }];
  assert.deepEqual(orderTotals(lines), { subtotal: 10, tax: 2, total: 12 });
  assert.deepEqual(orderTotals([]), { subtotal: 0, tax: 0, total: 0 });
});

test('ERP tax-exempt and zero-value lines have no tax', () => {
  assert.deepEqual(lineTotals({ quantity: 10, unitCents: 29, taxBps: 0 }), { subtotal: 290, tax: 0, total: 290 });
  assert.deepEqual(lineTotals({ quantity: 0, unitCents: 100, taxBps: 900 }), { subtotal: 0, tax: 0, total: 0 });
});

test('ERP rejects fractional quantities and unsafe totals', () => {
  for (const line of [{ quantity: 0.5, unitCents: 100 }, { quantity: 1, unitCents: -1 }, { quantity: 1, unitCents: 100, taxBps: 10001 }, { quantity: Number.MAX_SAFE_INTEGER, unitCents: 2 }]) assert.throws(() => lineTotals(line), RangeError);
  assert.throws(() => orderTotals([{ quantity: 1, unitCents: Number.MAX_SAFE_INTEGER }, { quantity: 1, unitCents: 1 }]), RangeError);
});

test('ERP uses exact intermediate tax math near the safe integer boundary', () => {
  const unitCents = 4000000000000000;
  assert.deepEqual(lineTotals({ quantity: 1, unitCents, taxBps: 900 }), { subtotal: unitCents, tax: 360000000000000, total: 4360000000000000 });
});

test('ERP invoice grid major-unit cells become validated cent line items', () => {
  const lines = invoiceLines([{ description: ' Desk ', quantity: '2', unitPrice: '125.50', taxBps: '900' }]);
  assert.equal(lines[0].unitCents, 12550);
  assert.equal(lines[0].description, 'Desk');
  assert.deepEqual(orderTotals(lines), { subtotal: 25100, tax: 2259, total: 27359 });
  assert.throws(() => invoiceLines([{ description: ' ', quantity: 1, unitPrice: 5 }]), RangeError);
  assert.throws(() => invoiceLines([{ description: 'Desk', quantity: 0, unitPrice: 5 }]), RangeError);
});

test('ERP deterministic seed totals use the same financial model as invoice', () => {
  const orders = createOrders();
  assert.equal(orders.length, 18);
  assert.equal(orders[0].id, 'SO-1042');
  for (const order of orders) assert.equal(order.totalCents, orderTotals(order.lines).total);
  assert.notEqual(createOrders()[0].lines, orders[0].lines);
});

test('ERP search AND FilterBuilder predicates filter real order rows', () => {
  const orders = createOrders();
  const view = { search: ' northwind ', match: 'all', conditions: [{ field: 'status', operator: 'equals', value: 'pending' }, { field: 'totalCents', operator: 'gte', value: 30000 }] };
  const expected = orders.filter(row => row.customer.toLowerCase().includes('northwind') && createFilterPredicate(view.conditions, { match: view.match })(row));
  assert.deepEqual(filterOrders(orders, view), expected);
  assert.equal(expected.length, 5);
});

test('ERP saved view serialized round-trip preserves All/Any and matching export rows', () => {
  const orders = createOrders();
  const selectedState = normalizeOrderView({ search: '', match: 'any', conditions: [{ field: 'status', operator: 'equals', value: 'Approved' }, { field: 'owner', operator: 'equals', value: 'Morgan Lee' }] });
  // SavedViewSelector serializes getState(), then passes the cloned state to onSelect().
  const restored = normalizeOrderView(JSON.parse(JSON.stringify(selectedState)));
  const matching = filterOrders(orders, restored);
  assert.deepEqual(matching.map(row => row.id), filterOrders(orders, selectedState).map(row => row.id));
  assert.ok(matching.length > filterOrders(orders, { ...restored, match: 'all' }).length);
  assert.ok(matching.length > matching.slice(0, 5).length, 'Filtered export is not restricted to the current page.');
});

test('ERP normalized view isolates conditions from later edits', () => {
  const input = { search: 'SO-', conditions: [{ field: 'status', operator: 'equals', value: 'Pending' }] };
  const saved = normalizeOrderView(input);
  input.conditions[0].value = 'Cancelled';
  assert.equal(saved.conditions[0].value, 'Pending');
  assert.equal(saved.match, 'all');
  assert.deepEqual(normalizeOrderView(), { search: '', conditions: [], match: 'all' });
  assert.throws(() => normalizeOrderView({ conditions: [{ field: 'status', operator: 'unsupported' }] }), TypeError);
});

test('ERP zero matching view remains empty after saving and restoring', () => {
  const view = { search: 'does-not-exist', conditions: [], match: 'all' };
  assert.deepEqual(filterOrders(createOrders(), normalizeOrderView(JSON.parse(JSON.stringify(view)))), []);
});

test('ERP confirmed approval affects only selected pending orders and adds audit', () => {
  const orders = createOrders();
  const next = changeOrderStatus(orders, ['SO-1042', 'SO-1043', 'SO-1044'], 'Approved');
  assert.equal(next[0].status, 'Approved');
  assert.equal(next[0].audit.length, 2);
  assert.equal(orders[0].status, 'Pending');
  assert.equal(next[1], orders[1]);
  assert.equal(next[2], orders[2]);
  assert.equal(next[4], orders[4]);
});

test('ERP cancellation preserves fulfilled and already-cancelled orders', () => {
  const orders = createOrders();
  const next = changeOrderStatus(orders, orders.map(row => row.id), 'Cancelled');
  assert.equal(next[0].status, 'Cancelled');
  assert.equal(next[1].status, 'Cancelled');
  assert.equal(next[2], orders[2]);
  assert.equal(next[3], orders[3]);
  assert.throws(() => changeOrderStatus(orders, [], 'Fulfilled'), RangeError);
});
