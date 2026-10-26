import { registry } from '../components/registry.js';
import { element as el, button, customSelect, copyText, renderGuide, field, openModal } from '../components/playground.js';
import { createChart } from '../components/chart.js';
import { icon } from './icons.js';
import { createTable } from '../components/table.js';
import { createPagination } from '../components/pagination.js';
import { createDescriptionList } from '../components/description-list.js';
import { createPill } from '../components/pill.js';
import { createProgressBar } from '../components/progress-bar.js';
import { createKpiCard } from '../components/kpi-card.js';
import { createCard } from '../components/card.js';
import { createMasonry } from '../components/masonry.js';
import { createDashboardLayout } from '../components/dashboard-layout.js';
import { createListingLayout } from '../components/listing-layout.js';
import { createDetailLayout } from '../components/detail-layout.js';
import { createMasterDetailLayout } from '../components/master-detail-layout.js';
import { demo as workspaceDemo } from '../components/workspace-layout.js';
import { createTabs } from '../components/tabs.js';
import { createAuditTimeline } from '../components/audit-timeline.js';
import { openConfirmDialog } from '../components/confirm-dialog.js';
import { createMockCustomers, createCustomerEditor, renderPatterns } from './patterns.js';

const chartChoices = [
  ['line', 'Trend over time'], ['bar', 'Compare categories'], ['stacked', 'Parts of totals across categories'], ['area', 'Volume over time'], ['donut', 'Share of a whole (few slices)'], ['sparkline', 'Tiny trend in tables or KPIs']
];
const decisions = [
  ['Selection controls', [['Select', 'A short, known set of mutually exclusive options.'], ['Combobox', 'A long searchable set; single or multiple values.'], ['Multi-select', 'Several independent choices, shown as removable chips in Combobox.'], ['Radio', 'A few mutually exclusive choices that should all remain visible.']]],
  ['Overlay controls', [['Modal', 'A focused decision or short editing task that blocks the workspace.'], ['Drawer', 'Inspect or edit details while retaining listing context.'], ['Popover', 'A short contextual menu or supplemental control.']]],
  ['Presenting records', [['Table', 'Compare structured values across many records.'], ['Card list', 'Scan heterogeneous content or previews.']]]
];
const layoutExamples = [
  ['Dashboard/Bento', 'Use to scan key metrics and trends. Slots: header, metrics, content tiles with 12-column spans, footer.', dashboardPattern],
  ['Listing', 'Use to search and compare records. Slots: header, summary, toolbar, table, pagination and optional detail.', listingPattern],
  ['Form', 'Use for one focused edit. Slots: header, notice, FormSection content and a sticky action bar.', formPattern],
  ['Detail', 'Use to inspect one record. Slots: header, summary, shared tabs, content, side panel and audit timeline.', detailPattern],
  ['MasterDetail', 'Use to inspect records in context. Slots: list and detail; keyboard-resizable divider, persisted width and separate phone views.', masterDetailPattern],
  ['Workspace', 'Use for browse/preview/inspect tasks. Slots: three labelled panes with persisted keyboard-resizable sizes and compact pane tabs.', workspaceDemo],
  ['Masonry', 'Use for independent variable-height cards. Slot: items in source order; avoid when records must be compared in rows.', masonryPattern]
];
const terms = [['Token', 'A named design value.'], ['Component', 'A reusable control.'], ['Layout', 'A page structure.'], ['Pattern', 'Components combined for a task.'], ['Design Kit', 'A swappable token pack, surface style and layout preset inside the system.'], ['Design System', 'Tokens, appearance, foundations, components, layouts, patterns, extensions and documentation.']];
const layers = ['L1 Design Tokens', 'L2 Appearance axes', 'L3 Foundations', 'L4 Components', 'L5 Layouts', 'L6 Patterns', 'L7 Product extensions', 'L8 Pages'];
export function renderLearn(main, tokens) {
  const panel = el('section', { className: 'learn-panel', role: 'tabpanel', id: 'learn-panel', tabindex: '0' });
  const tabs = el('div', { className: 'ds-tabs ds-tab-list learn-tabs', role: 'tablist', 'aria-label': 'Guide sections' });
  const names = ['Components', 'Design Tokens', 'Guidelines'];
  let activeIndex = -1;
  let activating = false;
  async function activate(index) {
    if (activating || index === activeIndex) return false;
    activating = true;
    try {
      if (activeIndex >= 0 && typeof window.resolveDirty === 'function' && !(await window.resolveDirty())) return false;
      activeIndex = index;
      [...tabs.children].forEach((tab, n) => { tab.setAttribute('aria-selected', String(n === index)); tab.tabIndex = n === index ? 0 : -1; tab.classList.toggle('active', n === index); });
      panel.setAttribute('aria-labelledby', `learn-tab-${index}`);
      panel.replaceChildren();
      if (index === 0) components(panel);
      else if (index === 1) foundations(panel, tokens);
      else guidelines(panel);
      return true;
    } finally { activating = false; }
  }
  names.forEach((name, index) => tabs.append(el('button', { type: 'button', role: 'tab', id: `learn-tab-${index}`, 'aria-controls': panel.id, className: 'ds-tab', onclick: () => { void activate(index); }, onkeydown: async event => {
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % 3;
    else if (event.key === 'ArrowLeft') next = (index + 2) % 3;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = 2;
    else return;
    event.preventDefault(); if (await activate(next)) tabs.children[next].focus();
  } }, name)));
  main.replaceChildren(el('div', { className: 'learn-page' }, el('header', { className: 'page-heading learn-heading' }, el('div', {}, el('h1', {}, 'Design System Guide'), el('p', {}, 'Reusable components, design tokens and practical guidelines for a consistent product experience.'))), tabs, panel));
  activate(0);
}
function components(panel) {
  const search = el('input', { type: 'search', className: 'ds-input', placeholder: 'Search components', 'aria-label': 'Search components' });
  const searchField = field('Search components', search);
  const grid = el('div', { className: 'learn-grid' });
  let category = 'All';
  const filter = customSelect({ label: 'Component category', value: 'All', options: ['All', ...new Set(registry.map(entry => entry.category))].map(value => ({ value, label: value })), onChange: value => { category = value; update(); } });
  const count = el('p', { role: 'status', className: 'learn-count' });
  function update() {
    const entries = registry.filter(entry => (category === 'All' || entry.category === category) && `${entry.label} ${entry.guide.purpose}`.toLowerCase().includes(search.value.toLowerCase()));
    grid.replaceChildren(); count.textContent = `${entries.length} components`;
    for (const entry of entries) {
      const demo = el('div', { className: 'learn-demo' });
      const docs = el('div', { hidden: true });
      const toggle = button('Usage and props', () => { docs.hidden = !docs.hidden; toggle.setAttribute('aria-expanded', String(!docs.hidden)); });
      toggle.setAttribute('aria-expanded', 'false');
      docs.append(renderGuide(entry.guide));
      const props = el('table', { className: 'learn-props' }, el('caption', {}, `${entry.label} props / API`), el('tbody', {}, ...entry.guide.props.map(value => el('tr', {}, el('th', { scope: 'row' }, 'API'), el('td', {}, value)))));
      docs.prepend(props);
      const feedback = el('span', { role: 'status' });
      const copy = button('Copy snippet', async () => { try { await copyText(entry.guide.example); feedback.textContent = 'Copied'; } catch { feedback.textContent = 'Copy unavailable; select the example in usage.'; } });
      const card = el('article', { className: 'card learn-card' }, el('header', { className: 'learn-card-heading' }, el('span', { className: 'quick-icon', 'aria-hidden': 'true' }), el('h2', {}, entry.label)), el('p', { className: 'muted' }, entry.guide.purpose), demo, el('div', { className: 'component-row' }, toggle, copy, feedback), docs);
      card.querySelector('.quick-icon').innerHTML = icon('components');
      grid.append(card); entry.demo(demo);
    }
    if (!entries.length) grid.append(el('p', {}, 'No components match. Clear the search or choose another category.'));
  }
  search.addEventListener('input', update);
  panel.append(el('div', { className: 'learn-filters' }, searchField, el('div', { className: 'component-field' }, el('label', { for: filter.id }, 'Category'), filter.element)), count, grid); update();
}
function colorChannels(value) { const values = value.match(/[\d.]+/g)?.map(Number); return values?.length >= 3 ? values.slice(0, 3).map(x => x / 255) : null; }
function ratio(a, b) {
  const lum = values => values.map(x => x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4).reduce((sum, x, index) => sum + x * [.2126, .7152, .0722][index], 0);
  const x = lum(a), y = lum(b); return ((Math.max(x, y) + .05) / (Math.min(x, y) + .05)).toFixed(2);
}
function foundations(panel, tokens) {
  panel.append(el('p', {}, `Current appearance: ${document.documentElement.dataset.theme} × ${document.documentElement.dataset.palette} × ${document.documentElement.dataset.kit}. Ratios resolve the current live CSS values, including local token overrides.`));
  const pairs = el('section', { className: 'card learn-card' }, el('h2', {}, 'Live contrast on surface'));
  const probe = el('span', { hidden: true }); panel.append(probe);
  function resolve(name) { probe.style.color = `var(--${name})`; return colorChannels(getComputedStyle(probe).color); }
  for (const name of ['text', 'muted', 'accent-text', ...Array.from({ length: 8 }, (_, i) => `series-${i + 1}`)]) {
    const front = resolve(name), back = resolve('surface');
    pairs.append(el('p', {}, `--${name} / --surface: ${front && back ? ratio(front, back) + ':1' : 'unavailable'}`));
  }
  panel.append(pairs);
  fetch(new URL('../tokens/primitives.json', import.meta.url)).then(response => { if (!response.ok) throw new Error('Token scales unavailable'); return response.json(); }).then(primitives => {
    if (panel.getAttribute('aria-labelledby') !== 'learn-tab-1') return;
    const scales = el('section', { className: 'card learn-card' }, el('h2', {}, 'Primitive colour scales'));
    for (const [family, steps] of Object.entries(primitives.color)) {
      if (typeof steps !== 'object') continue;
      const row = el('div', { className: 'component-row' }, el('strong', {}, family));
      for (const [step, value] of Object.entries(steps)) {
        const control = button(`${family}.${step}`, async () => { try { await copyText(`color.${family}.${step}`); control.setAttribute('aria-label', `Copied color.${family}.${step}`); } catch { control.setAttribute('aria-label', `Copy unavailable: color.${family}.${step}`); } });
        const sample = el('span', { className: 'learn-token-preview', 'aria-hidden': 'true' }); sample.style.background = value; control.prepend(sample); row.append(control);
      }
      scales.append(row);
    }
    panel.append(scales);
  }).catch(() => panel.append(el('p', { role: 'status' }, 'Primitive scales unavailable. Reload online to cache token sources.')));
  const grid = el('div', { className: 'learn-grid' }); panel.append(grid);
  for (const [group, values] of Object.entries(tokens)) {
    const card = el('section', { className: 'card learn-card' }, el('h2', {}, group));
    const status = el('span', { role: 'status' });
    for (const name of Object.keys(values)) {
      const swatch = button(`--${name}`, async () => { try { await copyText(`--${name}`); status.textContent = `Copied --${name}`; } catch { status.textContent = `Copy unavailable: --${name}`; } });
      swatch.classList.add('learn-token');
      const preview = el('span', { className: 'learn-token-preview', 'aria-hidden': 'true' });
      if (group === 'Color') preview.style.background = `var(--${name})`;
      else if (group === 'Spacing') preview.style.width = `var(--${name})`;
      else if (group === 'Radius') preview.style.borderRadius = `var(--${name})`;
      else if (group === 'Shadow') preview.style.boxShadow = `var(--${name})`;
      else if (name.startsWith('font-size')) { preview.textContent = 'Aa'; preview.style.fontSize = `var(--${name})`; }
      else preview.textContent = getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();
      swatch.prepend(preview); card.append(swatch);
    }
    card.append(status); grid.append(card);
  }
}
function guidelines(panel) {
  const grid = el('div', { className: 'learn-grid' }); panel.append(grid);
  for (const [title, choices] of decisions) grid.append(el('section', { className: 'card learn-card' }, el('h2', {}, title), ...choices.map(([name, reason]) => el('p', {}, el('strong', {}, `${name}: `), reason))));
  const chart = el('section', { className: 'card learn-card learn-wide' }, el('h2', {}, 'What do you want to show?'));
  const recommendation = el('p', { role: 'status' }), example = el('div');
  function choose(type) { recommendation.textContent = `Recommended: ${type} — ${chartChoices.find(row => row[0] === type)[1]}. Mock example.`; example.replaceChildren(createChart({ type, title: 'Mock chart recommendation', labels: ['Jan', 'Feb', 'Mar', 'Apr'], series: [{ name: 'Mock customers', values: [12, 18, 15, 26] }, { name: 'Mock trials', values: [8, 11, 9, 14] }] })); }
  const picker = customSelect({ label: 'Choose a chart by purpose', value: 'line', options: chartChoices.map(([value, label]) => ({ value, label })), onChange: choose });
  const chartList = el('ul', { className: 'learn-chart-choices' }, ...chartChoices.map(([name, reason]) => el('li', {}, chartChoiceIcon(name), el('div', {}, el('strong', {}, name === 'stacked' ? 'Stacked bar' : name[0].toUpperCase() + name.slice(1)), el('span', {}, reason)))));
  chart.append(el('div', { className: 'component-field' }, el('label', { for: picker.id }, 'Choose a chart by purpose'), picker.element), recommendation, example, chartList); grid.append(chart); choose('line');
  grid.append(el('header', { className: 'learn-section-heading learn-wide' }, el('h2', {}, 'Layout templates'), el('p', {}, 'Live L5 templates composed from the same shared layouts used by the Design kits showcase. All example records are mock.')));
  for (const [name, purpose, render] of layoutExamples) {
    const preview = el('div', { className: 'learn-pattern' });
    render(preview);
    grid.append(el('section', { className: 'card learn-card learn-pattern-card learn-wide' }, el('header', { className: 'learn-pattern-heading' }, el('h2', {}, name), el('p', {}, purpose)), preview));
  }
  const workflow = el('div', { className: 'learn-pattern' });
  grid.append(el('section', { className: 'card learn-card learn-wide learn-workflows' }, el('header', { className: 'learn-pattern-heading' }, el('h2', {}, 'Patterns'), el('p', {}, 'Live L6 workflows compose shared enterprise components and templates around one mock customer dataset. No backend is connected.')), workflow));
  renderPatterns(workflow);
  grid.append(el('section', { className: 'card learn-card' }, el('h2', {}, 'Appearance guide'), el('p', {}, 'Theme controls light and dark. Palette controls accents. Kit controls surface treatment and layout defaults. Density controls spacing; these axes stay independent.'), el('a', { href: '#/settings/appearance' }, 'Change appearance')));
  grid.append(el('section', { className: 'card learn-card' }, el('h2', {}, 'Accessibility checklist'), el('ul', {}, ...['Visible labels and error associations', 'Keyboard access and visible focus', 'Text contrast ≥4.5:1; marks and boundaries ≥3:1', '44px phone targets; 16px phone inputs', 'Charts include summaries and data tables', 'Respect reduced motion; never encode meaning only with colour'].map(value => el('li', {}, value)))));
  grid.append(el('section', { className: 'card learn-card' }, el('h2', {}, 'Terminology'), ...terms.map(([name, value]) => el('p', {}, el('strong', {}, `${name}: `), value)), el('h3', {}, 'Layer hierarchy'), el('ol', {}, ...layers.map(value => el('li', {}, value))), el('p', {}, 'Upper layers depend on lower layers. Documentation, governance, quality gates and PWA cross all layers.')));
}

