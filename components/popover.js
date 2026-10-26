import { element, text, playground, textControl, toggleControl, choiceControl, statePreview, statusMessage, button, openModal, copyText, uniqueId, escapeHTML, onDetach } from './playground.js';

function createMenu({ label, placement = 'end', disabled = false, items }) {
  const id = uniqueId('menu');
  const menu = element('div', { id, role: 'menu', className: 'ds-popover-menu', 'aria-label': label, hidden: true });
  const trigger = button(label, () => menu.hidden ? open() : close(), 'secondary', { 'aria-haspopup': 'menu', 'aria-controls': id, 'aria-expanded': 'false', disabled });
  const root = element('div', { className: 'ds-popover' }, trigger, menu);
  const itemButtons = items.map(item => {
    const option = element('button', { type: 'button', role: 'menuitem', className: `ds-menu-item${item.danger ? ' ds-menu-item-danger' : ''}`, tabindex: '-1', disabled: item.disabled, onclick: () => { close(true); item.action(); } }, item.label);
    menu.append(option);
    return option;
  });
  function enabled() { return itemButtons.filter(item => !item.disabled); }
  function position() {
    if (!root.isConnected) { close(); return; }
    const rect = trigger.getBoundingClientRect();
    const bounds = menu.getBoundingClientRect();
    const left = placement === 'end' ? rect.right - bounds.width : rect.left;
    const top = rect.bottom + 7 + bounds.height > window.innerHeight - 8 ? rect.top - bounds.height - 7 : rect.bottom + 7;
    menu.style.left = `${Math.max(8, Math.min(left, window.innerWidth - bounds.width - 8))}px`;
    menu.style.top = `${Math.max(8, Math.min(top, window.innerHeight - bounds.height - 8))}px`;
  }
  function outside(event) { if (!root.contains(event.target)) close(); }
  function open(last = false) {
    if (disabled) return;
    menu.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    position();
    (last ? enabled().at(-1) : enabled()[0])?.focus();
    document.addEventListener('pointerdown', outside);
    window.addEventListener('resize', position);
    window.addEventListener('scroll', position, true);
    window.addEventListener('hashchange', closeForNavigation);
  }
  function close(returnFocus = false) {
    menu.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    document.removeEventListener('pointerdown', outside);
    window.removeEventListener('resize', position);
    window.removeEventListener('scroll', position, true);
    window.removeEventListener('hashchange', closeForNavigation);
    if (returnFocus && trigger.isConnected) trigger.focus();
  }
  function closeForNavigation() { close(); }
  trigger.addEventListener('keydown', event => { if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); open(event.key === 'ArrowUp'); } });
  menu.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(true); return; }
    if (event.key === 'Tab') { close(true); return; }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const buttons = enabled();
    let index = buttons.indexOf(document.activeElement);
    if (event.key === 'Home') index = 0;
    else if (event.key === 'End') index = buttons.length - 1;
    else index = (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
    buttons[index]?.focus();
  });
  root.addEventListener('focusout', event => { if (!root.contains(event.relatedTarget)) close(); });
  onDetach(root, close);
  return { element: root, trigger, close };
}

