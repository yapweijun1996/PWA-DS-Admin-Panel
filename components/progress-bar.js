import { element, text, playground, textControl, choiceControl, toggleControl, statePreview } from './playground.js';

export function createProgressBar({ value = 0, max = 100, label = text('Usage', '使用量'), tone = 'accent', showValue = false } = {}) {
  const maximum = Number.isFinite(Number(max)) && Number(max) > 0 ? Number(max) : 100;
  const current = Math.max(0, Math.min(maximum, Number(value) || 0));
  const percent = current / maximum * 100;
  const bar = element('div', { className: 'ds-progress-track', role: 'progressbar', 'aria-label': label, 'aria-valuemin': '0', 'aria-valuemax': maximum, 'aria-valuenow': current, 'aria-valuetext': `${Math.round(percent)}%` }, element('span', { className: 'ds-progress-fill' }));
  bar.firstElementChild.style.width = `${percent}%`;
  const root = element('div', { className: `ds-progress ds-progress-${['accent', 'success', 'warning', 'danger', 'info', 'neutral'].includes(tone) ? tone : 'accent'}` }, bar);
  if (showValue) root.append(element('span', { className: 'ds-progress-value', 'aria-hidden': 'true' }, `${Math.round(percent)}%`));
  return root;
}

export function render(container) {
  const page = playground(container, { title: text('ProgressBar', '进度条'), description: text('Determinate progress or capacity with an accessible value and optional visible percentage. The preview is mock usage, not a running upload.', '展示确定的进度或容量，可读取数值并显示百分比。此示例为模拟用量，并非真实上传。') });
  const props = { value: 68, max: 100, label: text('Mock licence usage', '模拟许可证用量'), tone: 'accent', showValue: true };
  function update() { const bar = createProgressBar(props); page.preview.replaceChildren(bar); page.setSnippet(bar.outerHTML); }
  page.controls.append(textControl(text('Value', '数值'), props.value, value => { props.value = Number(value); update(); }, { type: 'number', min: '0' }), textControl(text('Maximum', '最大值'), props.max, value => { props.max = Number(value); update(); }, { type: 'number', min: '1' }), textControl(text('Accessible label', '无障碍标签'), props.label, value => { props.label = value; update(); }), choiceControl(text('Tone', '色调'), props.tone, ['accent', 'success', 'warning', 'danger', 'info', 'neutral'].map(value => ({ value, label: value })), value => { props.tone = value; update(); }), toggleControl(text('Show value', '显示数值'), true, value => { props.showValue = value; update(); }));
  page.states.append(statePreview(text('Empty', '空'), createProgressBar({ value: 0, showValue: true })), statePreview(text('In progress', '进行中'), createProgressBar({ value: 48, showValue: true })), statePreview(text('Complete', '完成'), createProgressBar({ value: 100, tone: 'success', showValue: true })), statePreview(text('Limit', '上限'), createProgressBar({ value: 94, tone: 'danger', showValue: true })));
  update();
}
