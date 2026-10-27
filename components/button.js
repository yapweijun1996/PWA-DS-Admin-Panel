import { element, text, playground, textControl, toggleControl, choiceControl, statePreview, statusMessage, escapeHTML, loadingIndicator } from './playground.js';
import { localizeText } from '../js/i18n.js';

export function render(container) {
  const page = playground(container, { title: text('Button', '按钮'), description: text('Clear actions with primary, secondary, quiet, and destructive treatments. Loading prevents duplicate actions.', '提供主要、次要、简洁和危险操作样式。加载状态可避免重复操作。') });
  const props = { label: text('Save changes', '保存更改'), variant: 'primary', size: 'medium', disabled: false, loading: false };
  let count = 0;
  const feedback = statusMessage(text('Click the button to try the action.', '点击按钮以尝试操作。'));
  const previewButton = element('button', { type: 'button', onclick: () => { count += 1; feedback.textContent = text(`Action completed ${count} time${count === 1 ? '' : 's'}.`, `操作已完成 ${count} 次。`); } });
  page.preview.append(element('div', { className: 'component-demo-stack' }, previewButton, feedback));
  function update() {
    previewButton.className = `ds-button ds-button-${props.variant} ds-button-${props.size}`;
    previewButton.disabled = props.disabled || props.loading;
    previewButton.setAttribute('aria-busy', String(props.loading));
    previewButton.replaceChildren(props.loading ? loadingIndicator(props.label || text('Loading', '加载中')) : props.label);
    page.setSnippet(`<button type="button" class="ds-button ds-button-${props.variant} ds-button-${props.size}"${props.disabled || props.loading ? ' disabled' : ''}${props.loading ? ' aria-busy="true"' : ''}>${props.loading ? '<span class="ds-spinner" aria-hidden="true"></span> ' : ''}${escapeHTML(props.label)}</button>`);
  }
  page.controls.append(
    textControl(text('Label', '文字'), props.label, value => { props.label = value; update(); }),
    choiceControl(text('Variant', '样式'), props.variant, [{ value: 'primary', label: text('Primary', '主要') }, { value: 'secondary', label: text('Secondary', '次要') }, { value: 'ghost', label: text('Ghost', '简洁') }, { value: 'danger', label: text('Danger', '危险') }], value => { props.variant = value; update(); }),
    choiceControl(text('Size', '大小'), props.size, [{ value: 'small', label: text('Small', '小') }, { value: 'medium', label: text('Medium', '中') }, { value: 'large', label: text('Large', '大') }], value => { props.size = value; update(); }),
    toggleControl(text('Disabled', '禁用'), false, value => { props.disabled = value; update(); }),
    toggleControl(text('Loading', '加载中'), false, value => { props.loading = value; update(); })
  );
  for (const [label, extra, disabled] of [[text('Default', '默认'), '', false], [text('Hover', '悬停'), 'is-hover', false], [text('Focus', '聚焦'), 'is-focus', false], [text('Disabled', '禁用'), '', true]]) {
    const sample = element('button', { type: 'button', className: `ds-button ds-button-primary ${extra}`, disabled, onclick: () => { feedback.textContent = text(`${localizeText(label)} action completed.`, `${localizeText(label)}操作已完成。`); } }, text('Save', '保存'));
    page.states.append(statePreview(label, sample));
  }
  page.states.append(statePreview(text('Loading', '加载中'), element('button', { type: 'button', className: 'ds-button ds-button-primary', disabled: true, 'aria-busy': 'true' }, loadingIndicator(text('Saving', '保存中')))));
  update();
}
