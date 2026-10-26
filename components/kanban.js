import { element, button, playground, statusMessage, toggleControl, choiceControl, uniqueId, onDetach } from './playground.js';
import { createMenu } from './popover.js';
import { snapshotKanbanCards, moveKanbanCard, beginKanbanMove, updateKanbanMove, finishKanbanMove, summarizeKanbanColumns } from '../js/logic/kanban.js';

export function createKanban({ columns = [], cards = [], onChange = () => {}, label = 'Kanban board', showTotals = true, formatValue = value => new Intl.NumberFormat().format(value), loading = false, error = '', onRetry, headingLevel = 3 } = {}) {
  const stages = columns.map(column => ({ ...column }));
  let committed = snapshotKanbanCards(cards, stages);
  let move = null;
  let pointer = null;
  let activeColumn = stages[0]?.id;
  let menus = [];
  let handles = new Map();
  let destroyed = false;
  const id = uniqueId('kanban');
  const help = element('p', { id: `${id}-help`, className: 'ds-kanban-help' }, 'Focus a card and press Space to pick up. Use Left/Right for columns, Up/Down for positions, Space to drop, or Escape to cancel. You can also drag the card or use its Move to menu.');
  const feedback = statusMessage();
  feedback.classList.add('ds-kanban-announcement');
  feedback.setAttribute('aria-atomic', 'true');
  const tabs = element('div', { className: 'ds-kanban-tabs', role: 'tablist', 'aria-label': `${label} columns` });
  const board = element('div', { className: 'ds-kanban-columns' });
  const root = element('section', { className: 'ds-kanban', 'aria-label': label, 'aria-describedby': help.id }, help, tabs, board, feedback);
  const mobile = window.matchMedia('(max-width: 767px)');
  const tabButtons = [];
  const panels = [];
  const lists = [];
  const counts = [];
  const totals = [];
  const currentCards = () => move ? move.cards : committed;
  const samePlacement = (before, after) => stages.every(stage => before.filter(card => card.column === stage.id).map(card => card.id).join('\u0000') === after.filter(card => card.column === stage.id).map(card => card.id).join('\u0000'));
  function announce(message) { feedback.textContent = message; }
  function describe(cardId) {
    const items = currentCards();
    const card = items.find(item => item.id === cardId);
    const column = stages.find(stage => stage.id === card.column);
    const siblings = items.filter(item => item.column === column.id);
    return `${card.title}, ${column.label}, position ${siblings.findIndex(item => item.id === cardId) + 1} of ${siblings.length}`;
  }
  function selectColumn(columnId, focusTab = false) {
    activeColumn = columnId;
    panels.forEach((panel, index) => {
      const selected = stages[index].id === activeColumn;
      panel.dataset.active = String(selected);
      panel.setAttribute('role', mobile.matches ? 'tabpanel' : 'region');
      panel.setAttribute('aria-labelledby', mobile.matches ? tabButtons[index].id : `${id}-heading-${index}`);
      tabButtons[index].setAttribute('aria-selected', String(selected));
      tabButtons[index].tabIndex = selected ? 0 : -1;
    });
    if (focusTab) tabButtons[stages.findIndex(stage => stage.id === activeColumn)]?.focus();
  }
  stages.forEach((stage, index) => {
    const tab = element('button', { type: 'button', id: `${id}-tab-${index}`, role: 'tab', className: 'ds-kanban-tab', 'aria-controls': `${id}-column-${index}`, onclick: () => selectColumn(stage.id) });
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? stages.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + stages.length) % stages.length;
      selectColumn(stages[next].id, true);
    });
    const count = element('span', { className: 'ds-kanban-count' });
    const total = element('p', { className: 'ds-kanban-total' });
    const list = element('ol', { className: 'ds-kanban-list', 'aria-label': `${stage.label} cards` });
    const panel = element('section', { id: `${id}-column-${index}`, className: 'ds-kanban-column', 'data-column-id': stage.id }, element('header', { className: 'ds-kanban-column-header' }, element(`h${headingLevel}`, { id: `${id}-heading-${index}` }, stage.label), count), total, list);
    tabButtons.push(tab); panels.push(panel); counts.push(count); totals.push(total); lists.push(list);
    tabs.append(tab); board.append(panel);
  });
  function draw(focusId) {
    menus.forEach(menu => menu.close()); menus = []; handles = new Map();
    const items = currentCards();
    const summaries = summarizeKanbanColumns(items, stages);
    const displayTotals = showTotals && items.some(card => Number.isFinite(card.value));
    summaries.forEach((summary, index) => {
      counts[index].textContent = `WIP ${summary.count}`;
      tabButtons[index].textContent = `${summary.label} (${summary.count})`;
      totals[index].hidden = !displayTotals;
      totals[index].textContent = displayTotals ? `Total ${formatValue(summary.total)}` : '';
      const children = items.filter(card => card.column === summary.id).map(card => {
        const picked = move?.cardId === card.id;
        const handle = element('button', { type: 'button', className: 'ds-kanban-card-handle', 'data-card-id': card.id, 'aria-describedby': help.id, 'aria-pressed': String(picked), 'aria-label': `${card.title}. ${picked ? 'Moving. Press Space to drop.' : 'Press Space to pick up.'}` }, element('span', { className: 'ds-kanban-card-title' }, card.title), element('span', { className: 'ds-kanban-grip', 'aria-hidden': 'true' }, picked ? 'Moving' : '↕'));
        handles.set(card.id, handle);
        const menu = createMenu({ label: 'Move to…', items: stages.map(destination => ({ label: destination.label, disabled: destination.id === card.column || Boolean(move), action: () => {
          committed = moveKanbanCard(committed, stages, card.id, destination.id);
          selectColumn(destination.id); draw(card.id);
          announce(`Moved ${describe(card.id)}.`); onChange(snapshotKanbanCards(committed, stages));
        } })) });
        menu.trigger.setAttribute('aria-label', `Move to… another column for ${card.title}`);
        menu.trigger.disabled = Boolean(move);
        menus.push(menu);
        return element('li', { className: 'ds-kanban-card', 'data-card-id': card.id, 'data-moving': String(picked) }, handle, ...(card.value !== undefined ? [element('p', { className: 'ds-kanban-card-value' }, formatValue(card.value))] : []), menu.element);
      });
      lists[index].replaceChildren(...(children.length ? children : [element('li', { className: 'ds-kanban-empty' }, 'No cards. Drop a card here or use a Move to menu.')]));
    });
    selectColumn(activeColumn);
    root.dataset.moving = String(Boolean(move));
    if (focusId) handles.get(focusId)?.focus({ preventScroll: true });
  }
  function pickUp(cardId) {
    move = beginKanbanMove(committed, stages, cardId);
    if (!move) return;
    activeColumn = move.cards.find(card => card.id === cardId).column;
    draw(cardId); announce(`Picked up ${describe(cardId)}. Use arrow keys to move, Space to drop, or Escape to cancel.`);
  }
  function releasePointer() {
    const captured = pointer;
    pointer = null;
    if (captured && root.hasPointerCapture(captured.id)) root.releasePointerCapture(captured.id);
  }
  function finish(cancel = false) {
    if (!move) { releasePointer(); return; }
    const cardId = move.cardId;
    const next = finishKanbanMove(move, { cancel });
    const changed = !samePlacement(committed, next);
    committed = next; move = null; releasePointer();
    activeColumn = committed.find(card => card.id === cardId).column;
    draw(cardId); announce(`${cancel ? 'Cancelled move. Restored' : 'Dropped'} ${describe(cardId)}.`);
    if (!cancel && changed) onChange(snapshotKanbanCards(committed, stages));
  }
  root.addEventListener('keydown', event => {
    if (event.key === 'Escape' && move) { event.preventDefault(); event.stopPropagation(); finish(true); return; }
    if (event.key === 'Tab' && move) { finish(true); return; }
    const handle = event.target.closest('.ds-kanban-card-handle');
    if (!handle || pointer) return;
    if (event.key === ' ' || event.code === 'Space') {
      event.preventDefault();
      if (event.repeat) return;
      if (move) finish(); else pickUp(handle.dataset.cardId);
    } else if (move && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault();
      const next = updateKanbanMove(move, event.key);
      const changed = !samePlacement(move.cards, next.cards);
      move = next; activeColumn = move.cards.find(card => card.id === move.cardId).column;
      draw(move.cardId); announce(`${changed ? 'Moved' : 'Boundary reached.'} ${describe(move.cardId)}. Press Space to drop.`);
      handles.get(move.cardId)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  });
  root.addEventListener('pointerdown', event => {
    const handle = event.target.closest('.ds-kanban-card-handle');
    if (!handle || move || pointer || event.button !== 0 || !event.isPrimary) return;
    event.preventDefault(); handle.focus();
    pointer = { id: event.pointerId, cardId: handle.dataset.cardId, x: event.clientX, y: event.clientY, overTarget: false };
    root.setPointerCapture(event.pointerId);
  });
  root.addEventListener('pointermove', event => {
    if (!pointer || pointer.id !== event.pointerId) return;
    if (!move && Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) < 6) return;
    if (!move) pickUp(pointer.cardId);
    const target = document.elementFromPoint(event.clientX, event.clientY);
    const tabIndex = tabButtons.indexOf(target?.closest('.ds-kanban-tab'));
    let columnId;
    if (tabIndex >= 0) { columnId = stages[tabIndex].id; selectColumn(columnId); }
    else {
      const panel = target?.closest('.ds-kanban-column');
      if (panel && root.contains(panel)) columnId = panel.dataset.columnId;
    }
    pointer.overTarget = columnId !== undefined;
    if (!pointer.overTarget) return;
    const list = lists[stages.findIndex(stage => stage.id === columnId)];
    const siblings = [...list.querySelectorAll('.ds-kanban-card')].filter(card => card.dataset.cardId !== move.cardId);
    let position = tabIndex >= 0 ? siblings.length : siblings.findIndex(card => event.clientY < card.getBoundingClientRect().top + card.getBoundingClientRect().height / 2);
    if (position < 0) position = siblings.length;
    const next = moveKanbanCard(move.cards, stages, move.cardId, columnId, position);
    if (samePlacement(move.cards, next)) return;
    move = { ...move, cards: next }; activeColumn = columnId;
    draw(move.cardId); announce(`Moving ${describe(move.cardId)}. Release to drop or press Escape to cancel.`);
  });
  root.addEventListener('pointerup', event => {
    if (!pointer || pointer.id !== event.pointerId) return;
    if (move) finish(!pointer.overTarget); else releasePointer();
  });
  root.addEventListener('pointercancel', () => finish(true));
  root.addEventListener('lostpointercapture', () => { if (pointer) finish(true); });
  function layoutChanged() { selectColumn(activeColumn); }
  mobile.addEventListener('change', layoutChanged);
  function destroy() {
    if (destroyed) return;
    destroyed = true; move = null; releasePointer(); menus.forEach(menu => menu.close());
    mobile.removeEventListener('change', layoutChanged);
  }
  onDetach(root, destroy);
  draw();
  if (!stages.length || loading || error) {
    tabs.hidden = true; board.hidden = true; help.hidden = true;
    const message = element('div', { className: 'ds-kanban-state', role: error ? 'alert' : 'status' }, error || (loading ? 'Loading cards…' : 'No columns configured.'));
    if (error && onRetry) message.append(button('Retry', onRetry));
    root.prepend(message); root.setAttribute('aria-busy', String(loading));
  }
  return {
    element: root,
    getCards: () => snapshotKanbanCards(committed, stages),
    setCards(next) {
      if (destroyed) return;
      const snapshot = snapshotKanbanCards(next, stages);
      move = null; releasePointer(); committed = snapshot; draw(); announce('Board cards updated.');
    },
    destroy
  };
}

