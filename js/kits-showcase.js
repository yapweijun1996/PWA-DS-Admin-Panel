import { element, button, customSelect, openModal, uniqueId, onDetach } from '../components/playground.js';
import { createCard } from '../components/card.js';
import { createKpiCard } from '../components/kpi-card.js';
import { createBadge } from '../components/badge.js';
import { createFilterChip } from '../components/filter-chip.js';
import { createAvatar } from '../components/avatar.js';
import { createAvatarStack } from '../components/avatar-stack.js';
import { createProgressBar } from '../components/progress-bar.js';
import { createAlert } from '../components/alert.js';
import { openDrawer } from '../components/drawer.js';
import { createDescriptionList } from '../components/description-list.js';
import { createPagination } from '../components/pagination.js';
import { createTable } from '../components/table.js';
import { createChart } from '../components/chart.js';
import { createCombobox } from '../components/combobox.js';

const team = ['Olivia Rhye', 'Phoenix Baker', 'Lana Steiner', 'Demi Wilkinson', 'Drew Cano', 'Andi Lane'].map(name => ({ name }));
const regionOptions = [
  { value: 'US', label: 'United States (US)', keywords: ['USA', 'America'], group: 'Americas' },
  { value: 'AU', label: 'Australia (AU)', keywords: ['Oceania'], group: 'Asia Pacific' },
  { value: 'SG', label: 'Singapore (SG)', keywords: ['Asia'], group: 'Asia Pacific' },
  { value: 'GB', label: 'United Kingdom (GB)', keywords: ['UK', 'Britain', 'England'], group: 'Europe' },
];
const seeds = [
  ['Catalog', 'catalog.example', 'Content curating app', 'Bring your news into one place', 'US', 78],
  ['Circoole', 'circoole.example', 'Design software', 'A lightweight design workspace', 'AU', 64],
  ['Command', 'command.example', 'Data prediction', 'AI and machine learning data', 'GB', 42],
  ['Hourglass', 'hourglass.example', 'Productivity app', 'Time management for growing teams', 'SG', 86],
  ['Layers', 'layers.example', 'Web app integrations', 'Connect apps seamlessly', 'US', 33],
  ['Quotient', 'quotient.example', 'Sales CRM', 'Web-based sales management', 'AU', 56],
  ['Sisyphus', 'sisyphus.example', 'Automation and workflow', 'Time tracking, invoices and expenses', 'SG', 72],
  ['Northstar', 'northstar.example', 'Team planning', 'Keep projects moving together', 'GB', 91],
  ['Acme', 'acme.example', 'Business operations', 'One workspace for daily operations', 'US', 47],
  ['Focal', 'focal.example', 'Customer insights', 'Understand every customer journey', 'AU', 24],
  ['Orbit', 'orbit.example', 'Community platform', 'A home for your community', 'SG', 63],
  ['Capsule', 'capsule.example', 'Knowledge management', 'Useful answers, all in one place', 'GB', 35],
];
const customers = seeds.map(([company, domain, about, description, region, usage], index) => ({
  id: `MOCK-${String(index + 1).padStart(3, '0')}`, company, domain, about, description, region, usage,
  status: index % 3 === 1 ? 'Churned' : 'Customer', members: 3 + index % 6, contact: team[index % team.length].name,
  email: `hello@${domain}`, plan: index % 3 === 0 ? 'Enterprise' : 'Business', notes: '', source: 'Reference dataset',
}));
const activity = [{ title: 'Reference workspace created', description: '12 mock customers are ready to explore.', time: 'Initial mock activity' }];
const initialProfile = () => ({ company: 'Forma Studio', domain: 'forma.example', contact: 'Olivia Rhye', email: 'olivia@forma.example', region: 'US', plan: 'Business', notes: '', updates: true });
const state = { screen: 'dashboard', query: '', status: 'all', region: 'all', page: 1, pageSize: 5, ascending: true, selected: new Set(), profile: initialProfile(), draft: initialProfile(), editingId: null, imported: 0 };
let activeDispose;
const isDirty = () => JSON.stringify(state.draft) !== JSON.stringify(state.profile);

