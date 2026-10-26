import { element, button, playground, statusMessage, openModal, onDetach } from './playground.js';

export function createBulkActionToolbar({ count = 0, actions = [], onClear = () => {} } = {}) {
  const summary = element('span', { className: 'ds-bulk-count', role: 'status', 'aria-live': 'polite' });
  const controls = element('div', { className: 'ds-bulk-controls' });
  const root = element('div', { className: 'ds-bulk-action-toolbar', role: 'toolbar', 'aria-label': 'Bulk actions' }, summary, controls);
  let currentCount = 0;
  let busy = false;
  let destroyed = false;
  let dialog;
  const feedback = element('span', { className: 'ds-bulk-feedback', role: 'status' });
  const buttons = actions.map(action => {
    const control = button(action.label, async () => {
      if (destroyed || busy || !currentCount || action.disabled) return;
      if (!action.danger) { await perform(action); return; }
      const selectedCount = currentCount;
      dialog = openModal({ title: `${action.label}?`, content: element('p', {}, `Apply this destructive action to ${selectedCount} selected ${selectedCount === 1 ? 'item' : 'items'}?`), onClose: () => { dialog = undefined; }, actions: [
        { label: 'Cancel', onClick: close => close() },
        { label: action.label, variant: 'danger', onClick: close => { close(); if (currentCount === selectedCount) perform(action); else feedback.textContent = 'Selection changed. Review the selection before trying again.'; } }
      ] });
    }, action.danger ? 'danger' : 'secondary');
    controls.append(control);
    return control;
  });
  const clear = button('Clear selection', () => { if (!busy) onClear(); }, 'ghost');
  controls.append(clear);
  root.append(feedback);
  function sync() {
    root.hidden = currentCount === 0;
    root.setAttribute('aria-busy', String(busy));
    summary.textContent = `${currentCount} selected`;
    buttons.forEach((control, index) => { control.disabled = busy || !currentCount || Boolean(actions[index].disabled); });
    clear.disabled = busy || !currentCount;
  }
  async function perform(action) {
    if (busy || destroyed || !currentCount) return;
    busy = true; feedback.textContent = ''; sync();
    try { await action.onAction?.(currentCount); }
    catch (failure) { if (!destroyed) feedback.textContent = failure instanceof Error ? failure.message : 'Bulk action failed. Try again.'; }
    finally { busy = false; if (!destroyed) sync(); }
  }
  function setCount(next) { currentCount = Math.max(0, Math.trunc(Number(next) || 0)); feedback.textContent = ''; sync(); }
  function destroy() { if (destroyed) return; destroyed = true; dialog?.close(); }
  root.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const enabled = [...controls.querySelectorAll('button:not(:disabled)')];
    const index = enabled.indexOf(document.activeElement);
    if (index < 0) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? enabled.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + enabled.length) % enabled.length;
    enabled[next]?.focus();
  });
  onDetach(root, destroy);
  setCount(count);
  return { element: root, setCount, destroy };
}

export const guide = {
  purpose: 'Expose selection-aware bulk actions only when one or more records are selected.',
  props: ['createBulkActionToolbar({count=0,actions:[{label,onAction(count),danger,disabled}],onClear}) returns element,setCount(count),destroy. Async actions disable duplicate activation and show failures.'],
  variants: ['Ordinary actions, destructive actions with confirmation, disabled actions.'], states: ['Hidden at zero, selected count, busy, failure.'],
  keyboard: ['Tab reaches actions; Left/Right and Home/End move between enabled actions; Enter/Space activates; confirmation uses shared Modal keyboard behavior.'],
  accessibility: ['Named toolbar and live selection count; native disabled buttons while busy.'],
  tokens: ['--surface, --border, --radius, --space-2, --space-3, --muted'], responsive: ['Toolbar and buttons wrap rather than overflow; actions have 44px minimum height.'],
  do: ['Update count from actual selected records and handle mutations in onAction.'], dont: ['Do not silently run destructive actions or show an empty toolbar.'],
  example: 'createBulkActionToolbar({count: selected.size, onClear: clearSelection, actions: [{label:"Delete mock records", danger:true, onAction: deleteSelected}]})'
};
export function render(container) {
  const page = playground(container, { title: 'BulkActionToolbar', description: 'Select actual mock records to reveal actions. Archive updates the records after confirmation.' });
  const rows = [{ id: 'MOCK-101', label: 'Acme Co', archived: false }, { id: 'MOCK-102', label: 'Northstar School', archived: false }, { id: 'MOCK-103', label: 'Cedar Studio', archived: false }];
  const selected = new Set();
  const list = element('div', { className: 'ds-bulk-demo-list' });
  const feedback = statusMessage('No mock records selected.');
  const toolbar = createBulkActionToolbar({ onClear: () => { selected.clear(); draw(); }, actions: [
    { label: 'Summarize mock selection', onAction: count => { feedback.textContent = `${count} mock records: ${rows.filter(row => selected.has(row.id)).map(row => row.label).join(', ')}.`; } },
    { label: 'Archive mock records', danger: true, onAction: count => { rows.forEach(row => { if (selected.has(row.id)) row.archived = true; }); selected.clear(); draw(); feedback.textContent = `${count} mock records archived.`; } }
  ] });
  function draw() {
    list.replaceChildren(...rows.map(row => element('label', { className: 'ds-bulk-demo-row' }, element('input', { type: 'checkbox', className: 'ds-checkbox', checked: selected.has(row.id), disabled: row.archived, onchange: event => { if (event.target.checked) selected.add(row.id); else selected.delete(row.id); toolbar.setCount(selected.size); feedback.textContent = `${selected.size} mock records selected.`; } }), element('span', {}, `${row.id} · ${row.label}${row.archived ? ' · Archived' : ''}`))));
    toolbar.setCount(selected.size);
  }
  page.preview.append(list, toolbar.element, feedback);
  page.controls.append(button('Restore mock records', () => { rows.forEach(row => { row.archived = false; }); draw(); feedback.textContent = 'Mock records restored.'; }), button('Select all available mock records', () => { selected.clear(); rows.filter(row => !row.archived).forEach(row => selected.add(row.id)); draw(); feedback.textContent = `${selected.size} mock records selected.`; }));
  page.states.append(element('p', {}, 'Zero selection: hidden. One or more selected: toolbar visible. Archive: confirmation required.'));
  page.setSnippet(guide.example); draw();
}
