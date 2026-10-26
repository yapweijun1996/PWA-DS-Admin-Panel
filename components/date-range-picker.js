import { createDateControl } from './date-picker.js';
import { getWeekday } from '../js/logic/date.js';
import { element, playground, choiceControl, toggleControl, textControl, statePreview, statusMessage } from './playground.js';

export function createDateRangePicker(options = {}) {
  return createDateControl({ label: 'Date range', ...options }, true);
}

export const guide = {
  purpose: 'Select an inclusive, continuous date range while preventing unavailable endpoints and disabled intervening dates.',
  props: ['createDateRangePicker({label, value:{start,end}, locale, weekStartsOn, min, max, disabledDates, disabled, required, clearable, hint, error, name, placeholder, initialMonth, onChange}) returns element, trigger, value, setValue, setDisabled, open, close and destroy.', 'start/end are ISO YYYY-MM-DD strings or null. onChange receives {start,end:null} after the first selection and {start,end} after completion. Choosing an earlier end sorts the endpoints. A completed selection starts a new range on the next choice.', 'setValue is silent; false means the range was rejected without mutation. Disabled dates accept an array, Set or predicate. With name, hidden inputs use name-start and name-end.'],
  variants: ['Continuous inclusive date range; optional required field; locale week start or explicit weekStartsOn; shared calendar trigger icon from DatePicker.'],
  states: ['Empty, awaiting end date, completed range, today, focused, unavailable day, rejected crossing, disabled field and error.'],
  keyboard: ['Enter/Space or Up/Down opens. Arrows move by day/week; Home/End move to locale week boundaries; Page Up/Down moves by month; Shift + Page Up/Down moves by year. Enter/Space selects the start, then the end.', 'One roving day is tabbable. Unavailable days remain discoverable but cannot be chosen. Escape/Close returns focus to the field; Tab stays within the shared modal. Escape preserves a partially chosen start so it can be completed later.'],
  accessibility: ['The shared DatePicker calendar uses a named modal, grid/row/gridcell semantics, aria-multiselectable, selected-range aria-selected and aria-current=date for today.', 'Readable visible range, full-date start/end names and live instructions do not rely on colour. Rejected ranges announce the disabled intervening-date reason without losing the start.'],
  tokens: ['DatePicker tokens: --surface, --text, --muted, --accent, --accent-text, --accent-soft, --accent-contrast, --focus-ring, --space-1 through --space-4 and --radius.'],
  responsive: ['The same single-month calendar is used at every width; it can span any number of months via navigation. Trigger text wraps rather than overflowing; day targets stay at least 44px and phone text 16px.'],
  do: ['Use continuous ranges only when every included day is available.', 'Label the domain meaning and document inclusive bounds and unavailable periods in a hint.'],
  dont: ['Do not silently skip disabled days inside a continuous range.', 'Do not use a range picker for two unrelated dates or for date-and-time scheduling.'],
  example: 'const period = createDateRangePicker({ label: "Report period", value: { start: "2026-10-26", end: "2026-10-30" }, locale: "en-GB", disabledDates: ["2026-11-04"], onChange: range => console.log(range) });\ncontainer.append(period.element);'
};

export function render(container) {
  const page = playground(container, { title: 'DateRangePicker', description: 'Select a start and end with the shared DatePicker calendar. Mock reporting availability is local; disabled dates cannot be crossed.' });
  const props = { label: 'Mock report period', value: { start: '2026-10-26', end: '2026-10-30' }, locale: 'en-GB', initialMonth: '2026-10-26', min: '2026-10-01', max: '2026-12-31', disabled: false, required: false, error: '' };
  let blockWeekends = false;
  let blockDay = true;
  let current;
  const slot = element('div', { className: 'ds-date-picker-demo' });
  const feedback = statusMessage('Mock data. November 4 is initially unavailable. Try October 30 through November 6 to hear the range rejection.');
  page.preview.append(slot, feedback);
  function update() {
    current?.destroy();
    current = createDateRangePicker({ ...props, disabledDates: date => (blockDay && date === '2026-11-04') || (blockWeekends && [0, 6].includes(getWeekday(date))), hint: `Mock availability: October–December 2026.${blockDay ? ' November 4 is unavailable.' : ''}${blockWeekends ? ' Weekends are unavailable.' : ''} Ranges include both endpoints.`, onChange: value => {
      props.value = value;
      feedback.textContent = value.start ? `Mock report period: ${value.start}${value.end ? ` through ${value.end}, inclusive.` : '; choose an end date.'}` : 'Mock report period cleared.';
    } });
    slot.replaceChildren(current.element);
    page.setSnippet(`const period = createDateRangePicker({ label: ${JSON.stringify(props.label)}, value: ${JSON.stringify(current.value)}, locale: ${JSON.stringify(props.locale)}, min: ${JSON.stringify(props.min)}, max: ${JSON.stringify(props.max)} });\ncontainer.append(period.element);`);
  }
  page.controls.append(textControl('Field label', props.label, value => { props.label = value; update(); }), choiceControl('Locale / week start', props.locale, [{ value: 'en-GB', label: 'English (UK) · Monday' }, { value: 'en-US', label: 'English (US) · Sunday' }, { value: 'de-DE', label: 'German · Monday' }, { value: 'ar-EG', label: 'Arabic (Egypt) · Saturday' }], value => { props.locale = value; update(); }), toggleControl('Disable November 4 (mock)', true, value => { blockDay = value; update(); }), toggleControl('Disable weekends (mock)', false, value => { blockWeekends = value; update(); }), toggleControl('Disabled', false, value => { props.disabled = value; update(); }), toggleControl('Required', false, value => { props.required = value; update(); }), toggleControl('Error', false, value => { props.error = value ? 'Confirm the mock reporting interval.' : ''; update(); }));
  for (const [state, options] of [['Empty', {}], ['Start selected', { value: { start: '2026-10-26', end: null } }], ['Completed', { value: { start: '2026-10-26', end: '2026-10-30' } }], ['Disabled', { disabled: true }], ['Error', { error: 'Choose a mock reporting interval.' }]]) {
    const example = createDateRangePicker({ label: `${state} mock range`, initialMonth: '2026-10-26', ...options });
    page.states.append(statePreview(state, example.element));
  }
  update();
}
