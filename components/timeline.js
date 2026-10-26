import { element, playground, textControl, toggleControl, statePreview } from './playground.js';

export const guide = {
  purpose: 'Present an ordered sequence of events with readable timestamps and descriptions.',
  props: ['createTimeline({items:[{title,description,time,dateTime}],label,compact}) returns an ordered-list element.'],
  variants: ['Standard and compact.'], states: ['Populated and empty.'],
  keyboard: ['Static events do not enter the tab order; embedded links retain native keyboard behavior.'],
  accessibility: ['An ordered list preserves event order; machine-readable dates use time datetime.'],
  tokens: ['--space-3, --space-5, --color-border-subtle, --muted, --accent'],
  responsive: ['Descriptions wrap without horizontal scrolling.'],
  do: ['Supply events in the intended chronological order and label mock records.'],
  dont: ['Do not rely on dot color to explain an event.'],
  example: 'createTimeline({label:"Activity",items:[{title:"Created",time:"09:00",dateTime:"2026-10-26T09:00:00Z"}]})'
};
export function createTimeline({ items = [], label = 'Activity timeline', compact = false } = {}) {
  const list = element('ol', { className: `ds-timeline${compact ? ' ds-timeline-compact' : ''}`, 'aria-label': label });
  for (const item of items) list.append(element('li', { className: 'ds-timeline-item' }, element('span', { className: 'ds-timeline-dot', 'aria-hidden': 'true' }), element('div', { className: 'ds-timeline-content' }, element('strong', {}, item.title), item.description ? element('p', {}, item.description) : null, item.time ? element('time', item.dateTime ? { datetime: item.dateTime } : {}, item.time) : null)));
  if (!items.length) list.append(element('li', { className: 'ds-timeline-empty' }, 'No events yet.'));
  return list;
}
export function render(container) {
  const page = playground(container, { title: 'Timeline', description: guide.purpose });
  let title = 'Workspace created (mock)'; let compact = false;
  const items = () => [{ title, description: 'Alex created the demonstration workspace.', time: '26 Oct, 09:00', dateTime: '2026-10-26T09:00:00Z' }, { title: 'Review completed (mock)', description: 'The demonstration record is ready for approval.', time: '26 Oct, 10:30', dateTime: '2026-10-26T10:30:00Z' }];
  function update() { const view = createTimeline({ items: items(), compact }); page.preview.replaceChildren(view); page.setSnippet(view.outerHTML); }
  page.controls.append(textControl('First event', title, value => { title = value; update(); }), toggleControl('Compact', compact, value => { compact = value; update(); }));
  page.states.append(statePreview('Empty', createTimeline())); update();
}
