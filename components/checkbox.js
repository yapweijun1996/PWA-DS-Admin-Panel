import { element, text, playground, textControl, toggleControl, statePreview, statusMessage, escapeHTML, uniqueId } from './playground.js';
import { localizeText } from '../js/i18n.js';

export function render(container) {
  const page = playground(container, { title: text('Checkbox', '复选框'), description: text('Explicit multi-selection with checked, unchecked, and mixed states. The full label is a generous click target.', '支持选中、未选中和部分选中状态。整个标签均可点击。') });
  const props = { label: text('Send me product updates', '向我发送产品更新'), checked: true, disabled: false, indeterminate: false, error: false };
  const input = element('input', { type: 'checkbox', id: uniqueId('checkbox'), className: 'ds-checkbox', onchange: event => { props.checked = event.target.checked; props.indeterminate = false; mixedControl.querySelector('input').checked = false; checkedControl.querySelector('input').checked = props.checked; update(); } });
  const label = element('span');
  const feedback = statusMessage();
  const hint = element('small', { id: `${input.id}-hint` });
  input.setAttribute('aria-describedby', hint.id);
  page.preview.append(element('div', { className: 'component-demo-stack' }, element('label', { className: 'ds-checkbox-label', for: input.id }, input, label), hint, feedback));
  function update() {
    input.checked = props.checked;
    input.disabled = props.disabled;
    input.indeterminate = props.indeterminate;
    input.setAttribute('aria-invalid', String(props.error));
    label.textContent = props.label;
    hint.textContent = props.error ? text('You must accept this option to continue.', '必须接受此选项才能继续。') : text('This preference is only a local playground example.', '此偏好仅用于本地组件示例。');
    hint.className = props.error ? 'component-error' : 'component-feedback';
    feedback.textContent = props.indeterminate ? text('Selection is mixed. Click to resolve it.', '当前为部分选中。点击即可更改。') : props.checked ? text('Checked', '已选中') : text('Unchecked', '未选中');
    page.setSnippet(`<label class="ds-checkbox-label">\n  <input type="checkbox" class="ds-checkbox"${props.checked ? ' checked' : ''}${props.disabled ? ' disabled' : ''}${props.error ? ' aria-invalid="true"' : ''}>\n  <span>${escapeHTML(props.label)}</span>\n</label>${props.indeterminate ? '\n<!-- Set input.indeterminate = true in JavaScript for the mixed state. -->' : ''}`);
  }
  const checkedControl = toggleControl(text('Checked', '选中'), props.checked, value => { props.checked = value; update(); });
  const mixedControl = toggleControl(text('Indeterminate', '部分选中'), false, value => { props.indeterminate = value; update(); });
  page.controls.append(textControl(text('Label', '标签'), props.label, value => { props.label = value; update(); }), checkedControl, mixedControl, toggleControl(text('Disabled', '禁用'), false, value => { props.disabled = value; update(); }), toggleControl(text('Error', '错误'), false, value => { props.error = value; update(); }));
  for (const [name, checked, disabled, mixed, extra] of [[text('Default', '默认'), false, false, false, ''], [text('Hover', '悬停'), false, false, false, 'is-hover'], [text('Focus', '聚焦'), false, false, false, 'is-focus'], [text('Checked', '选中'), true, false, false, ''], [text('Mixed', '部分选中'), false, false, true, ''], [text('Disabled', '禁用'), true, true, false, ''], [text('Error', '错误'), false, false, false, 'is-error']]) {
    const sample = element('input', { type: 'checkbox', className: `ds-checkbox ${extra}`, checked, disabled, 'aria-invalid': String(extra === 'is-error'), onchange: event => { feedback.textContent = text(`${localizeText(name)}: ${event.target.checked ? 'checked' : 'unchecked'}`, `${localizeText(name)}：${event.target.checked ? '已选中' : '未选中'}`); } });
    sample.indeterminate = mixed;
    page.states.append(statePreview(name, element('label', { className: 'ds-checkbox-label' }, sample, element('span', {}, text('Option', '选项')))));
  }
  update();
}
