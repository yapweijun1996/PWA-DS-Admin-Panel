import { element, playground, toggleControl, statePreview } from './playground.js';
import { createTimeline } from './timeline.js';
export const guide = {
  purpose: 'Explain who changed a record, what changed, and when using the shared Timeline.',
  props: ['createAuditTimeline({events:[{actor,action,target,time,dateTime,details}],label,compact}) returns an element.'],
  variants: ['Detailed and compact audit history.'], states: ['Recorded events and no recorded events.'],
  keyboard: ['Static audit records do not create unnecessary tab stops.'],
  accessibility: ['Ordered records include actor, action and target as text, with semantic timestamps.'],
  tokens: ['Shared Timeline spacing, text and border tokens.'], responsive: ['Long actor and record names wrap.'],
  do: ['Use source timestamps and identify mock audit records.'], dont: ['Do not imply this client-side demo is an immutable server audit log.'],
  example: 'createAuditTimeline({events:[{actor:"Alex",action:"updated",target:"Mock invoice",time:"10:30"}]})'
};
export function createAuditTimeline({ events = [], label = 'Audit history', compact = false } = {}) {
  const view = createTimeline({ label, compact, items: events.map(event => ({ title: [event.actor, event.action, event.target].filter(Boolean).join(' '), description: event.details, time: event.time, dateTime: event.dateTime })) });
  view.classList.add('ds-audit-timeline'); return view;
}
export function render(container) {
  const page = playground(container, { title: 'AuditTimeline', description: guide.purpose });
  const events = [{ actor: 'Alex (mock)', action: 'updated', target: 'invoice MOCK-1042', details: 'Status changed from Draft to Reviewed.', time: '26 Oct, 10:30', dateTime: '2026-10-26T10:30:00Z' }, { actor: 'Morgan (mock)', action: 'created', target: 'invoice MOCK-1042', details: 'Added a demonstration invoice.', time: '26 Oct, 09:00', dateTime: '2026-10-26T09:00:00Z' }];
  function update(compact = false) { const view = createAuditTimeline({ events, compact }); page.preview.replaceChildren(view); page.setSnippet(view.outerHTML); }
  page.controls.append(toggleControl('Compact', false, update)); page.states.append(statePreview('No history', createAuditTimeline())); update();
}
