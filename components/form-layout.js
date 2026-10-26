import { element, playground, toggleControl, statePreview, button, statusMessage, uniqueId } from './playground.js';
import { createCard } from './card.js';
import { createBadge } from './badge.js';
import { createAlert } from './alert.js';
import { createFormField } from './form-field.js';
import { createFormSection } from './form-section.js';

export function createFormLayout({ header, notice, sections, actions, className = '' } = {}) {
  const root = element('div', { className: `ds-form-layout${className ? ` ${className}` : ''}` });
  for (const [name, value] of Object.entries({ header, notice, sections, actions })) {
    if (value === undefined || value === null) continue;
    root.append(element('div', { className: `ds-form-layout-${name}`, 'data-layout-slot': name }, ...(Array.isArray(value) ? value.flat(Infinity) : [value]).filter(node => node !== undefined && node !== null)));
  }
  return root;
}

export function demo(container, { showNotice = true } = {}) {
  const formId = uniqueId('layout-mock-form');
  const name = element('input', { className: 'ds-input', name: 'name', value: 'Alex Chen', autocomplete: 'off' });
  const email = element('input', { className: 'ds-input', type: 'email', name: 'email', value: 'alex@example.com', autocomplete: 'off' });
  const nameField = createFormField({ label: 'Contact name', control: name, required: true, hint: 'Mock contact; do not enter personal data.' });
  const emailField = createFormField({ label: 'Email address', control: email, required: true });
  const feedback = statusMessage('Mock contact is ready to edit. Nothing is sent to a server.');
  let saved = { name: name.value, email: email.value };
  function save(event) {
    event.preventDefault();
    const nameError = name.value.trim() ? '' : 'Enter a contact name.';
    const emailError = email.validity.valid && email.value.trim() ? '' : 'Enter a valid email address.';
    nameField.setError(nameError); emailField.setError(emailError);
    if (nameError || emailError) { feedback.textContent = 'Correct the highlighted mock fields before saving.'; (nameError ? name : email).focus(); return; }
    saved = { name: name.value.trim(), email: email.value.trim() };
    name.value = saved.name; email.value = saved.email;
    feedback.textContent = `${saved.name} saved in this mock example only. No server writes.`;
  }
  const form = element('form', { id: formId, novalidate: true, onsubmit: save },
    createFormSection({ title: 'Contact details', description: 'Related fields use canonical FormField labels and errors.', content: nameField.element }),
    createFormSection({ title: 'Communication', description: 'Example contact preferences for a mock customer.', content: emailField.element }));
  form.addEventListener('input', () => { feedback.textContent = 'Unsaved mock changes. Save or reset the example.'; nameField.setError(''); emailField.setError(''); });
  const reset = button('Reset changes', () => { name.value = saved.name; email.value = saved.email; nameField.setError(''); emailField.setError(''); feedback.textContent = 'Mock fields restored to the last saved values.'; });
  const layout = createFormLayout({
    header: createCard({ title: 'Edit contact', description: 'Sections and a sticky action bar composed from shared components.', actions: createBadge({ label: 'Mock form', tone: 'info' }) }),
    notice: showNotice ? createAlert({ title: 'Local demonstration', message: 'Save validates and updates this example only. No personal data is required.', tone: 'info' }) : undefined,
    sections: form,
    actions: [feedback, reset, button('Save mock contact', null, 'primary', { type: 'submit', form: formId })]
  });
  container?.append(layout); return layout;
}

export function render(container) {
  const page = playground(container, { title: 'FormLayout', description: 'Named sections with a sticky action slot. The template preserves the caller’s real form and submit behavior.' });
  function update(showNotice = true) { page.preview.replaceChildren(demo(undefined, { showNotice })); page.setSnippet(guide.example); }
  page.controls.append(toggleControl('Notice slot', true, update));
  page.states.append(statePreview('Read-only composition without actions', createFormLayout({ sections: createFormSection({ title: 'Mock contact', content: createBadge({ label: 'Read only', tone: 'neutral' }) }) })));
  update();
}

export const guide = {
  purpose: 'Structure a sectioned form with optional guidance and a solid sticky action bar without replacing native form semantics.',
  props: ['createFormLayout({header, notice, sections, actions, className}) returns a DOM div, not a form.', 'Every slot accepts a DOM node or arrays of nodes; null and undefined omit the slot. Existing nodes, listeners and classes are preserved.', 'header is the page heading; notice holds shared Alert feedback; sections holds shared FormSection nodes or an existing form containing them; actions holds status and action nodes.', 'If actions are outside the supplied form, associate submit buttons with its id using the native form attribute, as in the live example.', 'className appends caller classes. Direct root wrappers expose data-layout-slot and ds-form-layout-<slot>. --form-action-offset can override the sticky bottom offset for the host shell.'],
  variants: ['Sectioned editable form; optional notice; read-only sections without actions.'],
  states: ['Editing, inline invalid fields, saved locally, reset to last saved values. All example values and save effects are mock.'],
  keyboard: ['The layout adds no tab stops; fields and buttons remain in source order.', 'Enter submits the associated native form; Tab reaches sticky actions normally, without a separate focus trap.'],
  accessibility: ['Compose persistent FormField labels, descriptions and errors with named FormSections.', 'Retain one real form owner and associate external submit buttons explicitly. The layout adds no misleading form or dialog roles.'],
  tokens: ['--space-2, --space-3, --space-4, --space-6, --space-12, --surface, --text, --color-border-subtle, --radius-lg, --shadow-sm.'],
  responsive: ['Sections shrink to available width. Actions wrap instead of overflowing.', 'The sticky action bar uses a solid surface; on phones its default bottom offset clears the shell bottom navigation and safe area. Host shells may override --form-action-offset.'],
  do: ['Keep existing native form submission and compose canonical FormSection, FormField and Button nodes.', 'Keep validation next to the relevant field and place a brief status in the actions slot.'],
  dont: ['Do not nest forms or clone fields when adapting an existing screen.', 'Do not put the actions in a fixed overlay detached from the form reading order.'],
  example: 'form.id = "customer-edit";\nsaveButton.type = "submit";\nsaveButton.setAttribute("form", form.id);\ncontainer.append(createFormLayout({\n  header: heading, notice: informationAlert, sections: form,\n  actions: [saveStatus, cancelButton, saveButton], className: "customer-form"\n}));'
};
