import { element, button, uniqueId, onDetach, playground } from './playground.js';
import { createCard } from './card.js';
import { createDescriptionList } from './description-list.js';
import { attachPaneResizer } from '../js/pane-resizer.js';

export function createMasterDetailLayout({ list, detail, storageKey, label = 'Master-detail workspace', listLabel = 'Records', detailLabel = 'Details', widths = [320, 640], minWidths = [200, 240], maxWidths = [] } = {}) {
  if (widths.length !== 2 || minWidths.length !== 2) throw new TypeError('MasterDetailLayout needs two pane widths and minimum widths.');
  const id = uniqueId('master-detail');
  const listeners = new AbortController();
  let compact = false;
  let view = 'list';
  let returnFocus;
  let disposed = false;
  const listPane = element('section', { id: `${id}-list`, className: 'ds-master-detail-list', role: 'region', 'aria-label': listLabel, tabindex: '-1' }, list);
  const back = button(`Back to ${listLabel}`, undefined, 'secondary');
  const detailPane = element('section', { id: `${id}-detail`, className: 'ds-master-detail-detail', role: 'region', 'aria-label': detailLabel, tabindex: '-1' }, element('div', { className: 'ds-master-detail-back' }, back), detail);
  const open = button(`View ${detailLabel}`, undefined, 'secondary', { 'aria-controls': detailPane.id });
  const navigation = element('div', { className: 'ds-master-detail-navigation' }, element('span', {}, listLabel), open);
  const separator = element('div', { className: 'ds-master-detail-separator', role: 'separator', tabindex: '0', 'aria-orientation': 'vertical', 'aria-label': `Resize ${listLabel} and ${detailLabel}`, 'aria-controls': `${listPane.id} ${detailPane.id}` });
  const body = element('div', { className: 'ds-master-detail-body' }, listPane, separator, detailPane);
  const root = element('section', { className: 'ds-master-detail-layout', 'aria-label': label }, navigation, body);

  function updateViews(focus = false) {
    const target = view === 'list' ? listPane : detailPane;
    const active = document.activeElement;
    const hiddenFocus = compact && (view === 'list' ? detailPane.contains(active) : listPane.contains(active));
    listPane.hidden = compact && view !== 'list';
    detailPane.hidden = compact && view !== 'detail';
    navigation.hidden = !compact || view !== 'list';
    back.parentElement.hidden = !compact;
    root.dataset.compact = String(compact);
    root.dataset.view = view;
    if (focus || hiddenFocus) {
      if (view === 'list' && returnFocus?.isConnected && listPane.contains(returnFocus)) returnFocus.focus();
      else target.focus();
    }
  }
  function showList({ focus = true } = {}) { if (!disposed) { view = 'list'; updateViews(focus); } }
  function showDetail({ focus = true } = {}) {
    if (disposed) return;
    if (listPane.contains(document.activeElement)) returnFocus = document.activeElement;
    view = 'detail';
    updateViews(focus);
  }
  back.addEventListener('click', () => showList(), { signal: listeners.signal });
  open.addEventListener('click', () => showDetail(), { signal: listeners.signal });
  const resizer = attachPaneResizer({ element: body, panes: [listPane, detailPane], separators: [separator], widths, minWidths, maxWidths, storageKey, onCompact(next) {
    if (next && detailPane.contains(document.activeElement)) view = 'detail';
    const dividerFocused = document.activeElement === separator;
    compact = next;
    updateViews(dividerFocused);
  } });
  function destroy() {
    if (disposed) return;
    disposed = true;
    listeners.abort();
    resizer.destroy();
    root.remove();
  }
  onDetach(root, destroy);
  updateViews();
  return { element: root, listPane, detailPane, separator, showList, showDetail, get widths() { return resizer.widths; }, destroy };
}

export function demo(container) {
  const details = createDescriptionList({ items: [{ term: 'Record', value: 'MOCK-1042' }, { term: 'Customer', value: 'Northwind School (mock)' }, { term: 'Status', value: 'Review requested (mock)' }] });
  const detail = createCard({ title: 'Customer details', description: 'Mock customer record. No backend is connected.', content: details });
  let layout;
  const records = ['Northwind School', 'Acme Studio', 'Forma College'];
  const list = createCard({ title: 'Customers (mock)', content: element('div', { className: 'ds-master-detail-records' }, ...records.map((name, index) => button(name, () => {
    details.replaceChildren(...createDescriptionList({ items: [{ term: 'Record', value: `MOCK-${1042 + index}` }, { term: 'Customer', value: `${name} (mock)` }, { term: 'Status', value: 'Review requested (mock)' }] }).children);
    layout.showDetail();
  }, 'ghost'))) });
  layout = createMasterDetailLayout({ list, detail, storageKey: 'forma-demo-master-detail-widths', listLabel: 'Customers', detailLabel: 'customer details' });
  container?.append(layout.element);
  return layout;
}

export function render(container) {
  const page = playground(container, { title: 'MasterDetailLayout', description: 'A resizable list and record detail. All example records are mock. On phones, select a customer to open its separate detail view.' });
  const layout = demo(page.preview);
  page.controls.append(button('Show mock list', () => layout.showList()), button('Show mock details', () => layout.showDetail()));
  page.setSnippet(guide.example);
}

export const guide = {
  purpose: 'Compose a record list and detail into a keyboard-resizable split layout that becomes two separate views on narrow screens.',
  props: ['createMasterDetailLayout({list, detail, storageKey, label, listLabel, detailLabel, widths:[320,640], minWidths:[200,240], maxWidths:[]}) returns {element, listPane, detailPane, separator, widths, showList, showDetail, destroy}.', 'Slots: list and detail accept shared component DOM nodes. Layout owns pane sizing and the compact Back/View details actions, not record selection.', 'Call showDetail() from list activation and showList() to return; each accepts {focus:false} to keep deliberate caller focus. widths is a read-only snapshot in pixels. destroy() releases listeners/observers and removes the element.', 'storageKey opts into localStorage preferences; omit it for ephemeral sizes. Storage denial or invalid saved values falls back safely.'],
  variants: ['Two equal-height desktop panes with a 360px minimum, subtle borders and shared Card padding; separate list/detail compact views.'],
  states: ['List visible, detail visible on phones, keyboard resize, pointer resize, restored preference, constrained container.'],
  tokens: ['--space-3, --space-4, --space-11, --color-border-subtle, --border, --surface, --accent, --radius-lg.'],
  keyboard: ['Tab reaches the named vertical separator. ArrowLeft/Right resize by 10px; Shift+Arrow resizes by 40px. Home/End move to the adjacent minimum/maximum.', 'Enter/Space activate shared list buttons and Back/View details. Returning restores the activating list control when it still exists.'],
  accessibility: ['Named regions and a focusable separator expose orientation, controlled pane IDs and current/min/max pixel values.', 'Only the active compact pane is exposed; changing views moves focus into the new region and Back restores list focus.'],
  responsive: ['Phones and containers narrower than the combined minimums show one pane without horizontal overflow.', 'Container resizing fits preferred widths without saving the temporary fit, so restored user sizes survive narrow views.'],
  do: ['Compose shared list/table and detail components in the documented slots.', 'Use a unique storageKey per independently sized workspace.'],
  dont: ['Do not persist data records in the pane-width storage key.', 'Do not hide the list activation or Back action in a phone-only workflow.'],
  example: 'const layout = createMasterDetailLayout({ list: customerList, detail: customerCard, storageKey: "customers-pane-widths" });\ncontainer.append(layout.element);\n// In the customer list activation handler:\nlayout.showDetail();\n// When disposing the page:\nlayout.destroy();'
};
