import { element, button, playground, statusMessage, openModal, textControl, onDetach } from './playground.js';

export function createUnsavedChangesGuard({ isDirty, onSave, onDiscard, title = 'Unsaved changes', description = 'Save your changes, discard them, or keep editing.' }) {
  let destroyed = false;
  let pending;
  let settle;
  let dialog;
  let busy = false;
  function finish(allowed) {
    const complete = settle;
    settle = undefined; pending = undefined;
    const current = dialog; dialog = undefined;
    current?.close();
    complete?.(allowed);
  }
  function resolve() {
    if (destroyed) return Promise.resolve(false);
    if (pending) return pending;
    if (!isDirty()) return Promise.resolve(true);
    pending = new Promise(complete => { settle = complete; });
    const result = pending;
    const error = element('p', { className: 'ds-unsaved-guard-error', role: 'alert' });
    async function act(callback) {
      if (busy || destroyed) return;
      busy = true;
      error.textContent = '';
      const current = dialog;
      current.element.setAttribute('aria-busy', 'true');
      const buttons = [...current.element.querySelectorAll('button')];
      buttons.forEach(control => { control.disabled = true; });
      try {
        const returned = callback?.();
        const value = returned && typeof returned.then === 'function' ? await returned : returned;
        if (!destroyed && dialog === current) finish(value !== false && !isDirty());
      } catch (failure) {
        if (!destroyed && dialog === current) error.textContent = failure instanceof Error ? failure.message : 'Changes could not be resolved. Keep editing or try again.';
      } finally {
        busy = false;
        if (!destroyed && dialog === current) { current.element.removeAttribute('aria-busy'); buttons.forEach(control => { control.disabled = false; }); }
      }
    }
    dialog = openModal({ title, content: element('div', { className: 'ds-unsaved-guard-message' }, element('p', {}, description), error), onClose: () => finish(false), actions: [
      { label: 'Keep editing', onClick: () => finish(false) },
      { label: 'Discard changes', variant: 'danger', onClick: () => act(onDiscard) },
      { label: 'Save changes', variant: 'primary', onClick: () => act(onSave) }
    ] });
    return result;
  }
  function request(event) { if (!destroyed && isDirty() && Array.isArray(event.detail?.handlers)) event.detail.handlers.push(resolve); }
  function beforeUnload(event) { if (!destroyed && isDirty()) { event.preventDefault(); event.returnValue = ''; } }
  function destroy() {
    if (destroyed) return;
    destroyed = true;
    window.removeEventListener('app:resolve-dirty', request);
    window.removeEventListener('beforeunload', beforeUnload);
    finish(false);
  }
  window.addEventListener('app:resolve-dirty', request);
  window.addEventListener('beforeunload', beforeUnload);
  return { resolve, destroy };
}

export const guide = {
  purpose: 'Protect dirty edits with one reusable Save / Discard / Keep editing decision before navigation or browser unload.',
  props: ['createUnsavedChangesGuard({isDirty,onSave,onDiscard,title,description}) returns resolve():Promise<boolean> and destroy(). Callbacks may be async; false blocks navigation. A successful callback must clear isDirty. Destroy settles any outstanding decision false.'],
  variants: ['App navigation decision dialog and native browser-unload warning.'], states: ['Clean, dirty, awaiting decision, saving/discarding, callback error, destroyed.'],
  keyboard: ['Tab/Shift+Tab remain inside the dialog; Escape keeps editing; Enter/Space activates the focused decision.'],
  accessibility: ['Shared Modal traps and restores focus, names the dialog and announces callback failures; busy actions disable duplicate activation.'],
  tokens: ['--space-3, --danger-text'], responsive: ['Shared Modal fits phone viewport; decision buttons wrap with 44px phone targets.'],
  do: ['Register once per editing owner and destroy when the owner is removed; invoke resolve before leaving. app:resolve-dirty accepts detail.handlers.'],
  dont: ['Do not assume the browser allows custom text or asynchronous work in beforeunload.'],
  example: 'const guard = createUnsavedChangesGuard({isDirty: () => draft !== saved, onSave: () => { saved = draft; }, onDiscard: () => { draft = saved; }});\nif (await guard.resolve()) leaveEditor();\n// On owner teardown: guard.destroy();'
};
export function render(container) {
  const page = playground(container, { title: 'UnsavedChangesGuard', description: 'Edit a mock project name and try leaving. Save and discard affect this local example only.' });
  let saved = 'Mock customer workspace';
  let draft = saved;
  const feedback = statusMessage('All mock changes saved.');
  let input;
  function sync() { input.value = draft; feedback.textContent = draft === saved ? `Saved mock name: ${saved}` : 'Unsaved mock changes. Leaving will ask for a decision.'; }
  const field = textControl('Mock project name', draft, value => { draft = value; sync(); });
  input = field.querySelector('input');
  const guard = createUnsavedChangesGuard({ isDirty: () => draft !== saved, onSave: () => {
    if (!draft.trim()) throw new Error('Enter a mock project name before saving.');
    saved = draft.trim(); draft = saved; sync();
  }, onDiscard: () => { draft = saved; sync(); }, description: 'Save this mock project name, discard edits, or keep editing. Nothing is sent to a server.' });
  page.preview.append(element('div', { className: 'ds-unsaved-guard-demo' }, field, button('Try leaving mock editor', async () => { const allowed = await guard.resolve(); feedback.textContent = allowed ? 'Leaving allowed. The mock editor remains here for another try.' : 'Stayed in the mock editor.'; }), feedback));
  page.controls.append(button('Make a mock edit', () => { draft = `${saved} (edited)`; sync(); input.focus(); }));
  page.states.append(element('p', {}, 'Clean resolves immediately. Dirty opens a decision. Failed save stays blocked. Destroyed guards resolve false.'));
  page.setSnippet(guide.example);
  onDetach(page.section, guard.destroy);
}
