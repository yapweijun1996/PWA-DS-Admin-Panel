import { element as el, button, field, uniqueId, onDetach } from '../components/playground.js';
import { createFormField } from '../components/form-field.js';
import { createFormSection } from '../components/form-section.js';
import { createFormLayout } from '../components/form-layout.js';
import { createListingLayout } from '../components/listing-layout.js';
import { createCombobox } from '../components/combobox.js';
import { createTable } from '../components/table.js';
import { createPagination } from '../components/pagination.js';
import { createPill } from '../components/pill.js';
import { createFilterBuilder } from '../components/filter-builder.js';
import { createSavedViewSelector } from '../components/saved-view-selector.js';
import { createBulkActionToolbar } from '../components/bulk-action-toolbar.js';
import { createPermissionGate, getMockPermissions } from '../components/permission-gate.js';
import { createUnsavedChangesGuard } from '../components/unsaved-changes-guard.js';
import { openImportWizard } from '../components/import-wizard.js';
import { openExportDialog } from '../components/export-dialog.js';
import { openConfirmDialog } from '../components/confirm-dialog.js';
import { createColumnVisibilityMenu } from '../components/column-visibility-menu.js';

export function createMockCustomers() {
  return [
    { id: 'MOCK-101', name: 'Acme', status: 'Active', owner: 'Olivia', plan: 'Business', usage: 68, updates: true },
    { id: 'MOCK-102', name: 'Orbit', status: 'Trial', owner: 'Phoenix', plan: 'Starter', usage: 35, updates: false },
    { id: 'MOCK-103', name: 'Nova', status: 'Active', owner: 'Lana', plan: 'Enterprise', usage: 82, updates: true }
  ];
}

const dirtyEditors = new Map();
let previousDirty = false;
function preserveOtherDirtyOwner(event) {
  if (event.detail?.source === 'learn') return;
  previousDirty = typeof event.detail?.dirty === 'boolean' ? event.detail.dirty : Boolean(window.appDirty);
  if ([...dirtyEditors.values()].some(Boolean)) window.appDirty = true;
}
function publishDirty(owner, dirty) {
  const wasDirty = [...dirtyEditors.values()].some(Boolean);
  dirtyEditors.set(owner, dirty);
  const nowDirty = [...dirtyEditors.values()].some(Boolean);
  if (!wasDirty && nowDirty) {
    previousDirty = Boolean(window.appDirty); window.appDirty = true;
    window.addEventListener('app:dirty', preserveOtherDirtyOwner);
  } else if (wasDirty && !nowDirty) {
    window.removeEventListener('app:dirty', preserveOtherDirtyOwner);
    if (window.appDirty === true) window.appDirty = previousDirty;
  }
  window.dispatchEvent(new CustomEvent('app:dirty', { detail: { source: 'learn', dirty: nowDirty } }));
}
const allowed = permission => getMockPermissions().includes(permission);

