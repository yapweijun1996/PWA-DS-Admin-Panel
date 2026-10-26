import { element, text, playground, textControl, toggleControl, statePreview, statusMessage, escapeHTML, uniqueId } from './playground.js';

export function render(container) {
  const page = playground(container, { title: text('Switch', '开关'), description: text('A binary setting that takes effect immediately. Space or Enter toggles the same accessible switch.', '立即生效的二元设置。空格或回车均可切换此无障碍开关。') });
  const props = { label: text('Enable notifications', '启用通知'), checked: true, disabled: false };
  const labelId = uniqueId('switch-label');
  const toggle = element('button', { type: 'button', role: 'switch', className: 'ds-switch', 'aria-labelledby': labelId, onclick: () => { props.checked = !props.checked; checkedControl.querySelector('input').checked = props.checked; update(); } }, element('span', { className: 'ds-switch-thumb' }));
  const label = element('span', { id: labelId });
  const feedback = statusMessage();
  page.preview.append(element('div', { className: 'component-demo-stack' }, element('div', { className: 'ds-switch-field' }, toggle, label), feedback));
  function update() {
    label.textContent = props.label;
    toggle.disabled = props.disabled;
    toggle.setAttribute('aria-checked', String(props.checked));
    feedback.textContent = props.checked ? text('Notifications are on (mock preference).', '通知已开启（模拟偏好）。') : text('Notifications are off (mock preference).', '通知已关闭（模拟偏好）。');
    page.setSnippet(`<div class="ds-switch-field">\n  <button type="button" class="ds-switch" role="switch" aria-checked="${props.checked}" aria-labelledby="notifications-label"${props.disabled ? ' disabled' : ''}>\n    <span class="ds-switch-thumb"></span>\n  </button>\n  <span id="notifications-label">${escapeHTML(props.label)}</span>\n</div>`);
  }
  const checkedControl = toggleControl(text('On', '开启'), true, value => { props.checked = value; update(); });
  page.controls.append(textControl(text('Label', '标签'), props.label, value => { props.label = value; update(); }), checkedControl, toggleControl(text('Disabled', '禁用'), false, value => { props.disabled = value; update(); }));
  for (const [name, checked, disabled, extra] of [[text('Off', '关闭'), false, false, ''], [text('On', '开启'), true, false, ''], [text('Hover', '悬停'), true, false, 'is-hover'], [text('Focus', '聚焦'), true, false, 'is-focus'], [text('Disabled', '禁用'), true, true, '']]) {
    const sample = element('button', { type: 'button', role: 'switch', 'aria-label': `${name} ${text('switch', '开关')}`, 'aria-checked': String(checked), className: `ds-switch ${extra}`, disabled, onclick: event => { const next = event.currentTarget.getAttribute('aria-checked') !== 'true'; event.currentTarget.setAttribute('aria-checked', String(next)); feedback.textContent = text(`${name} switch is ${next ? 'on' : 'off'}.`, `${name}开关已${next ? '开启' : '关闭'}。`); } }, element('span', { className: 'ds-switch-thumb' }));
    page.states.append(statePreview(name, sample));
  }
  update();
}
