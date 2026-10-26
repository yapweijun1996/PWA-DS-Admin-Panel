import { element, playground, statusMessage, button, uniqueId } from './playground.js';
import { visibleTree, treeKeyboard } from '../js/logic/tree.js';
import { icon } from '../js/icons.js';
export const guide = {
  purpose: 'Browse hierarchical records with expandable branches and a single roving keyboard stop.',
  props: ['createTreeView({nodes:[{id,label,disabled,children}],label,expandedIds,selectedId,onSelect}) returns a tree element with getState() and setExpanded(ids). IDs must be unique.'],
  variants: ['Single selection with expandable branches, shared chevrons for disclosure and shared folder/file icons for records.'], states: ['Expanded, collapsed, selected, focused, disabled and empty.'],
  keyboard: ['Up/Down move through visible nodes; Right expands or enters children; Left collapses or moves to parent; Home/End jump; * expands siblings; Enter/Space selects; typing finds a label.'],
  accessibility: ['Tree items expose level, sibling position, expanded, disabled and selected state. Disabled items remain discoverable but cannot be selected.'],
  tokens: ['--space-3, --accent, --surface, --text, --muted'], responsive: ['Rows are at least 44px tall; long names wrap.'],
  do: ['Use stable unique IDs and concise labels.'], dont: ['Do not use a tree for an ordinary flat navigation list.'],
  example: 'createTreeView({label:"Folders",nodes:[{id:"root",label:"Documents",children:[{id:"report",label:"Report"}]}]})'
};
export function createTreeView({ nodes = [], label = 'Records', expandedIds = [], selectedId = null, onSelect = () => {} } = {}) {
  const root = element('div', { className: 'ds-tree-view', role: 'tree', 'aria-label': label });
  const prefix = uniqueId('tree'); const ids = new Map(); let sequence = 0;
  let state = { activeId: nodes[0]?.id ?? null, expandedIds: [...expandedIds], selectedId };
  let query = ''; let lastTyped = 0;
  function draw(focus = false) {
    const rows = visibleTree(nodes, state.expandedIds);
    if (!rows.some(row => row.id === state.activeId)) state.activeId = rows[0]?.id ?? null;
    root.replaceChildren();
    if (!rows.length) { root.append(element('p', { className: 'component-feedback' }, 'No records.')); root.tabIndex = 0; return; }
    root.removeAttribute('tabindex');
    for (const row of rows) {
      if (!ids.has(row.id)) ids.set(row.id, `${prefix}-${++sequence}`);
      const disclosure = element('span', { className: 'ds-tree-disclosure', 'aria-hidden': 'true' });
      if (row.hasChildren) disclosure.innerHTML = icon(row.expanded ? 'chevronDown' : 'chevronRight');
      const recordIcon = element('span', { className: 'ds-tree-record-icon', 'aria-hidden': 'true' });
      recordIcon.innerHTML = icon(row.hasChildren ? 'folder' : 'file');
      const item = element('div', { id: ids.get(row.id), className: 'ds-tree-item', role: 'treeitem', tabindex: row.id === state.activeId ? 0 : -1, 'aria-level': row.level, 'aria-posinset': row.posInSet, 'aria-setsize': row.setSize, 'aria-selected': String(row.id === state.selectedId), 'aria-disabled': String(Boolean(row.node.disabled)), ...(row.hasChildren ? { 'aria-expanded': String(row.expanded) } : {}) }, disclosure, recordIcon, element('span', {}, row.node.label));
      item.style.paddingInlineStart = `calc(var(--space-3) * ${row.level})`;
      item.addEventListener('focus', () => { state.activeId = row.id; for (const sibling of root.querySelectorAll('[role="treeitem"]')) sibling.tabIndex = sibling === item ? 0 : -1; });
      item.addEventListener('click', () => {
        state.activeId = row.id;
        if (!row.node.disabled) { state.selectedId = row.id; if (row.hasChildren) state = treeKeyboard(nodes, state, row.expanded ? 'ArrowLeft' : 'ArrowRight'); }
        draw(true); if (!row.node.disabled) onSelect(row.node);
      });
      root.append(item);
    }
    if (focus) document.getElementById(ids.get(state.activeId))?.focus();
  }
  root.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const typing = event.key.length === 1 && event.key !== ' ' && event.key !== '*';
    if (typing) { const now = Date.now(); query = now - lastTyped > 650 ? event.key : query + event.key; lastTyped = now; }
    else query = '';
    const repeated = query && [...query.toLocaleLowerCase()].every(character => character === query[0].toLocaleLowerCase());
    const next = treeKeyboard(nodes, state, event.key, { typeahead: typing ? repeated ? event.key : query : '' });
    if (!next.handled) return;
    event.preventDefault(); state = next; draw(true);
    if ((event.key === 'Enter' || event.key === ' ') && state.selectedId === state.activeId) { const selected = visibleTree(nodes, state.expandedIds).find(row => row.id === state.selectedId); if (selected && !selected.node.disabled) onSelect(selected.node); }
  });
  root.getState = () => ({ ...state, expandedIds: [...state.expandedIds] });
  root.setExpanded = ids => { state.expandedIds = [...ids]; draw(root.contains(document.activeElement)); };
  draw(); return root;
}
export function render(container) {
  const page = playground(container, { title: 'TreeView', description: guide.purpose });
  const status = statusMessage('Mock folders. Use arrows to browse and Enter to select.');
  const nodes = [{ id: 'documents', label: 'Documents (mock)', children: [{ id: 'invoices', label: 'Invoices', children: [{ id: 'october', label: 'October invoice' }] }, { id: 'contracts', label: 'Contracts' }, { id: 'archive', label: 'Restricted archive', disabled: true }] }, { id: 'reports', label: 'Reports (mock)', children: [{ id: 'annual', label: 'Annual report' }] }];
  const tree = createTreeView({ nodes, label: 'Mock folders', expandedIds: ['documents'], onSelect: node => { status.textContent = `Selected ${node.label} (mock).`; } });
  page.preview.append(element('div', { className: 'component-demo-stack' }, tree, status));
  page.controls.append(button('Expand all', () => tree.setExpanded(['documents', 'invoices', 'reports'])), button('Collapse all', () => tree.setExpanded([])));
  page.setSnippet('createTreeView({ nodes, label: "Mock folders", expandedIds: ["documents"], onSelect })');
}
