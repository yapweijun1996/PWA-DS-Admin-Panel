import { element, playground, toggleControl, statePreview, button, statusMessage } from './playground.js';
import { createCard } from './card.js';
import { createTable } from './table.js';
import { createPagination } from './pagination.js';
import { createBadge } from './badge.js';
import { createFormField } from './form-field.js';
import { createDescriptionList } from './description-list.js';
import { createDetailPanel, openDrawer } from './drawer.js';
import { createEmptyState } from './empty-state.js';

export function createListingLayout({ header, summary, toolbar, table, pagination, detail, className = '' } = {}) {
  const root = element('div', { className: `ds-listing-layout${className ? ` ${className}` : ''}` });
  function slot(name, value, parent = root) {
    if (value === undefined || value === null) return;
    parent.append(element('div', { className: `ds-listing-layout-${name}`, 'data-layout-slot': name }, ...(Array.isArray(value) ? value.flat(Infinity) : [value]).filter(node => node !== undefined && node !== null)));
  }
  slot('header', header); slot('summary', summary); slot('toolbar', toolbar);
  const body = element('div', { className: 'ds-listing-layout-body' });
  const main = element('div', { className: 'ds-listing-layout-main' });
  slot('table', table, main); slot('pagination', pagination, main);
  body.append(main); slot('detail', detail, body); root.append(body);
  return root;
}

const mockCustomers = [
  { name: 'Alex Chen', company: 'Northwind Studio', status: 'Customer' },
  { name: 'Morgan Lee', company: 'Orbit School', status: 'Trial' },
  { name: 'Sam Rivera', company: 'Harbor Works', status: 'Customer' },
  { name: 'Jamie Patel', company: 'Acorn Supply', status: 'Customer' },
  { name: 'Taylor Kim', company: 'Westfield Lab', status: 'Trial' },
  { name: 'Casey Wong', company: 'Forma Services', status: 'Customer' }
];

export function demo(container, { showDetail = true } = {}) {
  let currentPage = 1;
  let query = '';
  const table = element('div');
  const summary = statusMessage();
  const search = element('input', { className: 'ds-input', type: 'search', placeholder: 'Search mock customers', oninput: event => { query = event.target.value; currentPage = 1; update(); } });
  const searchField = createFormField({ label: 'Search customers', control: search });
  const clear = button('Clear search', () => { query = ''; search.value = ''; currentPage = 1; update(); search.focus(); });
  const pagination = createPagination({ total: mockCustomers.length, pageSize: 3, onPageChange: value => { currentPage = value; update(); } });
  function describe(row) { return createDescriptionList({ items: [{ term: 'Contact', value: row.name }, { term: 'Company', value: row.company }, { term: 'Status', value: row.status }, { term: 'Source', value: 'Mock data · no server writes' }] }); }
  function update() {
    const filtered = mockCustomers.filter(row => `${row.name} ${row.company} ${row.status}`.toLowerCase().includes(query.trim().toLowerCase()));
    const visible = filtered.slice((currentPage - 1) * 3, currentPage * 3);
    clear.disabled = !query;
    summary.textContent = `${filtered.length} mock customers · activate a row for its detail drawer.`;
    pagination.setState({ total: filtered.length, page: currentPage });
    const header = element('tr', {}, ...['Company', 'Contact', 'Status'].map(label => element('th', { scope: 'col' }, label)));
    const body = element('tbody', {}, ...visible.map(row => element('tr', {}, element('td', {}, row.company), element('td', {}, row.name), element('td', {}, createBadge({ label: row.status, tone: row.status === 'Customer' ? 'success' : 'info' })))));
    table.replaceChildren(visible.length ? createTable({ caption: 'Mock customer directory', header, body, onRowActivate: index => { const row = visible[index]; openDrawer({ title: `${row.company} (mock)`, content: describe(row), actions: [{ label: 'Close details', onClick: close => close() }] }); } }) : createEmptyState({ title: 'No mock customers found', description: 'Try another name or clear your search.', actionLabel: 'Clear search', onAction: () => { query = ''; search.value = ''; currentPage = 1; update(); search.focus(); } }));
  }
  const layout = createListingLayout({
    header: createCard({ title: 'Customers', description: 'Working search, pagination and row details using canonical components.', actions: createBadge({ label: 'Mock data', tone: 'info' }) }),
    summary,
    toolbar: [searchField.element, clear], table, pagination: pagination.element,
    detail: showDetail ? createDetailPanel({ title: 'Mock customer summary', content: describe(mockCustomers[0]) }) : undefined
  });
  update(); container?.append(layout); return layout;
}

export function render(container) {
  const page = playground(container, { title: 'ListingLayout', description: 'Header, summary, toolbar, table, pagination and optional details. All example records are mock.' });
  function update(showDetail = true) { page.preview.replaceChildren(demo(undefined, { showDetail })); page.setSnippet(guide.example); }
  page.controls.append(toggleControl('Inline detail slot', true, update));
  page.states.append(statePreview('Without detail panel', createListingLayout({ header: createBadge({ label: 'Mock listing', tone: 'info' }), table: createEmptyState({ title: 'No mock records yet', description: 'New demonstration records will appear in this listing.' }), pagination: createPagination({ total: 0 }).element })));
  update();
}

export const guide = {
  purpose: 'Arrange the reusable parts of a record listing without taking ownership of search, table state, pagination or dialog behavior.',
  props: ['createListingLayout({header, summary, toolbar, table, pagination, detail, className}) returns a DOM node.', 'Every slot accepts an existing DOM node or arrays of nodes; null and undefined omit the slot. Nodes are moved, not cloned or restyled.', 'header holds the page heading/actions; summary holds counts or metrics; toolbar holds shared search/filter controls; table holds the canonical Table; pagination holds createPagination(...).element.', 'detail is optional inline DetailPanel content or a shared drawer launcher. For overlays call openDrawer; the layout never invents dialog behavior.', 'className appends caller classes. Wrappers expose data-layout-slot and ds-listing-layout-<slot>; table/pagination are grouped in ds-listing-layout-main, alongside the detail slot.'],
  variants: ['Full-width listing; listing with an inline detail column; shared modal drawer on row activation.'],
  states: ['Populated, filtered, paged, no matches, omitted optional details. Supplied shared components own loading and error states.'],
  keyboard: ['The layout preserves the DOM order and creates no focus stops.', 'In the demo Tab reaches search, pagination and rows; Enter or Space opens shared Drawer details; Escape closes and returns focus.'],
  accessibility: ['Use a caption on the canonical table and persistent labels on search/filter controls.', 'Inline details do not trap focus. Shared Drawer owns its dialog label, focus trap, Escape handling and focus return.'],
  tokens: ['--space-3, --space-4, --space-6; child Table, Pagination, FormField, Badge and Drawer tokens.'],
  responsive: ['A detail column occupies one third of wide listings and stacks below the table on narrower containers.', 'Toolbar controls wrap; canonical Table owns its local horizontal scrolling. No page-width fixed column is introduced.'],
  do: ['Compose existing Table, Pagination, FormField and DetailPanel/Drawer components.', 'Keep pagination and row activation connected to the same filtered mock dataset.'],
  dont: ['Do not implement a second table or dialog within the template.', 'Do not apply modal roles or focus locking to an inline detail slot.'],
  example: 'container.append(createListingLayout({\n  header: pageHeading, summary: resultCount, toolbar: filterControls,\n  table: customerTable, pagination: pager.element, detail: detailPanel,\n  className: "customer-listing"\n}));'
};