/** One editor composition serves both the Form template and the create/edit workflow. */
export function createCustomerEditor({ initial = createMockCustomers()[0], onSave = record => record, permission } = {}) {
  let saved = { ...initial };
  let destroyed = false;
  let saveGate;
  const dirtyOwner = {};
  const formId = uniqueId('learn-customer-form');
  const feedback = el('p', { className: 'learn-feedback', role: 'status' }, 'Mock record · Changes stay in this example.');
  const name = el('input', { className: 'ds-input', value: saved.name, maxlength: '80', autocomplete: 'off' });
  const nameField = createFormField({ label: 'Customer name', control: name, required: true, hint: 'Mock customer; use a recognizable name, up to 80 characters.' });
  const owner = createCombobox({ label: 'Account owner', value: saved.owner, clearable: false, options: ['Olivia', 'Phoenix', 'Lana'].map(value => ({ value, label: value })), onChange: changed });
  const status = createCombobox({ label: 'Customer status', value: saved.status, clearable: false, options: ['Active', 'Trial', 'Archived'].map(value => ({ value, label: value })), onChange: changed });
  const updates = el('input', { className: 'ds-checkbox', type: 'checkbox', checked: saved.updates, onchange: changed });
  const saveSlot = el('div');
  function draft() { return { ...saved, name: name.value, owner: owner.value, status: status.value, updates: updates.checked }; }
  function isDirty() { return JSON.stringify(draft()) !== JSON.stringify(saved); }
  function changed() { nameField.setError(); publishDirty(dirtyOwner, isDirty()); feedback.textContent = isDirty() ? 'Unsaved mock changes. Leaving asks for Save / Discard / Keep editing.' : 'All mock changes saved.'; }
  function restore() {
    name.value = saved.name; owner.setValue(saved.owner); status.setValue(saved.status); updates.checked = saved.updates;
    nameField.setError(); publishDirty(dirtyOwner, false);
  }
  function renderSave() {
    saveGate?.destroy();
    const control = button('Save mock customer', null, 'primary', { type: 'submit', form: formId });
    if (permission) {
      saveGate = createPermissionGate({ permission: permission(saved), content: control, reason: 'Enable the matching Create/Edit customers mock permission in Settings to save.' });
      saveSlot.replaceChildren(saveGate.element);
    } else saveSlot.replaceChildren(control);
  }
  function save() {
    if (permission && !allowed(permission(saved))) { feedback.textContent = 'Mock save denied by the current Settings permission set.'; return false; }
    if (!name.value.trim()) { nameField.setError('Enter a customer name before saving.'); feedback.textContent = 'Correct the highlighted field. The mock record was not saved.'; name.focus(); return false; }
    const result = onSave({ ...draft(), name: name.value.trim() });
    if (result === false) return false;
    saved = { ...(result || draft()), name: name.value.trim() };
    restore(); renderSave(); feedback.textContent = `Saved ${saved.name} for ${saved.owner} in this local mock example.`;
    return true;
  }
  const guard = createUnsavedChangesGuard({ isDirty, onSave: save, onDiscard() { restore(); feedback.textContent = 'Unsaved mock changes discarded; last saved values restored.'; }, description: 'Save this mock customer, discard your edits, or keep editing. Nothing is sent to a server.' });
  const form = el('form', { id: formId, className: 'learn-pattern-form', novalidate: true, onsubmit(event) { event.preventDefault(); save(); } },
    createFormSection({ title: 'Customer details', content: [nameField.element, owner.element, status.element] }),
    createFormSection({ title: 'Communication', content: el('label', { className: 'ds-checkbox-label' }, updates, el('span', {}, 'Send mock account updates')) }));
  name.addEventListener('input', changed);
  const cancel = button('Cancel edits', async () => { await guard.resolve(); });
  const root = createFormLayout({ header: el('h3', {}, 'Mock customer editor'), sections: form, actions: [feedback, cancel, saveSlot] });
  renderSave();
  async function load(record) {
    if (destroyed || !(await guard.resolve())) return false;
    saved = { ...record }; restore(); renderSave(); feedback.textContent = saved.id ? `Editing ${saved.name} · Mock record.` : 'Creating a new mock customer. Save adds it to the results.';
    root.hidden = false; name.focus(); return true;
  }
  function destroy() {
    if (destroyed) return;
    destroyed = true; guard.destroy(); saveGate?.destroy(); owner.destroy?.(); status.destroy?.();
    publishDirty(dirtyOwner, false); dirtyEditors.delete(dirtyOwner);
  }
  onDetach(root, destroy);
  return { element: root, load, save, resolve: guard.resolve, isDirty, get current() { return { ...saved }; }, destroy };
}

function patternSection(title, description, ...content) {
  return el('section', { className: 'learn-workflow-section' }, el('h3', {}, title), el('p', { className: 'learn-feedback' }, description), ...content);
}

