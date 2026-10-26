import { element, playground, choiceControl, toggleControl, statePreview } from './playground.js';
export const guide = {
  purpose: 'Reserve content space while real data is loading without presenting placeholders as records.',
  props: ['createSkeleton({lines:3,label:"Loading content",avatar:false}) returns a labeled busy region.'],
  variants: ['Text lines with optional avatar placeholder.'], states: ['Loading only; replace with real, empty or error content after loading.'],
  keyboard: ['Placeholder shapes are not focusable.'], accessibility: ['A single status label describes loading; decorative shapes are hidden.'],
  tokens: ['--space-3, --space-4, --bg, --color-border-subtle, --radius-md'], responsive: ['Placeholders use fluid widths.'],
  do: ['Match the rough shape of the content being loaded.'], dont: ['Do not leave skeletons visible after an error.'],
  example: 'createSkeleton({lines:3,avatar:true,label:"Loading customer"})'
};
export function createSkeleton({ lines = 3, label = 'Loading content', avatar = false } = {}) {
  const root = element('div', { className: 'ds-skeleton', role: 'status', 'aria-label': label, 'aria-busy': 'true' });
  if (avatar) root.append(element('span', { className: 'ds-skeleton-avatar', 'aria-hidden': 'true' }));
  const body = element('div', { className: 'ds-skeleton-lines', 'aria-hidden': 'true' });
  for (let index = 0; index < Math.max(1, Math.min(20, Math.floor(Number(lines) || 3))); index++) body.append(element('span', { className: 'ds-skeleton-line' }));
  root.append(body); return root;
}
export function render(container) {
  const page = playground(container, { title: 'Skeleton', description: guide.purpose }); let lines = 3; let avatar = true;
  function update() { const view = createSkeleton({ lines, avatar, label: 'Loading mock customer preview' }); page.preview.replaceChildren(view); page.setSnippet(view.outerHTML); }
  page.controls.append(choiceControl('Lines', '3', [{value:'1',label:'One'},{value:'3',label:'Three'},{value:'5',label:'Five'}], value => { lines = Number(value); update(); }), toggleControl('Avatar placeholder', avatar, value => { avatar = value; update(); }));
  page.states.append(statePreview('Text only', createSkeleton({lines:2}))); update();
}
