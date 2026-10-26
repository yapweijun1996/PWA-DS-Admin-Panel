import { element as el, button, field, uniqueId, onDetach } from '../../../components/playground.js';
import { createListingLayout } from '../../../components/listing-layout.js';
import { createDetailLayout } from '../../../components/detail-layout.js';
import { createDashboardLayout } from '../../../components/dashboard-layout.js';
import { createFormLayout } from '../../../components/form-layout.js';
import { createFormSection } from '../../../components/form-section.js';
import { createCombobox } from '../../../components/combobox.js';
import { createDatePicker } from '../../../components/date-picker.js';
import { createDataGrid } from '../../../components/data-grid.js';
import { createFilterBuilder } from '../../../components/filter-builder.js';
import { createSavedViewSelector } from '../../../components/saved-view-selector.js';
import { createColumnVisibilityMenu } from '../../../components/column-visibility-menu.js';
import { createBulkActionToolbar } from '../../../components/bulk-action-toolbar.js';
import { createPermissionGate, getMockPermissions } from '../../../components/permission-gate.js';
import { createUnsavedChangesGuard } from '../../../components/unsaved-changes-guard.js';
import { openConfirmDialog } from '../../../components/confirm-dialog.js';
import { openExportDialog } from '../../../components/export-dialog.js';
import { createDescriptionList } from '../../../components/description-list.js';
import { createAuditTimeline } from '../../../components/audit-timeline.js';
import { createTable } from '../../../components/table.js';
import { createPagination } from '../../../components/pagination.js';
import { createPill } from '../../../components/pill.js';
import { createCard } from '../../../components/card.js';
import { createKpiCard } from '../../../components/kpi-card.js';
import { createChart } from '../../../components/chart.js';
import { createProgressBar } from '../../../components/progress-bar.js';
import { createEmptyState } from '../../../components/empty-state.js';
import { createErrorState } from '../../../components/error-state.js';
import { createSpinner } from '../../../components/spinner.js';
import { customers, createOrders, inventory, initialInvoiceRows, invoiceLines, orderTotals, filterOrders, normalizeOrderView, changeOrderStatus } from '../../logic/erp.js';
import { createDemoControls } from '../demo-controls.js';

let orders = createOrders();
let invoices = [];
const money = cents => new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD' }).format(cents / 100);
const actions = (...children) => el('div', { className: 'erp-actions' }, ...children);
const link = (label, screen, primary = false) => el('a', { className: `ds-button ds-button-${primary ? 'primary' : 'secondary'}`, href: `#/examples/erp/${screen}` }, label);
const allowed = permission => getMockPermissions().includes(permission);
const statusPill = status => createPill({ label: status, tone: ({ Pending: 'warning', Approved: 'info', Fulfilled: 'success', Cancelled: 'neutral' })[status] || 'neutral', size: 'small' });

function notice() {
  return el('p', { className: 'erp-notice' }, createPill({ label: 'Mock data', tone: 'info' }), 'Session-only ERP records · SGD · No server or real payment. ', el('a', { href: '#/settings/general' }, 'Mock permissions in Settings'));
}
function heading(title, description, controls, reset, demo) {
  return el('div', { className: 'example-page-header' },
    el('header', { className: 'erp-heading' }, el('div', {}, el('h1', { className: 'page-title' }, title), el('p', { className: 'page-subtitle' }, description)), controls),
    createDemoControls({ domain: 'erp', reset, state: demo }));
}
function stateControl(label, onChange) {
  return createCombobox({ label: `${label} · Demo state`, value: 'ready', clearable: false, options: ['ready', 'loading', 'empty', 'error'].map(value => ({ value, label: ({ ready: 'Populated', loading: 'Loading', empty: 'Empty', error: 'Error' })[value] })), onChange });
}
function listState(state, name, retry, emptyAction) {
  if (state === 'loading') return createSpinner({ label: `Loading mock ${name} · simulated state` });
  if (state === 'error') return createErrorState({ headingLevel: 2, title: `Mock ${name} could not load`, description: 'Simulated error. Retry restores the local mock records.', onRetry: retry });
  return createEmptyState({ headingLevel: 2, title: `No ${name}`, description: 'No mock records are displayed in this demo state.', actionLabel: 'Show mock records', onAction: emptyAction || retry });
}
function table(caption, columns, rows) {
  return createTable({ caption, header: el('tr', {}, ...columns.map(column => el('th', { scope: 'col' }, column.label))), body: el('tbody', {}, ...rows.map(row => el('tr', {}, ...columns.map(column => el('td', {}, column.render ? column.render(row) : row[column.key]))))) });
}
function totalsView(totals) {
  return createDescriptionList({ items: [{ term: 'Subtotal', value: money(totals.subtotal) }, { term: 'Tax · per-line rounding', value: money(totals.tax) }, { term: 'Total · SGD', value: money(totals.total) }] });
}

