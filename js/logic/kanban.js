const copyCards = cards => cards.map(card => ({ ...card }));

/** Return a snapshot, rejecting cards that could otherwise disappear from the board. */
export function snapshotKanbanCards(cards, columns) {
  const columnIds = new Set(columns.map(column => column.id));
  if (columnIds.size !== columns.length || columns.some(column => typeof column.id !== 'string' || !column.id || typeof column.label !== 'string')) throw new TypeError('Kanban columns need unique string ids and labels.');
  const ids = new Set();
  for (const card of cards) {
    if (!card || typeof card.id !== 'string' || !card.id || ids.has(card.id) || !columnIds.has(card.column) || typeof card.title !== 'string') throw new TypeError('Kanban cards need unique string ids, titles, and a known column.');
    if (card.value !== undefined && !Number.isFinite(card.value)) throw new TypeError('Kanban card values must be finite numbers.');
    ids.add(card.id);
  }
  return copyCards(cards);
}

/** Position is zero-based in the destination column after removing the moving card. */
export function moveKanbanCard(cards, columns, cardId, columnId, position = Infinity) {
  const moving = cards.find(card => card.id === cardId);
  if (!moving || !columns.some(column => column.id === columnId)) return copyCards(cards);
  const remaining = cards.filter(card => card.id !== cardId);
  const destination = remaining.filter(card => card.column === columnId);
  const index = Math.max(0, Math.min(destination.length, Number.isNaN(Number(position)) ? destination.length : Math.trunc(Number(position))));
  let insertion = remaining.length;
  if (destination[index]) insertion = remaining.indexOf(destination[index]);
  else if (destination.length) insertion = remaining.indexOf(destination.at(-1)) + 1;
  const result = copyCards(remaining);
  result.splice(insertion, 0, { ...moving, column: columnId });
  return result;
}

export function beginKanbanMove(cards, columns, cardId) {
  if (!cards.some(card => card.id === cardId)) return null;
  const original = snapshotKanbanCards(cards, columns);
  return { cardId, columns: columns.map(column => ({ ...column })), original, cards: copyCards(original) };
}

/** Arrow names and left/right/up/down share the same bounded keyboard model. */
export function updateKanbanMove(move, direction) {
  if (!move) return move;
  const card = move.cards.find(item => item.id === move.cardId);
  const columnIndex = move.columns.findIndex(column => column.id === card.column);
  const position = move.cards.filter(item => item.column === card.column).findIndex(item => item.id === card.id);
  const action = direction.replace(/^Arrow/u, '').toLowerCase();
  let nextColumn = columnIndex;
  let nextPosition = position;
  if (action === 'left') nextColumn = Math.max(0, columnIndex - 1);
  else if (action === 'right') nextColumn = Math.min(move.columns.length - 1, columnIndex + 1);
  else if (action === 'up') nextPosition = Math.max(0, position - 1);
  else if (action === 'down') nextPosition = position + 1;
  else return move;
  return { ...move, cards: moveKanbanCard(move.cards, move.columns, card.id, move.columns[nextColumn].id, nextPosition) };
}

export function finishKanbanMove(move, { cancel = false } = {}) {
  return copyCards(cancel ? move.original : move.cards);
}

export function summarizeKanbanColumns(cards, columns) {
  return columns.map(column => {
    const items = cards.filter(card => card.column === column.id);
    return { ...column, count: items.length, hasValues: items.some(card => Number.isFinite(card.value)), total: items.reduce((sum, card) => sum + (Number.isFinite(card.value) ? card.value : 0), 0) };
  });
}
