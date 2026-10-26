import { element, button, playground, textControl, toggleControl } from './playground.js';
export const guide = {
  purpose: 'Explain an empty result and offer an appropriate next action.',
  props: ['createEmptyState({title,description,actionLabel,onAction,headingLevel=3}) returns an element; the action renders only when a callback is supplied. Set headingLevel (1–6) for the containing section.'],
  variants: ['Informational or actionable.'], states: ['No data and no matching results.'],
  keyboard: ['Tab focuses the optional action; Enter/Space activates.'], accessibility: ['Visible heading and description explain the state without relying on an illustration.'],
  tokens: ['--space-5, --muted, --surface, --color-border-subtle'], responsive: ['Copy wraps and actions retain 44px touch targets.'],
  do: ['Offer a useful action such as clearing filters.'], dont: ['Do not show an empty state while loading or when access is denied.'],
  example: 'createEmptyState({title:"No results",description:"Try clearing filters.",actionLabel:"Clear filters",onAction:clearFilters})'
};
export function createEmptyState({ title = 'No records yet', description = 'Add your first record to get started.', actionLabel = 'Add record', onAction, headingLevel = 3 } = {}) {
  return element('section', { className: 'ds-empty-state' }, element(`h${headingLevel}`, {}, title), element('p', {}, description), typeof onAction === 'function' ? button(actionLabel, onAction, 'primary') : null);
}
export function render(container) {
  const page = playground(container, { title: 'EmptyState', description: guide.purpose }); let title = 'No mock records yet'; let action = true;
  function update() { const view = createEmptyState({ title, description: 'Create a local demonstration record. Nothing is sent to a server.', actionLabel: 'Create mock record', onAction: action ? () => { page.preview.replaceChildren(element('p', {role:'status'}, 'Mock record created locally.'), button('Reset demo', update)); } : undefined }); page.preview.replaceChildren(view); page.setSnippet(view.outerHTML); }
  page.controls.append(textControl('Heading', title, value => { title = value; update(); }), toggleControl('Show action', action, value => { action = value; update(); })); update();
}
