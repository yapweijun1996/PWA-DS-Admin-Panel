import { element, text, playground, textControl, toggleControl, choiceControl, statePreview, statusMessage, button, showToast, loadingIndicator, escapeHTML } from './playground.js';

export function render(container) {
  const page = playground(container, { title: text('Toast', '通知提示'), description: text('Non-blocking feedback with optional undo, manual dismissal, and a paused timeout while hovered or focused. Mock actions never write to a server.', '非阻塞反馈，支持撤销、手动关闭，并在悬停或聚焦时暂停计时。模拟操作不会写入服务器。') });
  const props = { message: text('Mock workspace changes saved.', '模拟工作区更改已保存。'), tone: 'accent', duration: '5000', action: true };
  const sample = element('div', { className: 'ds-toast-sample' });
  const feedback = statusMessage(text('Show a toast to try its dismiss and undo actions.', '显示通知以尝试关闭和撤销操作。'));
  const show = button(text('Show toast', '显示通知'), () => {
    showToast({ message: props.message, tone: props.tone, duration: Number(props.duration), actionLabel: props.action ? text('Undo', '撤销') : undefined, onAction: () => { feedback.textContent = text('Mock save undone. No server data changed.', '已撤销模拟保存。未更改服务器数据。'); } });
    feedback.textContent = Number(props.duration) ? text(`Toast shown for ${Number(props.duration) / 1000} seconds unless hovered or focused.`, `通知将显示 ${Number(props.duration) / 1000} 秒，悬停或聚焦可暂停。`) : text('Persistent toast shown. Dismiss it manually.', '已显示持续通知。请手动关闭。');
  }, 'primary');
  page.preview.append(element('div', { className: 'component-demo-stack' }, sample, show, feedback));
  function inlineToast(message, tone = 'neutral', extra = '', allowAction = false) {
    const toast = element('div', { className: `ds-toast ds-toast-${tone} ${extra}`, role: tone === 'danger' ? 'alert' : 'status' }, element('span', { className: 'ds-toast-dot', 'aria-hidden': 'true' }), element('span', { className: 'ds-toast-message' }, message));
    if (allowAction) toast.append(button(text('Undo', '撤销'), () => { toast.remove(); feedback.textContent = text('Mock save undone.', '模拟保存已撤销。'); }, 'ghost'));
    toast.append(button(text('Dismiss', '关闭'), () => { toast.remove(); feedback.textContent = text('Inline example dismissed. Change a prop to restore it.', '行内示例已关闭。更改属性可恢复。'); }, 'ghost', { 'aria-label': text('Dismiss notification', '关闭通知') }));
    return toast;
  }
  function update() {
    sample.replaceChildren(inlineToast(props.message, props.tone, '', props.action));
    page.setSnippet(`<div class="ds-toast-region" aria-label="${escapeHTML(text('Notifications', '通知'))}">\n  <div class="ds-toast ds-toast-${props.tone}" role="${props.tone === 'danger' ? 'alert' : 'status'}">\n    <span class="ds-toast-dot" aria-hidden="true"></span>\n    <span class="ds-toast-message">${escapeHTML(props.message)}</span>\n${props.action ? `    <button type="button" class="ds-button ds-button-ghost">${escapeHTML(text('Undo', '撤销'))}</button>\n` : ''}    <button type="button" class="ds-button ds-button-ghost" aria-label="${escapeHTML(text('Dismiss notification', '关闭通知'))}">${escapeHTML(text('Dismiss', '关闭'))}</button>\n  </div>\n</div>\n<!-- Dismiss after ${props.duration === '0' ? 'manual action' : `${Number(props.duration) / 1000} seconds`}; pause timeout during hover and focus. -->`);
  }
  page.controls.append(textControl(text('Message', '消息'), props.message, value => { props.message = value; update(); }), choiceControl(text('Tone', '色调'), props.tone, [{ value: 'neutral', label: text('Neutral', '中性') }, { value: 'accent', label: text('Success', '成功') }, { value: 'danger', label: text('Error', '错误') }], value => { props.tone = value; update(); }), choiceControl(text('Duration', '持续时间'), props.duration, [{ value: '3000', label: text('3 seconds', '3 秒') }, { value: '5000', label: text('5 seconds', '5 秒') }, { value: '0', label: text('Until dismissed', '直到手动关闭') }], value => { props.duration = value; update(); }), toggleControl(text('Undo action', '撤销操作'), true, value => { props.action = value; update(); }));
  page.states.append(statePreview(text('Default', '默认'), inlineToast(text('Mock changes saved.', '模拟更改已保存。'))), statePreview(text('Hover', '悬停'), inlineToast(text('Hover pauses dismissal.', '悬停可暂停关闭。'), 'accent', 'is-hover', true)), statePreview(text('Focus', '聚焦'), inlineToast(text('Focus pauses dismissal.', '聚焦可暂停关闭。'), 'neutral', 'is-focus', true)), statePreview(text('Error', '错误'), inlineToast(text('Mock request failed.', '模拟请求失败。'), 'danger')), statePreview(text('Loading', '加载中'), inlineToast(loadingIndicator(text('Saving mock changes…', '正在保存模拟更改…')))));
  update();
}
