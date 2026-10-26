import { element, playground, button } from './playground.js';
import { createEmptyState } from './empty-state.js';
export const guide = {
  purpose: 'Explain a failed operation and provide a real retry action.',
  props: ['createErrorState({title,description,retryLabel,onRetry}) returns an element. onRetry may return a promise; rejection is announced and permits another retry.'],
  variants: ['Informational failure and retryable failure.'], states: ['Failed, retrying and retry failed.'],
  keyboard: ['Tab focuses Retry; Enter/Space retries; repeated activation is prevented during the pending promise.'],
  accessibility: ['Errors use an alert; retry progress is announced in a polite status region.'],
  tokens: ['Shared EmptyState and --danger-text.'], responsive: ['Error text wraps and Retry has a 44px target.'],
  do: ['Keep user data intact and make recovery specific.'], dont: ['Do not show success until the real retry operation succeeds.'],
  example: 'createErrorState({description:"Records could not load.",onRetry:reloadRecords})'
};
export function createErrorState({ title = 'Something went wrong', description = 'The operation could not be completed.', retryLabel = 'Retry', onRetry } = {}) {
  const feedback = element('p', { role: 'status', 'aria-live': 'polite' }); let busy = false;
  const root = createEmptyState({ title, description, actionLabel: retryLabel, onAction: typeof onRetry === 'function' ? retry : undefined }); root.classList.add('ds-error-state'); root.querySelector('p').setAttribute('role', 'alert'); root.append(feedback);
  async function retry() {
    if (busy) return; busy = true; const trigger = root.querySelector('button'); trigger.disabled = true; root.setAttribute('aria-busy', 'true'); feedback.textContent = 'Retrying…';
    try { await onRetry(); feedback.textContent = 'Retry completed.'; }
    catch (failure) { feedback.textContent = failure instanceof Error ? failure.message : 'Retry failed. Try again.'; }
    finally { busy = false; trigger.disabled = false; root.removeAttribute('aria-busy'); }
  }
  return root;
}
export function render(container) {
  const page = playground(container, { title: 'ErrorState', description: guide.purpose });
  function update() { const view = createErrorState({ title: 'Mock records could not load', description: 'This is a simulated failure. Retry loads local demonstration records.', onRetry: () => { page.preview.replaceChildren(element('div', {className:'component-demo-stack'}, element('p', {role:'status'}, 'Loaded two mock records: Invoice MOCK-1, Invoice MOCK-2.'), button('Simulate failure again', update))); } }); page.preview.replaceChildren(view); page.setSnippet('createErrorState({ title: "Records could not load", onRetry: reloadRecords })'); }
  update();
}
