import { element, button, customSelect, openModal, uniqueId } from '../../../components/playground.js';
import { createListingLayout } from '../../../components/listing-layout.js';
import { createDetailLayout } from '../../../components/detail-layout.js';
import { createDashboardLayout } from '../../../components/dashboard-layout.js';
import { createCard } from '../../../components/card.js';
import { createKpiCard } from '../../../components/kpi-card.js';
import { createAlert } from '../../../components/alert.js';
import { createBadge } from '../../../components/badge.js';
import { createAvatar } from '../../../components/avatar.js';
import { createAvatarStack } from '../../../components/avatar-stack.js';
import { createDescriptionList } from '../../../components/description-list.js';
import { createProgressBar } from '../../../components/progress-bar.js';
import { createFilterChip } from '../../../components/filter-chip.js';
import { createCombobox } from '../../../components/combobox.js';
import { createTable } from '../../../components/table.js';
import { createPagination } from '../../../components/pagination.js';
import { createTabs } from '../../../components/tabs.js';
import { createAuditTimeline } from '../../../components/audit-timeline.js';
import { createFormField } from '../../../components/form-field.js';
import { createDatePicker } from '../../../components/date-picker.js';
import { createEmptyState } from '../../../components/empty-state.js';
import { createErrorState } from '../../../components/error-state.js';
import { createSpinner } from '../../../components/spinner.js';
import { openDrawer } from '../../../components/drawer.js';
import { openConfirmDialog } from '../../../components/confirm-dialog.js';
import { openExportDialog } from '../../../components/export-dialog.js';
import { createChart } from '../../../components/chart.js';
import { createKanban } from '../../../components/kanban.js';
import { createCalendar } from '../../../components/calendar.js';
import { createDemoData, filterCustomers, stageSummary, validateCustomer, validateEvent, validateDeal, stages, regions, eventTypes } from '../../logic/crm.js';
import { createDemoControls } from '../demo-controls.js';


let data = createDemoData();
let sequence = 100;
const state = { query: '', region: 'all', status: 'all', ascending: true, page: 1, pageSize: 5, demo: 'ready', customerTab: 0, calendarDate: '2026-10-26', calendarView: 'month', eventType: 'all', eventCustomer: 'all' };
const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
const options = values => values.map(value => ({ value, label: value }));
const stack = (...children) => element('div', { className: 'crm-stack' }, ...children.flat());
const actions = (...children) => element('div', { className: 'crm-actions' }, ...children.flat());
const customerLink = customer => element('a', { href: `#/examples/crm/customer/${customer.id}` }, customer.company);
const statusBadge = customer => createBadge({ label: customer.status, tone: customer.status === 'Customer' ? 'success' : 'neutral', dot: true, pill: true });
const team = [{ name: 'Olivia Rhye' }, { name: 'Phoenix Baker' }, { name: 'Lana Steiner' }, { name: 'Demi Wilkinson' }, { name: 'Drew Cano' }];

function recordActivity(customerId, action, target, details) {
  const now = new Date();
  data.activity.unshift({ customerId, actor: 'You (mock)', action, target, details, time: now.toLocaleString('en-GB'), dateTime: now.toISOString() });
}

