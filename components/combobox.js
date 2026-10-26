import { element, uniqueId, onDetach, playground, textControl, toggleControl, statePreview, statusMessage, button, openModal, loadingIndicator } from './playground.js';
import { openDrawer } from './drawer.js';
import { icon } from '../js/icons.js';

function flattenOptions(options, group = '') {
  return options.flatMap(option => Array.isArray(option.options)
    ? flattenOptions(option.options, option.label)
    : [{ ...option, label: String(option.label ?? option.value), group: option.group || group }]);
}

export function createCombobox({ label = 'Choose an option', options = [], value, multiple = false, onChange = () => {}, placeholder = 'Search options…', disabled = false, clearable = true, maxSelected = Infinity, creatable = false, asyncDelay = 0, loading = false, error = '', hint = '', required = false, hideLabel = false, name } = {}) {
  const id = uniqueId('combobox');
  const items = flattenOptions(options);
  const limit = Number.isFinite(Number(maxSelected)) ? Math.max(0, Math.floor(Number(maxSelected))) : Infinity;
  let selected = [];
  let query = '';
  let expanded = false;
  let isDisabled = Boolean(disabled);
  let pending = Boolean(loading);
  let timer;
  let activeIndex = -1;
  let visible = [];
  let optionNodes = [];
  let resizeObserver;
  let positionFrame;
  const labelNode = element('label', { for: id, className: hideLabel ? 'ds-combobox-visually-hidden' : 'ds-combobox-label' }, label, required ? ' *' : '');
  const chips = element('div', { className: 'ds-combobox-chips', 'aria-label': `Selected ${label}` });
  const input = element('input', { id, className: 'ds-combobox-input', type: 'text', role: 'combobox', autocomplete: 'off', 'aria-autocomplete': 'list', 'aria-haspopup': 'listbox', 'aria-expanded': 'false', 'aria-controls': `${id}-list`, 'aria-invalid': String(Boolean(error)), 'aria-required': String(required), placeholder, disabled: isDisabled });
  const clear = button('', clearSelection, 'ghost', { className: 'ds-combobox-action', 'aria-label': `Clear ${label}`, disabled: isDisabled, hidden: true });
  clear.innerHTML = icon('close');
  const toggle = button('', () => { if (expanded) close(); else { input.focus(); open(); } }, 'ghost', { className: 'ds-combobox-action', 'aria-label': `Show ${label} options`, tabindex: '-1', disabled: isDisabled });
  toggle.innerHTML = icon('chevronDown');
  const control = element('div', { className: 'ds-combobox-control' }, chips, input, clear, toggle);
  const list = element('div', { id: `${id}-list`, role: 'listbox', 'aria-label': label, 'aria-multiselectable': multiple ? 'true' : undefined });
  const message = element('div', { className: 'ds-combobox-message', hidden: true });
  const panel = element('div', { className: 'ds-select-options ds-combobox-popover', popover: 'manual', hidden: true }, list, message);
  const status = element('span', { className: 'ds-combobox-visually-hidden', role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' });
  const description = element('small', { id: `${id}-hint`, className: 'ds-combobox-hint', hidden: !hint }, hint);
  const errorNode = element('small', { id: `${id}-error`, className: 'ds-combobox-error', hidden: !error }, typeof error === 'string' ? error : error ? 'Choose a valid option.' : '');
  const limitHint = element('small', { id: `${id}-limit`, className: 'ds-combobox-hint', hidden: true });
  const help = [hint && description.id, error && errorNode.id, multiple && Number.isFinite(limit) && limitHint.id].filter(Boolean);
  if (help.length) input.setAttribute('aria-describedby', help.join(' '));
  if (error) input.setAttribute('aria-errormessage', errorNode.id);
  const hiddenValues = element('span', { hidden: true });
  const root = element('div', { className: 'ds-select ds-combobox', 'data-disabled': String(isDisabled) }, labelNode, control, description, errorNode, limitHint, hiddenValues, panel, status);

  function values() { return multiple ? [...selected] : selected[0] ?? null; }
  function isSelected(option) { return selected.includes(option.value); }
  function unavailable(option) { return Boolean(option.disabled || (multiple && selected.length >= limit && !isSelected(option))); }
  function selectedLabel(entry) { return items.find(option => option.value === entry)?.label ?? String(entry); }
  function announce(messageText) { status.textContent = messageText; }
  function refreshSelection() {
    chips.hidden = !multiple || !selected.length;
    chips.replaceChildren(...(multiple ? selected.map(entry => {
      const remove = button('', () => removeValue(entry), 'ghost', { className: 'ds-combobox-remove', 'aria-label': `Remove ${selectedLabel(entry)}`, disabled: isDisabled });
      remove.innerHTML = icon('close');
      return element('span', { className: 'ds-combobox-chip' }, element('span', {}, selectedLabel(entry)), remove);
    }) : []));
    input.value = expanded ? query : multiple ? '' : selected.length ? selectedLabel(selected[0]) : '';
    input.placeholder = multiple && selected.length ? 'Add another…' : placeholder;
    limitHint.hidden = !multiple || selected.length < limit;
    limitHint.textContent = limitHint.hidden ? '' : `Maximum ${limit} selected. Remove an item to choose another.`;
    clear.hidden = !clearable || (!selected.length && !query);
    clear.disabled = isDisabled;
    hiddenValues.replaceChildren(...(name ? selected.map(entry => element('input', { type: 'hidden', name, value: entry, disabled: isDisabled })) : []));
  }
  function commit(next, messageText) {
    selected = next;
    refreshSelection();
    if (expanded) renderOptions();
    announce(messageText);
    onChange(values());
  }
  function removeValue(entry) {
    if (isDisabled) return;
    commit(selected.filter(current => current !== entry), `${selectedLabel(entry)} removed. ${selected.length - 1} selected.`);
    input.focus();
    schedulePosition();
  }
  function clearSelection() {
    if (isDisabled || !clearable) return;
    query = '';
    const changed = selected.length > 0;
    selected = [];
    refreshSelection();
    if (expanded) filterOptions();
    announce(`${label} cleared.`);
    input.focus();
    if (changed) onChange(values());
  }
  function setValue(next) {
    const entries = multiple ? (Array.isArray(next) ? next : next == null ? [] : [next]) : next == null ? [] : [next];
    selected = [...new Set(entries)].filter(entry => items.some(option => option.value === entry)).slice(0, multiple ? limit : 1);
    query = '';
    refreshSelection();
    if (expanded) renderOptions();
  }
  function setActive(index, scroll = true) {
    activeIndex = index;
    optionNodes.forEach((node, offset) => node.classList.toggle('is-active', offset === index));
    const node = optionNodes[index];
    if (!node) { input.removeAttribute('aria-activedescendant'); return; }
    input.setAttribute('aria-activedescendant', node.id);
    if (scroll) {
      const top = node.offsetTop;
      const bottom = top + node.offsetHeight;
      if (top < panel.scrollTop) panel.scrollTop = top;
      else if (bottom > panel.scrollTop + panel.clientHeight) panel.scrollTop = bottom - panel.clientHeight;
    }
  }
  function renderOptions() {
    const previous = visible[activeIndex]?.value;
    const search = query.trim().toLocaleLowerCase();
    visible = pending ? [] : items.filter(option => `${option.label} ${Array.isArray(option.keywords) ? option.keywords.join(' ') : option.keywords || ''}`.toLocaleLowerCase().includes(search));
    if (!pending && creatable && search && !items.some(option => option.label.toLocaleLowerCase() === search || String(option.value).toLocaleLowerCase() === search)) {
      visible.push({ value: query.trim(), label: `Create '${query.trim()}'`, createdLabel: query.trim(), create: true });
    }
    optionNodes = [];
    list.replaceChildren();
    const groups = new Map();
    visible.forEach((option, index) => {
      let host = list;
      if (option.group) {
        if (!groups.has(option.group)) {
          const heading = element('div', { id: uniqueId(`${id}-group`), className: 'ds-combobox-group-label' }, option.group);
          const group = element('div', { role: 'group', 'aria-labelledby': heading.id }, heading);
          groups.set(option.group, group); list.append(group);
        }
        host = groups.get(option.group);
      }
      const blocked = unavailable(option);
      const node = element('div', { id: `${id}-option-${index}`, className: 'ds-combobox-option', role: 'option', 'aria-selected': String(isSelected(option)), 'aria-disabled': String(blocked), onclick: () => choose(index), onpointermove: () => { if (!blocked) setActive(index, false); } }, element('span', {}, option.label), element('span', { className: 'ds-combobox-option-mark', 'aria-hidden': 'true' }, isSelected(option) ? '✓' : option.disabled ? '—' : ''));
      host.append(node); optionNodes.push(node);
    });
    list.setAttribute('aria-busy', String(pending));
    input.setAttribute('aria-busy', String(pending));
    message.hidden = !pending && visible.length > 0;
    message.replaceChildren(pending ? loadingIndicator('Loading mock options…') : 'No results');
    const candidates = visible.map((option, index) => unavailable(option) ? -1 : index).filter(index => index >= 0);
    const retained = visible.findIndex(option => option.value === previous && !unavailable(option));
    const chosen = visible.findIndex(option => isSelected(option) && !unavailable(option));
    setActive(retained >= 0 ? retained : chosen >= 0 ? chosen : candidates[0] ?? -1, false);
    announce(pending ? 'Loading mock options.' : `${visible.length} result${visible.length === 1 ? '' : 's'}.${multiple ? ` ${selected.length} selected.` : ''}${multiple && selected.length >= limit ? ` Maximum ${limit} selected. Remove an item to choose another.` : ''}`);
    schedulePosition();
  }
  function filterOptions() {
    clearTimeout(timer);
    pending = Boolean(loading || asyncDelay > 0);
    renderOptions();
    if (!loading && asyncDelay > 0) timer = setTimeout(() => { pending = false; if (expanded) renderOptions(); }, asyncDelay);
  }
  function choose(index) {
    const option = visible[index];
    if (!option || pending || unavailable(option) || isDisabled) return;
    if (option.create) items.push({ value: option.value, label: option.createdLabel, keywords: [], group: '' });
    const exists = isSelected(option);
    query = '';
    commit(multiple ? exists ? selected.filter(entry => entry !== option.value) : [...selected, option.value] : [option.value], `${option.createdLabel || option.label} ${exists && multiple ? 'removed' : 'selected'}.`);
    if (!multiple) close();
    else filterOptions();
    input.focus();
  }
  function position() {
    positionFrame = undefined;
    if (!expanded || !root.isConnected) return;
    const rect = control.getBoundingClientRect();
    const viewport = window.visualViewport;
    const leftEdge = viewport?.offsetLeft || 0;
    const topEdge = viewport?.offsetTop || 0;
    const viewportWidth = viewport?.width || document.documentElement.clientWidth;
    const viewportHeight = viewport?.height || window.innerHeight;
    const styles = getComputedStyle(root);
    const gap = parseFloat(styles.getPropertyValue('--space-2')) || 8;
    const width = Math.min(rect.width, Math.max(0, viewportWidth - gap * 2));
    panel.style.width = `${width}px`;
    const below = Math.max(0, topEdge + viewportHeight - rect.bottom - gap * 2);
    const above = Math.max(0, rect.top - topEdge - gap * 2);
    const desired = Math.min(panel.scrollHeight, (parseFloat(styles.getPropertyValue('--space-12')) || 48) * 5.5);
    const flip = below < desired && above > below;
    const height = Math.min(desired, flip ? above : below);
    panel.style.maxHeight = `${height}px`;
    panel.style.left = `${Math.min(Math.max(rect.left, leftEdge + gap), leftEdge + viewportWidth - width - gap)}px`;
    panel.style.top = `${Math.max(topEdge + gap, Math.min(flip ? rect.top - gap - height : rect.bottom + gap, topEdge + viewportHeight - height - gap))}px`;
    panel.dataset.placement = flip ? 'top' : 'bottom';
  }
  function schedulePosition() { if (expanded && positionFrame === undefined) positionFrame = requestAnimationFrame(position); }
  function outside(event) { if (!root.contains(event.target)) close(); }
  function open() {
    if (isDisabled || expanded) return;
    expanded = true; query = ''; input.value = '';
    panel.hidden = false;
    if (typeof panel.showPopover === 'function') panel.showPopover();
    input.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', `Hide ${label} options`);
    document.addEventListener('pointerdown', outside, true);
    window.addEventListener('resize', schedulePosition);
    window.addEventListener('scroll', schedulePosition, true);
    window.visualViewport?.addEventListener('resize', schedulePosition);
    window.visualViewport?.addEventListener('scroll', schedulePosition);
    if (typeof ResizeObserver !== 'undefined') { resizeObserver = new ResizeObserver(schedulePosition); resizeObserver.observe(control); }
    filterOptions(); position();
  }
  function close() {
    expanded = false; query = ''; clearTimeout(timer);
    if (typeof panel.hidePopover === 'function' && panel.matches(':popover-open')) panel.hidePopover();
    panel.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    input.setAttribute('aria-busy', 'false');
    toggle.setAttribute('aria-label', `Show ${label} options`);
    document.removeEventListener('pointerdown', outside, true);
    window.removeEventListener('resize', schedulePosition);
    window.removeEventListener('scroll', schedulePosition, true);
    window.visualViewport?.removeEventListener('resize', schedulePosition);
    window.visualViewport?.removeEventListener('scroll', schedulePosition);
    resizeObserver?.disconnect(); resizeObserver = undefined;
    if (positionFrame !== undefined) cancelAnimationFrame(positionFrame);
    positionFrame = undefined;
    refreshSelection();
    if (!multiple && document.activeElement === input) input.select();
  }
  function escape(event) {
    if (event.key !== 'Escape' || !root.contains(event.target) || isDisabled) return;
    if (!expanded && !query && (!clearable || !selected.length)) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (expanded) close(); else clearSelection();
  }
  input.addEventListener('focus', () => { if (!expanded && !multiple) input.select(); });
  input.addEventListener('click', open);
  input.addEventListener('input', () => {
    const next = input.value;
    if (!expanded) open();
    query = next; refreshSelection(); filterOptions();
  });
  input.addEventListener('keydown', event => {
    if (event.isComposing || isDisabled) return;
    if (event.key === 'Tab') { close(); return; }
    if (event.key === 'Enter' && expanded) { event.preventDefault(); choose(activeIndex); return; }
    if (event.key === 'Backspace' && multiple && !query && selected.length) { event.preventDefault(); removeValue(selected.at(-1)); return; }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End', 'PageDown', 'PageUp'].includes(event.key)) return;
    event.preventDefault();
    const wasOpen = expanded; open();
    const enabled = visible.map((option, index) => unavailable(option) ? -1 : index).filter(index => index >= 0);
    if (!enabled.length) return;
    const current = enabled.indexOf(activeIndex);
    let next;
    if (event.key === 'Home' || (!wasOpen && event.key !== 'ArrowUp' && event.key !== 'End' && event.key !== 'PageUp')) next = 0;
    else if (event.key === 'End' || (!wasOpen && (event.key === 'ArrowUp' || event.key === 'PageUp'))) next = enabled.length - 1;
    else if (event.key === 'PageDown' || event.key === 'PageUp') next = Math.min(enabled.length - 1, Math.max(0, current + (event.key === 'PageDown' ? 5 : -5)));
    else next = (current + (event.key === 'ArrowDown' ? 1 : -1) + enabled.length) % enabled.length;
    setActive(enabled[next]);
  });
  panel.addEventListener('pointerdown', event => { if (event.pointerType === 'mouse') event.preventDefault(); });
  panel.addEventListener('mousedown', event => event.preventDefault());
  root.addEventListener('focusin', () => window.addEventListener('keydown', escape, true));
  root.addEventListener('focusout', event => { if (!root.contains(event.relatedTarget)) { close(); window.removeEventListener('keydown', escape, true); } });
  onDetach(root, () => { close(); window.removeEventListener('keydown', escape, true); });
  setValue(value);
  return { id, element: root, input, get value() { return values(); }, setValue, close, setDisabled(next) { isDisabled = Boolean(next); input.disabled = isDisabled; toggle.disabled = isDisabled; root.dataset.disabled = String(isDisabled); close(); } };
}

const mockOptions = [
  { label: 'Product', options: [{ value: 'design', label: 'Design', keywords: ['ux', 'ui', 'research'] }, { value: 'engineering', label: 'Engineering', keywords: ['code', 'development'] }, { value: 'qa', label: 'Quality assurance', keywords: ['testing'] }] },
  { label: 'Business', options: [{ value: 'operations', label: 'Operations', keywords: ['administration', 'support'] }, { value: 'marketing', label: 'Marketing', keywords: ['growth'] }, { value: 'finance', label: 'Finance', keywords: ['accounts'], disabled: true }] },
];

export const guide = {
  purpose: 'Search a longer list and select one value or several removable values without leaving the current form.',
  props: ['createCombobox({label, options, value, multiple, onChange, placeholder, disabled, clearable, maxSelected, creatable, asyncDelay, loading, error, hint, required, hideLabel, name}).', 'Options: {value, label, keywords?: string|string[], group?, disabled?}; groups also accept {label, options:[…]}. Value is a scalar/null or an array in multiple mode. onChange receives that value.', 'Returns {id, element, input, value getter, setValue(value), close(), setDisabled(boolean)}. setValue is silent and accepts existing values only; name emits hidden successful form controls.'],
  variants: ['Single, multi-select with chips, grouped, creatable, clearable, mock-delayed search.'],
  states: ['Closed, expanded, active, selected, disabled option/control, error, mock loading, No results, maximum selected.'],
  keyboard: ['Type filters labels and keywords case-insensitively. Arrow Up/Down opens and navigates enabled results; Home/End jumps; Page Up/Down moves five results; Enter selects.', 'Escape closes the list first; when closed it clears a clearable selection. Tab closes and exits. Backspace with an empty multi input removes the last chip. Tab reaches chip removal and Clear buttons.'],
  accessibility: ['ARIA 1.2 input combobox keeps focus and points aria-activedescendant at listbox options. Group labels, selected/disabled states, live results/removal feedback, visible label and linked hints/errors are provided.', 'A manual top-layer popover stays within its original dialog DOM so modal/drawer focus trapping still works; the first Escape dismisses only this popover.'],
  responsive: ['Popover measures the visual viewport, flips upward when needed, clamps width/height, and repositions on scroll/resize. Phones use 44px actions/options and 16px input text.'],
  tokens: ['--surface, --text, --muted, --border, --accent-soft, --accent-text, --focus-ring, --danger-text, --space-*, --radius, --shadow. Existing select-popover class supplies surface-kit treatment.'],
  do: ['Use country names, synonyms or codes as search keywords. Label mock delays and provide explicit selection limits.'],
  dont: ['Do not use a searchable picker for a tiny fixed choice or treat a mock loading delay as a network integration.'],
  example: "createCombobox({ label: 'Teams', options: [{ value: 'design', label: 'Design', keywords: ['UX'] }], multiple: true, maxSelected: 3, onChange: values => console.log(values) })",
};

export function demo(container) {
  const choice = createCombobox({ label: 'Mock teams', options: mockOptions, multiple: true, value: ['design'], maxSelected: 3, hint: 'Search labels or keywords such as UX. Select up to 3.' });
  container.append(choice.element);
  return choice;
}

export function render(container) {
  const page = playground(container, { title: 'Combobox', description: 'Search grouped mock teams, select one or several, create an option, and try the complete keyboard flow in a page, modal or drawer.' });
  const props = { label: 'Mock teams', multiple: true, clearable: true, creatable: true, disabled: false, asyncDelay: 0, maxSelected: 3, error: false };
  const preview = element('div', { className: 'component-demo-stack' });
  const feedback = statusMessage('Mock data · no network requests or server writes.');
  let current = ['design'];
  let choice;
  function build() {
    choice?.close();
    choice = createCombobox({ ...props, value: current, options: mockOptions, error: props.error ? 'Choose a team before continuing.' : '', hint: 'Mock teams · maximum 3 in multi-select. Try “UX”, “code”, or a new team name.', onChange: value => { current = value; feedback.textContent = `Mock selection: ${Array.isArray(value) ? value.join(', ') || 'none' : value || 'none'}`; } });
    preview.replaceChildren(choice.element, feedback);
    page.setSnippet(guide.example);
  }
  page.preview.append(preview);
  page.controls.append(textControl('Label', props.label, value => { props.label = value; build(); }),
    toggleControl('Multiple', true, value => { props.multiple = value; current = value ? current == null ? [] : Array.isArray(current) ? current : [current] : Array.isArray(current) ? current[0] ?? null : current; build(); }),
    ...['clearable', 'creatable', 'disabled', 'error'].map(key => toggleControl(key[0].toUpperCase() + key.slice(1), props[key], value => { props[key] = value; build(); })),
    toggleControl('Mock async delay (600ms)', false, value => { props.asyncDelay = value ? 600 : 0; build(); }));
  const launch = drawer => {
    const picker = createCombobox({ label: 'Mock teams in dialog', options: mockOptions, multiple: true, maxSelected: 3, creatable: true, hint: 'Escape closes options first. Tab reaches chip removal buttons.' });
    (drawer ? openDrawer : openModal)({ title: drawer ? 'Combobox in drawer · mock' : 'Combobox in modal · mock', content: picker.element, actions: [{ label: 'Close', onClick: close => close() }] });
  };
  page.states.append(statePreview('Single', createCombobox({ label: 'Single mock team', options: mockOptions, value: 'engineering' }).element),
    statePreview('Disabled', createCombobox({ label: 'Disabled mock team', options: mockOptions, value: 'design', disabled: true }).element),
    statePreview('Error', createCombobox({ label: 'Required team', options: mockOptions, required: true, error: 'Choose a team.' }).element),
    statePreview('Loading', createCombobox({ label: 'Mock loading options', options: [], loading: true }).element),
    statePreview('Empty', createCombobox({ label: 'Empty mock dataset', options: [] }).element),
    statePreview('Maximum selected', createCombobox({ label: 'One mock team maximum', options: mockOptions, multiple: true, maxSelected: 1, value: ['design'] }).element),
    statePreview('Overlays', element('div', { className: 'component-demo-stack' }, button('Open in modal', () => launch(false)), button('Open in drawer', () => launch(true)))));
  build();
}
