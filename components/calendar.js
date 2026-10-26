import { element, button, uniqueId, playground, choiceControl, toggleControl, statePreview, statusMessage } from './playground.js';
import { createTag, tagTones } from './tag.js';
import { parseISODate, formatISODate, addDays, getWeekStart } from '../js/logic/date.js';
import { placeCalendarEvents, shiftCalendarDate, calendarKeyDate } from '../js/logic/calendar.js';
import { icon } from '../js/icons.js';

function dateObject(value) {
  const parts = parseISODate(value);
  const date = new Date(0);
  date.setUTCFullYear(parts.year, parts.month - 1, parts.day);
  return date;
}

function localToday() {
  const now = new Date();
  return formatISODate({ year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() });
}

function statusTone(status) {
  const value = String(status).toLowerCase();
  if (tagTones.includes(value)) return value;
  return { confirmed: 'success', completed: 'success', pending: 'warning', tentative: 'warning', cancelled: 'danger', overdue: 'danger', scheduled: 'info' }[value] || 'neutral';
}

export function createCalendar({ date = '2026-10-26', view = 'month', events = [], locale = 'en-GB', onSelectDate = () => {}, onSelectEvent = () => {} } = {}) {
  const id = uniqueId('calendar');
  let selected = parseISODate(date) ? date : '2026-10-26';
  let currentView = view === 'week' ? 'week' : 'month';
  let currentEvents = [...events];
  const format = options => new Intl.DateTimeFormat(locale, { calendar: 'gregory', timeZone: 'UTC', ...options });
  const fullDate = format({ dateStyle: 'full' });
  const shortDate = format({ dateStyle: 'medium' });
  const monthDate = format({ month: 'long', year: 'numeric' });
  const weekdayShort = format({ weekday: 'short' });
  const weekdayLong = format({ weekday: 'long' });
  const number = new Intl.NumberFormat(locale, { useGrouping: false });
  const heading = element('h3', { id: `${id}-heading`, className: 'ds-calendar-heading', 'aria-live': 'polite', 'aria-atomic': 'true' });
  const help = element('p', { id: `${id}-help`, className: 'ds-calendar-help' }, 'Arrows: day/week · Home/End: week boundaries · Page Up/Down: previous/next view period · Shift + Page Up/Down: year. Select a day to read its events; Tab reaches every event.');
  const announcement = element('p', { className: 'ds-calendar-sr-only', role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' });
  const previous = button('', () => choose(shiftCalendarDate(selected, -1, currentView)), 'secondary', { className: 'ds-button ds-button-secondary ds-calendar-nav' });
  previous.innerHTML = icon('arrowLeft');
  const next = button('', () => choose(shiftCalendarDate(selected, 1, currentView)), 'secondary', { className: 'ds-button ds-button-secondary ds-calendar-nav' });
  next.innerHTML = icon('arrowRight');
  const today = button('Today', () => choose(localToday()), 'secondary');
  const monthButton = button('Month', () => setView('month'), 'secondary', { 'aria-pressed': String(currentView === 'month') });
  const weekButton = button('Week', () => setView('week'), 'secondary', { 'aria-pressed': String(currentView === 'week') });
  const weekStart = getWeekStart(locale);
  const weekdays = Array.from({ length: 7 }, (_, index) => dateObject(addDays('2026-10-25', (weekStart + index) % 7)));
  const body = element('tbody');
  const grid = element('table', { className: 'ds-calendar-grid', role: 'grid', 'aria-labelledby': heading.id, 'aria-describedby': help.id }, element('thead', {}, element('tr', { role: 'row' }, ...weekdays.map(day => element('th', { role: 'columnheader', scope: 'col', abbr: weekdayLong.format(day) }, weekdayShort.format(day))))), body);
  const agendaHeading = element('h4', { id: `${id}-agenda-heading`, className: 'ds-calendar-agenda-heading' });
  const agendaBody = element('div', { className: 'ds-calendar-agenda-body' });
  const agenda = element('section', { className: 'ds-calendar-agenda', 'aria-labelledby': agendaHeading.id }, agendaHeading, agendaBody);
  const root = element('section', { className: 'ds-calendar', 'aria-labelledby': heading.id },
    element('header', { className: 'ds-calendar-toolbar' }, heading,
      element('div', { className: 'ds-calendar-controls', role: 'group', 'aria-label': 'Calendar period' }, previous, today, next),
      element('div', { className: 'ds-calendar-controls', role: 'group', 'aria-label': 'Calendar view' }, monthButton, weekButton)),
    element('div', { className: 'ds-calendar-scroll', role: 'region', 'aria-label': 'Calendar dates; scroll horizontally on narrow screens' }, grid), help, agenda, announcement);

  function formatted(value, full = false) { return (full ? fullDate : shortDate).format(dateObject(value)); }
  function focusDay() { body.querySelector('[tabindex="0"]')?.focus(); }
  function choose(value, focus = false) {
    if (!parseISODate(value)) return false;
    selected = value;
    refresh();
    if (focus) focusDay();
    const count = currentEvents.filter(event => event?.date === selected).length;
    announcement.textContent = `${formatted(selected, true)} selected. ${count} ${count === 1 ? 'event' : 'events'}.`;
    onSelectDate(selected);
    return true;
  }
  function dayKey(event, value) {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    const target = calendarKeyDate(value, event.key, { view: currentView, locale, shiftKey: event.shiftKey });
    if (target) choose(target, true);
  }
  function eventItem(event) {
    const label = `${event.time || 'All day'} · ${event.title}${event.status ? ` · ${event.status}` : ''}`;
    const control = button('', () => onSelectEvent(event), 'ghost', { className: 'ds-button ds-button-ghost ds-calendar-event', 'data-event-id': event.id, 'aria-label': `${formatted(event.date)} · ${label}` });
    control.append(element('span', { className: 'ds-calendar-event-time' }, event.time || 'All day'), element('span', { className: 'ds-calendar-event-title' }, event.title));
    if (event.status) control.append(createTag({ label: event.status, tone: statusTone(event.status), dot: true, pill: true, size: 'small' }));
    return element('li', {}, control);
  }
  function refresh() {
    const hadDayFocus = body.contains(document.activeElement);
    const focusedEvent = agenda.contains(document.activeElement) ? document.activeElement.closest('[data-event-id]')?.getAttribute('data-event-id') : null;
    const days = placeCalendarEvents(selected, { view: currentView, locale, events: currentEvents });
    const validDays = days.filter(day => day.date);
    heading.textContent = currentView === 'month' ? monthDate.format(dateObject(selected)) : `${formatted(validDays[0].date)} – ${formatted(validDays.at(-1).date)}`;
    previous.setAttribute('aria-label', `Previous ${currentView}`);
    next.setAttribute('aria-label', `Next ${currentView}`);
    previous.disabled = !shiftCalendarDate(selected, -1, currentView);
    next.disabled = !shiftCalendarDate(selected, 1, currentView);
    monthButton.setAttribute('aria-pressed', String(currentView === 'month'));
    weekButton.setAttribute('aria-pressed', String(currentView === 'week'));
    const todayDate = localToday();
    const rows = [];
    for (let index = 0; index < days.length; index += 7) {
      rows.push(element('tr', { role: 'row' }, ...days.slice(index, index + 7).map(day => {
        if (!day.date) return element('td', { role: 'gridcell', 'aria-disabled': 'true' });
        const isSelected = day.date === selected;
        const dayButton = button('', () => choose(day.date, true), 'ghost', { className: 'ds-calendar-day', 'data-date': day.date, 'data-outside': String(!day.inMonth), 'data-selected': String(isSelected), tabindex: isSelected ? '0' : '-1', 'aria-current': day.date === todayDate ? 'date' : undefined, 'aria-label': `${formatted(day.date, true)}${day.date === todayDate ? ', today' : ''}, ${day.events.length} ${day.events.length === 1 ? 'event' : 'events'}` });
        dayButton.append(element('span', { className: 'ds-calendar-day-number' }, number.format(day.day)), element('span', { className: 'ds-calendar-day-count', 'aria-hidden': 'true' }, day.events.length ? `${number.format(day.events.length)} ·` : ''));
        dayButton.addEventListener('keydown', event => dayKey(event, day.date));
        return element('td', { role: 'gridcell', 'aria-selected': String(isSelected) }, dayButton);
      })));
    }
    body.replaceChildren(...rows);
    agendaHeading.textContent = currentView === 'month' ? `Events · ${formatted(selected, true)}` : 'Events this week';
    const agendaDays = currentView === 'month' ? days.filter(day => day.date === selected) : validDays;
    const eventGroups = agendaDays.filter(day => day.events.length).map(day => element('section', { className: 'ds-calendar-event-group', 'data-selected': String(day.date === selected) },
      currentView === 'week' ? element('h5', { className: 'ds-calendar-event-date' }, formatted(day.date, true)) : null,
      element('ul', { className: 'ds-calendar-events', 'aria-label': `Events for ${formatted(day.date)}` }, ...day.events.map(eventItem))));
    agendaBody.replaceChildren(...(eventGroups.length ? eventGroups : [element('p', { className: 'ds-calendar-empty' }, currentView === 'month' ? 'No events on this date.' : 'No events this week.')]));
    if (hadDayFocus) focusDay();
    else if (focusedEvent !== null) {
      const replacement = [...agenda.querySelectorAll('[data-event-id]')].find(node => node.getAttribute('data-event-id') === focusedEvent);
      if (replacement) replacement.focus({ preventScroll: true });
      else focusDay();
    }
  }
  function setView(value) {
    if (!['month', 'week'].includes(value)) return false;
    currentView = value;
    refresh();
    return true;
  }
  refresh();
  return {
    element: root,
    getDate: () => selected,
    getView: () => currentView,
    setEvents(value) { currentEvents = [...value]; refresh(); },
    setDate(value) { if (!parseISODate(value)) return false; selected = value; refresh(); return true; },
    setView,
    destroy() { root.remove(); }
  };
}

export const guide = {
  purpose: 'Browse date-only schedules in locale-aligned month and week views, with a complete keyboard model and accessible event lists.',
  props: ['createCalendar({date="2026-10-26", view="month", events=[], locale="en-GB", onSelectDate, onSelectEvent}) returns {element, setEvents, getDate, setDate, setView, getView, destroy}.', 'Events are {id, title, date, time?, status?}; dates use ISO YYYY-MM-DD and optional times use HH:mm labels without timezone conversion. All-day events sort first, followed by time; equal times retain input order. Callbacks receive the selected ISO date or original event object.', 'setEvents replaces records. setDate and setView update silently and return false for invalid input. Date selection, arrow navigation and period controls call onSelectDate.'],
  variants: ['Month: stable six-week grid with counts and selected-date agenda. Week: seven-day grid and all events across the displayed week. Locale defines the first day of the week.'],
  states: ['Selected date, today marker, adjacent-month day, populated agenda, empty date/week and previous/next date boundary. Status chips display their text with semantic token colours.'],
  keyboard: ['Left/Right selects the previous/next day; Up/Down selects the previous/next week. Home/End selects locale week boundaries. Page Up/Down moves one displayed period, and Shift + Page Up/Down moves a year with day clamping.', 'Enter/Space activates a day or event. One date is in the tab sequence; Tab reaches every event in the agenda and all view/period controls. Selection follows date-key navigation.'],
  accessibility: ['Named date grid with column headers, row/gridcell roles, aria-selected on the selected cell and aria-current=date for today. Counts and full dates are included in day names.', 'The selected period and date changes are announced. Every event is a full-width labelled button with visible title, time/all-day text and optional textual status; colour is never the only status cue.'],
  tokens: ['--surface, --text, --muted, --accent-soft, --accent-text, --border, --focus-ring, shared Tag success/warning/danger/info/neutral tokens, --space-1 through --space-4, --radius, --font-size-sm.'],
  responsive: ['Toolbar controls wrap. The date grid has an internal horizontal scroller when seven 44px targets cannot fit; the page never needs to scroll horizontally. Event titles wrap in a full-width agenda with no clipped or hidden events.', 'Month day counts lead to a selected-date list rather than squeezing event titles into tiny cells. Week lists retain all seven days and their complete events at phone widths.'],
  do: ['Provide stable event IDs and mark demonstration schedules as mock data.', 'Use onSelectEvent to open a shared Modal or Drawer; update the model with setEvents after saving.'],
  dont: ['Do not use this scheduling calendar in place of a form DatePicker.', 'Do not treat a date-only value or display-only time label as an absolute timezone-aware timestamp.'],
  example: 'const calendar = createCalendar({date: "2026-10-26", view: "week", locale: "en-GB", events: [{id: "meeting", title: "Mock meeting", date: "2026-10-26", time: "09:00", status: "confirmed"}], onSelectEvent: event => console.log(event)});\ncontainer.append(calendar.element);'
};

export function render(container) {
  const page = playground(container, { title: 'Calendar', description: guide.purpose });
  const mockEvents = [
    { id: 'review', title: 'Mock project review', date: '2026-10-26', time: '09:00', status: 'confirmed' },
    { id: 'follow-up', title: 'Mock customer follow-up', date: '2026-10-26', time: '14:30', status: 'pending' },
    { id: 'lesson', title: 'Mock science lesson', date: '2026-10-28', time: '10:00', status: 'scheduled' },
    { id: 'deadline', title: 'Mock month-end preparation', date: '2026-10-30', status: 'tentative' },
    { id: 'boundary', title: 'Mock next-month meeting', date: '2026-11-01', time: '11:00', status: 'cancelled' }
  ];
  let locale = 'en-GB';
  let view = 'month';
  let empty = false;
  let current;
  const slot = element('div', { className: 'ds-calendar-demo' });
  const feedback = statusMessage('Mock data. Select a date or event; records remain in this browser session.');
  page.preview.append(slot, feedback);
  function update() {
    const date = current?.getDate() || '2026-10-26';
    current?.destroy();
    current = createCalendar({ date, view, locale, events: empty ? [] : mockEvents, onSelectDate: value => { feedback.textContent = `Mock selected date: ${value}.`; }, onSelectEvent: event => { feedback.textContent = `Mock event selected: ${event.title} · ${event.date}${event.time ? ` at ${event.time}` : ', all day'}.`; } });
    slot.replaceChildren(current.element);
    page.setSnippet(`const calendar = createCalendar({ date: ${JSON.stringify(date)}, view: ${JSON.stringify(view)}, locale: ${JSON.stringify(locale)}, events: ${JSON.stringify(empty ? [] : mockEvents)} });\ncontainer.append(calendar.element);`);
  }
  page.controls.append(
    choiceControl('Initial view', view, [{ value: 'month', label: 'Month' }, { value: 'week', label: 'Week' }], value => { view = value; update(); }),
    choiceControl('Locale / first weekday', locale, [{ value: 'en-GB', label: 'English (UK) · Monday' }, { value: 'en-US', label: 'English (US) · Sunday' }, { value: 'ar-EG', label: 'Arabic (Egypt) · Saturday' }], value => { locale = value; update(); }),
    toggleControl('Empty events', false, value => { empty = value; update(); })
  );
  page.states.append(statePreview('Empty mock date', createCalendar().element), statePreview('Mock week across a month boundary', createCalendar({ date: '2026-10-31', view: 'week', events: mockEvents }).element));
  update();
}