const mockAccounts = createMockCustomers();
function accountStatus(account) { return createPill({ label: account.status, tone: account.status === 'Active' ? 'success' : 'info', dot: true, size: 'small' }); }
function accountDetails(account) {
  return createDescriptionList({ items: [
    { term: 'Customer', value: account.name },
    { term: 'Status', value: accountStatus(account) },
    { term: 'Owner', value: account.owner },
    { term: 'Plan', value: account.plan },
    { term: 'Capacity', value: createProgressBar({ value: account.usage, label: `${account.name} mock capacity used`, showValue: true }) }
  ] });
}
function listingPattern(preview) {
  const search = el('input', { type: 'search', className: 'ds-input', placeholder: 'Search mock customers' });
  const results = el('div', { className: 'learn-pattern-results' });
  let page = 1, pageSize = 3;
  const pagination = createPagination({ total: mockAccounts.length, pageSize, pageSizes: [2, 3], onPageChange(value) { page = value; update(); }, onPageSizeChange(value) { pageSize = value; page = 1; update(); } });
  pagination.element.setAttribute('aria-label', 'Mock customer pagination');
  function update() {
    const matches = mockAccounts.filter(account => `${account.name} ${account.status} ${account.owner}`.toLowerCase().includes(search.value.trim().toLowerCase()));
    const visible = matches.slice((page - 1) * pageSize, page * pageSize);
    const body = el('tbody', {}, ...visible.map(account => el('tr', {}, el('td', {}, el('strong', {}, account.name)), el('td', {}, accountStatus(account)), el('td', {}, account.owner))));
    if (!visible.length) body.append(el('tr', {}, el('td', { colspan: '3' }, 'No mock customers match your search.')));
    results.replaceChildren(createTable({ caption: 'Mock customers · Select a row for details', header: el('tr', {}, ...['Customer', 'Status', 'Owner'].map(label => el('th', { scope: 'col' }, label))), body, className: 'learn-compact-table', onRowActivate: visible.length ? index => {
      const account = visible[index];
      openModal({ title: `${account.name} · Mock customer`, content: accountDetails(account), actions: [{ label: 'Close', onClick: close => close() }] });
    } : undefined }));
    pagination.setState({ total: matches.length, page, pageSize });
  }
  search.addEventListener('input', () => { page = 1; update(); });
  preview.append(createListingLayout({ header: el('h3', {}, 'Mock customer directory'), toolbar: field('Find mock customers', search), table: results, pagination: pagination.element }));
  update();
}
function formPattern(preview) {
  preview.append(createCustomerEditor({ initial: mockAccounts[0] }).element);
}
function detailPattern(preview) {
  let progress = 60;
  const detail = el('div');
  const feedback = el('p', { className: 'learn-feedback', role: 'status' }, 'Mock onboarding · Three of five steps complete.');
  const complete = button('Complete next step', () => {
    progress = Math.min(100, progress + 20);
    update();
    feedback.textContent = progress === 100 ? 'Mock onboarding complete.' : 'Mock onboarding · Four of five steps complete.';
  });
  function update() {
    detail.replaceChildren(createDescriptionList({ items: [
      { term: 'Customer', value: 'Acme · Mock account' },
      { term: 'Status', value: createPill({ label: progress === 100 ? 'Complete' : 'In progress', tone: progress === 100 ? 'success' : 'info', dot: true }) },
      { term: 'Owner', value: 'Olivia' },
      { term: 'Onboarding', value: createProgressBar({ value: progress, label: 'Mock onboarding progress', showValue: true }) }
    ] }));
    complete.disabled = progress === 100;
  }
  const audit = createAuditTimeline({ label: 'Mock onboarding audit history', events: [{ actor: 'Olivia (mock)', action: 'created', target: 'the onboarding plan', time: '26 Oct, 09:00', dateTime: '2026-10-26T09:00:00Z' }] });
  const tabs = createTabs({ label: 'Mock customer detail sections', items: [{ label: 'Account', content: accountDetails(mockAccounts[0]) }, { label: 'Activity', content: audit }] });
  const reset = button('Reset mock onboarding', () => openConfirmDialog({ title: 'Reset mock onboarding?', description: 'Restore this local mock plan to three completed steps. No server record is changed.', destructive: true, confirmLabel: 'Reset mock onboarding', onConfirm() { progress = 60; update(); feedback.textContent = 'Mock onboarding reset to three of five steps.'; } }));
  preview.append(createDetailLayout({
    header: el('h3', {}, 'Acme · Mock account'),
    summary: feedback,
    tabs,
    content: createCard({ title: 'Mock onboarding', content: [detail, el('div', { className: 'learn-pattern-actions' }, complete, reset)] }),
    sidePanel: createCard({ title: 'Account context', description: 'Mock customer · Local demonstration', content: createDescriptionList({ items: [{ term: 'Plan', value: 'Business' }, { term: 'Owner', value: 'Olivia' }] }) }),
    timeline: createAuditTimeline({ label: 'Mock record history', events: [{ actor: 'Olivia (mock)', action: 'reviewed', target: 'the account', time: '26 Oct, 10:00', dateTime: '2026-10-26T10:00:00Z' }] })
  }));
  update();
}
function dashboardPattern(preview) {
  const canvas = el('div');
  let periodValue = 'month';
  let variant = 'bento';
  const period = customSelect({ label: 'Reporting period', value: periodValue, options: [{ value: 'month', label: 'This month' }, { value: 'quarter', label: 'This quarter' }], onChange(value) { periodValue = value; update(); } });
  const layoutChoice = customSelect({ label: 'Dashboard layout variant', value: variant, options: [{ value: 'grid', label: 'Balanced 12-column grid' }, { value: 'bento', label: 'Bento' }], onChange(value) { variant = value; update(); } });
  function update() {
    const quarterly = periodValue === 'quarter';
    const trend = createChart({ headingLevel: 4, type: 'line', title: `Mock customer trend · ${quarterly ? 'quarter' : 'month'}`, labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'], series: [{ name: 'Customers', values: quarterly ? [26, 34, 42, 54] : [12, 18, 15, 26] }] });
    canvas.replaceChildren(createDashboardLayout({ variant, header: el('h3', {}, 'Mock customer dashboard'), metrics: [
      createKpiCard({ label: 'Mock customers', value: quarterly ? '54' : '26', trend: quarterly ? '+28' : '+8' }),
      createKpiCard({ label: 'Mock active accounts', value: quarterly ? '42' : '20', trend: 'Healthy', trendTone: 'success' }),
      createKpiCard({ label: 'Mock retention', value: quarterly ? '94%' : '92%', trend: quarterly ? '+4%' : '+2%' })
    ], content: [{ element: createCard({ title: 'Mock customer growth', content: trend }), span: variant === 'bento' ? 8 : 6 }, { element: createCard({ title: 'Mock account summary', content: accountDetails(mockAccounts[0]) }), span: variant === 'bento' ? 4 : 6 }] }));
  }
  preview.append(el('div', { className: 'learn-pattern-actions' }, el('div', { className: 'component-field' }, el('label', { for: period.id }, 'Reporting period'), period.element), el('div', { className: 'component-field' }, el('label', { for: layoutChoice.id }, 'Layout variant'), layoutChoice.element)), canvas);
  update();
}
function masterDetailPattern(preview) {
  const list = el('div', { className: 'learn-master-list', role: 'group', 'aria-label': 'Select a mock customer' });
  const detail = el('section', { className: 'learn-master-detail', 'aria-label': 'Selected mock customer details', 'aria-live': 'polite' });
  let layout;
  const buttons = mockAccounts.map(account => button(account.name, () => { select(account); layout.showDetail(); }, 'ghost'));
  function select(account) {
    buttons.forEach((control, index) => control.setAttribute('aria-pressed', String(mockAccounts[index] === account)));
    detail.replaceChildren(el('h3', {}, account.name), accountDetails(account));
  }
  list.append(...buttons);
  layout = createMasterDetailLayout({ list, detail, storageKey: 'forma-learn-master-detail-widths', listLabel: 'Mock customers', detailLabel: 'mock customer details' });
  preview.append(layout.element);
  select(mockAccounts[0]);
}
function masonryPattern(preview) {
  const notes = [
    ['Project brief', 'Keep the primary customer task clear.', 'A focused page makes the next action easy to find.'],
    ['Review checklist', 'Check labels, keyboard access and readable contrast before sharing a design.', 'Review the smallest phone layout and the widest desktop layout in both themes.'],
    ['Team update', 'Design review is ready.', 'Three mock accounts are ready for a local walkthrough.'],
    ['Research notes', 'People scan independent notes at different speeds. Variable-height cards preserve that natural rhythm without forcing content into equal-height rows.', 'Use a table instead whenever values must be compared across records.'],
    ['Next milestone', 'Review shared components in every appearance.', 'Tokens keep spacing, type and surfaces consistent across the collection.']
  ];
  const items = notes.map(([title, summary, expanded]) => {
    const more = el('p', { className: 'learn-note-more', hidden: true }, expanded);
    const toggle = button('Read more', () => {
      more.hidden = !more.hidden;
      toggle.textContent = more.hidden ? 'Read more' : 'Show less';
      toggle.setAttribute('aria-expanded', String(!more.hidden));
      toggle.setAttribute('aria-label', `${more.hidden ? 'Read more' : 'Show less'} about ${title.toLowerCase()}`);
    }, 'ghost', { 'aria-expanded': 'false', 'aria-label': `Read more about ${title.toLowerCase()}` });
    return createCard({ title, description: 'Mock note', content: [el('p', {}, summary), more], footer: toggle });
  });
  preview.append(createMasonry({ items, label: 'Five mock project notes' }));
}
function chartChoiceIcon(type) {
  const shapes = {
    line: '<path d="m3 17 6-7 5 3 7-9"/>',
    bar: '<path d="M4 20V11h3v9m4 0V5h3v15m4 0v-8h3v8"/>',
    stacked: '<path d="M4 20V8h5v12m6 0V3h5v17M4 14h5m6-4h5"/>',
    area: '<path d="m3 16 6-7 5 3 7-8v16H3Z"/>',
    donut: '<circle cx="12" cy="12" r="8"/><path d="M12 4v8l6 5"/>',
    sparkline: '<path d="m2 16 4-2 4 3 5-9 3 3 4-7"/>'
  };
  const mark = el('span', { className: `learn-chart-symbol learn-chart-symbol-${type}`, 'aria-hidden': 'true' });
  mark.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${shapes[type]}</svg>`;
  return mark;
}
