import { element, playground, choiceControl, toggleControl, statePreview } from './playground.js';
import { createCard } from './card.js';
import { createKpiCard } from './kpi-card.js';
import { createChart } from './chart.js';
import { createTimeline } from './timeline.js';
import { createBadge } from './badge.js';

export function createDashboardLayout({ header, metrics, content, footer, variant = 'grid', className = '' } = {}) {
  const root = element('div', { className: `ds-dashboard-layout ds-dashboard-layout-${variant === 'bento' ? 'bento' : 'grid'}${className ? ` ${className}` : ''}` });
  for (const [name, value] of Object.entries({ header, metrics, content, footer })) {
    if (value === undefined || value === null) continue;
    const slot = element('div', { className: `ds-dashboard-layout-${name}`, 'data-layout-slot': name });
    if (name === 'content') {
      for (const item of (Array.isArray(value) ? value.flat(Infinity) : [value])) {
        if (item === undefined || item === null) continue;
        const descriptor = item instanceof Node ? { element: item } : item;
        const cell = element('div', { className: 'ds-dashboard-layout-cell' }, descriptor.element);
        if (Number.isInteger(descriptor.span)) cell.style.setProperty('--dashboard-span', String(Math.max(1, Math.min(12, descriptor.span))));
        if (Number.isInteger(descriptor.rowSpan)) cell.style.setProperty('--dashboard-row-span', String(Math.max(1, descriptor.rowSpan)));
        slot.append(cell);
      }
    } else slot.append(...(Array.isArray(value) ? value.flat(Infinity) : [value]).filter(node => node !== undefined && node !== null));
    root.append(slot);
  }
  return root;
}

export function demo(container, { variant = 'grid', showMetrics = true } = {}) {
  const trend = createCard({ title: 'Customer growth (mock)', description: 'Mock monthly totals, not live analytics.', content: createChart({ headingLevel: 4, type: 'line', title: 'Mock customer growth', labels: ['Jul', 'Aug', 'Sep', 'Oct'], series: [{ name: 'Customers', values: [12, 18, 21, 28] }] }) });
  const activity = createCard({ title: 'Recent activity (mock)', content: createTimeline({ label: 'Mock workspace activity', items: [{ title: 'Mock account created', time: '09:30', description: 'A local demonstration record.' }, { title: 'Mock review completed', time: '10:15', description: 'No server writes.' }] }) });
  const layout = createDashboardLayout({
    variant,
    header: createCard({ title: 'Workspace overview', description: 'A responsive dashboard composed of shared components.', actions: createBadge({ label: 'Mock data', tone: 'info' }) }),
    metrics: showMetrics ? [createKpiCard({ label: 'Customers (mock)', value: '28', trend: '↑ 7 this month' }), createKpiCard({ label: 'Projects (mock)', value: '12', trend: '3 in review', trendTone: 'neutral' }), createKpiCard({ label: 'Retention (mock)', value: '96%', trend: '↑ 2%' })] : undefined,
    content: [{ element: trend, span: variant === 'bento' ? 8 : 6 }, { element: activity, span: variant === 'bento' ? 4 : 6 }],
    footer: createBadge({ label: 'Mock workspace · client-side only', tone: 'neutral' })
  });
  container?.append(layout);
  return layout;
}

export function render(container) {
  const page = playground(container, { title: 'DashboardLayout', description: 'A twelve-column dashboard and Bento variant. All example data is mock.' });
  const state = { variant: 'grid', showMetrics: true };
  function update() { page.preview.replaceChildren(demo(undefined, state)); page.setSnippet(guide.example); }
  page.controls.append(choiceControl('Layout variant', state.variant, [{ value: 'grid', label: 'Balanced grid' }, { value: 'bento', label: 'Bento' }], value => { state.variant = value; update(); }), toggleControl('Metric slot', true, value => { state.showMetrics = value; update(); }));
  page.states.append(statePreview('Bento composition', demo(undefined, { variant: 'bento', showMetrics: false })), statePreview('Content-only composition', createDashboardLayout({ content: createCard({ title: 'Mock workspace', content: 'A plain node defaults to six columns on desktop and full width on phones.' }) })));
  update();
}

export const guide = {
  purpose: 'Compose a responsive twelve-column dashboard with balanced grid or Bento proportions while leaving card and chart behavior to shared components.',
  props: ['createDashboardLayout({header, metrics, content, footer, variant, className}) returns a DOM node.', 'header, metrics and footer accept a DOM node or arrays of nodes. Optional slots are omitted when null or undefined.', 'content accepts nodes, arrays, or {element: DOMNode, span: 1..12, rowSpan: positive integer} descriptors. Span metadata belongs to wrapper cells; supplied nodes and classes are preserved.', 'variant is grid (default) or bento. className appends application classes without replacing layout classes. Slot wrappers expose data-layout-slot and ds-dashboard-layout-<slot>.'],
  variants: ['Balanced twelve-column grid; Bento with an eight-column lead card and four-column supporting cards; optional metrics and footer.'],
  states: ['Populated, content-only, omitted optional slots. Shared child components own loading, empty and error states.'],
  keyboard: ['The template adds no tab stops and preserves source order. Child menus, charts and controls retain their canonical keyboard behavior.'],
  accessibility: ['Keep named headings in supplied cards. Do not communicate dashboard meaning through tile size alone.', 'The layout does not reorder or clone supplied DOM nodes; chart table alternatives remain available.'],
  tokens: ['--space-4, --space-6; shared Card, KpiCard, Chart and Timeline tokens.'],
  responsive: ['Twelve tracks on wide screens; content spans at least six tracks on tablets; phones use one column and ignore row spans.', 'Grid tracks and cells allow shrinking, so shared charts and scrolling tables stay inside the available width.'],
  do: ['Pass canonical KpiCard, Card and Chart nodes, and label demonstration data as mock.', 'Use span metadata for content importance and retain logical DOM order.'],
  dont: ['Do not use visual reordering or dense packing that changes the reading sequence.', 'Do not fork component styling to create dashboard cards.'],
  example: 'const layout = createDashboardLayout({\n  header: heading, metrics: metricCards, variant: "bento",\n  content: [{element: trendCard, span: 8}, {element: activityCard, span: 4}],\n  footer: sourceNote, className: "workspace-dashboard"\n});\ncontainer.append(layout);'
};