function downloadCSV(rows, filename) {
  const keys = ['company', 'domain', 'contact', 'email', 'region', 'status'];
  const quote = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const blob = new Blob([keys.join(','), '\r\n', rows.map(row => keys.map(key => quote(row[key])).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = element('a', { href: url, download: filename });
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function parseCSV(source) {
  const records = []; let row = []; let value = ''; let quoted = false;
  const input = source.replace(/^\uFEFF/, '');
  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (character === '"') {
      if (quoted && input[index + 1] === '"') { value += '"'; index += 1; }
      else quoted = !quoted;
    } else if (character === ',' && !quoted) { row.push(value.trim()); value = ''; }
    else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && input[index + 1] === '\n') index += 1;
      row.push(value.trim()); if (row.some(Boolean)) records.push(row); row = []; value = '';
    } else value += character;
  }
  if (quoted) throw new Error('A quoted CSV field is not closed.');
  row.push(value.trim()); if (row.some(Boolean)) records.push(row);
  const headers = records.shift()?.map(header => header.toLowerCase());
  if (!headers || !['company', 'domain', 'contact', 'email', 'region', 'status'].every(key => headers.includes(key))) throw new Error('Use the sample CSV headers: company, domain, contact, email, region, status.');
  if (!records.length || records.length > 200) throw new Error('Choose a CSV containing between 1 and 200 customers.');
  return records.map((values, index) => {
    const record = Object.fromEntries(headers.map((key, column) => [key, values[column] || '']));
    if (!record.company || !record.contact || !validDomain(record.domain) || !validEmail(record.email) || !['US', 'AU', 'GB', 'SG'].includes(record.region) || !['Customer', 'Churned'].includes(record.status)) throw new Error(`Row ${index + 2}: provide a company, contact, valid domain/email, region US/AU/GB/SG and status Customer/Churned.`);
    return record;
  });
}
const validEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const validDomain = value => /^(?:[a-z\d](?:[a-z\d-]*[a-z\d])?\.)+[a-z]{2,}$/i.test(value);

export function renderShowcase(main, { prefs = {}, savePreference = () => {}, resolveDirty: resolveAppDirty, notify = () => {} } = {}) {
  activeDispose?.();
  let disposed = false; let resolving; let drawer; let guardDialog;
  const root = element('section', { className: 'showcase', 'aria-label': 'Design kit reference screens' });
  const feedback = element('p', { className: 'showcase-feedback', role: 'status', 'aria-live': 'polite' });
  const announce = message => { feedback.textContent = message; notify(message); };
  const screenHost = element('div', { className: 'showcase-screen' });
  const screenId = uniqueId('showcase-screen'); screenHost.id = screenId;
  const screenButtons = new Map();
  const kitButtons = new Map();
  const tabs = element('div', { className: 'ds-tab-list showcase-tabs', role: 'tablist', 'aria-label': 'Reference screens' });
  const kitPicker = element('div', { className: 'showcase-kit-picker', role: 'group', 'aria-label': 'Design kit' });
  for (const [name, label] of [['enterprise', 'Enterprise'], ['liquid', 'Liquid glass'], ['ops', 'Operations']]) {
    const control = button(label, () => {
      savePreference('kit', name);
      for (const [key, item] of kitButtons) item.setAttribute('aria-pressed', String(key === name));
    }, 'secondary', { 'aria-pressed': String((prefs.kit || 'enterprise') === name) });
    kitButtons.set(name, control); kitPicker.append(control);
  }
  async function switchScreen(name, focus = false) {
    if (name !== state.screen && isDirty() && !(await (resolveAppDirty ? resolveAppDirty() : resolveFormDirty()))) return false;
    state.screen = name; drawScreen();
    if (focus) screenButtons.get(name).focus();
    return true;
  }
  for (const [name, label] of [['dashboard', 'Dashboard'], ['customers', 'Customers'], ['form', 'Customer form']]) {
    const control = element('button', { type: 'button', id: `${screenId}-${name}`, className: 'ds-tab', role: 'tab', 'aria-controls': screenId, onclick: () => switchScreen(name) }, label);
    screenButtons.set(name, control); tabs.append(control);
  }
  tabs.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const names = [...screenButtons.keys()]; const current = names.indexOf(state.screen);
    const index = event.key === 'Home' ? 0 : event.key === 'End' ? names.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + names.length) % names.length;
    switchScreen(names[index], true);
  });
  root.append(
    element('header', { className: 'showcase-intro' }, element('div', {}, element('p', { className: 'showcase-eyebrow' }, 'ONE SYSTEM · THREE PERSPECTIVES'), element('h1', {}, 'Made for your next workspace'), element('p', {}, 'Compare the same working screens. Change the kit without changing the components.')), createBadge({ label: 'Mock workspace', tone: 'info', dot: true })),
    element('div', { className: 'showcase-controls' }, element('div', {}, element('strong', {}, 'Choose your design kit'), element('p', {}, 'Theme, palette and density remain independent.')), kitPicker), tabs, feedback, screenHost);
  main.replaceChildren(root);

  function markDirty() {
    window.appDirty = isDirty();
    window.dispatchEvent(new CustomEvent('app:dirty', { detail: { source: 'showcase', dirty: isDirty() } }));
  }
  function drawScreen() {
    for (const [key, control] of screenButtons) { control.setAttribute('aria-selected', String(key === state.screen)); control.tabIndex = key === state.screen ? 0 : -1; }
    screenHost.setAttribute('role', 'tabpanel'); screenHost.setAttribute('aria-labelledby', `${screenId}-${state.screen}`);
    screenHost.replaceChildren(state.screen === 'dashboard' ? dashboardScreen() : state.screen === 'customers' ? customersScreen() : formScreen());
  }
  function pageHeading(title, description, actions = []) {
    return element('header', { className: 'showcase-page-heading' }, element('div', {}, element('h2', {}, title), element('p', {}, description)), element('div', { className: 'showcase-actions' }, actions));
  }
  function showMetric(label, value, explanation) {
    openModal({ title: `${label} · mock data`, content: createDescriptionList({ items: [{ term: 'Current value', value }, { term: 'Calculation', value: explanation }, { term: 'Storage', value: 'In-memory reference data. No server writes.' }] }), actions: [{ label: 'Close', onClick: close => close() }] });
  }
  function kpis() {
    const total = customers.length; const members = customers.reduce((sum, row) => sum + row.members, 0); const active = customers.filter(row => row.status === 'Customer').length;
    return element('div', { className: 'showcase-kpis' },
      createKpiCard({ label: 'Total customers', value: String(total), trend: `${state.imported} imported this session`, trendTone: 'neutral', content: createChart({ type: 'sparkline', title: 'Mock customer trend', labels: ['Jan', 'Feb', 'Mar', 'Apr'], series: [{ name: 'Mock customers', values: [5, 8, 9, total] }] }), menuItems: [{ label: 'How this is calculated', action: () => showMetric('Total customers', total, 'Count of every customer in the mock workspace.') }] }),
      createKpiCard({ label: 'Team members', value: String(members), trend: 'Across all mock accounts', trendTone: 'info', menuItems: [{ label: 'How this is calculated', action: () => showMetric('Team members', members, 'Sum of the member counts on all mock accounts.') }] }),
      createKpiCard({ label: 'Active accounts', value: String(active), trend: `${Math.round(active / Math.max(1, total) * 100)}% of customers`, trendTone: 'success', content: createAvatarStack({ users: team, max: 4 }), menuItems: [{ label: 'How this is calculated', action: () => showMetric('Active accounts', active, 'Customers whose status is Customer, excluding Churned accounts.') }] }));
  }
  function dashboardScreen() {
    const recent = element('ul', { className: 'showcase-activity' }, ...activity.slice(0, 6).map(item => element('li', {}, createAvatar({ name: 'Forma workspace', size: 'small' }), element('div', {}, element('strong', {}, item.title), element('p', {}, item.description), element('small', {}, item.time)))));
    const accountList = element('div', { className: 'showcase-account-list' }, ...customers.slice(0, 4).map(row => button('', () => openCustomer(row), 'ghost', { className: 'showcase-account-button' })));
    [...accountList.children].forEach((control, index) => { const row = customers[index]; control.append(createAvatar({ name: row.company }), element('span', {}, element('strong', {}, row.company), element('small', {}, row.domain)), createBadge({ label: row.status, tone: row.status === 'Customer' ? 'success' : 'neutral', pill: true })); });
    return element('div', { className: 'showcase-stack' }, pageHeading('Workspace overview', 'A clear picture of your mock customer operations.', [button('View customers', () => switchScreen('customers'), 'primary')]), kpis(),
      element('div', { className: 'showcase-dashboard-grid' },
        createCard({ title: 'Customer trend', description: 'Mock monthly counts; not historical account data.', content: createChart({ type: 'line', title: 'Mock monthly customers', labels: ['Jan', 'Feb', 'Mar', 'Apr'], series: [{ name: 'Customers', values: [5, 8, 9, 12] }, { name: 'Trials', values: [2, 4, 3, 6] }] }) }),
        createCard({ title: 'Customer status', description: 'Current mock workspace.', content: createChart({ type: 'donut', title: 'Mock customer status', labels: ['Customer', 'Churned'], series: [{ name: 'Customers', values: ['Customer', 'Churned'].map(status => customers.filter(row => row.status === status).length) }] }) }),
        createCard({ title: 'Plan usage', description: 'Current mock workspace.', content: createChart({ type: 'bar', title: 'Mock plan usage', labels: ['Business', 'Enterprise'], series: [{ name: 'Accounts', values: ['Business', 'Enterprise'].map(plan => customers.filter(row => row.plan === plan).length) }] }) })),
      element('div', { className: 'showcase-dashboard-grid' }, createCard({ title: 'Recent activity', description: 'Actions performed in this mock workspace.', content: recent }),
        createCard({ title: 'Customer accounts', description: 'Open an account to inspect its details.', content: accountList })),
      createCard({ title: state.imported ? 'Your import is ready' : 'Bring your customers together', content: element('div', { className: 'showcase-empty' }, element('span', { className: 'showcase-empty-symbol', 'aria-hidden': 'true' }, '↥'), element('h3', {}, state.imported ? `${state.imported} mock customers imported` : 'No imported customers yet'), element('p', {}, 'Import a CSV to explore a real local workflow. Your file stays in this browser session; nothing is uploaded.'), button('Import customers', openImport, 'secondary')) }));
  }
  function openCustomer(row) {
    drawer?.close();
    drawer = openDrawer({ title: row.company, content: element('div', { className: 'showcase-stack' }, element('div', { className: 'showcase-detail-heading' }, createAvatar({ name: row.company, size: 'large' }), element('div', {}, element('strong', {}, row.company), element('p', {}, row.domain))), createBadge({ label: 'Mock customer · no server writes', tone: 'info' }),
      createDescriptionList({ items: [{ term: 'Customer ID', value: row.id }, { term: 'Status', value: createBadge({ label: row.status, tone: row.status === 'Customer' ? 'success' : 'neutral', pill: true, dot: true }) }, { term: 'Contact', value: row.contact }, { term: 'Email', value: row.email }, { term: 'Region', value: row.region }, { term: 'Plan', value: row.plan }, { term: 'Team members', value: String(row.members) }, { term: 'Source', value: row.source }, { term: 'Notes', value: row.notes || 'No notes added.' }] }), createProgressBar({ value: row.usage, label: 'License usage', showValue: true }), createAvatarStack({ users: team.slice(0, row.members), max: 4 })),
      actions: [{ label: 'Edit customer', variant: 'primary', onClick: async close => { if (await beginCustomer(row)) close(); } }, { label: 'Close', onClick: close => close() }] });
  }
  async function beginCustomer(row) {
    if (isDirty() && !(await (resolveAppDirty ? resolveAppDirty() : resolveFormDirty()))) return false;
    state.editingId = row?.id || null;
    state.profile = row ? { company: row.company, domain: row.domain, contact: row.contact, email: row.email, region: row.region, plan: row.plan, notes: row.notes, updates: true } : { company: '', domain: '', contact: '', email: '', region: 'US', plan: 'Business', notes: '', updates: true };
    state.draft = { ...state.profile }; markDirty(); state.screen = 'form'; drawScreen();
    screenHost.querySelector('input')?.focus(); return true;
  }
  function customersScreen() {
    const results = element('div'); const chips = element('div', { className: 'showcase-filter-chips' });
    const selectedSummary = element('span', { role: 'status', 'aria-live': 'polite' });
    const search = element('input', { className: 'ds-input', type: 'search', placeholder: 'Search customers…', 'aria-label': 'Search mock customers', value: state.query, oninput: event => { state.query = event.target.value; state.page = 1; update(); } });
    const region = createCombobox({ label: 'Filter customer region', hideLabel: true, clearable: false, value: state.region, options: [{ value: 'all', label: 'All regions' }, ...regionOptions], onChange: value => { state.region = value; state.page = 1; update(); } });
    const statusTabs = element('div', { className: 'ds-tab-list', role: 'tablist', 'aria-label': 'Customer status' });
    const resultId = uniqueId('customer-results'); results.id = resultId; results.setAttribute('role', 'tabpanel');
    const statusButtons = [];
    for (const [value, label] of [['all', 'All customers'], ['Customer', 'Customers'], ['Churned', 'Churned']]) {
      const tab = element('button', { type: 'button', className: 'ds-tab', role: 'tab', id: `${resultId}-${value}`, 'aria-controls': resultId, onclick: () => { state.status = value; state.page = 1; update(); } }, label);
      tab.dataset.status = value; statusButtons.push(tab); statusTabs.append(tab);
    }
    statusTabs.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault(); const current = statusButtons.findIndex(control => control.dataset.status === state.status);
      const index = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (current + (event.key === 'ArrowRight' ? 1 : -1) + 3) % 3;
      statusButtons[index].click(); statusButtons[index].focus();
    });
    const exportButton = button('Export selected', () => { const rows = customers.filter(row => state.selected.has(row.id)); downloadCSV(rows, 'forma-mock-customers.csv'); announce(`Exported ${rows.length} selected mock customers.`); });
    const activateButton = button('Mark as customer', () => { let changed = 0; for (const row of customers) if (state.selected.has(row.id) && row.status !== 'Customer') { row.status = 'Customer'; changed += 1; } logActivity('Customer status updated', `${changed} mock accounts marked as Customer.`); update(); announce(`${changed} mock accounts updated.`); });
    const clearSelection = button('Clear selection', () => { state.selected.clear(); update(); }, 'ghost');
    const pagination = createPagination({ total: 0, page: state.page, pageSize: state.pageSize, pageSizes: [5, 10, 20], onPageChange: page => { state.page = page; update(); }, onPageSizeChange: pageSize => { state.pageSize = Number(pageSize); state.page = 1; update(); } });
    function update() {
      const query = state.query.trim().toLowerCase();
      const matching = customers.filter(row => (state.status === 'all' || row.status === state.status) && (state.region === 'all' || row.region === state.region) && `${row.company} ${row.domain} ${row.contact} ${row.email} ${row.about}`.toLowerCase().includes(query)).sort((a, b) => a.company.localeCompare(b.company) * (state.ascending ? 1 : -1));
      state.page = Math.min(Math.max(1, state.page), Math.max(1, Math.ceil(matching.length / state.pageSize)));
      const visible = matching.slice((state.page - 1) * state.pageSize, state.page * state.pageSize);
      for (const control of statusButtons) { const active = control.dataset.status === state.status; control.setAttribute('aria-selected', String(active)); control.tabIndex = active ? 0 : -1; }
      results.setAttribute('aria-labelledby', `${resultId}-${state.status}`);
      chips.replaceChildren();
      if (state.region !== 'all') chips.append(createFilterChip({ label: `Region: ${state.region}`, onRemove: () => { state.region = 'all'; region.setValue('all'); state.page = 1; update(); } }));
      if (state.query) chips.append(createFilterChip({ label: `Search: ${state.query}`, onRemove: () => { state.query = ''; search.value = ''; state.page = 1; update(); search.focus(); } }));
      if (state.status !== 'all') chips.append(createFilterChip({ label: `Status: ${state.status}`, onRemove: () => { state.status = 'all'; state.page = 1; update(); } }));
      selectedSummary.textContent = `${state.selected.size} selected · ${matching.length} matching mock customers`;
      exportButton.disabled = !state.selected.size; activateButton.disabled = !customers.some(row => state.selected.has(row.id) && row.status !== 'Customer'); clearSelection.disabled = !state.selected.size;
      pagination.setState({ total: matching.length, page: state.page, pageSize: state.pageSize });
      if (!visible.length) { results.replaceChildren(element('div', { className: 'showcase-empty' }, element('h3', {}, 'No customers found'), element('p', {}, 'Try a different search or clear the active filters.'), button('Clear all filters', () => { state.query = ''; state.status = 'all'; state.region = 'all'; search.value = ''; region.setValue('all'); update(); }))); return; }
      const allSelected = visible.every(row => state.selected.has(row.id));
      const selectAll = element('input', { type: 'checkbox', className: 'ds-checkbox', checked: allSelected, 'aria-label': 'Select all customers on this page', onchange: event => { for (const row of visible) event.target.checked ? state.selected.add(row.id) : state.selected.delete(row.id); update(); } });
      selectAll.indeterminate = !allSelected && visible.some(row => state.selected.has(row.id));
      const heading = element('tr', {}, element('th', { scope: 'col' }, element('label', { className: 'showcase-checkbox-target' }, selectAll)), element('th', { scope: 'col', 'aria-sort': state.ascending ? 'ascending' : 'descending' }, button(`Company ${state.ascending ? '↑' : '↓'}`, () => { state.ascending = !state.ascending; update(); results.querySelector('.ds-table-sort')?.focus(); }, 'ghost', { className: 'ds-table-sort' })), ...['Status', 'About', 'Users', 'License usage'].map(label => element('th', { scope: 'col' }, label)));
      const body = element('tbody', {}, ...visible.map(row => {
        const checkbox = element('input', { type: 'checkbox', className: 'ds-checkbox', checked: state.selected.has(row.id), 'aria-label': `Select ${row.company}`, onchange: event => { event.target.checked ? state.selected.add(row.id) : state.selected.delete(row.id); update(); } });
        const checkCell = element('td', {}, element('label', { className: 'showcase-checkbox-target' }, checkbox));
        return element('tr', { className: state.selected.has(row.id) ? 'showcase-row-selected' : '', 'aria-label': `View ${row.company} mock customer details` }, checkCell,
          element('td', {}, element('div', { className: 'ds-table-member' }, createAvatar({ name: row.company }), element('div', {}, element('strong', {}, row.company), element('small', {}, row.domain)))),
          element('td', {}, createBadge({ label: row.status, tone: row.status === 'Customer' ? 'success' : 'neutral', pill: true, dot: true })),
          element('td', {}, element('strong', { className: 'showcase-about-title' }, row.about), element('small', { className: 'showcase-about-description' }, row.description)),
          element('td', {}, createAvatarStack({ users: Array.from({ length: row.members }, (_, index) => team[index % team.length]), max: 3, size: 'small' })),
          element('td', {}, createProgressBar({ value: row.usage, label: `${row.company} license usage`, showValue: true })));
      }));
      results.replaceChildren(createTable({
        caption: 'Mock customers. Select checkboxes for bulk actions or activate a row for account details.',
        label: 'Mock customer table; scroll horizontally to see all columns', header: heading, body,
        className: 'showcase-customer-table', onRowActivate: index => openCustomer(visible[index]),
      }));
    }
    const content = element('div', { className: 'showcase-stack' }, pageHeading('Customers', 'Manage customer relationships in this local mock workspace.', [button('Import', openImport), button('+ Add customer', () => beginCustomer(), 'primary')]), kpis(), statusTabs,
      element('div', { className: 'showcase-filter-bar' }, region.element, element('div', { className: 'showcase-search' }, search)), chips,
      element('div', { className: 'showcase-table-card' }, element('div', { className: 'showcase-bulk-toolbar' }, selectedSummary, element('div', { className: 'showcase-actions' }, exportButton, activateButton, clearSelection)), results, pagination.element));
    update(); return content;
  }
  function logActivity(title, description) { activity.unshift({ title, description, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }); }
  function openImport() {
    let pending = []; let reading = false; let chosenFile;
    const status = element('p', { role: 'status', 'aria-live': 'polite', className: 'showcase-feedback' });
    const input = element('input', { type: 'file', accept: '.csv,text/csv', className: 'ds-input', id: uniqueId('customer-csv'), onchange: async event => {
      const file = event.target.files[0]; chosenFile = file; pending = []; reading = false;
      if (!file) { status.textContent = 'Choose a CSV file to preview the import.'; return; }
      if (file.size > 1024 * 1024) { status.textContent = 'Choose a CSV smaller than 1 MB.'; return; }
      reading = true; status.textContent = 'Reading the local CSV…';
      try { const parsed = parseCSV(await file.text()); if (chosenFile !== file) return; pending = parsed; status.textContent = `${pending.length} customers validated and ready to import. No data has been added yet.`; }
      catch (error) { if (chosenFile === file) status.textContent = error.message; }
      finally { if (chosenFile === file) reading = false; }
    } });
    openModal({ title: 'Import mock customers', content: element('div', { className: 'showcase-stack' }, createAlert({ title: 'Local demonstration', message: 'This CSV stays on your device. Imported rows live only in memory and reset when the app reloads.', tone: 'info' }), element('p', {}, 'Required headers: company, domain, contact, email, region, status. Regions: US, AU, GB, SG. Status: Customer or Churned. Maximum 200 rows.'), button('Download sample CSV', () => downloadCSV([{ company: 'Sample company', domain: 'sample.example', contact: 'Alex Morgan', email: 'alex@sample.example', region: 'SG', status: 'Customer' }], 'forma-customers-sample.csv')), element('label', { for: input.id }, 'Choose customer CSV'), input, status), actions: [{ label: 'Cancel', onClick: close => close() }, { label: 'Import customers', variant: 'primary', onClick: close => {
      if (reading) { status.textContent = 'Wait for the CSV preview to finish.'; return; }
      if (!pending.length) { status.textContent = 'Choose a valid CSV before importing.'; input.focus(); return; }
      const count = pending.length;
      for (const record of pending) customers.push({ ...record, id: `MOCK-${String(customers.length + 1).padStart(3, '0')}`, about: 'Imported customer', description: 'Imported from a local mock CSV', usage: 0, members: 1, plan: 'Business', notes: '', source: 'Local CSV import' });
      state.imported += count; state.query = ''; state.status = 'all'; state.region = 'all'; state.page = 1; state.screen = 'customers'; logActivity('Customers imported', `${count} mock customers added from CSV.`); close(); drawScreen(); announce(`Imported ${count} mock customers. Nothing was uploaded.`);
    } }] });
  }
  function formScreen() {
    const form = element('form', { className: 'showcase-form', novalidate: true, onsubmit: event => { event.preventDefault(); saveForm(); } });
    const id = uniqueId('customer-form');
    const fields = new Map();
    function inputField(name, label, { type = 'text', required = true, hint = '', multiline = false } = {}) {
      const error = element('small', { id: `${id}-${name}-error`, className: 'showcase-field-error' });
      const control = element(multiline ? 'textarea' : 'input', { className: 'ds-input', id: `${id}-${name}`, name, type: multiline ? undefined : type, required: required ? '' : undefined, rows: multiline ? 4 : undefined, value: multiline ? undefined : state.draft[name], 'aria-describedby': `${id}-${name}-error${hint ? ` ${id}-${name}-hint` : ''}`, oninput: event => { state.draft[name] = event.target.value; markDirty(); control.removeAttribute('aria-invalid'); error.textContent = ''; updateFormStatus(); } }, multiline ? state.draft[name] : null);
      fields.set(name, { control, error });
      return element('div', { className: 'showcase-field' }, element('label', { for: control.id }, label, required ? ' *' : ''), control, hint ? element('small', { id: `${id}-${name}-hint` }, hint) : null, error);
    }
    const region = createCombobox({ label: 'Region', clearable: false, required: true, value: state.draft.region, options: regionOptions, onChange: value => { state.draft.region = value; markDirty(); updateFormStatus(); } });
    const plan = customSelect({ label: 'Customer plan', value: state.draft.plan, options: ['Starter', 'Business', 'Enterprise'].map(value => ({ value, label: value })), onChange: value => { state.draft.plan = value; markDirty(); updateFormStatus(); } });
    const formStatus = element('p', { className: 'showcase-form-status', role: 'status', 'aria-live': 'polite' });
    const validationSummary = element('div', { className: 'showcase-validation-summary', role: 'alert', hidden: true, tabindex: '-1' });
    const save = button('Save customer', null, 'primary', { type: 'submit' });
    function updateFormStatus() { formStatus.textContent = isDirty() ? 'Unsaved changes · leaving prompts you to save or discard.' : 'All changes saved in this mock session.'; }
    function section(title, description, content) { return element('section', { className: 'showcase-form-section' }, element('div', { className: 'showcase-section-heading' }, element('h3', {}, title), element('p', {}, description)), element('div', { className: 'showcase-form-fields' }, content)); }
    form.append(validationSummary,
      section('Company information', 'The account details visible in your customer directory.', [inputField('company', 'Company name'), inputField('domain', 'Company domain', { hint: 'Use a domain without https://, for example studio.example.' })]),
      section('Primary contact', 'Who should the team contact about this account?', [inputField('contact', 'Full name'), inputField('email', 'Email address', { type: 'email' })]),
      section('Account preferences', 'Choose the account region, plan and communication preference.', [element('div', { className: 'showcase-field' }, region.element), element('div', { className: 'showcase-field' }, element('label', { for: plan.id }, 'Plan'), plan.element), element('label', { className: 'ds-checkbox-label showcase-wide-field' }, element('input', { type: 'checkbox', className: 'ds-checkbox', checked: state.draft.updates, onchange: event => { state.draft.updates = event.target.checked; markDirty(); updateFormStatus(); } }), 'Receive account updates (mock preference only)')]),
      section('Additional notes', 'Context for your team. Do not enter real personal or sensitive information.', [inputField('notes', 'Internal notes', { required: false, multiline: true })]),
      element('footer', { className: 'showcase-form-footer' }, formStatus, element('div', { className: 'showcase-actions' }, button('Cancel', async () => { if (!isDirty() || await (resolveAppDirty ? resolveAppDirty() : resolveFormDirty())) { state.screen = 'customers'; drawScreen(); } }), save)));
    form.showErrors = errors => {
      for (const [name, field] of fields) { field.control.setAttribute('aria-invalid', String(Boolean(errors[name]))); field.error.textContent = errors[name] || ''; }
      validationSummary.hidden = !Object.keys(errors).length;
      validationSummary.textContent = `Please fix ${Object.keys(errors).length} field${Object.keys(errors).length === 1 ? '' : 's'} before saving: ${Object.values(errors).join(' ')}`;
      fields.get(Object.keys(errors)[0])?.control.focus();
    };
    updateFormStatus();
    return element('div', { className: 'showcase-stack' }, pageHeading(state.editingId ? 'Edit customer' : 'Customer profile', 'Grouped fields, inline validation and an unsaved-changes guard. All data is mock.'), createAlert({ title: 'A working reference form', message: 'Save updates the mock customer directory. Cancel, screen changes and app navigation protect unsaved edits.', tone: 'info' }), form);
  }
  function saveForm() {
    const draft = Object.fromEntries(Object.entries(state.draft).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value]));
    const errors = {};
    if (!draft.company) errors.company = 'Enter a company name.';
    if (!validDomain(draft.domain)) errors.domain = 'Enter a valid company domain.';
    if (!draft.contact) errors.contact = 'Enter a primary contact name.';
    if (!validEmail(draft.email)) errors.email = 'Enter a valid email address.';
    if (Object.keys(errors).length) { state.screen = 'form'; drawScreen(); screenHost.querySelector('form').showErrors(errors); announce('Customer was not saved. Correct the highlighted fields.'); return false; }
    const existing = customers.find(row => row.id === state.editingId);
    if (existing) Object.assign(existing, draft);
    else { const row = { ...draft, id: `MOCK-${String(customers.length + 1).padStart(3, '0')}`, status: 'Customer', about: 'New customer', description: 'Created using the reference form', members: 1, usage: 0, source: 'Reference form' }; customers.push(row); state.editingId = row.id; }
    state.profile = { ...draft }; state.draft = { ...draft }; markDirty(); logActivity('Customer saved', `${draft.company} was saved to the mock directory.`); drawScreen(); announce(`${draft.company} saved in this mock session.`); return true;
  }
  function resolveFormDirty() {
    if (!isDirty()) return Promise.resolve(true);
    if (resolving) return resolving;
    resolving = new Promise(resolve => {
      function finish(allowed, close) { close(); guardDialog = null; resolving = null; resolve(allowed); }
      guardDialog = openModal({ title: 'Unsaved customer changes', content: element('p', {}, 'Save your customer changes, discard them, or keep editing. No data is sent to a server.'), dismissible: false, actions: [
        { label: 'Keep editing', onClick: close => finish(false, close) },
        { label: 'Discard changes', onClick: close => { state.draft = { ...state.profile }; markDirty(); finish(true, close); drawScreen(); } },
        { label: 'Save changes', variant: 'primary', onClick: close => { if (saveForm()) finish(true, close); else finish(false, close); } },
      ] });
    });
    return resolving;
  }
  const requestGuard = event => { if (isDirty() && Array.isArray(event.detail?.handlers)) event.detail.handlers.push(resolveFormDirty); };
  window.addEventListener('app:resolve-dirty', requestGuard);
  function dispose() { if (disposed) return; disposed = true; window.removeEventListener('app:resolve-dirty', requestGuard); drawer?.close(); guardDialog?.close(); }
  activeDispose = dispose; onDetach(root, dispose);
  drawScreen();
  markDirty();
  return { isDirty, resolveDirty: resolveFormDirty, dispose };
}
