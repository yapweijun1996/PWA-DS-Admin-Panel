import { element, uniqueId, playground, toggleControl, statusMessage } from './playground.js';

export function createRadioGroup({label = 'Choose one', name = uniqueId('radio'), options = [], value = '', required = false, disabled = false, onChange = () => {}} = {}) {
  const hintId = uniqueId('radio-error');
  const error = element('small', {id: hintId, className: 'component-error', 'aria-live': 'polite', hidden: true});
  const root = element('fieldset', {className: 'ds-radio-group', disabled}, element('legend', {}, label, required ? ' (required)' : '' ));
  const inputs = options.map(option => {
    const input = element('input', {type: 'radio', className: 'ds-radio', name, value: option.value, checked: option.value === value, required, disabled: option.disabled, 'aria-describedby': hintId});
    input.addEventListener('change', () => { if (input.checked) { setError(''); onChange(input.value); } });
    input.required = required;
    root.append(element('label', {className: 'ds-radio-option'}, input, element('span', {}, option.label)));
    return input;
  });
  root.append(error);
  function setError(message = '') { error.textContent = message; error.hidden = !message; for (const input of inputs) input.setAttribute('aria-invalid', String(Boolean(message))); }
  return {element: root, inputs, get value() { return inputs.find(input => input.checked)?.value ?? ''; }, setValue(next) { inputs.forEach(input => { input.checked = input.value === next; }); }, setError, setDisabled(next) { root.disabled = next; }};
}
export const guide = {
  purpose: 'Choose exactly one item from a short visible set of mutually exclusive options.',
  props: ['createRadioGroup({label,name,options:[{value,label,disabled}],value,required,disabled,onChange}) returns element,inputs,value,setValue,setError,setDisabled.'],
  variants: ['Optional or required; individual disabled options.'], states: ['Unselected, selected, focused, disabled, invalid.'],
  keyboard: ['Native radio behaviour: Tab enters/leaves the group; arrows move/select enabled options; Space selects.'],
  accessibility: ['Native fieldset/legend and same-name radio semantics; labels have 44px targets; errors are linked to every option.'],
  tokens: ['--space-2, --border, --accent, --focus-ring'], responsive: ['Options stack with wrapping labels and 44px touch targets.'],
  do: ['Keep all short choices visible.'], dont: ['Do not use radios for independent boolean choices.'],
  example: 'createRadioGroup({label: "Mock plan", value: "team", options: [{value:"team",label:"Team"},{value:"business",label:"Business"}]})'
};
export function render(container) {
  const page = playground(container, {title:'RadioGroup', description:'A real keyboard-operable mock plan choice.'});
  const status = statusMessage('Mock plan: team');
  const control = createRadioGroup({label:'Mock plan', value:'team', options:[{value:'team',label:'Team'},{value:'business',label:'Business'},{value:'custom',label:'Custom plan (unavailable)',disabled:true}], onChange:value => { status.textContent = `Mock plan: ${value}`; }});
  page.preview.append(control.element,status);
  page.controls.append(toggleControl('Disabled',false,value => control.setDisabled(value)),toggleControl('Error',false,value => control.setError(value ? 'Choose an available mock plan.' : '')));
  page.states.append(createRadioGroup({label:'Unselected',options:[{value:'yes',label:'Yes'},{value:'no',label:'No'}]}).element);
  page.setSnippet(guide.example);
}
