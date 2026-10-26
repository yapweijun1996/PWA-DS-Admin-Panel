import { element, button, playground, uniqueId, openModal, statusMessage } from './playground.js';
import { rankCommands, rememberCommand, loadRecentCommands, saveRecentCommands } from '../js/logic/command.js';

export function createCommandPalette({ items = [], label = 'Command palette', storageKey = 'forma.command-recents', onExecute = () => {} } = {}) {
  let source = items;
  let dialog;
  let input;
  let list;
  let status;
  let matches = [];
  let active = 0;
  let recents = [];
  try { recents = loadRecentCommands(localStorage, storageKey); } catch { /* Storage is optional. */ }
  const id = uniqueId('commands');
  const entries = () => typeof source === 'function' ? source() : source;
  function highlight() {
    const options = [...list.children];
    options.forEach((option, index) => { option.setAttribute('aria-selected', String(index === active)); });
    if (matches.length) {
      input.setAttribute('aria-activedescendant', `${id}-${active}`);
      options[active]?.scrollIntoView({ block: 'nearest' });
    } else input.removeAttribute('aria-activedescendant');
  }
  function update() {
    matches = rankCommands(entries(), input.value, { recents });
    active = 0;
    list.replaceChildren(...matches.map((item, index) => element('div', { id: `${id}-${index}`, className: 'ds-command-option', role: 'option', 'aria-selected': 'false', onpointerdown: event => event.preventDefault(), onclick: () => execute(index) }, element('strong', {}, item.label), element('small', {}, item.category || 'Action'))));
    status.textContent = matches.length ? `${matches.length} results. Use Up and Down, then Enter.` : 'No results. Try another search.';
    highlight();
  }
  function execute(index) {
    const item = matches[index];
    if (!item || item.disabled) return;
    recents = rememberCommand(recents, String(item.id));
    try { saveRecentCommands(localStorage, recents, storageKey); } catch { /* Keep session recents when storage is denied. */ }
    close();
    if (item.action) item.action();
    else if (item.href) location.hash = item.href;
    onExecute(item);
  }
  function open(query = '') {
    if (dialog) { input.value = query; update(); input.focus(); return; }
    input = element('input', { type: 'search', className: 'ds-input ds-command-search', role: 'combobox', 'aria-label': 'Search commands', 'aria-autocomplete': 'list', 'aria-expanded': 'true', 'aria-controls': id, autocomplete: 'off', placeholder: 'Search actions, pages and components', value: query });
    list = element('div', { id, className: 'ds-command-results', role: 'listbox', 'aria-label': 'Matching commands' });
    status = element('p', { id: `${id}-status`, className: 'ds-command-status', role: 'status', 'aria-live': 'polite' });
    input.setAttribute('aria-describedby', status.id);
    input.addEventListener('input', update);
    input.addEventListener('keydown', event => {
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End', 'PageDown', 'PageUp', 'Enter'].includes(event.key)) return;
      event.preventDefault();
      if (event.key === 'Enter') { execute(active); return; }
      if (!matches.length) return;
      if (event.key === 'Home') active = 0;
      else if (event.key === 'End') active = matches.length - 1;
      else active = Math.max(0, Math.min(matches.length - 1, active + (event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : event.key === 'PageDown' ? 5 : -5)));
      highlight();
    });
    dialog = openModal({ title: label, content: element('div', { className: 'ds-command-palette' }, input, list, status, element('small', {}, '↑ ↓ Navigate · Enter Run · Esc Close · Recent choices stay on this device.')), onClose: () => { dialog = null; } });
    dialog.element.classList.add('ds-command-dialog');
    update(); input.focus();
  }
  function close() { dialog?.close(); }
  return { open, close, setItems(next) { source = next; if (dialog) update(); }, destroy: close, get isOpen() { return Boolean(dialog); } };
}

export const guide = {
  purpose: 'Find and execute shared actions, pages and components in one searchable modal engine.',
  props: ['createCommandPalette({items: array or getter, label, storageKey, onExecute}) returns open(query), close(), setItems(), destroy(), isOpen.', 'Items are {id,label,keywords,category,action or href,disabled}; ranking uses exact, prefix, substring and keywords, with local recents breaking ties.'],
  variants: ['Application-wide palette; scoped command collections.'],
  states: ['Closed, searchable results, active result, no results, recent choices; unavailable actions omitted.'],
  keyboard: ['Cmd/Ctrl+K opens the application palette. Up/Down move, Home/End jump, PageUp/PageDown move five; Enter executes, Escape closes; Tab remains in the shared modal.'],
  accessibility: ['Named focus-trapped modal, labelled combobox controlling a listbox, active descendant and selected options; result count is announced. Focus returns to the opener.'],
  tokens: ['--surface, --text, --muted, --accent-soft, --accent-text, --border-subtle, --space-2, --space-4'],
  responsive: ['Results scroll inside the modal; labels wrap; search is 16px and options at least 44px on phones.'],
  do: ['Use stable item IDs and the same engine for the global search field and keyboard shortcut.'],
  dont: ['Do not include unauthorized actions or claim that mock permissions secure a backend.'],
  example: 'const palette = createCommandPalette({items: [{id:"guide",label:"Open Guide",href:"#/learn",category:"Page"}]});\nbutton.addEventListener("click", () => palette.open());'
};
export function render(container) {
  const page = playground(container, { title: 'CommandPalette', description: 'The same searchable engine powers the top-bar search and Cmd/Ctrl+K. This scoped example includes real navigation and a local mock action.' });
  const feedback = statusMessage('Open the palette; search pages or run the mock action.');
  const palette = createCommandPalette({ storageKey: 'forma.demo-command-recents', items: [{ id: 'guide', label: 'Open Design System Guide', keywords: ['learn', 'documentation'], category: 'Page', href: '#/learn' }, { id: 'kits', label: 'Open Design Kits', category: 'Page', href: '#/kits' }, { id: 'mock-review', label: 'Mark mock record reviewed', keywords: ['action', 'review'], category: 'Mock action', action: () => { feedback.textContent = 'Mock record reviewed locally. No server writes.'; } }] });
  page.preview.append(button('Open command palette', () => palette.open(), 'primary'), feedback);
  page.controls.append(button('Search for review', () => palette.open('review')));
  page.states.append(element('p', {}, 'Try an unmatched query for the empty state. Recent choices are browser-local.'));
  page.setSnippet(guide.example);
}
