import { loadingIndicator, playground, textControl, statePreview } from './playground.js';
export const guide = {
  purpose: 'Announce an indeterminate operation without inventing a progress percentage.',
  props: ['createSpinner({label="Loading"}) returns a status element using the existing ds-spinner styles.'],
  variants: ['Inline labeled spinner.'], states: ['Indeterminate loading.'], keyboard: ['No keyboard interaction or focus stop.'],
  accessibility: ['Visible status text names the work; the spinning mark is hidden from assistive technology.'],
  tokens: ['Shared ds-spinner currentColor and motion styles.'], responsive: ['Inline content wraps within its container.'],
  do: ['Use a specific label describing the pending work.'], dont: ['Do not use a spinner to claim determinate progress.'],
  example: 'createSpinner({label:"Loading invoices"})'
};
export function createSpinner({ label = 'Loading' } = {}) { const view = loadingIndicator(label); view.classList.add('ds-spinner-status'); return view; }
export function render(container) {
  const page = playground(container, { title: 'Spinner', description: guide.purpose });
  function update(label) { const view = createSpinner({ label }); page.preview.replaceChildren(view); page.setSnippet(view.outerHTML); }
  page.controls.append(textControl('Status label', 'Loading mock records', update)); page.states.append(statePreview('Inline', createSpinner({ label: 'Preparing mock preview' }))); update('Loading mock records');
}
