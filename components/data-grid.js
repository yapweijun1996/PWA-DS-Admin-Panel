import { element, button, uniqueId, playground, customSelect, statusMessage, onDetach } from './playground.js';
import { createFormField } from './form-field.js';
import { createNumberInput } from './number-input.js';
import { createCurrencyInput } from './currency-input.js';
import { createDatePicker } from './date-picker.js';
import { createUnsavedChangesGuard } from './unsaved-changes-guard.js';
import { formatCurrency } from '../js/logic/currency.js';
import { normalizeGridRows, validateGridRows, editGridCell, gridDirtyCells, aggregateGridColumns, moveGridFocus } from '../js/logic/data-grid.js';

export function createDataGrid({ label = 'Editable data', columns = [], rows = [], onChange = () => {}, onDirtyChange = () => {} } = {}) {
  const id = uniqueId('data-grid');
  const schema = columns.map(column => ({ type: 'text', ...column }));
  let data = normalizeGridRows(rows, schema);
  let saved = normalizeGridRows(data, schema);
  let dirty = false;
  let active = { row: 0, column: 0 };
  let editing = null;
  let cells = [];
  const help = element('p', { id: `${id}-help`, className: 'ds-data-grid-help' }, 'Arrow keys move between cells. Enter or tap a cell to edit. Enter saves an edit; Escape cancels. Tab saves and moves to the next cell. Unsaved marks identify changed cells.');
  const feedback = element('p', { id: `${id}-status`, className: 'ds-data-grid-status', role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' });
  const body = element('tbody', { role: 'rowgroup' });
  const footer = element('tfoot', { role: 'rowgroup' });
  const table = element('table', { className: 'ds-data-grid-table', role: 'grid', 'aria-label': label, 'aria-describedby': `${help.id} ${feedback.id}`, 'aria-colcount': schema.length },
    element('caption', { className: 'ds-data-grid-caption' }, label),
    element('thead', { role: 'rowgroup' }, element('tr', { role: 'row', 'aria-rowindex': 1 }, ...schema.map((column, index) => element('th', { role: 'columnheader', scope: 'col', 'aria-colindex': index + 1 }, column.label, column.required ? ' (required)' : '')))), body, footer);
  const scroll = element('div', { className: 'ds-data-grid-scroll' }, table);
  const emptyState = element('p', { className: 'ds-data-grid-empty', hidden: data.length > 0 && schema.length > 0 }, schema.length ? 'No rows to edit.' : 'No columns configured.');
  const root = element('section', { className: 'ds-data-grid', 'aria-label': label }, help, scroll, emptyState, feedback);
  const numberFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 6 });

  function getRows() { return data.map(row => ({ ...row })); }
  function errors() { return validateGridRows(data, schema); }
  function isValid() { return errors().every(row => Object.values(row).every(message => !message)); }
  function display(column, value, error = '') {
    if (value === null || value === undefined || value === '') return '—';
    if (error) return String(value);
    if (column.type === 'currency') return formatCurrency(value, { currency: column.currency, locale: column.locale });
    if (column.type === 'number') return numberFormat.format(value);
    if (column.type === 'select') return String(column.options?.find(option => Object.is(option.value, value))?.label ?? value);
    return String(value);
  }
  function focusCell(position = active) {
    active = moveGridFocus(position, '', data.length, schema.length);
    cells.forEach((row, rowIndex) => row.forEach((cell, columnIndex) => { cell.node.tabIndex = rowIndex === active.row && columnIndex === active.column ? 0 : -1; }));
    cells[active.row]?.[active.column]?.node.focus();
  }
  function refreshMetadata() {
    const validation = errors();
    const changed = gridDirtyCells(data, saved, schema);
    const nextDirty = data.length !== saved.length || changed.some(row => Object.values(row).some(Boolean));
    let invalid = 0;
    cells.forEach((row, rowIndex) => row.forEach((cell, columnIndex) => {
      const column = schema[columnIndex];
      const error = validation[rowIndex][column.key];
      const isDirty = changed[rowIndex][column.key];
      if (error) invalid += 1;
      cell.node.setAttribute('aria-invalid', String(Boolean(error)));
      cell.node.classList.toggle('is-invalid', Boolean(error));
      cell.node.classList.toggle('is-dirty', isDirty);
      cell.error.textContent = error;
      cell.error.hidden = !error;
      cell.dirty.hidden = !isDirty;
      const description = [error && cell.error.id, isDirty && cell.dirty.id].filter(Boolean).join(' ');
      if (description) cell.node.setAttribute('aria-describedby', description); else cell.node.removeAttribute('aria-describedby');
      if (editing?.row === rowIndex && editing.column === columnIndex) {
        editing.control.setError?.('');
        const input = editing.control.input || editing.control.trigger;
        input.setAttribute('aria-invalid', String(Boolean(error)));
        const ids = (input.getAttribute('aria-describedby') || '').split(/\s+/).filter(value => value && value !== cell.error.id);
        if (error) ids.push(cell.error.id);
        if (ids.length) input.setAttribute('aria-describedby', [...new Set(ids)].join(' ')); else input.removeAttribute('aria-describedby');
      } else cell.value.textContent = display(column, data[rowIndex][column.key], error);
    }));
    const aggregates = aggregateGridColumns(data, schema);
    footer.replaceChildren();
    if (Object.keys(aggregates).length) {
      footer.append(element('tr', { role: 'row', 'aria-rowindex': data.length + 2 }, ...schema.map((column, index) => {
        const aggregate = aggregates[column.key];
        if (!aggregate) return element('td', { role: 'gridcell', 'aria-colindex': index + 1 }, index === 0 ? 'Valid-cell totals' : '');
        return element('td', { role: 'gridcell', 'aria-colindex': index + 1 }, element('strong', {}, `${aggregate.aggregate === 'sum' ? 'Sum' : 'Average'}: ${aggregate.value === null ? '—' : display(column, aggregate.value)}`), element('small', {}, `${aggregate.count} included${aggregate.excluded ? ` · ${aggregate.excluded} empty/invalid excluded` : ''}`));
      })));
    }
    table.setAttribute('aria-rowcount', data.length + 1 + (Object.keys(aggregates).length ? 1 : 0));
    feedback.textContent = `${nextDirty ? 'Unsaved changes.' : 'All changes saved.'}${invalid ? ` ${invalid} invalid ${invalid === 1 ? 'cell' : 'cells'}; correct errors before saving. Invalid and empty values are excluded from totals.` : ''}`;
    if (nextDirty !== dirty) { dirty = nextDirty; onDirtyChange(dirty); }
  }
  function renderRows() {
    cells = data.map((row, rowIndex) => schema.map((column, columnIndex) => {
      const value = element('span', { className: 'ds-data-grid-value' });
      const mark = element('small', { id: `${id}-${rowIndex}-${columnIndex}-dirty`, className: 'ds-data-grid-dirty', hidden: true }, 'Unsaved');
      const error = element('small', { id: `${id}-${rowIndex}-${columnIndex}-error`, className: 'ds-data-grid-error', hidden: true });
      const node = element('td', { role: 'gridcell', className: 'ds-data-grid-cell', 'data-row': rowIndex, 'data-column': columnIndex, 'aria-colindex': columnIndex + 1, 'aria-readonly': 'false', tabindex: rowIndex === active.row && columnIndex === active.column ? 0 : -1 }, value, mark, error);
      return { node, value, dirty: mark, error };
    }));
    body.replaceChildren(...cells.map((row, rowIndex) => element('tr', { role: 'row', 'aria-rowindex': rowIndex + 2 }, ...row.map(cell => cell.node))));
    emptyState.hidden = data.length > 0 && schema.length > 0;
    scroll.hidden = !schema.length;
    refreshMetadata();
  }
  function notify() { refreshMetadata(); onChange(getRows()); }
  function record(value) {
    if (!editing) return;
    data = editGridCell(data, schema, editing.row, schema[editing.column].key, value);
    notify();
  }
  function readDraft() {
    if (!editing) return;
    const control = editing.control;
    record(Object.hasOwn(editing, 'currencyDraft') ? editing.currencyDraft : control.input ? control.input.value : schema[editing.column].type === 'date' && !editing.dateChanged ? editing.original : control.value);
  }
  function finishEdit(cancel = false, focus = true) {
    if (!editing) return;
    if (!cancel) readDraft();
    const current = editing;
    editing = null;
    current.control.close?.();
    if (cancel) {
      data = editGridCell(data, schema, current.row, schema[current.column].key, current.original);
      onChange(getRows());
    }
    renderRows();
    if (focus) focusCell({ row: current.row, column: current.column });
  }
  function startEdit(row, column) {
    if (editing?.row === row && editing.column === column) return;
    if (editing) finishEdit(false, false);
    active = { row, column };
    const definition = schema[column];
    const value = data[row][definition.key];
    const name = `${definition.label}, row ${row + 1}`;
    const props = { label: name, required: definition.required, min: definition.min, max: definition.max };
    const current = { row, column, original: value, control: null };
    editing = current;
    let control;
    if (definition.type === 'number') {
      control = createNumberInput({ ...props, value: null, onChange: () => readDraft() });
      // Programmatic NumberInput values clamp; grid drafts must not silently clamp.
      control.input.value = value === null || value === undefined ? '' : String(value);
      if (typeof value === 'number' && Number.isFinite(value)) control.input.setAttribute('aria-valuenow', value);
      // The spinbutton's Up/Down keys provide the same step actions without extra tab stops.
      control.element.querySelectorAll('button').forEach(stepper => { stepper.tabIndex = -1; });
    } else if (definition.type === 'currency') {
      control = createCurrencyInput({ ...props, currency: definition.currency, locale: definition.locale, value: typeof value === 'number' ? value : null });
      // CurrencyInput formats on Enter/blur; validation must retain the unrounded draft.
      current.currencyDraft = value;
      if (typeof value !== 'number') control.input.value = value ?? '';
    } else if (definition.type === 'select') {
      const options = [...(definition.options || [])];
      if (!definition.required && !options.some(option => option.value === null)) options.unshift({ value: null, label: 'No selection' });
      control = customSelect({ label: name, value, options, onChange: next => { record(next); finishEdit(); } });
    } else if (definition.type === 'date') {
      control = createDatePicker({ ...props, value, onChange: next => {
        current.dateChanged = true;
        record(next);
        queueMicrotask(() => { if (editing === current) finishEdit(); });
      } });
    } else {
      const input = element('input', { type: 'text', className: 'ds-input', value: value ?? '' });
      const field = createFormField({ label: name, control: input, required: definition.required });
      control = { ...field, input };
    }
    current.control = control;
    const cell = cells[row][column];
    cell.value.replaceChildren(control.element);
    cell.value.classList.add('ds-data-grid-editor');
    cell.node.tabIndex = -1;
    if (control.input) control.input.addEventListener('input', () => {
      if (definition.type === 'currency') current.currencyDraft = control.input.value;
      readDraft();
    });
    refreshMetadata();
    (control.input || control.trigger).focus();
    control.input?.select();
  }
  table.addEventListener('click', event => {
    const cell = event.target.closest('[data-row][data-column]');
    if (cell) startEdit(Number(cell.dataset.row), Number(cell.dataset.column));
  });
  table.addEventListener('focusin', event => {
    if (editing) return;
    const cell = event.target.closest('[data-row][data-column]');
    if (!cell) return;
    active = { row: Number(cell.dataset.row), column: Number(cell.dataset.column) };
    cells.forEach(row => row.forEach(item => { item.node.tabIndex = item.node === cell ? 0 : -1; }));
  });
  table.addEventListener('keydown', event => {
    if (editing) {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); finishEdit(true); }
      else if (event.key === 'Enter' && event.target === editing.control.input) { event.preventDefault(); finishEdit(); }
      else if (event.key === 'Tab') {
        event.preventDefault();
        const index = editing.row * schema.length + editing.column + (event.shiftKey ? -1 : 1);
        finishEdit();
        if (index >= 0 && index < data.length * schema.length) focusCell({ row: Math.floor(index / schema.length), column: index % schema.length });
      }
      return;
    }
    if (!event.target.matches('[role="gridcell"][data-row]')) return;
    if (event.key === 'Enter' || event.key === 'F2') { event.preventDefault(); startEdit(active.row, active.column); }
    else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) { event.preventDefault(); focusCell(moveGridFocus(active, event.key, data.length, schema.length)); }
  });
  root.addEventListener('focusout', () => {
    const current = editing;
    queueMicrotask(() => {
      if (!current || editing !== current || current.control.trigger?.getAttribute('aria-expanded') === 'true') return;
      if (!cells[current.row]?.[current.column]?.node.contains(document.activeElement)) finishEdit(false, false);
    });
  });
  function markSaved() {
    finishEdit(false, false);
    if (!isValid()) { refreshMetadata(); return false; }
    saved = getRows();
    refreshMetadata();
    return true;
  }
  function setRows(next) {
    const current = editing;
    editing = null;
    current?.control.close?.();
    data = normalizeGridRows(next, schema);
    saved = getRows();
    active = moveGridFocus(active, '', data.length, schema.length);
    renderRows();
  }
  onDetach(root, () => { editing?.control.close?.(); editing = null; });
  renderRows();
  return { element: root, getRows, isValid, markSaved, setRows };
}

