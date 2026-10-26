import { element, playground, textControl, toggleControl, statusMessage } from './playground.js';
import { createEmptyState } from './empty-state.js';
export const guide = {
  purpose: 'Explain why content is unavailable and offer an authorized route to request access.',
  props: ['createPermissionState({title,description,permission,actionLabel,onRequestAccess}) returns an element; permission is descriptive only and is not authorization enforcement.'],
  variants: ['Explanation only or request-access action.'], states: ['Restricted access and request submitted by the consumer.'],
  keyboard: ['Optional Request access button supports Tab and Enter/Space.'],
  accessibility: ['A visible heading and reason communicate access restrictions without color alone.'],
  tokens: ['Shared EmptyState spacing, surface and muted text tokens.'], responsive: ['Permission names wrap; action target is at least 44px.'],
  do: ['Explain which permission is needed and provide a legitimate next step.'], dont: ['Do not treat a client-side permission display as a security boundary or imply that access was granted.'],
  example: 'createPermissionState({permission:"reports.read",onRequestAccess:requestAccess})'
};
export function createPermissionState({ title = 'Access restricted', description = 'Contact your workspace administrator to request access.', permission = '', actionLabel = 'Request access', onRequestAccess } = {}) {
  const root = createEmptyState({ title, description, actionLabel, onAction: onRequestAccess }); root.classList.add('ds-permission-state');
  if (permission) root.insertBefore(element('p', {className:'ds-permission-name'}, `Required permission: ${permission}`), root.querySelector('button'));
  return root;
}
export function render(container) {
  const page = playground(container, { title: 'PermissionState', description: guide.purpose }); let permission = 'reports.read'; let requestable = true;
  function update() {
    const feedback = statusMessage('Mock permissions only. No real access changes are made.');
    const view = createPermissionState({ title: 'Mock report access restricted', description: 'Your demonstration role cannot read this report.', permission, onRequestAccess: requestable ? () => { feedback.textContent = 'Mock access request recorded locally. Permission has not been granted.'; view.querySelector('button').disabled = true; } : undefined });
    page.preview.replaceChildren(element('div', {className:'component-demo-stack'}, view, feedback)); page.setSnippet('createPermissionState({ permission: "reports.read", onRequestAccess })');
  }
  page.controls.append(textControl('Required permission', permission, value => { permission = value; update(); }), toggleControl('Allow access request', requestable, value => { requestable = value; update(); })); update();
}
