import { element, button, uniqueId, openModal, onDetach, playground, choiceControl, toggleControl, textControl, statePreview, statusMessage } from './playground.js';
import { parseISODate, formatISODate, addDays, addMonths, getWeekStart, getWeekday, isDateDisabled, calendarGrid } from '../js/logic/date.js';
import { icon } from '../js/icons.js';

function localToday() {
  const now = new Date();
  return formatISODate({ year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() });
}

function dateObject(value) {
  const parts = parseISODate(value);
  const date = new Date(0);
  date.setUTCFullYear(parts.year, parts.month - 1, parts.day);
  return date;
}

function dateFormatter(locale, options) {
  return new Intl.DateTimeFormat(locale, { calendar: 'gregory', timeZone: 'UTC', ...options });
}

// The range picker shares the field, calendar grid, keyboard model and modal lifecycle.
export function createDateControl({ label = 'Date', value = null, locale = 'en-US', weekStartsOn, min, max, disabledDates = [], disabled = false, required = false, clearable = true, hint = '', error = '', name, placeholder, initialMonth, onChange = () => {} } = {}, range = false) {
  const id = uniqueId(range ? 'date-range-picker' : 'date-picker');
  const today = localToday();
  const constraints = { locale, weekStartsOn, min, max, disabledDates };
  const weekStart = Number.isInteger(weekStartsOn) && weekStartsOn >= 0 && weekStartsOn <= 6 ? weekStartsOn : getWeekStart(locale);
  const longDate = dateFormatter(locale, { dateStyle: 'full' });
  const shortDate = dateFormatter(locale, { dateStyle: 'medium' });
  const monthDate = dateFormatter(locale, { month: 'long', year: 'numeric' });
  const weekdayShort = dateFormatter(locale, { weekday: 'short' });
  const weekdayLong = dateFormatter(locale, { weekday: 'long' });
  const number = new Intl.NumberFormat(locale, { useGrouping: false });
  let selected = range ? { start: null, end: null } : null;
  let isDisabled = Boolean(disabled);
  let dialog = null;
  let active = parseISODate(initialMonth) ? initialMonth : today;
  let calendar;
  let grid;
  let heading;
  let announcement;
  let previous;
  let next;
  const emptyText = placeholder || (range ? 'Choose a date range' : 'Choose a date');
  const labelNode = element('label', { for: id, className: 'ds-date-picker-label' }, label, required ? ' *' : '');
  const triggerText = element('span');
  const trigger = button('', () => open(), 'secondary', { id, className: 'ds-button ds-button-secondary ds-date-picker-trigger', 'aria-haspopup': 'dialog', 'aria-expanded': 'false', 'aria-invalid': String(Boolean(error)), disabled: isDisabled });
  const calendarIcon = element('span', { className: 'ds-date-picker-icon', 'aria-hidden': 'true' });
  calendarIcon.innerHTML = icon('calendar');
  trigger.append(triggerText, calendarIcon);
  const description = element('small', { id: `${id}-hint`, className: 'ds-date-picker-hint', hidden: !hint }, hint);
  const errorNode = element('small', { id: `${id}-error`, className: 'ds-date-picker-error', hidden: !error }, typeof error === 'string' ? error : 'Choose a valid date.');
  const summary = element('span', { id: `${id}-summary`, className: 'ds-date-picker-sr-only' });
  const hiddenValues = element('span', { hidden: true });
  const root = element('div', { className: `ds-date-picker${range ? ' ds-date-range-picker' : ''}` }, labelNode, trigger, description, errorNode, summary, hiddenValues);
  trigger.setAttribute('aria-labelledby', `${id}-label ${id}-value`);
  labelNode.id = `${id}-label`;
  triggerText.id = `${id}-value`;
  trigger.setAttribute('aria-describedby', [summary.id, hint && description.id, error && errorNode.id].filter(Boolean).join(' '));
  if (error) trigger.setAttribute('aria-errormessage', errorNode.id);

  function formatted(date, full = false) { return (full ? longDate : shortDate).format(dateObject(date)); }
  function values() { return range ? { ...selected } : selected; }
  function hasSelection() { return range ? Boolean(selected.start) : Boolean(selected); }
  function rangeAllowed(start, end) {
    if (isDateDisabled(start, constraints) || isDateDisabled(end, constraints)) return false;
    if (typeof disabledDates !== 'function') return ![...disabledDates].some(date => date >= start && date <= end);
    for (let date = start; date && date <= end; date = addDays(date, 1)) if (isDateDisabled(date, constraints)) return false;
    return true;
  }
  function selectionText() {
    if (!hasSelection()) return emptyText;
    if (!range) return formatted(selected);
    return selected.end ? `${formatted(selected.start)} – ${formatted(selected.end)}` : `${formatted(selected.start)} – Choose end date`;
  }
  function refresh() {
    triggerText.textContent = selectionText();
    trigger.classList.toggle('is-placeholder', !hasSelection());
    summary.textContent = range && selected.start ? `Start: ${formatted(selected.start, true)}. ${selected.end ? `End: ${formatted(selected.end, true)}.` : 'Choose an end date.'}` : hasSelection() ? `Selected: ${formatted(selected, true)}.` : 'No date selected.';
    const entries = range ? [[`${name}-start`, selected.start], [`${name}-end`, selected.end]] : [[name, selected]];
    hiddenValues.replaceChildren(...(name ? entries.map(([fieldName, date]) => element('input', { type: 'hidden', name: fieldName, value: date || '', disabled: isDisabled })) : []));
  }
  function setValue(value) {
    if (range) {
      const start = value?.start ?? null;
      const end = value?.end ?? null;
      if ((!start && end) || (start && isDateDisabled(start, constraints)) || (end && (end < start || !rangeAllowed(start, end)))) return false;
      selected = { start, end };
    } else {
      if (value !== null && value !== '' && isDateDisabled(value, constraints)) return false;
      selected = value || null;
    }
    refresh();
    if (dialog) renderCalendar();
    return true;
  }
  function clamp(date) {
    if (parseISODate(min) && date < min) return min;
    if (parseISODate(max) && date > max) return max;
    return date;
  }
  function announce(message) { announcement.textContent = message; }
  function focusDay() { grid.querySelector('[tabindex="0"]')?.focus(); }
  function move(date, focus = true) {
    if (!parseISODate(date)) return;
    active = clamp(date);
    renderCalendar();
    if (focus) focusDay();
  }
  function choose(date) {
    if (isDateDisabled(date, constraints)) { announce('This date is unavailable. Choose another date.'); return; }
    if (!range) {
      selected = date;
      refresh();
      onChange(values());
      close();
      return;
    }
    if (!selected.start || selected.end) {
      selected = { start: date, end: null };
      active = date;
      refresh();
      renderCalendar();
      focusDay();
      announce(`Start date ${formatted(date, true)} selected. Choose the end date.`);
      onChange(values());
      return;
    }
    const start = date < selected.start ? date : selected.start;
    const end = date < selected.start ? selected.start : date;
    if (!rangeAllowed(start, end)) { announce('This range includes an unavailable date. Choose an end date without crossing an unavailable day.'); return; }
    selected = { start, end };
    refresh();
    onChange(values());
    close();
  }
  function dayKey(event) {
    let target;
    if (event.key === 'ArrowLeft') target = addDays(active, -1);
    else if (event.key === 'ArrowRight') target = addDays(active, 1);
    else if (event.key === 'ArrowUp') target = addDays(active, -7);
    else if (event.key === 'ArrowDown') target = addDays(active, 7);
    else if (event.key === 'Home') target = addDays(active, -((getWeekday(active) - weekStart + 7) % 7));
    else if (event.key === 'End') target = addDays(active, 6 - ((getWeekday(active) - weekStart + 7) % 7));
    else if (event.key === 'PageUp') target = addMonths(active, event.shiftKey ? -12 : -1);
    else if (event.key === 'PageDown') target = addMonths(active, event.shiftKey ? 12 : 1);
    else return;
    event.preventDefault();
    event.stopPropagation();
    if (target) move(target);
  }
  function renderCalendar() {
    if (!grid) return;
    heading.textContent = monthDate.format(dateObject(active));
    const cells = calendarGrid(active, constraints);
    const rows = [];
    for (let index = 0; index < cells.length; index += 7) {
      rows.push(element('tr', { role: 'row' }, ...cells.slice(index, index + 7).map(cell => {
        if (!cell.date) return element('td', { role: 'gridcell', 'aria-disabled': 'true' });
        const isStart = range && cell.date === selected.start;
        const isEnd = range && cell.date === selected.end;
        const inRange = range && selected.end && cell.date >= selected.start && cell.date <= selected.end;
        const isSelected = range ? Boolean(isStart || isEnd || inRange) : cell.date === selected;
        const dateButton = button(number.format(cell.day), () => choose(cell.date), 'ghost', { className: 'ds-date-picker-day', tabindex: cell.date === active ? '0' : '-1', 'data-date': cell.date, 'data-outside': String(!cell.inMonth), 'data-selected': String(isSelected), 'data-endpoint': String(range ? isStart || isEnd : isSelected), 'aria-disabled': String(cell.disabled), 'aria-current': cell.date === today ? 'date' : undefined, 'aria-label': `${number.format(cell.day)}, ${formatted(cell.date, true)}${isStart ? ', range start' : ''}${isEnd ? ', range end' : ''}` });
        dateButton.addEventListener('focus', () => {
          active = cell.date;
          grid.querySelectorAll('.ds-date-picker-day').forEach(node => { node.tabIndex = node === dateButton ? 0 : -1; });
        });
        dateButton.addEventListener('keydown', dayKey);
        return element('td', { role: 'gridcell', 'aria-selected': String(isSelected) }, dateButton);
      })));
    }
    grid.querySelector('tbody').replaceChildren(...rows);
    const before = addMonths(active, -1);
    const after = addMonths(active, 1);
    previous.disabled = !before || Boolean(parseISODate(min) && before.slice(0, 7) < min.slice(0, 7));
    next.disabled = !after || Boolean(parseISODate(max) && after.slice(0, 7) > max.slice(0, 7));
  }
  function close() { dialog?.close(); }
  function open() {
    if (isDisabled || dialog) return;
    active = clamp((range ? selected.start : selected) || (parseISODate(initialMonth) ? initialMonth : today));
    heading = element('h3', { id: `${id}-month`, className: 'ds-date-picker-month', 'aria-live': 'polite', 'aria-atomic': 'true' });
    previous = button('', () => move(addMonths(active, -1), false), 'ghost', { 'aria-label': 'Previous month', className: 'ds-button ds-button-ghost ds-date-picker-nav' });
    previous.innerHTML = icon('arrowLeft');
    next = button('', () => move(addMonths(active, 1), false), 'ghost', { 'aria-label': 'Next month', className: 'ds-button ds-button-ghost ds-date-picker-nav' });
    next.innerHTML = icon('arrowRight');
    const weekdays = Array.from({ length: 7 }, (_, index) => dateObject(addDays('2026-10-25', (weekStart + index) % 7)));
    grid = element('table', { role: 'grid', className: 'ds-date-picker-grid', 'aria-labelledby': heading.id, 'aria-required': String(required), 'aria-multiselectable': range ? 'true' : undefined }, element('thead', {}, element('tr', { role: 'row' }, ...weekdays.map(date => element('th', { role: 'columnheader', scope: 'col', abbr: weekdayLong.format(date) }, weekdayShort.format(date))))), element('tbody'));
    announcement = element('p', { className: 'ds-date-picker-announcement', role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' }, range ? selected.start && !selected.end ? 'Choose the end date. Unavailable dates cannot be included.' : 'Choose a start date, then an end date. Unavailable dates cannot be included.' : 'Choose a date. Unavailable dates cannot be selected.');
    const help = element('p', { id: `${id}-keys`, className: 'ds-date-picker-help' }, 'Arrows: day/week · Home/End: week boundaries · Page Up/Down: month · Shift + Page Up/Down: year · Enter/Space: select · Escape: close');
    grid.setAttribute('aria-describedby', help.id);
    const todayButton = button('Today', () => move(today), 'secondary');
    todayButton.disabled = isDateDisabled(today, constraints);
    const clear = button('Clear', () => {
      selected = range ? { start: null, end: null } : null;
      refresh();
      onChange(values());
      close();
    }, 'ghost');
    clear.hidden = !clearable || required;
    calendar = element('div', { className: 'ds-date-picker-calendar' }, element('div', { className: 'ds-date-picker-header' }, previous, heading, next), grid, announcement, help, element('div', { className: 'ds-date-picker-footer' }, todayButton, clear));
    renderCalendar();
    dialog = openModal({ title: range ? `Choose ${label} range` : `Choose ${label}`, content: calendar, size: 'small', onClose: () => {
      dialog = null;
      trigger.setAttribute('aria-expanded', 'false');
      trigger.removeAttribute('aria-controls');
      grid = null;
      if (trigger.isConnected && !isDisabled) trigger.focus();
    } });
    dialog.element.classList.add('ds-date-picker-dialog');
    dialog.element.id = `${id}-dialog`;
    trigger.setAttribute('aria-controls', dialog.element.id);
    trigger.setAttribute('aria-expanded', 'true');
    focusDay();
  }
  trigger.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); open(); }
  });
  onDetach(root, close);
  setValue(value);
  return { element: root, trigger, get value() { return values(); }, setValue, open, close, setDisabled(next) { isDisabled = Boolean(next); trigger.disabled = isDisabled; refresh(); if (isDisabled) close(); }, destroy() { close(); root.remove(); } };
}

