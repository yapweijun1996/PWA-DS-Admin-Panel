import { element, button, playground, toggleControl, statusMessage } from './playground.js';
import { createFormField } from './form-field.js';
import { parseNumber, normalizeNumber, stepNumber, validateNumber } from '../js/logic/number.js';

export function createNumberInput({ label = 'Quantity', value = null, min, max, step = 1, precision, disabled = false, required = false, hint = '', onChange = () => {} } = {}) {
  const options = { min, max, step, precision };
  const input = element('input', { type: 'text', inputmode: precision === 0 ? 'numeric' : 'decimal', className: 'ds-input', role: 'spinbutton', 'aria-valuemin': min, 'aria-valuemax': max, disabled, required });
  const minus = button(element('span', { 'aria-hidden': 'true' }, '−'), () => adjust(-1), 'secondary', { 'aria-label': `Decrease ${label}`, disabled });
  input.required = required;
  const plus = button(element('span', { 'aria-hidden': 'true' }, '+'), () => adjust(1), 'secondary', { 'aria-label': `Increase ${label}`, disabled });
  const root = element('div', { className: 'ds-number-input' }, minus, input, plus);
  const field = createFormField({ label, control: input, hint: hint || `Step ${step}${min === undefined ? '' : `; minimum ${min}`}${max === undefined ? '' : `; maximum ${max}`}${precision === undefined ? '' : `; ${precision} decimal places`}.`, required });
  input.replaceWith(root); root.append(input, plus);
  function sync() {
    const number = parseNumber(input.value);
    if (number === null) input.removeAttribute('aria-valuenow'); else input.setAttribute('aria-valuenow', number);
    minus.disabled = disabled || (number !== null && min !== undefined && number <= min);
    plus.disabled = disabled || (number !== null && max !== undefined && number >= max);
  }
  function setValue(next) { const number = normalizeNumber(next, options); input.value = number === null ? '' : String(number); sync(); }
  function validate() {
    const reason = !input.value.trim() && !required ? null : validateNumber(input.value, options);
    const messages = { number: 'Enter a valid number.', min: `Minimum is ${min}.`, max: `Maximum is ${max}.`, step: `Use increments of ${step} from ${min ?? 0}.`, precision: `Use at most ${precision} decimal places.` };
    field.setError(reason ? messages[reason] : '');
    return !reason;
  }
  function adjust(direction) { setValue(stepNumber(input.value, direction, options)); validate(); onChange(parseNumber(input.value)); }
  input.addEventListener('input', () => { sync(); field.setError(''); onChange(parseNumber(input.value)); });
  input.addEventListener('blur', validate);
  input.addEventListener('keydown', event => { if (event.key === 'ArrowUp' || event.key === 'ArrowDown') { event.preventDefault(); adjust(event.key === 'ArrowUp' ? 1 : -1); } });
  setValue(value);
  return { element: field.element, input, get value() { return parseNumber(input.value); }, setValue, validate, setError: field.setError, setDisabled(next) { disabled = Boolean(next); input.disabled = disabled; sync(); } };
}
export const guide = {
  purpose: 'Enter bounded numeric values with precise step controls and inline validation.',
  props: ['createNumberInput({label,value,min,max,step=1,precision,disabled,required,hint,onChange}) returns element,input,value,setValue,validate,setError,setDisabled. setValue rounds/clamps using shared number logic; typed invalid values remain visible.'],
  variants: ['Integer or decimal, bounded or unbounded.'], states: ['Empty, valid, invalid, minimum, maximum, disabled.'],
  keyboard: ['Arrow Up/Down steps; Tab reaches decrement, input and increment; native text editing remains available.'],
  accessibility: ['Spinbutton exposes current value and bounds; named step buttons and FormField error descriptions.'],
  tokens: ['--space-2, --border, --surface, --text'], responsive: ['44px buttons and input, 16px phone input; flexible input shrinks without overflow.'],
  do: ['Use precision and step appropriate to the quantity.'], dont: ['Do not silently replace invalid typed text with zero.'],
  example: 'createNumberInput({label: "Mock quantity", min: 0, max: 10, step: 0.25, precision: 2, value: 1.5})'
};
export function render(container) {
  const page = playground(container, {title: 'NumberInput', description: 'Mock quantity bounded from 0 to 10 in precise quarter steps.'});
  const status = statusMessage('Mock quantity: 1.5');
  const control = createNumberInput({label: 'Mock quantity', min: 0, max: 10, step: 0.25, precision: 2, value: 1.5, onChange: value => { status.textContent = `Mock quantity: ${value ?? 'empty or invalid'}`; }});
  page.preview.append(control.element, status);
  page.controls.append(toggleControl('Disabled', false, value => control.setDisabled(value)), button('Validate', () => control.validate()));
  page.states.append(createNumberInput({label: 'At maximum', min: 0, max: 5, value: 5}).element);
  page.setSnippet(guide.example);
}
