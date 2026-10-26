import { element, uniqueId, playground, button, toggleControl } from './playground.js';

export function createFormField({ label, control, hint = '', error = '', required = false }) {
  const target = control.matches('input, textarea, button, [role="combobox"], [role="spinbutton"]') ? control : control.querySelector('input, textarea, button, [role="combobox"], [role="spinbutton"]');
  if (!target) throw new TypeError('FormField requires a focusable form control.');
  target.id ||= uniqueId('field');
  const hintNode = element('small', { id: uniqueId('field-hint') }, hint);
  const errorNode = element('small', { id: uniqueId('field-error'), className: 'component-error', 'aria-live': 'polite' });
  const originalDescriptions = (target.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
  const labelNode = element('label', { for: target.id }, label, required ? element('span', {}, ' (required)') : null);
  if (target.classList.contains('ds-select-trigger')) {
    labelNode.id = uniqueId('field-label');
    target.setAttribute('aria-labelledby', `${labelNode.id} ${target.id}-value`);
  }
  if (required) { target.setAttribute('aria-required', 'true'); if ('required' in target) target.required = true; }
  const root = element('div', { className: 'ds-form-field' }, labelNode, control, hintNode, errorNode);
  function setError(message = '') {
    errorNode.textContent = message;
    errorNode.hidden = !message;
    hintNode.hidden = !hint;
    target.setAttribute('aria-invalid', String(Boolean(message)));
    const ids = [...originalDescriptions, ...(hint ? [hintNode.id] : []), ...(message ? [errorNode.id] : [])];
    if (ids.length) target.setAttribute('aria-describedby', [...new Set(ids)].join(' '));
    else target.removeAttribute('aria-describedby');
  }
  setError(error);
  return { element: root, setError };
}

export const guide = {
  purpose: 'Associate a persistent label, hint and validation error with a real form control.',
  props: ['createFormField({label, control, hint, error, required}) returns {element, setError(message)}. Existing description IDs are preserved.'],
  variants: ['Optional or required; hint and error.'], states: ['Default, required, invalid, disabled through the control.'],
  keyboard: ['Label activation focuses the control; native control keyboard behaviour is unchanged.'],
  accessibility: ['Label for/id association, aria-required, aria-invalid and merged aria-describedby IDs. Errors are announced politely.'],
  tokens: ['--space-2, --text, --muted, --danger-text'], responsive: ['Full-width control; underlying inputs retain 16px phone text and 44px targets.'],
  do: ['Pass an actual input or a component containing its labelled control.'], dont: ['Do not replace a label with placeholder text.'],
  example: 'const field = createFormField({label: "Name", control: input, hint: "Mock customer", required: true});\nfield.setError("Enter a name.");'
};

export function render(container) {
  const page = playground(container, { title: 'FormField', description: 'A mock customer field with working required validation.' });
  const input = element('input', { className: 'ds-input', type: 'text' });
  const field = createFormField({ label: 'Mock customer name', control: input, hint: 'Enter a name before validating.', required: true });
  page.preview.append(field.element, button('Validate mock field', () => field.setError(input.value.trim() ? '' : 'Enter a customer name.')));
  page.controls.append(toggleControl('Disabled', false, value => { input.disabled = value; }));
  page.states.append(element('p', {}, 'Empty validation displays an associated inline error; typing preserves your value.'));
  page.setSnippet(guide.example);
}
