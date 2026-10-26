import { element, playground, statusMessage, button, onDetach } from './playground.js';
import { createMenu } from './popover.js';

export function createColumnVisibilityMenu({ columns = [], onChange = () => {}, label = 'Columns' } = {}) {
  const slot = element('div', { className: 'ds-column-visibility-menu' });
  let currentColumns = [];
  let menu;
  let destroyed = false;
  function snapshot() { return currentColumns.map(column => ({ ...column })); }
  function sync() {
    const visibleCount = currentColumns.filter(column => column.visible).length;
    const options = [...menu.element.querySelectorAll('[role="menuitemcheckbox"]')];
    options.forEach((option, index) => {
      const column = currentColumns[index];
      option.setAttribute('aria-checked', String(column.visible));
      option.disabled = Boolean(column.locked || (column.visible && visibleCount === 1));
      option.textContent = `${column.visible ? '✓ ' : ''}${column.label}${column.locked ? ' (required)' : column.visible && visibleCount === 1 ? ' (last visible)' : ''}`;
    });
    menu.trigger.disabled = !currentColumns.length;
  }
  function setColumns(next) {
    if (destroyed) return;
    menu?.close();
    currentColumns = next.map(column => ({ ...column, visible: column.locked || column.visible !== false }));
    if (currentColumns.length && !currentColumns.some(column => column.visible)) currentColumns[0].visible = true;
    menu = createMenu({ label, items: currentColumns.map(column => ({ label: column.label, action: () => {
      if (column.locked || (column.visible && currentColumns.filter(item => item.visible).length === 1)) return;
      column.visible = !column.visible;
      sync();
      column.onChange?.(column.visible);
      onChange(column.id, column.visible, snapshot());
    } })) });
    menu.element.querySelectorAll('[role="menuitem"]').forEach(option => option.setAttribute('role', 'menuitemcheckbox'));
    menu.element.classList.add('ds-column-visibility-popover');
    slot.replaceChildren(menu.element);
    sync();
  }
  function destroy() { if (destroyed) return; destroyed = true; menu?.close(); }
  setColumns(columns);
  onDetach(slot, destroy);
  return { element: slot, get trigger() { return menu.trigger; }, get columns() { return snapshot(); }, setColumns, destroy };
}

export const guide = {
  purpose: 'Toggle actual listing columns through a shared keyboard-operable menu while keeping at least one column visible.',
  props: ['createColumnVisibilityMenu({columns:[{id,label,visible=true,locked=false,onChange(visible)}],onChange(id,visible,columns),label="Columns"}) returns element,trigger,columns,setColumns,destroy. Callbacks apply visibility to the owning table.'],
  variants: ['Optional columns and required locked columns.'], states: ['Visible, hidden, required, last visible, empty column collection.'],
  keyboard: ['Arrow Down/Up opens and moves; Home/End jump; Enter/Space toggles an enabled column; Escape closes and restores focus.'],
  accessibility: ['Named trigger has aria-expanded and aria-controls; menuitemcheckbox exposes aria-checked; required and last-visible items cannot be hidden.'],
  tokens: ['Shared Popover --surface, --text, --radius, --shadow; --space-2.'], responsive: ['Shared menu clamps to the viewport; menu items provide 44px targets.'],
  do: ['Keep headers and all body cells synchronized with onChange; use locked for essential identifiers.'], dont: ['Do not allow a table to lose every visible column.'],
  example: 'createColumnVisibilityMenu({columns:[{id:"name",label:"Name",visible:true},{id:"plan",label:"Plan",visible:true}],onChange:(id,visible)=>setColumnVisible(id,visible)})'
};
export function render(container) {
  const page = playground(container, { title: 'ColumnVisibilityMenu', description: 'Toggle the real columns in this mock table. The final visible column is protected.' });
  const columns = [{ id: 'name', label: 'Mock customer', visible: true }, { id: 'plan', label: 'Plan', visible: true }, { id: 'region', label: 'Region', visible: true }];
  const rows = [{ name: 'Acme Co', plan: 'Business', region: 'US' }, { name: 'Northstar School', plan: 'Education', region: 'SG' }];
  const table = element('table', { className: 'ds-table ds-column-visibility-demo' }, element('caption', {}, 'Mock customer directory'));
  const feedback = statusMessage('All three mock columns are visible.');
  const menu = createColumnVisibilityMenu({ columns, onChange: (id, visible, next) => { columns.forEach(column => { column.visible = next.find(item => item.id === column.id).visible; }); draw(); feedback.textContent = `${columns.find(column => column.id === id).label} ${visible ? 'shown' : 'hidden'}.`; } });
  function draw() {
    const shown = columns.filter(column => column.visible);
    table.replaceChildren(element('caption', {}, 'Mock customer directory'), element('thead', {}, element('tr', {}, ...shown.map(column => element('th', { scope: 'col' }, column.label)))), element('tbody', {}, ...rows.map(row => element('tr', {}, ...shown.map(column => element('td', {}, row[column.id]))))));
  }
  page.preview.append(menu.element, element('div', { className: 'ds-column-visibility-table-wrap' }, table), feedback);
  page.controls.append(button('Show all columns', () => { columns.forEach(column => { column.visible = true; }); menu.setColumns(columns); draw(); feedback.textContent = 'All mock columns restored.'; }));
  page.states.append(element('p', {}, 'Checkmarks indicate visible columns. The final visible column is disabled until another is shown.'));
  page.setSnippet(guide.example); draw();
}
