import { element, uniqueId, playground, textControl } from './playground.js';
import { createFormField } from './form-field.js';

export function createFormSection({ title, description = '', content = [], headingLevel = 3 }) {
  const id = uniqueId('form-section');
  return element('section', { className: 'ds-form-section', 'aria-labelledby': id },
    element('header', {}, element(`h${headingLevel}`, { id }, title), description ? element('p', {}, description) : null),
    element('div', { className: 'ds-form-section-content' }, ...(Array.isArray(content) ? content : [content])));
}
export const guide = {
  purpose: 'Group related fields into a named, readable form section.',
  props: ['createFormSection({title, description, content, headingLevel=3}) returns a section DOM node; content is a node or array of nodes. Set headingLevel (1–6) to follow the containing section.'],
  variants: ['With or without a description.'], states: ['Static section; controls retain their own states.'],
  keyboard: ['No additional tab stops; native document and field order is preserved.'],
  accessibility: ['A visible heading labels the semantic section through aria-labelledby.'],
  tokens: ['--space-4, --space-6, --border-subtle, --muted'], responsive: ['Fields stack in source order at all widths without fixed sizing.'],
  do: ['Use concise section headings and compose shared FormField controls.'], dont: ['Do not add decorative sections for every individual input.'],
  example: 'createFormSection({title: "Contact", description: "Mock customer", content: [nameField.element]})'
};
export function render(container) {
  const page = playground(container, { title: 'FormSection', description: 'Related editable mock contact fields.' });
  const section = createFormSection({ title: 'Mock contact details', description: 'Client-side demonstration; no data is sent.', content: [createFormField({label: 'Name', control: element('input', {className: 'ds-input', value: 'Alex Chen'})}).element, createFormField({label: 'Email', control: element('input', {className: 'ds-input', type: 'email', value: 'alex@example.com'})}).element] });
  page.preview.append(section);
  page.controls.append(textControl('Section title', 'Mock contact details', value => { section.querySelector('h3').textContent = value; }));
  page.states.append(element('p', {}, 'Heading and description are independent of field validation.'));
  page.setSnippet(guide.example);
}