export const guide = {
  purpose: 'Organize work into ordered columns with equivalent pointer, keyboard, and Move to menu interactions.',
  props: ['createKanban({columns:[{id,label}],cards:[{id,column,title,value?}],onChange(cards),label="Kanban board",showTotals=true,formatValue,loading=false,error="",onRetry,headingLevel=3}) returns {element,getCards,setCards,destroy}. Set headingLevel (1–6) for column headings. IDs are unique strings and every card references a known column. Values are finite numbers.', 'getCards returns a snapshot of committed cards. setCards replaces cards without calling onChange and cancels a move in progress. onChange receives a snapshot only after a changed drop or menu move. Array order determines order within a column. formatValue(number) formats card values and optional column totals. Loading/error are initial display states; replace the controller when loading completes.'],
  variants: ['Work columns with WIP counts; value-bearing cards with optional column totals; phone column tabs.'],
  states: ['Ready, empty column, empty board, loading, error with optional Retry, focused card, picked up, moving preview, dropped, cancelled, column boundary.'],
  keyboard: ['Tab focuses each card pickup button or its Move to menu. Space picks up; Left/Right move between columns, Up/Down reorder; Space drops; Escape restores the original board. Tab cancels before leaving a picked-up card.', 'Move to menus support arrows, Home/End, Enter/Space, Escape and focus return. Phone column tabs support Left/Right, Home and End.'],
  accessibility: ['Pickup buttons expose pressed state and linked instructions. A polite atomic live region announces pickup, destination, position, drop and cancellation. Column headings, WIP text and card lists remain readable without colour.', 'Every card has a Move to menu: dragging is never the only path. Keyboard and pointer changes remain previews until explicitly dropped.'],
  tokens: ['--surface, --bg, --text, --muted, --accent, --accent-soft, --color-border-subtle, --radius-lg, --space-3, --space-4, --font-size-sm'],
  responsive: ['At phone widths below 768px, a horizontal column tablist shows one column at a time. Menu moves and keyboard column moves select their destination tab. Dragging over a column tab also switches destination.', 'Desktop columns scroll inside the board rather than overflowing the page. Pickup and menu targets are at least 44px; only pickup handles disable touch scrolling.'],
  do: ['Use short, meaningful column names; label demo data as mock. Pass currency formatting for deal values and keep all cards in the same currency when totaling.'],
  dont: ['Do not rely on drag alone or treat preview moves as saved changes. Do not pass unknown column ids or mutate controller snapshots expecting the board to change.'],
  example: 'createKanban({columns:[{id:"lead",label:"Lead"},{id:"won",label:"Won"}],cards:[{id:"deal-1",column:"lead",title:"Mock Acme renewal",value:2400}],formatValue:value=>new Intl.NumberFormat("en",{style:"currency",currency:"USD"}).format(value),onChange:cards=>saveMockCards(cards)})'
};