export function render(container, { screen = 'orders', id } = {}) {
  const root = el('section', { className: 'erp-example' });
  const body = el('div', { className: 'erp-screen' });
  const feedback = el('p', { className: 'erp-feedback', role: 'status', 'aria-live': 'polite' });
  let dialog;
  const nav = el('nav', { className: 'erp-nav', 'aria-label': 'ERP example screens' }, ...[['Orders', 'orders'], ['Inventory', 'inventory'], ['New invoice', 'invoice']].map(([label, route]) => {
    const item = link(label, route); if (screen === route || screen === 'order' && route === 'orders') item.setAttribute('aria-current', 'page'); return item;
  }));
  const reset = button('Reset demo data', () => {
    dialog = openConfirmDialog({ title: 'Reset ERP demo data?', description: 'Restore the 18 original mock orders and clear session invoices and invoice drafts. Saved filter views are kept in this browser. Nothing on a server changes.', destructive: true, confirmLabel: 'Reset ERP data', onConfirm() {
      orders = createOrders(); invoices = []; render(container, { screen, id });
    } });
  }, 'ghost');
  root.append(nav, notice(), body, feedback);
  container.replaceChildren(root);
  onDetach(root, () => dialog?.close());
  if (screen === 'inventory') renderInventory(body, reset);
  else if (screen === 'invoice') renderInvoice(body, feedback, reset);
  else if (screen === 'order') renderOrder(body, id, feedback, reset);
  else renderOrders(body, feedback, reset);
  return root;
}

