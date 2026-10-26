import { element, playground, button, statusMessage } from './playground.js';
export const guide = {
  purpose: 'Show meaningful current, completed and upcoming workflow steps with accessible navigation.',
  props: ['createStepper({steps:[{id,label,description,disabled}],current:0,completed:[],onChange(index,step),label}) returns an element with setCurrent(index), setCompleted(indices), and value. Completion is explicit, not inferred from position.'],
  variants: ['Navigable when onChange is provided; read-only otherwise.'], states: ['Current, complete, upcoming and disabled.'],
  keyboard: ['Tab visits enabled step buttons; Enter/Space activate; Left/Right or Up/Down move focus; Home/End focus the first/last enabled step.'],
  accessibility: ['Ordered steps use aria-current="step" and textual Complete/Current/Upcoming indicators.'],
  tokens: ['--accent, --accent-text, --space-3, --color-border-subtle'], responsive: ['Steps wrap to stacked rows on phones, with 44px button targets.'],
  do: ['Update completed steps only after their work is valid.'], dont: ['Do not mark earlier steps complete simply because the current index changed.'],
  example: 'createStepper({steps:[{label:"Choose"},{label:"Review"}],current:1,completed:[0],onChange})'
};
export function createStepper({ steps = [], current = 0, completed = [], onChange, label = 'Progress' } = {}) {
  const root = element('nav', { className: 'ds-stepper', 'aria-label': label });
  let active = Math.max(0, Math.min(steps.length - 1, current)); let done = new Set(completed);
  function draw() {
    const list = element('ol', {});
    steps.forEach((step, index) => {
      const state = index === active ? 'Current' : done.has(index) ? 'Complete' : 'Upcoming';
      const content = element('span', { className: 'ds-stepper-content' }, element('strong', {}, step.label), element('span', { className: 'ds-stepper-status' }, state), step.description ? element('span', { className: 'ds-stepper-description' }, step.description) : null);
      const attrs = { className: 'ds-stepper-step', ...(index === active ? { 'aria-current': 'step' } : {}), 'data-complete': String(done.has(index)) };
      const row = onChange ? element('button', { ...attrs, type: 'button', disabled: Boolean(step.disabled), onclick: () => { active = index; draw(); listFocus(index); onChange(index, step); } }, element('span', { className: 'ds-stepper-number', 'aria-hidden': 'true' }, done.has(index) && index !== active ? '✓' : String(index + 1)), content) : element('div', attrs, element('span', { className: 'ds-stepper-number', 'aria-hidden': 'true' }, String(index + 1)), content);
      row.dataset.index = String(index); list.append(element('li', {}, row));
    });
    root.replaceChildren(list);
  }
  function listFocus(index) { root.querySelector(`[data-index="${index}"]`)?.focus(); }
  root.addEventListener('keydown', event => {
    const buttons = [...root.querySelectorAll('button:not(:disabled)')]; const index = buttons.indexOf(event.target);
    if (index < 0 || !['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault(); const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1) + buttons.length) % buttons.length; buttons[next].focus();
  });
  root.setCurrent = index => { if (Number.isInteger(index) && index >= 0 && index < steps.length) { active = index; draw(); } };
  root.setCompleted = indices => { done = new Set(indices); draw(); };
  Object.defineProperty(root, 'value', { get: () => active }); draw(); return root;
}
export function render(container) {
  const page = playground(container, { title: 'Stepper', description: guide.purpose });
  let current = 0; const completed = new Set();
  const status = statusMessage('Mock import: choose a file.');
  const steps = [{ label: 'Choose file', description: 'Mock CSV source' }, { label: 'Map columns', description: 'Match fields' }, { label: 'Review', description: 'Check before importing' }];
  const stepper = createStepper({ steps, onChange: index => { current = index; update(); } });
  const next = button('Complete current step', () => { completed.add(current); if (current < steps.length - 1) current++; update(); }, 'primary');
  function update() { stepper.setCurrent(current); stepper.setCompleted([...completed]); status.textContent = completed.size === steps.length ? 'All mock import steps completed. No records were uploaded.' : `Mock import: ${steps[current].label}. ${completed.size} of ${steps.length} steps complete.`; next.disabled = completed.size === steps.length; }
  page.preview.append(element('div', { className: 'component-demo-stack' }, stepper, status, next));
  page.controls.append(button('Reset mock workflow', () => { current = 0; completed.clear(); update(); }));
  page.setSnippet('createStepper({ steps, current: 0, completed: [], onChange })'); update();
}