export function createDatePicker(options = {}) { return createDateControl(options); }

export const guide = {
  purpose: 'Choose a date-only value with a locale-aware calendar, explicit unavailable days and complete keyboard navigation.',
  props: ['createDatePicker({label, value, locale, weekStartsOn, min, max, disabledDates, disabled, required, clearable, hint, error, name, placeholder, initialMonth, onChange}) returns element, trigger, value, setValue, setDisabled, open, close and destroy.', 'Values, bounds and initialMonth are ISO YYYY-MM-DD strings. disabledDates accepts an array, Set or predicate. Bounds are inclusive. setValue is silent and returns false without changing the value when unavailable. A named hidden input carries the ISO value.'],
  variants: ['Single date; locale-defined or explicitly overridden week start; optional required and clearable field; shared calendar icon on the trigger.'],
  states: ['Empty, selected, today, focused day, unavailable day, disabled field, error and open calendar.'],
  keyboard: ['Enter/Space or Up/Down opens the calendar. Left/Right moves one day; Up/Down one week. Home/End moves to locale week boundaries. Page Up/Down moves a month; Shift + Page Up/Down moves a year, clamping the day.', 'Enter/Space selects. Disabled days remain discoverable with arrow keys but cannot be selected. Tab stays within the shared modal; Escape or Close dismisses and returns focus to the trigger.'],
  accessibility: ['Persistent label, hint/error descriptions, required state and named modal. The calendar uses grid/row/gridcell roles with exactly one day in the tab sequence, aria-selected for selection and aria-current=date for today.', 'Month changes and selection instructions are announced. All calculations are date-only UTC; localized display always uses the Gregorian calendar to match ISO values.'],
  tokens: ['--surface, --text, --muted, --accent, --accent-contrast, --accent-soft, --border, --danger-text, --focus-ring, --space-1 through --space-4, --radius, --font-size-sm.'],
  responsive: ['One calendar month fits the viewport without page overflow. All day and navigation targets are at least 44px; field text is at least 16px on phones. Long localized headings wrap.'],
  do: ['Explain unavailable dates in the field hint and use ISO date-only strings at the application boundary.', 'Use DateRangePicker for one continuous interval.'],
  dont: ['Do not use a native date input or parse localized display text as a stored value.', 'Do not imply a timezone or time-of-day when collecting only a date.'],
  example: 'const date = createDatePicker({ label: "Invoice date", value: "2026-10-26", locale: "en-GB", min: "2026-10-01", max: "2026-12-31", onChange: value => console.log(value) });\ncontainer.append(date.element);'
};

