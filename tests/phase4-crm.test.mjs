import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemoData, filterCustomers, stageSummary, validateCustomer, validateEvent, validateDeal, stages } from '../js/logic/crm.js';

const validEvent = () => ({ title: 'Quarterly review', date: '2026-10-26', time: '09:30', type: 'Meeting', customerId: 'CRM-001' });

test('CRM seeds have stable identities, valid relations and independently resettable data', () => {
  const first = createDemoData(); const second = createDemoData();
  assert.equal(first.customers[0].id, 'CRM-001');
  for (const collection of ['customers', 'deals', 'events', 'notes']) assert.equal(new Set(first[collection].map(record => record.id)).size, first[collection].length);
  for (const collection of ['deals', 'events', 'notes', 'activity']) for (const record of first[collection]) assert.ok(first.customers.some(customer => customer.id === record.customerId));
  for (const event of first.events) assert.deepEqual(validateEvent(event, first.customers), {});
  for (const deal of first.deals) assert.deepEqual(validateDeal(deal, first.customers), {});
  for (const customer of first.customers) assert.deepEqual(validateCustomer(customer), {});
  first.customers[0].company = 'Changed'; first.deals[0].column = 'Lost'; first.events[0].title = 'Changed'; first.notes.length = 0;
  assert.equal(second.customers[0].company, 'Catalog');
  assert.equal(second.deals[0].column, 'Proposal');
  assert.equal(second.events[0].title, 'Quarterly account review');
  assert.equal(second.notes.length, 1);
});

test('CRM filters combine normalized search, status and region without mutating source order', () => {
  const { customers } = createDemoData(); const originalIds = customers.map(customer => customer.id);
  assert.deepEqual(filterCustomers(customers, { query: '  CATALOG.EXAMPLE ', region: 'US', status: 'Customer' }).map(customer => customer.id), ['CRM-001']);
  assert.deepEqual(filterCustomers(customers, { query: 'OlIvIa' }).map(customer => customer.id), ['CRM-001']);
  assert.equal(filterCustomers(customers, { query: 'content curating' }).length, 1);
  assert.equal(filterCustomers(customers, { query: 'Catalog', region: 'AU' }).length, 0);
  assert.ok(filterCustomers(customers, { status: 'Churned' }).every(customer => customer.status === 'Churned'));
  const ascending = filterCustomers(customers); const descending = filterCustomers(customers, { ascending: false });
  assert.deepEqual(descending.map(customer => customer.id), ascending.map(customer => customer.id).reverse());
  assert.deepEqual(customers.map(customer => customer.id), originalIds);
});

test('pipeline totals cover every stage, update on movement and preserve cents', () => {
  const deals = [{ id: 'a', column: 'Lead', value: 0.1 }, { id: 'b', column: 'Lead', value: 0.2 }, { id: 'c', column: 'Won', value: 12000.99 }];
  assert.deepEqual(stageSummary(deals).map(item => item.stage), stages);
  assert.deepEqual(stageSummary(deals)[0], { stage: 'Lead', count: 2, value: 0.3 });
  assert.deepEqual(stageSummary(deals)[1], { stage: 'Qualified', count: 0, value: 0 });
  deals[0].column = 'Proposal';
  const summary = stageSummary(deals);
  assert.equal(summary[0].value, 0.2); assert.equal(summary[2].value, 0.1);
  assert.equal(summary.reduce((sum, item) => sum + item.count, 0), deals.length);
  assert.deepEqual(stageSummary([]), stages.map(stage => ({ stage, count: 0, value: 0 })));
});

test('event validation accepts meaningful trimmed titles, midnight, late times and leap dates', () => {
  const { customers } = createDemoData();
  for (const time of ['00:00', '09:30', '23:59']) assert.deepEqual(validateEvent({ ...validEvent(), time }, customers), {});
  assert.deepEqual(validateEvent({ ...validEvent(), title: '  Plan review  ', date: '2028-02-29', type: 'Follow-up' }, customers), {});
});

test('event validation rejects invalid Gregorian dates, timestamps and malformed times', () => {
  const { customers } = createDemoData();
  for (const date of ['', '2026-02-29', '2026-04-31', '2026-13-01', '2026-1-01', '2026-10-26T09:30:00Z', null]) assert.ok(validateEvent({ ...validEvent(), date }, customers).date, String(date));
  for (const time of ['', '24:00', '12:60', '9:30', '09:3', '09:30 AM', ' 09:30', null]) assert.ok(validateEvent({ ...validEvent(), time }, customers).time, String(time));
});

test('event validation requires title, supported type and an existing customer', () => {
  const { customers } = createDemoData();
  for (const title of ['', '  ', 'ab', 'a'.repeat(121)]) assert.ok(validateEvent({ ...validEvent(), title }, customers).title);
  assert.ok(validateEvent({ ...validEvent(), type: 'Appointment' }, customers).type);
  assert.ok(validateEvent({ ...validEvent(), customerId: 'deleted-customer' }, customers).customerId);
  assert.ok(validateEvent(validEvent(), []).customerId);
  const invalid = validateEvent({}, customers);
  assert.deepEqual(Object.keys(invalid).sort(), ['customerId', 'date', 'time', 'title', 'type']);
});

test('customer validation rejects incomplete identity, invalid email/domain and unsupported filters', () => {
  const customer = createDemoData().customers[0];
  assert.deepEqual(validateCustomer({ ...customer, company: '  Catalog  ', domain: ' catalog.example ', contact: ' Olivia ', email: ' hello@catalog.example ' }), {});
  const errors = validateCustomer({ company: ' ', contact: '', domain: 'https://catalog.example', email: 'not-an-email', region: 'XX', status: 'Pending' });
  assert.deepEqual(Object.keys(errors).sort(), ['company', 'contact', 'domain', 'email', 'region', 'status']);
});

test('deal validation requires existing customer, known stage and positive currency precision', () => {
  const { customers } = createDemoData();
  const deal = { title: 'Annual renewal', customerId: 'CRM-001', column: 'Lead', value: '12000.50' };
  assert.deepEqual(validateDeal(deal, customers), {});
  for (const value of ['', ' ', 'no', -1, 0, Infinity, '12.345', Number.MAX_VALUE]) assert.ok(validateDeal({ ...deal, value }, customers).value, String(value));
  assert.deepEqual(validateDeal({ ...deal, value: 0.29 }, customers), {});
  assert.ok(validateDeal({ ...deal, column: 'Unknown' }, customers).column);
  assert.ok(validateDeal({ ...deal, customerId: 'missing' }, customers).customerId);
  assert.ok(validateDeal({ ...deal, title: ' ' }, customers).title);
});
