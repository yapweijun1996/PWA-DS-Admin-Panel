import { createFilterPredicate } from './filter.js';

const safe = (value, label) => {
  if (!Number.isSafeInteger(value) || value < 0) throw new RangeError(`${label} must be a non-negative safe integer.`);
  return value;
};

/** Decimal major units become cents without binary floating-point multiplication. */
export function toCents(value) {
  const text = String(value).trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) throw new RangeError('Enter a non-negative amount with at most two decimal places.');
  const [whole, fraction = ''] = text.split('.');
  const cents = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  if (cents > BigInt(Number.MAX_SAFE_INTEGER)) throw new RangeError('Amount is too large.');
  return Number(cents);
}

export function lineTotals({ quantity, unitCents, taxBps = 0 }) {
  safe(quantity, 'Quantity'); safe(unitCents, 'Unit cents'); safe(taxBps, 'Tax basis points');
  if (taxBps > 10000) throw new RangeError('Tax cannot exceed 100%.');
  const subtotal = BigInt(quantity) * BigInt(unitCents);
  // Round tax per line, half up, using integer arithmetic only.
  const tax = (subtotal * BigInt(taxBps) + 5000n) / 10000n;
  const total = subtotal + tax;
  if (total > BigInt(Number.MAX_SAFE_INTEGER)) throw new RangeError('Line total is too large.');
  return { subtotal: Number(subtotal), tax: Number(tax), total: Number(total) };
}

export function orderTotals(lines) {
  let subtotal = 0n; let tax = 0n;
  for (const line of lines) {
    const amount = lineTotals(line); subtotal += BigInt(amount.subtotal); tax += BigInt(amount.tax);
  }
  if (subtotal + tax > BigInt(Number.MAX_SAFE_INTEGER)) throw new RangeError('Order total is too large.');
  return { subtotal: Number(subtotal), tax: Number(tax), total: Number(subtotal + tax) };
}

export function invoiceLines(rows) {
  return rows.map(row => {
    if (!String(row.description ?? '').trim()) throw new RangeError('Each line needs a description.');
    const quantity = Number(row.quantity);
    if (quantity < 1) throw new RangeError('Quantity must be at least one.');
    return { ...row, description: row.description.trim(), quantity, unitCents: toCents(row.unitPrice), taxBps: Number(row.taxBps) };
  });
}

export const customers = Object.freeze([
  { id: 'C-1001', name: 'Northwind Studio', email: 'billing@northwind.example', address: '18 Orchard Road, Singapore' },
  { id: 'C-1002', name: 'Cedar Supply Co.', email: 'finance@cedar.example', address: '72 Harbour Walk, Singapore' },
  { id: 'C-1003', name: 'Orbit Works', email: 'accounts@orbit.example', address: '9 Market Street, Singapore' },
  { id: 'C-1004', name: 'Acme Industries', email: 'ap@acme.example', address: '41 Hill Street, Singapore' }
]);

export function createOrders() {
  return Array.from({ length: 18 }, (_, index) => {
    const customer = customers[index % customers.length];
    const lines = [
      { id: `L-${index}-1`, description: 'Desk workspace kit', quantity: 2 + index % 4, unitCents: 12550, taxBps: 900 },
      { id: `L-${index}-2`, description: 'Installation service', quantity: 1, unitCents: 8500, taxBps: 900 }
    ];
    return { id: `SO-${1042 + index}`, customer: customer.name, customerId: customer.id, status: ['Pending', 'Approved', 'Fulfilled', 'Cancelled'][index % 4], date: `2026-10-${String(26 - index).padStart(2, '0')}`, owner: ['Morgan Lee', 'Alex Chen', 'Jordan Tan'][index % 3], lines, totalCents: orderTotals(lines).total,
      audit: [{ actor: 'Morgan Lee (mock)', action: 'created', target: `SO-${1042 + index}`, time: `26 Oct, ${String(9 + index % 5).padStart(2, '0')}:00`, dateTime: '2026-10-26T09:00:00Z', details: 'Local mock order; no server is connected.' }] };
  });
}

export function normalizeOrderView(value = {}) {
  const conditions = Array.isArray(value.conditions) ? value.conditions.map(condition => ({ ...condition })) : [];
  const match = value.match === 'any' ? 'any' : 'all';
  createFilterPredicate(conditions, { match });
  return { search: typeof value.search === 'string' ? value.search : '', conditions, match };
}

/** Same serialized view drives SavedViewSelector, FilterBuilder and filtered CSV export. */
export function filterOrders(rows, view = {}) {
  const normalized = normalizeOrderView(view);
  const predicate = createFilterPredicate(normalized.conditions, { match: normalized.match });
  const query = normalized.search.trim().toLocaleLowerCase();
  return rows.filter(row => `${row.id} ${row.customer} ${row.status} ${row.owner}`.toLocaleLowerCase().includes(query) && predicate(row));
}

export function changeOrderStatus(rows, ids, status) {
  if (!['Approved', 'Cancelled'].includes(status)) throw new RangeError('Unsupported order action.');
  const selection = new Set(ids);
  return rows.map(row => {
    const eligible = status === 'Approved' ? row.status === 'Pending' : ['Pending', 'Approved'].includes(row.status);
    if (!selection.has(row.id) || !eligible) return row;
    const stamp = new Date().toISOString();
    return { ...row, status, audit: [...row.audit, { actor: 'Demo operator (mock)', action: status.toLowerCase(), target: row.id, dateTime: stamp, time: new Date(stamp).toLocaleString('en-SG'), details: 'Confirmed local mock action.' }] };
  });
}

export const inventory = Object.freeze([
  { id: 'SKU-201', name: 'Workspace kit', category: 'Furniture', stock: 18, target: 80, unitCents: 12550 },
  { id: 'SKU-202', name: 'Task chair', category: 'Furniture', stock: 64, target: 80, unitCents: 18000 },
  { id: 'SKU-203', name: 'USB-C hub', category: 'Electronics', stock: 12, target: 60, unitCents: 4800 },
  { id: 'SKU-204', name: 'Monitor', category: 'Electronics', stock: 92, target: 100, unitCents: 26000 },
  { id: 'SKU-205', name: 'Notebook pack', category: 'Stationery', stock: 140, target: 160, unitCents: 1500 },
  { id: 'SKU-206', name: 'Pen set', category: 'Stationery', stock: 8, target: 40, unitCents: 850 }
]);

export function initialInvoiceRows() {
  return [{ id: 'invoice-line-1', description: 'Desk workspace kit', quantity: 2, unitPrice: 125.50, taxBps: 900 }];
}
