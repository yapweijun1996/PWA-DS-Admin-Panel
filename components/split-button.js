import { element, button, playground, textControl, choiceControl, toggleControl, statePreview, statusMessage } from './playground.js';
import { icon as renderIcon } from '../js/icons.js';
import { createMenu } from './popover.js';

export function createSplitButton({ label = 'Save', onAction = () => {}, items = [], menuLabel = `More actions for ${label}`, variant = 'primary', size = 'medium', disabled = false, loading = false, placement = 'end' } = {}) {
  const menu = createMenu({ label: menuLabel, items, placement, disabled: disabled || loading || !items.length });
  const primary = button(label, event => { menu.close(); onAction(event); }, variant, { className: `ds-button ds-button-${variant} ds-button-${size} ds-split-button-primary`, disabled: disabled || loading, 'aria-busy': String(loading) });
  if (loading) primary.prepend(element('span', { className: 'ds-spinner', 'aria-hidden': 'true' }));
  menu.trigger.className = `ds-button ds-button-${variant} ds-button-${size} ds-split-button-toggle`;
  menu.trigger.setAttribute('aria-label', menuLabel);
  const chevron = element('span', { className: 'ds-split-button-chevron', 'aria-hidden': 'true' });
  chevron.innerHTML = renderIcon('chevronDown');
  menu.trigger.replaceChildren(chevron);
  const root = element('div', { className: 'ds-split-button', role: 'group', 'aria-label': label }, primary, menu.element);
  return { element: root, primary, trigger: menu.trigger, close: menu.close };
}

export function demo(container) {
  const feedback = statusMessage('The mock draft has not been saved yet.');
  const split = createSplitButton({ label: 'Save mock draft', onAction: () => { feedback.textContent = 'Mock draft saved locally.'; }, items: [{ label: 'Save mock draft as copy', action: () => { feedback.textContent = 'A local mock draft copy was saved.'; } }, { label: 'Preview mock draft', action: () => { feedback.textContent = 'Mock preview: Design review draft · Ready for review.'; } }] });
  const root = element('div', { className: 'component-demo-stack' }, split.element, feedback);
  container?.append(root);
  return root;
}

export function render(container) {
  const page = playground(container, { title: 'SplitButton', description: 'One visible primary action and a separate menu of alternatives. Primary activation never opens the menu; opening the menu never runs the primary action. All draft actions below are mock and browser-local.' });
  const props = { label: 'Save mock draft', menuLabel: 'More mock draft actions', variant: 'primary', size: 'medium', disabled: false, loading: false, placement: 'end', disableCopy: false };
  let saves = 0;
  let copies = 0;
  const slot = element('div', { className: 'component-row' });
  const feedback = statusMessage('Choose Save mock draft, or use the separate menu.');
  let current;
  const save = () => { saves += 1; feedback.textContent = `Mock draft saved ${saves} time${saves === 1 ? '' : 's'} locally. ${copies} copies created.`; };
  function items() {
    return [{ label: 'Save mock draft as copy', disabled: props.disableCopy, action: () => { copies += 1; feedback.textContent = `Created ${copies} local mock draft ${copies === 1 ? 'copy' : 'copies'}.`; } }, { label: 'Preview mock draft', action: () => { feedback.textContent = 'Mock preview: Design review draft · Ready for review. No server request was made.'; } }];
  }
  function update() {
    current?.close();
    current = createSplitButton({ ...props, items: items(), onAction: save });
    slot.replaceChildren(current.element);
    page.setSnippet(`import { createSplitButton } from './components/split-button.js';\nconst split = createSplitButton({ label: ${JSON.stringify(props.label)}, menuLabel: ${JSON.stringify(props.menuLabel)}, variant: ${JSON.stringify(props.variant)}, size: ${JSON.stringify(props.size)}, placement: ${JSON.stringify(props.placement)}, disabled: ${props.disabled}, loading: ${props.loading}, onAction: saveDraft, items: [{label: 'Save mock draft as copy', action: saveCopy, disabled: ${props.disableCopy}}, {label: 'Preview mock draft', action: preview}] });\ncontainer.append(split.element);`);
  }
  page.preview.append(element('div', { className: 'component-demo-stack' }, slot, feedback));
  page.controls.append(textControl('Primary label', props.label, value => { props.label = value; update(); }), textControl('Menu accessible label', props.menuLabel, value => { props.menuLabel = value; update(); }), choiceControl('Variant', props.variant, ['primary', 'secondary'].map(value => ({ value, label: value })), value => { props.variant = value; update(); }), choiceControl('Size', props.size, ['small', 'medium', 'large'].map(value => ({ value, label: value })), value => { props.size = value; update(); }), choiceControl('Menu alignment', props.placement, [{ value: 'start', label: 'Start' }, { value: 'end', label: 'End' }], value => { props.placement = value; update(); }), toggleControl('Disabled', false, value => { props.disabled = value; update(); }), toggleControl('Loading primary action', false, value => { props.loading = value; update(); }), toggleControl('Disable save copy', false, value => { props.disableCopy = value; update(); }));
  for (const [label, extra] of [['Default', {}], ['Disabled', { disabled: true }], ['Loading', { loading: true }], ['No alternatives', { items: [] }]]) {
    const sample = createSplitButton({ label: 'Save mock draft', onAction: save, items: items(), ...extra });
    page.states.append(statePreview(label, sample.element));
  }
  update();
}

export const guide = {
  purpose: 'Present a common primary action beside a separate, clearly named menu of less frequent alternative commands.',
  props: ['createSplitButton({label="Save", onAction, items:[{label,action,disabled?,danger?}], menuLabel?, variant="primary", size="medium", disabled=false, loading=false, placement="end"}) returns {element, primary, trigger, close}.', 'onAction(event) runs only from the primary button. Menu actions use the existing createMenu callbacks. loading blocks both halves; empty items disable only the menu half.'],
  variants: ['Primary and secondary shared Button treatments; small, medium and large sizes; start/end menu alignment.'],
  states: ['Default, primary hover/focus, menu open, focused/disabled menu item, disabled, loading, no alternatives.'],
  keyboard: ['Both enabled halves are separate Tab stops. Enter/Space on the primary runs onAction; Enter/Space or ArrowDown on the menu trigger opens alternatives; ArrowUp opens at the last enabled item.', 'Within the menu ArrowUp/Down and Home/End move; Escape closes and returns focus; Tab exits.'],
  accessibility: ['A named group contains two native buttons, with a distinct aria-label on the icon-only menu trigger.', 'The menu half alone has aria-haspopup, aria-expanded and aria-controls. Primary loading exposes aria-busy; the SSOT chevron and spinner are decorative.'],
  tokens: ['Shared Button/Popover tokens; --space-1, --space-2, --space-4, --space-11, --radius, --accent, --color-border-subtle.'],
  responsive: ['The primary label wraps rather than overflowing; both halves maintain at least 44px touch targets, with menu position clamped by createMenu.'],
  do: ['Use a specific primary verb and only related alternatives.', 'Keep the menu label distinguishable from the primary action for assistive technology.'],
  dont: ['Do not run the primary action when opening its menu.', 'Do not supply an unconfirmed destructive callback or make the primary action depend on an unannounced remembered menu choice.'],
  example: 'const split = createSplitButton({ label: "Save mock draft", onAction: saveDraft, items: [{label: "Save mock draft as copy", action: saveCopy}] });\ncontainer.append(split.element);'
};
