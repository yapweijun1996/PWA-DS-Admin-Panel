import { element, text, playground, textControl, toggleControl, customSelect, statePreview, statusMessage, escapeHTML } from './playground.js';

export function render(container) {
  const page = playground(container, { title: text('Select', '选择器'), description: text('A custom listbox with arrow-key navigation, Home / End, Enter to choose, and Escape to close. No native select or caret.', '自定义选项列表，支持方向键、Home / End、回车选择和 Escape 关闭。不使用原生选择框或箭头。') });
  const props = { label: text('Team', '团队'), disabled: false, error: false, value: 'design' };
  const options = [{ value: 'design', label: text('Design', '设计') }, { value: 'engineering', label: text('Engineering', '工程') }, { value: 'operations', label: text('Operations', '运营') }, { value: 'marketing', label: text('Marketing', '市场') }];
  const wrapper = element('div', { className: 'component-demo-stack' });
  const feedback = statusMessage();
  page.preview.append(wrapper);
  function update() {
    const choice = customSelect({ label: props.label, value: props.value, options, disabled: props.disabled, error: props.error, onChange(value) { props.value = value; updateFeedback(); updateSnippet(); } });
    const label = element('label', { for: choice.id }, props.label);
    const hint = element('small', { id: `${choice.id}-hint`, className: props.error ? 'component-error' : '' }, props.error ? text('Choose a team before continuing.', '请先选择一个团队。') : text('Select one team. Use arrow keys to navigate options.', '选择一个团队。使用方向键浏览选项。'));
    choice.trigger.setAttribute('aria-describedby', hint.id);
    wrapper.replaceChildren(element('div', { className: 'component-field' }, label, choice.element, hint), feedback);
    updateFeedback();
    updateSnippet();
  }
  function updateFeedback() { feedback.textContent = text('Selected team: ', '已选团队：') + options.find(option => option.value === props.value).label; }
  function updateSnippet() {
    page.setSnippet(`<label id="team-label" for="team-select">${escapeHTML(props.label)}</label>\n<div class="ds-select">\n  <button id="team-select" type="button" class="ds-select-trigger" aria-labelledby="team-label team-value" aria-haspopup="listbox" aria-expanded="false" aria-controls="team-options"${props.disabled ? ' disabled' : ''}${props.error ? ' aria-invalid="true"' : ''}><span id="team-value">${escapeHTML(options.find(option => option.value === props.value).label)}</span></button>\n  <div id="team-options" class="ds-select-options" role="listbox" aria-label="${escapeHTML(props.label)}" hidden>\n${options.map(option => `    <button type="button" role="option" class="ds-select-option" aria-selected="${option.value === props.value}">${escapeHTML(option.label)}</button>`).join('\n')}\n  </div>\n</div>`);
  }
  page.controls.append(textControl(text('Label', '标签'), props.label, value => { props.label = value; update(); }), toggleControl(text('Disabled', '禁用'), false, value => { props.disabled = value; update(); }), toggleControl(text('Error', '错误'), false, value => { props.error = value; update(); }));
  for (const [name, disabled, error, extra] of [[text('Default', '默认'), false, false, ''], [text('Hover', '悬停'), false, false, 'is-hover'], [text('Focus', '聚焦'), false, false, 'is-focus'], [text('Disabled', '禁用'), true, false, ''], [text('Error', '错误'), false, true, '']]) {
    const choice = customSelect({ label: name, value: 'design', options, disabled, error, onChange: value => { feedback.textContent = `${name}: ${options.find(option => option.value === value).label}`; } });
    if (extra) choice.trigger.classList.add(extra);
    page.states.append(statePreview(name, choice.element));
  }
  update();
}