export function renderPatterns(container) {
  let rows = createMockCustomers();
  let nextId = 104;
  let page = 1;
  let pageSize = 3;
  let visibleColumns = ['name', 'status', 'owner'];
  let importDialog;
  let exportDialog;
  let deleteDialog;
  const selected = new Set();
  const feedback = el('p', { className: 'learn-feedback', role: 'status' }, 'Three mock customers. Edits, imports and bulk actions are session-only; saved views persist in this browser.');
  const results = el('div', { className: 'learn-pattern-results' });
  const count = el('p', { className: 'learn-feedback', role: 'status' });
  const search = el('input', { type: 'search', className: 'ds-input', placeholder: 'Search mock customers', oninput() { page = 1; draw(); } });
  const filters = createFilterBuilder({ fields: [{ key: 'name', label: 'Customer' }, { key: 'status', label: 'Status' }, { key: 'owner', label: 'Owner' }], onChange() { page = 1; draw(); } });
  const columns = [{ key: 'name', label: 'Customer' }, { key: 'status', label: 'Status' }, { key: 'owner', label: 'Owner' }];
  const columnMenu = createColumnVisibilityMenu({ columns: columns.map(column => ({ id: column.key, label: column.label, visible: true, locked: column.key === 'name' })), onChange(_id, _visible, next) { visibleColumns = next.filter(column => column.visible).map(column => column.id); draw(); } });
  const pagination = createPagination({ total: rows.length, pageSize, pageSizes: [3, 5, 10], onPageChange(value) { page = value; draw(); }, onPageSizeChange(value) { pageSize = value; page = 1; draw(); } });
  const editor = createCustomerEditor({ initial: rows[0], permission: record => record.id ? 'customers.edit' : 'customers.create', onSave(record) {
    if (record.id) rows = rows.map(row => row.id === record.id ? { ...row, ...record } : row);
    else { record = { ...record, id: `MOCK-${nextId++}` }; rows.push(record); }
    draw(); return record;
  } });
  const bulk = createBulkActionToolbar({ onClear() { selected.clear(); draw(); }, actions: [{ label: 'Mark selected active', async onAction() {
    if (!allowed('customers.edit')) throw new Error('Enable Edit customers in Settings first.');
    if (!(await editor.resolve())) return;
    const total = selected.size;
    rows = rows.map(row => selected.has(row.id) ? { ...row, status: 'Active' } : row);
    selected.clear(); draw(); feedback.textContent = `${total} selected mock customers marked Active.`;
  } }] });
  const bulkGate = createPermissionGate({ permission: 'customers.edit', content: bulk.element, reason: 'Edit customers is required for the mock bulk update.' });
  const views = createSavedViewSelector({ storageKey: 'forma-learn-customer-views', label: 'Saved customer views', getState: () => ({ search: search.value, conditions: filters.value, match: filters.match }), onSelect(state) {
    search.value = typeof state.search === 'string' ? state.search : '';
    filters.setValue(Array.isArray(state.conditions) ? state.conditions : [], { match: state.match === 'any' ? 'any' : 'all' });
    page = 1; draw();
  } });
  function matchingRows() {
    const query = search.value.trim().toLocaleLowerCase();
    return rows.filter(row => `${row.name} ${row.owner} ${row.status}`.toLocaleLowerCase().includes(query) && filters.predicate(row));
  }
  async function edit(row) {
    if (!allowed('customers.edit')) { feedback.textContent = 'Mock editing requires Edit customers in Settings.'; return; }
    if (await editor.load(row)) { openEditor.hidden = true; editor.element.scrollIntoView({ block: 'nearest' }); }
  }
  function draw() {
    const matching = matchingRows();
    page = Math.max(1, Math.min(page, Math.ceil(matching.length / pageSize) || 1));
    const visible = matching.slice((page - 1) * pageSize, page * pageSize);
    const shownColumns = columns.filter(column => visibleColumns.includes(column.key));
    const all = el('input', { type: 'checkbox', className: 'ds-checkbox', 'aria-label': 'Select all mock customers on this page', checked: visible.length > 0 && visible.every(row => selected.has(row.id)), disabled: !visible.length, onchange(event) {
      visible.forEach(row => event.target.checked ? selected.add(row.id) : selected.delete(row.id)); draw();
    } });
    all.indeterminate = visible.some(row => selected.has(row.id)) && !visible.every(row => selected.has(row.id));
    const header = el('tr', {}, el('th', { scope: 'col' }, all), ...shownColumns.map(column => el('th', { scope: 'col' }, column.label)));
    const body = el('tbody', {}, ...visible.map(row => el('tr', { 'aria-label': `Edit ${row.name} mock customer`, 'aria-selected': String(selected.has(row.id)) },
      el('td', {}, el('input', { type: 'checkbox', className: 'ds-checkbox', 'aria-label': `Select ${row.name}`, checked: selected.has(row.id), onchange(event) { event.target.checked ? selected.add(row.id) : selected.delete(row.id); draw(); } })),
      ...shownColumns.map(column => el('td', {}, column.key === 'status' ? createPill({ label: row.status, tone: row.status === 'Active' ? 'success' : 'neutral', size: 'small' }) : row[column.key])))));
    if (!visible.length) body.append(el('tr', {}, el('td', { colspan: shownColumns.length + 1 }, 'No mock customers match. Clear search or remove filter conditions.')));
    results.replaceChildren(createTable({ caption: 'Mock customers · Activate a row to edit · Selection is retained across pages and filters', header, body, className: 'learn-compact-table', onRowActivate: visible.length ? index => { void edit(visible[index]); } : undefined }));
    count.textContent = `${matching.length} of ${rows.length} mock customers match · ${selected.size} selected across all pages.`;
    pagination.setState({ total: matching.length, page, pageSize }); bulkGate.refresh(); bulk.setCount(selected.size);
  }
  const createGate = createPermissionGate({ permission: 'customers.create', reason: 'Enable Create customers in Settings to add a mock customer.', content: button('New mock customer', async () => {
    if (!allowed('customers.create')) return;
    if (await editor.load({ name: '', owner: 'Olivia', status: 'Trial', updates: false })) openEditor.hidden = true;
  }, 'primary') });
  const importGate = createPermissionGate({ permission: 'customers.create', reason: 'Create customers is required to import mock rows.', content: button('Import pasted CSV / file', () => {
    if (!allowed('customers.create')) return;
    importDialog = openImportWizard({ fields: [{ key: 'name', label: 'Name', required: true }, { key: 'owner', label: 'Owner' }, { key: 'status', label: 'Status' }], initialCSV: 'Name,Owner,Status\nCedar,Olivia,Trial\nNorthstar,Lana,Active', validateRows(imported) {
      const invalid = imported.find(row => (row.status?.trim() && !['Active', 'Trial', 'Archived'].includes(row.status.trim())) || (row.owner?.trim() && !['Olivia', 'Phoenix', 'Lana'].includes(row.owner.trim())));
      return invalid ? 'Use status Active, Trial or Archived and owner Olivia, Phoenix or Lana; optional blank values use defaults.' : undefined;
    }, onImport(imported) {
      if (!allowed('customers.create')) throw new Error('Create customers permission was removed. No mock rows were imported.');
      rows.push(...imported.map(row => ({ id: `MOCK-${nextId++}`, name: row.name.trim(), owner: row.owner?.trim() || 'Olivia', status: row.status?.trim() || 'Trial', updates: false })));
      page = 1; draw(); feedback.textContent = `${imported.length} mock customers imported locally. Current search and filters still apply.`;
    } });
  }) });
  const exportGate = createPermissionGate({ permission: 'customers.export', reason: 'Enable Export customers in Settings to download mock records.', content: button('Export matching mock rows', () => {
    if (!allowed('customers.export')) return;
    exportDialog = openExportDialog({ rows: matchingRows(), columns: columns.filter(column => visibleColumns.includes(column.key)), filename: 'mock-customer-results', title: 'Export matching mock customers', onExport(result) { feedback.textContent = `Browser download requested: ${result.filename}. CSV/JSON contains the matching rows and visible columns.`; } });
  }) });
  const deleteGate = createPermissionGate({ permission: 'customers.delete', reason: 'Delete customers is denied by default. Enable it in Settings to try the confirmed local action.', content: button('Delete selected mock customers', async () => {
    if (!allowed('customers.delete')) return;
    if (!selected.size) { feedback.textContent = 'Select at least one mock customer in the table before deleting.'; return; }
    if (!(await editor.resolve())) return;
    const ids = new Set(selected);
    deleteDialog = openConfirmDialog({ title: 'Delete selected mock customers?', description: `Permanently remove ${ids.size} selected customers from this session-only example. No server is connected.`, destructive: true, confirmLabel: 'Delete mock customers', onConfirm() {
      if (!allowed('customers.delete')) throw new Error('Delete customers permission was removed. Nothing was deleted.');
      rows = rows.filter(row => !ids.has(row.id)); ids.forEach(id => selected.delete(id));
      if (ids.has(editor.current.id)) { editor.element.hidden = true; openEditor.hidden = false; }
      draw(); feedback.textContent = `${ids.size} selected mock customers deleted locally.`;
    } });
  }, 'danger') });
  const openEditor = button('Open customer editor', async () => { if (await editor.load(rows.find(row => row.id === editor.current.id) || rows[0] || { name: '', owner: 'Olivia', status: 'Trial', updates: false })) openEditor.hidden = true; }, 'secondary', { hidden: true });
  const listing = createListingLayout({ header: el('h3', {}, 'Shared mock customer results'), summary: count, toolbar: columnMenu.element, table: results, pagination: pagination.element });
  const readGate = createPermissionGate({ permission: 'customers.read', content: listing, mode: 'hide', reason: 'Enable View customers in Settings to inspect the mock result table.' });
  container.append(el('div', { className: 'learn-workflow-grid' },
    patternSection('Search-and-filter', 'Search and FilterBuilder predicates both filter the actual shared results below.', field('Search mock customer name, owner or status', search), filters.element),
    patternSection('Saved views', 'Save the current search, conditions and All/Any matching mode; change them, then restore a named view after reload.', views.element),
    patternSection('Import/export', 'The three-step wizard parses pasted CSV or a local file, maps columns and appends reviewed rows. Export generates a real CSV/JSON browser download of matching rows.', el('div', { className: 'learn-pattern-actions' }, importGate.element, exportGate.element)),
    patternSection('Permission-aware actions', 'All actions use the same browser-local mock permission set as Settings; this is not server authorization.', el('a', { href: '#/settings/general' }, 'Change mock permissions in Settings'), deleteGate.element),
    patternSection('Bulk actions', 'Select actual table checkboxes. The toolbar shows the full selection count, including selected records on other pages or hidden by filters.', bulkGate.element),
    el('section', { className: 'learn-workflow-results learn-wide' }, readGate.element),
    patternSection('Create-and-edit', 'Create adds a row; activating a result row edits that same record. One shared form owns validation and the draft.', createGate.element, openEditor, editor.element),
    patternSection('Unsaved-changes guard', 'Edit a field, then leave the editor, switch records, switch Guide tabs or navigate away. The reusable controller asks Save / Discard / Keep editing.', button('Leave mock editor', async () => {
      if (await editor.resolve()) { editor.element.hidden = true; openEditor.hidden = false; openEditor.focus(); feedback.textContent = 'Left the mock editor after resolving its changes. Reopen it in Create-and-edit.'; }
    }))), feedback);
  draw();
  const refreshSelectionPermissions = () => { bulkGate.refresh(); bulk.setCount(selected.size); };
  window.addEventListener('app:permissions-changed', refreshSelectionPermissions);
  window.addEventListener('storage', refreshSelectionPermissions);
  onDetach(container, () => {
    window.removeEventListener('app:permissions-changed', refreshSelectionPermissions);
    window.removeEventListener('storage', refreshSelectionPermissions);
    importDialog?.close(); exportDialog?.close(); deleteDialog?.close(); editor.destroy(); filters.destroy(); views.destroy(); bulk.destroy(); columnMenu.destroy?.();
    [createGate, importGate, exportGate, deleteGate, bulkGate, readGate].forEach(gate => gate.destroy());
  });
}