export function render(container, { screen = 'customers', id = 'CRM-001' } = {}) {
  const root = element('section', { className: 'crm-example', 'aria-label': 'CRM product example' });
  const feedback = element('p', { className: 'crm-feedback', role: 'status', 'aria-live': 'polite' });
  const host = element('div', { className: 'crm-screen' });
  const nav = element('nav', { className: 'crm-nav', 'aria-label': 'CRM screens' },
    ...[['customers', 'Customers'], ['pipeline', 'Sales pipeline'], ['customer/CRM-001', 'Customer 360'], ['calendar', 'Activity calendar']].map(([path, title]) => element('a', { href: `#/examples/crm/${path}`, 'aria-current': (screen === path || screen === 'customer' && path.startsWith('customer/')) ? 'page' : undefined }, title)));
  const demo = customSelect({ label: 'Demo list state', value: state.demo, options: [{ value: 'ready', label: 'Ready' }, { value: 'loading', label: 'Loading (demo)' }, { value: 'empty', label: 'Empty (demo)' }, { value: 'error', label: 'Error (demo)' }], onChange: value => { state.demo = value; draw(); } });
  const reset = button('Reset demo data', () => openConfirmDialog({ title: 'Reset CRM demo data?', description: 'Discard all customer, deal, note and activity changes in this session and restore the original mock records.', destructive: true, confirmLabel: 'Reset demo data', onConfirm: () => { data = createDemoData(); state.query = ''; state.region = 'all'; state.status = 'all'; state.page = 1; state.demo = 'ready'; state.customerTab = 0; state.eventType = 'all'; state.eventCustomer = 'all'; state.calendarDate = '2026-10-26'; demo.setValue('ready'); draw(); announce('CRM demo data reset.'); } }));
  const demoControls = createDemoControls({ domain: 'crm', reset, state: demo, stateElement: createFormField({ label: 'Demo list state', control: demo.element }).element });
  root.append(createAlert({ title: 'Mock data', message: 'CRM demonstration only. Changes stay in memory for this session; no customer data is sent to a server.', tone: 'info' }), nav, feedback, host);
  container.replaceChildren(root);
  function announce(message) { feedback.textContent = message; }
  function heading(title, description, controls = []) {
    return element('div', { className: 'example-page-header' },
      element('header', { className: 'crm-heading' }, element('div', {}, element('h1', {}, title), element('p', {}, description)), actions(controls)),
      demoControls);
  }
  function recover() { state.demo = 'ready'; demo.setValue('ready'); draw(); }
  function listState(label, count, content, onEmpty) {
    if (state.demo === 'loading') return stack(createSpinner({ label: `Loading ${label} (demo)` }), button('Finish demo loading', recover));
    if (state.demo === 'error') return createErrorState({ headingLevel: 2, title: `Could not load ${label} (demo)`, description: 'Simulated local error. Your mock changes have not been removed.', onRetry: recover });
    if (state.demo === 'empty' || !count) return createEmptyState({ headingLevel: 2, title: `No ${label}`, description: state.demo === 'empty' ? 'Simulated empty list; your stored mock records are unchanged.' : 'No records match this view.', actionLabel: state.demo === 'empty' ? 'Show mock records' : onEmpty ? 'Clear filters' : undefined, onAction: state.demo === 'empty' ? recover : onEmpty });
    return content();
  }
  function draw() {
    host.replaceChildren(screen === 'pipeline' ? pipelineScreen() : screen === 'calendar' ? calendarScreen() : screen === 'customer' ? customerScreen() : customersScreen());
  }
  function contactDetails(customer) {
    return createDescriptionList({ items: [{ term: 'Customer ID', value: customer.id }, { term: 'Primary contact', value: customer.contact }, { term: 'Email', value: customer.email }, { term: 'Domain', value: customer.domain }, { term: 'Region', value: customer.region }, { term: 'Plan', value: customer.plan }, { term: 'Status', value: statusBadge(customer) }] });
  }
  function openCustomer(customer) {
    openDrawer({ title: customer.company, content: stack(createBadge({ label: 'Mock data', tone: 'info' }), element('div', { className: 'crm-company' }, createAvatar({ name: customer.company, size: 'large' }), element('div', {}, element('strong', {}, customer.company), element('p', {}, customer.about))), contactDetails(customer), createProgressBar({ value: customer.usage, label: 'Mock license usage', showValue: true }), createAvatarStack({ users: team.slice(0, customer.members), max: 3 }), customerLink(customer)), actions: [{ label: 'Edit customer', variant: 'primary', onClick: close => { close(); editCustomer(customer); } }, { label: 'Close', onClick: close => close() }] });
  }
  // All forms use the same shared fields, selectors, date picker and modal, with domain validation.
  function editor({ title, draft, fields, validate, onSave }) {
    const form = element('form', { className: 'crm-editor', novalidate: true });
    const errors = element('p', { role: 'alert', className: 'crm-validation' });
    const fieldMap = new Map();
    for (const descriptor of fields) {
      const { key, label, choices, kind = 'text', hint = '' } = descriptor;
      let control;
      if (kind === 'date') control = createDatePicker({ label, value: draft[key], required: true, clearable: false, onChange: value => { draft[key] = value; } }).element;
      else if (kind === 'customer') control = createCombobox({ label, hideLabel: true, clearable: false, value: draft[key], options: data.customers.map(customer => ({ value: customer.id, label: customer.company })), onChange: value => { draft[key] = value; } }).element;
      else if (choices) control = customSelect({ label, value: draft[key], options: options(choices), onChange: value => { draft[key] = value; } }).element;
      else control = element(kind === 'textarea' ? 'textarea' : 'input', { className: 'ds-input', type: kind === 'textarea' ? undefined : kind, value: kind === 'textarea' ? undefined : draft[key], rows: kind === 'textarea' ? 4 : undefined, inputmode: key === 'time' ? 'numeric' : key === 'value' ? 'decimal' : undefined, oninput: event => { draft[key] = event.target.value; fieldMap.get(key).setError(''); } }, kind === 'textarea' ? draft[key] : null);
      const field = createFormField({ label, control, hint, required: true });
      if (kind === 'date') field.element.firstElementChild.remove();
      fieldMap.set(key, { ...field, control }); form.append(field.element);
    }
    form.append(errors);
    function save() {
      const validation = validate(draft);
      for (const [key, field] of fieldMap) field.setError(validation[key] || '');
      if (Object.keys(validation).length) { errors.textContent = 'Please correct the highlighted fields. Your input has been preserved.'; const control = fieldMap.get(Object.keys(validation)[0]).control; (control.matches('input,textarea') ? control : control.querySelector('input,button')).focus(); return; }
      const normalized = Object.fromEntries(Object.entries(draft).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value]));
      onSave(normalized); dialog.close('saved'); draw(); announce(`${title.replace(/^(Add|Edit) /, '')} saved in this mock session.`);
    }
    form.addEventListener('submit', event => { event.preventDefault(); save(); });
    const dialog = openModal({ title, content: stack(element('p', {}, 'Mock data · saved only in this browser session.'), form), actions: [{ label: 'Cancel', onClick: close => close('cancel') }, { label: 'Save', variant: 'primary', onClick: save }] });
  }
  function editCustomer(customer) {
    editor({ title: customer ? 'Edit customer' : 'Add customer', draft: customer ? { ...customer } : { company: '', domain: '', contact: '', email: '', region: 'SG', status: 'Customer' }, fields: [{ key: 'company', label: 'Company name' }, { key: 'domain', label: 'Company domain', hint: 'Example: company.example' }, { key: 'contact', label: 'Contact name' }, { key: 'email', label: 'Contact email', kind: 'email' }, { key: 'region', label: 'Region', choices: regions }, { key: 'status', label: 'Account status', choices: ['Customer', 'Churned'] }], validate: validateCustomer, onSave: draft => {
      const record = customer || { id: `CRM-${++sequence}`, usage: 0, members: 1, plan: 'Business', about: 'New mock customer' };
      Object.assign(record, draft); if (!customer) data.customers.push(record);
      recordActivity(record.id, customer ? 'updated' : 'created', record.company, 'Customer details saved locally.'); state.demo = 'ready'; demo.setValue('ready');
    } });
  }
  function customersScreen() {
    const result = element('div'); const chips = element('div', { className: 'crm-actions' }); const count = element('p', { role: 'status', 'aria-live': 'polite' });
    const search = element('input', { className: 'ds-input', type: 'search', value: state.query, placeholder: 'Company, domain or contact…', oninput: event => { state.query = event.target.value; state.page = 1; update(); } });
    const region = createCombobox({ label: 'Region', value: state.region, clearable: false, options: [{ value: 'all', label: 'All regions' }, ...options(regions)], onChange: value => { state.region = value; state.page = 1; update(); } });
    const status = customSelect({ label: 'Account status', value: state.status, options: [{ value: 'all', label: 'All statuses' }, ...options(['Customer', 'Churned'])], onChange: value => { state.status = value; state.page = 1; update(); } });
    const pagination = createPagination({ total: 0, page: state.page, pageSize: state.pageSize, pageSizes: [5, 10, 20], onPageChange: value => { state.page = value; update(); }, onPageSizeChange: value => { state.pageSize = Number(value); state.page = 1; update(); } });
    function clear() { state.query = ''; state.region = 'all'; state.status = 'all'; state.page = 1; search.value = ''; region.setValue('all'); status.setValue('all'); update(); }
    function update() {
      const rows = filterCustomers(data.customers, state); state.page = Math.min(state.page, Math.max(1, Math.ceil(rows.length / state.pageSize)));
      const visible = rows.slice((state.page - 1) * state.pageSize, state.page * state.pageSize);
      count.textContent = `${rows.length} matching mock customers`; pagination.setState({ total: state.demo === 'ready' ? rows.length : 0, page: state.page, pageSize: state.pageSize });
      chips.replaceChildren();
      if (state.query) chips.append(createFilterChip({ label: `Search: ${state.query}`, onRemove: () => { state.query = ''; search.value = ''; update(); } }));
      if (state.region !== 'all') chips.append(createFilterChip({ label: `Region: ${state.region}`, onRemove: () => { state.region = 'all'; region.setValue('all'); update(); } }));
      if (state.status !== 'all') chips.append(createFilterChip({ label: `Status: ${state.status}`, onRemove: () => { state.status = 'all'; status.setValue('all'); update(); } }));
      result.replaceChildren(listState('customers', visible.length, () => createTable({ caption: 'Mock customer directory. Activate a row to open its detail drawer.', label: 'Customer table; scroll to see every column', className: 'crm-table', header: element('tr', {}, element('th', { scope: 'col', 'aria-sort': state.ascending ? 'ascending' : 'descending' }, button(`Company ${state.ascending ? '↑' : '↓'}`, () => { state.ascending = !state.ascending; update(); result.querySelector('button')?.focus(); }, 'ghost')), ...['Status', 'About', 'Team', 'License usage'].map(label => element('th', { scope: 'col' }, label))), body: element('tbody', {}, visible.map(customer => element('tr', {}, element('td', {}, element('div', { className: 'crm-company' }, createAvatar({ name: customer.company }), element('div', {}, element('strong', {}, customer.company), element('small', {}, customer.domain)))), element('td', {}, statusBadge(customer)), element('td', {}, customer.about), element('td', {}, createAvatarStack({ users: Array.from({ length: customer.members }, (_, index) => team[index % team.length]), max: 3, size: 'small' })), element('td', {}, createProgressBar({ value: customer.usage, label: `${customer.company} mock license usage`, showValue: true }))))), onRowActivate: index => openCustomer(visible[index]) }), clear));
    }
    update();
    return createListingLayout({ header: heading('Customers', 'Relationships, contacts and account health in one place.', [button('Export filtered', () => openExportDialog({ title: 'Export mock customers', rows: filterCustomers(data.customers, state), columns: ['company', 'domain', 'contact', 'email', 'region', 'status'], filename: 'crm-mock-customers' })), button('Add customer', () => editCustomer(), 'primary')]), summary: element('div', { className: 'crm-metrics' }, createKpiCard({ headingLevel: 2, label: 'Total customers', value: String(data.customers.length) }), createKpiCard({ headingLevel: 2, label: 'Active accounts', value: String(data.customers.filter(customer => customer.status === 'Customer').length) }), createKpiCard({ headingLevel: 2, label: 'Open pipeline', value: money(data.deals.filter(deal => !['Won', 'Lost'].includes(deal.column)).reduce((sum, deal) => sum + deal.value, 0)) })), toolbar: stack(element('div', { className: 'crm-filters' }, createFormField({ label: 'Search customers', control: search }).element, region.element, createFormField({ label: 'Account status', control: status.element }).element, button('Clear filters', clear)), chips), table: stack(count, result), pagination: pagination.element });
  }
  function dealEditor(customerId) {
    editor({ title: 'Add deal', draft: { title: '', value: '', customerId: customerId || data.customers[0].id, column: 'Lead' }, fields: [{ key: 'title', label: 'Deal title' }, { key: 'customerId', label: 'Customer', kind: 'customer' }, { key: 'value', label: 'Deal value (USD)', hint: 'Positive amount, up to two decimal places.' }, { key: 'column', label: 'Stage', choices: stages }], validate: draft => validateDeal(draft, data.customers), onSave: draft => { const deal = { ...draft, id: `DEAL-${++sequence}`, value: Number(draft.value) }; data.deals.push(deal); recordActivity(deal.customerId, 'created deal', deal.title, `${money(deal.value)} · ${deal.column}`); } });
  }
  function pipelineScreen() {
    const summaries = stageSummary(data.deals); const totals = element('div', { className: 'crm-stage-totals', 'aria-live': 'polite' });
    const chart = createChart({ type: 'donut', title: 'Mock deals by stage', labels: stages, series: [{ name: 'Deals', values: summaries.map(item => item.count) }], loading: state.demo === 'loading' });
    function updateTotals() { const summary = stageSummary(data.deals); totals.replaceChildren(...summary.map(item => createCard({ headingLevel: 2, title: item.stage, content: stack(element('strong', {}, money(item.value)), element('span', {}, `${item.count} mock deals`)) }))); chart.update({ series: [{ name: 'Deals', values: summary.map(item => item.count) }] }); }
    const board = listState('deals', data.deals.length, () => createKanban({ headingLevel: 2, columns: stages.map(stage => ({ id: stage, label: stage })),
    cards: data.deals.map(deal => ({ ...deal })), formatValue: money,
    onChange: cards => {
      const previous = new Map(data.deals.map(deal => [deal.id, deal.column]));
      data.deals = cards.map(card => ({ ...data.deals.find(deal => deal.id === card.id), ...card }));
      for (const deal of data.deals) if (previous.get(deal.id) !== deal.column) {
        recordActivity(deal.customerId, 'moved deal', deal.title, `${previous.get(deal.id)} → ${deal.column}`);
      }
      updateTotals(); announce('Deal stage updated. Pipeline totals and chart refreshed.');
    }, }).element);
    updateTotals();
    return createDashboardLayout({ header: heading('Sales pipeline', 'Move mock deals with drag and drop, keyboard controls or each card’s Move to menu.', [button('Add deal', () => dealEditor(), 'primary')]), metrics: state.demo === 'ready' ? totals : undefined, content: [{ element: board, span: 12 }, { element: listState('stage summaries', data.deals.length, () => createCard({ headingLevel: 2, title: 'Pipeline distribution', description: 'Deal counts by stage. All monetary values are USD.', content: chart })), span: 12 }] });
  }
  function dealList(customer) {
    const deals = data.deals.filter(deal => deal.customerId === customer.id);
    return stack(actions(button('Add deal', () => dealEditor(customer.id)), element('a', { href: '#/examples/crm/pipeline' }, 'View sales pipeline')), listState('customer deals', deals.length, () => createTable({ caption: `${customer.company} mock deals`, header: element('tr', {}, ...['Deal', 'Stage', 'Value (USD)'].map(label => element('th', { scope: 'col' }, label))), body: element('tbody', {}, deals.map(deal => element('tr', {}, element('td', {}, deal.title), element('td', {}, createBadge({ label: deal.column, tone: deal.column === 'Won' ? 'success' : deal.column === 'Lost' ? 'danger' : 'info' })), element('td', {}, money(deal.value))))) })));
  }
  function notesList(customer) {
    const notes = data.notes.filter(note => note.customerId === customer.id);
    return stack(button('Add note', () => editor({ title: 'Add note', draft: { text: '' }, fields: [{ key: 'text', label: 'Internal note', kind: 'textarea', hint: 'Do not enter real personal or sensitive information.' }], validate: draft => String(draft.text).trim().length >= 3 ? {} : { text: 'Enter a note of at least three characters.' }, onSave: draft => { const date = new Date().toISOString().slice(0, 10); data.notes.unshift({ id: `NOTE-${++sequence}`, customerId: customer.id, text: draft.text, date }); recordActivity(customer.id, 'added note to', customer.company, draft.text); } }), 'primary'), listState('customer notes', notes.length, () => element('ul', { className: 'crm-record-list' }, notes.map(note => element('li', {}, createCard({ headingLevel: 2, title: `Team note · ${note.date}`, content: element('p', { className: 'crm-note' }, note.text), actions: button('Delete note', () => openConfirmDialog({ title: 'Delete this mock note?', description: 'This removes the note from the local CRM session.', destructive: true, confirmLabel: 'Delete note', onConfirm: () => { data.notes = data.notes.filter(item => item.id !== note.id); recordActivity(customer.id, 'deleted note from', customer.company, 'An internal mock note was removed.'); draw(); announce('Mock note deleted.'); } }), 'danger') }))))));
  }
  function customerScreen() {
    const customer = data.customers.find(record => record.id === id);
    if (!customer) return stack(heading('Customer not found', 'This mock record does not exist.'), createEmptyState({ headingLevel: 2, title: 'Unknown customer', description: 'Choose an existing account from the customer directory.' }), element('a', { href: '#/examples/crm/customers' }, 'Back to customers'));
    const activity = data.activity.filter(item => item.customerId === customer.id);
    const deals = data.deals.filter(deal => deal.customerId === customer.id);
    const tabs = createTabs({ label: `${customer.company} customer 360 views`, active: state.customerTab, onChange: index => { state.customerTab = index; }, items: [
      { label: 'Overview', content: stack(createCard({ headingLevel: 2, title: 'Account overview', description: customer.about, content: contactDetails(customer) }), createCard({ headingLevel: 2, title: 'Account team', content: stack(createAvatarStack({ users: team, max: 4 }), element('p', {}, `${customer.members} mock members`), createProgressBar({ value: customer.usage, label: 'Mock license usage', showValue: true })) })) },
      { label: 'Activity timeline', content: listState('customer activities', activity.length, () => createAuditTimeline({ label: `${customer.company} mock activity`, events: activity })) },
      { label: 'Deals', content: dealList(customer) },
      { label: 'Notes', content: notesList(customer) },
    ] });
    return createDetailLayout({ header: heading(customer.company, `${customer.id} · Customer 360 · ${customer.domain}`, [element('a', { href: '#/examples/crm/customers' }, 'Back to customers'), button('Edit customer', () => editCustomer(customer), 'primary')]), summary: [createKpiCard({ headingLevel: 2, label: 'Account status', value: customer.status }), createKpiCard({ headingLevel: 2, label: 'Deal value (USD)', value: money(deals.reduce((sum, deal) => sum + deal.value, 0)) })], tabs, sidePanel: createCard({ headingLevel: 2, title: 'Primary contact', content: stack(createAvatar({ name: customer.contact, size: 'large' }), contactDetails(customer), button('Schedule activity', () => eventEditor(undefined, state.calendarDate, customer.id))) }) });
  }
  function eventEditor(existing, date = state.calendarDate, customerId) {
    editor({ title: existing ? 'Edit activity' : 'Add activity', draft: existing ? { ...existing } : { title: '', date, time: '09:00', type: 'Meeting', customerId: customerId || data.customers[0].id }, fields: [{ key: 'title', label: 'Event title' }, { key: 'type', label: 'Activity type', choices: eventTypes }, { key: 'customerId', label: 'Customer', kind: 'customer' }, { key: 'date', label: 'Event date', kind: 'date' }, { key: 'time', label: 'Time (24-hour HH:MM)', hint: 'Local demonstration time, for example 14:30.' }], validate: draft => validateEvent(draft, data.customers), onSave: draft => { if (existing) Object.assign(existing, draft); else data.events.push({ ...draft, id: `EVENT-${++sequence}`, status: 'Scheduled' }); recordActivity(draft.customerId, existing ? 'rescheduled' : 'scheduled', draft.title, `${draft.type} · ${draft.date} ${draft.time}`); state.calendarDate = draft.date; } });
  }
  function showEvent(event) {
    const customer = data.customers.find(item => item.id === event.customerId);
    openModal({
      title: event.title,
      content: stack(createBadge({ label: 'Mock data', tone: 'info' }), createDescriptionList({ items: [
        { term: 'Customer', value: customer ? customerLink(customer) : 'Unknown customer' },
        { term: 'Type', value: event.type }, { term: 'Date', value: event.date },
        { term: 'Time', value: event.time }, { term: 'Status', value: event.status },
      ] })),
      actions: [
        { label: 'Close', onClick: close => close() },
        { label: 'Edit', variant: 'primary', onClick: close => { close(); eventEditor(event); } },
        { label: 'Delete', variant: 'danger', onClick: close => {
          close();
          openConfirmDialog({
            title: 'Delete mock activity?',
            description: `Remove “${event.title}” from the local activity calendar.`,
            destructive: true, confirmLabel: 'Delete activity',
            onConfirm: () => {
              data.events = data.events.filter(item => item.id !== event.id);
              recordActivity(event.customerId, 'deleted activity', event.title, 'The mock calendar entry was removed.');
              draw(); announce('Mock activity deleted.');
            },
          });
        } },
      ],
    });
  }
  function calendarScreen() {
    const calendarHost = element('div'); const count = element('p', { role: 'status' }); let calendar;
    const type = customSelect({ label: 'Activity type filter', value: state.eventType, options: [{ value: 'all', label: 'All activity types' }, ...options(eventTypes)], onChange: value => { state.eventType = value; update(); } });
    const customer = createCombobox({ label: 'Customer filter', value: state.eventCustomer, clearable: false, options: [{ value: 'all', label: 'All customers' }, ...data.customers.map(item => ({ value: item.id, label: item.company }))], onChange: value => { state.eventCustomer = value; update(); } });
    function update() {
      state.calendarDate = calendar?.getDate() || state.calendarDate;
      state.calendarView = calendar?.getView() || state.calendarView;
      const events = data.events.filter(event => (state.eventType === 'all' || event.type === state.eventType) && (state.eventCustomer === 'all' || event.customerId === state.eventCustomer));
      count.textContent = `${events.length} matching mock activities · times are local demonstration times`;
      calendar = createCalendar({ headingLevel: 2, date: state.calendarDate, view: state.calendarView, locale: 'en-GB', events: state.demo === 'empty' ? [] : events, onSelectDate: date => { state.calendarDate = date; }, onSelectEvent: event => showEvent(data.events.find(item => item.id === event.id) || event) });
      calendarHost.replaceChildren(listState('activities', events.length, () => calendar.element, () => { state.eventType = 'all'; state.eventCustomer = 'all'; type.setValue('all'); customer.setValue('all'); update(); }));
    }
    update();
    return createListingLayout({ header: heading('Activity calendar', 'Plan meetings and follow-ups. Browse dates, use Add activity to create, or select an event to inspect it.', [button('Add activity', () => eventEditor(undefined, calendar?.getDate() || state.calendarDate), 'primary')]), toolbar: element('div', { className: 'crm-filters' }, customer.element, createFormField({ label: 'Activity type', control: type.element }).element), table: stack(count, calendarHost) });
  }
  draw();
}
