import { element, text, playground, textControl, statePreview } from './playground.js';

export function createBreadcrumbs({ items = [], label = text('Breadcrumb', '面包屑导航') } = {}) {
  const list = element('ol', { className: 'ds-breadcrumbs-list' });
  items.forEach((item, index) => {
    const current = index === items.length - 1;
    list.append(element('li', {}, current || !item.href
      ? element('span', { 'aria-current': current ? 'page' : undefined }, item.label)
      : element('a', { href: item.href }, item.label)));
  });
  return element('nav', { className: 'ds-breadcrumbs', 'aria-label': label }, list);
}

export function render(container) {
  const page = playground(container, { title: text('Breadcrumbs', '面包屑导航'), description: text('Linked ancestors and a clearly identified current page. Links navigate to real documentation routes.', '链接到上级页面，并明确标记当前页面。链接可打开真实组件文档。') });
  let label = text('Breadcrumbs', '面包屑导航');
  function update() {
    const preview = createBreadcrumbs({ items: [{ label: text('Overview', '概览'), href: '#/overview' }, { label: text('Components', '组件'), href: '#/components' }, { label }] });
    page.preview.replaceChildren(preview);
    page.setSnippet(preview.outerHTML);
  }
  page.controls.append(textControl(text('Current page', '当前页面'), label, value => { label = value; update(); }));
  page.states.append(statePreview(text('Single page', '单个页面'), createBreadcrumbs({ items: [{ label: text('Overview', '概览') }] })), statePreview(text('Long label', '长标签'), createBreadcrumbs({ items: [{ label: text('Components', '组件'), href: '#/components' }, { label: text('A long documentation page name wraps without hiding its location', '较长的文档名称会换行，仍显示完整位置') }] })));
  update();
}