function renderOrders(container, feedback, reset) {
  let page = 1; let pageSize = 5; let state = 'ready';
  let visibleKeys = ['id', 'customer', 'status', 'date', 'totalCents'];
  const selected = new Set();
  const results = el('div'); const count = el('p', { role: 'status' });
  let confirm; let exportDialog;
  const search = el('input', { className: 'ds-input', type: 'search', placeholder: 'Order, customer, status or owner', oninput() { page = 1; draw(); } });
  const filters = createFilterBuilder({ fields: [{ key: 'customer', label: 'Customer' }, { key: 'status', label: 'Status' }, { key: 'owner', label: 'Owner' }, { key: 'totalCents', label: 'Total (cents)' }], onChange() { page = 1; draw(); } });
  const currentView = () => normalizeOrderView({ search: search.value, conditions: filters.value, match: filters.match });
  const matchingRows = () => filterOrders(orders, currentView());
  const views = createSavedViewSelector({ label: 'Saved order views', storageKey: 'forma-erp-order-views', getState: currentView, onSelect(view) {
    const next = normalizeOrderView(view); search.value = next.search; filters.setValue(next.conditions, { match: next.match }); page = 1; draw();
  } });
  const columns = [{ key: 'id', label: 'Order' }, { key: 'customer', label: 'Customer' }, { key: 'status', label: 'Status' }, { key: 'date', label: 'Order date' }, { key: 'totalCents', label: 'Total (SGD)' }, { key: 'owner', label: 'Owner' }];
  const columnMenu = createColumnVisibilityMenu({ columns: columns.map(column => ({ id: column.key, label: column.label, visible: visibleKeys.includes(column.key), locked: column.key === 'id' })), onChange(_id, _visible, next) { visibleKeys = next.filter(column => column.visible).map(column => column.id); draw(); } });
  const pagination = createPagination({ total: orders.length, pageSize, pageSizes: [5, 10, 20], onPageChange(next) { page = next; draw(); }, onPageSizeChange(next) { pageSize = next; page = 1; draw(); } });
  function change(status) {
    const permission = status === 'Approved' ? 'customers.edit' : 'customers.delete';
    if (!allowed(permission)) { feedback.textContent = `Enable ${status === 'Approved' ? 'Edit' : 'Delete'} customers in Settings to ${status === 'Approved' ? 'approve' : 'cancel'} mock orders.`; return; }
    const ids = [...selected];
    confirm = openConfirmDialog({ title: `${status === 'Approved' ? 'Approve' : 'Cancel'} ${ids.length} selected orders?`, description: 'Only pending orders can be approved. Only pending or approved orders can be cancelled. Fulfilled/cancelled records remain unchanged. This action changes local mock data only.', destructive: status === 'Cancelled', confirmLabel: `${status === 'Approved' ? 'Approve' : 'Cancel'} mock orders`, onConfirm() {
      if (!allowed(permission)) throw new Error('The required Settings permission was removed. No orders changed.');
      const next = changeOrderStatus(orders, ids, status); const changed = next.filter((row, index) => row !== orders[index]).length;
      orders = next; selected.clear(); draw(); feedback.textContent = `${changed} eligible mock orders ${status.toLowerCase()}.`;
    } });
  }
  const bulk = createBulkActionToolbar({ onClear() { selected.clear(); draw(); }, actions: [{ label: 'Approve selected', onAction() { change('Approved'); } }, { label: 'Cancel selected', onAction() { change('Cancelled'); } }] });
  const demo = stateControl('Orders', value => { state = value; selected.clear(); draw(); });
  function ready() { state = 'ready'; demo.setValue(state); draw(); }
  const clear = () => { search.value = ''; filters.setValue([]); page = 1; ready(); };
  function draw() {
    const matching = matchingRows();
    page = Math.max(1, Math.min(page, Math.ceil(matching.length / pageSize) || 1));
    const visible = matching.slice((page - 1) * pageSize, page * pageSize);
    const shown = columns.filter(column => visibleKeys.includes(column.key));
    count.textContent = `${matching.length} of ${orders.length} mock orders match · ${selected.size} selected across pages.`;
    pagination.setState({ total: state === 'ready' ? matching.length : 0, page, pageSize }); bulk.setCount(selected.size);
    if (state !== 'ready') { results.replaceChildren(listState(state, 'orders', ready)); return; }
    if (!matching.length) { results.replaceChildren(createEmptyState({ headingLevel: 2, title: 'No orders match', description: 'Clear search or remove filter conditions to see mock orders.', actionLabel: 'Clear filters', onAction: clear })); return; }
    const all = el('input', { className: 'ds-checkbox', type: 'checkbox', 'aria-label': 'Select all orders on this page', checked: visible.every(row => selected.has(row.id)), onchange(event) { visible.forEach(row => event.target.checked ? selected.add(row.id) : selected.delete(row.id)); draw(); } });
    all.indeterminate = visible.some(row => selected.has(row.id)) && !visible.every(row => selected.has(row.id));
    const header = el('tr', {}, el('th', { scope: 'col' }, all), ...shown.map(column => el('th', { scope: 'col' }, column.label)));
    const body = el('tbody', {}, ...visible.map(row => el('tr', { 'aria-selected': selected.has(row.id) },
      el('td', {}, el('input', { className: 'ds-checkbox', type: 'checkbox', 'aria-label': `Select ${row.id}`, checked: selected.has(row.id), onchange(event) { event.target.checked ? selected.add(row.id) : selected.delete(row.id); draw(); } })),
      ...shown.map(column => el('td', {}, column.key === 'status' ? statusPill(row.status) : column.key === 'totalCents' ? money(row.totalCents) : column.key === 'id' ? el('a', { href: `#/examples/erp/order/${row.id}` }, row.id) : row[column.key])))));
    results.replaceChildren(createTable({ caption: 'Mock sales orders · Activate a row to view its detail', header, body, onRowActivate: index => { location.hash = `/examples/erp/order/${visible[index].id}`; } }));
  }
  const exportGate = createPermissionGate({ permission: 'customers.export', reason: 'Enable Export customers in Settings to export mock ERP orders.', content: button('Export filtered orders', () => {
    if (!allowed('customers.export')) return;
    exportDialog = openExportDialog({ title: 'Export filtered mock orders', rows: matchingRows().map(row => ({ ...row, totalCents: money(row.totalCents) })), columns: columns.filter(column => visibleKeys.includes(column.key)), filename: 'mock-erp-orders', onExport(result) { feedback.textContent = `Download requested: ${result.filename}. Export includes every matching row, not just this page.`; } });
  }) });
  container.append(createListingLayout({ header: heading('Sales orders', 'Review, approve and track customer orders. All amounts include line-level tax.', link('New invoice', 'invoice', true), reset, demo), summary: count,
    toolbar: [createCard({ headingLevel: 2, title: 'Find orders', content: [field('Search orders', search), filters.element, actions(button('Clear filters', clear, 'ghost'), columnMenu.element, exportGate.element), views.element] }), bulk.element], table: results, pagination: pagination.element }));
  draw();
  onDetach(container, () => { confirm?.close(); exportDialog?.close(); filters.destroy(); views.destroy(); columnMenu.destroy?.(); bulk.destroy(); exportGate.destroy(); });
}

