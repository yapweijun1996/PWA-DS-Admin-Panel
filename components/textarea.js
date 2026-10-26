import { element, uniqueId, playground, toggleControl, textControl } from './playground.js';
import { createFormField } from './form-field.js';

export function createTextarea({ label = 'Notes', value = '', maxLength = 500, rows = 4, required = false, disabled = false, hint = '', onChange = () => {} } = {}) {
  const counter = element('small', { id: uniqueId('textarea-counter'), className: 'ds-textarea-counter', 'aria-live': 'polite', 'aria-atomic': 'true' });
  const input = element('textarea', { className: 'ds-input ds-textarea', rows, required, disabled, maxlength: maxLength, 'aria-describedby': counter.id });
  input.value = value;
  input.required = required;
  const field = createFormField({ label, control: input, hint, required });
  field.element.append(counter);
  function refresh() { counter.textContent = `${input.value.length}${maxLength == null ? '' : ` / ${maxLength}`} characters`; }
  input.addEventListener('input', () => { refresh(); onChange(input.value); });
  refresh();
  return { element: field.element, input, get value() { return input.value; }, setValue(next) { input.value = String(next ?? ''); refresh(); }, setError: field.setError, setDisabled(next) { input.disabled = next; } };
}
export const guide = {
  purpose: 'Collect multiline text with a visible character count and optional maximum.',
  props: ['createTextarea({label,value,maxLength=500,rows=4,required,disabled,hint,onChange}) returns element, input, value, setValue, setError and setDisabled. Set maxLength:null for an unlimited counter.'],
  variants: ['Limited or unlimited text; optional or required.'], states: ['Empty, editing, at limit, disabled, invalid.'],
  keyboard: ['Native multiline editing; Enter inserts a newline and Tab moves to the next control.'],
  accessibility: ['Persistent FormField label and error association; counter is an associated polite live region. Character limits follow native UTF-16 maxlength semantics.'],
  tokens: ['--space-2, --muted, --border, --surface'], responsive: ['Vertically resizable, full width, minimum 16px input font on phones.'],
  do: ['Explain the expected content and provide a reasonable limit.'], dont: ['Do not silently truncate programmatic values or use Enter to submit.'],
  example: 'createTextarea({label: "Mock notes", maxLength: 280, onChange: value => console.log(value)})'
};
export function render(container) {
  const page = playground(container, {title: 'Textarea', description: 'Editable mock notes with a live character counter.'});
  const control = createTextarea({label: 'Mock notes', maxLength: 280, hint: 'No notes are sent to a server.'});
  page.preview.append(control.element);
  page.controls.append(toggleControl('Disabled', false, value => control.setDisabled(value)), toggleControl('Show error', false, value => control.setError(value ? 'Please revise these mock notes.' : '')), textControl('Value', '', value => control.setValue(value)));
  page.states.append(createTextarea({label: 'Disabled example', value: 'Read-only mock sample', disabled: true}).element);
  page.setSnippet(guide.example);
}