export const guide = {
  purpose: 'Edit structured rows with a keyboard-accessible grid, inline validation, unsaved-cell marks and valid-only numeric totals.',
  props: ['createDataGrid({label, columns, rows, onChange(rows), onDirtyChange(boolean)}) returns {element, getRows(), isValid(), markSaved(), setRows(rows)}.', 'Columns: {key,label,type:"text"|"number"|"currency"|"select"|"date",options?:[{value,label}],min?,max?,required?,aggregate?:"sum"|"average",validate?(value,row,rowIndex),currency?,locale?}. The default type is text. Custom validation returns an error string or false; true, null or undefined accepts the value. Date bounds and values use ISO YYYY-MM-DD. Currency is in major units, with optional currency/locale defaulting to USD/en-US.', 'getRows returns shallow row snapshots, including unparseable invalid drafts; parseable numeric edits become numbers without clamping. onChange fires for live drafts and Escape rollback. Consumers must call isValid before domain calculations or persistence. Footer sums/averages omit invalid and empty cells and display the included count.', 'markSaved commits the active edit, returns false on invalid data, otherwise resets dirty marks. setRows silently replaces rows and the saved baseline; onDirtyChange fires only when dirty state changes, including live input and reverting to saved values.', 'The consumer owns UnsavedChangesGuard: store onDirtyChange in a boolean; pass isDirty:()=>dirty, onSave that validates/persists then calls markSaved(), and onDiscard:()=>grid.setRows(savedRows). Destroy the guard on owner teardown. The grid does not install a second guard.'],
  variants: ['Text, number, localized currency, custom select and shared DatePicker editors; per-column sum or average footers.'],
  states: ['Clean, dirty cell with visible Unsaved text, editing, invalid with retained value and associated message, empty rows and computed footer.'],
  keyboard: ['Tab enters the grid at one active cell. Arrow keys move without wrapping; Home/End move to the row edges. Enter/F2 or a pointer tap enters editing.', 'Text/number/currency: Enter commits, Escape restores the pre-edit value; Tab/Shift+Tab commits and moves to the adjacent cell. At a boundary Tab commits back to the cell, then Tab leaves. Native editing arrows and the shared controls retain their own keyboard behavior.', 'Select or DatePicker selection commits automatically. Escape first closes an open popup; Escape again cancels the cell edit. Leaving the editor commits the draft, including invalid input for correction.'],
  accessibility: ['ARIA grid, rowgroups, row/column indices and counts, column headers and a caption. Roving cell tabindex keeps navigation efficient; every editor has a row-specific label.', 'aria-invalid and described errors associate invalid cells and controls with visible messages. A polite status summarizes validation and unsaved state. Unsaved text conveys dirty state without colour alone.'],
  tokens: ['--surface, --surface-soft, --text, --muted, --border, --border-subtle, --accent-soft, --accent-text, --danger-text, --focus-ring, --space-1 through --space-12, --radius, --control-height, --font-size-sm.'],
  responsive: ['The table scrolls inside its container; its first column remains sticky on phones. Cells and shared editor controls meet 44px phone targets and use 16px phone text. Table surfaces stay opaque in all kits.'],
  do: ['Keep saved row snapshots in the consumer, validate before saving and wire onDirtyChange into one owner-level UnsavedChangesGuard.', 'Use integer cents in domain-specific financial calculations when exact money arithmetic is required; display footers are generic numeric summaries.'],
  dont: ['Do not treat an invalid draft as zero or permit invalid rows to be persisted.', 'Do not use an editable grid as an ordinary read-only listing; use Table instead.'],
  example: 'let dirty = false;\nlet savedRows = [{name:"Avery", score:84}];\nconst grid = createDataGrid({label: "Mock grades", columns: [{key:"name", label:"Student", type:"text", required:true}, {key:"score", label:"Score", type:"number", min:0, max:100, aggregate:"average"}], rows: savedRows, onDirtyChange: value => { dirty = value; }});\ncontainer.append(grid.element);\nconst guard = createUnsavedChangesGuard({isDirty:()=>dirty, onSave:()=>{ if (!grid.markSaved()) return false; savedRows = grid.getRows(); return true; }, onDiscard:()=>grid.setRows(savedRows)});\n// This demo saves in memory only. Destroy guard on owner teardown.'
};

