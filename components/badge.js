import { element, text, playground, textControl, choiceControl, toggleControl, statePreview } from './playground.js';
import { createTag, tagTones } from './tag.js';

export function createBadge(options = {}) { return createTag(options); }

export function render(container) {
  const page = playground(container, { title: text('Badge', '徽章'), description: text('Soft semantic fills with contrast-safe labels, optional status dots, and rounded pill variants. Status is always named in text.', '柔和语义背景配合清晰文字，支持状态点及胶囊样式。状态始终包含文字说明。') });
  const props = { label: text('Active', '启用'), tone: 'success', dot: true, pill: true, size: 'medium' };
  function update() { const badge = createBadge(props); page.preview.replaceChildren(badge); page.setSnippet(badge.outerHTML); }
  page.controls.append(textControl(text('Label', '标签'), props.label, value => { props.label = value; update(); }), choiceControl(text('Tone', '色调'), props.tone, tagTones.map(value => ({ value, label: value })), value => { props.tone = value; update(); }), choiceControl(text('Size', '大小'), props.size, [{ value: 'medium', label: text('Medium', '中') }, { value: 'small', label: text('Small', '小') }], value => { props.size = value; update(); }), toggleControl(text('Status dot', '状态点'), props.dot, value => { props.dot = value; update(); }), toggleControl(text('Pill shape', '胶囊形状'), props.pill, value => { props.pill = value; update(); }));
  const labels = [text('Draft', '草稿'), text('New', '新增'), text('Paid', '已付款'), text('Pending', '待处理'), text('Failed', '失败'), text('Information', '信息')];
  tagTones.forEach((tone, index) => page.states.append(statePreview(tone, element('div', { className: 'component-row' }, createBadge({ label: labels[index], tone }), createBadge({ label: labels[index], tone, dot: true, pill: true })))));
  update();
}
