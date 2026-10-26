export function visibleTree(nodes, expandedIds = []) {
  const expanded = new Set(expandedIds);
  const result = [];
  function visit(siblings, parentId, level) {
    siblings.forEach((node, index) => {
      const children = Array.isArray(node.children) ? node.children : [];
      const hasChildren = children.length > 0;
      const open = hasChildren && expanded.has(node.id);
      result.push({ node, id: node.id, parentId, level, posInSet: index + 1, setSize: siblings.length, hasChildren, expanded: open });
      if (open) visit(children, node.id, level + 1);
    });
  }
  visit(nodes, null, 1);
  return result;
}

export function treeKeyboard(nodes, state, key, { typeahead = '' } = {}) {
  const expanded = new Set(state.expandedIds ?? []);
  const visible = visibleTree(nodes, expanded);
  let index = visible.findIndex(item => item.id === state.activeId);
  if (index < 0) index = 0;
  const current = visible[index];
  const next = { activeId: current?.id ?? null, expandedIds: [...expanded], selectedId: state.selectedId ?? null, handled: true };
  if (!current) return { ...next, handled: false };
  switch (key) {
    case 'ArrowDown': next.activeId = visible[Math.min(index + 1, visible.length - 1)].id; break;
    case 'ArrowUp': next.activeId = visible[Math.max(index - 1, 0)].id; break;
    case 'Home': next.activeId = visible[0].id; break;
    case 'End': next.activeId = visible.at(-1).id; break;
    case 'ArrowRight':
      if (current.hasChildren && !current.expanded) expanded.add(current.id);
      else if (current.expanded) next.activeId = visible[index + 1].id;
      break;
    case 'ArrowLeft':
      if (current.expanded) expanded.delete(current.id);
      else if (current.parentId != null) next.activeId = current.parentId;
      break;
    case '*':
      visible.filter(item => item.parentId === current.parentId && item.hasChildren).forEach(item => expanded.add(item.id));
      break;
    case 'Enter':
    case ' ':
      if (!current.node.disabled) next.selectedId = current.id;
      break;
    default: {
      const query = (typeahead || (key.length === 1 ? key : '')).toLocaleLowerCase();
      if (!query) { next.handled = false; break; }
      // Search after the current node and wrap once, like the ARIA tree pattern.
      for (let offset = 1; offset <= visible.length; offset++) {
        const candidate = visible[(index + offset) % visible.length];
        if (String(candidate.node.label ?? '').toLocaleLowerCase().startsWith(query)) { next.activeId = candidate.id; break; }
      }
      break;
    }
  }
  next.expandedIds = [...expanded];
  return next;
}