export function render(container) {
  const page = playground(container, { title: 'Data grid', description: 'Editable mock invoice rows with validation, live totals and a real unsaved-changes decision. No server writes.' });
  const columns = [
    { key: 'item', label: 'Item', type: 'text', required: true },
    { key: 'quantity', label: 'Quantity', type: 'number', min: 0, max: 100, required: true, aggregate: 'sum' },
    { key: 'price', label: 'Price', type: 'currency', min: 0, required: true, aggregate: 'average' },
    { key: 'status', label: 'Status', type: 'select', required: true, options: [{ value: 'draft', label: 'Draft' }, { value: 'ready', label: 'Ready' }] },
    { key: 'date', label: 'Delivery', type: 'date', required: true }
  ];
  const initial = [{ item: 'Mock notebooks', quantity: 3, price: 12.5, status: 'draft', date: '2026-10-26' }, { item: 'Mock folders', quantity: 5, price: 4.25, status: 'ready', date: '2026-10-28' }];
  let savedRows = initial.map(row => ({ ...row }));
  let dirty = false;
  const status = statusMessage('Mock rows are saved locally for this preview only.');
  const grid = createDataGrid({ label: 'Mock invoice line items', columns, rows: initial, onDirtyChange: value => { dirty = value; } });
  function save() {
    if (!grid.markSaved()) { status.textContent = 'Correct invalid cells before saving mock rows.'; return false; }
    savedRows = grid.getRows();
    status.textContent = 'Mock rows saved in memory.';
    return true;
  }
  const guard = createUnsavedChangesGuard({ isDirty: () => dirty, onSave: save, onDiscard: () => { grid.setRows(savedRows); status.textContent = 'Mock changes discarded.'; } });
  page.preview.append(grid.element, button('Save mock rows', save, 'primary'), button('Try leaving mock editor', async () => { const allowed = await guard.resolve(); status.textContent = allowed ? 'Leaving allowed; the mock preview remains available.' : 'Stayed in the mock editor.'; }), status);
  page.controls.append(button('Show invalid mock quantity', () => grid.setRows([{ ...initial[0], quantity: 'not a number' }, initial[1]])), button('Show empty state', () => grid.setRows([])), button('Reset mock rows', () => { savedRows = initial.map(row => ({ ...row })); grid.setRows(savedRows); }));
  page.states.append(element('p', {}, 'Try entering −1 or text in Quantity. The draft and error remain visible; invalid values do not affect footer totals. Escape restores the value from before the edit.'));
  page.setSnippet(guide.example);
  onDetach(page.section, guard.destroy);
}
