import { element, button, playground, textControl, choiceControl, toggleControl, statePreview, statusMessage } from './playground.js';

export function createButtonGroup({ label = 'Related actions', items = [], value, selection = false, orientation = 'horizontal', disabled = false, onChange = () => {} } = {}) {
  let selected = value;
  let isDisabled = disabled;
  let active = Math.max(0, items.findIndex(item => item.value === value && !item.disabled));
  const vertical = orientation === 'vertical';
  const root = element('div', { className: 'ds-button-group', role: selection ? 'radiogroup' : 'toolbar', 'aria-label': label, 'aria-orientation': vertical ? 'vertical' : 'horizontal' });
  const controls = items.map((item, index) => button(item.label, event => {
    if (isDisabled || item.disabled) return;
    active = index;
    if (selection) { selected = item.value; refresh(); onChange(selected, item); }
    else refresh();
    item.action?.(event);
  }, 'secondary', { role: selection ? 'radio' : 'button' }));
  function enabledIndices() { return items.flatMap((item, index) => !isDisabled && !item.disabled ? [index] : []); }
  function refresh() {
    const enabled = enabledIndices();
    if (!enabled.includes(active)) active = enabled[0] ?? -1;
    controls.forEach((control, index) => {
      control.disabled = isDisabled || Boolean(items[index].disabled);
      control.tabIndex = index === active ? 0 : -1;
      if (selection) control.setAttribute('aria-checked', String(items[index].value === selected));
    });
  }
  root.append(...controls);
  controls.forEach((control, index) => control.addEventListener('focus', () => { active = index; refresh(); }));
  root.addEventListener('keydown', event => {
    const forward = vertical ? 'ArrowDown' : 'ArrowRight';
    const backward = vertical ? 'ArrowUp' : 'ArrowLeft';
    if (![forward, backward, 'Home', 'End'].includes(event.key)) return;
    const enabled = enabledIndices();
    if (!enabled.length) return;
    event.preventDefault();
    const position = enabled.indexOf(active);
    const rtl = !vertical && getComputedStyle(root).direction === 'rtl';
    const delta = (event.key === forward ? 1 : -1) * (rtl ? -1 : 1);
    active = event.key === 'Home' ? enabled[0] : event.key === 'End' ? enabled.at(-1) : enabled[(position + delta + enabled.length) % enabled.length];
    if (selection) { selected = items[active].value; refresh(); onChange(selected, items[active]); }
    else refresh();
    controls[active].focus();
  });
  refresh();
  return {
    element: root, buttons: controls,
    get value() { return selected; },
    setValue(next) { selected = next; const index = items.findIndex(item => item.value === next && !item.disabled); if (index >= 0) active = index; refresh(); },
    setDisabled(next) { isDisabled = Boolean(next); refresh(); }
  };
}

export function demo(container) {
  const feedback = statusMessage('Mock records are shown as a list.');
  const group = createButtonGroup({ label: 'Mock record view', selection: true, value: 'list', items: [{ value: 'list', label: 'List' }, { value: 'grid', label: 'Grid' }], onChange: value => { feedback.textContent = `Mock record view: ${value}.`; } });
  const root = element('div', { className: 'component-demo-stack' }, group.element, feedback);
  container?.append(root);
  return root;
}