export function render(container) {
  const page = playground(container, { title: text('Popover menu', '弹出菜单'), description: text('A custom action menu with arrow-key navigation, Escape, outside-click dismissal, and focus return. Actions operate on local mock workspace data.', '自定义操作菜单，支持方向键、Escape、点击外部关闭和焦点返回。操作仅更改本地模拟工作区数据。') });
  const props = { label: text('Workspace actions', '工作区操作'), placement: 'end', disabled: false, destructive: true };
  let workspaceName = text('Design workspace', '设计工作区');
  let archived = false;
  let current;
  const menuSlot = element('div', { className: 'component-row' });
  const summary = element('p', { className: 'component-feedback' });
  const feedback = statusMessage(text('Open the menu and choose an action.', '打开菜单并选择操作。'));
  const restore = button(text('Restore mock workspace', '恢复模拟工作区'), () => { archived = false; feedback.textContent = text('Mock workspace restored.', '模拟工作区已恢复。'); update(); });
  page.preview.append(element('div', { className: 'component-demo-stack' }, summary, menuSlot, restore, feedback));
  async function copyLink() {
    try { await copyText(`${location.origin}${location.pathname}#/components/popover`); feedback.textContent = text('Playground link copied.', '组件示例链接已复制。'); } catch { feedback.textContent = text('Copy unavailable. Copy the address from your browser.', '无法复制。请从浏览器复制地址。'); }
  }
  function rename() {
    const id = uniqueId('rename');
    const input = element('input', { id, className: 'ds-input', value: workspaceName, required: true });
    const error = element('small', { className: 'component-error', id: `${id}-error`, role: 'alert' });
    input.setAttribute('aria-describedby', error.id);
    const form = element('form', { className: 'component-demo-stack', onsubmit: event => { event.preventDefault(); save(); } }, element('label', { for: id }, text('Mock workspace name', '模拟工作区名称')), input, error);
    const dialog = openModal({ title: text('Rename mock workspace', '重命名模拟工作区'), content: form, actions: [{ label: text('Cancel', '取消'), onClick: close => close() }, { label: text('Rename', '重命名'), variant: 'primary', onClick: () => save() }] });
    function save() {
      if (!input.value.trim()) { error.textContent = text('Enter a workspace name.', '请输入工作区名称。'); input.setAttribute('aria-invalid', 'true'); input.focus(); return; }
      workspaceName = input.value.trim();
      dialog.close();
      feedback.textContent = text(`Mock workspace renamed to ${workspaceName}.`, `模拟工作区已重命名为${workspaceName}。`);
      update();
      current.trigger.focus();
    }
    input.focus();
  }
  function archive() {
    openModal({ title: text('Archive mock workspace?', '归档模拟工作区？'), content: element('p', { className: 'component-feedback' }, text('This only changes the mock example. You can restore it immediately.', '此操作仅更改模拟示例。归档后可立即恢复。')), actions: [{ label: text('Cancel', '取消'), onClick: close => close() }, { label: text('Archive mock workspace', '归档模拟工作区'), variant: 'danger', onClick: close => { archived = true; close(); feedback.textContent = text('Mock workspace archived.', '模拟工作区已归档。'); update(); restore.focus(); } }] });
  }
  function items() {
    return [{ label: text('Copy playground link', '复制组件示例链接'), action: copyLink }, { label: text('Rename mock workspace', '重命名模拟工作区'), action: rename, disabled: archived }, ...(props.destructive ? [{ label: text('Archive mock workspace', '归档模拟工作区'), action: archive, danger: true, disabled: archived }] : [])];
  }
  function update() {
    current?.close();
    current = createMenu({ ...props, items: items() });
    menuSlot.replaceChildren(current.element);
    summary.textContent = `${workspaceName} · ${archived ? text('Archived (mock)', '已归档（模拟）') : text('Active (mock)', '启用（模拟）')}`;
    restore.hidden = !archived;
    page.setSnippet(`<div class="ds-popover">\n  <button type="button" class="ds-button ds-button-secondary" aria-haspopup="menu" aria-expanded="false" aria-controls="workspace-menu"${props.disabled ? ' disabled' : ''}>${escapeHTML(props.label)}</button>\n  <div id="workspace-menu" class="ds-popover-menu" role="menu" aria-label="${escapeHTML(props.label)}" hidden>\n${items().map(item => `    <button type="button" role="menuitem" class="ds-menu-item${item.danger ? ' ds-menu-item-danger' : ''}" tabindex="-1"${item.disabled ? ' disabled' : ''}>${escapeHTML(item.label)}</button>`).join('\n')}\n  </div>\n</div>`);
  }
  page.controls.append(textControl(text('Trigger label', '触发文字'), props.label, value => { props.label = value; update(); }), choiceControl(text('Alignment', '对齐'), props.placement, [{ value: 'start', label: text('Start', '起始侧') }, { value: 'end', label: text('End', '结束侧') }], value => { props.placement = value; update(); }), toggleControl(text('Disabled', '禁用'), false, value => { props.disabled = value; update(); }), toggleControl(text('Destructive action', '危险操作'), true, value => { props.destructive = value; update(); }));
  for (const [label, extra, disabled] of [[text('Default', '默认'), '', false], [text('Hover', '悬停'), 'is-hover', false], [text('Focus', '聚焦'), 'is-focus', false], [text('Disabled', '禁用'), '', true]]) {
    const example = createMenu({ label: text('Actions', '操作'), items: [{ label: text('Copy playground link', '复制组件示例链接'), action: copyLink }, { label: text('Show mock information', '显示模拟信息'), action: () => { feedback.textContent = text('This workspace is a local, mock-only demonstration.', '此工作区仅用于本地模拟演示。'); } }], disabled });
    if (extra) example.trigger.classList.add(extra);
    page.states.append(statePreview(label, example.element));
  }
  update();
}
