import { element, text, playground, textControl, statePreview, statusMessage, button } from './playground.js';
import { createDetailPanel } from './drawer.js';
import { createDescriptionList } from './description-list.js';

export function render(container) {
  const page = playground(container, { title: text('DetailPanel', '详情面板'), description: text('Inline record details without modal focus or scroll locking. Use a drawer instead when details must overlay the page.', '行内展示记录详情，不限制焦点或锁定滚动。需要覆盖页面时，应使用抽屉面板。') });
  let title = text('Mock customer', '模拟客户');
  const feedback = statusMessage();
  const restore = button(text('Restore details', '恢复详情'), () => { update(); restore.hidden = true; });
  const slot = element('div');
  function update() {
    let panel;
    panel = createDetailPanel({ title, content: createDescriptionList({ items: [{ term: text('Name', '姓名'), value: 'Olivia Rhye' }, { term: text('Source', '来源'), value: text('Mock data', '模拟数据') }] }), onClose: () => { panel.remove(); restore.hidden = false; restore.focus(); feedback.textContent = text('Details closed.', '详情已关闭。'); } });
    slot.replaceChildren(panel); restore.hidden = true; page.setSnippet(panel.outerHTML);
  }
  page.preview.append(element('div', { className: 'component-demo-stack' }, slot, restore, feedback));
  page.controls.append(textControl(text('Title', '标题'), title, value => { title = value; update(); }));
  page.states.append(statePreview(text('Read only', '只读'), createDetailPanel({ title: text('Mock record', '模拟记录'), content: text('No close action is shown when none is supplied.', '未提供关闭行为时，不显示关闭按钮。') })));
  update();
}
