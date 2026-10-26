import { element, playground, textControl, choiceControl, toggleControl, statePreview, statusMessage } from './playground.js';
import { icon as renderIcon } from '../js/icons.js';
import { createMenu } from './popover.js';

export function createDropdownButton({ label = 'Actions', items = [], variant = 'secondary', size = 'medium', icon, placement = 'end', disabled = false, loading = false } = {}) {
  const menu = createMenu({ label, placement, disabled: disabled || loading || !items.length, items });
  menu.element.classList.add('ds-dropdown-button');
  menu.trigger.className = `ds-button ds-button-${variant} ds-button-${size} ds-dropdown-button-trigger`;
  menu.trigger.setAttribute('aria-busy', String(loading));
  const leading = element('span', { className: loading ? 'ds-spinner' : 'ds-dropdown-button-icon', 'aria-hidden': 'true' });
  if (icon && !loading) leading.innerHTML = renderIcon(icon);
  const chevron = element('span', { className: 'ds-dropdown-button-chevron', 'aria-hidden': 'true' });
  chevron.innerHTML = renderIcon('chevronDown');
  menu.trigger.replaceChildren(...(loading || icon ? [leading] : []), element('span', { className: 'ds-dropdown-button-label' }, label), chevron);
  return menu;
}

export function demo(container) {
  const feedback = statusMessage('Choose a mock record action.');
  const dropdown = createDropdownButton({ label: 'Mock actions', items: [{ label: 'Preview mock record', action: () => { feedback.textContent = 'Mock record preview: Acme workspace · Active · Design team.'; } }, { label: 'Duplicate mock record', action: () => { feedback.textContent = 'A local mock record copy was created.'; } }] });
  const root = element('div', { className: 'component-demo-stack' }, dropdown.element, feedback);
  container?.append(root);
  return root;
}

export function render(container) {
  const page = playground(container, { title: 'DropdownButton', description: 'A single action-menu trigger built on the existing Popover menu. It never runs a hidden default action. All examples below use local mock records.' });
  const props = { label: 'Mock record actions', variant: 'secondary', size: 'medium', icon: 'more', placement: 'end', disabled: false, loading: false, disableDuplicate: false };
  const slot = element('div', { className: 'component-row' });
  const feedback = statusMessage('Open the dropdown to work with a mock record.');
  let copies = 0;
  let current;
  function items() {
    return [{ label: 'Preview mock record', action: () => { feedback.textContent = 'Mock record preview: Acme workspace · Active · Design team.'; } }, { label: 'Duplicate mock record', disabled: props.disableDuplicate, action: () => { copies += 1; feedback.textContent = `Created ${copies} local mock ${copies === 1 ? 'copy' : 'copies'}.`; } }, { label: 'Show mock record summary', action: () => { feedback.textContent = `Mock record: Acme workspace. ${copies} local copies created in this demo.`; } }];
  }
  function update() {
    current?.close();
    current = createDropdownButton({ ...props, items: items() });
    slot.replaceChildren(current.element);
    page.setSnippet(`import { createDropdownButton } from './components/dropdown-button.js';\nconst dropdown = createDropdownButton({ label: ${JSON.stringify(props.label)}, variant: ${JSON.stringify(props.variant)}, size: ${JSON.stringify(props.size)}, icon: ${JSON.stringify(props.icon)}, placement: ${JSON.stringify(props.placement)}, disabled: ${props.disabled}, loading: ${props.loading}, items: [{label: 'Preview mock record', action: preview}, {label: 'Duplicate mock record', action: duplicate, disabled: ${props.disableDuplicate}}] });\ncontainer.append(dropdown.element);`);
  }
  page.preview.append(element('div', { className: 'component-demo-stack' }, slot, feedback));
  page.controls.append(textControl('Trigger label', props.label, value => { props.label = value; update(); }), choiceControl('Variant', props.variant, ['primary', 'secondary', 'ghost'].map(value => ({ value, label: value })), value => { props.variant = value; update(); }), choiceControl('Size', props.size, ['small', 'medium', 'large'].map(value => ({ value, label: value })), value => { props.size = value; update(); }), choiceControl('Leading icon', props.icon, [{ value: '', label: 'None' }, { value: 'more', label: 'More' }, { value: 'download', label: 'Download' }, { value: 'edit', label: 'Edit' }], value => { props.icon = value; update(); }), choiceControl('Menu alignment', props.placement, [{ value: 'start', label: 'Start' }, { value: 'end', label: 'End' }], value => { props.placement = value; update(); }), toggleControl('Disabled', false, value => { props.disabled = value; update(); }), toggleControl('Loading', false, value => { props.loading = value; update(); }), toggleControl('Disable duplicate action', false, value => { props.disableDuplicate = value; update(); }));
  for (const [label, extra] of [['Default', {}], ['Disabled', { disabled: true }], ['Loading', { loading: true }], ['Empty actions', { items: [] }]]) {
    const sample = createDropdownButton({ label: 'Mock actions', items: items(), ...extra });
    page.states.append(statePreview(label, sample.element));
  }
  update();
}

export const guide = {
  purpose: 'Reveal related commands behind one explicit menu trigger by composing the canonical Popover createMenu helper and shared Button styles.',
  props: ['createDropdownButton({label="Actions", items:[{label,action,disabled?,danger?}], variant="secondary", size="medium", icon?, placement="end", disabled=false, loading=false}) returns {element, trigger, close}.', 'items and their callbacks use the existing createMenu contract. Empty items disable the trigger; loading also disables activation. close(returnFocus?) dismisses the menu.'],
  variants: ['Primary, secondary and ghost shared Button treatments; small, medium and large; optional SSOT leading icon; start/end menu alignment.'],
  states: ['Closed, open, focused menu item, disabled menu item, disabled trigger, loading, empty actions.'],
  keyboard: ['Tab focuses the trigger; Enter/Space or ArrowDown opens the menu; ArrowUp opens on the last enabled item.', 'ArrowUp/Down, Home and End move among enabled menu items; Enter/Space runs the action. Escape closes and returns focus; Tab exits.'],
  accessibility: ['Native trigger exposes aria-haspopup=menu, aria-controls, aria-expanded and aria-busy; createMenu supplies menu/menuitem roles and disabled states.', 'Icons and chevron are decorative; visible text names both the trigger and its menu.'],
  tokens: ['Shared Button/Popover tokens; --space-2, --space-4, --space-11, --space-5, --space-12.'],
  responsive: ['Trigger text wraps within its container; every size keeps a 44px minimum target. The existing menu clamps and flips inside the viewport.'],
  do: ['Use this when every choice belongs in the menu and no default action should execute on trigger click.', 'Make action labels specific and provide disabled states when unavailable.'],
  dont: ['Do not treat opening a menu as completing an action.', 'Do not supply an unconfirmed destructive callback; confirmation belongs in the action flow.'],
  example: 'const dropdown = createDropdownButton({ label: "Mock record actions", items: [{label: "Preview mock record", action: preview}] });\ncontainer.append(dropdown.element);'
};
