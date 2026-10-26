import { element, button, uniqueId } from '../../components/playground.js';
import { icon } from '../icons.js';

const preferences = new Map();

/** Example-only controls; toggling never redraws the product screen. */
export function createDemoControls({ domain, reset, state, stateElement = state?.element }) {
  const key = `forma-example-demo-controls-${domain}`;
  let expanded = preferences.get(domain) || false;
  try {
    const saved = sessionStorage.getItem(key);
    if (saved !== null) expanded = saved === 'open';
  } catch { /* Keep the in-memory preference when storage is unavailable. */ }
  preferences.set(domain, expanded);
  const panel = element('div', { id: uniqueId('demo-controls-panel'), className: 'example-demo-panel', hidden: !expanded }, stateElement, reset);
  const trigger = button('Demo controls', () => {
    expanded = !expanded;
    if (!expanded) {
      state?.close();
      if (panel.contains(document.activeElement)) trigger.focus();
    }
    panel.hidden = !expanded;
    trigger.setAttribute('aria-expanded', String(expanded));
    preferences.set(domain, expanded);
    try { sessionStorage.setItem(key, expanded ? 'open' : 'closed'); } catch { /* Disclosure remains usable without storage. */ }
  }, 'ghost', { className: 'ds-button ds-button-ghost example-demo-trigger', 'aria-expanded': String(expanded), 'aria-controls': panel.id });
  const chevron = element('span', { className: 'example-demo-chevron' });
  chevron.innerHTML = icon('chevronDown');
  trigger.prepend(chevron);
  return element('div', { className: 'example-demo-controls' }, trigger, panel);
}
