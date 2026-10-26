import { element, button, playground, textControl, choiceControl, toggleControl, statePreview, statusMessage } from './playground.js';
import { icon as renderIcon } from '../js/icons.js';
import { createTooltip } from './tooltip.js';

export function createIconButton({ label, icon = 'more', variant = 'secondary', size = 'medium', disabled = false, loading = false, pressed, tooltip = label, onClick = () => {} } = {}) {
  const accessibleLabel = String(label || 'Action');
  const control = button('', onClick, variant, { className: `ds-button ds-button-${variant} ds-button-${size} ds-icon-button`, 'aria-label': accessibleLabel, 'aria-busy': String(loading), disabled: disabled || loading });
  if (pressed !== undefined) control.setAttribute('aria-pressed', String(Boolean(pressed)));
  const glyph = element('span', { className: loading ? 'ds-spinner' : 'ds-icon-button-glyph', 'aria-hidden': 'true' });
  if (!loading) glyph.innerHTML = renderIcon(icon);
  control.append(glyph);
  if (!tooltip) return { element: control, button: control, close() {} };
  const hint = createTooltip({ trigger: control, content: tooltip });
  return { element: hint.element, button: control, close: hint.close };
}

export function demo(container) {
  const feedback = statusMessage('Mock refresh action is ready.');
  const action = createIconButton({ label: 'Refresh mock records', icon: 'reset', onClick: () => { feedback.textContent = 'Mock records refreshed locally.'; } });
  const root = element('div', { className: 'component-demo-stack' }, action.element, feedback);
  container?.append(root);
  return root;
}

export function render(container) {
  const page = playground(container, { title: 'IconButton', description: 'A compact shared Button with a single-source icon, an accessible action name and the shared hover/focus tooltip. All actions below are mock.' });
  const props = { label: 'Refresh mock records', icon: 'reset', variant: 'secondary', size: 'medium', disabled: false, loading: false };
  const slot = element('div', { className: 'component-row' });
  const feedback = statusMessage('Activate the icon to refresh mock records.');
  let count = 0;
  let current;
  function update() {
    current?.close();
    current = createIconButton({ ...props, onClick: () => { count += 1; feedback.textContent = `Mock action completed ${count} time${count === 1 ? '' : 's'}.`; } });
    slot.replaceChildren(current.element);
    page.setSnippet(`import { createIconButton } from './components/icon-button.js';\nconst action = createIconButton({ label: ${JSON.stringify(props.label)}, icon: ${JSON.stringify(props.icon)}, variant: ${JSON.stringify(props.variant)}, size: ${JSON.stringify(props.size)}, disabled: ${props.disabled}, loading: ${props.loading}, onClick: refresh });\ncontainer.append(action.element);`);
  }
  page.preview.append(element('div', { className: 'component-demo-stack' }, slot, feedback));
  page.controls.append(
    textControl('Accessible label / tooltip', props.label, value => { props.label = value; update(); }),
    choiceControl('Icon', props.icon, ['reset', 'edit', 'copy', 'download', 'info', 'more'].map(value => ({ value, label: value })), value => { props.icon = value; update(); }),
    choiceControl('Variant', props.variant, ['primary', 'secondary', 'ghost'].map(value => ({ value, label: value })), value => { props.variant = value; update(); }),
    choiceControl('Size', props.size, ['small', 'medium', 'large'].map(value => ({ value, label: value })), value => { props.size = value; update(); }),
    toggleControl('Disabled', false, value => { props.disabled = value; update(); }),
    toggleControl('Loading', false, value => { props.loading = value; update(); })
  );
  for (const [label, extra] of [['Default', {}], ['Disabled', { disabled: true }], ['Loading', { loading: true }], ['Pressed toggle', { pressed: true }]]) {
    const action = createIconButton({ label: label === 'Pressed toggle' ? 'Pin mock record' : 'Refresh mock records', icon: 'reset', ...extra, onClick: () => {
      if (extra.pressed !== undefined) { extra.pressed = !extra.pressed; action.button.setAttribute('aria-pressed', String(extra.pressed)); }
      feedback.textContent = `${label} mock action activated.`;
    } });
    page.states.append(statePreview(label, action.element));
  }
  update();
}

export const guide = {
  purpose: 'Offer a recognizable compact action by composing the canonical Button, SSOT SVG icons and Tooltip primitive.',
  props: ['createIconButton({label, icon="more", variant="secondary", size="medium", disabled=false, loading=false, pressed?, tooltip=label, onClick}) returns {element, button, close}.', 'label supplies the accessible action name; tooltip is supporting text, or false to omit it. pressed is optional and controlled by the caller.'],
  variants: ['Primary, secondary and ghost shared Button treatments; small, medium and large sizes; optional pressed toggle.'],
  states: ['Default, hover/focus tooltip, disabled, loading, pressed/unpressed.'],
  keyboard: ['Tab reaches the button; Enter or Space invokes onClick; Escape closes the tooltip without moving focus.', 'Disabled and loading buttons cannot activate; callers update aria-pressed for controlled toggles.'],
  accessibility: ['The native button always has an aria-label, and decorative SSOT SVG is hidden from assistive technology.', 'The existing tooltip is connected with aria-describedby; loading exposes aria-busy and preserves the accessible action name.'],
  tokens: ['Shared Button/Tooltip tokens; --space-2, --space-5, --space-11, --space-12, --accent, --accent-soft, --accent-text.'],
  responsive: ['Every size keeps at least the tokenized 44px target; the large size follows the shared Button height.'],
  do: ['Use a familiar icon and an explicit verb-based label such as Refresh records.', 'Prefer a visible-label Button when the action is unfamiliar.'],
  dont: ['Do not put an essential instruction only in a tooltip.', 'Do not execute a destructive action without a separate confirmation.'],
  example: 'const action = createIconButton({ label: "Refresh mock records", icon: "reset", onClick: refresh });\ncontainer.append(action.element);'
};
