import { element, text, playground, textControl, toggleControl, choiceControl, statePreview, statusMessage, escapeHTML, button } from './playground.js';

export function render(container) { renderTag(container); }

export function renderTag(container, pill = false) {
  const page = playground(container, { title: pill ? text('Pill', '状态胶囊') : text('Tag', '标签'), description: text('Compact metadata with semantic status dots and optional dismissal. Labels remain readable without relying on color.', '紧凑的元数据标签，支持语义状态点及移除操作。不依赖颜色也能理解含义。') });
  const props = { label: text('Active', '启用'), tone: 'accent', removable: true, dot: true, disabled: false, size: 'medium' };
  let removed = false;
  const display = element('div', { className: 'component-row' });
  const feedback = statusMessage(text('Remove the tag, then restore it to try again.', '移除标签后可恢复并再次尝试。'));
  const restore = button(text('Restore tag', '恢复标签'), () => { removed = false; feedback.textContent = text('Tag restored.', '标签已恢复。'); update(); });
  page.preview.append(element('div', { className: 'component-demo-stack' }, display, feedback));
  function makeTag(extra = '', disabled = props.disabled, onRemove = () => { removed = true; feedback.textContent = text('Tag removed.', '标签已移除。'); update(); }) {
    const tag = element('span', { className: `ds-tag${pill ? ' ds-pill' : ''} ds-tag-${props.tone} ds-tag-${props.size} ${extra}` });
    if (props.dot) tag.append(element('span', { className: 'ds-tag-dot', 'aria-hidden': 'true' }));
    tag.append(element('span', {}, props.label));
    if (props.removable) tag.append(element('button', { type: 'button', className: 'ds-tag-remove', disabled, 'aria-label': text(`Remove ${props.label}`, `移除${props.label}`), onclick: onRemove }, element('span', { 'aria-hidden': 'true' }, '×')));
    return tag;
  }
  function update() {
    display.replaceChildren(removed ? restore : makeTag());
    const className = `ds-tag${pill ? ' ds-pill' : ''} ds-tag-${props.tone} ds-tag-${props.size}`;
    page.setSnippet(`<span class="${className}">\n${props.dot ? '  <span class="ds-tag-dot" aria-hidden="true"></span>\n' : ''}  <span>${escapeHTML(props.label)}</span>${props.removable ? `\n  <button type="button" class="ds-tag-remove" aria-label="${escapeHTML(text(`Remove ${props.label}`, `移除${props.label}`))}"${props.disabled ? ' disabled' : ''}><span aria-hidden="true">×</span></button>` : ''}\n</span>`);
    page.states.replaceChildren(
      statePreview(text('Default', '默认'), makeTag('', false, eventDismiss)),
      statePreview(text('Hover', '悬停'), makeTag('is-hover', false, eventDismiss)),
      statePreview(text('Focus', '聚焦'), makeTag('is-focus', false, eventDismiss)),
      statePreview(text('Disabled dismissal', '禁用移除'), makeTag('', true)),
      statePreview(text('Neutral', '中性'), element('span', { className: `ds-tag${pill ? ' ds-pill' : ''} ds-tag-neutral` }, text('Draft', '草稿'))),
      statePreview(text('Error status', '错误状态'), element('span', { className: `ds-tag${pill ? ' ds-pill' : ''} ds-tag-danger` }, element('span', { className: 'ds-tag-dot', 'aria-hidden': 'true' }), text('Failed', '失败')))
    );
  }
  function eventDismiss(event) { feedback.textContent = text('Example dismissed. Change a prop to restore the state examples.', '示例已移除。更改属性可恢复状态示例。'); event.currentTarget.closest('.ds-tag').remove(); }
  page.controls.append(textControl(text('Label', '标签文字'), props.label, value => { props.label = value; update(); }), choiceControl(text('Tone', '色调'), props.tone, [{ value: 'neutral', label: text('Neutral', '中性') }, { value: 'accent', label: text('Accent', '强调') }, { value: 'danger', label: text('Danger', '危险') }], value => { props.tone = value; update(); }), choiceControl(text('Size', '大小'), props.size, [{ value: 'medium', label: text('Medium', '中') }, { value: 'small', label: text('Small', '小') }], value => { props.size = value; update(); }), toggleControl(text('Status dot', '状态点'), true, value => { props.dot = value; update(); }), toggleControl(text('Removable', '可移除'), true, value => { props.removable = value; removed = false; update(); }), toggleControl(text('Disable dismissal', '禁用移除'), false, value => { props.disabled = value; update(); }));
  update();
}
