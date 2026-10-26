import { element, button, customSelect, playground, statusMessage, toggleControl, onDetach } from './playground.js';
import { createFormField } from './form-field.js';
import { createNumberInput } from './number-input.js';
import { openConfirmDialog } from './confirm-dialog.js';
import { FILTER_OPERATORS, createFilterPredicate, summarizeFilters } from '../js/logic/filter.js';

const defaultFields = [{ key: 'name', label: 'Name' }, { key: 'status', label: 'Status' }, { key: 'seats', label: 'Seats', type: 'number' }];
const emptyOperators = ['isEmpty', 'isNotEmpty'];

export function createFilterBuilder({ fields = defaultFields, value = [], match = 'all', disabled = false, onChange = () => {} } = {}) {
  if (!fields.length || fields.some(field => !field.key)) throw new TypeError('FilterBuilder requires fields with non-empty keys.');
  let conditions = [];
  let mode = match;
  let predicate;
  let confirmation;
  const root = element('section', { className: 'ds-filter-builder', 'aria-label': 'Filter conditions' });
  const rows = element('div', { className: 'ds-filter-rows' });
  const summary = statusMessage();
  summary.classList.add('ds-filter-summary');
  const matchChoice = customSelect({ label: 'Combine conditions', value: mode, disabled, options: [{ value: 'all', label: 'Match all conditions (AND)' }, { value: 'any', label: 'Match any condition (OR)' }], onChange(next) { mode = next; refresh(true); } });
  const add = button('Add condition', () => {
    conditions.push({ field: fields[0].key, operator: 'contains', value: '' });
    drawRows(); refresh(true);
    rows.lastElementChild?.querySelector('button')?.focus();
  }, 'secondary', { disabled });
  root.append(createFormField({ label: 'Combine conditions', control: matchChoice.element }).element, rows, add, summary);

  function refresh(notify = false) {
    predicate = createFilterPredicate(conditions, { match: mode });
    summary.textContent = summarizeFilters(conditions, { match: mode, fields });
    if (notify) onChange(conditions.map(condition => ({ ...condition })), predicate, { match: mode, summary: summary.textContent });
  }
  function drawRows() {
    rows.replaceChildren(...conditions.map((condition, index) => {
      const group = element('fieldset', { className: 'ds-filter-row', disabled }, element('legend', {}, `Condition ${index + 1}`));
      const fieldChoice = customSelect({ label: `Condition ${index + 1} field`, value: condition.field, disabled, options: fields.map(field => ({ value: field.key, label: field.label || field.key })), onChange(next) {
        condition.field = next; condition.value = ''; drawRows(); refresh(true);
        rows.children[index]?.querySelector('button')?.focus();
      } });
      const operatorChoice = customSelect({ label: `Condition ${index + 1} operator`, value: condition.operator, disabled, options: Object.entries(FILTER_OPERATORS).map(([key, label]) => ({ value: key, label })), onChange(next) {
        condition.operator = next; drawRows(); refresh(true);
        rows.children[index]?.querySelectorAll('.ds-select-trigger')[1]?.focus();
      } });
      let valueControl;
      if (emptyOperators.includes(condition.operator)) valueControl = element('p', { className: 'ds-filter-no-value' }, 'No value needed');
      else if (fields.find(field => field.key === condition.field)?.type === 'number') {
        valueControl = createNumberInput({ label: `Condition ${index + 1} value`, value: condition.value, disabled, onChange(next) { condition.value = next ?? ''; refresh(true); } }).element;
      } else {
        const input = element('input', { className: 'ds-input', type: 'text', value: condition.value ?? '', disabled, oninput(event) { condition.value = event.target.value; refresh(true); } });
        valueControl = createFormField({ label: `Condition ${index + 1} value`, control: input }).element;
      }
      const remove = button('Remove', () => {
        confirmation?.close('replace');
        confirmation = openConfirmDialog({ title: 'Remove filter condition?', description: `Remove condition ${index + 1}: ${summarizeFilters([condition], { fields })}. This changes which records are visible, not the source data.`, confirmLabel: 'Remove condition', destructive: true, onConfirm() {
          conditions = conditions.filter(item => item !== condition); drawRows(); refresh(true);
        }, onClose(reason) { confirmation = undefined; if (reason === 'confirmed') add.focus(); } });
      }, 'ghost', { disabled, 'aria-label': `Remove condition ${index + 1}` });
      group.append(createFormField({ label: 'Field', control: fieldChoice.element }).element, createFormField({ label: 'Operator', control: operatorChoice.element }).element, valueControl, remove);
      return group;
    }));
    if (!conditions.length) rows.append(element('p', { className: 'ds-filter-empty' }, 'No conditions. All records are included.'));
  }
  function setValue(next, { match: nextMatch = mode } = {}) {
    if (!Array.isArray(next)) throw new TypeError('Filter value must be an array.');
    const copied = next.map(condition => ({ ...condition }));
    createFilterPredicate(copied, { match: nextMatch });
    if (copied.some(condition => !fields.some(field => field.key === condition.field))) throw new TypeError('Filter condition uses an unknown field.');
    conditions = copied; mode = nextMatch; matchChoice.setValue(mode); drawRows(); refresh();
  }
  function setDisabled(next) {
    disabled = Boolean(next); add.disabled = disabled; matchChoice.setDisabled(disabled); drawRows();
  }
  setValue(value);
  onDetach(root, () => confirmation?.close('navigation'));
  return { element: root, get value() { return conditions.map(condition => ({ ...condition })); }, get match() { return mode; }, get summary() { return summary.textContent; }, get predicate() { return predicate; }, setValue, setDisabled, destroy() { confirmation?.close('destroy'); } };
}