export function render(container) {
  const page = playground(container, { title: 'ButtonGroup', description: 'Related actions share a named toolbar and one Tab stop. Selection groups use radio semantics and arrow-key selection. All examples below operate on mock data.' });
  const props = { label: 'Mock record views', selection: true, orientation: 'horizontal', disabled: false, disableMiddle: false };
  let value = 'list';
  const slot = element('div', { className: 'component-row' });
  const feedback = statusMessage('Mock view: list. Arrow keys change views.');
  function update() {
    const items = ['list', 'grid', 'board'].map((item, index) => ({ value: item, label: item[0].toUpperCase() + item.slice(1), disabled: index === 1 && props.disableMiddle, action: props.selection ? undefined : () => { feedback.textContent = `Mock ${item} action completed.`; } }));
    const group = createButtonGroup({ ...props, value, items, onChange: next => { value = next; feedback.textContent = `Mock view: ${next}.`; } });
    slot.replaceChildren(group.element);
    page.setSnippet(`import { createButtonGroup } from './components/button-group.js';\nconst group = createButtonGroup({ label: ${JSON.stringify(props.label)}, selection: ${props.selection}, orientation: ${JSON.stringify(props.orientation)}, disabled: ${props.disabled}, value: 'list', items: [{value: 'list', label: 'List'}, {value: 'grid', label: 'Grid', disabled: ${props.disableMiddle}}, {value: 'board', label: 'Board'}], onChange: changeView });\ncontainer.append(group.element);`);
  }
  page.preview.append(element('div', { className: 'component-demo-stack' }, slot, feedback));
  page.controls.append(textControl('Group label', props.label, next => { props.label = next; update(); }), toggleControl('Single-selection group', true, next => { props.selection = next; update(); }), choiceControl('Orientation', props.orientation, [{ value: 'horizontal', label: 'Horizontal' }, { value: 'vertical', label: 'Vertical' }], next => { props.orientation = next; update(); }), toggleControl('Disabled group', false, next => { props.disabled = next; update(); }), toggleControl('Disable middle item', false, next => { props.disableMiddle = next; update(); }));
  page.states.append(statePreview('Selected', demo()));
  const actions = createButtonGroup({ label: 'Mock record actions', items: ['Preview', 'Duplicate'].map(label => ({ label, value: label, action: () => { feedback.textContent = `${label} mock action completed.`; } })) });
  const disabledGroup = createButtonGroup({ label: 'Unavailable mock views', disabled: true, items: [{ value: 'list', label: 'List' }, { value: 'grid', label: 'Grid' }] });
  page.states.append(statePreview('Action toolbar', actions.element), statePreview('Disabled', disabledGroup.element));
  update();
}

export const guide = {
  purpose: 'Group related actions in a toolbar, or offer one mutually exclusive selection with radio semantics and roving keyboard focus.',
  props: ['createButtonGroup({label, items:[{value,label,disabled?,action?}], value?, selection=false, orientation="horizontal", disabled=false, onChange}) returns {element, buttons, value, setValue, setDisabled}.', 'onChange(value,item) fires for user selection; setValue is silent. Item action(event) runs on explicit activation, not arrow-key focus.'],
  variants: ['Action toolbar; single-selection radiogroup; horizontal and vertical orientations.'],
  states: ['Default, focused item, selected/unselected, individual disabled item, disabled group.'],
  keyboard: ['Tab enters at the current item; only one enabled item participates in Tab order.', 'Horizontal Left/Right (mirrored in RTL) or vertical Up/Down wrap and skip disabled items; Home/End select the first/last enabled item.', 'Arrows select in radio mode and only move focus in action mode; Enter/Space activate.'],
  accessibility: ['The group has a required meaningful aria-label and aria-orientation; selection uses radiogroup/radio with aria-checked, actions use toolbar/native buttons.', 'Disabled items are omitted from the roving focus model; the group does not impersonate tabs or page navigation.'],
  tokens: ['Shared Button tokens; --space-2, --space-11, --radius, --accent, --accent-soft, --accent-text.'],
  responsive: ['Groups fit the available width with horizontal scrolling inside the group; vertical groups stack. Every button remains at least 44px high.'],
  do: ['Choose selection=true for mutually exclusive local modes and use onChange to render the matching content.', 'Use short labels and a meaningful group name.'],
  dont: ['Do not use a radio group for independent toggles.', 'Do not use this in place of Tabs when switching named content panels.'],
  example: 'const group = createButtonGroup({ label: "Mock record view", selection: true, value: "list", items: [{value: "list", label: "List"}, {value: "grid", label: "Grid"}], onChange: changeView });\ncontainer.append(group.element);'
};
