import { element, button, playground, toggleControl, choiceControl, statusMessage, uniqueId, onDetach } from './playground.js';

export const MOCK_PERMISSIONS = Object.freeze([
  { id: 'customers.read', label: 'View customers', description: 'Read mock customer records.' },
  { id: 'customers.create', label: 'Create customers', description: 'Add mock customer records.' },
  { id: 'customers.edit', label: 'Edit customers', description: 'Change mock customer records.' },
  { id: 'customers.delete', label: 'Delete customers', description: 'Remove mock customer records after confirmation.' },
  { id: 'customers.export', label: 'Export customers', description: 'Download mock customer data.' }
].map(permission => Object.freeze(permission)));
const storageKey = 'forma-mock-permissions';
const defaults = MOCK_PERMISSIONS.filter(permission => permission.id !== 'customers.delete').map(permission => permission.id);
let permissions;
function normalize(value) { return [...new Set(value)].filter(id => MOCK_PERMISSIONS.some(permission => permission.id === id)); }
export function getMockPermissions() {
  if (permissions) return [...permissions];
  try { const stored = JSON.parse(localStorage.getItem(storageKey)); permissions = Array.isArray(stored) ? normalize(stored) : [...defaults]; }
  catch { permissions = [...defaults]; }
  return [...permissions];
}
export function setMockPermissions(next) {
  permissions = normalize(next);
  try { localStorage.setItem(storageKey, JSON.stringify(permissions)); } catch { /* Session-only permissions remain usable when storage is unavailable. */ }
  window.dispatchEvent(new CustomEvent('app:permissions-changed', { detail: { permissions: [...permissions] } }));
  return [...permissions];
}

export function createPermissionGate({ permission, content, mode = 'disable', reason = 'Your mock permission set does not allow this action.' } = {}) {
  const reasonId = uniqueId('permission-reason');
  const body = element('div', { className: 'ds-permission-gate-content' }, content);
  const explanation = element('p', { id: reasonId, className: 'ds-permission-gate-reason', role: 'status' });
  const root = element('div', { className: 'ds-permission-gate' }, body, explanation);
  const originals = new Map();
  let destroyed = false;
  function restore() {
    for (const [control, original] of originals) {
      control.disabled = original.disabled;
      if (original.description === null) control.removeAttribute('aria-describedby'); else control.setAttribute('aria-describedby', original.description);
    }
    originals.clear();
  }
  function refresh() {
    if (destroyed) return;
    restore();
    const allowed = getMockPermissions().includes(permission);
    root.dataset.allowed = String(allowed);
    body.hidden = !allowed && mode === 'hide';
    body.inert = !allowed;
    body.setAttribute('aria-disabled', String(!allowed));
    explanation.hidden = allowed;
    explanation.textContent = allowed ? '' : reason;
    if (!allowed && mode !== 'hide') {
      for (const control of body.querySelectorAll('button, input, textarea, fieldset')) {
        originals.set(control, { disabled: control.disabled, description: control.getAttribute('aria-describedby') });
        control.disabled = true;
        control.setAttribute('aria-describedby', `${control.getAttribute('aria-describedby') || ''} ${reasonId}`.trim());
      }
    }
  }
  function syncStorage(event) { if (event.key === storageKey || event.key === null) { permissions = undefined; refresh(); } }
  function destroy() {
    if (destroyed) return;
    destroyed = true;
    window.removeEventListener('app:permissions-changed', refresh);
    window.removeEventListener('storage', syncStorage);
    restore(); body.inert = false;
  }
  window.addEventListener('app:permissions-changed', refresh);
  window.addEventListener('storage', syncStorage);
  onDetach(root, destroy);
  refresh();
  return { element: root, refresh, destroy };
}

export const guide = {
  purpose: 'Hide or disable mock permission-aware actions and explain why an action is unavailable.',
  props: ['createPermissionGate({permission,content:Node,mode="disable",reason}) returns element,refresh,destroy. getMockPermissions() returns permission IDs; setMockPermissions(ids) persists and broadcasts app:permissions-changed; MOCK_PERMISSIONS lists setting labels and descriptions.'],
  variants: ['Disable keeps the control visible; hide removes the control while retaining the reason.'],
  states: ['Allowed, denied and disabled, denied and hidden; settings changes update existing gates.'],
  keyboard: ['Allowed controls keep their native keyboard behavior; denied controls are inert and cannot activate.'],
  accessibility: ['Visible reason text explains denial; disabled controls reference that text. The wrapper exposes aria-disabled.'],
  tokens: ['--space-2, --muted, --font-size-sm'], responsive: ['Content wraps; original shared buttons retain 44px phone targets.'],
  do: ['Label permission controls as mock and enforce authorization separately on a real server.'],
  dont: ['Do not treat browser-local permissions or hidden UI as a security boundary.'],
  example: 'createPermissionGate({permission: "customers.export", content: button("Export mock customers", exportRows), reason: "Enable Export customers in mock permissions."})'
};
export function render(container) {
  const page = playground(container, { title: 'PermissionGate', description: 'Mock permissions are browser-local settings, not real authorization. Toggle the permission to update the actual action.' });
  const feedback = statusMessage('This example never sends data to a server.');
  let mode = 'disable';
  let gate;
  const slot = element('div');
  function draw() { gate?.destroy(); gate = createPermissionGate({ permission: 'customers.export', mode, reason: 'Export customers is not enabled in your mock permission set.', content: button('Export mock record', () => { feedback.textContent = 'Mock export permitted. No server request was made.'; }, 'primary') }); slot.replaceChildren(gate.element); }
  const permissionToggle = toggleControl('Allow mock customer export', getMockPermissions().includes('customers.export'), value => setMockPermissions(value ? [...getMockPermissions(), 'customers.export'] : getMockPermissions().filter(id => id !== 'customers.export')));
  const sync = () => { permissionToggle.querySelector('input').checked = getMockPermissions().includes('customers.export'); };
  window.addEventListener('app:permissions-changed', sync);
  onDetach(page.section, () => { gate?.destroy(); window.removeEventListener('app:permissions-changed', sync); });
  page.preview.append(slot, feedback);
  page.controls.append(permissionToggle, choiceControl('Denied behavior', mode, [{ value: 'disable', label: 'Disable action' }, { value: 'hide', label: 'Hide action' }], value => { mode = value; draw(); }));
  page.states.append(element('p', {}, 'Allowed: interactive action. Denied: reason remains visible, even when the action is hidden.'));
  page.setSnippet(guide.example); draw();
}
