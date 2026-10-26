import { element, button, playground, statusMessage, openModal, field, textControl, choiceControl, uniqueId, onDetach } from './playground.js';
import { createMenu } from './popover.js';

export function createSavedViewSelector({ storageKey = 'forma-saved-filter-views', getState, onSelect = () => {}, label = 'Saved views' } = {}) {
  const menuSlot = element('div', { className: 'ds-saved-view-menu' });
  const feedback = statusMessage();
  feedback.classList.add('ds-saved-view-feedback');
  const root = element('div', { className: 'ds-saved-view-selector' });
  const controls = element('div', { className: 'ds-saved-view-controls' });
  let views = [];
  let selectedId;
  let menu;
  let dialog;
  let destroyed = false;
  let selecting = false;
  const clone = value => JSON.parse(JSON.stringify(value));
  function readViews() {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey));
      if (stored !== null && !Array.isArray(stored)) throw new Error('Invalid saved views');
      views = (stored || []).filter(view => view && typeof view.id === 'string' && typeof view.name === 'string' && view.name.trim() && Object.hasOwn(view, 'state'));
    } catch { views = []; feedback.textContent = 'Saved views could not be read. New views remain usable in this session.'; }
  }
  function persist(next) {
    let persisted = true;
    try { localStorage.setItem(storageKey, JSON.stringify(next)); }
    catch { persisted = false; }
    views = next;
    return persisted;
  }
  async function choose(id) {
    if (destroyed || selecting) return;
    const view = views.find(item => item.id === id);
    if (!view) return;
    selecting = true;
    root.setAttribute('aria-busy', 'true');
    try {
      await onSelect(clone(view.state), clone(view));
      if (destroyed) return;
      selectedId = id;
      feedback.textContent = `Restored “${view.name}”.`;
      draw(); menu.trigger.focus();
    } catch (failure) { if (!destroyed) feedback.textContent = failure instanceof Error ? failure.message : 'This saved view could not be restored.'; }
    finally { selecting = false; root.removeAttribute('aria-busy'); }
  }
  function draw() {
    menu?.close();
    const selected = views.find(view => view.id === selectedId);
    menu = createMenu({ label: selected ? `${label}: ${selected.name}` : label, disabled: !views.length, items: views.map(view => ({ label: `${view.id === selectedId ? '✓ ' : ''}${view.name}`, action: () => choose(view.id) })) });
    menuSlot.replaceChildren(menu.element);
    rename.disabled = !selected;
    remove.disabled = !selected;
  }
  function nameDialog(kind) {
    if (destroyed) return;
    const selected = views.find(view => view.id === selectedId);
    if (kind === 'rename' && !selected) return;
    let state;
    if (kind === 'save') {
      try { state = clone(getState()); }
      catch (failure) { feedback.textContent = failure instanceof Error ? failure.message : 'Filter state could not be saved. Return JSON-compatible filter values.'; return; }
    }
    const id = uniqueId('saved-view-name');
    const input = element('input', { id, className: 'ds-input', value: kind === 'rename' ? selected.name : '', maxlength: '80', required: true, autocomplete: 'off' });
    const error = element('p', { id: `${id}-error`, className: 'ds-saved-view-error', role: 'alert' });
    input.setAttribute('aria-describedby', error.id);
    const form = element('form', { className: 'ds-saved-view-form', onsubmit: event => { event.preventDefault(); commit(); } }, field('View name', input), element('p', {}, kind === 'rename' ? 'Confirm a new name for this saved filter view.' : 'Save a snapshot of the current filters in this browser.'), error);
    dialog?.close();
    dialog = openModal({ title: kind === 'rename' ? 'Rename saved view' : 'Save filter view', content: form, onClose: () => { dialog = undefined; }, actions: [
      { label: 'Cancel', onClick: close => close() },
      { label: kind === 'rename' ? 'Confirm rename' : 'Save view', variant: 'primary', onClick: () => commit() }
    ] });
    function commit() {
      const name = input.value.trim();
      const duplicate = views.some(view => view.name.toLocaleLowerCase() === name.toLocaleLowerCase() && (kind !== 'rename' || view.id !== selected.id));
      if (!name || duplicate) { error.textContent = !name ? 'Enter a view name.' : 'A saved view already uses this name.'; input.setAttribute('aria-invalid', 'true'); input.focus(); return; }
      let next;
      if (kind === 'rename') next = views.map(view => view.id === selected.id ? { ...view, name } : view);
      else {
        const view = { id: `${Date.now()}-${uniqueId('view')}`, name, state };
        next = [...views, view]; selectedId = view.id;
      }
      const persisted = persist(next);
      dialog.close(); draw(); menu.trigger.focus();
      feedback.textContent = `${kind === 'rename' ? 'Renamed' : 'Saved'} “${name}”${persisted ? ' in this browser.' : ' for this session only; browser storage is unavailable.'}`;
    }
    input.focus();
  }
  function deleteSelected() {
    const selected = views.find(view => view.id === selectedId);
    if (!selected || destroyed) return;
    dialog?.close();
    dialog = openModal({ title: 'Delete saved view?', content: element('p', {}, `Delete “${selected.name}” from saved views? This does not delete any records or change the current filters.`), onClose: () => { dialog = undefined; }, actions: [
      { label: 'Cancel', onClick: close => close() },
      { label: 'Delete view', variant: 'danger', onClick: close => {
        const persisted = persist(views.filter(view => view.id !== selected.id)); selectedId = undefined;
        close(); draw(); save.focus();
        feedback.textContent = `Deleted “${selected.name}”${persisted ? '.' : ' for this session only; browser storage is unavailable.'}`;
      } }
    ] });
  }
  const save = button('Save view', () => nameDialog('save'));
  const rename = button('Rename view', () => nameDialog('rename'), 'ghost');
  const remove = button('Delete view', deleteSelected, 'ghost');
  controls.append(menuSlot, save, rename, remove);
  root.append(controls, feedback);
  function refresh() { if (destroyed) return; readViews(); if (!views.some(view => view.id === selectedId)) selectedId = undefined; draw(); }
  function storageChanged(event) { if (event.key === storageKey || event.key === null) refresh(); }
  function destroy() { if (destroyed) return; destroyed = true; menu?.close(); dialog?.close(); window.removeEventListener('storage', storageChanged); }
  window.addEventListener('storage', storageChanged);
  onDetach(root, destroy);
  refresh();
  return { element: root, refresh, getViews: () => clone(views), destroy };
}

