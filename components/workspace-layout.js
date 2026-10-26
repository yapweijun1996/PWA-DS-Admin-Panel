import { element, button, uniqueId, onDetach, playground } from './playground.js';
import { createCard } from './card.js';
import { createDescriptionList } from './description-list.js';
import { createTreeView } from './tree-view.js';
import { attachPaneResizer } from '../js/pane-resizer.js';

export function createWorkspaceLayout({ panes = [], storageKey, label = 'Workspace', widths = [240, 540, 420], minWidths = [180, 240, 200], maxWidths = [], activePane = 0 } = {}) {
  if (panes.length !== 3 || widths.length !== 3 || minWidths.length !== 3) throw new TypeError('WorkspaceLayout requires three labelled panes, widths and minimum widths.');
  const id = uniqueId('workspace');
  const listeners = new AbortController();
  let active = Number.isInteger(activePane) ? Math.max(0, Math.min(2, activePane)) : 0;
  let compact = false;
  let disposed = false;
  const regions = panes.map((pane, index) => element('section', { id: `${id}-pane-${index}`, className: 'ds-workspace-pane', role: 'region', 'aria-label': pane.label, tabindex: '-1' }, pane.content));
  const tabs = panes.map((pane, index) => button(pane.label, undefined, 'secondary', { id: `${id}-tab-${index}`, role: 'tab', 'aria-controls': regions[index].id }));
  const navigation = element('div', { className: 'ds-workspace-navigation', role: 'tablist', 'aria-label': `${label} panes`, 'aria-orientation': 'horizontal' }, ...tabs);
  const separators = [0, 1].map(index => element('div', { className: 'ds-workspace-separator', role: 'separator', tabindex: '0', 'aria-orientation': 'vertical', 'aria-label': `Resize ${panes[index].label} and ${panes[index + 1].label}`, 'aria-controls': `${regions[index].id} ${regions[index + 1].id}` }));
  const body = element('div', { className: 'ds-workspace-body' }, regions[0], separators[0], regions[1], separators[1], regions[2]);
  const root = element('section', { className: 'ds-workspace-layout', 'aria-label': label }, navigation, body);

  function updateViews(focus = false) {
    const previousFocus = document.activeElement;
    const hidingFocus = compact && regions.some((region, index) => index !== active && region.contains(previousFocus));
    navigation.hidden = !compact;
    root.dataset.compact = String(compact);
    regions.forEach((region, index) => {
      region.hidden = compact && index !== active;
      region.setAttribute('role', compact ? 'tabpanel' : 'region');
      if (compact) region.setAttribute('aria-labelledby', tabs[index].id);
      else region.removeAttribute('aria-labelledby');
      region.tabIndex = compact ? 0 : -1;
      tabs[index].setAttribute('aria-selected', String(index === active));
      tabs[index].tabIndex = index === active ? 0 : -1;
    });
    if ((focus || hidingFocus) && compact) tabs[active].focus();
    else if (focus) regions[active].focus();
  }
  function showPane(index, { focus = true } = {}) {
    if (disposed || !Number.isInteger(index) || index < 0 || index > 2) return;
    active = index;
    updateViews(focus);
  }
  tabs.forEach((tab, index) => tab.addEventListener('click', () => showPane(index), { signal: listeners.signal }));
  navigation.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key) || event.altKey || event.metaKey || event.ctrlKey) return;
    event.preventDefault();
    showPane(event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (active + (event.key === 'ArrowRight' ? 1 : 2)) % 3);
  }, { signal: listeners.signal });
  const resizer = attachPaneResizer({ element: body, panes: regions, separators, widths, minWidths, maxWidths, storageKey, onCompact(next) {
    if (next) {
      const focusedIndex = regions.findIndex(region => region.contains(document.activeElement));
      if (focusedIndex >= 0) active = focusedIndex;
    }
    const hiddenControlFocused = next ? separators.includes(document.activeElement) : tabs.includes(document.activeElement);
    compact = next;
    updateViews(hiddenControlFocused);
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
  return { element: root, panes: regions, separators, tabs, showPane, get activePane() { return active; }, get widths() { return resizer.widths; }, destroy };
}

export function demo(container) {
  const mockRecord = createDescriptionList({ items: [{ term: 'Reference', value: 'MOCK-1042' }, { term: 'Owner', value: 'Operations team (mock)' }, { term: 'State', value: 'In review (mock)' }] });
  const preview = createCard({ title: 'Welcome packet', description: 'Mock document preview; no file is downloaded.', content: element('p', {}, 'Mock welcome packet for the October school intake. Select a different record in the tree to update this preview.') });
  let layout;
  const tree = createTreeView({ label: 'Mock workspace records', expandedIds: ['intake'], nodes: [{ id: 'intake', label: 'October intake (mock)', children: [{ id: 'welcome', label: 'Welcome packet' }, { id: 'policy', label: 'School policy' }, { id: 'schedule', label: 'Class schedule' }] }], onSelect(node) {
    preview.querySelector('h3').textContent = `${node.label} (mock)`;
    mockRecord.replaceChildren(...createDescriptionList({ items: [{ term: 'Reference', value: `MOCK-${node.id.toUpperCase()}` }, { term: 'Record', value: `${node.label} (mock)` }, { term: 'State', value: 'In review (mock)' }] }).children);
    layout.showPane(1);
  } });
  const state = element('p', { role: 'status', 'aria-live': 'polite' }, 'Mock record is awaiting review.');
  const inspector = createCard({ title: 'Record inspector', description: 'All review changes stay in this local mock demo.', content: mockRecord, footer: [button('Mark mock reviewed', () => { state.textContent = 'Mock record marked reviewed in this demo only.'; }, 'primary'), state] });
  layout = createWorkspaceLayout({ label: 'Mock intake workspace', storageKey: 'forma-demo-workspace-widths', panes: [{ label: 'Records', content: createCard({ title: 'Records (mock)', content: tree }) }, { label: 'Preview', content: preview }, { label: 'Inspector', content: inspector }] });
  container?.append(layout.element);
  return layout;
}

export function render(container) {
  const page = playground(container, { title: 'WorkspaceLayout', description: 'Three keyboard-resizable panes for browse, preview and inspect tasks. All records are mock. Narrow views use reachable pane tabs instead of a wide canvas.' });
  const layout = demo(page.preview);
  page.controls.append(...['Records', 'Preview', 'Inspector'].map((label, index) => button(`Show ${label.toLowerCase()}`, () => layout.showPane(index))));
  page.setSnippet(guide.example);
}

export const guide = {
  purpose: 'Arrange three shared-component content panes in a persisted, resizable workspace without sacrificing narrow-screen access.',
  props: ['createWorkspaceLayout({panes:[{label,content}, {label,content}, {label,content}], storageKey, label, widths:[240,540,420], minWidths:[180,240,200], maxWidths:[], activePane:0}) returns {element, panes, separators, tabs, activePane, widths, showPane, destroy}.', 'Slots: exactly three labelled content DOM nodes, typically a TreeView or list, a Card preview and a DescriptionList/form inspector. The layout does not manufacture record data or selection behavior.', 'showPane(index, {focus:true}) selects a compact pane or focuses its desktop region. Pass focus:false to preserve caller focus. widths and activePane are read-only snapshots.', 'storageKey opts into guarded localStorage preferences. destroy() releases all layout listeners and observers and removes its element.'],
  variants: ['Three equal-height desktop panes with a 360px minimum and shared Card padding; compact single-pane workspace with three tabs.'],
  states: ['Initial pane, active compact pane, pointer resizing, keyboard resizing, restored sizes, constrained container.'],
  tokens: ['--space-2, --space-3, --space-5, --space-11, --color-border-subtle, --surface, --accent, --accent-soft, --radius-sm, --radius-lg.'],
  keyboard: ['Each desktop separator is a Tab stop: ArrowLeft/Right resize by 10px, Shift+Arrow by 40px, and Home/End use the minimum/maximum allowed adjacent widths.', 'Compact tabs use roving focus, ArrowLeft/Right wrap across all three panes, Home/End jump, and Enter/Space activate. Tab reaches the active tabpanel and its shared content controls.'],
  accessibility: ['Separators expose vertical orientation, controlled regions and updated minimum/current/maximum pixel values.', 'Compact views use a labelled tablist, selected tabs, controlled tabpanels and hidden inactive panes; desktop uses named regions.'],
  responsive: ['Phones or containers too narrow for the pane minimums show one pane. All three tabs wrap within the container and remain keyboard reachable.', 'ResizeObserver fits preferred widths without persisting the fit. Explicit pointer/keyboard resizes save preferences; shrinking then growing restores the user proportions.'],
  do: ['Use concise, unique pane labels and shared components in each slot.', 'Give independent workspaces distinct storage keys and dispose controllers with their page.'],
  dont: ['Do not force a desktop-width canvas onto a phone.', 'Do not infer processing or backend writes from mock review controls.'],
  example: 'const workspace = createWorkspaceLayout({\n  panes: [{label:"Records", content:tree}, {label:"Preview", content:previewCard}, {label:"Inspector", content:descriptionList}],\n  storageKey: "review-workspace-widths"\n});\ncontainer.append(workspace.element);\nworkspace.showPane(1);\n// When disposing the page:\nworkspace.destroy();'
};
