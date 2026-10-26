import { element, text, playground, textControl, toggleControl, statePreview, statusMessage, button, openModal, uniqueId } from './playground.js';
import { createDescriptionList } from './description-list.js';

export function openDrawer(options = {}) {
  const dialog = openModal(options);
  dialog.element.classList.add('ds-drawer');
  dialog.element.parentElement.classList.add('ds-drawer-backdrop');
  return dialog;
}

export function createDetailPanel({ title, content, onClose } = {}) {
  const id = uniqueId('detail-title');
  return element('section', { className: 'ds-detail-panel', 'aria-labelledby': id }, element('header', { className: 'ds-detail-panel-header' }, element('h3', { id }, title), onClose ? button(element('span', { 'aria-hidden': 'true' }, '×'), onClose, 'ghost', { 'aria-label': text('Close details', '关闭详情') }) : null), element('div', { className: 'ds-detail-panel-body' }, content));
}

export function render(container) {
  const page = playground(container, { title: text('Drawer', '抽屉面板'), description: text('A modal side panel for focused record details. Reuses the dialog focus trap, Escape, backdrop dismissal, scroll lock, and focus return.', '用于集中查看记录详情的侧边面板。复用对话框的焦点循环、Escape、背景关闭、滚动锁定与焦点返回功能。') });
  const props = { title: text('Mock customer details', '模拟客户详情'), dismissible: true };
  const feedback = statusMessage(text('Open the drawer and try Tab, Shift+Tab, and Escape.', '打开抽屉，尝试 Tab、Shift+Tab 和 Escape。'));
  function details() {
    return element('div', { className: 'component-demo-stack' }, element('p', { className: 'component-feedback' }, text('Mock record. No server writes.', '模拟记录，不会写入服务器。')), createDescriptionList({ items: [{ term: text('Name', '姓名'), value: 'Olivia Rhye' }, { term: text('Email', '邮箱'), value: 'olivia.rhye@example.com' }, { term: text('Company', '公司'), value: 'Forma Studio' }] }));
  }
  function launch() {
    openDrawer({ ...props, content: details(), actions: [{ label: text('Close details', '关闭详情'), onClick: close => close() }], onClose: () => { feedback.textContent = text('Drawer closed. Focus returned to its opener.', '抽屉已关闭，焦点已返回打开按钮。'); } });
  }
  const trigger = button(text('Open detail drawer', '打开详情抽屉'), launch, 'primary', { 'aria-haspopup': 'dialog' });
  page.preview.append(element('div', { className: 'component-demo-stack' }, trigger, feedback));
  function update() {
    const panel = element('section', { className: 'ds-modal ds-drawer', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'drawer-title', 'aria-describedby': 'drawer-body', tabindex: '-1' },
      element('header', { className: 'ds-modal-header' }, element('h2', { id: 'drawer-title' }, props.title), props.dismissible ? element('button', { type: 'button', className: 'ds-button ds-button-ghost', 'aria-label': text('Close dialog', '关闭对话框') }, text('Close', '关闭')) : null),
      element('div', { className: 'ds-modal-body', id: 'drawer-body' }, details()),
      element('footer', { className: 'ds-modal-footer' }, element('button', { type: 'button', className: 'ds-button ds-button-secondary' }, text('Close details', '关闭详情'))));
    page.setSnippet(`${trigger.outerHTML}\n${element('div', { className: 'ds-modal-backdrop ds-drawer-backdrop' }, panel).outerHTML}`);
  }
  page.controls.append(textControl(text('Title', '标题'), props.title, value => { props.title = value; update(); }), toggleControl(text('Escape / backdrop dismissal', 'Escape / 背景关闭'), true, value => { props.dismissible = value; update(); }));
  page.states.append(statePreview(text('Modal details', '模态详情'), button(text('Open drawer', '打开抽屉'), launch)), statePreview(text('Inline detail panel', '行内详情'), createDetailPanel({ title: text('Mock record', '模拟记录'), content: text('An inline panel does not trap focus or block the page.', '行内面板不会限制焦点或阻挡页面。') })));
  update();
}