export const guide = {
  purpose: 'Save browser-local filter snapshots, restore them, and deliberately rename or delete saved views.',
  props: ['createSavedViewSelector({storageKey,getState,onSelect(state,view),label="Saved views"}) returns element,refresh,getViews,destroy. getState supplies JSON-compatible filter state. onSelect restores a cloned snapshot. storageKey isolates a listing; refresh reloads external updates.'],
  variants: ['Empty saved-view collection and named current view.'], states: ['No views, saved, selected/restored, naming validation, deleting confirmation, storage unavailable (session-only).'],
  keyboard: ['Shared menu supports arrows, Home/End, Enter/Space and Escape. Naming dialogs support Enter to submit; Tab is trapped and focus returns.'],
  accessibility: ['Named menu trigger exposes selection, expanded state and controls; labelled naming input has linked validation; live feedback reports changes.'],
  tokens: ['--space-2, --space-3, --danger-text, --font-size-sm'], responsive: ['Buttons and long view names wrap within available width; 44px minimum action heights; 16px phone input.'],
  do: ['Save filter values, not live DOM nodes; clearly label mock datasets and choose a stable per-listing key.'],
  dont: ['Do not store secrets or assume browser-local views synchronize to a server.'],
  example: 'createSavedViewSelector({storageKey:"mock-customers-views",getState:()=>({search,status}),onSelect:state=>{ search=state.search; status=state.status; filterRows(); }})'
};
export function render(container) {
  const page = playground(container, { title: 'SavedViewSelector', description: 'Save and restore the real filters on this mock directory. Saved views persist in this browser only.' });
  let search = '';
  let status = 'all';
  const rows = [{ name: 'Acme Co', status: 'Active' }, { name: 'Northstar School', status: 'Active' }, { name: 'Cedar Studio', status: 'Archived' }];
  const results = element('ul', { className: 'ds-saved-view-results', 'aria-label': 'Filtered mock customers' });
  const count = statusMessage();
  const searchField = textControl('Search mock customers', search, value => { search = value; draw(); });
  const statusField = choiceControl('Mock customer status', status, [{ value: 'all', label: 'All statuses' }, { value: 'Active', label: 'Active' }, { value: 'Archived', label: 'Archived' }], value => { status = value; draw(); });
  const selector = createSavedViewSelector({ storageKey: 'forma-demo-saved-views', getState: () => ({ search, status }), onSelect: next => {
    search = typeof next.search === 'string' ? next.search : '';
    status = ['all', 'Active', 'Archived'].includes(next.status) ? next.status : 'all';
    searchField.querySelector('input').value = search;
    replaceStatus(); draw();
  } });
  function replaceStatus() {
    const replacement = choiceControl('Mock customer status', status, [{ value: 'all', label: 'All statuses' }, { value: 'Active', label: 'Active' }, { value: 'Archived', label: 'Archived' }], value => { status = value; draw(); });
    statusField.replaceChildren(...replacement.childNodes);
  }
  function draw() {
    const filtered = rows.filter(row => row.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()) && (status === 'all' || row.status === status));
    results.replaceChildren(...filtered.map(row => element('li', {}, `${row.name} · ${row.status}`)));
    count.textContent = `${filtered.length} mock customers${filtered.length ? '' : ' — no matches'}.`;
  }
  page.preview.append(element('div', { className: 'ds-saved-view-demo-filters' }, searchField, statusField), selector.element, count, results);
  page.controls.append(element('p', {}, 'Change search/status, save a named view, change the filters again, then select the saved view to restore them.'));
  page.states.append(element('p', {}, 'No views: selector disabled, Save available. Selected view: Rename/Delete available. Duplicate names: inline error. Delete: explicit confirmation.'));
  page.setSnippet(guide.example); draw();
}
