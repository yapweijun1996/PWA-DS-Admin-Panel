import { element, playground, toggleControl, statePreview } from './playground.js';
import { createCard } from './card.js';
import { createBadge } from './badge.js';
import { createKpiCard } from './kpi-card.js';
import { createDescriptionList } from './description-list.js';
import { createDetailPanel } from './drawer.js';
import { createTabs } from './tabs.js';
import { createProgressBar } from './progress-bar.js';
import { createAuditTimeline } from './audit-timeline.js';

export function createDetailLayout({ header, summary, tabs, content, sidePanel, timeline, className = '' } = {}) {
  const root = element('div', { className: `ds-detail-layout${className ? ` ${className}` : ''}` });
  function slot(name, value, parent = root) {
    if (value === undefined || value === null) return;
    parent.append(element('div', { className: `ds-detail-layout-${name}`, 'data-layout-slot': name }, ...(Array.isArray(value) ? value.flat(Infinity) : [value]).filter(node => node !== undefined && node !== null)));
  }
  slot('header', header); slot('summary', summary); slot('tabs', tabs);
  const body = element('div', { className: 'ds-detail-layout-body' });
  slot('content', content, body); slot('sidePanel', sidePanel, body);
  if (body.childNodes.length) root.append(body);
  slot('timeline', timeline);
  return root;
}

export function demo(container, { showSidePanel = true, showTimeline = true } = {}) {
  const tabs = createTabs({ label: 'Mock customer detail views', items: [
    { label: 'Overview', content: createDescriptionList({ items: [{ term: 'Company', value: 'Northwind Studio (mock)' }, { term: 'Plan', value: 'Business' }, { term: 'Source', value: 'Local mock workspace' }] }) },
    { label: 'Contact', content: createDescriptionList({ items: [{ term: 'Name', value: 'Alex Chen (mock)' }, { term: 'Email', value: 'alex@example.com' }] }) }
  ] });
  const layout = createDetailLayout({
    header: createCard({ title: 'Northwind Studio', description: 'Mock customer record · ID MOCK-1042', actions: createBadge({ label: 'Customer', tone: 'success', dot: true }) }),
    summary: [createKpiCard({ label: 'Members (mock)', value: '24' }), createKpiCard({ label: 'Projects (mock)', value: '8' })],
    tabs,
    content: createCard({ title: 'License usage (mock)', description: 'Example account usage, not metered data.', content: createProgressBar({ value: 64, label: 'Mock licenses in use', showValue: true }) }),
    sidePanel: showSidePanel ? createDetailPanel({ title: 'Account context (mock)', content: createDescriptionList({ items: [{ term: 'Owner', value: 'Morgan Lee' }, { term: 'Region', value: 'Singapore' }, { term: 'Renewal', value: '31 October 2026' }] }) }) : undefined,
    timeline: showTimeline ? createCard({ title: 'Audit history (mock)', content: createAuditTimeline({ label: 'Mock customer audit history', events: [{ actor: 'Alex (mock)', action: 'updated', target: 'the contact email', time: '26 Oct, 10:30', dateTime: '2026-10-26T10:30:00Z', details: 'A client-side demonstration event, not a server audit record.' }, { actor: 'Morgan (mock)', action: 'created', target: 'the customer', time: '25 Oct, 09:00', dateTime: '2026-10-25T09:00:00Z' }] }) }) : undefined
  });
  container?.append(layout); return layout;
}

export function render(container) {
  const page = playground(container, { title: 'DetailLayout', description: 'A named record header, summary, working shared tabs, main content, side context and audit history. All data is mock.' });
  const state = { showSidePanel: true, showTimeline: true };
  function update() { page.preview.replaceChildren(demo(undefined, state)); page.setSnippet(guide.example); }
  page.controls.append(toggleControl('Side panel slot', true, value => { state.showSidePanel = value; update(); }), toggleControl('Audit timeline slot', true, value => { state.showTimeline = value; update(); }));
  page.states.append(statePreview('Content-only detail', createDetailLayout({ header: createBadge({ label: 'Mock record', tone: 'info' }), content: createCard({ title: 'Read-only mock details', content: 'Optional summary, tabs, side context and audit history are omitted.' }) })));
  update();
}

export const guide = {
  purpose: 'Present a record with a clear hierarchy of heading, summary, related views, main information, contextual side panel and audit history.',
  props: ['createDetailLayout({header, summary, tabs, content, sidePanel, timeline, className}) returns a DOM node.', 'Every slot accepts a DOM node or arrays of nodes; null and undefined omit it. Existing nodes, classes and event listeners are preserved.', 'header holds the record heading/actions; summary holds metrics or description cards; tabs holds canonical createTabs(...) including its associated panels.', 'content is persistent main information; sidePanel is optional inline context; timeline holds the shared AuditTimeline, optionally within a named Card.', 'className appends caller classes. Wrappers expose data-layout-slot and ds-detail-layout-<slot>; content and sidePanel share ds-detail-layout-body.'],
  variants: ['Full record detail with side context and audit history; single-column content; omitted optional slots.'],
  states: ['Read-only record, selected tab, omitted side panel, omitted audit history. Child components supply their own loading, empty and permission states.'],
  keyboard: ['The template adds no focus stops and retains supplied DOM order.', 'Shared Tabs supports Arrow Left/Right, Home/End and roving tabindex; Tab reaches the active panel.'],
  accessibility: ['Supply a clear record heading and labelled shared cards. The inline side panel is not a modal and never traps focus.', 'Canonical Tabs owns tab/panel IDs and selection; AuditTimeline names actors, actions and semantic timestamps in source order.'],
  tokens: ['--space-4, --space-6; child Card, KpiCard, DescriptionList, Tabs, ProgressBar and AuditTimeline tokens.'],
  responsive: ['Main content and side context share a two-to-one grid on wide containers, stacking in source order on narrower ones.', 'Summary cards stack on phones; all tracks shrink, and long descriptions wrap without page overflow.'],
  do: ['Compose shared Tabs and AuditTimeline rather than reproducing their keyboard or semantic behavior.', 'Keep persistent content separate from the panels owned by Tabs and label mock record data.'],
  dont: ['Do not visually reorder contextual content ahead of the main record.', 'Do not treat the client-side mock audit timeline as an immutable backend audit log.'],
  example: 'container.append(createDetailLayout({\n  header: recordHeader, summary: summaryCards, tabs: recordTabs,\n  content: recordContent, sidePanel: accountContext, timeline: auditCard,\n  className: "customer-detail"\n}));'
};