export function render(container) {
  const page = playground(container, { title: 'DatePicker', description: 'A real date-only calendar with locale week starts and full keyboard navigation. Mock invoice dates stay local.' });
  const props = { label: 'Mock invoice date', value: '2026-10-26', locale: 'en-GB', initialMonth: '2026-10-26', disabled: false, required: false, error: '', min: '2026-10-01', max: '2026-12-31' };
  let blockWeekends = true;
  let current;
  const slot = element('div', { className: 'ds-date-picker-demo' });
  const feedback = statusMessage('Mock data. Choose a date; weekends are initially unavailable.');
  page.preview.append(slot, feedback);
  function update() {
    current?.destroy();
    current = createDatePicker({ ...props, disabledDates: date => blockWeekends && [0, 6].includes(getWeekday(date)), hint: `Mock availability: ${props.min} through ${props.max}${blockWeekends ? '; weekends unavailable' : ''}.`, onChange: date => { props.value = date; feedback.textContent = `Mock invoice date: ${date || 'not selected'}.`; } });
    slot.replaceChildren(current.element);
    page.setSnippet(`const picker = createDatePicker({ label: ${JSON.stringify(props.label)}, value: ${JSON.stringify(current.value)}, locale: ${JSON.stringify(props.locale)}, min: ${JSON.stringify(props.min)}, max: ${JSON.stringify(props.max)} });\ncontainer.append(picker.element);`);
  }
  page.controls.append(textControl('Field label', props.label, value => { props.label = value; update(); }), choiceControl('Locale / week start', props.locale, [{ value: 'en-GB', label: 'English (UK) · Monday' }, { value: 'en-US', label: 'English (US) · Sunday' }, { value: 'de-DE', label: 'German · Monday' }, { value: 'ar-EG', label: 'Arabic (Egypt) · Saturday' }], value => { props.locale = value; update(); }), toggleControl('Disable weekends (mock)', true, value => { blockWeekends = value; update(); }), toggleControl('Disabled', false, value => { props.disabled = value; update(); }), toggleControl('Required', false, value => { props.required = value; update(); }), toggleControl('Error', false, value => { props.error = value ? 'Confirm the mock invoice date before saving.' : ''; update(); }));
  for (const [state, options] of [['Empty', {}], ['Selected', { value: '2026-10-26' }], ['Required', { required: true }], ['Disabled', { value: '2026-10-26', disabled: true }], ['Error', { error: 'Choose a mock invoice date.' }]]) {
    const example = createDatePicker({ label: `${state} mock date`, initialMonth: '2026-10-26', ...options });
    page.states.append(statePreview(state, example.element));
  }
  update();
}