export function render(container) {
  const page = playground(container, { title: 'Kanban board', description: 'Mock sales opportunities. Drag a card, pick it up with Space, or use its Move to menu. Changes stay in this local demonstration.' });
  const columns = [{ id: 'lead', label: 'Lead' }, { id: 'qualified', label: 'Qualified' }, { id: 'proposal', label: 'Proposal' }, { id: 'won', label: 'Won' }];
  const seed = [{ id: 'acme', column: 'lead', title: 'Mock Acme renewal', value: 2400 }, { id: 'cedar', column: 'lead', title: 'Mock Cedar onboarding', value: 1800 }, { id: 'north', column: 'qualified', title: 'Mock Northstar expansion', value: 5200 }, { id: 'studio', column: 'proposal', title: 'Mock Studio support', value: 900 }];
  const slot = element('div', { className: 'ds-kanban-demo' });
  const feedback = statusMessage('Move a mock card to update this board.');
  let cards = seed.map(card => ({ ...card }));
  let showTotals = true;
  let state = 'ready';
  let board;
  function draw() {
    board?.destroy();
    board = createKanban({ columns, cards: state === 'empty' ? [] : cards, showTotals, loading: state === 'loading', error: state === 'error' ? 'Mock error: cards could not be loaded.' : '', onRetry: () => { state = 'ready'; refreshStateControl(); draw(); feedback.textContent = 'Mock retry completed; cards restored.'; }, formatValue: value => new Intl.NumberFormat('en', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value), onChange: next => { cards = next; feedback.textContent = 'Mock board updated. WIP counts and totals reflect the committed move.'; } });
    slot.replaceChildren(board.element);
  }
  function makeStateControl() {
    return choiceControl('Mock board state', state, ['ready', 'empty', 'loading', 'error'].map(value => ({ value, label: value[0].toUpperCase() + value.slice(1) })), value => { state = value; draw(); });
  }
  const stateControl = makeStateControl();
  function refreshStateControl() {
    stateControl.replaceChildren(...makeStateControl().childNodes);
    stateControl.querySelector('button').focus();
  }
  page.preview.append(slot, feedback);
  page.controls.append(toggleControl('Show column value totals', showTotals, value => { showTotals = value; draw(); }), stateControl, button('Reset mock cards', () => { cards = seed.map(card => ({ ...card })); state = 'ready'; refreshStateControl(); draw(); feedback.textContent = 'Mock cards reset.'; }));
  page.states.append(element('p', {}, 'Empty columns show drop guidance. Loading and error previews are labelled mock. Pickup announces position; Escape restores the board without notifying onChange. Drop commits once.'));
  page.setSnippet(guide.example); draw();
}
