import { element, text, playground, textControl, toggleControl, statePreview, statusMessage, button, uniqueId } from './playground.js';

export function createCard({ title, description, content, actions, footer } = {}) {
  const id = uniqueId('card-title');
  const card = element('section', { className: 'ds-card', 'aria-labelledby': title ? id : undefined });
  if (title || description || actions) card.append(element('header', { className: 'ds-card-header' }, element('div', { className: 'ds-card-heading' }, title ? element('h3', { id }, title) : null, description ? element('p', {}, description) : null), actions ? element('div', { className: 'ds-card-actions' }, actions) : null));
  if (content !== undefined) card.append(element('div', { className: 'ds-card-content' }, content));
  if (footer !== undefined) card.append(element('footer', { className: 'ds-card-footer' }, footer));
  return card;
}

export function render(container) {
  const page = playground(container, { title: text('Card', '卡片'), description: text('A solid, named container for related information with optional header actions and footer. Content remains readable in every appearance.', '为相关信息提供实体背景的容器，可包含标题操作与页脚，在各种外观下保持清晰。') });
  const props = { title: text('Workspace overview', '工作区概览'), description: text('A flexible container for related content.', '用于组织相关内容的灵活容器。'), footer: true };
  const feedback = statusMessage();
  let saved = false;
  function update() {
    const preview = createCard({ title: props.title, description: props.description, content: element('p', {}, text('Mock workspace details. Actions below update this local example only.', '模拟工作区信息。下方操作仅更改此本地示例。')), footer: props.footer ? [button(text('Reset', '重置'), () => { saved = false; feedback.textContent = text('Mock changes reset.', '模拟更改已重置。'); }), button(text('Save mock changes', '保存模拟更改'), () => { saved = true; feedback.textContent = text('Mock changes saved locally in this example.', '模拟更改已在当前示例中保存。'); }, 'primary')] : undefined });
    preview.dataset.saved = String(saved);
    page.preview.replaceChildren(preview, feedback);
    page.setSnippet(preview.outerHTML);
  }
  page.controls.append(textControl(text('Title', '标题'), props.title, value => { props.title = value; update(); }), textControl(text('Description', '说明'), props.description, value => { props.description = value; update(); }), toggleControl(text('Footer actions', '页脚操作'), true, value => { props.footer = value; update(); }));
  page.states.append(statePreview(text('Content only', '仅内容'), createCard({ content: text('A simple content card.', '简单内容卡片。') })), statePreview(text('Empty state', '空状态'), createCard({ title: text('No activity yet', '暂无活动'), description: text('Mock workspace activity will appear here.', '模拟工作区活动会显示在这里。') })));
  update();
}