function renderOrder(container, id = 'SO-1042', feedback, reset) {
  const order = orders.find(row => row.id === id);
  if (!order) { container.append(heading('Order not found', 'This mock order does not exist in the current session.', link('Back to orders', 'orders'), reset), createEmptyState({ headingLevel: 2, title: 'Mock order not found', description: 'This order does not exist in the current session.', actionLabel: 'Back to orders', onAction() { location.hash = '/examples/erp/orders'; } })); return; }
  let state = 'ready'; let dialog;
  const lines = el('div'); const timeline = el('div'); const status = el('div', {}, statusPill(order.status));
  const demo = stateControl('Order line items and audit', value => { state = value; draw(); });
  function ready() { state = 'ready'; demo.setValue(state); draw(); }
  function draw() {
    if (state !== 'ready') { lines.replaceChildren(listState(state, 'line items', ready)); timeline.replaceChildren(listState(state, 'audit events', ready)); return; }
    lines.replaceChildren(table('Mock order line items · SGD', [{ key: 'description', label: 'Item' }, { key: 'quantity', label: 'Quantity' }, { label: 'Unit price', render: row => money(row.unitCents) }, { label: 'Tax rate', render: row => `${row.taxBps / 100}%` }, { label: 'Line total', render: row => money(orderTotals([row]).total) }], order.lines), totalsView(orderTotals(order.lines)));
    timeline.replaceChildren(createAuditTimeline({ label: 'Mock order audit history', events: order.audit }));
  }
  const gates = [];
  for (const [label, target, permission] of [['Approve order', 'Approved', 'customers.edit'], ['Cancel order', 'Cancelled', 'customers.delete']]) {
    const eligible = target === 'Approved' ? order.status === 'Pending' : ['Pending', 'Approved'].includes(order.status);
    const control = button(label, () => {
      if (!allowed(permission)) return;
      dialog = openConfirmDialog({ title: `${label}?`, description: `Update ${order.id} in this local mock session. No real order is changed.`, destructive: target === 'Cancelled', confirmLabel: label, onConfirm() {
        if (!allowed(permission)) throw new Error('Settings permission was removed. No order changed.');
        orders = changeOrderStatus(orders, [order.id], target); renderOrderAfterAction();
      } });
    }, target === 'Cancelled' ? 'danger' : 'primary', { disabled: !eligible });
    gates.push(createPermissionGate({ permission, content: control, reason: `Enable ${target === 'Approved' ? 'Edit' : 'Delete'} customers in Settings for this mock ERP action.` }));
  }
  function renderOrderAfterAction() {
    const next = orders.find(row => row.id === order.id); Object.assign(order, next);
    status.replaceChildren(statusPill(order.status)); draw();
    gates.forEach(gate => gate.destroy());
    container.replaceChildren(); renderOrder(container, order.id, feedback, reset);
    feedback.textContent = `${order.id} is now ${order.status.toLowerCase()} in this mock session.`;
  }
  const customer = customers.find(row => row.id === order.customerId);
  container.append(createDetailLayout({ header: heading(order.id, `${order.customer} · Mock sales order`, actions(link('Back to orders', 'orders'), ...gates.map(gate => gate.element)), reset, demo),
    summary: [createKpiCard({ headingLevel: 2, label: 'Order total · SGD', value: money(order.totalCents) }), createCard({ headingLevel: 2, title: 'Order status', content: status, description: 'Pending → Approved → Fulfilled; pending/approved orders may be cancelled.' })],
    content: createCard({ headingLevel: 2, title: 'Line items', content: lines }),
    sidePanel: createCard({ headingLevel: 2, title: 'Order details', content: createDescriptionList({ items: [{ term: 'Customer', value: order.customer }, { term: 'Order date', value: order.date }, { term: 'Owner', value: order.owner }, { term: 'Billing email', value: customer.email }, { term: 'Billing address', value: customer.address }, { term: 'Currency', value: 'SGD' }] }) }),
    timeline: createCard({ headingLevel: 2, title: 'Audit history · Mock data', content: timeline }) }));
  draw(); onDetach(container.firstElementChild, () => { dialog?.close(); gates.forEach(gate => gate.destroy()); });
}

