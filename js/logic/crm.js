import { parseISODate } from './date.js';

export const stages = ['Lead', 'Qualified', 'Proposal', 'Won', 'Lost'];
export const regions = ['US', 'AU', 'GB', 'SG'];
export const eventTypes = ['Meeting', 'Follow-up'];

export function createDemoData() {
  const seeds = [
    ['Catalog', 'catalog.example', 'Content curating app', 'US', 'Olivia Rhye', 78],
    ['Circoole', 'circoole.example', 'Design software', 'AU', 'Phoenix Baker', 64],
    ['Command', 'command.example', 'Data prediction', 'GB', 'Lana Steiner', 42],
    ['Hourglass', 'hourglass.example', 'Productivity app', 'SG', 'Demi Wilkinson', 86],
    ['Layers', 'layers.example', 'Web app integrations', 'US', 'Drew Cano', 33],
    ['Quotient', 'quotient.example', 'Sales CRM', 'AU', 'Andi Lane', 56],
    ['Sisyphus', 'sisyphus.example', 'Automation and workflow', 'SG', 'Alex Morgan', 72],
    ['Northstar', 'northstar.example', 'Team planning', 'GB', 'Sam Chen', 91],
    ['Orbit', 'orbit.example', 'Community platform', 'SG', 'Jamie Lee', 63],
    ['Capsule', 'capsule.example', 'Knowledge management', 'US', 'Jordan Smith', 35],
  ];
  const customers = seeds.map(([company, domain, about, region, contact, usage], index) => ({
    id: `CRM-${String(index + 1).padStart(3, '0')}`, company, domain, about, region, contact,
    email: `hello@${domain}`, status: index % 3 === 1 ? 'Churned' : 'Customer',
    plan: index % 3 === 0 ? 'Enterprise' : 'Business', usage, members: 3 + index % 5,
  }));
  const deals = [
    ['Enterprise rollout', 0, 'Proposal', 24000], ['Analytics expansion', 0, 'Qualified', 8500],
    ['Design team onboarding', 1, 'Lead', 12000], ['Forecasting pilot', 2, 'Proposal', 18500],
    ['Annual renewal', 3, 'Won', 32000], ['Integration discovery', 4, 'Lost', 6500],
    ['Sales workspace', 5, 'Lead', 15000], ['Workflow expansion', 6, 'Qualified', 11000],
    ['Planning renewal', 7, 'Won', 9000],
  ].map(([title, customer, column, value], index) => ({ id: `DEAL-${index + 1}`, customerId: customers[customer].id, title, column, value }));
  const events = [
    ['Quarterly account review', 0, '2026-10-26', '09:00', 'Meeting'],
    ['Send proposal follow-up', 0, '2026-10-27', '14:30', 'Follow-up'],
    ['Pilot discovery call', 2, '2026-10-28', '11:00', 'Meeting'],
    ['Renewal planning', 3, '2026-10-29', '10:00', 'Meeting'],
    ['Check integration requirements', 4, '2026-10-30', '15:00', 'Follow-up'],
    ['Workspace demonstration', 5, '2026-11-02', '13:00', 'Meeting'],
  ].map(([title, customer, date, time, type], index) => ({ id: `EVENT-${index + 1}`, title, customerId: customers[customer].id, date, time, type, status: 'Scheduled' }));
  return {
    customers, deals, events,
    notes: [{ id: 'NOTE-1', customerId: 'CRM-001', text: 'Interested in expanding the analytics workspace next quarter.', date: '2026-10-25' }],
    activity: customers.map(customer => ({ customerId: customer.id, actor: 'CRM team (mock)', action: 'created', target: customer.company, time: '24 Oct 2026, 09:00', dateTime: '2026-10-24T09:00:00Z', details: 'Account added to this mock workspace.' })),
  };
}

export function filterCustomers(customers, { query = '', status = 'all', region = 'all', ascending = true } = {}) {
  const search = query.trim().toLowerCase();
  return customers.filter(row => (status === 'all' || row.status === status) && (region === 'all' || row.region === region) && `${row.company} ${row.domain} ${row.contact} ${row.email} ${row.about}`.toLowerCase().includes(search))
    .sort((left, right) => left.company.localeCompare(right.company) * (ascending ? 1 : -1));
}

export function stageSummary(deals) {
  return stages.map(stage => {
    const matching = deals.filter(deal => deal.column === stage);
    return { stage, count: matching.length, value: matching.reduce((sum, deal) => sum + Math.round(deal.value * 100), 0) / 100 };
  });
}

export function validateCustomer(draft) {
  const errors = {};
  if (!String(draft.company ?? '').trim()) errors.company = 'Enter a company name.';
  if (!/^(?:[a-z\d](?:[a-z\d-]*[a-z\d])?\.)+[a-z]{2,}$/i.test(String(draft.domain ?? '').trim())) errors.domain = 'Enter a valid domain without https://.';
  if (!String(draft.contact ?? '').trim()) errors.contact = 'Enter a contact name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(draft.email ?? '').trim())) errors.email = 'Enter a valid email address.';
  if (!regions.includes(draft.region)) errors.region = 'Choose a supported region.';
  if (!['Customer', 'Churned'].includes(draft.status)) errors.status = 'Choose Customer or Churned.';
  return errors;
}

export function validateEvent(draft, customers = []) {
  const errors = {};
  const title = String(draft.title ?? '').trim();
  if (title.length < 3 || title.length > 120) errors.title = 'Enter an event title between 3 and 120 characters.';
  if (!parseISODate(draft.date)) errors.date = 'Choose a valid event date.';
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(draft.time ?? '')) errors.time = 'Enter a time in 24-hour HH:MM format.';
  if (!eventTypes.includes(draft.type)) errors.type = 'Choose Meeting or Follow-up.';
  if (!customers.some(customer => customer.id === draft.customerId)) errors.customerId = 'Choose an existing customer.';
  return errors;
}

export function validateDeal(draft, customers = []) {
  const errors = {};
  if (!String(draft.title ?? '').trim()) errors.title = 'Enter a deal title.';
  if (String(draft.value ?? '').trim() === '' || !Number.isFinite(Number(draft.value)) || Number(draft.value) <= 0 || !Number.isSafeInteger(Math.round(Number(draft.value) * 100))) errors.value = 'Enter a positive deal value.';
  else if (Math.abs(Number(draft.value) * 100 - Math.round(Number(draft.value) * 100)) > 0.000001) errors.value = 'Use at most two decimal places.';
  if (!stages.includes(draft.column)) errors.column = 'Choose a pipeline stage.';
  if (!customers.some(customer => customer.id === draft.customerId)) errors.customerId = 'Choose an existing customer.';
  return errors;
}