export const guide = {
  purpose: 'Build readable field/operator/value conditions and apply the shared pure predicate to real local data.',
  props: ['createFilterBuilder({fields:[{key,label,type}],value:conditions[],match="all",disabled,onChange(value,predicate,{match,summary})}) returns element,value,match,summary,predicate,setValue(value,{match}),setDisabled,destroy. setValue is silent; predicates use case-insensitive text and numeric comparisons from js/logic/filter.js.'],
  variants: ['Match all (AND) or any (OR); text and numeric values; value-free empty/not-empty conditions.'],
  states: ['No conditions, editing, multiple conditions, disabled, confirmed removal, no matching mock records.'],
  keyboard: ['Tab reaches fields, operators, values and row actions; custom selects use arrows, Home/End and Escape; numeric values use arrow stepping. Removal opens ConfirmDialog.'],
  accessibility: ['Numbered fieldsets, persistent FormField labels, named removal buttons and a polite readable summary.'],
  tokens: ['--space-2, --space-3, --space-4, --color-border-subtle, --surface, --muted'],
  responsive: ['Condition columns become a single stack on phones; controls keep 44px targets and 16px input text.'],
  do: ['Apply builder.predicate to the same dataset shown to users and label demonstrations mock.'],
  dont: ['Do not describe filtering as deleting source records or use this predicate as a server authorization boundary.'],
  example: 'const filters = createFilterBuilder({fields, onChange: (_, predicate) => showRows(rows.filter(predicate))});\nfilters.setValue([{field:"status",operator:"equals",value:"Active"}]);\nshowRows(rows.filter(filters.predicate));'
};

export function render(container) {
  const page = playground(container, { title: 'FilterBuilder', description: 'Add conditions to filter mock customers immediately. Source records are never changed.' });
  const data = [{ name: 'Catalog', status: 'Active', seats: 24 }, { name: 'Layers', status: 'Paused', seats: 8 }, { name: 'Orbit', status: 'Active', seats: 60 }, { name: 'Acme', status: 'Invited', seats: 12 }];
  const results = element('div', { className: 'ds-filter-results' });
  function show(predicate) {
    const visible = data.filter(predicate);
    results.replaceChildren(element('h3', {}, `${visible.length} of ${data.length} mock customers`), visible.length ? element('ul', {}, ...visible.map(row => element('li', {}, `${row.name} · ${row.status} · ${row.seats} seats`))) : element('p', {}, 'No mock customers match these conditions.'));
  }
  const builder = createFilterBuilder({ value: [{ field: 'status', operator: 'equals', value: 'Active' }], onChange: (_, predicate) => show(predicate) });
  page.preview.append(builder.element, results); show(builder.predicate);
  page.controls.append(toggleControl('Disabled', false, value => builder.setDisabled(value)));
  page.states.append(element('p', {}, 'Try Seats is greater than 30, switch AND/OR, or remove a condition after confirmation.'));
  page.setSnippet(guide.example);
}