function renderInventory(container, reset) {
  let state = 'ready'; const contents = el('div');
  const demo = stateControl('Inventory charts and stock alerts', value => { state = value; draw(); });
  function ready() { state = 'ready'; demo.setValue(state); draw(); }
  function draw() {
    if (state === 'error' || state === 'empty') { contents.replaceChildren(listState(state, 'inventory records', ready)); return; }
    const loading = state === 'loading';
    const categories = [...new Set(inventory.map(row => row.category))];
    const category = createChart({ type: 'bar', title: 'Mock stock by category', labels: categories, series: [{ name: 'Units in stock', values: categories.map(name => inventory.filter(row => row.category === name).reduce((sum, row) => sum + row.stock, 0)) }], loading });
    const trend = createChart({ type: 'line', title: 'Mock stock trend · Last six weeks', labels: ['21 Sep', '28 Sep', '5 Oct', '12 Oct', '19 Oct', '26 Oct'], series: [{ name: 'Units on hand', values: [510, 485, 472, 460, 451, inventory.reduce((sum, row) => sum + row.stock, 0)] }], loading });
    const low = inventory.filter(row => row.stock / row.target < 0.3);
    const alerts = loading ? createSpinner({ label: 'Loading mock low-stock alerts · simulated state' }) : el('ul', { className: 'erp-stock-list' }, ...low.map(row => el('li', {}, el('div', {}, el('strong', {}, row.name), el('p', {}, `${row.id} · ${row.stock} of ${row.target} target units`)), createProgressBar({ label: `${row.name} stock vs target`, value: row.stock, max: row.target, tone: 'warning', showValue: true }))));
    const units = inventory.reduce((sum, row) => sum + row.stock, 0);
    contents.replaceChildren(createDashboardLayout({ variant: 'bento', metrics: [createKpiCard({ headingLevel: 2, label: 'Units on hand · Mock', value: loading ? '—' : String(units) }), createKpiCard({ headingLevel: 2, label: 'Stock value · Mock', value: loading ? '—' : money(inventory.reduce((sum, row) => sum + row.stock * row.unitCents, 0)) }), createKpiCard({ headingLevel: 2, label: 'Low-stock SKUs · Mock', value: loading ? '—' : String(low.length), trend: 'Below 30% of target', trendTone: 'warning' }), createKpiCard({ headingLevel: 2, label: 'Categories · Mock', value: loading ? '—' : String(categories.length) })], content: [{ element: createCard({ headingLevel: 2, title: 'Stock by category', description: 'Mock units on hand · switch to the source table for exact values.', content: category }), span: 6 }, { element: createCard({ headingLevel: 2, title: 'Inventory trend', description: 'Mock weekly stock snapshot · source table available.', content: trend }), span: 6 }, { element: createCard({ headingLevel: 2, title: 'Low-stock alerts', description: 'Mock SKUs below 30% of their replenishment target.', content: alerts }), span: 12 }] }));
  }
  container.append(heading('Inventory overview', 'A mock warehouse snapshot with replenishment priorities.', link('View orders', 'orders'), reset, demo), contents); draw();
}

