// The sole L7 registration/dispatch boundary; lower layers never import products.
export const exampleRoutes = [
  { path: '/examples', title: 'Examples' },
  ...[
    ['erp', 'ERP', [['orders', 'Orders'], ['order/SO-1042', 'Order detail'], ['inventory', 'Inventory'], ['invoice', 'New invoice']]],
    ['crm', 'CRM', [['customers', 'Customers'], ['customer/CRM-001', 'Customer 360'], ['pipeline', 'Sales pipeline'], ['calendar', 'Activity calendar']]],
    ['school', 'School', [['students', 'Students'], ['student/STU-001', 'Student profile'], ['attendance', 'Attendance sheet'], ['gradebook', 'Gradebook'], ['timetable', 'Timetable']]]
  ].flatMap(([domain, title, screens]) => [{ path: `/examples/${domain}`, title }, ...screens.map(([screen, name]) => ({ path: `/examples/${domain}/${screen}`, title: `${title} / ${name}` }))])
];

export async function renderExampleRoute(container, route) {
  const domain = route.params.domain;
  const module = domain ? await ({ erp: () => import('./examples/erp/index.js'), crm: () => import('./examples/crm/index.js'), school: () => import('./examples/school/index.js') }[domain])() : await import('./examples/index.js');
  if (!container.isConnected || location.hash.replace(/^#/, '').replace(/\/$/, '') !== route.path) return;
  for (const style of domain ? ['common', domain] : []) {
    if (document.querySelector(`link[data-example-style="${style}"]`)) continue;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = new URL(`../css/examples/${style}.css`, import.meta.url).href;
    link.dataset.exampleStyle = style;
    document.head.append(link);
  }
  module.render(container, { screen: route.params.screen, id: route.params.id });
  container.dataset.examplePath = route.path;
}
