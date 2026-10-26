import { element, text, playground, textControl, toggleControl, choiceControl, field, statePreview, statusMessage, escapeHTML, uniqueId } from './playground.js';

export function render(container) {
  const page = playground(container, { title: text('Input', '输入框'), description: text('A labelled field with clear helper text, accessible validation, and a complete editable value.', '提供明确标签、辅助文字、无障碍验证和可编辑内容。') });
  const props = { label: text('Workspace name', '工作区名称'), placeholder: text('Enter a name', '输入名称'), value: '', type: 'text', disabled: false, error: false, required: false };
  const input = element('input', { className: 'ds-input', id: uniqueId('demo-input'), oninput: event => { props.value = event.target.value; feedback.textContent = props.value ? text(`Current value: ${props.value}`, `当前值：${props.value}`) : text('The field is empty.', '输入框为空。'); updateSnippet(); } });
  const label = element('label', { for: input.id });
  const hint = element('small', { id: `${input.id}-hint` });
  const feedback = statusMessage(text('The field is empty.', '输入框为空。'));
  const form = element('form', { className: 'component-demo-stack', onsubmit: event => {
    event.preventDefault();
    if (props.error) { feedback.textContent = text('Resolve the field error before saving.', '请先修复输入错误再保存。'); input.focus(); return; }
    feedback.textContent = text(`Saved mock value: ${props.value || '(empty)'}`, `已保存模拟值：${props.value || '（空）'}`);
  } }, element('div', { className: 'component-field' }, label, input, hint), element('button', { type: 'submit', className: 'ds-button ds-button-secondary' }, text('Validate mock form', '验证模拟表单')), feedback);
  page.preview.append(form);
  function updateSnippet() {
    page.setSnippet(`<label for="workspace-name">${escapeHTML(props.label)}</label>\n<input id="workspace-name" class="ds-input${props.error ? ' is-error' : ''}" type="${props.type}" placeholder="${escapeHTML(props.placeholder)}" value="${escapeHTML(props.value)}" aria-describedby="workspace-hint"${props.error ? ' aria-invalid="true"' : ''}${props.required ? ' required' : ''}${props.disabled ? ' disabled' : ''}>\n<small id="workspace-hint">${escapeHTML(hint.textContent)}</small>`);
  }
  function update() {
    label.textContent = `${props.label}${props.required ? ' *' : ''}`;
    input.type = props.type;
    input.placeholder = props.placeholder;
    input.disabled = props.disabled;
    input.required = props.required;
    input.classList.toggle('is-error', props.error);
    input.setAttribute('aria-invalid', String(props.error));
    input.setAttribute('aria-describedby', hint.id);
    hint.textContent = props.error ? text('Please enter a valid workspace name.', '请输入有效的工作区名称。') : text('Use a short, recognizable name. This form uses mock data.', '使用简短易懂的名称。此表单使用模拟数据。');
    hint.className = props.error ? 'component-error' : '';
    updateSnippet();
  }
  page.controls.append(textControl(text('Label', '标签'), props.label, value => { props.label = value; update(); }), textControl(text('Placeholder', '占位文字'), props.placeholder, value => { props.placeholder = value; update(); }), choiceControl(text('Type', '类型'), props.type, [{ value: 'text', label: text('Text', '文字') }, { value: 'email', label: text('Email', '电子邮件') }, { value: 'password', label: text('Password', '密码') }], value => { props.type = value; update(); }), toggleControl(text('Required', '必填'), false, value => { props.required = value; update(); }), toggleControl(text('Disabled', '禁用'), false, value => { props.disabled = value; update(); }), toggleControl(text('Error', '错误'), false, value => { props.error = value; update(); }));
  for (const [name, className, disabled] of [[text('Default', '默认'), '', false], [text('Hover', '悬停'), 'is-hover', false], [text('Focus', '聚焦'), 'is-focus', false], [text('Disabled', '禁用'), '', true], [text('Error', '错误'), 'is-error', false]]) page.states.append(statePreview(name, element('input', { type: 'text', className: `ds-input ${className}`, placeholder: text('Enter text', '输入文字'), 'aria-label': name, 'aria-invalid': String(className === 'is-error'), disabled })));
  update();
}
