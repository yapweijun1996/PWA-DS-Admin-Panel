import { element, text, playground, textControl, choiceControl, statePreview } from './playground.js';
import { createBadge } from './badge.js';

export function createDescriptionList({ items = [], columns = 1 } = {}) {
  return element('dl', { className: `ds-description-list${Number(columns) === 2 ? ' ds-description-list-columns' : ''}` }, ...items.map(item => element('div', { className: 'ds-description-row' }, element('dt', {}, item.term), element('dd', {}, item.value ?? text('Not provided', '未提供')))));
}

export function render(container) {
  const page = playground(container, { title: text('DescriptionList', '描述列表'), description: text('Semantic term/value pairs for readable record details. Values may be text or real components; long values wrap safely.', '使用语义化的名称/值配对展示记录详情。值可为文字或实际组件，长内容会安全换行。') });
  const props = { name: 'Olivia Rhye', columns: 1 };
  function items() { return [{ term: text('Name', '姓名'), value: props.name }, { term: text('Email', '邮箱'), value: 'olivia.rhye@example.com' }, { term: text('Status', '状态'), value: createBadge({ label: text('Active (mock)', '启用（模拟）'), tone: 'success', pill: true, dot: true }) }, { term: text('Company', '公司'), value: text('Forma workspace (mock)', 'Forma 工作区（模拟）') }]; }
  function update() { const list = createDescriptionList({ items: items(), columns: props.columns }); page.preview.replaceChildren(list); page.setSnippet(list.outerHTML); }
  page.controls.append(textControl(text('Mock name', '模拟姓名'), props.name, value => { props.name = value; update(); }), choiceControl(text('Columns', '列数'), String(props.columns), [{ value: '1', label: text('One', '一列') }, { value: '2', label: text('Two', '两列') }], value => { props.columns = Number(value); update(); }));
  page.states.append(statePreview(text('Missing value', '缺少值'), createDescriptionList({ items: [{ term: text('Phone', '电话'), value: null }] })), statePreview(text('Long value', '较长值'), createDescriptionList({ items: [{ term: text('Identifier', '标识符'), value: 'MOCK-CUSTOMER-EXTENDED-REFERENCE-000000000001' }] })));
  update();
}
