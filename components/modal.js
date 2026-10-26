import { element, text, playground, textControl, toggleControl, choiceControl, statePreview, statusMessage, button, openModal, loadingIndicator, escapeHTML, uniqueId } from './playground.js';

export function render(container) {
  const page = playground(container, { title: text('Modal', '模态对话框'), description: text('A focused decision with a trapped tab sequence, Escape dismissal, backdrop close, and focus returned to the opener.', '提供聚焦操作流程，支持循环焦点、Escape 和背景关闭，并将焦点返回打开按钮。') });
  const props = { title: text('Edit workspace', '编辑工作区'), description: text('Update the mock workspace name. No server writes are made.', '更新模拟工作区名称。不会写入服务器。'), size: 'medium', dismissible: true };
  let workspaceName = text('Design workspace', '设计工作区');
  const feedback = statusMessage(text('Open the dialog and try Tab, Shift+Tab, and Escape.', '打开对话框，尝试 Tab、Shift+Tab 和 Escape。'));
  const trigger = button(text('Open modal', '打开对话框'), () => launch(), 'primary');
  page.preview.append(element('div', { className: 'component-demo-stack' }, trigger, feedback));
  function launch(state = 'default') {
    const id = uniqueId('workspace');
    const input = element('input', { id, type: 'text', className: 'ds-input', value: state === 'error' ? '' : workspaceName, required: true, 'aria-describedby': `${id}-error` });
    const error = element('small', { id: `${id}-error`, className: 'component-error', role: 'alert' }, state === 'error' ? text('Workspace name is required.', '工作区名称为必填项。') : '');
    input.setAttribute('aria-invalid', String(state === 'error'));
    const progress = element('div', { className: 'component-feedback', role: 'status' });
    const content = element('form', { className: 'component-demo-stack', onsubmit: event => { event.preventDefault(); save(); } }, element('p', { className: 'component-feedback' }, props.description), element('div', { className: 'component-field' }, element('label', { for: id }, text('Workspace name', '工作区名称')), input, error), progress);
    let timer;
    let saving = state === 'loading';
    if (saving) { input.disabled = true; progress.append(loadingIndicator(text('Saving mock changes…', '正在保存模拟更改…'))); }
    const dialog = openModal({ title: props.title, content, size: props.size, dismissible: props.dismissible, actions: [
      { label: text('Cancel', '取消'), onClick: close => close('cancel') },
      { label: saving ? text('Finish mock saving', '完成模拟保存') : text('Save mock changes', '保存模拟更改'), variant: 'primary', onClick: () => saving && state === 'loading' ? dialog.close('saved') : save() }
    ], onClose(reason) { clearTimeout(timer); feedback.textContent = reason === 'saved' ? text(`Mock workspace saved: ${workspaceName}`, `模拟工作区已保存：${workspaceName}`) : text('Dialog closed without saving. Focus returned to the opener.', '对话框已关闭且未保存。焦点已返回打开按钮。'); update(); } });
    function save() {
      if (saving) return;
      const value = input.value.trim();
      if (!value) { input.setAttribute('aria-invalid', 'true'); error.textContent = text('Workspace name is required.', '工作区名称为必填项。'); input.focus(); return; }
      saving = true;
      input.disabled = true;
      error.textContent = '';
      input.setAttribute('aria-invalid', 'false');
      progress.replaceChildren(loadingIndicator(text('Saving mock changes…', '正在保存模拟更改…')));
      dialog.element.querySelector('.ds-modal-footer .ds-button-primary').disabled = true;
      timer = setTimeout(() => { workspaceName = value; dialog.close('saved'); }, 700);
    }
    if (state === 'error') input.focus();
  }
  function update() {
    page.setSnippet(`<button type="button" aria-haspopup="dialog">${escapeHTML(text('Open modal', '打开对话框'))}</button>\n<div class="ds-modal-backdrop">\n  <section class="ds-modal ds-modal-${props.size}" role="dialog" aria-modal="true" aria-labelledby="modal-title" aria-describedby="modal-description" tabindex="-1">\n    <header class="ds-modal-header"><h2 id="modal-title">${escapeHTML(props.title)}</h2></header>\n    <div class="ds-modal-body">\n      <p id="modal-description">${escapeHTML(props.description)}</p>\n      <label for="modal-name">${escapeHTML(text('Workspace name', '工作区名称'))}</label>\n      <input id="modal-name" class="ds-input" value="${escapeHTML(workspaceName)}" required>\n    </div>\n    <footer class="ds-modal-footer">\n      <button type="button" class="ds-button ds-button-secondary">${escapeHTML(text('Cancel', '取消'))}</button>\n      <button type="button" class="ds-button ds-button-primary">${escapeHTML(text('Save mock changes', '保存模拟更改'))}</button>\n    </footer>\n  </section>\n</div>`);
  }
  page.controls.append(textControl(text('Title', '标题'), props.title, value => { props.title = value; update(); }), textControl(text('Description', '说明'), props.description, value => { props.description = value; update(); }), choiceControl(text('Size', '大小'), props.size, [{ value: 'small', label: text('Small', '小') }, { value: 'medium', label: text('Medium', '中') }, { value: 'large', label: text('Large', '大') }], value => { props.size = value; update(); }), toggleControl(text('Escape / backdrop dismissal', 'Escape / 背景关闭'), true, value => { props.dismissible = value; update(); }));
  for (const [name, state, className] of [[text('Default', '默认'), 'default', ''], [text('Hover', '悬停'), 'default', 'is-hover'], [text('Focus', '聚焦'), 'default', 'is-focus'], [text('Error', '错误'), 'error', ''], [text('Loading', '加载中'), 'loading', '']]) page.states.append(statePreview(name, button(text('Open example', '打开示例'), () => launch(state), 'secondary', { className: `ds-button ds-button-secondary ${className}` })));
  update();
}
