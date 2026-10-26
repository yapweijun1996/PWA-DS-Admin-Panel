import { element, playground, button, openModal, uniqueId, statusMessage, toggleControl } from './playground.js';
export const guide = {
  purpose: 'Ask for explicit confirmation before a consequential action, optionally requiring exact typed text.',
  props: ['openConfirmDialog({title,description,confirmLabel,cancelLabel,destructive,confirmationText,onConfirm,onClose}) returns the shared modal controller. onConfirm may return a promise; rejection keeps the dialog open with an error.'],
  variants: ['Standard and destructive; optional typed confirmation.'], states: ['Awaiting confirmation, invalid text, submitting and failure.'],
  keyboard: ['Initial focus is on Cancel; Tab stays in the modal; Escape cancels and focus returns to the opener. Enter submits only when confirmation text matches.'],
  accessibility: ['The shared Modal supplies focus trap, accessible title/description and focus return. Typed confirmation has a persistent label.'],
  tokens: ['Shared Modal, Button, Input and danger text tokens.'], responsive: ['Dialog fits small screens and retains 44px buttons.'],
  do: ['Name the destructive consequence and require a specific record identifier for dangerous actions.'], dont: ['Do not invoke the dangerous callback before explicit valid confirmation.'],
  example: 'openConfirmDialog({title:"Delete mock project?",destructive:true,confirmationText:"MOCK-42",onConfirm:removeProject})'
};
export function openConfirmDialog({ title = 'Confirm action', description = 'Please confirm before continuing.', confirmLabel = 'Confirm', cancelLabel = 'Cancel', destructive = false, confirmationText, onConfirm = () => {}, onClose } = {}) {
  const typed = confirmationText != null && String(confirmationText).length > 0; const expected = String(confirmationText ?? '');
  const id = uniqueId('confirm'); const error = element('p', { className: 'ds-confirm-error', role: 'alert' });
  const input = typed ? element('input', { id, className: 'ds-input', type: 'text', autocomplete: 'off', spellcheck: 'false', 'aria-describedby': `${id}-hint`, oninput: () => { confirm.disabled = input.value !== expected; error.textContent = ''; } }) : null;
  let busy = false;
  const content = element('form', { className: 'ds-confirm-dialog', onsubmit: event => { event.preventDefault(); submit(); } }, element('p', {}, description), typed ? element('div', { className: 'component-field' }, element('label', { for: id }, 'Confirmation text'), element('p', { id: `${id}-hint` }, `Type ${expected} exactly to continue.`), input) : null, error);
  const dialog = openModal({ title, content, actions: [{ label: cancelLabel, onClick: close => { if (!busy) close('cancel'); } }, { label: confirmLabel, variant: destructive ? 'danger' : 'primary', onClick: submit }], onClose });
  const actions = dialog.element.querySelectorAll('.ds-modal-footer button'); const cancel = actions[0]; const confirm = actions[1];
  confirm.disabled = typed; cancel.focus();
  async function submit() {
    if (busy || (typed && input.value !== expected)) return;
    busy = true; confirm.disabled = true; cancel.disabled = true; if (input) input.disabled = true;
    dialog.element.setAttribute('aria-busy', 'true');
    try { await onConfirm(); dialog.close('confirmed'); }
    catch (failure) { error.textContent = failure instanceof Error ? failure.message : 'The action failed. Try again.'; }
    finally { busy = false; confirm.disabled = typed && input.value !== expected; cancel.disabled = false; if (input) input.disabled = false; dialog.element.removeAttribute('aria-busy'); }
  }
  return dialog;
}
export function render(container) {
  const page = playground(container, { title: 'ConfirmDialog', description: guide.purpose });
  let typed = true; let deleted = false;
  const status = statusMessage('Mock project MOCK-42 is present.');
  const trigger = button('Delete mock project', () => openConfirmDialog({ title: 'Delete mock project?', description: 'This removes the demonstration project from this playground only.', destructive: true, confirmLabel: 'Delete mock project', confirmationText: typed ? 'MOCK-42' : undefined, onConfirm: () => { deleted = true; trigger.disabled = true; status.textContent = 'Mock project deleted locally.'; } }), 'danger');
  page.preview.append(element('div', { className: 'component-demo-stack' }, trigger, status));
  page.controls.append(toggleControl('Require typed identifier', typed, value => { typed = value; }), button('Restore mock project', () => { deleted = false; trigger.disabled = deleted; status.textContent = 'Mock project MOCK-42 is present.'; }));
  page.setSnippet('openConfirmDialog({ title: "Delete mock project?", destructive: true, confirmationText: "MOCK-42", onConfirm })');
}