function renderInvoice(container, feedback, reset) {
  const formId = uniqueId('erp-invoice');
  let nextLine = 2; let state = 'ready'; let saved; let guard; let grid; let dialog;
  const total = el('div', { className: 'erp-invoice-totals', 'aria-live': 'polite' });
  const error = el('p', { className: 'erp-error', role: 'alert' });
  const gridSlot = el('div');
  const customer = createCombobox({ label: 'Customer', required: true, value: '', placeholder: 'Find a mock customer', options: customers.map(row => ({ value: row.id, label: row.name, keywords: row.email })), onChange: changed });
  const issued = createDatePicker({ label: 'Invoice date', value: '2026-10-26', required: true, clearable: false, onChange: changed });
  const due = createDatePicker({ label: 'Due date', value: '2026-11-25', required: true, clearable: false, onChange: changed });
  grid = createDataGrid({ label: 'Mock invoice line items · SGD major units', columns: [
    { key: 'description', label: 'Description', type: 'text', required: true },
    { key: 'quantity', label: 'Quantity', type: 'number', required: true, min: 1, max: 10000, validate: value => Number.isInteger(Number(value)) ? '' : 'Use a whole number.' },
    { key: 'unitPrice', label: 'Unit price (SGD)', type: 'currency', currency: 'SGD', locale: 'en-SG', required: true, min: 0, max: 1000000, validate: value => /^\d+(?:\.\d{1,2})?$/.test(String(value)) ? '' : 'Use at most two decimal places.' },
    { key: 'taxBps', label: 'Tax', type: 'select', required: true, options: [{ value: 0, label: '0% · Exempt' }, { value: 900, label: '9% · Mock GST' }] }
  ], rows: initialInvoiceRows(), onChange: changed, onDirtyChange: () => changed() });
  function draft() { return { customer: customer.value, issued: issued.value, due: due.value, rows: grid.getRows() }; }
  function isDirty() { return Boolean(saved && JSON.stringify(draft()) !== JSON.stringify(saved)) || Boolean(grid && !grid.isValid()); }
  function publish() {
    const dirty = isDirty(); window.appDirty = dirty;
    window.dispatchEvent(new CustomEvent('app:dirty', { detail: { source: 'erp-invoice', dirty } }));
  }
  function changed() {
    if (!grid || !saved) return;
    error.textContent = ''; updateTotals(); publish();
    feedback.textContent = isDirty() ? 'Unsaved mock invoice changes. Navigation asks Save / Discard / Keep editing.' : 'Mock invoice draft is unchanged.';
  }
  function updateTotals() {
    try { total.replaceChildren(totalsView(orderTotals(invoiceLines(grid.getRows())))); }
    catch (failure) { total.replaceChildren(el('p', { role: 'status' }, `Totals unavailable: ${failure.message}`)); }
  }
  function restore() {
    customer.setValue(saved.customer); issued.setValue(saved.issued); due.setValue(saved.due); grid.setRows(saved.rows.map(row => ({ ...row }))); grid.markSaved(); error.textContent = ''; updateTotals(); publish();
  }
  function save() {
    error.textContent = '';
    try {
      if (!allowed('customers.create')) throw new Error('Enable Create customers in Settings to save mock invoices.');
      if (state !== 'ready') throw new Error('Return the line-item demo state to Populated before saving.');
      if (!customer.value) { customer.input.focus(); throw new Error('Choose a customer.'); }
      if (!issued.value || !due.value || due.value < issued.value) { due.trigger.focus(); throw new Error('Due date must be on or after the invoice date.'); }
      if (!grid.isValid()) throw new Error('Correct invalid or unfinished line-item cells before saving.');
      if (!grid.getRows().length) throw new Error('Add at least one invoice line item.');
      const lines = invoiceLines(grid.getRows()); const amounts = orderTotals(lines);
      const record = { id: `INV-${2001 + invoices.length}`, ...draft(), lines, ...amounts };
      invoices.push(record); saved = JSON.parse(JSON.stringify(draft())); grid.markSaved(); publish();
      feedback.textContent = `Saved ${record.id} · ${money(amounts.total)} for ${customers.find(row => row.id === customer.value).name} in this mock session. No payment or server write occurred.`;
      return true;
    } catch (failure) { error.textContent = failure.message; return false; }
  }
  const demo = stateControl('Invoice line items', value => { state = value; drawGrid(); });
  function ready() { state = 'ready'; demo.setValue(state); drawGrid(); }
  function drawGrid() {
    grid.element.hidden = state !== 'ready';
    statePanel.replaceChildren(...(state === 'ready' ? [] : [listState(state, 'invoice line items', ready)]));
  }
  const statePanel = el('div'); gridSlot.append(grid.element, statePanel);
  const add = button('Add line item', () => { ready(); grid.setRows([...grid.getRows(), { id: `invoice-line-${nextLine++}`, description: '', quantity: 1, unitPrice: 0, taxBps: 900 }]); changed(); });
  const remove = button('Remove last line', () => {
    if (!grid.getRows().length) { feedback.textContent = 'There are no line items to remove.'; return; }
    dialog = openConfirmDialog({ title: 'Remove the last invoice line?', description: 'Remove this mock line and recalculate tax and totals. Save is blocked if the invoice has no lines.', destructive: true, confirmLabel: 'Remove line', onConfirm() { grid.setRows(grid.getRows().slice(0, -1)); changed(); } });
  }, 'ghost');
  const saveGate = createPermissionGate({ permission: 'customers.create', reason: 'Enable Create customers in Settings to save this mock ERP invoice.', content: button('Save mock invoice', null, 'primary', { type: 'submit', form: formId }) });
  const discard = button('Discard invoice changes', () => {
    if (!isDirty()) { feedback.textContent = 'No invoice changes to discard.'; return; }
    dialog = openConfirmDialog({ title: 'Discard invoice changes?', description: 'Restore the last saved mock invoice draft and discard unsaved line, customer and date edits.', destructive: true, confirmLabel: 'Discard changes', onConfirm() { restore(); feedback.textContent = 'Unsaved mock invoice changes discarded.'; } });
  }, 'danger');
  const form = el('form', { id: formId, novalidate: true, onsubmit(event) { event.preventDefault(); save(); } },
    createFormSection({ headingLevel: 2, title: 'Invoice details', description: 'Mock customer billing details. All invoice amounts are in SGD.', content: [customer.element, el('div', { className: 'erp-date-fields' }, issued.element, due.element)] }),
    createFormSection({ headingLevel: 2, title: 'Line items', description: 'Enter edits with Enter; Escape cancels a cell edit. Currency uses SGD major units. Tax is rounded half up per line to the nearest cent.', content: [actions(add, remove), gridSlot] }),
    createFormSection({ headingLevel: 2, title: 'Invoice totals', description: 'Live totals use integer cents and basis-point tax rates, not floating-point money arithmetic.', content: total }));
  saved = JSON.parse(JSON.stringify(draft()));
  guard = createUnsavedChangesGuard({ isDirty, onSave: save, onDiscard() { restore(); }, description: 'Save this mock invoice, discard changes, or keep editing. No real invoice is issued.' });
  const layout = createFormLayout({ header: heading('New invoice', 'Create a local mock invoice with live line-level tax and totals.', link('Back to orders', 'orders'), reset, demo), sections: form, actions: [error, discard, saveGate.element] });
  container.append(layout); updateTotals();
  onDetach(layout, () => { dialog?.close(); guard.destroy(); saveGate.destroy(); customer.close(); issued.destroy(); due.destroy(); publishClean(); });
  function publishClean() { window.appDirty = false; window.dispatchEvent(new CustomEvent('app:dirty', { detail: { source: 'erp-invoice', dirty: false } })); }
}
